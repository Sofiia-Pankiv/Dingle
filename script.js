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
const player = { x: 900, y: 500, w: 60, h: 60, speed: 400, color: '#4af' };

// Only one active (invisible) gate
const gates = [
  { x: 105, y: 765, w: 80, h: 190, color: '#f6d31a' }
];

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
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 50, 60);
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
  function resize() {
    const maxW = window.innerWidth - 20;
    const maxH = window.innerHeight - 20;
    const scale = Math.min(maxW / 1920, maxH / 1080);
    stage.style.transform = `scale(${scale})`;
    stage.style.transformOrigin = 'center top';
  }
  window.addEventListener('resize', resize);
  resize();
})();
