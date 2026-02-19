// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";// TODO: Add SDKs for Firebase products that you want to use
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";// https://firebase.google.com/docs/web/setup#available-libraries
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAys3596Elp-G4Gp3sMk8F0iJlwlfhsuws",
  authDomain: "adrecipro.firebaseapp.com",
  projectId: "adrecipro",
  storageBucket: "adrecipro.firebasestorage.app",
  messagingSenderId: "1095267176477",
  appId: "1:1095267176477:web:91ca372e53b4f0af1e36f4",
  measurementId: "G-LBN5JMG2XF"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ログイン・ログアウト用のユーティリティ関数
export const logout = () => signOut(auth);
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const storage = getStorage(app);