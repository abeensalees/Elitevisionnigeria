
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// GLOBAL VARIABLES
let currentUser = null;
let cachedUserData = null;

// DOM Elements
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');

const welcomeUserNameEl = document.getElementById('welcomeUserName');
const sidebarProfileNameEl = document.getElementById('sidebarProfileName');
const sidebarProfileRoleEl = document.getElementById('sidebarProfileRole');
const sidebarProfileImgEl = document.getElementById('sidebarProfileImg');
const vendorLink = document.getElementById('vendor');
const mainProfileImgEl = document.getElementById('mainProfileImg');

const affiliateWalletEl = document.getElementById('affiliateWallet');
const taskWalletEl = document.getElementById('taskWallet');
const gameWalletEl = document.getElementById('gameWallet');

const totalReferralsEarnedEl = document.getElementById('totalReferralsEarned');
const totalSubEarningsEl = document.getElementById('totalSubEarnings');

const totalWalletsBalanceEl = document.getElementById('totalWalletsBalance');
const totalWalletsEarnedEl = document.getElementById('totalWalletsEarned');

const referralLinkInputEl = document.getElementById('referralLinkInput');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const referralLinkShare = document.getElementById('referralLinkShare');

const transactionsTableBodyEl = document.getElementById('transactionsTableBody');

const adCardTitleEl = document.getElementById('adCardTitle');
const adCardDescriptionEl = document.getElementById('adCardDescription');
const adCardImageEl = document.getElementById('adCardImage');
const adCardActionEl = document.getElementById('adCardAction');

const announcementModal = document.getElementById('announcementModal');
const specialOfferModal = document.getElementById('specialOfferModal');
const closeAnnouncement = document.getElementById('closeAnnouncement');
const closeAnnouncementBtn = document.getElementById('closeAnnouncementBtn');
const closeSpecialOffer = document.getElementById('closeSpecialOffer');
const closeOfferBtn = document.getElementById('closeOfferBtn');
const announcementTitleEl = document.getElementById('announcementTitle');
const announcementMessageEl = document.getElementById('announcementMessage');
const announcementImageEl = document.getElementById('announcementImage');
const offerModalTitleEl = document.getElementById('offerModalTitle');
const offerModalMessageEl = document.getElementById('offerModalMessage');
const offerImageEl = document.getElementById('offerImage');
const offerModalActionBtn = document.getElementById('offerModalAction');

const accountTypeBadgeEl = document.getElementById('accountTypeBadge');

