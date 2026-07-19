/**
 * Throwaway integration smoke test — NOT part of the shipped app.
 * Runs the real Express app against an in-memory Postgres (pg-mem) so we can
 * verify the whole request/response chain without a real database.
 * Run with: node test-integration.js
 */
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGINS = '';

const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

const db = newDb({ autoCreateForeignKeyIndices: true });
db.public.registerFunction({
    name: 'now',
    returns: 'timestamp',
    implementation: () => new Date(),
});

const { Pool } = db.adapters.createPg();

// Inject the in-memory pg driver before any of our app code requires 'pg'.
const pgPath = require.resolve('pg');
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: { Pool } };

const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf8');

let failures = 0;
function assert(cond, msg) {
    if (!cond) {
        failures++;
        console.error(`❌ FAIL: ${msg}`);
    } else {
        console.log(`✅ ${msg}`);
    }
}

async function main() {
    // pg-mem doesn't support PL/pgSQL trigger functions the same way real PG does —
    // strip the trigger block for this smoke test; the schema itself is still applied
    // verbatim against real Postgres in production.
    const schemaNoTrigger = schema.replace(/-- Keep updated_at[\s\S]*$/m, 'COMMIT;\n');

    db.public.none(schemaNoTrigger);
    db.public.none(seed);
    console.log('Schema + seed applied to in-memory DB.\n');

    const buildApp = require('./src/app');
    const request = require('supertest');
    const app = buildApp();

    // --- Health ---
    let res = await request(app).get('/api/health');
    assert(res.status === 200 && res.body.success === true, 'GET /api/health -> 200 + success:true');

    // --- Products list ---
    res = await request(app).get('/api/products');
    assert(res.status === 200, 'GET /api/products -> 200');
    assert(res.body.success === true, 'GET /api/products -> success:true');
    assert(Array.isArray(res.body.data) && res.body.data.length === 12, 'GET /api/products -> 12 seeded products');
    assert(res.body.data[0].id !== undefined, 'product rows expose "id" field (matches frontend contract)');

    // --- Products filter by category ---
    res = await request(app).get('/api/products?category=pesticide');
    assert(res.status === 200 && res.body.data.every((p) => p.category === 'pesticide'), 'GET /api/products?category=pesticide filters correctly');

    // --- Products search ---
    res = await request(app).get('/api/products?search=neem');
    assert(res.status === 200 && res.body.data.length >= 1, 'GET /api/products?search=neem finds Neem Oil product');

    // --- Single product ---
    res = await request(app).get('/api/products/1');
    assert(res.status === 200 && res.body.data.id === 1, 'GET /api/products/1 -> correct product');

    res = await request(app).get('/api/products/99999');
    assert(res.status === 404 && res.body.success === false, 'GET /api/products/99999 -> 404 not found');

    res = await request(app).get('/api/products/not-a-number');
    assert(res.status === 400, 'GET /api/products/not-a-number -> 400 validation error');

    // --- Categories ---
    res = await request(app).get('/api/categories');
    assert(res.status === 200 && res.body.data.length === 4, 'GET /api/categories -> 4 seeded categories');

    // --- Cart: add ---
    res = await request(app).post('/api/cart').send({ user_id: 'test_user_1', product_id: 1, quantity: 2 });
    assert(res.status === 201 && res.body.data.quantity === 2, 'POST /api/cart adds item with quantity 2');

    // --- Cart: add same product again increments quantity ---
    res = await request(app).post('/api/cart').send({ user_id: 'test_user_1', product_id: 1, quantity: 3 });
    assert(res.status === 201 && res.body.data.quantity === 5, 'POST /api/cart on same product increments existing quantity (2+3=5)');

    // --- Cart: validation rejects bad input ---
    res = await request(app).post('/api/cart').send({ user_id: 'test_user_1', product_id: 'nope', quantity: 1 });
    assert(res.status === 400, 'POST /api/cart with non-numeric product_id -> 400');

    res = await request(app).post('/api/cart').send({ user_id: 'test_user_1', product_id: 99999, quantity: 1 });
    assert(res.status === 404, 'POST /api/cart with nonexistent product -> 404');

    // --- Cart: get ---
    res = await request(app).get('/api/cart/test_user_1');
    assert(res.status === 200 && res.body.data.items.length === 1 && res.body.data.count === 1, 'GET /api/cart/:userId returns items + count');
    assert(res.body.data.total === 5 * Number(res.body.data.items[0].price), 'GET /api/cart/:userId computes correct total');

    // --- Cart: update quantity ---
    res = await request(app).patch('/api/cart/test_user_1/1').send({ quantity: 9 });
    assert(res.status === 200 && res.body.data.quantity === 9, 'PATCH /api/cart/:userId/:productId updates quantity');

    // --- Cart: remove ---
    res = await request(app).delete('/api/cart/test_user_1/1');
    assert(res.status === 200 && res.body.data.removed === true, 'DELETE /api/cart/:userId/:productId removes item');

    res = await request(app).get('/api/cart/test_user_1');
    assert(res.body.data.items.length === 0, 'cart is empty after removal');

    // --- 404 for unknown route ---
    res = await request(app).get('/api/does-not-exist');
    assert(res.status === 404, 'unknown route -> 404 handler');

    // --- Security headers present (helmet) ---
    res = await request(app).get('/api/health');
    assert(!!res.headers['x-content-type-options'], 'helmet security headers present');
    assert(res.headers['x-powered-by'] === undefined, 'X-Powered-By header disabled');

    console.log(`\n${failures === 0 ? '🎉 ALL TESTS PASSED' : `❌ ${failures} TEST(S) FAILED`}`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error('Test run crashed:', err);
    process.exit(1);
});
