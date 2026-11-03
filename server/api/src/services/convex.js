const { createHash } = require('node:crypto');
const { HttpError } = require('../middleware/errors');
function createConvexService(config, fetchImpl = fetch) {
  return async (operation, args = {}) => {
    if (!config.convexUrl || !config.convexSecret) throw new HttpError(503, 'Convex is not configured.');
    try {
      const response = await fetchImpl(`${config.convexUrl}/bridge`, {
        method: 'POST', signal: AbortSignal.timeout(15000), cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.convexSecret}` },
        body: JSON.stringify({ operation, args }),
      });
      const result = await response.json();
      if (!response.ok) throw new HttpError([400, 404, 409, 413, 422].includes(response.status) ? response.status : 503, result.message || 'Data service unavailable.', result.fields);
      return result;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Data service unavailable.');
    }
  };
}
const digest = id => createHash('sha256').update(id).digest('hex');
class ConvexAuthStore {
  constructor(call) { this.call = call; }
  key(kind, id) { return `${kind}:${digest(id)}`; }
  limit(id, max, seconds) { return this.call('limit', { key: this.key('limit', id), max, seconds }); }
  put(kind, id, value, seconds) { return this.call('put', { key: this.key(kind, id), value, seconds }); }
  get(kind, id) { return this.call('get', { key: this.key(kind, id) }); }
  remove(kind, id) { return this.call('remove', { key: this.key(kind, id) }); }
  attempts(kind, id, action = 'status', seconds = kind === 'password' ? 86400 : 300) { return this.call('attempts', { key: this.key(`attempts:${kind}`, id), kind, action, seconds }); }
  verifyOtp(id, proof, purpose, accountId) { return this.call('verifyOtp', { key: this.key('otp', id), attemptKey: this.key('attempts:otp', accountId), proof, purpose, accountId }); }
  consume(kind, id, proof) { return this.call('consume', { key: this.key(kind, id), proof }); }
  rotate(sid, proof, value, seconds) { return this.call('rotate', { key: this.key('session', sid), proof, value, seconds }); }
}
function convexRepository(call) {
  return {
    byUsername: value => call('adminRead', { field: 'username', value }),
    byEmail: value => call('adminRead', { field: 'email', value }),
    byId: value => call('adminRead', { field: 'id', value }),
    resetPassword: (id, version, hash) => call('adminReset', { id, version, hash }),
  };
}
function createContentService(call) {
  return (path, options = {}) => {
    const url = new URL(path, 'https://internal/');
    return call('content', { path: url.pathname.slice(1), query: Object.fromEntries(url.searchParams), method: options.method || 'GET', body: options.body || null });
  };
}
module.exports = { createConvexService, ConvexAuthStore, convexRepository, createContentService };
