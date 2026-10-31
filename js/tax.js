// Tax-year summary for an accountant (Settings): rental income and expenses by category, reno costs, and an estimate
// of mortgage interest, for one NZ tax year (1 April to 31 March) across every owned property. It's a record of what's
// been entered, not tax advice: what's deductible (interest especially) is for the accountant, so the notes say so.
var taxY=null;
function tyStartOf(y){return y+'-04-01'}
function tyEndOf(y){return (y+1)+'-03-31'}
function tyLabel(y){return y+'–'+String(y+1).slice(2)}
// The period counted: the tax year, but only up to today for the current one.
function tyRange(y){var t=iso(new Date()),e=tyEndOf(y);return [tyStartOf(y),e<t?e:t]}
// Mortgage interest over the period, month by month on each part's estimated balance (loanAt in charts.js: P&I
// parts paid down, interest-only level) at its current rate. An estimate, since rates change.
function taxInterest(p,a,b){
  var s=p.date&&p.date>a?p.date:a,end=addDays(b,1),t=0;if(s>b)return 0;
  for(var d=s,n;d<end;d=n){n=addMonths(d,1);if(n>end)n=end;var days=dd(d,n),at=d;t+=sum(parts(p),function(x){return partAt(p,x,at)*(x.rate||0)/100*days/365})}
  return t;
}
function taxProps(y){
  var r=tyRange(y),a=r[0],b=r[1];
  return props.map(function(p,i){
    if(p.type==='potential')return null;
    var inc={},exp={},reno={},ni=0,ne=0,nr=0;
    (p.money||[]).forEach(function(x){var v=mIn(x,a,b);if(!v)return;var o=x.kind==='in'?inc:exp;o[x.cat]=(o[x.cat]||0)+v;if(x.kind==='in')ni+=v;else ne+=v});
    (p.items||[]).forEach(function(x){if(!x.date||x.date<a||x.date>b||!x.amt)return;reno[x.cat]=(reno[x.cat]||0)+x.amt;nr+=x.amt});
    var int=taxInterest(p,a,b);
    if(!ni&&!ne&&!nr&&!int)return null;
    return {p:p,i:i,inc:inc,exp:exp,reno:reno,ni:ni,ne:ne,nr:nr,int:int};
  }).filter(Boolean);
}
function taxRows(o){var h='';for(var k in o)h+='<div class="r"><span>'+esc(k)+'</span><b>'+$$(o[k])+'</b></div>';return h}
function taxBody(y){
  var L=taxProps(y),r=tyRange(y);
  var h='<p class="sub" style="margin-top:8px">'+fmtD(r[0])+' to '+fmtD(r[1])+(r[1]<tyEndOf(y)?' (so far)':'')+'</p>';
  // Invoiced reno costs with no date can't be placed in a tax year, so they're left out: say how many, and where.
  var nd=[];props.forEach(function(p){if(p.type!=='potential')(p.items||[]).forEach(function(x){if(x.amt&&!x.date)nd.push(p.addr)})});
  if(nd.length)h+='<p class="sub neg" style="margin-top:6px">'+nd.length+' reno cost'+(nd.length>1?'s have':' has')+' no date, so '+(nd.length>1?'they’re':'it’s')+' not included ('+esc(nd.filter(function(a,i){return nd.indexOf(a)===i}).join(', '))+'). Add a date in Costs to count '+(nd.length>1?'them':'it')+'.</p>';
  if(!L.length)return h+'<p class="sub" style="margin-top:8px">Nothing entered for this tax year yet.</p>';
  L.forEach(function(x){
    h+='<p class="grp" style="margin:14px 0 0">'+esc(x.p.addr)+'</p><div class="list">';
    if(x.ni)h+=taxRows(x.inc);
    if(x.ne)h+=taxRows(x.exp);
    if(x.ni||x.ne)h+='<div class="r"><span>Net from entries</span><b class="'+(x.ni-x.ne<0?'neg':'pos')+'">'+$$(x.ni-x.ne)+'</b></div>';
    if(x.nr)h+='<div class="r"><span>Reno costs invoiced (incl. GST)</span><b>'+$$(x.nr)+'</b></div>';
    if(x.int)h+='<div class="r"><span>Mortgage interest (estimate)</span><b>'+$$(x.int)+'</b></div>';
    h+='</div>';
  });
  var ti=sum(L,function(x){return x.ni}),te=sum(L,function(x){return x.ne}),tr=sum(L,function(x){return x.nr}),tn=sum(L,function(x){return x.int});
  h+='<p class="grp" style="margin:14px 0 0">All properties</p><div class="list">'+
    '<div class="r"><span>Income</span><b>'+$$(ti)+'</b></div><div class="r"><span>Expenses</span><b>'+$$(te)+'</b></div>'+
    (tr?'<div class="r"><span>Reno costs</span><b>'+$$(tr)+'</b></div>':'')+(tn?'<div class="r"><span>Mortgage interest (estimate)</span><b>'+$$(tn)+'</b></div>':'')+'</div>';
  return h+'<p class="sub" style="margin-top:10px">Only what’s been entered in the app. Interest is estimated from each loan’s balance (paid down month by month for P&amp;I) at its current rate, so use your bank’s annual interest statement for your return. Rules on what’s deductible (interest, and whether reno costs are repairs or capital) change, so check with your accountant or IRD.</p>';
}
function taxCard(){
  var y0=+taxYearStart().slice(0,4);if(taxY===null)taxY=y0;
  var h='<div class="card" id="taxcard">'+hd('file','Tax year summary')+'<p class="sub" style="margin-top:4px">Income, expenses, reno costs and estimated interest for one tax year, across all your properties. For your accountant.</p>'+
    '<div class="seg" style="margin-top:12px">'+[y0,y0-1,y0-2].map(function(y){return '<button data-ty="'+y+'" class="'+(y===taxY?'on':'')+'">'+tyLabel(y)+'</button>'}).join('')+'</div>'+taxBody(taxY);
  if(taxProps(taxY).length)h+='<div class="btns"><button class="go" data-x="taxcsv">Download CSV</button><button class="go ghost" data-x="taxprint">Print or save as PDF</button></div>';
  return h+'</div>';
}
// Every entry in the year, one row each (weekly rent one row per week), for a spreadsheet.
function exportTax(y){
  var r=tyRange(y),a=r[0],b=r[1],rows=[['Property','Date','Type','Category','Description','Amount (NZD)','Receipt files']];
  taxProps(y).forEach(function(x){
    var p=x.p;
    (p.money||[]).forEach(function(m){
      (m.n?weekDates(m).map(function(d,k){return {date:d,amt:m.wk,note:'Week '+(k+1)+' of '+m.n+(m.note?' · '+m.note:''),rc:k?[]:m.rc}}):[m]).forEach(function(e){
        if(e.date<a||e.date>b)return;
        rows.push([p.addr,e.date,m.kind==='in'?'Income':'Expense',m.cat,e.note||'',e.amt,(e.rc||[]).map(function(f){return f.name}).join('; ')]);
      });
    });
    (p.items||[]).forEach(function(m){if(m.date&&m.date>=a&&m.date<=b&&m.amt)rows.push([p.addr,m.date,'Reno cost',m.cat,[m.desc,m.who].filter(Boolean).join(' · '),m.amt,(m.rc||[]).map(function(f){return f.name}).join('; ')])});
    if(x.int)rows.push([p.addr,b,'Interest (estimate)','Mortgage interest','Estimated from the loan balance (paid down for P&I) and current rate',Math.round(x.int*100)/100,'']);
  });
  var head=rows.shift();rows.sort(function(m,n){return (m[0]+m[1]).localeCompare(n[0]+n[1])});
  download('tax-year-'+tyLabel(y).replace('–','-')+'.csv','﻿'+[head].concat(rows).map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),'text/csv');
}
// Prints just the summary (the phone's print screen can save it as a PDF).
function printTax(y){
  var d=$('printout');if(!d){d=document.createElement('div');d.id='printout';document.body.appendChild(d)}
  d.innerHTML='<h1>Tax year summary '+tyLabel(y)+'</h1>'+taxBody(y);
  document.body.classList.add('printing');
  setTimeout(function(){window.print();document.body.classList.remove('printing')},50);
}
$('setbody').addEventListener('click',function(e){
  var t=e.target.closest('[data-ty]');if(t){taxY=+t.dataset.ty;drawSettings();return}
  var b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='taxcsv')exportTax(taxY);
  if(b.dataset.x==='taxprint')printTax(taxY);
});
