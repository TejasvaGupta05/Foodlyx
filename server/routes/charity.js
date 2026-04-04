const express = require('express');
const CharityDonation = require('../models/CharityDonation');
const router = express.Router();

// POST /api/charity/donate — submit charity donation
router.post('/donate', async (req, res) => {
  try {
    const {
      donorName,
      donorEmail,
      donorPhone,
      amount,
      message,
    } = req.body;

    if (!donorName || !donorEmail || !amount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (amount < 1) {
      return res.status(400).json({ message: 'Donation amount must be at least ₹1' });
    }

    const donation = await CharityDonation.create({
      donorName,
      donorEmail,
      donorPhone: donorPhone || '',
      amount: parseFloat(amount),
      message: message || '',
      status: 'completed',
      transactionId: 'TXN-' + Date.now(),
    });

    res.status(201).json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/charity/donations — all donations (admin)
router.get('/donations', async (req, res) => {
  try {
    const donations = await CharityDonation.find()
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/charity/stats — donation statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await CharityDonation.countDocuments();
    const completedDonations = await CharityDonation.countDocuments({ status: 'completed' });
    const totalAmount = await CharityDonation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      totalDonations,
      completedDonations,
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
