/* Exam tracks: which exam the player is studying for, and which questions are on that exam's official subject list.
   Players pick Court Clerk (JG-20), Associate Court Clerk (JG-24) or Principal Court Clerk (JG-26). The Practice Exam, Today's
   review and next card, Quick Round and the readiness meter then use only the questions whose law is on that list.
   Sources (official NY Courts "Subject of Examination" sheets):
     cc   Court Clerk (JG-20), issued May 4, 2026, law as of May 31, 2026 (study/Court_Clerk_Exam_Subject_Matter.pdf)
     acc  Associate Court Clerk (JG-24), issued September 16, 2026, law as of September 30, 2026
     pcc  Principal Court Clerk (JG-26), issued September 16, 2026, law as of September 30, 2026 (the Associate list plus
          Social Services Law 384, 384-b and 384-c)
   Scope is matched by article (CPL, CPLR, Penal Law, FCA, MHL, DRL), by part (Uniform Rules) or by section (SSL, VTL, Executive
   Law 259-i). The lists also name Parts inside some FCA articles and sections inside Uniform Rules Part 205; those finer limits
   are not applied here. FCA sections 1086-1099 are placed in Articles 10-A to 10-C by number, which is approximate.
   A question is on an exam when any law it cites (in its explanation, else its card's citation) is on that exam's list. A
   question that cites no law at all (court terms, papers) counts for every exam.
   Loaded before exam.js and the main script; reads S at call time. Pure functions otherwise, so tools/check_exam_scope.js can
   run it without a browser. */

const EXAM_TRACK_DEFAULT = 'cc';
const EXAM_TRACKS = (() => {
  const cc = {
    label:'Court Clerk (JG-20)', short:'Court Clerk', asOf:'May 31, 2026',
    CPLR:['2','3','4','5','10','11','21','22','23','30','32','34','40','41','42','43','44','50','52','55','70','78'],
    CPL:['1','10','30','100','110','120','160','170','180','190','195','200','210','220','260','270','280','300','310','320','330','340',
      '350','360','380','390','410','420','430','440','500','510','520','530','550','720','722','725','730'],
    PL:['10','55','80'],
    FCA:['1','2','3','4','5','5-B','6','7','8','10','11'],
    UR:['200','202','205'], RPAPL:['7'], DRL:['5-A'], VTL:['511','1192','1193'], MHL:['9','10','81'],
    SSL:[], CORR:[], EXEC:[],
    // the 440 sections the list names, and CPL 690 only as 690.05 on the newer lists
    CPL440:['440.10','440.20','440.30','440.40','440.47'],
  };
  const acc = {
    label:'Associate Court Clerk (JG-24)', short:'Associate Court Clerk', asOf:'September 30, 2026',
    CPLR:['2','3','4','5','6','10','11','12','21','22','23','30','31','32','34','41','50','51','52','54','55','63','63-A','70','78'],
    CPL:['1','10','30','100','110','120','160','170','180','190','195','200','210','216','220','260','270','280','290','300','310','320',
      '330','340','350','360','380','390','400','410','420','430','440','500','510','520','530','540','550','620','720','722','725','730'],
    CPLsec:['690.05'],
    PL:['10','55','65','70','80','85'],
    FCA:['1','2','3','4','5','5-B','6','7','8','10','10-A','10-B','10-C','11'],
    UR:['200','202','205'], RPAPL:['7'], DRL:['3','5-A','7','10'], VTL:['511','1192','1193'], MHL:['9','10','81'],
    SSL:['358-a','383-c'], CORR:['6-C','23'], EXEC:['259-i','49-B'],
    CPL440:['440.10','440.20','440.30','440.40','440.46','440.46-a','440.47'],
  };
  const pcc = { ...acc, label:'Principal Court Clerk (JG-26)', short:'Principal Court Clerk', SSL:[...acc.SSL, '384', '384-b', '384-c'] };
  return { cc, acc, pcc };
})();

function examTrack(){
  const t = typeof S !== 'undefined' && S && S.examTrack;
  return EXAM_TRACKS[t] ? t : EXAM_TRACK_DEFAULT;
}
function setExamTrack(t){
  if (!EXAM_TRACKS[t] || typeof S === 'undefined' || !S) return;
  S.examTrack = t;
  if (S.today) delete S.today;   // rebuild Today's plan for the new exam
}
const examTrackInfo = (t = examTrack()) => EXAM_TRACKS[t] || EXAM_TRACKS[EXAM_TRACK_DEFAULT];

