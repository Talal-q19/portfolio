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
  const captchaEnabled = boolean('RECAPTCHA_ENABLED', Boolean(env.RECAPTCHA_SECRET_KEY));
  if (captchaEnabled && !env.RECAPTCHA_SECRET_KEY) throw new Error('Missing RECAPTCHA_SECRET_KEY');
  const smtpPort = integer('SMTP_PORT', 465);
  const environment = env.NODE_ENV || 'development';
  return {
    convexUrl: (env.CONVEX_HTTP_URL || '').replace(/\/$/, ''),
    convexSecret: env.CONVEX_SERVICE_SECRET,
    proxySecret: env.API_PROXY_SECRET,
    environment,
    host: environment === 'development' ? '127.0.0.1' : '0.0.0.0',
    auth: {
      secret: env.AUTH_JWT_SECRET,
      origin: env.ADMIN_ORIGIN || 'http://localhost:3000',
      origins: (env.ADMIN_ORIGINS || env.ADMIN_ORIGIN || 'http://localhost:3000').split(',').map(value => value.trim()),
    },
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
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), quiet: true });
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
  return loadConfig();
}
module.exports = { loadConfig, readConfig };
