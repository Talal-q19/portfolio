const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const root = path.resolve(__dirname, '..');
let count = 0;
function check(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) check(file);
    else if (entry.name.endsWith('.js')) { new Script(fs.readFileSync(file, 'utf8'), { filename: file }); count++; }
  }
}
for (const directory of ['src', 'scripts', 'data-migration/scripts']) check(path.join(root, directory));
console.log(`Checked ${count} backend JavaScript files.`);
