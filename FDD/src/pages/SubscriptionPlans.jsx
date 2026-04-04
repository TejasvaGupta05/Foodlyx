import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Sparkles, Shield, ArrowRight } from 'lucide-react';

const plans = [
  {
    slug: 'STANDARD',
    name: 'Standard Plan',
    price: 499,
    label: 'Standard',
    description: 'The only plan for NGOs and shelters: accept up to 2 donation requests per day and use full Foodlyx access.',
    features: ['Accept 2 donation requests per day', 'Live food request access', 'Dashboard request history'],
    highlight: true,
  },
];

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.subscription?.status === 'active') {
      navigate(user.role === 'animal_shelter' ? '/shelter' : '/ngo');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => setError('Failed to load payment system');
      document.body.appendChild(script);
    };

    if (!window.Razorpay) {
      loadRazorpay();
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const handleSubscribe = async (planSlug) => {
    setError('');
    setLoadingPlan(planSlug);
    try {
      const plan = plans.find(p => p.slug === planSlug);
      if (!plan) throw new Error('Invalid plan');

      // Call Firebase Function to create order
      const response = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          plan: planSlug,
        }),
      });

      const orderData = await response.json();

      if (!response.ok) throw new Error(orderData.error || 'Failed to create order');

      const options = {
        key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Foodlyx',
        description: `${plan.name} Subscription`,
        handler: async function (response) {
          // Verify payment
          const verifyResponse = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              uid: user.uid,
              plan: planSlug,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            navigate('/subscription-success');
          } else {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#10B981',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Subscription checkout failed');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="min-h-screen hero-bg pt-24 pb-16 px-4 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-green-400/70">NGO & Shelter Subscription</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-4">Get the standard plan for request access.</h1>
          <p className="mt-4 max-w-2xl mx-auto text-green-300/70">Pay once and unlock the Foodlyx dashboard, live donation request feeds, and permission to accept up to 2 donation requests each day.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-1">
          {plans.map((plan) => (
            <motion.div
              key={plan.slug}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className={`rounded-3xl p-6 border ${plan.highlight ? 'border-green-400/40 bg-white/10 shadow-[0_20px_50px_rgba(16,185,129,0.14)]' : 'border-green-900/40 bg-black/30'} `}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-green-300/70">{plan.label}</p>
                  <h2 className="text-2xl sm:text-3xl font-black mt-3">{plan.name}</h2>
                </div>
                {plan.highlight && (
                  <div className="rounded-full bg-green-500/20 text-green-200 px-3 py-1 text-xs font-semibold">Popular</div>
                )}
              </div>

              <p className="text-green-300/70 mb-8">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">₹{plan.price}</span>
                <span className="text-sm text-green-400/70">/month</span>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-green-100/90">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={loadingPlan === plan.slug}
                onClick={() => handleSubscribe(plan.slug)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-semibold text-black transition hover:bg-green-500 disabled:opacity-70"
              >
                {loadingPlan === plan.slug ? 'Opening checkout...' : 'Choose Standard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-green-700/30 bg-green-900/10 p-6 text-green-200">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-green-300" />
            <h3 className="font-semibold">Why this plan works</h3>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-2xl border border-green-500/10 bg-black/20 p-4">Accept up to 2 donation requests per day</li>
            <li className="rounded-2xl border border-green-500/10 bg-black/20 p-4">Access live donation feeds instantly</li>
            <li className="rounded-2xl border border-green-500/10 bg-black/20 p-4">Subscription controls and history in dashboard</li>
            <li className="rounded-2xl border border-green-500/10 bg-black/20 p-4">Secure payment and recurring processing</li>
          </ul>
        </div>

        <div className="mt-10 text-sm text-green-300/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Secure Razorpay checkout</span>
          <span>Need help? Email support@foodlyx.com</span>
        </div>
      </div>
    </div>
  );
}
