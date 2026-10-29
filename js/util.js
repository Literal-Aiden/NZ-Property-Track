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
// Line icons (Feather-style, drawn with currentColor). ic() gives an inline SVG; hd() a card heading with an icon.
var ICONS={
  home:'<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  tool:'<path d="M4 20l9-9M14 4l6 6-3 3-6-6zM11 7l3-3"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  dollar:'<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  percent:'<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  thermo:'<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
  pie:'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  alert:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  chart:'<path d="M18 20V10M12 20V4M6 20v-6"/>',
  trend:'<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  save:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  phone:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'};
function ic(n,c){return '<svg class="ic'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+ICONS[n]+'</svg>'}
function hd(n,t){return '<span class="hd">'+ic(n)+'<b>'+t+'</b></span>'}
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
