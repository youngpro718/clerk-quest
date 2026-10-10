/* Pattern lessons: the method for one kind of question, as data (spec: docs/superpowers/specs/2026-10-09-pattern-lessons-design.md).
   One entry per trickType. Text uses only what the cards themselves state; review pending (owner).
   Pure data and date helpers: no DOM, no app globals. */
const plDate = (() => {
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const iso = d => d.toISOString().slice(0, 10);
  const add = (s, n) => iso(new Date(parse(s).getTime() + n * 864e5));
  const fmt = s => { const d = parse(s); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  /* 35 calendar cells (5 weeks) starting on the Sunday on or before s */
  const grid = s => {
    const first = parse(s).getTime() - parse(s).getUTCDay() * 864e5;
    return Array.from({ length:35 }, (_, i) => { const d = new Date(first + i * 864e5); return { iso:iso(d), day:d.getUTCDate(), month:MON[d.getUTCMonth()].slice(0, 3) }; });
  };
  return { add, fmt, grid };
})();

const PATTERN_LESSONS = {
  clock: {
    key:'clock', title:'Beat the deadline', promise:'Four steps for any deadline question.',
    steps:[
      { key:'START', label:'Find the starting event', cards:['eightdays', 'appeal30', 'sj120', 'clock6090', 'amendonce'],
        text:'Each clock runs from one event. Name it exactly: service of the judgment with notice of entry, the note of issue, the date in the summons, or service of the pleading. For a count-back deadline, the anchor is the hearing or appearance date.' },
      { key:'DIRECTION', label:'Which way do you count?', cards:['eightdays', 'eightback', 'appeal30', 'sj120'],
        text:'Count BACK from a hearing or appearance date (8 days before the hearing, 2 days before for answering papers). Count FORWARD from something that already happened (30 days to appeal, 120 days after the note of issue).' },
      { key:'NUMBER', label:'Get the number and the unit', cards:['amendonce', 'eightback', 'clock6090', 'acd'],
        text:'Say it out loud: 8, 2, 20, 30, 60 then 90, 120, 12 months. Look-alike numbers are the trap: when you amend once without permission, both numbers are 20, never 30.' },
      { key:'CATCH', label:'Check the catch', cards:['sj120', 'acd', 'clock6090'],
        text:'Many deadlines have a catch: after 120 days, only with leave of court on good cause; a total cap of 12 months; or two clocks with different starting points (start the hearing within 60 days of the date in the summons, then finish within 90 days of when it started).' },
    ],
    example:{ card:'appeal30', start:'2026-06-01', days:30, direction:'forward',
      scenario:'The judgment with notice of entry is served on June 1. By when must the notice of appeal be served and filed?',
      reveals:[
        { step:0, say:'Starting event: service of the judgment with notice of entry, on June 1. Not the day it was entered.' },
        { step:1, say:'Direction: forward. It already happened, so count ahead from June 1.' },
        { step:2, say:'Number: 30 days.' },
        { step:3, say:'Catch: serve the notice of appeal on the other side AND file it where the judgment was entered, within those 30 days. The clock runs from service with notice of entry.' },
      ] },
    check:{ q:'A motion is set to be heard on May 20. By what date must the notice of motion be served?', hearing:'2026-05-20', backDays:8,
      c:['May 12', 'May 28', 'May 18', 'June 19'], a:'May 12',
      w:'Count BACK at least 8 days from the hearing date (CPLR 2214(b)). Answering papers are due at least 2 days before it.' },
    drill:'clock',
  },
};

/* which cards a pattern drill uses: the person's weak cards of that pattern they can study, else their first owned ones (max 3) */
const plPickDrill = (weak, cards, trickType, canStudy) =>
  (weak.filter(id => canStudy(id) && (cards.find(c => c.id === id) || {}).trickType === trickType)
    .concat(cards.filter(c => c.trickType === trickType && canStudy(c.id)).map(c => c.id)))
    .filter((id, i, a) => a.indexOf(id) === i).slice(0, 3);
