// Offline support. The app's own files are fetched from the network first so updates show straight away,
// with the cached copy used when there's no signal. Other sites (maps, address search) are never cached here.
// The browser's own cache is skipped (GitHub Pages lets it keep files for 10 minutes), so an update never mixes new
// scripts with an old stylesheet.
var CACHE='nzpt-v13',FILES=['./','index.html','styles.css','layout.css','js/data.js','js/util.js','js/receipts.js','js/sales.js','js/costs.js','js/timeline.js','js/rental.js','js/potential.js','js/settings.js','js/tax.js','js/address.js','js/councils.js','js/charts.js','js/views.js','js/home.js','js/forms.js','js/tools.js','js/tour.js','js/picker.js','js/sync.js','js/main.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES.map(function(f){return new Request(f,{cache:'reload'})}))}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||/\.csv$/i.test(u.pathname))return;
  e.respondWith(fetch(u.href,{cache:'no-cache'}).then(function(r){
    if(r.ok){var c=r.clone();caches.open(CACHE).then(function(x){x.put(e.request,c)})}
    return r;
  }).catch(function(){return caches.match(e.request,{ignoreSearch:true}).then(function(r){return r||caches.match('index.html')})}));
});
