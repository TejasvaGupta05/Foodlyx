import { useState } from 'react';
import { Star, Send, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

export default function FeedbackForm({ foodRequestId, deliveryId, facilityName, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [complaintType, setComplaintType] = useState('none');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const complaintOptions = [
    { value: 'none', label: 'No complaint' },
    { value: 'spoiled_food', label: 'Spoiled food' },
    { value: 'insufficient_quantity', label: 'Insufficient quantity' },
    { value: 'wrong_information', label: 'Wrong information provided' },
    { value: 'unsafe_food', label: 'Unsafe food' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setLoading(true);
    try {
      const feedbackData = {
        foodRequestId,
        deliveryId,
        facilityName,
        rating,
        feedbackText,
        complaintType,
        complaintDescription: complaintType === 'other' ? complaintDescription : '',
      };

      await api.post('/feedback', feedbackData);
      onSubmit();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-green-400" />
        Submit Feedback
      </h3>
      {facilityName && (
        <p className="text-sm text-green-300/80 mb-3">
          Donor facility: <span className="font-semibold text-white">{facilityName}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-green-300/70 mb-2">
            Food Quality Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-400'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label className="block text-sm font-medium text-green-300/70 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg text-white placeholder-green-400/50 focus:border-green-400 focus:outline-none resize-none"
            rows={3}
            placeholder="Share your experience..."
          />
        </div>

        {/* Complaint Type */}
        <div>
          <label className="block text-sm font-medium text-green-300/70 mb-2">
            Complaint Type
          </label>
          <select
            value={complaintType}
            onChange={(e) => setComplaintType(e.target.value)}
            className="w-full px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg text-white focus:border-green-400 focus:outline-none"
          >
            {complaintOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Complaint Description */}
        {complaintType === 'other' && (
          <div>
            <label className="block text-sm font-medium text-green-300/70 mb-2">
              Complaint Description *
            </label>
            <textarea
              value={complaintDescription}
              onChange={(e) => setComplaintDescription(e.target.value)}
              className="w-full px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg text-white placeholder-green-400/50 focus:border-green-400 focus:outline-none resize-none"
              rows={2}
              placeholder="Describe the issue..."
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}