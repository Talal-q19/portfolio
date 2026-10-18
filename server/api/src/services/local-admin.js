// Temporary local editing bridge. Phase 5 supplies a real browser session verifier.
const loopback = host => ['localhost', '127.0.0.1', '::1', '[::1]', '::ffff:127.0.0.1'].includes(host);
function localHost(value) {
  try { return loopback(new URL(`http://${value}`).hostname); } catch { return false; }
}
function localAdminIdentity(config, req) {
  if (!config.localAdminEnabled || config.environment !== 'development' || !config.cmsLocalAdminToken) return null;
  if (!loopback(req.socket.remoteAddress) || !localHost(req.headers.host)) return null;
  if (req.headers['x-forwarded-host'] && !localHost(req.headers['x-forwarded-host'])) return null;
  if (req.headers.origin) {
    try { if (!loopback(new URL(req.headers.origin).hostname)) return null; } catch { return null; }
  }
  return { role: 'portfolio-admin', accessToken: config.cmsLocalAdminToken };
}
module.exports = { localAdminIdentity };
