const { createHash } = require('node:crypto');
const { HttpError } = require('../middleware/errors');
function createConvexClient(config, fetchImpl = fetch) {
  return async (operation, args = {}) => {
    if (!config.convexUrl || !config.convexSecret) throw new HttpError(503, 'Convex is not configured.');
    try {
      const response = await fetchImpl(`${config.convexUrl}/bridge`, {
        method: 'POST', signal: AbortSignal.timeout(15000), cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.convexSecret}` },
        body: JSON.stringify({ operation, args }),
      });
      const result = await response.json();
      if (!response.ok) throw new HttpError([400, 404, 409, 413, 422].includes(response.status) ? response.status : 503, result.message || 'Data service unavailable.', result.fields);
      return result;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Data service unavailable.');
    }
  };
}

module.exports = { createConvexClient };
