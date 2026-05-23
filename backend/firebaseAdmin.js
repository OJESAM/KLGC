import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account from environment or file
const getServiceAccount = () => {
  // Priority 1: Environment variable (best for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
    }
  }

  // Priority 2: Local file (development only, must be .gitignored)
  const keyPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    try {
      return JSON.parse(fs.readFileSync(keyPath, "utf8"));
    } catch (err) {
      throw new Error(`Failed to read Firebase key from ${keyPath}`);
    }
  }

  throw new Error(
    "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json"
  );
};

// Initialize with error handling
let db;
try {
  const serviceAccount = getServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
  console.log("✓ Firebase initialized successfully");
} catch (err) {
  console.error("✗ Firebase initialization failed:", err.message);
  process.exit(1);
}

export { db };