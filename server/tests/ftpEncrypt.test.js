const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Set a test encryption key
process.env.FTP_ENCRYPTION_KEY = 'test-key-for-unit-tests-12345';

const { encrypt, decrypt } = require('../src/lib/ftpEncrypt');

describe('FTP Encryption', () => {
  it('should encrypt and decrypt a password', () => {
    const original = 'MySecretPass123!';
    const encrypted = encrypt(original);
    assert.notEqual(encrypted, original);
    assert.ok(typeof encrypted === 'string');

    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, original);
  });

  it('should return null for null input', () => {
    assert.equal(encrypt(null), null);
    assert.equal(decrypt(null), null);
  });

  it('should return empty string for empty input', () => {
    assert.equal(encrypt(''), null);
  });

  it('should produce different ciphertexts for same input', () => {
    const a = encrypt('hello');
    const b = encrypt('hello');
    assert.notEqual(a, b);
  });
});
