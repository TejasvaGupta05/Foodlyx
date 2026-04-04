import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import backend from '../api/backend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('foodlyx_user') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('foodlyx_user', JSON.stringify(user));
    } catch {
      // ignore localStorage write errors
    }
  }, [user]);

  useEffect(() => {
    const syncBackend = async (profile) => {
      try {
        const response = await backend.post('/users/sync', {
          firebaseUid: profile.uid,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          location: profile.location,
        });

        setUser((prev) => ({
          ...prev,
          backendId: response._id,
          subscription: response.subscription || null,
        }));
      } catch (err) {
        console.warn('Backend sync failed:', err.message);
      }
    };

    if (user?.uid) {
      syncBackend(user);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (db) {
          try {
            const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (docSnap.exists()) {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
            }
          } catch (err) {
            console.warn('Could not fetch Firestore profile:', err.message);
            setUser((prev) => prev ?? { uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
          }
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'donor' });
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
    setUser(null);
    try {
      localStorage.removeItem('foodlyx_user');
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured || !auth) {
      return;
    }

    try {
      await signOut(auth);
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

