// Alkawn Hub service worker (safe version)
// - Always tries the network first, so you get the newest app after every update.
// - Falls back to the saved copy only when you are offline.
// - Never touches Supabase or any other website, and never caches saves (POST/PATCH).
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())await caches.delete(k); // clear any old, stale copies
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  const url=new URL(req.url);
  if(req.method!=="GET"||url.origin!==self.location.origin)return; // let the browser handle it normally
  e.respondWith(
    fetch(req).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open("alkawn-shell-v2").then(c=>c.put(req,copy)).catch(()=>{})}
      return res;
    }).catch(()=>caches.match(req).then(hit=>hit||caches.match("./")||Response.error()))
  );
});
