var CATS=['Demolition','Kitchen','Bathroom','Flooring','Painting','Electrical','Plumbing','Roofing','Landscaping','Consents & fees','Labour','Contingency','Other'];
function catList(b){return CATS.map(function(n,i){return {n:n,b:b[i]||0}})}
var SAMPLE=[
 {type:'project',addr:'24 Sample Road',sub:'Auckland',price:850000,legal:2800,extra:0,date:'2026-03-14',value:960000,budget:90000,spent:52000,loan:620000,rate:5.49,fixTerm:'12',fixStart:'2026-02-10',ltype:'pi',term:30,
  cats:catList([5000,24000,12000,8000,6000,9000,7000,0,3000,3500,3500,9000,0]),items:[
  {id:'s1',cat:'Demolition',desc:'Strip-out and skip bins',who:'Sample Demolition Ltd',date:'2026-04-22',quote:4500,amt:4800,paid:true,rc:[]},
  {id:'s2',cat:'Kitchen',desc:'Cabinetry, 50% deposit',who:'Sample Kitchens',date:'2026-06-03',quote:22000,amt:11000,paid:true,rc:[]},
  {id:'s3',cat:'Bathroom',desc:'Tiling and waterproofing',who:'Demo Tiling Co',date:'2026-08-19',quote:9500,amt:10400,paid:true,rc:[]},
  {id:'s4',cat:'Electrical',desc:'Rewire',who:'Example Electrical',date:'2026-09-02',quote:8200,amt:8200,paid:false,rc:[]},
  {id:'s5',cat:'Plumbing',desc:'Bathroom and kitchen rough-in',who:'Sample Plumbing',date:'2026-07-28',quote:6000,amt:6100,paid:true,rc:[]},
  {id:'s6',cat:'Consents & fees',desc:'Building consent',who:'Council',date:'2026-04-02',amt:2900,paid:true,rc:[]},
  {id:'s7',cat:'Painting',desc:'Paint and supplies',who:'Paint shop',date:'2026-10-10',amt:3200,paid:true,rc:[]},
  {id:'s8',cat:'Flooring',desc:'Carpet and vinyl, supply and lay',who:'Demo Flooring',quote:7800,amt:0,paid:false,rc:[]},
  {id:'s9',cat:'Contingency',desc:'Rotten subfloor repairs',who:'Sample Builders',date:'2026-05-15',amt:5400,paid:true,rc:[]}],
  start:'2026-03-20',target:'2026-12-18',target0:'2026-11-27',hold:3400,tasks:[
  {t:'Building consent issued',k:'Consent',d:'2026-04-10',ok:true},
  {t:'Strip-out',k:'Trade booked',d:'2026-04-20',who:'Sample Demolition Ltd',ok:true},
  {t:'Pre-line inspection',k:'Inspection',d:'2026-09-15',ok:true},
  {t:'Kitchen install',k:'Trade booked',d:'2026-10-20',who:'Sample Kitchens'},
  {t:'Flooring',k:'Trade booked',d:'2026-11-20',who:'Demo Flooring'},
  {t:'Final inspection and CCC',k:'Inspection',d:'2026-12-10'}]},
 {type:'rental',addr:'8 Demo Avenue',sub:'Hamilton',price:620000,legal:2500,extra:4200,date:'2025-08-02',value:655000,rent:640,exp:9800,loan:430000,rate:6.9,fixTerm:'18',fixStart:'2025-06-05',ltype:'io',term:30},
 {type:'project',addr:'3 Example Street',sub:'Tauranga',price:710000,legal:2600,extra:1500,date:'2026-06-20',value:745000,budget:60000,spent:66000},
 {type:'potential',intent:'flip',addr:'51 Prospect Lane',sub:'Hamilton East, Hamilton',price:640000,legal:2500,extra:1800,reno:75000,rates:3200,ins:2400,power:150,loan:512000,rate:5.9,ltype:'io',term:30,hold:3134,months:6,sell:24000,value:830000,comps:[
  {addr:'14 Sample Crescent',sub:'Hamilton East, Hamilton',price:815000,date:'2026-08-12',note:'3 bed, renovated'},
  {addr:'7 Demo Place',sub:'Hamilton East, Hamilton',price:790000,date:'2026-07-03',note:'3 bed, partly updated'},
  {addr:'22 Example Road',sub:'Claudelands, Hamilton',price:860000,date:'2026-09-21',note:'4 bed, renovated'}]}
];
var KEY='nzpt.v1',isSample=true;
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);isSample=false;return d.props||[]}}catch(e){}return JSON.parse(JSON.stringify(SAMPLE))}
function save(){isSample=false;try{localStorage.setItem(KEY,JSON.stringify({props:props}))}catch(e){}}
var props=load();
var cur=0,newType='project',newIntent='flip',newLoan='pi',editIdx=null,editSec='details',delIdx=null;
var $=function(id){return document.getElementById(id)};
var track=$('track');
var nz=new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:0});
var $$=function(n){return nz.format(n)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
// Number fields are text inputs so there are no spinner arrows and the scroll wheel can't change them.
// Money fields show "$" and commas as you type; pnum() strips them again.
var MONEY=' type="text" inputmode="decimal" class="money" autocomplete="off">',NUM=' type="text" inputmode="decimal" autocomplete="off">';
function pnum(s){return parseFloat(String(s==null?'':s).replace(/[^\d.\-]/g,''))||0}
function fmtMoney(v){
  v=String(v==null?'':v).replace(/[^\d.]/g,'');if(!v)return '';
  var i=v.indexOf('.'),w=(i<0?v:v.slice(0,i)).replace(/^0+(?=\d)/,''),d=i<0?'':'.'+v.slice(i+1).replace(/\./g,'').slice(0,2);
  return '$'+(w?(+w).toLocaleString('en-NZ'):'0')+d;
}
function stat(l,v,c){return '<div class="stat"><b class="'+(c||'')+'">'+v+'</b><span>'+l+'</span></div>'}

function days(d){return d?Math.max(0,Math.floor((Date.now()-new Date(d+'T00:00:00'))/864e5)):null}
function dOwn(p){var n=days(p.date);return n===null?'–':n}
function basis(p){return p.price+(p.legal||0)+(p.extra||0)+(p.spent||0)}
function pmt(l,r,y){var m=r/1200,n=y*12;return m?l*m/(1-Math.pow(1+m,-n)):l/n}
function iso(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function addMonths(d,m){var x=new Date(d+'T00:00:00'),day=x.getDate();x.setMonth(x.getMonth()+m);if(x.getDate()<day)x.setDate(0);return iso(x)}
function refixOf(p){if(p.fixTerm==='float')return null;if(!p.fixTerm||p.fixTerm==='custom')return p.refix||null;return addMonths(p.fixStart||iso(new Date()),+p.fixTerm)}
function fmtD(d){return new Date(d+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}
var FIXOPTS=[['6','6 months'],['12','1 year'],['18','18 months'],['24','2 years'],['36','3 years'],['48','4 years'],['60','5 years'],['float','Floating'],['custom','Custom date']].map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('');
function fixPreview(){
  var v=$('f_fix').value,c=v==='custom',f=v==='float';
  $('fixwrap').style.display=c||f?'none':'';
  $('customwrap').style.display=c?'':'none';
  var r=refixOf({fixTerm:v,fixStart:$('f_fixstart').value,refix:$('f_refix').value});
  $('fixout').textContent=f?'Floating rate: no re-fix date':r?'Re-fix due '+fmtD(r):'';
}
function readFix(p){p.fixTerm=$('f_fix').value;p.fixStart=$('f_fixstart').value;p.refix=p.fixTerm==='custom'?$('f_refix').value:''}
function loanCard(p){
  if(!p.loan)return '<div class="card row" style="cursor:default"><span class="sub">No mortgage added</span><button class="edit" id="editloan">Add mortgage</button></div>';
  var io=p.loan*p.rate/1200,pi=pmt(p.loan,p.rate,p.term||30),isIO=p.ltype==='io';
  var now=isIO?io:pi,alt=isIO?pi:io;
  var rf=refixOf(p),fl=p.fixTerm==='float';
  var d=rf?dd(iso(new Date()),rf):null;
  var when=fl?'Floating rate':d===null?'No re-fix date':(d<0?'Re-fix date passed':'Re-fix in '+d+' days');
  var dt=fl?'Can change anytime':rf?new Date(rf+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}):'–';
  return '<div class="card"><div class="row" style="cursor:default"><b>Mortgage</b><button class="edit" id="editloan">Edit mortgage</button></div><p class="sub">'+$$(p.loan)+' at '+p.rate+'% · '+(isIO?'Interest-only':'Principal &amp; interest')+'</p>'+
   '<div class="grid">'+stat('Repayment / month now',$$(now))+stat(isIO?'If P&amp;I instead':'If interest-only',$$(alt))+stat(when,dt,d!==null&&d>=0&&d<=90?'neg':'')+stat(isIO?'Extra cash needed for P&amp;I':'Cash freed by interest-only',$$(Math.abs(pi-io)))+'</div>'+
   '<p class="sub" style="margin-top:10px">Interest-only frees up cash each month, but the loan isn’t paid down. The difference is mostly principal, not interest saved. Based on a '+(p.term||30)+'-year term.</p></div>';
}
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

// Itemised reno costs. Each cost has an optional quote for the whole job and the amount invoiced so far, both incl. GST.
// Once anything is itemised, p.spent is kept as the total invoiced so the rest of the app reads it as before.
var costOpen=null,itemEdit=null,delItem=false,catDraft=null,pendRc=[],dropRc=[],rcMsg='';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function sum(a,f){return a.reduce(function(t,x){return t+(+f(x)||0)},0)}
function cmt(x){return Math.max(x.amt||0,x.quote||0)}
function cats(p){return p.cats||(p.cats=catList([]))}
function syncSpent(p){if(p.items&&p.items.length)p.spent=sum(p.items,function(x){return x.amt})}
function rcIds(p){return (p.items||[]).reduce(function(a,x){return a.concat((x.rc||[]).map(function(r){return r.id}))},[])}
function costCard(p){
  var it=p.items||[],C=cats(p),busy=itemEdit!==null||catDraft;
  var h='<div class="card" id="costs"><div class="row" style="cursor:default"><b>Reno costs</b>'+(it.length&&!busy?'<button class="edit" data-x="csv">Export CSV</button>':'')+'</div>';
  if(itemEdit!==null)return h+itemForm(p)+'</div>';
  if(catDraft)return h+catForm(p)+'</div>';
  if(it.length){
    var cm=sum(it,cmt),unpaid=sum(it,function(x){return x.paid?0:x.amt}),ov=sum(it,function(x){return x.quote&&x.amt>x.quote?x.amt-x.quote:0});
    h+='<div class="grid">'+stat('Spent (invoiced)',$$(p.spent))+stat('Committed incl. quotes',$$(cm),p.budget&&cm>p.budget?'neg':'')+stat('Unpaid invoices',$$(unpaid),unpaid?'neg':'')+stat('Over quotes',$$(ov),ov?'neg':'')+'</div>';
  }else h+='<p class="sub" style="margin-top:6px">Itemise what you spend to see which parts of the reno are on track, and attach receipt photos to each cost.'+(p.spent?' Your '+$$(p.spent)+' spent so far becomes one cost under Other, which you can split up later.':'')+'</p>';
  var shown=C.map(function(c,i){return {c:c,i:i,xs:it.map(function(x,j){return {x:x,j:j}}).filter(function(o){return o.x.cat===c.n})}}).filter(function(o){return o.c.b||o.xs.length});
  if(shown.length)h+='<div class="cats">'+shown.map(function(o){
    var s=sum(o.xs,function(y){return y.x.amt}),m=sum(o.xs,function(y){return cmt(y.x)}),b=o.c.b,open=costOpen===o.c.n,over=b&&m>b;
    var note=[m>s?$$(m)+' committed incl. quotes':'',over?$$(m-b)+' over budget':''].filter(Boolean).join(' · ');
    return '<div class="catrow" data-x="cat" data-k="'+o.i+'"><div class="top"><b>'+(open?'▾ ':'▸ ')+esc(o.c.n)+'</b><span class="'+(over?'neg':'')+'">'+$$(s)+(b?' of '+$$(b):' · no budget')+'</span></div>'+
      (b?'<div class="bar"><i class="'+(over?'over':'')+'" style="width:'+Math.min(100,Math.round(s/b*100))+'%"></i></div>':'')+(note?'<p class="sub'+(over?' neg':'')+'">'+note+'</p>':'')+'</div>'+
      (open?'<div class="items">'+(o.xs.length?o.xs.map(function(y){return itemRow(y.x,y.j)}).join(''):'<p class="sub" style="padding:8px 0">Nothing spent here yet.</p>')+'<button class="edit" data-x="add" style="margin:8px 0">+ Add cost to '+esc(o.c.n)+'</button></div>':'');
  }).join('')+'</div>';
  var al=sum(C,function(c){return c.b}),cg=C.filter(function(c){return c.n==='Contingency'})[0];
  if(cg&&cg.b){var cu=sum(it,function(x){return x.cat==='Contingency'?cmt(x):0});h+='<p class="sub" style="margin-top:12px">Contingency used: <b class="'+(cu>cg.b?'neg':'')+'">'+$$(cu)+' of '+$$(cg.b)+'</b> ('+Math.round(cu/cg.b*100)+'%)</p>'}
  if(p.budget&&al&&al!==p.budget)h+='<p class="sub" style="margin-top:6px">'+(al<p.budget?$$(p.budget-al)+' of your '+$$(p.budget)+' budget isn’t allocated to a category yet.':'Category budgets add up to '+$$(al)+', more than your '+$$(p.budget)+' total budget.')+'</p>';
  return h+'<div class="btns"><button class="go" data-x="add">Add cost</button><button class="go ghost" data-x="cats">Category budgets</button></div><p class="sub" style="margin-top:10px">Amounts include GST.</p></div>';
}
function itemRow(x,j){
  var st=x.amt?(x.paid?'Paid':'Unpaid'):'Quote only',n=(x.rc||[]).length;
  return '<div class="item" data-x="item" data-k="'+j+'"><div><b>'+esc(x.desc)+'</b><p class="sub">'+[esc(x.who||''),x.date?fmtD(x.date):'',st==='Unpaid'?'<span class="neg">Unpaid</span>':st,n?n+' receipt'+(n>1?'s':''):''].filter(Boolean).join(' · ')+'</p></div>'+
   '<div class="cr"><b>'+$$(x.amt||0)+'</b>'+(x.quote?'<span class="sub'+(x.amt>x.quote?' neg':'')+'">of '+$$(x.quote)+' quote</span>':'')+'</div></div>';
}
function itemForm(p){
  var x=itemEdit==='new'?{cat:costOpen||'Other',paid:true}:p.items[itemEdit],N=MONEY;
  var rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  return '<p class="grp" style="margin:14px 0 0">'+(itemEdit==='new'?'Add a cost':'Edit cost')+'</p>'+
   '<label>Category</label><select id="i_cat">'+cats(p).map(function(c){return '<option'+(c.n===x.cat?' selected':'')+'>'+esc(c.n)+'</option>'}).join('')+'</select>'+
   '<label>Description</label><input id="i_desc" placeholder="e.g. Kitchen benchtop">'+
   '<label>Supplier / tradie</label><input id="i_who">'+
   '<label>Date</label><input id="i_date" type="date">'+
   '<div class="grid" style="margin-top:0"><div><label>Quote for the job</label><input id="i_quote"'+N+'</div><div><label>Invoiced so far</label><input id="i_amt"'+N+'</div></div>'+
   '<label class="chk"><input type="checkbox" id="i_paid"'+(x.paid?' checked':'')+'>Paid</label>'+
   '<label>Receipts and invoices</label>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
   '<div class="rcs">'+rc.map(rcThumb).join('')+'<label class="rcadd">+ Photo or PDF<input type="file" class="rcin" accept="image/*,application/pdf" multiple hidden></label></div>'+
   '<div class="btns"><button class="go" data-x="isave">'+(itemEdit==='new'?'Add cost':'Save')+'</button><button class="go ghost" data-x="icancel">Cancel</button></div>'+
   (itemEdit==='new'?'':'<button class="edit del" data-x="idel" style="margin-top:12px">'+(delItem?'Tap to confirm delete':'Delete this cost')+'</button>');
}
function saveItem(p){
  var d=$('i_desc').value.trim();if(!d){$('i_desc').focus();return}
  if(!p.items||!p.items.length){p.items=[];if(p.spent)p.items.push({id:uid(),cat:'Other',desc:'Spent before itemising',amt:p.spent,paid:true,rc:[]})}
  var x=itemEdit==='new'?{id:uid()}:p.items[itemEdit];
  x.cat=$('i_cat').value;x.desc=d;x.who=$('i_who').value.trim();x.date=$('i_date').value;x.quote=num('i_quote');x.amt=num('i_amt');x.paid=$('i_paid').checked;
  x.rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  rcDel(dropRc);
  if(itemEdit==='new')p.items.push(x);
  syncSpent(p);pendRc=[];dropRc=[];itemEdit=null;costOpen=x.cat;isSample=false;render();
}
function closeItem(){rcDel(pendRc.map(function(r){return r.id}));pendRc=[];dropRc=[];itemEdit=null;delItem=false;rcMsg=''}
function catForm(p){
  var used={};(p.items||[]).forEach(function(x){used[x.cat]=1});
  return '<p class="grp" style="margin:14px 0 0">Category budgets</p>'+catDraft.map(function(c,i){
    return '<div class="cb"><span>'+esc(c.n)+'</span><input id="cb_'+i+'" type="text" inputmode="decimal" class="money" autocomplete="off" placeholder="$0" value="'+fmtMoney(c.b||'')+'">'+(used[c.n]?'<span></span>':'<button class="edit del" data-x="catrm" data-k="'+i+'" aria-label="Remove '+esc(c.n)+'">×</button>')+'</div>';
  }).join('')+
  '<div class="cbnew"><input id="cb_new" placeholder="New category, e.g. Deck"><button class="edit" data-x="catadd">Add</button></div>'+
  '<p class="sub" id="cbtot" style="margin-top:10px"></p>'+
  '<div class="btns"><button class="go" data-x="catsave">Save budgets</button><button class="go ghost" data-x="catcancel">Cancel</button></div>';
}
function readDraft(){catDraft.forEach(function(c,i){var e=$('cb_'+i);if(e)c.b=pnum(e.value)})}
function cbTot(p){var e=$('cbtot');if(!e)return;readDraft();var t=sum(catDraft,function(c){return c.b});e.textContent='Allocated '+$$(t)+(p.budget?' of your '+$$(p.budget)+' reno budget'+(t>p.budget?', which is over':''):'');e.className='sub'+(p.budget&&t>p.budget?' neg':'')}
function csvCell(v){v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function download(name,data,type){var a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type:type}));a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'property'}
function exportCosts(p){
  var rows=[['Date','Category','Description','Supplier / tradie','Quote incl GST','Invoiced incl GST','Paid','Receipt files']].concat((p.items||[]).map(function(x){
    return [x.date||'',x.cat,x.desc,x.who||'',x.quote||'',x.amt||'',x.paid?'Yes':'No',(x.rc||[]).map(function(r){return r.name}).join('; ')]}));
  download(slug(p.addr)+'-reno-costs.csv','﻿'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),'text/csv');
}

