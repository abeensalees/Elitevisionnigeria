// ================================================
// FIREBASE CONFIGURATION
// ================================================
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ================================================
// AUTHENTICATION & USER DATA
// ================================================
let currentUser = null;
let userDocId = null;
let spinSettings = null;

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        showToast('error', 'Access Denied', 'Please login to play', 2000);
        setTimeout(() => {
            window.location.replace('/sign-in');
        }, 2000);
        return;
    }

    currentUser = user;
    
    try {
        // Get user document
        const userQuery = await db.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();
        
        if (!userQuery.empty) {
            userDocId = userQuery.docs[0].id;
            await initGame();
        } else {
            showToast('error', 'User Not Found', 'User profile not found', 3000);
            setTimeout(() => {
                window.location.replace('/sign-in');
            }, 3000);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        showToast('error', 'Error', 'Failed to load user data', 3000);
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


// ================================================
// DOM ELEMENTS
// ================================================
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spinButton');
const spinsRemaining = document.getElementById('spinsRemaining');
const nextSpinTimer = document.getElementById('nextSpinTimer');
const rewardsGrid = document.getElementById('rewardsGrid');
const historyTableBody = document.getElementById('historyTableBody');
const emptyState = document.getElementById('emptyState');
const resultModal = document.getElementById('resultModal');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultReward = document.getElementById('resultReward');
const resultMessage = document.getElementById('resultMessage');
const collectBtn = document.getElementById('collectBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const toastContainer = document.getElementById('toastContainer');

// ================================================
// GAME DATA
// ================================================
let rewards = [];
let userSpinData = {
    spinsRemaining: 0,
    lastSpinDate: null
};

// ================================================
// INITIALIZE GAME
// ================================================
async function initGame() {
    try {
        // Fetch spin settings from Firestore
        const settingsDoc = await db.collection('settings').doc('spinGame').get();
        
        if (!settingsDoc.exists) {
            showToast('error', 'Configuration Error', 'Spin game settings not found', 4000);
            return;
        }
        
        spinSettings = settingsDoc.data();
        
        // Generate rewards from settings
        generateRewards();
        
        // Fetch user spin data
        await fetchUserSpinData();
        
        // Create wheel and UI
        createWheel();
        createRewardsGrid();
        updateUI();
        
        // Fetch spin history
        await fetchSpinHistory();
        
        // Check spin availability
        checkSpinAvailability();
        
    } catch (error) {
        console.error('Error initializing game:', error);
        showToast('error', 'Initialization Error', 'Failed to load game', 4000);
    }
}

// ================================================
// GENERATE REWARDS FROM SETTINGS
// ================================================
function generateRewards() {
    const totalReward = spinSettings.totalReward || 1000;
    const dailySpins = spinSettings.dailySpins || 3;
    
    // Define reward distribution percentages
    const distributions = [
        { percentage: 30, type: 'money', icon: 'fa-money-bill-wave', color: '#10B981' },
        { percentage: 20, type: 'money', icon: 'fa-money-bill-wave', color: '#34D399' },
        { percentage: 15, type: 'money', icon: 'fa-money-bill-wave', color: '#047857' },
        { percentage: 10, type: 'money', icon: 'fa-money-bill-wave', color: '#F59E0B' },
        { percentage: 10, type: 'money', icon: 'fa-money-bill-wave', color: '#EF4444' },
        { percentage: 10, type: 'freeSpin', name: 'Free Spin', icon: 'fa-sync-alt', color: '#8B5CF6' },
        { percentage: 3, type: 'money', icon: 'fa-money-bill-wave', color: '#3B82F6' },
        { percentage: 2, type: 'betterLuck', name: 'Better Luck', icon: 'fa-smile', color: '#64748B' }
    ];
    
    rewards = distributions.map((dist, index) => {
        if (dist.type === 'money') {
            // Calculate amount based on percentage
            const amount = Math.round((dist.percentage / 100) * totalReward);
            return {
                id: index + 1,
                name: `₦${amount}`,
                value: amount,
                probability: dist.percentage,
                color: dist.color,
                icon: dist.icon,
                type: 'money'
            };
        } else if (dist.type === 'freeSpin') {
            return {
                id: index + 1,
                name: dist.name,
                value: 0,
                probability: dist.percentage,
                color: dist.color,
                icon: dist.icon,
                type: 'freeSpin'
            };
        } else {
            return {
                id: index + 1,
                name: dist.name,
                value: 0,
                probability: dist.percentage,
                color: dist.color,
                icon: dist.icon,
                type: 'betterLuck'
            };
        }
    });
}

// ================================================
// FETCH USER SPIN DATA
// ================================================
async function fetchUserSpinData() {
    try {
        const userDoc = await db.collection('users').doc(userDocId).get();
        const userData = userDoc.data();
        
        // Initialize spin data if not exists
        if (!userData.spinData) {
            userSpinData = {
                spinsRemaining: spinSettings.dailySpins || 3,
                lastSpinDate: null
            };
            
            await db.collection('users').doc(userDocId).update({
                spinData: userSpinData
            });
        } else {
            userSpinData = userData.spinData;
        }
        
    } catch (error) {
        console.error('Error fetching user spin data:', error);
        showToast('error', 'Error', 'Failed to load spin data', 3000);
    }
}

// ================================================
// CREATE WHEEL
// ================================================
function createWheel() {
    wheel.innerHTML = '';
    const totalSections = rewards.length;
    const anglePerSection = 360 / totalSections;
    
    rewards.forEach((reward, index) => {
        const section = document.createElement('div');
        section.className = 'wheel-section';
        section.style.transform = `rotate(${index * anglePerSection}deg) skewY(${90 - anglePerSection}deg)`;
        section.style.background = reward.color;
        
        const textContainer = document.createElement('div');
        textContainer.className = 'text';
        textContainer.textContent = reward.name;
        
        section.appendChild(textContainer);
        wheel.appendChild(section);
    });
}

// ================================================
// CREATE REWARDS GRID
// ================================================
function createRewardsGrid() {
    rewardsGrid.innerHTML = '';
    
    rewards.forEach(reward => {
        const card = document.createElement('div');
        card.className = 'reward-card';
        
        const rewardDisplayName = reward.type === 'money' ? `₦${reward.value}` : reward.name;
        
        card.innerHTML = `
            <div class="reward-icon" style="color: ${reward.color}">
                <i class="fas ${reward.icon}"></i>
            </div>
            <div class="reward-name">${rewardDisplayName}</div>
            <div class="reward-probability">${reward.probability}% chance</div>
        `;
        
        rewardsGrid.appendChild(card);
    });
}

// ================================================
// UPDATE UI
// ================================================
function updateUI() {
    spinsRemaining.textContent = `Spins remaining today: ${userSpinData.spinsRemaining}`;
    spinButton.disabled = userSpinData.spinsRemaining <= 0;
    
    if (userSpinData.spinsRemaining <= 0) {
        spinButton.innerHTML = '<i class="fas fa-clock"></i><span class="btn-text">NO SPINS LEFT</span>';
    } else {
        spinButton.innerHTML = '<i class="fas fa-sync-alt"></i><span class="btn-text">SPIN NOW</span>';
    }
}

// ================================================
// CHECK SPIN AVAILABILITY
// ================================================
function checkSpinAvailability() {
    const now = new Date();
    const lastSpinDate = userSpinData.lastSpinDate ? new Date(userSpinData.lastSpinDate.toDate()) : null;
    
    // If it's a new day, reset spins
    if (lastSpinDate && (
        now.getDate() !== lastSpinDate.getDate() ||
        now.getMonth() !== lastSpinDate.getMonth() ||
        now.getFullYear() !== lastSpinDate.getFullYear()
    )) {
        resetDailySpins();
    }
    
    updateNextSpinTimer();
}

// ================================================
// RESET DAILY SPINS
// ================================================
async function resetDailySpins() {
    try {
        userSpinData.spinsRemaining = spinSettings.dailySpins || 3;
        
        await db.collection('users').doc(userDocId).update({
            'spinData.spinsRemaining': userSpinData.spinsRemaining
        });
        
        updateUI();
        showToast('success', 'Daily Spins Reset!', 'Your daily free spins have been refreshed. Good luck!', 5000);
    } catch (error) {
        console.error('Error resetting spins:', error);
    }
}

// ================================================
// UPDATE NEXT SPIN TIMER
// ================================================
function updateNextSpinTimer() {
    if (userSpinData.spinsRemaining > 0) {
        nextSpinTimer.textContent = "Next free spin: Available now";
        return;
    }
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeDiff = tomorrow - now;
    
    if (timeDiff <= 0) {
        resetDailySpins();
        return;
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    nextSpinTimer.textContent = `Next free spin in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    requestAnimationFrame(updateNextSpinTimer);
}

// ================================================
// SPIN WHEEL
// ================================================
async function spinWheel() {
    if (userSpinData.spinsRemaining <= 0) {
        showToast('error', 'No Spins Left', 'You have no spins remaining today. Come back tomorrow!', 4000);
        return;
    }
    
    spinButton.classList.add('loading');
    spinButton.disabled = true;
    
    // Calculate random reward based on probability
    const randomValue = Math.random() * 100;
    let cumulativeProbability = 0;
    let selectedReward = null;
    
    for (const reward of rewards) {
        cumulativeProbability += reward.probability;
        if (randomValue <= cumulativeProbability) {
            selectedReward = reward;
            break;
        }
    }
    
    // Calculate spin angle
    const totalSections = rewards.length;
    const anglePerSection = 360 / totalSections;
    const rewardIndex = rewards.findIndex(r => r.id === selectedReward.id);
    const baseRotation = 360 * 5;
    const targetRotation = baseRotation + (totalSections - rewardIndex) * anglePerSection - (anglePerSection / 2);
    
    wheel.style.transition = 'transform 6s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    
    setTimeout(async () => {
        wheel.style.transition = 'none';
        spinButton.classList.remove('loading');
        
        // Process reward
        await processReward(selectedReward);
        
    }, 6000);
}


// ================================================
// PROCESS REWARD (GYARARRE)
// ================================================
async function processReward(selectedReward) {
    try {
        const transactionId = `SPIN-${Date.now()}-${Math.floor(Math.random() * 999)}`;
        userSpinData.spinsRemaining--;
        userSpinData.lastSpinDate = firebase.firestore.Timestamp.now();
        
        let amountWon = 0;
        let rewardType = selectedReward.type;
        
        // Update Firebase don Wallet kawai (Ba History ba)
        const updateData = {
            'spinData.spinsRemaining': userSpinData.spinsRemaining,
            'spinData.lastSpinDate': userSpinData.lastSpinDate
        };

        if (rewardType === 'money') {
            amountWon = selectedReward.value;
            updateData.taskWallet = firebase.firestore.FieldValue.increment(amountWon);
            updateData.totalTaskEarned = firebase.firestore.FieldValue.increment(amountWon);
        } else if (rewardType === 'freeSpin') {
            userSpinData.spinsRemaining++;
            updateData['spinData.spinsRemaining'] = userSpinData.spinsRemaining;
        }

        await db.collection('users').doc(userDocId).update(updateData);
        
        // ✅ ADANA A LOCAL STORAGE (Maimakon Firebase History)
        saveSpinToLocal({
            reward: selectedReward.name,
            rewardType: rewardType,
            amountWon: amountWon,
            transactionId: rewardType === 'money' ? transactionId : null,
            status: rewardType === 'betterLuck' ? 'No Win' : rewardType === 'freeSpin' ? 'Used (Free Spin)' : 'Collected',
            timestamp: new Date().toISOString()
        });
        
        updateUI();
        fetchSpinHistory(); // Zai dauko daga LocalStorage yanzu
        showResultModal(selectedReward, amountWon);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', 'Failed to process reward', 4000);
    }
}

// ================================================
// HELPER: SAVE TO LOCAL STORAGE
// ================================================
function saveSpinToLocal(data) {
    // Kowane user yana da nasa history din ta hanyar amfani da ID dinsa
    const storageKey = `spinHistory_${userDocId}`;
    let history = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // Sanya sabon a farko (Unshift)
    history.unshift(data);
    
    // Mu rage yawansu zuwa 50 kadai domin gudun nauyi
    if (history.length > 50) history = history.slice(0, 50);
    
    localStorage.setItem(storageKey, JSON.stringify(history));
}

// ================================================
// FETCH SPIN HISTORY (DAUKO DAGA LOCAL STORAGE)
// ================================================
async function fetchSpinHistory() {
    const storageKey = `spinHistory_${userDocId}`;
    const history = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    historyTableBody.innerHTML = '';
    
    if (history.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    history.forEach((data, index) => {
        const row = document.createElement('tr');
        
        // Gyara lokaci tunda a String yake yanzu
        const date = new Date(data.timestamp).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        
        const amountDisplay = data.amountWon > 0 ? `₦${data.amountWon.toLocaleString()}` : '-';
        const transactionDisplay = data.transactionId || '-';
        
        let statusClass = 'approved';
        if (data.status === 'No Win') statusClass = 'failed';
        if (data.status === 'Used (Free Spin)') statusClass = 'pending';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${date}</td>
            <td>${data.reward}</td>
            <td>${amountDisplay}</td>
            <td>${transactionDisplay}</td>
            <td><span class="status-badge ${statusClass}">${data.status}</span></td>
        `;
        
        historyTableBody.appendChild(row);
    });
}






/*/ ================================================
// PROCESS REWARD
// ================================================
async function processReward(selectedReward) {
    try {
        // Generate transaction ID
        const transactionId = `SPIN-${Date.now()}-${Math.floor(Math.random() * 999)}`;
        
        // Update spins remaining
        userSpinData.spinsRemaining--;
        userSpinData.lastSpinDate = firebase.firestore.Timestamp.now();
        
        let amountWon = 0;
        let rewardType = selectedReward.type;
        
        // Handle different reward types
        if (rewardType === 'money') {
            amountWon = selectedReward.value;
            
            // Update user wallet and earnings (correct field structure)
            await db.collection('users').doc(userDocId).update({
                'spinData.spinsRemaining': userSpinData.spinsRemaining,
                'spinData.lastSpinDate': userSpinData.lastSpinDate,
                taskWallet: firebase.firestore.FieldValue.increment(amountWon),
                totalTaskEarned: firebase.firestore.FieldValue.increment(amountWon)
            });
            
        } else if (rewardType === 'freeSpin') {
            // Add free spin
            userSpinData.spinsRemaining++;
            
            await db.collection('users').doc(userDocId).update({
                'spinData.spinsRemaining': userSpinData.spinsRemaining,
                'spinData.lastSpinDate': userSpinData.lastSpinDate
            });
            
        } else {
            // Better luck - just update spin count
            await db.collection('users').doc(userDocId).update({
                'spinData.spinsRemaining': userSpinData.spinsRemaining,
                'spinData.lastSpinDate': userSpinData.lastSpinDate
            });
        }
        
        // Save spin history
        await db.collection('spinHistory').add({
            userId: userDocId,
            userEmail: currentUser.email,
            reward: selectedReward.name,
            rewardType: rewardType,
            amountWon: amountWon,
            transactionId: rewardType === 'money' ? transactionId : null,
            status: rewardType === 'betterLuck' ? 'No Win' : rewardType === 'freeSpin' ? 'Used (Free Spin)' : 'Collected',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update UI
        updateUI();
        await fetchSpinHistory();
        
        // Show result modal
        showResultModal(selectedReward, amountWon);
        
    } catch (error) {
        console.error('Error processing reward:', error);
        showToast('error', 'Error', 'Failed to process reward. Please contact support.', 4000);
        
        // Restore spin
        userSpinData.spinsRemaining++;
        updateUI();
    }
}

// ================================================
// FETCH SPIN HISTORY
// ================================================
async function fetchSpinHistory() {
    try {
        // Fetch without orderBy to avoid index requirement
        const historyQuery = await db.collection('spinHistory')
            .where('userId', '==', userDocId)
            .get();
        
        // Sort manually by timestamp (client-side)
        const historyDocs = historyQuery.docs.sort((a, b) => {
            const timeA = a.data().timestamp ? a.data().timestamp.toMillis() : 0;
            const timeB = b.data().timestamp ? b.data().timestamp.toMillis() : 0;
            return timeB - timeA; // Descending order (newest first)
        }).slice(0, 50); // Limit to 50
        
        historyTableBody.innerHTML = '';
        
        if (historyDocs.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        historyDocs.forEach((doc, index) => {
            const data = doc.data();
            const row = document.createElement('tr');
            
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }) : 'N/A';
            
            const amountDisplay = data.amountWon > 0 ? `₦${data.amountWon.toLocaleString()}` : '-';
            const transactionDisplay = data.transactionId || '-';
            
            let statusClass = 'approved';
            if (data.status === 'No Win') statusClass = 'failed';
            if (data.status === 'Used (Free Spin)') statusClass = 'pending';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${date}</td>
                <td>${data.reward}</td>
                <td>${amountDisplay}</td>
                <td>${transactionDisplay}</td>
                <td><span class="status-badge ${statusClass}">${data.status}</span></td>
            `;
            
            historyTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error fetching history:', error);
        showToast('error', 'Error', 'Failed to load spin history', 3000);
    }
}*/

// ================================================
// SHOW RESULT MODAL
// ================================================
function showResultModal(reward, amountWon) {
    if (reward.type === 'money') {
        resultIcon.innerHTML = `<i class="fas ${reward.icon}" style="color: ${reward.color}"></i>`;
        resultTitle.textContent = 'Congratulations!';
        resultReward.textContent = `You won ₦${amountWon.toLocaleString()}!`;
        resultMessage.textContent = 'Your reward has been added to your task wallet.';
    } else if (reward.type === 'freeSpin') {
        resultIcon.innerHTML = '<i class="fas fa-sync-alt" style="color: #8B5CF6"></i>';
        resultTitle.textContent = 'Free Spin!';
        resultReward.textContent = 'You won an extra spin!';
        resultMessage.textContent = 'You can use this spin immediately.';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-smile-wink" style="color: #64748B"></i>';
        resultTitle.textContent = 'Better Luck Next Time!';
        resultReward.textContent = 'No reward this time';
        resultMessage.textContent = 'Keep spinning for a chance to win amazing rewards!';
    }
    
    resultModal.classList.add('active');
}

// ================================================
// CLOSE RESULT MODAL
// ================================================
function closeResultModal() {
    resultModal.classList.remove('active');
}

// ================================================
// TOAST NOTIFICATION
// ================================================
function showToast(type, title, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-times-circle';
    else if (type === 'warning') icon = 'fa-exclamation-triangle';
    
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
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }, duration);
    
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.transitionDuration = `${duration}ms`;
    progressBar.style.transform = 'scaleX(0)';
    setTimeout(() => progressBar.style.transform = 'scaleX(1)', 100);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoRemove);
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    });
    
    return toast;
}

// ================================================
// UI INTERACTIONS
// ================================================
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

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').classList.remove('fa-moon');
    darkModeToggle.querySelector('i').classList.add('fa-sun');
}

spinButton.addEventListener('click', spinWheel);
collectBtn.addEventListener('click', closeResultModal);
closeModalBtn.addEventListener('click', closeResultModal);