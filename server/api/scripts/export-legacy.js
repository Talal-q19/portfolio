// Offline export: stop the legacy CMS before running. No source data is deleted.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { entryView, categoryView, mediaView } = require('../../content-contract/api');
const { templates, components } = require('../../content-contract');
const cmsRoot = path.resolve(process.env.LEGACY_CMS_ROOT || path.join(__dirname, '../../cms'));
const apiEnvFile = path.resolve(process.env.LEGACY_API_ENV || path.join(__dirname, '../.env'));
function references(fields, data) {
  return Object.fromEntries(Object.entries(fields).filter(([k]) => data[k] !== undefined).map(([k, spec]) => [k,
    spec.type === 'media' ? data[k]?.id || null : spec.type === 'list' ? (data[k] || []).map(r => references(components[spec.component], r)) : data[k],
  ]));
}
async function main() {
  const apiEnv = dotenv.parse(await fs.readFile(apiEnvFile));
  const cmsEnv = dotenv.parse(await fs.readFile(path.join(cmsRoot, '.env')));
  if (!apiEnv.DATABASE_URL) throw new Error('Legacy API configuration needs DATABASE_URL.');
  const target = path.resolve(__dirname, '../.backups', new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(path.join(target, 'media'), { recursive: true });
  const { backupBeforeImport } = require(path.join(cmsRoot, 'scripts/backup'));
  // The legacy backup utility resolves database/media paths within its CMS root.
  const sourceBackup = await backupBeforeImport(cmsEnv);
  await fs.cp(sourceBackup, path.join(target, 'cms-snapshot'), { recursive: true });
  const pool = new Pool({ connectionString: apiEnv.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let admins;
  try { admins = (await pool.query('SELECT * FROM portfolio_admins ORDER BY id')).rows.map(r => ({ ...r, created_at: new Date(r.created_at).toISOString(), updated_at: new Date(r.updated_at).toISOString() })); }
  finally { await pool.end(); }
  // Read the backed-up SQLite database, so Strapi initialization cannot change source data.
  Object.assign(process.env, cmsEnv);
  if ((cmsEnv.DATABASE_CLIENT || 'sqlite') === 'sqlite') process.env.DATABASE_FILENAME = path.join(target, 'cms-snapshot/data.db');
  else throw new Error('Hosted PostgreSQL CMS export requires restoring cms-snapshot/database.dump into an isolated database first. Source backup was retained.');
  process.env.PORTFOLIO_SKIP_BOOTSTRAP = 'true';
  const { createStrapi } = require(path.join(cmsRoot, 'node_modules/@strapi/strapi'));
  const cms = createStrapi({ appDir: cmsRoot, distDir: cmsRoot });
  try {
    await cms.load();
    const { contentPopulate, CATEGORY, CONTENT } = require(path.join(cmsRoot, 'src/portfolio/guard'));
    const categories = (await cms.documents(CATEGORY).findMany({ limit: 10000 })).map(categoryView);
    const read = status => cms.documents(CONTENT).findMany({ status, limit: 10000, populate: contentPopulate(cms) });
    const drafts = await read('draft'), published = await read('published');
    const toSnapshot = row => { const item = entryView(row); return { data: references(templates[row.category.templateKey].fields, item.data), displayOrder: item.displayOrder }; };
    const content = drafts.map(row => {
      const live = published.find(p => p.documentId === row.documentId);
      return { documentId: row.documentId, category: row.category.slug, draft: toSnapshot(row), published: live ? { ...toSnapshot(live), publishedAt: live.publishedAt } : null };
    });
    const media = [];
    for (const row of await cms.db.query('plugin::upload.file').findMany({ orderBy: { id: 'asc' } })) {
      const item = mediaView(row);
      let bytes;
      if (row.url.startsWith('/uploads/')) {
        const uploads = path.resolve(target, 'cms-snapshot/uploads');
        const filename = path.resolve(uploads, path.basename(row.url));
        bytes = await fs.readFile(filename);
      } else {
        const url = new URL(row.url);
        if (url.protocol !== 'https:') throw new Error('Remote media must use HTTPS.');
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error('Source media download failed.');
        bytes = Buffer.from(await response.arrayBuffer());
      }
      const file = `media/${row.id}.bin`;
      await fs.writeFile(path.join(target, file), bytes);
      const { url, ...data } = item;
      media.push({ ...data, size: bytes.length / 1024, file, checksum: createHash('sha256').update(bytes).digest('base64') });
    }
    const snapshot = { version: 1, exportedAt: new Date().toISOString(), categories, content, media, admins };
    await fs.writeFile(path.join(target, 'snapshot.json'), JSON.stringify(snapshot, null, 2));
    console.log(`Private snapshot: ${target}`);
    console.log(`Exported ${categories.length} categories, ${content.length} entries, ${media.length} assets, ${admins.length} administrators.`);
  } finally { await cms.destroy(); }
}
main().catch(error => { console.error(`Export stopped: ${error.message}`); process.exitCode = 1; });
