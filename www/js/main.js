// ============================================================
// Brick Out - bootstrap, main loop, input
// ============================================================
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = BO.CFG.W, H = 1600;
  let cssW = 1, cssH = 1;
  let scene = null;
  let errMsg = null;

  window.onerror = function (msg, src, line) {
    errMsg = msg + ' @' + (src || '').split('/').pop() + ':' + line;
    return false;
  };

  function readSafeArea() {
    const cs = getComputedStyle(document.documentElement);
    const sat = parseFloat(cs.getPropertyValue('--sat')) || 0;
    const sab = parseFloat(cs.getPropertyValue('--sab')) || 0;
    BO.safeTop = Math.max(sat, 14);
    BO.safeBottom = Math.max(sab, 8);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const scale = canvas.width / BO.CFG.W;
    W = BO.CFG.W;
    H = canvas.height / scale;
    BO.viewH = H;             // logical height, used by level gen to fit rows
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    readSafeArea();
  }
  window.addEventListener('resize', resize);
  resize();

  BO.go = function (name, param, mode) {
    BO.fx.reset();
    if (name === 'title') scene = new BO.TitleScene();
    else if (name === 'game') scene = new BO.GameScene(param || 1, mode || 'classic');
    BO.currentScene = scene;
  };

  // ---------- input ----------
  function toLogical(e) {
    return { x: e.clientX * (W / cssW), y: e.clientY * (W / cssW) };
  }
  let pointerActive = false;
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    BO.audio.unlock();
    pointerActive = true;
    const p = toLogical(e);
    if (scene) scene.pointer('down', p.x, p.y);
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointerActive) return;
    const p = toLogical(e);
    if (scene) scene.pointer('move', p.x, p.y);
  });
  window.addEventListener('pointerup', e => {
    if (!pointerActive) return;
    pointerActive = false;
    const p = toLogical(e);
    if (scene) scene.pointer('up', p.x, p.y);
  });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- debug hooks (headless screenshots) ----------
  const qs = new URLSearchParams(location.search);
  BO.debugAuto = qs.get('auto') === '1';

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 1 / 25);
    if (window.innerWidth !== cssW || window.innerHeight !== cssH) resize();
    if (scene) {
      try {
        scene.update(dt, H);
        scene.draw(ctx, W, H);
      } catch (err) {
        errMsg = (err && err.stack ? err.stack : '' + err).split('\n').slice(0, 2).join(' ');
        console.error(err);
      }
    }
    if (errMsg) {
      ctx.save();
      ctx.setTransform(canvas.width / W, 0, 0, canvas.width / W, 0, 0);
      ctx.fillStyle = 'rgba(180,20,20,0.9)';
      ctx.fillRect(0, 0, W, 90);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(errMsg.slice(0, 70), 10, 30);
      ctx.fillText(errMsg.slice(70, 140), 10, 60);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }

  // start
  if (qs.get('scene') === 'game') {
    BO.go('game', parseInt(qs.get('level') || '1', 10), qs.get('mode') || 'classic');
  } else {
    BO.go('title');
  }
  requestAnimationFrame(frame);
})();
