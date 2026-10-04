/* Clerk Quest study tools: read the rules, search them, and (later) highlight and keep a notebook.
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, CARDS, SCREENS helpers, esc, titleCase, thumb, chev, owned, READ_QS, READ_XP). */

/* ---------- rules: the verified source text on rule cards ---------- */
function ruleCards(){ return CARDS.filter(c => c.source); }
function ruleSubjects(){
  const sets = [...new Set(ruleCards().map(c => c.set))];
  return sets.map(set => ({ set, label:titleCase(set), cards:ruleCards().filter(c => c.set === set) }));
}
function quickReferenceEntries(){ return Array.isArray(window.CQ_QUICK_REFERENCE) ? window.CQ_QUICK_REFERENCE : []; }
function quickReferenceSubjects(){
  return [...new Set(quickReferenceEntries().map(r => r.law))].map(law => ({ law, label:`${law} Quick Reference`, entries:quickReferenceEntries().filter(r => r.law === law) }));
}
function quickReferenceRow(r, words=[]){
  const title = words.length ? markWords(r.title, words) : esc(r.title), cite = words.length ? markWords(r.cite, words) : esc(r.cite);
  const summary = words.length ? markWords(r.summary, words) : esc(r.summary);
  return `<button class="row" data-act="push" data-s="reference" data-id="${esc(r.id)}"><span class="th emo gi">${ICO('read')}</span>
    <span class="row-main"><b>${title}</b><small>${cite}</small>${words.length ? `<span class="snip">${summary}</span>` : ''}</span>${chev}</button>`;
}

/* ---------- notebook storage (in the main save, so cloud save carries it) ---------- */
function nb(){
  const n = S.notebook = S.notebook && typeof S.notebook === 'object' ? S.notebook : {};
  if (!n.hl || typeof n.hl !== 'object') n.hl = {};
  if (!n.notes || typeof n.notes !== 'object') n.notes = {};
  if (!Array.isArray(n.saved)) n.saved = [];
  if (!Array.isArray(n.pages)) n.pages = [];
  return n;
}

/* ---------- phrases: rule text split at , ; : and sentence ends (then long ones at clause starts); every word lands in exactly one phrase ---------- */
function splitPhrases(text){
  const out = [], re = /[,;:](?=\s)|[.?!]+(?=\s|$)/g; let last = 0, m;
  while ((m = re.exec(text))) { const end = m.index + m[0].length; out.push(text.slice(last, end)); last = end; }
  if (last < text.length) out.push(text.slice(last));
  return out.flatMap(splitLong).filter(p => p.trim());
}
/* A long phrase also breaks where a new clause starts ("and the", "or by", "unless", "at least"…), keeping each piece 40+ characters */
function splitLong(p){
  if (p.trim().length <= 110) return [p];
  const out = [], re = /\s(?=(?:(?:and|or) (?:the|by|such|a|an)|unless|at least|except|that the)\s)/g; let last = 0, m;
  while ((m = re.exec(p))) if (m.index - last >= 40 && p.length - m.index >= 40) { out.push(p.slice(last, m.index)); last = m.index; }
  out.push(p.slice(last));
  return out;
}
function isHighlighted(id, phrase){ return (nb().hl[id] || []).includes(phrase); }
function toggleHighlight(id, phrase){
  const n = nb(), list = n.hl[id] || [];
  const i = list.indexOf(phrase);
  if (i >= 0) list.splice(i, 1); else list.push(phrase);
  if (list.length) n.hl[id] = list; else delete n.hl[id];
  save();
  return i < 0;
}
/* Rule text as tappable phrases (whitespace stays outside the spans so the text reads normally) */
function phrasesHTML(c){
  return splitPhrases(c.source.quote).map((raw, i) => {
    const lead = raw.match(/^\s*/)[0], ph = raw.trim(), on = isHighlighted(c.id, ph);
    return `${lead}<span class="ph ${on ? 'on' : ''}" role="button" tabindex="0" aria-pressed="${on}" data-act="hl" data-id="${c.id}" data-i="${i}">${esc(ph)}</span>`;
  }).join('');
}
document.addEventListener('keydown', e => {   // the highlights are buttons, so Enter and Space work too
  const t = e.key === 'Enter' || e.key === ' ' ? e.target.closest('[data-act="hl"]') : null;
  if (t) { e.preventDefault(); t.click(); }
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="hl"]'); if (!t) return;
  const c = byId(t.dataset.id), ph = splitPhrases(c.source.quote)[+t.dataset.i].trim();
  const on = toggleHighlight(c.id, ph);
  t.classList.toggle('on', on); t.setAttribute('aria-pressed', on);
});

