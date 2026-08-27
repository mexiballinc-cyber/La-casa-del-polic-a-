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
let allProducts = [];
let allCategories = [];
let activeProductId = null;

// DOM
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

// Filtros y Búsqueda
const searchInput = document.getElementById('search-input');
const btnExecuteSearch = document.getElementById('btn-execute-search');
const btnToggleFilters = document.getElementById('btn-toggle-filters');
const filterModal = document.getElementById('filter-modal');
const closeFilter = document.getElementById('close-filter');
const filterCategory = document.getElementById('filter-category');
const filterPrice = document.getElementById('filter-price');
const btnApplyFilters = document.getElementById('btn-apply-filters');

// Vistas
const catalogView = document.getElementById('catalog-view');
const productDetailView = document.getElementById('product-detail-view');
const btnBackToCatalog = document.getElementById('btn-back-to-catalog');
const formAddReview = document.getElementById('form-add-review');
const reviewsList = document.getElementById('reviews-list');

let isLoginMode = true;

// Modales
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));
pencilBtn.addEventListener('click', () => { adminModal.classList.remove('hidden'); loadAdminInventory(); });
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

// Modal Filtros
btnToggleFilters.addEventListener('click', () => filterModal.classList.remove('hidden'));
closeFilter.addEventListener('click', () => filterModal.classList.add('hidden'));
btnApplyFilters.addEventListener('click', () => {
  filterModal.classList.add('hidden');
  renderFilteredStore();
});

// Navegación Vistas
btnBackToCatalog.addEventListener('click', () => {
  productDetailView.classList.add('hidden');
  catalogView.classList.remove('hidden');
});

// Tabs Admin
function switchTab(activeBtn, activeContent) {
  [tabBtnInventory, tabBtnProduct, tabBtnCategory].forEach(b => b.classList.remove('active'));
  [tabContentInventory, formAddProduct, formAddCategory].forEach(c => c.classList.add('hidden'));
  activeBtn.classList.add('active');
  activeContent.classList.remove('hidden');
}
tabBtnInventory.addEventListener('click', () => { switchTab(tabBtnInventory, tabContentInventory); loadAdminInventory(); });
tabBtnProduct.addEventListener('click', () => { resetProductForm(); switchTab(tabBtnProduct, formAddProduct); });
tabBtnCategory.addEventListener('click', () => switchTab(tabBtnCategory, formAddCategory));

// Auth
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
      await setDoc(doc(db, "users", userCredential.user.uid), { email, role: isUserAdmin ? "admin" : "client" });
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) { alert("Error: " + error.message); }
});

btnLogout.addEventListener('click', async () => { await signOut(auth); authModal.classList.add('hidden'); });

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

    userDisplayRole.textContent = isAdmin ? "Administrador" : "Cliente";
    pencilBtn.classList.toggle('hidden', !isAdmin);
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Mi Perfil";
  } else {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
    pencilBtn.classList.add('hidden');
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Cuenta";
  }
  loadStoreData();
});

// Cargar Datos
async function loadStoreData() {
  try {
    const catSnap = await getDocs(collection(db, "categories"));
    allCategories = [];
    filterCategory.innerHTML = `<option value="all">Todas las categorías</option>`;
    prodCategorySelect.innerHTML = `<option value="">Selecciona Categoría...</option>`;

    catSnap.forEach(d => {
      const c = d.data().name;
      allCategories.push(c);
      filterCategory.innerHTML += `<option value="${c}">${c}</option>`;
      prodCategorySelect.innerHTML += `<option value="${c}">${c}</option>`;
    });

    const prodSnap = await getDocs(collection(db, "products"));
    allProducts = [];
    prodSnap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

    renderRecommendedRow();
    renderFilteredStore();
  } catch (err) { console.error("Error al cargar tienda:", err); }
}

