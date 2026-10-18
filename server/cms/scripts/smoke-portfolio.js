// Starts three real services with a disposable migrated CMS database and a production Next build.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createStrapi } = require('@strapi/strapi');
const { importPortfolio } = require('./import-portfolio');
const { buildPortfolioSource } = require('./portfolio-source');
const { createApp } = require('../../api/src/app');
const { createStrapiService } = require('../../api/src/services/strapi');
const { CONTENT, contentPopulate } = require('../src/portfolio/guard');
async function main() {
  const cmsDir = path.resolve(__dirname, '..');
  const clientDir = path.resolve(__dirname, '../../../client');
  fs.mkdirSync(path.join(cmsDir, '.tmp'), { recursive: true });
  const temp = fs.mkdtempSync(path.join(cmsDir, '.tmp/portfolio-smoke-'));
  fs.mkdirSync(path.join(temp, 'public/uploads'), { recursive: true });
  Object.assign(process.env, { NODE_ENV: 'test', DATABASE_CLIENT: 'sqlite', DATABASE_FILENAME: path.join(temp, 'data.db'), CMS_PUBLIC_DIR: path.join(temp, 'public'), STRAPI_TELEMETRY_DISABLED: 'true' });
  for (const key of ['APP_KEYS','ADMIN_JWT_SECRET','API_TOKEN_SALT','TRANSFER_TOKEN_SALT','ENCRYPTION_KEY','JWT_SECRET']) process.env[key] = crypto.randomBytes(32).toString('hex');
  const cms = createStrapi({ appDir: cmsDir, distDir: cmsDir });
  let apiServer, next;
  try {
    await cms.load();
    await new Promise(resolve => cms.server.listen(0, '127.0.0.1', resolve));
    const imported = await importPortfolio(cms, { publish: true });
    const token = await cms.admin.services['api-token'].create({ name: 'smoke-read', type: 'custom', lifespan: null, permissions: ['api::portfolio.portfolio.read'] });
    const apiConfig = { cmsUrl: `http://127.0.0.1:${cms.server.httpServer.address().port}`, cmsReadToken: token.accessKey, rateLimit: 100 };
    const cmsRequest = createStrapiService(apiConfig);
    let contentReads = 0;
    const api = createApp(apiConfig, { sendEmail: async () => {}, strapi: (...args) => { contentReads++; return cmsRequest(...args); } });
    const manifest = JSON.parse(fs.readFileSync(path.join(clientDir, '.next/routes-manifest.json'), 'utf8'));
    const destination = new URL(manifest.rewrites.afterFiles.find(route => route.source === '/api/content').destination);
    assert.ok(['127.0.0.1', 'localhost'].includes(destination.hostname), 'Smoke test requires a client built with a loopback API_INTERNAL_URL.');
    apiServer = await new Promise((resolve, reject) => { const server = api.listen(Number(destination.port || 80), destination.hostname, () => resolve(server)); server.once('error', reject); });
    const apiBase = `http://127.0.0.1:${apiServer.address().port}`;
    // Reserve a free local port, then hand it to Next.
    const probe = require('node:net').createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    let logs = '';
    next = spawn(process.execPath, [path.join(clientDir, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: clientDir, windowsHide: true, stdio: ['ignore','pipe','pipe'], env: { ...process.env, NODE_ENV: 'production', API_INTERNAL_URL: apiBase } });
    next.stdout.on('data', chunk => { logs += chunk; }); next.stderr.on('data', chunk => { logs += chunk; });
    const url = `http://127.0.0.1:${port}`;
    let response;
    for (let attempt = 0; attempt < 80; attempt++) {
      try { response = await fetch(url); break; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    assert.ok(response, logs); assert.equal(response.status, 200, logs);
    const html = await response.text();
    assert.ok(html.includes('Loading portfolio...'), 'The initial shell must show browser-loading state.');
    assert.equal(contentReads, 0, 'Rendering the page must not fetch content on the Next server.');
    const { fetchPortfolio } = await import(require('node:url').pathToFileURL(path.join(clientDir, 'utils/portfolio-api.mjs')).href);
    const loadContent = () => fetchPortfolio({ fetchImpl: (route, options) => fetch(new URL(route, url), options) });
    const initial = await loadContent();
    assert.equal(initial.categories.flatMap(category => category.items).length, imported.entries);
    const content = await (await fetch(`${url}/api/content?category=projects`)).json();
    assert.equal(content.categories[0].items.length, buildPortfolioSource().filter(record => record.category === 'projects').length);
    const denied = await fetch(`${url}/api/admin/content`); assert.equal(denied.status, 401);
    const hero = (await cms.documents(CONTENT).findMany({ status: 'draft', filters: { category: { slug: 'hero' } }, populate: contentPopulate(cms) }))[0];
    await cms.documents(CONTENT).update({ documentId: hero.documentId, data: { payload: [{ ...hero.payload[0], heading: 'Smoke private edit' }] } });
    assert.ok(!JSON.stringify(await loadContent()).includes('Smoke private edit'));
    await cms.documents(CONTENT).publish({ documentId: hero.documentId });
    assert.ok(JSON.stringify(await loadContent()).includes('Smoke private edit'));
    await cms.documents(CONTENT).unpublish({ documentId: hero.documentId });
    assert.ok(!JSON.stringify(await loadContent()).includes('Smoke private edit'));
    console.log(`Production portfolio smoke passed: ${imported.entries} migrated entries, static loading shell without server content fetches, browser content transport through proxy routes, draft privacy and reload freshness.`);
  } finally {
    if (next && next.exitCode === null) { const ended = new Promise(resolve => next.once('exit', resolve)); next.kill(); await ended; }
    if (apiServer) await new Promise(resolve => apiServer.close(resolve));
    await cms.destroy();
    // The path is created under cms/.tmp above and never derived from external input.
    assert.ok(path.resolve(temp).startsWith(path.join(cmsDir, '.tmp') + path.sep));
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
