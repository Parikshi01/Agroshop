const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Run after an express-validator chain; turns validation failures into a 400.
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError(400, 'Invalid request', errors.array().map((e) => ({
            field: e.path,
            message: e.msg,
        })));
    }
    next();
}

module.exports = validate;
