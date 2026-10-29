// Current property view, alerts and the property list.
function loanCard(p){
  if(!p.loan)return '<div class="card row" style="cursor:default"><span class="sub">No mortgage added</span><button class="edit" id="editloan">Add mortgage</button></div>';
  var io=p.loan*p.rate/1200,pi=pmt(p.loan,p.rate,p.term||30),isIO=p.ltype==='io';
  var now=isIO?io:pi,alt=isIO?pi:io;
  var rf=refixOf(p),fl=p.fixTerm==='float';
  var d=rf?dd(iso(new Date()),rf):null;
  var when=fl?'Floating rate':d===null?'No re-fix date':(d<0?'Re-fix date passed':'Re-fix in '+d+' days');
  var dt=fl?'Can change anytime':rf?new Date(rf+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}):'–';
  return '<div class="card"><div class="row" style="cursor:default"><b>Mortgage</b><button class="edit" id="editloan">Edit mortgage</button></div><p class="sub">'+$$(p.loan)+' at '+p.rate+'% · '+(isIO?'Interest-only':'Principal &amp; interest')+'</p>'+
   '<div class="grid">'+stat('Repayment / month now',$$(now))+stat(isIO?'If P&amp;I instead':'If interest-only',$$(alt))+stat(when,dt,d!==null&&d>=0&&d<=90?'neg':'')+stat(isIO?'Extra cash needed for P&amp;I':'Cash freed by interest-only',$$(Math.abs(pi-io)))+'</div>'+
   '<p class="sub" style="margin-top:10px">Interest-only frees up cash each month, but the loan isn’t paid down. The difference is mostly principal, not interest saved. Based on a '+(p.term||30)+'-year term.</p></div>';
}
function resetCur(){closeItem();sec='ov';catDraft=null;costOpen=null;tlEdit=false;tlAdd=false;convOpen=false;tenEdit=false;rentOpen=false;moneyAll=false;hhArm=null}
function setv(m){for(var k in m){var e=$(k);if(e&&m[k])e.value=e.classList.contains('money')?fmtMoney(m[k]):m[k]}}
function fillCur(p){
  if(itemEdit!==null&&itemEdit!=='new'){var x=p.items[itemEdit];setv({i_desc:x.desc,i_who:x.who,i_date:x.date,i_quote:x.quote,i_amt:x.amt})}
  if(moneyEdit!==null){var y=moneyEdit==='new'?{date:iso(new Date())}:p.money[moneyEdit];setv({m_date:y.date,m_amt:y.amt,m_note:y.note})}
  if(tenEdit){var t=p.ten||{};setv({t_who:t.who,t_ls:t.ls||(p.ten?'':p.date),t_le:t.le,t_ri:t.ri,t_bond:t.bond})}
  if(tlEdit)setv({t_start:p.start||p.date,t_target:p.target,t_hold:p.hold});
  if(convOpen)setv({v_price:p.price,v_date:iso(new Date()),v_legal:(p.legal||0)+(p.extra||0),v_budget:p.reno});
  if(p.type==='potential'){setv({o_tgt:p.tgt});offerCalc(p)}
  if(catDraft)cbTot(p);
  fillThumbs();
}
// Re-render the current pane without losing what's been typed in one card.
function keepIn(id){var v={};document.querySelectorAll('#'+id+' input[id],#'+id+' select[id]').forEach(function(e){v[e.id]=e.type==='checkbox'?e.checked:e.value});current();for(var k in v){var e=$(k);if(e){if(e.type==='checkbox')e.checked=v[k];else e.value=v[k]}}}
function current(){
  var p=props[cur];
  if(!p){$('p1').innerHTML='<div class="card"><p class="sub">No properties yet. Swipe right to add one.</p></div>';return}
  if(p.type==='potential'){$('p1').innerHTML=potView(p)+'<p class="hint">← all properties · add new →</p>';fillCur(p);if(nearOpen)drawNear();return}
  var pr=p.type==='project',S=pr?SECS:SECS_R;
  if(!S.some(function(s){return s[0]===sec}))sec='ov';
  // Owned properties are split into sections so the page stays short on a phone. A dot marks a section with something to deal with.
  var flag={};alerts(p).forEach(function(a){flag[a.sec]=1});
  var h='<div class="card"><div class="row" style="cursor:default"><span class="badge">'+(pr?'Renovation project':'Rental')+'</span><button class="edit" id="edit">Edit details</button></div><h1>'+esc(p.addr)+'</h1><p class="sub">'+esc(p.sub)+'</p></div>'+
    '<div class="secnav">'+S.map(function(s){return '<button data-x="sec" data-sec="'+s[0]+'" class="'+(sec===s[0]?'on':'')+(flag[s[0]]?' dot':'')+'">'+s[1]+'</button>'}).join('')+'</div>';
  var body={costs:costCard,tl:timeCard,money:moneyCard,ten:tenCard,loan:loanCard}[sec];
  if(body){$('p1').innerHTML=h+body(p)+'<p class="hint">← all properties · add new →</p>';fillCur(p);return}
  h+='<div class="card">';
  if(pr){
    var pct=p.budget?Math.round(p.spent/p.budget*100):0,gain=p.value-basis(p),left=p.budget-p.spent;
    h+='<div><b>Reno budget</b><div class="bar"><i class="'+(pct>100?'over':'')+'" style="width:'+Math.min(pct,100)+'%"></i></div><span class="sub">'+$$(p.spent)+' of '+$$(p.budget)+' spent ('+pct+'%)'+(p.items&&p.items.length?' · '+$$(sum(p.items,cmt))+' committed incl. quotes':'')+'</span></div>';
    h+='<div class="grid">'+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Budget remaining',$$(left),left<0?'neg':'')+stat('Equity gain after reno',$$(gain),gain<0?'neg':'pos')+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
    if(p.done)h+=toRentBlock(p);
  }else{
    var ann=p.rent*52,net=ann-p.exp;
    h+='<div class="grid" style="margin-top:0">'+stat('Weekly rent',$$(p.rent))+stat('Annual expenses',$$(p.exp))+stat('Net annual income',$$(net),net<0?'neg':'pos')+stat('Gross / net yield',(ann/p.value*100).toFixed(1)+'% / '+(net/p.value*100).toFixed(1)+'%')+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
    if(p.fromProject&&p.spent)h+='<p class="sub" style="margin-top:10px">Includes '+$$(p.spent)+' of reno costs from when this was a project.</p>';
  }
  $('p1').innerHTML=h+'</div>'+(p.plan?planCard(p):'')+'<p class="hint">← all properties · add new →</p>';
  fillCur(p);
}
var SECS=[['ov','Overview'],['costs','Costs'],['tl','Timeline'],['loan','Mortgage']],SECS_R=[['ov','Overview'],['money','Money'],['ten','Tenancy'],['loan','Mortgage']],sec='ov';

