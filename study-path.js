/* Study Path, part 1: the front door for new players. Intake (which exam, when, minutes a day, background), then a short
   placement check across every unit of that exam, then a starting map that says which units are Strong, Shaky or New.
   The map steers "next card" (today.js) toward the weakest, most-tested units, and confident right answers skip a card
   ahead in recall so it comes back as review instead of being taught from scratch.
   Design: https://claude.ai/artifact/D5LbbmB2mGJmN6CWktF7Sy (jack picked "the plan is the front door", 2026-11-26).
   Saved in S.path = { v, track, date, minutes, bg, stage:'intake'|'placement'|'done', step, place:{ items, answers, at }, map, doneAt }.
   Shown in #wl-root (the welcome's overlay) so the plain test and sign-in links behave as they did on the welcome.
   Loaded after plain-test.js; runs at call time on the app's globals (S, CARDS, save, esc, refresh, byId, Recall, Weak, onb,
   endWelcome, showWelcome, welcomeVisualHTML, brandHTML, openPack, openSignIn, cloudUser, examPool, examWeights, examLaw,
   examLongest, examText, examTopic, citesIn, cardOnTrack, setExamTrack, examTrack, EXAM_TRACKS, ICO, toast). */

const PATH_N = 24;                       // placement questions
const PATH_UNIT_MAX = 3;                 // most questions one unit gets
const PATH_DEFAULT_DAYS = 56;            // "not scheduled yet" plans for 8 weeks
const PATH_MINUTES = [10, 20, 40];
const PATH_NEW_PER_DAY = { 10:1, 20:2, 40:4 };   // new cards a day each time budget fits, with review and practice around them

/* Units: a few related law areas each, in teaching order. A card joins the unit of the first law it cites; a card that cites
   no law (court terms, papers) joins "terms". Units with no card on the chosen exam drop out. */
const PATH_UNITS = [
  { id:'terms',        name:'Court terms and papers',                      laws:['OTHER'] },
  { id:'rules',        name:'Uniform Rules: calendars and court rules',    laws:['UR'] },
  { id:'crim-start',   name:'Starting a criminal case',                    laws:['CPL'], arts:['1','10','30','100','110','120','140','150'] },
  { id:'crim-arraign', name:'Arraignment, release and bail',               laws:['CPL'], arts:['160','170','180','500','510','520','530'] },
  { id:'crim-gj',      name:'Grand jury and indictment',                   laws:['CPL'], arts:['190','195','200','210'] },
  { id:'crim-trial',   name:'Motions, pleas and trial',                    laws:['CPL'], arts:['216','220','240','245','250','255','260','270','280','290','300','310','320','330','340','350','360'] },
  { id:'crim-after',   name:'Sentencing, appeals and special cases',       laws:['CPL'], arts:['380','390','400','410','420','430','440','450','460','470','540','550','620','690','720','722','725','730'] },
  { id:'civ-start',    name:'Starting a civil case: time, service, venue', laws:['CPLR'], arts:['1','2','3','4','5','6','10','11','12'] },
  { id:'civ-papers',   name:'Papers, motions and subpoenas',               laws:['CPLR'], arts:['20','21','22','23','30','31','32','34'] },
  { id:'civ-trial',    name:'Trial, judgment and costs',                   laws:['CPLR'], arts:['40','41','42','43','44','45','50','51','54','55','80','81','82','83'] },
  { id:'civ-enforce',  name:'Enforcing judgments and Article 78',          laws:['CPLR'], arts:['52','62','63','63-A','70','78'] },
  { id:'fam-core',     name:'Family Court basics and support',             laws:['FCA'], arts:['1','2','4','5','5-B','11'] },
  { id:'fam-cases',    name:'Juvenile, custody and family offense cases',  laws:['FCA'], arts:['3','6','7','8'] },
  { id:'fam-child',    name:'Child protection',                            laws:['FCA'], arts:['10','10-A','10-B','10-C'] },
  { id:'penal',        name:'Penal Law basics',                            laws:['PL'] },
  { id:'other',        name:'Other laws: mental hygiene, traffic, housing, family', laws:['MHL','VTL','RPAPL','DRL','SSL','CORR','EXEC'] },
];
const PATH_UNIT = Object.fromEntries(PATH_UNITS.map(u => [u.id, u]));
const PATH_STATUS = { strong:'Strong', shaky:'Shaky', new:'New' };

