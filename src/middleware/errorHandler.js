// Custom error type routes can throw for expected, client-facing failures.
class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

function notFound(req, res) {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

// Must be the last app.use() — 4 params is what tells Express this is an error handler.
function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const isServerError = statusCode >= 500;

    if (isServerError) {
        // Full detail server-side only — never leak stack traces to clients.
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ->`, err);
    }

    res.status(statusCode).json({
        success: false,
        error: isServerError && process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        ...(err.details ? { details: err.details } : {}),
    });
}

module.exports = { ApiError, notFound, errorHandler };