// UTILITY FUNCTIONS
const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString('en-US')}`;
};

const getFromLocalStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return null;
    }
};

const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
    }
};

const isCacheValid = (cacheKey, maxAge = 5 * 60 * 1000) => { // ✅ 5 minutes cache
    const cached = getFromLocalStorage(cacheKey);
    if (!cached || !cached.timestamp) return false;
    return (Date.now() - cached.timestamp) < maxAge;
};

// ✅ HELPER: Get timestamp in milliseconds
function getTimestampMillis(timestamp) {
    if (!timestamp) return 0;
    
    try {
        if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
            return timestamp.toMillis();
        }
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().getTime();
        }
        if (timestamp.seconds !== undefined || timestamp._seconds !== undefined) {
            const seconds = timestamp.seconds || timestamp._seconds;
            return seconds * 1000;
        }
        return new Date(timestamp).getTime();
    } catch (error) {
        console.warn('Timestamp conversion error:', error);
        return 0;
    }
}

// ✅ HELPER: Format date/time
function formatDateTime(timestamp) {
    const millis = getTimestampMillis(timestamp);
    if (millis === 0) return 'N/A';
    
    try {
        const date = new Date(millis);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
        
        return `${dateStr}, ${timeStr}`;
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'N/A';
    }
}

function animateCountUp(element, finalValue, duration = 1800) { 
    if (!element) return;
    
    element.textContent = formatCurrency(0);
    
    const startValue = 0;
    const startTime = performance.now();
    
    const step = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentValue = Math.floor(progress * finalValue);
        
        element.textContent = formatCurrency(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = formatCurrency(finalValue);
        }
    };
    
    requestAnimationFrame(step);
}

if (vendorLink) {
    vendorLink.style.display = 'none';
}

// ============================================================================
// ✅ CHECK USER STATUS (NO REAL-TIME, JUST ONE-TIME CHECK)
// ============================================================================
async function checkUserStatus(uid) {
    try {
        console.log('👁️ Checking user status...');
        
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            console.warn('⚠️ User document not found');
            handleBannedUser('Your account was not found.');
            return false;
        }
        
        const userData = userDoc.data();
        const status = userData.status || 'active';
        
        console.log('📊 User status:', status);
        
        if (status === 'banned') {
            console.warn('🚫 User is banned');
            handleBannedUser('Your account has been banned. Please contact support.');
            return false;
        }
        
        return true; // ✅ Active
        
    } catch (error) {
        console.error('❌ Status check error:', error);
        // Don't block user on error, just log it
        return true;
    }
}

function handleBannedUser(message) {
    alert(message);
    
    // Clear everything and logout
    auth.signOut().then(() => {
        localStorage.clear(); // ✅ Clear all cached data
        window.location.replace('/sign-in');
    }).catch((error) => {
        console.error('Logout error:', error);
        localStorage.clear();
        window.location.replace('/sign-in');
    });
}

// AUTHENTICATION CHECK
function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                resolve(user);
            } else {
                console.warn("User not authenticated. Redirecting to login...");
                window.location.replace('/sign-in');
                reject(new Error('Not authenticated'));
            }
        });
    });
}

// LOGOUT
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.clear(); // ✅ Clear all data on logout
                window.location.replace('/sign-in');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                localStorage.clear();
                window.location.replace('/sign-in');
            });
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

// ✅ FETCH USER DATA (WITH CACHE & STATUS CHECK)
async function fetchUserData(forceRefresh = false) {
    const cacheKey = `userData_${currentUser.uid}`;
    
    // Check cache first
    if (!forceRefresh && isCacheValid(cacheKey)) {
        console.log("✅ Loading user data from cache");
        cachedUserData = getFromLocalStorage(cacheKey).data;
        return cachedUserData;
    }

    try {
        console.log("📡 Fetching user data from Firestore...");
        
        // ✅ Check status first
        const isActive = await checkUserStatus(currentUser.uid);
        if (!isActive) {
            throw new Error('User banned or not found');
        }
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }

        const userData = userDoc.data();
        
        // Save to cache
        saveToLocalStorage(cacheKey, {
            data: userData,
            timestamp: Date.now()
        });
        
        cachedUserData = userData;
        return userData;
        
    } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Fallback to cache if available
        const cached = getFromLocalStorage(cacheKey);
        if (cached) {
            console.warn("⚠️ Using stale cache due to error");
            cachedUserData = cached.data;
            return cachedUserData;
        }
        
        throw error;
    }
}

// VENDOR ACCESS CHECK
async function checkVendorAccess() {
    if (!currentUser || !vendorLink) return;

    try {
        const vendorSnap = await db
            .collection('vendors')
            .where('uid', '==', currentUser.uid)
            .limit(1)
            .get();

        if (!vendorSnap.empty) {
            vendorLink.style.display = 'flex';
            console.log('🟢 Vendor link enabled');
        } else {
            vendorLink.style.display = 'none';
            console.log('🔴 Vendor link hidden');
        }

    } catch (error) {
        console.error('Vendor access check failed:', error);
        vendorLink.style.display = 'none';
    }
}

// UPDATE ACCOUNT TYPE BADGE
function updateAccountTypeBadge(userData) {
    if (!accountTypeBadgeEl) return;
    
    const accountType = (userData.accountType || 'gold').toLowerCase();
    
    accountTypeBadgeEl.className = 'account-type-badge';
    
    let badgeHTML = '';
    
    if (accountType === 'diamond') {
        accountTypeBadgeEl.classList.add('elite');
        badgeHTML = `
            <i class="fas fa-gem"></i>
            <span>Diamond</span>
            <i class="fas fa-check-circle" style="color: white; margin-left: 5px; font-size: 15px;"></i>
        `;
    } else if (accountType === 'gold') {
        accountTypeBadgeEl.classList.add('pro');
        badgeHTML = `
            <i class="fas fa-crown"></i>
            <span>Gold</span>
            <i class="fas fa-check-circle" style="color: white; margin-left: 5px; font-size: 15px;"></i>
        `;
    } else {
        accountTypeBadgeEl.classList.add('start');
        badgeHTML = `
            <i class="fas fa-star"></i>
            <span>Start</span>
        `;
    }
    
    accountTypeBadgeEl.innerHTML = badgeHTML;
    
    console.log(`✅ Account badge set to: ${accountType.toUpperCase()}`);
}

// UPDATE USER UI
function updateUserUI(userData) {
    try {
        const username = userData.username || 'User';
        const fullName = userData.fullName || username;
        
        welcomeUserNameEl.textContent = username;
        sidebarProfileNameEl.textContent = fullName;
        sidebarProfileRoleEl.textContent = userData.username || 'Member';
        
        sidebarProfileImgEl.src = userData.profilePic || 'avatar.png';
        mainProfileImgEl.src = userData.profilePic || 'avatar.png';
        
        updateAccountTypeBadge(userData);
        
        const affiliateWalletBalance = userData.affiliateWallet || 0;
        const bonusWalletBalance = userData.bonusWallet || 0;
        const taskWalletBalance = userData.taskWallet || 0; 
        
        animateCountUp(affiliateWalletEl, affiliateWalletBalance);
        animateCountUp(taskWalletEl, bonusWalletBalance);
        animateCountUp(gameWalletEl, taskWalletBalance);
        
        const totalReferralsEarned = userData.affiliateTotalEarned || 0;
        const totalSubEarnings = userData.subWallet || 0;
        
        animateCountUp(totalReferralsEarnedEl, totalReferralsEarned);
        animateCountUp(totalSubEarningsEl, totalSubEarnings);
        
        const totalBalance = affiliateWalletBalance + taskWalletBalance + bonusWalletBalance; 
        
        const totalEarned = (userData.affiliateTotalEarned || 0) +
                          (userData.taskTotalEarned || 0) +
                          (userData.bonusTotalEarned || 0);
        
        animateCountUp(totalWalletsBalanceEl, totalBalance);
        animateCountUp(totalWalletsEarnedEl, totalEarned);
        
        const referralLink = `${window.location.origin}/sign-up.ht?ref=${username}`;
        referralLinkInputEl.value = referralLink;
        
        console.log("✅ User UI updated successfully");
        
    } catch (error) {
        console.error("Error updating user UI:", error);
    }
}

// ✅ FETCH TRANSACTIONS (WITH FIXED TIMESTAMPS)
async function fetchTransactions() {
    const cacheKey = `transactions_${currentUser.uid}`;
    
    if (isCacheValid(cacheKey, 2 * 60 * 1000)) { 
        console.log("✅ Loading transactions from cache");
        const cached = getFromLocalStorage(cacheKey).data;
        displayTransactions(cached);
        return;
    }

    transactionsTableBodyEl.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; color: var(--text-light);">
                Loading transactions...
            </td>
        </tr>
    `;

    try {
        console.log("📡 Fetching transactions from Firestore...");
        
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid) 
            .limit(10)
            .get();
        
        const transactions = [];
        transactionsSnapshot.forEach(doc => {
             const txData = doc.data();
             transactions.push(txData);
        });

        // ✅ Sort using helper function
        transactions.sort((a, b) => {
            const timeA = getTimestampMillis(a.timestamp);
            const timeB = getTimestampMillis(b.timestamp);
            return timeB - timeA; // Newest first
        });
        
        saveToLocalStorage(cacheKey, {
            data: transactions,
            timestamp: Date.now()
        });
        
        displayTransactions(transactions);
        
    } catch (error) {
        console.error("❌ Error fetching transactions:", error);
        
        let errorMessage = 'Failed to load transactions.';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied.';
        } else if (error.message.includes('requires an index')) {
             errorMessage = 'Firestore Index Required.';
        }
        
        transactionsTableBodyEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--error-red);">
                    ${errorMessage}
                </td>
            </tr>
        `;
    }
}

// ✅ DISPLAY TRANSACTIONS (FIXED)
function displayTransactions(transactions) {
    if (!transactions || transactions.length === 0) {
        transactionsTableBodyEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-light);">
                    No recent transactions found.
                </td>
            </tr>
        `;
        return;
    }

    transactionsTableBodyEl.innerHTML = transactions.map((tx, index) => {
        
        let typeText = 'General Transaction'; 
        let badgeClass = 'general';
        let amountDisplay = formatCurrency(tx.amount);
        
        const detailText = tx.description || tx.wallet || 'N/A';
        
        if (tx.type === 'credit') {
            amountDisplay = `+${amountDisplay}`;
            
            if (detailText.includes('Welcome Bonus')) {
                typeText = 'Welcome Bonus';
                badgeClass = 'bonus';
            } else if (detailText.includes('Referral Bonus')) {
                typeText = 'Referral Bonus';
                badgeClass = 'referral';
            } else if (detailText.includes('Daily Task')) {
                typeText = 'Daily Task Earning';
                badgeClass = 'task';
            } else {
                 typeText = 'Wallet Credit';
                 badgeClass = 'credit';
            }
            
        } else if (tx.type === 'debit') {
            amountDisplay = `-${amountDisplay}`;
            
            if (detailText.includes('Withdrawal')) {
                typeText = 'Withdrawal';
            } else {
                 typeText = 'Wallet Debit';
            }
            badgeClass = 'debit';
        }
        
        // ✅ Use helper function
        const dateTimeString = formatDateTime(tx.timestamp);
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="amount ${tx.type === 'credit' ? 'positive' : 'negative'}">${amountDisplay}</td>
                <td><span class="type-badge ${badgeClass}">${typeText}</span></td>
                <td>${detailText}</td>
                <td>${dateTimeString}</td>
            </tr>
        `;
    }).join('');
}

// FETCH AD CARD
async function fetchAdCard() {
    const cacheKey = 'adCard';
    
    if (isCacheValid(cacheKey, 10 * 60 * 1000)) { 
        console.log("✅ Loading ad card from cache");
        const cached = getFromLocalStorage(cacheKey).data;
        displayAdCard(cached);
        return;
    }

    try {
        console.log("📡 Fetching ad card from Firestore...");
        
        const adsSnapshot = await db.collection('ads')
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (!adsSnapshot.empty) {
            const adData = adsSnapshot.docs[0].data();
            
            saveToLocalStorage(cacheKey, {
                data: adData,
                timestamp: Date.now()
            });
            
            displayAdCard(adData);
        } else {
            console.warn("No active ads found");
            hideAdCard();
        }
        
    } catch (error) {
        console.error("Error fetching ad card:", error);
        hideAdCard();
    }
}

function displayAdCard(adData) {
    if (!adData) {
        hideAdCard();
        return;
    }

    adCardTitleEl.textContent = adData.title || 'Special Offer';
    adCardDescriptionEl.textContent = adData.description || 'Check out this amazing offer!';
    adCardImageEl.src = adData.imageUrl || 'my.jpg';
    adCardActionEl.textContent = adData.actionText || 'Learn More';
    
    adCardActionEl.onclick = () => {
        if (adData.actionLink) {
            window.open(adData.actionLink, '_blank');
        }
    };
}

function hideAdCard() {
    const adSection = document.querySelector('.ad-section');
    if (adSection) {
        adSection.style.display = 'none';
    }
}

// FETCH MODALS
async function fetchAndShowModals() {
    try {
        console.log("📡 Fetching modals from Firestore...");
        
        const modalsSnapshot = await db.collection('modals')
            .where('active', '==', true)
            .get();
        
        const modals = [];
        modalsSnapshot.forEach(doc => {
            modals.push({ id: doc.id, ...doc.data() });
        });
        
        if (modals.length === 0) {
            console.log("No active modals found");
            return;
        }

        modals.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        
        showModalsSequentially(modals, 0);
        
    } catch (error) {
        console.error("Error fetching modals:", error);
    }
}

function showModalsSequentially(modals, index) {
    if (index >= modals.length) {
        console.log("✅ All modals displayed");
        return;
    }

    const modalData = modals[index];
    
    if (modalData.type === 'announcement') {
        showAnnouncementModal(modalData, () => {
            showModalsSequentially(modals, index + 1);
        });
    } else if (modalData.type === 'offer') {
        showOfferModal(modalData, () => {
            showModalsSequentially(modals, index + 1);
        });
    } else {
        showModalsSequentially(modals, index + 1);
    }
}

function showAnnouncementModal(data, onClose) {
    announcementTitleEl.textContent = data.title || '🚀 Important Announcement';
    announcementMessageEl.textContent = data.message || 'We have an important update for you.';
    
    showModal(announcementModal);
    
    const closeHandlers = [closeAnnouncement, closeAnnouncementBtn];
    closeHandlers.forEach(btn => {
        btn.onclick = () => {
            closeModal(announcementModal);
            if (onClose) onClose();
        };
    });
}

function showOfferModal(data, onClose) {
    offerModalTitleEl.textContent = data.title || '🎁 Special Offer';
    offerModalMessageEl.textContent = data.message || 'Grab this limited time offer!';
    offerImageEl.src = data.imageUrl || 'my.jpg';
    offerModalActionBtn.textContent = data.actionText || 'Take';
    
    if (data.actionLink) {
        offerModalActionBtn.onclick = () => {
            window.open(data.actionLink, '_blank');
            closeModal(specialOfferModal);
            if (onClose) onClose();
        };
    }
    
    showModal(specialOfferModal);
    
    const closeHandlers = [closeSpecialOffer, closeOfferBtn];
    closeHandlers.forEach(btn => {
        btn.onclick = () => {
            closeModal(specialOfferModal);
            if (onClose) onClose();
        };
    });
}

function showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    
    const allModals = [announcementModal, specialOfferModal];
    const anyModalOpen = allModals.some(m => m.classList.contains('active'));
    
    if (!anyModalOpen) {
        document.body.style.overflow = 'auto';
    }
}

// UI EVENT LISTENERS
function setupEventListeners() {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        const isDarkMode = body.classList.contains('dark-mode');
        
        icon.classList.toggle('fa-moon', !isDarkMode);
        icon.classList.toggle('fa-sun', isDarkMode);
        
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    copyLinkBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(referralLinkInputEl.value);
            
            const originalHTML = copyLinkBtn.innerHTML;
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyLinkBtn.style.background = 'linear-gradient(135deg, var(--success), #059669)';
            
            setTimeout(() => {
                copyLinkBtn.innerHTML = originalHTML;
                copyLinkBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Copy failed:', error);
            referralLinkInputEl.select();
            document.execCommand('copy');
        }
    });

    referralLinkShare.addEventListener('click', async () => {
        const referralLink = referralLinkInputEl.value;
        
        const shareText = `Join Elite Vision Network and start earning! Use my referral link:\n${referralLink}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Elite Vision Network',
                    text: shareText,
                    url: referralLink 
                });
            } catch (error) {
                console.warn('Navigator share failed, falling back to copy:', error);
                
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert('Share failed, but the referral message has been copied to your clipboard!');
                } catch (copyError) {
                    console.error('Fallback copy failed:', copyError);
                    alert('Sharing failed. Please manually copy the link.');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                alert('Referral message copied!');
            } catch (copyError) {
                console.error('Copy failed:', copyError);
                alert('Sharing failed. Please manually copy the link.');
            }
        }
    });

    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.closest('.menu-dropdown');
            dropdown.classList.toggle('active');
        });
    });

    initHorizontalScrolling('.wallet-cards');
    initHorizontalScrolling('.quick-actions-cards');
}

