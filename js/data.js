// Sample data, saving to localStorage, and app-wide state.
var CATS=['Demolition','Kitchen','Bathroom','Flooring','Painting','Electrical','Plumbing','Roofing','Landscaping','Consents & fees','Labour','Contingency','Other'];
function catList(b){return CATS.map(function(n,i){return {n:n,b:b[i]||0}})}
var SAMPLE=[
 {type:'project',addr:'24 Sample Road',sub:'Auckland',price:850000,legal:2800,extra:0,date:'2026-03-14',value:960000,budget:90000,spent:52000,loan:620000,rate:5.49,fixTerm:'12',fixStart:'2026-02-10',ltype:'pi',term:30,
  cats:catList([5000,24000,12000,8000,6000,9000,7000,0,3000,3500,3500,9000,0]),items:[
  {id:'s1',cat:'Demolition',desc:'Strip-out and skip bins',who:'Sample Demolition Ltd',date:'2026-04-22',quote:4500,amt:4800,paid:true,rc:[]},
  {id:'s2',cat:'Kitchen',desc:'Cabinetry, 50% deposit',who:'Sample Kitchens',date:'2026-06-03',quote:22000,amt:11000,paid:true,rc:[]},
  {id:'s3',cat:'Bathroom',desc:'Tiling and waterproofing',who:'Demo Tiling Co',date:'2026-08-19',quote:9500,amt:10400,paid:true,rc:[]},
  {id:'s4',cat:'Electrical',desc:'Rewire',who:'Example Electrical',date:'2026-09-02',quote:8200,amt:8200,paid:false,rc:[]},
  {id:'s5',cat:'Plumbing',desc:'Bathroom and kitchen rough-in',who:'Sample Plumbing',date:'2026-07-28',quote:6000,amt:6100,paid:true,rc:[]},
  {id:'s6',cat:'Consents & fees',desc:'Building consent',who:'Council',date:'2026-04-02',amt:2900,paid:true,rc:[]},
  {id:'s7',cat:'Painting',desc:'Paint and supplies',who:'Paint shop',date:'2026-10-10',amt:3200,paid:true,rc:[]},
  {id:'s8',cat:'Flooring',desc:'Carpet and vinyl, supply and lay',who:'Demo Flooring',quote:7800,amt:0,paid:false,rc:[]},
  {id:'s9',cat:'Contingency',desc:'Rotten subfloor repairs',who:'Sample Builders',date:'2026-05-15',amt:5400,paid:true,rc:[]}],
  start:'2026-03-20',target:'2026-12-18',target0:'2026-11-27',hold:3400,tasks:[
  {t:'Building consent issued',k:'Consent',d:'2026-04-10',ok:true},
  {t:'Strip-out',k:'Trade booked',d:'2026-04-20',who:'Sample Demolition Ltd',ok:true},
  {t:'Pre-line inspection',k:'Inspection',d:'2026-09-15',ok:true},
  {t:'Kitchen install',k:'Trade booked',d:'2026-10-20',who:'Sample Kitchens'},
  {t:'Flooring',k:'Trade booked',d:'2026-11-20',who:'Demo Flooring'},
  {t:'Final inspection and CCC',k:'Inspection',d:'2026-12-10'}]},
 {type:'rental',addr:'8 Demo Avenue',sub:'Hamilton',price:620000,legal:2500,extra:4200,date:'2025-08-02',value:655000,rent:640,exp:9800,loan:430000,rate:6.15,
  parts:[{loan:230000,rate:6.9,fixTerm:'18',fixStart:'2025-06-05',ltype:'io',term:30},{loan:200000,rate:5.29,fixTerm:'12',fixStart:'2026-03-20',ltype:'io',term:30}],
  money:[
  {id:'m9',kind:'in',cat:'Rent',date:'2026-04-10',amt:2560,note:'4 weeks',rc:[]},
  {id:'m10',kind:'in',cat:'Rent',date:'2026-05-08',amt:2560,note:'4 weeks',rc:[]},
  {id:'m11',kind:'in',cat:'Rent',date:'2026-06-05',amt:2560,note:'4 weeks',rc:[]},
  {id:'m1',kind:'in',cat:'Rent',date:'2026-07-03',amt:2560,note:'4 weeks',rc:[]},
  {id:'m2',kind:'out',cat:'Insurance',date:'2026-07-15',amt:1890,note:'Annual premium',rc:[]},
  {id:'m3',kind:'in',cat:'Rent',date:'2026-07-31',amt:2560,note:'4 weeks',rc:[]},
  {id:'m4',kind:'out',cat:'Rates',date:'2026-08-20',amt:1050,note:'Instalment 1',rc:[]},
  {id:'m5',kind:'in',cat:'Rent',date:'2026-08-28',amt:2560,note:'4 weeks',rc:[]},
  {id:'m6',kind:'out',cat:'Repairs & maintenance',date:'2026-09-09',amt:340,note:'Leaking tap',rc:[]},
  {id:'m7',kind:'in',cat:'Rent',date:'2026-09-25',amt:2560,note:'4 weeks',rc:[]},
  {id:'m8',kind:'in',cat:'Rent',date:'2026-10-23',amt:2560,note:'4 weeks',rc:[]}],
  ten:{who:'Sample tenant',ls:'2025-12-15',le:'2026-12-14',ri:'2025-12-15',bond:2560,lodged:true},
  hh:{heat:'2025-08-20',ins:'2025-08-20',vent:'2025-09-02',draught:'2025-09-02'}},
 {type:'project',addr:'3 Example Street',sub:'Tauranga',price:710000,legal:2600,extra:1500,date:'2026-06-20',value:745000,budget:60000,spent:66000},
 {type:'potential',intent:'flip',addr:'51 Prospect Lane',sub:'Hamilton East, Hamilton',price:640000,legal:2500,extra:1800,reno:75000,rates:3200,ins:2400,power:150,loan:512000,rate:5.9,ltype:'io',term:30,hold:3134,months:6,sell:24000,value:830000,comps:[
  {addr:'14 Sample Crescent',sub:'Hamilton East, Hamilton',price:815000,date:'2026-08-12',note:'3 bed, renovated'},
  {addr:'7 Demo Place',sub:'Hamilton East, Hamilton',price:790000,date:'2026-07-03',note:'3 bed, partly updated'},
  {addr:'22 Example Road',sub:'Claudelands, Hamilton',price:860000,date:'2026-09-21',note:'4 bed, renovated'}]}
];
var KEY='nzpt.v1',isSample=true;
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);isSample=false;return d.props||[]}}catch(e){}return JSON.parse(JSON.stringify(SAMPLE))}
function save(){isSample=false;try{localStorage.setItem(KEY,JSON.stringify({props:props}))}catch(e){}}
var props=load();
var cur=0,newType=null,newIntent='flip',newLoan='pi',editIdx=null,editSec='details';
