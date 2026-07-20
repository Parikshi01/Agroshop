const { Pool } = require('pg');

console.log("=================================");
console.log("DATABASE_URL:");
console.log(process.env.DATABASE_URL);
console.log("=================================");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL Connected");
});

pool.on("error", (err) => {
    console.error("POOL ERROR:", err);
});

module.exports = { pool };