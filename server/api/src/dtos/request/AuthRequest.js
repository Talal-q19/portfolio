const { HttpError } = require('../../middleware/errors');
class AuthRequest {
  static from(req) {
    if (req.method === 'POST' && (!req.is('application/json') || !req.body || Array.isArray(req.body))) throw new HttpError(415, 'Use a JSON object.');
    return req.body;
  }
}
module.exports = { AuthRequest };
