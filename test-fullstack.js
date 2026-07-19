/**
 * Throwaway full-stack smoke test — NOT part of the shipped app.
 * Starts the real server on a real port (backed by in-memory pg-mem) and hits it
 * with real HTTP fetch() calls, the same way the deployed frontend would.
 * Run with: node test-fullstack.js
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.ALLOWED_ORIGINS = 'http://localhost:5500';

const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

const db = newDb({ autoCreateForeignKeyIndices: true });
const { Pool } = db.adapters.createPg();
const pgPath = require.resolve('pg');
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: { Pool } };

const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8').replace(/-- Keep updated_at[\s\S]*$/m, 'COMMIT;\n');
const seed = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf8');
db.public.none(schema);
db.public.none(seed);

let failures = 0;
function assert(cond, msg) {
    if (!cond) { failures++; console.error(`❌ FAIL: ${msg}`); }
    else console.log(`✅ ${msg}`);
}

async function main() {
    const buildApp = require('./src/app');
    const app = buildApp();
    const server = app.listen(5099);
    await new Promise((r) => server.once('listening', r));

    const BASE = 'http://localhost:5099/api';

    // Real HTTP round-trip, real CORS headers, real gzip compression handling.
    let res = await fetch(`${BASE}/products`, { headers: { Origin: 'http://localhost:5500' } });
    assert(res.status === 200, 'real HTTP GET /api/products -> 200');
    assert(res.headers.get('access-control-allow-origin') === 'http://localhost:5500', 'CORS allows configured origin');
    const body = await res.json();
    assert(body.success === true && body.data.length === 12, 'real HTTP response has correct product count');

    res = await fetch(`${BASE}/products`, { headers: { Origin: 'http://evil.example.com' } });
    // cors middleware doesn't block the response body for simple GETs without proper preflight in this test client,
    // but it must NOT reflect the disallowed origin back.
    assert(res.headers.get('access-control-allow-origin') !== 'http://evil.example.com', 'CORS does not reflect disallowed origin');

    res = await fetch(`${BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5500' },
        body: JSON.stringify({ user_id: 'fullstack_test', product_id: 2, quantity: 1 }),
    });
    assert(res.status === 201, 'real HTTP POST /api/cart -> 201');

    res = await fetch(`${BASE}/cart/fullstack_test`);
    const cart = await res.json();
    assert(cart.data.items.length === 1, 'real HTTP cart retrieval works end-to-end');

    server.close();
    console.log(`\n${failures === 0 ? '🎉 FULL-STACK SMOKE TEST PASSED' : `❌ ${failures} TEST(S) FAILED`}`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
