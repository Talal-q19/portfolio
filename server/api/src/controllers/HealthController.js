// Base path: /api/health
class HealthController {
  // GET /api/health
  read(req, res) {
    res.json({ success: true, status: 'ok' });
  }
}

module.exports = { HealthController };
