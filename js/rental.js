// Rentals: money in and out (with receipts), tenancy details, the Healthy Homes checklist,
// and turning a finished reno project into a rental.
var MCATS={in:['Rent','Other income'],out:['Rates','Insurance','Repairs & maintenance','Property management','Body corporate','Water','Other']};
var moneyEdit=null,moneyKind='in',moneyAll=false,tenEdit=false,rentOpen=false;
// The NZ tax year runs 1 April to 31 March.
function taxYearStart(){var d=new Date(),y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;return y+'-04-01'}

function moneyCard(p){
  var M=p.money||[],ty=taxYearStart(),busy=moneyEdit!==null;
  var h='<div class="card" id="money"><div class="row" style="cursor:default">'+hd('dollar','Money in and out')+''+(M.length&&!busy?'<button class="edit" data-x="mcsv">Export CSV</button>':'')+'</div>';
  if(busy)return h+moneyForm(p)+'</div>';
  var yr=M.filter(function(x){return x.date>=ty}),inc=sum(yr,function(x){return x.kind==='in'?x.amt:0}),out=sum(yr,function(x){return x.kind==='out'?x.amt:0});
  var rentIn=sum(yr,function(x){return x.kind==='in'&&x.cat==='Rent'?x.amt:0}),from=p.date&&p.date>ty?p.date:ty,exp=p.rent*Math.max(0,dd(from,iso(new Date())))/7;
  h+='<div class="grid">'+stat('Income this tax year',$$(inc))+stat('Expenses this tax year',$$(out))+stat('Net this tax year',$$(inc-out),inc-out<0?'neg':'pos')+
    stat('Rent received, of '+$$(exp)+' expected',$$(rentIn),rentIn<exp-p.rent?'neg':'')+'</div>'+
    '<p class="sub" style="margin-top:8px">Tax year from '+fmtD(ty)+'. Expected rent is '+$$(p.rent)+' a week since '+fmtD(from)+'. Mortgage repayments are under Mortgage.</p>';
  if(M.length){
    var order=M.map(function(x,j){return j}).sort(function(a,b){return (M[b].date||'').localeCompare(M[a].date||'')}),shown=moneyAll?order:order.slice(0,10);
    h+='<div class="items" style="margin-top:12px;border:0;padding:0">'+shown.map(function(j){
      var x=M[j],n=(x.rc||[]).length,inn=x.kind==='in';
      return '<div class="item" data-x="mitem" data-k="'+j+'"><div><b>'+esc(x.cat)+'</b><p class="sub">'+[x.date?fmtD(x.date):'',esc(x.note||''),n?n+' receipt'+(n>1?'s':''):''].filter(Boolean).join(' · ')+'</p></div>'+
        '<div class="cr"><b class="'+(inn?'pos':'')+'">'+(inn?'+':'−')+$$(x.amt)+'</b></div></div>';
    }).join('')+'</div>';
    if(order.length>10)h+='<button class="edit" data-x="mall" style="margin-top:10px">'+(moneyAll?'Show recent only':'Show all '+order.length)+'</button>';
  }else h+='<p class="sub" style="margin-top:10px">Record rent received and bills paid, with receipt photos, to see how the property is really doing and to make tax time easier.</p>';
  return h+'<div class="btns"><button class="go" data-x="madd" data-kind="in">Add income</button><button class="go ghost" data-x="madd" data-kind="out">Add expense</button></div></div>';
}
function moneyForm(p){
  var x=moneyEdit==='new'?{}:p.money[moneyEdit],rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  return '<p class="grp" style="margin:14px 0 0">'+(moneyEdit==='new'?'Add':'Edit')+' '+(moneyKind==='in'?'income':'expense')+'</p>'+
   '<div class="seg" style="margin-top:8px"><button data-x="mkind" data-kind="in" class="'+(moneyKind==='in'?'on':'')+'">Income</button><button data-x="mkind" data-kind="out" class="'+(moneyKind==='out'?'on':'')+'">Expense</button></div>'+
   '<label>Category</label><select id="m_cat">'+MCATS[moneyKind].map(function(c){return '<option'+(c===x.cat?' selected':'')+'>'+esc(c)+'</option>'}).join('')+'</select>'+
   '<div class="grid" style="margin-top:0"><div><label>Date</label><input id="m_date" type="date" required></div><div><label>Amount</label><input id="m_amt" required'+MONEY+'</div></div>'+
   '<label>Note (optional)</label><input id="m_note" placeholder="'+(moneyKind==='in'?'e.g. 4 weeks to 30 Oct':'e.g. Q2 rates instalment')+'">'+
   '<label>Receipts and invoices (optional)</label>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
   '<div class="rcs">'+rc.map(rcThumb).join('')+'<label class="rcadd">+ Photo or PDF<input type="file" class="rcin" accept="image/*,application/pdf" multiple hidden></label></div>'+
   '<p class="sub neg formerr" style="margin-top:12px" role="alert"></p>'+
   '<div class="btns"><button class="go" data-x="msave">'+(moneyEdit==='new'?'Add':'Save')+'</button><button class="go ghost" data-x="mcancel">Cancel</button></div>'+
   (moneyEdit==='new'?'':'<button class="edit del" data-x="mdel" style="margin-top:12px">'+(delItem?'Tap to confirm delete':'Delete this entry')+'</button>');
}
function saveMoney(p){
  if(missing($('money')))return;
  var x=moneyEdit==='new'?{id:uid()}:p.money[moneyEdit];
  x.kind=moneyKind;x.cat=$('m_cat').value;x.date=$('m_date').value;x.amt=num('m_amt');x.note=$('m_note').value.trim();
  x.rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  rcDel(dropRc);
  if(moneyEdit==='new')(p.money=p.money||[]).push(x);
  pendRc=[];dropRc=[];closeItem();isSample=false;render();
}
function exportMoney(p){
  var rows=[['Date','Type','Category','Amount','Note','Receipt files']].concat((p.money||[]).slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'')}).map(function(x){
    return [x.date||'',x.kind==='in'?'Income':'Expense',x.cat,x.amt,x.note||'',(x.rc||[]).map(function(r){return r.name}).join('; ')]}));
  download(slug(p.addr)+'-money.csv','﻿'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),'text/csv');
}

