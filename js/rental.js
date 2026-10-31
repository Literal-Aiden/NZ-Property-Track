// Rentals: money in and out (with receipts), tenancy details, the Healthy Homes checklist,
// and turning a finished reno project into a rental.
var MCATS={in:['Rent','Other income'],out:['Rates','Insurance','Repairs & maintenance','Property management','Body corporate','Water','Other']};
var moneyEdit=null,moneyKind='in',moneyAll=false,tenEdit=false,rentOpen=false;
// The NZ tax year runs 1 April to 31 March.
function taxYearStart(){var d=new Date(),y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return y+'-04-01'}

// Income can be one payment, or the same amount weekly for a number of weeks (x.wk a week, x.n weeks from x.date,
// x.amt the total). Weekly entries only count the weeks dated within a period, so totals to date and tax years stay right.
function weekDates(x){var a=[];for(var k=0;k<(x.n||1);k++)a.push(k?addDays(x.date,7*k):x.date);return a}
function mIn(x,a,b){if(!x.n)return x.date>=a&&(!b||x.date<=b)?x.amt:0;return weekDates(x).filter(function(d){return d>=a&&(!b||d<=b)}).length*x.wk}
function moneyCard(p){
  var M=p.money||[],ty=taxYearStart(),today=iso(new Date()),busy=moneyEdit!==null;
  var h='<div class="card" id="money"><div class="row" style="cursor:default">'+hd('dollar','Money in and out')+''+(M.length&&!busy?'<button class="edit" data-x="mcsv">Export CSV</button>':'')+'</div>';
  if(busy)return h+moneyForm(p)+'</div>';
  if(!M.length)return h+empty('dollar','No rent or bills logged yet','Record rent received and bills paid, with receipt photos, to see how the property is really doing and to make tax time easier.',
    '<div class="btns"><button class="go" data-x="madd" data-kind="in">Log rent</button><button class="go ghost" data-x="madd" data-kind="out">Add expense</button></div>')+'</div>';
  var inc=sum(M,function(x){return x.kind==='in'?mIn(x,ty,today):0}),out=sum(M,function(x){return x.kind==='out'?mIn(x,ty,today):0});
  var rentIn=sum(M,function(x){return x.kind==='in'&&x.cat==='Rent'?mIn(x,ty,today):0}),from=p.date&&p.date>ty?p.date:ty,exp=p.rent*Math.max(0,dd(from,today))/7;
  h+='<div class="grid">'+stat('Income this tax year',$$(inc))+stat('Expenses this tax year',$$(out))+stat('Net this tax year',$$(inc-out),inc-out<0?'neg':'pos')+
    stat('Rent received, of '+$$(exp)+' expected',$$(rentIn),rentIn<exp-p.rent?'neg':'')+'</div>'+
    '<p class="sub" style="margin-top:8px">Tax year from '+fmtD(ty)+', up to today. Expected rent is '+$$(p.rent)+' a week since '+fmtD(from)+'. Mortgage repayments are under Mortgage.</p>';
  if(M.length){
    var order=M.map(function(x,j){return j}).sort(function(a,b){return (M[b].date||'').localeCompare(M[a].date||'')}),shown=moneyAll?order:order.slice(0,10);
    h+='<div class="items" style="margin-top:12px;border:0;padding:0">'+shown.map(function(j){
      var x=M[j],n=(x.rc||[]).length,inn=x.kind==='in',sofar=x.n?mIn(x,'',today):0;
      var when=x.n?x.n+' weeks × '+$$(x.wk)+', '+fmtD(x.date)+' – '+fmtD(weekDates(x).pop())+(sofar<x.amt?' · '+$$(sofar)+' to date':''):x.date?fmtD(x.date):'';
      return '<div class="item" data-x="mitem" data-k="'+j+'"><div><b>'+esc(x.cat)+'</b><p class="sub">'+[when,esc(x.note||''),n?n+' receipt'+(n>1?'s':''):''].filter(Boolean).join(' · ')+'</p></div>'+
        '<div class="cr"><b class="'+(inn?'pos':'')+'">'+(inn?'+':'−')+$$(x.amt)+'</b></div></div>';
    }).join('')+'</div>';
    if(order.length>10)h+='<button class="edit" data-x="mall" style="margin-top:10px">'+(moneyAll?'Show recent only':'Show all '+order.length)+'</button>';
  }
  return h+'<div class="btns"><button class="go" data-x="madd" data-kind="in">Add income</button><button class="go ghost" data-x="madd" data-kind="out">Add expense</button></div></div>';
}
function moneyForm(p){
  var x=moneyEdit==='new'?{}:p.money[moneyEdit],rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  return '<p class="grp" style="margin:14px 0 0">'+(moneyEdit==='new'?'Add':'Edit')+' '+(moneyKind==='in'?'income':'expense')+'</p>'+
   '<div class="seg" style="margin-top:8px"><button data-x="mkind" data-kind="in" class="'+(moneyKind==='in'?'on':'')+'">Income</button><button data-x="mkind" data-kind="out" class="'+(moneyKind==='out'?'on':'')+'">Expense</button></div>'+
   '<label>Category</label><select id="m_cat">'+MCATS[moneyKind].map(function(c){return '<option'+(c===x.cat?' selected':'')+'>'+esc(c)+'</option>'}).join('')+'</select>'+
   (moneyKind==='in'?'<label>Paid</label><select id="m_rep"><option value="once">One payment</option><option value="wks">Weekly, for a number of weeks</option><option value="until">Weekly, until a date</option></select>':'')+
   '<div class="grid" style="margin-top:0"><div><label id="m_datel">Date</label><input id="m_date" type="date" required></div><div><label id="m_amtl">Amount</label><input id="m_amt" required'+MONEY+'</div>'+
   (moneyKind==='in'?'<div id="m_wksw" hidden><label>Number of weeks</label><input id="m_wks"'+NUM+'</div><div id="m_untw" hidden><label>Until</label><input id="m_until" type="date"></div>':'')+'</div>'+
   (moneyKind==='in'?'<p class="sub" id="m_repout" style="margin-top:6px;color:var(--ink);font-weight:600"></p>':'')+
   '<label>Note (optional)</label><input id="m_note" placeholder="'+(moneyKind==='in'?'e.g. 4 weeks to 30 Oct':'e.g. Q2 rates instalment')+'">'+
   '<label>Receipts and invoices (optional)</label>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
   '<div class="rcs">'+rc.map(rcThumb).join('')+rcCam()+'<label class="rcadd">'+ic('file')+'Photo or PDF<input type="file" class="rcin" accept="image/*,application/pdf" multiple hidden></label></div>'+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<div class="btns fbar"><button class="go" data-x="msave">'+(moneyEdit==='new'?'Add':'Save')+'</button><button class="go ghost" data-x="mcancel">Cancel</button></div>'+
   (moneyEdit==='new'?'':'<button class="edit del" data-x="mdel" style="margin-top:12px">Delete this entry</button>');
}
// Weekly income: how many weekly payments the form describes (0 for one payment). "Until" counts each week starting on or before that date.
function mWeeks(){
  var r=$('m_rep'),v=r?r.value:'once';if(v==='wks')return Math.floor(num('m_wks'));
  if(v==='until'){var a=$('m_date').value,b=$('m_until').value;return a&&b&&b>=a?Math.floor(dd(a,b)/7)+1:0}
  return 0;
}
// Show the fields for the chosen way of paying, mark them required, and preview the payments.
function mRep(){
  var r=$('m_rep');if(!r)return;var v=r.value,wk=v!=='once',n=mWeeks(),a=$('m_date').value,amt=num('m_amt');
  $('m_wksw').hidden=v!=='wks';$('m_untw').hidden=v!=='until';
  if(v==='wks')$('m_wks').setAttribute('required','');else $('m_wks').removeAttribute('required');
  if(v==='until')$('m_until').setAttribute('required','');else $('m_until').removeAttribute('required');
  $('m_amtl').textContent=wk?'Amount per week':'Amount';$('m_datel').textContent=wk?'First week':'Date';
  $('m_repout').textContent=wk&&n>0&&amt&&a?n+' weekly payment'+(n>1?'s':'')+' of '+$$(amt)+' = '+$$(amt*n)+', '+fmtD(a)+' to '+fmtD(addDays(a,7*(n-1)))+'.':'';
}
function saveMoney(p){
  if(missing($('money')))return;
  var wk=$('m_rep')&&$('m_rep').value!=='once',n=mWeeks();
  if(wk&&n<1){var bad=$('m_rep').value==='wks'?$('m_wks'):$('m_until');bad.classList.add('bad');bad.focus();$('money').querySelector('.formerr').classList.add('on');$('money').querySelector('.formerr').textContent=$('m_rep').value==='wks'?'Enter at least 1 week.':'The “until” date needs to be on or after the first week.';return}
  var x=moneyEdit==='new'?{id:uid()}:p.money[moneyEdit];
  x.kind=moneyKind;x.cat=$('m_cat').value;x.date=$('m_date').value;x.amt=num('m_amt');x.note=$('m_note').value.trim();
  delete x.wk;delete x.n;if(wk&&x.kind==='in'){x.wk=x.amt;x.n=n;x.amt=x.wk*n}
  x.rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  rcDel(dropRc);
  if(moneyEdit==='new')(p.money=p.money||[]).push(x);
  pendRc=[];dropRc=[];closeItem();isSample=false;render();
}
function exportMoney(p){
  // Weekly income is one row per week, so an accountant can split it by tax year.
  var all=[];(p.money||[]).forEach(function(x){if(!x.n)all.push(x);else weekDates(x).forEach(function(d,k){all.push({date:d,kind:x.kind,cat:x.cat,amt:x.wk,note:'Week '+(k+1)+' of '+x.n+(x.note?' · '+x.note:''),rc:k?[]:x.rc})})});
  var rows=[['Date','Type','Category','Amount','Note','Receipt files']].concat(all.sort(function(a,b){return (a.date||'').localeCompare(b.date||'')}).map(function(x){
    return [x.date||'',x.kind==='in'?'Income':'Expense',x.cat,x.amt,x.note||'',(x.rc||[]).map(function(r){return r.name}).join('; ')]}));
  download(slug(p.addr)+'-money.csv','﻿'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),'text/csv');
}

