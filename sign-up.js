/**
 * ================================================================
 * ELITE VISION NETWORK - ADVANCED SIGN-UP SYSTEM
 * ================================================================
 * Features:
 * ✅ Account type selection (Diamond/Gold)
 * ✅ Type-based coupon validation
 * ✅ Dynamic bonuses from Firebase settings
 * ✅ Multi-level referral system (extensible)
 * ✅ USERNAME UNIQUENESS CHECK ← NEW FIX
 * ✅ Fast, professional validation flow
 * ✅ Transaction logging
 * ================================================================
 */

// =================================================
// 1. FIREBASE CONFIGURATION
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
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    if (typeof firebase.auth !== 'undefined' && typeof firebase.firestore !== 'undefined') {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("✅ Firebase initialized successfully");
    } else {
        console.error("❌ Firebase Auth or Firestore is not available");
    }
} catch (error) {
    console.error("❌ Error initializing Firebase:", error);
}

// =================================================
// 2. DOM ELEMENTS
// =================================================

const body = document.getElementById('body');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const signupForm = document.getElementById('signupForm');
const togglePassword = document.getElementById('togglePassword');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const errorMessageContent = document.getElementById('errorMessageContent');
const goToDashboard = document.getElementById('goToDashboard');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const closeErrorModal = document.getElementById('closeErrorModal');
const submitBtn = signupForm?.querySelector('button[type="submit"]');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        
const inputs = {
    fullName: document.getElementById('fullName'),
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    country: document.getElementById('country'),
    accountType: document.getElementById('accountType'),
    referredBy: document.getElementById('referredBy'),
    couponCode: document.getElementById('couponCode'),
    password: document.getElementById('password'),
};

const errors = {
    fullName: document.getElementById('fullNameError'),
    username: document.getElementById('usernameError'),
    email: document.getElementById('emailError'),
    phone: document.getElementById('phoneError'),
    country: document.getElementById('countryError'),
    accountType: document.getElementById('accountTypeError'),
    password: document.getElementById('passwordError'),
    couponCode: document.getElementById('couponCodeError'),
};

// =================================================
// 3. UTILITY FUNCTIONS
// =================================================

