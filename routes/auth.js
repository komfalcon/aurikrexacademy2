const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { register, login, me, logout, updateProfile, verifyEmail, verifyCode, resendCode } = require('../controllers/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);
router.post('/profile', authMiddleware, updateProfile);
router.get('/verify-email', verifyEmail);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);

module.exports = router;
