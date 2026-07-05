// ============================================================
// Brick Out - rendering helpers (textures, widgets, logo)
// ============================================================
(function () {
  const R = {};
  BO.R = R;

  R.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // ---------- color utils ----------
  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  R.shade = function (hex, f) { // f: -1..1
    const [r, g, b] = hexToRgb(hex);
    const t = f < 0 ? 0 : 255;
    const p = Math.abs(f);
    const c = v => Math.round(BO.lerp(v, t, p));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  };
  R.rgba = function (hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  // ---------- brick texture (cached) ----------
  // shape: 'rect' | 'bl' | 'br' | 'tl' | 'tr'  (triangle solid corner)
  // Candy-glass look: deep base, chamfered 3D edges, curved gloss band,
  // inner rim light and a corner sparkle.
  const texCache = {};
  R.brickTex = function (color, w, h, shape) {
    const key = color + '_' + (w | 0) + '_' + (h | 0) + '_' + shape;
    let cv = texCache[key];
    if (cv) return cv;
    const S = 2; // supersample
    cv = document.createElement('canvas');
    cv.width = Math.max(2, (w * S) | 0);
    cv.height = Math.max(2, (h * S) | 0);
    const c = cv.getContext('2d');
    c.scale(S, S);
    const r = Math.min(12, w * 0.14);
    const bev = Math.max(4, w * 0.075);   // chamfer width

    function shapePath(inset, rad) {
      c.beginPath();
      const i = inset;
      if (shape === 'rect') {
        R.roundRect(c, i, i, w - i * 2, h - i * 2, rad);
      } else {
        if (shape === 'bl') { c.moveTo(i, i * 1.6); c.lineTo(i, h - i); c.lineTo(w - i * 1.6, h - i); }
        if (shape === 'br') { c.moveTo(w - i, i * 1.6); c.lineTo(w - i, h - i); c.lineTo(i * 1.6, h - i); }
        if (shape === 'tl') { c.moveTo(i, i); c.lineTo(w - i * 1.6, i); c.lineTo(i, h - i * 1.6); }
        if (shape === 'tr') { c.moveTo(i, i); c.lineTo(w - i, i); c.lineTo(w - i, h - i * 1.6); }
        c.closePath();
      }
    }

    // --- outer dark rim (gives separation on any background)
    shapePath(0, r + 2);
    c.fillStyle = 'rgba(6,8,20,0.85)';
    c.fill();

    // --- chamfer layer: light from top-left
    shapePath(1.5, r + 1);
    const cg = c.createLinearGradient(0, 0, w * 0.6, h);
    cg.addColorStop(0, R.shade(color, 0.55));
    cg.addColorStop(0.5, R.shade(color, 0.05));
    cg.addColorStop(1, R.shade(color, -0.45));
    c.fillStyle = cg;
    c.fill();

    // --- face
    shapePath(1.5 + bev, Math.max(3, r - bev * 0.6));
    const g = c.createLinearGradient(0, bev, 0, h - bev);
    g.addColorStop(0, R.shade(color, 0.18));
    g.addColorStop(0.55, color);
    g.addColorStop(1, R.shade(color, -0.22));
    c.fillStyle = g;
    c.fill();

    // clip to face for the dressing layers
    c.save();
    shapePath(1.5 + bev, Math.max(3, r - bev * 0.6));
    c.clip();

    // subtle vertical sheen stripes (glass feel)
    c.globalAlpha = 0.05;
    c.fillStyle = '#ffffff';
    for (let x = w * 0.18; x < w; x += w * 0.3) {
      c.fillRect(x, 0, w * 0.07, h);
    }
    c.globalAlpha = 1;

    // curved gloss band across the upper third
    const gl = c.createLinearGradient(0, bev, 0, h * 0.52);
    gl.addColorStop(0, 'rgba(255,255,255,0.50)');
    gl.addColorStop(0.7, 'rgba(255,255,255,0.14)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gl;
    c.beginPath();
    c.moveTo(0, bev);
    c.lineTo(w, bev);
    c.lineTo(w, h * 0.30);
    c.quadraticCurveTo(w * 0.5, h * 0.52, 0, h * 0.36);
    c.closePath();
    c.fill();

    // inner bottom glow (light bounce)
    const bg = c.createLinearGradient(0, h * 0.72, 0, h - bev);
    bg.addColorStop(0, 'rgba(255,255,255,0)');
    bg.addColorStop(1, R.rgba ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.10)');
    c.fillStyle = bg;
    c.fillRect(0, h * 0.72, w, h * 0.28);

    // inner rim light (1px bright outline just inside the face)
    shapePath(2.5 + bev, Math.max(2, r - bev));
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    // --- corner sparkle (top-left)
    if (shape === 'rect' || shape === 'tl' || shape === 'tr') {
      const sx = shape === 'tr' ? w - bev * 2.6 : bev * 2.6;
      const sy = bev * 2.4;
      const sr = Math.min(6, w * 0.05);
      c.save();
      c.translate(sx, sy);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        const rr = i % 2 === 0 ? sr : sr * 0.36;
        i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(sr * 0.9, sr * 0.9, sr * 0.28, 0, BO.TAU);
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fill();
      c.restore();
    }

    texCache[key] = cv;
    return cv;
  };

  // outlined bold number/text
  R.outlineText = function (ctx, txt, x, y, size, fill, stroke, weightFont) {
    ctx.font = (weightFont || '900 ') + size + 'px ' + BO.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 6.5);
    ctx.strokeStyle = stroke || BO.PAL.numStroke;
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = fill || '#fff';
    ctx.fillText(txt, x, y);
  };

  R.fmtHp = function (hp) {
    if (hp >= 10000) return (hp / 1000).toFixed(0) + 'k';
    if (hp >= 1000) return (hp / 1000).toFixed(1).replace('.0', '') + 'k';
    return '' + hp;
  };

  // ---------- items ----------
  R.drawGem = function (ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * BO.TAU + Math.PI / 6;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#ffe063');
    g.addColorStop(0.5, '#ffb31e');
    g.addColorStop(1, '#f08c0a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = r * 0.16;
    ctx.strokeStyle = 'rgba(120,60,0,0.55)';
    ctx.stroke();
    // facets
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * BO.TAU + Math.PI / 6;
      ctx.moveTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
      ctx.lineTo(Math.cos(a) * r * 0.30, Math.sin(a) * r * 0.30);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = r * 0.09;
    ctx.stroke();
    // shine
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.35, r * 0.16, 0, BO.TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.restore();
  };

  R.boltPath = function (ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x + 0.12 * s, y - 0.5 * s);
    ctx.lineTo(x - 0.22 * s, y + 0.08 * s);
    ctx.lineTo(x - 0.02 * s, y + 0.08 * s);
    ctx.lineTo(x - 0.12 * s, y + 0.5 * s);
    ctx.lineTo(x + 0.24 * s, y - 0.06 * s);
    ctx.lineTo(x + 0.04 * s, y - 0.06 * s);
    ctx.closePath();
  };

  R.drawCoin = function (ctx, x, y, r, t) {
    const squish = 0.75 + 0.25 * Math.abs(Math.sin((t || 0) * 2.2));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squish, 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, '#ffdf6e');
    g.addColorStop(1, '#e09a10');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, BO.TAU);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = '#a86e08'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, BO.TAU);
    ctx.strokeStyle = 'rgba(140,90,0,0.5)'; ctx.lineWidth = r * 0.09; ctx.stroke();
    R.boltPath(ctx, 0, 0, r * 1.1);
    ctx.fillStyle = '#a86e08';
    ctx.fill();
    ctx.restore();
  };

  // chain-lightning coin: purple coin with forked bolt
  R.drawChainCoin = function (ctx, x, y, r, t) {
    const squish = 0.75 + 0.25 * Math.abs(Math.sin((t || 0) * 2.2 + 1));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squish, 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, '#d8a8ff');
    g.addColorStop(1, '#8a3ce8');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, BO.TAU);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = '#5a1ca8'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, BO.TAU);
    ctx.strokeStyle = 'rgba(70,20,140,0.5)'; ctx.lineWidth = r * 0.09; ctx.stroke();
    // forked bolt: main + branch
    R.boltPath(ctx, -r * 0.12, 0, r * 0.95);
    ctx.fillStyle = '#f0e8ff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.14, -r * 0.10);
    ctx.lineTo(r * 0.52, -r * 0.34);
    ctx.lineTo(r * 0.30, -r * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // bomb item: black sphere, fuse with sparking tip
  R.drawBomb = function (ctx, x, y, r, t) {
    const p = 1 + 0.06 * Math.sin((t || 0) * 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p, p);
    // fuse
    ctx.strokeStyle = '#c9a25e';
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.22, -r * 0.62);
    ctx.quadraticCurveTo(r * 0.55, -r * 1.05, r * 0.88, -r * 0.85);
    ctx.stroke();
    // spark at fuse tip (flickers)
    const fs = 0.7 + 0.5 * Math.abs(Math.sin((t || 0) * 9));
    ctx.beginPath(); ctx.arc(r * 0.88, -r * 0.85, r * 0.18 * fs, 0, BO.TAU);
    ctx.fillStyle = '#ffe063'; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.88, -r * 0.85, r * 0.09 * fs, 0, BO.TAU);
    ctx.fillStyle = '#fff'; ctx.fill();
    // body
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
    g.addColorStop(0, '#5a6070');
    g.addColorStop(0.6, '#2c3040');
    g.addColorStop(1, '#181c28');
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, BO.TAU);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = r * 0.10;
    ctx.strokeStyle = 'rgba(6,8,16,0.8)'; ctx.stroke();
    // cap
    ctx.fillStyle = '#3c4254';
    R.roundRect(ctx, r * 0.06, -r * 0.72, r * 0.34, r * 0.22, r * 0.06);
    ctx.fill();
    // shine
    ctx.beginPath(); ctx.arc(-r * 0.26, -r * 0.28, r * 0.14, 0, BO.TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    ctx.restore();
  };

  R.drawPlusBall = function (ctx, x, y, r, t) {
    const p = 1 + 0.08 * Math.sin((t || 0) * 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p, p);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, BO.TAU);
    ctx.fillStyle = '#2f9e1e'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, BO.TAU);
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r * 0.78);
    g.addColorStop(0, '#8ce85c');
    g.addColorStop(1, '#3fbe22');
    ctx.fillStyle = g; ctx.fill();
    R.outlineText(ctx, '1', 0, 1, r * 1.15, '#fff', 'rgba(20,60,10,0.6)');
    ctx.restore();
  };

  // ---------- ball ----------
  R.rainbowAt = function (t) {
    return 'hsl(' + (((t * 90) % 360 + 360) % 360) + ',90%,60%)';
  };
  R.drawBall = function (ctx, x, y, r, skin, t) {
    const col = skin.color === 'rainbow' ? R.rainbowAt(t || 0) : skin.color;
    const hi = skin.hi;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
    g.addColorStop(0, hi);
    g.addColorStop(0.55, col);
    g.addColorStop(1, skin.color === 'rainbow' ? col : R.shade(col, -0.28));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, BO.TAU);
    ctx.fillStyle = g;
    ctx.fill();
  };

  // ---------- 3D buttons ----------
  // opts: {color, edge, text, size, icon(fn), disabled, pressed, radius}
  R.button3D = function (ctx, x, y, w, h, opts) {
    const rad = opts.radius != null ? opts.radius : 14;
    const depth = opts.depth != null ? opts.depth : 8;
    const press = opts.pressed ? depth * 0.7 : 0;
    const col = opts.disabled ? '#5a6070' : opts.color;
    ctx.save();
    // dark outer stroke
    R.roundRect(ctx, x - 2.5, y - 2.5 + press, w + 5, h + 5 + depth - press, rad + 3);
    ctx.fillStyle = 'rgba(8,10,22,0.7)';
    ctx.fill();
    // bottom edge
    R.roundRect(ctx, x, y + press, w, h + depth - press, rad);
    ctx.fillStyle = opts.edge || R.shade(col, -0.42);
    ctx.fill();
    // face
    R.roundRect(ctx, x, y + press, w, h, rad);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, R.shade(col, 0.22));
    g.addColorStop(0.5, col);
    g.addColorStop(1, R.shade(col, -0.1));
    ctx.fillStyle = g;
    ctx.fill();
    // top inner highlight
    ctx.save();
    R.roundRect(ctx, x, y + press, w, h, rad);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x, y + press, w, 5);
    ctx.restore();
    if (opts.text) {
      R.outlineText(ctx, opts.text, x + w / 2, y + press + h / 2 + 1,
        opts.size || h * 0.42, '#fff', 'rgba(10,30,10,0.45)');
    }
    if (opts.icon) opts.icon(ctx, x + w / 2, y + press + h / 2, Math.min(w, h));
    ctx.restore();
    return { x: x - 4, y: y - 4, w: w + 8, h: h + depth + 8 };
  };

  // small square bevel button (HUD)
  R.iconButton = function (ctx, x, y, s, iconFn, opts) {
    opts = opts || {};
    ctx.save();
    R.roundRect(ctx, x, y, s, s, 10);
    ctx.fillStyle = 'rgba(8,10,22,0.75)';
    ctx.fill();
    R.roundRect(ctx, x + 2, y + 2, s - 4, s - 4, 8);
    const g = ctx.createLinearGradient(0, y, 0, y + s);
    g.addColorStop(0, opts.bright ? '#59617e' : '#3c4358');
    g.addColorStop(1, opts.bright ? '#3a4059' : '#272c3d');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 4, y + 3, s - 8, 3);
    iconFn(ctx, x + s / 2, y + s / 2, s);
    ctx.restore();
    return { x: x - 6, y: y - 6, w: s + 12, h: s + 12 };
  };

  // ---------- stars ----------
  R.starPath = function (ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 === 0 ? r : r * 0.46;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  R.drawStar = function (ctx, x, y, r, lit) {
    R.starPath(ctx, x, y, r);
    if (lit) {
      const g = ctx.createLinearGradient(x, y - r, x, y + r);
      g.addColorStop(0, '#ffe063');
      g.addColorStop(1, '#f5a614');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#242a40';
    }
    ctx.fill();
    ctx.lineWidth = r * 0.18;
    ctx.strokeStyle = lit ? 'rgba(150,90,0,0.6)' : 'rgba(8,10,24,0.8)';
    ctx.stroke();
    if (lit) {
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.14, 0, BO.TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
  };

  // ---------- BRICKOUT logo (cached offscreen) ----------
  let logoCv = null;
  R.logo = function (targetW) {
    if (logoCv && logoCv._w === targetW) return logoCv;
    const word = 'BRICKOUT';
    const S = 2;
    const w = targetW * S;
    const h = targetW * 0.30 * S;
    logoCv = document.createElement('canvas');
    logoCv.width = w; logoCv.height = h;
    logoCv._w = targetW;
    const c = logoCv.getContext('2d');

    let fs = h * 0.52;
    c.font = '900 ' + fs + 'px ' + BO.FONT;
    // fit width
    let tw = c.measureText(word).width;
    fs *= (w * 0.94) / tw;
    c.font = '900 ' + fs + 'px ' + BO.FONT;
    tw = c.measureText(word).width;

    const baseY = h * 0.52;
    const depth = fs * 0.10;
    const colors = BO.PAL.logo;

    // per-letter positions
    let x = (w - tw) / 2;
    const letters = [];
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const lw = c.measureText(ch).width;
      letters.push({ ch, x: x + lw / 2, col: colors[i % colors.length], lw });
      x += lw;
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';

    // pass 1: outline + extrusion silhouette
    c.lineWidth = fs * 0.14;
    c.strokeStyle = '#12141f';
    for (const L of letters) {
      for (let d = depth; d >= 0; d -= 2) c.strokeText(L.ch, L.x, baseY + d);
    }
    // pass 2: extrusion in dark letter color
    for (const L of letters) {
      c.fillStyle = R.shade(L.col, -0.5);
      for (let d = depth; d > 0; d -= 1.5) c.fillText(L.ch, L.x, baseY + d);
    }
    // pass 3: face with vertical gradient per letter
    for (const L of letters) {
      const g = c.createLinearGradient(0, baseY - fs / 2, 0, baseY + fs / 2);
      g.addColorStop(0, R.shade(L.col, 0.25));
      g.addColorStop(1, R.shade(L.col, -0.08));
      c.fillStyle = g;
      c.fillText(L.ch, L.x, baseY);
    }
    // pass 4: mortar lines clipped to face via source-atop on temp canvas
    const face = document.createElement('canvas');
    face.width = w; face.height = h;
    const fc = face.getContext('2d');
    fc.font = c.font; fc.textAlign = 'center'; fc.textBaseline = 'middle';
    for (const L of letters) { fc.fillStyle = '#fff'; fc.fillText(L.ch, L.x, baseY); }
    fc.globalCompositeOperation = 'source-in';
    fc.fillStyle = 'rgba(0,0,0,0)';
    // draw mortar pattern onto separate canvas then mask
    const pat = document.createElement('canvas');
    pat.width = w; pat.height = h;
    const pc = pat.getContext('2d');
    pc.strokeStyle = 'rgba(20,15,40,0.30)';
    pc.lineWidth = fs * 0.035;
    const bh = fs * 0.22;
    for (let yy = baseY - fs * 0.5; yy < baseY + fs * 0.55; yy += bh) {
      pc.beginPath(); pc.moveTo(0, yy); pc.lineTo(w, yy); pc.stroke();
    }
    let rowI = 0;
    for (let yy = baseY - fs * 0.5; yy < baseY + fs * 0.55; yy += bh, rowI++) {
      const off = (rowI % 2) * bh * 1.1;
      for (let xx = off; xx < w; xx += bh * 2.2) {
        pc.beginPath(); pc.moveTo(xx, yy); pc.lineTo(xx, yy + bh); pc.stroke();
      }
    }
    // top shine band
    pc.fillStyle = 'rgba(255,255,255,0.18)';
    pc.fillRect(0, baseY - fs * 0.42, w, fs * 0.12);
    fc.globalCompositeOperation = 'source-in';
    fc.drawImage(pat, 0, 0);
    c.drawImage(face, 0, 0);
    return logoCv;
  };
})();
