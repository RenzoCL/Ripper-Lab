// js/seguridad.js
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Generar o recuperar un ID único para el navegador actual
export const getDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("deviceId", id);
    }
    return id;
};

export function manejarExpulsion(contenedor, auth) {
    contenedor.innerHTML = `
        <div class="expulsion-card">
            <h3>🚫 Sesión en uso</h3>
            <p>Se ha detectado que alguien más ingresó a tu cuenta desde otro dispositivo.</p>
            <div class="aviso-importante">
                ⚠️ <strong>Recuerda:</strong> Por seguridad, el acceso está permitido a <b>un solo dispositivo a la vez</b>.
            </div>
            <p style="margin-top:20px; font-size:1.1rem; color:#fff;">
                Cerrando sesión en <span id="segundos-restantes">10</span> segundos...
            </p>
        </div>
    `;

    let seg = 10;
    const t = setInterval(async () => {
        seg--;
        const span = document.getElementById("segundos-restantes");
        if (span) span.innerText = seg;
        
        if (seg <= 0) {
            clearInterval(t);
            await signOut(auth);
            window.location.href = "index.html";
        }
    }, 1000);
}

// ESTA ES LA FUNCIÓN QUE BLOQUEA TODO
export function vigilarSesion(auth, db, contenedorId) {
    const deviceId = getDeviceId();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const sessionRef = doc(db, "sessions", user.uid);

            // 1. Reclamar este dispositivo como el activo en esta página
            await setDoc(sessionRef, { 
                deviceId: deviceId,
                lastActive: new Date().getTime()
            }, { merge: true });

            // 2. Escuchar cambios en tiempo real
            onSnapshot(sessionRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.deviceId !== deviceId) {
                        const wrapper = document.getElementById(contenedorId);
                        manejarExpulsion(wrapper, auth);
                    }
                }
            });
        } else {
            // Si no hay usuario y no estamos en index, mandar al login
            if (!window.location.pathname.includes("index.html")) {
                window.location.href = "index.html";
            }
        }
    });
}

export async function globalLogout(auth) {
    await signOut(auth);
    window.location.href = "index.html";
}