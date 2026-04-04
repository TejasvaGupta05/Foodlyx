import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { CheckCircle, XCircle, Loader, Leaf } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    email: 'donor@foodlyx.com',
    password: 'pass123',
    name: 'Demo Donor',
    role: 'donor',
    location: { lat: 28.6139, lng: 77.2090 },
    impactScore: 320,
  },
  {
    email: 'ngo@foodlyx.com',
    password: 'pass123',
    name: 'Demo NGO',
    role: 'ngo',
    location: { lat: 19.0760, lng: 72.8777 },
    impactScore: 580,
  },
  {
    email: 'animal@foodlyx.com',
    password: 'pass123',
    name: 'Demo Animal Shelter',
    role: 'animal_shelter',
    location: { lat: 12.9716, lng: 77.5946 },
    impactScore: 210,
  },
  {
    email: 'compost@foodlyx.com',
    password: 'pass123',
    name: 'Demo Compost Unit',
    role: 'compost_unit',
    location: { lat: 17.3850, lng: 78.4867 },
    impactScore: 140,
  },
  {
    email: 'admin@foodlyx.com',
    password: 'admin123',
    name: 'Foodlyx Admin',
    role: 'admin',
    location: { lat: 28.6139, lng: 77.2090 },
    impactScore: 1000,
  },
];

export default function SeedDemoAccounts() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addResult = (email, status, message) => {
    setResults(prev => [...prev, { email, status, message }]);
  };

  const runSeed = async () => {
    setRunning(true);
    setResults([]);
    setDone(false);

    for (const account of DEMO_ACCOUNTS) {
      const { email, password, name, role, location, impactScore } = account;
      try {
        // Check if Firestore doc already exists by trying to sign in first
        let uid;
        try {
          // Try logging in — if successful, user already exists in Auth
          const { user } = await signInWithEmailAndPassword(auth, email, password);
          uid = user.uid;

          // Check if Firestore doc exists
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            addResult(email, 'skip', '✅ Already exists — skipped');
            continue;
          }
          // Auth exists but no Firestore doc — just write the Firestore doc
        } catch (loginErr) {
          // User doesn't exist in Auth yet — create them
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          uid = user.uid;
        }

        // Write Firestore profile
        const userData = {
          name,
          email,
          role,
          location,
          isVerified: true,
          impactScore,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', uid), userData);
        addResult(email, 'success', '✅ Created successfully');
      } catch (err) {
        addResult(email, 'error', `❌ ${err.message}`);
      }
    }

    setRunning(false);
    setDone(true);
  };

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-lg glass p-8 glow fade-in">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <span className="font-bold text-lg gradient-text">FOODLYX</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Demo Account Seeder</h2>
        <p className="text-green-400/60 text-sm mb-6">
          This page creates all 5 demo accounts in Firebase Authentication and Firestore.
          Run it once — it will skip any accounts that already exist.
        </p>

        <div className="mb-6 p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
          <p className="text-xs text-green-400/60 font-medium mb-2">Accounts to be created:</p>
          {DEMO_ACCOUNTS.map(a => (
            <div key={a.email} className="flex justify-between text-xs text-green-300/70 py-1">
              <span>{a.email}</span>
              <span className="text-green-400/50">{a.role.replace('_', ' ')} / {a.password}</span>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mb-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                r.status === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-300' :
                r.status === 'skip' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' :
                'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {r.status === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> :
                 r.status === 'error' ? <XCircle className="w-4 h-4 flex-shrink-0" /> :
                 <CheckCircle className="w-4 h-4 flex-shrink-0 text-blue-400" />}
                <span className="font-mono text-xs">{r.email}</span>
                <span className="ml-auto text-xs opacity-70">{r.message}</span>
              </div>
            ))}
          </div>
        )}

        {done && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm text-center">
            🎉 Seeding complete! You can now use all demo accounts on the Login page.
          </div>
        )}

        <button
          onClick={runSeed}
          disabled={running}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          {running ? (
            <><Loader className="w-4 h-4 animate-spin" /> Creating accounts...</>
          ) : done ? (
            'Run Again'
          ) : (
            '🚀 Create Demo Accounts'
          )}
        </button>

        {done && (
          <a
            href="/login"
            className="block text-center mt-4 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            → Go to Login page
          </a>
        )}
      </div>
    </div>
  );
}
