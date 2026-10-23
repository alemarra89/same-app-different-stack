const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Local preview of the already exported app; this is a development tool, not an app backend.
const root = path.resolve(__dirname, '../dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png' };
http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403).end(); return;
    }
    fs.readFile(file, (error, content) => {
      if (error) { response.writeHead(404).end('File non trovato'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(content);
    });
  } catch { response.writeHead(400).end(); }
}).listen(4173, '127.0.0.1', () => console.log('Anteprima: http://127.0.0.1:4173'));
