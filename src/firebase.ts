import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get and export Firestore instance.
// Passing the custom database ID from config is critical to connect to the custom provisioned database correct.
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

