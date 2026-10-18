// Provision a least-privilege server read credential without logging its value.
const fs = require('node:fs');
const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Use the CMS API Tokens screen and your secret manager for production.');
  const envPath = path.resolve(__dirname, '../../api/.env');
  const previous = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const hasReadToken = /^CMS_READ_TOKEN=.+$/m.test(previous);
  const publishMigrated = process.argv.includes('--publish-migrated');
  if (hasReadToken && !publishMigrated) throw new Error('CMS_READ_TOKEN already exists. Rotate deliberately through the CMS API Tokens screen.');
  if (publishMigrated) {
    const backup = await require('./backup').backupBeforeImport();
    console.log(`Pre-publication backup: ${backup}`);
  }
  const cms = createStrapi({ appDir: path.resolve(__dirname, '..'), distDir: path.resolve(__dirname, '..') });
  try {
    await cms.load();
    if (publishMigrated) {
      const { CONTENT } = require('../src/portfolio/guard');
      const source = require('./portfolio-source').buildPortfolioSource();
      const ordered = [...source.filter(item => item.category === 'skill-groups'), ...source.filter(item => item.category !== 'skill-groups')];
      const entries = [];
      for (const item of ordered) {
        const entry = await cms.documents(CONTENT).findFirst({ status: 'draft', filters: { migrationKey: item.key } });
        if (!entry) throw new Error(`Missing migrated entry ${item.key}. Import the baseline before activating content.`);
        entries.push(entry);
      }
      for (const entry of entries) await cms.documents(CONTENT).publish({ documentId: entry.documentId });
      console.log(`Published ${entries.length} existing migrated portfolio entries without reimporting or replacing their data.`);
    }
    if (hasReadToken) { console.log('Existing read credential preserved. Restart the CMS and Express.'); return; }
    const token = await cms.admin.services['api-token'].create({ name: `portfolio-read-${Date.now()}`, description: 'Express published portfolio reads only', type: 'custom', lifespan: null, permissions: ['api::portfolio.portfolio.read'] });
    const value = `CMS_READ_TOKEN=${token.accessKey}`;
    fs.writeFileSync(envPath, /^CMS_READ_TOKEN=.*$/m.test(previous) ? previous.replace(/^CMS_READ_TOKEN=.*$/m, value) : `${previous}\n${value}\n`);
    console.log('Read credential saved to server/api/.env (value hidden). Restart Express.');
  } finally { await cms.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
