// DOM Elements
const body = document.getElementById('body');
const darkModeToggle = document.getElementById('darkModeToggle');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const resetButton = document.getElementById('resetButton');

// Modals
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const closeErrorModal = document.getElementById('closeErrorModal');

// Error messages
const emailError = document.getElementById('emailError');

// --- FIREBASE CONFIGURATION ---
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
closeSuccessModal.addEventListener('click', () => {
    closeModal(successModal);
    // Kai zuwa signin page bayan an rufe modal
    window.location.href = 'signin.html';
});

closeErrorModal.addEventListener('click', () => closeModal(errorModal));

// =======================================================================
// FORM VALIDATION & SUBMISSION
// =======================================================================

function setLoadingState(isLoading) {
    if (isLoading) {
        resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        resetButton.disabled = true;
    } else {
        resetButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        resetButton.disabled = false;
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(errorElement, inputElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    inputElement.classList.add('error');
}

function resetErrors() {
    emailError.classList.remove('show');
    emailInput.classList.remove('error');
}

forgotPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    resetErrors();
    
    const email = emailInput.value.trim();
    
    // Validate email
    if (email === '') {
        showError(emailError, emailInput, 'Please enter your email address.');
        return;
    }
    
    if (!validateEmail(email)) {
        showError(emailError, emailInput, 'Please enter a valid email address.');
        return;
    }
    
    setLoadingState(true);
    
    try {
        // Aika password reset email
        await auth.sendPasswordResetEmail(email);
        
        // Success!
        showModal(
            successModal, 
            'Email Sent!', 
            `Password reset link has been sent to ${email}. Please check your inbox and follow the instructions.`, 
            false
        );
        
        // Goge form
        forgotPasswordForm.reset();
        
    } catch (error) {
        console.error("Password Reset Error:", error);
        
        let errorMessage = 'An error occurred. Please try again.';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address format.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please try again later.';
        }
        
        showModal(errorModal, 'Error!', errorMessage, true);
        
    } finally {
        setLoadingState(false);
    }
});

// =======================================================================
// DARK MODE TOGGLE
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

// =======================================================================
// REAL-TIME EMAIL VALIDATION (Optional - for better UX)
// =======================================================================

emailInput.addEventListener('input', function() {
    // Goge error idan an fara typing
    if (emailError.classList.contains('show')) {
        resetErrors();
    }
});

emailInput.addEventListener('blur', function() {
    // Bincika email idan user ya bar input field
    const email = emailInput.value.trim();
    if (email !== '' && !validateEmail(email)) {
        showError(emailError, emailInput, 'Please enter a valid email address.');
    }
});

