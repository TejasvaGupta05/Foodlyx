import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Trophy, MessageSquare, Heart, Medal, MapPin } from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const [postsRes, lbRes] = await Promise.all([
        api.get('/community/posts'),
        api.get('/community/leaderboard')
      ]);
      setPosts(postsRes.data);
      setLeaderboard(lbRes.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCommunityData(); }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;
    setPosting(true);
    try {
      const res = await api.post('/community/posts', { text: newPost, category: 'general' });
      setPosts([res.data, ...posts]);
      setNewPost('');
    } catch { } finally { setPosting(false); }
  };

  const likePost = async (id) => {
    if(!user) return;
    try {
      await api.patch(`/community/posts/${id}/like`);
      setPosts(posts.map(p => p._id === id ? { ...p, likes: p.likes + 1 } : p));
    } catch {}
  };

  const getRankStyle = (index) => {
     if(index === 0) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
     if(index === 1) return 'bg-gray-300/20 border-gray-300/50 text-gray-300';
     if(index === 2) return 'bg-amber-700/20 border-amber-700/50 text-amber-600';
     return 'bg-green-900/10 border-green-900/30 text-green-400/70 hover:bg-green-800/20';
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="mb-2">
             <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-green-400" /> Community Hub
             </h1>
             <p className="text-sm text-green-400/60 mt-1">Connect with local heroes making zero-waste a reality.</p>
           </div>

           {/* Create Post Box */}
           {user ? (
             <form onSubmit={handlePostSubmit} className="glass p-5 flex flex-col gap-3 fade-in">
               <textarea 
                  value={newPost} onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your success story or announce a local food drive..."
                  className="w-full bg-green-900/10 border border-green-900/40 rounded-xl p-4 text-sm text-white resize-none focus:outline-none focus:border-green-500/50 min-h-[100px]"
               />
               <div className="flex justify-between items-center">
                  <span className="text-xs text-green-400/40 hidden sm:block">Posts are public to all Foodlyx members.</span>
                  <button type="submit" disabled={posting || !newPost.trim()} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                     {posting ? 'Publishing...' : 'Share Update'}
                  </button>
               </div>
             </form>
           ) : (
             <div className="glass p-5 text-center text-green-400/50 text-sm py-8">
                Log in to post your own success stories to the global network.
             </div>
           )}

           {/* Feed */}
           <div className="flex flex-col gap-4">
             {loading ? <div className="text-green-400/40 text-center py-10 animate-pulse">Loading Feed...</div> : 
               posts.map(post => (
                  <div key={post._id} className="glass p-5 hover:border-green-500/30 transition-colors">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center justify-center uppercase">
                              {post.authorName.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-white font-medium text-sm">{post.authorName}</h4>
                              <p className="text-[10px] uppercase tracking-wider text-green-400/60">{post.authorRole.replace('_', ' ')}</p>
                           </div>
                        </div>
                        <span className="text-xs text-green-400/40">
                           {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                     <p className="text-green-100/80 text-sm mb-4 leading-relaxed">{post.text}</p>
                     
                     <div className="flex items-center gap-4 border-t border-green-900/30 pt-3">
                        <button onClick={() => likePost(post._id)} className="flex items-center gap-1.5 text-xs text-green-400/60 hover:text-red-400 transition-colors">
                           <Heart className="w-4 h-4" /> {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
                        </button>
                     </div>
                  </div>
               ))
             }
           </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1">
           <div className="glass p-6 sticky top-24 glow">
              <div className="flex items-center gap-2 mb-6 border-b border-green-900/30 pb-4">
                 <Trophy className="w-5 h-5 text-yellow-400" />
                 <h2 className="font-bold text-white uppercase tracking-wider text-sm">Impact Leaderboard</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                 {loading ? <div className="text-xs text-green-400/40 text-center py-4">Crunching numbers...</div> : 
                   leaderboard.map((u, i) => (
                      <div key={u._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${getRankStyle(i)}`}>
                         <div className="flex items-center gap-3">
                            <span className="font-black opacity-50 px-1">#{i + 1}</span>
                            <div>
                               <p className="font-semibold text-sm truncate max-w-[120px]">{u.name}</p>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-xs font-black tracking-wider">{u.impactScore.toLocaleString()}</span>
                            <span className="text-[9px] uppercase opacity-70">Impact Pts</span>
                         </div>
                      </div>
                   ))
                 }
                 
              </div>
              <div className="mt-6 text-[10px] text-green-400/40 text-center px-4">
                 Points algorithm evaluates successful volume, urgency handled, and streak frequency.
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
}