// Receipt files live in IndexedDB (localStorage is too small for photos). Items only hold {id,name,type}.
var idb=null,RCU={};
function db(){return idb||(idb=new Promise(function(ok,no){var r=indexedDB.open('nzpt',1);r.onupgradeneeded=function(){r.result.createObjectStore('rc',{keyPath:'id'})};r.onsuccess=function(){ok(r.result)};r.onerror=function(){idb=null;no(r.error)}}))}
function rcTx(mode,fn){return db().then(function(d){return new Promise(function(ok,no){var t=d.transaction('rc',mode),q=fn(t.objectStore('rc'));t.oncomplete=function(){ok(q&&q.result)};t.onerror=function(){no(t.error)}})})}
function rcPut(r){return rcTx('readwrite',function(s){s.put(r)})}
function rcDel(ids){ids.forEach(function(id){if(RCU[id]){URL.revokeObjectURL(RCU[id]);delete RCU[id]}});return ids.length?rcTx('readwrite',function(s){ids.forEach(function(id){s.delete(id)})}).catch(function(){}):Promise.resolve()}
function rcUrl(id){return RCU[id]?Promise.resolve(RCU[id]):rcTx('readonly',function(s){return s.get(id)}).then(function(r){return r?(RCU[id]=URL.createObjectURL(r.blob)):''})}
// Photos are scaled to 1600px and saved as JPEG, which keeps a phone photo to a few hundred KB.
function shrink(f){
  if(!/^image\/(jpeg|png|webp)$/.test(f.type))return Promise.resolve(f);
  return new Promise(function(ok){
    var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){var k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(function(b){ok(b&&b.size<f.size?b:f)},'image/jpeg',.82)};
    im.onerror=function(){URL.revokeObjectURL(u);ok(f)};im.src=u;
  });
}
function addReceipts(files){
  rcMsg='';
  Promise.all([].slice.call(files).map(function(f){
    return shrink(f).then(function(b){var r={id:uid(),name:f.name,type:b.type||f.type,added:iso(new Date())};return rcPut(Object.assign({blob:b},r)).then(function(){return r})});
  })).then(function(l){pendRc=pendRc.concat(l)}).catch(function(){rcMsg='Couldn’t save that file in this browser. Private browsing can block it.'}).then(function(){if(itemEdit!==null)keepIn('costs')});
}
function rcThumb(r){
  var img=/^image\//.test(r.type);
  return '<div class="rc"><button class="th" data-x="rcopen" data-id="'+esc(r.id)+'" title="'+esc(r.name)+'">'+(img?'<img data-rc="'+esc(r.id)+'" alt="'+esc(r.name)+'">':/pdf/.test(r.type)?'PDF':'File')+'</button><button class="x" data-x="rcdrop" data-id="'+esc(r.id)+'" aria-label="Remove receipt">×</button></div>';
}
function fillThumbs(){document.querySelectorAll('img[data-rc]').forEach(function(im){im.onerror=function(){im.replaceWith('Photo')};rcUrl(im.dataset.rc).then(function(u){if(u)im.src=u})})}
function openRc(id){if(RCU[id]){window.open(RCU[id]);return}var w=window.open('');rcUrl(id).then(function(u){if(w&&u)w.location=u})}

