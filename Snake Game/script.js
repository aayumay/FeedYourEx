const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startMessage = document.getElementById('startMessage');

const gridSize = 20;
const tileCount = Math.floor(canvas.width / gridSize);

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 1, dy = 0;
let score = 0;
let gameRunning = false;
let gameLoopInterval;

// Touch support
let touchStartX = 0, touchStartY = 0;

// Background snakes
const numBackgroundSnakes = 8;
let backgroundSnakes = [];

// Initialize background snakes
function initBackgroundSnakes() {
    backgroundSnakes = [];
    for (let i = 0; i < numBackgroundSnakes; i++) {
        backgroundSnakes.push({
            body: [{ x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }],
            dx: Math.random() < 0.5 ? 1 : -1,
            dy: Math.random() < 0.5 ? 1 : -1,
            length: Math.floor(Math.random() * 5) + 3,
            color: `rgba(0,255,100,${Math.random()*0.3 + 0.2})`
        });
    }
}
// Auto-restart 
(function() {
    let restarting = false;

    function restartGame() {
        if (gameRunning || restarting) return;
        restarting = true;

        snake = [{ x: 10, y: 10 }];
        dx = 1; dy = 0;
        score = 0;
        if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;

        generateFood();
        initBackgroundSnakes();

        startMessage.style.display = 'none';
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, 100);
        gameRunning = true;

        setTimeout(() => { restarting = false; }, 150);
    }

    function tryRestartFromInput(e) {
        if (!gameRunning) restartGame();
    }

    document.addEventListener('keydown', tryRestartFromInput);
    document.addEventListener('mousedown', tryRestartFromInput);
    document.addEventListener('touchend', function(e) {
        if (!gameRunning) {
            restartGame();
            
            e.preventDefault && e.preventDefault();
        }
    }, { passive: false });
})();

function moveBackgroundSnakes() {
    for (let s of backgroundSnakes) {
        const head = { x: s.body[0].x + s.dx, y: s.body[0].y + s.dy };
        if (head.x < 0) head.x = tileCount - 1;
        if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        if (head.y >= tileCount) head.y = 0;

        s.body.unshift(head);
        if (s.body.length > s.length) s.body.pop();

        if (Math.random() < 0.02) {
            const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
            const newDir = dirs[Math.floor(Math.random()*dirs.length)];
            s.dx = newDir.dx;
            s.dy = newDir.dy;
        }
    }
}


function drawGame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let s of backgroundSnakes) {
        ctx.fillStyle = s.color;
        s.body.forEach(seg => ctx.fillRect(seg.x*gridSize, seg.y*gridSize, gridSize-2, gridSize-2));
    }

    ctx.fillStyle = '#0f0';
    snake.forEach(seg => ctx.fillRect(seg.x*gridSize, seg.y*gridSize, gridSize-2, gridSize-2));

    ctx.fillStyle = '#f00';
    ctx.fillRect(food.x*gridSize, food.y*gridSize, gridSize-2, gridSize-2);
}

// Move player snake
function moveSnake() {
    if (!gameRunning) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); 

    let collision = false;
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) collision = true;
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) collision = true;
    }

    if (collision) {
        gameOver();
        return;
    }


    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        generateFood();
    } else {
        snake.pop();
    }
}


let _prevGameRunning = gameRunning;
function _drawEndReason() {
    if (_prevGameRunning && !gameRunning) {
        const head = snake[0];
        let reason = 'You Died!';
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            reason = 'You lost -- hit the wall';
        } else {
            for (let i = 1; i < snake.length; i++) {
                if (snake[i].x === head.x && snake[i].y === head.y) {
                    reason = 'You died -- hit yourself';
                    break;
                }
            }
        }

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 8;
        ctx.fillText(reason, canvas.width / 2, canvas.height / 2 + 80);
        ctx.shadowBlur = 0;
    }
    _prevGameRunning = gameRunning;
}
setInterval(_drawEndReason, 50);

function generateFood() {
    let newFood;
    do {
        newFood = { x: Math.floor(Math.random()*tileCount), y: Math.floor(Math.random()*tileCount) };
    } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    food = newFood;
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopInterval);
    drawGame();

    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillText('You Died!', canvas.width/2, canvas.height/2);
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 40);
}

// Main game loop
function gameLoop() {
    moveBackgroundSnakes();
    moveSnake();
    drawGame();
}

// Input
function changeDirection(event) {
    if (!gameRunning) startGame();
    const key = event.keyCode;
    if ((key===37||key===65)&&dx!==1){dx=-1;dy=0;}
    if ((key===38||key===87)&&dy!==1){dx=0;dy=-1;}
    if ((key===39||key===68)&&dx!==-1){dx=1;dy=0;}
    if ((key===40||key===83)&&dy!==-1){dx=0;dy=1;}
}

// Touch controls
function handleTouchStart(e){touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY;}
function handleTouchEnd(e){
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if(Math.abs(deltaX)>Math.abs(deltaY)){
        if(deltaX>50&&dx!==-1){dx=1;dy=0;}
        else if(deltaX<-50&&dx!==1){dx=-1;dy=0;}
    } else{
        if(deltaY>50&&dy!==-1){dx=0;dy=1;}
        else if(deltaY<-50&&dy!==1){dx=0;dy=-1;}
    }
    if(!gameRunning) startGame();
    touchStartX=0; touchStartY=0;
}

// Start game
function startGame(){
    if(!gameRunning){
        gameRunning=true;
        startMessage.style.display='none';
        gameLoopInterval=setInterval(gameLoop,100);
    }
}

// Events
document.addEventListener('keydown', changeDirection);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);

// Initialize
initBackgroundSnakes();
drawGame();

// High score
const highScoreKey = 'snakeHighScore';
let highScore = parseInt(localStorage.getItem(highScoreKey), 10) || 0;

const highScoreDisplay = document.createElement('div');
highScoreDisplay.id = 'highScoreDisplay';
highScoreDisplay.style.color = 'rgba(132, 189, 189, 1)';
highScoreDisplay.style.font = '16px Arial';
highScoreDisplay.style.marginTop = '4px';
highScoreDisplay.style.userSelect = 'none';
highScoreDisplay.textContent = `High Score: ${highScore}`;
if (scoreDisplay && scoreDisplay.parentNode) {
    scoreDisplay.parentNode.insertBefore(highScoreDisplay, scoreDisplay.nextSibling);
} else {
    document.body.appendChild(highScoreDisplay);
}

function setHighScoreIfNeeded(newScore) {
    if (newScore > highScore) {
        highScore = newScore;
        localStorage.setItem(highScoreKey, String(highScore));
        highScoreDisplay.textContent = `High Score: ${highScore}`;
        highScoreDisplay.style.transition = 'transform 0.12s ease, color 0.25s';
        highScoreDisplay.style.transform = 'scale(1.1)';
        highScoreDisplay.style.color = '#ff0';
        setTimeout(() => {
            highScoreDisplay.style.transform = '';
            highScoreDisplay.style.color = 'rgba(118, 185, 185, 1)';
        }, 300);
    }
}

if (typeof moveSnake === 'function') {
    const _origMoveSnake = moveSnake;
    moveSnake = function () {
        const oldScore = score;
        _origMoveSnake();
        if (score !== oldScore) setHighScoreIfNeeded(score);
    };
}

if (typeof gameOver === 'function') {
    const _origGameOver = gameOver;
    gameOver = function () {
        setHighScoreIfNeeded(score);
        _origGameOver();
    };
}
