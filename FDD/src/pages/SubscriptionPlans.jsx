import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const plan = user ? {
    slug: 'STANDARD',
    name: user.role === 'animal_shelter' ? 'Plan for Shelter' : user.role === 'compost_unit' ? 'Plan for Compost Unit' : 'Plan for NGO',
    price: user.role === 'animal_shelter' ? 299 : user.role === 'compost_unit' ? 899 : 399,
    label: user.role === 'ngo' ? 'Recommended' : 'Standard',
    description: 'The only plan for your organization: handle donation requests and use full Foodlyx access.',
    features: ['Accept daily donation requests', 'Live food request access', 'Dashboard request history'],
    highlight: user.role === 'ngo',
  } : null;
  const plans = plan ? [plan] : [];

  useEffect(() => {
    if (!user) return;
    if (user.subscription?.status === 'active') {
      navigate(user.role === 'animal_shelter' ? '/shelter' : user.role === 'compost_unit' ? '/compost' : '/ngo');
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
      if (!plan) throw new Error('Invalid plan');

      // Call Firebase Function to create order
      const response = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, plan: planSlug }),
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
          const verifyResponse = await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        prefill: { name: user.name || '', email: user.email || '' },
        theme: { color: '#16A34A' },
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
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0a0f0d] pt-24 pb-16 px-4 text-[#111827] dark:text-white transition-all duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#16A34A] dark:text-green-400/70 font-semibold">Foodlyx Subscription</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 text-[#111827] dark:text-white">Get access to donation requests.</h1>
          <p className="mt-4 max-w-2xl mx-auto text-[#4B5563] dark:text-green-300/70">Pay once and unlock the Foodlyx dashboard, live donation request feeds, and permission to accept donation requests each day.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-1">
          {plans.map((planObj) => (
            <motion.div
              key={planObj.slug}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className={`rounded-[28px] p-8 border hover:shadow-xl transition-all duration-300 ${planObj.highlight ? 'border-[#16A34A] bg-[#FFFFFF] shadow-lg dark:border-green-400/40 dark:bg-white/10 dark:shadow-[0_25px_80px_rgba(16,185,129,0.18)]' : 'border-[#E5E7EB] bg-[#FFFFFF] shadow-md dark:border-green-900/40 dark:bg-black/30'} `}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-[#2563EB] dark:text-green-300/70 font-bold">{planObj.label}</p>
                  <h2 className="text-3xl font-black mt-3 text-[#111827] dark:text-white">{planObj.name}</h2>
                </div>
                {planObj.highlight && (
                  <div className="rounded-full bg-[#16A34A]/10 text-[#16A34A] dark:bg-green-500/20 dark:text-green-200 px-3 py-1 text-xs font-semibold">Recommended</div>
                )}
              </div>

              <p className="text-[#4B5563] dark:text-green-300/70 mb-8">{planObj.description}</p>

              <div className="mb-8 text-[#111827] dark:text-white">
                <span className="text-5xl font-black tracking-tight">₹{planObj.price}</span>
                <span className="text-sm text-[#6B7280] dark:text-green-400/70">/month</span>
              </div>

              <div className="space-y-3 mb-8">
                {planObj.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-[#111827] dark:text-green-100/90 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-green-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={loadingPlan === planObj.slug}
                onClick={() => handleSubscribe(planObj.slug)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#16A34A] px-5 py-3 font-semibold text-white transition-all duration-300 hover:bg-[#15803D] hover:shadow-lg disabled:opacity-70 dark:bg-green-600 dark:text-black dark:hover:bg-green-500"
              >
                {loadingPlan === planObj.slug ? 'Opening checkout...' : 'Choose Standard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 text-[#111827] shadow-md transition-all duration-300 dark:border-green-700/30 dark:bg-green-900/10 dark:text-green-200">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#2563EB] dark:text-green-300" />
            <h3 className="font-semibold">Why this plan works</h3>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 font-medium dark:border-green-500/10 dark:bg-black/20">Accept up to 2 donation requests per day</li>
            <li className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 font-medium dark:border-green-500/10 dark:bg-black/20">Access live donation feeds instantly</li>
            <li className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 font-medium dark:border-green-500/10 dark:bg-black/20">Subscription controls and history in dashboard</li>
            <li className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 font-medium dark:border-green-500/10 dark:bg-black/20">Secure payment and recurring processing</li>
          </ul>
        </div>

        <div className="mt-10 text-sm text-[#4B5563] dark:text-green-300/70 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4 text-[#16A34A] dark:text-inherit" /> Secure Razorpay checkout</span>
          <span>Need help? Email support@foodlyx.com</span>
        </div>
      </div>
    </div>
  );
}
