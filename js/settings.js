// Settings tab: backup, restore, installing the app and persistent storage.
// Backup: one JSON file with every property and the receipt files they use. Imported sales data is licensed, so it's left out.
var BKEY='nzpt.backup',bkPend=null,bkMsg='';
function lastBackup(){try{return localStorage.getItem(BKEY)}catch(e){return null}}
function backupCard(){
  var l=lastBackup(),h='<div class="card" id="bk">'+hd('save','Backup')+'<p class="sub" style="margin-top:4px">Your properties and receipts are saved only in this browser. Download a backup now and then and keep it somewhere safe, like cloud storage or an email to yourself. Imported sales data isn’t included.</p>'+
    '<p class="sub" style="margin-top:6px"><b>'+(l?'Last backup '+fmtD(l):'Not backed up yet')+'</b></p>'+(bkMsg?'<p class="sub neg" style="margin-top:6px">'+esc(bkMsg)+'</p>':'');
  if(bkPend){var n=bkPend.props.length,r=bkPend.receipts.length;return h+'<p style="margin:12px 0 0;font-size:14px">Backup from '+(bkPend.exported?fmtD(bkPend.exported):'an unknown date')+': '+n+' propert'+(n===1?'y':'ies')+', '+r+' receipt'+(r===1?'':'s')+'. Restoring replaces everything on this device.</p><div class="btns"><button class="go" data-x="bkok">Replace with backup</button><button class="go ghost" data-x="bkno">Cancel</button></div></div>'}
  return h+(canShareFiles()?'<p class="sub" style="margin-top:6px">Share backup sends it straight to Google Drive, iCloud, email or a chat.</p>':'')+'<div class="btns">'+(canShareFiles()?'<button class="go" data-x="bksh">Share backup</button>':'')+'<button class="go'+(canShareFiles()?' ghost':'')+'" data-x="bkdl">Download backup</button><label class="go ghost filebtn">Restore<input type="file" accept=".json,.txt,application/json,text/plain" class="bkin" hidden></label></div></div>';
}
function installCard(){
  var t=standalone?'Installed: you’re using the app version.'
    :installEvt?(DESK?'Install it on this computer so it opens in its own window and works offline.':'Add it to your home screen so it opens full screen and works offline.')
    :DESK?'To install it on this computer, open it in Chrome or Edge. To use it on your phone, open this page there and add it to your home screen.'
    :IOS?'In Safari, tap the Share button, then “Add to Home Screen”. It then opens full screen and works offline.'
    :'Use your browser’s menu to add it to your home screen, so it opens full screen and works offline.';
  return '<div class="card">'+hd('phone','Install the app')+'<p class="sub" style="margin-top:4px">'+t+'</p>'+(installEvt&&!standalone?'<button class="go" data-x="inst">Install app</button>':'')+'</div>';
}
// Appearance: follow the device (blank), or always light or dark. Saved in nzpt.theme and applied in index.html.
function themeCard(){
  var t=document.documentElement.dataset.theme||'';
  return '<div class="card">'+hd('sun','Appearance')+'<div class="seg" style="margin-top:12px">'+[['','Automatic'],['light','Light'],['dark','Dark']].map(function(o){
    return '<button data-th="'+o[0]+'" class="'+(o[0]===t?'on':'')+'">'+o[1]+'</button>'}).join('')+'</div>'+
    '<p class="sub" style="margin-top:8px">Automatic follows your '+dev()+'’s light or dark setting.</p></div>';
}
function setTheme(t){
  if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme;
  try{if(t)localStorage.setItem('nzpt.theme',t);else localStorage.removeItem('nzpt.theme')}catch(e){}
  drawSettings();
}
function drawSettings(){
  $('setbody').innerHTML='<h1 class="ptitle" style="margin-bottom:14px">Settings</h1>'+backupCard()+taxCard()+themeCard()+installCard()+
    '<div class="card">'+hd('list','Welcome tour')+'<p class="sub" style="margin-top:4px">A quick look at what the app does and where things are.</p><button class="go ghost" data-x="tour">Show the tour</button></div>'+testCard();
}
// TEMPORARY, for testers: wipe this device's properties, or swap them for the example ones. Both need a second tap.
// Remove this card (and its handlers below) before a real launch.
var testArm=null,testT=null;
function testCard(){
  function btn(x,label,cls){return '<button class="go'+(cls||'')+'" data-x="'+x+'">'+(testArm===x?'Tap again to confirm':label)+'</button>'}
  return '<div class="card">'+hd('alert','Testing')+'<p class="sub" style="margin-top:4px">Temporary, for trying the app out. Both replace everything on this device, including receipts and photos.</p>'+
    '<div class="btns">'+btn('tsample','Load example properties')+btn('tclear','Clear all data',' ghost')+'</div></div>';
}
function testRun(x){
  if(testArm!==x){testArm=x;clearTimeout(testT);testT=setTimeout(function(){testArm=null;drawSettings()},4000);drawSettings();return}
  testArm=null;clearTimeout(testT);
  rcTx('readwrite',function(s){s.clear()}).catch(function(){}).then(function(){
    for(var k in RCU)URL.revokeObjectURL(RCU[k]);RCU={};
    cur=0;resetCur();propFilter='all';
    if(x==='tsample'){try{localStorage.removeItem(KEY)}catch(e){}props=JSON.parse(JSON.stringify(SAMPLE));isSample=true}
    else{props=[];save()}
    render();navTab('home');
  });
}
function b2d(b){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(b)})}
function d2b(u){var m=/^data:([^;,]*)(;base64)?,(.*)$/.exec(u||''),s=atob(m[3]),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new Blob([a],{type:m[1]})}
// The backup: every property and the receipt files and photos they use, as JSON.
function buildBackup(){
  var want={},t=iso(new Date());props.forEach(function(p){rcIds(p).forEach(function(id){want[id]=1})});
  return rcTx('readonly',function(s){return s.getAll()}).catch(function(){return []}).then(function(all){
    return Promise.all((all||[]).filter(function(r){return want[r.id]}).map(function(r){return b2d(r.blob).then(function(u){return {id:r.id,name:r.name,type:r.type,added:r.added,data:u}})}));
  }).then(function(rc){return {t:t,name:'nz-property-tracker-backup-'+t+'.json',data:JSON.stringify({app:'nzpt',v:1,exported:t,props:props,receipts:rc})}});
}
function backedUp(t){try{localStorage.setItem(BKEY,t)}catch(e){}bkMsg='';banner()}
function exportBackup(){
  buildBackup().then(function(b){download(b.name,b.data,'application/json');backedUp(b.t)}).catch(function(){bkMsg='Couldn’t make the backup file.';drawSettings()});
}
// Sharing has to start straight from the tap, and building the backup (photos especially) can take too long for the
// phone to still count it as the tap, so the file is made ready as soon as Settings opens (prepShare, from show()).
// Chrome on Android won't share .json files, so it falls back to a .txt with the same contents (Restore takes either).
var shareFile=null,shareT=null,sharePrep=0;
function prepShare(){
  if(!canShareFiles())return;
  var n=++sharePrep;shareFile=null;
  buildBackup().then(function(b){
    if(n!==sharePrep)return;
    var f=new File([b.data],b.name,{type:'application/json'});
    if(!navigator.canShare({files:[f]}))f=new File([b.data],b.name.replace(/\.json$/,'.txt'),{type:'text/plain'});
    if(navigator.canShare({files:[f]})){shareFile=f;shareT=b.t}
  }).catch(function(){});
}
function shareBackup(){
  if(!shareFile){bkMsg='Getting the backup ready. Tap Share backup again in a moment.';drawSettings();prepShare();return}
  navigator.share({files:[shareFile],title:'NZ Property Tracker backup'}).then(function(){backedUp(shareT)},function(e){
    if(e&&e.name==='AbortError')return;
    bkMsg='Sharing didn’t work on this '+dev()+''+(e&&e.name?' ('+e.name+')':'')+'. Use Download backup instead.';drawSettings();
  });
}
// Whether this browser can share files (most phones can; many desktop browsers can't).
function canShareFiles(){try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['x'],'x.txt',{type:'text/plain'})]}))}catch(e){return false}}
function readBackup(f){
  var rd=new FileReader();
  rd.onload=function(){bkMsg='';try{var d=JSON.parse(rd.result);if(d.app!=='nzpt'||!Array.isArray(d.props))throw 0;d.receipts=d.receipts||[];bkPend=d}catch(e){bkMsg='That file isn’t an NZ Property Tracker backup.'}drawSettings()};
  rd.readAsText(f);
}
function restore(){
  var d=bkPend,recs=[];
  d.receipts.forEach(function(r){try{recs.push({id:r.id,name:r.name,type:r.type,added:r.added,blob:d2b(r.data)})}catch(e){}});
  rcTx('readwrite',function(s){s.clear();recs.forEach(function(r){s.put(r)})}).catch(function(){bkMsg='Receipts couldn’t be restored in this browser.'}).then(function(){
    for(var k in RCU)URL.revokeObjectURL(RCU[k]);RCU={};
    props=d.props;cur=0;bkPend=null;resetCur();isSample=false;save();render();navTab('home');
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
// Settings tab: backup, restore and installing the app.
$('setbody').addEventListener('click',function(e){
  var th=e.target.closest('[data-th]');if(th){setTheme(th.dataset.th);return}
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='bkdl')exportBackup();
  if(b.dataset.x==='bksh')shareBackup();
  if(b.dataset.x==='tsample'||b.dataset.x==='tclear')testRun(b.dataset.x);
  if(b.dataset.x==='bkok')restore();
  if(b.dataset.x==='tour')openTour();
  if(b.dataset.x==='bkno'){bkPend=null;drawSettings()}
  if(b.dataset.x==='inst'&&installEvt){installEvt.prompt();installEvt=null;banner();drawSettings()}
});
$('setbody').addEventListener('change',function(e){if(e.target.classList.contains('bkin')&&e.target.files[0])readBackup(e.target.files[0])});
