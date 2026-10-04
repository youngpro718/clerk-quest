/* Clerk Quest onboarding: 3 welcome screens, the Getting Started checklist on Home, spotlights, and one-time tips.
   Loaded before the main script; everything here runs at call time and uses the app's globals (S, CARDS, save, esc,
   openSheet, closeSheet, push, switchTab, topEntry, refresh, currentScreenEl, toast, ICO, COIN, artSrc, owned, byId,
   earnCoins, openPack, nb, binders, binderCards). */

const ONB = { stepCoins:25, doneCoins:100, donePacks:3 };
function onb(){
  const o = S.onb = S.onb && typeof S.onb === 'object' ? S.onb : {};
  if (!o.paid || typeof o.paid !== 'object') o.paid = {};
  if (!o.tips || typeof o.tips !== 'object') o.tips = {};
  return o;
}
function onbFlag(k){ const o = onb(); if (o[k]) return; o[k] = Date.now(); save(); }

/* ---------- welcome: 3 screens, shown once ---------- */
const WELCOME = [
  { art:'welcome_1', h:'Study it. Collect it. Master it.', p:'Rule cards quote the official NYS court clerk sample questions. Memory Tricks are our own study aids.' },
  { art:'welcome_2', h:'Cards grow as you learn.', p:'Right answers earn XP. Discover new color and characters that break out of their frames. Return to study before frost settles in.' },
  { art:'welcome_3', h:'Read it. Mark it. Keep it.', p:'Read each rule, highlight what matters, write notes, and save questions for later.' },
];
function welcomeVisualHTML(i){
  const preview = (c, level) => cardEl(c, {owned:false,level,xp:0,last:0,mastered:false}, {}, 'wl-card');
  if (i === 0) {
    const cards = [byId('interest'), byId('eightback'), CARDS.find(c=>c.series===5), CARDS.find(c=>c.series===4), byId('gavel')];
    return `<div class="wl-visual wl-fan" aria-label="Five distinct card series">${cards.map((c,k)=>`<div style="--angle:${[-18,-9,9,18,0][k]}deg;--pos:${[22,36,64,78,50][k]}%;--layer:${k+1}">${preview(c,1)}</div>`).join('')}</div>`;
  }
  if (i === 1) return `<div class="wl-visual wl-levels" aria-label="Card progression from level one to level three">${[1,2,3].map(level=>`<div>${preview(byId('eightback'),level)}<b>LEVEL ${level}</b></div>`).join('')}</div>`;
  return `<div class="wl-visual wl-notebook"><span>YOUR STUDY FILE</span><h3>Notice of motion</h3><p>A notice of motion and supporting affidavits shall be served <mark>at least eight days</mark> before the time at which the motion is noticed to be heard.</p><small>CPLR 2214(b) · excerpt</small><div class="wl-note">✎ My note: Eight days out. Two days back.</div></div>`;
}
function welcomeHTML(i){
  const w = WELCOME[i], last = i === WELCOME.length - 1;
  return `<div class="wl"><button class="wl-skip" data-act="wl-skip">Skip</button>
    ${brandHTML('small')}${welcomeVisualHTML(i)}<h2>${esc(w.h)}</h2><p>${esc(w.p)}</p>
    <div class="wl-dots">${WELCOME.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn-big gold" data-act="${last ? 'wl-pack' : 'wl-next'}" data-i="${i + 1}">${last ? `${ICO('pack')} OPEN MY FIRST PACK` : 'NEXT →'}</button>
    ${!wlPreview && typeof cloudUser === 'function' && !cloudUser() ? `<button class="wl-signin" data-act="wl-signin">I already have an account · Sign in</button>` : ''}</div>`;
}
function showWelcome(i){
  let el = document.getElementById('wl-root');
  if (!el) { el = document.createElement('div'); el.id = 'wl-root'; document.body.appendChild(el); }
  document.getElementById('shell')?.setAttribute('aria-hidden', 'true');
  el.innerHTML = welcomeHTML(i);
}
let wlPreview = false;   // the admin view replays the welcome without touching the save
function previewWelcome(){ wlPreview = true; showWelcome(0); }
function endWelcome(){ document.getElementById('shell')?.removeAttribute('aria-hidden'); if (wlPreview) { wlPreview = false; document.getElementById('wl-root')?.remove(); return; } onbFlag('welcomed'); const el = document.getElementById('wl-root'); if (el) el.remove(); refresh(); }
function maybeWelcome(){ if (!onb().welcomed) showWelcome(0); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  switch (t.dataset.act) {
    case 'wl-next': showWelcome(+t.dataset.i); break;
    case 'wl-skip': endWelcome(); break;
    case 'wl-signin': endWelcome(); openSignIn('signin'); break;
    case 'wl-pack': { const pv = wlPreview; endWelcome(); if (!pv && S.packs) openPack(); break; }
  }
});

