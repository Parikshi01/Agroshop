const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { ApiError, notFound, errorHandler } = require('./middleware/errorHandler');

function buildApp() {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', 1); // needed behind Render/Railway/any reverse proxy

    app.use(helmet());
    app.use(compression());
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    app.use(express.json({ limit: '100kb' }));

    // CORS allowlist — configure ALLOWED_ORIGINS in .env, comma-separated.
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    app.use(cors({
        origin(origin, callback) {
            // Allow same-origin/non-browser requests (no Origin header) and anything on the list.
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new ApiError(403, 'Not allowed by CORS'));
            }
        },
    }));

    const limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX) || 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: 'Too many requests, please try again later.' },
    });
    app.use('/api', limiter);

    app.use('/api', routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = buildApp;
