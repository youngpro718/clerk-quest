/* Clerk Quest Hot Dockets: situational cards written as a court docket (spec: docs/superpowers/specs/2026-09-29-hot-docket-design.md).
   A Hot Docket is one card that opens as a tall Study File with four tabs across the top: Learn, Example, Source,
   Practice. The tabs open in order; finishing a page stamps it COMPLETED and unlocks the next. When all four are
   stamped, that level is done and the next level opens. One fictional case develops across three levels, five
   questions each. Finishing Level 3 earns the reward card, graded on all 15 answers: 90%+ the full-color rare card,
   80%+ the black-and-white card, below that no card (a Continuance retry comes later).
   Every sheet is the same fixed size; long parts are split across sheets you flip, and the explanation after an
   answer comes out on a sticky note, so nothing ever grows.
   Content: "Situational Card - The Record Is Not the Ruling.md", Revision 3. Reward: "RBG - Constitution Case Rep
   Reward - Matte.png" and its back ("RBG - Constitution Reward - Card Back.png", facts in "RBG - Card Back Sources.md").
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, save, esc, artSrc, push, refresh, topEntry, toast, ICO, chev, currentScreenEl, openSheet, closeSheet, lockScroll, unlockScroll). */

const DOCKET_TABS = [['learn', 'Learn'], ['example', 'Example'], ['source', 'Source'], ['practice', 'Practice']];
const DK_REWARD = { rare:.9, pass:.8 };   // share of all 15 answers: full-color rare card / black-and-white card
const RULE_202_5B = 'https://www.nycourts.gov/rules/rule/section-2025-b-electronic-filing-supreme-court-consensual-program';
const RULE_202_5 = 'https://www.nycourts.gov/rules/rule/section-2025-papers-filed-court';
const PART_202 = 'https://www.nycourts.gov/rules/part-202-uniform-civil-rules-supreme-court-and-county-court';
const NYSCEF_MANUAL = 'https://iappscontent.courts.state.ny.us/NYSCEF/live/training/userManual.html';
const CPLR = n => [`CPLR ${n}`, `https://www.nysenate.gov/legislation/laws/CVP/${n}`];
const FILE_CONDITIONS = { h:'File conditions', list:['Supreme Court, New York County; existing mandatory e-filed civil case.', 'Both companies have attorneys participating in e-filing.',
  'Listed defects are the only relevant defects for each question.', 'Applicable fees and proof of service are satisfied unless stated otherwise.',
  'No separate order authorizes refusal or changes these rules.', '"Accept for filing" does not decide timeliness, appealability, or merits.'] };

