require('dotenv').config();

const buildApp = require('./src/app');
const { pool, checkConnection } = require('./src/config/db');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
    try {
        await checkConnection();
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('⚠️  Could not connect to the database at startup:', err.message);
        console.error('    The server will still start, but API calls that hit the DB will fail.');
    }

    const app = buildApp();
    const server = app.listen(PORT, () => {
        console.log('========================================');
        console.log(`🚀 AgroShop API running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('========================================');
    });

    // Graceful shutdown so in-flight requests finish and DB connections close cleanly.
    const shutdown = (signal) => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        server.close(async () => {
            try {
                await pool.end();
                console.log('Closed remaining connections. Bye.');
                process.exit(0);
            } catch (err) {
                console.error('Error during shutdown:', err.message);
                process.exit(1);
            }
        });
        // Force-exit if something hangs
        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
