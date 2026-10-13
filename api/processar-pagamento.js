/**
 * InvictusPay v1 API Handler for Vercel Serverless
 * Integração oficial da API Seller InvictusPay (v1)
 * 
 * - POST: Cria cobrança Pix em https://api.invictuspayv2.com.br/api/v1/transactions
 * - GET: Consulta status de transação em https://api.invictuspayv2.com.br/api/v1/transactions/{txId}
 */

const INVICTUS_BASE_URL = 'https://api.invictuspayv2.com.br/api/v1';
const INVICTUS_API_KEY = process.env.INVICTUS_API_KEY ||
                         process.env.INVICTUSPAY_API_KEY ||
                         process.env.API_KEY ||
                         'sk_7skw5vs28LZPce0fVobHC9KiWByRcH8SI42KkagQRPgs3gykN20HKR21';

async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Consultar status de pagamento
  if (req.method === 'GET') {
    let txId = '';
    if (req.query && req.query.id) {
      txId = req.query.id;
    } else {
      try {
        const u = new URL(req.url, 'http://localhost');
        txId = u.searchParams.get('id') || '';
      } catch (e) {}
    }

    if (!txId) {
      return res.status(400).json({ success: false, error: 'ID da transação ausente' });
    }

    try {
      const invictusRes = await fetch(`${INVICTUS_BASE_URL}/transactions/${encodeURIComponent(txId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': INVICTUS_API_KEY
        }
      });

      const invictusData = await invictusRes.json();
      return res.status(invictusRes.status).json(invictusData);
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao consultar transação na InvictusPay',
        details: err.message
      });
    }
  }

  // POST: Criar nova cobrança Pix
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      body = body || {};

      const customer = body.customer || {};
      const rawDoc = String(customer.document?.number || customer.document || '').replace(/\D/g, '');
      const rawPhone = String(customer.phone || '').replace(/\D/g, '');
      const name = String(customer.name || '').trim();
      const email = String(customer.email || '').trim();

      const addr = body.shipping?.address || customer.address || {};
      const zipCode = String(addr.zipCode || addr.zip || '').replace(/\D/g, '');
      const state = String(addr.state || addr.uf || '').trim().toUpperCase();

      // Monta items: description + quantity + amount (em centavos)
      const items = [];
      if (Array.isArray(body.items) && body.items.length > 0) {
        body.items.forEach(it => {
          items.push({
            description: String(it.title || it.description || 'Mini Cooler BoxCar').trim().slice(0, 200),
            quantity: Number(it.quantity) || 1,
            amount: Number(it.unitPrice || it.amount) || 14700
          });
        });
      } else {
        items.push({
          description: 'Mini Cooler BoxCar – Cooler dos Apaixonados por Carros & Churrasco',
          quantity: 1,
          amount: 14700
        });
      }

      // Adiciona frete se houver
      const shippingFee = Number(body.shipping?.fee || 0);
      if (shippingFee > 0) {
        items.push({
          description: 'Frete SEDEX dos Correios',
          quantity: 1,
          amount: shippingFee
        });
      }

      // Regra InvictusPay: amount da raiz = soma dos items[].amount
      const totalAmount = items.reduce((acc, it) => acc + (it.amount * it.quantity), 0);

      const customerPayload = {
        name: name || 'Cliente BoxCar',
        email: email || 'contato@boxcarbrasil.shop',
        document: rawDoc || '14924671622',
        phone: rawPhone || '33999236973'
      };

      // Se endereço completo foi preenchido, envia com campos validados da InvictusPay
      if (zipCode.length === 8) {
        customerPayload.address = {
          street: String(addr.street || 'Rua Principal').trim(),
          number: String(addr.number || addr.streetNumber || '100').trim(),
          complement: String(addr.complement || '').trim(),
          neighborhood: String(addr.neighborhood || 'Centro').trim(),
          city: String(addr.city || 'São Paulo').trim(),
          state: state.length === 2 ? state : 'SP',
          zip: zipCode
        };
      }

      const invictusPayload = {
        amount: totalAmount,
        paymentMethod: 'pix',
        customer: customerPayload,
        items: items,
        pix: {
          expirationInSeconds: 1800
        }
      };

      if (body.postbackUrl) {
        invictusPayload.postbackUrl = body.postbackUrl;
      }

      // Chama a API da InvictusPay
      const invictusRes = await fetch(`${INVICTUS_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': INVICTUS_API_KEY
        },
        body: JSON.stringify(invictusPayload)
      });

      const invictusData = await invictusRes.json();

      // Formata resposta garantindo extração imediata pelo frontend
      if (invictusRes.ok && invictusData?.data) {
        const tx = invictusData.data;
        const pix = tx.pix || {};
        const copyPaste = pix.qr_code || pix.copyPasteCode || pix.qrcode || '';

        return res.status(200).json({
          success: true,
          status: tx.status || 'pending',
          id: tx.id,
          data: {
            id: tx.id,
            status: tx.status || 'pending',
            amount: tx.amount,
            pix: {
              qr_code: copyPaste,
              qrcode: copyPaste,
              copyPasteCode: copyPaste
            }
          }
        });
      }

      return res.status(invictusRes.status).json(invictusData);

    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar com InvictusPay',
        details: err.message
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}

module.exports = handler;
module.exports.default = handler;
