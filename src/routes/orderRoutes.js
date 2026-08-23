const express = require('express');
const OrderController = require('../controllers/OrderController');
const ReviewController = require('../controllers/ReviewController');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();
router.get('/checkout', requireRole('CLIENT'), OrderController.checkout);
router.post('/checkout', requireRole('CLIENT'), OrderController.create);
router.get('/orders', requireRole('CLIENT'), OrderController.list);
router.get('/orders/:id', requireRole('CLIENT'), OrderController.show);
router.post('/orders/:id/cancel', requireRole('CLIENT'), OrderController.cancel);
router.post('/orders/:orderId/items/:itemId/review', requireRole('CLIENT'), ReviewController.create);
module.exports = router;
