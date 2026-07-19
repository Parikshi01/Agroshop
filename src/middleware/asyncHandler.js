// Wraps an async route handler so rejected promises reach the error middleware.
// (Express 5 does this automatically, but keeping the wrapper makes intent explicit
// and keeps the code portable if the app is ever downgraded.)
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
