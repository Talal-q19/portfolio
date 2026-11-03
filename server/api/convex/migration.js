import { ConvexError } from 'convex/values';
import { find, plain } from './state';
const equal = (a, b) => JSON.stringify(sort(a)) === JSON.stringify(sort(b));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  return value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sort(value[k])])) : value;
}
export async function migrationOperation(ctx, operation, a) {
  if (operation === 'migrationUpload') return { uploadUrl: await ctx.storage.generateUploadUrl() };
  if (operation === 'migrationRead') {
    const table = a.table;
    if (!['categories', 'content', 'media', 'admins'].includes(table)) throw new Error('Invalid table.');
    return (await ctx.db.query(table).collect()).map(plain);
  }
  if (operation !== 'migrationRecord' || !['categories', 'content', 'media', 'admins'].includes(a.table)) throw new Error('Invalid import operation.');
  const field = ['media', 'admins'].includes(a.table) ? 'id' : 'documentId';
  const previous = await find(ctx, a.table, field, a.data[field]);
  if (previous) {
    const old = plain(previous), incoming = { ...a.data };
    // Storage IDs differ after a retry; retain the previously imported blob.
    if (a.table === 'media') { delete old.storageId; delete incoming.storageId; }
    if (!equal(old, incoming)) throw new ConvexError({ status: 409, message: 'Import conflicts with existing data. Stop and reconcile before retrying.' });
    return { skipped: true };
  }
  if (a.table === 'media') {
    const file = await ctx.db.system.get(a.data.storageId);
    if (!file || file.sha256 !== a.data.checksum) throw new Error('Media checksum mismatch.');
    const counter = await find(ctx, 'counters', 'key', 'media');
    if (!counter) await ctx.db.insert('counters', { key: 'media', value: a.data.id });
    else if (counter.value < a.data.id) await ctx.db.patch(counter._id, { value: a.data.id });
  }
  // Schema validation applies to every imported document. Source reconciliation
  // and reference validation happen before production receives any traffic.
  await ctx.db.insert(a.table, a.data);
  return { skipped: false };
}
