const { createConvexService, ConvexAuthStore, convexRepository } = require('./convex');
const { createAdminAuth } = require('./admin-auth');
const { createOtpEmailService } = require('./email');
async function authRuntime(config) {
  for (const [name, value] of Object.entries({ CONVEX_HTTP_URL: config.convexUrl, CONVEX_SERVICE_SECRET: config.convexSecret, AUTH_JWT_SECRET: config.auth.secret })) {
    if (!value) throw new Error(`Missing ${name}; see docs/deployment.md.`);
  }
  if (Buffer.byteLength(config.convexSecret) < 32) throw new Error('CONVEX_SERVICE_SECRET must contain at least 32 bytes.');
  const origin = new URL(config.auth.origin);
  if (origin.origin !== config.auth.origin || (config.environment === 'production' && origin.protocol !== 'https:')) throw new Error('ADMIN_ORIGIN must be an exact origin, using HTTPS in production.');
  const call = createConvexService(config);
  await call('health');
  const store = new ConvexAuthStore(call);
  const auth = createAdminAuth(config, { repository: convexRepository(call), store, sendOtp: createOtpEmailService(config) });
  return { auth, call, store, close: async () => {} };
}
module.exports = { authRuntime };
