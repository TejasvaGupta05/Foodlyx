import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth, RoleSelectModal } from '../context/GoogleAuth';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, MapPin, AlertCircle, ArrowRight, Phone, Tag, Building2 } from 'lucide-react';
import plate1 from '../assets/graphics/Food_Plate_Graphic.png';
import plate4 from '../assets/graphics/Food_Plate_Graphic4.png';

const ROLES = [
  { value: 'donor',         label: '🍱 Food Donor',     color: '#22C55E' },
  { value: 'ngo',           label: '🤝 NGO / Charity',  color: '#3B82F6' },
  { value: 'animal_shelter',label: '🐾 Animal Shelter', color: '#F59E0B' },
  { value: 'compost_unit',  label: '🌿 Compost Unit',   color: '#16A34A' },
];

const DONOR_CATEGORIES = [
  { value: 'individual',        label: 'Individual' },
  { value: 'mess',              label: 'Mess' },
  { value: 'hotels_restaurants',label: 'Hotels / Restaurants' },
  { value: 'party_gathering',   label: 'Party / Gathering' },
  { value: 'other',             label: 'Other' },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// Reusable warm input wrapper
function WarmInput({ icon: Icon, children }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#94A3B8' }} />}
      {children}
    </div>
  );
}

const inputClass = "w-full py-3 rounded-xl text-sm focus:outline-none transition-all";
const inputStyle = { background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' };

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'donor',
    lat: '', lng: '', address: '', contactPhone: '', donorCategory: 'individual',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const {
    signInWithGoogle, googleLoading, googleError,
    pendingGoogleUser, handleRoleConfirm, handleRoleCancel,
  } = useGoogleAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGeolocate = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((f) => ({ ...f, lat: coords.latitude.toFixed(5), lng: coords.longitude.toFixed(5) })),
      () => setError('Could not get location')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const userData = {
        name: form.name,
        email: form.email,
        role: form.role,
        address: form.address,
        contactPhone: form.contactPhone,
        donorCategory: form.role === 'donor' ? form.donorCategory : 'individual',
        location: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
        isVerified: false,
        isSubscribed: false,
        impactScore: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      const fullUserData = { uid: firebaseUser.uid, ...userData };
      login(fullUserData);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (form.role === 'donor') navigate('/donor');
      else if (form.role === 'animal_shelter') navigate('/shelter');
      else if (form.role === 'compost_unit') navigate('/compost');
      else navigate('/ngo');
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use' ? 'This email is already registered. Try logging in instead.'
          : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
          : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
          : err.message || 'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {pendingGoogleUser && (
        <RoleSelectModal
          googleUser={pendingGoogleUser}
          onConfirm={handleRoleConfirm}
          onCancel={handleRoleCancel}
        />
      )}

      <div
        className="min-h-screen flex items-center justify-center px-4 pt-16 pb-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #ECFDF5 100%)' }}
      >
        {/* Decorative plates */}
        <img src={plate1} alt="" className="absolute -right-8 top-20 w-36 h-36 object-contain opacity-20 animate-float-1 pointer-events-none hidden md:block" />
        <img src={plate4} alt="" className="absolute -left-6 bottom-16 w-32 h-32 object-contain opacity-20 animate-float-2 pointer-events-none hidden md:block" />

        <div
          className="w-full max-w-lg relative z-10 slide-up"
          style={{ background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9', padding: '40px' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '1px solid #DCFCE7' }}>
              <img src="/logo.jpeg" alt="Foodlyx" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xl tracking-wide" style={{ color: '#16A34A' }}>FOODLYX</span>
          </div>

          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Join the network
          </h1>
          <p className="text-sm mb-7" style={{ color: '#64748B' }}>Connect with communities saving food and changing lives.</p>

          {/* Error */}
          {(error || googleError) && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-5"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error || googleError}
            </div>
          )}

          {/* Google button */}
          <button
            type="button" onClick={signInWithGoogle} disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-xl font-medium text-sm transition-all disabled:opacity-60 hover:-translate-y-0.5"
            style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Continuing with Google...' : 'Sign up with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>or create with email</span>
            <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role selector — visual cards */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: '#475569' }}>I am joining as a…</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ value, label, color }) => (
                  <button
                    key={value} type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                    style={{
                      border: `2px solid ${form.role === value ? color : '#E2E8F0'}`,
                      background: form.role === value ? `${color}15` : '#F8FAFC',
                      color: form.role === value ? color : '#64748B',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Full Name / Organisation</label>
              <WarmInput icon={User}>
                <input type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder="Your name or organisation"
                  className={`${inputClass} pl-10 pr-4`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </WarmInput>
            </div>

            {/* Email + Password */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Email</label>
                <WarmInput icon={Mail}>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="you@example.com"
                    className={`${inputClass} pl-10 pr-4`} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </WarmInput>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Password</label>
                <WarmInput icon={Lock}>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required
                    placeholder="Min 6 characters"
                    className={`${inputClass} pl-10 pr-4`} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </WarmInput>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Phone Number</label>
              <WarmInput icon={Phone}>
                <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} required
                  placeholder="Your contact number"
                  className={`${inputClass} pl-10 pr-4`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </WarmInput>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Full Address</label>
              <WarmInput icon={Building2}>
                <input type="text" name="address" value={form.address} onChange={handleChange} required
                  placeholder="Your full address / location"
                  className={`${inputClass} pl-10 pr-4`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </WarmInput>
            </div>

            {/* Donor Category */}
            {form.role === 'donor' && (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Donor Category</label>
                <WarmInput icon={Tag}>
                  <select name="donorCategory" value={form.donorCategory} onChange={handleChange}
                    className={`${inputClass} pl-10 pr-4`} style={inputStyle}>
                    {DONOR_CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </WarmInput>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>GPS Coordinates (optional)</label>
              <div className="flex gap-2">
                <input type="text" name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude"
                  className={`flex-1 px-3 ${inputClass}`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                <input type="text" name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude"
                  className={`flex-1 px-3 ${inputClass}`} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                <button type="button" onClick={handleGeolocate} title="Use my location"
                  className="px-3 py-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ background: '#DCFCE7', color: '#16A34A', border: '1.5px solid #22C55E' }}>
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 6px 20px rgba(34,197,94,0.35)' }}
            >
              {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#16A34A' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