function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isValidPhone(phone) {
    const re = /^\+?\d{1,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function showError(errorElement, inputElement, message = null) {
    if (errorElement) {
        if (message) errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    inputElement.classList.add('error');
    inputElement.classList.remove('success');
}

function showSuccess(inputElement) {
    const errorElement = errors[inputElement.id];
    if (errorElement) errorElement.classList.remove('show');
    inputElement.classList.remove('error');
    inputElement.classList.add('success');
}

function resetFormValidation() {
    Object.values(errors).forEach(el => el && el.classList.remove('show'));
    Object.values(inputs).forEach(el => el && el.classList.remove('error', 'success'));
}

function disableSubmit(isLoading, text = 'Creating Account...') {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (isLoading) {
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    } else {
        submitBtn.innerHTML = `<i class="fas fa-user-plus"></i> Create Account`;
    }
}

function openModal(modal, message = null) {
    if (modal === errorModal && message && errorMessageContent) {
        errorMessageContent.textContent = message;
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function checkReferralInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refUsername = urlParams.get('ref');
    
    if (refUsername && inputs.referredBy) {
        const sanitizedUsername = refUsername.trim().replace(/[^a-zA-Z0-9_]/g, '');
        inputs.referredBy.value = sanitizedUsername;
        inputs.referredBy.readOnly = true; 
        inputs.referredBy.style.backgroundColor = 'var(--light-bg)';
        inputs.referredBy.style.cursor = 'not-allowed';
        
        if (inputs.referredBy.nextElementSibling?.classList.contains('form-label')) {
             inputs.referredBy.classList.add('has-value'); 
        }
    }
}

/**
 * ===============================================================
 * RECORD TRANSACTION
 * ================================================================
 */
async function recordTransaction(userId, username, amount, type, wallet, description, relatedUser = null) {
    if (!db) {
        console.error("❌ Firestore not initialized for transaction logging");
        return;
    }
    
    try {
        const transactionData = {
            userId: userId,
            username: username,
            amount: amount,
            type: type,
            wallet: wallet,
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            relatedUser: relatedUser,
        };

        await db.collection('transactions').add(transactionData);
        console.log(`✅ Transaction recorded: ${username} - ${description}`);
    } catch (error) {
        console.error(`❌ Error recording transaction for ${username}:`, error);
    }
}

// =================================================
// 4. FORM VALIDATION
// =================================================

function validateForm() {
    let isValid = true;
    resetFormValidation(); 
    
    if (inputs.fullName.value.trim().length < 6) {
        showError(errors.fullName, inputs.fullName, 'Full name must be at least 6 characters');
        isValid = false;
    } else { 
        showSuccess(inputs.fullName); 
    }

    const usernameVal = inputs.username.value.trim();
    if (usernameVal.length < 5) {
        showError(errors.username, inputs.username, 'Username must be at least 5 characters');
        isValid = false;
    } else if (usernameVal.includes(' ')) {
        showError(errors.username, inputs.username, 'Username cannot contain spaces');
        isValid = false;
    } else { 
        showSuccess(inputs.username); 
    }
    
    if (!isValidEmail(inputs.email.value.trim())) {
        showError(errors.email, inputs.email, 'Please enter a valid email address');
        isValid = false;
    } else { 
        showSuccess(inputs.email); 
    }
    
    if (!isValidPhone(inputs.phone.value.trim())) {
        showError(errors.phone, inputs.phone, 'Please enter a valid phone number');
        isValid = false;
    } else { 
        showSuccess(inputs.phone); 
    }
    
    if (inputs.country.value === '') {
        showError(errors.country, inputs.country, 'Please select your country');
        isValid = false;
    } else { 
        showSuccess(inputs.country); 
    }
    
    if (inputs.accountType.value === '') {
        showError(errors.accountType, inputs.accountType, 'Please select account type');
        isValid = false;
    } else { 
        showSuccess(inputs.accountType); 
    }
    
    if (inputs.couponCode.value.trim() === '') {
        showError(errors.couponCode, inputs.couponCode, 'Coupon Code is required for registration');
        isValid = false;
    } else { 
        showSuccess(inputs.couponCode); 
    }

    if (inputs.password.value.length < 8) {
        showError(errors.password, inputs.password, 'Password must be at least 8 characters');
        isValid = false;
    } else { 
        showSuccess(inputs.password); 
    }
    
    return isValid;
}


// =================================================
// 5. FETCH PLATFORM SETTINGS
// =================================================

async function getPlatformSettings() {
    try {
        const settingsDoc = await db.collection('settings').doc('platform').get();
        
        if (!settingsDoc.exists) {
            console.warn("⚠️ Platform settings not found. Using defaults");
            return {
                welcomeBonus: {
                    Diamond: 10000,
                    Gold: 5000
                },
                referralLevels: [
                    { level: 1, Diamond: 8000, Gold: 5000 },
                    { level: 2, Diamond: 500, Gold: 300 }
                ]
            };
        }
        
        const settings = settingsDoc.data();
        
        if (typeof settings.welcomeBonus === 'number') {
            console.warn("⚠️ Old welcome bonus format detected. Please update to object format.");
            settings.welcomeBonus = {
                Diamond: settings.welcomeBonus,
                Gold: settings.welcomeBonus
            };
        }
        
        console.log("✅ Platform settings loaded:", settings);
        return settings;
        
    } catch (error) {
        console.error("❌ Error fetching platform settings:", error);
        return {
            welcomeBonus: {
                Diamond: 10000,
                Gold: 5000
            },
            referralLevels: [
                { level: 1, Diamond: 8000, Gold: 5000 },
                { level: 2, Diamond: 500, Gold: 300 }
            ]
        };
    }
}


// =================================================
// 6. SIGNUP HANDLER - AUTHENTICATION FIRST ✅
// =================================================

async function handleSignup(e) {
    e.preventDefault();
    
    if (!auth || !db) {
        openModal(errorModal, "Services failed to initialize. Please try again.");
        return;
    }

    if (!validateForm()) return;
    
    disableSubmit(true, 'Processing...');

    const email = inputs.email.value.trim();
    const password = inputs.password.value;
    const username = inputs.username.value.trim();
    const accountType = inputs.accountType.value;
    const codeID = inputs.couponCode.value.trim().toUpperCase();
    const referredByUsername = inputs.referredBy.value.trim() || null;
    
    let user = null; // Track user for cleanup if needed
    
    try {
        // ✅ STEP 1: CREATE FIREBASE AUTH ACCOUNT FIRST
        disableSubmit(true, 'Creating account...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        user = userCredential.user;
        
        console.log(`✅ Auth account created: ${user.uid}`);
        
        // ✅ STEP 2: NOW CHECK USERNAME (authenticated ne yanzu, rules za su yarda)
        disableSubmit(true, 'Checking username...');
        const usernameCheck = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();
        
        if (!usernameCheck.empty) {
            // Username ya riga ya wanzu - delete auth account
            await user.delete();
            throw new Error("Username already exists. Please choose a different username.");
        }
        
        console.log(`✅ Username '${username}' is available`);
        
        // ✅ STEP 3: LOAD PLATFORM SETTINGS
        disableSubmit(true, 'Loading settings...');
        const settings = await getPlatformSettings();
        
        const welcomeBonusConfig = settings.welcomeBonus || { Diamond: 10000, Gold: 5000 };
        const welcomeBonus = welcomeBonusConfig[accountType] || 0;
        const referralLevels = settings.referralLevels || [];
        
        console.log(`💎 Account Type: ${accountType}`);
        console.log(`💰 Welcome Bonus: ₦${welcomeBonus}`);
        
        if (welcomeBonus <= 0) {
            await user.delete();
            throw new Error(`No welcome bonus configured for ${accountType} accounts`);
        }
        
        // ✅ STEP 4: VALIDATE COUPON
        disableSubmit(true, 'Validating coupon...');
        const codeRef = db.collection('couponCodes').doc(codeID);
        const codeDoc = await codeRef.get();
        
        if (!codeDoc.exists) {
            await user.delete();
            throw new Error("Invalid Coupon Code. Please check and try again.");
        }
        
        const codeData = codeDoc.data();
        
        if (codeData.isUsed === true) {
            await user.delete();
            throw new Error("This Coupon Code has already been used.");
        }
        
        const codeType = codeData.type || 'Unknown';
        if (codeType !== accountType) {
            await user.delete();
            throw new Error(`Code type mismatch! This is a ${codeType} code, but you selected ${accountType} account.`);
        }
        
        console.log(`✅ Code validated: ${codeType} - Matches account type`);
        
        // ✅ STEP 5: VALIDATE REFERRERS
        const referrerChain = [];
        
        if (referredByUsername) {
            disableSubmit(true, 'Checking referrer...');
            
            let currentReferrerUsername = referredByUsername;
            let level = 1;
            
            while (currentReferrerUsername && level <= referralLevels.length) {
                const referrerSnapshot = await db.collection('users')
                    .where('username', '==', currentReferrerUsername)
                    .limit(1)
                    .get();
                
                if (referrerSnapshot.empty) {
                    console.warn(`⚠️ Referrer Level ${level} '${currentReferrerUsername}' not found`);
                    break;
                }
                
                const referrerDoc = referrerSnapshot.docs[0];
                const referrerData = referrerDoc.data();
                
                referrerChain.push({
                    level: level,
                    doc: referrerDoc,
                    data: referrerData,
                    username: referrerData.username
                });
                
                console.log(`✅ Level ${level} referrer found: ${referrerData.username}`);
                
                currentReferrerUsername = referrerData.referredBy && referrerData.referredBy !== 'N/A' 
                    ? referrerData.referredBy 
                    : null;
                level++;
            }
        }
        
        console.log(`📊 Referrer chain:`, referrerChain.map(r => `L${r.level}: ${r.username}`));
        
        // ✅ STEP 6: SAVE USER DATA
        disableSubmit(true, 'Saving profile...');
        const userData = {
            uid: user.uid,
            fullName: inputs.fullName.value.trim(),
            username: username,
            email: email,
            phone: inputs.phone.value.trim(),
            country: inputs.country.value,
            accountType: accountType,
            referredBy: referredByUsername || 'N/A',
            codeUsed: codeID,
            status: 'active',
            affiliateWallet: 0,
            affiliateTotalEarned: 0,
            subWallet: 0,
            bonusWallet: welcomeBonus,
            bonusTotalEarned: welcomeBonus,
            taskWallet: 0,
            referralsCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('users').doc(user.uid).set(userData);
        
        console.log(`✅ User ${username} (${accountType}) created with ₦${welcomeBonus} welcome bonus`);
        
        // ✅ Record welcome bonus transaction
        await recordTransaction(
            user.uid,
            username,
            welcomeBonus,
            'credit',
            'bonusWallet',
            `Welcome Bonus for ${accountType} Account Registration`,
            null
        );
        
        // ✅ STEP 7: PAY REFERRAL BONUSES
        for (const referrer of referrerChain) {
            const levelConfig = referralLevels.find(l => l.level === referrer.level);
            
            if (!levelConfig) {
                console.warn(`⚠️ No bonus config for Level ${referrer.level}`);
                continue;
            }
            
            const bonusAmount = levelConfig[accountType] || 0;
            
            if (bonusAmount <= 0) {
                console.warn(`⚠️ No bonus for Level ${referrer.level} ${accountType}`);
                continue;
            }
            
            disableSubmit(true, `Giving Lev${referrer.level} bonus...`);
            
            const referrerRef = db.collection('users').doc(referrer.doc.id);
            
            await referrerRef.update({
                affiliateWallet: firebase.firestore.FieldValue.increment(bonusAmount),
                affiliateTotalEarned: firebase.firestore.FieldValue.increment(bonusAmount),
                referralsCount: firebase.firestore.FieldValue.increment(referrer.level === 1 ? 1 : 0),
                lastReferralAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            
            console.log(`✅ Level ${referrer.level}: ₦${bonusAmount} → ${referrer.username} (${accountType})`);
            
            await recordTransaction(
                referrer.doc.id,
                referrer.username,
                bonusAmount,
                'credit',
                'affiliateWallet',
                `Level ${referrer.level} Referral Bonus (${accountType}) from ${username}`,
                username
            );
            
            // Update leaderboard
            const leaderboardRef = db.collection('leaderboard').doc(referrer.doc.id);
            await leaderboardRef.set({
                username: referrer.username,
                affiliateTotalEarned: firebase.firestore.FieldValue.increment(bonusAmount),
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        
        // ✅ STEP 8: UPDATE COUPON CODE
        disableSubmit(true, 'Finalizing...');
        await codeRef.update({
            isUsed: true,
            usedBy: username,
            usedById: user.uid,
            referredBy: referredByUsername || 'N/A',
            codeType: accountType,
            dateUsed: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        // ✅ SUCCESS!
        signupForm.reset();
        resetFormValidation();
        openModal(successModal);
        
        console.log(`🎉 Registration complete for ${username} (${accountType})!`);
        
    } catch (error) {
        console.error("❌ Registration Error:", error);
        
        // ✅ IMPROVED ERROR HANDLING
        let errorMessage = "An unknown error occurred. Please try again.";
        
        // Handle Firebase Auth errors
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email address is already in use.";
                    showError(errors.email, inputs.email, errorMessage);
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Invalid email address.";
                    showError(errors.email, inputs.email, errorMessage);
                    break;
                case 'auth/weak-password':
                    errorMessage = "Password is too weak. Use at least 8 characters.";
                    showError(errors.password, inputs.password, errorMessage);
                    break;
                default:
                    errorMessage = error.message.replace('Firebase: ', '');
            }
        } else {
            errorMessage = error.message;
        }
        
        // Show username error if duplicate
        if (error.message?.includes('Username already exists')) {
            showError(errors.username, inputs.username, 'This username is already taken');
        }
        
        // Show coupon error
        if (error.message?.includes('Coupon') || error.message?.includes('Code')) {
            showError(errors.couponCode, inputs.couponCode);
        }
        
        openModal(errorModal, errorMessage);
        
    } finally {
        disableSubmit(false);
    }
}

// =================================================
// 7. EVENT LISTENERS
// =================================================

function setupEventListeners() {
    // Sidebar
    document.getElementById('menuToggle')?.addEventListener('click', () => { 
        sidebar.classList.add('open');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    document.getElementById('closeSidebar')?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    mobileOverlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Dropdown
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggle.parentElement.classList.toggle('active');
        });
    });
    
    // Dark Mode
    darkModeToggle?.addEventListener('click', () => { 
        body.classList.toggle('dark-mode'); 
        const icon = darkModeToggle.querySelector('i');
        const isDarkMode = body.classList.contains('dark-mode');
        icon.classList.toggle('fa-moon', !isDarkMode);
        icon.classList.toggle('fa-sun', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle?.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Password Toggle
    togglePassword?.addEventListener('click', function() {
        const type = inputs.password.getAttribute('type') === 'password' ? 'text' : 'password';
        inputs.password.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Form Submit
    signupForm?.addEventListener('submit', handleSignup);

    // Modals
    goToDashboard?.addEventListener('click', function() {
        closeModal(successModal);
        window.location.replace('hub/'); 
    });
    closeSuccessModal?.addEventListener('click', () => closeModal(successModal));
    closeErrorModal?.addEventListener('click', () => closeModal(errorModal)); 

    // Input Validation
    Object.keys(inputs).forEach(key => {
        const input = inputs[key];
        if (input && input.type !== 'submit' && input.id !== 'referredBy') {
            input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'blur', validateForm);
        }
    });

    // Select Styling
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function() {
            this.classList.toggle('has-value', !!this.value);
        });
        select.classList.toggle('has-value', !!select.value);
    });
    
    checkReferralInURL();
}

// =================================================
// 8. INITIALIZATION
// =================================================
document.addEventListener('DOMContentLoaded', setupEventListeners);

console.log(`
╔══════════════════════════════════════╗
║   ELITE VISION NETWORK               ║
║   Sign-Up System v2.1                ║
║   ✅ Username Check Fixed!           ║
╚══════════════════════════════════════╝
`);

