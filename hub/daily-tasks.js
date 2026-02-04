// ========================================
// 🔥 OPTIMIZED DAILY TASKS - USER FIELDS!
// ========================================

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
    tasks: { data: null, timestamp: 0 },
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
    console.log(`✅ Cached ${cacheKey}`);
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

let currentUser = null;
let dailyTasks = [];
let userDailyTasks = {}; // From user document field

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
// 🚀 FETCH DAILY TASKS
// ========================================
async function fetchDailyTasks(forceRefresh = false) {
    try {
        console.log("📊 Fetching tasks...");
        
        if (!forceRefresh && isCacheValid('tasks')) {
            const cachedData = getCache('tasks');
            dailyTasks = cachedData.tasks;
            console.log(`✅ Loaded ${dailyTasks.length} tasks from cache`);
            return dailyTasks;
        }
        
        const tasksSnapshot = await db.collection('dailyTasks')
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

        dailyTasks = [];

        if (now < displayWindowStart || now > displayWindowEnd) {
            console.log("⏰ Outside display window");
            setCache('tasks', { tasks: [] });
            return [];
        }

        tasksSnapshot.forEach(doc => {
            const data = doc.data();
            
            if (data.datePosted) {
                const taskTimestamp = getTimestamp(data.datePosted);
                const taskDate = new Date(taskTimestamp);
                
                if (taskDate >= todayStart && taskDate <= todayEnd) {
                    dailyTasks.push({
                        id: doc.id,
                        ...data,
                        _timestamp: taskTimestamp
                    });
                }
            }
        });
        
        setCache('tasks', { tasks: dailyTasks });
        console.log(`✅ Loaded ${dailyTasks.length} tasks from Firebase`);
        return dailyTasks;
        
    } catch (error) {
        console.error("❌ Error fetching tasks:", error);
        showToast('error', 'Error', 'Failed to load tasks');
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
            userDailyTasks = getCache('userData');
            console.log('✅ Loaded user data from cache');
            return userDailyTasks;
        }
        
        // ✅ ONE READ - Get user document with dailyTasks field
        const userDoc = await db.collection('users')
            .doc(currentUser.uid)
            .get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            userDailyTasks = data.dailyTasks || {};
            
            console.log('✅ Loaded user data from Firebase');
        } else {
            userDailyTasks = {};
            console.log('📭 No user data found');
        }
        
        setCache('userData', userDailyTasks);
        return userDailyTasks;
        
    } catch (error) {
        console.error("❌ Error fetching user data:", error);
        userDailyTasks = {};
        return {};
    }
}

function getIconForType(type) {
    const normalizedType = type ? type.toLowerCase() : '';
    return PLATFORM_ICONS[normalizedType] || 'fas fa-tasks';
}

function showNoTasksMessage() {
    tasksGrid.style.display = 'none';
    completedState.classList.add('active');
    
    const completedIcon = completedState.querySelector('.completed-icon');
    const completedTitle = completedState.querySelector('.completed-title');
    const completedDescription = completedState.querySelector('.completed-description');
    
    completedIcon.innerHTML = '<i class="fas fa-calendar-times"></i>';
    completedTitle.textContent = 'No Tasks Available Today';
    completedDescription.textContent = 'There are no tasks posted for today. Please check back later!';
}

function showAllCompletedMessage() {
    tasksGrid.style.display = 'none';
    completedState.classList.add('active');
    
    const completedIcon = completedState.querySelector('.completed-icon');
    const completedTitle = completedState.querySelector('.completed-title');
    const completedDescription = completedState.querySelector('.completed-description');
    
    completedIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    completedTitle.textContent = 'All Tasks Completed!';
    completedDescription.textContent = "You've completed all available tasks for today. Come back tomorrow!";
}

