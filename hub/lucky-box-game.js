// ================================================
// FIREBASE CONFIGURATION
// ================================================
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ================================================
// DOM ELEMENTS
// ================================================
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const toastContainer = document.getElementById('toastContainer');

const prizeAmountEl = document.getElementById('prizeAmount');
const attemptsLeftEl = document.getElementById('attemptsLeft');
const statusTextEl = document.getElementById('statusText');
const playButton = document.getElementById('playButton');
const gameStatusEl = document.getElementById('gameStatus');

const sidebarProfileImg = document.getElementById('sidebarProfileImg');
const sidebarProfileName = document.getElementById('sidebarProfileName');
const sidebarProfileRole = document.getElementById('sidebarProfileRole');

const boxesContainer = document.getElementById('boxesContainer');
const targetNumberEl = document.getElementById('targetNumber');
const gameResultEl = document.getElementById('gameResult');

// ================================================
// CURRENT USER DATA
// ================================================
let currentUser = null;
let userDocId = null;
let gameSettings = null;
let userGameData = null;
let currentGameState = {
    boxes: [],
    targetNumber: null,
    isPlaying: false,
    hasClicked: false
};

// ================================================
// 💾 LOCAL STORAGE HISTORY FUNCTIONS
// ================================================
function saveGameHistory(gameData) {
    try {
        const historyKey = `luckyBoxHistory_${userDocId}`;
        let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // Add new game
        history.unshift({
            ...gameData,
            timestamp: Date.now()
        });
        
        // Keep only last 50 games
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        console.log('✅ Game history saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving history:', error);
    }
}

function getGameHistory() {
    try {
        const historyKey = `luckyBoxHistory_${userDocId}`;
        return JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch (error) {
        console.error('❌ Error loading history:', error);
        return [];
    }
}

// ================================================
// AUTHENTICATION CHECK
// ================================================
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
        const userQuery = await db.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();
        
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            userDocId = userDoc.id;
            const userData = userDoc.data();
            
            if (userData.profilePic) {
                sidebarProfileImg.src = userData.profilePic;
            }
            if (userData.fullName) {
                sidebarProfileName.textContent = userData.fullName;
            }
            if (userData.username) {
                sidebarProfileRole.textContent = `${userData.username}`;
            }
            
            await loadGameSettings();
            await loadUserGameData();
            updateUI();
        } else {
            showToast('error', 'User Not Found', 'User profile not found', 3000);
            setTimeout(() => {
                window.location.href = '/sign-in';
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', 'Failed to load user data', 3000);
    }
});

// ========================================
// LOGOUT FUNCTION
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

document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

// ================================================
// LOAD GAME SETTINGS
// ================================================
async function loadGameSettings() {
    try {
        const settingsDoc = await db.collection('settings').doc('luckyBoxGame').get();
        
        if (!settingsDoc.exists) {
            showToast('error', 'Configuration Error', 'Game settings not found', 4000);
            return;
        }
        
        gameSettings = settingsDoc.data();
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('error', 'Error', 'Failed to load game settings', 3000);
    }
}

// ================================================
// LOAD USER GAME DATA
// ================================================
async function loadUserGameData() {
    try {
        const userDoc = await db.collection('users').doc(userDocId).get();
        const userData = userDoc.data();
        
        if (!userData.luckyBoxData) {
            userGameData = {
                attemptsLeft: gameSettings.attempts || 2,
                lastPlayedDate: null,
                hasWonToday: false
            };
            
            await db.collection('users').doc(userDocId).update({
                luckyBoxData: userGameData
            });
        } else {
            userGameData = userData.luckyBoxData;
            await checkDailyReset();
        }
        
    } catch (error) {
        console.error('Error loading user game data:', error);
        showToast('error', 'Error', 'Failed to load game data', 3000);
    }
}

// ================================================
// CHECK DAILY RESET
// ================================================
async function checkDailyReset() {
    const now = new Date();
    const lastPlayedDate = userGameData.lastPlayedDate ? 
        new Date(userGameData.lastPlayedDate.toDate()) : null;
    
    if (lastPlayedDate && (
        now.getDate() !== lastPlayedDate.getDate() ||
        now.getMonth() !== lastPlayedDate.getMonth() ||
        now.getFullYear() !== lastPlayedDate.getFullYear()
    )) {
        userGameData.attemptsLeft = gameSettings.attempts || 2;
        userGameData.hasWonToday = false;
        
        await db.collection('users').doc(userDocId).update({
            'luckyBoxData.attemptsLeft': userGameData.attemptsLeft,
            'luckyBoxData.hasWonToday': false
        });
        
        showToast('success', 'Daily Reset', 'Your attempts have been reset!', 4000);
    }
}

