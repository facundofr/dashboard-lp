const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('./logger');

async function sendWebhook(config, payload) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (config.secret) {
      const hmac = crypto.createHmac('sha256', config.secret).update(JSON.stringify(payload)).digest('hex');
      headers['X-Webhook-Signature'] = hmac;
    }
    const res = await axios.post(config.url, payload, { headers, timeout: 10000 });
    logger.info({ webhookId: config.id, status: res.status }, 'Webhook enviado');
    return { ok: true, status: res.status };
  } catch (err) {
    logger.error({ webhookId: config.id, err: err.message }, 'Error al enviar webhook');
    return { ok: false, error: err.message };
  }
}

module.exports = { sendWebhook };
