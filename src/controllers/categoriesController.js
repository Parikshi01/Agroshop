const { pool } = require('../config/db');

// GET /api/categories
async function listCategories(req, res) {
    const result = await pool.query(
        'SELECT slug, name, description, icon FROM categories ORDER BY id'
    );
    res.json({ success: true, data: result.rows });
}

module.exports = { listCategories };
