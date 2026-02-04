/**
 * ================================================================
 * ELITE VISION NETWORK - VENDOR DASHBOARD
 * ================================================================
 * Features:
 * ✅ Fetch codes with TYPE (Diamond/Gold)
 * ✅ Filter buttons: All, Active, Used, Sold (ORIGINAL STYLE)
 * ✅ Type filter buttons: Diamond, Gold (SEPARATE, SAME STYLE)
 * ✅ Stats cards for Diamond & Gold
 * ✅ Bulk operations
 * ================================================================
 */

// =================================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// =================================================

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

let auth, db;
let vendorUID = null;      
let vendorUsername = null; 
let allCodes = [];         

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Error initializing Firebase:", error);
}

// =================================================
// 2. DOM ELEMENTS AND STATE
// =================================================

const dashboardContainer = document.getElementById('dashboardContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeNameElement = document.getElementById('welcomeName');
const userNameDisplay = document.getElementById('userNameDisplay');
const userAvatar = document.getElementById('userAvatar');
const logoutBtnNav = document.getElementById('logoutBtnNav');
const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
const refreshCodesBtn = document.getElementById('refreshCodes');
const filterBtns = document.querySelectorAll('.filter-btn'); // All, Active, Used, Sold
const selectAllCheckbox = document.getElementById('selectAll');
const codesTableBody = document.getElementById('codesTableBody');
const bulkActions = document.getElementById('bulkActions');
const selectedCount = document.getElementById('selectedCount');
const bulkCopyBtn = document.getElementById('bulkCopyBtn');

// Stats elements
const totalCodesElement = document.getElementById('totalCodes');
const activeCodesElement = document.getElementById('activeCodes');
const usedCodesElement = document.getElementById('usedCodes');
const soldCodesElement = document.getElementById('soldCodes');

// ✅ NEW: Type-specific stats (IDs za ka saka a HTML)
const diamondCodesElement = document.getElementById('diamondCodes'); // 💎
const goldCodesElement = document.getElementById('goldCodes');       // 🏆

const codeModal = document.getElementById('codeModal');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCode = document.getElementById('modalCode');
const modalStatus = document.getElementById('modalStatus');
const modalUsedBy = document.getElementById('modalUsedBy');
const modalReferredBy = document.getElementById('modalReferredBy'); 
const modalUsedAt = document.getElementById('modalUsedAt');
const modalCreatedAt = document.getElementById('modalCreatedAt');
const modalCodeType = document.getElementById('modalCodeType'); // ✅ Type in modal
const modalCopyBtn = document.getElementById('modalCopyBtn');
const emptyTableMessage = document.getElementById('emptyTableMessage');
const body = document.getElementById('body');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const sidebarToggle = document.getElementById('sidebarToggle');
const closeSidebar = document.getElementById('closeSidebar');
const darkModeToggle = document.getElementById('darkModeToggle');

// ✅ Bulk Sold Button
const bulkMarkSoldBtn = document.createElement('button');
bulkMarkSoldBtn.setAttribute('class', 'bulk-copy-btn');
bulkMarkSoldBtn.setAttribute('id', 'bulkMarkSoldBtn');
bulkMarkSoldBtn.style.backgroundColor = 'var(--warning)';
bulkMarkSoldBtn.style.marginLeft = '10px';
bulkMarkSoldBtn.innerHTML = '<i class="fas fa-handshake"></i> Bulk Mark as Sold';
if (bulkCopyBtn?.parentNode) {
    bulkCopyBtn.parentNode.insertBefore(bulkMarkSoldBtn, bulkCopyBtn.nextSibling);
}

// Code Search Input
const filterControls = document.querySelector('.filter-controls');
const codeSearchInput = document.createElement('input');
codeSearchInput.setAttribute('type', 'text');
codeSearchInput.setAttribute('id', 'codeSearchInput');
codeSearchInput.setAttribute('placeholder', 'Paste or Search Code ID...');
codeSearchInput.style.cssText = 'padding: 8px 12px; border: 1px solid var(--light-grey); border-radius: 6px; flex: 1 1 200px;';

if (filterControls) {
    filterControls.appendChild(codeSearchInput);
}

// ✅ NEW: Type Filter Buttons Container (SEPARATE from status filters)
// Ka saka wannan BAYAN existing filter buttons a HTML, amma anan zan create dynamically
const typeFilterDiv = document.createElement('div');
typeFilterDiv.setAttribute('class', 'filter-buttons');
typeFilterDiv.setAttribute('id', 'typeFilterButtons');
typeFilterDiv.style.marginTop = '15px'; // Space from status filters
typeFilterDiv.innerHTML = `
    <button class="filter-btn type-filter-btn active" data-type="all">
        <i class="fas fa-layer-group"></i> All Types
    </button>
    <button class="filter-btn type-filter-btn" data-type="Diamond">
        <i class="fas fa-gem"></i> Diamond
    </button>
    <button class="filter-btn type-filter-btn" data-type="Gold">
        <i class="fas fa-medal"></i> Gold
    </button>
`;

// Insert type filters after the main filter controls
if (filterControls && filterControls.parentNode) {
    filterControls.parentNode.insertBefore(typeFilterDiv, filterControls.nextSibling);
}

// Global State
let currentFilter = 'active';      // all, active, used, sold
let currentTypeFilter = 'all';     // all, Diamond, Gold
let selectedCodes = new Set();
const vendorUsernameCache = {}; 

// Caching Keys
const CACHE_KEY_CODES = 'vendor_codes';
const CACHE_KEY_STATS = 'vendor_stats';

// =================================================
// 3. UTILITY & CACHING FUNCTIONS
// =================================================

/** Format Timestamp to readable date/time string */
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    let date;
    
    if (timestamp && typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return '-';
    }
    
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/** Copy text to clipboard */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Code(s) copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy. Please copy manually.');
    });
}

