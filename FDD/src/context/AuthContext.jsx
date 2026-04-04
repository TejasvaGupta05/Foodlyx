import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start with null — children render immediately, no loading gate
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthProvider: onAuthStateChanged fired, firebaseUser:', firebaseUser?.uid);
      if (firebaseUser) {
        // Check if we already have user data from manual login() call (signup flow)
        // This prevents race conditions where Firestore fetch might fail temporarily
        if (user && user.uid === firebaseUser.uid) {
          // User data already set by login() call, don't overwrite
          setLoading(false);
          return;
        }
        
        try {
          const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (docSnap.exists()) {
            // Full profile from Firestore — has correct name, role, etc.
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
          } else {
            // No Firestore doc yet (new user) — minimum viable user
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
          }
        } catch (err) {
          console.warn('Could not fetch Firestore profile:', err.message);
          // Can't reach Firestore — use minimal auth data
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth listener error:', error.message);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // Add user as dependency to check for manual login

  const login = (userData) => {
    console.log('AuthProvider: login() called with:', userData);
    setUser(userData);
  };

  const logout = async () => {
    console.log('AuthProvider: logout() called');
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('AuthProvider: Logout error:', err);
    }
  };

  console.log('AuthProvider: Current user state:', user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

