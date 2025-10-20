const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1080;

const ui = document.getElementById('ui');
const messageEl = document.getElementById('message');

let images = {};
let phase = 0; // 0 = splash, 1 = explore, 2 = mini-game
let lastTime = 0;
let splashDuration = 3000;
let keys = {};

let score = 0;
let toys = [];

// player setup
const player = { x: 900, y: 500, w: 140, h: 180, speed: 400, color: '#4af' };

// Only one active (invisible) gate
const gates = [
  { x: 105, y: 765, w: 80, h: 190, color: '#f6d31a' }
];


let gameTime = 50; // seconds per mini-game
let timeLeft = gameTime;
let timerActive = false;

const bgMusic = new Audio('assets/sakura-117030.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // adjust loudness



// images to load
const imgList = [
  'assets/player.png',
  'assets/Background1.png',
  'assets/Background2.png',
  'assets/TreeGame.png',
  'assets/toy1.png',
  'assets/toy2.png',
  'assets/toy3.png'
];

// simple image loader
function loadImages(list, callback) {
  let loaded = 0;
  list.forEach(name => {
    const img = new Image();
    img.src = name;
    img.onload = () => {
      loaded++;
      const key = name.split('/').pop().split('.')[0];
      images[key] = img;
      if (loaded === list.length) callback();
    };
  });
    // Play background music when user interacts (required by browsers)
    document.body.addEventListener('click', () => {
      bgMusic.play();
    }, { once: true });
  
    setTimeout(startMainGame, splashDuration);
    requestAnimationFrame(loop);
}

// -------------------- HITBOX FUNCTIONS --------------------
function getPlayerHitbox() {
  const scale = phase === 2 ? 1.3 : 0.7; // increase size by 30% in mini-game
  return {
    x: player.x + 10,
    y: phase === 2 ? player.y - (images.player.height * scale - player.h) + 5 : player.y + 5,
    w: player.w * scale - 20,
    h: player.h * scale - 10
  };
}

function getToyHitbox(toy) {
  return {
    x: toy.x + 10,
    y: toy.y + 10,
    w: toy.w - 20,
    h: toy.h - 20
  };
}

// -------------------- DRAW --------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  if (phase === 0 && images.Background1)
    ctx.drawImage(images.Background1, 0, 0, canvas.width, canvas.height);
  else if (phase === 1 && images.Background2)
    ctx.drawImage(images.Background2, 0, 0, canvas.width, canvas.height);
  else if (phase === 2 && images.TreeGame)
    ctx.drawImage(images.TreeGame, 0, 0, canvas.width, canvas.height);

  // draw toys in mini-game
  if (phase === 2) {
    for (const toy of toys) {
      const img = images[toy.type];
      if (img) ctx.drawImage(img, toy.x, toy.y, toy.w, toy.h);
      else {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(toy.x, toy.y, toy.w, toy.h);
      }
    }

    // draw score at top-left
// ------------------- FANTASY-STYLE SCORE & TIMER -------------------
const gradientScore = ctx.createLinearGradient(0, 0, 0, 100);
gradientScore.addColorStop(0, '#fdfbd3');   // light golden top
gradientScore.addColorStop(1, '#c6a34f');   // deep golden bottom

const gradientTime = ctx.createLinearGradient(0, 0, 0, 100);
gradientTime.addColorStop(0, '#c4f5c0');   // mint top
gradientTime.addColorStop(1, '#2e8b57');   // forest green bottom

// Shadow glow (soft fantasy effect)
ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
ctx.shadowBlur = 15;

// Draw Score
ctx.font = 'bold 64px "Papyrus", "Cinzel Decorative", serif';
ctx.textAlign = 'left';
ctx.fillStyle = gradientScore;
ctx.fillText(`🌸 Score: ${score}`, 80, 80);

// Draw Timer (with magic frame)
ctx.textAlign = 'right';
ctx.fillStyle = gradientTime;
ctx.fillText(`⏳ ${timeLeft}s left`, canvas.width - 80, 80);

// Subtle sparkle effect behind text (optional)
ctx.shadowColor = 'rgba(255,255,255,0.5)';
ctx.shadowBlur = 5;
ctx.strokeStyle = 'rgba(255,255,255,0.4)';
ctx.lineWidth = 2;
ctx.strokeText(`🌸 Score: ${score}`, 80, 80);
ctx.strokeText(`⏳ ${timeLeft}s left`, canvas.width - 80, 80);

// Reset shadows for next draws
ctx.shadowBlur = 0;

// Draw glowing time bar
const barWidth = 400;
const barHeight = 20;
const barX = canvas.width - barWidth - 80;
const barY = 100;

const timeRatio = timeLeft / gameTime;
const barGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
barGradient.addColorStop(0, '#6af55b');
barGradient.addColorStop(1, '#1c7c33');

ctx.fillStyle = 'rgba(255,255,255,0.2)';
ctx.fillRect(barX, barY, barWidth, barHeight); // background
ctx.fillStyle = barGradient;
ctx.fillRect(barX, barY, barWidth * timeRatio, barHeight); // remaining time
ctx.strokeStyle = 'rgba(255,255,255,0.5)';
ctx.lineWidth = 2;
ctx.strokeRect(barX, barY, barWidth, barHeight);





  }



  // draw player
  if (phase >= 1 && images.player) {
    const scale = phase === 2 ? 1.3 : 0.7;
    const width = images.player.width * scale;
    const height = images.player.height * scale;

    let drawY = player.y;
    if (phase === 2) {
      drawY = player.y - (height - player.h); // stand on floor
    }

    ctx.drawImage(images.player, player.x, drawY, width, height);
  } else if (phase >= 1) {
    const scale = phase === 2 ? 1.3 : 0.7;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w * scale, player.h * scale);
  }

    

}

