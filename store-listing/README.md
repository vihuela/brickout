# Play Store Listing Assets

Store screenshots for BrickOut, sized per [Google Play preview-asset specs](https://support.google.com/googleplay/android-developer/answer/9866151):
JPEG (no alpha), ≤8 MB, 16:9 / 9:16, ≥1080 px — eligible for large-format featuring
(games need ≥3 portrait 1080×1920 or ≥3 landscape 1920×1080 in-game shots; we ship 4 portrait + 2 landscape).

| File | Size | Content |
|---|---|---|
| `app-icon-512.png`            | 512×512   | Play app icon (PNG ≤1MB, full-bleed square; Google applies the corner mask) |
| `feature-graphic-1024x500.jpg`| 1024×500  | Play feature graphic (listing header) |
| `play-listing.md`             | —         | App name / short (80) / full (4000) description copy |
| `portrait-1-shoot-smash.jpg`  | 1080×1920 | Classic gameplay, ball stream (level 12) |
| `portrait-2-perfect-aim.jpg`  | 1080×1920 | Trajectory-preview aiming (level 6) |
| `portrait-3-game-modes.jpg`   | 1080×1920 | Gravity mode + combo popup, mode chips |
| `portrait-4-ball-skins.jpg`   | 1080×1920 | Ball skin shop |
| `landscape-1-hero.jpg`        | 1920×1080 | Logo + tagline + 3-phone fan |
| `landscape-2-features.jpg`    | 1920×1080 | Feature bullets + 3-phone fan |

## Regenerate

```bash
node scripts/store_capture.js   # capture raw gameplay shots -> _raw/ (headless Chrome)
node scripts/store_render.js    # compose finals from _src/compose.html -> *.jpg
```

- `_raw/` — raw headless-Chrome gameplay captures (lang=en)
- `_src/compose.html` — HTML compositor; open with `?slide=p1..p4|l1|l2` to tweak a design
