import { motion } from 'framer-motion';

const PlanBadge = ({ label }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      className="absolute -top-3 -right-3"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
        {label}
      </div>
    </motion.div>
  );
};

export default PlanBadge;