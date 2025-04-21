const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pack' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Number, required: true }
});

module.exports = mongoose.model('Location', LocationSchema);
