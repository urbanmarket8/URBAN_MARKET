// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Define routes
router.post('/place-order', orderController.placeOrder);
router.get('/order-history/:customerId', orderController.getOrderHistory);

module.exports = router;
