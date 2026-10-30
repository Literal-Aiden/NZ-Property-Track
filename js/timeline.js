// Reno timeline and milestones.
// Reno timeline: start, target finish, milestones, and what delays cost in holding.
// The first target finish set is kept as the baseline (target0), so a target that moves out shows up in dollars.
var KINDS=['Trade booked','Consent','Inspection','Delivery','Other'],tlEdit=false,tlAdd=false;
function timeCard(p){
  var today=iso(new Date()),wk=(p.hold||0)*12/52,T=p.tasks||[];
  var h='<div class="card" id="tl"><div class="row" style="cursor:default">'+hd('clock','Reno timeline')+''+(tlEdit?'':'<button class="edit" data-x="tledit">'+(p.target?'Edit dates':'Set dates')+'</button>')+'</div>';
  if(tlEdit)return h+'<label>Reno start</label><input id="t_start" type="date"><label>Target finish</label><input id="t_target" type="date">'+
    (p.target0&&p.target0!==p.target?'<label class="chk"><input type="checkbox" id="t_rebase">Make this the new baseline (original target '+fmtD(p.target0)+')</label>':'')+
    '<label>Holding costs per month (interest, rates, insurance, power)</label><input id="t_hold"'+MONEY+
    (p.loan?'<p class="sub" style="margin-top:6px">Mortgage interest alone is about '+$$(p.loan*p.rate/1200)+' a month.</p>':'')+
    '<p class="sub" style="margin-top:8px">The first target finish you set is kept as the baseline, so if it moves out you can see what the delay costs.</p>'+
    '<div class="btns fbar"><button class="go" data-x="tlsave">Save</button><button class="go ghost" data-x="tlcancel">Cancel</button></div></div>';
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
  var na=T.filter(function(x){return x.auto}).length;
  if(p.done&&na)h+='<p class="sub" style="margin-top:8px">'+na+' milestone'+(na>1?'s were':' was')+' ticked when you marked the reno finished. “Not finished yet” unticks '+(na>1?'them':'it')+'.</p>';
  if(tlAdd)return h+'<p class="grp" style="margin:16px 0 0">Add a milestone</p><label>Milestone</label><input id="k_t" placeholder="e.g. Plumber booked, final inspection" required>'+
    '<div class="grid" style="margin-top:0"><div><label>Type</label><select id="k_k">'+KINDS.map(function(k){return '<option>'+k+'</option>'}).join('')+'</select></div><div><label>Date</label><input id="k_d" type="date"></div></div>'+
    '<label>Who (optional)</label><input id="k_who"><p class="sub neg formerr" style="margin-top:12px" role="alert"></p><div class="btns fbar"><button class="go" data-x="tkadd">Add milestone</button><button class="go ghost" data-x="tkcancel">Cancel</button></div></div>';
  if(!T.length)h+=empty('check','No milestones yet','Add trades booked, consents, inspections and deliveries, and tick them off as the reno moves along.');
  return h+'<div class="btns"><button class="go" data-x="tknew">Add milestone</button>'+(p.start&&p.target?'<button class="go ghost" data-x="tldone">'+(p.done?'Not finished yet':'Mark reno finished')+'</button>':'')+'</div></div>';
}
// Progress photos (projects, shown under the timeline): before, during and after photos for each room or area,
// stored with the receipt files (p.pics: {id,name,type,added,room,stage}) and included in backups.
// A room with both before and after photos shows the earliest before next to the latest after.
var ROOMS=['Kitchen','Bathroom','Laundry','Living','Bedrooms','Exterior','Garden','Other'],STAGES=[['before','Before'],['during','During'],['after','After']];
var picRoom='Kitchen',picStage='before',picArm=null;
function picCard(p){
  var P=p.pics||[];
  var h='<div class="card" id="pics">'+hd('camera','Progress photos')+
    '<p class="sub" style="margin-top:4px">Before and after photos of each room, handy for marketing, valuers and your own records.</p>'+
    '<label>Room or area</label><select id="pic_room">'+ROOMS.map(function(r){return '<option'+(r===picRoom?' selected':'')+'>'+r+'</option>'}).join('')+'</select>'+
    '<label>Stage</label><div class="seg">'+STAGES.map(function(s){return '<button data-x="picst" data-v="'+s[0]+'" class="'+(picStage===s[0]?'on':'')+'">'+s[1]+'</button>'}).join('')+'</div>'+
    '<label class="go filebtn" style="text-align:center">'+ic('camera')+' Add '+STAGES.filter(function(s){return s[0]===picStage})[0][1].toLowerCase()+' photos of '+picRoom.toLowerCase()+'<input type="file" class="picin" accept="image/*" multiple hidden></label>'+
    (rcMsg&&sec==='tl'?'<p class="sub neg" style="margin-top:6px">'+esc(rcMsg)+'</p>':'');
  ROOMS.forEach(function(room){
    var R=P.filter(function(x){return x.room===room});if(!R.length)return;
    var b=R.filter(function(x){return x.stage==='before'})[0],a=R.filter(function(x){return x.stage==='after'}).pop();
    h+='<p class="grp" style="margin:16px 0 0">'+room+' · '+R.length+' photo'+(R.length>1?'s':'')+'</p>';
    if(b&&a)h+='<div class="ba">'+[[b,'Before'],[a,'After']].map(function(o){return '<button class="th" data-x="rcopen" data-id="'+esc(o[0].id)+'"><img data-rc="'+esc(o[0].id)+'" alt="'+o[1]+'"><span>'+o[1]+'</span></button>'}).join('')+'</div>';
    h+='<div class="rcs">'+R.map(function(x){return '<div class="pic">'+rcThumb(x,'picdel',picArm===x.id)+'<span class="sub">'+STAGES.filter(function(s){return s[0]===x.stage})[0][1]+' · '+fmtD(x.added).replace(/ \d{4}$/,'')+'</span></div>'}).join('')+'</div>';
  });
  if(!P.length)h+=empty('camera','No photos yet','Pick a room and stage above, then add photos. Take “before” shots now, so you have them for the “after”.');
  if(picArm)h+='<p class="sub neg" style="margin-top:6px">Tap × again to remove that photo.</p>';
  return h+'</div>';
}
function addPics(p,files){
  rcMsg='';
  Promise.all([].slice.call(files).map(function(f){
    return shrink(f).then(function(b){var r={id:uid(),name:f.name,type:b.type||f.type,added:iso(new Date()),room:picRoom,stage:picStage};return rcPut(Object.assign({blob:b},r)).then(function(){return r})});
  })).then(function(l){p.pics=(p.pics||[]).concat(l);isSample=false;render()}).catch(function(){rcMsg='Couldn’t save that photo in this browser. Private browsing can block it.';current()});
}
