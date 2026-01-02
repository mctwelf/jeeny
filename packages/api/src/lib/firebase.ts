/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin for authentication and Firestore access.
 * Replaces AWS Cognito and DynamoDB clients.
 */

import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Initialize Firebase Admin
let firebaseApp: admin.app.App;
let firestoreDb: Firestore;
let firebaseAuth: Auth;

export const initializeFirebase = (): void => {
  if (!firebaseApp) {
    // In production, credentials come from environment or service account
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.GCP_PROJECT_ID,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.GCP_PROJECT_ID,
      });
    } else {
      // For local development with emulators
      firebaseApp = admin.initializeApp({
        projectId: process.env.GCP_PROJECT_ID || 'jeeny-taxi-platform',
      });
    }

    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);

    // Configure Firestore settings
    firestoreDb.settings({
      ignoreUndefinedProperties: true,
    });
  }
};

export const getFirestoreDb = (): Firestore => {
  if (!firestoreDb) {
    initializeFirebase();
  }
  return firestoreDb;
};

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    initializeFirebase();
  }
  return firebaseAuth;
};

export { admin };
