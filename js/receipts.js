// Receipt files in IndexedDB, shared by reno costs and rental money.
// Receipt files live in IndexedDB (localStorage is too small for photos). Items only hold {id,name,type}.
var idb=null,RCU={};
function db(){return idb||(idb=new Promise(function(ok,no){var r=indexedDB.open('nzpt',1);r.onupgradeneeded=function(){r.result.createObjectStore('rc',{keyPath:'id'})};r.onsuccess=function(){ok(r.result)};r.onerror=function(){idb=null;no(r.error)}}))}
function rcTx(mode,fn){return db().then(function(d){return new Promise(function(ok,no){var t=d.transaction('rc',mode),q=fn(t.objectStore('rc'));t.oncomplete=function(){ok(q&&q.result)};t.onerror=function(){no(t.error)}})})}
function rcPut(r){return rcTx('readwrite',function(s){s.put(r)})}
function rcDel(ids){ids.forEach(function(id){if(RCU[id]){URL.revokeObjectURL(RCU[id]);delete RCU[id]}});return ids.length?rcTx('readwrite',function(s){ids.forEach(function(id){s.delete(id)})}).catch(function(){}):Promise.resolve()}
function rcUrl(id){return RCU[id]?Promise.resolve(RCU[id]):rcTx('readonly',function(s){return s.get(id)}).then(function(r){return r?(RCU[id]=URL.createObjectURL(r.blob)):''})}
// Photos are scaled to 1600px and saved as JPEG, which keeps a phone photo to a few hundred KB.
function shrink(f){
  if(!/^image\/(jpeg|png|webp)$/.test(f.type))return Promise.resolve(f);
  return new Promise(function(ok){
    var u=URL.createObjectURL(f),im=new Image();
    im.onload=function(){var k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(function(b){ok(b&&b.size<f.size?b:f)},'image/jpeg',.82)};
    im.onerror=function(){URL.revokeObjectURL(u);ok(f)};im.src=u;
  });
}
function addReceipts(files){
  rcMsg='';
  Promise.all([].slice.call(files).map(function(f){
    return shrink(f).then(function(b){var r={id:uid(),name:f.name,type:b.type||f.type,added:iso(new Date())};return rcPut(Object.assign({blob:b},r)).then(function(){return r})});
  })).then(function(l){pendRc=pendRc.concat(l)}).catch(function(){rcMsg='Couldn’t save that file in this browser. Private browsing can block it.'}).then(function(){if(itemEdit!==null||moneyEdit!==null)keepIn(rcCard())});
}
// drop: the data-x action for the remove button (default rcdrop); armed: show it as waiting for a second tap.
function rcThumb(r,drop,armed){
  var img=/^image\//.test(r.type);drop=typeof drop==='string'?drop:'rcdrop';
  return '<div class="rc"><button class="th" data-x="rcopen" data-id="'+esc(r.id)+'" title="'+esc(r.name)+'">'+(img?'<img data-rc="'+esc(r.id)+'" alt="'+esc(r.name)+'">':/pdf/.test(r.type)?'PDF':'File')+'</button><button class="x'+(armed===true?' armed':'')+'" data-x="'+drop+'" data-id="'+esc(r.id)+'" aria-label="Remove file">×</button></div>';
}
// Opens the camera straight away to photograph a receipt or invoice.
function rcCam(){return '<label class="rcadd">'+ic('camera')+'Camera<input type="file" class="rcin" accept="image/*" capture="environment" hidden></label>'}
function fillThumbs(){document.querySelectorAll('img[data-rc]').forEach(function(im){im.onerror=function(){im.replaceWith('Photo')};rcUrl(im.dataset.rc).then(function(u){if(u)im.src=u})})}
function openRc(id){if(RCU[id]){window.open(RCU[id]);return}var w=window.open('');rcUrl(id).then(function(u){if(w&&u)w.location=u})}
