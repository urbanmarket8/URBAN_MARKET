// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify/:token', authController.verify);

module.exports = router;
