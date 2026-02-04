// ========================================
// MARKETPLACE.JS - Elite Vision Marketplace
// WITH CACHE & FIXES
// ========================================

// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAa8YOgFrM8IJToII7YqvKwIDFF9iKmUWs",
  authDomain: "elitevisionlast.firebaseapp.com",
  projectId: "elitevisionlast",
  storageBucket: "elitevisionlast.firebasestorage.app",
  messagingSenderId: "275944328231",
  appId: "1:275944328231:web:06e23d8a48ff56460cd202",
  measurementId: "G-5JHR0LWST3"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// ========================================
// 🚀 CACHE SYSTEM - Super Fast Loading!
// ========================================
const CACHE_DURATION = 60 * 60 * 1000; // 3 minutes cache

const cache = {
    products: { data: null, timestamp: 0 }
};

function isCacheValid(cacheKey) {
    const cached = cache[cacheKey];
    if (!cached || !cached.data) return false;
    return (Date.now() - cached.timestamp) < CACHE_DURATION;
}

function setCache(cacheKey, data) {
    cache[cacheKey] = {
        data: data,
        timestamp: Date.now()
    };
}

function getCache(cacheKey) {
    return cache[cacheKey]?.data || null;
}

function clearCache(cacheKey = null) {
    if (cacheKey) {
        cache[cacheKey] = { data: null, timestamp: 0 };
    } else {
        Object.keys(cache).forEach(key => {
            cache[key] = { data: null, timestamp: 0 };
        });
    }
}

// ========================================
// 🔧 GET TIMESTAMP (HANDLES ALL FORMATS!)
// ========================================
function getTimestamp(timestamp) {
    if (!timestamp) return 0;
    
    if (typeof timestamp.toMillis === 'function') {
        return timestamp.toMillis();
    }
    else if (timestamp._seconds) {
        return timestamp._seconds * 1000;
    }
    else if (timestamp.seconds) {
        return timestamp.seconds * 1000;
    }
    else if (typeof timestamp === 'number') {
        return timestamp;
    }
    
    return 0;
}

// Global Variables
let allProducts = [];
let filteredProducts = [];
let currentProduct = null;
let currentImageIndex = 0;
let currentUser = null;

