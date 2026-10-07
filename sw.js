// Alkawn Hub service worker
// - Online: always loads the newest app from the network first, so updates arrive straight away.
// - Offline: opens the last saved copy of the app, so you can keep working without signal.
// - Keeps a copy of the Supabase library so the app can start offline.
// - Never touches Supabase requests and never stores saves (POST/PATCH).
const SHELL="alkawn-shell-v3";
const LIB="alkawn-lib-v1";
const LIB_URL="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil((async()=>{
    try{const c=await caches.open(LIB);const req=new Request(LIB_URL,{mode:"no-cors"});await c.put(req,await fetch(req))}catch(x){}
    try{const c=await caches.open(SHELL);await c.add("./")}catch(x){}
  })());
});

self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==SHELL&&k!==LIB)await caches.delete(k); // drop old, stale copies
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.hostname==="cdn.jsdelivr.net"){e.respondWith(libFirst(req));return}
  if(url.origin!==self.location.origin)return; // Supabase and everything else: leave to the browser
  e.respondWith(networkFirst(req));
});

async function libFirst(req){
  const cache=await caches.open(LIB);
  const hit=await cache.match(req);
  const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==="opaque"))cache.put(req,r.clone()).catch(()=>{});return r}).catch(()=>null);
  return hit||(await net)||Response.error();
}

async function networkFirst(req){
  const cache=await caches.open(SHELL);
  try{
    const r=await fetch(req);
    if(r&&r.ok)cache.put(req,r.clone()).catch(()=>{});
    return r;
  }catch(err){
    const hit=await cache.match(req,{ignoreSearch:true})||(req.mode==="navigate"?(await cache.match("./")||await cache.match("index.html")):null);
    return hit||Response.error();
  }
}
