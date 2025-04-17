const User = require('../models/User');
const { generateToken, generateTempToken } = require('../utils/tokens');
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

  return res.status(200).json({ message: 'Login successful', token: generateToken(email) });
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
