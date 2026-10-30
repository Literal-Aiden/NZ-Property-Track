// Rendering, navigation and event wiring. Loaded last.
// Navigation: one screen shows at a time. Tabs (home, p0 properties, toolbody tools, setbody settings) switch from
// the bottom bar; pages (p1 a property, p2 adding one) open on top of the current tab. Pages and panels (the + menu,
// the edit panel, a calculator) add a history entry when opened, so the phone's Back button closes the top one
// instead of leaving the app. Their own close buttons go back through history too, so entries never pile up.
// ovs is that stack.
// A reload (or the phone restoring the app) keeps the browser's history but starts ovs empty, so each entry is tagged
// with this page load's id (sid): entries from an earlier load count as the bottom of the stack, not as open pages.
var tab='home',ovs=[],sid=Date.now().toString(36),navBusy=false;
function hstate(){return {nz:ovs.length,s:sid}}
try{history.replaceState(hstate(),'')}catch(e){}
function ovOpen(id){ovs.push(id);try{history.pushState(hstate(),'')}catch(e){}}
function ovClose(id){var i=ovs.lastIndexOf(id);if(i<0)ovShut(id);else history.go(i-ovs.length)}
// Replaces the top entry without adding history, e.g. the + menu turning into the property page it opened.
function ovSwap(id){ovs[ovs.length-1]=id;try{history.replaceState(hstate(),'')}catch(e){}}
function ovShut(id){if(id==='tool'){toolCur=null;drawTools()}else if(id==='sheet')closeSheetNow();else if(id==='plus')closePlusNow();else if(id==='tour')closeTourNow();else if(id==='pick')closePickNow();reshow()}
window.addEventListener('popstate',function(e){
  navBusy=false;
  var s=e.state,l=s&&s.s===sid?s.nz:0;
  while(ovs.length>l)ovShut(ovs.pop());
  // Landed on an entry from an earlier load, or moved forward: make it match what's showing.
  if(!s||s.s!==sid||l>ovs.length){try{history.replaceState(hstate(),'')}catch(err){}reshow()}
});
function reshow(){var pg=ovs.filter(function(x){return /^p[123]$/.test(x)}).pop();show(pg||tab)}
function show(id){
  // Opening Settings gets a backup ready to share (see prepShare).
  if(id==='setbody'&&!$('setbody').classList.contains('on'))prepShare();
  if(id==='p3')drawCash();
  document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('on',s.id===id)});
  document.querySelectorAll('#nav [data-tab]').forEach(function(b){b.classList.toggle('on',b.dataset.tab===tab)});
}
// Opens a page (p1 or p2) on top of the current tab.
function openPage(id){
  var top=ovs[ovs.length-1];
  if(top==='plus'||top==='tour'){closePlusNow();closeTourNow();ovSwap(id)}
  else if(top==='p2'&&id==='p1')ovSwap(id);
  else if(ovs.indexOf(id)<0)ovOpen(id);
  show(id);$(id).scrollTop=0;
}
function go(i){if(i===0)navTab('p0');else openPage(i===1?'p1':'p2')}
// Switching tabs closes any pages and panels on top first. A second tap while that's under way just changes which
// tab shows when it finishes, instead of going back again (which could step out of the app).
function navTab(t){
  tab=t;if(t==='toolbody'&&ovs.indexOf('tool')<0){toolCur=null;drawTools()}
  if(navBusy)return;
  if(ovs.length){
    navBusy=true;history.go(-ovs.length);
    // If the browser doesn't step back (it should within a moment), close everything here so the tab still switches.
    setTimeout(function(){if(!navBusy)return;navBusy=false;while(ovs.length)ovShut(ovs.pop());try{history.replaceState(hstate(),'')}catch(e){}reshow()},800);
  }else{show(t);$(t).scrollTop=0}
}
function banner(){drawHome();drawSettings()}
function render(){props.forEach(syncHold);if(!isSample){save();persist()}list();current();form();banner()}
// Tapping Properties while already on it clears the filter and search, so it's back to showing everything.
$('nav').addEventListener('click',function(e){
  var b=e.target.closest('[data-tab]');
  if(b&&b.dataset.tab==='p0'&&tab==='p0'&&!ovs.length){propFilter='all';propQ='';list();$('p0').scrollTop=0;return}
  if(b)navTab(b.dataset.tab);else if(e.target.closest('#plusbtn'))openPlus();
});
document.addEventListener('click',function(e){if(e.target.closest('[data-back]')){if(ovs.length)history.back();else show(tab)}});
// The phone keyboard covers the bottom of the screen, so the tab bar hides while typing.
document.addEventListener('focusin',function(e){if(e.target.matches('input:not([type=checkbox]):not([type=file]),select,textarea'))document.body.classList.add('typing')});
document.addEventListener('focusout',function(){setTimeout(function(){if(!document.activeElement||!document.activeElement.matches('input,select,textarea'))document.body.classList.remove('typing')},50)});
// Deleting (a property, cost, money entry or milestone) happens straight away with an Undo message for 7 seconds.
// Receipt files are only removed once the message goes. restore puts the deleted thing back.
var undoT=null,undoData=null;
function undoable(msg,restore,files){
  if(undoData)finishDel();
  undoData={restore:restore,files:files||[]};
  $('toastmsg').textContent=msg;$('toast').hidden=false;
  undoT=setTimeout(finishDel,7000);
}
function finishDel(){clearTimeout(undoT);$('toast').hidden=true;if(undoData){rcDel(undoData.files);undoData=null}}
$('undo').addEventListener('click',function(){
  var d=undoData;if(!d)return;clearTimeout(undoT);undoData=null;$('toast').hidden=true;isSample=false;d.restore();
});
function delProp(i){
  if(undoData)finishDel();
  var p=props.splice(i,1)[0];
  if(cur>=props.length)cur=Math.max(0,props.length-1);
  editIdx=null;newType=null;resetCur();isSample=false;render();navTab('p0');
  undoable('Deleted '+p.addr,function(){props.splice(i,0,p);cur=i;resetCur();render()},rcIds(p));
}
function rcOf(x){return (x.rc||[]).map(function(r){return r.id})}
$('p0').addEventListener('click',function(e){
  var r=e.target.closest('.prop,.prow');if(r){openProp(+r.dataset.i);return}
  // Table headings sort: the same column again flips the order; numbers start biggest first.
  var th=e.target.closest('[data-sort]');if(th){var k=th.dataset.sort;propSort=propSort.k===k?{k:k,d:-propSort.d}:{k:k,d:PCOLS[k].n?-1:1};plist();return}
  var f=e.target.closest('[data-f]');if(f){propFilter=f.dataset.f;list()}
  if(e.target.closest('[data-x="hadd"]')){newType=null;form();go(2)}
});
$('p0').addEventListener('input',function(e){if(e.target.id==='pq'){propQ=e.target.value;plist()}});
// Opens a property's page, optionally at a section.
function openProp(i,s){if(cur!==i)resetCur();cur=i;if(s)sec=s;editIdx=null;render();go(1)}
// Reno costs, rental money and tenancy, receipts, timeline, and converting between property types.
$('p1').addEventListener('click',function(e){
  var b=e.target.closest('[data-x]');if(!b)return;
  var p=props[cur],x=b.dataset.x,k=+b.dataset.k;
  function edit(id){current();var c=$(id||'costs');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})}
  if(x==='sec'){sec=b.dataset.sec;valEdit=false;rentChg=false;current()}
  else if(x==='cat'){var n=cats(p)[k].n;costOpen=costOpen===n?null:n;current()}
  else if(x==='add'){itemEdit='new';rcMsg='';edit()}
  else if(x==='item'){itemEdit=k;rcMsg='';edit()}
  else if(x==='isave')saveItem(p);
  else if(x==='icancel'){closeItem();current()}
  else if(x==='idel'){
    var ix=itemEdit,gone=p.items.splice(ix,1)[0];closeItem();
    if(p.items.length)syncSpent(p);else p.spent=0;isSample=false;render();
    undoable('Deleted '+(gone.desc||'cost'),function(){p.items.splice(ix,0,gone);syncSpent(p);render()},rcOf(gone));
  }
  else if(x==='rcopen')openRc(b.dataset.id);
  else if(x==='rcdrop'){var id=b.dataset.id,pi=pendRc.filter(function(r){return r.id===id}).length;if(pi){pendRc=pendRc.filter(function(r){return r.id!==id});rcDel([id])}else dropRc.push(id);keepIn(rcCard())}
  else if(x==='cats'){catDraft=JSON.parse(JSON.stringify(cats(p)));edit()}
  else if(x==='catrm'){readDraft();catDraft.splice(k,1);current()}
  else if(x==='catadd'){var nn=$('cb_new').value.trim();readDraft();if(!nn||catDraft.some(function(c){return c.n.toLowerCase()===nn.toLowerCase()})){$('cb_new').focus();return}catDraft.push({n:nn,b:0});current()}
  else if(x==='catsave'){readDraft();p.cats=catDraft;catDraft=null;isSample=false;render()}
  else if(x==='catcancel'){catDraft=null;current()}
  else if(x==='csv')exportCosts(p);
  else if(x==='tledit'){tlEdit=true;tlAdd=false;current()}
  else if(x==='tlsave'){p.start=$('t_start').value;p.target=$('t_target').value;p.rates=num('t_rates');p.ins=num('t_ins');p.power=num('t_power');p.oth=num('t_oth');syncHold(p);if(p.target&&(!p.target0||($('t_rebase')&&$('t_rebase').checked)))p.target0=p.target;tlEdit=false;isSample=false;render()}
  else if(x==='tlcancel'){tlEdit=false;current()}
  else if(x==='tknew'){tlAdd=true;current();$('k_t').focus()}
  else if(x==='tkadd'){if(missing($('k_t').closest('.card')))return;var t=$('k_t').value.trim();(p.tasks=p.tasks||[]).push({t:t,k:$('k_k').value,d:$('k_d').value,who:$('k_who').value.trim(),ok:false});tlAdd=false;isSample=false;render()}
  else if(x==='tkcancel'){tlAdd=false;current()}
  else if(x==='tk'){p.tasks[k].ok=!p.tasks[k].ok;delete p.tasks[k].auto;isSample=false;render()}
  else if(x==='tkdel'){var tg=p.tasks.splice(k,1)[0];isSample=false;render();undoable('Deleted milestone: '+tg.t,function(){p.tasks.splice(k,0,tg);render()})}
  else if(x==='valedit'){valEdit=true;current();var vf=$('valf');if(vf){vf.scrollIntoView({block:'center',behavior:'smooth'});valPrev(p)}}
  else if(x==='valsave')saveVal(p);
  else if(x==='valcancel'){valEdit=false;current()}
  else if(x==='refixcal')refixIcs(p);
  // Finishing ticks any milestones left open, marked auto so "Not finished yet" can untick just those.
  else if(x==='tldone'){
    (p.tasks||[]).forEach(function(t){if(p.done){if(t.auto){t.ok=false;delete t.auto}}else if(!t.ok){t.ok=true;t.auto=true}});
    if(p.done)delete p.done;else p.done=iso(new Date());isSample=false;render();
  }
  else if(x==='conv'){convOpen=true;current()}
  else if(x==='convok')convert(cur);
  else if(x==='convno'){convOpen=false;current()}
  else if(x==='madd'){closeItem();moneyEdit='new';moneyKind=b.dataset.kind;edit('money')}
  else if(x==='rentlog'){closeItem();sec='money';moneyEdit='new';moneyKind='in';edit('money')}
  else if(x==='rentchg'){rentChg=true;current();var rc=$('rentc');if(rc){rc.scrollIntoView({block:'start',behavior:'smooth'});rentNote(p)}}
  else if(x==='rentsave')saveRent(p);
  else if(x==='rentcancel'){rentChg=false;current()}
  else if(x==='mitem'){closeItem();moneyEdit=k;moneyKind=p.money[k].kind;edit('money')}
  // Switching a new entry between income and expense swaps the starting amount (the weekly rent) if it wasn't changed.
  else if(x==='mkind'){
    var was=moneyEdit==='new'&&num('m_amt')===(moneyKind==='in'?p.rent:0);moneyKind=b.dataset.kind;keepIn('money');if(!$('m_cat').value)$('m_cat').selectedIndex=0;
    if(was)$('m_amt').value=moneyKind==='in'&&p.rent?fmtMoney(p.rent):'';
  }
  else if(x==='msave')saveMoney(p);
  else if(x==='mcancel'){closeItem();current()}
  else if(x==='mdel'){
    var mx=moneyEdit,g=p.money.splice(mx,1)[0];closeItem();isSample=false;render();
    undoable('Deleted '+(g.kind==='in'?'income':'expense')+': '+g.cat,function(){p.money.splice(mx,0,g);render()},rcOf(g));
  }
  else if(x==='mall'){moneyAll=!moneyAll;current()}
  else if(x==='mcsv')exportMoney(p);
  else if(x==='tenedit'){tenEdit=true;current()}
  else if(x==='tensave')saveTen(p);
  else if(x==='tencancel'){tenEdit=false;current()}
  else if(x==='hhall'){p.hh=p.hh||{};HH.forEach(function(s){if(!p.hh[s[0]])p.hh[s[0]]=iso(new Date())});isSample=false;render()}
  else if(x==='picst'){picStage=b.dataset.v;current()}
  else if(x==='picdel'){
    var pid=b.dataset.id;if(picArm!==pid){picArm=pid;current();return}
    picArm=null;p.pics=(p.pics||[]).filter(function(r){return r.id!==pid});rcDel([pid]);isSample=false;render();
  }
  else if(x==='hhdrop'){
    var did=b.dataset.id;if(hhArm!==did){hhArm=did;current();return}
    hhArm=null;p.hhDocs=(p.hhDocs||[]).filter(function(r){return r.id!==did});rcDel([did]);isSample=false;render();
  }
  else if(x==='hh'){p.hh=p.hh||{};if(p.hh[b.dataset.k])delete p.hh[b.dataset.k];else p.hh[b.dataset.k]=iso(new Date());isSample=false;render()}
  else if(x==='torent'){rentOpen=true;current();$('r_rent').focus()}
  else if(x==='rentok')toRental(p);
  else if(x==='rentno'){rentOpen=false;current()}
  else if(x==='oyt'){p.tgtT=b.dataset.v;isSample=false;render()}
});
$('p1').addEventListener('input',function(e){
  if(/^cb_\d/.test(e.target.id))cbTot(props[cur]);
  if(e.target.id==='v_val')valPrev(props[cur]);
  if(/^r2_(amt|date|inc)$/.test(e.target.id))rentNote(props[cur]);
  if(/^t_(rates|ins|power|oth)$/.test(e.target.id))tlHoldCalc(props[cur]);
  if(e.target.classList.contains('bad'))unbad(e.target);
  // The offer target is kept on the property without re-rendering, so typing isn't interrupted.
  if(e.target.id==='o_tgt'){var p=props[cur];p.tgt=num('o_tgt')||undefined;offerCalc(p);if(!isSample)save()}
});
$('p1').addEventListener('click',function(e){
  var id=e.target.id;
  var p=props[cur];
  if(id==='edit'||id==='editloan'){editIdx=cur;editSec=id==='edit'?'details':'loan';newType=p.type;newIntent=p.intent||'flip';newLoan=p.ltype||'pi';lpReset(p);form();ovOpen('sheet');return}
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
  if(e.target.classList.contains('hhin')&&e.target.files.length)addHhDocs(props[cur],e.target.files);
  if(e.target.classList.contains('picin')&&e.target.files.length)addPics(props[cur],e.target.files);
  if(e.target.id==='pic_room'){picRoom=e.target.value;current()}
  if(e.target.classList.contains('phin')&&e.target.files[0])addPhoto(props[cur],e.target.files[0]);
});
document.addEventListener('click',function(e){var o=e.target.closest('[data-s]');if(o)acPick(+o.dataset.s);else if(!e.target.closest('.ac'))acHide();if(e.target.id==='fresh'){e.preventDefault();props=[];cur=0;editIdx=null;save();render();go(2)}});
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvt=e;banner()});
window.addEventListener('appinstalled',function(){installEvt=null;banner()});
// Swiping left or right: on a property page it moves between its sections (Overview, Costs…); on the main tabs it moves
// between Home, Properties, Tools and Settings. It has to be a clear sideways swipe, not starting at the screen edge
// (the phone's own back gesture) or on something that scrolls sideways or takes typing, and only with no panel open.
var TABS=['home','p0','toolbody','setbody'],swX=null,swY=0,swT=0;
function swipeable(t){
  return !t.closest('input,select,textarea,.chips,.sugg,.track,.lparts,.leaflet-container')&&$('sheet').hidden&&$('plus').hidden&&$('pick').hidden&&$('tour').hidden&&!document.body.classList.contains('typing');
}
function swipeTo(d){
  var on=document.querySelector('.screen.on'),id=on&&on.id;
  if(id==='p1'){
    var B=[].slice.call(document.querySelectorAll('#p1 .secnav [data-sec]')),i=B.findIndex(function(b){return b.classList.contains('on')}),n=B[i+d];
    if(!n||itemEdit!==null||moneyEdit!==null||tlAdd||tlEdit||tenEdit||catDraft||valEdit||rentOpen||rentChg)return;
    n.click();
  }else{
    var j=TABS.indexOf(id);if(j<0||ovs.indexOf('tool')>=0)return;
    var t=TABS[j+d];if(t)navTab(t)
  }
}
document.addEventListener('touchstart',function(e){
  var x=e.touches[0].clientX;swX=null;
  if(e.touches.length!==1||x<24||x>innerWidth-24||!swipeable(e.target))return;
  swX=x;swY=e.touches[0].clientY;swT=Date.now();
},{passive:true});
document.addEventListener('touchend',function(e){
  if(swX===null)return;
  var dx=e.changedTouches[0].clientX-swX,dy=e.changedTouches[0].clientY-swY;swX=null;
  if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*2&&Date.now()-swT<700)swipeTo(dx<0?1:-1);
});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(function(){});
render();drawTools();show('home');
// Crossing the desktop width redraws Home and Properties (dashboard and table on wide screens, cards on a phone).
if(window.matchMedia){var wq=matchMedia('(min-width:900px)'),wr=function(){list();drawHome()};if(wq.addEventListener)wq.addEventListener('change',wr);else if(wq.addListener)wq.addListener(wr)}
if(!tourSeen())openTour();
