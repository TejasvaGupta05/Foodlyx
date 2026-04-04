import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveFeed from './pages/LiveFeed';
import Charity from './pages/Charity';
import AnimalShelterDashboard from './pages/AnimalShelterDashboard';
import CompostUnitDashboard from './pages/CompostUnitDashboard';
import Community from './pages/Community';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SubscriptionRequired from './pages/SubscriptionRequired';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SeedDemoAccounts from './pages/SeedDemoAccounts';
import UserProfile from './pages/UserProfile';
import { isFirebaseConfigured } from './firebase';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      {!isFirebaseConfigured && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-amber-500/95 text-black text-center py-3 px-4 shadow-lg">
          Firebase is not configured. Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code> and add your <code className="font-mono">VITE_FIREBASE_*</code> keys.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/feed" element={<LiveFeed />} />
        <Route path="/community" element={<Community />} />
        <Route path="/charity" element={<Charity />} />
        <Route path="/donor" element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/ngo" element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <NGODashboard />
          </ProtectedRoute>
        } />
        <Route path="/shelter" element={
          <ProtectedRoute allowedRoles={['animal_shelter']}>
            <AnimalShelterDashboard />
          </ProtectedRoute>
        } />
        <Route path="/compost" element={
          <ProtectedRoute allowedRoles={['compost_unit']}>
            <CompostUnitDashboard />
          </ProtectedRoute>
        } />
        <Route path="/subscribe" element={<SubscriptionPlans />} />
        <Route path="/subscribe/success" element={<SubscriptionSuccess />} />
        <Route path="/subscription-required" element={<SubscriptionRequired />} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/seed" element={<SeedDemoAccounts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