/** Show loading state */
function showLoading(message = 'Loading data...') {
    if (loadingOverlay) {
        const p = loadingOverlay.querySelector('.loading-content p');
        if(p) p.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
}

/** Hide loading state */
function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

/** Save data to localStorage */
function saveToCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving to cache:", e);
    }
}

/** Load data from localStorage */
function loadFromCache(key) {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error loading from cache:", e);
    }
    return null;
}

// =================================================
// 4. FIREBASE DATA FETCHING & LOGIC
// =================================================

/** Fetches the username of the referred vendor */
async function fetchReferredByUsername(uid) {
    if (!uid) return '-';
    if (vendorUsernameCache[uid]) return vendorUsernameCache[uid];

    try {
        const vendorDoc = await db.collection('vendors').doc(uid).get(); 
        if (vendorDoc.exists) {
            const name = vendorDoc.data().name || vendorDoc.data().username || uid;
            vendorUsernameCache[uid] = name;
            return name;
        }
    } catch (error) {
        console.error("Error fetching referred vendor username:", error);
    }
    return uid; 
}

/**
 * ================================================================
 * FETCH VENDOR CODES WITH TYPE
 * ================================================================
 */
async function fetchVendorCodes() {
    if (!vendorUsername) {
        console.error("❌ Vendor Username is missing. Cannot fetch codes.");
        return;
    }

    showLoading('Fetching your access codes...');
    
    try {
        const codesSnapshot = await db.collection('couponCodes')
            .where('username', '==', vendorUsername)
            .get();

        const fetchedCodes = codesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isUsed: doc.data().isUsed === true, 
            isSold: doc.data().isSold === true,
            type: doc.data().type || 'Unknown' // ✅ Fetch type
        }));

        // Sort by date (newest first)
        fetchedCodes.sort((a, b) => {
            const dateA = a.dateCreated && a.dateCreated.toDate ? a.dateCreated.toDate() : new Date(0);
            const dateB = b.dateCreated && b.dateCreated.toDate ? b.dateCreated.toDate() : new Date(0);
            return dateB - dateA; 
        });

        allCodes = fetchedCodes;
        saveToCache(CACHE_KEY_CODES, allCodes);

        console.log(`✅ Fetched ${allCodes.length} codes for ${vendorUsername}`);

        updateStats(true); 
        renderCodes(currentFilter, currentTypeFilter);
        
    } catch (error) {
        console.error("❌ Error fetching vendor codes:", error);
        alert("Error fetching codes. Please refresh.");
        codesTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--error-red);">Error fetching codes. Please try manual refresh.</td></tr>`;
    } finally {
        hideLoading();
    }
}

/**
 * ================================================================
 * UPDATE STATS WITH TYPE COUNTS
 * ================================================================
 */
