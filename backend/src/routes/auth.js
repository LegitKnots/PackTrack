const express = require('express');
const router = express.Router();
const { login, verifyMFA } = require('../controllers/authController');

router.post('/login', login);
router.post('/verify-mfa', verifyMFA);

module.exports = router;
