const { checkConnection } = require('../config/db');

// GET /api/health
async function health(req, res) {
    try {
        await checkConnection();
        res.json({ success: true, status: 'ok', database: 'connected', time: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ success: false, status: 'degraded', database: 'unreachable', error: err.message });
    }
}

module.exports = { health };
