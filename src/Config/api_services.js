// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from "firebase/storage";
import Anthropic from "@anthropic-ai/sdk";
import { getFunctions } from "firebase/functions";
import 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBSSE_APPID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebase_app = initializeApp(firebaseConfig);
export const db = getFirestore(firebase_app);
export const auth = getAuth(firebase_app);
export const storage = getStorage(firebase_app);
export const functions = getFunctions(firebase_app);

setPersistence(auth, browserSessionPersistence);

export const claude = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, 
  dangerouslyAllowBrowser: true
});