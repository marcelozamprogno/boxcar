import './tracking.js';
import { attributionUrl, captureScopedMetaAttribution, readMetaAttribution, restoreMetaAttribution, metaAttributionCookie, metaBrowserIdentifiers, ATTRIBUTION_KEYS } from './attribution.js';

(() => {
  if (window.IcedCarMeta || !window.IcedCarTracking) return;
  const pixel = '969483765461099';
  const prefix = 'icedcar-meta-v1:';
  const active = !['localhost','127.0.0.1'].includes(location.hostname);
  const original = window.IcedCarTracking.track;
  const originalIdentify = window.IcedCarTracking.identify;
  const scopedOffer=/^\/([12])\/?$/.exec(location.pathname || '')?.[1] ||
    ((location.pathname || '').replace(/\/$/,'')==='/checkout'?new URLSearchParams(location.search).get('offer'):null);
  if(['1','2'].includes(scopedOffer)) {
    const key='icedcar-meta-touch-v2:'+scopedOffer,cookieName='icedcar_meta_attribution_'+scopedOffer;
    let touch={};try{touch=JSON.parse(sessionStorage.getItem(key)||'{}')}catch{}
    touch=restoreMetaAttribution(touch,readMetaAttribution(document.cookie,Date.now(),cookieName));
    const baseContext=window.IcedCarTracking.context;
    window.IcedCarTracking.context=()=>{
      touch=captureScopedMetaAttribution(touch,location.search);
      const identifiers=metaBrowserIdentifiers(touch,document.cookie);
      touch={...touch,...identifiers};
      try{sessionStorage.setItem(key,JSON.stringify(touch))}catch{}
      const cookie=metaAttributionCookie(touch,Date.now(),cookieName);
      if(cookie)document.cookie=cookie;
      else if(touch.ttclid || touch.utm_source)document.cookie=cookieName+'=; Path=/; Max-Age=0; SameSite=Lax; Secure';
      const result=baseContext();
      if(Object.keys(touch).length) {
        for(const field of [...ATTRIBUTION_KEYS,'fbc','fbp'])delete result[field];
        for(const field of ATTRIBUTION_KEYS)if(touch[field])result[field]=touch[field];
        Object.assign(result,identifiers);
      }
      return result;
    };
    window.IcedCarTracking.url=path=>attributionUrl(path,window.IcedCarTracking.context());
  }
  const sha = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),
    byte => byte.toString(16).padStart(2,'0')).join('');
  let metaIdentity = {};
  try { metaIdentity = JSON.parse(sessionStorage.getItem(prefix + 'identity') || '{}'); } catch {}
  const seen = id => { try { return sessionStorage.getItem(prefix + 'seen:' + id) === '1'; } catch { return false; } };
  const mark = id => { try { sessionStorage.setItem(prefix + 'seen:' + id,'1'); } catch {} };
  let flushing = false;
  let identityReady = Promise.resolve();

  async function flush() {
    if (!active || flushing || navigator.onLine === false) return;
    flushing = true;
    try {
      const keys = [];
      for (let i=0; i<sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix + 'pending:')) keys.push(key);
      }
      for (const key of keys) {
        const event = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (!event) continue;
        if (Date.now()/1000 - event.event_time > 47*3600) { sessionStorage.removeItem(key); continue; }
        try {
          const scoped = ['1','2'].includes(event.cart?.variant);
          const response = await fetch('/api/meta', {method:'POST',headers:{'content-type':'application/json'},
            body:JSON.stringify({...event,context:scoped && event.context ? event.context : window.IcedCarTracking.context(),
              identity:scoped && event.identity ? event.identity : window.IcedCarTracking.identity(),
              meta_identity:scoped && event.meta_identity ? event.meta_identity : metaIdentity}),
            keepalive:true,signal:AbortSignal.timeout(7000)});
          if (response.ok && (await response.json()).event_id === event.event_id) sessionStorage.removeItem(key);
        } catch { /* Retry when the visitor is online again. */ }
      }
    } catch { /* Private browsing can disable session storage. */ }
    finally { flushing = false; }
  }

  if (active) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init',pixel);
    window.fbq('track','PageView');
  }

  function track(event,cart,id,extra={}) {
    const result = extra.metaOnly ? false : original(event,cart,id,extra);
    if(extra.tiktokOnly)return result;
    if (!active || !['ViewContent','AddToCart','InitiateCheckout','AddPaymentInfo','Purchase'].includes(event)) return result;
    const pricing = window.IcedCarTracking.properties(cart);
    if (!pricing || typeof id !== 'string') return result;
    const eventId = `${event}_${id}`;
    const contents = pricing.contents.map(item => ({id:item.content_id,quantity:item.quantity,item_price:item.price}));
    if(event==='Purchase'&&Array.isArray(extra.bumps))contents.push(...extra.bumps.map(item=>({id:item.sku,quantity:1,item_price:item.priceCents/100})));
    const data = {currency:'BRL',value:event === 'Purchase' && Number.isFinite(extra.value) ? extra.value : pricing.value,
      content_type:'product',content_ids:[...new Set(contents.map(item=>item.id))],
      contents,num_items:contents.reduce((sum,item)=>sum+item.quantity,0),price_variant:pricing.price_variant,
      ...(event === 'Purchase' ? {order_id:id,payment_method:'pix',payment_status:'awaiting_payment',
        shipping_fee:extra.shipping_fee,shipping_method:extra.shipping_method} : {})};
    if (!seen(eventId)) {
      try { window.fbq('trackSingle',pixel,event,data,{eventID:eventId}); mark(eventId); } catch { /* TikTok remains independent. */ }
    }
    if (event !== 'Purchase') {
      const record={event,event_id:eventId,action_id:id,event_time:Math.floor(Date.now()/1000),cart};
      const scoped=['1','2'].includes(pricing.price_variant);
      if(scoped) record.context=window.IcedCarTracking.context();
      const enqueue=()=>{
        if(scoped) { record.meta_identity={...metaIdentity}; record.identity=window.IcedCarTracking.identity(); }
        try { sessionStorage.setItem(prefix + 'pending:' + eventId,JSON.stringify(record)); } catch {}
        void flush();
      };
      if(scoped) void identityReady.then(enqueue); else enqueue();
    }
    return result;
  }

  async function identify(customer) {
    const tiktok = originalIdentify(customer);
    const email = String(customer.email || '').trim().toLowerCase();
    const phone = String(customer.phone || '').replace(/\D/g,'');
    const document = String(customer.document || '').replace(/\D/g,'');
    const next = {};
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = await sha(email);
    if (/^[1-9]{2}\d{8,9}$/.test(phone)) next.phone = await sha('55' + phone);
    if (/^\d{11}$|^\d{14}$/.test(document)) next.external_id = await sha(document);
    metaIdentity = next;
    try { sessionStorage.setItem(prefix + 'identity',JSON.stringify(metaIdentity)); } catch {}
    return tiktok;
  }

  window.IcedCarTracking.track = track;
  window.IcedCarTracking.identify = customer => {
    const result=identify(customer);
    identityReady=result.catch(()=>{});
    return result;
  };
  window.IcedCarMeta = {pixel,trackPurchase:(cart,id,extra)=>track('Purchase',cart,id,{...extra,metaOnly:true})};
  void flush();
  addEventListener('online',() => void flush());
  setInterval(() => void flush(),30000);
})();