// ========================================
// 🎨 RENDER TASKS
// ========================================
function renderTasks() {
    tasksGrid.innerHTML = '';
    
    if (dailyTasks.length === 0) {
        showNoTasksMessage();
        return;
    }
    
    // ✅ Check dailyTasks field only
    const availableTasks = dailyTasks.filter(task => 
        !userDailyTasks[task.id]?.claimed
    );
    
    if (availableTasks.length === 0) {
        showAllCompletedMessage();
        return;
    }
    
    tasksGrid.style.display = 'grid';
    completedState.classList.remove('active');
    
    availableTasks.forEach((task, index) => {
        const taskData = userDailyTasks[task.id] || {};
        const isViewed = taskData.viewed || false;
        const hasReturned = taskData.returned || false;
        
        const iconClass = getIconForType(task.type);
        const typeClass = task.type ? task.type.toLowerCase() : 'default';
        
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.style.animationDelay = `${index * 0.1}s`;
        
        let actionButtons = '';
        
        if (!isViewed) {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewTask('${task.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
            `;
        } else if (!hasReturned) {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewTask('${task.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
                <div style="color: var(--text-light); font-size: 12px; text-align: center; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> Come back after viewing to claim
                </div>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-secondary" onclick="viewTask('${task.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    <span class="btn-text">View Task</span>
                </button>
                <button class="btn btn-primary" onclick="claimReward('${task.id}')">
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
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-reward">
                        <i class="fas fa-coins"></i>
                        ₦${task.amount}
                    </div>
                </div>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-actions">
                ${actionButtons}
            </div>
        `;
        
        tasksGrid.appendChild(taskCard);
    });
}

// ========================================
// 🔥 VIEW TASK (UPDATE USER FIELD!)
// ========================================
window.viewTask = async function(taskId) {
    try {
        const task = dailyTasks.find(t => t.id === taskId);
        if (!task) {
            showToast('error', 'Error', 'Task not found');
            return;
        }
        
        window.open(task.link, '_blank');
        
        // ✅ Update user document field
        const updateData = {};
        updateData[`dailyTasks.${taskId}`] = {
            viewed: true,
            viewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            returned: false,
            claimed: false
        };
        
        await db.collection('users').doc(currentUser.uid).update(updateData);
        
        // Update local cache
        if (!userDailyTasks[taskId]) {
            userDailyTasks[taskId] = {};
        }
        userDailyTasks[taskId].viewed = true;
        userDailyTasks[taskId].viewedAt = new Date();
        
        setCache('userData', userDailyTasks);
        console.log('✅ Task viewed - 1 field update!');
        
    } catch (error) {
        console.error("❌ Error viewing task:", error);
        showToast('error', 'Error', 'Failed to mark task as viewed');
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
        
        const dailyTasksData = userDoc.data().dailyTasks || {};
        const updates = {};
        let hasNewReturns = false;
        
        for (const taskId in dailyTasksData) {
            if (dailyTasksData[taskId].viewed && 
                !dailyTasksData[taskId].returned && 
                !dailyTasksData[taskId].claimed) {
                
                updates[`dailyTasks.${taskId}.returned`] = true;
                updates[`dailyTasks.${taskId}.returnedAt`] = firebase.firestore.FieldValue.serverTimestamp();
                hasNewReturns = true;
                
                // Update local cache
                if (!userDailyTasks[taskId]) {
                    userDailyTasks[taskId] = {};
                }
                userDailyTasks[taskId].returned = true;
                userDailyTasks[taskId].returnedAt = new Date();
            }
        }
        
        if (hasNewReturns) {
            // ✅ ONE UPDATE for all returns
            await db.collection('users').doc(currentUser.uid).update(updates);
            
            setCache('userData', userDailyTasks);
            renderTasks();
            
            showToast('success', 'Welcome Back!', 'You can now claim your rewards!');
        }
        
    } catch (error) {
        console.error("❌ Error checking return:", error);
    }
});

// ========================================
// 🔥 CLAIM REWARD (BATCH UPDATE!)
// ========================================
window.claimReward = async function(taskId) {
    try {
        const task = dailyTasks.find(t => t.id === taskId);
        if (!task) {
            showToast('error', 'Error', 'Task not found');
            return;
        }
        
        const taskData = userDailyTasks[taskId] || {};
        
        if (!taskData.viewed) {
            showToast('warning', 'View Task First', 'Please view the task first');
            return;
        }
        
        if (!taskData.returned) {
            showToast('warning', 'Come Back After Viewing', 'Please come back after viewing the task');
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
            const taskDoc = await db.collection('dailyTasks').doc(taskId).get();
            
            if (!taskDoc.exists || !taskDoc.data().active) {
                throw new Error('Task not available');
            }
            
            const validatedAmount = taskDoc.data().amount;
            
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            
            const currentTaskWallet = userDoc.data().taskWallet || 0;
            const currentTaskTotalEarned = userDoc.data().taskTotalEarned || 0;
            
            // ✅ ONE UPDATE - Update wallet + task field together!
            await userRef.update({
                taskWallet: currentTaskWallet + validatedAmount,
                taskTotalEarned: currentTaskTotalEarned + validatedAmount,
                [`dailyTasks.${taskId}.claimed`]: true,
                [`dailyTasks.${taskId}.claimedAt`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`dailyTasks.${taskId}.amount`]: validatedAmount
            });
            
            // Update local cache
            userDailyTasks[taskId].claimed = true;
            userDailyTasks[taskId].claimedAt = new Date();
            userDailyTasks[taskId].amount = validatedAmount;
            
            setCache('userData', userDailyTasks);
            
            taskCard.style.transition = 'all 0.5s ease-out';
            taskCard.style.transform = 'scale(0.8)';
            taskCard.style.opacity = '0';
            
            showToast('success', 'Reward Claimed!', `₦${validatedAmount} added to your task wallet`);
            
            setTimeout(() => {
                renderTasks();
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
    await fetchDailyTasks(true);
    await fetchUserData(true);
    renderTasks();
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

async function initDailyTasks() {
    try {
        console.log("🚀 Initializing Daily Tasks...");
        
        await checkAuth();
        setupEventListeners();
        
        await fetchDailyTasks();
        await fetchUserData();
        
        renderTasks();
        
        if (dailyTasks.length > 0) {
            setTimeout(() => {
                showToast('info', 'Daily Tasks', 'Complete tasks to earn rewards!');
            }, 1000);
        }
        
        console.log("✅ Using user document fields - No extra documents!");
        
    } catch (error) {
        console.error("❌ Init failed:", error);
        showToast('error', 'Error', 'Failed to load');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyTasks);
} else {
    initDailyTasks();
}