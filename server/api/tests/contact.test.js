const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const nodemailer = require('nodemailer');
const { SMTPServer } = require('smtp-server');
const { createApp } = require('../src/create-app');
const { createEmailService } = require('../src/services/email');
const { createCaptchaService } = require('../src/services/captcha');
const { createEmailTemplate } = require('../src/templates/contact');
const { loadConfig } = require('../src/config/env');

const config = loadConfig({ SMTP_USER: 'sender@example.com', SMTP_PASS: 'test', CONTACT_TO_EMAIL: 'owner@example.com' });
const valid = { name: 'Visitor', email: 'visitor@example.com', message: 'Hello\nWorld' };
const app = (options = {}, deps = {}) => createApp({ ...config, ...options }, { sendEmail: async () => {}, ...deps });

test('configuration rejects missing secrets and invalid flags/ports', () => {
  assert.equal(loadConfig({}).smtp.auth.user, undefined);
  assert.throws(() => loadConfig({ SMTP_USER: 'a', SMTP_PASS: 'b', SMTP_PORT: 'oops' }), /SMTP_PORT/);
  assert.throws(() => loadConfig({ SMTP_USER: 'a', SMTP_PASS: 'b', RECAPTCHA_ENABLED: 'true' }), /RECAPTCHA_SECRET_KEY/);
  assert.throws(() => loadConfig({ SMTP_USER: 'a', SMTP_PASS: 'b', SMTP_SECURE: 'yes' }), /SMTP_SECURE/);
  assert.equal(config.to, 'owner@example.com');
  assert.equal(loadConfig({ SMTP_USER: 'a', SMTP_PASS: 'b' }).to, 'a');
});

test('health and removed routes', async () => {
  await request(app()).get('/api/health').expect(200, { success: true, status: 'ok' });
  await request(app()).get('/api/data').expect(404);
  await request(app()).post('/api/google').expect(404);
});

test('rejects invalid contact fields without sending mail', async () => {
  let sent = 0;
  const server = app({ rateLimit: 100 }, { sendEmail: async () => { sent++; } });
  for (const body of [null, {}, { ...valid, name: '  ' }, { ...valid, name: {} },
    { ...valid, email: 'bad' }, { ...valid, email: 'a@b.com\r\nBcc:evil@x.com' },
    { ...valid, name: 'x\nInjected' }, { ...valid, name: 'x'.repeat(101) },
    { ...valid, email: 'x'.repeat(101) }, { ...valid, message: 'x'.repeat(501) }]) {
    await request(server).post('/api/contact').send(body || {}).expect(422);
  }
  assert.equal(sent, 0);
});

test('JSON errors, body size and content type return safe responses', async () => {
  const server = app();
  await request(server).post('/api/contact').set('Content-Type', 'application/json').send('{bad').expect(400);
  await request(server).post('/api/contact').send({ ...valid, message: 'x'.repeat(20000) }).expect(413);
  await request(server).post('/api/contact').type('form').send(valid).expect(415);
});

test('rate limit rejects repeated submissions', async () => {
  const server = app({ rateLimit: 1 });
  await request(server).post('/api/contact').send(valid).expect(200);
  await request(server).post('/api/contact').send(valid).expect(429);
});

test('transport failures do not reveal infrastructure or credentials', async () => {
  const server = app({}, { sendEmail: async () => { throw new Error('smtp-password secret host'); } });
  const response = await request(server).post('/api/contact').send(valid).expect(500);
  assert.deepEqual(response.body, { success: false, message: 'Failed to send message.' });
});

test('enabled CAPTCHA fails closed before sending mail', async () => {
  let sent = 0;
  const server = app({ captchaEnabled: true }, {
    sendEmail: async () => { sent++; },
    verifyCaptcha: createCaptchaService({ captchaEnabled: true, captchaSecret: 'test' }, async () => ({ ok: true, json: async () => ({ success: false }) })),
  });
  await request(server).post('/api/contact').send(valid).expect(422);
  await request(server).post('/api/contact').send({ ...valid, captchaToken: 'invalid' }).expect(422);
  assert.equal(sent, 0);
});

test('CAPTCHA submits server secret by POST, validates hostname and handles outages', async () => {
  const settings = { captchaEnabled: true, captchaSecret: 'private', captchaHostname: 'example.com' };
  const verify = createCaptchaService(settings, async (url, options) => {
    assert.equal(url, 'https://www.google.com/recaptcha/api/siteverify');
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('secret'), 'private');
    assert.equal(options.body.get('response'), 'token');
    return { ok: true, json: async () => ({ success: true, hostname: 'example.com' }) };
  });
  await request(app(settings, { verifyCaptcha: verify })).post('/api/contact').send({ ...valid, captchaToken: 'token' }).expect(200);
  await assert.rejects(createCaptchaService(settings, async () => { throw new Error('offline'); })('token'), { status: 503 });
  await assert.rejects(createCaptchaService(settings, async () => ({ ok: true, json: async () => ({ success: true, hostname: 'wrong' }) }))('token'), { status: 422 });
});

test('SMTP test delivery preserves recipients, Reply-To, plain text and escaped HTML', async (t) => {
  let raw = '';
  let envelope;
  const smtp = new SMTPServer({
    authOptional: true, disabledCommands: ['STARTTLS'],
    onData(stream, session, callback) {
      envelope = session.envelope;
      stream.on('data', chunk => { raw += chunk.toString(); });
      stream.on('end', callback);
    },
  });
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => smtp.close(resolve)));
  const transport = nodemailer.createTransport({ host: '127.0.0.1', port: smtp.server.address().port, secure: false });
  const sendEmail = createEmailService(config, transport);
  await request(app({}, { sendEmail })).post('/api/contact').send({ ...valid, name: ' <Visitor> ', message: '<script>\n"hello" & bye' }).expect(200);
  assert.equal(envelope.mailFrom.address, 'sender@example.com');
  assert.equal(envelope.rcptTo[0].address, 'owner@example.com');
  assert.match(raw, /Reply-To: visitor@example.com/);
  assert.match(raw, /Subject: New portfolio contact from <Visitor>/);
  assert.match(raw, /Content-Type: multipart\/alternative/);
  assert.match(raw, /Name: <Visitor>/);
  assert.match(raw, /Email: visitor@example.com/);
  assert.match(raw, /Message:/);
  const html = createEmailTemplate({ name: '<Visitor>', email: 'v@example.com', message: '<script>\n"hello" & bye' });
  assert.match(html, /&lt;Visitor&gt;/);
  assert.match(html, /&lt;script&gt;<br \/>&quot;hello&quot; &amp; bye/);
  assert.match(html, /Quick Reply/);
  assert.doesNotMatch(html, /<script>/);
});
