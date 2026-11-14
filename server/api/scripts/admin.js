const { randomUUID } = require('node:crypto');
const { createConvexClient } = require('../src/repository/ConvexClient');
const { AdminRepository } = require('../src/repository/AdminRepository');
const { PasswordServiceImpl } = require('../src/service/impl/PasswordServiceImpl');
const { loadEnvironment } = require('../src/config/env');
loadEnvironment();
async function main() {
  const repository = new AdminRepository(createConvexClient({ convexUrl: process.env.CONVEX_HTTP_URL, convexSecret: process.env.CONVEX_SERVICE_SECRET }));
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,80}$/.test(username)) throw new Error('Set ADMIN_USERNAME (3–80 letters, digits, dots, underscores or hyphens).');
  const action = process.argv[2] || 'create';
  if (!['create', 'block', 'unblock'].includes(action)) throw new Error('Use create, block or unblock.');
    if (action === 'create') {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL.');
      const hash = await new PasswordServiceImpl().hash(process.env.ADMIN_PASSWORD);
      await repository.create({ id: randomUUID(), username, email, password_hash: hash });
      console.log('Admin created. Remove ADMIN_PASSWORD from the environment file.');
    } else {
      await repository.setBlocked(username, action === 'block');
      console.log(`Admin ${action === 'block' ? 'blocked' : 'unblocked'}; previous sessions invalidated.`);
    }

}
main().catch(error => { console.error(`Admin command failed: ${error.code || error.message}`); process.exitCode = 1; });
