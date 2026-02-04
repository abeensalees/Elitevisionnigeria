// ========================================
// BANK-SETTINGS.JS - Elite Vision (WITH VENDOR UPDATE)
// Bank Account & Withdraw PIN Management
// ========================================

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
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let userBankAccount = null;
let userWithdrawPIN = null;
let isProcessing = false;

// ========================================
// DOM CONTENT LOADED
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Bank Settings Initialized');
    
    // DOM Elements
    const body = document.getElementById('body');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toastContainer = document.getElementById('toastContainer');
    
    // Profile Elements in Sidebar
    const sidebarProfilePic = document.getElementById('sidebarProfilePic');
    const sidebarFullName = document.getElementById('sidebarFullName');
    const sidebarUsername = document.getElementById('sidebarUsername');
    
    // Form Elements
    const bankForm = document.getElementById('bankForm');
    const pinForm = document.getElementById('pinForm');
    const bankName = document.getElementById('bankName');
    const accountNumber = document.getElementById('accountNumber');
    const accountName = document.getElementById('accountName');
    const newPin = document.getElementById('newPin');
    const confirmPin = document.getElementById('confirmPin');
    const toggleNewPin = document.getElementById('toggleNewPin');
    const toggleConfirmPin = document.getElementById('toggleConfirmPin');
    const pinStatus = document.getElementById('pinStatus');
    const pinStatusText = document.getElementById('pinStatusText');
    const bankAccountsList = document.getElementById('bankAccountsList');
    
    // ========================================
    // TOAST NOTIFICATION
    // ========================================
    window.showToast = function(type, title, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check' : 
                    type === 'error' ? 'fa-times' : 'fa-exclamation-triangle';
        
        toast.innerHTML = `
            <div class="toast-icon">
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
        
        if (toastContainer) {
            toastContainer.appendChild(toast);
        }
        
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
        if (progressBar) {
            progressBar.style.transform = 'scaleX(0)';
            setTimeout(() => progressBar.style.transform = 'scaleX(1)', 100);
        }
        
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
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
    };
    
    // ========================================
    // SIDEBAR TOGGLE
    // ========================================
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
    
    // ========================================
    // DARK MODE TOGGLE
    // ========================================
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
    
    // Check saved dark mode
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.querySelector('i').classList.remove('fa-moon');
            darkModeToggle.querySelector('i').classList.add('fa-sun');
        }
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
    
    // ========================================
    // AUTH STATE LISTENER
    // ========================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.uid);
            await loadUserData();
        } else {
            console.log('❌ No user - Redirecting to login...');
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
    // LOAD USER DATA AND UPDATE PROFILE
    // ========================================
    async function loadUserData() {
        try {
            showToast('info', 'Loading', 'Loading your settings...', 2000);
            
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                userBankAccount = userData.bankAccount || null;
                userWithdrawPIN = userData.withdrawPIN || null;
                
                console.log('✅ User data loaded');
                console.log('Bank Account:', userBankAccount ? 'Set' : 'Not Set');
                console.log('Withdraw PIN:', userWithdrawPIN ? 'Set' : 'Not Set');
                
                // Update Sidebar Profile
                if (sidebarProfilePic) {
                    if (userData.profilePic) {
                        sidebarProfilePic.src = userData.profilePic;
                    } else {
                        sidebarProfilePic.src = 'avatar.png'//'https://ui-avatars.com/api/?name=' + 
                                               //encodeURIComponent(userData.fullName || 'User') + 
                                               //'&background=10b981&color=fff&size=200';
                    }
                }
                
                if (sidebarFullName) {
                    sidebarFullName.textContent = userData.fullName || 'User Name';
                }
                
                if (sidebarUsername) {
                    sidebarUsername.textContent = userData.username || 'username';
                }
                
                renderBankAccount();
                updatePINStatus();
                
                showToast('success', 'Ready', 'Settings loaded successfully', 3000);
            } else {
                console.log('❌ User document not found');
                showToast('error', 'Error', 'User data not found', 4000);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            showToast('error', 'Error', 'Failed to load settings', 4000);
        }
    }
    
    // ========================================
    // RENDER BANK ACCOUNT
    // ========================================
    function renderBankAccount() {
        if (!bankAccountsList) return;
        
        if (userBankAccount) {
            bankForm.style.display = 'none';
            
            bankAccountsList.innerHTML = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div class="bank-icon" style="width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, var(--primary-green), var(--dark-green)); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                            ${userBankAccount.bankName.substring(0, 2)}
                        </div>
                        <div>
                            <h4 style="font-weight: 600; margin-bottom: 5px;">${userBankAccount.bankName}</h4>
                            <p style="color: var(--text-light); font-size: 14px;">${userBankAccount.accountNumber} • ${userBankAccount.accountName}</p>
                        </div>
                    </div>
                    <div style="padding: 12px; background: rgba(16, 185, 129, 0.05); border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success);"></i>
                        <span style="color: var(--success); font-weight: 500; margin-left: 8px;">Bank account is set and cannot be changed</span>
                    </div>
                </div>
            `;
        } else {
            bankForm.style.display = 'block';
            bankAccountsList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-light); margin-top: 20px;">
                    <i class="fas fa-university" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No bank account added yet. Add one above.</p>
                </div>
            `;
        }
    }
    
    // ========================================
    // UPDATE PIN STATUS
    // ========================================
    function updatePINStatus() {
        if (userWithdrawPIN) {
            pinForm.querySelector('button[type="submit"]').disabled = true;
            pinForm.querySelector('button[type="submit"]').style.opacity = '0.5';
            pinForm.querySelector('button[type="submit"]').style.cursor = 'not-allowed';
            
            newPin.disabled = true;
            confirmPin.disabled = true;
            
            if (pinStatus && pinStatusText) {
                pinStatus.classList.add('active', 'success');
                pinStatus.classList.remove('error');
                pinStatusText.innerHTML = '<i class="fas fa-check-circle"></i> Withdraw PIN is already set and cannot be changed';
            }
            
            showToast('info', 'PIN Set', 'Your withdraw PIN is already configured', 3000);
        } else {
            pinForm.querySelector('button[type="submit"]').disabled = false;
            pinForm.querySelector('button[type="submit"]').style.opacity = '1';
            pinForm.querySelector('button[type="submit"]').style.cursor = 'pointer';
            
            newPin.disabled = false;
            confirmPin.disabled = false;
        }
    }
    
    // ========================================
    // ACCOUNT NUMBER VALIDATION
    // ========================================
    if (accountNumber) {
        accountNumber.addEventListener('input', function() {
            const accNumber = this.value.replace(/\D/g, '');
            this.value = accNumber;
            
            if (accNumber.length !== 10) {
                accountName.value = '';
                accountName.placeholder = 'Account Name';
                accountName.style.color = '';
                accountName.style.fontWeight = '';
                accountName.readOnly = false;
            }
        });
    }
    
    // ========================================
    // ACCOUNT NAME INPUT
    // ========================================
    if (accountName) {
        accountName.addEventListener('input', function() {
            this.style.color = 'var(--text-dark)';
            this.style.fontWeight = '500';
        });
    }
    
    // ========================================
    // TOGGLE PIN VISIBILITY
    // ========================================
    if (toggleNewPin) {
        toggleNewPin.addEventListener('click', function() {
            const type = newPin.getAttribute('type') === 'password' ? 'text' : 'password';
            newPin.setAttribute('type', type);
            this.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    if (toggleConfirmPin) {
        toggleConfirmPin.addEventListener('click', function() {
            const type = confirmPin.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPin.setAttribute('type', type);
            this.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // ========================================
    // PIN VALIDATION
    // ========================================
    function validatePIN() {
        if (!newPin || !confirmPin || !pinStatus || !pinStatusText) return false;
        
        const newPinValue = newPin.value;
        const confirmPinValue = confirmPin.value;
        
        if (userWithdrawPIN) {
            pinStatus.classList.add('active', 'error');
            pinStatus.classList.remove('success');
            pinStatusText.textContent = 'PIN is already set and cannot be changed';
            return false;
        }
        
        if (newPinValue.length !== 4) {
            pinStatus.classList.add('active', 'error');
            pinStatus.classList.remove('success');
            pinStatusText.textContent = 'PIN must be exactly 4 digits';
            return false;
        }
        
        if (!/^\d{4}$/.test(newPinValue)) {
            pinStatus.classList.add('active', 'error');
            pinStatus.classList.remove('success');
            pinStatusText.textContent = 'PIN must contain only numbers';
            return false;
        }
        
        if (newPinValue !== confirmPinValue) {
            pinStatus.classList.add('active', 'error');
            pinStatus.classList.remove('success');
            pinStatusText.textContent = 'PINs do not match';
            return false;
        }
        
        pinStatus.classList.remove('error');
        pinStatus.classList.add('active', 'success');
        pinStatusText.textContent = 'PIN is valid and ready to be saved';
        return true;
    }
    
    if (newPin) {
        newPin.addEventListener('input', validatePIN);
    }
    
    if (confirmPin) {
        confirmPin.addEventListener('input', validatePIN);
    }
    
    // ========================================
    // BANK FORM SUBMISSION (WITH VENDOR UPDATE)
    // ========================================
    if (bankForm) {
        bankForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isProcessing) return;
            
            if (userBankAccount) {
                showToast('error', 'Not Allowed', 'You already have a bank account set', 4000);
                return;
            }
            
            const selectedBankName = bankName.value;
            const selectedBankText = bankName.options[bankName.selectedIndex].text;
            const accNumber = accountNumber.value.trim();
            const accName = accountName.value.trim();
            
            if (!selectedBankName || !accNumber || !accName) {
                showToast('error', 'Validation Error', 'Please fill all fields correctly', 4000);
                return;
            }
            
            if (accNumber.length !== 10) {
                showToast('error', 'Invalid Account', 'Account number must be 10 digits', 4000);
                return;
            }
            
            if (accName.length < 3) {
                showToast('error', 'Invalid Name', 'Account name must be at least 3 characters', 4000);
                return;
            }
            
            // Set loading state
            isProcessing = true;
            const submitBtn = bankForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const bankData = {
                    bankName: selectedBankText,
                    accountNumber: accNumber,
                    accountName: accName,
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // ========================================
                // 1. UPDATE USER DOCUMENT
                // ========================================
                await db.collection('users').doc(currentUser.uid).update({
                    bankAccount: bankData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Bank account saved to users collection');
                
                // ========================================
                // 2. CHECK IF USER IS VENDOR & UPDATE
                // ========================================
                try {
                    const vendorQuery = await db.collection('vendors')
                        .where('uid', '==', currentUser.uid)
                        .limit(1)
                        .get();
                    
                    if (!vendorQuery.empty) {
                        const vendorDoc = vendorQuery.docs[0];
                        
                        await vendorDoc.ref.update({
                            bankName: selectedBankText,
                            bankUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        console.log('✅ Vendor bankName updated');
                        showToast('info', 'Vendor Updated', 'Your vendor bank details have also been updated', 3000);
                    } else {
                        console.log('ℹ️ User is not a vendor - skipping vendor update');
                    }
                } catch (vendorError) {
                    console.warn('⚠️ Vendor update failed (non-critical):', vendorError);
                }
                
                // Update local state
                userBankAccount = bankData;
                
                // Reset form
                bankForm.reset();
                
                // Update UI
                renderBankAccount();
                
                showToast('success', 'Bank Added', 'Bank account has been saved successfully and cannot be changed', 5000);
                
            } catch (error) {
                console.error('❌ Error saving bank account:', error);
                showToast('error', 'Error', 'Failed to save bank account. Please try again', 5000);
            } finally {
                isProcessing = false;
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    // ========================================
    // PIN FORM SUBMISSION
    // ========================================
    if (pinForm) {
        pinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isProcessing) return;
            
            if (userWithdrawPIN) {
                showToast('error', 'Not Allowed', 'Withdraw PIN is already set and cannot be changed', 4000);
                return;
            }
            
            if (!validatePIN()) {
                showToast('error', 'Validation Error', 'Please fix PIN validation errors', 4000);
                return;
            }
            
            isProcessing = true;
            const submitBtn = pinForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const pinValue = newPin.value;
                
                await db.collection('users').doc(currentUser.uid).update({
                    withdrawPIN: pinValue,
                    pinSetAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Withdraw PIN saved');
                
                userWithdrawPIN = pinValue;
                
                pinForm.reset();
                
                updatePINStatus();
                
                showToast('success', 'PIN Saved', 'Withdraw PIN has been set successfully and cannot be changed', 5000);
                
            } catch (error) {
                console.error('❌ Error saving PIN:', error);
                showToast('error', 'Error', 'Failed to save PIN. Please try again', 5000);
            } finally {
                isProcessing = false;
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    console.log('✅ Bank Settings Ready');
});

console.log('📜 Bank Settings script loaded - waiting for DOM...');