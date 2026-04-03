import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Leaf, Mail, Lock, User, MapPin, AlertCircle } from 'lucide-react';

const roles = [
  { value: 'donor', label: 'Food Donor' },
  { value: 'ngo', label: 'NGO / Shelter' },
  { value: 'animal_shelter', label: 'Animal Shelter' },
  { value: 'compost_unit', label: 'Compost Unit' },
];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor', lat: '', lng: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      const { data } = await api.post('/auth/signup', {
        name: form.name, email: form.email, password: form.password, role: form.role,
        location: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
      });
      login(data);
      if (data.role === 'donor') navigate('/donor');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/ngo');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

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
            <label className="text-xs text-green-400/60 mb-1.5 block">Location (Lat, Lng)</label>
            <div className="flex gap-2">
              <input type="text" name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude"
                className="flex-1 px-3 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
              <input type="text" name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude"
                className="flex-1 px-3 py-3 bg-green-900/10 border border-green-900/40 rounded-lg text-white placeholder:text-green-400/30 focus:outline-none focus:border-green-500/50 text-sm transition-colors" />
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
  );
}
