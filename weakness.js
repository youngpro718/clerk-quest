/* Weak points: the miss log and the weakness profile (spec: docs/superpowers/specs/2026-10-09-weak-points-design.md).
   Every wrong answer is logged in S.misses = [{card, q, pick, t, src, hint}] (last 300). Weakness is computed on
   demand from that log and Recall, at three zoom levels (card, topic, pattern); nothing derived is stored.
   No screen code here. Loaded before the main script; runs at call time on the app's globals (S, byId, Recall). */
const Weak = (() => {
  const DAY = 864e5, MAX_LOG = 300, HALF_LIFE = 14, MIN_MISSES = 2, MIN_PATTERN_CARDS = 2, SOLVED_BOX = 3, RECENT_DAYS = 30;
  const PATTERN_NAME = { clock:'Deadlines', difference:'Look-alike terms', who:'Who has the power', chain:'Step-by-step order', trigger:'What starts it' };
  const PATTERN_PHRASE = { clock:'deadline', difference:'look-alike', who:'who-has-the-power', chain:'step-order', trigger:'what-starts-it' };
  const log = () => (S.misses = Array.isArray(S.misses) ? S.misses : []);
  const live = () => log().filter(m => m && Number.isFinite(+m.t) && byId(m.card));
  const dayKey = t => { const d = new Date(+t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  const ageDays = (m, now) => Math.max(0, now - m.t) / DAY;
  const weight = (m, now) => Math.pow(.5, ageDays(m, now) / HALF_LIFE) * (m.hint ? .5 : 1);

  function logMiss(card, q, pick, src, hint, now = Date.now()){
    const l = log();
    l.push({ card, q:String(q == null ? '' : q), pick:pick == null ? '' : String(pick), t:now, src:src || 'round', hint:!!hint });
    if (l.length > MAX_LOG) l.splice(0, l.length - MAX_LOG);
  }

  function weakCards(now = Date.now()){
    const g = {}; live().forEach(m => (g[m.card] = g[m.card] || []).push(m));
    return Object.keys(g).map(id => {
      const ms = g[id], r = (S.recall || {})[id];
      if (ms.length < MIN_MISSES || (r && r.box >= SOLVED_BOX)) return null;
      const days = new Set(ms.map(m => dayKey(m.t))).size;
      const score = ms.reduce((n, m) => n + weight(m, now), 0) + (1 - Math.min(1, Recall.strength(id, now))) + (days >= 2 ? 1 : 0);
      return { id, score, misses:ms.length, recent:ms.filter(m => ageDays(m, now) <= RECENT_DAYS).length, days };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
  }

  function groupBy(keyOf, now){
    const g = {};
    weakCards(now).forEach(c => {
      const k = keyOf(byId(c.id)); if (!k) return;
      const x = g[k] = g[k] || { key:k, score:0, cards:[], misses:0, recent:0 };
      x.score += c.score; x.cards.push(c.id); x.misses += c.misses; x.recent += c.recent;
    });
    return Object.values(g).sort((a, b) => b.score - a.score);
  }
  const weakTopics = (now = Date.now()) => groupBy(c => c.set || c.category, now);
  const weakPatterns = (now = Date.now()) => groupBy(c => c.trickType, now).filter(p => p.cards.length >= MIN_PATTERN_CARDS);
  const profile = (now = Date.now()) => ({ cards:weakCards(now), topics:weakTopics(now), patterns:weakPatterns(now) });

  function missedQuestions(id){
    const out = [];
    live().filter(m => m.card === id && m.q).sort((a, b) => b.t - a.t).forEach(m => { if (!out.includes(m.q)) out.push(m.q); });
    return out;
  }
  const since = (t, src) => live().filter(m => m.t >= t && (!src || m.src === src));

  /* the coach report for one attempt's misses: the top pattern among them, and the cards involved */
  function report(entries){
    const es = (entries || []).filter(m => m && byId(m.card)); if (es.length < MIN_MISSES) return null;
    const per = {}, order = [];
    es.forEach(m => { if (!per[m.card]) { per[m.card] = 0; order.push(m.card); } per[m.card]++; });
    const pat = {}; es.forEach(m => { const k = byId(m.card).trickType; if (k) pat[k] = (pat[k] || 0) + 1; });
    const top = Object.keys(pat).sort((a, b) => pat[b] - pat[a])[0];
    return { total:es.length, key:top && pat[top] >= MIN_MISSES ? top : null, count:top ? pat[top] : 0, cardIds:order.sort((a, b) => per[b] - per[a]) };
  }

  /* a drill that started a card below the solved box and ended it at or above (box0 holds the starting box of every drilled card) */
  const backOnTrack = (s, id) => { id = id || (s && s.id); return !!(s && s.drill && s.box0 && id in s.box0 && s.box0[id] < SOLVED_BOX && (((S.recall || {})[id] || {}).box || 0) >= SOLVED_BOX); };

  return { logMiss, weakCards, weakTopics, weakPatterns, profile, missedQuestions, since, report, backOnTrack, PATTERN_NAME, PATTERN_PHRASE };
})();
