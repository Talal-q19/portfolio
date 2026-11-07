import { test, expect, afterEach, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import schema from '../convex/schema.js';
const modules = import.meta.glob('../convex/**/*.js');
// The functions use generic builders and do not depend on generated bindings.
modules['../convex/_generated/server.js'] ??= async () => ({});
const ref = makeFunctionReference('bridge:execute');
const setup = () => { const t = convexTest(schema, modules); return { t, call: (operation, args = {}) => t.mutation(ref, { operation, args }) }; };
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
test('OTP consumption is atomic and expires without cleanup', async () => {
  vi.useFakeTimers(); const { call } = setup();
  await call('put', { key: 'otp', value: { proof: 'p', id: 'a', purpose: 'login' }, seconds: 300 });
  const a = { key: 'otp', attemptKey: 'attempt', proof: 'p', accountId: 'a', purpose: 'login' };
  const results = await Promise.all([call('verifyOtp', a), call('verifyOtp', a)]);
  expect(results.filter(r => r.data)).toHaveLength(1);
  await call('put', { key: 'expired', value: { proof: 'p' }, seconds: 300 });
  vi.advanceTimersByTime(300001);
  expect(await call('get', { key: 'expired' })).toBeNull();
  expect(await call('consume', { key: 'expired', proof: 'p' })).toBeNull();
});
test('five failures start the full lock period and retries do not extend it', async () => {
  vi.useFakeTimers(); const { call } = setup();
  for (let i = 1; i <= 5; i++) {
    const result = await call('attempts', { key: 'password', kind: 'password', action: 'fail' });
    expect(result.failed).toBe(i); vi.advanceTimersByTime(1000);
  }
  const state = await call('attempts', { key: 'password', kind: 'password', action: 'clear' });
  expect(state.blocked).toBe(true); expect(state.retryAfterSeconds).toBe(86399);
  vi.advanceTimersByTime(86400000);
  expect((await call('attempts', { key: 'password', kind: 'password' })).failed).toBe(0);
});
test('refresh replay revokes the replacement even with concurrent rotations', async () => {
  const { call } = setup(); const value = { id: 'a', version: 0, proof: 'old' };
  await call('put', { key: 'session', value, seconds: 600 });
  const results = await Promise.all(['one', 'two'].map(proof => call('rotate', { key: 'session', proof: 'old', value: { ...value, proof }, seconds: 600 })));
  expect(results.sort()).toEqual([false, true]);
  expect(await call('get', { key: 'session' })).toBeNull();
});
test('reset version check prevents reuse and account blocking invalidates old versions', async () => {
  const { call } = setup();
  await call('adminCreate', { id: 'a', username: 'owner', email: 'owner@example.com', password_hash: 'hash' });
  expect(await call('adminReset', { id: 'a', version: 0, hash: 'new' })).toEqual({ id: 'a' });
  expect(await call('adminReset', { id: 'a', version: 0, hash: 'other' })).toBeNull();
  await call('adminBlock', { username: 'owner', blocked: true });
  expect(await call('adminReset', { id: 'a', version: 2, hash: 'other' })).toBeNull();
});
test('rate limits are shared, bounded and expire on reads', async () => {
  vi.useFakeTimers(); const { call } = setup();
  expect(await Promise.all(Array.from({ length: 6 }, () => call('limit', { key: 'ip', max: 5, seconds: 900 })))).toEqual([true, true, true, true, true, false]);
  vi.advanceTimersByTime(900001);
  expect(await call('limit', { key: 'ip', max: 5, seconds: 900 })).toBe(true);
});
test('content drafts never leak, singleton guards and migration retries preserve edits', async () => {
  const { call } = setup();
  const content = (path, method = 'GET', body = null, query = {}) => call('content', { path, method, body, query });
  const category = { documentId: 'hero', name: 'Hero', slug: 'hero', templateKey: 'hero', cardinality: 'singleton', displayOrder: 0, visible: true };
  await call('migrationRecord', { table: 'categories', data: category });
  expect(await call('migrationRecord', { table: 'categories', data: category })).toEqual({ skipped: true });
  const { item } = await content('admin/content', 'POST', { category: 'hero', data: { heading: 'Original', paragraph: 'Hello' } });
  await expect(content('admin/content', 'POST', { category: 'hero', data: { heading: 'Duplicate', paragraph: 'Hello' } })).rejects.toThrow();
  await content(`admin/content/${item.documentId}`, 'PATCH', { operation: 'publish' });
  await content(`admin/content/${item.documentId}`, 'PATCH', { operation: 'update', data: { heading: 'Private' } });
  expect((await content('read')).categories[0].items[0].data.heading).toBe('Original');
  expect((await content(`admin/content/${item.documentId}`)).item.data.heading).toBe('Private');
  await expect(content('admin/categories/hero', 'DELETE')).rejects.toThrow();
  await expect(call('migrationRecord', { table: 'categories', data: { ...category, name: 'Overwrite' } })).rejects.toThrow();
});
test('bridge requires server authentication and migration enablement', async () => {
  const { t } = setup(); vi.stubEnv('CONVEX_SERVICE_SECRET', 's'.repeat(32));
  const request = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'health', args: {} }) };
  expect((await t.fetch('/bridge', request)).status).toBe(401);
  request.headers.Authorization = `Bearer ${'s'.repeat(32)}`;
  expect((await t.fetch('/bridge', request)).status).toBe(200);
  request.body = JSON.stringify({ operation: 'migrationRead', args: { table: 'admins' } });
  expect((await t.fetch('/bridge', request)).status).toBe(403);
});

