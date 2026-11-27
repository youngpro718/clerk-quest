/* Study Path, part 2: the plan. After the placement check (study-path.js) the player gets a Study Path screen: the units in
   the order they should be learned, a countdown to the exam, a readiness goal for the week, two mock exams on the calendar,
   and a pace check. Each unit ends in a checkpoint (10 questions, pass with 8). A missed checkpoint adds a repair review of
   the missed cards and a retake two days later; a mock exam re-ranks every unit. Today's plan (today.js) shows checkpoints,
   repairs and mock exams as items of kind 'plan'.
   Design: https://claude.ai/artifact/D5LbbmB2mGJmN6CWktF7Sy (steps 3 and 4).
   Saved in S.path (study-path.js) under: units{ [unitId]:{ cps:[{at,right,total,pass}], passed, retryAt, repair:[cardIds], failAt } },
   r0 (readiness when the plan started), examSeen (last exam result folded into the plan).
   Loaded after study-path.js; runs at call time on the app's globals. */

const CP_N = 10, CP_PASS = .8, CP_RETRY_DAYS = 2, CP_PER_CARD = 3;
const PLAN_GOAL = .85;          // readiness to aim for on exam day
const MOCK_N = 50;              // mock exam length until the real exam's length is known
const PLAN_DAY = 864e5;

const planActive = () => typeof pathDone === 'function' && pathDone();
/* the plan changed mid-day (a checkpoint, a mock exam): Today keeps what it showed and adds what's new (today.js) */
const planTodayChanged = now => { if (typeof todayMerge === 'function') todayMerge(now); else if (S.today) delete S.today; };
function planUnitRec(id){
  const p = S.path, all = p.units = p.units && typeof p.units === 'object' ? p.units : {};
  return all[id] = all[id] || { cps:[] };
}
const planStart = () => (S.path && (S.path.doneAt || S.path.startedAt)) || Date.now();
function planEnd(){
  const d = typeof pathDaysLeft === 'function' ? pathDaysLeft() : null;
  return d == null ? planStart() + PATH_DEFAULT_DAYS * PLAN_DAY : Date.now() + d * PLAN_DAY;
}

/* ---------- units in order, with progress ---------- */
/* a card counts as learned once it has had a study round of its own. Getting it right in the placement check, an exam or a
   checkpoint doesn't count: placement knowledge is what "skip ahead" is for, so a unit is never owed a checkpoint for cards never studied. */
const planLearned = id => !!((S.cards || {})[id] || {}).last;
function planUnitState(u, now = Date.now()){
  const r = planUnitRec(u.id), learned = u.cards.filter(planLearned).length, st = (S.path.map || {})[u.id] || 'new';
  if (r.passed) return { key:'closed', learned, r, st };
  if (r.repair && r.repair.length && !planRepairDone(u.id)) return { key:'repair', learned, r, st };
  if (r.retryAt && now < r.retryAt) return { key:'wait', learned, r, st };
  const last = (r.cps || [])[(r.cps || []).length - 1], skipMissed = last && last.skip && !last.pass;   // a missed skip-ahead costs nothing: learn it card by card
  if (learned >= u.cards.length || (st === 'strong' && !skipMissed) || (last && !skipMissed)) return { key:'ready', learned, r, st };
  return { key:learned ? 'learning' : 'todo', learned, r, st };
}
/* closed units first (in the order they closed), then the rest by need: most-tested and weakest first */
function planOrder(now = Date.now()){
  const units = pathUnits().map(u => ({ ...u, state:planUnitState(u, now), rank:pathCardRank(byId(u.cards[0])) }));
  const closed = units.filter(u => u.state.key === 'closed').sort((a, b) => a.state.r.passed - b.state.r.passed);
  const open = units.filter(u => u.state.key !== 'closed').sort((a, b) => a.rank - b.rank);
  return [...closed, ...open];
}
/* a unit placement called Strong that hasn't been checked yet: one checkpoint can close it early ("skip ahead") */
const planTestOut = u => !!u && u.state.key === 'ready' && u.state.st === 'strong' && !(u.state.r.cps || []).length && u.state.learned < u.cards.length;
/* the unit being worked on now: the first open unit that isn't waiting on a retake or only a test-out.
   Home's banner, Today's plan, the Study Path screen and the Study tab's Up Next all use this one answer. */
function planCurrent(now = Date.now()){
  const open = planOrder(now).filter(u => u.state.key !== 'closed');
  return open.find(u => u.state.key !== 'wait' && !planTestOut(u)) || open.find(u => u.state.key !== 'wait') || open[0] || null;
}
/* the unit to learn new cards from, and its next new cards (a unit waiting on a checkpoint or a retake has none to teach) */
const planFresh = u => u.cards.filter(id => !planLearned(id) && (typeof canStudyCard !== 'function' || canStudyCard(id)));
function planLearnUnit(now = Date.now()){
  const cur = planCurrent(now), open = planOrder(now).filter(u => u.state.key === 'learning' || u.state.key === 'todo');
  return [cur, ...open].find(u => u && (u.state.key === 'learning' || u.state.key === 'todo') && planFresh(u).length) || null;
}
function planNextCards(n = 1, now = Date.now()){
  if (!planActive()) return [];
  const u = planLearnUnit(now);
  return u ? planFresh(u).slice(0, n) : [];
}

