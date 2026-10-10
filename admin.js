/* Clerk Quest admin view. Shown only to accounts on the server's admin list; the server checks
   again on every read (clerk_quest_is_admin / clerk_quest_admin_players). Player inspection is read-only;
   isolated tester fixtures do not save, and the separate Saved Account Controls section is explicit about mutations.
   Loaded before the main script; uses the app's globals (CARDS, LESSONS, STEPS, ART, esc, push, refresh, topEntry,
   chev, ICO, COIN, agoText) and window.CQCloud. */

const ADM = { is:false, checking:false, players:null, loading:false, err:'', checkSeq:0, playerSeq:0, quizChoice:null };
const adminDenied = title => ({ title:title || 'Admin', body:'<p class="empty">Admins only.</p>' });
const adminRoute = s => /^admin/.test(s || '') || s === 'rewardpreview' || s === 'glows';
function adminRefreshOrExit(){
  if (typeof topEntry !== 'function') return;
  const en = topEntry(); if (!en) return;
  if (!ADM.is && adminRoute(en.s)) {
    const stack = nav && nav.stacks && nav.stacks[nav.tab];
    if (stack) while (stack.length > 1 && adminRoute(stack[stack.length - 1].s)) stack.pop();
  }
  if (en.s === 'profile' || adminRoute(en.s)) refresh();
}
async function checkAdmin(){
  const seq = ++ADM.checkSeq, user = window.CQCloud && CQCloud.getUser();
  if (!user) { ADM.is = false; ADM.checking = false; ADM.players = null; adminRefreshOrExit(); return; }
  ADM.checking = true;
  let allowed = false;
  try { allowed = !!(await CQCloud.rpc('clerk_quest_is_admin')); } catch (_) { allowed = false; }
  if (seq !== ADM.checkSeq || !CQCloud.getUser() || CQCloud.getUser().id !== user.id) return;
  const changed = ADM.is !== allowed; ADM.is = allowed; ADM.checking = false;
  if (!allowed) ADM.players = null;
  if (changed || allowed) adminRefreshOrExit();
}
async function loadPlayers(){
  const user = window.CQCloud && CQCloud.getUser();
  if (!ADM.is || !user || ADM.loading) return;
  const seq = ++ADM.playerSeq, userId = user.id;
  ADM.loading = true; ADM.err = '';
  try {
    const players = await CQCloud.rpc('clerk_quest_admin_players') || [];
    if (seq === ADM.playerSeq && ADM.is && CQCloud.getUser()?.id === userId) ADM.players = players;
  } catch (e) {
    if (seq === ADM.playerSeq && ADM.is) ADM.err = CQCloud.friendlyError(e);
  }
  if (seq !== ADM.playerSeq) return;
  ADM.loading = false;
  const en = topEntry(); if (en && /^admin/.test(en.s)) refresh();
}
window.addEventListener('cq-cloud', e => {
  if (e.detail.status === 'signed-out') { ++ADM.checkSeq; ++ADM.playerSeq; ADM.is = false; ADM.checking = false; ADM.loading = false; ADM.players = null; adminRefreshOrExit(); return; }
  if (['signed-in', 'uploaded-local', 'synced'].includes(e.detail.status)) checkAdmin();
});

/* Profile: the Admin row, for admins only */
const profileAdminRow = () => ADM.is ? `<button class="row" data-act="push" data-s="admin"><span class="th emo gi">${ICO('stats')}</span>
  <span class="row-main"><b>Admin</b><small>Sign-ups, game check, and tester tools</small></span>${chev}</button>` : '';

/* ---------- reading a player's save ---------- */
function summary(p){
  const sd = p.save_data || {}, cards = sd.cards || {}, st = sd.stats || {}, onb = sd.onb || {};
  const owned = CARDS.filter(c => cards[c.id] && cards[c.id].owned);
  return {
    has: !!(p.save_data && sd.cards), sd, st, owned,
    level: 1 + Math.floor((st.xp || 0) / 250),
    mastered: owned.filter(c => cards[c.id].mastered).length,
    coins: sd.coins || 0,
    gsDone: onb.finished ? STEPS.length : Object.keys(onb.paid || {}).length,
    acc: st.answered ? Math.round(st.correct / st.answered * 100) + '%' : '—',
    last: Date.parse(p.save_updated_at || '') || 0,   // last time their progress saved
  };
}
/* A card picture at a given level, whether or not the admin owns the card */
function admThumb(c, level){
  let src = null; for (let l = level || 1; l >= 1; l--) if (ART[c.id] && ART[c.id][l]) { src = ART[c.id][l]; break; }
  if (src) return `<span class="th ${c.cutout ? 'cut' : ''}"><img src="${src}" alt="" loading="lazy"></span>`;
  return `<span class="th emo ${c.trickType ? 'trick' : ''}">${c.trickType ? ICO('memory') : ICO('cards')}</span>`;
}
const fmtDate = t => t ? new Date(t).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : '—';
const lastText = t => t ? 'last played ' + agoText(t) : "hasn't played yet";

