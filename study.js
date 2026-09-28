/* Clerk Quest study tools: read the rules, search them, and (later) highlight and keep a notebook.
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, CARDS, SCREENS helpers, esc, titleCase, thumb, chev, owned, READ_QS, READ_XP). */

/* ---------- rules: the verified source text on rule cards ---------- */
function ruleCards(){ return CARDS.filter(c => c.source); }
function ruleSubjects(){
  const sets = [...new Set(ruleCards().map(c => c.set))];
  return sets.map(set => ({ set, label:titleCase(set), cards:ruleCards().filter(c => c.set === set) }));
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
    return `${lead}<span class="ph ${on ? 'on' : ''}" role="button" aria-pressed="${on}" data-act="hl" data-id="${c.id}" data-i="${i}">${esc(ph)}</span>`;
  }).join('');
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="hl"]'); if (!t) return;
  const c = byId(t.dataset.id), ph = splitPhrases(c.source.quote)[+t.dataset.i].trim();
  const on = toggleHighlight(c.id, ph);
  t.classList.toggle('on', on); t.setAttribute('aria-pressed', on);
});

/* The Case File block: the rule on lined paper. Shared by the card's Case File tab and the Read rule page. */
function caseFileHTML(c){
  const read = !!(S.read || {})[c.id];
  return `<div class="casefile"><h4>The source rule</h4><div class="cite">${esc(c.source.cite)}</div>
    <p class="cf-quote">“${phrasesHTML(c)}”</p><p class="hl-tip">Tap a phrase to highlight it. Tap again to clear it.</p>
    ${READ_QS[c.id] ? `<h4>Read it with these questions</h4><ol>${READ_QS[c.id].map(q => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
    <h4>When it comes up</h4><p class="ctx">${esc(c.source.context)}</p><p class="from">Source: ${esc(c.source.from)}</p>
    <button class="readbtn ${read ? 'done' : ''}" data-act="mark-read" data-id="${c.id}" ${read ? 'disabled' : ''}>${read ? 'Case file reviewed' : `Mark as reviewed · +${READ_XP} XP`}</button></div>`;
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
    return `<div class="list">${ruleSubjects().map(s => `<button class="row" data-act="push" data-s="readset" data-g="${esc(s.set)}">
      <span class="th emo gi">📖</span><span class="row-main"><b>${esc(s.label)}</b><small>${s.cards.length} rule${s.cards.length === 1 ? '' : 's'}</small></span>${chev}</button>`).join('')}</div>
      <p class="foot">Every rule here is quoted from its official source. You can read rules for cards you haven't collected yet.</p>`;
  }
  const hits = searchRules(query);
  if (!hits.length) return `<p class="empty">No rules match “${esc(query)}”. Try a single word, like <b>summons</b> or <b>days</b>.</p>`;
  return `<div class="list results">${hits.map(c => `<button class="row" data-act="push" data-s="rule" data-id="${c.id}">${thumb(c)}
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

/* ---------- screens ---------- */
const STUDY_SCREENS = {
  readset(p){
    const s = ruleSubjects().find(x => x.set === p.g) || {label:'Rules', cards:[]};
    return { title:s.label, body:`<div class="list">${s.cards.map(c => ruleRow(c)).join('')}</div>` };
  },
  rule(p){
    const c = byId(p.id);
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
.rule-sub{margin:-4px 2px 12px;font:15px var(--ui);color:var(--sub)}
.openrow{margin-top:14px;background:var(--bg2);border:.5px solid var(--line);border-radius:16px}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STUDY_CSS}</style>`);
