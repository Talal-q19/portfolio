const { HttpError } = require('./errors');

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim().split(/=(.*)/s)).filter(pair => pair[0]).map(([key, value]) => [key, value]));
}

function guardAdminRequest(config, req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  if (req.get('x-admin-request') !== '1') throw new HttpError(403, 'Invalid admin request.');
  const allowedOrigins = config.auth.origins || [config.auth.origin];
  if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) throw new HttpError(403, 'Invalid request origin.');
}
module.exports = { cookies, guardAdminRequest };
