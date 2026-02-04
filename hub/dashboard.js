
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================================
// 2. GLOBAL VARIABLES & DOM ELEMENTS
// ============================================================================

let currentUser = null;
let cachedUserData = null;

// DOM Elements - Main UI
const body = document.getElementById('body');
//const loadingOverlay = document.querySelector('.loading-overlay');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');

// DOM Elements - User Profile
const welcomeUserNameEl = document.getElementById('welcomeUserName');
const sidebarProfileNameEl = document.getElementById('sidebarProfileName');
const sidebarProfileRoleEl = document.getElementById('sidebarProfileRole');
const sidebarProfileImgEl = document.getElementById('sidebarProfileImg');
// DOM Elements - Sidebar Links
const vendorLink = document.getElementById('vendor');
const mainProfileImgEl = document.getElementById('mainProfileImg');
// DOM Elements - Wallets 
const affiliateWalletEl = document.getElementById('affiliateWallet');
const taskWalletEl = document.getElementById('taskWallet'); // Bonus Wallet
const gameWalletEl = document.getElementById('gameWallet');   // Task Wallet

// DOM Elements - Quick Stats
//const totalReferralsEl = document.getElementById('totalReferrals');
const totalReferralsEarnedEl = document.getElementById('totalReferralsEarned');
const totalSubEarningsEl = document.getElementById('totalSubEarnings');

// DOM Elements - Summary Cards
const totalWalletsBalanceEl = document.getElementById('totalWalletsBalance');
const totalWalletsEarnedEl = document.getElementById('totalWalletsEarned');

// DOM Elements - Referral
const referralLinkInputEl = document.getElementById('referralLinkInput');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const referralLinkShare = document.getElementById('referralLinkShare');

// DOM Elements - Transactions
const transactionsTableBodyEl = document.getElementById('transactionsTableBody');

// DOM Elements - Ad Card
const adCardTitleEl = document.getElementById('adCardTitle');
const adCardDescriptionEl = document.getElementById('adCardDescription');
const adCardImageEl = document.getElementById('adCardImage');
const adCardActionEl = document.getElementById('adCardAction');

// DOM Elements - Modals
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

// ============================================================================
// 3. UTILITY FUNCTIONS
// ============================================================================

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

const isCacheValid = (cacheKey, maxAge = 5 * 60 * 1000) => {
    const cached = getFromLocalStorage(cacheKey);
    if (!cached || !cached.timestamp) return false;
    return (Date.now() - cached.timestamp) < maxAge;
};

// Counting Animation Function
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

//WITH LOCAL STORAGR LOGIC
function resolveProfileImage(userData, userId) {
    const defaultAvatar = 'avatar.png';
    
    // 1️⃣ Firebase
    if (userData?.profilePic && userData.profilePic.trim() !== '') {
        return userData.profilePic;
    }

    // 2️⃣ Local Storage
    const localImg = localStorage.getItem(`profile_pic_${userId}`);
    if (localImg) {
        return localImg;
    }

    // 3️⃣ Default Avatar
    return defaultAvatar;
}
// ============================================================================
// 4. AUTHENTICATION CHECK
// ============================================================================

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

// ========================================
// SIMPLE LOGOUT FUNCTION
// ========================================
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.clear();
                window.location.replace('/sign-in');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                window.location.replace('/sign-in');
            });
    }
}

// Attach to button
document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

// ============================================================================
// 5. FETCH USER DATA
// ============================================================================

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

// ============================================================================
// VENDOR ACCESS CHECK (SIDEBAR LOGIC)
// ============================================================================

async function checkVendorAccess() {
    if (!currentUser || !vendorLink) return;

    try {
        const vendorSnap = await db
            .collection('vendors')
            .where('uid', '==', currentUser.uid)
            .limit(1)
            .get();

        if (!vendorSnap.empty) {
            // ✅ User vendor ne → nuna link
            vendorLink.style.display = 'flex'; // ko 'block' gwargwadon CSS
            console.log('🟢 Vendor link enabled');
        } else {
            // ❌ Ba vendor ba → boye
            vendorLink.style.display = 'none';
            console.log('🔴 Vendor link hidden');
        }

    } catch (error) {
        console.error('Vendor access check failed:', error);
        vendorLink.style.display = 'none';
    }
}


// ============================================================================
// DOM Elements - KARA WANNAN
// ============================================================================
const accountTypeBadgeEl = document.getElementById('accountTypeBadge');

