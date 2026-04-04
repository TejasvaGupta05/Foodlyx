import { useState, useEffect } from 'react';
import { Star, CheckCircle, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import api from '../api/axios';

export default function FeedbackDisplay({ feedback, onResolve }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.patch(`/feedback/${feedback._id}/resolve`);
      onResolve(feedback._id);
    } catch (error) {
      alert('Failed to resolve feedback');
    } finally {
      setResolving(false);
    }
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
        }`}
      />
    ));
  };

  const getComplaintLabel = (type) => {
    const labels = {
      none: 'No complaint',
      spoiled_food: 'Spoiled food',
      insufficient_quantity: 'Insufficient quantity',
      wrong_information: 'Wrong information provided',
      unsafe_food: 'Unsafe food',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <div className="glass p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">
              {feedback.receiverId?.name || 'Receiver'}
            </span>
            <div className="flex items-center gap-1">
              {renderStars(feedback.rating)}
            </div>
          </div>
          <p className="text-xs text-green-400/60">
            {feedback.foodRequestId?.foodName} - {feedback.foodRequestId?.foodType}
          </p>
          {feedback.facilityName && (
            <p className="text-xs text-green-300/70 mt-1">
              Facility: {feedback.facilityName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {feedback.resolutionStatus === 'resolved' ? (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Resolved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Text */}
      {feedback.feedbackText && (
        <div className="bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-300/80">{feedback.feedbackText}</p>
          </div>
        </div>
      )}

      {/* Complaint */}
      {feedback.complaintType !== 'none' && (
        <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">
                {getComplaintLabel(feedback.complaintType)}
              </p>
              {feedback.complaintDescription && (
                <p className="text-sm text-red-200/80 mt-1">
                  {feedback.complaintDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Button */}
      {feedback.resolutionStatus === 'pending' && feedback.complaintType !== 'none' && (
        <div className="pt-2 border-t border-green-900/30">
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resolving ? 'Resolving...' : (
              <>
                <CheckCircle className="w-4 h-4" />
                Mark as Resolved
              </>
            )}
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-green-400/50 text-right">
        {new Date(feedback.createdAt).toLocaleDateString()} at{' '}
        {new Date(feedback.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
}