/* ---------- checkpoints ---------- */
function pickCheckpoint(unitId, n = CP_N, rand = Math.random){
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r = planUnitRec(unitId), seen = new Set(r.seen || []);
  const pool = shuf((typeof examPool === 'function' ? examPool() : []).filter(p => pathUnitOf(byId(p.cardId)) === unitId));
  pool.sort((a, b) => seen.has(a.q.q) - seen.has(b.q.q) || (typeof examLongest === 'function' ? examLongest(a.q) - examLongest(b.q) : 0));   // questions not asked in an earlier checkpoint first
  const per = {}, out = [];
  for (const p of pool) {
    if (out.length >= n) break;
    if ((per[p.cardId] || 0) >= CP_PER_CARD) continue;
    per[p.cardId] = (per[p.cardId] || 0) + 1;
    out.push({ unit:unitId, cardId:p.cardId, set:p.set, style:p.style, q:p.q.q, ...(Array.isArray(p.q.st) ? { st:p.q.st.slice() } : {}), c:shuf(p.q.c), a:p.q.a, w:p.q.w || '' });
  }
  return out;
}
const cpNeed = total => total < 5 ? Math.max(1, total - 1) : Math.ceil(total * CP_PASS);   // a short checkpoint (a 1-card unit) allows one miss, not zero

/* score it, feed recall and the miss log, and change the plan */
function finishCheckpoint(cp, now = Date.now()){
  const r = planUnitRec(cp.unit), unit = pathUnits().find(u => u.id === cp.unit);
  const skip = !!unit && !(r.cps || []).length && unit.cards.filter(planLearned).length < unit.cards.length;   // placement said Strong, but not every card has been studied yet
  let right = 0; const missed = [];
  cp.items.forEach((it, i) => {
    const ok = cp.answers[i] === it.a; if (ok) right++; else missed.push(it.cardId);
    if (typeof Recall === 'object' && Recall.record) Recall.record(it.cardId, ok, false);
    if (!ok && typeof Weak === 'object' && Weak.logMiss) Weak.logMiss(it.cardId, it.q, cp.answers[i], 'checkpoint', false, now);
  });
  const total = cp.items.length, pass = right >= cpNeed(total);
  r.cps = [...(r.cps || []), { at:now, right, total, pass, ...(skip ? { skip:true } : {}) }].slice(-10);
  r.seen = [...new Set([...(r.seen || []), ...cp.items.map(it => it.q)])].slice(-60);
  S.path.map = S.path.map || {};
  if (pass) { r.passed = now; delete r.repair; delete r.retryAt; delete r.failAt; S.path.map[cp.unit] = 'strong'; }
  else if (skip) S.path.map[cp.unit] = 'shaky';   // no repair, no wait: the unit is simply learned card by card
  else { r.repair = [...new Set(missed)]; r.failAt = Math.max(now, Date.now()) + 1;   /* after the answers just recorded, so only later reviews count */ r.retryAt = now + CP_RETRY_DAYS * PLAN_DAY; S.path.map[cp.unit] = 'new'; }
  if (typeof pathRankCache !== 'undefined') pathRankCache = {};
  planTodayChanged(now);
  return { right, total, pass, skip, missed:[...new Set(missed)] };
}
/* the repair is done once every missed card has been answered again since the checkpoint */
function planRepairDone(unitId){
  const r = planUnitRec(unitId);
  return !r.repair || r.repair.every(id => (((S.recall || {})[id] || {}).last || 0) > (r.failAt || 0));
}

/* ---------- mock exams: halfway through, and one week before the exam ---------- */
function planMocks(){
  const a = planStart(), b = planEnd(), last = b - 7 * PLAN_DAY;
  const mid = a + (last - a) / 2;
  return [{ n:1, at:mid }, { n:2, at:Math.max(mid + PLAN_DAY, last) }];
}
const examsSince = t => (Array.isArray(S.examHistory) ? S.examHistory : []).filter(h => h.at >= t);
function planMockDue(now = Date.now()){
  if (S.exam) return null;
  const ms = planMocks(), taken = examsSince(planStart()).length;
  const due = ms.filter(m => m.at <= now);
  return due.length > taken ? due[taken] : null;
}

/* a finished practice or mock exam re-ranks the units it covered: 80%+ Strong, 50%+ Shaky, under 50% New
   (a closed unit under 50% reopens for repair) */
