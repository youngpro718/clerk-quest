/* Clerk Quest Sticker Book: the bonus stickers from packs. Stick one on any binder cover (your own or a built-in
   lesson), drag it where you want it, move it later, or peel it back off into the book. Loaded before the main
   script; everything here runs at call time and uses the app's globals (S, STICKERS, stickerList, save, esc,
   openSheet, closeSheet, push, refresh, goBack, topEntry, toast, ICO, chev, artSrc, binders, binderById, LESSONS,
   coverHTML, currentScreenEl). Each sticker is { uid, id, holo, at, on?, x?, y?, r? } in S.stickers; on is a binder id,
   x/y the sticker's center on the cover in %, r its tilt in degrees. */

/* does this pack hold a bonus sticker? None until the player has a binder of their own (that is where stickers go); the first one
   after that is guaranteed; then about 1 pack in 6. r is a random number in [0, 1). */
const STICKER_ODDS = 1 / 6;
const stickerDrops = (haveStickers, binderCount, r) => binderCount > 0 && (!haveStickers || r < STICKER_ODDS);

const stickerInfo = id => (typeof STICKERS !== 'undefined' ? STICKERS : []).find(x => x.id === id) || { id, name:'Sticker' };
const stickerOn = s => s.on && binderById(s.on) ? s.on : null;   // a deleted binder drops its stickers back in the book
const stickerByUid = uid => stickerList().find(s => s.uid === uid);
const allBinders = () => [...binders(), ...LESSONS];

function stickerArtHTML(s, cls = '', style = ''){
  const src = stickerArtSrc(s.id);
  return `<span class="sk-art ${s.holo ? 'shiny' : ''} ${cls}" style="--m:url('${src}');${style}"><img src="${src}" alt="${esc(stickerInfo(s.id).name)}"></span>`;
}
/* the stickers on a binder's cover (drawn by coverHTML in binder.js); skip leaves one out while it's being moved */
function coverStickersHTML(b, skip){
  if (!b || !b.id || b.id === '_preview') return '';
  return stickerList().filter(s => stickerOn(s) === b.id && s.uid !== skip)
    .map(s => stickerArtHTML(s, 'bd-stk', `left:${s.x}%;top:${s.y}%;--r:${s.r || 0}deg`)).join('');
}

/* ---------- Profile row ---------- */
const profileStickerRow = () => stickerList().length ? `<button class="row" data-act="push" data-s="stickerbook"><span class="th emo gi">${ICO('sparkle')}</span>
  <span class="row-main"><b>Sticker Book</b><small>${stickerList().length} sticker${stickerList().length === 1 ? '' : 's'}${stickerList().some(s => !stickerOn(s)) ? ` · ${stickerList().filter(s => !stickerOn(s)).length} to stick` : ''}</small></span>${chev}</button>` : '';

/* ---------- screens ---------- */
const STICKER_SCREENS = {
  stickerbook(){
    const list = stickerList().slice().sort((a, b) => (!!stickerOn(a) - !!stickerOn(b)) || b.at - a.at);
    return { title:'Sticker Book', body: list.length
      ? `<p class="st-note">Bonus stickers from your packs. Tap one to stick it on a binder cover.</p>
         <div class="sk-grid">${list.map(s => { const b = stickerOn(s) && binderById(s.on);
           return `<button class="sk-tile" data-act="sk-open" data-uid="${s.uid}">${stickerArtHTML(s)}
             <span class="st-name">${esc(stickerInfo(s.id).name)}</span><span class="st-sub">${s.holo ? 'Holo' : 'Matte'} · ${b ? 'on ' + esc(b.name) : 'not stuck yet'}</span></button>`; }).join('')}</div>`
      : `<p class="empty">No stickers yet. Some packs have a bonus sticker inside.</p>` };
  },
  stickerplace(p){
    const s = stickerByUid(p.uid), b = binderById(p.id);
    if (!s || !b) return { title:'Sticker', body:'<p class="empty">This sticker or binder is gone.</p>' };
    const drag = stickerArtHTML(s, 'bd-stk sk-drag', `left:${p.x}%;top:${p.y}%;--r:${p.r}deg`);
    return { title:'Place your sticker', cta:true,
      body:`<p class="st-note c">Drag the sticker where you want it on <b>${esc(b.name)}</b>.</p><div class="sk-stage">${coverHTML(b, 'sk-big', s.uid, drag)}</div>`,
      after:`<div class="cta-bar"><div><button class="btn-big gold" data-act="sk-stick">STICK IT</button></div></div>` };
  },
};

