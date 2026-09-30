/* Clerk Quest Hot Dockets: situational cards written as a court docket (spec: docs/superpowers/specs/2026-09-29-hot-docket-design.md).
   A Hot Docket is one card that opens as a tall Study File with four tabs across the top: Learn, Example, Source,
   Practice. The tabs open in order; finishing a page stamps it COMPLETE and unlocks the next. When all four are
   stamped, the level is complete. Every sheet is the same fixed size (the template's shape); long parts are split
   across sheets you flip, and the explanation after an answer comes out on a sticky note, so nothing ever grows.
   Art: see the Study File section below, plus Docket Folder.png (art/docket_folder). Content: "Situational Card - The Record Is Not the Ruling.md", Revision 3.
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, save, esc, artSrc, push, refresh, topEntry, toast, ICO, chev, currentScreenEl). */

const DOCKET_TABS = [['learn', 'Learn'], ['example', 'Example'], ['source', 'Source'], ['practice', 'Practice']];
const RULE_202_5B = 'https://www.nycourts.gov/rules/rule/section-2025-b-electronic-filing-supreme-court-consensual-program';

const HOT_DOCKETS = [{
  id:'CQ-D001', title:'The Record Is Not the Ruling', caseName:'Wharflight Records LLC v Stonebridge Imaging Inc.',
  checked:'Rules checked September 2026',
  levels:[{
    name:'Open the order',
    learn:[
      { h:'Your assignment', p:['You are reviewing a civil case file in the clerk\'s office. Identify which event, filing requirement, or processing category the published rule supports.',
        'In New York County, judgment entry and docketing are County Clerk functions. The Court Clerk and County Clerk are not interchangeable labels.'] },
      { h:'Four dates', p:['Signing, entry, docketing, and service describe different events. Read the document and its stamp before choosing a date.'] },
      { h:'Which interest date?', p:['A money judgment bears interest from entry. An order directing payment, docketed as a judgment, bears interest from docketing.',
        'A party can request docketing of a payment order, including motion costs.'] },
      { h:'Which email?', p:['The entry stamp controls when an order is uploaded later. The court\'s entry email is not party service of notice of entry.',
        'A party can serve the order plus written notice through NYSCEF; uploading proof of earlier paper service adds no new service.'] },
      { h:'File conditions', list:['Supreme Court, New York County; existing mandatory e-filed civil case.', 'Both companies have attorneys participating in e-filing.',
        'Listed defects are the only relevant defects for each question.', 'Applicable fees and proof of service are satisfied unless stated otherwise.',
        'No separate order authorizes refusal or changes these rules.', '"Accept for filing" does not decide timeliness, appealability, or merits.'] },
    ],
    cover:['A dispute over digitized records produces an order directing $1,200 in motion costs. The order is entered, then docketed as a judgment.',
      'All parties, documents, dates, amounts, and conversations are fictional.'],
    entries:[['O1', 'Nov 2', '$1,200 costs order signed.'], ['E1', 'Nov 4', 'County Clerk entry stamp.'], ['E2', 'Nov 5', 'Order uploaded; court entry email sent.'],
      ['R1', 'Nov 6, 9:12 am', 'Party\'s complete docketing request received.'], ['J1', 'Nov 6, 9:40 am', 'Order actually docketed as judgment.'],
      ['S1', 'Nov 10', 'Order and written notice personally served on counsel.'], ['S2', 'Nov 12', 'Service proof uploaded; receipt email sent.']],
    practice:[
      { q:'The worksheet starts J1\'s interest on Nov 4. Which date applies to O1 docketed as a judgment?',
        c:['Nov 2 — signing created the payment obligation.', 'Nov 4 — entry put the order into effect.', 'Nov 6 — the order was docketed as judgment.', 'Nov 10 — service notified counsel of the obligation.'],
        a:2, why:'The worksheet uses the ordinary money-judgment entry rule for an order docketed as a judgment.',
        cite:'CPLR 5003; sample Q17', est:'Interest distinction for a money judgment versus an order docketed as a judgment.',
        links:[['CPLR 5003', 'https://www.nysenate.gov/legislation/laws/CVP/5003'], ['Official sample questions, Q17', 'https://www.nycourts.gov/LegacyPDFS/CAREERS/exams/Court_Clerk_Exam_Questions.pdf']] },
      { q:'Complete R1 arrives before notice of entry is served. What does the docketing rule support?',
        c:['Docket on the party\'s request, without first requiring that service.', 'Await that service, then docket on the existing party request.',
          'Obtain a separately signed judgment, then docket that new document.', 'Obtain a further judicial direction, then docket the existing order.'],
        a:0, why:'The cited rule permits this payment order to be docketed on a party\'s request. B–D add prerequisites not stated there.',
        cite:'CPLR 2222', est:'Party-request docketing of a money-payment order, including motion costs. Not a question about every enforcement requirement.',
        links:[['CPLR 2222', 'https://www.nysenate.gov/legislation/laws/CVP/2222']] },
      { q:'E1 is stamped Nov 4; E2 is uploaded Nov 5. Which event supplies O1\'s entry date?',
        c:['Nov 5 — the electronic recording of the order.', 'Nov 4 — the earlier County Clerk entry stamp.', 'Nov 6 — the order\'s docketing as a judgment.', 'Nov 5 — notification sent to participating counsel.'],
        a:1, why:'Later posting does not replace the earlier stamped entry date.',
        cite:'Rule 202.5-b(h)(1)', est:'The stamped entry date controls when electronic posting happens later.', links:[['Rule 202.5-b', RULE_202_5B]] },
      { q:'What does the file establish about notice-of-entry service?',
        c:['Nov 5 court email served it; Nov 12 merely confirmed that service.', 'Nov 5 court email served it; Nov 10 added another service method.',
          'Nov 10 paper service began it; Nov 12 upload served it again.', 'Nov 10 paper service established it; neither email adds another service.'],
        a:3, why:'The court entry notification is not party service; uploading proof of earlier paper service adds none.',
        cite:'Rule 202.5-b(h)(2)', est:'Court notification versus party service of notice of entry, and a later upload of hard-copy proof.', links:[['Rule 202.5-b', RULE_202_5B]] },
      { q:'Which party action supplies the rule\'s electronic notice-of-entry service route?',
        c:['File the order and written notice; NYSCEF transmits receipt notification.', 'File the entered order alone; its stamp supplies notice of entry.',
          'Forward the court entry email; its link supplies both required documents.', 'File the written notice alone; the earlier order upload supplies the rest.'],
        a:0, why:'The route specifies the order plus written notice. Both attorneys participate in e-filing. General forwarding outside this specified route is not being adjudicated.',
        cite:'Rule 202.5-b(h)(2)', est:'The electronic route for party service of notice of entry.', links:[['Rule 202.5-b', RULE_202_5B]] },
    ],
  }],
}];