// Tenancy details. Rent increase timing is a legal rule, so it's shown with a pointer to check it.
var HH=[['heat','Heating'],['ins','Insulation'],['vent','Ventilation'],['moist','Moisture ingress and drainage'],['draught','Draught stopping']];
function hhLeft(p){var h=p.hh||{};return HH.filter(function(s){return !h[s[0]]}).length}
function tenCard(p){
  var t=p.ten||{},today=iso(new Date());
  var h='<div class="card" id="ten"><div class="row" style="cursor:default">'+hd('users','Tenancy')+''+(tenEdit?'':'<button class="edit" data-x="tenedit">'+(p.ten?'Edit':'Add details')+'</button>')+'</div>';
  if(tenEdit)h+='<label>Tenant name(s) (optional)</label><input id="t_who">'+
    '<div class="grid" style="margin-top:0"><div><label>Lease start (optional)</label><input id="t_ls" type="date"></div><div><label>Fixed term ends (optional)</label><input id="t_le" type="date"></div></div>'+
    '<p class="sub" style="margin-top:4px">Leave the end blank for a periodic tenancy.</p>'+
    '<label>Last rent increase (optional)</label><input id="t_ri" type="date">'+
    '<div class="grid" style="margin-top:0"><div><label>Bond (optional)</label><input id="t_bond"'+MONEY+'</div><div><label>&nbsp;</label><label class="chk" style="margin:10px 0 0"><input type="checkbox" id="t_lodged"'+(t.lodged?' checked':'')+'>Bond lodged</label></div></div>'+
    '<div class="btns"><button class="go" data-x="tensave">Save</button><button class="go ghost" data-x="tencancel">Cancel</button></div>';
  else if(!p.ten)h+='<p class="sub" style="margin-top:6px">Add lease dates and bond details to get reminders before the lease ends.</p>';
  else{
    var left=t.le?dd(today,t.le):null,next=t.ri?addMonths(t.ri,12):null;
    h+='<div class="grid">'+stat('Tenant',t.who?esc(t.who):'–')+stat(t.le?(left<0?'Fixed term ended':'Fixed term ends in '+left+' days'):'Tenancy',t.le?fmtD(t.le):'Periodic',left!==null&&left<=60?'neg':'')+
      stat('Bond',t.bond?$$(t.bond)+(t.lodged?' lodged':' not lodged'):'–',t.bond&&!t.lodged?'neg':'')+stat('Next rent increase from',next?fmtD(next):'–')+'</div>'+
      (next?'<p class="sub" style="margin-top:8px">Based on rent increases being allowed once every 12 months. Check the current rules at tenancy.govt.nz.</p>':'');
  }
  h+='</div>';
  var hh=p.hh||{},left2=hhLeft(p),docs=p.hhDocs||[];
  h+='<div class="card" id="hhcard"><div class="row" style="cursor:default">'+hd('thermo','Healthy Homes standards')+'<span class="sub'+(left2?' neg':'')+'">'+(HH.length-left2)+' of '+HH.length+' done</span></div>'+
    '<p class="sub" style="margin-top:4px">Tick each standard once the property meets it. Check the current requirements and deadlines at tenancy.govt.nz.</p>'+
    (left2?'<button class="edit" data-x="hhall" style="margin-top:10px">Mark all '+HH.length+' as done</button>':'')+
    HH.map(function(s){var d=hh[s[0]];return '<div class="task'+(d?' ok':'')+'"><input type="checkbox" data-x="hh" data-k="'+s[0]+'"'+(d?' checked':'')+' aria-label="'+s[1]+'"><div><b>'+s[1]+'</b><p class="sub">'+(d?'Done '+fmtD(d):'Not done yet')+'</p></div></div>'}).join('')+
    // Compliance reports (e.g. from an assessor) are stored like receipts and saved as soon as they're added.
    '<p class="grp" style="margin:16px 0 0">Compliance report</p>'+
    '<p class="sub" style="margin-top:4px">'+(docs.length?'Tap a file to open it.':'Upload the Healthy Homes compliance report or statement, as a PDF or photos.')+'</p>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
    '<div class="rcs">'+docs.map(function(r){return rcThumb(r,'hhdrop',hhArm===r.id)}).join('')+'<label class="rcadd">+ Report<input type="file" class="hhin" accept="image/*,application/pdf" multiple hidden></label></div>'+
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
   '<div class="btns"><button class="go" data-x="rentok">Turn into a rental</button><button class="go ghost" data-x="rentno">Cancel</button></div></div>';
}
function toRental(p){
  if(missing($('torent')))return;
  p.type='rental';p.rent=num('r_rent');p.exp=num('r_exp');p.value=num('r_value')||p.value;p.fromProject=iso(new Date());
  rentOpen=false;sec='ov';isSample=false;render();$('p1').scrollTop=0;
}
