import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight } from 'lucide-react';

export default function SubscriptionRequired() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen hero-bg flex flex-col justify-center items-center px-4 text-white">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-2">Subscription Required 🚫</h1>
          <p className="text-green-300/70">
            Please subscribe to access this feature
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/subscribe"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-4 font-semibold text-black transition hover:bg-green-500"
          >
            View Standard Subscription
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-transparent px-6 py-4 font-semibold text-green-300 transition hover:bg-green-500/20"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-green-400/70">
          <p>Need help? Email support@foodlyx.com</p>
        </div>
      </div>
    </div>
  );
}
