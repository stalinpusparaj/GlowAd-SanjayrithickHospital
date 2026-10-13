# Aurelle Glow Slider — Playable Ad

Single-file HTML5 playable ad (`index.html`). Self-contained: fonts, art and script are inlined, no external requests.

- Scales one logical stage (360×640 portrait / 640×360 landscape) to any ad slot.
- MRAID-aware: waits for `ready` + viewable inside ad SDK webviews, uses `mraid.open()` for the click-through.
- Click-through URL is set in `clickUrl` inside `index.html`; a network-provided `window.clickTag` overrides it.

Open `index.html` in a browser to preview.
