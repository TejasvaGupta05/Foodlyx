import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Truck, Sprout, Recycle, Trash2, MessageSquare } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';

export default function CompostUnitDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Compost default focuses strictly on completely un-edible food types / waste stock
  const [filters, setFilters] = useState({ category: 'non_edible', urgency: '' });
  const [tab, setTab] = useState('available');
  const [toast, setToast] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.set('category', filters.category);
      
      const { data } = await api.get(`/requests?${params}`);
      
      // Client-side filtering for urgency
      let filtered = data;
      if (filters.urgency) {
        filtered = filtered.filter(req => req.urgency === filters.urgency);
      }
      
      // Client-side filtering logic to showcase food that is 100% perished or waste
      if(filters.category === 'non_edible') {
         filtered = data.filter(d => ['perishable_food', 'dry_food'].includes(d.category));
      }
      setRequests(filtered);

      const myData = await api.get('/requests/my');
      setMyRequests(myData.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get(`/feedback/receiver/${user?.uid}`);
      setFeedbacks(data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  useEffect(() => { fetchRequests(); fetchFeedbacks(); }, [filters]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/requests/${id}/accept`);
      showToast('Compost route generated!');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await api.patch(`/requests/${id}/deliver`);
      showToast('Dumped to Composter!');
      fetchRequests();
    } catch { }
  };

  const openFeedbackModal = (request) => {
    setSelectedRequest(request);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = () => {
    fetchFeedbacks();
    showToast('Feedback submitted successfully!');
  };

  const handleResolveFeedback = (feedbackId) => {
    setFeedbacks(feedbacks.map(f => f._id === feedbackId ? { ...f, resolutionStatus: 'resolved' } : f));
    showToast('Feedback resolved!');
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 hero-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header - Earthy Stone/Lime styling */}
        <div className="mb-8 p-6 bg-stone-800/60 border border-stone-500/30 rounded-2xl glass shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-600 to-stone-700 border border-lime-500/40 text-lime-400 flex items-center justify-center shadow-lg">
                   <Recycle className="w-6 h-6" />
                </div>
                <div>
                   <h1 className="text-3xl font-black text-white">Compost Hub</h1>
                   <p className="text-lime-400/60 mt-1 text-sm font-medium">
                     {user?.name}
                     {!user?.isVerified && <span className="ml-2 text-yellow-400 text-xs">(Pending verification)</span>}
                   </p>
                </div>
             </div>
             
             <div className="px-5 py-3 rounded-xl bg-black/40 border border-stone-700/50 flex flex-col items-center">
                <span className="text-xs text-stone-400 uppercase tracking-widest font-bold">Waste Repurposed</span>
                <span className="text-2xl font-black text-lime-400">1,240 <span className="text-sm text-lime-400/50">Kg</span></span>
             </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 px-4 py-3 bg-stone-700 border border-lime-500/50 text-lime-300 text-sm rounded-lg shadow-[0_0_20px_rgba(101,163,13,0.3)] fade-in">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-stone-800/80 pb-4">
          {['waste sonar', 'active hauling', 'feedback'].map(t => {
            const mappedTab = t === 'waste sonar' ? 'available' : t === 'active hauling' ? 'accepted' : 'feedback';
            return (
               <button key={t} onClick={() => setTab(mappedTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${tab === mappedTab ? 'bg-stone-700 text-lime-400 border border-lime-500/30 shadow-[0_0_15px_rgba(101,163,13,0.15)]' : 'glass text-stone-500/80 hover:text-stone-300'}`}>
                  {t === 'feedback' && <MessageSquare className="w-4 h-4" />}
                  {t}
               </button>
            )
          })}
        </div>

        {tab === 'available' && (
          <>
            {/* Filters */}
            <div className="flex gap-4 mb-6 p-4 bg-stone-900/40 rounded-xl border border-stone-800/60 shadow-inner flex-wrap">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                 <label className="text-[10px] text-stone-500 uppercase font-black tracking-widest pl-1">Waste Type</label>
                 <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
                   className="px-4 py-2 bg-stone-950/50 border border-stone-700/50 rounded-lg text-stone-300 text-sm focus:outline-none focus:border-lime-500/50 min-w-[200px]">
                   <option value="all">All Waste Metrics</option>
                   <option value="non_edible">Non-Edible (100% Spoiled/Scraps)</option>
                 </select>
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                 <label className="text-[10px] text-stone-500 uppercase font-black tracking-widest pl-1">Haul Urgency</label>
                 <select value={filters.urgency} onChange={e => setFilters({...filters, urgency: e.target.value})}
                   className="px-4 py-2 bg-stone-950/50 border border-stone-700/50 rounded-lg text-stone-300 text-sm focus:outline-none focus:border-lime-500/50 min-w-[200px]">
                   <option value="">All Urgencies</option>
                   <option value="high">Critical Mass</option>
                   <option value="medium">Standard Spoilage</option>
                   <option value="low">Low Risk</option>
                 </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-stone-500 py-20 font-medium animate-pulse flex flex-col items-center gap-3">
                 <Sprout className="w-6 h-6" /> Extracting waste nodes...
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-stone-600/50 py-20 gap-3">
                 <Trash2 className="w-12 h-12" />
                 <span>No spoiled stockpiles detected. Ecosystem is clean!</span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map(r => (
                  <div key={r._id} className="relative group hover:-translate-y-1 transition-transform duration-300">
                     <FoodCard request={r} onAccept={handleAccept} userRole={user?.role} />
                     <div className="absolute -top-3 -right-3 bg-stone-800 text-lime-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] border border-lime-500/40 flex items-center gap-1.5">
                        <Trash2 className="w-3 h-3" /> Raw Waste
                     </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'accepted' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRequests.length === 0 ? (
              <div className="col-span-3 text-center text-stone-600/50 py-20 flex flex-col items-center gap-3">
                 <Truck className="w-12 h-12" /> No active hauling operations.
              </div>
            ) : myRequests.map(r => (
               <div key={r._id} className="relative group">
                 <FoodCard request={r} onDeliver={handleDeliver} userRole={user?.role} />
               </div>
            ))}
          </div>
        )}

        {tab === 'feedback' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Feedback & Complaints</h2>
              <button
                onClick={() => {
                  const deliveredRequests = myRequests.filter(r => r.status === 'delivered');
                  if (deliveredRequests.length === 0) {
                    showToast('No delivered requests to feedback on');
                    return;
                  }
                  openFeedbackModal(deliveredRequests[0]);
                }}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-lime-400 rounded-lg transition-colors border border-lime-500/30"
              >
                Submit Feedback
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center text-stone-600/50 py-20">No feedback submitted yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedbacks.map(feedback => (
                  <FeedbackDisplay
                    key={feedback._id}
                    feedback={feedback}
                    onResolve={handleResolveFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <FeedbackForm
            foodRequestId={selectedRequest._id}
            deliveryId={selectedRequest.deliveryId}
            facilityName={selectedRequest.donorDetails?.businessName || selectedRequest.donorId?.name || ''}
            onSubmit={handleFeedbackSubmit}
            onClose={() => setShowFeedbackModal(false)}
          />
        </div>
      )}
    </div>
  );
}