/* ---------- Getting Started: steps are data; each test is checked live ---------- */
const ruleCard = () => CARDS.find(c => owned(c) && c.source);
const toRule = () => { const c = ruleCard(); if (c) push('card', { id:c.id, tab:'rule' }); else push('rule', { id:CARDS.find(x => x.source).id }); };   // no rule card yet: the Read library has every rule
const toBinders = () => { switchTab('collection'); const en = topEntry(); en.p = Object.assign({}, en.p, { tab:'binders' }); refresh(); };
const STEPS = [
  { id:'pack', label:'Open your first pack', test:() => S.packsOpened >= 1, go:() => push('packs'), spot:'[data-act="pack-open"]', caption:'Tap here to open your pack.' },
  { id:'round', label:'Finish a study round', test:() => S.stats.sessions >= 1, go:() => switchTab('study'), spot:'[data-act="quick"]', caption:'Now put those cards to work. Start a Quick Round.' },
  { id:'hint', label:'Use a Sidebar hint', test:() => (S.stats.hints || 0) >= 1, go:() => switchTab('study'), spot:'[data-act="quick"]', caption:'In a round, tap SIDEBAR? for a hint.' },
  { id:'read', label:'Read a rule', test:() => !!onb().read, go:toRule, spot:'.casefile .cf-quote', caption:'This is the real rule, word for word.' },
  { id:'mark', label:'Highlight a phrase or write a note', test:() => { const n = nb(); return Object.keys(n.hl).length > 0 || Object.keys(n.notes).length > 0; }, go:toRule, spot:'.casefile .cf-quote', caption:'Tap a phrase to highlight it.' },
  { id:'quest', label:'Claim a daily quest', test:() => !!onb().claimed, go:() => switchTab('quests'), spot:['[data-act="claim"]', '.row.q'], caption:'Finish a quest, then claim it here.' },
  { id:'level', label:'Level up a card', test:() => CARDS.some(c => S.cards[c.id].level >= 2), go:() => switchTab('study'), spot:'[data-act="quick"]', caption:'Keep answering to fill a card\'s XP bar.' },
  { id:'store', label:'Buy something in the store', test:() => !!onb().spent, go:() => push('store'), spot:['.st-boost', '.st-grid .st-item'], caption:'Look around the store. Anything you like counts.' },
  { id:'binder', label:'Make a binder', test:() => binders().some(b => binderCards(b).length >= 3), go:toBinders, spot:'[data-act="bd-new"]', caption:'Make a binder and put 3 cards in it.' },
  { id:'lesson', label:'Pass a lesson', test:() => Object.values(S.lessons || {}).some(r => r.passes), go:toBinders, spot:'.bd-shelf .bd-tile', caption:'Open a lesson, read it, then pass the quiz.' },
];
const stepsDone = () => STEPS.filter(s => s.test()).length;
/* preview: the admin view shows it with only a Close button */
const finishSheetHTML = (preview = false) => `<div class="reward"><h3>You're all set!</h3><p>You finished Getting Started.</p>
  <b>+${ONB.doneCoins} coins · +${ONB.donePacks} card packs</b></div>${preview ? `<button class="btn-big gold" data-act="sheet-close">CLOSE PREVIEW</button>`
  : `<button class="btn-big gold" data-act="pack-open">${ICO('pack')} OPEN A PACK</button><button class="sheet-cancel" data-act="sheet-close">Later</button>`}`;
