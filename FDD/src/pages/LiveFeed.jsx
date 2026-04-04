import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import FoodCard from '../components/FoodCard';

export default function LiveFeed() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', urgency: '' });

  useEffect(() => {
    setLoading(true);
    // Simple query - only filter by status to avoid needing composite index
    const q = query(
      collection(db, 'foodRequests'),
      where('status', '==', 'pending'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort client-side to avoid composite index requirement
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bt = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bt - at;
      });

      // Client-side filtering
      if (filters.category) data = data.filter(r =>
        r.foodUsabilityCategory === filters.category ||
        r.foodCategory === filters.category ||
        r.category === filters.category
      );
      if (filters.urgency) data = data.filter(r => r.urgency === filters.urgency);

      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.warn('LiveFeed error:', err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [filters]);

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
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10">
              <Wifi className="w-3 h-3" /> Live
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}
            className="px-4 py-2 bg-green-900/10 border border-green-900/40 rounded-lg text-green-300 text-sm focus:outline-none focus:border-green-500/50">
            <option value="">All Categories</option>
            <option value="human_edible">Human Edible</option>
            <option value="animal_edible">Animal Edible</option>
            <option value="fertilizer_compost">Compost</option>
            <option value="fresh_food">Fresh Food</option>
            <option value="perishable_food">Perishable</option>
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
          <div className="text-center text-green-400/40 py-20 animate-pulse">Loading feed...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-green-400/40 py-20">No active food requests right now. 🌱</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map(r => (
              <FoodCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
