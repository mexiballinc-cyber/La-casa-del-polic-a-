import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const pencilBtn = document.getElementById('admin-pencil-btn');
const btnLogout = document.getElementById('btn-logout');
const authToggleLink = document.getElementById('auth-toggle-link');
const authTitle = document.getElementById('auth-title');

const loggedOutView = document.getElementById('auth-logged-out-view');
const loggedInView = document.getElementById('auth-logged-in-view');
const userDisplayEmail = document.getElementById('user-display-email');
const userDisplayRole = document.getElementById('user-display-role');
const profileInitial = document.getElementById('profile-initial');

const adminModal = document.getElementById('admin-modal');
const closeAdmin = document.getElementById('close-admin');

// Pestañas Admin
const tabBtnInventory = document.getElementById('tab-btn-inventory');
const tabBtnProduct = document.getElementById('tab-btn-product');
const tabBtnCategory = document.getElementById('tab-btn-category');
const tabContentInventory = document.getElementById('tab-content-inventory');
const formAddProduct = document.getElementById('form-add-product');
const formAddCategory = document.getElementById('form-add-category');

const adminProductList = document.getElementById('admin-product-list');
const adminCategoryList = document.getElementById('admin-category-list');
const prodCategorySelect = document.getElementById('prod-category');
const storeRows = document.getElementById('store-rows');
const prodIdEdit = document.getElementById('prod-id-edit');
const formProductTitle = document.getElementById('form-product-title');
const btnSaveProduct = document.getElementById('btn-save-product');
const btnCancelEditProd = document.getElementById('btn-cancel-edit-prod');

let isLoginMode = true;

// Eventos Modales
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

pencilBtn.addEventListener('click', () => {
  adminModal.classList.remove('hidden');
  loadCategories();
  loadAdminInventory();
});
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

// Control de Pestañas Admin
function switchTab(activeBtn, activeContent) {
  [tabBtnInventory, tabBtnProduct, tabBtnCategory].forEach(b => b.classList.remove('active'));
  [tabContentInventory, formAddProduct, formAddCategory].forEach(c => c.classList.add('hidden'));
  activeBtn.classList.add('active');
  activeContent.classList.remove('hidden');
}

tabBtnInventory.addEventListener('click', () => { switchTab(tabBtnInventory, tabContentInventory); loadAdminInventory(); });
tabBtnProduct.addEventListener('click', () => { resetProductForm(); switchTab(tabBtnProduct, formAddProduct); });
tabBtnCategory.addEventListener('click', () => switchTab(tabBtnCategory, formAddCategory));

// Switch Login / Registro
authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Iniciar Sesión" : "Crear Cuenta";
  authToggleLink.textContent = isLoginMode ? "Regístrate" : "Inicia Sesión";
});

// Login / Registro
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
      await setDoc(doc(db, "users", userCredential.user.uid), { email, role: isUserAdmin ? "admin" : "client" });
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) { alert("Error: " + error.message); }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
  authModal.classList.add('hidden');
});

// Auth Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    
    userDisplayEmail.textContent = user.email;
    profileInitial.textContent = user.email.charAt(0).toUpperCase();

    let isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

    if (!isAdmin) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") isAdmin = true;
      } catch (e) { console.error(e); }
    }

    if (isAdmin) {
      userDisplayRole.textContent = "Administrador";
      pencilBtn.classList.remove('hidden');
    } else {
      userDisplayRole.textContent = "Cliente";
      pencilBtn.classList.add('hidden');
    }

    btnAuthModal.querySelector('#auth-btn-label').textContent = "Mi Perfil";
  } else {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
    pencilBtn.classList.add('hidden');
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Cuenta";
  }

  loadStoreProducts();
});

// Cargar Categorías en Selector
async function loadCategories() {
  try {
    prodCategorySelect.innerHTML = `<option value="">Selecciona Categoría...</option>`;
    const querySnapshot = await getDocs(collection(db, "categories"));
    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      prodCategorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
  } catch (err) { console.error(err); }
}

