const urlParams = new URLSearchParams(location.search);
const requestedOffer = urlParams.get('offer') || '1';
const requestedQty = parseInt(urlParams.get('quantity') || urlParams.get('qty') || '0', 10);
const money = value => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(value);
const $ = id => document.getElementById(id);

// Catálogo Bumps
const BUMP_CATALOG = [
  {sku:'keychain',name:'Sua placa, suas chaves',description:'Leve sua personalização também nas chaves. Chaveiro com placa personalizada e função abridor.',priceCents:1990,image:'../media/bumps/keychain.jpeg',cta:'Adicionar chaveiro'},
  {sku:'coasters',name:'Mesa de Respeito',description:'O estilo automotivo também na sua mesa. Kit com 4 porta-copos.',priceCents:2490,image:'../media/bumps/coasters.jpeg',cta:'Adicionar kit com 4'},
  {sku:'ice-packs',name:'Reforço Gelado',description:'Duas placas reutilizáveis para usar junto do gelo no seu cooler.',priceCents:2490,image:'../media/bumps/ice-packs.jpeg',cta:'Adicionar kit com 2'}
];

// Funções de validação e máscaras
const digits = s => String(s || '').replace(/\D/g, '');
function formatCpf(v) {
  const d = digits(v).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
}
function formatCnpj(v) {
  const d = digits(v).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
function formatPhone(v) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}
function validCpf(c) { return digits(c).length === 11; }
function validCnpj(c) { return digits(c).length === 14; }
function validPhone(p) { return digits(p).length >= 10; }
function validCep(z) { return digits(z).length === 8; }
function validName(n) { return String(n||'').trim().split(/\s+/).length >= 2; }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim()); }

let cart;
try {
  cart = JSON.parse(sessionStorage.getItem(key) || 'null');
} catch(e) {}

const defaultUnit = {
  side: 'Frente',
  category: 'hatch',
  brand: 'Mini',
  model: 'Clubman',
  year: '2011',
  color: 'Preto',
  plate: 'BOXCAR'
};

// Sempre 1 unidade BoxCar
if (!cart || !cart.units || cart.units.length === 0) {
  cart = {
    version: 2,
    variant: requestedOffer,
    quantity: 1,
    units: [defaultUnit]
  };
  try { sessionStorage.setItem(key, JSON.stringify(cart)); } catch(e){}
} else {
  cart.quantity = 1;
  if (cart.units.length > 1) {
    cart.units = [cart.units[0]];
  }
  try { sessionStorage.setItem(key, JSON.stringify(cart)); } catch(e){}
}
let bumpsSelected = [];

// Preço Fixo: 1 unidade = R$ 147,00
function getCartQuantity() {
  return 1;
}

const cartTotal = () => 147.00;

const bumpsTotal = () => bumpsSelected.reduce((acc, sku) => acc + (BUMP_CATALOG.find(b=>b.sku===sku)?.priceCents || 0) / 100, 0);

const selectedShipping = () => {
  const method = document.querySelector('input[name="shipping-method"]:checked')?.value || 'pac';
  return method === 'sedex' ? { method: 'sedex', cents: 2490, label: 'SEDEX dos Correios' } : { method: 'pac', cents: 0, label: 'PAC dos Correios' };
};

const orderTotal = () => cartTotal() + bumpsTotal() + (selectedShipping().cents / 100);

