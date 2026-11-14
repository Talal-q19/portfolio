// JavaScript service contract. Implementations are wired in config/application-context.js.
class DataMigrationService {
  execute() { throw new Error('DataMigrationService.execute must be implemented.'); }
}
module.exports = { DataMigrationService };
