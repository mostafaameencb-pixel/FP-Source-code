
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firestore
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  orderBy,
  getDocs,
  query, where,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7r7CgHoBTH1OG5_SxGjUsYva99XlD0l8",
  authDomain: "m-path-edf47.firebaseapp.com",
  projectId: "m-path-edf47",
  storageBucket: "m-path-edf47.firebasestorage.app",
  messagingSenderId: "252878470479",
  appId: "1:252878470479:web:7fe7c94bb39addcb45593a",
  measurementId: "G-87CG3WML5N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);

//  Export 
export {
  auth,
  db,

  // Auth methods
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  // Firestore methods
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  orderBy,
  getDocs,
  query, where,

  serverTimestamp,
  onSnapshot,
  deleteDoc
};
