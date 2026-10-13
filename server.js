const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Node-native simulation for processar-pagamento.php
  if (pathname.includes('processar-pagamento.php')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET') {
      const txId = parsedUrl.query.id || 'tx_demo';
      res.writeHead(200);
      return res.end(JSON.stringify({
        status: 'success',
        data: { id: txId, status: 'PENDING' }
      }));
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const txId = 'tx_' + Math.random().toString(36).substring(2, 12);
          const amountCents = payload.amount || 9700;
          const amountStr = (amountCents / 100).toFixed(2);
          const pixCode = `00020126580014br.gov.bcb.pix0136contato@boxcarbrasil.shop520400005303986540${amountStr.length}${amountStr}5802BR5913BOXCAR BRASIL6009SAO PAULO62070503***6304`;
          
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              id: txId,
              status: 'PENDING',
              amount: amountCents,
              pix: {
                qrcode: pixCode,
                copyPasteCode: pixCode
              }
            }
          }));
        } catch(e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Payload invalido' }));
        }
      });
      return;
    }
  }

  // Resolve file paths
  let filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const total = stat.size;

  // Video streaming support
  if (req.headers.range && ext === '.mp4') {
    const range = req.headers.range;
    const parts = range.replace(/bytes=/, '').split('-');
    const partialstart = parts[0];
    const partialend = parts[1];

    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : total - 1;
    const chunksize = (end - start) + 1;

    const file = fs.createReadStream(filePath, { start: start, end: end });
    res.writeHead(206, {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`> Servidor BoxCar rodando com sucesso em http://localhost:${PORT}`);
});
