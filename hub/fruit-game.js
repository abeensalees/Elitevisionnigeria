// ========================================
// FRUIT-GAME.JS - Elite Vision (Final Action Version)
// Includes: Game Logic + UI Logic + Action Mode
// ========================================

// ========================================
// 1. GAME CONFIGURATION & VARIABLES
// ========================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Responsive Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game State Variables
let gameState = "START"; 
let score = 0;
let highScore = parseInt(localStorage.getItem('elite_highscore')) || 0;
let level = 1;
let lastSpawn = 0;

// Arrays
let fruits = [];
let splashes = [];
let swipeTrail = [];
let bombs = [];

// Physics Constants (Action Mode)
const GRAVITY = 0.28; 
const LAUNCH_SPEED = 17;

// ========================================
// 2. AUDIO SYSTEM (SHARP KNIFE SOUND 🗡️)
// ========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const SoundEngine = {
    playSlice: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        
        // "KUYAT" Sound (Sharp Sawtooth)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(4000, t); 
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); 
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    playBomb: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.5);
        
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    }
};

// ========================================
// 3. ASSETS (FRUITS)
// ========================================
const fruitTypes = [
    { name: "🍉", color: "#ef4444", juice: "rgba(239,68,68,0.9)" },
    { name: "🍊", color: "#f97316", juice: "rgba(249,115,22,0.9)" },
    { name: "🍋", color: "#eab308", juice: "rgba(234,179,8,0.9)" },
    { name: "🍏", color: "#84cc16", juice: "rgba(132,204,22,0.9)" },
    { name: "🥥", color: "#fff", juice: "rgba(255,255,255,0.9)" },
    { name: "🍍", color: "#fbbf24", juice: "rgba(251,191,36,0.9)" },
    { name: "🥝", color: "#84cc16", juice: "rgba(132,204,22,0.9)" },
    { name: "🍑", color: "#fca5a5", juice: "rgba(252,165,165,0.9)" }
];

// ========================================
// 4. UI & DOM LOGIC (ADDED HERE)
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sidebar Logic ---
    const menuBtn = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    if(menuBtn) menuBtn.addEventListener('click', openSidebar);
    if(closeBtn) closeBtn.addEventListener('click', closeSidebar);
    
    // Wannan shine layin da ke kulle sidebar idan an taba overlay
    if(overlay) overlay.addEventListener('click', closeSidebar);

    // --- Theme Logic ---
    const themeBtn = document.getElementById('darkModeToggle');
    if (themeBtn) {
        const themeIcon = themeBtn.querySelector('i');
        const body = document.body;

        themeBtn.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            if (body.classList.contains('light-mode')) {
                themeIcon.classList.remove('fas', 'fa-sun');
                themeIcon.classList.add('fas', 'fa-moon');
            } else {
                themeIcon.classList.remove('fas', 'fa-moon');
                themeIcon.classList.add('fas', 'fa-sun');
            }
        });
    }

    // --- Start Game Logic ---
    const startBtn = document.getElementById('startGameBtn');
    if(startBtn) {
        startBtn.addEventListener('click', () => {
            document.getElementById('startOverlay').classList.add('hidden');
            initGame();
        });
    }

    // --- Restart Game Logic ---
    const restartBtn = document.getElementById('modalRestartBtn');
    if(restartBtn) {
        restartBtn.addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
            initGame();
        });
    }

    // --- High Score Display ---
    const highScoreEl = document.getElementById('highScoreDisplay');
    if(highScoreEl) {
        highScoreEl.innerText = highScore;
    }
});

// ========================================
// 5. GAME FUNCTIONS
// ========================================

function initGame() {
    score = 0;
    level = 1;
    fruits = [];
    bombs = [];
    splashes = [];
    swipeTrail = [];
    gameState = "PLAYING";
    
    // Update Score UI
    const scoreEl = document.getElementById('score');
    if(scoreEl) scoreEl.innerText = score;
    
    requestAnimationFrame(loop);
}

function spawnWave() {
    // Action Mode: 3 to 8 fruits
    const minFruits = 3;
    const maxFruits = Math.min(5 + Math.floor(level / 3), 8); 
    const count = Math.floor(Math.random() * (maxFruits - minFruits + 1)) + minFruits;
    const bombChance = Math.min(0.1 + (level * 0.02), 0.4);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            if (gameState !== "PLAYING") return;
            
            const x = 40 + Math.random() * (canvas.width - 80);
            const vy = -(LAUNCH_SPEED + Math.random() * 5);
            
            let vx = (Math.random() - 0.5) * 6;
            if (x < canvas.width * 0.3) vx = Math.random() * 4 + 1;
            if (x > canvas.width * 0.7) vx = -(Math.random() * 4 + 1);

            fruits.push({
                x: x, y: canvas.height + 50,
                vx: vx, vy: vy,
                size: 55,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 15,
                type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)],
                isSliced: false
            });
        }, i * 80);
    }

    if (Math.random() < bombChance && score > 10) {
        bombs.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 50,
            vx: (Math.random() - 0.5) * 6,
            vy: -(LAUNCH_SPEED + 2),
            size: 50,
            rotation: 0
        });
    }
}