/* The Case File block: the rule on lined paper. Shared by the card's Case File tab and the Read rule page. */
function caseFileHTML(c){
  if (!onb().read) onbFlag('read');   // Getting Started: "Read a rule"
  const read = !!(S.read || {})[c.id];
  const paraphrase = !!c.source.paraphrase;
  return `<div class="casefile"><h4>${paraphrase ? 'Verified study summary' : 'The source rule'}</h4><div class="cite">${esc(c.source.cite)}</div>
    <p class="cf-quote">${paraphrase ? phrasesHTML(c) : `“${phrasesHTML(c)}”`}</p><p class="hl-tip">Tap a phrase to highlight it. Tap again to clear it.</p>
    ${READ_QS[c.id] ? `<h4>Read it with these questions</h4><ol>${READ_QS[c.id].map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
    <h4>When it comes up</h4><p class="ctx">${esc(c.source.context)}</p><p class="from">${paraphrase ? 'Paraphrase checked against' : 'Source'}: ${esc(c.source.from)}${paraphrase && c.source.url ? ` · <a href="${esc(c.source.url)}" target="_blank" rel="noopener">controlling text</a>` : ''}</p>
    ${eightbackExplainerButtonHTML(c)}
    ${noteBoxHTML(c)}
    <button class="readbtn ${read ? 'done' : ''}" data-act="mark-read" data-id="${c.id}" ${read ? 'disabled' : ''}>${read ? 'Case file reviewed' : `Mark as reviewed · +${READ_XP} XP`}</button></div>`;
}

/* An optional video lesson for the timing pattern on Eight Before, Two Back: the 60-second motion deadlines
   explainer (about a minute, narrated, captions burned in). It lives in a sheet, so opening or closing it never changes card or
   quiz state. `from` = 'intro' brings the person back to the card's intro. */
const EIGHTBACK_VIDEOS = {
  full: { label:'Full explainer', len:'1 min', src:'media/motion-deadlines-explainer.mp4?v=60s', poster:'media/motion-deadlines-explainer-poster.jpg?v=60s',
    transcript:[
      'When someone asks a New York court to decide a motion, the judge sets a hearing day. And before that day arrives, the law gives each side a deadline. Deadlines that are counted backward.',
      'Here\'s the standard rule. The moving party, the side asking for something, must serve their papers at least eight days before the hearing. Then the other side gets their turn. Their answer is due at least two days before. Eight, two. That\'s the default.',
      'But the moving party has a choice. If they serve their notice at least sixteen days early, and demand early answers right in that notice, everything shifts. Now the other side must answer at least seven days before. And the moving party earns something new: a reply, due one day before the hearing. Sixteen, seven, one.',
      'One catch. If the notice goes out fewer than sixteen days ahead, the demand doesn\'t count. It\'s back to eight, two.',
      'So remember the two fuses. A short fuse: eight, two. A long fuse: sixteen, seven, one. Serve early, demand early, and you earn the last word.',
    ] },
};
function eightbackExplainerButtonHTML(c, from){
  return c && c.id === 'eightback'
    ? `<button class="explain-watch" data-act="watch-explanation" data-id="eightback"${from ? ` data-from="${from}"` : ''}>${PLAY_ICON} Watch explanation <span>${EIGHTBACK_VIDEOS.full.len}</span></button>`
    : '';
}
function openEightbackExplainer(from){
  const v = EIGHTBACK_VIDEOS.full;
  openSheet(`<div class="video-lesson">
    <p class="video-kicker">CPLR 2214(b) · motion deadlines</p>
    <h3>Eight Before, Two Back</h3>
    <video controls playsinline preload="metadata" poster="${v.poster}" aria-describedby="eightback-video-note eightback-transcript">
      <source src="${v.src}" type="video/mp4">
      Your browser cannot play this video. The transcript follows below.
    </video>
    <p class="video-note" id="eightback-video-note">Study guide to CPLR 2214(b); service method, calendar rules, and court directions can affect actual deadlines.</p>
    <details class="video-transcript" id="eightback-transcript"><summary>Read the transcript</summary>
      ${v.transcript.map(p => `<p>${esc(p)}</p>`).join('')}
    </details>
    <p class="video-sources"><a href="https://www.nysenate.gov/legislation/laws/CVP/2214" target="_blank" rel="noopener">New York Senate statute</a> · <a href="https://www.nycourts.gov/new-york-city-civil-court/cplr-2214" target="_blank" rel="noopener">New York Courts guide</a></p>
    ${from === 'intro' ? `<button class="sheet-cancel" data-act="intro-back" data-id="eightback">Back to the intro</button>` : `<button class="sheet-cancel" data-act="sheet-close">Close explanation</button>`}
  </div>`);
}

function ruleRow(c, sub){
  return `<button class="row" data-act="push" data-s="rule" data-id="${c.id}">${thumb(c)}
    <span class="row-main"><b>${esc(c.name)}</b><small>${sub || esc(c.source.cite)}</small>
    ${owned(c) ? '' : '<span class="notyet">Not in your collection yet</span>'}</span>${chev}</button>`;
}

/* ---------- search: card name, citation, and rule text; every word must match ---------- */
function searchRules(query){
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return ruleCards().filter(c => {
    const hay = (c.name + ' ' + c.source.cite + ' ' + c.source.quote).toLowerCase();
    return words.every(w => hay.includes(w));
  });
}
function searchQuickReference(query){
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return quickReferenceEntries().filter(r => words.every(w => [r.title,r.cite,r.summary,r.context,r.hook,...(r.tags || [])].join(' ').toLowerCase().includes(w)));
}
function markWords(text, words){
  // One pass over the raw text, so a search word can never match inside an inserted <mark> tag
  const re = new RegExp(words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
  let out = '', last = 0;
  text.replace(re, (m, i) => { out += esc(text.slice(last, i)) + '<mark>' + esc(m) + '</mark>'; last = i + m.length; return m; });
  return out + esc(text.slice(last));
}
function snippet(c, words){
  const q = c.source.quote, lower = q.toLowerCase();
  const at = words.map(w => lower.indexOf(w)).filter(i => i >= 0).sort((a, b) => a - b)[0];
  if (at == null) return markWords(c.source.cite, words);
  const start = Math.max(0, at - 50), end = Math.min(q.length, at + 90);
  return (start > 0 ? '…' : '') + markWords(q.slice(start, end), words) + (end < q.length ? '…' : '');
}
function readResultsHTML(query){
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return `<div class="list">${quickReferenceSubjects().map(s => `<button class="row" data-act="push" data-s="referenceset" data-g="${esc(s.law)}">
      <span class="th emo gi">${ICO('read')}</span><span class="row-main"><b>${esc(s.label)}</b><small>${s.entries.length} verified summaries</small></span>${chev}</button>`).join('')}
      ${ruleSubjects().map(s => `<button class="row" data-act="push" data-s="readset" data-g="${esc(s.set)}">
      <span class="th emo gi">${ICO('read')}</span><span class="row-main"><b>${esc(s.label)}</b><small>${s.cards.length} rule${s.cards.length === 1 ? '' : 's'}</small></span>${chev}</button>`).join('')}</div>
      <p class="foot">Quick Reference entries are checked summaries for study; follow the official-source link for controlling text. Card rules and study summaries stay readable before collection.</p>`;
  }
  const hits = searchRules(query), refs = searchQuickReference(query);
  if (!hits.length && !refs.length) return `<p class="empty">No rules match “${esc(query)}”. Try a single word, like <b>summons</b> or <b>days</b>.</p>`;
  return `<div class="list results">${refs.map(r => quickReferenceRow(r, words)).join('')}${hits.map(c => `<button class="row" data-act="push" data-s="rule" data-id="${c.id}">${thumb(c)}
    <span class="row-main"><b>${markWords(c.name, words)}</b><small>${markWords(c.source.cite, words)}</small><span class="snip">${snippet(c, words)}</span>
    ${owned(c) ? '' : '<span class="notyet">Not in your collection yet</span>'}</span>${chev}</button>`).join('')}</div>`;
}

/* The Read tab of the Study screen */
function readTabHTML(p){
  const q = p.q || '';
  return `<label class="srch"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <input type="search" data-search="rules" placeholder="Search the rules" value="${esc(q)}" autocomplete="off" autocorrect="off" enterkeyhint="search" aria-label="Search the rules"></label>
    <div id="read-results">${readResultsHTML(q)}</div>`;
}

/* Typing updates only the results, so the keyboard stays open. The query is kept on the screen entry for Back. */
document.addEventListener('input', e => {
  const inp = e.target.closest('[data-search="rules"]'); if (!inp) return;
  const en = topEntry(); en.p = Object.assign({}, en.p, {q:inp.value});
  const box = document.getElementById('read-results'); if (box) box.innerHTML = readResultsHTML(inp.value);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-search="rules"]')) e.target.blur(); });

/* ---------- rule notes: one per card, saved as you type ---------- */
const shortDate = t => new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric'});
function noteBoxHTML(c){
  const n = nb().notes[c.id];
  return `<h4>My note</h4><textarea class="cf-note" data-note="${c.id}" rows="3" placeholder="Write it in your own words…" aria-label="My note on ${esc(c.name)}">${esc(n ? n.text : '')}</textarea>
    <p class="note-at" data-note-at="${c.id}">${n ? 'Saved ' + shortDate(n.at) : ''}</p>`;
}
const growArea = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
let saveTimer = null;
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); };
document.addEventListener('input', e => {
  const ta = e.target.closest('[data-note]'); if (!ta) return;
  const id = ta.dataset.note, n = nb();
  if (ta.value.trim()) n.notes[id] = { text:ta.value, at:Date.now() }; else delete n.notes[id];
  growArea(ta); saveSoon();
  const at = document.querySelector(`[data-note-at="${id}"]`); if (at) at.textContent = n.notes[id] ? 'Saved' : '';
});
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); save(); });

/* ---------- saved quiz questions: a full copy, so it stays readable if the card's questions change ---------- */
const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };
function isSavedQ(cardId, q){ return nb().saved.some(x => x.cardId === cardId && x.q === q); }
function saveQButtonHTML(){
  const done = isSavedQ(sess.id, sess.q.q);
  return `<button class="rlink savq ${done ? 'done' : ''}" data-act="save-q" ${done ? 'disabled' : ''}>${done ? 'Saved to notebook' : 'Save to notebook'}</button>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act="save-q"]'); if (!b || b.disabled || !sess || !sess.answered) return;
  const q = sess.q, a = sess.answered;
  if (!isSavedQ(sess.id, q.q)) {
    nb().saved.unshift({ id:Date.now().toString(36), cardId:sess.id, q:q.q, opts:q.opts.slice(), a:q.a, choice:a.choice, ok:a.ok, w:q.raw ? plain(q.w) : q.w, at:Date.now() });
    save();
  }
  b.classList.add('done'); b.disabled = true; b.textContent = 'Saved to notebook';
});
function savedSheet(id){
  const x = nb().saved.find(s => s.id === id); if (!x) return;
  const c = byId(x.cardId);
  openSheet(`<h3>Saved question</h3><p class="as-q">${esc(x.q)}</p>
    <div class="as-list sv">${x.opts.map((o, i) => `<div class="${o === x.a ? 'right' : o === x.choice ? 'wrong' : ''}"><b>${'ABCD'[i]}</b><span>${esc(o)}${o === x.a ? '<em>Right answer</em>' : o === x.choice ? '<em>Your answer</em>' : ''}</span></div>`).join('')}</div>
    <p class="sv-why">${esc(x.w)}</p>
    <div class="acts">${c && c.source ? `<button data-act="sv-rule" data-id="${c.id}">Read the rule</button>` : ''}<button class="danger" data-act="sv-del" data-id="${x.id}">Remove from notebook</button></div>
    <button class="sheet-cancel" data-act="sheet-close">Done</button>`);
}

