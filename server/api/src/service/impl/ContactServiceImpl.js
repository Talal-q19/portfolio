const { ContactService } = require('../ContactService');
class ContactServiceImpl extends ContactService {
  constructor({ email, captcha }) { super(); Object.assign(this, { email, captcha }); }
  async send({ captchaToken, ...message }) {
    await this.captcha.verify(captchaToken);
    await this.email.sendContact(message);
  }
}
module.exports = { ContactServiceImpl };
