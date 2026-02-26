// js/seguridad.js
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ══════════════════════════════════════════════════════════════
//  ARQUITECTURA CORRECTA:
//
//  ✅ reclamarSesion(auth, db)  → se llama UNA SOLA VEZ al hacer LOGIN
//     Escribe { deviceId } en Firestore. Esto expulsa al otro dispositivo.
//
//  ✅ vigilarSesion(auth, db, contenedorId) → se llama en cada página protegida
//     SOLO escucha cambios. NUNCA escribe. Si el deviceId cambia → expulsión.
//
//  ❌ El error anterior: vigilarSesion escribía en cada página, así que
//     celular y PC se sobreescribían mutuamente sin expulsarse nunca.
// ══════════════════════════════════════════════════════════════

// ID único y persistente por navegador (no por pestaña)
// js/seguridad.js

export const getDeviceId = () => {
    let id = localStorage.getItem("rip_deviceId");
    if (!id) {
        // Usamos una combinación de tiempo y random por si crypto no está disponible
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem("rip_deviceId", id);
    }
    return id;
};

// ── Llamar SOLO desde login.html al hacer sign in exitoso ──
export async function reclamarSesion(db, userId) {
    const deviceId = getDeviceId();
    await setDoc(doc(db, "sessions", userId), {
        deviceId,
        claimedAt: Date.now()
    }); // sin merge → sobreescritura total → expulsa al dispositivo anterior
}

// ── Pantalla de expulsión ──
export function manejarExpulsion(contenedor, auth) {
    if (!contenedor) return;

    // Reemplaza todo el contenido de la página con la pantalla de expulsión
    contenedor.innerHTML = `
        <div style="min-height:80vh; display:flex; align-items:center; justify-content:center; padding:20px;">
            <div class="expulsion-card">
                <div style="font-size:3rem; margin-bottom:12px;">🚫</div>
                <h3 style="color:#e50914; font-size:1.4rem; margin-bottom:10px;">Sesión desplazada</h3>
                <p style="color:#ccc; margin-bottom:16px;">Tu cuenta fue abierta en otro dispositivo o navegador.</p>
                <div class="aviso-importante">
                    ⚠️ <strong>Recuerda:</strong> Solo se permite <b>un dispositivo activo</b> por cuenta a la vez.
                </div>
                <p style="color:#fff; margin-top:20px; font-size:0.95rem;">
                    Cerrando sesión en <span id="seg-cuenta" style="color:#e50914; font-weight:700; font-size:1.2rem;">10</span>s...
                </p>
            </div>
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

// ── Vigilar sesión en páginas protegidas (SOLO ESCUCHA, nunca escribe) ──
export function vigilarSesion(auth, db, contenedorId) {
    const deviceId = getDeviceId();
    let unsub = null;
    let expulsado = false;

    auth.onAuthStateChanged((user) => {
        if (!user) {
            if (!window.location.pathname.includes("index.html"))
                window.location.href = "index.html";
            return;
        }

        const sessionRef = doc(db, "sessions", user.uid);

        // Limpiar listener anterior si existe
        if (unsub) { unsub(); unsub = null; }

        // SOLO ESCUCHAR — nunca escribir aquí
        unsub = onSnapshot(sessionRef, (snap) => {
            if (expulsado) return;
            if (!snap.exists()) return; // Sin documento aún, esperar

            const data = snap.data();

            // Si el deviceId guardado ya no es el nuestro → alguien más hizo login → expulsión
            if (data.deviceId && data.deviceId !== deviceId) {
                expulsado = true;
                if (unsub) { unsub(); unsub = null; }
                const wrapper = document.getElementById(contenedorId);
                manejarExpulsion(wrapper, auth);
            }
        }, (err) => {
            console.warn("Error listener sesión:", err);
        });
    });
}

// ── Cerrar sesión ──
export async function globalLogout(auth) {
    await signOut(auth);
    window.location.href = "index.html";
}