test('legacy hero fields resolve from matching snapshots and remain editable after settings saves', async () => {
  const { t, call } = setup();
  const content = (path, method = 'GET', body = null, query = {}) => call('content', { path, method, body, query });
  for (const key of ['hero', 'site-settings', 'experience']) {
    await content('admin/categories', 'POST', { slug: key, name: key, templateKey: key, cardinality: key === 'experience' ? 'multiple' : 'singleton' });
  }
  const seed = async (documentId, category, data, draftData = data) => {
    await t.run(ctx => ctx.db.insert('content', { documentId, category, draft: { data: draftData, displayOrder: 0 }, published: { data, displayOrder: 0, publishedAt: '2026-11-01T00:00:00.000Z' } }));
  };
  await seed('settings', 'site-settings', { displayName: 'Talal', contactEmail: 'test@example.com', seoTitle: 'Portfolio', seoDescription: 'Work', location: 'Dubai', designation: 'Software Engineer', aboutHeading: 'About', aboutText: 'Legacy biography' });
  await seed('job', 'experience', { title: 'Backend Engineer', company: 'EUNX', current: true, startDate: '2025-01' }, { title: 'Private title', company: 'Private company', current: true, startDate: '2025-01' });
  await seed('hero', 'hero', { heading: 'Hello', paragraph: 'Welcome' });
  const hero = result => result.categories.find(c => c.slug === 'hero').items[0].data;
  expect(hero(await content('read', 'GET', null, { category: 'hero' }))).toMatchObject({ designation: 'Backend Engineer at EUNX', location: 'Dubai' });
  expect((await content('admin/content/hero')).item.data.designation).toBe('Private title at Private company');
  const settings = (await content('admin/content/settings')).item.data;
  for (const key of ['designation', 'location', 'aboutHeading', 'aboutText']) expect(settings).not.toHaveProperty(key);
  // A real image is needed to validate saving the existing legacy settings.
  const storageId = await t.run(ctx => ctx.storage.store(new Blob(['image'], { type: 'image/png' })));
  await t.run(ctx => ctx.db.insert('media', { id: 1, storageId, name: 'portrait.png', alternativeText: '', mime: 'image/png', size: 1 }));
  await content('admin/content/settings', 'PATCH', { operation: 'update', data: { profileImage: 1 } });
  await content('admin/content/settings', 'PATCH', { operation: 'publish' });
  expect(hero(await content('read')).location).toBe('Dubai');
  await content('admin/content/hero', 'PATCH', { operation: 'update', data: { designation: 'New designation', location: 'Abu Dhabi' } });
  expect(hero(await content('read')).designation).toBe('Backend Engineer at EUNX');
  await content('admin/content/hero', 'PATCH', { operation: 'publish' });
  expect(hero(await content('read'))).toMatchObject({ designation: 'New designation', location: 'Abu Dhabi' });
  await content('admin/content/hero', 'PATCH', { operation: 'update', data: { designation: '' } });
  await content('admin/content/hero', 'PATCH', { operation: 'publish' });
  expect(hero(await content('read')).designation).toBe('');
  await expect(content('admin/content/hero', 'PATCH', { operation: 'update', data: { designation: 'x'.repeat(501) } })).rejects.toThrow();
});
test('Hero inherits the matching legacy CV and can replace or remove it without leaking drafts', async () => {
  const { t, call } = setup();
  const content = (path, method = 'GET', body = null, query = {}) => call('content', { path, method, body, query });
  for (const templateKey of ['hero', 'site-settings']) {
    await content('admin/categories', 'POST', { slug: templateKey, name: templateKey, templateKey, cardinality: 'singleton' });
  }
  for (const id of [1, 2]) {
    const storageId = await t.run(ctx => ctx.storage.store(new Blob(['pdf'], { type: 'application/pdf' })));
    await t.run(ctx => ctx.db.insert('media', { id, storageId, name: `cv-${id}.pdf`, alternativeText: '', mime: 'application/pdf', size: 1 }));
  }
  await t.run(async ctx => {
    await ctx.db.insert('content', { documentId: 'settings', category: 'site-settings', draft: { data: { cv: 2 }, displayOrder: 0 }, published: { data: { cv: 1 }, displayOrder: 0, publishedAt: '2026-11-01' } });
    await ctx.db.insert('content', { documentId: 'hero', category: 'hero', draft: { data: { heading: 'Hello', paragraph: 'Welcome' }, displayOrder: 0 }, published: { data: { heading: 'Hello', paragraph: 'Welcome' }, displayOrder: 0, publishedAt: '2026-11-01' } });
  });
  const publicHero = async () => (await content('read', 'GET', null, { category: 'hero' })).categories[0].items[0].data;
  expect((await publicHero()).cv.id).toBe(1);
  expect((await content('admin/content/hero')).item.data.cv.id).toBe(2);
  await content('admin/content/hero', 'PATCH', { operation: 'update', data: { cv: 2 } });
  expect((await publicHero()).cv.id).toBe(1);
  await content('admin/content/hero', 'PATCH', { operation: 'publish' });
  expect((await publicHero()).cv.id).toBe(2);
  await expect(content('admin/media/2', 'DELETE')).rejects.toThrow();
  await content('admin/content/hero', 'PATCH', { operation: 'update', data: { cv: null } });
  await content('admin/content/hero', 'PATCH', { operation: 'publish' });
  expect((await publicHero()).cv).toBeNull();
});