const HOT_DOCKETS = [{
  id:'CQ-D001', title:'The Record Is Not the Ruling', caseName:'Wharflight Records LLC v Stonebridge Imaging Inc.',
  checked:'Rules checked September 2026', reward:'rbg', opens:'2026-09-30', days:7,
  levels:[{
    name:'Open the order', chapter:'The costs order',
    learn:[
      { h:'Your assignment', p:['You are reviewing a civil case file in the clerk\'s office. Identify which event, filing requirement, or processing category the published rule supports.',
        'In New York County, judgment entry and docketing are County Clerk functions. The Court Clerk and County Clerk are not interchangeable labels.'] },
      { h:'Four dates', p:['Signing, entry, docketing, and service describe different events. Read the document and its stamp before choosing a date.'] },
      { h:'Which interest date?', p:['A money judgment bears interest from entry. An order directing payment, docketed as a judgment, bears interest from docketing.',
        'A party can request docketing of a payment order, including motion costs.'] },
      { h:'Which email?', p:['The entry stamp controls when an order is uploaded later. The court\'s entry email is not party service of notice of entry.',
        'A party can serve the order plus written notice through NYSCEF; uploading proof of earlier paper service adds no new service.'] },
      FILE_CONDITIONS,
    ],
    cover:['A dispute over digitized records produces an order directing $1,200 in motion costs. The order is entered, then docketed as a judgment.',
      'All parties, documents, dates, amounts, and conversations are fictional.'],
    entries:[['O1', 'Nov 2', '$1,200 costs order signed.'], ['E1', 'Nov 4', 'County Clerk entry stamp.'], ['E2', 'Nov 5', 'Order uploaded; court entry email sent.'],
      ['R1', 'Nov 6, 9:12 am', 'Party\'s complete docketing request received.'], ['J1', 'Nov 6, 9:40 am', 'Order actually docketed as judgment.'],
      ['S1', 'Nov 10', 'Order and written notice personally served on counsel.'], ['S2', 'Nov 12', 'Service proof uploaded; receipt email sent.']],
    evidence:[],
    practice:[
      { q:'The worksheet starts J1\'s interest on Nov 4. Which date applies to O1 docketed as a judgment?',
        c:['Nov 2 — signing created the payment obligation.', 'Nov 4 — entry put the order into effect.', 'Nov 6 — the order was docketed as judgment.', 'Nov 10 — service notified counsel of the obligation.'],
        a:2, why:'The worksheet uses the ordinary money-judgment entry rule for an order docketed as a judgment.',
        cite:'CPLR 5003; sample Q17', est:'Interest distinction for a money judgment versus an order docketed as a judgment.',
        links:[CPLR(5003), ['Official sample questions, Q17', 'https://www.nycourts.gov/LegacyPDFS/CAREERS/exams/Court_Clerk_Exam_Questions.pdf']] },
      { q:'Complete R1 arrives before notice of entry is served. What does the docketing rule support?',
        c:['Docket on the party\'s request, without first requiring that service.', 'Await that service, then docket on the existing party request.',
          'Obtain a separately signed judgment, then docket that new document.', 'Obtain a further judicial direction, then docket the existing order.'],
        a:0, why:'The cited rule permits this payment order to be docketed on a party\'s request. B–D add prerequisites not stated there.',
        cite:'CPLR 2222', est:'Party-request docketing of a money-payment order, including motion costs. Not a question about every enforcement requirement.', links:[CPLR(2222)] },
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
  }, {
    name:'The order is challenged', chapter:'Counsel challenges O1',
    learn:[
      { h:'No signature image?', p:['A named attorney\'s own NYSCEF account can supply an electronic signature. Do not treat every missing handwriting image as an unsigned document.',
        'Other execution requirements still matter.'] },
      { h:'Filed versus notified', p:['For a fee-free document that is not an order or judgment, filing occurs when NYSCEF records transmission. Its receipt email can arrive later.'] },
      { h:'The firm\'s connection fails', p:['A deadline today or the next business day, plus a qualifying equipment or connection failure, can permit emergency paper filing.',
        'The required affirmation and hard-copy notice must accompany it. Follow-up e-filing is due within three business days after paper filing.'] },
      { h:'Paper date survives', p:['A failure of the firm\'s connection is different from a NYSCEF-site failure. When an authorized paper filing is later e-filed, its filing date remains the paper date.'] },
      FILE_CONDITIONS,
    ],
    cover:['Counsel challenges the result. A firm Internet-connection failure forces counsel\'s challenge to that same order onto paper.'],
    entries:[['M1', 'Nov 18, 11:58 pm', 'Supporting affirmation transmitted and recorded.'], ['M2', 'Nov 19, 8:03 am', 'M1 receipt email arrives.'],
      ['H1', 'Nov 19', 'Challenge to O1 filed and served on paper.'], ['H2', 'Nov 24', 'Same H1 packet e-filed.']],
    evidence:[
      { id:'M1', h:'M1 evidence sheet', p:['Fee-free; neither order nor judgment. Dana Vale is identified as signatory. Vale files through Vale\'s own User ID/password.',
        'The PDF carries Vale\'s typed name, with no signature image. This is Vale\'s own supporting affirmation, not another witness\'s affidavit.'] },
      { id:'H1', h:'H1 evidence sheet', p:['The complete challenge packet was filed with the County Clerk and served in hard copy on Nov 19.',
        'Counsel\'s affirmation states a court-fixed filing/service deadline of Nov 20 and inability to file/serve electronically because the firm\'s connection failed. Required hard-copy notice attached.',
        'NYSCEF itself was operational. No ruling on the challenge is shown.'] },
      { id:'H2', h:'Calendar strip', p:['Nov 20, 23, and 24 are ordinary business days. No special order changes the follow-up period.',
        'H2 reproduces H1; it is not an amended challenge or a new filing.'] },
    ],
    practice:[
      { q:'M1 names Vale and uses Vale\'s own account, but has no signature image. Which signature assessment fits?',
        c:['Require a scanned signature before treating this affirmation as signed.', 'Require a separate signature certification before treating it as signed.',
          'Treat Vale\'s named, own-account filing as satisfying this signature route.', 'Require a "/s/" notation before treating the own-account filing as signed.'],
        a:2, why:'The account-based route plus signatory name matters. This does not waive other execution requirements or govern someone else\'s affidavit.',
        cite:'Rule 202.5-b(e)(1)(iii), (2)', est:'Own-account electronic signature plus signatory name; not a general waiver of other execution requirements.', links:[['Rule 202.5-b', RULE_202_5B]] },
      { q:'M1\'s transmission is recorded Nov 18; M2 arrives Nov 19. M1 has no fee. Which event governs filing?',
        c:['Nov 19 — the clerk\'s next-business-day review.', 'Nov 18 — the recorded electronic transmission.', 'Nov 19 — the receipt notification\'s delivery.', 'The date counsel opens the document link.'],
        a:1, why:'M1 is neither an order nor judgment; no fee condition intervenes.',
        cite:'Rule 202.5-b(d)(3)(i)–(ii)', est:'Recorded transmission versus later notification; stated no-fee/document exclusions.', links:[['Rule 202.5-b', RULE_202_5B]] },
      { q:'H1 challenges O1 on paper while NYSCEF works. Its affirmation and notice are complete. Which route fits?',
        c:['A judicial exemption, because only the firm\'s connection failed.', 'No emergency route, because the deadline expires tomorrow rather than today.',
          'The site-failure route, because counsel cannot connect to NYSCEF.', 'The emergency route, because the qualifying failure precedes tomorrow\'s deadline.'],
        a:3, why:'A firm connection failure and a deadline on the next business day fit the emergency-paper conditions. Site failure is a different provision.',
        cite:'Rule 202.5-b(d)(1)(iii)–(iv); 202.5-bb(c)(3)', est:'Emergency hard-copy route and required notice in a mandatory case.', links:[['Rule 202.5-b', RULE_202_5B], ['Part 202 (202.5-bb)', PART_202]] },
      { q:'H1 was filed and served on paper Nov 19. When does its follow-up e-filing period end?',
        c:['Nov 24 — three business days after paper filing.', 'Three business days after the firm restores its connection.', 'Nov 20 — the original court-fixed filing/service deadline.', 'Nov 22 — three calendar days after paper filing.'],
        a:0, why:'Count the three stated business days from paper filing. Do not substitute the separate site-restoration provision.',
        cite:'Rule 202.5-b(d)(1)(iii); contrast (i)', est:'Three business days after paper filing versus the separate NYSCEF-site restoration provision.', links:[['Rule 202.5-b', RULE_202_5B]] },
      { q:'H2 reproduces H1 on Nov 24. What filing date should NYSCEF record for that challenge?',
        c:['Nov 24 — when the electronic version was recorded.', 'Nov 20 — when the court-fixed deadline expired.', 'Nov 19 — when the authorized paper filing occurred.', 'The repair date — when electronic filing became possible.'],
        a:2, why:'Later e-filing preserves the authorized paper-filing date.',
        cite:'Rule 202.5-b(d)(4)', est:'A later electronic record preserves the hard-copy filing date.', links:[['Rule 202.5-b', RULE_202_5B]] },
    ],
  }, {
    name:'Resolve the disputed record', chapter:'The appeal disputes that history',
    learn:[
      { h:'Acceptance is not a ruling', p:['Refusal needs statutory, rule, or court-order authority. Counsel\'s lateness objection alone does not supply it.',
        'Record objective events; do not turn acceptance into a decision about whether the appeal succeeds.'] },
      { h:'Match the defect', p:['Missing index numbers and required signatures support refusal. The full-caption refusal ground names summonses, complaints, petitions, and judgments.',
        'A wrong selected document type is a correction example. A paper refusal needs its date and reason on the paper.'] },
      FILE_CONDITIONS,
    ],
    cover:['Later, an appeal arrives with a disputed history of the order and that challenge. The final task reconciles the whole file.'],
    entries:[['N1', 'Dec 11', 'Otherwise filing-compliant notice of appeal from O1; opposing counsel demands refusal as late.'],
      ['P1', 'Dec 11', 'Signed judgment tendered to County Clerk with "et al" caption.'], ['A1', 'Dec 11', 'Full-caption affidavit uploaded under the wrong document type.'],
      ['X1', 'Dec 11', 'Authorized County Clerk paper submission lacks an index number.'], ['X2', 'Dec 11', 'Authorized County Clerk paper submission lacks its required signature.'],
      ['D1', 'Dec 11', 'Counsel submits a disputed summary of O1 and H1.']],
    evidence:[
      { id:'P1', also:['A1', 'X1', 'X2'], h:'Packet sheet', p:['P1 is a separate signed judgment in this action tendered to the County Clerk for filing, with correct court, index number, and signature. It is not an unsigned proposed draft and does not change O1\'s costs award in this exercise.',
        'A1 has correct court, index number, caption, and signature; only its selected document type is wrong.',
        'X1 is complete except for the missing index number. X2 is complete except for a genuinely required signature; no signature exception applies. These are separate documents, not one packet with shifting defects.'] },
      { id:'N1', h:'N1 evidence sheet', p:['No authorized refusal ground or refusal order exists. Counsel\'s claim of lateness is a claim, not a court determination.',
        'The exercise does not ask you to calculate or rule on appeal timeliness.'] },
      { id:'D1', h:'D1 evidence sheet', p:['Counsel\'s summary lists O1\'s entry as Nov 5, the interest start as Nov 4, and H1\'s filing as Nov 24. Counsel wants those dates adopted because they match electronic activity.',
        'Compare against the original documents before recording a summary.'] },
    ],
    practice:[
      { q:'Counsel demands refusal of N1 as late. No authorized refusal ground exists. Which response avoids a legal determination?',
        c:['Accept, recording the clerk\'s conclusion that the appeal is untimely.', 'Accept, explaining that filing does not decide the timeliness dispute.',
          'Accept, advising counsel that this appeal is likely to be dismissed.', 'Hold unfiled, seeking a judicial determination before accepting the appeal.'],
        a:1, why:'A adopts a legal conclusion; C gives case-specific advice; D adds an unsupported hold. A neutral record of counsel\'s objection or general procedural explanation is not scored as improper.',
        cite:'CPLR 2102(c); CourtHelp information/advice guidance', est:'No unsupported refusal or hold; legal conclusions distinguished from procedural information.',
        links:[CPLR(2102), ['NY CourtHelp: The Clerk\'s Office', 'https://www.nycourts.gov/courthelp/GoingToCourt/courtclerks.shtml']] },
      { q:'Which listed issue is a full-caption refusal ground, rather than the manual\'s document-type correction issue?',
        c:['A1\'s wrong selected type; it prevents reliable classification of the affidavit.', 'P1\'s abbreviated caption; the provision names judgments submitted to County Clerk.',
          'Both issues; each prevents the submission from matching the case record.', 'Neither issue; both can be corrected within the already existing action.'],
        a:1, why:'P1 contains "et al"; A1 has a full, correct caption and only the wrong selected type. One distinction, one answer. This is classification under those sources, not a prescribed local screen sequence.',
        cite:'Rule 202.5(d)(1)(ii); NYSCEF manual', est:'Judgment caption refusal versus affidavit document-type correction.', links:[['Rule 202.5', RULE_202_5], ['NYSCEF manual', NYSCEF_MANUAL]] },
      { q:'X1\'s caption identifies the existing case, but its index number is missing. What does the stated rule support?',
        c:['Accept it, because the caption lets staff identify the existing case.', 'Return it for correction only, because the missing number is recoverable.',
          'Refuse it, because an identifiable case does not excuse the missing number.', 'Accept it provisionally, while counsel supplies the number to complete the record.'],
        a:2, why:'This is an otherwise complete, authorized paper submission. Recognizing the case does not remove the specified refusal ground. No particular local correction workflow is assumed.',
        cite:'Rule 202.5(d)(1)(i)', est:'Missing index number on an otherwise complete authorized paper submission.', links:[['Rule 202.5', RULE_202_5]] },
      { q:'X2 is refused for its genuinely missing signature. Which refusal record meets the rule?',
        c:['Date and reason in counsel\'s email; the paper carries no refusal notation.', 'Date stamped on the paper; the reason appears in the internal office log.',
          'Date stamped on the paper; the reason also appears on that same paper.', 'Reason stamped on the paper; the date appears on the separate office receipt.'],
        a:2, why:'The distractors split the required information between different places.',
        cite:'Rule 202.5(d)(1)(iv), (2)', est:'Signature ground, and the date and reason for refusal on the paper itself.', links:[['Rule 202.5', RULE_202_5]] },
      { q:'D1 mixes dates from the original order and its later challenge. Which summary follows the whole docket? Read as: O1 entry / O1 interest start / H1 filing.',
        c:['Nov 5 / Nov 6 / Nov 24.', 'Nov 4 / Nov 6 / Nov 19.', 'Nov 4 / Nov 4 / Nov 19.', 'Nov 5 / Nov 4 / Nov 24.'],
        a:1, why:'E1, not E2, establishes entry. J1 establishes this order\'s interest start. H1, not its H2 electronic copy, establishes the challenge\'s filing date. A selects electronic timestamps; C applies the ordinary money-judgment trigger; D adopts D1\'s electronic-activity theory.',
        cite:'Rule 202.5-b(h)(1); CPLR 5003; Rule 202.5-b(d)(4)', est:'The cumulative entry, interest, and paper-filing dates.', links:[['Rule 202.5-b', RULE_202_5B], CPLR(5003)] },
    ],
  }],
}];

/* the reward cards: front and back art, and the short quiz behind the back's button */
const DOCKET_REWARDS = {
  rbg:{ name:'Ruth Bader Ginsburg', label:'Case Rep Reward', front:'reward_rbg', back:'reward_rbg_back', btn:[10.5, 80.8, 79, 8.8],
    quiz:[
      { q:'When did Ruth Bader Ginsburg take her seat on the U.S. Supreme Court?', c:['August 10, 1993', 'January 20, 1981', 'October 3, 2005', 'June 30, 1998'], a:0,
        src:'Supreme Court of the United States', url:'https://www.supremecourt.gov/about/biographyginsburg.aspx' },
      { q:'Ginsburg was which woman to serve on the U.S. Supreme Court?', c:['The first', 'The second', 'The third', 'The fourth'], a:1,
        src:'Supreme Court of the United States', url:'https://www.supremecourt.gov/about/biographyginsburg.aspx' },
      { q:'At Harvard Law School, how many women were in her class of more than 500?', c:['Nine', 'Nineteen', 'Ninety', 'Two'], a:0,
        src:'Harvard Law School', url:'https://hls.harvard.edu/today/i-remain-optimistic-about-the-potential-of-the-united-states-ginsburg-tells-gender-and-the-law-conference/' },
      { q:'What love did Ginsburg share with Justice Antonin Scalia, despite their different legal views?', c:['Baseball', 'Opera', 'Chess', 'Gardening'], a:1,
        src:'Supreme Court press release', url:'https://www.supremecourt.gov/publicinfo/press/pressreleases/pr_02_14-16' },
    ] },
};

/* ---------- the weekly schedule ----------
   Each docket is open for a window (opens + days, local time). While it's open, Home shows it with the days left.
   After the window, a docket that isn't finished is "missed": locked until a Continuance reopens it (no deadline then,
   and it earns the black-and-white card at most). Finished dockets stay in the folder as the player's record. */
const DK_DAY = 864e5;
const docketOpens = d => new Date(d.opens + 'T00:00:00').getTime();
const docketCloses = d => { const c = new Date(docketOpens(d)); c.setDate(c.getDate() + d.days); return c.getTime(); };   // calendar days, so a clock change never shifts it
function docketState(d){
  const now = Date.now(), r = dockets().find(x => x.id === d.id), rr = r && docketRec(d.id);
  if (rr && docketComplete(rr) && rr.reward) return 'done';
  if (rr && rr.extended) return rr && docketComplete(rr) ? 'done' : 'open';   // reopened after missing: no deadline
  if (now < docketOpens(d)) return 'soon';
  if (now < docketCloses(d)) return rr && docketComplete(rr) ? 'done' : 'open';
  return rr && docketComplete(rr) ? 'done' : 'missed';
}
const daysLeft = d => Math.max(1, Math.ceil((docketCloses(d) - Date.now()) / DK_DAY));
const liveDocket = () => HOT_DOCKETS.find(d => docketState(d) === 'open' && !(dockets().find(x => x.id === d.id) || {}).extended);
/* the Home tile: this week's docket, while it's open and not finished */
function docketHomeHTML(){
  const d = liveDocket(); if (!d) return '';
  const r = dockets().find(x => x.id === d.id), rr = r && docketRec(d.id), n = daysLeft(d);
  const sub = rr ? `Level ${rr.level} · ${doneCount(rr.lv[rr.level])} of 4 done` : 'New this week';
  return `<button class="dk-home" data-act="push" data-s="docket" data-id="${d.id}"><img src="${artSrc('docket_folder')}" alt="">
    <span><em>HOT DOCKET</em><b>${esc(d.title)}</b><small>${sub}</small></span><i class="${n <= 2 ? 'soon' : ''}">${n} day${n === 1 ? '' : 's'} left</i></button>`;
}
function reopenMissed(id){
  const r = docketRec(id); if (continuances() < 1 || r.extended) return false;
  S.continuances = continuances() - 1;
  r.extended = true; r.retry = true; r.reopened = (r.reopened || 0) + 1;
  save(); return true;
}

/* ---------- saved progress: one record per docket, with a part per level ---------- */
const dockets = () => (S.dockets = Array.isArray(S.dockets) ? S.dockets : []);
const docketDef = id => HOT_DOCKETS.find(d => d.id === id);
function docketRec(id){
  let r = dockets().find(x => x.id === id);
  if (!r) { r = { id, level:1, lv:{} }; dockets().push(r); }
  if (!r.lv) { r.lv = { 1:{ done:r.done || {}, answers:r.answers || [] } }; delete r.done; delete r.answers; }   // saves from before levels
  for (let n = 1; n <= 3; n++) { const x = r.lv[n] = r.lv[n] || {}; x.done = x.done || {}; x.answers = x.answers || []; }
  r.level = Math.max(1, Math.min(3, r.level || 1));
  return r;
}
const lvRec = (r, n) => r.lv[n];
const tabOpen = (x, i) => DOCKET_TABS.slice(0, i).every(([k]) => x.done[k]);
const doneCount = x => DOCKET_TABS.filter(([k]) => x.done[k]).length;
const levelScore = (d, r, n) => d.levels[n - 1].practice.filter((q, k) => r.lv[n].answers[k] === q.a).length;
const docketComplete = r => doneCount(r.lv[3]) === 4;
function docketTotals(d, r){
  const total = d.levels.reduce((t, L) => t + L.practice.length, 0);
  const right = d.levels.reduce((t, L, n) => t + levelScore(d, r, n + 1), 0);
  return { right, total, pct:right / total };
}
const rewardFor = (pct, retry) => pct >= DK_REWARD.rare && !retry ? 'rare' : pct >= DK_REWARD.pass ? 'bw' : null;   // a retry earns the basic card at most
/* Continuance coins (found in about 1 in 5 packs) reopen a docket that ended without a reward card:
   the 15 practice answers clear and the player answers them again; Learn, Example and Source stay done. */
const continuances = () => S.continuances || 0;
function reopenDocket(id){
  const r = docketRec(id); if (continuances() < 1 || r.reward || !docketComplete(r)) return false;
  S.continuances = continuances() - 1;
  for (let n = 1; n <= 3; n++) { r.lv[n].answers = []; r.lv[n].done.practice = false; delete r.lv[n].practiceAt; }
  r.level = 1; r.retry = true; r.extended = true; r.reopened = (r.reopened || 0) + 1; delete r.completedAt;   // a reopened docket has no deadline
  save(); return true;
}

/* ---------- the Dockets tab (inside Collection) ---------- */
function docketsTabHTML(){
  const rows = HOT_DOCKETS.filter(d => docketState(d) !== 'soon').map(d => { const r = dockets().find(x => x.id === d.id), rr = r && docketRec(d.id);
    const st = docketState(d);
    const status = st === 'soon' ? 'opens soon' : st === 'missed' ? 'missed · reopen with a Continuance'
      : !rr ? `not started · ${daysLeft(d)} day${daysLeft(d) === 1 ? '' : 's'} left`
      : docketComplete(rr) ? (rr.reward ? 'complete' : 'complete · no card yet')
      : `${rr.retry ? 'reopened · ' : ''}Level ${rr.level} · ${doneCount(rr.lv[rr.level])} of 4 done${rr.extended ? '' : ` · ${daysLeft(d)}d left`}`;
    return `<button class="row dk-row" data-act="push" data-s="docket" data-id="${d.id}"><span class="dk-thumb"><img src="${artSrc('dk_photo_learn')}" alt=""></span>
      <span class="row-main"><b>${esc(d.title)}</b><small>${esc(d.id)} · ${status}</small></span>${chev}</button>`; }).join('');
  const won = dockets().filter(r => r.reward && docketDef(r.id));
  return `<p class="st-note">Hot Dockets are court situations written as a docket. Read the file, then decide how to handle it. They test judgment, not just memory.</p>
    <div class="dk-folder"><img src="${artSrc('docket_folder')}" alt="Docket folder"></div>
    <div class="sec-h"><span>Your dockets</span></div><div class="list">${rows || '<p class="empty">Your first Hot Docket arrives soon.</p>'}</div>
    <div class="dk-coins"><img src="${artSrc('continuance_coin')}" alt=""><span><b>${continuances()} Continuance${continuances() === 1 ? '' : 's'}</b><small>${continuances() ? 'Spend one to retry a docket that ended without a reward card.' : 'Found in some packs. One lets you retry a docket that ended without a reward card.'}</small></span></div>
    ${won.length ? `<div class="sec-h"><span>Reward cards</span></div><div class="dk-rewards">${won.map(r => rewardThumb(r)).join('')}</div>` : ''}
    <p class="foot">A new Hot Docket arrives on your Home screen about once a week and stays open for a week. Finished ones stay in this folder as your record.</p>`;
}
function rewardThumb(r){
  const d = docketDef(r.id), rw = DOCKET_REWARDS[d.reward];
  return `<button class="dk-rw ${r.reward}" data-act="dk-reward" data-id="${r.id}"><span class="rw-card ${r.reward}"><img src="${artSrc(rw.front)}" alt="${esc(rw.name)}"></span>
    <small>${r.reward === 'rare' ? 'Rare · full color' : 'Black and white'}</small></button>`;
}

/* ---------- the Study File: fixed sheets ----------
   Built from the clip art in "Situational Card Clip Art/": the empty paper docket template (art/sf_template, from
   "Docket - Empty Paper Template.png", with blank tabs), live tab names, the rubber stamps (art/dk_stamp_*), the polaroid
   frame (art/dk_polaroid) with the charcoal photos behind it (art/dk_photo_*), and sticky notes (art/dk_note_*).
   Positions are % of the whole card (853 x 1844); text sizes are in cqw, so every phone shows the same layout. */
const TAB_X = [[7.6, 31], [31, 52], [52, 71.5], [71.5, 91]];
const sfBox = (l, t, w, h) => `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
const TAB_STAMP = { learn:'studyfile', example:'example', source:'source', practice:'practice' };

/* the sheets in each tab for level n: the first is a cover with the photo; the rest are plain paper.
   Example is cumulative: every chapter up to this level, each followed by its evidence sheets. */
function tabSheets(tab, d, n){
  const L = d.levels[n - 1];
  if (tab === 'learn') return [{ cover:true }, ...L.learn.map(c => ({ card:c }))];
  if (tab === 'example') { const out = [{ cover:true }];
    d.levels.slice(0, n).forEach((C, ci) => {
      for (let i = 0; i < C.entries.length; i += 7) out.push({ entries:C.entries.slice(i, i + 7), chapter:ci + 1, name:C.chapter, part:i });
      C.evidence.forEach(ev => out.push({ ev, chapter:ci + 1 }));
    });
    return out; }
  if (tab === 'source') return [{ cover:true }, ...L.practice.map((q, k) => ({ src:q, k }))];
  return L.practice.map((q, k) => ({ q, k }));
}
function polaroidHTML(tab){
  return `<span class="sf-pol" style="${sfBox(56, 23.4, 34, 23.6)}"><img class="ph" src="${artSrc('dk_photo_' + tab)}" alt=""><img class="fr" src="${artSrc('dk_polaroid')}" alt=""></span>`;
}
const stampImg = (name, cls = '') => `<img class="sf-stampimg ${cls}" src="${artSrc('dk_stamp_' + name)}" alt="${name === 'completed' ? 'Completed' : ''}">`;
const noteHTML = (color, pos, inner, cls = '') => `<div class="sf-note ${cls}" style="${pos};background-image:url('${artSrc('dk_note_' + color)}')"><div class="sf-note-in sf-fit">${inner}</div></div>`;

function sheetInner(tab, sh, d, r, n, p, sheets){
  const L = d.levels[n - 1], x = lvRec(r, n), done = x.done[tab], slam = p.justStamped === tab ? 'slam' : '';
  if (sh.cover) {
    const sub = { learn:`Level ${n} · ${L.name}`, example:n > 1 ? `The docket through Level ${n}` : 'The docket so far', source:'The rule behind each question' }[tab];
    const side = `<div class="sf-side" style="${sfBox(9, 24, 45, 23)}">${stampImg(TAB_STAMP[tab], 'head')}<small>${esc(sub)}</small>${done ? stampImg('completed', 'done ' + slam) : ''}${r.reopened && tab === 'learn' ? stampImg('reopened', 'done') : ''}</div>`;
    if (tab === 'learn') return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 48.5, 81, 6.5)}"><p>${n > 1 ? `New for Level ${n}. The earlier cards still apply.` : 'Read each card, then open Example. Every fact you need is here before you answer.'}</p></div>
      ${noteHTML('yellow', sfBox(8.5, 55.5, 54, 25), `<b>In this file</b><ul class="sf-toc">${L.learn.map(c => `<li>${esc(c.h)}</li>`).join('')}</ul>`, 'tilt-l')}
      <div class="sf-area" style="${sfBox(65, 60, 25, 18)}"><p class="sf-aside">${L.learn.length} short cards. Swipe or tap Next to turn each sheet.</p></div>`;
    if (tab === 'example') return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 49, 81, 31.5)}"><div class="sf-case"><b>${esc(d.id)} — ${esc(d.caseName)}</b>${L.cover.map(t => `<p>${esc(t)}</p>`).join('')}</div>
        ${n > 1 ? `<p class="sf-aside">Earlier entries stay in the file. New ones are marked "Added in Level ${n}". Tap an entry with a clip to read its evidence.</p>` : ''}</div>`;
    return `${polaroidHTML(tab)}${side}
      <div class="sf-area sf-fit" style="${sfBox(9, 49, 81, 9)}"><p>Each explanation is ours; the rule itself is at the link on its sheet.</p></div>
      ${noteHTML('blue', sfBox(9, 59, 42, 19.4), `<b>${esc(d.checked)}</b><p>As of September 29, 2026 · next review due December 29, 2026.</p>`, 'tilt-r')}`;
  }
  if (sh.card) return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 60)}"><h4>${esc(sh.card.h)}</h4>${(sh.card.p || []).map(t => `<p>${esc(t)}</p>`).join('')}${sh.card.list ? `<ul>${sh.card.list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  if (sh.entries) {
    const C = d.levels[sh.chapter - 1], evIdx = id => sheets.findIndex(s => s.ev && (s.ev.id === id || (s.ev.also || []).includes(id)));
    return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 60)}"><h4>Level ${sh.chapter} · ${esc(sh.name)}${sh.chapter === n && n > 1 ? ' <span class="sf-new">Added in Level ' + n + '</span>' : ''}</h4>
      <div class="sf-entries">${sh.entries.map(([id, when, what]) => { const ei = evIdx(id);
        return `<div class="sf-entry ${ei > 0 ? 'has-ev' : ''}" ${ei > 0 ? `data-act="dk-ev" data-i="${ei}"` : ''}><b>${id}</b><span><em>${esc(when)}</em>${esc(what)}</span>${ei > 0 ? '<i class="ev">📎</i>' : ''}</div>`; }).join('')}</div></div>`;
  }
  if (sh.ev) return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 60)}"><h4>${esc(sh.ev.h)}${sh.chapter === n && n > 1 ? ' <span class="sf-new">Added in Level ' + n + '</span>' : ''}</h4>
      <p class="sf-evfor">Evidence for ${[sh.ev.id, ...(sh.ev.also || [])].join(', ')}</p>${sh.ev.p.map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
  if (sh.src) { const q = sh.src;
    return `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 60)}"><h4>Question ${sh.k + 1}</h4><p class="sf-citeh">${esc(q.cite)}</p>
      <p><em class="lb">What it establishes</em>${esc(q.est)}</p><p class="sf-links">${q.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</p></div>`; }
  // a practice question: the question and its answers on the paper; tap an answer (the whole paragraph) to pick it
  const q = sh.q, i = sh.k, ans = x.answers[i], answered = ans != null, sel = answered ? ans : p.sel;
  return `<div class="sf-area sf-fit" style="${sfBox(9, 23.4, 81, 60)}">
      <div class="sf-qhead"><b>Question ${i + 1} of ${L.practice.length}</b><span>${L.practice.map((_, k) => `<i class="${x.answers[k] == null ? '' : x.answers[k] === L.practice[k].a ? 'ok' : 'no'} ${k === i ? 'cur' : ''}"></i>`).join('')}</span></div>
      <p class="sf-q">${esc(q.q)}</p>
      <div class="sf-choices" role="group" aria-label="Answers">${q.c.map((t, k) => `<button type="button" class="sf-choice ${sel === k ? 'sel' : ''} ${answered && k === q.a ? 'right' : ''} ${answered && k === ans && ans !== q.a ? 'wrong' : ''}" aria-pressed="${sel === k}" ${answered ? 'aria-disabled="true" tabindex="-1"' : `data-act="dk-pick" data-k="${k}"`}><b>${'ABCD'[k]}</b><span>${esc(t)}</span></button>`).join('')}</div></div>
    ${answered && p.memo !== false ? `<div class="sf-memo ${p.memoIn ? 'in' : ''}" style="${sfBox(6.5, 40, 87, 31)};background-image:url('${artSrc('dk_note_ivory')}')">
        <div class="sf-note-in sf-fit"><h4 class="${ans === q.a ? 'ok' : 'no'}">${ans === q.a ? 'Correct' : 'Not quite'} · the answer is ${'ABCD'[q.a]}</h4><p>${esc(q.why)}</p><p class="sf-cite">Source: ${esc(q.cite)}</p></div>
        <button class="sf-memo-x" data-act="dk-memo">Hide note</button></div>` : ''}`;
}
function resultsInner(d, r, n, p){
  const L = d.levels[n - 1], x = lvRec(r, n), len = L.practice.length, right = levelScore(d, r, n);
  const final = n === 3 && docketComplete(r), t = docketTotals(d, r);
  const note = final ? `<b class="big">${t.right} of ${t.total}</b><p>right on the whole docket (${Math.round(t.pct * 100)}%)</p>`
    : `<b class="big">${right} of ${len}</b><p>right on Level ${n}</p>`;
  return `${polaroidHTML('practice')}
    <div class="sf-side" style="${sfBox(9, 24, 45, 23)}">${stampImg('practice', 'head')}<small>Level ${n} results</small>${r.reopened ? stampImg('reopened', 'done') : stampImg('completed', 'done ' + (p.justStamped === 'practice' ? 'slam' : ''))}</div>
    ${noteHTML('green', sfBox(9, 50, 38, 17.6), note, 'tilt-l')}
    <div class="sf-area sf-fit" style="${sfBox(50, 49.5, 40, 31)}">${L.practice.map((q, k) => `<div class="sf-res ${x.answers[k] === q.a ? 'ok' : 'no'}"><b>${k + 1}</b>
      <span>${x.answers[k] === q.a ? `Right · ${'ABCD'[q.a]}` : `Chose ${'ABCD'[x.answers[k]]} · answer ${'ABCD'[q.a]}`}</span></div>`).join('')}</div>`;
}

function studyFileHTML(d, r, n, tab, p){
  const x = lvRec(r, n), sheets = tabSheets(tab, d, n), results = tab === 'practice' && x.done.practice && p.q == null;
  const i = tab === 'practice' ? Math.min(p.q || 0, sheets.length - 1) : Math.min(p.sheet || 0, sheets.length - 1);
  const tabs = DOCKET_TABS.map(([k, label], ti) => { const open = tabOpen(x, ti), [x0, x1] = TAB_X[ti];
    return `<button class="sf-tab ${k === tab ? 'on' : ''} ${open ? '' : 'locked'}" style="${sfBox(x0, 5.4, x1 - x0, 4.4)}" data-act="dk-tab" data-tab="${k}"
      aria-label="${label}${x.done[k] ? ', complete' : open ? '' : ', locked'}"><span>${label}</span>${x.done[k] ? '<i>✓</i>' : open ? '' : `<i class="lk">${ICO('lock')}</i>`}</button>`; }).join('');
  const header = `<span class="sf-title" style="${sfBox(9, 16.9, 61, 5)}">${esc(d.title)}</span>
    <span class="sf-cell" style="${sfBox(70, 16.9, 20, 5)}">${esc(d.id)}<br>LEVEL ${n}</span><span class="sf-rule" style="${sfBox(9, 22.4, 81, .2)}"></span>`;
  const inner = results ? resultsInner(d, r, n, p) : sheetInner(tab, sheets[i], d, r, n, p, sheets);
  const card = `<div class="sf-crop"><div class="sf2 ${p.flip ? 'flip-' + p.flip : ''}" data-tab="${tab}">
    <img class="sf-base" src="${artSrc('sf_template')}" alt="">${tabs}<div class="sf-page">${header}${inner}</div></div></div>`;
  // the control bar under the card: always the same place and size
  let bar;
  if (tab === 'practice') {
    const answered = x.answers[i] != null, last = i === sheets.length - 1;
    bar = results ? `<button class="sf-btn" data-act="dk-review" data-q="0">Review questions</button><span class="sf-count">${levelScore(d, r, n)} of ${sheets.length} right</span>${missedQs(d, r).length ? `<button class="sf-btn go" data-act="dm-start" data-id="${d.id}">Practice misses</button>` : '<span class="sf-btn ghost"></span>'}`
      : `<button class="sf-btn" data-act="dk-q" data-q="${i - 1}" ${i ? '' : 'disabled'}>‹ Back</button><span class="sf-count">Question ${i + 1} of ${sheets.length}</span>
        ${!answered ? `<button class="sf-btn go" data-act="dk-check" ${p.sel == null ? 'disabled' : ''}>Check ✓</button>`
          : last ? (x.done.practice ? `<button class="sf-btn go" data-act="dk-review" data-q="">Results ›</button>` : `<button class="sf-btn go gold" data-act="dk-done" data-tab="practice">Finish ✓</button>`)
          : `<button class="sf-btn go" data-act="dk-q" data-q="${i + 1}">Next ›</button>`}`;
  } else {
    const last = i === sheets.length - 1, next = DOCKET_TABS[DOCKET_TABS.findIndex(([k]) => k === tab) + 1];
    // Back and Next always turn the sheets, finished or not; "contents" jumps anywhere or on to the next section
    bar = `<button class="sf-btn" data-act="dk-sheet" data-d="-1" ${i ? '' : 'disabled'}>‹ Back</button><button class="sf-count link" data-act="dk-toc">Sheet ${i + 1} of ${sheets.length} ▾</button>
      ${!last ? `<button class="sf-btn go" data-act="dk-sheet" data-d="1">Next ›</button>`
        : x.done[tab] ? `<button class="sf-btn go" data-act="dk-tab" data-tab="${next[0]}">${next[1]} ›</button>`
        : `<button class="sf-btn go gold" data-act="dk-done" data-tab="${tab}">Finish ✓</button>`}`;
  }
  return { html:card, bar };   // the bar goes in the screen's fixed footer, under the paper, always in view
}

/* shrink a sheet's writing until it fits its fixed box (never below a readable size) */
function fitSheets(root){
  (root || document).querySelectorAll('.sf-fit').forEach(el => {
    if (!el.closest('.sf2').clientWidth) return;
    let fs = parseFloat(el.dataset.fs || '') || (el.classList.contains('sf-note-in') ? 4.8 : 4.6); el.dataset.fs = fs; el.style.fontSize = fs + 'cqw';
    for (let k = 0; k < 24 && el.scrollHeight > el.clientHeight + 1 && fs > 3.9; k++) { fs -= .1; el.style.fontSize = fs.toFixed(2) + 'cqw'; }
    el.classList.toggle('scrolls', el.scrollHeight > el.clientHeight + 1);   // still too long: scroll inside the paper
  });
}
/* the docket type is a bundled font: load it up front, and re-fit the sheets if it arrives after they were laid out */
if (document.fonts && document.fonts.load) { document.fonts.load('400 1em "Courier Prime"'); document.fonts.load('700 1em "Courier Prime"');
  document.fonts.addEventListener('loadingdone', () => requestAnimationFrame(() => { document.querySelectorAll('.sf-fit').forEach(el => { delete el.dataset.fs; el.style.fontSize = ''; }); fitSheets(); })); }
new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.sf2') || n.querySelector && n.querySelector('.sf2'))))) requestAnimationFrame(() => fitSheets()); })
  .observe(document.documentElement, { childList:true, subtree:true });

/* ---------- the reward card: reveal, flip to its back, and the short quiz ---------- */
function rewardCardHTML(r, back){
  const d = docketDef(r.id), rw = DOCKET_REWARDS[d.reward];
  const [bl, bt, bw, bh] = rw.btn;
  return `<div class="rw-flip ${back ? 'back' : ''}" data-act="rw-flip">
    <div class="rw-face front"><span class="rw-card ${r.reward}"><img src="${artSrc(rw.front)}" alt="${esc(rw.name)}">${r.reward === 'rare' ? '<i class="rw-holo"></i>' : ''}</span>${r.reward === 'rare' ? '<em class="rw-tag">RARE</em>' : ''}</div>
    <div class="rw-face backside"><span class="rw-card ${r.reward}"><img src="${artSrc(rw.back)}" alt="${esc(rw.name)}, card back">
      <button class="rw-quizbtn" style="${sfBox(bl, bt, bw, bh)}" data-act="rw-quiz" data-id="${r.id}">${esc(quizButtonLabel(r))}</button></span></div></div>`;
}
/* Admin preview (Settings → Reward cards): shows a reward card as a player sees it, using a throwaway record,
   so nothing is saved and nobody's one-chance quiz is used up. */
let rwPreview = null;
const rwRec = id => rwPreview || docketRec(id);
function previewReward(id, kind){ rwPreview = { id, reward:kind, quiz:{ a:[] }, preview:true }; openReward(id); }
function openReward(id, reveal){
  const r = rwRec(id), d = docketDef(id); if (!r.reward) return;
  const t = r.preview ? null : docketTotals(d, r), ov = document.createElement('div'); ov.className = 'rw-ov'; ov.dataset.id = id;
  ov.innerHTML = `${reveal ? `<h2 class="rw-h">DOCKET COMPLETE</h2>` : ''}
    <p class="rw-sub">${r.preview ? `Admin preview · ${r.reward === 'rare' ? 'rare, full color (90%+)' : 'black and white (80–89%, or any retry)'} · nothing is saved`
      : r.reward === 'rare' ? `Rare reward · ${t.right} of ${t.total} right (${Math.round(t.pct * 100)}%)` : `Reward · ${t.right} of ${t.total} right (${Math.round(t.pct * 100)}%) · 90% earns full color`}</p>
    <div class="rw-stage ${reveal ? 'reveal' : ''}">${rewardCardHTML(r)}</div>
    <p class="rw-hint">Tap the card to flip it.</p>
    <button class="btn-big ${r.reward === 'rare' ? 'gold' : ''}" data-act="rw-close">${reveal ? 'ADD TO MY DOCKET FOLDER' : 'DONE'}</button>`;
  document.body.appendChild(ov); lockScroll();
}
/* The quiz behind the card's back button: one question per sticky note (yellow, green, blue, then the wide ivory one).
   One chance only: each answer is saved the moment it's tapped and can't be redone. All four right unlocks a super rare
   prize (r.superRare; what the prize is will be decided later). Progress lives in r.quiz = { a:[picked per question] }. */
const RWQ_NOTES = ['yellow', 'green', 'blue', 'ivory'];
const quizScore = (rw, r) => rw.quiz.filter((q, k) => (r.quiz && r.quiz.a[k]) === q.a).length;
const quizDone = (rw, r) => !!r.quiz && rw.quiz.every((q, k) => r.quiz.a[k] != null);
function rewardQuiz(id, show){
  const r = rwRec(id), rw = DOCKET_REWARDS[docketDef(id).reward], n = rw.quiz.length;
  r.quiz = r.quiz || { a:[] };
  let ov = document.querySelector('.rwq-ov');
  if (!ov) { ov = document.createElement('div'); ov.className = 'rwq-ov'; document.body.appendChild(ov); lockScroll(); }
  const next = rw.quiz.findIndex((q, k) => r.quiz.a[k] == null);
  const i = show != null ? show : next;   // show: the question just answered, so its note stays up with the answer
  if (i < 0) {
    const score = quizScore(rw, r), perfect = score === n;
    ov.innerHTML = `<h2 class="rw-h">RBG QUIZ</h2><div class="rwq-done"><b>${score} of ${n}</b><span>right</span>
        <img class="rwq-stamp" src="${artSrc('dk_stamp_completed')}" alt="Completed"></div>
      ${perfect ? `<p class="rwq-super">★ SUPER RARE PRIZE UNLOCKED ★</p><p class="rw-sub">All four on your one chance. Your prize will be revealed soon.</p>`
        : `<p class="rw-sub">The quiz was one chance only. Every answer is on the back of your card for next time you study.</p>`}
      <button class="btn-big ${perfect ? 'gold' : 'alt'}" data-act="rwq-close">BACK TO THE CARD</button>`;
    return;
  }
  const q = rw.quiz[i], color = RWQ_NOTES[i % RWQ_NOTES.length], picked = r.quiz.a[i], answered = picked != null;
  ov.innerHTML = `<h2 class="rw-h">RBG QUIZ · ${i + 1} OF ${n}</h2>
    ${i === 0 && !answered ? `<p class="rwq-warn">One chance only · get all ${n} right to unlock a super rare prize</p>` : ''}
    <div class="rwq-note ${color} ${answered ? '' : 'in'}" style="background-image:url('${artSrc('dk_note_' + color)}')"><div class="rwq-in">
      <p class="rwq-q">${esc(q.q)}</p>
      <div class="rwq-choices ${color === 'ivory' ? 'grid' : ''}">${q.c.map((c, k) => `<button class="rwq-c ${answered && k === q.a ? 'right' : ''} ${answered && k === picked && k !== q.a ? 'wrong' : ''}"
        data-act="rwq-pick" data-id="${id}" data-i="${i}" data-k="${k}" ${answered ? 'disabled' : ''}><b>${'ABCD'[k]}</b>${esc(c)}</button>`).join('')}</div>
      ${answered ? `<p class="rwq-fb ${picked === q.a ? 'ok' : 'no'}">${picked === q.a ? 'Correct!' : `The answer is ${esc(q.c[q.a])}.`} <a href="${q.url}" target="_blank" rel="noopener">${esc(q.src)} ↗</a></p>` : ''}
    </div></div>
    ${answered ? `<button class="btn-big" data-act="rwq-next" data-id="${id}">${next >= 0 ? 'NEXT NOTE →' : 'SEE MY SCORE'}</button>`
      : `<p class="rw-hint">Tap an answer on the note. It counts right away.</p>`}
    <button class="sheet-cancel" data-act="rwq-close">Back to the card</button>`;
}
function pickQuiz(id, i, k){
  const r = rwRec(id), rw = DOCKET_REWARDS[docketDef(id).reward];
  r.quiz = r.quiz || { a:[] };
  if (r.quiz.a[i] != null) return rewardQuiz(id);   // already answered: one chance only
  r.quiz.a[i] = k;
  if (quizDone(rw, r)) { r.quiz.at = Date.now(); if (quizScore(rw, r) === rw.quiz.length) r.superRare = true; }
  if (!r.preview) save();
  rewardQuiz(id, i);
}
const quizButtonLabel = r => { const rw = DOCKET_REWARDS[docketDef(r.id).reward];
  return !quizDone(rw, r) ? (r.quiz && r.quiz.a.some(a => a != null) ? 'Finish Your RBG Quiz' : 'Test Your RBG Knowledge')
    : r.superRare ? '★ Super Rare Unlocked ★' : `RBG Quiz: ${quizScore(rw, r)} of ${rw.quiz.length}`; };

/* ---------- screens ---------- */
const DOCKET_SCREENS = {
  rewardpreview(){
    if (!(typeof ADM !== 'undefined' && ADM.is)) return { title:'Reward Cards', body:'<p class="empty">Admins only.</p>' };
    return { title:'Reward Cards', body:`<p class="st-note">Every Hot Docket reward, as players see it. Tap one to open it, flip it, and try the quiz. Previews don't save anything.</p>
      ${HOT_DOCKETS.map(d => { const rw = DOCKET_REWARDS[d.reward]; return `<div class="sec-h"><span>${esc(rw.name)} · ${esc(d.id)}</span></div>
        <div class="dk-rewards">${[['rare', 'Rare · full color', '90%+ of 15'], ['bw', 'Black and white', '80–89%, or a retry']].map(([k, a, b]) =>
          `<button class="dk-rw ${k}" data-act="rw-preview" data-id="${d.id}" data-kind="${k}"><span class="rw-card ${k}"><img src="${artSrc(rw.front)}" alt="">${k === 'rare' ? '<i class="rw-holo"></i>' : ''}</span><small>${a}<br>${b}</small></button>`).join('')}
          <button class="dk-rw" data-act="rw-preview" data-id="${d.id}" data-kind="rare" data-back="1"><span class="rw-card"><img src="${artSrc(rw.back)}" alt=""></span><small>Card back<br>+ one-chance quiz</small></button></div>`; }).join('')}` };
  },
  docket(p){
    const d = docketDef(p.id); if (!d) return { title:'Hot Docket', body:'<p class="empty">This docket is not available.</p>' };
    const r = docketRec(p.id), n = r.level, x = lvRec(r, n);
    if (docketState(d) === 'missed') return { title:'Hot Docket', body:`<div class="dk-missed"><img src="${artSrc('docket_folder')}" alt="">
        <h3>This docket's week is over</h3><p>${esc(d.title)} closed before it was finished. A Continuance reopens it with no deadline; a pass earns the black-and-white card.</p>
        ${continuances() ? `<button class="btn-big gold" data-act="dk-reopen-missed">Use a Continuance (you have ${continuances()})</button>`
          : `<p class="st-note">You have no Continuances yet. They come in some packs.</p>`}</div>` };
    let tab = DOCKET_TABS.some(([k]) => k === p.tab) ? p.tab : (DOCKET_TABS.find(([k]) => !x.done[k]) || DOCKET_TABS[3])[0];
    if (!tabOpen(x, DOCKET_TABS.findIndex(([k]) => k === tab))) tab = 'learn';
    if (tab === 'practice' && p.q == null && !x.done.practice) p.q = Math.min(x.answers.filter(a => a != null).length, d.levels[n - 1].practice.length - 1);
    const levelDone = doneCount(x) === 4;
    let banner = '';
    if (levelDone && n < 3) banner = `<div class="sf-banner"><span>${ICO('mastered')} Level ${n} complete! Level ${n + 1} adds new filings to the same case.</span><button class="sf-btn go gold" data-act="dk-level">Start Level ${n + 1}</button></div>`;
    else if (levelDone && n === 3) banner = r.reward
      ? `<div class="sf-banner"><span>${ICO('mastered')} Docket complete! You earned the ${r.reward === 'rare' ? 'rare full-color' : 'black-and-white'} reward card.</span><button class="sf-btn go gold" data-act="dk-reward" data-id="${d.id}">See card</button></div>`
      : `<div class="sf-banner"><span>Docket complete, ${docketTotals(d, r).right} of 15 right. A reward card needs 12 (80%).
          ${continuances() ? `Spend a Continuance to answer the 15 questions again (you have ${continuances()}).` : 'Continuance coins come in some packs. One lets you answer the 15 questions again.'}</span>
          ${continuances() ? `<button class="sf-btn go gold" data-act="dk-continue">Use a Continuance</button>` : ''}</div>`;
    else if (r.retry && !levelDone) banner = `<div class="sf-banner reopen"><img src="${artSrc('dk_stamp_reopened')}" alt="Case reopened"><span>Case reopened: answer the practice questions again. A pass (80%) earns the black-and-white card.</span></div>`;
    if (p.miss) return missScreen(d, r, p);
    const missed = missedQs(d, r);
    if (missed.length && levelDone) banner += `<div class="sf-banner"><span>You missed ${missed.length} so far. Practice just those, free. It earns nothing and changes no score.</span><button class="sf-btn go" data-act="dm-start" data-id="${d.id}">Practice my misses</button></div>`;
    const sf = studyFileHTML(d, r, n, tab, p);
    return { title:'Hot Docket', body:`${banner}${sf.html}`, cta:true, after:dkFoot(sf.bar) };
  },
};

/* ---------- practice your misses: free, no reward, nothing saved ---------- */
function missedQs(d, r){
  const out = [];
  for (let lv = 1; lv <= r.level; lv++) { const L = d.levels[lv - 1], x = lvRec(r, lv);
    L.practice.forEach((q, k) => { if (x.answers[k] != null && x.answers[k] !== q.a) out.push({ lv, k, q }); }); }
  return out;
}
const dkFoot = bar => `<div class="cta-bar dk-foot"><div class="sf-bar">${bar}</div></div>`;
/* The same paper, the same tap-an-answer layout, but nothing is saved and nothing is earned. */
function missScreen(d, r, p){
  const m = p.miss, it = m.list[m.i], tabsHtml = DOCKET_TABS.map(([k, label], ti) => { const [x0, x1] = TAB_X[ti];
    return `<span class="sf-tab ${k === 'practice' ? 'on' : ''}" style="${sfBox(x0, 5.4, x1 - x0, 4.4)}" aria-hidden="true"><span>${label}</span></span>`; }).join('');
  const header = `<span class="sf-title" style="${sfBox(9, 16.9, 61, 5)}">Practice your misses</span>
    <span class="sf-cell" style="${sfBox(70, 16.9, 20, 5)}">FREE<br>NO REWARD</span><span class="sf-rule" style="${sfBox(9, 22.4, 81, .2)}"></span>`;
  let inner, bar;
  if (!it) {
    inner = `<div class="sf-area sf-fit" style="${sfBox(9, 23.6, 81, 60)}"><h4>Nice work</h4><p>You got ${m.right} of ${m.list.length} right this time.</p>
      <p>This was practice only. No reward, and your record is unchanged.</p></div>`;
    bar = `<button class="sf-btn go gold" data-act="dm-exit">Back to the docket</button>`;
  } else {
    const q = it.q, answered = m.picked != null, sel = answered ? m.picked : m.sel, last = m.i === m.list.length - 1;
    inner = `<div class="sf-area sf-fit" style="${sfBox(9, 23.4, 81, 60)}">
        <div class="sf-qhead"><b>Miss ${m.i + 1} of ${m.list.length}</b><span>Level ${it.lv}, question ${it.k + 1}</span></div>
        <p class="sf-q">${esc(q.q)}</p>
        <div class="sf-choices" role="group" aria-label="Answers">${q.c.map((t, k) => `<button type="button" class="sf-choice ${sel === k ? 'sel' : ''} ${answered && k === q.a ? 'right' : ''} ${answered && k === m.picked && m.picked !== q.a ? 'wrong' : ''}" aria-pressed="${sel === k}" ${answered ? 'aria-disabled="true" tabindex="-1"' : `data-act="dm-pick" data-k="${k}"`}><b>${'ABCD'[k]}</b><span>${esc(t)}</span></button>`).join('')}</div></div>
      ${answered && p.memo !== false ? `<div class="sf-memo in" style="${sfBox(6.5, 40, 87, 31)};background-image:url('${artSrc('dk_note_ivory')}')">
        <div class="sf-note-in sf-fit"><h4 class="${m.picked === q.a ? 'ok' : 'no'}">${m.picked === q.a ? 'Right' : 'Not quite'} · the answer is ${'ABCD'[q.a]}</h4><p>${esc(q.why)}</p><p class="sf-cite">Source: ${esc(q.cite)}</p></div>
        <button class="sf-memo-x" data-act="dk-memo">Hide note</button></div>` : ''}`;
    bar = `<button class="sf-btn" data-act="dm-exit">‹ Exit</button><span class="sf-count">Free practice</span>
      ${!answered ? `<button class="sf-btn go" data-act="dm-check" ${m.sel == null ? 'disabled' : ''}>Check ✓</button>`
        : `<button class="sf-btn go ${last ? 'gold' : ''}" data-act="dm-next">${last ? 'Finish ✓' : 'Next ›'}</button>`}`;
  }
  return { title:'Practice misses', cta:true, after:dkFoot(bar),
    body:`<div class="sf-crop"><div class="sf2" data-tab="practice"><img class="sf-base" src="${artSrc('sf_template')}" alt="">${tabsHtml}<div class="sf-page">${header}${inner}</div></div></div>` };
}
const sheetTitle = (sh, k) => sh.cover ? 'Cover' : sh.card ? sh.card.h : sh.entries ? `Level ${sh.chapter} · ${sh.name}` : sh.ev ? sh.ev.h : sh.src ? `Question ${sh.k + 1} source` : `Sheet ${k + 1}`;

/* ---------- taps and swipes ---------- */
function dkGo(patch){
  const en = topEntry(); if (!en || en.s !== 'docket') return;
  en.p = { ...en.p, justStamped:null, flip:null, memoIn:false, ...patch }; refresh();
}
function dkSheet(dir, to){
  const en = topEntry(), d = docketDef(en.p.id), r = docketRec(d.id), tab = currentScreenEl().querySelector('.sf2').dataset.tab;
  if (tab === 'practice') return;
  const n = tabSheets(tab, d, r.level).length, cur = en.p.sheet || 0, i = to != null ? to : Math.max(0, Math.min(n - 1, cur + dir));
  if (i !== cur) dkGo({ tab, sheet:i, flip:i > cur ? 'next' : 'prev' });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  // reward card and its quiz work from anywhere (the Docket folder or the docket)
  switch (t.dataset.act) {
    case 'dk-reward': closeSheet(true); openReward(t.dataset.id); return;
    case 'rw-flip': t.classList.toggle('back'); return;
    case 'rw-quiz': e.stopPropagation(); rewardQuiz(t.dataset.id); return;
    case 'rw-close': { const ov = t.closest('.rw-ov'); ov.remove(); rwPreview = null; unlockScroll(); refresh(); return; }
    case 'rw-preview': previewReward(t.dataset.id, t.dataset.kind); if (t.dataset.back) document.querySelector('.rw-flip')?.classList.add('back'); return;
    case 'rwq-pick': pickQuiz(t.dataset.id, +t.dataset.i, +t.dataset.k); return;
    case 'rwq-next': rewardQuiz(t.dataset.id); return;
    case 'rwq-close': { const ov = t.closest('.rwq-ov'); ov.remove();
      const b = document.querySelector('.rw-quizbtn'); if (b) b.textContent = quizButtonLabel(rwRec(b.dataset.id)); return; }
  }
  const en = topEntry && topEntry(); if (!en || en.s !== 'docket') return;
  const d = docketDef(en.p.id), r = d && docketRec(d.id); if (!d) return;
  const n = r.level, x = lvRec(r, n);
  if (['dk-check', 'dk-done', 'dk-level'].includes(t.dataset.act) && docketState(d) === 'missed') {   // a page left open past the deadline
    toast("This docket's week just ended. Nothing new was saved.", 'lock'); refresh(); return; }
  switch (t.dataset.act) {
    case 'dm-start': { const list = missedQs(d, r); if (list.length) dkGo({ miss:{ list, i:0, sel:null, picked:null, right:0 }, memo:true }); break; }
    case 'dm-pick': if (en.p.miss && en.p.miss.picked == null) dkGo({ miss:{ ...en.p.miss, sel:+t.dataset.k } }); break;
    case 'dm-check': { const m = en.p.miss; if (!m || m.sel == null || m.picked != null) break;
      dkGo({ miss:{ ...m, picked:m.sel, right:m.right + (m.sel === m.list[m.i].q.a ? 1 : 0) }, memo:true }); break; }
    case 'dm-next': { const m = en.p.miss; if (m) dkGo({ miss:{ ...m, i:m.i + 1, sel:null, picked:null }, memo:true }); break; }
    case 'dm-exit': dkGo({ miss:null }); break;
    case 'dk-toc': { const tab = currentScreenEl().querySelector('.sf2').dataset.tab, sheets = tabSheets(tab, d, n), cur = en.p.sheet || 0, ti = DOCKET_TABS.findIndex(([k]) => k === tab), nx = DOCKET_TABS[ti + 1];
      openSheet(`<h3>Contents</h3><div class="list">${sheets.map((sh, k) => `<button class="row" data-act="dk-jump" data-i="${k}"><span class="row-main"><b>${esc(sheetTitle(sh, k))}</b>${k === cur ? '<small>You are here</small>' : ''}</span>${chev}</button>`).join('')}</div>
        ${nx && tabOpen(x, ti + 1) ? `<button class="btn-big gold" data-act="dk-tab" data-tab="${nx[0]}">GO TO ${nx[1].toUpperCase()}</button>` : ''}
        <button class="sheet-cancel" data-act="sheet-close">Close</button>`); break; }
    case 'dk-jump': closeSheet(true); dkSheet(0, +t.dataset.i); break;
    case 'dk-tab': { closeSheet(true); const i = DOCKET_TABS.findIndex(([k]) => k === t.dataset.tab);
      if (!tabOpen(x, i)) { toast(`Finish ${DOCKET_TABS.find(([k]) => !x.done[k])[1]} first`, 'lock'); break; }
      dkGo({ tab:t.dataset.tab, sheet:0, q:null, sel:null, memo:true }); break; }
    case 'dk-sheet': dkSheet(+t.dataset.d); break;
    case 'dk-ev': dkSheet(0, +t.dataset.i); break;
    case 'dk-done': { const k = t.dataset.tab; x.done[k] = true; if (k === 'practice') x.practiceAt = Date.now();
      const finished = n === 3 && doneCount(x) === 4 && !r.completedAt;
      if (finished) { r.completedAt = Date.now(); r.reward = rewardFor(docketTotals(d, r).pct, r.retry); }
      save(); dkGo({ tab:k, sheet:0, q:null, justStamped:k });
      toast(doneCount(x) === 4 ? (n === 3 ? 'Docket complete!' : `Level ${n} complete!`) : `${DOCKET_TABS.find(([y]) => y === k)[1]} complete`, 'check');
      if (finished && r.reward) setTimeout(() => openReward(d.id, true), 700);
      break; }
    case 'dk-reopen-missed':
      iosAlert({ title:'Use a Continuance?', msg:`Spend 1 of your ${continuances()} to reopen ${d.title}. It stays open with no deadline, and a pass (80%) earns the black-and-white card.`,
        buttons:[{ label:'Not now', value:false }, { label:'Reopen', value:true, style:'bold' }] })
        .then(ok => { if (ok && reopenMissed(d.id)) { dkGo({}); toast('Case reopened', 'sync'); } });
      break;
    case 'dk-continue':
      iosAlert({ title:'Use a Continuance?', msg:`Spend 1 of your ${continuances()} Continuance${continuances() === 1 ? '' : 's'} to reopen this docket. You'll answer all 15 practice questions again; your reading stays done. A pass (80%) earns the black-and-white card.`,
        buttons:[{ label:'Not now', value:false }, { label:'Reopen', value:true, style:'bold' }] })
        .then(ok => { if (ok && reopenDocket(d.id)) { dkGo({ tab:'practice', q:0, sel:null, sheet:0 }); toast('Case reopened', 'sync'); } });
      break;
    case 'dk-level': if (doneCount(x) === 4 && n < 3) { r.level = n + 1; save();   // a reopened docket goes straight back to Practice (its reading stays done)
      dkGo(r.retry ? { tab:'practice', q:0, sel:null, sheet:0 } : { tab:'learn', sheet:0, q:null, sel:null }); toast(`Level ${n + 1} is open`, 'star'); } break;
    case 'dk-pick': dkGo({ sel:+t.dataset.k }); break;
    case 'dk-check': { const i = en.p.q || 0; if (en.p.sel == null || x.answers[i] != null) break; x.answers[i] = en.p.sel; save(); dkGo({ memo:true, memoIn:true }); break; }
    case 'dk-memo': dkGo({ memo:false }); break;
    case 'dk-q': { const q = +t.dataset.q; dkGo({ q, sel:null, memo:true, flip:q > (en.p.q || 0) ? 'next' : 'prev' }); break; }
    case 'dk-review': dkGo({ q:t.dataset.q === '' ? null : +t.dataset.q, sel:null, memo:true }); break;
  }
});
let dkSwipe = null;
document.addEventListener('pointerdown', e => { const c = e.target.closest('.sf2'); dkSwipe = c && !e.target.closest('button,a,.sf-memo,[data-act]') ? { x:e.clientX, y:e.clientY } : null; });
document.addEventListener('pointerup', e => {
  if (!dkSwipe) return; const dx = e.clientX - dkSwipe.x, dy = e.clientY - dkSwipe.y; dkSwipe = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) dkSheet(dx < 0 ? 1 : -1);
});

