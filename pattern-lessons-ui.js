/* Pattern lessons: the overlay player (data: pattern-lessons.js). Four screens: the method, a worked example you tap through,
   a check question, then the hand-off to the drill. A full-screen layer like the exam; gives no XP, coins or recall.
   Placeholder art (plain paper panels) until the ChatGPT images are swapped in. Runs at call time on the app's globals. */
/* ruled-line positions measured on art/pl_calendar.webp (tools/pl_art.py), as fractions of the page; the grid is drawn on top of the picture */
const PL_CAL = { aspect:944 / 1397, cols:[0.0191, 0.1547, 0.2913, 0.4285, 0.5662, 0.705, 0.8422, 0.9799], rows:[0.2845, 0.4313, 0.5759, 0.7173, 0.8533, 0.9785] };
const plPct = n => (n * 100).toFixed(2) + '%';
const plTracks = a => a.slice(1).map((v, i) => ((v - a[i]) * 1000).toFixed(1) + 'fr').join(' ');
/* a red step stamp picture; if the picture is missing it falls back to the plain CSS stamp */
const plStampImg = (i, key, L) => `<img class="pl-stampimg" src="${artSrc(L.stampArt + '_' + (i + 1))}" alt="${esc((i + 1) + ' ' + key)}" onerror="plArtFail(this)" data-fb="${esc(key)}">`;
function plArtFail(img){ const s = document.createElement('span'); s.className = 'pl-stamp'; s.textContent = img.dataset.fb || ''; img.replaceWith(s); }
const plMark = (name, cls) => `<img class="pl-mark ${cls}" src="${artSrc('pl_mark_' + name)}" alt="" onerror="this.remove()">`;

let pl = null;   // { key, screen:0-3, shown:0..reveals+1, tried:[wrong choices] }

