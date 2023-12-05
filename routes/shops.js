// routes/shops.js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Define routes
router.post('/', shopController.createShop);
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);
router.put('/:id', shopController.updateShopById);
router.delete('/:id', shopController.deleteShopById);

module.exports = router;
