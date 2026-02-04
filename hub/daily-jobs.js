// ========================================
// 🔥 BEST SOLUTION - FIELDS IN USER DOC!
// ========================================
// Instead of creating separate documents,
// we store everything in the user's document

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

const auth = firebase.auth();
const db = firebase.firestore();

// ========================================
// 🚀 CACHE SYSTEM
// ========================================
const CACHE_DURATION = 30 * 60 * 1000;

const cache = {
    jobs: { data: null, timestamp: 0 },
    userData: { data: null, timestamp: 0 }
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
        Object.keys(cache).forEach(key => {
            cache[key] = { data: null, timestamp: 0 };
        });
    }
}

// ========================================
// 🎯 USER DATA STRUCTURE
// ========================================
/*
users/{userId} = {
jjkjjgg
    email: "user@example.com",
    username: "john",
    bonusWallet: 5000,
    bonusTotalEarned: 10000,
    
    // 🆕 NEW FIELDS - All tasks in one place!
    dailyTasks: {
        "job_id_1": {
            viewed: true,
            viewedAt: timestamp,
            returned: true,
            returnedAt: timestamp,
            claimed: true,
            claimedAt: timestamp,
            amount: 100
        },
        "job_id_2": { ... }
    },
    
    musicTasks: {
        "music_id_1": { .. }
    },
    
    videoTasks: {
        "video_id_1": { ... }
    },
    
    // Any other task types...
    adTasks: { },
    surveyTasks: { }
}
*/

let currentUser = null;
let dailyJobs = [];
let userTasksData = {}; // All task completions from user doc

const PLATFORM_ICONS = {
    whatsapp: 'fab fa-whatsapp',
    facebook: 'fab fa-facebook',
    tiktok: 'fab fa-tiktok',
    telegram: 'fab fa-telegram',
    snapchat: 'fab fa-snapchat-ghost',
    instagram: 'fab fa-instagram',
    youtube: 'fab fa-youtube'
};

const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const tasksGrid = document.getElementById('tasksGrid');
const completedState = document.getElementById('completedState');
const toastContainer = document.getElementById('toastContainer');

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

function getTimestamp(timestamp) {
    if (!timestamp) return 0;
    
    if (typeof timestamp.toMillis === 'function') {
        return timestamp.toMillis();
    }
    else if (timestamp._seconds) {
        return timestamp._seconds * 1000;
    }
    else if (timestamp.seconds) {
        return timestamp.seconds * 1000;
    }
    else if (typeof timestamp === 'number') {
        return timestamp;
    }
    
    return 0;
}

function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                resolve(user);
            } else {
                window.location.replace('/sign-in');
                reject(new Error('Not authenticated'));
            }
        });
    });
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.clear();
                clearCache();
                window.location.replace('/sign-in');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                window.location.replace('/sign-in');
            });
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

// ========================================
// 🚀 FETCH DAILY JOBS
// ========================================
async function fetchDailyJobs(forceRefresh = false) {
    try {
        console.log("📊 Fetching jobs...");
        
        if (!forceRefresh && isCacheValid('jobs')) {
            const cachedData = getCache('jobs');
            dailyJobs = cachedData.jobs;
            console.log(`✅ Loaded ${dailyJobs.length} jobs from cache`);
            return dailyJobs;
        }
        
        const jobsSnapshot = await db.collection('dailyJobs')
            .where('active', '==', true)
            .get();
        
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0); 
        
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999); 
        
        const displayWindowStart = new Date(now);
        displayWindowStart.setHours(8, 0, 0, 0);
        
        const displayWindowEnd = new Date(now);
        displayWindowEnd.setHours(23, 59, 59, 999);

        dailyJobs = [];

        if (now < displayWindowStart || now > displayWindowEnd) {
            console.log("⏰ Outside display window");
            setCache('jobs', { jobs: [] });
            return [];
        }

        jobsSnapshot.forEach(doc => {
            const data = doc.data();
            
            if (data.datePosted) {
                const jobTimestamp = getTimestamp(data.datePosted);
                const jobDate = new Date(jobTimestamp);
                
                if (jobDate >= todayStart && jobDate <= todayEnd) {
                    dailyJobs.push({
                        id: doc.id,
                        ...data,
                        _timestamp: jobTimestamp
                    });
                }
            }
        });
        
        setCache('jobs', { jobs: dailyJobs });
        console.log(`✅ Loaded ${dailyJobs.length} jobs from Firebase`);
        return dailyJobs;
        
    } catch (error) {
        console.error("❌ Error fetching jobs:", error);
        showToast('error', 'Error', 'Failed to load jobs');
        return [];
    }
}

