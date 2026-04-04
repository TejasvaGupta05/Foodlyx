const mongoose = require('mongoose');

const charityDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  donorPhone: { type: String, default: '' },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'INR' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CharityDonation', charityDonationSchema);