// Búsqueda & Guarda Historial (LocalStorage/Cookies)
function executeSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (term.length > 0) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || "[]");
    if (!history.includes(term)) {
      history.push(term);
      if (history.length > 5) history.shift();
      localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    renderRecommendedRow();
  }
  renderFilteredStore();
}

btnExecuteSearch.addEventListener('click', executeSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') executeSearch();
});

function renderRecommendedRow() {
  const recRow = document.getElementById('recommended-row');
  const recSlider = document.getElementById('recommended-slider');
  const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || "[]");

  if (searchHistory.length === 0) {
    recRow.classList.add('hidden');
    return;
  }

  const recommended = allProducts.filter(p => {
    return searchHistory.some(term => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );
  });

  if (recommended.length === 0) {
    recRow.classList.add('hidden');
    return;
  }

  recRow.classList.remove('hidden');
  recSlider.innerHTML = recommended.map(p => createProductCardHTML(p)).join('');
  attachCardEvents();
}

function renderFilteredStore() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const catFilter = filterCategory.value;
  const priceFilter = filterPrice.value;

  let filtered = allProducts.filter(p => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || (p.desc && p.desc.toLowerCase().includes(searchTerm));
    const matchesCategory = (catFilter === 'all') || (p.category === catFilter);
    return matchesSearch && matchesCategory;
  });

  if (priceFilter === 'asc') filtered.sort((a, b) => a.price - b.price);
  if (priceFilter === 'desc') filtered.sort((a, b) => b.price - a.price);

  storeRows.innerHTML = "";

  if (searchTerm || catFilter !== 'all' || priceFilter !== 'default') {
    if (filtered.length === 0) {
      storeRows.innerHTML = `<p style="text-align:center; padding: 40px; opacity: 0.6;">No se encontraron productos.</p>`;
      return;
    }
    let html = `<div class="category-row"><h2>Resultados de Búsqueda (${filtered.length})</h2><div class="product-slider" style="flex-wrap: wrap;">`;
    filtered.forEach(p => { html += createProductCardHTML(p); });
    html += `</div></div>`;
    storeRows.innerHTML = html;
  } else {
    allCategories.forEach(catName => {
      const catProducts = allProducts.filter(p => p.category === catName);
      let rowHTML = `<div class="category-row"><h2>${catName}</h2><div class="product-slider">`;

      if (catProducts.length === 0) {
        rowHTML += `<p style="opacity: 0.5; font-size: 0.9rem;">Sin productos en esta categoría.</p>`;
      } else {
        catProducts.forEach(p => { rowHTML += createProductCardHTML(p); });
      }
      rowHTML += `</div></div>`;
      storeRows.innerHTML += rowHTML;
    });
  }

  attachCardEvents();
}

function createProductCardHTML(p) {
  const imgUrl = (p.image && p.image.startsWith('http')) ? p.image : 'https://via.placeholder.com/200x140?text=Sin+Imagen';
  return `
    <div class="product-card" data-id="${p.id}">
      <img src="${imgUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x140?text=Imagen+Error'">
      <h3>${p.name}</h3>
      <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
    </div>
  `;
}

// Abrir Pantalla Completa de Producto
function attachCardEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      openProductPage(id);
    });
  });
}