function planFoldExam(now = Date.now()){
  if (!planActive()) return false;
  const L = S.examLast; if (!L || !L.result || !Array.isArray(L.items)) return false;
  if ((S.path.examSeen || 0) >= L.result.at || L.result.at < planStart()) return false;
  const by = {};
  L.items.forEach((it, i) => { const u = pathUnitOf(byId(it.cardId)), x = by[u] = by[u] || { right:0, total:0, missed:[] };
    x.total++; if (L.answers[i] === it.a) x.right++; else x.missed.push(it.cardId); });
  S.path.map = S.path.map || {};
  Object.entries(by).forEach(([u, x]) => {
    if (x.total < 2) return;
    const pct = x.right / x.total, r = planUnitRec(u);
    if (r.passed) { if (pct < .5) { delete r.passed; r.repair = [...new Set(x.missed)]; r.failAt = L.result.at; r.retryAt = L.result.at + CP_RETRY_DAYS * PLAN_DAY; S.path.map[u] = 'new'; } return; }
    S.path.map[u] = pct >= .8 ? 'strong' : pct >= .5 ? 'shaky' : 'new';
  });
  S.path.examSeen = L.result.at;
  if (typeof pathRankCache !== 'undefined') pathRankCache = {};
  planTodayChanged(now);
  return true;
}

/* ---------- the week's goal ---------- */
function planGoal(now = Date.now()){
  const r0 = S.path.r0 ?? 0, a = planStart(), b = planEnd();
  const weeks = Math.max(1, Math.ceil((b - a) / (7 * PLAN_DAY))), week = Math.min(weeks, Math.floor((now - a) / (7 * PLAN_DAY)) + 1);
  const goal = r0 + (PLAN_GOAL - r0) * Math.min(1, week / Math.max(1, weeks - 1));
  return { week, weeks, goal:Math.max(r0, goal) };
}

/* ---------- Today's plan items (today.js) ----------
   lead: what Today opens with, in order: a due mock exam, a repair, the current unit's checkpoint, the day's new cards
   (as many as the minutes a day fit: PATH_NEW_PER_DAY).
   later: a "skip ahead" test-out for a unit placement called Strong, after the day's review: not in the first two days
   (learn something first), and at most one a day. */
const PLAN_SKIP_AFTER_DAYS = 2;
const planNewPerDay = () => (typeof PATH_NEW_PER_DAY === 'object' && PATH_NEW_PER_DAY[(S.path || {}).minutes]) || 2;
const planSkipToday = now => { const day = t => new Date(t).toDateString(); return planOrder(now).some(u => (u.state.r.cps || []).some(c => c.skip && day(c.at) === day(now))); };
function planTodayItems(now = Date.now()){
  const lead = [], later = [];
  if (!planActive()) return { lead, later };
  planFoldExam(now);
  const m = planMockDue(now);
  if (m) lead.push({ kind:'plan', sub:'mock', n:m.n, base:(S.examHistory || []).length });
  const order = planOrder(now), cp = (u, skip) => ({ kind:'plan', sub:'checkpoint', unit:u.id, base:(u.state.r.cps || []).length, ...(skip ? { skip:true } : {}) });
  const fix = order.find(u => u.state.key === 'repair');
  if (fix) lead.push({ kind:'plan', sub:'repair', unit:fix.id, ids:fix.state.r.repair.slice(0, 8) });
  const cur = planCurrent(now), owed = order.find(u => u.state.key === 'ready' && !planTestOut(u));   // a unit with every card learned is owed its checkpoint, current or not
  if (cur && cur.state.key === 'ready') lead.push(cp(cur, planTestOut(cur)));
  else if (owed) lead.push(cp(owed));
  planNextCards(planNewPerDay(), now).forEach(id => lead.push({ kind:'next', id, unit:pathUnitOf(byId(id)) }));
  const out = now - planStart() >= PLAN_SKIP_AFTER_DAYS * PLAN_DAY && !planSkipToday(now) && order.find(u => (!cur || u.id !== cur.id) && planTestOut(u));
  if (out) later.push(cp(out, true));
  return { lead, later };
}
const planTodayItem = (now = Date.now()) => planTodayItems(now).lead.find(it => it.kind === 'plan') || null;
/* a plan row Today already shows that still makes sense after the plan changed mid-day */
function planItemLive(it, now = Date.now()){
  const u = it.unit && planOrder(now).find(x => x.id === it.unit);
  if (it.sub === 'checkpoint') return !!u && u.state.key === 'ready' && !!it.skip === planTestOut(u);
  if (it.sub === 'repair') return !!u && u.state.key === 'repair';
  return false;
}
function planItemDone(it){
  if (it.sub === 'mock') return (S.examHistory || []).length > (it.base || 0);
  if (it.sub === 'repair') return planRepairDone(it.unit);
  if (it.sub === 'checkpoint') return (planUnitRec(it.unit).cps || []).length > (it.base || 0);
  return true;
}
const planUnitName = id => (PATH_UNIT[id] || { name:'' }).name;
function planItemRow(it){
  if (it.skip) return { t:'Skip ahead: ' + planUnitName(it.unit), sub:'Placement says you know it · pass ' + cpNeed(CP_N) + ' of ' + CP_N + ' to close it early' };
  if (it.sub === 'mock') return { t:'Mock exam ' + it.n, sub:MOCK_N + ' questions · timed like the real test' };
  if (it.sub === 'repair') return { t:'Repair: ' + planUnitName(it.unit), sub:it.ids.length + ' missed card' + (it.ids.length === 1 ? '' : 's') + ' · about ' + Math.max(2, it.ids.length) + ' min' };
  return { t:'Checkpoint: ' + planUnitName(it.unit), sub:CP_N + ' questions · pass with ' + cpNeed(CP_N) };
}
function planItemHero(it){
  if (it.skip) return { label:'STUDY PATH · SKIP AHEAD', title:planUnitName(it.unit), what:'Placement says you already know this unit. Get ' + cpNeed(CP_N) + ' of ' + CP_N + ' right to close it early.', cta:'TAKE THE CHECKPOINT' };
  if (it.sub === 'mock') return { label:'STUDY PATH · MOCK EXAM', title:'Mock exam ' + it.n, what:MOCK_N + ' questions from every subject, timed. The results re-rank your plan.', cta:'START THE MOCK' };
  if (it.sub === 'repair') return { label:'STUDY PATH · REPAIR', title:'Fix ' + planUnitName(it.unit), what:'Go over the ' + it.ids.length + ' card' + (it.ids.length === 1 ? '' : 's') + ' you missed in the checkpoint. Then retake it.', cta:'START REPAIR' };
  return { label:'STUDY PATH · CHECKPOINT', title:planUnitName(it.unit), what:CP_N + ' questions. Get ' + cpNeed(CP_N) + ' right to close this unit.', cta:'TAKE THE CHECKPOINT' };
}
function planItemGo(it){
  if (it.sub === 'mock') { if (typeof startExam === 'function') { startExam(MOCK_N); S.exam.mock = it.n; save(); examOpen(); } return; }
  if (it.sub === 'repair') { const q = it.ids.filter(id => byId(id)); if (q.length > 1 && typeof startSession === 'function') startSession(q[0], { review:true, name:'Repair', queue:q }); else if (q[0]) startSession(q[0]); return; }
  cpOpen(it.unit);
}

