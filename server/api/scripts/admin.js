const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { hashPassword } = require('../src/services/password');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in server/api/.env.');
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,80}$/.test(username)) throw new Error('Set ADMIN_USERNAME (3–80 letters, digits, dots, underscores or hyphens).');
  const action = process.argv[2] || 'create';
  if (!['create', 'block', 'unblock'].includes(action)) throw new Error('Use create, block or unblock.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    if (action === 'create') {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL.');
      const hash = await hashPassword(process.env.ADMIN_PASSWORD);
      await pool.query('INSERT INTO portfolio_admins (id, username, email, password_hash) VALUES ($1, $2, $3, $4)', [randomUUID(), username, email, hash]);
      console.log('Admin created. Remove ADMIN_PASSWORD from the environment file.');
    } else {
      const result = await pool.query('UPDATE portfolio_admins SET blocked = $2, token_version = token_version + 1, updated_at = now() WHERE username = $1', [username, action === 'block']);
      if (!result.rowCount) throw new Error('Admin not found.');
      console.log(`Admin ${action === 'block' ? 'blocked' : 'unblocked'}; previous sessions invalidated.`);
    }
  } finally { await pool.end(); }
}
main().catch(error => { console.error(`Admin command failed: ${error.code || error.message}`); process.exitCode = 1; });
