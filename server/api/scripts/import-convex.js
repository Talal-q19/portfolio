const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createConvexService } = require('../src/services/convex');
const { validatePayload, validateCategory } = require('../../content-contract');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });
const canonical = value => JSON.stringify(sort(value));
function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; }
async function main() {
  if (!process.argv[2]) throw new Error('Usage: node scripts/import-convex.js <private snapshot.json> [--verify-only]');
  const snapshotPath = path.resolve(process.argv[2]);
  const source = JSON.parse(await fs.readFile(snapshotPath));
  if (source.version !== 1) throw new Error('Unsupported snapshot version.');
  const root = path.dirname(snapshotPath);
  for (const media of source.media) {
    const file = path.resolve(root, media.file);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid snapshot media path.');
    const bytes = await fs.readFile(file);
    if (createHash('sha256').update(bytes).digest('base64') !== media.checksum) throw new Error('Snapshot checksum mismatch.');
  }
  for (const category of source.categories) validateCategory(category);
  for (const row of source.content) {
    const category = source.categories.find(c => c.slug === row.category);
    if (!category) throw new Error('Dangling category reference.');
    for (const version of [row.draft, row.published].filter(Boolean)) await validatePayload(category.templateKey, version.data, {
      media: async id => source.media.find(m => m.id === (id?.id || id)),
      skillGroup: async id => source.content.some(g => g.documentId === id && source.categories.find(c => c.slug === g.category)?.templateKey === 'skill-groups' && (!row.published || version === row.draft || g.published)),
    });
  }
  const call = createConvexService({ convexUrl: process.env.CONVEX_HTTP_URL, convexSecret: process.env.CONVEX_SERVICE_SECRET });
  if (process.argv.includes('--validate-only')) { console.log('Snapshot checksums, content and references validated; no network writes.'); return; }
  if (!process.argv.includes('--verify-only')) {
    const existingMedia = await call('migrationRead', { table: 'media' });
    for (const m of source.media) {
      const { file, ...data } = m;
      let storageId = existingMedia.find(item => item.id === m.id)?.storageId;
      if (!storageId) {
        const { uploadUrl } = await call('migrationUpload');
        const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': m.mime }, body: await fs.readFile(path.resolve(root, file)), signal: AbortSignal.timeout(120000) });
        if (!response.ok) throw new Error('Media import upload failed.');
        storageId = (await response.json()).storageId;
      }
      await call('migrationRecord', { table: 'media', data: { ...data, storageId } });
    }
    for (const table of ['categories', 'content', 'admins']) for (const data of source[table]) await call('migrationRecord', { table, data });
  }
  for (const table of ['categories', 'content', 'media', 'admins']) {
    const actual = await call('migrationRead', { table });
    if (actual.length !== source[table].length) throw new Error(`${table}: record count mismatch.`);
    const id = ['media', 'admins'].includes(table) ? 'id' : 'documentId';
    for (const expected of source[table]) {
      const row = actual.find(r => r[id] === expected[id]);
      if (!row) throw new Error(`${table}: missing source record.`);
      const wanted = { ...expected }, got = { ...row };
      if (table === 'media') { delete wanted.file; delete got.storageId; }
      if (canonical(wanted) !== canonical(got)) throw new Error(`${table}: data mismatch.`);
    }
    console.log(`${table}: ${actual.length} records reconciled.`);
  }
  await fs.writeFile(path.join(root, 'reconciliation.json'), JSON.stringify({ target: process.env.CONVEX_HTTP_URL, verifiedAt: new Date().toISOString(), success: true }, null, 2));
  console.log('Import verified. Disable CONVEX_MIGRATION_ENABLED before routing production traffic.');
}
main().catch(error => { console.error(`Import stopped: ${error.message}`); process.exitCode = 1; });
