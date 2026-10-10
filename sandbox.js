/* Sandbox mode for the admin (spec: docs/superpowers/specs/2026-10-10-visual-lab-and-admin-design.md, Part 4).
   Enter keeps a copy of the save and turns save() off, so localStorage (and the cloud sync, which only reads localStorage)
   never changes. Exit puts the copy back into the original S object. A red bar says so the whole time. Closing or
   reloading the page in the sandbox simply loads the untouched real save. Presets change S while inside.
   Loaded before the main script; runs at call time on the app's globals (S, ADM, CARDS, byId, normalize, Weak, PATTERN_LESSONS). */
const Sandbox = (() => {
  let snap = null, ref = null;
  const DAY = 864e5, HOUR = 36e5, on = () => snap !== null;
  const lessonCards = () => [...new Set(Object.values(typeof PATTERN_LESSONS === 'object' ? PATTERN_LESSONS : {})
    .flatMap(L => (L.steps || []).flatMap(s => s.cards || [])))].filter(id => byId(id));
  const presets = {
    fresh(){ const f = normalize(null); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, f); },
    everything(){ CARDS.forEach(c => { S.cards[c.id].owned = true; }); },
    packs(){ S.packs = Math.max(S.packs || 0, 10); S.coins = Math.max(S.coins || 0, 5000); },
    weak(){   // every card in the Deadlines and Look-alikes lessons counts as weak: missed 3 times over a week, not yet solved
      const now = Date.now(); S.misses = [];
      lessonCards().forEach((id, k) => {
        const c = byId(id), bank = c.bank || []; S.cards[id].owned = true;
        if (S.recall) delete S.recall[id];
        [1, 3, 6].forEach((d, j) => { const q = bank[(k + j) % Math.max(1, bank.length)] || { q:`Sample question ${j + 1} about ${c.name}`, a:'', c:[] };
          Weak.logMiss(id, q.q, (q.c || []).find(x => String(x) !== String(q.a)) || 'a wrong answer', 'round', false, now - d * DAY - k * HOUR); });
      });
    },
  };
  function bar(show){
    document.documentElement.classList.toggle('sandbox-on', show);
    const old = document.getElementById('sandbox-bar'); if (old) old.remove();
    if (!show) return;
    const el = document.createElement('div'); el.id = 'sandbox-bar'; el.className = 'sandbox-bar'; el.setAttribute('role', 'status');
    el.innerHTML = '<b>SANDBOX</b><span>Try anything: nothing is saved</span><button data-act="sb-exit">Exit</button>';
    document.body.appendChild(el);
  }
  function enter(preset){
    if (snap !== null || typeof ADM === 'undefined' || !ADM.is) return false;
    snap = JSON.stringify(S); ref = S; bar(true);
    if (preset && presets[preset]) presets[preset]();
    return true;
  }
  function exit(){
    if (snap === null) return false;
    const back = JSON.parse(snap); snap = null;
    Object.keys(ref).forEach(k => delete ref[k]); Object.assign(ref, back);
    if (S !== ref) S = ref;   // "Reset all progress" inside the sandbox swaps in a new object; the original comes back
    ref = null; bar(false);
    return true;
  }
  return { on, enter, exit, presets };
})();
document.addEventListener('click', e => {   // Exit always works, even if the admin check has since changed
  if (!e.target.closest || !e.target.closest('[data-act="sb-exit"]') || !Sandbox.exit()) return;
  if (typeof refresh === 'function') refresh();
  if (typeof toast === 'function') toast('Sandbox closed. Your save is as it was.', 'check');
});
document.head.insertAdjacentHTML('beforeend', `<style>
.sandbox-bar{position:fixed;left:0;right:0;top:0;z-index:99999;display:flex;align-items:center;gap:10px;height:40px;box-sizing:content-box;padding:env(safe-area-inset-top,0px) 12px 0;background:#b3261e;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.4)}
.sandbox-bar b{font:400 18px "Bangers";letter-spacing:.08em}.sandbox-bar span{flex:1;min-width:0;font:600 13px var(--ui,system-ui)}
.sandbox-bar button{min-height:30px;border:2px solid #fff;background:none;color:#fff;border-radius:10px;padding:0 14px;font:400 16px "Bangers";letter-spacing:.06em}
html.sandbox-on #shell{top:calc(env(safe-area-inset-top,0px) + 40px)}
</style>`);
