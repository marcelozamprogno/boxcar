/**
 * InvictusPay Webhook Handler for Vercel Serverless
 * Recebe notificações de eventos (ex: EVENT:CHARGE_PAID, EVENT:CHARGE_REFUND)
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Event, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) {}
    }
    payload = payload || {};

    const event = req.headers['x-webhook-event'] || payload.event || 'UNKNOWN';
    const transaction = payload.transaction || {};

    console.log(`[InvictusPay Webhook] Evento: ${event} | Transação: ${transaction.id || 'N/A'} | Status: ${transaction.status || 'N/A'}`);

    // A InvictusPay exige retorno HTTP 2xx para confirmar o recebimento
    return res.status(200).json({ success: true, eventReceived: event });
  } catch (err) {
    console.error('[InvictusPay Webhook] Erro ao processar:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
};
