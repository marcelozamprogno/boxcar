import { pricingForCart } from './pricing.js';
import { attributionUrl, captureAttribution, readMetaAttribution, metaAttributionCookie, restoreMetaAttribution } from './attribution.js';

(() => {
  if (window.IcedCarTracking) return;
  const pixel = 'DAT8TNJC77U5PB60DTT0';
  const prefix = 'ponto-forte-tiktok-v1:';
  let route = /^\/([123])\/?$/.exec(location.pathname)?.[1];
  if (location.pathname === '/checkout' || location.pathname === '/checkout/') {
    route = new URLSearchParams(location.search).get('offer');
    if (!route) try { route = JSON.parse(sessionStorage.getItem('ponto-forte-checkout-v1') || 'null')?.variant; } catch {}
  }
  const active = route === '3' && !['localhost','127.0.0.1'].includes(location.hostname);
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem(prefix + 'attribution') || '{}'); } catch {}
  attribution=restoreMetaAttribution(attribution,readMetaAttribution(document.cookie));
  attribution = captureAttribution(attribution,location.search);
  const metaCookie=metaAttributionCookie(attribution);
  if(metaCookie)document.cookie=metaCookie;
  try { sessionStorage.setItem(prefix + 'attribution', JSON.stringify(attribution)); } catch {}
  function context() {
    attribution = captureAttribution(attribution,location.search);
    try { sessionStorage.setItem(prefix + 'attribution', JSON.stringify(attribution)); } catch {}
    const cookie = document.cookie.split('; ').find(item => item.startsWith('_ttp='));
    const fbp = document.cookie.split('; ').find(item => item.startsWith('_fbp='))?.slice(5);
    const fbc = document.cookie.split('; ').find(item => item.startsWith('_fbc='))?.slice(5);
    return { ttclid: attribution.ttclid || undefined, fbclid:attribution.fbclid || undefined, ttp: cookie?.slice(5) || undefined,
      fbp: fbp || undefined, fbc: attribution.fbcFallback || fbc || undefined,
      ...Object.fromEntries(['src','sck','utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id']
        .filter(key => attribution[key]).map(key => [key,attribution[key]])) };
  }
  const seen = id => { try { return sessionStorage.getItem(prefix + id) === '1'; } catch { return false; } };
  const mark = id => { try { sessionStorage.setItem(prefix + id, '1'); } catch {} };
  const sha = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))), b => b.toString(16).padStart(2,'0')).join('');
  let identity = {};
  let flushing = false;
  async function flush() {
    if (!active || flushing || navigator.onLine === false) return;
    flushing = true;
    try {
      const records = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix + 'pending:')) records.push(key);
      }
      for (const key of records) {
        const record = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (!record) continue;
        if (record.cart?.variant !== '3') { sessionStorage.removeItem(key); continue; }
        if (Date.now()/1000 - record.event_time > 47*3600) { sessionStorage.removeItem(key); continue; }
        try {
          const response = await fetch('/api/tiktok', {method:'POST',headers:{'content-type':'application/json'},
            body:JSON.stringify({...record,context:context(),identity}),keepalive:true,
            signal:AbortSignal.timeout(7000)});
          if (response.ok && (await response.json()).event_id === record.event_id) sessionStorage.removeItem(key);
        } catch { /* Retry on the next page, online event, or interval. */ }
      }
    } catch { /* Storage may be unavailable in private browsing. */ }
    finally { flushing = false; }
  }
  function properties(cart) {
    const pricing = pricingForCart(cart);
    if (!pricing || cart.units?.length !== cart.quantity) return null;
    const price = pricing.unitCents / 100;
    const contents = cart.units.map((unit,index) => ({
      content_id:'ponto-forte-icecar', content_name:'IcedCar – Cooler dos Apaixonados por Carros & Churrasco',
      content_type:'product', quantity:1, price, vehicle_brand:unit.brand,
      vehicle_model:unit.model, vehicle_year:unit.year, vehicle_color:unit.color,
      vehicle_side:unit.side, unit_number:index + 1
    }));
    return {contents,content_ids:['ponto-forte-icecar'],content_type:'product',currency:'BRL',
      value:pricing.totalCents / 100,quantity:cart.quantity,
      price_variant:pricing.variant,product_name:'IcedCar',store_name:'IcedCar'};
  }
  function track(event, cart, id, extra = {}) {
    // Purchase is delivered only by the durable, payment-verified server queue.
    if (!active || !['ViewContent','AddToCart','InitiateCheckout','AddPaymentInfo'].includes(event)) return false;
    if (cart?.variant !== '3') return false;
    const props = properties(cart);
    if (!props) return false;
    const eventId = `${event}_${id}`;
    if (seen(eventId)) return false;
    if (event !== 'Purchase') {
      try { sessionStorage.setItem(prefix + 'pending:' + eventId, JSON.stringify({
        event,event_id:eventId,action_id:id,event_time:Math.floor(Date.now()/1000),cart
      })); } catch {}
      void flush();
    }
    try { window.ttq.track(event,{...props,...extra},{event_id:eventId}); mark(eventId); return true; }
    catch { return false; }
  }
  async function identify(customer) {
    if (!active) return;
    const email = String(customer.email || '').trim().toLowerCase();
    let phone = String(customer.phone || '').replace(/\D/g,'');
    const next = {};
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = await sha(email);
    if (/^[1-9]{2}\d{8,9}$/.test(phone)) phone = '55' + phone;
    if (/^55[1-9]{2}\d{8,9}$/.test(phone)) next.phone_number = await sha('+' + phone);
    const document = String(customer.document || '').replace(/\D/g,'');
    if (/^\d{11}$|^\d{14}$/.test(document)) next.external_id = await sha(document);
    if (Object.keys(next).length) {
      identity = next;
      try { sessionStorage.setItem(prefix + 'identity',JSON.stringify(identity)); } catch {}
      window.ttq.identify(identity);
    }
  }
  if (active) {
    !function(w,d,t){w.TiktokAnalyticsObject=t;var q=w[t]=w[t]||[];q.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];q.setAndDefer=function(target,name){target[name]=function(){target.push([name].concat(Array.prototype.slice.call(arguments,0)));};};for(var i=0;i<q.methods.length;i++)q.setAndDefer(q,q.methods[i]);q.instance=function(id){var instance=q._i[id]||[];for(var j=0;j<q.methods.length;j++)q.setAndDefer(instance,q.methods[j]);return instance;};q.load=function(id,options){var src='https://analytics.tiktok.com/i18n/pixel/events.js',script=d.createElement('script');q._i=q._i||{};q._i[id]=[];q._i[id]._u=src;q._t=q._t||{};q._t[id]=+new Date;q._o=q._o||{};q._o[id]=options||{};script.type='text/javascript';script.async=true;script.src=src+'?sdkid='+id+'&lib='+t;var first=d.getElementsByTagName('script')[0];first.parentNode.insertBefore(script,first);};q.load(pixel);q.page();}(window,document,'ttq');
  }
  window.IcedCarTracking = { track, identify, context, properties,
    url: path => attributionUrl(path,context()), identity: () => ({...identity}) };
  try { identity = JSON.parse(sessionStorage.getItem(prefix + 'identity') || '{}'); } catch {}
  void flush();
  addEventListener('online', () => void flush());
  setInterval(() => void flush(),30000);
})();
