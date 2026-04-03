import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionModal from '../components/SubscriptionModal';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionPlans = () => {
  const { plans, currentSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubscribe = (planId) => {
    setSelectedPlan(planId);
    setIsModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12 },
    },
  };

  return (
    <div className="hero-bg min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/20 text-green-400 text-xs font-medium mb-8"
        >
          <Zap className="w-3 h-3" /> Flexible Plans for Your Needs
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl font-black leading-tight mb-6"
        >
          <span className="gradient-text">Choose Your Plan,</span>
          <br />
          <span className="text-white">Start Receiving Food</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-green-300/60 max-w-2xl mx-auto mb-4"
        >
          Select the perfect plan for your organization and unlock unlimited access to food donations from our network of donors.
        </motion.p>
      </section>

      {/* Plans Grid */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-3 gap-6"
        >
          {plans.map((plan, idx) => (
            <motion.div key={plan.id} variants={itemVariants}>
              <SubscriptionCard
                plan={plan}
                isPopular={plan.badge === 'Most Popular'}
                onSubscribe={handleSubscribe}
                isCurrentPlan={currentSubscription.plan === plan.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="glass border border-green-500/20 rounded-2xl p-8 overflow-x-auto"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Detailed Comparison</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-500/20">
                <th className="text-left py-3 px-4 font-semibold text-green-400">Feature</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center py-3 px-4 font-semibold text-white">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-green-500/10 hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">Monthly Deliveries</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white font-semibold">
                    {plan.deliveriesPerMonth === 100 ? '🚀 Unlimited' : plan.deliveriesPerMonth}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-green-500/10 hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">Support</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white">
                    {plan.id === 'basic' ? 'Email' : '24/7'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-green-500/10 hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">Analytics</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white">
                    {plan.id === 'basic' ? '✗' : '✓'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-green-500/10 hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">Live Tracking</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white">
                    {plan.id === 'basic' ? '✗' : '✓'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-green-500/10 hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">Custom Schedules</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white">
                    {plan.id !== 'basic' ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-green-500/5 transition">
                <td className="py-3 px-4 text-green-300">API Access</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center py-3 px-4 text-white">
                    {plan.id === 'premium' ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 mt-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-3xl font-bold text-white mb-8 text-center"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="space-y-4">
          {[
            {
              q: 'Can I change my plan anytime?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'Is there a trial period?',
              a: 'Contact our support team for a 7-day trial of any plan.',
            },
            {
              q: 'What happens if I exceed my delivery limit?',
              a: 'You can upgrade to a higher plan or purchase additional credits.',
            },
            {
              q: 'Do unused deliveries carry over?',
              a: 'No, but with subscription renewals, you get a fresh quota each month.',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass border border-green-500/20 rounded-lg p-4"
            >
              <h3 className="font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-green-200">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planId={selectedPlan}
      />
    </div>
  );
};

export default SubscriptionPlans;