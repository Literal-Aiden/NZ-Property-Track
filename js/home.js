// Home (the landing page): portfolio headline, quick actions, what needs attention and recent activity.
// Also the + menu, which adds a property or jumps straight to the form for rent, a reno cost or a milestone.
function hello(){var h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function short(n){var a=Math.abs(n),s=n<0?'−$':'$';return a>=1e6?s+(a/1e6).toFixed(2).replace(/\.?0+$/,'')+'m':a>=1e4?s+Math.round(a/1e3)+'k':$$(n)}
var ATT_IC={loan:'percent',costs:'dollar',tl:'clock',ten:'users'};

function drawHome(){
  var own=props.filter(function(p){return p.type!=='potential'}),h='<p class="sub">'+hello()+'</p><h1 class="ptitle">Your portfolio</h1>';
  if(isSample)h+='<div class="note">You’re looking at sample properties. <a href="#" id="fresh">Start fresh</a> when you’re ready to add your own.</div>';
  if(own.length){
    var val=sum(own,function(p){return p.value}),debt=sum(own,function(p){return p.loan}),cf=sum(own,cashFlow),hasProj=own.some(function(p){return p.type==='project'});
    h+='<div class="card hero"><div class="lab">Equity across '+own.length+' propert'+(own.length===1?'y':'ies')+'</div><div class="big">'+$$(val-debt)+'</div>'+
      '<div class="row3"><div><b>'+short(val)+'</b><span>Value</span></div><div><b>'+short(debt)+'</b><span>Lending</span></div><div><b>'+(val?Math.round(debt/val*100)+'%':'–')+'</b><span>LVR</span></div></div>'+
      '<div class="chipline">'+ic('trend')+'<span><b>'+(cf<0?'−':'+')+$$(Math.abs(cf))+'</b> a month cash flow'+(cf<0&&hasProj?', including reno holding costs':'')+'</span></div></div>';
  }else h+='<div class="card hero"><div class="lab">Welcome</div><div class="big" style="font-size:26px">Add your first property</div><p style="margin:0 0 14px;opacity:.9">Track rentals, renovation projects and properties you’re thinking of buying.</p><button class="herobtn" data-x="hadd">Add a property</button></div>';
  h+='<h2 class="hh2">Quick actions</h2><div class="qa">'+
    '<button data-q="rent"><span class="ib">'+ic('dollar')+'</span>Log rent</button>'+
    '<button data-q="cost"><span class="ib">'+ic('tool')+'</span>Reno cost</button>'+
    '<button data-q="ms"><span class="ib">'+ic('clock')+'</span>Milestone</button>'+
    '<button data-x="hdeal"><span class="ib">'+ic('check')+'</span>Deal check</button></div>';
  var att='',n=0,l=lastBackup(),bd=l?days(l):null;
  props.forEach(function(p,i){alerts(p).forEach(function(a){n++;att+='<button class="att2" data-x="att" data-i="'+i+'" data-sec="'+a.sec+'"><span class="ib">'+ic(ATT_IC[a.sec]||'alert')+'</span><span class="tx"><b>'+esc(a.t)+'</b><span class="sub">'+esc(p.addr)+'</span></span><i class="chev">›</i></button>'})});
  if(!isSample&&props.length&&(bd===null||bd>30)){n++;att+='<button class="att2" data-x="tobk"><span class="ib">'+ic('save')+'</span><span class="tx"><b>'+(l?'Last backup '+bd+' days ago':'Not backed up yet')+'</b><span class="sub">Settings → Backup</span></span><i class="chev">›</i></button>'}
  if(n)h+='<h2 class="hh2">Needs attention <span class="sub">· '+n+'</span></h2><div class="card">'+att+'</div>';
  var act=activity();
  if(act.length)h+='<h2 class="hh2">Recent activity</h2><div class="card list">'+act.map(function(a){return '<button class="r" data-x="act" data-i="'+a.i+'" data-sec="'+a.sec+'"><span>'+esc(a.t)+' · '+esc(a.addr)+'</span><b class="'+(a.amt>0?'pos':'')+'">'+(a.amt>0?'+':'−')+$$(Math.abs(a.amt))+'</b></button>'}).join('')+'</div>';
  $('home').innerHTML=h+iosHint();
  $('setdot').hidden=isSample||!props.length||(bd!==null&&bd<=30);
}
// The latest dated rent, expenses and reno costs across all properties.
function activity(){
  var a=[];
  props.forEach(function(p,i){
    var short=p.addr.replace(/\b(Road|Street|Avenue|Lane|Crescent|Place|Drive|Terrace)\b/,function(w){return {Road:'Rd',Street:'St',Avenue:'Ave',Lane:'Ln',Crescent:'Cres',Place:'Pl',Drive:'Dr',Terrace:'Tce'}[w]});
    (p.money||[]).forEach(function(x){var m=x.n?mIn(x,'',iso(new Date())):x.amt;if(x.date&&m)a.push({d:x.date,t:x.cat+(x.n?' (weekly)':''),addr:short,amt:x.kind==='in'?m:-m,i:i,sec:'money'})});
    (p.items||[]).forEach(function(x){if(x.date&&x.amt)a.push({d:x.date,t:x.desc,addr:short,amt:-x.amt,i:i,sec:'costs'})});
  });
  return a.sort(function(x,y){return y.d.localeCompare(x.d)}).slice(0,5);
}
$('home').addEventListener('click',function(e){
  var q=e.target.closest('[data-q]');if(q){quick(q.dataset.q);return}
  var b=e.target.closest('[data-x]');if(!b)return;var x=b.dataset.x;
  if(x==='att'||x==='act')openProp(+b.dataset.i,b.dataset.sec);
  if(x==='tobk')navTab('setbody');
  if(x==='hdeal')openTool('deal');
  if(x==='hadd'){newType=null;form();go(2)}
  if(x==='ioshint'){try{localStorage.setItem('nzpt.ioshint','1')}catch(err){}drawHome()}
});

// + menu. Each quick action picks a property (skipped when there's only one) and opens its page with the form ready.
var QUICK={
  rent:{t:'Which rental?',none:'You don’t have a rental yet.',f:function(p){return p.type==='rental'},go:function(){sec='money';moneyEdit='new';moneyKind='in'},card:'money'},
  cost:{t:'Which reno project?',none:'You don’t have a reno project yet.',f:function(p){return p.type==='project'},go:function(){sec='costs';itemEdit='new'},card:'costs'},
  ms:{t:'Milestone for which project?',none:'You don’t have a reno project yet.',f:function(p){return p.type==='project'},go:function(){sec='tl';tlAdd=true},card:'k_t'}};
function openPlus(){drawPlus();$('plus').hidden=false;$('plusbody').scrollTop=0;ovOpen('plus')}
function closePlusNow(){$('plus').hidden=true}
function drawPlus(k){
  var h;
  if(!k)h='<b class="ftitle">Add</b><div class="opts">'+
    '<button data-q="rent"><span class="ib">'+ic('dollar')+'</span><b>Rent or expense</b><span class="sub">For a rental</span></button>'+
    '<button data-q="cost"><span class="ib">'+ic('tool')+'</span><b>Reno cost</b><span class="sub">With receipt photos</span></button>'+
    '<button data-q="ms"><span class="ib">'+ic('clock')+'</span><b>Milestone</b><span class="sub">Trades, inspections</span></button>'+
    '<button data-x="pprop"><span class="ib">'+ic('home')+'</span><b>Property</b><span class="sub">Owned or potential</span></button></div>'+
    '<button class="edit" data-x="pdeal" style="margin-top:12px">'+ic('check')+' Quick deal check</button>';
  else{
    var q=QUICK[k],ids=props.map(function(p,i){return i}).filter(function(i){return q.f(props[i])});
    h='<button class="back" data-x="phome">‹ Back</button><b class="ftitle">'+(ids.length?q.t:q.none)+'</b>'+
      (ids.length?ids.map(function(i){var p=props[i];return '<button class="pickp" data-pk="'+k+'" data-k="'+i+'">'+thumb(p)+'<span><b>'+esc(p.addr)+'</b><span class="sub">'+esc(p.sub)+'</span></span><i class="chev">›</i></button>'}).join('')
        :'<p class="sub" style="margin:8px 0 0">Add one first, then come back here.</p><button class="go" data-x="pprop">Add a property</button>');
  }
  $('plusbody').innerHTML='<div class="grab"></div>'+h;
}
function quick(k){
  var q=QUICK[k],ids=props.map(function(p,i){return i}).filter(function(i){return q.f(props[i])});
  if(ids.length===1){quickGo(k,ids[0]);return}
  if($('plus').hidden){$('plus').hidden=false;ovOpen('plus')}
  drawPlus(k);
}
function quickGo(k,i){
  var q=QUICK[k];resetCur();cur=i;editIdx=null;q.go();render();go(1);
  // Scrolls to the form without focusing a field, so the keyboard doesn't jump up straight away.
  setTimeout(function(){var c=$(q.card);if(c)c.scrollIntoView({block:c.tagName==='INPUT'?'center':'start',behavior:'smooth'})},60);
}
// Opens a calculator from outside the Tools tab.
function openTool(id){
  if($('plus').hidden){tab='toolbody';toolCur=id;drawTools();show('toolbody');ovOpen('tool')}
  else{closePlusNow();tab='toolbody';toolCur=id;drawTools();ovSwap('tool');show('toolbody')}
}
$('plusbg').addEventListener('click',function(){ovClose('plus')});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('plus').hidden)ovClose('plus')});
$('plusbody').addEventListener('click',function(e){
  var q=e.target.closest('[data-q]');if(q){drawPlus(q.dataset.q);var p=QUICK[q.dataset.q],ids=props.filter(p.f);if(ids.length===1)quickGo(q.dataset.q,props.indexOf(ids[0]));return}
  var pk=e.target.closest('[data-pk]');if(pk){quickGo(pk.dataset.pk,+pk.dataset.k);return}
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='phome')drawPlus();
  if(b.dataset.x==='pprop'){newType=null;form();go(2)}
  if(b.dataset.x==='pdeal')openTool('deal');
});
