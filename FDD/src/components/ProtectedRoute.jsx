import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkSubscription } from "../utils/checkSubscription";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const verify = async () => {
      if (user.uid?.startsWith('demo_') && user.subscription?.status === 'active') {
        setAllowed(true);
        return;
      }

      const isSubscribed = await checkSubscription(user.uid);

      if (!isSubscribed) {
        navigate("/subscription-required");
      } else {
        setAllowed(true);
      }
    };

    verify();
  }, [user, navigate]);

  if (allowed === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-lg">Checking access...</p>
    </div>
  );

  return children;
}