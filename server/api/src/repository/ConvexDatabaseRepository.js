// The only module that accesses Convex database tables directly.
class ConvexDatabaseRepository {
  constructor(ctx) { this.db = ctx.db; }
  find(table, field, value) { return this.db.query(table).withIndex(field, q => q.eq(field, value)).unique(); }
  first(table, field, value) { return this.db.query(table).withIndex(field, q => q.eq(field, value)).first(); }
  all(table) { return this.db.query(table).collect(); }
  insert(table, data) { return this.db.insert(table, data); }
  patch(id, data) { return this.db.patch(id, data); }
  replace(id, data) { return this.db.replace(id, data); }
  delete(id) { return this.db.delete(id); }
  expired(table, now, limit = 500) { return this.db.query(table).withIndex('expiry', q => q.lt('expiresAt', now)).take(limit); }
  fileMetadata(id) { return this.db.system.get(id); }
  storageFiles(limit = 500) { return this.db.system.query('_storage').order('asc').take(limit); }
}
const find = (repositories, ...args) => repositories.database.find(...args);
module.exports = { ConvexDatabaseRepository, find };
