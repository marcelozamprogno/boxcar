module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      message: 'BoxCar Webhook Endpoint is ready and operational.',
      meta_pixel: '1164791589215930',
      gateway: process.env.PIX_GATEWAY || 'UmbrellaPag'
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({ status: 'success', received: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
