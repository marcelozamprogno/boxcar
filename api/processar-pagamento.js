/**
 * InvictusPay v1 API Handler for Vercel Serverless
 * Documentação Seller API (v1) InvictusPay
 * 
 * Suporta:
 * - POST: Cria cobrança Pix em https://api.invictuspayv2.com.br/api/v1/transactions
 * - GET: Consulta status de transação em https://api.invictuspayv2.com.br/api/v1/transactions/{txId}
 */

const INVICTUS_BASE_URL = 'https://api.invictuspayv2.com.br/api/v1';

async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.INVICTUS_API_KEY ||
                 process.env.INVICTUSPAY_API_KEY ||
                 process.env.API_KEY ||
                 process.env.PIX_API_KEY ||
                 '';

  // GET: Consultar status da transação
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

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        status: 'pending',
        data: { id: txId, status: 'pending' },
        warning: 'INVICTUS_API_KEY não configurada nas variáveis de ambiente da Vercel.'
      });
    }

    try {
      const invictusRes = await fetch(`${INVICTUS_BASE_URL}/transactions/${encodeURIComponent(txId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': apiKey
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

  // POST: Criar transação Pix
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

      // Regra da InvictusPay: amount da raiz = soma dos items[].amount
      const totalAmount = items.reduce((acc, it) => acc + (it.amount * it.quantity), 0);

      const invictusPayload = {
        amount: totalAmount,
        paymentMethod: 'pix',
        customer: {
          name: name || 'Cliente BoxCar',
          email: email || 'contato@boxcarbrasil.shop',
          document: rawDoc || '00000000000',
          phone: rawPhone || '11999999999',
          address: {
            street: String(addr.street || 'Rua Principal').trim(),
            streetNumber: String(addr.streetNumber || addr.number || '100').trim(),
            complement: String(addr.complement || '').trim(),
            neighborhood: String(addr.neighborhood || 'Centro').trim(),
            city: String(addr.city || 'São Paulo').trim(),
            state: state.length === 2 ? state : 'SP',
            zipCode: zipCode.length === 8 ? zipCode : '01001000'
          }
        },
        items: items,
        pix: {
          expirationInSeconds: 1800
        }
      };

      if (body.postbackUrl) {
        invictusPayload.postbackUrl = body.postbackUrl;
      }

      // Se não houver chave da InvictusPay cadastrada ainda, retorna payload demonstrativo seguro
      if (!apiKey) {
        const txId = 'inv_' + Math.random().toString(36).substring(2, 14);
        const amountStr = (totalAmount / 100).toFixed(2);
        const demoPix = `00020126580014br.gov.bcb.pix0136contato@boxcarbrasil.shop520400005303986540${amountStr.length}${amountStr}5802BR5913BOXCAR BRASIL6009SAO PAULO62070503***6304`;

        return res.status(200).json({
          success: true,
          status: 'pending',
          id: txId,
          data: {
            id: txId,
            status: 'pending',
            amount: totalAmount,
            pix: {
              qrcode: demoPix,
              copyPasteCode: demoPix
            }
          },
          warning: 'Chave InvictusPay (INVICTUS_API_KEY) ainda não configurada na Vercel.'
        });
      }

      // Envia requisição para a API oficial da InvictusPay
      const invictusRes = await fetch(`${INVICTUS_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify(invictusPayload)
      });

      const invictusData = await invictusRes.json();
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
