import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const provider = new GoogleAuthProvider();

const ROLE_LABELS = {
  donor: 'Food Donor',
  ngo: 'NGO',
  animal_shelter: 'Animal Shelter',
  compost_unit: 'Compost Unit',
};

// Role selection modal shown to new Google users
export function RoleSelectModal({ googleUser, onConfirm, onCancel }) {
  const [role, setRole] = useState('donor');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [donorCategory, setDonorCategory] = useState('individual');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!address || !contactPhone) {
      alert("Please enter your address and phone number.");
      return;
    }
    setSaving(true);
    await onConfirm({ role, address, contactPhone, donorCategory });
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#0f1a12', border: '1px solid rgba(74,222,128,0.2)',
        borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px',
        boxShadow: '0 0 40px rgba(74,222,128,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          {googleUser.photoURL && (
            <img src={googleUser.photoURL} alt="profile" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          )}
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', margin: 0 }}>
              Welcome, {googleUser.displayName}!
            </p>
            <p style={{ color: 'rgba(74,222,128,0.6)', fontSize: '12px', margin: 0 }}>
              {googleUser.email}
            </p>
          </div>
        </div>

        <p style={{ color: 'rgba(74,222,128,0.7)', fontSize: '13px', margin: '16px 0 12px' }}>
          Select your role to complete setup:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRole(value)}
              style={{
                padding: '12px 16px',
                background: role === value ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.04)',
                border: `1px solid ${role === value ? 'rgba(74,222,128,0.5)' : 'rgba(74,222,128,0.15)'}`,
                borderRadius: '10px',
                color: role === value ? '#4ade80' : 'rgba(74,222,128,0.6)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: role === value ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone Number" required style={{ width: '100%', padding: '10px 14px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full Address" required style={{ width: '100%', padding: '10px 14px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
          {role === 'donor' && (
            <select value={donorCategory} onChange={e => setDonorCategory(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}>
              <option value="individual" style={{ background: '#0f1a12' }}>Individual</option>
              <option value="mess" style={{ background: '#0f1a12' }}>Mess</option>
              <option value="hotels_restaurants" style={{ background: '#0f1a12' }}>Hotels/Restaurants</option>
              <option value="party_gathering" style={{ background: '#0f1a12' }}>Party/Gathering</option>
              <option value="other" style={{ background: '#0f1a12' }}>Other</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px', background: 'transparent',
              border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px',
              color: 'rgba(74,222,128,0.6)', cursor: 'pointer', fontSize: '13px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              flex: 2, padding: '12px', background: '#16a34a',
              border: 'none', borderRadius: '10px',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Setting up...' : 'Continue as ' + ROLE_LABELS[role]}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to use in Login & Signup pages
export function useGoogleAuth() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null); // New user needing role selection
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (role) => {
    if (role === 'donor') navigate('/donor');
    else if (role === 'admin') navigate('/admin');
    else if (role === 'animal_shelter') navigate('/shelter');
    else if (role === 'compost_unit') navigate('/compost');
    else navigate('/ngo');
  };

  const signInWithGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if Firestore profile already exists
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (docSnap.exists()) {
        // Returning user — log them in directly
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() };
        login(userData);
        navigateByRole(userData.role);
      } else {
        // New Google user — show role selection modal
        setPendingGoogleUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error(err);
        setGoogleError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleConfirm = async ({ role, address, contactPhone, donorCategory }) => {
    if (!pendingGoogleUser) return;
    try {
      const userData = {
        name: pendingGoogleUser.displayName || pendingGoogleUser.email.split('@')[0],
        email: pendingGoogleUser.email,
        photoURL: pendingGoogleUser.photoURL || '',
        role,
        address,
        contactPhone,
        donorCategory: role === 'donor' ? donorCategory : 'individual',
        location: { lat: 0, lng: 0 },
        isVerified: false,
        isSubscribed: false,
        impactScore: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', pendingGoogleUser.uid), userData);
      login({ uid: pendingGoogleUser.uid, ...userData });
      setPendingGoogleUser(null);
      navigateByRole(role);
    } catch (err) {
      console.error('Failed to save Google user profile:', err);
      setGoogleError('Failed to save profile. Please try again.');
    }
  };

  const handleRoleCancel = () => {
    setPendingGoogleUser(null);
  };

  return {
    signInWithGoogle,
    googleLoading,
    googleError,
    pendingGoogleUser,
    handleRoleConfirm,
    handleRoleCancel,
  };
}
