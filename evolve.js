/* Clerk Quest evolving cards (spec docs/superpowers/specs/2026-10-06-card-levels-evolve-design.md §1).
   The six five-level cards transform at level 4 into new art: holo-silver frame at level 4, gold at level 5, with torn
   scraps of the old card on both sides. It stays the same card; only the face changes. A card evolves only once its
   evolved art is listed in EVOLVE. The tear (peel reveal) plays once per card; S.cards[id].evoSeen records it and
   S.cards[id].evoArt === 'original' is the player's Original/Evolved switch.
   Loaded before the main script; uses the app's globals (maxL, NEED, P, esc, S, save, refresh, cardEl, ...) at call time. */

const EVOLVE = {
  gavel:{ char:'art/gavel_evolved.webp', bg:'art/bg_gavel_evolved.webp' },
};
const EVO_FRAME = { 4:'art/frame_evolved_silver.webp', 5:'art/frame_evolved_gold.webp' };

const canEvolve = c => !!(c && EVOLVE[c.id] && maxL(c) === 5);
const isEvolvedView = (c, st) => canEvolve(c) && !!st && st.level >= 4 && !!st.evoSeen && st.evoArt !== 'original';
const evoFrameFor = st => st.level >= 5 ? EVO_FRAME[5] : EVO_FRAME[4];   // Gold Seal keeps the gold evolved frame
/* The old card that shows through the tear: the same card state (level, XP, version) with the original art. Its pop-out
   character and stamp are hidden by CSS (.evo-old), so the scraps read as the flat old card. */
const scrapState = (c, st) => ({ ...st, evoArt:'original' });

function evolvedFrontHTML(c, st, opt={}){
  const lv = st.level, need = NEED[lv-1], e = EVOLVE[c.id], frame = evoFrameFor(st);
  const pct = st.mastered ? 100 : Math.min(100, st.xp / need * 100);
  const pop = lv >= maxL(c);   // level 5: the evolved character steps out of the frame
  const alt = `${esc(c.name)} evolved artwork`;
  const popHTML = pop ? `<img class="framebreak-character evo-pop" src="${e.char}" alt="${alt}">${panelsOverHTML(frame, 's1')}
    <img class="frame-metadata top" data-frame-mask="top" src="${frame}" alt=""><img class="frame-metadata quote" data-frame-mask="quote" src="${frame}" alt=""><img class="frame-metadata footer" data-frame-mask="footer" src="${frame}" alt="">` : '';
  return `
    <div class="art-win evo-win" style="${P(55,375,969,1215)}"><img class="art-bgimg" src="${e.bg}" alt=""><div class="art-vig"></div>${pop ? '' : `<img class="art-img cut evo-char" src="${e.char}" alt="${alt}">`}</div>
    <img class="frame" src="${frame}" alt="">
    ${popHTML}
    <div class="t num" style="${P(58,64,230,160)}">${c.num}</div>
    <div class="t xpstrip" style="${P(236,62,496,146)}"><span>${st.mastered ? 'XP MAXED' : `XP ${st.xp} / ${need}`}</span><i><b style="width:${pct}%"></b></i></div>
    <div class="t cat" style="${P(502,62,856,144)}">${esc(c.category)}</div>
    <div class="t icon" style="${P(862,62,958,156)}">${c.trickType ? `<img src="art/icon_${c.trickType}.webp" alt="${TRICK_TYPES[c.trickType].label}">` : ICON[c.icon]}</div>
    <div class="t title" style="${P(104,176,922,434)}">
      ${window.CQ_TITLE_ART?.[c.id] ? printedTitleHTML(c, 818/258, 74, 52, 12.5) : `${titleLine(c, 1, 74, 12.5)}${titleLine(c, 2, 52, 12.5)}`}
    </div>
    <div class="t quote" style="${P(232,1180,772,1290)};${quoteStyle(c)}">“${quoteText(c)}”</div>
    <div class="t rar" style="${P(82,1322,312,1448)}">${verBadge(st, 4.2, 3.3)}</div>
    <div class="t set" style="${P(352,1326,648,1448)}"><small>CARD SET</small><hr><span>${esc(c.set)}</span></div>
    <div class="t lvl" style="${P(728,1322,944,1448)}"><span class="stars">${starsHTML(lv, opt.newStar, maxL(c))}</span><span>LEVEL ${lv}</span></div>
    ${evoScrapsHTML(c, st)}
    ${st.mastered ? `<img class="stampimg mastered" src="art/stamp_mastered.webp" alt="Mastered">` : ''}`;
}

