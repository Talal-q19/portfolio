const { Pool } = require('pg');
const { createClient } = require('redis');
const { AuthStore } = require('./auth-store');
const { adminRepository } = require('./admin-repository');
const { createAdminAuth } = require('./admin-auth');
const { createOtpEmailService } = require('./email');
async function authRuntime(config) {
  for (const [name, value] of Object.entries({ DATABASE_URL: config.auth.databaseUrl, AUTH_JWT_SECRET: config.auth.secret, CMS_ADMIN_TOKEN: config.auth.cmsToken })) {
    if (!value) throw new Error(`Missing ${name}; see docs/admin-auth.md.`);
  }
  const origin = new URL(config.auth.origin);
  if (origin.origin !== config.auth.origin || (config.environment === 'production' && origin.protocol !== 'https:')) throw new Error('ADMIN_ORIGIN must be an exact origin, using HTTPS in production.');
  const pool = new Pool({ connectionString: config.auth.databaseUrl, max: 10, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  pool.on('error', () => console.error('PostgreSQL connection error.'));
  const redis = createClient({ RESP: 2, url: config.auth.redisUrl, disableOfflineQueue: true, socket: { connectTimeout: 5000, reconnectStrategy: retries => Math.min(100 * retries, 3000) } });
  redis.on('error', () => console.error('Redis connection error.'));
  try {
    await pool.query('SELECT id FROM portfolio_admins LIMIT 0');
    await redis.connect();
    const auth = createAdminAuth(config, { repository: adminRepository(pool), store: new AuthStore(redis), sendOtp: createOtpEmailService(config) });
    return { auth, close: async () => { redis.destroy(); await pool.end(); } };
  } catch (error) { redis.destroy(); await pool.end(); throw error; }
}
module.exports = { authRuntime };
