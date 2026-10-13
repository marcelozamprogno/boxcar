(() => {
  if (window.IcedCarPresence || ['localhost','127.0.0.1'].includes(location.hostname)) return;
  let cart;
  try {cart=JSON.parse(sessionStorage.getItem('ponto-forte-checkout-v1')||'null');} catch {}
  const variant=/^\/([123])\/?$/.exec(location.pathname)?.[1]||cart?.variant;
  if(!['1','2','3'].includes(variant))return;
  const key='icedcar-presence-session-v1';
  let session;
  try {session=sessionStorage.getItem(key);} catch {}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session||'')){
    session=crypto.randomUUID();
    try {sessionStorage.setItem(key,session);} catch {}
  }
  const attribution=window.IcedCarTracking?.context()||{};
  const sourceText=String(attribution.utm_source||'').toLowerCase();
  const source=attribution.ttclid||/tiktok/.test(sourceText)?'TikTok Ads':
    attribution.fbc||/facebook|instagram|meta/.test(sourceText)?'Meta Ads':
    Object.keys(attribution).some(key=>key.startsWith('utm_')&&attribution[key])?'Outras campanhas':'Orgânico/Direto';
  let stage=location.pathname.startsWith('/checkout')?'checkout':'home';
  async function send(){if(document.hidden||navigator.onLine===false)return;try{await fetch('/api/presence',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({variant,session,stage,source}),keepalive:true,signal:AbortSignal.timeout(5000)
  });}catch{/* Presence does not affect the storefront. */}}
  window.IcedCarPresence={stage(value){if(['home','checkout','payment'].includes(value)){stage=value;void send();}}};
  void send();
  setInterval(()=>void send(),15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void send();});
})();
