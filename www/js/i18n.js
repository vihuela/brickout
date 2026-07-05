// ============================================================
// Brick Out - i18n: zh-CN / zh-TW / en / ja / ko
// First launch follows device language, falls back to English.
// ============================================================
(function () {
  const D = {
    en: {
      subtitle: 'SHOOT BALLS & BREAK BRICKS',
      play: 'PLAY',
      lv: 'LV {n}',
      level: 'LEVEL {n}',
      mode_classic: 'CLASSIC', mode_gravity: 'GRAVITY', mode_limit: 'LIMIT',
      moves: 'MOVES: {n}',
      combo0: 'GOOD', combo1: 'GREAT!', combo2: 'SUPER', combo3: 'AMAZING!', combo4: 'INSANE!!',
      x2balls: 'x2 BALLS!', fireballs: 'FIREBALLS!',
      ready: 'READY', tapAgain: 'TAP AGAIN', smashRow: 'TAP A ROW TO SMASH',
      cleared: 'LEVEL CLEARED!', score: 'SCORE', next: 'NEXT', retry: 'RETRY',
      failed: 'LEVEL FAILED', outOfMoves: 'OUT OF MOVES!', destroyed: '{n}% DESTROYED',
      dontGiveUp: "Don't give up!",
      paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART',
      soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', home: 'HOME',
      shopTitle: 'BALLS', equipped: 'EQUIPPED', tapToUse: 'TAP TO USE', close: 'CLOSE',
      howToPlay: 'HOW TO PLAY', gotIt: 'GOT IT',
      help: [
        ['1.', 'Swipe to aim, release to fire balls.'],
        ['2.', 'Balls bounce and damage every brick'],
        ['', 'they touch. Numbers = hits needed.'],
        ['3.', 'Bricks descend after each shot.'],
        ['', "Don't let them reach the line!"],
        ['4.', 'Collect +1 balls, gems and'],
        ['', 'coins: laser, chain zap, bomb!'],
      ],
      settings: 'SETTINGS', language: 'LANGUAGE',
      terms: 'Terms of Service', privacy: 'Privacy Policy',
    },
    'zh-CN': {
      subtitle: '发射弹球 击碎砖块',
      play: '开始游戏',
      lv: '第 {n} 关',
      level: '第 {n} 关',
      mode_classic: '经典', mode_gravity: '重力', mode_limit: '限步',
      moves: '剩余步数 {n}',
      combo0: '不错', combo1: '很棒!', combo2: '超赞!', combo3: '惊人!', combo4: '疯狂!!',
      x2balls: '双倍弹球!', fireballs: '火球来袭!',
      ready: '已就绪', tapAgain: '再按确认', smashRow: '点击要粉碎的行',
      cleared: '过关啦!', score: '得分', next: '下一关', retry: '重试',
      failed: '挑战失败', outOfMoves: '步数用尽!', destroyed: '已摧毁 {n}%',
      dontGiveUp: '别灰心，再试一次!',
      paused: '已暂停', resume: '继续游戏', restart: '重新开始',
      soundOn: '音效：开', soundOff: '音效：关', home: '返回主页',
      shopTitle: '弹球', equipped: '使用中', tapToUse: '点击使用', close: '关闭',
      howToPlay: '玩法说明', gotIt: '知道了',
      help: [
        ['1.', '滑动瞄准，松手发射弹球。'],
        ['2.', '弹球反弹并削减砖块数字，'],
        ['', '数字归零即被击碎。'],
        ['3.', '每回合后砖块下压一行，'],
        ['', '别让它们触底！'],
        ['4.', '收集 +1 弹球、宝石和特效币：'],
        ['', '激光、连锁闪电、炸弹！'],
      ],
      settings: '设置', language: '语言',
      terms: '服务协议', privacy: '隐私协议',
    },
    'zh-TW': {
      subtitle: '發射彈球 擊碎磚塊',
      play: '開始遊戲',
      lv: '第 {n} 關',
      level: '第 {n} 關',
      mode_classic: '經典', mode_gravity: '重力', mode_limit: '限步',
      moves: '剩餘步數 {n}',
      combo0: '不錯', combo1: '很棒!', combo2: '超讚!', combo3: '驚人!', combo4: '瘋狂!!',
      x2balls: '雙倍彈球!', fireballs: '火球來襲!',
      ready: '已就緒', tapAgain: '再按確認', smashRow: '點擊要粉碎的行',
      cleared: '過關啦!', score: '得分', next: '下一關', retry: '重試',
      failed: '挑戰失敗', outOfMoves: '步數用盡!', destroyed: '已摧毀 {n}%',
      dontGiveUp: '別灰心，再試一次!',
      paused: '已暫停', resume: '繼續遊戲', restart: '重新開始',
      soundOn: '音效：開', soundOff: '音效：關', home: '返回主頁',
      shopTitle: '彈球', equipped: '使用中', tapToUse: '點擊使用', close: '關閉',
      howToPlay: '玩法說明', gotIt: '知道了',
      help: [
        ['1.', '滑動瞄準，鬆手發射彈球。'],
        ['2.', '彈球反彈並削減磚塊數字，'],
        ['', '數字歸零即被擊碎。'],
        ['3.', '每回合後磚塊下壓一行，'],
        ['', '別讓它們觸底！'],
        ['4.', '收集 +1 彈球、寶石和特效幣：'],
        ['', '雷射、連鎖閃電、炸彈！'],
      ],
      settings: '設定', language: '語言',
      terms: '服務條款', privacy: '隱私權政策',
    },
    ja: {
      subtitle: 'ボールを撃ってブロックを壊せ',
      play: 'プレイ',
      lv: 'レベル {n}',
      level: 'レベル {n}',
      mode_classic: 'クラシック', mode_gravity: '重力', mode_limit: '回数制限',
      moves: '残り手数 {n}',
      combo0: 'ナイス', combo1: 'グレート!', combo2: 'スーパー!', combo3: 'すごい!', combo4: 'クレイジー!!',
      x2balls: 'ボール2倍!', fireballs: 'ファイアボール!',
      ready: '準備完了', tapAgain: 'もう一度タップ', smashRow: '壊す行をタップ',
      cleared: 'クリア!', score: 'スコア', next: '次へ', retry: 'リトライ',
      failed: '失敗...', outOfMoves: '手数切れ!', destroyed: '{n}% 破壊',
      dontGiveUp: 'あきらめないで!',
      paused: '一時停止', resume: '再開', restart: 'やり直す',
      soundOn: 'サウンド：オン', soundOff: 'サウンド：オフ', home: 'ホーム',
      shopTitle: 'ボール', equipped: '装備中', tapToUse: 'タップで装備', close: '閉じる',
      howToPlay: '遊び方', gotIt: 'OK',
      help: [
        ['1.', 'スワイプで狙い、離して発射。'],
        ['2.', 'ボールは跳ね返り、当たった'],
        ['', 'ブロックの数字を減らします。'],
        ['3.', '毎ターン後ブロックが下降。'],
        ['', 'ラインに到達させないで！'],
        ['4.', '+1ボール、ジェム、コインを'],
        ['', '集めよう：レーザー、雷、爆弾！'],
      ],
      settings: '設定', language: '言語',
      terms: '利用規約', privacy: 'プライバシーポリシー',
    },
    ko: {
      subtitle: '공을 쏴서 벽돌을 부수자',
      play: '시작',
      lv: '레벨 {n}',
      level: '레벨 {n}',
      mode_classic: '클래식', mode_gravity: '중력', mode_limit: '제한',
      moves: '남은 횟수 {n}',
      combo0: '좋아요', combo1: '굉장해요!', combo2: '슈퍼!', combo3: '대단해요!', combo4: '미쳤다!!',
      x2balls: '볼 2배!', fireballs: '파이어볼!',
      ready: '준비 완료', tapAgain: '한 번 더 탭', smashRow: '부술 줄을 탭하세요',
      cleared: '클리어!', score: '점수', next: '다음', retry: '재도전',
      failed: '실패...', outOfMoves: '횟수 소진!', destroyed: '{n}% 파괴',
      dontGiveUp: '포기하지 마세요!',
      paused: '일시정지', resume: '계속하기', restart: '다시 시작',
      soundOn: '사운드: 켜짐', soundOff: '사운드: 꺼짐', home: '홈으로',
      shopTitle: '볼', equipped: '장착 중', tapToUse: '탭하여 장착', close: '닫기',
      howToPlay: '게임 방법', gotIt: '확인',
      help: [
        ['1.', '스와이프로 조준, 놓으면 발사.'],
        ['2.', '공은 튕기며 벽돌의 숫자를'],
        ['', '줄입니다. 0이 되면 파괴!'],
        ['3.', '매 턴마다 벽돌이 내려옵니다.'],
        ['', '라인에 닿지 않게 하세요!'],
        ['4.', '+1 볼, 보석, 코인을 모으세요:'],
        ['', '레이저, 연쇄 번개, 폭탄!'],
      ],
      settings: '설정', language: '언어',
      terms: '서비스 약관', privacy: '개인정보 처리방침',
    },
  };

  BO.LANGS = [
    { id: 'zh-CN', label: '简体中文' },
    { id: 'zh-TW', label: '繁體中文' },
    { id: 'en', label: 'English' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
  ];

  function detect() {
    const l = (navigator.language || 'en').toLowerCase();
    if (l.indexOf('zh') === 0) {
      return /tw|hk|mo|hant/.test(l) ? 'zh-TW' : 'zh-CN';
    }
    if (l.indexOf('ja') === 0) return 'ja';
    if (l.indexOf('ko') === 0) return 'ko';
    return 'en';
  }

  BO.lang = function () {
    const s = BO.store.lang;
    return (!s || s === 'auto') ? detect() : s;
  };

  BO.T = function (key, n) {
    const l = D[BO.lang()] || D.en;
    let s = l[key] != null ? l[key] : D.en[key];
    if (s == null) return key;
    if (n != null) s = String(s).replace('{n}', n);
    return s;
  };

  BO.helpLines = function () {
    const l = D[BO.lang()] || D.en;
    return l.help || D.en.help;
  };

  // external links: prefer the Capacitor Browser plugin (Chrome Custom Tab,
  // immune to app-link interception); fall back to window.open on plain web.
  BO.openURL = function (url) {
    try {
      const C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.Browser) {
        C.Plugins.Browser.open({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch (e) { /* ignore */ }
  };
  BO.LEGAL = {
    terms: 'https://puzzle-game-legal.pages.dev/terms',
    privacy: 'https://puzzle-game-legal.pages.dev/privacy',
  };
})();
