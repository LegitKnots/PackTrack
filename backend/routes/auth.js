const express = require('express');
const router = express.Router();
const { login, verifyMFA, signup } = require('../controllers/authController');

router.post('/login', login);
router.post('/verify-mfa', verifyMFA);
router.post('/signup', signup);

module.exports = router;