async function openProductPage(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  activeProductId = id;

  document.getElementById('detail-title').textContent = product.name;
  document.getElementById('detail-category').textContent = product.category;
  document.getElementById('detail-price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
  document.getElementById('detail-desc').textContent = product.desc || "Sin descripción disponible.";
  document.getElementById('detail-img').src = product.image || 'https://via.placeholder.com/200x140?text=Sin+Imagen';

  const variantsContainer = document.getElementById('detail-variants');
  variantsContainer.innerHTML = "";
  if (product.variants && product.variants.length > 0 && product.variants[0] !== "") {
    document.getElementById('detail-variants-container').classList.remove('hidden');
    product.variants.forEach(v => {
      variantsContainer.innerHTML += `<span class="variant-tag">${v}</span>`;
    });
  } else {
    document.getElementById('detail-variants-container').classList.add('hidden');
  }

  loadReviews(id);

  catalogView.classList.add('hidden');
  productDetailView.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Reseñas
async function loadReviews(productId) {
  reviewsList.innerHTML = "Cargando opiniones...";
  try {
    const revSnap = await getDocs(collection(db, "products", productId, "reviews"));
    if (revSnap.empty) {
      reviewsList.innerHTML = `<p style="opacity: 0.5; font-size: 0.9rem;">Aún no hay opiniones sobre este producto.</p>`;
      return;
    }
    reviewsList.innerHTML = "";
    revSnap.forEach(docSnap => {
      const r = docSnap.data();
      const stars = "⭐".repeat(r.rating);
      reviewsList.innerHTML += `
        <div class="review-item">
          <div class="review-header">
            <strong>${r.userEmail || 'Anónimo'}</strong>
            <span>${stars}</span>
          </div>
          <p style="font-size: 0.9rem; margin-top: 6px;">${r.comment}</p>
        </div>
      `;
    });
  } catch (err) { console.error(err); }
}

formAddReview.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!auth.currentUser) return alert("Debes iniciar sesión para publicar una opinión.");

  const rating = parseInt(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment').value.trim();

  try {
    await addDoc(collection(db, "products", activeProductId, "reviews"), {
      userEmail: auth.currentUser.email,
      rating,
      comment,
      createdAt: new Date()
    });
    document.getElementById('review-comment').value = "";
    loadReviews(activeProductId);
  } catch (err) { alert("Error: " + err.message); }
});

// Admin Panel
async function loadAdminInventory() {
  adminProductList.innerHTML = "Cargando productos...";
  adminCategoryList.innerHTML = "Cargando categorías...";

  try {
    const prodSnap = await getDocs(collection(db, "products"));
    adminProductList.innerHTML = prodSnap.empty ? `<p style="padding: 5px; opacity: 0.6;">No hay productos.</p>` : "";
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

    const catSnap = await getDocs(collection(db, "categories"));
    adminCategoryList.innerHTML = catSnap.empty ? `<p style="padding: 5px; opacity: 0.6;">No hay categorías.</p>` : "";
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

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const type = e.target.getAttribute('data-type');
        if (confirm(`¿Estás seguro de eliminar este ${type === 'product' ? 'producto' : 'categoría'}?`)) {
          await deleteDoc(doc(db, type === 'product' ? "products" : "categories", id));
          loadAdminInventory();
          loadStoreData();
        }
      });
    });

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

btnCancelEditProd.addEventListener('click', () => { resetProductForm(); switchTab(tabBtnInventory, tabContentInventory); });

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
      alert("¡Producto actualizado!");
    } else {
      data.createdAt = new Date();
      await addDoc(collection(db, "products"), data);
      alert("¡Producto creado!");
    }
    resetProductForm();
    switchTab(tabBtnInventory, tabContentInventory);
    loadAdminInventory();
    loadStoreData();
  } catch (err) { alert("Error: " + err.message); }
});

formAddCategory.addEventListener('submit', async (e) => {
  e.preventDefault();
  const catName = document.getElementById('cat-name').value.trim();
  if (!catName) return;

  try {
    await addDoc(collection(db, "categories"), { name: catName, createdAt: new Date() });
    alert(`¡Categoría "${catName}" creada!`);
    document.getElementById('cat-name').value = "";
    switchTab(tabBtnInventory, tabContentInventory);
    loadAdminInventory();
    loadStoreData();
  } catch (err) { alert("Error: " + err.message); }
});

// Tema
const btnTheme = document.getElementById('btn-theme');
const siteLogo = document.getElementById('site-logo');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  siteLogo.src = isLight ? "https://i.imgur.com/K4NjgRl.png" : "https://i.imgur.com/9W9C2TC.png";
});
