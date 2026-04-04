import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Package, CheckCircle, TrendingUp, ShieldCheck, ShieldX, Search, MapPin, CalendarDays } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#3b82f6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [historyFilters, setHistoryFilters] = useState({
    donor: '',
    ngo: '',
    fromDate: '',
    toDate: '',
    location: '',
    search: '',
  });

  const donors = useMemo(() => {
    const seen = new Set();
    return requests.reduce((acc, request) => {
      const name = request.donorId?.name || request.donorDetails?.businessName || '';
      if (name && !seen.has(name)) {
        seen.add(name);
        acc.push(name);
      }
      return acc;
    }, []);
  }, [requests]);

  const ngos = useMemo(() => {
    const seen = new Set();
    return requests.reduce((acc, request) => {
      const ngo = request.acceptedBy?.name || '';
      if (ngo && !seen.has(ngo)) {
        seen.add(ngo);
        acc.push(ngo);
      }
      return acc;
    }, []);
  }, [requests]);

  const filteredHistory = useMemo(() => {
    const searchTerm = historyFilters.search.trim().toLowerCase();
    return requests.filter((request) => {
      const donorName = (request.donorId?.name || request.donorDetails?.businessName || '').toString().toLowerCase();
      const ngoName = (request.acceptedBy?.name || '').toString().toLowerCase();
      const locationText = (request.donorDetails?.pickupAddress || request.location?.address || '').toString().toLowerCase();
      const foodName = (request.foodName || request.foodType || '').toString().toLowerCase();
      const status = (request.status || '').toString().toLowerCase();
      const createdAt = request.createdAt ? new Date(request.createdAt) : null;

      const matchesDonor = historyFilters.donor ? donorName === historyFilters.donor.toLowerCase() : true;
      const matchesNgo = historyFilters.ngo ? ngoName === historyFilters.ngo.toLowerCase() : true;
      const matchesLocation = historyFilters.location ? locationText.includes(historyFilters.location.toLowerCase()) : true;
      const matchesSearch = searchTerm
        ? [donorName, ngoName, locationText, foodName, status].some((value) => value.includes(searchTerm))
        : true;
      const matchesFromDate = historyFilters.fromDate && createdAt ? createdAt >= new Date(historyFilters.fromDate) : true;
      const matchesToDate = historyFilters.toDate && createdAt ? createdAt <= new Date(`${historyFilters.toDate}T23:59:59`) : true;

      return matchesDonor && matchesNgo && matchesLocation && matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [requests, historyFilters]);

  const historyStats = useMemo(() => {
    const total = filteredHistory.length;
    const delivered = filteredHistory.filter((r) => r.status === 'delivered').length;
    const cancelled = filteredHistory.filter((r) => r.status === 'cancelled').length;
    const pending = filteredHistory.filter((r) => r.status === 'pending').length;
    return {
      total,
      delivered,
      cancelled,
      pending,
      chartData: [
        { name: 'Delivered', value: delivered },
        { name: 'Pending', value: pending },
        { name: 'Cancelled', value: cancelled },
      ],
    };
  }, [filteredHistory]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, reqRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/stats/users'),
        api.get('/requests/all'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRequests(reqRes.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (id, value) => {
    await api.patch(`/stats/users/${id}/verify`, { isVerified: value });
    fetchData();
  };

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-green-400/40">Loading dashboard...</div>;

  const pieData = stats?.categoryBreakdown?.map(c => ({ name: c._id, value: c.count })) || [];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-green-400/60 mt-1">Platform overview and management</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: stats?.totalRequests, icon: Package, color: 'text-blue-400' },
            { label: 'Meals Saved', value: stats?.mealsSaved, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Waste Diverted', value: `${stats?.wasteDiverted} kg`, icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Organizations', value: (stats?.ngoCount || 0) + (stats?.donorCount || 0), icon: Users, color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <div className="text-2xl font-black text-white">{value ?? '–'}</div>
              <div className="text-xs text-green-400/50">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-green-900/30 pb-4 flex-wrap">
          {['overview', 'history', 'users', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-green-600 text-white' : 'glass text-green-400/60 hover:text-green-400'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily trend */}
            <div className="glass p-5">
              <h3 className="font-bold text-white mb-4 text-sm">Requests – Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.dailyTrend || []}>
                  <XAxis dataKey="_id" tick={{ fill: '#4b7a5c', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#4b7a5c', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111916', border: '1px solid #1a2520', color: '#f0fdf4', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category pie */}
            <div className="glass p-5">
              <h3 className="font-bold text-white mb-4 text-sm">Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111916', border: '1px solid #1a2520', color: '#f0fdf4', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top donors */}
            <div className="glass p-5 md:col-span-2">
              <h3 className="font-bold text-white mb-4 text-sm">Top Donors</h3>
              <div className="flex flex-col gap-2">
                {(stats?.topDonors || []).map((d, i) => (
                  <div key={d._id} className="flex items-center justify-between py-2 border-b border-green-900/20 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-400/40 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm text-white font-medium">{d.name}</p>
                        <p className="text-xs text-green-400/50">{d.email}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-amber-400">{d.impactScore} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="space-y-6">
            <div className="glass p-5 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              <div>
                <h3 className="font-bold text-white text-xl">Donation History</h3>
                <p className="text-green-400/60 mt-2 text-sm">Review all past donations, filter by donor, NGO, date or location, and track delivery success.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400/50">Total donations</p>
                  <p className="text-3xl font-black text-white mt-2">{historyStats.total}</p>
                </div>
                <div className="glass p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400/50">Successful deliveries</p>
                  <p className="text-3xl font-black text-white mt-2">{historyStats.delivered}</p>
                </div>
                <div className="glass p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400/50">Complaints</p>
                  <p className="text-3xl font-black text-white mt-2">{historyStats.cancelled}</p>
                </div>
                <div className="glass p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400/50">Pending review</p>
                  <p className="text-3xl font-black text-white mt-2">{historyStats.pending}</p>
                </div>
              </div>
            </div>

            <div className="glass p-5">
              <div className="grid gap-4 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <label className="block text-xs text-green-400/70 mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-green-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={historyFilters.search}
                      onChange={(e) => setHistoryFilters((prev) => ({ ...prev, search: e.target.value }))}
                      placeholder="Search donor, NGO, food, location"
                      className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-11 py-3 text-sm text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-green-400/70 mb-2">Donor</label>
                  <select
                    value={historyFilters.donor}
                    onChange={(e) => setHistoryFilters((prev) => ({ ...prev, donor: e.target.value }))}
                    className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="">All donors</option>
                    {donors.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-green-400/70 mb-2">NGO</label>
                  <select
                    value={historyFilters.ngo}
                    onChange={(e) => setHistoryFilters((prev) => ({ ...prev, ngo: e.target.value }))}
                    className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="">All NGOs</option>
                    {ngos.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-green-400/70 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-green-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={historyFilters.location}
                      onChange={(e) => setHistoryFilters((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Filter by pickup address"
                      className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-11 py-3 text-sm text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-green-400/70 mb-2">From</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-green-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={historyFilters.fromDate}
                      onChange={(e) => setHistoryFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                      className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-11 py-3 text-sm text-white outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-green-400/70 mb-2">To</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-green-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={historyFilters.toDate}
                      onChange={(e) => setHistoryFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                      className="w-full rounded-2xl border border-green-900/50 bg-black/20 px-11 py-3 text-sm text-white outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="glass overflow-hidden">
                <div className="px-6 py-4 border-b border-green-900/30 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-bold text-white">Filtered donations ({filteredHistory.length})</h2>
                    <p className="text-green-400/60 text-sm">Showing all past donations with active search and filter controls.</p>
                  </div>
                  <button
                    onClick={() => setHistoryFilters({ donor: '', ngo: '', fromDate: '', toDate: '', location: '', search: '' })}
                    className="text-sm px-4 py-2 rounded-full bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-all"
                  >
                    Clear filters
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-900/20 text-green-400/50 text-xs">
                        <th className="px-4 py-3 text-left">Food</th>
                        <th className="px-4 py-3 text-left">Donor</th>
                        <th className="px-4 py-3 text-left">NGO</th>
                        <th className="px-4 py-3 text-left">Qty</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((r) => (
                        <tr key={r._id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                          <td className="px-4 py-3 text-white">{r.foodName || r.foodType}</td>
                          <td className="px-4 py-3 text-green-400/60">{r.donorId?.name || r.donorDetails?.businessName || '–'}</td>
                          <td className="px-4 py-3 text-green-400/60">{r.acceptedBy?.name || '–'}</td>
                          <td className="px-4 py-3 text-green-400/70">{r.quantity} {r.quantityUnit}</td>
                          <td className="px-4 py-3 text-green-400/50">{r.donorDetails?.pickupAddress || r.location?.address || '–'}</td>
                          <td className="px-4 py-3"><StatusBadge type="status" value={r.status} /></td>
                          <td className="px-4 py-3 text-green-400/40">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td className="px-4 py-10 text-center text-green-400/60" colSpan={7}>No matching donations found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="font-bold text-white mb-4 text-sm">History analytics</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={historyStats.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} label>
                        {historyStats.chartData.map((entry, i) => (
                          <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#111916', border: '1px solid #1a2520', color: '#f0fdf4', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-green-900/30">
              <h2 className="font-bold text-white">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-900/20 text-green-400/50 text-xs">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Verified</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-4 py-3 text-white">{u.name}</td>
                      <td className="px-4 py-3 text-green-400/60">{u.email}</td>
                      <td className="px-4 py-3 capitalize">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/20 border border-green-900/30 text-green-300">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isVerified
                          ? <span className="text-green-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Yes</span>
                          : <span className="text-yellow-400/70 flex items-center gap-1"><ShieldX className="w-3.5 h-3.5" /> No</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {(u.role === 'ngo' || u.role === 'animal_shelter') && (
                          <button
                            onClick={() => handleVerify(u._id, !u.isVerified)}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${u.isVerified ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                          >
                            {u.isVerified ? 'Revoke' : 'Verify'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests */}
        {tab === 'requests' && (
          <div className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-green-900/30">
              <h2 className="font-bold text-white">All Requests ({requests.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-900/20 text-green-400/50 text-xs">
                    <th className="px-4 py-3 text-left">Food</th>
                    <th className="px-4 py-3 text-left">Donor</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-4 py-3 text-white">{r.foodType}</td>
                      <td className="px-4 py-3 text-green-400/60">{r.donorId?.name || '–'}</td>
                      <td className="px-4 py-3 text-green-400/70">{r.quantity}</td>
                      <td className="px-4 py-3"><StatusBadge type="category" value={r.category} /></td>
                      <td className="px-4 py-3"><StatusBadge type="status" value={r.status} /></td>
                      <td className="px-4 py-3 text-green-400/40">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
