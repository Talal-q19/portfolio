const { createConvexClient } = require('../repository/ConvexClient');
const { ContentRepository } = require('../repository/ContentRepository');
const { AdminRepository } = require('../repository/AdminRepository');
const { AuthStateRepository } = require('../repository/AuthStateRepository');
const { AdminAuthServiceImpl } = require('../service/impl/AdminAuthServiceImpl');
const { ContentServiceImpl } = require('../service/impl/ContentServiceImpl');
const { ContactServiceImpl } = require('../service/impl/ContactServiceImpl');
const { EmailServiceImpl } = require('../service/impl/EmailServiceImpl');
const { CaptchaServiceImpl } = require('../service/impl/CaptchaServiceImpl');

function createServices(config, dependencies = {}) {
  const call = dependencies.call || createConvexClient(config);
  const email = dependencies.email || (dependencies.sendEmail ? { sendContact: dependencies.sendEmail } : new EmailServiceImpl(config));
  const captcha = dependencies.captcha || (dependencies.verifyCaptcha ? { verify: dependencies.verifyCaptcha } : new CaptchaServiceImpl(config));
  const repository = dependencies.contentRepository || (dependencies.content ? { request: (path, options = {}) => dependencies.content(path, options) } : new ContentRepository(call));
  return {
    contact: dependencies.contactService || new ContactServiceImpl({ email, captcha }),
    content: dependencies.contentService || new ContentServiceImpl(repository),
  };
}

function validateAdminOrigins(config) {
  for (const value of config.auth.origins || [config.auth.origin]) {
    let origin;
    try { origin = new URL(value); } catch { throw new Error('ADMIN_ORIGINS must contain exact HTTP(S) origins.'); }
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
    if (origin.origin !== value || !['http:', 'https:'].includes(origin.protocol) || (config.environment === 'production' && origin.protocol !== 'https:' && !loopback)) {
      throw new Error('ADMIN_ORIGINS must contain exact origins, using HTTPS in production except for explicitly allowed loopback addresses.');
    }
  }
}

async function authRuntime(config) {
  for (const [name, value] of Object.entries({ CONVEX_HTTP_URL: config.convexUrl, CONVEX_SERVICE_SECRET: config.convexSecret, AUTH_JWT_SECRET: config.auth.secret })) {
    if (!value) throw new Error(`Missing ${name}; see docs/deployment.md.`);
  }
  if (Buffer.byteLength(config.convexSecret) < 32) throw new Error('CONVEX_SERVICE_SECRET must contain at least 32 bytes.');
  validateAdminOrigins(config);
  const call = createConvexClient(config);
  await call('health');
  const store = new AuthStateRepository(call);
  const email = new EmailServiceImpl(config);
  const auth = new AdminAuthServiceImpl(config, { repository: new AdminRepository(call), store, sendOtp: email.sendOtp.bind(email) });
  return { auth, call, store, close: async () => {} };
}
module.exports = { createServices, authRuntime, validateAdminOrigins };
