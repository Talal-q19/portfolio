const { AuthDataService } = require('../AuthDataService');
const { find } = require('../../repository/ConvexDatabaseRepository');
const { plain } = require('../../dtos/response/RecordResponse');
async function live(repositories, key) {
  const row = await find(repositories, 'authState', 'key', key);
  return row && row.expiresAt > Date.now() ? row : null;
}
async function put(repositories, key, value, seconds) {
  const row = await find(repositories, 'authState', 'key', key);
  const data = { key, value, expiresAt: Date.now() + seconds * 1000 };
  if (row) await repositories.database.replace(row._id, data);
  else await repositories.database.insert('authState', data);
  return null;
}
async function remove(repositories, key) {
  const row = await find(repositories, 'authState', 'key', key);
  if (row) await repositories.database.delete(row._id);
  return null;
}
async function attempts(repositories, { key, kind, action = 'status', seconds = kind === 'password' ? 86400 : 300 }) {
  let row = await live(repositories, key);
  let failed = row?.value || 0;
  if (failed < 5) {
    if (action === 'clear') { await remove(repositories, key); failed = 0; }
    if (action === 'fail') {
      failed++;
      const duration = failed === 1 || failed === 5 ? seconds : (row.expiresAt - Date.now()) / 1000;
      await put(repositories, key, failed, duration);
      row = await live(repositories, key);
    }
  }
  return { kind, failed, limit: 5, blocked: failed >= 5, retryAfterSeconds: failed >= 5 ? Math.max(1, Math.ceil((row.expiresAt - Date.now()) / 1000)) : 0 };
}
async function authOperation(repositories, operation, a) {
  switch (operation) {
    case 'health': return { success: true };
    case 'put': return put(repositories, a.key, a.value, a.seconds);
    case 'get': return (await live(repositories, a.key))?.value || null;
    case 'remove': return remove(repositories, a.key);
    case 'attempts': return attempts(repositories, a);
    case 'limit': {
      const row = await live(repositories, a.key);
      const count = (row?.value || 0) + 1;
      await put(repositories, a.key, count, row ? (row.expiresAt - Date.now()) / 1000 : a.seconds);
      return count <= a.max;
    }
    case 'verifyOtp': {
      const row = await live(repositories, a.key);
      if (!row || row.value.id !== a.accountId || row.value.purpose !== a.purpose) return {};
      const state = await attempts(repositories, { key: a.attemptKey, kind: 'otp' });
      if (state.blocked) return { attempts: state };
      if (row.value.proof !== a.proof) return { attempts: await attempts(repositories, { key: a.attemptKey, kind: 'otp', action: 'fail' }) };
      await repositories.database.delete(row._id);
      return { data: row.value, attempts: await attempts(repositories, { key: a.attemptKey, kind: 'otp', action: 'clear' }) };
    }
    case 'consume': {
      const row = await live(repositories, a.key);
      if (!row) return null;
      if (row.value.proof !== a.proof) {
        const value = { ...row.value, attempts: (row.value.attempts || 0) + 1 };
        if (value.attempts >= 5) await repositories.database.delete(row._id);
        else await repositories.database.patch(row._id, { value });
        return null;
      }
      await repositories.database.delete(row._id);
      return row.value;
    }
    case 'rotate': {
      const row = await live(repositories, a.key);
      if (!row || row.value.proof !== a.proof || row.value.id !== a.value.id || row.value.version !== a.value.version) {
        await remove(repositories, a.key); return false;
      }
      await put(repositories, a.key, a.value, a.seconds); return true;
    }
    case 'adminRead': {
      if (!['id', 'email', 'username'].includes(a.field)) throw new Error('Invalid administrator lookup.');
      return plain(await find(repositories, 'admins', a.field, a.value));
    }
    case 'adminReset': {
      const row = await find(repositories, 'admins', 'id', a.id);
      if (!row || row.blocked || row.token_version !== a.version) return null;
      await repositories.database.patch(row._id, { password_hash: a.hash, token_version: row.token_version + 1, updated_at: new Date().toISOString() });
      return { id: row.id };
    }
    case 'adminCreate': {
      if (await find(repositories, 'admins', 'id', a.id) || await find(repositories, 'admins', 'username', a.username) || await find(repositories, 'admins', 'email', a.email)) throw new Error('Administrator already exists.');
      await repositories.database.insert('admins', { ...a, blocked: a.blocked || false, token_version: a.token_version || 0, created_at: a.created_at || new Date().toISOString(), updated_at: a.updated_at || new Date().toISOString() });
      return { id: a.id };
    }
    case 'adminBlock': {
      const row = await find(repositories, 'admins', 'username', a.username);
      if (!row) throw new Error('Administrator not found.');
      await repositories.database.patch(row._id, { blocked: a.blocked, token_version: row.token_version + 1, updated_at: new Date().toISOString() });
      return { success: true };
    }
    default: throw new Error('Unknown operation.');
  }
}

class AuthDataServiceImpl extends AuthDataService {
  constructor(repositories) { super(); this.repositories = repositories; }
  execute(operation, args) { return authOperation(this.repositories, operation, args); }
}
module.exports = { AuthDataServiceImpl };
