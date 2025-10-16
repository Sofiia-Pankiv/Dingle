const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const messageEl = document.getElementById('message');

let images = {};
let phase = 0; // 0 = splash, 1 = explore, 2 = mini-game
let lastTime = 0;
let splashDuration = 3000;
let keys = {};

// player setup
const player = { x: 900, y: 500, w: 60, h: 60, speed: 400, color: '#4af' };

// Only one active (invisible) gate
const gates = [
  { x: 105, y: 765, w: 80, h: 190, color: '#f6d31a' } // lowest-left gate
];

// images to load
const imgList = [
  'assets/player.png',
  'assets/Background1.png',
  'assets/Background2.png'
];

// simple image loader
function loadImages(list, callback) {
  let loaded = 0;
  list.forEach(name => {
    const img = new Image();
    img.src = name;
    img.onload = () => {
      loaded++;
      // extract file name without path and extension
      const key = name.split('/').pop().split('.')[0];
      images[key] = img;
      if (loaded === list.length) callback();
    };
  });
}

// draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  if (phase === 0 && images.Background1)
    ctx.drawImage(images.Background1, 0, 0, canvas.width, canvas.height);
  else if (phase >= 1 && images.Background2)
    ctx.drawImage(images.Background2, 0, 0, canvas.width, canvas.height);

  // gates are invisible (still active, just not drawn)
  // no drawing code for gates here

  // player (only visible during main game or mini-game)
  if (phase >= 1 && images.player) {
    const scale = 0.7; // 70% size (30% smaller)
    const width = images.player.width * scale;
    const height = images.player.height * scale;
    ctx.drawImage(images.player, player.x, player.y, width, height);
  } else if (phase >= 1) {
    // fallback square while image loads
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w * 0.7, player.h * 0.7);
  }

  // mini-game overlay
  if (phase === 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '64px Arial';
    ctx.fillText('Mini-Game Started!', 600, 540);
  }
}

// update movement & collision
function update(dt) {
  if (phase !== 1) return;

  let vx = 0, vy = 0;
  if (keys['ArrowUp'] || keys['w']) vy = -1;
  if (keys['ArrowDown'] || keys['s']) vy = 1;
  if (keys['ArrowLeft'] || keys['a']) vx = -1;
  if (keys['ArrowRight'] || keys['d']) vx = 1;

  const len = Math.hypot(vx, vy);
  if (len) {
    vx /= len;
    vy /= len;
  }

  player.x += vx * player.speed * dt;
  player.y += vy * player.speed * dt;

  // boundaries
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

  // collision with the only gate
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

// loop
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// transitions
function startMainGame() {
  phase = 1;
  messageEl.style.display = 'none';
}

function startMiniGame() {
  if (phase !== 1) return;
  phase = 2;
  messageEl.textContent = 'Mini-game started!';
  messageEl.style.display = 'block';
  // Placeholder mini-game: show message for 3 seconds then return
  setTimeout(() => {
    messageEl.style.display = 'none';
    phase = 1;
    player.x = 900;
    player.y = 500;
  }, 3000);
}

// keyboard
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// init
loadImages(imgList, () => {
  ui.textContent = 'Loading complete';
  phase = 0;
  messageEl.textContent = 'Welcome! The game will start shortly...';
  messageEl.style.display = 'block';
  setTimeout(startMainGame, splashDuration);
  requestAnimationFrame(loop);
});

// responsive scaling
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
