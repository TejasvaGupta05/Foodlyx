import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Shield, ArrowRight, Star, Zap } from 'lucide-react';
import plate1 from '../assets/graphics/Food_Plate_Graphic.png';
import plate4 from '../assets/graphics/Food_Plate_Graphic4.png';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');

  const plan = user ? {
    slug: 'STANDARD',
    name: user.role === 'animal_shelter' ? 'Shelter Plan'
        : user.role === 'compost_unit'   ? 'Compost Unit Plan'
        : 'NGO Plan',
    price: user.role === 'animal_shelter' ? 299
         : user.role === 'compost_unit'   ? 899
         : 399,
    description: 'Unlock full Foodlyx access — accept donation requests, view live feeds, and manage deliveries from your dashboard.',
    features: [
      'Accept unlimited donation requests',
      'Live food request access & notifications',
      'Full dashboard with request history',
      'Priority listing in donor search',
      'Monthly impact reports',
    ],
  } : null;

  useEffect(() => {
    if (!user) return;
    if (user.subscription?.status === 'active') {
      navigate(user.role === 'animal_shelter' ? '/shelter'
             : user.role === 'compost_unit'   ? '/compost'
             : '/ngo');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!window.Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onerror = () => setError('Failed to load payment system');
      document.body.appendChild(s);
    }
  }, []);

  const handleSubscribe = async (planSlug) => {
    setError('');
    setLoadingPlan(planSlug);
    try {
      if (!plan) throw new Error('Invalid plan');
      const response = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, plan: planSlug }),
      });
      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error || 'Failed to create order');

      const rzp = new window.Razorpay({
        key: 'YOUR_RAZORPAY_KEY_ID',
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Foodlyx',
        description: `${plan.name} Subscription`,
        handler: async (response) => {
          const verify = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id, signature: response.razorpay_signature, uid: user.uid, plan: planSlug }),
          });
          const verifyData = await verify.json();
          if (verifyData.success) navigate('/subscription-success');
          else setError('Payment verification failed');
        },
        prefill: { name: user.name || '', email: user.email || '' },
        theme: { color: '#22C55E' },
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="warm-page min-h-screen pt-20 pb-16 relative overflow-hidden">
      {/* Decorative plates */}
      <img src={plate1} alt="" className="absolute -left-8 top-32 w-40 h-40 object-contain opacity-10 animate-float-2 pointer-events-none hidden lg:block" />
      <img src={plate4} alt="" className="absolute -right-6 bottom-24 w-36 h-36 object-contain opacity-10 animate-float-1 pointer-events-none hidden lg:block" />

      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="warm-badge mb-4 inline-flex" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Star className="w-3.5 h-3.5" /> Foodlyx Subscription
          </span>
          <h1 className="text-4xl font-black mt-4 mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Unlock Full Dashboard Access
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#64748B' }}>
            Pay once and access donation request feeds, accept food requests daily, and make a measurable community impact.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Pricing card */}
        {plan && (
          <div
            className="warm-card p-8 relative overflow-hidden mb-8"
            style={{ border: '2px solid #22C55E', boxShadow: '0 20px 60px rgba(34,197,94,0.15)' }}
          >
            {/* Recommended badge */}
            <div
              className="absolute top-0 right-0 px-4 py-1.5 text-xs font-bold text-white rounded-bl-2xl rounded-tr-[18px]"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
            >
              ✨ Recommended
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: '#22C55E' }}>Standard</p>
                <h2 className="text-2xl font-black" style={{ color: '#1C2B22' }}>{plan.name}</h2>
              </div>
              <div className="text-right">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black" style={{ color: '#1C2B22' }}>₹{plan.price}</span>
                  <span className="text-sm mb-2" style={{ color: '#64748B' }}>/month</span>
                </div>
              </div>
            </div>

            <p className="text-sm mb-8 leading-relaxed" style={{ color: '#64748B' }}>{plan.description}</p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DCFCE7' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#334155' }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan.slug)}
              disabled={!!loadingPlan}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-70 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}
            >
              {loadingPlan ? 'Opening checkout...' : <><Zap className="w-5 h-5" /> Get Full Access — ₹{plan.price}/mo</>}
              {!loadingPlan && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Why section */}
        <div className="warm-card p-7">
          <h3 className="font-bold text-base mb-5 flex items-center gap-2" style={{ color: '#1C2B22' }}>
            <Star className="w-4 h-4" style={{ color: '#F59E0B' }} /> Why this plan works
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Accept up to 2 donation requests per day',
              'Access live donation feeds instantly',
              'Full dashboard history & analytics',
              'Secure payment & easy cancellation',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#22C55E' }} />
                <span className="text-sm font-medium" style={{ color: '#334155' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm" style={{ color: '#94A3B8' }}>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: '#22C55E' }} /> Secure Razorpay checkout
          </span>
          <span>Need help? <a href="mailto:support@foodlyx.in" style={{ color: '#22C55E' }}>support@foodlyx.in</a></span>
        </div>
      </div>
    </div>
  );
}
