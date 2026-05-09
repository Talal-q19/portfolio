const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const sourceDir = path.join(repoRoot, 'my stuff');
const destDir = path.join(repoRoot, 'public', 'company-logos');

const files = [
  { src: 'eunx.jfif', dest: 'eunx.jfif' },
  { src: 'federal_electric.jfif', dest: 'federal_electric.jfif' },
  { src: 'bacha_smart_solutions.jfif', dest: 'bacha_smart_solutions.jfif' },
];

if (!fs.existsSync(sourceDir)) {
  console.error('Source folder not found:', sourceDir);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

files.forEach(({ src, dest }) => {
  const from = path.join(sourceDir, src);
  const to = path.join(destDir, dest);

  if (!fs.existsSync(from)) {
    console.warn('Source file not found, skipping:', from);
    return;
  }

  try {
    fs.copyFileSync(from, to);
    console.log('Copied', from, '→', to);
  } catch (err) {
    console.error('Failed to copy', from, err);
  }
});

console.log('Done.');