// ========================================
// 6. VISUAL & INPUT
// ========================================

let shakeIntensity = 0;
function shakeScreen() {
    if (shakeIntensity > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.5) shakeIntensity = 0;
    }
}

function createSplash(x, y, color) {
    for (let i = 0; i < 15; i++) {
        splashes.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: Math.random() * 6 + 2,
            life: 1.0, color: color
        });
    }
}

// Input Handling
const input = { x: 0, y: 0, isDown: false };

['mousedown', 'touchstart'].forEach(evt => 
    canvas.addEventListener(evt, e => {
        input.isDown = true;
        const p = getPos(e);
        input.x = p.x; input.y = p.y;
        swipeTrail = []; 
    })
);

['mousemove', 'touchmove'].forEach(evt => 
    canvas.addEventListener(evt, e => {
        if (!input.isDown || gameState !== "PLAYING") return;
        e.preventDefault();
        const p = getPos(e);
        swipeTrail.push({ x: p.x, y: p.y, life: 1.0 });
        if (swipeTrail.length > 9) swipeTrail.shift();
        checkCollisions(p.x, p.y);
        input.x = p.x; input.y = p.y;
    })
);

['mouseup', 'touchend'].forEach(evt => 
    canvas.addEventListener(evt, () => {
        input.isDown = false;
        swipeTrail = [];
    })
);

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// ========================================
// 7. COLLISION & LOOP
// ========================================

function checkCollisions(x, y) {
    // Fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i];
        const dist = Math.hypot(f.x - x, f.y - y);
        
        if (dist < f.size && !f.isSliced) {
            f.isSliced = true;
            SoundEngine.playSlice();
            createSplash(f.x, f.y, f.type.juice);
            score++;
            if (score % 25 === 0) level++;
            
            // Update Score UI Realtime
            const scoreEl = document.getElementById('score');
            if(scoreEl) scoreEl.innerText = score;

            fruits.splice(i, 1);
            fruits.push({ ...f, isSliced: true, vx: -5, rotation: -20, type: f.type });
            fruits.push({ ...f, isSliced: true, vx: 5, rotation: 20, type: f.type });
        }
    }

    // Bombs
    for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        if (Math.hypot(b.x - x, b.y - y) < b.size) {
            triggerGameOver();
        }
    }
}

function triggerGameOver() {
    gameState = "GAMEOVER";
    SoundEngine.playBomb();
    shakeIntensity = 25;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('elite_highscore', highScore);
    }
    
    setTimeout(() => {
        const finalScoreEl = document.getElementById('finalScore');
        const finalHighEl = document.getElementById('highScoreDisplay');
        const modal = document.getElementById('gameOverModal');
        
        if(finalScoreEl) finalScoreEl.innerText = score;
        if(finalHighEl) finalHighEl.innerText = highScore;
        if(modal) modal.classList.add('active');
    }, 500);
}

function loop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === "PLAYING") shakeScreen();

    // Spawn Logic
    if (gameState === "PLAYING") {
        const now = Date.now();
        const spawnRate = Math.max(1200, 2200 - (level * 50)); 
        if (now - lastSpawn > spawnRate) {
            spawnWave();
            lastSpawn = now;
        }
    }

    // Draw Fruits
    fruits.forEach((f, i) => {
        f.x += f.vx; f.y += f.vy; f.vy += GRAVITY; f.rotation += f.rotSpeed;
        
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation * Math.PI / 180);
        
        ctx.font = `${f.size}px Arial`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,255,255,0.2)"; ctx.shadowBlur = 10;
        ctx.fillText(f.type.name, 0, 0);
        
        if (f.isSliced) {
            ctx.strokeStyle = "white"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, 25); ctx.stroke();
        }
        ctx.restore();
        
        if (f.y > canvas.height + 100) fruits.splice(i, 1);
    });

    // Draw Bombs
    bombs.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy; b.vy += GRAVITY; b.rotation += 5;
        
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation * Math.PI / 180);
        ctx.font = `${b.size}px Arial`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "red"; ctx.shadowBlur = 20;
        ctx.fillText("💣", 0, 0);
        ctx.restore();
        
        if (b.y > canvas.height + 100) bombs.splice(i, 1);
    });

    // Draw Splashes
    splashes.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) splashes.splice(i, 1);
    });

    // Draw Knife Blade
    if (swipeTrail.length > 1) {
        ctx.beginPath();
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; 
        ctx.shadowColor = "#00BFFF"; ctx.shadowBlur = 15;
        
        for (let i = 0; i < swipeTrail.length - 1; i++) {
            ctx.moveTo(swipeTrail[i].x, swipeTrail[i].y);
            ctx.lineTo(swipeTrail[i+1].x, swipeTrail[i+1].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    if (gameState !== "PAUSED") {
        requestAnimationFrame(loop);
    }
}