/* ---------- saved progress ---------- */
const dockets = () => (S.dockets = Array.isArray(S.dockets) ? S.dockets : []);
const docketDef = id => HOT_DOCKETS.find(d => d.id === id);
function docketRec(id){
  let r = dockets().find(x => x.id === id);
  if (!r) { r = { id, level:1, done:{}, answers:[] }; dockets().push(r); }
  r.done = r.done || {}; r.answers = r.answers || [];
  return r;
}
const tabOpen = (r, i) => DOCKET_TABS.slice(0, i).every(([k]) => r.done[k]);
const doneCount = r => DOCKET_TABS.filter(([k]) => r.done[k]).length;

/* ---------- the Dockets tab (inside Collection) ---------- */
function docketsTabHTML(){
  const rows = HOT_DOCKETS.map(d => { const r = dockets().find(x => x.id === d.id), n = r ? doneCount(r) : 0;
    return `<button class="row dk-row" data-act="push" data-s="docket" data-id="${d.id}"><span class="dk-thumb"><img src="${artSrc('dk_photo_learn')}" alt=""></span>
      <span class="row-main"><b>${esc(d.title)}</b><small>${esc(d.id)} · Level 1 · ${n === 4 ? 'complete' : n ? `${n} of 4 done` : 'not started'}</small></span>${chev}</button>`; }).join('');
  return `<p class="st-note">Hot Dockets are court situations written as a docket. Read the file, then decide how to handle it. They test judgment, not just memory.</p>
    <div class="dk-folder"><img src="${artSrc('docket_folder')}" alt="Docket folder"></div>
    <div class="sec-h"><span>Sample docket</span></div><div class="list">${rows}</div>
    <p class="foot">Soon a new Hot Docket will arrive on your Home screen about once a week. Finished ones stay in this folder as your record.</p>`;
}

/* ---------- the Study File: fixed sheets ----------
   Built from the clip art in "Situational Card Clip Art/": the empty paper docket template (art/sf_template, from
   "Docket - Empty Paper Template.png", with blank tabs), live tab names, the rubber stamps (art/dk_stamp_*), the polaroid frame (art/dk_polaroid) with
   the charcoal photos behind it (art/dk_photo_*), and sticky notes (art/dk_note_*).
   Positions are % of the whole card (853 x 1844); text sizes are in cqw, so every phone shows the same layout. */
