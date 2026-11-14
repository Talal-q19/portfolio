const { randomInt, randomBytes, randomUUID, createHmac, createHash } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { HttpError } = require('../../middleware/errors');
const { ACCESS_SECONDS, REFRESH_SECONDS } = require('../../config/auth');
const opaque = () => randomBytes(32).toString('hex');
const sha = value => createHash('sha256').update(value).digest('hex');
const invalid = () => new HttpError(401, 'Invalid or expired credentials.');
const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const { AdminAuthService } = require('../AdminAuthService');
const { PasswordServiceImpl } = require('./PasswordServiceImpl');
const { AuthResponse } = require('../../dtos/response/AuthResponse');
class AdminAuthServiceImpl extends AdminAuthService {
  constructor(config, { repository, store, sendOtp, passwordService = new PasswordServiceImpl() }) {
    super();
    this.secret = config.auth.secret;
    if (!this.secret || Buffer.byteLength(this.secret) < 32) throw new Error('AUTH_JWT_SECRET must contain at least 32 bytes.');
    Object.assign(this, { repository, store, sendOtp, passwordService });
    this.dummyHash = passwordService.hash(opaque());
  }
  proof(id, code) { return createHmac('sha256', this.secret).update(`${id}:${code}`).digest('hex'); }
  sign(admin, sid, type, seconds) {
    return jwt.sign({ sid, version: admin.token_version, type }, this.secret, { algorithm: 'HS256', jwtid: randomUUID(), subject: admin.id, issuer: 'portfolio-api', audience: `portfolio-admin-${type}`, expiresIn: seconds });
  }
  decode(token, type) {
    try {
      const value = jwt.verify(token, this.secret, { algorithms: ['HS256'], issuer: 'portfolio-api', audience: `portfolio-admin-${type}` });
      if (value.type !== type || typeof value.sub !== 'string' || typeof value.sid !== 'string' || !Number.isInteger(value.version)) throw invalid();
      return value;
    } catch { throw invalid(); }
  }
  async eligible(id, version) {
    const admin = await this.repository.byId(id);
    if (!admin || admin.token_version !== version) throw invalid();
    await this.checkAccount(admin);
    return admin;
  }
  attemptError(state) {
    const duration = state.kind === 'password' ? '1 day' : '5 minutes';
    const message = state.blocked
      ? `Your account is temporarily blocked after 5 incorrect ${state.kind === 'password' ? 'passwords' : 'verification codes'}. The block lasts ${duration}. Try again in ${state.retryAfterSeconds} seconds.`
      : state.kind === 'password' ? 'Incorrect username or password.' : 'Incorrect verification code.';
    const error = new HttpError(state.blocked ? 429 : 401, message);
    error.attempts = state;
    return error;
  }
  async checkAttempts(kind, id, action = 'status') {
    const state = await this.store.attempts(kind, id, action);
    if (state.blocked) throw this.attemptError(state);
    return state;
  }
  async checkAccount(admin) {
    if (admin.blocked) throw new HttpError(403, 'Your account is blocked. Contact the administrator.');
    await this.checkAttempts('password', admin.username);
    await this.checkAttempts('otp', admin.id);
  }
  async limit(id, max = 5, seconds = 900) {
    if (!await this.store.limit(id, max, seconds)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  }
  async challenge(admin, purpose) {
    const challengeId = opaque();
    if (admin && !admin.blocked) {
      await this.checkAccount(admin);
      const code = String(randomInt(0, 1000000)).padStart(6, '0');
      await this.store.put('otp', challengeId, { proof: this.proof(challengeId, code), purpose, id: admin.id, version: admin.token_version }, 300);
      try { await this.sendOtp({ email: admin.email, code, purpose }); }
      catch (error) { await this.store.remove('otp', challengeId); throw error; }
    }
    return AuthResponse.challenge(challengeId);
  }
  async verifyOtp(challengeId, code, purpose) {
    if (typeof challengeId !== 'string' || !/^[a-f0-9]{64}$/.test(challengeId)) throw invalid();
    const challengeData = await this.store.get('otp', challengeId);
    if (!challengeData || challengeData.purpose !== purpose) throw new HttpError(401, 'Verification code expired or already used. Request a new code.');
    await this.eligible(challengeData.id, challengeData.version);
    const validFormat = typeof code === 'string' && /^\d{6}$/.test(code);
    const result = await this.store.verifyOtp(challengeId, validFormat ? this.proof(challengeId, code) : '', purpose, challengeData.id);
    if (!result.data) {
      if (result.attempts) throw this.attemptError(result.attempts);
      throw new HttpError(401, 'Verification code expired or already used. Request a new code.');
    }
    return this.eligible(result.data.id, result.data.version);
  }
  async tokens(admin, sid = randomUUID()) {
    const refresh = this.sign(admin, sid, 'refresh', REFRESH_SECONDS);
    const access = this.sign(admin, sid, 'access', ACCESS_SECONDS);
    await this.store.put('session', sid, { proof: sha(refresh), id: admin.id, version: admin.token_version }, REFRESH_SECONDS);
    return { access, refresh };
  }
  async login({ username, password }) {
    const user = normalize(username);
    if (!user || user.length > 80 || typeof password !== 'string' || Buffer.byteLength(password) > 256) throw invalid();
    await this.checkAttempts('password', user);
    const admin = await this.repository.byUsername(user);
    if (admin) await this.checkAccount(admin);
    const valid = await this.passwordService.verify(password, admin?.password_hash || await this.dummyHash);
    if (!valid || !admin) throw this.attemptError(await this.store.attempts('password', user, 'fail'));
    await this.checkAttempts('password', user, 'clear');
    await this.limit(`login-code:${user}`);
    return this.challenge(admin, 'login');
  }
  async verifyLogin(body) { return this.tokens(await this.verifyOtp(body.challengeId, body.code, 'login')); }
  async forgot({ email }) {
    const address = normalize(email);
    if (!address || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new HttpError(422, 'Enter a valid email address.');
    await this.limit(`forgot:${address}`);
    const admin = await this.repository.byEmail(address);
    if (admin) await this.checkAccount(admin);
    return this.challenge(admin, 'reset');
  }
  async verifyReset(body) {
    const admin = await this.verifyOtp(body.challengeId, body.code, 'reset');
    const resetToken = opaque();
    await this.store.put('reset', resetToken, { id: admin.id, version: admin.token_version, proof: sha(resetToken) }, 300);
    return AuthResponse.resetGrant(resetToken);
  }
  async reset({ resetToken, password }) {
    if (typeof resetToken !== 'string' || !/^[a-f0-9]{64}$/.test(resetToken)) throw invalid();
    let hash;
    try { hash = await this.passwordService.hash(password); } catch (error) { throw new HttpError(422, error.message); }
    const data = await this.store.consume('reset', resetToken, sha(resetToken));
    if (!data || !await this.repository.resetPassword(data.id, data.version, hash)) throw invalid();
  }
  async refresh(token) {
    const claims = this.decode(token, 'refresh');
    const admin = await this.eligible(claims.sub, claims.version);
    if (this.store.rotate) {
      const refresh = this.sign(admin, claims.sid, 'refresh', REFRESH_SECONDS);
      const access = this.sign(admin, claims.sid, 'access', ACCESS_SECONDS);
      if (!await this.store.rotate(claims.sid, sha(token), { proof: sha(refresh), id: admin.id, version: admin.token_version }, REFRESH_SECONDS)) throw invalid();
      return { access, refresh };
    }
    const session = await this.store.consume('session', claims.sid, sha(token));
    if (!session || session.id !== admin.id || session.version !== claims.version) {
      await this.store.remove('session', claims.sid);
      throw invalid();
    }
    return this.tokens(admin, claims.sid);
  }
  async verifyAccess(token) {
    const claims = this.decode(token, 'access');
    const admin = await this.eligible(claims.sub, claims.version);
    const session = await this.store.get('session', claims.sid);
    if (!session || session.id !== admin.id || session.version !== claims.version) throw invalid();
    return AuthResponse.identity(admin);
  }
  async logout(access, refresh) {
    for (const [token, type] of [[access, 'access'], [refresh, 'refresh']]) {
      try { const claims = this.decode(token, type); await this.store.remove('session', claims.sid); }
      catch (error) { if (!(error instanceof HttpError)) throw error; }
    }
  }

}
const createAdminAuth = (config, dependencies) => new AdminAuthServiceImpl(config, dependencies);
module.exports = { AdminAuthServiceImpl, createAdminAuth, ACCESS_SECONDS, REFRESH_SECONDS };
