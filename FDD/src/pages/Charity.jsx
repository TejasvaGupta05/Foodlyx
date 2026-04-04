import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Check } from 'lucide-react';
import api from '../api/axios';

const presetAmounts = [10, 25, 50, 100, 250, 500];

export default function Charity() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    message: '',
  });

  const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (finalAmount < 1) {
      setError('Please select or enter a valid donation amount (minimum ₹1)');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/charity/donate', {
        donorName: form.donorName,
        donorEmail: form.donorEmail,
        donorPhone: form.donorPhone,
        amount: finalAmount,
        message: form.message,
      });
      setSuccess(`Thank you! Your ₹${finalAmount} donation has been received. 🙏`);
      setTimeout(() => {
        setForm({ donorName: '', donorEmail: '', donorPhone: '', message: '' });
        setSelectedAmount(null);
        setCustomAmount('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-green-400 hover:text-green-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Support Beyond Surplus</h1>
          <p className="text-green-300/70 text-lg max-w-3xl leading-relaxed">
            Not everyone has surplus food to donate — but everyone can still make a difference. If you wish to contribute out of goodwill, you can support Foodlyx through voluntary donations. Your contribution helps us manage food collection, transportation, storage, and distribution to those in need.
          </p>
        </div>

        <div className="glass p-8 border-2 border-green-500/30 mb-12">
          {error && <div className="glass border border-red-500/30 bg-red-500/10 p-4 rounded-xl text-red-400 mb-6">{error}</div>}
          {success && (
            <div className="glass border border-green-500/30 bg-green-500/10 p-4 rounded-xl text-green-400 mb-6 flex items-center gap-3">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Amount Selection */}
            <div>
              <h2 className="font-bold text-white text-lg mb-4">Choose an Amount or Enter Your Own</h2>
              <p className="text-green-400/60 text-sm mb-4">Every small step counts. Whether it's ₹10 or ₹1000, your kindness helps fight hunger and reduce food waste.</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                    className={`p-4 rounded-xl font-bold transition-all border-2 ${
                      selectedAmount === amount
                        ? 'bg-green-600 border-green-400 text-white glow'
                        : 'glass border-green-500/30 text-green-400 hover:border-green-400/60'
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-green-400/70 mb-2">Or Enter Custom Amount (₹)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="w-full rounded-xl border border-green-900/50 bg-black/20 px-4 py-3 text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                  placeholder="Enter amount (e.g., 150)"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            {/* Donor Details */}
            <div className="border-t border-green-500/20 pt-8">
              <h2 className="font-bold text-white text-lg mb-4">Your Details</h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-green-400/70 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.donorName}
                    onChange={(e) => setForm((prev) => ({ ...prev, donorName: e.target.value }))}
                    className="w-full rounded-xl border border-green-900/50 bg-black/20 px-4 py-3 text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-green-400/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.donorEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, donorEmail: e.target.value }))}
                    className="w-full rounded-xl border border-green-900/50 bg-black/20 px-4 py-3 text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-green-400/70 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={form.donorPhone}
                  onChange={(e) => setForm((prev) => ({ ...prev, donorPhone: e.target.value }))}
                  className="w-full rounded-xl border border-green-900/50 bg-black/20 px-4 py-3 text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Message */}
            <div className="border-t border-green-500/20 pt-8">
              <label className="block text-xs uppercase tracking-widest text-green-400/70 mb-2">Message (Optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full rounded-xl border border-green-900/50 bg-black/20 px-4 py-3 text-white placeholder:text-green-400/40 outline-none focus:border-green-400/60 focus:ring-2 focus:ring-green-500/20 resize-none"
                placeholder="Share why you're donating or a message of support"
                rows="3"
              />
            </div>

            {/* Summary */}
            {finalAmount > 0 && (
              <div className="glass p-6 border-2 border-green-500/30 bg-green-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400/60 text-sm">Donation Amount</p>
                    <p className="text-3xl font-black text-white">₹{finalAmount}</p>
                  </div>
                  <Heart className="w-12 h-12 text-red-400/60" />
                </div>
                <p className="text-xs text-green-400/60 mt-4">100% of your contribution goes towards helping deliver food to those who need it most.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || finalAmount < 1}
              className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all glow"
            >
              {submitting ? 'Processing...' : `Donate ₹${finalAmount || '0'}`}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-green-400/60 text-sm">💚 Every small step counts. Your kindness saves lives.</p>
        </div>
      </div>
    </div>
  );
}
