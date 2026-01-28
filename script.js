const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const actionBtn = document.getElementById('actionBtn');
const highScoreEl = document.getElementById('highScore');

// Game State Variables
let score = 0;
let highScore = localStorage.getItem('alienHighScore') || 0;
let timeLeft = 60;
let targetSum = 10;
let currentKey = 0;
let aliens = [];
let gameActive = false;
let alienSpeed = 1.0;
let gameTimerInterval = null;

// --- CHANGE 1: Add a counter for successful hits ---
let successfulHits = 0; 

// Initialize High Score Display
highScoreEl.innerText = highScore;

// Lane System Setup
const numLanes = 8;
const laneWidth = canvas.width / numLanes;

class Alien {
    constructor(value, isCorrect, x) {
        this.value = value;
        this.isCorrect = isCorrect;
        this.x = x;
        this.y = -60;
        this.radius = 30;
        this.remove = false;
    }

    update() {
        this.y += alienSpeed;
        if (this.y > canvas.height + this.radius) {
            this.remove = true;
            if (this.isCorrect) {
                score = Math.max(0, score - 5);
                updateUI();
            }
        }
    }

    draw() {
        ctx.save();
        
        // --- CHANGE 2: Logic to hide the hint after 5 hits ---
        // We only show the green hint if it IS the correct alien AND hits are < 5
        const showHint = this.isCorrect && successfulHits < 5;

        // Draw Alien Glow (Only if hint is active)
        ctx.shadowBlur = 15;
        ctx.shadowColor = showHint ? "#3fb950" : "transparent";

        // Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#161b22";
        ctx.fill();

        // Stroke Color (Green if hint active, otherwise Grey)
        ctx.strokeStyle = showHint ? "#3fb950" : "#8b949e";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Number
        ctx.fillStyle = "white";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        ctx.fillText(this.value, this.x, this.y + 8);
        ctx.restore();
    }
}

function updateUI() {
    document.getElementById('target').innerText = targetSum;
    document.getElementById('key').innerText = currentKey;
    document.getElementById('score').innerText = score;
    document.getElementById('timer').innerText = timeLeft;
    highScoreEl.innerText = highScore;
}

function spawnWave() {
    if (!gameActive) return;
    aliens = [];
    
    // Difficulty scaling: Bonds to 20 after 50 points
    if (score >= 50) {
        targetSum = 20;
        alienSpeed = 1.5;
    } else {
        targetSum = 10;
        alienSpeed = 1.0;
    }

    currentKey = Math.floor(Math.random() * (targetSum + 1));
    updateUI();

    let availableLanes = [0, 1, 2, 3, 4, 5, 6, 7];
    const solution = targetSum - currentKey;

    // Spawn correct answer
    const correctLaneIdx = Math.floor(Math.random() * availableLanes.length);
    const correctLane = availableLanes.splice(correctLaneIdx, 1)[0];
    aliens.push(new Alien(solution, true, (correctLane * laneWidth) + (laneWidth / 2)));

    // Spawn 3 distractors
    for (let i = 0; i < 3; i++) {
        let val;
        do { val = Math.floor(Math.random() * (targetSum + 1)); } while (val === solution);
        const distractorLaneIdx = Math.floor(Math.random() * availableLanes.length);
        const distractorLane = availableLanes.splice(distractorLaneIdx, 1)[0];
        aliens.push(new Alien(val, false, (distractorLane * laneWidth) + (laneWidth / 2)));
    }
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = aliens.length - 1; i >= 0; i--) {
        aliens[i].update();
        aliens[i].draw();
        if (aliens[i].remove) aliens.splice(i, 1);
    }
    if (aliens.length === 0) spawnWave();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameActive = false;
    clearInterval(gameTimerInterval);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('alienHighScore', highScore);
        overlayTitle.innerText = "NEW HIGH SCORE!";
        overlayTitle.style.color = "#e3b341";
    } else {
        overlayTitle.innerText = "GAME OVER";
        overlayTitle.style.color = "white";
    }

    updateUI();
    overlayMessage.innerText = `Final Score: ${score} | High Score: ${highScore}`;
    actionBtn.innerText = "PLAY AGAIN";
    overlay.style.display = 'flex';
}

function startGame() {
    score = 0;
    timeLeft = 60;
    
    // --- CHANGE 3: Reset successful hits when game starts ---
    successfulHits = 0; 
    
    aliens = [];
    gameActive = true;
    overlay.style.display = 'none';
    
    spawnWave();
    gameLoop();

    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

canvas.addEventListener('mousedown', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    aliens.forEach(alien => {
        const d = Math.hypot(mx - alien.x, my - alien.y);
        if (d < alien.radius) {
            if (alien.isCorrect) {
                score += 10;
                
                // --- CHANGE 4: Increment hits on success ---
                successfulHits++; 
                
                spawnWave();
            } else {
                score = Math.max(0, score - 2);
                alien.remove = true;
            }
            updateUI();
        }
    });
});

actionBtn.addEventListener('click', startGame);