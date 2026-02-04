

// DOM Elements
const body = document.getElementById('body');
const darkModeToggle = document.getElementById('darkModeToggle');
const signinForm = document.getElementById('signinForm');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const loginButton = document.getElementById('loginButton');
const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
   const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
// Modals
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const goToDashboard = document.getElementById('goToDashboard');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const closeErrorModal = document.getElementById('closeErrorModal');

// Error messages
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// --- FIREBASE CONFIGURATION ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// =======================================================================
// MODAL FUNCTIONS
// =======================================================================

function showModal(modalElement, title, message, isError = false) {
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
    window.location.href = 'hub/'; 
});

// =======================================================================
// SIGN IN FORM - SAUƘAƘAN LOGIN KAWAI
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
        // Kawai login da Firebase
        await auth.signInWithEmailAndPassword(email, password);
        
        // Login ya yi nasara!
        showModal(successModal, 'Login Successful!', 'Welcome back to Elite Vision Network!', false);

    } catch (error) {
        console.error("Firebase Login Error:", error);
        let errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        }

        showModal(errorModal, 'Login Failed!', errorMessage, true);
    } finally {
        setLoadingState(false);
    }
});

// =======================================================================
// DARK MODE
// =======================================================================

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


// =======================================================================
// PASSWORD VISIBILITY TOGGLE
// =======================================================================

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
