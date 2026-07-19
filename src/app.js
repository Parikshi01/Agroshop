const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { pool } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function buildApp() {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(helmet());
    app.use(compression());
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    app.use(express.json({ limit: '100kb' }));

    // Temporary CORS (Debug)
    app.use(cors({
        origin: true,
        credentials: true,
    }));

    const limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX) || 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: 'Too many requests, please try again later.',
        },
    });

    app.use('/api', limiter);

    // ===========================
    // DATABASE DEBUG ROUTE
    // ===========================
    app.get('/debug-db', async (req, res) => {
    try {
        const db = await pool.query(`
            SELECT
                current_database() AS database,
                current_schema() AS schema,
                current_user AS user
        `);

        const tables = await pool.query(`
            SELECT table_schema, table_name
            FROM information_schema.tables
            ORDER BY table_schema, table_name;
        `);

        res.json({
            info: db.rows[0],
            tables: tables.rows
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

    // ===========================

    app.use('/api', routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = buildApp;