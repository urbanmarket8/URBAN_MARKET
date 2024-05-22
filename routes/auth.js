// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/verify/:token', authController.verify);
router.post('/password-forgot', authController.forgotPassword);
router.post('/password-reset', authController.resetPassword);

module.exports = router;