const ADMIN_SCREENS = {
  admin(){
    if (!ADM.is) return adminDenied();
    if (!ADM.players && !ADM.err) loadPlayers();
    // Newest sign-ups first, with counts for today, this week and all time
    const joined = p => Date.parse(p.joined_at) || 0;
    const list = (ADM.players || []).slice().sort((a, b) => joined(b) - joined(a));
    const DAYMS = 864e5, now = Date.now(), dayStart = new Date().setHours(0, 0, 0, 0);
    const today = list.filter(p => joined(p) >= dayStart).length, week = list.filter(p => joined(p) >= now - 7 * DAYMS).length;
    const signups = ADM.players ? `<div class="stat4"><div><b>${today}</b><small>Today</small></div><div><b>${week}</b><small>This week</small></div>
      <div><b>${list.length}</b><small>All players</small></div><div><b>${list.filter(p => summary(p).has).length}</b><small>Have played</small></div></div>` : '';
    const rows = list.map(p => { const x = summary(p);
      return `<button class="row adm-row" data-act="push" data-s="adminplayer" data-id="${esc(p.user_id)}">
        <span class="row-main"><b>${esc(p.email || '(no email)')}</b>
        <small>${x.has ? `Level ${x.level} · ${x.owned.length} of ${CARDS.length} cards · ${x.coins.toLocaleString()} coins · Getting Started ${x.gsDone} of ${STEPS.length}` : 'No progress yet'}</small>
        <small>Joined ${fmtDate(Date.parse(p.joined_at))} · ${lastText(x.last)}</small></span>${chev}</button>`; }).join('');
    return { title:'Admin', right:`<button class="nb-btn txt" data-act="adm-reload">Refresh</button>`, body:`
      <div class="adm-hero"><span>${ICO('stats')}</span><div><b>Becoming a Clerk Admin</b><small>Server-authorized tools for review and testing</small></div></div>
      <div class="sec-h"><span>Sign-ups</span>${ADM.players ? `<span class="adm-count">${list.length}</span>` : ''}</div>
      ${signups}
      <p class="st-note">Newest first. Tap a player to see their progress. Nothing here changes another player's progress.</p>
      ${ADM.err ? `<p class="acct-err">${ICO('warning')} ${esc(ADM.err)}</p>` : ''}
      ${ADM.players ? `<div class="list">${rows || '<p class="empty">No players yet.</p>'}</div>` : '<p class="empty">Loading players…</p>'}
      <div class="sec-h"><span>Content review</span></div>
      <div class="list">
        <button class="row" data-act="push" data-s="admincards"><span class="th emo gi">${ICO('cards')}</span><span class="row-main"><b>Cards and questions</b><small>All ${CARDS.length} cards, every level</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminlessons"><span class="th emo gi">${ICO('read')}</span><span class="row-main"><b>Lessons</b><small>${LESSONS.length} built-in lessons</small></span>${chev}</button>
      </div>
      <div class="sec-h"><span>Quality assurance</span></div>
      <div class="list">
        <button class="row" data-act="push" data-s="admintester"><span class="th emo gi">${ICO('sparkle')}</span><span class="row-main"><b>Tester workspace</b><small>Cards, quizzes, packs, rewards, and app screens</small></span>${chev}</button>
      </div>` };
  },

  adminplayer(p){
    const pl = (ADM.players || []).find(x => x.user_id === p.id);
    if (!ADM.is || !pl) return adminDenied('Player');
    const x = summary(pl), sd = x.sd, cards = sd.cards || {};
    if (!x.has) return { title:'Player', body:`<p class="adm-email">${esc(pl.email)}</p><p class="empty">This player hasn't made any progress yet.</p>` };
    const onb = sd.onb || {}, paid = onb.paid || {};
    const lessonName = id => (LESSONS.find(L => L.id === id) || (sd.binders || []).find(b => b.id === id) || {}).name || 'Deleted binder';
    const lessons = Object.entries(sd.lessons || {}).filter(([, r]) => r && (r.best || r.passes));
    const cardRows = x.owned.sort((a, b) => (cards[b.id].level - cards[a.id].level) || a.name.localeCompare(b.name)).map(c => { const cs = cards[c.id];
      return `<div class="row">${admThumb(c, cs.level)}<span class="row-main"><b>${esc(c.name)}</b><small>${cs.mastered ? 'Mastered' : `Level ${cs.level} · ${cs.xp || 0} XP`}${cs.last ? ' · studied ' + agoText(cs.last) : ''}</small></span></div>`; }).join('');
    return { title:'Player', body:`
      <p class="adm-email">${esc(pl.email)}</p>
      <p class="st-note">Joined ${fmtDate(Date.parse(pl.joined_at))} · ${lastText(x.last)}</p>
      <div class="stat4"><div><b>${x.level}</b><small>Level</small></div><div><b>${x.owned.length}</b><small>Cards</small></div>
        <div><b>${x.st.sessions || 0}</b><small>Rounds</small></div><div><b>${x.acc}</b><small>Accuracy</small></div></div>
      <div class="list info">
        <div class="row"><span class="k">Coins</span><span class="v">${x.coins.toLocaleString()}</span></div>
        <div class="row"><span class="k">Mastered cards</span><span class="v">${x.mastered}</span></div>
        <div class="row"><span class="k">Packs opened</span><span class="v">${sd.packsOpened || 0}</span></div>
        <div class="row"><span class="k">Answers right</span><span class="v">${x.st.correct || 0} of ${x.st.answered || 0}</span></div>
        <div class="row"><span class="k">Binders</span><span class="v">${(sd.binders || []).length}</span></div>
      </div>
      <div class="sec-h"><span>Getting Started · ${x.gsDone} of ${STEPS.length}</span></div>
      <div class="list info">${STEPS.map(s => `<div class="row"><span class="k">${esc(s.label)}</span><span class="v">${onb.finished || paid[s.id] ? '✓' : '—'}</span></div>`).join('')}</div>
      <div class="sec-h"><span>Lessons</span></div>
      <div class="list info">${lessons.map(([id, r]) => `<div class="row"><span class="k">${esc(lessonName(id))}</span><span class="v">best ${r.best || 0}%${r.passes ? ` · passed ${r.passes}×` : ''}</span></div>`).join('') || '<p class="empty">No lessons taken yet.</p>'}</div>
      <div class="sec-h"><span>Cards · ${x.owned.length} of ${CARDS.length}</span></div>
      <div class="list">${cardRows}</div>
      <div class="sec-h"><span>Recent coins</span></div>
      <div class="list info">${(sd.coinLog || []).slice(0, 12).map(l => `<div class="row"><span class="k">${esc(l.why)}</span><span class="v">${l.n > 0 ? '+' : ''}${l.n}</span></div>`).join('') || '<p class="empty">No coins yet.</p>'}</div>` };
  },
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="adm-reload"]'); if (!t) return;
  if (!ADM.is) return;
  ADM.players = null; refresh(); loadPlayers();
});

