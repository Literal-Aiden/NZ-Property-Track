// Tools and calculators, opened from the header. Each calculator lists its fields and a calc() that returns
// the result HTML (or '' until there's enough to work with). Field: {i id, l label, k 'm' money | 'n' number | 's' select,
// d default, o select options, opt optional, ph placeholder, show(v) when to show it, wide full width}.
// Last-used inputs are kept per calculator in localStorage (nzpt.tools.v1), on this device only.
var TKEY='nzpt.tools.v1',toolCur=null;
function toolMem(){try{return JSON.parse(localStorage.getItem(TKEY))||{}}catch(e){return {}}}
function toolSave(id,raw){var m=toolMem();m[id]=raw;try{localStorage.setItem(TKEY,JSON.stringify(m))}catch(e){}}
// Repayment per period, with ppy payments a year (12 monthly, 26 fortnightly, 52 weekly).
function repayP(l,rate,years,ppy,io){if(!l)return 0;var r=(rate||0)/100/ppy,n=(years||30)*ppy;return io?l*r:r?l*r/(1-Math.pow(1+r,-n)):l/n}
function tres(big,label,lines,note){
  return '<div class="tres"><b>'+big+'</b><span>'+label+'</span></div>'+
    '<div class="lines">'+lines.filter(Boolean).map(function(l){return '<div><span>'+l[0]+'</span><b class="'+(l[2]||'')+'">'+l[1]+'</b></div>'}).join('')+'</div>'+
    (note?'<p class="sub" style="margin-top:10px">'+note+'</p>':'');
}
var LOANT=[['pi','Principal & interest'],['io','Interest-only']];
function hasLoan(v){return v.loan>0}
function isTier(v){return v.ctype==='tier'}
var GST=0.15;   // NZ standard GST rate; fixed here at the owner's request rather than a field

