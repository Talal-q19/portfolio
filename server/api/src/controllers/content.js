const express = require('express');
const { ContentValidationError, validatePayload, validateCategory } = require('../validators/content');
const { queryOptions, contentBody, categoryBody, shape } = require('@portfolio/content-contract/api');
const { HttpError } = require('../middleware/errors');
const { createConvexService, createContentService } = require('../services/convex');
function contentRoutes(config, dependencies = {}) {
  const router = express.Router();
  const cms = dependencies.content || createContentService(createConvexService(config));
  const route = fn => async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try { await fn(req, res); }
    catch (error) { next(error instanceof ContentValidationError ? new HttpError(422, error.message, error.fields) : error); }
  };
  router.get('/content', route(async (req, res) => {
    queryOptions(req.query);
    res.json(await cms(`read?${new URLSearchParams(req.query)}`));
  }));
  // Every management request requires a verified browser session.
  router.use('/admin', async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      const identity = dependencies.verifyAdmin
        ? await dependencies.verifyAdmin(req)
        : null;
      if (!identity || identity.role !== 'portfolio-admin') throw new HttpError(401, 'Administrator authentication is required.');
      req.admin = identity;
      req.cms = (path, options = {}) => cms(`admin/${path}`, options);
      // Continue only after verification, before parsing privileged request bodies.
      next();
    } catch (error) { next(error); }
  });
  router.use('/admin', express.json({ limit: '1mb', type: 'application/json' }));
  for (const operation of ['upload-ticket', 'complete-upload']) {
    router.post(`/admin/media/${operation}`, route(async (req, res) => {
      res.json(await req.cms(`media/${operation}`, { method: 'POST', body: req.body }));
    }));
  }
  async function validateContent(req, updating) {
    contentBody(req.body, updating);
    if (updating && req.body.operation !== 'update') return;
    const previous = updating ? (await req.cms(`content/${encodeURIComponent(req.params.id)}`)).item : null;
    const categories = (await req.cms('categories')).categories;
    const c = categories.find(c => c.slug === (req.body.category || previous?.category));
    if (!c) throw new ContentValidationError({ category: 'Category does not exist.' });
    await validatePayload(c.templateKey, { ...previous?.data, ...req.body.data }, {
      media: async value => {
        const id = value?.id || value;
        if (!Number.isInteger(id) || id < 1) return null;
        return (await req.cms(`media/${id}`)).item;
      },
      skillGroup: async value => {
        if (typeof value !== 'string' || !/^[a-z0-9]+$/.test(value)) return false;
        const item = (await req.cms(`content/${value}`)).item;
        return categories.find(c => c.slug === item.category)?.templateKey === 'skill-groups';
      },
    });
  }
  for (const resource of ['categories', 'content', 'media']) {
    router.get(`/admin/${resource}`, route(async (req, res) => {
      if (resource === 'content') queryOptions(req.query, true);
      else if (resource === 'categories') shape(req.query, []);
      else { shape(req.query, ['page', 'pageSize']); queryOptions({ category: 'media', ...req.query }); }
      res.json(await req.cms(`${resource}?${new URLSearchParams(req.query)}`));
    }));
    router.get(`/admin/${resource}/:id`, route(async (req, res) => res.json(await req.cms(`${resource}/${encodeURIComponent(req.params.id)}`))));
    router.post(`/admin/${resource}`, ...(resource === 'media' ? [express.raw({ type: 'multipart/form-data', limit: '9mb' })] : []), route(async (req, res) => {
      if (resource === 'content') await validateContent(req, false);
      if (resource === 'categories') { categoryBody(req.body); validateCategory({ displayOrder: 0, visible: true, ...req.body }); }
      if (resource === 'media' && (!req.is('multipart/form-data') || !Buffer.isBuffer(req.body))) throw new HttpError(415, 'Use multipart/form-data with one files field.');
      res.status(201).json(await req.cms(resource, { method: 'POST', body: req.body, ...(resource === 'media' ? { contentType: req.headers['content-type'] } : {}) }));
    }));
    if (resource !== 'media') router.patch(`/admin/${resource}/:id`, route(async (req, res) => {
      if (resource === 'content') await validateContent(req, true);
      else {
        categoryBody(req.body);
        const previous = (await req.cms(`categories/${encodeURIComponent(req.params.id)}`)).category;
        validateCategory({ ...previous, ...req.body });
      }
      res.json(await req.cms(`${resource}/${encodeURIComponent(req.params.id)}`, { method: 'PATCH', body: req.body }));
    }));
    router.delete(`/admin/${resource}/:id`, route(async (req, res) => res.json(await req.cms(`${resource}/${encodeURIComponent(req.params.id)}`, { method: 'DELETE' }))));
  }
  return router;
}
module.exports = { contentRoutes };
