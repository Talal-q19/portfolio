const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in server/api/.env (database: portfolio).');
  const { runner } = await import('node-pg-migrate');
  await runner({
    databaseUrl: process.env.DATABASE_URL, dir: path.resolve(__dirname, '../migrations'),
    direction: 'up', migrationsTable: 'portfolio_auth_migrations',
    checkOrder: true, singleTransaction: true,
  });
}
main().catch(error => { console.error(`Migration failed: ${error.code || error.message}`); process.exitCode = 1; });