var TOOLS=[
 {id:'deal',icon:'check',name:'Quick deal check',desc:'Profit or yield in seconds, then save it as a potential buy',
  from:function(p){return p.type==='potential'&&{plan:p.intent||'flip',price:p.price,reno:p.reno,legal:(p.legal||0)+(p.extra||0),rates:p.rates,ins:p.ins,othm:p.oth!==undefined?(p.oth||0)+(p.power||0)+repay(p):p.hold,months:p.months,value:p.value,value2:p.value,sell:p.sell,rent:p.rent,exp:p.exp}},
  f:[{i:'plan',l:'Plan',k:'s',d:'flip',o:[['flip','Reno to sell'],['rental','Buy to rent']],wide:1},
     {i:'price',l:'Asking / offer price',k:'m'},{i:'reno',l:'Reno estimate',k:'m'},
     {i:'legal',l:'Legal & purchase costs',k:'m',opt:1,wide:1},
     {i:'rates',l:'Rates per year',k:'m'},{i:'ins',l:'Insurance per year',k:'m'},
     {i:'othm',l:'Loan & other / month',k:'m',opt:1},{i:'months',l:'Months held',k:'n'},
     {i:'value',l:'Sale price after reno',k:'m',show:function(v){return v.plan==='flip'}},
     {i:'sell',l:'Selling costs',k:'m',show:function(v){return v.plan==='flip'}},
     {i:'value2',l:'Value after reno',k:'m',show:function(v){return v.plan!=='flip'}},
     {i:'rent',l:'Weekly rent',k:'m',show:function(v){return v.plan!=='flip'}},
     {i:'exp',l:'Annual expenses',k:'m',show:function(v){return v.plan!=='flip'}}],
  calc:function(v){
    var flip=v.plan==='flip',p=dealOf(v),d=deal(p);if(!v.price||!p.value)return '';
    var save='<button class="go" data-x="tsave">Save as potential buy</button>';
    return flip?tres($$(d.prof),'estimated profit, before tax',[['Total cost incl. selling',$$(d.all)],['Return on costs',pct(d.roc),d.prof<0?'neg':''],['Holding ('+(v.months||0)+' months × '+$$(p.hold)+')',$$(d.hold)]],'Estimates only. Check current IRD guidance on tax for property bought to sell.')+save
      :tres(d.cost?(d.ann/d.cost*100).toFixed(1)+'%':'–','gross yield on total cost',[['Net yield on total cost',d.cost?(d.net/d.cost*100).toFixed(1)+'%':'–'],['Total cost in',$$(d.cost)],['Equity after reno',$$(p.value-d.cost),p.value<d.cost?'neg':'pos']],'Estimates only. Yield is on total cost in, not the asking price.')+save;
  }},
 {id:'mort',icon:'percent',name:'Mortgage repayments',desc:'Repayments for any loan, rate and how often you pay',
  from:function(p){return p.loan&&{loan:p.loan,rate:p.rate,term:p.term||30,type:p.ltype||'pi'}},
  f:[{i:'loan',l:'Loan amount',k:'m'},{i:'rate',l:'Interest rate %',k:'n'},
     {i:'term',l:'Term in years',k:'n',d:'30'},{i:'freq',l:'Pay',k:'s',d:'12',o:[['12','Monthly'],['26','Fortnightly'],['52','Weekly']]},
     {i:'type',l:'Loan type',k:'s',d:'pi',o:LOANT,wide:1}],
  calc:function(v){
    if(!v.loan||!v.rate)return '';
    var ppy=+v.freq,io=v.type==='io',term=v.term||30,per=repayP(v.loan,v.rate,term,ppy,io),alt=repayP(v.loan,v.rate,term,ppy,!io),word={12:'month',26:'fortnight',52:'week'}[ppy];
    return tres($$(per),'a '+word+(io?', interest-only':', principal & interest'),[
      [(io?'Principal & interest':'Interest-only')+' instead',$$(alt)+' a '+word],
      ['Monthly equivalent',$$(per*ppy/12)],
      io?['Interest per year',$$(per*ppy)]:['Total interest over '+term+' years',$$(per*ppy*term-v.loan)]],
      'Estimate only, assuming the rate stays the same for the whole term. Your bank’s figures may differ slightly.');
  }},
 {id:'yield',icon:'trend',name:'Rental yield',desc:'Gross and net yield from price and rent',
  from:function(p){return p.rent&&{price:p.value||p.price,rent:p.rent,exp:p.exp}},
  f:[{i:'price',l:'Price or value',k:'m'},{i:'rent',l:'Weekly rent',k:'m'},{i:'exp',l:'Annual expenses',k:'m',opt:1,wide:1,ph:'Rates, insurance, maintenance, management'}],
  calc:function(v){
    if(!v.price||!v.rent)return '';var a=v.rent*52,net=a-v.exp;
    return tres((a/v.price*100).toFixed(2)+'%','gross yield',[['Net yield',(net/v.price*100).toFixed(2)+'%',net<0?'neg':''],['Rent per year',$$(a)],['Net income per year',$$(net),net<0?'neg':'']],
      'Gross yield is a year’s rent divided by the price. Net yield takes off the expenses you enter, but not mortgage repayments.');
  }},
 {id:'hold',icon:'clock',name:'Holding costs',desc:'What a property costs to hold each month',
  from:function(p){return p.type==='potential'&&{rates:p.rates,ins:p.ins,power:p.power,oth:p.oth,loan:p.loan,rate:p.rate,type:p.ltype||'pi',term:p.term||30,months:p.months}},
  f:[{i:'rates',l:'Rates per year',k:'m'},{i:'ins',l:'Insurance per year',k:'m'},
     {i:'power',l:'Power / month',k:'m',opt:1},{i:'oth',l:'Other / month',k:'m',opt:1,ph:'e.g. water, lawns'},
     {i:'loan',l:'Loan amount',k:'m',opt:1},{i:'rate',l:'Interest rate %',k:'n',show:hasLoan},
     {i:'type',l:'Loan type',k:'s',d:'pi',o:LOANT,show:hasLoan},{i:'term',l:'Term in years',k:'n',d:'30',show:hasLoan},
     {i:'months',l:'Months held',k:'n',opt:1,wide:1}],
  calc:function(v){
    var x={rates:v.rates,ins:v.ins,power:v.power,oth:v.oth,loan:v.loan,rate:v.rate,ltype:v.type,term:v.term},m=holdOf(x),r=repay(x);if(!m)return '';
    return tres($$(m),'a month',[['Rates',$$(v.rates/12)+' / mo'],['Insurance',$$(v.ins/12)+' / mo'],v.power?['Power',$$(v.power)+' / mo']:null,v.oth?['Other',$$(v.oth)+' / mo']:null,
      r?['Loan repayment ('+(v.type==='io'?'interest-only':'P&I')+')',$$(r)+' / mo']:null,v.months?['Over '+v.months+' months',$$(m*v.months)]:null],
      'Counts the full loan repayment, so it’s close to what actually goes out each month. Estimates only.');
  }},
 {id:'even',icon:'chart',name:'Break-even rent',desc:'The weekly rent that covers the mortgage and costs',
  from:function(p){return p.type==='rental'&&{loan:p.loan,rate:p.rate,type:p.ltype||'pi',term:p.term||30,oth:p.exp,cur:p.rent}},
  f:[{i:'loan',l:'Loan amount',k:'m'},{i:'rate',l:'Interest rate %',k:'n'},
     {i:'type',l:'Loan type',k:'s',d:'pi',o:LOANT},{i:'term',l:'Term in years',k:'n',d:'30'},
     {i:'rates',l:'Rates per year',k:'m',opt:1},{i:'ins',l:'Insurance per year',k:'m',opt:1},
     {i:'maint',l:'Maintenance / year',k:'m',opt:1},{i:'oth',l:'Other / year',k:'m',opt:1},
     {i:'pm',l:'Management fee %',k:'n',opt:1},{i:'vac',l:'Vacant weeks / year',k:'n',opt:1},
     {i:'cur',l:'Current weekly rent',k:'m',opt:1,wide:1}],
  calc:function(v){
    var rep=repayP(v.loan,v.rate,v.term||30,12,v.type==='io')*12,other=v.rates+v.ins+v.maint+v.oth,costs=rep+other;if(!costs)return '';
    var need=costs/Math.max(1,52-v.vac)/(1-Math.min(v.pm,90)/100),gap=v.cur-need;
    return tres($$(need),'weekly rent to break even',[['Mortgage repayments per year',$$(rep)],['Other costs per year',$$(other)],
      v.pm?['Management fee','included at '+v.pm+'%']:null,v.vac?['Allows for',v.vac+' vacant week'+(v.vac===1?'':'s')]:null,
      v.cur?['At '+$$(v.cur)+' a week',(gap>=0?$$(gap)+' a week spare':$$(-gap)+' a week short'),gap>=0?'pos':'neg']:null],
      'Before tax. Principal & interest repayments include principal, which builds your equity. Estimates only.');
  }},
 {id:'equity',icon:'pie',name:'Usable equity',desc:'Equity you could borrow against for the next purchase',
  all:1,
  f:[{i:'val',l:'Total property value',k:'m'},{i:'debt',l:'Total lending',k:'m'},
     {i:'lvr',l:'Max LVR %',k:'n',d:'80'},{i:'dep',l:'Deposit % for next buy',k:'n',d:'30'}],
  calc:function(v){
    if(!v.val)return '';var use=Math.max(0,v.val*v.lvr/100-v.debt),next=v.dep?use/(v.dep/100):0;
    return tres($$(use),'usable equity at '+v.lvr+'% LVR',[['Current LVR',Math.round(v.debt/v.val*100)+'%'],['Equity in total',$$(v.val-v.debt)],
      v.dep?['Next purchase this could support',$$(next)]:null],
      'LVR limits for investors are set by banks and the Reserve Bank, and they change. Check current rules with your bank or broker. This doesn’t check whether your income can support more lending.');
  }},
 {id:'sell',icon:'dollar',name:'Selling costs',desc:'Agent commission, GST, marketing and legal',
  from:function(p){return p.value&&{price:p.value}},
  f:[{i:'price',l:'Sale price',k:'m',wide:1},
     {i:'ctype',l:'Commission',k:'s',d:'tier',o:[['tier','Tiered %'],['pct','Flat %'],['fee','Flat $ fee']],wide:1},
     {i:'t1',l:'Commission %',k:'n',d:'3.95',show:isTier},{i:'cap',l:'…on the first',k:'m',d:'400000',show:isTier},
     {i:'t2',l:'% on the rest',k:'n',d:'2',show:isTier},
     {i:'fp',l:'Commission %',k:'n',d:'2.5',show:function(v){return v.ctype==='pct'}},
     {i:'fa',l:'Flat fee',k:'m',d:'15000',show:function(v){return v.ctype==='fee'}},
     {i:'gst',l:'GST',k:'s',d:'plus',o:[['plus','Plus GST'],['none','No GST']]},
     {i:'extra',l:'Marketing, legal & other',k:'m',opt:1,wide:1,ph:'e.g. marketing, lawyer, staging'}],
  calc:function(v){
    if(!v.price)return '';var comm=v.ctype==='pct'?v.price*v.fp/100:v.ctype==='fee'?v.fa:Math.min(v.price,v.cap)*v.t1/100+Math.max(0,v.price-v.cap)*v.t2/100,g=v.gst==='plus'?comm*GST:0,tot=comm+g+v.extra;
    return tres($$(tot),'total selling costs, '+(tot/v.price*100).toFixed(1)+'% of the price',[['Commission',$$(comm)],g?['GST on commission',$$(g)]:null,
      v.extra?['Marketing, legal and other',$$(v.extra)]:null,['You’d receive',$$(v.price-tot),'pos']],
      'The default rates and fee are examples: enter what you’ve been quoted, as it differs by agency.');
  }}
];
// Quick deal check fields as a potential buy, so deal() does the maths.
function dealOf(v){var f=v.plan==='flip';return {price:v.price,reno:v.reno,legal:v.legal,hold:v.rates/12+v.ins/12+v.othm,months:v.months,value:f?v.value:v.value2,sell:f?v.sell:0,rent:f?0:v.rent,exp:f?0:v.exp}}

