module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Consulta status de transação
  if (req.method === 'GET') {
    const txId = req.query.id;
    if (!txId) {
      return res.status(400).json({ error: 'ID da transacao ausente' });
    }
    return res.status(200).json({
      status: 'success',
      data: {
        id: txId,
        status: 'PENDING'
      }
    });
  }

  // POST: Geração de cobrança Pix
  if (req.method === 'POST') {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const amountCents = parseInt(payload.amount, 10) || 9700;
    const amountStr = (amountCents / 100).toFixed(2);
    const txId = 'tx_' + Math.random().toString(36).substring(2, 12);
    const chavePix = process.env.PIX_CHAVE || 'contato@boxcarbrasil.shop';
    const pixCode = `00020126580014br.gov.bcb.pix0136${chavePix}520400005303986540${amountStr.length}${amountStr}5802BR5913BOXCAR BRASIL6009SAO PAULO62070503***6304`;

    const orderData = {
      id: txId,
      status: 'PENDING',
      amount: amountCents,
      currency: 'BRL',
      customer: payload.customer || {},
      shipping: payload.shipping || {},
      items: payload.items || [],
      pix: {
        qrcode: pixCode,
        copyPasteCode: pixCode,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      },
      created_at: new Date().toISOString()
    };

    return res.status(200).json({
      status: 'success',
      data: orderData
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
