// ========================================
// 🔥 OPTIMIZED MUSIC & EARN - USER FIELDS!
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

let currentUser = null;
let songs = [];
let userMusicData = {}; // From user document field

// ========================================
// DOM ELEMENTS
// ========================================
const body = document.getElementById('body');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const songBanner = document.getElementById('songBanner');
const currentSongTitle = document.getElementById('currentSongTitle');
const currentSongArtist = document.getElementById('currentSongArtist');
const currentTime = document.getElementById('currentTime');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeBar = document.getElementById('volumeBar');
const volumeFill = document.getElementById('volumeFill');
const earningsAmount = document.getElementById('earningsAmount');
const claimButton = document.getElementById('claimButton');
const songsGrid = document.getElementById('songsGrid');
const earningsTableBody = document.getElementById('earningsTableBody');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');

// ========================================
// PLAYER STATE
// ========================================
let playerState = {
    currentSong: null,
    currentSongIndex: 0,
    isListening: false,
    listeningStartTime: null,
    listeningDuration: 0,
    earningsPerMinute: 0,
    totalEarnings: 0,
    trackingInterval: null,
    isShuffled: false,
    sessionId: null
};

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

    const progressBarElem = toast.querySelector('.toast-progress');
    progressBarElem.style.transform = 'scaleX(0)';
    setTimeout(() => progressBarElem.style.transform = 'scaleX(1)', 100);

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

// ========================================
// SIDEBAR & DARK MODE
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

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    playPauseBtn.addEventListener('click', openSongAndStartTracking);
    prevBtn.addEventListener('click', playPreviousSong);
    nextBtn.addEventListener('click', playNextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    claimButton.addEventListener('click', claimEarnings);
}

// ========================================
// 🔥 FETCH USER MUSIC DATA (FROM USER DOC!)
// ========================================
async function fetchUserMusicData() {
    if (!currentUser) return {};

    try {
        // ✅ Read musicTasks field from user document
        const userDoc = await db.collection('users')
            .doc(currentUser.uid)
            .get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            userMusicData = data.musicTasks || {};
            console.log('✅ Loaded music data from user doc');
            return userMusicData;
        }
        
        userMusicData = {};
        return {};
    } catch (error) {
        console.error("Error fetching music data:", error);
        return {};
    }
}

