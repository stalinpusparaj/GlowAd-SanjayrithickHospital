/* Shared engine for the Sanjay Rithik Hospital playables.
   Layout scaling, MRAID-aware boot, synthesized sound, tutorial hand, progress UI, particles and the
   lead-gen end card. Each ad's script calls SR.register({ init, frame, tutorial, reset, endArt }). */
(() => {
  'use strict';

  const CONFIG = window.SR_CONFIG;

  /* ===================== helpers ===================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const f2 = n => (Math.round(n * 100) / 100).toString();
  const now = () => performance.now();
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function track(name, data) {
    try { if (typeof window.AD_TRACK === 'function') window.AD_TRACK(name, Object.assign({ ad: CONFIG.adId }, data || {})); } catch (e) {}
    if (CONFIG.debug) console.log('[ad]', name, data || '');
  }
  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  /* ===================== DOM ===================== */
  const app = $('#app'), frame = $('#frame'), stage = $('#stage'), hero = $('#hero');
  const gaugeNum = $('#gaugeNum'), gaugeArc = $('#gaugeArc'), chip = $('#chip'), chipTxt = $('#chipTxt');
  const handEl = $('#hand'), endEl = $('#end'), eArt = $('#eArt'), eTitle = $('#eTitle'), eSub = $('#eSub');
  const fxCanvas = $('#fx'), g2d = fxCanvas.getContext('2d');
  const soundBtn = $('#soundBtn'), pv = $('#pv');

  $$('[data-txt]').forEach(n => { const v = CONFIG[n.getAttribute('data-txt')]; if (v != null) n.textContent = v; });
  if (CONFIG.logoSrc) { // swap the drawn mark for the hospital's own logo when one is supplied
    const img = document.createElement('img');
    img.className = 'logo-img'; img.alt = 'Sanjay Rithik Hospital'; img.src = CONFIG.logoSrc;
    $('#logo').replaceChildren(img);
  }
  const chips = $('#chips');
  (CONFIG.chips || []).forEach(c => { const s = document.createElement('span'); s.textContent = c; chips.appendChild(s); });

  /* ===================== lead-gen click-through ===================== */
  let concern = CONFIG.concern, endTitle = CONFIG.endTitle, endSub = CONFIG.endSub;
  function waUrl() {
    const msg = CONFIG.waText.replace('{concern}', concern);
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  }
  function urlFor(kind) {
    if (typeof window.clickTag === 'string' && window.clickTag) return window.clickTag; // network tracking URL wins
    if (kind === 'call') return 'tel:+' + CONFIG.phone;
    if (kind === 'site' || CONFIG.ctaMode === 'site') return CONFIG.siteUrl;
    return waUrl();
  }
  function refreshLinks() {
    $$('[data-cta]').forEach(a => {
      const url = urlFor(a.getAttribute('data-cta'));
      a.href = url;
      if (/^https?:/.test(url)) a.target = '_blank'; else a.removeAttribute('target');
    });
  }
  function openCta(e, kind) {
    track('cta_click', { kind, done, concern });
    Sound.click();
    const url = urlFor(kind);
    try { if (window.mraid && typeof window.mraid.open === 'function') { e && e.preventDefault(); window.mraid.open(url); return; } } catch (err) {}
    try { if (window.ExitApi && typeof window.ExitApi.exit === 'function') { e && e.preventDefault(); window.ExitApi.exit(); return; } } catch (err) {}
    // otherwise the anchor's own href opens WhatsApp / the dialer
  }
  $$('[data-cta]').forEach(a => a.addEventListener('click', e => openCta(e, a.getAttribute('data-cta'))));
  refreshLinks();

  /* ===================== sound (WebAudio, synthesized, no files) ===================== */
  const Sound = {
    ctx: null, out: null, on: CONFIG.soundOnByDefault !== false,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
          this.ctx = new AC();
          const comp = this.ctx.createDynamicsCompressor();
          this.out = this.ctx.createGain();
          this.out.gain.value = this.on ? .6 : 0;
          this.out.connect(comp); comp.connect(this.ctx.destination);
        } catch (e) { this.ctx = null; return; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    set(on) {
      this.on = on;
      if (this.out) this.out.gain.setTargetAtTime(on ? .6 : 0, this.ctx.currentTime, .02);
    },
    tone(f, o) {
      if (!this.ctx || !this.on || this.ctx.state !== 'running') return;
      const { dur = .2, type = 'sine', vol = .2, at = 0, to = 0, attack = .006 } = o || {};
      const t = this.ctx.currentTime + at, osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(f, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur * .7);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(g); g.connect(this.out); osc.start(t); osc.stop(t + dur + .03);
    },
    hz: m => 440 * Math.pow(2, (m - 69) / 12),
    tick(i) { // rising major scale, so progress plays a melody
      const sc = [0, 2, 4, 5, 7, 9, 11], m = 62 + sc[i % 7] + 12 * Math.floor(i / 7), f = this.hz(m);
      this.tone(f, { dur: .24, type: 'triangle', vol: .15 });
      this.tone(f * 2, { dur: .16, vol: .04 });
    },
    pop() { this.tone(520 + Math.random() * 140, { dur: .12, vol: .11, to: 1400 }); },
    zap() { this.tone(1500 + Math.random() * 300, { dur: .07, type: 'square', vol: .025, to: 700 }); },
    whoosh() { this.tone(260, { dur: .32, vol: .07, to: 980, attack: .05 }); },
    err() { this.tone(240, { dur: .14, type: 'triangle', vol: .1 }); this.tone(190, { dur: .2, type: 'triangle', vol: .1, at: .1 }); },
    chime(i) { const m = [74, 78, 81, 86][i % 4]; this.tone(this.hz(m), { dur: .5, type: 'triangle', vol: .13 }); this.tone(this.hz(m + 12), { dur: .3, vol: .04, at: .03 }); },
    win() {
      [74, 78, 81, 86, 90].forEach((m, i) => {
        this.tone(this.hz(m), { dur: .55, type: 'triangle', vol: .13, at: i * .085 });
        this.tone(this.hz(m + 12), { dur: .35, vol: .04, at: i * .085 + .02 });
      });
      for (let i = 0; i < 9; i++) this.tone(this.hz(98 + [0, 4, 7, 12][i % 4]), { dur: .12, vol: .022, at: .5 + i * .06 });
    },
    click() { this.tone(880, { dur: .08, type: 'triangle', vol: .08 }); }
  };
  function setSoundUI() { soundBtn.setAttribute('aria-pressed', String(Sound.on)); soundBtn.setAttribute('aria-label', Sound.on ? 'Mute sound' : 'Turn sound on'); }
  soundBtn.addEventListener('click', () => { Sound.unlock(); Sound.set(!Sound.on); setSoundUI(); Sound.click(); });
  setSoundUI();

  /* ===================== state shared with the ad ===================== */
  let ad = null, done = false, everInteracted = false, lastInteract = 0, silentUntil = 0, milestone50 = false, lastPct = -1;
  let scale = 1, W = 360, H = 640, T = 0;

  function interact() {
    Sound.unlock();
    if (!everInteracted) { everInteracted = true; track('first_interaction'); }
    if (Hand.on) Hand.hide();
    lastInteract = now();
  }
  const userDriven = () => everInteracted && now() > silentUntil;

  /* ===================== tutorial hand: the ad supplies a path fn(t) -> {x, y, a, press} in stage px ===================== */
  const Hand = {
    on: false, t: 0, fn: null,
    show(fn) { if (!fn) return; this.on = true; this.t = 0; this.fn = fn; },
    hide() { this.on = false; this.fn = null; handEl.style.opacity = 0; handEl.classList.remove('press'); if (ad && ad.tutorialEnd) ad.tutorialEnd(); },
    update(dt) {
      if (!this.on) return;
      this.t += dt;
      const s = this.fn(this.t);
      if (!s) { handEl.style.opacity = 0; return; }
      handEl.style.transform = `translate(${f2(s.x - 18)}px, ${f2(s.y - 2)}px)`;
      handEl.style.opacity = s.a == null ? 1 : s.a;
      handEl.classList.toggle('press', !!s.press);
    }
  };
  /* a canned tap gesture at a point, and a drag between two points */
  const tapPath = (x, y, period = 1.6) => t => {
    const c = t % period;
    if (c < .3) return { x: x + 26 * (1 - c / .3), y: y + 30 * (1 - c / .3), a: c / .3 };
    if (c < .55) return { x, y, a: 1, press: true };
    if (c < .9) return { x, y, a: 1 };
    if (c < 1.2) return { x, y, a: 1 - (c - .9) / .3 };
    return { x, y, a: 0 };
  };
  const dragPath = (x0, y0, x1, y1, period = 2.8) => t => {
    const c = t % period;
    if (c < .35) return { x: x0, y: y0, a: c / .35, press: c > .2 };
    if (c < 1.6) { const p = easeInOut((c - .35) / 1.25); return { x: lerp(x0, x1, p), y: lerp(y0, y1, p), a: 1, press: true, p }; }
    if (c < 1.95) return { x: x1, y: y1, a: 1, p: 1 };
    if (c < 2.4) return { x: x1, y: y1, a: 1 - (c - 1.95) / .45, p: 1 };
    return { x: x1, y: y1, a: 0, p: 1 };
  };

  /* ===================== geometry: map elements / SVG points into stage px ===================== */
  function rectOf(e) {
    const r = e.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = (r.left - s.left) / scale, y = (r.top - s.top) / scale, w = r.width / scale, h = r.height / scale;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }
  function svgToStage(svg, x, y) {
    const m = svg.getScreenCTM(), s = stage.getBoundingClientRect();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: (p.x - s.left) / scale, y: (p.y - s.top) / scale };
  }
  function clientToSvg(svg, cx, cy) {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  /* ===================== progress UI ===================== */
  function progress(p) {
    const pct = Math.round(clamp(p) * 100);
    if (pct === lastPct) return;
    lastPct = pct;
    gaugeNum.textContent = pct;
    gaugeArc.style.strokeDashoffset = (175.93 * (1 - clamp(p))).toFixed(2);
    if (!milestone50 && everInteracted && pct >= 50) { milestone50 = true; track('progress_50'); }
  }
  function caption(txt) {
    if (chipTxt.textContent === txt) return;
    chipTxt.textContent = txt;
    chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
  }

  /* ===================== particles on the fx canvas (stage px) ===================== */
  let parts = [], fxDirty = false;
  const COLS = ['#FFC54D', '#27B8C4', '#FFFAF5', '#EE7A5B', '#8FE3D8', '#0F8DBA'];
  function confetti() {
    const n = reduceMotion ? 36 : 150;
    for (let i = 0; i < n; i++) {
      const side = i % 3, fromX = side === 0 ? -10 : side === 1 ? W + 10 : W / 2;
      const vx = side === 0 ? 160 + Math.random() * 340 : side === 1 ? -(160 + Math.random() * 340) : (Math.random() - .5) * 520;
      parts.push({ kind: Math.random() < .22 ? 'dot' : 'rect', x: fromX, y: side === 2 ? H * .42 : H * .62, vx, vy: -(360 + Math.random() * 460), g: 700, dx: .35, dy: .6,
        rot: Math.random() * 6, vr: (Math.random() - .5) * 14, w: 5 + Math.random() * 6, h: 3.5 + Math.random() * 5, c: COLS[i % COLS.length], t: 0, life: 4.5, wob: Math.random() * 6, flip: true });
    }
  }
  /* small celebratory burst at a stage point */
  function burst(x, y, n = 14, opts = {}) {
    if (reduceMotion) n = Math.min(n, 6);
    const cols = opts.colors || COLS, sp = opts.speed || 150;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (.45 + Math.random() * .7);
      parts.push({ kind: opts.kind || (i % 3 ? 'star' : 'dot'), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.lift || 40), g: opts.g == null ? 260 : opts.g, dx: .08, dy: .2,
        rot: Math.random() * 6, vr: (Math.random() - .5) * 8, w: (opts.size || 7) * (.6 + Math.random() * .7), h: 0, c: cols[i % cols.length], t: 0, life: opts.life || (.6 + Math.random() * .4) });
    }
  }
  function star(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.bezierCurveTo(r * .12, -r * .24, r * .24, -r * .12, r, 0); ctx.bezierCurveTo(r * .24, r * .12, r * .12, r * .24, 0, r);
    ctx.bezierCurveTo(-r * .12, r * .24, -r * .24, r * .12, -r, 0); ctx.bezierCurveTo(-r * .24, -r * .12, -r * .12, -r * .24, 0, -r);
    ctx.fill();
  }
  function drawParts(dt) {
    if (!parts.length) { if (fxDirty) { g2d.setTransform(1, 0, 0, 1, 0, 0); g2d.clearRect(0, 0, fxCanvas.width, fxCanvas.height); fxDirty = false; } return; }
    const k = scale * Math.min(2, window.devicePixelRatio || 1);
    g2d.setTransform(1, 0, 0, 1, 0, 0);
    g2d.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    g2d.setTransform(k, 0, 0, k, 0, 0);
    fxDirty = true;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt; p.vy += p.g * dt; p.vx *= Math.pow(p.dx, dt); p.vy *= Math.pow(p.dy, dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H + 30 || p.t > p.life) { parts.splice(i, 1); continue; }
      g2d.save();
      g2d.translate(p.x + (p.flip ? Math.sin(p.t * 6 + p.wob) * 6 : 0), p.y);
      g2d.rotate(p.rot);
      if (p.flip) g2d.scale(1, Math.cos(p.t * 9 + p.wob));
      g2d.globalAlpha = Math.min(1, (p.life - p.t) / Math.min(.6, p.life * .5));
      g2d.fillStyle = p.c;
      if (p.kind === 'dot') { g2d.beginPath(); g2d.arc(0, 0, p.w / 2, 0, Math.PI * 2); g2d.fill(); }
      else if (p.kind === 'star') { const s = Math.sin(Math.PI * Math.min(1, p.t / p.life * 1.3)); star(g2d, Math.max(.5, p.w * s)); }
      else g2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g2d.restore();
    }
  }

  /* ===================== win + end card ===================== */
  function complete() {
    if (done) return;
    done = true;
    Hand.hide();
    track('complete');
    Sound.win(); buzz([30, 40, 30]);
    hero.classList.remove('win'); void hero.offsetWidth; hero.classList.add('win');
    const r = rectOf(hero);
    burst(r.cx, r.cy, 26, { speed: 230, size: 9, life: 1.1 });
    setTimeout(showEnd, 1150);
  }
  function showEnd() {
    if (!done) return;
    eTitle.textContent = endTitle;
    eSub.textContent = endSub;
    eArt.replaceChildren();
    const art = ad && ad.endArt && ad.endArt();
    if (typeof art === 'string') eArt.innerHTML = art; else if (art) eArt.appendChild(art);
    eArt.hidden = !art;
    refreshLinks();
    endEl.classList.add('show');
    endEl.setAttribute('aria-hidden', 'false');
    confetti();
    track('endcard');
  }
  function replay() {
    track('replay');
    Sound.click();
    endEl.classList.remove('show');
    endEl.setAttribute('aria-hidden', 'true');
    done = false; milestone50 = false;
    silentUntil = now() + 900;
    lastInteract = now() - 2600;
    hero.classList.remove('win');
    if (ad && ad.reset) ad.reset();
  }
  $('#replay').addEventListener('click', replay);

  /* ===================== layout: fill any slot, switch orientation ===================== */
  let previewOrient = 'portrait';
  const layoutFns = [];
  function isDesktopPreview() {
    if (!CONFIG.desktopPreviewFrame || window.mraid || location.hash === '#full') return false;
    const fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
    return fine && app.clientWidth >= 820 && app.clientHeight >= 560;
  }
  function layout() {
    const vw = app.clientWidth, vh = app.clientHeight;
    let fw = vw, fh = vh, fx = 0, fy = 0;
    const framed = isDesktopPreview();
    document.body.classList.toggle('framed', framed);
    document.body.classList.toggle('full', !framed);
    pv.hidden = !framed;
    if (framed) {
      const top = 70, pad = 28;
      if (previewOrient === 'portrait') { fh = Math.min(vh - top - pad, 780); fw = fh * 9 / 16; }
      else { fw = Math.min(vw - 2 * pad, 1040); fh = fw * 9 / 16; if (fh > vh - top - pad) { fh = vh - top - pad; fw = fh * 16 / 9; } }
      fx = (vw - fw) / 2; fy = top + (vh - top - pad - fh) / 2;
    }
    frame.style.cssText = `left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px`;
    const land = fw / fh > 1.15;
    const BW = land ? 640 : 360, BH = land ? 360 : 640;
    scale = Math.min(fw / BW, fh / BH);
    W = fw / scale; H = fh / scale;
    stage.style.width = W + 'px'; stage.style.height = H + 'px';
    stage.style.transform = `scale(${scale})`;
    stage.classList.toggle('landscape', land);
    stage.classList.toggle('portrait', !land);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    fxCanvas.width = Math.round(W * scale * dpr); fxCanvas.height = Math.round(H * scale * dpr);
    layoutFns.forEach(fn => fn(land));
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 120));
  $('#pvP').addEventListener('click', () => { previewOrient = 'portrait'; $('#pvP').setAttribute('aria-pressed', 'true'); $('#pvL').setAttribute('aria-pressed', 'false'); layout(); });
  $('#pvL').addEventListener('click', () => { previewOrient = 'landscape'; $('#pvL').setAttribute('aria-pressed', 'true'); $('#pvP').setAttribute('aria-pressed', 'false'); layout(); });
  $('#pvR').addEventListener('click', () => { replay(); everInteracted = false; lastInteract = now(); setTimeout(startTutorial, 300); });

  /* ===================== main loop ===================== */
  let last = now(), running = false;
  function startTutorial() { if (!done && ad && ad.tutorial) Hand.show(ad.tutorial(!everInteracted)); }
  function frameLoop(ts) {
    const dt = Math.min(.05, Math.max(0, (ts - last) / 1000));
    last = ts; T += dt;
    if (!Hand.on && !done && everInteracted && ad && ad.tutorial && ad.idle !== false && now() - lastInteract > 4200) startTutorial();
    Hand.update(dt);
    if (ad && ad.frame) ad.frame(dt, T);
    drawParts(dt);
    requestAnimationFrame(frameLoop);
  }
  function boot() {
    if (running) return;
    running = true;
    layout();
    if (ad && ad.ready) ad.ready();
    track('impression');
    lastInteract = now();
    setTimeout(() => { if (!everInteracted) startTutorial(); }, 700);
    last = now();
    requestAnimationFrame(frameLoop);
  }
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else if (everInteracted) Sound.ctx.resume();
  });

  /* MRAID-aware start: wait for ready + viewable inside ad SDK webviews */
  function start() {
    const mraid = window.mraid;
    if (mraid && typeof mraid.getState === 'function') {
      const go = () => {
        const run = () => { boot(); layout(); };
        if (mraid.isViewable && !mraid.isViewable()) {
          const onView = v => { if (v) { mraid.removeEventListener && mraid.removeEventListener('viewableChange', onView); run(); } };
          mraid.addEventListener('viewableChange', onView);
        } else run();
      };
      if (mraid.getState() === 'loading') mraid.addEventListener('ready', go); else go();
    } else {
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(boot, boot);
      setTimeout(boot, 600);
    }
  }

  window.SR = {
    CONFIG, $, $$, clamp, lerp, smooth, easeInOut, easeOut, f2, now, el, NS, rnd, reduceMotion, Sound, buzz, track,
    Hand, tapPath, dragPath, rectOf, svgToStage, clientToSvg, progress, caption, burst, complete, interact, userDriven,
    get done() { return done; }, get everInteracted() { return everInteracted; }, get scale() { return scale; },
    get W() { return W; }, get H() { return H; }, get T() { return T; },
    poke() { lastInteract = now(); },
    onLayout(fn) { layoutFns.push(fn); },
    setConcern(c) { concern = c; refreshLinks(); },
    setEnd(title, sub) { if (title) endTitle = title; if (sub) endSub = sub; },
    register(a) { ad = a; if (ad.init) ad.init(); start(); }
  };
})();
