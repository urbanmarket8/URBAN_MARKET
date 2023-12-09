// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Define routes
router.post('/add-to-cart', cartController.addToCart);
router.get('/get-cart/:userId', cartController.getCart);
router.delete('/delete-from-cart/:userId/:productId', cartController.deleteFromCart); // Add this line

module.exports = router;
