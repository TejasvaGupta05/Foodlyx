import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionModal = ({ isOpen, onClose, planId }) => {
  const { plans, subscribeToPlan } = useSubscription();
  const plan = plans.find(p => p.id === planId);

  if (!plan) return null;

  const handleConfirm = () => {
    subscribeToPlan(planId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="glass border border-green-500/20 rounded-2xl p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Confirm Subscription</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1 hover:bg-red-500/20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Plan Details */}
            <div className="space-y-4 mb-8">
              <div className="bg-black/20 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-400/60">Plan Selected</p>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-green-400">₹{plan.price}</span>
                  <span className="text-sm text-green-400/60">/month</span>
                </div>
              </div>

              {/* Billing Info */}
              <div className="space-y-2 text-sm text-green-100">
                <div className="flex justify-between">
                  <span>Plan Duration:</span>
                  <span className="font-semibold">1 Month</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Deliveries:</span>
                  <span className="font-semibold">
                    {plan.deliveriesPerMonth === 100 ? 'Unlimited' : plan.deliveriesPerMonth}
                  </span>
                </div>
                <div className="border-t border-green-500/20 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-green-400">₹{plan.price}</span>
                </div>
              </div>

              {/* Features Preview */}
              <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                <p className="text-xs text-green-400/60 mb-2">Features Included:</p>
                <div className="space-y-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-green-100">
                      <Check className="w-3 h-3 text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <p className="text-xs text-green-400/60 ml-5 italic">
                      +{plan.features.length - 3} more features
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="text-xs text-green-400/60 mb-6 p-3 bg-black/20 rounded border border-green-500/10">
              By confirming, you agree to our Terms of Service and will be charged ₹{plan.price} monthly. 
              You can cancel anytime.
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-green-500/30 rounded-lg font-semibold text-green-300 hover:border-green-500/50 transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-white transition shadow-lg shadow-green-500/30"
              >
                Confirm & Subscribe
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;