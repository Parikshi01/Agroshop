const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on("connect", async (client) => {
    try {
        const db = await client.query("SELECT current_database()");
        console.log("Connected Database:", db.rows[0].current_database);

        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
            ORDER BY table_name
        `);

        console.log("Tables:", tables.rows);
    } catch (err) {
        console.error("Database Debug Error:", err.message);
    }
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL Error:", err);
});

async function checkConnection() {
    const client = await pool.connect();

    try {
        await client.query("SELECT 1");
        return true;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    checkConnection,
};