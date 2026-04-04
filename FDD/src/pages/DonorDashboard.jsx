import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Plus, Package, Clock, MapPin, Zap, TrendingUp, CheckCircle, AlertCircle, Upload, Image as ImageIcon, MessageSquare } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import FeedbackDisplay from '../components/FeedbackDisplay';

const urgencyOpts = ['low', 'medium', 'high'];

export default function DonorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, impact: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [form, setForm] = useState({
    donorCategory: user?.donorCategory || 'individual',
    donorBusinessName: user?.name || '',
    donorContactPhone: user?.contactPhone || '',
    pickupAddress: user?.address || '',

    foodType: 'dal_roti',
    foodName: '',
    quantity: '',
    quantityUnit: 'kg',
    foodCategory: 'fresh_food',
    preparationDate: '',
    preparationTime: '',
    storageCondition: 'room_temperature',
    foodUsabilityCategory: 'human_edible',
    foodImage: '',
    foodImagePreview: '',
    safeConsumptionUntil: '',

    lat: user?.location?.lat || '',
    lng: user?.location?.lng || '',
    notes: '',
  });
  const [qualityResult, setQualityResult] = useState({ status: '', recommendation: '' });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchRequests = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/requests/my');
      setRequests(data);
    } catch { } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats');
      // Calculate donor-specific stats from the global stats
      const userRequests = requests.filter(
        (r) => r.donorId === user?.uid || r.donorId?.uid === user?.uid
      );
      const total = userRequests.length;
      const delivered = userRequests.filter(r => r.status === 'delivered').length;
      const pending = userRequests.filter(r => r.status === 'pending').length;
      const impact = user?.impactScore || 0;

      setStats({ total, delivered, pending, impact });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set default stats if fetch fails
      setStats({ total: 0, delivered: 0, pending: 0, impact: user?.impactScore || 0 });
    }
  };

  const fetchFeedbacks = async () => {
    if (!user?.uid) return;
    try {
      const { data } = await api.get(`/feedback/donor/${user.uid}`);
      setFeedbacks(data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  // Real-time listener for this donor's food requests
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'foodRequests'),
      where('donorUid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest first client-side — avoids composite Firestore index
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
        return bt - at;
      });
      setRequests(data);
      setStats({
        total: data.length,
        delivered: data.filter(r => r.status === 'delivered').length,
        pending: data.filter(r => r.status === 'pending').length,
        impact: user?.impactScore || 0,
      });
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'feedbacks'),
      where('donorId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
        const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
        return bt - at;
      });
      setFeedbacks(data);
    }, (err) => console.warn('Feedback fetch error:', err.message));
    return () => unsub();
  }, [user?.uid]);


  useEffect(() => {
    if (!form.preparationDate || !form.preparationTime || !form.foodUsabilityCategory) {
      setQualityResult({ status: '', recommendation: '' });
      return;
    }

    const prepared = new Date(`${form.preparationDate}T${form.preparationTime}`);
    const elapsedHours = (Date.now() - prepared.getTime()) / 3600000;

    let status = 'Risky / not recommended';
    let recommendation = 'Compost / fertilizer';

    if (form.foodUsabilityCategory === 'fertilizer_compost') {
      status = 'Risky / not recommended';
      recommendation = 'Compost / fertilizer';
    } else if (form.foodUsabilityCategory === 'animal_edible') {
      if (elapsedHours <= 8) {
        status = 'Safe but urgent';
        recommendation = 'Animal feeding';
      } else {
        status = 'Risky / not recommended';
        recommendation = 'Compost / fertilizer';
      }
    } else if (form.foodUsabilityCategory === 'human_edible') {
      if (elapsedHours <= 4 && form.foodCategory === 'fresh_food') {
        status = 'Fresh';
        recommendation = 'Human donation';
      } else if (elapsedHours <= 8) {
        status = 'Safe but urgent';
        recommendation = 'Human donation';
      } else {
        status = 'Risky / not recommended';
        recommendation = 'Animal feeding';
      }
    }

    setQualityResult({ status, recommendation });
  }, [form.preparationDate, form.preparationTime, form.storageCondition, form.foodUsabilityCategory, form.foodCategory]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, foodImage: reader.result, foodImagePreview: URL.createObjectURL(file) }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageChange({ dataTransfer: e.dataTransfer });
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await addDoc(collection(db, 'foodRequests'), {
        donorUid: user.uid,
        donorName: user.name || user.email,
        donorEmail: user.email,

        donorBusinessName: form.donorBusinessName,
        donorBusinessType: form.donorCategory,
        donorContactPhone: form.donorContactPhone,
        pickupAddress: form.pickupAddress,

        foodType: form.foodType,
        foodName: form.foodName,
        quantity: parseFloat(form.quantity),
        quantityUnit: form.quantityUnit,
        foodCategory: form.foodCategory,
        preparationDate: form.preparationDate,
        preparationTime: form.preparationTime,
        storageCondition: form.storageCondition,
        foodUsabilityCategory: form.foodUsabilityCategory,
        foodImage: form.foodImage || '',

        safeConsumptionUntil: form.safeConsumptionUntil || null,
        urgency: form.urgency || 'medium',
        notes: form.notes,

        location: {
          lat: parseFloat(form.lat) || 0,
          lng: parseFloat(form.lng) || 0,
          address: form.pickupAddress,
        },

        status: 'pending',
        acceptedByUid: null,
        acceptedByName: null,
        createdAt: serverTimestamp(),
      });

      setSuccess('Food request posted successfully! 🎉');
      setShowForm(false);
      setForm({
        donorCategory: user?.donorCategory || 'individual',
        donorBusinessName: user?.name || '',
        donorContactPhone: user?.contactPhone || '',
        pickupAddress: user?.address || '',
        foodType: 'dal_roti',
        foodName: '',
        quantity: '',
        quantityUnit: 'kg',
        foodCategory: 'fresh_food',
        preparationDate: '',
        preparationTime: '',
        storageCondition: 'room_temperature',
        foodUsabilityCategory: 'human_edible',
        foodImage: '',
        foodImagePreview: '',
        safeConsumptionUntil: '',
        lat: user?.location?.lat || '',
        lng: user?.location?.lng || '',
        notes: '',
      });
      setQualityResult({ status: '', recommendation: '' });
    } catch (err) {
      setError('Failed to post request: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const handleResolveFeedback = (feedbackId) => {
    setFeedbacks(feedbacks.map(f => f.id === feedbackId ? { ...f, resolutionStatus: 'resolved' } : f));
    setSuccess('Feedback resolved!');
    setTimeout(() => setSuccess(''), 3000);
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

        {/* Feedback Section */}
        {feedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              Feedback & Complaints
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbacks.map(feedback => (
                <FeedbackDisplay
                  key={feedback.id}
                  feedback={feedback}
                  onResolve={handleResolveFeedback}
                />
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {success && <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm mb-6"><CheckCircle className="w-4 h-4" />{success}</div>}
        {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6"><AlertCircle className="w-4 h-4" />{error}</div>}

        {/* Post Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 mb-8 fade-in">
            <h2 className="text-lg font-bold text-white mb-5">New Food Request</h2>

            {/* Donor Details are auto-fetched securely from user profile state. */}

            {/* 2. Image Upload Section */}
            <div className="glass p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-3">Image Upload</h3>
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Food Image Upload</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragOver
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-green-900/40 bg-green-900/10 hover:border-green-500/50'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                  {form.foodImagePreview ? (
                    <div className="flex flex-col items-center">
                      <img src={form.foodImagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg mb-4" />
                      <p className="text-sm text-green-400">Image uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-green-400 mb-4" />
                      <p className="text-lg font-medium text-white mb-2">Upload Image</p>
                      <p className="text-sm text-green-400/60">Drag and drop or click to select</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-green-400 mt-2">Please upload a clear image so receivers can verify food condition and usability.</p>
              </div>
            </div>

            {/* 3. Food Details Section */}
            <div className="glass p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-3">Food Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Food Type</label>
                  <select value={form.foodType} onChange={e => setForm({ ...form, foodType: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                    <option value="dal_roti" className="bg-[#0a0f0d]">Dal/Roti</option>
                    <option value="cooked_meals" className="bg-[#0a0f0d]">Cooked Meals</option>
                    <option value="rice_items" className="bg-[#0a0f0d]">Rice Items</option>
                    <option value="bread_bakery" className="bg-[#0a0f0d]">Bread / Bakery</option>
                    <option value="fruits_vegetables" className="bg-[#0a0f0d]">Fruits / Vegetables</option>
                    <option value="snacks" className="bg-[#0a0f0d]">Snacks</option>
                    <option value="sweets_desserts" className="bg-[#0a0f0d]">Sweets / Desserts</option>
                    <option value="beverages" className="bg-[#0a0f0d]">Beverages</option>
                    <option value="packaged_food" className="bg-[#0a0f0d]">Packaged Food</option>
                    <option value="other" className="bg-[#0a0f0d]">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Food Name</label>
                  <input value={form.foodName} onChange={e => setForm({ ...form, foodName: e.target.value })} required
                    placeholder="e.g. Veg Biryani"
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Food Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Quantity Unit</label>
                  <select value={form.quantityUnit} onChange={e => setForm({ ...form, quantityUnit: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                    <option value="plates" className="bg-[#0a0f0d]">Plates</option>
                    <option value="kg" className="bg-[#0a0f0d]">Kg</option>
                    <option value="litres" className="bg-[#0a0f0d]">Litres</option>
                    <option value="packets" className="bg-[#0a0f0d]">Packets</option>
                    <option value="persons_served" className="bg-[#0a0f0d]">Persons Served</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Food Category</label>
                  <select value={form.foodCategory} onChange={e => setForm({ ...form, foodCategory: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                    <option value="fresh_food" className="bg-[#0a0f0d]">Fresh food</option>
                    <option value="packaged_food" className="bg-[#0a0f0d]">Packaged food</option>
                    <option value="perishable_food" className="bg-[#0a0f0d]">Perishable food</option>
                    <option value="dry_food" className="bg-[#0a0f0d]">Dry food</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Preparation Date</label>
                  <input type="date" value={form.preparationDate} onChange={e => setForm({ ...form, preparationDate: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Preparation Time</label>
                  <input type="time" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Storage Condition</label>
                  <select value={form.storageCondition} onChange={e => setForm({ ...form, storageCondition: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                    <option value="room_temperature" className="bg-[#0a0f0d]">Room temperature</option>
                    <option value="refrigerated" className="bg-[#0a0f0d]">Refrigerated</option>
                    <option value="packed" className="bg-[#0a0f0d]">Packed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-green-400/60 mb-1.5 block">Food Usability Category</label>
                  <select value={form.foodUsabilityCategory} onChange={e => setForm({ ...form, foodUsabilityCategory: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm">
                    <option value="human_edible" className="bg-[#0a0f0d]">Human edible</option>
                    <option value="animal_edible" className="bg-[#0a0f0d]">Animal edible</option>
                    <option value="fertilizer_compost" className="bg-[#0a0f0d]">Suitable for fertilizer / compost</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-green-400/60 mb-1.5 block">Expiry / Safe Consumption Time</label>
                  <input type="datetime-local" value={form.safeConsumptionUntil} onChange={e => setForm({ ...form, safeConsumptionUntil: e.target.value })}
                    className="w-full px-4 py-2.5 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm" />
                </div>
              </div>
              {qualityResult.status && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-white"><strong>Food Quality Status:</strong> {qualityResult.status}</p>
                  <p className="text-sm text-green-300"><strong>Recommendation:</strong> {qualityResult.recommendation}</p>
                </div>
              )}
            </div>

            {/* 4. Address Details replaced by background profile mapping. */}

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
                    <th className="px-4 py-3 text-left font-medium">Business</th>
                    <th className="px-4 py-3 text-left font-medium">Food Type</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Shelf Life</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Quality</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Urgency</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-green-900/10 hover:bg-green-900/10 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{r.donorBusinessName || r.donorName || 'Self'}</td>
                      <td className="px-4 py-3 text-white font-medium">{r.foodType}</td>
                      <td className="px-4 py-3 text-green-400/70">{r.quantity}</td>
                      <td className="px-4 py-3 text-green-400/70">{r.shelfLifeHours}h</td>
                      <td className="px-4 py-3"><StatusBadge type="category" value={r.category} /></td>
                      <td className="px-4 py-3 text-green-400/70">{r.foodQualityStatus || 'unknown'}</td>
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
