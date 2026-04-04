import { auth } from '../firebase';
import firebaseApi from './firebase-api';

const getCurrentUserId = () => auth.currentUser?.uid;

const api = {
  // ===== GET =====
  get: async (url) => {
    try {
      const userId = getCurrentUserId();

      // Community endpoints
      if (url === '/community/posts') {
        const posts = await firebaseApi.getCommunityPosts();
        return { data: posts };
      }
      if (url === '/community/leaderboard') {
        const leaderboard = await firebaseApi.getLeaderboard();
        return { data: leaderboard };
      }

      // Requests endpoints
      if (url === '/requests') {
        const requests = await firebaseApi.getFoodRequests({ status: 'pending' });
        return { data: requests };
      }
      if (url === '/requests/all') {
        const requests = await firebaseApi.getFoodRequests();
        return { data: requests };
      }
      if (url === '/requests/my') {
        if (!userId) throw new Error('User not authenticated');
        const requests = await firebaseApi.getMyFoodRequests(userId);
        return { data: requests };
      }

      // Stats endpoints
      if (url === '/stats' || url === '/stats/dashboard') {
        const stats = await firebaseApi.getStats();
        return { data: stats };
      }

      // Feedback endpoints
      if (url.match(/^\/feedback\/receiver\//)) {
        const receiverId = url.split('/').pop();
        const feedbacks = await firebaseApi.getFeedbackByReceiver(receiverId);
        return { data: feedbacks };
      }
      if (url.match(/^\/feedback\/donor\//)) {
        const donorId = url.split('/').pop();
        const feedbacks = await firebaseApi.getFeedbackByDonor(donorId);
        return { data: feedbacks };
      }
      if (url.match(/^\/feedback\/.*$/)) {
        const foodRequestId = url.split('/').pop();
        const feedback = await firebaseApi.getFeedbackForRequest(foodRequestId);
        return { data: feedback };
      }

      throw new Error(`Unknown GET endpoint: ${url}`);
    } catch (error) {
      console.error(`GET ${url}:`, error);
      throw error;
    }
  },

  // ===== POST =====
  post: async (url, data) => {
    try {
      const userId = getCurrentUserId();

      // Food request creation
      if (url === '/requests') {
        if (!userId) throw new Error('User not authenticated');
        const request = await firebaseApi.createFoodRequest(userId, data);
        return { data: request };
      }

      // Request acceptance
      if (url.match(/^\/requests\/.*\/accept$/)) {
        if (!userId) throw new Error('User not authenticated');
        const requestId = url.split('/')[2];
        await firebaseApi.acceptFoodRequest(requestId, userId);
        return { data: { success: true } };
      }

      // Community post creation
      if (url === '/community/posts') {
        if (!userId) throw new Error('User not authenticated');
        const post = await firebaseApi.createCommunityPost(userId, data);
        return { data: post };
      }

      // Feedback submission
      if (url === '/feedback') {
        if (!userId) throw new Error('User not authenticated');
        const feedback = await firebaseApi.submitFeedback(data, userId);
        return { data: feedback };
      }

      throw new Error(`Unknown POST endpoint: ${url}`);
    } catch (error) {
      console.error(`POST ${url}:`, error);
      throw error;
    }
  },

  // ===== PATCH =====
  patch: async (url, data) => {
    try {
      const userId = getCurrentUserId();

      // Deliver request
      if (url.match(/^\/requests\/.*\/deliver$/)) {
        const requestId = url.split('/')[2];
        await firebaseApi.deliverFoodRequest(requestId);
        return { data: { success: true } };
      }

      // Cancel request
      if (url.match(/^\/requests\/.*\/cancel$/)) {
        const requestId = url.split('/')[2];
        await firebaseApi.cancelFoodRequest(requestId);
        return { data: { success: true } };
      }

      // Like post
      if (url.match(/^\/community\/posts\/.*\/like$/)) {
        if (!userId) throw new Error('User not authenticated');
        const postId = url.split('/')[3];
        await firebaseApi.likePost(postId, userId);
        return { data: { success: true } };
      }

      // Resolve feedback
      if (url.match(/^\/feedback\/.*\/resolve$/)) {
        if (!userId) throw new Error('User not authenticated');
        const feedbackId = url.split('/')[2];
        await firebaseApi.resolveFeedback(feedbackId, userId);
        return { data: { success: true } };
      }

      throw new Error(`Unknown PATCH endpoint: ${url}`);
    } catch (error) {
      console.error(`PATCH ${url}:`, error);
      throw error;
    }
  },

  // ===== PUT =====
  put: async (url, data) => {
    try {
      const userId = getCurrentUserId();

      throw new Error(`Unknown PUT endpoint: ${url}`);
    } catch (error) {
      console.error(`PUT ${url}:`, error);
      throw error;
    }
  },

  // ===== DELETE =====
  delete: async (url) => {
    try {
      const userId = getCurrentUserId();

      throw new Error(`Unknown DELETE endpoint: ${url}`);
    } catch (error) {
      console.error(`DELETE ${url}:`, error);
      throw error;
    }
  },
};

export default api;
