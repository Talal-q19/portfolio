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
  } finally {
    await cms.destroy();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
