const express = require('express');
const { ACCESS_SECONDS, REFRESH_SECONDS } = require('../config/auth');
const { cookies, guardAdminRequest } = require('../middleware/admin-request');
const { AuthRequest } = require('../dtos/request/AuthRequest');
const { LoginRequest } = require('../dtos/request/LoginRequest');
const { OtpRequest } = require('../dtos/request/OtpRequest');
const { ForgotPasswordRequest } = require('../dtos/request/ForgotPasswordRequest');
const { PasswordResetRequest } = require('../dtos/request/PasswordResetRequest');
const { AuthResponse } = require('../dtos/response/AuthResponse');
const { ApiResponse } = require('../dtos/response/ApiResponse');

// Base path: /api/admin/auth
class AdminAuthController {
  constructor(config, service) {
    this.config = config;
    this.service = service;
  }

  routes() {
    const router = express.Router();
    const { config, service } = this;
    const options = {
      httpOnly: true,
      secure: config.environment === 'production',
      sameSite: 'strict',
      path: '/api/admin',
    };

    const setTokens = (res, tokens) => {
      res.cookie('portfolio_access', tokens.access, { ...options, maxAge: ACCESS_SECONDS * 1000 });
      res.cookie('portfolio_refresh', tokens.refresh, { ...options, maxAge: REFRESH_SECONDS * 1000 });
    };

    const clear = res => {
      for (const name of ['portfolio_access', 'portfolio_refresh']) {
        res.clearCookie(name, options);
      }
    };

    // Shared request guards and parsing.
    router.use((req, res, next) => {
      res.set('Cache-Control', 'no-store');

      try {
        guardAdminRequest(config, req);
        next();
      } catch (error) {
        next(error);
      }
    });

    router.use(async (req, res, next) => {
      try {
        await service.limit(`ip:${req.ip}`, 40);
        next();
      } catch (error) {
        if (error.status === 429) res.set('Retry-After', '900');
        next(error);
      }
    });

    router.use(express.json({ limit: '4kb' }));

    const route = handler => async (req, res, next) => {
      try {
        AuthRequest.from(req);
        await handler(req, res);
      } catch (error) {
        if (error.status === 429) res.set('Retry-After', '900');
        next(error);
      }
    };


    // POST /api/admin/auth/login
    router.post('/login', route(async (req, res) => {
      const request = LoginRequest.from(req.body);
      const response = await service.login(request, req.ip);

      res.json(response);
    }));


    // POST /api/admin/auth/login/verify
    router.post('/login/verify', route(async (req, res) => {
      const request = OtpRequest.from(req.body);
      const tokens = await service.verifyLogin(request);

      setTokens(res, tokens);
      res.json(ApiResponse.success());
    }));


    // POST /api/admin/auth/forgot-password
    router.post('/forgot-password', route(async (req, res) => {
      const request = ForgotPasswordRequest.from(req.body);
      const response = await service.forgot(request);

      res.json(response);
    }));


    // POST /api/admin/auth/forgot-password/verify
    router.post('/forgot-password/verify', route(async (req, res) => {
      const request = OtpRequest.from(req.body);
      const response = await service.verifyReset(request);

      res.json(response);
    }));


    // POST /api/admin/auth/reset-password
    router.post('/reset-password', route(async (req, res) => {
      const request = PasswordResetRequest.from(req.body);
      await service.reset(request);

      clear(res);
      res.json(ApiResponse.success());
    }));


    // POST /api/admin/auth/refresh
    router.post('/refresh', route(async (req, res) => {
      const refreshToken = cookies(req).portfolio_refresh;
      const tokens = await service.refresh(refreshToken);

      setTokens(res, tokens);
      res.json(ApiResponse.success());
    }));


    // POST /api/admin/auth/logout
    router.post('/logout', route(async (req, res) => {
      const { portfolio_access, portfolio_refresh } = cookies(req);
      await service.logout(portfolio_access, portfolio_refresh);

      clear(res);
      res.json(ApiResponse.success());
    }));


    // GET /api/admin/auth/session
    router.get('/session', route(async (req, res) => {
      const accessToken = cookies(req).portfolio_access;
      const admin = await service.verifyAccess(accessToken);

      res.json(AuthResponse.session(admin));
    }));

    return router;
  }
}

module.exports = { AdminAuthController };
