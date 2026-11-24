/* Plain Practice Test: a front door for people who want a regular test and not the card game.
   A full-screen plain page (system font, white, no cards, coins or characters) with: number of questions, timed or untimed,
   Start, recent scores, and plain results with the right answers. The test itself is the Practice Exam page in exam.js
   (same questions, same scoring and history); this page sits under it and takes over its start and results.
   Ways in: the "Just take a practice test" button on the welcome screen, a link on the Practice Exam start page, or the
   web address with ?test or #test. Once chosen, the app opens here every time until "Open the full app" is pressed.
   Loaded after exam.js; runs at call time on the app's globals (S, save, esc, refresh, startExam, examOpen, examPool, ...). */

const PT_SIZES = [25, 50, 90];
let ptView = 'home', ptAuto = false;

const ptActive = () => !!document.getElementById('pt-root');
function ptPrefs(){
  const p = S.ptPrefs = S.ptPrefs && typeof S.ptPrefs === 'object' ? S.ptPrefs : {};
  if (!PT_SIZES.includes(p.n)) p.n = PT_SIZES[0];
  if (typeof p.untimed !== 'boolean') p.untimed = false;
  return p;
}
/* open on start-up? the web address asks for it, or the player chose the plain test before */
const ptWanted = () => /[?&]test\b/.test(location.search || '') || /^#test\b/.test(location.hash || '') || !!S.plain;

