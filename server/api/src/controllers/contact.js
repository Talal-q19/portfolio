const { validateContact } = require('../validators/contact');

function contactController({ sendEmail, verifyCaptcha }) {
  return async (req, res) => {
    const data = validateContact(req.body);
    await verifyCaptcha(req.body.captchaToken);
    await sendEmail(data);
    res.json({ success: true, message: 'Message sent successfully!' });
  };
}
module.exports = { contactController };
