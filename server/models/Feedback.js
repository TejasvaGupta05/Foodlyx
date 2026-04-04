const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  foodRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest', required: true },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest', required: true },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facilityName: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedbackText: { type: String, default: '' },
  complaintType: {
    type: String,
    enum: ['spoiled_food', 'insufficient_quantity', 'wrong_information', 'unsafe_food', 'other', 'none'],
    default: 'none',
  },
  complaintDescription: { type: String, default: '' },
  resolutionStatus: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);