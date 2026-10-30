// Compact picker for dropdowns. A phone's own dropdown list can fill the screen and puts the choices out of
// thumb reach, so tapping any <select> opens a short panel at the bottom instead, with the choices as buttons.
// The <select> stays in the form and gets the value (plus input/change events), so the forms read it as before.
// Keyboard users still get the browser's own list.
var pickSel=null,pickT=null,pickLast=0;
function pickTitle(s){
  var l=s.previousElementSibling;
  if(l&&l.tagName==='LABEL')return l.textContent;
  var o=s.options[0];return o&&o.value===''?o.text:'Choose';
}
function openPick(s){
  pickSel=s;
  // The tap doesn't move focus to the select, so the field typed in last keeps it: blur it to close the keyboard.
  var a=document.activeElement;if(a&&a!==document.body&&a.blur)a.blur();
  // An empty first option is a prompt ("Fill in from a property…"), so it's the title, not a choice.
  var o=[].filter.call(s.options,function(x){return !x.disabled&&x.value!==''}),wide=o.some(function(x){return x.text.length>18});
  $('pickbody').innerHTML='<div class="pkhead"><b>'+esc(pickTitle(s))+'</b><button class="tskip" data-pk="close">Cancel</button></div>'+
    '<div class="pkopts'+(wide?' one':'')+'">'+o.map(function(x){return '<button data-pv="'+esc(x.value)+'" class="'+(x.selected&&s.value!==''?'on':'')+'">'+esc(x.text)+'</button>'}).join('')+'</div>';
  $('pick').hidden=false;ovOpen('pick');
  var on=$('pickbody').querySelector('.on');if(on)on.scrollIntoView({block:'nearest'});
}
function closePickNow(){$('pick').hidden=true;pickSel=null}
function pickSet(v){
  var s=pickSel;ovClose('pick');if(!s)return;
  if(s.value!==v){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}
  if(s.classList.contains('bad'))unbad(s);
}
$('pick').addEventListener('click',function(e){
  var b=e.target.closest('[data-pv]');if(b){pickSet(b.dataset.pv);return}
  if(e.target.closest('[data-pk]')||e.target.classList.contains('sheetbg'))ovClose('pick');
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('pick').hidden)ovClose('pick')});
function pickable(t){return t&&t.tagName==='SELECT'&&!t.disabled&&!t.multiple}
// Mouse: stop the browser's list opening on mousedown, and open ours. Touch: only a tap opens it. A touch that moves
// the finger, scrolls the page (a quick flick can scroll a long way with little finger travel) or is held down counts
// as scrolling, and the browser's own list is kept shut too.
document.addEventListener('mousedown',function(e){
  if(e.button!==0||!pickable(e.target))return;
  e.preventDefault();
  if(Date.now()-pickLast<800)return; // the mouse event a phone sends after a touch: the touch already decided
  openPick(e.target);
});
document.addEventListener('touchstart',function(e){
  var t=e.touches[0];pickT=e.touches.length===1&&pickable(e.target)?{x:t.clientX,y:t.clientY,at:Date.now(),moved:false}:null;
},{passive:true});
document.addEventListener('touchmove',function(e){
  if(pickT&&(Math.abs(e.touches[0].clientX-pickT.x)>8||Math.abs(e.touches[0].clientY-pickT.y)>8))pickT.moved=true;
},{passive:true});
document.addEventListener('scroll',function(){if(pickT)pickT.moved=true},true);
document.addEventListener('touchcancel',function(){pickT=null});
document.addEventListener('touchend',function(e){
  var t=pickT;pickT=null;if(!t||!pickable(e.target))return;
  pickLast=Date.now();
  var c=e.changedTouches[0];
  if(t.moved||Math.abs(c.clientX-t.x)>8||Math.abs(c.clientY-t.y)>8||Date.now()-t.at>600){e.preventDefault();return}
  e.preventDefault();openPick(e.target);
});
