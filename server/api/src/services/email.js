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
module.exports = { createEmailService };
