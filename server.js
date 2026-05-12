/**
 * server.js — SwiftBridge static file server
 * Serves the Vite dist/ folder with correct SPA routing,
 * MIME types and cache headers for PWA.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html':        'text/html; charset=utf-8',
  '.js':          'text/javascript; charset=utf-8',
  '.css':         'text/css; charset=utf-8',
  '.json':        'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png':         'image/png',
  '.svg':         'image/svg+xml',
  '.ico':         'image/x-icon',
  '.woff2':       'font/woff2',
  '.woff':        'font/woff',
  '.ttf':         'font/ttf',
  '.txt':         'text/plain',
};

const server = http.createServer((req, res) => {
  // Strip query string
  let urlPath = req.url.split('?')[0];

  // Security: prevent path traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST, safePath);

  // SPA fallback: bestanden die niet bestaan → index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache headers
  const isAsset    = urlPath.startsWith('/assets/');
  const isSW       = urlPath === '/sw.js' || urlPath === '/workbox-' + urlPath.slice(9);
  const isManifest = urlPath === '/manifest.webmanifest';

  res.setHeader('Content-Type', contentType);

  if (isSW || urlPath === '/registerSW.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
  } else if (isAsset) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (isManifest) {
    res.setHeader('Cache-Control', 'public, max-age=0');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SwiftBridge draait op poort ${PORT}`);
});
