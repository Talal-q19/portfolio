const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const request = require('supertest');
const { createApp } = require('../src/create-app');
const { createConvexService, ConvexAuthStore } = require('../src/services/convex');
test('Convex adapter does not leak server credentials or infrastructure failures', async () => {
  const call = createConvexService({ convexUrl: 'https://private.example', convexSecret: 'secret' }, async () => { throw Error('secret'); });
  await assert.rejects(call('get'), e => e.status === 503 && !e.message.includes('secret'));
  await assert.rejects(createConvexService({})('health'), e => e.status === 503);
});
test('signed proxy IP is used for shared limiting and spoofed requests are rejected', async () => {
  const secret = 's'.repeat(32); let key;
  const app = createApp({ environment: 'production', proxySecret: secret, rateLimit: 5 }, { sendEmail: async () => {}, store: { limit: async id => { key = id; return false; } } });
  await request(app).post('/api/contact').set('x-forwarded-for', '203.0.113.8').send({}).expect(403);
  const timestamp = String(Date.now()), ip = '203.0.113.9';
  const signature = createHmac('sha256', secret).update(`${timestamp}\n${ip}\nPOST\n/api/contact`).digest('hex');
  await request(app).post('/api/contact').set('x-portfolio-ip', ip).set('x-portfolio-time', timestamp).set('x-portfolio-signature', signature).send({}).expect(429);
  assert.equal(key, `contact:${ip}`);
});
test('adapter hashes state identifiers and uses one atomic refresh operation', async () => {
  let args;
  const store = new ConvexAuthStore(async (operation, body) => { args = { operation, ...body }; return true; });
  await store.rotate('private-session-id', 'old', { proof: 'new' }, 600);
  assert.equal(args.operation, 'rotate'); assert.ok(!args.key.includes('private-session-id'));
});
