// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Reemplaza estos datos con los de tu consola de Firebase
// (Project Settings -> General -> Your Apps)
const firebaseConfig = {
  apiKey: "AIzaSyBu1KKK7YJsXoHbNNUXLBhV54b1UIS8OEw",
  authDomain: "huaynos-6e527.firebaseapp.com",
  projectId: "huaynos-6e527",
  storageBucket: "huaynos-6e527.firebasestorage.app",
  messagingSenderId: "374495999469",
  appId: "1:374495999469:web:54dc33730a53f33e2a63e4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios para usar en todo el proyecto
export const auth = getAuth(app);
export const db = getFirestore(app);