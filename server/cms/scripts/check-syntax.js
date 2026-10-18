const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
let count = 0;
function check(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) check(target);
    else if (entry.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', target], { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status || 1);
      count++;
    } else if (entry.name.endsWith('.json')) JSON.parse(fs.readFileSync(target, 'utf8'));
  }
}
for (const directory of ['src', 'config', 'scripts', 'tests']) check(path.resolve(__dirname, '..', directory));
console.log(`Checked ${count} JavaScript files and schema JSON.`);
