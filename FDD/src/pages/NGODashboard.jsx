import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, limit
} from 'firebase/firestore';
import { Filter, Package, CheckCircle, AlertCircle, Truck, MessageSquare, Plus } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

export default function NGODashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', urgency: '' });
  const [tab, setTab] = useState('available');
  const [toast, setToast] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Real-time listener for available (pending) food requests
  useEffect(() => {
    setLoading(true);
    // Only filter on single field to avoid composite index requirement
    const q = query(
      collection(db, 'foodRequests'),
      where('status', '==', 'pending'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort client-side (avoids needing a composite index)
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
        return bt - at;
      });

      // Client-side filters
      if (filters.category) data = data.filter(r => r.foodUsabilityCategory === filters.category || r.foodCategory === filters.category);
      if (filters.urgency) data = data.filter(r => r.urgency === filters.urgency);

      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.warn('Requests listener error:', err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [filters]);

  // Real-time listener for requests accepted by this NGO
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'foodRequests'),
      where('acceptedByUid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
        return bt - at;
      });
      setMyRequests(data);
    }, (err) => console.warn('MyRequests error:', err.message));

    return () => unsub();
  }, [user?.uid]);

  // Real-time feedback listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'feedbacks'),
      where('submittedById', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
        return bt - at;
      });
      setFeedbacks(data);
    }, (err) => console.warn('Feedback listener error:', err.message));
    return () => unsub();
  }, [user?.uid]);

  const handleAccept = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), {
        status: 'accepted',
        acceptedByUid: user.uid,
        acceptedByName: user.name || user.email,
        acceptedByRole: user.role,
        acceptedAt: new Date().toISOString(),
      });
      showToast('Request accepted! 🎉');
    } catch (err) {
      showToast('Failed to accept: ' + err.message);
    }
  };

  const handleDeliver = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });
      showToast('Marked as delivered! ✅');
    } catch (err) {
      showToast('Failed to update: ' + err.message);
    }
  };

  const handleFeedbackSubmit = () => {
    showToast('Feedback submitted! 🙏');
  };

  const handleResolveFeedback = (feedbackId) => {
    setFeedbacks(feedbacks.map(f => f.id === feedbackId ? { ...f, resolutionStatus: 'resolved' } : f));
    showToast('Marked as resolved!');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">NGO Dashboard</h1>
            <p className="text-green-400/60 mt-1">
              {user?.name}
              {!user?.isVerified && <span className="ml-2 text-yellow-400 text-xs">(Pending verification)</span>}
            </p>
          </div>

          {/* Subscription Status */}
          {user?.uid?.startsWith('demo_') ? (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-green-900/20 border border-gray-200 dark:border-green-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invigilator Demo Mode</h3>
                  <p className="text-gray-600 dark:text-green-300/70 text-sm mt-1">
                    Unlimited access granted for grading. Subscription requirements and limits are bypassed.
                  </p>
                </div>
              </div>
            </div>
          ) : user?.subscription && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-green-900/20 border border-gray-200 dark:border-green-500/30 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Status</h3>
                  <p className="text-gray-600 dark:text-green-300/70 text-sm mt-1">
                    Plan: <span className="font-medium text-gray-900 dark:text-white">{user.subscription.plan}</span> | Status: <span className="capitalize">{user.subscription.status}</span>
                  </p>
                  <p className="text-gray-600 dark:text-green-300/70 text-sm">
                    Used: {user.subscription.usedRequests} / {user.subscription.usageLimit} limit
                  </p>
                </div>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] dark:bg-green-600 dark:hover:bg-green-500 text-white rounded-lg transition text-sm font-medium whitespace-nowrap shadow-sm"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="fixed top-20 right-4 z-50 px-4 py-3 bg-green-600 text-white text-sm rounded-lg shadow-lg fade-in">
              {toast}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-green-900/30 pb-4">
            {['available', 'accepted', 'feedback'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${tab === t ? 'bg-green-600 text-white' : 'glass text-green-400/60 hover:text-green-400'}`}>
                {t === 'feedback' && <MessageSquare className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>

          {tab === 'available' && (
            <>
              {/* Filters */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
                  className="px-4 py-2 bg-green-900/10 border border-green-900/40 rounded-lg text-green-300 text-sm focus:outline-none focus:border-green-500/50">
                  <option value="">All Categories</option>
                  <option value="human_edible">Human Edible</option>
                  <option value="animal_edible">Animal Edible</option>
                  <option value="fertilizer_compost">Compost / Fertilizer</option>
                  <option value="fresh_food">Fresh Food</option>
                  <option value="perishable_food">Perishable</option>
                </select>
                <select value={filters.urgency} onChange={e => setFilters({ ...filters, urgency: e.target.value })}
                  className="px-4 py-2 bg-green-900/10 border border-green-900/40 rounded-lg text-green-300 text-sm focus:outline-none focus:border-green-500/50">
                  <option value="">All Urgencies</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => setFilters({ category: '', urgency: '' })}
                  className="px-4 py-2 glass text-green-400/60 hover:text-green-400 rounded-lg text-sm transition-colors">
                  Clear
                </button>
              </div>

              {loading ? (
                <div className="text-center text-green-400/40 py-20 animate-pulse">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="text-center text-green-400/40 py-20">
                  No available food requests. Check back soon! 🌱
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map(r => (
                    <FoodCard key={r.id} request={r} onAccept={handleAccept} userRole={user?.role} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'accepted' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.length === 0 ? (
                <div className="col-span-3 text-center text-green-400/40 py-20">No accepted requests.</div>
              ) : myRequests.map(r => (
                <FoodCard key={r.id} request={r} onDeliver={handleDeliver} userRole={user?.role} />
              ))}
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Feedback & Complaints</h2>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Submit Feedback
                </button>
              </div>

              {feedbacks.length === 0 ? (
                <div className="text-center text-green-400/40 py-20">No feedback submitted yet.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedbacks.map(feedback => (
                    <FeedbackDisplay
                      key={feedback.id}
                      feedback={feedback}
                      onResolve={handleResolveFeedback}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <FeedbackForm
              accentColor="green"
              onSubmit={handleFeedbackSubmit}
              onClose={() => setShowFeedbackModal(false)}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
