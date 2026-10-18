const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createStrapiService } = require('../src/services/strapi');
const config = { rateLimit: 100, captchaEnabled: false };
const app = dependencies => createApp(config, { sendEmail: async () => {}, ...dependencies });
test('admin denies every route by default before reading request bodies or upstream', async () => {
  const server = app({ strapi: () => { throw new Error('Must not call upstream'); } });
  for (const resource of ['content', 'categories', 'media']) {
    for (const method of ['get', 'post', 'patch', 'delete']) {
      const response = await request(server)[method](`/api/admin/${resource}${['patch','delete'].includes(method) ? '/test' : ''}`).send({ invalid: true });
      assert.equal(response.status, 401);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
  }
});
test('public query allowlist rejects draft/status and arbitrary upstream filters', async () => {
  const server = app({ strapi: async () => ({ categories: [] }) });
  for (const query of ['status=draft', 'populate=*', 'category[x]=hero', 'page=2', 'category=hero&pageSize=101', 'category=hero&page=0', 'category=hero&page=1.5']) {
    assert.equal((await request(server).get(`/api/content?${query}`)).status, 422, query);
  }
  assert.equal((await request(server).get('/api/content?category=hero')).status, 200);
});
test('content shape, merged validation, media checks and explicit publication operations', async () => {
  const calls = [];
  const server = app({ verifyAdmin: async () => ({ role: 'portfolio-admin', accessToken: 'user-token' }), strapi: async (path, options) => {
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
  assert.equal(calls.at(-1).options.token, 'user-token');
});
test('Strapi integration uses read credential, verified write credential and safe failure responses', async () => {
  const calls = [];
  const cms = createStrapiService({ cmsUrl: 'http://cms:1337', cmsReadToken: 'read-only' }, async (...args) => { calls.push(args); return { ok: true, json: async () => ({ categories: [] }) }; });
  await cms('read'); assert.equal(calls[0][1].headers.Authorization, 'Bearer read-only');
  await cms('admin/content', { method: 'POST', token: 'verified-user', body: {} }); assert.equal(calls[1][1].headers.Authorization, 'Bearer verified-user');
  assert.equal(calls[0][1].cache, 'no-store'); assert.ok(calls[0][1].signal);
  const failing = createStrapiService({ cmsReadToken: 'secret' }, async () => { throw new Error('secret infrastructure'); });
  await assert.rejects(failing('read'), e => e.status === 503 && !e.message.includes('secret'));
  assert.equal((await request(app({})).get('/api/content')).status, 503);
});
