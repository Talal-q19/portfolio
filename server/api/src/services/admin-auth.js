const { randomInt, randomBytes, randomUUID, createHmac, createHash } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('./password');
const { HttpError } = require('../middleware/errors');
const ACCESS_SECONDS = 600;
const REFRESH_SECONDS = 7 * 24 * 60 * 60;
const opaque = () => randomBytes(32).toString('hex');
const sha = value => createHash('sha256').update(value).digest('hex');
const invalid = () => new HttpError(401, 'Invalid or expired credentials.');
const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
function createAdminAuth(config, { repository, store, sendOtp }) {
  const secret = config.auth.secret;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('AUTH_JWT_SECRET must contain at least 32 bytes.');
  const dummyHash = hashPassword(opaque());
  const proof = (id, code) => createHmac('sha256', secret).update(`${id}:${code}`).digest('hex');
  const sign = (admin, sid, type, seconds) => jwt.sign({ sid, version: admin.token_version, type }, secret, {
    algorithm: 'HS256', jwtid: randomUUID(), subject: admin.id, issuer: 'portfolio-api', audience: `portfolio-admin-${type}`, expiresIn: seconds,
  });
  function decode(token, type) {
    try {
      const value = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'portfolio-api', audience: `portfolio-admin-${type}` });
      if (value.type !== type || typeof value.sub !== 'string' || typeof value.sid !== 'string' || !Number.isInteger(value.version)) throw invalid();
      return value;
    } catch { throw invalid(); }
  }
  async function eligible(id, version) {
    const admin = await repository.byId(id);
    if (!admin || admin.token_version !== version) throw invalid();
    await checkAccount(admin);
    return admin;
  }
  function attemptError(state) {
    const duration = state.kind === 'password' ? '1 day' : '5 minutes';
    const message = state.blocked
      ? `Your account is temporarily blocked after 5 incorrect ${state.kind === 'password' ? 'passwords' : 'verification codes'}. The block lasts ${duration}. Try again in ${state.retryAfterSeconds} seconds.`
      : state.kind === 'password' ? 'Incorrect username or password.' : 'Incorrect verification code.';
    const error = new HttpError(state.blocked ? 429 : 401, message);
    error.attempts = state;
    return error;
  }
  async function checkAttempts(kind, id, action = 'status') {
    const state = await store.attempts(kind, id, action);
    if (state.blocked) throw attemptError(state);
    return state;
  }
  async function checkAccount(admin) {
    if (admin.blocked) throw new HttpError(403, 'Your account is blocked. Contact the administrator.');
    await checkAttempts('password', admin.username);
    await checkAttempts('otp', admin.id);
  }
  async function limit(id, max = 5, seconds = 900) {
    if (!await store.limit(id, max, seconds)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  }
  async function challenge(admin, purpose) {
    const challengeId = opaque();
    if (admin && !admin.blocked) {
      await checkAccount(admin);
      const code = String(randomInt(0, 1000000)).padStart(6, '0');
      await store.put('otp', challengeId, { proof: proof(challengeId, code), purpose, id: admin.id, version: admin.token_version }, 300);
      try { await sendOtp({ email: admin.email, code, purpose }); }
      catch (error) { await store.remove('otp', challengeId); throw error; }
    }
    return { challengeId, expiresIn: 300, message: 'If the account is eligible, a verification code has been sent.' };
  }
  async function verifyOtp(challengeId, code, purpose) {
    if (typeof challengeId !== 'string' || !/^[a-f0-9]{64}$/.test(challengeId)) throw invalid();
    const challengeData = await store.get('otp', challengeId);
    if (!challengeData || challengeData.purpose !== purpose) throw new HttpError(401, 'Verification code expired or already used. Request a new code.');
    await eligible(challengeData.id, challengeData.version);
    const validFormat = typeof code === 'string' && /^\d{6}$/.test(code);
    const result = await store.verifyOtp(challengeId, validFormat ? proof(challengeId, code) : '', purpose, challengeData.id);
    if (!result.data) {
      if (result.attempts) throw attemptError(result.attempts);
      throw new HttpError(401, 'Verification code expired or already used. Request a new code.');
    }
    return eligible(result.data.id, result.data.version);
  }
  async function tokens(admin, sid = randomUUID()) {
    const refresh = sign(admin, sid, 'refresh', REFRESH_SECONDS);
    const access = sign(admin, sid, 'access', ACCESS_SECONDS);
    await store.put('session', sid, { proof: sha(refresh), id: admin.id, version: admin.token_version }, REFRESH_SECONDS);
    return { access, refresh };
  }
  return {
    limit,
    async login({ username, password }) {
      const user = normalize(username);
      if (!user || user.length > 80 || typeof password !== 'string' || Buffer.byteLength(password) > 256) throw invalid();
      await checkAttempts('password', user);
      const admin = await repository.byUsername(user);
      if (admin) await checkAccount(admin);
      const valid = await verifyPassword(password, admin?.password_hash || await dummyHash);
      if (!valid || !admin) throw attemptError(await store.attempts('password', user, 'fail'));
      await checkAttempts('password', user, 'clear');
      await limit(`login-code:${user}`);
      return challenge(admin, 'login');
    },
    async verifyLogin(body) { return tokens(await verifyOtp(body.challengeId, body.code, 'login')); },
    async forgot({ email }) {
      const address = normalize(email);
      if (!address || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new HttpError(422, 'Enter a valid email address.');
      await limit(`forgot:${address}`);
      const admin = await repository.byEmail(address);
      if (admin) await checkAccount(admin);
      return challenge(admin, 'reset');
    },
    async verifyReset(body) {
      const admin = await verifyOtp(body.challengeId, body.code, 'reset');
      const resetToken = opaque();
      await store.put('reset', resetToken, { id: admin.id, version: admin.token_version, proof: sha(resetToken) }, 300);
      return { resetToken, expiresIn: 300 };
    },
    async reset({ resetToken, password }) {
      if (typeof resetToken !== 'string' || !/^[a-f0-9]{64}$/.test(resetToken)) throw invalid();
      let hash;
      try { hash = await hashPassword(password); } catch (error) { throw new HttpError(422, error.message); }
      const data = await store.consume('reset', resetToken, sha(resetToken));
      if (!data || !await repository.resetPassword(data.id, data.version, hash)) throw invalid();
    },
    async refresh(token) {
      const claims = decode(token, 'refresh');
      const admin = await eligible(claims.sub, claims.version);
      if (store.rotate) {
        const refresh = sign(admin, claims.sid, 'refresh', REFRESH_SECONDS);
        const access = sign(admin, claims.sid, 'access', ACCESS_SECONDS);
        if (!await store.rotate(claims.sid, sha(token), { proof: sha(refresh), id: admin.id, version: admin.token_version }, REFRESH_SECONDS)) throw invalid();
        return { access, refresh };
      }
      const session = await store.consume('session', claims.sid, sha(token));
      if (!session || session.id !== admin.id || session.version !== claims.version) {
        await store.remove('session', claims.sid);
        throw invalid();
      }
      return tokens(admin, claims.sid);
    },
    async verifyAccess(token) {
      const claims = decode(token, 'access');
      const admin = await eligible(claims.sub, claims.version);
      const session = await store.get('session', claims.sid);
      if (!session || session.id !== admin.id || session.version !== claims.version) throw invalid();
      return { id: admin.id, username: admin.username, role: 'portfolio-admin' };
    },
    async logout(access, refresh) {
      for (const [token, type] of [[access, 'access'], [refresh, 'refresh']]) {
        try { const claims = decode(token, type); await store.remove('session', claims.sid); }
        catch (error) { if (!(error instanceof HttpError)) throw error; }
      }
    },
  };
}
module.exports = { createAdminAuth, ACCESS_SECONDS, REFRESH_SECONDS };
