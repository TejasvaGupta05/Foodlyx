import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, XCircle } from 'lucide-react';
import backend from '../api/backend';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Confirming your subscription...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setMessage('Missing session ID.');
      return;
    }

    const confirmSubscription = async () => {
      try {
        const response = await backend.get(`/subscriptions/confirm?sessionId=${encodeURIComponent(sessionId)}`);
        if (response.subscription) {
          setStatus('success');
          setMessage(`Your ${response.subscription.planName} is now active until ${new Date(response.subscription.expiryDate).toLocaleDateString()}.`);
        } else {
          setStatus('error');
          setMessage('Payment succeeded but subscription confirmation failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Could not confirm payment.');
      }
    };

    confirmSubscription();
  }, [searchParams]);

  return (
    <div className="min-h-screen hero-bg pt-24 px-4 pb-16 flex items-center justify-center text-white">
      <div className="max-w-2xl glass border border-green-500/20 p-10 text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-500/10 text-green-300 flex items-center justify-center border border-green-500/30">
          {status === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>
        <h1 className="text-3xl font-black mb-4">{status === 'success' ? 'Subscription Activated' : 'Subscription Confirmation Failed'}</h1>
        <p className="text-green-300/70 mb-8">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/subscribe" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 px-6 py-3 text-green-200 hover:bg-green-500/10 transition">
            View Subscription
          </Link>
          <button onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-black font-semibold hover:bg-green-500 transition">
            Back to Home <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
