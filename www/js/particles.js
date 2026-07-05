// ============================================================
// Brick Out - particles, floaters, shake, bolts, combo text
// ============================================================
(function () {
  const parts = [];     // physical particles
  const floaters = [];  // rising texts
  const bolts = [];     // lightning polylines
  const lasers = [];    // beam sweeps
  const flares = [];    // starburst flashes
  const rings = [];     // shockwave rings
  const combos = [];    // big combo popups
  let shake = 0;
  let flash = 0;
  let edge = 0;         // screen-edge glow intensity

  const MAX_PARTS = 700;

  // 4-point star path
  function star4(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4;
      const rr = i % 2 === 0 ? r : r * 0.30;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function push(p) {
    if (parts.length >= MAX_PARTS) parts.shift();
    parts.push(p);
  }

  BO.fx = {
    reset() {
      parts.length = 0; floaters.length = 0; bolts.length = 0;
      lasers.length = 0; flares.length = 0;
      rings.length = 0; combos.length = 0; shake = 0; flash = 0; edge = 0;
    },
    addShake(m) { shake = Math.min(BO.CFG.MAX_SHAKE, shake + m); },
    addFlash(a) { flash = Math.min(0.5, flash + a); },
    addEdge(a) { edge = Math.min(1, edge + a); },
    get shakeX() { return shake > 0.2 ? BO.rand(-shake, shake) : 0; },
    get shakeY() { return shake > 0.2 ? BO.rand(-shake, shake) : 0; },
    get flash() { return flash; },
    get edge() { return edge; },

    // brick shards
    shards(x, y, w, h, color, n) {
      for (let i = 0; i < n; i++) {
        push({
          kind: 'shard',
          x: x + BO.rand(-w / 2, w / 2), y: y + BO.rand(-h / 2, h / 2),
          vx: BO.rand(-420, 420), vy: BO.rand(-520, 120),
          s: BO.rand(6, 15), rot: BO.rand(0, BO.TAU), vr: BO.rand(-9, 9),
          color, life: 1, decay: BO.rand(1.6, 2.6), grav: 1500,
        });
      }
    },
    sparks(x, y, color, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = BO.rand(0, BO.TAU);
        const v = BO.rand(60, speed || 420);
        push({
          kind: 'spark',
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          s: BO.rand(2.5, 6), color, life: 1, decay: BO.rand(1.8, 3.4), grav: 300,
        });
      }
    },
    // slow rising smoke puffs (bomb aftermath)
    smoke(x, y, n) {
      for (let i = 0; i < n; i++) {
        push({
          kind: 'smoke',
          x: x + BO.rand(-18, 18), y: y + BO.rand(-14, 14),
          vx: BO.rand(-40, 40), vy: BO.rand(-110, -40),
          s: BO.rand(10, 22), color: null,
          life: 1, decay: BO.rand(0.9, 1.5), grav: -60,
        });
      }
    },
    confetti(W, H) {
      const cols = ['#f0389c', '#f8a01e', '#ffc61c', '#58c832', '#2e8cf0', '#8850e8'];
      for (let i = 0; i < 90; i++) {
        push({
          kind: 'shard',
          x: BO.rand(0, W), y: BO.rand(-H * 0.3, 0),
          vx: BO.rand(-80, 80), vy: BO.rand(120, 380),
          s: BO.rand(7, 14), rot: BO.rand(0, BO.TAU), vr: BO.rand(-7, 7),
          color: cols[(Math.random() * cols.length) | 0],
          life: 1, decay: BO.rand(0.28, 0.5), grav: 60,
        });
      }
    },
    ring(x, y, color, r0, r1) {
      rings.push({ x, y, color, r0: r0 || 6, r1: r1 || 64, t: 0, dur: 0.35 });
    },
    floatText(x, y, txt, opts) {
      opts = opts || {};
      floaters.push({
        x, y, txt, t: 0,
        dur: opts.dur || 0.8,
        size: opts.size || 26,
        color: opts.color || '#fff',
        vy: opts.vy != null ? opts.vy : -90,
      });
    },
    combo(txt, x, y) {
      combos.push({ txt, x, y, t: 0, dur: 1.0 });
    },
    bolt(x0, y0, x1, y1, color) {
      const pts = [];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const px = BO.lerp(x0, x1, t), py = BO.lerp(y0, y1, t);
        const perp = (i > 0 && i < n) ? BO.rand(-16, 16) : 0;
        const dx = y1 - y0, dy = -(x1 - x0);
        const len = Math.hypot(dx, dy) || 1;
        pts.push([px + dx / len * perp, py + dy / len * perp]);
      }
      const b = { pts, t: 0, dur: 0.28, color: color || '#ffe37a', branches: [] };
      // 2-3 forked twigs off random midpoints
      const nb = 2 + (Math.random() * 2 | 0);
      for (let k = 0; k < nb; k++) {
        const i = 2 + (Math.random() * (n - 4) | 0);
        const [bx, by] = pts[i];
        const ang = Math.atan2(y1 - y0, x1 - x0) + BO.rand(-1.4, 1.4);
        const len = BO.rand(20, 46);
        const mx = bx + Math.cos(ang) * len * 0.55 + BO.rand(-7, 7);
        const my = by + Math.sin(ang) * len * 0.55 + BO.rand(-7, 7);
        b.branches.push([[bx, by], [mx, my], [bx + Math.cos(ang) * len, by + Math.sin(ang) * len]]);
      }
      bolts.push(b);
    },

    // starburst flash at an impact point (competitor-style 4-point star + ring)
    flare(x, y, size, color) {
      flares.push({
        x, y, t: 0, dur: 0.30,
        size: size || 26,
        rot: BO.rand(0, BO.TAU),
        color: color || '#ffffff',
        ringColor: '#ff5ad0',
      });
    },

    // full-width laser beam sweep (horizontal: y fixed; or vertical)
    laser(x0, y0, x1, y1, color) {
      lasers.push({ x0, y0, x1, y1, t: 0, dur: 0.5, color: color || '#7af0ff' });
    },

    update(dt) {
      shake = Math.max(0, shake - dt * 44);
      flash = Math.max(0, flash - dt * 2.2);
      edge = Math.max(0, edge - dt * 1.1);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += (p.grav || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.vr) p.rot += p.vr * dt;
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += dt;
        f.y += f.vy * dt;
        if (f.t >= f.dur) floaters.splice(i, 1);
      }
      for (let i = bolts.length - 1; i >= 0; i--) {
        bolts[i].t += dt;
        if (bolts[i].t >= bolts[i].dur) bolts.splice(i, 1);
      }
      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].t += dt;
        if (lasers[i].t >= lasers[i].dur) lasers.splice(i, 1);
      }
      for (let i = flares.length - 1; i >= 0; i--) {
        flares[i].t += dt;
        if (flares[i].t >= flares[i].dur) flares.splice(i, 1);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dt;
        if (rings[i].t >= rings[i].dur) rings.splice(i, 1);
      }
      for (let i = combos.length - 1; i >= 0; i--) {
        combos[i].t += dt;
        if (combos[i].t >= combos[i].dur) combos.splice(i, 1);
      }
    },

    draw(ctx) {
      // rings
      for (const r of rings) {
        const k = r.t / r.dur;
        ctx.beginPath();
        ctx.arc(r.x, r.y, BO.lerp(r.r0, r.r1, 1 - (1 - k) * (1 - k)), 0, BO.TAU);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 5 * (1 - k) + 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // particles
      for (const p of parts) {
        ctx.globalAlpha = Math.min(1, p.life);
        if (p.kind === 'shard') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7);
          ctx.restore();
        } else if (p.kind === 'smoke') {
          const grow = p.s * (1.6 - p.life * 0.6);
          const sg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, grow);
          sg.addColorStop(0, 'rgba(140,140,150,' + (0.20 * p.life) + ')');
          sg.addColorStop(1, 'rgba(140,140,150,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, grow, 0, BO.TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * p.life, 0, BO.TAU);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // bolts
      for (const b of bolts) {
        const k = 1 - b.t / b.dur;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 7;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        b.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.stroke();
        // forked branches, thinner and fading faster
        if (b.branches && b.branches.length) {
          ctx.globalAlpha = k * k;
          ctx.lineWidth = 3.5;
          for (const br of b.branches) {
            ctx.beginPath();
            br.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
            ctx.stroke();
          }
          ctx.globalAlpha = k;
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        b.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.stroke();
        ctx.restore();
      }
      // lasers: hot core + gradient glow + endpoint flare
      for (const L of lasers) {
        const k = L.t / L.dur;
        const grow = Math.min(1, k / 0.12);          // quick expand
        const fade = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1;
        const dx = L.x1 - L.x0, dy = L.y1 - L.y0;
        const len = Math.hypot(dx, dy) || 1;
        const ang = Math.atan2(dy, dx);
        const thick = 46 * grow * fade;
        ctx.save();
        ctx.translate(L.x0, L.y0);
        ctx.rotate(ang);
        ctx.globalAlpha = fade;
        ctx.globalCompositeOperation = 'lighter';
        // outer glow
        let g = ctx.createLinearGradient(0, -thick, 0, thick);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, BO.R.rgba ? 'rgba(122,240,255,0.55)' : L.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, -thick, len, thick * 2);
        // hot core
        g = ctx.createLinearGradient(0, -thick * 0.22, 0, thick * 0.22);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, -thick * 0.22, len, thick * 0.44);
        ctx.restore();
        // endpoint flares
        this.drawFlareShape(ctx, L.x1, L.y1, 34 * grow * fade, k * 5, fade);
        this.drawFlareShape(ctx, L.x0, L.y0, 24 * grow * fade, -k * 4, fade * 0.8);
      }
      // starburst flares
      for (const f of flares) {
        const k = f.t / f.dur;
        const scale = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7 * 0.55;
        const alpha = 1 - k * k;
        this.drawFlareShape(ctx, f.x, f.y, f.size * scale, f.rot + k * 2.5, alpha);
        // pink ring
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * (0.5 + k * 1.1), 0, BO.TAU);
        ctx.strokeStyle = f.ringColor;
        ctx.lineWidth = 3.5 * (1 - k) + 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // floaters
      for (const f of floaters) {
        const k = f.t / f.dur;
        ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.55)) / 0.45;
        BO.R.outlineText(ctx, f.txt, f.x, f.y, f.size, f.color);
      }
      ctx.globalAlpha = 1;
    },

    // 4-point starburst (white core, additive)
    drawFlareShape(ctx, x, y, r, rot, alpha) {
      if (r < 1) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'lighter';
      star4(ctx, x, y, r * 1.9, rot);
      ctx.fillStyle = 'rgba(180,240,255,0.5)';
      ctx.fill();
      star4(ctx, x, y, r, rot);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    },

    // screen-edge glow vignette; call after world draw
    drawEdge(ctx, W, H) {
      if (edge <= 0.01) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const t = performance.now() / 1000;
      const a = edge * (0.55 + 0.12 * Math.sin(t * 6));
      const S = 90;
      const sides = [
        [0, 0, W, S, 0, 0, 0, S],           // top
        [0, H - S, W, S, 0, H, 0, H - S],   // bottom
        [0, 0, S, H, 0, 0, S, 0],           // left
        [W - S, 0, S, H, W, 0, W - S, 0],   // right
      ];
      for (const [rx, ry, rw, rh, gx0, gy0, gx1, gy1] of sides) {
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, 'rgba(70,150,255,' + a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(70,150,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.restore();
    },

    // big combo popup, draw above everything in play area
    drawCombos(ctx, W) {
      for (const cb of combos) {
        const k = cb.t / cb.dur;
        // elastic pop in
        let s;
        if (k < 0.25) {
          const q = k / 0.25;
          s = 0.3 + 1.05 * (1 - Math.pow(1 - q, 3));
        } else {
          s = 1.35 - 0.25 * Math.min(1, (k - 0.25) / 0.15);
        }
        if (k > 0.3) s = 1.1;
        const alpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cb.x, cb.y - k * 30);
        ctx.scale(s, s);
        ctx.transform(1, 0, -0.12, 1, 0, 0); // italic skew
        const size = Math.min(96, W * 0.16);
        ctx.font = '900 ' + size + 'px ' + BO.FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = size * 0.18;
        ctx.strokeStyle = '#10241a';
        ctx.strokeText(cb.txt, 0, 0);
        const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
        g.addColorStop(0, '#b8f27c');
        g.addColorStop(0.5, '#6ede4e');
        g.addColorStop(1, '#2fae3e');
        ctx.fillStyle = g;
        ctx.fillText(cb.txt, 0, 0);
        ctx.restore();
      }
    },
  };
})();
