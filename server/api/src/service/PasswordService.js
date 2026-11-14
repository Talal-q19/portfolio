// JavaScript service contract. Implementations are wired in config/application-context.js.
class PasswordService {
  hash() { throw new Error('PasswordService.hash must be implemented.'); }
  verify() { throw new Error('PasswordService.verify must be implemented.'); }
}
module.exports = { PasswordService };
