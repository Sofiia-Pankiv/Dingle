const canvas = document.getElementById('gameCanvas');

if (phase === 1) {
const g = gateRect;
ctx.save();
ctx.shadowColor = 'rgba(255,200,80,0.9)';
ctx.shadowBlur = 30;
ctx.fillStyle = 'rgba(255,230,120,0.12)';
ctx.fillRect(g.x, g.y, g.w, g.h);
ctx.strokeStyle = 'rgba(255,230,120,0.9)';
ctx.lineWidth = 4;
ctx.strokeRect(g.x, g.y, g.w, g.h);
ctx.restore();
}
if (phase === 2) {
items.forEach(it => {
if (!it.collected) {
if (images.coin) ctx.drawImage(images.coin, it.x, it.y, it.w, it.h);
else {
ctx.beginPath();
ctx.arc(it.x + it.w / 2, it.y + it.h / 2, it.w / 2, 0, Math.PI * 2);
ctx.fillStyle = '#ffdd33';
ctx.fill();
ctx.strokeStyle = '#aa8800';
ctx.stroke();
}
}
});
}
if (images.player) ctx.drawImage(images.player, player.x, player.y, player.w, player.h);
else {
ctx.fillStyle = player.color;
ctx.fillRect(player.x, player.y, player.w, player.h);
}
if (phase === 2) {
const left = items.filter(i => !i.collected).length;
ctx.fillStyle = 'rgba(0,0,0,0.4)';
ctx.fillRect(14, 14, 240, 48);
ctx.fillStyle = '#fff';
ctx.font = '24px Arial';
ctx.fillText('Items left: ' + left, 28, 46);
}



function loop(ts) {
if (!lastTime) lastTime = ts;
const dt = Math.min(0.05, (ts - lastTime) / 1000);
lastTime = ts;
update(dt);
draw();
requestAnimationFrame(loop);
}


loadImages(imgList, () => {
ui.textContent = 'Preparing...';
if (images.player) player.useSprite = true;
phase = 0;
ui.textContent = 'Splash - showing background';
showMessage('Welcome! The game will start shortly...');
setTimeout(() => { messageEl.style.display = 'none'; startGameA(); }, splashDuration);
requestAnimationFrame(loop);
});


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