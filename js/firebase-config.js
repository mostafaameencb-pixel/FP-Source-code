

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2mYZaFytpYby8kgUPLZKtnfsLqinazlM",
  authDomain: "mood-project-5de4c.firebaseapp.com",
  projectId: "mood-project-5de4c",
  storageBucket: "mood-project-5de4c.firebasestorage.app",
  messagingSenderId: "675902986206",
  appId: "1:675902986206:web:7d029b50537ac55756af4f",
  measurementId: "G-N8NF2BTYR4"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
