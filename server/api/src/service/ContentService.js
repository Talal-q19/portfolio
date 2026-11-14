// JavaScript service contract. Implementations are wired in config/application-context.js.
class ContentService {
  read() { throw new Error('ContentService.read must be implemented.'); }
  list() { throw new Error('ContentService.list must be implemented.'); }
  get() { throw new Error('ContentService.get must be implemented.'); }
  create() { throw new Error('ContentService.create must be implemented.'); }
  update() { throw new Error('ContentService.update must be implemented.'); }
  remove() { throw new Error('ContentService.remove must be implemented.'); }
  upload() { throw new Error('ContentService.upload must be implemented.'); }
}
module.exports = { ContentService };
