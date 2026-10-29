// Small helpers: DOM lookup, money and date formatting, maths, downloads.
var $=function(id){return document.getElementById(id)};
var nz=new Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD',maximumFractionDigits:0});
var $$=function(n){return nz.format(n)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
// Number fields are text inputs so there are no spinner arrows and the scroll wheel can't change them.
// Money fields show "$" and commas as you type; pnum() strips them again.
var MONEY=' type="text" inputmode="decimal" class="money" autocomplete="off">',NUM=' type="text" inputmode="decimal" autocomplete="off">';
function pnum(s){return parseFloat(String(s==null?'':s).replace(/[^\d.\-]/g,''))||0}
function fmtMoney(v){
  v=String(v==null?'':v).replace(/[^\d.]/g,'');if(!v)return '';
  var i=v.indexOf('.'),w=(i<0?v:v.slice(0,i)).replace(/^0+(?=\d)/,''),d=i<0?'':'.'+v.slice(i+1).replace(/\./g,'').slice(0,2);
  return '$'+(w?(+w).toLocaleString('en-NZ'):'0')+d;
}
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
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function sum(a,f){return a.reduce(function(t,x){return t+(+f(x)||0)},0)}
function dd(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5)}
function csvCell(v){v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function download(name,data,type){var a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type:type}));a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'property'}
function med(a){a=a.slice().sort(function(x,y){return x-y});var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2}
function pct(n){return (n>0?'+':'')+n.toFixed(1)+'%'}
function num(id){var e=$(id);return e?pnum(e.value):0}
