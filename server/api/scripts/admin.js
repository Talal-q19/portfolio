const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createConvexService } = require('../src/services/convex');
const { hashPassword } = require('../src/services/password');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
async function main() {
  const call = createConvexService({ convexUrl: process.env.CONVEX_HTTP_URL, convexSecret: process.env.CONVEX_SERVICE_SECRET });
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,80}$/.test(username)) throw new Error('Set ADMIN_USERNAME (3–80 letters, digits, dots, underscores or hyphens).');
  const action = process.argv[2] || 'create';
  if (!['create', 'block', 'unblock'].includes(action)) throw new Error('Use create, block or unblock.');
    if (action === 'create') {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL.');
      const hash = await hashPassword(process.env.ADMIN_PASSWORD);
      await call('adminCreate', { id: randomUUID(), username, email, password_hash: hash });
      console.log('Admin created. Remove ADMIN_PASSWORD from the environment file.');
    } else {
      await call('adminBlock', { username, blocked: action === 'block' });
      console.log(`Admin ${action === 'block' ? 'blocked' : 'unblocked'}; previous sessions invalidated.`);
    }

}
main().catch(error => { console.error(`Admin command failed: ${error.code || error.message}`); process.exitCode = 1; });
