// All state transitions in this module run within one Convex mutation.
export const find = (ctx, table, field, value) => ctx.db.query(table).withIndex(field, q => q.eq(field, value)).unique();
export function plain(row) {
  if (!row) return null;
  const { _id, _creationTime, ...data } = row;
  return data;
}
export async function live(ctx, key) {
  const row = await find(ctx, 'authState', 'key', key);
  return row && row.expiresAt > Date.now() ? row : null;
}
export async function put(ctx, key, value, seconds) {
  const row = await find(ctx, 'authState', 'key', key);
  const data = { key, value, expiresAt: Date.now() + seconds * 1000 };
  if (row) await ctx.db.replace(row._id, data);
  else await ctx.db.insert('authState', data);
  return null;
}
export async function remove(ctx, key) {
  const row = await find(ctx, 'authState', 'key', key);
  if (row) await ctx.db.delete(row._id);
  return null;
}
export async function attempts(ctx, { key, kind, action = 'status', seconds = kind === 'password' ? 86400 : 300 }) {
  let row = await live(ctx, key);
  let failed = row?.value || 0;
  if (failed < 5) {
    if (action === 'clear') { await remove(ctx, key); failed = 0; }
    if (action === 'fail') {
      failed++;
      const duration = failed === 1 || failed === 5 ? seconds : (row.expiresAt - Date.now()) / 1000;
      await put(ctx, key, failed, duration);
      row = await live(ctx, key);
    }
  }
  return { kind, failed, limit: 5, blocked: failed >= 5, retryAfterSeconds: failed >= 5 ? Math.max(1, Math.ceil((row.expiresAt - Date.now()) / 1000)) : 0 };
}
export async function authOperation(ctx, operation, a) {
  switch (operation) {
    case 'health': return { success: true };
    case 'put': return put(ctx, a.key, a.value, a.seconds);
    case 'get': return (await live(ctx, a.key))?.value || null;
    case 'remove': return remove(ctx, a.key);
    case 'attempts': return attempts(ctx, a);
    case 'limit': {
      const row = await live(ctx, a.key);
      const count = (row?.value || 0) + 1;
      await put(ctx, a.key, count, row ? (row.expiresAt - Date.now()) / 1000 : a.seconds);
      return count <= a.max;
    }
    case 'verifyOtp': {
      const row = await live(ctx, a.key);
      if (!row || row.value.id !== a.accountId || row.value.purpose !== a.purpose) return {};
      const state = await attempts(ctx, { key: a.attemptKey, kind: 'otp' });
      if (state.blocked) return { attempts: state };
      if (row.value.proof !== a.proof) return { attempts: await attempts(ctx, { key: a.attemptKey, kind: 'otp', action: 'fail' }) };
      await ctx.db.delete(row._id);
      return { data: row.value, attempts: await attempts(ctx, { key: a.attemptKey, kind: 'otp', action: 'clear' }) };
    }
    case 'consume': {
      const row = await live(ctx, a.key);
      if (!row) return null;
      if (row.value.proof !== a.proof) {
        const value = { ...row.value, attempts: (row.value.attempts || 0) + 1 };
        if (value.attempts >= 5) await ctx.db.delete(row._id);
        else await ctx.db.patch(row._id, { value });
        return null;
      }
      await ctx.db.delete(row._id);
      return row.value;
    }
    case 'rotate': {
      const row = await live(ctx, a.key);
      if (!row || row.value.proof !== a.proof || row.value.id !== a.value.id || row.value.version !== a.value.version) {
        await remove(ctx, a.key); return false;
      }
      await put(ctx, a.key, a.value, a.seconds); return true;
    }
    case 'adminRead': {
      if (!['id', 'email', 'username'].includes(a.field)) throw new Error('Invalid administrator lookup.');
      return plain(await find(ctx, 'admins', a.field, a.value));
    }
    case 'adminReset': {
      const row = await find(ctx, 'admins', 'id', a.id);
      if (!row || row.blocked || row.token_version !== a.version) return null;
      await ctx.db.patch(row._id, { password_hash: a.hash, token_version: row.token_version + 1, updated_at: new Date().toISOString() });
      return { id: row.id };
    }
    case 'adminCreate': {
      if (await find(ctx, 'admins', 'id', a.id) || await find(ctx, 'admins', 'username', a.username) || await find(ctx, 'admins', 'email', a.email)) throw new Error('Administrator already exists.');
      await ctx.db.insert('admins', { ...a, blocked: a.blocked || false, token_version: a.token_version || 0, created_at: a.created_at || new Date().toISOString(), updated_at: a.updated_at || new Date().toISOString() });
      return { id: a.id };
    }
    case 'adminBlock': {
      const row = await find(ctx, 'admins', 'username', a.username);
      if (!row) throw new Error('Administrator not found.');
      await ctx.db.patch(row._id, { blocked: a.blocked, token_version: row.token_version + 1, updated_at: new Date().toISOString() });
      return { success: true };
    }
    default: throw new Error('Unknown operation.');
  }
}
