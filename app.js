import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Elementos DOM
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

const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');
const tabBtnProduct = document.getElementById('tab-btn-product');
const tabBtnCategory = document.getElementById('tab-btn-category');
const formAddProduct = document.getElementById('form-add-product');
const formAddCategory = document.getElementById('form-add-category');
const prodCategorySelect = document.getElementById('prod-category');
const storeRows = document.getElementById('store-rows');

let isLoginMode = true;

// Abrir/Cerrar Modales
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

pencilBtn.addEventListener('click', () => {
  adminModal.classList.remove('hidden');
  loadCategories();
});
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

// Switchear Pestañas Admin
tabBtnProduct.addEventListener('click', () => {
  tabBtnProduct.classList.add('active'); tabBtnCategory.classList.remove('active');
  formAddProduct.classList.remove('hidden'); formAddCategory.classList.add('hidden');
});
tabBtnCategory.addEventListener('click', () => {
  tabBtnCategory.classList.add('active'); tabBtnProduct.classList.remove('active');
  formAddCategory.classList.remove('hidden'); formAddProduct.classList.add('hidden');
});

// Switchear Login/Registro
authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
  authToggleLink.textContent = isLoginMode ? "Regístrate" : "Inicia Sesión";
});

// Submit Login / Registro
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
      await setDoc(doc(db, "users", user.uid), { email, role });
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) { alert("Error: " + error.message); }
});

btnLogout.addEventListener('click', () => signOut(auth));

// Estado de la Sesión
onAuthStateChanged(auth, async (user) => {
  if (user) {
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Mi Perfil";
    btnLogout.classList.remove('hidden');

    const userDoc = await getDoc(doc(docRef(user.uid)));
    const role = (userDoc.exists() && userDoc.data().role) ? userDoc.data().role : (ADMIN_EMAILS.includes(user.email) ? "admin" : "client");
    
    if (role === "admin") pencilBtn.classList.remove('hidden');
    else pencilBtn.classList.add('hidden');

  } else {
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Cuenta";
    btnLogout.classList.add('hidden');
    pencilBtn.classList.add('hidden');
  }
  loadStoreProducts();
});

function docRef(uid) { return doc(db, "users", uid); }

// Cargar Categorías en el Select
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
  await addDoc(collection(db, "categories"), { name });
  alert("Categoría creada con éxito!");
  document.getElementById('cat-name').value = "";
  loadCategories();
});

// Guardar Producto en Firebase
formAddProduct.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('prod-name').value;
  const desc = document.getElementById('prod-desc').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = prodCategorySelect.value;
  const image = document.getElementById('prod-images').value.trim();
  const variants = document.getElementById('prod-variants').value.split(',').map(s => s.trim());

  if (!category) return alert("Por favor selecciona una categoría");

  await addDoc(collection(db, "products"), {
    name, desc, price, category, image, variants, createdAt: new Date()
  });

  alert("Producto Guardado en Firebase!");
  adminModal.classList.add('hidden');
  formAddProduct.reset();
  loadStoreProducts();
});

// Cargar Productos en Pantalla (Estilo Netflix)
async function loadStoreProducts() {
  storeRows.innerHTML = "";
  const catSnapshot = await getDocs(collection(db, "categories"));
  const prodSnapshot = await getDocs(collection(db, "products"));

  const products = [];
  prodSnapshot.forEach(docSnap => products.push(docSnap.data()));

  catSnapshot.forEach(catSnap => {
    const catName = catSnap.data().name;
    const catProducts = products.filter(p => p.category === catName);

    if (catProducts.length > 0) {
      let rowHTML = `
        <div class="category-row">
          <h2>${catName}</h2>
          <div class="product-slider">
      `;

      catProducts.forEach(p => {
        rowHTML += `
          <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <div class="price">$${p.price.toFixed(2)}</div>
          </div>
        `;
      });

      rowHTML += `</div></div>`;
      storeRows.innerHTML += rowHTML;
    }
  });
}

// Switch Tema
const btnTheme = document.getElementById('btn-theme');
const siteLogo = document.getElementById('site-logo');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  siteLogo.src = isLight ? "https://i.imgur.com/K4NjgRl.png" : "https://i.imgur.com/9W9C2TC.png";
});
