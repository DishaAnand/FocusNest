import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyABZPSYRlGQKuobjVZTjSTdD_YJb_f_AUQ",
  authDomain: "focushaven-81ecc.firebaseapp.com",
  projectId: "focushaven-81ecc",
  storageBucket: "focushaven-81ecc.firebasestorage.app",
  messagingSenderId: "1000603793410",
  appId: "1:1000603793410:web:f9c225a3f3ff2345808f1b",
  measurementId: "G-G5QDPHT4MC"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);