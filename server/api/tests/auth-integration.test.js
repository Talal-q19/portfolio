const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { createClient } = require('redis');
const { AuthStore } = require('../src/services/auth-store');
const { adminRepository } = require('../src/services/admin-repository');
const { createAdminAuth } = require('../src/services/admin-auth');
const { hashPassword } = require('../src/services/password');
const { readConfig } = require('../src/config/env');

test('live PostgreSQL and Redis: OTP TTL/attempts/atomic consume, rotation, reset and blocking', { skip: process.env.AUTH_INTEGRATION !== 'true' }, async () => {
  const config = readConfig(), id = randomUUID(), username = `test-${id}`;
  const pool = new Pool({ connectionString: config.auth.databaseUrl, connectionTimeoutMillis: 5000 });
  const redis = createClient({ RESP: 2, url: config.auth.redisUrl, socket: { reconnectStrategy: false } });
  redis.on('error', () => {});
  const keys = new Set();
  const store = new AuthStore(redis);
  const originalKey = store.key.bind(store);
  store.key = (kind, value) => { const key = `${originalKey(kind, value)}:test:${id}`; keys.add(key); return key; };
  try {
    await redis.connect();
    await pool.query('INSERT INTO portfolio_admins (id, username, email, password_hash) VALUES ($1,$2,$3,$4)', [id, username, `${username}@example.com`, await hashPassword('integration-password')]);
    const mail = [];
    const auth = createAdminAuth(config, { repository: adminRepository(pool), store, sendOtp: async value => mail.push(value) });
    const login = () => auth.login({ username, password: 'integration-password' });
    const challenge = await login(); const code = mail.at(-1).code;
    assert.ok(await redis.ttl(store.key('otp', challenge.challengeId)) <= 300);
    await assert.rejects(auth.verifyLogin({ challengeId: challenge.challengeId, code: code === '000000' ? '000001' : '000000' }));
    assert.ok(await redis.ttl(store.key('otp', challenge.challengeId)) > 0);
    const attempts = await Promise.allSettled([auth.verifyLogin({ challengeId: challenge.challengeId, code }), auth.verifyLogin({ challengeId: challenge.challengeId, code })]);
    assert.equal(attempts.filter(value => value.status === 'fulfilled').length, 1);
    const tokens = attempts.find(value => value.status === 'fulfilled').value;
    const rotated = await auth.refresh(tokens.refresh);
    assert.notEqual(tokens.refresh, rotated.refresh);
    await assert.rejects(auth.refresh(tokens.refresh)); await assert.rejects(auth.verifyAccess(rotated.access));
    const second = await login(); const active = await auth.verifyLogin({ challengeId: second.challengeId, code: mail.at(-1).code });
    const reset = await auth.forgot({ email: `${username}@example.com` });
    const grant = await auth.verifyReset({ challengeId: reset.challengeId, code: mail.at(-1).code });
    await auth.reset({ resetToken: grant.resetToken, password: 'integration-new-password' });
    await assert.rejects(auth.verifyAccess(active.access));
    assert.equal((await adminRepository(pool).byId(id)).token_version, 1);
    await pool.query('UPDATE portfolio_admins SET blocked = true WHERE id = $1', [id]);
    await assert.rejects(auth.login({ username, password: 'integration-new-password' }));
    await store.put('otp', 'expiry', { proof: 'test' }, 1);
    await redis.pExpire(store.key('otp', 'expiry'), 1);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(await store.consume('otp', 'expiry', 'test'), null);
    for (let n = 0; n < 3; n++) assert.equal(await store.limit('shared-limit', 2, 60), n < 2);
  } finally {
    if (redis.isReady && keys.size) await redis.del([...keys]);
    if (redis.isOpen) redis.destroy();
    await pool.query('DELETE FROM portfolio_admins WHERE id = $1 AND username = $2', [id, username]);
    await pool.end();
  }
});