// ================================================
// UPDATE UI
// ================================================
function updateUI() {
    if (!gameSettings || !userGameData) return;
    
    prizeAmountEl.textContent = `₦${gameSettings.prizeAmount.toLocaleString()}`;
    attemptsLeftEl.textContent = `Attempts left: ${userGameData.attemptsLeft}`;
    
    const isActive = gameSettings.active;
    const hasAttempts = userGameData.attemptsLeft > 0;
    const hasWonToday = userGameData.hasWonToday;
    
    if (!isActive) {
        statusTextEl.innerHTML = '<span style="color: var(--error-red);">Game is currently inactive</span>';
        playButton.disabled = true;
    } else if (hasWonToday) {
        statusTextEl.innerHTML = '<span style="color: var(--success);">You have already won today! Come back tomorrow.</span>';
        playButton.disabled = true;
    } else if (!hasAttempts) {
        statusTextEl.innerHTML = '<span style="color: var(--error-red);">No attempts left for today</span>';
        playButton.disabled = true;
    } else {
        statusTextEl.innerHTML = '<span style="color: var(--success);">Game is active! Good luck!</span>';
        playButton.disabled = false;
    }
}

// ================================================
// START GAME
// ================================================
function startGame() {
    if (!gameSettings.active) {
        showToast('error', 'Game Inactive', 'Game is currently inactive', 3000);
        return;
    }
    
    if (userGameData.hasWonToday) {
        showToast('error', 'Already Won', 'You have already won today', 3000);
        return;
    }
    
    if (userGameData.attemptsLeft <= 0) {
        showToast('error', 'No Attempts', 'No attempts left for today', 3000);
        return;
    }
    
    playButton.style.display = 'none';
    gameStatusEl.style.display = 'none';
    
    const boxCount = gameSettings.boxCount || 9;
    currentGameState.targetNumber = Math.floor(Math.random() * boxCount) + 1;
    currentGameState.boxes = [];
    
    for (let i = 1; i <= boxCount; i++) {
        currentGameState.boxes.push(i);
    }
    
    currentGameState.boxes.sort(() => Math.random() - 0.5);
    
    currentGameState.isPlaying = true;
    currentGameState.hasClicked = false;
    
    targetNumberEl.textContent = currentGameState.targetNumber;
    
    createBoxes();
    
    showToast('success', 'Game Started!', `Find box with number ${currentGameState.targetNumber}!`, 3000);
}

// ================================================
// CREATE BOXES
// ================================================
function createBoxes() {
    boxesContainer.innerHTML = '';
    boxesContainer.style.display = 'grid';
    
    currentGameState.boxes.forEach((number) => {
        const box = document.createElement('div');
        box.className = 'game-box';
        box.dataset.number = number;
        box.innerHTML = '<i class="fas fa-gift"></i>';
        
        box.addEventListener('click', () => selectBox(box, number));
        
        boxesContainer.appendChild(box);
    });
}

