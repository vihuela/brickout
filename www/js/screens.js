// ============================================================
// Brick Out - title scene + shared overlays (shop / help)
// ============================================================
(function () {
  const R = () => BO.R;

  BO.ui = {
    dim(ctx, W, H, a) {
      ctx.fillStyle = 'rgba(8,10,20,' + a + ')';
      ctx.fillRect(0, 0, W, H);
    },
    panel(ctx, x, y, w, h) {
      BO.R.roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 26);
      ctx.fillStyle = 'rgba(6,8,18,0.85)';
      ctx.fill();
      BO.R.roundRect(ctx, x, y, w, h, 24);
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#232946');
      g.addColorStop(1, '#191e33');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    gemChip(ctx, cx, cy, count, w) {
      w = w || 150;
      const h = 44;
      BO.R.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
      ctx.fillStyle = 'rgba(8,10,22,0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 2;
      ctx.stroke();
      BO.R.drawGem(ctx, cx - w / 2 + 26, cy, 15, 0);
      BO.R.outlineText(ctx, '' + count, cx + 12, cy + 1, 26, '#ffe063', 'rgba(60,30,0,0.5)');
    },
  };

  function inRect(x, y, r) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
  BO.inRect = inRect;

  // ============================ TITLE ============================
  BO.TitleScene = function () {
    this.t = 0;
    this.pressed = null;
    this.amb = [];
    for (let i = 0; i < 16; i++) this.amb.push(this.spawnAmb(true));
  };
  BO.TitleScene.prototype = {
    spawnAmb(anyY) {
      return {
        x: Math.random() * BO.CFG.W,
        y: anyY ? Math.random() * 1800 : -60,
        s: BO.rand(14, 40),
        vy: BO.rand(18, 55),
        rot: BO.rand(0, BO.TAU),
        vr: BO.rand(-0.6, 0.6),
        col: BO.PAL.tiers[(Math.random() * BO.PAL.tiers.length) | 0],
        ball: Math.random() < 0.35,
        a: BO.rand(0.05, 0.16),
      };
    },
    update(dt, H) {
      this.t += dt;
      for (let i = 0; i < this.amb.length; i++) {
        const a = this.amb[i];
        a.y += a.vy * dt;
        a.rot += a.vr * dt;
        if (a.y > H + 80) this.amb[i] = this.spawnAmb(false);
      }
      if (this.overlay && this.overlay.update) this.overlay.update(dt);
    },
    draw(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#232848');
      g.addColorStop(0.5, BO.PAL.bgTop);
      g.addColorStop(1, BO.PAL.bgBot);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // ambient falling bricks/balls
      for (const a of this.amb) {
        ctx.save();
        ctx.globalAlpha = a.a;
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        if (a.ball) {
          ctx.beginPath(); ctx.arc(0, 0, a.s * 0.4, 0, BO.TAU);
          ctx.fillStyle = a.col; ctx.fill();
        } else {
          ctx.fillStyle = a.col;
          ctx.fillRect(-a.s / 2, -a.s * 0.35, a.s, a.s * 0.7);
        }
        ctx.restore();
      }
      // glow behind logo
      const ly = H * 0.34 + Math.sin(this.t * 1.3) * 8;
      const rg = ctx.createRadialGradient(W / 2, ly, 20, W / 2, ly, W * 0.65);
      rg.addColorStop(0, 'rgba(90,110,220,0.20)');
      rg.addColorStop(1, 'rgba(90,110,220,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      // logo
      const logo = BO.R.logo(W * 0.94);
      const lw = W * 0.94, lh = lw * 0.30;
      ctx.drawImage(logo, W / 2 - lw / 2, ly - lh / 2, lw, lh);
      // subtitle
      ctx.font = '700 26px ' + BO.FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8ecf8';
      const sub = BO.T('subtitle');
      ctx.save();
      ctx.translate(W / 2, ly + lh * 0.62);
      // letter-spaced
      let total = 0;
      const sp = 6;
      for (const chr of sub) total += ctx.measureText(chr).width + sp;
      let sx = -total / 2;
      for (const chr of sub) {
        const cw = ctx.measureText(chr).width;
        ctx.fillText(chr, sx + cw / 2, 0);
        sx += cw + sp;
      }
      ctx.restore();

      // PLAY button
      const pw = W * 0.46, ph = 96;
      const pulse = 1 + Math.sin(this.t * 3) * 0.02;
      const px = W / 2 - pw * pulse / 2, py = H * 0.575 - ph * pulse / 2;
      this.btnPlay = BO.R.button3D(ctx, px, py, pw * pulse, ph * pulse, {
        color: '#2fbb2f', text: BO.T('play'), size: 46,
        pressed: this.pressed === 'play',
      });

      // mode selector cards
      const cw = 200, chh = 118, gap = 14;
      const totalW = cw * 3 + gap * 2;
      const cy0 = H * 0.575 + 92;
      this.modeRects = [];
      BO.MODES.forEach((m, i) => {
        const cx = (W - totalW) / 2 + i * (cw + gap);
        const sel = BO.store.mode === m.id;
        BO.R.roundRect(ctx, cx, cy0, cw, chh, 16);
        ctx.fillStyle = sel ? BO.R.rgba(m.color, 0.18) : 'rgba(10,13,26,0.6)';
        ctx.fill();
        ctx.lineWidth = sel ? 3.5 : 2;
        ctx.strokeStyle = sel ? m.color : 'rgba(255,255,255,0.10)';
        ctx.stroke();
        // name
        BO.R.outlineText(ctx, BO.T('mode_' + m.id), cx + cw / 2, cy0 + 22, 20, sel ? '#fff' : '#9aa2c8');
        // icon
        const ix = cx + cw / 2, iy = cy0 + 60;
        if (m.id === 'classic') {
          const tex = BO.R.brickTex('#3d8bff', 52, 34, 'rect');
          ctx.drawImage(tex, ix - 26, iy - 17, 52, 34);
        } else if (m.id === 'gravity') {
          // ball with falling arc
          ctx.strokeStyle = BO.R.rgba(m.color, 0.9);
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 6]);
          ctx.beginPath();
          ctx.moveTo(ix - 26, iy - 12);
          ctx.quadraticCurveTo(ix + 4, iy - 26, ix + 20, iy + 8);
          ctx.stroke();
          ctx.setLineDash([]);
          BO.R.drawBall(ctx, ix + 20, iy + 8, 10, BO.SKINS[0], this.t);
        } else {
          // stopwatch-ish counter
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.arc(ix, iy + 2, 15, 0, BO.TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ix, iy + 2); ctx.lineTo(ix + 8, iy - 6); ctx.stroke();
          ctx.fillStyle = m.color;
          ctx.fillRect(ix - 4, iy - 19, 8, 5);
        }
        // per-mode level
        BO.R.outlineText(ctx, BO.T('lv', BO.store.levelOf(m.id)), cx + cw / 2, cy0 + chh - 20, 19,
          sel ? '#ffe063' : '#8b93b0');
        this.modeRects.push({ x: cx, y: cy0, w: cw, h: chh, id: m.id });
      });

      // gems chip
      BO.ui.gemChip(ctx, W / 2, cy0 + chh + 60, BO.store.gems);
      // sound toggle (top-right)
      const st = Math.max(BO.safeTop || 0, 16);
      this.btnSound = BO.R.iconButton(ctx, W - 84, st + 14, 62, (c, x, y, s) => {
        c.font = '700 ' + s * 0.44 + 'px ' + BO.FONT;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = BO.store.sound ? '#8ee87c' : '#7c8299';
        c.fillText(BO.store.sound ? '♪' : '×', x, y + 1);
      });
      // settings menu (top-right, left of sound)
      this.btnMenu = BO.R.iconButton(ctx, W - 158, st + 14, 62, (c, x, y, s) => {
        c.strokeStyle = '#c8cfe8';
        c.lineWidth = 4;
        c.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo(x - s * 0.18, y + i * s * 0.15);
          c.lineTo(x + s * 0.18, y + i * s * 0.15);
          c.stroke();
        }
      });
      // shop (bottom-left)
      this.btnShop = BO.R.iconButton(ctx, 22, st + 14, 62, (c, x, y) => {
        BO.R.drawBall(c, x - 8, y + 6, 12, BO.store.skinDef(), this.t);
        BO.R.drawBall(c, x + 8, y - 6, 12, BO.store.skinDef(), this.t);
      });
      ctx.font = '600 20px ' + BO.FONT;
      ctx.fillStyle = 'rgba(150,158,190,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('v1.0', W / 2, H - Math.max(BO.safeBottom || 0, 10) - 14);

      if (this.overlay) this.overlay.draw(ctx, W, H);
    },
    onBack() {
      if (this.overlay) {
        this.overlay = null;
        BO.audio.click();
        return true;
      }
      return false;  // let the app exit from the title screen
    },
    pointer(type, x, y) {
      if (this.overlay) {
        if (this.overlay.pointer(type, x, y) === 'close') this.overlay = null;
        return;
      }
      if (type === 'down') {
        if (inRect(x, y, this.btnPlay)) this.pressed = 'play';
      } else if (type === 'up') {
        if (this.pressed === 'play' && inRect(x, y, this.btnPlay)) {
          BO.audio.click();
          BO.go('game', BO.store.levelOf(BO.store.mode), BO.store.mode);
        } else if (inRect(x, y, this.btnSound)) {
          BO.store.sound = !BO.store.sound;
          BO.audio.click();
        } else if (inRect(x, y, this.btnShop)) {
          BO.audio.click();
          this.overlay = BO.makeShop();
        } else if (inRect(x, y, this.btnMenu)) {
          BO.audio.click();
          this.overlay = BO.makeMenu();
        } else if (this.modeRects) {
          for (const r of this.modeRects) {
            if (inRect(x, y, r)) {
              if (BO.store.mode !== r.id) { BO.store.mode = r.id; BO.audio.click(); }
              break;
            }
          }
        }
        this.pressed = null;
      }
    },
  };

  // ============================ SHOP ============================
  BO.makeShop = function () {
    const o = { t: 0, rects: [], closeR: null };
    o.update = dt => { o.t += dt; };
    o.draw = function (ctx, W, H) {
      BO.ui.dim(ctx, W, H, 0.72);
      const pw = W * 0.88, ph = H * 0.66;
      const px = (W - pw) / 2, py = (H - ph) / 2;
      BO.ui.panel(ctx, px, py, pw, ph);
      BO.R.outlineText(ctx, BO.T('shopTitle'), W / 2, py + 52, 42, '#fff');
      BO.ui.gemChip(ctx, W / 2, py + 106, BO.store.gems);
      // grid 2 cols x 3 rows
      o.rects = [];
      const cols = 2, cw = pw / cols;
      const startY = py + 150;
      const ch = (ph - 170) / 3;
      BO.SKINS.forEach((s, i) => {
        const cx = px + (i % cols) * cw + cw / 2;
        const cy = startY + ((i / cols) | 0) * ch + ch / 2;
        const owned = BO.store.owns(s.id);
        const active = BO.store.skin === s.id;
        // card
        const cardW = cw - 26, cardH = ch - 18;
        BO.R.roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 18);
        ctx.fillStyle = active ? 'rgba(70,190,80,0.16)' : 'rgba(10,13,26,0.55)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = active ? '#4fd44f' : 'rgba(255,255,255,0.09)';
        ctx.stroke();
        BO.R.drawBall(ctx, cx, cy - cardH * 0.18, 26, s, o.t + i);
        BO.R.outlineText(ctx, s.name, cx, cy + cardH * 0.16, 22, '#dfe5fa');
        if (active) {
          BO.R.outlineText(ctx, BO.T('equipped'), cx, cy + cardH * 0.36, 18, '#6fe06f');
        } else if (owned) {
          BO.R.outlineText(ctx, BO.T('tapToUse'), cx, cy + cardH * 0.36, 18, '#9aa2c8');
        } else {
          BO.R.drawGem(ctx, cx - 30, cy + cardH * 0.35, 11, 0);
          BO.R.outlineText(ctx, '' + s.cost, cx + 10, cy + cardH * 0.36, 20,
            BO.store.gems >= s.cost ? '#ffe063' : '#e86a6a');
        }
        o.rects.push({ x: cx - cardW / 2, y: cy - cardH / 2, w: cardW, h: cardH, id: s.id });
      });
      // close
      o.closeR = BO.R.button3D(ctx, W / 2 - 90, py + ph - 26, 180, 62,
        { color: '#e8453c', text: BO.T('close'), size: 28 });
    };
    o.pointer = function (type, x, y) {
      if (type !== 'up') return null;
      if (BO.inRect(x, y, o.closeR)) { BO.audio.click(); return 'close'; }
      for (const r of o.rects) {
        if (BO.inRect(x, y, r)) {
          const s = BO.SKINS.find(k => k.id === r.id);
          if (BO.store.owns(s.id)) {
            BO.store.skin = s.id;
            BO.audio.click();
          } else if (BO.store.gems >= s.cost) {
            BO.store.gems -= s.cost;
            BO.store.buy(s.id);
            BO.store.skin = s.id;
            BO.audio.gem();
            BO.track('skin_buy', { skin: s.id, cost: s.cost });
          } else {
            BO.audio.lose();
          }
          return null;
        }
      }
      return null;
    };
    return o;
  };

  // ============================ SETTINGS MENU ============================
  BO.makeMenu = function () {
    const o = { t: 0, rows: [], closeR: null, termsR: null, privacyR: null };
    o.update = dt => { o.t += dt; };
    o.draw = function (ctx, W, H) {
      BO.ui.dim(ctx, W, H, 0.72);
      const pw = W * 0.84, ph = Math.min(H * 0.82, 830);
      const px = (W - pw) / 2, py = (H - ph) / 2;
      BO.ui.panel(ctx, px, py, pw, ph);
      BO.R.outlineText(ctx, BO.T('settings'), W / 2, py + 50, 38, '#fff');
      // language section
      ctx.font = '800 23px ' + BO.FONT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = BO.PAL.txtDim;
      ctx.fillText(BO.T('language'), px + 40, py + 100);
      o.rows = [];
      const rowH = 62, gap = 11;
      let yy = py + 126;
      const active = BO.lang();
      for (const L of BO.LANGS) {
        const sel = active === L.id;
        BO.R.roundRect(ctx, px + 32, yy, pw - 64, rowH, 14);
        ctx.fillStyle = sel ? 'rgba(70,190,80,0.15)' : 'rgba(10,13,26,0.55)';
        ctx.fill();
        ctx.lineWidth = sel ? 3 : 2;
        ctx.strokeStyle = sel ? '#4fd44f' : 'rgba(255,255,255,0.09)';
        ctx.stroke();
        // radio
        ctx.beginPath(); ctx.arc(px + 66, yy + rowH / 2, 11, 0, BO.TAU);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = sel ? '#4fd44f' : '#5a6280';
        ctx.stroke();
        if (sel) {
          ctx.beginPath(); ctx.arc(px + 66, yy + rowH / 2, 5.5, 0, BO.TAU);
          ctx.fillStyle = '#4fd44f'; ctx.fill();
        }
        ctx.font = '700 25px ' + BO.FONT;
        ctx.textAlign = 'left';
        ctx.fillStyle = sel ? '#fff' : '#c8cfe8';
        ctx.fillText(L.label, px + 96, yy + rowH / 2 + 1);
        o.rows.push({ x: px + 32, y: yy, w: pw - 64, h: rowH, id: L.id });
        yy += rowH + gap;
      }
      yy += 12;
      // legal links
      for (const kind of ['terms', 'privacy']) {
        BO.R.roundRect(ctx, px + 32, yy, pw - 64, rowH, 14);
        ctx.fillStyle = 'rgba(10,13,26,0.55)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.stroke();
        ctx.font = '700 24px ' + BO.FONT;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9fc0ff';
        ctx.fillText(BO.T(kind), px + 56, yy + rowH / 2 + 1);
        // external-link arrow
        ctx.strokeStyle = '#9fc0ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const ax = px + pw - 78, ay = yy + rowH / 2;
        ctx.beginPath();
        ctx.moveTo(ax - 6, ay + 6); ctx.lineTo(ax + 6, ay - 6);
        ctx.moveTo(ax - 2, ay - 6); ctx.lineTo(ax + 6, ay - 6); ctx.lineTo(ax + 6, ay + 2);
        ctx.stroke();
        const r = { x: px + 32, y: yy, w: pw - 64, h: rowH };
        if (kind === 'terms') o.termsR = r; else o.privacyR = r;
        yy += rowH + gap;
      }
      o.closeR = BO.R.button3D(ctx, W / 2 - 90, py + ph - 26, 180, 62,
        { color: '#e8453c', text: BO.T('close'), size: 26 });
    };
    o.pointer = function (type, x, y) {
      if (type !== 'up') return null;
      if (BO.inRect(x, y, o.closeR)) { BO.audio.click(); return 'close'; }
      for (const r of o.rows) {
        if (BO.inRect(x, y, r)) {
          if (BO.store.lang !== r.id) { BO.store.lang = r.id; BO.audio.click(); }
          return null;
        }
      }
      if (BO.inRect(x, y, o.termsR)) { BO.audio.click(); BO.openURL(BO.LEGAL.terms); return null; }
      if (BO.inRect(x, y, o.privacyR)) { BO.audio.click(); BO.openURL(BO.LEGAL.privacy); return null; }
      return null;
    };
    return o;
  };

  // ============================ HELP ============================
  BO.makeHelp = function () {
    const o = { t: 0, closeR: null };
    o.update = dt => { o.t += dt; };
    o.draw = function (ctx, W, H) {
      BO.ui.dim(ctx, W, H, 0.72);
      const pw = W * 0.86, ph = H * 0.56;
      const px = (W - pw) / 2, py = (H - ph) / 2;
      BO.ui.panel(ctx, px, py, pw, ph);
      BO.R.outlineText(ctx, BO.T('howToPlay'), W / 2, py + 52, 38, '#fff');
      const lines = BO.helpLines();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      let yy = py + 116;
      for (const [n, txt] of lines) {
        ctx.font = '800 25px ' + BO.FONT;
        ctx.fillStyle = '#ffc21c';
        ctx.fillText(n, px + 36, yy);
        ctx.font = '600 24px ' + BO.FONT;
        ctx.fillStyle = '#d5dbf2';
        ctx.fillText(txt, px + 84, yy);
        yy += 44;
      }
      // little icons row
      BO.R.drawPlusBall(ctx, px + pw * 0.30, yy + 26, 20, o.t);
      BO.R.drawGem(ctx, px + pw * 0.5, yy + 26, 18, 0.4);
      BO.R.drawCoin(ctx, px + pw * 0.70, yy + 26, 20, o.t);
      o.closeR = BO.R.button3D(ctx, W / 2 - 90, py + ph - 26, 180, 62,
        { color: '#2fbb2f', text: BO.T('gotIt'), size: 28 });
    };
    o.pointer = function (type, x, y) {
      if (type === 'up' && BO.inRect(x, y, o.closeR)) { BO.audio.click(); return 'close'; }
      return null;
    };
    return o;
  };
})();
