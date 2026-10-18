const { test } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../src/api/portfolio/controllers/portfolio');
test('unpaged public reads cross the 100-entry CMS batch boundary without dropping content', async () => {
  const category = { documentId: 'category', slug: 'experience', templateKey: 'experience', visible: true, displayOrder: 0, cardinality: 'multiple', name: 'Experience' };
  const entries = Array.from({ length: 205 }, (_, i) => ({ documentId: `entry${i}`, category, payload: [{ title: `Role ${i}`, company: 'Company', description: 'Text' }], displayOrder: i, publishedAt: '2026-10-18T00:00:00Z' }));
  const batches = [];
  const strapi = { config: { get: () => 'http://localhost:1337' }, components: {}, contentTypes: { 'api::content.content': { attributes: { payload: { components: [] } } } }, documents: uid => uid === 'api::category.category' ? { findMany: async () => [category], findFirst: async () => category } : {
    count: async params => { assert.equal(params.status, 'published'); return entries.length; },
    findMany: async params => { assert.equal(params.status, 'published'); batches.push(params.start); return entries.slice(params.start, params.start + params.limit); },
  } };
  const handlers = controller({ strapi });
  const ctx = { query: {}, set: () => {} };
  await handlers.read(ctx);
  assert.equal(ctx.body.categories[0].items.length, 205);
  assert.deepEqual(batches, [0, 100, 200]);
  assert.equal(ctx.body.categories[0].pagination.total, 205);
  batches.length = 0;
  const page = { query: { category: 'experience', page: '3', pageSize: '100' }, set: () => {} };
  await handlers.read(page);
  assert.equal(page.body.categories[0].items.length, 5);
  assert.equal(page.body.categories[0].pagination.pageCount, 3);
  assert.deepEqual(batches, [200]);
});
