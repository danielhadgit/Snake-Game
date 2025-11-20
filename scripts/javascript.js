// Get canvas and context
const canvas = document.getElementById('appCanvas');
const ctx = canvas.getContext('2d');

// Game settings
let gridSize = 40; // will be updated from dropdown
let tileCountX = Math.floor(canvas.width / gridSize);
let tileCountY = Math.floor(canvas.height / gridSize);
const moveInterval = 150; // ms between grid steps

// Smooth movement timing
let lastMoveTime = 0;

// Snake properties
let snake = [
    { x: 10, y: 10 }
];
let velocityX = 0;
let velocityY = 0;

// Food properties
let foodX = 15;
let foodY = 15;

// Game state
let score = 0;
let gameOver = false;
let gameLoopId = null;

// Size control
const gridSizeSelect = document.getElementById('gridSizeSelect');

function applyGridSize(sizeKey) {
    // Define sizes: medium as default (current 40)
    if (sizeKey === 'small') {
        gridSize = 25; // more cells, smaller snake
    } else if (sizeKey === 'large') {
        gridSize = 50; // fewer cells, bigger snake but still visible
    } else {
        gridSize = 40; // medium
    }

    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);
    console.log('Grid size set to', gridSize, 'Tile count:', tileCountX, tileCountY);
}

if (gridSizeSelect) {
    // Initialize with default medium
    applyGridSize(gridSizeSelect.value || 'medium');

    gridSizeSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        applyGridSize(value);
        // Reset game so new grid applies cleanly
        resetGame();
    });
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    console.log(`Key pressed: ${e.key} (keyCode: ${e.keyCode})`);
    
    if (gameOver) return;
    
    // Prevent default arrow key behavior (scrolling)
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Change direction (prevent reversing into itself)
    let nextVX = velocityX;
    let nextVY = velocityY;

    if (e.key === 'ArrowUp') {
        nextVX = 0;
        nextVY = -1;
    } else if (e.key === 'ArrowDown') {
        nextVX = 0;
        nextVY = 1;
    } else if (e.key === 'ArrowLeft') {
        nextVX = -1;
        nextVY = 0;
    } else if (e.key === 'ArrowRight') {
        nextVX = 1;
        nextVY = 0;
    }

    // Prevent 180° turns into the neck segment when longer than 1
    if (snake.length > 1) {
        const head = snake[0];
        const neck = snake[1];
        const nextHeadX = head.x + nextVX;
        const nextHeadY = head.y + nextVY;

        // If the next head position would be exactly where the neck is,
        // ignore this input so you can't "look into" your own body.
        if (nextHeadX === neck.x && nextHeadY === neck.y) {
            return;
        }
    }

    velocityX = nextVX;
    velocityY = nextVY;
});

// Update snake position one grid step
function updateSnake() {
    if (velocityX === 0 && velocityY === 0) return;

    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

    // Check wall collision
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        console.log('Game Over! Hit wall. Score:', score);
        endGame();
        return;
    }

    // Check self collision: only count collisions with the body (tail),
    // not the current head position.
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            console.log('Game Over! Hit tail. Score:', score);
            endGame();
            return;
        }
    }

    snake.unshift(head);

    // Check if food eaten
    if (head.x === foodX && head.y === foodY) {
        score++;
        console.log('Food eaten! Score:', score);
        placeFood();
    } else {
        snake.pop();
    }
}

