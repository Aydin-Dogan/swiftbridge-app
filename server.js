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

// ── Premium marketing-landing (Cowork-concept) ─────────────────────────────
// Statische HTML-pagina's die de React-app NIET via de SPA-router afhandelt.
// De React-app (inloggen, dashboard, betaalflow) draait op alle overige routes
// via de SPA-fallback hieronder. CTA's in de landing wijzen naar /login etc.
const LANDING_ROUTES = {
  '/':            'landing/particulier.html',
  '/particulier': 'landing/particulier.html',
  '/zakelijk':    'landing/zakelijk.html',
};

const server = http.createServer((req, res) => {
  // Strip query string
  let urlPath = req.url.split('?')[0];
  // Normaliseer trailing slash (bv. /zakelijk/ → /zakelijk)
  const routeKey = urlPath !== '/' ? urlPath.replace(/\/+$/, '') : urlPath;

  // Security: prevent path traversal — decode, normaliseer en verifieer dat het
  // uiteindelijke pad BINNEN DIST blijft (robuuster dan een regex op '../').
  let decodedPath;
  try { decodedPath = decodeURIComponent(urlPath); }
  catch { decodedPath = urlPath; } // malformed %-escape → val terug op raw
  let filePath = path.join(DIST, path.normalize(decodedPath));
  let isLandingHtml = false;

  // Premium landing-routes → serveer de marketing-HTML.
  if (LANDING_ROUTES[routeKey]) {
    filePath = path.join(DIST, LANDING_ROUTES[routeKey]);
    isLandingHtml = fs.existsSync(filePath);
    if (!isLandingHtml) filePath = path.join(DIST, 'index.html');
  } else {
    // Hard containment-check: nooit een bestand buiten DIST serveren.
    const resolved = path.resolve(filePath);
    if (resolved !== DIST && !resolved.startsWith(DIST + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    // SPA fallback: bestanden die niet bestaan → index.html (React-app)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html');
    }
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

  // ── Security headers (alle responses) ──────────────────────────────────────
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');

  // CSP alleen op de zelf-bevattende premium landing-HTML. De SPA (index.html)
  // heeft een eigen <meta>-CSP; daar geen header bovenop om conflicten te mijden.
  if (isLandingHtml) {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' https://api.swiftbridge.tr https://*.up.railway.app",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
  }

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
