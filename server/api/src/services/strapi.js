const { HttpError } = require('../middleware/errors');
function createStrapiService(config, fetchImpl = fetch) {
  return async (path, { method = 'GET', token, body, contentType } = {}) => {
    const credential = token || config.cmsReadToken;
    if (!credential) throw new HttpError(503, 'Content service is not configured.');
    try {
      const response = await fetchImpl(`${config.cmsUrl || 'http://127.0.0.1:1337'}/api/portfolio/${path}`, {
        method, signal: AbortSignal.timeout(config.cmsTimeout || 10000),
        headers: { Authorization: `Bearer ${credential}`, ...(body !== undefined ? { 'Content-Type': contentType || 'application/json' } : {}) },
        body: body === undefined ? undefined : contentType ? body : JSON.stringify(body), cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) {
        const allowed = [400, 404, 409, 413, 422, ...(token ? [401, 403] : [])];
        throw new HttpError(allowed.includes(response.status) ? response.status : 502, response.status === 422 ? 'Content is incomplete or invalid.' : token && [401, 403].includes(response.status) ? 'Administrator authentication or access failed.' : 'Content service request failed.', data.fields || data.error?.details?.fields);
      }
      return data;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Content service is unavailable.');
    }
  };
}
module.exports = { createStrapiService };
