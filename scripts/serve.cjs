const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../web');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
http.createServer((req, res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400).end(); return; }
  if (file === root) file = path.join(root, 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'}).end(data); });
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
