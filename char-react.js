/* Clerk Quest: card characters that react on the question side (plan: docs/design-notes/rive-plan.md; no Rive needed).
   The owner's expression sheet (assets/character-emotes) was cut into one picture per face (art/face_*.webp, all the same
   size with the base in the same spot). Waiting shows the neutral face breathing; a right answer, a wrong answer or the
   hint swaps the face and plays a short squash, shake or tilt, then the character settles back to neutral.
   On for everyone since 2026-10-11 (the owner said publish); ?faces=0 turns it off on this device, ?faces=1 back on. Only cards listed in window.FACE_MAP (face-map.js) use it; the faces are art/face_<set>_<emotion>.webp.
   paintStudy() calls CharReact.mount(back, cardId); answer() and the hint button call CharReact.fire('right'|'wrong'|'hint').
   The same element is moved into every redraw, so a reaction never restarts. Reduce Motion: the face still changes, nothing moves. */
const CharReact = (() => {
  const FACES = () => window.FACE_MAP || { gavel:'gavel' };   // card id -> face set; face-map.js (made by tools/emotes/cut_faces.py) lists every card
  const REACT = {   // face to show, how long it lasts, and the body's motion (transform keyframes, pivot at the base)
    right:{ face:'excited', ms:1400, frames:[
      { transform:'none' }, { transform:'scale(1.08,.86)', offset:.07 }, { transform:'translateY(-6%) scale(.95,1.08)', offset:.19 },
      { transform:'scale(1.01,.98)', offset:.33 }, { transform:'none', offset:.45 }, { transform:'none' }] },
    wrong:{ face:'sad', ms:1600, frames:[
      { transform:'none' }, { transform:'translateX(2%)', offset:.04 }, { transform:'translateX(-2%)', offset:.08 },
      { transform:'translateX(1%)', offset:.12 }, { transform:'rotate(-3deg) scale(1,.94)', offset:.3 }, { transform:'rotate(-2deg) scale(1,.96)' }] },
    hint:{ face:'curious', ms:1200, frames:[
      { transform:'none' }, { transform:'rotate(3deg) scale(1,1.03)', offset:.2 }, { transform:'rotate(2.5deg) scale(1,1.01)' }] },
  };
  let on = true;
  try {
    const m = location.search.match(/[?&]faces=([01])/);
    if (m) localStorage.setItem('cq-faces-test', m[1]);
    on = localStorage.getItem('cq-faces-test') !== '0';
  } catch (_) {}
  let cur = null;   // { id, el, img, timer, anim }
  const reduced = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
  const src = (id, face) => { const k = FACES()[id]; return typeof artSrc === 'function' ? artSrc(`face_${k}_${face}`) : `art/face_${k}_${face}.webp`; };

  function make(id){
    const el = document.createElement('div'); el.className = 'char-react';
    el.innerHTML = `<div class="cr-body"><img alt="" draggable="false"></div>`;
    Object.values(REACT).concat({ face:'neutral' }).forEach(r => { const p = new Image(); p.src = src(id, r.face); });   // no flicker on the first swap
    const img = el.querySelector('img'); img.src = src(id, 'neutral');
    return { id, el, body:el.firstChild, img, timer:0, anim:null };
  }
  function mount(back, id){
    if (!on || !FACES()[id]) { if (cur && cur.id !== id) cur = null; return; }
    const box = back && back.querySelector('.mascot'); if (!box) return;
    if (!cur || cur.id !== id) cur = make(id);
    box.classList.add('has-char'); box.replaceChildren(cur.el);
  }
  function fire(name){
    const r = REACT[name]; if (!cur || !r) return;
    clearTimeout(cur.timer); cur.anim && cur.anim.cancel();
    cur.img.src = src(cur.id, r.face);
    if (!reduced() && cur.body.animate) cur.anim = cur.body.animate(r.frames, { duration:r.ms, easing:'cubic-bezier(.3,.7,.3,1)', fill:'forwards' });
    const me = cur;
    me.timer = setTimeout(() => {   // settle back to waiting
      me.img.src = src(me.id, 'neutral');
      me.anim && me.anim.cancel(); me.anim = null;
    }, r.ms);
  }

  document.head.insertAdjacentHTML('beforeend', `<style>
.mascot.has-char{align-items:flex-end}
.char-react{width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center}
.char-react .cr-body{width:100%;transform-origin:50% 95%}
.char-react img{display:block;width:100%;height:auto;animation:crBreathe 3s ease-in-out infinite;transform-origin:50% 95%}
@keyframes crBreathe{0%,100%{transform:none}50%{transform:scale(.99,1.025) rotate(-.6deg)}}
@media (prefers-reduced-motion:reduce){.char-react img{animation:none}}
html.cq-reduce-motion .char-react img{animation:none}
</style>`);
  return { mount, fire, get on(){ return on; } };
})();
