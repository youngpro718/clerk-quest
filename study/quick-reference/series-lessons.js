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
  // A study-method or card-dependent question: kept for card study, left out of the Practice Exam (exam.js skips ex:false).
  const cardOnly = o => ({ ...o, ex:false });

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
        q(1,'What event begins a criminal action under CPL § 1.20?',['Filing an accusatory instrument','Opening a police investigation','Making an arrest','Interviewing a witness'],'Filing an accusatory instrument','Look for the formal court filing.','The statute ties commencement to filing an accusatory instrument against a defendant in criminal court.'),
        q(1,'TRUE or FALSE: A police investigation by itself begins the criminal action.',['True','False'],'False','Investigation can precede a filed case.','False. The criminal action begins with the accusatory-instrument filing.', 'tf'),
        q(2,'A felony complaint is filed Monday after a weekend investigation. When does the criminal action begin?',['Monday, when the complaint is filed','When police first developed suspicion','When the first witness was interviewed','At the later arraignment'],'Monday, when the complaint is filed','Focus on the filing date.','Filing the accusatory instrument starts the action; investigation and arraignment are different events.'),
        q(2,'Which event ordinarily marks the far end of the criminal action described in CPL § 1.20?',['Sentence or another final disposition','The first court appearance only','The prosecutor’s opening statement','The arrest alone'],'Sentence or another final disposition','Think file to finish.','The definition continues the action through sentence or another final disposition.'),
        q(3,'Which pairing correctly describes the statutory span of a criminal action?',['Filing → sentence or final disposition','Investigation → arrest','Arrest → indictment only','Complaint drafting → arraignment only'],'Filing → sentence or final disposition','Use both ends of the definition.','CPL § 1.20 uses the filing as the beginning and sentence or other final disposition as the end.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Several accusatory instruments are filed in one case. When did the criminal action commence?",["When the first one was filed", "When the last one was filed", "When the indictment was filed", "At arraignment"],"When the first one was filed","Look for the earliest filing.","CPL 1.20(17): if more than one accusatory instrument is filed, the action commences when the first is filed."),
        q(1,"Which of these is an accusatory instrument under CPL 1.20(1)?",["A misdemeanor complaint", "An arrest report", "A search warrant", "A police memo book"],"A misdemeanor complaint","It accuses someone and is filed in court.","CPL 1.20(1) lists it with indictments, informations and felony complaints."),
        q(1,"A criminal action starts when an accusatory instrument is filed in which kind of court?",["A criminal court", "A civil court", "Surrogate's Court", "Any clerk's office"],"A criminal court","The action is criminal.","CPL 1.20(17): commenced by filing an accusatory instrument against a defendant in a criminal court."),
        q(2,"A felony complaint is filed, then an indictment based on it. When did the action commence?",["When the felony complaint was filed", "When the indictment was filed", "At arraignment on the indictment", "At sentencing"],"When the felony complaint was filed","The first filing counts.","CPL 1.20(17): with several instruments, the action commences when the first is filed."),
        q(2,"Besides the first instrument, what does a criminal action include?",["Instruments derived from the first", "Only the arraignment", "Any civil claims", "Nothing else"],"Instruments derived from the first","Think of what grows out of the first filing.","CPL 1.20(16)(b): it includes further instruments directly derived from the first, and the proceedings disposing of them."),
        q(3,"A misdemeanor complaint is later replaced by an information on the same charge. How many actions?",["One: the information derives from it", "Two: a new action starts", "One, but only with consent", "Two, after a new arrest"],"One: the information derives from it","Derived instruments stay inside the action.","CPL 1.20(16)(b): the action includes all further accusatory instruments directly derived from the initial one."),
        q(3,"A guilty plea is entered; sentence comes next month. What exists today?",["A conviction, not yet a judgment", "A judgment", "Neither one", "A final judgment"],"A conviction, not yet a judgment","Which one needs the sentence?","CPL 1.20(13): a guilty plea is a conviction. 1.20(15): the judgment is completed by imposing the sentence."),
        q(3,"Which is a local criminal court accusatory instrument?",["A misdemeanor complaint", "An indictment", "A superior court information", "None of these"],"A misdemeanor complaint","Two kinds are excluded by name.","CPL 1.20(2): any accusatory instrument other than an indictment or a superior court information."),
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
        q(2,'A felony complaint is first filed in local criminal court. Which statement is correct?',['Starts locally; trial in superior court','Local court must hold the felony trial','Local filing makes it a misdemeanor','No court has jurisdiction until indictment'],'Starts locally; trial in superior court','Beginning a case and trying it are different powers.','Local court may exercise preliminary jurisdiction while superior court has exclusive felony trial jurisdiction.'),
        q(2,'What does “exclusive” mean in the CPL § 10.20 felony-trial rule?',['The felony trial is assigned to superior court','Only the prosecutor may appear','The defendant cannot request counsel','The case cannot begin in local court'],'The felony trial is assigned to superior court','Apply the word to trial jurisdiction.','Exclusive trial jurisdiction identifies the court authorized to try the felony.'),
        q(3,'Which statement best avoids confusing preliminary and trial jurisdiction?',['Local: early stage. Superior: felony trial.','Every felony begins and ends in village court','Superior court handles only sentencing','An arrest creates an indictment automatically'],'Local: early stage. Superior: felony trial.','Track the procedural stage.','CPL article 10 distinguishes a local court’s preliminary role from the superior court’s felony-trial role.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Superior courts have preliminary jurisdiction of all offenses. How do they exercise it?",["Through their grand juries", "Through their clerks", "Through local police", "Through town courts"],"Through their grand juries","A body attached to the superior court.","CPL 10.20(2): only by reason of and through the agency of their grand juries."),
        q(1,"Superior court trial jurisdiction over misdemeanors is:",["Shared with local criminal courts", "Exclusive to superior court", "Not allowed at all", "Only on appeal"],"Shared with local criminal courts","The rule says concurrent.","CPL 10.20(1)(b): trial jurisdiction of misdemeanors concurrent with that of the local criminal courts."),
        q(1,"A superior court judge may sit as a local criminal court to:",["Issue an arrest warrant", "Hold a civil jury trial", "Grant a divorce", "Approve a liquor license"],"Issue an arrest warrant","Think warrants and arraignments.","CPL 10.20(3)(b): issuing warrants of arrest, as provided in section 120.70."),
        q(2,"When can a superior court try a petty offense?",["When an indictment also charges a crime", "Whenever it chooses", "Never", "At the defendant's request"],"When an indictment also charges a crime","Petty offenses ride along with something bigger.","CPL 10.20(1)(c): only when the petty offense is charged in an indictment which also charges a crime."),
        q(2,"Which is NOT a listed purpose for a superior court judge sitting as a local criminal court?",["Accepting a civil complaint", "Conducting arraignments", "Issuing arrest warrants", "Issuing search warrants"],"Accepting a civil complaint","Three purposes are listed.","CPL 10.20(3) lists arraignments, arrest warrants and search warrants."),
        q(2,"Which court may try a misdemeanor?",["Superior or local criminal court", "Only superior court", "Only local criminal court", "Only the grand jury"],"Superior or local criminal court","Concurrent means both.","CPL 10.20(1)(b): superior court jurisdiction over misdemeanors is concurrent with the local criminal courts."),
        q(3,"An indictment charges a felony and a violation. Can the superior court try both?",["Yes: the indictment charges a crime", "No: violations stay local", "Only the felony", "Only with consent"],"Yes: the indictment charges a crime","Check what else the indictment charges.","CPL 10.20(1)(c): a petty offense is triable when charged in an indictment which also charges a crime."),
        q(3,"Only a violation is charged, by information. Does superior court have trial jurisdiction?",["No: no indictment charges a crime", "Yes: it tries all offenses", "Yes, if the judge agrees", "Only after arraignment"],"No: no indictment charges a crime","The petty-offense rule has a condition.","CPL 10.20(1)(c): petty offenses only when charged in an indictment which also charges a crime."),
        q(3,"A superior court judge arraigns a defendant on a felony complaint. In what role?",["As a local criminal court", "As the trial court", "As a grand jury", "As an appellate court"],"As a local criminal court","Subdivision 3 lets the judge sit differently.","CPL 10.20(3)(a): superior court judges may sit as local criminal courts to conduct arraignments."),
        q(3,"Which statement about superior courts is FALSE?",["Local courts may also try felonies", "They try felonies exclusively", "Grand juries act for them", "Their judges may issue search warrants"],"Local courts may also try felonies","One statement breaks exclusivity.","CPL 10.20(1)(a): superior courts have exclusive trial jurisdiction of felonies; 10.20(3)(c) covers search warrants."),
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
        cardOnly(q(2,'A clerk identifies the general deadline from subdivision 2. What should happen next?',['Check for extensions, tolling and exceptions','Treat the baseline as absolute','Use the civil limitations period','Measure from arraignment in every case'],'Check for extensions, tolling and exceptions','The card’s hook has two steps.','CPL § 30.10 includes rules that can alter the general baseline.')),
        q(2,'TRUE or FALSE: Every class A felony has a five-year limitations period.',['True','False'],'False','Class A has a distinct baseline.','False. The general table states no limitation for a class A felony.', 'tf'),
        q(3,'A petty offense is being reviewed and no exception has yet been found. Which baseline applies?',['One year','Two years','Five years','No limitation'],'One year','Use the petty-offense row.','The general limitations period for a petty offense is one year, subject to the rest of the statute.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Under CPL 30.10(2), a class A felony prosecution may be commenced:",["At any time", "Within five years", "Within ten years", "Within two years"],"At any time","Class A sits apart from the rest.","CPL 30.10(2)(a): a prosecution for a class A felony may be commenced at any time."),
        q(1,"From what event does a CPL 30.10 limitation period run?",["The commission of the offense", "The arrest", "The arraignment", "The indictment"],"The commission of the offense","Read the end of each period.","CPL 30.10(2): each period runs after the commission of the offense, e.g. two years for a misdemeanor."),
        q(1,"Only a violation is charged. Under CPL 30.30, the People must be ready within:",["30 days", "60 days", "90 days", "Six months"],"30 days","The smallest charge, the shortest clock.","CPL 30.30(1)(d): thirty days where at least one offense is a violation and none is a crime."),
        q(2,"Only a misdemeanor punishable by up to one year is charged. Readiness period under CPL 30.30?",["90 days", "60 days", "30 days", "Six months"],"90 days","More than three months of jail is possible.","CPL 30.30(1)(b): ninety days where a misdemeanor is punishable by more than three months and no felony is charged."),
        q(2,"From when does the CPL 30.30 readiness period run?",["Commencement of the criminal action", "The arrest", "The first trial date", "The indictment"],"Commencement of the criminal action","Same starting line as the action itself.","CPL 30.30(1): the People must be ready within the period measured from the commencement of the criminal action."),
        q(3,"A non-class-A felony and a misdemeanor are charged together. Which CPL 30.30 period applies?",["Six months", "90 days", "60 days", "30 days"],"Six months","One felony is enough.","CPL 30.30(1)(a): six months where at least one charged offense is a felony."),
        q(3,"Only a misdemeanor punishable by up to three months is charged. Readiness period?",["60 days", "90 days", "30 days", "Six months"],"60 days","Three months or less of jail.","CPL 30.30(1)(c): sixty days for a misdemeanor punishable by not more than three months, with no greater crime."),
        q(3,"For the CPL 30.30(1) time limits, \"offense\" also includes:",["Vehicle and traffic law infractions", "Parking complaints only", "Civil lawsuits", "Family Court petitions"],"Vehicle and traffic law infractions","Look at paragraph (e).","CPL 30.30(1)(e): for this subdivision, offense includes vehicle and traffic law infractions."),
      ]
    }),
    card({
      id:'qr_cpl_016_facial_sufficiency', art:'s4_proof_polly', series:4, number:4, name:'Proof Polly', category:'ACCUSATORY INSTRUMENTS', emoji:'🔎', law:'CPL', section:'100.40', cite:'CPL § 100.40', hook:'Instrument first, test second',
      summary:'An information generally requires nonhearsay factual allegations establishing every element and the defendant’s commission; complaints use the reasonable-cause test stated for them.',
      context:'Simplified and prosecutor’s informations have their own subdivision-specific tests, so one formula does not govern every instrument.', example:'An information must be tested under the information standard, not the complaint standard.',
      panel:{kind:'trigger',caption:'Facial sufficiency',steps:['IDENTIFY THE INSTRUMENT','FIND ITS SUBDIVISION','APPLY THAT TEST']},
      bank:[
        cardOnly(q(1,'What is the first step in a CPL § 100.40 facial-sufficiency review?',['Identify the type of accusatory instrument','Assume every instrument is an information','Count the witnesses','Set a sentencing date'],'Identify the type of accusatory instrument','Different instruments use different subdivisions.','The instrument’s type determines which facial-sufficiency test applies.')),
        q(1,'An information generally needs what kind of factual allegations to establish each element and the defendant’s commission?',['Nonhearsay factual allegations','A prosecutor’s conclusion alone','An unsigned prediction','A sentencing recommendation'],'Nonhearsay factual allegations','This is the information standard.','The information standard generally requires nonhearsay allegations establishing the elements and commission.'),
        cardOnly(q(2,'A reviewer applies the information test to a misdemeanor complaint without checking the instrument type. What is the error?',['Using the wrong subdivision\'s test','Reviewing the document before trial','Reading factual allegations','Checking reasonable cause'],'Using the wrong subdivision\'s test','Instrument first, test second.','CPL § 100.40 supplies distinct tests for different accusatory instruments.')),
        q(2,'TRUE or FALSE: A simplified information necessarily uses the identical formula applied to an information.',['True','False'],'False','Simplified instruments have a separate statutory test.','False. The applicable subdivision must be selected for the instrument.', 'tf'),
        cardOnly(q(3,'Which workflow best matches CPL § 100.40?',['Classify, pick the subdivision, then test','Apply the complaint rule to every filing','Decide guilt, then inspect the instrument','Use the arrest report as the only test'],'Classify, pick the subdivision, then test','Order matters.','Facial sufficiency depends on the instrument-specific statutory standard.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"A felony complaint is sufficient on its face if its allegations provide:",["Reasonable cause to believe", "Proof beyond a reasonable doubt", "A signed confession", "A grand jury vote"],"Reasonable cause to believe","A complaint's test is the lighter one.","CPL 100.40(4)(b): allegations provide reasonable cause to believe the defendant committed the offense charged."),
        q(1,"A prosecutor's information must substantially conform to which section?",["CPL 100.35", "CPL 100.15", "CPL 100.25", "CPL 30.30"],"CPL 100.35","Each instrument has its own section.","CPL 100.40(3): sufficient when it substantially conforms to the requirements of section 100.35."),
        q(1,"An information and a misdemeanor complaint must both substantially conform to:",["CPL 100.15", "CPL 100.35", "CPL 100.25", "CPL 30.10"],"CPL 100.15","The same section appears in both tests.","CPL 100.40(1)(a) and (4)(a) both require substantial conformity with section 100.15."),
        q(2,"Which test applies to an information but NOT to a misdemeanor complaint?",["Non-hearsay facts for every element", "Reasonable cause", "Conformity with 100.15", "Testing a single count"],"Non-hearsay facts for every element","One test is added for informations.","CPL 100.40(1)(c) adds the non-hearsay test for informations; 100.40(4) for complaints has no such test."),
        q(2,"Besides its factual part, what can supply an information's allegations?",["Supporting depositions", "Police opinions", "News reports", "The defendant's silence"],"Supporting depositions","Papers that may accompany it.","CPL 100.40(1)(b)-(c): the factual part together with any supporting depositions."),
        q(2,"Can one count of an information be tested for facial sufficiency?",["Yes: \"or a count thereof\"", "No: only the whole paper", "Only at trial", "Only on appeal"],"Yes: \"or a count thereof\"","Read the first line of subdivision 1.","CPL 100.40(1): an information, or a count thereof, is sufficient on its face when its tests are met."),
        q(3,"A court orders a supporting deposition for a simplified information; the officer misses the deadline. Result?",["It is insufficient on its face", "It stays sufficient", "It moves to superior court", "The deadline extends itself"],"It is insufficient on its face","Subdivision 2 names the consequence.","CPL 100.40(2): failing to comply with the 100.25(2) order in time renders it insufficient on its face."),
        q(3,"An information gives reasonable cause, but one element rests only on hearsay. Sufficient?",["No: every element needs non-hearsay", "Yes: reasonable cause is enough", "Yes, if an officer signed it", "No: it needs a confession"],"No: every element needs non-hearsay","Informations have a third test.","CPL 100.40(1)(c): non-hearsay allegations must establish, if true, every element and the defendant's commission."),
        q(3,"A misdemeanor complaint shows reasonable cause, partly through hearsay. Sufficient on its face?",["Yes, if it conforms to 100.15", "No: hearsay is never allowed", "No: it needs a confession", "Only after an indictment"],"Yes, if it conforms to 100.15","The non-hearsay test is for informations.","CPL 100.40(4): complaints need 100.15 conformity and reasonable cause; the non-hearsay rule is in (1)(c)."),
        q(3,"Which instruments are tested only by 100.15 conformity and reasonable cause?",["Misdemeanor and felony complaints", "Informations", "Simplified informations", "Superior court informations"],"Misdemeanor and felony complaints","Subdivision 4.","CPL 100.40(4): a misdemeanor or felony complaint is sufficient on its face when both are met."),
      ]
    }),
    card({
      id:'qr_cpl_020_arrest_warrant_issue', art:'s4_warrant_walt', series:4, number:5, name:'Warrant Walt', category:'WARRANTS & APPEARANCES', emoji:'📜', law:'CPL', section:'120.20', cite:'CPL § 120.20(1)', hook:'Test before warrant',
      summary:'After a qualifying accusatory instrument is filed against an unarraigned defendant, the court may issue a warrant if the instrument is facially sufficient.',
      context:'If the instrument is insufficient and cannot be cured, dismissal is required rather than a warrant.', example:'A defendant’s absence does not make a deficient instrument sufficient for a warrant.',
      panel:{kind:'trigger',caption:'Before issuing a warrant',steps:['QUALIFYING INSTRUMENT FILED','FACIAL SUFFICIENCY','WARRANT MAY ISSUE']},
      bank:[
        q(1,'Before issuing the warrant described in CPL § 120.20(1), what must the court confirm?',['The instrument is sufficient on its face','The defendant has already been sentenced','A jury has returned a verdict','The case is civil'],'The instrument is sufficient on its face','Test before warrant.','Facial sufficiency is required for the warrant route described by the statute.'),
        q(1,'The statutory warrant provision addresses a defendant who has not yet been:',['Arraigned','Convicted','Sentenced','Called as a witness'],'Arraigned','Focus on the defendant’s procedural status.','CPL § 120.20(1) concerns a qualifying filing against an unarraigned defendant.'),
        q(2,'Under CPL § 120.20(1), the filed instrument is insufficient and the defect cannot be cured. What follows?',['Dismissal rather than issuance of the warrant','Automatic conviction','A warrant despite the defect','Immediate sentence'],'Dismissal rather than issuance of the warrant','An uncured defect blocks the warrant.','The statute requires dismissal when the insufficiency cannot be cured.'),
        q(2,'TRUE or FALSE: A defendant’s failure to appear can by itself cure a facially insufficient instrument.',['True','False'],'False','Absence and sufficiency are separate issues.','False. The instrument must satisfy the statutory sufficiency requirement.', 'tf'),
        q(3,'Which sequence correctly applies CPL § 120.20(1)?',['Filing → sufficiency check → warrant may issue','Absence → automatic warrant → filing later','Arrest → sentence → filing','Investigation → conviction → warrant'],'Filing → sufficiency check → warrant may issue','Keep the legal prerequisites in order.','A qualifying filing and facial sufficiency precede discretionary warrant issuance.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"For the CPL 120.20(1) warrant rule, where must the action have been commenced?",["Local criminal court or youth part", "Court of Appeals", "Surrogate's Court", "Civil Court"],"Local criminal court or youth part","Two courts are named.","CPL 120.20(1): an action commenced in a local criminal court or youth part of the superior court."),
        q(1,"Which instrument is excluded from the CPL 120.20(1) warrant rule?",["A simplified traffic information", "A felony complaint", "A misdemeanor complaint", "An information"],"A simplified traffic information","One instrument is carved out.","CPL 120.20(1): an accusatory instrument other than a simplified traffic information."),
        q(1,"The instrument is sufficient on its face. Under CPL 120.20(1)(a), the court:",["May issue an arrest warrant", "Must issue a warrant", "Must dismiss the case", "Must start the trial"],"May issue an arrest warrant","Read the verb: may or must?","CPL 120.20(1)(a): such court may, if the instrument is sufficient on its face, issue a warrant."),
        q(2,"Even with a sufficient instrument, the court may refuse a warrant until satisfied of:",["Reasonable cause the defendant did it", "Proof beyond a reasonable doubt", "A guilty plea", "A grand jury vote"],"Reasonable cause the defendant did it","Subdivision 2 lets the court look further.","CPL 120.20(2): it may first satisfy itself, by inquiry or examining witnesses, of reasonable cause."),
        q(2,"During a CPL 120.20(2) inquiry, whom may the court examine?",["Any available person with knowledge", "Only the defendant", "Only police officers", "No one"],"Any available person with knowledge","The rule is broad.","CPL 120.20(2): any available person it believes may know about the charge, under oath or otherwise."),
        q(2,"A summons may issue under 130.20 and the defendant will respond. May the court issue a warrant?",["No", "Yes, always", "Only for felonies", "Only if the DA asks"],"No","Subdivision 3 prefers the summons.","CPL 120.20(3): if a summons may issue and the defendant will respond, the court may not issue a warrant."),
        q(3,"At the DA's request, instead of a warrant or summons, the court may:",["Let the DA direct the defendant to appear", "Order a grand jury vote", "Dismiss the charge", "Skip the arraignment"],"Let the DA direct the defendant to appear","A third way to get the defendant in.","CPL 120.20(3): authorize the DA to direct the defendant to appear for arraignment on a set date."),
        q(3,"The instrument is insufficient, but a sufficient one could be drawn from the facts. Must the court dismiss?",["No: dismissal needs it to be impossible", "Yes, always", "Yes, after 30 days", "No: it must issue the warrant"],"No: dismissal needs it to be impossible","Dismissal has a condition.","CPL 120.20(1)(b): dismissal is required only if a sufficient instrument would be impossible to draw and file."),
        q(3,"Which defendant does the CPL 120.20(1) rule cover?",["One not yet arraigned or under control", "One already convicted", "One already on trial", "One arraigned and out on bail"],"One not yet arraigned or under control","Before the court has the defendant.","CPL 120.20(1): a defendant not arraigned on the instrument and not under the court's control on it."),
        q(3,"Which statement about CPL 120.20 is FALSE?",["A sufficient instrument forces a warrant", "The court may examine witnesses first", "A summons can bar a warrant", "Unfixable bad charges are dismissed"],"A sufficient instrument forces a warrant","One statement turns may into must.","CPL 120.20(1)(a) says the court may issue a warrant; 120.20(2) lets it refuse until satisfied."),
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
        q(3,'Which shorthand accurately captures CPL § 190.25(1)?',['16 present; 12 concur','12 present; 16 concur','16 present; all 16 concur','23 present; 23 concur'],'16 present; 12 concur','Keep quorum and concurrence in order.','The two statutory minimums are sixteen for presence and twelve for concurrence.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Who may administer an oath to a witness before the grand jury?",["The foreman or any grand juror", "Only the judge", "Only the district attorney", "Only the clerk"],"The foreman or any grand juror","Any juror can do it.","CPL 190.25(2): the foreman or any other grand juror may administer an oath to any witness."),
        q(1,"Generally, who may be present while a grand jury deliberates and votes?",["Only the grand jurors", "The district attorney", "A stenographer", "The witness's lawyer"],"Only the grand jurors","Voting is private.","CPL 190.25(3): during deliberations and voting, only the grand jurors may be present (except as in 3-a)."),
        q(1,"Besides an indictment, which act also needs at least 12 concurring grand jurors?",["Deciding to submit a report", "Swearing in a witness", "Hearing testimony", "Taking a recess"],"Deciding to submit a report","An affirmative official decision.","CPL 190.25(1): a decision to submit a grand jury report requires the concurrence of at least twelve."),
        q(2,"Twenty grand jurors are present and twelve vote to indict. Is the indictment valid?",["Yes: 16 present and 12 concur", "No: two-thirds must agree", "No: all present must agree", "No: sixteen must concur"],"Yes: 16 present and 12 concur","Check both numbers separately.","CPL 190.25(1): at least sixteen present; at least twelve concurring for an indictment."),
        q(2,"Outside deliberations and voting, who may be in the grand jury room?",["A stenographer", "The defendant's family", "A news reporter", "Any member of the public"],"A stenographer","Someone who records.","CPL 190.25(3)(c): a stenographer authorized to record the proceedings may be present."),
        q(2,"A direction to file a prosecutor's information needs how many concurring grand jurors?",["At least twelve", "At least sixteen", "A simple majority", "All who are present"],"At least twelve","Same number as an indictment.","CPL 190.25(1): a direction to file a prosecutor's information requires at least twelve."),
        q(3,"A witness in custody testifies. Who may stay with them in the grand jury room?",["Their guard, sworn to secrecy", "Any police officer", "The defendant", "No one at all"],"Their guard, sworn to secrecy","Paragraph (e).","CPL 190.25(3)(e): the public servant guarding them, after an oath of secrecy if not already sworn."),
        q(3,"An interpreter who has not taken the constitutional oath must first swear to:",["Interpret faithfully and keep secrets", "Vote with the jurors", "Report to the court press", "Testify as a witness"],"Interpret faithfully and keep secrets","Two promises.","CPL 190.25(3)(d): to faithfully interpret and keep secret all matters before the grand jury."),
        q(3,"During deliberations, the DA walks into the grand jury room. Generally allowed?",["No: only grand jurors may be present", "Yes: the DA may always be there", "Yes, if the clerk agrees", "Only to count the votes"],"No: only grand jurors may be present","The DA may attend other proceedings.","CPL 190.25(3): during deliberations and voting, only the grand jurors may be present."),
        q(3,"When the grand jury asks for an interpreter, who must provide one?",["The prosecutor", "The defendant", "The foreman", "The witness"],"The prosecutor","Read paragraph (d).","CPL 190.25(3)(d): upon request of the grand jury, the prosecutor must provide an interpreter."),
      ]
    }),
    card({
      id:'qr_cpl_033_pleas', art:'s4_plea_piper', series:4, number:7, name:'Plea Piper', category:'INDICTMENTS & PLEAS', emoji:'🗣️', law:'CPL', section:'220.10', cite:'CPL § 220.10', hook:'Whole differs from partial',
      summary:'A defendant may plead not guilty as of right and may plead guilty to the entire indictment as provided by statute; a plea to part of the indictment or a lesser included offense requires the court’s permission and the People’s consent.',
      context:'Partial and lesser pleas are negotiated dispositions, not unilateral choices.', example:'A plea to one count while other counts remain needs the required approvals.',
      panel:{kind:'diff',caption:'Pleas to an indictment',heads:['AS OF RIGHT / WHOLE','PARTIAL OR LESSER'],yes:['NOT GUILTY','GUILTY TO ENTIRE INDICTMENT'],no:['COURT PERMISSION','PEOPLE CONSENT']},
      bank:[
        q(1,'Which plea is available to a defendant as of right?',['Not guilty','Guilty to any chosen lesser offense','Guilty to one count with all others dismissed','A plea selected by the clerk'],'Not guilty','No negotiation is needed for this plea.','CPL § 220.10 makes a not-guilty plea available as of right.'),
        q(1,'A plea to part of an indictment generally requires whose approval?',['Court permission and People’s consent','Only the defendant’s signature','Only the clerk’s approval','The jury’s consent'],'Court permission and People’s consent','Two approvals matter.','Partial or lesser pleas require both the court and prosecution roles specified by statute.'),
        q(2,'A defendant wants to plead guilty to one count while leaving the rest unresolved. Which description fits?',['A partial plea needing both approvals','A not-guilty plea as of right','An automatic dismissal','A jury verdict'],'A partial plea needing both approvals','Whole differs from partial.','The defendant cannot unilaterally select a partial disposition.'),
        q(2,'TRUE or FALSE: A defendant can always force acceptance of a plea to a lesser included offense.',['True','False'],'False','Lesser pleas are not unilateral.','False. The court’s permission and the People’s consent are required.', 'tf'),
        q(3,'Which choice best distinguishes a whole-indictment guilty plea from a partial plea?',['A partial plea also needs both approvals','The whole plea always requires a jury vote','A partial plea comes only after sentence','There is no statutory distinction'],'A partial plea also needs both approvals','Focus on the additional approvals.','CPL § 220.10 treats a negotiated partial or lesser plea differently.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Which pleas may be entered to an indictment?",["Only those listed in CPL 220.10", "Any plea the parties agree on", "Any plea the judge drafts", "Only not guilty"],"Only those listed in CPL 220.10","The section calls itself the only list.","CPL 220.10: the only kinds of pleas which may be entered to an indictment are those specified in this section."),
        q(1,"May a defendant plead guilty to the entire indictment as of right?",["Yes, except as subdivision 5 provides", "No: it needs the People's consent", "Only with court permission", "No, never"],"Yes, except as subdivision 5 provides","Compare with a partial plea.","CPL 220.10(2): except as provided in subdivision 5, a plea of guilty to the entire indictment is a matter of right."),
        q(1,"On a one-crime indictment, a guilty plea to a lesser included offense needs:",["Court permission and People's consent", "Only the defendant's wish", "Only the judge", "Only the grand jury"],"Court permission and People's consent","Two approvals.","CPL 220.10(3): with both the permission of the court and the consent of the people."),
        q(2,"An indictment has three counts. The defendant wants to plead guilty to two. Which subdivision governs?",["Subdivision 4", "Subdivision 1", "Subdivision 2", "Subdivision 3"],"Subdivision 4","Two or more offenses in separate counts.","CPL 220.10(4)(a): guilty of one or more but not all offenses charged, with court permission and People's consent."),
        q(2,"Which plea needs no one's permission?",["Guilty to the whole indictment", "Guilty to one count of several", "Guilty of a lesser included offense", "A mix of counts and lesser offenses"],"Guilty to the whole indictment","One guilty plea is a matter of right.","CPL 220.10(2) is a matter of right (subject to subd. 5); partial and lesser pleas need both approvals."),
        q(2,"With permission and consent, a multi-count plea may combine:",["Charged and lesser included offenses", "Charges from another indictment", "Civil and criminal claims", "Only traffic infractions"],"Charged and lesser included offenses","Paragraph (c) mixes them.","CPL 220.10(4)(c): any combination of offenses charged and lesser offenses included within other offenses charged."),
        q(3,"The court permits a lesser plea, but the People refuse consent. Can it be entered under 220.10(3)?",["No: both are required", "Yes: the court decides", "Yes, if the defendant insists", "Only at sentencing"],"No: both are required","Count the approvals.","CPL 220.10(3): the plea needs both the permission of the court and the consent of the people."),
        q(3,"An indictment charges a class B felony (not article 220, not violent). A partial plea must include at least:",["A guilty plea to a felony", "A misdemeanor plea", "A violation plea", "A class A felony plea"],"A guilty plea to a felony","Paragraph (b) sets the floor.","CPL 220.10(5)(b): a plea under subdivision 3 or 4 must be or include at least a plea of guilty of a felony."),
        q(3,"Which plea is NOT one of the kinds listed in CPL 220.10?",["No contest", "Not guilty", "Guilty to the entire indictment", "Guilty of a lesser included offense"],"No contest","One is not a New York plea.","CPL 220.10 lists not guilty, guilty, the permitted partial and lesser pleas, and not responsible (subd. 6)."),
        q(3,"An indictment charges a PL article 220 class A felony. A partial plea must include at least:",["A class B felony plea", "A class D felony plea", "A misdemeanor plea", "Any felony plea"],"A class B felony plea","Paragraph (a)(i).","CPL 220.10(5)(a)(i): a plea under subdivision 3 or 4 must be or include at least a plea of guilty of a class B felony."),
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
        q(2,'Which sequence is correct?',['People open first; defense sums up first','Defense opens first and People sum first','People open first and People sum first','Defense opens first and defense sums second'],'People open first; defense sums up first','Use both anchors.','The order reverses between openings and summations.'),
        q(2,'TRUE or FALSE: The court’s charge comes before jury deliberation.',['True','False'],'True','The jury needs legal instructions before deliberating.','True. The statutory order places the charge before deliberation.', 'tf'),
        q(3,'Counsel asks who speaks last before the court’s charge. Under the ordinary statutory sequence, who is it?',['The People, in summation','The defense, in opening','The jury foreperson','The clerk'],'The People, in summation','Defense sums first.','The People’s summation follows the defense summation, before the court charges the jury.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"What is the first step of a jury trial under CPL 260.30?",["Selecting and swearing the jury", "Opening addresses", "Preliminary instructions", "The People's evidence"],"Selecting and swearing the jury","No jury, no trial.","CPL 260.30(1): the jury must be selected and sworn."),
        q(1,"Right after the jury is sworn, the court must:",["Give preliminary instructions", "Charge the jury", "Hear summations", "Take the verdict"],"Give preliminary instructions","Step 2.","CPL 260.30(2): the court must deliver preliminary instructions to the jury."),
        q(1,"Must the defendant give an opening address?",["No: the defendant may", "Yes, always", "Only if the People do", "Only in felony trials"],"No: the defendant may","Must for one side, may for the other.","CPL 260.30(3)-(4): the people must deliver an opening; the defendant may."),
        q(2,"What comes right after the defense summation?",["The People's summation", "The court's charge", "Deliberations", "Defense rebuttal evidence"],"The People's summation","Summations run defense, then People.","CPL 260.30(8)-(9): the defendant may sum up; the people may then deliver a summation."),
        q(2,"Who must offer evidence in support of the indictment?",["The People", "The defendant", "The court", "The jury"],"The People","Step 5.","CPL 260.30(5): the people must offer evidence in support of the indictment."),
        q(2,"After the People's rebuttal evidence, the defendant may offer:",["Evidence rebutting that rebuttal", "A second opening", "A summation first", "Nothing more"],"Evidence rebutting that rebuttal","Step 7 goes back and forth.","CPL 260.30(7): the defendant may then offer evidence in rebuttal of the people's rebuttal evidence."),
        q(3,"The People finish their main evidence. What step is next?",["The defendant may offer evidence", "The People's summation", "The court's charge", "The defense opening"],"The defendant may offer evidence","Step 6.","CPL 260.30(5)-(6): after the people's evidence, the defendant may offer evidence in his defense."),
        q(3,"May the court allow further rebuttal and surrebuttal evidence?",["Yes, in its discretion", "No, never", "Only with the jury's consent", "Only in non-jury trials"],"Yes, in its discretion","Read step 7 closely.","CPL 260.30(7): the court may in its discretion permit further rebuttal or surrebuttal evidence in this pattern."),
        q(3,"Which order follows CPL 260.30?",["Openings, evidence, summations, charge", "Evidence, openings, charge, summations", "Charge, openings, evidence, summations", "Summations, evidence, openings, charge"],"Openings, evidence, summations, charge","Talk, prove, argue, instruct.","CPL 260.30(3)-(10): openings, evidence and rebuttal, summations, then the court's charge."),
        q(3,"In the interest of justice, rebuttal evidence may include:",["Evidence that belonged in the main case", "Evidence from a different trial", "Jurors' own research", "Unsworn statements"],"Evidence that belonged in the main case","The end of step 7.","CPL 260.30(7): the court may permit rebuttal evidence more properly part of the offering party's original case."),
      ]
    }),
    card({
      id:'qr_cpl_039_jury_notes', art:'s4_note_ninja', series:4, number:9, name:'Note Ninja', category:'JURY DELIBERATIONS', emoji:'✉️', law:'CPL', section:'310.30', cite:'CPL § 310.30', hook:'Notice, presence, response',
      summary:'When a deliberating jury requests information or instruction, the court must return the jury to the courtroom and, after notice to both sides and in the defendant’s presence, give the response it deems proper.',
      context:'With consent and a qualifying jury request, the court may provide statutory text; this card intentionally omits unverified case-law glosses.', example:'Both sides receive notice before the court answers the jury in the defendant’s presence.',
      panel:{kind:'trigger',caption:'Responding to a jury note',steps:['JURY REQUEST','NOTICE TO BOTH SIDES','RETURN TO COURTROOM','RESPONSE IN DEFENDANT’S PRESENCE']},
      bank:[
        q(1,'What must the court do with the jury before answering its request?',['Return the jury to the courtroom','Answer privately through the foreperson','Dismiss the jury','Ask the clerk to decide'],'Return the jury to the courtroom','The response is made in court.','CPL § 310.30 requires the jury to return to the courtroom.'),
        q(1,'Who receives notice before the court responds?',['Both sides','Only the prosecutor','Only the foreperson','Only court staff'],'Both sides','Notice is adversarial, not one-sided.','The statute requires notice to the People and counsel for the defendant.'),
        q(2,'A judge plans to answer a jury note in open court after notice to both sides, but while the defendant is absent. Which required feature is missing?',['The defendant’s presence','The jury’s return to the courtroom','Notice to both sides','A proper response to the request'],'The defendant’s presence','The scenario already supplies the other statutory steps.','The response is given in the defendant’s presence after notice.'),
        q(2,'TRUE or FALSE: The court may answer a deliberating jury’s legal question by a private message with no notice to counsel.',['True','False'],'False','Notice and an in-court response are required.','False. CPL § 310.30 requires notice and return of the jury to the courtroom.', 'tf'),
        q(3,'Which sequence best matches the statutory response process?',['Notice; jury back; answer with defendant','Respond privately → notify later','Dismiss jury → arraign again','Notify prosecutor only → send clerk’s answer'],'Notice; jury back; answer with defendant','Notice, presence, response.','The sequence preserves notice, courtroom return, and defendant presence.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"When may a deliberating jury ask the court for more instruction?",["At any time during deliberation", "Only before deliberating", "Only once", "Only with the DA's permission"],"At any time during deliberation","The rule opens with a time phrase.","CPL 310.30: at any time during its deliberation, the jury may request further instruction or information."),
        q(1,"A deliberating jury may ask the court about:",["The law, the evidence, or related matters", "Only the law", "Only the sentence", "Only the defendant's record"],"The law, the evidence, or related matters","Three kinds of requests.","CPL 310.30: the law, the content or substance of trial evidence, or any other matter pertinent to the case."),
        q(1,"Who decides what response to give a jury's request?",["The court", "The jury foreperson", "The prosecutor", "Defense counsel"],"The court","It gives what it deems proper.","CPL 310.30: the court must give such requested information or instruction as the court deems proper."),
        q(2,"The jury asks for the text of a statute. What is needed before the court gives copies?",["The parties' consent", "A new trial", "The defendant's testimony", "A grand jury vote"],"The parties' consent","Copies need agreement.","CPL 310.30: with the consent of the parties, the court may give copies of the statute text it deems proper."),
        q(2,"Must the court give exactly what the jury asks for?",["No: what it deems proper", "Yes, word for word", "No: it must refuse", "Only if both sides agree"],"No: what it deems proper","The court shapes the answer.","CPL 310.30: the court gives the requested information or instruction as the court deems proper."),
        q(2,"The jury asks to hear part of a witness's testimony again. Is that a proper request?",["Yes: it concerns trial evidence", "No: only the law may be asked", "No: the evidence is closed", "Only before deliberations"],"Yes: it concerns trial evidence","Evidence is one of the listed topics.","CPL 310.30: a request may concern the content or substance of any trial evidence."),
        q(3,"Both sides consent and the jury asks about a statute. Must the court hand out its text?",["No: it may, in its discretion", "Yes, always", "Yes, every statute in the case", "No: it is never allowed"],"No: it may, in its discretion","Consent opens the door; it doesn't require it.","CPL 310.30: with consent, the court may give copies of any statute which, in its discretion, it deems proper."),
        q(3,"The court answers a jury note in court, defendant present, without notifying defense counsel. Problem?",["Defense counsel must get notice", "No problem", "The jury must be dismissed", "The People must answer instead"],"Defense counsel must get notice","Notice goes to two sides.","CPL 310.30: notice to both the people and counsel for the defendant, and in the defendant's presence."),
        q(3,"Which is NOT required before the court responds to a jury request?",["The jury's current vote count", "Returning the jury to court", "Notice to both sides", "The defendant's presence"],"The jury's current vote count","Three steps are required.","CPL 310.30 requires returning the jury, notice to both sides, and the defendant's presence."),
        q(3,"A jury note asks about a matter pertinent to its consideration of the case. Is it covered?",["Yes: any pertinent matter counts", "No: only legal questions", "No: only evidence questions", "Only with the defendant's consent"],"Yes: any pertinent matter counts","The third category is broad.","CPL 310.30: the jury may ask about any other matter pertinent to the jury's consideration of the case."),
      ]
    }),
    card({
      id:'qr_cpl_041_set_aside_verdict', art:'s4_verdict_vex', series:4, number:10, name:'Verdict Vex', category:'POST-TRIAL REMEDIES', emoji:'↩️', law:'CPL', section:'330.30', cite:'CPL § 330.30', hook:'Verdict to sentence window',
      summary:'After verdict and before sentence, the defendant may move to set aside the verdict on the statute’s three grounds: appeal-level legal error, specified outside-court juror misconduct, or qualifying newly discovered evidence.',
      context:'The CPL § 330.30 timing window closes when sentence is imposed; other remedies govern afterward.', example:'Qualifying newly discovered evidence must satisfy the statute’s diligence and probable-effect requirements.',
      panel:{kind:'trigger',caption:'CPL § 330.30 window',steps:['VERDICT','DEFENDANT MOVES ON A STATUTORY GROUND','BEFORE SENTENCE']},
      bank:[
        q(1,'Who may make a motion to set aside a verdict under CPL § 330.30?',['The defendant','The People','The trial court on its own motion','Either party'],'The defendant','The remedy follows a verdict against the defendant.','The statute authorizes the defendant to move to set aside the verdict.'),
        q(1,'When is a CPL § 330.30 motion to set aside a verdict made?',['After verdict and before sentence','Before arraignment','Only after sentence','Before the jury is selected'],'After verdict and before sentence','The hook names both endpoints.','CPL § 330.30 operates in the verdict-to-sentence window.'),
        q(2,'Which is one statutory ground for the motion?',['Qualifying newly discovered evidence','A preference for a different judge','A routine scheduling conflict','A request to change venue before trial'],'Qualifying newly discovered evidence','The grounds are limited.','Qualifying newly discovered evidence is one of the three statutory categories.'),
        q(2,'TRUE or FALSE: A CPL § 330.30 motion may be filed for any reason the defendant considers unfair.',['True','False'],'False','The statute lists defined grounds.','False. The motion must rest on one of the statutory grounds.', 'tf'),
        q(3,'Sentence has already been imposed. What is the key CPL § 330.30 problem?',['Its statutory timing window has closed','The verdict never existed','The jury must reconvene automatically','The prosecutor must file the motion'],'Its statutory timing window has closed','The endpoint is sentence.','After sentence, remedies other than this pre-sentence motion must be considered.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"A CPL 330.30 motion follows which kind of verdict?",["A verdict of guilty", "A verdict of not guilty", "A civil verdict", "A grand jury vote"],"A verdict of guilty","The defendant wants it undone.","CPL 330.30: at any time after rendition of a verdict of guilty and before sentence."),
        q(1,"Under CPL 330.30, the court may do what to the verdict?",["Set it aside or modify it", "Only reduce the sentence", "Send it to a grand jury", "Seal it automatically"],"Set it aside or modify it","Two verbs.","CPL 330.30: the court may set aside or modify the verdict or any part thereof."),
        q(1,"How many grounds does CPL 330.30 list?",["Three", "One", "Two", "Five"],"Three","Count the numbered paragraphs.","CPL 330.30(1)-(3): legal error in the record, outside-court juror misconduct, and new evidence."),
        q(2,"Ground 1 covers record errors that would require what on appeal?",["Reversal or modification as of law", "A new grand jury", "A lower fine", "A jury poll"],"Reversal or modification as of law","Think appellate court.","CPL 330.30(1): a ground that, raised on appeal, would require reversal or modification as a matter of law."),
        q(2,"Juror misconduct under ground 2 must have happened:",["Out of the presence of the court", "In front of the judge", "After sentencing", "Before jury selection"],"Out of the presence of the court","The judge did not see it.","CPL 330.30(2): improper conduct during the trial, out of the presence of the court."),
        q(2,"Can the court set aside only part of the verdict?",["Yes: the verdict or any part", "No: all or nothing", "Only for felonies", "Only with the People's consent"],"Yes: the verdict or any part","Read the end of the opening sentence.","CPL 330.30: set aside or modify the verdict or any part thereof."),
        q(3,"A juror talked to a witness outside court, and the defendant knew before the verdict. Ground 2?",["No: it must be unknown before verdict", "Yes: misconduct is enough", "Yes, if the juror admits it", "No: juror conduct is never a ground"],"No: it must be unknown before verdict","Timing of what the defendant knew.","CPL 330.30(2): the misconduct must not have been known to the defendant prior to the verdict."),
        q(3,"New evidence existed, but the defense never looked for it. Does ground 3 apply?",["No: diligence must not find it", "Yes: any new evidence counts", "Yes, if the trial was short", "No: new evidence is never a ground"],"No: diligence must not find it","Due diligence.","CPL 330.30(3): evidence that could not have been produced at trial even with due diligence."),
        q(3,"New evidence under ground 3 must create a probability of:",["A more favorable verdict", "A longer sentence", "A new indictment", "A hung jury"],"A more favorable verdict","Favorable to whom?","CPL 330.30(3): a probability that the verdict would have been more favorable to the defendant."),
        q(3,"The improper conduct in ground 2 must have possibly affected:",["A substantial right of the defendant", "The judge's schedule", "The court's budget", "Only the People's case"],"A substantial right of the defendant","Whose right?","CPL 330.30(2): conduct which may have affected a substantial right of the defendant."),
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
        cardOnly(q(2,'A clerk is asked whether a delay in sentencing violates CPL § 380.30(1). What is the right first question?',['Whether the delay is unreasonable','Whether ten court days have passed','Whether thirty calendar days have passed','Whether ninety days have passed'],'Whether the delay is unreasonable','Use the statutory standard instead of selecting an invented fixed period.','The controlling inquiry is unreasonable delay, not a universal day count.')),
        q(2,'Which statement best describes the CPL § 380.30(1) rule on when sentence must be pronounced?',['A flexible reasonableness standard governs','Sentence may be postponed indefinitely','Every delay automatically voids the conviction','Only the defendant controls the date'],'A flexible reasonableness standard governs','Avoid turning the standard into an automatic number.','CPL § 380.30(1) requires promptness measured by reasonableness.'),
        cardOnly(q(3,'A study guide states “sentence must always occur within 20 days.” What is the best correction?',['No fixed 20 days: without unreasonable delay','The correct number is always 60 days','There is never any timing rule','Only misdemeanors may be sentenced'],'No fixed 20 days: without unreasonable delay','Use the statute’s actual wording.','The supplied official text supports a reasonableness standard rather than that fixed number.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"At sentencing, who gets the first chance to speak under CPL 380.50(1)?",["The prosecutor", "Defense counsel", "The defendant", "The victim"],"The prosecutor","Then the defense, then the defendant.","CPL 380.50(1): the court must accord the prosecutor an opportunity, then counsel for the defendant."),
        q(1,"A person is convicted of a felony. Is a written pre-sentence report required?",["Yes, unless a statutory waiver applies", "No, never", "Only if the defense asks", "Only for class A felonies"],"Yes, unless a statutory waiver applies","Subdivision 1 covers felonies.","CPL 390.20(1): the court must order an investigation and may not sentence until it receives the report (see subd. 4)."),
        q(1,"After a misdemeanor conviction, is a pre-sentence report always required?",["No: only for certain sentences", "Yes, always", "No: it is never allowed", "Only if the victim asks"],"No: only for certain sentences","Subdivision 2 lists sentences.","CPL 390.20(2): not required, but needed before probation, jail over 180 days, or consecutive terms over 90 days."),
        q(2,"A misdemeanor sentence of probation generally requires:",["A written pre-sentence report", "A grand jury vote", "A jury trial", "A victim statement"],"A written pre-sentence report","Paragraph (a).","CPL 390.20(2)(a): the court may not sentence to probation unless it has received a written report (with a listed exception)."),
        q(2,"May a court order a pre-sentence report even when none is required?",["Yes, in its discretion", "No, never", "Only for felonies", "Only with the People's consent"],"Yes, in its discretion","Subdivision 3.","CPL 390.20(3): the court may, in its discretion, order a pre-sentence investigation and report in any case."),
        q(3,"Two consecutive misdemeanor jail terms total 120 days. Is a report needed?",["Yes: over 90 days in total", "No: each term is short", "No: misdemeanors never need one", "Only if over 180 days"],"Yes: over 90 days in total","Consecutive terms are added up.","CPL 390.20(2)(c): consecutive sentences of imprisonment aggregating more than ninety days need a report."),
        q(3,"A single misdemeanor jail term of 150 days. Is a report required by 390.20(2)?",["No: it is not over 180 days", "Yes: it is over 90 days", "Yes: any jail term needs one", "Only for felonies"],"No: it is not over 180 days","Single terms and consecutive terms differ.","CPL 390.20(2)(b): a single term needs a report only in excess of 180 days; the 90-day rule is for consecutive terms."),
        q(3,"A felony victim asks at least 10 days ahead to speak at sentencing. Under CPL 380.50(2)(b), the court:",["Must let the victim make a statement", "May refuse for any reason", "Must read it in private", "Must ask the jury first"],"Must let the victim make a statement","Shall, not may.","CPL 380.50(2)(b): for a felony, if requested at least ten days before, the court shall accord the victim the right to speak."),
      ]
    }),
    card({
      id:'qr_cpl_063_order_examination', art:'s4_exam_duo', series:4, number:12, name:'Exam Duo', category:'FITNESS & EXAMINATIONS', emoji:'👓', law:'CPL', section:'730.30', cite:'CPL § 730.30(1)', hook:'Concern triggers examination',
      summary:'When the court believes a defendant may be incapacitated, it must issue an order of examination during the procedural windows stated in the statute.',
      context:'The examination is performed by two qualified psychiatric examiners, subject to article 730 procedures.', example:'The court need not wait for proof of incapacity before ordering the examination.',
      panel:{kind:'trigger',caption:'Fitness examination',steps:['COURT BELIEVES INCAPACITY MAY EXIST','ORDER OF EXAMINATION','TWO QUALIFIED EXAMINERS']},
      bank:[
        q(1,'What triggers the court’s duty to issue an order of examination?',['Belief the defendant may be incapacitated','Proof the defendant is incapacitated','A defense request in every criminal case','A post-sentence claim of legal error'],'Belief the defendant may be incapacitated','The court need not wait for certainty.','The statute acts on a belief that incapacity may exist.'),
        q(1,'Under CPL Article 730, how many qualified psychiatric examiners examine the defendant?',['Two','One','Three','Twelve'],'Two','Think Exam Duo.','Article 730 procedure uses two qualified psychiatric examiners.'),
        q(2,'TRUE or FALSE: The court must wait until incapacity is conclusively proved before ordering an examination.',['True','False'],'False','The order investigates the concern.','False. A belief that the defendant may be incapacitated triggers the order.', 'tf'),
        q(2,'A judge sees facts suggesting the defendant may not be fit. What is the statutory next step?',['Issue an order of examination in time','Sentence immediately','Dismiss every charge automatically','Ask the jury to decide fitness'],'Issue an order of examination in time','Concern triggers examination.','CPL § 730.30(1) calls for an examination order when the concern arises.'),
        q(3,'Which sequence best states the CPL Article 730 examination procedure?',['Possible incapacity → order → two examiners','Conviction → dismissal → one examiner','Jury note → private response → sentence','Arrest → indictment → civil trial'],'Possible incapacity → order → two examiners','Follow the panel.','The procedure moves from judicial concern to an order and a two-examiner evaluation.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"An \"incapacitated person\" under CPL 730.10 lacks capacity because of:",["Mental disease or defect", "Lack of a lawyer", "A language barrier", "Being under 18"],"Mental disease or defect","The cause is named in the definition.","CPL 730.10(1): as a result of mental disease or defect, lacks capacity to understand the proceedings or assist."),
        q(1,"An order of examination is issued to whom?",["An appropriate director", "The district attorney", "The defense lawyer", "The jury"],"An appropriate director","Read the definition in 730.10(2).","CPL 730.10(2): an order issued to an appropriate director, directing that the person be examined."),
        q(1,"Which is one kind of \"director\" under CPL 730.10(4)?",["A state hospital director", "A police commissioner", "A school principal", "A court reporter"],"A state hospital director","Mental health facilities.","CPL 730.10(4)(a): the director of a state hospital operated by the office of mental health, among others."),
        q(2,"Both examiners find the defendant fit, and no one moves for a hearing. What happens?",["The criminal action proceeds", "A new exam is ordered", "The case is dismissed", "The defendant is committed"],"The criminal action proceeds","No motion, no hearing.","CPL 730.30(2): if no motion for a hearing is made, the criminal action against the defendant must proceed."),
        q(2,"Both examiners find the defendant fit. Must the court hold a hearing if the DA moves for one?",["Yes", "No", "Only if the defense agrees", "Only for felonies"],"Yes","A party's motion changes may to must.","CPL 730.30(2): the court must conduct a hearing upon motion by the defendant or the district attorney."),
        q(3,"Arraigned on an information, the defendant awaits sentence after trial. Can an exam be ordered?",["Yes: until sentence is imposed", "No: only before trial", "No: only on felony complaints", "Only with the DA's consent"],"Yes: until sentence is imposed","Check the window for non-felony-complaint cases.","CPL 730.30(1): after arraignment on an instrument other than a felony complaint and before sentence is imposed."),
        q(3,"Both examiners said fit, but after a hearing the court is not satisfied. What next?",["Exams by different examiners", "Proceed to trial anyway", "Dismiss the case", "Let the jury decide"],"Exams by different examiners","The court keeps looking.","CPL 730.30(2): it must issue a further order of examination by different psychiatric examiners."),
        q(3,"Both examiners find the defendant incapacitated. May the court hold a hearing on its own motion?",["Yes, and must if a party moves", "No: it must accept the reports", "Only after sentencing", "Only with the jury's consent"],"Yes, and must if a party moves","Same pattern as subdivision 2.","CPL 730.30(3): the court may hold a hearing on its own motion and must on motion of the defendant or DA."),
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
        q(3,'An offense authorizes imprisonment exceeding one year. What is it under the general definition?',['Felony','Misdemeanor','Violation','Petty offense only'],'Felony','Cross the one-year boundary.','A felony is an offense for which more than one year may be imposed.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Under PL 10.00(1), an offense is conduct for which the law provides:",["Imprisonment or a fine", "Only imprisonment", "Only probation", "A civil lawsuit"],"Imprisonment or a fine","Either kind of sentence.","PL 10.00(1): conduct for which a sentence to a term of imprisonment or to a fine is provided by law."),
        q(1,"Can a local law or ordinance create an offense?",["Yes: local laws and ordinances count", "No: only state statutes", "Only the Penal Law", "Only federal law"],"Yes: local laws and ordinances count","The definition reaches political subdivisions.","PL 10.00(1): includes any law, local law or ordinance of a political subdivision of this state."),
        q(1,"Which law defines what a \"traffic infraction\" is?",["Vehicle and Traffic Law section 155", "Penal Law section 55.05", "CPL section 1.20", "Local police rules"],"Vehicle and Traffic Law section 155","Not the Penal Law itself.","PL 10.00(2): any offense defined as a traffic infraction by section 155 of the vehicle and traffic law."),
        q(2,"A traffic infraction carries up to 30 days. Is it a misdemeanor under PL 10.00(4)?",["No: traffic infractions are excluded", "Yes: it is over 15 days", "Yes, if charged by information", "Only on a second offense"],"No: traffic infractions are excluded","Read the misdemeanor definition closely.","PL 10.00(4): a misdemeanor is an offense, other than a traffic infraction, punishable by more than 15 days."),
        q(2,"An offense authorizes exactly one year in jail. Which grade?",["Misdemeanor", "Felony", "Violation", "Traffic infraction"],"Misdemeanor","Felony needs more than one year.","PL 10.00(4)-(5): a misdemeanor cannot exceed one year; a felony must allow more than one year."),
        q(2,"An agency rule, authorized by law, sets a fine for some conduct. Is the conduct an offense?",["Yes: authorized rules count", "No: only statutes count", "Only if jail is possible", "Only if a court approves"],"Yes: authorized rules count","The definition ends with rules and regulations.","PL 10.00(1): includes any order, rule or regulation of a governmental instrumentality authorized by law."),
        q(3,"An offense (not a traffic infraction) authorizes up to 16 days in jail. Which grade?",["Misdemeanor", "Violation", "Felony", "Traffic infraction"],"Misdemeanor","Fifteen days is the line.","PL 10.00(3)-(4): more than fifteen days, up to one year, makes it a misdemeanor."),
        q(3,"An offense authorizes up to one year and one day in jail. Which grade?",["Felony", "Misdemeanor", "Violation", "Traffic infraction"],"Felony","Just past the one-year line.","PL 10.00(5): a felony is an offense for which imprisonment in excess of one year may be imposed."),
        q(3,"Do the PL 10.00 definitions apply throughout the Penal Law?",["Unless a later section says otherwise", "Yes, with no exceptions", "Only in article 10", "Only to felonies"],"Unless a later section says otherwise","Read the opening words.","PL 10.00: except where different meanings are expressly specified in subsequent provisions of this chapter."),
        q(3,"An offense (not a traffic infraction) is punishable only by a fine. Which grade?",["Violation", "Misdemeanor", "Felony", "Not an offense"],"Violation","More than 15 days of jail is impossible.","PL 10.00(3): a violation is an offense for which imprisonment in excess of fifteen days cannot be imposed."),
      ]
    }),
    card({
      id:'qr_pl_065_person', art:'s5_the_many', series:5, number:2, name:'The Many', category:'PENAL LAW DEFINITIONS', emoji:'👥', law:'PL', section:'10.00', cite:'PL § 10.00(7)', hook:'People and entities',
      summary:'“Person” means a human being and, where appropriate, the organizations and governmental entities specified in the statute.',
      context:'A human being is always within the definition; whether an organization is included depends on context.', example:'A corporation can be a statutory person where the provision appropriately applies.',
      panel:{kind:'diff',caption:'Who can be a person?',heads:['ALWAYS','WHERE APPROPRIATE'],yes:['HUMAN BEING'],no:['PUBLIC OR PRIVATE CORPORATION','UNINCORPORATED ASSOCIATION','GOVERNMENT / INSTRUMENTALITY']},
      bank:[
        q(1,'Who is always included in the Penal Law definition of “person”?',['A human being','Only a corporation','Only a government agency','Only an unincorporated association'],'A human being','Start with the unconditional part.','PL § 10.00(7) includes a human being.'),
        q(1,'Can an organization fall within the definition of “person”?',['Yes, where appropriate','No, never','Only after a jury vote','Only in civil actions'],'Yes, where appropriate','The definition extends beyond humans in context.','Specified organizations and governmental entities may qualify where appropriate.'),
        q(2,'A statute applies to a corporation in a context where the organizational definition is appropriate. Is “person” necessarily limited to an individual?',['No, the corporation may be a person','Yes, person always excludes entities','Yes, unless it has one shareholder','No, but only a court clerk counts'],'No, the corporation may be a person','Context controls the organizational branch.','The definition can include a public or private corporation where appropriate.'),
        q(2,'TRUE or FALSE: Every use of “person” automatically includes every listed type of organization without regard to context.',['True','False'],'False','The statute says “where appropriate.”','False. Context determines use of the organizational portion.', 'tf'),
        q(3,'Which reading best matches PL § 10.00(7)?',['Humans; listed entities where appropriate','Only natural persons can ever qualify','Only corporations can qualify','The word has no statutory definition'],'Humans; listed entities where appropriate','Keep both halves of the definition.','That formulation preserves the unconditional human and contextual entity components.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Which is NOT listed in the PL 10.00(7) definition of person?",["An animal", "A partnership", "A public corporation", "A governmental instrumentality"],"An animal","Humans and organizations only.","PL 10.00(7): a human being and, where appropriate, corporations, associations, partnerships and governments."),
        q(2,"Is an unincorporated association a \"person\" under PL 10.00(7)?",["Yes, where appropriate", "No, never", "Only if it incorporates", "Only in traffic cases"],"Yes, where appropriate","It is on the list, with a condition.","PL 10.00(7): where appropriate, an unincorporated association is included."),
        q(3,"A public corporation and a private corporation: which may be a \"person\"?",["Both, where appropriate", "Only the private one", "Only the public one", "Neither"],"Both, where appropriate","The definition names both.","PL 10.00(7): where appropriate, a public or private corporation."),
        q(3,"A later Penal Law section expressly defines \"person\" differently. Which definition applies there?",["The later section's definition", "PL 10.00(7) always", "Whichever is broader", "Neither one"],"The later section's definition","Read the opening words of 10.00.","PL 10.00: its definitions apply except where different meanings are expressly specified in later provisions."),
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
        q(3,'A record says “unclassified misdemeanor.” How should it be treated under § 55.05?',['As a valid third misdemeanor category','As a class C misdemeanor','As a felony','As a violation automatically'],'As a valid third misdemeanor category','Do not invent a letter class.','Unclassified misdemeanor is expressly part of the classification scheme.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"PL 55.05 classifies felonies and misdemeanors for what purpose?",["For the purpose of sentence", "For arrest powers", "For jury size", "For venue"],"For the purpose of sentence","Read the first line of each subdivision.","PL 55.05(1)-(2): felonies and misdemeanors are classified for the purpose of sentence."),
        q(2,"How many felony classes does PL 55.05(1) list?",["Five", "Four", "Six", "Three"],"Five","A through E.","PL 55.05(1): felonies are classified into five categories, class A through class E."),
        q(2,"Which is NOT a felony class under PL 55.05?",["Class F", "Class A", "Class C", "Class E"],"Class F","The letters stop at E.","PL 55.05(1): the felony classes are A, B, C, D and E."),
        q(3,"How many misdemeanor categories does PL 55.05(2) list?",["Three", "Two", "Four", "Five"],"Three","Two letters plus one more.","PL 55.05(2): class A, class B, and unclassified misdemeanors."),
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
        q(2,'Under PL § 55.10(2)(c), an offense defined outside the Penal Law carries more than fifteen days but not more than one year of imprisonment under the law defining it. What is it deemed?',['Unclassified misdemeanor','Class A misdemeanor automatically','Class B misdemeanor automatically','Class E felony'],'Unclassified misdemeanor','Sentence-defined differs from designation-only.','The general sentence-based classification is unclassified misdemeanor.'),
        q(2,'TRUE or FALSE: A traffic infraction becomes a misdemeanor merely because of the sentence otherwise described in § 55.10.',['True','False'],'False','The statute protects the traffic-infraction designation.','False. The traffic-infraction paragraph prevents that reclassification.', 'tf'),
        cardOnly(q(3,'What is the safest classification workflow for an outside-law offense?',['Check label, sentence and exceptions','Always call it class A','Always call it unclassified','Use the offense name alone'],'Check label, sentence and exceptions','Different paragraphs use different facts.','PL § 55.10 requires attention to designation, sentence, and exceptions.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Where is the class of a Penal Law felony found?",["In the section or article defining it", "In the CPL", "In the court's order", "In the indictment only"],"In the section or article defining it","The Penal Law labels its own felonies.","PL 55.10(1)(a): the classification of each felony in this chapter is expressly designated where it is defined."),
        q(1,"Each misdemeanor defined in the Penal Law itself is:",["Class A or class B", "Unclassified", "Class A only", "Class A, B or C"],"Class A or class B","Unclassified is for outside laws.","PL 55.10(2)(a): each misdemeanor defined in this chapter is either a class A or a class B misdemeanor."),
        q(1,"Are Penal Law violations labeled as violations where they are defined?",["Yes: each is expressly designated", "No, never", "Only felonies are labeled", "Only if they carry jail"],"Yes: each is expressly designated","Subdivision 3 opens with this.","PL 55.10(3): every violation defined in this chapter is expressly designated as such."),
        q(2,"An outside law allows up to 18 months in jail but names no class. It is deemed:",["A class E felony", "A class A misdemeanor", "An unclassified misdemeanor", "A violation"],"A class E felony","More than one year.","PL 55.10(1)(b): an outside offense with imprisonment over one year is deemed a class E felony."),
        q(2,"An outside law calls an offense a misdemeanor but allows only 10 days in jail. It is deemed:",["A violation", "A class A misdemeanor", "An unclassified misdemeanor", "A class E felony"],"A violation","The sentence beats the label.","PL 55.10(3)(a): notwithstanding any other designation, jail not over 15 days makes it a violation."),
        q(2,"An unlabeled outside offense is punishable only by a fine. It is deemed:",["A violation", "A misdemeanor", "A felony", "A traffic infraction"],"A violation","Fine only.","PL 55.10(3)(a): an outside offense whose only sentence is a fine is deemed a violation."),
        q(3,"An old pre-Penal-Law local law allows 30 days, but the offense was not a crime before then. It is deemed:",["A violation", "An unclassified misdemeanor", "A class A misdemeanor", "A class E felony"],"A violation","Paragraph (b) of subdivision 3.","PL 55.10(3)(b): over 15 days in a law enacted before this chapter, but not a crime before it took effect."),
        q(3,"Two unlabeled outside laws: one allows 15 days of jail, the other 16. Which is deemed a violation?",["The 15-day one", "The 16-day one", "Both", "Neither"],"The 15-day one","Not in excess of fifteen days.","PL 55.10(3)(a) covers jail not over 15 days; 16 days makes it an unclassified misdemeanor under 55.10(2)(c)."),
      ]
    }),
    card({
      id:'qr_pl_068_felony_fines', art:'s5_double_gain', series:5, number:5, name:'Double Gain', category:'FELONY FINES', emoji:'🪙', law:'PL', section:'80.00', cite:'PL § 80.00', hook:'General rule, then special ceiling',
      summary:'For an individual, the general felony fine may not exceed the higher of five thousand dollars or double the defendant’s gain, while the section supplies special alternatives for article 496 and listed drug felonies.',
      context:'The applicable subdivision must be selected before choosing a ceiling; the section does not apply to corporations.', example:'If double the gain exceeds five thousand dollars and the gain finding is supported, the higher alternative may govern.',
      panel:{kind:'diff',caption:'General individual felony route',heads:['BASELINE','ALTERNATIVES'],yes:['$5,000'],no:['DOUBLE GAIN','ARTICLE 496 TRIPLE GAIN','LISTED DRUG SCHEDULE']},
      bank:[
        q(1,'Under PL § 80.00(1)(a), what is the general maximum fine for a felony committed by an individual?',['Five thousand dollars','One thousand dollars','Five hundred dollars','Two hundred fifty dollars'],'Five thousand dollars','This is the general felony figure.','The general felony provision includes a $5,000 route.'),
        q(1,'Under PL § 80.00(1)(b), instead of the $5,000 maximum, a felony fine may be up to what amount?',['Double the defendant’s gain','Half the defendant’s gain','Exactly the victim’s loss in every case','No gain-based alternative'],'Double the defendant’s gain','Think Double Gain.','The general alternative is double the defendant’s gain, when applicable.'),
        q(2,'A defendant gained $4,000 from a felony, and no special fine schedule applies. Under PL § 80.00(1), what is the highest fine available?',['$8,000 (double the gain)','$5,000','$4,000','$1,000'],'$8,000 (double the gain)','Compare $5,000 with twice $4,000.','Twice the gain is $8,000, higher than the general fixed-dollar route.'),
        q(2,'TRUE or FALSE: The $5,000 figure is the only possible felony fine ceiling under § 80.00.',['True','False'],'False','The statute has gain and offense-specific alternatives.','False. Other subdivisions and alternatives may supply a higher ceiling.', 'tf'),
        cardOnly(q(3,'Before selecting a felony fine ceiling, what should the clerk identify?',['The subdivision and any special route','The $5,000 route without checking gain','The double-gain route in every felony','The nearest misdemeanor ceiling'],'The subdivision and any special route','General rule, then special ceiling.','The statute’s gain, article 496, drug-felony, and other provisions must be distinguished.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Who fixes the amount of a felony fine under PL 80.00(1)?",["The court", "The jury", "The prosecutor", "The victim"],"The court","Fixed by whom?","PL 80.00(1): a felony fine is an amount, fixed by the court, not exceeding the higher of the listed limits."),
        q(1,"Does PL 80.00 apply when the defendant is a corporation?",["No: corporations are excepted", "Yes, always", "Only for drug felonies", "Only above $5,000"],"No: corporations are excepted","Subdivision 4.","PL 80.00(4): the provisions of this section shall not apply to a corporation."),
        q(1,"Under PL 80.00(2), \"gain\" is money or property derived from:",["The commission of the crime", "The defendant's salary", "The victim's losses", "The court's costs"],"The commission of the crime","Where did it come from?","PL 80.00(2): gain is the money or value of property derived from the commission of the crime, less returns."),
        q(2,"What is subtracted when computing gain under PL 80.00(2)?",["Property returned or seized before sentence", "The defendant's legal fees", "The victim's medical bills", "Taxes the defendant paid"],"Property returned or seized before sentence","What the defendant no longer has.","PL 80.00(2): less property returned to the victim or seized by or surrendered to lawful authority before sentence."),
        q(2,"When the court uses the double-gain route, what must it do?",["Make a finding of the gain amount", "Ask the jury to vote", "Get the People's consent", "Order restitution first"],"Make a finding of the gain amount","Subdivision 3.","PL 80.00(3): with a paragraph b fine, the court shall make a finding as to the amount of the defendant's gain."),
        q(2,"The record lacks evidence to support a gain finding. What may the court do?",["Hold a hearing on the issue", "Guess the amount", "Dismiss the case", "Ask the jury"],"Hold a hearing on the issue","The court can build the record.","PL 80.00(3): if the record lacks sufficient evidence, the court may conduct a hearing upon such issues."),
        q(3,"The defendant took $9,000; $3,000 went back to the victim before sentence. Double-gain cap?",["$12,000", "$18,000", "$6,000", "$5,000"],"$12,000","Subtract first, then double.","PL 80.00(2): gain is $9,000 less $3,000 returned = $6,000; double gain is $12,000, above $5,000."),
        q(3,"The defendant's gain was $2,000. What is the felony fine cap under 80.00(1)(a)-(b)?",["$5,000", "$4,000", "$2,000", "$10,000"],"$5,000","Take the higher of the two.","PL 80.00(1): double gain is $4,000; the higher of $5,000 or $4,000 is $5,000."),
        q(3,"A felony is defined in the Vehicle and Traffic Law. Which fine rule applies?",["The VTL law defining the crime", "PL 80.00(1)(a) only", "The double-gain rule", "The drug-felony schedule"],"The VTL law defining the crime","Subdivision 6.","PL 80.00(6): a fine for a felony set forth in the VTL follows the law that defines the crime."),
        q(3,"All $7,000 the defendant got was seized by police before sentence. What is the gain?",["$0", "$7,000", "$14,000", "$3,500"],"$0","Seized property comes off.","PL 80.00(2): property seized by or surrendered to lawful authority before sentence is subtracted."),
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
        cardOnly(q(3,'A defendant gained money through a misdemeanor. What additional route should be checked?',['The alternative fine of up to double gain','The felony drug schedule only','An automatic $5,000 fine','A jury-set civil award'],'The alternative fine of up to double gain','The general class amount may not be the only route.','Subdivision 5 provides a gain-based alternative for a misdemeanor or violation.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"For a class B misdemeanor, who sets the fine and up to how much?",["The court, up to $500", "The jury, up to $500", "The court, up to $1,000", "The DA, any amount"],"The court, up to $500","Subdivision 2.","PL 80.05(2): an amount, fixed by the court, not exceeding five hundred dollars."),
        q(1,"An unclassified misdemeanor's fine is set according to:",["The law that defines the crime", "The $1,000 class A cap", "The $500 class B cap", "The jury's choice"],"The law that defines the crime","Unclassified means outside the classes.","PL 80.05(3): in accordance with the provisions of the law or ordinance that defines the crime."),
        q(1,"Does PL 80.05 apply when the defendant is a corporation?",["No: corporations are excepted", "Yes, always", "Only for violations", "Only above $1,000"],"No: corporations are excepted","Subdivision 6.","PL 80.05(6): the provisions of this section shall not apply to a corporation."),
        q(2,"A violation is defined in a local law that sets its own fine. Which amount applies?",["The amount in that local law", "$250 maximum regardless", "$500", "$1,000"],"The amount in that local law","Outside laws can set their own fines.","PL 80.05(4): for a violation defined outside this chapter with a fine specified, that law or ordinance controls."),
        q(2,"Instead of the usual fine, a court may impose up to double the gain when:",["The defendant gained money or property", "The defendant has a prior record", "The victim asks for it", "The jury recommends it"],"The defendant gained money or property","Subdivision 5.","PL 80.05(5): if the defendant gained money or property through the offense, up to double the gain."),
        q(2,"A class A misdemeanor under PL 215.80 may carry a fine of up to:",["Double the property's value", "Triple the gain", "$5,000 flat", "$250 only"],"Double the property's value","A special rule in subdivision 1.","PL 80.05(1): a 215.80 sentence may include a fine of double the value of the property unlawfully disposed of."),
        q(3,"A Penal Law violation earned the defendant $400. What is the highest fine available?",["$800", "$250", "$400", "$1,000"],"$800","Compare $250 with double the gain.","PL 80.05(4) caps a violation at $250, but 80.05(5) allows up to double the $400 gain: $800."),
        q(3,"When a fine is imposed under PL § 80.05(5), which provisions also apply to the sentence?",["PL 80.00(2) and (3)", "PL 55.05", "CPL 30.30", "PL 10.00(7)"],"PL 80.00(2) and (3)","Gain is defined elsewhere.","PL 80.05(5): subdivisions two and three of section 80.00 apply to the sentence."),
        q(3,"A class A misdemeanor brought a $300 gain. What is the highest fine available?",["$1,000", "$600", "$300", "$500"],"$1,000","Compare $1,000 with double the gain.","PL 80.05(1) allows $1,000; double the gain under 80.05(5) is only $600."),
        q(3,"For a conviction under ECL 11-1904, the 80.05(5) double-gain fine may not exceed:",["$5,000", "$1,000", "$10,000", "$250"],"$5,000","A special cap in subdivision 5.","PL 80.05(5): the amount fixed for an ECL 11-1904 conviction shall not exceed five thousand dollars."),
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
        q(3,'Which statement is most precise?',['A violation is an offense but not a crime','A violation is a class C misdemeanor','Every offense is a crime','A violation authorizes more than one year'],'A violation is an offense but not a crime','Keep offense and crime distinct.','PL § 10.00 defines crime as misdemeanor or felony, excluding violations.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Can a traffic infraction be a \"violation\" under PL 10.00(3)?",["No: it is excluded by definition", "Yes, always", "Only if fine only", "Only in New York City"],"No: it is excluded by definition","Read the words \"other than.\"","PL 10.00(3): a violation is an offense, other than a traffic infraction, with no more than 15 days of jail."),
        q(2,"A violation allows no more than 15 days of jail. May the court impose 20?",["No: over 15 days cannot be imposed", "Yes, with consent", "Yes, for repeat offenders", "Only on weekends"],"No: over 15 days cannot be imposed","The definition sets a hard ceiling.","PL 10.00(3): a violation is one for which imprisonment in excess of fifteen days cannot be imposed."),
        q(3,"Which pair is NOT made up of crimes under PL 10.00?",["A violation and a traffic infraction", "A class A misdemeanor and a felony", "An unclassified misdemeanor and a felony", "A class B misdemeanor and a felony"],"A violation and a traffic infraction","Crime has only two members.","PL 10.00(6): crime means a misdemeanor or a felony; violations and traffic infractions are not crimes."),
      ]
    }),
    card({
      id:'s5_concept_split_verdict', art:'s5_split_verdict', series:5, number:8, name:'Split Verdict', category:'MISDEMEANORS', emoji:'⚖️', law:'PL', section:'55.05', cite:'PL §§ 10.00(4), 55.05(2)', hook:'Range first; class second',
      summary:'A misdemeanor generally authorizes more than fifteen days but no more than one year of imprisonment; its classification is class A, class B, or unclassified.',
      context:'The grade definition and the classification list answer different questions and should not be collapsed.', example:'A six-month maximum supports misdemeanor grade; the defining law determines its class.',
      panel:{kind:'trigger',caption:'Classifying a misdemeanor',steps:['CONFIRM >15 DAYS AND ≤1 YEAR','READ THE DEFINING LAW','A, B, OR UNCLASSIFIED']},
      bank:[
        q(1,'Which authorized-imprisonment range generally defines a misdemeanor?',['Over fifteen days, up to one year','No more than fifteen days','More than one year','Exactly five years'],'Over fifteen days, up to one year','Use both boundary points.','PL § 10.00 places misdemeanors between violations and felonies.'),
        q(1,'Which is a valid misdemeanor classification?',['Unclassified','Class C','Class D','A-II'],'Unclassified','The third category has no letter.','PL § 55.05 lists class A, class B, and unclassified.'),
        q(2,'An offense has a six-month maximum. What does that fact establish under the general definition?',['Misdemeanor grade','Its exact class is automatically B','Felony grade','Violation grade'],'Misdemeanor grade','The sentence range gives the grade, not always the class.','Six months falls in misdemeanor territory; the defining law supplies the classification.'),
        q(2,'TRUE or FALSE: Every misdemeanor must be either class A or class B.',['True','False'],'False','Remember the third category.','False. Unclassified misdemeanor is also a statutory category.', 'tf'),
        cardOnly(q(3,'Which method avoids mixing grade with class?',['Grade from the range; class from the law','Call every misdemeanor class A','Use the offense name to invent a class','Treat six months as a violation'],'Grade from the range; class from the law','Range first; class second.','The two statutes provide related but distinct classification steps.')),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"What is the longest jail term a misdemeanor can carry?",["One year", "Fifteen days", "Six months", "Two years"],"One year","Up to, not over.","PL 10.00(4): imprisonment in excess of one year cannot be imposed for a misdemeanor."),
        q(2,"Is a misdemeanor a crime under PL 10.00?",["Yes", "No", "Only class A", "Only if jail is imposed"],"Yes","Crime has two members.","PL 10.00(6): crime means a misdemeanor or a felony."),
        q(2,"Penal Law misdemeanors are class A or B. Which category covers some outside-law offenses?",["Unclassified", "Class A", "Class B", "Class C"],"Unclassified","The third category.","PL 55.10(2)(a) makes Penal Law misdemeanors class A or B; 55.10(2)(c) deems some outside offenses unclassified."),
        q(3,"An offense (not a traffic infraction) allows exactly 15 days of jail. Is it a misdemeanor?",["No: it must exceed fifteen days", "Yes", "Only if a fine is added", "Only as class B"],"No: it must exceed fifteen days","Fifteen days is still a violation.","PL 10.00(3)-(4): a misdemeanor needs imprisonment in excess of fifteen days; 15 or fewer is a violation."),
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
        q(3,'Which statement correctly combines definition and classification?',['Over one year = felony; law assigns A–E','Every felony is class A','A one-year maximum is always a felony','Felonies: A, B and unclassified'],'Over one year = felony; law assigns A–E','Use grade, then class.','PL §§ 10.00 and 55.05 supply those two parts of the framework.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Is every felony a crime under PL 10.00?",["Yes: crime includes felonies", "No", "Only class A", "Only violent felonies"],"Yes: crime includes felonies","Crime has two members.","PL 10.00(6): crime means a misdemeanor or a felony."),
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
        q(3,'Which statement preserves the structure of § 55.05?',['A–E; only class A splits (A-I, A-II)','All felony classes split into I and II','Misdemeanors split into A-I and A-II','A-II is a separate letter class after E'],'A–E; only class A splits (A-I, A-II)','Keep subclass within class A.','That is the classification structure stated by the statute.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Which felony class is divided into subclasses?",["Class A only", "Class B", "Classes A and B", "Every class"],"Class A only","Only one class splits.","PL 55.05(1): class A felonies are subclassified into A-I and A-II."),
        q(2,"A record shows a \"class A-III felony.\" Is that a PL 55.05 category?",["No: only A-I and A-II exist", "Yes: class A has three", "Yes, for drug crimes", "Only at sentencing"],"No: only A-I and A-II exist","Count the subclasses.","PL 55.05(1): class A felonies have two subclasses, I and II, known as A-I and A-II."),
      ]
    }),
    card({
      id:'s5_concept_triple_take', art:'s5_triple_take', series:5, number:11, name:'Triple Take', category:'SPECIAL FELONY FINES', emoji:'🪙', law:'PL', section:'80.00', cite:'PL § 80.00(1)(b)', hook:'Article 496 can reach triple gain',
      summary:'For a felony defined in Penal Law article 496, the gain-based alternative may reach three times the defendant’s gain; the general gain alternative for other covered felonies is double gain.',
      context:'The triple-gain route is tied to the specified article 496 conviction and does not replace every other fine rule.', example:'For an article 496 felony with gain of $10,000, the gain multiplier route may reach $30,000.',
      panel:{kind:'diff',caption:'Gain multipliers',heads:['GENERAL GAIN ROUTE','ARTICLE 496'],yes:['UP TO 2× GAIN'],no:['UP TO 3× GAIN']},
      bank:[
        q(1,'Under PL § 80.00(1)(b), for which felonies may the gain-based fine reach three times the gain?',['Felonies defined in article 496','Every misdemeanor','Every class E felony','All violations'],'Felonies defined in article 496','The special route is article-specific.','The provision singles out crimes defined in article 496.'),
        q(1,'Under PL § 80.00(1)(b), for a felony not defined in article 496, the gain-based fine may not exceed:',['Double gain','Triple gain','Half gain','Four times gain'],'Double gain','Compare the ordinary and special multipliers.','The general alternative is twice the defendant’s gain.'),
        q(2,'An article 496 felony produced $10,000 in gain. Under PL § 80.00(1)(b), what is the highest gain-based fine?',['$30,000','$20,000','$10,000','$5,000'],'$30,000','Three times ten thousand.','The special multiplier produces $30,000 before other statutory issues are considered.'),
        q(2,'TRUE or FALSE: Every felony automatically uses triple gain.',['True','False'],'False','Triple gain is tied to article 496.','False. The general gain route is double, and special routes require their predicates.', 'tf'),
        q(3,'Which comparison is accurate?',['Most felonies 2× gain; article 496 up to 3×','Every felony: exactly 3× gain','Misdemeanor: 3× gain; felony: no gain route','Article 496: only the $5,000 route'],'Most felonies 2× gain; article 496 up to 3×','Keep the special rule narrow.','That comparison tracks the two gain alternatives in the official text.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(3,"An article 496 felony brought a $1,000 gain. What is the highest fine available?",["$5,000", "$3,000", "$2,000", "$1,000"],"$5,000","Compare triple gain with $5,000.","PL 80.00(1): the higher of $5,000 or, for article 496, up to triple the $1,000 gain ($3,000): $5,000."),
        q(3,"Article 496 felony: $4,000 taken, $1,000 returned before sentence. Triple-gain cap?",["$9,000", "$12,000", "$6,000", "$5,000"],"$9,000","Subtract first, then triple.","PL 80.00(2): gain is $4,000 less $1,000 returned = $3,000; triple gain is $9,000, above $5,000."),
      ]
    }),
    card({
      id:'s5_concept_vault_voltage', art:'s5_vault_voltage', series:5, number:12, name:'Vault Voltage', category:'DRUG FELONY FINES', emoji:'⚡', law:'PL', section:'80.00', cite:'PL § 80.00(1)(c)', hook:'100, 50, 30, 15',
      summary:'For listed article 220 or 221 drug felonies, the special schedule is $100,000 for A-I, $50,000 for A-II, $30,000 for B, and $15,000 for C.',
      context:'The special schedule applies only to the listed drug-felony classes; the court must also consider the statutory factors, including gain, proportionality, victim impact, and economic circumstances.', example:'A listed class B drug felony has a special schedule amount of $30,000.',
      panel:{kind:'clock',caption:'Listed drug-felony schedule',steps:[{n:'$100K',label:'A-I',from:'listed article 220/221 felony'},{n:'$50K',label:'A-II',from:'listed article 220/221 felony'},{n:'$30K / $15K',label:'B / C',from:'listed article 220/221 felony'}]},
      bank:[
        q(1,'Under PL § 80.00(1)(c), what is the maximum fine for a class B felony defined in Penal Law article 220 or 221?',['$30,000','$15,000','$50,000','$100,000'],'$30,000','Use 100, 50, 30, 15.','PL § 80.00(1)(c) lists $30,000 for class B.'),
        q(1,'Under PL § 80.00(1)(c), what is the maximum fine for a class A-II felony defined in Penal Law article 220 or 221?',['$50,000','$100,000','$30,000','$15,000'],'$50,000','A-II is the second figure.','The listed A-II amount is $50,000.'),
        q(2,'A class C felony defined in Penal Law article 220 is being sentenced. Under PL § 80.00(1)(c), what is the maximum fine?',['$15,000','$30,000','$50,000','$5,000 only'],'$15,000','C is the fourth listed class.','The special class C amount is $15,000.'),
        q(2,'TRUE or FALSE: The special schedule says A-I $100,000 and A-II $50,000.',['True','False'],'True','The A-I amount is twice the A-II amount.','True. Those are the first two figures in the schedule.', 'tf'),
        q(3,'Which factor does PL § 80.00(1)(c) tell the court to consider when setting a fine under that paragraph?',['The defendant’s economic circumstances','Only the felony class','The prosecutor’s chosen multiplier','A rule that the maximum is always fair'],'The defendant’s economic circumstances','The schedule is not the only relevant text.','The statute directs consideration of economic circumstances, including ability to pay and effects on dependents.'),
        // added 2026-10-04: checked against docs/verification/quick-reference/official-*.json
        q(1,"Which Penal Law articles' felonies use the special fine schedule in 80.00(1)(c)?",["Articles 220 and 221", "Article 496", "Article 10", "Article 55"],"Articles 220 and 221","The drug articles.","PL 80.00(1)(c): any felony defined in article two hundred twenty or two hundred twenty-one."),
        q(1,"Under PL § 80.00(1)(c), what is the maximum fine for a class A-I felony defined in Penal Law article 220 or 221?",["$100,000", "$50,000", "$30,000", "$15,000"],"$100,000","The top of the schedule.","PL 80.00(1)(c)(i): for A-I felonies, one hundred thousand dollars."),
        q(2,"Besides economic circumstances, what must the court consider when setting a fine under PL § 80.00(1)(c)?",["Its impact on any victims", "The arresting officer's view", "The number of jurors", "The trial's length"],"Its impact on any victims","Four factors are listed.","PL 80.00(1)(c): profit gained, disproportion to the conduct, impact on any victims, and economic circumstances."),
        q(2,"Under PL § 80.00(5), fine money over $5,000 collected on a PL § 80.00(1)(c) fine goes to:",["A state treatment fund", "The county clerk", "The arresting agency", "The victim"],"A state treatment fund","Subdivision 5.","PL 80.00(5): moneys over $5,000 go to the rehabilitative alcohol and substance treatment fund."),
        q(3,"When setting a fine under PL § 80.00(1)(c), the court must consider the effect on whom besides the defendant?",["The defendant's immediate family", "The jurors", "The prosecutor", "Court staff"],"The defendant's immediate family","Economic circumstances include others.","PL 80.00(1)(c): including the effect of the fine upon the defendant's immediate family or others owed support."),
        q(3,"A $40,000 fine under PL § 80.00(1)(c) is collected. Under PL § 80.00(5), how much goes to the state treatment fund?",["$35,000", "$40,000", "$5,000", "$30,000"],"$35,000","Only the part above $5,000.","PL 80.00(5): all moneys in excess of $5,000 from a paragraph c fine are the state's, for the treatment fund."),
        q(3,"When setting a fine under PL § 80.00(1)(c), must the court consider whether the fine is disproportionate to the conduct?",["Yes", "No", "Only for A-I felonies", "Only if the defense asks"],"Yes","One of the listed factors.","PL 80.00(1)(c): the court shall consider whether the fine is disproportionate to the conduct."),
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
          "Time to commence vs. readiness for trial",
          "Both impose an identical deadline for sentence",
          "Both govern only the time to appeal",
          "Grand-jury quorum versus juror concurrence"
        ],
        "Time to commence vs. readiness for trial",
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
          "Whether they wish to make a statement",
          "Whether the defendant wants a new grand jury",
          "Whether the verdict should be counted again",
          "Whether every sentencing rule can be waived"
        ],
        "Whether they wish to make a statement",
        "Counsel speaking does not replace the personal opportunity.",
        "The defendant has a personal right to speak, and the court must ask before pronouncing sentence."
      ],
      [
        3,
        "Absent an applicable statutory waiver, a misdemeanor sentence of 200 days requires which step under CPL § 390.20?",
        [
          "A written pre-sentence report",
          "A new indictment",
          "Automatic transfer to superior court",
          "Only the defendant’s oral statement"
        ],
        "A written pre-sentence report",
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
          "Yes: either capacity deficit qualifies",
          "No; both deficits are always required",
          "No; only lack of understanding matters",
          "Only after sentence is imposed"
        ],
        "Yes: either capacity deficit qualifies",
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
