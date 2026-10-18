const dotenv = require('dotenv');
const path = require('node:path');

function loadConfig(env = process.env) {
  const integer = (key, fallback, max = 65535) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const boolean = (key, fallback) => {
    if (!env[key]) return fallback;
    if (!['true', 'false'].includes(env[key])) throw new Error(`Invalid ${key}`);
    return env[key] === 'true';
  };
  for (const key of ['SMTP_USER', 'SMTP_PASS']) {
    if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
  }
  const captchaEnabled = boolean('RECAPTCHA_ENABLED', Boolean(env.RECAPTCHA_SECRET_KEY));
  if (captchaEnabled && !env.RECAPTCHA_SECRET_KEY) throw new Error('Missing RECAPTCHA_SECRET_KEY');
  const smtpPort = integer('SMTP_PORT', 465);
  const environment = env.NODE_ENV || 'development';
  const localAdminEnabled = boolean('LOCAL_ADMIN_ENABLED', false);
  if (localAdminEnabled) {
    if (environment !== 'development') throw new Error('LOCAL_ADMIN_ENABLED is only available in development.');
    const cms = new URL(env.CMS_INTERNAL_URL || 'http://127.0.0.1:1337');
    if (!['localhost', '127.0.0.1', '[::1]'].includes(cms.hostname)) throw new Error('Local admin editing requires a loopback CMS URL.');
    if (!env.CMS_LOCAL_ADMIN_TOKEN?.trim()) throw new Error('Run npm run setup:admin to configure local editing.');
  }
  return {
    environment, localAdminEnabled, cmsLocalAdminToken: env.CMS_LOCAL_ADMIN_TOKEN,
    host: localAdminEnabled ? '127.0.0.1' : '0.0.0.0',
    cmsUrl: (env.CMS_INTERNAL_URL || 'http://127.0.0.1:1337').replace(/\/$/, ''),
    cmsReadToken: env.CMS_READ_TOKEN,
    cmsTimeout: integer('CMS_TIMEOUT_MS', 10000, 60000),
    port: integer('PORT', 4000),
    // Set an exact hop count only behind a trusted, fixed reverse proxy.
    trustProxy: env.TRUST_PROXY_HOPS ? integer('TRUST_PROXY_HOPS', 1, 10) : false,
    smtp: {
      host: env.SMTP_HOST || 'smtp.gmail.com', port: smtpPort,
      secure: boolean('SMTP_SECURE', smtpPort === 465),
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { rejectUnauthorized: boolean('SMTP_TLS_REJECT_UNAUTHORIZED', true) },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    },
    fromName: env.CONTACT_FROM_NAME || 'Portfolio Contact',
    to: env.CONTACT_TO_EMAIL || env.SMTP_USER,
    captchaEnabled, captchaSecret: env.RECAPTCHA_SECRET_KEY,
    captchaHostname: env.RECAPTCHA_EXPECTED_HOSTNAME,
    rateLimit: integer('CONTACT_RATE_LIMIT', 5, 1000),
  };
}

function readConfig() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
  return loadConfig();
}
module.exports = { loadConfig, readConfig };
