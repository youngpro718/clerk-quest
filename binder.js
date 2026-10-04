/* Clerk Quest binders: players arrange their own cards into binders, then take each binder as a lesson
   (read every rule in order, then a mixed quiz; 80% passes). Loaded before the main script; everything here
   runs at call time and uses the app's globals (S, CARDS, save, esc, openSheet, closeSheet, push, refresh, goBack,
   topEntry, toast, iosAlert, ICO, COIN, artSrc, cardEl, thumb, chev, owned, byId, caseFileHTML, earnCoins, spendCoins,
   startSession, sess, app, NEED, priceTag, buySheet, statusLine, maxL). */

const BINDER = { free:3, startPages:2, maxPages:6, pagePrice:50, passPct:80, firstPass:50, repeatPass:10, perCard:2, minQ:5, maxQ:15, minCards:3 };
/* Covers: price, and the label window on each cut-out cover (left, top, width, height in %) */
const COVERS = [
  { id:'default', name:'Courthouse Brown', price:0, label:[21.4, 16.1, 63.4, 18.3] },
  { id:'navy', name:'Navy Leather', price:100, label:[20.9, 20.6, 64.0, 25.5] },
  { id:'redtape', name:'Red Tape', price:100, label:[24.6, 29.7, 57.1, 18.8] },
  { id:'marble', name:'Marble', price:150, label:[28.1, 20.1, 52.8, 20.3] },
  { id:'stickers', name:'Sticker Bomb', price:150, label:[25.1, 30.2, 53.0, 18.1] },
  { id:'gold', name:'Gold Prestige', price:200, label:[23.9, 26.7, 59.3, 22.4] },
];
/* Built-in lessons: fixed cards, made by the app. Cards you don't own show as empty pockets with Get it,
   which sells the missing ones as a lesson deck. Reading is always open; the quiz needs every card. */
const SERIES45_LESSONS = ((window.CQ_SERIES45 || window.SERIES45 || window.CLERK_QUEST_SERIES45 || {}).lessons || window.SERIES45_LESSONS || []);
const LESSONS = [
  { id:'L_terms', name:'Court Terms 101', cover:'default', blurb:'The big picture of a civil case, and the words for each part.',
    cards:['caseorder', 'summons', 'svs', 'motion', 'affidavit', 'adjournment', 'judgment'] },
  { id:'L_motions', name:'Motion Practice', cover:'navy', blurb:'How motions are served, answered, and brought back. CPLR.',
    cards:['eightback', 'reargue', 'renew', 'sj120', 'amendonce', 'quash', 'newtrial'] },
  { id:'L_after', name:'After the Judgment', cover:'gold', blurb:'What happens once a judgment is entered. CPLR.',
    cards:['undodefault', 'freeze', 'interest', 'appeal30'] },
  { id:'L_crim', name:'Criminal Procedure', cover:'redtape', blurb:'Bail, dismissals, sealing, and sentencing. CPL.',
    cards:['bail', 'acd', 'jurywaiver', 'sealed', 'ypsi', 'schoolnotice'] },
  { id:'L_family', name:'Family Court', cover:'marble', blurb:'Petitions, service, and who speaks for the child.',
    cards:['whosigns', 'eightdays', 'followpetitioner', 'custodyornot', 'childvoice'] },
  { id:'L_desk', name:"The Clerk's Desk", cover:'stickers', blurb:'Filing, checking, and scheduling at the counter.',
    cards:['gavel', 'paperjam', 'missingfile', 'lfm', 'calendarcall', 'clock6090', 'military'] },
  ...SERIES45_LESSONS,
].filter(L => L && Array.isArray(L.cards) && L.cards.length).map((L, i) => {
  const cards = L.cards.map(c => typeof c === 'string' ? c : c.id).filter(Boolean);
  return { ...L, id:L.id || `L_series45_${i + 1}`, name:L.name || `Quick Reference ${i + 1}`,
    cover:L.cover || (i % 2 ? 'navy' : 'redtape'), cards, builtin:true,
    slots:[...cards, ...Array((4 - cards.length % 4) % 4).fill(null)] };
});
const POCKETS = [[10.5, 5.6, 40.7, 41.7], [54.1, 5.9, 42.0, 41.5], [11.0, 48.8, 40.4, 42.8], [54.1, 49.1, 42.2, 42.3]];

