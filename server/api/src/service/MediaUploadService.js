// JavaScript service contract. Implementations are wired in config/application-context.js.
class MediaUploadService {
  complete() { throw new Error('MediaUploadService.complete must be implemented.'); }
}
module.exports = { MediaUploadService };
