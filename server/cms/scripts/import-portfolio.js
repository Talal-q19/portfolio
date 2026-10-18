const fs = require('node:fs');
const path = require('node:path');
const { validatePayload } = require('@portfolio/content-contract');
const { CONTENT, CATEGORY, contentPopulate, withWriteLock } = require('../src/portfolio/guard');
const { buildPortfolioSource, sourceFile, fileKey } = require('./portfolio-source');
const mime = require('mime-types');

async function importPortfolio(strapi, { publish = false } = {}) {
  const records = buildPortfolioSource();
  // Validate all source records and paths before uploading or writing anything.
  const sourceMedia = new Set();
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$file) { sourceFile(value.$file); sourceMedia.add(value.$file); }
    Object.values(value).forEach(walk);
  }
  for (const record of records) {
    walk(record.data);
    await validatePayload(record.category, record.data, {
      media: value => value?.$file ? { mime: mime.lookup(sourceFile(value.$file)) } : null,
      skillGroup: value => records.some(r => r.key === value?.$entry && r.category === 'skill-groups'),
    });
  }
  const files = new Map();
  for (const source of sourceMedia) {
    const name = `portfolio-${fileKey(source)}-${path.basename(source)}`;
    const uploaded = await withWriteLock(strapi, async () => {
      const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name } });
      if (existing) return existing;
      const filepath = sourceFile(source);
      const [created] = await strapi.plugin('upload').service('upload').upload({
        data: { fileInfo: { name, alternativeText: path.basename(source, path.extname(source)) } },
        files: { filepath, originalFilename: path.basename(source), mimetype: mime.lookup(filepath), size: fs.statSync(filepath).size },
      });
      return created;
    });
    files.set(source, uploaded.id);
  }
  const imported = new Map();
  function resolve(value) {
    if (!value || typeof value !== 'object') return value;
    if (value.$file) return files.get(value.$file);
    if (value.$entry) {
      if (!imported.has(value.$entry)) throw new Error(`Unresolved content dependency ${value.$entry}`);
      return imported.get(value.$entry);
    }
    if (Array.isArray(value)) return value.map(resolve);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolve(child)]));
  }
  // Import group documents first so skill relations always resolve.
  const ordered = [...records.filter(r => r.category === 'skill-groups'), ...records.filter(r => r.category !== 'skill-groups')];
  for (const record of ordered) {
    await withWriteLock(strapi, async () => {
      const category = await strapi.db.query(CATEGORY).findOne({ where: { slug: record.category } });
      const previous = await strapi.db.query(CONTENT).findOne({ where: { migrationKey: record.key, publishedAt: null } });
      const data = {
        migrationKey: record.key, category: category.documentId, displayOrder: record.displayOrder,
        payload: [{ __component: `payloads.${record.category}`, ...resolve(record.data) }],
      };
      const entry = previous
        ? await strapi.documents(CONTENT).update({ documentId: previous.documentId, data })
        : await strapi.documents(CONTENT).create({ data });
      imported.set(record.key, entry.documentId);
      if (publish) await strapi.documents(CONTENT).publish({ documentId: entry.documentId });
    });
  }
  // Re-read through the same persistence validator to catch media/relation mapping errors.
  const entries = await strapi.documents(CONTENT).findMany({ status: 'draft', populate: contentPopulate(strapi), limit: 1000 });
  return { entries: imported.size, files: files.size, documentIds: Object.fromEntries(imported), records: entries };
}
module.exports = { importPortfolio };