/* ---------- pages: free-form notes ---------- */
/* A new page is only stored once something is typed in it, so blank pages never pile up. */
function newPage(){ push('page', {id:'new-' + Date.now().toString(36)}); }
document.addEventListener('input', e => {
  const f = e.target.closest('[data-page]'); if (!f) return;
  const n = nb(), id = f.dataset.page;
  let pg = n.pages.find(p => p.id === id);
  if (!pg) { if (!id.startsWith('new-')) return; pg = { id, title:'', text:'', at:Date.now() }; n.pages.unshift(pg); }
  pg[f.dataset.field] = f.value; pg.at = Date.now();
  if (f.tagName === 'TEXTAREA') growArea(f);
  else { const t = f.closest('.screen').querySelector('.nb-title'); if (t) t.textContent = f.value.trim() || 'Page'; }
  saveSoon();
});

/* ---------- the Notebook tab ---------- */
function notebookResultsHTML(query){
  const n = nb(), words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = str => words.every(w => str.toLowerCase().includes(w));
  const rules = ruleCards().filter(c => (n.hl[c.id] || []).length || n.notes[c.id])
    .filter(c => !words.length || hit([c.name, c.source.cite, ...(n.hl[c.id] || []), n.notes[c.id] ? n.notes[c.id].text : ''].join(' ')));
  const saved = n.saved.filter(x => !words.length || hit([x.q, ...x.opts, x.w, (byId(x.cardId) || {}).name || ''].join(' ')));
  const pages = n.pages.filter(p => !words.length || hit(p.title + ' ' + p.text));
  const mk = t => words.length ? markWords(t, words) : esc(t);
  if (!rules.length && !saved.length && !pages.length) {
    return words.length ? `<p class="empty">Nothing in your notebook matches “${esc(query)}”.</p>`
      : `<div class="nb-empty"><b>Your notebook is empty.</b><span>Highlight a phrase in any rule, write a note under it, or save a question after you answer it. It all collects here.</span></div>`;
  }
  let h = '';
  if (rules.length) h += `<div class="sec-h"><span>My Rules</span></div><div class="list">${rules.map(c => {
    const order = splitPhrases(c.source.quote).map(x => x.trim());   // list highlights in reading order
    const hl = (n.hl[c.id] || []).slice().sort((x, y) => order.indexOf(x) - order.indexOf(y)), note = n.notes[c.id];
    return `<button class="row nbrow" data-act="push" data-s="rule" data-id="${c.id}"><span class="row-main"><b>${mk(c.name)}</b><small>${esc(c.source.cite)}</small>
      ${hl.map(t => `<span class="nb-hl">${mk(t)}</span>`).join('')}${note ? `<span class="nb-note">${mk(note.text)}</span>` : ''}</span>${chev}</button>`; }).join('')}</div>`;
  if (saved.length) h += `<div class="sec-h"><span>Saved Questions</span></div><div class="list">${saved.map(x => {
    const c = byId(x.cardId);
    return `<button class="row nbrow" data-act="sv-open" data-id="${x.id}"><span class="row-main"><b class="wrap">${mk(x.q)}</b>
      <small>${c ? esc(c.name) + ' · ' : ''}${x.ok ? 'You got it right' : 'You missed it'} · ${shortDate(x.at)}</small></span>${chev}</button>`; }).join('')}</div>`;
  if (pages.length) h += `<div class="sec-h"><span>Pages</span></div><div class="list">${pages.map(p => `<button class="row nbrow" data-act="push" data-s="page" data-id="${p.id}">
    <span class="th emo gi">${ICO('page')}</span><span class="row-main"><b>${mk(p.title.trim() || 'Untitled page')}</b><small>${shortDate(p.at)}${p.text.trim() ? ' · ' + mk(p.text.trim().slice(0, 80)) : ''}</small></span>${chev}</button>`).join('')}</div>`;
  return h;
}
function notebookTabHTML(p){
  const q = p.q || '';
  return `<div class="nb-top"><label class="srch"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <input type="search" data-search="notes" placeholder="Search my notebook" value="${esc(q)}" autocomplete="off" enterkeyhint="search" aria-label="Search my notebook"></label>
    <button class="nb-new" data-act="nb-new">+ New page</button></div>
    <div id="nb-results">${notebookResultsHTML(q)}</div>`;
}
document.addEventListener('input', e => {
  const inp = e.target.closest('[data-search="notes"]'); if (!inp) return;
  const en = topEntry(); en.p = Object.assign({}, en.p, {q:inp.value});
  const box = document.getElementById('nb-results'); if (box) box.innerHTML = notebookResultsHTML(inp.value);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-search="notes"]')) e.target.blur(); });

/* taps for the notebook */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.act) {
    case 'nb-new': newPage(); break;
    case 'sv-open': savedSheet(id); break;
    case 'sv-rule': closeSheet(true); push('rule', {id}); break;
    case 'sv-del':
      iosAlert({title:'Remove this question?', msg:'It will be removed from your notebook.', buttons:[{label:'Cancel', value:false, style:'bold'}, {label:'Remove', value:true, style:'destructive'}]})
        .then(ok => { if (!ok) return; const n = nb(); n.saved = n.saved.filter(x => x.id !== id); save(); closeSheet(); refresh(); });
      break;
    case 'pg-del':
      if (!nb().pages.some(p => p.id === id)) { goBack(); break; }   // nothing typed yet, so nothing to delete
      iosAlert({title:'Delete this page?', msg:'This can\'t be undone.', buttons:[{label:'Cancel', value:false, style:'bold'}, {label:'Delete', value:true, style:'destructive'}]})
        .then(ok => { if (!ok) return; const n = nb(); n.pages = n.pages.filter(p => p.id !== id); save(); goBack(); });
      break;
  }
});
/* grow note boxes to fit their text whenever a screen draws */
new MutationObserver(() => document.querySelectorAll('textarea.cf-note,textarea.pg-text').forEach(growArea))
  .observe(document.documentElement, {childList:true, subtree:true});

