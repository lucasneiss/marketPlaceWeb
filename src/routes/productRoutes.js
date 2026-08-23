const express = require('express');
const ProductController = require('../controllers/ProductController');

const router = express.Router();
router.get('/catalog', ProductController.index);
router.get('/products/:slug', ProductController.show);
router.get('/sellers/:slug', ProductController.sellerPublic);
module.exports = router;