function plOpen(key){
  if (!PATTERN_LESSONS[key]) return;
  pl = { key, screen:0, shown:0, tried:[] };
  let el = document.getElementById('pl-root');
  if (!el) { el = document.createElement('div'); el.id = 'pl-root'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Lesson'); document.body.appendChild(el); }
  plRender();   // the app's modal-layer watcher (A11Y_LAYERS) hides the screens behind, focuses the first button and restores focus on close
}
function plClose(){
  document.getElementById('pl-root')?.remove();
  pl = null; refresh();
}
const plBtn = key => PATTERN_LESSONS[key]
  ? `<button class="wk-btn pl-open" data-act="pl-open" data-key="${key}"><img class="pl-folder" src="${artSrc('pl_folder')}" alt="" onerror="this.remove()">${(S.patternLessons || {})[key] ? 'Review the method' : 'Learn the method'}</button>` : '';

function plCalendar(L){
  const ex = L.example, n = ex.reveals.length, end = plDate.add(ex.start, ex.days), cells = plDate.grid(ex.start), s = pl.shown, back = ex.direction === 'back';
  const cell = c => {
    const isStart = c.iso === ex.start && s >= 1, isEnd = c.iso === end && s >= n + 1;
    return `<i class="pl-cell">${c.day === 1 ? '<small>' + c.month + '</small>' : ''}${c.day}${isStart ? plMark('circle1', 'pl-circle') : ''}${isEnd ? plMark('circle2', 'pl-circle') : ''}</i>`;
  };
  const c = PL_CAL, gx = c.cols[0], gy = c.rows[0], gw = c.cols[7] - c.cols[0], gh = c.rows[5] - c.rows[0];
  const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<i>${d}</i>`).join('');
  return `<div class="pl-cal" style="aspect-ratio:${c.aspect}" aria-label="Calendar">
    <div class="pl-dowrow" style="left:${plPct(gx)};width:${plPct(gw)};top:${plPct(gy - 0.05)};grid-template-columns:${plTracks(c.cols)}">${dow}</div>
    <div class="pl-grid" style="left:${plPct(gx)};top:${plPct(gy)};width:${plPct(gw)};height:${plPct(gh)};grid-template-columns:${plTracks(c.cols)};grid-template-rows:${plTracks(c.rows)}">${cells.map(cell).join('')}</div>
    <div class="pl-dir" style="top:${plPct(0.1)}">${s >= 2 ? plMark(back ? 'arrow_back' : 'arrow_fwd', 'pl-arrow') : ''}${s >= 3 ? `<b>${ex.days} days</b>` : ''}</div></div>`;
}
/* the side-by-side sheet for look-alikes: rows appear as the reveals reach them; the split row is circled; the answer column gets the check */
function plCompare(L){
  const ex = L.example, s = pl.shown, n = ex.reveals.length, answerOn = s >= n + 1;
  const vis = new Set(ex.reveals.slice(0, Math.min(s, n)).flatMap(r => r.rows));
  const head = [ex.left.name, ex.right.name].map(name => {
    const isAns = answerOn && ex.answer.toUpperCase() === name;
    return `<b class="pl-cmp-h ${isAns ? 'win' : ''}">${esc(name)}${isAns ? plMark('circle2', 'pl-cmp-circle') + plMark('check', 'pl-cmp-check') : ''}</b>`;
  }).join('');
  const rows = ex.rows.map((r, i) => !vis.has(i) ? '' : r.wide
    ? `<div class="pl-cmp-row wide"><span class="pl-cmp-lbl">${esc(r.label)}</span><span class="pl-cmp-both">${esc(r.text)}</span></div>`
    : `<div class="pl-cmp-row ${r.split ? 'split' : ''}"><span class="pl-cmp-lbl">${esc(r.label)}</span><span>${esc(r.left)}</span><span>${esc(r.right)}</span>${r.split ? plMark('circle1', 'pl-cmp-split') : ''}</div>`).join('');
  return `<div class="pl-cmp" aria-label="Comparison"><div class="pl-cmp-head">${head}</div>${rows}</div>`;
}
function plScreenMethod(L){
  return `<h2>${esc(L.title)}</h2><p class="pl-lead">${esc(L.promise)}</p>
    <ol class="pl-steps">${L.steps.map((st, i) => `<li>${plStampImg(i, st.key, L)}<span><b>${esc(st.label)}</b>${esc(st.text)}</span></li>`).join('')}</ol>
    <button class="btn-big gold" data-act="pl-next">${PLAY_ICON} SEE IT WORK</button>`;
}
function plScreenExample(L){
  const ex = L.example, s = pl.shown, n = ex.reveals.length, done = ex.reveals.slice(0, Math.min(s, n));
  const label = s === 0 ? 'FIRST STEP' : s < n ? 'NEXT STEP' : s === n ? 'SHOW THE ANSWER' : 'TRY A CHECK QUESTION';
  const answer = ex.type === 'compare' ? ex.answer : plDate.fmt(plDate.add(ex.start, ex.days));
  return `<h2>See it work</h2><p class="pl-scenario">${esc(ex.scenario)}</p>${ex.type === 'compare' ? plCompare(L) : plCalendar(L)}
    <ul class="pl-reveals">${done.map(r => `<li>${plStampImg(r.step, L.steps[r.step].key, L)}${esc(r.say)}</li>`).join('')}
      ${s >= n + 1 ? `<li class="pl-answer"><b>Answer: ${esc(answer)}</b>${plMark('check', 'pl-checkmark')}</li>` : ''}</ul>
    <button class="btn-big gold" data-act="${s >= n + 1 ? 'pl-next' : 'pl-reveal'}">${PLAY_ICON} ${label}</button>`;
}
function plScreenCheck(L){
  const ck = L.check, solved = pl.tried.includes(ck.a);
  return `<h2>Your turn</h2><p class="pl-scenario">${esc(ck.q)}</p>
    <div class="pl-choices">${ck.c.map((c, i) => `<button class="pl-choice ${pl.tried.includes(c) ? (c === ck.a ? 'ok' : 'no') : ''}" data-act="pl-pick" data-i="${i}" ${solved || pl.tried.includes(c) ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>
    ${pl.tried.length && !solved ? `<p class="pl-why">Not quite. ${esc(ck.w)} Try another answer.</p>` : ''}
    ${solved ? `<p class="pl-why ok">Right. ${esc(ck.w)}</p><button class="btn-big gold" data-act="pl-next">${PLAY_ICON} NEXT</button>` : ''}`;
}
function plScreenDone(L){
  return `<h2>You have the method</h2><p class="pl-lead">${esc(L.done)}</p>
    <div class="pl-drill" id="pl-drill">${typeof plDrillHTML === 'function' ? plDrillHTML(L) : ''}</div>
    <button class="sheet-cancel" data-act="pl-close">Close</button>`;
}
function plRender(){
  const el = document.getElementById('pl-root'); if (!el || !pl) return;
  const L = PATTERN_LESSONS[pl.key], screens = [plScreenMethod, plScreenExample, plScreenCheck, plScreenDone];
  el.innerHTML = `<div class="pl-top"><button class="pl-x" data-act="pl-close" aria-label="Close lesson">✕</button>
      <span class="pl-dots">${screens.map((_, i) => `<i class="${i === pl.screen ? 'on' : ''}"></i>`).join('')}</span>
      ${pl.screen > 0 && pl.screen < 3 ? `<button class="pl-back" data-act="pl-back">Back</button>` : '<span></span>'}</div>
    <div class="pl-body">${screens[pl.screen](L)}</div>`;
  el.scrollTop = 0;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && pl) { e.preventDefault(); plClose(); } });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act^="pl-"]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'pl-open') return plOpen(t.dataset.key);
  if (!pl) return;
  const L = PATTERN_LESSONS[pl.key];
  if (a === 'pl-close') return plClose();
  if (a === 'pl-back') { pl.screen = Math.max(0, pl.screen - 1); }
  else if (a === 'pl-next') { pl.screen = Math.min(3, pl.screen + 1); if (pl.screen === 3 && typeof plFinish === 'function') plFinish(); }
  else if (a === 'pl-reveal') { pl.shown = Math.min(L.example.reveals.length + 1, pl.shown + 1); }
  else if (a === 'pl-pick') { const c = L.check.c[+t.dataset.i]; if (c !== undefined && !pl.tried.includes(c) && !pl.tried.includes(L.check.a)) pl.tried.push(c); }
  else return;
  plRender();
});