/* ---------- Check the game: read-only copies of cards, rules, questions, lessons, and screens ---------- */
const seriesLabel = c => c.trickType ? (c.series ? `Series ${c.series} · Memory Trick` : 'Memory Trick') : `Series ${c.series || 1}`;
const adminScreen = (title, make) => ADM.is ? make() : adminDenied(title);
const admFixture = (c, lv, mode, ver) => {
  const level = Math.max(1, Math.min(maxL(c), Number(lv) || 1));
  const st = { level, xp:0, mastered:false, owned:true, vers:VERSIONS[ver] && ver !== 'filed' ? [ver] : [], evoSeen:level >= 4 };   // admin previews show evolved art at 4-5
  if (mode === 'charged') st.xp = Math.round(NEED[level - 1] * .82);
  if (mode === 'frost') st.last = Date.now() - Math.round(coldAfter(st) * .72);
  if (mode === 'cold') st.last = Date.now() - coldAfter(st) - DAY;
  if (mode === 'mastered') { st.level = maxL(c); st.xp = NEED[st.level - 1]; st.mastered = true; }
  return st;
};
/* Admin previews show the plain card design. The signed-in admin's own sleeve, stamp, bought frame and card back
   (S.styles) and earned series backs (worked out from S.cards) would otherwise show through, so both are hidden
   for this one synchronous render and put straight back. Nothing is saved. */
