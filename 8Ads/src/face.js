/* Illustrated face shared by the face-based playables.
   Face.mount(g, opts) draws a South Indian woman into an SVG <g> (viewBox space 0..280 x 30..352) and returns a
   controller whose set(state) is cheap enough to call every frame. Face.render(opts, state) returns a data-URL
   snapshot for the end card. */
window.Face = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const f2 = n => (Math.round(n * 100) / 100).toString();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
  const SKIN_DULL = [118, 84, 68], SKIN_GLOW = [156, 96, 58];
  const FACE = 'M140,66 C184,66 206,102 205,150 C204,204 176,254 140,256 C104,254 76,204 75,150 C74,102 96,66 140,66Z';
  const STAR = 'M0,-10 C1.2,-2.4 2.4,-1.2 10,0 C2.4,1.2 1.2,2.4 0,10 C-1.2,2.4 -2.4,1.2 -10,0 C-2.4,-1.2 -1.2,-2.4 0,-10Z';
  let uid = 0;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // dark spots: [x, y, radius, fade start, fade length] in 0..1 progress
  const SPOTS = [
    [122, 104, 9, .43, .25], [157, 98, 7, .21, .21], [140, 116, 5, .07, .18],
    [98, 183, 11.5, .64, .28], [109, 199, 8, .36, .21], [90, 170, 6, .14, .21], [115, 177, 4, .04, .17],
    [181, 181, 12.5, .68, .28], [171, 201, 7, .29, .21], [191, 193, 6, .5, .21], [166, 175, 4, .11, .19],
    [130, 186, 4, .21, .21], [128, 240, 6, .46, .21], [156, 236, 5, .32, .21], [151, 208, 4, .36, .21],
    [84, 140, 6.5, .57, .25], [196, 146, 6.5, .54, .25]
  ];
  const ACNE = [
    [122, 108, 4.4], [151, 101, 3.8], [164, 114, 3.3], [132, 119, 2.9],
    [96, 186, 5], [107, 199, 4.1], [90, 172, 3.5], [112, 183, 3.1], [100, 210, 3.7],
    [184, 185, 4.8], [174, 199, 3.9], [192, 197, 3.3], [168, 180, 2.9],
    [134, 241, 3.7], [150, 245, 3.3], [118, 229, 3.1], [164, 230, 3.5], [146, 186, 2.5]
  ];
  const LINES = [
    'M116,110 Q140,104 164,110', 'M120,118 Q140,113 160,118', 'M126,102 Q140,98 154,102',
    'M137,127 L138.5,136', 'M143,127 L141.5,136',
    'M100,150 L91,146', 'M100,155.5 L90,155.5', 'M101,160 L92,165',
    'M180,150 L189,146', 'M180,155.5 L190,155.5', 'M179,160 L188,165',
    'M108,165 Q117,170 127,166', 'M153,166 Q163,170 172,165',
    'M126,192 Q116,205 121,221', 'M154,192 Q164,205 159,221',
    'M123,233 Q121,241 125,248', 'M157,233 Q159,241 155,248'
  ];

  function mount(root, opts) {
    const o = Object.assign({ sun: true, hair: 'long', outfit: 'kurta', acne: false, pigment: false, lines: false, part: false, seed: 11 }, opts || {});
    const id = 'fc' + (++uid), u = k => id + '-' + k, url = k => `url(#${u(k)})`;
    let s = o.seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const doc = o.outfit === 'coat';

    root.innerHTML = `
<defs>
  <radialGradient id="${u('sun')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C9"/><stop offset=".5" stop-color="#FFD873"/><stop offset=".8" stop-color="#FFC54D" stop-opacity=".5"/><stop offset="1" stop-color="#FFC54D" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('ray')}" gradientUnits="userSpaceOnUse" cx="140" cy="150" r="250"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('spot')}"><stop offset="0" stop-color="#3A180B" stop-opacity=".7"/><stop offset=".55" stop-color="#43200F" stop-opacity=".4"/><stop offset="1" stop-color="#43200F" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('dot')}"><stop offset="0" stop-color="#2E1208" stop-opacity=".72"/><stop offset=".7" stop-color="#2E1208" stop-opacity=".38"/><stop offset="1" stop-color="#2E1208" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('patch')}"><stop offset="0" stop-color="#4A2616" stop-opacity=".58"/><stop offset="1" stop-color="#4A2616" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('acne')}"><stop offset="0" stop-color="#C7383A" stop-opacity=".9"/><stop offset=".45" stop-color="#C94A44" stop-opacity=".55"/><stop offset="1" stop-color="#C94A44" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('mark')}"><stop offset="0" stop-color="#5E2418" stop-opacity=".55"/><stop offset="1" stop-color="#5E2418" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('hl')}"><stop offset="0" stop-color="#FFE7BE" stop-opacity=".66"/><stop offset=".5" stop-color="#FFCB8E" stop-opacity=".3"/><stop offset="1" stop-color="#FFCB8E" stop-opacity="0"/></radialGradient>
  <radialGradient id="${u('blush')}"><stop offset="0" stop-color="#D9473F" stop-opacity=".55"/><stop offset="1" stop-color="#D9473F" stop-opacity="0"/></radialGradient>
  <linearGradient id="${u('top')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1FA2B6"/><stop offset="1" stop-color="#0E6B82"/></linearGradient>
  <linearGradient id="${u('coat')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3ECEE"/></linearGradient>
  <linearGradient id="${u('gold')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6A6"/><stop offset=".5" stop-color="#E6A93C"/><stop offset="1" stop-color="#B57620"/></linearGradient>
  <clipPath id="${u('cf')}"><path d="${FACE}"/></clipPath>
  <clipPath id="${u('el')}"><path d="M103,155 Q117,144 131,155 Q117,163 103,155Z"/></clipPath>
  <clipPath id="${u('er')}"><path d="M177,155 Q163,144 149,155 Q163,163 177,155Z"/></clipPath>
  <filter id="${u('b3')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${u('b7')}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
<g data-r="sun"${o.sun ? '' : ' display="none"'}><g data-r="rays" fill="${url('ray')}" opacity=".7"></g><circle cx="140" cy="150" r="132" fill="${url('sun')}"/></g>
<g data-r="char">
  ${doc
    ? `<path fill="#1E0F17" d="M140,44 C88,44 62,88 64,146 C66,180 72,200 80,216 L200,216 C208,200 214,180 216,146 C218,88 192,44 140,44Z"/><circle cx="140" cy="38" r="21" fill="#1E0F17"/><path d="M124,30 Q140,22 156,30" fill="none" stroke="#3B2230" stroke-width="2" stroke-linecap="round"/>`
    : `<path fill="#1E0F17" d="M140,40 C84,40 54,86 54,150 C54,206 48,262 34,322 C70,336 210,336 246,322 C232,262 226,206 226,150 C226,86 196,40 140,40Z"/>
       <path d="M64,200 C62,240 56,276 48,306 M216,200 C218,240 224,276 232,306" fill="none" stroke="#3B2230" stroke-width="2" stroke-linecap="round" opacity=".7"/>`}
  <path data-skin="1" d="M18,352 C28,302 78,290 114,286 L117,230 L163,230 L166,286 C202,290 252,302 262,352Z"/>
  <path fill="#55301C" opacity=".5" d="M117,236 Q140,264 163,236 L163,254 Q140,278 117,254Z"/>
  ${doc
    ? `<path fill="${url('top')}" d="M30,352 C40,318 74,304 104,302 Q140,322 176,302 C206,304 240,318 250,352Z"/>
       <path fill="${url('coat')}" d="M4,352 C16,318 54,302 94,298 L128,352Z M276,352 C264,318 226,302 186,298 L152,352Z"/>
       <path d="M94,298 L128,352 M186,298 L152,352" stroke="#C8D6DA" stroke-width="1.6" fill="none"/>
       <path d="M110,296 C104,322 114,340 134,346 M170,296 C176,322 166,340 146,346" fill="none" stroke="#24434F" stroke-width="3.2" stroke-linecap="round"/>
       <circle cx="140" cy="347" r="7" fill="#C9D3D6" stroke="#24434F" stroke-width="2"/>`
    : `<path fill="${url('top')}" d="M4,352 C18,318 56,306 96,308 L140,340 L184,308 C224,306 262,318 276,352Z"/>
       <path d="M96,308 L140,340 L184,308" fill="none" stroke="#EE7A5B" stroke-width="3" stroke-linejoin="round"/>
       <path d="M101,313 L140,342 L179,313" fill="none" stroke="#FFC54D" stroke-width="1" stroke-dasharray="1.5 3" opacity=".9"/>`}
  <ellipse data-skin="1" cx="76" cy="162" rx="10" ry="16"/>
  <ellipse cx="78" cy="162" rx="5" ry="9" fill="#5E331F" opacity=".5"/>
  <ellipse data-skin="1" cx="204" cy="162" rx="10" ry="16"/>
  <ellipse cx="202" cy="162" rx="5" ry="9" fill="#5E331F" opacity=".5"/>
  <g fill="${url('gold')}">
    <circle cx="74" cy="178" r="3.2"/><path d="M68,188 Q74,180 80,188 L79,194 Q74,197 69,194Z"/><circle cx="74" cy="199" r="1.7"/>
    <circle cx="206" cy="178" r="3.2"/><path d="M200,188 Q206,180 212,188 L211,194 Q206,197 201,194Z"/><circle cx="206" cy="199" r="1.7"/>
  </g>
  <path data-skin="1" d="${FACE}"/>
  <g clip-path="${url('cf')}">
    <ellipse cx="70" cy="172" rx="22" ry="84" fill="#55301C" opacity=".36" filter="${url('b7')}"/>
    <ellipse cx="210" cy="172" rx="22" ry="84" fill="#55301C" opacity=".36" filter="${url('b7')}"/>
    <ellipse cx="140" cy="94" rx="72" ry="14" fill="#3E2015" opacity=".36" filter="${url('b7')}"/>
    <ellipse cx="140" cy="258" rx="50" ry="14" fill="#55301C" opacity=".32" filter="${url('b7')}"/>
    <path data-r="dull" d="${FACE}" fill="#8E9490" opacity="0"/>
    <g data-r="patches" opacity="0">
      <ellipse cx="140" cy="108" rx="44" ry="17" fill="${url('patch')}"/>
      <ellipse cx="140" cy="214" rx="31" ry="17" fill="${url('patch')}"/>
      <ellipse cx="117" cy="168" rx="17" ry="6.5" fill="${url('patch')}"/>
      <ellipse cx="163" cy="168" rx="17" ry="6.5" fill="${url('patch')}"/>
      <ellipse cx="90" cy="214" rx="20" ry="28" fill="${url('patch')}"/>
      <ellipse cx="190" cy="214" rx="20" ry="28" fill="${url('patch')}"/>
    </g>
    <g data-r="spots"></g>
    <g data-r="marks"></g>
    <g data-r="acne"></g>
    <g data-r="tired" opacity="0">
      <ellipse cx="117" cy="168" rx="14" ry="5.5" fill="#2E140B" filter="${url('b3')}"/>
      <ellipse cx="163" cy="168" rx="14" ry="5.5" fill="#2E140B" filter="${url('b3')}"/>
    </g>
    <g data-r="lines" fill="none" stroke="#4E2A1A" stroke-width="1.35" stroke-linecap="round" opacity="0"></g>
    <g data-r="glow" opacity="0">
      <ellipse cx="103" cy="174" rx="15" ry="6" transform="rotate(-18 103 174)" fill="${url('hl')}"/>
      <ellipse cx="177" cy="174" rx="15" ry="6" transform="rotate(18 177 174)" fill="${url('hl')}"/>
      <ellipse cx="140" cy="112" rx="26" ry="9" fill="${url('hl')}"/>
      <ellipse cx="140" cy="175" rx="3.8" ry="14" fill="${url('hl')}"/>
      <ellipse cx="140" cy="189" rx="5.5" ry="3.6" fill="${url('hl')}"/>
      <ellipse cx="140" cy="244" rx="11" ry="4.5" fill="${url('hl')}"/>
      <path d="${FACE}" fill="none" stroke="#FFC24A" stroke-width="8" filter="${url('b3')}" opacity=".7"/>
    </g>
    <ellipse data-r="blush" cx="101" cy="195" rx="19" ry="11" fill="${url('blush')}" opacity=".3"/>
    <ellipse data-r="blush" cx="179" cy="195" rx="19" ry="11" fill="${url('blush')}" opacity=".3"/>
  </g>
  <path data-r="hairFront" fill="#1E0F17" d="M72,152 C66,96 98,46 140,44 C182,46 214,96 208,152 C204,124 196,104 180,92 C166,82 150,74 140,62 C130,74 114,82 100,92 C84,104 76,124 72,152Z"/>
  <path d="M84,124 C88,96 106,70 132,56 M196,124 C192,96 174,70 148,56" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".1"/>
  <g data-r="strands" fill="none" stroke="#3B2230" stroke-width="1.1" stroke-linecap="round"></g>
  <path data-r="part" data-skin="1" d="M139.2,46 L140.8,46 L141,63 L139,63Z"/>
  <g stroke="#1A0B12" stroke-width="4.6" stroke-linecap="round" fill="none" data-r="brows">
    <path d="M100,134 Q114,125 131,131"/><path d="M149,131 Q166,125 180,134"/>
  </g>
  <g data-r="eye" data-cx="117" data-cy="155">
    <path d="M103,155 Q117,144 131,155 Q117,163 103,155Z" fill="#F6ECE4"/>
    <g clip-path="${url('el')}"><circle cx="117.5" cy="154.5" r="6.8" fill="#2E160B"/><circle cx="117.5" cy="154.5" r="3.1" fill="#0E0604"/><circle cx="119.8" cy="152.2" r="1.8" fill="#fff"/></g>
    <path d="M101,155.5 Q117,141 133,154.5" fill="none" stroke="#1A0A10" stroke-width="2.7" stroke-linecap="round"/>
    <path d="M101.6,155 L96.4,150.6" stroke="#1A0A10" stroke-width="2.1" stroke-linecap="round"/>
  </g>
  <g data-r="eye" data-cx="163" data-cy="155">
    <path d="M177,155 Q163,144 149,155 Q163,163 177,155Z" fill="#F6ECE4"/>
    <g clip-path="${url('er')}"><circle cx="162.5" cy="154.5" r="6.8" fill="#2E160B"/><circle cx="162.5" cy="154.5" r="3.1" fill="#0E0604"/><circle cx="164.8" cy="152.2" r="1.8" fill="#fff"/></g>
    <path d="M179,155.5 Q163,141 147,154.5" fill="none" stroke="#1A0A10" stroke-width="2.7" stroke-linecap="round"/>
    <path d="M178.4,155 L183.6,150.6" stroke="#1A0A10" stroke-width="2.1" stroke-linecap="round"/>
  </g>
  <path d="M136,162 C134,174 131,182 128.5,189" fill="none" stroke="#4E2A1A" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>
  <path d="M127,190 Q130,198.5 140,198.5 Q150,198.5 153,190" fill="none" stroke="#4A2616" stroke-width="2" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="133.5" cy="193.4" rx="3" ry="1.8" fill="#3A1C10" opacity=".55"/>
  <ellipse cx="146.5" cy="193.4" rx="3" ry="1.8" fill="#3A1C10" opacity=".55"/>
  <path data-r="lipL" fill="#83384A"/>
  <path data-r="teeth" fill="#FFF7EF"/>
  <path data-r="lipU" fill="#5E2432"/>
  <path data-r="mline" fill="none" stroke="#33101A" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse data-r="lipHL" cx="140" cy="228" rx="8" ry="2" fill="#fff" opacity=".22"/>
  <g data-r="sparkles" fill="#FFF6D6"></g>
</g>`;

    const q = k => root.querySelector(`[data-r=${k}]`), qa = k => Array.from(root.querySelectorAll(`[data-r=${k}]`));
    const R = {
      sun: q('sun'), rays: q('rays'), char: q('char'), dull: q('dull'), patches: q('patches'), spotsG: q('spots'), marksG: q('marks'), acneG: q('acne'),
      tired: q('tired'), lines: q('lines'), glow: q('glow'), blush: qa('blush'), hairFront: q('hairFront'), strandsG: q('strands'), part: q('part'),
      brows: q('brows'), eyes: qa('eye'), lipU: q('lipU'), lipL: q('lipL'), teeth: q('teeth'), mline: q('mline'), lipHL: q('lipHL'), sparkG: q('sparkles'),
      skin: Array.from(root.querySelectorAll('[data-skin]'))
    };

    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, w = .075, L = 260;
      el('path', { d: `M140,150 L${f2(140 + L * Math.cos(a - w))},${f2(150 + L * Math.sin(a - w))} L${f2(140 + L * Math.cos(a + w))},${f2(150 + L * Math.sin(a + w))}Z` }, R.rays);
    }

    const spots = [], acne = [], marks = [], strands = [];
    if (o.pigment) {
      const add = (x, y, r, t, w, fill, sx = 1.15, sy = .9) => {
        const rot = f2(rnd() * 60 - 30);
        const e = el('ellipse', { cx: 0, cy: 0, rx: f2(r * sx), ry: f2(r * sy), fill }, R.spotsG);
        spots.push({ e, x, y, r, rot, t, w, v: 1 });
      };
      SPOTS.forEach(([x, y, r, t, w]) => add(x, y, r, t, w, url('spot')));
      for (let i = 0; i < 14; i++) {
        const left = i % 2 === 0;
        add(+f2((left ? 104 : 176) + (rnd() - .5) * 46), +f2(178 + (rnd() - .5) * 36), 1.3 + rnd() * 1.3, .04 + rnd() * .64, .18, url('dot'), 1, 1);
      }
    }
    if (o.acne) {
      ACNE.forEach(([x, y, r]) => {
        const t = rnd() * .72, w = .12 + rnd() * .1;
        const m = el('ellipse', { cx: 0, cy: 0, rx: f2(r * 1.25), ry: f2(r * 1.05), fill: url('mark') }, R.marksG);
        marks.push({ e: m, x, y, r, rot: 0, t: t + .14, w: w + .08, v: 1 });
        const g = el('g', {}, R.acneG);
        el('circle', { r: f2(r * 2.2), fill: url('acne') }, g);
        el('circle', { r: f2(r * .7), fill: '#E1786C' }, g);
        el('circle', { cx: f2(-r * .25), cy: f2(-r * .3), r: f2(r * .26), fill: '#fff', opacity: .45 }, g);
        acne.push({ e: g, x, y, r, rot: 0, t, w, v: 1 });
      });
    }
    if (o.lines) LINES.forEach(d => el('path', { d }, R.lines));
    if (o.part) {
      for (let i = 0; i < 46; i++) {
        const side = i % 2 ? 1 : -1, k = rnd();
        const x0 = 140 + side * (1.5 + rnd() * 3), y0 = 47 + rnd() * 14;
        const x1 = 140 + side * (34 + k * 46), y1 = 82 + k * 66;
        const cx = 140 + side * (18 + k * 34), cy = 52 + k * 16;
        strands.push({ e: el('path', { d: `M${f2(x0)},${f2(y0)} Q${f2(cx)},${f2(cy)} ${f2(x1)},${f2(y1)}`, opacity: 0 }, R.strandsG), th: rnd() });
      }
    }
    const sparkles = [[60, 88, 1], [224, 76, .85], [42, 198, .7], [238, 206, .9], [180, 40, .6], [98, 46, .75], [252, 136, .65], [28, 136, .55]]
      .map(([x, y, sc]) => el('path', { opacity: 0, transform: `translate(${x} ${y}) scale(${sc})`, d: STAR }, R.sparkG));

    function setMouth(sm) {
      const lx = 118 - 2 * sm, ly = 219 - 4.5 * sm, rx = 162 + 2 * sm, ry = ly;
      const m = 221 + 2.5 * sm, tg = 4.5 * sm;
      const c = (8 * m - 2 * ly) / 6, c2 = (8 * (m + tg) - 2 * ly) / 6, mb = m + tg + 11, cb = (8 * mb - 2 * ly) / 6;
      const L = `${f2(lx)},${f2(ly)}`, Rr = `${f2(rx)},${f2(ry)}`;
      const top = `C${f2(lx + 10)},${f2(c)} ${f2(rx - 10)},${f2(c)} ${Rr}`;
      R.lipU.setAttribute('d', `M${L} C${f2(lx + 5)},${f2(ly - 5)} 130,210 134,210.5 C137,211 139,213 140,213 C141,213 143,211 146,210.5 C150,210 ${f2(rx - 5)},${f2(ry - 5)} ${Rr} C${f2(rx - 10)},${f2(c)} ${f2(lx + 10)},${f2(c)} ${L}Z`);
      R.teeth.setAttribute('d', `M${L} ${top} C${f2(rx - 10)},${f2(c2)} ${f2(lx + 10)},${f2(c2)} ${L}Z`);
      R.teeth.setAttribute('opacity', f2(clamp(sm * 1.6)));
      R.lipL.setAttribute('d', `M${L} C${f2(lx + 10)},${f2(c2)} ${f2(rx - 10)},${f2(c2)} ${Rr} C${f2(rx - 7)},${f2(cb)} ${f2(lx + 7)},${f2(cb)} ${L}Z`);
      R.mline.setAttribute('d', `M${L} ${top}`);
      R.lipHL.setAttribute('cy', f2(m + tg + 5.5));
    }
    const place = (it, sc) => it.e.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${it.rot}) scale(${sc.toFixed(3)})`);
    const avg = a => a.length ? a.reduce((t, it) => t + it.v, 0) / a.length : 0;

    function set(st) {
      const g = st.glow || 0, sm = st.smile || 0, dull = st.dull == null ? 0 : st.dull, tw = st.t || 0;
      const col = mix(SKIN_DULL, SKIN_GLOW, 1 - dull);
      R.skin.forEach(e => e.setAttribute('fill', col));
      R.dull.setAttribute('opacity', (dull * .2).toFixed(3));
      if (spots.length) {
        if (typeof st.pigmentClear === 'number') spots.forEach(it => { it.v = 1 - smooth(it.t, it.t + it.w, st.pigmentClear); });
        spots.forEach(it => { it.e.setAttribute('opacity', it.v.toFixed(3)); place(it, .5 + .5 * it.v); });
        R.patches.setAttribute('opacity', (typeof st.pigmentClear === 'number' ? 1 - smooth(0, .85, st.pigmentClear) : avg(spots)).toFixed(3));
      }
      if (acne.length) {
        if (typeof st.acneClear === 'number') {
          acne.forEach(it => { it.v = 1 - smooth(it.t, it.t + it.w, st.acneClear); });
          marks.forEach(it => { it.v = 1 - smooth(it.t, it.t + it.w, st.acneClear); });
        }
        acne.forEach(it => { it.e.setAttribute('opacity', it.v.toFixed(3)); place(it, .35 + .65 * it.v); });
        marks.forEach(it => { it.e.setAttribute('opacity', it.v.toFixed(3)); place(it, .6 + .4 * it.v); });
      }
      R.lines.setAttribute('opacity', ((st.lines || 0) * .62).toFixed(3));
      R.tired.setAttribute('opacity', ((st.tired || 0) * .42).toFixed(3));
      R.glow.setAttribute('opacity', g.toFixed(3));
      R.blush.forEach(e => e.setAttribute('opacity', (.26 + .4 * g).toFixed(3)));
      R.sun.setAttribute('opacity', (.4 + .6 * g).toFixed(3));
      sparkles.forEach((e, i) => e.setAttribute('opacity', (g * (.25 + .75 * (.5 + .5 * Math.sin(tw * 2.6 + i * 1.9)))).toFixed(3)));
      if (o.part) {
        const d = st.hair == null ? 1 : st.hair, w = lerp(3.4, .8, d), w0 = lerp(1.3, .4, d);
        R.part.setAttribute('d', `M${f2(140 - w0)},47 L${f2(140 + w0)},47 L${f2(140 + w)},64 C${f2(140 + w * .5)},65.5 ${f2(140 - w * .5)},65.5 ${f2(140 - w)},64Z`);
        R.part.setAttribute('opacity', lerp(.8, .6, d).toFixed(3));
        R.hairFront.setAttribute('opacity', lerp(.8, 1, d).toFixed(3));
        strands.forEach(it => it.e.setAttribute('opacity', (smooth(it.th - .08, it.th + .08, d) * .75).toFixed(3)));
      }
      R.brows.setAttribute('transform', `translate(0 ${(-2.6 * sm).toFixed(2)})`);
      const k = (1 - .2 * sm) * (st.blink == null ? 1 : st.blink);
      R.eyes.forEach(e => {
        const cx = e.getAttribute('data-cx'), cy = e.getAttribute('data-cy');
        e.setAttribute('transform', `translate(${cx} ${cy}) scale(1 ${k.toFixed(3)}) translate(${-cx} ${-cy})`);
      });
      setMouth(sm);
      if (st.rays != null) R.rays.setAttribute('transform', `rotate(${f2(st.rays)} 140 150)`);
      R.char.setAttribute('transform', `translate(0 ${f2(st.bob || 0)})`);
    }
    set({});
    return { root, R, spots, acne, marks, set };
  }

  /* blinking helper: returns an eye-open factor (1 = open) */
  function blinker() {
    let next = 2.4, t = -1;
    return dt => {
      if (t < 0) { next -= dt; if (next <= 0) t = 0; return 1; }
      t += dt;
      const p = t / .16;
      if (p >= 1) { t = -1; next = 2.2 + Math.random() * 3.2; return 1; }
      return 1 - Math.sin(p * Math.PI) * .92;
    };
  }

  /* data-URL snapshot of a face in a given state, cropped to the head */
  function render(opts, state, viewBox) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', viewBox || '36 40 208 208');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('width', '392'); svg.setAttribute('height', '392');
    const g = document.createElementNS(NS, 'g');
    svg.appendChild(g);
    const f = mount(g, opts);
    f.set(Object.assign({ rays: 8 }, state));
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  return { mount, render, blinker, FACE };
})();
