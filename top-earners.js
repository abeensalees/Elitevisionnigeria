// ================================================
// Firebase Configuration
// ================================================
// ================================================
// Firebase Configuration
// ================================================
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================================================
// Global Variables & DOM Elements
// ================================================
let leaderboardCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const leaderboardList = document.getElementById('leaderboardList');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.getElementById('body');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

// ================================================
// Initialize Page - Load Leaderboard
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    loadLeaderboard();
});

// ================================================
// Load Leaderboard Data
// ================================================
async function loadLeaderboard() {
    try {
        // Check if cache is valid
        if (isCacheValid()) {
            console.log('Using cached leaderboard data');
            displayLeaderboard(leaderboardCache);
            return;
        }
        
        // Show loading state
        leaderboardList.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading top earners...</p>
            </div>
        `;
        
        // Fetch top 15 earners from Firestore
        const leaderboardQuery = await db.collection('leaderboard')
            .orderBy('affiliateTotalEarned', 'desc')
            .limit(15)
            .get();
        
        if (leaderboardQuery.empty) {
            leaderboardList.innerHTML = `
                <div class="loading-container">
                    <i class="fas fa-users" style="font-size: 48px; color: var(--text-light); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-light); font-size: 16px;">No top earners yet</p>
                    <p style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Be the first to start earning!</p>
                </div>
            `;
            return;
        }
        
        // Process leaderboard data
        const leaderboardData = [];
        leaderboardQuery.forEach((doc) => {
            leaderboardData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Cache the data
        leaderboardCache = leaderboardData;
        cacheTimestamp = Date.now();
        
        // Save to localStorage for persistence across sessions
        localStorage.setItem('leaderboardCache', JSON.stringify({
            data: leaderboardData,
            timestamp: cacheTimestamp
        }));
        
        // Display the leaderboard
        displayLeaderboard(leaderboardData);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--error-red); margin-bottom: 15px;"></i>
                <p style="color: var(--error-red); font-size: 16px;">Failed to load leaderboard</p>
                <p style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Please refresh the page to try again</p>
            </div>
        `;
    }
}

// ================================================
// Check if Cache is Valid
// ================================================
function isCacheValid() {
    // Check memory cache first
    if (leaderboardCache && cacheTimestamp) {
        const age = Date.now() - cacheTimestamp;
        if (age < CACHE_DURATION) {
            return true;
        }
    }
    
    // Check localStorage cache
    const cachedData = localStorage.getItem('leaderboardCache');
    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            
            if (age < CACHE_DURATION) {
                // Restore cache to memory
                leaderboardCache = parsed.data;
                cacheTimestamp = parsed.timestamp;
                return true;
            }
        } catch (error) {
            console.error('Error parsing cached data:', error);
            localStorage.removeItem('leaderboardCache');
        }
    }
    
    return false;
}

// ================================================
// Display Leaderboard
// ================================================
function displayLeaderboard(data) {
    leaderboardList.innerHTML = '';
    
    data.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        // Determine rank badge emoji
        let rankBadge = '';
        if (rank === 1) rankBadge = '👑';
        else if (rank === 2) rankBadge = '🥈';
        else if (rank === 3) rankBadge = '🥉';
        
        // Default profile picture if none exists
        const profilePic = user.profilePic || 'avatar.png' //+ (user.username ? user.username.charAt(0).toUpperCase() : 'U');
        
        // Format earnings
        const earnings = (user.affiliateTotalEarned || 0).toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        // Create leader card
        const leaderCard = document.createElement('div');
        leaderCard.className = `leader-card ${rankClass}`;
        leaderCard.innerHTML = `
            <div class="rank-number">${rank}</div>
            <img src="${profilePic}" alt="${user.username}" class="profile-pic" onerror="this.src='avatar.png'">
            <div class="leader-info">
                <div class="leader-username">${user.username || 'Anonymous'}</div>
                <div class="leader-earnings">${earnings}</div>
            </div>
            ${rankBadge ? `<div class="rank-badge">${rankBadge}</div>` : ''}
        `;
        
        leaderboardList.appendChild(leaderCard);
    });
}

// ================================================
// Sidebar Toggle Functions
// ================================================
function openSidebar() {
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
}

function closeSidebarFunc() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
}

menuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);
mobileOverlay.addEventListener('click', closeSidebarFunc);

/* Close sidebar when clicking a menu item on mobile
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeSidebarFunc();
        }
    });
});*/

//drop down side bar
dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.parentElement;
            dropdown.classList.toggle('active');
        });
    });


// ================================================
// Dark Mode Toggle
// ================================================
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// ================================================
// Refresh Leaderboard (Force Reload)
// ================================================
function refreshLeaderboard() {
    // Clear cache
    leaderboardCache = null;
    cacheTimestamp = null;
    localStorage.removeItem('leaderboardCache');
    
    // Reload leaderboard
    loadLeaderboard();
}

// Optional: Add pull-to-refresh or a refresh button
// You can call refreshLeaderboard() when needed

// ================================================
// Page Visibility API - Refresh when page becomes visible
// ================================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Check if cache is still valid when user returns to page
        if (!isCacheValid()) {
            console.log('Cache expired, refreshing leaderboard...');
            loadLeaderboard();
        }
    }
});