// ========================================
// EXTRACT THUMBNAIL
// ========================================
function extractThumbnailFromUrl(url) {
    const youtubePatterns = [
        /(?:youtube.com\/watch\?v=|youtu.be\/)([^&\n?#]+)/,
        /youtube.com\/embed\/([^&\n?#]+)/,
        /music.youtube.com\/watch\?v=([^&\n?#]+)/
    ];

    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
        }
    }
    return 'avatar.png';
}

// ========================================
// FETCH SONGS
// ========================================
async function fetchSongs() {
    try {
        console.log("Fetching songs from Firestore...");

        const songsSnapshot = await db.collection('musicSongs')
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
        
        // ✅ Fetch user music data
        await fetchUserMusicData();
        
        songs = [];
        
        if (now < displayWindowStart || now > displayWindowEnd) {
            console.log("Outside display window (8:00 AM - 12:00 AM)");
            showExpiredMessage();
            return [];
        }
        
        songsSnapshot.forEach(doc => {
            const songData = doc.data();
            
            if (!songData.datePosted) {
                return;
            }
            
            let jobDate;
            if (songData.datePosted.toDate) {
                jobDate = songData.datePosted.toDate();
            } else {
                jobDate = new Date(songData.datePosted);
            }
            
            if (jobDate >= todayStart && jobDate <= todayEnd) {
                // ✅ Check musicTasks field instead of separate collection
                if (!userMusicData[doc.id]?.completed) {
                    songs.push({
                        id: doc.id,
                        ...songData
                    });
                }
            }
        });
        
        console.log(`Found ${songs.length} available songs for today`);
        
        if (songs.length > 0) {
            await createSongsGrid();
            selectSong(songs[0].id);
            hideNoSongsMessage();
            showToast('success', 'Songs Available', `${songs.length} song(s) to earn!`, 3000);
        } else {
            const allTodaySongs = [];
            songsSnapshot.forEach(doc => {
                const songData = doc.data();
                if (songData.datePosted) {
                    let jobDate;
                    if (songData.datePosted.toDate) {
                        jobDate = songData.datePosted.toDate();
                    } else {
                        jobDate = new Date(songData.datePosted);
                    }
                    if (jobDate >= todayStart && jobDate <= todayEnd) {
                        allTodaySongs.push(doc.id);
                    }
                }
            });
            
            if (allTodaySongs.length > 0) {
                showAllCompletedMessage();
            } else {
                showNoSongsMessage();
            }
        }
    } catch (error) {
        console.error("Error fetching songs:", error);
        showToast('error', 'Load Failed', 'Please refresh.', 5000);
    }
}

// ========================================
// CREATE SONGS GRID
// ========================================
async function createSongsGrid() {
    songsGrid.innerHTML = '';

    for (let index = 0; index < songs.length; index++) {
        const song = songs[index];
        const card = document.createElement('div');
        card.className = 'song-card';
        if (index === playerState.currentSongIndex) {
            card.classList.add('active');
        }
        card.dataset.songId = song.id;
        
        const durationMinutes = Math.floor(song.duration / 60) || 0;
        const durationSeconds = song.duration % 60 || 0;
        const durationText = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        const thumbnailUrl = extractThumbnailFromUrl(song.link);
        
        card.innerHTML = `
            <img src="${thumbnailUrl}"
                 alt="${song.title}"
                 class="song-card-img"
                 onerror="this.src='https://via.placeholder.com/250x160/10B981/FFFFFF?text=Music'">
            <div class="song-card-content">
                <div class="song-card-title">${song.title}</div>
                <div class="song-card-artist">${song.artist || 'Unknown Artist'}</div>
                <div class="song-card-duration">
                    <i class="far fa-clock"></i>
                    ${durationText} • ₦${song.amount}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => selectSong(song.id));
        songsGrid.appendChild(card);
    }
}

// ========================================
// SELECT SONG
// ========================================
function selectSong(songId) {
    const songIndex = songs.findIndex(song => song.id === songId);
    if (songIndex === -1) return;

    stopTracking();
    playerState.currentSongIndex = songIndex;
    playerState.currentSong = songs[songIndex];
    playerState.listeningDuration = 0;
    playerState.totalEarnings = 0;
    playerState.isListening = false;

    const durationMinutes = playerState.currentSong.duration / 60;
    playerState.earningsPerMinute = playerState.currentSong.amount / durationMinutes;

    updatePlayerUI();
    updateActiveSongCard();

    earningsAmount.textContent = `₦0.00`;
    claimButton.disabled = true;
    playPauseIcon.classList.remove('fa-pause');
    playPauseIcon.classList.add('fa-play');

    showToast('info', 'Song Selected', `${playerState.currentSong.title}`, 3000);
}

// ========================================
// UPDATE PLAYER UI
// ========================================
function updatePlayerUI() {
    if (!playerState.currentSong) return;

    const thumbnailUrl = extractThumbnailFromUrl(playerState.currentSong.link);
    songBanner.src = thumbnailUrl;
    songBanner.onerror = () => {
        songBanner.src = 'https://via.placeholder.com/800x300/10B981/FFFFFF?text=Music';
    };

    currentSongTitle.textContent = playerState.currentSong.title;
    currentSongArtist.textContent = playerState.currentSong.artist || 'Unknown Artist';
    progressFill.style.width = '0%';
    currentTime.textContent = '0:00';

    const minutes = Math.floor(playerState.currentSong.duration / 60);
    const seconds = playerState.currentSong.duration % 60;
    duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ========================================
// UPDATE ACTIVE CARD
// ========================================
function updateActiveSongCard() {
    document.querySelectorAll('.song-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.querySelector(`.song-card[data-song-id="${playerState.currentSong.id}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ========================================
// OPEN SONG AND START TRACKING
// ========================================
function openSongAndStartTracking() {
    if (!playerState.currentSong) {
        showToast('warning', 'No Song Selected', 'Please select a song first.', 3000);
        return;
    }

    playerState.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    window.open(playerState.currentSong.link, '_blank');
    startTracking();

    showToast('success', 'Listening Started! 🎵',
        'Listen and come back to claim earnings!', 6000);
}

// ========================================
// START TRACKING
// ========================================
function startTracking() {
    if (playerState.trackingInterval) {
        clearInterval(playerState.trackingInterval);
    }

    playerState.isListening = true;
    playerState.listeningStartTime = Date.now();
    playPauseIcon.classList.remove('fa-play');
    playPauseIcon.classList.add('fa-pause');

    showFloatingTracker();

    playerState.trackingInterval = setInterval(() => {
        playerState.listeningDuration++;
        const earningsPerSecond = playerState.earningsPerMinute / 60;
        playerState.totalEarnings += earningsPerSecond;
        updateTrackingUI();
        
        if (playerState.listeningDuration >= playerState.currentSong.duration) {
            completeListening();
        }
    }, 1000);
}

// ========================================
// SHOW FLOATING TRACKER
// ========================================
function showFloatingTracker() {
    const existingTracker = document.getElementById('floating-tracker');
    if (existingTracker) {
        existingTracker.remove();
    }

    const tracker = document.createElement('div');
    tracker.id = 'floating-tracker';
    tracker.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-green), var(--dark-green));
        color: white;
        padding: 25px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
        z-index: 9998;
        min-width: 250px;
        text-align: center;
        animation: slideIn 0.5s ease;
    `;

    tracker.innerHTML = `
        <style>
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
            <i class="fas fa-music" style="font-size: 20px;"></i>
            <div style="font-weight: 700; font-size: 16px;">Now Listening</div>
        </div>
        <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;" id="tracker-time">0:00</div>
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">
            Earnings: <span id="tracker-earnings" style="font-weight: 700; font-size: 18px;">₦0.00</span>
        </div>
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 20px;">
            Max: ₦${playerState.currentSong.amount.toFixed(2)}
        </div>
        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin-bottom: 20px; overflow: hidden;">
            <div id="tracker-progress" style="height: 100%; background: white; width: 0%; transition: width 0.3s;"></div>
        </div>
        <button onclick="stopListening()" style="
            background: white;
            color: var(--primary-green);
            border: none;
            padding: 12px 25px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-bottom: 10px;
            font-size: 15px;
        ">
            <i class="fas fa-check"></i> Done Listening
        </button>
        <button onclick="cancelListening()" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            font-size: 13px;
        ">Cancel</button>
    `;

    document.body.appendChild(tracker);
}

// ========================================
// UPDATE TRACKING UI
// ========================================
function updateTrackingUI() {
    const mins = Math.floor(playerState.listeningDuration / 60);
    const secs = playerState.listeningDuration % 60;

    const trackerTime = document.getElementById('tracker-time');
    const trackerEarnings = document.getElementById('tracker-earnings');
    const trackerProgress = document.getElementById('tracker-progress');

    if (trackerTime) {
        trackerTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (trackerEarnings) {
        trackerEarnings.textContent = `₦${playerState.totalEarnings.toFixed(2)}`;
    }
    if (trackerProgress) {
        const progressPercent = (playerState.listeningDuration / playerState.currentSong.duration) * 100;
        trackerProgress.style.width = `${Math.min(progressPercent, 100)}%`;
    }

    const mainMins = Math.floor(playerState.listeningDuration / 60);
    const mainSecs = playerState.listeningDuration % 60;
    currentTime.textContent = `${mainMins}:${mainSecs.toString().padStart(2, '0')}`;

    const mainProgress = (playerState.listeningDuration / playerState.currentSong.duration) * 100;
    progressFill.style.width = `${Math.min(mainProgress, 100)}%`;
    earningsAmount.textContent = `₦${playerState.totalEarnings.toFixed(2)}`;
}

// ========================================
// COMPLETE LISTENING
// ========================================
function completeListening() {
    stopTracking();
    claimButton.disabled = false;
    showToast('success', 'Song Completed! 🎉',
        `You've earned ₦${playerState.totalEarnings.toFixed(2)}!`, 6000);
}

// ========================================
// STOP LISTENING
// ========================================
window.stopListening = function() {
    stopTracking();

    if (playerState.listeningDuration > 0) {
        claimButton.disabled = false;
        const percentageListened = (playerState.listeningDuration / playerState.currentSong.duration) * 100;
        showToast('success', 'Listening Stopped',
            `Listened ${Math.floor(playerState.listeningDuration / 60)}:${(playerState.listeningDuration % 60).toString().padStart(2, '0')} (${percentageListened.toFixed(0)}%). Earned ₦${playerState.totalEarnings.toFixed(2)}!`, 6000);
    } else {
        showToast('info', 'No Listening Time', 'Listen for at least a few seconds.', 4000);
    }
}

// ========================================
// CANCEL LISTENING
// ========================================
window.cancelListening = function() {
    if (confirm('Are you sure? You will lose earnings.')) {
        stopTracking();
        playerState.listeningDuration = 0;
        playerState.totalEarnings = 0;
        earningsAmount.textContent = `₦0.00`;
        currentTime.textContent = '0:00';
        progressFill.style.width = '0%';
        showToast('info', 'Listening Cancelled', 'Session ended.', 3000);
    }
}

// ========================================
// STOP TRACKING
// ========================================
function stopTracking() {
    if (playerState.trackingInterval) {
        clearInterval(playerState.trackingInterval);
        playerState.trackingInterval = null;
    }

    playerState.isListening = false;
    playPauseIcon.classList.remove('fa-pause');
    playPauseIcon.classList.add('fa-play');

    const tracker = document.getElementById('floating-tracker');
    if (tracker) {
        tracker.remove();
    }
}

// ========================================
// 🔥 CLAIM EARNINGS (ONE WRITE!)
// ========================================
async function claimEarnings() {
    if (!currentUser || playerState.totalEarnings <= 0) {
        showToast('warning', 'No Earnings', 'No earnings to claim.', 3000);
        return;
    }

    claimButton.classList.add('loading');
    claimButton.disabled = true;

    try {
        const earningsToAdd = Math.floor(playerState.totalEarnings * 100) / 100;
        const percentageListened = (playerState.listeningDuration / playerState.currentSong.duration) * 100;
        
        // ✅ ONE WRITE - Update wallet + mark completed together!
        await db.collection('users').doc(currentUser.uid).update({
            taskWallet: firebase.firestore.FieldValue.increment(earningsToAdd),
            taskTotalEarned: firebase.firestore.FieldValue.increment(earningsToAdd),
            [`musicTasks.${playerState.currentSong.id}.completed`]: true,
            [`musicTasks.${playerState.currentSong.id}.earnings`]: earningsToAdd,
            [`musicTasks.${playerState.currentSong.id}.listeningTime`]: playerState.listeningDuration,
            [`musicTasks.${playerState.currentSong.id}.percentageListened`]: Math.round(percentageListened),
            [`musicTasks.${playerState.currentSong.id}.completedAt`]: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local cache
        userMusicData[playerState.currentSong.id] = {
            completed: true,
            earnings: earningsToAdd,
            listeningTime: playerState.listeningDuration,
            percentageListened: Math.round(percentageListened),
            completedAt: new Date()
        };
        
        // ✅ Save history to localStorage
        saveMusicEarningLocally({
            songTitle: playerState.currentSong.title,
            amount: earningsToAdd,
            listeningTime: playerState.listeningDuration,
            percentageListened: Math.round(percentageListened),
            timestamp: new Date().toISOString()
        });
        
        showToast('success', 'Earnings Claimed! 💰', `₦${earningsToAdd.toFixed(2)} added to task wallet!`, 7000);
        
        // Reset
        playerState.totalEarnings = 0;
        playerState.listeningDuration = 0;
        earningsAmount.textContent = `₦0.00`;
        currentTime.textContent = '0:00';
        progressFill.style.width = '0%';
        
        loadEarningsHistory();
        await fetchSongs();
        
    } catch (error) {
        console.error('Claim error:', error);
        showToast('error', 'Claim Failed', 'Please try again.', 5000);
    } finally {
        claimButton.classList.remove('loading');
    }
}

// ========================================
// 💾 SAVE MUSIC EARNING LOCALLY
// ========================================
function saveMusicEarningLocally(data) {
    const key = `musicEarnings_${currentUser.uid}`;
    let history = JSON.parse(localStorage.getItem(key)) || [];
    history.unshift(data);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(history));
}

// ========================================
// 💾 LOAD EARNINGS HISTORY (FROM LOCALSTORAGE)
// ========================================
function loadEarningsHistory() {
    if (!currentUser) return;

    const key = `musicEarnings_${currentUser.uid}`;
    const earnings = JSON.parse(localStorage.getItem(key)) || [];
    
    renderEarningsHistory(earnings);
}

// ========================================
// RENDER EARNINGS HISTORY
// ========================================
function renderEarningsHistory(earnings) {
    earningsTableBody.innerHTML = '';

    if (earnings.length === 0) {
        emptyState.style.display = 'block';
        document.querySelector('.earnings-table').style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    document.querySelector('.earnings-table').style.display = 'table';

    earnings.forEach((earning, index) => {
        const row = document.createElement('tr');
        
        const date = new Date(earning.timestamp);
        const dateText = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const minutes = Math.floor(earning.listeningTime / 60);
        const seconds = earning.listeningTime % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')} (${earning.percentageListened}%)`;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${dateText}</td>
            <td>${earning.songTitle}</td>
            <td>${timeText}</td>
            <td>₦${earning.amount.toFixed(2)}</td>
        `;
        
        earningsTableBody.appendChild(row);
    });
}

// ========================================
// NAVIGATION CONTROLS
// ========================================
function playNextSong() {
    if (songs.length === 0) return;

    stopTracking();

    if (playerState.isShuffled) {
        playerState.currentSongIndex = Math.floor(Math.random() * songs.length);
    } else {
        playerState.currentSongIndex = (playerState.currentSongIndex + 1) % songs.length;
    }

    selectSong(songs[playerState.currentSongIndex].id);
}

function playPreviousSong() {
    if (songs.length === 0) return;

    stopTracking();

    if (playerState.isShuffled) {
        playerState.currentSongIndex = Math.floor(Math.random() * songs.length);
    } else {
        playerState.currentSongIndex = (playerState.currentSongIndex - 1 + songs.length) % songs.length;
    }

    selectSong(songs[playerState.currentSongIndex].id);
}

function toggleShuffle() {
    playerState.isShuffled = !playerState.isShuffled;
    shuffleBtn.style.color = playerState.isShuffled ? 'var(--primary-green)' : '';

    showToast('info', playerState.isShuffled ? 'Shuffle On' : 'Shuffle Off',
             playerState.isShuffled ? 'Random order' : 'Normal order', 2000);
}

// ========================================
// SHOW/HIDE MESSAGES
// ========================================
function hideNoSongsMessage() {
    const existingMessage = document.getElementById('no-songs-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const playerCard = document.querySelector('.music-player-card');
    if (playerCard) {
        playerCard.style.display = 'block';
    }

    if (songsGrid) {
        songsGrid.style.display = 'grid';
    }
}

function showNoSongsMessage() {
    const existingMessage = document.getElementById('no-songs-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const playerCard = document.querySelector('.music-player-card');
    if (playerCard) {
        playerCard.style.display = 'none';
    }

    if (songsGrid) {
        songsGrid.style.display = 'none';
    }

    const messageContainer = document.createElement('div');
    messageContainer.id = 'no-songs-message';
    messageContainer.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: var(--text-light);
    `;

    messageContainer.innerHTML = `
        <div style="font-size: 64px; color: var(--light-grey); margin-bottom: 20px; opacity: 0.5;">
            <i class="fas fa-music"></i>
        </div>
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 10px; color: var(--text-color);">
            No Music Available Today
        </h3>
        <p style="font-size: 16px; max-width: 400px; margin: 0 auto;">
            No songs posted today. Check back tomorrow!
        </p>
    `;

    const playerSection = document.querySelector('.music-player-section');
    if (playerSection) {
        playerSection.appendChild(messageContainer);
    }
}

function showAllCompletedMessage() {
    const existingMessage = document.getElementById('no-songs-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const playerCard = document.querySelector('.music-player-card');
    if (playerCard) {
        playerCard.style.display = 'none';
    }

    if (songsGrid) {
        songsGrid.style.display = 'none';
    }

    const messageContainer = document.createElement('div');
    messageContainer.id = 'no-songs-message';
    messageContainer.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: var(--text-light);
    `;

    messageContainer.innerHTML = `
        <div style="font-size: 64px; color: var(--success); margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 10px; color: var(--text-color);">
            All Songs Completed! 🎉
        </h3>
        <p style="font-size: 16px; max-width: 400px; margin: 0 auto 30px;">
            You've listened to all songs for today. Come back tomorrow!
        </p>
        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 15px; padding: 20px; max-width: 300px; margin: 0 auto;">
            <div style="font-size: 14px; color: var(--text-light); margin-bottom: 5px;">
                Songs Completed Today
            </div>
            <div style="font-size: 32px; font-weight: 700; color: var(--primary-green);">
                <i class="fas fa-music"></i> All Done!
            </div>
        </div>
    `;

    const playerSection = document.querySelector('.music-player-section');
    if (playerSection) {
        playerSection.appendChild(messageContainer);
    }

    showToast('success', 'Great Job! 🎉', 'All songs completed!', 6000);
}

function showExpiredMessage() {
    const existingMessage = document.getElementById('no-songs-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const playerCard = document.querySelector('.music-player-card');
    if (playerCard) {
        playerCard.style.display = 'none';
    }

    if (songsGrid) {
        songsGrid.style.display = 'none';
    }

    const messageContainer = document.createElement('div');
    messageContainer.id = 'no-songs-message';
    messageContainer.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: var(--text-light);
    `;

    messageContainer.innerHTML = `
        <div style="font-size: 64px; color: var(--warning); margin-bottom: 20px; opacity: 0.7;">
            <i class="fas fa-clock"></i>
        </div>
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 10px; color: var(--text-color);">
            Songs Expired ⏰
        </h3>
        <p style="font-size: 16px; max-width: 400px; margin: 0 auto 30px;">
            Today's songs are available from 8:00 AM to 12:00 AM (Midnight). The time window has passed.
        </p>
        <div style="background: rgba(255, 193, 7, 0.1); border-radius: 15px; padding: 20px; max-width: 350px; margin: 0 auto;">
            <div style="font-size: 14px; color: var(--text-light); margin-bottom: 10px;">
                Available Hours
            </div>
            <div style="font-size: 20px; font-weight: 700; color: var(--warning); margin-bottom: 15px;">
                8:00 AM - 12:00 AM
            </div>
            <div style="font-size: 14px; color: var(--text-light);">
                Come back tomorrow between these hours!
            </div>
        </div>
    `;

    const playerSection = document.querySelector('.music-player-section');
    if (playerSection) {
        playerSection.appendChild(messageContainer);
    }

    showToast('warning', 'Time Expired', 'Songs available 8 AM - 12 AM only', 5000);
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
            
            if (profileName && userData.username) {
                profileName.textContent = userData.username;
            }
            if (profileRole && userData.accountType) {
                profileRole.textContent = userData.accountType || 'Member';
            }
            if (profileImg && userData.profilePicture) {
                profileImg.src = userData.profilePicture;
            }
        }
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

// ========================================
// PAGE INITIALIZATION
// ========================================
async function initMusicPage() {
    try {
        console.log("Initializing Music & Earn Page...");

        await checkAuth();
        setupEventListeners();
        await updateProfileInfo();
        await fetchSongs();
        loadEarningsHistory();
        
        if (songs.length > 0) {
            setTimeout(() => {
                showToast('info', 'Music & Earn 🎵',
                    'Click play to open songs and earn!', 5000);
            }, 1000);
        }
        
        console.log("✅ Music page initialized - Using user document fields!");
        
    } catch (error) {
        console.error("❌ Initialization failed:", error);
        if (error.message !== 'Not authenticated') {
            showToast('error', 'Error', 'Please refresh.', 5000);
        }
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPage);
} else {
    initMusicPage();
}

// Cleanup
window.addEventListener('beforeunload', () => {
    stopTracking();
});