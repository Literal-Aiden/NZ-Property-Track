// Add and edit property forms, validation and saving.
// Owned properties' mortgage: one or more loan parts (lpN of them, loan types in lpT), each with its own rate and fixed term.
// Part i's fields are l_amt{i}, l_rate{i}, l_fix{i}, l_fs{i} (fixed from), l_rf{i} (custom re-fix date) and l_term{i}.
var lpN=1,lpT=['pi'];
function lpReset(p){var L=p?parts(p):[];lpN=Math.max(1,L.length);lpT=L.length?L.map(function(x){return x.ltype||'pi'}):['pi']}
function lpBlock(i,amt){
  return '<div class="lpart">'+(lpN>1?'<div class="row" style="cursor:default"><b>Loan part '+(i+1)+'</b><button class="edit del" data-lp="'+i+'">Remove</button></div>':'')+
   (amt?'<label>'+(lpN>1?'Amount owing on this part':'Current loan balance (NZD)')+'</label><input id="l_amt'+i+'"'+(lpN>1?' required':'')+MONEY+(lpN>1?'':'<p class="sub" style="margin-top:4px">What you owe on it now. Leave blank if it’s mortgage-free.</p>'):'')+
   '<label>Interest rate %'+(i?'':' (enter your own, e.g. second-tier lender)')+'</label><input id="l_rate'+i+'"'+NUM+
   '<label>Fixed term</label><select id="l_fix'+i+'">'+FIXOPTS+'</select>'+
   '<div id="l_fw'+i+'"><label>Rate fixed from (or settlement date)</label><input id="l_fs'+i+'" type="date"></div>'+
   '<div id="l_cw'+i+'" style="display:none"><label>Re-fix date</label><input id="l_rf'+i+'" type="date"></div>'+
   '<p class="sub" id="l_out'+i+'" style="margin-top:8px;color:var(--acc);font-weight:600"></p>'+
   '<label>Loan type</label><div class="seg" data-p="'+i+'"><button data-l="pi" class="'+(lpT[i]==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(lpT[i]==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Remaining term (years, optional, default 30)</label><input id="l_term'+i+'"'+NUM+'</div>';
}
// main: when adding with one part, its amount sits in the main form (as "Current loan balance"), not here.
function lpForm(main){
  var h='';for(var i=0;i<lpN;i++)h+=lpBlock(i,!(main&&lpN===1));
  return h+'<button class="edit" data-lp="add" style="margin-top:14px">'+(lpN>1?'+ Add another loan part':'+ Split the loan into parts')+'</button>'+
    (lpN>1?'':'<p class="sub" style="margin-top:4px">If the loan is split into parts fixed for different terms or rates.</p>');
}
function fixPreview(i){
  // No loan amount, no dates: the rate's start and re-fix date are cleared until an amount is entered.
  if(!num('l_amt'+i)){$('l_fs'+i).value='';$('l_rf'+i).value='';$('l_out'+i).textContent='';return}
  var v=$('l_fix'+i).value,c=v==='custom',f=v==='float';
  $('l_fw'+i).style.display=c||f?'none':'';
  $('l_cw'+i).style.display=c?'':'none';
  var r=refixOf({fixTerm:v,fixStart:$('l_fs'+i).value,refix:$('l_rf'+i).value});
  $('l_out'+i).textContent=f?'Floating rate: no re-fix date':r?'Re-fix due '+fmtD(r):'';
}
function fixAll(){for(var i=0;i<lpN;i++)if($('l_fix'+i))fixPreview(i)}
// When adding, "Rate fixed from" follows the purchase date: a part's date is filled in if it's blank, today's (the
// default) or still the date copied last time, so one typed in by hand is left alone.
var fsPrev='';
function syncFs(){
  var d=$('f_date');if(editIdx!==null||!d)return;
  var t=iso(new Date());if(!d.value)return;
  for(var i=0;i<lpN;i++){var f=$('l_fs'+i);if(f&&num('l_amt'+i)&&(!f.value||f.value===fsPrev||f.value===t)&&f.value!==d.value){f.value=d.value;fixPreview(i)}}
  fsPrev=d.value;
}
// Typing a loan amount fills in "Rate fixed from" if it's empty: the purchase date when adding, else today.
function loanAmt(i){
  var f=$('l_fs'+i),d=$('f_date');
  if(f&&num('l_amt'+i)&&!f.value)f.value=editIdx===null&&d&&d.value?d.value:iso(new Date());
  fixPreview(i);
}
// The parts as typed (raw values), so removing one can shift the rest up.
var LPF=['amt','rate','fix','fs','rf','term'];
function lpRead(){var a=[];for(var i=0;i<lpN;i++){var x={};LPF.forEach(function(k){var e=$('l_'+k+i);x[k]=e?e.value:''});a.push(x)}return a}
function lpWrite(a){a.forEach(function(x,i){LPF.forEach(function(k){var e=$('l_'+k+i);if(e)e.value=x[k]})});fixAll()}
function readParts(){
  var a=[];for(var i=0;i<lpN;i++){var n=num('l_amt'+i);if(!n)continue;var t=$('l_fix'+i).value;
    a.push({loan:n,rate:num('l_rate'+i),fixTerm:t,fixStart:$('l_fs'+i).value,refix:t==='custom'?$('l_rf'+i).value:'',ltype:lpT[i],term:num('l_term'+i)||30})}
  return a;
}
// p.loan is the total and p.rate the average weighted by amount, so equity, LVR and the calculators work as before.
var LOANKEYS=['loan','rate','refix','fixTerm','fixStart','ltype','term','parts'];
function setLoan(p,a){
  LOANKEYS.forEach(function(k){delete p[k]});if(!a.length)return;
  var t=sum(a,function(x){return x.loan});p.parts=a;p.loan=t;p.rate=Math.round(sum(a,function(x){return x.loan*x.rate})/t*100)/100;
}
function fill(p){
  var m={f_addr:p.addr,f_sub:p.sub,f_price:p.price,f_date:p.date,f_legal:p.type!=='rental'?(p.legal||0)+(p.extra||0):p.legal,f_extra:p.extra,f_value:p.value,f_budget:p.budget,f_spent:p.spent,f_rent:p.rent,f_exp:p.exp,f_reno:p.reno,f_rates:p.rates,f_ins:p.ins,f_power:p.power,f_oth:p.oth!==undefined?p.oth:p.hold,f_beds:p.beds,f_land:p.land,f_months:p.months,f_sell:p.sell,f_loan:p.loan,f_rate:p.rate,f_refix:p.refix,f_fixstart:p.fixStart,f_term:p.term};
  for(var k in m){var e=$(k);if(e&&m[k]!==undefined&&m[k]!==null&&m[k]!==0)e.value=e.classList.contains('money')?fmtMoney(m[k]):m[k]}
}
// Add new starts with a choice of what's being added; the form for that type appears once one is picked.
var KINDS_ADD=[
  ['project','Current renovation project','A property you own and are renovating now','<path d="M4 20l9-9M14 4l6 6-3 3-6-6zM11 7l3-3"/>'],
  ['rental','Current rental property','A property you own that’s tenanted','<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'],
  ['potential','Potential purchase','Rental investment or renovation flip you’re considering','<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>']];
var formAnim=false;
function chooser(){
  return '<div class="card enter"><b>What are you adding?</b><p class="sub" style="margin-top:4px">Choose one to see the details needed.</p>'+KINDS_ADD.map(function(k){
    return '<button class="pick" data-t="'+k[0]+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+k[3]+'</svg><span><b>'+k[1]+'</b><span class="sub">'+k[2]+'</span></span><i aria-hidden="true">›</i></button>';
  }).join('')+'</div>';
}
var OPT=' <i class="opt">optional</i>';
function fsec(n,t){return '<p class="fsec">'+ic(n)+t+'</p>'}
var ADDBAR='<div class="pagebar"><button class="pback" data-back aria-label="Back">'+ic('back')+'</button><b>Add a property</b></div>';
function form(){
  clearTimeout(acT);acList=[];acSel=-1;
  if(editIdx===null&&!newType){$('sheet').hidden=true;$('sheetbody').innerHTML='';$('p2').innerHTML=ADDBAR+chooser();return}
  var pr=newType==='project',pt=newType==='potential',flip=newIntent==='flip',sd=editIdx===null||editSec==='details',sl=!pt&&(editIdx===null||editSec==='loan');
  var N=MONEY,ed=editIdx!==null,kind=KINDS_ADD.filter(function(k){return k[0]===newType})[0];
  var RQ=' required';
  var h='<div class="card'+(formAnim?' enter':'')+'">'+(editIdx===null?'<button class="back" id="chg">‹ Change type</button><b class="ftitle">New '+kind[1].replace(/^Current /,'').replace(/^P/,'p')+'</b>':'<b>'+(editSec==='loan'?'Edit mortgage':'Edit property details')+'</b>')+'<p class="sub" style="margin-top:4px">Fields marked optional can be left blank.</p>'+
   (pt?'<label>Plan</label><div class="seg"><button data-n="flip" class="'+(flip?'on':'')+'">Reno to sell</button><button data-n="rental" class="'+(flip?'':'on')+'">Buy to rent</button></div>':'')+
   (sd?'<label>Address</label><div class="ac"><input id="f_addr" class="acin" data-sub="f_sub" data-next="f_price" placeholder="Start typing, e.g. 12 Queen Street" autocomplete="off" required><div class="sugg" role="listbox" hidden></div></div>'+
   '<label>Suburb / city</label><input id="f_sub" required>':'')+
   // Legal fees and other purchase costs are one figure (stored in legal) for projects and potential buys; rentals keep Healthy Homes costs separate.
   // Potential buys: grouped into short sections with paired fields so the form stays compact on a phone.
   (sd&&pt?'<div class="fgrid"><div><label>Bedrooms'+OPT+'</label><input id="f_beds"'+NUM+'</div><div><label>Land m²'+OPT+'</label><input id="f_land"'+NUM+'</div></div>'+
   fsec('dollar','Purchase')+
   '<div class="fgrid"><div><label>Asking / offer price</label><input id="f_price"'+RQ+N+'</div><div><label>Reno estimate</label><input id="f_reno"'+RQ+N+'</div></div>'+
   '<label>Legal &amp; other purchase costs'+OPT+'</label><input id="f_legal" placeholder="Lawyer, LIM, builder’s report, valuation"'+N+
   // Holding costs are worked out per month from the yearly bills, the loan repayment and any other monthly costs.
   fsec('clock','Holding costs')+
   '<div class="fgrid"><div><label>Rates per year</label><input id="f_rates"'+RQ+N+'</div><div><label>Insurance per year</label><input id="f_ins"'+RQ+N+'</div></div>'+
   '<p class="sub rlink" id="ratelink"></p><div class="fgrid">'+
   '<div><label>Power / month'+OPT+'</label><input id="f_power"'+N+'</div><div><label>Other / month'+OPT+'</label><input id="f_oth" placeholder="e.g. water'+(flip?'':', lawns')+'"'+N+'</div></div>'+
   '<details class="more" id="loanmore"'+(loanOpen||(ed&&props[editIdx].loan)?' open':'')+'><summary>Loan (optional)</summary>'+
   '<div class="fgrid"><div><label>Loan amount</label><input id="f_loan"'+N+'</div><div><label>Interest rate %</label><input id="f_rate"'+NUM+'</div></div>'+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Term in years'+OPT+'</label><input id="f_term" placeholder="30"'+NUM+'</details>'+
   '<p class="sub" id="holdout" style="margin-top:10px;color:var(--ink);font-weight:600"></p><p class="sub" id="loanout" style="margin-top:4px"></p>'+
   fsec(flip?'trend':'key',flip?'Selling':'Renting')+
   (flip?'<div class="fgrid"><div><label>Sale price after reno</label><input id="f_value"'+RQ+N+'</div><div><label>Selling costs</label><input id="f_sell" placeholder="Agent fees etc."'+RQ+N+'</div><div><label>Months until sold</label><input id="f_months"'+RQ+NUM+'</div></div>'
     :'<div class="fgrid"><div><label>Value after reno</label><input id="f_value"'+RQ+N+'</div><div><label>Weekly rent</label><input id="f_rent"'+RQ+N+'</div><div><label>Annual expenses</label><input id="f_exp"'+RQ+N+'</div><div><label>Months until tenanted</label><input id="f_months"'+RQ+NUM+'</div></div>')+
   (editIdx===null&&SHOW_COMPS?'<p class="sub" style="margin-top:10px">You can add comparable sales once it’s saved.</p>':''):'')+
   // Rentals may have been owned for decades, so their purchase details are optional (then the value is needed instead).
   (sd&&!pt?'<label>Purchase price (NZD)'+(pr?'':' (optional)')+'</label><input id="f_price"'+(pr?RQ:'')+N+
   '<label>Purchase date'+(pr?'':' (optional)')+'</label><input id="f_date" type="date"'+(pr?' required':'')+'>'+
   (pr?'':'<p class="sub" style="margin-top:4px">Leave these blank if you don’t have them to hand, and add the current loan balance or estimated value below.</p>')+
   (pr?'<label>Legal fees and other purchase costs (optional)</label><input id="f_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'
      :'<label>Legal fees (optional)</label><input id="f_legal"'+N+'<label>Healthy Homes / quick reno costs (optional)</label><input id="f_extra"'+N)+
   '<label>Estimated value now (optional)</label><input id="f_value" placeholder="Leave blank to use the purchase price"'+N+
   // When adding, what's owed now sits in the main form (it matters more than the purchase details for a long-held
   // property); the rate, term and re-fix details stay in the collapsed mortgage section below.
   (editIdx===null?(lpN===1?'<label>Current loan balance (optional)</label><input id="l_amt0" placeholder="Leave blank if mortgage-free"'+N+'<p class="sub" style="margin-top:4px">What you owe on it now, not the original loan.</p>'
     :'<p class="sub" style="margin-top:14px">Loan split into '+lpN+' parts: enter each amount under Mortgage details below.</p>'):'')+
   (pr?'<label>Renovation budget (NZD)</label><input id="f_budget"'+RQ+N+(editIdx!==null&&(props[editIdx].items||[]).length?'<p class="sub" style="margin-top:8px">Spent so far is added up from your itemised reno costs.</p>':'<label>Spent so far (optional)</label><input id="f_spent"'+N)
      :'<label>Weekly rent (NZD)</label><input id="f_rent"'+RQ+N+'<label>Annual expenses (NZD)</label><input id="f_exp" placeholder="Rates, insurance, maintenance etc."'+RQ+N+'<p class="sub rlink" id="ratelink"></p>')+'':'')+
   // When adding, the optional mortgage sits in a collapsed section so the form stays short.
   (sl?(editIdx===null?'<details class="more" id="loanmore"'+(loanOpen||lpN>1?' open':'')+'><summary>Mortgage details (if there’s a loan)</summary>'+lpForm(true)+'</details>':lpForm(false)):'')+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<div class="btns fbar"><button class="go" id="add">'+(editIdx===null?'Add property':'Save changes')+'</button>'+(editIdx===null?'':'<button class="go ghost" id="cancel">Cancel</button>')+'</div>'+
   (ed&&sd?'<button class="edit del" id="delprop" style="margin-top:16px">Delete this property</button>':'')+'</div>';
  // Adding happens in the Add new pane; editing slides up over the current property so you stay where you are.
  $('sheet').hidden=!ed;
  if(ed){$('p2').innerHTML='';$('sheetbody').innerHTML=h;$('sheetbody').scrollTop=0}else{$('sheetbody').innerHTML='';$('p2').innerHTML=ADDBAR+h}
  if(editIdx!==null)fill(props[editIdx]);
  holdCalc();rateLink();
  if($('l_fix0')){
    var L=editIdx!==null?parts(props[editIdx]):[];
    for(var i=0;i<lpN;i++){var x=L[i]||{},m={};m['l_amt'+i]=x.loan;m['l_rate'+i]=x.rate;m['l_fs'+i]=x.fixStart;m['l_rf'+i]=x.refix;m['l_term'+i]=x.term;setv(m);
      $('l_fix'+i).value=x.fixTerm||(x.refix?'custom':'12');if(!$('l_fs'+i).value&&x.loan)$('l_fs'+i).value=iso(new Date())}
    fixAll();
  }
  if(wide())pairUp((ed?$('sheetbody'):$('p2')).querySelector('.card'));
}
// Required fields are checked on save, in the given form (default: the property form that's open).
// A loan amount also needs an interest rate. The message goes in the form's .formerr element.
function missing(box){
  box=box||(editIdx===null?$('p2'):$('sheetbody'));
  var bad=[].filter.call(box.querySelectorAll('[required]'),function(e){return !e.value.trim()});
  var r=$('f_rate');if(r&&box.contains(r)&&num('f_loan')&&!r.value.trim())bad.push(r);
  for(var i=0;i<lpN;i++){r=$('l_rate'+i);if(r&&box.contains(r)&&num('l_amt'+i)&&!r.value.trim())bad.push(r)}
  // A rental's purchase details are optional (it may have been owned for decades), but it needs something to go on:
  // the purchase price, or else the current loan balance (an estimated value also does).
  var fp=$('f_price');if(newType==='rental'&&fp&&box.contains(fp)&&!num('f_price')&&!num('f_value')){
    var ln=editIdx!==null?props[editIdx].loan:[].reduce.call(box.querySelectorAll('[id^=l_amt]'),function(t,e){return t+pnum(e.value)},0);
    if(!ln)bad.push(fp);
  }
  box.querySelectorAll('.bad').forEach(unbad);
  bad.forEach(function(e){
    var d=e.closest('details');if(d)d.open=true;
    void e.offsetWidth;e.classList.add('bad');e.setAttribute('aria-invalid','true');
    var l=fieldLabel(e);if(l)l.classList.add('badl');
    var m=document.createElement('p');m.className='ferr';
    m.textContent=/rate/.test(e.id)?'Needed when there’s a loan amount':e.id==='f_price'&&newType==='rental'?'Add the purchase price, or the current loan balance below':'Required';
    fieldBox(e).insertAdjacentElement('afterend',m);
  });
  errSum(box);
  if(bad.length){bad[0].focus();bad[0].scrollIntoView({block:'center',behavior:'smooth'})}
  return bad.length;
}
// The summary by the Save button names every field still flagged, and goes once they're all filled in.
function errSum(box){
  var f=box.querySelector('.formerr');if(!f)return;
  var n=[].map.call(box.querySelectorAll('.bad'),fieldName);
  f.classList.toggle('on',!!n.length);
  f.textContent=n.length?'To save, fill in '+(n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]:n[0])+'.':'';
}
// A field, or its wrapper when it has one (the address field sits in a box with its suggestions).
function fieldBox(e){return e.parentElement.classList.contains('ac')?e.parentElement:e}
// The label for a field: the one just before it, or one pointing at it with for="".
function fieldLabel(e){var l=fieldBox(e).previousElementSibling;if(l&&l.tagName==='LABEL')return l;return e.id?document.querySelector('label[for="'+e.id+'"]'):null}
// A field's name for the summary, without notes like "(NZD)" or "(optional)".
function fieldName(e){var l=fieldLabel(e),t=l?l.childNodes[0].textContent:'this field';return t.replace(/\s*\(.*$/,'').trim()}
// Clears a field's error and updates the summary.
function unbad(e){
  e.classList.remove('bad');e.removeAttribute('aria-invalid');
  var l=fieldLabel(e);if(l)l.classList.remove('badl');
  var m=fieldBox(e).nextElementSibling;if(m&&m.classList.contains('ferr'))m.remove();
  var b=e.parentElement;while(b&&!b.querySelector('.formerr'))b=b.parentElement;
  if(b&&b.querySelector('.formerr.on'))errSum(b);
}
var loanOpen=false;
function saveLoan(){
  setLoan(props[editIdx],readParts());
  isSample=false;cur=editIdx;editIdx=null;lpReset();newType=null;render();go(1,true);ovClose('sheet');
}
function addProp(){
  if(missing())return;
  if(editIdx!==null&&editSec==='loan')return saveLoan();
  var wasEdit=editIdx!==null;
  var a=$('f_addr').value.trim();
  var p={type:newType,addr:a,sub:$('f_sub').value.trim(),price:num('f_price'),value:num('f_value')||(newType==='potential'?0:num('f_price')),date:($('f_date')||{}).value||'',legal:num('f_legal'),extra:num('f_extra')};
  if(newType==='potential'){delete p.date;p.intent=newIntent;p.beds=num('f_beds');p.land=num('f_land');p.reno=num('f_reno');p.rates=num('f_rates');p.ins=num('f_ins');p.power=num('f_power');p.oth=num('f_oth');p.loan=num('f_loan');p.rate=p.loan?num('f_rate'):0;p.ltype=newLoan;p.term=num('f_term')||30;p.hold=holdOf(p);p.months=num('f_months');if(newIntent==='flip')p.sell=num('f_sell');else{p.rent=num('f_rent');p.exp=num('f_exp')}}
  else if(newType==='project'){p.budget=num('f_budget');p.spent=num('f_spent')}else{p.rent=num('f_rent');p.exp=num('f_exp')}
  if(newType!=='potential')setLoan(p,readParts());
  isSample=false;newLoan='pi';lpReset();loanOpen=false;newType=null;if(editIdx!==null){var o=props[editIdx];['loan','rate','refix','fixTerm','fixStart','ltype','term','parts','comps','items','cats','start','target','target0','hold','tasks','done','plan','beds','land','spent','money','ten','hh','hhDocs','pics','photo','vals','valueAt','rates','ins','power','oth','rents','tgt','tgtT','fromProject'].forEach(function(k){if(o[k]!==undefined&&p[k]===undefined)p[k]=o[k]});if(p.value!==o.value)noteVal(p);syncSpent(p);props[editIdx]=p;cur=editIdx;editIdx=null}else{if(num('f_value'))noteVal(p);props.push(p);cur=props.length-1;resetCur()}render();go(1,true);if(wasEdit)ovClose('sheet');
}
// Re-render the form without losing what's been typed (e.g. when switching type or plan).
function keepForm(){var v={},lm=$('loanmore'),cty=$('f_sub')&&$('f_sub').dataset.county;loanOpen=!!(lm&&lm.open);(editIdx===null?$('p2'):$('sheetbody')).querySelectorAll('input[id],select[id]').forEach(function(e){if(e.value)v[e.id]=e.value});form();for(var k in v){var e=$(k);if(e)e.value=v[k]}if(cty&&$('f_sub'))$('f_sub').dataset.county=cty;holdCalc();fixAll();syncFs();rateLink()}
// Rates lookup: a link to the property's council rates search, under the rates (potential buys) or annual expenses
// (rentals) field. The council comes from the picked address suggestion (data-county on the suburb field) or the suburb / city.
function rateLink(){
  var el=$('ratelink');if(!el)return;
  var s=$('f_sub'),r=ratesLink($('f_addr').value.trim(),s.value.trim(),s.dataset.county);
  el.innerHTML=r?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+ic('search')+esc(r.label)+' ↗</a><span>'+(newType==='rental'?'Rates are part of annual expenses. ':'')+(r.direct?'Use the total rates for the year.':'Search your address there, then use the total rates for the year.')+'</span>'
    :'Enter the suburb / city to get a link to the council’s rates search.';
}
function closeSheet(){ovClose('sheet')}
function closeSheetNow(){editIdx=null;newType=null;form()}
$('sheetbg').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('sheet').hidden&&!acList.length)closeSheet()});
['p2','sheetbody'].forEach(function(id){
$(id).addEventListener('change',function(e){var m=/^l_(fix|fs|rf)(\d+)$/.exec(e.target.id);if(m)fixPreview(+m[2]);if(e.target.id==='f_date')syncFs()});
$(id).addEventListener('input',function(e){
  if(e.target.classList.contains('bad'))unbad(e.target);
  if(/^f_(rates|ins|power|oth|loan|rate|term|months)$/.test(e.target.id))holdCalc();
  if(e.target.id==='f_date')syncFs();
  var la=/^l_amt(\d+)$/.exec(e.target.id);if(la)loanAmt(+la[1]);
  if(e.target.id==='f_sub'||e.target.id==='f_addr'){if(e.target.id==='f_sub'&&e.isTrusted)delete e.target.dataset.county;rateLink()}
});
$(id).addEventListener('click',function(e){
  var l=e.target.closest('[data-l]');
  if(l){var sg=l.parentNode;if(sg.dataset.p)lpT[+sg.dataset.p]=l.dataset.l;else newLoan=l.dataset.l;sg.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===l)});holdCalc();return}
  // Split the loan / add or remove a loan part, keeping what's been typed in the others.
  var lp=e.target.closest('[data-lp]');
  if(lp){var d=lpRead();if(lp.dataset.lp==='add'){lpN++;lpT.push('pi');keepForm();var f=$('l_amt'+(lpN-1));if(f)f.focus()}else{var k=+lp.dataset.lp;d.splice(k,1);lpT.splice(k,1);lpN--;keepForm();lpWrite(d)}return}
  var b=e.target.closest('[data-t]');
  if(b){newType=b.dataset.t;lpReset();formAnim=true;form();formAnim=false;$('p2').scrollTop=0;var f=$('f_addr');if(f&&matchMedia('(pointer:fine)').matches)f.focus();return}
  if(e.target.closest('#chg')){newType=null;loanOpen=false;form();$('p2').scrollTop=0;return}
  var n=e.target.closest('[data-n]');
  if(n){newIntent=n.dataset.n;keepForm();return}
  if(e.target.id==='cancel'){closeSheet();return}
  if(e.target.id==='delprop'){var i=editIdx;closeSheetNow();delProp(i);return}
  if(e.target.id==='add')addProp();
});
});
// Reformat money fields as you type, keeping the cursor after the same digit.
document.addEventListener('input',function(e){
  var el=e.target;if(!el.classList.contains('money'))return;
  var n=el.value.slice(0,el.selectionStart).replace(/[^\d.]/g,'').length,v=fmtMoney(el.value),i=0,c=0;
  el.value=v;while(i<v.length&&c<n){if(/[\d.]/.test(v[i]))c++;i++}
  if(n&&document.activeElement===el)el.setSelectionRange(i,i);
});
// Wide screens: each label and its field (plus a hint just under it) go in one box, two boxes to a row, so forms fit
// without scrolling. Anything else (section headings, notes, the Save bar) spans the row. The label stays next to its
// field, so missing() still finds and flags it. Loan parts inside are paired the same way.
function pairUp(box){
  if(!box)return;
  [box].concat([].slice.call(box.querySelectorAll('.lpart'))).forEach(function(c){
    c.classList.add('f2');
    [].slice.call(c.children).forEach(function(l){
      if(l.tagName!=='LABEL'||l.classList.contains('chk')||!l.parentNode)return;
      var f=l.nextElementSibling;
      if(!f||!(/^(INPUT|SELECT)$/.test(f.tagName)||f.classList.contains('ac')||f.classList.contains('seg')))return;
      var w=document.createElement('div');w.className='fld';c.insertBefore(w,l);w.appendChild(l);w.appendChild(f);
      var n=w.nextElementSibling;if(n&&n.tagName==='P'&&n.classList.contains('sub')&&!n.id&&!n.classList.contains('formerr'))w.appendChild(n);
    });
  });
}
// On a computer, Enter in a field saves the property form (Escape already closes it). Not on phones, where the
// keyboard's Enter key would save a half-filled form; and not while an address suggestion is being picked.
['p2','sheetbody'].forEach(function(id){$(id).addEventListener('keydown',function(e){
  if(!DESK||e.key!=='Enter'||e.target.tagName!=='INPUT'||/^(checkbox|file)$/.test(e.target.type)||acList.length)return;
  var b=$('add');if(b&&$(id).contains(b)){e.preventDefault();b.click()}
})});
