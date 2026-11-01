const { createHash } = require('node:crypto');
const digest = value => createHash('sha256').update(value).digest('hex');
// A fifth failure starts the full lock period. Reads and retries never extend it.
const attemptScript = `
  local function attempts(key, action, seconds)
    local n = tonumber(redis.call('GET', key) or '0')
    if n < 5 then
      if action == 'clear' then redis.call('DEL', key); n = 0
      elseif action == 'fail' then
        n = redis.call('INCR', key)
        if n == 1 or n == 5 then redis.call('EXPIRE', key, seconds) end
      end
    end
    local ttl = 0
    if n >= 5 then ttl = math.max(1, redis.call('TTL', key)) end
    return { failed = n, limit = 5, blocked = n >= 5, retryAfterSeconds = ttl }
  end
`;
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
  async attempts(kind, id, action = 'status', seconds = kind === 'password' ? 86400 : 300) {
    const result = await this.redis.eval(`${attemptScript} return cjson.encode(attempts(KEYS[1], ARGV[1], tonumber(ARGV[2])))`, {
      keys: [this.key(`attempts:${kind}`, id)], arguments: [action, String(seconds)],
    });
    return { kind, ...JSON.parse(result) };
  }
  async verifyOtp(id, proof, purpose, accountId) {
    const result = await this.redis.eval(`${attemptScript}
      local raw = redis.call('GET', KEYS[1]); if not raw then return '{}' end
      local value = cjson.decode(raw)
      if value.id ~= ARGV[3] or value.purpose ~= ARGV[2] then return '{}' end
      local state = attempts(KEYS[2], 'status', 300)
      if state.blocked then return cjson.encode({ attempts = state }) end
      if value.proof ~= ARGV[1] then
        return cjson.encode({ attempts = attempts(KEYS[2], 'fail', 300) })
      end
      redis.call('DEL', KEYS[1])
      return cjson.encode({ data = value, attempts = attempts(KEYS[2], 'clear', 300) })`, {
      keys: [this.key('otp', id), this.key('attempts:otp', accountId)], arguments: [proof, purpose, accountId],
    });
    const value = JSON.parse(result);
    if (value.attempts) value.attempts.kind = 'otp';
    return value;
  }
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