function neutralRender(make){
  const keep = { styles:S.styles, cards:S.cards };
  S.styles = null; S.cards = {};
  try { return make(); } finally { S.styles = keep.styles; S.cards = keep.cards; }
}
function admCardPreview(c, lv, mode, ver){
  return neutralRender(() => cardEl(c, admFixture(c, lv, mode, ver)));
}
/* Every question a card can ask at a level. Bank questions are listed in full; made-fresh ones are sampled. */
function questionsFor(c, lv){
  const bank = (c.bank || []).filter(q => q.lv === lv).map(q => ({ type:q.type || 'mc', q:q.q, opts:q.c, a:q.a, h:q.h, w:q.w }));
  const made = [];
  if (c.gen || c.mnemonic) {
    const seen = new Set(bank.map(q => q.q + q.a)), used = new Set();
    for (let k = 0; k < 40 && made.length < 3; k++) {
      let q; try { q = nextQuestion(c, lv, used); } catch (_) { break; }
      const key = q.q + JSON.stringify(q.rows || '') + q.a;
      if (!seen.has(key)) { seen.add(key); if (!bank.some(b => b.q === q.q)) made.push(q); }
    }
  }
  return { bank, made };
}
function questionHTML(q, n){
  const rows = q.rows ? `<div class="adm-rows">${q.rows.map((r, i) => `<div><span>${i + 1}</span><code>${esc(r[0])}</code><code>${esc(r[1])}</code></div>`).join('')}</div>` : '';
  return `<div class="adm-q"><p class="adm-qt"><b>${n}.</b> ${esc(q.q)}</p>${rows}
    <ul>${(q.opts || []).map(o => `<li class="${String(o) === String(q.a) ? 'ok' : ''}">${String(o) === String(q.a) ? '✓ ' : ''}${esc(o)}</li>`).join('')}</ul>
    ${q.h ? `<p class="adm-meta"><b>Hint:</b> ${esc(q.h)}</p>` : ''}
    ${q.w ? `<div class="adm-meta"><b>Why:</b> ${q.raw ? q.w : esc(q.w)}</div>` : ''}</div>`;
}
function ruleHTML(c){   // display only: no highlighting, no "read" credit
  if (c.source) return `<div class="casefile adm-rule"><h4>The source rule</h4><div class="cite">${esc(c.source.cite)}</div>
    <p class="cf-quote">“${esc(c.source.quote)}”</p>
    ${READ_QS[c.id] ? `<h4>Read it with these questions</h4><ol>${READ_QS[c.id].map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
    <h4>When it comes up</h4><p class="ctx">${esc(c.source.context || '')}</p><p class="from">Source: ${esc(c.source.from || '')}</p></div>`;
  if (c.mnemonic) { const m = c.mnemonic; return `<div class="panel adm-trick"><b>${esc(m.sentence)}</b>
    <ul>${m.words.map((w, i) => `<li><b>${esc(m.letters[i])}</b> ${esc(w)} = ${esc(m.means[i])}</li>`).join('')}</ul>${m.tip ? `<p>${esc(m.tip)}</p>` : ''}</div>`; }
  if (c.diff) return `<div class="panel adm-trick">${[c.diff.a, c.diff.b].map(d => `<b>${esc(d.name)}</b> <i>${esc(d.hook)}</i>
    <ul>${d.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`).join('')}</div>`;
  return '';
}

Object.assign(ADMIN_SCREENS, {
  admincards(){
    return adminScreen('All Cards', () => {
    // The game's own series (same names and membership as the Collection), then the add-on pack(s) that sit outside every series
    const groups = SERIES_DEFS.map(d => { const list = CARDS.filter(d.test);
      return { g:d.label + (list.length && list.every(c => c.trickType) ? ' · Memory Tricks' : ''), list }; })
      .concat(ADDON_PACKS.map(d => ({ g:d.label + ' · add-on pack', list:CARDS.filter(d.test) })));
    const stray = CARDS.filter(c => ![...SERIES_DEFS, ...ADDON_PACKS].some(d => d.test(c)));
    if (stray.length) groups.push({ g:'Not in any pack', list:stray });
    const tricks = CARDS.filter(c => c.trickType), where = groups.filter(x => x.list.some(c => c.trickType))
      .map(x => `${x.list.filter(c => c.trickType).length} in ${x.g.endsWith(' · add-on pack') ? 'the ' + x.g.replace(' · ', ' ') : x.g.split(' · ')[0]}`);
    return { title:'All Cards', body:`<p class="st-note">Every card, including ones you don't own. Tap one to see each level, version, visual state, rule, and every question.</p>
      <p class="st-note">${tricks.length} are Memory Tricks: ${where.join(', ')}.</p>
      ${groups.map(({ g, list }) => { return list.length ? `<div class="sec-h"><span>${esc(g)}</span><span class="adm-count">${list.length}</span></div>
        <div class="list">${list.map(c => `<button class="row" data-act="push" data-s="admincard" data-id="${c.id}">${admThumb(c, maxL(c))}
          <span class="row-main"><b>${esc(c.name)}</b><small>${esc(c.num)} · ${esc(titleCase(c.set))} · ${maxL(c)} levels</small></span>${chev}</button>`).join('')}</div>` : ''; }).join('')}` };
    });
  },
  admincard(p){
    if (!ADM.is) return adminDenied('Card');
    const c = byId(p.id); if (!c) return { title:'Card', body:'' };
    const lv = Math.min(p.lv || 1, maxL(c)), mode = p.mode || 'normal', ver = VERSIONS[p.ver] ? p.ver : 'filed', { bank, made } = questionsFor(c, lv);
    const states = [['normal','Clean'],['charged','Charged'],['frost','Frost'],['cold','Cold'],['mastered','Mastered']];
    const vers = Object.keys(VERSIONS).map(v => [v, titleCase(VERSIONS[v].label)]);
    return { title:c.name, right:made.length ? `<button class="nb-btn txt" data-act="adm-reroll">Shuffle</button>` : '', body:`
      <div class="adm-lvs">${Array.from({ length:maxL(c) }, (_, i) => `<button class="${i + 1 === lv ? 'on' : ''}" data-act="adm-lv" data-lv="${i + 1}">Level ${i + 1}</button>`).join('')}</div>
      <div class="adm-modes">${states.map(([v,label]) => `<button class="${v === mode ? 'on' : ''}" data-act="adm-mode" data-v="${v}">${label}</button>`).join('')}</div>
      <div class="adm-modes adm-vers">${vers.map(([v,label]) => `<button class="${v === ver ? 'on' : ''}" data-act="adm-ver" data-v="${v}">${label}</button>`).join('')}</div>
      <div class="adm-card"><div class="cd-card" data-act="cd-flip" aria-label="Tap to flip the card">${admCardPreview(c, lv, mode, ver)}<div class="cd-back">${neutralRender(() => cardReverseHTML(c))}</div></div></div>
      <p class="st-note c">Tap the card to see its back.</p>
      ${typeof canEvolve === 'function' && canEvolve(c) ? `<button class="sk-btn" data-act="adm-evo-peel" data-id="${c.id}">Replay the tear (level 4 evolve)</button>` : ''}
      <p class="st-note c">${esc(c.num)} · ${esc(seriesLabel(c))} · ${esc(titleCase(c.set))} · ${esc(c.rarity || '')}</p>
      ${ruleHTML(c)}
      <div class="sec-h"><span>Level ${lv} questions</span><span class="adm-count">${bank.length}${made.length ? ' + samples' : ''}</span></div>
      ${bank.map((q, i) => questionHTML(q, i + 1)).join('')}
      ${made.length ? `<p class="st-note">${bank.length ? 'This card also makes' : 'This card makes'} new questions every round. Here are ${made.length} examples; tap Shuffle for different ones.</p>
        ${made.map((q, i) => questionHTML(q, bank.length + i + 1)).join('')}` : ''}
      ${!bank.length && !made.length ? '<p class="empty">No questions at this level.</p>' : ''}` };
  },
  adminlessons(){
    return adminScreen('Lessons', () => ({ title:'Lessons', body:`<p class="st-note">Each built-in lesson and its cards, in reading order.</p>
      <div class="list">${LESSONS.map(L => `<button class="row" data-act="push" data-s="adminlesson" data-id="${L.id}"><span class="bd-mini">${coverHTML(L)}</span>
        <span class="row-main"><b>${esc(L.name)}</b><small>${L.cards.length} cards · ${Math.max(BINDER.minQ, Math.min(BINDER.maxQ, L.cards.length * BINDER.perCard))} quiz questions</small></span>${chev}</button>`).join('')}</div>` }));
  },
  adminlesson(p){
    if (!ADM.is) return adminDenied('Lesson');
    const L = LESSONS.find(x => x.id === p.id); if (!L) return { title:'Lesson', body:'' };
    return { title:L.name, body:`<div class="bd-head">${coverHTML(L, 'sm')}<span class="bd-stats"><b>${L.cards.length} cards</b><small>${esc(L.blurb)}</small></span></div>
      <div class="list">${L.cards.map(byId).map((c, i) => `<button class="row" data-act="push" data-s="admincard" data-id="${c.id}">${admThumb(c, 1)}
        <span class="row-main"><b>Rule ${i + 1} · ${esc(c.name)}</b><small>${esc(c.source ? c.source.cite : titleCase(c.set))}</small></span>${chev}</button>`).join('')}</div>
      <p class="st-note">Players read these in this order, then take a quiz of 2 questions per card. Tap a card for its rule and questions.</p>` };
  },
  admintester(){
    return adminScreen('Tester Workspace', () => ({ title:'Tester Workspace', body:`
      <div class="adm-hero tester"><span>${ICO('sparkle')}</span><div><b>Isolated preview lab</b><small>Fixtures do not change your save or sync to the cloud</small></div></div>
      <div class="sec-h"><span>Cards &amp; learning</span></div><div class="list">
        <button class="row" data-act="push" data-s="adminvisuals"><span class="th emo gi">${ICO('cards')}</span><span class="row-main"><b>Card visual lab</b><small>Series, levels, color, frame break, frost, foil, and glows</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminquiz"><span class="th emo gi">${ICO('read')}</span><span class="row-main"><b>Quiz interaction</b><small>Answer a disposable question fixture</small></span>${chev}</button>
      </div>
      <div class="sec-h"><span>Rewards &amp; flows</span></div><div class="list">
        <button class="row" data-act="push" data-s="adminpacks"><span class="th emo gi">${ICO('pack')}</span><span class="row-main"><b>Packs &amp; rewards</b><small>Pack wrappers, pull states, and Hot Docket rewards</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminscreens"><span class="th emo gi">${ICO('sparkle')}</span><span class="row-main"><b>App screens</b><small>Startup, welcome, loading, result, finish, and tips</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminsave"><span class="th emo gi">${ICO('warning')}</span><span class="row-main"><b>Saved account controls</b><small>Explicit progress mutations for authenticated QA</small></span>${chev}</button>
      </div>` }));
  },
  adminsave(){
    return adminScreen('Saved Account Controls', () => {
      const mine = CARDS.filter(c => S.cards[c.id] && S.cards[c.id].owned);
      return { title:'Saved Account Controls', body:`<p class="acct-err">${ICO('warning')} These controls change this admin account's real save and can sync to the cloud. Use isolated previews everywhere else.</p>
        <div class="sec-h"><span>Packs &amp; reset</span></div><div class="list">
          <button class="row" data-act="t-pack"><span class="th emo gi">${ICO('pack')}</span><span class="row-main"><b>Add one test pack</b><small>Changes the signed-in admin save</small></span></button>
          <button class="row danger" data-act="resetall"><span class="th emo gi">${ICO('warning')}</span><span class="row-main"><b>Reset all progress</b><small>Uses the same confirmation as Settings</small></span></button>
        </div>
        <div class="sec-h"><span>Owned cards</span></div><div class="list">${mine.map(c => { const st=S.cards[c.id]; return `<div class="adm-save-card">${admThumb(c,st.level)}<span><b>${esc(c.name)}</b><small>${st.mastered?'Mastered':`Level ${st.level} · ${st.xp} XP`}</small></span><div><button data-act="t-level" data-id="${c.id}" ${st.mastered?'disabled':''}>Level up</button><button data-act="t-cold" data-id="${c.id}">Cold</button><button data-act="t-reset" data-id="${c.id}">Reset</button></div></div>`; }).join('')}</div>` };
    });
  },
  adminvisuals(){
    return adminScreen('Card Visual Lab', () => {
      const series = [...new Set(CARDS.map(c => c.series || 1))].sort((a,b) => a-b);
      const samples = series.map(n => CARDS.find(c => (c.series || 1) === n && (FRAME_BREAK_CARDS.has(c.id) || c.frameBreak)) || CARDS.find(c => (c.series || 1) === n)).filter(Boolean);
      const s3 = CARDS.find(c => c.series === 3), frame = CARDS.find(c => (FRAME_BREAK_CARDS.has(c.id) || c.frameBreak) && c.cutout);
      return { title:'Card Visual Lab', body:`<p class="st-note">Tap a sample to inspect every level and switch among the four versions (Filed, Certified, Exhibit, Gold Seal) and the clean, charged, frosted, cold, and mastered states.</p>
        <div class="sec-h"><span>Series coverage</span></div><div class="adm-gallery">${samples.map(c => `<button data-act="push" data-s="admincard" data-id="${c.id}">${admCardPreview(c, Math.min(2,maxL(c)), 'normal')}<small>Series ${c.series || 1}</small></button>`).join('')}</div>
        <div class="sec-h"><span>Required effects</span></div><div class="list">
          ${s3 ? `<button class="row" data-act="push" data-s="admincard" data-id="${s3.id}">${admThumb(s3,2)}<span class="row-main"><b>Progressive color</b><small>Series 3 paint stages across levels</small></span>${chev}</button>` : ''}
          ${frame ? `<button class="row" data-act="push" data-s="admincard" data-id="${frame.id}">${admThumb(frame,maxL(frame))}<span class="row-main"><b>Frame break &amp; motion</b><small>Max-level cutout and device tilt</small></span>${chev}</button>` : ''}
          <button class="row" data-act="push" data-s="glows"><span class="th emo gi">${ICO('sparkle')}</span><span class="row-main"><b>Card glows</b><small>Level 2, almost leveled up, Memory Trick, and cold</small></span>${chev}</button>
        </div>` };
    });
  },
  adminquiz(p){
    return adminScreen('Quiz Interaction', () => {
      const c = byId(p.id) || CARDS.find(x => (x.bank || []).length), lv = Math.min(Number(p.lv) || 1, maxL(c));
      const q = questionsFor(c, lv).bank[0] || questionsFor(c, lv).made[0];
      return { title:'Quiz Interaction', body:`<p class="st-note">This answer state lives only in Admin and is discarded when you leave the preview.</p>
        <div class="adm-card compact">${admCardPreview(c,lv,'normal')}</div>
        <div class="sec-h"><span>${esc(c.name)} · Level ${lv}</span></div>
        ${q ? `<div class="adm-q fixture"><p class="adm-qt">${esc(q.q)}</p><div class="adm-answers">${(q.opts || []).map((o,i) => `<button data-act="adm-quiz-answer" data-i="${i}" data-right="${String(o)===String(q.a)?1:0}" class="${ADM.quizChoice===i ? (String(o)===String(q.a)?'ok':'bad') : ''}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div>${ADM.quizChoice == null ? '' : `<p class="adm-meta">${ADM.quizChoice >= 0 && String((q.opts||[])[ADM.quizChoice])===String(q.a) ? 'Correct.' : `Correct answer: ${esc(q.a)}`}${q.w ? ` ${esc(q.w)}` : ''}</p>`}</div>` : '<p class="empty">No question fixture available.</p>'}
        <button class="sheet-cancel" data-act="adm-quiz-reset">Reset answer</button>
        <button class="sheet-cancel" data-act="push" data-s="admincards">Browse every question</button>` };
    });
  },
  adminpacks(){
    return adminScreen('Packs & Rewards', () => {
      const pulls = [CARDS.find(c => !c.series), CARDS.find(c => c.series === 3), CARDS.find(c => c.trickType)].filter(Boolean);
      return { title:'Packs & Rewards', body:`<p class="st-note">Static pull fixtures use temporary card states and never spend, award, or save anything.</p>
        <div class="adm-pack"><img src="${nextPackArt()}" alt="Current pack wrapper"><b>Pack presentation</b><small>Wrapper, card back, new card, duplicate, and Memory Trick labels</small></div>
        <div class="adm-pulls">${pulls.map((c,i) => `<div>${i===0?`<img class="adm-back" src="${backSrc()}" alt="Card back">`:admCardPreview(c,Math.min(2,maxL(c)),'normal')}<small>${['Card back / duplicate','New card','Memory Trick'][i]}</small></div>`).join('')}</div>
        <div class="sec-h"><span>Open a test pack</span></div>
        <p class="st-note">The real pack opening with sample cards from that series. Nothing is spent, awarded or saved.</p>
        <div class="adm-packs-open">${SERIES_DEFS.concat(ADDON_PACKS).map(d => `<button data-act="adm-pack-open" data-v="${d.n}"><img src="${packArtOf(d.n)}" alt=""><small>${ADDON_PACKS.includes(d) ? 'Add-on' : 'Series ' + d.n}</small></button>`).join('')}</div>
        <div class="list" style="margin-top:12px"><button class="row" data-act="adm-pack-add"><span class="th emo gi">${ICO('pack')}</span><span class="row-main"><b>Add 5 real packs</b><small>To your own account, to try Pick Your Pack (${S.packs} waiting now)</small></span></button></div>
        <div class="sec-h"><span>Reward cards</span></div><div class="list"><button class="row" data-act="push" data-s="rewardpreview"><span class="th emo gi">${ICO('sparkle')}</span><span class="row-main"><b>Landmark cards (Hot Docket)</b><small>Filed, Certified, backs, and one-chance quiz previews</small></span>${chev}</button></div>` };
    });
  },
  adminscreens(){
    const row = (act, v, icon, b, sm) => `<button class="row" data-act="${act}" data-v="${v}"><span class="th emo gi">${ICO(icon)}</span><span class="row-main"><b>${b}</b><small>${sm}</small></span>${chev}</button>`;
    return adminScreen('App Screens', () => ({ title:'App Screens', body:`<p class="st-note">Replay screens without changing onboarding, progress, rewards, or cloud data.</p>
      <div class="list">
        ${row('adm-screen', 'startup', 'sparkle', 'Startup splash', 'Logo, card fan, and loading treatment')}
        ${row('adm-screen', 'welcome', 'pack', 'Welcome screens', 'Every page before the first pack')}
        ${row('adm-screen', 'loading', 'sync', 'Loading state', 'Progress bar and status copy')}
        ${row('adm-screen', 'result', 'stats', 'Round result', 'Score, XP, rewards, and next actions')}
        ${row('adm-screen', 'finish', 'celebrate', "You're all set!", 'When all 10 Getting Started steps are done')}
        ${row('adm-screen', 'tip-cold', 'thermo_snow', 'Tip: Cold Case', 'First time a round starts on a cold card')}
        ${row('adm-screen', 'tip-trick', 'memory', 'Tip: Memory Trick card', 'First time a Memory Trick card is opened')}
        ${row('adm-screen', 'tip-more', 'read', 'Tip: long answers', 'First time answers are cut off with "more"')}
      </div>` }));
  },
});

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || !ADM.is) return;
  switch (t.dataset.act) {
    case 'adm-lv': { const en = topEntry(); en.p = { ...en.p, lv:+t.dataset.lv }; refresh(); currentScreenEl().querySelector('.scr').scrollTop = 0; break; }
    case 'adm-mode': { const en = topEntry(); en.p = { ...en.p, mode:t.dataset.v }; refresh(); break; }
    case 'adm-evo-peel': { const c = byId(t.dataset.id); showEvolvePeel(c, null, { preview:true, st:admFixture(c, 4, 'normal') }); break; }
    case 'adm-ver': { const en = topEntry(); en.p = { ...en.p, ver:t.dataset.v }; refresh(); break; }
    case 'adm-reroll': refresh(); break;
    case 'adm-pack-open': {   // sample pulls: a new card, a duplicate, and a Certified one last, like a real pack's order
      const d = packDef(t.dataset.v), addon = ADDON_PACKS.includes(d), pool = shuffle(CARDS.filter(d.test));
      const pulls = pool.slice(0, 3).map((c, i) => ({ c, isNew:i !== 1, ver:i === 2 ? 'certified' : null, newVer:i === 2, coins:i === 1 ? 5 : 0, st:admFixture(c, 1, 'normal', i === 2 ? 'certified' : 'filed') }));
      if (addon) pulls.addon = d.n; else pulls.series = d.n;
      openPack({ pulls, ...(addon ? { addon:d.n } : { series:d.n }), preview:true, chosen:true }); break; }
    case 'adm-pack-add': if (ADM.is) { S.packs += 5; save(); refresh(); toast('5 packs added', 'pack'); } break;
    case 'adm-quiz-answer': ADM.quizChoice = +t.dataset.i; refresh(); break;
    case 'adm-quiz-reset': ADM.quizChoice = null; refresh(); break;
    case 'adm-screen': { const v = t.dataset.v;
      if (v === 'startup' && typeof previewStartupSplash === 'function') previewStartupSplash();
      else if (v === 'startup') openSheet(`<div class="adm-loading"><div class="home-logo">BECOMING <span>A CLERK</span></div><p>Study for the New York court clerk exam.</p><div class="sp-bar"><i style="width:62%"></i></div><small>Shuffling the cards…</small></div><button class="sheet-cancel" data-act="sheet-close">Close preview</button>`);
      else if (v === 'welcome') previewWelcome();
      else if (v === 'loading') openSheet(`<div class="adm-loading">${ICO('cards')}<h3>GETTING YOUR DECK READY</h3><div class="sp-bar"><i style="width:68%"></i></div><p>Setting up your desk…</p></div><button class="sheet-cancel" data-act="sheet-close">Close preview</button>`);
      else if (v === 'result') openSheet(`<div class="results adm-result"><h1>SESSION ADJOURNED</h1><div class="score">4 / 5</div><div class="sub">correct answers</div><div class="rchips"><span class="chip">+140 XP</span><span class="chip">${ICO('pack')} +1 DAILY PACK</span></div><div class="panel"><b>Fixture Card</b> · Level 2<div class="pbar"><b style="width:70%"></b></div><div class="prow"><span>98 / 140 XP</span><span>42 XP to go</span></div></div></div><button class="sheet-cancel" data-act="sheet-close">Close preview</button>`);
      else if (v === 'finish') openSheet(finishSheetHTML(true));
      else openSheet(tipSheetHTML(v.slice(4)));
      break; }
  }
});

const ADMIN_CSS = `
.adm-row .row-main small{white-space:normal;overflow:visible;text-overflow:clip} .adm-row .row-main small+small{margin-top:1px;opacity:.8}
.adm-count{font:18px "Patrick Hand";color:var(--sub)}
.adm-packs-open{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.adm-packs-open button{padding:6px 2px;border:0;border-radius:12px;background:var(--bg2);color:var(--sub);font:13px var(--ui)}.adm-packs-open img{display:block;width:100%;aspect-ratio:640/975;object-fit:contain;margin-bottom:4px}
.adm-lvs{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;scrollbar-width:none} .adm-lvs::-webkit-scrollbar{display:none}
.adm-lvs button{flex:none;min-height:36px;padding:0 14px;border:0;border-radius:18px;background:var(--bg2);color:var(--sub);font:18px "Patrick Hand"}
.adm-lvs button.on{background:var(--mustard);color:var(--ink)}
.adm-modes{display:flex;gap:6px;overflow-x:auto;margin:0 0 10px;padding-bottom:2px;scrollbar-width:none}.adm-modes button{flex:none;min-height:32px;padding:0 11px;border:1px solid var(--line);border-radius:16px;background:transparent;color:var(--sub);font:14px var(--ui)}.adm-modes button.on{background:var(--paper);color:var(--ink);border-color:var(--paper)}
/* Same sizing as the player's card screen (.cd-card): never wider than 300px, and short enough to clear the buttons and the tab bar */
.adm-card{width:min(66%,300px,calc((100dvh - 330px) / 1.5));min-width:160px;margin:0 auto 8px}
.adm-card.compact{width:48%;max-width:190px}.adm-card .cd-card{width:100%}.adm-vers button.on{background:var(--mustard);border-color:var(--mustard);color:var(--ink)}
.adm-rule{margin:0 0 14px} .adm-trick{margin:0 0 14px;text-align:left} .adm-trick ul{margin:6px 0 10px;padding-left:20px}
.adm-q{margin:0 0 10px;padding:12px 14px;border-radius:14px;background:var(--bg2)}
.adm-qt{margin:0 0 8px;font:19px/1.3 "Patrick Hand"}
.adm-q ul{margin:0 0 8px;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.adm-q li{padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.05);font:18px/1.25 "Patrick Hand";color:var(--sub)}
.adm-q li.ok{background:rgba(95,212,122,.16);color:#bfeec9;font-weight:600}
.adm-meta{margin:4px 0 0;font:17px/1.3 "Patrick Hand";color:var(--sub)} .adm-meta p{margin:2px 0}
.adm-rows{display:flex;flex-direction:column;gap:3px;margin:0 0 8px} .adm-rows div{display:grid;grid-template-columns:18px 1fr 1fr;gap:6px;font:13px var(--ui)}
.adm-rows code{padding:3px 6px;border-radius:6px;background:rgba(255,255,255,.06);font:13px "Courier Prime",monospace;color:var(--paper)}
.adm-email{margin:0 0 4px;font:400 22px "Bangers";letter-spacing:.03em;word-break:break-all}
.adm-hero{display:flex;align-items:center;gap:13px;margin:4px 0 18px;padding:15px;border-radius:17px;background:linear-gradient(135deg,rgba(227,178,60,.18),rgba(143,179,209,.1));border:.5px solid var(--line)}.adm-hero>span,.adm-hero>img{width:46px;height:46px;display:grid;place-items:center}.adm-hero b{display:block;font:400 24px "Bangers";letter-spacing:.05em}.adm-hero small{display:block;color:var(--sub);font:13px/1.35 var(--ui);margin-top:3px}.adm-hero.tester{background:linear-gradient(135deg,rgba(143,179,209,.18),rgba(123,75,181,.12))}
.adm-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,220px));justify-content:center;gap:12px}@media (max-width:520px){.adm-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}.adm-gallery button{border:0;background:none;color:var(--paper);padding:0}.adm-gallery small{display:block;margin-top:5px;font:13px var(--ui);color:var(--sub)}
.adm-answers{display:flex;flex-direction:column;gap:7px}.adm-answers button{min-height:46px;padding:8px 11px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.04);color:var(--paper);text-align:left;font:16px/1.25 var(--ui)}.adm-answers button.ok{background:rgba(95,212,122,.16);border-color:#5fd47a}.adm-answers button.bad{background:rgba(255,107,94,.14);border-color:#ff6b5e}
.adm-pack{text-align:center;padding:18px;border-radius:17px;background:var(--bg2)}.adm-pack img{display:block;width:min(45%,180px);max-height:230px;object-fit:contain;margin:0 auto 9px}.adm-pack b,.adm-pack small{display:block}.adm-pack b{font:400 22px "Bangers";letter-spacing:.05em}.adm-pack small{font:13px var(--ui);color:var(--sub);margin-top:4px}.adm-pulls{display:grid;grid-template-columns:repeat(3,minmax(0,200px));justify-content:center;gap:8px;margin-top:14px}.adm-pulls>div{min-width:0;text-align:center}.adm-pulls small{display:block;font:11px/1.2 var(--ui);color:var(--sub);margin-top:5px}.adm-back{width:100%;aspect-ratio:1024/1536;object-fit:cover;border-radius:6%/4%}
.adm-loading{text-align:center;padding:14px 4px}.adm-loading>.ico{width:64px;height:64px}.adm-loading h3{font:400 27px "Bangers";letter-spacing:.05em}.adm-loading p,.adm-loading small{color:var(--sub)}.adm-loading .sp-bar{position:relative;inset:auto;width:100%;margin:14px 0}.adm-result{padding:0}.adm-result .score{font-size:60px}.adm-result .panel{margin-top:14px}
.adm-save-card{display:grid;grid-template-columns:46px 1fr;gap:10px 12px;padding:10px 12px;border-bottom:.5px solid var(--line)}.adm-save-card:last-child{border-bottom:0}.adm-save-card>span{min-width:0}.adm-save-card>span b,.adm-save-card>span small{display:block}.adm-save-card>span b{font:18px "Patrick Hand"}.adm-save-card>span small{font:12px var(--ui);color:var(--sub)}.adm-save-card>div{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.adm-save-card>div button{min-height:36px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.05);color:var(--paper);font:14px var(--ui)}.adm-save-card>div button:disabled{opacity:.4}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${ADMIN_CSS}</style>`);