/* ---------- data ---------- */
const binders = () => (S.binders = Array.isArray(S.binders) ? S.binders : []);
const binderById = id => binders().find(b => b.id === id) || LESSONS.find(L => L.id === id);
const ownedCovers = () => (S.binderCovers = Array.isArray(S.binderCovers) ? S.binderCovers : ['default']);
const lessonRec = id => ((S.lessons = S.lessons || {})[id] = S.lessons[id] || { best:0, passes:0, passedAt:0 });
const binderCards = b => b.slots.filter(Boolean).map(byId).filter(Boolean);
const lessonCards = b => b && b.builtin ? binderCards(b) : binderCards(b).filter(owned);
const lessonQuizCards = b => binderCards(b).filter(owned);
const lessonMissing = b => b.builtin ? binderCards(b).filter(c => !owned(c)) : [];
const lessonReady = b => lessonQuizCards(b).length >= BINDER.minCards && !lessonMissing(b).length;
const lessonDeckPrice = b => lessonMissing(b).reduce((n, c) => n + cardPrice(c), 0);
const coverOf = b => COVERS.find(c => c.id === b.cover) || COVERS[0];
function newBinder(name){
  const b = { id:'b' + Date.now().toString(36), name:name.trim().slice(0, 40) || 'My Binder', cover:'default', slots:Array(BINDER.startPages * 4).fill(null) };
  binders().push(b); save(); return b;
}
const lessonQuestions = b => Math.max(BINDER.minQ, Math.min(BINDER.maxQ, lessonQuizCards(b).length * BINDER.perCard));
const lessonMinutes = b => Math.max(2, Math.round(lessonQuizCards(b).length * 0.8 + lessonQuestions(b) * 0.3));

/* ---------- pieces ---------- */
function coverHTML(b, cls = '', skipSticker, extra = ''){   // stickers.js adds the stickers stuck on it
  const cv = coverOf(b), [l, t, w, h] = cv.label;
  return `<span class="bd-cover ${cls}"><img src="${artSrc('cover_' + cv.id)}" alt="">
    <span class="bd-label" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"><b>${esc(b.name)}</b></span>
    ${S.lessons && S.lessons[b.id] && S.lessons[b.id].passes ? `<img class="bd-stamp" src="${artSrc('stamp_passed')}" alt="Passed">` : ''}${typeof coverStickersHTML === 'function' ? coverStickersHTML(b, skipSticker) : ''}${extra}</span>`;
}
function pageHTML(b, p, edit, sel){
  return `<div class="bd-page"><img class="bd-page-bg" src="${artSrc('binder_page')}" alt="">${POCKETS.map((pk, k) => {
    const i = p * 4 + k, id = b.slots[i], c = id && byId(id);
    const pos = `left:${pk[0]}%;top:${pk[1]}%;width:${pk[2]}%;height:${pk[3]}%`;
    if (c && b.builtin && !owned(c)) return `<button class="bd-slot empty get" style="${pos}" data-act="ls-get" data-id="${b.id}"><small>${esc(c.name)}</small><em>Get it</em></button>`;
    if (c && !owned(c)) return `<button class="bd-slot full ${sel === i ? 'sel' : ''}" style="${pos}" data-act="${edit ? 'bd-pick' : 'missing'}" data-id="${c.id}" data-i="${i}">${lockedCardHTML(c)}
      ${edit ? `<span class="bd-x" data-act="bd-remove" data-i="${i}" aria-label="Remove">✕</span>` : ''}</button>`;
    if (!id && b.builtin) return `<span class="bd-slot none" style="${pos}"></span>`;
    if (c) return `<button class="bd-slot full ${sel === i ? 'sel' : ''}" style="${pos}" data-act="${edit ? 'bd-pick' : 'push'}" data-s="card" data-id="${c.id}" data-i="${i}">${cardEl(c, S.cards[c.id])}
      ${edit ? `<span class="bd-x" data-act="bd-remove" data-i="${i}" aria-label="Remove">✕</span>` : ''}</button>`;
    return `<button class="bd-slot empty" style="${pos}" data-act="${edit && sel != null ? 'bd-pick' : 'bd-add'}" data-i="${i}" aria-label="Add a card"><span>+</span><small>Add a card</small></button>`;
  }).join('')}</div>`;
}

