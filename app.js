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

// Carrito y Favoritos
let cart = JSON.parse(localStorage.getItem('cart') || "[]");
let wishlist = JSON.parse(localStorage.getItem('wishlist') || "[]");
let selectedVariant = null;

// DOM - Modales y Navegación
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

// DOM - Búsqueda y Filtros
const searchInput = document.getElementById('search-input');
const btnExecuteSearch = document.getElementById('btn-execute-search');
const btnToggleFilters = document.getElementById('btn-toggle-filters');
const filterModal = document.getElementById('filter-modal');
const closeFilter = document.getElementById('close-filter');
const filterCategory = document.getElementById('filter-category');
const filterPrice = document.getElementById('filter-price');
const btnApplyFilters = document.getElementById('btn-apply-filters');

// DOM - Vistas
const catalogView = document.getElementById('catalog-view');
const productDetailView = document.getElementById('product-detail-view');
const searchResultsView = document.getElementById('search-results-view');
const searchResultsTitle = document.getElementById('search-results-title');
const searchProductsGrid = document.getElementById('search-products-grid');
const btnBackFromSearch = document.getElementById('btn-back-from-search');

const btnBackToCatalog = document.getElementById('btn-back-to-catalog');
const formAddReview = document.getElementById('form-add-review');
const reviewsList = document.getElementById('reviews-list');

// DOM - Carrito y Favoritos
const cartModal = document.getElementById('cart-modal');
const btnCartModal = document.getElementById('btn-cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalPrice = document.getElementById('cart-total-price');

const wishlistModal = document.getElementById('wishlist-modal');
const btnWishlistModal = document.getElementById('btn-wishlist-modal');
const closeWishlist = document.getElementById('close-wishlist');
const wishlistItemsList = document.getElementById('wishlist-items-list');

let isLoginMode = true;

// --- MODALES & TABS ---
btnAuthModal.addEventListener('click', () => authModal.classList.remove('hidden'));
closeAuth.addEventListener('click', () => {
  if (!auth.currentUser) return; // Si no hay usuario, obliga a iniciar sesión
  authModal.classList.add('hidden');
});
pencilBtn.addEventListener('click', () => { adminModal.classList.remove('hidden'); loadAdminInventory(); });
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

btnToggleFilters.addEventListener('click', () => filterModal.classList.remove('hidden'));
closeFilter.addEventListener('click', () => filterModal.classList.add('hidden'));
btnApplyFilters.addEventListener('click', () => {
  filterModal.classList.add('hidden');
  renderFilteredStore();
});

btnBackToCatalog.addEventListener('click', () => {
  productDetailView.classList.add('hidden');
  catalogView.classList.remove('hidden');
});

function switchTab(activeBtn, activeContent) {
  [tabBtnInventory, tabBtnProduct, tabBtnCategory].forEach(b => b.classList.remove('active'));
  [tabContentInventory, formAddProduct, formAddCategory].forEach(c => c.classList.add('hidden'));
  activeBtn.classList.add('active');
  activeContent.classList.remove('hidden');
}
tabBtnInventory.addEventListener('click', () => { switchTab(tabBtnInventory, tabContentInventory); loadAdminInventory(); });
tabBtnProduct.addEventListener('click', () => { resetProductForm(); switchTab(tabBtnProduct, formAddProduct); });
tabBtnCategory.addEventListener('click', () => switchTab(tabBtnCategory, formAddCategory));

// --- AUTHENTICATION ---
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

btnLogout.addEventListener('click', async () => { 
  await signOut(auth); 
  authModal.classList.remove('hidden'); 
});

// --- GUARDIA DE SESIÓN OBLIGATORIA ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authModal.classList.add('hidden');
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
    loadStoreData();
  } else {
    // Si NO está autenticado, fuerzas inicio de sesión
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
    pencilBtn.classList.add('hidden');
    btnAuthModal.querySelector('#auth-btn-label').textContent = "Cuenta";
    authModal.classList.remove('hidden');
  }
});

// --- CARGA DE DATOS FIRESTORE ---
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

// --- BÚSQUEDA ---
function executeSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return;

  let history = JSON.parse(localStorage.getItem('searchHistory') || "[]");
  if (!history.includes(term)) {
    history.push(term);
    if (history.length > 5) history.shift();
    localStorage.setItem('searchHistory', JSON.stringify(history));
  }

  const matches = allProducts.filter(p => 
    p.name.toLowerCase().includes(term) || 
    (p.desc && p.desc.toLowerCase().includes(term)) ||
    (p.category && p.category.toLowerCase().includes(term))
  );

  catalogView.classList.add('hidden');
  productDetailView.classList.add('hidden');
  searchResultsView.classList.remove('hidden');

  searchResultsTitle.textContent = `Resultados de búsqueda según: "${term}" (${matches.length})`;

  if (matches.length === 0) {
    searchProductsGrid.innerHTML = `<p style="opacity: 0.6; text-align: center; width: 100%; padding: 40px;">No se encontraron productos relacionados.</p>`;
  } else {
    searchProductsGrid.innerHTML = matches.map(p => createProductCardHTML(p)).join('');
    attachCardEvents();
  }
}

