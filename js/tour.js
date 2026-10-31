// Welcome tour: a few slides shown the first time the app opens, and again from Settings.
// Each slide shows its page behind the card (pg) and lights up that button on the real tab bar (nav), which sits
// above the tour's dimmed background. With no properties of your own, the example ones are shown while it's open.
var TOUR_KEY='nzpt.tour',tourAt=0,tourWas=null;
var TOUR=[
  {ic:'home',pg:'home',t:'Kia ora, welcome',x:'Track your rentals, renovation projects, and the properties you’re thinking of buying, all in one place. Here’s a quick look around.'},
  {nav:'plus',pg:'home',plus:1,t:'Add with +',x:'Tap + to add a property: a rental, a reno project, or a potential buy. It’s also the quick way to log rent or an expense, a reno cost, or a milestone.'},
  {nav:'home',t:'Home',x:'Your portfolio at a glance: equity, lending, LVR, and monthly cash flow.',l:['Needs attention lists what’s due: upcoming re-fixes, overdue milestones, unpaid invoices, leases ending, and Healthy Homes standards','Recent activity shows the latest rent, expenses, and reno costs']},
  {nav:'p0',t:'Properties',x:'Each property has its own page.',l:['Reno projects: budget, costs, receipts, and milestones','Rentals: rent, expenses, tenancy, and Healthy Homes','Potential buys: the deal numbers and your maximum offer','Mortgages: re-fix dates and repayments']},
  {nav:'toolbody',t:'Tools',x:'Calculators for a quick deal check, mortgage repayments, rental yield, holding costs, break-even rent, usable equity, and selling costs. Most can fill in from one of your properties.'},
  {nav:'setbody',t:'Your data stays on this '+dev(),x:'Nothing is sent to a server, so download a backup from Settings now and then. You can also install the app '+(DESK?'on this computer':'on your home screen')+' from there.'}];
function tourSeen(){try{return !!localStorage.getItem(TOUR_KEY)}catch(e){return true}}
function openTour(){
  tourWas=null;
  // Nothing of your own yet: borrow the examples for the tour (in memory only; isSample stops them being saved).
  if(!isSample&&!props.length){tourWas={props:props,cur:cur};props=JSON.parse(JSON.stringify(SAMPLE));isSample=true;cur=0;list();banner()}
  tourAt=0;document.body.classList.add('touring');drawTour();$('tour').hidden=false;ovOpen('tour');
}
// Puts back what was there before the tour (your own properties, the + menu closed) and goes back to Home.
function tourRestore(){
  tab='home';$('home').scrollTop=0;if(tourWas){props=tourWas.props;cur=tourWas.cur;isSample=false;tourWas=null;list();banner()}
  document.body.classList.remove('touring');$('tour').classList.remove('top');$('plus').hidden=true;
  document.querySelectorAll('#nav button').forEach(function(b){b.classList.remove('tlit')});
}
function closeTourNow(){if($('tour').hidden)return;$('tour').hidden=true;tourRestore();try{localStorage.setItem(TOUR_KEY,'1')}catch(e){}}
// What you'd have without the borrowed examples, for the last slide's buttons.
function tourReal(){return tourWas?{sample:false,n:tourWas.props.length}:{sample:isSample,n:props.length}}
// Shows the slide's page behind the card (and the + menu on its slide), and lights up its button on the tab bar.
function tourPage(s){
  var pg=s.pg||s.nav;
  if(pg==='toolbody'&&toolCur){toolCur=null;drawTools()}
  if(pg==='p0'&&(propFilter!=='all'||propQ)){propFilter='all';propQ='';list()}
  document.querySelectorAll('.screen').forEach(function(x){x.classList.toggle('on',x.id===pg)});$(pg).scrollTop=0;
  document.querySelectorAll('#nav button').forEach(function(b){var k=b.dataset.tab||'plus';b.classList.toggle('on',k===pg);b.classList.toggle('tlit',k===s.nav)});
  if(s.plus){drawPlus();$('plusbody').scrollTop=0}
  $('plus').hidden=!s.plus;$('tour').classList.toggle('top',!!s.plus);
}
function drawTour(){
  var s=TOUR[tourAt],last=tourAt===TOUR.length-1,r=tourReal();tourPage(s);
  var h='<button class="tskip" data-tr="close">'+(last?'Close':'Skip')+'</button>'+
    (s.ic?'<div class="tlogo">'+ic(s.ic)+'</div>':'')+
    '<h2 id="tourt">'+s.t+'</h2><p>'+s.x+(s.nav==='p0'&&tourWas?' These ones are examples, just for the tour.':'')+'</p>'+
    (s.l?'<ul>'+s.l.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>':'')+
    '<div class="tdots">'+TOUR.map(function(x,i){return '<i class="'+(i===tourAt?'on':'')+'"></i>'}).join('')+'</div>';
  if(!last)h+='<div class="btns">'+(tourAt?'<button class="go ghost" data-tr="prev">Back</button>':'')+'<button class="go" data-tr="next">Next</button></div>';
  else if(r.sample)h+='<p class="sub">The properties you’ll see first are examples, so you can look around. Start fresh when you’re ready to add your own.</p>'+addBtns('Look at the examples');
  else if(!r.n)h+=addBtns('Look around first');
  else h+='<div class="btns"><button class="go ghost" data-tr="prev">Back</button><button class="go" data-tr="close">Get started</button></div>';
  $('tourbody').innerHTML=h;
}
function addBtns(other){return '<div class="btns"><button class="go" data-tr="add">Add my first property</button><button class="go ghost" data-tr="close">'+other+'</button></div>'}
function tourGo(d){var n=tourAt+d;if(n<0||n>=TOUR.length)return;tourAt=n;drawTour()}
$('tour').addEventListener('click',function(e){
  var b=e.target.closest('[data-tr]');if(!b)return;var x=b.dataset.tr;
  if(x==='next')tourGo(1);
  if(x==='prev')tourGo(-1);
  if(x==='close')ovClose('tour');
  // Opens the add page in place of the tour, clearing the examples first (like "Start fresh" on Home).
  if(x==='add'){tourRestore();if(isSample){props=[];cur=0;editIdx=null;save();render()}newType=null;form();go(2)}
});
document.addEventListener('keydown',function(e){
  if($('tour').hidden)return;
  if(e.key==='Escape')ovClose('tour');else if(e.key==='ArrowRight')tourGo(1);else if(e.key==='ArrowLeft')tourGo(-1);
});
// Swipe left or right to move between slides.
var tourX=null;
$('tour').addEventListener('touchstart',function(e){tourX=e.touches[0].clientX},{passive:true});
$('tour').addEventListener('touchend',function(e){if(tourX===null)return;var d=e.changedTouches[0].clientX-tourX;tourX=null;if(Math.abs(d)>50)tourGo(d<0?1:-1)});
