// ============================================================
// Brick Out - config: constants, palette, skins
// ============================================================
window.BO = {};

BO.CFG = {
  W: 750,                 // logical width, height derived from aspect
  COLS: 7,
  BALL_R: 9,
  BALL_SPEED: 1560,       // logical units / second
  FIRE_GAP: 0.052,        // seconds between launched balls
  TRAIL_LEN: 6,
  HUD_H: 116,             // below safe-area top
  BOOST_H: 148,           // bottom booster strip (above safe-area bottom)
  BOOSTER_COST: 100,
  MAX_SHAKE: 16,
  GUIDE_LEN: 1500,
  MIN_AIM_DEG: 7,         // min angle above horizontal
  GRAVITY: 1100,          // gravity mode: ball acceleration (u/s^2)
  BALL_SPEED_G: 1900,     // gravity mode launch speed
  MAX_FLIGHT: 40,         // safety: force recall after this many seconds
};

BO.MODES = [
  { id: 'classic', name: 'CLASSIC', color: '#3d8bff' },
  { id: 'gravity', name: 'GRAVITY', color: '#9450e8' },
  { id: 'limit',   name: 'LIMIT',   color: '#f58b1f' },
];

BO.PAL = {
  bgTop: '#1e2338',
  bgBot: '#141827',
  hud: '#151928',
  hudLine: '#0a0d17',
  panel: '#1c2136',
  panelLine: '#2c3352',
  txt: '#ffffff',
  txtDim: '#8b93b0',
  numStroke: 'rgba(10,12,26,0.62)',
  gold: '#ffc21c',
  goldDark: '#e0940e',
  green: '#3ec93e',
  greenDark: '#249a24',
  blue: '#3d8bff',
  red: '#e8453c',
  // brick tier colors (by hp tier)
  tiers: ['#63c72f', '#2f7be8', '#ea3e9b', '#f58b1f', '#e04444', '#9450e8', '#22bfae', '#d8b912'],
  logo: ['#f0389c', '#f8681e', '#f8a01e', '#ffc61c', '#58c832', '#28b45c', '#2e8cf0', '#8850e8'],
};

BO.SKINS = [
  { id: 'lime',    name: 'LIME',    cost: 0,   color: '#5ad02e', hi: '#a8f07c', trail: 'rgba(90,208,46,0.28)' },
  { id: 'blaze',   name: 'BLAZE',   cost: 150, color: '#ff7a1e', hi: '#ffc48a', trail: 'rgba(255,122,30,0.30)' },
  { id: 'frost',   name: 'FROST',   cost: 150, color: '#35c4ee', hi: '#b0ecfc', trail: 'rgba(53,196,238,0.30)' },
  { id: 'violet',  name: 'VIOLET',  cost: 250, color: '#a45cf5', hi: '#d8bcfc', trail: 'rgba(164,92,245,0.30)' },
  { id: 'gold',    name: 'GOLD',    cost: 250, color: '#ffc21c', hi: '#ffe9a0', trail: 'rgba(255,194,28,0.30)' },
  { id: 'rainbow', name: 'RAINBOW', cost: 400, color: 'rainbow', hi: '#ffffff', trail: 'rainbow' },
];

// combo thresholds -> popup text
BO.COMBOS = [
  { at: 6,  txt: 'GOOD' },
  { at: 12, txt: 'GREAT!' },
  { at: 20, txt: 'SUPER' },
  { at: 32, txt: 'AMAZING!' },
  { at: 50, txt: 'INSANE!!' },
];

BO.FONT = "'Arial Black','Avenir-Black','Helvetica Neue',Arial,sans-serif";
BO.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
BO.lerp = (a, b, t) => a + (b - a) * t;
BO.rand = (a, b) => a + Math.random() * (b - a);
BO.TAU = Math.PI * 2;
