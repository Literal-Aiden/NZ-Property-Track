// Getting set up: shown once, after the welcome tour (or on the next start, if the tour ended by adding a property),
// as a small panel over Home. Two steps, each skipped when it doesn't apply:
//  1. Install the app: the browser's own install prompt where there is one (Chrome, Edge, Android), steps for iPhone
//     (Safari has no prompt), or the browser menu on other phones. Skipped once installed, or on a computer without one.
//  2. Sync: sign in with an email to back up and use it on other devices; "Set up sync" goes to the Sync card in Settings.
//     Not offered in Safari on iPhone before installing: the home-screen app keeps its own data, so sync is offered
//     there instead, the first time it opens.
// Each step is shown once: done or "Not now", it's noted in nzpt.ob and not asked again (Settings still has both).
var OB_KEY='nzpt.ob',obSteps=[],obAt=0;
function obDone(){try{return JSON.parse(localStorage.getItem(OB_KEY))||{}}catch(e){return {}}}
// Done with the install step also retires the iPhone "Add to Home Screen" hint card on Home (iosHint()).
function obMark(k){var d=obDone();d[k]=1;try{localStorage.setItem(OB_KEY,JSON.stringify(d));if(k==='install')localStorage.setItem('nzpt.ioshint','1')}catch(e){}}
function obWhich(){
  var d=obDone(),s=[],iosSafari=IOS&&!standalone;
  if(!d.install&&!standalone&&(installEvt||IOS||!DESK))s.push('install');
  if(!d.sync&&!iosSafari&&!auth)s.push('sync');
  return s;
}
// Shown only on Home with nothing else open, so it never covers a form or the add page.
function obMaybe(){
  if(!tourSeen()||ovs.length||tab!=='home'||!$('ob').hidden)return;
  obSteps=obWhich();if(!obSteps.length)return;
  obAt=0;obDraw();$('ob').hidden=false;ovOpen('ob');
}
var SHARE_IC='<svg class="ic obshare" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>';
function obDraw(){
  var k=obSteps[obAt],n=obSteps.length,h='<div class="grab"></div>'+(n>1?'<p class="obstep">Step '+(obAt+1)+' of '+n+'</p>':'');
  if(k==='install'){
    h+='<div class="obhd"><span class="ib">'+ic('phone')+'</span><b class="ftitle">'+(IOS?'Add Rent &amp; Reno to your home screen':'Install Rent &amp; Reno')+'</b></div>';
    if(installEvt)h+='<p class="sub">'+(DESK?'Install it on this computer so it opens in its own window and works offline.':'Add it to your home screen so it opens full screen like any other app, and works offline.')+'</p>'+
      '<div class="btns"><button class="go" data-x="obinst">Install app</button><button class="go ghost" data-x="obskip">Not now</button></div>';
    else{
      h+='<p class="sub">So it opens full screen like any other app, and works offline.</p><ol class="obsteps">'+
        (IOS?'<li>Tap the Share button '+SHARE_IC+' in Safari’s toolbar</li><li>Scroll down and tap <b>Add to Home Screen</b></li><li>Tap <b>Add</b>, then open Rent &amp; Reno from your home screen</li>'
            :'<li>Open your browser’s menu (<b>⋮</b>)</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b></li><li>Open Rent &amp; Reno from your home screen</li>')+'</ol>'+
        (IOS?'<p class="sub obnote">Best done before adding your properties: the home-screen app keeps its own copy, separate from Safari. Once it’s open from your home screen, you can set up sync there.</p>':'')+
        '<div class="btns"><button class="go" data-x="obnext">Done</button><button class="go ghost" data-x="obskip">Not now</button></div>';
    }
  }else{
    h+='<div class="obhd"><span class="ib">'+ic('cloud')+'</span><b class="ftitle">Keep your properties safe</b></div>'+
      '<p class="sub">Sign in with your email to back up your properties and use them on your other devices'+(DESK?', like your phone':', like your computer')+'. No password: we email you a code.</p>'+
      '<p class="sub obnote">Optional. Without it, everything stays on this '+dev()+'. <a href="privacy.html">How your information is handled</a></p>'+
      '<div class="btns"><button class="go" data-x="obsync">Set up sync</button><button class="go ghost" data-x="obskip">Not now</button></div>';
  }
  $('obbody').innerHTML=h;
}
// Moves on to the next step, or closes once there are none left.
function obNext(){obMark(obSteps[obAt]);obAt++;if(obAt<obSteps.length)obDraw();else ovClose('ob')}
function closeObNow(){$('ob').hidden=true;$('obbody').innerHTML=''}
$('obbg').addEventListener('click',function(){obMark(obSteps[obAt]);ovClose('ob')});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('ob').hidden){obMark(obSteps[obAt]);ovClose('ob')}});
$('obbody').addEventListener('click',function(e){
  var b=e.target.closest('[data-x]');if(!b)return;var x=b.dataset.x;
  if(x==='obskip'||x==='obnext')obNext();
  // The browser's own install prompt; whatever's chosen there, carry on to the next step.
  if(x==='obinst'&&installEvt){var ev=installEvt;installEvt=null;banner();ev.prompt();(ev.userChoice||Promise.resolve()).then(obNext,obNext)}
  // Sync: to the Sync card in Settings, with the email field ready.
  if(x==='obsync'){obMark('sync');obMark(obSteps[obAt]);ovClose('ob');setTimeout(function(){navTab('setbody');setTimeout(function(){var f=$('syemail');if(f){f.scrollIntoView({block:'center'});f.focus()}},350)},300)}
});
