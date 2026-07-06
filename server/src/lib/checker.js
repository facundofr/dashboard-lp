const https = require('https');
const http = require('http');
const tls = require('tls');

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, error: 'Solo se permiten URLs HTTP/HTTPS' };
    if (!parsed.hostname) return { valid: false, error: 'Hostname inválido' };
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: 'URL malformada' };
  }
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const validation = validateUrl(url);
    if (!validation.valid) {
      return resolve({ statusCode: null, responseMs: 0, isUp: false, error: validation.error });
    }
    const parsed = validation.parsed;
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
    if (!hostname || typeof hostname !== 'string') {
      return resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: 'Hostname inválido' });
    }
    let socket;
    try {
      socket = tls.connect(443, hostname, { servername: hostname, rejectUnauthorized: false }, () => {
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
        resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: `SSL error: ${err.message}` });
      });
      socket.setTimeout(10000, () => {
        socket.destroy();
        resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: 'SSL timeout' });
      });
    } catch (err) {
      if (socket) try { socket.destroy(); } catch {}
      resolve({ valid: false, expiresAt: null, daysRemaining: 0, error: `SSL connection error: ${err.message}` });
    }
  });
}

function scanMetaTags(url) {
  return new Promise((resolve) => {
    const validation = validateUrl(url);
    if (!validation.valid) return resolve({ error: validation.error });
    const parsed = validation.parsed;
    const mod = parsed.protocol === 'https:' ? https : http;
    let body = '';

    const req = mod.get(url, { timeout: 15000 }, (res) => {
      res.on('data', (chunk) => { body += chunk.toString(); });
      res.on('end', () => {
        const tags = {};

        const gtmMatch = body.match(/GTM-[A-Z0-9]+/);
        if (gtmMatch) tags.gtm = gtmMatch[0];

        const gaMatch = body.match(/G-[A-Z0-9]+/);
        if (gaMatch) tags.ga = gaMatch[0];

        const fbMatch = body.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/);
        if (fbMatch) tags.fbPixel = fbMatch[1];

        const gscMatch = body.match(/name=["']google-site-verification["'][^>]+content=["']([^"']+)["']/);
        if (gscMatch) tags.gsc = gscMatch[1];

        const ogTitle = body.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/);
        if (ogTitle) tags.ogTitle = ogTitle[1];

        const description = body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/);
        if (description) tags.description = description[1].substring(0, 200);

        resolve(tags);
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout' }); });
  });
}

module.exports = { checkUrl, checkSsl, scanMetaTags };