function ptOpen(view){
  if (!S.plain) { S.plain = true; save(); }
  let el = document.getElementById('pt-root');
  if (!el) { el = document.createElement('div'); el.id = 'pt-root'; document.body.appendChild(el); }
  document.getElementById('wl-root')?.remove();   // the welcome stays unseen, so it shows if they open the full app later
  ptView = view || 'home';
  ptRender();
}
function ptClose(){
  S.plain = false; save();
  document.getElementById('pt-root')?.remove();
  document.getElementById('shell')?.removeAttribute('aria-hidden');
  if (/[?&]test\b|#test\b/.test(location.search + location.hash)) history.replaceState(history.state, '', location.pathname);
  refresh();
  if (typeof maybeWelcome === 'function') maybeWelcome();
}
function ptShowResult(auto){ ptAuto = !!auto; ptView = 'result'; if (!ptActive()) ptOpen('result'); else ptRender(); }

const ptPct = (a, b) => b ? Math.round(a / b * 100) : 0;
const ptLimit = n => (typeof exLimit === 'function' ? exLimit(n) : n * EXAM_MIN_PER_Q + ' minutes');

function ptHomeHTML(){
  const pr = ptPrefs(), pool = examPool().length, x = S.exam;
  const hist = (Array.isArray(S.examHistory) ? S.examHistory : []).slice(0, 5);
  const opt = (name, val, on, label, small) => `<label class="pt-opt ${on ? 'on' : ''}"><input type="radio" name="${name}" value="${val}" ${on ? 'checked' : ''} data-act="pt-pref">
    <span><b>${label}</b>${small ? `<small>${small}</small>` : ''}</span></label>`;
  const resume = x ? `<div class="pt-resume"><b>You have a test in progress.</b>
      <span>${Object.keys(x.answers).length} of ${x.n} answered${x.untimed ? ' · untimed' : ` · ${exClock(x.deadline - Date.now())} left`}</span>
      <button class="pt-primary" data-act="pt-resume">Resume the test</button></div>` : '';
  return `<h1 tabindex="-1">Court Clerk Practice Test</h1>
    <p class="pt-lead">Multiple-choice questions across the subjects of the New York State Court Clerk exam. Each question has four choices, A to D. You see your score at the end, with the correct answers and explanations.</p>
    ${resume}
    <fieldset ${x ? 'disabled' : ''}><legend>Number of questions</legend>
      <div class="pt-opts">${PT_SIZES.map(n => opt('pt-n', n, pr.n === n, Math.min(n, pool) + ' questions')).join('')}</div></fieldset>
    <fieldset ${x ? 'disabled' : ''}><legend>Timing</legend>
      <div class="pt-opts">${opt('pt-time', 'timed', !pr.untimed, 'Timed', `${EXAM_MIN_PER_Q} minutes per question (${ptLimit(Math.min(pr.n, pool))})`)}
        ${opt('pt-time', 'untimed', pr.untimed, 'Untimed', 'Take as long as you need')}</div></fieldset>
    ${x ? '' : '<button class="pt-primary" data-act="pt-start">Start the test</button>'}
    <ul class="pt-rules">
      <li>You can skip questions, flag them, and go back to any question before you submit.</li>
      ${pr.untimed ? '' : '<li>The clock keeps running if you leave, and the test submits itself when time is up.</li>'}
      <li>Unanswered questions count as wrong.</li>
    </ul>
    ${hist.length ? `<h2>Your recent scores</h2><table class="pt-table"><thead><tr><th>Date</th><th>Questions</th><th>Score</th></tr></thead><tbody>
      ${hist.map(h => `<tr><td>${new Date(h.at).toLocaleDateString()}</td><td>${h.total}</td><td><b>${ptPct(h.right, h.total)}%</b> (${h.right} right)</td></tr>`).join('')}</tbody></table>` : ''}
    <p class="pt-note">These are practice questions written for study. They have not yet been reviewed by court clerks, and your score is practice, not a prediction. This app is not affiliated with the New York State Unified Court System.</p>
    <button class="pt-link" data-act="pt-full">Open the full app, with study cards and games</button>`;
}

function ptResultHTML(){
  const L = S.examLast;
  if (!L || !L.result) return `<h1 tabindex="-1">No results yet</h1><button class="pt-primary" data-act="pt-home">Back to the start</button>`;
  const r = L.result, pct = ptPct(r.right, r.total);
  const subjects = Object.entries(r.bySet).map(([s, [ok, t]]) => ({ s, ok, t })).sort((a, b) => a.ok / a.t - b.ok / b.t || b.t - a.t);
  const missed = L.items.map((it, i) => ({ it, i, ans:L.answers[i] })).filter(m => m.ans !== m.it.a);
  const letter = (it, v) => 'ABCDEF'[it.c.indexOf(v)] + '. ' + esc(v);
  const used = Math.round(r.ms / 60000);
  return `<h1 tabindex="-1">Your score</h1>
    ${ptAuto ? '<p class="pt-alert">Time ran out, so your test was submitted.</p>' : ''}
    <div class="pt-score"><b>${pct}%</b><span>${r.right} of ${r.total} correct · ${used < 1 ? 'under a minute' : used + (used === 1 ? ' minute' : ' minutes')}</span></div>
    <h2>By subject</h2>
    <table class="pt-table"><thead><tr><th>Subject</th><th>Correct</th><th>%</th></tr></thead><tbody>
      ${subjects.map(x => `<tr><td>${esc(titleCase(x.s))}</td><td>${x.ok} of ${x.t}</td><td>${ptPct(x.ok, x.t)}%</td></tr>`).join('')}</tbody></table>
    ${missed.length ? `<h2>Questions you missed (${missed.length})</h2>
      ${missed.map(m => `<details class="pt-q"><summary><span class="pt-qn">${m.i + 1}.</span> ${examTopic(m.it) ? `<span class="pt-topic">${esc(examTopic(m.it))}</span>` : ''}${esc(examText(m.it))}</summary>
        ${m.it.st ? `<ol class="pt-st">${m.it.st.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
        <p><em>Your answer:</em> ${m.ans === undefined ? 'No answer' : letter(m.it, m.ans)}</p>
        <p class="pt-correct"><em>Correct answer:</em> ${letter(m.it, m.it.a)}</p>
        ${m.it.w ? `<p class="pt-why">${esc(m.it.w)}</p>` : ''}</details>`).join('')}` : '<p class="pt-perfect">You answered every question correctly.</p>'}
    <button class="pt-primary" data-act="pt-home">Take another test</button>`;
}

function ptRender(){
  const el = document.getElementById('pt-root'); if (!el) return;
  document.getElementById('shell')?.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<header class="pt-top"><span>Court Clerk Practice Test</span></header>
    <main class="pt-body">${ptView === 'result' ? ptResultHTML() : ptHomeHTML()}</main>`;
  el.scrollTop = 0;
  el.querySelector('h1')?.focus({ preventScroll:true });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act^="pt-"]'); if (!t) return;
  switch (t.dataset.act) {
    case 'pt-open': ptOpen('home'); break;
    case 'pt-start': { const pr = ptPrefs(); startExam(pr.n, Date.now(), Math.random, { untimed:pr.untimed }); examOpen(); break; }
    case 'pt-resume': if (examExpired()) examFinish(true); else examOpen(); break;
    case 'pt-home': ptAuto = false; ptView = 'home'; ptRender(); break;
    case 'pt-full': ptClose(); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target; if (!t || t.dataset.act !== 'pt-pref') return;
  const pr = ptPrefs();
  if (t.name === 'pt-n') pr.n = +t.value;
  if (t.name === 'pt-time') pr.untimed = t.value === 'untimed';
  save(); ptRender();
  document.querySelector(`#pt-root input[name="${t.name}"]:checked`)?.focus();
});

/* ---------- look: plain and readable, like a paper test ---------- */
const PT_CSS = `
#pt-root{position:fixed;inset:0;z-index:940;overflow-y:auto;background:#fbfaf7;color:#1c1c1c;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
#pt-root button,#pt-root input{font:inherit;color:inherit}
#pt-root h1,#pt-root h2,#pt-root summary,#pt-root legend,#pt-root th,#pt-root td,#pt-root p,#pt-root li{font-family:inherit;letter-spacing:normal;text-transform:none;color:inherit}
#pt-root summary{font-weight:400}
#pt-root button{cursor:pointer}
.pt-top{position:sticky;top:0;padding:calc(env(safe-area-inset-top) + 12px) 16px 12px;border-bottom:1px solid #d9d6cf;background:#fff;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#4a4a4a}
.pt-body{max-width:680px;margin:0 auto;padding:22px 16px calc(env(safe-area-inset-bottom) + 32px);display:flex;flex-direction:column;gap:16px;box-sizing:border-box}
.pt-body h1{margin:0;font-size:26px;line-height:1.2;outline:none}
.pt-body h2{margin:10px 0 0;font-size:19px}
.pt-lead{margin:0;font-size:17px;line-height:1.5}
.pt-body fieldset{margin:0;padding:0;border:0;min-width:0}
.pt-body fieldset:disabled{opacity:.5}
.pt-body legend{margin-bottom:8px;padding:0;font-size:15px;font-weight:700}
.pt-opts{display:flex;flex-direction:column;gap:8px}
.pt-opt{display:flex;align-items:flex-start;gap:12px;min-height:52px;padding:12px 14px;border:1px solid #cfcbc2;border-radius:10px;background:#fff;cursor:pointer;box-sizing:border-box}
.pt-opt.on{border:2px solid #1f4e8c;background:#eef3fb;padding:11px 13px}
.pt-opt input{margin:3px 0 0;width:20px;height:20px;accent-color:#1f4e8c;flex:none}
.pt-opt span{display:flex;flex-direction:column;gap:2px;font-size:17px}
.pt-opt small{font-size:14px;color:#5a5a5a}
.pt-primary{min-height:52px;padding:12px 16px;border:0;border-radius:10px;background:#1f4e8c;color:#fff!important;font-size:17px!important;font-weight:600!important}
.pt-primary:focus-visible,.pt-link:focus-visible,.pt-opt:focus-within{outline:3px solid #f0b429;outline-offset:2px}
.pt-rules{margin:0;padding-left:22px;font-size:16px;line-height:1.5;color:#333}
.pt-resume{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #9fb6d6;border-radius:10px;background:#eef3fb;font-size:16px}
.pt-table{width:100%;border-collapse:collapse;font-size:16px;background:#fff}
.pt-table th,.pt-table td{padding:9px 10px;border-bottom:1px solid #e2dfd8;text-align:left}
.pt-table th{font-size:14px;color:#5a5a5a;font-weight:600}
.pt-note{margin:0;padding:12px 14px;border-radius:10px;background:#f1efe9;font-size:14px;line-height:1.45;color:#444}
.pt-link{align-self:flex-start;min-height:44px;padding:8px 0;border:0;background:none;color:#1f4e8c!important;text-decoration:underline;font-size:16px!important}
.pt-alert{margin:0;padding:10px 12px;border-radius:10px;background:#fff4d6;border:1px solid #c99a1a;font-size:16px}
.pt-score{display:flex;flex-direction:column;gap:4px;padding:18px;border:1px solid #d9d6cf;border-radius:12px;background:#fff}
.pt-score b{font-size:44px;line-height:1}
.pt-score span{font-size:17px;color:#444}
.pt-q{border:1px solid #d9d6cf;border-radius:10px;background:#fff;padding:12px 14px;font-size:16px;line-height:1.45}
.pt-q summary{cursor:pointer;font-size:17px}
.pt-q p{margin:8px 0 0}
.pt-qn{font-weight:700}
.pt-topic{display:block;font-size:14px;color:#5a5a5a}
.pt-st{margin:8px 0 0;padding-left:26px}
.pt-correct{color:#1d5c2e}
.pt-why{color:#444}
.pt-perfect{margin:0;font-size:17px}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${PT_CSS}</style>`);