// Tenancy details. Rent increase timing is a legal rule, so it's shown with a pointer to check it.
var HH=[['heat','Heating'],['ins','Insulation'],['vent','Ventilation'],['moist','Moisture ingress and drainage'],['draught','Draught stopping']];
function hhLeft(p){var h=p.hh||{};return HH.filter(function(s){return !h[s[0]]}).length}
// Rent box at the top of Tenancy, where people tend to look for the rent: the weekly rent, "Change rent" (a rise also
// becomes the tenancy's last rent increase, which sets the next one) and "Log rent received" (opens the Money form).
// Each change is kept in p.rents as {d, v}.
var rentChg=false;
function rentCard(p){
  var t=p.ten||{},h='<div class="card" id="rentc">'+hd('dollar','Rent');
  if(rentChg)return h+'<div class="grid" style="margin-top:0"><div><label>New weekly rent</label><input id="r2_amt" required value="'+(p.rent?fmtMoney(p.rent):'')+'"'+MONEY+'</div>'+
    '<div><label>From</label><input id="r2_date" type="date" required value="'+iso(new Date())+'"></div></div>'+
    // Only shown when the new rent is higher (rentNote): a drop never changes the increase date.
    '<div id="r2_incw" hidden><label class="chk"><input type="checkbox" id="r2_inc" checked>This is a rent increase</label>'+
    '<p class="sub" style="margin:2px 0 0 28px">The next increase is then allowed 12 months after the From date. Untick it if you’re correcting the rent or a new tenancy is starting.</p></div>'+
    '<p class="sub" id="r2_note" style="margin-top:6px"></p><p class="sub neg formerr" style="margin-top:8px" role="alert"></p>'+
    '<div class="btns fbar"><button class="go" data-x="rentsave">Save rent</button><button class="go ghost" data-x="rentcancel">Cancel</button></div></div>';
  return h+'<div class="big2" style="margin-top:6px">'+$$(p.rent||0)+' <span class="sub" style="font-size:15px">a week</span></div>'+
    (t.ri?'<p class="sub">Last increase '+fmtD(t.ri)+'</p>':'')+
    '<div class="btns"><button class="go" data-x="rentlog">Log rent received</button><button class="go ghost" data-x="rentchg">Change rent</button></div></div>';
}
// Live note while changing the rent: the size of the change, and a warning if a rise comes within 12 months of the last.
function rentNote(p){
  var o=$('r2_note');if(!o)return;
  var v=num('r2_amt'),d=$('r2_date').value,ri=p.ten&&p.ten.ri,up=v>(p.rent||0),n='';
  $('r2_incw').hidden=!up;
  if(v&&p.rent&&v!==p.rent)n=(up?'Up ':'Down ')+$$(Math.abs(v-p.rent))+' a week ('+(up?'+':'−')+(Math.abs(v-p.rent)/p.rent*100).toFixed(1)+'%).';
  if(up&&$('r2_inc').checked&&ri&&d&&d<addMonths(ri,12))n+=' The last increase was '+fmtD(ri)+', less than 12 months before. Rent can usually only go up once every 12 months: check the current rules at tenancy.govt.nz.';
  o.textContent=n;o.className='sub'+(/12 months/.test(n)?' neg':'');
}
function saveRent(p){
  if(missing($('rentc')))return;
  var v=num('r2_amt'),d=$('r2_date').value;
  // The first change also records the rent before it (from the last increase, lease start or purchase, if known),
  // so the history shows where it started.
  var was=p.ten&&(p.ten.ri||p.ten.ls)||p.date;if(!(p.rents&&p.rents.length)&&p.rent&&was&&was<d)p.rents=[{d:was,v:p.rent}];
  if(v>(p.rent||0)&&$('r2_inc').checked)(p.ten=p.ten||{}).ri=d;
  p.rent=v;p.rents=(p.rents||[]).filter(function(x){return x.d!==d}).concat([{d:d,v:v}]);
  rentChg=false;isSample=false;render();
}
function tenCard(p){
  var t=p.ten||{},today=iso(new Date());
  var h=rentCard(p)+'<div class="card" id="ten"><div class="row" style="cursor:default">'+hd('users','Tenancy')+''+(tenEdit||!p.ten?'':'<button class="edit" data-x="tenedit">Edit</button>')+'</div>';
  if(tenEdit)h+='<label>Tenant name(s) (optional)</label><input id="t_who">'+
    '<div class="grid" style="margin-top:0"><div><label>Lease start (optional)</label><input id="t_ls" type="date"></div><div><label>Fixed term ends (optional)</label><input id="t_le" type="date"></div></div>'+
    '<p class="sub" style="margin-top:4px">Leave the end blank for a periodic tenancy.</p>'+
    '<label>Last rent increase (optional)</label><input id="t_ri" type="date">'+
    '<div class="grid" style="margin-top:0"><div><label>Bond (optional)</label><input id="t_bond"'+MONEY+'</div><div><label>&nbsp;</label><label class="chk" style="margin:10px 0 0"><input type="checkbox" id="t_lodged"'+(t.lodged?' checked':'')+'>Bond lodged</label></div></div>'+
    '<div class="btns fbar"><button class="go" data-x="tensave">Save</button><button class="go ghost" data-x="tencancel">Cancel</button></div>';
  else if(!p.ten)h+=empty('users','No tenancy details yet','Add the lease dates and bond to get reminders before the lease ends or the bond needs lodging.','<button class="go" data-x="tenedit">Add tenancy details</button>');
  else{
    var left=t.le?dd(today,t.le):null,next=t.ri?addMonths(t.ri,12):null;
    h+='<div class="grid">'+stat('Tenant',t.who?esc(t.who):'–')+stat(t.le?(left<0?'Fixed term ended':'Fixed term ends in '+left+' days'):'Tenancy',t.le?fmtD(t.le):'Periodic',left!==null&&left<=60?'neg':'')+
      stat('Bond',t.bond?$$(t.bond)+(t.lodged?' lodged':' not lodged'):'–',t.bond&&!t.lodged?'neg':'')+stat('Next rent increase from',next?fmtD(next):'–')+'</div>'+
      (next?'<p class="sub" style="margin-top:8px">Based on rent increases being allowed once every 12 months. Check the current rules at tenancy.govt.nz.</p>':'');
  }
  h+='</div>';
  var hh=p.hh||{},left2=hhLeft(p),docs=p.hhDocs||[];
  h+='<div class="card" id="hhcard"><div class="row" style="cursor:default">'+'<span class="hdq">'+hd('thermo','Healthy Homes standards')+'<a class="qmark" href="https://www.tenancy.govt.nz/healthy-homes/healthy-homes-standards-what-a-landlord-needs-to-know/" target="_blank" rel="noopener" aria-label="What the Healthy Homes standards need (tenancy.govt.nz)">?</a></span>'+'<span class="sub'+(left2?' neg':'')+'">'+(HH.length-left2)+' of '+HH.length+' done</span></div>'+
    '<p class="sub" style="margin-top:4px">Tick each standard once the property meets it. Check the current requirements and deadlines at tenancy.govt.nz.</p>'+
    (left2?'<button class="edit" data-x="hhall" style="margin-top:10px">'+(left2===HH.length?'Mark all '+HH.length+' as done':left2===1?'Mark the last one as done':'Mark the other '+left2+' as done')+'</button>':'')+
    HH.map(function(s){var d=hh[s[0]];return '<div class="task'+(d?' ok':'')+'"><input type="checkbox" data-x="hh" data-k="'+s[0]+'"'+(d?' checked':'')+' aria-label="'+s[1]+'"><div><b>'+s[1]+'</b><p class="sub">'+(d?'Done '+fmtD(d):'Not done yet')+'</p></div></div>'}).join('')+
    // Compliance reports (e.g. from an assessor) are stored like receipts and saved as soon as they're added.
    '<p class="grp" style="margin:16px 0 0">Compliance report</p>'+
    '<p class="sub" style="margin-top:4px">'+(docs.length?'Tap a file to open it.':'Upload the Healthy Homes compliance report or statement, as a PDF or photos.')+'</p>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
    '<div class="rcs">'+docs.map(function(r){return rcThumb(r,'hhdrop',hhArm===r.id)}).join('')+'<label class="rcadd">'+ic('file')+'Report<input type="file" class="hhin" accept="image/*,application/pdf" multiple hidden></label></div>'+
    (hhArm?'<p class="sub neg" style="margin-top:6px">Tap × again to remove that file.</p>':'')+'</div>';
  return h;
}
var hhArm=null;
function addHhDocs(p,files){
  rcMsg='';
  Promise.all([].slice.call(files).map(function(f){
    return shrink(f).then(function(b){var r={id:uid(),name:f.name,type:b.type||f.type,added:iso(new Date())};return rcPut(Object.assign({blob:b},r)).then(function(){return r})});
  })).then(function(l){p.hhDocs=(p.hhDocs||[]).concat(l);isSample=false;render()}).catch(function(){rcMsg='Couldn’t save that file in this browser. Private browsing can block it.';current()});
}
function saveTen(p){
  p.ten={who:$('t_who').value.trim(),ls:$('t_ls').value,le:$('t_le').value,ri:$('t_ri').value,bond:num('t_bond'),lodged:$('t_lodged').checked};
  tenEdit=false;isSample=false;render();
}

