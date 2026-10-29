// Reno timeline and milestones.
// Reno timeline: start, target finish, milestones, and what delays cost in holding.
// The first target finish set is kept as the baseline (target0), so a target that moves out shows up in dollars.
var KINDS=['Trade booked','Consent','Inspection','Delivery','Other'],tlEdit=false,tlAdd=false;
function timeCard(p){
  var today=iso(new Date()),wk=(p.hold||0)*12/52,T=p.tasks||[];
  var h='<div class="card" id="tl"><div class="row" style="cursor:default"><b>Reno timeline</b>'+(tlEdit?'':'<button class="edit" data-x="tledit">'+(p.target?'Edit dates':'Set dates')+'</button>')+'</div>';
  if(tlEdit)return h+'<label>Reno start</label><input id="t_start" type="date"><label>Target finish</label><input id="t_target" type="date">'+
    (p.target0&&p.target0!==p.target?'<label class="chk"><input type="checkbox" id="t_rebase">Make this the new baseline (original target '+fmtD(p.target0)+')</label>':'')+
    '<label>Holding costs per month (interest, rates, insurance, power)</label><input id="t_hold"'+MONEY+
    (p.loan?'<p class="sub" style="margin-top:6px">Mortgage interest alone is about '+$$(p.loan*p.rate/1200)+' a month.</p>':'')+
    '<p class="sub" style="margin-top:8px">The first target finish you set is kept as the baseline, so if it moves out you can see what the delay costs.</p>'+
    '<div class="btns"><button class="go" data-x="tlsave">Save</button><button class="go ghost" data-x="tlcancel">Cancel</button></div></div>';
  if(p.start&&p.target){
    var tot=Math.max(1,dd(p.start,p.target)),el=Math.max(0,dd(p.start,p.done||today)),left=dd(today,p.target),late=!p.done&&left<0,lateDone=p.done&&dd(p.target,p.done)>0;
    var slip=p.target0?dd(p.target0,p.done||(late?today:p.target)):0;
    h+='<div class="bar"><i class="'+(late||lateDone?'over':'')+'" style="width:'+Math.min(100,Math.round(el/tot*100))+'%"></i></div><span class="sub">'+
      (p.done?'Finished '+fmtD(p.done)+(lateDone?', '+dd(p.target,p.done)+' days after target':''):dd(today,p.start)>0?'Starts '+fmtD(p.start)+' · '+Math.ceil(tot/7)+' weeks planned':'Week '+(Math.floor(el/7)+1)+' of '+Math.ceil(tot/7)+' · '+(late?-left+' days past target':left+' days to target finish'))+'</span>';
    h+='<div class="grid">'+stat('Target finish',fmtD(p.target),late?'neg':'')+stat('Holding cost / week',p.hold?$$(wk):'Not set')+
      (slip>0?stat('Behind original target',slip+' days','neg')+stat('Extra holding from delays',p.hold?$$(slip*wk/7):'–','neg'):'')+'</div>';
    if(late&&p.hold)h+='<p class="sub neg" style="margin-top:8px">Every extra week costs about '+$$(wk)+' in holding.</p>';
    if(!p.hold)h+='<p class="sub" style="margin-top:8px">Add a holding cost per month in Edit dates to see what delays cost.</p>';
  }else h+='<p class="sub" style="margin-top:6px">Set a start and target finish date to track progress, and a holding cost to see what delays cost.</p>';
  if(T.length)h+='<p class="grp" style="margin:16px 0 0">Milestones</p>'+T.map(function(x,i){return i}).sort(function(a,b){return (T[a].d||'9999').localeCompare(T[b].d||'9999')}).map(function(i){
    var x=T[i],od=!x.ok&&x.d&&x.d<today;
    return '<div class="task'+(x.ok?' ok':'')+'"><input type="checkbox" data-x="tk" data-k="'+i+'"'+(x.ok?' checked':'')+' aria-label="Done"><div><b>'+esc(x.t)+'</b><p class="sub'+(od?' neg':'')+'">'+[esc(x.k||''),x.d?fmtD(x.d):'',esc(x.who||''),od?'Overdue':''].filter(Boolean).join(' · ')+'</p></div><button class="edit del" data-x="tkdel" data-k="'+i+'" aria-label="Delete milestone">×</button></div>';
  }).join('');
  if(tlAdd)return h+'<p class="grp" style="margin:16px 0 0">Add a milestone</p><label>Milestone</label><input id="k_t" placeholder="e.g. Plumber booked, final inspection">'+
    '<div class="grid" style="margin-top:0"><div><label>Type</label><select id="k_k">'+KINDS.map(function(k){return '<option>'+k+'</option>'}).join('')+'</select></div><div><label>Date</label><input id="k_d" type="date"></div></div>'+
    '<label>Who (optional)</label><input id="k_who"><div class="btns"><button class="go" data-x="tkadd">Add milestone</button><button class="go ghost" data-x="tkcancel">Cancel</button></div></div>';
  return h+'<div class="btns"><button class="go" data-x="tknew">Add milestone</button>'+(p.start&&p.target?'<button class="go ghost" data-x="tldone">'+(p.done?'Not finished yet':'Mark reno finished')+'</button>':'')+'</div></div>';
}
