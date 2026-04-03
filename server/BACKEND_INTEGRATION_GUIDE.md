# Backend Integration Guide - Subscription System

This guide helps you connect the frontend subscription UI to a MongoDB backend.

---

## 📋 Step 1: Create Subscription Model

Create `server/models/Subscription.js`:

```javascript
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planId: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  deliveriesRemaining: {
    type: Number,
    required: true,
  },
  deliveriesUsed: {
    type: Number,
    default: 0,
  },
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'manual'],
  },
  amount: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
```

---

## 📋 Step 2: Create Subscription Routes

Create `server/routes/subscriptions.js`:

```javascript
const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Plan details
const plans = {
  basic: {
    name: 'Basic Plan',
    price: 499,
    deliveries: 5,
  },
  standard: {
    name: 'Standard Plan',
    price: 999,
    deliveries: 20,
  },
  premium: {
    name: 'Premium Plan',
    price: 1999,
    deliveries: 100,
  },
};

// Create new subscription
router.post('/create', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    if (!plans[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Cancel any active subscription
    await Subscription.updateMany(
      { userId, status: 'active' },
      { status: 'cancelled', updatedAt: new Date() }
    );

    // Create new subscription
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const subscription = new Subscription({
      userId,
      planId,
      status: 'active',
      expiryDate,
      deliveriesRemaining: plans[planId].deliveries,
      amount: plans[planId].price,
    });

    await subscription.save();

    res.json({
      success: true,
      subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's subscriptions
router.get('/user', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current active subscription
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.userId,
      status: 'active',
    });

    if (!subscription) {
      return res.json(null);
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    subscription.status = 'cancelled';
    subscription.updatedAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled',
      subscription,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade subscription
router.put('/:id/upgrade', auth, async (req, res) => {
  try {
    const { newPlanId } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const oldPrice = plans[subscription.planId].price;
    const newPrice = plans[newPlanId].price;
    const proratedCredit = oldPrice - newPrice;

    subscription.planId = newPlanId;
    subscription.deliveriesRemaining = plans[newPlanId].deliveries;
    subscription.amount = newPrice;
    subscription.updatedAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Plan upgraded',
      subscription,
      proratedCredit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use a delivery (decrement counter)
router.put('/:id/use-delivery', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'Subscription not active' });
    }

    if (subscription.deliveriesRemaining <= 0) {
      return res.status(400).json({ error: 'No deliveries remaining' });
    }

    subscription.deliveriesRemaining -= 1;
    subscription.deliveriesUsed += 1;
    await subscription.save();

    res.json({
      success: true,
      message: 'Delivery recorded',
      deliveriesRemaining: subscription.deliveriesRemaining,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 📋 Step 3: Register Routes in Server

Update `server/server.js`:

```javascript
// ... existing imports

const subscriptionRoutes = require('./routes/subscriptions');

// ... middleware setup

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);  // Add this

// ... rest of server code
```

---

## 📋 Step 4: Update Frontend SubscriptionContext

Modify `src/context/SubscriptionContext.jsx` to fetch from backend:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current subscription on mount
  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscriptions/current');
      setCurrentSubscription(response.data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/subscriptions/user');
      setSubscriptionHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
    }
  };

  const subscribeToPlan = async (planId) => {
    try {
      const response = await axios.post('/api/subscriptions/create', {
        planId,
      });
      setCurrentSubscription(response.data.subscription);
      await fetchHistory();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!currentSubscription) return;
      const response = await axios.put(
        `/api/subscriptions/${currentSubscription._id}/cancel`
      );
      setCurrentSubscription(null);
      await fetchHistory();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const upgradePlan = async (newPlanId) => {
    try {
      if (!currentSubscription) return;
      const response = await axios.put(
        `/api/subscriptions/${currentSubscription._id}/upgrade`,
        { newPlanId }
      );
      setCurrentSubscription(response.data.subscription);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const isSubscribed = () => {
    return currentSubscription?.status === 'active';
  };

  const getRemainingDays = () => {
    if (!isSubscribed()) return 0;
    const now = new Date();
    const expiry = new Date(currentSubscription.expiryDate);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getPlanDetails = (planId) => {
    const plans = {
      basic: { name: 'Basic', price: 499, deliveries: 5 },
      standard: { name: 'Standard', price: 999, deliveries: 20 },
      premium: { name: 'Premium', price: 1999, deliveries: 100 },
    };
    return plans[planId];
  };

  const value = {
    currentSubscription,
    subscriptionHistory,
    loading,
    error,
    subscribeToPlan,
    cancelSubscription,
    upgradePlan,
    isSubscribed,
    getRemainingDays,
    getPlanDetails,
    fetchHistory,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
```

---

## 📋 Step 5: Update Modal to Call API

Update `src/components/SubscriptionModal.jsx`:

```javascript
const handleConfirm = async () => {
  try {
    setIsProcessing(true);
    await subscribeToPlan(selectedPlan);
    onClose();
    // Show success toast
    toast.success('Subscription activated!');
  } catch (error) {
    toast.error('Failed to subscribe: ' + error.message);
  } finally {
    setIsProcessing(false);
  }
};
```

---

## 📋 Step 6: Integrate with Deliveries

Update `server/routes/deliveries.js` (or create if missing):

```javascript
// Before accepting a delivery, check subscription
router.post('/accept', auth, async (req, res) => {
  try {
    const { deliveryId } = req.body;

    // Check subscription
    const subscription = await Subscription.findOne({
      userId: req.userId,
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({ error: 'Active subscription required' });
    }

    if (subscription.deliveriesRemaining <= 0) {
      return res.status(403).json({
        error: 'No deliveries remaining in your plan',
      });
    }

    // Accept delivery
    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { acceptedBy: req.userId, status: 'accepted' },
      { new: true }
    );

    // Use one delivery
    await subscription.updateOne({
      $inc: { deliveriesRemaining: -1, deliveriesUsed: 1 },
    });

    res.json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## ✅ Testing the APIs

Use Postman or curl:

```bash
# Create subscription
POST http://localhost:5000/api/subscriptions/create
Headers: { Authorization: "Bearer YOUR_TOKEN" }
Body: { "planId": "standard" }

# Get current subscription
GET http://localhost:5000/api/subscriptions/current
Headers: { Authorization: "Bearer YOUR_TOKEN" }

# Get subscription history
GET http://localhost:5000/api/subscriptions/user
Headers: { Authorization: "Bearer YOUR_TOKEN" }

# Cancel subscription
PUT http://localhost:5000/api/subscriptions/{id}/cancel
Headers: { Authorization: "Bearer YOUR_TOKEN" }

# Upgrade plan
PUT http://localhost:5000/api/subscriptions/{id}/upgrade
Headers: { Authorization: "Bearer YOUR_TOKEN" }
Body: { "newPlanId": "premium" }
```

---

## 🔐 Authentication Check

Ensure your auth middleware includes the userId:

```javascript
// server/middleware/auth.js
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## ✅ Checklist

- [ ] Created Subscription model
- [ ] Created subscription routes
- [ ] Registered routes in server.js
- [ ] Updated SubscriptionContext to use API
- [ ] Updated SubscriptionModal to call API
- [ ] Integrated with delivery acceptance
- [ ] Tested all endpoints
- [ ] Verified authentication working
- [ ] Database migrations run

---

**You're now ready to use the full subscription system with a real backend!**