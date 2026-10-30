// Welcome tour: a few slides shown the first time the app opens, and again from Settings.
// Each slide points at a part of the bottom tab bar, shown as a small copy with that button lit up.
var TOUR_KEY='nzpt.tour',tourAt=0;
var TOUR=[
  {ic:'home',t:'Kia ora, welcome',x:'Track your rentals, renovation projects and the properties you’re thinking of buying, all in one place. Here’s a quick look around.'},
  {nav:'plus',t:'Add with +',x:'Tap + to add a property: a rental, a reno project or a potential buy. It’s also the quick way to log rent or an expense, a reno cost or a milestone.'},
  {nav:'home',t:'Home',x:'Your portfolio at a glance: equity, lending, LVR and monthly cash flow.',l:['Needs attention flags re-fixes coming up, overdue milestones, unpaid invoices, leases ending and Healthy Homes','Recent activity shows the latest rent, expenses and reno costs']},
  {nav:'p0',t:'Properties',x:'Each property has its own page.',l:['Reno projects: budget, costs with receipts, and a timeline with milestones','Rentals: rent and expenses for the tax year, tenancy, Healthy Homes','Potential buys: the numbers on a deal and the most you could offer','Mortgage: rate, re-fix date and repayments, including split loans']},
  {nav:'toolbody',t:'Tools',x:'Calculators for a quick deal check, mortgage repayments, rental yield, holding costs, break-even rent, usable equity and selling costs. Most can fill in from one of your properties.'},
  {nav:'setbody',t:'Your data stays on this '+dev(),x:'Nothing is sent to a server, so download a backup from Settings now and then. You can also install the app '+(DESK?'on this computer':'on your home screen')+' from there.'}];
function tourSeen(){try{return !!localStorage.getItem(TOUR_KEY)}catch(e){return true}}
function openTour(){tourAt=0;drawTour();$('tour').hidden=false;ovOpen('tour')}
function closeTourNow(){$('tour').hidden=true;try{localStorage.setItem(TOUR_KEY,'1')}catch(e){}}
// A copy of the tab bar with one button lit up (no ids, so it doesn't clash with the real one).
function tourNav(on){
  var h=$('nav').innerHTML.replace(/ id="[^"]*"/g,'').replace(/<button/g,'<span class="tb"').replace(/<\/button>/g,'</span>');
  var d=document.createElement('div');d.innerHTML=h;
  d.querySelectorAll('.tb').forEach(function(b){b.classList.toggle('on',(b.dataset.tab||'plus')===on)});
  return '<div class="tnav" aria-hidden="true">'+d.innerHTML+'</div>';
}
function drawTour(){
  var s=TOUR[tourAt],last=tourAt===TOUR.length-1;
  var h='<button class="tskip" data-tr="close">'+(last?'Close':'Skip')+'</button>'+
    (s.nav?tourNav(s.nav):'<div class="tlogo">'+ic(s.ic)+'</div>')+
    '<h2 id="tourt">'+s.t+'</h2><p>'+s.x+'</p>'+(s.l?'<ul>'+s.l.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>':'')+
    '<div class="tdots">'+TOUR.map(function(x,i){return '<i class="'+(i===tourAt?'on':'')+'"></i>'}).join('')+'</div>';
  if(!last)h+='<div class="btns">'+(tourAt?'<button class="go ghost" data-tr="prev">Back</button>':'')+'<button class="go" data-tr="next">Next</button></div>';
  else if(isSample)h+='<p class="sub">The properties you’ll see first are examples, so you can look around. Start fresh when you’re ready to add your own.</p>'+addBtns('Look at the examples');
  else if(!props.length)h+=addBtns('Look around first');
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
  if(x==='add'){if(isSample){props=[];cur=0;editIdx=null;save();render()}newType=null;form();go(2)}
});
document.addEventListener('keydown',function(e){
  if($('tour').hidden)return;
  if(e.key==='Escape')ovClose('tour');else if(e.key==='ArrowRight')tourGo(1);else if(e.key==='ArrowLeft')tourGo(-1);
});
// Swipe left or right to move between slides.
var tourX=null;
$('tour').addEventListener('touchstart',function(e){tourX=e.touches[0].clientX},{passive:true});
$('tour').addEventListener('touchend',function(e){if(tourX===null)return;var d=e.changedTouches[0].clientX-tourX;tourX=null;if(Math.abs(d)>50)tourGo(d<0?1:-1)});
