# Brick Out (H5)

A high-fidelity HTML5 remake of *Brick Out - Shoot the ball* (bricks-and-balls shooter),
packaged as an Android APK with Capacitor.

![genre](https://img.shields.io/badge/genre-brick%20breaker-blue)

## Play

- **Web**: open `www/index.html` in any browser (desktop: drag with mouse).
- **Android**: install `BrickOut-prod-release.apk`.

## Features

- 3 game modes: **Classic**, **Gravity** (parabolic ball physics), **Limit** (move budget)
- Swipe to aim with trajectory preview, ball stream with trails, combo popups
  (GOOD / GREAT / SUPER / AMAZING / INSANE)
- Numbered brick grid with textures, triangle bricks, +1 ball / gem / lightning-coin items
- Boosters: Lightning, Hammer (smash a row), Ball Split (x2)
- 24 handcrafted levels + infinite procedural levels, per-mode progression & stars
- Ball skin shop (gems currency), fully persisted via localStorage
- All art & SFX generated procedurally at runtime — zero binary assets

## Project layout

```
www/            game source (plain JS + Canvas 2D, no framework)
  js/config.js    constants, palette, skins, modes
  js/levels.js    level defs + procedural generator
  js/game.js      gameplay scene (physics, boosters, HUD)
  js/screens.js   title scene, shop/help overlays
  js/render.js    textures, widgets, logo renderer
  js/particles.js particles, floaters, combo text
  js/audio.js     WebAudio synthesized SFX
android/        Capacitor Android shell
scripts/        puppeteer screenshot/QA helpers
assets/         icon & splash generator
```

## Build APK

Requires Node 18+, JDK 17, Android SDK.

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

Regenerate icons/splash: `node scripts/genassets.js && npx capacitor-assets generate --android`

## QA helpers

```bash
node scripts/shoot.js <name> "<url-params>" <waitMs> [tap:x,y] [drag:x1,y1,x2,y2] [js:code]
# e.g. screenshot gravity mode mid-flight:
node scripts/shoot.js shot "scene=game&level=4&mode=gravity&auto=1" 5000
```
