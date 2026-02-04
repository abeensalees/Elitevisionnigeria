// Firebase Configuration
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

// ========================================
// 🚀 CACHE SYSTEM - Super Fast Loading!
// ========================================
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

const cache = {
    userData: { data: null, timestamp: 0 },
    withdrawSettings: { data: null, timestamp: 0 },
    withdrawHistory: { data: null, timestamp: 0 },
    pendingWithdrawals: { data: null, timestamp: 0 }
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
        // Clear all cache
        Object.keys(cache).forEach(key => {
            cache[key] = { data: null, timestamp: 0 };
        });
    }
}

// Global Variables
let currentUser = null;
let userData = null;
let withdrawSettings = null;
let pinAttempts = 0;
let isLocked = false;
let lockEndTime = null;
let countdownInterval = null;

// DOM Elements
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const withdrawForm = document.getElementById('withdrawForm');
const walletTypeSelect = document.getElementById('walletType');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const previewAmount = document.getElementById('previewAmount');
const pinInputs = document.querySelectorAll('.pin-input');
const lockCard = document.getElementById('lockCard');
const countdown = document.getElementById('countdown');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const receiptModal = document.getElementById('receiptModal');
const closeReceipt = document.getElementById('closeReceipt');
const withdrawTableBody = document.getElementById('withdrawTableBody');
const toastContainer = document.getElementById('toastContainer');
const statusBottomBtn = document.getElementById('statusBottomBtn');
const statusModal = document.getElementById('statusModal');
const closeStatusModal = document.getElementById('closeStatusModal');
const statusContent = document.getElementById('statusContent');

// ========================================
// AUTHENTICATION CHECK
// ========================================

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        // 🚀 Load with cache - super fast!
        await Promise.all([
            loadUserData(),
            loadWithdrawSettings()
        ]);
        
        await validateUserSetup();
        await checkPendingWithdraw();
        await checkLockStatus();
        await loadWithdrawHistory();
        updateWalletCards();
        populateWalletOptions();
        updateSidebarProfile();
    } else {
        window.location.replace('/sign-in');
    }
});


// ========================================
// SIMPLE LOGOUT FUNCTION
// ========================================
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.clear();
                clearCache(); // Clear cache on logout
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


// ========================================
// VALIDATE USER SETUP
// ========================================

async function validateUserSetup() {
    if (!userData) return;
    
    // Check bank account
    const hasBankAccount = userData.bankAccount && 
                          userData.bankAccount.bankName && 
                          userData.bankAccount.accountNumber && 
                          userData.bankAccount.accountName;
    
    // Check PIN
    const hasPIN = userData.withdrawPIN && userData.withdrawPIN.length === 4;
    
    if (!hasBankAccount) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Setup Required';
        
        showToast('error', 'Bank Account Required', 
            'Please set up your bank account details first. Click the "Check Bank" button or go to Bank Settings.', 
            10000);
        
        return false;
    }
    
    if (!hasPIN) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> PIN Required';
        
        showToast('error', 'Withdraw PIN Required', 
            'Please set up your 4-digit withdraw PIN first. Go to Bank Settings to create your PIN.', 
            10000);
        
        return false;
    }
    
    return true;
}

// ========================================
// 🚀 LOAD USER DATA (WITH CACHE!)
// ========================================

