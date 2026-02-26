// Importaciones necesarias desde el CDN de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Tu configuración de Firebase (Cópiala de tu consola de Firebase)
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

// Inicializar Servicios
const db = getFirestore(app);
const auth = getAuth(app);

// --- ACTIVAR PERSISTENCIA DE DATOS (VELOCIDAD MÁXIMA) ---
// Esto hace que los datos se guarden localmente y la carga sea instantánea tras la primera vez.
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Probablemente hay múltiples pestañas abiertas al mismo tiempo
        console.warn("La persistencia falló: Múltiples pestañas abiertas.");
    } else if (err.code == 'unimplemented') {
        // El navegador no es compatible (poco común hoy en día)
        console.warn("El navegador no soporta persistencia de datos.");
    }
});

// Exportar para usar en los demás archivos
export { auth, db };