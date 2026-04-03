import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Leaf, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const performLogin = async (credentials) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      handleLoginSuccess(data);
    } catch (err) {
      // Fallback for Demo Accounts if backend is down (Network Error)
      const isDemoAccount = credentials.email.endsWith('@foodlyx.com');
      if (isDemoAccount && !err.response) {
        console.warn("Backend unreachable. Continuing with offline demo mode.");
        const roleMap = {
          'donor': 'donor',
          'ngo': 'ngo',
          'animal': 'animal_shelter',
          'compost': 'compost_unit',
          'admin': 'admin'
        };
        const prefix = credentials.email.split('@')[0];
        const mockData = {
          _id: 'demo_' + prefix,
          name: prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' (Offline Demo)',
          email: credentials.email,
          role: roleMap[prefix] || 'donor',
          isVerified: true,
          token: 'offline-demo-token',
          location: { lat: 28.6139, lng: 77.209 },
          impactScore: 100
        };
        handleLoginSuccess(mockData);
      } else {
        setError(err.response?.data?.message || 'Login failed. Backend might be down.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    login(data);
    if (data.role === 'donor') navigate('/donor');
    else if (data.role === 'admin') navigate('/admin');
    else if (data.role === 'animal_shelter') navigate('/shelter');
    else if (data.role === 'compost_unit') navigate('/compost');
    else navigate(`/${data.role}`); // Default to role-based route
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(form);
  };

  return (
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

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-green-400/60 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/40" />
              <input
                type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="donor@foodlyx.com"
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
            type="submit" disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-all mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-green-400/50 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-green-400 hover:text-green-300 font-medium">Sign up</Link>
        </p>

        {/* Quick access demo */}
        <div className="mt-6 p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
          <p className="text-xs text-green-400/60 mb-2 font-medium">🚀 Demo Accounts</p>
          {[
            { role: 'Donor', email: 'donor@foodlyx.com', pass: 'pass123' },
            { role: 'NGO', email: 'ngo@foodlyx.com', pass: 'pass123' },
            { role: 'Animal Shelter', email: 'animal@foodlyx.com', pass: 'pass123' },
            { role: 'Compost Unit', email: 'compost@foodlyx.com', pass: 'pass123' },
            { role: 'Admin', email: 'admin@foodlyx.com', pass: 'admin123' },
          ].map(({ role, email, pass }) => (
            <button
              type="button"
              key={role}
              onClick={() => {
                setForm({ email, password: pass });
                performLogin({ email, password: pass });
              }}
              className="block w-full text-left text-xs text-green-400/60 hover:text-green-400 py-1 transition-colors"
            >
              {role}: <span className="text-green-300/50">{email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
