const { pool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/products?category=pesticide&search=neem
async function listProducts(req, res) {
    const { category, search } = req.query;
    const clauses = ['is_active = TRUE'];
    const params = [];

    if (category && category !== 'all') {
        params.push(category);
        clauses.push(`category = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        clauses.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const query = `
        SELECT product_id AS id, name, description, price, category, icon, badge, stock
        FROM products
        WHERE ${clauses.join(' AND ')}
        ORDER BY product_id
    `;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
}

// GET /api/products/:id
async function getProduct(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new ApiError(400, 'Product id must be a positive integer');
    }

    const result = await pool.query(
        `SELECT product_id AS id, name, description, price, category, icon, badge, stock
         FROM products WHERE product_id = $1 AND is_active = TRUE`,
        [id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Product not found');
    }
    res.json({ success: true, data: result.rows[0] });
}

module.exports = { listProducts, getProduct };
