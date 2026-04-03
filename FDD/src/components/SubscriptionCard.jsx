import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import PlanBadge from './PlanBadge';

const SubscriptionCard = ({ plan, isPopular, onSubscribe, isCurrentPlan }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className={`relative glass p-6 rounded-xl border transition-all duration-300 ${
        isPopular
          ? 'border-green-500/50 ring-2 ring-green-500/20 shadow-lg shadow-green-500/20'
          : 'border-green-500/20 hover:border-green-500/40'
      }`}
    >
      {/* Badge */}
      {plan.badge && <PlanBadge label={plan.badge} />}

      {/* Plan Name & Price */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-green-400">₹{plan.price}</span>
          <span className="text-sm text-green-400/60">/{plan.duration}</span>
        </div>
      </div>

      {/* Deliveries Info */}
      <div className="bg-black/20 rounded-lg p-3 mb-6 border border-green-500/10">
        <p className="text-sm text-white font-semibold">
          {plan.deliveriesPerMonth === 100 ? '🚀 Unlimited' : `📦 ${plan.deliveriesPerMonth}`} deliveries
        </p>
        {plan.deliveriesPerMonth !== 100 && (
          <p className="text-xs text-green-400/60">per month</p>
        )}
      </div>

      {/* Features List */}
      <div className="space-y-3 mb-8">
        {plan.features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3"
          >
            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-100">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* Subscribe Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSubscribe(plan.id)}
        disabled={isCurrentPlan}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
          isCurrentPlan
            ? 'bg-green-500/20 text-green-400 cursor-not-allowed opacity-75 border border-green-500/30'
            : isPopular
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30'
              : 'bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/30'
        }`}
      >
        {isCurrentPlan ? '✓ Current Plan' : 'Subscribe Now'}
      </motion.button>

      {/* Popular Badge Star */}
      {isPopular && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute top-4 right-4"
        >
          <Star className="w-5 h-5 text-green-400 fill-green-400" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default SubscriptionCard;