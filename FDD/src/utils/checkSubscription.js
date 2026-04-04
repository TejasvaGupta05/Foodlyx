import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const checkSubscription = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const data = userSnap.data();
    const sub = data.subscription;

    if (!sub) return false;

    const now = new Date();

    if (
      sub.status === "active" &&
      new Date(sub.expiryDate.seconds * 1000) > now
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};