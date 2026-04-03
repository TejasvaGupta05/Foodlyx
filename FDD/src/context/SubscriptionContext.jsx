import { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [currentSubscription, setCurrentSubscription] = useState(
    JSON.parse(localStorage.getItem('subscription')) || {
      plan: null,
      status: 'inactive',
      expiryDate: null,
      startDate: null,
      deliveriesRemaining: 0,
      subscriptionId: null,
    }
  );

  const [subscriptionHistory, setSubscriptionHistory] = useState(
    JSON.parse(localStorage.getItem('subscriptionHistory')) || []
  );

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 499,
      duration: 'month',
      deliveriesPerMonth: 5,
      features: [
        'Up to 5 food deliveries per month',
        'Basic support via email',
        'View delivery history',
        'Standard notifications',
      ],
      badge: null,
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      price: 999,
      duration: 'month',
      deliveriesPerMonth: 20,
      features: [
        'Up to 20 food deliveries per month',
        'Priority support (24/7)',
        'Detailed analytics dashboard',
        'Real-time delivery tracking',
        'Custom delivery schedules',
      ],
      badge: 'Most Popular',
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 1999,
      duration: 'month',
      deliveriesPerMonth: 100,
      features: [
        'Unlimited food deliveries',
        'Dedicated account manager',
        'Advanced analytics & reports',
        'Priority delivery slots',
        'Custom integrations',
        'API access',
      ],
      badge: 'Recommended',
    },
  ];

  const subscribeToPlan = (planId) => {
    const plan = plans.find(p => p.id === planId);
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subscriptionId = `SUB-${Date.now()}`;

    const newSubscription = {
      plan: planId,
      status: 'active',
      expiryDate: expiryDate.toISOString(),
      startDate: startDate.toISOString(),
      deliveriesRemaining: plan.deliveriesPerMonth,
      subscriptionId,
    };

    // Add to history
    const historyEntry = {
      ...newSubscription,
      planName: plan.name,
      price: plan.price,
    };

    setCurrentSubscription(newSubscription);
    setSubscriptionHistory([historyEntry, ...subscriptionHistory]);

    // Persist to localStorage
    localStorage.setItem('subscription', JSON.stringify(newSubscription));
    localStorage.setItem('subscriptionHistory', JSON.stringify([historyEntry, ...subscriptionHistory]));

    return true;
  };

  const cancelSubscription = () => {
    const cancelledSubscription = {
      ...currentSubscription,
      status: 'cancelled',
      cancelledDate: new Date().toISOString(),
    };

    setCurrentSubscription({
      plan: null,
      status: 'inactive',
      expiryDate: null,
      startDate: null,
      deliveriesRemaining: 0,
      subscriptionId: null,
    });

    // Update history
    const updatedHistory = subscriptionHistory.map(item =>
      item.subscriptionId === currentSubscription.subscriptionId
        ? cancelledSubscription
        : item
    );
    setSubscriptionHistory(updatedHistory);

    localStorage.setItem('subscription', JSON.stringify({
      plan: null,
      status: 'inactive',
      expiryDate: null,
      startDate: null,
      deliveriesRemaining: 0,
      subscriptionId: null,
    }));
    localStorage.setItem('subscriptionHistory', JSON.stringify(updatedHistory));
  };

  const upgradePlan = (newPlanId) => {
    subscribeToPlan(newPlanId);
  };

  const getRemainingDays = () => {
    if (!currentSubscription.expiryDate) return 0;
    const expiry = new Date(currentSubscription.expiryDate);
    const today = new Date();
    const diff = expiry - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isSubscribed = () => currentSubscription.status === 'active';

  const getPlanDetails = () => {
    if (!currentSubscription.plan) return null;
    return plans.find(p => p.id === currentSubscription.plan);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentSubscription,
        subscriptionHistory,
        plans,
        subscribeToPlan,
        cancelSubscription,
        upgradePlan,
        getRemainingDays,
        isSubscribed,
        getPlanDetails,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};