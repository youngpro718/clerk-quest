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
    <h4>When it comes up</h4><p class="ctx">${esc(c.source.context)}</p><p class="from">${paraphrase ? 'Paraphrase checked against' : 'Source'}: ${esc(c.source.from)}${c.source.url ? ` · <a href="${esc(c.source.url)}" target="_blank" rel="noopener">controlling text</a>` : ''}</p>
    ${cardVideoButtonHTML(c)}
    ${noteBoxHTML(c)}
    <button class="readbtn ${read ? 'done' : ''}" data-act="mark-read" data-id="${c.id}" ${read ? 'disabled' : ''}>${read ? 'Case file reviewed' : `Mark as reviewed · +${READ_XP} XP`}</button></div>`;
}

/* Optional video lessons. Each one opens in a sheet, so watching never changes card, quiz or docket state.
   Add a lesson here, then point a card at it in CARD_VIDEOS (or a docket sheet at it with `video:`). */
const LESSON_VIDEOS = {
  eightback: {
    kicker:'CPLR 2214(b) · motion deadlines', title:'Eight Before, Two Back', len:'1 min',
    src:'media/motion-deadlines-explainer.mp4?v=60s2', poster:'media/motion-deadlines-explainer-poster.jpg?v=60s',
    note:'Study guide to CPLR 2214(b); service method, calendar rules, and court directions can affect actual deadlines.',
    transcript:[
      'When someone asks a New York court to decide a motion, the judge sets a hearing day. And before that day arrives, the law gives each side a deadline. Deadlines that are counted backward.',
      'Here\'s the standard rule. The moving party, the side asking for something, must serve their papers at least eight days before the hearing. Then the other side gets their turn. Their answer is due at least two days before. Eight, two. That\'s the default.',
      'But the moving party has a choice. If they serve their notice at least sixteen days early, and demand early answers right in that notice, everything shifts. Now the other side must answer at least seven days before. And the moving party earns something new: a reply, due one day before the hearing. Sixteen, seven, one.',
      'One catch. If the notice goes out fewer than sixteen days ahead, the demand doesn\'t count. It\'s back to eight, two.',
      'So remember the two fuses. A short fuse: eight, two. A long fuse: sixteen, seven, one. Serve early, demand early, and you earn the last word.',
    ],
    links:[['New York Senate statute', 'https://www.nysenate.gov/legislation/laws/CVP/2214'], ['New York Courts guide', 'https://www.nycourts.gov/new-york-city-civil-court/cplr-2214']],
  },
  'docket-four-dates': {
    kicker:'Hot Docket CQ-D001 · Level 1', title:'One Order, Four Dates', len:'1 min',
    src:'media/docket-four-dates.mp4?v=2', poster:'media/docket-four-dates-poster.jpg?v=1',
    note:'Study guide to CPLR 5003, CPLR 2222 and 22 NYCRR 202.5-b(h). The case and dates are fictional.',
    transcript:[
      'One order. Four dates. And the rules care which is which.',
      'November second. The judge signs a twelve-hundred-dollar costs order. That\'s the ruling. But the dates that matter come later.',
      'November fourth. The County Clerk stamps it entered. That stamp is the entry date, even if the order is uploaded the next day.',
      'November sixth. A party asks, and the clerk dockets the order as a judgment. For an order like this, interest runs from docketing, not from entry.',
      'Then the court sends an email. It looks official. But it is not service.',
      'November tenth. A party serves the order with written notice of entry. That\'s service. Uploading the proof later doesn\'t serve it again.',
      'The ruling is the order. The record is everything that happens to it. Signed. Stamped. Docketed. Served.',
    ],
    links:[['CPLR 5003', 'https://www.nysenate.gov/legislation/laws/CVP/5003'], ['CPLR 2222', 'https://www.nysenate.gov/legislation/laws/CVP/2222'], ['Rule 202.5-b', 'https://www.nycourts.gov/rules/rule/section-2025-b-electronic-filing-supreme-court-consensual-program']],
  },
  svs: {
    kicker:'CPLR 304(a) · 2301 · Difference Trick', title:'Summons vs. Subpoena', len:'1 min',
    src:'media/card-summons-vs-subpoena.mp4?v=2', poster:'media/card-summons-vs-subpoena-poster.jpg?v=1',
    note:'Study guide to CPLR 304(a) and 2301. The store example is fictional.',
    transcript:[
      'A summons and a subpoena look alike. Both are court papers, and both have Latin-sounding names. But they do very different jobs. Mixing them up is a classic exam trap.',
      'A summons brings a defendant into a lawsuit. It tells the person that a case has started against them, and that they must respond or appear. The hook is: you\'re IN the case. If you ignore a summons, you risk a default judgment.',
      'A subpoena orders a person to come to court and testify. That person is often a witness, not a party. The hook is: you\'re NEEDED for the case. If you ignore a subpoena, you risk contempt of court.',
      'A subpoena duces tecum orders a person to bring papers or other things. Duces tecum means, bring with you.',
      'Here is an example. Someone sues a store, so the store gets a summons. The store\'s bookkeeper is not a party, but must bring the ledgers to court. That takes a subpoena duces tecum.',
      'So, summons: you\'re in. Subpoena: you\'re needed. The rules are CPLR section 304(a), and section 2301.',
    ],
    links:[['CPLR 304', 'https://www.nysenate.gov/legislation/laws/CVP/304'], ['CPLR 2301', 'https://www.nysenate.gov/legislation/laws/CVP/2301']],
  },
  whosigns: {
    kicker:'FCA § 312.1 · Who Trick', title:'Who Signs the Summons?', len:'1 min',
    src:'media/card-who-signs-the-summons.mp4?v=2', poster:'media/card-who-signs-the-summons-poster.jpg?v=1',
    note:'Study guide to Family Court Act § 312.1 (summons on a juvenile delinquency petition).',
    transcript:[
      'When someone files a juvenile delinquency petition in Family Court, the court issues a summons. This card answers one question. Who signs that summons?',
      'The Family Court Act, section 312.1, gives the answer. The summons must be signed by a judge, or by the clerk of the court.',
      'The hook is: the court signs its own summons. The judge and the clerk both belong to the court. So both of them can sign.',
      'Two other offices often come up in these cases. But the rule does not list them. The probation department cannot sign the summons. The presentment agency cannot sign it either.',
      'On the exam, all four can appear in one list. Pick the judge and the clerk. Do not pick probation or the presentment agency.',
      'Judge or clerk. The court signs. The rule is Family Court Act, section 312.1.',
    ],
    links:[['FCA § 312.1', 'https://www.nysenate.gov/legislation/laws/FCT/312.1']],
  },
  clock6090: {
    kicker:'Uniform Rules § 205.43(b) · Clock Trick', title:'The 60 / 90 Clock', len:'1 min',
    src:'media/card-the-60-90-clock.mp4?v=2', poster:'media/card-the-60-90-clock-poster.jpg?v=1',
    note:'Study guide to Uniform Rules § 205.43(b). The dates are an example; day counts exclude the first day.',
    transcript:[
      'This card teaches two deadlines for one hearing. It is a hearing to decide if someone willfully violated a support order. That means they did not obey it on purpose. The hook is: start in 60, finish in 90.',
      'The process starts with a summons. The summons gives a date. After service, the first clock counts from that date.',
      'The judge or support magistrate must start the hearing within 60 days of the date in the summons. The 60 clock fires the starting gun.',
      'Then a second clock starts, on the day that the hearing begins. The hearing must finish within 90 days of that day. The 90 clock waves the finish flag.',
      'Here is an example. The summons gives March 1. The hearing must start within 60 days, so by April 30. Say it starts on April 10. Then it must end within 90 days of April 10, so by July 9.',
      'The exam trap is the second starting point. The 90 days do not count from the summons date. They count from the day the hearing began. Two clocks, two different starting lines.',
      'Start in 60. Finish in 90. The rule is Uniform Rules, section 205.43(b).',
    ],
    links:[],
  },
  eightdays: {
    kicker:'FCA § 427(a) · Clock Trick', title:'8 Days Before', len:'1 min',
    src:'media/card-8-days-before.mp4?v=2', poster:'media/card-8-days-before-poster.jpg?v=1',
    note:'Study guide to Family Court Act § 427(a). The dates are an example.',
    transcript:[
      'In Family Court, the summons and petition must reach the respondent before the court date. This card answers one question. How early?',
      'The Family Court Act, section 427(a), gives the answer. Personal service must happen at least eight days before the appearance date in the summons. There is a second way to serve. Leave a copy with a person of suitable age at the home or business, and mail a copy. The same eight-day deadline applies.',
      'The hook is: serve it eight days before you appear. Count back from the appearance date, not forward from the filing.',
      'Here is an example. The summons says appear June 20. Count back eight days. Deliver the papers by June 12. Handing them over on June 15 is too late.',
      'On the exam, it can look like this. Personal delivery must be made at least how many days before the appearance date? Pick eight. Not thirteen, fifteen, or thirty. And the second way to serve has the same deadline.',
      'Serve it eight days before you appear. The rule is Family Court Act, section 427(a).',
    ],
    links:[['FCA § 427', 'https://www.nysenate.gov/legislation/laws/FCT/427']],
  },
  sealed: {
    kicker:'CPL § 160.50(1) · Trigger Trick', title:'Sealed in Your Favor', len:'1 min',
    src:'media/card-sealed-in-your-favor.mp4?v=3', poster:'media/card-sealed-in-your-favor-poster.jpg?v=3',
    note:'Study guide to CPL § 160.50(1). Sam is a fictional example.',
    transcript:[
      'Sometimes a criminal case ends in the accused person\'s favor. For example, all the charges are dismissed. This card answers one question. What happens to the record?',
      'The record is sealed. And the clerk of the court immediately notifies DCJS, the state Division of Criminal Justice Services, and the police. That is the Criminal Procedure Law, section 160.50.',
      'The hook is: case ends in your favor? Seal it. And the clerk does not wait. The notice goes out immediately.',
      'Here is an example. All charges against Sam are dismissed. The clerk seals the record, and notifies DCJS and the police right away. There is one exception. A court can find that justice requires otherwise, but only after at least five days\' notice.',
      'Here is a common trap. Find the incorrect step. The clerk waits thirty days before notifying DCJS. That step is wrong. The rule says immediately.',
      'Case ends in your favor? Seal it, and notify right away. The rule is Criminal Procedure Law, section 160.50.',
    ],
    links:[['CPL § 160.50', 'https://www.nysenate.gov/legislation/laws/CRP/160.50']],
  },
  followpetitioner: {
    kicker:'FCA § 168.2 · Who Trick', title:'Follow the Petitioner', len:'1 min',
    src:'media/card-follow-the-petitioner.mp4?v=2', poster:'media/card-follow-the-petitioner-poster.jpg?v=1',
    note:'Study guide to Family Court Act § 168.2. Ana is a fictional example.',
    transcript:[
      'A Family Court judge issues an order of protection. The clerk must file a copy with the police. This card answers one question. Which police?',
      'The Family Court Act, section 168.2, gives the answer. The clerk files a copy with the sheriff or police in the county where the petitioner lives. If the petitioner lives in a city, the copy goes to that city\'s police department. Temporary orders of protection follow the same rule.',
      'The hook is: follow the petitioner. The order goes where they live. The respondent\'s address does not decide it.',
      'Here is an example. Ana is the petitioner. She lives in the City of Yonkers. The respondent lives in another county. The clerk files the order with the Yonkers police department, not with the police where the respondent lives.',
      'On the exam, it can look like this. The copy is filed with the sheriff or police where who resides? Pick petitioner only. Only one person\'s address counts.',
      'Follow the petitioner. The order goes where they live. The rule is Family Court Act, section 168.2.',
    ],
    links:[['FCA § 168.2', 'https://www.nysenate.gov/legislation/laws/FCT/168.2']],
  },
  amendonce: {
    kicker:'CPLR § 3025(a) · Clock Trick', title:'Amend Once, No Permission', len:'1 min',
    src:'media/card-amend-once.mp4?v=2', poster:'media/card-amend-once-poster.jpg?v=1',
    note:'Study guide to CPLR § 3025(a). Lee and the dates are a fictional example.',
    transcript:[
      'Sometimes a party needs to fix a pleading, like a complaint, after it is served. This card answers one question. When can they fix it without asking the court?',
      'CPLR section 3025(a) gives the answer. A party may amend a pleading once, without the court\'s permission, inside one of three windows. One: within twenty days after it is served. Two: any time before the time to respond to it runs out. Three: within twenty days after a pleading that responds to it is served.',
      'The hook is: twenty, before, twenty. And watch out. The exam loves to say thirty. These windows never use thirty.',
      'Here is an example. Lee serves a complaint on May 1. Lee can amend it once, without asking the court, by May 21. That is twenty days after service. Or Lee can amend any time before the defendant\'s time to answer runs out. But only once. A second free amendment is not allowed.',
      'Here is a common trap. Which is not one of the windows? Within thirty days after its service. The windows use twenty, never thirty.',
      'Amend once, no permission. Twenty, before, twenty. The rule is CPLR section 3025(a).',
    ],
    links:[['CPLR 3025', 'https://www.nysenate.gov/legislation/laws/CVP/3025']],
  },
  jurywaiver: {
    kicker:'CPL § 320.10(2) · Who Trick', title:'Waive the Jury', len:'1 min',
    src:'media/card-waive-the-jury.mp4?v=2', poster:'media/card-waive-the-jury-poster.jpg?v=2',
    note:'Study guide to CPL § 320.10(2). Chris is a fictional example.',
    transcript:[
      'A defendant in a criminal case may want a trial without a jury, where the judge alone decides. This card answers one question. How does the defendant give up the jury?',
      'Waiving a jury takes three steps, under the Criminal Procedure Law, section 320.10. The waiver must be in writing. The defendant must sign it in person, in open court, in front of the judge. And the court must approve it.',
      'The hook is: write it, sign it, judge approves it. The prosecutor\'s consent is not one of the three.',
      'Here is an example. Chris wants a bench trial. A letter from his lawyer is not enough. Chris must sign a written waiver himself, in open court. Then the judge must approve it.',
      'On the exam, it can look like this. The defense attorney signs the waiver for the defendant, in the judge\'s chambers. What is wrong? The defendant must sign it in person, in open court.',
      'Write it. Sign it. Judge approves it. The rule is Criminal Procedure Law, section 320.10.',
    ],
    links:[['CPL § 320.10', 'https://www.nysenate.gov/legislation/laws/CRP/320.10']],
  },
  interest: {
    kicker:'CPLR § 5003 · Difference Trick', title:'The Interest Clock', len:'1 min',
    src:'media/card-the-interest-clock.mp4?v=3', poster:'media/card-the-interest-clock-poster.jpg?v=3',
    note:'Study guide to CPLR § 5003. The amounts and dates are an example.',
    transcript:[
      'A court orders someone to pay money, and that money earns interest. This card answers one question. On which date does the interest start?',
      'There are two answers. A money judgment earns interest from the date it is entered. An order to pay money earns interest from the date it is docketed as a judgment. That is CPLR section 5003.',
      'The hook is: judgment? Entry. Order? Docketing. J goes with E. O goes with D.',
      'Here is an example. A five thousand dollar judgment is entered May 3. Interest runs from May 3. A costs order is docketed as a judgment on June 9. Its interest runs from June 9.',
      'Here is the trap. A money judgment is entered March 3, and docketed March 10. Interest runs from March 3. It is a judgment, so the entry date counts.',
      'Judgment? Entry. Order? Docketing. The rule is CPLR section 5003.',
    ],
    links:[['CPLR 5003', 'https://www.nysenate.gov/legislation/laws/CVP/5003']],
  },
  quash: {
    kicker:'CPLR § 2304 · Who Trick', title:'Quash It Where It Returns', len:'1 min',
    src:'media/card-quash-it-where-it-returns.mp4?v=2', poster:'media/card-quash-it-where-it-returns-poster.jpg?v=1',
    note:'Study guide to CPLR § 2304. The Kings County subpoena is a fictional example.',
    transcript:[
      'Someone gets a subpoena and wants to challenge it. This card answers one question. Where, and how fast, must they go?',
      'CPLR section 2304 gives the answer. A motion to quash, fix conditions on, or modify a subpoena must be made promptly. And it must be made in the court where the subpoena is returnable. That is the court the subpoena sends you to.',
      'The hook is: fight the subpoena where it returns. Go back to the court the subpoena names, and do not wait.',
      'Here is an example. A subpoena orders records brought to Kings County Supreme Court. To challenge it, the recipient moves promptly in Kings County Supreme Court. Not in some other court.',
      'Here is a common trap. Find the incorrect statement. The motion may be made in any court of record. That is wrong. There is one place only: the court where the subpoena is returnable.',
      'Fight the subpoena where it returns, and do it promptly. The rule is CPLR section 2304.',
    ],
    links:[['CPLR 2304', 'https://www.nysenate.gov/legislation/laws/CVP/2304']],
  },
  bail: {
    kicker:'CPL § 500.10(9) · Difference Trick', title:'What Counts as Bail', len:'1 min',
    src:'media/card-what-counts-as-bail.mp4?v=2', poster:'media/card-what-counts-as-bail-poster.jpg?v=2',
    note:'Study guide to the CPL § 500.10(9) definition of bail.',
    transcript:[
      'A court sets bail, and the defendant\'s family wants to pay it. This card answers one question. What counts as bail?',
      'Bail has a fixed list. Under the Criminal Procedure Law, section 500.10, bail means one of three things. Cash bail. A bail bond. Or money paid with a credit card.',
      'The hook is: cash, bond, or card. Three items, and only three.',
      'Here is an example. The family can post bail in cash, through a bail bond, or by credit card. A deed to their house is not on that list.',
      'On the exam, find the extra. Which one is not listed? Real property. It is not cash, bond, or card.',
      'Cash, bond, or card. The rule is Criminal Procedure Law, section 500.10, subdivision 9.',
    ],
    links:[['CPL § 500.10', 'https://www.nysenate.gov/legislation/laws/CRP/500.10']],
  },
  acd: {
    kicker:'CPL § 170.56 · Clock Trick', title:'12 Months, Max', len:'1 min',
    src:'media/card-12-months-max.mp4?v=3', poster:'media/card-12-months-max-poster.jpg?v=3',
    note:'Study guide to CPL § 170.56(1–2). The terms are an example.',
    transcript:[
      'A court can adjourn a case in contemplation of dismissal. People call it an A C D. This card answers one question. How long can it last?',
      'The court must set conditions, and they may include supervision. Before dismissal, the court may change the conditions, or make the term longer or shorter. But the total can never be more than twelve months. That is the Criminal Procedure Law, section 170.56.',
      'The hook is: adjust it all you want. Max, twelve.',
      'Here is an example. An A C D is set for six months, with supervision. Then the court extends it by four months. That is ten in all, so it is fine. Another extension, to fourteen months, would go past the limit.',
      'On the exam, add it up. Nine months, plus five more. That is fourteen. It is over the cap, so the answer is no.',
      'Adjust it all you want. Max, twelve. The rule is Criminal Procedure Law, section 170.56.',
    ],
    links:[['CPL § 170.56', 'https://www.nysenate.gov/legislation/laws/CRP/170.56']],
  },
  military: {
    kicker:'Uniform Rules § 202.22(a)(7) · Who Trick', title:'The Military Calendar', len:'1 min',
    src:'media/card-the-military-calendar.mp4?v=3', poster:'media/card-the-military-calendar-poster.jpg?v=3',
    note:'Study guide to Uniform Rules § 202.22(a)(7). The witness is a fictional example.',
    transcript:[
      'A judge can keep special calendars of cases. One of them is the military calendar. This card answers one question. When does a case go on it?',
      'There are three conditions, and all three must be true. One: a party, or a witness needed at trial, is in military service. Two: that person is not available for trial. Three: a deposition can\'t be taken, or would not give adequate evidence. That is Uniform Rules, section 202.22.',
      'The hook is: serving, unavailable, no good deposition. If one is missing, it is not a military calendar case.',
      'Here is an example. A key witness is deployed overseas, and can\'t come to trial. A deposition would not give adequate evidence. All three are true, so the judge may place the case on the military calendar.',
      'Here is the trap. A needed witness is deployed overseas, but an adequate video deposition can be taken. Military calendar? No. The third condition fails.',
      'Serving. Unavailable. No good deposition. The rule is Uniform Rules, section 202.22.',
    ],
    links:[],
  },
  'howto-studying': {
    kicker:'How to Play', title:'Studying', len:'35 sec',
    src:'media/howto-studying.mp4?v=1', poster:'media/howto-studying-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Here is how studying works. Each round is five questions from one card.',
      'Tap an answer. A correct answer earns XP.',
      'Stuck? Tap Sidebar for a hint. A hint halves the XP and coins for that answer. Nothing you already have is taken away.',
      'If you pick a wrong answer, the card shows the right answer, and why.',
      'Answer all five questions to finish the round.',
    ],
    links:[],
  },
  'howto-levels': {
    kicker:'How to Play', title:'Levels & Glows', len:'15 sec',
    src:'media/howto-levels.mp4?v=1', poster:'media/howto-levels-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Every card levels up as you earn XP.',
      'As a card levels up, its questions get harder, and its art upgrades.',
      'Near the top level, a neon ring races around the card.',
      'At the top level, the ring turns gold, with a gloss.',
    ],
    links:[],
  },
  'howto-quests': {
    kicker:'How to Play', title:'Quests', len:'15 sec',
    src:'media/howto-quests.mp4?v=1', poster:'media/howto-quests-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Quests give you goals. There are three daily quests, and they reset every midnight.',
      'Milestones reward long-term progress.',
      'When a quest is done, claim it. Every reward is a card pack.',
    ],
    links:[],
  },
  'howto-packs': {
    kicker:'How to Play', title:'Packs', len:'20 sec',
    src:'media/howto-packs.mp4?v=1', poster:'media/howto-packs-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Packs bring you new cards. Your first finished round each day earns a pack of three cards, and quests can earn more.',
      'Later rounds that day still earn XP and coins.',
      'To open a pack, swipe across the top, and rip it open.',
      'New cards join your collection. Duplicates turn into coins.',
    ],
    links:[],
  },
  'howto-cold': {
    kicker:'How to Play', title:'Cold Cases', len:'15 sec',
    src:'media/howto-cold.mp4?v=1', poster:'media/howto-cold-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Cards that you haven\'t studied in a while go cold.',
      'A Level 1 card goes cold after two days. A mastered card can wait up to twenty-one days.',
      'One correct answer reopens the case, for a fifteen XP bonus.',
    ],
    links:[],
  },
  'howto-mastered': {
    kicker:'How to Play', title:'Levels and Mastered', len:'20 sec',
    src:'media/howto-mastered.mp4?v=1', poster:'media/howto-mastered-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Right answers fill a card\'s XP bar.',
      'When the bar is full, the card levels up.',
      'At the top level, the card is Mastered.',
      'Mastered is a game milestone for the card. It is not a promise about the exam.',
      'Cards that you leave alone go cold, so come back to them.',
    ],
    links:[],
  },
  'howto-tricks': {
    kicker:'How to Play', title:'Memory Tricks', len:'20 sec',
    src:'media/howto-tricks.mp4?v=1', poster:'media/howto-tricks-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Memory Tricks are special cards. Each one teaches a rule the easy way. There are five kinds.',
      'A Chain trick teaches an order.',
      'A Who trick teaches roles.',
      'A Clock trick teaches deadlines.',
      'A Difference trick teaches look-alikes.',
      'And a Trigger trick teaches what happens next.',
    ],
    links:[],
  },
  'howto-series': {
    kicker:'How to Play', title:'Series', len:'10 sec',
    src:'media/howto-series.mp4?v=1', poster:'media/howto-series-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Cards come in series. This card is from Series 1.',
      'Series 2 cards use a new art style.',
      'And Series 2 has its own pack wrapper.',
    ],
    links:[],
  },
  'howto-sources': {
    kicker:'How to Play', title:'Official Sources', len:'15 sec',
    src:'media/howto-sources.mp4?v=1', poster:'media/howto-sources-poster.jpg?v=1',
    note:'Recorded in the app with a practice save.',
    transcript:[
      'Rule cards are built only from the rule text quoted in the official Court Clerk sample questions, from the New York State court system.',
      'Each rule card cites its source.',
      'Other questions are sample content. Fact-check them before you rely on them.',
    ],
    links:[],
  },
  childvoice: {
    kicker:'CPLR § 1201 · Chain Trick', title:'Who Speaks for the Child?', len:'1 min',
    src:'media/card-who-speaks-for-the-child.mp4?v=1', poster:'media/card-who-speaks-for-the-child-poster.jpg?v=1',
    note:'Study guide to CPLR § 1201. The 15-year-old is a fictional example.',
    transcript:[
      'A child can be a party in a court case. But a child does not appear alone. So who speaks for the child?',
      'CPLR section 1201 sets a line. First, the guardian of the child\'s property. If there is none, a parent with legal custody. If there is none, another person or agency with legal custody.',
      'The line is not a menu. The next adult speaks only when the one before does not exist.',
      'The hook is: Good Parents Obey. G, P, O. Guardian, parent, other.',
      'Here is an example. A 15-year-old has no guardian of her property. She lives with her mother, who has legal custody. So her mother speaks for her.',
      'Now the special cases. If the court appoints a guardian ad litem, that person speaks, and the line is skipped. And a married child may appear by an adult spouse who lives with them.',
      'Good Parents Obey. Go down the line, unless the court appoints a guardian ad litem. The rule is CPLR section 1201.',
    ],
    links:[['CPLR 1201', 'https://www.nysenate.gov/legislation/laws/CVP/1201']],
  },
  ypsi: {
    kicker:'CPL § 720.20(1) · Trigger Trick', title:'Conviction → What\'s Next?', len:'1 min',
    src:'media/card-conviction-whats-next.mp4?v=1', poster:'media/card-conviction-whats-next-poster.jpg?v=1',
    note:'Study guide to CPL § 720.20(1). The months are an example.',
    transcript:[
      'An eligible youth has just been convicted. Is the youth a youthful offender? This card answers one question. When does the court decide?',
      'Here is the order. First, conviction. Then the court must order a pre-sentence investigation. Next comes a written report. And at the time of sentencing, with the report in hand, the court must decide whether the youth is a youthful offender. That is the Criminal Procedure Law, section 720.20.',
      'The hook is: investigate first. Decide at sentence. Not at conviction.',
      'Here is an example. An eligible youth is convicted in March. The court orders a pre-sentence investigation. At sentencing in May, with the written report in hand, it decides youthful offender status. Not back in March.',
      'On the exam, it can look like this. When must the court decide whether the youth is a youthful offender? At the time of pronouncing sentence. Not upon conviction, and not at arraignment.',
      'Investigate first. Decide at sentence. The rule is Criminal Procedure Law, section 720.20.',
    ],
    links:[['CPL § 720.20', 'https://www.nysenate.gov/legislation/laws/CRP/720.20']],
  },
  custodyornot: {
    kicker:'DRL § 75-a · Difference Trick', title:'Custody or Not?', len:'1 min',
    src:'media/card-custody-or-not.mp4?v=1', poster:'media/card-custody-or-not-poster.jpg?v=1',
    note:'Study guide to the DRL § 75-a definition of a child custody proceeding. The cases are examples.',
    transcript:[
      'A child is caught up in a court case. Is it a child custody proceeding? This card answers one question. What counts?',
      'Here is the test. If legal custody, physical custody, or visitation is an issue, it counts. That includes divorce, separation, neglect, abuse, guardianship, and paternity cases. But four kinds never count: juvenile delinquency, persons in need of supervision, contractual emancipation, and title three enforcement. That is the Domestic Relations Law, section 75-a.',
      'The hook is: custody at issue? It counts. Then learn the four that never count.',
      'Here is an example. Parents divorce, and they fight over visitation. That is a child custody proceeding. A juvenile delinquency case about the same child is not.',
      'On the exam, it can look like this. Does a paternity case count when custody is an issue? Yes. Paternity is on the list. Do not mix it up with the four exclusions.',
      'Custody at issue? It counts. The four exclusions never do. The rule is Domestic Relations Law, section 75-a.',
    ],
    links:[['DRL § 75-a', 'https://www.nysenate.gov/legislation/laws/DOM/75-A']],
  },
  newtrial: {
    kicker:'CPLR § 4402 · Trigger Trick', title:'Mid-Trial Reset', len:'1 min',
    src:'media/card-mid-trial-reset.mp4?v=1', poster:'media/card-mid-trial-reset-poster.jpg?v=1',
    note:'Study guide to CPLR § 4402. The trial is an example.',
    transcript:[
      'Halfway through a trial, something goes wrong. This card answers one question. Can the court hit reset?',
      'Yes, it can. At any time during the trial, on motion of any party, the court may order a continuance, or a new trial. The standard is the interest of justice, on terms that are just. That is CPLR section 4402.',
      'The hook is: any time during trial. Any party. Not before, and not after.',
      'Here is an example. Midway through a trial, something happens that makes the trial unfair. A party moves for a new trial. The court may order a new trial or a continuance, if the interest of justice calls for it.',
      'On the exam, it can look like this. Who may make this motion? Any party. Not only the plaintiff, and not only the defendant.',
      'Any time during trial. Any party. The rule is CPLR section 4402.',
    ],
    links:[['CPLR 4402', 'https://www.nysenate.gov/legislation/laws/CVP/4402']],
  },
  schoolnotice: {
    kicker:'CPL § 380.90(2) · Trigger Trick', title:'The School Gets Notified', len:'1 min',
    src:'media/card-the-school-gets-notified.mp4?v=1', poster:'media/card-the-school-gets-notified-poster.jpg?v=1',
    note:'Study guide to CPL § 380.90(2). The student is an example.',
    transcript:[
      'A high school student is sentenced for a crime. This card answers one question. Who tells the school?',
      'The sentencing court tells the school, when three things are true. The student is under nineteen. The school is a public or private elementary or secondary school. And the student is sentenced for a crime. Then the court notifies the school\'s designated educational official. That is the Criminal Procedure Law, section 380.90.',
      'The hook is: under nineteen, plus sentenced, equals the school is told. And it is the court that tells them.',
      'Here is an example. An eighteen-year-old high school senior is sentenced for a crime. Eighteen is under nineteen. So the court that sentenced the student notifies the school\'s designated educational official. A college student would not be covered.',
      'On the exam, it can look like this. Who notifies the school after the sentencing? The sentencing court. Not the district attorney, and not the parents.',
      'Under nineteen, plus sentenced, equals the school is told. The rule is Criminal Procedure Law, section 380.90.',
    ],
    links:[['CPL § 380.90', 'https://www.nysenate.gov/legislation/laws/CRP/380.90']],
  },
  reargue: {
    kicker:'CPLR § 2221(d) · Difference Trick', title:'Overlooked, Not New', len:'1 min',
    src:'media/card-overlooked-not-new.mp4?v=1', poster:'media/card-overlooked-not-new-poster.jpg?v=1',
    note:'Study guide to CPLR § 2221(d). The dates are an example.',
    transcript:[
      'A party lost a motion and thinks the judge got it wrong. This card answers one question. How do they ask the court to look again?',
      'They move to reargue. Label it as reargument. Base it on facts or law the court overlooked or misunderstood, with no new facts. And make it within thirty days after service of the order with notice of entry. That is CPLR section 2221, subdivision d.',
      'The hook is: you missed it. Look again. Same facts, sharper argument. New facts belong to a different card: renew.',
      'Here is an example. The order with notice of entry is served March first. The lawyer thinks the court misread a statute. So the lawyer moves to reargue, labeled as such, by March thirty-first. No new facts.',
      'On the exam, it can look like this. Within what time must a motion to reargue be made? Thirty days after notice of entry is served. Not thirty days from the ruling itself.',
      'You missed it. Look again. The rule is CPLR section 2221, subdivision d.',
    ],
    links:[['CPLR 2221', 'https://www.nysenate.gov/legislation/laws/CVP/2221']],
  },
  renew: {
    kicker:'CPLR § 2221(e) · Difference Trick', title:'New Facts, Good Excuse', len:'1 min',
    src:'media/card-new-facts-good-excuse.mp4?v=1', poster:'media/card-new-facts-good-excuse-poster.jpg?v=1',
    note:'Study guide to CPLR § 2221(e). The contract is an example.',
    transcript:[
      'After losing a motion, a party finds something new. This card answers one question. How do they bring it back to the court?',
      'They move to renew. Label it as renewal. Base it on new facts that would change the result, or on a change in the law. And give a reasonable excuse for not offering those facts before. That is CPLR section 2221, subdivision e.',
      'The hook is: found something new. Here\'s why it\'s late. No new facts? That is reargue, the other card.',
      'Here is an example. A party loses a motion. Later, they find a signed contract that would change the decision. They move to renew, and they explain why they could not present it the first time.',
      'On the exam, it can look like this. Along with new facts, what must a motion to renew give? A reason they were not offered before. New facts need a good excuse.',
      'Found something new. Here\'s why it\'s late. The rule is CPLR section 2221, subdivision e.',
    ],
    links:[['CPLR 2221', 'https://www.nysenate.gov/legislation/laws/CVP/2221']],
  },
  sj120: {
    kicker:'CPLR § 3212(a) · Clock Trick', title:'120 Days After the Note', len:'1 min',
    src:'media/card-120-days-after-the-note.mp4?v=1', poster:'media/card-120-days-after-the-note-poster.jpg?v=1',
    note:'Study guide to CPLR § 3212(a). The dates are an example.',
    transcript:[
      'A party wants the court to decide the case without a trial. That is summary judgment. This card answers one question. What is the deadline?',
      'Any party may move for summary judgment after issue is joined. If the court sets no other date, the motion is due no later than one hundred twenty days after the note of issue is filed. A date set by the court can\'t be earlier than thirty days after the note. After the deadline, a party needs leave of court, on good cause. That is CPLR section 3212.',
      'The hook is: note filed, clock\'s running. One hundred twenty days.',
      'Here is an example. The note of issue is filed January tenth, and the court set no date. The summary judgment motion is due by May tenth. After that, only with leave of court on good cause.',
      'On the exam, it can look like this. If the court sets no date, when is the motion due? One hundred twenty days after the note of issue. Not thirty. Thirty is only the earliest date a court can set.',
      'Note filed, clock\'s running. One hundred twenty days. The rule is CPLR section 3212.',
    ],
    links:[['CPLR 3212', 'https://www.nysenate.gov/legislation/laws/CVP/3212']],
  },
  undodefault: {
    kicker:'CPLR § 5015(b) · Who Trick', title:'The Clerk Can Undo a Default', len:'1 min',
    src:'media/card-the-clerk-can-undo-a-default.mp4?v=1', poster:'media/card-the-clerk-can-undo-a-default-poster.jpg?v=1',
    note:'Study guide to CPLR § 5015(b). Lee is an example.',
    transcript:[
      'A default judgment was entered, and now both sides want it gone. This card answers one question. Who can undo it?',
      'The clerk can. If the parties, or their attorneys, file a stipulation consenting to vacate a default judgment entered under section 3215, the clerk of the court may vacate it. Without that stipulation, it takes a motion to the court. That is CPLR section 5015, subdivision b.',
      'The hook is: both sides agree? The clerk can undo it. No agreement? Ask the court.',
      'Here is an example. A default judgment was entered against Lee. Both sides\' lawyers sign and file a stipulation consenting to vacate it. The clerk can vacate it, with no motion needed.',
      'On the exam, it can look like this. What must be filed for the clerk to vacate a default judgment? A stipulation of consent. Signed by the parties, or by their attorneys.',
      'Both sides agree? The clerk can undo it. The rule is CPLR section 5015, subdivision b.',
    ],
    links:[['CPLR 5015', 'https://www.nysenate.gov/legislation/laws/CVP/5015']],
  },
  freeze: {
    kicker:'CPLR § 5222 · Who Trick', title:'The Clerk Can Freeze It', len:'1 min',
    src:'media/card-the-clerk-can-freeze-it.mp4?v=1', poster:'media/card-the-clerk-can-freeze-it-poster.jpg?v=1',
    note:'Study guide to CPLR § 5222(a)–(b). The bank is an example.',
    transcript:[
      'A creditor won a money judgment, but the debtor\'s money sits in a bank. This card answers one question. Who can freeze it?',
      'Three can issue a restraining notice. The clerk of the court. The judgment creditor\'s attorney, as an officer of the court. Or a support collection unit. The notice must warn that disobeying it is contempt of court. It freezes the property for up to one year, or until the judgment is paid or vacated. That is CPLR section 5222.',
      'The hook is: nobody moves that money. The notice freezes. It does not take.',
      'Here is an example. The creditor\'s attorney serves a restraining notice on the debtor\'s bank. The bank cannot transfer that money for up to one year, or until the judgment is paid or vacated.',
      'On the exam, it can look like this. Besides the clerk, who else may issue a restraining notice? The judgment creditor\'s attorney, acting as an officer of the court.',
      'Nobody moves that money. The rule is CPLR section 5222.',
    ],
    links:[['CPLR 5222', 'https://www.nysenate.gov/legislation/laws/CVP/5222']],
  },
  appeal30: {
    kicker:'CPLR §§ 5513, 5515 · Clock Trick', title:'Serve It, File It, 30 Days', len:'1 min',
    src:'media/card-serve-it-file-it-30-days.mp4?v=1', poster:'media/card-serve-it-file-it-30-days-poster.jpg?v=1',
    note:'Study guide to CPLR §§ 5513(a) and 5515(1). The dates are an example.',
    transcript:[
      'A party lost and wants to appeal. This card answers one question. How, and how fast?',
      'Two acts. Serve a notice of appeal on the other side. Then file it in the office where the judgment was entered. For an appeal as of right, both must happen within thirty days after you are served with the judgment and written notice of its entry. That is CPLR sections 5513 and 5515.',
      'The hook is: serve it. File it. Thirty days. The clock starts at service with notice of entry.',
      'Here is an example. The winning side serves the judgment with notice of entry on June first. The losing side must serve and file the notice of appeal by July first. July fifteenth is too late.',
      'On the exam, it can look like this. How is an appeal taken? Serve a notice of appeal, and file it. Two acts, not one.',
      'Serve it. File it. Thirty days. The rules are CPLR sections 5513 and 5515.',
    ],
    links:[['CPLR 5513', 'https://www.nysenate.gov/legislation/laws/CVP/5513'], ['CPLR 5515', 'https://www.nysenate.gov/legislation/laws/CVP/5515']],
  },
  lfm: {
    kicker:'Filing practice · Chain Trick', title:'Lawyers File Motions', len:'1 min',
    src:'media/card-lawyers-file-motions.mp4?v=1', poster:'media/card-lawyers-file-motions-poster.jpg?v=1',
    note:'Study guide to standard alphabetic filing practice. The names are examples.',
    transcript:[
      'A clerk has a stack of files to put in order by name. This card answers one question. Which part of the name counts first?',
      'File by last name first. Then by first name. Then by middle initial. And one more rule: nothing comes before something. A name that runs out first is filed first.',
      'The hook is: Lawyers File Motions. L, F, M. Last, first, middle.',
      'Here is an example. Smith comes before Smithson, because Smith runs out first. And Smith, Anna comes before Smith, Anna B. The one with nothing there goes first.',
      'On the exam, watch for extras. Which one is not part of the filing order? Date of birth. Only last name, first name, and middle initial count.',
      'Lawyers File Motions. Last name, first name, middle initial. And nothing comes before something.',
    ],
    links:[],
  },
  caseorder: {
    kicker:'Life of a case · Chain Trick', title:'Silly Clerks Drink Mocha', len:'1 min',
    src:'media/card-silly-clerks-drink-mocha.mp4?v=1', poster:'media/card-silly-clerks-drink-mocha-poster.jpg?v=1',
    note:'Study guide to the usual order of a civil case. Real cases can skip steps. Priya\'s case is an example.',
    transcript:[
      'A civil case moves through a lot of steps. This card answers one question. What is the usual order?',
      'Here is the usual order. Summons. Complaint. Answer. Discovery. Motions. Trial. Judgment. Appeal. Real cases can skip steps, and motions can come up at many points. This is the big picture.',
      'The hook is: Silly Clerks Always Drink Mocha Till Judges Arrive. One letter for each step.',
      'Here is an example. Priya files and serves a summons and complaint. The defendant answers. They exchange records in discovery. One side moves to dismiss. The case is tried, the court enters judgment, and the losing side may appeal.',
      'On the exam, it can look like this. In the usual order, what comes right after the answer? Discovery. Always, then Drink. A, then D.',
      'Silly Clerks Always Drink Mocha Till Judges Arrive. That is the big picture of a civil case.',
    ],
    links:[],
  },
};
const CARD_VIDEOS = { eightback:'eightback', svs:'svs', whosigns:'whosigns', clock6090:'clock6090', eightdays:'eightdays', sealed:'sealed', followpetitioner:'followpetitioner', amendonce:'amendonce', jurywaiver:'jurywaiver', interest:'interest', quash:'quash', bail:'bail', acd:'acd', military:'military', childvoice:'childvoice', ypsi:'ypsi', custodyornot:'custodyornot', newtrial:'newtrial', schoolnotice:'schoolnotice', reargue:'reargue', renew:'renew', sj120:'sj120', undodefault:'undodefault', freeze:'freeze', appeal30:'appeal30', lfm:'lfm', caseorder:'caseorder' };   // card id -> lesson
const cardVideo = c => (c && CARD_VIDEOS[c.id]) || null;

/* The "Watch" button. `from` = 'intro' (with the card id) brings the person back to that card's intro. */
function videoButtonHTML(key, from, cardId, cls = 'explain-watch', label = 'Watch explanation'){
  const v = LESSON_VIDEOS[key]; if (!v) return '';
  return `<button class="${cls}" data-act="watch-explanation" data-id="${key}"${from ? ` data-from="${from}"` : ''}${cardId ? ` data-card="${cardId}"` : ''}>${PLAY_ICON} ${label} <span>${v.len}</span></button>`;
}
function cardVideoButtonHTML(c, from){ const k = cardVideo(c); return k ? videoButtonHTML(k, from, c.id) : ''; }
function openLessonVideo(key, from, cardId){
  const v = LESSON_VIDEOS[key]; if (!v) return;
  openSheet(`<div class="video-lesson">
    <p class="video-kicker">${esc(v.kicker)}</p>
    <h3>${esc(v.title)}</h3>
    <video controls playsinline preload="metadata" poster="${v.poster}" aria-describedby="lesson-video-note lesson-transcript">
      <source src="${v.src}" type="video/mp4">
      Your browser cannot play this video. The transcript follows below.
    </video>
    <p class="video-note" id="lesson-video-note">${esc(v.note)}</p>
    <details class="video-transcript" id="lesson-transcript"><summary>Read the transcript</summary>
      ${v.transcript.map(p => `<p>${esc(p)}</p>`).join('')}
    </details>
    <p class="video-sources"${v.links.length ? '' : ' hidden'}>${v.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>
    ${from === 'intro' && cardId ? `<button class="sheet-cancel" data-act="intro-back" data-id="${cardId}">Back to the intro</button>` : `<button class="sheet-cancel" data-act="sheet-close">Close</button>`}
  </div>`);
}

/* Study help: everything that explains a card in one sheet (its video, its rule, its study tips), reachable from
   the card's tabs and from inside a study round. In a round it never leaves the question. */
function studyKitHTML(c){
  const vid = cardVideoButtonHTML(c), hasRule = c.source || c.diff || c.mnemonic;
  if (!vid && !hasRule) return '';
  return `<div class="studykit"><b>Stuck on this card?</b>${vid}
    ${hasRule ? `<button class="sk-btn" data-act="cd-jump" data-id="${c.id}">${ICO('read')} ${c.source ? 'Read the Case File' : 'See the trick'}</button>` : ''}</div>`;
}
function studyHelpSheet(id){
  const c = byId(id); if (!c) return;
  const inRound = typeof app !== 'undefined' && !app.hidden;
  const rule = c.source
    ? `<div class="sh-rule"><em>${esc(c.source.cite)}</em><p>${c.source.paraphrase ? '' : '“'}${esc(c.source.quote)}${c.source.paraphrase ? '' : '”'}</p></div>`
    : c.mnemonic ? `<div class="sh-rule"><em>How to remember it</em><p>“${esc(c.mnemonic.sentence)}”</p><p>${esc(c.mnemonic.tip)}</p></div>`
    : c.diff ? `<div class="sh-rule"><em>How to tell them apart</em>${['a', 'b'].map(k => `<p><b>${esc(c.diff[k].name)}:</b> ${esc(c.diff[k].hook)}</p>`).join('')}</div>` : '';
  openSheet(`<div class="studyhelp">
    <div class="sh-head">${thumb(c)}<span><b>${esc(c.name)}</b><small>Study help</small></span></div>
    ${cardVideoButtonHTML(c)}
    ${c.intro ? `<div class="sh-sec"><h4>The idea</h4><p>${esc(c.intro.idea)}</p>${c.intro.example ? `<p><b>Example:</b> ${esc(c.intro.example)}</p>` : ''}${!c.source && c.intro.source ? `<p class="sh-src">Source: ${esc(c.intro.source)}</p>` : ''}</div>` : ''}
    ${rule ? `<div class="sh-sec"><h4>${c.source ? 'The rule' : 'The trick'}</h4>${rule}</div>` : ''}
    ${(c.lore || []).length ? `<div class="sh-sec"><h4>Study tips</h4><ul>${c.lore.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
    ${!inRound && (c.source || c.diff || c.mnemonic) ? `<button class="sk-btn" data-act="sheet-close-jump" data-id="${c.id}">${ICO('read')} Open the full Case File</button>` : ''}
    <button class="sheet-cancel" data-act="sheet-close">${inRound ? 'Back to the question' : 'Close'}</button>
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
// After the save runs, correct any note label that said "Saved" if this device refused to store it
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { save();
  if (saveFailed) document.querySelectorAll('[data-note-at]').forEach(el => { if (el.textContent) el.textContent = 'Not saved on this device'; }); }, 400); };
document.addEventListener('input', e => {
  const ta = e.target.closest('[data-note]'); if (!ta) return;
  const id = ta.dataset.note, n = nb();
  if (ta.value.trim()) n.notes[id] = { text:ta.value, at:Date.now() }; else delete n.notes[id];
  growArea(ta); saveSoon();
  const at = document.querySelector(`[data-note-at="${id}"]`); if (at) at.textContent = n.notes[id] ? (saveFailed ? 'Not saved on this device' : 'Saved') : '';
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
.studykit{display:flex;flex-direction:column;gap:8px;margin:16px 0 4px;padding:12px;border-radius:14px;background:var(--bg2)}
.studykit b{font:400 18px/1 "Bangers";letter-spacing:.05em;color:var(--mustard)}
.studykit .explain-watch{margin:0}
.sk-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;border:2px solid var(--ink);border-radius:12px;background:#f3d27a;color:var(--ink);font:700 16px var(--ui);cursor:pointer}
.sk-btn .ico{width:20px;height:20px}
.studyhelp .explain-watch{margin:4px 0 12px}
.studyhelp .sh-sec{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:var(--bg2);color:var(--paper);font:15px/1.4 var(--ui)}
.studyhelp .sh-sec h4{margin:0 0 6px;font:400 17px/1 "Bangers";letter-spacing:.05em;color:var(--mustard)}
.studyhelp .sh-sec p{margin:4px 0 0}.studyhelp .sh-sec ul{margin:0;padding-left:18px}
.studyhelp .sh-rule em{display:block;font-style:normal;font-weight:700;color:var(--sub)}
.studyhelp .sk-btn{margin-bottom:8px}
.studyhelp .sh-src{color:var(--sub);font-size:13px}
.video-lesson .video-kicker{margin:2px 0 3px;text-align:center;color:var(--mustard);font:700 12px var(--ui);letter-spacing:.1em;text-transform:uppercase}
.video-lesson h3{margin-bottom:12px}
.video-lesson video{display:block;width:min(100%,360px);max-height:52dvh;margin:0 auto;border:2px solid var(--ink);border-radius:14px;background:#211f1b;box-shadow:0 5px 0 rgba(0,0,0,.28)}
.video-note{margin:12px 3px 10px;color:var(--paper);font:14px/1.4 var(--ui)}
.video-transcript{margin:0 3px;padding:10px 12px;border-radius:12px;background:var(--bg2);color:var(--paper);font:14px/1.38 var(--ui)}
.video-transcript summary{min-height:24px;color:var(--mustard);font-weight:700;cursor:pointer}.video-transcript p{margin:4px 0 0}.video-transcript summary + p{margin-top:8px}
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
