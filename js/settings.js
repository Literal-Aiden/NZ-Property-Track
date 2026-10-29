// Settings panel: backup, restore, installing the app and persistent storage.
// Backup: one JSON file with every property and the receipt files they use. Imported sales data is licensed, so it's left out.
var BKEY='nzpt.backup',bkPend=null,bkMsg='';
function lastBackup(){try{return localStorage.getItem(BKEY)}catch(e){return null}}
function backupCard(){
  var l=lastBackup(),h='<div class="card" id="bk">'+hd('save','Backup')+'<p class="sub" style="margin-top:4px">Your properties and receipts are saved only in this browser. Download a backup now and then and keep it somewhere safe, like cloud storage or an email to yourself. Imported sales data isn’t included.</p>'+
    '<p class="sub" style="margin-top:6px"><b>'+(l?'Last backup '+fmtD(l):'Not backed up yet')+'</b></p>'+(bkMsg?'<p class="sub neg" style="margin-top:6px">'+esc(bkMsg)+'</p>':'');
  if(bkPend){var n=bkPend.props.length,r=bkPend.receipts.length;return h+'<p style="margin:12px 0 0;font-size:14px">Backup from '+(bkPend.exported?fmtD(bkPend.exported):'an unknown date')+': '+n+' propert'+(n===1?'y':'ies')+', '+r+' receipt'+(r===1?'':'s')+'. Restoring replaces everything on this device.</p><div class="btns"><button class="go" data-x="bkok">Replace with backup</button><button class="go ghost" data-x="bkno">Cancel</button></div></div>'}
  return h+'<div class="btns"><button class="go" data-x="bkdl">Download backup</button><label class="go ghost filebtn">Restore<input type="file" accept=".json,application/json" class="bkin" hidden></label></div></div>';
}
function installCard(){
  var t=standalone?'Installed: you’re using the app version.'
    :installEvt?'Add it to your home screen so it opens full screen and works offline.'
    :IOS?'In Safari, tap the Share button, then “Add to Home Screen”. It then opens full screen and works offline.'
    :'Open this page on your phone and use the browser menu to add it to your home screen.';
  return '<div class="card">'+hd('phone','Install the app')+'<p class="sub" style="margin-top:4px">'+t+'</p>'+(installEvt&&!standalone?'<button class="go" data-x="inst">Install app</button>':'')+'</div>';
}
function drawSettings(){
  $('setbody').innerHTML='<div class="row" style="cursor:default;margin-bottom:12px"><b class="ftitle" id="settitle">Settings</b><button class="edit" id="setclose" data-x="setclose">Done</button></div>'+backupCard()+installCard();
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
    props=d.props;cur=0;bkPend=null;resetCur();isSample=false;save();closeSettings();render();go(1,true);
  });
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
// Settings panel: backup, restore and installing the app.
function openSettings(){drawSettings();$('settings').hidden=false;$('setbody').scrollTop=0;$('setclose').focus();ovOpen('settings')}
function closeSettings(){ovClose('settings')}
function closeSettingsNow(){$('settings').hidden=true;bkPend=null;bkMsg=''}
$('gear').addEventListener('click',openSettings);
$('setbg').addEventListener('click',closeSettings);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('settings').hidden)closeSettings()});
$('setbody').addEventListener('click',function(e){
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='setclose')closeSettings();
  if(b.dataset.x==='bkdl')exportBackup();
  if(b.dataset.x==='bkok')restore();
  if(b.dataset.x==='bkno'){bkPend=null;drawSettings()}
  if(b.dataset.x==='inst'&&installEvt){installEvt.prompt();installEvt=null;banner();drawSettings()}
});
$('setbody').addEventListener('change',function(e){if(e.target.classList.contains('bkin')&&e.target.files[0])readBackup(e.target.files[0])});