// ========================================
// WAIT FOR DOM TO LOAD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Loaded - Initializing Marketplace with Cache...');
    
    // Get DOM Elements
    const body = document.getElementById('body');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const productsGrid = document.getElementById('productsGrid');
    const loadingContainer = document.getElementById('loadingContainer');
    const emptyState = document.getElementById('emptyState');
    const productModal = document.getElementById('productModal');
    const modalClose = document.getElementById('modalClose');
    const mainImage = document.getElementById('mainImage');
    const galleryThumbnails = document.getElementById('galleryThumbnails');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const modalBadge = document.getElementById('modalBadge');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalCategory = document.getElementById('modalCategory');
    const modalQuantity = document.getElementById('modalQuantity');
    const modalDescription = document.getElementById('modalDescription');
    const modalSeller = document.getElementById('modalSeller');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    // ========================================
    // UI FUNCTIONS
    // ========================================

    // Toggle sidebar
    if (menuToggle) {
        menuToggle.addEventListener('click', () => { 
            sidebar.classList.add('open');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Dropdown Menus
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.closest('.menu-dropdown');
            dropdown.classList.toggle('active');
        });
    });
    
    // Toggle dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => { 
            body.classList.toggle('dark-mode'); 
            const icon = darkModeToggle.querySelector('i');
            if (body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }

    // Check for saved dark mode
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.querySelector('i').classList.remove('fa-moon');
            darkModeToggle.querySelector('i').classList.add('fa-sun');
        }
    }

    // ========================================
    // AUTHENTICATION CHECK
    // ========================================
    function checkAuth() {
        return new Promise((resolve, reject) => {
            auth.onAuthStateChanged(user => {
                if (user) {
                    currentUser = user;
                    console.log("✅ User authenticated:", currentUser.uid);
                    resolve(user);
                } else {
                    console.log("❌ User not authenticated, redirecting...");
                    window.location.replace('/sign-in');
                    reject(new Error('Not authenticated'));
                }
            });
        });
    }
    
    // Check auth on load
    checkAuth().then(() => {
        fetchProducts();
    });
    
    // ========================================
    // SIMPLE LOGOUT FUNCTION
    // ========================================
    function logoutUser() {
        if (confirm('Are you sure you want to logout?')) {
            firebase.auth().signOut()
                .then(() => {
                    localStorage.clear();
                    clearCache();
                    window.location.replace('/sign-in');
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                    window.location.replace('/sign-in');
                });
        }
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

    // ========================================
    // 🚀 FETCH PRODUCTS (WITH CACHE!)
    // ========================================
    async function fetchProducts(forceRefresh = false) {
        try {
            console.log('📊 Fetching products...');
            
            // Check cache first
            if (!forceRefresh && isCacheValid('products')) {
                allProducts = getCache('products');
                console.log('✅ Products loaded from cache (super fast!)');
                filteredProducts = [...allProducts];
                displayProducts(filteredProducts);
                return;
            }
            
            // Show loading
            if (loadingContainer) loadingContainer.style.display = 'flex';
            if (productsGrid) productsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
            
            // Fetch from Firebase
            const productsRef = db.collection('products');
            const querySnapshot = await productsRef.where('status', '==', 'approved').get();
            
            if (querySnapshot.empty) {
                console.log('📭 No approved products found');
                showEmptyState();
                return;
            }
            
            console.log(`✅ Found ${querySnapshot.size} approved products`);
            
            // Convert to array with timestamps
            allProducts = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allProducts.push({
                    ...data,
                    _timestamp: getTimestamp(data.createdAt)
                });
            });
            
            // Sort by createdAt (newest first)
            allProducts.sort((a, b) => b._timestamp - a._timestamp);
            
            // Cache the results
            setCache('products', allProducts);
            console.log('✅ Products cached for fast loading');
            
            // Display
            filteredProducts = [...allProducts];
            displayProducts(filteredProducts);
            
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            showEmptyState('Error loading products. Please refresh the page.');
        }
    }

    // ========================================
    // 🔄 MANUAL REFRESH
    // ========================================
    window.refreshProducts = function() {
        console.log('🔄 Force refreshing products...');
        clearCache('products');
        fetchProducts(true);
    };

    // ========================================
    // DISPLAY PRODUCTS
    // ========================================
    function displayProducts(products) {
        if (loadingContainer) loadingContainer.style.display = 'none';
        
        if (products.length === 0) {
            showEmptyState();
            return;
        }
        
        if (productsGrid) productsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        if (productsGrid) productsGrid.innerHTML = '';
        
        products.forEach((product) => {
            const productCard = createProductCard(product);
            if (productsGrid) productsGrid.appendChild(productCard);
        });
        
        console.log(`✅ Displayed ${products.length} products`);
    }

    // ========================================
    // CREATE PRODUCT CARD
    // ========================================
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        
        const productImage = product.image1 || product.image2 || product.image3 || 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=No+Image';
        
        const description = product.description.length > 100 
            ? product.description.substring(0, 100) + '...' 
            : product.description;
        
        const showBadge = ['digital', 'electronics'].includes(product.category.toLowerCase());
        const badgeHTML = showBadge 
            ? `<div class="product-badge">${getCategoryLabel(product.category)}</div>` 
            : '';
        
        card.innerHTML = `
            <div class="product-image-container">
                ${badgeHTML}
                <img src="${productImage}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/400x300/10B981/FFFFFF?text=No+Image'">
            </div>
            <div class="product-content">
                <div class="product-category">${getCategoryLabel(product.category)}</div>
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${description}</p>
                <div class="product-footer">
                    <div class="product-price">₦${parseFloat(product.price).toLocaleString()}</div>
                    <div class="product-quantity">
                        <i class="fas fa-box"></i> ${product.quantity} available
                    </div>
                </div>
                <button class="btn-buy">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            </div>
        `;
        
        const buyBtn = card.querySelector('.btn-buy');
        if (buyBtn) {
            buyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openProductModal(product);
            });
        }
        
        return card;
    }

    // ========================================
    // GET CATEGORY LABEL
    // ========================================
    function getCategoryLabel(category) {
        const labels = {
            'digital': 'Digital Products',
            'electronics': 'Electronics',
            'fashion': 'Fashion',
            'home': 'Home & Garden',
            'sports': 'Sports',
            'books': 'Books'
        };
        return labels[category.toLowerCase()] || category;
    }

    // ========================================
    // OPEN PRODUCT MODAL
    // ========================================
    function openProductModal(product) {
        console.log('👁️ Opening modal for:', product.title);
        
        currentProduct = product;
        currentImageIndex = 0;
        
        const images = [product.image1, product.image2, product.image3].filter(img => img && img.trim() !== '');
        
        if (images.length === 0) {
            images.push('https://via.placeholder.com/600x400/10B981/FFFFFF?text=No+Image');
        }
        
        if (modalBadge) modalBadge.textContent = getCategoryLabel(product.category);
        if (modalTitle) modalTitle.textContent = product.title;
        if (modalPrice) modalPrice.textContent = `₦${parseFloat(product.price).toLocaleString()}`;
        if (modalCategory) modalCategory.textContent = getCategoryLabel(product.category);
        if (modalQuantity) modalQuantity.textContent = product.quantity;
        if (modalDescription) modalDescription.textContent = product.description;
        if (modalSeller) modalSeller.textContent = product.username || 'Unknown Seller';
        
        if (mainImage) {
            mainImage.src = images[0];
            mainImage.onerror = function() {
                this.src = 'https://via.placeholder.com/600x400/10B981/FFFFFF?text=No+Image';
            };
        }
        
        if (galleryThumbnails) {
            galleryThumbnails.innerHTML = '';
            images.forEach((img, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = img;
                thumbnail.alt = `Thumbnail ${index + 1}`;
                thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                thumbnail.dataset.index = index;
                thumbnail.onerror = function() {
                    this.src = 'https://via.placeholder.com/100x100/10B981/FFFFFF?text=No+Image';
                };
                
                thumbnail.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateMainImage(images);
                });
                
                galleryThumbnails.appendChild(thumbnail);
            });
        }
        
        updateNavButtons(images.length);
        currentProduct.images = images;
        
        if (productModal) {
            productModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // ========================================
    // UPDATE MAIN IMAGE
    // ========================================
    function updateMainImage(images) {
        if (mainImage) {
            mainImage.src = images[currentImageIndex];
        }
        
        if (galleryThumbnails) {
            const thumbnails = galleryThumbnails.querySelectorAll('.thumbnail');
            thumbnails.forEach((thumb, index) => {
                if (index === currentImageIndex) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
        
        updateNavButtons(images.length);
    }

    // ========================================
    // UPDATE NAVIGATION BUTTONS
    // ========================================
    function updateNavButtons(imageCount) {
        if (prevBtn) prevBtn.disabled = currentImageIndex === 0;
        if (nextBtn) nextBtn.disabled = currentImageIndex === imageCount - 1;
    }

    // ========================================
    // CLOSE MODAL
    // ========================================
    function closeModal() {
        if (productModal) {
            productModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        currentProduct = null;
        currentImageIndex = 0;
    }

    // ========================================
    // 🔥 HANDLE BUY PRODUCT (NO CONFIRM!)
    // ========================================
    function handleBuyProduct(product) {
        console.log('🛒 Buy button clicked for:', product.title);
        console.log('📱 Contact link:', product.link);
        
        // Validate link
        if (!product.link || product.link.trim() === '') {
            alert('❌ Contact link not available for this product.');
            return;
        }
        
        // Close modal first
        closeModal();
        
        // Direct open link - NO CONFIRMATION!
        window.open(product.link, '_blank');
        console.log('✅ Contact link opened directly');
    }

    // ========================================
    // SHOW EMPTY STATE
    // ========================================
    function showEmptyState(message = null) {
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (productsGrid) productsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        
        if (message && emptyState) {
            const emptyDescription = emptyState.querySelector('.empty-description');
            if (emptyDescription) {
                emptyDescription.textContent = message;
            }
        }
    }

    // ========================================
    // SEARCH FUNCTIONALITY
    // ========================================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const selectedCategory = categoryFilter ? categoryFilter.value : '';
            filterProducts(searchTerm, selectedCategory);
        });
    }

    // ========================================
    // CATEGORY FILTER
    // ========================================
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            filterProducts(searchTerm, selectedCategory);
        });
    }

    // ========================================
    // FILTER PRODUCTS
    // ========================================
    function filterProducts(searchTerm, category) {
        filteredProducts = allProducts.filter(product => {
            const matchesCategory = !category || product.category.toLowerCase() === category.toLowerCase();
            
            const matchesSearch = !searchTerm || 
                product.title.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm);
            
            return matchesCategory && matchesSearch;
        });
        
        console.log(`🔍 Filtered: ${filteredProducts.length} products`);
        displayProducts(filteredProducts);
    }

    // ========================================
    // MODAL EVENT LISTENERS
    // ========================================
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal && productModal.classList.contains('active')) {
            closeModal();
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.images && currentImageIndex > 0) {
                currentImageIndex--;
                updateMainImage(currentProduct.images);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.images && currentImageIndex < currentProduct.images.length - 1) {
                currentImageIndex++;
                updateMainImage(currentProduct.images);
            }
        });
    }

    // Modal Buy Button
    if (modalBuyBtn) {
        modalBuyBtn.addEventListener('click', () => {
            if (currentProduct) {
                handleBuyProduct(currentProduct);
            }
        });
    }

    console.log('✅ Elite Vision Marketplace Initialized with Cache');
});

console.log('📜 Marketplace script loaded - waiting for DOM...');