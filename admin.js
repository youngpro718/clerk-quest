/* Clerk Quest admin view: look only. Shown only to accounts on the server's admin list; the server checks
   again on every read (clerk_quest_is_admin / clerk_quest_admin_players). Nothing here writes to any save.
   Loaded before the main script; uses the app's globals (CARDS, LESSONS, STEPS, ART, esc, push, refresh, topEntry,
   chev, ICO, COIN, agoText) and window.CQCloud. */

const ADM = { is:false, players:null, loading:false, err:'' };
async function checkAdmin(){
  if (!(window.CQCloud && CQCloud.getUser())) { ADM.is = false; return; }
  try { ADM.is = !!(await CQCloud.rpc('clerk_quest_is_admin')); } catch (_) { ADM.is = false; }
  const en = topEntry && topEntry(); if (ADM.is && en && en.s === 'profile') refresh();
}
async function loadPlayers(){
  if (ADM.loading) return;
  ADM.loading = true; ADM.err = '';
  try { ADM.players = await CQCloud.rpc('clerk_quest_admin_players') || []; }
  catch (e) { ADM.err = CQCloud.friendlyError(e); }
  ADM.loading = false;
  const en = topEntry(); if (en && /^admin/.test(en.s)) refresh();
}
window.addEventListener('cq-cloud', e => { if (['signed-in', 'uploaded-local', 'synced'].includes(e.detail.status)) checkAdmin(); });

/* Profile: the Admin row, for admins only */
const profileAdminRow = () => ADM.is ? `<button class="row" data-act="push" data-s="admin"><span class="th emo gi">${ICO('stats')}</span>
  <span class="row-main"><b>Admin</b><small>Players and game check</small></span>${chev}</button>` : '';

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
    if (!ADM.is) return { title:'Admin', body:'<p class="empty">Admins only.</p>' };
    if (!ADM.players && !ADM.err) loadPlayers();
    const list = ADM.players || [];
    const rows = list.map(p => { const x = summary(p);
      return `<button class="row adm-row" data-act="push" data-s="adminplayer" data-id="${esc(p.user_id)}">
        <span class="row-main"><b>${esc(p.email || '(no email)')}</b>
        <small>${x.has ? `Level ${x.level} · ${x.owned.length} of ${CARDS.length} cards · ${x.coins.toLocaleString()} coins · Getting Started ${x.gsDone} of ${STEPS.length}` : 'No progress yet'}</small>
        <small>Joined ${fmtDate(Date.parse(p.joined_at))} · ${lastText(x.last)}</small></span>${chev}</button>`; }).join('');
    return { title:'Admin', right:`<button class="nb-btn txt" data-act="adm-reload">Refresh</button>`, body:`
      <p class="st-note">Look only. Nothing here changes anyone's progress.</p>
      <div class="sec-h"><span>Players</span>${ADM.players ? `<span class="adm-count">${list.length}</span>` : ''}</div>
      ${ADM.err ? `<p class="acct-err">${ICO('warning')} ${esc(ADM.err)}</p>` : ''}
      ${ADM.players ? `<div class="list">${rows || '<p class="empty">No players yet.</p>'}</div>` : '<p class="empty">Loading players…</p>'}
      <div class="sec-h"><span>Check the game</span></div>
      <div class="list">
        <button class="row" data-act="push" data-s="admincards"><span class="th emo gi">${ICO('cards')}</span><span class="row-main"><b>Cards and questions</b><small>All ${CARDS.length} cards, every level</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminlessons"><span class="th emo gi">${ICO('read')}</span><span class="row-main"><b>Lessons</b><small>${LESSONS.length} built-in lessons</small></span>${chev}</button>
        <button class="row" data-act="push" data-s="adminscreens"><span class="th emo gi">${ICO('sparkle')}</span><span class="row-main"><b>Screens</b><small>Welcome, finish, and tips</small></span>${chev}</button>
      </div>` };
  },

  adminplayer(p){
    const pl = (ADM.players || []).find(x => x.user_id === p.id);
    if (!ADM.is || !pl) return { title:'Player', body:'<p class="empty">Player not found.</p>' };
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
  ADM.players = null; refresh(); loadPlayers();
});

