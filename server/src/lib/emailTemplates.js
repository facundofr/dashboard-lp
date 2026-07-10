const escapeHtml = require('escape-html');

function baseTemplate(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
          <tr><td style="padding:32px 32px 0;text-align:center">
            <h1 style="margin:0;font-size:20px;color:#1a1a2e">${title}</h1>
          </td></tr>
          <tr><td style="padding:24px 32px;color:#444;font-size:15px;line-height:1.6">
            ${content}
          </td></tr>
          <tr><td style="padding:24px 32px;background:#fafafa;text-align:center;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999">Gestor Landings &mdash; Dashboard de monitoreo</p>
          </td></tr>
        </table>
      </td></tr></table>
    </body>
    </html>
  `
}

function downAlert(userName, landing) {
  const safeName = escapeHtml(userName);
  const safeLandingNombre = escapeHtml(landing.nombre);
  const safeLandingMarca = escapeHtml(landing.marca || '');
  const safeLandingUrl = escapeHtml(landing.url);
  const content = `
    <p>Hola <strong>${safeName}</strong>,</p>
    <p>La landing <strong>${safeLandingNombre}</strong> (${safeLandingMarca}) está reportando como <strong style="color:#dc2626">CAÍDA</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fef2f2;border-radius:8px">
      <tr><td style="padding:12px 16px;font-size:14px">
        <strong>URL:</strong> <a href="${safeLandingUrl}" style="color:#6366f1">${safeLandingUrl}</a><br>
        <strong>Último código:</strong> ${landing.ultimoCodigo || 'N/A'}<br>
        <strong>Tiempo de respuesta:</strong> ${landing.ultimoMs || 'N/A'}ms<br>
        <strong>Último check:</strong> ${landing.ultimoCheck ? new Date(landing.ultimoCheck).toLocaleString('es-AR') : 'N/A'}
      </td></tr>
    </table>
    <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">Ir al Dashboard</a>
  `
  return baseTemplate(`⚠️ ${safeLandingNombre} está CAÍDA`, content)
}

function sslAlert(userName, landing, daysRemaining) {
  const safeName = escapeHtml(userName);
  const safeLandingNombre = escapeHtml(landing.nombre);
  const safeLandingUrl = escapeHtml(landing.url);
  const content = `
    <p>Hola <strong>${safeName}</strong>,</p>
    <p>El certificado SSL de <strong>${safeLandingNombre}</strong> vence en <strong style="color:#f59e0b">${daysRemaining} días</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fffbeb;border-radius:8px">
      <tr><td style="padding:12px 16px;font-size:14px">
        <strong>URL:</strong> <a href="${safeLandingUrl}" style="color:#6366f1">${safeLandingUrl}</a><br>
        <strong>Días restantes:</strong> ${daysRemaining}<br>
        <strong>Vencimiento:</strong> ${landing.ultimoSslVence ? new Date(landing.ultimoSslVence).toLocaleDateString('es-AR') : '—'}
      </td></tr>
    </table>
    <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">Ir al Dashboard</a>
  `
  return baseTemplate(`🔒 SSL próximo a vencer — ${safeLandingNombre}`, content)
}

function passwordReset(userName, resetUrl) {
  const safeName = escapeHtml(userName);
  const content = `
    <p>Hola <strong>${safeName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Hacé clic en el botón para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">Restablecer contraseña</a>
    </p>
    <p style="font-size:13px;color:#888">Si no solicitaste este cambio, ignorá este mensaje.</p>
  `
  return baseTemplate('Recuperación de contraseña', content)
}

module.exports = { downAlert, sslAlert, passwordReset }
