import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
} from "firebase/firestore";

/**
 * Firebase configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyC-unM6n3pS4y6OX6tjfdJc-4hnFi6Jfpo",
  authDomain: "collegehub360.firebaseapp.com",
  projectId: "collegehub360",
  storageBucket: "collegehub360.firebasestorage.app",
  messagingSenderId: "120226540537",
  appId: "1:120226540537:web:c1fe6da9bd4eb0bb2f2b28",
};

/**
 * Initialize Firebase App
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase services
 */
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Enable offline persistence (multi-tab safe)
 */
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  const code = err.code;

  if (code === "failed-precondition") {
    console.warn(
      "Firestore persistence failed: multiple tabs are open. Only one tab can enable persistence."
    );
  } else if (code === "unimplemented") {
    console.warn(
      "Firestore persistence not supported in this browser."
    );
  } else {
    console.warn("Firestore persistence error:", err);
  }
});

/**
 * Firestore operation types
 */
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

/**
 * Auth info structure
 */
export interface AuthInfo {
  userId?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
}

/**
 * Firestore error structure
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: AuthInfo;
}

/**
 * Central Firestore error handler
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
    },
  };

  console.error("Firestore Error:", errInfo);

  throw new Error(JSON.stringify(errInfo));
}