// Cargar Lista de Inventario Admin (Editar / Borrar)
async function loadAdminInventory() {
  adminProductList.innerHTML = "Cargando productos...";
  adminCategoryList.innerHTML = "Cargando categorías...";

  try {
    // 1. Productos
    const prodSnap = await getDocs(collection(db, "products"));
    if (prodSnap.empty) {
      adminProductList.innerHTML = `<p style="padding: 5px; opacity: 0.6;">No hay productos.</p>`;
    } else {
      adminProductList.innerHTML = "";
      prodSnap.forEach(d => {
        const p = d.data();
        adminProductList.innerHTML += `
          <div class="admin-item">
            <span><strong>${p.name}</strong> - $${p.price} (${p.category})</span>
            <div class="admin-item-actions">
              <button class="btn-sm btn-edit" data-id="${d.id}">Editar</button>
              <button class="btn-sm btn-delete" data-id="${d.id}" data-type="product">Borrar</button>
            </div>
          </div>
        `;
      });
    }

    // 2. Categorías
    const catSnap = await getDocs(collection(db, "categories"));
    if (catSnap.empty) {
      adminCategoryList.innerHTML = `<p style="padding: 5px; opacity: 0.6;">No hay categorías.</p>`;
    } else {
      adminCategoryList.innerHTML = "";
      catSnap.forEach(d => {
        const c = d.data();
        adminCategoryList.innerHTML += `
          <div class="admin-item">
            <span><strong>${c.name}</strong></span>
            <div class="admin-item-actions">
              <button class="btn-sm btn-delete" data-id="${d.id}" data-type="category">Borrar</button>
            </div>
          </div>
        `;
      });
    }

    // Eventos de botones Borrar
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const type = e.target.getAttribute('data-type');
        if (confirm(`¿Estás seguro de eliminar este ${type === 'product' ? 'producto' : 'categoría'}?`)) {
          await deleteDoc(doc(db, type === 'product' ? "products" : "categories", id));
          loadAdminInventory();
          loadStoreProducts();
        }
      });
    });

    // Eventos de botones Editar Producto
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
          const p = docSnap.data();
          prodIdEdit.value = id;
          document.getElementById('prod-name').value = p.name;
          document.getElementById('prod-desc').value = p.desc || "";
          document.getElementById('prod-price').value = p.price;
          document.getElementById('prod-images').value = p.image || "";
          document.getElementById('prod-variants').value = (p.variants || []).join(', ');
          
          await loadCategories();
          prodCategorySelect.value = p.category;

          formProductTitle.textContent = "Editar Producto";
          btnSaveProduct.textContent = "Actualizar Producto";
          btnCancelEditProd.classList.remove('hidden');

          switchTab(tabBtnProduct, formAddProduct);
        }
      });
    });

  } catch (err) { console.error(err); }
}

function resetProductForm() {
  prodIdEdit.value = "";
  formAddProduct.reset();
  formProductTitle.textContent = "Crear Producto";
  btnSaveProduct.textContent = "Guardar Producto";
  btnCancelEditProd.classList.add('hidden');
}

btnCancelEditProd.addEventListener('click', () => {
  resetProductForm();
  switchTab(tabBtnInventory, tabContentInventory);
});

// Guardar / Editar Producto
formAddProduct.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = prodIdEdit.value;
  const name = document.getElementById('prod-name').value;
  const desc = document.getElementById('prod-desc').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = prodCategorySelect.value;
  const image = document.getElementById('prod-images').value.trim();
  const variants = document.getElementById('prod-variants').value.split(',').map(s => s.trim());

  if (!category) return alert("Selecciona una categoría");

  try {
    const data = { name, desc, price, category, image, variants, updatedAt: new Date() };

    if (id) {
      await updateDoc(doc(db, "products", id), data);
      alert("¡Producto actualizado correctamente!");
    } else {
      data.createdAt = new Date();
      await addDoc(collection(db, "products"), data);
      alert("¡Producto creado exitosamente!");
    }

    resetProductForm();
    switchTab(tabBtnInventory, tabContentInventory);
    loadAdminInventory();
    loadStoreProducts();
  } catch (err) { alert("Error: " + err.message); }
});

// Crear Categoría
formAddCategory.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('cat-name');
  const catName = nameInput.value.trim();
  if (!catName) return;

  try {
    await addDoc(collection(db, "categories"), { name: catName, createdAt: new Date() });
    alert(`¡Categoría "${catName}" creada!`);
    nameInput.value = "";
    loadCategories();
    switchTab(tabBtnInventory, tabContentInventory);
    loadAdminInventory();
    loadStoreProducts();
  } catch (err) { alert("Error: " + err.message); }
});

// Cargar Productos en Tienda
async function loadStoreProducts() {
  storeRows.innerHTML = "";
  try {
    const catSnapshot = await getDocs(collection(db, "categories"));
    const prodSnapshot = await getDocs(collection(db, "products"));

    const products = [];
    prodSnapshot.forEach(docSnap => products.push(docSnap.data()));

    if (catSnapshot.empty) {
      storeRows.innerHTML = `<p style="text-align:center; padding: 50px; opacity:0.6;">No hay categorías aún. Usa el botón "Gestionar Tienda".</p>`;
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
        rowHTML += `<p style="opacity: 0.5; font-size: 0.9rem;">Sin productos en esta categoría.</p>`;
      } else {
        catProducts.forEach(p => {
          const imgUrl = (p.image && p.image.startsWith('http')) ? p.image : 'https://via.placeholder.com/200x140?text=Sin+Imagen';
          rowHTML += `
            <div class="product-card">
              <img src="${imgUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x140?text=Imagen+Error'">
              <h3>${p.name}</h3>
              <div class="price">$${p.price.toFixed(2)}</div>
            </div>
          `;
        });
      }

      rowHTML += `</div></div>`;
      storeRows.innerHTML += rowHTML;
    });
  } catch (err) { console.error("Error al renderizar tienda:", err); }
}

// Tema Claro/Oscuro
const btnTheme = document.getElementById('btn-theme');
const siteLogo = document.getElementById('site-logo');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  siteLogo.src = isLight ? "https://i.imgur.com/K4NjgRl.png" : "https://i.imgur.com/9W9C2TC.png";
});
