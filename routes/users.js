// routes/auth.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define routes
router.get('/counts', userController.getUsersCounts);

module.exports = router;
