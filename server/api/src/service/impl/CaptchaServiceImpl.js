const { CaptchaService } = require('../CaptchaService');
const { HttpError } = require('../../middleware/errors');

class CaptchaServiceImpl extends CaptchaService {
  constructor(config, fetchImpl = fetch) { super(); this.config = config; this.fetchImpl = fetchImpl; }
  async verify(token) {
    const { config, fetchImpl } = this;
    if (!config.captchaEnabled) return;
    if (typeof token !== 'string' || !token.trim() || token.length > 4096) {
      throw new HttpError(422, 'Please complete the CAPTCHA.');
    }
    let result;
    try {
      const response = await fetchImpl('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret: config.captchaSecret, response: token }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('CAPTCHA unavailable');
      result = await response.json();
      if (!result || typeof result.success !== 'boolean') throw new Error('Invalid CAPTCHA response');
    } catch {
      throw new HttpError(503, 'CAPTCHA verification unavailable. Please try again.');
    }
    if (result.success !== true || (config.captchaHostname && result.hostname !== config.captchaHostname)) {
      throw new HttpError(422, 'CAPTCHA verification failed. Please try again.');
    }
  }
}
const createCaptchaService = (config, fetchImpl) => { const service = new CaptchaServiceImpl(config, fetchImpl); return service.verify.bind(service); };
module.exports = { CaptchaServiceImpl, createCaptchaService };
