// Reconstruct the committed portfolio baseline without requiring Strapi.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { templates } = require('../../content-contract');
const { buildPortfolioSource, sourceFile } = require('../../cms/scripts/portfolio-source');
async function main() {
  const records = buildPortfolioSource();
  const target = path.resolve(__dirname, '../.backups/committed-baseline');
  await fs.mkdir(path.join(target, 'media'), { recursive: true });
  const files = new Map();
  const entries = new Map(records.map(r => [r.key, `s${createHash('sha256').update(r.key).digest('hex').slice(0, 24)}`]));
  function collect(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$file && !files.has(value.$file)) files.set(value.$file, files.size + 1);
    Object.values(value).forEach(collect);
  }
  records.forEach(r => collect(r.data));
  function resolve(value) {
    if (!value || typeof value !== 'object') return value;
    if (value.$file) return files.get(value.$file);
    if (value.$entry) return entries.get(value.$entry);
    return Array.isArray(value) ? value.map(resolve) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
  }
  const media = [];
  const mimes = { '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.pdf': 'application/pdf' };
  for (const [source, id] of files) {
    const filename = sourceFile(source), bytes = await fs.readFile(filename);
    const file = `media/${id}.bin`;
    await fs.writeFile(path.join(target, file), bytes);
    media.push({ id, name: path.basename(filename), alternativeText: path.basename(filename, path.extname(filename)), mime: mimes[path.extname(filename).toLowerCase()] || 'application/octet-stream', size: bytes.length / 1024, checksum: createHash('sha256').update(bytes).digest('base64'), file });
  }
  const publishedAt = '2026-11-03T00:00:00.000Z';
  const snapshot = {
    version: 1, exportedAt: new Date().toISOString(), source: 'committed-baseline',
    categories: Object.entries(templates).map(([slug, t], i) => ({ documentId: `seed${i}`, name: t.name, slug, templateKey: slug, cardinality: t.cardinality, displayOrder: i, visible: true })),
    content: records.map(r => { const draft = { displayOrder: r.displayOrder || 0, data: resolve(r.data) }; return { documentId: entries.get(r.key), category: r.category, draft, published: { ...draft, publishedAt } }; }),
    media, admins: [],
  };
  await fs.writeFile(path.join(target, 'snapshot.json'), JSON.stringify(snapshot, null, 2));
  console.log(`Baseline snapshot: ${target}`);
  console.log(`${records.length} content entries, ${media.length} assets, zero administrator accounts. This excludes uncommitted edits from the other computer.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
