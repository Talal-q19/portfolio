const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');
const { importPortfolio } = require('./import-portfolio');
const { backupBeforeImport } = require('./backup');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--allow-production')) {
    throw new Error('Production import requires --allow-production and independently backed-up external media.');
  }
  const backup = await backupBeforeImport();
  console.log(`Pre-import backup: ${backup}`);
  const strapi = createStrapi({ appDir: path.resolve(__dirname, '..'), distDir: path.resolve(__dirname, '..') });
  try {
    await strapi.load();
    const result = await importPortfolio(strapi, { publish: process.argv.includes('--publish') });
    console.log(`Imported ${result.entries} documents and ${result.files} media files. ${process.argv.includes('--publish') ? 'Published.' : 'Saved as complete private drafts.'}`);
  } finally { await strapi.destroy(); }
}
main().catch(error => { console.error(error.message, error.details || ''); process.exitCode = 1; });