// Reno timeline: start, target finish, milestones, and what delays cost in holding.
// The first target finish set is kept as the baseline (target0), so a target that moves out shows up in dollars.
var KINDS=['Trade booked','Consent','Inspection','Delivery','Other'],tlEdit=false,tlAdd=false;
function dd(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5)}
function timeCard(p){
  var today=iso(new Date()),wk=(p.hold||0)*12/52,T=p.tasks||[];
  var h='<div class="card" id="tl"><div class="row" style="cursor:default"><b>Reno timeline</b>'+(tlEdit?'':'<button class="edit" data-x="tledit">'+(p.target?'Edit dates':'Set dates')+'</button>')+'</div>';
  if(tlEdit)return h+'<label>Reno start</label><input id="t_start" type="date"><label>Target finish</label><input id="t_target" type="date">'+
    (p.target0&&p.target0!==p.target?'<label class="chk"><input type="checkbox" id="t_rebase">Make this the new baseline (original target '+fmtD(p.target0)+')</label>':'')+
    '<label>Holding costs per month (interest, rates, insurance, power)</label><input id="t_hold"'+MONEY+
    (p.loan?'<p class="sub" style="margin-top:6px">Mortgage interest alone is about '+$$(p.loan*p.rate/1200)+' a month.</p>':'')+
    '<p class="sub" style="margin-top:8px">The first target finish you set is kept as the baseline, so if it moves out you can see what the delay costs.</p>'+
    '<div class="btns"><button class="go" data-x="tlsave">Save</button><button class="go ghost" data-x="tlcancel">Cancel</button></div></div>';
  if(p.start&&p.target){
    var tot=Math.max(1,dd(p.start,p.target)),el=Math.max(0,dd(p.start,p.done||today)),left=dd(today,p.target),late=!p.done&&left<0,lateDone=p.done&&dd(p.target,p.done)>0;
    var slip=p.target0?dd(p.target0,p.done||(late?today:p.target)):0;
    h+='<div class="bar"><i class="'+(late||lateDone?'over':'')+'" style="width:'+Math.min(100,Math.round(el/tot*100))+'%"></i></div><span class="sub">'+
      (p.done?'Finished '+fmtD(p.done)+(lateDone?', '+dd(p.target,p.done)+' days after target':''):dd(today,p.start)>0?'Starts '+fmtD(p.start)+' · '+Math.ceil(tot/7)+' weeks planned':'Week '+(Math.floor(el/7)+1)+' of '+Math.ceil(tot/7)+' · '+(late?-left+' days past target':left+' days to target finish'))+'</span>';
    h+='<div class="grid">'+stat('Target finish',fmtD(p.target),late?'neg':'')+stat('Holding cost / week',p.hold?$$(wk):'Not set')+
      (slip>0?stat('Behind original target',slip+' days','neg')+stat('Extra holding from delays',p.hold?$$(slip*wk/7):'–','neg'):'')+'</div>';
    if(late&&p.hold)h+='<p class="sub neg" style="margin-top:8px">Every extra week costs about '+$$(wk)+' in holding.</p>';
    if(!p.hold)h+='<p class="sub" style="margin-top:8px">Add a holding cost per month in Edit dates to see what delays cost.</p>';
  }else h+='<p class="sub" style="margin-top:6px">Set a start and target finish date to track progress, and a holding cost to see what delays cost.</p>';
  if(T.length)h+='<p class="grp" style="margin:16px 0 0">Milestones</p>'+T.map(function(x,i){return i}).sort(function(a,b){return (T[a].d||'9999').localeCompare(T[b].d||'9999')}).map(function(i){
    var x=T[i],od=!x.ok&&x.d&&x.d<today;
    return '<div class="task'+(x.ok?' ok':'')+'"><input type="checkbox" data-x="tk" data-k="'+i+'"'+(x.ok?' checked':'')+' aria-label="Done"><div><b>'+esc(x.t)+'</b><p class="sub'+(od?' neg':'')+'">'+[esc(x.k||''),x.d?fmtD(x.d):'',esc(x.who||''),od?'Overdue':''].filter(Boolean).join(' · ')+'</p></div><button class="edit del" data-x="tkdel" data-k="'+i+'" aria-label="Delete milestone">×</button></div>';
  }).join('');
  if(tlAdd)return h+'<p class="grp" style="margin:16px 0 0">Add a milestone</p><label>Milestone</label><input id="k_t" placeholder="e.g. Plumber booked, final inspection">'+
    '<div class="grid" style="margin-top:0"><div><label>Type</label><select id="k_k">'+KINDS.map(function(k){return '<option>'+k+'</option>'}).join('')+'</select></div><div><label>Date</label><input id="k_d" type="date"></div></div>'+
    '<label>Who (optional)</label><input id="k_who"><div class="btns"><button class="go" data-x="tkadd">Add milestone</button><button class="go ghost" data-x="tkcancel">Cancel</button></div></div>';
  return h+'<div class="btns"><button class="go" data-x="tknew">Add milestone</button>'+(p.start&&p.target?'<button class="go ghost" data-x="tldone">'+(p.done?'Not finished yet':'Mark reno finished')+'</button>':'')+'</div></div>';
}

