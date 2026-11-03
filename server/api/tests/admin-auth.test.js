const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createAdminAuth } = require('../src/services/admin-auth');
const { hashPassword, verifyPassword } = require('../src/services/password');
const { createApp } = require('../src/create-app');
const { createOtpEmailService } = require('../src/services/email');
const config = { environment: 'development', rateLimit: 100, auth: { secret: 'test-secret-'.repeat(5), cmsToken: 'server-only', origin: 'http://localhost:3000' } };
class MemoryStore {
  values = new Map(); counts = new Map(); now = Date.now();
  async limit(id, max) { const n = (this.counts.get(id) || 0) + 1; this.counts.set(id, n); return n <= max; }
  async put(kind, id, value, seconds) { this.values.set(`${kind}:${id}`, { value: structuredClone(value), until: this.now + seconds * 1000 }); }
  async get(kind, id) { const item = this.values.get(`${kind}:${id}`); return item && item.until > this.now ? structuredClone(item.value) : null; }
  async remove(kind, id) { this.values.delete(`${kind}:${id}`); }
  async attempts(kind, id, action = 'status', seconds = kind === 'password' ? 86400 : 300) {
    const key = `attempts:${kind}:${id}`;
    let item = this.values.get(key);
    if (item && item.until <= this.now) { this.values.delete(key); item = null; }
    let failed = item?.value || 0;
    if (failed < 5) {
      if (action === 'clear') { this.values.delete(key); failed = 0; }
      if (action === 'fail') {
        failed++;
        this.values.set(key, { value: failed, until: failed === 1 || failed === 5 ? this.now + seconds * 1000 : item.until });
      }
    }
    return { kind, failed, limit: 5, blocked: failed >= 5, retryAfterSeconds: failed >= 5 ? Math.max(1, Math.ceil((this.values.get(key).until - this.now) / 1000)) : 0 };
  }
  async verifyOtp(id, proof, purpose, accountId) {
    const data = await this.get('otp', id);
    if (!data || data.id !== accountId || data.purpose !== purpose) return {};
    const attempts = await this.attempts('otp', accountId);
    if (attempts.blocked) return { attempts };
    if (data.proof !== proof) return { attempts: await this.attempts('otp', accountId, 'fail') };
    await this.remove('otp', id);
    return { data, attempts: await this.attempts('otp', accountId, 'clear') };
  }
  async consume(kind, id, proof) {
    const value = await this.get(kind, id);
    if (!value) return null;
    if (value.proof !== proof) { const item = this.values.get(`${kind}:${id}`); item.value.attempts = (value.attempts || 0) + 1; if (item.value.attempts >= 5) await this.remove(kind, id); return null; }
    await this.remove(kind, id); return value;
  }
}
async function fixture(overrides = {}) {
  const admin = { id: randomUUID(), username: 'owner', email: 'owner@example.com', password_hash: await hashPassword('original-password'), token_version: 0, blocked: false };
  const repository = {
    byUsername: async value => value === admin.username ? admin : null,
    byEmail: async value => value === admin.email ? admin : null,
    byId: async id => id === admin.id ? admin : null,
    resetPassword: async (id, version, hash) => {
      if (id !== admin.id || version !== admin.token_version || admin.blocked) return null;
      admin.password_hash = hash; admin.token_version++; return admin;
    },
  };
  const store = new MemoryStore(); const mail = [];
  const auth = createAdminAuth(config, { repository, store, sendOtp: async value => mail.push(value), ...overrides });
  const challenge = async () => auth.login({ username: admin.username, password: 'original-password' });
  const login = async () => { const data = await challenge(); return auth.verifyLogin({ challengeId: data.challengeId, code: mail.at(-1).code }); };
  return { auth, admin, repository, store, mail, challenge, login };
}
test('passwords are salted, hashed and checked without storing plaintext', async () => {
  const a = await hashPassword('original-password'), b = await hashPassword('original-password');
  assert.notEqual(a, b); assert.ok(!a.includes('original-password'));
  assert.ok(await verifyPassword('original-password', a)); assert.equal(await verifyPassword('wrong', a), false);
  await assert.rejects(hashPassword('short')); await assert.rejects(hashPassword('é'.repeat(200)));
});
test('OTP mail reuses the configured sender and delivers to the admin email', async () => {
  let sent;
  const send = createOtpEmailService({ smtp: { auth: { user: 'sender@example.com' } }, fromName: 'Portfolio' }, { sendMail: async value => { sent = value; } });
  await send({ email: 'admin@example.com', code: '012345', purpose: 'login' });
  assert.equal(sent.from.address, 'sender@example.com'); assert.equal(sent.to, 'admin@example.com');
  assert.match(sent.subject, /login/); assert.match(sent.text, /012345/); assert.match(sent.text, /5 minutes/);
  await send({ email: 'admin@example.com', code: '123456', purpose: 'reset' }); assert.match(sent.subject, /reset/);
});
test('password plus one-use login OTP issues scoped JWTs; refresh rotates and replay revokes session', async () => {
  const f = await fixture(); const challenge = await f.challenge();
  assert.equal(challenge.expiresIn, 300); assert.match(f.mail[0].code, /^\d{6}$/);
  assert.ok(!JSON.stringify(await f.store.get('otp', challenge.challengeId)).includes(f.mail[0].code));
  const body = { challengeId: challenge.challengeId, code: f.mail[0].code };
  const tokens = await f.auth.verifyLogin(body);
  await assert.rejects(f.auth.verifyLogin(body));
  assert.equal((await f.auth.verifyAccess(tokens.access)).username, 'owner');
  await assert.rejects(f.auth.verifyAccess(tokens.refresh));
  const next = await f.auth.refresh(tokens.refresh); assert.notEqual(next.refresh, tokens.refresh);
  await assert.rejects(f.auth.refresh(tokens.refresh)); await assert.rejects(f.auth.verifyAccess(next.access));
});
test('OTP expires after five minutes and is invalid after five wrong guesses', async () => {
  const f = await fixture(); const a = await f.challenge(); f.store.now += 300001;
  await assert.rejects(f.auth.verifyLogin({ challengeId: a.challengeId, code: f.mail[0].code }));
  const b = await f.challenge(), code = f.mail.at(-1).code;
  const wrong = code === '000000' ? '000001' : '000000';
  for (let i = 0; i < 5; i++) await assert.rejects(f.auth.verifyLogin({ challengeId: b.challengeId, code: wrong }));
  await assert.rejects(f.auth.verifyLogin({ challengeId: b.challengeId, code }));
});
test('password reset requires reset-purpose OTP and one-use grant and revokes all sessions', async () => {
  const f = await fixture(); const tokens = await f.login();
  const loginChallenge = await f.challenge();
  await assert.rejects(f.auth.verifyReset({ challengeId: loginChallenge.challengeId, code: f.mail.at(-1).code }));
  const reset = await f.auth.forgot({ email: f.admin.email });
  const grant = await f.auth.verifyReset({ challengeId: reset.challengeId, code: f.mail.at(-1).code });
  await f.auth.reset({ resetToken: grant.resetToken, password: 'changed-password' });
  assert.ok(await verifyPassword('changed-password', f.admin.password_hash));
  await assert.rejects(f.auth.verifyAccess(tokens.access)); await assert.rejects(f.auth.refresh(tokens.refresh));
  await assert.rejects(f.auth.reset({ resetToken: grant.resetToken, password: 'another-password' }));
});
test('blocked admins receive a backend block message on login and recovery', async () => {
  const f = await fixture(); const tokens = await f.login(); const pending = await f.challenge(); f.admin.blocked = true;
  await assert.rejects(f.challenge()); await assert.rejects(f.auth.verifyAccess(tokens.access)); await assert.rejects(f.auth.refresh(tokens.refresh));
  await assert.rejects(f.auth.verifyLogin({ challengeId: pending.challengeId, code: f.mail.at(-1).code }));
  const count = f.mail.length;
  await assert.rejects(f.auth.forgot({ email: f.admin.email }), error => error.status === 403 && /account is blocked/.test(error.message));
  await f.auth.forgot({ email: 'unknown@example.com' }); assert.equal(f.mail.length, count);
});
test('five wrong passwords report counters and lock for a full day, without extending on retries', async () => {
  const f = await fixture();
  for (let i = 1; i <= 5; i++) {
    await assert.rejects(f.auth.login({ username: 'owner', password: 'wrong' }), error => error.attempts.failed === i && error.attempts.blocked === (i === 5));
    f.store.now += 1000;
  }
  await assert.rejects(f.challenge(), error => error.status === 429 && error.attempts.retryAfterSeconds === 86399);
  await assert.rejects(f.auth.forgot({ email: f.admin.email }), error => error.attempts.kind === 'password');
  assert.equal(f.admin.blocked, false);
  f.store.now += 86400000;
  await f.challenge();
});
test('successful passwords reset consecutive failure counts', async () => {
  const f = await fixture();
  await assert.rejects(f.auth.login({ username: 'OWNER', password: 'wrong' }), error => error.attempts.failed === 1);
  await f.challenge();
  await assert.rejects(f.auth.login({ username: 'owner', password: 'wrong' }), error => error.attempts.failed === 1);
});
test('OTP failures are counted across challenges and lock login and recovery for five minutes', async () => {
  const f = await fixture();
  const a = await f.challenge(), first = f.mail.at(-1).code;
  const b = await f.challenge(), second = f.mail.at(-1).code;
  let wrong = '000000';
  while ([first, second].includes(wrong)) wrong = String(Number(wrong) + 1).padStart(6, '0');
  for (let i = 1; i <= 5; i++) await assert.rejects(f.auth.verifyLogin({ challengeId: i % 2 ? a.challengeId : b.challengeId, code: wrong }), error => error.attempts.failed === i);
  await assert.rejects(f.auth.verifyLogin({ challengeId: b.challengeId, code: second }), error => error.attempts.blocked && error.attempts.retryAfterSeconds === 300);
  await assert.rejects(f.challenge(), error => error.attempts.kind === 'otp');
  await assert.rejects(f.auth.forgot({ email: f.admin.email }), error => error.attempts.kind === 'otp');
  f.store.now += 300001;
  const c = await f.challenge();
  await f.auth.verifyLogin({ challengeId: c.challengeId, code: f.mail.at(-1).code });
});
test('successful OTP verification resets the OTP failure counter', async () => {
  const f = await fixture(); const a = await f.challenge(), code = f.mail.at(-1).code;
  await assert.rejects(f.auth.verifyLogin({ challengeId: a.challengeId, code: '' }), error => error.attempts.failed === 1);
  await f.auth.verifyLogin({ challengeId: a.challengeId, code });
  const b = await f.challenge();
  await assert.rejects(f.auth.verifyLogin({ challengeId: b.challengeId, code: '' }), error => error.attempts.failed === 1);
});
test('HTTP failure metadata and Retry-After use the actual password lock duration', async () => {
  const f = await fixture(); const app = createApp(config, { auth: f.auth, sendEmail: async () => {} });
  for (let i = 1; i <= 5; i++) {
    const result = await request(app).post('/api/admin/auth/login').set('X-Admin-Request', '1').send({ username: 'owner', password: 'wrong' });
    assert.equal(result.body.attempts.failed, i); assert.equal(result.body.attempts.limit, 5);
    assert.equal(result.status, i === 5 ? 429 : 401);
    if (i === 5) { assert.equal(result.headers['retry-after'], '86400'); assert.match(result.body.message, /1 day/); }
  }
});
test('HTTP cookies, CSRF, management authorization, logout and fail-closed dependencies', async () => {
  const f = await fixture();
  const app = createApp(config, { auth: f.auth, sendEmail: async () => {}, content: async (path, options) => { assert.equal(options.token, undefined); return { categories: [] }; } });
  const post = (path, body) => request(app).post(`/api/admin/auth/${path}`).set('X-Admin-Request', '1').set('Origin', config.auth.origin).send(body);
  await request(app).get('/api/admin/categories').expect(401);
  await request(app).post('/api/admin/auth/login').send({ username: 'owner', password: 'original-password' }).expect(403);
  await request(app).post('/api/admin/auth/login').set('X-Admin-Request', '1').set('Origin', 'https://evil.example').send({}).expect(403);
  const challenge = await post('login', { username: 'owner', password: 'original-password' }); assert.equal(challenge.status, 200);
  const login = await post('login/verify', { challengeId: challenge.body.challengeId, code: f.mail.at(-1).code });
  assert.equal(login.status, 200); const cookie = login.headers['set-cookie'].map(value => value.split(';')[0]).join('; ');
  assert.ok(login.headers['set-cookie'].every(value => /HttpOnly/.test(value) && /SameSite=Strict/.test(value)));
  assert.deepEqual(login.body, { success: true });
  await request(app).get('/api/admin/categories').set('Cookie', cookie).expect(200);
  await request(app).post('/api/admin/categories').set('Cookie', cookie).send({}).expect(403);
  await post('logout', {}).set('Cookie', cookie).expect(200);
  await request(app).get('/api/admin/categories').set('Cookie', cookie).expect(401);
  const broken = createApp(config, { auth: { ...f.auth, verifyAccess: async () => { throw new Error('Redis unavailable'); } }, sendEmail: async () => {} });
  await request(broken).get('/api/admin/categories').set('Cookie', cookie).expect(500);
});
test('expired and tampered access tokens are rejected', async () => {
  const f = await fixture(); const tokens = await f.login();
  await assert.rejects(f.auth.verifyAccess(tokens.access.slice(0, -8) + 'tampered'));
  const claims = jwt.decode(tokens.access); delete claims.iat; delete claims.exp;
  const expired = jwt.sign(claims, config.auth.secret, { algorithm: 'HS256', expiresIn: -1 });
  await assert.rejects(f.auth.verifyAccess(expired));
});