// Portfolio totals for owned properties. Cash flow: rentals are rent less expenses and repayments; projects are their holding cost.
function loanPay(p){return p.loan?(p.ltype==='io'?p.loan*p.rate/1200:pmt(p.loan,p.rate,p.term||30)):0}
function cashFlow(p){return p.type==='rental'?((p.rent||0)*52-(p.exp||0))/12-loanPay(p):-(p.hold||loanPay(p))}
function portfolioCard(){
  var own=props.filter(function(p){return p.type!=='potential'});if(!own.length)return '';
  var val=sum(own,function(p){return p.value}),debt=sum(own,function(p){return p.loan}),eq=val-debt,cf=sum(own,cashFlow);
  return '<div class="card"><div class="row" style="cursor:default"><b>Portfolio</b><span class="sub">'+own.length+' owned</span></div>'+
    '<div class="grid">'+stat('Total value (est.)',$$(val))+stat('Total lending',$$(debt))+stat('Equity',$$(eq),eq<0?'neg':'pos')+stat('LVR',val?Math.round(debt/val*100)+'%':'–')+
    '<div class="stat wide"><b class="'+(cf<0?'neg':'pos')+'">'+$$(cf)+' a month</b><span>Cash flow: rent less expenses and mortgage repayments for rentals, holding costs for reno projects</span></div></div>'+
    '<p class="sub" style="margin-top:8px">Estimates only, based on the figures you’ve entered.</p></div>';
}

