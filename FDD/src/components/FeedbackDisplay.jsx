import { useState } from 'react';
import { Star, CheckCircle, AlertCircle, MessageSquare, Clock, User } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const COMPLAINT_LABELS = {
  none: null,
  spoiled_food: 'Spoiled / bad food',
  insufficient_quantity: 'Insufficient quantity',
  wrong_information: 'Wrong information provided',
  unsafe_food: 'Unsafe / hazardous food',
  other: 'Other issue',
};

export default function FeedbackDisplay({ feedback, onResolve }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await updateDoc(doc(db, 'feedbacks', feedback.id), { resolutionStatus: 'resolved' });
      onResolve(feedback.id);
    } catch (err) {
      console.error('Failed to resolve feedback:', err.message);
      alert('Failed to resolve. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  const renderStars = (n) =>
    [1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
    ));

  const createdDate = feedback.createdAt?.toDate
    ? feedback.createdAt.toDate()
    : feedback.createdAt instanceof Date
    ? feedback.createdAt
    : new Date(feedback.createdAt);

  const complaintLabel = COMPLAINT_LABELS[feedback.complaintType];

  return (
    <div className="glass p-4 space-y-3 hover:border-green-500/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-1 text-green-400/80 text-xs">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium text-white truncate">{feedback.submittedByName || 'Unknown'}</span>
              <span className="text-green-400/40">·</span>
              <span className="capitalize">{(feedback.submittedByRole || '').replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {renderStars(feedback.rating)}
          </div>
          <p className="text-xs text-green-400/60">
            About donor: <span className="text-green-300 font-medium">{feedback.donorName || 'Unknown Donor'}</span>
          </p>
        </div>

        <div className="flex-shrink-0">
          {feedback.resolutionStatus === 'resolved' ? (
            <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Resolved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Text */}
      {feedback.feedbackText && (
        <div className="bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-200/80">{feedback.feedbackText}</p>
          </div>
        </div>
      )}

      {/* Complaint */}
      {complaintLabel && (
        <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">{complaintLabel}</p>
              {feedback.complaintDescription && (
                <p className="text-xs text-red-200/70 mt-1">{feedback.complaintDescription}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Button — only shown when there's an unresolved complaint */}
      {feedback.resolutionStatus !== 'resolved' && complaintLabel && (
        <div className="pt-2 border-t border-green-900/30">
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {resolving ? 'Resolving...' : (
              <><CheckCircle className="w-4 h-4" /> Mark as Resolved</>
            )}
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-green-400/40 text-right">
        {isNaN(createdDate) ? 'Just now' : `${createdDate.toLocaleDateString()} at ${createdDate.toLocaleTimeString()}`}
      </div>
    </div>
  );
}