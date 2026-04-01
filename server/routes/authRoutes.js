const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route (ใช้ token)
router.get('/me', authController.me);

module.exports = router;