// ============================================================================
// NEW FUNCTION: Update Account Type Badge
// ============================================================================
function updateAccountTypeBadge(userData) {
    if (!accountTypeBadgeEl) return;
    
    // Default to 'start' if no type specified
    const accountType = (userData.accountType || 'gold').toLowerCase();
    
    // Clear existing classes
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
        // Default/Start account
        accountTypeBadgeEl.classList.add('start');
        badgeHTML = `
            <i class="fas fa-star"></i>
            <span>Start</span>
        `;
    }
    
    accountTypeBadgeEl.innerHTML = badgeHTML;
    
    console.log(`✅ Account badge set to: ${accountType.toUpperCase()}`);
}

// ============================================================================
// UPDATE 6: Modify updateUserUI() function
// ============================================================================
function updateUserUI(userData) {
    try {
        // Profile Info
        const username = userData.username || 'User';
        const fullName = userData.fullName || username;
        
        welcomeUserNameEl.textContent = username;
        sidebarProfileNameEl.textContent = fullName;
        sidebarProfileRoleEl.textContent = userData.username || 'Member';
        
        // Profile Images
       // sidebarProfileImgEl.src = userData.profilePic || 'avatar.png';
       // mainProfileImgEl.src = userData.profilePic || 'avatar.png';
        
      const resolvedProfileImg = resolveProfileImage(userData, currentUser.uid);

      sidebarProfileImgEl.src = resolvedProfileImg;
      mainProfileImgEl.src = resolvedProfileImg;
      
        // ➕ KARA WANNAN: Account Type Badge
        updateAccountTypeBadge(userData);
        
        // Wallets
        const affiliateWalletBalance = userData.affiliateWallet || 0;
        const bonusWalletBalance = userData.bonusWallet || 0;
        const taskWalletBalance = userData.taskWallet || 0; 
        
        animateCountUp(affiliateWalletEl, affiliateWalletBalance);
        animateCountUp(taskWalletEl, bonusWalletBalance);
        animateCountUp(gameWalletEl, taskWalletBalance);
        
        // Quick Stats
        //totalReferralsEl.textContent = userData.referralsCount || 0;
        
        const totalReferralsEarned = userData.affiliateTotalEarned || 0;
        const totalSubEarnings = userData.subWallet || 0;
        
        animateCountUp(totalReferralsEarnedEl, totalReferralsEarned);
        animateCountUp(totalSubEarningsEl, totalSubEarnings);
        
        // Summary Cards
        const totalBalance = affiliateWalletBalance + 
                           taskWalletBalance + 
                           bonusWalletBalance; 
        
        const totalEarned = (userData.affiliateTotalEarned || 0) +
                          (userData.taskTotalEarned || 0) +
                          (userData.bonusTotalEarned || 0);
        
        animateCountUp(totalWalletsBalanceEl, totalBalance);
        animateCountUp(totalWalletsEarnedEl, totalEarned);
        
        // Referral Link
        const referralLink = `${window.location.origin}/sign-up?ref=${username}`;
        referralLinkInputEl.value = referralLink;
        
        console.log("✅ User UI updated successfully (with animations & badge)");
        
    } catch (error) {
        console.error("Error updating user UI:", error);
    }
}


// ============================================================================
// 7. FETCH & DISPLAY TRANSACTIONS
// ============================================================================

