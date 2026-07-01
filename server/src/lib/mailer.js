const nodemailer = require('nodemailer');
const { logger } = require('./logger');
const { downAlert, sslAlert, passwordReset } = require('./emailTemplates');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@gestorlandings.com';

  if (!host || !user || !pass) {
    logger.warn('SMTP no configurado. Las notificaciones se loguearán en consola.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.info({ to, subject }, 'Simulación de email');
    return { simulated: true };
  }

  const from = process.env.SMTP_FROM || 'noreply@gestorlandings.com';
  return t.sendMail({ from, to, subject, html });
}

async function sendDownAlert(userEmail, userName, landing) {
  return sendEmail({
    to: userEmail,
    subject: `⚠️ ${landing.nombre} está CAÍDA`,
    html: downAlert(userName, landing),
  });
}

async function sendSslAlert(userEmail, userName, landing, daysRemaining) {
  return sendEmail({
    to: userEmail,
    subject: `🔒 SSL próximo a vencer — ${landing.nombre}`,
    html: sslAlert(userName, landing, daysRemaining),
  });
}

async function sendPasswordReset(userEmail, userName, resetUrl) {
  return sendEmail({
    to: userEmail,
    subject: 'Recuperación de contraseña — Gestor Landings',
    html: passwordReset(userName, resetUrl),
  });
}

module.exports = { sendDownAlert, sendSslAlert, sendPasswordReset };
