const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const config = { rateLimit: 100, captchaEnabled: false };
const app = dependencies => createApp(config, { sendEmail: async () => {}, ...dependencies });
test('admin denies every route by default before reading request bodies or upstream', async () => {
  const server = app({ content: () => { throw new Error('Must not call upstream'); } });
  for (const resource of ['content', 'categories', 'media']) {
    for (const method of ['get', 'post', 'patch', 'delete']) {
      const response = await request(server)[method](`/api/admin/${resource}${['patch','delete'].includes(method) ? '/test' : ''}`).send({ invalid: true });
      assert.equal(response.status, 401);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
  }
});
test('public query allowlist rejects draft/status and arbitrary upstream filters', async () => {
  const server = app({ content: async () => ({ categories: [] }) });
  for (const query of ['status=draft', 'populate=*', 'category[x]=hero', 'page=2', 'category=hero&pageSize=101', 'category=hero&page=0', 'category=hero&page=1.5']) {
    assert.equal((await request(server).get(`/api/content?${query}`)).status, 422, query);
  }
  assert.equal((await request(server).get('/api/content?category=hero')).status, 200);
});
test('content shape, merged validation, media checks and explicit publication operations', async () => {
  const calls = [];
  const server = app({ verifyAdmin: async () => ({ role: 'portfolio-admin', accessToken: 'user-token' }), content: async (path, options) => {
    calls.push({ path, options });
    if (path === 'admin/categories') return { categories: [{ slug: 'hero', templateKey: 'hero' }, { slug: 'experience', templateKey: 'experience' }] };
    if (path === 'admin/content/abc' && options.method === undefined) return { item: { category: 'hero', data: { heading: 'Heading', paragraph: 'Paragraph' } } };
    if (path.startsWith('admin/media/')) return { item: null };
    return { success: true };
  } });
  for (const body of [{ data: {} }, { category: 'hero', data: { heading: ' ', paragraph: 'Text' } }, { category: 'hero', data: { heading: 'A', paragraph: 'B', image: 1 } }, { category: 'experience', data: { title: 'Engineer' } }]) {
    const response = await request(server).post('/api/admin/content').send(body);
    assert.equal(response.status, 422); assert.ok(response.body.fields);
  }
  for (const body of [{ operation: 'update', data: { paragraph: '' } }, { operation: 'publish', data: {} }, { operation: 'delete' }, { status: 'published' }]) assert.equal((await request(server).patch('/api/admin/content/abc').send(body)).status, 422);
  assert.equal((await request(server).patch('/api/admin/content/abc').send({ operation: 'update', data: { heading: 'New' } })).status, 200);
  assert.equal((await request(server).patch('/api/admin/content/abc').send({ operation: 'publish' })).status, 200);
  assert.equal(calls.at(-1).options.token, undefined);
});
