const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createStrapi } = require('@strapi/strapi');
const { provisionLocalAdmin } = require('./local-admin');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') throw new Error('Local admin setup is development-only.');
  if ((process.env.DATABASE_CLIENT || 'sqlite') !== 'sqlite') throw new Error('Local admin setup requires the local SQLite development database.');
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port: Number(process.env.PORT || 1337) });
    socket.once('connect', () => { socket.destroy(); reject(new Error('Stop the local CMS before running setup:admin, then restart it afterwards.')); });
    socket.once('error', error => { if (error.code === 'ECONNREFUSED') resolve(); else reject(error); });
  });
  const envPath = path.resolve(__dirname, '../../api/.env');
  const previous = fs.readFileSync(envPath, 'utf8');
  const config = require('dotenv').parse(previous);
  if (config.NODE_ENV && config.NODE_ENV !== 'development') throw new Error('The API environment must be development for local editing.');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(config.CMS_INTERNAL_URL || 'http://127.0.0.1:1337').hostname)) throw new Error('The API must point to the local CMS.');
  const backup = await require('./backup').backupBeforeImport();
  console.log(`Pre-setup backup: ${backup}`);
  const cms = createStrapi({ appDir: path.resolve(__dirname, '..'), distDir: path.resolve(__dirname, '..') });
  try {
    await cms.load();
    const { accessToken } = await provisionLocalAdmin(cms);
    let next = previous;
    for (const [key, value] of Object.entries({ LOCAL_ADMIN_ENABLED: 'true', CMS_LOCAL_ADMIN_TOKEN: accessToken })) {
      const pattern = new RegExp(`^${key}=.*$`, 'm');
      next = pattern.test(next) ? next.replace(pattern, `${key}=${value}`) : `${next.trimEnd()}\n${key}=${value}\n`;
    }
    fs.writeFileSync(envPath, next);
    console.log('Local editing configured in server/api/.env. Credential hidden; valid for 7 days. Restart CMS and API, then open /admin.');
  } finally { await cms.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