// Plan vs actual for a project converted from a potential buy. p.plan keeps the original estimates.
function planCard(p){
  var q=p.plan,flip=q.intent!=='rental',it=p.items||[],cm=it.length?sum(it,cmt):(p.spent||0),mo=(days(p.date)||0)/30.44;
  var R=[['Purchase price',q.price||0,p.price],['Legal &amp; purchase costs',(q.legal||0)+(q.extra||0),(p.legal||0)+(p.extra||0)],['Reno (committed so far)',q.reno||0,cm],['Holding ('+mo.toFixed(1)+' of '+(q.months||0)+' months)',(q.hold||0)*(q.months||0),(p.hold||0)*mo]];
  var planCost=sum(R,function(r){return r[1]}),nowCost=(p.price||0)+(p.legal||0)+(p.extra||0)+Math.max(cm,p.budget||0)+(p.hold||0)*Math.max(q.months||0,mo),sell=q.sell||0;
  var h='<div class="card"><b>Plan vs actual</b><p class="sub">Your estimates from when this was a potential buy ('+(flip?'reno to sell':'buy to rent')+').</p>'+
    '<div class="vs"><div class="hd"><span></span><span>Plan</span><span>Actual</span></div>'+R.map(function(r){return '<div><span>'+r[0]+'</span><span>'+$$(r[1])+'</span><span class="'+(r[2]>r[1]?'neg':'')+'">'+$$(r[2])+'</span></div>'}).join('')+'</div>';
  h+='<div class="grid">'+stat('Total cost (plan)',$$(planCost))+stat('Total cost (projected now)',$$(nowCost),nowCost>planCost?'neg':'')+(flip
    ?stat('Profit at plan',$$(q.value-planCost-sell),q.value-planCost-sell<0?'neg':'pos')+stat('Profit now, same sale price',$$(q.value-nowCost-sell),q.value-nowCost-sell<0?'neg':'pos')
    :stat('Equity after reno (plan)',$$(q.value-planCost),q.value<planCost?'neg':'pos')+stat('Equity after reno (now)',$$(q.value-nowCost),q.value<nowCost?'neg':'pos'))+'</div>';
  return h+'<p class="sub" style="margin-top:10px">Projected now uses your reno budget or costs committed, whichever is higher, and holding for the planned months or the months held so far, whichever is longer. '+
    (flip?'Sale price '+$$(q.value)+' and selling costs '+$$(sell)+' are from your plan. Profit is before tax: check current IRD guidance. ':'Value after reno '+$$(q.value)+' is from your plan. ')+'Estimates only.</p></div>';
}
var convOpen=false;
function convBlock(){
  if(!convOpen)return '<button class="go ghost" data-x="conv">Bought it? Track it as a reno project</button>';
  var N=MONEY;
  return '<div class="near"><b>Track as a reno project</b><p class="sub" style="margin-top:4px">Enter what it actually cost. Your estimates are kept so you can compare plan vs actual as the reno goes.</p>'+
   '<div class="grid" style="margin-top:0"><div><label>Purchase price</label><input id="v_price"'+N+'</div><div><label>Purchase date</label><input id="v_date" type="date"></div>'+
   '<div><label>Reno budget</label><input id="v_budget"'+N+'</div><div><label>Value now (before reno)</label><input id="v_value" placeholder="Purchase price"'+N+'</div></div>'+
   '<label>Legal fees and other purchase costs</label><input id="v_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'+
   '<div class="btns"><button class="go" data-x="convok">Convert</button><button class="go ghost" data-x="convno">Cancel</button></div></div>';
}
function convert(i){
  var p=props[i],d=$('v_date').value||iso(new Date());
  var n={type:'project',addr:p.addr,sub:p.sub,price:num('v_price'),date:d,legal:num('v_legal'),extra:0,value:num('v_value')||num('v_price'),budget:num('v_budget'),spent:0,hold:p.hold||0,start:d,
    plan:{intent:p.intent||'flip',price:p.price,legal:p.legal,extra:p.extra,reno:p.reno,hold:p.hold,months:p.months,sell:p.sell,value:p.value,rent:p.rent,exp:p.exp,converted:iso(new Date())}};
  ['beds','land','comps'].forEach(function(k){if(p[k])n[k]=p[k]});
  if(p.loan){n.loan=p.loan;n.rate=p.rate;n.ltype=p.ltype||'pi';n.term=p.term||30}   // the estimated loan becomes the project's mortgage, to edit once it's fixed
  props[i]=n;convOpen=false;nearOpen=false;isSample=false;render();
}

// Backup: one JSON file with every property and the receipt files they use. Imported sales data is licensed, so it's left out.
var BKEY='nzpt.backup',bkPend=null,bkMsg='';
function lastBackup(){try{return localStorage.getItem(BKEY)}catch(e){return null}}
function backupCard(){
  var l=lastBackup(),h='<div class="card" id="bk"><b>Backup</b><p class="sub" style="margin-top:4px">Your properties and receipts are saved only in this browser. Download a backup now and then and keep it somewhere safe, like cloud storage or an email to yourself. Imported sales data isn’t included.</p>'+
    '<p class="sub" style="margin-top:6px"><b>'+(l?'Last backup '+fmtD(l):'Not backed up yet')+'</b></p>'+(bkMsg?'<p class="sub neg" style="margin-top:6px">'+esc(bkMsg)+'</p>':'');
  if(bkPend){var n=bkPend.props.length,r=bkPend.receipts.length;return h+'<p style="margin:12px 0 0;font-size:14px">Backup from '+(bkPend.exported?fmtD(bkPend.exported):'an unknown date')+': '+n+' propert'+(n===1?'y':'ies')+', '+r+' receipt'+(r===1?'':'s')+'. Restoring replaces everything on this device.</p><div class="btns"><button class="go" data-x="bkok">Replace with backup</button><button class="go ghost" data-x="bkno">Cancel</button></div></div>'}
  return h+'<div class="btns"><button class="go" data-x="bkdl">Download backup</button><label class="go ghost filebtn">Restore<input type="file" accept=".json,application/json" class="bkin" hidden></label></div></div>';
}
function b2d(b){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(b)})}
function d2b(u){var m=/^data:([^;,]*)(;base64)?,(.*)$/.exec(u||''),s=atob(m[3]),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new Blob([a],{type:m[1]})}
function exportBackup(){
  var want={};props.forEach(function(p){rcIds(p).forEach(function(id){want[id]=1})});
  rcTx('readonly',function(s){return s.getAll()}).catch(function(){return []}).then(function(all){
    return Promise.all((all||[]).filter(function(r){return want[r.id]}).map(function(r){return b2d(r.blob).then(function(u){return {id:r.id,name:r.name,type:r.type,added:r.added,data:u}})}));
  }).then(function(rc){
    var t=iso(new Date());
    download('nz-property-tracker-backup-'+t+'.json',JSON.stringify({app:'nzpt',v:1,exported:t,props:props,receipts:rc}),'application/json');
    try{localStorage.setItem(BKEY,t)}catch(e){}bkMsg='';list();banner();
  }).catch(function(){bkMsg='Couldn’t make the backup file.';list()});
}
function readBackup(f){
  var rd=new FileReader();
  rd.onload=function(){bkMsg='';try{var d=JSON.parse(rd.result);if(d.app!=='nzpt'||!Array.isArray(d.props))throw 0;d.receipts=d.receipts||[];bkPend=d}catch(e){bkMsg='That file isn’t an NZ Property Tracker backup.'}list()};
  rd.readAsText(f);
}
function restore(){
  var d=bkPend,recs=[];
  d.receipts.forEach(function(r){try{recs.push({id:r.id,name:r.name,type:r.type,added:r.added,blob:d2b(r.data)})}catch(e){}});
  rcTx('readwrite',function(s){s.clear();recs.forEach(function(r){s.put(r)})}).catch(function(){bkMsg='Receipts couldn’t be restored in this browser.'}).then(function(){
    for(var k in RCU)URL.revokeObjectURL(RCU[k]);RCU={};
    props=d.props;cur=0;bkPend=null;resetCur();isSample=false;save();render();go(1,true);
  });
}
function resetCur(){closeItem();sec='ov';catDraft=null;costOpen=null;tlEdit=false;tlAdd=false;convOpen=false}
function setv(m){for(var k in m){var e=$(k);if(e&&m[k])e.value=e.classList.contains('money')?fmtMoney(m[k]):m[k]}}
function fillCur(p){
  if(itemEdit!==null&&itemEdit!=='new'){var x=p.items[itemEdit];setv({i_desc:x.desc,i_who:x.who,i_date:x.date,i_quote:x.quote,i_amt:x.amt})}
  if(tlEdit)setv({t_start:p.start||p.date,t_target:p.target,t_hold:p.hold});
  if(convOpen)setv({v_price:p.price,v_date:iso(new Date()),v_legal:(p.legal||0)+(p.extra||0),v_budget:p.reno});
  if(catDraft)cbTot(p);
  fillThumbs();
}
// Re-render the current pane without losing what's been typed in one card.
function keepIn(id){var v={};document.querySelectorAll('#'+id+' input[id],#'+id+' select[id]').forEach(function(e){v[e.id]=e.type==='checkbox'?e.checked:e.value});current();for(var k in v){var e=$(k);if(e){if(e.type==='checkbox')e.checked=v[k];else e.value=v[k]}}}

