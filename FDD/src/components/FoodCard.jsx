import { MapPin, Clock, Package, Zap } from 'lucide-react';
import StatusBadge from './StatusBadge';

const urgencyColor = {
  high: 'text-red-400 border-red-500/40',
  medium: 'text-amber-400 border-amber-500/40',
  low: 'text-green-400 border-green-500/40',
};

export default function FoodCard({ request, onAccept, onDeliver, userRole }) {
  const donor = request.donorId;
  const accepted = request.acceptedBy;

  return (
    <div className="glass p-5 flex flex-col gap-3 hover:border-green-500/30 transition-all fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white text-base">{request.foodType}</h3>
          <p className="text-xs text-green-400/60 mt-0.5">{donor?.name || 'Unknown Donor'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge type="status" value={request.status} />
          <StatusBadge type="category" value={request.category} />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-green-300/70">
          <Package className="w-3.5 h-3.5" />
          <span>{request.quantity} kg/servings</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-300/70">
          <Clock className="w-3.5 h-3.5" />
          <span>{request.shelfLifeHours}h shelf life</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-300/70 col-span-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{request.location?.address || `${request.location?.lat?.toFixed(3)}, ${request.location?.lng?.toFixed(3)}`}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs border px-2 py-0.5 rounded-full w-fit ${urgencyColor[request.urgency]}`}>
          <Zap className="w-3 h-3" />
          {request.urgency} urgency
        </div>
      </div>

      {/* Actions */}
      {userRole && (
        <div className="flex gap-2 mt-1 border-t border-green-900/30 pt-3">
          {request.status === 'pending' && (userRole === 'ngo' || userRole === 'animal_shelter' || userRole === 'compost_unit') && onAccept && (
            <button
              onClick={() => onAccept(request._id)}
              className="flex-1 text-sm py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all"
            >
              Accept Request
            </button>
          )}
          {request.status === 'accepted' && accepted?.toString() === 'me' && onDeliver && (
            <button
              onClick={() => onDeliver(request._id)}
              className="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
            >
              Mark Delivered
            </button>
          )}
        </div>
      )}
    </div>
  );
}
