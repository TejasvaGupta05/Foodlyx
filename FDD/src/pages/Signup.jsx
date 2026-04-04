import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth, RoleSelectModal } from '../context/GoogleAuth';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Leaf, Mail, Lock, User, MapPin, AlertCircle } from 'lucide-react';

const roles = [
  { value: 'donor', label: 'Food Donor' },
  { value: 'ngo', label: 'NGO' },
  { value: 'animal_shelter', label: 'Animal Shelter' },
  { value: 'compost_unit', label: 'Compost Unit' },
];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor', lat: '', lng: '', address: '', contactPhone: '', donorCategory: 'individual' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    signInWithGoogle, googleLoading, googleError,
    pendingGoogleUser, handleRoleConfirm, handleRoleCancel
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
      console.log('Starting signup process...');

      // 1. Create user in Firebase Auth
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      console.log('Firebase Auth user created:', firebaseUser.uid);

      // 2. Prepare user profile document
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
      console.log('User data to save:', userData);

      // 3. Save profile to Firestore — MUST await so data is available on next login
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('Firestore document saved successfully');

      // 4. Update context immediately so redirection works right away
      const fullUserData = { uid: firebaseUser.uid, ...userData };
      login(fullUserData);
      console.log('Context updated with user data:', fullUserData);

      // 5. Small delay to ensure context is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // 6. Navigate based on role
      let redirectPath;
      if (form.role === 'donor') redirectPath = '/donor';
      else if (form.role === 'admin') redirectPath = '/admin';
      else if (form.role === 'animal_shelter') redirectPath = '/shelter';
      else if (form.role === 'compost_unit') redirectPath = '/compost';
      else redirectPath = '/ngo';

      console.log('Navigating to:', redirectPath);
      navigate(redirectPath);

    } catch (err) {
      console.error('Signup error:', err);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try logging in instead.'
        : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : err.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : err.code?.includes('firestore') || err.message?.includes('offline')
              ? 'Account created but profile save failed. Check your Firestore setup.'
              : err.message || 'Signup failed. Please try again.';
      setError(msg);
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

      <div className="hero-bg min-h-screen flex items-center justify-center px-4 pt-16 pb-10">
        <div className="w-full max-w-md glass p-8 glow fade-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-bold text-lg gradient-text">FOODLYX</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-green-400/60 text-sm mb-8">Join the food redistribution network</p>

          {(error || googleError) && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error || googleError}
            </div>
          )}

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 mb-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {googleLoading ? 'Continuing with Google...' : 'Sign up with Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-green-900/40" />
            <span className="text-xs text-green-400/40">or create with email</span>
            <div className="flex-1 h-px bg-green-900/40" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                <input type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder="Your organization / name"
                  className="w-full pl-10 pr-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full px-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm transition-colors">
                {roles.map(({ value, label }) => <option key={value} value={value} className="bg-[#0a0f0d]">{label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                <input type="password" name="password" value={form.password} onChange={handleChange} required
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} required
                  placeholder="Your contact number"
                  className="w-full px-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Full Address</label>
              <div className="relative">
                <input type="text" name="address" value={form.address} onChange={handleChange} required
                  placeholder="Your full address/location"
                  className="w-full px-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              </div>
            </div>

            {form.role === 'donor' && (
              <div>
                <label className="text-xs text-green-400/60 mb-1.5 block">Donor Category</label>
                <select name="donorCategory" value={form.donorCategory} onChange={handleChange}
                  className="w-full px-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white focus:outline-none focus:border-green-500/50 text-sm transition-colors">
                  <option value="individual" className="bg-[#0a0f0d]">Individual</option>
                  <option value="mess" className="bg-[#0a0f0d]">Mess</option>
                  <option value="hotels_restaurants" className="bg-[#0a0f0d]">Hotels/Restaurants</option>
                  <option value="party_gathering" className="bg-[#0a0f0d]">Party/Gathering</option>
                  <option value="other" className="bg-[#0a0f0d]">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Location (Lat, Lng)</label>
              <div className="flex gap-2">
                <input type="text" name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude"
                  className="flex-1 w-10 px-3 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
                <input type="text" name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude"
                  className="flex-1 w-10 px-3 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
                <button type="button" onClick={handleGeolocate}
                  className="px-3 py-3 bg-green-900/20 border border-green-900/40 rounded-lg text-green-400 hover:bg-green-900/40 transition-colors" title="Get location">
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-all mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-green-400/50 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
