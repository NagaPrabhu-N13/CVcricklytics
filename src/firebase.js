// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCTHcVHrfDbkXgEwGN_6g1Zj6hvtfQ_hs",
  authDomain: "cricklytics-4aed5.firebaseapp.com",
  projectId: "cricklytics-4aed5",
  storageBucket: "cricklytics-4aed5.firebasestorage.app",
  messagingSenderId: "173377933744",
  appId: "1:173377933744:web:01e6fda81bfa69e8b0c675",
  measurementId: "G-16KKFSQYLE"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
// const vertexAI = getVertexAI(app);

const ai = getAI(app, { backend: new VertexAIBackend() });
const geminiModel =  getGenerativeModel(ai, { model: "gemini-2.5-flash" });

// ✅ Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);

const storage = getStorage(app);

// ✅ Export everything needed
export { auth, db, RecaptchaVerifier, signInWithPhoneNumber ,geminiModel, serverTimestamp, storage };
