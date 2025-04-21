const express = require('express');
const router = express.Router();
const { updateProfile, getUserProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:userId/profile', auth, getUserProfile);
router.patch('/:userId/profile', auth, updateProfile);

module.exports = router;
