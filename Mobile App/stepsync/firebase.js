import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { browserLocalPersistence } from "firebase/auth";
import { getApp } from "firebase/app";
import { getApps } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence } from 'firebase/auth';
import { initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "API KEY",
  authDomain: "AUTH DOMAIN",
  databaseURL: "DATABASE URL",
  projectId: "PROJECT ID",
  storageBucket: "STORAGE BUCKET",
  messagingSenderId: "MESSENGER SENDER ID",
  appId: "APP ID",
  measurementId: "MEASUREMENT ID"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// const auth = getAuth(app);
// auth.setPersistence(browserLocalPersistence);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getDatabase(app);

export { app, auth, db }