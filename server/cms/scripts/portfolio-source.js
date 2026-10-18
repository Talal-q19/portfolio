const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const client = path.resolve(__dirname, '../../../client');
function buildPortfolioSource() {
  // Immutable migration input: live renderer refactors must not change import identity/content.
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'portfolio-source.json'), 'utf8'));
}

function sourceFile(source) {
  const migrationAsset = source.startsWith('/migration-assets/');
  const base = migrationAsset ? path.resolve(__dirname, '../assets') : source.startsWith('/app/') ? client : path.join(client, 'public');
  const target = path.resolve(base, migrationAsset ? source.slice('/migration-assets/'.length) : `.${source}`);
  if (!target.startsWith(base + path.sep) || !fs.statSync(target).isFile()) throw new Error(`Invalid source media path ${source}`);
  return target;
}
function fileKey(source) {
  return crypto.createHash('sha256').update(source).update(fs.readFileSync(sourceFile(source))).digest('hex');
}
module.exports = { buildPortfolioSource, sourceFile, fileKey };
