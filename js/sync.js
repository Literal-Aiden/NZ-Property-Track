// Sync across devices, through Supabase (the table and rules are in supabase/schema.sql). Optional: signed out, the
// app works as before, with everything on this device only.
// Sign-in is by email: Supabase sends a link that comes back here with the session in the address (#access_token=…).
// A 6-digit code works too (SYNC_CODE), once the email template can show one (that needs our own email service).
// Each property is one row: {id, data (the property as saved here), deleted}. The database stamps each change with its
// own time, so a device asks for the rows changed since the newest one it has seen (sync.at). sync.sent keeps a hash
// of each property as last sent or received: a property whose hash differs has changed here and is sent; one that's
// gone has been deleted here, and its row is marked deleted so other devices drop it too. If both devices change the
// same property between syncs, the one that syncs last wins.
// Receipt and photo files sync too (see files() below).
var SB_URL='https://jpfnfwfzivlwlqrdlgxg.supabase.co',SB_KEY='sb_publishable_vAKTq6361F1xN13IYyGnUQ_JnQkeS4V',SYNC_CODE=false;
var AKEY='nzpt.auth',SKEY='nzpt.sync';
function jget(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function jset(k,v){try{if(v)localStorage.setItem(k,JSON.stringify(v));else localStorage.removeItem(k)}catch(e){}}
var auth=jget(AKEY),sync=jget(SKEY)||{sent:{}},syncSt='',syncMsg='',syncT=null,syncBusy=false,syncAgain=false,refreshing=null;
var authSent=null,authEmail='',authMsg='',authCode='',outArm=false,outT=null,authInfo='';

// Supabase's API. Errors come back as {status, msg}; status 0 means it couldn't be reached.
function sbFetch(path,o){
  o=o||{};var h={apikey:SB_KEY,'Content-Type':'application/json'};
  if(o.auth!==false&&auth)h.Authorization='Bearer '+auth.at;
  for(var k in o.h||{})h[k]=o.h[k];
  return fetch(SB_URL+path,{method:o.m||'GET',headers:h,body:o.b?JSON.stringify(o.b):undefined}).catch(function(){throw {status:0,msg:'offline'}}).then(function(r){
    return r.text().then(function(t){var d=null;try{d=t?JSON.parse(t):null}catch(e){}
      if(!r.ok)throw {status:r.status,code:d&&(d.error_code||d.code),msg:(d&&(d.msg||d.message||d.error_description||d.error))||'Error '+r.status};
      return d});
  });
}
// The signed-in session. The user's id and email are read from the access token itself.
function jwt(t){try{return JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return {}}}
function setAuth(d){var j=jwt(d.access_token);auth={at:d.access_token,rt:d.refresh_token,exp:+d.expires_at||j.exp||0,uid:j.sub,email:j.email||(d.user&&d.user.email)};jset(AKEY,auth)}
// A fresh access token (they last an hour). If the session has ended (signed out elsewhere, or the account removed),
// this device is signed out; if Supabase can't be reached, it tries again next time.
function fresh(){
  if(!auth)return Promise.reject({status:401});
  if(auth.exp-60>Date.now()/1000)return Promise.resolve();
  if(!refreshing)refreshing=sbFetch('/auth/v1/token?grant_type=refresh_token',{m:'POST',auth:false,b:{refresh_token:auth.rt}}).then(setAuth,function(e){
    if(e.status>=400&&e.status<500){auth=null;jset(AKEY,null);authMsg='You were signed out. Sign in again to keep syncing.'}
    throw e;
  }).then(function(){refreshing=null},function(e){refreshing=null;throw e});
  return refreshing;
}
// Runs fn once every script has loaded (main.js comes after this file).
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn()}
// Back from the sign-in link: take the session from the address, then tidy the address.
(function(){
  var h=location.hash;if(!/access_token=|error_description=/.test(h))return;
  var q={};h.slice(1).split('&').forEach(function(x){var i=x.indexOf('=');if(i>0)q[x.slice(0,i)]=decodeURIComponent(x.slice(i+1).replace(/\+/g,' '))});
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(q.access_token){setAuth(q);signedIn()}
  else authMsg=/expired|invalid/i.test(q.error_description||'')?'That sign-in link has expired or was already used. Send a new one.':'Sign-in didn’t work: '+q.error_description;
  // Show Settings once the app has started, so the result is in view.
  ready(function(){navTab('setbody')});
})();
function signedIn(){
  authInfo='';delOpen=false;
  authSent=null;authCode='';authMsg='';
  // A different account from last time on this device: start its sync state afresh.
  if(sync.uid!==auth.uid)sync={uid:auth.uid,sent:{}};
  jset(SKEY,sync);ready(syncNow);
}
function sendLink(){
  var e=authEmail.trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){authMsg='Enter your email address.';drawSync();return}
  authMsg='';syncSt='sending';drawSync();
  sbFetch('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{m:'POST',auth:false,b:{email:e,create_user:true}}).then(function(){authSent=e},function(x){
    authMsg=x.status===429?'Too many sign-in emails for now. Wait a while, then try again.':x.status?'Couldn’t send the email: '+x.msg:'Couldn’t reach the sync service. Check your connection.';
  }).then(function(){syncSt='';drawSync()});
}
function checkCode(){
  var c=authCode.replace(/\D/g,'');if(c.length<6){authMsg='Enter the 6-digit code from the email.';drawSync();return}
  syncSt='sending';drawSync();
  sbFetch('/auth/v1/verify',{m:'POST',auth:false,b:{type:'email',email:authSent,token:c}}).then(function(d){setAuth(d);signedIn()},function(x){
    authMsg=x.status?'That code didn’t work. Check it, or send a new one.':'Couldn’t reach the sync service. Check your connection.';
  }).then(function(){syncSt='';drawSync()});
}
// Signing out stops syncing; the properties stay on this device.
function signOut(){
  var a=auth;auth=null;jset(AKEY,null);sync={sent:{}};jset(SKEY,null);syncSt='';syncMsg='';
  if(a)fetch(SB_URL+'/auth/v1/logout',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+a.at}}).catch(function(){});
  drawSync();
}
// Deleting the account (NZ Privacy Act: people can have their data removed): its files in storage first (the database
// can't remove those), then the account itself with delete_me() (supabase/schema.sql), which also removes its
// property rows. The properties on this device stay, signed out; other devices keep theirs until cleared there.
var delOpen=false,delBusy=false,delMsg='';
function deleteAccount(){
  if(delBusy)return;delBusy=true;delMsg='';drawSync();
  var dir=auth.uid+'/',pass=0;
  // Storage lists up to 1,000 files at a time, so remove them in batches until none are left.
  function clearFiles(){return sbFetch('/storage/v1/object/list/files',{m:'POST',b:{prefix:auth.uid,limit:1000}}).then(function(fs){
    var names=(fs||[]).filter(function(f){return f.id}).map(function(f){return dir+f.name});
    if(names.length&&++pass<50)return sbFetch('/storage/v1/object/files',{m:'DELETE',b:{prefixes:names}}).then(clearFiles);
  })}
  fresh().then(clearFiles).then(function(){return sbFetch('/rest/v1/rpc/delete_me',{m:'POST',b:{}})}).then(function(){
    auth=null;jset(AKEY,null);sync={sent:{}};jset(SKEY,null);syncSt='';syncMsg='';delOpen=false;
    authInfo='Your account and everything synced to it have been deleted. Your properties are still on this '+dev()+'.';
  },function(e){delMsg=e.status?'Couldn’t delete the account: '+e.msg:'Couldn’t reach the sync service. Check your connection and try again.'}).then(function(){delBusy=false;drawSync()});
}

