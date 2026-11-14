const { plain } = require('./RecordResponse');
class MediaResponse {
  static async from(row, storage) {
    if (!row) return null;
    const { storageId, checksum, ...data } = plain(row);
    return { ...data, url: await storage.getUrl(storageId) };
  }
}
module.exports = { MediaResponse };
