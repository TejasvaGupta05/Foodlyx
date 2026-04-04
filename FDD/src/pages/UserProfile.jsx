import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Shield, Star, Zap,
  CheckCircle, XCircle, Clock, Edit3, Save, X as XIcon,
  Building2, Tag, Globe, BadgeCheck
} from 'lucide-react';

// ── Role display labels ──────────────────────────────────────────────────────
const ROLE_LABELS = {
  donor: 'Food Donor',
  ngo: 'NGO',
  animal_shelter: 'Animal Shelter',
  compost_unit: 'Compost Unit',
  admin: 'Admin',
};

const ROLE_COLORS = {
  donor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ngo: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  animal_shelter: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  compost_unit: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const DONOR_CATEGORY_LABELS = {
  individual: 'Individual',
  mess: 'Mess',
  hotels_restaurants: 'Hotels / Restaurants',
  party_gathering: 'Party / Gathering',
  other: 'Other',
};

// ── Reusable section card ────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, accentClass = 'text-green-400' }) {
  return (
    <div className="bg-white dark:bg-[#111916]/70 dark:backdrop-blur-md border border-[#e5e7eb] dark:border-green-900/30 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all">
      <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-5 ${accentClass}`}>
        <Icon className="w-4 h-4" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Single info row ──────────────────────────────────────────────────────────
function InfoRow({ label, value, placeholder = '—' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider w-36 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-[#111827] dark:text-white font-medium break-all">
        {value ?? placeholder}
      </span>
    </div>
  );
}

// ── Boolean badge ────────────────────────────────────────────────────────────
function Badge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30">
      <CheckCircle className="w-3.5 h-3.5" /> {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30">
      <XCircle className="w-3.5 h-3.5" /> {falseLabel}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user: authUser, login } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Guard — must be logged in
  if (!authUser) return <Navigate to="/login" replace />;

  // Skip Firestore for demo accounts
  const isDemo = authUser?.uid?.startsWith('demo_');

  // ── Real-time Firestore listener ───────────────────────────────────────────
  useEffect(() => {
    if (isDemo) {
      setProfile(authUser);
      setLoading(false);
      return;
    }
    if (!authUser?.uid) return;

    const unsub = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() });
        } else {
          setProfile(authUser); // fall back to auth context data
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Profile listener error:', err.message);
        setProfile(authUser);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [authUser?.uid]);

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm({
      name: profile?.name || '',
      contactPhone: profile?.contactPhone || '',
      address: profile?.address || '',
      donorCategory: profile?.donorCategory || 'individual',
      lat: profile?.location?.lat ?? '',
      lng: profile?.location?.lng ?? '',
    });
    setSaveError('');
    setSaveSuccess(false);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updates = {
        name: editForm.name.trim(),
        contactPhone: editForm.contactPhone.trim(),
        address: editForm.address.trim(),
        donorCategory: profile?.role === 'donor' ? editForm.donorCategory : profile?.donorCategory,
        location: {
          lat: parseFloat(editForm.lat) || 0,
          lng: parseFloat(editForm.lng) || 0,
        },
      };
      await updateDoc(doc(db, 'users', authUser.uid), updates);
      // Update AuthContext so Navbar name refreshes instantly
      login({ ...authUser, ...updates });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4 hero-bg flex items-center justify-center">
        <div className="text-green-400/40 animate-pulse text-sm">Loading profile...</div>
      </div>
    );
  }

  const p = profile || authUser;
  const memberSince = p?.createdAt
    ? new Date(typeof p.createdAt === 'string' ? p.createdAt : p.createdAt?.toDate?.() || p.createdAt)
        .toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 pb-16 px-4 hero-bg">
      <div className="max-w-4xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#111827] dark:text-white">My Profile</h1>
            <p className="text-[#6b7280] dark:text-green-400/50 text-sm mt-1">
              Your Foodlyx account details
            </p>
          </div>
          {!isDemo && !editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] dark:bg-green-600 hover:bg-[#15803d] dark:hover:bg-green-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* ── Success / error banners ── */}
        {saveSuccess && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm fade-in">
            <CheckCircle className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}
        {saveError && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm fade-in">
            <XIcon className="w-4 h-4" /> {saveError}
          </div>
        )}

        {/* ── Hero avatar card ── */}
        <div className="mb-6 bg-white dark:bg-[#111916]/70 dark:backdrop-blur-md border border-[#e5e7eb] dark:border-green-900/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {p?.photoURL ? (
              <img
                src={p.photoURL}
                alt={p.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#16a34a]/30 dark:border-green-500/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center">
                <span className="text-3xl font-black text-[#16a34a] dark:text-green-400 select-none">
                  {(p?.name || p?.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            {p?.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111916]">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Name / role / meta */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#111827] dark:text-white truncate">
              {p?.name || 'Unnamed User'}
            </h2>
            <p className="text-sm text-[#6b7280] dark:text-green-400/50 mt-0.5 truncate">{p?.email}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              {/* Role badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[p?.role] || ROLE_COLORS.donor}`}>
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[p?.role] || p?.role}
              </span>

              {/* Verified badge */}
              <Badge value={p?.isVerified} trueLabel="Verified" falseLabel="Not Verified" />

              {/* Subscribed badge */}
              <Badge value={p?.isSubscribed} trueLabel="Subscribed" falseLabel="Not Subscribed" />
            </div>

            {memberSince && (
              <p className="flex items-center gap-1.5 text-xs text-[#9ca3af] dark:text-green-400/30 mt-3 justify-center sm:justify-start">
                <Clock className="w-3 h-3" /> Member since {memberSince}
              </p>
            )}
          </div>

          {/* Impact score */}
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/20 border border-yellow-500/20 dark:border-amber-500/30 flex flex-col items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 dark:text-amber-400 mb-1" />
              <span className="text-xl font-black text-[#111827] dark:text-white">{p?.impactScore ?? 0}</span>
            </div>
            <p className="text-xs text-[#9ca3af] dark:text-green-400/40 mt-1.5">Impact Score</p>
          </div>
        </div>

        {/* ── Edit form (inline) ── */}
        {editing && (
          <div className="mb-6 bg-white dark:bg-[#111916]/70 dark:backdrop-blur-md border border-[#16a34a]/30 dark:border-green-500/30 rounded-2xl p-6 shadow-md fade-in">
            <h2 className="text-sm font-bold text-[#16a34a] dark:text-green-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Phone Number</label>
                <input type="tel" value={editForm.contactPhone} onChange={e => setEditForm({...editForm, contactPhone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Address</label>
                <input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors" />
              </div>
              {p?.role === 'donor' && (
                <div>
                  <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Donor Category</label>
                  <select value={editForm.donorCategory} onChange={e => setEditForm({...editForm, donorCategory: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors">
                    {Object.entries(DONOR_CATEGORY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Latitude</label>
                <input type="number" step="any" value={editForm.lat} onChange={e => setEditForm({...editForm, lat: e.target.value})}
                  placeholder="e.g. 28.6139"
                  className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors placeholder:text-[#9ca3af]" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] dark:text-green-400/40 mb-1 block">Longitude</label>
                <input type="number" step="any" value={editForm.lng} onChange={e => setEditForm({...editForm, lng: e.target.value})}
                  placeholder="e.g. 77.2090"
                  className="w-full px-4 py-2.5 bg-[#f9fafb] dark:bg-green-900/10 border border-[#d1d5db] dark:border-green-900/40 rounded-xl text-[#111827] dark:text-white text-sm focus:outline-none focus:border-[#16a34a] dark:focus:border-green-500/50 transition-colors placeholder:text-[#9ca3af]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={cancelEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#f3f4f6] dark:bg-gray-700 hover:bg-[#e5e7eb] dark:hover:bg-gray-600 text-[#374151] dark:text-white rounded-xl text-sm font-medium transition-colors">
                <XIcon className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-2 flex-grow flex items-center justify-center gap-2 py-2.5 bg-[#16a34a] dark:bg-green-600 hover:bg-[#15803d] dark:hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-md transition-all">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── 4 Info Sections ── */}
        <div className="grid sm:grid-cols-2 gap-5">

          {/* 1. Personal Information */}
          <SectionCard title="Personal Information" icon={User} accentClass="text-[#16a34a] dark:text-green-400">
            <InfoRow label="Full Name" value={p?.name} />
            <InfoRow label="Email" value={p?.email} />
            <InfoRow label="User ID" value={
              <span className="font-mono text-xs text-[#6b7280] dark:text-green-400/40 break-all">{p?.uid}</span>
            } />
            {p?.photoURL && (
              <InfoRow label="Photo" value={
                <a href={p.photoURL} target="_blank" rel="noreferrer" className="text-[#16a34a] dark:text-green-400 text-xs underline underline-offset-2">View photo</a>
              } />
            )}
          </SectionCard>

          {/* 2. Contact Details */}
          <SectionCard title="Contact Details" icon={Phone} accentClass="text-blue-500 dark:text-blue-400">
            <InfoRow label="Phone" value={p?.contactPhone} />
            <InfoRow label="Address" value={p?.address} />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Location</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f4f6] dark:bg-green-900/20 border border-[#e5e7eb] dark:border-green-900/40">
                  <Globe className="w-3.5 h-3.5 text-[#6b7280] dark:text-green-400/50" />
                  <span className="text-xs text-[#374151] dark:text-green-300/70 font-mono">
                    {p?.location?.lat ?? '—'}°N
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f4f6] dark:bg-green-900/20 border border-[#e5e7eb] dark:border-green-900/40">
                  <MapPin className="w-3.5 h-3.5 text-[#6b7280] dark:text-green-400/50" />
                  <span className="text-xs text-[#374151] dark:text-green-300/70 font-mono">
                    {p?.location?.lng ?? '—'}°E
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. Account Status */}
          <SectionCard title="Account Status" icon={Shield} accentClass="text-purple-500 dark:text-purple-400">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Role</span>
              <span className={`inline-flex items-center gap-1.5 w-fit mt-1 px-3 py-1.5 rounded-full text-xs font-bold border ${ROLE_COLORS[p?.role] || ROLE_COLORS.donor}`}>
                <Shield className="w-3.5 h-3.5" />
                {ROLE_LABELS[p?.role] || p?.role}
              </span>
            </div>
            {p?.role === 'donor' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Donor Category</span>
                <span className="flex items-center gap-1.5 text-sm text-[#111827] dark:text-white font-medium mt-0.5">
                  <Tag className="w-3.5 h-3.5 text-[#16a34a] dark:text-green-400" />
                  {DONOR_CATEGORY_LABELS[p?.donorCategory] || p?.donorCategory || '—'}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Verification</span>
              <div className="mt-0.5"><Badge value={p?.isVerified} trueLabel="Verified" falseLabel="Not Verified" /></div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Subscription</span>
              <div className="mt-0.5"><Badge value={p?.isSubscribed} trueLabel="Subscribed" falseLabel="Not Subscribed" /></div>
            </div>
            {memberSince && (
              <InfoRow label="Member Since" value={memberSince} />
            )}
          </SectionCard>

          {/* 4. Impact Details */}
          <SectionCard title="Impact Details" icon={Star} accentClass="text-amber-500 dark:text-amber-400">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Impact Score</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 dark:border-amber-500/30">
                  <Star className="w-5 h-5 text-yellow-500 dark:text-amber-400 fill-yellow-400 dark:fill-amber-400" />
                  <span className="text-2xl font-black text-[#111827] dark:text-white">{p?.impactScore ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#9ca3af] dark:text-green-400/40 uppercase tracking-wider">Activity Level</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#e5e7eb] dark:bg-green-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((p?.impactScore ?? 0) / 1000) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#6b7280] dark:text-green-400/40 w-10 text-right">
                  {Math.min(100, Math.round(((p?.impactScore ?? 0) / 1000) * 100))}%
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] dark:text-green-400/30 mt-0.5">Progress toward 1,000 score milestone</p>
            </div>
            {p?.subscription && (
              <>
                <InfoRow label="Plan" value={p.subscription.plan} />
                <InfoRow label="Plan Status" value={
                  <span className="capitalize">{p.subscription.status}</span>
                } />
                <InfoRow label="Usage" value={
                  `${p.subscription.usedRequests ?? 0} / ${p.subscription.usageLimit ?? '∞'} requests`
                } />
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Demo notice ── */}
        {isDemo && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm text-center">
            ℹ️ You are viewing a <strong>demo account</strong>. Profile editing is disabled for demo sessions.
          </div>
        )}
      </div>
    </div>
  );
}
