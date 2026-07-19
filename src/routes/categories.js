const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { listCategories } = require('../controllers/categoriesController');

const router = Router();

router.get('/', asyncHandler(listCategories));

module.exports = router;
