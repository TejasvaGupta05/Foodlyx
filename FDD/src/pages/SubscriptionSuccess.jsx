import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react';
import plate5 from '../assets/graphics/Food_Plate_Graphic5.png';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  // In the new Razorpay flow, this page is navigated to on success
  const isSuccess = true; // Always show success when landed here

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 60%, #FFF7ED 100%)' }}
    >
      <img src={plate5} alt="" className="absolute -bottom-6 right-0 w-48 h-48 object-contain opacity-10 animate-float-1 pointer-events-none" />

      <div
        className="w-full max-w-md text-center relative z-10 slide-up"
        style={{ background: '#FFFFFF', borderRadius: '28px', boxShadow: '0 20px 60px rgba(34,197,94,0.12)', border: '1px solid #DCFCE7', padding: '48px 40px' }}
      >
        {/* Success icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', border: '3px solid #22C55E' }}
        >
          <CheckCircle2 className="w-12 h-12" style={{ color: '#16A34A' }} />
        </div>

        {/* Confetti emoji row */}
        <div className="text-3xl mb-4">🎉🍱✨</div>

        <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
          Subscription Activated!
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: '#64748B' }}>
          Welcome to the Foodlyx family! Your dashboard is now fully unlocked. Start accepting food donations and making a real difference today.
        </p>

        {/* Impact preview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { emoji: '🍽️', label: 'Accept Requests' },
            { emoji: '📡', label: 'Live Feed Access' },
            { emoji: '📊', label: 'Impact Dashboard' },
          ].map(({ emoji, label }) => (
            <div key={label} className="p-3 rounded-xl flex flex-col items-center gap-1" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/ngo')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base transition-all hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}
          >
            Go to My Dashboard <ArrowRight className="w-5 h-5" />
          </button>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0' }}
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
