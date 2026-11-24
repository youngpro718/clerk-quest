/* Practice Exam (spec: docs/superpowers/specs/2026-10-05-practice-exam-design.md).
   A timed, multiple-choice exam across every card, owned or not. Clean and serious on purpose: the exam page uses the
   device's system font on a white page with no card art. No XP, coins, packs or quest progress; answered questions
   update recall (Recall.record) so misses come back in Today's review. The attempt is saved in S.exam and its clock
   keeps running in real time, even while the app is closed.
   Loaded before the main script; everything runs at call time on the app's globals (S, CARDS, Recall, save, push,
   refresh, esc, byId, titleCase, chev, ICO). */

const EXAM_MIN_PER_Q = 2;            // minutes per question until the real exam's time limit is known
const EXAM_SIZES = [25, 50, 90];
const EXAM_HISTORY_MAX = 20;
/* How a practice exam spreads its questions across the laws. The court system publishes the subject list but not how many
   questions come from each law, so the share is a guess: the number of articles, parts or section groups the JG-20 subject
   list (May 4, 2026) names for that law. Laws with no cards drop out and their share goes to the rest. Change here. */
const EXAM_WEIGHTS = { CPL:39, CPLR:22, FCA:11, PL:3, UR:3, MHL:3, DRL:1, RPAPL:1, VTL:1, OTHER:1 };
/* the same count for the Associate and Principal lists (September 16, 2026); Principal adds 3 Social Services Law sections */
const EXAM_WEIGHTS_BY_TRACK = { cc:EXAM_WEIGHTS,
  acc:{ CPL:45, CPLR:25, FCA:14, PL:6, DRL:4, UR:3, MHL:3, SSL:2, CORR:2, EXEC:2, RPAPL:1, VTL:1, OTHER:1 },
  pcc:{ CPL:45, CPLR:25, FCA:14, PL:6, DRL:4, SSL:5, UR:3, MHL:3, CORR:2, EXEC:2, RPAPL:1, VTL:1, OTHER:1 } };
const examTrackNow = () => typeof examTrack === 'function' ? examTrack() : 'cc';
const examWeights = () => EXAM_WEIGHTS_BY_TRACK[examTrackNow()] || EXAM_WEIGHTS;
const EXAM_SET_LAW = { CPLR:'CPLR', CPL:'CPL', DRL:'DRL', 'COURT TERMS':'CPLR', 'COURT PROCEDURES':'CPLR', 'CRIMINAL PROCEDURE':'CPL', 'PENAL LAW':'PL', 'FAMILY COURT':'FCA',
  'FAMILY COURT ACT':'FCA', 'UNIFORM RULES':'UR', 'DOMESTIC RELATIONS LAW':'DRL' };
/* the law a card belongs to: the first law named in its source citation, else its set */
function examLaw(c){
  const cite = String((c && c.source && c.source.cite) || (c && c.cite) || ''), m = cite.match(/^\s*(CPLR|CPL|PL|FCA|DRL|RPAPL|VTL|MHL|SSL|Uniform Rules?|UR)\b/i);
  if (m) { const k = m[1].toUpperCase(); return k.startsWith('UNIFORM') ? 'UR' : k; }
  return EXAM_SET_LAW[c && c.set] || 'OTHER';
}
/* Longest-answer giveaway: in about 6 of 10 bank questions the right answer is the longest choice, so "pick the longest" beats
   chance. Until the wrong choices are rewritten, an exam takes at most this share of such questions (chance with 4 choices is
   25%); a subject goes over it only when it has no other question left, so the even rotation across subjects comes first. */
const EXAM_LONGEST_MAX = 0.3;
const examLongest = q => Array.isArray(q.c) && q.c.length >= 4 && String(q.a).length >= Math.max(...q.c.map(x => String(x).length));

/* every multiple-choice question on every card with a bank (style 'study'), plus the exam-style set written the way the
   test writes it (exam-questions.js, style 'exam'); true/false and generated skill games are left out */
/* Subject line shown above every card question in the exam (card questions are written to sit on their card, so on their own
   some need the statute and topic, e.g. "Which of these is INCLUDED?" under DRL § 75-a). Exam-style questions already lead
   with the citation and get none. Looked up at render time, so attempts already in progress get it too. */
