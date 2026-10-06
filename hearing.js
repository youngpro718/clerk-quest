/* Clerk Quest Final Hearing (spec: docs/superpowers/specs/2026-10-05-card-versions-design.md).
   A mastered card can take its Final Hearing: HEARING_QUESTIONS questions on that rule, no hints, no misses.
   Pass and the card is stamped with the Gold Seal (its top version). Miss one and the hearing is adjourned until tomorrow.
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, CARDS, byId, save, esc, refresh, toast, ICO, nextQuestion, cardEl, verOf, todayKey, confetti, softFlash,
   nativeFeedback, lockScroll, unlockScroll). */

const HEARING_QUESTIONS = 5;   // TUNE

const hearingOpen = st => !!(st && st.owned && st.mastered && verOf(st) !== 'gold');
const hearingAdjourned = st => !!(st && st.hearing === todayKey());

/* The box on the card page: locked until mastered, then Begin (or Adjourned until tomorrow). Gold Seal cards show nothing. */
function hearingBoxHTML(c, st){
  if (!st.owned || verOf(st) === 'gold') return '';
  if (!st.mastered) return `<div class="hearbox locked"><img src="art/ver_gold_seal.png" alt=""><span><b>Final Hearing</b><small>Master this card to unlock its Final Hearing and earn the Gold Seal.</small></span></div>`;
  const adj = hearingAdjourned(st);
  return `<div class="hearbox"><img src="art/ver_gold_seal.png" alt=""><span><b>Final Hearing</b><small>${adj ? 'Adjourned. Your next hearing opens tomorrow.' : `${HEARING_QUESTIONS} questions, no hints, no misses. Pass to earn the Gold Seal.`}</small></span>
    <button class="hearbtn" data-act="hearing-start" data-id="${c.id}" ${adj ? 'disabled' : ''}>${adj ? 'Tomorrow' : 'Begin'}</button></div>`;
}