const DOCKET_CSS = `
.dk-folder{width:min(62%,260px);margin:4px auto 2px}
.dk-folder img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
.dk-thumb{flex:none;width:44px;height:44px;border-radius:6px;overflow:hidden;border:3px solid #f4efe4;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.dk-thumb img{width:100%;height:100%;object-fit:cover}
.sf-crop{margin:0 -8px;aspect-ratio:853/1600;overflow:hidden;position:relative}   /* the art has empty space under the paper: cut it off */
.sf2{position:absolute;left:0;top:0;width:100%;aspect-ratio:853/1844;container-type:inline-size;color:#2a241c}
@media (min-width:600px){.sf-crop{max-width:520px;margin:0 auto}}
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
.sf-area{position:absolute;overflow:hidden;font:4.6cqw/1.42 "Courier Prime",monospace}   /* docket type for everything you read; handwriting stays on the notes */
.sf-area.scrolls,.sf-note-in.scrolls{overflow-y:auto;-webkit-mask-image:linear-gradient(#000 88%,transparent)}
.sf-area h4{margin:0 0 .5em;font:700 1.02em/1.25 "Courier Prime",monospace;text-transform:uppercase;letter-spacing:.05em;color:#2b3a55}
.sf-area p,.sf-area li{margin:0 0 .55em}
.sf-area ul{margin:0 0 .5em;padding-left:1.1em}
.sf-aside{font:1.12em/1.3 "Patrick Hand";color:#5a5040}
.sf-toc{margin:0;padding-left:1.2em} .sf-toc li{list-style:none;position:relative;margin:0 0 .15em} .sf-toc li::before{content:"☐";position:absolute;left:-1.2em;color:#8a7f6c}
.sf-case b{display:block;font:700 1em/1.3 "Courier Prime",monospace;margin-bottom:.4em}
.sf-entries{display:flex;flex-direction:column;border-top:.4cqw solid rgba(42,36,28,.35)}
.sf-entry{display:flex;gap:.6em;padding:.38em 0;border-bottom:.4cqw solid rgba(42,36,28,.2);font:.94em/1.32 "Courier Prime",monospace}
.sf-entry b{flex:none;width:2.2em;font-weight:700;color:#b3261e}
.sf-entry em{display:block;font-style:normal;font-weight:700}
.sf-citeh{font:700 1em/1.3 "Courier Prime",monospace}
.sf-area em.lb{display:block;font-style:normal;font:700 .8em/1.2 "Courier Prime",monospace;text-transform:uppercase;letter-spacing:.06em;color:#8a7f6c}
.sf-links{display:flex;flex-wrap:wrap;gap:.3em .9em} .sf-links a{color:#2b3a55;font-weight:700}
.sf-qhead{display:flex;align-items:center;justify-content:space-between;margin:0 0 .3em}
.sf-qhead b{font:700 .9em "Courier Prime",monospace;text-transform:uppercase;letter-spacing:.05em;color:#2b3a55}
.sf-qhead span{display:flex;gap:1.2cqw} .sf-qhead i{width:2.6cqw;height:2.6cqw;border-radius:1.3cqw;border:.4cqw solid #2a241c;opacity:.45}
.sf-qhead i.cur{opacity:1} .sf-qhead i.ok{background:#2f6b3a;border-color:#2f6b3a;opacity:1} .sf-qhead i.no{background:#b3261e;border-color:#b3261e;opacity:1}
.sf-q{font-weight:700}
.sf-choices{display:flex;flex-direction:column;gap:.3em}
.sf-choice{display:flex;gap:.5em;align-items:flex-start;width:100%;margin:0;background:none;color:inherit;font-family:inherit;text-align:left;-webkit-appearance:none;appearance:none;padding:.3em .4em;border-radius:1.8cqw;border:.5cqw solid transparent;font-size:.94em;line-height:1.32;cursor:pointer}
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
.sf-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;min-height:48px;}
.dk-foot{padding-top:10px}.dk-foot .sf-bar{margin:0;max-width:520px}
.screen.has-cta:has(.sf-crop) .scr{padding-bottom:84px}
.sf-count{font:18px "Patrick Hand";color:var(--sub);text-align:center;flex:1}
button.sf-count{background:none;border:0;padding:6px 4px;min-height:44px;text-decoration:underline;text-underline-offset:3px}
.dm-note{margin:0 4px 6px;font:15px var(--ui);color:var(--sub)}
.as-list button.right{background:#cfe8c9;border-color:#2f6b3a}.as-list button.wrong{background:#f3cfc9;border-color:#b3261e}
.as-list button[aria-disabled="true"]{cursor:default}
.dm-why{margin:12px 4px;padding:10px 12px;border-radius:12px;background:var(--bg2);color:var(--paper);font:17px/1.4 "Patrick Hand"}
.dm-why b{display:block;margin-bottom:4px;color:var(--mustard)}.dm-why p{margin:4px 0}
.sf-btn{flex:none;min-width:96px;min-height:46px;padding:0 14px;border:2px solid rgba(241,229,201,.35);border-radius:12px;background:var(--bg2);color:var(--paper);font:19px "Patrick Hand"}
.sf-btn.go{background:#2b3a55;border-color:#2b3a55} .sf-btn.go.gold{background:var(--mustard);border-color:var(--mustard);color:var(--ink)}
.sf-btn.ghost{visibility:hidden}
.sf-btn[disabled]{opacity:.35}
.sf-banner{margin:0 0 10px;padding:10px 12px;border-radius:12px;background:rgba(227,178,60,.16);color:var(--mustard);font:18px/1.3 "Patrick Hand";display:flex;gap:10px;align-items:center}
.sf-new{display:inline-block;vertical-align:middle;margin-left:.3em;padding:.1em .4em;border-radius:.3em;background:#b3261e;color:#fff;font:700 .5em/1.2 var(--ui);letter-spacing:.02em}
.sf-evfor{font:700 .82em/1.3 "Courier Prime",monospace;color:#8a7f6c;margin-top:-.2em !important}
.sf-entry.has-ev{cursor:pointer;position:relative} .sf-entry.has-ev:active{background:rgba(43,58,85,.08)}
.sf-entry .ev{position:absolute;right:0;top:.3em;font-style:normal;font-size:1.1em}
.sf-banner span{flex:1}
.sf-banner.reopen{background:rgba(70,110,170,.18);color:#a9c8f0}
.sf-banner.reopen img{width:92px;flex:none;transform:rotate(-6deg)}
.dk-home{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:10px 12px;border:2px solid rgba(207,59,42,.55);border-radius:16px;
  background:linear-gradient(135deg,rgba(207,59,42,.18),rgba(227,178,60,.1));color:var(--paper);text-align:left}
.dk-home img{width:54px;flex:none;filter:drop-shadow(0 3px 5px rgba(0,0,0,.4))}
.dk-home span{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dk-home em{font:400 15px/1 "Bangers";letter-spacing:.08em;font-style:normal;color:#ff8a6a}
.dk-home b{font:400 18px/1.1 "Bangers";letter-spacing:.03em}
.dk-home small{font:14px "Patrick Hand";color:var(--sub)}
.dk-home i{flex:none;font:700 13px var(--ui);font-style:normal;padding:4px 9px;border-radius:12px;background:rgba(0,0,0,.35);color:var(--mustard)} .dk-home i.soon{color:#ff8a6a}
.dk-missed{text-align:center;padding:20px 8px} .dk-missed img{width:140px;opacity:.7;filter:grayscale(.6)}
.dk-missed h3{font:400 26px "Bangers";letter-spacing:.04em;margin:12px 0 6px} .dk-missed p{font:17px/1.4 "Patrick Hand";color:var(--sub);margin:0 0 14px}
.dk-coins{display:flex;align-items:center;gap:12px;margin:12px 0 4px;padding:10px 14px;border-radius:14px;background:var(--bg2)}
.dk-coins img{width:48px;height:48px;flex:none}
.dk-coins b{display:block;font:400 20px/1.1 "Bangers";letter-spacing:.05em;color:var(--mustard)} .dk-coins small{font:14px "Patrick Hand";color:var(--sub)}
.sf-banner .sf-btn{min-width:0;min-height:40px;font-size:17px}
.dk-rewards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.dk-rw{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px;border:0;border-radius:14px;background:var(--bg2);color:var(--sub)}
.dk-rw small{font:13px "Patrick Hand"}
.rw-card{position:relative;display:block;border-radius:5%/3.4%;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.5)}
.rw-card img{display:block;width:100%;height:auto}
.rw-card.bw>img{filter:grayscale(1) contrast(1.08) brightness(1.02)}
.rw-card.rare{box-shadow:0 0 0 2px #f5d77a,0 0 26px 6px rgba(245,205,90,.55),0 10px 24px rgba(0,0,0,.5)}
.rw-holo{position:absolute;inset:0;pointer-events:none;mix-blend-mode:color-dodge;opacity:.55;
  background:linear-gradient(115deg,transparent 20%,rgba(255,120,200,.7) 35%,rgba(120,220,255,.7) 48%,rgba(190,255,140,.7) 60%,transparent 76%);background-size:300% 100%;animation:rwshine 3.4s linear infinite}
@keyframes rwshine{from{background-position:120% 0}to{background-position:-180% 0}}
.rw-face.front{position:relative}
.rw-tag{position:absolute;top:-3.2%;left:50%;translate:-50% 0;z-index:2;padding:.25em .6em;border-radius:1em;background:linear-gradient(135deg,#fff3b0,#e3b23c);color:#1d1b17;font:400 clamp(12px,3.4vw,16px)/1 "Bangers";letter-spacing:.08em;font-style:normal;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.dk-rw .rw-card{width:100%}
.rw-ov{position:fixed;inset:0;z-index:84;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;
  background:radial-gradient(circle at 50% 42%,rgba(70,48,14,.95),rgba(0,0,0,.97));animation:fadein .3s both}
.rw-ov .btn-big{max-width:340px}
.rw-h{margin:0;font:400 34px/1 "Bangers";letter-spacing:.06em;color:var(--mustard);text-shadow:0 3px 0 var(--ink)}
.rw-sub{margin:0;font:17px "Patrick Hand";color:var(--paper);text-align:center}
.rw-hint{margin:0;font:15px "Patrick Hand";color:var(--sub)}
.rw-stage{width:min(72vw,300px,calc((100dvh - 250px) / 1.5));perspective:1200px}
.rw-stage.reveal{animation:rwin .9s cubic-bezier(.2,1.3,.4,1) both}
@keyframes rwin{0%{transform:scale(.3) rotate(-18deg);opacity:0}60%{transform:scale(1.06) rotate(3deg);opacity:1}100%{transform:none}}
.rw-flip{position:relative;display:grid;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.4,.1,.2,1);cursor:pointer}
.rw-flip.back{transform:rotateY(180deg)}
.rw-face{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.rw-face.backside{transform:rotateY(180deg)}
.rw-quizbtn{position:absolute;border:0;border-radius:3cqw;background:rgba(122,32,26,.9);color:#fff4dc;font:400 clamp(14px,4.6vw,20px)/1 "Bangers";letter-spacing:.06em;box-shadow:inset 0 0 0 2px rgba(255,236,200,.5)}
.rw-face.backside .rw-card{container-type:inline-size}
.rwq-ov{position:fixed;inset:0;z-index:86;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;
  background:radial-gradient(circle at 50% 42%,#34281a,#0d0b09);animation:fadein .25s both}
.rwq-ov .btn-big,.rwq-ov .sheet-cancel{max-width:340px}
.rwq-note{position:relative;width:min(88vw,350px);aspect-ratio:1/1;background:no-repeat center/100% 100%;container-type:inline-size;transform:rotate(-1.5deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.45))}
.rwq-note.green{transform:rotate(1.5deg)} .rwq-note.blue{transform:rotate(-1deg)}
.rwq-note.ivory{aspect-ratio:1.63/1;width:min(94vw,380px);transform:rotate(1deg)}
.rwq-note.in{animation:rwqin .45s cubic-bezier(.2,1.2,.4,1) both}
@keyframes rwqin{from{transform:translateX(60%) rotate(8deg);opacity:0}}
.rwq-in{position:absolute;left:9%;right:10%;top:17%;bottom:12%;display:flex;flex-direction:column;gap:2.4cqw;color:#2a241c}
.rwq-note.ivory .rwq-in{top:15%;bottom:14%;left:6%;right:7%;gap:1.6cqw}
.rwq-q{margin:0;font:700 5.6cqw/1.25 "Patrick Hand"}
.rwq-note.ivory .rwq-q{font-size:4.6cqw}
.rwq-choices{display:flex;flex-direction:column;gap:1.6cqw}
.rwq-choices.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.4cqw 2cqw}
.rwq-c{display:flex;align-items:center;gap:2cqw;min-height:9.6cqw;padding:0 2cqw;border:.5cqw solid rgba(42,36,28,.35);border-radius:2cqw;background:rgba(255,255,255,.35);color:#2a241c;font:5cqw/1.1 "Patrick Hand";text-align:left}
.rwq-note.ivory .rwq-c{font-size:4.2cqw;min-height:8cqw}
.rwq-c b{flex:none;width:6.4cqw;height:6.4cqw;border-radius:1.4cqw;background:rgba(42,36,28,.14);font:700 4cqw/6.4cqw "Courier Prime",monospace;text-align:center}
.rwq-c.right{border-color:#2f6b3a;background:rgba(47,107,58,.2)} .rwq-c.right b{background:#2f6b3a;color:#fff}
.rwq-c.wrong{border-color:#b3261e;background:rgba(179,38,30,.12);text-decoration:line-through;text-decoration-color:#b3261e}
.rwq-c[disabled]{opacity:1}
.rwq-warn{margin:-4px 0 0;font:17px "Patrick Hand";color:var(--mustard);text-align:center}
.rwq-super{margin:4px 0 0;white-space:nowrap;font:400 clamp(18px,6vw,26px)/1 "Bangers";letter-spacing:.06em;color:#ffe27a;text-shadow:0 0 14px rgba(255,210,90,.6);text-align:center}
.rwq-fb{margin:0;font:4.4cqw/1.3 "Patrick Hand"} .rwq-fb.ok{color:#2f6b3a} .rwq-fb.no{color:#b3261e}
.rwq-fb a{color:#2b3a55;font-weight:700}
.rwq-done{position:relative;display:flex;flex-direction:column;align-items:center;padding:22px 44px 64px;border-radius:10px;background:#f6ecd6;color:#2a241c;transform:rotate(-1.5deg);box-shadow:0 8px 18px rgba(0,0,0,.45)}
.rwq-done b{font:400 56px/1 "Bangers";letter-spacing:.04em} .rwq-done span{font:20px "Patrick Hand"}
.rwq-stamp{position:absolute;width:150px;left:50%;margin-left:-75px;bottom:10px;transform:rotate(-10deg);mix-blend-mode:multiply;animation:sfslam .4s cubic-bezier(.2,1.6,.4,1) both}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${DOCKET_CSS}</style>`);
