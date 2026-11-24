/* Clerk Quest: the desk-style Today screen (step 2).
   When ?desk=1 is on (remembered as localStorage cq-desk-test; ?desk=0 turns it off) the Today root screen becomes a
   wooden desk: one three.js canvas under the navbar, with the owner's painted props (kit: assets/app-desk-kit/v2,
   art/desk2_*.webp) standing on planes at slightly different depths with soft silhouette shadows. Every word and
   number is live HTML laid over the objects (the overlay is re-projected from each object's anchor whenever the
   camera moves, so text stays crisp), and every object is a real <button> with an aria-label: the folder starts
   today's step, the pack opens, the tray starts the next study card, the clipboard opens Quests, the deck box
   opens the store, Gavel opens Profile, the books open Study, the cup wobbles.
   The normal Today list stays in the DOM (visually hidden) for screen readers.
   Phone tilt (BreakoutMotion) or the mouse swings the camera a little for parallax. A tap presses the object,
   the camera leans toward it for ~250 ms, then the action runs (Reduce Motion: no lean, still picture).
   Rendering happens only while something moves; steam and the lamp glow are CSS animations on the overlay, so the
   canvas stays idle. index.html calls HomeDesk.sync() after every screen change. */
const HomeDesk = (() => {
  let on = false;
  try {
    const m = location.search.match(/[?&]desk=([01])/);
    if (m) localStorage.setItem('cq-desk-test', m[1]);
    on = localStorage.getItem('cq-desk-test') === '1';
  } catch (_) {}
  const reduced = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
  const clamp = (n, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));
  const esc2 = s => typeof esc === 'function' ? esc(s) : String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  const IMG = {
    lamp:'art/desk4_banker_lamp.webp', gavel:'art/desk4_gavel_mascot.webp', deck:'art/desk4_deck_box.webp', cup:'art/desk4_coffee_cup.webp',
    folder:'art/desk5_folder.webp', pack:'art/desk3_booster_pack.webp', clip:'art/desk3_clipboard.webp', tray:'art/desk4_tray.webp',
    paper:'art/desk3_paperwork_card.webp', gcard:'art/desk3_gavel_card.webp', pen:'art/desk4_pen.webp', books:'art/desk4_books.webp',
    plant:'art/desk4_desk_plant.webp', bg:'art/desk3_background.webp', sticky:'art/desk4_sticky_notes.webp', env:'art/desk4_envelope.webp',
  };
  const STEAM = 'art/desk4_steam_wisp.webp', START = 'art/desk2_start_button.svg', CHECK = 'art/desk2_checkbox.svg';

  /* The layouts. xf/yf place the centre (fractions of the layout width / the desk height), w is the width on a 390-wide
     phone (or in a 1280-wide window on a computer), z the depth (px toward the camera), o the paint order, rot degrees
     (counter-clockwise), t the Tab order, slot = a card texture made from the player's own cards, dom = no painted plane,
     just live HTML (the plan cards, the deck boxes, the shelf). fl = lies flat on the desk (tilted back, with a thin edge;
     the number is how much of the tilt), without fl = stands upright on its base. sq squashes the height a little.
     The props are drawn at the desk's angle already (kit: new-art/desk-angled), so the flat ones tilt only a little.
     The phone numbers come from the concept picture (new-art/desk-angled/angled-desk-scene-v2.webp, 1024 wide, desk area
     from y 108 to 1430). pocket = the front of the folder's pocket, drawn again over the two cards standing in it. */
  const POCKET = `<img class="dk-pocket" src="${'art/desk5_folder.webp'}" alt="">`;
  const DESK = [
    { k:'shelf',  dom:true, xf:.62, yf:.125, w:640, asp:.2, z:4, o:.1, rot:0, html:() => '<span class="dk-shelf"></span>' },
    { k:'books',  img:'books',  xf:.075, yf:.82, w:230, z:22, o:2,  rot:0, btn:'books', t:7 },
    { k:'envelope', img:'env',  xf:.47, yf:.93, w:150, z:23, o:2.2, rot:-3, fl:.1, ang:1 },
    { k:'pen',    img:'pen',    xf:.385, yf:.9, w:115, z:8,  o:1,  rot:13, fl:.1, ang:1, sh:.75 },
    { k:'sticky', img:'sticky', xf:.262, yf:.745, w:130, z:10, o:1.5, rot:0, fl:.1, ang:1, sh:.8 },
    { k:'planhdr', dom:true, xf:.15, yf:.43, w:230, asp:.19, z:20, o:2.5, rot:-3, fl:1, html:d => `<span class="dk-note"><b>TODAY'S PLAN</b><i>${d.done} of ${d.total} done</i></span>` },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ k:'plan' + i, dom:true, xf:.098 + (i % 2) * .142, yf:.55 + Math.floor(i / 2) * .14 + (i % 2) * .01, w:175, asp:.66, z:16 + i, o:2.6 + i * .01, rot:[-2.5, 2, 1.5, -2, -1, 2.5][i], fl:1, btn:'plan' + i, t:1.1 + i / 10 })),
    { k:'folder', img:'folder', xf:.525, yf:.47, w:560, z:12, o:3,  rot:0, btn:'folder', t:1, fl:.06, ang:1, g:.5 },
    { k:'fc1',    slot:'f1', fb:'paper', xf:0, yf:0, w:0, z:13, o:4, rot:-6, host:'folder', fl:.06, th:2.5 },
    { k:'fc2',    slot:'f2', fb:'gcard', xf:0, yf:0, w:0, z:14, o:5, rot:5,  host:'folder', fl:.06, th:2.5 },
    { k:'pocket', dom:true, pocket:1, xf:0, yf:0, w:0, z:12, o:5.5, rot:0, host:'folder', fl:.06, html:() => POCKET },
    { k:'pack',   img:'pack',   xf:.285, yf:.835, w:150, z:20, o:6,  rot:0, btn:'pack', t:2, fl:.12, ang:1 },
    { k:'clip',   img:'clip',   xf:.882, yf:.61,  w:292, z:14, o:7,  rot:0, btn:'clip', t:4, fl:.12, ang:1 },
    { k:'tray',   img:'tray',   xf:.6, yf:.85, w:236, z:16, o:9,  rot:0, btn:'tray', t:3, fl:.1, ang:1 },
    { k:'traycard', slot:'tray', fb:'paper', xf:0, yf:0, w:0, z:17, o:8.6, rot:0, host:'tray', fl:.1 },
    { k:'lamp',   img:'lamp',   xf:.062,  yf:.15,  w:200, z:34, o:9.6, rot:0, glow:true },
    { k:'gavel',  img:'gavel',  xf:.215, yf:.225, w:290, z:30, o:10, rot:0, btn:'gavel', t:6 },
    ...[1, 2, 3, 4, 5, 6, 7].map(n => ({ k:'deck' + n, dom:true, deckN:n, xf:.43 + (n - 1) * .0665, yf:.108 + (n % 2) * .004, w:74, asp:1.5, z:30, o:3 + n * .01, rot:(n % 3 - 1) * 1.5, btn:'deck' + n, t:5 + n / 10 })),
    { k:'cup',    img:'cup',    xf:.93, yf:.255,  w:112, z:30, o:12, rot:0, btn:'cup', steam:true, t:8 },
    { k:'plant',  img:'plant',  xf:.962, yf:.935, w:200, z:62, o:14, rot:0 },
  ];
  const BG_Z = -170, FOV = 40;

  let st = null;          // { renderer, scene, camera, canvas, group, items:{k:{...}}, bg, W, H, desk }
  let loading = null, loadingThree = null, stage = null, attachedTo = null, offTilt = null, offWatch = null, builtFor = '';
  let tilt = { x:0, y:0 }, mouse = { x:0, y:0 }, lean = null, cur = { x:0, y:0, vx:0, vy:0 };
  let raf = 0, dirty = true, lastT = 0, lastBusy = true, sighAt = 0, busy = false, wobbleAt = 0, trayKey = '', hov = null;

  /* ---------- textures ---------- */
  const loadImg = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function texFromCanvas(c){ const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; return t; }
  function texFromImg(img){ const t = new THREE.Texture(img); t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; t.needsUpdate = true; return t; }

  /* silhouettes of an object, drawn with the 2D shadow blur (works in every browser): a soft cast shadow, a tight
     contact shadow, or a hard dark edge strip (the thickness of a flat thing) */
  function silTex(img, o){
    const k = (o.res || 160) / Math.max(img.width, img.height), w = Math.max(8, Math.round(img.width * k)), h = Math.max(8, Math.round(img.height * k)), pad = o.pad || 22;
    const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2; const g = c.getContext('2d');
    g.shadowColor = o.color || '#000'; g.shadowBlur = o.blur; g.shadowOffsetX = c.width + 1000;   // the shape is drawn far off the canvas; only its shadow lands here
    g.drawImage(img, pad - c.width - 1000, pad, w, h);
    return { tex:texFromCanvas(c), padW:(w + pad * 2) / w, padH:(h + pad * 2) / h };
  }
  /* the long soft shadow an upright thing throws on the desk, away from the lamp (down and to the right) */
  function castTex(img){
    const k1 = .36, k2 = .27, k = 140 / Math.max(img.width, img.height), W = Math.max(8, Math.round(img.width * k)), H = Math.max(8, Math.round(img.height * k)), pad = 16;
    const cw = Math.ceil(W + k1 * H + pad * 2), ch = Math.ceil(k2 * H + pad * 2);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
    g.shadowColor = '#000'; g.shadowBlur = 8; g.shadowOffsetX = cw + 1000;
    g.setTransform(1, 0, -k1, -k2, pad + k1 * H - cw - 1000, pad + k2 * H);
    g.drawImage(img, 0, 0, W, H);
    return { tex:texFromCanvas(c), cw, ch, W, pad };
  }
  function contactTex(){
    const c = document.createElement('canvas'); c.width = 128; c.height = 48; const g = c.getContext('2d');
    g.translate(64, 24); g.scale(1, .375); const r = g.createRadialGradient(0, 0, 0, 0, 0, 64);
    r.addColorStop(0, 'rgba(0,0,0,.95)'); r.addColorStop(.5, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(-64, -64, 128, 128);
    return texFromCanvas(c);
  }
  /* a soft haze for the far edge of the desk: the wood picture blurred (shrunk and stretched back), faded out downward */
  function hazeTex(img){
    const w = img.width, h = img.height, sm = document.createElement('canvas'); sm.width = Math.max(8, w >> 4); sm.height = Math.max(8, h >> 4);
    sm.getContext('2d').drawImage(img, 0, 0, sm.width, sm.height);
    const c = document.createElement('canvas'); c.width = w >> 1; c.height = h >> 1; const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high'; g.drawImage(sm, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in';
    const r = g.createLinearGradient(0, 0, 0, c.height); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(.12, 'rgba(0,0,0,.85)'); r.addColorStop(.4, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, c.width, c.height);
    return texFromCanvas(c);
  }

  /* a playing card made from one of the player's own cards (cream card, red frame, the character on it) */
  async function cardFace(card){
    const W = 320, H = 448, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    rr(2, 2, W - 4, H - 4, 22); g.fillStyle = '#f4e7c8'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1d1a16'; g.stroke();
    rr(16, 16, W - 32, H - 32, 14); g.lineWidth = 3; g.strokeStyle = '#8b2a1c'; g.stroke();
    const src = card && typeof uiCharacterSrc === 'function' ? uiCharacterSrc(card) : null;
    const img = src ? await loadImg(src) : null;
    if (!img) return null;
    const k = Math.min((W - 56) / img.width, (H - 70) / img.height), w = img.width * k, h = img.height * k;
    g.drawImage(img, (W - w) / 2, 30 + (H - 70 - h) / 2, w, h);
    return c;
  }

  /* ---------- the day's live data ---------- */
  const cardArt = c => { try { return !!(c && typeof uiCharacterSrc === 'function' && uiCharacterSrc(c)); } catch (_) { return false; } };
  function deskData(){
    const items = todayPlan().items, total = items.length, done = items.filter(itemDone).length, first = items.findIndex(it => !itemDone(it));
    const it = first >= 0 ? items[first] : null, hero = todayHeroText(it, done, total);
    const packs = Math.max(0, S.packs | 0);
    let next = null;
    try { next = byId(nextCard() || reviewPile()[0] || (heroCard() || {}).id) || null; } catch (_) {}
    if (next && !owned(next)) next = null;
    const qs = DAILY_QUESTS.map(q => ({ q, x:questState(q, 'daily') }));
    // the cards lying on the folder: the plan item's own card in front, a recently owned one behind it
    let main = null, other = null;
    try {
      const pc = it && (it.kind === 'review' || it.kind === 'next') ? byId(it.id) : null;
      main = [pc, next, heroCard()].find(c => c && owned(c) && cardArt(c)) || null;
      other = CARDS.filter(c => owned(c) && cardArt(c) && c !== main).sort((a, b) => ((S.cards[b.id] || {}).last || 0) - ((S.cards[a.id] || {}).last || 0))[0] || null;
    } catch (_) {}
    const series = [1, 2, 3, 4, 5, 6, 7].map(n => { let list = [], have = 0; try { list = CARDS.filter(groupTest('s' + n)); have = list.filter(owned).length; } catch (_) {} return { n, total:list.length, have }; });
    return { items, total, done, first, it, hero, packs, next, qs, qdone:qs.filter(r => r.x.done).length, cards:[main, other], series };
  }
  const OWNED_KEY = d => [d.next ? d.next.id : '-', d.cards[0] ? d.cards[0].id : '-', d.cards[1] ? d.cards[1].id : '-'].join('|');

  /* ---------- actions ---------- */
  function goStore(){
    push('store');
    const el = typeof currentScreenEl === 'function' ? currentScreenEl() : null;
    const h = el && [...el.querySelectorAll('.sec-h')].find(x => /complete decks/i.test(x.textContent));
    if (h && h.scrollIntoView) h.scrollIntoView({ block:'start' });
  }
  const ACTIONS = {
    folder(d){ if (d.it) todayGo(d.it); else todayMore(); },
    pack(d){ if (d.packs > 0) { if (typeof closeSheet === 'function') closeSheet(true); openPack(); } else goStore(); },
    tray(d){ if (d.next) { if (nextCard() === d.next.id) todayGo({ kind:'next', id:d.next.id }); else studyCard(d.next.id); } else switchTab('study'); },
    clip(){ push('quests'); },
    deck(){ goStore(); },
    gavel(){ switchTab('profile'); },
    books(){ switchTab('study'); },
    cup(){ wobbleAt = performance.now(); dirty = true; kick(); },
  };
  for (let i = 0; i < 6; i++) ACTIONS['plan' + i] = d => { const it = d.items[i]; if (it && !itemDone(it)) todayGo(it); };
  for (let n = 1; n <= 7; n++) ACTIONS['deck' + n] = d => { const r = d.series[n - 1]; if (r && r.have > 0) push('cards', { g:'s' + n }); else goStore(); };
  const LEAN_ONLY = { cup:1 };

  /* ---------- overlay: the live text on each object ---------- */
  const ctaWord = (d) => !d.it ? 'KEEP GOING' : 'START';
  function labelFolder(d){
    const dots = Array.from({ length:d.total }, (_, i) => `<em class="${i < d.done ? 'on' : ''}"></em>`).join('');
    const t = d.hero.title, long = t.length > 34 ? ' xl' : t.length > 20 ? ' l' : '';
    return `<span class="dk-fold">
      <span class="dk-prog">${d.total ? `TODAY · ${d.done} OF ${d.total}` : 'TODAY'}<i>${dots}</i></span>
      <span class="dk-lab">${esc2(d.hero.label)}</span>
      <span class="dk-title${long}">${esc2(t)}</span>
      <span class="dk-what">${esc2(d.hero.what)}</span>
      <span class="dk-start"><img src="${START}" alt=""><b><svg viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1.5v13l11-6.5z" fill="currentColor"/></svg>${ctaWord(d)}</b></span>
    </span>`;
  }
  const SHEEN = (src, cls) => `<span class="dk-sheen ${cls || ''}" style="-webkit-mask-image:url(${src});mask-image:url(${src})"></span>`;
  function labelPack(d){
    return d.packs > 0
      ? `<span class="dk-pk"><b><u>${d.packs}</u> PACK${d.packs > 1 ? 'S' : ''}</b><b>TO OPEN</b></span>${SHEEN(IMG.pack, 'foil')}`
      : `<span class="dk-pk"><b class="n s">STORE</b></span>${SHEEN(IMG.pack, 'foil')}`;
  }
  function labelTray(d){
    return `<img class="dk-trayfront" src="${IMG.tray}" alt=""><span class="dk-plate"><b>${d.next ? 'NEXT: ' + esc2(d.next.name) : 'STUDY'}</b></span>`;
  }
  function labelClip(d){
    const rows = d.qs.map(({ q, x }) => `<span class="dk-q ${x.done ? 'on' : ''}"><i>${x.done ? `<img src="${CHECK}" alt="">` : ''}</i><span>${esc2(q.label)}</span></span>`).join('');
    return `<span class="dk-clip"><b class="h">DAILY QUESTS</b><span class="s">${d.qdone} OF ${d.qs.length}<i>${d.qs.map(r => `<em class="${r.x.done ? 'on' : ''}"></em>`).join('')}</i></span>${rows}</span>${SHEEN(IMG.clip, 'board')}`;
  }
  function labelPlan(i, d){
    const it = d.items[i]; if (!it) return '';
    const r = todayRow(it), done = itemDone(it), c = (it.kind === 'review' || it.kind === 'next') ? byId(it.id) : null;
    const src = c && cardArt(c) ? uiCharacterSrc(c) : '';
    return `<span class="dk-idx ${done ? 'done' : ''} ${it === d.it ? 'now' : ''}"><span class="tk">${done ? `<img src="${CHECK}" alt="">` : ''}</span>
      <span class="tx"><b>${esc2(r.t)}</b><small>${esc2(r.sub)}</small></span>${src ? `<img class="ch" src="${src}" alt="">` : ''}</span>`;
  }
  function labelDeck(n, d){
    const r = d.series[n - 1], on = r && r.have > 0;
    return `<img class="dk-art ${on ? '' : 'dim'}" src="art/deck_s${n}.webp" alt="">`;
  }
  function labelFor(k, d){
    if (/^plan\d$/.test(k)) return labelPlan(+k[4], d);
    if (/^deck\d$/.test(k)) return labelDeck(+k[4], d);
    return LABELS[k] ? LABELS[k](d) : '';
  }
  const labelGavel = () => '<span class="dk-lid" style="left:32.8%;top:40.3%;transform:rotate(-8deg)"></span><span class="dk-lid" style="left:49.2%;top:46.4%;transform:rotate(10deg)"></span>';
  const LABELS = { gavel:labelGavel, folder:labelFolder, pack:labelPack, tray:labelTray, clip:labelClip };
  const ARIA = {
    folder:d => d.it ? `Today, ${d.done} of ${d.total} done. ${d.hero.title}. ${d.hero.what} Start.` : `Today, all ${d.total} done. Keep practicing.`,
    pack:d => d.packs > 0 ? `${d.packs} pack${d.packs > 1 ? 's' : ''} to open. Open a pack.` : 'Store. Get more packs.',
    tray:d => d.next ? `Next study card: ${d.next.name}. Start studying it.` : 'Study. Pick a card to practice.',
    clip:d => `Daily quests, ${d.qdone} of ${d.qs.length} done. Open Quests.`,
    deck:() => 'Series deck box. Open the store.',
    gavel:() => 'Gavel. Open your Profile.',
    books:() => 'Books. Open the Study tab.',
    cup:() => 'Coffee cup. Tap to make it wobble.',
  };
  function ariaFor(k, d){
    let m;
    if ((m = /^plan(\d)$/.exec(k))) { const it = d.items[+m[1]]; if (!it) return ''; const r = todayRow(it); return `${r.t}. ${itemDone(it) ? 'Done.' : 'Open it.'}`; }
    if ((m = /^deck(\d)$/.exec(k))) { const r = d.series[+m[1] - 1]; return r && r.have > 0 ? `Series ${m[1]} deck, ${r.have} of ${r.total} cards. Open its cards.` : `Series ${m[1]} deck, not started yet. Open the store.`; }
    return ARIA[k](d);
  }
  /* the game's own card front (cardEl) lying on the folder or standing in the tray; the kit's card art if the player owns none */
  function slotCard(p, d){
    const c = p.slot === 'tray' ? d.next : p.slot === 'f2' ? d.cards[0] : d.cards[1];
    let inner = '';
    try { if (c && S.cards[c.id] && typeof cardEl === 'function') inner = cardEl(c, S.cards[c.id]); } catch (_) {}
    if (!inner) inner = `<img class="dk-kit" src="${IMG[p.fb]}" alt="">`;
    return `<span class="dk-cw">${inner}<span class="dk-sheen card"></span></span>`;
  }
  function buildOverlay(d, props){
    const ui = document.createElement('div'); ui.className = 'dk-ui';
    const warm = document.createElement('div'); warm.className = 'dk-warm'; ui.appendChild(warm);
    const haze = document.createElement('div'); haze.className = 'dk-haze'; ui.appendChild(haze);
    const vig = document.createElement('div'); vig.className = 'dk-vig'; ui.appendChild(vig);
    const motes = document.createElement('div'); motes.className = 'dk-motes'; motes.setAttribute('aria-hidden', 'true');
    motes.innerHTML = Array.from({ length:7 }, () => '<i class="dk-mote"></i>').join(''); ui.appendChild(motes);
    const els = {};
    props.forEach(p => {   // plain (non-button) props that carry something: the lamp glow, the shelf, the plan heading
      if (p.btn || !(p.glow || p.html || p.slot)) return;
      const e = document.createElement('div'); e.className = 'dk-o dk-deco'; e.setAttribute('aria-hidden', 'true'); e.style.zIndex = String(Math.round(p.o * 2));
      e.innerHTML = p.glow ? '<span class="dk-glow"></span>' : p.slot ? slotCard(p, d) : p.html(d); ui.appendChild(e); els[p.k] = e;
    });
    props.filter(p => p.btn && !(/^plan\d$/.test(p.k) && !d.items[+p.k[4]])).sort((a, b) => (a.t || 99) - (b.t || 99)).forEach(p => {
      const k = p.btn, b = document.createElement('button'); b.type = 'button'; b.className = 'dk-o dk-btn dkb-' + k; b.dataset.k = k;
      b.setAttribute('aria-label', ariaFor(k, d)); b.style.zIndex = String(Math.round(p.o * 2));
      if (/^plan\d$/.test(k) && itemDone(d.items[+k[4]])) b.setAttribute('aria-disabled', 'true');
      b.innerHTML = labelFor(k, d) + (p.steam ? `<img class="dk-steam" src="${STEAM}" alt="" aria-hidden="true">` : '');
      ui.appendChild(b); els[p.k] = b;
    });
    return { ui, els };
  }

  /* ---------- scene ---------- */
  function loadThree(){
    if (window.THREE) return Promise.resolve();
    if (!loadingThree) loadingThree = (window.Pack3D && Pack3D.load ? Pack3D.load() : Promise.reject(new Error('no loader'))).catch(e => { loadingThree = null; throw e; });
    return loadingThree;
  }
  function plane(tex, order, clips){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false, depthTest:false, clippingPlanes:clips || null }));
    m.renderOrder = order; return m;
  }
  /* the shadows and the edge strip of one prop (made again when a card's picture changes) */
  function attachFx(s, it, src){
    if (it.fx) for (const n in it.fx) { const m = it.fx[n]; s.group.remove(m); m.geometry.dispose(); if (n !== 'contact' && m.material.map) m.material.map.dispose(); m.material.dispose(); }
    const p = it.p, o = p.o * 2, fx = {}, sh = p.sh || 1;
    const add = (n, tex, order, op, info) => { const m = plane(tex, order); m.material.opacity = op * sh; m.userData = Object.assign({ op:op * sh }, info); s.group.add(m); fx[n] = m; };
    if (p.fl) {
      const c = silTex(src, { blur:11 }), t = silTex(src, { blur:3, pad:10 }), e = silTex(src, { blur:0, pad:2, color:'#1c0d06' });
      add('cast', c.tex, o - .6, .7, c); add('tight', t.tex, o - .4, .95, t); add('edge', e.tex, o - .2, 1, e);
    } else {
      const c = castTex(src); add('cast', c.tex, o - .6, .4, c);
      s.contact = s.contact || contactTex(); add('contact', s.contact, o - .4, .8, {});
    }
    it.fx = fx;
  }
  async function build(s){
    const props = s.props, imgs = {};
    const need = new Set(['bg']); props.forEach(p => { if (p.img) need.add(p.img); if (p.fb) need.add(p.fb); });
    await Promise.all([...need].map(async k => { imgs[k] = await loadImg(IMG[k]); }));
    s.imgs = imgs;
    if (imgs.bg) {   // moodier wood: deep shadow everywhere except the warm pool under the lamp (top left)
      const c = document.createElement('canvas'); c.width = imgs.bg.width; c.height = imgs.bg.height; const g = c.getContext('2d');
      g.drawImage(imgs.bg, 0, 0);
      g.globalCompositeOperation = 'multiply';
      const r = g.createRadialGradient(c.width * .16, c.height * .06, 0, c.width * .16, c.height * .06, c.width * .85);
      r.addColorStop(0, '#ffffff'); r.addColorStop(.35, '#d6c0aa'); r.addColorStop(1, '#6e5646');
      g.fillStyle = r; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(96,88,84,.3)'; g.fillRect(0, 0, c.width, c.height);   // pull the orange toward the target's deep brown
      imgs.bg = c;
    }
    const bgTex = imgs.bg ? texFromImg(imgs.bg) : null;
    if (bgTex) { bgTex.wrapS = bgTex.wrapT = THREE.ClampToEdgeWrapping; }
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:bgTex, color:bgTex ? 0xffffff : 0x4a2a14, depthTest:false, depthWrite:false }));
    if (imgs.bg) { const hz = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:hazeTex(imgs.bg), transparent:true, depthTest:false, depthWrite:false })); hz.renderOrder = -9; s.group.add(hz); s.haze = hz; }
    bg.renderOrder = -10; s.group.add(bg); s.bg = bg; s.bgAspect = imgs.bg ? imgs.bg.width / imgs.bg.height : 1.5;
    s.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    s.items = {};
    for (const p of props) {
      const it = { p, press:1, pv:0, lift:0, hov:false, shadow:null };
      if (p.dom) { it.aspect = p.asp || 1; it.dom = true; it.o3 = new THREE.Object3D(); }
      else if (p.slot) {   // a card: the kit's art until the player's own card is ready
        const img = imgs[p.fb]; it.aspect = 1.5; it.src = img;
        it.mesh = plane(img ? texFromImg(img) : null, p.o * 2, p.slot === 'tray' ? [s.clipPlane] : null);
        if (img && p.slot !== 'tray') attachFx(s, it, img);
        it.mesh.visible = false;   // the card itself is live HTML (the game's cardEl); the mesh only feeds the shadows
      } else {
        const img = imgs[p.img]; if (!img) continue;
        it.aspect = img.height / img.width * (p.sq || 1); it.mesh = plane(texFromImg(img), p.o * 2); it.src = img;
        attachFx(s, it, img);
      }
      if (it.mesh) s.group.add(it.mesh);
      s.items[p.k] = it;
    }
  }
  async function updateCards(d){
    const s = st; if (!s || !s.items) return;
    const key = OWNED_KEY(d); if (key === trayKey) return; trayKey = key;
    const slots = { tray:d.next, f2:d.cards[0], f1:d.cards[1] };
    for (const slot of Object.keys(slots)) {
      const it = Object.values(s.items).find(x => x.p.slot === slot); if (!it || !it.mesh) continue;
      const c = await cardFace(slots[slot]); if (!st) return;
      if (slot === 'tray') continue;
      if (c) {   // the player's own card on the folder (otherwise the kit's art stays)
        if (it.mesh.material.map) it.mesh.material.map.dispose();
        it.mesh.material.map = texFromCanvas(c); it.mesh.material.needsUpdate = true;
        it.src = c; attachFx(s, it, c); s.W = s.H = 0;
      }
    }
    dirty = true; kick();
  }
  async function ensure(){
    const desk = innerWidth >= 900;
    if (st && st.desk !== desk) dispose();
    if (st) return st;
    if (!loading) loading = (async () => {
      await loadThree();
      const canvas = document.createElement('canvas'); canvas.className = 'dk-canvas'; canvas.setAttribute('aria-hidden', 'true');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'low-power' });
      renderer.localClippingEnabled = true; renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      const scene = new THREE.Scene(), group = new THREE.Group(); scene.add(group);
      const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 4000);
      const s = { renderer, scene, camera, canvas, group, items:null, W:0, H:0, desk, props:DESK };
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dispose(); });
      await build(s); st = s; trayKey = ''; return s;
    })().finally(() => { loading = null; });
    return loading;
  }
  function dispose(){
    if (!st) return;
    st.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); } });
    st.renderer.dispose(); st.canvas.remove(); st = null; trayKey = '';
    if (raf) cancelAnimationFrame(raf); raf = 0;
    detach(true);
  }

  /* ---------- layout + projection ---------- */
  const v3 = () => (v3.v = v3.v || new THREE.Vector3());
  function size(){
    const s = st; if (!s || !stage) return false;
    const W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return false;
    if (W === s.W && H === s.H) return true;
    s.W = W; s.H = H; s.renderer.setSize(W, H, false); s.canvas.style.width = W + 'px'; s.canvas.style.height = H + 'px';
    s.camera.aspect = W / H; s.camera.fov = FOV; s.camera.updateProjectionMatrix();
    s.D = (H / 2) / Math.tan(FOV * Math.PI / 360);
    if (s.desk) {   // computer: the whole desk across the window
      s.LW = W; s.ox = 0; s.k = Math.max(.6, Math.min(1.5, W / 1280, H / 700)); s.u = s.k * 1.3;
    }
    stage.style.setProperty('--u', s.u.toFixed(3) + 'px'); stage.style.setProperty('--uf', (s.u * (s.desk ? 1.3 : 1.22)).toFixed(3) + 'px');
    for (const k in s.items) {
      const it = s.items[k], p = it.p;
      it.w = p.w * s.k; it.h = it.w * it.aspect;
      it.cx = s.ox + p.xf * s.LW;
      it.cy = p.yf * H;
    }
    const t = s.items.tray, f = s.items.folder;
    for (const k in s.items) {
      const it = s.items[k], p = it.p;
      if (p.slot === 'tray' && t) {   // stands in the tray: behind the front lip, which hides its bottom quarter
        it.w = t.w * .6; it.h = it.w * 1.4;
        it.cx = t.cx; it.cy = t.cy - t.h * .5 + t.h * .8 - it.h * .5;
      } else if (p.pocket && f) {      // the pocket front: the folder's own picture, same place and size
        it.w = f.w; it.h = f.h; it.cx = f.cx; it.cy = f.cy;
      } else if (p.host === 'folder' && f) {   // the two cards stand in the folder's pocket (right side), bottoms behind its front
        it.w = f.w * (s.desk ? .2 : .228); it.h = it.w * 1.4;
        it.cx = f.cx + f.w * ((p.slot === 'f1' ? .835 : .888) - .5);
        it.cy = f.cy + f.h * ((p.slot === 'f1' ? .235 : .21) + (s.desk ? .075 : 0) - .5);
      }
    }
    return true;
  }

  const BASE_AMP = .052;    // camera sway: fraction of the desk height
  function aim(){
    const s = st; if (!s) return;
    const amp = s.H * (s.desk ? .03 : BASE_AMP), ex = clamp(cur.x), ey = clamp(cur.y);
    s.camera.position.set(ex * amp * 1.6, -ey * amp * 1.2, s.D);
    s.camera.lookAt(0, 0, 0); s.camera.updateMatrixWorld();
    // the background is pushed back, so it is scaled up to still fill the view
    const sc = (s.D - BG_Z) / s.D, bw = s.W * sc * 1.16, bh = s.H * sc * 1.16, a = s.bgAspect, pa = bw / bh;
    for (const m of [s.bg, s.haze]) {
      if (!m) continue;
      m.position.set(0, 0, BG_Z + (m === s.haze ? 1 : 0)); m.scale.set(bw, bh, 1);
      const map = m.material.map;
      if (map) { map.repeat.set(pa > a ? 1 : pa / a, pa > a ? a / pa : 1); map.offset.set(pa > a ? 0 : (1 - pa / a) * .1, pa > a ? (1 - a / pa) * .3 : 0); }
    }
  }
  const TILT = 19 * Math.PI / 180;   // flat things lie on the desk: their top edge leans away from the camera
  const CORN = [[-.5, .5], [.5, .5], [.5, -.5], [-.5, -.5]];
  /* the CSS matrix that squeezes an element (w x h, origin top-left) onto the projected quad of a 3D plane */
  function quadMatrix(P, w, h){
    const [x0, y0] = P[0], [x1, y1] = P[1], [x2, y2] = P[2], [x3, y3] = P[3];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    let a, b, c = x0, d, e, f = y0, g = 0, hh = 0;
    const den = dx1 * dy2 - dx2 * dy1;
    if ((Math.abs(dx3) < 1e-6 && Math.abs(dy3) < 1e-6) || Math.abs(den) < 1e-9) { a = x1 - x0; b = x3 - x0; d = y1 - y0; e = y3 - y0; }
    else { g = (dx3 * dy2 - dx2 * dy3) / den; hh = (dx1 * dy3 - dx3 * dy1) / den; a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; }
    const n = v => v.toFixed(5);
    return `matrix3d(${n(a / w)},${n(d / w)},0,${n(g / w)},${n(b / h)},${n(e / h)},0,${n(hh / h)},0,0,1,0,${c.toFixed(2)},${f.toFixed(2)},0,1)`;
  }
  const tmpV = () => (tmpV.v = tmpV.v || new THREE.Vector3());
  function placeFx(m, x, y, z, rotZ, tilt, w, h, op){
    m.position.set(x, y, z); m.rotation.set(tilt, 0, rotZ); m.scale.set(w, h, 1); m.material.opacity = op;
  }
  function placeAll(now){
    const s = st; if (!s || !s.items || !s.W) return;
    const wob = wobbleAt ? Math.max(0, 1 - (now - wobbleAt) / 900) : 0;
    const wobRot = wob ? Math.sin((now - wobbleAt) / 55) * wob * wob * 9 : 0;
    const v = tmpV();
    const tr = s.items.tray;   // the tray's front lip hides the bottom of the card standing in it
    if (tr) { const lift = tr.lift, pr = tr.press; s.clipPlane.constant = -((s.H / 2 - tr.cy) + lift * 9 * s.k - tr.h * pr * .07); }
    let sigh = 0;
    if (sighAt && !reduced()) { const q = (now - sighAt) / 1500; if (q >= 0 && q <= 1) sigh = Math.sin(q * Math.PI) * Math.sin(q * Math.PI * 2 + .6) * .5 + Math.sin(q * Math.PI) * .5; }
    stage.style.setProperty('--sx', clamp(cur.x).toFixed(3)); stage.style.setProperty('--sy', clamp(cur.y).toFixed(3));
    for (const k in s.items) {
      const it = s.items[k], p = it.p; if (!it.cx) continue;
      const host = p.host && s.items[p.host];
      const pr = it.press * (host ? host.press : 1), lift = (it.lift + (host ? host.lift : 0)) * (reduced() ? 0 : 1), rot = p.rot + (k === 'cup' ? wobRot : 0);
      const sg = k === 'gavel' ? sigh : 0;   // Gavel's small sigh: squashes a touch and settles, bottom edge fixed
      const wx = it.cx - s.W / 2, wy = s.H / 2 - it.cy + lift * 9 * s.k - it.h * .5 * .022 * sg, zz = p.z + lift * 18, sx = pr * (1 + .045 * lift) * (1 - .011 * sg);
      const tilt = -TILT * (p.fl || 0), rz = rot * Math.PI / 180, o = it.mesh || it.o3;
      const sw = it.w * sx * (1 + .012 * sg), sh = it.h * sx * (1 - .012 * sg);
      o.position.set(wx, wy, zz); o.rotation.set(tilt, 0, rz); o.scale.set(sw, sh, 1); o.updateMatrix();
      const fx = it.fx;
      if (fx) {
        if (p.fl) {
          const off = (7 + 10 * lift) * s.k, L = 1 + .35 * lift, th = (p.th || 3) * s.k * sx;
          const c = fx.cast, t = fx.tight, e = fx.edge;
          placeFx(c, wx + off * .85, wy - off * 1.25 - lift * 9 * s.k, p.z - 14, rz, tilt, sw * c.userData.padW * (1 + .03 * lift), sh * c.userData.padH * (1 + .03 * lift), c.userData.op * L);
          placeFx(t, wx + 1.5 * s.k, wy - (2.5 + 5 * lift) * s.k, p.z - 13, rz, tilt, sw * t.userData.padW, sh * t.userData.padH, t.userData.op * (1 + .2 * lift));
          placeFx(e, wx + th * .15, wy - th, p.z - 12, rz, tilt, sw * e.userData.padW, sh * e.userData.padH, p.ang ? 0 : 1);
        } else {
          const c = fx.cast, q = fx.contact, f = sw / c.userData.W, base = wy - sh / 2, left = wx - sw / 2, u = c.userData;
          placeFx(c, left + u.cw * f / 2 - u.pad * f, base - u.ch * f / 2 + u.pad * f - lift * 4 * s.k, p.z - 14, 0, 0, u.cw * f, u.ch * f, u.op * (1 + .3 * lift));
          placeFx(q, wx, base + sh * .015 - lift * 3 * s.k, p.z - 13, 0, 0, sw * .96, Math.max(10 * s.k, sh * .13), q.userData.op);
        }
      }
      // overlay: the element is squeezed onto the projected corners of its plane (real perspective, so the text lies on the object)
      const el = s.els && s.els[k];
      if (el) {
        const P = CORN.map(([cx, cy]) => { v.set(cx, cy, 0).applyMatrix4(o.matrix).project(s.camera); return [(v.x + 1) / 2 * s.W, (1 - v.y) / 2 * s.H]; });
        el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
        el.style.transform = quadMatrix(P, it.w, it.h);
        if (it.dom) el.style.setProperty('--lift', lift.toFixed(3));
      }
    }
    return wob > 0;
  }

  /* ---------- loop: runs only while something moves ---------- */
  function target(){
    if (lean) return lean;
    let x = tilt.x + mouse.x, y = tilt.y + mouse.y;
    if (Math.abs(x) + Math.abs(y) < .03) { const n = performance.now(); x += .11 * Math.sin(n / 7300); y += .07 * Math.sin(n / 10900 + 1); }   // very slow idle drift when nothing steers the camera
    return { x:clamp(x), y:clamp(y) };
  }
  function frame(now){
    raf = 0;
    const s = st; if (!s || !stage || document.hidden) return;
    const idle = !reduced();
    if (idle && !lastBusy && !dirty && now - lastT < 30) { raf = requestAnimationFrame(frame); return; }   // idle life runs at ~30 fps
    if (idle && (!sighAt || now > sighAt + 1600)) sighAt = now + 6000 + Math.random() * 6000;
    const dt = Math.min(2, Math.max(.35, (now - lastT) / 16.667)); lastT = now;
    const t = reduced() ? { x:0, y:0 } : target();
    cur.vx = (cur.vx + (t.x - cur.x) * .09 * dt) * Math.pow(.78, dt); cur.x += cur.vx * dt;
    cur.vy = (cur.vy + (t.y - cur.y) * .09 * dt) * Math.pow(.78, dt); cur.y += cur.vy * dt;
    let moving = Math.abs(t.x - cur.x) + Math.abs(t.y - cur.y) > .002 || Math.abs(cur.vx) + Math.abs(cur.vy) > .0015;
    for (const k in s.items) {   // press springs and hover lift
      const it = s.items[k], want = it.pressed ? .93 : 1;
      if (Math.abs(want - it.press) > .001 || Math.abs(it.pv) > .001) {
        it.pv = (it.pv + (want - it.press) * .22 * dt) * Math.pow(.62, dt); it.press += it.pv * dt; moving = true;
      } else it.press = want;
      const lw = it.hov ? 1 : 0;
      if (Math.abs(lw - it.lift) > .004) { it.lift += (lw - it.lift) * Math.min(1, .26 * dt); moving = true; } else it.lift = lw;
    }
    lastBusy = moving || dirty;
    if (moving || dirty || idle) {
      if (!size()) { dirty = false; return; }
      aim(); const wob = placeAll(now); s.renderer.render(s.scene, s.camera); dirty = false;
      if (wob) moving = true;
    }
    if (moving || idle) kick(true);
  }
  function kick(inLoop){
    if (raf || !st || !stage || document.hidden) return;
    if (!inLoop) lastT = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- taps and hovers ---------- */
  function press(k, on){
    const it = st && st.items && st.items[k]; if (!it) return; it.pressed = on; dirty = true; kick();
  }
  function setHover(k){
    if (k === hov || !st || !st.items) return;
    hov = k; for (const n in st.items) st.items[n].hov = n === k;
    dirty = true; kick();
  }
  function tap(k){
    if (busy) return;
    const d = deskData(), it = st && st.items[k], act = ACTIONS[k]; if (!act) return;
    if (LEAN_ONLY[k] || reduced() || !it) { act(d); return; }
    busy = true;
    const s = st; lean = { x:clamp((it.cx - s.W / 2) / (s.W / 2)) * .9, y:clamp((it.cy - s.H / 2) / (s.H / 2)) * .9 }; dirty = true; kick();
    setTimeout(() => { busy = false; lean = null; try { act(d); } finally { dirty = true; kick(); } }, 250);
  }
  function wire(ui){
    ui.addEventListener('pointerdown', e => { const b = e.target.closest('.dk-btn'); if (b) press(b.dataset.k, true); });
    const up = e => { st && st.items && Object.keys(st.items).forEach(k => { if (st.items[k].pressed) press(k, false); }); };
    ui.addEventListener('pointerup', up); ui.addEventListener('pointercancel', up); ui.addEventListener('pointerleave', up);
    ui.addEventListener('click', e => { const b = e.target.closest('.dk-btn'); if (b && b.getAttribute('aria-disabled') !== 'true') tap(b.dataset.k); });
    // hover (mouse only) and keyboard focus lift the same way
    const btnOf = e => { const b = e.target.closest && e.target.closest('.dk-btn'); return b && b.getAttribute('aria-disabled') !== 'true' ? b.dataset.k : null; };
    ui.addEventListener('pointerover', e => { if (e.pointerType === 'mouse') setHover(btnOf(e)); });
    ui.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setHover(null); });
    ui.addEventListener('focusin', e => { const b = e.target.closest && e.target.closest('.dk-btn'); if (b && b.matches(':focus-visible')) setHover(b.dataset.k); });
    ui.addEventListener('focusout', () => setHover(null));
  }

  /* ---------- phone (< 900 px): the owner's painted desk as one backdrop, no WebGL ----------
     art/desk_scene_s1.webp is new-art/desk-angled/desk-scene-blank-v1.webp (1024 x 1536, all writing blank) with the painted app
     header (rows 0-107) and tab bar (rows 1429-1535) cropped off. CROP RECORD: x 0..1024, y 108..1428 -> 1024 x 1320 (Y0 = 108).
     Every overlay below is placed in the ORIGINAL picture's pixels (the same coordinates as the mockup
     new-art/desk-angled/angled-desk-scene-v2.webp) inside a wrapper shifted up by Y0, and the whole scene is one element scaled
     as a unit, so text, buttons and the painting stay glued together at every phone size. Text is live DOM text (sharp). */
  const SC = { src:'art/desk_scene_s1.webp', W:1024, H:1320, Y0:108 };
  const SERIES_LINES = { 1:['COURT TERMS', '& CLERK SKILLS'], 2:['COURT RULES', '& PROCEDURE'], 3:['CIVIL', 'PRACTICE'], 4:['CRIMINAL', 'PROCEDURE'], 5:['PENAL', 'LAW'], 6:['LOOK-ALIKE', 'RULES'], 7:['FAMILY', 'COURT'] };
  const polyCss = pts => 'polygon(' + pts.map(([x, y]) => x + 'px ' + y + 'px').join(',') + ')';
  const POLY = {
    folder:[[280, 458], [745, 486], [868, 540], [955, 905], [700, 952], [200, 812]],
    books:[[0, 306], [170, 345], [218, 510], [218, 640], [40, 672], [0, 668]],
    gavel:[[196, 330], [290, 218], [350, 150], [470, 150], [522, 250], [572, 345], [510, 412], [380, 445], [190, 432]],
    deck:[[708, 98], [996, 138], [992, 330], [948, 505], [684, 458]],
    cup:[[913, 505], [1024, 498], [1024, 725], [935, 705], [913, 640]],
    pack:[[8, 872], [248, 812], [348, 1184], [86, 1228]],
    tray:[[380, 1000], [606, 1000], [652, 1140], [654, 1290], [560, 1368], [322, 1290], [316, 1090]],
    clip:[[700, 910], [795, 884], [930, 886], [1020, 962], [958, 1420], [850, 1404], [612, 1298]],
  };
  const LIP = [[300, 1196], [356, 1190], [590, 1236], [664, 1246], [664, 1384], [300, 1384]];   // the tray's front lip (below the top cream tab)
  let pst = null, pp = { x:0, y:0, vx:0, vy:0 }, ptgt = { x:0, y:0 }, praf = 0, pbusy = false;

  function deckSeriesN(d){
    try {
      const sn = c => c && !c.trickType ? (c.series || 1) : 0;
      if (sn(d.next)) return sn(d.next);
      const mine = CARDS.filter(c => owned(c) && sn(c)).sort((a, b) => ((S.cards[b.id] || {}).last || 0) - ((S.cards[a.id] || {}).last || 0))[0];
      if (mine) return sn(mine);
    } catch (_) {}
    return 1;
  }
  function pDots(list, cls){ return list.map(on => `<em class="${on ? 'on' : ''}"></em>`).join(''); }
  function pBtn(k, key, d, inner, o){
    o = o || {}; const [ox, oy] = o.c || [0, 0];
    return `<button type="button" class="dk-pb dkb-${key}" data-k="${k}" aria-label="${esc2(o.aria != null ? o.aria : ariaFor(k, d))}"${o.hide ? ' tabindex="-1" aria-hidden="true"' : ''} style="clip-path:${polyCss(POLY[key])};--ox:${ox}px;--oy:${oy}px">${inner}<span class="dk-hl"></span></button>`;
  }
  function phoneHtml(d){
    const sn = deckSeriesN(d), lines = SERIES_LINES[sn] || SERIES_LINES[1];
    const t = d.hero.title, over = d.packs > 0;
    // folder
    const fold = `<span class="dk-ov"><span class="dk-ftx">
      <span class="fp">${d.total ? `TODAY · ${d.done} OF ${d.total}` : 'TODAY'}<i>${pDots(d.items.map(itemDone))}</i></span>
      <span class="fl" data-fit="330,30,18">${esc2(d.hero.label)}</span>
      <span class="ft" data-fit="392,166,24" data-fs="70">${esc2(t)}</span>
      <span class="fw" data-fit="384,46,20" data-fs="42">${esc2(d.hero.what)}</span></span></span>`;
    const pack = `<span class="dk-ov"><span class="dk-pkr" data-fit="148,26,12" data-fs="23.5">BECOMING A CLERK</span><span class="dk-pkt">${over
      ? `<b class="a" data-fit="150,62,24" data-fs="48"><u>${d.packs}</u> PACK${d.packs > 1 ? 'S' : ''}</b><b class="b" data-fit="150,44,18" data-fs="36">TO OPEN</b>`
      : `<b class="a" data-fit="150,62,24" data-fs="58">STORE</b><b class="b" data-fit="150,44,18" data-fs="30">GET PACKS</b>`}</span></span>`;
    const deck = `<span class="dk-ov"><span class="dk-dr" data-fit="150,24,12" data-fs="18">BECOMING A CLERK</span>
      <span class="dk-dt">${lines.map(l => `<b data-fit="252,52,24" data-fs="56">${esc2(l)}</b>`).join('')}</span>
      <span class="dk-dm"><i>SERIES</i><b>#${sn}</b></span><span class="dk-db" data-fit="170,28,12" data-fs="26">COMPLETE DECK</span></span>`;
    let cardHtml = '';
    try { if (d.next && S.cards[d.next.id] && typeof cardEl === 'function') cardHtml = cardEl(d.next, S.cards[d.next.id]); } catch (_) {}
    if (!cardHtml) cardHtml = `<img class="dk-kit" src="${IMG.paper}" alt="">`;
    const tray = `<span class="dk-ov"><span class="dk-tstack b2"></span><span class="dk-tstack b1"></span><span class="dk-tcard"><span class="dk-cw">${cardHtml}<span class="dk-sheen card"></span></span></span></span>
      <img class="dk-lip" src="${SC.src}" alt="" draggable="false" style="clip-path:${polyCss(LIP.map(([x, y]) => [x, y - SC.Y0]))}">
      <span class="dk-ov"><span class="dk-tl" data-fit="196,40,14" data-fs="38">${d.next ? 'NEXT: ' + esc2(d.next.name) : 'STUDY'}</span></span>`;
    const rows = d.qs.map(({ q, x }, i) => `<span class="dk-qr ${x.done ? 'on' : ''}" style="top:${74 + 80 * i}px"><i>${x.done ? `<img src="${CHECK}" alt="">` : ''}</i><span data-fit="190,66,18" data-fs="31">${esc2(q.label)}</span></span>`).join('');
    const clip = `<span class="dk-ov"><span class="dk-cl"><b class="h" data-fit="236,46,22" data-fs="52">DAILY QUESTS</b><span class="s">${d.qdone} OF ${d.qs.length}<i>${pDots(d.qs.map(r => r.x.done))}</i></span>${rows}</span></span>`;
    const start = `<button type="button" class="dk-pb dk-startb dkb-start" data-k="folder" aria-label="${esc2(ariaFor('folder', d))}"><span class="in"><svg viewBox="0 0 14 16" aria-hidden="true"><path d="M1.5 1v14l12-7z" fill="currentColor"/></svg><b data-fit="${d.it ? 250 : 260},84,26" data-fs="64">${ctaWord(d)}</b></span><span class="dk-hl"></span></button>`;
    return `<div class="dk-par"><div class="dk-shk"><div class="dk-scene" style="width:${SC.W}px;height:${SC.H}px">
      <img class="dk-bg" src="${SC.src}" alt="" draggable="false">
      <div class="dk-w">
        <span class="dk-lamp" aria-hidden="true"></span>
        <span class="dk-motes" aria-hidden="true">${Array.from({ length:6 }, () => '<i></i>').join('')}</span>
        <span class="dk-foil" aria-hidden="true" style="clip-path:${polyCss(POLY.pack)}"></span>
        ${pBtn('folder', 'folder', d, fold, { c:[570, 700], hide:1 })}
        ${pBtn('books', 'books', d, '', { c:[110, 490] })}
        ${pBtn('gavel', 'gavel', d, '', { c:[380, 290] })}
        ${pBtn('deck', 'deck', d, deck, { c:[840, 300] })}
        ${pBtn('cup', 'cup', d, '', { c:[975, 610] })}
        ${pBtn('pack', 'pack', d, pack, { c:[180, 1020] })}
        ${pBtn('tray', 'tray', d, tray, { c:[480, 1190] })}
        ${pBtn('clip', 'clip', d, clip, { c:[820, 1150] })}
        ${start}
        <img class="dk-steam" src="${STEAM}" alt="" aria-hidden="true">
      </div></div></div></div>`;
  }
  function fitText(root){
    root.querySelectorAll('[data-fit]').forEach(el => {
      const [w, h, min] = el.dataset.fit.split(',').map(Number); let fs = +el.dataset.fs || 0;
      if (!fs) fs = parseFloat(getComputedStyle(el).fontSize) || 20;
      el.style.fontSize = fs + 'px';
      for (let i = 0; i < 60 && fs > min && (el.scrollWidth > w + .5 || el.scrollHeight > h + .5); i++) { fs = Math.max(min, fs * .955); el.style.fontSize = fs.toFixed(2) + 'px'; }
    });
  }
  function fitPhone(){
    const p = pst; if (!p || !stage) return;
    const W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
    // show about 910 of the 1024 picture columns and 1180 of its 1320 rows (the folder and the bottom row stay whole); a taller phone
    // gets a soft out-of-focus band of the same picture above and below instead of cropping the props
    const cover = Math.max(W / SC.W, H / SC.H), s = Math.max(Math.min(W / 910, H / 1180), cover * .75);
    const iw = SC.W * s, ih = SC.H * s;
    let x = W / 2 - 520 * s; x = iw <= W ? (W - iw) / 2 : Math.max(W - iw, Math.min(0, x));
    const y = ih >= H ? Math.max(H - ih, Math.min(0, (H - ih) * .5)) : H - ih;
    p.scene.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(5)})`;
    p.scene.style.setProperty('--s', s.toFixed(5));
    { const bw = Math.max(iw, W + 48); p.bd.style.width = bw.toFixed(1) + 'px'; p.bd.style.height = (H + 48) + 'px'; p.bd.style.left = (iw >= W + 48 ? x : (W - bw) / 2).toFixed(1) + 'px'; p.bd.style.top = '0px'; }
    p.info = { s, x, y, W, H };
    const gt = y > .5 ? 'transparent 0,#000 70px,' : '#000 0,', gb = y + ih < H - .5 ? '#000 calc(100% - 70px),transparent 100%' : '#000 100%';
    const mask = (y > .5 || y + ih < H - .5) ? `linear-gradient(180deg,${gt}${gb})` : 'none';
    p.scene.style.webkitMaskImage = p.scene.style.maskImage = mask;
  }
  function pframe(){
    praf = 0; const p = pst; if (!p || document.hidden) return;
    const t = reduced() ? { x:0, y:0 } : ptgt;
    pp.vx = (pp.vx + (t.x - pp.x) * .08) * .8; pp.x += pp.vx; pp.vy = (pp.vy + (t.y - pp.y) * .08) * .8; pp.y += pp.vy;
    const moving = Math.abs(t.x - pp.x) + Math.abs(t.y - pp.y) > .002 || Math.abs(pp.vx) + Math.abs(pp.vy) > .0015;
    p.par.style.transform = moving || Math.abs(pp.x) + Math.abs(pp.y) > .003
      ? `perspective(1000px) translate3d(${(pp.x * 6).toFixed(2)}px,${(pp.y * 4).toFixed(2)}px,0) rotateX(${(-pp.y * .9).toFixed(3)}deg) rotateY(${(pp.x * 1.3).toFixed(3)}deg)` : '';
    if (moving) praf = requestAnimationFrame(pframe);
  }
  function pkick(){ if (!praf && pst && !document.hidden) praf = requestAnimationFrame(pframe); }
  function ptap(k){
    if (pbusy) return;
    const d = deskData();
    if (k === 'cup') {
      const p = pst; if (!p || reduced()) return;
      p.shk.classList.remove('shake'); p.steam.classList.remove('puff'); void p.shk.offsetWidth; p.shk.classList.add('shake'); p.steam.classList.add('puff');
      return;
    }
    const act = ACTIONS[k]; if (!act) return;
    if (reduced()) { act(d); return; }
    pbusy = true; setTimeout(() => { pbusy = false; try { act(d); } catch (e) { console.error(e); } }, 140);
  }
  function wirePhone(ui){
    const clearPress = () => ui.querySelectorAll('.dk-pb.press').forEach(b => b.classList.remove('press'));
    ui.addEventListener('pointerdown', e => { const b = e.target.closest('.dk-pb'); if (b) b.classList.add('press'); });
    ['pointerup', 'pointercancel', 'pointerleave', 'dragstart'].forEach(n => ui.addEventListener(n, clearPress));
    ui.addEventListener('click', e => { const b = e.target.closest('.dk-pb'); if (b) { clearPress(); ptap(b.dataset.k); } });
    ui.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const b = e.target.closest && e.target.closest('.dk-pb'); if (b) b.classList.add('press'); } });
    ui.addEventListener('keyup', clearPress); ui.addEventListener('blur', clearPress, true);
  }
  function syncPhone(el, ticket){
    let d; try { d = deskData(); } catch (e) { return; }
    attachedTo = el; el.classList.add('has-desk');
    stage = document.createElement('div'); stage.className = 'dk-stage dk-phone' + (reduced() ? ' dk-still' : '') + (document.hidden ? ' dk-paused' : '');
    stage.innerHTML = `<img class="dk-bd" src="${SC.src}" alt="" draggable="false"><div class="dk-ui">${phoneHtml(d)}</div>`;
    const ui = stage.querySelector('.dk-ui');
    pst = { bd:stage.querySelector('.dk-bd'), par:stage.querySelector('.dk-par'), shk:stage.querySelector('.dk-shk'), scene:stage.querySelector('.dk-scene'), steam:stage.querySelector('.dk-steam') };
    wirePhone(ui);
    el.insertBefore(stage, el.querySelector('.scr'));
    fitPhone(); fitText(stage);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (pst && stage && stage.isConnected) fitText(stage); });
    if (document.fonts && document.fonts.load) Promise.all(['"Luckiest Guy"', '"Bangers"', '"Patrick Hand"'].map(f => document.fonts.load('30px ' + f).catch(() => {}))).then(() => { if (pst && stage && stage.isConnected) fitText(stage); });
    if (typeof BreakoutMotion === 'object' && BreakoutMotion.onInput && !reduced()) {
      offTilt = BreakoutMotion.onInput((x, y) => { ptgt = { x:clamp(x), y:clamp(y) }; pkick(); });
      BreakoutMotion.watch(true); offWatch = () => BreakoutMotion.watch(false);
      ptgt = { x:clamp(BreakoutMotion.x || 0), y:clamp(BreakoutMotion.y || 0) }; pkick();
    }
  }

  /* ---------- attach to the Today screen ---------- */
  function homeScreen(){
    if (typeof nav === 'undefined' || nav.tab !== 'home' || nav.stacks.home.length !== 1) return null;
    const el = typeof currentScreenEl === 'function' ? currentScreenEl() : null;
    return el && el.querySelector('.td-hero, .today') && el.querySelector('.navbar.homebar') ? el : null;
  }
  function detach(keepSt){
    if (offTilt) offTilt(); if (offWatch) offWatch(); offTilt = offWatch = null;
    if (attachedTo) attachedTo.classList.remove('has-desk');
    if (stage) stage.remove();
    if (st) { st.canvas.remove(); st.els = null; }
    if (praf) cancelAnimationFrame(praf); praf = 0; pst = null; pp = { x:0, y:0, vx:0, vy:0 }; ptgt = { x:0, y:0 }; pbusy = false;
    attachedTo = null; stage = null; lean = null; busy = false; hov = null;
    tilt = { x:0, y:0 }; mouse = { x:0, y:0 }; cur = { x:0, y:0, vx:0, vy:0 };
    if (st && st.items) for (const n in st.items) st.items[n].hov = false;
    if (raf) cancelAnimationFrame(raf); raf = 0;
  }
  let syncing = 0;
  async function sync(){
    const ticket = ++syncing, el = on ? homeScreen() : null;
    if (!el) { detach(); return; }
    if (typeof todayHeroText !== 'function') return;   // today.js missing: leave the normal list alone
    detach();
    if (innerWidth < 900) { syncPhone(el, ticket); return; }
    try { await ensure(); } catch (e) { return; }   // three.js missing: no desk, nothing else changes
    if (ticket !== syncing || !st || !el.isConnected) return;
    let d; try { d = deskData(); } catch (e) { return; }
    attachedTo = el; el.classList.add('has-desk');
    stage = document.createElement('div'); stage.className = 'dk-stage' + (st.desk ? ' dk-wide' : '');
    const { ui, els } = buildOverlay(d, st.props); st.els = els; wire(ui);
    stage.appendChild(st.canvas); stage.appendChild(ui);
    el.insertBefore(stage, el.querySelector('.scr'));
    st.W = st.H = 0; size();
    if (typeof BreakoutMotion === 'object' && BreakoutMotion.onInput && !reduced() && !st.desk) {
      offTilt = BreakoutMotion.onInput((x, y) => { tilt = { x, y }; dirty = true; kick(); });
      BreakoutMotion.watch(true); offWatch = () => BreakoutMotion.watch(false);
      tilt = { x:BreakoutMotion.x, y:BreakoutMotion.y };
    }
    trayKey = ''; await updateCards(d);
    if (ticket !== syncing || attachedTo !== el) return;
    dirty = true; kick();
  }

  // mouse parallax over the desk (hover only; taps and scrolls are untouched)
  const fine = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);
  if (fine) document.addEventListener('pointermove', e => {
    if (!st || !stage || reduced() || lean) return;
    const r = stage.getBoundingClientRect();
    const over = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
    mouse = over ? { x:clamp((e.clientX - r.left) / r.width * 2 - 1), y:clamp((e.clientY - r.top) / r.height * 2 - 1) } : { x:0, y:0 };
    dirty = true; kick();
  }, { passive:true });
  // the first touch on the desk asks iOS Safari for motion permission (BreakoutMotion keeps the answer)
  document.addEventListener('pointerdown', e => {
    if (attachedTo && e.target.closest && e.target.closest('.screen.has-desk') && typeof BreakoutMotion === 'object' && BreakoutMotion.enableOrientation) BreakoutMotion.enableOrientation();
  }, { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (pst && stage) { stage.classList.toggle('dk-paused', document.hidden); if (!document.hidden) pkick(); }
    if (!document.hidden) { dirty = true; kick(); }
  });
  addEventListener('resize', () => {
    if (pst && stage) { if (innerWidth >= 900) { detach(); sync(); } else fitPhone(); return; }
    if (!st || !stage) return;
    if ((innerWidth >= 900) !== st.desk) { dispose(); sync(); return; }   // phone <-> computer: rebuild the other layout
    st.W = st.H = 0; dirty = true; kick();
  });

  if (on) {
    const css = document.createElement('style');
    css.textContent = `