/* ---------- which unit a card belongs to ---------- */
const pathCardCite = c => [c && c.source && c.source.cite, c && c.cite, c && c.law].filter(Boolean).join('; ');
function pathUnitOf(c){
  if (!c) return 'other';
  const cite = typeof citesIn === 'function' ? citesIn(pathCardCite(c))[0] : null;
  const law = cite ? cite.law : (typeof examLaw === 'function' ? examLaw(c) : 'OTHER');
  const art = cite ? String(cite.art).toUpperCase() : '';
  const inLaw = PATH_UNITS.filter(u => u.laws.includes(law));
  if (!inLaw.length) return 'other';
  return (inLaw.find(u => !u.arts || u.arts.includes(art)) || inLaw[0]).id;
}

/* the chosen exam's study cards by unit, and each unit's share of the exam (its law's weight, split by card count) */
function pathUnits(){
  const cards = CARDS.filter(c => !c.gen && Array.isArray(c.bank) && c.bank.length && (typeof cardOnTrack !== 'function' || cardOnTrack(c)));
  const by = {}; cards.forEach(c => (by[pathUnitOf(c)] = by[pathUnitOf(c)] || []).push(c.id));
  const W = typeof examWeights === 'function' ? examWeights() : {};
  const lawOf = id => { const c = byId(id); const cite = typeof citesIn === 'function' ? citesIn(pathCardCite(c))[0] : null; return cite ? cite.law : (typeof examLaw === 'function' ? examLaw(c) : 'OTHER'); };
  const lawCards = {}; cards.forEach(c => { const l = lawOf(c.id); lawCards[l] = (lawCards[l] || 0) + 1; });
  const list = PATH_UNITS.filter(u => by[u.id]).map(u => {
    const ids = by[u.id], perLaw = {}; ids.forEach(id => { const l = lawOf(id); perLaw[l] = (perLaw[l] || 0) + 1; });
    const weight = Object.entries(perLaw).reduce((n, [l, k]) => n + (W[l] || W.OTHER || 1) * k / lawCards[l], 0);
    return { ...u, cards:ids, weight };
  });
  const total = list.reduce((n, u) => n + u.weight, 0) || 1;
  list.forEach(u => { u.share = u.weight / total; });
  return list;
}

/* ---------- state ---------- */
function pathState(){
  const p = S.path = S.path && typeof S.path === 'object' ? S.path : {};
  if (!p.v) Object.assign(p, { v:1, stage:'intake', step:0 });
  return p;
}
const pathDone = () => !!(S.path && S.path.stage === 'done' && S.path.map);
function pathDaysLeft(now = Date.now()){
  const p = S.path || {};
  if (!p.date) return null;
  const d = new Date(p.date + 'T09:00:00'); if (isNaN(d)) return null;
  return Math.max(0, Math.ceil((d - now) / 864e5));
}

/* ---------- picking the placement questions ---------- */
/* 1 question for every unit, the rest by each unit's share of the exam, at most PATH_UNIT_MAX per unit, one per card.
   New to courts: easier questions first; working clerks and repeat takers: harder ones first. Questions whose right answer
   is the longest choice go last, so length gives nothing away. */
