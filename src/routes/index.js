const { Router } = require('express');

const router = Router();

router.use('/health', require('./health'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/cart', require('./cart'));

module.exports = router;
