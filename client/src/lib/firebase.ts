import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if configuration is available
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase configuration missing. Phone verification will not be available.');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
}

export { auth };
export default app;
