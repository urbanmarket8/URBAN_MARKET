// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Define routes
router.post('/add-to-cart', cartController.addToCart);
router.get('/', cartController.getCart);
router.delete('/delete-from-cart/:productId', cartController.deleteFromCart);

module.exports = router;
