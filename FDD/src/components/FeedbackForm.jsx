import { useState, useEffect } from 'react';
import { Star, Send, AlertTriangle, User, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const COMPLAINT_OPTIONS = [
  { value: 'none', label: 'No complaint — all good' },
  { value: 'spoiled_food', label: 'Spoiled / bad food' },
  { value: 'insufficient_quantity', label: 'Insufficient quantity' },
  { value: 'wrong_information', label: 'Wrong information provided' },
  { value: 'unsafe_food', label: 'Unsafe / hazardous food' },
  { value: 'other', label: 'Other (describe below)' },
];

/**
 * FeedbackForm — Firebase-connected feedback form
 * Props:
 *   onSubmit(feedbackDoc)  — called after successful save
 *   onClose()              — called to close the modal
 *   accentColor            — 'green' | 'amber' | 'lime' (default: 'green')
 */
export default function FeedbackForm({ onSubmit, onClose, accentColor = 'green' }) {
  const { user } = useAuth();

  // Donor selector
  const [donors, setDonors] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [selectedDonorName, setSelectedDonorName] = useState('');
  const [donorLoading, setDonorLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [complaintType, setComplaintType] = useState('none');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Accent classes per role
  const accent = {
    green: { border: 'border-green-500/30', focus: 'focus:border-green-400', btn: 'bg-green-600 hover:bg-green-500', label: 'text-green-300/70', star: 'text-green-400 fill-green-400' },
    amber: { border: 'border-amber-500/30', focus: 'focus:border-amber-400', btn: 'bg-amber-600 hover:bg-amber-500', label: 'text-amber-300/70', star: 'text-amber-400 fill-amber-400' },
    lime:  { border: 'border-lime-500/30',  focus: 'focus:border-lime-400',  btn: 'bg-stone-700 hover:bg-stone-600 border border-lime-500/30 text-lime-300', label: 'text-lime-300/70', star: 'text-lime-400 fill-lime-400' },
  }[accentColor] || {};

  // Fetch list of donors from Firestore for the dropdown
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'donor')));
        setDonors(snap.docs.map(d => ({ id: d.id, name: d.data().name || d.data().email })));
      } catch (err) {
        console.warn('Could not load donors:', err.message);
      } finally {
        setDonorLoading(false);
      }
    };
    fetchDonors();
  }, []);

  const handleDonorChange = (e) => {
    const id = e.target.value;
    setSelectedDonorId(id);
    const found = donors.find(d => d.id === id);
    setSelectedDonorName(found ? found.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDonorId) { setError('Please select the donor you are reviewing.'); return; }
    if (rating === 0) { setError('Please select a star rating.'); return; }

    setLoading(true);
    try {
      const feedbackDoc = {
        submittedById: user.uid,
        submittedByName: user.name || user.email,
        submittedByRole: user.role,
        donorId: selectedDonorId,
        donorName: selectedDonorName,
        rating,
        feedbackText: feedbackText.trim(),
        complaintType,
        complaintDescription: complaintType === 'other' ? complaintDescription.trim() : '',
        resolutionStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'feedbacks'), feedbackDoc);
      onSubmit({ id: ref.id, ...feedbackDoc, createdAt: new Date() });
      onClose();
    } catch (err) {
      console.error('Feedback submit failed:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        Submit Feedback
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Donor Selector */}
        <div>
          <label className={`block text-sm font-medium ${accent.label} mb-2 flex items-center gap-1`}>
            <User className="w-4 h-4" /> Select Donor *
          </label>
          {donorLoading ? (
            <div className="text-sm text-green-400/40 animate-pulse">Loading donors...</div>
          ) : donors.length === 0 ? (
            <div className="text-sm text-red-400/70">No donors found in the system yet.</div>
          ) : (
            <div className="relative">
              <select
                value={selectedDonorId}
                onChange={handleDonorChange}
                required
                className={`w-full px-3 py-2.5 bg-green-900/20 border ${accent.border} rounded-lg text-white ${accent.focus} focus:outline-none appearance-none`}
              >
                <option value="" className="bg-[#0a0f0d]">-- Select a donor --</option>
                {donors.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#0a0f0d]">{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/50 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Star Rating */}
        <div>
          <label className={`block text-sm font-medium ${accent.label} mb-2`}>
            Food Quality Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-green-400/60 self-center">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label className={`block text-sm font-medium ${accent.label} mb-2`}>
            Your Experience (Optional)
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className={`w-full px-3 py-2 bg-green-900/20 border ${accent.border} rounded-lg text-white placeholder-green-400/40 ${accent.focus} focus:outline-none resize-none text-sm`}
            rows={3}
            placeholder="Describe the food quality, packaging, timeliness..."
          />
        </div>

        {/* Complaint Type */}
        <div>
          <label className={`block text-sm font-medium ${accent.label} mb-2`}>
            Report an Issue
          </label>
          <select
            value={complaintType}
            onChange={(e) => setComplaintType(e.target.value)}
            className={`w-full px-3 py-2 bg-green-900/20 border ${accent.border} rounded-lg text-white ${accent.focus} focus:outline-none text-sm`}
          >
            {COMPLAINT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0a0f0d]">{o.label}</option>
            ))}
          </select>
        </div>

        {/* Extra description for "other" complaint */}
        {complaintType === 'other' && (
          <div>
            <label className={`block text-sm font-medium ${accent.label} mb-2`}>
              Describe the Issue *
            </label>
            <textarea
              value={complaintDescription}
              onChange={(e) => setComplaintDescription(e.target.value)}
              className={`w-full px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-white placeholder-red-400/40 focus:border-red-400 focus:outline-none resize-none text-sm`}
              rows={2}
              placeholder="Explain the issue in detail..."
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-2 flex-grow px-4 py-2 ${accent.btn} text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium`}
          >
            {loading ? 'Submitting...' : (
              <><Send className="w-4 h-4" /> Submit Feedback</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}