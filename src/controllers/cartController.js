const { pool } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// POST /api/cart  { user_id, product_id, quantity }
async function addToCart(req, res) {
    const { user_id, product_id, quantity = 1 } = req.body;

    const product = await pool.query(
        'SELECT product_id FROM products WHERE product_id = $1 AND is_active = TRUE',
        [product_id]
    );
    if (product.rows.length === 0) {
        throw new ApiError(404, 'Product not found');
    }

    const result = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 100)
         RETURNING id, user_id, product_id, quantity`,
        [user_id, product_id, quantity]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
}

// GET /api/cart/:userId
async function getCart(req, res) {
    const result = await pool.query(
        `SELECT c.id AS cart_item_id, c.product_id, c.quantity,
                p.name, p.price, p.icon
         FROM cart_items c
         JOIN products p ON c.product_id = p.product_id
         WHERE c.user_id = $1
         ORDER BY c.created_at`,
        [req.params.userId]
    );

    const items = result.rows.map((row) => ({
        cartItemId: row.cart_item_id,
        productId: row.product_id,
        name: row.name,
        price: row.price,
        icon: row.icon,
        quantity: row.quantity,
        subtotal: Number(row.price) * row.quantity,
    }));
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ success: true, data: { items, total, count: items.length } });
}

// PATCH /api/cart/:userId/:productId  { quantity }
async function updateCartItem(req, res) {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    const result = await pool.query(
        `UPDATE cart_items SET quantity = $1
         WHERE user_id = $2 AND product_id = $3
         RETURNING id, user_id, product_id, quantity`,
        [quantity, userId, productId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Cart item not found');
    }
    res.json({ success: true, data: result.rows[0] });
}

// DELETE /api/cart/:userId/:productId
async function removeCartItem(req, res) {
    const { userId, productId } = req.params;
    const result = await pool.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING id',
        [userId, productId]
    );
    if (result.rows.length === 0) {
        throw new ApiError(404, 'Cart item not found');
    }
    res.json({ success: true, data: { removed: true } });
}

module.exports = { addToCart, getCart, updateCartItem, removeCartItem };
