const categoryConfig = {
  fresh_food: { label: 'Fresh food', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  packaged_food: { label: 'Packaged food', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  perishable_food: { label: 'Perishable food', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  dry_food: { label: 'Dry food', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  other: { label: 'Other', color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30' },
};

const statusConfig = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  accepted: { label: 'Accepted', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  delivered: { label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

export function StatusBadge({ type, value }) {
  const config = type === 'category' ? categoryConfig[value] : statusConfig[value];
  if (!config) return null;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
