import { MapPin, Clock, Package, Zap, User } from 'lucide-react';
import StatusBadge from './StatusBadge';

const urgencyColor = {
  high: 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/10 dark:border-red-500/40 dark:bg-red-500/5',
  medium: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10 dark:border-amber-500/40 dark:bg-amber-500/5',
  low: 'text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/10 dark:border-green-500/40 dark:bg-green-500/5',
};

const usabilityLabel = {
  human_edible: '🧑 Human Edible',
  animal_edible: '🐾 Animal Edible',
  fertilizer_compost: '🌿 Compost',
};

export default function FoodCard({ request, onAccept, onDeliver, userRole }) {
  // Support both Firestore (id) and legacy MongoDB (_id) shaped data
  const id = request.id || request._id;
  const donorName = request.donorBusinessName || request.donorName
    || request.donorId?.name || 'Unknown Donor';

  const createdAt = request.createdAt?.toDate
    ? request.createdAt.toDate()
    : request.createdAt
      ? new Date(request.createdAt)
      : null;

  const isAcceptedByMe = request.acceptedByUid != null;

  return (
    <div className="p-5 flex flex-col gap-3 bg-white dark:bg-[#111916]/70 dark:backdrop-blur-md border border-[#E5E7EB] dark:border-green-900/30 rounded-[16px] shadow-sm hover:shadow-lg dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(22,163,74,0.15)] hover:border-[#16a34a] dark:hover:border-green-500/50 transition-all duration-300 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#111827] dark:text-white text-base truncate">
            {request.foodName || request.foodType || 'Food Request'}
          </h3>
          <p className="text-xs text-[#4b5563] dark:text-green-400/60 mt-0.5 flex items-center gap-1 font-medium">
            <User className="w-3 h-3 text-[#16a34a] dark:text-inherit" />
            {donorName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StatusBadge type="status" value={request.status} />
        </div>
      </div>

      {/* Food Image */}
      {request.foodImage && (
        <img
          src={request.foodImage}
          alt={request.foodName}
          className="w-full h-32 object-cover rounded-lg border border-[#e5e7eb] dark:border-green-900/30"
        />
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-[#4b5563] dark:text-green-300/70 font-medium">
          <Package className="w-3.5 h-3.5 flex-shrink-0 text-[#2563eb] dark:text-inherit" />
          <span>{request.quantity} {request.quantityUnit || 'kg'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#4b5563] dark:text-green-300/70 font-medium">
          <Zap className="w-3.5 h-3.5 flex-shrink-0 text-[#16a34a] dark:text-inherit" />
          <span className="capitalize">{usabilityLabel[request.foodUsabilityCategory] || request.foodCategory || '—'}</span>
        </div>
        {request.location?.address && (
          <div className="flex items-center gap-1.5 text-[#4b5563] dark:text-green-300/70 col-span-2 font-medium">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#dc2626] dark:text-inherit" />
            <span className="truncate text-xs">{request.location.address}</span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-1.5 text-[#6b7280] dark:text-green-400/40 col-span-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs">Posted {createdAt.toLocaleString()}</span>
          </div>
        )}
        {request.urgency && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full w-fit border ${urgencyColor[request.urgency] || ''}`}>
            <Zap className="w-3 h-3" />
            {request.urgency} urgency
          </div>
        )}
        {request.notes && (
          <p className="col-span-2 text-xs text-[#6b7280] dark:text-green-400/50 italic border-t border-[#e5e7eb] dark:border-green-900/20 pt-2 mt-1">
            📝 {request.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {userRole && (
        <div className="flex gap-2 mt-1 border-t border-[#e5e7eb] dark:border-green-900/30 pt-3">
          {request.status === 'pending' &&
            ['ngo', 'animal_shelter', 'compost_unit'].includes(userRole) &&
            onAccept && (
              <button
                onClick={() => onAccept(id)}
                className="flex-1 text-sm py-2 bg-[#16a34a] dark:bg-green-600 hover:bg-[#15803d] dark:hover:bg-green-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Accept Request
              </button>
            )}
          {request.status === 'accepted' && onDeliver && (
            <button
              onClick={() => onDeliver(id)}
              className="flex-1 text-sm py-2 bg-[#2563eb] dark:bg-blue-600 hover:bg-[#1d4ed8] dark:hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Mark Delivered ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}
