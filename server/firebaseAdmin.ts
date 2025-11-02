import admin from 'firebase-admin';

let firebaseAdmin: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK for server-side token verification
 * Uses FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)
 */
export function initializeFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not configured - server-side phone verification disabled');
      return null;
    }

    // Parse the service account JSON
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    return null;
  }
}

/**
 * Verify a Firebase ID token from the client
 * @param idToken - The Firebase ID token to verify
 * @returns Decoded token with user information, or null if invalid
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    if (!firebaseAdmin) {
      console.warn('⚠️  Firebase Admin not initialized - skipping token verification');
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Firebase token verified successfully for user:', decodedToken.uid);
    return decodedToken;
  } catch (error: any) {
    console.error('❌ Error verifying Firebase token:', error.message);
    
    // Provide specific error messages
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase token has expired. Please verify your phone again.');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid Firebase token format.');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid Firebase token. Please verify your phone again.');
    }
    
    throw new Error('Failed to verify Firebase token.');
  }
}

/**
 * Extract phone number from verified Firebase token
 * @param decodedToken - Decoded Firebase token
 * @returns Phone number or null
 */
export function getPhoneNumberFromToken(decodedToken: admin.auth.DecodedIdToken): string | null {
  return decodedToken.phone_number || null;
}

// Initialize on module load
initializeFirebaseAdmin();
