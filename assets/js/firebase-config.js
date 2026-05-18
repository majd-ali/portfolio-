/* ============================================================
   Firebase configuration
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com and create a project.
   2. Add a Web App (</> icon) and copy the config snippet.
   3. Replace the placeholder values below with your real values.
   4. In the Firebase console, enable:
        - Authentication → Sign-in method → Email/Password (ON)
        - Authentication → Sign-in method → Anonymous (ON)
        - Firestore Database → Create database
   5. Create your admin user under Authentication → Users → Add user
      (use the email you set in ADMIN_EMAIL below).
   6. Paste the security rules from rules/firestore.rules into
      the Firebase console (Storage is not used — images live in Firestore).
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDpuDXnqPFBwHQnvJe7EyCSjRN6v0fYAAc",
  authDomain: "portfolio-c43f5.firebaseapp.com",
  projectId: "portfolio-c43f5",
  storageBucket: "portfolio-c43f5.firebasestorage.app",
  messagingSenderId: "514114155842",
  appId: "1:514114155842:web:a171226251b3c10252c4db",
  measurementId: "G-JDJQE0EYLH"
};

// The email address that is allowed to manage the website.
// Must match the user you create in Firebase Authentication.
window.FIREBASE_ADMIN_EMAIL = "amajd8586@gmail.com";

// Initialize Firebase (do not edit below this line).
(function () {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Check script order in HTML.');
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }
})();