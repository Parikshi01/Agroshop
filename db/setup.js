/**
 * One-shot DB bootstrap: creates tables (schema.sql) then loads sample data (seed.sql).
 * Usage: npm run db:setup
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { poolConfig } = require('../src/config/db');

async function main() {
    const pool = new Pool(poolConfig);
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

        console.log('Applying schema...');
        await pool.query(schema);
        console.log('Schema applied.');

        console.log('Loading seed data...');
        await pool.query(seed);
        console.log('Seed data loaded.');

        console.log('✅ Database setup complete.');
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
