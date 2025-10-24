const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1080;

const introVideo = document.getElementById('introVideo');
const ui = document.getElementById('ui');
const messageEl = document.getElementById('message');

const resultScreen = document.getElementById('resultScreen');
const resultText = document.getElementById('resultText');
const playAgainBtn = document.getElementById('playAgainBtn');
const goBackBtn = document.getElementById('goBackBtn');

let timerInterval = null;
let images = {};
let phase = 1; // start directly in exploration
let lastTime = 0;
let keys = {};

let score = 0;
let toys = [];

// player setup
const player = { x: 900, y: 500, w: 140, h: 180, speed: 400, color: '#4af', direction: 'idle' };

// gate to enter mini-game
const gates = [{ x: 105, y: 765, w: 80, h: 190, color: '#f6d31a' }];

let gameTime = 50;
let timeLeft = gameTime;
let timerActive = false;

const bgMusic = new Audio('assets/sakura-117030.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

let startHint = "Try the first left tent! ⬅️";
let hintTimer = 3; // how long to show in seconds


// ---------- START SCREEN & INTRO VIDEO ----------
const startScreen = document.getElementById('startScreen');
startScreen.addEventListener('click', () => {
  startScreen.style.display = 'none';
  canvas.style.display = 'none';
  ui.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();

  introVideo.addEventListener('ended', () => {
    introVideo.style.display = 'none';
    canvas.style.display = 'block';
    ui.style.display = 'block';

    if (bgMusic) bgMusic.play();

    phase = 1; // start in exploration phase directly
    lastTime = performance.now();
    requestAnimationFrame(loop);
  });
});

// ---------- IMAGE LOADING ----------
const imgList = [
  'assets/player_idle.png',
  'assets/player_right.png',
  'assets/player_left.png',
  'assets/Background2.png',
  'assets/TreeGame.png',
  'assets/toy1.png',
  'assets/toy2.png',
  'assets/toy3.png'
];

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

  // Allow background music to start only after user click (browser requirement)
  document.body.addEventListener('click', () => bgMusic.play(), { once: true });
}

// ---------- DRAW ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  // backgrounds
  if (phase === 1 && images.Background2)
    ctx.drawImage(images.Background2, 0, 0, canvas.width, canvas.height);
  else if (phase === 2 && images.TreeGame)
    ctx.drawImage(images.TreeGame, 0, 0, canvas.width, canvas.height);

if (phase === 1 && hintTimer > 0) {
    const gradientMsg = ctx.createLinearGradient(0, 0, 0, 100);
    gradientMsg.addColorStop(0, '#fdfbd3');
    gradientMsg.addColorStop(1, '#4f3800ff');

    ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
    ctx.shadowBlur = 15;

    ctx.font = 'bold 64px "Papyrus", "Cinzel Decorative", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = gradientMsg;
    ctx.fillText(startHint, canvas.width / 2, 150);

    ctx.shadowBlur = 0;
}


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

    // fancy score + timer UI
    const gradientScore = ctx.createLinearGradient(0, 0, 0, 100);
    gradientScore.addColorStop(0, '#fdfbd3');
    gradientScore.addColorStop(1, '#c6a34f');

    const gradientTime = ctx.createLinearGradient(0, 0, 0, 100);
    gradientTime.addColorStop(0, '#c4f5c0');
    gradientTime.addColorStop(1, '#2e8b57');

    ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
    ctx.shadowBlur = 15;

    ctx.font = 'bold 64px "Papyrus", "Cinzel Decorative", serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = gradientScore;
    ctx.fillText(`🌸 Score: ${score}`, 80, 80);

    ctx.textAlign = 'right';
    ctx.fillStyle = gradientTime;
    ctx.fillText(`⏳ ${timeLeft}s left`, canvas.width - 80, 80);

    ctx.shadowBlur = 0;
  }

  // draw player
  if (phase >= 1) {
    const scale = phase === 2 ? 1.3 : 0.7;
    const width = images.player_idle.width * scale;
    const height = images.player_idle.height * scale;

    let drawY = player.y;
    if (phase === 2) drawY = player.y - (height - player.h);

    let currentSprite = images.player_idle;
    if (player.direction === 'right') currentSprite = images.player_right;
    else if (player.direction === 'left') currentSprite = images.player_left;

    ctx.drawImage(currentSprite, player.x, drawY, width, height);
  }
}


