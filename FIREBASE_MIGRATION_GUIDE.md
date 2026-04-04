# Firebase Backend Implementation Guide

## Overview

You now have a complete Firebase Firestore backend implementation that replaces the previous mock localStorage API. All frontend components continue to work without modification—only the API layer has changed.

## What Was Implemented

### New Files Created:

1. **FDD/src/api/firebase-api.js** (600+ LOC)
   - All Firestore CRUD operations
   - User profile management
   - Food request operations (create, fetch, accept, deliver, cancel)
   - Feedback submission and management
   - Community post operations with like functionality
   - Statistics and leaderboard generation
   - Direct Firestore SDK queries with proper error handling

2. **FDD/src/api/axios.js** (Updated)
   - Now routes all API calls to Firebase via firebase-api.js
   - Maintains the same API signature—frontend code unchanged
   - Handles authentication state and user ID extraction from Firebase Auth
   - Includes endpoint routing for all existing features

3. **firestore.rules** (New)
   - Complete Firestore security rules
   - Role-based access control
   - User isolation (donors see only own requests, receivers see assigned work)
   - Feedback submission only for delivered requests
   - Admin override permissions

4. **FIRESTORE_SCHEMA.md** (New)
   - Detailed collection structure documentation
   - Field descriptions and types
   - Relationship diagrams
   - Query examples
   - Migration guide

## Migration Path from Express/MongoDB

If you had an Express backend with MongoDB, here's the migration:

### Step 1: Create Firestore Collections
Use the firebase-api.js functions to recreate your data:

```javascript
// From your Express backend, export data as JSON
const { db } = require('./firebase');
const User = require('./models/User');
const FoodRequest = require('./models/FoodRequest');

// Create users in Firestore
const users = await User.find();
for (const user of users) {
  await createUserProfile(user.mongoId, {
    email: user.email,
    name: user.name,
    role: user.role,
    location: user.location
  });
}

// Create food requests in Firestore
const requests = await FoodRequest.find();
for (const req of requests) {
  await createFoodRequest(req.donorId, {
    foodType: req.foodType,
    foodName: req.foodName,
    quantity: req.quantity,
    // ... other fields
  });
}
```

### Step 2: Update Frontend to Use Firebase Auth
Your AuthContext already handles this. Verify in:
- [FDD/src/context/AuthContext.jsx](FDD/src/context/AuthContext.jsx)

The auth flow is:
1. User logs in via Firebase Auth (email/password or Google)
2. Firebase returns a UID
3. AuthContext fetches user profile from Firestore `users` collection
4. All subsequent API calls use this UID

### Step 3: Deploy Security Rules
Go to [Firebase Console](https://console.firebase.google.com) → Select your project → Firestore Database → Rules tab

Replace the contents with the rules from [firestore.rules](firestore.rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // [Copy contents of firestore.rules here]
  }
}
```

Click "Publish" to deploy.

### Step 4: Test the Integration
Start your app and test the following flow:

1. **Sign up** with email/password (Firebase Auth)
2. **Login** and verify profile loads from Firestore
3. **Create a food request** (goes to Firestore)
4. **Accept the request** as a receiver (updates status in Firestore)
5. **Mark as delivered** (updates status and allows feedback)
6. **Submit feedback** with facility name (stores in Firestore)
7. **Check community posts** (reads/writes from Firestore)
8. **View stats dashboard** (aggregates Firestore data)

## API Compatibility

All existing frontend code continues to work without modification:

```javascript
// Before: Called mock localStorage API
// After: Same call signature, now calls Firestore

import api from './api/axios';

// These all still work:
const requests = await api.get('/requests');
const requests = await api.get('/requests/my');
const post = await api.post('/community/posts', { text: '...' });
const feedback = await api.post('/feedback', { rating: 5, ... });
const response = await api.patch('/requests/r123/deliver');
```

## Environment Requirements

Verify your `.env` file has all Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id
```

All values must be non-empty for initialization.

## Firestore Costs & Optimization

### Write Operations
- Creating a user profile: 1 write
- Creating a food request: 1 write + 1 write (user impact score update)
- Submitting feedback: 1 write
- Each like on post: 1 write

### Read Operations
- Fetching pending requests: 1 read
- Fetching user's requests: 1 read
- Fetching stats: N reads (scales with # of requests and users)

### Cost Optimization Tips:
1. Use collection group queries to avoid denormalization
2. Cache user profiles in context to reduce reads
3. Batch operations for bulk updates
4. Consider pagination for large result sets
5. Use Cloud Functions for expensive aggregations (stats)

## Optional Enhancements

### 1. Real-Time Listeners (Optional)
The current implementation uses one-off reads. For live updates on requests list:

```javascript
// In Community.jsx or Dashboard
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(collection(db, 'foodRequests'), where('status', '==', 'pending'));
const unsubscribe = onSnapshot(q, (snapshot) => {
  const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setRequests(requests);
});

// Cleanup in useEffect return
return () => unsubscribe();
```

### 2. Cloud Functions for Stats (Advanced)
Move expensive aggregations to Cloud Functions:

```javascript
// cloud_functions/functions/index.js
const functions = require('firebase-functions');

exports.getStats = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  
  const requests = await db.collection('foodRequests').get();
  const users = await db.collection('users').get();
  
  // Expensive calculations here on backend
  return {
    totalRequests: requests.size,
    mealsSaved: requests.docs.reduce(...),
    // etc.
  };
});

// Call from frontend:
const result = await httpsCallable(functions, 'getStats')({});
```

### 3. Pagination for Large Lists
```javascript
import { getDocs, query, collection, limit, startAfter, orderBy } from 'firebase/firestore';

let firstQuery = query(collection(db, 'foodRequests'), orderBy('createdAt', 'desc'), limit(20));
let docs = await getDocs(firstQuery);

// Next page
let lastDoc = docs.docs[docs.docs.length - 1];
let nextQuery = query(collection(db, 'foodRequests'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(20));
let nextDocs = await getDocs(nextQuery);
```

## Troubleshooting

### Issue: "User not authenticated" errors
**Solution:** Ensure user is logged in via Firebase Auth first. Check AuthContext.jsx:
- User must pass `onAuthStateChanged` listener
- currentUser.uid must be available before making API calls

### Issue: "Permission denied" errors when reading/writing
**Solution:** Check Firestore security rules. Test with permissive rules first:
```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
Then add restrictive rules gradually.

### Issue: Stats dashboard shows no data
**Solution:** Ensure documents exist in collections. Check Firebase Console > Firestore > Data tab. You may need to seed initial data.

### Issue: Feedback submission fails
**Solution:** Verify:
1. Request status is 'delivered' (required by rules)
2. User is authenticated (getCurrentUserId must return valid UID)
3. facilityName field is populated from request.donorDetails

## Next Steps

1. **Deploy security rules** via Firebase Console
2. **Seed initial test data** using firebase-api.js functions
3. **Test the full workflow** (signup → create request → accept → deliver → feedback)
4. **Monitor Firestore usage** in Firebase Console
5. **Implement real-time listeners** (optional) for live updates
6. **Add image uploads** to Cloud Storage (if using food images)
7. **Consider Cloud Functions** for expensive operations

## Reference Files

- [firebase-api.js](FDD/src/api/firebase-api.js) - All Firestore operations
- [axios.js](FDD/src/api/axios.js) - API routing layer
- [firestore.rules](firestore.rules) - Security rules to deploy
- [AuthContext.jsx](FDD/src/context/AuthContext.jsx) - Firebase Auth integration
- [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md) - Detailed collection docs

## Support

For Firebase issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start) (for backend scripts)
