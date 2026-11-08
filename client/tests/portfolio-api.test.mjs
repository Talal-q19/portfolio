import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portfolioData } from '../utils/portfolio.js';
import { fetchPortfolio } from '../utils/portfolio-api.mjs';

test('browser loads published content from the same-origin Express route', async () => {
  let request;
  const envelope = { categories: [{ slug: 'hero', items: [] }] };
  const result = await fetchPortfolio({ fetchImpl: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => envelope };
  } });
  assert.deepEqual(result, envelope);
  assert.equal(request.url, '/api/content');
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.credentials, 'same-origin');
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.equal(request.options.headers, undefined);
});

test('HTTP failures and malformed responses show a retryable content error', async () => {
  for (const response of [{ ok: false, json: async () => ({ secret: 'upstream' }) }, { ok: true, json: async () => ({}) }]) {
    await assert.rejects(fetchPortfolio({ fetchImpl: async () => response }), /Portfolio content is temporarily unavailable/);
  }
});

test('unmount cancellation aborts the request and an aborted request does not start', async () => {
  const controller = new AbortController();
  let requestSignal;
  await fetchPortfolio({ signal: controller.signal, fetchImpl: async (url, options) => {
    requestSignal = options.signal;
    return { ok: true, json: async () => ({ categories: [] }) };
  } });
  controller.abort();
  assert.equal(requestSignal.aborted, true);
  await assert.rejects(fetchPortfolio({ signal: controller.signal, fetchImpl: () => { throw new Error('Must not fetch'); } }), error => error.name === 'AbortError');
});


test('the public CV uses Hero, falls back for unmigrated content, and respects explicit removal', () => {
  const envelope = { categories: [
    { templateKey: 'hero', items: [{ data: {} }] },
    { templateKey: 'site-settings', items: [{ data: { cv: { url: '/legacy.pdf' } } }] },
  ] };
  assert.equal(portfolioData(envelope).personalData.resume, '/legacy.pdf');
  envelope.categories[0].items[0].data.cv = { url: '/new.pdf' };
  assert.equal(portfolioData(envelope).personalData.resume, '/new.pdf');
  envelope.categories[0].items[0].data.cv = null;
  assert.equal(portfolioData(envelope).personalData.resume, '');
});
