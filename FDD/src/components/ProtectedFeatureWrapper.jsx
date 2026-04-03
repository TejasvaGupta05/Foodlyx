import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { Link } from 'react-router-dom';

const ProtectedFeatureWrapper = ({ children, featureName = 'Feature' }) => {
  const { isSubscribed } = useSubscription();

  if (isSubscribed()) {
    return children;
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="bg-black/60 border border-green-500/30 rounded-2xl p-8 max-w-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <Lock className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">Subscription Required</h3>
            <p className="text-sm text-green-200 mb-6">
              Subscribe to a plan to unlock <strong>{featureName}</strong> and start receiving food deliveries.
            </p>
            <Link
              to="/subscription-plans"
              className="inline-block px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition"
            >
              View Plans & Subscribe
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Blurred Content */}
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default ProtectedFeatureWrapper;