const TAB_X = [[7.6, 31], [31, 52], [52, 71.5], [71.5, 91]];
const sfBox = (l, t, w, h) => `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
const TAB_STAMP = { learn:'studyfile', example:'example', source:'source', practice:'practice' };

/* the sheets in each tab: the first sheet is a cover with the photo; the rest are plain paper */
function tabSheets(tab, d, L){
  if (tab === 'learn') return [{ cover:true }, ...L.learn.map(c => ({ card:c }))];
  if (tab === 'example') { const out = [{ cover:true }];
    for (let i = 0; i < L.entries.length; i += 7) out.push({ entries:L.entries.slice(i, i + 7), from:i });
    return out; }
  if (tab === 'source') return [{ cover:true }, ...L.practice.map((q, k) => ({ src:q, k }))];
  return L.practice.map((q, k) => ({ q, k }));
}
function polaroidHTML(tab){
  return `<span class="sf-pol" style="${sfBox(56, 23.4, 34, 23.6)}"><img class="ph" src="${artSrc('dk_photo_' + tab)}" alt=""><img class="fr" src="${artSrc('dk_polaroid')}" alt=""></span>`;
}
const stampImg = (name, cls = '') => `<img class="sf-stampimg ${cls}" src="${artSrc('dk_stamp_' + name)}" alt="${name === 'completed' ? 'Completed' : ''}">`;
const noteHTML = (color, pos, inner, cls = '') => `<div class="sf-note ${cls}" style="${pos};background-image:url('${artSrc('dk_note_' + color)}')"><div class="sf-note-in sf-fit">${inner}</div></div>`;

function sheetInner(tab, sh, d, r, L, p){
  const done = r.done[tab], slam = p.justStamped === tab ? 'slam' : '';
  if (sh.cover) {
    const sub = { learn:`Level 1 · ${L.name}`, example:'The docket so far', source:'The rule behind each question' }[tab];
    const side = `<div class="sf-side" style="${sfBox(9, 24, 45, 23)}">${stampImg(TAB_STAMP[tab], 'head')}<small>${esc(sub)}</small>${done ? stampImg('completed', 'done ' + slam) : ''}</div>`;
    if (tab === 'learn') return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 48.5, 81, 6.5)}"><p>Read each card, then open Example. Every fact you need is here before you answer.</p></div>
      ${noteHTML('yellow', sfBox(9, 56, 44, 23.6), `<b>In this file</b><ul class="sf-toc">${L.learn.map(c => `<li>${esc(c.h)}</li>`).join('')}</ul>`, 'tilt-l')}
      <div class="sf-area" style="${sfBox(57, 60, 33, 16)}"><p class="sf-aside">${L.learn.length} short cards. Swipe or tap Next to turn each sheet.</p></div>`;
    if (tab === 'example') return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 49, 81, 31.5)}"><div class="sf-case"><b>${esc(d.id)} — ${esc(d.caseName)}</b>${L.cover.map(t => `<p>${esc(t)}</p>`).join('')}</div></div>`;
    return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 49, 81, 9)}"><p>Each explanation is ours; the rule itself is at the link on its sheet.</p></div>
      ${noteHTML('blue', sfBox(9, 59, 42, 19.4), `<b>${esc(d.checked)}</b><p>As of September 29, 2026 · next review due December 29, 2026.</p>`, 'tilt-r')}`;
  }
  if (sh.card) return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 57)}"><h4>${esc(sh.card.h)}</h4>${(sh.card.p || []).map(t => `<p>${esc(t)}</p>`).join('')}${sh.card.list ? `<ul>${sh.card.list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  if (sh.entries) return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 57)}"><h4>Level 1 · The costs order</h4>
      <div class="sf-entries">${sh.entries.map(([id, when, what]) => `<div class="sf-entry"><b>${id}</b><span><em>${esc(when)}</em>${esc(what)}</span></div>`).join('')}</div></div>`;
  if (sh.src) { const q = sh.src;
    return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 57)}"><h4>Question ${sh.k + 1}</h4><p class="sf-citeh">${esc(q.cite)}</p>
      <p><em class="lb">What it establishes</em>${esc(q.est)}</p><p class="sf-links">${q.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</p></div>`; }
  // a practice question: question and written choices on the paper, the A-D buttons along the bottom
  const q = sh.q, i = sh.k, ans = r.answers[i], answered = ans != null, sel = answered ? ans : p.sel, bw = (81 - 3 * 1.6) / 4;
  return `<div class="sf-area sf-fit" style="${sfBox(9, 23.4, 81, 50)}">
      <div class="sf-qhead"><b>Question ${i + 1} of ${L.practice.length}</b><span>${L.practice.map((_, k) => `<i class="${r.answers[k] == null ? '' : r.answers[k] === L.practice[k].a ? 'ok' : 'no'} ${k === i ? 'cur' : ''}"></i>`).join('')}</span></div>
      <p class="sf-q">${esc(q.q)}</p>
      <div class="sf-choices">${q.c.map((t, k) => `<div class="sf-choice ${sel === k ? 'sel' : ''} ${answered && k === q.a ? 'right' : ''} ${answered && k === ans && ans !== q.a ? 'wrong' : ''}" ${answered ? '' : `data-act="dk-pick" data-k="${k}"`}><b>${'ABCD'[k]}</b><span>${esc(t)}</span></div>`).join('')}</div></div>
    ${[0, 1, 2, 3].map(k => `<button class="sf-ab ${sel === k ? 'sel' : ''} ${answered && k === q.a ? 'right' : ''}" style="${sfBox(9 + k * (bw + 1.6), 74.4, bw, 5.4)}" data-act="dk-pick" data-k="${k}" ${answered ? 'disabled' : ''} aria-label="Choose ${'ABCD'[k]}"><b>${'ABCD'[k]}</b></button>`).join('')}
    ${answered && p.memo !== false ? `<div class="sf-memo ${p.memoIn ? 'in' : ''}" style="${sfBox(6.5, 44, 87, 25)};background-image:url('${artSrc('dk_note_ivory')}')">
        <div class="sf-note-in sf-fit"><h4 class="${ans === q.a ? 'ok' : 'no'}">${ans === q.a ? 'Correct' : 'Not quite'} · the answer is ${'ABCD'[q.a]}</h4><p>${esc(q.why)}</p><p class="sf-cite">Source: ${esc(q.cite)}</p></div>
        <button class="sf-memo-x" data-act="dk-memo">Hide note</button></div>` : ''}`;
}
function resultsInner(d, r, L, p){
  const n = L.practice.length, right = r.answers.filter((a, k) => a === L.practice[k].a).length;
  return `${polaroidHTML('practice')}
    <div class="sf-side" style="${sfBox(9, 24, 45, 23)}">${stampImg('practice', 'head')}<small>Level 1 results</small>${stampImg('completed', 'done ' + (p.justStamped === 'practice' ? 'slam' : ''))}</div>
    ${noteHTML('green', sfBox(9, 50, 38, 17.6), `<b class="big">${right} of ${n}</b><p>right on Level 1</p>`, 'tilt-l')}
    <div class="sf-area sf-fit" style="${sfBox(50, 49.5, 40, 31)}">${L.practice.map((q, k) => `<div class="sf-res ${r.answers[k] === q.a ? 'ok' : 'no'}"><b>${k + 1}</b>
      <span>${r.answers[k] === q.a ? `Right · ${'ABCD'[q.a]}` : `Chose ${'ABCD'[r.answers[k]]} · answer ${'ABCD'[q.a]}`}</span></div>`).join('')}</div>`;
}

