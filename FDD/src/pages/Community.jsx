import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp,
  getDocs, limit,
} from 'firebase/firestore';
import { Trophy, MessageSquare, Heart, Send, Users } from 'lucide-react';
import plate5 from '../assets/graphics/Food_Plate_Graphic5.png';

const ROLE_COLORS = {
  donor:          { bg: '#DCFCE7', text: '#16A34A', label: 'Donor'         },
  ngo:            { bg: '#DBEAFE', text: '#2563EB', label: 'NGO'           },
  animal_shelter: { bg: '#FEF3C7', text: '#D97706', label: 'Animal Shelter'},
  compost_unit:   { bg: '#ECFDF5', text: '#059669', label: 'Compost Unit'  },
};

const RANK_STYLES = [
  { gradient: 'linear-gradient(135deg,#F59E0B,#EAB308)', icon: '🥇', label: '1st' },
  { gradient: 'linear-gradient(135deg,#94A3B8,#64748B)', icon: '🥈', label: '2nd' },
  { gradient: 'linear-gradient(135deg,#D97706,#B45309)', icon: '🥉', label: '3rd' },
];

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newPost, setNewPost]       = useState('');
  const [posting, setPosting]       = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn('Community posts:', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('impactScore', 'desc'), limit(10)));
        setLeaderboard(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('Leaderboard:', err.message);
      }
    };
    fetch();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'communityPosts'), {
        text: newPost.trim(),
        authorId: user.uid,
        authorName: user.name || user.email?.split('@')[0] || 'Anonymous',
        authorRole: user.role || 'donor',
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setNewPost('');
    } catch (err) {
      console.error('Failed to post:', err.message);
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId, likedBy = []) => {
    if (!user) return;
    const alreadyLiked = likedBy.includes(user.uid);
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        likes: alreadyLiked ? Math.max(0, likedBy.length - 1) : likedBy.length + 1,
        likedBy: alreadyLiked ? likedBy.filter((id) => id !== user.uid) : [...likedBy, user.uid],
      });
    } catch (err) {
      console.warn('Like failed:', err.message);
    }
  };

  return (
    <div className="warm-page min-h-screen pt-20 pb-16 relative overflow-hidden">
      <img src={plate5} alt="" className="absolute right-4 top-28 w-32 h-32 object-contain opacity-10 animate-float-1 pointer-events-none hidden lg:block" />

      <div className="max-w-6xl mx-auto px-6">

        {/* Page header */}
        <div className="mb-10">
          <span className="warm-badge mb-3 inline-flex" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <Users className="w-3.5 h-3.5" /> Community Hub
          </span>
          <h1 className="text-4xl font-black mt-2" style={{ fontFamily: "'Playfair Display', serif", color: '#1C2B22' }}>
            Stories & Updates
          </h1>
          <p className="mt-2 text-base" style={{ color: '#64748B' }}>
            Connect with local heroes making zero-waste a reality. Share your wins. Inspire others.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── MAIN FEED ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Compose box */}
            {user ? (
              <form
                onSubmit={handlePostSubmit}
                className="warm-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
                  >
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1C2B22' }}>{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-xs capitalize" style={{ color: '#94A3B8' }}>{(user.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your food rescue success story, announce a local drive, or ask for help..."
                  className="w-full resize-none text-sm rounded-xl p-4 focus:outline-none transition-all min-h-[110px]"
                  style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1C2B22' }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Posts are visible to all Foodlyx members.</p>
                  <button
                    type="submit"
                    disabled={posting || !newPost.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {posting ? 'Publishing...' : 'Share'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="warm-card p-8 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#CBD5E1' }} />
                <p className="text-sm font-medium" style={{ color: '#64748B' }}>
                  <a href="/login" style={{ color: '#22C55E', fontWeight: 700 }}>Sign in</a> to post your own success stories
                </p>
              </div>
            )}

            {/* Posts feed */}
            {loading ? (
              <div className="flex flex-col items-center py-16">
                <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin mb-3" />
                <p className="text-sm" style={{ color: '#64748B' }}>Loading community feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="warm-card p-12 text-center">
                <div className="text-5xl mb-4">🌱</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1C2B22' }}>No posts yet!</h3>
                <p className="text-sm" style={{ color: '#64748B' }}>Be the first to share a food rescue update with the community.</p>
              </div>
            ) : (
              posts.map((post) => {
                const liked = user && (post.likedBy || []).includes(user.uid);
                const roleInfo = ROLE_COLORS[post.authorRole] || ROLE_COLORS.donor;
                return (
                  <div
                    key={post.id}
                    className="warm-card p-6 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Author */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
                        >
                          {(post.authorName || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm" style={{ color: '#1C2B22' }}>{post.authorName}</h4>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: roleInfo.bg, color: roleInfo.text }}
                          >
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}
                      </span>
                    </div>

                    {/* Post text */}
                    <p className="text-sm leading-relaxed mb-5" style={{ color: '#334155' }}>{post.text}</p>

                    {/* Like button */}
                    <div className="pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={() => likePost(post.id, post.likedBy || [])}
                        className="flex items-center gap-2 text-sm font-medium transition-all"
                        style={{ color: liked ? '#EF4444' : '#94A3B8' }}
                      >
                        <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
                        {post.likes || 0} {(post.likes || 0) === 1 ? 'Like' : 'Likes'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── LEADERBOARD SIDEBAR ── */}
          <div>
            <div className="warm-card p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <Trophy className="w-5 h-5" style={{ color: '#F59E0B' }} />
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: '#1C2B22' }}>
                  Impact Leaderboard
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#94A3B8' }}>No data yet — start donating to appear here!</p>
                ) : (
                  leaderboard.map((u, i) => {
                    const rank = RANK_STYLES[i];
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{
                          background: i < 3 ? 'rgba(34,197,94,0.04)' : '#F8FAFC',
                          border: i < 3 ? '1px solid #DCFCE7' : '1px solid #F1F5F9',
                        }}
                      >
                        {/* Rank icon */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                          style={{ background: rank ? rank.gradient : '#E2E8F0', color: rank ? '#FFFFFF' : '#64748B' }}
                        >
                          {rank ? rank.icon : `#${i + 1}`}
                        </div>

                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: '#1C2B22' }}>{u.name || 'Anonymous'}</p>
                          <p className="text-xs capitalize" style={{ color: '#94A3B8' }}>{(u.role || '').replace('_', ' ')}</p>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-sm" style={{ color: '#22C55E' }}>{(u.impactScore || 0).toLocaleString()}</p>
                          <p className="text-[10px] uppercase tracking-wide" style={{ color: '#94A3B8' }}>pts</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <p className="mt-5 text-xs text-center" style={{ color: '#CBD5E1' }}>
                Scores based on successful donations, urgency handled, and donation streak.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
