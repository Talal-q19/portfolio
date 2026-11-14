const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadEnvironment } = require('../src/config/env');
const { ContactRequest } = require('../src/dtos/request/ContactRequest');
const { ContactService } = require('../src/service/ContactService');
const { ContactServiceImpl } = require('../src/service/impl/ContactServiceImpl');
const { AuthResponse } = require('../src/dtos/response/AuthResponse');
const { MediaResponse } = require('../src/dtos/response/MediaResponse');

test('environment folder loading preserves injected variables and supports legacy checkouts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-env-test-'));
  const directory = path.join(root, 'env');
  fs.mkdirSync(directory);
  try {
    fs.writeFileSync(path.join(directory, '.env.local'), 'VALUE=local\nINJECTED=file\n');
    fs.writeFileSync(path.join(directory, '.env'), 'VALUE=default\nDEFAULT=present\n');
    fs.writeFileSync(path.join(root, '.env.local'), 'VALUE=legacy\nLEGACY=present\n');
    const environment = { INJECTED: 'deployment' };
    loadEnvironment(directory, root, environment);
    assert.deepEqual(environment, { INJECTED: 'deployment', VALUE: 'local', DEFAULT: 'present', LEGACY: 'present' });
  } finally {
    if (!root.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Invalid temporary cleanup path.');
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('contact DTO and service preserve validation and verify CAPTCHA before delivery', async () => {
  const events = [];
  const service = new ContactServiceImpl({ captcha: { verify: async token => events.push(token) }, email: { sendContact: async data => events.push(data) } });
  assert.ok(service instanceof ContactService);
  await service.send(ContactRequest.from({ name: ' Visitor ', email: 'visitor@example.com', message: ' Hello ', captchaToken: 'captcha', extra: 'ignored' }));
  assert.deepEqual(events, ['captcha', { name: 'Visitor', email: 'visitor@example.com', message: 'Hello' }]);
  const unavailable = new ContactServiceImpl({ captcha: { verify: async () => { throw new Error('Unavailable'); } }, email: { sendContact: async () => { throw new Error('Must not deliver'); } } });
  await assert.rejects(unavailable.send({ captchaToken: 'token' }), /Unavailable/);
});

test('response DTOs exclude credentials and storage metadata', async () => {
  const admin = { id: 'a', username: 'owner', password_hash: 'private', email: 'private@example.com', token_version: 2 };
  assert.deepEqual(AuthResponse.identity(admin), { id: 'a', username: 'owner', role: 'portfolio-admin' });
  assert.deepEqual(AuthResponse.session(admin), { username: 'owner' });
  assert.deepEqual(await MediaResponse.from({ _id: 'internal', _creationTime: 1, id: 3, storageId: 'storage', checksum: 'private', name: 'image.png' }, { getUrl: async id => `https://media.example/${id}` }), { id: 3, name: 'image.png', url: 'https://media.example/storage' });
});

test('relocated snapshot validator runs independently of the working directory without importing data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-migration-test-'));
  try {
    const snapshot = path.join(root, 'snapshot.json');
    fs.writeFileSync(snapshot, JSON.stringify({
      version: 1, admins: [], media: [],
      categories: [{ documentId: 'hero', name: 'Hero', slug: 'hero', templateKey: 'hero', cardinality: 'singleton', displayOrder: 0, visible: true }],
      content: [{ documentId: 'entry', category: 'hero', draft: { displayOrder: 0, data: { heading: 'Hello', paragraph: 'Welcome' } }, published: null }],
    }));
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../data-migration/scripts/import-convex.js'), snapshot, '--validate-only'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /validated; no network writes/);
    assert.equal(fs.existsSync(path.join(root, 'reconciliation.json')), false);
  } finally {
    if (!root.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('Invalid temporary cleanup path.');
    fs.rmSync(root, { recursive: true, force: true });
  }
});