function pickPlacement(n = PATH_N, rand = Math.random){
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const units = pathUnits(), pool = typeof examPool === 'function' ? examPool() : [];
  const hard = (S.path || {}).bg && S.path.bg !== 'new';
  const lv = p => +(p.q.lv || 1);
  const byUnit = {};
  shuf(pool).forEach(p => { const u = pathUnitOf(byId(p.cardId)); (byUnit[u] = byUnit[u] || []).push(p); });
  for (const u in byUnit) byUnit[u].sort((a, b) => (typeof examLongest === 'function' ? examLongest(a.q) - examLongest(b.q) : 0) || (hard ? lv(b) - lv(a) : lv(a) - lv(b)));
  const live = units.filter(u => byUnit[u.id] && byUnit[u.id].length);
  const want = {}; live.forEach(u => { want[u.id] = 1; });
  let left = n - live.length;
  // the rest by share, largest remainder first
  const raw = live.map(u => ({ id:u.id, x:u.share * Math.max(0, left) })).sort((a, b) => (b.x % 1) - (a.x % 1));
  raw.forEach(r => { const k = Math.min(Math.floor(r.x), PATH_UNIT_MAX - want[r.id]); want[r.id] += k; left -= k; });
  for (const r of raw) { if (left <= 0) break; if (want[r.id] < PATH_UNIT_MAX) { want[r.id]++; left--; } }
  const picked = [];
  live.forEach(u => {
    const seen = new Set();
    for (const p of byUnit[u.id]) {
      if (picked.filter(x => x.unit === u.id).length >= want[u.id]) break;
      if (seen.has(p.cardId)) continue;
      seen.add(p.cardId);
      picked.push({ unit:u.id, cardId:p.cardId, set:p.set, style:p.style, q:p.q.q, ...(Array.isArray(p.q.st) ? { st:p.q.st.slice() } : {}), c:shuf(p.q.c), a:p.q.a, w:p.q.w || '' });
    }
  });
  // mix the units so it doesn't read like a syllabus, but keep it stable once saved
  return shuf(picked).slice(0, n);
}

/* ---------- scoring ---------- */
/* Strong: every question right (at least 2). Shaky: some right. New: none right, or "I don't know". */
function scorePlacement(place){
  const tally = {};
  place.items.forEach((it, i) => {
    const t = tally[it.unit] = tally[it.unit] || { right:0, asked:0 };
    t.asked++; if (place.answers[i] === it.a) t.right++;
  });
  const map = {};
  Object.entries(tally).forEach(([u, t]) => { map[u] = t.right === 0 ? 'new' : t.right === t.asked && t.asked >= 2 ? 'strong' : 'shaky'; });
  return { map, tally };
}

/* a confident right answer moves the card to memory box 2 (review in about 3 days); a wrong one goes in the miss log.
   "I don't know" changes nothing: it is not a mistake, it is a card still to learn. */
function feedPlacement(place, now = Date.now()){
  const rec = S.recall = S.recall && typeof S.recall === 'object' ? S.recall : {};
  place.items.forEach((it, i) => {
    const ans = place.answers[i];
    if (ans === undefined || ans === '?') return;
    if (ans === it.a) {
      const r = rec[it.cardId] || { box:0, due:0, last:0, up:0, right:0, wrong:0 };
      rec[it.cardId] = { ...r, box:Math.max(r.box || 0, 2), right:(r.right || 0) + 1, last:now, up:now, due:now + 3 * 864e5 };
    } else if (typeof Weak === 'object' && Weak.logMiss) Weak.logMiss(it.cardId, it.q, ans, 'placement', false, now);
  });
}

/* how a unit ranks for "next card": its share of the exam, times how much there is to learn */
const PATH_NEED = { new:1, shaky:.6, strong:.1 };
function pathCardRank(c){
  if (!pathDone() || !c) return 0;
  const u = pathUnitOf(c), st = S.path.map[u] || 'new';
  const unit = (pathRankCache.track === examTrack() && pathRankCache.units) || (pathRankCache = { track:examTrack(), units:pathUnits() }).units;
  const share = (unit.find(x => x.id === u) || { share:0 }).share;
  return -(share * PATH_NEED[st]);    // lower sorts first
}
let pathRankCache = {};

