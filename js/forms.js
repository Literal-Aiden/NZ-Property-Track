// Add and edit property forms, validation and saving.
// Owned properties' mortgage: one or more loan parts (lpN of them, loan types in lpT), each with its own rate and fixed term.
// Part i's fields are l_amt{i}, l_rate{i}, l_fix{i}, l_fs{i} (fixed from), l_rf{i} (custom re-fix date). The remaining term is one for the whole loan (termBox()).
var lpN=1,lpT=['pi'];
function lpReset(p){var L=p?parts(p):[];lpN=Math.max(1,L.length);lpT=L.length?L.map(function(x){return x.ltype||'pi'}):['pi']}
function lpBlock(i){
  return '<div class="lpart">'+(lpN>1?'<div class="row" style="cursor:default"><b>Loan part '+(i+1)+'</b><button class="edit del" data-lp="'+i+'">Remove</button></div>':'')+
   '<label>Loan type</label><div class="seg" data-p="'+i+'"><button data-l="pi" class="'+(lpT[i]==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(lpT[i]==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>'+(lpN>1?'Amount owing on this part':'Current loan balance (NZD)')+'</label><input id="l_amt'+i+'"'+(lpN>1?' required':'')+MONEY+(lpN>1?'':'<p class="sub" style="margin-top:4px">What you owe on it now, not the original loan.'+(editIdx===null?'':' Clear it if the loan’s paid off.')+'</p>')+
   '<label>Interest rate %</label><input id="l_rate'+i+'"'+NUM+
   // An existing rental asks only Fixed or Floating and the date it's fixed until (what the bank's app and letters show);
   // how long it was fixed for, and from when, are rarely to hand. The hidden select keeps fixPreview() and saving as they are.
   (isHeld()?'<label>Fixed or floating</label><div class="seg" data-fp="'+i+'"><button data-fx="custom">Fixed</button><button data-fx="float">Floating</button></div>'+
     '<select id="l_fix'+i+'" hidden><option value="custom"></option><option value="float"></option></select>'
     :'<label>Fixed term</label><select id="l_fix'+i+'">'+FIXOPTS+'</select>'+
       '<div id="l_ow'+i+'" style="display:none"><label>Fixed for (months)</label><input id="l_om'+i+'"'+NUM+'</div>')+
   '<div id="l_fw'+i+'"><label>Rate fixed from'+(editIdx===null&&!isHeld()?' (or settlement date)':'')+'</label><input id="l_fs'+i+'" type="date"></div>'+
   '<div id="l_cw'+i+'" style="display:none"><label>Rate fixed until</label><input id="l_rf'+i+'" type="date"></div>'+
   '<p class="sub" id="l_out'+i+'" style="margin-top:8px;color:var(--acc);font-weight:600"></p></div>';
}
// Remaining term, once for the whole loan (a split loan's parts share it): years and months, or the date the loan ends
// (some landlords know only that), boxed together; either one fills in the other. Its fields are l_ty0 / l_tm0 / l_te0.
// An existing rental's loan needs it (30 years would be wrong for an older loan).
function termBox(){
  return '<div class="tbox"><label class="tbl">Remaining term'+(lpN>1?' of the whole loan':'')+(isHeld()?'':' (optional, 30 years if left blank)')+'</label>'+
   '<div class="fgrid tterm"><div><label for="l_ty0">Years</label><input id="l_ty0" data-name="Remaining term"'+NUM+'</div>'+
   '<div><label for="l_tm0">Months</label><input id="l_tm0"'+NUM+'</div></div>'+
   '<p class="tor">or</p><label for="l_te0">Date the loan ends</label><input id="l_te0" type="date"></div>';
}
function lpForm(){
  var h='';for(var i=0;i<lpN;i++)h+=lpBlock(i);
  return h+'<button class="edit" data-lp="add" style="margin-top:14px">'+(lpN>1?'+ Add another loan part':'+ Split the loan into parts')+'</button>'+
    (lpN>1?'':'<p class="sub" style="margin-top:4px">If the loan is split into parts fixed for different terms or rates.</p>')+termBox();
}
function fixPreview(i){
  // A term carried over from a new rental's form (switched to existing) isn't one of Fixed / Floating: it's Fixed.
  var s=$('l_fix'+i);if(!s.value&&s.hidden)s.value='custom';
  var v=s.value,c=v==='custom',f=v==='float',o=v==='other';
  document.querySelectorAll('[data-fp="'+i+'"] button').forEach(function(b){b.classList.toggle('on',b.dataset.fx===v)});
  // "Rate fixed from" only once there's a term to count from.
  $('l_fw'+i).style.display=c||f||!v?'none':'';
  $('l_cw'+i).style.display=c?'':'none';
  if($('l_ow'+i))$('l_ow'+i).style.display=o?'':'none';
  // No re-fix date shown until there's a loan amount. A date picked before the amount is kept, not cleared.
  if(!num('l_amt'+i)){$('l_out'+i).textContent='';return}
  var r=refixOf({fixTerm:o?String(num('l_om'+i)||''):v,fixStart:$('l_fs'+i).value,refix:$('l_rf'+i).value});
  // A date typed in is the re-fix date, so it isn't repeated under it.
  $('l_out'+i).textContent=f?'Floating rate: no re-fix date':r&&!c?'Re-fix due '+fmtD(r):'';
}
function fixAll(){for(var i=0;i<lpN;i++)if($('l_fix'+i))fixPreview(i)}
// An existing rental (owned a while), being added or edited: its purchase date isn't when the rate was fixed.
function isHeld(){return newType==='rental'&&(editIdx!==null?!!(props[editIdx]||{}).held:newRent==='existing')}
// When adding, "Rate fixed from" follows the purchase date: a part's date is filled in if it's blank, today's (the
// default) or still the date copied last time, so one typed in by hand is left alone. Not for an existing rental.
var fsPrev='';
function syncFs(){
  var d=$('f_date');if(editIdx!==null||!d||isHeld())return;
  var t=iso(new Date());if(!d.value)return;
  for(var i=0;i<lpN;i++){var f=$('l_fs'+i);if(f&&num('l_amt'+i)&&(!f.value||f.value===fsPrev||f.value===t)&&f.value!==d.value){f.value=d.value;fixPreview(i)}}
  fsPrev=d.value;
}
// Typing a loan amount fills in "Rate fixed from" if it's empty: the purchase date when adding (not for an existing
// rental), else today. Removing the amount clears the dates.
function loanAmt(i){
  var f=$('l_fs'+i),d=$('f_date');
  if(f&&!num('l_amt'+i)){f.value='';$('l_rf'+i).value=''}
  if(f&&num('l_amt'+i)&&!f.value)f.value=editIdx===null&&d&&d.value&&!isHeld()?d.value:iso(new Date());
  fixPreview(i);
}
// The parts as typed (raw values), so removing one can shift the rest up.
var LPF=['amt','rate','fix','om','fs','rf'];
// Remaining term fields: the end date fills in years and months, and years and months fill in the end date.
function endIn(m){var d=new Date();d.setMonth(d.getMonth()+m);return iso(d)}
function termFrom(i,src){
  var te=$('l_te'+i);if(!te)return;
  if(src==='te'){if(!te.value)return;var m=monthsTo(te.value);$('l_ty'+i).value=Math.floor(m/12)||'';$('l_tm'+i).value=m?m%12:''}
  else{var n=num('l_ty'+i)*12+num('l_tm'+i);te.value=n?endIn(n):''}
}
function termSet(i,x){
  var m=x.end?monthsTo(x.end):x.term?Math.round(x.term*12):0;
  $('l_ty'+i).value=Math.floor(m/12)||'';$('l_tm'+i).value=m?m%12:'';$('l_te'+i).value=x.end||(m?endIn(m):'');
}
function lpRead(){var a=[];for(var i=0;i<lpN;i++){var x={};LPF.forEach(function(k){var e=$('l_'+k+i);x[k]=e?e.value:''});a.push(x)}return a}
function lpWrite(a){a.forEach(function(x,i){LPF.forEach(function(k){var e=$('l_'+k+i);if(e)e.value=x[k]})});fixAll()}
function readParts(){
  var a=[];for(var i=0;i<lpN;i++){var n=num('l_amt'+i);if(!n)continue;var t=$('l_fix'+i).value;if(t==='other')t=String(num('l_om'+i)||'');var mo=num('l_ty0')*12+num('l_tm0'),end=$('l_te0').value;
    var x={loan:n,rate:num('l_rate'+i),fixTerm:t,fixStart:$('l_fs'+i).value,refix:t==='custom'?$('l_rf'+i).value:'',ltype:lpT[i],term:mo?Math.round(mo/12*1000)/1000:30};
    if(end)x.end=end;a.push(x)}
  return a;
}
// p.loan is the total and p.rate the average weighted by amount, so equity, LVR and the calculators work as before.
var LOANKEYS=['loan','rate','refix','fixTerm','fixStart','ltype','term','parts'];
function setLoan(p,a){
  LOANKEYS.forEach(function(k){delete p[k]});if(!a.length)return;
  var t=sum(a,function(x){return x.loan});p.parts=a;p.loan=t;p.rate=Math.round(sum(a,function(x){return x.loan*x.rate})/t*100)/100;
}
function fill(p){
  var m={f_addr:p.addr,f_sub:p.sub,f_price:p.price,f_date:p.date,f_legal:p.type!=='rental'?(p.legal||0)+(p.extra||0):p.legal,f_extra:p.extra,f_value:p.value,f_budget:p.budget,f_spent:p.spent,f_rent:p.rent,f_exp:p.exp,f_mgmt:p.mgmt,f_reno:p.reno,f_rates:p.rates,f_ins:p.ins,f_power:p.power,f_oth:p.oth!==undefined?p.oth:p.hold,f_beds:p.beds,f_land:p.land,f_months:p.months,f_sell:p.sell,f_loan:p.loan,f_rate:p.rate,f_refix:p.refix,f_fixstart:p.fixStart,f_term:p.term};
  for(var k in m){var e=$(k);if(e&&m[k]!==undefined&&m[k]!==null&&m[k]!==0)e.value=e.classList.contains('money')?fmtMoney(m[k]):m[k]}
}
// The three types of property, picked in the + menu (or switched at the top of the Add a property form): [type, icon, name].
var NEWT=[['rental','key','Rental'],['project','tool','Reno project'],['potential','search','Potential buy']];
var formAnim=false,newRent='existing';
// Opens Add a property with the form for that type (from the + menu, or a "add one first" button).
function newProp(t){
  newType=t;newIntent='flip';newRent='existing';newLoan='pi';loanOpen=false;lpReset();editIdx=null;formAnim=true;form();formAnim=false;go(2);$('p2').scrollTop=0;
  var f=$('f_addr');if(f&&matchMedia('(pointer:fine)').matches)f.focus();
}
var OPT=' <i class="opt">optional</i>';
function fsec(n,t){return '<p class="fsec">'+ic(n)+t+'</p>'}
var ADDBAR='<div class="pagebar"><button class="pback" data-back aria-label="Back">'+ic('back')+'</button><b>Add a property</b></div>';
function form(){
  clearTimeout(acT);acList=[];acSel=-1;
  if(editIdx===null&&!newType){$('sheet').hidden=true;$('sheetbody').innerHTML='';$('p2').innerHTML=ADDBAR;return}
  var pr=newType==='project',pt=newType==='potential',flip=newIntent==='flip',sd=editIdx===null||editSec==='details',sl=!pt&&(editIdx===null||editSec==='loan');
  var N=MONEY,ed=editIdx!==null;
  // Rentals: an existing one (owned a while) needs only its value, not the purchase details; a new one needs the
  // price and date. Rentals added before this choice existed keep all the fields, optional.
  var rt=newType==='rental',held=rt&&(ed?!!props[editIdx].held:newRent==='existing'),rnew=rt&&!ed&&!held;
  var RQ=' required';
  var h='<div class="card'+(formAnim?' enter':'')+'">'+(editIdx===null?'<b>What are you adding?</b><div class="seg segt">'+NEWT.map(function(t){return '<button data-t="'+t[0]+'" class="'+(t[0]===newType?'on':'')+'">'+t[2]+'</button>'}).join('')+'</div>':'<b>'+(editSec==='loan'?'Edit mortgage':'Edit property details')+'</b>')+'<p class="sub" style="margin-top:4px">Fields marked optional can be left blank.</p>'+
   (pt?'<label>Plan</label><div class="seg"><button data-n="flip" class="'+(flip?'on':'')+'">Reno to sell</button><button data-n="rental" class="'+(flip?'':'on')+'">Buy to rent</button></div>':'')+
   (rt&&!ed?'<label>Rental</label><div class="seg"><button data-rk="existing" class="'+(held?'on':'')+'">Existing rental</button><button data-rk="new" class="'+(held?'':'on')+'">New rental</button></div>'+
     '<p class="sub" style="margin-top:4px">'+(held?'One you’ve owned a while: just its value now, no purchase details needed.':'One you’ve just bought: with the purchase price and costs.')+'</p>':'')+
   (sd?'<label>Address</label><div class="ac"><input id="f_addr" class="acin" data-sub="f_sub" data-next="'+(held?'f_value':'f_price')+'" placeholder="Start typing, e.g. 12 Queen Street" autocomplete="off" required><div class="sugg" role="listbox" hidden></div></div>'+
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
     :'<div class="fgrid"><div><label>Value after reno</label><input id="f_value"'+RQ+N+'</div><div><label>Weekly rent</label><input id="f_rent"'+RQ+N+'</div><div><label>Annual expenses</label><input id="f_exp"'+RQ+N+'</div><div><label>Months until tenanted</label><input id="f_months"'+RQ+NUM+'</div><div><label>Management fee %'+OPT+'</label><input id="f_mgmt" placeholder="Blank if none"'+NUM+'</div></div>')+
   (editIdx===null&&SHOW_COMPS?'<p class="sub" style="margin-top:10px">You can add comparable sales once it’s saved.</p>':''):'')+
   // Rentals may have been owned for decades, so their purchase details are optional (then the value is needed instead).
   (sd&&!pt?(held?'<label>Estimated value now (NZD)</label><input id="f_value"'+RQ+N+
     '<label>Purchase date (optional)</label><input id="f_date" type="date"><p class="sub" style="margin-top:4px">Roughly when you bought it, for how long you’ve owned it and the value chart.</p>'
   :'<label>Purchase price (NZD)'+(pr||rnew?'':' (optional)')+'</label><input id="f_price"'+(pr||rnew?RQ:'')+N+
   '<label>Purchase date'+(pr||rnew?'':' (optional)')+'</label><input id="f_date" type="date"'+(pr||rnew?' required':'')+'>'+
   (pr||rnew?'':'<p class="sub" style="margin-top:4px">Leave these blank if you don’t have them to hand, and add the current loan balance or estimated value below.</p>')+
   (pr?'<label>Legal fees and other purchase costs (optional)</label><input id="f_legal"'+N+'<p class="sub" style="margin-top:4px">Lawyer’s fees plus things like the builder’s report, LIM and valuation.</p>'
      :'<label>Legal fees (optional)</label><input id="f_legal"'+N+'<label>Healthy Homes / quick reno costs (optional)</label><input id="f_extra"'+N)+
   '<label>Estimated value now (optional)</label><input id="f_value" placeholder="Leave blank to use the purchase price"'+N)+
   (pr?'<label>Renovation budget (NZD)</label><input id="f_budget"'+RQ+N+(editIdx!==null&&(props[editIdx].items||[]).length?'<p class="sub" style="margin-top:8px">Spent so far is added up from your itemised reno costs.</p>':'<label>Spent so far (optional)</label><input id="f_spent"'+N)
      :'<label>Weekly rent (NZD)</label><input id="f_rent"'+RQ+N+'<label>Annual expenses (NZD)</label><input id="f_exp" placeholder="Rates, insurance, maintenance etc."'+RQ+N+'<p class="sub rlink" id="ratelink"></p>'+
       '<label>Management fee % of rent (optional)</label><input id="f_mgmt" placeholder="Leave blank if you manage it yourself"'+NUM+
       '<p class="sub" style="margin-top:4px">What your property manager charges in total, including any GST. Leave it out of annual expenses.</p>')+'':'')+
   // When adding, the optional mortgage sits in a collapsed section so the form stays short.
   (sl?(editIdx===null?'<details class="more" id="loanmore"'+(loanOpen||lpN>1?' open':'')+'><summary>Mortgage details (if there’s a loan)</summary>'+lpForm()+'</details>':lpForm()):'')+
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
    for(var i=0;i<lpN;i++){var x=L[i]||{},m={};m['l_amt'+i]=x.loan;m['l_rate'+i]=x.rate;m['l_fs'+i]=x.fixStart;m['l_rf'+i]=x.refix;setv(m);
      $('l_fix'+i).value=x.fixTerm||(x.refix?'custom':'');
      // A term that isn't one of the standard ones shows as Other, with its months.
      if(/^\d+$/.test(x.fixTerm||'')&&FIXSTD.indexOf(x.fixTerm)<0){$('l_fix'+i).value='other';$('l_om'+i).value=x.fixTerm}
      // An existing rental saved with a term and start date shows the date they work out to.
      if(isHeld()&&x.fixTerm&&x.fixTerm!=='float'&&x.fixTerm!=='custom'){$('l_fix'+i).value='custom';$('l_rf'+i).value=refixOf(x)||''}if(!$('l_fs'+i).value&&x.loan)$('l_fs'+i).value=iso(new Date())}
    termSet(0,L[0]||{});fixAll();
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
  // An existing rental's loan needs its remaining term (years and months, or the end date, which fills them in).
  r=$('l_ty0');if(isHeld()&&r&&box.contains(r)&&!num('l_ty0')&&!num('l_tm0')&&[].some.call(box.querySelectorAll('[id^=l_amt]'),function(e){return pnum(e.value)}))bad.push(r);
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
    m.textContent=/^l_ty/.test(e.id)?'Add the years and months left, or the date the loan ends':/rate/.test(e.id)?'Needed when there’s a loan amount':e.id==='f_price'&&newType==='rental'?'Add the purchase price, or the current loan balance below':'Required';
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
  f.textContent=n.length?'To save, fill in '+(n.length>1?n.slice(0,-1).join(', ')+(n.length>2?',':'')+' and '+n[n.length-1]:n[0])+'.':'';
}
// A field, or its wrapper when it has one (the address field sits in a box with its suggestions).
function fieldBox(e){return e.parentElement.classList.contains('ac')?e.parentElement:e}
// The label for a field: the one just before it, or one pointing at it with for="".
function fieldLabel(e){var l=fieldBox(e).previousElementSibling;if(l&&l.tagName==='LABEL')return l;return e.id?document.querySelector('label[for="'+e.id+'"]'):null}
// A field's name for the summary, without notes like "(NZD)" or "(optional)", or a unit like "%" on the end.
function fieldName(e){if(e.dataset.name)return e.dataset.name;var l=fieldLabel(e),t=l?l.childNodes[0].textContent:'this field';return t.replace(/\s*\(.*$/,'').replace(/\s*%$/,'').trim()}
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
  setLoan(props[editIdx],readParts());noteLoan(props[editIdx]);
  isSample=false;cur=editIdx;editIdx=null;lpReset();newType=null;render();go(1,true);ovClose('sheet');
}
function addProp(){
  if(missing())return;
  if(editIdx!==null&&editSec==='loan')return saveLoan();
  var wasEdit=editIdx!==null;
  var a=$('f_addr').value.trim();
  var p={type:newType,addr:a,sub:$('f_sub').value.trim(),price:num('f_price'),value:num('f_value')||(newType==='potential'?0:num('f_price')),date:($('f_date')||{}).value||'',legal:num('f_legal'),extra:num('f_extra')};
  if(newType==='potential'){delete p.date;p.intent=newIntent;p.beds=num('f_beds');p.land=num('f_land');p.reno=num('f_reno');p.rates=num('f_rates');p.ins=num('f_ins');p.power=num('f_power');p.oth=num('f_oth');p.loan=num('f_loan');p.rate=p.loan?num('f_rate'):0;p.ltype=newLoan;p.term=num('f_term')||30;p.hold=holdOf(p);p.months=num('f_months');if(newIntent==='flip')p.sell=num('f_sell');else{p.rent=num('f_rent');p.exp=num('f_exp');p.mgmt=num('f_mgmt')}}
  else if(newType==='project'){p.budget=num('f_budget');p.spent=num('f_spent')}
  else{p.rent=num('f_rent');p.exp=num('f_exp');p.mgmt=num('f_mgmt');if(!wasEdit){p.setup=1;if(newRent==='existing')p.held=1}}
  if(newType!=='potential')setLoan(p,readParts());
  isSample=false;newLoan='pi';lpReset();loanOpen=false;newType=null;if(editIdx!==null){var o=props[editIdx];['loan','rate','refix','fixTerm','fixStart','ltype','term','parts','comps','items','cats','start','target','target0','hold','tasks','done','plan','beds','land','spent','money','ten','hh','hhDocs','hhDate','pics','photo','vals','valueAt','rates','ins','power','oth','rents','loans','tgt','tgtT','fromProject','held','setup'].forEach(function(k){if(o[k]!==undefined&&p[k]===undefined)p[k]=o[k]});if(p.value!==o.value)noteVal(p);syncSpent(p);props[editIdx]=p;cur=editIdx;editIdx=null}else{if(num('f_value'))noteVal(p);if(p.loan)noteLoan(p);props.push(p);cur=props.length-1;resetCur()}render();go(1,true);if(wasEdit)ovClose('sheet');
}
// Re-render the form without losing what's been typed (e.g. when switching type or plan).
function keepForm(){var v={},lm=$('loanmore'),cty=$('f_sub')&&$('f_sub').dataset.county;loanOpen=!!(lm&&lm.open);(editIdx===null?$('p2'):$('sheetbody')).querySelectorAll('input[id],select[id]').forEach(function(e){if(e.value)v[e.id]=e.value});form();for(var k in v){var e=$(k);if(e)e.value=v[k]}
  // An existing rental's switch starts on Fixed: carried to the term list, it stays only if a fixed-until date was entered.
  for(var i=0;i<lpN;i++){var s=$('l_fix'+i);if(s&&!s.hidden&&s.value==='custom'&&!$('l_rf'+i).value)s.value=''}if(cty&&$('f_sub'))$('f_sub').dataset.county=cty;holdCalc();fixAll();syncFs();rateLink()}
// Rates lookup: a link to the property's council rates search, under the rates (potential buys) or annual expenses
// (rentals) field. The council comes from the picked address suggestion (data-county on the suburb field) or the suburb / city.
function rateLink(){
  var el=$('ratelink');if(!el)return;
  var s=$('f_sub'),r=ratesLink($('f_addr').value.trim(),s.value.trim(),s.dataset.county);
  el.innerHTML=r?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+ic('search')+esc(r.label)+' ↗</a><span>'+(newType==='rental'?'Rates are part of annual expenses. ':'')+(r.direct?'Use the total rates for the year.':'Search your address there, then use the total rates for the year.')+'</span>'
    :'Enter the suburb / city to get a link to the council’s rates search.';
}
function closeSheet(){ovClose('sheet')}
function closeSheetNow(){editIdx=null;newType=null;taxOne=null;form()}
$('sheetbg').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('sheet').hidden&&!acList.length)closeSheet()});
['p2','sheetbody'].forEach(function(id){
$(id).addEventListener('change',function(e){var m=/^l_(fix|om|fs|rf)(\d+)$/.exec(e.target.id);if(m)fixPreview(+m[2]);if(e.target.id==='f_date')syncFs();
  // Years entered with no months: months becomes 0 on leaving the field, so it's clear nothing's missing.
  if(e.target.id==='l_ty0'&&num('l_ty0')&&!$('l_tm0').value)$('l_tm0').value='0'});
$(id).addEventListener('input',function(e){
  if(e.target.classList.contains('bad'))unbad(e.target);
  // A rental needs a purchase price only when there's no loan balance or value, so typing either clears it.
  if(/^(l_amt0|f_value)$/.test(e.target.id)&&e.target.value&&$('f_price')&&$('f_price').classList.contains('bad')&&(newType||(editIdx!==null&&props[editIdx].type))==='rental')unbad($('f_price'));
  if(/^f_(rates|ins|power|oth|loan|rate|term|months)$/.test(e.target.id))holdCalc();
  if(e.target.id==='f_date')syncFs();
  var la=/^l_amt(\d+)$/.exec(e.target.id);if(la)loanAmt(+la[1]);
  var lt=/^l_(ty|tm|te)(\d+)$/.exec(e.target.id);
  if(lt){termFrom(+lt[2],lt[1]);var ty=$('l_ty'+lt[2]);if(ty.classList.contains('bad')&&(num(ty.id)||num('l_tm'+lt[2])))unbad(ty)}
  if(e.target.id==='f_sub'||e.target.id==='f_addr'){if(e.target.id==='f_sub'&&e.isTrusted)delete e.target.dataset.county;rateLink()}
});
$(id).addEventListener('click',function(e){
  var l=e.target.closest('[data-l]');
  if(l){var sg=l.parentNode;if(sg.dataset.p)lpT[+sg.dataset.p]=l.dataset.l;else newLoan=l.dataset.l;sg.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===l)});holdCalc();return}
  var fx=e.target.closest('[data-fx]');
  if(fx){var k=fx.parentNode.dataset.fp;$('l_fix'+k).value=fx.dataset.fx;fixPreview(+k);return}
  // Split the loan / add or remove a loan part, keeping what's been typed in the others.
  var lp=e.target.closest('[data-lp]');
  if(lp){var d=lpRead();if(lp.dataset.lp==='add'){lpN++;lpT.push('pi');keepForm();var f=$('l_amt'+(lpN-1));if(f)f.focus()}else{var k=+lp.dataset.lp;d.splice(k,1);lpT.splice(k,1);lpN--;keepForm();lpWrite(d)}return}
  var b=e.target.closest('[data-t]');
  if(b){if(b.dataset.t!==newType){newType=b.dataset.t;keepForm()}return}
  var n=e.target.closest('[data-n]');
  if(n){newIntent=n.dataset.n;keepForm();return}
  var rk=e.target.closest('[data-rk]');
  if(rk){if(rk.dataset.rk!==newRent){newRent=rk.dataset.rk;keepForm()}return}
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
