const { createConvexService, ConvexAuthStore, convexRepository } = require('./convex');
const { createAdminAuth } = require('./admin-auth');
const { createOtpEmailService } = require('./email');
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
  const call = createConvexService(config);
  await call('health');
  const store = new ConvexAuthStore(call);
  const auth = createAdminAuth(config, { repository: convexRepository(call), store, sendOtp: createOtpEmailService(config) });
  return { auth, call, store, close: async () => {} };
}
module.exports = { authRuntime, validateAdminOrigins };
