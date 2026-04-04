// MOCK LOCAL DATABASE WITH COMMUNITY

let _db;
try {
  _db = JSON.parse(localStorage.getItem('foodlyx_db'));
} catch (e) {}

// Initialize with rich dummy data, community data, and specific quick-login accounts
if (!_db || !_db.users || !_db.users.find(u => u.email === 'donor@foodlyx.com') || !_db.communityPosts) {
  _db = { users: [], requests: [], communityPosts: [], idCounter: 100 };
  
  _db.users = [
    { _id: 'demo_donor', name: 'Premium Foods', email: 'donor@foodlyx.com', role: 'donor', password: 'pass123', token: 'demo-token-1', impactScore: 2450 },
    { _id: 'demo_ngo', name: 'Helping Hands NGO', email: 'ngo@foodlyx.com', role: 'ngo', password: 'pass123', token: 'demo-token-2', impactScore: 8900 },
    { _id: 'demo_animal', name: 'Safe Paws Shelter', email: 'animal@foodlyx.com', role: 'animal_shelter', password: 'pass123', token: 'demo-token-3', impactScore: 1200 },
    { _id: 'demo_compost', name: 'Green Earth Compost', email: 'compost@foodlyx.com', role: 'compost_unit', password: 'pass123', token: 'demo-token-4', impactScore: 300 },
    { _id: 'demo_admin', name: 'System Admin', email: 'admin@foodlyx.com', role: 'admin', password: 'admin123', token: 'demo-token-5', impactScore: 0 }
  ];
  
  _db.requests = [
    { _id: 'r1', donorId: 'demo_donor', donorDetails: { businessName: 'Premium Foods' }, foodType: 'Cooked Meals', foodName: 'Veg Thali', quantity: 50, quantityUnit: 'plates', shelfLifeHours: 4, category: 'fresh_food', status: 'pending', urgency: 'high', foodQualityStatus: 'Fresh', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: 'r2', donorId: 'demo_donor', donorDetails: { businessName: 'Fresh Bakes' }, foodType: 'Bread / Bakery', foodName: 'Assorted Bread', quantity: 20, quantityUnit: 'kg', shelfLifeHours: 24, category: 'dry_food', status: 'accepted', ngoId: 'demo_ngo', acceptedBy: _db.users[1], urgency: 'medium', foodQualityStatus: 'Safe', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { _id: 'r3', donorId: 'demo_donor', donorDetails: { businessName: 'Pizza Haven' }, foodType: 'Packaged Food', foodName: 'Frozen Pizzas', quantity: 15, quantityUnit: 'packets', shelfLifeHours: 48, category: 'packaged_food', status: 'delivered', ngoId: 'demo_ngo', acceptedBy: _db.users[1], urgency: 'low', foodQualityStatus: 'Safe', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'r4', donorId: 'u99', donorDetails: { businessName: 'Local Market' }, foodType: 'Fruits / Vegetables', foodName: 'Overripe Bananas', quantity: 30, quantityUnit: 'kg', shelfLifeHours: 12, category: 'perishable_food', status: 'pending', urgency: 'medium', foodQualityStatus: 'Risky / not recommended', createdAt: new Date(Date.now() - 50000).toISOString() }
  ];

  _db.communityPosts = [
    { _id: 'cp1', authorName: 'Safe Paws Shelter', authorRole: 'animal_shelter', text: 'Thank you @PremiumFoods for donating 30kg of overripe fruit today! The animals loved it. Zero waste!', likes: 124, category: 'success', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: 'cp2', authorName: 'Helping Hands NGO', authorRole: 'ngo', text: 'We are organizing a massive food drive this weekend in the downtown area. Calling all donors to pitch in whatever excess you have.', likes: 89, category: 'announcement', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];
  
  localStorage.setItem('foodlyx_db', JSON.stringify(_db));
}

const getDB = () => JSON.parse(localStorage.getItem('foodlyx_db'));
const setDB = (db) => localStorage.setItem('foodlyx_db', JSON.stringify(db));
const delay = ms => new Promise(res => setTimeout(res, ms));

const getUserIdFromToken = () => {
  const user = JSON.parse(localStorage.getItem('foodlyx_user') || 'null');
  return user ? user._id : null;
};

const api = {
  get: async (url) => {
    await delay(200);
    const db = getDB();
    if (url === '/community/posts') {
      return { data: db.communityPosts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) };
    }
    if (url === '/community/leaderboard') {
      return { data: db.users.filter(u => u.role === 'donor' || u.role === 'ngo').sort((a,b) => b.impactScore - a.impactScore).slice(0,10) };
    }
    if (url === '/requests') {
      return { data: db.requests.filter(r => r.status === 'pending') };
    }
    if (url === '/requests/my') {
      const uId = getUserIdFromToken();
      const user = db.users.find(u => u._id === uId);
      if (user?.role === 'ngo' || user?.role === 'animal_shelter') return { data: db.requests.filter(r => r.ngoId === uId) };
      return { data: db.requests.filter(r => r.donorId === uId) };
    }
    if (url === '/stats/dashboard' || url === '/stats') {
      const totalRequests = db.requests.length;
      const delivered = db.requests.filter((req) => req.status === 'delivered').length;
      const pending = db.requests.filter((req) => req.status === 'pending').length;
      const accepted = db.requests.filter((req) => req.status === 'accepted').length;
      const cancelled = db.requests.filter((req) => req.status === 'cancelled').length;
      const mealsSaved = db.requests.filter((req) => req.status === 'delivered').reduce((sum, req) => sum + (req.quantity || 0), 0);
      const wasteDiverted = db.requests.filter((req) => req.status === 'delivered' && ['semi_edible', 'non_edible'].includes(req.category)).reduce((sum, req) => sum + (req.quantity || 0), 0);
      const topDonors = db.users.filter((u) => u.role === 'donor').sort((a,b) => b.impactScore - a.impactScore).slice(0,5).map((user) => ({ name: user.name, email: user.email, impactScore: user.impactScore }));
      const categoryBreakdown = Object.entries(db.requests.reduce((acc, req) => {
        acc[req.category] = (acc[req.category] || 0) + 1;
        return acc;
      }, {})).map(([key, value]) => ({ _id: key, count: value }));

      const dayBuckets = {};
      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        dayBuckets[key] = 0;
      }
      db.requests.forEach((req) => {
        const dateKey = new Date(req.createdAt).toISOString().split('T')[0];
        if (dayBuckets.hasOwnProperty(dateKey)) dayBuckets[dateKey] += 1;
      });
      const dailyTrend = Object.entries(dayBuckets).map(([key, count]) => ({ _id: key, count }));
      const ngoCount = db.users.filter((u) => u.role === 'ngo').length;
      const donorCount = db.users.filter((u) => u.role === 'donor').length;
      const statusBreakdown = Object.entries(db.requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})).map(([key, value]) => ({ _id: key, count: value }));

      return {
        data: {
          totalRequests,
          delivered,
          pending,
          accepted,
          cancelled,
          mealsSaved,
          wasteDiverted,
          topDonors,
          categoryBreakdown,
          statusBreakdown,
          dailyTrend,
          ngoCount,
          donorCount,
        },
      };
    }
    if (url === '/stats/users') return { data: db.users };
    if (url.startsWith('/requests/all')) {
      const parsedUrl = new URL(url, 'http://localhost');
      const donor = parsedUrl.searchParams.get('donor')?.toLowerCase() || '';
      const ngo = parsedUrl.searchParams.get('ngo')?.toLowerCase() || '';
      const location = parsedUrl.searchParams.get('location')?.toLowerCase() || '';
      const search = parsedUrl.searchParams.get('search')?.toLowerCase() || '';
      const fromDate = parsedUrl.searchParams.get('fromDate');
      const toDate = parsedUrl.searchParams.get('toDate');
      const status = parsedUrl.searchParams.get('status');
      let requests = db.requests;

      if (status) requests = requests.filter((req) => req.status === status);
      if (fromDate) {
        const from = new Date(fromDate);
        requests = requests.filter((req) => new Date(req.createdAt) >= from);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        requests = requests.filter((req) => new Date(req.createdAt) <= to);
      }
      if (donor) requests = requests.filter((req) => (req.donorId?.name || req.donorDetails?.businessName || '').toLowerCase().includes(donor));
      if (ngo) requests = requests.filter((req) => (req.acceptedBy?.name || '').toLowerCase().includes(ngo));
      if (location) requests = requests.filter((req) => (req.donorDetails?.pickupAddress || req.location?.address || '').toLowerCase().includes(location));
      if (search) {
        requests = requests.filter((req) => {
          const donorName = (req.donorId?.name || req.donorDetails?.businessName || '').toLowerCase();
          const ngoName = (req.acceptedBy?.name || '').toLowerCase();
          const locationText = (req.donorDetails?.pickupAddress || req.location?.address || '').toLowerCase();
          const foodText = (req.foodName || req.foodType || '').toLowerCase();
          const statusText = (req.status || '').toLowerCase();
          return [donorName, ngoName, locationText, foodText, statusText].some((value) => value.includes(search));
        });
      }
      return { data: requests };
    }
    return { data: [] };
  },
  post: async (url, payload) => {
    await delay(300);
    const db = getDB();
    
    if (url === '/auth/login') {
      const user = db.users.find(u => u.email === payload.email && u.password === payload.password);
      if (user) return { data: user };
      return Promise.reject({ response: { data: { message: 'Invalid email or password.' } } });
    }
    
    if (url === '/auth/signup' || url === '/auth/register') {
      if (db.users.find(u => u.email === payload.email)) return Promise.reject({ response: { data: { message: 'Email exists.' } } });
      db.idCounter++;
      const newUser = { _id: 'u' + db.idCounter, ...payload, impactScore: 0, token: 'fake-token-' + db.idCounter };
      db.users.push(newUser);
      setDB(db);
      return { data: newUser };
    }

    if (url === '/community/posts') {
      db.idCounter++;
      const uId = getUserIdFromToken();
      const user = db.users.find(u => u._id === uId);
      const post = { _id: 'cp' + db.idCounter, text: payload.text, category: payload.category || 'general', authorName: user.name, authorRole: user.role, likes: 0, createdAt: new Date().toISOString() };
      db.communityPosts.unshift(post);
      setDB(db);
      return { data: post };
    }
    
    if (url === '/requests') { 
      db.idCounter++;
      const newReq = { ...payload, _id: 'r' + db.idCounter, donorId: getUserIdFromToken(), donorDetails: { businessName: payload.donorBusinessName || 'Donor' }, status: 'pending', createdAt: new Date().toISOString() };
      db.requests.unshift(newReq);
      setDB(db);
      return { data: newReq };
    }

    if (url.startsWith('/requests/') && url.endsWith('/accept')) {
      const reqId = url.split('/')[2];
      const reqIndex = db.requests.findIndex(r => r._id === reqId);
      if (reqIndex !== -1) {
        db.requests[reqIndex].status = 'accepted';
        db.requests[reqIndex].ngoId = getUserIdFromToken();
        db.requests[reqIndex].acceptedBy = db.users.find(u => u._id === db.requests[reqIndex].ngoId);
        setDB(db);
        return { data: db.requests[reqIndex] };
      }
    }
    return Promise.reject({ response: { data: { message: 'Not Found' } } });
  },
  patch: async (url, payload) => {
    await delay(200);
    const db = getDB();
    if (url.startsWith('/requests/') && url.endsWith('/deliver')) {
      const reqId = url.split('/')[2];
      const reqIndex = db.requests.findIndex(r => r._id === reqId);
      if (reqIndex !== -1) {
        db.requests[reqIndex].status = 'delivered';
        setDB(db);
        return { data: db.requests[reqIndex] };
      }
    }
    if (url.startsWith('/community/posts/') && url.endsWith('/like')) {
      const postId = url.split('/')[3];
      const p = db.communityPosts.find(p => p._id === postId);
      if (p) { p.likes++; setDB(db); return { data: p }; }
    }
    return Promise.reject({ response: { data: { message: 'Not found' } } });
  }
};

api.interceptors = { request: { use: () => {} }, response: { use: () => {} } };
export default api;