// Things that need attention, each pointing at the project section that deals with it.
function alerts(p){
  var a=[],today=iso(new Date());
  if(p.type==='potential')return a;
  if(p.loan&&p.fixTerm!=='float'){var rf=refixOf(p);if(rf){var d=dd(today,rf);if(d<=90)a.push({t:d<0?'Re-fix date passed':'Re-fix in '+d+' day'+(d===1?'':'s'),sec:'loan'})}}
  if(p.type==='project'){
    var it=p.items||[],cm=it.length?sum(it,cmt):(p.spent||0),un=sum(it,function(x){return x.paid?0:x.amt});
    if(p.budget&&cm>p.budget)a.push({t:'Over budget by '+$$(cm-p.budget),sec:'costs'});
    if(un)a.push({t:$$(un)+' unpaid',sec:'costs'});
    if(!p.done){
      var od=(p.tasks||[]).filter(function(x){return !x.ok&&x.d&&x.d<today}).length;
      if(od)a.push({t:od+' overdue milestone'+(od>1?'s':''),sec:'tl'});
      if(p.target&&p.target<today)a.push({t:'Past target finish',sec:'tl'});
    }
  }
  if(p.type==='rental'){
    var t=p.ten||{},left=t.le?dd(today,t.le):null,hl=hhLeft(p);
    if(left!==null&&left<=60)a.push({t:left<0?'Fixed term ended':'Lease ends in '+left+' day'+(left===1?'':'s'),sec:'ten'});
    if(t.bond&&!t.lodged)a.push({t:'Bond not lodged',sec:'ten'});
    if(hl)a.push({t:'Healthy Homes: '+hl+' to do',sec:'ten'});
  }
  return a;
}
function attnCard(){
  var h='',l=lastBackup(),bd=l?days(l):null;
  props.forEach(function(p,i){alerts(p).forEach(function(a){h+='<button class="att" data-x="att" data-i="'+i+'" data-sec="'+a.sec+'"><span>'+esc(p.addr)+'</span><b>'+esc(a.t)+'</b></button>'})});
  if(!isSample&&props.length&&(bd===null||bd>30))h+='<button class="att" data-x="tobk"><span>Backup</span><b>'+(l?'Last backup '+bd+' days ago':'Not backed up yet')+'</b></button>';
  return h?'<div class="card attn"><b>Needs attention</b>'+h+'</div>':'';
}

function list(){
  var own='',pot='';
  props.forEach(function(p,i){
    var pt=p.type==='potential',d=pt&&deal(p),fl=alerts(p);
    var line=pt?(p.intent==='rental'?'Yield on cost '+(d.cost?(d.ann/d.cost*100).toFixed(1):'0')+'% gross':'Est. profit '+$$(d.prof)):p.type==='project'?'Reno '+$$(p.spent)+' of '+$$(p.budget):$$(p.rent)+'/wk rent';
    var kind=pt?(p.intent==='rental'?'Buy to rent':'Reno to sell'):p.type==='project'?'Project':'Rental';
    // The property being viewed gets an accent border; deleting lives in its Edit details panel.
    var c='<div class="card row prop'+(i===cur?' cur':'')+'" data-i="'+i+'"'+(i===cur?' aria-current="true"':'')+'><div><b>'+esc(p.addr)+'</b><p class="sub">'+esc(p.sub)+' · '+kind+'</p><p class="sub">'+line+'</p>'+(fl.length?'<div class="flags">'+fl.map(function(a){return '<span class="flag">'+esc(a.t)+'</span>'}).join('')+'</div>':'')+'</div><i class="chev" aria-hidden="true">›</i></div>';
    if(pt)pot+=c;else own+=c;
  });
  $('p0').innerHTML=portfolioCard()+attnCard()+((own&&pot?'<p class="grp">Owned</p>':'')+own+(pot?'<p class="grp">Potential buys</p>'+pot:'')||'<div class="card"><p class="sub">Nothing added yet.</p></div>')+iosHint();
  if(!$('settings').hidden)drawSettings();
}