// -------------------- UPDATE --------------------
function update(dt) {
  // MINI-GAME
  if (phase === 2) {
    let vx = 0;
    if (keys['ArrowLeft'] || keys['a']) vx = -1;
    if (keys['ArrowRight'] || keys['d']) vx = 1;
    player.x += vx * player.speed * dt;

    // keep player in screen
    player.x = Math.max(0, Math.min(canvas.width - player.w * 1.3, player.x));
    const playerBox = getPlayerHitbox();

    for (const toy of toys) {
      toy.y += toy.speed * dt; // move down
    
      const toyBox = getToyHitbox(toy);
    
      // check collision with player
      if (
        playerBox.x < toyBox.x + toyBox.w &&
        playerBox.x + playerBox.w > toyBox.x &&
        playerBox.y < toyBox.y + toyBox.h &&
        playerBox.y + playerBox.h > toyBox.y
      ) {
        toy.y = canvas.height + 100; // move toy off-screen after collision
        score++;
      }
    
      // reset toy if it falls below the screen
      if (toy.y > canvas.height) {
        toy.y = Math.random() * -300;
        toy.x = Math.random() * (canvas.width - toy.w);
      }
    }
    
    return;
  }

  // MAIN EXPLORATION PHASE
  if (phase !== 1) return;

  let vx = 0, vy = 0;
  if (keys['ArrowUp'] || keys['w']) vy = -1;
  if (keys['ArrowDown'] || keys['s']) vy = 1;
  if (keys['ArrowLeft'] || keys['a']) vx = -1;
  if (keys['ArrowRight'] || keys['d']) vx = 1;

  const len = Math.hypot(vx, vy);
  if (len) { vx /= len; vy /= len; }

  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;

  // boundaries
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

  // gate collision
  const g = gates[0];
  if (
    player.x < g.x + g.w &&
    player.x + player.w > g.x &&
    player.y < g.y + g.h &&
    player.y + player.h > g.y
  ) {
    startMiniGame();
  }
}

// -------------------- MAIN LOOP --------------------
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// -------------------- TRANSITIONS --------------------
function startMainGame() {
  phase = 1;
  messageEl.style.display = 'none';
}

function startMiniGame() {
  if (phase !== 1) return;
  phase = 2;
  score = 0;
  toys = [];

  timeLeft = gameTime;
timerActive = true;
const timerInterval = setInterval(() => {
  if (timerActive) {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timerActive = false;
      clearInterval(timerInterval);
      endMiniGame();
    }
  }
}, 1000);



  
  // Move player to bottom
  player.y = canvas.height - player.h;
  player.x = canvas.width / 2 - player.w / 2;

// Create 6 toys with fixed size 250px
for (let i = 0; i < 6; i++) {
    const toyType = ['toy1', 'toy2', 'toy3'][Math.floor(Math.random() * 3)];
  
    toys.push({
      type: toyType,
      x: Math.random() * (canvas.width - 150),
      y: Math.random() * -500,
      w: 150,
      h: 150,
      speed: 200 + Math.random() * 100
    });
  }
  
  
  setTimeout(() => {
    phase = 1;
    messageEl.textContent = `You caught ${score} toys!`;
    messageEl.style.display = 'block';
    player.x = 900;
    player.y = 500;
    setTimeout(() => messageEl.style.display = 'none', 6000);
  }, 50000);
}

function endMiniGame() {
  phase = 1;
  messageEl.textContent = `You caught ${score} toys!`;
  messageEl.style.display = 'block';
  player.x = 900;
  player.y = 500;
  setTimeout(() => messageEl.style.display = 'none', 6000);
}

// -------------------- KEYBOARD --------------------
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// -------------------- INIT --------------------
loadImages(imgList, () => {
  ui.textContent = 'Loading complete';
  phase = 0;
  messageEl.textContent = 'Welcome! The game will start shortly...';
  messageEl.style.display = 'block';
  setTimeout(startMainGame, splashDuration);
  requestAnimationFrame(loop);
});

// -------------------- RESPONSIVE --------------------
(function makeResponsive() {
  const stage = document.getElementById('stage');
  const baseWidth = 1920;
  const baseHeight = 1080;

  function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const stageRatio = baseWidth / baseHeight;

    let scale, offsetX = 0, offsetY = 0;

    if (windowRatio > stageRatio) {
      // Window is wider than game — add vertical bars
      scale = windowHeight / baseHeight;
      offsetX = (windowWidth - baseWidth * scale) / 2;
    } else {
      // Window is taller — add horizontal bars
      scale = windowWidth / baseWidth;
      offsetY = (windowHeight - baseHeight * scale) / 2;
    }

    stage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  window.addEventListener('resize', resize);
  resize();
})();
