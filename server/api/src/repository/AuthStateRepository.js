const { createHash } = require('node:crypto');
const digest = id => createHash('sha256').update(id).digest('hex');
class AuthStateRepository {
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

module.exports = { AuthStateRepository };
