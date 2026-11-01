const { randomBytes, scrypt: derive, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(derive);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 256) {
    throw new Error('Use at least 8 characters and at most 256 UTF-8 bytes.');
  }
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, options);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verifyPassword(password, hash) {
  if (typeof password !== 'string' || Buffer.byteLength(password) > 256) return false;
  const [kind, salt, digest] = (hash || '').split('$');
  if (kind !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(digest)) return false;
  const key = await scrypt(password, salt, 64, options);
  return timingSafeEqual(key, Buffer.from(digest, 'hex'));
}
module.exports = { hashPassword, verifyPassword };
