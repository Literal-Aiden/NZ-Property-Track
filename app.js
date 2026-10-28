var SAMPLE=[
 {type:'project',addr:'24 Sample Road',sub:'Auckland',price:850000,legal:2800,extra:0,date:'2026-03-14',value:960000,budget:90000,spent:52000,loan:620000,rate:5.49,fixTerm:'12',fixStart:'2026-02-10',ltype:'pi',term:30},
 {type:'rental',addr:'8 Demo Avenue',sub:'Hamilton',price:620000,legal:2500,extra:4200,date:'2025-08-02',value:655000,rent:640,exp:9800,loan:430000,rate:6.9,fixTerm:'18',fixStart:'2025-06-05',ltype:'io',term:30},
 {type:'project',addr:'3 Example Street',sub:'Tauranga',price:710000,legal:2600,extra:1500,date:'2026-06-20',value:745000,budget:60000,spent:66000}
];
var KEY='nzpt.v1',isSample=true;
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);isSample=false;return d.props||[]}}catch(e){}return JSON.parse(JSON.stringify(SAMPLE))}
function save(){isSample=false;try{localStorage.setItem(KEY,JSON.stringify({props:props}))}catch(e){}}
var props=load();
var cur=0,newType='project',newLoan='pi',editIdx=null,editSec='details',delIdx=null;
var $=function(id){return document.getElementById(id)};
var track=$('track');
var nz=new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:0});
var $$=function(n){return nz.format(n)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function stat(l,v,c){return '<div class="stat"><b class="'+(c||'')+'">'+v+'</b><span>'+l+'</span></div>'}

function days(d){return d?Math.max(0,Math.floor((Date.now()-new Date(d+'T00:00:00'))/864e5)):null}
function dOwn(p){var n=days(p.date);return n===null?'–':n}
function basis(p){return p.price+(p.legal||0)+(p.extra||0)+(p.spent||0)}
function pmt(l,r,y){var m=r/1200,n=y*12;return m?l*m/(1-Math.pow(1+m,-n)):l/n}
function iso(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function addMonths(d,m){var x=new Date(d+'T00:00:00'),day=x.getDate();x.setMonth(x.getMonth()+m);if(x.getDate()<day)x.setDate(0);return iso(x)}
function refixOf(p){if(p.fixTerm==='float')return null;if(!p.fixTerm||p.fixTerm==='custom')return p.refix||null;return addMonths(p.fixStart||iso(new Date()),+p.fixTerm)}
function fmtD(d){return new Date(d+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}
var FIXOPTS=[['6','6 months'],['12','1 year'],['18','18 months'],['24','2 years'],['36','3 years'],['48','4 years'],['60','5 years'],['float','Floating'],['custom','Custom date']].map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('');
function fixPreview(){
  var v=$('f_fix').value,c=v==='custom',f=v==='float';
  $('fixwrap').style.display=c||f?'none':'';
  $('customwrap').style.display=c?'':'none';
  var r=refixOf({fixTerm:v,fixStart:$('f_fixstart').value,refix:$('f_refix').value});
  $('fixout').textContent=f?'Floating rate: no re-fix date':r?'Re-fix due '+fmtD(r):'';
}
function readFix(p){p.fixTerm=$('f_fix').value;p.fixStart=$('f_fixstart').value;p.refix=p.fixTerm==='custom'?$('f_refix').value:''}
function loanCard(p){
  if(!p.loan)return '<div class="card row" style="cursor:default"><span class="sub">No mortgage added</span><button class="edit" id="editloan">Add mortgage</button></div>';
  var io=p.loan*p.rate/1200,pi=pmt(p.loan,p.rate,p.term||30),isIO=p.ltype==='io';
  var now=isIO?io:pi,alt=isIO?pi:io;
  var rf=refixOf(p),fl=p.fixTerm==='float';
  var d=rf?Math.round((new Date(rf+'T00:00:00')-Date.now())/864e5):null;
  var when=fl?'Floating rate':d===null?'No re-fix date':(d<0?'Re-fix date passed':'Re-fix in '+d+' days');
  var dt=fl?'Can change anytime':rf?new Date(rf+'T00:00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}):'–';
  return '<div class="card"><div class="row" style="cursor:default"><b>Mortgage</b><button class="edit" id="editloan">Edit mortgage</button></div><p class="sub">'+$$(p.loan)+' at '+p.rate+'% · '+(isIO?'Interest-only':'Principal &amp; interest')+'</p>'+
   '<div class="grid">'+stat('Repayment / month now',$$(now))+stat(isIO?'If P&amp;I instead':'If interest-only',$$(alt))+stat(when,dt,d!==null&&d>=0&&d<=90?'neg':'')+stat(isIO?'Extra cash needed for P&amp;I':'Cash freed by interest-only',$$(Math.abs(pi-io)))+'</div>'+
   '<p class="sub" style="margin-top:10px">Interest-only frees up cash each month, but the loan isn’t paid down. The difference is mostly principal, not interest saved. Based on a '+(p.term||30)+'-year term.</p></div>';
}
function fill(p){
  var m={f_addr:p.addr,f_sub:p.sub,f_price:p.price,f_date:p.date,f_legal:p.legal,f_extra:p.extra,f_value:p.value,f_budget:p.budget,f_spent:p.spent,f_rent:p.rent,f_exp:p.exp,f_loan:p.loan,f_rate:p.rate,f_refix:p.refix,f_fixstart:p.fixStart,f_term:p.term};
  for(var k in m){var e=$(k);if(e&&m[k]!==undefined&&m[k]!==null&&m[k]!==0)e.value=m[k]}
}
function current(){
  var p=props[cur];
  if(!p){$('p1').innerHTML='<div class="card"><p class="sub">No properties yet. Swipe right to add one.</p></div>';return}
  var h='<div class="card"><div class="row" style="cursor:default"><span class="badge">'+(p.type==='project'?'Renovation project':'Rental')+'</span><button class="edit" id="edit">Edit details</button></div><h1>'+esc(p.addr)+'</h1><p class="sub">'+esc(p.sub)+'</p>';
  if(p.type==='project'){
    var pct=p.budget?Math.round(p.spent/p.budget*100):0,gain=p.value-basis(p),left=p.budget-p.spent;
    h+='<div style="margin-top:16px"><b>Reno budget</b><div class="bar"><i class="'+(pct>100?'over':'')+'" style="width:'+Math.min(pct,100)+'%"></i></div><span class="sub">'+$$(p.spent)+' of '+$$(p.budget)+' spent ('+pct+'%)</span></div>';
    h+='<div class="grid">'+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Budget remaining',$$(left),left<0?'neg':'')+stat('Equity gain after reno',$$(gain),gain<0?'neg':'pos')+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
  }else{
    var ann=p.rent*52,net=ann-p.exp;
    h+='<div class="grid">'+stat('Weekly rent',$$(p.rent))+stat('Annual expenses',$$(p.exp))+stat('Net annual income',$$(net),net<0?'neg':'pos')+stat('Gross / net yield',(ann/p.value*100).toFixed(1)+'% / '+(net/p.value*100).toFixed(1)+'%')+stat('Purchase price',$$(p.price))+stat('Est. value now',$$(p.value))+stat('Total cost in',$$(basis(p)))+stat('Days owned',dOwn(p))+'</div>';
  }
  $('p1').innerHTML=h+'</div>'+loanCard(p)+'<p class="hint">← all properties · add new →</p>';
}

function list(){
  var h=props.map(function(p,i){
    var line=p.type==='project'?'Reno '+$$(p.spent)+' of '+$$(p.budget):$$(p.rent)+'/wk rent';
    return '<div class="card row" data-i="'+i+'"><div><b>'+esc(p.addr)+'</b><p class="sub">'+esc(p.sub)+' · '+(p.type==='project'?'Project':'Rental')+'</p><p class="sub">'+line+'</p></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><span class="badge">'+(i===cur?'Viewing':'Open')+'</span><button class="edit del" data-d="'+i+'">'+(delIdx===i?'Tap to confirm':'Delete')+'</button></div></div>';
  }).join('');
  $('p0').innerHTML=h||'<div class="card"><p class="sub">Nothing added yet.</p></div>';
}

function form(){
  var pr=newType==='project',sd=editIdx===null||editSec==='details',sl=editIdx===null||editSec==='loan';
  $('p2').innerHTML='<div class="card"><b>'+(editIdx===null?'Add a property':(editSec==='loan'?'Edit mortgage':'Edit property details'))+'</b>'+
   (editIdx===null?'<label>Type</label><div class="seg"><button data-t="project" class="'+(pr?'on':'')+'">Renovation project</button><button data-t="rental" class="'+(pr?'':'on')+'">Rental</button></div>':'')+
   (sd?'<label>Address</label><input id="f_addr" placeholder="Street address">'+
   '<label>Suburb / city</label><input id="f_sub">'+
   '<label>Purchase price (NZD)</label><input id="f_price" type="number" inputmode="numeric">'+
   '<label>Purchase date</label><input id="f_date" type="date">'+
   '<label>Legal fees (NZD)</label><input id="f_legal" type="number" inputmode="numeric">'+
   '<label>'+(pr?'Other purchase costs':'Healthy Homes / quick reno costs')+' (NZD)</label><input id="f_extra" type="number" inputmode="numeric">'+
   '<label>Estimated value now (NZD)</label><input id="f_value" type="number" inputmode="numeric">'+
   (pr?'<label>Renovation budget (NZD)</label><input id="f_budget" type="number" inputmode="numeric"><label>Spent so far (NZD)</label><input id="f_spent" type="number" inputmode="numeric">'
      :'<label>Weekly rent (NZD)</label><input id="f_rent" type="number" inputmode="numeric"><label>Annual expenses (NZD)</label><input id="f_exp" type="number" inputmode="numeric">')+'':'')+
   (sl?(editIdx===null?'<b style="display:block;margin-top:18px">Mortgage (optional)</b>':'')+
   '<label>Loan amount (NZD)</label><input id="f_loan" type="number" inputmode="numeric">'+
   '<label>Interest rate % (enter your own, e.g. second-tier lender)</label><input id="f_rate" type="number" step="0.01" inputmode="decimal">'+
   '<label>Fixed term</label><select id="f_fix">'+FIXOPTS+'</select>'+
   '<div id="fixwrap"><label>Rate fixed from</label><input id="f_fixstart" type="date"></div>'+
   '<div id="customwrap" style="display:none"><label>Re-fix date</label><input id="f_refix" type="date"></div>'+
   '<p class="sub" id="fixout" style="margin-top:8px;color:var(--acc);font-weight:600"></p>'+
   '<label>Loan type</label><div class="seg" id="lt"><button data-l="pi" class="'+(newLoan==='pi'?'on':'')+'">Principal &amp; interest</button><button data-l="io" class="'+(newLoan==='io'?'on':'')+'">Interest-only</button></div>'+
   '<label>Remaining term (years, default 30)</label><input id="f_term" type="number" inputmode="numeric">'+'':'')+
   '<button class="go" id="add">'+(editIdx===null?'Add property':'Save changes')+'</button>'+(editIdx===null?'':'<button class="go" id="cancel" style="background:none;color:var(--mute);border:1px solid var(--line)">Cancel</button>')+'</div><p class="hint">← back to current</p>';
  if(editIdx!==null)fill(props[editIdx]);
  if($('f_fix')){$('f_fix').value='12';if(editIdx!==null){var q=props[editIdx];$('f_fix').value=q.fixTerm||(q.refix?'custom':'12')}if(!$('f_fixstart').value)$('f_fixstart').value=iso(new Date());fixPreview()}
}

function num(id){var e=$(id);return e?(parseFloat(e.value)||0):0}
function saveLoan(){
  var p=props[editIdx],n=num('f_loan');
  if(n){p.loan=n;p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  else{delete p.loan;delete p.rate;delete p.refix;delete p.fixTerm;delete p.fixStart;delete p.ltype;delete p.term}
  isSample=false;cur=editIdx;editIdx=null;newLoan='pi';render();go(1,true);
}
function addProp(){
  if(editIdx!==null&&editSec==='loan')return saveLoan();
  var a=$('f_addr').value.trim();
  if(!a){$('f_addr').focus();return}
  var p={type:newType,addr:a,sub:$('f_sub').value.trim(),price:num('f_price'),value:num('f_value'),date:$('f_date').value,legal:num('f_legal'),extra:num('f_extra')};
  if(newType==='project'){p.budget=num('f_budget');p.spent=num('f_spent')}else{p.rent=num('f_rent');p.exp=num('f_exp')}
  if(num('f_loan')){p.loan=num('f_loan');p.rate=num('f_rate');readFix(p);p.ltype=newLoan;p.term=num('f_term')||30}
  isSample=false;newLoan='pi';if(editIdx!==null){var o=props[editIdx];['loan','rate','refix','fixTerm','fixStart','ltype','term'].forEach(function(k){if(o[k]!==undefined)p[k]=o[k]});props[editIdx]=p;cur=editIdx;editIdx=null}else{props.push(p);cur=props.length-1}render();go(1,true);
}

function banner(){var b=$('banner');b.innerHTML=isSample?'Showing sample properties · <a href="#" id="fresh">Start fresh</a>':'Saved on this device'}
function render(){if(!isSample)save();list();current();form();banner()}
function go(i,smooth){track.scrollTo({left:i*track.clientWidth,behavior:smooth?'smooth':'auto'})}
function sync(){var i=Math.round(track.scrollLeft/track.clientWidth);document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',+t.dataset.i===i)})}

$('tabs').addEventListener('click',function(e){var t=e.target.closest('.tab');if(t){if(+t.dataset.i===2&&editIdx!==null){editIdx=null;form()}go(+t.dataset.i,true)}});
track.addEventListener('scroll',sync);
$('p0').addEventListener('click',function(e){var d=e.target.closest('[data-d]');
  if(d){var k=+d.dataset.d;if(delIdx===k){isSample=false;props.splice(k,1);delIdx=null;if(cur>=props.length)cur=Math.max(0,props.length-1);editIdx=null;render()}else{delIdx=k;list()}return}
  var r=e.target.closest('.row');delIdx=null;if(r){cur=+r.dataset.i;editIdx=null;render();go(1,true)}});
$('p1').addEventListener('click',function(e){
  var id=e.target.id;
  if(id==='edit'||id==='editloan'){var p=props[cur];editIdx=cur;editSec=id==='edit'?'details':'loan';newType=p.type;newLoan=p.ltype||'pi';form();go(2,true)}
});
$('p2').addEventListener('change',function(e){if(/^f_(fix|fixstart|refix)$/.test(e.target.id))fixPreview()});
$('p2').addEventListener('click',function(e){
  var l=e.target.closest('[data-l]');
  if(l){newLoan=l.dataset.l;document.querySelectorAll('#lt button').forEach(function(x){x.classList.toggle('on',x===l)});return}
  var b=e.target.closest('[data-t]');
  if(b){newType=b.dataset.t;form();return}
  if(e.target.id==='cancel'){editIdx=null;form();go(1,true);return}
  if(e.target.id==='add')addProp();
});
document.addEventListener('click',function(e){if(e.target.id==='fresh'){e.preventDefault();props=[];cur=0;editIdx=null;save();render();go(2,true)}});
window.addEventListener('resize',function(){go(1)});
render();go(1);sync();