/* ---------- the Binders tab (inside Collection) ---------- */
function bindersTabHTML(){
  const list = binders();
  const tiles = list.map(b => { const r = lessonRec(b.id), n = binderCards(b).length;
    return `<button class="bd-tile" data-act="push" data-s="binder" data-id="${b.id}">${coverHTML(b)}
      <span class="st-name">${esc(b.name)}</span><span class="st-sub">${n} card${n === 1 ? '' : 's'}${r.best ? ` · best ${r.best}%` : ''}</span></button>`; }).join('');
  const room = list.length < BINDER.free;
  const lessons = LESSONS.map(L => { const r = (S.lessons || {})[L.id] || {}, miss = lessonMissing(L).length;
    return `<button class="bd-tile" data-act="push" data-s="binder" data-id="${L.id}">${coverHTML(L)}
      <span class="st-name">${esc(L.name)}</span><span class="st-sub">${L.cards.length} cards · ${miss ? miss + ' to get' : r.best ? `best ${r.best}%` : 'ready'}</span></button>`; }).join('');
  return `<p class="st-note">Take a binder as a lesson: read each rule, then a quiz. Score ${BINDER.passPct}% to pass.</p>
    <div class="sec-h"><span>Lessons</span></div>
    <div class="bd-shelf">${lessons}</div>
    <div class="sec-h"><span>My Binders</span></div>
    <div class="bd-shelf">${tiles}${room ? `<button class="bd-tile new" data-act="bd-new"><span class="bd-cover blank"><span>+</span></span><span class="st-name">New binder</span><span class="st-sub">${BINDER.free - list.length} of ${BINDER.free} left</span></button>` : ''}</div>
    ${room ? '' : `<p class="foot">You have ${BINDER.free} binders, the most for now. Delete one to start another.</p>`}`;
}