/* the plan in numbers: cards to learn in Shaky and New units, days left, and what fits a day */
function pathPacing(now = Date.now()){
  const p = S.path || {}, units = pathUnits();
  const toLearn = units.filter(u => (p.map || {})[u.id] !== 'strong').reduce((n, u) => n + u.cards.filter(id => !((S.cards || {})[id] || {}).last).length, 0);
  const days = pathDaysLeft(now) ?? PATH_DEFAULT_DAYS;
  const need = days ? Math.ceil(toLearn / Math.max(1, days - 7)) : toLearn;    // the last week is for review and a mock exam
  const fits = PATH_NEW_PER_DAY[p.minutes] || 2;
  return { toLearn, days, need, fits, ok:need <= fits };
}

/* ---------- screens ---------- */
const PATH_EXAMS = [
  ['cc', 'Court Clerk', 'JG-20 · entry level'],
  ['acc', 'Associate Court Clerk', 'JG-24 · promotion'],
  ['pcc', 'Principal Court Clerk', 'JG-26 · promotion'],
  ['unsure', 'Not sure yet', 'Start on Court Clerk. You can change it any time.'],
];
const PATH_BG = [
  ['new', 'New to the courts', 'Start with the basics'],
  ['court', 'I work in a court now', 'Start with harder questions'],
  ['retake', "I've taken this exam before", 'Start with harder questions'],
];
const PATH_STEPS = 4;
let pathDateOpen = false;

function pathFrame(inner, cls = ''){ return `<div class="spth ${cls}">${inner}</div>`; }
const pathOpt = (act, val, on, b, small, attr = 'v') => `<button class="sp-opt ${on ? 'on' : ''}" role="radio" aria-checked="${!!on}" data-act="${act}" data-${attr}="${esc(String(val))}"><b>${esc(b)}</b>${small ? `<small>${esc(small)}</small>` : ''}</button>`;
const pathStepLbl = k => `<span class="sp-lbl">INTAKE · ${k} OF ${PATH_STEPS}</span>`;
const pathNav = (canNext, nextLabel = 'NEXT') => `<div class="sp-nav"><button class="btn-big gold" data-act="sp-next" ${canNext ? '' : 'disabled'}>${nextLabel}</button>
  <button class="sp-back" data-act="sp-back">Back</button></div>`;

function pathIntroHTML(){
  const signIn = typeof cloudUser === 'function' && !cloudUser() ? `<button class="wl-signin" data-act="wl-signin">I already have an account · Sign in</button>` : '';
  return `<div class="wl">${typeof brandHTML === 'function' ? brandHTML('small') : ''}${typeof welcomeVisualHTML === 'function' ? welcomeVisualHTML() : ''}
    <h2>Let's get you ready for your exam.</h2>
    <p>Four quick questions, a short placement check, and you'll know exactly where to start.</p>
    <button class="btn-big gold" data-act="sp-begin">BUILD MY STUDY PLAN</button>
    ${typeof ptOpen === 'function' ? `<button class="wl-signin wl-plain" data-act="pt-open">Just want a practice test? Skip the cards.</button>` : ''}
    <button class="wl-signin" data-act="sp-explore">Explore on my own</button>
    ${signIn}</div>`;
}

function pathIntakeHTML(){
  const p = pathState(), k = p.step;
  if (k === 1) return pathFrame(`${pathStepLbl(1)}<h2>Which exam are you studying for?</h2>
    <div class="sp-opts" role="radiogroup">${PATH_EXAMS.map(([v, b, s]) => pathOpt('sp-exam', v, p.exam === v, b, s)).join('')}</div>${pathNav(!!p.exam)}`);
  if (k === 2) {
    const pick = pathDateOpen || !!p.date;
    return pathFrame(`${pathStepLbl(2)}<h2>When is your exam?</h2>
      <div class="sp-opts" role="radiogroup">${pathOpt('sp-when', 'date', pick && p.when !== 'none', 'I have a date', '')}
        ${pick && p.when !== 'none' ? `<label class="sp-date"><span>Exam date</span><input id="sp-date" type="date" value="${esc(p.date || '')}" min="${new Date().toISOString().slice(0, 10)}"></label>` : ''}
        ${pathOpt('sp-when', 'none', p.when === 'none', 'Not scheduled yet', 'We\'ll plan for 8 weeks. Add the date when you have it.')}</div>
      ${pathNav(p.when === 'none' || !!p.date)}`);
  }
  if (k === 3) return pathFrame(`${pathStepLbl(3)}<h2>How long can you study a day?</h2>
    <div class="sp-opts sp-inline" role="radiogroup">${PATH_MINUTES.map(m => pathOpt('sp-min', m, p.minutes === m, m + ' min', m === 10 ? 'A coffee break' : m === 20 ? 'Recommended' : 'Serious push')).join('')}</div>
    ${pathNav(!!p.minutes)}`);
  if (k === 4) return pathFrame(`${pathStepLbl(4)}<h2>What's your background?</h2>
    <div class="sp-opts" role="radiogroup">${PATH_BG.map(([v, b, s]) => pathOpt('sp-bg', v, p.bg === v, b, s)).join('')}</div>${pathNav(!!p.bg)}`);
  return pathIntroHTML();
}

