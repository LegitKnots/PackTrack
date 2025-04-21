const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Number, required: true },
  ip: { type: String },
  userAgent: { type: String }
});

module.exports = mongoose.model('AccessLog', AccessLogSchema);