/* ---------- screens ---------- */
const BINDER_SCREENS = {
  binder(p){
    const b = binderById(p.id); if (!b) return { title:'Binder', body:'<p class="empty">This binder was deleted.</p>' };
    const pages = b.slots.length / 4, n = lessonQuizCards(b).length, r = lessonRec(b.id), edit = !!p.edit;
    const miss = lessonMissing(b), ready = lessonReady(b), fixed = !!b.builtin;
    const note = fixed ? (miss.length ? `Get ${miss.length} more card${miss.length === 1 ? '' : 's'} to take the quiz. You can read every rule now.` : `About ${lessonMinutes(b)} min · ${lessonQuestions(b)} questions`)
      : ready ? `About ${lessonMinutes(b)} min · ${lessonQuestions(b)} questions` : `Add ${BINDER.minCards - n} more card${BINDER.minCards - n === 1 ? '' : 's'} to take the lesson`;
    return {
      title:b.name, cta:!edit,
      right:fixed ? '' : `<button class="nb-btn txt" data-act="bd-edit">${edit ? 'Done' : 'Edit'}</button><button class="nb-btn" data-act="bd-menu" data-id="${b.id}" aria-label="More">•••</button>`,
      body:`<div class="bd-head">${coverHTML(b, 'sm')}<span class="bd-stats"><b>${n} card${n === 1 ? '' : 's'}</b>
          <small>${note}</small>
          ${r.best ? `<small>Best score ${r.best}%${r.passes ? ` · passed ${r.passes}×` : ''}</small>` : ''}</span></div>
        ${fixed ? `<p class="st-note">${esc(b.blurb)}</p>` : ''}
        ${edit ? `<p class="st-note c">Tap a card, then tap another pocket to move it. Tap ✕ to take it out.</p>` : ''}
        <div class="bd-pages" id="bd-pages">${Array.from({length:pages}, (_, pg) => pageHTML(b, pg, edit, p.sel)).join('')}</div>
        <div class="bd-dots">${Array.from({length:pages}, (_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
        ${fixed && miss.length ? lessonDeckRow(b) : ''}
        ${!fixed && pages < BINDER.maxPages ? `<button class="row bd-addpage" data-act="bd-addpage" data-id="${b.id}"><span class="st-bimg"><img src="${artSrc('binder_page')}" alt=""></span>
          <span class="row-main"><b>Add a page</b><small>4 more pockets</small></span>${priceTag(BINDER.pagePrice, (S.coins || 0) >= BINDER.pagePrice)}</button>` : ''}`,
      after: edit ? '' : `<div class="cta-bar"><div><button class="btn-big" data-act="bd-read" data-id="${b.id}" ${ready || (fixed && n) ? '' : 'disabled'}>${ICO('read')} READ LESSON</button>
        ${ready ? `<button class="bd-skip" data-act="bd-quiz" data-id="${b.id}">Take the quiz ›</button>`
          : fixed ? `<button class="bd-skip" data-act="ls-get" data-id="${b.id}">Quiz: collect ${miss.length} more card${miss.length === 1 ? '' : 's'} first ›</button>`
          : `<small class="bd-skip">Quiz: add ${BINDER.minCards - n} more card${BINDER.minCards - n === 1 ? '' : 's'} to this binder first</small>`}</div></div>`,
    };
  },
  lessonread(p){
    const b = binderById(p.id); if (!b) return { title:'Lesson', body:'' };
    const list = lessonCards(b);
    if (!list.length) return { title:'Lesson', body:'<p class="empty">There are no available cards in this lesson.</p>' };
    const i = Math.max(0, Math.min(p.i || 0, list.length - 1)), c = list[i], last = i === list.length - 1;
    const body = c.source ? caseFileHTML(c)
      : `<div class="bd-readcard">${owned(c) ? cardEl(c, S.cards[c.id]) : lockedCardHTML(c)}</div>${c.hook ? `<div class="hookbox">${ICO('memory')} ${esc(c.hook)}</div>` : ''}
         ${c.lore ? `<p class="foot">${esc(c.lore[0])}</p>` : ''}`;
    return {
      title:`Rule ${i + 1} of ${list.length}`, cta:true,
      body:`<div class="bd-progress"><b style="width:${(i + 1) / list.length * 100}%"></b></div><p class="rule-sub">${esc(c.name)} · ${esc(b.name)}</p>${body}`,
      after:`<div class="cta-bar"><div>${last ? (lessonReady(b) ? `<button class="btn-big gold" data-act="bd-quiz" data-id="${b.id}">TAKE THE QUIZ →</button>`
          : `<button class="btn-big gold" data-act="ls-get" data-id="${b.id}">GET ${lessonMissing(b).length} CARD${lessonMissing(b).length === 1 ? '' : 'S'} FOR THE QUIZ</button>`)
        : `<button class="btn-big" data-act="bd-next" data-id="${b.id}">NEXT RULE →</button>`}</div></div>`,
    };
  },
};