/* ---------- Check the game: read-only copies of cards, rules, questions, lessons, and screens ---------- */
const seriesLabel = c => c.series === 3 ? 'Series 3' : c.series === 2 ? 'Series 2' : c.trickType && !c.series ? 'Memory Trick' : 'Series 1';
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
    const groups = ['Series 1', 'Series 2', 'Series 3', 'Memory Trick'];
    return { title:'All Cards', body:`<p class="st-note">Every card, including ones you don't own. Tap one to see each level, its rule, and every question.</p>
      ${groups.map(g => { const list = CARDS.filter(c => seriesLabel(c) === g); return list.length ? `<div class="sec-h"><span>${g}</span><span class="adm-count">${list.length}</span></div>
        <div class="list">${list.map(c => `<button class="row" data-act="push" data-s="admincard" data-id="${c.id}">${admThumb(c, maxL(c))}
          <span class="row-main"><b>${esc(c.name)}</b><small>${esc(c.num)} · ${esc(titleCase(c.set))} · ${maxL(c)} levels</small></span>${chev}</button>`).join('')}</div>` : ''; }).join('')}` };
  },
  admincard(p){
    const c = byId(p.id); if (!c) return { title:'Card', body:'' };
    const lv = Math.min(p.lv || 1, maxL(c)), { bank, made } = questionsFor(c, lv);
    const stage = { level:lv, xp:0, mastered:false, owned:true };
    return { title:c.name, right:made.length ? `<button class="nb-btn txt" data-act="adm-reroll">Shuffle</button>` : '', body:`
      <div class="adm-lvs">${Array.from({ length:maxL(c) }, (_, i) => `<button class="${i + 1 === lv ? 'on' : ''}" data-act="adm-lv" data-lv="${i + 1}">Level ${i + 1}</button>`).join('')}</div>
      <div class="adm-card">${cardEl(c, stage)}</div>
      <p class="st-note c">${esc(c.num)} · ${esc(seriesLabel(c))} · ${esc(titleCase(c.set))} · ${esc(c.rarity || '')}</p>
      ${ruleHTML(c)}
      <div class="sec-h"><span>Level ${lv} questions</span><span class="adm-count">${bank.length}${made.length ? ' + samples' : ''}</span></div>
      ${bank.map((q, i) => questionHTML(q, i + 1)).join('')}
      ${made.length ? `<p class="st-note">${bank.length ? 'This card also makes' : 'This card makes'} new questions every round. Here are ${made.length} examples; tap Shuffle for different ones.</p>
        ${made.map((q, i) => questionHTML(q, bank.length + i + 1)).join('')}` : ''}
      ${!bank.length && !made.length ? '<p class="empty">No questions at this level.</p>' : ''}` };
  },
  adminlessons(){
    return { title:'Lessons', body:`<p class="st-note">Each built-in lesson and its cards, in reading order.</p>
      <div class="list">${LESSONS.map(L => `<button class="row" data-act="push" data-s="adminlesson" data-id="${L.id}"><span class="bd-mini">${coverHTML(L)}</span>
        <span class="row-main"><b>${esc(L.name)}</b><small>${L.cards.length} cards · ${Math.max(BINDER.minQ, Math.min(BINDER.maxQ, L.cards.length * BINDER.perCard))} quiz questions</small></span>${chev}</button>`).join('')}</div>` };
  },
  adminlesson(p){
    const L = LESSONS.find(x => x.id === p.id); if (!L) return { title:'Lesson', body:'' };
    return { title:L.name, body:`<div class="bd-head">${coverHTML(L, 'sm')}<span class="bd-stats"><b>${L.cards.length} cards</b><small>${esc(L.blurb)}</small></span></div>
      <div class="list">${L.cards.map(byId).map((c, i) => `<button class="row" data-act="push" data-s="admincard" data-id="${c.id}">${admThumb(c, 1)}
        <span class="row-main"><b>Rule ${i + 1} · ${esc(c.name)}</b><small>${esc(c.source ? c.source.cite : titleCase(c.set))}</small></span>${chev}</button>`).join('')}</div>
      <p class="st-note">Players read these in this order, then take a quiz of 2 questions per card. Tap a card for its rule and questions.</p>` };
  },
  adminscreens(){
    const row = (act, v, icon, b, sm) => `<button class="row" data-act="${act}" data-v="${v}"><span class="th emo gi">${ICO(icon)}</span><span class="row-main"><b>${b}</b><small>${sm}</small></span>${chev}</button>`;
    return { title:'Screens', body:`<p class="st-note">Replay screens new players see. Previews don't change your progress.</p>
      <div class="list">
        ${row('adm-screen', 'welcome', 'pack', 'Welcome screens', 'The 3 screens before the first pack')}
        ${row('adm-screen', 'finish', 'celebrate', "You're all set!", 'When all 10 Getting Started steps are done')}
        ${row('adm-screen', 'tip-cold', 'thermo_snow', 'Tip: Cold Case', 'First time a round starts on a cold card')}
        ${row('adm-screen', 'tip-trick', 'memory', 'Tip: Memory Trick card', 'First time a Memory Trick card is opened')}
        ${row('adm-screen', 'tip-more', 'read', 'Tip: long answers', 'First time answers are cut off with "more"')}
      </div>` };
  },
});

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || !ADM.is) return;
  switch (t.dataset.act) {
    case 'adm-lv': { const en = topEntry(); en.p = { ...en.p, lv:+t.dataset.lv }; refresh(); currentScreenEl().querySelector('.scr').scrollTop = 0; break; }
    case 'adm-reroll': refresh(); break;
    case 'adm-screen': { const v = t.dataset.v;
      if (v === 'welcome') previewWelcome();
      else if (v === 'finish') openSheet(finishSheetHTML(true));
      else openSheet(tipSheetHTML(v.slice(4)));
      break; }
  }
});

