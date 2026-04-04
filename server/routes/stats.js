const express = require('express');
const FoodRequest = require('../models/FoodRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/stats/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalRequests = await FoodRequest.countDocuments();
    const delivered = await FoodRequest.countDocuments({ status: 'delivered' });
    const pending = await FoodRequest.countDocuments({ status: 'pending' });
    const accepted = await FoodRequest.countDocuments({ status: 'accepted' });

    // Meals saved = sum of quantity for delivered requests
    const mealsSavedAgg = await FoodRequest.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const mealsSaved = mealsSavedAgg[0]?.total || 0;

    // Waste diverted = non_edible + semi_edible delivered
    const wasteDivertedAgg = await FoodRequest.aggregate([
      { $match: { status: 'delivered', category: { $in: ['semi_edible', 'non_edible'] } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const wasteDiverted = wasteDivertedAgg[0]?.total || 0;

    const cancelled = await FoodRequest.countDocuments({ status: 'cancelled' });

    // Top donors by impactScore
    const topDonors = await User.find({ role: 'donor' })
      .sort({ impactScore: -1 })
      .limit(5)
      .select('name email impactScore');

    // Category breakdown
    const categoryBreakdown = await FoodRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Status breakdown
    const statusBreakdown = await FoodRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Requests over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyTrend = await FoodRequest.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // NGO count
    const ngoCount = await User.countDocuments({ role: 'ngo' });
    const donorCount = await User.countDocuments({ role: 'donor' });

    res.json({
      totalRequests,
      delivered,
      pending,
      accepted,
      cancelled,
      mealsSaved,
      wasteDiverted,
      topDonors,
      categoryBreakdown,
      statusBreakdown,
      dailyTrend,
      ngoCount,
      donorCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stats/users — all users for admin
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/stats/users/:id/verify — verify NGO
router.patch('/users/:id/verify', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