function studyFileHTML(d, r, tab, p){
  const L = d.levels[0], sheets = tabSheets(tab, d, L), results = tab === 'practice' && r.done.practice && p.q == null;
  const i = tab === 'practice' ? Math.min(p.q || 0, sheets.length - 1) : Math.min(p.sheet || 0, sheets.length - 1);
  const tabs = DOCKET_TABS.map(([k, label], ti) => { const open = tabOpen(r, ti), [x0, x1] = TAB_X[ti];
    return `<button class="sf-tab ${k === tab ? 'on' : ''} ${open ? '' : 'locked'}" style="${sfBox(x0, 5.4, x1 - x0, 4.4)}" data-act="dk-tab" data-tab="${k}"
      aria-label="${label}${r.done[k] ? ', complete' : open ? '' : ', locked'}"><span>${label}</span>${r.done[k] ? '<i>✓</i>' : open ? '' : `<i class="lk">${ICO('lock')}</i>`}</button>`; }).join('');
  const header = `<span class="sf-title" style="${sfBox(9, 16.9, 61, 5)}">${esc(d.title)}</span>
    <span class="sf-cell" style="${sfBox(70, 16.9, 20, 5)}">${esc(d.id)}<br>LEVEL 1</span><span class="sf-rule" style="${sfBox(9, 22.4, 81, .2)}"></span>`;
  const inner = results ? resultsInner(d, r, L, p) : sheetInner(tab, sheets[i], d, r, L, p);
  const card = `<div class="sf2 ${p.flip ? 'flip-' + p.flip : ''}" data-tab="${tab}">
    <img class="sf-base" src="${artSrc('sf_template')}" alt="">${tabs}<div class="sf-page">${header}${inner}</div></div>`;
  // the control bar under the card: always the same place and size
  let bar;
  if (tab === 'practice') {
    const answered = r.answers[i] != null, last = i === sheets.length - 1;
    bar = results ? `<button class="sf-btn" data-act="dk-review" data-q="0">Review questions</button><span class="sf-count">${r.answers.filter((a, k) => a === L.practice[k].a).length} of ${sheets.length} right</span><span class="sf-btn ghost"></span>`
      : `<button class="sf-btn" data-act="dk-q" data-q="${i - 1}" ${i ? '' : 'disabled'}>‹ Back</button><span class="sf-count">Question ${i + 1} of ${sheets.length}</span>
        ${!answered ? `<button class="sf-btn go" data-act="dk-check" ${p.sel == null ? 'disabled' : ''}>Check ✓</button>`
          : last ? (r.done.practice ? `<button class="sf-btn go" data-act="dk-review" data-q="">Results ›</button>` : `<button class="sf-btn go gold" data-act="dk-done" data-tab="practice">Finish ✓</button>`)
          : `<button class="sf-btn go" data-act="dk-q" data-q="${i + 1}">Next ›</button>`}`;
  } else {
    const last = i === sheets.length - 1, next = DOCKET_TABS[DOCKET_TABS.findIndex(([k]) => k === tab) + 1];
    bar = `<button class="sf-btn" data-act="dk-sheet" data-d="-1" ${i ? '' : 'disabled'}>‹ Back</button><span class="sf-count">Sheet ${i + 1} of ${sheets.length}</span>
      ${r.done[tab] && (last || i === 0) ? `<button class="sf-btn go" data-act="dk-tab" data-tab="${next[0]}">${next[1]} ›</button>`
        : !last ? `<button class="sf-btn go" data-act="dk-sheet" data-d="1">Next ›</button>`
        : `<button class="sf-btn go gold" data-act="dk-done" data-tab="${tab}">Finish ✓</button>`}`;
  }
  return `${card}<div class="sf-bar">${bar}</div>`;
}

