// ================================================================
// PROFILE UPDATE - LOCAL STORAGE & FIREBASE LOGIC
// ================================================================

// For Firebase JS SDK v7.20.0 and later, measurementI is optional
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
const db = firebase.firestore();
const auth = firebase.auth();

// DOM ELEMENTS
const body = document.getElementById('body');  
const sidebar = document.getElementById('sidebar');  
const mobileOverlay = document.getElementById('mobileOverlay');  
const profileForm = document.getElementById('profileForm');  

const profileImg = document.getElementById('profileImg');  
const profileNameDisplay = document.querySelector('.profile-picture-section .profile-name'); 
const changePictureBtn = document.getElementById('changePictureBtn');  
const uploadPictureBtn = document.getElementById('uploadPictureBtn'); 
const profilePictureInput = document.getElementById('profilePictureInput');  
const savePictureBtn = document.getElementById('savePicture'); 

const fullNameInput = document.getElementById('fullName');  
const phoneNumberInput = document.getElementById('phoneNumber');  
const usernameInput = document.getElementById('username'); 
const emailInput = document.getElementById('email');
const countryInput = document.getElementById('country');
const createdAtInput = document.getElementById('createdAt');
const formSubmitBtn = profileForm.querySelector('button[type="submit"]');

const successModal = document.getElementById('successModal');  
const modalTitle = successModal.querySelector('.modal-title');
const modalMessage = successModal.querySelector('.modal-message');
const modalIcon = successModal.querySelector('.modal-icon i');
const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
const goToDashboardBtn = document.getElementById('goToDashboard');

// ------------------------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------------------------

function showModal(title, message, iconClass, iconColor = 'var(--success)') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIcon.className = iconClass;
    modalIcon.style.color = iconColor;
    goToDashboardBtn.style.display = iconColor === 'var(--success)' ? 'inline-flex' : 'none';
    successModal.classList.add('active');
}

function closeModal() {
    successModal.classList.remove('active');
}

closeSuccessModalBtn.addEventListener('click', closeModal);
goToDashboardBtn.addEventListener('click', closeModal);

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        let date;
        if (timestamp.toDate) date = timestamp.toDate();
        else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
        else date = new Date(timestamp);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'N/A'; }
}

// ------------------------------------------------------------------
// PROFILE IMAGE LOGIC (Firebase -> LocalStorage -> Default)
// ------------------------------------------------------------------

function setProfileImage(firebaseUrl, userId) {
    const localImg = localStorage.getItem(`profile_pic_${userId}`);
    const defaultAvatar = 'avatar.png'; // Tabbatar kana da wannan file din

    if (firebaseUrl && firebaseUrl !== "") {
        profileImg.src = firebaseUrl;
    } else if (localImg) {
        profileImg.src = localImg;
    } else {
        profileImg.src = defaultAvatar;
    }
}

// ------------------------------------------------------------------
// AUTHENTICATION & DATA FETCHING
// ------------------------------------------------------------------
let USER_ID = null;

function fetchUserData(uid) {
    if (!uid) return;
    const userRef = db.collection("users").doc(uid);

    userRef.get().then(userSnap => {
        if (userSnap.exists) {
            const data = userSnap.data();
            
            profileNameDisplay.textContent = data.fullName || data.username || 'Elite User';
            
            // Kira logic din hoton hoto
            setProfileImage(data.profilePic, uid);

            fullNameInput.value = data.fullName || '';
            phoneNumberInput.value = data.phone || '';
            usernameInput.value = data.username || '';
            emailInput.value = data.email || '';
            countryInput.value = data.country || '';
            createdAtInput.value = formatDate(data.createdAt);
            
        } else {
            showModal("Error", "User profile not found.", 'fas fa-user-times', 'var(--error-red)');
        }
    }).catch(error => {
        console.error("Error:", error);
        showModal("Error", "Network error occurred.", 'fas fa-bug', 'var(--error-red)');
    });
}

auth.onAuthStateChanged(user => {
    if (user) {
        USER_ID = user.uid;
        fetchUserData(USER_ID);
    } else {
        window.location.replace('/sign-in'); 
    }
});

// ------------------------------------------------------------------
// LOCAL STORAGE UPLOAD LOGIC
// ------------------------------------------------------------------

changePictureBtn.addEventListener('click', () => profilePictureInput.click());  
uploadPictureBtn.addEventListener('click', () => profilePictureInput.click());  

