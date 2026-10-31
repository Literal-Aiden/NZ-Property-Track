// Value and equity over time: a property's value (and its loan, so the gap is the equity) on its Overview, and the
// portfolio's total value and equity on Home. Small step line charts in plain SVG and HTML, no library: a value
// holds until the next update, so the line steps rather than slopes.

// Loan balance history, kept like p.vals for the value: {d, v}, one per day, added when the loan total changes.
function noteLoan(p){var t=iso(new Date()),h=p.loans||[],v=p.loan||0,l=h[h.length-1];if(l&&l.v===v)return;p.loans=h.filter(function(x){return x.d!==t}).concat([{d:t,v:v}])}
// A property's value points: the purchase price on the purchase date, then each update, sorted and one per day.
// A value with no history yet (older data) counts from when it was last updated, else today.
function valPts(p){
  var m={};if(p.date&&p.price)m[p.date]=p.price;
  (p.vals||[]).forEach(function(x){m[x.d]=x.v});
  var ks=Object.keys(m).sort(),last=ks[ks.length-1];
  if(p.value&&(!last||m[last]!==p.value))m[p.valueAt&&(!last||p.valueAt>=last)?p.valueAt:iso(new Date())]=p.value;
  return Object.keys(m).sort().map(function(d){return {d:d,v:m[d]}});
}
// The value on a date: the latest point on or before it (the first point, for a date before them all).
function at(pts,d){var v=null;pts.forEach(function(x){if(x.d<=d)v=x.v});return v===null&&pts.length?pts[0].v:v}
// The loan on a date. From each recorded balance, P&I parts are paid down month by month at their rate and term
// (each part's share of that balance), until the next recorded balance; interest-only parts stay level. Before the
// first recorded balance, that first balance is used. All an estimate: the bank's statement has the real figure.
function loanAt(p,d){
  var h=p.loans&&p.loans.length?p.loans:[{d:iso(new Date()),v:p.loan||0}],e=h[0];
  h.forEach(function(x){if(x.d<=d)e=x});
  var m=Math.max(0,(new Date(d+'T00:00')-new Date(e.d+'T00:00'))/864e5/30.4375),ps=parts(p),tot=sum(ps,function(x){return x.loan});
  if(!m||!tot)return e.v;
  return sum(ps,function(x){var b=e.v*x.loan/tot;return x.ltype==='io'?b:paid(b,x.rate||0,x.term||30,m)});
}
// What's left of a P&I loan of b after m months of repayments (rate %, term in years).
function paid(b,rate,term,m){var r=rate/1200,n=term*12;if(!r)return Math.max(0,b-b/n*m);var g=Math.pow(1+r,m);return Math.max(0,b*g-pmt(b,rate,term)*(g-1)/r)}
function hasPI(p){return parts(p).some(function(x){return x.ltype!=='io'})}
// Monthly dates from d up to today, so a paid-down loan slopes smoothly.
function monthly(d){var a=[],t=iso(new Date());for(var i=1,x=addMonths(d,1);x<t&&i<600;x=addMonths(d,++i))a.push(x);return a}
function shortMoney(n){var a=Math.abs(n),s=n<0?'−$':'$';return a>=1e6?s+(a/1e6).toFixed(2).replace(/\.?0+$/,'')+'m':s+Math.round(a/1000)+'k'}

