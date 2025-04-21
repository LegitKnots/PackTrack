const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  label: { type: String },
  order: { type: Number, required: true }
}, { _id: false });

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  tags: [String],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  packId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pack' },

  waypoints: [WaypointSchema],

  distance: {type: String},

  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },

  isShared: { type: Boolean, default: false },
  shareCode: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Route', RouteSchema);
