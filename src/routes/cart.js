const { Router } = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
} = require('../controllers/cartController');

const router = Router();

const userIdRule = () => body('user_id').isString().trim().isLength({ min: 1, max: 120 });

router.post(
    '/',
    [
        userIdRule(),
        body('product_id').isInt({ min: 1 }),
        body('quantity').optional().isInt({ min: 1, max: 100 }),
    ],
    validate,
    asyncHandler(addToCart)
);

router.get(
    '/:userId',
    [param('userId').isString().trim().isLength({ min: 1, max: 120 })],
    validate,
    asyncHandler(getCart)
);

router.patch(
    '/:userId/:productId',
    [
        param('userId').isString().trim().isLength({ min: 1, max: 120 }),
        param('productId').isInt({ min: 1 }),
        body('quantity').isInt({ min: 1, max: 100 }),
    ],
    validate,
    asyncHandler(updateCartItem)
);

router.delete(
    '/:userId/:productId',
    [
        param('userId').isString().trim().isLength({ min: 1, max: 120 }),
        param('productId').isInt({ min: 1 }),
    ],
    validate,
    asyncHandler(removeCartItem)
);

module.exports = router;
