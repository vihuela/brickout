// ============================================================
// Brick Out - procedural sound effects (WebAudio)
// ============================================================
(function () {
  let ctx = null;
  let master = null;
  let lastBounce = 0;

  function ensure() {
    if (!BO.store.sound) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // simple tone: freq slide, envelope
  function tone(f0, f1, dur, type, vol, delay) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, freq, q, delay) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const len = Math.max(1, (dur * c.sampleRate) | 0);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur);
  }

  BO.audio = {
    unlock() { ensure(); },
    click()  { tone(900, 500, 0.07, 'square', 0.12); },
    launch() { tone(300, 700, 0.05, 'square', 0.06); },
    bounce() {
      const now = performance.now();
      if (now - lastBounce < 30) return;   // throttle
      lastBounce = now;
      tone(BO.rand(380, 460), 220, 0.04, 'triangle', 0.05);
    },
    hit(combo) {
      const now = performance.now();
      if (now - lastBounce < 24) return;
      lastBounce = now;
      const f = 300 + Math.min(combo, 40) * 22;
      tone(f, f * 0.7, 0.05, 'triangle', 0.09);
    },
    brickBreak() {
      noise(0.12, 0.16, 2400, 0.8);
      tone(240, 90, 0.12, 'square', 0.10);
    },
    gem() {
      tone(1100, 1600, 0.09, 'sine', 0.12);
      tone(1650, 2200, 0.12, 'sine', 0.10, 0.06);
    },
    plusBall() { tone(700, 1100, 0.08, 'square', 0.10); },
    lightning() {
      noise(0.28, 0.24, 1700, 0.6);
      tone(1600, 120, 0.26, 'sawtooth', 0.12);
    },
    hammer() {
      noise(0.22, 0.30, 400, 0.7);
      tone(150, 45, 0.28, 'square', 0.22);
    },
    combo(i) {
      const base = 500 + i * 90;
      tone(base, base * 1.5, 0.14, 'square', 0.10);
      tone(base * 1.26, base * 1.9, 0.16, 'square', 0.09, 0.05);
      noise(0.16, 0.06, 3200, 1.2);
    },
    star(i) { tone(700 + i * 200, 1000 + i * 260, 0.14, 'triangle', 0.14); },
    win() {
      const seq = [523, 659, 784, 1046];
      seq.forEach((f, i) => tone(f, f, 0.16, 'square', 0.11, i * 0.11));
      tone(1318, 1318, 0.4, 'triangle', 0.10, 0.46);
    },
    lose() {
      const seq = [420, 340, 260, 180];
      seq.forEach((f, i) => tone(f, f * 0.92, 0.2, 'sawtooth', 0.08, i * 0.14));
    },
  };
})();
