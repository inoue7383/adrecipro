import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useUserPlan = () => {
  const [plan, setPlan] = useState('free'); // デフォルトはfree
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setPlan(userSnap.data().plan);
        } else {
          // 初回ログイン時はFirestoreにfreeプランで登録
          await setDoc(userRef, {
            email: auth.currentUser.email,
            plan: 'free',
            createdAt: new Date()
          });
          setPlan('free');
        }
      }
      setLoading(false);
    };
    fetchPlan();
  }, [auth.currentUser]);

  return { plan, loading };
};