let hearing = null;
function startHearing(id){
  const c = byId(id), st = c && S.cards[id];
  if (!hearingOpen(st) || hearingAdjourned(st)) return;
  const used = new Set(), qs = [];
  for (let i = 0; i < HEARING_QUESTIONS; i++) qs.push(nextQuestion(c, st.level, used));
  hearing = { id, qs, i:0 };
  const ov = document.createElement('div'); ov.className = 'hearing';
  ov.innerHTML = `<div class="hr-bg"></div><div class="hr-top"><button class="hr-x" data-act="hearing-close" aria-label="Leave the hearing">✕</button>
    <span class="hr-title">FINAL HEARING<small>${esc(c.name)}</small></span><span class="hr-count"></span></div><div class="hr-body"></div>`;
  document.body.appendChild(ov); lockScroll();
  paintHearing();
}
function paintHearing(){
  const ov = document.querySelector('.hearing'); if (!ov || !hearing) return;
  const q = hearing.qs[hearing.i];
  ov.querySelector('.hr-count').textContent = `${hearing.i + 1} of ${hearing.qs.length}`;
  const rows = q.rows ? `<div class="hr-rows">${q.rows.map((r, i) => `<div><span>${i + 1}</span><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>` : '';
  ov.querySelector('.hr-body').innerHTML = `<div class="hr-dots">${hearing.qs.map((_, i) => `<i class="${i < hearing.i ? 'ok' : i === hearing.i ? 'cur' : ''}"></i>`).join('')}</div>
    <div class="hr-q"><p>${esc(q.q)}</p>${rows}</div>
    <div class="hr-opts">${q.opts.map((o, i) => `<button data-act="hearing-ans" data-i="${i}"><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
}
function answerHearing(i){
  const ov = document.querySelector('.hearing'); if (!ov || !hearing || hearing.locked) return;
  const q = hearing.qs[hearing.i], choice = q.opts[i], ok = choice === q.a;
  hearing.locked = true;
  ov.querySelectorAll('.hr-opts button').forEach((b, j) => { b.disabled = true; if (q.opts[j] === q.a) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  nativeFeedback(ok ? 'correct' : 'wrong');
  setTimeout(() => {
    hearing.locked = false;
    if (!ok) return hearingVerdict(false, q);
    hearing.i++;
    hearing.i >= hearing.qs.length ? hearingVerdict(true) : paintHearing();
  }, ok ? 650 : 1100);
}
function hearingVerdict(passed, missed){
  const ov = document.querySelector('.hearing'), c = byId(hearing.id), st = S.cards[hearing.id];
  if (passed) { st.vers = [].concat(st.vers || [], 'gold'); st.hearing = null; }
  else st.hearing = todayKey();
  save(); refresh();
  ov.querySelector('.hr-count').textContent = '';
  ov.querySelector('.hr-body').innerHTML = passed
    ? `<div class="hr-verdict"><div class="hr-card">${cardEl(c, st)}<img class="hr-stamp sealed" src="art/stamp_sealed.png" alt="Sealed"></div>
        <h2>Gold Seal!</h2><p>You answered all ${hearing.qs.length} without a miss. ${esc(c.name)} now carries the Gold Seal.</p>
        <button class="btn-big gold" data-act="hearing-close">CLOSE THE HEARING</button></div>`
    : `<div class="hr-verdict"><img class="hr-stamp adjourned" src="art/stamp_adjourned.png" alt="Adjourned, try again tomorrow">
        <p class="hr-miss"><b>The answer was:</b> ${esc(missed.a)}</p>${missed.w ? `<p>${esc(missed.w)}</p>` : ''}
        <p>Study the card and come back tomorrow. You need all ${hearing.qs.length} right.</p>
        <button class="btn-big gold" data-act="hearing-close">BACK TO THE CARD</button></div>`;
  if (passed) { softFlash(); nativeFeedback('levelup'); confetti(ov); }
}
function closeHearing(){
  document.querySelector('.hearing')?.remove(); hearing = null; unlockScroll();
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  switch (t.dataset.act) {
    case 'hearing-start': startHearing(t.dataset.id); break;
    case 'hearing-ans': answerHearing(+t.dataset.i); break;
    case 'hearing-close': closeHearing(); break;
  }
});

const HEARING_CSS = `
.hearbox{display:flex;align-items:center;gap:12px;margin:12px 0 4px;padding:10px 12px;border:2px solid rgba(227,178,60,.45);border-radius:14px;background:rgba(227,178,60,.1)}
.hearbox img{width:40px;height:auto;flex:none}
.hearbox span{flex:1;min-width:0}.hearbox b{display:block;font-size:18px}.hearbox small{display:block;font:14px/1.3 var(--ui);color:var(--sub)}
.hearbox.locked{opacity:.7}.hearbox.locked img{filter:grayscale(1)}
.hearbtn{flex:none;min-height:40px;padding:0 16px;border:2px solid var(--ink);border-radius:20px;background:var(--mustard);color:var(--ink);font:400 18px "Bangers";letter-spacing:.05em}
.hearbtn:disabled{opacity:.45}
.hearing{position:fixed;inset:0;z-index:75;background:#120e0a;isolation:isolate;display:flex;flex-direction:column;color:var(--paper);overflow:auto;animation:fadein .25s both}
.hr-bg{position:fixed;inset:0;z-index:-1;background:linear-gradient(rgba(16,12,8,.55),rgba(16,12,8,.85)),url(art/hearing_bg.jpg) center/cover}
.hr-top{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 6px}
.hr-x{width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.45);color:var(--paper);font-size:18px}
.hr-title{flex:1;text-align:center;font:400 26px/1 "Bangers";letter-spacing:.08em;color:var(--mustard);text-shadow:0 2px 0 #000}
.hr-title small{display:block;margin-top:3px;font:15px "Patrick Hand",sans-serif;letter-spacing:0;color:var(--paper)}
.hr-count{width:40px;text-align:right;font:15px var(--ui);opacity:.8}
.hr-body{flex:1;display:flex;flex-direction:column;gap:14px;width:min(100%,520px);margin:0 auto;padding:8px 16px max(20px,env(safe-area-inset-bottom));box-sizing:border-box}
.hr-dots{display:flex;justify-content:center;gap:8px}
.hr-dots i{width:12px;height:12px;border-radius:50%;border:2px solid var(--mustard)}
.hr-dots i.ok{background:var(--mustard)}.hr-dots i.cur{box-shadow:0 0 0 3px rgba(227,178,60,.35)}
.hr-q{padding:16px;border:3px solid var(--ink);border-radius:14px;background:var(--paper);color:var(--ink);box-shadow:0 6px 0 rgba(0,0,0,.4)}
.hr-q p{margin:0;font-size:21px;line-height:1.25}
.hr-rows{margin-top:10px;font:14px var(--ui)}.hr-rows div{display:grid;grid-template-columns:22px 1fr 1fr;gap:6px;padding:3px 0;border-top:1px solid rgba(0,0,0,.15)}
.hr-opts{display:grid;gap:10px}
.hr-opts button{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;border:3px solid var(--ink);border-radius:14px;background:#fff7e0;color:var(--ink);text-align:left;font-size:19px;line-height:1.2}
.hr-opts button b{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--ink);color:var(--paper);font:400 18px "Bangers"}
.hr-opts button.right{background:#9bb68a}.hr-opts button.wrong{background:#e08a7a}
.hr-verdict{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding-top:6px}
.hr-verdict h2{margin:0;font:400 38px/1 "Bangers";letter-spacing:.05em;color:var(--mustard);text-shadow:0 3px 0 #000}
.hr-verdict p{margin:0;font-size:19px;max-width:420px}
.hr-miss{padding:10px 14px;border-radius:12px;background:rgba(0,0,0,.45)}
.hr-card{position:relative;width:min(60vw,250px)}
.hr-stamp{pointer-events:none;animation:hrstamp .5s cubic-bezier(.2,1.4,.4,1) .35s both}
.hr-stamp.sealed{position:absolute;width:62%;left:50%;top:50%;translate:-50% -50%;rotate:-10deg;filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))}
.hr-stamp.adjourned{width:min(80vw,340px);margin:24px 0 8px;rotate:-6deg;background:rgba(255,250,235,.92);border-radius:10px;padding:10px}
@keyframes hrstamp{from{transform:scale(2.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.hr-stamp{animation:none}}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${HEARING_CSS}</style>`);