function updateStats(shouldRecalculate = false) {
    const stats = {};
    
    if (shouldRecalculate) {
        const total = allCodes.length;
        const active = allCodes.filter(code => !code.isUsed && !code.isSold).length;
        const used = allCodes.filter(code => code.isUsed).length;
        const sold = allCodes.filter(code => !code.isUsed && code.isSold).length;
        
        // ✅ Count by type
        const diamond = allCodes.filter(code => code.type === 'Diamond').length;
        const gold = allCodes.filter(code => code.type === 'Gold').length;
        
        stats.total = total;
        stats.active = active;
        stats.used = used;
        stats.sold = sold;
        stats.diamond = diamond;
        stats.gold = gold;
        
        saveToCache(CACHE_KEY_STATS, stats);
        
        console.log(`📊 Stats - Total: ${total}, Active: ${active}, Used: ${used}, Sold: ${sold}, Diamond: ${diamond}, Gold: ${gold}`);
    } else {
        const cached = loadFromCache(CACHE_KEY_STATS);
        if (cached) Object.assign(stats, cached);
    }

    // Update UI
    if (totalCodesElement) totalCodesElement.textContent = (stats.total || 0).toLocaleString();
    if (activeCodesElement) activeCodesElement.textContent = (stats.active || 0).toLocaleString();
    if (usedCodesElement) usedCodesElement.textContent = (stats.used || 0).toLocaleString();
    if (soldCodesElement) soldCodesElement.textContent = (stats.sold || 0).toLocaleString();
    
    // ✅ Type stats
    if (diamondCodesElement) diamondCodesElement.textContent = (stats.diamond || 0).toLocaleString();
    if (goldCodesElement) goldCodesElement.textContent = (stats.gold || 0).toLocaleString();
}

