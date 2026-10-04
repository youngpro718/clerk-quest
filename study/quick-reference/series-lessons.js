/* Series 4/5 study content.
 *
 * Browser global consumed by the app integration layer. Legal summaries are
 * paraphrases checked against the official snapshots listed in
 * docs/verification/quick-reference/series-lessons-verification.md.
 */
(function () {
  'use strict';

  const VERIFIED = '2026-10-03';
  const FROM = 'New York State Legislature, Laws of New York database';
  const senateUrl = (law, section) =>
    `https://www.nysenate.gov/legislation/laws/${law === 'PL' ? 'PEN' : 'CPL'}/${section.split('(')[0]}`;

  const q = (lv, prompt, choices, answer, hint, why, type) => ({
    lv, q:prompt, c:choices, a:answer, h:hint, w:why, ...(type ? { type } : {})
  });

  const card = (o) => {
    const words = o.name.toUpperCase().split(/\s+/);
    const split = Math.ceil(words.length / 2);
    return {
      id: o.id,
      art: o.art,
      asset: `assets/series${o.series}/characters/${o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`,
      cutout: true,
      num: `S${o.series}-${String(o.number).padStart(2, '0')}`,
      l1: words.slice(0, split).join(' '),
      l2: words.slice(split).join(' ') || words[0],
      name: o.name,
      series: o.series,
      seriesNumber: o.number,
      category: o.category,
      set: o.series === 4 ? 'CRIMINAL PROCEDURE' : 'PENAL LAW',
      rarity: 'common',
      icon: 'court',
      emoji: o.emoji,
      maxLevel: 3,
      quote: o.hook,
      hook: o.hook,
      intro: { idea: o.summary, example: o.example, source: o.cite },
      source: {
        cite: o.cite,
        quote: o.summary,
        paraphrase: true,
        context: o.context,
        from: FROM,
        url: senateUrl(o.law, o.section),
        article: o.section.split('.')[0],
        verified: VERIFIED
      },
      panel: o.panel,
      lore: [o.summary, o.context, o.example],
      stickers: {},
      bank: o.bank
    };
  };

  const cards = [
    card({
      id:'qr_cpl_001_criminal_action', art:'s4_case_starter', series:4, number:1, name:'Case Starter', category:'CRIMINAL CASE BASICS', emoji:'🏁', law:'CPL', section:'1.20', cite:'CPL § 1.20', hook:'File to finish',
      summary:'A criminal action begins when an accusatory instrument is filed against a defendant in a criminal court and continues through sentence or another final disposition.',
      context:'The filing event separates the criminal action from investigative activity that occurred before filing.', example:'A complaint is filed today; the criminal action begins today.',
      panel:{kind:'trigger',caption:'Starting a criminal action',steps:['ACCUSATORY INSTRUMENT FILED','ACTION BEGINS','SENTENCE OR FINAL DISPOSITION']},
      bank:[
        q(1,'What event begins a criminal action under CPL § 1.20?',['Filing an accusatory instrument in criminal court','Opening a police investigation','Making an arrest','Interviewing a witness'],'Filing an accusatory instrument in criminal court','Look for the formal court filing.','The statute ties commencement to filing an accusatory instrument against a defendant in criminal court.'),
        q(1,'TRUE or FALSE: A police investigation by itself begins the criminal action.',['True','False'],'False','Investigation can precede a filed case.','False. The criminal action begins with the accusatory-instrument filing.', 'tf'),
        q(2,'A felony complaint is filed Monday after a weekend investigation. When does the criminal action begin?',['Monday, when the complaint is filed','When police first developed suspicion','When the first witness was interviewed','At the later arraignment'],'Monday, when the complaint is filed','Focus on the filing date.','Filing the accusatory instrument starts the action; investigation and arraignment are different events.'),
        q(2,'Which event ordinarily marks the far end of the criminal action described in CPL § 1.20?',['Sentence or another final disposition','The first court appearance only','The prosecutor’s opening statement','The arrest alone'],'Sentence or another final disposition','Think file to finish.','The definition continues the action through sentence or another final disposition.'),
        q(3,'Which pairing correctly describes the statutory span of a criminal action?',['Accusatory-instrument filing → sentence or final disposition','Investigation → arrest','Arrest → indictment only','Complaint drafting → arraignment only'],'Accusatory-instrument filing → sentence or final disposition','Use both ends of the definition.','CPL § 1.20 uses the filing as the beginning and sentence or other final disposition as the end.')
      ]
    }),
    card({
      id:'qr_cpl_011_superior_jurisdiction', art:'s4_jurisdiction_jet', series:4, number:2, name:'Jurisdiction Jet', category:'COURTS & JURISDICTION', emoji:'🏛️', law:'CPL', section:'10.20', cite:'CPL § 10.20', hook:'Felony trial goes upstairs',
      summary:'Superior courts have trial jurisdiction over all offenses and exclusive trial jurisdiction over felonies, subject to statutory provisions governing removal and youth matters.',
      context:'A felony charge may begin in local criminal court, but the felony trial belongs in superior court.', example:'A felony complaint starts locally; the felony trial proceeds in superior court.',
      panel:{kind:'diff',caption:'Trial jurisdiction',heads:['SUPERIOR COURT','LOCAL CRIMINAL COURT'],yes:['ALL OFFENSES','FELONY TRIALS EXCLUSIVE'],no:['FELONY MAY START LOCALLY','NONFELONY TRIALS']},
      bank:[
        q(1,'Which court has exclusive trial jurisdiction over felonies?',['Superior court','Local criminal court','Family Court in every case','Village court'],'Superior court','Separate where a charge starts from where it is tried.','CPL § 10.20 gives superior courts exclusive felony trial jurisdiction, subject to statutory exceptions.'),
        q(1,'TRUE or FALSE: Superior courts have trial jurisdiction over all offenses.',['True','False'],'True','The rule is broader than felonies alone.','True. Their trial jurisdiction covers all offenses, with felony trial jurisdiction exclusive.', 'tf'),
        q(2,'A felony complaint is first filed in local criminal court. Which statement is correct?',['The felony may begin locally, but its trial belongs in superior court','Local criminal court must conduct the felony trial','Filing locally converts the felony to a misdemeanor','No court has jurisdiction until indictment'],'The felony may begin locally, but its trial belongs in superior court','Beginning a case and trying it are different powers.','Local court may exercise preliminary jurisdiction while superior court has exclusive felony trial jurisdiction.'),
        q(2,'What does “exclusive” mean in the CPL § 10.20 felony-trial rule?',['The felony trial is assigned to superior court','Only the prosecutor may appear','The defendant cannot request counsel','The case cannot begin in local court'],'The felony trial is assigned to superior court','Apply the word to trial jurisdiction.','Exclusive trial jurisdiction identifies the court authorized to try the felony.'),
        q(3,'Which statement best avoids confusing preliminary and trial jurisdiction?',['Local court may handle an early felony stage; superior court conducts the felony trial','Every felony begins and ends in village court','Superior court handles only sentencing','An arrest automatically creates a superior-court indictment'],'Local court may handle an early felony stage; superior court conducts the felony trial','Track the procedural stage.','CPL article 10 distinguishes a local court’s preliminary role from the superior court’s felony-trial role.')
      ]
    }),
    card({
      id:'qr_cpl_013_limitations', art:'s4_clock_dodger', series:4, number:3, name:'Clock Dodger', category:'COMMENCEMENT DEADLINES', emoji:'⏰', law:'CPL', section:'30.10', cite:'CPL § 30.10', hook:'Baseline, then exceptions',
      summary:'The general periods are no limitation for a class A felony, five years for another felony, two years for a misdemeanor, and one year for a petty offense.',
      context:'These are baselines; the statute also contains extensions, victim-age provisions, public-servant rules, tolling, and other exceptions.', example:'A non-class-A felony starts with a five-year baseline, but an applicable exception may extend it.',
      panel:{kind:'clock',caption:'General CPL § 30.10 baselines',steps:[{n:'NONE',label:'CLASS A FELONY',from:'general baseline'},{n:'5',label:'OTHER FELONY YEARS',from:'before exceptions'},{n:'2 / 1',label:'MISDEMEANOR / PETTY YEARS',from:'before exceptions'}]},
      bank:[
        q(1,'What is the general CPL § 30.10 period for a misdemeanor?',['Two years','One year','Five years','No limitation'],'Two years','Use the subdivision 2 baseline.','The general misdemeanor limitations period is two years.'),
        q(1,'What is the general baseline for a felony other than a class A felony?',['Five years','Two years','One year','Thirty days'],'Five years','Class A is treated separately.','The general period for another felony is five years.'),
        q(2,'A clerk identifies the general deadline from subdivision 2. What should happen next?',['Check the statute for extensions, tolling, and specific exceptions','Treat the baseline as absolute','Use the civil limitations period','Measure from arraignment in every case'],'Check the statute for extensions, tolling, and specific exceptions','The card’s hook has two steps.','CPL § 30.10 includes rules that can alter the general baseline.'),
        q(2,'TRUE or FALSE: Every class A felony has a five-year limitations period.',['True','False'],'False','Class A has a distinct baseline.','False. The general table states no limitation for a class A felony.', 'tf'),
        q(3,'A petty offense is being reviewed and no exception has yet been found. Which baseline applies?',['One year','Two years','Five years','No limitation'],'One year','Use the petty-offense row.','The general limitations period for a petty offense is one year, subject to the rest of the statute.')
      ]
    }),
    card({
      id:'qr_cpl_016_facial_sufficiency', art:'s4_proof_polly', series:4, number:4, name:'Proof Polly', category:'ACCUSATORY INSTRUMENTS', emoji:'🔎', law:'CPL', section:'100.40', cite:'CPL § 100.40', hook:'Instrument first, test second',
      summary:'An information generally requires nonhearsay factual allegations establishing every element and the defendant’s commission; complaints use the reasonable-cause test stated for them.',
      context:'Simplified and prosecutor’s informations have their own subdivision-specific tests, so one formula does not govern every instrument.', example:'An information must be tested under the information standard, not the complaint standard.',
      panel:{kind:'trigger',caption:'Facial sufficiency',steps:['IDENTIFY THE INSTRUMENT','FIND ITS SUBDIVISION','APPLY THAT TEST']},
      bank:[
        q(1,'What is the first step in a CPL § 100.40 facial-sufficiency review?',['Identify the type of accusatory instrument','Assume every instrument is an information','Count the witnesses','Set a sentencing date'],'Identify the type of accusatory instrument','Different instruments use different subdivisions.','The instrument’s type determines which facial-sufficiency test applies.'),
        q(1,'An information generally needs what kind of factual allegations to establish each element and the defendant’s commission?',['Nonhearsay factual allegations','A prosecutor’s conclusion alone','An unsigned prediction','A sentencing recommendation'],'Nonhearsay factual allegations','This is the information standard.','The information standard generally requires nonhearsay allegations establishing the elements and commission.'),
        q(2,'A reviewer applies the information test to a misdemeanor complaint without checking the instrument type. What is the error?',['Using one test for instruments governed by different subdivisions','Reviewing the document before trial','Reading factual allegations','Checking reasonable cause'],'Using one test for instruments governed by different subdivisions','Instrument first, test second.','CPL § 100.40 supplies distinct tests for different accusatory instruments.'),
        q(2,'TRUE or FALSE: A simplified information necessarily uses the identical formula applied to an information.',['True','False'],'False','Simplified instruments have a separate statutory test.','False. The applicable subdivision must be selected for the instrument.', 'tf'),
        q(3,'Which workflow best matches CPL § 100.40?',['Classify the instrument, select the matching subdivision, then test its allegations','Apply the complaint rule to every filing','Decide guilt, then inspect the instrument','Use the arrest report as the only test'],'Classify the instrument, select the matching subdivision, then test its allegations','Order matters.','Facial sufficiency depends on the instrument-specific statutory standard.')
      ]
    }),
    card({
      id:'qr_cpl_020_arrest_warrant_issue', art:'s4_warrant_walt', series:4, number:5, name:'Warrant Walt', category:'WARRANTS & APPEARANCES', emoji:'📜', law:'CPL', section:'120.20', cite:'CPL § 120.20(1)', hook:'Test before warrant',
      summary:'After a qualifying accusatory instrument is filed against an unarraigned defendant, the court may issue a warrant if the instrument is facially sufficient.',
      context:'If the instrument is insufficient and cannot be cured, dismissal is required rather than a warrant.', example:'A defendant’s absence does not make a deficient instrument sufficient for a warrant.',
      panel:{kind:'trigger',caption:'Before issuing a warrant',steps:['QUALIFYING INSTRUMENT FILED','FACIAL SUFFICIENCY','WARRANT MAY ISSUE']},
      bank:[
        q(1,'Before issuing the warrant described in CPL § 120.20(1), what must the court confirm?',['The accusatory instrument is facially sufficient','The defendant has already been sentenced','A jury has returned a verdict','The case is civil'],'The accusatory instrument is facially sufficient','Test before warrant.','Facial sufficiency is required for the warrant route described by the statute.'),
        q(1,'The statutory warrant provision addresses a defendant who has not yet been:',['Arraigned','Convicted','Sentenced','Called as a witness'],'Arraigned','Focus on the defendant’s procedural status.','CPL § 120.20(1) concerns a qualifying filing against an unarraigned defendant.'),
        q(2,'The filed instrument is insufficient and the defect cannot be cured. What follows under this rule?',['Dismissal rather than issuance of the warrant','Automatic conviction','A warrant despite the defect','Immediate sentence'],'Dismissal rather than issuance of the warrant','An uncured defect blocks the warrant.','The statute requires dismissal when the insufficiency cannot be cured.'),
        q(2,'TRUE or FALSE: A defendant’s failure to appear can by itself cure a facially insufficient instrument.',['True','False'],'False','Absence and sufficiency are separate issues.','False. The instrument must satisfy the statutory sufficiency requirement.', 'tf'),
        q(3,'Which sequence correctly applies CPL § 120.20(1)?',['Filing → sufficiency review → warrant may issue','Absence → automatic warrant → filing later','Arrest → sentence → filing','Investigation → conviction → warrant'],'Filing → sufficiency review → warrant may issue','Keep the legal prerequisites in order.','A qualifying filing and facial sufficiency precede discretionary warrant issuance.')
      ]
    }),
    card({
      id:'qr_cpl_028_grand_jury_numbers', art:'s4_jury_juggler', series:4, number:6, name:'Jury Juggler', category:'GRAND JURY PROCEDURE', emoji:'⚪', law:'CPL', section:'190.25', cite:'CPL § 190.25(1)', hook:'Sixteen in, twelve agree',
      summary:'At least sixteen grand jurors must be present, and at least twelve must concur for an indictment or another official grand-jury action.',
      context:'Presence and concurrence are separate requirements with different numbers.', example:'Sixteen attend and twelve vote for official action.',
      panel:{kind:'clock',caption:'Grand-jury numbers',steps:[{n:'16',label:'PRESENT',from:'minimum quorum'},{n:'12',label:'CONCUR',from:'minimum for official action'}]},
      bank:[
        q(1,'How many grand jurors must be present at minimum?',['Sixteen','Twelve','Twenty-three','Eight'],'Sixteen','This is the quorum number.','CPL § 190.25(1) requires at least sixteen present.'),
        q(1,'How many grand jurors must concur for an indictment or other official action?',['Twelve','Sixteen','All who are present','Nine'],'Twelve','This is the agreement number.','At least twelve must concur.'),
        q(2,'Sixteen grand jurors are present, but only eleven concur. Is the concurrence requirement met?',['No, at least twelve must concur','Yes, sixteen were present','Yes, a simple majority of sixteen is enough','Yes, presence and concurrence are identical'],'No, at least twelve must concur','Check each number independently.','The quorum is met, but official action still needs twelve concurring jurors.'),
        q(2,'Twelve grand jurors attend and all twelve agree. What is missing?',['The minimum presence of sixteen','Nothing; twelve is enough for both rules','A unanimous twenty-three','A sentencing judge'],'The minimum presence of sixteen','Agreement does not replace quorum.','Sixteen must be present even though twelve concurrence is the voting threshold.'),
        q(3,'Which shorthand accurately captures CPL § 190.25(1)?',['16 present; 12 concur','12 present; 16 concur','16 present; all 16 concur','23 present; 23 concur'],'16 present; 12 concur','Keep quorum and concurrence in order.','The two statutory minimums are sixteen for presence and twelve for concurrence.')
      ]
    }),
    card({
      id:'qr_cpl_033_pleas', art:'s4_plea_piper', series:4, number:7, name:'Plea Piper', category:'INDICTMENTS & PLEAS', emoji:'🗣️', law:'CPL', section:'220.10', cite:'CPL § 220.10', hook:'Whole differs from partial',
      summary:'A defendant may plead not guilty as of right and may plead guilty to the entire indictment as provided by statute; a plea to part of the indictment or a lesser included offense requires the court’s permission and the People’s consent.',
      context:'Partial and lesser pleas are negotiated dispositions, not unilateral choices.', example:'A plea to one count while other counts remain needs the required approvals.',
      panel:{kind:'diff',caption:'Pleas to an indictment',heads:['AS OF RIGHT / WHOLE','PARTIAL OR LESSER'],yes:['NOT GUILTY','GUILTY TO ENTIRE INDICTMENT'],no:['COURT PERMISSION','PEOPLE CONSENT']},
      bank:[
        q(1,'Which plea is available to a defendant as of right?',['Not guilty','Guilty to any chosen lesser offense','Guilty to one count with all others dismissed','A plea selected by the clerk'],'Not guilty','No negotiation is needed for this plea.','CPL § 220.10 makes a not-guilty plea available as of right.'),
        q(1,'A plea to part of an indictment generally requires whose approval?',['The court’s permission and the People’s consent','Only the defendant’s signature','Only the clerk’s approval','The jury’s consent'],'The court’s permission and the People’s consent','Two approvals matter.','Partial or lesser pleas require both the court and prosecution roles specified by statute.'),
        q(2,'A defendant wants to plead guilty to one count while leaving the rest unresolved. Which description fits?',['A partial plea requiring the statutory approvals','A not-guilty plea as of right','An automatic dismissal','A jury verdict'],'A partial plea requiring the statutory approvals','Whole differs from partial.','The defendant cannot unilaterally select a partial disposition.'),
        q(2,'TRUE or FALSE: A defendant can always force acceptance of a plea to a lesser included offense.',['True','False'],'False','Lesser pleas are not unilateral.','False. The court’s permission and the People’s consent are required.', 'tf'),
        q(3,'Which choice best distinguishes a whole-indictment guilty plea from a partial plea?',['The partial plea adds court permission and People’s consent','The whole plea always requires a jury vote','The partial plea is entered only after sentence','There is no statutory distinction'],'The partial plea adds court permission and People’s consent','Focus on the additional approvals.','CPL § 220.10 treats a negotiated partial or lesser plea differently.')
      ]
    }),
    card({
      id:'qr_cpl_034_jury_trial_order', art:'s4_trial_track', series:4, number:8, name:'Trial Track', category:'TRIAL PROCEDURE', emoji:'🎼', law:'CPL', section:'260.30', cite:'CPL § 260.30', hook:'People open first; defense sums first',
      summary:'The statutory sequence places the People’s opening before the defense opening, but places the defense summation before the People’s summation.',
      context:'Evidence, rebuttal, the court’s charge, deliberation, and verdict occupy their listed positions in the statutory order.', example:'At summation, the defense speaks before the People.',
      panel:{kind:'trigger',caption:'Two anchors in trial order',steps:['PEOPLE OPEN FIRST','EVIDENCE AND REBUTTAL','DEFENSE SUMS FIRST','COURT CHARGES JURY']},
      bank:[
        q(1,'Who gives the first opening statement in the statutory jury-trial order?',['The People','The defense','The clerk','The jury foreperson'],'The People','Openings and summations run in different orders.','CPL § 260.30 places the People’s opening before the defense opening.'),
        q(1,'Who gives the first summation?',['The defense','The People','The judge','The clerk'],'The defense','The People speak last at summation.','The defense summation precedes the People’s summation.'),
        q(2,'Which sequence is correct?',['People’s opening before defense opening; defense summation before People’s summation','Defense opens first and People sum first','People open first and People sum first','Defense opens first and defense sums second'],'People’s opening before defense opening; defense summation before People’s summation','Use both anchors.','The order reverses between openings and summations.'),
        q(2,'TRUE or FALSE: The court’s charge comes before jury deliberation.',['True','False'],'True','The jury needs legal instructions before deliberating.','True. The statutory order places the charge before deliberation.', 'tf'),
        q(3,'Counsel asks who speaks last before the court’s charge. Under the ordinary statutory sequence, who is it?',['The People, in summation','The defense, in opening','The jury foreperson','The clerk'],'The People, in summation','Defense sums first.','The People’s summation follows the defense summation, before the court charges the jury.')
      ]
    }),
    card({
      id:'qr_cpl_039_jury_notes', art:'s4_note_ninja', series:4, number:9, name:'Note Ninja', category:'JURY DELIBERATIONS', emoji:'✉️', law:'CPL', section:'310.30', cite:'CPL § 310.30', hook:'Notice, presence, response',
      summary:'When a deliberating jury requests information or instruction, the court must return the jury to the courtroom and, after notice to both sides and in the defendant’s presence, give the response it deems proper.',
      context:'With consent and a qualifying jury request, the court may provide statutory text; this card intentionally omits unverified case-law glosses.', example:'Both sides receive notice before the court answers the jury in the defendant’s presence.',
      panel:{kind:'trigger',caption:'Responding to a jury note',steps:['JURY REQUEST','NOTICE TO BOTH SIDES','RETURN TO COURTROOM','RESPONSE IN DEFENDANT’S PRESENCE']},
      bank:[
        q(1,'What must the court do with the jury before answering its request?',['Return the jury to the courtroom','Send an answer through the foreperson privately','Dismiss the jury','Ask the clerk to decide'],'Return the jury to the courtroom','The response is made in court.','CPL § 310.30 requires the jury to return to the courtroom.'),
        q(1,'Who receives notice before the court responds?',['Both sides','Only the prosecutor','Only the foreperson','Only court staff'],'Both sides','Notice is adversarial, not one-sided.','The statute requires notice to the People and counsel for the defendant.'),
        q(2,'A judge plans to answer a jury note in open court after notice to both sides, but while the defendant is absent. Which required feature is missing?',['The defendant’s presence','The jury’s return to the courtroom','Notice to both sides','A proper response to the request'],'The defendant’s presence','The scenario already supplies the other statutory steps.','The response is given in the defendant’s presence after notice.'),
        q(2,'TRUE or FALSE: The court may answer a deliberating jury’s legal question by a private message with no notice to counsel.',['True','False'],'False','Notice and an in-court response are required.','False. CPL § 310.30 requires notice and return of the jury to the courtroom.', 'tf'),
        q(3,'Which sequence best matches the statutory response process?',['Notice both sides → return jury → respond in defendant’s presence','Respond privately → notify later','Dismiss jury → arraign again','Notify prosecutor only → send clerk’s answer'],'Notice both sides → return jury → respond in defendant’s presence','Notice, presence, response.','The sequence preserves notice, courtroom return, and defendant presence.')
      ]
    }),
    card({
      id:'qr_cpl_041_set_aside_verdict', art:'s4_verdict_vex', series:4, number:10, name:'Verdict Vex', category:'POST-TRIAL REMEDIES', emoji:'↩️', law:'CPL', section:'330.30', cite:'CPL § 330.30', hook:'Verdict to sentence window',
      summary:'After verdict and before sentence, the defendant may move to set aside the verdict on the statute’s three grounds: appeal-level legal error, specified outside-court juror misconduct, or qualifying newly discovered evidence.',
      context:'The CPL § 330.30 timing window closes when sentence is imposed; other remedies govern afterward.', example:'Qualifying newly discovered evidence must satisfy the statute’s diligence and probable-effect requirements.',
      panel:{kind:'trigger',caption:'CPL § 330.30 window',steps:['VERDICT','DEFENDANT MOVES ON A STATUTORY GROUND','BEFORE SENTENCE']},
      bank:[
        q(1,'Who may make the CPL § 330.30 motion described here?',['The defendant','The People','The trial court on its own motion','Either party'],'The defendant','The remedy follows a verdict against the defendant.','The statute authorizes the defendant to move to set aside the verdict.'),
        q(1,'When is the motion made?',['After verdict and before sentence','Before arraignment','Only after sentence','Before the jury is selected'],'After verdict and before sentence','The hook names both endpoints.','CPL § 330.30 operates in the verdict-to-sentence window.'),
        q(2,'Which is one statutory ground for the motion?',['Qualifying newly discovered evidence','A preference for a different judge','A routine scheduling conflict','A request to change venue before trial'],'Qualifying newly discovered evidence','The grounds are limited.','Qualifying newly discovered evidence is one of the three statutory categories.'),
        q(2,'TRUE or FALSE: A CPL § 330.30 motion may be filed for any reason the defendant considers unfair.',['True','False'],'False','The statute lists defined grounds.','False. The motion must rest on one of the statutory grounds.', 'tf'),
        q(3,'Sentence has already been imposed. What is the key CPL § 330.30 problem?',['Its statutory timing window has closed','The verdict never existed','The jury must reconvene automatically','The prosecutor must file the motion'],'Its statutory timing window has closed','The endpoint is sentence.','After sentence, remedies other than this pre-sentence motion must be considered.')
      ]
    }),
    card({
      id:'qr_cpl_045_sentence_timing', art:'s4_sentence_sprint', series:4, number:11, name:'Sentence Sprint', category:'SENTENCING', emoji:'🏃', law:'CPL', section:'380.30', cite:'CPL § 380.30(1)', hook:'No unreasonable delay',
      summary:'Sentence must be pronounced without unreasonable delay.',
      context:'The statute supplies a reasonableness rule rather than one universal fixed number of days.', example:'A scheduling delay is evaluated for reasonableness under the circumstances.',
      panel:{kind:'trigger',caption:'Pronouncing sentence',steps:['CONVICTION OR PLEA','ASSESS THE CIRCUMSTANCES','NO UNREASONABLE DELAY']},
      bank:[
        q(1,'What timing rule does CPL § 380.30(1) state for pronouncing sentence?',['Without unreasonable delay','Always within ten days','Always within thirty days','Only when the prosecutor requests it'],'Without unreasonable delay','The statute uses a standard, not one number.','Sentence must be pronounced without unreasonable delay.'),
        q(1,'TRUE or FALSE: CPL § 380.30(1) imposes the same fixed day count in every case.',['True','False'],'False','Reasonableness depends on circumstances.','False. The provision does not establish one universal number of days.', 'tf'),
        q(2,'A clerk is asked whether a delay violates the statute. What is the right first question?',['Whether the delay is unreasonable in the circumstances','Whether ten court days have passed','Whether thirty calendar days have passed','Whether ninety days have passed'],'Whether the delay is unreasonable in the circumstances','Use the statutory standard instead of selecting an invented fixed period.','The controlling inquiry is unreasonable delay, not a universal day count.'),
        q(2,'Which statement best describes the rule?',['A flexible reasonableness standard governs','Sentence may be postponed indefinitely','Every delay automatically voids the conviction','Only the defendant controls the date'],'A flexible reasonableness standard governs','Avoid turning the standard into an automatic number.','CPL § 380.30(1) requires promptness measured by reasonableness.'),
        q(3,'A study guide states “sentence must always occur within 20 days.” What is the best correction?',['The statute says without unreasonable delay, not a universal 20-day limit','The correct number is always 60 days','There is never any timing rule','Only misdemeanors may be sentenced'],'The statute says without unreasonable delay, not a universal 20-day limit','Use the statute’s actual wording.','The supplied official text supports a reasonableness standard rather than that fixed number.')
      ]
    }),
    card({
      id:'qr_cpl_063_order_examination', art:'s4_exam_duo', series:4, number:12, name:'Exam Duo', category:'FITNESS & EXAMINATIONS', emoji:'👓', law:'CPL', section:'730.30', cite:'CPL § 730.30(1)', hook:'Concern triggers examination',
      summary:'When the court believes a defendant may be incapacitated, it must issue an order of examination during the procedural windows stated in the statute.',
      context:'The examination is performed by two qualified psychiatric examiners, subject to article 730 procedures.', example:'The court need not wait for proof of incapacity before ordering the examination.',
      panel:{kind:'trigger',caption:'Fitness examination',steps:['COURT BELIEVES INCAPACITY MAY EXIST','ORDER OF EXAMINATION','TWO QUALIFIED EXAMINERS']},
      bank:[
        q(1,'What triggers the court’s duty to issue an order of examination?',['A belief that the defendant may be incapacitated','Conclusive proof that the defendant is incapacitated','A defense request in every criminal case','A post-sentence claim of legal error'],'A belief that the defendant may be incapacitated','The court need not wait for certainty.','The statute acts on a belief that incapacity may exist.'),
        q(1,'How many qualified psychiatric examiners perform the examination described in the source notes?',['Two','One','Three','Twelve'],'Two','Think Exam Duo.','Article 730 procedure uses two qualified psychiatric examiners.'),
        q(2,'TRUE or FALSE: The court must wait until incapacity is conclusively proved before ordering an examination.',['True','False'],'False','The order investigates the concern.','False. A belief that the defendant may be incapacitated triggers the order.', 'tf'),
        q(2,'A judge sees facts suggesting the defendant may not be fit. What is the statutory next step?',['Issue an order of examination within the applicable procedural window','Sentence immediately','Dismiss every charge automatically','Ask the jury to decide fitness'],'Issue an order of examination within the applicable procedural window','Concern triggers examination.','CPL § 730.30(1) calls for an examination order when the concern arises.'),
        q(3,'Which sequence best states the rule?',['Possible incapacity → court order → examination by two qualified examiners','Conviction → automatic dismissal → one examiner','Jury note → private response → sentence','Arrest → indictment → civil trial'],'Possible incapacity → court order → examination by two qualified examiners','Follow the panel.','The procedure moves from judicial concern to an order and a two-examiner evaluation.')
      ]
    }),

    card({
      id:'qr_pl_064_offense_grades', art:'s5_offense_oracle', series:5, number:1, name:'Offense Oracle', category:'OFFENSE DEFINITIONS', emoji:'📏', law:'PL', section:'10.00', cite:'PL § 10.00(1)-(6)', hook:'Fifteen days, one year',
      summary:'An offense is conduct for which imprisonment or a fine is authorized; a violation carries no more than fifteen days, a misdemeanor more than fifteen days but no more than one year, and a felony more than one year. A crime is a misdemeanor or felony.',
      context:'Traffic infractions and violations are offenses but are not crimes.', example:'A maximum six-month jail term falls within misdemeanor territory.',
      panel:{kind:'clock',caption:'Maximum authorized imprisonment',steps:[{n:'≤15',label:'DAYS: VIOLATION',from:'not a crime'},{n:'>15–1',label:'YEAR: MISDEMEANOR',from:'a crime'},{n:'>1',label:'YEAR: FELONY',from:'a crime'}]},
      bank:[
        q(1,'Which categories are “crimes” under PL § 10.00?',['Misdemeanors and felonies','Violations and traffic infractions','Only felonies','Every offense'],'Misdemeanors and felonies','Crime is narrower than offense.','The definition of crime includes misdemeanors and felonies.'),
        q(1,'An offense authorizes no more than fifteen days of imprisonment. Which grade fits?',['Violation','Misdemeanor','Felony','Crime of any grade'],'Violation','Fifteen days is the first boundary.','A violation carries no more than fifteen days under the definition.'),
        q(2,'An offense authorizes a maximum six-month jail term. Which category fits?',['Misdemeanor','Violation','Felony','Traffic infraction automatically'],'Misdemeanor','Six months is over 15 days but not over one year.','That authorized term falls within misdemeanor territory.'),
        q(2,'TRUE or FALSE: Every offense is a crime.',['True','False'],'False','Violations are offenses but not crimes.','False. “Offense” is broader; a crime is specifically a misdemeanor or felony.', 'tf'),
        q(3,'An offense authorizes imprisonment exceeding one year. What is it under the general definition?',['Felony','Misdemeanor','Violation','Petty offense only'],'Felony','Cross the one-year boundary.','A felony is an offense for which more than one year may be imposed.')
      ]
    }),
    card({
      id:'qr_pl_065_person', art:'s5_the_many', series:5, number:2, name:'The Many', category:'PENAL LAW DEFINITIONS', emoji:'👥', law:'PL', section:'10.00', cite:'PL § 10.00(7)', hook:'People and entities',
      summary:'“Person” means a human being and, where appropriate, the organizations and governmental entities specified in the statute.',
      context:'A human being is always within the definition; whether an organization is included depends on context.', example:'A corporation can be a statutory person where the provision appropriately applies.',
      panel:{kind:'diff',caption:'Who can be a person?',heads:['ALWAYS','WHERE APPROPRIATE'],yes:['HUMAN BEING'],no:['PUBLIC OR PRIVATE CORPORATION','UNINCORPORATED ASSOCIATION','GOVERNMENT / INSTRUMENTALITY']},
      bank:[
        q(1,'Who is always included in the Penal Law definition of “person”?',['A human being','Only a corporation','Only a government agency','Only an unincorporated association'],'A human being','Start with the unconditional part.','PL § 10.00(7) includes a human being.'),
        q(1,'Can an organization fall within the definition of “person”?',['Yes, where appropriate under the statutory definition','No, never','Only after a jury vote','Only in civil actions'],'Yes, where appropriate under the statutory definition','The definition extends beyond humans in context.','Specified organizations and governmental entities may qualify where appropriate.'),
        q(2,'A statute applies to a corporation in a context where the organizational definition is appropriate. Is “person” necessarily limited to an individual?',['No, the corporation may be a person','Yes, person always excludes entities','Yes, unless it has one shareholder','No, but only a court clerk counts'],'No, the corporation may be a person','Context controls the organizational branch.','The definition can include a public or private corporation where appropriate.'),
        q(2,'TRUE or FALSE: Every use of “person” automatically includes every listed type of organization without regard to context.',['True','False'],'False','The statute says “where appropriate.”','False. Context determines use of the organizational portion.', 'tf'),
        q(3,'Which reading best matches PL § 10.00(7)?',['Human beings are included; specified entities may be included where appropriate','Only natural persons can ever qualify','Only corporations can qualify','The word has no statutory definition'],'Human beings are included; specified entities may be included where appropriate','Keep both halves of the definition.','That formulation preserves the unconditional human and contextual entity components.')
      ]
    }),
    card({
      id:'qr_pl_066_classifications', art:'s5_captain_classify', series:5, number:3, name:'Captain Classify', category:'OFFENSE CLASSIFICATION', emoji:'🛡️', law:'PL', section:'55.05', cite:'PL § 55.05', hook:'A–E; A, B, unclassified',
      summary:'Felonies have classes A through E, with class A divided into A-I and A-II. Misdemeanors have three categories: class A, class B, and unclassified.',
      context:'Unclassified misdemeanor is the third statutory misdemeanor category; there is no class C misdemeanor in this list.', example:'An expressly unclassified misdemeanor belongs to the third misdemeanor category.',
      panel:{kind:'diff',caption:'Classification categories',heads:['FELONIES','MISDEMEANORS'],yes:['A (A-I / A-II)','B, C, D, E'],no:['CLASS A','CLASS B','UNCLASSIFIED']},
      bank:[
        q(1,'Which list gives all three misdemeanor categories in PL § 55.05?',['Class A, class B, and unclassified','Class A, class B, and class C','Class A through class E','A-I and A-II only'],'Class A, class B, and unclassified','The third category has no letter.','The statute lists class A, class B, and unclassified misdemeanors.'),
        q(1,'Felony classes run from:',['A through E','A through C','A and B only','A through F'],'A through E','There are five letter categories.','PL § 55.05 classifies felonies as A, B, C, D, and E.'),
        q(2,'How is class A felony further divided for sentencing classification?',['A-I and A-II','A-1 and A-2 misdemeanors','Violent and nonviolent only','Class A and unclassified'],'A-I and A-II','The statute uses Roman numerals.','Class A felonies are subclassified as A-I and A-II.'),
        q(2,'TRUE or FALSE: PL § 55.05 recognizes a class C misdemeanor.',['True','False'],'False','The third misdemeanor category is unclassified.','False. The listed misdemeanor categories are A, B, and unclassified.', 'tf'),
        q(3,'A record says “unclassified misdemeanor.” How should it be treated under § 55.05?',['As a valid third misdemeanor category','As a class C misdemeanor','As a felony','As a violation automatically'],'As a valid third misdemeanor category','Do not invent a letter class.','Unclassified misdemeanor is expressly part of the classification scheme.')
      ]
    }),
    card({
      id:'qr_pl_067_designation', art:'s5_class_shift', series:5, number:4, name:'Class Shift', category:'OUTSIDE-LAW OFFENSES', emoji:'🔀', law:'PL', section:'55.10', cite:'PL § 55.10', hook:'Designation and sentence are different paths',
      summary:'Outside the Penal Law, an unspecified felony class or an offense authorizing more than one year is generally a class E felony. A misdemeanor designation with no class or sentence is class A; an outside-law offense authorizing over fifteen days through one year is generally an unclassified misdemeanor.',
      context:'Subdivision 3 and the traffic-infraction rule contain exceptions, so the relevant paragraph must be checked before assigning a class.', example:'An outside-law offense labeled misdemeanor with no class or sentence generally defaults to class A.',
      panel:{kind:'trigger',caption:'Classifying an outside-law offense',steps:['READ ITS DESIGNATION','READ ITS AUTHORIZED SENTENCE','CHECK § 55.10 EXCEPTIONS','ASSIGN THE RESULT']},
      bank:[
        q(1,'An outside-Penal-Law offense is declared a felony but no class is specified. What is the general default?',['Class E felony','Class A felony','Unclassified misdemeanor','Violation'],'Class E felony','Use the outside-law felony default.','PL § 55.10 generally treats an unspecified outside-law felony as class E.'),
        q(1,'An outside-law offense is declared a misdemeanor with no class and no sentence specified. What is the general default?',['Class A misdemeanor','Class B misdemeanor','Unclassified misdemeanor','Class E felony'],'Class A misdemeanor','Designation alone controls this branch.','The statute generally deems that offense a class A misdemeanor.'),
        q(2,'An outside-law offense authorizes over fifteen days but no more than one year and falls under the sentence-based rule. What is it generally?',['Unclassified misdemeanor','Class A misdemeanor automatically','Class B misdemeanor automatically','Class E felony'],'Unclassified misdemeanor','Sentence-defined differs from designation-only.','The general sentence-based classification is unclassified misdemeanor.'),
        q(2,'TRUE or FALSE: A traffic infraction becomes a misdemeanor merely because of the sentence otherwise described in § 55.10.',['True','False'],'False','The statute protects the traffic-infraction designation.','False. The traffic-infraction paragraph prevents that reclassification.', 'tf'),
        q(3,'What is the safest classification workflow for an outside-law offense?',['Check its label, authorized sentence, and the statutory exceptions','Always call it class A','Always call it unclassified','Use the offense name alone'],'Check its label, authorized sentence, and the statutory exceptions','Different paragraphs use different facts.','PL § 55.10 requires attention to designation, sentence, and exceptions.')
      ]
    }),
    card({
      id:'qr_pl_068_felony_fines', art:'s5_double_gain', series:5, number:5, name:'Double Gain', category:'FELONY FINES', emoji:'🪙', law:'PL', section:'80.00', cite:'PL § 80.00', hook:'General rule, then special ceiling',
      summary:'For an individual, the general felony fine may not exceed the higher of five thousand dollars or double the defendant’s gain, while the section supplies special alternatives for article 496 and listed drug felonies.',
      context:'The applicable subdivision must be selected before choosing a ceiling; the section does not apply to corporations.', example:'If double the gain exceeds five thousand dollars and the gain finding is supported, the higher alternative may govern.',
      panel:{kind:'diff',caption:'General individual felony route',heads:['BASELINE','ALTERNATIVES'],yes:['$5,000'],no:['DOUBLE GAIN','ARTICLE 496 TRIPLE GAIN','LISTED DRUG SCHEDULE']},
      bank:[
        q(1,'For an individual, what is the ordinary fixed-dollar route in PL § 80.00?',['Five thousand dollars','One thousand dollars','Five hundred dollars','Two hundred fifty dollars'],'Five thousand dollars','This is the general felony figure.','The general felony provision includes a $5,000 route.'),
        q(1,'What gain-based alternative generally appears beside the $5,000 route?',['Double the defendant’s gain','Half the defendant’s gain','Exactly the victim’s loss in every case','No gain-based alternative'],'Double the defendant’s gain','Think Double Gain.','The general alternative is double the defendant’s gain, when applicable.'),
        q(2,'The evidence supports gain of $4,000 and no special offense schedule applies. Which figure is higher?',['Double gain: $8,000','Fixed route: $5,000','Class A misdemeanor ceiling: $1,000','Violation ceiling: $250'],'Double gain: $8,000','Compare $5,000 with twice $4,000.','Twice the gain is $8,000, higher than the general fixed-dollar route.'),
        q(2,'TRUE or FALSE: The $5,000 figure is the only possible felony fine ceiling under § 80.00.',['True','False'],'False','The statute has gain and offense-specific alternatives.','False. Other subdivisions and alternatives may supply a higher ceiling.', 'tf'),
        q(3,'Before selecting a felony fine ceiling, what should the clerk identify?',['The applicable subdivision and any special offense route','The $5,000 route without checking gain','The double-gain route in every felony','The misdemeanor ceiling for the closest lower grade'],'The applicable subdivision and any special offense route','General rule, then special ceiling.','The statute’s gain, article 496, drug-felony, and other provisions must be distinguished.')
      ]
    }),
    card({
      id:'qr_pl_069_nonfelony_fines', art:'s5_fine_collector', series:5, number:6, name:'The Fine Collector', category:'NONFELONY FINES', emoji:'🧾', law:'PL', section:'80.05', cite:'PL § 80.05', hook:'One thousand, five hundred, two fifty',
      summary:'For an individual, the general maximums are one thousand dollars for a class A misdemeanor, five hundred dollars for class B, and two hundred fifty dollars for a violation, with separate rules for unclassified misdemeanors and gain-based alternatives.',
      context:'An unclassified misdemeanor does not automatically use the class A ceiling; consult the defining law and § 80.05.', example:'A class B misdemeanor ordinarily uses the $500 general maximum, subject to statutory alternatives.',
      panel:{kind:'clock',caption:'General nonfelony maximums',steps:[{n:'$1,000',label:'CLASS A MISD.',from:'general individual maximum'},{n:'$500',label:'CLASS B MISD.',from:'general individual maximum'},{n:'$250',label:'VIOLATION',from:'general individual maximum'}]},
      bank:[
        q(1,'What is the general maximum fine for an individual convicted of a class A misdemeanor?',['$1,000','$500','$250','$5,000'],'$1,000','Use the first amount in the hook.','PL § 80.05 generally caps a class A misdemeanor at $1,000.'),
        q(1,'What is the general maximum for a class B misdemeanor?',['$500','$1,000','$250','$5,000'],'$500','Use the middle amount.','The general class B misdemeanor maximum is $500.'),
        q(2,'What is the general maximum fine for a violation?',['$250','$500','$1,000','$5,000'],'$250','Use the last amount.','The general violation maximum is $250, subject to the statute’s outside-law rule.'),
        q(2,'TRUE or FALSE: Every unclassified misdemeanor automatically uses the $1,000 class A ceiling.',['True','False'],'False','Unclassified misdemeanors have a separate rule.','False. The defining law or ordinance governs the fine for an unclassified misdemeanor.', 'tf'),
        q(3,'A defendant gained money through a misdemeanor. What additional route should be checked?',['The alternative fine based on up to double gain','The felony drug schedule only','An automatic $5,000 fine','A jury-set civil award'],'The alternative fine based on up to double gain','The general class amount may not be the only route.','Subdivision 5 provides a gain-based alternative for a misdemeanor or violation.')
      ]
    }),
    card({
      id:'s5_concept_minor_mischief', art:'s5_minor_mischief', series:5, number:7, name:'Minor Mischief', category:'VIOLATIONS', emoji:'⏱️', law:'PL', section:'10.00', cite:'PL § 10.00(1)–(3)', hook:'Offense, but not crime',
      summary:'A violation is an offense, other than a traffic infraction, for which no more than fifteen days of imprisonment is authorized; it is not a crime.',
      context:'The authorized maximum, not the conduct’s nickname, supplies the general definition.', example:'An offense with a maximum of ten days is in violation territory under the general definition.',
      panel:{kind:'diff',caption:'Violation',heads:['IT IS','IT IS NOT'],yes:['AN OFFENSE','≤15 DAYS AUTHORIZED'],no:['A CRIME','A MISDEMEANOR']},
      bank:[
        q(1,'Under the general definition, the maximum authorized imprisonment for a violation is:',['No more than fifteen days','Exactly thirty days','More than one year','No more than one year'],'No more than fifteen days','The boundary is fifteen days.','A violation authorizes no more than fifteen days of imprisonment.'),
        q(1,'Is a violation a “crime” under PL § 10.00?',['No','Yes, always','Only if a fine is imposed','Only after arraignment'],'No','Crime means misdemeanor or felony.','A violation is an offense but not a crime.'),
        q(2,'An offense authorizes at most ten days in jail. Which general category fits?',['Violation','Misdemeanor','Felony','Class E felony'],'Violation','Ten days is within the fifteen-day ceiling.','The authorized maximum places it within the violation definition.'),
        q(2,'TRUE or FALSE: Calling conduct “minor” is enough to classify it as a violation.',['True','False'],'False','Use the statutory authorization.','False. Classification follows the statutory definition, not an informal label.', 'tf'),
        q(3,'Which statement is most precise?',['A violation is an offense outside the definition of crime','A violation is a class C misdemeanor','Every offense is a crime','A violation authorizes more than one year'],'A violation is an offense outside the definition of crime','Keep offense and crime distinct.','PL § 10.00 defines crime as misdemeanor or felony, excluding violations.')
      ]
    }),
    card({
      id:'s5_concept_split_verdict', art:'s5_split_verdict', series:5, number:8, name:'Split Verdict', category:'MISDEMEANORS', emoji:'⚖️', law:'PL', section:'55.05', cite:'PL §§ 10.00(4), 55.05(2)', hook:'Range first; class second',
      summary:'A misdemeanor generally authorizes more than fifteen days but no more than one year of imprisonment; its classification is class A, class B, or unclassified.',
      context:'The grade definition and the classification list answer different questions and should not be collapsed.', example:'A six-month maximum supports misdemeanor grade; the defining law determines its class.',
      panel:{kind:'trigger',caption:'Classifying a misdemeanor',steps:['CONFIRM >15 DAYS AND ≤1 YEAR','READ THE DEFINING LAW','A, B, OR UNCLASSIFIED']},
      bank:[
        q(1,'Which authorized-imprisonment range generally defines a misdemeanor?',['More than fifteen days but no more than one year','No more than fifteen days','More than one year','Exactly five years'],'More than fifteen days but no more than one year','Use both boundary points.','PL § 10.00 places misdemeanors between violations and felonies.'),
        q(1,'Which is a valid misdemeanor classification?',['Unclassified','Class C','Class D','A-II'],'Unclassified','The third category has no letter.','PL § 55.05 lists class A, class B, and unclassified.'),
        q(2,'An offense has a six-month maximum. What does that fact establish under the general definition?',['Misdemeanor grade','Its exact class is automatically B','Felony grade','Violation grade'],'Misdemeanor grade','The sentence range gives the grade, not always the class.','Six months falls in misdemeanor territory; the defining law supplies the classification.'),
        q(2,'TRUE or FALSE: Every misdemeanor must be either class A or class B.',['True','False'],'False','Remember the third category.','False. Unclassified misdemeanor is also a statutory category.', 'tf'),
        q(3,'Which method avoids mixing grade with class?',['Use the authorized range to identify misdemeanor, then read the law for A, B, or unclassified','Call every misdemeanor class A','Use the offense name to invent a class','Treat six months as a violation'],'Use the authorized range to identify misdemeanor, then read the law for A, B, or unclassified','Range first; class second.','The two statutes provide related but distinct classification steps.')
      ]
    }),
    card({
      id:'s5_concept_felony_titan', art:'s5_felony_titan', series:5, number:9, name:'Felony Titan', category:'FELONIES', emoji:'🔨', law:'PL', section:'55.05', cite:'PL §§ 10.00(5), 55.05(1)', hook:'Over one year; classes A–E',
      summary:'A felony is an offense for which more than one year of imprisonment may be imposed; felony classifications are A, B, C, D, and E.',
      context:'Class A is further divided into A-I and A-II for sentencing purposes.', example:'An offense authorizing a two-year maximum is felony territory even if no two-year sentence is ultimately imposed.',
      panel:{kind:'trigger',caption:'Felony framework',steps:['MORE THAN ONE YEAR AUTHORIZED','CLASS A, B, C, D, OR E','IF CLASS A: A-I OR A-II']},
      bank:[
        q(1,'What authorized term marks felony territory under the general definition?',['More than one year','More than fifteen days only','No more than fifteen days','Exactly one year or less'],'More than one year','Cross the one-year line.','A felony permits imprisonment exceeding one year.'),
        q(1,'Which is the lowest lettered felony class in § 55.05?',['Class E','Class D','Class B','Unclassified'],'Class E','The list runs A through E.','The felony classes are A, B, C, D, and E.'),
        q(2,'An offense authorizes up to two years, though the actual sentence may be shorter. What is its general grade?',['Felony','Misdemeanor','Violation','Traffic infraction necessarily'],'Felony','Classification uses what may be imposed.','The authorized maximum exceeds one year.'),
        q(2,'TRUE or FALSE: Class A felonies are subdivided into A-I and A-II.',['True','False'],'True','These are the two ace categories.','True. PL § 55.05 creates the A-I and A-II subclasses.', 'tf'),
        q(3,'Which statement correctly combines definition and classification?',['More than one year identifies felony grade; the statute then assigns A through E','Every felony is class A','A one-year maximum is always a felony','Felonies have A, B, and unclassified categories'],'More than one year identifies felony grade; the statute then assigns A through E','Use grade, then class.','PL §§ 10.00 and 55.05 supply those two parts of the framework.')
      ]
    }),
    card({
      id:'s5_concept_the_aces', art:'s5_the_aces', series:5, number:10, name:'The Aces', category:'CLASS A FELONIES', emoji:'🅰️', law:'PL', section:'55.05', cite:'PL § 55.05(1)', hook:'Class A splits in two',
      summary:'For sentencing classification, class A felonies are subdivided into class A-I and class A-II.',
      context:'A-I and A-II are felony subclasses; they are not misdemeanor categories and they do not create additional lettered felony classes.', example:'A statute designating an offense A-II places it within class A, subclass II.',
      panel:{kind:'diff',caption:'Class A felony subclasses',heads:['A-I','A-II'],yes:['CLASS A','SUBCLASS I'],no:['CLASS A','SUBCLASS II']},
      bank:[
        q(1,'What are the two class A felony subclasses?',['A-I and A-II','A and B','A-III and A-IV','Class A and unclassified'],'A-I and A-II','Two aces, Roman numerals.','PL § 55.05 divides class A into A-I and A-II.'),
        q(1,'The A-I/A-II split exists for what stated purpose?',['Sentencing classification','Grand-jury quorum','Civil filing','Jury-note procedure'],'Sentencing classification','Read the purpose clause.','The statute classifies and subclassifies felonies for sentence.'),
        q(2,'An offense is designated A-II. Which statement is correct?',['It is a class A felony, subclass II','It is a class B misdemeanor','It is unclassified','It is a violation'],'It is a class A felony, subclass II','The Roman numeral sits within class A.','A-II is one of the two class A felony subclasses.'),
        q(2,'TRUE or FALSE: A-I and A-II are misdemeanor classes.',['True','False'],'False','They belong to class A felonies.','False. Misdemeanors use class A, class B, and unclassified.', 'tf'),
        q(3,'Which statement preserves the structure of § 55.05?',['Felonies are A–E, and only class A splits into A-I and A-II','All felony classes split into I and II','Misdemeanors split into A-I and A-II','A-II is a separate letter class after E'],'Felonies are A–E, and only class A splits into A-I and A-II','Keep subclass within class A.','That is the classification structure stated by the statute.')
      ]
    }),
    card({
      id:'s5_concept_triple_take', art:'s5_triple_take', series:5, number:11, name:'Triple Take', category:'SPECIAL FELONY FINES', emoji:'🪙', law:'PL', section:'80.00', cite:'PL § 80.00(1)(b)', hook:'Article 496 can reach triple gain',
      summary:'For a felony defined in Penal Law article 496, the gain-based alternative may reach three times the defendant’s gain; the general gain alternative for other covered felonies is double gain.',
      context:'The triple-gain route is tied to the specified article 496 conviction and does not replace every other fine rule.', example:'For an article 496 felony with gain of $10,000, the gain multiplier route may reach $30,000.',
      panel:{kind:'diff',caption:'Gain multipliers',heads:['GENERAL GAIN ROUTE','ARTICLE 496'],yes:['UP TO 2× GAIN'],no:['UP TO 3× GAIN']},
      bank:[
        q(1,'Which convictions receive the special triple-gain language in PL § 80.00(1)(b)?',['Felonies defined in article 496','Every misdemeanor','Every class E felony','All violations'],'Felonies defined in article 496','The special route is article-specific.','The provision singles out crimes defined in article 496.'),
        q(1,'What is the general gain multiplier for covered felonies outside the special article 496 route?',['Double gain','Triple gain','Half gain','Four times gain'],'Double gain','Compare the ordinary and special multipliers.','The general alternative is twice the defendant’s gain.'),
        q(2,'An article 496 felony produced $10,000 in gain. What amount does the triple-gain route calculate?',['$30,000','$20,000','$10,000','$5,000'],'$30,000','Three times ten thousand.','The special multiplier produces $30,000 before other statutory issues are considered.'),
        q(2,'TRUE or FALSE: Every felony automatically uses triple gain.',['True','False'],'False','Triple gain is tied to article 496.','False. The general gain route is double, and special routes require their predicates.', 'tf'),
        q(3,'Which comparison is accurate?',['General covered felony: up to 2× gain; article 496 felony: up to 3× gain','Every felony: exactly 3× gain','Misdemeanor: 3× gain; felony: no gain route','Article 496: only the $5,000 route'],'General covered felony: up to 2× gain; article 496 felony: up to 3× gain','Keep the special rule narrow.','That comparison tracks the two gain alternatives in the official text.')
      ]
    }),
    card({
      id:'s5_concept_vault_voltage', art:'s5_vault_voltage', series:5, number:12, name:'Vault Voltage', category:'DRUG FELONY FINES', emoji:'⚡', law:'PL', section:'80.00', cite:'PL § 80.00(1)(c)', hook:'100, 50, 30, 15',
      summary:'For listed article 220 or 221 drug felonies, the special schedule is $100,000 for A-I, $50,000 for A-II, $30,000 for B, and $15,000 for C.',
      context:'The special schedule applies only to the listed drug-felony classes; the court must also consider the statutory factors, including gain, proportionality, victim impact, and economic circumstances.', example:'A listed class B drug felony has a special schedule amount of $30,000.',
      panel:{kind:'clock',caption:'Listed drug-felony schedule',steps:[{n:'$100K',label:'A-I',from:'listed article 220/221 felony'},{n:'$50K',label:'A-II',from:'listed article 220/221 felony'},{n:'$30K / $15K',label:'B / C',from:'listed article 220/221 felony'}]},
      bank:[
        q(1,'What is the special schedule amount for a listed class B drug felony?',['$30,000','$15,000','$50,000','$100,000'],'$30,000','Use 100, 50, 30, 15.','PL § 80.00(1)(c) lists $30,000 for class B.'),
        q(1,'What is the special schedule amount for a listed A-II drug felony?',['$50,000','$100,000','$30,000','$15,000'],'$50,000','A-II is the second figure.','The listed A-II amount is $50,000.'),
        q(2,'A listed class C article 220 felony is being sentenced. Which schedule amount matches?',['$15,000','$30,000','$50,000','$5,000 only'],'$15,000','C is the fourth listed class.','The special class C amount is $15,000.'),
        q(2,'TRUE or FALSE: The special schedule says A-I $100,000 and A-II $50,000.',['True','False'],'True','The A-I amount is twice the A-II amount.','True. Those are the first two figures in the schedule.', 'tf'),
        q(3,'Which factor does the statute tell the court to consider when using this special fine paragraph?',['The defendant’s economic circumstances','Only the statutory class, with no individual circumstances','The prosecutor’s requested multiplier as controlling','A mandatory presumption that the maximum is proportionate'],'The defendant’s economic circumstances','The schedule is not the only relevant text.','The statute directs consideration of economic circumstances, including ability to pay and effects on dependents.')
      ]
    })
  ];

  // Related rules extend the core character lesson without expanding the collection.
  const relatedRules = {
  "qr_cpl_001_criminal_action": {
    "cite": "CPL § 1.20",
    "notes": [
      "A criminal proceeding is broader than a criminal action: it may relate to a prospective, pending, or completed action.",
      "A judgment consists of the conviction and the sentence imposed on it."
    ],
    "qs": [
      [
        2,
        "Which term can include a court matter relating to a prospective criminal action?",
        [
          "Criminal proceeding",
          "Completed judgment",
          "Sentence only",
          "Conviction only"
        ],
        "Criminal proceeding",
        "Proceeding is the wider circle.",
        "CPL § 1.20 includes proceedings relating to prospective, pending, or completed criminal actions."
      ],
      [
        3,
        "A verdict has been returned, but no sentence imposed. What is still needed for the statutory judgment?",
        [
          "The sentence imposed on the conviction",
          "A second accusatory instrument",
          "A new grand jury",
          "A separate arrest"
        ],
        "The sentence imposed on the conviction",
        "Judgment combines conviction and sentence.",
        "CPL § 1.20 defines judgment as the conviction and the sentence imposed on it."
      ]
    ]
  },
  "qr_cpl_013_limitations": {
    "cite": "CPL §§ 30.10, 30.30",
    "notes": [
      "Section 30.10 limits commencement; section 30.30 addresses prosecutorial readiness after commencement. Different exceptions and exclusions apply.",
      "The general section 30.30(1) readiness periods are six months for a felony, ninety days for a misdemeanor punishable by more than three months, sixty days for a misdemeanor punishable by no more than three months, and thirty days for a violation, subject to the charge combinations and statutory exceptions."
    ],
    "qs": [
      [
        2,
        "Which distinction correctly separates CPL §§ 30.10 and 30.30?",
        [
          "Commencement limitation versus prosecutorial readiness",
          "Both impose an identical deadline for sentence",
          "Both govern only the time to appeal",
          "Grand-jury quorum versus juror concurrence"
        ],
        "Commencement limitation versus prosecutorial readiness",
        "One clock starts the case; the other concerns readiness.",
        "Section 30.10 concerns timely commencement, while section 30.30 concerns the People’s readiness under its statutory rules."
      ],
      [
        3,
        "Under the general CPL § 30.30(1)(a) rule, what readiness period applies when at least one charged offense is a felony?",
        [
          "Six months",
          "Five years",
          "Ninety days in every case",
          "Thirty days"
        ],
        "Six months",
        "Do not substitute the limitation period.",
        "The general felony readiness period is six months, subject to the statute’s exceptions and exclusions."
      ]
    ]
  },
  "qr_cpl_045_sentence_timing": {
    "cite": "CPL §§ 380.30, 380.50, 390.20",
    "notes": [
      "Before pronouncing sentence, the court must ask whether the defendant wishes to make a personal statement; defense counsel also has an opportunity to speak.",
      "A felony generally requires a written pre-sentence report. For misdemeanors, specified sentences trigger the report requirement, including imprisonment over 180 days or consecutive terms totaling more than 90 days. Probation also generally triggers it. Statutory waiver provisions and exceptions must be checked."
    ],
    "qs": [
      [
        2,
        "Before pronouncing sentence, what must the court ask the defendant under CPL § 380.50(1)?",
        [
          "Whether the defendant wishes to make a personal statement",
          "Whether the defendant wants a new grand jury",
          "Whether the verdict should be counted again",
          "Whether all sentencing rules can be waived unilaterally"
        ],
        "Whether the defendant wishes to make a personal statement",
        "Counsel speaking does not replace the personal opportunity.",
        "The defendant has a personal right to speak, and the court must ask before pronouncing sentence."
      ],
      [
        3,
        "Absent an applicable statutory waiver, a misdemeanor sentence of 200 days requires which step under CPL § 390.20?",
        [
          "Receipt of a written pre-sentence investigation report",
          "A new indictment",
          "Automatic transfer to superior court",
          "Only the defendant’s oral statement"
        ],
        "Receipt of a written pre-sentence investigation report",
        "Compare 200 days with the 180-day threshold.",
        "Imprisonment exceeding 180 days triggers the misdemeanor report requirement, subject to the statute’s waiver and exception provisions."
      ]
    ]
  },
  "qr_cpl_063_order_examination": {
    "cite": "CPL §§ 730.10, 730.30",
    "notes": [
      "An incapacitated person lacks capacity, because of mental disease or defect, to understand the proceedings or assist in the defense. These are alternatives; both deficits are not required.",
      "The order-of-examination rule has specific procedural windows: after arraignment on an instrument other than a felony complaint and before sentence, or after arraignment on a felony complaint and before being held for grand-jury action."
    ],
    "qs": [
      [
        2,
        "Because of mental disease or defect, a defendant cannot assist in the defense but understands the proceedings. Does the definition potentially apply?",
        [
          "Yes; either statutory capacity deficit can qualify",
          "No; both deficits are always required",
          "No; only lack of understanding matters",
          "Only after sentence is imposed"
        ],
        "Yes; either statutory capacity deficit can qualify",
        "The definition uses “or.”",
        "CPL § 730.10(1) includes lack of capacity to understand proceedings or to assist in the defense."
      ],
      [
        3,
        "For a defendant arraigned on a felony complaint, which window appears in CPL § 730.30(1)?",
        [
          "Before being held for grand-jury action",
          "Only after conviction",
          "Only after sentence",
          "Only after an appeal is filed"
        ],
        "Before being held for grand-jury action",
        "The felony-complaint window differs.",
        "The statute describes the period after arraignment on the felony complaint and before the defendant is held for grand-jury action."
      ]
    ]
  }
};
  cards.forEach(c => {
    const extra = relatedRules[c.id]; if (!extra) return;
    c.source.cite = extra.cite; c.intro.source = extra.cite;
    c.source.context += " " + extra.notes.join(" ");
    c.lore.push(...extra.notes);
    c.bank.push(...extra.qs.map(args => q(...args)));
  });

  const lessons = [
    {id:'s4_case_launch',series:4,name:'Launching the Case',cover:'redtape',blurb:'Filing, forum, deadlines, instruments, warrants, and grand-jury action.',cards:['qr_cpl_001_criminal_action','qr_cpl_011_superior_jurisdiction','qr_cpl_013_limitations','qr_cpl_016_facial_sufficiency','qr_cpl_020_arrest_warrant_issue','qr_cpl_028_grand_jury_numbers']},
    {id:'s4_trial_route',series:4,name:'Indictment to Deliberations',cover:'navy',blurb:'Pleas, the statutory trial sequence, and jury requests.',cards:['qr_cpl_033_pleas','qr_cpl_034_jury_trial_order','qr_cpl_039_jury_notes']},
    {id:'s4_after_verdict',series:4,name:'After the Verdict',cover:'gold',blurb:'The pre-sentence motion window, sentencing timing, and fitness examinations.',cards:['qr_cpl_041_set_aside_verdict','qr_cpl_045_sentence_timing','qr_cpl_063_order_examination']},
    {id:'s4_full_route',series:4,name:'Criminal Case Route',cover:'marble',blurb:'A mixed Series 4 review from commencement through post-trial procedure.',cards:['qr_cpl_001_criminal_action','qr_cpl_013_limitations','qr_cpl_016_facial_sufficiency','qr_cpl_028_grand_jury_numbers','qr_cpl_033_pleas','qr_cpl_034_jury_trial_order','qr_cpl_039_jury_notes','qr_cpl_041_set_aside_verdict','qr_cpl_045_sentence_timing','qr_cpl_063_order_examination']},
    {id:'s5_definitions_classes',series:5,name:'Definitions and Classes',cover:'default',blurb:'Person, offense grades, violations, misdemeanors, felonies, and class A subclasses.',cards:['qr_pl_064_offense_grades','qr_pl_065_person','qr_pl_066_classifications','s5_concept_minor_mischief','s5_concept_split_verdict','s5_concept_felony_titan','s5_concept_the_aces']},
    {id:'s5_outside_law',series:5,name:'Outside the Penal Law',cover:'redtape',blurb:'Use designation, sentence range, and exceptions to classify outside-law offenses.',cards:['qr_pl_064_offense_grades','qr_pl_066_classifications','qr_pl_067_designation','s5_concept_split_verdict','s5_concept_felony_titan']},
    {id:'s5_fine_routes',series:5,name:'Fine Routes',cover:'gold',blurb:'General ceilings, gain alternatives, article 496, and the listed drug schedule.',cards:['qr_pl_068_felony_fines','qr_pl_069_nonfelony_fines','s5_concept_triple_take','s5_concept_vault_voltage']},
    {id:'s5_full_framework',series:5,name:'Penal Law Framework',cover:'navy',blurb:'A mixed Series 5 review of definitions, classifications, and fine alternatives.',cards:['qr_pl_064_offense_grades','qr_pl_065_person','qr_pl_066_classifications','qr_pl_067_designation','qr_pl_068_felony_fines','qr_pl_069_nonfelony_fines','s5_concept_minor_mischief','s5_concept_split_verdict','s5_concept_felony_titan','s5_concept_the_aces','s5_concept_triple_take','s5_concept_vault_voltage']}
  ];

  const bundle = { verified: VERIFIED, cards, lessons };
  window.CQ_SERIES45 = bundle;
  window.SERIES45 = bundle;
}());
