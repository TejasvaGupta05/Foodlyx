const express = require('express');
const Feedback = require('../models/Feedback');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit feedback for a delivered request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { foodRequestId, deliveryId, facilityName, rating, feedbackText, complaintType, complaintDescription } = req.body;
    const userId = req.user.id;

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ foodRequestId, receiverId: userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this request' });
    }

    const FoodRequest = require('../models/FoodRequest');
    const request = await FoodRequest.findById(foodRequestId);
    if (!request) {
      return res.status(404).json({ message: 'Food request not found' });
    }

    if (request.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only submit feedback for delivered requests' });
    }

    const feedback = new Feedback({
      foodRequestId,
      donationId: foodRequestId,
      deliveryId,
      receiverId: userId,
      donorId: request.donorId,
      facilityName: facilityName || request.donorDetails?.businessName || '',
      rating,
      feedbackText: feedbackText || '',
      complaintType: complaintType || 'none',
      complaintDescription: complaintType === 'other' ? complaintDescription || '' : '',
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all feedback received by a donor
router.get('/donor/:donorId', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ donorId: req.params.donorId })
      .populate('receiverId', 'name role')
      .populate('foodRequestId', 'foodName foodType donorDetails')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all feedback submitted by a receiver
router.get('/receiver/:receiverId', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ receiverId: req.params.receiverId })
      .populate('donorId', 'name')
      .populate('foodRequestId', 'foodName foodType donorDetails')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feedback for a specific request
router.get('/:foodRequestId', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ foodRequestId: req.params.foodRequestId });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark complaint as resolved
router.patch('/:feedbackId/resolve', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Only donor can resolve
    if (feedback.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the donor can resolve feedback' });
    }

    feedback.resolutionStatus = 'resolved';
    feedback.resolvedAt = new Date();
    feedback.resolvedBy = req.user.id;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
