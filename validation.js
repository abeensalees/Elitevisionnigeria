// ================================================
// Firebase Configuration
// ================================================
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
// DOM Elements
// ================================================
const codeInput = document.getElementById('codeInput');
const validateBtn = document.getElementById('validateBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.getElementById('body');

// ================================================
// Initialize
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initDropdown();
    
    // Allow Enter key to validate
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateCode();
        }
    });
    
    validateBtn.addEventListener('click', validateCode);
});

// ================================================
// Validate Code Function
// ================================================
async function validateCode() {
    const code = codeInput.value.trim().toUpperCase();
    
    // Validation
    if (!code) {
        showErrorModal('Please enter a code', 'The code field cannot be empty. Please enter a valid coupon code.');
        return;
    }
    
    if (code.length < 3) {
        showErrorModal('Invalid Code', 'The code is too short. Please enter a valid coupon code.');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Try to find code by document ID first
        let codeDoc = await db.collection('couponCodes').doc(code).get();
        
        // If not found by ID, search by 'code' field
        if (!codeDoc.exists) {
            const codeQuery = await db.collection('couponCodes')
                .where('code', '==', code)
                .limit(1)
                .get();
            
            if (!codeQuery.empty) {
                codeDoc = codeQuery.docs[0];
            }
        }
        
        // Check if code exists
        if (!codeDoc.exists) {
            showErrorModal('Code Not Found', 'This coupon code does not exist in our system. Please check the code and try again.');
            setLoadingState(false);
            return;
        }
        
        const codeData = codeDoc.data();
        
        // Check if code is used
        if (codeData.isUsed === true) {
            showUsedModal(codeData);
        } else {
            showAvailableModal(codeData);
        }
        
    } catch (error) {
        console.error('Error validating code:', error);
        showErrorModal('Validation Error', 'An error occurred while validating the code. Please try again later.');
    } finally {
        setLoadingState(false);
    }
}

// ================================================
// Get Type Badge HTML
// ================================================
function getTypeBadge(type) {
    if (!type) return '';
    
    const typeUpper = type.toUpperCase();
    let badgeClass = '';
    let icon = '';
    
    if (typeUpper === 'DIAMOND') {
        badgeClass = 'type-badge-diamond';
        icon = '💎';
    } else if (typeUpper === 'GOLD') {
        badgeClass = 'type-badge-gold';
        icon = '🏆';
    } else {
        badgeClass = 'type-badge-default';
        icon = '🎫';
    }
    
    return `<span class="type-badge ${badgeClass}">${icon} ${typeUpper}</span>`;
}

// ================================================
// Show Available Code Modal
// ================================================
function showAvailableModal(codeData) {
    const typeBadge = getTypeBadge(codeData.type);
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-icon success">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="modal-title success">✅ Code Available!</h2>
            <p class="modal-subtitle">This coupon code is valid and ready to use</p>
        </div>
        
        <div class="modal-body">
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Coupon Code</div>
                    <div class="info-value">${codeData.code || 'N/A'}</div>
                </div>
            </div>
            
            ${codeData.type ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Code Type</div>
                    <div class="info-value">${typeBadge}</div>
                </div>
            </div>
            ` : ''}
    
            ${codeData.username ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Sold By</div>
                    <div class="info-value">@${codeData.username}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="info-row" style="border-left-color: var(--success-green); background: rgba(16, 185, 129, 0.1);">
                <div class="info-icon" style="background: var(--success-green); color: white;">
                    <i class="fas fa-check"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: var(--success-green);">Available for Use</div>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn modal-btn-primary" onclick="closeModal()">
                <i class="fas fa-check"></i> Got It
            </button>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    modalOverlay.classList.add('active');
}

// ================================================
// Show Used Code Modal
// ================================================
function showUsedModal(codeData) {
    // Format date
    let dateUsedStr = 'Date not available';
    if (codeData.dateUsed) {
        const dateUsed = codeData.dateUsed.toDate();
        dateUsedStr = dateUsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    const typeBadge = getTypeBadge(codeData.type);
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-icon used">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h2 class="modal-title used">⚠️ Code Already Used</h2>
            <p class="modal-subtitle">This coupon code has already been redeemed</p>
        </div>
        
        <div class="modal-body">
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Coupon Code</div>
                    <div class="info-value">${codeData.code || 'N/A'} </div>
                </div>
            </div>
            
            ${codeData.type ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Code Type</div>
                    <div class="info-value">${typeBadge}</div>
                </div>
            </div>
            ` : ''}
            
            ${codeData.usedBy ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Used By</div>
                    <div class="info-value">@${codeData.usedBy}</div>
                </div>
            </div>
            ` : ''}
            
            ${codeData.referredBy ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-user-friends"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Referred By</div>
                    <div class="info-value">@${codeData.referredBy}</div>
                </div>
            </div>
            ` : ''}
    
            ${codeData.username ? `
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Sold By</div>
                    <div class="info-value">@${codeData.username}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="info-row">
                <div class="info-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Date Used</div>
                    <div class="info-value">${dateUsedStr}</div>
                </div>
            </div>
            
            <div class="info-row" style="border-left-color: #F59E0B; background: rgba(245, 158, 11, 0.1);">
                <div class="info-icon" style="background: #F59E0B; color: white;">
                    <i class="fas fa-times"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #F59E0B;">Already Redeemed</div>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn modal-btn-primary" onclick="closeModal()">
                <i class="fas fa-check"></i> Understood
            </button>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    modalOverlay.classList.add('active');
}

// ================================================
// Show Error Modal
// ================================================
function showErrorModal(title, message) {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-icon error">
                <i class="fas fa-times-circle"></i>
            </div>
            <h2 class="modal-title error">❌ ${title}</h2>
            <p class="modal-subtitle">${message}</p>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn modal-btn-primary" onclick="closeModal()">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    modalOverlay.classList.add('active');
}

// ================================================
// Close Modal
// ================================================
function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
        modal.innerHTML = '';
    }, 300);
}

// Close modal when clicking overlay
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// ================================================
// Loading State
// ================================================
function setLoadingState(loading) {
    if (loading) {
        validateBtn.disabled = true;
        validateBtn.innerHTML = `
            <div class="spinner-btn"></div>
            <span>Validating...</span>
        `;
    } else {
        validateBtn.disabled = false;
        validateBtn.innerHTML = `
            <i class="fas fa-search"></i>
            <span>Validate Code</span>
        `;
    }
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
// Dropdown Menu
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

