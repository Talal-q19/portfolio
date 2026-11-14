class StorageRepository {
  constructor(ctx) { this.storage = ctx.storage; }
  get(id) { return this.storage.get(id); }
  getUrl(id) { return this.storage.getUrl(id); }
  generateUploadUrl() { return this.storage.generateUploadUrl(); }
  delete(id) { return this.storage.delete(id); }
}
module.exports = { StorageRepository };