btnExecuteSearch.addEventListener('click', executeSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });

btnBackFromSearch.addEventListener('click', () => {
  searchResultsView.classList.add('hidden');
  catalogView.classList.remove('hidden');
});

// --- RENDERIZADO DEL CATÁLOGO ---
function renderRecommendedRow() {
  const recRow = document.getElementById('recommended-row');
  const recSlider = document.getElementById('recommended-slider');
  const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || "[]");

  if (searchHistory.length === 0) { recRow.classList.add('hidden'); return; }

  const recommended = allProducts.filter(p => searchHistory.some(term => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)));

  if (recommended.length === 0) { recRow.classList.add('hidden'); return; }

  recRow.classList.remove('hidden');
  recSlider.innerHTML = recommended.map(p => createProductCardHTML(p)).join('');
  attachCardEvents();
}

function renderFilteredStore() {
  const catFilter = filterCategory.value;
  const priceFilter = filterPrice.value;

  let filtered = allProducts.filter(p => (catFilter === 'all') || (p.category === catFilter));

  if (priceFilter === 'asc') filtered.sort((a, b) => a.price - b.price);
  if (priceFilter === 'desc') filtered.sort((a, b) => b.price - a.price);

  storeRows.innerHTML = "";

  allCategories.forEach(catName => {
    const catProducts = filtered.filter(p => p.category === catName);
    let rowHTML = `<div class="category-row"><h2>${catName}</h2><div class="product-slider">`;

    if (catProducts.length === 0) {
      rowHTML += `<p style="opacity: 0.5; font-size: 0.9rem;">Sin productos en esta categoría.</p>`;
    } else {
      catProducts.forEach(p => { rowHTML += createProductCardHTML(p); });
    }
    rowHTML += `</div></div>`;
    storeRows.innerHTML += rowHTML;
  });

  attachCardEvents();
}

function getFirstImage(imgField) {
  if (!imgField) return 'https://via.placeholder.com/200x140?text=Sin+Imagen';
  const imgs = imgField.split(',').map(s => s.trim());
  return imgs[0] || 'https://via.placeholder.com/200x140?text=Sin+Imagen';
}

function createProductCardHTML(p) {
  const imgUrl = getFirstImage(p.image);
  return `
    <div class="product-card" data-id="${p.id}" style="cursor: pointer;">
      <img src="${imgUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x140?text=Imagen+Error'">
      <h3>${p.name}</h3>
      <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
    </div>
  `;
}

function attachCardEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      openProductPage(id);
    });
  });
}

// --- DETALLE DE PRODUCTO Y GALERÍA COMPLETA ---
async function openProductPage(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  activeProductId = id;
  selectedVariant = null;

  document.getElementById('detail-title').textContent = product.name;
  document.getElementById('detail-category').textContent = product.category;
  document.getElementById('detail-price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
  document.getElementById('detail-desc').textContent = product.desc || "Sin descripción disponible.";

  // Configuración de Galería
  const imageList = product.image ? product.image.split(',').map(s => s.trim()) : [];
  const mainImg = document.getElementById('detail-img');
  const thumbsContainer = document.getElementById('detail-gallery-thumbs');

  mainImg.src = imageList[0] || 'https://via.placeholder.com/200x140?text=Sin+Imagen';
  thumbsContainer.innerHTML = "";

  if (imageList.length > 1) {
    imageList.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.className = `gallery-thumb ${index === 0 ? 'active' : ''}`;
      thumb.onclick = () => {
        mainImg.src = imgUrl;
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      };
      thumbsContainer.appendChild(thumb);
    });
  }

  // Renderizar Opciones
  const variantsContainer = document.getElementById('detail-variants');
  variantsContainer.innerHTML = "";
  if (product.variants && product.variants.length > 0 && product.variants[0] !== "") {
    document.getElementById('detail-variants-container').classList.remove('hidden');
    product.variants.forEach(v => {
      const tag = document.createElement('button');
      tag.className = 'btn-secondary variant-btn';
      tag.style.marginRight = '5px';
      tag.textContent = v;
      tag.onclick = () => {
        document.querySelectorAll('.variant-btn').forEach(el => el.style.border = '1px solid currentColor');
        tag.style.border = '2px solid #4CAF50';
        selectedVariant = v;
      };
      variantsContainer.appendChild(tag);
    });
  } else {
    document.getElementById('detail-variants-container').classList.add('hidden');
  }

  // Renderizar Acciones
  const actionsContainer = document.getElementById('detail-actions-container');
  const isFav = wishlist.some(item => item.id === product.id);

  actionsContainer.innerHTML = `
    <button id="btn-add-to-cart" class="btn-primary" style="flex: 1;">Añadir al Carrito</button>
    <button id="btn-toggle-wishlist" class="btn-secondary" style="padding: 10px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'red' : 'none'}" stroke="${isFav ? 'red' : 'currentColor'}" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  `;

  document.getElementById('btn-add-to-cart').onclick = () => addToCart(product);
  document.getElementById('btn-toggle-wishlist').onclick = () => toggleWishlist(product);

  loadReviews(id);

  catalogView.classList.add('hidden');
  searchResultsView.classList.add('hidden');
  productDetailView.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// --- CARRITO DE COMPRAS ---
