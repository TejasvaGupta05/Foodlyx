import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { Package, CheckCircle, Truck, MessageSquare, Plus, Heart, Filter, X, Zap } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'available', label: '🍱 Available',  desc: 'Pending food requests near you' },
  { key: 'accepted',  label: '✅ Accepted',   desc: 'Requests your NGO has accepted'  },
  { key: 'feedback',  label: '💬 Feedback',   desc: 'Submitted feedback history'      },
];

const CAT_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'human_edible',       label: '🧑 Human Edible' },
  { value: 'animal_edible',      label: '🐾 Animal Edible' },
  { value: 'fertilizer_compost', label: '🌿 Compost' },
  { value: 'fresh_food',         label: '🥬 Fresh Food' },
  { value: 'perishable_food',    label: '⏰ Perishable' },
];

const URG_FILTERS = [
  { value: '',       label: 'Any Urgency' },
  { value: 'high',   label: '🔴 High'   },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low',    label: '🟢 Low'    },
];

export default function NGODashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [feedbacks, setFeedbacks]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ category: '', urgency: '' });
  const [tab, setTab]               = useState('available');
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000); };

  // Available requests
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'foodRequests'), where('status', '==', 'pending'), limit(100));
    return onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      if (filters.category) data = data.filter(r => r.foodUsabilityCategory === filters.category || r.foodCategory === filters.category);
      if (filters.urgency) data = data.filter(r => r.urgency === filters.urgency);
      setRequests(data);
      setLoading(false);
    }, err => { console.warn(err.message); setLoading(false); });
  }, [filters]);

  // My accepted requests
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
      showToast('🎉 Request accepted! Go deliver with love.');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const handleDeliver = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), { status: 'delivered', deliveredAt: new Date().toISOString() });
      showToast('✅ Marked as delivered! Great work!');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const hasFilters = filters.category || filters.urgency;

  return (
    <ProtectedRoute>
      <div className="warm-page min-h-screen pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">

          {/* ── Toast ── */}
          {toast.msg && (
            <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg fade-in"
              style={{ background: toast.type === 'error' ? '#FEF2F2' : '#DCFCE7', color: toast.type === 'error' ? '#DC2626' : '#16A34A', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#86EFAC'}` }}>
              {toast.msg}
            </div>
          )}

          {/* ── Header ── */}
          <div className="mb-8">
            <span className="warm-badge mb-3 inline-flex" style={{ background: '#DBEAFE', color: '#2563EB' }}>
              🤝 NGO Portal
            </span>
            <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>NGO Dashboard</h1>
            <p className="text-base" style={{ color: '#64748B' }}>
              {user?.name}
              {!user?.isVerified && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>⏳ Pending Verification</span>}
            </p>
          </div>

          {/* ── Subscription Banner ── */}
          {user?.uid?.startsWith('demo_') ? (
            <div className="warm-card p-5 mb-6 flex items-center gap-3" style={{ border: '1px solid #DBEAFE' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#DBEAFE' }}>
                <Zap className="w-5 h-5" style={{ color: '#2563EB' }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1C2B22' }}>Demo Mode Active</p>
                <p className="text-xs" style={{ color: '#64748B' }}>Full access granted for evaluation. Subscription limits bypassed.</p>
              </div>
            </div>
          ) : user?.subscription && (
            <div className="warm-card p-5 mb-6 flex items-center justify-between gap-4 flex-wrap" style={{ border: '1px solid #DCFCE7' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#1C2B22' }}>
                    {user.subscription.plan} · <span className="capitalize">{user.subscription.status}</span>
                  </p>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    Used {user.subscription.usedRequests}/{user.subscription.usageLimit} requests this period
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/subscribe')}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#DCFCE7', color: '#16A34A' }}>
                Manage Plan
              </button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: tab === key ? '#22C55E' : '#FFFFFF',
                  color: tab === key ? '#FFFFFF' : '#64748B',
                  border: tab === key ? '2px solid #22C55E' : '2px solid #F1F5F9',
                  boxShadow: tab === key ? '0 4px 12px rgba(34,197,94,0.25)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Available Tab ── */}
          {tab === 'available' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-5 items-center">
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#64748B' }}><Filter className="w-4 h-4" /> Filter:</span>
                {CAT_FILTERS.map(({ value, label }) => (
                  <button key={value} onClick={() => setFilters({ ...filters, category: value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: filters.category === value ? '#22C55E' : '#FFFFFF', color: filters.category === value ? '#FFFFFF' : '#334155', border: `1.5px solid ${filters.category === value ? '#22C55E' : '#E2E8F0'}` }}>
                    {label}
                  </button>
                ))}
                <div className="w-px h-5" style={{ background: '#E2E8F0' }} />
                {URG_FILTERS.slice(1).map(({ value, label }) => (
                  <button key={value} onClick={() => setFilters({ ...filters, urgency: filters.urgency === value ? '' : value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: filters.urgency === value ? '#F59E0B' : '#FFFFFF', color: filters.urgency === value ? '#FFFFFF' : '#334155', border: `1.5px solid ${filters.urgency === value ? '#F59E0B' : '#E2E8F0'}` }}>
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
                  <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin mb-3" />
                  <p className="text-sm" style={{ color: '#64748B' }}>Loading food requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="warm-card p-16 text-center">
                  <div className="text-5xl mb-4">🌱</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No requests right now</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    {hasFilters ? 'Try removing filters to find more requests.' : 'Check back soon — donors post throughout the day!'}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {requests.map(r => <FoodCard key={r.id} request={r} onAccept={handleAccept} userRole={user?.role} />)}
                </div>
              )}
            </>
          )}

          {/* ── Accepted Tab ── */}
          {tab === 'accepted' && (
            myRequests.length === 0 ? (
              <div className="warm-card p-16 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No accepted requests yet</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>Go to Available tab to accept food donation requests.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myRequests.map(r => <FoodCard key={r.id} request={r} onDeliver={handleDeliver} userRole={user?.role} />)}
              </div>
            )
          )}

          {/* ── Feedback Tab ── */}
          {tab === 'feedback' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black" style={{ color: '#1C2B22' }}>Feedback & Complaints</h2>
                <button onClick={() => setShowFeedbackModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
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

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <FeedbackForm accentColor="green" onSubmit={() => { showToast('🙏 Feedback submitted!'); setShowFeedbackModal(false); }} onClose={() => setShowFeedbackModal(false)} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