/** Mark a code as sold */
async function markCodeAsSold(codeId, isBulk = false) {
    if (!vendorUsername) return;
    
    if (!isBulk) showLoading(`Marking code ${codeId} as sold...`);

    try {
        const codeRef = db.collection('couponCodes').doc(codeId);
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(codeRef);

            if (!doc.exists) {
                throw new Error("Code not found.");
            }

            const data = doc.data();
            if (data.isUsed === true) {
                 throw new Error("Code is already used.");
            }
            if (data.isSold === true) {
                 throw new Error("Code is already marked as sold.");
            }

            transaction.update(codeRef, {
                isSold: true,
                dateSold: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        if (!isBulk) alert(`Code ${codeId} successfully marked as SOLD!`);
        return true;

    } catch (error) {
        console.error(`❌ Error marking code ${codeId} as sold:`, error);
        if (!isBulk) alert(`Failed to mark code as sold: ${error.message}`);
        return false;
    } finally {
        if (!isBulk) hideLoading();
    }
}

// =================================================
// 5. UI RENDERING & INTERACTIONS
// =================================================

/** Load dashboard data with caching */
async function loadDashboardData() {
    const cachedCodes = loadFromCache(CACHE_KEY_CODES);
    const cachedStats = loadFromCache(CACHE_KEY_STATS);

    if (cachedCodes) {
        allCodes = cachedCodes; 
        renderCodes(currentFilter, currentTypeFilter);
    }
    if (cachedStats) updateStats(false);

    try {
        if (!cachedCodes && !cachedStats) {
            showLoading('Loading initial data from database...');
        } else {
            showLoading('Updating data in the background...');
            if(codesTableBody && !cachedCodes) codesTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading fresh data...</td></tr>';
        }

        await fetchVendorCodes();
        
    } catch (error) {
        console.error("❌ Error loading dashboard data:", error);
    } finally {
        if (loadingOverlay.classList.contains('hidden') === false) hideLoading(); 
    }
}

/**
 * ================================================================
 * RENDER CODES WITH DUAL FILTERING (Status + Type)
 * ================================================================
 */
function renderCodes(statusFilter = currentFilter, typeFilter = currentTypeFilter, codesToRender = null) {
    let filteredCodes = codesToRender || allCodes;
    
    // Apply filters if not rendering search results
    if (!codesToRender) {
        // 1. Filter by status first
        if (statusFilter === 'all') {
            // Show all codes
        } else if (statusFilter === 'active') {
            filteredCodes = filteredCodes.filter(code => !code.isUsed && !code.isSold);
        } else if (statusFilter === 'used') {
            filteredCodes = filteredCodes.filter(code => code.isUsed);
        } else if (statusFilter === 'sold') {
            filteredCodes = filteredCodes.filter(code => !code.isUsed && code.isSold);
        }
        
        // 2. Then filter by type
        if (typeFilter !== 'all') {
            filteredCodes = filteredCodes.filter(code => code.type === typeFilter);
        }
    }

    codesTableBody.innerHTML = '';
    
    if (filteredCodes.length === 0) {
        emptyTableMessage.style.display = 'block';
        return;
    }
    emptyTableMessage.style.display = 'none';

    selectedCodes.clear(); 
    updateBulkActions();
    if (selectAllCheckbox) selectAllCheckbox.checked = false;

    filteredCodes.forEach(code => {
        const row = document.createElement('tr');
        const isSelected = selectedCodes.has(code.id);
        
        const createdAtStr = formatTimestamp(code.dateCreated);
        const usedAtStr = formatTimestamp(code.dateUsed); 
        
        let statusBadge;
        let actionButtonHTML;
        
        if (code.isUsed) {
            statusBadge = '<span class="status error"><i class="fas fa-times-circle"></i> Used</span>';
            actionButtonHTML = `<button class="action-btn" disabled><i class="fas fa-ban"></i> N/A</button>`;
        } else if (code.isSold) { 
             statusBadge = '<span class="status pending"><i class="fas fa-cash-register"></i> Sold</span>';
             actionButtonHTML = `<button class="action-btn" disabled><i class="fas fa-check"></i> Sold</button>`;
        } else {
            statusBadge = '<span class="status success"><i class="fas fa-check-circle"></i> Active</span>';
            actionButtonHTML = `
                <button class="action-btn mark-sold-btn" data-id="${code.id}">
                    <i class="fas fa-handshake"></i> Mark as Sold
                </button>`;
        }
        
        row.innerHTML = `
            <td class="checkbox-cell">
                <input type="checkbox" class="code-checkbox" data-id="${code.id}" data-code="${code.code}" data-status="${code.isUsed ? 'used' : (code.isSold ? 'sold' : 'active')}" ${isSelected ? 'checked' : ''}>
            </td>
            <td>
                <div class="code-cell">
                    <span>${code.code}</span>
                </div>
            </td>
            <td>
                <button class="copy-btn" data-code="${code.code}">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
            <td>${code.type || '-'}</td>
            <td>${statusBadge}</td>
            <td>${code.usedBy || '-'}</td>
            <td>${createdAtStr}</td>
            <td>${code.dateUsed ? usedAtStr : '-'}</td>
            <td>
                ${actionButtonHTML}
                <button class="action-btn view-details" data-id="${code.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        codesTableBody.appendChild(row);
    });
    
    addCodeEventListeners();
    
    console.log(`✅ Rendered ${filteredCodes.length} codes (Status: ${statusFilter}, Type: ${typeFilter})`);
}

/** Updates bulk actions */
function updateBulkActions() {
    const count = selectedCodes.size;
    
    if (bulkActions) {
        if (count > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = `${count} code${count !== 1 ? 's' : ''} selected`;
            
            const hasNonActive = Array.from(selectedCodes).some(id => {
                const code = allCodes.find(c => c.id === id);
                return code && (code.isUsed || code.isSold);
            });
            bulkMarkSoldBtn.disabled = hasNonActive;
            bulkMarkSoldBtn.style.opacity = hasNonActive ? 0.5 : 1;
            
        } else {
            bulkActions.style.display = 'none';
        }
    }
}

/** Show code details in modal */
async function showCodeDetails(codeId) {
    const code = allCodes.find(c => c.id === codeId);
    if (!code) return;
    
    showLoading('Loading details...');

    const referredByName = await fetchReferredByUsername(code.referredBy);
    
    const createdAtStr = formatTimestamp(code.dateCreated);
    const usedAtStr = formatTimestamp(code.dateUsed);
    
    let statusText, statusColor;
    if (code.isUsed) {
        statusText = 'Used';
        statusColor = 'var(--error-red)';
    } else if (code.isSold) {
        statusText = 'Sold';
        statusColor = 'var(--warning)';
    } else {
        statusText = 'Active';
        statusColor = 'var(--success)';
    }
    
    modalCode.textContent = code.code;
    modalStatus.textContent = statusText;
    modalUsedBy.textContent = code.usedBy || '-';
    modalReferredBy.textContent = referredByName; 
    modalUsedAt.textContent = usedAtStr;
    modalCreatedAt.textContent = createdAtStr;
    
    // ✅ Show type
    if(modalCodeType) modalCodeType.textContent = code.type || 'Unknown';
    
    modalStatus.style.color = statusColor;
    
    if (codeModal) codeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    hideLoading();
}

/** Close modal */
function closeModalFunc() {
    if (codeModal) codeModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =================================================
// 6. EVENT LISTENER HANDLERS
// =================================================

/** Add dynamic event listeners to table rows */
function addCodeEventListeners() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            const code = this.getAttribute('data-code');
            copyToClipboard(code);
            
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalHTML;
            }, 2000);
        });
    });

    document.querySelectorAll('.mark-sold-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const codeId = this.getAttribute('data-id');
            if (confirm(`Are you sure you want to mark code ${codeId} as SOLD? This will make it unusable.`)) {
                markCodeAsSold(codeId);
            }
        });
    });
    
    document.querySelectorAll('.code-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const codeId = this.getAttribute('data-id');
            
            if (this.checked) {
                selectedCodes.add(codeId);
            } else {
                selectedCodes.delete(codeId);
            }
            
            const allCheckboxes = document.querySelectorAll('.code-checkbox');
            const checkedCount = document.querySelectorAll('.code-checkbox:checked').length;
            
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = (checkedCount === allCheckboxes.length && allCheckboxes.length > 0);
            }
            
            updateBulkActions();
        });
    });
    
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const codeId = this.getAttribute('data-id');
            showCodeDetails(codeId);
        });
    });
}

/** Setup all static event listeners */
function setupEventListeners() {
    // Sidebar toggles
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => { 
        sidebar.classList.add('open');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    if (closeSidebar) closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    if (mobileOverlay) mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Dark mode
    if (darkModeToggle) darkModeToggle.addEventListener('click', () => { 
        body.classList.toggle('dark-mode'); 
        const icon = darkModeToggle.querySelector('i');
        if (body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // ✅ STATUS Filter buttons (All, Active, Used, Sold)
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            codeSearchInput.value = ''; 
            selectedCodes.clear(); 
            updateBulkActions();
            renderCodes(currentFilter, currentTypeFilter); 
        });
    });
    
    // ✅ TYPE Filter buttons (All Types, Diamond, Gold)
    document.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTypeFilter = this.getAttribute('data-type');
            renderCodes(currentFilter, currentTypeFilter);
        });
    });

    // Code search
    if (codeSearchInput) {
        codeSearchInput.addEventListener('input', () => {
            const searchCode = codeSearchInput.value.trim().toUpperCase();
            
            filterBtns.forEach(b => b.classList.remove('active'));

            if (searchCode.length > 3) {
                const searchedCodes = allCodes.filter(code => code.code.includes(searchCode));
                renderCodes(null, null, searchedCodes); 
            } else if (searchCode.length === 0) {
                const defaultFilterBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
                if (defaultFilterBtn) defaultFilterBtn.classList.add('active');
                renderCodes(currentFilter, currentTypeFilter);
            }
        });
    }
    
    // Select all
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.code-checkbox');
            
            selectedCodes.clear();
            if (this.checked) {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                    selectedCodes.add(checkbox.getAttribute('data-id'));
                });
            } else {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            
            updateBulkActions();
        });
    }

    // Refresh
    if (refreshCodesBtn) {
        refreshCodesBtn.addEventListener('click', function() {
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            localStorage.removeItem(CACHE_KEY_CODES);
            localStorage.removeItem(CACHE_KEY_STATS);
            
            fetchVendorCodes().finally(() => {
                this.innerHTML = originalHTML;
            });
        });
    }

    // Bulk copy
    if (bulkCopyBtn) {
        bulkCopyBtn.addEventListener('click', function() {
            if (selectedCodes.size === 0) return;
            
            const selectedCodeValues = allCodes
                .filter(code => selectedCodes.has(code.id))
                .map(code => code.code);
            
            copyToClipboard(selectedCodeValues.join('\n'));
            
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalHTML;
            }, 2000);
        });
    }
    
    // Bulk mark as sold
    if (bulkMarkSoldBtn) {
        bulkMarkSoldBtn.addEventListener('click', async function() {
            if (selectedCodes.size === 0) return;
            
            const codesToMark = Array.from(selectedCodes).filter(id => {
                const code = allCodes.find(c => c.id === id);
                return code && !code.isUsed && !code.isSold;
            });
            
            if (codesToMark.length === 0) {
                alert("No active codes selected. Please select only ACTIVE codes to mark as sold.");
                return;
            }

            if (!confirm(`Are you sure you want to mark ${codesToMark.length} ACTIVE codes as SOLD? This action is permanent.`)) {
                return;
            }
            
            showLoading(`Marking ${codesToMark.length} codes as sold...`);
            let successCount = 0;
            
            for (const codeId of codesToMark) {
                const success = await markCodeAsSold(codeId, true); 
                if (success) {
                    successCount++;
                }
            }
            
            alert(`${successCount} codes successfully marked as SOLD!`);
            
            // Force refresh all data
            localStorage.removeItem(CACHE_KEY_CODES);
            localStorage.removeItem(CACHE_KEY_STATS);
            await fetchVendorCodes();
            
            hideLoading();
        });
    }

    // Modal events
    if (closeModal) closeModal.addEventListener('click', closeModalFunc);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModalFunc);

    // Modal copy button
    if (modalCopyBtn) {
        modalCopyBtn.addEventListener('click', function() {
            const code = modalCode.textContent;
            copyToClipboard(code);
            
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalHTML;
            }, 2000);
        });
    }
    
    // Logout buttons
    if (logoutBtnNav) logoutBtnNav.addEventListener('click', handleLogout);
    if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', handleLogout);

    window.addEventListener('resize', handleResize);
    
    // Make 'Active' filter button active by default on load
    document.querySelector(`.filter-btn[data-filter="active"]`)?.classList.add('active');
}

/** Logout function */
async function handleLogout() {
    try {
        localStorage.removeItem(CACHE_KEY_CODES);
        localStorage.removeItem(CACHE_KEY_STATS);
        
        await auth.signOut();
        window.location.href = "/sign-in"; 
    } catch (error) {
        alert("Error logging out: " + error.message);
        console.error("Logout error:", error);
    }
}

/** Responsive sidebar handling */
function handleResize() {
    const mainContent = document.getElementById('mainContent');
    if (window.innerWidth >= 768) {
        if (sidebar) sidebar.classList.add('open');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (mainContent) mainContent.classList.add('shift'); 
    } else {
        if (sidebar) sidebar.classList.remove('open');
        if (mainContent) mainContent.classList.remove('shift');
    }
}

// =================================================
// 7. AUTHENTICATION AND INITIALIZATION
// =================================================

/** Check user authentication and vendor status */
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const vendorDoc = await db.collection('vendors').doc(user.uid).get();

            if (vendorDoc.exists) {
                vendorUID = user.uid;
                const vendorData = vendorDoc.data();
                
                const displayName = vendorData.username || vendorData.name || "Vendor User";
                vendorUsername = displayName;
                
                if (welcomeNameElement) welcomeNameElement.textContent = displayName;
                if (userNameDisplay) userNameDisplay.textContent = displayName;
                if (userAvatar) userAvatar.textContent = displayName.charAt(0).toUpperCase();

                if (dashboardContainer) dashboardContainer.style.display = 'flex';
                handleResize();
                
                console.log(`✅ Vendor authenticated: ${vendorUsername}`);
                
                loadDashboardData();
                
            } else {
                console.warn("⚠️ User is logged in but not a vendor. Redirecting.");
                await auth.signOut();
                window.location.replace('/sign-in'); 
            }
        } catch (error) {
            console.error("❌ Error during vendor check:", error);
            await auth.signOut();
            window.location.replace('/hub/'); 
        }
    } else {
        console.log("ℹ️ No user logged in. Redirecting to sign-in.");
        window.location.replace('/sign-in');
    }
    hideLoading();
});

// Final initialization
setupEventListeners();

console.log(`
╔══════════════════════════════════════╗
║   ELITE VISION NETWORK               ║
║   Vendor Dashboard v2.0              ║
║   Dual Filtering: Status + Type 💎🏆 ║
╚══════════════════════════════════════╝
`);
