const User = require('../models/User');
const { generateToken, generateTempToken } = require('../utils/tokens');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// temporary in-memory store (replace later with DB-backed or Redis)
const mfaCodes = {};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid email' });

  const isValid = await user.validatePassword(password);
  if (!isValid) return res.status(401).json({ message: 'Invalid password' });

  if (user.mfaEnabled) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    mfaCodes[email] = code;
    console.log(`🔐 MFA code for ${email}: ${code}`);
    return res.status(200).json({ message: 'MFA required', tempToken: generateTempToken(email) });
  }

  const token = generateToken(email); // or generateToken(user._id) depending on your setup

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
    },
  });
};


exports.verifyMFA = async (req, res) => {
  const { otp, token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expected = mfaCodes[decoded.email];

    if (otp === expected) {
      delete mfaCodes[decoded.email];
      return res.status(200).json({ message: 'MFA verified', token: generateToken(decoded.email) });
    } else {
      return res.status(401).json({ message: 'Invalid code' });
    }
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};



exports.signup = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user and set password hash
    const user = new User({ fullname, email });
    await user.setPassword(password);

    // Save user
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};