/* ---------- lesson quiz: a mixed round, two questions per card ---------- */
function startLesson(bid){
  const b = binderById(bid); if (!b) return;
  const cards = lessonQuizCards(b); if (!lessonReady(b)) return;
  const total = lessonQuestions(b), queue = [];
  for (let r = 0; queue.length < total && r < 10; r++) shuffle(cards.slice()).forEach(c => { if (queue.length < total) queue.push(c.id); });
  const shuffled = shuffle(queue); startSession(shuffled[0], { bid, name:b.name, queue:shuffled });
}
function lessonResults(){
  const L = sess.lesson, b = binderById(L.bid), total = L.queue.length;
  const correct = sess.results.filter(Boolean).length, pct = Math.round(correct / total * 100), pass = pct >= BINDER.passPct;
  const r = lessonRec(L.bid), first = pass && !r.passes;
  let coins = 0;
  if (pass) { coins = earnCoins(first ? BINDER.firstPass : BINDER.repeatPass, `Lesson passed: ${L.name}`); r.passes++; r.passedAt = Date.now(); }
  r.best = Math.max(r.best, pct); save();
  const missed = [...new Set(L.queue.filter((id, i) => sess.results[i] === false))].map(byId);
  view = { name:'results' };
  app.innerHTML = `
    <div class="results lesson">
      <h1>${pass ? 'LESSON PASSED' : 'NOT QUITE YET'}</h1>
      ${pass ? `<img class="bd-passed" src="${artSrc('stamp_passed')}" alt="Passed">` : ''}
      <div class="score">${pct}%</div>
      <div class="sub">${correct} of ${total} right · ${BINDER.passPct}% passes</div>
      <div class="rchips"><span class="chip">+${sess.xp} XP</span>${(sess.coins || 0) + coins ? `<span class="chip coin">+${(sess.coins || 0) + coins} ${COIN}</span>` : ''}
        ${pass ? `<span class="chip" style="background:#bfe8c4">${ICO('mastered')} ${first ? 'FIRST PASS +' + BINDER.firstPass : 'PASSED AGAIN +' + BINDER.repeatPass}</span>` : ''}
        ${sess.packGiven ? `<span class="chip">${ICO('pack')} +1 DAILY PACK</span>` : ''}</div>
      ${missed.length ? `<div class="panel bd-missed"><b>Review these</b>${missed.map(c => `<div class="bd-mrow"><span>${esc(c.name)}</span>
          ${c.source ? `<button class="rlink" data-act="read-rule" data-id="${c.id}">Review the rule</button>` : ''}</div>`).join('')}</div>` : ''}
      <div class="stack">
        ${pass ? '' : `<button class="btn-big" data-act="bd-quiz" data-id="${L.bid}">TRY THE QUIZ AGAIN</button>`}
        <button class="btn-big gold" data-act="pack-open">${ICO('pack')} OPEN YOUR PACK</button>
        <button class="btn-big alt" data-act="session-close">Done</button>
      </div>
    </div>`;
  app.scrollTo({top:0});
  if (b) refresh();
}

/* ---------- lesson decks: the cards a built-in lesson still needs ---------- */
const lessonDeckArt = L => `<span class="st-art ls-deck">${coverHTML(L)}</span>`;
function lessonDeckRow(L){
  const m = lessonMissing(L).length, price = lessonDeckPrice(L);
  return `<button class="row bd-addpage" data-act="ls-get" data-id="${L.id}"><span class="st-bimg">${ICO('cards')}</span>
    <span class="row-main"><b>Get the lesson deck</b><small>${m} card${m === 1 ? '' : 's'} you don't have yet</small></span>${priceTag(price, (S.coins || 0) >= price)}</button>`;
}
function lessonDeckSheet(L){
  if (!L || !lessonMissing(L).length) { toast('You already own every card in this lesson', 'check'); return; }
  const list = `<div class="list st-cards">${binderCards(L).map(c => `<div class="row"><span class="st-dot ${owned(c) ? 'have' : ''}">${owned(c) ? ICO('check') : ICO('star')}</span>
    <span class="row-main"><b>${esc(c.name)}</b><small>${owned(c) ? 'Already yours · free' : 'New · ' + cardPrice(c) + ' coins'}</small></span></div>`).join('')}</div>`;
  buySheet({ title:L.name + ' Lesson Deck', art:lessonDeckArt(L), list, price:lessonDeckPrice(L), act:'ls-buy', set:L.id,
    note:"Every card in this lesson. You only pay for the ones you don't have." });
}
function buyLessonDeck(id){
  const L = LESSONS.find(x => x.id === id), miss = L && lessonMissing(L); if (!miss || !miss.length) return;
  if (!spendCoins(lessonDeckPrice(L), `${L.name} Lesson Deck`)) return;
  miss.forEach(c => { S.cards[c.id].owned = true; });
  save(); closeSheet(true); refresh();
  openSheet(`<div class="reward"><h3>${esc(L.name)} Deck added!</h3><p>${miss.length} new card${miss.length > 1 ? 's' : ''}. The quiz is open.</p></div>
    <div class="st-new">${miss.map(c => miniCard(c)).join('')}</div>
    <button class="btn-big gold" data-act="sheet-close">NICE</button>`);
}