function pathPlaceIntroHTML(){
  const n = pathUnits().length;
  return pathFrame(`<span class="sp-lbl">PLACEMENT CHECK</span><h2>Let's see where you're starting.</h2>
    <ul class="sp-rules"><li>About ${PATH_N} questions from all ${n} parts of the exam, around 15 minutes.</li>
      <li>No clock, no hints, no score to beat. This only decides where your plan starts.</li>
      <li>Not sure? Tap <b>I don't know</b>. A lucky guess would put you in the wrong place.</li></ul>
    <div class="sp-nav"><button class="btn-big gold" data-act="sp-place-go">START THE CHECK</button><button class="sp-back" data-act="sp-back">Back</button></div>`);
}

function pathQuestionHTML(){
  const place = S.path.place, i = Math.min(place.at, place.items.length - 1), it = place.items[i];
  const pct = Math.round(i / place.items.length * 100), topic = typeof examTopic === 'function' ? examTopic(it) : '';
  const text = typeof examText === 'function' ? examText(it) : it.q;
  return pathFrame(`<div class="sp-qtop"><span class="sp-lbl">PLACEMENT CHECK · ${i + 1} OF ${place.items.length}</span><button class="sp-later" data-act="sp-later">Finish later</button></div>
    <div class="sp-prog" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <section class="sp-sheet" aria-live="polite">${topic ? `<p class="sp-topic">${esc(topic)}</p>` : ''}<p class="sp-q">${esc(text)}</p>
      ${it.st ? `<ol class="sp-st">${it.st.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}</section>
    <div class="sp-choices">${it.c.map((c, k) => `<button class="sp-choice" data-act="sp-ans" data-k="${k}"><span>${'ABCDEF'[k]}</span>${esc(c)}</button>`).join('')}
      <button class="sp-idk" data-act="sp-idk">I don't know</button></div>`, 'sp-quiz');
}

function pathResultHTML(){
  const p = S.path, units = pathUnits(), pace = pathPacing(), track = (EXAM_TRACKS[examTrack()] || {}).short || 'Court Clerk';
  const order = units.slice().sort((a, b) => pathCardRank(byId(a.cards[0])) - pathCardRank(byId(b.cards[0])));
  const first = order.find(u => p.map[u.id] !== 'strong') || order[0];
  const counts = { strong:0, shaky:0, new:0 }; units.forEach(u => counts[p.map[u.id] || 'new']++);
  const days = pathDaysLeft(), when = days == null ? 'No exam date yet, so this plans for 8 weeks.' : days === 0 ? 'Your exam is today.' : `Your exam is in ${days} day${days === 1 ? '' : 's'}.`;
  const paceLine = !pace.toLearn ? 'Every unit came back Strong. Your plan is review and practice exams.'
    : pace.ok ? `${pace.toLearn} cards to learn, about ${pace.need} a day. That fits ${p.minutes} minutes a day.`
    : `${pace.toLearn} cards to learn is about ${pace.need} a day, more than ${p.minutes} minutes fits. Try ${PATH_MINUTES.find(m => PATH_NEW_PER_DAY[m] >= pace.need) || 40} minutes, or start with the most-tested units below.`;
  const save = typeof cloudUser === 'function' && !cloudUser() ? `<button class="wl-signin" data-act="sp-save">Save my plan to an account</button>` : '';
  const packFirst = (S.packs || 0) > 0 && !(S.packsOpened || 0);
  return pathFrame(`<span class="sp-lbl">${esc(track.toUpperCase())} · STARTING MAP</span><h2>Here's where you're starting.</h2>
    <p class="sp-sub">From ${p.place.items.length} questions. It's a first read, and it sharpens as you study. ${esc(when)}</p>
    <div class="sp-counts"><span class="sp-stamp strong">${counts.strong} Strong</span><span class="sp-stamp shaky">${counts.shaky} Shaky</span><span class="sp-stamp new">${counts.new} New</span></div>
    <ul class="sp-map">${order.map(u => { const st = p.map[u.id] || 'new';
      return `<li class="${u === first ? 'first' : ''}"><span><b>${esc(u.name)}</b><small>${u.cards.length} card${u.cards.length === 1 ? '' : 's'} · about ${Math.max(1, Math.round(u.share * 100))}% of the exam${u === first ? ' · you start here' : ''}</small></span><i class="sp-stamp ${st}">${PATH_STATUS[st]}</i></li>`; }).join('')}</ul>
    <p class="sp-pace">${esc(paceLine)}</p>
    <button class="btn-big gold" data-act="sp-finish">${packFirst ? ICO('pack') + ' OPEN MY FIRST PACK' : 'START STUDYING'}</button>
    ${save}`, 'sp-result');
}

function pathHTML(){
  const p = pathState();
  if (p.stage === 'done') return pathResultHTML();
  if (p.stage === 'placement') return p.place && p.place.items && p.place.items.length ? pathQuestionHTML() : pathPlaceIntroHTML();
  return p.step ? pathIntakeHTML() : pathIntroHTML();
}
function showPath(){
  let el = document.getElementById('wl-root');
  if (!el) { el = document.createElement('div'); el.id = 'wl-root'; document.body.appendChild(el); }
  document.getElementById('shell')?.setAttribute('aria-hidden', 'true');
  el.innerHTML = pathHTML();
  el.scrollTop = 0;
  const h = el.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll:true }); }
}
function closePath(){ document.getElementById('wl-root')?.remove(); document.getElementById('shell')?.removeAttribute('aria-hidden'); refresh(); }