/* shrink a sheet's writing until it fits its fixed box (never below a readable size) */
function fitSheets(root){
  (root || document).querySelectorAll('.sf-fit').forEach(el => {
    if (!el.closest('.sf2').clientWidth) return;
    let fs = parseFloat(el.dataset.fs || '') || (el.classList.contains('sf-note-in') ? 4.8 : 5.4); el.dataset.fs = fs; el.style.fontSize = fs + 'cqw';
    for (let k = 0; k < 24 && el.scrollHeight > el.clientHeight + 1 && fs > 3.9; k++) { fs -= .1; el.style.fontSize = fs.toFixed(2) + 'cqw'; }
    el.classList.toggle('scrolls', el.scrollHeight > el.clientHeight + 1);   // still too long: scroll inside the paper
  });
}
new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.sf2') || n.querySelector && n.querySelector('.sf2'))))) requestAnimationFrame(() => fitSheets()); })
  .observe(document.documentElement, { childList:true, subtree:true });

/* ---------- screens ---------- */
const DOCKET_SCREENS = {
  docket(p){
    const d = docketDef(p.id); if (!d) return { title:'Hot Docket', body:'<p class="empty">This docket is not available.</p>' };
    const r = docketRec(p.id);
    let tab = DOCKET_TABS.some(([k]) => k === p.tab) ? p.tab : (DOCKET_TABS.find(([k]) => !r.done[k]) || DOCKET_TABS[3])[0];
    if (!tabOpen(r, DOCKET_TABS.findIndex(([k]) => k === tab))) tab = 'learn';
    if (tab === 'practice' && p.q == null && !r.done.practice) p.q = Math.min(r.answers.filter(a => a != null).length, d.levels[0].practice.length - 1);
    const all = doneCount(r) === 4;
    return { title:'Hot Docket',
      body:`${all ? `<div class="sf-banner">${ICO('mastered')} Level 1 complete! Levels 2 and 3 are coming soon.</div>` : ''}${studyFileHTML(d, r, tab, p)}` };
  },
};

