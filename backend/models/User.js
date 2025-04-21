const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // swapped out bcrypt

const UserSchema = new mongoose.Schema({
  username: { type: String, default: '', unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String },
  fullname: { type: String },
  packs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pack' }],
  bike: { type: String },
  bio: { type: String },
  location: { type: String },
  profilePicUrl: { type: String, default: "" }
}, { timestamps: true });

// Hash and set password
UserSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

// Validate input password against hash
UserSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);