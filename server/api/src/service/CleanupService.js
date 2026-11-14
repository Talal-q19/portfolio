// JavaScript service contract. Implementations are wired in config/application-context.js.
class CleanupService {
  execute() { throw new Error('CleanupService.execute must be implemented.'); }
}
module.exports = { CleanupService };
