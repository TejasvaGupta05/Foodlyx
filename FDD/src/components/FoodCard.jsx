import { MapPin, Clock, Package, Zap, User } from 'lucide-react';
import StatusBadge from './StatusBadge';

const urgencyColor = {
  high: 'text-red-400 border-red-500/40 bg-red-500/5',
  medium: 'text-amber-400 border-amber-500/40 bg-amber-500/5',
  low: 'text-green-400 border-green-500/40 bg-green-500/5',
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
    <div className="glass p-5 flex flex-col gap-3 hover:border-green-500/30 transition-all fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base truncate">
            {request.foodName || request.foodType || 'Food Request'}
          </h3>
          <p className="text-xs text-green-400/60 mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3" />
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
          className="w-full h-32 object-cover rounded-lg border border-green-900/30"
        />
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-green-300/70">
          <Package className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{request.quantity} {request.quantityUnit || 'kg'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-300/70">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="capitalize">{usabilityLabel[request.foodUsabilityCategory] || request.foodCategory || '—'}</span>
        </div>
        {request.location?.address && (
          <div className="flex items-center gap-1.5 text-green-300/70 col-span-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate text-xs">{request.location.address}</span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-1.5 text-green-400/40 col-span-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs">Posted {createdAt.toLocaleString()}</span>
          </div>
        )}
        {request.urgency && (
          <div className={`flex items-center gap-1.5 text-xs border px-2 py-0.5 rounded-full w-fit ${urgencyColor[request.urgency] || ''}`}>
            <Zap className="w-3 h-3" />
            {request.urgency} urgency
          </div>
        )}
        {request.notes && (
          <p className="col-span-2 text-xs text-green-400/50 italic border-t border-green-900/20 pt-2 mt-1">
            📝 {request.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {userRole && (
        <div className="flex gap-2 mt-1 border-t border-green-900/30 pt-3">
          {/* Accept — shown when pending and user is a receiver role */}
          {request.status === 'pending' &&
            ['ngo', 'animal_shelter', 'compost_unit'].includes(userRole) &&
            onAccept && (
              <button
                onClick={() => onAccept(id)}
                className="flex-1 text-sm py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all"
              >
                Accept Request
              </button>
            )}
          {/* Deliver — shown when accepted */}
          {request.status === 'accepted' && onDeliver && (
            <button
              onClick={() => onDeliver(id)}
              className="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
            >
              Mark Delivered ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}