async function fetchTransactions() {
    const cacheKey = `transactions_${currentUser.uid}`;
    
    // Check cache
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
        
        // An cire orderBy() don kaucewa Index Error
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid) 
            .limit(10) // Nuna transactions 10 na baya-bayan nan
            .get();
        
        const transactions = [];
        transactionsSnapshot.forEach(doc => {
             const txData = doc.data();
             transactions.push(txData);
        });

        // Sorting a cikin code don tabbatar da Na Baya-Bayan Nan sun bayyana a sama
        transactions.sort((a, b) => {
            // Function don karɓar Lokaci daga nau'ikan data na Firebase
            const getDateValue = (timestamp) => {
                 if (!timestamp) return 0;
                 if (typeof timestamp.toDate === 'function') {
                    return timestamp.toDate().getTime();
                 }
                 if (typeof timestamp === 'object' && timestamp.seconds) {
                    return timestamp.seconds * 1000; // Canza seconds zuwa milliseconds
                 }
                 // Sauran nau'o'in (string ko number)
                 const date = new Date(timestamp);
                 return isNaN(date.getTime()) ? 0 : date.getTime();
            };
            
            const dateA = getDateValue(a.timestamp);
            const dateB = getDateValue(b.timestamp);
            
            // DESCENDING ORDER: Newest (B) - Oldest (A)
            return dateB - dateA;
        });

        
        // Save to cache
        saveToLocalStorage(cacheKey, {
            data: transactions,
            timestamp: Date.now()
        });
        
        displayTransactions(transactions);
        
    } catch (error) {
        console.error("❌ Error fetching transactions:", error);
        
        let errorMessage = 'Failed to load transactions. Check Firebase rules or console for details.';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check Firebase Security Rules.';
        } else if (error.message.includes('requires an index')) {
             errorMessage = 'Firestore Index Required. Please create Index in Firebase Console.';
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
        
        // Kanun Labari (Type Text)
        let typeText = 'General Transaction'; 
        let badgeClass = 'general';
        let amountDisplay = formatCurrency(tx.amount);
        
        // Cikakken Bayani (Detail Text) - An cire relatedUser
        const detailText = tx.description || tx.wallet || 'N/A';
        
        // Ciki (credit) ko Fita (debit)
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
        
        // ====================================================================
        // 🚨 GYARA: SARRAFA DATE DA TIME (Ingantacce)
        // ====================================================================

        let dateTimeString = 'N/A';
        try {
            let date;
            
            if (tx.timestamp && typeof tx.timestamp.toDate === 'function') {
                date = tx.timestamp.toDate();
            } else if (tx.timestamp && typeof tx.timestamp === 'object' && tx.timestamp.seconds) {
                // Lokacin da aka ajiye shi a matsayin object na seconds/nanoseconds (e.g., daga cache)
                date = new Date(tx.timestamp.seconds * 1000);
            } else if (tx.timestamp) {
                date = new Date(tx.timestamp);
            }
            
            // Tabbatar da Date ɗin yana da inganci
            if (date instanceof Date && !isNaN(date.getTime())) {
                dateTimeString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + 
                                 ', ' + 
                                 date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else {
                dateTimeString = 'Invalid Date/Time';
            }

        } catch (e) {
             console.error("Error converting timestamp in display:", e);
             dateTimeString = 'Timestamp Error';
        }
        
        
        // ====================================================================
        // YADDA ZA SU FITO A TEBUR
        // ====================================================================

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

// ============================================================================
// 8. FETCH & DISPLAY AD CARD
// ============================================================================

async function fetchAdCard() {
    const cacheKey = 'adCard';
    
    // Check cache
    if (isCacheValid(cacheKey, 10 * 60 * 1000)) { 
        console.log("✅ Loading ad card from cache");
        const cached = getFromLocalStorage(cacheKey).data;
        displayAdCard(cached);
        return;
    }

    try {
        console.log("📡 Fetching ad card from Firestore...");
        
        // Query for active ads
        const adsSnapshot = await db.collection('ads')
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (!adsSnapshot.empty) {
            const adData = adsSnapshot.docs[0].data();
            
            // Save to cache
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

// ============================================================================
// 9. FETCH & DISPLAY MODALS (PRIORITY SYSTEM)
// ============================================================================

async function fetchAndShowModals() {
    try {
        console.log("📡 Fetching modals from Firestore...");
        
        // Fetch all modals
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

        // Sort by priority (lower number = higher priority)
        modals.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        
        // Show modals in sequence
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
    
    // Determine which modal to show based on type
    if (modalData.type === 'announcement') {
        showAnnouncementModal(modalData, () => {
            showModalsSequentially(modals, index + 1);
        });
    } else if (modalData.type === 'offer') {
        showOfferModal(modalData, () => {
            showModalsSequentially(modals, index + 1);
        });
    } else {
        // Skip unknown types
        showModalsSequentially(modals, index + 1);
    }
}

function showAnnouncementModal(data, onClose) {
    announcementTitleEl.textContent = data.title || '🚀 Important Announcement';
    announcementMessageEl.textContent = data.message || 'We have an important update for you.';
    
   /* if (data.imageUrl) {
        announcementImageEl.src = data.imageUrl;
        announcementImageEl.style.display = 'block';
    } else {
        announcementImageEl.style.display = 'none';
    }*/
    
    showModal(announcementModal);
    
    // Setup close handlers
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
    
    // Setup close handlers
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
    
    // Check if any modals are still open
    const allModals = [announcementModal, specialOfferModal];
    const anyModalOpen = allModals.some(m => m.classList.contains('active'));
    
    if (!anyModalOpen) {
        document.body.style.overflow = 'auto';
    }
}

// ============================================================================
// 10. UI EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Sidebar Toggle
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

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        const isDarkMode = body.classList.contains('dark-mode');
        
        icon.classList.toggle('fa-moon', !isDarkMode);
        icon.classList.toggle('fa-sun', isDarkMode);
        
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Copy Referral Link
    copyLinkBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(referralLinkInputEl.value);
            
            // Visual feedback
            const originalHTML = copyLinkBtn.innerHTML;
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyLinkBtn.style.background = 'linear-gradient(135deg, var(--success), #059669)';
            
            setTimeout(() => {
                copyLinkBtn.innerHTML = originalHTML;
                copyLinkBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Copy failed:', error);
            // Fallback for older browsers
            referralLinkInputEl.select();
            document.execCommand('copy');
        }
    });

    // Share Referral Link (FIXED)
    referralLinkShare.addEventListener('click', async () => {
        const referralLink = referralLinkInputEl.value;
        
        // Tabbatar da an saka link din a cikin rubutun kuma an sa URL a navigator.share
        const shareText = `Join Elite Vision Network and start earning! Use my referral link:\n${referralLink}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Elite Vision Network',
                    text: shareText,
                    url: referralLink 
                });
            } catch (error) {
                // Fallback: Copy to Clipboard
                console.warn('Navigator share failed, falling back to copy:', error);
                
                try {
                    await navigator.clipboard.writeText(shareText);
                    alert('Share failed, but the referral message (including the link) has been copied to your clipboard. You can now paste it!');
                } catch (copyError) {
                    console.error('Fallback copy failed:', copyError);
                    alert('Sharing failed. Please manually copy the link from the box above.');
                }
            }
        } else {
            // Fallback for browsers without navigator.share
            try {
                await navigator.clipboard.writeText(shareText);
                alert('Referral message (including the link) copied! You can now paste it anywhere to share.');
            } catch (copyError) {
                console.error('Copy failed:', copyError);
                alert('Sharing failed. Please manually copy the link from the box above.');
            }
        }
    });

    // Dropdown Menus
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.closest('.menu-dropdown');
            dropdown.classList.toggle('active');
        });
    });

    // Horizontal Scrolling
    initHorizontalScrolling('.wallet-cards');
    initHorizontalScrolling('.quick-actions-cards');
}

// ============================================================================
// 11. HORIZONTAL SCROLLING FUNCTIONALITY
// ============================================================================

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

    // Touch events for mobile
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

// ============================================================================
// 12. MAIN INITIALIZATION FUNCTION
// ============================================================================

async function initDashboard() {
    try {
        console.log("🚀 Initializing Dashboard...");
        
        //Check vendor logic
        
        // 1. Check Authentication
await checkAuth();
console.log("✅ User authenticated:", currentUser.uid);

// ➕ DUBA VENDOR ACCESS
await checkVendorAccess();
        
        // 1. Check Authentication
        await checkAuth();
        console.log("✅ User authenticated:", currentUser.uid);
        
        // 2. Setup Event Listeners
        setupEventListeners();
        
        // 3. Fetch & Display User Data
        const userData = await fetchUserData();
        updateUserUI(userData);
        
        // 4. Fetch & Display Transactions
        await fetchTransactions();
        
        // 5. Fetch & Display Ad Card
        await fetchAdCard();
        
        // 6. Hide Loading Overlay
        //loadingOverlay.classList.add('hidden');
     //   document.body.style.overflow = 'auto';
        
        // 7. Show Modals (after a small delay)
        setTimeout(() => {
            fetchAndShowModals();
        }, 1000);
        
        console.log("✅ Dashboard initialized successfully");
        
    } catch (error) {
        console.error("❌ Dashboard initialization failed:", error);
        
        /* Show error to user
        loadingOverlay.querySelector('.loading-content h2').textContent = 'Error Loading Dashboard';
        loadingOverlay.querySelector('.loading-content p').textContent = 'Please refresh the page or contact support.';
        
        // Hide spinner
        loadingOverlay.querySelector('.spinner').style.display = 'none';*/
    }
}

// ============================================================================
// 13. START THE APPLICATION
// ============================================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
