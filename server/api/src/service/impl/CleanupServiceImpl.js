const { CleanupService } = require('../CleanupService');
class CleanupServiceImpl extends CleanupService {
  constructor(repositories) { super(); this.repositories = repositories; }
  async execute() {
    const repositories = this.repositories;
    const now = Date.now();
    for (const table of ['authState', 'uploadTickets']) {
      const rows = await repositories.database.expired(table, now);
      for (const row of rows) await repositories.database.delete(row._id);
    }
    // Upload URLs can outlive their UI ticket. Delete only old, unattached blobs.
    const files = await repositories.database.storageFiles();
    for (const file of files) {
      if (file._creationTime > now - 86400000) continue;
      const attached = await repositories.database.first('media', 'storageId', file._id);
      if (!attached) await repositories.storage.delete(file._id);
    }
    return null;
  }
}
module.exports = { CleanupServiceImpl };
