const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const target = path.join(root, '.env');
if (fs.existsSync(target)) throw new Error('Local .env already exists; it was not overwritten.');
let example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['APP_KEYS', 'API_TOKEN_SALT', 'ADMIN_JWT_SECRET', 'TRANSFER_TOKEN_SALT', 'ENCRYPTION_KEY', 'JWT_SECRET']) {
  const secret = () => crypto.randomBytes(32).toString('hex');
  example = example.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${key === 'APP_KEYS' ? [secret(), secret()].join(',') : secret()}`);
}
fs.writeFileSync(target, example, { flag: 'wx' });
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
console.log('Created private local CMS environment.');
