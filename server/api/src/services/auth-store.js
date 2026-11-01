const { createHash } = require('node:crypto');
const digest = value => createHash('sha256').update(value).digest('hex');
class AuthStore {
  constructor(redis) { this.redis = redis; }
  key(kind, id) { return `portfolio:auth:${kind}:${digest(id)}`; }
  async limit(id, max, seconds) {
    const count = await this.redis.eval(`local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n`, {
      keys: [this.key('limit', id)], arguments: [String(seconds)],
    });
    return Number(count) <= max;
  }
  async put(kind, id, value, seconds) {
    await this.redis.set(this.key(kind, id), JSON.stringify(value), { EX: seconds });
  }
  async get(kind, id) { const value = await this.redis.get(this.key(kind, id)); return value ? JSON.parse(value) : null; }
  async remove(kind, id) { await this.redis.del(this.key(kind, id)); }
  // Comparison, attempt counting, and consumption run atomically across API instances.
  async consume(kind, id, proof) {
    const value = await this.redis.eval(`
      local raw = redis.call('GET', KEYS[1]); if not raw then return false end
      local value = cjson.decode(raw)
      if value.proof ~= ARGV[1] then
        value.attempts = (value.attempts or 0) + 1
        if value.attempts >= 5 then redis.call('DEL', KEYS[1])
        else
          local ttl = redis.call('PTTL', KEYS[1])
          if ttl > 0 then redis.call('SET', KEYS[1], cjson.encode(value), 'PX', ttl)
          else redis.call('DEL', KEYS[1]) end
        end
        return false
      end
      redis.call('DEL', KEYS[1]); return raw`, {
      keys: [this.key(kind, id)], arguments: [proof],
    });
    return value ? JSON.parse(value) : null;
  }
}
module.exports = { AuthStore };
