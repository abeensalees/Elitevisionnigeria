// ========================================
// DIGITAL-SKILLS.JS - Elite Vision Courses
// Clean Structure - Separate Purchases!
// ========================================

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
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let digitalCourses = [];
let userPurchases = {};
let currentCourse = null;

// ========================================
// DOM CONTENT LOADED
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Digital Skills Page Initialized');
    
    // DOM Elements
    const body = document.getElementById('body');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const coursesGrid = document.getElementById('coursesGrid');
    const courseModal = document.getElementById('courseModal');
    const successModal = document.getElementById('successModal');
    const toastContainer = document.getElementById('toastContainer');
    const modalClose = document.getElementById('modalClose');
    const closeSuccess = document.getElementById('closeSuccess');
    const accessCourseBtn = document.getElementById('accessCourse');
    
    // Modal elements
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDescription = document.getElementById('modalDescription');
    const modalActions = document.getElementById('modalActions');
    const successMessage = document.getElementById('successMessage');
    
    // ========================================
    // UI FUNCTIONS
    // ========================================
    
    // Toggle sidebar
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
    
    // Toggle dark mode
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
    
    // Check for saved dark mode preference
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
    // TOAST NOTIFICATION
    // ========================================
    function showToast(type, title, message, duration = 5000) {
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
    }
    
    // ========================================
    // AUTH STATE LISTENER
    // ========================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.uid);
            await loadData();
        } else {
            console.log('❌ No user logged in - Redirecting to login...');
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
    // LOAD DATA (Courses + Purchases)
    // ========================================
    async function loadData() {
        try {
            // Load courses and purchases in parallel
            await Promise.all([
                fetchCourses(),
                fetchUserPurchases()
            ]);
            
            // Render courses after both are loaded
            renderCourses();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            showToast('error', 'Error', 'Failed to load data. Please refresh the page.', 5000);
        }
    }
    
    // ========================================
    // FETCH COURSES FROM FIRESTORE
    // ========================================
    async function fetchCourses() {
        try {
            console.log('📊 Fetching courses from Firestore...');
            
            const coursesRef = db.collection('courses');
            const querySnapshot = await coursesRef.get();
            
            if (querySnapshot.empty) {
                console.log('📭 No courses found in Firestore');
                showToast('warning', 'No Courses', 'No courses available at the moment.', 5000);
                return;
            }
            
            console.log(`✅ Found ${querySnapshot.size} courses`);
            
            digitalCourses = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                digitalCourses.push({
                    id: doc.id,
                    title: data.title || 'Untitled Course',
                    description: data.description || 'No description available',
                    price: data.price || 0,
                    banner: data.banner || data.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
                    category: data.category || 'Course',
                    accessLink: data.accessLink || ''
                });
            });
            
            console.log('✅ Courses loaded:', digitalCourses.length);
            
        } catch (error) {
            console.error('❌ Error fetching courses:', error);
            throw error;
        }
    }
    
    // ========================================
    // FETCH USER PURCHASES
    // ========================================
    async function fetchUserPurchases() {
        try {
            console.log('🛒 Fetching user purchases...');
            
            const purchaseRef = db.collection('purchased').doc(currentUser.uid);
            const purchaseSnap = await purchaseRef.get();
            
            if (purchaseSnap.exists) {
                userPurchases = purchaseSnap.data();
                console.log('✅ User purchases loaded:', Object.keys(userPurchases).length);
            } else {
                console.log('📭 No purchases found for user');
                userPurchases = {};
            }
            
        } catch (error) {
            console.error('❌ Error fetching purchases:', error);
            userPurchases = {};
        }
    }
    
    // ========================================
    // CHECK IF COURSE IS PURCHASED
    // ========================================
    function isPurchased(courseId) {
        return userPurchases[courseId] === true || userPurchases[courseId]?.purchased === true;
    }
    
    // ========================================
    // RENDER COURSES
    // ========================================
    function renderCourses() {
        if (!coursesGrid) return;
        
        coursesGrid.innerHTML = '';
        
        if (digitalCourses.length === 0) {
            coursesGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 40px;">No courses available</p>';
            return;
        }
        
        digitalCourses.forEach((course, index) => {
            const purchased = isPurchased(course.id);
            
            const courseCard = document.createElement('div');
            courseCard.className = `course-card ${purchased ? 'purchased' : ''}`;
            courseCard.style.animationDelay = `${index * 0.1}s`;
            
            courseCard.innerHTML = `
                <div class="course-image">
                    <img src="${course.banner}" alt="${course.title}" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop'">
                    <div class="course-category">${course.category}</div>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-price">
                        <i class="fas fa-coins"></i>
                        ₦${parseFloat(course.price).toLocaleString()}
                    </div>
                    <p class="course-description">${course.description}</p>
                    <div class="course-actions">
                        ${purchased ? 
                            `<button class="btn btn-success access-btn" data-course-id="${course.id}">
                                <i class="fas fa-external-link-alt"></i>
                                <span class="btn-text">Access Course</span>
                            </button>` :
                            `<button class="btn btn-secondary preview-btn" data-course-id="${course.id}">
                                <i class="fas fa-eye"></i>
                                <span class="btn-text">Preview</span>
                            </button>
                            <button class="btn btn-primary buy-btn" data-course-id="${course.id}">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="btn-text">Buy Now</span>
                            </button>`
                        }
                    </div>
                </div>
            `;
            
            coursesGrid.appendChild(courseCard);
        });
        
        // Add event listeners
        document.querySelectorAll('.preview-btn, .buy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courseId = this.dataset.courseId;
                previewCourse(courseId);
            });
        });
        
        document.querySelectorAll('.access-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courseId = this.dataset.courseId;
                accessCourseLink(courseId);
            });
        });
        
        console.log(`✅ Rendered ${digitalCourses.length} courses`);
    }
    
    // ========================================
    // PREVIEW COURSE (OPEN MODAL)
    // ========================================
    function previewCourse(courseId) {
        const course = digitalCourses.find(c => c.id === courseId);
        
        if (!course) return;
        
        console.log('👁️ Previewing course:', course.title);
        
        currentCourse = course;
        const purchased = isPurchased(courseId);
        
        // Update modal content
        if (modalImage) {
            modalImage.src = course.banner;
            modalImage.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop';
            };
        }
        if (modalTitle) modalTitle.textContent = course.title;
        if (modalPrice) modalPrice.innerHTML = `<i class="fas fa-coins"></i> ₦${parseFloat(course.price).toLocaleString()}`;
        if (modalDescription) modalDescription.textContent = course.description;
        
        // Update modal actions
        if (modalActions) {
            modalActions.innerHTML = purchased ? 
                `<button class="btn btn-success" onclick="window.accessCourseLinkFromModal()">
                    <i class="fas fa-external-link-alt"></i>
                    Access Course
                </button>` :
                `<button class="btn btn-primary" onclick="window.purchaseCourseFromModal()">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="btn-text">Buy Now - ₦${parseFloat(course.price).toLocaleString()}</span>
                </button>`;
        }
        
        // Show modal
        if (courseModal) {
            courseModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // ========================================
    // PURCHASE COURSE
    // ========================================
    async function purchaseCourse() {
        if (!currentCourse) return;
        if (!currentUser) return;
        
        console.log('💳 Purchasing course:', currentCourse.title);
        
        try {
            // Get user data
            const userRef = db.collection('users').doc(currentUser.uid);
            const userSnap = await userRef.get();
            
            if (!userSnap.exists) {
                throw new Error('User data not found');
            }
            
            const userData = userSnap.data();
            const bonusWallet = userData.bonusWallet || 0;
            const coursePrice = parseFloat(currentCourse.price);
            
            console.log(`💰 Bonus Wallet: ₦${bonusWallet}, Course Price: ₦${coursePrice}`);
            
            // Check if user has enough balance
            if (bonusWallet < coursePrice) {
                const shortfall = coursePrice - bonusWallet;
                showToast('error', 'Insufficient Balance', 
                    `You need ₦${shortfall.toLocaleString()} more in your bonus wallet. Current balance: ₦${bonusWallet.toLocaleString()}`, 
                    6000);
                return;
            }
            
            // Set loading state
            const buyBtn = modalActions.querySelector('.btn');
            if (buyBtn) {
                buyBtn.classList.add('loading');
                buyBtn.disabled = true;
            }
            
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Deduct from bonus wallet
            const newBalance = bonusWallet - coursePrice;
            await userRef.update({
                bonusWallet: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Deducted ₦${coursePrice.toLocaleString()} from bonus wallet`);
            
            // Add to purchased collection
            const purchaseRef = db.collection('purchased').doc(currentUser.uid);
            await purchaseRef.set({
                [currentCourse.id]: {
                    purchased: true,
                    courseTitle: currentCourse.title,
                    coursePrice: coursePrice,
                    purchasedAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true });
            
            console.log('✅ Course added to purchased collection');
            
            // Update local purchases
            userPurchases[currentCourse.id] = {
                purchased: true,
                courseTitle: currentCourse.title,
                coursePrice: coursePrice
            };
            
            // Close course modal
            if (courseModal) courseModal.classList.remove('active');
            
            // Show success modal
            if (successMessage) {
                successMessage.textContent = `Congratulations! You've successfully purchased "${currentCourse.title}". ₦${coursePrice.toLocaleString()} has been deducted from your bonus wallet. You now have lifetime access to this course.`;
            }
            
            if (successModal) {
                successModal.classList.add('active');
            }
            
            // Re-render courses
            renderCourses();
            
            showToast('success', 'Course Purchased!', 
                `₦${coursePrice.toLocaleString()} deducted. New balance: ₦${newBalance.toLocaleString()}`, 
                5000);
            
        } catch (error) {
            console.error('❌ Error purchasing course:', error);
            showToast('error', 'Purchase Failed', 'An error occurred. Please try again.', 5000);
            
            // Reset loading state
            const buyBtn = modalActions.querySelector('.btn');
            if (buyBtn) {
                buyBtn.classList.remove('loading');
                buyBtn.disabled = false;
            }
        }
    }
    
    // ========================================
    // ACCESS COURSE LINK
    // ========================================
    function accessCourseLink(courseId) {
        const course = digitalCourses.find(c => c.id === courseId);
        
        if (!course) return;
        
        // Check if course is purchased
        if (!isPurchased(courseId)) {
            showToast('error', 'Not Purchased', 'Please purchase this course first to access it.', 4000);
            return;
        }
        
        console.log('🔗 Accessing course:', course.title);
        
        // Close modals
        if (courseModal) courseModal.classList.remove('active');
        if (successModal) successModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Open course link
        if (course.accessLink) {
            window.open(course.accessLink, '_blank');
            showToast('success', 'Opening Course', `Accessing "${course.title}"...`, 3000);
        } else {
            showToast('error', 'No Access Link', 'Course access link not available.', 4000);
        }
    }
    
    // ========================================
    // MODAL EVENT LISTENERS
    // ========================================
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            courseModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (closeSuccess) {
        closeSuccess.addEventListener('click', () => {
            successModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (accessCourseBtn) {
        accessCourseBtn.addEventListener('click', () => {
            if (currentCourse) {
                accessCourseLink(currentCourse.id);
            }
        });
    }
    
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) {
                courseModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (courseModal) courseModal.classList.remove('active');
            if (successModal) successModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // ========================================
    // GLOBAL FUNCTIONS
    // ========================================
    window.purchaseCourseFromModal = purchaseCourse;
    window.accessCourseLinkFromModal = function() {
        if (currentCourse) {
            accessCourseLink(currentCourse.id);
        }
    };
    
    window.previewCourse = previewCourse;
    window.accessCourseLink = accessCourseLink;
    
    console.log('✅ Digital Skills System Ready');
});

console.log('📜 Digital Skills script loaded - waiting for DOM...');