// ========================================
// 🔥 FETCH USER DATA (ONE READ!)
// ========================================
async function fetchUserData(forceRefresh = false) {
    try {
        console.log("📊 Fetching user data...");
        
        if (!forceRefresh && isCacheValid('userData')) {
            userTasksData = getCache('userData');
            console.log('✅ Loaded user data from cache');
            return userTasksData;
        }
        
        // ✅ ONE READ - Get entire user document
        const userDoc = await db.collection('users')
            .doc(currentUser.uid)
            .get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            
            // Extract all task fields
            userTasksData = {
                dailyTasks: data.dailyTasks || {},
                musicTasks: data.musicTasks || {},
                videoTasks: data.videoTasks || {},
                adTasks: data.adTasks || {},
                surveyTasks: data.surveyTasks || {}
                // Add any other task types here
            };
            
            console.log('✅ Loaded user data from Firebase');
        } else {
            userTasksData = {
                dailyTasks: {},
                musicTasks: {},
                videoTasks: {},
                adTasks: {},
                surveyTasks: {}
            };
            console.log('📭 No user data found');
        }
        
        setCache('userData', userTasksData);
        return userTasksData;
        
    } catch (error) {
        console.error("❌ Error fetching user data:", error);
        return {
            dailyTasks: {},
            musicTasks: {},
            videoTasks: {},
            adTasks: {},
            surveyTasks: {}
        };
    }
}

function getIconForType(type) {
    const normalizedType = type ? type.toLowerCase() : '';
    return PLATFORM_ICONS[normalizedType] || 'fas fa-tasks';
}

function showNoJobsMessage() {
    tasksGrid.style.display = 'none';
    completedState.classList.add('active');
    
    const completedIcon = completedState.querySelector('.completed-icon');
    const completedTitle = completedState.querySelector('.completed-title');
    const completedDescription = completedState.querySelector('.completed-description');
    
    completedIcon.innerHTML = '<i class="fas fa-calendar-times"></i>';
    completedTitle.textContent = 'No Jobs Available Today';
    completedDescription.textContent = 'There are no jobs posted for today. Please check back later!';
}

function showAllCompletedMessage() {
    tasksGrid.style.display = 'none';
    completedState.classList.add('active');
    
    const completedIcon = completedState.querySelector('.completed-icon');
    const completedTitle = completedState.querySelector('.completed-title');
    const completedDescription = completedState.querySelector('.completed-description');
    
    completedIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    completedTitle.textContent = 'All Jobs Completed!';
    completedDescription.textContent = "You've completed all available jobs for today. Come back tomorrow!";
}

