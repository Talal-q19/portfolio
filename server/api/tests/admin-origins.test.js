const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config/env');
const { guardAdminRequest } = require('../src/controllers/admin-auth');
const { validateAdminOrigins } = require('../src/services/auth-runtime');

test('production and localhost are accepted only when explicitly allowed', () => {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_ORIGINS: 'https://portfolio.example, http://localhost:3000' });
  validateAdminOrigins(config);
  const request = origin => ({ method: 'POST', headers: { origin }, get: () => '1' });
  for (const origin of config.auth.origins) assert.doesNotThrow(() => guardAdminRequest(config, request(origin)));
  for (const origin of ['https://evil.example', 'http://localhost:3001', 'https://portfolio.example.evil.example', 'null']) {
    assert.throws(() => guardAdminRequest(config, request(origin)), /Invalid request origin/);
  }
  assert.throws(() => guardAdminRequest(config, { ...request(config.auth.origins[0]), get: () => undefined }), /Invalid admin request/);
});

test('single-origin configuration remains compatible', () => {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_ORIGIN: 'https://portfolio.example' });
  assert.deepEqual(config.auth.origins, ['https://portfolio.example']);
  validateAdminOrigins(config);
  assert.throws(() => guardAdminRequest(config, { method: 'POST', headers: { origin: 'http://localhost:3000' }, get: () => '1' }), /Invalid request origin/);
});

test('invalid allowlist entries fail validation before backend initialization', () => {
  for (const entry of ['*', 'null', 'https://portfolio.example/', 'https://portfolio.example/path', 'http://public.example', 'http://localhost.evil.example:3000', 'ftp://localhost', 'https://user:pass@portfolio.example', 'https://portfolio.example,']) {
    assert.throws(() => validateAdminOrigins(loadConfig({ NODE_ENV: 'production', ADMIN_ORIGINS: entry })), /ADMIN_ORIGINS/);
  }
  for (const entry of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
    assert.doesNotThrow(() => validateAdminOrigins(loadConfig({ NODE_ENV: 'production', ADMIN_ORIGINS: entry })));
  }
});
