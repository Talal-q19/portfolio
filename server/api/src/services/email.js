const nodemailer = require('nodemailer');
const { createEmailTemplate } = require('../templates/contact');

function createEmailService(config, transport = nodemailer.createTransport(config.smtp)) {
  return async ({ name, email, message }) => {
    await transport.sendMail({
      from: { name: config.fromName, address: config.smtp.auth.user },
      to: config.to, replyTo: email,
      subject: `New portfolio contact from ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, '', 'Message:', message].join('\n'),
      html: createEmailTemplate({ name, email, message }),
    });
  };
}
function createOtpEmailService(config, transport = nodemailer.createTransport(config.smtp)) {
  return async ({ email, code, purpose }) => {
    await transport.sendMail({
      from: { name: config.fromName, address: config.smtp.auth.user }, to: email,
      subject: purpose === 'login' ? 'Portfolio Studio login code' : 'Portfolio Studio password reset code',
      text: `Your verification code is ${code}. It expires in 5 minutes. If you did not request this code, ignore this email.`,
    });
  };
}
module.exports = { createEmailService, createOtpEmailService };
