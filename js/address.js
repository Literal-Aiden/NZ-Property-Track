// NZ address suggestions while typing.
// Address suggestions from Photon (OpenStreetMap data), limited to NZ. Typing still works if it's offline.
// Any input with class "acin" gets suggestions; data-sub names the suburb field to fill, data-next the field to focus after.
// Photon is overseas, so a new connection costs most of a second: it's opened as soon as an address field is tapped.
// While typing, the suggestions on screen are narrowed to what still matches instead of being cleared, and replaced
// when the next results arrive. Earlier searches aren't cancelled, and results are kept, so backspacing is instant.
var acT,acIn=null,acList=[],acMore=false,acSel=-1,acCache={},acSeq=0,acShown=0,acWarm=false;
var AC_URL='https://photon.komoot.io/api/?limit=40&lang=en&bbox=166,-47.5,179,-34&q=';
function acHide(){document.querySelectorAll('.sugg').forEach(function(s){s.innerHTML='';s.hidden=true});acList=[];acSel=-1}
function acShow(){
  var s=acIn&&acIn.parentNode.querySelector('.sugg');if(!s)return;if(!acList.length){acHide();return}
  var n=acList.length;
  s.hidden=false;s.innerHTML='<div class="sugl">'+acList.map(function(a,i){return '<div class="opt'+(i===acSel?' on':'')+'" role="option" data-s="'+i+'"><b>'+esc(a.addr)+'</b><span>'+esc(a.sub)+'</span></div>'}).join('')+'</div>'+
    '<p class="attr">'+(n>5?n+(acMore?'+':'')+' matches, scroll for more, or add the suburb to narrow it down. ':'')+'Suggestions © OpenStreetMap contributors</p>';
  var on=s.querySelector('.opt.on');if(on)on.scrollIntoView({block:'nearest'});
}
function acWarmUp(){
  if(acWarm)return;acWarm=true;
  var l=document.createElement('link');l.rel='preconnect';l.href='https://photon.komoot.io';l.crossOrigin='anonymous';document.head.appendChild(l);
}
function acKey(q){return (window.plain?plain(q):q.toLowerCase()).replace(/\s+/g,' ').trim()}
// Does a suggestion still match what's typed? Every word typed must start one of its words ("12 queen st" → "12 Queen Street").
function acMatch(a,q){
  var w=acKey(a.addr+' '+a.sub).split(/[\s,]+/);
  return acKey(q).split(/[\s,]+/).every(function(t){return !t||w.some(function(x){return x.indexOf(t)===0})});
}
function acParse(j){
  var seen={},out=[];
  j.features.forEach(function(f){
    var p=f.properties;if(p.countrycode!=='NZ')return;
    var a=p.housenumber&&p.street?p.housenumber+' '+p.street:(p.osm_key==='highway'?p.name:'');if(!a)return;
    var sb=p.district||p.locality||'',c=p.city||p.state||'',s=sb&&sb!==c?sb+(c?', '+c:''):c;
    if(seen[a+s])return;seen[a+s]=1;out.push({addr:a,sub:s,county:p.county||''});
  });
  return out;
}
// Shows a set of results narrowed to what's typed now.
function acPut(all){var m=all.filter(function(a){return acMatch(a,acIn.value)});acMore=m.length>25;acList=m.slice(0,25);acSel=-1;acShow()}
function acFind(el){
  var q=el.value,k=acKey(q);clearTimeout(acT);
  if(acIn!==el)acHide();acIn=el;
  if(k.length<3){acHide();return}
  if(acCache[k]){acShown=++acSeq;acPut(acCache[k]);return}
  if(acList.length){acList=acList.filter(function(a){return acMatch(a,q)});acSel=-1;acShow()}
  acT=setTimeout(function(){
    var n=++acSeq;
    fetch(AC_URL+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){
      var all=acCache[k]=acParse(j);
      // Only use it if nothing newer is showing and it's still relevant to what's typed now.
      if(n<acShown||acIn!==el||acKey(el.value).indexOf(k)!==0)return;
      acShown=n;acPut(all);
    }).catch(function(){});
  },150);
}
function acPick(i){var a=acList[i],el=acIn;if(!a||!el)return;el.value=a.addr;var s=$(el.dataset.sub),n=$(el.dataset.next);if(s){s.value=a.sub;s.dataset.county=a.county}acHide();if(window.rateLink)rateLink();if(n)n.focus()}
document.addEventListener('input',function(e){if(e.target.classList.contains('acin'))acFind(e.target)});
document.addEventListener('focusin',function(e){if(e.target.classList.contains('acin'))acWarmUp()});
document.addEventListener('keydown',function(e){
  if(e.target!==acIn||!acList.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=acList.length;acSel=e.key==='ArrowDown'?(acSel+1)%n:(acSel<=0?n-1:acSel-1);acShow()}
  else if(e.key==='Enter'&&acSel>=0){e.preventDefault();acPick(acSel)}
  else if(e.key==='Escape')acHide();
});
