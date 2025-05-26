import admin from "firebase-admin"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import path from "path"

// Load service account JSON from file or environment
const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"))
console.log("Loaded service account for project:", serviceAccount.project_id);


// Validate
if (!serviceAccount) {
  throw new Error("Invalid Firebase service account. Make sure serviceAccountKey.json exists.")
}

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
})

console.log("Firestore initialized with apps:", admin.apps.length);

export const db = getFirestore()
export const auth = admin.auth()
export const storage = getStorage().bucket()
export const collections = {
  users: db.collection("users"),
  routes: db.collection("routes"),
  packs: db.collection("packs"),
  rides: db.collection("rides"),
  invitations: db.collection("invitations"),
  accessLogs: db.collection("accessLogs"),
  notifications: db.collection("notifications"),
}


;(async () => {
  try {
    const { users: userList } = await admin.auth().listUsers(10);
    console.log(
      "Admin SDK can list users:",
      userList.map(u => u.uid)
    );
  } catch (err) {
    console.error("Failed to list users:", err);
  }
})();