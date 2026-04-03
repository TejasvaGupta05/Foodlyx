import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionBanner = () => {
  const { isSubscribed, currentSubscription, getRemainingDays, getPlanDetails } = useSubscription();

  if (!isSubscribed()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-100">Subscription Required</h3>
            <p className="text-sm text-orange-200">Please subscribe to start receiving food deliveries</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const planDetails = getPlanDetails();
  const remainingDays = getRemainingDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass bg-green-500/10 border-l-4 border-green-500 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-100">{planDetails?.name} Active</h3>
            <p className="text-sm text-green-200">
              {planDetails?.deliveriesPerMonth === 100 ? 'Unlimited' : planDetails?.deliveriesPerMonth} deliveries per month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-green-300">Expires in</p>
            <p className="font-semibold text-green-100 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {remainingDays} days
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionBanner;