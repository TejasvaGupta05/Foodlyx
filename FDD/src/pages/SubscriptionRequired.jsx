import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, Heart } from 'lucide-react';
import plate2 from '../assets/graphics/Food_Plate_Graphic2.png';

export default function SubscriptionRequired() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #F0FDF4 100%)' }}
    >
      {/* Decorative plate */}
      <img src={plate2} alt="" className="absolute bottom-0 left-0 w-52 h-52 object-contain opacity-10 animate-float-2 pointer-events-none" />
      <img src={plate2} alt="" className="absolute top-12 right-4 w-36 h-36 object-contain opacity-10 animate-float-1 pointer-events-none transform scale-x-[-1]" />

      <div
        className="w-full max-w-md text-center relative z-10 slide-up"
        style={{ background: '#FFFFFF', borderRadius: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9', padding: '48px 40px' }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: '#FEF2F2', border: '2px solid #FECACA' }}
        >
          <Shield className="w-10 h-10" style={{ color: '#EF4444' }} />
        </div>

        <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
          Subscription Required
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: '#64748B' }}>
          To accept food donations and manage your dashboard, you need an active Foodlyx subscription.
          Join thousands of organisations already making an impact.
        </p>

        {/* Impact nudge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-8 text-left" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
          <Heart className="w-5 h-5 flex-shrink-0" style={{ color: '#22C55E' }} />
          <p className="text-sm" style={{ color: '#16A34A' }}>
            <strong>320+ organisations</strong> are already receiving food donations through Foodlyx every day.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/subscribe"
            className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base transition-all hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}
          >
            View Subscription Plans <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0' }}
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs" style={{ color: '#94A3B8' }}>
          Need help?{' '}
          <a href="mailto:support@foodlyx.in" style={{ color: '#22C55E' }}>support@foodlyx.in</a>
        </p>
      </div>
    </div>
  );
}
