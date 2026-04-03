import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { Filter, MapPin, Package, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import FoodCard from '../components/FoodCard';

export default function NGODashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', urgency: '' });
  const [tab, setTab] = useState('available');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.urgency) params.set('urgency', filters.urgency);
      const { data } = await api.get(`/requests?${params}`);
      setRequests(data);

      const myData = await api.get('/requests/all');
      setMyRequests(myData.data.filter(r => r.acceptedBy?._id === user?._id || r.acceptedBy === user?._id));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [filters]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_request', (req) => {
      setRequests((prev) => [req, ...prev]);
      showToast(`New request: ${req.foodType}`);
    });
    socket.on('request_updated', () => fetchRequests());
    return () => { socket.off('new_request'); socket.off('request_updated'); };
  }, [socket]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/requests/${id}/accept`);
      showToast('Request accepted!');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await api.patch(`/requests/${id}/deliver`);
      showToast('Marked as delivered!');
      fetchRequests();
    } catch { }
  };

  return (
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

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 px-4 py-3 bg-green-600 text-white text-sm rounded-lg shadow-lg fade-in">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-green-900/30 pb-4">
          {['available', 'accepted'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-green-600 text-white' : 'glass text-green-400/60 hover:text-green-400'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'available' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
                className="px-4 py-2 bg-green-900/10 border border-green-900/40 rounded-lg text-green-300 text-sm focus:outline-none focus:border-green-500/50">
                <option value="">All Categories</option>
                <option value="edible">Edible</option>
                <option value="semi_edible">Semi-Edible</option>
                <option value="non_edible">Non-Edible</option>
              </select>
              <select value={filters.urgency} onChange={e => setFilters({...filters, urgency: e.target.value})}
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
              <div className="text-center text-green-400/40 py-20">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center text-green-400/40 py-20">No available requests matching filters.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map(r => (
                  <FoodCard key={r._id} request={r} onAccept={handleAccept} userRole={user?.role} />
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
              <FoodCard key={r._id} request={r} onDeliver={handleDeliver} userRole={user?.role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