// Timer 15 minutos
const timer = document.querySelector('header + div p:last-child strong');
if (timer) {
  let deadline = Date.now() + 900000;
  const tick = () => {
    const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timer.textContent = `00:${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };
  tick();
  setInterval(tick, 1000);
}

function removeUnit(index) {
  if (!cart || !cart.units) return;
  if (cart.units.length > 1) {
    cart.units.splice(index, 1);
    cart.quantity = cart.units.length;
  }
  try { sessionStorage.setItem(key, JSON.stringify(cart)); } catch(e){}
  renderAll();
}

function renderSummary(target) {
  target.replaceChildren();
  const compact = target.closest('aside') !== null;
  if (!cart) return;

  const unitDisplayPrice = 147.00;

  cart.units.forEach((unit) => {
    const item = document.createElement('div'); item.className = 'summary-item';
    const photo = document.createElement('img'); photo.src = '../media/boxcar-main.png'; photo.alt = '';
    const content = document.createElement('div'); content.className = 'summary-item-main';
    const name = document.createElement('strong');
    name.textContent = 'BoxCar – Cooler dos Apaixonados por Carros & Churrasco';
    
    const detail = document.createElement('small'); 
    detail.textContent = compact ? `Qtd: 1 · ${unit.brand} ${unit.model}` : `Vista: ${unit.side}; Marca: ${unit.brand}; Modelo: ${unit.model}; Ano: ${unit.year}; Cor: ${unit.color}; Nome na placa: ${unit.plate}`;
    
    const priceBlock = document.createElement('div'); priceBlock.className = 'summary-price';
    const price = document.createElement('b');
    price.textContent = money(unitDisplayPrice);
    
    const stockNotice = document.createElement('p'); stockNotice.className = 'stock-urgency';
    stockNotice.textContent = `Últimas 3 unidades do modelo ${unit.model || 'escolhido'}!`;
    priceBlock.append(price, stockNotice);
    content.append(name, detail);
    
    if (!compact) {
      content.append(priceBlock);
      const actions = document.createElement('div'); actions.className = 'item-actions';
      
      const quantity = document.createElement('div'); quantity.className = 'quantity-control';
      const count = document.createElement('span'); count.textContent = 'Qtd: 1';
      quantity.append(count);
      
      actions.append(quantity);
      content.append(actions);
    }
    item.append(photo, content);
    if (compact) item.append(priceBlock);
    target.append(item);
  });
}

function renderTotals(target) {
  target.replaceChildren();
  const compact = target.closest('aside') !== null;
  const shipping = selectedShipping();
  
  const rows = [
    [compact ? 'Subtotal' : 'Produtos', cartTotal() + bumpsTotal(), '']
  ];

  rows.push([`Frete (${shipping.method.toUpperCase()})`, shipping.cents ? money(shipping.cents / 100) : 'Grátis', '']);
  rows.push(['Total', money(orderTotal()), 'total']);

  for (const [label, amount, kind] of rows) {
    const row = document.createElement('div'); row.className = `total-row ${kind}`;
    const left = document.createElement('span'); left.textContent = label;
    const right = document.createElement('span'); right.textContent = typeof amount === 'number' ? money(amount) : amount;
    row.append(left, right); target.append(row);
  }
}

function renderAll() {
  document.querySelectorAll('.summary-content').forEach(renderSummary);
  document.querySelectorAll('.summary-totals').forEach(renderTotals);
  document.querySelectorAll('[data-count]').forEach(node => { node.textContent = getCartQuantity(); });
  const subBtn = $('identity-form')?.querySelector('button[type=submit]');
  if (subBtn) subBtn.disabled = false;
  const pixTot = $('pix-total');
  if (pixTot) pixTot.textContent = money(orderTotal());
}

renderAll();

$('summary-toggle')?.addEventListener('click', event => {
  const content = event.currentTarget.nextElementSibling;
  content.hidden = !content.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!content.hidden));
});

$('coupon-apply')?.addEventListener('click', () => {
  const message = $('coupon-message');
  message.hidden = false;
  message.textContent = 'Cupons promocionais já aplicados nesta oferta.';
});

// Alternância Pessoa Física vs Pessoa Jurídica
let personType = 'fisica';
const btnFisica = $('person-fisica');
const btnJuridica = $('person-juridica');

function setPerson(type) {
  personType = type;
  if (btnFisica) {
    btnFisica.classList.toggle('active', type === 'fisica');
    btnFisica.setAttribute('aria-pressed', String(type === 'fisica'));
  }
  if (btnJuridica) {
    btnJuridica.classList.toggle('active', type === 'juridica');
    btnJuridica.setAttribute('aria-pressed', String(type === 'juridica'));
  }
  $('name-label').textContent = type === 'fisica' ? 'Nome completo' : 'Razão social';
  $('document-label').textContent = type === 'fisica' ? 'CPF' : 'CNPJ';
  $('customer-document').placeholder = type === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00';
  $('customer-document').value = '';
  $('document-hint').textContent = type === 'fisica' ? 'Confira os 11 dígitos do CPF.' : 'Confira os 14 dígitos do CNPJ.';
  error('identity-error', null, '');
}

btnFisica?.addEventListener('click', () => setPerson('fisica'));
btnJuridica?.addEventListener('click', () => setPerson('juridica'));

$('customer-document')?.addEventListener('input', e => {
  e.target.value = personType === 'fisica' ? formatCpf(e.target.value) : formatCnpj(e.target.value);
});
$('customer-phone')?.addEventListener('input', e => {
  e.target.value = formatPhone(e.target.value);
});

function error(id, input, message) {
  const notice = $(id);
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = !message;
  if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
}

function step(number) {
  for (const [index, id] of ['identity-step', 'delivery-step', 'payment-step'].entries()) {
    const el = $(id);
    if (el) el.hidden = index + 1 !== number;
  }
  for (const element of document.querySelectorAll('.step')) {
    const index = Number(element.dataset.step);
    element.classList.toggle('current', index === number);
    element.classList.toggle('done', index < number);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => step(Number(button.dataset.back))));

function identityChecks() {
  const name = $('customer-name'), email = $('customer-email'), doc = $('customer-document'), phone = $('customer-phone');
  return [
    [name, personType === 'fisica' ? validName(name.value) : name.value.trim().length >= 3, 'Informe o nome completo ou a razão social.'],
    [email, validEmail(email.value), 'Informe um e-mail válido, como nome@dominio.com.'],
    [doc, personType === 'fisica' ? validCpf(doc.value) : validCnpj(doc.value), `Informe um ${personType === 'fisica' ? 'CPF' : 'CNPJ'} válido.`],
    [phone, validPhone(phone.value), 'Informe um celular válido com DDD e 9 dígitos.']
  ];
}

function validateIdentity() {
  const checks = identityChecks();
  checks.forEach(([input]) => input.removeAttribute('aria-invalid'));
  const failed = checks.find(([, valid]) => !valid);
  if (failed) { error('identity-error', failed[0], failed[2]); return false; }
  error('identity-error', null, '');
  return true;
}

$('identity-form')?.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateIdentity()) return;
  step(2);
});

$('zip')?.addEventListener('input', () => {
  const value = digits($('zip').value).slice(0, 8);
  $('zip').value = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
  $('zip-status').textContent = '';
  if (value.length === 8) lookupCep(value);
});

async function lookupCep(cep) {
  $('zip-status').textContent = 'Consultando CEP…';
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error();
    const address = await response.json();
    if (address.erro) { $('zip-status').textContent = 'CEP não encontrado. Confira o número.'; return; }
    $('street').value = address.logradouro || '';
    $('neighborhood').value = address.bairro || '';
    $('city').value = address.localidade || '';
    $('state').value = address.uf || '';
    $('zip-status').textContent = 'Endereço encontrado. Confira os dados e informe o número.';
    $('house-number').focus();
  } catch (err) {
    $('zip-status').textContent = 'Não foi possível consultar o CEP. Preencha manualmente.';
  }
}

$('delivery-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const ids = ['zip', 'street', 'house-number', 'neighborhood', 'city', 'state'];
  ids.forEach(id => $(id).removeAttribute('aria-invalid'));
  if (!validCep($('zip').value)) { error('delivery-error', $('zip'), 'Informe um CEP com 8 dígitos.'); return; }
  const missing = ids.slice(1).find(id => !$(id).value.trim());
  if (missing) { error('delivery-error', $(missing), 'Preencha todos os campos obrigatórios do endereço.'); return; }
  error('delivery-error', null, '');

  const review = $('review'); review.replaceChildren();
  const title = document.createElement('strong'); title.textContent = 'Endereço de entrega';
  const line = document.createElement('p'); 
  line.textContent = `${$('street').value.trim()}, ${$('house-number').value.trim()}${$('complement').value.trim() ? ', ' + $('complement').value.trim() : ''} — ${$('neighborhood').value.trim()}, ${$('city').value.trim()}/${$('state').value.trim().toUpperCase()} — CEP ${$('zip').value}`;
  const shipping = selectedShipping();
  const price = document.createElement('p'); price.textContent = `Produtos: ${money(cartTotal())}. Frete ${shipping.label}: ${shipping.cents ? money(shipping.cents / 100) : 'grátis'}. Total: ${money(orderTotal())}.`;
  price.className = 'review-price';
  review.append(title, line, price);
  renderAll();
  step(3);
});

document.querySelectorAll('input[name="shipping-method"]').forEach(input => input.addEventListener('change', () => {
  renderAll();
}));

// Montagem Order Bumps
const bumpAnchor = document.querySelector('.pix-amount');
if (bumpAnchor) {
  const section = document.createElement('section'); section.className = 'order-bumps';
  section.innerHTML = '<h3>Complete sua resenha</h3><p>Adicionais opcionais · uma unidade de cada oferta por pedido</p>';
  BUMP_CATALOG.forEach(p => {
    const card = document.createElement('article'); card.className = 'bump-card';
    card.innerHTML = `<img src="${p.image}" alt="${p.name}"><div style="flex:1"><h4>${p.name}</h4><p>${p.description}</p><label><input type="checkbox" data-sku="${p.sku}"> ${p.cta} por +${money(p.priceCents/100)}</label></div>`;
    const chk = card.querySelector('input');
    chk.addEventListener('change', () => {
      if (chk.checked) bumpsSelected.push(p.sku);
      else bumpsSelected = bumpsSelected.filter(s => s !== p.sku);
      renderAll();
    });
    section.append(card);
  });
  bumpAnchor.before(section);
}

// Ativa Pix
if ($('pix-option')) {
  $('pix-option').disabled = false;
  $('pix-option').setAttribute('aria-pressed', 'true');
  $('pix-label').textContent = 'DISPONÍVEL';
}
if ($('payment-unavailable')) $('payment-unavailable').hidden = true;
if ($('pix-panel')) $('pix-panel').hidden = false;
const chkStatus = document.querySelector('.checkout-status');
if (chkStatus) chkStatus.hidden = true;

let statusPollingInterval = null;

$('pix-create')?.addEventListener('click', async () => {
  $('pix-create').disabled = true;
  $('pix-status').textContent = 'Gerando cobrança Pix segura…';

  // Exibe Pop-up Modal de Carregamento
  const modal = $('pix-loading-modal');
  if (modal) {
    modal.style.display = 'flex';
    $('modal-title').textContent = 'Gerando seu Pix...';
    $('modal-desc').textContent = 'Conectando ao Banco Central e reservando seu Mini Cooler BoxCar. Aguarde alguns segundos.';
  }

  const customerDocType = personType === 'fisica' ? 'CPF' : 'CNPJ';
  const customerDocNum = digits($('customer-document').value);
  const customerPhoneNum = digits($('customer-phone').value);
  const customerName = $('customer-name').value.trim();
  const customerEmail = $('customer-email').value.trim();

  const street = $('street').value.trim();
  const streetNumber = $('house-number').value.trim() || 'S/N';
  const complement = $('complement').value.trim();
  const neighborhood = $('neighborhood').value.trim();
  const city = $('city').value.trim();
  const state = $('state').value.trim().toUpperCase();
  const zipCode = digits($('zip').value);

  const shipping = selectedShipping();
  const shippingFeeCents = shipping.cents;

  const unitPriceCents = 14700;
  const items = [];

  if (cart?.units && cart.units.length > 0) {
    const u = cart.units[0];
    items.push({
      title: `BoxCar (${u.brand || 'Personalizado'} ${u.model || ''}) - Placa ${u.plate || 'BOXCAR'}`,
      quantity: 1,
      unitPrice: unitPriceCents,
      tangible: true
    });
  } else {
    items.push({
      title: 'BoxCar – Cooler dos Apaixonados por Carros & Churrasco',
      quantity: 1,
      unitPrice: unitPriceCents,
      tangible: true
    });
  }

  bumpsSelected.forEach(sku => {
    const bump = BUMP_CATALOG.find(b => b.sku === sku);
    if (bump) {
      items.push({
        title: bump.name,
        quantity: 1,
        unitPrice: bump.priceCents,
        tangible: true
      });
    }
  });

  const totalAmountCents = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0) + shippingFeeCents;

  const payload = {
    paymentMethod: 'PIX',
    amount: totalAmountCents,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhoneNum,
      document: {
        type: customerDocType,
        number: customerDocNum
      }
    },
    shipping: {
      fee: shippingFeeCents,
      address: {
        street: street,
        streetNumber: streetNumber,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state,
        zipCode: zipCode,
        country: 'BR'
      }
    },
    items: items,
    pix: {
      expiresInDays: 1
    },
    postbackUrl: 'https://boxcarbrasil.shop/webhook-pix.php'
  };

  try {
    let res;
    try {
      res = await fetch('/api/processar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch(netErr) {
      res = await fetch('../api/processar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    let data = null;
    try {
      if (res) data = await res.json();
    } catch(parseErr) {}

    if (!res.ok && data?.error) {
      throw new Error(data.message || data.error);
    }

    const txData = data?.data || data?.transaction || data || {};
    const pixInfo = txData.pix || data?.pix || {};
    const qrcodeText = pixInfo.copyPasteCode || pixInfo.qrcode || pixInfo.code || txData.copyPasteCode || txData.qrcode || '';
    const transactionId = txData.id || data?.id;

    if (!qrcodeText) {
      throw new Error('Código Pix não retornado pela API InvictusPay.');
    }

    // Dispara evento Meta Pixel: AddPaymentInfo
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'AddPaymentInfo', {
          value: totalAmountCents / 100,
          currency: 'BRL',
          content_type: 'product'
        }, { eventID: transactionId });
      }
    } catch(e) {}

    // Salva detalhes do pedido na sessão e no localStorage
    const orderInfo = {
      id: transactionId,
      amount: totalAmountCents / 100,
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhoneNum,
      pixCode: qrcodeText,
      items: items,
      address: `${street}, ${streetNumber} - ${city}/${state}`
    };
    try {
      sessionStorage.setItem('boxcar_pix_order', JSON.stringify(orderInfo));
      localStorage.setItem('boxcar_last_order', JSON.stringify(orderInfo));
    } catch(e) {}

    if (modal) {
      $('modal-title').textContent = 'Pix gerado com sucesso!';
      $('modal-desc').textContent = 'Carregando página de pagamento...';
    }

    // Redireciona para a nova página do Pix gerado conforme solicitado
    setTimeout(() => {
      window.location.href = `../pix/?id=${encodeURIComponent(transactionId)}&total=${encodeURIComponent(totalAmountCents/100)}`;
    }, 600);

  } catch (err) {
    if (modal) modal.style.display = 'none';
    $('pix-create').disabled = false;
    $('pix-status').textContent = 'Não foi possível gerar o Pix: ' + err.message + '. Confira os dados e tente novamente.';
  }
});
