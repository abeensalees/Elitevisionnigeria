// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================================================
// Global Variables & DOM Elements
// ================================================
let vendorCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const vendorGrid = document.getElementById('vendorGrid');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.getElementById('body');

// ================================================
// Initialize Page
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    loadVendors();
    initDropdown();
});

// ================================================
// Load Vendors from Firebase
// ================================================
async function loadVendors() {
    try {
        // Check cache first
        if (isCacheValid()) {
            console.log('Using cached vendor data');
            displayVendors(vendorCache);
            return;
        }

        // Show loading
        vendorGrid.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading vendors...</p>
            </div>
        `;

        // Fetch vendors from Firestore vendors collection
        const vendorQuery = await db.collection('vendors')
            .get();

        if (vendorQuery.empty) {
            vendorGrid.innerHTML = `
                <div class="loading-container">
                    <i class="fas fa-store-slash" style="font-size: 48px; color: var(--text-light); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-light); font-size: 16px;">No vendors available at the moment</p>
                    <p style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Please check back later</p>
                </div>
            `;
            return;
        }

        // Process vendor data
        const vendorData = [];
        vendorQuery.forEach((doc) => {
            const data = doc.data();
            vendorData.push({
                id: doc.id,
                username: data.username,
                profilePic: data.profilePic,
                bankName: data.bankName,
                phone: data.phone
            });
        });

        // Cache the data
        vendorCache = vendorData;
        cacheTimestamp = Date.now();
        localStorage.setItem('vendorCache', JSON.stringify({
            data: vendorData,
            timestamp: cacheTimestamp
        }));

        // Display vendors
        displayVendors(vendorData);

    } catch (error) {
        console.error('Error loading vendors:', error);
        vendorGrid.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--error-red); margin-bottom: 15px;"></i>
                <p style="color: var(--error-red); font-size: 16px;">Failed to load vendors</p>
                <p style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Please refresh the page</p>
            </div>
        `;
    }
}

// ================================================
// Check Cache Validity
// ================================================
function isCacheValid() {
    // Check memory cache
    if (vendorCache && cacheTimestamp) {
        const age = Date.now() - cacheTimestamp;
        if (age < CACHE_DURATION) {
            return true;
        }
    }

    // Check localStorage
    const cached = localStorage.getItem('vendorCache');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            
            if (age < CACHE_DURATION) {
                vendorCache = parsed.data;
                cacheTimestamp = parsed.timestamp;
                return true;
            }
        } catch (error) {
            console.error('Error parsing cache:', error);
            localStorage.removeItem('vendorCache');
        }
    }

    return false;
}

// ================================================
// Display Vendors
// ================================================
function displayVendors(vendors) {
    vendorGrid.innerHTML = '';

    vendors.forEach((vendor, index) => {
        const rank = index + 1;
        
        // Default profile picture
        const profilePic = vendor.profilePic || 'avatar.png'
            //+(vendor.username ? vendor.username.charAt(0).toUpperCase() : 'V');

        // Create vendor card
        const vendorCard = document.createElement('div');
        vendorCard.className = 'vendor-card';
        
        vendorCard.innerHTML = `
           <!--<div class="rank-number">${rank}</div>-->
            
            <img src="${profilePic}" 
                 alt="${vendor.username}" 
                 class="vendor-profile-pic"
                 onerror="this.src='avatar.png'">
            
            <div class="vendor-info">
                <div class="vendor-username">
                    ${vendor.username || 'Vendor'}
                    <i class="fas fa-check-circle verified-badge"></i>
                </div>
                
                <div class="vendor-bank">
                    <i class="fas fa-university"></i>
                    ${vendor.bankName || 'Bank not set!'}
                </div>
            </div>
            
            <a href="#" 
               class="whatsapp-icon" 
               data-phone="${vendor.phone || ''}"
               data-username="${vendor.username || 'Vendor'}"
               onclick="openWhatsApp(event, this)"
               title="Contact on WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </a>
        `;

        vendorGrid.appendChild(vendorCard);
    });
}

// ================================================
// WhatsApp Integration
// ================================================
function openWhatsApp(event, button) {
    event.preventDefault();
    
    const phone = button.getAttribute('data-phone');
    const username = button.getAttribute('data-username');
    
    if (!phone) {
        alert('Phone number not available for this vendor');
        return;
    }
    

// Clean phone number (remove spaces, dashes, etc)  
const cleanPhone = phone.replace(/\D/g, '');  
  
// Create WhatsApp message  
const message = encodeURIComponent(  
    `Hello ${username}, I would like to purchase a coupon code from Elite Vision. Kindly send me your account details for payment. Thank you.`  
);  
  
// WhatsApp URL  
const whatsappURL = `https://wa.me/234${cleanPhone}?text=${message}`;  
// Open WhatsApp in new tab  
window.open(whatsappURL, '_blank');

}
// ================================================
// Sidebar Toggle
// ================================================
function openSidebar() {
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
}

function closeSidebarFunc() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
}

menuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);
mobileOverlay.addEventListener('click', closeSidebarFunc);

// Close sidebar on menu item click (mobile)
document.querySelectorAll('.menu-item:not(.dropdown-toggle)').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeSidebarFunc();
        }
    });
});

// ================================================
// Dropdown Menu Toggle
// ================================================
function initDropdown() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const menuDropdown = document.querySelector('.menu-dropdown');
    
    if (dropdownToggle && menuDropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            menuDropdown.classList.toggle('active');
        });
    }
}

// ================================================
// Dark Mode
// ================================================
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// ================================================
// Page Visibility - Refresh Cache
// ================================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isCacheValid()) {
        console.log('Cache expired, refreshing vendors...');
        loadVendors();
    }
});

// ================================================
// Refresh Vendors (Manual)
// ================================================
function refreshVendors() {
    vendorCache = null;
    cacheTimestamp = null;
    localStorage.removeItem('vendorCache');
    loadVendors();
}