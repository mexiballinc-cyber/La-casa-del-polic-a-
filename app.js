import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase para "la-casa-del-policia"
const firebaseConfig = {
  apiKey: "AIzaSyDUGuBk9a13OkPCtQIgrN09vi19S52t67I",
  authDomain: "la-casa-del-policia.firebaseapp.com",
  projectId: "la-casa-del-policia",
  storageBucket: "la-casa-del-policia.firebasestorage.app",
  messagingSenderId: "241976924192",
  appId: "1:241976924192:web:d602cd6a633927e93d0445"
};

// Inicializar servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Correos autorizados como Administradores
const ADMIN_EMAILS = ["jgonzalezgutierrez1@bcedu.mx"];

// Elementos del DOM
const authModal = document.getElementById('auth-modal');
const btnAuthModal = document.getElementById('btn-auth-modal');
const closeAuth = document.getElementById('close-auth');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const pencilBtn = document.getElementById('admin-pencil-btn');
const btnLogout = document.getElementById('btn-logout');
const authToggleLink = document.getElementById('auth-toggle-link');
const authTitle = document.getElementById('auth-title');

let isLoginMode = true;

// Abrir y Cerrar Modal de Auth
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

// Switchear entre Login y Registro
authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
  authToggleLink.textContent = isLoginMode ? "Regístrate" : "Inicia Sesión";
});

// Manejo del formulario de Login / Registro
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Asignar rol de admin si está en la lista autorizada
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "client";

      // Guardar el documento del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: role
      });
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) {
    alert("Error de autenticación: " + error.message);
  }
});

// Cerrar Sesión
btnLogout.addEventListener('click', () => {
  signOut(auth);
  authModal.classList.add('hidden');
});

// Detective de Sesión activa
onAuthStateChanged(auth, async (user) => {
  if (user) {
    btnAuthModal.textContent = "Mi Perfil";
    btnLogout.classList.remove('hidden');

    // Verificar si es administrador en Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists() && userDoc.data().role === "admin") {
      pencilBtn.classList.remove('hidden'); // Muestra el lápiz ✏️
    } else {
      pencilBtn.classList.add('hidden');
    }
  } else {
    btnAuthModal.textContent = "Cuenta";
    btnLogout.classList.add('hidden');
    pencilBtn.classList.add('hidden');
  }
});
