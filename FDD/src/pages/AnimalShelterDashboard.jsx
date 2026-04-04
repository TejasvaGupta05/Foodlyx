import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Package, Truck, AlertTriangle, MessageSquare } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AnimalShelterDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default filter focuses strictly on semi-edible and non-edible food types
  const [filters, setFilters] = useState({ category: 'semi_edible', urgency: '' });
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
      if (filters.urgency) params.set('urgency', filters.urgency);
      
      const { data } = await api.get(`/requests?${params}`);
      
      // Client-side filtering logic to showcase food that is potentially dangerous for humans but fine for animals/compost
      let filtered = data;
      if(filters.category === 'semi_edible') {
         filtered = data.filter(d => ['dry_food', 'perishable_food'].includes(d.category));
      }
      setRequests(filtered);

      const myData = await api.get('/requests/my');
      setMyRequests(myData.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get(`/feedback/receiver/${user?._id}`);
      setFeedbacks(data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  useEffect(() => { fetchRequests(); fetchFeedbacks(); }, [filters]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/requests/${id}/accept`);
      showToast('Pickup route accepted!');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await api.patch(`/requests/${id}/deliver`);
      showToast('Delivered to Shelter!');
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
    <ProtectedRoute>
      <div className="min-h-screen pt-20 pb-16 px-4 hero-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header - Amber styling to differentiate from green NGO */}
        <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl glass">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
             </div>
             <h1 className="text-3xl font-black text-white">Shelter Intake</h1>
          </div>
          <p className="text-amber-400/60 mt-1 ml-13">
            {user?.name}
            {!user?.isVerified && <span className="ml-2 text-yellow-400 text-xs">(Pending verification)</span>}
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 px-4 py-3 bg-amber-600 text-white text-sm rounded-lg shadow-lg fade-in">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-amber-900/30 pb-4">
          {['available calls', 'active pickups', 'feedback'].map(t => {
            const mappedTab = t === 'available calls' ? 'available' : t === 'active pickups' ? 'accepted' : 'feedback';
            return (
               <button key={t} onClick={() => setTab(mappedTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${tab === mappedTab ? 'bg-amber-600 text-white' : 'glass text-amber-400/60 hover:text-amber-400'}`}>
                  {t === 'feedback' && <MessageSquare className="w-4 h-4" />}
                  {t}
               </button>
            )
          })}
        </div>

        {tab === 'available' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2 bg-amber-900/10 border border-amber-900/40 rounded-lg text-amber-300 text-sm focus:outline-none focus:border-amber-500/50">
                <option value="all">All Food Safety Levels</option>
                <option value="semi_edible">Only Semi-Edible Food (Animal Safe)</option>
              </select>
              <select value={filters.urgency} onChange={e => setFilters({...filters, urgency: e.target.value})}
                className="px-4 py-2 bg-amber-900/10 border border-amber-900/40 rounded-lg text-amber-300 text-sm focus:outline-none focus:border-amber-500/50">
                <option value="">All Urgencies</option>
                <option value="high">High (Spoiling Soon)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center text-amber-400/40 py-20 animate-pulse">Scanning radars...</div>
            ) : requests.length === 0 ? (
              <div className="text-center text-amber-400/40 py-20">No suitable un-edible batches in your perimeter.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map(r => (
                  <div key={r._id} className="relative">
                     <FoodCard request={r} onAccept={handleAccept} userRole={user?.role} />
                     <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] uppercase font-bold px-2 py-1 rounded-full shadow-lg border border-amber-300">Animal Grade</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'accepted' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRequests.length === 0 ? (
              <div className="col-span-3 text-center text-amber-400/40 py-20">No active pickup routes.</div>
            ) : myRequests.map(r => (
              <FoodCard key={r._id} request={r} onDeliver={handleDeliver} userRole={user?.role} />
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                Submit Feedback
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center text-amber-400/40 py-20">No feedback submitted yet.</div>
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
    </ProtectedRoute>
  );
}