function payOnboarding(){
  const o = onb(); if (o.finished) return;
  const fresh = STEPS.filter(s => !o.paid[s.id] && s.test());
  fresh.forEach(s => { o.paid[s.id] = Date.now(); earnCoins(ONB.stepCoins, `Getting Started: ${s.label}`); });
  const all = STEPS.every(s => o.paid[s.id]);
  if (fresh.length && !all) setTimeout(() => toast(`${fresh.length > 1 ? fresh.length + ' steps' : 'Step'} done · +${ONB.stepCoins * fresh.length} coins`, 'check'), 400);
  if (all) {
    o.finished = Date.now(); S.packs += ONB.donePacks; earnCoins(ONB.doneCoins, 'Getting Started complete');
    setTimeout(() => openSheet(finishSheetHTML()), 300);
  }
  if (fresh.length || all) save();
}
function checklistHTML(){
  payOnboarding();
  const o = onb(); if (o.finished || o.hidden) return '';
  const n = stepsDone(), next = STEPS.find(s => !s.test());
  const shown = gsOpen ? STEPS : STEPS.filter(s => !s.test()).slice(0, 1);   // folded: just the next step
  return `<div class="gs ${gsOpen ? 'open' : 'suggestion'}"><div class="gs-h"><b>${gsOpen ? 'Getting Started' : 'Next step'}</b><small>${gsOpen ? `${n} of ${STEPS.length} complete` : 'A small way to begin'}</small>
      <button class="gs-hide" data-act="gs-hide">Hide</button></div>
    ${gsOpen ? `<div class="gs-bar"><b style="width:${n / STEPS.length * 100}%"></b></div>` : ''}
    <div class="gs-list">${shown.map(s => { const d = s.test();
      return `<button class="gs-step ${d ? 'done' : ''} ${s === next ? 'next' : ''}" data-act="gs-go" data-id="${s.id}" ${d ? 'disabled' : ''}>
        <span class="gs-tick">${d ? ICO('check') : ''}</span><span>${esc(s.label)}</span>${d ? '' : `<small>+${ONB.stepCoins} ${COIN}</small>`}</button>`; }).join('')}</div>
    <button class="gs-more" data-act="gs-more">${gsOpen ? 'Show less' : 'See all Getting Started steps'}</button></div>`;
}
let gsOpen = false;   // the full list, until you leave Home
document.addEventListener('click', e => { if (e.target.closest('[data-act="gs-more"]')) { gsOpen = !gsOpen; refresh(); } });

/* ---------- Hide moves the checklist to Profile; the row there brings it back ---------- */
const profileOnbRow = () => { const o = onb(); return o.hidden && !o.finished ? `<button class="row" data-act="gs-show"><span class="th emo gi">${ICO('check')}</span>
  <span class="row-main"><b>Getting Started</b><small>${stepsDone()} of ${STEPS.length} done · show it on Home</small></span>${chev}</button>` : ''; };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.act === 'gs-hide') { onb().hidden = true; save(); refresh(); toast('Getting Started moved to Profile', 'check'); }
  if (t.dataset.act === 'gs-show') { onb().hidden = false; save(); switchTab('home'); refresh(); }
});

