import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

// ============ USERS ============

export const createUserProfile = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'donor',
      location: userData.location || { lat: 0, lng: 0 },
      isVerified: false,
      impactScore: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// ============ FOOD REQUESTS ============

export const createFoodRequest = async (donorId, requestData) => {
  try {
    const docRef = await addDoc(collection(db, 'foodRequests'), {
      donorId,
      donorDetails: requestData.donorDetails || {},
      foodType: requestData.foodType,
      foodName: requestData.foodName,
      quantity: requestData.quantity,
      quantityUnit: requestData.quantityUnit || 'kg',
      shelfLifeHours: requestData.shelfLifeHours,
      urgency: requestData.urgency || 'medium',
      category: requestData.category || 'fresh_food',
      location: requestData.location,
      status: 'pending',
      acceptedBy: null,
      pickedAt: null,
      deliveredAt: null,
      foodImage: requestData.foodImage || '',
      foodUsabilityCategory: requestData.foodUsabilityCategory,
      foodQualityStatus: requestData.foodQualityStatus || 'safe_but_urgent',
      qualityRecommendation: requestData.qualityRecommendation || 'human_donation',
      notes: requestData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Increment donor's impact score
    await updateUserProfile(donorId, {
      impactScore: increment(requestData.quantity || 0)
    });
    
    return { id: docRef.id, ...requestData };
  } catch (error) {
    console.error('Error creating food request:', error);
    throw error;
  }
};

export const getFoodRequests = async (filters = {}) => {
  try {
    let q = query(
      collection(db, 'foodRequests'),
      where('status', '==', filters.status || 'pending')
    );

    if (filters.category) {
      q = query(
        collection(db, 'foodRequests'),
        where('status', '==', filters.status || 'pending'),
        where('category', '==', filters.category)
      );
    }

    const querySnapshot = await getDocs(q);
    const requests = [];
    
    for (const docSnap of querySnapshot.docs) {
      const reqData = docSnap.data();
      let acceptedByUser = null;
      if (reqData.acceptedBy) {
        acceptedByUser = await getUserProfile(reqData.acceptedBy);
      }
      let donorUser = await getUserProfile(reqData.donorId);
      
      requests.push({
        _id: docSnap.id,
        ...reqData,
        acceptedBy: acceptedByUser,
        donorId: donorUser,
      });
    }
    
    return requests.sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));
  } catch (error) {
    console.error('Error fetching food requests:', error);
    throw error;
  }
};

export const getMyFoodRequests = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    const userRole = userProfile?.role;

    let q;
    if (userRole === 'ngo' || userRole === 'animal_shelter' || userRole === 'compost_unit') {
      q = query(
        collection(db, 'foodRequests'),
        where('acceptedBy', '==', userId)
      );
    } else {
      q = query(
        collection(db, 'foodRequests'),
        where('donorId', '==', userId)
      );
    }

    const querySnapshot = await getDocs(q);
    const requests = [];
    
    for (const docSnap of querySnapshot.docs) {
      const reqData = docSnap.data();
      let acceptedByUser = null;
      if (reqData.acceptedBy) {
        acceptedByUser = await getUserProfile(reqData.acceptedBy);
      }
      let donorUser = await getUserProfile(reqData.donorId);
      
      requests.push({
        _id: docSnap.id,
        ...reqData,
        acceptedBy: acceptedByUser,
        donorId: donorUser,
      });
    }
    
    return requests.sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));
  } catch (error) {
    console.error('Error fetching my food requests:', error);
    throw error;
  }
};

export const acceptFoodRequest = async (requestId, userId) => {
  try {
    await updateDoc(doc(db, 'foodRequests', requestId), {
      status: 'accepted',
      acceptedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error accepting food request:', error);
    throw error;
  }
};

export const deliverFoodRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'foodRequests', requestId), {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking as delivered:', error);
    throw error;
  }
};

export const cancelFoodRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'foodRequests', requestId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling food request:', error);
    throw error;
  }
};

// ============ FEEDBACK ============

export const submitFeedback = async (feedbackData, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'feedback'), {
      foodRequestId: feedbackData.foodRequestId,
      donationId: feedbackData.foodRequestId,
      deliveryId: feedbackData.deliveryId || null,
      receiverId: userId,
      donorId: feedbackData.donorId,
      facilityName: feedbackData.facilityName || '',
      rating: feedbackData.rating,
      feedbackText: feedbackData.feedbackText || '',
      complaintType: feedbackData.complaintType || 'none',
      complaintDescription: feedbackData.complaintDescription || '',
      resolutionStatus: 'pending',
      resolvedAt: null,
      resolvedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...feedbackData };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getFeedbackForRequest = async (foodRequestId) => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('foodRequestId', '==', foodRequestId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const feedbackData = querySnapshot.docs[0].data();
    const receiverUser = await getUserProfile(feedbackData.receiverId);
    const requestData = await getDoc(doc(db, 'foodRequests', foodRequestId));
    
    return {
      _id: querySnapshot.docs[0].id,
      ...feedbackData,
      receiverId: receiverUser,
      foodRequestId: requestData.data(),
    };
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

export const getFeedbackByReceiver = async (receiverId) => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('receiverId', '==', receiverId)
    );
    
    const querySnapshot = await getDocs(q);
    const feedbacks = [];
    
    for (const docSnap of querySnapshot.docs) {
      const fbData = docSnap.data();
      const donorUser = await getUserProfile(fbData.donorId);
      const requestData = await getDoc(doc(db, 'foodRequests', fbData.foodRequestId));
      
      feedbacks.push({
        _id: docSnap.id,
        ...fbData,
        donorId: donorUser,
        foodRequestId: requestData.data(),
      });
    }
    
    return feedbacks.sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));
  } catch (error) {
    console.error('Error fetching receiver feedback:', error);
    throw error;
  }
};

