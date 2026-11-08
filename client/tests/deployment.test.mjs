import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { proxyApi } from '../utils/api-proxy.mjs';
import { uploadMedia } from '../utils/upload-media.mjs';
test('frontend proxy signs the Vercel client address and preserves both HttpOnly cookies', async () => {
  const secret = 's'.repeat(32);
  const req = new Request('https://fe.example/api/admin/auth/login?x=1', { method: 'POST', headers: { 'x-vercel-forwarded-for': '203.0.113.4', 'x-portfolio-ip': 'attacker', origin: 'https://fe.example', 'x-admin-request': '1' }, body: '{}' });
  const response = await proxyApi(req, { NODE_ENV: 'production', VERCEL: '1', API_PROXY_SECRET: secret, API_INTERNAL_URL: 'https://be.example' }, async (url, options) => {
    assert.equal(url.href, 'https://be.example/api/admin/auth/login?x=1');
    assert.equal(options.headers.get('x-portfolio-ip'), '203.0.113.4');
    const time = options.headers.get('x-portfolio-time');
    assert.equal(options.headers.get('x-portfolio-signature'), createHmac('sha256', secret).update(`${time}\n203.0.113.4\nPOST\n/api/admin/auth/login?x=1`).digest('hex'));
    const headers = new Headers(); headers.append('set-cookie', 'access=a; HttpOnly; Secure; SameSite=Strict; Path=/api/admin'); headers.append('set-cookie', 'refresh=b; HttpOnly; Secure; SameSite=Strict; Path=/api/admin');
    return new Response('{}', { headers });
  });
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('proxy fails closed on missing configuration, unknown paths and upstream failures', async () => {
  assert.equal((await proxyApi(new Request('https://fe.example/api/content'), { NODE_ENV: 'production' })).status, 503);
  assert.equal((await proxyApi(new Request('https://fe.example/api/private'), {})).status, 404);
  assert.equal((await proxyApi(new Request('https://fe.example/api/content'), {}, async () => { throw Error('private host'); })).status, 503);
});
test('8 MiB upload sends bytes directly to storage and completes through the admin API', async () => {
  const file = new File([new Uint8Array(8 * 1024 * 1024)], 'image.png', { type: 'image/png' });
  const calls = [];
  const api = async (path, options) => {
    calls.push({ path, ...options });
    return path.endsWith('upload-ticket') ? { token: 'ticket', uploadUrl: 'https://storage.example/upload' } : { items: [{ id: 1 }] };
  };
  const result = await uploadMedia(api, file, async (url, init) => {
    assert.equal(url, 'https://storage.example/upload'); assert.equal(init.body.size, 8 * 1024 * 1024);
    assert.equal(init.credentials, undefined); assert.equal(init.headers.Authorization, undefined);
    return Response.json({ storageId: 'storage' });
  });
  assert.equal(result.items[0].id, 1);
  assert.deepEqual(calls[1].body, { token: 'ticket', storageId: 'storage' });
});
