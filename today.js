/* Today: the daily plan at the top of Home (spec: docs/superpowers/specs/2026-10-04-today-plan-design.md).
   Built once a day into S.today so rows never reshuffle; only the checkmarks change. Building never calls save():
   S.today rides along with the next normal save, and a missing plan is simply rebuilt.
   Loaded before the main script; everything runs at call time on the app's globals (S, CARDS, Recall, isCold, owned,
   byId, LESSONS, CARD_VIDEOS, LESSON_VIDEOS, liveDocket, dockets, doneCount, HOT_DOCKETS, daysLeft, DAILY_QUESTS,
   questState, onb, STEPS, ONB, todayKey, esc, ICO, PLAY_ICON, studyCard, startSession, openLessonVideo, openPack,
   push, switchTab, spotlight, payOnboarding, nearestGoal). */

const TODAY_MAX = 4;
const REVIEW_MAX = 6;   // a mixed review round: one question per card
const dayKeyOf = ts => { const d = new Date(+ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const onToday = ts => !!ts && dayKeyOf(ts) === todayKey();

/* what to come back to: due, then shaky, then cold cards that have no recall record yet. Owned cards with questions. */
function reviewPile(now = Date.now()){
  const rec = id => (S.recall || {})[id], mine = Recall.examCards().filter(owned);
  const due = mine.filter(c => { const r = rec(c.id); return r && r.box > 0 && r.due <= now; })
    .sort((a, b) => rec(a.id).due - rec(b.id).due);
  const shaky = mine.filter(c => { const r = rec(c.id); return r && !due.includes(c) && (r.right || 0) + (r.wrong || 0) > 0 && Recall.strength(c.id, now) < .4; })
    .sort((a, b) => Recall.strength(a.id, now) - Recall.strength(b.id, now));
  const cold = mine.filter(c => !rec(c.id) && isCold(S.cards[c.id], now))
    .sort((a, b) => S.cards[a.id].last - S.cards[b.id].last);
  return [...due, ...shaky, ...cold].map(c => c.id);
}

/* the next owned card never studied, in built-in lesson order, then card order */
function nextCard(){
  const order = [...LESSONS.flatMap(L => L.cards || []), ...CARDS.map(c => c.id)];
  return order.find(id => { const c = byId(id); return c && owned(c) && c.bank && c.bank.length && !S.cards[id].last; }) || null;
}

/* pages finished on a docket, over all its levels (old saves kept pages on the record itself) */
function docketProgress(id){
  const r = dockets().find(x => x.id === id); if (!r) return 0;
  const parts = r.lv ? Object.values(r.lv) : [r];
  return parts.reduce((n, x) => n + doneCount({ done:(x && x.done) || {} }), 0);
}

function buildTodayItems(now = Date.now()){
  const items = [], o = onb();
  const gs = !o.finished && !o.hidden && STEPS.find(s => !s.test());
  if (gs) items.push({ kind:'gs', id:gs.id });
  const pile = reviewPile(now);
  if (pile.length) items.push({ kind:'review', id:pile[0], ids:pile.slice(0, REVIEW_MAX) });
  const next = nextCard();
  if (next) items.push({ kind:'next', id:next });
  else if (S.packs > 0) items.push({ kind:'pack', base:S.packsOpened || 0 });
  const d = liveDocket();
  if (d) items.push({ kind:'docket', id:d.id, base:docketProgress(d.id) });
  if (!gs) {
    const q = DAILY_QUESTS.find(q => q.id !== 'round' && !questState(q, 'daily').done);
    if (q) items.push({ kind:'quest', id:q.id });
  }
  return items.slice(0, TODAY_MAX);
}

function todayPlan(){
  if (!S.today || S.today.date !== todayKey() || !Array.isArray(S.today.items)) S.today = { date:todayKey(), items:buildTodayItems() };
  return S.today;
}

const multiReview = it => it.kind === 'review' && Array.isArray(it.ids) && it.ids.length > 1;

function itemDone(it){
  switch (it.kind) {
    case 'gs': { const s = STEPS.find(x => x.id === it.id); return !s || s.test(); }
    case 'review': return multiReview(it) ? !!(S.today && S.today.reviewDone) : onToday(((S.recall || {})[it.id] || {}).last);
    case 'next': return onToday((S.cards[it.id] || {}).last);
    case 'pack': return (S.packsOpened || 0) > (it.base || 0);
    case 'docket': return docketProgress(it.id) > (it.base || 0);
    case 'quest': { const q = DAILY_QUESTS.find(x => x.id === it.id); return !q || questState(q, 'daily').done; }
  }
  return true;
}

/* row text: a title and one small line under it */
function todayRow(it){
  const c = it.id && byId(it.id);
  switch (it.kind) {
    case 'gs': { const s = STEPS.find(x => x.id === it.id); return { t:s ? s.label : 'Getting Started', sub:'Getting Started · +' + ONB.stepCoins + ' coins' }; }
    case 'review': return multiReview(it) ? { t:'Review: ' + it.ids.length + ' cards', sub:'Due or shaky · about ' + Math.max(1, Math.round(it.ids.length / 2)) + ' min' }
      : { t:'Review: ' + c.name, sub:'5 questions · about 2 min' };
    case 'next': { const k = CARD_VIDEOS[it.id], v = k && LESSON_VIDEOS[k];
      return v ? { t:'Watch, then practice: ' + c.name, sub:'Video ' + v.len + ' · then 5 questions' } : { t:'Next: ' + c.name, sub:'New card · 5 questions' }; }
    case 'pack': return { t:'Open a pack for new cards', sub:'New cards to study' };
    case 'docket': { const d = HOT_DOCKETS.find(x => x.id === it.id), n = d ? daysLeft(d) : 0;
      return { t:'Hot Docket: ' + (d ? d.title : ''), sub:n + ' day' + (n === 1 ? '' : 's') + ' left · finish one page' }; }
    case 'quest': { const q = DAILY_QUESTS.find(x => x.id === it.id), x = q ? questState(q, 'daily') : { val:0, need:0 };
      return { t:q ? q.label : 'Daily quest', sub:'Daily quest · ' + x.val + '/' + x.need }; }
  }
  return { t:'', sub:'' };
}

/* the card the old hero offered: a cold one, the closest level-up, or any owned card */
function heroCard(){
  const cold = CARDS.filter(c => isCold(S.cards[c.id])).sort((a, b) => S.cards[a.id].last - S.cards[b.id].last);
  const g = nearestGoal();
  return cold[0] || (g && g.c) || CARDS.find(owned) || null;
}

/* the big hero card, dressed for one plan item (or for "done for today" when it is null) */
function todayHero(it, i, done, total){
  const dots = total ? `<span class="td-prog">TODAY · ${done} OF ${total}<i>${Array.from({ length:total }, (_, k) => `<em class="${k < done ? 'on' : ''}"></em>`).join('')}</i></span>` : '';
  const ruleStep = it && it.kind === 'gs' && (it.id === 'read' || it.id === 'mark') && typeof ruleCard === 'function';   // these steps open a rule card: show it
  const card = it && (it.kind === 'review' || it.kind === 'next') ? byId(it.id) : (ruleStep && ruleCard()) || heroCard();
  let label, title, what, cta, cls = '', art = card ? homeCharacter(card) : '', name = card ? card.name : '';
  const r = it && todayRow(it);
  if (!it) {
    label = total ? 'ALL DONE' : 'NOTHING DUE'; title = 'Done for today ✓'; cls = 'done';
    what = card ? 'Want more? Keep practicing ' + card.name + '.' : 'Come back tomorrow for a new plan.'; cta = 'KEEP PRACTICING';
  } else if (it.kind === 'review' && multiReview(it)) {
    const names = it.ids.map(byId).filter(Boolean).map(x => x.name);
    label = 'READY FOR A REFRESHER'; title = 'Review ' + names.length + ' cards'; cls = 'cold';
    what = names.slice(0, 2).join(', ') + (names.length > 2 ? ' and ' + (names.length - 2) + ' more' : '') + '. One question each.';
    cta = 'START REVIEW';
  } else if (it.kind === 'review') {
    label = 'READY FOR A REFRESHER'; title = heroTopicTitle(card); what = heroTopic(card); cta = 'STUDY 5 QUESTIONS'; cls = 'cold';
  } else if (it.kind === 'next') {
    const k = CARD_VIDEOS[it.id], v = k && LESSON_VIDEOS[k];
    label = 'YOUR NEXT STUDY'; title = heroTopicTitle(card); what = heroTopic(card); cta = v ? 'WATCH, THEN 5 QUESTIONS' : 'STUDY 5 QUESTIONS';
  } else if (it.kind === 'docket') {
    label = 'HOT DOCKET'; title = r.t.replace(/^Hot Docket: /, ''); what = r.sub; cta = 'OPEN THE DOCKET'; cls = 'docket';
    art = `<img src="${artSrc('docket_folder')}" alt="">`; name = '';
  } else if (it.kind === 'gs') {
    label = 'GETTING STARTED'; title = r.t; what = '+' + ONB.stepCoins + ' coins for this step.'; cta = 'START';
  } else if (it.kind === 'pack') {
    label = 'NEW CARDS'; title = 'Open a pack'; what = 'New cards to study are waiting.'; cta = 'OPEN A PACK';
    art = `<img src="${nextPackArt()}" alt="">`; name = '';
  } else {
    label = 'DAILY QUEST'; title = r.t; what = r.sub.replace(/^Daily quest · /, '') + ' so far today.'; cta = 'KEEP GOING';
  }
  const act = it ? `data-act="today-go" data-i="${i}"` : 'data-act="today-more"';
  return `<button class="hero td-hero ${cls}" ${act}>
    <span class="hero-info">${dots}<small>${label}</small><b>${esc(title)}</b>
      <span class="hero-what">${esc(what)}</span>
      <span class="hero-cta">${it ? PLAY_ICON + ' ' : ''}${cta}</span></span>
    <span class="hero-card">${art}${name ? `<span class="hero-character">${esc(name)}</span>` : ''}</span></button>`;
}

/* the rest of the plan: small art tiles under the hero, ticked when done */
function todayTile(it, i){
  const r = todayRow(it), d = itemDone(it), c = (it.kind === 'review' || it.kind === 'next') && byId(it.id);
  const art = c ? thumb(c)
    : it.kind === 'docket' ? `<span class="th td-art"><img src="${artSrc('docket_folder')}" alt=""></span>`
    : it.kind === 'pack' ? `<span class="th td-art"><img src="${nextPackArt()}" alt=""></span>`
    : `<span class="th emo gi">${ICO(it.kind === 'quest' ? 'trophy' : 'check')}</span>`;
  return `<button class="td-tile ${d ? 'done' : ''}" data-act="today-go" data-i="${i}" ${d ? 'disabled' : ''}>${art}
    <span class="td-main"><b>${esc(r.t)}</b><small>${esc(r.sub)}</small></span><span class="td-tick">${d ? ICO('check') : ''}</span></button>`;
}

function todayHTML(){
  if (typeof payOnboarding === 'function') payOnboarding();
  const items = todayPlan().items, done = items.filter(itemDone).length, first = items.findIndex(it => !itemDone(it));
  const rest = items.map((it, i) => i === first ? '' : todayTile(it, i)).join('');
  return `<section class="today" aria-label="Today's plan">${todayHero(first >= 0 ? items[first] : null, first, done, items.length)}
    ${rest ? `<div class="td-list">${rest}</div>` : ''}</section>`;
}

/* what the hero or a tile opens */
function todayGo(it){
  if (!it) return;
  switch (it.kind) {
    case 'gs': { const s = STEPS.find(x => x.id === it.id); if (s) { s.go(); spotlight(s.spot, s.caption); } return; }
    case 'review': if (multiReview(it)) startReview(it); else startSession(it.id); return;   // cards you know: straight to questions
    case 'next': { const k = CARD_VIDEOS[it.id]; if (k && LESSON_VIDEOS[k]) openLessonVideo(k, 'intro', it.id); else studyCard(it.id); return; }
    case 'pack': if (S.packs) openPack(); else push('packs'); return;
    case 'docket': push('docket', { id:it.id }); return;
    case 'quest': { const card = todayPlan().items.find(x => (x.kind === 'review' || x.kind === 'next') && !itemDone(x));
      if (card) todayGo(card); else switchTab('study'); return; }
  }
}
/* after everything is done: the card the old hero card would have offered */
function todayMore(){ const c = heroCard(); if (c) studyCard(c.id); else switchTab('study'); }
/* the mixed review: one question per card, on the lesson-round machinery (sessLen() is the queue length) */
function startReview(it){
  const queue = (it.ids || []).filter(canStudyCard);
  if (queue.length < 2) return startSession(queue[0] || it.id);
  startSession(queue[0], { review:true, name:'Review', queue });
}
/* results: score, rewards, and each card's recall dots after the round. No pass or fail. */
function reviewResults(){
  const L = sess.lesson, total = L.queue.length, correct = sess.results.filter(Boolean).length;
  if (S.today) S.today.reviewDone = true;
  save();
  view = { name:'results' };
  const rows = L.queue.map((id, i) => { const c = byId(id); return c ? `<div class="rv-row"><span class="rv-mark ${sess.results[i] ? 'ok' : 'miss'}">${ICO(sess.results[i] ? 'check' : 'thermo_snow')}</span>
    <span class="rv-main"><b>${esc(c.name)}</b><small>${esc(Recall.dueText(id))}</small></span>${Recall.pips(id)}</div>` : ''; }).join('');
  app.innerHTML = `
    <div class="results lesson review">
      <h1>REVIEW DONE</h1>
      <div class="score">${correct} of ${total}</div>
      <div class="sub">right · your recall dots are updated</div>
      <div class="rchips"><span class="chip">+${sess.xp} XP</span>${sess.coins ? `<span class="chip coin">+${sess.coins} ${COIN}</span>` : ''}
        ${sess.packGiven ? `<span class="chip">${ICO('pack')} +1 DAILY PACK</span>` : ''}</div>
      <div class="panel rv-list">${rows}</div>
      <div class="stack">
        ${S.packs ? `<button class="btn-big gold" data-act="pack-open">${ICO('pack')} OPEN YOUR PACK</button>` : ''}
        <button class="btn-big alt" data-act="session-close">Done</button>
      </div>
    </div>`;
  app.scrollTo({ top:0 });
  refresh();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="today-go"],[data-act="today-more"]'); if (!t) return;
  if (t.dataset.act === 'today-more') return todayMore();
  todayGo(todayPlan().items[+t.dataset.i]);
});

