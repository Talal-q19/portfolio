const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Database = require('better-sqlite3');

async function backupBeforeImport(env = process.env) {
  const root = path.resolve(__dirname, '..');
  const target = path.join(root, '.backups', `before-import-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(target, { recursive: true });
  if ((env.DATABASE_CLIENT || 'sqlite') === 'sqlite') {
    const filename = path.resolve(root, env.DATABASE_FILENAME || '.tmp/data.db');
    if (fs.existsSync(filename)) {
      const db = new Database(filename, { readonly: true });
      try { await db.backup(path.join(target, 'data.db')); } finally { db.close(); }
    }
  } else {
    const database = new URL(env.DATABASE_URL);
    const result = spawnSync('pg_dump', ['--format=custom', '--file', path.join(target, 'database.dump')], {
      env: { ...env, PGHOST: database.hostname, PGPORT: database.port || '5432',
        PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password),
        PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
        PGSSLMODE: env.DATABASE_SSL === 'false' ? 'disable' : env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? 'require' : 'verify-full',
      }, stdio: ['ignore', 'ignore', 'pipe'],
    });
    if (result.error || result.status !== 0) throw new Error('Database backup failed. Install/configure pg_dump before importing PostgreSQL content.');
  }
  const uploads = path.resolve(root, env.CMS_PUBLIC_DIR || 'public', 'uploads');
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(target, 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(target, 'README.txt'), 'Database and local upload snapshot created before CMS initialization/import. Keep external media provider backups separately. Stop CMS before restoring; never restore development data into production.\n');
  return target;
}
module.exports = { backupBeforeImport };
