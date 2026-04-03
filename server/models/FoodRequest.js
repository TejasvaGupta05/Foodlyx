const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodType: { type: String, required: true },
  quantity: { type: Number, required: true }, // kg or servings
  shelfLifeHours: { type: Number, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  category: {
    type: String,
    enum: ['edible', 'semi_edible', 'non_edible'],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'delivered', 'cancelled'],
    default: 'pending',
  },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveredAt: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