/* ---------- the checkpoint page: a full-screen layer, in the placement check's look ---------- */
let cpState = null;
function cpOpen(unitId){
  const items = pickCheckpoint(unitId);
  if (!items.length) { if (typeof toast === 'function') toast('No questions for this unit yet', 'check'); return; }
  cpState = { unit:unitId, items, answers:{}, at:0, result:null };
  cpRender();
}
function cpClose(){ cpState = null; document.getElementById('cp-root')?.remove(); document.getElementById('shell')?.removeAttribute('aria-hidden'); refresh(); }
function cpRender(){
  let el = document.getElementById('cp-root');
  if (!el) { el = document.createElement('div'); el.id = 'cp-root'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Checkpoint'); document.body.appendChild(el); }
  document.getElementById('shell')?.setAttribute('aria-hidden', 'true');
  const x = cpState, name = planUnitName(x.unit);
  if (x.result) {
    const R = x.result, need = cpNeed(R.total), miss = x.items.map((it, i) => ({ it, i, ans:x.answers[i] })).filter(m => m.ans !== m.it.a);
    const L = (m, v) => 'ABCDEF'[m.it.c.indexOf(v)] + '. ' + esc(v);
    const next = planCurrent(), order = planOrder(), closedN = order.filter(u => u.state.key === 'closed').length;
    const retry = new Date(planUnitRec(x.unit).retryAt || Date.now()).toLocaleDateString(undefined, { weekday:'long' });
    el.innerHTML = `<div class="spth sp-result"><span class="sp-lbl">CHECKPOINT · ${esc(name.toUpperCase())}</span>
      <h2>${R.right} of ${R.total}. ${R.pass ? 'Unit closed!' : R.skip ? 'Not this time.' : 'Not yet.'}</h2>
      <div class="sp-counts"><span class="sp-stamp ${R.pass ? 'strong' : R.skip ? 'shaky' : 'new'}">${R.pass ? 'Passed' : 'Need ' + need}</span></div>
      ${R.pass ? `<div class="cp-closed"><b>${closedN} of ${order.length} units closed</b><div class="pl-bar" aria-hidden="true"><i style="width:${Math.round(closedN / Math.max(1, order.length) * 100)}%"></i></div></div>` : ''}
      <p class="sp-pace">${R.pass ? `This unit moves to review only.${next ? ' Next up: ' + esc(next.name) + '.' : ' Every unit is closed. Keep reviewing and take your mock exams.'}`
        : R.skip ? `No harm done. You'll learn ${esc(name)} card by card, and its checkpoint comes at the end like any other unit.`
        : `Plan change: a repair review of the ${R.missed.length} card${R.missed.length === 1 ? '' : 's'} you missed is on Today's plan, then a retake with different questions from ${esc(retry)}.`}</p>
      ${miss.length ? `<h3 class="cp-h">What you missed</h3>${miss.map(m => `<details class="cp-q"><summary>${esc(typeof examText === 'function' ? examText(m.it) : m.it.q)}</summary>
        <p><em>Your answer:</em> ${L(m, m.ans)}</p><p class="cp-ok">Right answer: ${L(m, m.it.a)}</p>${m.it.w ? `<p class="cp-why">${esc(m.it.w)}</p>` : ''}</details>`).join('')}` : ''}
      <button class="btn-big gold" data-act="cp-done">${R.pass || R.skip ? 'BACK TO MY PATH' : 'START REPAIR NOW'}</button>
      ${R.pass || R.skip ? '' : `<button class="sp-back" data-act="cp-later">Later, as planned</button>`}</div>`;
    if (R.pass && !x.cheered) { x.cheered = true; if (typeof confetti === 'function') confetti(el); if (typeof nativeFeedback === 'function') nativeFeedback('levelup'); }
  } else {
    const i = x.at, it = x.items[i], topic = typeof examTopic === 'function' ? examTopic(it) : '';
    el.innerHTML = `<div class="spth sp-quiz"><div class="sp-qtop"><span class="sp-lbl">CHECKPOINT · ${i + 1} OF ${x.items.length}</span><button class="sp-later" data-act="cp-quit">Quit</button></div>
      <div class="sp-prog" aria-hidden="true"><i style="width:${Math.round(i / x.items.length * 100)}%"></i></div>
      <p class="cp-unit">${esc(name)} · get ${cpNeed(x.items.length)} right to pass</p>
      <section class="sp-sheet" aria-live="polite">${topic ? `<p class="sp-topic">${esc(topic)}</p>` : ''}<p class="sp-q">${esc(typeof examText === 'function' ? examText(it) : it.q)}</p>
        ${it.st ? `<ol class="sp-st">${it.st.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}</section>
      <div class="sp-choices">${it.c.map((c, k) => `<button class="sp-choice" data-act="cp-ans" data-k="${k}"><span>${'ABCDEF'[k]}</span>${esc(c)}</button>`).join('')}</div></div>`;
  }
  el.scrollTop = 0;
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-act^="cp-"],[data-act^="pl-"]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'cp-ans' && cpState && !cpState.result) {
    const it = cpState.items[cpState.at]; cpState.answers[cpState.at] = it.c[+t.dataset.k]; cpState.at++;
    if (cpState.at >= cpState.items.length) { cpState.result = finishCheckpoint(cpState); save(); }
    cpRender(); return;
  }
  if (a === 'cp-quit') { cpClose(); return; }
  if (a === 'cp-later') { cpClose(); return; }
  if (a === 'cp-done') { const x = cpState; cpClose(); if (x && x.result && !x.result.pass && !x.result.skip) planItemGo({ sub:'repair', unit:x.unit, ids:x.result.missed }); else if (typeof push === 'function') push('studypath'); return; }
  if (a === 'pl-cp') { cpOpen(t.dataset.u); return; }
  if (a === 'pl-repair') { planItemGo({ sub:'repair', unit:t.dataset.u, ids:planUnitRec(t.dataset.u).repair || [] }); return; }
  if (a === 'pl-mock') { planItemGo({ sub:'mock', n:+t.dataset.n }); return; }
  if (a === 'pl-min') { S.path.minutes = +t.dataset.m; save(); refresh(); return; }
  if (a === 'pl-today') { if (typeof switchTab === 'function') switchTab('home'); return; }
  if (a === 'pl-learn') { const id = t.dataset.id; if (id && typeof studyCard === 'function') studyCard(id); return; }
});
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'pl-date') return;
  S.path.date = e.target.value; S.path.when = e.target.value ? 'date' : 'none'; save(); refresh();
});