// Hashing a property: keys sorted, because the database hands JSON back with its keys in its own order.
function canon(o){
  if(Array.isArray(o))return '['+o.map(canon).join(',')+']';
  if(o&&typeof o==='object')return '{'+Object.keys(o).sort().filter(function(k){return o[k]!==undefined}).map(function(k){return JSON.stringify(k)+':'+canon(o[k])}).join(',')+'}';
  return JSON.stringify(o===undefined?null:o);
}
function hash(o){var s=canon(o),h=5381;for(var i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))|0;return (h>>>0).toString(36)+s.length.toString(36)}
function pidx(id){for(var i=0;i<props.length;i++)if(props[i].id===id)return i;return -1}
// What's changed here since the last sync: rows to send.
function outgoing(){
  if(isSample)return [];
  var rows=[],now={};
  props.forEach(function(p){if(!p.id)p.id=uid();var h=hash(p);now[p.id]=1;if(sync.sent[p.id]!==h)rows.push({user_id:auth.uid,id:p.id,data:p,deleted:false,h:h})});
  for(var id in sync.sent)if(!now[id])rows.push({user_id:auth.uid,id:id,data:{},deleted:true});
  return rows;
}
// Called on every save: sync shortly after the last change, if there's anything to send.
function syncSoon(){if(!auth||syncBusy&&(syncAgain=true))return;if(!outgoing().length)return;clearTimeout(syncT);syncT=setTimeout(syncNow,1500)}
// Something on screen is being typed in or edited, so changes from elsewhere wait (redrawing would lose it).
function busy(){
  var a=document.activeElement;
  return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))||ovs.some(function(x){return /^(sheet|p2|tool|tour|pick)$/.test(x)})||!!document.querySelector('.screen.on .fbar');
}
function syncNow(){
  clearTimeout(syncT);
  if(!auth)return;
  if(syncBusy){syncAgain=true;return}
  if(!navigator.onLine){syncSt='offline';drawSync();return}
  syncBusy=true;syncSt='busy';drawSync();
  fresh().then(pull).then(push).then(files).then(function(){sync.last=new Date().toISOString();jset(SKEY,sync);syncSt='ok';syncMsg=''},function(e){
    syncSt=e.status===0?'offline':'err';
    syncMsg=e.status===401||!auth?'':e.msg||'';
  }).then(function(){syncBusy=false;drawSync();if(syncAgain){syncAgain=false;clearTimeout(syncT);syncT=setTimeout(syncNow,5000)}});
}
// Changes from other devices. Examples on screen are replaced by the account's properties. While something's being
// edited the changes wait, and the cursor stays put, so they come again next time.
var pullHeld=false;
function pull(){
  var all=isSample;pullHeld=false;
  return sbFetch('/rest/v1/props?select=id,data,deleted,updated&order=updated'+(sync.at&&!all?'&updated=gt.'+encodeURIComponent(sync.at):'')).then(function(rows){
    if(!rows||!rows.length)return;
    if(busy()){syncAgain=pullHeld=true;return}
    var live=rows.filter(function(r){return !r.deleted});
    if(all){if(!live.length)return;props=[];isSample=false;sync.sent={}}
    var curId=props[cur]&&props[cur].id,ch=all;
    rows.forEach(function(r){
      var i=pidx(r.id),local=i>=0?props[i]:null,lh=local?hash(local):null;
      sync.at=r.updated;
      if(local&&lh!==sync.sent[r.id])return; // changed here too: this device's version is sent next and wins
      if(r.deleted){if(local){props.splice(i,1);ch=true}delete sync.sent[r.id];return}
      r.data.id=r.id;var rh=hash(r.data);
      if(!local&&sync.sent[r.id]===rh)return; // deleted here; the delete is sent next
      if(lh!==rh){if(local)props[i]=r.data;else props.push(r.data);ch=true}
      sync.sent[r.id]=rh;
    });
    jset(SKEY,sync);
    if(!ch)return;
    var c=pidx(curId);
    if(c<0&&ovs.indexOf('p1')>=0){cur=0;resetCur();navTab('p0')}
    cur=Math.max(0,c);render();
  });
}
function push(){
  var rows=outgoing();if(!rows.length)return;
  return sbFetch('/rest/v1/props?on_conflict=user_id,id',{m:'POST',h:{Prefer:'resolution=merge-duplicates,return=minimal'},b:rows.map(function(r){return {user_id:r.user_id,id:r.id,data:r.data,deleted:r.deleted}})}).then(function(){
    rows.forEach(function(r){if(r.deleted)delete sync.sent[r.id];else sync.sent[r.id]=r.h});jset(SKEY,sync);
  });
}
// Receipt and photo files (receipts.js keeps them in IndexedDB; properties hold only {id, name, type}). Stored in the
// private `files` bucket at <user id>/<file id>. sync.files lists the ids known to be there: filled from the bucket
// the first time (sync.listed), then kept up to date here. Each sync uploads files used by a property but not there
// yet (a few at a time, so a big first upload doesn't hold up the rest), and removes files no property uses any more.
// Files from other devices are downloaded when first shown (rcFetch, from rcUrl in receipts.js), then kept here.
// A file the bucket won't take (a type it doesn't allow, or over 10 MB) is noted in sync.skip and stays on this device.
var filesLeft=0,rcGetting={};
function sbFile(path,o){
  o=o||{};var h={apikey:SB_KEY,Authorization:'Bearer '+auth.at};for(var k in o.h||{})h[k]=o.h[k];
  return fetch(SB_URL+'/storage/v1/object/'+path,{method:o.m||'GET',headers:h,body:o.b}).catch(function(){throw {status:0,msg:'offline'}});
}
function files(){
  if(isSample)return;
  var dir=auth.uid+'/',want={};
  props.forEach(function(p){rcIds(p).forEach(function(id){want[id]=1})});
  sync.files=sync.files||{};sync.skip=sync.skip||{};
  return (sync.listed?Promise.resolve():listFiles().then(function(n){n.forEach(function(id){sync.files[id]=1});sync.listed=true}))
    .then(function(){return rcTx('readonly',function(s){return s.getAllKeys()}).catch(function(){return []})})
    .then(function(keys){
      var have={};(keys||[]).forEach(function(k){have[k]=1});
      // Used here but not on this device: another device added it, so it's in the bucket (or soon will be).
      for(var id in want)if(!have[id])sync.files[id]=1;
      var up=Object.keys(want).filter(function(id){return have[id]&&!sync.files[id]&&!sync.skip[id]}),batch=up.slice(0,6);
      // Removing waits while changes from elsewhere are held back, since those may use files this device hasn't seen.
      var gone=pullHeld?[]:Object.keys(sync.files).filter(function(id){return !want[id]});
      filesLeft=up.length;drawSync();
      return (gone.length?sbFetch('/storage/v1/object/files',{m:'DELETE',b:{prefixes:gone.map(function(id){return dir+id})}}).then(function(){gone.forEach(function(id){delete sync.files[id]})}):Promise.resolve())
        .then(function(){return batch.reduce(function(pr,id){return pr.then(function(){return upload(id)}).then(function(){filesLeft--;drawSync()})},Promise.resolve())})
        .then(function(){jset(SKEY,sync);if(filesLeft>0)syncAgain=true});
    });
}
function listFiles(){
  var out=[];
  function page(off){return sbFetch('/storage/v1/object/list/files',{m:'POST',b:{prefix:auth.uid,limit:1000,offset:off}}).then(function(fs){
    (fs||[]).forEach(function(f){if(f.id)out.push(f.name)});
    return fs&&fs.length===1000?page(off+1000):out;
  })}
  return page(0);
}
function upload(id){
  return rcTx('readonly',function(s){return s.get(id)}).then(function(r){
    if(!r)return;
    return sbFile('files/'+auth.uid+'/'+encodeURIComponent(id),{m:'POST',h:{'Content-Type':r.type||r.blob.type||'application/octet-stream','x-upsert':'true'},b:r.blob}).then(function(res){
      if(res.ok){sync.files[id]=1;return}
      return res.text().then(function(t){if(/mime|too large|size|413|415/i.test(t)){sync.skip[id]=1;return}throw {status:res.status,msg:'A file couldn’t be uploaded ('+res.status+')'}});
    });
  });
}
// The {id, name, type, added} a property holds for a file.
function rcRef(id){
  var f=null;
  props.some(function(p){
    (p.items||[]).concat(p.money||[]).forEach(function(x){(x.rc||[]).forEach(function(r){if(r.id===id)f=r})});
    (p.hhDocs||[]).concat(p.pics||[],p.photo?[p.photo]:[]).forEach(function(r){if(r.id===id)f=r});
    return f;
  });
  return f;
}
// A file that isn't on this device: download it, keep it, and return a URL to show it ('' if it can't be had).
function rcFetch(id){
  if(!auth||isSample)return Promise.resolve('');
  if(!rcGetting[id])rcGetting[id]=fresh().then(function(){return sbFile('authenticated/files/'+auth.uid+'/'+encodeURIComponent(id))}).then(function(res){
    if(!res.ok)return '';
    return res.blob().then(function(b){
      var m=rcRef(id)||{name:'File',type:b.type};
      sync.files=sync.files||{};sync.files[id]=1;
      return rcPut({id:id,name:m.name,type:m.type||b.type,added:m.added,blob:b}).catch(function(){}).then(function(){return RCU[id]=URL.createObjectURL(b)});
    });
  }).catch(function(){return ''}).then(function(u){delete rcGetting[id];return u});
  return rcGetting[id];
}
// Before a backup: download any files this device doesn't have yet, so the backup is complete.
function rcFetchMissing(ids){
  if(!auth||isSample)return Promise.resolve();
  return rcTx('readonly',function(s){return s.getAllKeys()}).then(function(keys){
    var have={};(keys||[]).forEach(function(k){have[k]=1});
    return ids.filter(function(id){return !have[id]}).reduce(function(pr,id){return pr.then(function(){return rcFetch(id)})},Promise.resolve());
  }).catch(function(){});
}