function toolById(id){return TOOLS.filter(function(t){return t.id===id})[0]}
function tfield(f){
  var id='q_'+f.i,inp=f.k==='s'?'<select id="'+id+'">'+f.o.map(function(o){return '<option value="'+o[0]+'">'+esc(o[1])+'</option>'}).join('')+'</select>'
    :'<input id="'+id+'"'+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+(f.k==='m'?MONEY:NUM);
  return '<div id="w_'+f.i+'"'+(f.wide?' class="wide"':'')+'><label>'+f.l+(f.opt?OPT:'')+'</label>'+inp+'</div>';
}
function drawTools(){
  var t=toolCur&&toolById(toolCur),done='<button class="edit" data-x="tclose">Done</button>';
  if(!t){
    $('toolbody').innerHTML='<div class="row" style="cursor:default;margin-bottom:12px"><b class="ftitle" id="tooltitle">Tools &amp; calculators</b>'+done+'</div><div class="tgrid">'+
      TOOLS.map(function(t){return '<button class="tile" data-tool="'+t.id+'"><span class="tico">'+ic(t.icon)+'</span><b>'+t.name+'</b><span class="sub">'+t.desc+'</span></button>'}).join('')+'</div>';
    return;
  }
  var srcs=t.from?props.map(function(p,i){return t.from(p)?'<option value="'+i+'">'+esc(p.addr)+'</option>':''}).join(''):'';
  $('toolbody').innerHTML='<div class="row" style="cursor:default"><button class="back" data-x="thome" style="padding:0">‹ All tools</button>'+done+'</div>'+
    '<div class="card enter" style="margin-top:10px"><span class="hd" id="tooltitle">'+ic(t.icon)+'<b>'+t.name+'</b></span><p class="sub" style="margin-top:4px">'+t.desc+'</p>'+
    (srcs?'<select id="q_from" style="margin-top:12px"><option value="">Fill in from a property…</option>'+srcs+'</select>':'')+
    (t.all&&props.some(function(p){return p.type!=='potential'})?'<button class="edit" data-x="tport" style="margin-top:12px">Use my portfolio</button>':'')+
    '<div class="fgrid">'+t.f.map(tfield).join('')+'</div><div class="tout" id="q_out"></div></div>';
  var mem=toolMem()[t.id]||{};
  t.f.forEach(function(f){var e=$('q_'+f.i),v=mem[f.i]!==undefined?mem[f.i]:(f.d||'');e.value=f.k==='m'&&v!==''?fmtMoney(v):v});
  tcalc();
}
function tread(t,raw){var v={};t.f.forEach(function(f){var e=$('q_'+f.i);if(raw)raw[f.i]=e.value;v[f.i]=f.k==='s'?e.value:num('q_'+f.i)});return v}
function tcalc(){
  var t=toolById(toolCur),raw={},v=tread(t,raw);toolSave(t.id,raw);
  t.f.forEach(function(f){if(f.show)$('w_'+f.i).style.display=f.show(v)?'':'none'});
  $('q_out').innerHTML=t.calc(v)||'<p class="sub" style="margin-top:14px">Fill in the fields above to see the result.</p>';
}
function tfill(vals){
  for(var k in vals){var e=$('q_'+k),x=vals[k];if(!e||x===undefined||x===null)continue;e.value=e.classList.contains('money')?(x?fmtMoney(Math.round(x*100)/100):''):x}
  tcalc();
}
function openTools(){toolCur=null;drawTools();$('tools').hidden=false;$('toolbody').scrollTop=0}
function closeTools(){$('tools').hidden=true}
// Turns a quick deal check into a potential buy, with its figures already in the Add new form.
function dealToProp(){
  var v=tread(toolById('deal')),f=v.plan==='flip';closeTools();
  editIdx=null;newType='potential';newIntent=v.plan;newLoan='pi';loanOpen=false;formAnim=true;form();formAnim=false;
  setv({f_price:v.price,f_reno:v.reno,f_legal:v.legal,f_rates:v.rates,f_ins:v.ins,f_oth:v.othm,f_months:v.months,f_value:f?v.value:v.value2,f_sell:f?v.sell:0,f_rent:f?0:v.rent,f_exp:f?0:v.exp});
  holdCalc();go(2,true);$('p2').scrollTop=0;
}
$('toolbtn').addEventListener('click',openTools);
$('toolbg').addEventListener('click',closeTools);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('tools').hidden)closeTools()});
$('toolbody').addEventListener('click',function(e){
  var tile=e.target.closest('[data-tool]');if(tile){toolCur=tile.dataset.tool;drawTools();$('toolbody').scrollTop=0;return}
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='tclose')closeTools();
  if(b.dataset.x==='thome'){toolCur=null;drawTools()}
  if(b.dataset.x==='tsave')dealToProp();
  if(b.dataset.x==='tport'){var own=props.filter(function(p){return p.type!=='potential'});tfill({val:sum(own,function(p){return p.value}),debt:sum(own,function(p){return p.loan})})}
});
$('toolbody').addEventListener('input',function(){if(toolCur)tcalc()});
$('toolbody').addEventListener('change',function(e){
  if(e.target.id==='q_from'){if(e.target.value!=='')tfill(toolById(toolCur).from(props[+e.target.value]));return}
  if(toolCur)tcalc();
});
