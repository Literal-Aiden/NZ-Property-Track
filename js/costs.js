// Itemised reno costs, category budgets and CSV export.
// Itemised reno costs. Each cost has an optional quote for the whole job and the amount invoiced so far, both incl. GST.
// Once anything is itemised, p.spent is kept as the total invoiced so the rest of the app reads it as before.
var costOpen=null,itemEdit=null,delItem=false,catDraft=null,pendRc=[],dropRc=[],rcMsg='';
function cmt(x){return Math.max(x.amt||0,x.quote||0)}
function cats(p){return p.cats||(p.cats=catList([]))}
function syncSpent(p){if(p.items&&p.items.length)p.spent=sum(p.items,function(x){return x.amt})}
function rcIds(p){return (p.items||[]).concat(p.money||[]).reduce(function(a,x){return a.concat((x.rc||[]).map(function(r){return r.id}))},[])}
function costCard(p){
  var it=p.items||[],C=cats(p),busy=itemEdit!==null||catDraft;
  var h='<div class="card" id="costs"><div class="row" style="cursor:default"><b>Reno costs</b>'+(it.length&&!busy?'<button class="edit" data-x="csv">Export CSV</button>':'')+'</div>';
  if(itemEdit!==null)return h+itemForm(p)+'</div>';
  if(catDraft)return h+catForm(p)+'</div>';
  if(it.length){
    var cm=sum(it,cmt),unpaid=sum(it,function(x){return x.paid?0:x.amt}),ov=sum(it,function(x){return x.quote&&x.amt>x.quote?x.amt-x.quote:0});
    h+='<div class="grid">'+stat('Spent (invoiced)',$$(p.spent))+stat('Committed incl. quotes',$$(cm),p.budget&&cm>p.budget?'neg':'')+stat('Unpaid invoices',$$(unpaid),unpaid?'neg':'')+stat('Over quotes',$$(ov),ov?'neg':'')+'</div>';
  }else h+='<p class="sub" style="margin-top:6px">Itemise what you spend to see which parts of the reno are on track, and attach receipt photos to each cost.'+(p.spent?' Your '+$$(p.spent)+' spent so far becomes one cost under Other, which you can split up later.':'')+'</p>';
  var shown=C.map(function(c,i){return {c:c,i:i,xs:it.map(function(x,j){return {x:x,j:j}}).filter(function(o){return o.x.cat===c.n})}}).filter(function(o){return o.c.b||o.xs.length});
  if(shown.length)h+='<div class="cats">'+shown.map(function(o){
    var s=sum(o.xs,function(y){return y.x.amt}),m=sum(o.xs,function(y){return cmt(y.x)}),b=o.c.b,open=costOpen===o.c.n,over=b&&m>b;
    var note=[m>s?$$(m)+' committed incl. quotes':'',over?$$(m-b)+' over budget':''].filter(Boolean).join(' · ');
    return '<div class="catrow" data-x="cat" data-k="'+o.i+'"><div class="top"><b>'+(open?'▾ ':'▸ ')+esc(o.c.n)+'</b><span class="'+(over?'neg':'')+'">'+$$(s)+(b?' of '+$$(b):' · no budget')+'</span></div>'+
      (b?'<div class="bar"><i class="'+(over?'over':'')+'" style="width:'+Math.min(100,Math.round(s/b*100))+'%"></i></div>':'')+(note?'<p class="sub'+(over?' neg':'')+'">'+note+'</p>':'')+'</div>'+
      (open?'<div class="items">'+(o.xs.length?o.xs.map(function(y){return itemRow(y.x,y.j)}).join(''):'<p class="sub" style="padding:8px 0">Nothing spent here yet.</p>')+'<button class="edit" data-x="add" style="margin:8px 0">+ Add cost to '+esc(o.c.n)+'</button></div>':'');
  }).join('')+'</div>';
  var al=sum(C,function(c){return c.b}),cg=C.filter(function(c){return c.n==='Contingency'})[0];
  if(cg&&cg.b){var cu=sum(it,function(x){return x.cat==='Contingency'?cmt(x):0});h+='<p class="sub" style="margin-top:12px">Contingency used: <b class="'+(cu>cg.b?'neg':'')+'">'+$$(cu)+' of '+$$(cg.b)+'</b> ('+Math.round(cu/cg.b*100)+'%)</p>'}
  if(p.budget&&al&&al!==p.budget)h+='<p class="sub" style="margin-top:6px">'+(al<p.budget?$$(p.budget-al)+' of your '+$$(p.budget)+' budget isn’t allocated to a category yet.':'Category budgets add up to '+$$(al)+', more than your '+$$(p.budget)+' total budget.')+'</p>';
  return h+'<div class="btns"><button class="go" data-x="add">Add cost</button><button class="go ghost" data-x="cats">Category budgets</button></div><p class="sub" style="margin-top:10px">Amounts include GST.</p></div>';
}
function itemRow(x,j){
  var st=x.amt?(x.paid?'Paid':'Unpaid'):'Quote only',n=(x.rc||[]).length;
  return '<div class="item" data-x="item" data-k="'+j+'"><div><b>'+esc(x.desc)+'</b><p class="sub">'+[esc(x.who||''),x.date?fmtD(x.date):'',st==='Unpaid'?'<span class="neg">Unpaid</span>':st,n?n+' receipt'+(n>1?'s':''):''].filter(Boolean).join(' · ')+'</p></div>'+
   '<div class="cr"><b>'+$$(x.amt||0)+'</b>'+(x.quote?'<span class="sub'+(x.amt>x.quote?' neg':'')+'">of '+$$(x.quote)+' quote</span>':'')+'</div></div>';
}
function itemForm(p){
  var x=itemEdit==='new'?{cat:costOpen||'Other',paid:true}:p.items[itemEdit],N=MONEY;
  var rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  return '<p class="grp" style="margin:14px 0 0">'+(itemEdit==='new'?'Add a cost':'Edit cost')+'</p>'+
   '<label>Category</label><select id="i_cat">'+cats(p).map(function(c){return '<option'+(c.n===x.cat?' selected':'')+'>'+esc(c.n)+'</option>'}).join('')+'</select>'+
   '<label>Description</label><input id="i_desc" placeholder="e.g. Kitchen benchtop">'+
   '<label>Supplier / tradie</label><input id="i_who">'+
   '<label>Date</label><input id="i_date" type="date">'+
   '<div class="grid" style="margin-top:0"><div><label>Quote for the job</label><input id="i_quote"'+N+'</div><div><label>Invoiced so far</label><input id="i_amt"'+N+'</div></div>'+
   '<label class="chk"><input type="checkbox" id="i_paid"'+(x.paid?' checked':'')+'>Paid</label>'+
   '<label>Receipts and invoices</label>'+(rcMsg?'<p class="sub neg">'+esc(rcMsg)+'</p>':'')+
   '<div class="rcs">'+rc.map(rcThumb).join('')+'<label class="rcadd">+ Photo or PDF<input type="file" class="rcin" accept="image/*,application/pdf" multiple hidden></label></div>'+
   '<div class="btns"><button class="go" data-x="isave">'+(itemEdit==='new'?'Add cost':'Save')+'</button><button class="go ghost" data-x="icancel">Cancel</button></div>'+
   (itemEdit==='new'?'':'<button class="edit del" data-x="idel" style="margin-top:12px">'+(delItem?'Tap to confirm delete':'Delete this cost')+'</button>');
}
function saveItem(p){
  var d=$('i_desc').value.trim();if(!d){$('i_desc').focus();return}
  if(!p.items||!p.items.length){p.items=[];if(p.spent)p.items.push({id:uid(),cat:'Other',desc:'Spent before itemising',amt:p.spent,paid:true,rc:[]})}
  var x=itemEdit==='new'?{id:uid()}:p.items[itemEdit];
  x.cat=$('i_cat').value;x.desc=d;x.who=$('i_who').value.trim();x.date=$('i_date').value;x.quote=num('i_quote');x.amt=num('i_amt');x.paid=$('i_paid').checked;
  x.rc=(x.rc||[]).filter(function(r){return dropRc.indexOf(r.id)<0}).concat(pendRc);
  rcDel(dropRc);
  if(itemEdit==='new')p.items.push(x);
  syncSpent(p);pendRc=[];dropRc=[];itemEdit=null;costOpen=x.cat;isSample=false;render();
}
// Closes whichever cost or money form is open, discarding receipts added to it but not saved.
function closeItem(){rcDel(pendRc.map(function(r){return r.id}));pendRc=[];dropRc=[];itemEdit=null;moneyEdit=null;delItem=false;rcMsg=''}
function rcCard(){return moneyEdit!==null?'money':'costs'}
function catForm(p){
  var used={};(p.items||[]).forEach(function(x){used[x.cat]=1});
  return '<p class="grp" style="margin:14px 0 0">Category budgets</p>'+catDraft.map(function(c,i){
    return '<div class="cb"><span>'+esc(c.n)+'</span><input id="cb_'+i+'" type="text" inputmode="decimal" class="money" autocomplete="off" placeholder="$0" value="'+fmtMoney(c.b||'')+'">'+(used[c.n]?'<span></span>':'<button class="edit del" data-x="catrm" data-k="'+i+'" aria-label="Remove '+esc(c.n)+'">×</button>')+'</div>';
  }).join('')+
  '<div class="cbnew"><input id="cb_new" placeholder="New category, e.g. Deck"><button class="edit" data-x="catadd">Add</button></div>'+
  '<p class="sub" id="cbtot" style="margin-top:10px"></p>'+
  '<div class="btns"><button class="go" data-x="catsave">Save budgets</button><button class="go ghost" data-x="catcancel">Cancel</button></div>';
}
function readDraft(){catDraft.forEach(function(c,i){var e=$('cb_'+i);if(e)c.b=pnum(e.value)})}
function cbTot(p){var e=$('cbtot');if(!e)return;readDraft();var t=sum(catDraft,function(c){return c.b});e.textContent='Allocated '+$$(t)+(p.budget?' of your '+$$(p.budget)+' reno budget'+(t>p.budget?', which is over':''):'');e.className='sub'+(p.budget&&t>p.budget?' neg':'')}
function exportCosts(p){
  var rows=[['Date','Category','Description','Supplier / tradie','Quote incl GST','Invoiced incl GST','Paid','Receipt files']].concat((p.items||[]).map(function(x){
    return [x.date||'',x.cat,x.desc,x.who||'',x.quote||'',x.amt||'',x.paid?'Yes':'No',(x.rc||[]).map(function(r){return r.name}).join('; ')]}));
  download(slug(p.addr)+'-reno-costs.csv','﻿'+rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),'text/csv');
}
