const express = require('express');
const { ContentValidationError } = require('@portfolio/content-contract');
const { ContentRequest } = require('../dtos/request/ContentRequest');
const { HttpError } = require('../middleware/errors');

// Base path: /api
class ContentController {
  constructor(service, verifyAdmin) {
    this.service = service;
    this.verifyAdmin = verifyAdmin;
  }

  routes() {
    const router = express.Router();

    const route = handler => async (req, res, next) => {
      res.set('Cache-Control', 'no-store');

      try {
        await handler(req, res);
      } catch (error) {
        next(error instanceof ContentValidationError
          ? new HttpError(422, error.message, error.fields)
          : error);
      }
    };


    // GET /api/content
    router.get('/content', route(async (req, res) => {
      const query = ContentRequest.query(req.query);
      const response = await this.service.read(query);

      res.json(response);
    }));


    // Authenticate before parsing any privileged request body.
    router.use('/admin', async (req, res, next) => {
      res.set('Cache-Control', 'no-store');

      try {
        const identity = this.verifyAdmin ? await this.verifyAdmin(req) : null;

        if (!identity || identity.role !== 'portfolio-admin') {
          throw new HttpError(401, 'Administrator authentication is required.');
        }

        req.admin = identity;
        next();
      } catch (error) {
        next(error);
      }
    });

    router.use('/admin', express.json({ limit: '1mb', type: 'application/json' }));


    // GET /api/admin/categories
    router.get('/admin/categories', route(async (req, res) => {
      const query = ContentRequest.resourceQuery('categories', req.query);
      const response = await this.service.list('categories', query);

      res.json(response);
    }));


    // GET /api/admin/categories/:id
    router.get('/admin/categories/:id', route(async (req, res) => {
      const response = await this.service.get('categories', req.params.id);

      res.json(response);
    }));


    // POST /api/admin/categories
    router.post('/admin/categories', route(async (req, res) => {
      const request = ContentRequest.category(req.body);
      const response = await this.service.create('categories', request);

      res.status(201).json(response);
    }));


    // PATCH /api/admin/categories/:id
    router.patch('/admin/categories/:id', route(async (req, res) => {
      const request = ContentRequest.category(req.body);
      const response = await this.service.update('categories', req.params.id, request);

      res.json(response);
    }));


    // DELETE /api/admin/categories/:id
    router.delete('/admin/categories/:id', route(async (req, res) => {
      const response = await this.service.remove('categories', req.params.id);

      res.json(response);
    }));


    // GET /api/admin/content
    router.get('/admin/content', route(async (req, res) => {
      const query = ContentRequest.resourceQuery('content', req.query);
      const response = await this.service.list('content', query);

      res.json(response);
    }));


    // GET /api/admin/content/:id
    router.get('/admin/content/:id', route(async (req, res) => {
      const response = await this.service.get('content', req.params.id);

      res.json(response);
    }));


    // POST /api/admin/content
    router.post('/admin/content', route(async (req, res) => {
      const request = ContentRequest.body(req.body);
      const response = await this.service.create('content', request);

      res.status(201).json(response);
    }));


    // PATCH /api/admin/content/:id
    router.patch('/admin/content/:id', route(async (req, res) => {
      const request = ContentRequest.body(req.body, true);
      const response = await this.service.update('content', req.params.id, request);

      res.json(response);
    }));


    // DELETE /api/admin/content/:id
    router.delete('/admin/content/:id', route(async (req, res) => {
      const response = await this.service.remove('content', req.params.id);

      res.json(response);
    }));


    // POST /api/admin/media/upload-ticket
    router.post('/admin/media/upload-ticket', route(async (req, res) => {
      const response = await this.service.upload('upload-ticket', req.body);

      res.json(response);
    }));


    // POST /api/admin/media/complete-upload
    router.post('/admin/media/complete-upload', route(async (req, res) => {
      const response = await this.service.upload('complete-upload', req.body);

      res.json(response);
    }));


    // GET /api/admin/media
    router.get('/admin/media', route(async (req, res) => {
      const query = ContentRequest.resourceQuery('media', req.query);
      const response = await this.service.list('media', query);

      res.json(response);
    }));


    // GET /api/admin/media/:id
    router.get('/admin/media/:id', route(async (req, res) => {
      const response = await this.service.get('media', req.params.id);

      res.json(response);
    }));


    // POST /api/admin/media
    router.post('/admin/media', express.raw({ type: 'multipart/form-data', limit: '9mb' }), route(async (req, res) => {
      if (!req.is('multipart/form-data') || !Buffer.isBuffer(req.body)) {
        throw new HttpError(415, 'Use multipart/form-data with one files field.');
      }

      const response = await this.service.create('media', req.body, {
        contentType: req.headers['content-type'],
      });

      res.status(201).json(response);
    }));


    // DELETE /api/admin/media/:id
    router.delete('/admin/media/:id', route(async (req, res) => {
      const response = await this.service.remove('media', req.params.id);

      res.json(response);
    }));

    return router;
  }
}

module.exports = { ContentController };
