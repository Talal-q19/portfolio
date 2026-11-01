const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/env');
const { localAdminIdentity } = require('../src/services/local-admin');
const config = { environment: 'development', localAdminEnabled: true, cmsLocalAdminToken: 'internal-editor-token', rateLimit: 100 };
const req = (headers = {}, address = '127.0.0.1') => ({ socket: { remoteAddress: address }, headers: { host: 'localhost:4000', ...headers } });

test('legacy local mode no longer bypasses browser authentication', async () => {
  const server = createApp(config, { sendEmail: async () => {}, strapi: async (path, options) => {
    assert.equal(path, 'admin/categories?');
    assert.equal(options.token, 'internal-editor-token');
    return { categories: [] };
  } });
  const result = await request(server).get('/api/admin/categories');
  assert.equal(result.status, 401);
  assert.ok(!JSON.stringify(result.body).includes(config.cmsLocalAdminToken));
});
test('local mode does not replace a real session verifier or operate outside development', async () => {
  const server = createApp(config, { sendEmail: async () => {}, verifyAdmin: async () => null });
  assert.equal((await request(server).get('/api/admin/content')).status, 401);
  assert.equal(localAdminIdentity({ ...config, environment: 'production' }, req()), null);
  assert.equal(localAdminIdentity({ ...config, localAdminEnabled: false }, req()), null);
  assert.equal(localAdminIdentity(config, req({}, '10.0.0.1')), null);
  assert.equal(localAdminIdentity(config, req({ host: 'example.com' })), null);
  assert.equal(localAdminIdentity(config, req({ 'x-forwarded-host': 'example.com' })), null);
  assert.equal(localAdminIdentity(config, req({ origin: 'https://example.com' })), null);
  assert.ok(localAdminIdentity(config, req({ origin: 'http://localhost:3000', 'x-forwarded-host': 'localhost:3000' })));
});
test('configuration prevents local editor mode in deployed environments', () => {
  const env = { SMTP_USER: 'test@example.com', SMTP_PASS: 'fixture', LOCAL_ADMIN_ENABLED: 'true', CMS_LOCAL_ADMIN_TOKEN: 'test' };
  assert.equal(loadConfig(env).host, '127.0.0.1');
  assert.throws(() => loadConfig({ ...env, NODE_ENV: 'production' }), /only available in development/);
  assert.throws(() => loadConfig({ ...env, CMS_INTERNAL_URL: 'https://cms.example.com' }), /loopback CMS/);
  assert.throws(() => loadConfig({ ...env, CMS_LOCAL_ADMIN_TOKEN: '' }), /setup:admin/);
});
