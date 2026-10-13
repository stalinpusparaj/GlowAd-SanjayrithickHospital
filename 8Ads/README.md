# Sanjay Rithik Hospital — 8 playable ads

Eight HTML5 playable ads for the skin, hair and laser services at Sanjay Rithik Hospital, Karur. Built on the same pattern as the reference `glowslider.html`: one self-contained file per ad (fonts, art and script inlined, no external requests), MRAID-aware, scales to any slot in portrait or landscape. Every ad ends on a lead-gen end card that opens WhatsApp with a pre-filled message naming the concern, plus a call button.

| # | File | Service | Mechanic |
|---|------|---------|----------|
| 1 | `01-acne-clear-plan` | Acne & acne marks | Slide through the 4-step care plan; breakouts calm |
| 2 | `02-pigmentation-laser-tap` | Pigmentation (Q-Switched Nd:YAG) | Tap each dark spot; a laser reticle zaps it |
| 3 | `03-laser-hair-swipe` | Triple Wave laser hair reduction | Swipe the laser handpiece along the leg |
| 4 | `04-hair-fall-hold` | Hair fall / PRP | Press and hold; shedding slows, hair fills in |
| 5 | `05-anti-ageing-mirror` | Anti-ageing | Drag the mirror to reveal a fresher, still-you reflection |
| 6 | `06-hydrafacial-glow-steps` | HydraFacial (event glow) | Tap Cleanse → Extract → Hydrate in order |
| 7 | `07-skin-check-quiz` | Lead qualifier | 3-tap skin check; answers go into the WhatsApp message |
| 8 | `08-treatment-matcher` | "Not sure where to start?" | Drag each concern onto its treatment |

## Files

- `dist/*.html` — the finished playables. Open any one in a browser to play it (desktop shows a phone frame with a portrait/landscape toggle).
- `dist/zip/*.zip` — the same ads packaged as `index.html` in a ZIP (~95–100 KB each) for HTML5 ad uploads.
- `dist/index.html` — a gallery that previews all eight side by side.
- `src/` — sources: `shell.*` (shared engine, layout and end card), `face.js` (shared illustrated face), `ads/*.html` (one file per ad), `fonts/` (Bricolage Grotesque, OFL).
- `build.mjs` — bundles `src/` into `dist/`. Run `node build.mjs` after any change.

## Changing the details

Clinic-wide settings live in the `BASE` object at the top of `build.mjs`: WhatsApp and call numbers, the pre-filled WhatsApp text, the offer line, chips, disclaimers and the landing-page URL. Each ad's own `meta` block (top of `src/ads/NN-*.html`) overrides headline copy, end-card text and the concern that goes into the WhatsApp message.

- **Logo:** set `logoSrc` to a data URL of the official logo to replace the drawn "SR" mark.
- **Send leads to the website instead of WhatsApp:** set `ctaMode: 'site'` and `siteUrl`.
- **Ad-network click tracking:** if the network defines `window.clickTag`, every CTA uses it. Inside MRAID webviews the CTA calls `mraid.open()`; in Google's HTML5 environment it calls `ExitApi.exit()`.
- **Analytics:** define `window.AD_TRACK = (event, data) => …` to receive `impression`, `first_interaction`, `progress_50`, `complete`, `endcard`, `cta_click` and `replay`.

## Compliance notes

The ads use illustrations only, carry "not a patient result" disclaimers, avoid guaranteed or permanent claims and never name drugs. Before launch, confirm with the clinic that the first consultation is free (taken from the clinic's landing pages) and that +91 89030 09723 is the right WhatsApp number.
