// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3TdmY0pMY9VxgHYO-BdJGgdVP1gLOFrQ",
  authDomain: "d-d-translate.firebaseapp.com",
  projectId: "d-d-translate",
  storageBucket: "d-d-translate.appspot.com",
  messagingSenderId: "941660053581",
  appId: "1:941660053581:web:2a1a446c0ca11420d4fc04",
  measurementId: "G-LQ4JYR65BQ",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