profilePictureInput.addEventListener('change', function() {  
    if (this.files && this.files[0]) {  
        const reader = new FileReader();  
        reader.onload = function(e) {  
            profileImg.src = e.target.result; // Preview hoton nan take
        };
        reader.readAsDataURL(this.files[0]);  
    }  
});

savePictureBtn.addEventListener('click', () => {
    const file = profilePictureInput.files[0];

    if (!USER_ID) {
        showModal("Error", "User not authenticated.", 'fas fa-user-lock', 'var(--error-red)');
        return;
    }

    if (!file) {
        showModal("Warning", "Select a picture first.", 'fas fa-exclamation-triangle', 'var(--warning)');
        return;
    }

  if (file.size > 2 * 1024 * 1024) { // 2MB
    showModal(
      "Warning",
      "Image is too large. Please choose an image under 2MB.",
      'fas fa-exclamation-triangle',
      'var(--warning)'
    );
    return;
}
  
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const base64Image = e.target.result;
            // Ajiye a LocalStorage
            localStorage.setItem(`profile_pic_${USER_ID}`, base64Image);
            
            showModal("Success!", "Hoto ya adana a wayarka (Local Storage).", 'fas fa-check-circle', 'var(--success)');
        } catch (error) {
            console.error(error);
            showModal("Error", "Hoto yayi girma da yawa don storage din wayar.", 'fas fa-times-circle', 'var(--error-red)');
        }
    };
    reader.readAsDataURL(file);
});


// ------------------------------------------------------------------
// PERSONAL INFORMATION UPDATE
// ------------------------------------------------------------------

profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!USER_ID) return;

    const originalText = formSubmitBtn.innerHTML;
    const newPhone = phoneNumberInput.value.trim();
    const newFullName = fullNameInput.value.trim();

    formSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    formSubmitBtn.disabled = true;

    try {
        // 1. Update a "users" collection (Main update)
        await db.collection("users").doc(USER_ID).update({
            fullName: newFullName,
            phone: newPhone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Duba idan user yana cikin "vendors" collection
        const vendorRef = db.collection("vendors").doc(USER_ID);
        const vendorSnap = await vendorRef.get();

        if (vendorSnap.exists) {
            // Idan yanada document a vendors, sai a update phone field kawai
            await vendorRef.update({
                phone: newPhone
            });
            console.log("Vendor phone updated successfully.");
        } else {
            // Idan bashi da shi, lafiya lau sai mu wuce
            console.log("User is not a vendor, skipping vendor update.");
        }

        profileNameDisplay.textContent = newFullName;
        showModal("Success!", "An sabunta bayananka.", 'fas fa-check-circle', 'var(--success)');

    } catch (error) {
        console.error("Update Error:", error);
        showModal("Error", "An samu matsala: " + error.message, 'fas fa-times-circle', 'var(--error-red)');
    } finally {
        formSubmitBtn.innerHTML = originalText;
        formSubmitBtn.disabled = false;
    }
});


// ------------------------------------------------------------------
// PERSONAL INFORMATION UPDATE
// ------------------------------------------------------------------

/*profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!USER_ID) return;

    const originalText = formSubmitBtn.innerHTML;
    formSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    formSubmitBtn.disabled = true;

    try {
        await db.collection("users").doc(USER_ID).update({
            fullName: fullNameInput.value.trim(),
            phone: phoneNumberInput.value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        profileNameDisplay.textContent = fullNameInput.value.trim();
        showModal("Success!", "An sabunta bayananka.", 'fas fa-check-circle', 'var(--success)');

    } catch (error) {
        showModal("Error", "Failed to update: " + error.message, 'fas fa-times-circle', 'var(--error-red)');
    } finally {
        formSubmitBtn.innerHTML = originalText;
        formSubmitBtn.disabled = false;
    }
});*/

// ------------------------------------------------------------------
// UI LOGIC (Dark Mode & Sidebar)
// ------------------------------------------------------------------

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle?.addEventListener('click', () => {   
    body.classList.toggle('dark-mode');   
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');  
    darkModeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
});  

if (localStorage.getItem('darkMode') === 'enabled') {  
    body.classList.add('dark-mode');  
    darkModeToggle.querySelector('i').className = 'fas fa-sun';
}  

// Menu toggles
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');

menuToggle?.addEventListener('click', () => {   
    sidebar.classList.add('open');  
    mobileOverlay.classList.add('active');  
});  

[closeSidebar, mobileOverlay].forEach(el => {
    el?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

console.log("✅ Profile Local Storage System Ready!");