// A line chart. xs: dates (ISO, sorted); series: [{name, col (a CSS colour), v: one value per date, slope: drawn as
// a sloping line rather than steps}];
// tip(i): extra tooltip rows for date i. Lines are drawn in a stretched SVG (so they fill any width at 2px), with the
// labels, end dots, crosshair and tooltip as HTML on top, so text never stretches.
var CH={},chN=0;
function lchart(xs,series,tip){
  for(var k in CH)if(!$(k))delete CH[k];
  var id='lch'+(++chN),t=xs.map(function(d){return new Date(d+'T00:00').getTime()}),t0=t[0],t1=t[t.length-1];
  var all=[];series.forEach(function(s){all=all.concat(s.v)});
  var lo=Math.min.apply(null,all),hi=Math.max.apply(null,all);
  if(hi===lo){lo-=Math.abs(lo)*.1||1;hi+=Math.abs(hi)*.1||1}else{var pad=(hi-lo)*.08;lo-=pad;hi+=pad}
  var X=function(i){return (t[i]-t0)/(t1-t0)*100},Y=function(v){return 10+(1-(v-lo)/(hi-lo))*84};
  CH[id]={xs:xs,t:t,series:series,tip:tip,X:X,Y:Y};
  // Gridlines on round amounts (steps of 1, 2, 2.5 or 5 × a power of ten), two to four of them.
  var raw=(hi-lo)/3,p10=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,2.5,5,10].map(function(m){return m*p10}).filter(function(s){return s>=raw})[0],grid=[];
  for(var g=Math.ceil(lo/step)*step;g<=hi;g+=step)grid.push(g);
  var h='<div class="lch" id="'+id+'">';
  if(series.length>1)h+='<div class="lleg">'+series.map(function(s){return '<span><i style="background:'+s.col+'"></i>'+s.name+'<b>'+$$(s.v[s.v.length-1])+'</b></span>'}).join('')+'</div>';
  h+='<div class="lplot"><svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">'+
    grid.map(function(g){return '<path class="gl" d="M0 '+Y(g)+'H1000"/>'}).join('')+
    series.map(function(s){return '<path class="ln" style="stroke:'+s.col+'" d="'+s.v.map(function(v,i){return (i?(s.slope?'L':'H'+X(i)*10+'V'):'M')+(s.slope||!i?X(i)*10+' ':'')+Y(v)}).join('')+'"/>'}).join('')+'</svg>'+
    grid.map(function(g){return '<span class="ly" style="top:'+Y(g)+'%">'+shortMoney(g)+'</span>'}).join('')+
    series.map(function(s){return '<i class="ldot" style="left:100%;top:'+Y(s.v[s.v.length-1])+'%;background:'+s.col+'"></i>'}).join('')+
    '<div class="lx" hidden></div><div class="lhov"></div><div class="ltip" hidden></div></div>'+
    '<div class="lxa"><span>'+fmtD(xs[0])+'</span><span>Today</span></div>'+
    // The same figures as text, for screen readers.
    '<p class="sr">'+series.map(function(s){return s.name+' '+$$(s.v[0])+' on '+fmtD(xs[0])+', '+$$(s.v[s.v.length-1])+' today'}).join('; ')+'</p></div>';
  return h;
}
// Crosshair and tooltip: the date nearest the pointer (mouse, or a finger on the chart).
function chHover(e){
  var pl=e.target.closest&&e.target.closest('.lplot');if(!pl)return;
  var c=CH[pl.parentElement.id];if(!c)return;
  var r=pl.getBoundingClientRect(),f=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),tt=c.t[0]+f*(c.t[c.t.length-1]-c.t[0]),i=0;
  c.t.forEach(function(x,j){if(Math.abs(x-tt)<Math.abs(c.t[i]-tt))i=j});
  var x=c.X(i),lx=pl.querySelector('.lx'),tp=pl.querySelector('.ltip');
  lx.hidden=false;lx.style.left=x+'%';
  pl.querySelector('.lhov').innerHTML=c.series.map(function(s){return '<i class="ldot" style="left:'+x+'%;top:'+c.Y(s.v[i])+'%;background:'+s.col+'"></i>'}).join('');
  tp.innerHTML='<b>'+(i===c.xs.length-1?'Today':fmtD(c.xs[i]))+'</b>'+c.series.map(function(s){return '<span><i style="background:'+s.col+'"></i>'+s.name+' '+$$(s.v[i])+'</span>'}).join('')+(c.tip?c.tip(i):'');
  tp.hidden=false;
  var w=tp.offsetWidth,px=x/100*r.width;tp.style.left=Math.min(Math.max(0,px-w/2),r.width-w)+'px';
}
function chOut(e){var pl=e.target.closest&&e.target.closest('.lplot');if(!pl)return;pl.querySelector('.lx').hidden=true;pl.querySelector('.ltip').hidden=true;pl.querySelector('.lhov').innerHTML=''}
document.addEventListener('pointermove',chHover);
document.addEventListener('pointerdown',chHover);
document.addEventListener('pointerout',function(e){if(e.target.closest&&e.target.closest('.lplot')&&!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.lplot')))chOut(e)});

// A property's Overview card: its value since it was bought (or first valued), and the loan, so the gap is the equity.
function histCard(p){
  var v=valPts(p),h='<div class="card ty-'+p.type+'">'+hd('trend','Value over time');
  if(v.length<2)return h+'<p class="sub" style="margin-top:4px">Each time you update the estimated value, it’s added here, so you can see how the value and equity have grown'+(p.date&&p.price?' since you bought':'')+'.</p></div>';
  var ds={};v.concat(p.loans||[]).forEach(function(x){if(x.d>=v[0].d)ds[x.d]=1});ds[iso(new Date())]=1;if(hasPI(p))monthly(v[0].d).forEach(function(d){ds[d]=1});
  var xs=Object.keys(ds).sort(),bought=p.date&&p.price&&v[0].d===p.date,ch=v[v.length-1].v-v[0].v;
  var s=[{name:'Value',col:'var(--ty)',v:xs.map(function(d){return at(v,d)})}];
  if(p.loan||(p.loans&&p.loans.length))s.push({name:'Loan',col:'var(--mute)',slope:1,v:xs.map(function(d){return loanAt(p,d)})});
  return h+'<p class="sub" style="margin-top:4px">'+(bought?'Since you bought':'Since '+fmtD(v[0].d))+': '+signed(ch)+' ('+(ch<0?'−':'+')+Math.abs(ch/v[0].v*100).toFixed(1)+'%)'+
    (s.length>1?' · the gap is your equity'+(hasPI(p)?'. The loan falls with P&amp;I repayments (an estimate)':''):'')+'</p>'+
    lchart(xs,s,s.length>1?function(i){return '<span class="pos">Equity '+$$(s[0].v[i]-s[1].v[i])+'</span>'}:null)+'</div>';
}
// Home: the owned properties' total value and equity over time. Each counts from when it was bought (or first
// valued); properties without a value are left out, as on the portfolio card.
function portHist(){
  var own=props.filter(function(p){return p.type!=='potential'&&p.value}).map(function(p){var v=valPts(p);return {p:p,v:v,from:p.date||v[0].d}});
  if(!own.length)return '';
  var start=own.map(function(o){return o.from}).sort()[0],ds={};
  own.forEach(function(o){o.v.concat(o.p.loans||[]).forEach(function(x){if(x.d>=start)ds[x.d]=1});ds[o.from]=1});ds[iso(new Date())]=1;if(own.some(function(o){return hasPI(o.p)}))monthly(start).forEach(function(d){ds[d]=1});
  var xs=Object.keys(ds).sort();if(xs.length<2)return '';
  var val=[],eq=[],lend=[];
  xs.forEach(function(d){var a=0,l=0;own.forEach(function(o){if(o.from<=d){a+=at(o.v,d);l+=loanAt(o.p,d)}});val.push(a);lend.push(l);eq.push(a-l)});
  return '<h2 class="hh2">Portfolio over time</h2><div class="card">'+
    lchart(xs,[{name:'Value',col:'var(--mute)',v:val},{name:'Equity',col:'var(--good)',v:eq}],function(i){return '<span>Lending '+$$(lend[i])+'</span>'})+
    '<p class="sub" style="margin-top:8px">From each purchase and every value you’ve entered. Equity uses the loan balances as you’ve entered them, so it’s an estimate.</p></div>';
}
