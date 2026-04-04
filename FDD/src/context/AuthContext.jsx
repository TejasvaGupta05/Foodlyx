import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start with null — children render immediately, no loading gate
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Don't set baseUser immediately — wait for Firestore fetch first
        // This prevents the role:'donor' flash from overwriting a correct login
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
          // Can't reach Firestore — use whatever login() has already set (don't overwrite)
          // If user is not set yet (page refresh), set minimal auth data
          setUser(prev => prev ?? { uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
        }
      } else {
        setUser(null);
      }
    }, (error) => {
      console.error('Auth listener error:', error.message);
      setUser(null);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

