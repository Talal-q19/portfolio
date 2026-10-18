const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createStrapi } = require('@strapi/strapi');
const { CATEGORY, CONTENT, contentPopulate } = require('../src/portfolio/guard');
const { validatePayload, getFormMetadata } = require('@portfolio/content-contract');
const { importPortfolio } = require('../scripts/import-portfolio');
const { buildPortfolioSource } = require('../scripts/portfolio-source');

test('real Strapi persistence, CMS editor and migration invariants', { timeout: 240000 }, async t => {
  fs.mkdirSync(path.resolve('.tmp'), { recursive: true });
  const temp = fs.mkdtempSync(path.resolve('.tmp/cms-test-'));
  fs.mkdirSync(path.join(temp, 'public/uploads'), { recursive: true });
  Object.assign(process.env, {
    NODE_ENV: 'test', DATABASE_CLIENT: 'sqlite', DATABASE_FILENAME: path.join(temp, 'data.db'),
    CMS_PUBLIC_DIR: path.join(temp, 'public'), STRAPI_TELEMETRY_DISABLED: 'true',
    APP_KEYS: crypto.randomBytes(32).toString('hex'),
    ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'), API_TOKEN_SALT: crypto.randomBytes(32).toString('hex'),
    TRANSFER_TOKEN_SALT: crypto.randomBytes(32).toString('hex'), ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  });
  const cms = createStrapi({ appDir: process.cwd(), distDir: process.cwd() });
  try {
    await cms.load();
    await new Promise(resolve => cms.server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${cms.server.httpServer.address().port}`;
    const categories = await cms.db.query(CATEGORY).findMany();
    assert.equal(categories.length, 8);
    const category = slug => categories.find(c => c.slug === slug).documentId;
    const create = (slug, payload, extra = {}) => cms.documents(CONTENT).create({ data: {
      category: category(slug), payload: [{ __component: `payloads.${slug}`, ...payload }], ...extra,
    } });
    const invalid = promise => assert.rejects(promise, error => error.name === 'ValidationError');

    await t.test('shared metadata and validation reject incomplete/wrong/unknown payloads', async () => {
      assert.equal(getFormMetadata().version, 1);
      assert.equal(Object.values(getFormMetadata().templates.hero.fields).some(field => field.type === 'media'), false);
      await invalid(cms.documents(CONTENT).create({ data: { payload: [] } }));
      await invalid(create('hero', { heading: ' ', paragraph: 'Valid' }));
      await invalid(create('hero', { heading: 'Valid', paragraph: 'Valid', image: 1 }));
      await invalid(cms.documents(CONTENT).create({ data: { category: category('hero'), payload: [{ __component: 'payloads.experience' }] } }));
      await invalid(cms.documents(CONTENT).create({ data: { category: category('hero'), payload: [] } }));
      await invalid(cms.documents(CONTENT).create({ data: { category: category('hero'), payload: [{ __component: 'payloads.hero', heading: 'A', paragraph: 'B' }, { __component: 'payloads.hero', heading: 'A', paragraph: 'B' }] } }));
      assert.equal(await cms.db.query(CONTENT).count(), 0);
    });

    await t.test('concurrent singleton creation, publish versions, partial updates and category invariants', async () => {
      const attempts = await Promise.allSettled([create('hero', { heading: 'A', paragraph: 'B' }), create('hero', { heading: 'C', paragraph: 'D' })]);
      assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
      const hero = attempts.find(result => result.status === 'fulfilled').value;
      await cms.documents(CONTENT).publish({ documentId: hero.documentId });
      await cms.documents(CONTENT).update({ documentId: hero.documentId, data: { displayOrder: 3 } });
      await invalid(create('hero', { heading: 'Duplicate', paragraph: 'Duplicate' }));
      await invalid(cms.documents(CONTENT).update({ documentId: hero.documentId, data: { category: null } }));
      const read = await cms.documents(CONTENT).findOne({ documentId: hero.documentId, populate: contentPopulate(cms) });
      await invalid(cms.documents(CONTENT).update({ documentId: hero.documentId, data: { payload: [{ __component: 'payloads.hero', id: read.payload[0].id, heading: '' }] } }));
      await invalid(cms.documents(CONTENT).update({ documentId: hero.documentId, data: { category: category('experience') } }));
      await invalid(cms.documents(CATEGORY).update({ documentId: category('hero'), data: { templateKey: 'experience', cardinality: 'multiple' } }));
      await invalid(cms.documents(CATEGORY).delete({ documentId: category('hero') }));
      await invalid(cms.documents(CATEGORY).update({ documentId: category('experience'), data: { content: { connect: [{ documentId: hero.documentId }] } } }));
      await invalid(cms.documents(CATEGORY).clone({ documentId: category('hero'), data: { slug: 'cloned-hero' } }));
      await invalid(cms.documents(CATEGORY).update({ documentId: category('hero'), data: { slug: 'renamed' } }));
      await cms.documents(CONTENT).delete({ documentId: hero.documentId });
    });

    await t.test('built-in Content Manager uses the same persistence guard', async () => {
      const manager = cms.plugin('content-manager').service('document-manager');
      await invalid(manager.create(CONTENT, { data: { category: category('hero'), payload: [{ __component: 'payloads.hero', heading: 'Incomplete' }] } }));
      const hero = await manager.create(CONTENT, { data: { category: category('hero'), payload: [{ __component: 'payloads.hero', heading: 'Complete', paragraph: 'Complete' }] } });
      await invalid(manager.update(hero.documentId, CONTENT, { data: { payload: [{ __component: 'payloads.hero', heading: 'Complete', paragraph: ' ' }] } }));
      await manager.publish(hero.documentId, CONTENT);
      await cms.documents(CONTENT).delete({ documentId: hero.documentId });
    });

    await t.test('anonymous API access and public signup are disabled', async () => {
      for (const route of ['/api/contents', '/api/contents?status=draft', '/api/categories']) {
        const response = await fetch(base + route);
        assert.equal(response.status, 403);
      }
      assert.equal((await fetch(base + '/api/contents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: {} }) })).status, 403);
      const register = await fetch(base + '/api/auth/local/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'attacker', email: 'attacker@example.com', password: 'TestPassword123!' }) });
      assert.equal(register.status, 400);
      assert.match((await register.json()).error.message, /disabled/i);
      assert.ok(await cms.db.query('plugin::users-permissions.role').findOne({ where: { type: 'portfolio-admin' } }));
    });

    await t.test('registered categories support metadata edits and validated reassignment', async () => {
      await invalid(cms.documents(CATEGORY).create({ data: { name: 'Unsupported', slug: 'unsupported', templateKey: 'executable-code', cardinality: 'multiple' } }));
      const custom = await cms.documents(CATEGORY).create({ data: { name: 'Alternate Hero', slug: 'alternate-hero', templateKey: 'hero', cardinality: 'singleton', displayOrder: 10, visible: true } });
      const hero = await create('hero', { heading: 'Heading', paragraph: 'Paragraph' });
      await cms.documents(CONTENT).update({ documentId: hero.documentId, data: { category: custom.documentId } });
      const updated = await cms.documents(CATEGORY).update({ documentId: custom.documentId, data: { name: 'Renamed display label', visible: false } });
      assert.equal(updated.name, 'Renamed display label');
      assert.equal(updated.visible, false);
      await invalid(cms.documents(CATEGORY).delete({ documentId: custom.documentId }));
      await cms.documents(CONTENT).delete({ documentId: hero.documentId });
      await cms.documents(CATEGORY).delete({ documentId: custom.documentId });
    });

    await t.test('authenticated direct Strapi REST writes cannot bypass template validation', async () => {
      const token = await cms.admin.services['api-token'].create({ name: 'phase2-integration-test', description: 'Disposable test database only', type: 'full-access', lifespan: null });
      const response = await fetch(base + '/api/contents', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.accessKey}` },
        body: JSON.stringify({ data: { category: category('hero'), payload: [{ __component: 'payloads.hero', heading: 'Missing required paragraph' }] } }),
      });
      assert.equal(response.status, 400);
      assert.match((await response.json()).error.message, /incomplete|invalid/i);
    });

    await t.test('repeatable migration preserves all content, dates, gallery order and media', async () => {
      const source = buildPortfolioSource();
      const first = await importPortfolio(cms);
      assert.equal(first.entries, source.length);
      const filesBefore = await cms.db.query('plugin::upload.file').count();
      const second = await importPortfolio(cms);
      assert.deepEqual(second.documentIds, first.documentIds);
      assert.equal(await cms.db.query('plugin::upload.file').count(), filesBefore);
      assert.equal(await cms.db.query(CONTENT).count({ where: { publishedAt: null } }), source.length);
      assert.equal(await cms.db.query(CONTENT).count({ where: { publishedAt: { $notNull: true } } }), 0);
      for (const record of source) {
        const entry = second.records.find(item => item.migrationKey === record.key);
        assert.ok(entry?.category, record.key);
        assert.equal(entry.payload.length, 1);
        assert.equal(entry.payload[0].__component, `payloads.${record.category}`);
        if (record.category === 'projects') {
          assert.equal(entry.payload[0].gallery.length, record.data.gallery.length);
          assert.deepEqual(entry.payload[0].gallery.map(image => image.alt), record.data.gallery.map(image => image.alt));
          assert.ok(entry.payload[0].gallery.every(image => image.image.mime.startsWith('image/')));
        }
        if (record.data.completionYear) {
          assert.equal(entry.payload[0].completionYear, record.data.completionYear);
          assert.equal(entry.payload[0].startDate, null);
          assert.equal(entry.payload[0].endDate, null);
        }
      }
    });

    await t.test('media, conditional dates, publication and protected relation deletion', async () => {
      const entries = await cms.documents(CONTENT).findMany({ populate: contentPopulate(cms), limit: 1000 });
      const experience = entries.find(entry => entry.category.templateKey === 'experience');
      const data = JSON.parse(JSON.stringify(experience.payload[0]));
      const update = payload => cms.documents(CONTENT).update({ documentId: experience.documentId, data: { payload: [payload] } });
      await invalid(update({ ...data, image: null }));
      await invalid(update({ ...data, image: 99999999 }));
      const settings = entries.find(entry => entry.category.templateKey === 'site-settings');
      await invalid(update({ ...data, image: settings.payload[0].cv.id }));
      await invalid(update({ ...data, current: false, endDate: null }));
      await invalid(update({ ...data, current: false, endDate: '1900-01' }));
      await invalid(update({ ...data, current: true, endDate: '2099-01' }));
      await invalid(update({ ...data, startDate: '2025-02-30' }));
      await invalid(cms.plugin('upload').service('upload').remove(data.image));
      await invalid(cms.plugin('upload').service('upload').replace(data.image.id, { data: {}, file: {} }));
      const group = entries.find(entry => entry.category.templateKey === 'skill-groups');
      await invalid(cms.documents(CONTENT).delete({ documentId: group.documentId }));
      const skill = entries.find(entry => entry.category.templateKey === 'skills');
      await invalid(cms.documents(CONTENT).update({ documentId: skill.documentId, data: { payload: [{ ...skill.payload[0], skillGroup: settings.documentId }] } }));
      const skillGroupId = skill.payload[0].skillGroup.documentId;
      await invalid(cms.documents(CONTENT).publish({ documentId: skill.documentId }));
      await cms.documents(CONTENT).publish({ documentId: skillGroupId });
      await cms.documents(CONTENT).publish({ documentId: skill.documentId });
      await invalid(cms.documents(CONTENT).unpublish({ documentId: skillGroupId }));
      await cms.documents(CONTENT).unpublish({ documentId: skill.documentId });
      await cms.documents(CONTENT).unpublish({ documentId: skillGroupId });
      const project = entries.find(entry => entry.category.templateKey === 'projects');
      await invalid(create('projects', { ...project.payload[0], id: undefined }));
      await cms.documents(CONTENT).publish({ documentId: experience.documentId });
      const published = await cms.documents(CONTENT).findOne({ documentId: experience.documentId, status: 'published', populate: contentPopulate(cms) });
      assert.equal(published.payload[0].image.id, data.image.id);
      // Simulate an internal/legacy corruption that bypassed Document Service.
      await cms.db.query('payloads.experience').update({ where: { id: data.id }, data: { title: ' ' } });
      await invalid(cms.documents(CONTENT).publish({ documentId: experience.documentId }));
      await cms.documents(CONTENT).discardDraft({ documentId: experience.documentId });
      await cms.documents(CONTENT).publish({ documentId: experience.documentId });
      assert.equal((await fetch(base + '/api/contents?status=draft')).status, 403);
    });

    await t.test('phase 3 Express-to-CMS public projection and authenticated draft CRUD', async () => {
      const { createApp } = require('../../api/src/app');
      const request = require('../../api/node_modules/supertest');
      const token = await cms.admin.services['api-token'].create({ name: 'phase3-read', type: 'custom', lifespan: null, permissions: ['api::portfolio.portfolio.read'] });
      const role = await cms.db.query('plugin::users-permissions.role').findOne({ where: { type: 'portfolio-admin' } });
      for (const action of ['categoriesList','categoriesRead','categoriesCreate','categoriesUpdate','categoriesDelete','contentList','contentRead','contentCreate','contentUpdate','contentDelete','mediaList','mediaRead','mediaCreate','mediaDelete']) {
        await cms.db.query('plugin::users-permissions.permission').create({ data: { action: `api::portfolio.portfolio.${action}`, role: role.id } });
      }
      const user = await cms.db.query('plugin::users-permissions.user').create({ data: { username: 'phase3-editor', email: 'phase3@example.com', provider: 'local', confirmed: true, blocked: false, role: role.id } });
      const jwt = cms.plugin('users-permissions').service('jwt').issue({ id: user.id });
      const app = createApp({ cmsUrl: base, cmsReadToken: token.accessKey, rateLimit: 100 }, {
        sendEmail: async () => {}, verifyAdmin: async () => ({ role: 'portfolio-admin', accessToken: jwt }),
      });
      const publicApp = createApp({ cmsUrl: base, cmsReadToken: token.accessKey, rateLimit: 100 }, { sendEmail: async () => {} });
      const transportServer = await new Promise(resolve => {
        const server = publicApp.listen(0, '127.0.0.1', () => resolve(server));
      });
      try {
        const { fetchPortfolio } = await import(require('node:url').pathToFileURL(path.resolve('../../client/utils/portfolio-api.mjs')).href);
        const response = await fetchPortfolio({ fetchImpl: (route, options) => fetch(`http://127.0.0.1:${transportServer.address().port}${route}`, options) });
        assert.equal(response.categories.length, 8);
      } finally { await new Promise(resolve => transportServer.close(resolve)); }

      assert.equal((await request(publicApp).post('/api/admin/content').send({})).status, 401);
      assert.equal((await fetch(base + '/api/portfolio/read')).status, 403);
      assert.equal((await fetch(base + '/api/portfolio/admin/content', { headers: { Authorization: `Bearer ${token.accessKey}` } })).status, 403);
      let result = await request(app).get('/api/admin/categories');
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.ok(result.body.requirements.templates.hero);
      result = await request(app).post('/api/admin/categories').send({ name: 'API Hero', slug: 'api-hero', templateKey: 'hero', cardinality: 'singleton' });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      const categoryId = result.body.category.documentId;
      assert.equal((await request(app).post('/api/admin/content').send({ category: 'api-hero', data: { heading: 'Incomplete' } })).status, 422);
      result = await request(app).post('/api/admin/content').send({ category: 'api-hero', data: { heading: 'Published heading', paragraph: 'Published paragraph' } });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      const id = result.body.item.documentId;
      assert.equal(result.body.item.publishedAt, null);
      assert.equal((await request(app).post('/api/admin/content').send({ category: 'api-hero', data: { heading: 'Duplicate', paragraph: 'Duplicate' } })).status, 422);
      let read = await request(publicApp).get('/api/content?category=api-hero');
      assert.equal(read.status, 200, JSON.stringify(read.body));
      assert.equal(read.body.categories[0].items.length, 0);
      const operation = body => request(app).patch(`/api/admin/content/${id}`).send(body);
      result = await operation({ operation: 'publish' });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      await operation({ operation: 'update', data: { heading: 'Private draft heading' } });
      read = await request(publicApp).get('/api/content?category=api-hero');
      assert.equal(read.body.categories[0].items[0].data.heading, 'Published heading');
      assert.ok(!JSON.stringify(read.body).includes('Private draft heading'));
      for (const privateField of ['createdBy', 'updatedBy', '__component', 'migrationKey', 'provider_metadata']) assert.ok(!JSON.stringify(read.body).includes(privateField));
      assert.equal((await request(publicApp).get('/api/content?category=not-found')).status, 422);
      assert.equal((await request(publicApp).get('/api/content?status=draft')).status, 422);
      assert.equal((await operation({ operation: 'update', data: { paragraph: ' ' } })).status, 422);
      assert.equal((await request(app).delete(`/api/admin/categories/${categoryId}`)).status, 422);
      await operation({ operation: 'publish' });
      read = await request(publicApp).get('/api/content?category=api-hero');
      assert.equal(read.body.categories[0].items[0].data.heading, 'Private draft heading');
      await operation({ operation: 'unpublish' });
      read = await request(publicApp).get('/api/content?category=api-hero');
      assert.equal(read.body.categories[0].items.length, 0);
      assert.equal((await request(app).delete(`/api/admin/content/${id}`)).status, 200);
      assert.equal((await request(app).delete(`/api/admin/categories/${categoryId}`)).status, 200);
      // Every homepage group is complete by default; explicit paging retains total/order.
      const entries = await cms.documents(CONTENT).findMany({ status: 'draft', populate: { category: true }, limit: 100 });
      for (const entry of entries.filter(e => e.category.templateKey === 'projects')) await cms.documents(CONTENT).publish({ documentId: entry.documentId });
      const all = await request(publicApp).get('/api/content?category=projects');
      const page = await request(publicApp).get('/api/content?category=projects&page=2&pageSize=1');
      assert.equal(page.body.categories[0].pagination.total, all.body.categories[0].items.length);
      assert.equal(page.body.categories[0].items[0].documentId, all.body.categories[0].items[1].documentId);
      assert.ok(all.body.categories[0].items[0].data.gallery[0].image.url.startsWith('http'));
      const project = all.body.categories[0].items[0];
      const filtered = await request(publicApp).get(`/api/content?category=projects&slug=${project.slug}`);
      assert.equal(filtered.body.categories[0].items.length, 1);
      const edit = await request(app).patch(`/api/admin/content/${project.documentId}`).send({ operation: 'update', data: { name: 'Edited project name' } });
      assert.equal(edit.status, 200, JSON.stringify(edit.body));
      assert.deepEqual(edit.body.item.data.gallery.map(g => g.image.id), project.data.gallery.map(g => g.image.id));
      const skill = entries.find(e => e.category.templateKey === 'skills');
      const skillEdit = await request(app).patch(`/api/admin/content/${skill.documentId}`).send({ operation: 'update', data: { name: 'Edited skill' } });
      assert.equal(skillEdit.status, 200, JSON.stringify(skillEdit.body));
      const inUse = project.data.gallery[0].image.id;
      assert.equal((await request(app).delete(`/api/admin/media/${inUse}`)).status, 422);
      const media = await request(app).get('/api/admin/media?page=1&pageSize=2');
      assert.equal(media.status, 200, JSON.stringify(media.body)); assert.equal(media.body.items.length, 2);
      const badUpload = await request(app).post('/api/admin/media').attach('files', Buffer.from('fake png'), { filename: 'bad.png', contentType: 'image/png' });
      assert.equal(badUpload.status, 422, JSON.stringify(badUpload.body));
      const png = fs.readFileSync(path.resolve('../../client/public/project-images/federal-dashboard.png'));
      const upload = await request(app).post('/api/admin/media').attach('files', png, { filename: 'test.png', contentType: 'image/png' });
      assert.equal(upload.status, 201, JSON.stringify(upload.body));
      assert.equal((await request(app).delete(`/api/admin/media/${upload.body.items[0].id}`)).status, 200);
      await cms.db.query('plugin::users-permissions.user').update({ where: { id: user.id }, data: { blocked: true } });
      assert.equal((await request(app).get('/api/admin/categories')).status, 401);
    });
    await t.test('phase 4 local bridge provisions once and performs real CMS writes without browser authentication', async () => {
      const { provisionLocalAdmin } = require('../scripts/local-admin');
      const first = await provisionLocalAdmin(cms);
      const second = await provisionLocalAdmin(cms);
      assert.equal(first.userId, second.userId);
      const { createApp } = require('../../api/src/app');
      const request = require('../../api/node_modules/supertest');
      const app = createApp({ cmsUrl: base, rateLimit: 100, environment: 'development', localAdminEnabled: true, cmsLocalAdminToken: second.accessToken }, { sendEmail: async () => {} });
      const list = await request(app).get('/api/admin/categories');
      assert.equal(list.status, 200, JSON.stringify(list.body));
      const category = await request(app).post('/api/admin/categories').send({ name: 'Local editor test', slug: 'local-editor-test', templateKey: 'hero', cardinality: 'singleton' });
      assert.equal(category.status, 201, JSON.stringify(category.body));
      const created = await request(app).post('/api/admin/content').send({ category: 'local-editor-test', data: { heading: 'Local heading', paragraph: 'Persisted through Express and Strapi.' } });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const id = created.body.item.documentId;
      for (const operation of ['publish', 'unpublish']) assert.equal((await request(app).patch(`/api/admin/content/${id}`).send({ operation })).status, 200);
      assert.equal((await request(app).delete(`/api/admin/content/${id}`)).status, 200);
      assert.equal((await request(app).delete(`/api/admin/categories/${category.body.category.documentId}`)).status, 200);
      await cms.db.query('plugin::users-permissions.user').update({ where: { id: second.userId }, data: { blocked: true } });
      assert.equal((await request(app).get('/api/admin/categories')).status, 401);
      await assert.rejects(provisionLocalAdmin(cms), /changed or disabled/);
    });
  } finally {
    await cms.destroy();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
