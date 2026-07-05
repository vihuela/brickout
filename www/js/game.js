// ============================================================
// Brick Out - gameplay scene
// ============================================================
(function () {
  const CFG = BO.CFG;

  BO.GameScene = function (levelNum, mode) {
    this.levelNum = levelNum;
    this.mode = mode || 'classic';
    const data = BO.levels.get(levelNum, this.mode);
    this.data = data;
    this.movesLeft = data.moves || 0;
    this.bricks = data.bricks.map(b => Object.assign({ flash: 0 }, b));
    this.items = data.items.map(it => Object.assign({ t: Math.random() * 6 }, it));
    this.grid = {};
    this.rebuildGrid();

    this.state = 'intro';          // intro|ready|aiming|flight|settle|winFly|win|losing|lose
    this.t = 0;
    this.introT = 0;
    this.turns = 0;
    this.score = 0;
    this.gemsGot = 0;

    this.ballsBase = data.balls;
    this.ballsBonus = 0;
    this.balls = [];
    this.launcherX = CFG.W / 2;
    this.speedMult = 1;
    this.splitArmed = false;
    this.boosterArm = null;        // 'bolt'|'hammer'|'split' awaiting confirm
    this.hammerMode = false;
    this.hammerRow = -1;

    this.aim = null;               // {dx,dy} unit
    this.settleT = 0;
    this.stateT = 0;
    this.overlay = null;
    this.banner = 1.6;             // LEVEL N banner timer
    this.autoT = 0;
    this.heat = 0;                 // 0..1 combo heat -> flaming score
    this.emberT = 0;
  };

  BO.GameScene.prototype = {
    // ---------- geometry ----------
    layout(W, H) {
      this.W = W; this.H = H;
      this.cell = W / CFG.COLS;
      this.hudBottom = (BO.safeTop || 0) + CFG.HUD_H;
      this.boardTop = this.hudBottom + 4;
      this.boostTop = H - (BO.safeBottom || 0) - CFG.BOOST_H;
      this.launchY = this.boostTop - 20;
    },

    rebuildGrid() {
      this.grid = {};
      for (const b of this.bricks) this.grid[b.r + ',' + b.c] = b;
    },
    brickRect(b) {
      return {
        x: b.c * this.cell,
        y: this.boardTop + b.r * this.cell + this.descOffset(),
        s: this.cell,
      };
    },
    descOffset() {
      if (this.state !== 'settle') return 0;
      const k = Math.min(1, this.settleT / 0.3);
      return -this.cell * (1 - (1 - Math.pow(1 - k, 3)));
    },

    // ---------- flow ----------
    totalShots() {
      return (this.ballsBase + this.ballsBonus) * (this.splitArmed ? 2 : 1);
    },

    ballSpeed() {
      return this.mode === 'gravity' ? CFG.BALL_SPEED_G : CFG.BALL_SPEED;
    },
    gravityAcc() {
      return this.mode === 'gravity' ? CFG.GRAVITY : 0;
    },

    fire(dir) {
      this.state = 'flight';
      this.stateT = 0;
      this.flightT = 0;
      this.turns++;
      if (this.mode === 'limit') this.movesLeft--;
      this.toFire = this.totalShots();
      this.splitArmed = false;
      this.fireBalls = this.fireArmed;      // this turn shoots fireballs
      this.fireArmed = false;
      this.fired = 0;
      this.landed = 0;
      this.fireTimer = 0;
      this.firstLandX = null;
      this.comboCount = 0;
      this.comboIdx = 0;
      this.fireDir = dir;
      this.balls = [];
      BO.audio.launch();
    },

    launchOne() {
      const sp = this.ballSpeed();
      this.balls.push({
        x: this.launcherX, y: this.launchY - CFG.BALL_R - 1,
        vx: this.fireDir.dx * sp, vy: this.fireDir.dy * sp,
        active: true, recall: false, trail: [],
        fire: this.fireBalls ? 3 : 0,        // pierce budget for fireballs
      });
      this.fired++;
      if (this.fired % 4 === 1) BO.audio.launch();
    },

    endTurn() {
      this.state = 'settle';
      this.stateT = 0;
      this.settleT = 0;
      this.balls = [];
      if (this.firstLandX != null) this.launcherX = this.firstLandX;
      // descend
      for (const b of this.bricks) b.r++;
      for (const it of this.items) it.r++;
      this.rebuildGrid();
    },

    finishSettle() {
      // items at/below launch line: auto-collect
      const lastRow = Math.floor((this.launchY - this.boardTop) / this.cell) - 1;
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (it.r >= lastRow) {
          this.collectItem(it, true);
          this.items.splice(i, 1);
        }
      }
      // lose?
      for (const b of this.bricks) {
        if (this.boardTop + (b.r + 1) * this.cell > this.launchY - 4) {
          this.loseReason = 'line';
          this.state = 'losing';
          this.stateT = 0;
          BO.fx.addShake(12);
          BO.fx.addFlash(0.35);
          BO.audio.lose();
          return;
        }
      }
      // limit mode: out of moves
      if (this.mode === 'limit' && this.movesLeft <= 0 && this.bricks.length > 0) {
        this.loseReason = 'moves';
        this.state = 'losing';
        this.stateT = 0;
        BO.fx.addFlash(0.25);
        BO.audio.lose();
        return;
      }
      this.state = 'ready';
    },

    triggerWin() {
      if (this.state === 'winFly' || this.state === 'win') return;
      this.state = 'winFly';
      this.stateT = 0;
    },

    showWin() {
      this.state = 'win';
      this.stateT = 0;
      const p = this.data.par;
      this.stars = this.turns <= p ? 3 : this.turns <= p + 3 ? 2 : 1;
      this.gemReward = 10 + this.stars * 5;
      BO.store.gems += this.gemReward;
      BO.store.setStars(this.levelNum, this.stars, this.mode);
      if (this.levelNum === BO.store.levelOf(this.mode)) {
        BO.store.setLevelOf(this.mode, this.levelNum + 1);
      }
      BO.fx.confetti(this.W, this.H);
      BO.audio.win();
      this.starT = 0;
    },

    // ---------- damage ----------
    damageBrick(b, dmg, px, py, silent) {
      if (b.hp <= 0) return;
      b.hp -= dmg;
      b.flash = 1;
      b.glow = 1.6;                 // lingering neon edge
      this.score += dmg;
      if (!silent) BO.audio.hit(this.comboCount);
      if (b.hp <= 0) this.breakBrick(b, px, py);
    },

    breakBrick(b, px, py) {
      const i = this.bricks.indexOf(b);
      if (i < 0) return;
      this.bricks.splice(i, 1);
      delete this.grid[b.r + ',' + b.c];
      this.comboCount++;
      this.heat = Math.min(1, this.heat + 0.09);
      const r = this.brickRect(b);
      const col = BO.PAL.tiers[b.tier];
      BO.fx.shards(r.x + r.s / 2, r.y + r.s / 2, r.s, r.s, col, 10);
      BO.fx.flare(px || r.x + r.s / 2, py || r.y + r.s / 2, 20 + this.heat * 14);
      BO.fx.ring(r.x + r.s / 2, r.y + r.s / 2, col, 8, r.s * 0.9);
      BO.fx.addShake(1.6);
      if (this.heat > 0.5) BO.fx.addEdge(0.10);
      BO.audio.brickBreak();
      // combo popups
      while (this.comboIdx < BO.COMBOS.length && this.comboCount >= BO.COMBOS[this.comboIdx].at) {
        const cb = BO.COMBOS[this.comboIdx];
        BO.fx.combo(BO.T('combo' + this.comboIdx), this.W / 2, this.boardTop + (this.launchY - this.boardTop) * 0.42);
        BO.fx.addShake(5);
        BO.fx.addEdge(0.45);
        this.heat = Math.min(1, this.heat + 0.25);
        BO.audio.combo(this.comboIdx);
        this.comboIdx++;
      }
      if (this.bricks.length === 0) this.triggerWin();
    },

    collectItem(it, silentAuto) {
      const r = this.itemPos(it);
      if (it.type === 'ball') {
        this.ballsBonus++;
        BO.fx.floatText(r.x, r.y - 20, '+1', { color: '#8ce85c', size: 30 });
        BO.fx.ring(r.x, r.y, '#5ad02e', 4, 46);
        BO.fx.sparks(r.x, r.y, '#8ce85c', 6, 240);
        BO.audio.plusBall();
      } else if (it.type === 'gem') {
        this.gemsGot++;
        BO.store.gems += 1;
        BO.fx.floatText(r.x, r.y - 20, '+1', { color: '#ffe063', size: 30 });
        BO.fx.sparks(r.x, r.y, '#ffd11a', 10, 300);
        BO.fx.flare(r.x, r.y, 18, '#ffe9a0');
        BO.fx.ring(r.x, r.y, '#ffc21c', 4, 52);
        BO.audio.gem();
      } else if (it.type === 'bolt') {
        if (silentAuto) return; // lightning not triggered by auto-collect
        this.lightningCross(it.r, it.c);
      } else if (it.type === 'chain') {
        if (silentAuto) return;
        this.chainLightning(r.x, r.y);
      } else if (it.type === 'bomb') {
        if (silentAuto) return;
        this.bombBlast(it.r, it.c);
      }
    },

    itemPos(it) {
      return {
        x: it.c * this.cell + this.cell / 2,
        y: this.boardTop + it.r * this.cell + this.cell / 2 + this.descOffset(),
      };
    },

    lightningCross(row, col) {
      const dmg = Math.max(1, Math.round(this.data.hpUnit * 0.6));
      const cy = this.boardTop + row * this.cell + this.cell / 2;
      const cx = col * this.cell + this.cell / 2;
      BO.fx.laser(0, cy, this.W, cy);
      BO.fx.laser(cx, this.boardTop, cx, this.launchY);
      BO.fx.flare(cx, cy, 40);
      BO.fx.addFlash(0.18);
      BO.fx.addShake(7);
      BO.fx.addEdge(0.5);
      BO.audio.lightning();
      const hitList = this.bricks.filter(b => b.r === row || b.c === col);
      for (const b of hitList) {
        const r = this.brickRect(b);
        BO.fx.floatText(r.x + r.s / 2, r.y + r.s / 2, '-' + dmg, { color: '#ffe37a', size: 24 });
        this.damageBrick(b, dmg, r.x + r.s / 2, r.y + r.s / 2, true);
      }
    },

    // chain lightning: arc jumps to nearest bricks, damage decays per hop
    chainLightning(sx, sy) {
      const hops = 5;
      let dmg = Math.max(2, Math.round(this.data.hpUnit * 1.2));
      let px = sx, py = sy;
      const hit = new Set();
      const targets = [];
      for (let i = 0; i < hops; i++) {
        // nearest un-hit brick to current point
        let best = null, bd = Infinity;
        for (const b of this.bricks) {
          if (hit.has(b)) continue;
          const r = this.brickRect(b);
          const cx = r.x + r.s / 2, cy = r.y + r.s / 2;
          const d = (cx - px) * (cx - px) + (cy - py) * (cy - py);
          if (d < bd) { bd = d; best = b; }
        }
        if (!best) break;
        hit.add(best);
        const r = this.brickRect(best);
        targets.push({ b: best, x: r.x + r.s / 2, y: r.y + r.s / 2, dmg, from: [px, py] });
        px = r.x + r.s / 2; py = r.y + r.s / 2;
        dmg = Math.max(1, Math.round(dmg * 0.75));
      }
      if (!targets.length) return;
      BO.audio.lightning();
      BO.fx.addShake(6);
      BO.fx.addEdge(0.4);
      // staggered arcs for a traveling feel (drained in update())
      this.chainQueue = this.chainQueue || [];
      targets.forEach((tg, i) => {
        this.chainQueue.push({ at: this.t + i * 0.07, tg });
      });
    },

    drainChainQueue() {
      if (!this.chainQueue || !this.chainQueue.length) return;
      for (let i = this.chainQueue.length - 1; i >= 0; i--) {
        const q = this.chainQueue[i];
        if (this.t < q.at) continue;
        this.chainQueue.splice(i, 1);
        const tg = q.tg;
        if (tg.b.hp <= 0) continue;
        BO.fx.bolt(tg.from[0], tg.from[1], tg.x, tg.y, '#c890ff');
        BO.fx.flare(tg.x, tg.y, 20, '#e8d0ff');
        BO.fx.floatText(tg.x, tg.y - 24, '-' + tg.dmg, { color: '#d8b0ff', size: 24 });
        this.damageBrick(tg.b, tg.dmg, tg.x, tg.y, true);
      }
    },

    // bomb: 3x3 blast around the item cell
    bombBlast(row, col) {
      const dmg = Math.max(2, Math.round(this.data.hpUnit * 1.5));
      const cx = col * this.cell + this.cell / 2;
      const cy = this.boardTop + row * this.cell + this.cell / 2;
      BO.audio.hammer();
      BO.fx.addShake(11);
      BO.fx.addFlash(0.22);
      BO.fx.addEdge(0.5);
      BO.fx.ring(cx, cy, '#ffb428', 10, this.cell * 1.9);
      BO.fx.ring(cx, cy, '#ffffff', 6, this.cell * 1.2);
      BO.fx.flare(cx, cy, 46, '#ffd890');
      BO.fx.sparks(cx, cy, '#ff8a28', 18, 520);
      BO.fx.sparks(cx, cy, '#ffd890', 12, 380);
      BO.fx.smoke(cx, cy, 7);
      const list = this.bricks.filter(b =>
        Math.abs(b.r - row) <= 1 && Math.abs(b.c - col) <= 1);
      for (const b of list) {
        const r = this.brickRect(b);
        BO.fx.floatText(r.x + r.s / 2, r.y + r.s / 2, '-' + dmg, { color: '#ffcf6e', size: 24 });
        this.damageBrick(b, dmg, r.x + r.s / 2, r.y + r.s / 2, true);
      }
    },

    // ---------- boosters ----------
    useBooster(kind) {
      if (BO.store.gems < CFG.BOOSTER_COST) { BO.audio.lose(); return; }
      if (this.boosterArm !== kind) {   // first tap arms
        this.boosterArm = kind;
        BO.audio.click();
        return;
      }
      this.boosterArm = null;
      BO.store.gems -= CFG.BOOSTER_COST;
      if (kind === 'bolt') {
        const dmg = this.data.hpUnit;
        BO.fx.addFlash(0.25);
        BO.fx.addShake(10);
        BO.fx.addEdge(0.8);
        BO.audio.lightning();
        // laser sweep across all brick rows + a few bolts for texture
        const rowsHit = [...new Set(this.bricks.map(b => b.r))];
        for (const r of rowsHit.slice(0, 8)) {
          const cy = this.boardTop + r * this.cell + this.cell / 2;
          BO.fx.laser(0, cy, this.W, cy);
        }
        for (let i = 0; i < 3; i++) {
          BO.fx.bolt(BO.rand(0, this.W), this.boardTop, BO.rand(0, this.W), this.launchY - BO.rand(0, 200));
        }
        const list = this.bricks.slice();
        for (const b of list) {
          const r = this.brickRect(b);
          this.damageBrick(b, dmg, r.x + r.s / 2, r.y + r.s / 2, true);
        }
        this.comboCount = 0; this.comboIdx = 0;
      } else if (kind === 'hammer') {
        this.hammerMode = true;
        this.hammerRow = -1;
      } else if (kind === 'split') {
        this.splitArmed = true;
        BO.audio.plusBall();
        BO.fx.floatText(this.launcherX, this.launchY - 50, BO.T('x2balls'), { color: '#8ce85c', size: 34 });
      } else if (kind === 'fire') {
        this.fireArmed = true;
        BO.audio.lightning();
        BO.fx.floatText(this.launcherX, this.launchY - 50, BO.T('fireballs'), { color: '#ffb428', size: 34 });
        BO.fx.sparks(this.launcherX, this.launchY - 20, '#ff8a28', 10, 300);
      }
    },

    smashRow(row) {
      const list = this.bricks.filter(b => b.r === row);
      this.hammerMode = false;
      if (!list.length) { BO.store.gems += CFG.BOOSTER_COST; return; } // refund on empty
      BO.audio.hammer();
      BO.fx.addShake(14);
      BO.fx.addFlash(0.25);
      for (const b of list) {
        const r = this.brickRect(b);
        this.damageBrick(b, b.hp, r.x + r.s / 2, r.y + r.s / 2, true);
      }
      this.comboCount = 0; this.comboIdx = 0;
    },

    // ---------- physics ----------
    updateBalls(dt) {
      const g = this.gravityAcc();
      for (const b of this.balls) {
        if (!b.active) continue;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > CFG.TRAIL_LEN) b.trail.shift();
        // fireballs shed embers along their path
        if (b.fire > 0 && Math.random() < 0.35) {
          BO.fx.sparks(b.x, b.y, Math.random() < 0.5 ? '#ff8a28' : '#ffd890', 1, 130);
        }
        let remain = dt;
        let guard = 0;
        while (remain > 1e-5 && b.active && guard++ < 400) {
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const h = Math.min(remain, 6 / sp);
          if (g && !b.recall) b.vy += g * h;
          b.x += b.vx * h;
          b.y += b.vy * h;
          remain -= h;
          this.collideBall(b);
        }
      }
      // remove landed
      for (let i = this.balls.length - 1; i >= 0; i--) {
        if (!this.balls[i].active) this.balls.splice(i, 1);
      }
    },

    collideBall(b) {
      const R = CFG.BALL_R;
      // walls
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); BO.audio.bounce(); }
      else if (b.x > this.W - R) { b.x = this.W - R; b.vx = -Math.abs(b.vx); BO.audio.bounce(); }
      if (b.y < this.boardTop + R) { b.y = this.boardTop + R; b.vy = Math.abs(b.vy); BO.audio.bounce(); }
      // floor
      if (b.vy > 0 && b.y > this.launchY - R) {
        b.active = false;
        this.landed++;
        if (this.firstLandX == null) {
          this.firstLandX = BO.clamp(b.x, R + 8, this.W - R - 8);
        }
        return;
      }
      if (b.recall) return; // ignore bricks & items when recalled

      // bricks in 3x3 neighborhood
      const c0 = Math.max(0, Math.floor((b.x - R) / this.cell));
      const c1 = Math.min(CFG.COLS - 1, Math.floor((b.x + R) / this.cell));
      const r0 = Math.floor((b.y - R - this.boardTop) / this.cell);
      const r1 = Math.floor((b.y + R - this.boardTop) / this.cell);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const br = this.grid[r + ',' + c];
          if (br) this.hitBrick(b, br);
        }
      }
      // items (non blocking)
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        const p = this.itemPos(it);
        const dx = b.x - p.x, dy = b.y - p.y;
        const rr = R + this.cell * 0.26;
        if (dx * dx + dy * dy < rr * rr) {
          this.items.splice(i, 1);
          this.collectItem(it, false);
        }
      }
    },

    hitBrick(b, br) {
      const R = CFG.BALL_R;
      const x0 = br.c * this.cell, y0 = this.boardTop + br.r * this.cell;
      const s = this.cell;
      let nx = 0, ny = 0, hit = false, px = b.x, py = b.y;
      const pierce = b.fire > 0;             // fireballs pass through

      if (br.shape === 'rect') {
        const cx = BO.clamp(b.x, x0, x0 + s);
        const cy = BO.clamp(b.y, y0, y0 + s);
        const dx = b.x - cx, dy = b.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          hit = true;
          let d = Math.sqrt(d2);
          if (d < 0.0001) { // center inside: push shortest axis
            const l = b.x - x0, rr = x0 + s - b.x, t = b.y - y0, bt = y0 + s - b.y;
            const m = Math.min(l, rr, t, bt);
            if (m === l) { nx = -1; ny = 0; }
            else if (m === rr) { nx = 1; ny = 0; }
            else if (m === t) { nx = 0; ny = -1; }
            else { nx = 0; ny = 1; }
            d = 0;
          } else { nx = dx / d; ny = dy / d; }
          if (!pierce) {
            b.x = cx + nx * (R + 0.2);
            b.y = cy + ny * (R + 0.2);
          }
          px = cx; py = cy;
        }
      } else {
        // triangle: vertices by solid corner
        let v;
        if (br.shape === 'bl') v = [[x0, y0], [x0, y0 + s], [x0 + s, y0 + s]];
        else if (br.shape === 'br') v = [[x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]];
        else if (br.shape === 'tl') v = [[x0, y0], [x0 + s, y0], [x0, y0 + s]];
        else v = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s]];
        const cp = closestOnTri(b.x, b.y, v);
        const dx = b.x - cp[0], dy = b.y - cp[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          hit = true;
          let d = Math.sqrt(d2);
          if (d < 0.0001) { nx = 0; ny = -1; d = 0; }
          else { nx = dx / d; ny = dy / d; }
          if (!pierce) {
            b.x = cp[0] + nx * (R + 0.2);
            b.y = cp[1] + ny * (R + 0.2);
          }
          px = cp[0]; py = cp[1];
        }
      }
      if (!hit) return;
      // fireball: pierce through, no reflection, double damage
      if (pierce) {
        b.pierced = b.pierced || new Set();
        if (b.pierced.has(br)) return;       // still passing through this brick
        b.pierced.add(br);
        b.fire--;
        this.damageBrick(br, 2, px, py);
        BO.fx.sparks(px, py, '#ff8a28', 6, 340);
        BO.fx.flare(px, py, 16, '#ffd890');
        return;
      }
      // reflect only if moving into surface
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 2 * vn * nx;
        b.vy -= 2 * vn * ny;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        if (this.mode === 'gravity') {
          // avoid balls bouncing forever in place on a brick top
          if (ny < -0.7 && Math.abs(b.vx) < 90) {
            b.vx += (Math.random() < 0.5 ? -1 : 1) * BO.rand(90, 150);
          }
        } else if (Math.abs(b.vy) < 0.06 * sp) {
          // avoid endless horizontal ping-pong (classic/limit)
          b.vy = (b.vy >= 0 ? 1 : -1) * 0.09 * sp;
          const k = sp / Math.hypot(b.vx, b.vy);
          b.vx *= k; b.vy *= k;
        }
        this.damageBrick(br, 1, px, py);
        if (Math.random() < 0.3) BO.fx.flare(px, py, 10, '#cfeaff');
        else BO.fx.sparks(px, py, 'rgba(255,255,255,0.9)', 2, 200);
      }
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      BO.fx.update(dt);
      for (const b of this.bricks) {
        b.flash = Math.max(0, b.flash - dt * 5);
        if (b.glow) b.glow = Math.max(0, b.glow - dt * 0.9);
      }
      for (const it of this.items) it.t += dt;
      if (this.banner > 0) this.banner -= dt;
      this.stateT += dt;
      // combo heat cools between flights
      const cooling = (this.state === 'flight' || this.state === 'winFly') ? 0.055 : 0.5;
      this.heat = Math.max(0, this.heat - dt * cooling);
      this.drainChainQueue();

      if (this.overlay && this.overlay.update) this.overlay.update(dt);
      if (this.overlay) return;

      switch (this.state) {
        case 'intro':
          this.introT += dt;
          if (this.introT > 0.9) this.state = 'ready';
          break;
        case 'ready':
          if (BO.debugAuto && this.stateT > 0.4) {
            const a = -Math.PI / 2 + (this.turns % 2 ? 0.5 : -0.35);
            this.fire({ dx: Math.cos(a), dy: Math.sin(a) });
          }
          break;
        case 'flight':
        case 'winFly': {
          const mult = this.speedMult;
          this.flightT = (this.flightT || 0) + dt * mult;
          // safety: force recall if a ball is stuck in flight for too long
          if (this.flightT > CFG.MAX_FLIGHT && this.state === 'flight') {
            for (const b of this.balls) { b.recall = true; b.vx = 0; b.vy = 2600; }
            this.toFire = this.fired;
          }
          // launch queue
          if (this.state === 'flight' && this.fired < this.toFire) {
            this.fireTimer -= dt * mult;
            while (this.fireTimer <= 0 && this.fired < this.toFire) {
              this.launchOne();
              this.fireTimer += CFG.FIRE_GAP;
            }
          }
          const steps = mult;
          for (let i = 0; i < steps; i++) this.updateBalls(dt);
          if (this.state === 'flight' && this.fired >= this.toFire && this.balls.length === 0) {
            this.endTurn();
          }
          if (this.state === 'winFly' && this.stateT > 0.8) this.showWin();
          break;
        }
        case 'settle':
          this.settleT += dt;
          if (this.settleT >= 0.3) this.finishSettle();
          break;
        case 'losing':
          if (this.stateT > 1.0) this.state = 'lose';
          break;
        case 'win':
          this.starT = (this.starT || 0) + dt;
          if (BO.debugAuto && this.starT > 1.2) BO.go('game', this.levelNum + 1, this.mode);
          break;
        case 'lose':
          if (BO.debugAuto && this.stateT > 2.5) BO.go('game', this.levelNum + 1, this.mode);
          break;
      }
    },

    // ================= drawing =================
    draw(ctx, W, H) {
      this.layout(W, H);
      ctx.save();
      ctx.translate(BO.fx.shakeX, BO.fx.shakeY);

      // background
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, BO.PAL.bgTop);
      g.addColorStop(1, BO.PAL.bgBot);
      ctx.fillStyle = g;
      ctx.fillRect(-20, -20, W + 40, H + 40);
      // faint dots
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      for (let y = this.boardTop + 30; y < this.launchY; y += 64) {
        for (let x = 32 + ((y / 64 | 0) % 2) * 32; x < W; x += 64) {
          ctx.fillRect(x, y, 3, 3);
        }
      }

      this.drawBoard(ctx);
      if (this.state === 'aiming' && this.aim) this.drawGuide(ctx);
      this.drawLauncher(ctx);
      this.drawBalls(ctx);
      BO.fx.draw(ctx);
      this.drawHUD(ctx);
      this.drawBoosterBar(ctx);
      BO.fx.drawCombos(ctx, W);
      BO.fx.drawEdge(ctx, W, H);

      if (BO.fx.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + BO.fx.flash + ')';
        ctx.fillRect(-20, -20, W + 40, H + 40);
      }
      ctx.restore();

      // banner
      if (this.banner > 0 && (this.state === 'intro' || this.state === 'ready')) {
        const a = Math.min(1, this.banner / 0.4);
        ctx.globalAlpha = a;
        BO.R.outlineText(ctx, BO.T('level', this.levelNum), W / 2, this.boardTop + (this.launchY - this.boardTop) * 0.30, 64, '#fff');
        ctx.globalAlpha = 1;
      }

      // overlays
      if (this.state === 'win') this.drawWin(ctx, W, H);
      else if (this.state === 'lose') this.drawLose(ctx, W, H);
      if (this.overlay) this.overlay.draw(ctx, W, H);
    },

    drawBoard(ctx) {
      const cell = this.cell;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, this.boardTop, this.W, this.launchY - this.boardTop);
      ctx.clip();

      const off = this.descOffset();
      // items: pulsing aura + icon + occasional idle sparkle
      for (const it of this.items) {
        const p = this.itemPos(it);
        const r = cell * 0.24;
        // aura color per type
        const aura = it.type === 'ball' ? '#5ad02e'
          : it.type === 'gem' ? '#ffc21c'
          : it.type === 'chain' ? '#a45cf5'
          : it.type === 'bomb' ? '#ff6a3c'
          : '#ffd11a';
        const pulse = 0.72 + 0.28 * Math.sin(it.t * 2.6);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const ag = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * (1.7 + pulse * 0.35));
        ag.addColorStop(0, BO.R.rgba(aura, 0.20 * pulse));
        ag.addColorStop(0.7, BO.R.rgba(aura, 0.08 * pulse));
        ag.addColorStop(1, BO.R.rgba(aura, 0));
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, BO.TAU);
        ctx.fill();
        // orbiting glints
        for (let k = 0; k < 2; k++) {
          const a = it.t * 1.4 + k * Math.PI;
          const ox = p.x + Math.cos(a) * r * 1.5;
          const oy = p.y + Math.sin(a) * r * 0.62;
          const behind = Math.sin(a) < 0;
          if (!behind) continue;         // draw only the back-side pass here
          ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(ox, oy, 2.6, 0, BO.TAU);
          ctx.fillStyle = '#fff'; ctx.fill();
        }
        ctx.restore();
        // bob animation
        const bob = Math.sin(it.t * 2.2) * 3;
        if (it.type === 'ball') BO.R.drawPlusBall(ctx, p.x, p.y + bob, r, it.t);
        else if (it.type === 'gem') BO.R.drawGem(ctx, p.x, p.y + bob, r, Math.sin(it.t * 1.8) * 0.3);
        else if (it.type === 'chain') BO.R.drawChainCoin(ctx, p.x, p.y + bob, r, it.t);
        else if (it.type === 'bomb') {
          BO.R.drawBomb(ctx, p.x, p.y + bob, r, it.t);
          // fuse pre-burn: tiny sparks dripping from the fuse tip
          if ((it.t * 6 | 0) % 3 === 0 && Math.random() < 0.25) {
            BO.fx.sparks(p.x + r * 0.88, p.y + bob - r * 0.85, '#ffe063', 1, 90);
          }
        }
        else BO.R.drawCoin(ctx, p.x, p.y + bob, r, it.t);
        // front-side orbit pass
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 2; k++) {
          const a = it.t * 1.4 + k * Math.PI;
          if (Math.sin(a) < 0) continue;
          const ox = p.x + Math.cos(a) * r * 1.5;
          const oy = p.y + bob + Math.sin(a) * r * 0.62;
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.arc(ox, oy, 2.6, 0, BO.TAU);
          ctx.fillStyle = '#fff'; ctx.fill();
        }
        ctx.restore();
      }

      // bricks
      const gap = 2.5;
      for (const b of this.bricks) {
        const x = b.c * cell + gap;
        let y = this.boardTop + b.r * cell + gap + off;
        // intro drop-in
        let alpha = 1, scale = 1;
        if (this.state === 'intro') {
          const delay = (b.r * 5 + b.c) * 0.018;
          const k = BO.clamp((this.introT - delay) / 0.3, 0, 1);
          alpha = k;
          y -= (1 - k) * (1 - k) * 120;
          scale = 0.7 + 0.3 * k;
        }
        const s = cell - gap * 2;
        const tex = BO.R.brickTex(BO.PAL.tiers[b.tier], s, s, b.shape);
        ctx.save();
        ctx.globalAlpha = alpha;
        const pop = 1 + b.flash * 0.05;
        ctx.translate(x + s / 2, y + s / 2);
        ctx.scale(scale * pop, scale * pop);
        ctx.drawImage(tex, -s / 2, -s / 2, s, s);
        // hp number
        if (b.hp > 0) {
          let tx = 0, ty = 0;
          if (b.shape === 'bl') { tx = -s * 0.16; ty = s * 0.18; }
          else if (b.shape === 'br') { tx = s * 0.16; ty = s * 0.18; }
          else if (b.shape === 'tl') { tx = -s * 0.16; ty = -s * 0.14; }
          else if (b.shape === 'tr') { tx = s * 0.16; ty = -s * 0.14; }
          const fs = b.shape === 'rect' ? s * 0.34 : s * 0.26;
          BO.R.outlineText(ctx, BO.R.fmtHp(b.hp), tx, ty + 1, fs);
        }
        if (b.flash > 0) {
          ctx.globalAlpha = alpha * b.flash * 0.55;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(tex, -s / 2, -s / 2, s, s);
          ctx.globalCompositeOperation = 'source-over';
        }
        // lingering neon edge on recently-hit bricks
        if (b.glow > 0 && b.shape === 'rect') {
          const ga = Math.min(1, b.glow) * 0.9;
          ctx.globalAlpha = alpha * ga;
          ctx.shadowColor = '#6ee8ff';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#8ef0ff';
          BO.R.roundRect(ctx, -s / 2 + 1.5, -s / 2 + 1.5, s - 3, s - 3, 8);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      // hammer row highlight
      if (this.hammerMode && this.hammerRow >= 0) {
        const y = this.boardTop + this.hammerRow * cell;
        ctx.fillStyle = 'rgba(255,80,60,' + (0.18 + 0.08 * Math.sin(this.t * 8)) + ')';
        ctx.fillRect(0, y, this.W, cell);
        ctx.strokeStyle = 'rgba(255,120,90,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, y + 1, this.W - 4, cell - 2);
      }
      ctx.restore();

      // danger line
      let danger = false;
      const lastRow = Math.floor((this.launchY - this.boardTop) / this.cell);
      for (const b of this.bricks) if (b.r >= lastRow - 2) { danger = true; break; }
      ctx.save();
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = danger
        ? 'rgba(240,70,60,' + (0.5 + 0.4 * Math.sin(this.t * 7)) + ')'
        : 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.moveTo(0, this.launchY + 10);
      ctx.lineTo(this.W, this.launchY + 10);
      ctx.stroke();
      ctx.restore();

      if (this.hammerMode) {
        BO.R.outlineText(ctx, BO.T('smashRow'), this.W / 2, this.boardTop + 40, 30, '#ffb0a0');
      }
    },

    drawGuide(ctx) {
      const R = CFG.BALL_R;
      const sp = this.ballSpeed();
      const g = this.gravityAcc();
      let x = this.launcherX, y = this.launchY - R;
      let vx = this.aim.dx * sp, vy = this.aim.dy * sp;
      ctx.save();
      let dist = 0, bounces = 0, dotGap = 0, t = 0;
      const maxDist = CFG.GUIDE_LEN;
      while (dist < maxDist && t < 1.25 && bounces <= 1) {
        const v = Math.hypot(vx, vy) || 1;
        const h = 7 / v;
        if (g) vy += g * h;
        x += vx * h; y += vy * h;
        t += h;
        dist += 7;
        dotGap += 7;
        // walls
        let reflected = false;
        if (x < R) { x = R; vx = Math.abs(vx); reflected = true; }
        if (x > this.W - R) { x = this.W - R; vx = -Math.abs(vx); reflected = true; }
        if (y < this.boardTop + R) { y = this.boardTop + R; vy = Math.abs(vy); reflected = true; }
        if (reflected) bounces++;
        // floor ends the preview (gravity arcs come back down)
        if (vy > 0 && y > this.launchY - R) break;
        // brick hit stops the guide
        const c = Math.floor(x / this.cell);
        const r = Math.floor((y - this.boardTop) / this.cell);
        if (this.grid[r + ',' + c]) break;
        if (dotGap >= 26) {
          dotGap = 0;
          const a = BO.clamp(1 - dist / maxDist, 0.15, 1) * (bounces ? 0.45 : 0.95);
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, BO.TAU);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }
      ctx.restore();
    },

    drawLauncher(ctx) {
      const x = this.launcherX, y = this.launchY;
      const skin = BO.store.skinDef();
      // next-position marker
      if ((this.state === 'flight' || this.state === 'winFly') && this.firstLandX != null) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        BO.R.drawBall(ctx, this.firstLandX, y - 8, CFG.BALL_R, skin, this.t);
        ctx.restore();
      }
      // ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - 10, 20, 0, BO.TAU);
      const rg = ctx.createLinearGradient(x, y - 32, x, y + 12);
      rg.addColorStop(0, '#e8ecf5');
      rg.addColorStop(1, '#9aa3b8');
      ctx.strokeStyle = rg;
      ctx.lineWidth = 7;
      ctx.stroke();
      const remaining = this.state === 'flight'
        ? this.toFire - this.fired
        : this.ballsBase + this.ballsBonus;
      if (this.state !== 'flight' || this.fired < this.toFire) {
        BO.R.drawBall(ctx, x, y - 10, CFG.BALL_R + 1, skin, this.t);
      }
      // count label
      let label;
      if (this.state === 'flight' || this.state === 'winFly') label = remaining > 0 ? 'x' + remaining : '';
      else if (this.ballsBonus > 0) label = this.ballsBase + '+' + this.ballsBonus;
      else label = 'x' + this.ballsBase;
      if (this.splitArmed) label += ' x2';
      if (label) {
        BO.R.outlineText(ctx, label, x + (x > this.W - 110 ? -58 : 58), y - 10, 26,
          this.splitArmed ? '#8ce85c' : '#fff');
      }
      ctx.restore();
    },

    drawBalls(ctx) {
      const skin = BO.store.skinDef();
      const R = CFG.BALL_R;
      // trails: tapered fading streak through recent positions
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const b of this.balls) {
        const pts = b.trail;
        if (pts.length < 2) continue;
        const fiery = b.fire > 0;
        for (let i = 1; i < pts.length; i++) {
          const k = i / pts.length;
          ctx.globalAlpha = k * (fiery ? 0.7 : 0.45);
          ctx.lineWidth = R * (fiery ? 2.6 : 1.7) * k;
          ctx.strokeStyle = fiery
            ? 'rgba(255,' + (90 + (140 * k) | 0) + ',20,0.8)'
            : (skin.trail === 'rainbow' ? BO.R.rainbowAt(this.t + i) : skin.trail);
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        // connect to current position
        ctx.globalAlpha = fiery ? 0.8 : 0.5;
        ctx.lineWidth = R * (fiery ? 2.6 : 1.7);
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      for (const b of this.balls) {
        if (b.fire > 0) {
          // fireball: hot orb + glow
          const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, R * 2.2);
          g.addColorStop(0, '#fff8d0');
          g.addColorStop(0.35, '#ffb428');
          g.addColorStop(0.7, 'rgba(240,88,24,0.5)');
          g.addColorStop(1, 'rgba(240,88,24,0)');
          ctx.beginPath(); ctx.arc(b.x, b.y, R * 2.2, 0, BO.TAU);
          ctx.fillStyle = g; ctx.fill();
        } else {
          BO.R.drawBall(ctx, b.x, b.y, R, skin, this.t + b.x * 0.01);
        }
      }
    },

    // ---------- HUD ----------
    drawHUD(ctx) {
      const W = this.W;
      const top = 0, bh = this.hudBottom;
      ctx.fillStyle = BO.PAL.hud;
      ctx.fillRect(-20, top - 20, W + 40, bh + 20);
      ctx.fillStyle = BO.PAL.hudLine;
      ctx.fillRect(-20, bh - 3, W + 40, 3);
      const st = (BO.safeTop || 0);
      const cy = st + (CFG.HUD_H) / 2;

      // left: help + shop
      this.btnHelp = BO.R.iconButton(ctx, 14, cy - 29, 58, (c, x, y, s) => {
        c.beginPath(); c.arc(x, y, s * 0.30, 0, BO.TAU);
        c.fillStyle = '#3d8bff'; c.fill();
        BO.R.outlineText(c, '?', x, y + 1, s * 0.36, '#fff', 'rgba(10,30,80,0.4)');
      });
      this.btnSkins = BO.R.iconButton(ctx, 84, cy - 29, 58, (c, x, y) => {
        const sk = BO.store.skinDef();
        BO.R.drawBall(c, x - 7, y + 6, 10, sk, this.t);
        BO.R.drawBall(c, x + 7, y - 6, 10, sk, this.t + 2);
      });

      // right: pause
      this.btnPause = BO.R.button3D(ctx, W - 82, cy - 32, 64, 56, {
        color: '#3d8bff', depth: 6, radius: 12,
        icon: (c, x, y) => {
          c.fillStyle = '#fff';
          c.fillRect(x - 11, y - 12, 8, 24);
          c.fillRect(x + 3, y - 12, 8, 24);
        },
      });

      // center: level, score, progress
      ctx.textAlign = 'center';
      ctx.font = '800 24px ' + BO.FONT;
      ctx.fillStyle = BO.PAL.txtDim;
      const lvlTxt = BO.T('level', this.levelNum);
      ctx.fillText(lvlTxt, W / 2, st + 26);
      // mode tag next to level text
      if (this.mode !== 'classic') {
        const mdName = BO.T('mode_' + this.mode);
        const md = BO.MODES.find(m => m.id === this.mode);
        const tw = ctx.measureText(lvlTxt).width;
        ctx.font = '800 17px ' + BO.FONT;
        const mw = ctx.measureText(mdName).width + 18;
        BO.R.roundRect(ctx, W / 2 + tw / 2 + 10, st + 13, mw, 26, 13);
        ctx.fillStyle = BO.R.rgba(md.color, 0.25);
        ctx.fill();
        ctx.strokeStyle = md.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = md.color;
        ctx.fillText(mdName, W / 2 + tw / 2 + 10 + mw / 2, st + 27);
      }
      BO.R.outlineText(ctx, '' + this.score, W / 2, st + 60, 40, '#fff');
      // combo heat: score ignites (competitor-style flaming number)
      if (this.heat > 0.28) {
        const hk = (this.heat - 0.28) / 0.72;   // 0..1
        ctx.save();
        // ember glow behind the number
        ctx.globalCompositeOperation = 'lighter';
        const gw = 90 + hk * 60;
        const g = ctx.createRadialGradient(W / 2, st + 58, 6, W / 2, st + 58, gw);
        g.addColorStop(0, 'rgba(255,120,30,' + (0.35 + hk * 0.3) + ')');
        g.addColorStop(0.6, 'rgba(230,40,30,' + (0.18 + hk * 0.2) + ')');
        g.addColorStop(1, 'rgba(230,40,30,0)');
        ctx.fillStyle = g;
        ctx.fillRect(W / 2 - gw, st + 58 - gw, gw * 2, gw * 2);
        ctx.restore();
        // re-draw score in fire colors, slight pulse
        const pulse = 1 + 0.04 * hk * Math.sin(this.t * 10);
        ctx.save();
        ctx.translate(W / 2, st + 60);
        ctx.scale(pulse, pulse);
        const fg = ctx.createLinearGradient(0, -22, 0, 22);
        fg.addColorStop(0, '#fff3b0');
        fg.addColorStop(0.45, '#ffb428');
        fg.addColorStop(1, '#f03818');
        ctx.font = '900 40px ' + BO.FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(90,10,5,0.8)';
        ctx.strokeText('' + this.score, 0, 0);
        ctx.fillStyle = fg;
        ctx.fillText('' + this.score, 0, 0);
        ctx.restore();
        // rising embers
        this.emberT -= 0.016;
        if (this.emberT <= 0) {
          this.emberT = 0.10 - hk * 0.05;
          const tw = ctx.measureText('' + this.score).width;
          BO.fx.sparks(W / 2 + BO.rand(-tw / 2, tw / 2), st + 44, hk > 0.5 ? '#ff5a28' : '#ffb428', 1, 90);
        }
      }

      // progress bar
      const bw = W * 0.36, bx = W / 2 - bw / 2, by = st + 92;
      const progress = BO.clamp(this.score / this.data.totalHP, 0, 1);
      BO.R.roundRect(ctx, bx, by, bw, 10, 5);
      ctx.fillStyle = '#0c0f1c';
      ctx.fill();
      if (progress > 0.01) {
        BO.R.roundRect(ctx, bx, by, bw * progress, 10, 5);
        const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        pg.addColorStop(0, '#ffda45');
        pg.addColorStop(1, '#ff9d1e');
        ctx.fillStyle = pg;
        ctx.fill();
      }
      const marks = [0.6, 0.85, 1.0];
      marks.forEach(m => {
        BO.R.drawStar(ctx, bx + bw * m, by + 5, 13, progress >= m - 0.001);
      });
      // gems chip small (right of bar)
      BO.ui.gemChip(ctx, W / 2 + bw / 2 + 90, by + 4, BO.store.gems, 130);

      // limit mode: moves pill (floats at top of board)
      if (this.mode === 'limit') {
        const low = this.movesLeft <= 2;
        const pw2 = 190, py2 = this.hudBottom + 26;
        const pulse = low ? 0.65 + 0.35 * Math.abs(Math.sin(this.t * 5)) : 1;
        BO.R.roundRect(ctx, W / 2 - pw2 / 2, py2 - 21, pw2, 42, 21);
        ctx.fillStyle = 'rgba(8,10,22,0.78)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = low ? BO.R.rgba('#e8453c', pulse) : 'rgba(245,139,31,0.8)';
        ctx.stroke();
        BO.R.outlineText(ctx, BO.T('moves', Math.max(0, this.movesLeft)), W / 2, py2 + 1, 25,
          low ? '#ff8a7a' : '#ffcf6e');
      }
    },

    drawBoosterBar(ctx) {
      const W = this.W, top = this.boostTop;
      const inFlight = this.state === 'flight' || this.state === 'winFly';
      const bs = 88;
      const y = top + (CFG.BOOST_H - bs) / 2 - 6;
      this.btnBolt = this.btnHammer = this.btnSplit = this.btnSpeed = this.btnRecall = null;

      if (!inFlight) {
        const can = BO.store.gems >= CFG.BOOSTER_COST;
        const defs = [
          ['bolt', 26, (c, x, yy, s) => {
            BO.R.boltPath(c, x, yy, s * 0.62);
            c.fillStyle = '#ffe063'; c.fill();
            c.lineWidth = 2.5; c.strokeStyle = 'rgba(120,70,0,0.6)'; c.stroke();
          }],
          ['hammer', 26 + bs + 18, (c, x, yy, s) => {
            c.save(); c.translate(x, yy); c.rotate(-0.6);
            c.fillStyle = '#c9d2e8';
            BO.R.roundRect(c, -s * 0.28, -s * 0.26, s * 0.56, s * 0.28, 5); c.fill();
            c.fillStyle = '#8a6b4a';
            BO.R.roundRect(c, -s * 0.06, -s * 0.06, s * 0.12, s * 0.42, 4); c.fill();
            c.restore();
          }],
          ['fire', W - bs * 2 - 26 - 18, (c, x, yy, s) => {
            // fireball: orange orb + flame tail
            c.save();
            c.translate(x, yy);
            c.rotate(-0.7);
            const fg = c.createLinearGradient(-s * 0.4, 0, s * 0.2, 0);
            fg.addColorStop(0, 'rgba(255,120,20,0)');
            fg.addColorStop(1, 'rgba(255,150,40,0.85)');
            c.fillStyle = fg;
            c.beginPath();
            c.moveTo(-s * 0.42, 0);
            c.quadraticCurveTo(-s * 0.1, -s * 0.16, s * 0.12, -s * 0.10);
            c.lineTo(s * 0.12, s * 0.10);
            c.quadraticCurveTo(-s * 0.1, s * 0.16, -s * 0.42, 0);
            c.fill();
            const g2 = c.createRadialGradient(s * 0.08, -s * 0.04, s * 0.02, s * 0.12, 0, s * 0.2);
            g2.addColorStop(0, '#fff3b0');
            g2.addColorStop(0.5, '#ffb428');
            g2.addColorStop(1, '#f05818');
            c.beginPath(); c.arc(s * 0.12, 0, s * 0.18, 0, BO.TAU);
            c.fillStyle = g2; c.fill();
            c.restore();
          }],
          ['split', W - bs - 26, (c, x, yy, s) => {
            const sk = BO.store.skinDef();
            BO.R.drawBall(c, x - s * 0.14, yy - s * 0.10, s * 0.16, sk, this.t);
            BO.R.drawBall(c, x + s * 0.14, yy + s * 0.10, s * 0.16, sk, this.t + 1);
            BO.R.outlineText(c, 'x2', x, yy - s * 0.30, s * 0.2, '#8ce85c');
          }],
        ];
        for (const [kind, bx, icon] of defs) {
          const armed = this.boosterArm === kind
            || (kind === 'split' && this.splitArmed)
            || (kind === 'fire' && this.fireArmed);
          const rect = BO.R.button3D(ctx, bx, y, bs, bs, {
            color: armed ? '#2fbb2f' : '#333a52',
            depth: 7, radius: 16, disabled: !can && !armed, icon,
          });
          // cost chip
          const ready = (kind === 'split' && this.splitArmed) || (kind === 'fire' && this.fireArmed);
          if (!ready) {
            const ccx = bx + bs / 2;
            BO.R.drawGem(ctx, ccx - 22, y + bs + 22, 10, 0);
            BO.R.outlineText(ctx, '' + CFG.BOOSTER_COST, ccx + 12, y + bs + 22, 19,
              can ? '#ffe063' : '#e86a6a');
          } else {
            BO.R.outlineText(ctx, BO.T('ready'), bx + bs / 2, y + bs + 22, 19, '#8ce85c');
          }
          if (this.boosterArm === kind) {
            BO.R.outlineText(ctx, BO.T('tapAgain'), bx + bs / 2, y - 16, 19, '#8ce85c');
          }
          if (kind === 'bolt') this.btnBolt = rect;
          else if (kind === 'hammer') this.btnHammer = rect;
          else if (kind === 'fire') this.btnFireball = rect;
          else this.btnSplit = rect;
        }
      } else {
        // recall + speed
        this.btnRecall = BO.R.button3D(ctx, 26, y, bs, bs, {
          color: '#333a52', depth: 7, radius: 16,
          icon: (c, x, yy, s) => {
            c.strokeStyle = '#ffb0a0'; c.lineWidth = 6; c.lineCap = 'round';
            c.beginPath(); c.moveTo(x, yy - s * 0.22); c.lineTo(x, yy + s * 0.18); c.stroke();
            c.beginPath(); c.moveTo(x - s * 0.14, yy + 0.02 * s); c.lineTo(x, yy + s * 0.2); c.lineTo(x + s * 0.14, yy + 0.02 * s); c.stroke();
          },
        });
        this.btnSpeed = BO.R.button3D(ctx, W - bs - 26, y, bs, bs, {
          color: this.speedMult > 1 ? '#2fbb2f' : '#333a52', depth: 7, radius: 16,
          text: 'x' + this.speedMult, size: 30,
        });
      }
    },

    // ---------- win / lose ----------
    drawWin(ctx, W, H) {
      BO.ui.dim(ctx, W, H, 0.7);
      const pw = W * 0.84, ph = H * 0.44;
      const px = (W - pw) / 2, py = (H - ph) / 2;
      BO.ui.panel(ctx, px, py, pw, ph);
      BO.R.outlineText(ctx, BO.T('cleared'), W / 2, py + 64, 44, '#8ce85c');
      // stars
      const t = this.starT || 0;
      for (let i = 0; i < 3; i++) {
        const lit = i < this.stars && t > 0.3 + i * 0.35;
        const cxs = W / 2 + (i - 1) * 110;
        const cys = py + 160 - (i === 1 ? 16 : 0);
        let sc = 1;
        if (lit) {
          const k = BO.clamp((t - (0.3 + i * 0.35)) / 0.25, 0, 1);
          sc = 1.6 - 0.6 * k;
          if (k >= 1 && !this['starSnd' + i]) { this['starSnd' + i] = 1; BO.audio.star(i); }
        }
        ctx.save();
        ctx.translate(cxs, cys);
        ctx.scale(sc, sc);
        BO.R.drawStar(ctx, 0, 0, i === 1 ? 52 : 42, lit);
        ctx.restore();
      }
      BO.R.outlineText(ctx, BO.T('score') + '  ' + this.score, W / 2, py + 250, 30, '#dfe5fa');
      // gems
      BO.R.drawGem(ctx, W / 2 - 56, py + 302, 16, 0);
      BO.R.outlineText(ctx, '+' + (this.gemReward + this.gemsGot), W / 2 + 6, py + 302, 30, '#ffe063');
      this.btnNext = BO.R.button3D(ctx, W / 2 - pw * 0.28, py + ph - 110, pw * 0.56, 82,
        { color: '#2fbb2f', text: BO.T('next'), size: 38 });
      this.btnHome = BO.R.button3D(ctx, px + 30, py + ph - 102, 92, 66,
        { color: '#3d8bff', text: '⌂', size: 34 });
      this.btnRetryS = BO.R.button3D(ctx, px + pw - 122, py + ph - 102, 92, 66,
        { color: '#f58b1f', text: '↻', size: 34 });
    },

    drawLose(ctx, W, H) {
      BO.ui.dim(ctx, W, H, 0.7);
      const pw = W * 0.84, ph = H * 0.34;
      const px = (W - pw) / 2, py = (H - ph) / 2;
      BO.ui.panel(ctx, px, py, pw, ph);
      BO.R.outlineText(ctx, BO.T('failed'), W / 2, py + 70, 44, '#ff7a6a');
      if (this.loseReason === 'moves') {
        BO.R.outlineText(ctx, BO.T('outOfMoves'), W / 2, py + 130, 30, '#ffcf6e');
      } else {
        const progress = Math.round(BO.clamp(this.score / this.data.totalHP, 0, 1) * 100);
        BO.R.outlineText(ctx, BO.T('destroyed', progress), W / 2, py + 130, 28, '#dfe5fa');
      }
      BO.R.outlineText(ctx, BO.T('dontGiveUp'), W / 2, py + 176, 24, '#8b93b0');
      this.btnRetry = BO.R.button3D(ctx, W / 2 - pw * 0.28, py + ph - 112, pw * 0.56, 82,
        { color: '#2fbb2f', text: BO.T('retry'), size: 38 });
      this.btnHome = BO.R.button3D(ctx, px + 30, py + ph - 102, 92, 66,
        { color: '#3d8bff', text: '⌂', size: 34 });
    },

    makePause() {
      const self = this;
      const o = { t: 0 };
      o.update = dt => { o.t += dt; };
      o.draw = function (ctx, W, H) {
        BO.ui.dim(ctx, W, H, 0.7);
        const pw = W * 0.74, ph = H * 0.46;
        const px = (W - pw) / 2, py = (H - ph) / 2;
        BO.ui.panel(ctx, px, py, pw, ph);
        BO.R.outlineText(ctx, BO.T('paused'), W / 2, py + 60, 42, '#fff');
        const bw = pw * 0.72, bx = W / 2 - bw / 2;
        o.rResume = BO.R.button3D(ctx, bx, py + 110, bw, 74, { color: '#2fbb2f', text: BO.T('resume'), size: 32 });
        o.rRestart = BO.R.button3D(ctx, bx, py + 210, bw, 74, { color: '#3d8bff', text: BO.T('restart'), size: 32 });
        o.rSound = BO.R.button3D(ctx, bx, py + 310, bw, 74, {
          color: '#333a52', text: BO.store.sound ? BO.T('soundOn') : BO.T('soundOff'), size: 28,
        });
        o.rHome = BO.R.button3D(ctx, bx, py + 410, bw, 74, { color: '#e8453c', text: BO.T('home'), size: 32 });
      };
      o.pointer = function (type, x, y) {
        if (type !== 'up') return null;
        if (BO.inRect(x, y, o.rResume)) { BO.audio.click(); return 'close'; }
        if (BO.inRect(x, y, o.rRestart)) { BO.audio.click(); BO.go('game', self.levelNum, self.mode); return null; }
        if (BO.inRect(x, y, o.rSound)) { BO.store.sound = !BO.store.sound; BO.audio.click(); return null; }
        if (BO.inRect(x, y, o.rHome)) { BO.audio.click(); BO.go('title'); return null; }
        return null;
      };
      return o;
    },

    // hardware back: always consumed in-game
    onBack() {
      if (this.overlay) {           // close any open panel (pause/shop/help)
        this.overlay = null;
        BO.audio.click();
        return true;
      }
      if (this.state === 'win' || this.state === 'lose') {
        BO.go('title');
        return true;
      }
      if (this.hammerMode) {        // cancel hammer targeting
        this.hammerMode = false;
        return true;
      }
      // aiming? drop the aim, then pause
      if (this.state === 'aiming') {
        this.state = 'ready';
        this.aim = null;
      }
      this.overlay = this.makePause();
      BO.audio.click();
      return true;
    },

    // ---------- input ----------
    pointer(type, x, y) {
      if (this.overlay) {
        if (this.overlay.pointer(type, x, y) === 'close') this.overlay = null;
        return;
      }
      if (this.state === 'win') {
        if (type === 'up') {
          if (BO.inRect(x, y, this.btnNext)) { BO.audio.click(); BO.go('game', this.levelNum + 1, this.mode); }
          else if (BO.inRect(x, y, this.btnHome)) { BO.audio.click(); BO.go('title'); }
          else if (BO.inRect(x, y, this.btnRetryS)) { BO.audio.click(); BO.go('game', this.levelNum, this.mode); }
        }
        return;
      }
      if (this.state === 'lose') {
        if (type === 'up') {
          if (BO.inRect(x, y, this.btnRetry)) { BO.audio.click(); BO.go('game', this.levelNum, this.mode); }
          else if (BO.inRect(x, y, this.btnHome)) { BO.audio.click(); BO.go('title'); }
        }
        return;
      }

      // hammer target mode
      if (this.hammerMode) {
        const row = Math.floor((y - this.boardTop) / this.cell);
        if (type === 'down' || type === 'move') {
          this.hammerRow = row;
        } else if (type === 'up') {
          if (y > this.boostTop) { this.hammerMode = false; return; } // cancel
          if (row >= 0) this.smashRow(row);
          this.hammerRow = -1;
        }
        return;
      }

      if (type === 'down') {
        if (BO.inRect(x, y, this.btnPause)) { this.pendPause = true; return; }
        this.pendPause = false;
        if (this.state === 'ready' && y < this.boostTop && y > this.hudBottom) {
          this.aimStart = { x, y };
          this.updateAim(x, y);
          if (this.aim) this.state = 'aiming';
          else this.aimPending = true;
        }
      } else if (type === 'move') {
        if (this.state === 'aiming' || this.aimPending) {
          this.updateAim(x, y);
          if (this.aim) { this.state = 'aiming'; this.aimPending = false; }
        }
      } else if (type === 'up') {
        // HUD buttons
        if (this.pendPause && BO.inRect(x, y, this.btnPause)) {
          BO.audio.click();
          this.overlay = this.makePause();
          if (this.state === 'aiming') this.state = 'ready';
          this.aim = null;
          return;
        }
        if (BO.inRect(x, y, this.btnHelp)) { BO.audio.click(); this.overlay = BO.makeHelp(); return; }
        if (BO.inRect(x, y, this.btnSkins)) { BO.audio.click(); this.overlay = BO.makeShop(); return; }

        if (this.state === 'flight' || this.state === 'winFly') {
          if (BO.inRect(x, y, this.btnSpeed)) {
            this.speedMult = this.speedMult >= 3 ? 1 : this.speedMult + 1;
            BO.audio.click();
          } else if (BO.inRect(x, y, this.btnRecall)) {
            BO.audio.click();
            for (const b of this.balls) { b.recall = true; b.vx = 0; b.vy = 2600; }
            this.toFire = this.fired; // stop launching more
          }
          return;
        }
        if (this.state === 'ready' || this.state === 'aiming') {
          // boosters
          if (BO.inRect(x, y, this.btnBolt)) { this.useBooster('bolt'); return; }
          if (BO.inRect(x, y, this.btnHammer)) { this.useBooster('hammer'); return; }
          if (BO.inRect(x, y, this.btnFireball)) { this.useBooster('fire'); return; }
          if (BO.inRect(x, y, this.btnSplit)) { this.useBooster('split'); return; }
          const armBtn = { bolt: this.btnBolt, hammer: this.btnHammer, fire: this.btnFireball, split: this.btnSplit }[this.boosterArm];
          if (this.boosterArm && !BO.inRect(x, y, armBtn)) {
            this.boosterArm = null;
          }
        }
        if (this.state === 'aiming') {
          if (this.aim) this.fire(this.aim);
          else this.state = 'ready';
          this.aim = null;
          this.aimPending = false;
        }
        this.aimPending = false;
      }
    },

    updateAim(x, y) {
      const dx = x - this.launcherX;
      const dy = y - (this.launchY - CFG.BALL_R);
      const len = Math.hypot(dx, dy);
      const minSin = Math.sin(CFG.MIN_AIM_DEG * Math.PI / 180);
      if (len < 26 || dy >= 0 || (-dy / len) < minSin) {
        this.aim = null;
        return;
      }
      this.aim = { dx: dx / len, dy: dy / len };
    },
  };

  // closest point on triangle (2D)
  function closestOnTri(px, py, v) {
    // inside test via sign of cross products
    let inside = true;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = v[i], [bx, by] = v[(i + 1) % 3];
      const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
      // winding may vary; use consistent check below instead
    }
    // robust: check via barycentric-ish (compute closest on each edge, and test inside with two orientations)
    if (pointInTri(px, py, v)) return [px, py];
    let best = null, bd = Infinity;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = v[i], [bx, by] = v[(i + 1) % 3];
      const abx = bx - ax, aby = by - ay;
      const t = BO.clamp(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby), 0, 1);
      const cx = ax + abx * t, cy = ay + aby * t;
      const d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
    return best;
  }
  function pointInTri(px, py, v) {
    const s = (v[1][0] - v[0][0]) * (py - v[0][1]) - (v[1][1] - v[0][1]) * (px - v[0][0]);
    const t = (v[2][0] - v[1][0]) * (py - v[1][1]) - (v[2][1] - v[1][1]) * (px - v[1][0]);
    const u = (v[0][0] - v[2][0]) * (py - v[2][1]) - (v[0][1] - v[2][1]) * (px - v[2][0]);
    return (s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0);
  }
})();
