// Rendering, navigation and event wiring. Loaded last.
// Navigation: one screen shows at a time. Tabs (home, p0 properties, toolbody tools, setbody settings) switch from
// the bottom bar; pages (p1 a property, p2 adding one) open on top of the current tab. Pages and panels (the + menu,
// the edit panel, a calculator) add a history entry when opened, so the phone's Back button closes the top one
// instead of leaving the app. Their own close buttons go back through history too, so entries never pile up.
// ovs is that stack.
var tab='home',ovs=[];
function ovOpen(id){ovs.push(id);try{history.pushState({nz:ovs.length},'')}catch(e){}}
function ovClose(id){var i=ovs.lastIndexOf(id);if(i<0)ovShut(id);else history.go(i-ovs.length)}
// Replaces the top entry without adding history, e.g. the + menu turning into the property page it opened.
function ovSwap(id){ovs[ovs.length-1]=id;try{history.replaceState({nz:ovs.length},'')}catch(e){}}
function ovShut(id){if(id==='tool'){toolCur=null;drawTools()}else if(id==='sheet')closeSheetNow();else if(id==='plus')closePlusNow();else if(id==='tour')closeTourNow();else if(id==='pick')closePickNow();reshow()}
window.addEventListener('popstate',function(e){var l=(e.state&&e.state.nz)||0;while(ovs.length>l)ovShut(ovs.pop())});
function reshow(){var pg=ovs.filter(function(x){return x==='p1'||x==='p2'}).pop();show(pg||tab)}
function show(id){
  // Opening Settings gets a backup ready to share (see prepShare).
  if(id==='setbody'&&!$('setbody').classList.contains('on'))prepShare();
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
// Switching tabs closes any pages and panels on top first.
function navTab(t){tab=t;if(t==='toolbody'&&ovs.indexOf('tool')<0){toolCur=null;drawTools()}if(ovs.length)history.go(-ovs.length);else{show(t);$(t).scrollTop=0}}
function banner(){drawHome();drawSettings()}
function render(){if(!isSample){save();persist()}list();current();form();banner()}
$('nav').addEventListener('click',function(e){var b=e.target.closest('[data-tab]');if(b)navTab(b.dataset.tab);else if(e.target.closest('#plusbtn'))openPlus()});
document.addEventListener('click',function(e){if(e.target.closest('[data-back]')){if(ovs.length)history.back();else show(tab)}});
// The phone keyboard covers the bottom of the screen, so the tab bar hides while typing.
document.addEventListener('focusin',function(e){if(e.target.matches('input:not([type=checkbox]):not([type=file]),select,textarea'))document.body.classList.add('typing')});
document.addEventListener('focusout',function(){setTimeout(function(){if(!document.activeElement||!document.activeElement.matches('input,select,textarea'))document.body.classList.remove('typing')},50)});
// Deleting happens straight away with an Undo message. Receipt files are only removed once the message goes.
var undoT=null,undoData=null;
function delProp(i){
  if(undoData)finishDel();
  undoData={p:props.splice(i,1)[0],i:i};
  if(cur>=props.length)cur=Math.max(0,props.length-1);
  editIdx=null;newType=null;resetCur();isSample=false;render();navTab('p0');
  $('toastmsg').textContent='Deleted '+undoData.p.addr;$('toast').hidden=false;
  undoT=setTimeout(finishDel,7000);
}
function finishDel(){clearTimeout(undoT);$('toast').hidden=true;if(undoData){rcDel(rcIds(undoData.p));undoData=null}}
$('undo').addEventListener('click',function(){
  if(!undoData)return;clearTimeout(undoT);props.splice(undoData.i,0,undoData.p);cur=undoData.i;undoData=null;$('toast').hidden=true;resetCur();render();
});
$('p0').addEventListener('click',function(e){
  var r=e.target.closest('.prop');if(r){openProp(+r.dataset.i);return}
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
  if(x==='sec'){sec=b.dataset.sec;current()}
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
  else if(x==='rcdrop'){var id=b.dataset.id,pi=pendRc.filter(function(r){return r.id===id}).length;if(pi){pendRc=pendRc.filter(function(r){return r.id!==id});rcDel([id])}else dropRc.push(id);keepIn(rcCard())}
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
  else if(x==='tkadd'){if(missing($('k_t').closest('.card')))return;var t=$('k_t').value.trim();(p.tasks=p.tasks||[]).push({t:t,k:$('k_k').value,d:$('k_d').value,who:$('k_who').value.trim(),ok:false});tlAdd=false;isSample=false;render()}
  else if(x==='tkcancel'){tlAdd=false;current()}
  else if(x==='tk'){p.tasks[k].ok=!p.tasks[k].ok;delete p.tasks[k].auto;isSample=false;render()}
  else if(x==='tkdel'){p.tasks.splice(k,1);isSample=false;render()}
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
  else if(x==='mitem'){closeItem();moneyEdit=k;moneyKind=p.money[k].kind;edit('money')}
  else if(x==='mkind'){moneyKind=b.dataset.kind;keepIn('money');if(!$('m_cat').value)$('m_cat').selectedIndex=0}
  else if(x==='msave')saveMoney(p);
  else if(x==='mcancel'){closeItem();current()}
  else if(x==='mdel'){
    if(!delItem){delItem=true;b.textContent='Tap to confirm delete';return}
    var g=p.money.splice(moneyEdit,1)[0];rcDel((g.rc||[]).map(function(r){return r.id}));closeItem();isSample=false;render();
  }
  else if(x==='mall'){moneyAll=!moneyAll;current()}
  else if(x==='mcsv')exportMoney(p);
  else if(x==='tenedit'){tenEdit=true;current()}
  else if(x==='tensave')saveTen(p);
  else if(x==='tencancel'){tenEdit=false;current()}
  else if(x==='hhall'){p.hh=p.hh||{};HH.forEach(function(s){if(!p.hh[s[0]])p.hh[s[0]]=iso(new Date())});isSample=false;render()}
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
  if(e.target.classList.contains('phin')&&e.target.files[0])addPhoto(props[cur],e.target.files[0]);
});
document.addEventListener('click',function(e){var o=e.target.closest('[data-s]');if(o)acPick(+o.dataset.s);else if(!e.target.closest('.ac'))acHide();if(e.target.id==='fresh'){e.preventDefault();props=[];cur=0;editIdx=null;save();render();go(2)}});
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvt=e;banner()});
window.addEventListener('appinstalled',function(){installEvt=null;banner()});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(function(){});
render();drawTools();show('home');
if(!tourSeen())openTour();
