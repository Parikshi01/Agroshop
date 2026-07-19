const { Pool } = require('pg');

const useSSL = String(process.env.PGSSL).toLowerCase() === 'true' ||
    process.env.NODE_ENV === 'production';

// Prefer a single DATABASE_URL (what every managed Postgres host gives you),
// fall back to discrete PG* fields for local development.
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
    }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || 'agroshop_db',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        ssl: useSSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// A lost idle-client connection must not crash the whole process.
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

async function checkConnection() {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        return true;
    } finally {
        client.release();
    }
}

module.exports = { pool, poolConfig, checkConnection };
