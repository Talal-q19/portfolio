// JavaScript service contract. Implementations are wired in config/application-context.js.
class CaptchaService {
  verify() { throw new Error('CaptchaService.verify must be implemented.'); }
}
module.exports = { CaptchaService };
