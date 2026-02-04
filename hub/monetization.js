// ========================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ========================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByGPHEArtVZsglkN4qmd0zJe1SvU6DDvw",
  authDomain: "elievisionnigeria.firebaseapp.com",
  projectId: "elievisionnigeria",
  storageBucket: "elievisionnigeria.firebasestorage.app",
  messagingSenderId: "549861461832",
  appId: "1:549861461832:web:f35bf2b01f61cb4f80ed7d",
  measurementId: "G-G5CZY4Y553"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let monetizationSubmissions = [];

// ========================================
// DOM ELEMENTS
// ========================================
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const monetizationForm = document.getElementById('monetizationForm');
const submissionsTableBody = document.getElementById('submissionsTableBody');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');
const submitBtn = document.getElementById('submitBtn');

// ========================================
// TOAST NOTIFICATION SYSTEM
// ========================================
function showToast(type, title, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check' : 
                type === 'error' ? 'fa-times' : 
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle';
    
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
    
    return toast;
}

// ========================================
// AUTHENTICATION CHECK
// ========================================
function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                console.log("User authenticated:", currentUser.uid);
                resolve(user);
            } else {
                console.log("User not authenticated, redirecting...");
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


// ========================================
// SIDEBAR & DARK MODE FUNCTIONALITY
// ========================================
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

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
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
// HELPER FUNCTIONS
// ========================================
function getPlatformIcon(platform) {
    const icons = {
        'tiktok': 'fab fa-tiktok',
        'instagram': 'fab fa-instagram',
        'youtube': 'fab fa-youtube',
        'facebook': 'fab fa-facebook'
    };
    return icons[platform.toLowerCase()] || 'fas fa-video';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
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

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// ========================================
// UPDATE PROFILE INFO
// ========================================
async function updateProfileInfo() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            const profileName = document.querySelector('.sidebar-profile-name');
            const profileRole = document.querySelector('.sidebar-profile-role');
            const profileImg = document.querySelector('.sidebar-profile-img');
            
            if (profileName && userData.fullName) {
                profileName.textContent = userData.fullName;
            }
            if (profileRole && userData.username) {
                profileRole.textContent = userData.username || 'Member';
            }
            if (profileImg && userData.profilePic) {
                profileImg.src = userData.profilePic;
            }
        }
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

// ========================================
// FETCH SUBMISSIONS FROM FIRESTORE
// ========================================
async function fetchSubmissions() {
    if (!currentUser) return;
    
    try {
        console.log("Fetching submissions for user:", currentUser.uid);
        
        // Simple query without orderBy to avoid index requirement
        const submissionsSnapshot = await db.collection('monetizationSubmissions')
            .where('userId', '==', currentUser.uid)
            .get();
        
        monetizationSubmissions = [];
        
        submissionsSnapshot.forEach(doc => {
            monetizationSubmissions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort in JavaScript instead of Firestore
        monetizationSubmissions.sort((a, b) => {
            const timeA = a.timestampMillis || 0;
            const timeB = b.timestampMillis || 0;
            return timeB - timeA; // Latest first
        });
        
        console.log(`Found ${monetizationSubmissions.length} submissions`);
        renderSubmissions();
        
    } catch (error) {
        console.error("Error fetching submissions:", error);
        showToast('error', 'Load Failed', 'Failed to load your submissions. Please refresh the page.', 5000);
    }
}

// ========================================
// RENDER SUBMISSIONS TABLE
// ========================================
function renderSubmissions() {
    submissionsTableBody.innerHTML = '';
    
    if (monetizationSubmissions.length === 0) {
        emptyState.style.display = 'block';
        document.querySelector('.submissions-table').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    document.querySelector('.submissions-table').style.display = 'table';
    
    monetizationSubmissions.forEach((submission, index) => {
        const row = document.createElement('tr');
        
        const platformIconClass = `platform-icon ${submission.platform}`;
        const platformIcon = getPlatformIcon(submission.platform);
        
        const statusClass = submission.status === 'approved' ? 'approved' :
                          submission.status === 'rejected' ? 'rejected' : 'pending';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="platform-cell">
                    <div class="${platformIconClass}">
                        <i class="${platformIcon}"></i>
                    </div>
                    <span>${submission.platform.charAt(0).toUpperCase() + submission.platform.slice(1)}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 600;">${submission.inputUsername}</span>
                    <span style="font-size: 12px; color: var(--text-light);">@${submission.websiteUsername}</span>
                </div>
            </td>
            <td>
                <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <a href="${submission.videoLink}" target="_blank" style="color: var(--primary-green); text-decoration: none;">
                        ${submission.videoLink}
                    </a>
                </div>
            </td>
            <td><span class="status-badge ${statusClass}">${submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</span></td>
            <td>${formatDate(submission.timestampMillis)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="viewDetails('${submission.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon copy" onclick="copyLink('${submission.id}')" title="Copy Link">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteSubmission('${submission.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        submissionsTableBody.appendChild(row);
    });
}

// ========================================
// FORM SUBMISSION
// ========================================
monetizationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('error', 'Not Authenticated', 'Please login first.', 4000);
        return;
    }
    
    const platform = document.getElementById('platform').value;
    const inputUsername = document.getElementById('username').value.trim();
    const videoLink = document.getElementById('videoLink').value.trim();
    
    // Validation
    if (!platform || !inputUsername || !videoLink) {
        showToast('error', 'Validation Error', 'Please fill all fields correctly.', 4000);
        return;
    }
    
    if (!isValidUrl(videoLink)) {
        showToast('error', 'Invalid URL', 'Please enter a valid video link.', 4000);
        return;
    }
    
    // Set loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Get user data for website username
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const websiteUsername = userDoc.exists && userDoc.data().username ? 
                               userDoc.data().username : currentUser.email.split('@')[0];
        
        // Get current timestamp in milliseconds for easier sorting
        const now = Date.now();
        
        // Create submission data
        const submissionData = {
            platform: platform,
            inputUsername: inputUsername,
            websiteUsername: websiteUsername,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            videoLink: videoLink,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            timestampMillis: now, // Add numeric timestamp for sorting
            submittedDate: new Date().toISOString()
        };
        
        // Save to Firestore
        const docRef = await db.collection('monetizationSubmissions').add(submissionData);
        
        console.log("Submission created with ID:", docRef.id);
        
        // Reset form
        monetizationForm.reset();
        
        // Refresh submissions
        await fetchSubmissions();
        
        showToast('success', 'Submission Successful', 
            `Your ${platform} content has been submitted for review. We'll notify you once it's reviewed!`, 6000);
        
    } catch (error) {
        console.error('Submission error:', error);
        showToast('error', 'Submission Failed', 
            'Failed to submit your content. Please try again.', 5000);
    } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// ========================================
// ACTION FUNCTIONS
// ========================================

// View submission details
window.viewDetails = function(submissionId) {
    const submission = monetizationSubmissions.find(s => s.id === submissionId);
    
    if (submission) {
        const details = `
Platform: ${submission.platform.toUpperCase()}
Input Username: ${submission.inputUsername}
Website Username: ${submission.websiteUsername}
Video Link: ${submission.videoLink}
Status: ${submission.status.toUpperCase()}
Submitted: ${formatDate(submission.timestampMillis)}
        `;
        alert(details);
    } else {
        showToast('error', 'Not Found', 'Submission not found.', 3000);
    }
}

// Copy video link to clipboard
window.copyLink = function(submissionId) {
    const submission = monetizationSubmissions.find(s => s.id === submissionId);
    
    if (submission && submission.videoLink) {
        navigator.clipboard.writeText(submission.videoLink)
            .then(() => {
                showToast('success', 'Link Copied', 
                    'Video link has been copied to clipboard!', 3000);
            })
            .catch(() => {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = submission.videoLink;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showToast('success', 'Link Copied', 
                        'Video link has been copied to clipboard!', 3000);
                } catch (err) {
                    showToast('error', 'Copy Failed', 
                        'Failed to copy link. Please copy manually.', 4000);
                }
                document.body.removeChild(textArea);
            });
    } else {
        showToast('error', 'Not Found', 'Submission not found.', 3000);
    }
}

// Delete submission
window.deleteSubmission = async function(submissionId) {
    if (!currentUser) return;
    
    if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
        try {
            await db.collection('monetizationSubmissions').doc(submissionId).delete();
            
            showToast('success', 'Submission Deleted', 
                'Your submission has been removed successfully.', 4000);
            
            // Refresh submissions
            await fetchSubmissions();
            
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'Delete Failed', 
                'Failed to delete submission. Please try again.', 4000);
        }
    }
}

// ========================================
// REAL-TIME UPDATES
// ========================================
function setupRealtimeListener() {
    if (!currentUser) return;
    
    // Listen for changes to user's submissions
    db.collection('monetizationSubmissions')
        .where('userId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const updatedSubmission = change.doc.data();
                    
                    if (updatedSubmission.status === 'approved') {
                        showToast('success', 'Submission Approved! 🎉', 
                            `Your ${updatedSubmission.platform} content has been approved for monetization!`, 8000);
                    } else if (updatedSubmission.status === 'rejected') {
                        showToast('error', 'Submission Rejected', 
                            `Your ${updatedSubmission.platform} submission was not approved. Please try again with different content.`, 8000);
                    }
                }
            });
            
            // Refresh the table
            fetchSubmissions();
        }, (error) => {
            console.error("Error in realtime listener:", error);
        });
}

// ========================================
// PAGE INITIALIZATION
// ========================================
async function initMonetizationPage() {
    try {
        console.log("Initializing Monetization Page...");
        
        // Check authentication
        await checkAuth();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update profile info
        await updateProfileInfo();
        
        // Fetch submissions
        await fetchSubmissions();
        
        // Setup realtime listener
        setupRealtimeListener();
        
        // Show welcome message
        setTimeout(() => {
            showToast('info', 'Monetization Center', 
                'Submit your social media content and start earning! 💰', 4000);
        }, 1000);
        
        console.log("Monetization Page initialized successfully");
        
    } catch (error) {
        console.error("Initialization failed:", error);
        if (error.message !== 'Not authenticated') {
            showToast('error', 'Error', 'Failed to load page. Please refresh.', 5000);
        }
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonetizationPage);
} else {
    initMonetizationPage();
}