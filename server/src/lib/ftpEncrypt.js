const crypto = require('crypto-js');
const { logger } = require('./logger');

function getKey() {
  const key = process.env.FTP_ENCRYPTION_KEY;
  if (!key) {
    logger.warn('[FTP] FTP_ENCRYPTION_KEY no configurada. Las contraseñas FTP se almacenarán en texto plano.');
    return null;
  }
  if (key === process.env.JWT_SECRET) {
    logger.warn('[FTP] FTP_ENCRYPTION_KEY no debe ser igual a JWT_SECRET. Usá una clave diferente.');
  }
  return key;
}

function encrypt(text) {
  if (!text) return null;
  const key = getKey();
  if (!key) return text;
  return crypto.AES.encrypt(text, key).toString();
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;
  const key = getKey();
  if (!key) return encryptedText;
  const bytes = crypto.AES.decrypt(encryptedText, key);
  return bytes.toString(crypto.enc.Utf8);
}

module.exports = { encrypt, decrypt };