function fill(p){
  var m={f_addr:p.addr,f_sub:p.sub,f_price:p.price,f_date:p.date,f_legal:p.type!=='rental'?(p.legal||0)+(p.extra||0):p.legal,f_extra:p.extra,f_value:p.value,f_budget:p.budget,f_spent:p.spent,f_rent:p.rent,f_exp:p.exp,f_reno:p.reno,f_rates:p.rates,f_ins:p.ins,f_power:p.power,f_oth:p.oth!==undefined?p.oth:p.hold,f_beds:p.beds,f_land:p.land,f_months:p.months,f_sell:p.sell,f_loan:p.loan,f_rate:p.rate,f_refix:p.refix,f_fixstart:p.fixStart,f_term:p.term};
  for(var k in m){var e=$(k);if(e&&m[k]!==undefined&&m[k]!==null&&m[k]!==0)e.value=e.classList.contains('money')?fmtMoney(m[k]):m[k]}
}
function current(){
  var p=props[cur];
  if(!p){$('p1').innerHTML='<div class="card"><p class="sub">No properties yet. Swipe right to add one.</p></div>';return}
  if(p.type==='potential'){$('p1').innerHTML=potView(p)+'<p class="hint">← all properties · add new →</p>';fillCur(p);if(nearOpen)drawNear();return}
  var h='<div class="card"><div class="row" style="cursor:default"><span class="badge">'+(p.type==='project'?'Renovation project':'Rental')+'</span><button class="edit" id="edit">Edit details</button></div><h1>'+esc(p.addr)+'</h1><p class="sub">'+esc(p.sub)+'</p>';
  if(p.type==='project'){
    // Projects are split into sections so the page stays short on a phone. A dot marks a section with something to deal with.
    var flag={};alerts(p).forEach(function(a){flag[a.sec]=1});
    var nav='<div class="secnav">'+SECS.map(function(s){return '<button data-x="sec" data-sec="'+s[0]+'" class="'+(sec===s[0]?'on':'')+(flag[s[0]]?' dot':'')+'">'+s[1]+'</button>'}).join('')+'</div>';
    if(sec!=='ov'){$('p1').innerHTML=h+'</div>'+nav+(sec==='costs'?costCard(p):sec==='tl'?timeCard(p):loanCard(p))+'<p class="hint">← all properties · add new →</p>';fillCur(p);return}
    h+='</div>'+nav+'<div class="card">';
    var pct=p.budget?Math.round(p.spent/p.budget*100):0,gain=p.value-basis(p),left=p.budget-p.spent;
    h+='<div><b>Reno budget</b><div class="bar"><i class="'+(pct>100?'over':'')+'" style="width:'+Math.min(pct,100)+'%"></i></div><span class="sub">'+$$(p.spent)+' of '+$$(p.budget)+' spent ('+pct+'%)'+(p.items&&p.items.length?' · '+$$(sum(p.items,cmt))+' committed incl. quotes':'')+'</span></div>';
    h+='<div class="grid">'+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Budget remaining',$$(left),left<0?'neg':'')+stat('Equity gain after reno',$$(gain),gain<0?'neg':'pos')+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
  }else{
    var ann=p.rent*52,net=ann-p.exp;
    h+='<div class="grid">'+stat('Weekly rent',$$(p.rent))+stat('Annual expenses',$$(p.exp))+stat('Net annual income',$$(net),net<0?'neg':'pos')+stat('Gross / net yield',(ann/p.value*100).toFixed(1)+'% / '+(net/p.value*100).toFixed(1)+'%')+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
  }
  $('p1').innerHTML=h+'</div>'+(p.plan?planCard(p):'')+(p.type==='project'?'':loanCard(p))+'<p class="hint">← all properties · add new →</p>';
  fillCur(p);
}
var SECS=[['ov','Overview'],['costs','Costs'],['tl','Timeline'],['loan','Mortgage']],sec='ov';

// Things that need attention, each pointing at the project section that deals with it.
function alerts(p){
  var a=[],today=iso(new Date());
  if(p.type==='potential')return a;
  if(p.loan&&p.fixTerm!=='float'){var rf=refixOf(p);if(rf){var d=dd(today,rf);if(d<=90)a.push({t:d<0?'Re-fix date passed':'Re-fix in '+d+' day'+(d===1?'':'s'),sec:'loan'})}}
  if(p.type==='project'){
    var it=p.items||[],cm=it.length?sum(it,cmt):(p.spent||0),un=sum(it,function(x){return x.paid?0:x.amt});
    if(p.budget&&cm>p.budget)a.push({t:'Over budget by '+$$(cm-p.budget),sec:'costs'});
    if(un)a.push({t:$$(un)+' unpaid',sec:'costs'});
    if(!p.done){
      var od=(p.tasks||[]).filter(function(x){return !x.ok&&x.d&&x.d<today}).length;
      if(od)a.push({t:od+' overdue milestone'+(od>1?'s':''),sec:'tl'});
      if(p.target&&p.target<today)a.push({t:'Past target finish',sec:'tl'});
    }
  }
  return a;
}
function attnCard(){
  var h='',l=lastBackup(),bd=l?days(l):null;
  props.forEach(function(p,i){alerts(p).forEach(function(a){h+='<button class="att" data-x="att" data-i="'+i+'" data-sec="'+a.sec+'"><span>'+esc(p.addr)+'</span><b>'+esc(a.t)+'</b></button>'})});
  if(!isSample&&props.length&&(bd===null||bd>30))h+='<button class="att" data-x="tobk"><span>Backup</span><b>'+(l?'Last backup '+bd+' days ago':'Not backed up yet')+'</b></button>';
  return h?'<div class="card attn"><b>Needs attention</b>'+h+'</div>':'';
}

function list(){
  var own='',pot='';
  props.forEach(function(p,i){
    var pt=p.type==='potential',d=pt&&deal(p),fl=alerts(p);
    var line=pt?(p.intent==='rental'?'Yield on cost '+(d.cost?(d.ann/d.cost*100).toFixed(1):'0')+'% gross':'Est. profit '+$$(d.prof)):p.type==='project'?'Reno '+$$(p.spent)+' of '+$$(p.budget):$$(p.rent)+'/wk rent';
    var kind=pt?(p.intent==='rental'?'Buy to rent':'Reno to sell'):p.type==='project'?'Project':'Rental';
    var c='<div class="card row" data-i="'+i+'"><div><b>'+esc(p.addr)+'</b><p class="sub">'+esc(p.sub)+' · '+kind+'</p><p class="sub">'+line+'</p>'+(fl.length?'<div class="flags">'+fl.map(function(a){return '<span class="flag">'+esc(a.t)+'</span>'}).join('')+'</div>':'')+'</div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><span class="badge">'+(i===cur?'Viewing':'Open')+'</span><button class="edit del" data-d="'+i+'">'+(delIdx===i?'Tap to confirm':'Delete')+'</button></div></div>';
    if(pt)pot+=c;else own+=c;
  });
  $('p0').innerHTML=attnCard()+((own&&pot?'<p class="grp">Owned</p>':'')+own+(pot?'<p class="grp">Potential buys</p>'+pot:'')||'<div class="card"><p class="sub">Nothing added yet.</p></div>')+iosHint()+backupCard();
}

// Installing as an app: Android/desktop Chrome offer an install prompt; iPhone needs Share → Add to Home Screen.
var installEvt=null,IOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var standalone=navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
function iosHint(){
  try{if(!IOS||standalone||localStorage.getItem('nzpt.ioshint'))return ''}catch(e){return ''}
  return '<div class="card"><b>Add to your home screen</b><p class="sub" style="margin-top:4px">In Safari, tap the Share button, then “Add to Home Screen”. It then opens full screen like an app.</p><button class="edit" data-x="ioshint" style="margin-top:10px">Got it</button></div>';
}
// Ask the browser not to clear this app's data (receipts especially) when the device runs low on space.
var persistAsked=false;
function persist(){if(persistAsked||isSample||!navigator.storage||!navigator.storage.persist)return;persistAsked=true;navigator.storage.persisted().then(function(y){if(!y)return navigator.storage.persist()}).catch(function(){})}

// Address suggestions from Photon (OpenStreetMap data), limited to NZ. Typing still works if it's offline.
// Any input with class "acin" gets suggestions; data-sub names the suburb field to fill, data-next the field to focus after.
var acT,acCtl,acIn=null,acList=[],acSel=-1;
function acHide(){document.querySelectorAll('.sugg').forEach(function(s){s.innerHTML='';s.hidden=true});acList=[];acSel=-1}
function acShow(){
  var s=acIn&&acIn.parentNode.querySelector('.sugg');if(!s)return;if(!acList.length){acHide();return}
  s.hidden=false;s.innerHTML=acList.map(function(a,i){return '<div class="opt'+(i===acSel?' on':'')+'" role="option" data-s="'+i+'"><b>'+esc(a.addr)+'</b><span>'+esc(a.sub)+'</span></div>'}).join('')+'<p class="attr">Suggestions © OpenStreetMap contributors</p>';
}
function acFind(el){
  var q=el.value;clearTimeout(acT);if(acCtl)acCtl.abort();
  if(acIn!==el)acHide();acIn=el;
  if(q.trim().length<3){acHide();return}
  acT=setTimeout(function(){
    acCtl=new AbortController();
    fetch('https://photon.komoot.io/api/?limit=10&lang=en&bbox=166,-47.5,179,-34&q='+encodeURIComponent(q),{signal:acCtl.signal}).then(function(r){return r.json()}).then(function(j){
      var seen={};acList=[];acSel=-1;
      j.features.forEach(function(f){
        var p=f.properties;if(p.countrycode!=='NZ')return;
        var a=p.housenumber&&p.street?p.housenumber+' '+p.street:(p.osm_key==='highway'?p.name:'');if(!a)return;
        var sb=p.district||p.locality||'',c=p.city||p.state||'',s=sb&&sb!==c?sb+(c?', '+c:''):c;
        if(seen[a+s])return;seen[a+s]=1;acList.push({addr:a,sub:s});
      });
      acList=acList.slice(0,5);acShow();
    }).catch(function(){});
  },300);
}
function acPick(i){var a=acList[i],el=acIn;if(!a||!el)return;el.value=a.addr;var s=$(el.dataset.sub),n=$(el.dataset.next);if(s)s.value=a.sub;acHide();if(n)n.focus()}