// ---------- HITBOX HELPERS ----------
function getPlayerHitbox() {
  const scale = phase === 2 ? 1.3 : 0.7;
  const width = images.player_idle.width * scale;
  const height = images.player_idle.height * scale;
  const drawY = phase === 2 ? player.y - (height - player.h) : player.y;
  return { x: player.x, y: drawY, w: width, h: height };
}

function getToyHitbox(toy) {
  return { x: toy.x, y: toy.y, w: toy.w, h: toy.h };
}


// ---------- UPDATE ----------
function update(dt) {
if (phase === 1 && hintTimer > 0) {
    hintTimer -= dt;
    if (hintTimer < 0) hintTimer = 0;
}


  if (phase === 2) {
    let vx = 0;
    if (keys['ArrowLeft'] || keys['a']) vx = -1;
    if (keys['ArrowRight'] || keys['d']) vx = 1;
    player.x += vx * player.speed * dt;

    if (vx > 0) player.direction = 'right';
    else if (vx < 0) player.direction = 'left';
    else player.direction = 'idle';

    player.x = Math.max(0, Math.min(canvas.width - player.w * 1.3, player.x));

    const playerBox = getPlayerHitbox();
    for (const toy of toys) {
      toy.y += toy.speed * dt;
      const toyBox = getToyHitbox(toy);
      if (
        playerBox.x < toyBox.x + toyBox.w &&
        playerBox.x + playerBox.w > toyBox.x &&
        playerBox.y < toyBox.y + toyBox.h &&
        playerBox.y + playerBox.h > toyBox.y
      ) {
        toy.y = canvas.height + 100;
        score++;
      }
      if (toy.y > canvas.height) {
        toy.y = Math.random() * -300;
        toy.x = Math.random() * (canvas.width - toy.w);
      }
    }
    return;
  }

  if (phase === 1) {
    let vx = 0, vy = 0;
    if (keys['ArrowUp'] || keys['w']) vy = -1;
    if (keys['ArrowDown'] || keys['s']) vy = 1;
    if (keys['ArrowLeft'] || keys['a']) vx = -1;
    if (keys['ArrowRight'] || keys['d']) vx = 1;

    const len = Math.hypot(vx, vy);
    if (len) { vx /= len; vy /= len; }

    player.x += vx * player.speed * dt;
    player.y += vy * player.speed * dt;

    if (vx > 0) player.direction = 'right';
    else if (vx < 0) player.direction = 'left';
    else player.direction = 'idle';
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

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

// ---------- LOOP ----------
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- MINI-GAME ----------
function startMiniGame() {
  if (phase !== 1 && phase !== 3) return;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  phase = 2;
  score = 0;
  toys = [];
  timeLeft = gameTime;
  timerActive = true;

  timerInterval = setInterval(() => {
    if (timerActive) {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        timerActive = false;
        clearInterval(timerInterval);
        timerInterval = null;
        endMiniGame();
      }
    }
  }, 1000);

  player.y = canvas.height - player.h;
  player.x = canvas.width / 2 - player.w / 2;

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
}

function endMiniGame() {
  phase = 3;
  timerActive = false;
  resultText.textContent = `You caught ${score} toys!`;
  resultScreen.style.display = 'flex';
}

playAgainBtn.addEventListener('click', () => {
  resultScreen.style.display = 'none';
  startMiniGame();
});

goBackBtn.addEventListener('click', () => {
  resultScreen.style.display = 'none';
  phase = 1;
  player.x = 900;
  player.y = 500;
});

// ---------- INPUT ----------
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// ---------- INIT ----------
loadImages(imgList, () => {
  ui.textContent = 'Loading complete';
});

// ---------- RESPONSIVE ----------
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
      scale = windowHeight / baseHeight;
      offsetX = (windowWidth - baseWidth * scale) / 2;
    } else {
      scale = windowWidth / baseWidth;
      offsetY = (windowHeight - baseHeight * scale) / 2;
    }
    stage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  window.addEventListener('resize', resize);
  resize();
})();
