"use strict";
/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin for authentication and Firestore access.
 * Replaces AWS Cognito and DynamoDB clients.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.getFirebaseAuth = exports.getFirestoreDb = exports.initializeFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin
let firebaseApp;
let firestoreDb;
let firebaseAuth;
const initializeFirebase = () => {
    if (!firebaseApp) {
        // In production, credentials come from environment or service account
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.GCP_PROJECT_ID,
            });
        }
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.GCP_PROJECT_ID,
            });
        }
        else {
            // For local development with emulators
            firebaseApp = admin.initializeApp({
                projectId: process.env.GCP_PROJECT_ID || 'jeeny-taxi-platform',
            });
        }
        firestoreDb = (0, firestore_1.getFirestore)(firebaseApp);
        firebaseAuth = (0, auth_1.getAuth)(firebaseApp);
        // Configure Firestore settings
        firestoreDb.settings({
            ignoreUndefinedProperties: true,
        });
    }
};
exports.initializeFirebase = initializeFirebase;
const getFirestoreDb = () => {
    if (!firestoreDb) {
        (0, exports.initializeFirebase)();
    }
    return firestoreDb;
};
exports.getFirestoreDb = getFirestoreDb;
const getFirebaseAuth = () => {
    if (!firebaseAuth) {
        (0, exports.initializeFirebase)();
    }
    return firebaseAuth;
};
exports.getFirebaseAuth = getFirebaseAuth;
