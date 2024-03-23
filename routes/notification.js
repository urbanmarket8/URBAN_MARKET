// routes/shops.js
const express = require('express');
const router = express.Router();
const Notifications = require('../controllers/notificationController');

// Define routes
router.get('/', Notifications.getShopNotification);

module.exports = router;
