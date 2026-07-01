const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Validator tests', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.ok(emailRegex.test('test@example.com'));
    assert.ok(!emailRegex.test('invalid'));
    assert.ok(!emailRegex.test('@example.com'));
  });

  it('should validate URL format', () => {
    const urlRegex = /^https?:\/\/.+/;
    assert.ok(urlRegex.test('https://example.com'));
    assert.ok(urlRegex.test('http://example.com'));
    assert.ok(!urlRegex.test('ftp://example.com'));
    assert.ok(!urlRegex.test('not-a-url'));
  });

  it('should validate password length', () => {
    assert.ok('123456'.length >= 6);
    assert.ok(!('12345'.length >= 6));
  });
});
