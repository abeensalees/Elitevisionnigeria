// ========================================
// 🔥 REFERRALS PAGE - FULL JS WITH CACHE & DATE FILTER
// ========================================

// Firebase Config
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
let allReferrals = []; // Store all referrals for filtering

// ========================================
// 🚀 CACHE SYSTEM - Super Fast Loading!
// ========================================
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache

const cache = {
    userData: { data: null, timestamp: 0 },
    referrals: { data: null, timestamp: 0 }
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
// DARK MODE
// ========================================
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.getElementById('body');

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    const isDarkMode = body.classList.contains('dark-mode');
    
    icon.classList.toggle('fa-moon', !isDarkMode);
    icon.classList.toggle('fa-sun', isDarkMode);
    
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
});

// Check saved dark mode
if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

// ========================================
// AUTH CHECK
// ========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.uid);
        loadReferralData();
        setupDateFilter();
    } else {
        console.log('❌ No user logged in');
        window.location.replace('/sign-in.html');
    }
});

// ========================================
// 🎯 SETUP DATE FILTER
// ========================================
function setupDateFilter() {
    const filterSelect = document.getElementById('dateFilter');
    const customDateRange = document.getElementById('customDateRange');
    const applyCustomBtn = document.getElementById('applyCustomFilter');
    
    if (!filterSelect) return;
    
    filterSelect.addEventListener('change', function() {
        const value = this.value;
        
        if (value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            applyFilter(value);
        }
    });
    
    if (applyCustomBtn) {
        applyCustomBtn.addEventListener('click', () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                alert('Please select both start and end dates');
                return;
            }
            
            applyCustomDateFilter(startDate, endDate);
        });
    }
}

// ========================================
// 🔍 APPLY FILTER
// ========================================
function applyFilter(filterType) {
    if (allReferrals.length === 0) return;
    
    const now = new Date();
    let filteredReferrals = [];
    
    switch(filterType) {
        case 'all':
            filteredReferrals = allReferrals;
            break;
            
        case 'today':
            filteredReferrals = allReferrals.filter(ref => {
                const refDate = new Date(ref._timestamp);
                return refDate.toDateString() === now.toDateString();
            });
            break;
            
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            filteredReferrals = allReferrals.filter(ref => {
                const refDate = new Date(ref._timestamp);
                return refDate.toDateString() === yesterday.toDateString();
            });
            break;
            
        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredReferrals = allReferrals.filter(ref => {
                return ref._timestamp >= weekAgo.getTime();
            });
            break;
            
        case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filteredReferrals = allReferrals.filter(ref => {
                return ref._timestamp >= monthAgo.getTime();
            });
            break;
            
        case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            filteredReferrals = allReferrals.filter(ref => {
                return ref._timestamp >= yearAgo.getTime();
            });
            break;
            
        default:
            filteredReferrals = allReferrals;
    }
    
    console.log(`🔍 Filter: ${filterType} - Found ${filteredReferrals.length} referrals`);
    
    // Update count
    document.getElementById('totalReferrals').textContent = filteredReferrals.length;
    document.getElementById('filterCount').textContent = `(${filteredReferrals.length} of ${allReferrals.length})`;
    
    // Display filtered results
    displayReferralsTable(filteredReferrals);
}

// ========================================
// 🗓️ APPLY CUSTOM DATE FILTER
// ========================================
function applyCustomDateFilter(startDate, endDate) {
    if (allReferrals.length === 0) return;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const filteredReferrals = allReferrals.filter(ref => {
        return ref._timestamp >= start.getTime() && ref._timestamp <= end.getTime();
    });
    
    console.log(`🗓️ Custom Filter: ${startDate} to ${endDate} - Found ${filteredReferrals.length} referrals`);
    
    // Update count
    document.getElementById('totalReferrals').textContent = filteredReferrals.length;
    document.getElementById('filterCount').textContent = `(${filteredReferrals.length} of ${allReferrals.length})`;
    
    // Display filtered results
    displayReferralsTable(filteredReferrals);
}

