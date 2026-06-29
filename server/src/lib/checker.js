const https = require('https');
const http = require('http');
const tls = require('tls');

function checkUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;

    const req = mod.get(url, { timeout: 15000 }, (res) => {
      const ms = Date.now() - start;
      let body = '';
      res.on('data', (chunk) => { body += chunk; if (body.length > 1024) req.destroy(); });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, responseMs: ms, isUp: res.statusCode >= 200 && res.statusCode < 400, error: null });
      });
    });

    req.on('error', (err) => {
      const ms = Date.now() - start;
      resolve({ statusCode: null, responseMs: ms, isUp: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      const ms = Date.now() - start;
      resolve({ statusCode: null, responseMs: ms, isUp: false, error: 'Timeout (15s)' });
    });
  });
}

function checkSsl(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) {
        resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: 'No certificate' });
        return;
      }
      const expires = new Date(cert.valid_to);
      const days = Math.floor((expires - new Date()) / (1000 * 60 * 60 * 24));
      resolve({ valid: days > 0, expiresAt: expires.toISOString(), daysRemaining: days, error: null });
    });
    socket.on('error', (err) => {
      resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: err.message });
    });
    socket.setTimeout(10000, () => {
      socket.destroy();
      resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: 'SSL timeout' });
    });
  });
}

module.exports = { checkUrl, checkSsl };