async function loadUserData(forceRefresh = false) {
    try {
        // Check cache first
        if (!forceRefresh && isCacheValid('userData')) {
            userData = getCache('userData');
            console.log('✅ User data loaded from cache (super fast!)');
            displayUserData();
            return;
        }
        
        // Load from Firebase
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            
            // Save to cache
            setCache('userData', userData);
            console.log('✅ User data loaded from Firebase & cached');
            
            displayUserData();
        } else {
            showToast('error', 'Error', 'User data not found. Please contact support.');
            setTimeout(() => {
                window.location.replace('/sign-in');
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('error', 'Error', 'Failed to load user data.');
    }
}

function displayUserData() {
    // Bank account display
    const accountInfoCard = document.querySelector('.account-info-card');
    if (accountInfoCard) {
        if (userData.bankAccount && userData.bankAccount.bankName) {
            accountInfoCard.innerHTML = `
                <div class="account-info-item">
                    <span class="account-label">Bank Name:</span>
                    <span class="account-value">${userData.bankAccount.bankName}</span>
                </div>
                <div class="account-info-item">
                    <span class="account-label">Account Number:</span>
                    <span class="account-value">${userData.bankAccount.accountNumber}</span>
                </div>
                <div class="account-info-item">
                    <span class="account-label">Account Name:</span>
                    <span class="account-value">${userData.bankAccount.accountName}</span>
                </div>
            `;
        } else {
            accountInfoCard.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 32px; color: var(--error-red); margin-bottom: 10px;"></i>
                    <p style="margin: 0; font-weight: 500;">Bank Account Not Set</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Please set up your bank account in Bank Settings</p>
                </div>
            `;
        }
    }
}

// ========================================
// 🚀 LOAD WITHDRAW SETTINGS (WITH CACHE!)
// ========================================

async function loadWithdrawSettings(forceRefresh = false) {
    try {
        // Check cache first
        if (!forceRefresh && isCacheValid('withdrawSettings')) {
            withdrawSettings = getCache('withdrawSettings');
            console.log('✅ Withdraw settings loaded from cache (super fast!)');
            return;
        }
        
        // Load from Firebase
        const settingsDoc = await db.collection('settings').doc('withdrawalSettings').get();
        
        if (settingsDoc.exists) {
            withdrawSettings = settingsDoc.data();
            
            // Convert string numbers to actual numbers
            withdrawSettings.maxPinAttempts = parseInt(withdrawSettings.maxPinAttempts) || 3;
            withdrawSettings.lockDuration = parseInt(withdrawSettings.lockDuration) || 43200000;
            
            // Save to cache
            setCache('withdrawSettings', withdrawSettings);
            console.log('✅ Withdraw settings loaded from Firebase & cached');
        } else {
            console.error('❌ No withdrawSettings document found in Firebase!');
            showToast('error', 'Settings Error', 'Withdraw settings not configured. Contact admin.', 8000);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Settings Missing';
        }
    } catch (error) {
        console.error('Error loading withdraw settings:', error);
        showToast('error', 'Error', 'Failed to load withdraw settings.');
    }
}

// ========================================
// 🚀 UPDATE WALLET CARDS (WITH CACHE!)
// ========================================

async function updateWalletCards(forceRefresh = false) {
    if (!userData) return;
    
    // Real wallet balances
    const affiliateWallet = parseFloat(userData.affiliateWallet || 0);
    const taskWallet = parseFloat(userData.taskWallet || 0);
    const bonusWallet = parseFloat(userData.bonusWallet || 0);
    
    const totalBalance = affiliateWallet + taskWallet + bonusWallet;
    
    const walletCards = document.querySelectorAll('.wallet-card');
    
    // Card 1: Total Available Balance
    if (walletCards[0]) {
        walletCards[0].querySelector('.wallet-amount').textContent = formatCurrency(totalBalance);
    }
    
    // Card 2: Pending Withdrawals (with cache)
    if (walletCards[1]) {
        try {
            let pendingData;
            
            if (!forceRefresh && isCacheValid('pendingWithdrawals')) {
                pendingData = getCache('pendingWithdrawals');
                console.log('✅ Pending withdrawals from cache');
            } else {
                const pendingSnapshot = await db.collection('withdrawals')
                    .where('userId', '==', currentUser.uid)
                    .where('status', '==', 'pending')
                    .get();
                
                pendingData = {
                    total: 0,
                    count: 0
                };
                
                if (!pendingSnapshot.empty) {
                    pendingData.total = pendingSnapshot.docs.reduce((sum, doc) => {
                        return sum + parseFloat(doc.data().amount || 0);
                    }, 0);
                    pendingData.count = pendingSnapshot.size;
                }
                
                setCache('pendingWithdrawals', pendingData);
            }
            
            walletCards[1].querySelector('.wallet-amount').textContent = formatCurrency(pendingData.total);
            walletCards[1].querySelector('.wallet-subtitle').textContent = 
                pendingData.count > 0 ? `${pendingData.count} pending` : 'No pending';
                
        } catch (error) {
            console.error('Error fetching pending:', error);
            walletCards[1].querySelector('.wallet-amount').textContent = '₦0.00';
        }
    }
    
    // Card 3: Last Withdrawal
    if (walletCards[2]) {
        try {
            const lastWithdrawSnapshot = await db.collection('withdrawals')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'success')
                .get();
            
            if (!lastWithdrawSnapshot.empty) {
                const lastWithdraw = lastWithdrawSnapshot.docs[0].data();
                walletCards[2].querySelector('.wallet-amount').textContent = formatCurrency(lastWithdraw.amount);
                walletCards[2].querySelector('.wallet-subtitle').textContent = "Last Paid";
            } else {
                walletCards[2].querySelector('.wallet-amount').textContent = '₦0.00';
                walletCards[2].querySelector('.wallet-subtitle').textContent = 'No withdrawals yet';
            }
        } catch (error) {
            console.error('Error fetching last withdrawal:', error);
            walletCards[2].querySelector('.wallet-amount').textContent = '₦0.00';
        }
    }
    
    // Card 4: Total Withdrawn
    if (walletCards[3]) {
        try {
            const completedSnapshot = await db.collection('withdrawals')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'success')
                .get();
            
            const totalWithdrawn = completedSnapshot.docs.reduce((sum, doc) => {
                return sum + parseFloat(doc.data().amount || 0);
            }, 0);
            
            walletCards[3].querySelector('.wallet-amount').textContent = formatCurrency(totalWithdrawn);
        } catch (error) {
            console.error('Error fetching total withdrawn:', error);
            walletCards[3].querySelector('.wallet-amount').textContent = '₦0.00';
        }
    }
}

// ========================================
// POPULATE WALLET OPTIONS (WITH DIAMOND/GOLD LIMITS)
// ========================================

function populateWalletOptions() {
    if (!userData || !withdrawSettings) return;
    
    // ✅ GET USER'S ACCOUNT TYPE (Diamond or Gold)
    const userAccountType = (userData.accountType || 'gold').toLowerCase();
    console.log(`👤 User Account Type: ${userAccountType.toUpperCase()}`);
    
    const affiliateWallet = parseFloat(userData.affiliateWallet || 0);
    const taskWallet = parseFloat(userData.taskWallet || 0);
    const bonusWallet = parseFloat(userData.bonusWallet || 0);
    
    walletTypeSelect.innerHTML = '<option value="">---Choose wallet---</option>';
    
    // AFFILIATE WALLET
    if (withdrawSettings.affiliateEnabled === true) {
        let affiliateMin, affiliateMax;
        
        if (typeof withdrawSettings.affiliateMinimum === 'object') {
            affiliateMin = userAccountType === 'diamond' 
                ? withdrawSettings.affiliateMinimum.Diamond 
                : withdrawSettings.affiliateMinimum.Gold;
        } else {
            affiliateMin = withdrawSettings.affiliateMinimum;
        }
        
        if (typeof withdrawSettings.affiliateMaximum === 'object') {
            const maxVal = userAccountType === 'diamond'
                ? withdrawSettings.affiliateMaximum.Diamond
                : withdrawSettings.affiliateMaximum.Gold;
            affiliateMax = maxVal || null;
        } else {
            affiliateMax = withdrawSettings.affiliateMaximum;
        }
        
        const affiliateOption = document.createElement('option');
        affiliateOption.value = 'affiliateWallet';
        affiliateOption.textContent = `Affiliate - ${formatCurrency(affiliateWallet)}`;
        affiliateOption.dataset.balance = affiliateWallet;
        affiliateOption.dataset.min = affiliateMin;
        affiliateOption.dataset.max = affiliateMax === null ? 'unlimited' : affiliateMax;
        
        walletTypeSelect.appendChild(affiliateOption);
    }
    
    // TASK WALLET
    if (withdrawSettings.taskEnabled === true) {
        let taskMin, taskMax;
        
        if (typeof withdrawSettings.taskMinimum === 'object') {
            taskMin = userAccountType === 'diamond'
                ? withdrawSettings.taskMinimum.Diamond
                : withdrawSettings.taskMinimum.Gold;
        } else {
            taskMin = withdrawSettings.taskMinimum;
        }
        
        if (typeof withdrawSettings.taskMaximum === 'object') {
            taskMax = userAccountType === 'diamond'
                ? withdrawSettings.taskMaximum.Diamond
                : withdrawSettings.taskMaximum.Gold;
        } else {
            taskMax = withdrawSettings.taskMaximum;
        }
        
        const taskOption = document.createElement('option');
        taskOption.value = 'taskWallet';
        taskOption.textContent = `Task - ${formatCurrency(taskWallet)}`;
        taskOption.dataset.balance = taskWallet;
        taskOption.dataset.min = taskMin;
        taskOption.dataset.max = taskMax;
        
        walletTypeSelect.appendChild(taskOption);
    }
    
    // BONUS WALLET
    if (withdrawSettings.bonusEnabled === true) {
        let bonusMin, bonusMax;
        
        if (typeof withdrawSettings.bonusMinimum === 'object') {
            bonusMin = userAccountType === 'diamond'
                ? withdrawSettings.bonusMinimum.Diamond
                : withdrawSettings.bonusMinimum.Gold;
        } else {
            bonusMin = withdrawSettings.bonusMinimum;
        }
        
        if (typeof withdrawSettings.bonusMaximum === 'object') {
            bonusMax = userAccountType === 'diamond'
                ? withdrawSettings.bonusMaximum.Diamond
                : withdrawSettings.bonusMaximum.Gold;
        } else {
            bonusMax = withdrawSettings.bonusMaximum;
        }
        
        const bonusOption = document.createElement('option');
        bonusOption.value = 'bonusWallet';
        bonusOption.textContent = `Bonus - ${formatCurrency(bonusWallet)}`;
        bonusOption.dataset.balance = bonusWallet;
        bonusOption.dataset.min = bonusMin;
        bonusOption.dataset.max = bonusMax;
        
        walletTypeSelect.appendChild(bonusOption);
    }
    
    // Show account type badge
    const accountTypeBadge = userAccountType === 'diamond' ? '💎 Diamond' : '🏆 Gold';
    showToast('info', 'Account Type', 
        `Your account: ${accountTypeBadge} - Withdraw limits applied accordingly`, 
        4000);
}

// ========================================
// WALLET SELECTION HANDLER
// ========================================

walletTypeSelect.addEventListener('change', async function() {
    const selectedOption = this.options[this.selectedIndex];
    
    if (!selectedOption.value) {
        withdrawAmountInput.min = 0;
        withdrawAmountInput.max = 0;
        withdrawAmountInput.value = '';
        previewAmount.textContent = '₦0.00';
        return;
    }
    
    const isValid = await validateUserSetup();
    if (!isValid) {
        this.value = '';
        return;
    }
    
    const balance = parseFloat(selectedOption.dataset.balance);
    const minAmount = parseFloat(selectedOption.dataset.min);
    const maxAmountSetting = selectedOption.dataset.max;
    
    const maxAmount = maxAmountSetting === 'unlimited' ? balance : Math.min(balance, parseFloat(maxAmountSetting));
    
    withdrawAmountInput.min = minAmount;
    withdrawAmountInput.max = maxAmount;
    withdrawAmountInput.placeholder = `Min: ${formatCurrency(minAmount)}`;
    
    const maxText = maxAmountSetting === 'unlimited' ? 'No limit (balance only)' : formatCurrency(parseFloat(maxAmountSetting));
    
    showToast('info', 'Withdraw Limits', 
        `Minimum: ${formatCurrency(minAmount)}\nMaximum: ${maxText}`, 
        4000);
});

// ========================================
// AMOUNT INPUT VALIDATION
// ========================================

withdrawAmountInput.addEventListener('input', function() {
    const amount = parseFloat(this.value) || 0;
    const selectedOption = walletTypeSelect.options[walletTypeSelect.selectedIndex];
    
    if (!selectedOption.value) {
        previewAmount.textContent = '₦0.00';
        return;
    }
    
    const minAmount = parseFloat(selectedOption.dataset.min);
    const balance = parseFloat(selectedOption.dataset.balance);
    const maxAmountSetting = selectedOption.dataset.max;
    
    const maxAmount = maxAmountSetting === 'unlimited' ? balance : Math.min(balance, parseFloat(maxAmountSetting));
    
    if (amount < minAmount) {
        this.setCustomValidity(`Minimum amount is ${formatCurrency(minAmount)}`);
    } else if (amount > balance) {
        this.setCustomValidity(`Insufficient balance: ${formatCurrency(balance)}`);
        showToast('error', 'Insufficient Balance', `Your balance is ${formatCurrency(balance)}`, 3000);
    } else if (amount > maxAmount) {
        const maxText = maxAmountSetting === 'unlimited' ? 'your balance' : formatCurrency(parseFloat(maxAmountSetting));
        this.setCustomValidity(`Maximum amount is ${maxText}`);
    } else {
        this.setCustomValidity('');
    }
    
    previewAmount.textContent = formatCurrency(amount);
});

window.setAmount = function(amount) {
    withdrawAmountInput.value = amount;
    withdrawAmountInput.dispatchEvent(new Event('input'));
};

// ========================================
// CHECK PENDING WITHDRAW
// ========================================

async function checkPendingWithdraw() {
    if (!withdrawSettings || !withdrawSettings.checkPendingWithdraw) return false;
    
    try {
        // Check cache first
        if (isCacheValid('pendingWithdrawals')) {
            const pendingData = getCache('pendingWithdrawals');
            if (pendingData.count > 0) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-clock"></i> Pending Withdraw';
                
                showToast('warning', 'Pending Withdraw', 
                    'You have a pending withdraw request. Please wait for it to be processed.', 
                    5000);
                
                return true;
            }
            return false;
        }
        
        const pendingSnapshot = await db.collection('withdrawals')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        
        if (!pendingSnapshot.empty) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-clock"></i> Pending Withdraw';
            
            showToast('warning', 'Pending Withdraw', 
                'You have a pending withdraw request. Please wait for it to be processed.', 
                5000);
            
            return true;
        }
    } catch (error) {
        console.error('Error checking pending withdrawals:', error);
    }
    
    return false;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatCurrency(amount) {
    return `₦${parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
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
    // Fallback
    else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// 🔐 PIN INPUT FUNCTIONALITY
// ========================================

pinInputs.forEach((input, index) => {
    input.dataset.actualValue = '';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('type', 'text');
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('maxlength', '1');
    
    input.addEventListener('input', function(e) {
        let currentValue = this.value;
        
        if (currentValue === '🚀' && this.dataset.actualValue) {
            return;
        }
        
        let numericValue = currentValue.replace(/[^0-9]/g, '');
        
        if (numericValue.length > 0) {
            let digit = numericValue[numericValue.length - 1];
            this.dataset.actualValue = digit;
            this.value = '🚀';
            
            if (index < pinInputs.length - 1) {
                setTimeout(() => {
                    pinInputs[index + 1].focus();
                }, 10);
            }
        } else if (currentValue.length === 0) {
            this.dataset.actualValue = '';
            this.value = '';
        }
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.dataset.actualValue = '';
            this.value = '';
            
            if (index > 0) {
                setTimeout(() => {
                    pinInputs[index - 1].focus();
                }, 10);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            pinInputs[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < pinInputs.length - 1) {
            e.preventDefault();
            pinInputs[index + 1].focus();
        } else if (e.key === 'Delete') {
            e.preventDefault();
            this.dataset.actualValue = '';
            this.value = '';
        } else if (e.key >= '0' && e.key <= '9') {
            return;
        } else if (e.key.length === 1) {
            e.preventDefault();
        }
    });
    
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const digits = pastedText.replace(/[^0-9]/g, '');
        
        for (let i = 0; i < digits.length && (index + i) < pinInputs.length; i++) {
            const targetInput = pinInputs[index + i];
            targetInput.dataset.actualValue = digits[i];
            targetInput.value = '🚀';
        }
        
        const nextEmptyIndex = index + digits.length;
        if (nextEmptyIndex < pinInputs.length) {
            pinInputs[nextEmptyIndex].focus();
        } else {
            pinInputs[pinInputs.length - 1].focus();
        }
    });
    
    input.addEventListener('copy', (e) => e.preventDefault());
    input.addEventListener('cut', (e) => e.preventDefault());
    
    input.addEventListener('focus', function() {
        setTimeout(() => this.select(), 10);
    });
});

if (pinInputs.length > 0) {
    setTimeout(() => {
        pinInputs[0].focus();
    }, 500);
}

// ========================================
// CHECK LOCK STATUS
// ========================================

async function checkLockStatus() {
    if (!userData) return;
    
    if (userData.withdrawLockEnd) {
        const lockEnd = userData.withdrawLockEnd.toDate ? 
            userData.withdrawLockEnd.toDate() : 
            new Date(userData.withdrawLockEnd._seconds * 1000);
        const now = new Date();
        
        if (now < lockEnd) {
            isLocked = true;
            lockEndTime = lockEnd;
            startLockCountdown();
            lockCard.classList.add('active');
            submitBtn.disabled = true;
        } else {
            await db.collection('users').doc(currentUser.uid).update({
                withdrawLockEnd: firebase.firestore.FieldValue.delete(),
                pinAttempts: 0
            });
        }
    }
    
    if (userData.pinAttempts) {
        pinAttempts = userData.pinAttempts;
    }
}

// ========================================
// LOCK WITHDRAW
// ========================================

async function lockWithdraw() {
    isLocked = true;
    const lockDuration = withdrawSettings.lockDuration || 43200000;
    lockEndTime = new Date(Date.now() + lockDuration);
    
    await db.collection('users').doc(currentUser.uid).update({
        withdrawLockEnd: firebase.firestore.Timestamp.fromDate(lockEndTime),
        pinAttempts: withdrawSettings.maxPinAttempts
    });
    
    lockCard.classList.add('active');
    submitBtn.disabled = true;
    
    startLockCountdown();
    
    showToast('error', 'Withdraw Locked', 
        `Too many incorrect PIN attempts. Locked for ${lockDuration / 3600000} hours.`, 
        6000);
}

// ========================================
// START LOCK COUNTDOWN
// ========================================

function startLockCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = new Date();
        const timeLeft = lockEndTime - now;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            unlockWithdraw();
            return;
        }
        
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        countdown.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ========================================
// UNLOCK WITHDRAW
// ========================================

async function unlockWithdraw() {
    isLocked = false;
    lockEndTime = null;
    pinAttempts = 0;
    
    await db.collection('users').doc(currentUser.uid).update({
        withdrawLockEnd: firebase.firestore.FieldValue.delete(),
        pinAttempts: 0
    });
    
    lockCard.classList.remove('active');
    submitBtn.disabled = false;
    
    showToast('success', 'Withdraw Unlocked', 
        'You can now attempt to withdraw again.', 
        4000);
}

// ========================================
// FORM SUBMISSION
// ========================================

withdrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isValid = await validateUserSetup();
    if (!isValid) return;
    
    if (isLocked) {
        showToast('error', 'Withdraw Locked', 
            'Withdraw is temporarily locked. Please wait for the countdown to finish.', 
            4000);
        return;
    }
    
    if (await checkPendingWithdraw()) return;
    
    const pin = Array.from(pinInputs).map(input => input.dataset.actualValue || '').join('');
    
    if (pin.length !== 4) {
        showToast('error', 'Invalid PIN', 'Please enter a 4-digit PIN.', 3000);
        return;
    }
    
    if (pin !== userData.withdrawPIN) {
        pinAttempts++;
        
        await db.collection('users').doc(currentUser.uid).update({
            pinAttempts: pinAttempts
        });
        
        pinInputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        });
        
        pinInputs.forEach(input => {
            input.value = '';
            input.dataset.actualValue = '';
        });
        pinInputs[0].focus();
        
        const maxAttempts = withdrawSettings.maxPinAttempts || 3;
        
        if (pinAttempts >= maxAttempts) {
            await lockWithdraw();
        } else {
            showToast('error', 'Incorrect PIN', 
                `${maxAttempts - pinAttempts} ${maxAttempts - pinAttempts === 1 ? 'attempt' : 'attempts'} remaining.`, 
                3000);
        }
        return;
    }
    
    const selectedWallet = walletTypeSelect.value;
    const amount = parseFloat(withdrawAmountInput.value);
    
    if (!selectedWallet || amount <= 0) {
        showToast('error', 'Invalid Input', 'Please select a wallet and enter a valid amount.', 3000);
        return;
    }
    
    const walletBalance = parseFloat(userData[selectedWallet] || 0);
    
    if (amount > walletBalance) {
        showToast('error', 'Insufficient Balance', 
            `Your balance is ${formatCurrency(walletBalance)}`, 
            4000);
        return;
    }
    
    const selectedOption = walletTypeSelect.options[walletTypeSelect.selectedIndex];
    const minAmount = parseFloat(selectedOption.dataset.min);
    const maxAmountSetting = selectedOption.dataset.max;
    
    const maxAmount = maxAmountSetting === 'unlimited' ? 
        walletBalance : Math.min(walletBalance, parseFloat(maxAmountSetting));
    
    if (amount < minAmount) {
        showToast('error', 'Amount Too Low', 
            `Minimum withdrawal is ${formatCurrency(minAmount)}`, 
            4000);
        return;
    }
    
    if (amount > maxAmount) {
        const maxText = maxAmountSetting === 'unlimited' ? 
            `your balance of ${formatCurrency(walletBalance)}` : 
            formatCurrency(parseFloat(maxAmountSetting));
        showToast('error', 'Amount Too High', 
            `Maximum withdrawal is ${maxText}`, 
            4000);
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
    
    try {
        const withdrawId = `EVN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const withdrawData = {
            id: withdrawId,
            userId: currentUser.uid,
            username: userData.username || userData.email || 'User',
            fullName: userData.fullName || 'N/A',
            email: userData.email || 'N/A',
            phoneNumber: userData.phone || 'N/A',
            walletType: selectedWallet,
            amount: amount,
            bankAccount: {
                bankName: userData.bankAccount?.bankName || 'N/A',
                accountNumber: userData.bankAccount?.accountNumber || 'N/A',
                accountName: userData.bankAccount?.accountName || 'N/A'
            },
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedAt: null
        };
        
        await db.collection('withdrawals').doc(withdrawId).set(withdrawData);
        
        await db.collection('users').doc(currentUser.uid).update({
            [selectedWallet]: firebase.firestore.FieldValue.increment(-amount),
            pinAttempts: 0
        });
        
        pinAttempts = 0;
        
        // Clear cache to force refresh
        clearCache();
        
        showReceipt({
            id: withdrawId,
            amount: amount,
            bankName: userData.bankAccount.bankName,
            accountNumber: userData.bankAccount.accountNumber,
            accountName: userData.bankAccount.accountName,
            date: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
        
        withdrawForm.reset();
        pinInputs.forEach(input => {
            input.value = '';
            input.dataset.actualValue = '';
        });
        previewAmount.textContent = '₦0.00';
        
        await loadUserData(true); // Force refresh
        await loadWithdrawHistory(true); // Force refresh
        updateWalletCards(true); // Force refresh
        populateWalletOptions();
        
        showToast('success', 'Withdraw Submitted', 
            'Your withdraw request has been submitted successfully!', 
            5000);
        
    } catch (error) {
        console.error('Error submitting withdraw:', error);
        showToast('error', 'Withdraw Failed', 
            'Failed to submit withdraw request. Please try again.', 
            5000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Withdraw Now';
    }
});

// ========================================
// SHOW RECEIPT
// ========================================

function showReceipt(data) {
    document.getElementById('receiptId').textContent = data.id;
    document.getElementById('receiptAmount').textContent = formatCurrency(data.amount);
    document.getElementById('receiptBank').textContent = data.bankName;
    document.getElementById('receiptAccount').textContent = data.accountNumber;
    document.getElementById('receiptName').textContent = data.accountName;
    document.getElementById('receiptDate').textContent = data.date;
    
    receiptModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========================================
// 🚀 LOAD WITHDRAW HISTORY (WITH CACHE & FIXED TIMESTAMPS!)
// ========================================

async function loadWithdrawHistory(forceRefresh = false) {
    try {
        // Check cache first
        if (!forceRefresh && isCacheValid('withdrawHistory')) {
            const cachedHistory = getCache('withdrawHistory');
            console.log('✅ Withdraw history loaded from cache (super fast!)');
            displayWithdrawHistory(cachedHistory);
            return;
        }
        
        // Load from Firebase
        const withdrawalsSnapshot = await db.collection('withdrawals')
            .where('userId', '==', currentUser.uid)
            .get();
        
        if (withdrawalsSnapshot.empty) {
            withdrawTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-light);">
                        No withdraw history found
                    </td>
                </tr>
            `;
            return;
        }
        
        const withdrawals = withdrawalsSnapshot.docs
            .map(doc => {
                const data = doc.data();
                let timestamp = 0;
                
                // Handle different timestamp formats
                if (data.createdAt) {
                    if (typeof data.createdAt.toMillis === 'function') {
                        // Proper Firebase Timestamp
                        timestamp = data.createdAt.toMillis();
                    } else if (data.createdAt._seconds) {
                        // Imported JSON format with _seconds
                        timestamp = data.createdAt._seconds * 1000;
                    } else if (data.createdAt.seconds) {
                        // Alternative format with seconds
                        timestamp = data.createdAt.seconds * 1000;
                    } else if (typeof data.createdAt === 'number') {
                        // Already a timestamp
                        timestamp = data.createdAt;
                    }
                }
                
                return {
                    ...data,
                    _timestamp: timestamp
                };
            })
            .sort((a, b) => b._timestamp - a._timestamp)
            .slice(0, 10);
        
        // Save to cache
        setCache('withdrawHistory', withdrawals);
        console.log('✅ Withdraw history loaded from Firebase & cached');
        
        displayWithdrawHistory(withdrawals);
        
    } catch (error) {
        console.error('Error loading withdraw history:', error);
        showToast('error', 'Error', 'Failed to load withdraw history.');
    }
}

function displayWithdrawHistory(withdrawals) {
    withdrawTableBody.innerHTML = '';
    withdrawals.forEach(withdraw => {
        addWithdrawToTable(withdraw);
    });
}

// ========================================
// ADD WITHDRAW TO TABLE
// ========================================

function addWithdrawToTable(withdraw) {
    const row = document.createElement('tr');
    
    let statusClass = '';
    let statusText = '';
    
    switch(withdraw.status) {
        case 'completed':
        case 'success':
            statusClass = 'success';
            statusText = 'Success';
            break;
        case 'pending':
            statusClass = 'pending';
            statusText = 'Pending';
            break;
        case 'rejected':
        case 'failed':
            statusClass = 'rejected';
            statusText = 'Rejected';
            break;
        default:
            statusClass = 'pending';
            statusText = withdraw.status.charAt(0).toUpperCase() + withdraw.status.slice(1);
    }
    
    const walletName = withdraw.walletType.replace('Wallet', '');
    const capitalizedWallet = walletName.charAt(0).toUpperCase() + walletName.slice(1);
    
    row.innerHTML = `
        <td>${withdraw.id}</td>
        <td>${capitalizedWallet}</td>
        <td>${formatCurrency(withdraw.amount)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDate(withdraw.createdAt)}</td>
    `;
    
    withdrawTableBody.appendChild(row);
}

// ========================================
// STATUS MODAL
// ========================================

statusBottomBtn.addEventListener('click', async () => {
    statusModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    statusContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="loading-spinner" style="width: 40px; height: 40px; border-width: 4px; margin: 0 auto;"></div>
            <p style="margin-top: 20px; color: var(--text-light);">Fetching withdrawal status...</p>
        </div>
    `;
    
    try {
        const pendingSnapshot = await db.collection('withdrawals')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();
        
        const totalPending = pendingSnapshot.docs.reduce((sum, doc) => {
            return sum + parseFloat(doc.data().amount || 0);
        }, 0);
        
        const affiliateWallet = parseFloat(userData.affiliateWallet || 0);
        const taskWallet = parseFloat(userData.taskWallet || 0);
        const bonusWallet = parseFloat(userData.bonusWallet || 0);
        
        const affiliateEnabled = withdrawSettings.affiliateEnabled === true;
        const taskEnabled = withdrawSettings.taskEnabled === true;
        const bonusEnabled = withdrawSettings.bonusEnabled === true;
        
        statusContent.innerHTML = `
            <div class="status-cards">
                ${totalPending > 0 ? `
                <div class="status-card pending">
                    <div class="status-card-header">
                        <i class="fas fa-clock"></i>
                        Pending Withdraw
                    </div>
                    <div class="status-card-amount">${formatCurrency(totalPending)}</div>
                    <div class="status-card-date">${pendingSnapshot.size} request(s) processing</div>
                </div>
                ` : ''}
                
                <div class="status-card available">
                    <div class="status-card-header">
                        <i class="fas fa-wallet"></i>
                        Total Available
                    </div>
                    <div class="status-card-amount">${formatCurrency(affiliateWallet + taskWallet + bonusWallet)}</div>
                    <div class="status-card-date">Ready to withdraw</div>
                </div>
            </div>
            
            <h3 class="eligibility-title">
                <i class="fas fa-calendar-check"></i>
                Withdrawal Eligibility
            </h3>
            
            <div class="eligibility-item">
                <div class="eligibility-label">
                    <i class="fas fa-users" style="color: var(--primary-green); margin-right: 8px;"></i>
                    Affiliate Wallet (${formatCurrency(affiliateWallet)})
                </div>
                <div class="eligibility-date" style="color: ${affiliateEnabled ? 'var(--success)' : 'var(--error-red)'};">
                    ${affiliateEnabled ? '✓ Open Now' : '✗ Closed'}
                </div>
            </div>
            
            <div class="eligibility-item">
                <div class="eligibility-label">
                    <i class="fas fa-tasks" style="color: var(--blue); margin-right: 8px;"></i>
                    Task Wallet (${formatCurrency(taskWallet)})
                </div>
                <div class="eligibility-date" style="color: ${taskEnabled ? 'var(--success)' : 'var(--error-red)'};">
                    ${taskEnabled ? '✓ Open Now' : '✗ Closed'}
                </div>
            </div>
            
            <div class="eligibility-item">
                <div class="eligibility-label">
                    <i class="fas fa-gift" style="color: var(--warning); margin-right: 8px;"></i>
                    Bonus Wallet (${formatCurrency(bonusWallet)})
                </div>
                <div class="eligibility-date" style="color: ${bonusEnabled ? 'var(--success)' : 'var(--error-red)'};">
                    ${bonusEnabled ? '✓ Open Now' : '✗ Closed'}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error fetching status:', error);
        statusContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--error-red);"></i>
                <p style="margin-top: 20px; color: var(--text-light);">Failed to load status. Please try again.</p>
            </div>
        `;
    }
});

closeStatusModal.addEventListener('click', () => {
    statusModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

statusModal.addEventListener('click', (e) => {
    if (e.target === statusModal) {
        statusModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// ========================================
// UPDATE SIDEBAR PROFILE
// ========================================

function updateSidebarProfile() {
    if (!userData) return;
    
    const sidebarProfileImg = document.querySelector('.sidebar-profile-img');
    const sidebarProfileName = document.querySelector('.sidebar-profile-name');
    const sidebarProfileRole = document.querySelector('.sidebar-profile-role');
    
    if (sidebarProfileImg && userData.profilePic) {
        sidebarProfileImg.src = userData.profilePic;
    }
    
    if (sidebarProfileName) {
        sidebarProfileName.textContent = userData.fullName || userData.username || 'User';
    }
    
    if (sidebarProfileRole) {
        sidebarProfileRole.textContent = userData.username || 'Member';
    }
}

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(type, title, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-times-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const iconColor = type === 'error' ? '#e74c3c' : 
                     type === 'warning' ? '#f39c12' : 
                     type === 'success' ? '#27ae60' : '#3498db';
    
    toast.innerHTML = `
        <div class="toast-icon" style="color: ${iconColor};">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    const autoRemove = setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, duration);
    
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.transform = 'scaleX(0)';
    setTimeout(() => progressBar.style.transform = 'scaleX(1)', 100);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoRemove);
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    });
}

