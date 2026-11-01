const express = require('express');
const { HttpError } = require('../middleware/errors');
const { ACCESS_SECONDS, REFRESH_SECONDS } = require('../services/admin-auth');
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim().split(/=(.*)/s)).filter(pair => pair[0]).map(([key, value]) => [key, value]));
}
function guardAdminRequest(config, req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  // A custom header forces cross-origin browsers to preflight; this API allows no CORS.
  if (req.get('x-admin-request') !== '1') throw new HttpError(403, 'Invalid admin request.');
  if (req.headers.origin && req.headers.origin !== config.auth.origin) throw new HttpError(403, 'Invalid request origin.');
}
function authRoutes(config, auth) {
  const router = express.Router();
  const options = { httpOnly: true, secure: config.environment === 'production', sameSite: 'strict', path: '/api/admin' };
  function setTokens(res, tokens) {
    res.cookie('portfolio_access', tokens.access, { ...options, maxAge: ACCESS_SECONDS * 1000 });
    res.cookie('portfolio_refresh', tokens.refresh, { ...options, maxAge: REFRESH_SECONDS * 1000 });
  }
  const clear = res => { for (const name of ['portfolio_access', 'portfolio_refresh']) res.clearCookie(name, options); };
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try { guardAdminRequest(config, req); next(); } catch (error) { next(error); }
  });
  router.use(async (req, res, next) => {
    try { await auth.limit(`ip:${req.ip}`, 40); next(); }
    catch (error) { if (error.status === 429) res.set('Retry-After', '900'); next(error); }
  });
  router.use(express.json({ limit: '4kb' }));
  const route = fn => async (req, res, next) => {
    try { if (req.method === 'POST' && (!req.is('application/json') || !req.body || Array.isArray(req.body))) throw new HttpError(415, 'Use a JSON object.'); await fn(req, res); }
    catch (error) { if (error.status === 429) res.set('Retry-After', '900'); next(error); }
  };
  router.post('/login', route(async (req, res) => res.json(await auth.login(req.body, req.ip))));
  router.post('/login/verify', route(async (req, res) => { setTokens(res, await auth.verifyLogin(req.body)); res.json({ success: true }); }));
  router.post('/forgot-password', route(async (req, res) => res.json(await auth.forgot(req.body))));
  router.post('/forgot-password/verify', route(async (req, res) => res.json(await auth.verifyReset(req.body))));
  router.post('/reset-password', route(async (req, res) => { await auth.reset(req.body); clear(res); res.json({ success: true }); }));
  router.post('/refresh', route(async (req, res) => { setTokens(res, await auth.refresh(cookies(req).portfolio_refresh)); res.json({ success: true }); }));
  router.post('/logout', route(async (req, res) => { const c = cookies(req); await auth.logout(c.portfolio_access, c.portfolio_refresh); clear(res); res.json({ success: true }); }));
  router.get('/session', route(async (req, res) => { const admin = await auth.verifyAccess(cookies(req).portfolio_access); res.json({ username: admin.username }); }));
  return router;
}
module.exports = { authRoutes, cookies, guardAdminRequest };
