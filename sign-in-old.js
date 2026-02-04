
    // DOM Elements
    const body = document.getElementById('body');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const signinForm = document.getElementById('signinForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    const loginButton = document.getElementById('loginButton');

    // Modals
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const goToDashboard = document.getElementById('goToDashboard');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    const closeErrorModal = document.getElementById('closeErrorModal');
    
    // Error messages
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Dropdown functionality
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // --- FIREBASE CONFIGURATION (KA CANZA WANNAN DA NAKA!!!) ---
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsmiPqDPbNRIK9-v8X87M-xQd2rdalxZw",
  authDomain: "arewa-project.firebaseapp.com",
  projectId: "arewa-project",
  storageBucket: "arewa-project.firebasestorage.app",
  messagingSenderId: "284928916204",
  appId: "1:284928916204:web:fea76e403e0c18cc3b83c9",
  measurementId: "G-FSTJFQFBB9"
};


    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const usersRef = db.collection('users');
    const transactionsRef = db.collection('transactions'); // 💡 SABON REFERENCE NA TRANSACTIONS

    // =======================================================================
    // 1. MODAL FUNCTIONS
    // =======================================================================

    function showModal(modalElement, title, message, isError = false) {
        // Update title and message (already in HTML but can be changed dynamically)
        if (isError) {
            document.getElementById('errorModalTitle').textContent = title;
            document.getElementById('errorModalMessage').textContent = message;
        } else {
            document.getElementById('successModalTitle').textContent = title;
            document.getElementById('successModalMessage').textContent = message;
        }
        
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Close listeners
    closeSuccessModal.addEventListener('click', () => closeModal(successModal));
    closeErrorModal.addEventListener('click', () => closeModal(errorModal));
    
    goToDashboard.addEventListener('click', () => {
        closeModal(successModal);
        window.location.replace('hub/');
    });

 

    // =======================================================================
    // 2. DAILY LOGIN LOGIC (An Ƙara Transaction Recording)
    // =======================================================================
    
    
    async function addTransactionRecord(userId, amount, type, description, wallet) {
        try {
            await transactionsRef.add({
                userId: userId,
                amount: amount,
                type: type, 
                wallet: wallet, 
                description: description, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Transaction record added successfully.");
        } catch (error) {
            console.error("❌ Error adding transaction record:", error);
            // Ci gaba da aiki duk da kuskuren transaction, saboda an riga an bashi kudin.
        }
    }


    async function grantDailyLoginBonus(userId) {
        const userDocRef = usersRef.doc(userId);
        try {
            const doc = await userDocRef.get();
            if (!doc.exists) return { granted: false }; // Ba'a sami user ba
            
            const data = doc.data();
            const lastLoginTimestamp = data.lastDailyLogin || 0;
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            if (now - lastLoginTimestamp > twentyFourHours) {
                // Cika awanni 24, a bashi bonus
                const bonusAmount = 200; 
                const walletName = 'bonusWallet'; 
                
                const newBonusWallet = (data.bonusWallet || 0) + bonusAmount;
                const newBonusTotalEarned = (data.bonusTotalEarned || 0) + bonusAmount;

                // 1. UPDATE USER DOCUMENT (Dole a fara wannan)
                await userDocRef.update({
                    bonusWallet: newBonusWallet,
                    bonusTotalEarned: newBonusTotalEarned,
                    lastDailyLogin: now // Sabunta lokacin shiga
                });
                
                // 2. 💡 ƘARA TRANSACTION RECORD
                await addTransactionRecord(
                    userId, 
                    bonusAmount, 
                    'credit', 
                    'Daily Login Bonus', // Bayanin da zai fito a dashboard
                    walletName
                );

                console.log(`Daily login bonus of ${bonusAmount} granted to user ${userId}`);
                return { granted: true, amount: bonusAmount };

            } else {
                // Bai cika awanni 24 ba
                console.log(`Daily bonus already claimed within 24 hours for user ${userId}`);
                return { granted: false };
            }
        } catch (error) {
            console.error("Error granting daily bonus:", error);
            return { granted: false };
        }
    }

    // =======================================================================
    // 3. SIGN IN FORM SUBMISSION (An gyara don Firebase da Status Check)
    // =======================================================================

    function setLoadingState(isLoading) {
        if (isLoading) {
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            loginButton.disabled = true;
        } else {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            loginButton.disabled = false;
        }
    }

    function validateForm() {
        let isValid = true;
        resetErrors();
        
        const email = emailInput.value.trim();
        if (email === '') {
            showError(emailError, emailInput, 'Please enter your email.');
            isValid = false;
        }
        
        const password = passwordInput.value;
        if (password === '') {
            showError(passwordError, passwordInput, 'Please enter your password.');
            isValid = false;
        }
        
        return isValid;
    }

    function showError(errorElement, inputElement, message) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.classList.add('error');
    }

    function resetErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    }

    signinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoadingState(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            // 1. Sign in da Firebase
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 2. Bincika User Status daga Firestore
            const userDoc = await usersRef.doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Idan ba'a sami doc ba (ya kamata bai faru ba idan an yi sign up yadda ya kamata)
                await auth.signOut(); // Fitar da shi nan take
                showModal(errorModal, 'Login Failed!', 'Account data not found. Please contact support.', true);
                setLoadingState(false);
                return;
            }

            const userData = userDoc.data();
            const userStatus = userData.status; // Ana sa ran cewa akwai 'status' field a cikin Firestore

            if (userStatus === 'active') {
                
                // 3. Idan Active ne, Bashi Daily Login Bonus
                const bonusResult = await grantDailyLoginBonus(user.uid);
                
                let successMessage = 'Welcome back to Elite Vision Network!';
                if (bonusResult.granted) {
                    successMessage = `Welcome back! You received ₦${bonusResult.amount.toLocaleString()} Daily Login Bonus!`;
                }

                // 4. Shiga ya yi nasara
                showModal(successModal, 'Login Successful!', successMessage, false);

                // Idan kana amfani da Remember Me (Persistent Login):
                 //auth.setPersistence(rememberMe.checked ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);

            } else {
                // 5. Idan Status ba 'active' bane, to an suspended!
                await auth.signOut(); // Fitar da shi nan take don kariya
                showModal(errorModal, 'Account Suspended!', 'Your account is currently suspended. Please contact support for assistance.', true);
            }

        } catch (error) {
            console.error("Firebase Login Error:", error);
            let errorMessage = 'Invalid email or password. Please check your credentials and try again, or check your internet connection and try again.';
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            }

            // Nuna error ga mai amfani
            showModal(errorModal, 'Login Failed!', errorMessage, true);
        } finally {
            setLoadingState(false);
        }
    });

    // =======================================================================
    // 4. SAURAN JS FUNCTIONS (Sidebar, Dark Mode, Password Toggle)
    // =======================================================================

    // Toggle dark mode
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

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.querySelector('i').classList.remove('fa-moon');
        darkModeToggle.querySelector('i').classList.add('fa-sun');
    }

    // Toggle sidebar (An bar su a nan don amfani)
    // ... (sidebar code) ...
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

    // Dropdown functionality
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.parentElement;
            dropdown.classList.toggle('active');
        });
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
