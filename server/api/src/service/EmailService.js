// JavaScript service contract. Implementations are wired in config/application-context.js.
class EmailService {
  sendContact() { throw new Error('EmailService.sendContact must be implemented.'); }
  sendOtp() { throw new Error('EmailService.sendOtp must be implemented.'); }
}
module.exports = { EmailService };
