import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Shield, Star,
  CheckCircle, XCircle, Clock, Edit3, Save, X as XIcon,
  Building2, Tag, Globe, BadgeCheck
} from 'lucide-react';

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  donor:          'Food Donor',
  ngo:            'NGO',
  animal_shelter: 'Animal Shelter',
  compost_unit:   'Compost Unit',
  admin:          'Admin',
};

const ROLE_STYLES = {
  donor:          { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' },
  ngo:            { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
  animal_shelter: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  compost_unit:   { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  admin:          { bg: '#F3E8FF', text: '#9333EA', border: '#D8B4FE' },
};

const DONOR_CATEGORY_LABELS = {
  individual:         'Individual',
  mess:               'Mess',
  hotels_restaurants: 'Hotels / Restaurants',
  party_gathering:    'Party / Gathering',
  other:              'Other',
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const LABEL_STYLE  = { color: '#94A3B8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };
const VALUE_STYLE  = { color: '#1C2B22', fontSize: '14px', fontWeight: 500 };
const INPUT_CLS    = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all";
const INPUT_STYLE  = { background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' };
const focusIn  = e => (e.target.style.borderColor = '#22C55E');
const focusOut = e => (e.target.style.borderColor = '#E2E8F0');

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, accentColor = '#22C55E', children }) {
  return (
    <div className="warm-card p-6 hover:shadow-md transition-all">
      <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-5"
        style={{ color: accentColor }}>
        <Icon className="w-4 h-4" /> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, placeholder = '—' }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={LABEL_STYLE}>{label}</span>
      <span style={VALUE_STYLE}>{value ?? placeholder}</span>
    </div>
  );
}

// ── Boolean Badge ─────────────────────────────────────────────────────────────
function Badge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' }}>
      <CheckCircle className="w-3.5 h-3.5" /> {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
      <XCircle className="w-3.5 h-3.5" /> {falseLabel}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user: authUser, login } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!authUser) return <Navigate to="/login" replace />;

  const isDemo = authUser?.uid?.startsWith('demo_');

  // ── Firestore listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) { setProfile(authUser); setLoading(false); return; }
    if (!authUser?.uid) return;
    const unsub = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => { setProfile(snap.exists() ? { uid: snap.id, ...snap.data() } : authUser); setLoading(false); },
      (err)  => { console.warn('Profile:', err.message); setProfile(authUser); setLoading(false); }
    );
    return () => unsub();
  }, [authUser?.uid]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm({
      name: profile?.name || '',
      contactPhone: profile?.contactPhone || '',
      address: profile?.address || '',
      donorCategory: profile?.donorCategory || 'individual',
      lat: profile?.location?.lat ?? '',
      lng: profile?.location?.lng ?? '',
    });
    setSaveError(''); setSaveSuccess(false); setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      const updates = {
        name: editForm.name.trim(),
        contactPhone: editForm.contactPhone.trim(),
        address: editForm.address.trim(),
        donorCategory: profile?.role === 'donor' ? editForm.donorCategory : profile?.donorCategory,
        location: { lat: parseFloat(editForm.lat) || 0, lng: parseFloat(editForm.lng) || 0 },
      };
      await updateDoc(doc(db, 'users', authUser.uid), updates);
      login({ ...authUser, ...updates });
      setSaveSuccess(true); setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError('Failed to save: ' + err.message);
    } finally { setSaving(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="warm-page min-h-screen flex items-center justify-center pt-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
        <p className="text-sm" style={{ color: '#64748B' }}>Loading your profile...</p>
      </div>
    </div>
  );

  const p = profile || authUser;
  const roleStyle = ROLE_STYLES[p?.role] || ROLE_STYLES.donor;

  const memberSince = p?.createdAt
    ? new Date(typeof p.createdAt === 'string' ? p.createdAt : p.createdAt?.toDate?.() || p.createdAt)
        .toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="warm-page min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="warm-badge mb-2 inline-flex" style={{ background: roleStyle.bg, color: roleStyle.text }}>
              👤 My Profile
            </span>
            <h1 className="text-4xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
              Account Details
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748B' }}>Your Foodlyx account information</p>
          </div>
          {!isDemo && !editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold shadow-md transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* ── Banners ── */}
        {saveSuccess && (
          <div className="mb-5 flex items-center gap-2 p-4 rounded-2xl text-sm fade-in"
            style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#16A34A' }}>
            <CheckCircle className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}
        {saveError && (
          <div className="mb-5 flex items-center gap-2 p-4 rounded-2xl text-sm fade-in"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <XIcon className="w-4 h-4" /> {saveError}
          </div>
        )}

        {/* ── Hero avatar card ── */}
        <div className="warm-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {p?.photoURL ? (
              <img src={p.photoURL} alt={p.name}
                className="w-24 h-24 rounded-2xl object-cover"
                style={{ border: `2px solid ${roleStyle.border}` }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg,${roleStyle.bg},${roleStyle.border}20)`, border: `2px solid ${roleStyle.border}` }}>
                <span className="text-4xl font-black select-none" style={{ color: roleStyle.text }}>
                  {(p?.name || p?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            {p?.isVerified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: '#22C55E', border: '2px solid #FFFFFF', boxShadow: '0 2px 8px rgba(34,197,94,0.4)' }}>
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Name / role / meta */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-2xl font-black truncate" style={{ color: '#1C2B22' }}>
              {p?.name || 'Unnamed User'}
            </h2>
            <p className="text-sm mt-0.5 truncate" style={{ color: '#64748B' }}>{p?.email}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}>
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[p?.role] || p?.role}
              </span>
              <Badge value={p?.isVerified} trueLabel="Verified" falseLabel="Not Verified" />
              <Badge value={p?.isSubscribed} trueLabel="Subscribed" falseLabel="Not Subscribed" />
            </div>

            {memberSince && (
              <p className="flex items-center gap-1.5 text-xs mt-3 justify-center sm:justify-start" style={{ color: '#94A3B8' }}>
                <Clock className="w-3 h-3" /> Member since {memberSince}
              </p>
            )}
          </div>

          {/* Impact score */}
          <div className="flex-shrink-0 text-center">
            <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#FEF3C7,#FED7AA)', border: '2px solid #FCD34D', boxShadow: '0 4px 16px rgba(245,158,11,0.15)' }}>
              <Star className="w-6 h-6 mb-1" style={{ color: '#F59E0B' }} />
              <span className="text-2xl font-black" style={{ color: '#D97706' }}>{p?.impactScore ?? 0}</span>
            </div>
            <p className="text-xs font-semibold mt-2" style={{ color: '#94A3B8' }}>Impact Score</p>
          </div>
        </div>

        {/* ── Edit Form ── */}
        {editing && (
          <div className="mb-6 warm-card p-6 fade-in" style={{ border: '2px solid #22C55E' }}>
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-5"
              style={{ color: '#22C55E' }}>
              <Edit3 className="w-4 h-4" /> Edit Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>
              {/* Phone */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Phone Number</label>
                <input type="tel" value={editForm.contactPhone} onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })}
                  className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>
              {/* Address */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Address</label>
                <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>
              {/* Donor category */}
              {p?.role === 'donor' && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Donor Category</label>
                  <select value={editForm.donorCategory} onChange={e => setEditForm({ ...editForm, donorCategory: e.target.value })}
                    className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut}>
                    {Object.entries(DONOR_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )}
              {/* Lat */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Latitude</label>
                <input type="number" step="any" value={editForm.lat} onChange={e => setEditForm({ ...editForm, lat: e.target.value })}
                  placeholder="e.g. 28.6139" className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>
              {/* Lng */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Longitude</label>
                <input type="number" step="any" value={editForm.lng} onChange={e => setEditForm({ ...editForm, lng: e.target.value })}
                  placeholder="e.g. 77.2090" className={INPUT_CLS} style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            {/* Edit action buttons */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0' }}>
                <XIcon className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── 4 Info Sections ── */}
        <div className="grid sm:grid-cols-2 gap-5">

          {/* 1. Personal Information */}
          <SectionCard title="Personal Information" icon={User} accentColor="#22C55E">
            <InfoRow label="Full Name" value={p?.name} />
            <InfoRow label="Email" value={p?.email} />
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>User ID</span>
              <span style={{ color: '#94A3B8', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {p?.uid || '—'}
              </span>
            </div>
            {p?.photoURL && (
              <div className="flex flex-col gap-1">
                <span style={LABEL_STYLE}>Photo</span>
                <a href={p.photoURL} target="_blank" rel="noreferrer"
                  className="text-xs underline underline-offset-2" style={{ color: '#22C55E' }}>
                  View photo ↗
                </a>
              </div>
            )}
          </SectionCard>

          {/* 2. Contact Details */}
          <SectionCard title="Contact Details" icon={Phone} accentColor="#3B82F6">
            <InfoRow label="Phone" value={p?.contactPhone} />
            <InfoRow label="Address" value={p?.address} />
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>GPS Coordinates</span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                  <Globe className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                  <span className="text-xs font-mono font-medium" style={{ color: '#16A34A' }}>
                    {p?.location?.lat ?? '—'}°N
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                  <span className="text-xs font-mono font-medium" style={{ color: '#2563EB' }}>
                    {p?.location?.lng ?? '—'}°E
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. Account Status */}
          <SectionCard title="Account Status" icon={Shield} accentColor="#9333EA">
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>Role</span>
              <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-xs font-bold mt-1"
                style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}>
                <Shield className="w-3.5 h-3.5" />
                {ROLE_LABELS[p?.role] || p?.role}
              </span>
            </div>
            {p?.role === 'donor' && (
              <div className="flex flex-col gap-1">
                <span style={LABEL_STYLE}>Donor Category</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold mt-0.5" style={{ color: '#22C55E' }}>
                  <Tag className="w-3.5 h-3.5" />
                  {DONOR_CATEGORY_LABELS[p?.donorCategory] || p?.donorCategory || '—'}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>Verification</span>
              <div className="mt-0.5"><Badge value={p?.isVerified} trueLabel="Verified" falseLabel="Not Verified" /></div>
            </div>
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>Subscription</span>
              <div className="mt-0.5"><Badge value={p?.isSubscribed} trueLabel="Subscribed" falseLabel="Not Subscribed" /></div>
            </div>
            {memberSince && <InfoRow label="Member Since" value={memberSince} />}
          </SectionCard>

          {/* 4. Impact Details */}
          <SectionCard title="Impact Details" icon={Star} accentColor="#F59E0B">
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>Impact Score</span>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mt-1 w-fit"
                style={{ background: 'linear-gradient(135deg,#FEF3C7,#FED7AA)', border: '1.5px solid #FCD34D' }}>
                <Star className="w-5 h-5" style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                <span className="text-2xl font-black" style={{ color: '#D97706' }}>{p?.impactScore ?? 0}</span>
                <span className="text-sm font-medium" style={{ color: '#B45309' }}>pts</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span style={LABEL_STYLE}>Progress to 1,000</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((p?.impactScore ?? 0) / 1000) * 100)}%`,
                      background: 'linear-gradient(90deg,#22C55E,#F59E0B)',
                    }} />
                </div>
                <span className="text-xs font-bold" style={{ color: '#64748B' }}>
                  {Math.min(100, Math.round(((p?.impactScore ?? 0) / 1000) * 100))}%
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Keep donating to increase your score!</p>
            </div>
            {p?.subscription && (
              <>
                <InfoRow label="Plan" value={p.subscription.plan} />
                <InfoRow label="Plan Status" value={<span className="capitalize" style={{ color: '#22C55E', fontWeight: 700 }}>{p.subscription.status}</span>} />
                <InfoRow label="Usage" value={`${p.subscription.usedRequests ?? 0} / ${p.subscription.usageLimit ?? '∞'} requests`} />
              </>
            )}
          </SectionCard>

        </div>

        {/* ── Demo notice ── */}
        {isDemo && (
          <div className="mt-6 p-4 rounded-2xl text-sm text-center"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
            ℹ️ You are viewing a <strong>demo account</strong>. Profile editing is disabled for demo sessions.
          </div>
        )}

      </div>
    </div>
  );
}