// Deal maths for a potential buy. All figures are the user's estimates.
function deal(p){
  var hold=(p.hold||0)*(p.months||0),cost=p.price+(p.legal||0)+(p.extra||0)+(p.reno||0)+hold,all=cost+(p.sell||0),ann=(p.rent||0)*52,net=ann-(p.exp||0);
  return {hold:hold,cost:cost,all:all,prof:p.value-all,roc:all?(p.value-all)/all*100:0,ann:ann,net:net};
}
function med(a){a=a.slice().sort(function(x,y){return x-y});var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2}
function pct(n){return (n>0?'+':'')+n.toFixed(1)+'%'}
function potView(p){
  var flip=p.intent!=='rental',d=deal(p);
  var h='<div class="card"><div class="row" style="cursor:default"><span class="badge">Potential · '+(flip?'Reno to sell':'Buy to rent')+'</span><button class="edit" id="edit">Edit details</button></div><h1>'+esc(p.addr)+'</h1><p class="sub">'+[esc(p.sub),p.beds?p.beds+' bed':'',p.land?p.land+' m² land':''].filter(Boolean).join(' · ')+'</p>';
  h+='<div class="grid">'+(flip
    ?stat('Asking / offer price',$$(p.price))+stat('Est. sale price',$$(p.value))+stat('Est. profit',$$(d.prof),d.prof<0?'neg':'pos')+stat('Return on costs',pct(d.roc),d.prof<0?'neg':'')
    :stat('Total cost in',$$(d.cost))+stat('Est. value after reno',$$(p.value))+stat('Equity after reno',$$(p.value-d.cost),p.value<d.cost?'neg':'pos')+stat('Gross / net yield on cost',d.cost?(d.ann/d.cost*100).toFixed(1)+'% / '+(d.net/d.cost*100).toFixed(1)+'%':'–')+stat('Weekly rent',$$(p.rent||0))+stat('Net annual income',$$(d.net),d.net<0?'neg':''))+'</div>';
  var lines=[['Purchase price',p.price],['Legal &amp; other purchase costs',(p.legal||0)+(p.extra||0)],['Renovation',p.reno||0],['Holding ('+(p.months||0)+' mo × '+$$(p.hold||0)+')',d.hold]];
  if(flip)lines.push(['Selling costs',p.sell||0]);
  h+='<div class="lines">'+lines.map(function(l){return '<div><span>'+l[0]+'</span><b>'+$$(l[1])+'</b></div>'}).join('')+'<div class="tot"><span>Total cost</span><b>'+$$(flip?d.all:d.cost)+'</b></div></div>';
  h+='<p class="sub" style="margin-top:10px">'+(flip?'Estimates only. Profit is before tax: check current IRD guidance on tax for property bought to sell.':'Estimates only. Yield is on total cost in, not the asking price.')+'</p>'+convBlock()+'</div>';
  var c=p.comps||[];
  h+='<div class="card"><b>Comparable sales nearby</b>';
  if(c.length){
    var pr=c.map(function(x){return x.price}),m=med(pr),hi=Math.max.apply(null,pr),lo=Math.min.apply(null,pr);
    h+='<div class="grid">'+stat('Median of '+c.length+' sale'+(c.length>1?'s':''),$$(m))+stat('Your estimate vs median',p.value?pct((p.value-m)/m*100):'–')+'</div><p class="sub" style="margin-top:8px">Range '+$$(lo)+' – '+$$(hi)+'</p>';
    if(p.value>hi)h+='<p class="sub neg" style="margin-top:4px">Your estimate is above every sale listed.</p>';
    h+=c.map(function(x,i){return '<div class="comp"><div><b>'+esc(x.addr)+'</b><p class="sub">'+[esc(x.sub),x.date?'Sold '+fmtD(x.date):'',esc(x.note||'')].filter(Boolean).join(' · ')+'</p></div><div class="cr"><b>'+$$(x.price)+'</b><button class="edit del" data-c="'+i+'">Remove</button></div></div>'}).join('');
  }else h+='<p class="sub" style="margin-top:6px">No sales added yet. Add recent sales of similar homes nearby to check your '+(flip?'sale price':'value')+' estimate.</p>';
  h+=salesBlock(p)+'<p class="grp" style="margin:18px 0 0">Add a sale by hand</p><label>Address of sold property</label><div class="ac"><input id="c_addr" class="acin" data-sub="c_sub" data-next="c_price" placeholder="Start typing an address" autocomplete="off"><div class="sugg" role="listbox" hidden></div></div>'+
   '<label>Suburb / city</label><input id="c_sub">'+
   '<div class="grid" style="margin-top:0"><div><label>Sale price (NZD)</label><input id="c_price"'+MONEY+'</div><div><label>Date sold</label><input id="c_date" type="date"></div></div>'+
   '<label>Notes (beds, land, condition)</label><input id="c_note">'+
   '<button class="go" id="addcomp">Add sale</button></div>';
  return h;
}

