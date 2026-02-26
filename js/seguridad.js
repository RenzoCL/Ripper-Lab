// js/seguridad.js
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Genera o recupera un ID único por navegador ──
export const getDeviceId = () => {
    let id = localStorage.getItem("rip_deviceId");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("rip_deviceId", id);
    }
    return id;
};

// ── Pantalla de expulsión ──
export function manejarExpulsion(contenedor, auth) {
    if (!contenedor) return;
    contenedor.innerHTML = `
        <div class="expulsion-card">
            <h3 style="color:#e50914; font-size:1.5rem; margin-bottom:12px;">🚫 Sesión desplazada</h3>
            <p style="color:#ccc;">Tu cuenta fue abierta en otro dispositivo.</p>
            <div class="aviso-importante" style="margin:18px 0;">
                ⚠️ <strong>Recuerda:</strong> Solo se permite <b>un dispositivo activo</b> por cuenta.
            </div>
            <p style="color:#fff; font-size:1rem;">
                Cerrando sesión en <span id="seg-cuenta" style="color:#e50914; font-weight:700;">10</span>s...
            </p>
        </div>`;

    let seg = 10;
    const t = setInterval(async () => {
        seg--;
        const el = document.getElementById("seg-cuenta");
        if (el) el.textContent = seg;
        if (seg <= 0) {
            clearInterval(t);
            await signOut(auth);
            window.location.href = "index.html";
        }
    }, 1000);
}

// ── Vigilancia activa: 1 dispositivo por cuenta ──
export function vigilarSesion(auth, db, contenedorId) {
    const deviceId = getDeviceId();
    let snapshotUnsub = null;

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Sin sesión → login
            if (!window.location.pathname.includes("index.html")) {
                window.location.href = "index.html";
            }
            return;
        }

        const sessionRef = doc(db, "sessions", user.uid);

        // 1. Registrar este dispositivo como el activo
        try {
            await setDoc(sessionRef, {
                deviceId,
                lastActive: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn("No se pudo registrar la sesión:", e);
        }

        // 2. Escuchar cambios en tiempo real
        if (snapshotUnsub) snapshotUnsub(); // Limpiar listener previo
        snapshotUnsub = onSnapshot(sessionRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            // Si el deviceId en Firestore ya no es el nuestro → expulsión
            if (data.deviceId && data.deviceId !== deviceId) {
                if (snapshotUnsub) { snapshotUnsub(); snapshotUnsub = null; }
                const wrapper = document.getElementById(contenedorId);
                manejarExpulsion(wrapper, auth);
            }
        }, (err) => {
            console.warn("Error al escuchar sesión:", err);
        });
    });
}

// ── Cerrar sesión global ──
export async function globalLogout(auth) {
    await signOut(auth);
    window.location.href = "index.html";
}
