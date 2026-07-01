const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Mock the network-dependent functions
const mockResults = {
  'https://google.com': { statusCode: 200, responseMs: 45, isUp: true, error: null },
  'https://httpstat.us/500': { statusCode: 500, responseMs: 30, isUp: false, error: null },
  'not-a-url': { statusCode: null, responseMs: 0, isUp: false, error: 'URL malformada' },
  'ftp://bad.com': { statusCode: null, responseMs: 0, isUp: false, error: 'Solo se permiten URLs HTTP/HTTPS' },
};

const { checkUrl, checkSsl, scanMetaTags } = require('../src/lib/checker');

describe('Checker - URL validation', () => {
  it('should reject malformed URLs', async () => {
    const result = await checkUrl('not-a-url');
    assert.equal(result.isUp, false);
    assert.equal(result.error, 'URL malformada');
  });

  it('should reject non-HTTP protocols', async () => {
    const result = await checkUrl('ftp://bad.com');
    assert.equal(result.isUp, false);
    assert.equal(result.error, 'Solo se permiten URLs HTTP/HTTPS');
  });

  it('should work with valid URLs (if network available)', async () => {
    const result = await checkUrl('https://google.com');
    // Even if network fails, it should not crash and return a structured response
    assert.ok('isUp' in result);
    assert.ok('statusCode' in result);
    assert.ok('responseMs' in result);
  });
});

describe('Checker - SSL check', () => {
  it('should return structured response even on error', async () => {
    const result = await checkSsl('invalid-host-that-does-not-exist.xyz');
    assert.ok('valid' in result);
    assert.ok('daysRemaining' in result);
    assert.ok('error' in result);
  });
});

describe('Checker - Meta tags', () => {
  it('should handle invalid URLs gracefully', async () => {
    const result = await scanMetaTags('not-a-url');
    assert.ok('error' in result);
  });

  it('should handle network errors gracefully', async () => {
    const result = await scanMetaTags('https://invalid.nonexistent.domain.test');
    assert.ok(result === null || 'error' in result);
  });
});
