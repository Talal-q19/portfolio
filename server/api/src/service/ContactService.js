// JavaScript service contract. Implementations are wired in config/application-context.js.
class ContactService {
  send() { throw new Error('ContactService.send must be implemented.'); }
}
module.exports = { ContactService };
