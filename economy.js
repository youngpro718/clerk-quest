/* Clerk Quest coins: what earns them, the wallet chip, and the coin sheet.
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, save, esc, openSheet, todayKey). All amounts live in COINS so they're easy to tune. */

const COINS = {
  answer: 5,          // right answer (half, rounded up, with a Sidebar hint)
  levelUp: 25,        // a card reaches its next level
  mastered: 100,      // a card is mastered
  dailyQuest: 20,     // claiming a daily quest (all three also close the case for a pack)
  streakStep: 10,     // first round of the day: +10 per day in a row…
  streakMax: 50,      // …capped here
  dup: 5,             // a duplicate card from a pack (it also gives a Copy)
};

/* Add coins and keep a short history for the coin sheet. Callers save afterward (or pass save:true).
   quiet:true skips the history line (right answers are logged once per round instead). */
function earnCoins(n, why, opts = {}){
  n = Math.max(0, Math.round(n)); if (!n) return 0;
  S.coins = (S.coins || 0) + n;
  if (!opts.quiet) logCoins(n, why);
  if (opts.save) save();
  return n;
}
/* Spend coins; returns false (and changes nothing) if the player can't afford it. */
function spendCoins(n, why){
  n = Math.round(n); if (n <= 0 || (S.coins || 0) < n) return false;
  S.coins -= n; S.coinLog = [{ n:-n, why, at:Date.now() }].concat(S.coinLog || []).slice(0, 25);
  if (typeof onbFlag === 'function') onbFlag('spent');   // Getting Started: "Buy something in the store"
  save(); return true;
}
function logCoins(n, why){ if (n > 0) S.coinLog = [{ n, why, at:Date.now() }].concat(S.coinLog || []).slice(0, 25); }
const coinsForAnswer = hinted => hinted ? Math.ceil(COINS.answer / 2) : COINS.answer;
const coinsForDup = () => COINS.dup;

/* Study streak: paid once a day, on the first finished round. Returns the coins paid (0 if already paid today). */
const yesterdayKey = () => { const y = new Date(); y.setDate(y.getDate() - 1); return y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); };
/* The streak still alive: studied today or yesterday. An older streak is broken and shows as 0. */
const liveStreak = () => S.streak && (S.streak.last === todayKey() || S.streak.last === yesterdayKey()) ? S.streak.days || 0 : 0;
function payStreak(){
  const today = todayKey();
  const st = S.streak = S.streak || { last:null, days:0 };
  if (st.last === today) return 0;
  const yesterday = yesterdayKey();
  st.days = st.last === yesterday ? st.days + 1 : 1;
  st.last = today;
  return earnCoins(Math.min(COINS.streakStep * st.days, COINS.streakMax), st.days > 1 ? `${st.days}-day study streak` : 'First round today');
}

/* The wallet chip sits top-left on every main tab. */
function coinChip(){
  return `<button class="coin-chip" data-act="coins" aria-label="${S.coins || 0} coins"><span class="ci">${COIN}</span>${(S.coins || 0).toLocaleString()}</button>`;
}
function coinSheet(){
  const log = S.coinLog || [];
  const when = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric'}); };
  const streak = liveStreak() ? `<p class="coin-streak">${ICO('streak')} ${liveStreak()}-day streak${S.streak.last === todayKey() ? '' : ' · study today to keep it'}</p>` : '';
  openSheet(`<div class="coin-head"><span class="coin-big">${COIN}</span><b>${(S.coins || 0).toLocaleString()}</b><small>coins</small></div>${streak}
    
    <div class="sec-h"><span>How to earn</span></div>
    <div class="list info">
      ${[['Right answer', `+${COINS.answer} (${coinsForAnswer(true)} with a hint)`], ['Card levels up', `+${COINS.levelUp}`], ['Card mastered', `+${COINS.mastered}`],
         ['Daily quest', `+${COINS.dailyQuest}`], ['Study streak', `+${COINS.streakStep} a day, up to +${COINS.streakMax}`], ['Duplicate card', `+${COINS.dup} and a Copy`]]
        .map(([k, v]) => `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')}
    </div>
    ${log.length ? `<div class="sec-h"><span>Recent</span></div><div class="list info">${log.slice(0, 8).map(e =>
      `<div class="row"><span class="k">${esc(e.why)}<small class="coin-when">${when(e.at)}</small></span><span class="v ${e.n > 0 ? 'coin-plus' : 'coin-minus'}">${e.n > 0 ? '+' + e.n : '−' + Math.abs(e.n)}</span></div>`).join('')}</div>` : ''}
    <button class="sheet-cancel" data-act="sheet-close">Done</button>`);
}
document.addEventListener('click', e => { if (e.target.closest('[data-act="coins"]')) push('store'); });   // the coin chip opens the store

const ECON_CSS = `
.coin-chip{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 12px 0 8px;border-radius:17px;border:0;background:rgba(227,178,60,.16);color:var(--mustard);font:700 16px var(--ui);font-variant-numeric:tabular-nums}
.coin-chip .ci .ico{width:20px;height:20px;vertical-align:-4px}
.coin-chip.bump{animation:coinbump .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes coinbump{40%{transform:scale(1.18)}}
.coin-head{display:flex;flex-direction:column;align-items:center;gap:2px;margin:4px 0 8px}
.coin-head .coin-big .ico{width:64px;height:64px}
.coin-head b{font:400 40px "Bangers";letter-spacing:.04em;color:var(--mustard)}
.coin-head small{font:14px var(--ui);color:var(--sub);margin-top:-4px}
.coin-streak{text-align:center;margin:0 0 8px;font:600 15px var(--ui);color:#ffb35c}
.coin-soon{text-align:center;margin:0 8px 6px;font:14px/1.4 var(--ui);color:var(--sub)}
.coin-when{display:block;font-size:12px;color:var(--sub);opacity:.8}
.coin-plus{color:var(--mustard)!important} .coin-minus{color:var(--sub)!important}
.chip.coin{background:#f3d27a}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${ECON_CSS}</style>`);
