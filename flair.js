/* Clerk Quest flair: three add-ons that sit on top of index.html without changing it.
   1. Holo finish by rarity: a shine that follows your finger, mouse, or phone tilt.
      Uncommon = sparkle, rare = prism, memory tricks = ripple. Commons stay matte.
   2. FILED stamp: new cards in a pack get stamped as they flip (SO ORDERED for memory tricks).
   3. Clerk ID badge: the Profile header becomes a court ID on a lanyard. Tap it to swing it.
   Remove the <script src="flair.js"> line to turn all of it off. */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- styles ---------------- */
  const css = `
/* 1. holo by rarity. Cards in the grid keep a still shine; cards up close follow the tilt. */
.card{--mx:30%;--my:20%;--fi:.32}
.zoom .card,.pk .card,.stage .card,.rcard .card{--mx:var(--gx,30%);--my:var(--gy,20%);--fi:var(--gi,.32)}
.card:has(.r-uncommon,.r-rare,.r-epic,.r-legendary)::before{content:"";position:absolute;inset:1.3% 1.7% 1.6%;border-radius:5cqw;z-index:8;pointer-events:none;
  opacity:var(--fi);transition:opacity .35s;mix-blend-mode:color-dodge}
/* uncommon: sparkle dust that catches the light where you point */
.card:has(.r-uncommon)::before{
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,250,220,.55),transparent 38%),
    radial-gradient(circle,rgba(255,255,255,.9) 0 .35cqw,transparent .5cqw) 0 0/4.2cqw 4.2cqw,
    radial-gradient(circle,rgba(255,240,190,.8) 0 .25cqw,transparent .4cqw) 2.1cqw 2.1cqw/4.2cqw 4.2cqw;
  -webkit-mask:radial-gradient(circle at var(--mx) var(--my),#000 0,rgba(0,0,0,.25) 45%,transparent 75%);
          mask:radial-gradient(circle at var(--mx) var(--my),#000 0,rgba(0,0,0,.25) 45%,transparent 75%)}
/* rare: a prism band that slides across as you tilt */
.card:has(.r-rare)::before{
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.35),transparent 28%),
    linear-gradient(115deg,transparent 30%,rgba(255,95,162,.55) 39%,rgba(255,212,95,.55) 44%,rgba(95,255,200,.5) 49%,rgba(95,180,255,.5) 54%,rgba(183,123,255,.5) 59%,transparent 68%);
  background-size:100% 100%,260% 260%;background-position:0 0,var(--mx) var(--my)}
/* epic + legendary (none yet): gold prism */
.card:has(.r-epic,.r-legendary)::before{
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,240,190,.6),transparent 32%),
    linear-gradient(115deg,transparent 22%,#ffcf5a 36%,#fff3c4 46%,#ffb13d 56%,transparent 72%);
  background-size:100% 100%,220% 220%;background-position:0 0,var(--mx) var(--my)}
/* memory tricks: rings that ripple out from where the light hits */
.card.special::before{content:"";background:repeating-radial-gradient(circle at var(--mx) var(--my),rgba(200,160,255,.0) 0 2.2cqw,rgba(220,190,255,.55) 2.6cqw,rgba(160,230,255,.0) 3.4cqw);
  -webkit-mask:radial-gradient(circle at var(--mx) var(--my),#000 0,transparent 70%);mask:radial-gradient(circle at var(--mx) var(--my),#000 0,transparent 70%)}
.card.cold::before,.card.locked::before,.stage.flipping .card::before{opacity:0!important}

/* 2. FILED stamp on new pack pulls */
.cqf-stamp{position:absolute;left:50%;top:60%;z-index:10;pointer-events:none;translate:-50% -50%;
  font:400 clamp(17px,5.2vw,30px)/1 "Luckiest Guy",sans-serif;letter-spacing:.06em;white-space:nowrap;color:var(--brick);
  padding:.28em .5em .16em;border:.14em solid currentColor;border-radius:.22em;outline:.06em solid currentColor;outline-offset:.1em;
  background:rgba(241,229,201,.55);rotate:-14deg;opacity:0;
  -webkit-mask-image:radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.7) 100%);mask-image:radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.7) 100%)}
.cqf-stamp.order{color:var(--navy);font-size:clamp(11px,3.3vw,19px)}
.cqf-stamp.on{animation:cqfslam .32s cubic-bezier(.2,1.6,.4,1) both}
@keyframes cqfslam{0%{scale:2.6;opacity:0}100%{scale:1;opacity:.93}}
.pk-card.cqf-thud .pk-inner{animation:cqfthud .25s ease-out .02s both}
@keyframes cqfthud{0%{transform:rotateY(180deg)}35%{transform:rotateY(180deg) scale(.965)}100%{transform:rotateY(180deg)}}

/* 3. Clerk ID badge */
.cqf-id{position:relative;display:flex;justify-content:center;padding-top:34px;margin:0 0 18px;z-index:0}
.cqf-strap{z-index:-1}
.cqf-strap{position:absolute;top:-58px;left:50%;width:30px;height:104px;translate:-50% 0;border-radius:3px;
  background:repeating-linear-gradient(90deg,transparent 0 5px,rgba(255,255,255,.14) 5px 7px),var(--rank);border:2px solid var(--ink)}
.cqf-swing{position:relative;transform-origin:50% -38px;touch-action:manipulation;cursor:pointer;border:0;background:none;padding:0;color:inherit;font:inherit}
.cqf-swing.go{animation:cqfswing 1.9s cubic-bezier(.3,0,.3,1) both}
@keyframes cqfswing{0%{rotate:0}12%{rotate:9deg}30%{rotate:-6deg}48%{rotate:3.5deg}66%{rotate:-1.8deg}82%{rotate:.7deg}100%{rotate:0}}
.cqf-clip{position:absolute;top:-30px;left:50%;translate:-50% 0;width:38px;height:34px;z-index:2;border:2px solid var(--ink);border-radius:8px 8px 4px 4px;
  background:linear-gradient(180deg,#e9e6df,#a9a59c)}
.cqf-clip::after{content:"";position:absolute;left:50%;bottom:6px;translate:-50% 0;width:16px;height:8px;border-radius:4px;background:var(--desk);border:2px solid var(--ink)}
.cqf-card{--mx:var(--gx,30%);--my:var(--gy,20%);position:relative;width:min(78vw,300px);border:3px solid var(--ink);border-radius:16px;overflow:hidden;
  background:var(--paper);color:var(--ink);box-shadow:6px 8px 0 rgba(0,0,0,.45);isolation:isolate}
.cqf-card::after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;mix-blend-mode:color-dodge;opacity:var(--gi,.3);transition:opacity .35s;
  background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.4),transparent 34%),
    linear-gradient(115deg,transparent 30%,rgba(255,95,162,.5) 40%,rgba(255,212,95,.5) 46%,rgba(95,255,200,.45) 52%,rgba(95,180,255,.45) 58%,transparent 68%);
  background-size:100% 100%,240% 240%;background-position:0 0,var(--mx) var(--my)}
.cqf-card[data-rank="0"]::after{display:none}
.cqf-top{display:flex;align-items:center;justify-content:space-between;padding:11px 14px 9px;background:var(--rank);border-bottom:3px solid var(--ink);color:var(--rank-ink)}
.cqf-top b{font:400 22px/1 "Bangers",sans-serif;letter-spacing:.05em}
.cqf-top small{font:400 14px/1 "Bangers",sans-serif;letter-spacing:.08em;opacity:.85}
.cqf-slot{position:absolute;top:7px;left:50%;translate:-50% 0;width:44px;height:7px;border-radius:4px;background:var(--desk);opacity:.85}
.cqf-body{display:grid;grid-template-columns:92px 1fr;gap:12px;padding:13px 14px 8px;align-items:start}
.cqf-photo{position:relative;width:92px;aspect-ratio:3/4;border:2.5px solid var(--ink);border-radius:8px;overflow:hidden;background:var(--paper2)}
.cqf-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.cqf-lv{position:absolute;right:-1px;bottom:-1px;padding:3px 6px 1px;border-top-left-radius:7px;border-left:2.5px solid var(--ink);border-top:2.5px solid var(--ink);
  background:var(--mustard);font:400 15px/1 "Luckiest Guy",sans-serif}
.cqf-name{font:400 23px/1.02 "Luckiest Guy",sans-serif;letter-spacing:.02em;margin:2px 0 8px;overflow-wrap:anywhere}
.cqf-f{display:grid;grid-template-columns:auto 1fr;gap:2px 9px;font:16px/1.15 "Patrick Hand",sans-serif}
.cqf-f span{color:#6b6252}
.cqf-f b{text-align:left;font-weight:400;font-family:"Luckiest Guy",sans-serif;font-size:15px;letter-spacing:.03em;padding-top:1px}
.cqf-xp{padding:4px 14px 13px}
.cqf-xp i{display:block;height:9px;border-radius:5px;background:rgba(0,0,0,.14);border:2px solid var(--ink);overflow:hidden}
.cqf-xp i b{display:block;height:100%;background:linear-gradient(90deg,#f7d56a,#e3a42c)}
.cqf-xp small{display:flex;justify-content:space-between;font:14px/1.2 "Patrick Hand",sans-serif;color:#6b6252;margin-top:5px}
.cqf-bar{height:22px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,transparent 2px 4px,var(--ink) 4px 5px,transparent 5px 9px,var(--ink) 9px 12px,transparent 12px 14px);
  margin:0 14px 12px;opacity:.75}
@media (prefers-reduced-motion:reduce){.cqf-swing.go,.cqf-stamp.on,.pk-card.cqf-thud .pk-inner{animation:none}.cqf-stamp.on{opacity:.93}}
`;
  const style = document.createElement('style'); style.id = 'cq-flair'; style.textContent = css; document.head.appendChild(style);

  /* ---------------- 1. light that follows the pointer or tilt ---------------- */
  const root = document.documentElement;
  let gx = 30, gy = 20, gi = .32, raf = 0;
  const paint = () => { raf = 0; root.style.setProperty('--gx', gx.toFixed(1) + '%'); root.style.setProperty('--gy', gy.toFixed(1) + '%'); root.style.setProperty('--gi', gi); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LIT = '.zoom .card, .pk .card, .stage .card, .rcard .card, .cqf-card';

  if (!reduce) {
    document.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !e.buttons) return;
      const el = e.target.closest && e.target.closest(LIT);
      if (!el) { if (gi !== .32 && !tilting) { gi = .32; queue(); } return; }
      const r = el.getBoundingClientRect();
      gx = clamp((e.clientX - r.left) / r.width * 100, 0, 100);
      gy = clamp((e.clientY - r.top) / r.height * 100, 0, 100);
      gi = .75; queue();
    }, { passive:true });

    // phone tilt. iPhone asks permission once, on the first tap of a pack, a close-up card, or the ID badge.
    let tilting = false, base = null;
    const onTilt = e => {
      if (e.gamma == null) return;
      if (base == null) base = e.beta;
      tilting = true;
      gx = clamp(50 + e.gamma * 1.6, 0, 100);
      gy = clamp(40 + (e.beta - base) * 1.6, 0, 100);
      gi = .7; queue();
    };
    const startTilt = () => { window.addEventListener('deviceorientation', onTilt, { passive:true }); };
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      let asked = false;
      document.addEventListener('click', e => {
        if (asked || !e.target.closest('.pk-pack, .pk-card, .zoom, .cqf-swing')) return;
        asked = true;
        DOE.requestPermission().then(s => { if (s === 'granted') startTilt(); }).catch(() => {});
      }, true);
    } else if (DOE) startTilt();
    // recentre when the phone settles into a new way of holding it
    setInterval(() => { base = null; }, 12000);
  }

  /* ---------------- 2. FILED stamp ---------------- */
  function stamp(card){
    if (card._cqf) return; card._cqf = true;
    const b = card.querySelector('.pk-badge');
    if (!b || b.classList.contains('dup')) return;
    const trick = b.classList.contains('trick');
    const s = document.createElement('span');
    s.className = 'cqf-stamp' + (trick ? ' order' : '');
    s.textContent = trick ? 'SO ORDERED' : 'FILED';
    card.appendChild(s);
    setTimeout(() => {
      s.classList.add('on'); card.classList.add('cqf-thud');
      if (navigator.vibrate) try { navigator.vibrate(25); } catch(e){}
    }, 640);
  }

  /* ---------------- 3. Clerk ID badge ---------------- */
  const RANKS = [   // by title, from New Hire up
    { bg:'#e8dcc0', ink:'#1d1b17' }, { bg:'#8fb3d1', ink:'#1d1b17' }, { bg:'#9bb68a', ink:'#1d1b17' },
    { bg:'#2b3a55', ink:'#f1e5c9' }, { bg:'linear-gradient(100deg,#d8a526,#ffe9a3 45%,#d8a526)', ink:'#1d1b17' }
  ];
  const rankOf = l => l >= 20 ? 4 : l >= 12 ? 3 : l >= 7 ? 2 : l >= 3 ? 1 : 0;
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);

  function badge(head){
    if (head._cqf || typeof S === 'undefined' || typeof CARDS === 'undefined') return;
    head._cqf = true;
    try {
      const lv = playerLevel(), rk = rankOf(lv), R = RANKS[rk];
      const mine = CARDS.filter(c => S.cards[c.id] && S.cards[c.id].owned);
      // photo: the card you've leveled the most (ties go to the rarer one)
      const RW = { legendary:5, epic:4, rare:3, uncommon:2, common:1 };
      const top = mine.slice().sort((a, b) => (S.cards[b.id].level - S.cards[a.id].level) || ((RW[b.rarity]||0) - (RW[a.rarity]||0)))[0];
      const pic = top && typeof ART !== 'undefined' && ART[top.id] && (ART[top.id].color || ART[top.id][1]);
      const into = S.stats.xp % 250, streak = (S.streak && S.streak.days) || 0;
      const no = String(1000 + (S.stats.xp * 7 + S.packsOpened * 13) % 9000);
      const wrap = document.createElement('div');
      wrap.className = 'cqf-id';
      wrap.style.setProperty('--rank', R.bg); wrap.style.setProperty('--rank-ink', R.ink);
      wrap.innerHTML = `<span class="cqf-strap" aria-hidden="true"></span>
        <button class="cqf-swing" type="button" aria-label="Your Clerk ID: ${e(playerTitle())}, level ${lv}">
          <span class="cqf-clip" aria-hidden="true"></span>
          <div class="cqf-card" data-rank="${rk}">
            <div class="cqf-top"><b>CLERK QUEST</b><small>COURT ID · ${no}</small><span class="cqf-slot"></span></div>
            <div class="cqf-body">
              <div class="cqf-photo">${pic ? `<img src="${e(pic)}" alt="">` : ''}<span class="cqf-lv">L${lv}</span></div>
              <div><div class="cqf-name">${e(playerTitle())}</div>
                <div class="cqf-f">
                  <span>Streak</span><b>${streak} ${streak === 1 ? 'day' : 'days'}</b>
                  <span>Packs</span><b>${S.packsOpened} opened</b>
                  ${top ? `<span>Top card</span><b>${e(top.name)}</b>` : ''}
                </div></div>
            </div>
            <div class="cqf-xp"><i><b style="width:${into / 250 * 100}%"></b></i><small><span>${S.stats.xp} XP</span><span>${250 - into} XP to Level ${lv + 1}</span></small></div>
            <div class="cqf-bar" aria-hidden="true"></div>
          </div>
        </button>`;
      head.replaceWith(wrap);
      const sw = wrap.querySelector('.cqf-swing');
      sw.addEventListener('click', () => { sw.classList.remove('go'); void sw.offsetWidth; sw.classList.add('go'); });
    } catch(err) { head._cqf = false; }   // anything unexpected: leave the original header alone
  }

  /* ---------------- watch the screen for the moments above ---------------- */
  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'attributes') {
        const t = m.target;
        if (t.classList && t.classList.contains('pk-card') && t.classList.contains('flipped')) stamp(t);
      } else for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        const h = n.matches('.prof-head') ? n : n.querySelector && n.querySelector('.prof-head');
        if (h) badge(h);
      }
    }
  });
  const go = () => {
    mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    const h = document.querySelector('.prof-head'); if (h) badge(h);
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
