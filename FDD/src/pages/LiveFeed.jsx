import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import FoodCard from '../components/FoodCard';

export default function LiveFeed() {
  const { socket, connected } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', urgency: '' });
  const [newCount, setNewCount] = useState(0);

  const fetchAll = async () => {
    try {
      const params = new URLSearchParams({ status: 'pending' });
      if (filters.category) params.set('category', filters.category);
      const { data } = await api.get(`/requests?${params}`);
      
      // Client-side filtering for urgency since it's not implemented in firebase-api
      let filteredData = data;
      if (filters.urgency) {
        filteredData = data.filter(req => req.urgency === filters.urgency);
      }
      
      setRequests(filteredData);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filters]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_request', (req) => {
      setRequests((prev) => [req, ...prev]);
      setNewCount((n) => n + 1);
      setTimeout(() => setNewCount((n) => Math.max(0, n - 1)), 5000);
    });
    socket.on('request_updated', () => fetchAll());
    return () => { socket.off('new_request'); socket.off('request_updated'); };
  }, [socket, filters]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-green-400 animate-pulse" />
            <div>
              <h1 className="text-3xl font-black text-white">Live Feed</h1>
              <p className="text-green-400/60 text-sm mt-0.5">Real-time food redistribution requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full fade-in">
                +{newCount} new
              </span>
            )}
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${connected ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

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
          <div className="text-center text-green-400/40 py-20">Loading feed...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-green-400/40 py-20">No active food requests right now.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map(r => (
              <FoodCard key={r._id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