/* the old welcome becomes "Explore on my own"; everyone else who hasn't been welcomed gets the Study Path */
function pathFrontDoor(){
  if (onb().welcomed) return false;
  showPath(); return true;
}

/* start (or restart) the placement check with the current intake */
function pathStartPlacement(){
  const p = pathState();
  p.stage = 'placement'; p.place = { items:pickPlacement(), answers:{}, at:0, startedAt:Date.now() }; delete p.map;
  save(); showPath();
}
function pathAnswer(v){
  const p = S.path, place = p && p.place; if (!place) return;
  place.answers[place.at] = v; place.at++;
  if (place.at >= place.items.length) {
    const { map } = scorePlacement(place);
    pathUnits().forEach(u => { if (!map[u.id]) map[u.id] = 'new'; });   // units with no question yet are still to learn
    feedPlacement(place);
    p.map = map; p.stage = 'done'; p.doneAt = Date.now(); pathRankCache = {};
    if (typeof Recall === 'object' && Recall.readiness) p.r0 = Recall.readiness();   // the plan's weekly goals start here (study-plan.js)
    if (S.today) delete S.today;    // Today's plan rebuilds around the map
  }
  save(); showPath();
}

/* retake from the "Your exam" screen: keep the intake, redo the check */
function pathRetake(){ const p = pathState(); p.step = 1; p.stage = 'intake'; delete p.place; save(); showPath(); }

