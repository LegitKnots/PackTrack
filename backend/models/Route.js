const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  label: { type: String },
  order: { type: Number, required: true }
}, { _id: false });

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pack' },
  waypoints: [WaypointSchema],
  isShared: { type: Boolean, default: false },
  shareCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Route', RouteSchema);