/* ---------- screens ---------- */
const STUDY_SCREENS = {
  referenceset(p){
    const s = quickReferenceSubjects().find(x => x.law === p.g) || {label:'Quick Reference', entries:[]};
    return { title:s.label, body:`<div class="list">${s.entries.map(r => quickReferenceRow(r)).join('')}</div>` };
  },
  reference(p){
    const r = quickReferenceEntries().find(x => x.id === p.id);
    if (!r) return { title:'Reference unavailable', body:'<p class="empty">This reference could not be found.</p>' };
    return { title:r.title, body:`<p class="rule-sub">${esc(r.cite)} · checked ${esc(r.verified || '')}</p>
      <div class="casefile qr-file"><h4>Verified summary</h4><p>${esc(r.summary)}</p>
      <h4>When it comes up</h4><p>${esc(r.context)}</p>${r.example ? `<h4>Example</h4><p>${esc(r.example)}</p>` : ''}
      ${r.hook ? `<h4>Memory hook</h4><p>${esc(r.hook)}</p>` : ''}</div>
      ${r.url ? `<p class="foot"><a href="${esc(r.url)}" target="_blank" rel="noopener">Read the controlling text at NYSenate.gov</a>. This study summary is not a substitute for the statute.</p>` : ''}` };
  },
  readset(p){
    const s = ruleSubjects().find(x => x.set === p.g) || {label:'Rules', cards:[]};
    return { title:s.label, body:`<div class="list">${s.cards.map(c => ruleRow(c)).join('')}</div>` };
  },
  page(p){
    const pg = nb().pages.find(x => x.id === p.id) || (p.id.startsWith('new-') ? { id:p.id, title:'', text:'' } : null);
    if (!pg) return { title:'Page', body:'<p class="empty">This page was deleted.</p>' };
    return {
      title:pg.title.trim() || 'Page', hideLarge:true,
      right:`<button class="nb-btn" data-act="pg-del" data-id="${pg.id}" aria-label="Delete page">Delete</button>`,
      body:`<div class="casefile pagefile"><input class="pg-title" data-page="${pg.id}" data-field="title" value="${esc(pg.title)}" placeholder="Title" aria-label="Page title">
        <textarea class="pg-text" data-page="${pg.id}" data-field="text" rows="8" placeholder="Start writing…" aria-label="Page text">${esc(pg.text)}</textarea></div>
        <p class="foot">Saves as you type.</p>`
    };
  },
  rule(p){
    const c = byId(p.id);
    if (!c) return { title:'Rule unavailable', body:'<p class="empty">This rule could not be found.</p>' };
    const mine = owned(c);
    return {
      title:c.name, cta:mine,
      body:`<p class="rule-sub">${esc(titleCase(c.set))}</p>${caseFileHTML(c)}
        ${mine ? `<button class="row openrow" data-act="push" data-s="card" data-id="${c.id}">${thumb(c)}<span class="row-main"><b>Open card</b><small>${statusLine(c)}</small></span>${chev}</button>`
          : `<p class="foot">This card isn't in your collection yet. Find it in a pack to quiz on it.</p>`}`,
      after: mine ? `<div class="cta-bar"><div><button class="btn-big" data-act="study" data-id="${c.id}">${PLAY_ICON} QUIZ THIS CARD</button></div></div>` : ''
    };
  },
};

