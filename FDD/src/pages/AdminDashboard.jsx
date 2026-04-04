import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Package, CheckCircle, TrendingUp, ShieldCheck, ShieldX,
  Search, MapPin, CalendarDays, BarChart2, Clock, AlertCircle
} from 'lucide-react';

// ── Color palette ──────────────────────────────────────────────────────────
const CHART_COLORS = ['#22C55E', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

// ── Warm status pill ───────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   { bg: '#FEF3C7', text: '#D97706' },
  accepted:  { bg: '#DBEAFE', text: '#2563EB' },
  delivered: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.text }}>{status}</span>
  );
}

// ── Warm input style ───────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all";
const inputStyle = { background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' };

const TABS = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'requests', label: '🍱 Requests' },
  { key: 'history',  label: '📋 History'  },
  { key: 'users',    label: '👥 Users'    },
];

const ROLE_PILL = {
  donor:          { bg: '#DCFCE7', text: '#16A34A' },
  ngo:            { bg: '#DBEAFE', text: '#2563EB' },
  animal_shelter: { bg: '#FEF3C7', text: '#D97706' },
  compost_unit:   { bg: '#ECFDF5', text: '#059669' },
  admin:          { bg: '#F3E8FF', text: '#9333EA' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers]       = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');
  const [search, setSearch]     = useState('');
  const [historyFilters, setHistoryFilters] = useState({ donor: '', ngo: '', fromDate: '', toDate: '', location: '' });
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Firestore listeners ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('Users listener:', err.message));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'foodRequests'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRequests(data);
      setLoading(false);
    }, err => { console.warn('Requests listener:', err.message); setLoading(false); });
    return () => unsub();
  }, []);

  // ── Computed stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = requests.length;
    const delivered  = requests.filter(r => r.status === 'delivered').length;
    const pending    = requests.filter(r => r.status === 'pending').length;
    const accepted   = requests.filter(r => r.status === 'accepted').length;
    const totalQty   = requests.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
    const donors     = users.filter(u => u.role === 'donor').length;
    const ngos       = users.filter(u => u.role === 'ngo').length;
    const shelters   = users.filter(u => u.role === 'animal_shelter').length;
    const compost    = users.filter(u => u.role === 'compost_unit').length;

    // Daily trend (last 7 days)
    const dayMap = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dayMap[key] = 0;
    }
    requests.forEach(r => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt ? new Date(r.createdAt) : null;
      if (!d) return;
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dayMap[key] !== undefined) dayMap[key]++;
    });
    const dailyTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // Category breakdown
    const catMap = {};
    requests.forEach(r => {
      const cat = r.foodUsabilityCategory || r.foodCategory || 'other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

    // Status breakdown
    const statusData = [
      { name: 'Delivered', value: delivered },
      { name: 'Pending',   value: pending   },
      { name: 'Accepted',  value: accepted  },
      { name: 'Cancelled', value: requests.filter(r => r.status === 'cancelled').length },
    ].filter(d => d.value > 0);

    // Top donors by impactScore
    const topDonors = [...users].filter(u => u.role === 'donor').sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0)).slice(0, 5);

    return { total, delivered, pending, accepted, totalQty: totalQty.toFixed(0), donors, ngos, shelters, compost, dailyTrend, categoryData, statusData, topDonors };
  }, [requests, users]);

  // ── Filtered history ───────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    const s = search.toLowerCase();
    return requests.filter(r => {
      const donor   = (r.donorName || r.donorBusinessName || '').toLowerCase();
      const ngo     = (r.acceptedByName || '').toLowerCase();
      const loc     = (r.location?.address || r.pickupAddress || '').toLowerCase();
      const food    = (r.foodName || r.foodType || '').toLowerCase();
      const date    = r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt ? new Date(r.createdAt) : null;

      const matchSearch = s ? [donor, ngo, loc, food, r.status].some(v => v.includes(s)) : true;
      const matchDonor  = historyFilters.donor ? donor.includes(historyFilters.donor.toLowerCase()) : true;
      const matchNgo    = historyFilters.ngo   ? ngo.includes(historyFilters.ngo.toLowerCase())     : true;
      const matchLoc    = historyFilters.location ? loc.includes(historyFilters.location.toLowerCase()) : true;
      const matchFrom   = historyFilters.fromDate && date ? date >= new Date(historyFilters.fromDate) : true;
      const matchTo     = historyFilters.toDate   && date ? date <= new Date(`${historyFilters.toDate}T23:59:59`) : true;
      return matchSearch && matchDonor && matchNgo && matchLoc && matchFrom && matchTo;
    });
  }, [requests, search, historyFilters]);

  // ── User verify ────────────────────────────────────────────────────────
  const handleVerify = async (uid, value) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: value });
      showToast(value ? '✅ User verified!' : '❌ Verification revoked.');
    } catch (err) { showToast('Error: ' + err.message); }
  };

  // ── Filtered users ─────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.role || '').toLowerCase().includes(s));
  }, [users, search]);

  if (loading) return (
    <div className="warm-page min-h-screen flex items-center justify-center pt-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
        <p className="text-sm" style={{ color: '#64748B' }}>Loading admin dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="warm-page min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg fade-in"
            style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' }}>
            {toast}
          </div>
        )}

        {/* ── Header ── */}
        <div className="mb-8">
          <span className="warm-badge mb-3 inline-flex" style={{ background: '#F3E8FF', color: '#9333EA' }}>
            🛡️ Admin Portal
          </span>
          <h1 className="text-4xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Admin Dashboard
          </h1>
          <p className="text-base" style={{ color: '#64748B' }}>
            Full platform oversight · Logged in as <span className="font-semibold" style={{ color: '#9333EA' }}>{user?.name || user?.email}</span>
          </p>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: stats.total,      emoji: '📦', color: '#3B82F6', bg: '#DBEAFE' },
            { label: 'Delivered',      value: stats.delivered,  emoji: '✅', color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Pending',        value: stats.pending,    emoji: '⏳', color: '#D97706', bg: '#FEF3C7' },
            { label: 'Food Qty (kg)',  value: stats.totalQty,   emoji: '🍽️', color: '#F59E0B', bg: '#FEF3C7' },
          ].map(({ label, value, emoji, color, bg }) => (
            <div key={label} className="warm-card p-5 text-center hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: bg }}>{emoji}</div>
              <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── User breakdown ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Donors',    value: stats.donors,   emoji: '🍱', color: '#16A34A', bg: '#DCFCE7' },
            { label: 'NGOs',      value: stats.ngos,     emoji: '🤝', color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Shelters',  value: stats.shelters, emoji: '🐾', color: '#D97706', bg: '#FEF3C7' },
            { label: 'Compost',   value: stats.compost,  emoji: '♻️', color: '#059669', bg: '#ECFDF5' },
          ].map(({ label, value, emoji, color, bg }) => (
            <div key={label} className="warm-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>{emoji}</div>
              <div>
                <div className="text-2xl font-black" style={{ color }}>{value}</div>
                <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: tab === key ? '#9333EA' : '#FFFFFF',
                color: tab === key ? '#FFFFFF' : '#64748B',
                border: tab === key ? '2px solid #9333EA' : '2px solid #F1F5F9',
                boxShadow: tab === key ? '0 4px 12px rgba(147,51,234,0.2)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily trend chart */}
            <div className="warm-card p-6">
              <h3 className="font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#1C2B22' }}>
                <BarChart2 className="w-4 h-4" style={{ color: '#22C55E' }} /> Requests — Last 7 Days
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.dailyTrend}>
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, color: '#1C2B22', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: '#F0FDF4' }}
                  />
                  <Bar dataKey="count" fill="#22C55E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie chart */}
            <div className="warm-card p-6">
              <h3 className="font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#1C2B22' }}>
                <Package className="w-4 h-4" style={{ color: '#F59E0B' }} /> Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={3}>
                    {stats.statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category pie chart */}
            <div className="warm-card p-6">
              <h3 className="font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#1C2B22' }}>
                🌿 Category Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                    {stats.categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#64748B' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top donors */}
            <div className="warm-card p-6">
              <h3 className="font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#1C2B22' }}>
                ⭐ Top Donors by Impact
              </h3>
              <div className="flex flex-col gap-3">
                {stats.topDonors.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: '#94A3B8' }}>No donor data yet.</p>
                ) : stats.topDonors.map((d, i) => (
                  <div key={d.id || i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#D97706' }}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#1C2B22' }}>{d.name || 'Anonymous'}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{d.email}</p>
                      </div>
                    </div>
                    <span className="font-black text-sm" style={{ color: '#F59E0B' }}>{d.impactScore || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ REQUESTS TAB ══ */}
        {tab === 'requests' && (
          <div className="warm-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h2 className="font-black text-lg" style={{ color: '#1C2B22' }}>All Food Requests</h2>
                <p className="text-sm" style={{ color: '#64748B' }}>{requests.length} total across all donors</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search food, donor, city..."
                  className={`${inputCls} pl-10 pr-4 w-64`} style={inputStyle} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['Food', 'Donor', 'Qty', 'Category', 'Status', 'Accepted By', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(search ? requests.filter(r => {
                    const s = search.toLowerCase();
                    return [(r.foodName || r.foodType || ''), (r.donorName || ''), (r.location?.address || '')].some(v => v.toLowerCase().includes(s));
                  }) : requests).slice(0, 100).map((r, i) => (
                    <tr key={r.id} className="transition-colors hover:bg-green-50"
                      style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-sm" style={{ color: '#1C2B22' }}>{r.foodName || r.foodType || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#64748B' }}>
                        {r.donorName || r.donorBusinessName || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#334155' }}>
                        {r.quantity} {r.quantityUnit || 'kg'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>
                          {(r.foodUsabilityCategory || r.foodCategory || '—').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#94A3B8' }}>{r.acceptedByName || '—'}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: '#94A3B8' }}>
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && (
                <div className="p-16 text-center">
                  <div className="text-5xl mb-4">🍱</div>
                  <p className="font-bold text-lg mb-1" style={{ color: '#1C2B22' }}>No requests yet</p>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>Once donors post food, all requests will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {tab === 'history' && (
          <div className="space-y-5">
            {/* History mini-stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'All Donations',  value: filteredHistory.length,                                    emoji: '📦', color: '#3B82F6', bg: '#DBEAFE' },
                { label: 'Delivered',      value: filteredHistory.filter(r => r.status === 'delivered').length, emoji: '✅', color: '#16A34A', bg: '#DCFCE7' },
                { label: 'Pending Review', value: filteredHistory.filter(r => r.status === 'pending').length,   emoji: '⏳', color: '#D97706', bg: '#FEF3C7' },
                { label: 'Cancelled',      value: filteredHistory.filter(r => r.status === 'cancelled').length, emoji: '❌', color: '#EF4444', bg: '#FEF2F2' },
              ].map(({ label, value, emoji, color, bg }) => (
                <div key={label} className="warm-card p-4 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-2" style={{ background: bg }}>{emoji}</div>
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="warm-card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: '#1C2B22' }}>Filter Donation History</h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Donor, NGO, food, status..."
                      className={`${inputCls} pl-10 pr-4`} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Donor name</label>
                  <input value={historyFilters.donor} onChange={e => setHistoryFilters(p => ({ ...p, donor: e.target.value }))}
                    placeholder="Filter by donor" className={`${inputCls} px-4`} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>NGO name</label>
                  <input value={historyFilters.ngo} onChange={e => setHistoryFilters(p => ({ ...p, ngo: e.target.value }))}
                    placeholder="Filter by NGO" className={`${inputCls} px-4`} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                    <input value={historyFilters.location} onChange={e => setHistoryFilters(p => ({ ...p, location: e.target.value }))}
                      placeholder="City or address" className={`${inputCls} pl-10 pr-4`} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>From date</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                    <input type="date" value={historyFilters.fromDate} onChange={e => setHistoryFilters(p => ({ ...p, fromDate: e.target.value }))}
                      className={`${inputCls} pl-10 pr-4`} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>To date</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                    <input type="date" value={historyFilters.toDate} onChange={e => setHistoryFilters(p => ({ ...p, toDate: e.target.value }))}
                      className={`${inputCls} pl-10 pr-4`} style={inputStyle} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSearch(''); setHistoryFilters({ donor: '', ngo: '', fromDate: '', toDate: '', location: '' }); }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                ✕ Clear all filters
              </button>
            </div>

            {/* History table */}
            <div className="warm-card overflow-hidden">
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <h2 className="font-black text-lg" style={{ color: '#1C2B22' }}>Filtered Results ({filteredHistory.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['Food', 'Donor', 'NGO', 'Qty', 'Location', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 200).map((r, i) => (
                      <tr key={r.id} className="transition-colors hover:bg-purple-50" style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td className="px-5 py-3.5 font-bold text-sm" style={{ color: '#1C2B22' }}>{r.foodName || r.foodType || '—'}</td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: '#64748B' }}>{r.donorName || r.donorBusinessName || '—'}</td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: '#64748B' }}>{r.acceptedByName || '—'}</td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: '#334155' }}>{r.quantity} {r.quantityUnit || 'kg'}</td>
                        <td className="px-5 py-3.5 text-xs max-w-[140px] truncate" style={{ color: '#94A3B8' }}>{r.location?.address || r.pickupAddress || '—'}</td>
                        <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: '#94A3B8' }}>
                          {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>No matching records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {tab === 'users' && (
          <div className="warm-card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h2 className="font-black text-lg" style={{ color: '#1C2B22' }}>All Users</h2>
                <p className="text-sm" style={{ color: '#64748B' }}>{users.length} registered accounts</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, role..."
                  className={`${inputCls} pl-10 pr-4 w-64`} style={inputStyle} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['Name', 'Email', 'Role', 'Verified', 'Subscribed', 'Impact', 'Action'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const rp = ROLE_PILL[u.role] || { bg: '#F1F5F9', text: '#64748B' };
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-purple-50" style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-sm" style={{ color: '#1C2B22' }}>{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: '#64748B' }}>{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: rp.bg, color: rp.text }}>
                            {(u.role || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.isVerified
                            ? <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#16A34A' }}><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
                            : <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#D97706' }}><ShieldX className="w-3.5 h-3.5" /> Pending</span>
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          {u.isSubscribed
                            ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>Active</span>
                            : <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#F1F5F9', color: '#94A3B8' }}>None</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 font-bold text-sm" style={{ color: '#F59E0B' }}>
                          {u.impactScore || 0} pts
                        </td>
                        <td className="px-5 py-3.5">
                          {(u.role === 'ngo' || u.role === 'animal_shelter' || u.role === 'compost_unit') && (
                            <button
                              onClick={() => handleVerify(u.id, !u.isVerified)}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:-translate-y-0.5"
                              style={u.isVerified
                                ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
                                : { background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' }}>
                              {u.isVerified ? '× Revoke' : '✓ Verify'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>No users match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