document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-act^="sp-"]'); if (!t) return;
  const p = pathState(), a = t.dataset.act;
  switch (a) {
    case 'sp-begin': p.step = 1; break;
    case 'sp-explore': document.getElementById('wl-root')?.remove(); if (typeof showWelcome === 'function') showWelcome(); return;
    case 'sp-exam': p.exam = t.dataset.v; if (typeof setExamTrack === 'function') setExamTrack(p.exam === 'unsure' ? 'cc' : p.exam); p.track = examTrack(); break;
    case 'sp-when': p.when = t.dataset.v; pathDateOpen = p.when === 'date'; if (p.when === 'none') p.date = ''; break;
    case 'sp-min': p.minutes = +t.dataset.v; break;
    case 'sp-bg': p.bg = t.dataset.v; break;
    case 'sp-next': if (p.step >= PATH_STEPS) { p.stage = 'placement'; delete p.place; } else p.step++; break;
    case 'sp-back':
      if (p.stage === 'placement') { p.stage = 'intake'; p.step = PATH_STEPS; }
      else p.step = Math.max(0, p.step - 1);
      break;
    case 'sp-place-go': pathStartPlacement(); return;
    case 'sp-ans': { const it = p.place.items[p.place.at]; pathAnswer(it.c[+t.dataset.k]); return; }
    case 'sp-idk': pathAnswer('?'); return;
    case 'sp-later': save(); closePath(); if (typeof toast === 'function') toast('Your placement check will pick up where you left off', 'check'); return;
    case 'sp-save': save(); if (typeof openSignIn === 'function') openSignIn('create'); return;
    case 'sp-retake': pathRetake(); return;
    case 'sp-finish': {
      const packFirst = (S.packs || 0) > 0 && !(S.packsOpened || 0);
      if (typeof endWelcome === 'function') endWelcome(); else closePath();
      if (packFirst && typeof openPack === 'function') openPack();
      return;
    }
    default: return;
  }
  save(); showPath();
});
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'sp-date') return;
  const p = pathState(); p.date = e.target.value; p.when = 'date'; save(); showPath();
});

/* a row on the "Your exam" screen: see the map, or take the check again */
function pathRowHTML(){
  if (!pathDone()) return `<button class="sp-row" data-act="sp-retake"><b>Take the placement check</b><small>About ${PATH_N} questions. Your study plan starts where you need it.</small></button>`;
  const units = pathUnits(), c = { strong:0, shaky:0, new:0 }; units.forEach(u => c[S.path.map[u.id] || 'new']++);
  return `<button class="sp-row" data-act="push" data-s="studypath"><b>Open my Study Path</b><small>Your units, checkpoints, mock exams and pace</small></button>
    <button class="sp-row" data-act="sp-retake"><b>Retake the placement check</b><small>Last result: ${c.strong} Strong · ${c.shaky} Shaky · ${c.new} New</small></button>`;
}

