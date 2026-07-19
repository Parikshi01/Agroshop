const { Router } = require('express');
const { query, param } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { listProducts, getProduct } = require('../controllers/productsController');

const router = Router();

router.get(
    '/',
    [
        query('category').optional().isString().trim().isLength({ max: 50 }),
        query('search').optional().isString().trim().isLength({ max: 100 }),
    ],
    validate,
    asyncHandler(listProducts)
);

router.get(
    '/:id',
    [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')],
    validate,
    asyncHandler(getProduct)
);

module.exports = router;