/* ---------- taps and swipes ---------- */
function dkGo(patch){
  const en = topEntry(); if (!en || en.s !== 'docket') return;
  en.p = { ...en.p, justStamped:null, flip:null, memoIn:false, ...patch }; refresh();
}
function dkSheet(dir){
  const en = topEntry(), d = docketDef(en.p.id), L = d.levels[0], tab = currentScreenEl().querySelector('.sf2').dataset.tab;
  if (tab === 'practice') return;
  const n = tabSheets(tab, d, L).length, i = Math.max(0, Math.min(n - 1, (en.p.sheet || 0) + dir));
  if (i !== (en.p.sheet || 0)) dkGo({ tab, sheet:i, flip:dir > 0 ? 'next' : 'prev' });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const en = topEntry && topEntry(); if (!en || en.s !== 'docket') return;
  const d = docketDef(en.p.id), r = d && docketRec(d.id), L = d && d.levels[0]; if (!d) return;
  switch (t.dataset.act) {
    case 'dk-tab': { const i = DOCKET_TABS.findIndex(([k]) => k === t.dataset.tab);
      if (!tabOpen(r, i)) { toast(`Finish ${DOCKET_TABS.find(([k]) => !r.done[k])[1]} first`, 'lock'); break; }
      dkGo({ tab:t.dataset.tab, sheet:0, q:null, sel:null, memo:true }); break; }
    case 'dk-sheet': dkSheet(+t.dataset.d); break;
    case 'dk-done': { const k = t.dataset.tab; r.done[k] = true; if (k === 'practice') r.practiceAt = Date.now(); save();
      dkGo({ tab:k, sheet:0, q:null, justStamped:k });
      toast(doneCount(r) === 4 ? 'Docket Level 1 complete!' : `${DOCKET_TABS.find(([x]) => x === k)[1]} complete`, 'check'); break; }
    case 'dk-pick': dkGo({ sel:+t.dataset.k }); break;
    case 'dk-check': { const i = en.p.q || 0; if (en.p.sel == null || r.answers[i] != null) break; r.answers[i] = en.p.sel; save(); dkGo({ memo:true, memoIn:true }); break; }
    case 'dk-memo': dkGo({ memo:false }); break;
    case 'dk-q': { const q = +t.dataset.q; dkGo({ q, sel:null, memo:true, flip:q > (en.p.q || 0) ? 'next' : 'prev' }); break; }
    case 'dk-review': dkGo({ q:t.dataset.q === '' ? null : +t.dataset.q, sel:null, memo:true }); break;
  }
});
let dkSwipe = null;
document.addEventListener('pointerdown', e => { const c = e.target.closest('.sf2'); dkSwipe = c && !e.target.closest('button,a,.sf-memo') ? { x:e.clientX, y:e.clientY } : null; });
document.addEventListener('pointerup', e => {
  if (!dkSwipe) return; const dx = e.clientX - dkSwipe.x, dy = e.clientY - dkSwipe.y; dkSwipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) dkSheet(dx < 0 ? 1 : -1);
});

