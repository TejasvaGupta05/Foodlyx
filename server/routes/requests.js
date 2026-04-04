const express = require('express');
const FoodRequest = require('../models/FoodRequest');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { classifyFood } = require('../utils/classifier');
const router = express.Router();

// Haversine distance helper (km)
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/requests — create food request (donor only)
router.post('/', protect, async (req, res) => {
  try {
    const {
      donorBusinessName,
      donorBusinessType,
      donorContactPhone,
      pickupAddress,
      foodType,
      foodName,
      quantity,
      quantityUnit,
      category: foodCategory,
      shelfLifeHours,
      urgency,
      preparationDate,
      preparationTime,
      storageCondition,
      foodUsabilityCategory,
      foodImage,
      safeConsumptionUntil,
      location,
      notes,
    } = req.body;

    // Required validation
    if (!donorBusinessName || !donorContactPhone || !pickupAddress || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: 'Please provide donor details, pickup address and exact location' });
    }
    if (!foodType || !foodName || !quantity || !quantityUnit || !foodCategory || !preparationDate || !preparationTime || !storageCondition || !foodUsabilityCategory) {
      return res.status(400).json({ message: 'Please provide complete food details and quality assessment' });
    }

    const foodCategoryValue = foodCategory;
    const safeUntilDate = safeConsumptionUntil
      ? new Date(safeConsumptionUntil)
      : new Date(Date.now() + (shelfLifeHours || 0) * 3600000);

    const prepDateTime = new Date(`${preparationDate}T${preparationTime}`);
    const elapsedMs = Date.now() - prepDateTime.getTime();
    const elapsedHours = elapsedMs / 3600000;

    let computedQuality = 'safe_but_urgent';
    let recommendation = 'human_donation';

    if (foodUsabilityCategory === 'fertilizer_compost') {
      computedQuality = 'risky_not_recommended';
      recommendation = 'compost_fertilizer';
    } else if (foodUsabilityCategory === 'animal_edible') {
      if (elapsedHours < 8) {
        computedQuality = 'safe_but_urgent';
        recommendation = 'animal_feeding';
      } else {
        computedQuality = 'risky_not_recommended';
        recommendation = 'compost_fertilizer';
      }
    } else {
      if (elapsedHours <= 4 && foodCategoryValue === 'fresh_food') {
        computedQuality = 'fresh';
        recommendation = 'human_donation';
      } else if (elapsedHours <= 8) {
        computedQuality = 'safe_but_urgent';
        recommendation = 'human_donation';
      } else {
        computedQuality = 'risky_not_recommended';
        recommendation = 'animal_feeding';
      }
    }

    const request = await FoodRequest.create({
      donorId: req.user._id,
      donorDetails: {
        businessName: donorBusinessName,
        businessType: donorBusinessType || 'other',
        contactPhone: donorContactPhone,
        contactEmail: req.user.email || '',
        pickupAddress,
      },
      foodType,
      foodName,
      quantity,
      quantityUnit,
      foodCategory: foodCategoryValue,
      shelfLifeHours,
      urgency: urgency || 'medium',
      preparationDate: new Date(preparationDate),
      preparationTime,
      storageCondition,
      foodUsabilityCategory,
      foodImage: foodImage || '',
      category: foodCategoryValue,
      foodQualityStatus: computedQuality,
      qualityRecommendation: recommendation,
      safeConsumptionUntil: safeUntilDate,
      location,
      notes,
    });

    // Emit socket event
    req.app.get('io').emit('new_request', request);

    // Update donor impact score
    await User.findByIdAndUpdate(req.user._id, { $inc: { impactScore: quantity } });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests — list with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, urgency, status, lat, lng, radius } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;
    else filter.status = 'pending'; // default to pending

    let requests = await FoodRequest.find(filter)
      .populate('donorId', 'name email location')
      .populate('acceptedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Optional distance filter
    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxKm = parseFloat(radius);
      requests = requests.filter((r) => {
        const dist = haversine(userLat, userLng, r.location.lat, r.location.lng);
        return dist <= maxKm;
      });
    }

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/all — all requests (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { donor, ngo, fromDate, toDate, location, search, status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    let requests = await FoodRequest.find(filter)
      .populate('donorId', 'name email')
      .populate('acceptedBy', 'name email role')
      .sort({ createdAt: -1 });

    const searchTerm = search?.toString().trim().toLowerCase();
    const donorTerm = donor?.toString().trim().toLowerCase();
    const ngoTerm = ngo?.toString().trim().toLowerCase();
    const locationTerm = location?.toString().trim().toLowerCase();

    if (donorTerm || ngoTerm || locationTerm || searchTerm) {
      requests = requests.filter((request) => {
        const donorName = (request.donorId?.name || request.donorDetails?.businessName || '').toString().toLowerCase();
        const ngoName = (request.acceptedBy?.name || '').toString().toLowerCase();
        const locationText = (request.donorDetails?.pickupAddress || request.location?.address || '').toString().toLowerCase();
        const foodText = (request.foodName || request.foodType || '').toString().toLowerCase();
        const statusText = (request.status || '').toString().toLowerCase();

        const matchesDonor = donorTerm ? donorName.includes(donorTerm) : true;
        const matchesNgo = ngoTerm ? ngoName.includes(ngoTerm) : true;
        const matchesLocation = locationTerm ? locationText.includes(locationTerm) : true;
        const matchesSearch = searchTerm
          ? [donorName, ngoName, locationText, foodText, statusText].some((value) => value.includes(searchTerm))
          : true;

        return matchesDonor && matchesNgo && matchesLocation && matchesSearch;
      });
    }

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/my — donor's own requests
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await FoodRequest.find({ donorId: req.user._id })
      .populate('acceptedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests/:id/accept
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending')
      return res.status(400).json({ message: 'Request is no longer available' });

    request.status = 'accepted';
    request.acceptedBy = req.user._id;
    await request.save();

    req.app.get('io').emit('request_updated', request);
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/requests/:id/deliver
router.patch('/:id/deliver', protect, async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'delivered';
    request.deliveredAt = new Date();
    await request.save();
    req.app.get('io').emit('request_updated', request);
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/requests/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'cancelled';
    await request.save();
    req.app.get('io').emit('request_updated', request);
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
