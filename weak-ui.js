/* Weak points screens: the Today section, the tip sheet and the coach report (engine: weakness.js).
   Loaded before the main script; runs at call time on the app's globals. No pop-ups or badges: a section that is
   simply absent when there is nothing to show. */
const WEAK_TODAY_MAX = 3;
const weakHook = c => (c && (c.hook || (c.intro && c.intro.idea))) || '';

function weakRow(id){
  const c = byId(id); if (!c) return '';
  const canDrill = owned(c) && canStudyCard(id), hook = weakHook(c);
  return `<div class="wk-row"><span class="wk-main"><b>${esc(c.name)}</b>${Recall.pips(id)}${hook ? `<small>${esc(hook)}</small>` : ''}</span>
    <span class="wk-btns">${weakCanRead(c) ? `<button class="wk-btn" data-act="weak-read" data-id="${id}">Read</button>` : ''}
    ${canDrill ? `<button class="wk-btn go" data-act="weak-drill" data-id="${id}">Drill</button>` : ''}</span></div>`;
}

function weakSpotsHTML(){
  const p = Weak.profile(); if (!p.cards.length) return '';
  const top = p.patterns[0];
  const line = top ? `<p class="wk-line">You keep missing <b>${esc(Weak.PATTERN_PHRASE[top.key])}</b> questions<small>${top.recent} miss${top.recent === 1 ? '' : 'es'} this month</small></p>
    ${typeof plBtn === 'function' ? plBtn(top.key) : ''}` : '';
  return `<section class="wk" aria-label="Your weak spots"><h2>Your weak spots</h2>${line}
    ${p.cards.slice(0, WEAK_TODAY_MAX).map(c => weakRow(c.id)).join('')}</section>`;
}

/* Read shows the rule or the intro (what the exam results do); it never starts a round */
const weakCanRead = c => !!(c && (c.source || c.intro));
function weakRead(id){
  const c = byId(id); if (!weakCanRead(c)) return;
  if (c.source) push('rule', { id }); else introSheet(c, true);
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="weak-read"]'); if (!t) return;
  weakRead(t.dataset.id);
});

/* hook first (one-card lesson), then the drill: a normal round with the person's missed questions first */
function weakDrill(ids){
  const cards = ids.map(byId).filter(c => c && owned(c) && canStudyCard(c.id)); if (!cards.length) return;
  const c = cards[0], hook = weakHook(c), lore = c.hook && Array.isArray(c.lore) ? c.lore : [];   // lore is a mnemonic on trick cards only; on other cards it is flavor text
  openSheet(`<div class="sh-head">${thumb(c)}<span><b>${esc(c.name)}</b><small>Your trick for this${cards.length > 1 ? ' · +' + (cards.length - 1) + ' more cards' : ''}</small></span></div>
    <div class="intro">${hook ? `<div class="intro-sec"><em>Remember</em><p>${esc(hook)}</p></div>` : ''}
      ${lore.length ? `<div class="intro-sec ex"><p>${lore.map(esc).join('<br>')}</p></div>` : ''}</div>
    <button class="btn-big gold" data-act="weak-go" data-ids="${cards.map(x => x.id).join(',')}">${PLAY_ICON} START DRILL</button>
    <button class="sheet-cancel" data-act="sheet-close">Not now</button>`);
}
function weakGo(ids){
  const prefer = {}; ids.forEach(id => { prefer[id] = Weak.missedQuestions(id); });
  closeSheet(true);
  if (ids.length > 1) startSession(ids[0], { review:true, name:'Drill', queue:Array.from({ length:5 }, (_, i) => ids[i % ids.length]) }, { prefer, drill:true });   // 5 questions, cards taking turns
  else startSession(ids[0], null, { prefer, drill:true });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="weak-drill"],[data-act="weak-go"]'); if (!t) return;
  if (t.dataset.act === 'weak-drill') weakDrill([t.dataset.id]);
  else weakGo(t.dataset.ids.split(',').filter(Boolean));
});

/* the coach report for one attempt: the pattern in this attempt's misses, a hook per card, one Drill button */
function weakReportHTML(entries, opts){
  const r = Weak.report(entries); if (!r) return '';
  const cards = r.cardIds.slice(0, 3).map(byId).filter(Boolean);
  const head = r.key ? `${r.count} of your ${r.total} misses were ${esc(Weak.PATTERN_PHRASE[r.key])} questions` : `You missed ${r.total} questions`;
  const rows = cards.map(c => { const h = weakHook(c); return `<div class="wk-rrow"><b>${esc(c.name)}</b>${h ? `<small>${esc(h)}</small>` : ''}</div>`; }).join('');
  const ids = cards.filter(c => owned(c) && canStudyCard(c.id)).map(c => c.id);
  return `<div class="wk-report ${opts && opts.sys ? 'sys' : ''}"><h3>${head}</h3>${rows}
    ${r.key && typeof plBtn === 'function' ? plBtn(r.key) : ''}
    ${ids.length ? `<button class="btn-big gold" data-act="weak-drill-these" data-ids="${ids.join(',')}">${PLAY_ICON} DRILL THESE</button>` : ''}</div>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="weak-drill-these"]'); if (!t) return;
  weakDrill(t.dataset.ids.split(',').filter(Boolean));
});

const WEAK_CSS = `
.wk{margin:0 0 16px;padding:12px;border-radius:16px;border:.5px solid var(--line);background:var(--bg2);color:var(--paper)}
.wk h2{margin:0 0 6px;font:20px/1.1 "Bangers";letter-spacing:.08em;font-weight:400}
.wk-line{margin:0 0 8px;font:19px/1.2 "Patrick Hand"}
.wk-line small{display:block;font-size:15px;opacity:.7}
.wk .pl-open{margin:0 0 8px;width:100%;min-height:44px}
.wk-report .pl-open{width:100%;margin:6px 0;min-height:44px}
.wk-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:.5px solid var(--line)}
.wk-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.wk-main b{font:19px/1.15 "Patrick Hand";font-weight:400}
.wk-main small{font:15px/1.2 "Patrick Hand";opacity:.75;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wk-btns{display:flex;gap:6px}
.wk-btn{min-height:40px;padding:0 14px;border-radius:12px;border:.5px solid var(--line);background:transparent;color:var(--paper);font:17px/1 "Patrick Hand"}
.wk-btn.go{background:#3f9a54;border-color:#3f9a54;color:#fff}
.wk-report{margin:12px 0;padding:12px;border-radius:16px;border:.5px solid var(--line);background:var(--bg2);color:var(--paper)}
.wk-report h3{margin:0 0 6px;font:20px/1.2 "Patrick Hand";font-weight:400}
.wk-rrow{display:flex;flex-direction:column;gap:2px;padding:6px 0;border-top:.5px solid var(--line)}
.wk-rrow b{font:18px/1.15 "Patrick Hand";font-weight:400}
.wk-rrow small{font:15px/1.2 "Patrick Hand";opacity:.75;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wk-report.sys,.wk-report.sys h3,.wk-report.sys b,.wk-report.sys small{font-family:-apple-system,system-ui,sans-serif}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${WEAK_CSS}</style>`);