/* ---------- sheets ---------- */
function stickerSheet(s){
  const on = stickerOn(s), b = on && binderById(on);
  openSheet(`<div class="sk-sheet">${stickerArtHTML(s)}</div><h3>${esc(stickerInfo(s.id).name)}</h3>
    <p class="st-note">${s.holo ? 'Holographic' : 'Matte'} · ${b ? 'on ' + esc(b.name) : 'not stuck on a binder yet'}</p>
    <div class="acts">${b ? `<button data-act="sk-move" data-uid="${s.uid}">${ICO('sparkle')} Move it on this cover</button>
        <button data-act="sk-choose" data-uid="${s.uid}">${ICO('page')} Move to another binder</button>
        <button data-act="sk-peel" data-uid="${s.uid}">↺ Peel it off (back to the book)</button>`
      : `<button data-act="sk-choose" data-uid="${s.uid}">${ICO('sparkle')} Stick it on a binder</button>`}</div>
    <button class="sheet-cancel" data-act="sheet-close">Done</button>`);
}
function chooseBinderSheet(uid){
  const s = stickerByUid(uid); if (!s) return;
  const row = b => `<button class="row" data-act="sk-pick" data-uid="${uid}" data-id="${b.id}"><span class="bd-mini">${coverHTML(b)}</span>
    <span class="row-main"><b>${esc(b.name)}</b><small>${stickerList().filter(x => stickerOn(x) === b.id).length || 'No'} sticker${stickerList().filter(x => stickerOn(x) === b.id).length === 1 ? '' : 's'} on it</small></span>${chev}</button>`;
  openSheet(`<h3>Stick it on which binder?</h3>
    ${binders().length ? `<div class="sec-h"><span>My Binders</span></div><div class="list">${binders().map(row).join('')}</div>` : ''}
    <div class="sec-h"><span>Lessons</span></div><div class="list">${LESSONS.map(row).join('')}</div>
    <button class="sheet-cancel" data-act="sheet-close">Save it for later</button>`);
}
function placeSticker(uid, bid){
  const s = stickerByUid(uid); if (!s) return;
  const same = stickerOn(s) === bid;
  closeSheet(true);
  push('stickerplace', { uid, id:bid, x:same ? s.x : 50, y:same ? s.y : 62, r:same && s.r != null ? s.r : Math.round(Math.random() * 28 - 14) });
}

/* ---------- dragging the sticker on the placement screen ---------- */
let skDrag = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.sk-drag'); if (!el) return;
  const cover = el.closest('.bd-cover'); if (!cover) return;
  e.preventDefault(); skDrag = { el, cover, id:e.pointerId };
  try { el.setPointerCapture(e.pointerId); } catch (_) {}
  el.classList.add('lift');
});
document.addEventListener('pointermove', e => {
  if (!skDrag || e.pointerId !== skDrag.id) return;
  const r = skDrag.cover.getBoundingClientRect();
  const x = Math.max(4, Math.min(96, (e.clientX - r.left) / r.width * 100)), y = Math.max(4, Math.min(96, (e.clientY - r.top) / r.height * 100));
  skDrag.el.style.left = x + '%'; skDrag.el.style.top = y + '%';
  const en = topEntry(); if (en && en.s === 'stickerplace') { en.p.x = Math.round(x * 10) / 10; en.p.y = Math.round(y * 10) / 10; }
});
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (skDrag) { skDrag.el.classList.remove('lift'); skDrag = null; } }));

/* ---------- taps ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const s = t.dataset.uid && stickerByUid(t.dataset.uid);
  switch (t.dataset.act) {
    case 'sk-open': if (s) stickerSheet(s); break;
    case 'sk-choose': if (s) chooseBinderSheet(s.uid); break;
    case 'sk-pick': placeSticker(t.dataset.uid, t.dataset.id); break;
    case 'sk-move': if (s) placeSticker(s.uid, stickerOn(s)); break;
    case 'sk-peel': if (s) { delete s.on; delete s.x; delete s.y; save(); closeSheet(true); refresh(); toast('Peeled off. It\'s back in your Sticker Book', 'sparkle'); } break;
    case 'sk-stick': { const en = topEntry(), p = en && en.p, x = p && stickerByUid(p.uid), b = p && binderById(p.id); if (!x || !b) break;
      Object.assign(x, { on:b.id, x:p.x, y:p.y, r:p.r }); save(); goBack(); toast(`Stuck on ${b.name}`, 'sparkle'); break; }
  }
});

const STICKER_CSS = `
.sk-art{position:relative;display:block}
.sk-art img{display:block;width:100%;height:auto;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.sk-art.shiny::after{content:"";position:absolute;inset:0;pointer-events:none;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat;
  background:linear-gradient(115deg,transparent 25%,rgba(255,130,210,.55) 38%,rgba(130,220,255,.55) 50%,rgba(200,255,140,.55) 62%,transparent 75%);
  background-size:300% 100%;mix-blend-mode:overlay;animation:skshine 3.2s linear infinite}
@keyframes skshine{from{background-position:100% 0}to{background-position:-200% 0}}
.bd-stk{position:absolute;width:34%;transform:translate(-50%,-50%) rotate(var(--r,0deg));pointer-events:none;z-index:3}
.bd-stk img{filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.45))}
.sk-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.sk-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 6px;border:0;border-radius:14px;background:var(--bg2);color:var(--paper);text-align:center}
.sk-tile .sk-art{width:82%;margin-bottom:4px}
.sk-tile .st-name{font-size:14px} .sk-tile .st-sub{font-size:12px}
.sk-sheet{width:46%;margin:4px auto 8px} .sk-sheet + h3{text-align:center;margin:0}
.sk-sheet ~ .st-note{text-align:center}
.sk-stage{display:flex;justify-content:center;padding:8px 0 20px}
.bd-cover.sk-big{width:min(84%,340px)}
.sk-drag{pointer-events:auto;touch-action:none;cursor:grab;z-index:5;transition:scale .15s,filter .15s}
.sk-drag.lift{scale:1.1;cursor:grabbing} .sk-drag.lift img{filter:drop-shadow(0 10px 10px rgba(0,0,0,.5))}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STICKER_CSS}</style>`);
