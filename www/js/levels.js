// ============================================================
// Brick Out - level definitions & procedural generation
// Layout chars (7 per row):
//  '.'      empty
//  '1'-'9'  brick, hp = digit * hpUnit
//  'a/b/c/d' triangle (solid corner: bl/br/tl/tr), weight 1
//  'A/B/C/D' triangle heavy, weight 3
//  '+'      +1 ball item     'g' gem item     'L' lightning coin
//  'z'      chain-lightning coin    'o' bomb item
// ============================================================
(function () {
  const L = [];

  L.push({ rows: [ // 1 - warm up
    '1111111',
    '1.g.+.1',
    '.11111.',
  ]});
  L.push({ rows: [ // 2 - checker
    '1.2.2.1',
    '.1.g.1.',
    '2.1+1.2',
    '.1.1.1.',
  ]});
  L.push({ rows: [ // 3 - pyramid
    '...2...',
    '..212..',
    '.21+12.',
    '2211122',
    'g.....g',
  ]});
  L.push({ rows: [ // 4 - triangles intro
    'c21+12d',
    '.2222..',
    'a1L.g1b',
    '.11+11.',
  ]});
  L.push({ rows: [ // 5 - twin towers
    '22...22',
    '22.g.22',
    '22+z+22',
    '22.g.22',
    '11...11',
  ]});
  L.push({ rows: [ // 6 - the ghost (like the original screenshot)
    '.22c22.',
    '2222222',
    '3333333',
    '2222222',
    'gLLLLLg',
    '.22+22.',
    '22.g.22',
    '+2.+.2+',
  ]});
  L.push({ rows: [ // 7 - zigzag
    '33.....',
    '.33..g.',
    '..33.+.',
    '...33..',
    '.g..33.',
    '.+...33',
    '221+122',
  ]});
  L.push({ rows: [ // 8 - fortress
    'c33333d',
    '3.g.o.3',
    '3.+.g.3',
    '3..+..3',
    'a33333b',
    '.+...+.',
  ]});
  L.push({ rows: [ // 9 - X marks
    '4.....4',
    '.3.g.3.',
    '..2+2..',
    '...3...',
    '..2+2..',
    '.3.g.3.',
    '4..z..4',
  ]});
  L.push({ rows: [ // 10 - ring
    '.33333.',
    '3.....3',
    '3.gL+.3',
    '3..+..3',
    '3.....3',
    '.33333.',
  ]});
  L.push({ rows: [ // 11 - comb
    '4.4.4.4',
    '4.4.4.4',
    '4g4+4L4',
    '4.4.4.4',
    '1112111',
    '..+.g..',
  ]});
  L.push({ rows: [ // 12 - arrow down
    '4444444',
    'a44444b',
    '.a444b.',
    '..a4b..',
    '.g.+.L.',
    '..232..',
    '.+...+.',
  ]});
  L.push({ rows: [ // 13 - diamonds
    '...c4..',
    '..c44d.',
    '.c444+d',
    'a4g4L4b',
    '.a444b.',
    '..a4b+.',
    '...a4..',
  ]});
  L.push({ rows: [ // 14 - corridors
    '55.g.55',
    '55.2.55',
    '55+2+55',
    '...2...',
    '55.2.55',
    '55o2.55',
    '..+g+..',
  ]});
  L.push({ rows: [ // 15 - heavy top
    '6666666',
    '5555555',
    '.g.+z..',
    '2.2.2.2',
    '.+...g.',
    '1122211',
  ]});
  L.push({ rows: [ // 16 - butterfly
    '5c...d5',
    '55c.d55',
    '555g555',
    '55d+c55',
    '5d.o.c5',
    '.+...+.',
    '..222..',
  ]});
  L.push({ rows: [ // 17 - cage
    '5.5.5.5',
    '.5.5.5.',
    '5g5.5+5',
    '.5.5.5.',
    '5.5z5.5',
    '.5.5.5.',
    '+..g..+',
  ]});
  L.push({ rows: [ // 18 - big pyramid
    '...6...',
    '..656..',
    '.65+56.',
    '65g.o56',
    '5544455',
    '.+...+.',
    '..333..',
  ]});
  L.push({ rows: [ // 19 - walls & window
    '666.666',
    '666g666',
    '...+...',
    '666z666',
    '666.666',
    '.+...+.',
    '.44g44.',
  ]});
  L.push({ rows: [ // 20 - the face
    '.66666.',
    '6..6..6',
    '6.g6L.6',
    '6666666',
    '6.+.+.6',
    '6a555b6',
    '.66666.',
    '+..g..+',
  ]});
  L.push({ rows: [ // 21 - spiral
    '7777777',
    '......7',
    '77777g7',
    '7...7+7',
    '7.7o7.7',
    '7.777.7',
    '7....+7',
    '7777777',
  ]});
  L.push({ rows: [ // 22 - triangle storm
    'CdcDCdc',
    '.7g7+7.',
    'BabABab',
    '.7+7z7.',
    'CdcDCdc',
    '.g.+.g.',
  ]});
  L.push({ rows: [ // 23 - core
    '..777..',
    '.77877.',
    '778+877',
    '78gL+87',
    '778+877',
    '.77877.',
    '..777..',
  ]});
  L.push({ rows: [ // 24 - final gate
    '8888888',
    '8.....8',
    '8.888.8',
    '8.8g8.8',
    '8.8+8o8',
    '8.888.8',
    '8..+..8',
    '8888888',
  ]});

  // deterministic PRNG for procedural levels
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function procedural(n) {
    const rnd = mulberry32(n * 7349 + 13);
    // cap rows so the board never spawns past the danger line:
    // board height = viewH - hud - boosters - launch margin, minus 2 rows
    // of headroom (first descent + breathing room)
    const cell = BO.CFG.W / BO.CFG.COLS;
    const boardH = (BO.viewH || 1600) - (BO.safeTop || 14) - BO.CFG.HUD_H
      - (BO.safeBottom || 8) - BO.CFG.BOOST_H - 24;
    const maxRows = Math.max(5, Math.floor(boardH / cell) - 3);
    const R = Math.min(6 + ((n / 4) | 0), maxRows);
    const rows = [];
    const half = 4; // 0..3 mirrored
    for (let r = 0; r < R; r++) {
      let left = '';
      for (let c = 0; c < half; c++) {
        const v = rnd();
        if (v < 0.38) left += '.';
        else if (v < 0.50) {
          left += 'abcd'[(rnd() * 4) | 0];
        } else {
          const digits = '1223345';
          left += digits[(rnd() * digits.length) | 0];
        }
      }
      // mirror (skip center duplicate)
      let row = left + left.slice(0, 3).split('').reverse().join('');
      // mirror triangles orientation on right side
      row = row.split('');
      for (let c = 4; c < 7; c++) {
        const m = { a: 'b', b: 'a', c: 'd', d: 'c', A: 'B', B: 'A', C: 'D', D: 'C' };
        if (m[row[c]]) row[c] = m[row[c]];
      }
      rows.push(row);
    }
    // sprinkle items into empties
    // sprinkle items into empties; special coins rotate by level number
    const special = ['L', 'z', 'o'][n % 3];
    const wanted = [['+', 2 + ((R / 3) | 0)], ['g', 1 + ((rnd() * 2.5) | 0)], [special, rnd() < 0.8 ? 1 : 0]];
    for (const [ch, cnt] of wanted) {
      let placed = 0, guard = 0;
      while (placed < cnt && guard++ < 200) {
        const r = (rnd() * R) | 0, c = (rnd() * 7) | 0;
        if (rows[r][c] === '.') {
          rows[r][c] = ch; placed++;
        }
      }
    }
    return { rows: rows.map(r => r.join ? r.join('') : r) };
  }

  const TRI = { a: 'bl', b: 'br', c: 'tl', d: 'tr', A: 'bl', B: 'br', C: 'tl', D: 'tr' };

  BO.levels = {
    handcrafted: L.length,
    get(n, mode) {
      mode = mode || 'classic';
      const def = n <= L.length ? L[n - 1] : procedural(n);
      const balls = Math.min(150, 18 + Math.round(n * 2.4));
      // weights -> hp scale
      let totalWeight = 0;
      for (const row of def.rows) {
        for (const ch of row) {
          if (ch >= '1' && ch <= '9') totalWeight += +ch;
          else if ('abcd'.includes(ch)) totalWeight += 0.6;
          else if ('ABCD'.includes(ch)) totalWeight += 1.8;
        }
      }
      // gravity arcs are harder to aim, limit gets a small discount too
      const modeScale = mode === 'gravity' ? 0.72 : mode === 'limit' ? 0.9 : 1;
      const hpUnit = Math.max(2, Math.round(
        balls * (3.5 + 9.5 * Math.min(1, (n - 1) / 15)) * modeScale / Math.max(1, totalWeight)));
      const bricks = [], items = [];
      let totalHP = 0;
      def.rows.forEach((row, r) => {
        for (let c = 0; c < 7; c++) {
          const ch = row[c] || '.';
          if (ch >= '1' && ch <= '9') {
            const hp = +ch * hpUnit;
            bricks.push({ r, c, hp, maxHp: hp, shape: 'rect' });
            totalHP += hp;
          } else if (TRI[ch]) {
            const mult = ch === ch.toUpperCase() ? 1.8 : 0.6;
            const hp = Math.max(1, Math.round(hpUnit * mult));
            bricks.push({ r, c, hp, maxHp: hp, shape: TRI[ch] });
            totalHP += hp;
          } else if (ch === '+') items.push({ r, c, type: 'ball' });
          else if (ch === 'g') items.push({ r, c, type: 'gem' });
          else if (ch === 'L') items.push({ r, c, type: 'bolt' });
          else if (ch === 'z') items.push({ r, c, type: 'chain' });
          else if (ch === 'o') items.push({ r, c, type: 'bomb' });
        }
      });
      // color tier by relative hp
      for (const b of bricks) {
        const t = Math.round(b.hp / hpUnit);
        b.tier = BO.clamp(t - 1, 0, BO.PAL.tiers.length - 1);
      }
      const par = Math.ceil(totalHP / (balls * 4.2)) + 1;
      const moves = mode === 'limit' ? Math.max(4, par + 2) : 0;
      return { bricks, items, rows: def.rows.length, balls, hpUnit, totalHP, par, moves };
    },
  };
})();
