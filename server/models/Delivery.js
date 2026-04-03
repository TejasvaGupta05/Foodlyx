const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foodRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest', required: true },
  status: {
    type: String,
    enum: ['pending', 'picked', 'in-transit', 'delivered'],
    default: 'pending',
  },
  pickupLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  dropLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  deliveryProof: { type: String, default: '' }, // image URL
  notes: { type: String, default: '' },
  timestamps: {
    createdAt: { type: Date, default: Date.now },
    pickedAt: { type: Date },
    startedAt: { type: Date },
    deliveredAt: { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);