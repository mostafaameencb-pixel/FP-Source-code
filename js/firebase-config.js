
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
  apiKey: "AIzaSyD2mYZaFytpYby8kgUPLZKtnfsLqinazlM",
  authDomain: "mood-project-5de4c.firebaseapp.com",
  projectId: "mood-project-5de4c",
  storageBucket: "mood-project-5de4c.firebasestorage.app",
  messagingSenderId: "675902986206",
  appId: "1:675902986206:web:7d029b50537ac55756af4f",
  measurementId: "G-N8NF2BTYR4"
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
