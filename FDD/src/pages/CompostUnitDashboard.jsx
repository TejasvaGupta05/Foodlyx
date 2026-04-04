import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { Recycle, Truck, MessageSquare, Plus, Leaf, X, Filter } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';

const TABS = [
  { key: 'available', label: '🌿 Waste Batches',    desc: 'Non-edible food for composting' },
  { key: 'accepted',  label: '🚛 Active Hauling',   desc: 'Batches your unit has accepted'  },
  { key: 'feedback',  label: '💬 Feedback',          desc: 'Submitted feedback history'      },
];

export default function CompostUnitDashboard() {
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

  // Available compost-suitable requests
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'foodRequests'), where('status', '==', 'pending'), limit(100));
    return onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      if (filters.category) {
        data = data.filter(r => r.foodUsabilityCategory === filters.category || r.foodCategory === filters.category);
      } else {
        // Default: prefer fertilizer_compost and perishable
        data = data.filter(r => r.foodUsabilityCategory === 'fertilizer_compost' || r.foodCategory === 'perishable_food');
      }
      if (filters.urgency) data = data.filter(r => r.urgency === filters.urgency);
      setRequests(data);
      setLoading(false);
    }, err => { console.warn(err.message); setLoading(false); });
  }, [filters]);

  // My hauling
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
      showToast('♻️ Compost route confirmed! Waste will be repurposed.');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const handleDeliver = async (id) => {
    try {
      await updateDoc(doc(db, 'foodRequests', id), { status: 'delivered', deliveredAt: new Date().toISOString() });
      showToast('✅ Waste delivered to composting unit!');
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
  };

  const hasFilters = filters.category || filters.urgency;
  const totalRepurposed = myRequests.filter(r => r.status === 'delivered').reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);

  return (
    <div className="warm-page min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-6">

        {/* Toast */}
        {toast.msg && (
          <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg fade-in"
            style={{ background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5', color: toast.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#6EE7B7'}` }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <span className="warm-badge mb-3 inline-flex" style={{ background: '#ECFDF5', color: '#059669' }}>
            🌿 Compost Unit Portal
          </span>
          <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Compost Hub Dashboard
          </h1>
          <p className="text-base" style={{ color: '#64748B' }}>
            {user?.name}
            {!user?.isVerified && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>⏳ Pending Verification</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Available Waste',  value: requests.length,                                          emoji: '🗑️', color: '#059669', bg: '#ECFDF5' },
            { label: 'Hauling Active',   value: myRequests.filter(r => r.status === 'accepted').length,   emoji: '🚛', color: '#3B82F6', bg: '#DBEAFE' },
            { label: 'Composted',        value: myRequests.filter(r => r.status === 'delivered').length,  emoji: '✅', color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Kg Repurposed',   value: `${totalRepurposed.toFixed(0)}`,                          emoji: '♻️', color: '#D97706', bg: '#FEF3C7' },
          ].map(({ label, value, emoji, color, bg }) => (
            <div key={label} className="warm-card p-5 text-center hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2" style={{ background: bg }}>{emoji}</div>
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Environmental impact callout */}
        <div className="warm-card p-5 mb-8 flex items-center gap-4" style={{ border: '1px solid #6EE7B7', background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: '#DCFCE7' }}>
            🌍
          </div>
          <div>
            <p className="font-black text-lg" style={{ color: '#1C2B22' }}>
              {totalRepurposed.toFixed(0)} kg of waste diverted from landfill
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Every gram composted is a step toward a healthier planet 🌱
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: tab === key ? '#059669' : '#FFFFFF',
                color: tab === key ? '#FFFFFF' : '#64748B',
                border: tab === key ? '2px solid #059669' : '2px solid #F1F5F9',
                boxShadow: tab === key ? '0 4px 12px rgba(5,150,105,0.25)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Available Tab */}
        {tab === 'available' && (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ background: '#ECFDF5', border: '1px solid #6EE7B7' }}>
              <Leaf className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#059669' }} />
              <p className="text-sm" style={{ color: '#065F46' }}>
                Showing compost-suitable food (expired/perishable) by default. Use filters to see all categories.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5 items-center">
              <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#64748B' }}><Filter className="w-4 h-4" /> Filter:</span>
              {[
                { value: '', label: '🌿 Compost Default' },
                { value: 'fertilizer_compost', label: '🌱 Fertilizer/Compost' },
                { value: 'perishable_food', label: '⏰ Perishable' },
                { value: 'animal_edible', label: '🐾 Animal Edible' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setFilters({ ...filters, category: value })}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: filters.category === value ? '#059669' : '#FFFFFF', color: filters.category === value ? '#FFFFFF' : '#334155', border: `1.5px solid ${filters.category === value ? '#059669' : '#E2E8F0'}` }}>
                  {label}
                </button>
              ))}
              <div className="w-px h-5" style={{ background: '#E2E8F0' }} />
              {[{ value: 'high', label: '🔴 Critical' }, { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '🟢 Low' }].map(({ value, label }) => (
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
                <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-emerald-500 animate-spin mb-3" />
                <p className="text-sm" style={{ color: '#64748B' }}>Scanning for compostable batches...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="warm-card p-16 text-center">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No waste batches available</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>The ecosystem is clean right now. Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {requests.map(r => (
                  <div key={r.id} className="relative">
                    <FoodCard request={r} onAccept={handleAccept} userRole={user?.role} />
                    <div className="absolute -top-2 -right-2 px-2.5 py-1 text-xs font-bold rounded-full shadow-md"
                      style={{ background: 'linear-gradient(135deg,#059669,#16A34A)', color: '#FFFFFF' }}>
                      🌿 Compost Grade
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Accepted/Hauling Tab */}
        {tab === 'accepted' && (
          myRequests.length === 0 ? (
            <div className="warm-card p-16 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4" style={{ color: '#CBD5E1' }} />
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No active hauling operations</h3>
              <p className="text-sm" style={{ color: '#64748B' }}>Accept compost batches from the Waste tab to start processing.</p>
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
                style={{ background: 'linear-gradient(135deg,#059669,#16A34A)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
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
          <FeedbackForm accentColor="green" onSubmit={() => { showToast('🙏 Feedback submitted!'); setShowFeedbackModal(false); }} onClose={() => setShowFeedbackModal(false)} />
        </div>
      )}
    </div>
  );
}
