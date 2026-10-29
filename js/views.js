// Current property view, alerts and the property list.
function loanCard(p){
  if(!p.loan)return '<div class="card row" style="cursor:default"><span class="sub">No mortgage added</span><button class="edit" id="editloan">Add mortgage</button></div>';
  var io=p.loan*p.rate/1200,pi=pmt(p.loan,p.rate,p.term||30),isIO=p.ltype==='io';
  var now=isIO?io:pi,alt=isIO?pi:io;
  var rf=refixOf(p),fl=p.fixTerm==='float';
  var d=rf?dd(iso(new Date()),rf):null;
  var when=fl?'Floating rate':d===null?'No re-fix date':(d<0?'Re-fix date passed':'Re-fix in '+d+' days');
  var dt=fl?'Can change anytime':rf?new Date(rf+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}):'–';
  return '<div class="card"><div class="row" style="cursor:default">'+hd('percent','Mortgage')+'<button class="edit" id="editloan">Edit mortgage</button></div><p class="sub">'+$$(p.loan)+' at '+p.rate+'% · '+(isIO?'Interest-only':'Principal &amp; interest')+'</p>'+
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
// Property types: label, icon, and the class for their colour (cover, thumbnail and tag).
var TYPE={project:['Renovation project','tool','c-proj'],rental:['Rental','key','c-rent'],potential:['Potential buy','search','c-pot']};
function thumb(p){var t=TYPE[p.type];return '<span class="ph '+t[2]+'">'+(p.photo?'<img data-rc="'+esc(p.photo.id)+'" alt="">':ic(t[1]))+'</span>'}
function signed(n,suf){return '<span class="'+(n<0?'neg':'pos')+'">'+(n<0?'−':'+')+$$(Math.abs(n))+(suf||'')+'</span>'}
// The one number that matters most for each property, used for its page and its card in the list.
function headline(p){
  if(p.type==='project'){var g=p.value-basis(p),used=p.budget?Math.round(p.spent/p.budget*100):0;
    return {lab:'Equity gain after reno',big:signed(g),short:'equity gain',tag:'Reno · '+used+'% of budget',bar:used,
      sub:$$(p.spent)+' of '+$$(p.budget)+' budget spent'+(p.items&&p.items.length?' · '+$$(sum(p.items,cmt))+' committed':'')}}
  if(p.type==='rental'){var cf=cashFlow(p);
    return {lab:'Cash flow after mortgage',big:signed(cf,' a month'),short:'a month',num:signed(cf),tag:'Rental · '+$$(p.rent)+'/wk',
      sub:$$(p.rent)+' a week rent · '+(p.value?(p.rent*52/p.value*100).toFixed(1):'0')+'% gross yield'}}
  var d=deal(p);
  if(p.intent==='rental')return {lab:'Gross yield on total cost',big:(d.cost?(d.ann/d.cost*100).toFixed(1):'0')+'%',short:'yield on cost',tag:'Buy to rent',sub:'Total cost in '+$$(d.cost)+' · '+$$(p.rent||0)+' a week rent'};
  return {lab:'Estimated profit, before tax',big:signed(d.prof),short:'est. profit',tag:'Reno to sell',sub:'Return on costs '+pct(d.roc)+' · asking '+$$(p.price)};
}
function rows(r){return '<div class="card list">'+r.filter(Boolean).map(function(x){return '<div class="r"><span>'+x[0]+'</span><b class="'+(x[2]||'')+'">'+x[1]+'</b></div>'}).join('')+'</div>'}
// A property's page: cover photo, headline number, then its sections.
function current(){
  var p=props[cur];
  if(!p){$('p1').innerHTML='<div class="pagebar"><button class="pback" data-back aria-label="Back">'+ic('back')+'</button></div><div class="card"><p class="sub">No property selected.</p></div>';return}
  var T=TYPE[p.type],hl=headline(p),pt=p.type==='potential';
  var h='<div class="cover '+T[2]+'">'+(p.photo?'<img data-rc="'+esc(p.photo.id)+'" alt="">':'<span class="cvic">'+ic(T[1])+'</span>')+
    '<button class="cback" data-back aria-label="Back">'+ic('back')+'</button>'+
    '<label class="cphoto">'+ic('camera')+(p.photo?'Change photo':'Add photo')+'<input type="file" class="phin" accept="image/*" hidden></label>'+
    '<div class="ctext"><h1>'+esc(p.addr)+'</h1><p>'+[esc(p.sub),T[0],pt?hl.tag:''].filter(Boolean).join(' · ')+'</p></div></div>'+
    '<div class="card herocard"><div class="row" style="cursor:default"><span class="sub">'+hl.lab+'</span><button class="edit" id="edit">Edit details</button></div>'+
    '<div class="big2">'+hl.big+'</div>'+(hl.bar!==undefined?'<div class="bar"><i class="'+(hl.bar>100?'over':'')+'" style="width:'+Math.min(hl.bar,100)+'%"></i></div>':'')+'<p class="sub">'+hl.sub+'</p></div>';
  if(pt){$('p1').innerHTML=h+potView(p);fillCur(p);if(nearOpen)drawNear();return}
  var pr=p.type==='project',S=pr?SECS:SECS_R;
  if(!S.some(function(s){return s[0]===sec}))sec='ov';
  // Owned properties are split into sections so the page stays short on a phone. A dot marks a section with something to deal with.
  var flag={};alerts(p).forEach(function(a){flag[a.sec]=1});
  h+='<div class="secnav">'+S.map(function(s){return '<button data-x="sec" data-sec="'+s[0]+'" class="'+(sec===s[0]?'on':'')+(flag[s[0]]?' dot':'')+'">'+s[1]+'</button>'}).join('')+'</div>';
  var body={costs:costCard,tl:timeCard,money:moneyCard,ten:tenCard,loan:loanCard}[sec];
  if(body){$('p1').innerHTML=h+body(p);fillCur(p);return}
  if(pr){
    var left=p.budget-p.spent;
    h+=rows([['Purchase price',$$(p.price)],['Est. value now',$$(p.value)],['Total cost in',$$(basis(p))],['Budget remaining',$$(left),left<0?'neg':''],['Days owned',dOwn(p)]]);
    if(p.done)h+='<div class="card">'+toRentBlock(p)+'</div>';
  }else{
    var ann=p.rent*52,net=ann-p.exp;
    h+=rows([['Weekly rent',$$(p.rent)],['Annual expenses',$$(p.exp)],['Net annual income',$$(net),net<0?'neg':'pos'],['Gross / net yield',(ann/p.value*100).toFixed(1)+'% / '+(net/p.value*100).toFixed(1)+'%'],
      ['Purchase price',$$(p.price)],['Est. value now',$$(p.value)],['Total cost in',$$(basis(p))],['Days owned',dOwn(p)]]);
    if(p.fromProject&&p.spent)h+='<p class="sub" style="margin:-4px 4px 12px">Includes '+$$(p.spent)+' of reno costs from when this was a project.</p>';
  }
  $('p1').innerHTML=h+(p.plan?planCard(p):'');
  fillCur(p);
}
var SECS=[['ov','Overview'],['costs','Costs'],['tl','Timeline'],['loan','Mortgage']],SECS_R=[['ov','Overview'],['money','Money'],['ten','Tenancy'],['loan','Mortgage']],sec='ov';
// Cover photo: one image per property, stored with the receipt files and included in backups.
function addPhoto(p,f){
  shrink(f).then(function(b){var r={id:uid(),name:f.name,type:b.type||f.type,added:iso(new Date())};return rcPut(Object.assign({blob:b},r)).then(function(){return r})})
    .then(function(r){if(p.photo)rcDel([p.photo.id]);p.photo=r;isSample=false;render()}).catch(function(){});
}

