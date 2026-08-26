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

// Lista de correos administradores (en minúsculas)
const ADMIN_EMAILS = ["jgonzalezgutierrez1@bcedu.mx"];

// Elementos DOM
const authModal = document.getElementById('auth-modal');
const btnAuthModal = document.getElementById('btn-auth-modal');
const closeAuth = document.getElementById('close-auth');
const authForm = document.getElementById('auth-form');
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

// Modales
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

pencilBtn.addEventListener('click', () => {
  adminModal.classList.remove('hidden');
  loadCategories();
});
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

// Pestañas Admin
tabBtnProduct.addEventListener('click', () => {
  tabBtnProduct.classList.add('active'); tabBtnCategory.classList.remove('active');
  formAddProduct.classList.remove('hidden'); formAddCategory.classList.add('hidden');
});
tabBtnCategory.addEventListener('click', () => {
  tabBtnCategory.classList.add('active'); tabBtnProduct.classList.remove('active');
  formAddCategory.classList.remove('hidden'); formAddProduct.classList.add('hidden');
});

// Cambiar entre Login / Registro
authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
  authToggleLink.textContent = isLoginMode ? "Regístrate" : "Inicia Sesión";
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const isUserAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      await setDoc(doc(db, "users", userCredential.user.uid), { 
        email: email, 
        role: isUserAdmin ? "admin" : "client" 
      });
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) { 
    alert("Error de Autenticación: " + error.message); 
  }
});

btnLogout.addEventListener('click', () => signOut(auth));

// DETECCIÓN DE SESIÓN MEJORADA
onAuthStateChanged(auth, async (user) => {
  if (user) {
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Mi Perfil";
    btnLogout.classList.remove('hidden');
    
    const userEmail = (user.email || "").toLowerCase();
    
    // 1. Verificación directa por correo
    let isAdmin = ADMIN_EMAILS.includes(userEmail);

    // 2. Si no es por correo, verificar Firestore
    if (!isAdmin) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          isAdmin = true;
        }
      } catch (err) {
        console.error("Error al verificar rol en base de datos:", err);
      }
    }

    // Mostrar u ocultar el botón del lápiz
    if (isAdmin) {
      pencilBtn.classList.remove('hidden');
    } else {
      pencilBtn.classList.add('hidden');
    }

  } else {
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Cuenta";
    btnLogout.classList.add('hidden');
    pencilBtn.classList.add('hidden');
  }
  
  loadStoreProducts();
});

// Cargar Categorías
async function loadCategories() {
  try {
    prodCategorySelect.innerHTML = `<option value="">Selecciona Categoría...</option>`;
    const querySnapshot = await getDocs(collection(db, "categories"));
    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      prodCategorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
  } catch (err) {
    console.error("Error cargando categorías:", err);
  }
}

// Crear Categoría
formAddCategory.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('cat-name');
  const catName = nameInput.value.trim();
  
  if (!catName) return alert("Escribe un nombre para la categoría");

  try {
    await addDoc(collection(db, "categories"), { name: catName, createdAt: new Date() });
    alert(`¡Categoría "${catName}" creada con éxito!`);
    nameInput.value = "";
    await loadCategories();
    await loadStoreProducts();
  } catch (err) {
    alert("Error al guardar categoría: " + err.message);
  }
});

// Crear Producto
formAddProduct.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('prod-name').value;
  const desc = document.getElementById('prod-desc').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = prodCategorySelect.value;
  const image = document.getElementById('prod-images').value.trim();
  const variants = document.getElementById('prod-variants').value.split(',').map(s => s.trim());

  if (!category) return alert("Por favor selecciona una categoría primero");

  try {
    await addDoc(collection(db, "products"), {
      name, desc, price, category, image, variants, createdAt: new Date()
    });

    alert("¡Producto guardado exitosamente!");
    adminModal.classList.add('hidden');
    formAddProduct.reset();
    loadStoreProducts();
  } catch (err) {
    alert("Error al guardar producto: " + err.message);
  }
});

// Cargar Productos en la Tienda
async function loadStoreProducts() {
  storeRows.innerHTML = "";
  try {
    const catSnapshot = await getDocs(collection(db, "categories"));
    const prodSnapshot = await getDocs(collection(db, "products"));

    const products = [];
    prodSnapshot.forEach(docSnap => products.push(docSnap.data()));

    if (catSnapshot.empty) {
      storeRows.innerHTML = `<p style="text-align:center; padding: 50px; opacity:0.6;">No hay categorías creadas aún. Usa el botón "Gestionar Tienda".</p>`;
      return;
    }

    catSnapshot.forEach(catSnap => {
      const catName = catSnap.data().name;
      const catProducts = products.filter(p => p.category === catName);

      let rowHTML = `
        <div class="category-row">
          <h2>${catName}</h2>
          <div class="product-slider">
      `;

      if (catProducts.length === 0) {
        rowHTML += `<p style="opacity: 0.5; font-size: 0.9rem;">No hay productos en esta categoría aún.</p>`;
      } else {
        catProducts.forEach(p => {
          rowHTML += `
            <div class="product-card">
              <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
              <h3>${p.name}</h3>
              <div class="price">$${p.price.toFixed(2)}</div>
            </div>
          `;
        });
      }

      rowHTML += `</div></div>`;
      storeRows.innerHTML += rowHTML;
    });
  } catch (err) {
    console.error("Error al renderizar tienda:", err);
  }
}

// Tema Claro / Oscuro
const btnTheme = document.getElementById('btn-theme');
const siteLogo = document.getElementById('site-logo');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  siteLogo.src = isLight ? "https://i.imgur.com/K4NjgRl.png" : "https://i.imgur.com/9W9C2TC.png";
});