function form(){
  clearTimeout(acT);acList=[];acSel=-1;
  var pr=newType==='project',pt=newType==='potential',flip=newIntent==='flip',sd=editIdx===null||editSec==='details',sl=!pt&&(editIdx===null||editSec==='loan');
  var N=MONEY,ed=editIdx!==null;
  var RQ=' required';
  var h='<div class="card"><b>'+(editIdx===null?'Add a property':(editSec==='loan'?'Edit mortgage':'Edit property details'))+'</b><p class="sub" style="margin-top:4px">Fields marked optional can be left blank.</p>'+
   (editIdx===null?'<label>Type</label><div class="seg"><button data-t="project" class="'+(pr?'on':'')+'">Reno project</button><button data-t="rental" class="'+(newType==='rental'?'on':'')+'">Rental</button><button data-t="potential" class="'+(pt?'on':'')+'">Potential buy</button></div>':'')+
   (pt?'<label>Plan</label><div class="seg"><button data-n="flip" class="'+(flip?'on':'')+'">Reno to sell</button><button data-n="rental" class="'+(flip?'':'on')+'">Buy to rent</button></div>':'')+
   (sd?'<label>Address</label><div class="ac"><input id="f_addr" class="acin" data-sub="f_sub" data-next="f_price" placeholder="Start typing, e.g. 12 Queen Street" autocomplete="off" required><div class="sugg" role="listbox" hidden></div></div>'+
   '<label>Suburb / city</label><input id="f_sub" required>':'')+
   // Legal fees and other purchase costs are one figure (stored in legal) for projects and potential buys; rentals keep Healthy Homes costs separate.
   (sd&&pt?'<div class="grid" style="margin-top:0"><div><label>Bedrooms (optional)</label><input id="f_beds"'+NUM+'</div><div><label>Land m² (optional)</label><input id="f_land"'+NUM+'</div></div>'+
   '<label>Asking or offer price (NZD)</label><input id="f_price"'+RQ+N+
   '<label>Legal fees and other purchase costs, est. (optional)</label><input id="f_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'+
   '<label>Renovation cost estimate (NZD)</label><input id="f_reno"'+RQ+N+
   // Holding costs are worked out per month from the yearly bills, loan interest and any other monthly costs.
   '<p class="grp" style="margin:20px 0 0">Holding costs</p>'+
   '<label>Council rates per year (NZD)</label><input id="f_rates"'+RQ+N+
   '<label>Insurance per year (NZD)</label><input id="f_ins"'+RQ+N+
   '<label>Power per month (optional)</label><input id="f_power"'+N+
   '<label>Loan amount (optional)</label><input id="f_loan"'+N+
   '<label>Interest rate % (needed with a loan)</label><input id="f_rate"'+NUM+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Loan term (years, optional, default 30)</label><input id="f_term"'+NUM+
   '<label>Other costs per month (optional, e.g. water'+(flip?'':', lawns')+')</label><input id="f_oth"'+N+
   '<p class="sub" id="holdout" style="margin-top:8px;color:var(--acc);font-weight:600"></p><p class="sub" id="loanout" style="margin-top:4px"></p>'+
   '<label>'+(flip?'Months until sold':'Months until tenanted')+'</label><input id="f_months"'+RQ+NUM+
   (flip?'<label>Estimated sale price after reno (NZD)</label><input id="f_value"'+RQ+N+'<label>Selling costs, est. (agent fees, marketing, legal)</label><input id="f_sell"'+RQ+N
     :'<label>Estimated value after reno (NZD)</label><input id="f_value"'+RQ+N+'<label>Expected weekly rent (NZD)</label><input id="f_rent"'+RQ+N+'<label>Annual expenses, est. (NZD)</label><input id="f_exp"'+RQ+N)+
   (editIdx===null?'<p class="sub" style="margin-top:10px">You can add comparable sales once it’s saved.</p>':''):'')+
   (sd&&!pt?'<label>Purchase price (NZD)</label><input id="f_price"'+RQ+N+
   '<label>Purchase date</label><input id="f_date" type="date" required>'+
   (pr?'<label>Legal fees and other purchase costs (optional)</label><input id="f_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'
      :'<label>Legal fees (optional)</label><input id="f_legal"'+N+'<label>Healthy Homes / quick reno costs (optional)</label><input id="f_extra"'+N)+
   '<label>Estimated value now (optional)</label><input id="f_value" placeholder="Leave blank to use the purchase price"'+N+
   (pr?'<label>Renovation budget (NZD)</label><input id="f_budget"'+RQ+N+(editIdx!==null&&(props[editIdx].items||[]).length?'<p class="sub" style="margin-top:8px">Spent so far is added up from your itemised reno costs.</p>':'<label>Spent so far (optional)</label><input id="f_spent"'+N)
      :'<label>Weekly rent (NZD)</label><input id="f_rent"'+RQ+N+'<label>Annual expenses (NZD)</label><input id="f_exp"'+RQ+N)+'':'')+
   // When adding, the optional mortgage sits in a collapsed section so the form stays short.
   (sl?(editIdx===null?'<details class="more" id="loanmore"'+(loanOpen?' open':'')+'><summary>Mortgage (optional)</summary>':'')+
   '<label>Loan amount (NZD)</label><input id="f_loan"'+N+
   '<label>Interest rate % (enter your own, e.g. second-tier lender)</label><input id="f_rate"'+NUM+
   '<label>Fixed term</label><select id="f_fix">'+FIXOPTS+'</select>'+
   '<div id="fixwrap"><label>Rate fixed from</label><input id="f_fixstart" type="date"></div>'+
   '<div id="customwrap" style="display:none"><label>Re-fix date</label><input id="f_refix" type="date"></div>'+
   '<p class="sub" id="fixout" style="margin-top:8px;color:var(--acc);font-weight:600"></p>'+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Remaining term (years, optional, default 30)</label><input id="f_term"'+NUM+(editIdx===null?'</details>':''):'')+
   '<p class="sub neg" id="formerr" style="margin-top:12px" role="alert"></p>'+
   '<button class="go" id="add">'+(editIdx===null?'Add property':'Save changes')+'</button>'+(editIdx===null?'':'<button class="go ghost" id="cancel">Cancel</button>')+'</div>';
  // Adding happens in the Add new pane; editing slides up over the current property so you stay where you are.
  $('sheet').hidden=!ed;
  if(ed){$('p2').innerHTML='';$('sheetbody').innerHTML=h;$('sheetbody').scrollTop=0}else{$('sheetbody').innerHTML='';$('p2').innerHTML=h+'<p class="hint">← back to current</p>'}
  if(editIdx!==null)fill(props[editIdx]);
  holdCalc();
  if($('f_fix')){$('f_fix').value='12';if(editIdx!==null){var q=props[editIdx];$('f_fix').value=q.fixTerm||(q.refix?'custom':'12')}if(!$('f_fixstart').value)$('f_fixstart').value=iso(new Date());fixPreview()}
}

function num(id){var e=$(id);return e?pnum(e.value):0}
// Monthly holding cost for a potential buy: the bills plus the actual loan repayment (interest-only, or principal & interest),
// so it's as close as possible to what goes out each month.
function repay(x){return x.loan?(x.ltype==='io'?x.loan*(x.rate||0)/1200:pmt(x.loan,x.rate||0,x.term||30)):0}
function holdOf(x){return (x.rates||0)/12+(x.ins||0)/12+(x.power||0)+(x.oth||0)+repay(x)}
function holdCalc(){
  var o=$('holdout');if(!o)return;
  var x={rates:num('f_rates'),ins:num('f_ins'),power:num('f_power'),oth:num('f_oth'),loan:num('f_loan'),rate:num('f_rate'),ltype:newLoan,term:num('f_term')},m=holdOf(x),n=num('f_months'),r=repay(x),io=x.loan*x.rate/1200;
  o.textContent=m?'Holding costs: '+$$(m)+' a month'+(n?' · '+$$(m*n)+' over '+n+' month'+(n===1?'':'s'):''):'';
  $('loanout').textContent=!r?'':x.ltype==='io'?'Includes interest-only repayments of '+$$(r)+' a month. Estimate only.'
    :'Includes principal & interest repayments of '+$$(r)+' a month over '+(x.term||30)+' years. About '+$$(r-io)+' of that pays down the loan rather than being a cost. Estimate only.';
}
// Required fields are checked on save. A loan amount also needs an interest rate.
function missing(){
  var box=editIdx===null?$('p2'):$('sheetbody'),bad=[].filter.call(box.querySelectorAll('[required]'),function(e){return !e.value.trim()});
  var r=$('f_rate');if(r&&num('f_loan')&&!r.value.trim())bad.push(r);
  box.querySelectorAll('.bad').forEach(function(e){e.classList.remove('bad')});
  bad.forEach(function(e){var d=e.closest('details');if(d)d.open=true;e.classList.add('bad');e.setAttribute('aria-invalid','true')});
  $('formerr').textContent=bad.length?'Fill in the '+(bad.length>1?bad.length+' highlighted fields':'highlighted field')+' to save.':'';
  if(bad.length){bad[0].focus();bad[0].scrollIntoView({block:'center',behavior:'smooth'})}
  return bad.length;
}
var loanOpen=false;
function saveLoan(){
  var p=props[editIdx],n=num('f_loan');
  if(n){p.loan=n;p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  else{delete p.loan;delete p.rate;delete p.refix;delete p.fixTerm;delete p.fixStart;delete p.ltype;delete p.term}
  isSample=false;cur=editIdx;editIdx=null;newLoan='pi';render();go(1,true);
}
function addProp(){
  if(missing())return;
  if(editIdx!==null&&editSec==='loan')return saveLoan();
  var a=$('f_addr').value.trim();
  var p={type:newType,addr:a,sub:$('f_sub').value.trim(),price:num('f_price'),value:num('f_value')||(newType==='potential'?0:num('f_price')),date:($('f_date')||{}).value||'',legal:num('f_legal'),extra:num('f_extra')};
  if(newType==='potential'){delete p.date;p.intent=newIntent;p.beds=num('f_beds');p.land=num('f_land');p.reno=num('f_reno');p.rates=num('f_rates');p.ins=num('f_ins');p.power=num('f_power');p.oth=num('f_oth');p.loan=num('f_loan');p.rate=p.loan?num('f_rate'):0;p.ltype=newLoan;p.term=num('f_term')||30;p.hold=holdOf(p);p.months=num('f_months');if(newIntent==='flip')p.sell=num('f_sell');else{p.rent=num('f_rent');p.exp=num('f_exp')}}
  else if(newType==='project'){p.budget=num('f_budget');p.spent=num('f_spent')}else{p.rent=num('f_rent');p.exp=num('f_exp')}
  if(newType!=='potential'&&num('f_loan')){p.loan=num('f_loan');p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  isSample=false;newLoan='pi';loanOpen=false;if(editIdx!==null){var o=props[editIdx];['loan','rate','refix','fixTerm','fixStart','ltype','term','comps','items','cats','start','target','target0','hold','tasks','done','plan','beds','land'].forEach(function(k){if(o[k]!==undefined&&p[k]===undefined)p[k]=o[k]});syncSpent(p);props[editIdx]=p;cur=editIdx;editIdx=null}else{props.push(p);cur=props.length-1}render();go(1,true);
}

function banner(){var b=$('banner'),l=lastBackup();b.innerHTML=(isSample?'Showing sample properties · <a href="#" id="fresh">Start fresh</a>':'Saved on this device · '+(l?'last backup '+fmtD(l):'not backed up yet'))+(installEvt?' · <a href="#" id="install">Install app</a>':'')}
function render(){if(!isSample){save();persist()}list();current();form();banner()}
function go(i,smooth){track.scrollTo({left:i*track.clientWidth,behavior:smooth?'smooth':'auto'})}
function sync(){var i=Math.round(track.scrollLeft/track.clientWidth);document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',+t.dataset.i===i)})}

$('tabs').addEventListener('click',function(e){var t=e.target.closest('.tab');if(t){if(+t.dataset.i===2&&editIdx!==null){editIdx=null;form()}go(+t.dataset.i,true)}});
track.addEventListener('scroll',sync);
$('p0').addEventListener('click',function(e){var d=e.target.closest('[data-d]');
  if(d){var k=+d.dataset.d;if(delIdx===k){isSample=false;rcDel(rcIds(props[k]));props.splice(k,1);delIdx=null;if(cur>=props.length)cur=Math.max(0,props.length-1);editIdx=null;resetCur();render()}else{delIdx=k;list()}return}
  var r=e.target.closest('.row');delIdx=null;if(r){if(cur!==+r.dataset.i)resetCur();cur=+r.dataset.i;editIdx=null;render();go(1,true);return}
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='bkdl')exportBackup();
  if(b.dataset.x==='bkok')restore();
  if(b.dataset.x==='bkno'){bkPend=null;list()}
  if(b.dataset.x==='att'){var i=+b.dataset.i;if(cur!==i)resetCur();cur=i;sec=b.dataset.sec;editIdx=null;render();$('p1').scrollTop=0;go(1,true)}
  if(b.dataset.x==='tobk')$('bk').scrollIntoView({behavior:'smooth',block:'start'});
  if(b.dataset.x==='ioshint'){try{localStorage.setItem('nzpt.ioshint','1')}catch(err){}list()}
});
$('p0').addEventListener('change',function(e){if(e.target.classList.contains('bkin')&&e.target.files[0])readBackup(e.target.files[0])});
// Reno costs, receipts, timeline and converting a potential buy.
$('p1').addEventListener('click',function(e){
  var b=e.target.closest('[data-x]');if(!b)return;
  var p=props[cur],x=b.dataset.x,k=+b.dataset.k;
  function edit(){current();var c=$('costs');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})}
  if(x==='sec'){sec=b.dataset.sec;current();$('p1').scrollTop=0}
  else if(x==='cat'){var n=cats(p)[k].n;costOpen=costOpen===n?null:n;current()}
  else if(x==='add'){itemEdit='new';delItem=false;rcMsg='';edit()}
  else if(x==='item'){itemEdit=k;delItem=false;rcMsg='';edit()}
  else if(x==='isave')saveItem(p);
  else if(x==='icancel'){closeItem();current()}
  else if(x==='idel'){
    if(!delItem){delItem=true;b.textContent='Tap to confirm delete';return}
    var gone=p.items.splice(itemEdit,1)[0];rcDel((gone.rc||[]).map(function(r){return r.id}));closeItem();
    if(p.items.length)syncSpent(p);else p.spent=0;isSample=false;render();
  }
  else if(x==='rcopen')openRc(b.dataset.id);
  else if(x==='rcdrop'){var id=b.dataset.id,pi=pendRc.filter(function(r){return r.id===id}).length;if(pi){pendRc=pendRc.filter(function(r){return r.id!==id});rcDel([id])}else dropRc.push(id);keepIn('costs')}
  else if(x==='cats'){catDraft=JSON.parse(JSON.stringify(cats(p)));edit()}
  else if(x==='catrm'){readDraft();catDraft.splice(k,1);current()}
  else if(x==='catadd'){var nn=$('cb_new').value.trim();readDraft();if(!nn||catDraft.some(function(c){return c.n.toLowerCase()===nn.toLowerCase()})){$('cb_new').focus();return}catDraft.push({n:nn,b:0});current()}
  else if(x==='catsave'){readDraft();p.cats=catDraft;catDraft=null;isSample=false;render()}
  else if(x==='catcancel'){catDraft=null;current()}
  else if(x==='csv')exportCosts(p);
  else if(x==='tledit'){tlEdit=true;tlAdd=false;current()}
  else if(x==='tlsave'){p.start=$('t_start').value;p.target=$('t_target').value;p.hold=num('t_hold');if(p.target&&(!p.target0||($('t_rebase')&&$('t_rebase').checked)))p.target0=p.target;tlEdit=false;isSample=false;render()}
  else if(x==='tlcancel'){tlEdit=false;current()}
  else if(x==='tknew'){tlAdd=true;current();$('k_t').focus()}
  else if(x==='tkadd'){var t=$('k_t').value.trim();if(!t){$('k_t').focus();return}(p.tasks=p.tasks||[]).push({t:t,k:$('k_k').value,d:$('k_d').value,who:$('k_who').value.trim(),ok:false});tlAdd=false;isSample=false;render()}
  else if(x==='tkcancel'){tlAdd=false;current()}
  else if(x==='tk'){p.tasks[k].ok=!p.tasks[k].ok;isSample=false;render()}
  else if(x==='tkdel'){p.tasks.splice(k,1);isSample=false;render()}
  else if(x==='tldone'){if(p.done)delete p.done;else p.done=iso(new Date());isSample=false;render()}
  else if(x==='conv'){convOpen=true;current()}
  else if(x==='convok')convert(cur);
  else if(x==='convno'){convOpen=false;current()}
});
$('p1').addEventListener('input',function(e){if(/^cb_\d/.test(e.target.id))cbTot(props[cur])});
$('p1').addEventListener('click',function(e){
  var id=e.target.id;
  var p=props[cur];
  if(id==='edit'||id==='editloan'){editIdx=cur;editSec=id==='edit'?'details':'loan';newType=p.type;newIntent=p.intent||'flip';newLoan=p.ltype||'pi';form();return}
  if(id==='addcomp'){
    var a=$('c_addr').value.trim(),pr=num('c_price');
    if(!a){$('c_addr').focus();return}if(!pr){$('c_price').focus();return}
    (p.comps=p.comps||[]).push({addr:a,sub:$('c_sub').value.trim(),price:pr,date:$('c_date').value,note:$('c_note').value.trim()});
    isSample=false;render();return;
  }
  var c=e.target.closest('[data-c]');
  if(c){p.comps.splice(+c.dataset.c,1);isSample=false;render();return}
  if(id==='findnear'){nearOpen=true;current();return}
  if(id==='salesdel'){try{localStorage.removeItem(SKEY)}catch(err){}nearOpen=false;current();return}
  var r=e.target.closest('[data-r]');
  if(r){nearR=+r.dataset.r;document.querySelectorAll('#nr button').forEach(function(x){x.classList.toggle('on',x===r)});drawNear();return}
  var a=e.target.closest('[data-a]');
  if(a){var s=nearList[+a.dataset.a];(p.comps=p.comps||[]).push({addr:s.addr,sub:s.sub,price:s.price,date:s.date,note:saleNote(s)});isSample=false;render()}
});
$('p1').addEventListener('change',function(e){
  if(e.target.classList.contains('csvin')&&e.target.files[0])importCSV(e.target.files[0]);
  if(e.target.id==='nearbeds'){nearBeds=e.target.checked;drawNear()}
  if(e.target.classList.contains('rcin')&&e.target.files.length)addReceipts(e.target.files);
});
// Re-render the form without losing what's been typed (e.g. when switching type or plan).
function keepForm(){var v={},lm=$('loanmore');loanOpen=!!(lm&&lm.open);(editIdx===null?$('p2'):$('sheetbody')).querySelectorAll('input').forEach(function(e){if(e.value)v[e.id]=e.value});form();for(var k in v){var e=$(k);if(e)e.value=v[k]}holdCalc()}
function closeSheet(){editIdx=null;form()}
$('sheetbg').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('sheet').hidden&&!acList.length)closeSheet()});
['p2','sheetbody'].forEach(function(id){
$(id).addEventListener('change',function(e){if(/^f_(fix|fixstart|refix)$/.test(e.target.id))fixPreview()});
$(id).addEventListener('input',function(e){
  if(e.target.classList.contains('bad')){e.target.classList.remove('bad');e.target.removeAttribute('aria-invalid')}
  if(/^f_(rates|ins|power|oth|loan|rate|term|months)$/.test(e.target.id))holdCalc();
});
document.addEventListener('input',function(e){if(e.target.classList.contains('acin'))acFind(e.target)});
// Reformat money fields as you type, keeping the cursor after the same digit.
document.addEventListener('input',function(e){
  var el=e.target;if(!el.classList.contains('money'))return;
  var n=el.value.slice(0,el.selectionStart).replace(/[^\d.]/g,'').length,v=fmtMoney(el.value),i=0,c=0;
  el.value=v;while(i<v.length&&c<n){if(/[\d.]/.test(v[i]))c++;i++}
  if(n&&document.activeElement===el)el.setSelectionRange(i,i);
});
document.addEventListener('keydown',function(e){
  if(e.target!==acIn||!acList.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=acList.length;acSel=e.key==='ArrowDown'?(acSel+1)%n:(acSel<=0?n-1:acSel-1);acShow()}
  else if(e.key==='Enter'&&acSel>=0){e.preventDefault();acPick(acSel)}
  else if(e.key==='Escape')acHide();
});
$(id).addEventListener('click',function(e){
  var l=e.target.closest('[data-l]');
  if(l){newLoan=l.dataset.l;document.querySelectorAll('#lt button').forEach(function(x){x.classList.toggle('on',x===l)});holdCalc();return}
  var b=e.target.closest('[data-t]');
  if(b){newType=b.dataset.t;keepForm();return}
  var n=e.target.closest('[data-n]');
  if(n){newIntent=n.dataset.n;keepForm();return}
  if(e.target.id==='cancel'){closeSheet();return}
  if(e.target.id==='add')addProp();
});
});
document.addEventListener('click',function(e){var o=e.target.closest('[data-s]');if(o)acPick(+o.dataset.s);else if(!e.target.closest('.ac'))acHide();if(e.target.id==='fresh'){e.preventDefault();props=[];cur=0;editIdx=null;save();render();go(2,true)}
  if(e.target.id==='install'&&installEvt){e.preventDefault();installEvt.prompt();installEvt=null;banner()}});
window.addEventListener('resize',function(){go(1)});
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvt=e;banner()});
window.addEventListener('appinstalled',function(){installEvt=null;banner()});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(function(){});
render();go(1);sync();
