// Bundles every ad in src/ads into a single self-contained HTML playable in dist/, plus dist/index.html to preview them all.
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = p => fs.readFileSync(path.join(here, 'src', p), 'utf8');
const outDir = path.join(here, 'dist');

/* Clinic-wide settings shared by every ad; an ad's own meta block overrides any of them. */
const BASE = {
  brand: 'SANJAY RITHIK',
  brandLine: 'HOSPITAL · KARUR',
  logoSrc: '', // optional: data URL of the official logo; replaces the drawn SR mark in the header
  rating: '4.5',
  reviews: '447 Google reviews',
  doctor: 'Dr. S. Kiruthika',
  doctorCreds: 'MBBS, DDVL · Dermatologist · 13 yrs',
  doctorLine: 'Dr. S. Kiruthika · MBBS, DDVL · Karur',
  offer: 'Free skin consultation',
  whatsapp: '918903009723',
  phone: '918903009723',
  phoneDisplay: '89030 09723',
  siteUrl: 'https://sanjayrithikhospital.com/skin-care-services/',
  ctaMode: 'whatsapp', // 'whatsapp' opens a pre-filled chat; 'site' sends every CTA to siteUrl
  waText: 'Hi, I want to book a free skin consultation at Sanjay Rithik Hospital, Karur for {concern}. Please share available timings and treatment details.',
  ctaSmall: 'Book',
  ctaLarge: 'Book free consult on WhatsApp',
  chips: ['Free consultation', 'No payment online', 'Tamil or English', 'Open daily'],
  disclaimer: 'Illustration only, not a patient result. Results vary.',
  endDisclaimer: 'Illustrative animation, not a patient result or a diagnosis. Suitability, sessions and results vary and are confirmed at consultation. Open daily 10am–2:30pm & 6–9:30pm · 77A Sengunthapuram Main Rd, Karur.',
  soundOnByDefault: true,
  desktopPreviewFrame: true,
  debug: false
};

const shell = read('shell.html'), shellCss = read('shell.css'), shellJs = read('shell.js'), faceJs = read('face.js');
const font = fs.readFileSync(path.join(here, 'src/fonts/bricolage.woff2')).toString('base64');
const fill = (tpl, map) => tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in map ? map[k] : m));
const block = (s, re, name, file) => {
  const m = s.match(re);
  if (!m) throw new Error(`${file}: missing ${name} block`);
  return m[1].trim();
};

/* Minimal single-file ZIP (deflate), so each ad has an upload-ready package for HTML5 ad networks. */
function zipOne(name, data) {
  const n = Buffer.from(name), comp = zlib.deflateRawSync(data, { level: 9 }), crc = zlib.crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt16LE(0x21, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10); central.writeUInt16LE(0x21, 14);
  central.writeUInt32LE(crc, 16); central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(n.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(46 + n.length, 12); end.writeUInt32LE(30 + n.length + comp.length, 16);
  return Buffer.concat([local, n, comp, central, n, end]);
}

fs.mkdirSync(path.join(outDir, 'zip'), { recursive: true });
const built = [];
for (const file of fs.readdirSync(path.join(here, 'src/ads')).filter(f => f.endsWith('.html')).sort()) {
  const s = read('ads/' + file);
  const meta = JSON.parse(block(s, /<script type="application\/json" id="meta">([\s\S]*?)<\/script>/, 'meta', file));
  const config = { ...BASE, ...meta, adId: file.replace(/\.html$/, '') };
  const html = fill(shell, {
    TITLE: meta.title,
    FONT: font,
    SHELL_CSS: shellCss,
    AD_CSS: block(s, /<style>([\s\S]*?)<\/style>/, 'style', file),
    HERO: block(s, /<template data-slot="hero">([\s\S]*?)<\/template>/, 'hero', file),
    PANEL: block(s, /<template data-slot="panel">([\s\S]*?)<\/template>/, 'panel', file),
    CONFIG: JSON.stringify(config, null, 2).replace(/</g, '\\u003c'),
    FACE_JS: meta.face ? faceJs : '',
    SHELL_JS: shellJs,
    AD_JS: block(s, /<script>([\s\S]*?)<\/script>/, 'script', file)
  });
  fs.writeFileSync(path.join(outDir, file), html);
  const zip = zipOne('index.html', Buffer.from(html));
  fs.writeFileSync(path.join(outDir, 'zip', file.replace(/\.html$/, '.zip')), zip);
  const kb = Math.round(Buffer.byteLength(html) / 1024), zkb = Math.round(zip.length / 1024);
  built.push({ file, title: meta.title, mechanic: meta.mechanic, kb });
  console.log(`${file.padEnd(32)} ${String(kb).padStart(4)} KB  (zip ${zkb} KB)  ${meta.mechanic}`);
}

/* gallery for previewing all ads side by side (not an ad itself) */
const cards = built.map(b => `
    <figure>
      <iframe src="${b.file}#full" title="${b.title}" loading="lazy"></iframe>
      <figcaption><b>${b.title}</b><span>${b.mechanic} · ${b.kb} KB</span><a href="${b.file}" target="_blank">Open full screen ↗</a></figcaption>
    </figure>`).join('');
fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sanjay Rithik playables</title>
<style>
  :root{color-scheme:light;--ink:#0B3442;--bg:#EEF6F6}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 "Avenir Next","Segoe UI",Roboto,system-ui,sans-serif}
  header{padding:28px 24px 8px;max-width:1500px;margin:0 auto}
  h1{margin:0 0 4px;font-size:24px}
  header p{margin:0;opacity:.7}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;padding:20px 24px 40px;max-width:1500px;margin:0 auto}
  figure{margin:0;display:flex;flex-direction:column;gap:10px}
  iframe{width:100%;aspect-ratio:9/16;border:0;border-radius:22px;background:#fff;box-shadow:0 18px 40px rgba(11,52,66,.18)}
  figcaption{display:flex;flex-direction:column;gap:2px;padding:0 4px}
  figcaption span{font-size:13px;opacity:.65}
  figcaption a{font-size:13px;color:#0F8DBA;font-weight:600}
</style></head><body>
<header><h1>Sanjay Rithik Hospital · 8 playable ads</h1><p>Each card is a live, self-contained HTML5 playable. Tap or drag inside a card to play; every ad ends on a WhatsApp lead CTA.</p></header>
<main>${cards}
</main>
</body></html>
`);
console.log(`\n${built.length} playables + index.html written to dist/`);