.screen.has-desk .scr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;padding:0}
.dk-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:#3a200e;touch-action:manipulation;--u:1px}
.dk-canvas{position:absolute;left:0;top:0;display:block}
.dk-ui{position:absolute;inset:0;overflow:hidden}
.dk-warm{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(58% 34% at 14% 7%,rgba(255,200,110,.32),rgba(255,160,50,.06) 55%,transparent 80%)}
.dk-wide .dk-warm{background:radial-gradient(48% 62% at 7% 8%,rgba(255,205,110,.5),rgba(255,160,50,.16) 50%,transparent 80%)}
.dk-haze{position:absolute;inset:0 0 auto 0;height:34%;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(40,18,6,.42),rgba(60,30,10,.18) 45%,transparent)}
.dk-sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(112deg,transparent 30%,rgba(255,255,255,.5) 44%,rgba(255,243,205,.14) 53%,transparent 66%) calc(50% + var(--sx,0)*55%) calc(50% + var(--sy,0)*20%)/280% 160% no-repeat;opacity:.5;-webkit-mask-size:100% 100%;mask-size:100% 100%}
.dk-sheen.foil{opacity:.85}.dk-sheen.board{opacity:.3}
.dk-sheen.card{border-radius:7% / 5%;opacity:.55}
.dk-vig{position:absolute;inset:0;pointer-events:none;z-index:90;background:radial-gradient(110% 80% at 30% 30%,transparent 45%,rgba(12,4,0,.2) 80%,rgba(8,3,0,.4))}
.dk-o{position:absolute;left:0;top:0;margin:0;padding:0;border:0;background:none;color:#1d1a16;transform-origin:0 0;will-change:transform;font-family:"Patrick Hand",cursive;text-align:left;-webkit-tap-highlight-color:transparent;overflow:visible}
.dk-btn{cursor:pointer;display:block;touch-action:manipulation}
.dk-btn[aria-disabled=true]{cursor:default}
.dk-btn::before{content:"";position:absolute;inset:calc(var(--u)*-8)}
.dk-btn:focus{outline:none}
.dk-btn:focus-visible::after{content:"";position:absolute;inset:calc(var(--u)*-6);border:3px solid #ffd447;border-radius:calc(var(--u)*16);box-shadow:0 0 0 2px #1d1a16}
.dk-deco{pointer-events:none}
.dk-glow{position:absolute;left:30%;top:0%;width:80%;height:50%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,120,.8),rgba(255,170,60,.3) 55%,transparent);mix-blend-mode:screen;opacity:.5;animation:dkGlow 5.2s ease-in-out infinite}
@keyframes dkGlow{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:.9;transform:scale(1.05)}}
.dk-steam{position:absolute;left:14%;bottom:78%;width:34%;pointer-events:none;opacity:0;transform-origin:50% 100%;animation:dkSteam 4.4s ease-out infinite;filter:drop-shadow(0 0 2px rgba(255,255,255,.4))}
@keyframes dkSteam{0%{opacity:0;transform:translate(0,18%) rotate(-3deg) scale(.7,.7)}22%{opacity:.8}50%{transform:translate(9%,-8%) rotate(5deg) scale(.95,1.05)}78%{opacity:.4;transform:translate(-6%,-22%) rotate(-6deg) scale(1.1,1.15)}100%{opacity:0;transform:translate(4%,-34%) rotate(4deg) scale(1.2,1.25)}}
.dk-warm{animation:dkFlick 7.3s linear infinite}
@keyframes dkFlick{0%,100%{opacity:1}12%{opacity:.93}19%{opacity:.98}33%{opacity:.9}41%{opacity:.97}58%{opacity:.92}71%{opacity:1}84%{opacity:.94}}
.dk-motes{position:absolute;left:4%;top:9%;width:42%;height:34%;pointer-events:none;z-index:3}
.dk-wide .dk-motes{left:1%;top:12%;width:22%;height:40%}
.dk-mote{position:absolute;width:3px;height:3px;border-radius:50%;background:rgba(255,236,170,.9);box-shadow:0 0 4px rgba(255,220,130,.8);opacity:0;animation:dkMote 14s ease-in-out infinite}
.dk-mote:nth-child(1){left:22%;top:20%;animation-delay:0s}.dk-mote:nth-child(2){left:48%;top:46%;animation-delay:-3s;animation-duration:17s}.dk-mote:nth-child(3){left:70%;top:28%;animation-delay:-6s}
.dk-mote:nth-child(4){left:36%;top:68%;animation-delay:-9s;animation-duration:19s}.dk-mote:nth-child(5){left:58%;top:12%;animation-delay:-11s;width:2px;height:2px}.dk-mote:nth-child(6){left:14%;top:52%;animation-delay:-5s;animation-duration:16s;width:2px;height:2px}.dk-mote:nth-child(7){left:82%;top:60%;animation-delay:-13s}
@keyframes dkMote{0%{opacity:0;transform:translate(0,0)}15%{opacity:.8}50%{opacity:.5;transform:translate(14px,-20px)}85%{opacity:.7}100%{opacity:0;transform:translate(-8px,-38px)}}
.dk-lid{position:absolute;width:13.8%;height:14%;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#e0701a,#c25410);box-shadow:0 0 0 1.5px #3a1706;transform-origin:50% 0;opacity:0;animation:dkBlink 6.4s infinite;pointer-events:none}
@keyframes dkBlink{0%,93%{opacity:0}94%{opacity:1}97%{opacity:1}98.5%,100%{opacity:0}}
html.cq-reduce-motion .dk-glow,html.cq-reduce-motion .dk-steam,html.cq-reduce-motion .dk-warm,html.cq-reduce-motion .dk-mote,html.cq-reduce-motion .dk-lid{animation:none}
html.cq-reduce-motion .dk-motes,html.cq-reduce-motion .dk-lid{display:none}
html.cq-reduce-motion .dk-steam{opacity:.6;transform:none}
@media (prefers-reduced-motion:reduce){.dk-glow,.dk-steam,.dk-warm,.dk-mote,.dk-lid{animation:none}.dk-motes,.dk-lid{display:none}.dk-steam{opacity:.6;transform:none}}
/* phone: the painted scene (one picture) and the live text laid over it in the picture's own pixels */
.dk-phone{background:#1b0e05}
.dk-bd{position:absolute;left:0;top:0;max-width:none;pointer-events:none;filter:blur(14px) brightness(.62) saturate(.9)}
.dk-phone .dk-ui{touch-action:manipulation}
.dk-par{position:absolute;inset:0;transform-origin:50% 50%}
.dk-shk{position:absolute;inset:0;transform-origin:78% 40%}
.dk-scene{position:absolute;left:0;top:0;transform-origin:0 0;overflow:hidden}
.dk-bg{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;user-select:none}
.dk-w{position:absolute;left:0;top:-108px;width:1024px;height:1536px}
.dk-w :where(span,b,i,u){display:block;font-style:normal;text-decoration:none;font-weight:400}
.dk-lamp{position:absolute;left:0;top:0;width:520px;height:420px;pointer-events:none;background:radial-gradient(ellipse 250px 190px at 175px 165px,rgba(255,206,110,.55),rgba(255,170,60,.16) 55%,transparent 80%);mix-blend-mode:screen;animation:dkLamp 7.3s linear infinite}
@keyframes dkLamp{0%,100%{opacity:1}12%{opacity:.78}19%{opacity:.94}33%{opacity:.7}41%{opacity:.9}58%{opacity:.74}71%{opacity:1}84%{opacity:.82}}
.dk-motes{position:absolute;left:30px;top:150px;width:380px;height:290px;pointer-events:none}
.dk-motes i{position:absolute;width:6px;height:6px;border-radius:50%;background:rgba(255,236,170,.9);box-shadow:0 0 8px rgba(255,220,130,.8);opacity:0;animation:dkMoteP 14s ease-in-out infinite}
.dk-motes i:nth-child(1){left:22%;top:30%}.dk-motes i:nth-child(2){left:48%;top:56%;animation-delay:-3s;animation-duration:17s}.dk-motes i:nth-child(3){left:70%;top:34%;animation-delay:-6s}
.dk-motes i:nth-child(4){left:36%;top:72%;animation-delay:-9s;animation-duration:19s}.dk-motes i:nth-child(5){left:58%;top:18%;animation-delay:-11s;width:4px;height:4px}.dk-motes i:nth-child(6){left:14%;top:60%;animation-delay:-5s;animation-duration:16s;width:4px;height:4px}
@keyframes dkMoteP{0%{opacity:0;transform:translate(0,0)}15%{opacity:.8}50%{opacity:.5;transform:translate(26px,-34px)}85%{opacity:.7}100%{opacity:0;transform:translate(-14px,-70px)}}
.dk-foil{position:absolute;left:0;top:0;width:1024px;height:1536px;pointer-events:none;background:linear-gradient(112deg,transparent 36%,rgba(255,255,255,.55) 47%,rgba(255,243,205,.18) 54%,transparent 64%) 0 0/360px 100% no-repeat;background-position:-360px 0;mix-blend-mode:soft-light;animation:dkFoil 6.5s ease-in-out infinite}
@keyframes dkFoil{0%,25%{background-position:-380px 0}75%,100%{background-position:420px 0}}
.dk-steam{position:absolute;left:935px;top:318px;width:96px;pointer-events:none;opacity:0;transform-origin:50% 100%;animation:dkSteamP 4.6s ease-out infinite;filter:drop-shadow(0 0 3px rgba(255,255,255,.4))}
@keyframes dkSteamP{0%{opacity:0;transform:translate(0,18%) rotate(-3deg) scale(.7)}22%{opacity:.7}50%{transform:translate(9%,-6%) rotate(5deg) scale(.95,1.05)}78%{opacity:.35;transform:translate(-6%,-16%) rotate(-6deg) scale(1.08,1.12)}100%{opacity:0;transform:translate(4%,-26%) rotate(4deg) scale(1.15,1.2)}}
.dk-steam.puff{animation:dkPuff 1.3s ease-out 1}
@keyframes dkPuff{0%{opacity:0;transform:scale(.6)}25%{opacity:.95;transform:translate(6%,-4%) scale(1.05,1.15)}100%{opacity:0;transform:translate(-4%,-34%) rotate(-8deg) scale(1.35,1.5)}}
.dk-shk.shake{animation:dkShake .7s ease-out 1}
@keyframes dkShake{0%{transform:rotate(0)}15%{transform:rotate(.7deg)}35%{transform:rotate(-.6deg)}55%{transform:rotate(.35deg)}75%{transform:rotate(-.15deg)}100%{transform:rotate(0)}}
.dk-pb{position:absolute;left:0;top:0;width:1024px;height:1536px;margin:0;padding:0;border:0;background:none;display:block;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;color:#1d1a16;font-family:"Patrick Hand",cursive;text-align:left;overflow:visible}
.dk-pb:focus{outline:none}
.dk-ov{position:absolute;left:0;top:0;width:1024px;height:1536px;pointer-events:none;transform-origin:var(--ox) var(--oy);transition:transform .12s ease-out}
.dk-hl{position:absolute;left:0;top:0;width:1024px;height:1536px;pointer-events:none;opacity:0;transition:opacity .12s;background:radial-gradient(circle 300px at var(--ox) var(--oy),rgba(255,226,150,.55),rgba(255,200,110,.2) 55%,transparent 75%);mix-blend-mode:screen}
.dk-pb.press .dk-hl,.dk-pb:focus-visible .dk-hl{opacity:1}
.dk-pb.press .dk-ov{transform:scale(.97)}
.dk-still .dk-pb.press .dk-ov{transform:none}
.dk-ftx{position:absolute;left:318px;top:486px;width:392px;height:260px;transform-origin:0 0;transform:rotate(3.3deg)}
.dk-ftx .fp{position:absolute;left:0;top:0;display:flex;align-items:center;gap:16px;font:400 34px/1 "Bangers";letter-spacing:.07em;white-space:nowrap;color:#1d1a16}
.dk-ftx .fp i{display:flex;gap:12px;margin-left:2px}
.dk-ftx .fp em{width:26px;height:26px;border-radius:50%;background:rgba(29,26,22,.3)}.dk-ftx .fp em.on{background:#2f8a4a}
.dk-ftx .fl{position:absolute;left:0;top:35px;width:330px;font:400 29px/1 "Bangers";letter-spacing:.07em;color:#cf9317;white-space:nowrap}
.dk-ftx .ft{position:absolute;left:-4px;top:60px;width:392px;font:400 70px/1.03 "Luckiest Guy";letter-spacing:.005em;color:#1d1a16;transform:scaleY(1.15);transform-origin:0 0}
.dk-ftx .fw{position:absolute;left:-8px;top:216px;width:384px;font:400 42px/1.05 "Patrick Hand";color:#1d1a16}
.dk-startb{left:300px;top:757px;width:358px;height:98px;transform-origin:0 0;transform:rotate(3.4deg)}
.dk-startb .in{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:20px;border-radius:44px;color:#fff4d6;background:linear-gradient(180deg,#f2433b 0,#dc2a26 45%,#bd1d1c 100%);box-shadow:0 0 0 5px #e2a62a,0 0 0 9px #3a1706,0 6px 0 9px rgba(58,23,6,.5),inset 0 7px 0 rgba(255,255,255,.28),inset 0 -8px 0 rgba(120,10,10,.35);transition:transform .12s ease-out}
.dk-startb .in svg{width:42px;height:48px;flex:none;filter:drop-shadow(0 3px 0 rgba(90,10,10,.5))}
.dk-startb .in b{font:400 64px/1 "Luckiest Guy";letter-spacing:.04em;white-space:nowrap;-webkit-text-stroke:3px #7d0f0c;paint-order:stroke fill;text-shadow:0 4px 0 rgba(90,10,10,.5)}
.dk-startb .dk-hl{left:-300px;top:-300px;width:985px;height:724px;border-radius:44px;background:radial-gradient(ellipse 230px 90px at 492px 362px,rgba(255,230,160,.6),transparent 80%)}
.dk-startb.press .in{transform:scale(.95)}
.dk-startb:focus-visible .in{box-shadow:0 0 0 6px #ffd447,0 0 0 11px #1d1a16}
.dk-still .dk-startb.press .in{transform:none}
.dk-pkr{position:absolute;left:166px;top:937px;width:140px;transform:translate(-50%,-50%) rotate(-14deg);text-align:center;font:400 23.5px/1 "Bangers";letter-spacing:.06em;color:#f8e9bb;text-shadow:0 2px 0 rgba(90,16,10,.7);white-space:nowrap}
.dk-pkt{position:absolute;left:182px;top:1003px;width:150px;transform:translate(-50%,-50%) rotate(-14.5deg);text-align:center;color:#1d1a16}
.dk-pkt b{font:400 48px/.95 "Luckiest Guy";white-space:nowrap}.dk-pkt b.b{font-size:36px;margin-top:3px}
.dk-pkt u{display:inline}
.dk-dr{position:absolute;left:834px;top:207px;width:150px;transform:translate(-50%,-50%) rotate(4.2deg);text-align:center;font:400 18px/1 "Bangers";letter-spacing:.05em;color:#1d1a16;white-space:nowrap}
.dk-dt{position:absolute;left:833px;top:266px;width:276px;transform:translate(-50%,-50%) rotate(6.4deg);text-align:center}
.dk-dt b{font:400 56px/50px "Bangers";letter-spacing:.015em;white-space:nowrap;width:max-content;height:50px;margin:0 auto;transform:scale(.8,1.1);color:#d92a1e;-webkit-text-stroke:3px #1b0a06;paint-order:stroke fill;text-shadow:2px 3px 0 #1b0a06}
.dk-dm{position:absolute;left:923px;top:350px;width:70px;transform:translate(-50%,-50%) rotate(-8deg);text-align:center;color:#5b2308}
.dk-dm i{font:400 14px/1 "Bangers";letter-spacing:.06em}.dk-dm b{font:400 34px/.9 "Bangers"}
.dk-db{position:absolute;left:818px;top:468px;width:170px;transform:translate(-50%,-50%) rotate(6.5deg);text-align:center;font:400 26px/1 "Bangers";letter-spacing:.04em;color:#14234d;white-space:nowrap}
.dk-tstack{z-index:0;position:absolute;width:194px;height:272px;border-radius:14px;background:#efe3c3;border:3px solid #6b5436;transform-origin:0 0}
.dk-tstack.b1{left:402px;top:1008px;transform:rotate(6deg) translate(8px,-6px)}
.dk-tstack.b2{left:402px;top:1008px;transform:rotate(6deg) translate(15px,-12px);filter:brightness(.92)}
.dk-tcard{z-index:0;position:absolute;left:402px;top:1008px;width:194px;height:272px;transform-origin:0 0;transform:rotate(6deg)}
.dk-tcard .dk-cw .card{filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}
.dk-lip{z-index:1;position:absolute;left:0;top:108px;width:1024px;height:1320px;max-width:none;pointer-events:none}
.dk-tl{z-index:2;position:absolute;left:472px;top:1260px;width:196px;transform:translate(-50%,-50%) rotate(14deg);text-align:center;font:400 38px/1 "Bangers";letter-spacing:.03em;color:#1d1a16;white-space:nowrap}
.dk-cl{position:absolute;left:738px;top:945px;width:270px;height:360px;transform-origin:0 0;transform:rotate(11.5deg)}
.dk-cl .h{position:absolute;left:4px;top:0;width:236px;font:400 52px/1 "Bangers";letter-spacing:.03em;white-space:nowrap;color:#1d1a16}
.dk-cl .s{position:absolute;left:4px;top:46px;display:flex;align-items:center;gap:14px;font:400 32px/1 "Bangers";letter-spacing:.06em;color:#1d1a16}
.dk-cl .s i{display:flex;gap:12px}.dk-cl .s em{width:28px;height:28px;border-radius:50%;border:3px solid rgba(29,26,22,.45)}.dk-cl .s em.on{background:#2f8a4a;border-color:#2f8a4a}
.dk-qr{position:absolute;left:0;width:262px;height:80px;display:flex;align-items:center;gap:16px;border-top:3px solid rgba(70,50,30,.28)}
.dk-qr i{flex:none;width:42px;height:42px;margin-left:2px;border:4px solid #2a2118;border-radius:50%;position:relative}
.dk-qr.on i{border:0}.dk-qr i img{position:absolute;inset:-9px;width:calc(100% + 18px);height:calc(100% + 18px)}
.dk-qr span{width:190px;font:400 31px/1 "Patrick Hand";color:#1d1a16}
.dk-qr.on span{opacity:.6}
.dk-phone .dk-cw{position:absolute;inset:0;display:block;pointer-events:none}
.dk-phone .dk-cw .card{width:100%;height:100%;aspect-ratio:auto}
.dk-phone .dk-kit{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dk-paused *{animation-play-state:paused !important}
.dk-still .dk-lamp,.dk-still .dk-motes,.dk-still .dk-foil,.dk-still .dk-steam{display:none}
html.cq-reduce-motion .dk-lamp,html.cq-reduce-motion .dk-motes,html.cq-reduce-motion .dk-foil,html.cq-reduce-motion .dk-steam{display:none}
@media (prefers-reduced-motion:reduce){.dk-lamp,.dk-motes,.dk-foil,.dk-steam{display:none}}
/* the game's real cards on the folder and in the tray */
.dk-cw{position:absolute;inset:0;display:block;pointer-events:none}
.dk-cw .card{width:100%;height:100%;aspect-ratio:auto;filter:drop-shadow(0 calc(var(--u)*1.5) calc(var(--u)*2) rgba(0,0,0,.45))}
.dk-kit{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dk-cw .dk-sheen{border-radius:5% / 3.5%}
.dk-trayfront{position:absolute;inset:0;width:100%;height:100%;clip-path:inset(54% 0 0 0);pointer-events:none}
.dk-pocket{position:absolute;inset:0;width:100%;height:100%;clip-path:polygon(73.3% 23.6%,95.8% 20.5%,100% 20.5%,100% 100%,69% 100%,69% 59.5%,72% 57%,75% 54.5%,75% 30%)}
.dk-plantfg{position:absolute;inset:0;width:100%;height:100%;filter:blur(2.5px) brightness(.8)}
/* folder */
.dk-fold{position:absolute;left:8.5%;top:11%;width:58%;height:77%;transform:rotate(-3.6deg);transform-origin:50% 50%;display:flex;flex-direction:column;align-items:flex-start;color:#1d1a16}
.dk-prog{display:flex;align-items:center;gap:calc(var(--uf,var(--u))*6);font:400 max(12px,calc(var(--uf,var(--u))*13))/1 "Bangers";letter-spacing:.06em;white-space:nowrap}
.dk-prog i{display:flex;gap:calc(var(--uf,var(--u))*3)}
.dk-prog em{width:calc(var(--uf,var(--u))*7);height:calc(var(--uf,var(--u))*7);border-radius:50%;background:rgba(29,26,22,.28)}
.dk-prog em.on{background:#2f8a4a}
.dk-lab{margin-top:calc(var(--uf,var(--u))*3);font:400 max(11px,calc(var(--uf,var(--u))*12))/1.05 "Bangers";letter-spacing:.07em;color:#b27a14}
.dk-title{margin-top:calc(var(--uf,var(--u))*3);font:400 max(16px,calc(var(--uf,var(--u))*21))/.96 "Luckiest Guy";letter-spacing:.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dk-title.l{font-size:max(14px,calc(var(--uf,var(--u))*19))}.dk-title.xl{font-size:max(13px,calc(var(--uf,var(--u))*14));line-height:1}
.dk-what{margin-top:calc(var(--uf,var(--u))*4);font:400 max(13px,calc(var(--uf,var(--u))*15))/1.05 "Patrick Hand";color:#3a3128;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dk-start{position:absolute;left:0;bottom:0;height:28%;aspect-ratio:420/112;display:block;filter:drop-shadow(0 calc(var(--uf,var(--u))*2) 0 rgba(29,26,22,.35))}
.dk-start img{position:absolute;inset:0;width:100%;height:100%}
.dk-start b{position:absolute;inset:0 0 6%;display:flex;align-items:center;justify-content:center;gap:calc(var(--uf,var(--u))*7);color:#fff4d6;font:400 max(16px,calc(var(--uf,var(--u))*24))/1 "Luckiest Guy";letter-spacing:.05em;-webkit-text-stroke:calc(var(--uf,var(--u))*1.2) #3a0d07;paint-order:stroke fill}
.dk-start svg{width:calc(var(--uf,var(--u))*13);height:calc(var(--uf,var(--u))*15)}
/* pack */
.dk-pk{position:absolute;left:29.5%;top:32.5%;width:49%;height:14%;transform:rotate(-8deg);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:.95;color:#1d1a16}
.dk-pk b{font:400 max(11px,calc(var(--u)*10.5))/.95 "Luckiest Guy";letter-spacing:.02em}
.dk-pk u{text-decoration:none;color:#8b2a1c}
.dk-pk b.n.s{font-size:max(17px,calc(var(--u)*24))}
/* tray */
.dk-plate{position:absolute;left:13%;top:61%;width:74%;height:21%;display:flex;align-items:center;justify-content:center;text-align:center}
.dk-plate b{font:400 max(10px,calc(var(--u)*11))/1 "Patrick Hand";font-weight:700;letter-spacing:.01em;color:#1d1a16;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-transform:uppercase}
/* clipboard */
.dk-clip{position:absolute;left:22%;top:23%;width:60%;height:62%;transform:rotate(10deg);transform-origin:50% 50%;display:flex;flex-direction:column;color:#1d1a16}
.dk-clip .h{font:400 max(13px,calc(var(--u)*15))/1 "Luckiest Guy";letter-spacing:.01em;white-space:nowrap}
.dk-clip .s{display:flex;align-items:center;gap:calc(var(--u)*5);margin:calc(var(--u)*1) 0 calc(var(--u)*3);font:400 max(12px,calc(var(--u)*14))/1 "Bangers";letter-spacing:.06em}
.dk-clip .s i{display:flex;gap:calc(var(--u)*3)}
.dk-clip .s em{width:calc(var(--u)*8);height:calc(var(--u)*8);border-radius:50%;border:calc(var(--u)*1.5) solid rgba(29,26,22,.5)}
.dk-clip .s em.on{background:#2f8a4a;border-color:#2f8a4a}
.dk-q{display:flex;align-items:center;gap:calc(var(--u)*5);padding:calc(var(--u)*2) 0;border-top:1.5px solid rgba(29,26,22,.22);flex:1;min-height:0}
.dk-q i{flex:none;width:calc(var(--u)*14);height:calc(var(--u)*14);border:calc(var(--u)*1.8) solid #4a3a2a;border-radius:50%;position:relative}
.dk-q.on i{border:0}
.dk-q i img{position:absolute;inset:calc(var(--u)*-3);width:calc(100% + var(--u)*6);height:calc(100% + var(--u)*6)}
.dk-q span{font:400 max(12px,calc(var(--u)*11.5))/1.02 "Patrick Hand";display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dk-q.on span{opacity:.6}
.dk-wide .dk-clip{left:14%;top:21%;width:72%;height:66%}
.dk-wide .dk-q span{font-size:calc(var(--u)*11.5)}
/* computer layout: plan index cards, shelf of series decks, heading note */
.dk-shelf{position:absolute;inset:0;border-radius:6px 6px 10px 10px;background:linear-gradient(180deg,rgba(32,16,6,.78),rgba(52,28,12,.62) 68%,rgba(40,20,8,.2));border-bottom:calc(var(--u)*8) solid #7a4720;box-shadow:0 calc(var(--u)*10) calc(var(--u)*14) rgba(0,0,0,.5),inset 0 calc(var(--u)*6) calc(var(--u)*12) rgba(0,0,0,.45)}
.dk-note{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 calc(var(--u)*10);background:#f5d86a;background-image:linear-gradient(180deg,rgba(255,255,255,.28),transparent 40%);box-shadow:0 calc(var(--u)*4) calc(var(--u)*8) rgba(0,0,0,.45);color:#3a2a08}
.dk-note b{font:400 calc(var(--u)*17)/1 "Luckiest Guy";letter-spacing:.03em}
.dk-note i{font:400 calc(var(--u)*13)/1.1 "Patrick Hand";font-style:normal}
.dk-idx{position:absolute;inset:0;display:flex;align-items:center;gap:calc(var(--u)*7);padding:calc(var(--u)*6) calc(var(--u)*8) calc(var(--u)*6) calc(var(--u)*9);border-radius:calc(var(--u)*4);background:repeating-linear-gradient(180deg,transparent 0 calc(var(--u)*13),rgba(80,130,190,.22) calc(var(--u)*13) calc(var(--u)*14)),#f6ebcf;border-top:calc(var(--u)*4) solid #b8402c;color:#1d1a16;filter:drop-shadow(0 calc(var(--lift,0)*12px + 3px) calc(var(--lift,0)*9px + 3px) rgba(0,0,0,.5))}
.dk-idx.now{outline:calc(var(--u)*2.5) solid #e3b23c;outline-offset:calc(var(--u)*-2)}
.dk-idx.done{opacity:.72}
.dk-idx .tk{flex:none;width:calc(var(--u)*16);height:calc(var(--u)*16);border:calc(var(--u)*2) solid #4a3a2a;border-radius:50%;position:relative}
.dk-idx.done .tk{border:0}
.dk-idx .tk img{position:absolute;inset:calc(var(--u)*-3);width:calc(100% + var(--u)*6);height:calc(100% + var(--u)*6)}
.dk-idx .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(var(--u)*2)}
.dk-idx b{font:400 calc(var(--u)*13)/1 "Patrick Hand";font-weight:700;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dk-idx small{font:400 calc(var(--u)*10.5)/1.05 "Patrick Hand";color:#5a4a36;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dk-idx .ch{flex:none;height:78%;width:auto;max-width:34%;object-fit:contain}
.dk-art{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 calc(var(--lift,0)*12px + 3px) calc(var(--lift,0)*10px + 4px) rgba(0,0,0,.6))}
.dk-art.dim{filter:brightness(.42) saturate(.5) drop-shadow(0 3px 4px rgba(0,0,0,.6))}
`;
    document.head.appendChild(css);
  }
  return { sync, get on(){ return on; }, get phone(){ return pst && pst.info; } };
})();