// HORIZONTAL SCROLLING
function initHorizontalScrolling(selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    ['mouseleave', 'mouseup'].forEach(event => {
        container.addEventListener(event, () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchend', () => {
        isDown = false;
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });
}

// MAIN INITIALIZATION
async function initDashboard() {
    try {
        console.log("🚀 Initializing Dashboard...");
        
        // 1. Check Authentication
        await checkAuth();
        console.log("✅ User authenticated:", currentUser.uid);
        
        // 2. Check Vendor Access
        await checkVendorAccess();
        
        // 3. Setup Event Listeners
        setupEventListeners();
        
        // 4. Fetch & Display User Data (with status check)
        const userData = await fetchUserData();
        updateUserUI(userData);
        
        // 5. Fetch & Display Transactions
        await fetchTransactions();
        
        // 6. Fetch & Display Ad Card
        await fetchAdCard();
        
        // 7. Show Modals (after a small delay)
        setTimeout(() => {
            fetchAndShowModals();
        }, 1000);
        
        console.log("✅ Dashboard initialized successfully");
        
    } catch (error) {
        console.error("❌ Dashboard initialization failed:", error);
    }
}

// START APPLICATION
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

console.log(`
╔════════════════════════════════════════╗
║  ELITE VISION - DASHBOARD v3.0        ║
║  ✅ Fixed Timestamps                   ║
║  ✅ User Status Check (NO Real-Time)  ║
║  ✅ localStorage Caching (5 min)      ║
║  ✅ Clear on Logout                    ║
║  ✅ No Unnecessary Firebase Requests  ║
╚════════════════════════════════════════╝
`);
