// Comparable sales: REINZ CSV import, geocoding and the nearby sales map.
// Sales data imported from a CSV export (e.g. REINZ). Kept in this browser only, separate from properties.
var SKEY='nzpt.sales.v1',GKEY='nzpt.geo.v1',csvMsg='',nearOpen=false,nearR=1,nearBeds=false,nearList=[];
var RES=['Residence','Townhouse','Unit','Apartment','Home and Income','Conversion'];
function sales(){try{return JSON.parse(localStorage.getItem(SKEY))}catch(e){return null}}
function parseCSV(t){
  var rows=[],r=[],f='',q=false;
  for(var i=0;i<t.length;i++){var c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===','){r.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);rows.push(r);r=[];f=''}
    else f+=c}
  if(f||r.length){r.push(f);rows.push(r)}
  return rows;
}
function sdate(s){
  var M='jan feb mar apr may jun jul aug sep oct nov dec'.split(' '),m=/^(\d{1,2})-([a-z]{3})-(\d{2}|\d{4})$/i.exec(s);
  if(m){var mo=M.indexOf(m[2].toLowerCase());if(mo<0)return '';return iso(new Date(m[3].length===2?2000+ +m[3]:+m[3],mo,+m[1]))}
  m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);if(m)return iso(new Date(+m[3],m[2]-1,+m[1]));
  return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):'';
}
function tc(s){return s===s.toUpperCase()?s.toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase()}):s}
function parseSales(t,name){
  var rows=parseCSV(t.replace(/^﻿/,'')),h=(rows.shift()||[]).map(function(s){return s.trim().toLowerCase()});
  var I={},cols={n:'street number',st:'street',sub:'suburb',price:'sale price',date:'sale date',list:'list price',dts:'days to sell',cat:'sale category',cv:'valuation',beds:'bedrooms',floor:'floor area',land:'land area m2'};
  for(var k in cols)I[k]=h.indexOf(cols[k]);
  if(I.n<0||I.st<0||I.sub<0||I.price<0||I.date<0)throw new Error('That file is missing a Street Number, Street, Suburb, Sale Price or Sale Date column.');
  var out=[];
  rows.forEach(function(r){
    function g(k){return I[k]<0?'':(r[I[k]]||'').trim()}
    function n(k){var x=parseFloat(g(k));return isFinite(x)&&x>0?x:0}
    var no=g('n'),st=g('st'),date=sdate(g('date'));
    if(!no||!st||!n('price')||!date||/null|lot|[="]/i.test(no))return;
    no=no.replace(/^(\d+)\s+([a-z])$/i,'$1$2');
    out.push({no:no,st:tc(st),addr:no+' '+tc(st),sub:tc(g('sub')),price:n('price'),date:date,list:n('list'),dts:n('dts'),cat:g('cat'),cv:n('cv'),beds:n('beds'),floor:n('floor'),land:n('land')});
  });
  if(!out.length)throw new Error('No sales with an address, price and date were found in that file.');
  return {name:name,imported:iso(new Date()),rows:out};
}
function importCSV(file){
  var rd=new FileReader();
  rd.onload=function(){
    try{var S=parseSales(rd.result,file.name);localStorage.setItem(SKEY,JSON.stringify(S));csvMsg=''}
    catch(e){csvMsg=e.message||'Couldn’t save the sales data.'}
    current();
  };
  rd.readAsText(file);
}
function resRows(S){return S.rows.filter(function(s){return RES.indexOf(s.cat)>=0||!s.cat})}

// Map positions from Nominatim (OpenStreetMap), cached per address so each one is only looked up once.
// Nominatim allows at most 1 request a second, so lookups are paced and results fill in as they arrive.
var G={},geoBusy=false,geoFail={},geoDone=0,geoTotal=0;
try{G=JSON.parse(localStorage.getItem(GKEY))||{}}catch(e){}
function saveGeo(){try{localStorage.setItem(GKEY,JSON.stringify(G))}catch(e){}}
function normSt(s){return String(s||'').toLowerCase().replace(/\b(st)\b/g,'street').replace(/\b(rd)\b/g,'road').replace(/\b(ave?)\b/g,'avenue').replace(/\b(cres|cr)\b/g,'crescent').replace(/\b(pl)\b/g,'place').replace(/\b(dr)\b/g,'drive').replace(/\b(tce)\b/g,'terrace').replace(/[^a-z0-9āēīōū]/g,'')}
function normNo(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
// Exact house match → [lat,lon,1]; same street only → [lat,lon,0]; nothing → null. loose: fall back to the first NZ result.
function geocode(no,st,sub,loose){
  var ctl=new AbortController(),t=setTimeout(function(){ctl.abort()},10000);
  return fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=nz&q='+encodeURIComponent(no+' '+st+', '+sub),{signal:ctl.signal}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){
    var best=null,first=null;
    j.some(function(f){
      var a=f.address||{},c=[+f.lat,+f.lon];
      if(!first)first=[c[0],c[1],0];
      if(normSt(a.road)!==normSt(st))return false;
      if(normNo(a.house_number)===normNo(no)){best=[c[0],c[1],1];return true}
      if(!best)best=[c[0],c[1],0];return false;
    });
    return best||(loose?first:null);
  });
}
function subjKey(p){return 'subject|'+p.addr+'|'+p.sub}
function saleKey(s){return s.addr+'|'+s.sub}
function geoAll(jobs){
  geoBusy=true;geoDone=0;geoTotal=jobs.length;var i=0;
  (function next(tries){
    if(i>=jobs.length){geoBusy=false;saveGeo();drawNear();return}
    var j=jobs[i],t0=Date.now();
    geocode(j.no,j.st,j.sub,j.loose).then(function(r){G[j.k]=r;return true}).catch(function(){
      if(tries<2)return false;geoFail[j.k]=1;return true;   // gave up on this one for now; retried next visit
    }).then(function(ok){
      if(!ok){setTimeout(function(){next(tries+1)},5000);return}
      i++;geoDone=i;var b=$('geoprog');if(b)b.textContent=i+' of '+jobs.length;
      if(i%20===0||j.k.indexOf('subject|')===0){saveGeo();drawNear()}
      setTimeout(function(){next(0)},Math.max(0,1100-(Date.now()-t0)));
    });
  })(0);
}
function dist(a,b){var R=6371000,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)*Math.sin(dn/2);return 2*R*Math.asin(Math.sqrt(x))}
function distTxt(d,exact){return (exact?'':'≈ ')+(d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km')}
function saleNote(s){return [s.beds?s.beds+' bed':'',s.floor?s.floor+' m² floor':'',s.land?s.land+' m² land':'',s.cv?'CV '+$$(s.cv):''].filter(Boolean).join(' · ')}

function salesBlock(p){
  var S=sales(),file='<input type="file" accept=".csv,text/csv" class="csvin" hidden>';
  var h='<div class="near">'+(csvMsg?'<p class="sub neg">'+esc(csvMsg)+'</p>':'');
  if(!S)return h+'<p class="sub">Have a sales export, e.g. from REINZ? Import it to find nearby sales on a map.</p><label class="go filebtn">Import sales CSV'+file+'</label></div>';
  h+='<div class="row" style="cursor:default"><span class="sub">'+S.rows.length+' sales imported '+fmtD(S.imported)+'</span><span style="white-space:nowrap"><label class="edit filebtn">Replace'+file+'</label> <button class="edit del" id="salesdel">Remove</button></span></div>';
  if(!nearOpen)return h+'<button class="go" id="findnear">Find nearby sales</button></div>';
  h+='<label>Distance from '+esc(p.addr)+'</label><div class="seg" id="nr">'+[[0.5,'500 m'],[1,'1 km'],[2,'2 km'],[5,'5 km']].map(function(r){return '<button data-r="'+r[0]+'" class="'+(nearR===r[0]?'on':'')+'">'+r[1]+'</button>'}).join('')+'</div>';
  if(p.beds)h+='<label class="chk"><input type="checkbox" id="nearbeds"'+(nearBeds?' checked':'')+'>Similar bedrooms only ('+Math.max(1,p.beds-1)+'–'+(p.beds+1)+')</label>';
  return h+'<div id="nearbox"></div></div>';
}
function drawNear(){
  var p=props[cur],box=$('nearbox'),S=sales();if(!box||!p||!S)return;
  var rows=resRows(S),sk=subjKey(p),jobs=[];
  if(!(sk in G)&&!geoFail[sk])jobs.push({k:sk,no:(p.addr.match(/^\S+/)||[''])[0],st:p.addr.replace(/^\S+\s+/,''),sub:p.sub,loose:true});
  // Sales in the same suburb are looked up first so the most useful results appear early.
  var mine=normSt(p.sub.split(',')[0]),seen={};
  rows.slice().sort(function(a,b){return (normSt(b.sub)===mine)-(normSt(a.sub)===mine)}).forEach(function(s){var k=saleKey(s);if(!(k in G)&&!geoFail[k]&&!seen[k]){seen[k]=1;jobs.push({k:k,no:s.no,st:s.st,sub:s.sub})}});
  if(jobs.length&&!geoBusy)geoAll(jobs);
  var prog=geoBusy?'<p class="sub" style="margin-top:12px">Placing sales on the map: <span id="geoprog">'+geoDone+' of '+geoTotal+'</span>. Only needed the first time; results fill in as they’re found.</p>':'';
  var c=G[sk];
  if(!c){box.innerHTML=prog||'<p class="sub neg" style="margin-top:12px">Couldn’t find '+esc(p.addr)+', '+esc(p.sub)+' on the map. Check the address and suburb in Edit details.</p>';return}
  var lost=geoBusy?0:rows.filter(function(s){return !G[saleKey(s)]}).length;
  nearList=rows.map(function(s){var g=G[saleKey(s)];return g?Object.assign({d:dist(c,g),g:g},s):null}).filter(function(s){
    return s&&s.d<=nearR*1000&&!(nearBeds&&p.beds&&!(s.beds&&Math.abs(s.beds-p.beds)<=1));
  }).sort(function(a,b){return a.d-b.d});
  var n=nearList.length,shown=nearList.slice(0,25),have={};(p.comps||[]).forEach(function(x){have[x.addr+'|'+x.price]=1});
  var h=prog+'<div id="map" class="map"></div>';
  h+=n?'<p class="sub" style="margin-top:10px"><b>'+n+' sale'+(n>1?'s':'')+' within '+(nearR<1?nearR*1000+' m':nearR+' km')+'</b> · median '+$$(med(nearList.map(function(s){return s.price})))+(n>25?' · nearest 25 shown':'')+'</p>'
      :'<p class="sub" style="margin-top:10px">No sales within '+(nearR<1?nearR*1000+' m':nearR+' km')+'. Try a wider distance.</p>';
  h+=shown.map(function(s,i){
    var added=have[s.addr+'|'+s.price];
    return '<div class="comp"><div><b>'+esc(s.addr)+'</b><p class="sub">'+esc(s.sub)+' · Sold '+fmtD(s.date)+(s.dts?' · '+s.dts+' days':'')+'</p><p class="sub">'+esc(saleNote(s))+(s.cat&&s.cat!=='Residence'?' · '+esc(s.cat):'')+'</p></div><div class="cr"><b>'+$$(s.price)+'</b><span class="sub">'+distTxt(s.d,s.g[2])+'</span><button class="edit" data-a="'+i+'"'+(added?' disabled':'')+'>'+(added?'Added':'Add as comp')+'</button></div></div>';
  }).join('');
  if(lost)h+='<p class="sub" style="margin-top:8px">'+lost+' sale'+(lost>1?'s':'')+' couldn’t be placed on the map. ≈ means only the street was found.</p>';
  box.innerHTML=h;
  loadLeaflet(function(){
    var el=$('map');if(!el)return;
    var cs=getComputedStyle(document.documentElement),acc=cs.getPropertyValue('--acc').trim(),warn=cs.getPropertyValue('--warn').trim();
    var m=L.map(el,{scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(m);
    m.fitBounds(L.latLng(c[0],c[1]).toBounds(nearR*2000));
    L.circle([c[0],c[1]],{radius:nearR*1000,color:acc,weight:1,fillOpacity:.05}).addTo(m);
    nearList.forEach(function(s){L.circleMarker([s.g[0],s.g[1]],{radius:6,color:'#fff',weight:1.5,fillColor:acc,fillOpacity:.9}).addTo(m).bindPopup('<b>'+esc(s.addr)+'</b><br>'+$$(s.price)+' · '+fmtD(s.date)+'<br>'+esc(saleNote(s)))});
    L.circleMarker([c[0],c[1]],{radius:8,color:'#fff',weight:2,fillColor:warn,fillOpacity:1}).addTo(m).bindPopup('<b>'+esc(p.addr)+'</b><br>This property');
  });
}
// Leaflet is only loaded when a map is shown. If it can't load, the list still works.
var leafletCbs=null;
function loadLeaflet(cb){   // not "leaflet": Leaflet itself sets a global with that name
  if(window.L)return cb();
  if(leafletCbs){leafletCbs.push(cb);return}
  leafletCbs=[cb];
  var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l);
  var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  s.onload=function(){leafletCbs.forEach(function(f){f()});leafletCbs=[]};
  s.onerror=function(){leafletCbs=null;var el=$('map');if(el)el.remove()};
  document.head.appendChild(s);
}