/* ---------- reading law citations ---------- */
const LAW_NAMES = [
  ['CPLR', /CPLR|Civil Practice Law(?:s)? and Rules/],
  ['CPL', /CPL|Criminal Procedure Law/],
  ['PL', /Penal Law|PL/],
  ['FCA', /FCA|Family Court Act|Fam(?:ily)? Ct Act/],
  ['DRL', /DRL|Domestic Relations Law/],
  ['SSL', /SSL|Social Services Law/],
  ['CORR', /Corrections? Law/],
  ['EXEC', /Executive Law|Exec(?:\.)? Law/],
  ['RPAPL', /RPAPL|Real Property Actions and Proceedings Law/],
  ['VTL', /VTL|Vehicle and Traffic Law/],
  ['MHL', /MHL|Mental Hygiene Law/],
  ['UR', /Uniform Rules?(?: for [A-Za-z .]{0,40}?Courts)?|22 NYCRR|Rule|Part/],
];
const CITE_RE = new RegExp('\\b(' + LAW_NAMES.map(([, r]) => r.source).join('|') + ')\\b\\.?\\s*(?:§§?|sections?|Sections?|Articles?|articles?|Art\\.|Arts\\.)?\\s*' +
  '((?:\\d+(?:-[A-Za-z]\\b|-\\d+)?(?:\\.\\d+(?:-[a-z]\\b)?)?)(?:\\s*\\([a-z0-9]+\\))*(?:\\s*(?:,|and|&|or|through)\\s*(?:§\\s*)?\\d+(?:-[A-Za-z]\\b|-\\d+)?(?:\\.\\d+(?:-[a-z]\\b)?)?(?:\\s*\\([a-z0-9]+\\))*)*)', 'g');
const SEC_RE = /\d+(?:-[A-Za-z]\b|-\d+)?(?:\.\d+(?:-[a-z]\b)?)?/g;
function lawKey(name){
  for (const [k, r] of LAW_NAMES) if (new RegExp('^(?:' + r.source + ')$').test(name)) return k;
  return null;
}

/* one cited section (or "Article N") -> { law, art, sec } */
function citeArticle(law, raw, isArticle){
  const s = String(raw).replace(/\s+/g, ''), n = parseInt(s, 10);
  if (isNaN(n)) return null;
  const up = s.toUpperCase();
  if (isArticle) return { law, art:up, sec:'' };
  switch (law) {
    case 'CPL': case 'PL': case 'MHL':
      return s.includes('.') ? { law, art:String(n), sec:s.toLowerCase() } : { law, art:String(n), sec:'' };   // "CPL 730" read as the article
    case 'CPLR': {
      if (n < 100) return { law, art:up, sec:'' };                       // "CPLR 78" read as Article 78
      if (n >= 6340 && n <= 6349) return { law, art:'63-A', sec:s };
      return { law, art:String(Math.floor(n / 100)), sec:s };
    }
    case 'FCA': {
      if (n < 20) return { law, art:up, sec:'' };
      if (/^580-/.test(s) || n === 580) return { law, art:'5-B', sec:s };
      if (n >= 1000) {
        const a = n < 1086 ? '10' : n < 1092 ? '10-A' : n < 1093 ? '10-B' : n < 1100 ? '10-C' : '11';
        return { law, art:a, sec:s };
      }
      return { law, art:String(Math.floor(n / 100)), sec:s };
    }
    case 'DRL': {
      if (n < 15 && !s.includes('-')) return { law, art:up, sec:'' };
      const low = s.toLowerCase();
      const a = low === '15-a' ? '3' : n >= 75 && n <= 78 ? '5-A' : n >= 109 && n <= 117 ? '7' : n >= 170 && n <= 178 ? '10' : 'sec' + low;
      return { law, art:a, sec:low };
    }
    case 'CORR': {
      if (/^6-C$/i.test(s)) return { law, art:'6-C', sec:'' };
      if (n === 168) return { law, art:'6-C', sec:s };
      if (n >= 700 && n <= 706) return { law, art:'23', sec:s };
      return { law, art:n < 50 ? up : 'sec' + s, sec:s };
    }
    case 'EXEC': {
      if (n === 259 && /^259-i$/i.test(s)) return { law, art:'259-i', sec:s.toLowerCase() };
      if (n === 995) return { law, art:'49-B', sec:s };
      if (/^49-B$/i.test(s)) return { law, art:'49-B', sec:'' };
      return { law, art:'sec' + s.toLowerCase(), sec:s };
    }
    case 'RPAPL': return { law, art:n < 100 ? String(n) : String(Math.floor(n / 100)), sec:s };
    case 'VTL': return { law, art:String(n), sec:s };
    case 'SSL': return { law, art:s.toLowerCase(), sec:s.toLowerCase() };
    case 'UR': return n >= 100 && n < 300 ? { law, art:String(n), sec:s } : null;   // Parts 200-299; "Rule 3" etc. are not Uniform Rules
  }
  return null;
}

function citesIn(text){
  const out = [], t = String(text || '').replace(/[  ]/g, ' ');
  CITE_RE.lastIndex = 0;
  let m;
  while ((m = CITE_RE.exec(t))) {
    const law = lawKey(m[1]); if (!law) continue;
    const isArticle = /Art/i.test(m[0].slice(m[1].length, m[0].length - m[2].length));
    (m[2].replace(/\([^)]*\)/g, '').match(SEC_RE) || []).forEach(sec => { const c = citeArticle(law, sec, isArticle); if (c) out.push(c); });
  }
  return out;
}