export const getFeedbackByDonor = async (donorId) => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('donorId', '==', donorId)
    );
    
    const querySnapshot = await getDocs(q);
    const feedbacks = [];
    
    for (const docSnap of querySnapshot.docs) {
      const fbData = docSnap.data();
      const receiverUser = await getUserProfile(fbData.receiverId);
      const requestData = await getDoc(doc(db, 'foodRequests', fbData.foodRequestId));
      
      feedbacks.push({
        _id: docSnap.id,
        ...fbData,
        receiverId: receiverUser,
        foodRequestId: requestData.data(),
      });
    }
    
    return feedbacks.sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));
  } catch (error) {
    console.error('Error fetching donor feedback:', error);
    throw error;
  }
};

export const resolveFeedback = async (feedbackId, userId) => {
  try {
    await updateDoc(doc(db, 'feedback', feedbackId), {
      resolutionStatus: 'resolved',
      resolvedAt: serverTimestamp(),
      resolvedBy: userId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resolving feedback:', error);
    throw error;
  }
};

// ============ COMMUNITY POSTS ============

export const getCommunityPosts = async () => {
  try {
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data();
      const authorUser = await getUserProfile(postData.authorId);
      
      posts.push({
        _id: docSnap.id,
        ...postData,
        authorName: authorUser?.name,
        authorRole: authorUser?.role,
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching community posts:', error);
    throw error;
  }
};

export const createCommunityPost = async (userId, postData) => {
  try {
    const user = await getUserProfile(userId);
    
    const docRef = await addDoc(collection(db, 'communityPosts'), {
      authorId: userId,
      authorName: user?.name,
      authorRole: user?.role,
      text: postData.text,
      category: postData.category || 'general',
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...postData };
  } catch (error) {
    console.error('Error creating community post:', error);
    throw error;
  }
};

export const likePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'communityPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) throw new Error('Post not found');
    
    const likedBy = postSnap.data().likedBy || [];
    const hasLiked = likedBy.includes(userId);
    
    if (hasLiked) {
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

// ============ STATS ============

export const getStats = async () => {
  try {
    const requestsQuery = query(collection(db, 'foodRequests'));
    const requestsSnap = await getDocs(requestsQuery);
    const requests = requestsSnap.docs.map(doc => doc.data());
    
    const usersQuery = query(collection(db, 'users'));
    const usersSnap = await getDocs(usersQuery);
    const users = usersSnap.docs.map(doc => doc.data());
    
    const totalRequests = requests.length;
    const delivered = requests.filter(r => r.status === 'delivered').length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const cancelled = requests.filter(r => r.status === 'cancelled').length;
    
    const mealsSaved = requests
      .filter(r => r.status === 'delivered')
      .reduce((sum, r) => sum + (r.quantity || 0), 0);
    
    const wasteDiverted = requests
      .filter(r => r.status === 'delivered' && ['semi_edible', 'non_edible'].includes(r.category))
      .reduce((sum, r) => sum + (r.quantity || 0), 0);
    
    const topDonors = users
      .filter(u => u.role === 'donor')
      .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
      .slice(0, 5)
      .map(u => ({ name: u.name, email: u.email, impactScore: u.impactScore || 0 }));
    
    const categoryBreakdown = Object.entries(
      requests.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([key, value]) => ({ _id: key, count: value }));
    
    const dayBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dayBuckets[key] = 0;
    }
    
    requests.forEach(r => {
      const dateKey = r.createdAt instanceof Timestamp 
        ? r.createdAt.toDate().toISOString().split('T')[0]
        : new Date(r.createdAt).toISOString().split('T')[0];
      if (dayBuckets.hasOwnProperty(dateKey)) dayBuckets[dateKey]++;
    });
    
    const dailyTrend = Object.entries(dayBuckets).map(([key, count]) => ({ _id: key, count }));
    
    const ngoCount = users.filter(u => u.role === 'ngo').length;
    const donorCount = users.filter(u => u.role === 'donor').length;
    
    const statusBreakdown = Object.entries(
      requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([key, value]) => ({ _id: key, count: value }));
    
    return {
      totalRequests,
      delivered,
      pending,
      accepted,
      cancelled,
      mealsSaved,
      wasteDiverted,
      topDonors,
      categoryBreakdown,
      dailyTrend,
      ngoCount,
      donorCount,
      statusBreakdown,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['donor', 'ngo']),
      orderBy('impactScore', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      ...docSnap.data()
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export default {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  createFoodRequest,
  getFoodRequests,
  getMyFoodRequests,
  acceptFoodRequest,
  deliverFoodRequest,
  cancelFoodRequest,
  submitFeedback,
  getFeedbackForRequest,
  getFeedbackByReceiver,
  getFeedbackByDonor,
  resolveFeedback,
  getCommunityPosts,
  createCommunityPost,
  likePost,
  getStats,
  getLeaderboard,
};
