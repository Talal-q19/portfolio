const nodemailer = require('nodemailer');
const { createOtpEmailTemplate } = require('../../templates/otp');
const { createEmailTemplate } = require('../../templates/contact');
const { HttpError } = require('../../middleware/errors');
function emailConfigured(config) {
  if (!config.smtp?.auth?.user || !config.smtp?.auth?.pass) throw new HttpError(503, 'Email delivery is not configured.');
}

const { EmailService } = require('../EmailService');
class EmailServiceImpl extends EmailService {
  constructor(config, injectedTransport) { super(); Object.assign(this, { config, injectedTransport, transport: injectedTransport || nodemailer.createTransport(config.smtp) }); }
  async sendContact({ name, email, message }) {
    const { config, injectedTransport, transport } = this;
    // Injected test transports intentionally do not require real credentials.
    if (!injectedTransport) emailConfigured(config);
    await transport.sendMail({
      from: { name: config.fromName, address: config.smtp.auth.user },
      to: config.to, replyTo: email,
      subject: `New portfolio contact from ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, '', 'Message:', message].join('\n'),
      html: createEmailTemplate({ name, email, message }),
    });
  }
  async sendOtp({ email, code, purpose }) {
    const { config, injectedTransport, transport } = this;
    if (!injectedTransport) emailConfigured(config);
    await transport.sendMail({
      from: { name: config.fromName, address: config.smtp.auth.user }, to: email,
      subject: purpose === 'login' ? 'Portfolio Studio login code' : 'Portfolio Studio password reset code',
      text: `Your verification code is ${code}. It expires in 5 minutes. If you did not request this code, ignore this email.`,
      html: createOtpEmailTemplate({ code, purpose }),
    });
  }
}
const createEmailService = (config, transport) => { const service = new EmailServiceImpl(config, transport); return service.sendContact.bind(service); };
const createOtpEmailService = (config, transport) => { const service = new EmailServiceImpl(config, transport); return service.sendOtp.bind(service); };
module.exports = { EmailServiceImpl, createEmailService, createOtpEmailService };