const ADMIN_CSS = `
.adm-row .row-main small{white-space:normal;overflow:visible;text-overflow:clip} .adm-row .row-main small+small{margin-top:1px;opacity:.8}
.adm-count{font:600 14px var(--ui);color:var(--sub)}
.adm-lvs{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;scrollbar-width:none} .adm-lvs::-webkit-scrollbar{display:none}
.adm-lvs button{flex:none;min-height:36px;padding:0 14px;border:0;border-radius:18px;background:var(--bg2);color:var(--sub);font:600 14px var(--ui)}
.adm-lvs button.on{background:var(--mustard);color:var(--ink)}
.adm-card{width:66%;margin:0 auto 8px}
.adm-rule{margin:0 0 14px} .adm-trick{margin:0 0 14px;text-align:left} .adm-trick ul{margin:6px 0 10px;padding-left:20px}
.adm-q{margin:0 0 10px;padding:12px 14px;border-radius:14px;background:var(--bg2)}
.adm-qt{margin:0 0 8px;font:16px/1.4 var(--ui)}
.adm-q ul{margin:0 0 8px;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.adm-q li{padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.05);font:15px/1.35 var(--ui);color:var(--sub)}
.adm-q li.ok{background:rgba(95,212,122,.16);color:#bfeec9;font-weight:600}
.adm-meta{margin:4px 0 0;font:14px/1.4 var(--ui);color:var(--sub)} .adm-meta p{margin:2px 0}
.adm-rows{display:flex;flex-direction:column;gap:3px;margin:0 0 8px} .adm-rows div{display:grid;grid-template-columns:18px 1fr 1fr;gap:6px;font:13px var(--ui)}
.adm-rows code{padding:3px 6px;border-radius:6px;background:rgba(255,255,255,.06);font:13px "Courier Prime",monospace;color:var(--paper)}
.adm-email{margin:0 0 4px;font:400 22px "Bangers";letter-spacing:.03em;word-break:break-all}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${ADMIN_CSS}</style>`);