// Main loop with requestAnimationFrame for smoother visuals
function gameLoop(timestamp) {
    if (gameOver) return;

    if (!lastMoveTime) {
        lastMoveTime = timestamp;
    }

    const delta = timestamp - lastMoveTime;
    if (delta >= moveInterval) {
        updateSnake();
        lastMoveTime = timestamp;
    }

    drawGame();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Draw game
function drawGame() {
    const isDark = document.body.classList.contains('dark');

    // Clear canvas with theme-based gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (isDark) {
        gradient.addColorStop(0, '#020617');
        gradient.addColorStop(1, '#0b1120');
    } else {
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0f2fe');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid (lighter in day, darker in night)
    ctx.strokeStyle = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(186, 230, 253, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCountX; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= tileCountY; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw snake with smooth rounded segments
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 4;
        const radius = 8;
        
        // Calculate opacity fade for tail
        const opacity = 1 - (index / snake.length) * 0.5;
        
        // Draw shadow
        ctx.shadowColor = isDark ? 'rgba(22, 163, 74, 0.4)' : 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = isDark ? 18 : 10;
        ctx.shadowOffsetX = isDark ? 0 : 2;
        ctx.shadowOffsetY = isDark ? 0 : 2;
        
        // Main body with gradient (neon green in night, cyan in day)
        const bodyGradient = ctx.createLinearGradient(x, y, x + size, y + size);
        if (isDark) {
            if (index === 0) {
                bodyGradient.addColorStop(0, '#22c55e');
                bodyGradient.addColorStop(1, '#bbf7d0');
            } else {
                bodyGradient.addColorStop(0, `rgba(34, 197, 94, ${opacity})`);
                bodyGradient.addColorStop(1, `rgba(190, 242, 100, ${opacity * 0.8})`);
            }
        } else {
            if (index === 0) {
                bodyGradient.addColorStop(0, '#06b6d4');
                bodyGradient.addColorStop(1, '#0891b2');
            } else {
                bodyGradient.addColorStop(0, `rgba(6, 182, 212, ${opacity})`);
                bodyGradient.addColorStop(1, `rgba(8, 145, 178, ${opacity * 0.8})`);
            }
        }
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, size, size, radius);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Highlight on top
        const highlightGradient = ctx.createLinearGradient(x, y, x, y + size / 2);
        if (isDark) {
            highlightGradient.addColorStop(0, `rgba(190, 242, 100, ${0.5 * opacity})`);
            highlightGradient.addColorStop(1, 'rgba(190, 242, 100, 0)');
        } else {
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * opacity})`);
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, size, size / 2, [radius, radius, 0, 0]);
        ctx.fill();
        
        // Draw eyes on head
        if (index === 0) {
            const eyeSize = 6;
            const pupilSize = 3;
            let eye1X, eye1Y, eye2X, eye2Y;
            
            // Position eyes based on direction
            if (velocityX === 1) { // Moving right
                eye1X = x + size - 8;
                eye1Y = y + 8;
                eye2X = x + size - 8;
                eye2Y = y + size - 8;
            } else if (velocityX === -1) { // Moving left
                eye1X = x + 10;
                eye1Y = y + 8;
                eye2X = x + 10;
                eye2Y = y + size - 8;
            } else if (velocityY === -1) { // Moving up
                eye1X = x + 8;
                eye1Y = y + 10;
                eye2X = x + size - 8;
                eye2Y = y + 10;
            } else if (velocityY === 1) { // Moving down
                eye1X = x + 8;
                eye1Y = y + size - 8;
                eye2X = x + size - 8;
                eye2Y = y + size - 8;
            } else { // Not moving yet, default eyes
                eye1X = x + 8;
                eye1Y = y + 10;
                eye2X = x + size - 8;
                eye2Y = y + 10;
            }
            
            // Draw white of eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pupils
            ctx.fillStyle = isDark ? '#022c22' : '#0f172a';
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, pupilSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, pupilSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw food with pulsing glow
    const foodCenterX = foodX * gridSize + gridSize / 2;
    const foodCenterY = foodY * gridSize + gridSize / 2;
    const foodRadius = gridSize / 2 - 4;
    
    // Outer glow (neon green in dark, red in day)
    ctx.shadowColor = isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.4)';
    ctx.shadowBlur = isDark ? 28 : 20;

    // Food gradient
    const foodGradient = ctx.createRadialGradient(
        foodCenterX - foodRadius / 3,
        foodCenterY - foodRadius / 3,
        0,
        foodCenterX,
        foodCenterY,
        foodRadius
    );
    if (isDark) {
        foodGradient.addColorStop(0, '#bbf7d0');
        foodGradient.addColorStop(1, '#22c55e');
    } else {
        foodGradient.addColorStop(0, '#fca5a5');
        foodGradient.addColorStop(1, '#ef4444');
    }
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Highlight on food
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(foodCenterX - foodRadius / 3, foodCenterY - foodRadius / 3, foodRadius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw score with glass card
    const scoreWidth = 120;
    const scoreHeight = 50;
    const scoreX = 20;
    const scoreY = 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(scoreX, scoreY, scoreWidth, scoreHeight, 12);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(scoreX, scoreY, scoreWidth, scoreHeight, 12);
    ctx.stroke();
    
    ctx.fillStyle = isDark ? '#bbf7d0' : '#0891b2';
    ctx.font = '600 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(score, scoreX + scoreWidth / 2, scoreY + scoreHeight / 2 + 10);
    ctx.textAlign = 'left';
    
    // Draw game over screen as a rounded glass card
    if (gameOver) {
        const overlayColor = isDark
            ? 'rgba(2, 6, 23, 0.78)'
            : 'rgba(15, 23, 42, 0.25)';

        // Dimmed overlay
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Centered rounded container
        const cardWidth = 360;
        const cardHeight = 180;
        const cardX = (canvas.width - cardWidth) / 2;
        const cardY = (canvas.height - cardHeight) / 2;
        const cardRadius = 16; // closer to your button corner radius

        // Card background (glass effect) matching theme
        const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
        if (isDark) {
            // Dark theme: softer glass card in night palette
            cardGradient.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
            cardGradient.addColorStop(0.55, 'rgba(15, 23, 42, 0.88)');
            cardGradient.addColorStop(1, 'rgba(5, 14, 46, 0.85)');
        } else {
            // Light theme: similar to main card / button
            cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
            cardGradient.addColorStop(1, 'rgba(226, 232, 240, 0.96)');
        }

        ctx.shadowColor = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(148, 163, 184, 0.5)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 14;

        ctx.fillStyle = cardGradient;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();

        // Card border
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.65)' : 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.stroke();

        // Content
        const centerX = canvas.width / 2;
        let textY = cardY + 60;

        ctx.textAlign = 'center';
        ctx.fillStyle = isDark ? '#22c55e' : '#0891b2';
        ctx.font = '600 36px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('GAME OVER', centerX, textY);

        textY += 42;
        ctx.font = '400 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = isDark ? '#e5e7eb' : '#1f2933';
        ctx.fillText('Score: ' + score, centerX, textY);

        textY += 34;
        ctx.font = '300 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = isDark ? '#9ca3af' : '#64748b';
        ctx.fillText('Press RESTART to play again', centerX, textY);

        ctx.textAlign = 'left';
    }
}

// Place food randomly
function placeFood() {
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 100) {
        foodX = Math.floor(Math.random() * tileCountX);
        foodY = Math.floor(Math.random() * tileCountY);
        
        // Check if food position overlaps with snake
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                validPosition = false;
                break;
            }
        }
        attempts++;
    }
    
    console.log('Food placed at:', foodX, foodY, 'after', attempts, 'attempts');
}

// End game
function endGame() {
    gameOver = true;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    drawGame();
}

// Reset game
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    velocityX = 0;
    velocityY = 0;
    score = 0;
    gameOver = false;
    lastMoveTime = 0;
    placeFood();
    console.log('Game reset. Press arrow keys to start!');
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Start game
console.log('Snake game loaded! Press arrow keys to start playing.');
placeFood();
gameLoopId = requestAnimationFrame(gameLoop);


// Dark mode toggle
        const bodyEl = document.body;
        const darkToggleBtn = document.getElementById('darkModeToggle');
        const darkIcon = document.getElementById('darkModeIcon');
        const darkLabel = document.getElementById('darkModeLabel');

        darkToggleBtn.addEventListener('click', () => {
            const isDark = bodyEl.classList.toggle('dark');
            if (isDark) {
                darkIcon.textContent = '☀️';
                darkLabel.textContent = 'Day';
            } else {
                darkIcon.textContent = '🌙';
                darkLabel.textContent = 'Night';
            }
        });