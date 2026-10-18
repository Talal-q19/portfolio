const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { createEmailService } = require('./services/email');
const { createCaptchaService } = require('./services/captcha');
const { contactController } = require('./controllers/contact');
const { HttpError, errorHandler } = require('./middleware/errors');

function createApp(config, dependencies = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy || false);
  app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
  app.post('/api/contact', rateLimit({
    windowMs: 15 * 60 * 1000, limit: config.rateLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Too many messages. Please try again later.' },
  }), (req, res, next) => {
    if (!req.is('application/json')) return next(new HttpError(415, 'Use application/json.'));
    next();
  }, express.json({ limit: '16kb' }), contactController({
    sendEmail: dependencies.sendEmail || createEmailService(config),
    verifyCaptcha: dependencies.verifyCaptcha || createCaptchaService(config),
  }));
  app.use('/api', require('./controllers/content').contentRoutes(config, dependencies));
  app.use((req, res) => res.status(404).json({ success: false, message: 'Not found.' }));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