/* ---------- sheets: new, rename, cover, add card ---------- */
function nameSheet(title, value, act, id = ''){
  openSheet(`<h3>${esc(title)}</h3><input class="bd-name" id="bd-name" maxlength="40" value="${esc(value)}" placeholder="Binder name" aria-label="Binder name">
    <button class="btn-big gold" data-act="${act}" data-id="${id}">SAVE</button><button class="sheet-cancel" data-act="sheet-close">Cancel</button>`);
  setTimeout(() => { const i = document.getElementById('bd-name'); if (i) { i.focus(); i.select(); } }, 250);
}
function coverSheet(b){
  const coins = S.coins || 0;
  openSheet(`<h3>Binder Cover</h3><div class="bd-covers">${COVERS.map(cv => { const have = ownedCovers().includes(cv.id), on = b.cover === cv.id;
    return `<button class="bd-ctile" data-act="bd-cover" data-id="${b.id}" data-v="${cv.id}">${coverHTML({ ...b, cover:cv.id, id:'_preview' })}<span class="st-name">${esc(cv.name)}</span>
      ${on ? `<span class="st-price owned">${ICO('check')} In use</span>` : have ? `<span class="st-price owned">Use</span>` : priceTag(cv.price, coins >= cv.price)}</button>`; }).join('')}</div>
    <button class="sheet-cancel" data-act="sheet-close">Done</button>`);
}
function addCardSheet(b, slot){
  const inIt = new Set(b.slots.filter(Boolean)), list = CARDS.filter(owned).filter(c => !inIt.has(c.id));
  openSheet(`<h3>Add a card</h3>${list.length ? `<div class="list">${list.map(c => `<button class="row" data-act="bd-put" data-id="${c.id}" data-i="${slot}">${thumb(c)}
      <span class="row-main"><b>${esc(c.name)}</b><small>${esc(c.num)} · ${esc(titleCase(c.set))}</small></span>${chev}</button>`).join('')}</div>`
    : `<p class="empty">Every card you own is already in this binder.</p>`}
    <button class="sheet-cancel" data-act="sheet-close">Cancel</button>`);
}