// A finished reno project becomes a rental. The reno spend stays in p.spent, so it's still in the total cost in.
function toRentBlock(p){
  if(!rentOpen)return '<button class="go ghost" data-x="torent">Renting it out? Turn into a rental</button>';
  return '<div class="near" id="torent">'+hd('key','Turn into a rental')+'<p class="sub" style="margin-top:4px">Your '+$$(p.spent||0)+' reno spend stays in the total cost in. Costs, receipts and the timeline are kept in your data and backups.</p>'+
   '<label>Weekly rent (NZD)</label><input id="r_rent" required'+MONEY+
   '<label>Annual expenses (NZD)</label><input id="r_exp" required'+MONEY+
   '<label>Estimated value now (optional)</label><input id="r_value" placeholder="'+$$(p.value)+'"'+MONEY+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<div class="btns fbar"><button class="go" data-x="rentok">Turn into a rental</button><button class="go ghost" data-x="rentno">Cancel</button></div></div>';
}
function toRental(p){
  if(missing($('torent')))return;
  p.type='rental';p.rent=num('r_rent');p.exp=num('r_exp');p.value=num('r_value')||p.value;p.fromProject=iso(new Date());
  rentOpen=false;sec='ov';isSample=false;render();$('p1').scrollTop=0;
}
['input','change'].forEach(function(t){$('p1').addEventListener(t,function(e){if(/^m_(rep|wks|until|date|amt)$/.test(e.target.id))mRep()})});
