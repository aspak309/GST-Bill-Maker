// ================================
// FIREBASE SETUP
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA76f8G8L-GDKNuMKbtaORnuDfagRA3zY8",
  authDomain: "gst-bill-maker-d7956.firebaseapp.com",
  projectId: "gst-bill-maker-d7956",
  storageBucket: "gst-bill-maker-d7956.firebasestorage.app",
  messagingSenderId: "564339961180",
  appId: "1:564339961180:web:0e9ff371695d0beeade599"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Firebase Authentication
const auth = getAuth(app);


// Google Login Provider
const googleProvider = new GoogleAuthProvider();


// ================================
// GOOGLE LOGIN (REDIRECT METHOD)
// ================================

const googleLoginBtn = document.getElementById("googleLoginBtn");
const loginError = document.getElementById("loginError");

// Handle redirect result when user comes back from Google login page
getRedirectResult(auth).catch((error) => {
  console.error("Redirect Login Error:", error);
  if (loginError) {
    loginError.textContent = "Google login failed. Please try again.";
    loginError.classList.remove("hidden");
  }
});

googleLoginBtn?.addEventListener("click", async () => {
  try {
    loginError?.classList.add("hidden");
    // Using redirect instead of popup to prevent mobile browser blocking issues
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google Login Error:", error);
    if (loginError) {
      loginError.textContent = "Google login failed. Please try again.";
      loginError.classList.remove("hidden");
    }
  }
});


// ================================
// LOGOUT
// ================================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
});


// ================================
// LOGIN STATE
// ================================

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const userName = document.getElementById("userName");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in
    loginPage?.classList.add("hidden");
    appPage?.classList.remove("hidden");

    if (userName) {
      userName.textContent = user.displayName || user.email || "";
    }
  } else {
    // User logged out
    appPage?.classList.add("hidden");
    loginPage?.classList.remove("hidden");

    if (userName) {
      userName.textContent = "";
    }
  }
});


// ==================================================
// GST BILL MAKER CODE
// ==================================================
