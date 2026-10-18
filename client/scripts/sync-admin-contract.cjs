// Keep the browser validator identical to the API/CMS without exposing server code/secrets.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../../server/content-contract/index.js');
fs.copyFileSync(source, path.resolve(__dirname, '../utils/admin-contract.cjs'));
