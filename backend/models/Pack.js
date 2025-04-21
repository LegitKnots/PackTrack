const mongoose = require('mongoose');

const PackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  chatEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Pack', PackSchema);
