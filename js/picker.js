// Compact picker for dropdowns. A phone's own dropdown list can fill the screen and puts the choices out of
// thumb reach, so tapping any <select> opens a short panel at the bottom instead, with the choices as buttons.
// The <select> stays in the form and gets the value (plus input/change events), so the forms read it as before.
// Keyboard users still get the browser's own list.
var pickSel=null,pickY=null;
function pickTitle(s){
  var l=s.previousElementSibling;
  if(l&&l.tagName==='LABEL')return l.textContent;
  var o=s.options[0];return o&&o.value===''?o.text:'Choose';
}
function openPick(s){
  pickSel=s;
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
  s.classList.remove('bad');
}
$('pick').addEventListener('click',function(e){
  var b=e.target.closest('[data-pv]');if(b){pickSet(b.dataset.pv);return}
  if(e.target.closest('[data-pk]')||e.target.classList.contains('sheetbg'))ovClose('pick');
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('pick').hidden)ovClose('pick')});
function pickable(t){return t&&t.tagName==='SELECT'&&!t.disabled&&!t.multiple}
// Mouse: stop the browser's list opening on mousedown. Touch: on a tap (not a scroll), cancel the touchend so the
// browser's list never opens, and open ours.
document.addEventListener('mousedown',function(e){if(e.button===0&&pickable(e.target)){e.preventDefault();openPick(e.target)}});
document.addEventListener('touchstart',function(e){pickY=pickable(e.target)?e.touches[0].clientY:null},{passive:true});
document.addEventListener('touchend',function(e){
  if(pickY===null||!pickable(e.target))return;
  var moved=Math.abs(e.changedTouches[0].clientY-pickY)>10;pickY=null;
  if(moved)return;
  e.preventDefault();openPick(e.target);
});