test('direct upload verifies bytes, preserves the 8 MiB limit and protects referenced assets', async () => {
  const { t, call } = setup();
  const content = (path, method = 'GET', body = null) => call('content', { path, method, query: {}, body });
  const bytes = new Uint8Array(8 * 1024 * 1024); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const ticket = await content('admin/media/upload-ticket', 'POST', { name: 'large.png', size: bytes.length, mime: 'image/png' });
  const storageId = await t.run(ctx => ctx.storage.store(new Blob([bytes], { type: 'image/png' })));
  const args = { path: 'admin/media/complete-upload', method: 'POST', query: {}, body: { token: ticket.token, storageId } };
  const result = await t.action(makeFunctionReference('uploads:complete'), args);
  expect(result.items[0].size).toBe(8192);
  expect((await t.action(makeFunctionReference('uploads:complete'), args)).items[0].id).toBe(result.items[0].id);
  await expect(content('admin/media/upload-ticket', 'POST', { name: 'large.png', size: bytes.length + 1, mime: 'image/png' })).rejects.toThrow();
  await call('migrationRecord', { table: 'categories', data: { documentId: 'education', name: 'Education', slug: 'education', templateKey: 'education', cardinality: 'multiple', displayOrder: 0, visible: true } });
  await content('admin/content', 'POST', { category: 'education', data: { qualification: 'Degree', institution: 'University', credential: 'BSc', completionYear: 2020, image: result.items[0].id } });
  await expect(content(`admin/media/${result.items[0].id}`, 'DELETE')).rejects.toThrow();
  const badTicket = await content('admin/media/upload-ticket', 'POST', { name: 'spoof.png', size: 5, mime: 'image/png' });
  const badId = await t.run(ctx => ctx.storage.store(new Blob(['bogus'], { type: 'image/png' })));
  await expect(t.action(makeFunctionReference('uploads:complete'), { ...args, body: { token: badTicket.token, storageId: badId } })).rejects.toThrow();
});
test('content pagination, duplicate slugs and published group reference safeguards', async () => {
  const { call } = setup();
  const content = (path, method = 'GET', body = null, query = {}) => call('content', { path, method, body, query });
  for (const [slug, name] of [['skill-groups', 'Skill Groups'], ['skills', 'Skills']]) await content('admin/categories', 'POST', { slug, name, templateKey: slug, cardinality: 'multiple' });
  const group = (await content('admin/content', 'POST', { category: 'skill-groups', data: { name: 'Backend', eyebrow: 'Services', description: 'Systems' } })).item;
  await content(`admin/content/${group.documentId}`, 'PATCH', { operation: 'publish' });
  await expect(content('admin/categories', 'POST', { slug: 'skills', name: 'Duplicate', templateKey: 'skills', cardinality: 'multiple' })).rejects.toThrow();
  const data = { documentId: 'skill', category: 'skills', draft: { displayOrder: 0, data: { name: 'Node', skillGroup: group.documentId } }, published: null };
  // Persisted reference safeguard is exercised independently of media validation.
  await call('migrationRecord', { table: 'content', data: { ...data, published: { ...data.draft, publishedAt: new Date().toISOString() } } });
  await expect(content(`admin/content/${group.documentId}`, 'DELETE')).rejects.toThrow();
  await expect(content(`admin/content/${group.documentId}`, 'PATCH', { operation: 'unpublish' })).rejects.toThrow();
  const page = await content('admin/content', 'GET', null, { category: 'skill-groups', page: '1', pageSize: '1' });
  expect(page.categories[0].pagination.total).toBe(1);
});