/* ---------- taps ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const en = topEntry && topEntry(), b0 = en && en.p && binderById(en.p.id), b = b0 && !b0.builtin ? b0 : null;   // built-in lessons can't be edited
  switch (t.dataset.act) {
    case 'bd-new': nameSheet('New binder', `My Binder ${binders().length + 1}`, 'bd-create'); break;
    case 'bd-create': { const v = document.getElementById('bd-name').value; closeSheet(true); const nb = newBinder(v); push('binder', { id:nb.id }); break; }
    case 'bd-rename': { const x = binderById(t.dataset.id); const v = document.getElementById('bd-name').value.trim(); if (x && v) { x.name = v.slice(0, 40); save(); } closeSheet(true); refresh(); break; }
    case 'bd-edit': if (b) { en.p = { ...en.p, edit:!en.p.edit, sel:null }; refresh(); } break;
    case 'bd-add': if (b) addCardSheet(b, +t.dataset.i); break;
    case 'bd-put': if (b) { b.slots[+t.dataset.i] = t.dataset.id; save(); closeSheet(true); refresh(); } break;
    case 'bd-remove': e.stopPropagation(); if (b) { b.slots[+t.dataset.i] = null; en.p = { ...en.p, sel:null }; save(); refresh(); } break;
    case 'bd-pick': if (b) { const i = +t.dataset.i, sel = en.p.sel;
      if (sel == null) { en.p = { ...en.p, sel:i }; refresh(); break; }
      if (sel !== i) { [b.slots[sel], b.slots[i]] = [b.slots[i], b.slots[sel]]; save(); }
      en.p = { ...en.p, sel:null }; refresh(); } break;
    case 'bd-addpage': { const x = binderById(t.dataset.id); if (!x || x.slots.length / 4 >= BINDER.maxPages) break;
      if (spendCoins(BINDER.pagePrice, `Binder page: ${x.name}`)) { x.slots.push(null, null, null, null); save(); refresh(); toast('Page added', 'page'); }
      else toast(`You need ${BINDER.pagePrice} coins for a page`, 'coin'); break; }
    case 'bd-menu': { const x = binderById(t.dataset.id);
      openSheet(`<div class="sh-head"><span class="bd-mini">${coverHTML(x)}</span><span><b>${esc(x.name)}</b><small>${binderCards(x).length} cards</small></span></div>
        <div class="acts"><button data-act="bd-renameopen" data-id="${x.id}">${ICO('page')} Rename</button><button data-act="bd-coveropen" data-id="${x.id}">${ICO('sparkle')} Change cover</button>
        <button class="danger" data-act="bd-delete" data-id="${x.id}">${ICO('warning')} Delete binder</button></div><button class="sheet-cancel" data-act="sheet-close">Cancel</button>`); break; }
    case 'bd-renameopen': { const x = binderById(t.dataset.id); nameSheet('Rename binder', x.name, 'bd-rename', x.id); break; }
    case 'bd-coveropen': coverSheet(binderById(t.dataset.id)); break;
    case 'bd-cover': { const x = binderById(t.dataset.id), cv = COVERS.find(c => c.id === t.dataset.v);
      if (ownedCovers().includes(cv.id)) { x.cover = cv.id; save(); refresh(); coverSheet(x); break; }
      if (spendCoins(cv.price, `${cv.name} binder cover`)) { ownedCovers().push(cv.id); x.cover = cv.id; save(); refresh(); coverSheet(x); toast(`${cv.name} cover on`, 'sparkle'); }
      else toast(`You need ${cv.price} coins for this cover`, 'coin'); break; }
    case 'bd-delete': { const x = binderById(t.dataset.id);
      iosAlert({ title:'Delete this binder?', msg:'Your cards stay in your collection. Only the binder goes away.', buttons:[{label:'Cancel', value:false, style:'bold'}, {label:'Delete', value:true, style:'destructive'}] })
        .then(ok => { if (!ok) return; S.binders = binders().filter(y => y.id !== x.id); save(); closeSheet(true); goBack(); }); break; }
    case 'ls-get': lessonDeckSheet(binderById(t.dataset.id)); break;
    case 'ls-buy': buyLessonDeck(t.dataset.set); break;
    case 'bd-read': push('lessonread', { id:t.dataset.id, i:0 }); break;
    case 'bd-next': { const e2 = topEntry(); e2.p = { ...e2.p, i:(e2.p.i || 0) + 1 }; refresh(); currentScreenEl().querySelector('.scr').scrollTop = 0; break; }
    case 'bd-quiz': { const id = t.dataset.id;
      if (app.hidden && en && en.s === 'lessonread') { en.s = 'binder'; en.p = { id }; refresh(); }   // after the quiz, land back on the binder
      startLesson(id); break; }
  }
});
/* keep the page dots in step with the swipe */
document.addEventListener('scroll', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('bd-pages')) return;
  const i = Math.round(el.scrollLeft / el.clientWidth);
  el.parentElement.querySelectorAll('.bd-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
}, true);