/* The torn edges: the old card, stretched to the evolved outline, shown only through the tear mask, with the
   white torn-paper rim on top. */
function evoScrapsHTML(c, st){
  return `<div class="evo-scraps" aria-hidden="true"><div class="evo-old">${frontHTML(c, scrapState(c, st))}</div></div>
    <img class="evo-rim" src="art/evolve_tear_rim.webp" alt="">`;
}

/* Original / Evolved switch on the card page, once the card has evolved. */
function evoSwitchHTML(c, st){
  if (!canEvolve(c) || !st || st.level < 4 || !st.evoSeen) return '';
  const orig = st.evoArt === 'original';
  return `<div class="evo-switch" role="group" aria-label="Card art">
    <button class="${orig ? '' : 'on'}" data-act="evo-art" data-id="${c.id}" data-v="evolved" aria-pressed="${!orig}">Evolved</button>
    <button class="${orig ? 'on' : ''}" data-act="evo-art" data-id="${c.id}" data-v="original" aria-pressed="${orig}">Original</button></div>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="evo-art"]'); if (!t) return;
  const st = S.cards[t.dataset.id]; if (!st) return;
  if (t.dataset.v === 'original') st.evoArt = 'original'; else delete st.evoArt;
  save(); refresh();
});

/* ---------- The tear: peel the old card off to reveal the evolved one (plays once per card) ----------
   The evolved card (with its scraps) sits underneath; on top lies the old card's middle piece, cut by
   evolve_tear_center.png, so before the tear the two together look exactly like the old card. The piece is peeled
   with the pack sticker's WebGL peel (sticker3d.js), using a picture of it (art/<id>_peel_<version>.webp, made by
   tools/evolve_peel_images.js). Until WebGL is ready, or where it is missing, the page-layer piece is shown and
   curls up with CSS instead. opts.preview: admin replay, nothing saved. */
let evoPeelOpen = false;
function showEvolvePeel(c, done, opts={}){
  if (!canEvolve(c) || evoPeelOpen) return;
  evoPeelOpen = true;
  const base = opts.st || S.cards[c.id], st = { ...base, level:Math.max(4, base.level), evoSeen:true };
  delete st.evoArt;
  const old = scrapState(c, st);
  const ov = document.createElement('div');
  ov.className = 'evo-peel'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', `${c.name} is evolving`);
  ov.innerHTML = `<div class="rays2"></div>
    <h2 class="ep-title">Something's under this card…</h2>
    <div class="ep-stage">
      <div class="ep-under">${cardEl(c, st)}</div>
      <div class="ep-top"><div class="card series${c.series || 1} lv${old.level} ver-${verOf(old)}"><div class="evo-old">${frontHTML(c, old)}</div></div><i class="ep-shade"></i></div>
      <div class="ep-gl"></div>
    </div>
    <p class="ep-hint">Drag up to tear it off</p>
    <button class="btn-big gold ep-btn" data-ep="tear">TEAR IT OFF</button>`;
  document.body.appendChild(ov); lockScroll();
  const stage = ov.querySelector('.ep-stage'), top = ov.querySelector('.ep-top'), shade = ov.querySelector('.ep-shade');
  const rim = ov.querySelector('.ep-under .evo-rim');   // hidden until the tear starts, so nothing gives it away
  const reduce = prefersReducedMotion();
  let p = 0, startY = null, finished = false;
  const draw = () => {
    if (rim) rim.style.opacity = Math.min(1, p * 4).toFixed(3);
    if (reduce) { top.style.opacity = String(1 - p); return; }
    top.style.transform = `translateY(${(-p * 10).toFixed(2)}%) rotateX(${(p * 165).toFixed(1)}deg) rotateZ(${(-p * 5).toFixed(2)}deg)`;   // curls up over its top edge
    shade.style.opacity = (Math.min(1, p * 1.6) * .55).toFixed(3);
  };
  const animateTo = (to, ms, then) => {
    top.classList.add('ep-anim'); top.style.transitionDuration = ms + 'ms'; shade.style.transitionDuration = ms + 'ms';
    p = to; draw();
    setTimeout(() => { top.classList.remove('ep-anim'); then && then(); }, ms);
  };
  const finish = peeled => {
    if (finished) return; finished = true;
    ov.querySelector('.ep-btn').disabled = true;
    animateTo(1, peeled ? 0 : reduce ? 350 : 420, () => {
      top.style.opacity = '0'; top.style.pointerEvents = 'none';
      if (!opts.preview) { const real = S.cards[c.id]; real.evoSeen = true; save(); }
      nativeFeedback('levelup'); if (!reduce) { softFlash(); confetti(ov); }
      ov.classList.add('ep-done');
      ov.querySelector('.ep-title').textContent = 'Card evolved!';
      ov.querySelector('.ep-hint').innerHTML = `<b>${esc(c.name)}</b> has a new look. Switch back to the original art any time on its card page.`;
      const btn = ov.querySelector('.ep-btn'); btn.textContent = 'KEEP GOING →'; btn.dataset.ep = 'close'; btn.disabled = false;
    });
  };
  /* The WebGL peel: the same picture of the piece, peeled like a pack sticker */
  let gl = null;
  const ver = ['exhibit', 'certified'].find(v => [].concat(old.vers || []).includes(v)) || 'filed';
  if (!reduce && window.StickerPeel && window.Pack3D) {
    StickerPeel.mount(ov.querySelector('.ep-gl'), { src:`art/${c.id}_peel_${ver}.webp`, aspect:1024 / 1536, bare:true, frac:1 / 1.6, edgeReach:1.2,
      onStart:() => { if (rim) rim.style.opacity = '1'; },
      onHint:() => { ov.querySelector('.ep-hint').textContent = 'Start the drag near an edge of the card'; },
      onPeeled:() => { finished = false; finish(true); } })
      .then(api => {
        if (!ov.isConnected) { api.destroy(); return; }
        gl = api; requestAnimationFrame(() => requestAnimationFrame(() => { if (!finished) top.style.visibility = 'hidden'; }));
      })
      .catch(() => {});   // no WebGL: the CSS curl below keeps working
  }
  stage.addEventListener('pointerdown', e => {
    if (finished || gl) return;
    startY = e.clientY; stage.setPointerCapture(e.pointerId); top.classList.remove('ep-anim');
  });
  stage.addEventListener('pointermove', e => {
    if (startY === null || finished) return;
    p = Math.max(0, Math.min(1, (startY - e.clientY) / (stage.clientHeight * .7))); draw();
  });
  const release = () => {
    if (startY === null || finished) return;
    startY = null;
    if (p > .45) finish(); else animateTo(0, 300);
  };
  stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-ep]'); if (!b) return;
    if (b.dataset.ep === 'tear') {
      if (gl) { b.disabled = true; return gl.autoPeel(); }   // onPeeled finishes
      if (reduce) return finish();
      animateTo(.55, 450, finish);   // lifts, then flies off
    } else {
      if (gl) gl.destroy();
      ov.remove(); evoPeelOpen = false; unlockScroll();
      if (done) done(); else if (!opts.preview) refresh();
    }
  });
  draw();
}

const EVOLVE_CSS = `
.evo-scraps{inset:0;z-index:11;pointer-events:none;-webkit-mask:url(art/evolve_tear_mask.webp) 0 0/100% 100% no-repeat;mask:url(art/evolve_tear_mask.webp) 0 0/100% 100% no-repeat}
.evo-old{position:absolute;left:-1.93%;top:-1.07%;width:103.96%;height:102.34%;container-type:inline-size}
.evo-old > *{position:absolute}
.evo-old .frame{inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
.evo-old > :is(.framebreak-character,.frame-metadata,.frame.panels-top,.stampimg,.mn-badge.framebreak-memory){display:none}
.card > .evo-rim{inset:0;width:100%;height:100%;z-index:12;pointer-events:none}
.card.evolved > .stampimg.mastered,.card.evolved > .vd{z-index:13}
.card.evolved.lv4.ver-filed:not(.cold):not(.charged){--st-glow:0 0 2.6cqw rgba(225,235,255,.4)}
/* the evolved frame's XP strip and level plate are dark: light lettering, also on Gold Seal (which darkens text) */
.card.evolved > :is(.t.xpstrip,.t.lvl),.card.evolved > :is(.t.xpstrip,.t.lvl) :not(.gem){color:#f6ecd2!important;-webkit-text-stroke:0!important;text-shadow:0 .2cqw .5cqw rgba(0,0,0,.85)!important}
.card.evolved > .t.lvl .stars .on{color:#ffd45a!important}.card.evolved > .t.lvl .stars .off{color:rgba(246,236,210,.35)!important}
.card.evolved > .t.xpstrip i{background:rgba(246,236,210,.25)!important}
.evo-switch{display:flex;gap:4px;margin:10px auto 0;padding:3px;border-radius:18px;background:var(--bg2);border:.5px solid var(--line);width:max-content}
.evo-switch button{min-height:32px;padding:0 14px;border:0;border-radius:15px;background:transparent;color:var(--sub);font:16px "Patrick Hand"}
.evo-switch button.on{background:var(--mustard);color:var(--ink)}

.evo-peel{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;overflow:hidden;
  background:radial-gradient(circle at 50% 45%,rgba(60,40,10,.85),rgba(0,0,0,.94));animation:fadein .3s both}
.ep-title{margin:0;position:relative;font:400 clamp(28px,8vw,46px)/1 "Luckiest Guy";letter-spacing:.04em;color:var(--mustard);-webkit-text-stroke:2px var(--ink);paint-order:stroke fill;text-shadow:0 4px 0 var(--ink);text-align:center}
.ep-stage{position:relative;width:min(70vw,300px,calc((100dvh - 280px) / 1.5));aspect-ratio:1024/1536;perspective:1800px;touch-action:none;cursor:grab;user-select:none}
.ep-under,.ep-top{position:absolute;inset:0}
.ep-gl{position:absolute;inset:-30%;z-index:3;touch-action:none}
.ep-top{z-index:2;transform-origin:50% 0;transform-style:preserve-3d;backface-visibility:visible;
  -webkit-mask:url(art/evolve_tear_center.webp) 0 0/100% 100% no-repeat;mask:url(art/evolve_tear_center.webp) 0 0/100% 100% no-repeat}
.ep-top > .card::after{display:none}
.ep-shade{position:absolute;inset:0;z-index:20;opacity:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.85))}
.ep-anim,.ep-anim .ep-shade{transition-property:transform,opacity;transition-timing-function:cubic-bezier(.2,.8,.2,1)}
.ep-hint{margin:0;position:relative;max-width:340px;text-align:center;font-size:18px;color:var(--paper)}
.ep-btn{position:relative;max-width:340px}
.evo-peel.ep-done .ep-stage{cursor:default}
.evo-peel.ep-done .ep-under{animation:epPop .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes epPop{0%{transform:scale(.96)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.evo-peel.ep-done .ep-under{animation:none}}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${EVOLVE_CSS}</style>`);
