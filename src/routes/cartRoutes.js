const express = require('express');
const CartController = require('../controllers/CartController');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();
router.get('/cart', requireRole('CLIENT'), CartController.show);
router.post('/cart/items', requireRole('CLIENT'), CartController.add);
router.patch('/cart/items/:id', requireRole('CLIENT'), CartController.update);
router.delete('/cart/items/:id', requireRole('CLIENT'), CartController.remove);
module.exports = router;