// ========================================
// SIDEBAR & NAVIGATION
// ========================================

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

// ========================================
// DARK MODE
// ========================================

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

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

// ========================================
// CANCEL BUTTON
// ========================================

cancelBtn.addEventListener('click', () => {
    withdrawForm.reset();
    pinInputs.forEach(input => {
        input.value = '';
        input.dataset.actualValue = '';
    });
    previewAmount.textContent = '₦0.00';
    pinInputs[0].focus();
    showToast('warning', 'Withdraw Cancelled', 'Your withdraw request has been cancelled.', 3000);
});

// ========================================
// CLOSE RECEIPT MODAL
// ========================================

closeReceipt.addEventListener('click', () => {
    receiptModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

receiptModal.addEventListener('click', (e) => {
    if (e.target === receiptModal) {
        receiptModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (receiptModal.classList.contains('active')) {
            receiptModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        if (statusModal.classList.contains('active')) {
            statusModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ========================================
// WALLET CARDS SCROLLING
// ========================================

function initWalletScrolling() {
    const walletContainer = document.querySelector('.wallet-cards');
    if (!walletContainer) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;

    walletContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        walletContainer.style.cursor = 'grabbing';
        startX = e.pageX - walletContainer.offsetLeft;
        scrollLeft = walletContainer.scrollLeft;
    });

    walletContainer.addEventListener('mouseleave', () => {
        isDown = false;
        walletContainer.style.cursor = 'grab';
    });

    walletContainer.addEventListener('mouseup', () => {
        isDown = false;
        walletContainer.style.cursor = 'grab';
    });

    walletContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - walletContainer.offsetLeft;
        const walk = (x - startX) * 2;
        walletContainer.scrollLeft = scrollLeft - walk;
    });

    walletContainer.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - walletContainer.offsetLeft;
        scrollLeft = walletContainer.scrollLeft;
    });

    walletContainer.addEventListener('touchend', () => {
        isDown = false;
    });

    walletContainer.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - walletContainer.offsetLeft;
        const walk = (x - startX) * 2;
        walletContainer.scrollLeft = scrollLeft - walk;
    });
}

initWalletScrolling();