import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Package, Clock, MapPin, Zap, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const urgencyOpts = ['low', 'medium', 'high'];

export default function DonorDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    foodType: '', quantity: '', shelfLifeHours: '', urgency: 'medium',
    lat: user?.location?.lat || '', lng: user?.location?.lng || '',
    address: '', notes: '',
  });

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests/my');
      setRequests(data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/requests', {
        foodType: form.foodType,
        quantity: parseFloat(form.quantity),
        shelfLifeHours: parseFloat(form.shelfLifeHours),
        urgency: form.urgency,
        location: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0, address: form.address },
        notes: form.notes,
      });
      setSuccess('Food request posted successfully!');
      setShowForm(false);
      setForm({ foodType: '', quantity: '', shelfLifeHours: '', urgency: 'medium', lat: user?.location?.lat || '', lng: user?.location?.lng || '', address: '', notes: '' });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post request');
    } finally { setSubmitting(false); }
  };

  const stats = {
    total: requests.length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    pending: requests.filter(r => r.status === 'pending').length,
    impact: user?.impactScore || 0,
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white">Donor Dashboard</h1>
            <p className="text-green-400/60 mt-1">Welcome back, <span className="text-green-400">{user?.name}</span></p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Post Food
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Posts', value: stats.total, icon: Package, color: 'text-blue-400' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
            { label: 'Impact Score', value: stats.impact, icon: TrendingUp, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-green-400/50">{label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {success && <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm mb-6"><CheckCircle className="w-4 h-4" />{success}</div>}
        {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}

        {/* Post Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="glass p-6 mb-8 fade-in">
            <h2 className="text-lg font-bold text-white mb-5">New Food Request</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Food Type</label>
                <input value={form.foodType} onChange={e => setForm({...form, foodType: e.target.value})} required
                  placeholder="e.g. Biryani, Bread..."
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Quantity (kg/servings)</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Shelf Life (hours)</label>
                <input type="number" min="0.5" step="0.5" value={form.shelfLifeHours} onChange={e => setForm({...form, shelfLifeHours: e.target.value})} required
                  placeholder="e.g. 6"
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Urgency</label>
                <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                  {urgencyOpts.map(o => <option key={o} value={o} className="bg-[#0a0f0d]">{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Latitude</label>
                <input value={form.lat} onChange={e => setForm({...form, lat: e.target.value})}
                  placeholder="28.6139"
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Longitude</label>
                <input value={form.lng} onChange={e => setForm({...form, lng: e.target.value})}
                  placeholder="77.2090"
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-green-400/60 mb-1.5 block">Address (optional)</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="e.g. Connaught Place, Delhi"
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-green-400/60 mb-1.5 block">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                  placeholder="Any additional info..."
                  className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-medium transition-all text-sm">
                {submitting ? 'Posting...' : 'Post Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 glass hover:border-green-500/30 text-green-300 rounded-lg font-medium transition-all text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Requests Table */}
        <div className="glass overflow-hidden">
          <div className="px-6 py-4 border-b border-green-900/30">
            <h2 className="font-bold text-white">My Food Requests</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-green-400/40">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-green-400/40">No requests yet. Post your first food donation!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-900/20 text-green-400/50 text-xs">
                    <th className="px-4 py-3 text-left font-medium">Food Type</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Shelf Life</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Urgency</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{r.foodType}</td>
                      <td className="px-4 py-3 text-green-400/70">{r.quantity}</td>
                      <td className="px-4 py-3 text-green-400/70">{r.shelfLifeHours}h</td>
                      <td className="px-4 py-3"><StatusBadge type="category" value={r.category} /></td>
                      <td className="px-4 py-3"><StatusBadge type="status" value={r.status} /></td>
                      <td className="px-4 py-3 capitalize text-green-400/60">{r.urgency}</td>
                      <td className="px-4 py-3 text-green-400/40">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