/* is one citation on the track's list? */
function citeOnTrack(c, t = examTrack()){
  const L = examTrackInfo(t);
  if (c.law === 'CPL') {
    if (c.art === '440' && c.sec) return L.CPL440.includes(c.sec);
    if (c.art === '690') return !!c.sec && (L.CPLsec || []).includes(c.sec);
    return L.CPL.includes(c.art);
  }
  const list = L[c.law];
  return Array.isArray(list) && list.map(x => x.toUpperCase()).includes(String(c.art).toUpperCase());
}

/* null = cites no law; true/false = on the track or not */
function textOnTrack(text, t = examTrack()){
  const cs = citesIn(text);
  return cs.length ? cs.some(c => citeOnTrack(c, t)) : null;
}
const cardCite = c => [c && c.source && c.source.cite, c && c.cite, c && c.law].filter(Boolean).join('; ');
function questionOnTrack(q, card, t = examTrack()){
  const own = textOnTrack([q && q.q, q && q.w].filter(Boolean).join(' '), t);
  if (own !== null) return own;
  const fromCard = textOnTrack(cardCite(card), t);
  return fromCard === null ? true : fromCard;
}
/* a card is on the track when its citation is, or any of its questions are; cards that cite no law at all count everywhere */
function cardOnTrack(card, t = examTrack()){
  if (!card) return false;
  const own = textOnTrack(cardCite(card), t);
  if (own === true) return true;
  const bank = Array.isArray(card.bank) ? card.bank : [];
  if (bank.some(q => textOnTrack([q.q, q.w].filter(Boolean).join(' '), t) === true)) return true;
  return own === null && !bank.some(q => textOnTrack([q.q, q.w].filter(Boolean).join(' '), t) === false);
}

/* ---------- the picker ---------- */
function examTrackPickerHTML(){
  const cur = examTrack();
  return `<div class="xt-pick" role="radiogroup" aria-label="Which exam are you studying for?">${Object.entries(EXAM_TRACKS).map(([k, L]) =>
    `<button class="xt-opt ${k === cur ? 'on' : ''}" role="radio" aria-checked="${k === cur}" data-act="xt-set" data-t="${k}"><b>${L.short}</b><small>${L.label.match(/\(JG-\d+\)/)[0]} · law as of ${L.asOf}</small></button>`).join('')}</div>`;
}
function examTrackRowHTML(){
  return `<button class="row" data-act="push" data-s="examtrack"><span class="th emo gi">${typeof ICO === 'function' ? ICO('check') : ''}</span><span class="row-main"><b>Your exam</b><small>${examTrackInfo().label}</small></span>${typeof chev !== 'undefined' ? chev : ''}</button>`;
}
const EXAM_TRACK_SCREENS = {
  examtrack(){
    const on = typeof CARDS !== 'undefined' ? CARDS.filter(c => Array.isArray(c.bank) && c.bank.length && !c.gen) : [];
    const n = on.filter(c => cardOnTrack(c)).length;
    return { title:'Your Exam', body:`<div class="xt">
      <p class="xt-lead">Pick the exam you're studying for. The Practice Exam, Today's review, Quick Round and your readiness score use only the law on that exam's official subject list.</p>
      ${examTrackPickerHTML()}
      <p class="xt-note">${n} of ${on.length} study cards have questions on the ${examTrackInfo().short} list. Associate and Principal cover more law than the app has cards for yet; more are on the way.</p>
      ${typeof pathRowHTML === 'function' ? pathRowHTML() : ''}
    </div>` };
  },
};
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-act="xt-set"]'); if (!b) return;
    setExamTrack(b.dataset.t);
    if (typeof save === 'function') save();
    if (typeof refresh === 'function') refresh();
  });
  if (document.head && document.head.insertAdjacentHTML) document.head.insertAdjacentHTML('beforeend', `<style>
.xt{display:flex;flex-direction:column;gap:12px;color:var(--paper)}
.xt-lead,.xt-note{margin:0;font:18px/1.3 "Patrick Hand"}
.xt-note{opacity:.8;font-size:16px}
.xt-pick{display:flex;flex-direction:column;gap:8px}
.xt-opt{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px 14px;border:1px solid rgba(241,229,201,.25);border-radius:12px;background:var(--bg2);color:var(--paper);text-align:left}
.xt-opt b{font:400 19px/1 "Bangers";letter-spacing:.04em}
.xt-opt small{font:15px/1.2 "Patrick Hand";opacity:.8}
.xt-opt.on{border:2px solid var(--mustard);padding:11px 13px}
.xt-opt.on b{color:var(--mustard)}
.xt-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:8px 12px;border-radius:10px;background:var(--bg2);color:var(--paper);font:16px/1.2 "Patrick Hand"}
.xt-row b{color:var(--mustard);font-weight:400}
.xt-row button{flex:none;background:none;border:0;color:var(--mustard);text-decoration:underline;font:inherit;padding:0}
</style>`);
}
