import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { Radio, Wifi, Filter, X } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import plate2 from '../assets/graphics/Food_Plate_Graphic2.png';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'human_edible', label: '🧑 Human Edible' },
  { value: 'animal_edible', label: '🐾 Animal Edible' },
  { value: 'fertilizer_compost', label: '🌿 Compost' },
  { value: 'fresh_food', label: '🥬 Fresh Food' },
  { value: 'perishable_food', label: '⏰ Perishable' },
];

const URGENCIES = [
  { value: '', label: 'All Urgencies' },
  { value: 'high',   label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low',    label: '🟢 Low' },
];

export default function LiveFeed() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ category: '', urgency: '' });

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'foodRequests'),
      where('status', '==', 'pending'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() || (a.createdAt?.seconds * 1000) || 0;
        const bt = b.createdAt?.toMillis?.() || (b.createdAt?.seconds * 1000) || 0;
        return bt - at;
      });
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

  const hasFilters = filters.category || filters.urgency;

  return (
    <div className="warm-page min-h-screen pt-20 pb-16 relative overflow-hidden">
      {/* Decorative plate */}
      <img src={plate2} alt="" className="absolute right-0 top-24 w-40 h-40 object-contain opacity-10 animate-float-1 pointer-events-none hidden lg:block" />

      <div className="max-w-6xl mx-auto px-6">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#22C55E' }}>Live Updates</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
                Food Donation Feed
              </h1>
              <p className="mt-2 text-base" style={{ color: '#64748B' }}>
                Real-time food redistribution requests from donors near you
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
              <Wifi className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
              <span className="text-xs font-bold" style={{ color: '#16A34A' }}>LIVE</span>
              <span className="text-xs" style={{ color: '#64748B' }}>· {requests.length} active requests</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#64748B' }}>
            <Filter className="w-4 h-4" /> Filter:
          </div>

          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, category: value })}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: filters.category === value ? '#22C55E' : '#FFFFFF',
                color: filters.category === value ? '#FFFFFF' : '#334155',
                border: `1.5px solid ${filters.category === value ? '#22C55E' : '#E2E8F0'}`,
                boxShadow: filters.category === value ? '0 4px 12px rgba(34,197,94,0.25)' : 'none',
              }}
            >
              {label}
            </button>
          ))}

          <div className="w-px h-6" style={{ background: '#E2E8F0' }} />

          {URGENCIES.slice(1).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, urgency: filters.urgency === value ? '' : value })}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: filters.urgency === value ? '#F59E0B' : '#FFFFFF',
                color: filters.urgency === value ? '#FFFFFF' : '#334155',
                border: `1.5px solid ${filters.urgency === value ? '#F59E0B' : '#E2E8F0'}`,
              }}
            >
              {label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => setFilters({ category: '', urgency: '' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all"
              style={{ background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA' }}
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Feed content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-500 animate-spin mb-4" />
            <p className="text-sm" style={{ color: '#64748B' }}>Loading live feed...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#1C2B22' }}>No active requests right now</h3>
            <p className="text-sm" style={{ color: '#64748B' }}>
              {hasFilters ? 'Try removing filters to see more results.' : 'Check back soon — donors post food throughout the day.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {requests.map((r) => (
              <FoodCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
