import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveFeed from './pages/LiveFeed';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SubscriptionHistory from './pages/SubscriptionHistory';
import AnimalShelterDashboard from './pages/AnimalShelterDashboard';
import CompostUnitDashboard from './pages/CompostUnitDashboard';
import Community from './pages/Community';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <SubscriptionProvider>
      <BrowserRouter>
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/feed" element={<LiveFeed />} />
          <Route path="/community" element={<Community />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/subscription-history" element={<SubscriptionHistory />} />
          <Route path="/donor" element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ngo" element={
            <ProtectedRoute allowedRoles={['ngo', 'animal_shelter', 'compost_unit']}>
              <NGODashboard />
            </ProtectedRoute>
          } />
          <Route path="/compost" element={
            <ProtectedRoute allowedRoles={['compost_unit']}>
              <CompostUnitDashboard />
            </ProtectedRoute>
          } />
          <Route path="/shelter" element={
            <ProtectedRoute allowedRoles={['animal_shelter']}>
              <AnimalShelterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SubscriptionProvider>
  );
}