/* ---------- one-time tips: a short sheet the first time something new comes up ---------- */
const TIPS = {
  cold:{ icon:'thermo_snow', h:'This is a Cold Case', p:'You haven\'t studied this card in a while, so it went cold. One right answer reopens it, plus a bonus. Your cards and progress stay yours.' },
  trick:{ icon:'memory', h:'A Memory Trick card', p:'These teach a trick for remembering a rule: an order, a deadline, or who does what.' },
  more:{ icon:'read', h:'Some answers are long', p:'An answer marked "more" is cut off. Tap READ FULL ANSWERS to see every word before you pick.' },
};
const tipSheetHTML = id => { const t = TIPS[id]; return `<div class="reward tip">${ICO(t.icon)}<h3>${esc(t.h)}</h3><p>${esc(t.p)}</p></div>
  <button class="btn-big gold" data-act="sheet-close">GOT IT</button>`; };
function tipOnce(id){
  const o = onb(), t = TIPS[id]; if (!t || o.tips[id]) return;
  o.tips[id] = Date.now(); save();
  setTimeout(() => openSheet(tipSheetHTML(id)), 450);
}

/* ---------- spotlight: dim everything but one target, with a caption; the next tap anywhere clears it.
   `sel` is a selector or a list tried in order. The ring follows the target while images load and shift the page. ---------- */
function spotlight(sel, caption, tries = 12){
  document.querySelectorAll('.spot').forEach(x => x.remove());
  const scr = currentScreenEl(), el = scr && [].concat(sel).map(q => scr.querySelector(q)).find(Boolean);
  if (!el) { if (tries > 0) setTimeout(() => spotlight(sel, caption, tries - 1), 150); return; }   // screens slide in; wait for it
  el.scrollIntoView({ block:'center' });
  setTimeout(() => {
    const ov = document.createElement('div'); ov.className = 'spot';
    ov.innerHTML = `<span class="spot-hole"></span><span class="spot-cap">${esc(caption)}</span>`;
    document.body.appendChild(ov);
    const hole = ov.firstChild, cap = ov.lastChild, pad = 6;
    let n = 0;
    const place = () => {
      let r = el.getBoundingClientRect();
      if (n++ < 10 && (r.top < 0 || r.bottom > innerHeight)) { el.scrollIntoView({ block:'center' }); r = el.getBoundingClientRect(); }
      Object.assign(hole.style, { left:r.left - pad + 'px', top:r.top - pad + 'px', width:r.width + pad * 2 + 'px', height:r.height + pad * 2 + 'px' });
      const below = r.top < innerHeight / 2;
      cap.style.top = below ? Math.min(r.bottom + 14, innerHeight - 90) + 'px' : '';
      cap.style.bottom = below ? '' : innerHeight - r.top + 14 + 'px';
    };
    place();
    const follow = setInterval(place, 120);
    const clear = () => { clearInterval(follow); ov.remove(); };
    setTimeout(() => document.addEventListener('click', clear, { once:true, capture:true }), 0);
    setTimeout(clear, 6000);
  }, 350);
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="gs-go"]'); if (!t) return;
  const s = STEPS.find(x => x.id === t.dataset.id); if (!s) return;
  s.go(); spotlight(s.spot, s.caption);
});

