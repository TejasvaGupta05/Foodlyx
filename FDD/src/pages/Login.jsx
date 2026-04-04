import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth, RoleSelectModal } from '../context/GoogleAuth';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Leaf, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    signInWithGoogle, googleLoading, googleError,
    pendingGoogleUser, handleRoleConfirm, handleRoleCancel
  } = useGoogleAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLoginSuccess = (data) => {
    login(data);
    if (data.role === 'donor') navigate('/donor');
    else if (data.role === 'admin') navigate('/admin');
    else if (data.role === 'animal_shelter') navigate('/shelter');
    else if (data.role === 'compost_unit') navigate('/compost');
    else navigate(`/${data.role}`);
  };

  const performLogin = async (credentials) => {
    setError('');
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      let userData = { uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' };
      try {
        const docSnap = await Promise.race([
          getDoc(doc(db, 'users', firebaseUser.uid)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
        ]);
        if (docSnap.exists()) userData = { ...userData, ...docSnap.data() };
      } catch (firestoreErr) {
        console.warn('Could not load profile, using Auth data only:', firestoreErr.message);
      }
      handleLoginSuccess(userData);
    } catch (err) {
      const isDemoAccount = credentials.email.endsWith('@foodlyx.com');
      if (isDemoAccount) {
        const roleMap = { donor: 'donor', ngo: 'ngo', animal: 'animal_shelter', compost: 'compost_unit', admin: 'admin' };
        const prefix = credentials.email.split('@')[0];
        handleLoginSuccess({
          uid: 'demo_' + prefix,
          name: prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' (Demo)',
          email: credentials.email,
          role: roleMap[prefix] || 'donor',
          isVerified: true,
          location: { lat: 28.6139, lng: 77.209 },
          impactScore: 100
        });
      } else {
        setError(
          err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
            ? 'Incorrect email or password.'
            : err.code === 'auth/user-not-found'
            ? 'No account found with this email.'
            : err.message || 'Login failed.'
        );
      }
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

      <div className="hero-bg min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md glass p-8 glow fade-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-bold text-lg gradient-text">FOODLYX</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-green-400/60 text-sm mb-8">Sign in to your account</p>

          {(error || googleError) && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error || googleError}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 mb-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-green-900/40" />
            <span className="text-xs text-green-400/40">or</span>
            <div className="flex-1 h-px bg-green-900/40" />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); performLogin(form); }} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-green-400/60 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
                <input
                  type="password" name="password" value={form.password} onChange={handleChange} required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading || googleLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-all mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-green-400/50 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-green-400 hover:text-green-300 font-medium">Sign up</Link>
          </p>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
            <p className="text-xs text-green-400/60 mb-2 font-medium">🚀 Demo Accounts</p>
            {[
              { role: 'Donor', email: 'donor@foodlyx.com', pass: 'pass123' },
              { role: 'NGO', email: 'ngo@foodlyx.com', pass: 'pass123' },
              { role: 'Animal Shelter', email: 'animal@foodlyx.com', pass: 'pass123' },
              { role: 'Compost Unit', email: 'compost@foodlyx.com', pass: 'pass123' },
              { role: 'Admin', email: 'admin@foodlyx.com', pass: 'admin123' },
            ].map(({ role, email, pass }) => (
              <button type="button" key={role}
                onClick={() => performLogin({ email, password: pass })}
                className="block w-full text-left text-xs text-green-400/60 hover:text-green-400 py-1 transition-colors"
              >
                {role}: <span className="text-green-300/50">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
