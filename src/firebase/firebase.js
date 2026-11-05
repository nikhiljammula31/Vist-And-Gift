
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getEnvVar = (key) => {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== "undefined" && process.env && process.env[key]) {
        return process.env[key];
    }
    return undefined;
};

const firebaseConfig = {
    apiKey: getEnvVar("VITE_FIREBASE_API_KEY"),
    authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnvVar("VITE_FIREBASE_APP_ID"),
};

const missingConfig = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingConfig.length > 0) {
    throw new Error(
        `Missing Firebase configuration: ${missingConfig.join(", ")}`
    );
}

// Reuse existing Firebase app instance if already initialized to prevent duplicate initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