const ONB_CSS = `
#wl-root{position:fixed;inset:0;z-index:900;background:var(--bg);display:flex;overflow-y:auto}
.wl{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:calc(48px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom));text-align:center;color:var(--paper)}
.wl-skip{position:absolute;top:calc(12px + env(safe-area-inset-top));right:16px;padding:8px;border:0;background:none;color:var(--sub);font:19px "Patrick Hand"}
.wl-visual{width:min(100%,360px);height:245px;position:relative;margin:12px 0 0;pointer-events:none}
.wl-fan>div{position:absolute;left:var(--pos);top:20px;width:130px;transform:translateX(-50%) rotate(var(--angle));z-index:var(--layer)}
.wl .wl-card{width:130px;height:182px;font-size:8px}
.wl-levels{display:flex;align-items:center;justify-content:center;gap:9px}
.wl-levels>div{width:104px}.wl-levels .wl-card{width:104px;height:146px}.wl-levels b{display:block;margin-top:18px;font:14px var(--ui);color:var(--mustard)}
.wl-notebook{height:auto;min-height:215px;background:#f0e4ca;color:#242d36;text-align:left;padding:18px 20px;border:2px solid #a83b35;border-radius:8px;box-shadow:7px 7px 0 #101a24;background-image:repeating-linear-gradient(transparent,transparent 25px,#b7c5ca 26px)}
.wl-notebook>span{font:10px var(--ui);letter-spacing:.14em}.wl-notebook h3{font:25px "Bangers";margin:9px 0}.wl .wl-notebook p{font:17px/1.5 "Patrick Hand";color:#242d36}.wl-notebook small{font:11px var(--ui)}.wl-notebook mark{background:#e3b23c}.wl-note{margin-top:12px;border-top:1px solid #a83b35;padding-top:9px;font:16px "Patrick Hand"}
@media(max-height:680px){.wl{gap:8px;padding-top:38px}.wl-visual{height:190px}.wl-fan>div{top:5px}.wl .wl-notebook{height:auto;min-height:180px}.wl h2{font-size:26px}.wl p{font-size:17px}}

.wl h2{margin:6px 0 0;max-width:340px;font:400 30px/1.05 "Bangers";letter-spacing:.04em;text-wrap:balance}
.wl p{margin:0;max-width:340px;font:19px/1.3 "Patrick Hand";color:var(--sub)}
.wl-dots{display:flex;gap:6px;margin:6px 0} .wl-dots i{width:8px;height:8px;border-radius:4px;background:var(--line)} .wl-dots i.on{background:var(--mustard)}
.wl .btn-big{width:100%;max-width:360px}
.gs{margin:0 0 14px;padding:14px;border-radius:16px;background:var(--bg2);border:.5px solid var(--line)}
.gs.suggestion{padding:4px 2px 8px;background:transparent;border:0}
.gs.suggestion .gs-hide{font-size:16px;color:var(--sub)}
.gs-h{display:flex;align-items:baseline;gap:8px} .gs-h b{font:400 22px "Bangers";letter-spacing:.04em} .gs-h small{flex:1;font:13px var(--ui);color:var(--sub)}
.gs-hide{border:0;background:none;color:var(--mustard);font:18px "Patrick Hand"}
.gs-bar{height:6px;margin:8px 0 10px;border-radius:3px;background:var(--line);overflow:hidden} .gs-bar b{display:block;height:100%;background:var(--mustard)}
.gs-list{display:flex;flex-direction:column;gap:6px}
.gs-step{display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 10px;border:0;border-radius:12px;background:var(--bg);color:var(--paper);font:19px/1.15 "Patrick Hand";text-align:left}
.gs-step span:nth-child(2){flex:1} .gs-step small{color:var(--mustard);font-weight:600}
.gs-step.next{outline:1.5px solid rgba(227,178,60,.72)} .gs-step.done{opacity:.55;text-decoration:line-through}
.gs-tick{width:24px;height:24px;flex:none;border-radius:12px;border:2px solid var(--line);display:flex;align-items:center;justify-content:center}
.gs-tick .ico,.gs-tick img{width:16px;height:16px}
.gs-step.done .gs-tick{border-color:#5fd47a;background:#5fd47a}
.gs-step small{display:flex;align-items:center;gap:3px} .gs-step small .ico,.gs-step small img{width:14px;height:14px}
.spot{position:fixed;inset:0;z-index:800;pointer-events:none}
.spot-hole{position:absolute;border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.6);outline:3px solid var(--mustard);animation:spotin .25s ease-out}
.spot-cap{position:absolute;left:16px;right:16px;padding:10px 14px;border-radius:12px;background:#f3d27a;color:var(--ink);font:19px/1.25 "Patrick Hand";text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.4)}
@keyframes spotin{from{opacity:0;transform:scale(1.15)}}
.reward.tip .ico,.reward.tip>img{width:56px;height:56px;margin:0 auto 6px;display:block}
.gs-more{display:block;margin:8px auto 0;border:0;background:none;color:var(--mustard);font:18px "Patrick Hand"}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${ONB_CSS}</style>`);