// ========================================
// 🚀 LOAD REFERRAL DATA (WITH CACHE!)
// ========================================
async function loadReferralData(forceRefresh = false) {
    try {
        console.log('📊 Loading referral data...');

        // Check cache first
        if (!forceRefresh && isCacheValid('referrals')) {
            const cachedData = getCache('referrals');
            console.log('✅ Referrals loaded from cache (super fast!)');
            
            allReferrals = cachedData.referrals;
            document.getElementById('totalReferrals').textContent = cachedData.count;
            document.getElementById('filterCount').textContent = `(${cachedData.count} total)`;
            displayReferralsTable(cachedData.referrals);
            return;
        }

        // Load user data
        let userData;
        if (!forceRefresh && isCacheValid('userData')) {
            userData = getCache('userData');
            console.log('✅ User data from cache');
        } else {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('User data not found');
            }
            
            userData = userDoc.data();
            setCache('userData', userData);
            console.log('✅ User data loaded & cached');
        }

        const myUsername = userData.username;
        console.log('🔍 Fetching referrals for username:', myUsername);

        // Load referrals from Firebase
        const referralsSnapshot = await db.collection('users')
            .where('referredBy', '==', myUsername)
            .get();

        console.log(`✅ Found ${referralsSnapshot.size} referrals`);

        const referrals = [];

        referralsSnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Handle different timestamp formats
            let timestamp = 0;
            if (data.createdAt) {
                if (typeof data.createdAt.toMillis === 'function') {
                    timestamp = data.createdAt.toMillis();
                } else if (data.createdAt._seconds) {
                    timestamp = data.createdAt._seconds * 1000;
                } else if (data.createdAt.seconds) {
                    timestamp = data.createdAt.seconds * 1000;
                } else if (typeof data.createdAt === 'number') {
                    timestamp = data.createdAt;
                }
            }

            referrals.push({
                username: data.username || 'User',
                fullName: data.fullName || 'N/A',
                email: data.email || 'N/A',
                createdAt: data.createdAt,
                _timestamp: timestamp
            });
        });

        // Sort by timestamp (newest first)
        referrals.sort((a, b) => b._timestamp - a._timestamp);

        // Store all referrals globally
        allReferrals = referrals;

        // Cache the results
        const cacheData = {
            count: referralsSnapshot.size,
            referrals: referrals
        };
        setCache('referrals', cacheData);
        console.log('✅ Referrals cached for fast loading');

        // Display
        document.getElementById('totalReferrals').textContent = referralsSnapshot.size;
        document.getElementById('filterCount').textContent = `(${referralsSnapshot.size} total)`;
        displayReferralsTable(referrals);

    } catch (error) {
        console.error('❌ Error loading referrals:', error);
        showError();
    }
}

// ========================================
// DISPLAY REFERRALS TABLE
// ========================================
function displayReferralsTable(referrals) {
    const tableContent = document.getElementById('tableContent');

    if (referrals.length === 0) {
        tableContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>No Referrals Found</h3>
                <p>No referrals match your filter criteria.</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>S/N</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Date & Time</th>
                </tr>
            </thead>
            <tbody>
    `;

    referrals.forEach((referral, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td class="username">${referral.username}</td>
                <td>${referral.fullName}</td>
                <td class="date-time">${formatDateTime(referral.createdAt)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableContent.innerHTML = tableHTML;
}

// ========================================
// SHOW ERROR
// ========================================
function showError() {
    const tableContent = document.getElementById('tableContent');
    tableContent.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Error Loading Data</h3>
            <p>Failed to load referrals. Please refresh the page.</p>
        </div>
    `;
}

// ========================================
// FORMAT CURRENCY
// ========================================
function formatCurrency(amount) {
    return `₦${parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// ========================================
// 🔧 FORMAT DATE/TIME (FIXED FOR ALL FORMATS!)
// ========================================
function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    
    // Handle Firebase Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    }
    // Handle imported JSON format with _seconds
    else if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
    }
    // Handle alternative format with seconds
    else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    }
    // Handle regular timestamp number
    else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    }
    // Fallback - try to create date
    else {
        try {
            date = new Date(timestamp);
        } catch (error) {
            console.error('Error parsing date:', error);
            return 'Invalid Date';
        }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// 🔄 REFRESH BUTTON
// ========================================
window.refreshReferrals = function() {
    console.log('🔄 Force refreshing referrals...');
    clearCache('referrals');
    
    // Reset filter
    const filterSelect = document.getElementById('dateFilter');
    if (filterSelect) filterSelect.value = 'all';
    
    const customDateRange = document.getElementById('customDateRange');
    if (customDateRange) customDateRange.style.display = 'none';
    
    // Show loading
    const tableContent = document.getElementById('tableContent');
    tableContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Refreshing referrals...</p>
        </div>
    `;
    
    // Force refresh
    loadReferralData(true);
};

// ========================================
// 📊 EXPORT TO CSV (BONUS FEATURE!)
// ========================================
window.exportToCSV = function() {
    if (allReferrals.length === 0) {
        alert('No referrals to export');
        return;
    }
    
    // Get currently filtered referrals
    const filterSelect = document.getElementById('dateFilter');
    const filterType = filterSelect ? filterSelect.value : 'all';
    
    let exportData = allReferrals;
    
    // Apply current filter if not 'all'
    if (filterType !== 'all') {
        const filterCopy = filterSelect.value;
        filterSelect.value = filterType;
        // This will use the filtered data shown in the table
        const tbody = document.querySelector('tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            exportData = Array.from(rows).map(row => {
                const cells = row.querySelectorAll('td');
                const username = cells[1].textContent;
                return allReferrals.find(ref => ref.username === username);
            }).filter(Boolean);
        }
    }
    
    // Create CSV content
    let csv = 'S/N,Username,Full Name,Email,Date & Time\n';
    
    exportData.forEach((referral, index) => {
        csv += `${index + 1},"${referral.username}","${referral.fullName}","${referral.email}","${formatDateTime(referral.createdAt)}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${filterType}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV exported:', exportData.length, 'referrals');
};

// ========================================
// PAGE VISIBILITY - Auto refresh when page becomes visible
// ========================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
        // Check if cache is expired
        if (!isCacheValid('referrals')) {
            console.log('🔄 Page visible & cache expired - auto refreshing...');
            loadReferralData(true);
        }
    }
});

// ========================================
// INITIALIZATION
// ========================================
console.log('✅ Referrals Page Initialized with Cache System & Date Filter');
console.log('⚡ Cache Duration:', CACHE_DURATION / 1000, 'seconds');

