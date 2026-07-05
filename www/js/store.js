// ============================================================
// Brick Out - persistence (localStorage)
// ============================================================
(function () {
  const KEY = 'brickout_save_v1';
  let data = {
    level: 1,          // classic progress
    levelGravity: 1,
    levelLimit: 1,
    mode: 'classic',   // last selected mode
    gems: 150,
    skin: 'lime',
    owned: ['lime'],
    sound: true,
    lang: 'auto',      // 'auto' follows device language
    stars: {},         // (modePrefix+level) -> stars
    best: {},          // level -> best score
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* fresh start */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  BO.store = {
    get level() { return data.level; },
    set level(v) { data.level = v; save(); },
    get mode() { return data.mode || 'classic'; },
    set mode(v) { data.mode = v; save(); },
    levelOf(mode) {
      if (mode === 'gravity') return data.levelGravity || 1;
      if (mode === 'limit') return data.levelLimit || 1;
      return data.level;
    },
    setLevelOf(mode, v) {
      if (mode === 'gravity') data.levelGravity = v;
      else if (mode === 'limit') data.levelLimit = v;
      else data.level = v;
      save();
    },
    get gems() { return data.gems; },
    set gems(v) { data.gems = Math.max(0, v | 0); save(); },
    get skin() { return data.skin; },
    set skin(v) { data.skin = v; save(); },
    get sound() { return data.sound; },
    set sound(v) { data.sound = !!v; save(); },
    get lang() { return data.lang || 'auto'; },
    set lang(v) { data.lang = v; save(); },
    owns(id) { return data.owned.indexOf(id) >= 0; },
    buy(id) { if (!this.owns(id)) { data.owned.push(id); save(); } },
    starKey(lv, mode) { return (mode && mode !== 'classic' ? mode[0] + '_' : '') + lv; },
    starsOf(lv, mode) { return data.stars[this.starKey(lv, mode)] || 0; },
    setStars(lv, s, mode) {
      if (s > this.starsOf(lv, mode)) { data.stars[this.starKey(lv, mode)] = s; save(); }
    },
    skinDef() {
      return BO.SKINS.find(s => s.id === data.skin) || BO.SKINS[0];
    },
  };
})();
