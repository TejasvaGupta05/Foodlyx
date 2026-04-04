import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { Package, Truck, MessageSquare, Plus, Heart, X, Filter } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

const TABS = [
  { key: 'available', label: '🐾 Available',       desc: 'Animal-grade food requests'  },
  { key: 'accepted',  label: '✅ Active Pickups',   desc: 'Items your shelter accepted' },
  { key: 'feedback',  label: '💬 Feedback',         desc: 'Submitted feedback history'  },
];

export default function AnimalShelterDashboard() {
  const { user } = useAuth();
  const [requests, setRequests]     = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [feedbacks, setFeedbacks]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ category: '', urgency: '' });
  const [tab, setTab]               = useState('available');
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  // Available animal-grade requests
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'foodRequests'), where('status', '==', 'pending'), limit(100));
    return onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      // Default: show animal_edible, but allow overriding via filter
      if (filters.category) {
        data = data.filter(r => r.foodUsabilityCategory === filters.category || r.foodCategory === filters.category);
      } else {
        data = data.filter(r => r.foodUsabilityCategory === 'animal_edible' || r.foodUsabilityCategory === 'human_edible');
      }
      if (filters.urgency) data = data.filter(r => r.urgency === filters.urgency);
      setRequests(data);
      setLoading(false);
    }, err => { console.warn(err.message); setLoading(false); });
  }, [filters]);

  // My pickups
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'foodRequests'), where('acceptedByUid', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setMyRequests(data);
    }, err => console.warn(err.message));
  }, [user?.uid]);

  // Feedback
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'feedbacks'), where('submittedById', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setFeedbacks(data);
    }, err => console.warn(err.message));
  }, [user?.uid]);

  const handleAccept = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), {
        status: 'accepted', acceptedByUid: user.uid,
        acceptedByName: user.name || user.email, acceptedByRole: user.role,
        acceptedAt: new Date().toISOString(),
      });
      showToast('🐾 Pickup confirmed! Your animals will be fed.');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const handleDeliver = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), { status: 'delivered', deliveredAt: new Date().toISOString() });
      showToast('✅ Food delivered to shelter!');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const hasFilters = filters.category || filters.urgency;

  return (
    <ProtectedRoute>
      <div className="warm-page min-h-screen pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">

          {/* Toast */}
          {toast.msg && (
            <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg fade-in"
              style={{ background: toast.type === 'error' ? '#FEF2F2' : '#FEF3C7', color: toast.type === 'error' ? '#DC2626' : '#D97706', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#FCD34D'}` }}>
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <span className="warm-badge mb-3 inline-flex" style={{ background: '#FEF3C7', color: '#D97706' }}>
              🐾 Animal Shelter Portal
            </span>
            <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
              Shelter Intake Dashboard
            </h1>
            <p className="text-base" style={{ color: '#64748B' }}>
              {user?.name}
              {!user?.isVerified && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>⏳ Pending Verification</span>}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Available',  value: requests.length,                                                    emoji: '🍽️', color: '#F59E0B', bg: '#FEF3C7' },
              { label: 'Accepted',   value: myRequests.filter(r => r.status === 'accepted').length,             emoji: '🚗', color: '#3B82F6', bg: '#DBEAFE' },
              { label: 'Delivered',  value: myRequests.filter(r => r.status === 'delivered').length,            emoji: '✅', color: '#16A34A', bg: '#DCFCE7' },
            ].map(({ label, value, emoji, color, bg }) => (
              <div key={label} className="warm-card p-5 text-center hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2" style={{ background: bg }}>{emoji}</div>
                <div className="text-2xl font-black" style={{ color }}>{value}</div>
                <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: tab === key ? '#F59E0B' : '#FFFFFF',
                  color: tab === key ? '#FFFFFF' : '#64748B',
                  border: tab === key ? '2px solid #F59E0B' : '2px solid #F1F5F9',
                  boxShadow: tab === key ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Available Tab */}
          {tab === 'available' && (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
                <Heart className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
                <p className="text-sm" style={{ color: '#92400E' }}>
                  Showing animal-edible food by default. Use filters to see all food categories.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-5 items-center">
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#64748B' }}><Filter className="w-4 h-4" /> Filter:</span>
                {[{ value: '', label: 'Default (Animal)' }, { value: 'animal_edible', label: '🐾 Animal Edible' }, { value: 'human_edible', label: '🧑 Human Edible' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setFilters({ ...filters, category: value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: filters.category === value ? '#F59E0B' : '#FFFFFF', color: filters.category === value ? '#FFFFFF' : '#334155', border: `1.5px solid ${filters.category === value ? '#F59E0B' : '#E2E8F0'}` }}>
                    {label}
                  </button>
                ))}
                <div className="w-px h-5" style={{ background: '#E2E8F0' }} />
                {[{ value: 'high', label: '🔴 High' }, { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '🟢 Low' }].map(({ value, label }) => (
                  <button key={value} onClick={() => setFilters({ ...filters, urgency: filters.urgency === value ? '' : value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: filters.urgency === value ? '#D97706' : '#FFFFFF', color: filters.urgency === value ? '#FFFFFF' : '#334155', border: `1.5px solid ${filters.urgency === value ? '#D97706' : '#E2E8F0'}` }}>
                    {label}
                  </button>
                ))}
                {hasFilters && (
                  <button onClick={() => setFilters({ category: '', urgency: '' })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA' }}>
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center py-20">
                  <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mb-3" />
                  <p className="text-sm" style={{ color: '#64748B' }}>Scanning for available food...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="warm-card p-16 text-center">
                  <div className="text-5xl mb-4">🐾</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No suitable food batches right now</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>Check back soon or remove filters to see all available food.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {requests.map(r => (
                    <div key={r.id} className="relative">
                      <FoodCard request={r} onAccept={handleAccept} userRole={user?.role} />
                      <div className="absolute -top-2 -right-2 px-2.5 py-1 text-xs font-bold rounded-full shadow-md"
                        style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#FFFFFF' }}>
                        🐾 Animal Grade
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Accepted Tab */}
          {tab === 'accepted' && (
            myRequests.length === 0 ? (
              <div className="warm-card p-16 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No active pickups</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>Accept food requests from the Available tab to start feeding animals.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myRequests.map(r => <FoodCard key={r.id} request={r} onDeliver={handleDeliver} userRole={user?.role} />)}
              </div>
            )
          )}

          {/* Feedback Tab */}
          {tab === 'feedback' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black" style={{ color: '#1C2B22' }}>Feedback & Complaints</h2>
                <button onClick={() => setShowFeedbackModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                  <Plus className="w-4 h-4" /> Submit Feedback
                </button>
              </div>
              {feedbacks.length === 0 ? (
                <div className="warm-card p-12 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#CBD5E1' }} />
                  <p className="text-sm font-medium" style={{ color: '#64748B' }}>No feedback submitted yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {feedbacks.map(fb => <FeedbackDisplay key={fb.id} feedback={fb} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <FeedbackForm accentColor="amber" onSubmit={() => { showToast('🙏 Feedback submitted!'); setShowFeedbackModal(false); }} onClose={() => setShowFeedbackModal(false)} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
