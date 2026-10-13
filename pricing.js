const prices = Object.freeze({
  '1': Object.freeze({1:9700, 2:12900}),
  '3': Object.freeze({1:7900, 2:10900}),
  '2': Object.freeze({1:12153, 2:19783}),
  legacy: Object.freeze({1:8900, 2:14700})
});

export const variantFromPath = pathname => (/^\/([123])\/?$/.exec(pathname)?.[1] || '1');

export function offerForVariant(variant) {
  if (!['1','2','3'].includes(variant)) return null;
  const singleCents = prices[variant][1];
  const doubleCents = prices[variant][2];
  const compareCents = singleCents * 2;
  const savingsCents = compareCents - doubleCents;
  return {singleCents,doubleCents,compareCents,savingsCents,
    discountPercent:Math.round(savingsCents / compareCents * 100)};
}

export function pricingForCart(cart) {
  const variant = cart?.version === 1 && cart.variant === undefined ? 'legacy' :
    cart?.version === 2 && ['1','2','3'].includes(cart.variant) ? cart.variant : null;
  const quantity = cart?.quantity;
  if (!variant || ![1,2].includes(quantity)) return null;
  const totalCents = prices[variant][quantity];
  return {variant,quantity,totalCents,unitCents:totalCents / quantity};
}
