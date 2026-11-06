import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import contract from '../utils/admin-contract.cjs';
import { AdminApiError, createAdminApi, emptyFields, payloadForWrite, moveItem, fetchAdminMedia } from '../utils/admin-api.mjs';
import { createFixtureApi } from '../utils/admin-fixtures.mjs';

test('browser form contract stays identical to the CMS/API source', async () => {
  assert.equal(await readFile(new URL('../utils/admin-contract.cjs', import.meta.url), 'utf8'), await readFile(new URL('../../server/content-contract/index.js', import.meta.url), 'utf8'));
});
test('all registered templates have usable empty field values', () => {
  for (const t of Object.values(contract.templates)) {
    const values = emptyFields(t.fields);
    for (const [key, spec] of Object.entries(t.fields)) assert.deepEqual(values[key], spec.type === 'list' ? [] : spec.type === 'boolean' ? false : '');
  }
  assert.ok(!Object.values(contract.templates.hero.fields).some(f => f.type === 'media'));
});

test('Hero owns the card designation and location; Site Settings contains global fields', () => {
  assert.equal(contract.templates.hero.fields.designation.type, 'text');
  assert.equal(contract.templates.hero.fields.location.type, 'text');
  for (const key of ['designation', 'location', 'aboutHeading', 'aboutText']) {
    assert.equal(contract.templates['site-settings'].fields[key], undefined);
  }
  assert.ok(contract.components.section.heading);
  assert.ok(contract.components.section.introduction);
});
test('admin requests use same-origin credentials, no cache, and structured validation/session errors', async () => {
  let options;
  const api = createAdminApi(async (url, init) => { assert.equal(url, '/api/admin/content'); options = init; return { ok: false, status: 422, json: async () => ({ message: 'Incomplete', fields: { 'data.heading': 'Required' } }) }; });
  await assert.rejects(api('content', { method: 'POST', body: { category: 'hero', data: {} } }), e => e instanceof AdminApiError && e.fields['data.heading'] === 'Required');
  assert.equal(options.credentials, 'same-origin'); assert.equal(options.cache, 'no-store'); assert.equal(options.method, 'POST');
  const expired = createAdminApi(async () => ({ ok: false, status: 401, json: async () => ({}) }));
  await assert.rejects(expired('content'), e => e.status === 401 && /preserved/.test(e.message));
});
test('multipart upload leaves boundary generation to the browser', async () => {
  const body = new FormData(); body.append('files', new Blob(['fixture'], { type: 'image/png' }), 'fixture.png');
  await createAdminApi(async (url, options) => { assert.equal(options.body, body); assert.equal(options.headers['Content-Type'], undefined); assert.equal(options.headers['X-Admin-Request'], '1'); return { ok: true, json: async () => ({ items: [] }) }; })('media', { method: 'POST', body });
});

test('backend failure counters and block messages are preserved for the login form', async () => {
  const attempts = { kind: 'otp', failed: 5, limit: 5, blocked: true, retryAfterSeconds: 300 };
  const api = createAdminApi(async () => ({ ok: false, status: 429, json: async () => ({ message: 'Account blocked for 5 minutes.', attempts }) }));
  await assert.rejects(api('auth/login/verify', { method: 'POST', body: {} }), error => {
    assert.deepEqual(error.attempts, attempts); assert.equal(error.message, 'Account blocked for 5 minutes.'); return true;
  });
});

