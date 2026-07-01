const crypto = require('crypto-js');

function getKey() {
  const key = process.env.FTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!key) {
    console.warn('[FTP] No hay clave de cifrado configurada. Las contraseñas FTP se almacenarán en texto plano.');
    return null;
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