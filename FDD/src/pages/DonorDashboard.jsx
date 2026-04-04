import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Plus, Package, Clock, TrendingUp, CheckCircle, AlertCircle,
  Upload, MessageSquare, X, ChevronDown, ChevronUp, Utensils,
  MapPin, Zap, Star
} from 'lucide-react';
import FeedbackDisplay from '../components/FeedbackDisplay';

// ── Warm input helper ──────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all";
const inputStyle = { background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' };
const focusIn = e => (e.target.style.borderColor = '#22C55E');
const focusOut = e => (e.target.style.borderColor = '#E2E8F0');

// ── Status colors ──────────────────────────────────────────────────────────
const STATUS = {
  pending:   { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B', label: 'Pending'   },
  accepted:  { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6', label: 'Accepted'  },
  delivered: { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E', label: 'Delivered' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', label: 'Cancelled' },
};

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

const URGENCY_PILL = {
  high:   { bg: '#FEF2F2', text: '#DC2626' },
  medium: { bg: '#FFFBEB', text: '#D97706' },
  low:    { bg: '#F0FDF4', text: '#16A34A' },
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const [requests, setRequests]   = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats]         = useState({ total: 0, delivered: 0, pending: 0, impact: 0 });
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
    urgency: 'medium',
    lat: user?.location?.lat || '',
    lng: user?.location?.lng || '',
    notes: '',
  });

  const [qualityResult, setQualityResult] = useState({ status: '', recommendation: '', color: '' });

  // ── Real-time data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'foodRequests'), where('donorUid', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRequests(data);
      setStats({
        total: data.length,
        delivered: data.filter(r => r.status === 'delivered').length,
        pending: data.filter(r => r.status === 'pending').length,
        impact: user?.impactScore || 0,
      });
      setLoading(false);
    }, () => setLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'feedbacks'), where('donorId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setFeedbacks(data);
    }, err => console.warn('Feedback:', err.message));
  }, [user?.uid]);

  // ── Quality checker ────────────────────────────────────────────────────
  useEffect(() => {
    if (!form.preparationDate || !form.preparationTime) { setQualityResult({ status: '', recommendation: '', color: '' }); return; }
    const elapsedHours = (Date.now() - new Date(`${form.preparationDate}T${form.preparationTime}`).getTime()) / 3600000;
    let status = '⚠️ Risky — not for humans', recommendation = '🌿 Compost / fertilizer', color = '#EF4444';
    if (form.foodUsabilityCategory === 'human_edible') {
      if (elapsedHours <= 4) { status = '✅ Fresh — excellent condition'; recommendation = '🧑 Human donation'; color = '#16A34A'; }
      else if (elapsedHours <= 8) { status = '⏰ Safe but urgent'; recommendation = '🧑 Human donation (urgent)'; color = '#D97706'; }
      else { status = '⚠️ Too old for humans'; recommendation = '🐾 Animal feeding'; color = '#EF4444'; }
    } else if (form.foodUsabilityCategory === 'animal_edible') {
      if (elapsedHours <= 8) { status = '✅ Suitable for animals'; recommendation = '🐾 Animal feeding'; color = '#F59E0B'; }
      else { status = '⚠️ Too old even for animals'; recommendation = '🌿 Compost'; color = '#EF4444'; }
    }
    setQualityResult({ status, recommendation, color });
  }, [form.preparationDate, form.preparationTime, form.foodUsabilityCategory, form.foodCategory]);

  // ── Image upload ───────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, foodImage: reader.result, foodImagePreview: URL.createObjectURL(file) }));
    reader.readAsDataURL(file);
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await addDoc(collection(db, 'foodRequests'), {
        donorUid: user.uid, donorName: user.name || user.email, donorEmail: user.email,
        donorBusinessName: form.donorBusinessName, donorBusinessType: form.donorCategory,
        donorContactPhone: form.donorContactPhone, pickupAddress: form.pickupAddress,
        foodType: form.foodType, foodName: form.foodName,
        quantity: parseFloat(form.quantity), quantityUnit: form.quantityUnit,
        foodCategory: form.foodCategory, preparationDate: form.preparationDate,
        preparationTime: form.preparationTime, storageCondition: form.storageCondition,
        foodUsabilityCategory: form.foodUsabilityCategory, foodImage: form.foodImage || '',
        safeConsumptionUntil: form.safeConsumptionUntil || null,
        urgency: form.urgency || 'medium', notes: form.notes,
        location: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0, address: form.pickupAddress },
        status: 'pending', acceptedByUid: null, acceptedByName: null, createdAt: serverTimestamp(),
      });
      setSuccess('🎉 Food request posted! NGOs near you will be notified.');
      setShowForm(false);
      setForm(prev => ({ ...prev, foodName: '', quantity: '', preparationDate: '', preparationTime: '', notes: '', foodImage: '', foodImagePreview: '' }));
    } catch (err) { setError('Failed to post: ' + err.message); }
    finally { setSubmitting(false); }
  };

  // ── Stat cards config ──────────────────────────────────────────────────
  const STAT_CARDS = [
    { label: 'Total Posts',  value: stats.total,     emoji: '📦', color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Delivered',    value: stats.delivered, emoji: '✅', color: '#16A34A', bg: '#DCFCE7' },
    { label: 'Pending',      value: stats.pending,   emoji: '⏳', color: '#D97706', bg: '#FEF3C7' },
    { label: 'Impact Score', value: stats.impact,    emoji: '⭐', color: '#F59E0B', bg: '#FEF3C7' },
  ];

  return (
    <div className="warm-page min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="warm-badge" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                🍱 Donor Portal
              </span>
            </div>
            <h1 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
              Donor Dashboard
            </h1>
            <p className="mt-1 text-base" style={{ color: '#64748B' }}>
              Welcome back, <span className="font-semibold" style={{ color: '#22C55E' }}>{user?.name || user?.email?.split('@')[0]}</span>
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-all hover:-translate-y-1"
            style={{ background: showForm ? '#EF4444' : 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Post Food</>}
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, emoji, color, bg }) => (
            <div key={label} className="warm-card p-5 text-center hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: bg }}>
                {emoji}
              </div>
              <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
              <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Alerts ── */}
        {success && (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm mb-6"
            style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#16A34A' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl text-sm mb-6"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Post Food Form ── */}
        {showForm && (
          <div className="warm-card p-7 mb-8 fade-in" style={{ border: '2px solid #22C55E' }}>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2" style={{ color: '#1C2B22', fontFamily: "'Playfair Display', serif" }}>
              <Utensils className="w-5 h-5" style={{ color: '#22C55E' }} /> Post a New Food Donation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: '#475569' }}>Food Photo</label>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleImageChange({ dataTransfer: e.dataTransfer }); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{ borderColor: isDragOver ? '#22C55E' : '#E2E8F0', background: isDragOver ? '#DCFCE7' : '#F8FAFC' }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {form.foodImagePreview ? (
                    <div className="flex flex-col items-center">
                      <img src={form.foodImagePreview} alt="Preview" className="h-36 w-36 object-cover rounded-2xl mb-3 shadow-md" />
                      <p className="text-sm font-medium" style={{ color: '#16A34A' }}>✅ Image ready</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#DCFCE7' }}>
                        <Upload className="w-7 h-7" style={{ color: '#22C55E' }} />
                      </div>
                      <p className="font-semibold mb-1" style={{ color: '#334155' }}>Upload food photo</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>Drag & drop or click to select</p>
                    </div>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>📸 A clear photo helps NGOs verify food condition and usability.</p>
              </div>

              {/* Food Details */}
              <div>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#475569' }}>Food Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Food Name', key: 'foodName', type: 'text', placeholder: 'e.g. Veg Biryani' },
                    { label: 'Quantity', key: 'quantity', type: 'number', placeholder: 'e.g. 5' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>{label}</label>
                      <input type={type} min={type === 'number' ? '1' : undefined} value={form[key]} required
                        placeholder={placeholder}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                  ))}

                  {[
                    { label: 'Food Type', key: 'foodType', opts: [['dal_roti','Dal/Roti'],['cooked_meals','Cooked Meals'],['rice_items','Rice Items'],['bread_bakery','Bread/Bakery'],['fruits_vegetables','Fruits/Vegetables'],['snacks','Snacks'],['sweets_desserts','Sweets/Desserts'],['beverages','Beverages'],['packaged_food','Packaged Food'],['other','Other']] },
                    { label: 'Quantity Unit', key: 'quantityUnit', opts: [['plates','Plates'],['kg','Kg'],['litres','Litres'],['packets','Packets'],['persons_served','Persons Served']] },
                    { label: 'Food Category', key: 'foodCategory', opts: [['fresh_food','Fresh Food'],['packaged_food','Packaged Food'],['perishable_food','Perishable'],['dry_food','Dry Food']] },
                    { label: 'Usability', key: 'foodUsabilityCategory', opts: [['human_edible','🧑 Human Edible'],['animal_edible','🐾 Animal Edible'],['fertilizer_compost','🌿 Compost']] },
                    { label: 'Storage', key: 'storageCondition', opts: [['room_temperature','Room Temperature'],['refrigerated','Refrigerated'],['packed','Packed']] },
                    { label: 'Urgency', key: 'urgency', opts: [['low','🟢 Low'],['medium','🟡 Medium'],['high','🔴 High']] },
                  ].map(({ label, key, opts }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>{label}</label>
                      <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Preparation Date</label>
                    <input type="date" value={form.preparationDate} onChange={e => setForm({ ...form, preparationDate: e.target.value })} required
                      className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Preparation Time</label>
                    <input type="time" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })} required
                      className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Safe Consumption Until (optional)</label>
                    <input type="datetime-local" value={form.safeConsumptionUntil} onChange={e => setForm({ ...form, safeConsumptionUntil: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                      placeholder="Any special instructions for the receiver..."
                      className={`${inputCls} resize-none`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                </div>

                {/* Quality result */}
                {qualityResult.status && (
                  <div className="mt-4 p-4 rounded-2xl" style={{ background: `${qualityResult.color}15`, border: `1px solid ${qualityResult.color}40` }}>
                    <p className="text-sm font-bold mb-1" style={{ color: qualityResult.color }}>Food Quality Check</p>
                    <p className="text-sm" style={{ color: '#334155' }}>{qualityResult.status}</p>
                    <p className="text-xs mt-1 font-medium" style={{ color: '#64748B' }}>Recommendation: {qualityResult.recommendation}</p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="px-8 py-3 rounded-2xl text-white font-bold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}>
                  {submitting ? '⏳ Posting...' : '🍱 Post Donation'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-8 py-3 rounded-2xl font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Feedback Section ── */}
        {feedbacks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: '#1C2B22' }}>
              <MessageSquare className="w-5 h-5" style={{ color: '#22C55E' }} /> Feedback Received
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbacks.map(fb => <FeedbackDisplay key={fb.id} feedback={fb} />)}
            </div>
          </div>
        )}

        {/* ── Requests Table ── */}
        <div className="warm-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h2 className="font-black text-lg" style={{ color: '#1C2B22' }}>My Donation Posts</h2>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              {requests.length} total
            </span>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin mb-3" />
              <p className="text-sm" style={{ color: '#94A3B8' }}>Loading your posts...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">🍱</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No donations yet</h3>
              <p className="text-sm mb-5" style={{ color: '#64748B' }}>You haven't posted any food donations. Click "Post Food" to start helping!</p>
              <button onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-2xl text-white font-bold transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
                <Plus className="w-4 h-4" /> Post Your First Donation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['Food', 'Quantity', 'Category', 'Urgency', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id}
                      className="transition-colors hover:bg-green-50"
                      style={{ borderBottom: i < requests.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-sm" style={{ color: '#1C2B22' }}>{r.foodName || r.foodType}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{r.donorBusinessName || 'Direct'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium" style={{ color: '#334155' }}>
                        {r.quantity} {r.quantityUnit || 'kg'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: '#F0FDF4', color: '#16A34A' }}>
                          {r.foodUsabilityCategory?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {r.urgency && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                            style={{ background: URGENCY_PILL[r.urgency]?.bg, color: URGENCY_PILL[r.urgency]?.text }}>
                            {r.urgency}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4"><StatusPill status={r.status} /></td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#94A3B8' }}>
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                      </td>
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
