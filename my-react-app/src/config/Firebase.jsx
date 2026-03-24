// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth'
import{getFirestore} from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0nz-dh0Gogtlb4rkTxAEiGnpzV7tyg1s",
  authDomain: "fotball-lag-4326f.firebaseapp.com",
  projectId: "fotball-lag-4326f",
  storageBucket: "fotball-lag-4326f.firebasestorage.app",
  messagingSenderId: "850881569053",
  appId: "1:850881569053:web:65f6d6bfb377ebefbd81f4",
  measurementId: "G-WJQ79QL1C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db= getFirestore(app)