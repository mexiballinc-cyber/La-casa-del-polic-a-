import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUGuBk9a13OkPCtQIgrN09vi19S52t67I",
  authDomain: "la-casa-del-policia.firebaseapp.com",
  projectId: "la-casa-del-policia",
  storageBucket: "la-casa-del-policia.firebasestorage.app",
  messagingSenderId: "241976924192",
  appId: "1:241976924192:web:d602cd6a633927e93d0445"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAILS = ["jgonzalezgutierrez1@bcedu.mx"];

// DOM Elements
const authModal = document.getElementById('auth-modal');
const btnAuthModal = document.getElementById('btn-auth-modal');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const avatarPickerContainer = document.getElementById('avatar-picker-container');
const authAvatarInput = document.getElementById('auth-avatar-input');
const avatarPreview = document.getElementById('avatar-preview');
const userAvatarNav = document.getElementById('user-avatar-nav');
const defaultUserIcon = document.getElementById('default-user-icon');
const pencilBtn = document.getElementById('admin-pencil-btn');
const btnLogout = document.getElementById('btn-logout');
const authToggleLink = document.getElementById('auth-toggle-link');
const authTitle = document.getElementById('auth-title');

// Admin Elements
const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');
const tabBtnProduct = document.getElementById('tab-btn-product');
const tabBtnCategory = document.getElementById('tab-btn-category');
const formAddProduct = document.getElementById('form-add-product');
const formAddCategory = document.getElementById('form-add-category');
const prodCategorySelect = document.getElementById('prod-category');

let isLoginMode = true;
let selectedAvatarBase64 = "";

// Preview de Foto de Galería
authAvatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      selectedAvatarBase64 = evt.target.result;
      avatarPreview.src = selectedAvatarBase64;
    };
    reader.readAsDataURL(file);
  }
});

// Switchear Login / Registro
authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
  authToggleLink.textContent = isLoginMode ? "Regístrate" : "Inicia Sesión";
  if (isLoginMode) avatarPickerContainer.classList.add('hidden');
  else avatarPickerContainer.classList.remove('hidden');
});

// Form Auth
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
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "client";

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: role,
        photoURL: selectedAvatarBase64 || ""
      });
    }
    authModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    authForm.reset();
  } catch (error) { alert("Error: " + error.message); }
});

btnLogout.addEventListener('click', () => signOut(auth));

// Estado de Sesión
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    btnLogout.classList.remove('hidden');

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.photoURL) {
        userAvatarNav.src = data.photoURL;
        userAvatarNav.classList.remove('hidden');
        defaultUserIcon.classList.add('hidden');
      }
      if (data.role === "admin") pencilBtn.classList.remove('hidden');
      else pencilBtn.classList.add('hidden');
    }
    loadCategories();
  } else {
    authModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    btnLogout.classList.add('hidden');
    pencilBtn.classList.add('hidden');
  }
});

// Admin Panel Events
pencilBtn.addEventListener('click', () => adminModal.classList.remove('hidden'));
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

tabBtnProduct.addEventListener('click', () => {
  tabBtnProduct.classList.add('active'); tabBtnCategory.classList.remove('active');
  formAddProduct.classList.remove('hidden'); formAddCategory.classList.add('hidden');
});
tabBtnCategory.addEventListener('click', () => {
  tabBtnCategory.classList.add('active'); tabBtnProduct.classList.remove('active');
  formAddCategory.classList.remove('hidden'); formAddProduct.classList.add('hidden');
});

// Cargar Categorías en Selector
async function loadCategories() {
  prodCategorySelect.innerHTML = `<option value="">Selecciona Categoría...</option>`;
  const querySnapshot = await getDocs(collection(db, "categories"));
  querySnapshot.forEach((docSnap) => {
    const cat = docSnap.data();
    prodCategorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });
}

// Crear Categoría
formAddCategory.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  await addDoc(collection(db, "categories"), { name: name });
  alert("Categoría Creada");
  document.getElementById('cat-name').value = "";
  loadCategories();
});

// Crear Producto con Fotos y Variantes
formAddProduct.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('prod-name').value;
  const desc = document.getElementById('prod-desc').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = prodCategorySelect.value;
  const images = document.getElementById('prod-images').value.split(',').map(s => s.trim());
  const variants = document.getElementById('prod-variants').value.split(',').map(s => s.trim());

  await addDoc(collection(db, "products"), {
    name, desc, price, category, images, variants, createdAt: new Date()
  });

  alert("Producto Guardado Exitosamente");
  adminModal.classList.add('hidden');
  formAddProduct.reset();
});
