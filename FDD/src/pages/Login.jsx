import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth, RoleSelectModal } from '../context/GoogleAuth';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, AlertCircle, ArrowRight, Leaf } from 'lucide-react';

// Plate graphic for decoration
import plate3 from '../assets/graphics/Food_Plate_Graphic3.png';
import plate5 from '../assets/graphics/Food_Plate_Graphic5.png';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const DEMO_ACCOUNTS = [
  { role: 'Donor',        email: 'donor@foodlyx.com',   pass: 'pass123'  },
  { role: 'NGO',          email: 'ngo@foodlyx.com',      pass: 'pass123'  },
  { role: 'Animal Shelter', email: 'animal@foodlyx.com', pass: 'pass123'  },
  { role: 'Compost Unit', email: 'compost@foodlyx.com',  pass: 'pass123'  },
  { role: 'Admin',        email: 'admin@foodlyx.com',    pass: 'admin123' },
];

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const {
    signInWithGoogle, googleLoading, googleError,
    pendingGoogleUser, handleRoleConfirm, handleRoleCancel,
  } = useGoogleAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLoginSuccess = (data) => {
    login(data);
    if (data.role === 'donor')         navigate('/donor');
    else if (data.role === 'admin')    navigate('/admin');
    else if (data.role === 'animal_shelter') navigate('/shelter');
    else if (data.role === 'compost_unit')   navigate('/compost');
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
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
        ]);
        if (docSnap.exists()) userData = { ...userData, ...docSnap.data() };
      } catch (firestoreErr) {
        console.warn('Could not load profile:', firestoreErr.message);
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
          isSubscribed: true,
          location: { lat: 28.6139, lng: 77.209 },
          impactScore: 100,
          subscription: {
            status: 'active',
            plan: roleMap[prefix] === 'animal_shelter' ? 'SHELTER_PLAN' : roleMap[prefix] === 'ngo' ? 'NGO_PLAN' : roleMap[prefix] === 'compost_unit' ? 'COMPOST_PLAN' : 'STANDARD',
            usageLimit: 100,
            usedRequests: 0,
            expiryDate: { seconds: Math.floor(Date.now() / 1000) + 31536000 },
          },
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

      <div
        className="min-h-screen flex items-center justify-center px-4 pt-16 pb-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #F0FDF4 100%)' }}
      >
        {/* Decorative floating plates */}
        <img src={plate3} alt="" className="absolute -left-8 bottom-12 w-40 h-40 object-contain opacity-20 animate-float-2 pointer-events-none hidden md:block" />
        <img src={plate5} alt="" className="absolute -right-4 top-24 w-32 h-32 object-contain opacity-20 animate-float-1 pointer-events-none hidden md:block" />

        <div
          className="w-full max-w-md relative z-10 slide-up"
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            border: '1px solid #F1F5F9',
            padding: '40px',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: '1px solid #DCFCE7' }}>
              <img src="/logo.jpeg" alt="Foodlyx" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xl tracking-wide" style={{ color: '#16A34A' }}>FOODLYX</span>
          </div>

          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>Sign in to continue your food rescue journey</p>

          {/* Error banner */}
          {(error || googleError) && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-5"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error || googleError}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 mb-5 rounded-xl font-medium text-sm transition-all disabled:opacity-60 hover:-translate-y-0.5"
            style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); performLogin(form); }} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <input
                  type="password" name="password" value={form.password} onChange={handleChange} required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 6px 20px rgba(34,197,94,0.35)' }}
            >
              {loading ? 'Signing in...' : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: '#16A34A' }}>Create one free</Link>
          </p>

          {/* Demo section */}
          <div className="mt-6 p-4 rounded-2xl" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
            <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#16A34A' }}>
              <Leaf className="w-3.5 h-3.5" /> Demo Accounts — click to log in instantly
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map(({ role, email, pass }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => performLogin({ email, password: pass })}
                  className="text-left text-xs px-3 py-2 rounded-lg transition-all hover:-translate-y-0.5"
                  style={{ background: '#FFFFFF', color: '#334155', border: '1px solid #DCFCE7' }}
                >
                  <span className="font-semibold block" style={{ color: '#16A34A' }}>{role}</span>
                  <span style={{ color: '#94A3B8', fontSize: '10px' }}>{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