// ================================================
// SELECT BOX (NO FIREBASE HISTORY WRITES!)
// ================================================
async function selectBox(boxEl, number) {
    // ✅ Prevent double clicks
    if (!currentGameState.isPlaying || currentGameState.hasClicked) {
        return;
    }
    
    // ✅ Lock immediately
    currentGameState.hasClicked = true;
    currentGameState.isPlaying = false;
    
    // ✅ Disable all boxes immediately
    document.querySelectorAll('.game-box').forEach(box => {
        box.style.pointerEvents = 'none';
    });
    
    // ✅ Open selected box
    boxEl.classList.add('opened');
    boxEl.innerHTML = `<span style="font-size: 48px; font-weight: 700;">${number}</span>`;
    
    // ✅ Check if already won today
    if (userGameData.hasWonToday) {
        showToast('error', 'Already Won', 'You have already won today!', 3000);
        setTimeout(() => {
            resetGame();
            updateUI();
        }, 2000);
        return;
    }
    
    // Decrease attempts
    userGameData.attemptsLeft--;
    
    // Check if won
    const isWin = (number === currentGameState.targetNumber);
    
    if (isWin) {
        // ✅ WIN!
        boxEl.classList.add('win');
        const prizeAmount = gameSettings.prizeAmount;
        
        try {
            // ✅ ONLY update user wallet - NO history write!
            await db.collection('users').doc(userDocId).update({
                'luckyBoxData.attemptsLeft': userGameData.attemptsLeft,
                'luckyBoxData.hasWonToday': true,
                'luckyBoxData.lastPlayedDate': firebase.firestore.FieldValue.serverTimestamp(),
                taskWallet: firebase.firestore.FieldValue.increment(prizeAmount),
                taskTotalEarned: firebase.firestore.FieldValue.increment(prizeAmount)
            });
            
            userGameData.hasWonToday = true;
            
            // ✅ Save history to localStorage ONLY!
            saveGameHistory({
                userId: userDocId,
                userEmail: currentUser.email,
                targetNumber: currentGameState.targetNumber,
                selectedNumber: number,
                result: 'win',
                prizeWon: prizeAmount
            });
            
            gameResultEl.innerHTML = `
                <div style="color: var(--success); font-size: 28px; font-weight: 700; margin-top: 20px;">
                    🎉 CONGRATULATIONS! 🎉
                </div>
                <div style="color: var(--primary-green); font-size: 24px; font-weight: 600; margin-top: 10px;">
                    You won ₦${prizeAmount.toLocaleString()}!
                </div>
            `;
            
            showToast('success', 'YOU WON! 🎉', 
                `Congratulations! ₦${prizeAmount.toLocaleString()} added to your wallet!`, 5000);
            
        } catch (error) {
            console.error('Error processing win:', error);
            showToast('error', 'Error', 'Failed to process reward', 4000);
        }
        
    } else {
        // ✅ LOSE
        boxEl.classList.add('lose');
        
        try {
            // ✅ ONLY update attempts - NO history write!
            await db.collection('users').doc(userDocId).update({
                'luckyBoxData.attemptsLeft': userGameData.attemptsLeft,
                'luckyBoxData.lastPlayedDate': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // ✅ Save history to localStorage ONLY!
            saveGameHistory({
                userId: userDocId,
                userEmail: currentUser.email,
                targetNumber: currentGameState.targetNumber,
                selectedNumber: number,
                result: 'lose',
                prizeWon: 0
            });
            
            gameResultEl.innerHTML = `
                <div style="color: var(--error-red); font-size: 24px; font-weight: 600; margin-top: 20px;">
                    Better Luck Next Time!
                </div>
                <div style="color: var(--text-light); margin-top: 10px;">
                    The target was ${currentGameState.targetNumber}, you selected ${number}
                </div>
            `;
            
            if (userGameData.attemptsLeft > 0) {
                showToast('error', 'Try Again!', 
                    `Wrong box! ${userGameData.attemptsLeft} attempt(s) remaining.`, 4000);
            } else {
                showToast('error', 'Better Luck Tomorrow!', 
                    'No attempts left. Come back tomorrow!', 5000);
            }
            
        } catch (error) {
            console.error('Error processing lose:', error);
            showToast('error', 'Error', 'Failed to save game result', 4000);
        }
    }
    
    // Reset after 3 seconds
    setTimeout(() => {
        resetGame();
        updateUI();
    }, 3000);
}

// ================================================
// RESET GAME
// ================================================
function resetGame() {
    boxesContainer.style.display = 'none';
    boxesContainer.innerHTML = '';
    targetNumberEl.textContent = '?';
    gameResultEl.innerHTML = '';
    playButton.style.display = 'inline-flex';
    gameStatusEl.style.display = 'block';
    currentGameState.isPlaying = false;
    currentGameState.hasClicked = false;
}

// ================================================
// TOAST NOTIFICATION
// ================================================
function showToast(type, title, message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check' : 
                type === 'error' ? 'fa-times' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }, duration);
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

const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.menu-dropdown');
        dropdown.classList.toggle('active');
    });
});

playButton.addEventListener('click', startGame);