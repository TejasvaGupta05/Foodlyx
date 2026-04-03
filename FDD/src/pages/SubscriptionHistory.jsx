import { motion } from 'framer-motion';
import { Calendar, Check, X, AlertCircle, Download } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionHistory = () => {
  const { subscriptionHistory } = useSubscription();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'expired':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Check className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="hero-bg min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
            Subscription <span className="gradient-text">History</span>
          </h1>
          <p className="text-green-300/60">View all your subscriptions and billing history</p>
        </motion.div>
      </section>

      {/* History Table */}
      <section className="max-w-6xl mx-auto px-4">
        {subscriptionHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-green-500/20 rounded-2xl p-12 text-center"
          >
            <Calendar className="w-12 h-12 text-green-400/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Subscription History</h2>
            <p className="text-green-300/60 mb-6">
              You haven't subscribed to any plan yet. Choose a plan to get started!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-green-500/20 rounded-2xl overflow-hidden"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-500/20 bg-black/20">
                    <th className="text-left py-4 px-6 font-semibold text-green-400">Plan</th>
                    <th className="text-left py-4 px-6 font-semibold text-green-400">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-green-400">Start Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-green-400">End Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-green-400">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-green-400">Deliveries</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionHistory.map((sub, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border-b border-green-500/10 hover:bg-green-500/5 transition"
                    >
                      <td className="py-4 px-6 font-semibold text-white">{sub.planName || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                            sub.status
                          )}`}
                        >
                          {getStatusIcon(sub.status)}
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-green-100">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="py-4 px-6 text-green-100">
                        {sub.status === 'cancelled' ? formatDate(sub.cancelledDate) : formatDate(sub.expiryDate)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-green-400">
                        ₹{sub.price}
                      </td>
                      <td className="py-4 px-6 text-white">
                        {sub.deliveriesRemaining === 100 ? 'Unlimited' : sub.deliveriesRemaining}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {subscriptionHistory.map((sub, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-black/20 border border-green-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{sub.planName || 'Unknown Plan'}</h3>
                      <p className="text-sm text-green-300/60">
                        {formatDate(sub.startDate)} - {sub.status === 'cancelled' ? formatDate(sub.cancelledDate) : formatDate(sub.expiryDate)}
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        sub.status
                      )}`}
                    >
                      {getStatusIcon(sub.status)}
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-300/60">Amount: <span className="text-green-400 font-semibold">₹{sub.price}</span></span>
                    <span className="text-green-300/60">Deliveries: <span className="text-green-400 font-semibold">{sub.deliveriesRemaining === 100 ? 'Unlimited' : sub.deliveriesRemaining}</span></span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* Invoice Download Section */}
      {subscriptionHistory.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="glass border border-green-500/20 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Billing & Invoices</h2>
            <p className="text-green-300/60 mb-6">
              Download your invoices for accounting and tax purposes.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {subscriptionHistory.slice(0, 3).map((sub, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between p-4 bg-black/20 border border-green-500/20 rounded-lg hover:border-green-500/40 transition"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">{sub.planName}</p>
                    <p className="text-sm text-green-300/60">{formatDate(sub.startDate)}</p>
                  </div>
                  <Download className="w-4 h-4 text-green-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default SubscriptionHistory;