const BINDER_CSS = `
.bd-shelf{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bd-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:12px 8px;border:0;border-radius:16px;background:var(--bg2);color:var(--paper);text-align:center}
.bd-cover{position:relative;display:block;width:78%;container-type:inline-size}
.bd-cover>img:first-child{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
.bd-label{position:absolute;display:flex;align-items:center;justify-content:center;padding:0 4%;text-align:center}
.bd-label b{font:400 11cqw/1 "Bangers";letter-spacing:.03em;color:var(--ink);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bd-stamp{position:absolute;left:8%;bottom:14%;width:84%;transform:rotate(-12deg);filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.bd-cover.blank{aspect-ratio:3/4;border:2px dashed var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;font:400 44px "Bangers";color:var(--sub)}
.bd-head{display:flex;align-items:center;gap:14px;margin:0 0 12px}
.bd-cover.sm{width:92px;flex:none}
.bd-stats{display:flex;flex-direction:column;gap:3px} .bd-stats b{font:400 22px "Bangers";letter-spacing:.04em} .bd-stats small{font:14px var(--ui);color:var(--sub)}
.bd-pages{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:0;border-radius:14px;scrollbar-width:none}
.bd-pages::-webkit-scrollbar{display:none}
.bd-page{position:relative;flex:0 0 100%;scroll-snap-align:start;aspect-ratio:1024/1536}
.bd-page-bg{position:absolute;inset:0;width:100%;height:100%;border-radius:14px}
.bd-slot{position:absolute;padding:0;border:0;background:none}
.bd-slot.full .card{width:100%}
.bd-slot.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#8a7f6c;border:2px dashed rgba(90,80,64,.35);border-radius:8px;background:rgba(255,255,255,.25)}
.bd-slot.empty span{font:400 34px "Bangers";line-height:1} .bd-slot.empty small{font:15px "Patrick Hand"}
.bd-slot.get{border-style:solid;padding:6px;text-align:center} .bd-slot.get small{font:15px/1.15 "Patrick Hand";color:#5a5040}
.bd-slot.get em{font:400 16px "Bangers";letter-spacing:.04em;font-style:normal;padding:4px 12px;border:2px solid var(--ink);border-radius:9px;background:#f3d27a;color:var(--ink)}
.st-art.ls-deck{display:flex;justify-content:center;align-items:center} .st-art.ls-deck .bd-cover{width:62%}
.bd-slot.sel{outline:4px solid var(--mustard);outline-offset:2px;border-radius:8px}
.bd-x{position:absolute;top:-8px;right:-8px;z-index:20;width:28px;height:28px;border-radius:14px;background:var(--brick);color:#fff;font:700 15px/28px var(--ui);text-align:center;border:2px solid var(--ink)}
.bd-dots{display:flex;justify-content:center;gap:6px;margin:10px 0 4px} .bd-dots i{width:7px;height:7px;border-radius:4px;background:var(--line)} .bd-dots i.on{background:var(--mustard)}
.bd-addpage{margin-top:10px;background:var(--bg2);border-radius:16px}
.bd-skip{display:block;margin:8px auto 0;border:0;background:none;color:var(--mustard);font:19px "Patrick Hand"}
.bd-progress{height:6px;border-radius:3px;background:var(--line);overflow:hidden;margin:0 0 10px} .bd-progress b{display:block;height:100%;background:var(--mustard)}
.bd-readcard{width:60%;margin:0 auto 12px}
.bd-name{display:block;width:100%;height:48px;margin:0 0 12px;padding:0 14px;border:0;border-radius:12px;background:var(--bg2);color:var(--paper);font:20px "Patrick Hand"}
.bd-covers{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:0 0 10px}
.bd-ctile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border:0;border-radius:14px;background:var(--bg2);color:var(--paper)}
.bd-ctile .st-name{font-size:13px}
.bd-mini{width:44px;flex:none} .bd-mini .bd-cover{width:100%}
.results.lesson .bd-passed{width:70%;max-width:280px;margin:-4px auto 0;transform:rotate(-8deg);animation:slamimg .35s cubic-bezier(.2,1.6,.4,1) both;--rot:-8deg}
.bd-missed{display:flex;flex-direction:column;gap:8px;text-align:left} .bd-mrow{display:flex;align-items:center;justify-content:space-between;gap:8px}
.bd-mrow .rlink{flex:none;padding:6px 12px;border:2px solid var(--ink);border-radius:10px;background:#f3d27a;color:var(--ink);font:16px "Patrick Hand"}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${BINDER_CSS}</style>`);