const plDrillIds = key => plPickDrill(Weak.weakCards().map(c => c.id), CARDS, PATTERN_LESSONS[key].drill, canStudyCard);
/* reaching the last screen counts as finishing the lesson */
function plFinish(){
  S.patternLessons = S.patternLessons && typeof S.patternLessons === 'object' ? S.patternLessons : {};
  S.patternLessons[pl.key] = Date.now(); save();
}
function plDrillHTML(L){
  const ids = plDrillIds(pl.key);
  return ids.length
    ? `<button class="btn-big gold" data-act="pl-drill">${PLAY_ICON} DRILL MY CARDS</button>`
    : `<p class="pl-lead">${esc(L.noCards)}</p>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="pl-drill"]'); if (!t || !pl) return;
  const ids = plDrillIds(pl.key); plClose(); if (ids.length) weakDrill(ids);
});

const PL_CSS = `
#pl-root{position:fixed;inset:0;z-index:900;background:var(--bg);display:flex;flex-direction:column;overflow-y:auto;color:var(--paper)}
.pl-top{display:flex;align-items:center;justify-content:space-between;padding:calc(10px + env(safe-area-inset-top)) 14px 6px}
.pl-x,.pl-back{min-width:44px;min-height:44px;border:0;background:none;color:var(--sub);font:20px "Patrick Hand"}
.pl-dots{display:flex;gap:6px}.pl-dots i{width:8px;height:8px;border-radius:4px;background:var(--line)}.pl-dots i.on{background:var(--mustard)}
.pl-body{width:min(100%,420px);margin:0 auto;padding:6px 18px calc(28px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px}
.pl-body h2{margin:0;font:400 30px/1.05 "Bangers";letter-spacing:.04em}
.pl-lead,.pl-scenario{margin:0;font:20px/1.3 "Patrick Hand"}
.pl-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.pl-steps li{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:12px;background:#f0e4ca;color:#242d36;font:17px/1.3 "Patrick Hand"}
.pl-steps li b{display:block;font:20px/1.2 "Patrick Hand";font-weight:400;text-decoration:underline}
.pl-stamp{flex:none;box-sizing:border-box;min-width:104px;text-align:center;padding:3px 7px;border:2px solid #b3322a;border-radius:4px;color:#b3322a;font:15px/1.1 "Bangers";letter-spacing:.06em;transform:rotate(-3deg);white-space:nowrap}
.pl-cal{position:relative;width:min(100%,340px);margin:0 auto;background:url(art/pl_calendar.webp) center/100% 100% no-repeat;color:#242d36}
.pl-dowrow,.pl-grid{position:absolute;display:grid}
.pl-dowrow{height:4.5%;align-items:end;text-align:center;font:15px "Patrick Hand";font-style:normal}
.pl-dowrow i{font-style:normal;opacity:.75}
.pl-cell{position:relative;display:flex;align-items:center;justify-content:center;font:18px "Patrick Hand";font-style:normal}
.pl-cell small{position:absolute;top:2px;left:4px;font-size:10px;opacity:.7}
.pl-circle{position:absolute;left:50%;top:50%;width:150%;transform:translate(-50%,-50%);pointer-events:none}
.pl-dir{position:absolute;left:8%;right:8%;height:12%;display:flex;align-items:center;justify-content:center;gap:12px}
.pl-dir b{font:400 26px "Bangers";letter-spacing:.05em;color:#b3322a}
.pl-arrow{width:34%}
.pl-folder{width:36px;height:34px;object-fit:contain;margin-right:8px;vertical-align:middle}
.pl-stampimg{flex:none;width:112px;height:auto;transform:rotate(-3deg)}
.pl-checkmark{width:28px;margin-left:8px;vertical-align:middle}
.pl-reveals{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.pl-reveals li{display:flex;gap:8px;align-items:flex-start;font:19px/1.3 "Patrick Hand"}
.pl-answer{font:22px "Patrick Hand";color:var(--mustard)}
.pl-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pl-choice{min-height:56px;border-radius:12px;border:.5px solid var(--line);background:var(--bg2);color:var(--paper);font:20px "Patrick Hand"}
.pl-choice.ok{background:#3f9a54;border-color:#3f9a54;color:#fff}.pl-choice.no{opacity:.45;text-decoration:line-through}
.pl-why{margin:0;font:18px/1.3 "Patrick Hand";color:#ff8a6a}.pl-why.ok{color:#8fe0a4}
.pl-body .btn-big{width:100%}
.pl-cmp{background:#f0e4ca;color:#242d36;border:1px solid rgba(36,45,54,.25);border-radius:10px;overflow:hidden}
.pl-cmp-head{display:grid;grid-template-columns:1fr 1fr}
.pl-cmp-h{position:relative;padding:8px 6px;text-align:center;font:400 22px "Bangers";letter-spacing:.06em;background:#e6d6b0}
.pl-cmp-h+.pl-cmp-h{border-left:1px solid rgba(36,45,54,.25)}
.pl-cmp-circle{position:absolute;left:50%;top:50%;width:96%;height:96%;transform:translate(-50%,-50%);object-fit:fill;pointer-events:none}
.pl-cmp-check{position:absolute;right:4px;top:-4px;width:26px}
.pl-cmp-row{position:relative;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(36,45,54,.25);font:17px/1.25 "Patrick Hand"}
.pl-cmp-row>span{padding:6px 8px}
.pl-cmp-row>span:nth-of-type(3){border-left:1px solid rgba(36,45,54,.25)}
.pl-cmp-lbl{grid-column:1/-1;padding:4px 8px 0!important;font:13px "Patrick Hand";letter-spacing:.06em;text-transform:uppercase;opacity:.65}
.pl-cmp-both{grid-column:1/-1}
.pl-cmp-row.split{font-size:22px;text-align:center}
.pl-cmp-split{position:absolute;left:2%;top:32%;width:96%;height:68%;object-fit:fill;pointer-events:none}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${PL_CSS}</style>`);