const TODAY_CSS = `
.today{margin:0 0 16px}
.td-prog{display:flex;align-items:center;gap:8px;margin-bottom:2px;font:13px/1 "Bangers";letter-spacing:.1em;color:var(--paper);opacity:.8}
.td-prog i{display:flex;gap:4px}
.td-prog em{width:8px;height:8px;border-radius:4px;background:rgba(241,229,201,.22)}
.td-prog em.on{background:#5fd47a}
.hero.td-hero.docket{border-color:rgba(207,59,42,.55);background:linear-gradient(135deg,rgba(207,59,42,.24),rgba(207,59,42,.06) 70%),var(--bg2)}
.hero.td-hero.docket .hero-info small{color:#ff8a6a}
.hero.td-hero.done{border-color:rgba(95,212,122,.45);background:linear-gradient(135deg,rgba(95,212,122,.18),rgba(95,212,122,.04) 70%),var(--bg2)}
.hero.td-hero.done .hero-info small{color:#5fd47a}
.hero.td-hero.done .hero-cta{background:#2f8a4a}
.hero.td-hero .hero-card>img{height:150px}
.td-list{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.td-tile{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:9px 12px;border-radius:16px;border:.5px solid var(--line);background:var(--bg2);color:var(--paper);text-align:left}
.td-tile.done{opacity:.6}
.td-tile.done b{text-decoration:line-through}
.td-art{background:rgba(0,0,0,.25)}
.td-art img{object-fit:contain}
.td-main{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.td-main b{font:19px/1.15 "Patrick Hand";font-weight:400}
.td-main small{font:15px/1.15 "Patrick Hand";opacity:.7}
.td-tick{width:24px;height:24px;flex:none;border-radius:12px;border:2px solid var(--line);display:flex;align-items:center;justify-content:center}
.td-tick .ico,.td-tick img{width:16px;height:16px}
.td-tile.done .td-tick{border-color:#5fd47a;background:#5fd47a}
.rv-list{display:flex;flex-direction:column;gap:8px}
.rv-row{display:flex;align-items:center;gap:10px}
.rv-mark{width:28px;height:28px;flex:none;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}
.rv-mark .ico,.rv-mark img{width:18px;height:18px}
.rv-mark.ok{background:#5fd47a}
.rv-main{flex:1;min-width:0;display:flex;flex-direction:column}
.rv-main b{font:19px/1.15 "Patrick Hand";font-weight:400}
.rv-main small{font:15px/1.15 "Patrick Hand";opacity:.7}
.rv-list .rc-pips i{border-color:rgba(29,27,23,.5);opacity:1}
.rv-list .rc-pips i.on{background:#3f9a54;border-color:#3f9a54}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${TODAY_CSS}</style>`);
