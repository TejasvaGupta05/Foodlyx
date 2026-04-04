import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track if login() was called manually so we don't let onAuthStateChanged overwrite it
  const manualLoginRef = useRef(false);

  useEffect(() => {
    // CRITICAL: Empty dependency array [] — this must ONLY run once.
    // If you add 'user' here, the listener re-fires on every login() call
    // and immediately sets user=null for demo/offline sessions.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If a manual login() was called recently (e.g. after signup or demo login),
        // skip the Firestore fetch to avoid a race condition that overwrites the correct user.
        if (manualLoginRef.current) {
          manualLoginRef.current = false;
          setLoading(false);
          return;
        }

        try {
          const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
          }
        } catch (err) {
          console.warn('Could not fetch Firestore profile:', err.message);
          setUser(prev => prev ?? { uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
        }
      } else {
        // Only clear user if it wasn't a manual (demo) login
        if (!manualLoginRef.current) {
          setUser(null);
        }
        manualLoginRef.current = false;
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth listener error:', error.message);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // ← Empty array: register listener exactly once, for the app's lifetime

  const login = (userData) => {
    // Mark that we're doing a manual login so onAuthStateChanged doesn't interfere
    manualLoginRef.current = true;
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem('foodlyx_user');
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured || !auth) {
      return;
    }

    manualLoginRef.current = false;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
