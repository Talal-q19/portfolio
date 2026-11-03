const { createHmac, timingSafeEqual } = require('node:crypto');
const { isIP } = require('node:net');
const { HttpError } = require('./errors');
function verifiedProxy(config) {
  if (config.environment === 'production' && (!config.proxySecret || config.proxySecret.length < 32)) throw new Error('Configure API_PROXY_SECRET (at least 32 bytes) on frontend and backend.');
  return (req, res, next) => {
    if (!config.proxySecret) return next();
    const ip = req.get('x-portfolio-ip');
    const timestamp = req.get('x-portfolio-time');
    const signature = req.get('x-portfolio-signature') || '';
    const expected = createHmac('sha256', config.proxySecret).update(`${timestamp}\n${ip}\n${req.method}\n${req.originalUrl}`).digest('hex');
    if (!isIP(ip || '') || !/^\d+$/.test(timestamp || '') || Math.abs(Date.now() - Number(timestamp)) > 60000 || !/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return next(new HttpError(403, 'Invalid API proxy request.'));
    Object.defineProperty(req, 'ip', { value: ip });
    next();
  };
}
module.exports = { verifiedProxy };