/* ---------- the Study Path screen ---------- */
const PLAN_DOT = { closed:'done', ready:'gate', repair:'fix', wait:'fix', learning:'now', todo:'' };
function planScreen(){
  if (!planActive()) return { title:'Study Path', body:`<div class="pl"><p class="pl-lead">Take the placement check to get a study plan built around you.</p>
    <button class="btn-big gold" data-act="sp-retake">TAKE THE PLACEMENT CHECK</button></div>` };
  planFoldExam();
  if (S.path.r0 == null) S.path.r0 = Recall.readiness();
  const now = Date.now(), p = S.path, order = planOrder(now), curU = planCurrent(now), cur = curU && order.find(u => u.id === curU.id);
  const days = pathDaysLeft(), pace = pathPacing(now), g = planGoal(now), rd = Recall.readiness();
  const track = (EXAM_TRACKS[examTrack()] || {}).short || 'Court Clerk';
  const closed = order.filter(u => u.state.key === 'closed').length;
  const cardsAll = order.reduce((n, u) => n + u.cards.length, 0), cardsLearned = order.reduce((n, u) => n + u.state.learned, 0);
  const mocks = planMocks(), taken = examsSince(planStart()).length;
  const fmt = t => new Date(t).toLocaleDateString(undefined, { month:'short', day:'numeric' });
  const learnU = planLearnUnit(now), nextFresh = u => learnU && u.id === learnU.id ? planFresh(u)[0] : null;
  const node = u => {
    const s = u.state, cps = s.r.cps || [], lastCp = cps[cps.length - 1];
    let sub, btn = '';
    if (s.key === 'closed') sub = `Closed${lastCp ? ' · checkpoint ' + lastCp.right + '/' + lastCp.total : ''}`;
    else if (s.key === 'repair') { sub = `Missed the checkpoint · repair ${s.r.repair.length} card${s.r.repair.length === 1 ? '' : 's'}`; btn = `<button class="pl-btn" data-act="pl-repair" data-u="${u.id}">Repair</button>`; }
    else if (s.key === 'wait') sub = `Repair done · retake from ${new Date(s.r.retryAt).toLocaleDateString(undefined, { weekday:'short' })}`;
    else if (s.key === 'ready') { sub = s.learned < u.cards.length ? `Placement says Strong · skip ahead` : (u.cards.length === 1 ? 'Card learned' : `All ${u.cards.length} cards learned`); btn = `<button class="pl-btn gold" data-act="pl-cp" data-u="${u.id}">Checkpoint</button>`; }
    else { sub = `${s.learned} of ${u.cards.length} cards learned · rated ${PATH_STATUS[s.st]}`; const f = nextFresh(u); if (f) btn = `<button class="pl-btn" data-act="pl-learn" data-id="${f}">Learn next</button>`; }
    return `<li class="pl-node ${u === cur ? 'cur' : ''}"><span class="pl-dot ${PLAN_DOT[s.key] || ''}" aria-hidden="true"></span>
      <span class="pl-main"><b>${esc(u.name)}</b><small>${sub} · ${Math.max(1, Math.round(u.share * 100))}% of exam</small></span>${btn}</li>`;
  };
  // the two mocks sit in the list where their dates fall: after the units expected to close by then (simple: after half, then at the end)
  const half = Math.ceil(order.length / 2);
  const mockNode = m => { const done = taken >= m.n, due = !done && m.at <= now;
    return `<li class="pl-node pl-mock"><span class="pl-dot gate ${done ? 'done' : ''}" aria-hidden="true"></span>
      <span class="pl-main"><b>Mock exam ${m.n}</b><small>${done ? 'Taken' : due ? 'Due now' : 'Around ' + fmt(m.at)} · ${MOCK_N} questions, timed</small></span>
      ${due ? `<button class="pl-btn gold" data-act="pl-mock" data-n="${m.n}">Start</button>` : ''}</li>`; };
  const list = [...order.slice(0, half).map(node), mockNode(mocks[0]), ...order.slice(half).map(node), mockNode(mocks[1])].join('');
  const paceLine = !pace.toLearn ? 'Nothing new left to learn. Keep reviewing and take your mock exams.'
    : pace.ok ? `On pace: ${pace.toLearn} cards left, about ${pace.need} a day. ${p.minutes} minutes a day covers it.`
    : `Behind: ${pace.toLearn} cards left is about ${pace.need} a day, more than ${p.minutes} minutes a day fits.`;
  const behind = pace.toLearn && !pace.ok;
  const lowest = behind ? order.filter(u => u.state.key !== 'closed').slice(-3).map(u => u.name) : [];
  return { title:'Study Path', body:`<div class="pl">
    <div class="pl-head"><span class="sp-lbl">${esc(track.toUpperCase())} · ${days == null ? '8-WEEK PLAN · ' + pace.days + ' DAY' + (pace.days === 1 ? '' : 'S') + ' LEFT' : days === 0 ? 'EXAM TODAY' : days + ' DAY' + (days === 1 ? '' : 'S') + ' TO GO'}</span>
      <b>Week ${g.week} of ${g.weeks}${cur ? ': ' + esc(cur.name) : ''}</b>
      <div class="pl-bar" aria-label="Readiness ${Math.round(rd * 100)} percent, goal ${Math.round(g.goal * 100)}"><i style="width:${Math.round(rd * 100)}%"></i><em style="left:${Math.round(g.goal * 100)}%"></em></div>
      <small>Readiness ${Math.round(rd * 100)}% · this week's goal ${Math.round(g.goal * 100)}%</small>
      <small>${closed} of ${order.length} units closed · ${cardsLearned} of ${cardsAll} cards learned</small></div>
    <button class="btn-big gold" data-act="pl-today">TODAY'S SESSION</button>
    <div class="pl-pace ${behind ? 'behind' : ''}"><p>${esc(paceLine)}</p>
      ${behind ? `<p>Pick one: more minutes a day, or let the last units go: ${esc(lowest.join(', '))}. They're the least tested, so they come last anyway.</p>` : ''}
      <div class="pl-mins">${PATH_MINUTES.map(m => `<button class="${p.minutes === m ? 'on' : ''}" data-act="pl-min" data-m="${m}">${m} min</button>`).join('')}</div></div>
    <h3 class="pl-h">Your path</h3>
    <ol class="pl-path">${list}</ol>
    <h3 class="pl-h">Exam date</h3>
    <label class="sp-date pl-date"><span>${p.date ? 'Change it if it moves.' : 'Add it when you have it, and the plan re-paces.'}</span><input id="pl-date" type="date" value="${esc(p.date || '')}"></label>
    <button class="sp-row" data-act="sp-retake"><b>Retake the placement check</b><small>Redraws your starting map. Cards you've learned stay learned.</small></button>
  </div>` };
}
const PLAN_SCREENS = { studypath:planScreen };

/* the Study tab's Up Next for Study Path players: the current unit's next new cards, the same ones Today offers */
function planUpNextHTML(){
  if (!planActive()) return '';
  const u = planLearnUnit(), ids = planNextCards(5);
  if (!u || !ids.length) return '';
  const row = id => { const c = byId(id); return c ? `<button class="row" data-act="study" data-id="${c.id}">${typeof thumb === 'function' ? thumb(c) : ''}
    <span class="row-main"><b>${esc(c.name)}</b><small>New card · 5 questions</small></span>${typeof chev !== 'undefined' ? chev : '›'}</button>` : ''; };
  return `<div class="sec-h"><span>Up Next · ${esc(u.name)}</span><button class="sec-link" data-act="push" data-s="studypath" style="white-space:nowrap">See path</button></div><div class="list">${ids.map(row).join('')}</div>`;
}

/* a row on Home that opens the path */
function planBannerHTML(){
  if (!planActive()) return '';
  const cur = planCurrent(), g = planGoal(), pace = pathPacing(), d = pace.days;
  const where = !cur ? 'All units closed' : esc(cur.name) + ' · ' + planUnitProgress(cur);
  const behind = pace.toLearn && !pace.ok;
  return `<button class="pl-banner ${behind ? 'behind' : ''}" data-act="push" data-s="studypath"><span><b>Study Path · week ${g.week} of ${g.weeks}</b>
    <small>${where} · ${d} day${d === 1 ? '' : 's'} ${pace.dated ? 'to go' : 'left in the plan'}</small>
    ${behind ? `<small class="pl-warn">Behind pace: about ${pace.need} new cards a day needed</small>` : ''}</span>${typeof chev !== 'undefined' ? chev : '›'}</button>`;
}
/* one short line for a unit's progress, the same words everywhere: banner, round results */
function planUnitProgress(u){
  const s = u.state, n = u.cards.length;
  if (s.key === 'closed') return 'closed';
  if (s.key === 'repair') return 'repair due';
  if (s.key === 'wait') return 'retake soon';
  if (s.key === 'ready') return planTestOut(u) ? 'skip ahead ready' : 'checkpoint ready';
  return s.learned + ' of ' + n + ' card' + (n === 1 ? '' : 's') + ' learned';
}

/* the round results for a Study Path card: its unit's progress, and how much of Today is done (index.html renderResults) */
function planResultsHTML(id){
  if (!planActive()) return '';
  const uid = pathUnitOf(byId(id)), u = planOrder().find(x => x.id === uid); if (!u) return '';
  const n = u.cards.length, k = Math.min(n, u.state.learned), key = u.state.key;
  const line = key === 'ready' && !planTestOut(u) ? `All ${n} card${n === 1 ? '' : 's'} learned · checkpoint unlocked` : planUnitProgress(u).replace(/^./, ch => ch.toUpperCase());
  const t = typeof todayCount === 'function' ? todayCount() : null;
  const today = t && t.total ? (t.done >= t.total ? 'Done for today ✓' : `Today's plan · ${t.done} of ${t.total} done`) : '';
  return `<div class="pl-res"><small>STUDY PATH · ${esc(u.name.toUpperCase())}</small><b>${esc(line)}</b>
    <div class="pl-bar" aria-hidden="true"><i style="width:${key === 'closed' ? 100 : Math.round(k / Math.max(1, n) * 100)}%"></i></div>
    ${today ? `<small class="${t.done >= t.total ? 'pl-ok' : ''}">${today}</small>` : ''}</div>`;
}

const PLAN_CSS = `
#cp-root{position:fixed;inset:0;z-index:900;background:var(--bg);display:flex;overflow-y:auto}
.cp-unit{margin:0;font:16px "Patrick Hand";color:var(--sub)}
.cp-h{margin:6px 0 0;font:400 20px "Bangers";letter-spacing:.04em}
.cp-closed{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:14px;background:var(--bg2);border:.5px solid var(--line);font:18px "Patrick Hand"}
.cp-closed .pl-bar i{background:#5fd47a}
.cp-q{padding:10px 12px;border-radius:12px;background:var(--bg2);border:.5px solid var(--line);font:17px/1.3 "Patrick Hand"}
.cp-q summary{cursor:pointer;font:17px/1.3 "Patrick Hand";text-transform:none;letter-spacing:0}
.cp-q p{margin:6px 0 0}.cp-ok{color:#5fd47a}.cp-why{color:var(--sub)}
.pl{display:flex;flex-direction:column;gap:12px;color:var(--paper)}
.pl-lead{font:19px/1.3 "Patrick Hand";color:var(--sub);margin:0}
.pl-head{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:16px;background:var(--bg2);border:.5px solid var(--line)}
.pl-head>b{font:400 24px/1.05 "Bangers";letter-spacing:.04em}
.pl-head small{font:15px/1.2 "Patrick Hand";color:var(--sub)}
.pl-bar{position:relative;height:10px;border-radius:5px;background:var(--line)}
.pl-bar i{display:block;height:100%;border-radius:5px;background:var(--mustard)}
.pl-bar em{position:absolute;top:-4px;width:3px;height:18px;margin-left:-1px;border-radius:2px;background:var(--paper)}
.pl-pace{padding:12px 14px;border-radius:14px;background:var(--bg2);border:.5px solid var(--line);font:18px/1.3 "Patrick Hand"}
.pl-pace.behind{border-color:rgba(239,123,107,.6)}
.pl-pace p{margin:0 0 8px}
.pl-mins{display:flex;gap:8px}
.pl-mins button{flex:1;min-height:40px;border-radius:10px;border:1px solid rgba(241,229,201,.25);background:none;color:var(--paper);font:400 17px "Bangers";letter-spacing:.04em}
.pl-mins button.on{border:2px solid var(--mustard);color:var(--mustard)}
.pl-h{margin:8px 0 0;font:400 22px "Bangers";letter-spacing:.04em}
.pl-path{list-style:none;margin:0;padding:0}
.pl-node{position:relative;display:flex;align-items:center;gap:12px;padding:10px 0 10px 0}
.pl-node::before{content:"";position:absolute;left:11px;top:0;bottom:0;width:2px;background:var(--line)}
.pl-node:first-child::before{top:50%}.pl-node:last-child::before{bottom:50%}
.pl-dot{position:relative;z-index:1;flex:none;width:24px;height:24px;border-radius:12px;border:2px solid rgba(241,229,201,.3);background:var(--bg)}
.pl-dot.done{background:#5fd47a;border-color:#5fd47a}
.pl-dot.now{border-color:var(--mustard)}
.pl-node.cur .pl-dot{box-shadow:0 0 0 5px rgba(227,178,60,.25);border-color:var(--mustard)}
.pl-dot.gate{border-radius:6px;border-color:var(--mustard)}
.pl-dot.gate.done{background:#5fd47a;border-color:#5fd47a}
.pl-dot.fix{border-color:#ef7b6b}
.pl-main{flex:1;min-width:0;display:flex;flex-direction:column}
.pl-main b{font:19px/1.15 "Patrick Hand";font-weight:400}
.pl-node.cur .pl-main b{color:var(--mustard)}
.pl-main small{font:14px/1.2 var(--ui);color:var(--sub)}
.pl-mock .pl-main b{font:400 19px "Bangers";letter-spacing:.04em}
.pl-btn{flex:none;min-height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(241,229,201,.3);background:var(--bg2);color:var(--paper);font:400 16px "Bangers";letter-spacing:.05em}
.pl-btn.gold{background:var(--mustard);border-color:var(--mustard);color:var(--ink)}
.pl-date input{max-width:240px}
.pl-banner{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 12px;padding:12px 14px;border-radius:16px;border:1.5px solid var(--mustard);background:rgba(227,178,60,.08);color:var(--paper);text-align:left}
.pl-banner span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.pl-banner b{font:400 20px/1 "Bangers";letter-spacing:.04em;color:var(--mustard)}
.pl-banner small{font:16px/1.2 "Patrick Hand";opacity:.85}
.pl-banner.behind{border-color:#ef7b6b}
.pl-banner small.pl-warn{color:#ef7b6b;opacity:1}
.pl-res{display:flex;flex-direction:column;gap:6px;margin:14px 0 4px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--mustard);background:rgba(227,178,60,.08);text-align:left}
.pl-res small{font:15px/1.2 "Patrick Hand";opacity:.85}.pl-res small.pl-ok{color:#5fd47a;opacity:1}
.pl-res b{font:400 20px/1.1 "Bangers";letter-spacing:.04em;color:var(--mustard)}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${PLAN_CSS}</style>`);