test('concurrent expired requests share refresh and retry once with the original payload', async () => {
  let refreshed = false, refreshes = 0;
  const api = createAdminApi(async (url, options) => {
    if (url.endsWith('auth/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 5)); refreshed = true; return { ok: true }; }
    assert.equal(options.headers['X-Admin-Request'], '1');
    if (!refreshed) return { ok: false, status: 401, json: async () => ({}) };
    return { ok: true, json: async () => ({ path: url }) };
  });
  const results = await Promise.all([api('categories'), api('content'), api('media')]);
  assert.equal(refreshes, 1); assert.equal(results.length, 3);
});
test('gallery writes preserve order and alt text while stripping component/media metadata', () => {
  const rows = [{ image: { id: 1, url: '/uploads/a.png' }, alt: 'First', id: 5 }, { image: { id: 2 }, alt: 'Second' }];
  const gallery = moveItem(rows, 1, -1);
  assert.deepEqual(payloadForWrite(contract.templates.projects.fields, { gallery }, contract.components), { gallery: [{ image: 2, alt: 'Second' }, { image: 1, alt: 'First' }] });
  assert.deepEqual(moveItem(rows, 0, -1), rows);
});
test('empty optional typed fields use null so Strapi can clear existing values', () => {
  const result = payloadForWrite(contract.templates.projects.fields, { imageKind: '', demoUrl: '' }, contract.components);
  assert.deepEqual(result, { imageKind: null, demoUrl: '' });
  assert.deepEqual(payloadForWrite(contract.templates.education.fields, { startDate: '', endDate: '', completionYear: '' }, contract.components), { startDate: null, endDate: null, completionYear: null });
});
test('all media pages load when the real API provides total without pageCount', async () => {
  const all = Array.from({ length: 205 }, (_, id) => ({ id }));
  const seen = [];
  const loaded = await fetchAdminMedia(async path => {
    const page = Number(new URLSearchParams(path.split('?')[1]).get('page')); seen.push(page);
    return { items: all.slice((page - 1) * 100, page * 100), pagination: { page, pageSize: 100, total: all.length } };
  });
  assert.deepEqual(seen, [1, 2, 3]); assert.deepEqual(loaded, all);
});
test('experience validation blocks absent end dates, reversed dates, and stale Present end dates', async () => {
  const valid = { title: 'Engineer', company: 'Studio', description: 'Build software', image: 1, startDate: '2024-03', current: false };
  for (const patch of [{}, { endDate: '2023-01' }, { current: true, endDate: '2024-04' }]) await assert.rejects(contract.validatePayload('experience', { ...valid, ...patch }, { media: () => ({ mime: 'image/png' }) }), e => Boolean(e.fields['data.endDate']));
  await contract.validatePayload('experience', { ...valid, current: true }, { media: () => ({ mime: 'image/png' }) });
});
test('fixture saves cannot bypass required fields, singleton cardinality or published snapshots', async () => {
  const api = createFixtureApi();
  await assert.rejects(api('content', { method: 'POST', body: { category: 'hero', data: { heading: 'Duplicate', paragraph: 'Text' } } }), e => Boolean(e.fields.category));
  await assert.rejects(api('content/hero1', { method: 'PATCH', body: { operation: 'update', data: { heading: '   ' } } }), e => Boolean(e.fields['data.heading']));
  await api('content/hero1', { method: 'PATCH', body: { operation: 'update', data: { heading: 'New draft' } } });
  let publicHero = (await api('content?status=published')).categories.find(c => c.slug === 'hero').items[0];
  assert.notEqual(publicHero.data.heading, 'New draft');
  await api('content/hero1', { method: 'PATCH', body: { operation: 'publish' } });
  publicHero = (await api('content?status=published')).categories.find(c => c.slug === 'hero').items[0];
  assert.equal(publicHero.data.heading, 'New draft');
  await api('content/hero1', { method: 'PATCH', body: { operation: 'unpublish' } });
  assert.equal((await api('content?status=published')).categories.find(c => c.slug === 'hero').items.length, 0);
});
test('fixture category and referenced-media safeguards match editor expectations', async () => {
  const api = createFixtureApi();
  await assert.rejects(api('media/1', { method: 'DELETE' }), e => Boolean(e.fields.media));
  await assert.rejects(api('categories/category0', { method: 'DELETE' }), e => Boolean(e.fields.category));
  await assert.rejects(api('categories/category0', { method: 'PATCH', body: { templateKey: 'projects', cardinality: 'multiple' } }), e => Boolean(e.fields.templateKey));
  await api('categories', { method: 'POST', body: { name: 'Writing', slug: 'writing', templateKey: 'projects', cardinality: 'multiple' } });
  assert.ok((await api('categories')).categories.some(c => c.slug === 'writing'));
});