// ========================================
// 🎨 RENDER JOBS
// ========================================
function renderJobs() {
    tasksGrid.innerHTML = '';
    
    if (dailyJobs.length === 0) {
        showNoJobsMessage();
        return;
    }
    
    // ✅ Check dailyTasks field only
    const availableJobs = dailyJobs.filter(job => 
        !userTasksData.dailyTasks[job.id]?.claimed
    );
    
    if (availableJobs.length === 0) {
        showAllCompletedMessage();
        return;
    }
    
    tasksGrid.style.display = 'grid';
    completedState.classList.remove('active');
    
    availableJobs.forEach((job, index) => {
        const taskData = userTasksData.dailyTasks[job.id] || {};
        const isViewed = taskData.viewed || false;
        const hasReturned = taskData.returned || false;
        
        const iconClass = getIconForType(job.type);
        const typeClass = job.type ? job.type.toLowerCase() : 'default';
        
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.style.animationDelay = `${index * 0.1}s`;
        
        let actionButtons = '';
        
        if (!isViewed) {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewJob('${job.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
            `;
        } else if (!hasReturned) {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewJob('${job.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
                <div style="color: var(--text-light); font-size: 12px; text-align: center; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> Come back after viewing to claim
                </div>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewJob('${job.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
                <button class="btn btn-primary" onclick="claimReward('${job.id}')">
                    <i class="fas fa-gift"></i>
                    <span class="btn-text">Claim Reward</span>
                </button>
            `;
        }
        
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-icon ${typeClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="task-info">
                    <h3 class="task-title">${job.title}</h3>
                    <div class="task-reward">
                        <i class="fas fa-coins"></i>
                        ₦${job.amount}
                    </div>
                </div>
            </div>
            <p class="task-description">${job.description}</p>
            <div class="task-actions">
                ${actionButtons}
            </div>
        `;
        
        tasksGrid.appendChild(taskCard);
    });
}

// ========================================
// 🔥 VIEW JOB (UPDATE USER FIELD!)
// ========================================
window.viewJob = async function(jobId) {
    try {
        const job = dailyJobs.find(j => j.id === jobId);
        if (!job) {
            showToast('error', 'Error', 'Job not found');
            return;
        }
        
        window.open(job.link, '_blank');
        
        // ✅ Update user document field
        const updateData = {};
        updateData[`dailyTasks.${jobId}`] = {
            viewed: true,
            viewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            returned: false,
            claimed: false
        };
        
        await db.collection('users').doc(currentUser.uid).update(updateData);
        
        // Update local cache
        if (!userTasksData.dailyTasks[jobId]) {
            userTasksData.dailyTasks[jobId] = {};
        }
        userTasksData.dailyTasks[jobId].viewed = true;
        userTasksData.dailyTasks[jobId].viewedAt = new Date();
        
        setCache('userData', userTasksData);
        console.log('✅ Job viewed - 1 field update only!');
        
    } catch (error) {
        console.error("❌ Error viewing job:", error);
        showToast('error', 'Error', 'Failed to mark job as viewed');
    }
};

// ========================================
// 🔥 WINDOW FOCUS (UPDATE USER FIELD!)
// ========================================
window.addEventListener('focus', async function() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users')
            .doc(currentUser.uid)
            .get();
        
        if (!userDoc.exists) return;
        
        const dailyTasks = userDoc.data().dailyTasks || {};
        const updates = {};
        let hasNewReturns = false;
        
        for (const jobId in dailyTasks) {
            if (dailyTasks[jobId].viewed && 
                !dailyTasks[jobId].returned && 
                !dailyTasks[jobId].claimed) {
                
                updates[`dailyTasks.${jobId}.returned`] = true;
                updates[`dailyTasks.${jobId}.returnedAt`] = firebase.firestore.FieldValue.serverTimestamp();
                hasNewReturns = true;
                
                // Update local cache
                if (!userTasksData.dailyTasks[jobId]) {
                    userTasksData.dailyTasks[jobId] = {};
                }
                userTasksData.dailyTasks[jobId].returned = true;
                userTasksData.dailyTasks[jobId].returnedAt = new Date();
            }
        }
        
        if (hasNewReturns) {
            // ✅ ONE UPDATE for all returns
            await db.collection('users').doc(currentUser.uid).update(updates);
            
            setCache('userData', userTasksData);
            renderJobs();
            
            showToast('success', 'Welcome Back!', 'You can now claim your rewards!');
        }
        
    } catch (error) {
        console.error("❌ Error checking return:", error);
    }
});

// ========================================
// 🔥 CLAIM REWARD (BATCH UPDATE!)
// ========================================
window.claimReward = async function(jobId) {
    try {
        const job = dailyJobs.find(j => j.id === jobId);
        if (!job) {
            showToast('error', 'Error', 'Job not found');
            return;
        }
        
        const taskData = userTasksData.dailyTasks[jobId] || {};
        
        if (!taskData.viewed) {
            showToast('warning', 'View Job First', 'Please view the job first');
            return;
        }
        
        if (!taskData.returned) {
            showToast('warning', 'Come Back After Viewing', 'Please come back after viewing the job');
            return;
        }
        
        if (taskData.claimed) {
            showToast('warning', 'Already Claimed', 'This reward has already been claimed');
            return;
        }
        
        const claimBtn = event.target.closest('.btn');
        const taskCard = event.target.closest('.task-card');
        
        claimBtn.classList.add('loading');
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<span class="loading-spinner"></span> Claiming...';
        
        try {
            const jobDoc = await db.collection('dailyJobs').doc(jobId).get();
            
            if (!jobDoc.exists || !jobDoc.data().active) {
                throw new Error('Job not available');
            }
            
            const validatedAmount = jobDoc.data().amount;
            
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            
            const currentBonusWallet = userDoc.data().bonusWallet || 0;
            const currentBonusTotalEarned = userDoc.data().bonusTotalEarned || 0;
            
            // ✅ ONE UPDATE - Update wallet + task field together!
            await userRef.update({
                bonusWallet: currentBonusWallet + validatedAmount,
                bonusTotalEarned: currentBonusTotalEarned + validatedAmount,
                [`dailyTasks.${jobId}.claimed`]: true,
                [`dailyTasks.${jobId}.claimedAt`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`dailyTasks.${jobId}.amount`]: validatedAmount
            });
            
            // Update local cache
            userTasksData.dailyTasks[jobId].claimed = true;
            userTasksData.dailyTasks[jobId].claimedAt = new Date();
            userTasksData.dailyTasks[jobId].amount = validatedAmount;
            
            setCache('userData', userTasksData);
            
            taskCard.style.transition = 'all 0.5s ease-out';
            taskCard.style.transform = 'scale(0.8)';
            taskCard.style.opacity = '0';
            
            showToast('success', 'Reward Claimed!', `₦${validatedAmount} added to your bonus wallet`);
            
            setTimeout(() => {
                renderJobs();
            }, 500);
            
        } catch (error) {
            console.error("❌ Error claiming:", error);
            showToast('error', 'Claim Failed', error.message || 'Failed to claim reward');
            
            claimBtn.classList.remove('loading');
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i><span class="btn-text">Claim Reward</span>';
        }
        
    } catch (error) {
        console.error("❌ Error in claimReward:", error);
        showToast('error', 'Error', 'An unexpected error occurred');
    }
};

window.checkForNewTasks = async function() {
    showToast('info', 'Refreshing', 'Loading...');
    clearCache();
    await fetchDailyJobs(true);
    await fetchUserData(true);
    renderJobs();
    showToast('success', 'Refreshed!', 'Updated');
};

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

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.menu-dropdown');
        dropdown.classList.toggle('active');
    });
});

async function initDailyJobs() {
    try {
        console.log("🚀 Initializing Daily Jobs...");
        
        await checkAuth();
        setupEventListeners();
        
        await fetchDailyJobs();
        await fetchUserData();
        
        renderJobs();
        
        if (dailyJobs.length > 0) {
            setTimeout(() => {
                showToast('info', 'Daily Jobs', 'Complete jobs to earn rewards!');
            }, 1000);
        }
        
        console.log("✅ Using user document fields - No extra documents!");
        
    } catch (error) {
        console.error("❌ Init failed:", error);
        showToast('error', 'Error', 'Failed to load');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyJobs);
} else {
    initDailyJobs();
}