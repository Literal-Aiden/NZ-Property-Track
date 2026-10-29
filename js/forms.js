// Add and edit property forms, validation and saving.
function fixPreview(){
  var v=$('f_fix').value,c=v==='custom',f=v==='float';
  $('fixwrap').style.display=c||f?'none':'';
  $('customwrap').style.display=c?'':'none';
  var r=refixOf({fixTerm:v,fixStart:$('f_fixstart').value,refix:$('f_refix').value});
  $('fixout').textContent=f?'Floating rate: no re-fix date':r?'Re-fix due '+fmtD(r):'';
}
function readFix(p){p.fixTerm=$('f_fix').value;p.fixStart=$('f_fixstart').value;p.refix=p.fixTerm==='custom'?$('f_refix').value:''}
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
   '<div class="fgrid"><div><label>Rates per year</label><input id="f_rates"'+RQ+N+'</div><div><label>Insurance per year</label><input id="f_ins"'+RQ+N+'</div>'+
   '<div><label>Power / month'+OPT+'</label><input id="f_power"'+N+'</div><div><label>Other / month'+OPT+'</label><input id="f_oth" placeholder="e.g. water'+(flip?'':', lawns')+'"'+N+'</div></div>'+
   '<details class="more" id="loanmore"'+(loanOpen||(ed&&props[editIdx].loan)?' open':'')+'><summary>Loan (optional)</summary>'+
   '<div class="fgrid"><div><label>Loan amount</label><input id="f_loan"'+N+'</div><div><label>Interest rate %</label><input id="f_rate"'+NUM+'</div></div>'+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Term in years'+OPT+'</label><input id="f_term" placeholder="30"'+NUM+'</details>'+
   '<p class="sub" id="holdout" style="margin-top:10px;color:var(--ink);font-weight:600"></p><p class="sub" id="loanout" style="margin-top:4px"></p>'+
   fsec(flip?'trend':'key',flip?'Selling':'Renting')+
   (flip?'<div class="fgrid"><div><label>Sale price after reno</label><input id="f_value"'+RQ+N+'</div><div><label>Selling costs</label><input id="f_sell" placeholder="Agent fees etc."'+RQ+N+'</div><div><label>Months until sold</label><input id="f_months"'+RQ+NUM+'</div></div>'
     :'<div class="fgrid"><div><label>Value after reno</label><input id="f_value"'+RQ+N+'</div><div><label>Weekly rent</label><input id="f_rent"'+RQ+N+'</div><div><label>Annual expenses</label><input id="f_exp"'+RQ+N+'</div><div><label>Months until tenanted</label><input id="f_months"'+RQ+NUM+'</div></div>')+
   (editIdx===null?'<p class="sub" style="margin-top:10px">You can add comparable sales once it’s saved.</p>':''):'')+
   (sd&&!pt?'<label>Purchase price (NZD)</label><input id="f_price"'+RQ+N+
   '<label>Purchase date</label><input id="f_date" type="date" required>'+
   (pr?'<label>Legal fees and other purchase costs (optional)</label><input id="f_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'
      :'<label>Legal fees (optional)</label><input id="f_legal"'+N+'<label>Healthy Homes / quick reno costs (optional)</label><input id="f_extra"'+N)+
   '<label>Estimated value now (optional)</label><input id="f_value" placeholder="Leave blank to use the purchase price"'+N+
   (pr?'<label>Renovation budget (NZD)</label><input id="f_budget"'+RQ+N+(editIdx!==null&&(props[editIdx].items||[]).length?'<p class="sub" style="margin-top:8px">Spent so far is added up from your itemised reno costs.</p>':'<label>Spent so far (optional)</label><input id="f_spent"'+N)
      :'<label>Weekly rent (NZD)</label><input id="f_rent"'+RQ+N+'<label>Annual expenses (NZD)</label><input id="f_exp"'+RQ+N)+'':'')+
   // When adding, the optional mortgage sits in a collapsed section so the form stays short.
   (sl?(editIdx===null?'<details class="more" id="loanmore"'+(loanOpen?' open':'')+'><summary>Mortgage (optional)</summary>':'')+
   '<label>Loan amount (NZD)</label><input id="f_loan"'+N+
   '<label>Interest rate % (enter your own, e.g. second-tier lender)</label><input id="f_rate"'+NUM+
   '<label>Fixed term</label><select id="f_fix">'+FIXOPTS+'</select>'+
   '<div id="fixwrap"><label>Rate fixed from</label><input id="f_fixstart" type="date"></div>'+
   '<div id="customwrap" style="display:none"><label>Re-fix date</label><input id="f_refix" type="date"></div>'+
   '<p class="sub" id="fixout" style="margin-top:8px;color:var(--acc);font-weight:600"></p>'+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Remaining term (years, optional, default 30)</label><input id="f_term"'+NUM+(editIdx===null?'</details>':''):'')+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<button class="go" id="add">'+(editIdx===null?'Add property':'Save changes')+'</button>'+(editIdx===null?'':'<button class="go ghost" id="cancel">Cancel</button>')+
   (ed&&sd?'<button class="edit del" id="delprop" style="margin-top:16px">Delete this property</button>':'')+'</div>';
  // Adding happens in the Add new pane; editing slides up over the current property so you stay where you are.
  $('sheet').hidden=!ed;
  if(ed){$('p2').innerHTML='';$('sheetbody').innerHTML=h;$('sheetbody').scrollTop=0}else{$('sheetbody').innerHTML='';$('p2').innerHTML=ADDBAR+h}
  if(editIdx!==null)fill(props[editIdx]);
  holdCalc();
  if($('f_fix')){$('f_fix').value='12';if(editIdx!==null){var q=props[editIdx];$('f_fix').value=q.fixTerm||(q.refix?'custom':'12')}if(!$('f_fixstart').value)$('f_fixstart').value=iso(new Date());fixPreview()}
}
// Required fields are checked on save, in the given form (default: the property form that's open).
// A loan amount also needs an interest rate. The message goes in the form's .formerr element.
function missing(box){
  box=box||(editIdx===null?$('p2'):$('sheetbody'));
  var bad=[].filter.call(box.querySelectorAll('[required]'),function(e){return !e.value.trim()});
  var r=$('f_rate');if(r&&box.contains(r)&&num('f_loan')&&!r.value.trim())bad.push(r);
  box.querySelectorAll('.bad').forEach(function(e){e.classList.remove('bad')});
  bad.forEach(function(e){var d=e.closest('details');if(d)d.open=true;e.classList.add('bad');e.setAttribute('aria-invalid','true')});
  box.querySelector('.formerr').textContent=bad.length?'Fill in the '+(bad.length>1?bad.length+' highlighted fields':'highlighted field')+' to save.':'';
  if(bad.length){bad[0].focus();bad[0].scrollIntoView({block:'center',behavior:'smooth'})}
  return bad.length;
}
var loanOpen=false;
function saveLoan(){
  var p=props[editIdx],n=num('f_loan');
  if(n){p.loan=n;p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  else{delete p.loan;delete p.rate;delete p.refix;delete p.fixTerm;delete p.fixStart;delete p.ltype;delete p.term}
  isSample=false;cur=editIdx;editIdx=null;newLoan='pi';newType=null;render();go(1,true);ovClose('sheet');
}
function addProp(){
  if(missing())return;
  if(editIdx!==null&&editSec==='loan')return saveLoan();
  var wasEdit=editIdx!==null;
  var a=$('f_addr').value.trim();
  var p={type:newType,addr:a,sub:$('f_sub').value.trim(),price:num('f_price'),value:num('f_value')||(newType==='potential'?0:num('f_price')),date:($('f_date')||{}).value||'',legal:num('f_legal'),extra:num('f_extra')};
  if(newType==='potential'){delete p.date;p.intent=newIntent;p.beds=num('f_beds');p.land=num('f_land');p.reno=num('f_reno');p.rates=num('f_rates');p.ins=num('f_ins');p.power=num('f_power');p.oth=num('f_oth');p.loan=num('f_loan');p.rate=p.loan?num('f_rate'):0;p.ltype=newLoan;p.term=num('f_term')||30;p.hold=holdOf(p);p.months=num('f_months');if(newIntent==='flip')p.sell=num('f_sell');else{p.rent=num('f_rent');p.exp=num('f_exp')}}
  else if(newType==='project'){p.budget=num('f_budget');p.spent=num('f_spent')}else{p.rent=num('f_rent');p.exp=num('f_exp')}
  if(newType!=='potential'&&num('f_loan')){p.loan=num('f_loan');p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  isSample=false;newLoan='pi';loanOpen=false;newType=null;if(editIdx!==null){var o=props[editIdx];['loan','rate','refix','fixTerm','fixStart','ltype','term','comps','items','cats','start','target','target0','hold','tasks','done','plan','beds','land','spent','money','ten','hh','hhDocs','photo','tgt','tgtT','fromProject'].forEach(function(k){if(o[k]!==undefined&&p[k]===undefined)p[k]=o[k]});syncSpent(p);props[editIdx]=p;cur=editIdx;editIdx=null}else{props.push(p);cur=props.length-1}render();go(1,true);if(wasEdit)ovClose('sheet');
}
// Re-render the form without losing what's been typed (e.g. when switching type or plan).
function keepForm(){var v={},lm=$('loanmore');loanOpen=!!(lm&&lm.open);(editIdx===null?$('p2'):$('sheetbody')).querySelectorAll('input').forEach(function(e){if(e.value)v[e.id]=e.value});form();for(var k in v){var e=$(k);if(e)e.value=v[k]}holdCalc()}
function closeSheet(){ovClose('sheet')}
function closeSheetNow(){editIdx=null;newType=null;form()}
$('sheetbg').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('sheet').hidden&&!acList.length)closeSheet()});
['p2','sheetbody'].forEach(function(id){
$(id).addEventListener('change',function(e){if(/^f_(fix|fixstart|refix)$/.test(e.target.id))fixPreview()});
$(id).addEventListener('input',function(e){
  if(e.target.classList.contains('bad')){e.target.classList.remove('bad');e.target.removeAttribute('aria-invalid')}
  if(/^f_(rates|ins|power|oth|loan|rate|term|months)$/.test(e.target.id))holdCalc();
});
$(id).addEventListener('click',function(e){
  var l=e.target.closest('[data-l]');
  if(l){newLoan=l.dataset.l;document.querySelectorAll('#lt button').forEach(function(x){x.classList.toggle('on',x===l)});holdCalc();return}
  var b=e.target.closest('[data-t]');
  if(b){newType=b.dataset.t;formAnim=true;form();formAnim=false;$('p2').scrollTop=0;var f=$('f_addr');if(f&&matchMedia('(pointer:fine)').matches)f.focus();return}
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