const EXAM_TOPIC = {
 "gavel": "Court papers, motions and calendars (CPLR 2211, 2106; Uniform Rules §§ 202.8, 202.22)",
 "summons": "Commencing an action and serving the summons (CPLR 304, 308, 320)",
 "motion": "Motions (CPLR 2211; Uniform Rules § 202.8)",
 "affidavit": "Affidavits and affirmations (CPLR 2106)",
 "adjournment": "Adjournments of motions (Uniform Rules § 202.8(e))",
 "calendarcall": "Calendars and calendar calls (Uniform Rules § 202.22)",
 "judgment": "Judgments (CPLR 5011)",
 "svs": "Summons vs. subpoena (CPLR 304, 2301)",
 "whosigns": "Family Court Act § 312.1: the summons in a juvenile delinquency proceeding",
 "clock6090": "Uniform Rules § 205.43(b): hearings on a willful violation of a support order",
 "ypsi": "CPL § 720.20(1): youthful offender determination",
 "eightdays": "Family Court Act § 427(a): serving the summons and petition in a support proceeding",
 "sealed": "CPL § 160.50(1): when a criminal action ends in favor of the accused",
 "followpetitioner": "Family Court Act § 168.2: filing copies of an order of protection",
 "amendonce": "CPLR 3025(a): amending a pleading without leave of court",
 "custodyornot": "DRL § 75-a: what counts as a “child custody proceeding”",
 "jurywaiver": "CPL § 320.10: waiving a jury trial",
 "interest": "CPLR 5003: interest on judgments and orders",
 "quash": "CPLR 2304: motions to quash or modify a subpoena",
 "newtrial": "CPLR 4402: continuance or new trial during trial",
 "schoolnotice": "CPL § 380.90(2): notifying a student's school after sentencing",
 "bail": "CPL § 500.10(9): the definition of “bail”",
 "acd": "CPL § 170.56: adjournment in contemplation of dismissal (ACD)",
 "military": "Uniform Rules § 202.22(a)(7): special calendars (military service)",
 "eightback": "CPLR 2214(b): when motion papers must be served",
 "reargue": "CPLR 2221(d): motions to reargue",
 "renew": "CPLR 2221(e): motions to renew",
 "sj120": "CPLR 3212: summary judgment",
 "undodefault": "CPLR 5015: relief from a judgment or order",
 "freeze": "CPLR 5222: restraining notices",
 "appeal30": "CPLR 5513, 5515: taking an appeal",
 "qr_cpl_001_criminal_action": "CPL § 1.20: criminal action",
 "qr_cpl_011_superior_jurisdiction": "CPL § 10.20: superior court jurisdiction",
 "qr_cpl_013_limitations": "CPL §§ 30.10, 30.30: time limits for prosecution",
 "qr_cpl_016_facial_sufficiency": "CPL § 100.40: facial sufficiency of accusatory instruments",
 "qr_cpl_020_arrest_warrant_issue": "CPL § 120.20: issuing a warrant of arrest",
 "qr_cpl_028_grand_jury_numbers": "CPL § 190.25(1): grand jury quorum and concurrence",
 "qr_cpl_033_pleas": "CPL § 220.10: pleas to an indictment",
 "qr_cpl_034_jury_trial_order": "CPL § 260.30: order of a jury trial",
 "qr_cpl_039_jury_notes": "CPL § 310.30: jury notes and responses",
 "qr_cpl_041_set_aside_verdict": "CPL § 330.30: motion to set aside a verdict",
 "qr_cpl_045_sentence_timing": "CPL §§ 380.30, 380.50, 390.20: sentencing",
 "qr_cpl_063_order_examination": "CPL Article 730: order of examination",
 "qr_pl_064_offense_grades": "Penal Law § 10.00: offense, violation, misdemeanor, felony",
 "qr_pl_065_person": "Penal Law § 10.00(7): “person”",
 "qr_pl_066_classifications": "Penal Law § 55.05: classes of felonies and misdemeanors",
 "qr_pl_067_designation": "Penal Law § 55.10: offenses defined outside the Penal Law",
 "qr_pl_068_felony_fines": "Penal Law § 80.00: fines for felonies",
 "qr_pl_069_nonfelony_fines": "Penal Law § 80.05: fines for misdemeanors and violations",
 "s5_concept_minor_mischief": "Penal Law § 10.00: grades of offenses",
 "s5_concept_split_verdict": "Penal Law §§ 10.00, 55.05: grades and classes of offenses",
 "s5_concept_felony_titan": "Penal Law §§ 10.00, 55.05: felonies and felony classes",
 "s5_concept_the_aces": "Penal Law § 55.05: felony classes",
 "s5_concept_triple_take": "Penal Law § 80.00: fines for felonies",
 "s5_concept_vault_voltage": "Penal Law § 80.00: fines for felonies",
 "joinder": "CPLR 1001, 1002, 1003: necessary and permissive joinder of parties",
 "family_court_gate": "FCA § 115: what the Family Court hears",
 "who_gets_a_lawyer": "FCA §§ 249, 262: attorney for the child and assigned counsel",
 "not_a_conviction": "FCA §§ 301.2, 380.1: juvenile delinquency is not a conviction",
 "support_formula": "FCA § 413: the child support formula",
 "whos_the_parent": "FCA §§ 516-a, 522, 532: paternity and genetic tests",
 "one_state_at_a_time": "FCA §§ 580-205, 580-207, 580-611: one controlling support order (UIFSA)",
 "best_interests": "FCA §§ 651, 652; DRL § 240(1): custody and the child's best interests",
 "diversion_first": "FCA §§ 712, 735: PINS and diversion before a petition",
 "who_counts_as_family": "FCA § 812: who can bring a family offense case",
 "order_of_protection": "FCA §§ 828, 832, 842: temporary and final orders of protection",
 "abuse_or_neglect": "FCA §§ 1012, 1046: abuse, neglect and the standard of proof",
 "thirty_days_up": "FCA §§ 1111-1115: Family Court appeals and the 30-day clock",
 "instruments": "CPL §§ 1.20, 100.10: information, complaint and indictment",
 "petition": "CPLR 304, 401, 402, 403: the petition and the notice of petition",
 "whoenters": "CPLR 1006, 1007, 1012, 1013: interpleader, third-party practice and intervention",
 "courts": "CPL §§ 10.10, 10.30: superior and local criminal courts",
 "appearance": "CPL § 110.10: requiring a defendant's appearance for arraignment",
 "jurynumbers": "CPLR 4104, 4109, 4113; CPL 270.05, 270.25, 360.10: jury size, verdicts and peremptory challenges",
 "endearly": "CPLR 3211, 3212, 3213, 3216, 3217: dismissal, summary judgment and discontinuance",
 "sworn": "CPLR 2105, 2106, 2309, 3020, 3022: affirmations, oaths, verifications and certified copies"
};
const examTopic = it => it && it.style !== 'exam' ? (EXAM_TOPIC[it.cardId] || '') : '';
/* Card questions sometimes open with a card-style label ("Exam format.", "WHAT TRIGGERS IT?", "FIND THE INCORRECT STATEMENT
   about ..."). The exam drops the shouted questions and the "Exam format." tag, and turns a shouted instruction into a normal
   sentence. Done at display time, like the subject line, so attempts already in progress read cleanly too. */