// Portfolio totals for owned properties. Cash flow: rentals are rent less expenses and repayments; projects are their holding cost.
function loanPay(p){return p.loan?(p.ltype==='io'?p.loan*p.rate/1200:pmt(p.loan,p.rate,p.term||30)):0}
function cashFlow(p){return p.type==='rental'?((p.rent||0)*52-(p.exp||0))/12-loanPay(p):-(p.hold||loanPay(p))}

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
// Properties tab: filter chips, then a card per property with its photo, type and headline number.
// An amber dot on the photo means something needs attention. Deleting lives in a property's Edit details panel.
var propFilter='all',FILTERS=[['all','All'],['project','Reno projects'],['rental','Rentals'],['potential','Potential buys']];
function list(){
  var own=props.filter(function(p){return p.type!=='potential'}).length,shown=props.map(function(p,i){return i}).filter(function(i){return propFilter==='all'||props[i].type===propFilter});
  var h='<h1 class="ptitle">Properties</h1><p class="sub">'+own+' owned · '+(props.length-own)+' potential buy'+(props.length-own===1?'':'s')+'</p>'+
    '<div class="chips">'+FILTERS.map(function(f){return '<button data-f="'+f[0]+'" class="'+(propFilter===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>';
  h+=shown.map(function(i){
    var p=props[i],hl=headline(p),T=TYPE[p.type];
    return '<button class="card prop" data-i="'+i+'">'+thumb(p)+(alerts(p).length?'<span class="adot" title="Needs attention"></span>':'')+
      '<span class="info"><b>'+esc(p.addr)+'</b><span class="sub">'+esc(p.sub)+'</span><span class="tag t-'+p.type+'">'+hl.tag+'</span></span>'+
      '<span class="num"><b>'+(hl.num||hl.big)+'</b><span>'+hl.short+'</span></span></button>';
  }).join('')||'<div class="card"><p class="sub">'+(props.length?'Nothing here yet.':'No properties yet.')+'</p><button class="go" data-x="hadd">Add a property</button></div>';
  $('p0').innerHTML=h;fillThumbs();
}