function addToCart(product) {
  if (product.variants && product.variants.length > 0 && product.variants[0] !== "" && !selectedVariant) {
    alert("Por favor selecciona una opción (Color/Talla) antes de agregar al carrito.");
    return;
  }

  cart.push({
    ...product,
    cartItemId: Date.now(),
    selectedVariant: selectedVariant || 'Estándar'
  });

  saveAndRenderCart();
  alert("¡Producto añadido al carrito!");
}

window.removeFromCart = function(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  saveAndRenderCart();
};

function saveAndRenderCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;

  cartItemsList.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p style="opacity:0.6; text-align:center;">Tu carrito está vacío.</p>`;
  } else {
    cart.forEach(item => {
      total += parseFloat(item.price);
      cartItemsList.innerHTML += `
        <div class="cart-item" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px;">
          <img src="${getFirstImage(item.image)}" width="50" height="50" style="object-fit:cover; border-radius:6px;">
          <div style="flex: 1; margin-left: 10px;">
            <strong style="display: block;">${item.name}</strong>
            <span style="font-size:0.85rem; opacity:0.7;">Opción: ${item.selectedVariant}</span>
            <div style="color: #4CAF50; font-weight: bold;">$${parseFloat(item.price).toFixed(2)}</div>
          </div>
          <button class="btn-secondary" onclick="removeFromCart(${item.cartItemId})" style="padding: 4px 8px;">✕</button>
        </div>
      `;
    });
  }
  cartTotalPrice.textContent = total.toFixed(2);
}

btnCartModal.onclick = () => { cartModal.classList.remove('hidden'); saveAndRenderCart(); };
closeCart.onclick = () => cartModal.classList.add('hidden');
document.getElementById('btn-checkout').onclick = () => alert("¡Gracias por tu compra! (Aquí integrarás la pasarela de pagos)");

// --- FAVORITOS (WISHLIST) ---
function toggleWishlist(product) {
  const index = wishlist.findIndex(item => item.id === product.id);
  if (index > -1) { wishlist.splice(index, 1); } else { wishlist.push(product); }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
  openProductPage(product.id);
}

function updateWishlistUI() {
  document.getElementById('wishlist-count').textContent = wishlist.length;
  wishlistItemsList.innerHTML = wishlist.length === 0
    ? `<p style="opacity:0.6; text-align:center; width: 100%;">No tienes favoritos guardados.</p>`
    : wishlist.map(p => createProductCardHTML(p)).join('');
  attachCardEvents();
}

btnWishlistModal.onclick = () => { wishlistModal.classList.remove('hidden'); updateWishlistUI(); };
closeWishlist.onclick = () => wishlistModal.classList.add('hidden');

// --- RESEÑAS ---
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
        <div class="review-item" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
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

// --- ADMIN PANEL ---
async function loadAdminInventory() {
  adminProductList.innerHTML = "Cargando productos...";
  adminCategoryList.innerHTML = "Cargando categorías...";

  try {
    const prodSnap = await getDocs(collection(db, "products"));
    adminProductList.innerHTML = prodSnap.empty ? `<p style="padding: 5px; opacity: 0.6;">No hay productos.</p>` : "";
    prodSnap.forEach(d => {
      const p = d.data();
      adminProductList.innerHTML += `
        <div class="admin-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span><strong>${p.name}</strong> - $${p.price}</span>
          <div>
            <button class="btn-sm btn-edit btn-secondary" data-id="${d.id}">Editar</button>
            <button class="btn-sm btn-delete btn-secondary" data-id="${d.id}" data-type="product">Borrar</button>
          </div>
        </div>
      `;
    });

    const catSnap = await getDocs(collection(db, "categories"));
    adminCategoryList.innerHTML = catSnap.empty ? `<p style="padding: 5px; opacity: 0.6;">No hay categorías.</p>` : "";
    catSnap.forEach(d => {
      const c = d.data();
      adminCategoryList.innerHTML += `
        <div class="admin-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span><strong>${c.name}</strong></span>
          <button class="btn-sm btn-delete btn-secondary" data-id="${d.id}" data-type="category">Borrar</button>
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

// TEMA
const btnTheme = document.getElementById('btn-theme');
const siteLogo = document.getElementById('site-logo');
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  siteLogo.src = isLight ? "https://i.imgur.com/K4NjgRl.png" : "https://i.imgur.com/9W9C2TC.png";
});

// INICIALIZACIÓN
saveAndRenderCart();
updateWishlistUI();