const PATH_CSS = `
.spth{flex:1;display:flex;flex-direction:column;gap:14px;width:100%;max-width:440px;margin:0 auto;padding:calc(28px + env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));color:var(--paper)}
.spth h2{margin:0;font:400 30px/1.05 "Bangers";letter-spacing:.04em;text-wrap:balance}
#wl-root h2:focus{outline:none}
.sp-lbl{font:600 12px var(--ui);letter-spacing:.14em;color:var(--mustard)}
.sp-sub,.sp-pace{margin:0;font:18px/1.3 "Patrick Hand";color:var(--sub)}
.sp-pace{color:var(--paper);padding:10px 12px;border-radius:12px;background:var(--bg2);border:.5px solid var(--line)}
.sp-opts{display:flex;flex-direction:column;gap:8px}
.sp-inline{flex-direction:row}
.sp-inline .sp-opt{flex:1;align-items:center;text-align:center}
.sp-opt{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:56px;padding:12px 14px;border:1px solid rgba(241,229,201,.25);border-radius:14px;background:var(--bg2);color:var(--paper);text-align:left}
.sp-opt b{font:400 21px/1 "Bangers";letter-spacing:.04em}
.sp-opt small{font:16px/1.2 "Patrick Hand";opacity:.8}
.sp-opt.on{border:2px solid var(--mustard);padding:11px 13px;background:rgba(227,178,60,.1)}
.sp-opt.on b{color:var(--mustard)}
.sp-date{display:flex;flex-direction:column;gap:4px;padding:0 4px;font:16px "Patrick Hand";color:var(--sub)}
.sp-date input{min-height:48px;padding:8px 12px;border-radius:12px;border:2px solid var(--mustard);background:var(--paper);color:var(--ink);font:20px "Patrick Hand";color-scheme:light}
.sp-nav{margin-top:auto;display:flex;flex-direction:column;gap:6px;padding-top:12px}
.sp-nav .btn-big[disabled]{opacity:.45}
.sp-back,.sp-later{border:0;background:none;color:var(--sub);font:18px "Patrick Hand";min-height:44px}
.sp-rules{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font:19px/1.3 "Patrick Hand"}
.sp-rules b{color:var(--mustard);font-weight:400}
.sp-qtop{display:flex;align-items:center;justify-content:space-between}
.sp-later{min-height:36px;font-size:16px}
.sp-prog{height:6px;border-radius:3px;background:var(--line);overflow:hidden}.sp-prog i{display:block;height:100%;background:var(--mustard);transition:width .25s}
.sp-sheet{padding:16px 16px 14px;border:2px solid var(--ink);border-radius:14px;background:var(--paper);color:var(--ink);box-shadow:0 4px 0 rgba(0,0,0,.35)}
.sp-topic{margin:0 0 6px;font:600 13px var(--ui);letter-spacing:.06em;color:var(--navy);text-transform:uppercase}
.sp-q{margin:0;font:21px/1.28 "Patrick Hand"}
.sp-st{margin:8px 0 0;padding-left:22px;font:19px/1.3 "Patrick Hand"}
.sp-choices{display:flex;flex-direction:column;gap:8px}
.sp-choice{display:flex;gap:10px;align-items:flex-start;min-height:52px;padding:10px 12px;border:1.5px solid rgba(241,229,201,.25);border-radius:14px;background:var(--bg2);color:var(--paper);font:19px/1.25 "Patrick Hand";text-align:left}
.sp-choice span{flex:none;width:26px;height:26px;border-radius:13px;background:var(--mustard);color:var(--ink);font:400 16px/26px "Bangers";text-align:center}
.sp-choice:active{border-color:var(--mustard)}
.sp-idk{margin-top:2px;min-height:48px;border:1.5px dashed rgba(241,229,201,.35);border-radius:14px;background:none;color:var(--sub);font:19px "Patrick Hand"}
.sp-counts{display:flex;gap:8px;flex-wrap:wrap}
.sp-stamp{display:inline-block;padding:3px 9px;border:2px solid currentColor;border-radius:6px;font:400 15px/1.1 "Bangers";letter-spacing:.08em;font-style:normal;text-transform:uppercase;transform:rotate(-3deg)}
.sp-stamp.strong{color:#5fd47a}.sp-stamp.shaky{color:var(--mustard)}.sp-stamp.new{color:#ef7b6b}
.sp-map{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.sp-map li{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:.5px solid var(--line)}
.sp-map li>span{flex:1;min-width:0}
.sp-map b{display:block;font:19px/1.15 "Patrick Hand";font-weight:400}
.sp-map small{display:block;font:14px/1.2 var(--ui);color:var(--sub)}
.sp-map li.first b{color:var(--mustard)}
.sp-result .btn-big{margin-top:6px}
.sp-row{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;margin-top:12px;padding:12px 14px;border:1px solid rgba(241,229,201,.25);border-radius:12px;background:var(--bg2);color:var(--paper);text-align:left}
.sp-row b{font:400 19px/1 "Bangers";letter-spacing:.04em;color:var(--mustard)}
.sp-row small{font:15px/1.2 "Patrick Hand";opacity:.8}
@media (prefers-reduced-motion:reduce){.sp-prog i{transition:none}}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${PATH_CSS}</style>`);