// Check for changes from other devices when the app comes back into view, every minute while it's open, and when
// the connection comes back.
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')syncNow()});
window.addEventListener('online',function(){syncNow()});
window.addEventListener('offline',function(){if(auth){syncSt='offline';drawSync()}});
setInterval(function(){if(document.visibilityState==='visible'&&auth)syncNow()},60000);
if(auth)ready(syncNow);

// The Settings card.
function agoT(t){var m=Math.round((Date.now()-new Date(t))/60000);return m<1?'just now':m<60?m+' min ago':new Date(t).toLocaleString('en-NZ',{hour:'numeric',minute:'2-digit',day:'numeric',month:'short'})}
function syncCard(){
  var h='<div class="card" id="sync">'+hd('cloud','Sync across devices');
  if(auth){
    var st=syncSt==='busy'?'Syncing…':syncSt==='offline'?'Offline. Changes are saved on this '+dev()+' and sync when you’re back online.':syncSt==='err'?'Couldn’t sync'+(syncMsg?': '+esc(syncMsg):'')+'. It will try again shortly.':sync.last?'Up to date · synced '+agoT(sync.last):'Not synced yet';
    return h+'<p class="sub" style="margin-top:4px">Signed in as <b>'+esc(auth.email||'')+'</b>. Your properties are kept up to date on every '+dev()+' you sign in on.</p>'+
      '<p class="sub'+(syncSt==='err'?' neg':'')+'" style="margin-top:6px"><b>'+st+'</b></p>'+
      (filesLeft>0?'<p class="sub" style="margin-top:6px">Uploading receipts and photos: '+filesLeft+' to go.</p>':'')+
      (sync.skip&&Object.keys(sync.skip).length?'<p class="sub" style="margin-top:6px">'+Object.keys(sync.skip).length+' file'+(Object.keys(sync.skip).length===1?' is':'s are')+' too large or not a photo or PDF, so '+(Object.keys(sync.skip).length===1?'it stays':'they stay')+' on this '+dev()+' only.</p>':'')+
      '<div class="btns"><button class="go ghost" data-x="synow">Sync now</button><button class="go ghost" data-x="syout">'+(outArm?'Tap again to sign out':'Sign out')+'</button></div>'+delCard()+'</div>';
  }
  h+='<p class="sub" style="margin-top:4px">Sign in to have your properties on your phone and computer, kept up to date on both. Without signing in, everything stays on this '+dev()+' only.</p>';
  if(authSent){
    h+='<div class="sysent">'+ic('check')+'<p><b>Check your email.</b> We’ve sent a sign-in link to <b>'+esc(authSent)+'</b>. Open it on this '+dev()+(standalone?'':' in this browser')+'.</p></div>'+
      (IOS&&standalone?'<p class="sub" style="margin-top:6px">On iPhone the link opens in Safari, not this app, so sign in from Safari for now.</p>':'')+
      (SYNC_CODE?'<label for="sycode" style="display:block;margin-top:12px">Or enter the 6-digit code from the email</label><input id="sycode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="'+esc(authCode)+'">':'');
  }else h+='<label for="syemail" style="display:block;margin-top:12px">Email</label><input id="syemail" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="'+esc(authEmail)+'">';
  if(authMsg)h+='<p class="sub neg" style="margin-top:6px">'+esc(authMsg)+'</p>';
  if(authInfo&&!authSent)h+='<p class="sub" style="margin-top:6px"><b>'+esc(authInfo)+'</b></p>';
  return h+'<div class="btns">'+(authSent?(SYNC_CODE?'<button class="go" data-x="sycheck">Sign in</button>':'')+'<button class="go ghost" data-x="sylink">Send again</button><button class="go ghost" data-x="syother">Use a different email</button>'
    :'<button class="go" data-x="sylink"'+(syncSt==='sending'?' disabled':'')+'>'+(syncSt==='sending'?'Sending…':'Email me a sign-in link')+'</button>')+'</div></div>';
}
// Delete my account: a small button that opens a confirmation saying what goes and what stays.
function delCard(){
  if(!delOpen)return '<button class="edit del" data-x="sydel" style="margin-top:16px">Delete my account and data</button>';
  return '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line)"><b>Delete your account?</b>'+
    '<p class="sub" style="margin-top:6px">This removes your account and everything synced to it, including any receipts and photos, from the sync service. It can’t be undone.</p>'+
    '<p class="sub" style="margin-top:6px">The properties on this '+dev()+' stay here, signed out. Any other devices you’ve signed in on keep their copies too. Download a backup first if you might want them later.</p>'+
    (delMsg?'<p class="sub neg" style="margin-top:6px">'+esc(delMsg)+'</p>':'')+
    '<div class="btns"><button class="go" data-x="sydelok">'+(delBusy?'Deleting…':'Delete my account')+'</button><button class="go ghost" data-x="sydelno">Cancel</button></div></div>';
}
// Redraw just the card (not while its field is being typed in).
// Redraws only while no field in the card is being typed in (a focused button is fine: it is redrawn after a click).
function drawSync(){var c=$('sync'),a=document.activeElement;if(c&&!(c.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))c.outerHTML=syncCard()}
$('setbody').addEventListener('click',function(e){
  var b=e.target.closest('#sync [data-x]');if(!b)return;var x=b.dataset.x;
  if(x==='sylink'){if(syncSt!=='sending'){authInfo='';authEmail=authSent||authEmail;authSent=null;sendLink()}}
  if(x==='sycheck')checkCode();
  if(x==='syother'){authSent=null;authMsg='';drawSync()}
  if(x==='synow')syncNow();
  if(x==='sydel'){delOpen=true;delMsg='';drawSync()}
  if(x==='sydelno'&&!delBusy){delOpen=false;drawSync()}
  if(x==='sydelok')deleteAccount();
  if(x==='syout'){if(!outArm){outArm=true;clearTimeout(outT);outT=setTimeout(function(){outArm=false;drawSync()},4000);drawSync();return}outArm=false;clearTimeout(outT);signOut()}
});
$('setbody').addEventListener('input',function(e){if(e.target.id==='syemail')authEmail=e.target.value;if(e.target.id==='sycode')authCode=e.target.value});
$('setbody').addEventListener('keydown',function(e){if(e.key!=='Enter')return;if(e.target.id==='syemail'){e.preventDefault();e.target.blur();sendLink()}if(e.target.id==='sycode'){e.preventDefault();e.target.blur();checkCode()}});
