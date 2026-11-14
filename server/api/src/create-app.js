const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { createServices } = require('./config/application-context');
const { ContactController } = require('./controllers/ContactController');
const { ContentController } = require('./controllers/ContentController');
const { AdminAuthController } = require('./controllers/AdminAuthController');
const { HealthController } = require('./controllers/HealthController');
const { guardAdminRequest, cookies } = require('./middleware/admin-request');
const { HttpError, errorHandler } = require('./middleware/errors');

function createApp(config, dependencies = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy || false);
  const services = createServices(config, dependencies);
  const contactController = new ContactController(services.contact);
  app.get('/api/health', new HealthController().read);
  app.use(require('./middleware/proxy').verifiedProxy(config));
  const contactLimit = dependencies.store ? async (req, res, next) => {
    try {
      if (!await dependencies.store.limit(`contact:${req.ip}`, config.rateLimit, 900)) {
        res.set('Retry-After', '900');
        return next(new HttpError(429, 'Too many messages. Please try again later.'));
      }
      next();
    } catch (error) { next(error); }
  } : rateLimit({
    windowMs: 15 * 60 * 1000, limit: config.rateLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Too many messages. Please try again later.' },
  });
  app.post('/api/contact', contactLimit, (req, res, next) => {
    if (!req.is('application/json')) return next(new HttpError(415, 'Use application/json.'));
    next();
  }, express.json({ limit: '16kb' }), contactController.send.bind(contactController));
  if (dependencies.auth) {
    app.use('/api/admin/auth', new AdminAuthController(config, dependencies.auth).routes());
    dependencies = { ...dependencies, verifyAdmin: async req => {
      guardAdminRequest(config, req);
      return dependencies.auth.verifyAccess(cookies(req).portfolio_access);
    } };
  }
  app.use('/api', new ContentController(services.content, dependencies.verifyAdmin).routes());
  app.use((req, res) => res.status(404).json({ success: false, message: 'Not found.' }));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