function examText(it){
  let t = String(it && it.q || '');
  if (!it || it.style === 'exam') return t;
  t = t.replace(/^Exam format[.:]\s*/i, '');
  t = t.replace(/^([A-Z][A-Z0-9 ,'’-]{3,}\?)\s+(?=\S)/, '');   // "WHAT STARTS THE CLOCK? The 60-day ..." -> "The 60-day ..."
  const calm = m => m.charAt(0) + m.slice(1).toLowerCase();
  t = t.replace(/^[A-Z][A-Z'’-]+(?: [A-Z][A-Z'’-]+)*(?=\.)/, calm);           // "CASH BAIL. Is it ..." -> "Cash bail. Is it ..."
  t = t.replace(/^(?:[A-Z][A-Z'’-]+ ){2,}[A-Z][A-Z'’-]+(?= [a-z])/, calm);   // "FIND THE INCORRECT STATEMENT about" -> "Find the incorrect statement about"
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const examQuestions = () => (typeof window !== 'undefined' && Array.isArray(window.CQ_EXAM_QUESTIONS)) ? window.CQ_EXAM_QUESTIONS : [];
const examOk = q => q && q.type !== 'tf' && q.ex !== false && Array.isArray(q.c) && q.c.length >= 3 && q.c.includes(q.a);
/* only questions on the chosen exam's subject list (exam-scope.js); every question when that file isn't loaded */
function examPool(){
  const out = [], cardOf = {}, t = examTrackNow(), onTrack = (q, c) => typeof questionOnTrack !== 'function' || questionOnTrack(q, c, t);
  CARDS.forEach(c => {
    cardOf[c.id] = c;
    if (c.gen || !Array.isArray(c.bank)) return;
    c.bank.forEach(q => { if (examOk(q) && onTrack(q, c)) out.push({ cardId:c.id, set:c.set || 'OTHER', law:examLaw(c), q, style:'study' }); });
  });
  examQuestions().forEach(q => { const c = cardOf[q.card]; if (c && examOk(q) && onTrack(q, c)) out.push({ cardId:c.id, set:c.set || 'OTHER', law:examLaw(c), q, style:'exam' }); });
  return out;
}

/* n questions spread across the laws by EXAM_WEIGHTS (each law appears in the rotation as many times as its weight, in a
   shuffled order), at most `cap` per card, no repeats; choices shuffled and frozen */
function pickExam(n, rand = Math.random){
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cap = Math.max(2, Math.ceil(n / 30)), used = {}, bySet = {}, picked = [], longMax = Math.floor(n * EXAM_LONGEST_MAX);
  let longN = 0;
  shuf(examPool()).forEach(p => (bySet[p.law] = bySet[p.law] || []).push(p));   // grouped by law
  for (const s in bySet) bySet[s] = [...bySet[s].filter(p => p.style === 'exam'), ...bySet[s].filter(p => p.style !== 'exam')];   // exam-style first
  const W = examWeights(), sets = shuf([].concat(...Object.keys(bySet).map(l => Array(Math.max(1, W[l] || 1)).fill(l))));
  for (let progress = true; picked.length < n && progress; ) {
    progress = false;
    for (const s of sets) {
      if (picked.length >= n) break;
      const list = bySet[s], free = p => (used[p.cardId] || 0) < cap;
      // once the longest-answer share is used up, take this law's next question whose answer is not the longest, if any
      let k = longN >= longMax ? list.findIndex(p => free(p) && !examLongest(p.q)) : -1;
      if (k < 0) k = list.findIndex(free);
      if (k < 0) continue;
      const p = list.splice(k, 1)[0];
      if (examLongest(p.q)) longN++;
      used[p.cardId] = (used[p.cardId] || 0) + 1; picked.push(p); progress = true;
    }
  }
  return picked.map(p => ({ cardId:p.cardId, set:p.set, style:p.style, q:p.q.q, ...(Array.isArray(p.q.st) ? { st:p.q.st.slice() } : {}),
    c:shuf(p.q.c), a:p.q.a, w:p.q.w || '' }));
}

/* opts.untimed: no clock (the plain test page offers it); the deadline is then far away and never shown */
function startExam(n, now = Date.now(), rand = Math.random, opts = {}){
  const items = pickExam(n, rand), untimed = !!opts.untimed;
  S.exam = { id:'x' + now.toString(36), track:examTrackNow(), n:items.length, startedAt:now,
    deadline:untimed ? now + 365 * 864e5 : now + items.length * EXAM_MIN_PER_Q * 60000, ...(untimed ? { untimed:true } : {}),
    items, answers:{}, flags:{}, at:0 };
  save();
  return S.exam;
}

const examExpired = (now = Date.now()) => !!(S.exam && !S.exam.untimed && now >= S.exam.deadline);

function scoreExam(x){
  const bySet = {}; let right = 0;
  x.items.forEach((it, i) => {
    const ok = x.answers[i] === it.a, b = bySet[it.set] = bySet[it.set] || [0, 0];
    b[1]++; if (ok) { b[0]++; right++; }
  });
  return { right, total:x.items.length, bySet };
}

/* score it, feed recall (answered questions only), keep it for the results page, and add it to the history */
function submitExam(now = Date.now()){
  const x = S.exam; if (!x) return null;
  x.items.forEach((it, i) => {
    if (x.answers[i] === undefined) return;
    const ok = x.answers[i] === it.a;
    Recall.record(it.cardId, ok, false);
    if (!ok) Weak.logMiss(it.cardId, it.q, x.answers[i], 'exam', false, now);
  });
  const sc = scoreExam(x);
  const rec = { at:now, track:x.track || 'cc', n:x.n, right:sc.right, total:sc.total, ms:Math.min(now, x.deadline) - x.startedAt, bySet:sc.bySet, ...(x.untimed ? { untimed:true } : {}) };
  S.examHistory = [rec, ...(Array.isArray(S.examHistory) ? S.examHistory : [])].slice(0, EXAM_HISTORY_MAX);
  S.examLast = { ...x, result:rec };
  delete S.exam;
  save();
  return rec;
}

/* ---------- words and numbers ---------- */
const exPct = (a, b) => b ? Math.round(a / b * 100) : 0;
function exLimit(n){
  const m = n * EXAM_MIN_PER_Q, h = Math.floor(m / 60), r = m % 60;
  return [h ? h + (h === 1 ? ' hour' : ' hours') : '', r ? r + ' minutes' : ''].filter(Boolean).join(' ');
}
function exClock(ms){
  const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
}
const exUsed = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'under a minute' : m + (m === 1 ? ' minute' : ' minutes'); };

/* ---------- Study tab row ---------- */
function examRowHTML(){
  return `<button class="ex-row" data-act="push" data-s="examstart"><span class="ex-row-main"><b>Practice Exam</b>
    <small>${S.exam ? 'Exam in progress · resume' : 'Timed multiple choice · 25, 50 or 90 questions'}</small></span>${chev}</button>`;
}

/* ---------- start and results pages (inside the app) ---------- */
const EXAM_SCREENS = {
  examstart(){
    let note = '';
    if (S.exam && examExpired()) {
      submitExam();
      note = `<div class="exs-alert">Time ran out on your last exam, so it was submitted. <button class="exs-link" data-act="push" data-s="examresult">See the results</button></div>`;
    }
    const pool = examPool().length, hist = (Array.isArray(S.examHistory) ? S.examHistory : []).slice(0, 3);
    const trackName = typeof examTrackInfo === 'function' ? examTrackInfo().short : 'Court Clerk';
    const trackOf = h => typeof EXAM_TRACKS === 'object' && EXAM_TRACKS[h.track || 'cc'] ? ' · ' + EXAM_TRACKS[h.track || 'cc'].short : '';
    const choose = S.exam
      ? `<div class="exs-resume"><b>Exam in progress</b><span>${Object.keys(S.exam.answers).length} of ${S.exam.n} answered · ${S.exam.untimed ? 'untimed' : exClock(S.exam.deadline - Date.now()) + ' left'}</span>
          <button class="exs-go" data-act="ex-resume">Resume exam</button></div>`
      : `<div class="exs-sizes">${EXAM_SIZES.map(n => `<button class="exs-size" data-act="ex-start" data-n="${n}"><b>${Math.min(n, pool)} questions</b><small>${exLimit(Math.min(n, pool))}</small></button>`).join('')}</div>`;
    return { title:'Practice Exam', body:`<div class="exs">${note}
      <p class="exs-lead">A timed test across every subject on the ${esc(trackName)} list, written like the real exam: multiple choice, four choices, A to D. Questions vary in difficulty; some are easier and some harder than the real test.</p>
      ${S.exam ? '' : typeof examTrackPickerHTML === 'function' ? `<h3>Your exam</h3>${examTrackPickerHTML()}` : ''}
      ${!S.exam && examTrackNow() !== 'cc' ? `<p class="exs-label">The app doesn't have questions yet for every law on the ${esc(trackName)} list, so this practice exam covers ${pool} questions from the parts it has. More are coming.</p>` : ''}
      ${choose}
      <h3>How it works</h3>
      <ul class="exs-rules">
        <li>${EXAM_MIN_PER_Q} minutes per question. The clock keeps running if you leave, and the exam submits itself when time is up.</li>
        <li>No hints. You can flag questions and go back to any of them before you submit.</li>
        <li>Unanswered questions count as wrong.</li>
        <li>Your answers update your recall, so what you miss comes back in Today's review. No XP or coins.</li>
      </ul>
      <button class="exs-link" data-act="pt-open">Prefer a plain test page with no cards or games? Open it here.</button>
      <p class="exs-label">Practice set. Questions come from the study cards and are not yet reviewed by court clerks. Your score is practice, not a prediction.</p>
      ${hist.length ? `<h3>Recent scores</h3><div class="exs-hist">${hist.map(h => `<div><b>${exPct(h.right, h.total)}%</b><span>${h.right} of ${h.total}${esc(trackOf(h))} · ${new Date(h.at).toLocaleDateString()}</span></div>`).join('')}</div>` : ''}
    </div>` };
  },
  examresult(p){
    const L = S.examLast;
    if (!L || !L.result) return { title:'Practice Exam', body:'<p class="empty">No exam results yet.</p>' };
    const r = L.result, pct = exPct(r.right, r.total);
    const subjects = Object.entries(r.bySet).map(([s, [ok, t]]) => ({ s, ok, t })).sort((a, b) => a.ok / a.t - b.ok / b.t || b.t - a.t);
    const missed = L.items.map((it, i) => ({ it, i, ans:L.answers[i] })).filter(m => m.ans !== m.it.a);
    const weak = [...new Set(missed.map(m => m.it.cardId))].map(byId).filter(Boolean);
    const readBtn = c => c.source ? `<button class="exr-read" data-act="push" data-s="rule" data-id="${c.id}">Read the rule</button>`
      : c.intro ? `<button class="exr-read" data-act="intro-read" data-id="${c.id}">Read the intro</button>` : '';
    return { title:'Exam Results', body:`<div class="exr">
      ${p && +p.auto ? '<p class="exr-auto">Time ran out, so your exam was submitted.</p>' : ''}
      <div class="exr-score"><b>${pct}%</b><span>${r.right} of ${r.total} right · ${exUsed(r.ms)}</span></div>
      <h3>By subject</h3>
      <table class="exr-table"><thead><tr><th>Subject</th><th>Right</th><th>%</th></tr></thead><tbody>
        ${subjects.map(x => `<tr><td>${esc(titleCase(x.s))}</td><td>${x.ok} / ${x.t}</td><td>${exPct(x.ok, x.t)}%</td></tr>`).join('')}</tbody></table>
      ${typeof weakReportHTML === 'function' ? weakReportHTML(Weak.since(L.startedAt, 'exam'), { sys:true }) : ''}
      ${weak.length ? `<h3>Cards to review</h3><div class="exr-weak">${weak.map(c => `<div class="exr-wrow"><span>${esc(c.name)}</span>${readBtn(c)}</div>`).join('')}</div>` : ''}
      ${missed.length ? `<h3>Review your answers</h3>${missed.map(m => { const L = v => 'ABCDEF'[m.it.c.indexOf(v)] + '. ' + esc(v);
          return `<details class="exr-q"><summary>${m.i + 1}. ${examTopic(m.it) ? `<span class="exr-topic">${esc(examTopic(m.it))}</span> ` : ''}${esc(examText(m.it))}</summary>
          ${m.it.st ? `<ol class="exr-st">${m.it.st.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
          <p><em>Your answer:</em> ${m.ans === undefined ? 'No answer' : L(m.ans)}</p>
          <p class="exr-correct">The correct response is ${L(m.it.a)}</p>
          ${m.it.w ? `<p class="exr-why">${esc(m.it.w)}</p>` : ''}</details>`; }).join('')}` : '<p class="exr-perfect">Every answer right.</p>'}
      <button class="exs-go" data-act="push" data-s="examstart">Take another exam</button>
    </div>` };
  },
};

/* ---------- the exam page: a full-screen layer over the app ---------- */
let exTimer = null, exConfirm = false, exMap = false;
function examOpen(){
  let el = document.getElementById('exam-root');
  if (!el) { el = document.createElement('div'); el.id = 'exam-root'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Practice exam'); document.body.appendChild(el); }
  document.getElementById('shell')?.setAttribute('aria-hidden', 'true');
  exConfirm = exMap = false;
  examRender();
  clearInterval(exTimer); exTimer = setInterval(examTick, 1000);
}
function examClose(){
  clearInterval(exTimer); exTimer = null;
  document.getElementById('exam-root')?.remove();
  document.getElementById('shell')?.removeAttribute('aria-hidden');
}
function examTick(){
  const x = S.exam; if (!x) { examClose(); return; }
  const left = x.deadline - Date.now(), t = document.getElementById('ex-timer');
  if (x.untimed) return;
  if (t) { t.textContent = exClock(left); t.classList.toggle('low', left < 5 * 60000); }
  if (left <= 0) examFinish(true);
}
function examFinish(auto){
  submitExam(); examClose(); exConfirm = exMap = false;
  if (typeof ptActive === 'function' && ptActive()) { ptShowResult(auto); return; }   // the plain test page shows its own results
  push('examresult', { auto:auto ? 1 : 0 });
}
function examRender(){
  const x = S.exam, el = document.getElementById('exam-root'); if (!x || !el) return;
  const i = Math.min(Math.max(0, x.at), x.n - 1), it = x.items[i], chosen = x.answers[i];
  const answered = Object.keys(x.answers).length, flagged = Object.values(x.flags).filter(Boolean).length, left = x.deadline - Date.now();
  const head = `<div class="ex-top" role="banner"><div class="ex-title"><b>PRACTICE EXAM</b><span>Question ${i + 1} of ${x.n}</span></div>
    <div class="ex-tools">${x.untimed ? '' : `<span id="ex-timer" class="ex-timer ${left < 5 * 60000 ? 'low' : ''}" role="timer" aria-label="Time left">${exClock(left)}</span>`}
      <button class="ex-flag ${x.flags[i] ? 'on' : ''}" data-act="ex-flag" aria-pressed="${!!x.flags[i]}">${x.flags[i] ? 'Flagged' : 'Flag'}</button>
      <button class="ex-exit" data-act="ex-exit">Exit</button></div></div>`;
  let main;
  if (exConfirm) main = `<section class="ex-panel"><h2>Submit your exam?</h2><p>${x.n - answered} unanswered · ${flagged} flagged</p>
      <p class="ex-note">Unanswered questions count as wrong.</p>
      <button class="ex-primary" data-act="ex-submit">Submit exam</button><button class="ex-secondary" data-act="ex-keep">Keep working</button></section>`;
  else if (exMap) main = `<section class="ex-panel"><h2>Question map</h2><p class="ex-note">${answered} of ${x.n} answered · ${flagged} flagged</p>
      <div class="ex-grid">${x.items.map((_, k) => `<button class="ex-cell ${x.answers[k] !== undefined ? 'done' : ''} ${x.flags[k] ? 'flag' : ''} ${k === i ? 'cur' : ''}" data-act="ex-jump" data-q="${k}"
        aria-label="Question ${k + 1}${x.answers[k] !== undefined ? ', answered' : ', blank'}${x.flags[k] ? ', flagged' : ''}">${k + 1}</button>`).join('')}</div>
      <p class="ex-key"><span class="done"></span> answered <span class="flag"></span> flagged <span></span> blank</p>
      <button class="ex-primary" data-act="ex-submit-ask">Submit exam</button><button class="ex-secondary" data-act="ex-map">Back to the question</button></section>`;
  else main = `<section class="ex-q"><p class="ex-num">${i + 1}.</p>${examTopic(it) ? `<p class="ex-topic">${esc(examTopic(it))}</p>` : ''}<p class="ex-text">${esc(examText(it))}</p>
      ${it.st ? `<ol class="ex-st">${it.st.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      <div class="ex-choices" role="radiogroup" aria-label="Answer choices">${it.c.map((c, k) => `<button class="ex-choice ${chosen === c ? 'on' : ''}" role="radio" aria-checked="${chosen === c}" aria-label="${'ABCDEF'[k]}: ${esc(c)}" data-act="ex-choose" data-k="${k}">
        <span class="ex-letter">${'ABCDEF'[k]}.</span><span class="ex-ctext">${esc(c)}</span></button>`).join('')}</div></section>`;
  const foot = exConfirm || exMap ? '' : `<div class="ex-bot"><button class="ex-secondary" data-act="ex-back" ${i === 0 ? 'disabled' : ''}>Back</button>
      <button class="ex-secondary" data-act="ex-map">Map</button>
      ${i === x.n - 1 ? '<button class="ex-primary" data-act="ex-submit-ask">Review &amp; submit</button>' : '<button class="ex-primary" data-act="ex-next">Next</button>'}</div>`;
  el.innerHTML = head + `<div class="ex-body" role="main">${main}</div>` + foot;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act^="ex-"]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'ex-start') { startExam(+t.dataset.n); examOpen(); return; }
  if (a === 'ex-resume') { if (examExpired()) examFinish(true); else examOpen(); return; }
  const x = S.exam; if (!x) { examClose(); return; }
  if (examExpired()) { examFinish(true); return; }
  switch (a) {
    case 'ex-choose': x.answers[x.at] = x.items[x.at].c[+t.dataset.k]; break;
    case 'ex-next': x.at = Math.min(x.n - 1, x.at + 1); break;
    case 'ex-back': x.at = Math.max(0, x.at - 1); break;
    case 'ex-flag': x.flags[x.at] = !x.flags[x.at]; break;
    case 'ex-map': exMap = !exMap; break;
    case 'ex-jump': x.at = +t.dataset.q; exMap = false; break;
    case 'ex-submit-ask': exConfirm = true; exMap = false; break;
    case 'ex-keep': exConfirm = false; break;
    case 'ex-submit': examFinish(false); return;
    case 'ex-exit': save(); examClose(); if (typeof ptActive === 'function' && ptActive()) ptRender(); else refresh(); return;
  }
  save(); examRender();
  if (a !== 'ex-choose' && a !== 'ex-flag') document.querySelector('#exam-root .ex-body')?.scrollTo(0, 0);
});

/* ---------- look: the exam page is plain and serious; the start and results pages sit inside the app ---------- */
const EXAM_CSS = `
#exam-root{position:fixed;inset:0;z-index:950;display:flex;flex-direction:column;background:#fbfaf7;color:#1c1c1c;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
#exam-root button{font:inherit;color:inherit;cursor:pointer}
.ex-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(env(safe-area-inset-top) + 10px) 16px 10px;border-bottom:1px solid #d9d6cf;background:#fff}
.ex-title{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ex-title b,.ex-title span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ex-title b{font-size:12px;letter-spacing:.1em;color:#4a4a4a}
.ex-title span{font-size:15px;font-weight:600}
.ex-tools{flex:none;display:flex;align-items:center;gap:6px}
.ex-timer{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums;min-width:58px;text-align:right}
.ex-timer.low{color:#b3261e}
.ex-flag,.ex-exit{min-height:36px;padding:6px 10px;border:1px solid #c9c5bc;border-radius:8px;background:#fff;font-size:14px}
.ex-flag.on{background:#fff4d6;border-color:#c99a1a;color:#7a5a00;font-weight:600}
.ex-body{flex:1;overflow-y:auto;padding:22px 18px 18px;max-width:680px;width:100%;margin:0 auto;box-sizing:border-box}
.ex-num{margin:0 0 6px;font-size:17px;font-weight:700}
.ex-topic{margin:0 0 6px;font-size:14px;line-height:1.35;color:#5a5a5a}
.exr-topic{display:block;font-size:13px;color:#5a5a5a}
.ex-text{margin:0 0 16px;font-size:19px;line-height:1.45}
.ex-st{margin:0 0 18px;padding-left:28px;font-size:17px;line-height:1.45}
.ex-st li{margin:4px 0;padding-left:4px}
.ex-choices{display:flex;flex-direction:column;gap:10px}
.ex-choice{display:flex;align-items:flex-start;gap:12px;min-height:52px;padding:12px 14px;border:1px solid #cfcbc2;border-radius:10px;background:#fff;text-align:left;font-size:17px;line-height:1.35}
.ex-choice.on{border:2px solid #1f4e8c;background:#eef3fb;padding:11px 13px}
.ex-letter{flex:none;min-width:24px;font-weight:700}
.ex-choice.on .ex-letter{color:#1f4e8c}
.ex-bot{display:flex;gap:10px;padding:10px 16px calc(env(safe-area-inset-bottom) + 10px);border-top:1px solid #d9d6cf;background:#fff}
.ex-bot button{flex:1}
.ex-primary,.ex-secondary{min-height:48px;padding:10px 14px;border-radius:10px;font-size:16px;font-weight:600}
.ex-primary{border:0;background:#1f4e8c;color:#fff!important}
.ex-secondary{border:1px solid #c9c5bc;background:#fff}
.ex-secondary:disabled{opacity:.4}
.ex-panel{display:flex;flex-direction:column;gap:12px}
.ex-panel h2{margin:0;font-size:21px}
.ex-panel p{margin:0;font-size:16px}
.ex-note{color:#5a5a5a}
.ex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:8px;margin:4px 0 6px}
.ex-cell{min-height:46px;border:1px solid #cfcbc2;border-radius:8px;background:#fff;font-size:15px}
.ex-cell.done{background:#e3ecf8;border-color:#9fb6d6}
.ex-cell.flag{box-shadow:inset 0 -4px 0 #c99a1a}
.ex-cell.cur{outline:2px solid #1f4e8c;outline-offset:1px}
.ex-key{display:flex;align-items:center;gap:6px;font-size:14px;color:#5a5a5a}
.ex-key span{display:inline-block;width:14px;height:14px;border:1px solid #cfcbc2;border-radius:3px;background:#fff;margin-left:8px}
.ex-key span.done{background:#e3ecf8;border-color:#9fb6d6;margin-left:0}
.ex-key span.flag{box-shadow:inset 0 -3px 0 #c99a1a}
.ex-row{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 12px;padding:14px;border:1px solid rgba(241,229,201,.22);border-radius:14px;background:var(--bg2);color:var(--paper);text-align:left}
.ex-row-main{flex:1;display:flex;flex-direction:column;gap:3px}
.ex-row-main b{font:400 21px/1 "Bangers";letter-spacing:.05em;color:var(--mustard)}
.ex-row-main small{font:16px/1.2 "Patrick Hand";opacity:.8}
.exs,.exr{display:flex;flex-direction:column;gap:12px;color:var(--paper)}
.exs h3,.exr h3{margin:8px 0 0;font:400 20px/1 "Bangers";letter-spacing:.05em;color:var(--mustard)}
.exs-lead{margin:0;font:19px/1.3 "Patrick Hand"}
.exs-sizes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.exs-size{display:flex;flex-direction:column;gap:4px;align-items:center;padding:14px 6px;border:1px solid rgba(241,229,201,.25);border-radius:12px;background:var(--bg2);color:var(--paper)}
.exs-size b{font:400 19px/1 "Bangers";letter-spacing:.04em}
.exs-size small{font:15px/1.15 "Patrick Hand";opacity:.8;text-align:center}
.exs-rules{margin:0;padding-left:20px;font:17px/1.35 "Patrick Hand"}
.exs-rules li{margin:4px 0}
.exs-label{margin:0;padding:10px 12px;border-radius:10px;background:rgba(227,178,60,.12);border:1px solid rgba(227,178,60,.35);font:16px/1.3 "Patrick Hand"}
.exs-hist{display:flex;flex-direction:column;gap:6px}
.exs-hist div{display:flex;align-items:baseline;gap:10px;font:17px "Patrick Hand"}
.exs-hist b{font:400 20px "Bangers";letter-spacing:.04em;min-width:52px}
.exs-resume{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:12px;background:var(--bg2);font:17px "Patrick Hand"}
.exs-resume b{font:400 20px "Bangers";letter-spacing:.04em;color:var(--mustard)}
.exs-go{min-height:48px;margin-top:4px;border:2px solid var(--ink);border-radius:12px;background:var(--mustard);color:var(--ink);font:400 20px "Bangers";letter-spacing:.06em}
.exs-alert{padding:10px 12px;border-radius:10px;background:rgba(207,59,42,.15);font:17px/1.3 "Patrick Hand"}
.exs-link{background:none;border:0;color:var(--mustard);text-decoration:underline;font:inherit;padding:0}
.exr-auto{margin:0;font:17px "Patrick Hand";color:#ff8a6a}
.exr-score{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px;border-radius:14px;background:var(--bg2)}
.exr-score b{font:400 54px/1 "Bangers";letter-spacing:.04em;color:var(--mustard)}
.exr-score span{font:18px "Patrick Hand"}
.exr-table{width:100%;border-collapse:collapse;font:17px "Patrick Hand"}
.exr-table th{text-align:left;font-weight:400;opacity:.7;padding:4px 6px;border-bottom:1px solid var(--line)}
.exr-table td{padding:6px;border-bottom:1px solid var(--line)}
.exr-table td:nth-child(n+2),.exr-table th:nth-child(n+2){text-align:right;white-space:nowrap}
.exr-weak{display:flex;flex-direction:column;gap:6px}
.exr-wrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;background:var(--bg2);font:17px "Patrick Hand"}
.exr-read{flex:none;padding:6px 10px;border-radius:8px;border:1px solid rgba(241,229,201,.3);background:none;color:var(--mustard);font:16px "Patrick Hand"}
.exr-q{padding:10px 12px;border-radius:10px;background:var(--bg2);font:16px/1.35 "Patrick Hand"}
.exr-q summary{cursor:pointer;font-size:17px}
.exr-q p{margin:6px 0 0}
.exr-q em{font-style:normal;opacity:.7}
.exr-why{opacity:.85}
.exr-st{margin:6px 0 0;padding-left:22px}
.exr-correct{color:#5fd47a}
.exr-perfect{margin:0;font:19px "Patrick Hand";color:#5fd47a}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${EXAM_CSS}</style>`);