const STUDY_CSS = `
.explain-watch{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;margin:0 0 var(--line,14px);padding:8px 14px;border:2px solid var(--ink);border-radius:12px;background:#5d7d8c;color:#fff8ea;font:700 16px var(--ui);box-shadow:0 3px 0 rgba(30,25,20,.28);cursor:pointer}
.explain-watch:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(30,25,20,.28)}
.explain-watch .ico{width:20px;height:20px}.explain-watch span{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;opacity:.72}
.explain .explain-watch{width:auto;min-height:0;margin:0;padding:1.2cqw 2.8cqw;border-width:.4cqw;border-radius:1.6cqw;font:inherit;font-size:3.4cqw;box-shadow:none}
.video-lesson .video-kicker{margin:2px 0 3px;text-align:center;color:var(--mustard);font:700 12px var(--ui);letter-spacing:.1em;text-transform:uppercase}
.video-lesson h3{margin-bottom:12px}
.video-lesson video{display:block;width:min(100%,360px);max-height:52dvh;margin:0 auto;border:2px solid var(--ink);border-radius:14px;background:#211f1b;box-shadow:0 5px 0 rgba(0,0,0,.28)}
.video-note{margin:12px 3px 10px;color:var(--paper);font:14px/1.4 var(--ui)}
.video-transcript{margin:0 3px;padding:10px 12px;border-radius:12px;background:var(--bg2);color:var(--paper);font:14px/1.45 var(--ui)}
.video-transcript summary{min-height:24px;color:var(--mustard);font-weight:700;cursor:pointer}.video-transcript p{margin:10px 0 0}
.video-sources{margin:10px 3px 0;color:var(--sub);font:13px/1.4 var(--ui)}.video-sources a{color:var(--mustard)}
.srch{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 12px;margin:0 0 14px;border-radius:12px;background:rgba(255,255,255,.08);color:var(--sub)}
.srch svg{width:18px;height:18px;flex:none}
.srch input{flex:1;min-width:0;height:44px;border:0;background:none;color:var(--paper);font:16px var(--ui);outline:none}
.srch input::placeholder{color:var(--sub)}
.notyet{align-self:flex-start;margin-top:2px;padding:1px 8px;border-radius:9px;background:rgba(255,255,255,.1);font:12px var(--ui);color:var(--sub)}
.results .row{align-items:flex-start}
.results .row .th{margin-top:3px}
.snip{font:14px/1.35 var(--ui);color:var(--paper);opacity:.85;white-space:normal}
.row-main mark,.snip mark{background:#f3d27a;color:var(--ink);border-radius:3px;padding:0 1px}
.casefile .ph{cursor:pointer;-webkit-tap-highlight-color:transparent;border-radius:3px;transition:background-color .15s}
.casefile .ph.on{background:linear-gradient(transparent 12%,rgba(255,214,64,.85) 12%,rgba(255,214,64,.85) 88%,transparent 88%);box-decoration-break:clone;-webkit-box-decoration-break:clone}
.casefile .hl-tip{margin:calc(var(--line) * -1) 0 var(--line);font-size:15px;line-height:var(--line);opacity:.6}
.casefile .cf-note{display:block;width:100%;min-height:calc(var(--line) * 3);margin:0;padding:0;border:0;resize:none;overflow:hidden;background:none;color:#1d4f7a;font:inherit;line-height:var(--line);outline:none}
.casefile .cf-note::placeholder,.pagefile ::placeholder{color:var(--ink);opacity:.35}
.casefile .note-at{margin:0 0 var(--line);min-height:var(--line);font-size:14px;opacity:.5;text-align:right}
.pagefile .pg-title{display:block;width:100%;height:var(--line);margin:0 0 var(--line);padding:0;border:0;background:none;color:#a8321f;font:400 22px/var(--line) "Bangers";letter-spacing:.05em;outline:none}
.pagefile .pg-text{display:block;width:100%;min-height:calc(var(--line) * 12);margin:0;padding:0;border:0;resize:none;overflow:hidden;background:none;color:var(--ink);font:inherit;line-height:var(--line);outline:none}
.nb-top{display:flex;gap:8px;align-items:flex-start}
.nb-top .srch{flex:1;min-width:0}
.nb-new{flex:none;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:var(--mustard);color:var(--ink);font:700 15px var(--ui)}
.nbrow{align-items:flex-start}
.nbrow .row-main b.wrap{white-space:normal;font-size:16px;line-height:1.3}
.nb-hl{align-self:flex-start;margin-top:3px;padding:2px 6px;border-radius:4px;background:rgba(255,214,64,.85);color:var(--ink);font:16px/1.3 "Patrick Hand";white-space:normal}
.nb-note{margin-top:4px;padding-left:8px;border-left:3px solid #6fa3d6;font:15px/1.35 var(--ui);color:var(--paper);white-space:pre-wrap}
.nb-empty{display:flex;flex-direction:column;gap:6px;padding:26px 18px;text-align:center;border-radius:16px;background:var(--bg2);color:var(--sub);font:15px/1.4 var(--ui)}
.nb-empty b{color:var(--paper);font:400 20px "Bangers";letter-spacing:.06em}
.as-list.sv div{display:flex;align-items:stretch;border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:#f6e7c8;color:var(--ink)}
.as-list.sv div b{flex:none;width:46px;display:flex;align-items:center;justify-content:center;background:#5d7d8c;border-right:3px solid var(--ink);color:#fff;font:400 26px "Luckiest Guy";-webkit-text-stroke:1px var(--ink)}
.as-list.sv div span{padding:10px 12px;font:20px/1.25 "Patrick Hand"}
.as-list.sv div em{display:block;font:700 12px var(--ui);font-style:normal;letter-spacing:.06em;text-transform:uppercase;margin-top:4px}
.as-list.sv .right{background:#cfe6c8} .as-list.sv .right em{color:#1f6b2b}
.as-list.sv .wrong{background:#f1c4ba} .as-list.sv .wrong em{color:#a8321f}
.sv-why{margin:14px 4px;font:16px/1.45 var(--ui);color:var(--paper)}
.sheet .acts{margin-top:4px}
.explain .ex-acts{display:flex;flex-wrap:wrap;gap:1.6cqw;margin:0 0 1.4cqw}
.explain .ex-acts .rlink{margin:0}
.explain .savq.done{background:#cfe6c8}
.rule-sub{margin:-4px 2px 12px;font:15px var(--ui);color:var(--sub)}
.openrow{margin-top:14px;background:var(--bg2);border:.5px solid var(--line);border-radius:16px}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STUDY_CSS}</style>`);
