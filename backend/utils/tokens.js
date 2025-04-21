const jwt = require('jsonwebtoken');

exports.generateToken = (email, userID) => {
  return jwt.sign({ email, userID }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

exports.generateTempToken = (email) => {
  return jwt.sign({ email, userID }, process.env.JWT_SECRET, { expiresIn: '5m' });
};
