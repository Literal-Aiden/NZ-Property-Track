// Potential buys: deal maths, holding costs, plan vs actual and converting to a project.
// Deal maths for a potential buy. All figures are the user's estimates.
function deal(p){
  var hold=(p.hold||0)*(p.months||0),cost=p.price+(p.legal||0)+(p.extra||0)+(p.reno||0)+hold,all=cost+(p.sell||0),ann=(p.rent||0)*52,net=ann-(p.exp||0);
  return {hold:hold,cost:cost,all:all,prof:p.value-all,roc:all?(p.value-all)/all*100:0,ann:ann,net:net};
}
// Monthly holding cost for a potential buy: the bills plus the actual loan repayment (interest-only, or principal & interest),
// so it's as close as possible to what goes out each month.
function repay(x){return x.loan?(x.ltype==='io'?x.loan*(x.rate||0)/1200:pmt(x.loan,x.rate||0,x.term||30)):0}
function holdOf(x){return (x.rates||0)/12+(x.ins||0)/12+(x.power||0)+(x.oth||0)+repay(x)}
function holdCalc(){
  var o=$('holdout');if(!o)return;
  var x={rates:num('f_rates'),ins:num('f_ins'),power:num('f_power'),oth:num('f_oth'),loan:num('f_loan'),rate:num('f_rate'),ltype:newLoan,term:num('f_term')},m=holdOf(x),n=num('f_months'),r=repay(x),io=x.loan*x.rate/1200;
  o.textContent=m?'Holding costs: '+$$(m)+' a month'+(n?' · '+$$(m*n)+' over '+n+' month'+(n===1?'':'s'):''):'';
  $('loanout').textContent=!r?'':x.ltype==='io'?'Includes interest-only repayments of '+$$(r)+' a month. Estimate only.'
    :'Includes principal & interest repayments of '+$$(r)+' a month over '+(x.term||30)+' years. About '+$$(r-io)+' of that pays down the loan rather than being a cost. Estimate only.';
}
function potView(p){
  var flip=p.intent!=='rental',d=deal(p);
  var h='<div class="card"><div class="row" style="cursor:default"><span class="badge">Potential · '+(flip?'Reno to sell':'Buy to rent')+'</span><button class="edit" id="edit">Edit details</button></div><h1>'+esc(p.addr)+'</h1><p class="sub">'+[esc(p.sub),p.beds?p.beds+' bed':'',p.land?p.land+' m² land':''].filter(Boolean).join(' · ')+'</p>';
  h+='<div class="grid">'+(flip
    ?stat('Asking / offer price',$$(p.price))+stat('Est. sale price',$$(p.value))+stat('Est. profit',$$(d.prof),d.prof<0?'neg':'pos')+stat('Return on costs',pct(d.roc),d.prof<0?'neg':'')
    :stat('Total cost in',$$(d.cost))+stat('Est. value after reno',$$(p.value))+stat('Equity after reno',$$(p.value-d.cost),p.value<d.cost?'neg':'pos')+stat('Gross / net yield on cost',d.cost?(d.ann/d.cost*100).toFixed(1)+'% / '+(d.net/d.cost*100).toFixed(1)+'%':'–')+stat('Weekly rent',$$(p.rent||0))+stat('Net annual income',$$(d.net),d.net<0?'neg':''))+'</div>';
  var lines=[['Purchase price',p.price],['Legal &amp; other purchase costs',(p.legal||0)+(p.extra||0)],['Renovation',p.reno||0],['Holding ('+(p.months||0)+' mo × '+$$(p.hold||0)+')',d.hold]];
  if(flip)lines.push(['Selling costs',p.sell||0]);
  h+='<div class="lines">'+lines.map(function(l){return '<div><span>'+l[0]+'</span><b>'+$$(l[1])+'</b></div>'}).join('')+'<div class="tot"><span>Total cost</span><b>'+$$(flip?d.all:d.cost)+'</b></div></div>';
  h+='<p class="sub" style="margin-top:10px">'+(flip?'Estimates only. Profit is before tax: check current IRD guidance on tax for property bought to sell.':'Estimates only. Yield is on total cost in, not the asking price.')+'</p>'+convBlock()+'</div>';
  h+=offerCard(p);
  var c=p.comps||[];
  h+='<div class="card">'+hd('pin','Comparable sales nearby')+'';
  if(c.length){
    var pr=c.map(function(x){return x.price}),m=med(pr),hi=Math.max.apply(null,pr),lo=Math.min.apply(null,pr);
    h+='<div class="grid">'+stat('Median of '+c.length+' sale'+(c.length>1?'s':''),$$(m))+stat('Your estimate vs median',p.value?pct((p.value-m)/m*100):'–')+'</div><p class="sub" style="margin-top:8px">Range '+$$(lo)+' – '+$$(hi)+'</p>';
    if(p.value>hi)h+='<p class="sub neg" style="margin-top:4px">Your estimate is above every sale listed.</p>';
    h+=c.map(function(x,i){return '<div class="comp"><div><b>'+esc(x.addr)+'</b><p class="sub">'+[esc(x.sub),x.date?'Sold '+fmtD(x.date):'',esc(x.note||'')].filter(Boolean).join(' · ')+'</p></div><div class="cr"><b>'+$$(x.price)+'</b><button class="edit del" data-c="'+i+'">Remove</button></div></div>'}).join('');
  }else h+='<p class="sub" style="margin-top:6px">No sales added yet. Add recent sales of similar homes nearby to check your '+(flip?'sale price':'value')+' estimate.</p>';
  h+=salesBlock(p)+'<p class="grp" style="margin:18px 0 0">Add a sale by hand</p><label>Address of sold property</label><div class="ac"><input id="c_addr" class="acin" data-sub="c_sub" data-next="c_price" placeholder="Start typing an address" autocomplete="off"><div class="sugg" role="listbox" hidden></div></div>'+
   '<label>Suburb / city</label><input id="c_sub">'+
   '<div class="grid" style="margin-top:0"><div><label>Sale price (NZD)</label><input id="c_price"'+MONEY+'</div><div><label>Date sold</label><input id="c_date" type="date"></div></div>'+
   '<label>Notes (beds, land, condition)</label><input id="c_note">'+
   '<button class="go" id="addcomp">Add sale</button></div>';
  return h;
}
// Plan vs actual for a project converted from a potential buy. p.plan keeps the original estimates.
function planCard(p){
  var q=p.plan,flip=q.intent!=='rental',it=p.items||[],cm=it.length?sum(it,cmt):(p.spent||0),mo=(days(p.date)||0)/30.44;
  var R=[['Purchase price',q.price||0,p.price],['Legal &amp; purchase costs',(q.legal||0)+(q.extra||0),(p.legal||0)+(p.extra||0)],['Reno (committed so far)',q.reno||0,cm],['Holding ('+mo.toFixed(1)+' of '+(q.months||0)+' months)',(q.hold||0)*(q.months||0),(p.hold||0)*mo]];
  var planCost=sum(R,function(r){return r[1]}),nowCost=(p.price||0)+(p.legal||0)+(p.extra||0)+Math.max(cm,p.budget||0)+(p.hold||0)*Math.max(q.months||0,mo),sell=q.sell||0;
  var h='<div class="card">'+hd('chart','Plan vs actual')+'<p class="sub">Your estimates from when this was a potential buy ('+(flip?'reno to sell':'buy to rent')+').</p>'+
    '<div class="vs"><div class="hd"><span></span><span>Plan</span><span>Actual</span></div>'+R.map(function(r){return '<div><span>'+r[0]+'</span><span>'+$$(r[1])+'</span><span class="'+(r[2]>r[1]?'neg':'')+'">'+$$(r[2])+'</span></div>'}).join('')+'</div>';
  h+='<div class="grid">'+stat('Total cost (plan)',$$(planCost))+stat('Total cost (projected now)',$$(nowCost),nowCost>planCost?'neg':'')+(flip
    ?stat('Profit at plan',$$(q.value-planCost-sell),q.value-planCost-sell<0?'neg':'pos')+stat('Profit now, same sale price',$$(q.value-nowCost-sell),q.value-nowCost-sell<0?'neg':'pos')
    :stat('Equity after reno (plan)',$$(q.value-planCost),q.value<planCost?'neg':'pos')+stat('Equity after reno (now)',$$(q.value-nowCost),q.value<nowCost?'neg':'pos'))+'</div>';
  return h+'<p class="sub" style="margin-top:10px">Projected now uses your reno budget or costs committed, whichever is higher, and holding for the planned months or the months held so far, whichever is longer. '+
    (flip?'Sale price '+$$(q.value)+' and selling costs '+$$(sell)+' are from your plan. Profit is before tax: check current IRD guidance. ':'Value after reno '+$$(q.value)+' is from your plan. ')+'Estimates only.</p></div>';
}
var convOpen=false;
function convBlock(){
  if(!convOpen)return '<button class="go ghost" data-x="conv">Bought it? Track it as a reno project</button>';
  var N=MONEY;
  return '<div class="near" id="conv">'+hd('tool','Track as a reno project')+'<p class="sub" style="margin-top:4px">Enter what it actually cost. Your estimates are kept so you can compare plan vs actual as the reno goes.</p>'+
   '<div class="grid" style="margin-top:0"><div><label>Purchase price</label><input id="v_price" required'+N+'</div><div><label>Purchase date</label><input id="v_date" type="date" required></div>'+
   '<div><label>Reno budget</label><input id="v_budget" required'+N+'</div><div><label>Value now (optional)</label><input id="v_value" placeholder="Purchase price"'+N+'</div></div>'+
   '<label>Legal fees and other purchase costs (optional)</label><input id="v_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<div class="btns"><button class="go" data-x="convok">Convert</button><button class="go ghost" data-x="convno">Cancel</button></div></div>';
}
// Maximum offer: works back from a target profit (reno to sell) or yield on total cost (buy to rent),
// keeping every other estimate as entered. The target is saved on the property as p.tgt (and p.tgtT: gross or net).
function offerCard(p){
  var flip=p.intent!=='rental',net=p.tgtT==='net';
  return '<div class="card" id="offer">'+hd('target','Maximum offer')+'<p class="sub" style="margin-top:4px">'+(flip?'Enter the profit you want, and this works back to the most you could pay.':'Enter the yield you want on total cost, and this works back to the most you could pay.')+'</p>'+
    (flip?'<label>Target profit, before tax</label><input id="o_tgt"'+MONEY
      :'<div class="seg" style="margin-top:10px"><button data-x="oyt" data-v="gross" class="'+(net?'':'on')+'">Gross yield</button><button data-x="oyt" data-v="net" class="'+(net?'on':'')+'">Net yield</button></div><label>Target '+(net?'net':'gross')+' yield %</label><input id="o_tgt"'+NUM)+
    '<p class="sub" id="o_out" style="margin-top:10px"></p></div>';
}
function offerCalc(p){
  var o=$('o_out'),e=$('o_tgt');if(!o||!e)return;
  var t=num('o_tgt'),flip=p.intent!=='rental',d=deal(p),other=(p.legal||0)+(p.extra||0)+(p.reno||0)+d.hold,max;
  if(!e.value.trim()||(!flip&&t<=0)){o.textContent='';return}
  max=flip?p.value-(p.sell||0)-other-t:(p.tgtT==='net'?d.net:d.ann)/(t/100)-other;
  o.innerHTML=max<=0?'<span class="neg">That target can’t be reached with these figures.</span>'
    :'<b class="'+(max<p.price?'neg':'pos')+'" style="font-size:18px">Up to '+$$(max)+'</b><br>'+(max>=p.price?$$(max-p.price)+' above':$$(p.price-max)+' below')+' your asking / offer price of '+$$(p.price)+'. Assumes the reno, holding and other costs you entered stay the same. Estimate only.';
}
function convert(i){
  if(missing($('conv')))return;
  var p=props[i],d=$('v_date').value;
  var n={type:'project',addr:p.addr,sub:p.sub,price:num('v_price'),date:d,legal:num('v_legal'),extra:0,value:num('v_value')||num('v_price'),budget:num('v_budget'),spent:0,hold:p.hold||0,start:d,
    plan:{intent:p.intent||'flip',price:p.price,legal:p.legal,extra:p.extra,reno:p.reno,hold:p.hold,months:p.months,sell:p.sell,value:p.value,rent:p.rent,exp:p.exp,converted:iso(new Date())}};
  ['beds','land','comps'].forEach(function(k){if(p[k])n[k]=p[k]});
  if(p.loan){n.loan=p.loan;n.rate=p.rate;n.ltype=p.ltype||'pi';n.term=p.term||30}   // the estimated loan becomes the project's mortgage, to edit once it's fixed
  props[i]=n;convOpen=false;nearOpen=false;isSample=false;render();
}