const DOCKET_CSS = `
.dk-folder{width:min(62%,260px);margin:4px auto 2px}
.dk-folder img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
.dk-thumb{flex:none;width:44px;height:44px;border-radius:6px;overflow:hidden;border:3px solid #f4efe4;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.dk-thumb img{width:100%;height:100%;object-fit:cover}
.sf2{position:relative;margin:0 -8px;aspect-ratio:853/1844;container-type:inline-size;color:#2a241c}
.sf2.flip-next .sf-page{animation:sfnext .3s ease-out both} .sf2.flip-prev .sf-page{animation:sfprev .3s ease-out both}
@keyframes sfnext{from{transform:translateX(5%);opacity:0}} @keyframes sfprev{from{transform:translateX(-5%);opacity:0}}
.sf-base{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 2cqw 3cqw rgba(0,0,0,.45))}
.sf-page{position:absolute;inset:0;z-index:2;pointer-events:none}
.sf-page>*{pointer-events:auto}
.sf-tab{position:absolute;z-index:3;border:0;background:none;padding:0 0 0 1cqw;display:flex;align-items:center;justify-content:center;gap:1cqw}
.sf-tab span{font:700 3.5cqw/1 "Courier Prime",monospace;color:rgba(42,36,28,.62)}
.sf-tab.on span{color:#1d1b17;text-decoration:underline;text-decoration-thickness:.45cqw;text-underline-offset:.9cqw}
.sf-tab.locked span{opacity:.45}
.sf-tab i{position:absolute;right:-.6cqw;top:-2cqw;font:700 3.2cqw/4.4cqw var(--ui);font-style:normal;width:4.4cqw;height:4.4cqw;border-radius:2.2cqw;background:#2f6b3a;color:#fff;text-align:center}
.sf-tab i.lk{background:rgba(40,34,26,.72);display:flex;align-items:center;justify-content:center}
.sf-tab i.lk .ico,.sf-tab i.lk svg,.sf-tab i.lk img{width:2.8cqw;height:2.8cqw}
.sf-title{position:absolute;display:flex;align-items:center;font:400 5.2cqw/1 "Bangers";letter-spacing:.03em;color:#2a241c}
.sf-cell{position:absolute;display:flex;align-items:center;justify-content:flex-end;text-align:right;font:700 2.8cqw/1.25 "Courier Prime",monospace;color:#5a5040}
.sf-rule{position:absolute;background:rgba(42,36,28,.45)}
.sf-side{position:absolute;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:2cqw}
.sf-side small{font:4.4cqw/1.2 "Patrick Hand";color:#5a5040}
.sf-stampimg{display:block;height:auto;mix-blend-mode:multiply}
.sf-stampimg.head{width:100%;transform:rotate(-4deg);opacity:.92}
.sf-stampimg.done{width:86%;transform:rotate(-7deg);opacity:.9}
.sf-stampimg.slam{animation:sfslam .4s cubic-bezier(.2,1.6,.4,1) both}
@keyframes sfslam{0%{transform:rotate(-7deg) scale(2.4);opacity:0}100%{transform:rotate(-7deg) scale(1);opacity:.9}}
.sf-pol{position:absolute;display:block;transform:rotate(4deg);filter:drop-shadow(0 1.2cqw 1.8cqw rgba(0,0,0,.35))}
.sf-pol .ph{position:absolute;left:10.55%;top:13.28%;width:79.1%;height:63.67%;object-fit:cover}
.sf-pol .fr{position:absolute;inset:0;width:100%;height:100%}
.sf-note{position:absolute;background:no-repeat center/100% 100%;filter:drop-shadow(0 1cqw 1.4cqw rgba(0,0,0,.28))}
.sf-note.tilt-l{transform:rotate(-2deg)} .sf-note.tilt-r{transform:rotate(2deg)}
.sf-note-in{position:absolute;left:9%;right:9%;top:16%;bottom:13%;overflow:hidden;font:4.8cqw/1.35 "Patrick Hand"}
.sf-note-in b{display:block;font:400 1.15em/1.1 "Bangers";letter-spacing:.04em;margin-bottom:.25em}
.sf-note-in b.big{font-size:2.2em}
.sf-note-in p{margin:0 0 .35em}
.sf-area{position:absolute;overflow:hidden;font:5.4cqw/1.42 "Patrick Hand"}
.sf-area.scrolls,.sf-note-in.scrolls{overflow-y:auto;-webkit-mask-image:linear-gradient(#000 88%,transparent)}
.sf-area h4{margin:0 0 .4em;font:400 1.3em/1.1 "Bangers";letter-spacing:.04em;color:#2b3a55}
.sf-area p,.sf-area li{margin:0 0 .55em}
.sf-area ul{margin:0 0 .5em;padding-left:1.1em}
.sf-aside{font-size:.85em;color:#5a5040}
.sf-toc{margin:0;padding-left:1.2em} .sf-toc li{list-style:none;position:relative;margin:0 0 .15em} .sf-toc li::before{content:"☐";position:absolute;left:-1.2em;color:#8a7f6c}
.sf-case b{display:block;font:700 .82em/1.3 "Courier Prime",monospace;margin-bottom:.4em}
.sf-entries{display:flex;flex-direction:column;border-top:.4cqw solid rgba(42,36,28,.35)}
.sf-entry{display:flex;gap:.6em;padding:.38em 0;border-bottom:.4cqw solid rgba(42,36,28,.2);font:.78em/1.32 "Courier Prime",monospace}
.sf-entry b{flex:none;width:2.2em;font-weight:700;color:#b3261e}
.sf-entry em{display:block;font-style:normal;font-weight:700}
.sf-citeh{font:700 .9em/1.3 "Courier Prime",monospace}
.sf-area em.lb{display:block;font-style:normal;font:400 .8em/1.2 "Bangers";letter-spacing:.06em;color:#8a7f6c}
.sf-links{display:flex;flex-wrap:wrap;gap:.3em .9em} .sf-links a{color:#2b3a55;font-weight:700}
.sf-qhead{display:flex;align-items:center;justify-content:space-between;margin:0 0 .3em}
.sf-qhead b{font:400 1.05em "Bangers";letter-spacing:.05em;color:#2b3a55}
.sf-qhead span{display:flex;gap:1.2cqw} .sf-qhead i{width:2.6cqw;height:2.6cqw;border-radius:1.3cqw;border:.4cqw solid #2a241c;opacity:.45}
.sf-qhead i.cur{opacity:1} .sf-qhead i.ok{background:#2f6b3a;border-color:#2f6b3a;opacity:1} .sf-qhead i.no{background:#b3261e;border-color:#b3261e;opacity:1}
.sf-q{font-weight:700}
.sf-choices{display:flex;flex-direction:column;gap:.3em}
.sf-choice{display:flex;gap:.5em;align-items:flex-start;padding:.3em .4em;border-radius:1.8cqw;border:.5cqw solid transparent;font-size:.94em;line-height:1.32;cursor:pointer}
.sf-choice b{flex:none;width:1.4em;height:1.4em;border-radius:1.2cqw;background:#dccab0;font:700 .85em/1.65em "Courier Prime",monospace;text-align:center}
.sf-choice.sel{border-color:#2b3a55;background:rgba(43,58,85,.08)} .sf-choice.sel b{background:#2b3a55;color:#f6ecd6}
.sf-choice.right{border-color:#2f6b3a;background:rgba(47,107,58,.12)} .sf-choice.right b{background:#2f6b3a;color:#fff}
.sf-choice.wrong{border-color:#b3261e;background:rgba(179,38,30,.08)} .sf-choice.wrong span{text-decoration:line-through;text-decoration-color:#b3261e}
.sf-ab{position:absolute;display:flex;align-items:center;padding:0 0 0 1.6cqw;border:.4cqw solid rgba(42,36,28,.45);border-radius:2cqw;background:rgba(255,250,238,.55)}
.sf-ab b{width:6.4cqw;height:6.4cqw;border-radius:1.2cqw;background:#dccab0;font:700 4.2cqw/6.4cqw "Courier Prime",monospace;color:#2a241c;text-align:center}
.sf-ab.sel{border-color:#2b3a55;background:rgba(43,58,85,.16)} .sf-ab.sel b{background:#2b3a55;color:#f6ecd6}
.sf-ab.right b{background:#2f6b3a;color:#fff}
.sf-ab[disabled]{cursor:default}
.sf-memo{position:absolute;z-index:5;background:no-repeat center/100% 100%;transform:rotate(-1.2deg);filter:drop-shadow(0 1.6cqw 2.6cqw rgba(0,0,0,.35))}
.sf-memo .sf-note-in{left:7%;right:7%;top:14%;bottom:17%}
.sf-memo.in{animation:memoin .38s cubic-bezier(.2,1.2,.4,1) both}
@keyframes memoin{from{transform:translateY(30%) rotate(-4deg);opacity:0}}
.sf-memo h4{margin:0 0 .3em;font:400 1.2em/1.1 "Bangers";letter-spacing:.04em} .sf-memo h4.ok{color:#2f6b3a} .sf-memo h4.no{color:#b3261e}
.sf-cite{font:700 .72em/1.3 "Courier Prime",monospace;color:#5a5040}
.sf-memo-x{position:absolute;right:8%;bottom:5%;border:0;background:none;color:#2b3a55;font:4.2cqw "Patrick Hand";text-decoration:underline}
.sf-res{display:flex;gap:.5em;align-items:center;padding:.3em 0;border-bottom:.4cqw solid rgba(42,36,28,.2)}
.sf-res b{flex:none;width:1.4em;height:1.4em;border-radius:.7em;background:#2f6b3a;color:#fff;font:700 .8em/1.75em var(--ui);text-align:center}
.sf-res.no b{background:#b3261e}
.sf-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;min-height:48px}
.sf-count{font:18px "Patrick Hand";color:var(--sub);text-align:center;flex:1}
.sf-btn{flex:none;min-width:96px;min-height:46px;padding:0 14px;border:2px solid rgba(241,229,201,.35);border-radius:12px;background:var(--bg2);color:var(--paper);font:19px "Patrick Hand"}
.sf-btn.go{background:#2b3a55;border-color:#2b3a55} .sf-btn.go.gold{background:var(--mustard);border-color:var(--mustard);color:var(--ink)}
.sf-btn.ghost{visibility:hidden}
.sf-btn[disabled]{opacity:.35}
.sf-banner{margin:0 0 10px;padding:10px 12px;border-radius:12px;background:rgba(227,178,60,.16);color:var(--mustard);font:18px "Patrick Hand";display:flex;gap:8px;align-items:center}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${DOCKET_CSS}</style>`);
