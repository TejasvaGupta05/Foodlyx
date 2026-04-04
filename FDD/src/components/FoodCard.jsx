import { MapPin, Clock, Package, Zap, User, CheckCircle, Truck } from 'lucide-react';

const URGENCY_STYLES = {
  high:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', label: '🔴 High'   },
  medium: { bg: '#FFFBEB', border: '#FCD34D', text: '#D97706', label: '🟡 Medium' },
  low:    { bg: '#F0FDF4', border: '#86EFAC', text: '#16A34A', label: '🟢 Low'    },
};

const CATEGORY_LABELS = {
  human_edible:       { emoji: '🧑', label: 'Human Edible',  color: '#22C55E' },
  animal_edible:      { emoji: '🐾', label: 'Animal Edible', color: '#F59E0B' },
  fertilizer_compost: { emoji: '🌿', label: 'Compost',       color: '#16A34A' },
};

const STATUS_STYLES = {
  pending:   { bg: '#FEF3C7', text: '#D97706', label: '⏳ Pending'   },
  accepted:  { bg: '#DBEAFE', text: '#2563EB', label: '✅ Accepted'  },
  delivered: { bg: '#DCFCE7', text: '#16A34A', label: '🎉 Delivered' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: '❌ Cancelled' },
};

export default function FoodCard({ request, onAccept, onDeliver, userRole }) {
  const id = request.id || request._id;
  const donorName = request.donorBusinessName || request.donorName || request.donorId?.name || 'Unknown Donor';

  const createdAt = request.createdAt?.toDate
    ? request.createdAt.toDate()
    : request.createdAt
      ? new Date(request.createdAt)
      : null;

  const statusStyle  = STATUS_STYLES[request.status]  || STATUS_STYLES.pending;
  const urgencyStyle = URGENCY_STYLES[request.urgency];
  const catInfo      = CATEGORY_LABELS[request.foodUsabilityCategory || request.foodCategory];

  return (
    <div
      className="group flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #F1F5F9',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: statusStyle.bg }}
      >
        <span className="text-xs font-bold" style={{ color: statusStyle.text }}>{statusStyle.label}</span>
        {urgencyStyle && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: urgencyStyle.bg, color: urgencyStyle.text, border: `1px solid ${urgencyStyle.border}` }}
          >
            {urgencyStyle.label} urgency
          </span>
        )}
      </div>

      {/* Food image */}
      {request.foodImage && (
        <div className="h-40 overflow-hidden">
          <img
            src={request.foodImage}
            alt={request.foodName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title + category */}
        <div>
          <h3 className="font-bold text-base leading-tight" style={{ color: '#1C2B22' }}>
            {request.foodName || request.foodType || 'Food Donation'}
          </h3>
          {catInfo && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold">
              {catInfo.emoji} <span style={{ color: catInfo.color }}>{catInfo.label}</span>
            </span>
          )}
        </div>

        {/* Donor */}
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#64748B' }}>
          <User className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
          <span className="font-medium truncate">{donorName}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Quantity */}
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#64748B' }}>
            <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3B82F6' }} />
            <span>{request.quantity} {request.quantityUnit || 'kg'}</span>
          </div>

          {/* Time */}
          {createdAt && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{createdAt.toLocaleDateString()}</span>
            </div>
          )}

          {/* Location */}
          {request.location?.address && (
            <div className="col-span-2 flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#EF4444' }} />
              <span className="truncate">{request.location.address}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {request.notes && (
          <p className="text-xs italic p-3 rounded-xl" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #F1F5F9' }}>
            📝 {request.notes}
          </p>
        )}

        {/* Action buttons */}
        {userRole && (
          <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
            {request.status === 'pending' &&
              ['ngo', 'animal_shelter', 'compost_unit'].includes(userRole) &&
              onAccept && (
                <button
                  onClick={() => onAccept(id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
              )}
            {request.status === 'accepted' && onDeliver && (
              <button
                onClick={() => onDeliver(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
              >
                <Truck className="w-4 h-4" /> Mark Delivered
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
