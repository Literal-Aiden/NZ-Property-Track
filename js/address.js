// NZ address suggestions while typing.
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
document.addEventListener('input',function(e){if(e.target.classList.contains('acin'))acFind(e.target)});
document.addEventListener('keydown',function(e){
  if(e.target!==acIn||!acList.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=acList.length;acSel=e.key==='ArrowDown'?(acSel+1)%n:(acSel<=0?n-1:acSel-1);acShow()}
  else if(e.key==='Enter'&&acSel>=0){e.preventDefault();acPick(acSel)}
  else if(e.key==='Escape')acHide();
});
