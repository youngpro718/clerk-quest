/* Clerk Quest store: spend coins on decks (known cards) and subject packs (random cards).
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, CARDS, save, esc, openSheet, closeSheet, push, refresh, toast, ICO, COIN, artSrc, openPack, resolvePulls,
   titleCase, owned, miniCard, shuffle, pick, spendCoins). */

const PRICE = {
  deckPerCard: 40,     // a deck costs this for each card not yet owned (owned cards are free)
  subjectPack: 60,     // 3 random cards from one subject
  packMinCards: 4,     // subjects smaller than this sell only as a deck
};
/* Study boosts: they speed studying up, but never level or master a card for you. */
const BOOSTS = [
  { id:'double', name:'Double XP', art:'boost_doublexp', price:80, blurb:'Every right answer earns double XP for 1 hour.' },
  { id:'warm', name:'Warm Up', art:'boost_warmup', price:50, blurb:'Thaws every Cold Case, so nothing is frozen.' },
  { id:'hints', name:'3 Free Hints', art:'boost_hints', price:30, blurb:'Your next 3 Sidebar hints don\'t cost half the points.' },
];
const boosts = () => (S.boosts = S.boosts || { doubleUntil:0, freeHints:0 });
const doubleXPOn = () => boosts().doubleUntil > Date.now();
const doubleMinsLeft = () => Math.max(0, Math.ceil((boosts().doubleUntil - Date.now()) / 60000));
const coldOwned = () => CARDS.filter(c => isCold(S.cards[c.id]));
function boostStatus(b){
  if (b.id === 'double') return doubleXPOn() ? `Active · ${doubleMinsLeft()} min left` : '1 hour';
  if (b.id === 'warm') { const n = coldOwned().length; return n ? `${n} cold case${n > 1 ? 's' : ''}` : 'No cold cases right now'; }
  return boosts().freeHints ? `You have ${boosts().freeHints}` : '3 hints';
}
const boostUsable = b => b.id !== 'warm' || coldOwned().length > 0;
function buyBoost(id){
  const b = BOOSTS.find(x => x.id === id); if (!b || !boostUsable(b)) return;
  if (!spendCoins(b.price, b.name)) return;
  const bs = boosts();
  if (id === 'double') { bs.doubleUntil = Math.max(Date.now(), bs.doubleUntil) + 3600000; }
  if (id === 'warm') { const n = coldOwned().length; coldOwned().forEach(c => { S.cards[c.id].last = Date.now(); }); toast(`${n} card${n > 1 ? 's' : ''} warmed up`, 'streak'); }
  if (id === 'hints') { bs.freeHints += 3; }
  save(); closeSheet(true); refresh();
  if (id === 'double') toast(`Double XP on for ${doubleMinsLeft()} min`, 'almost');
  if (id === 'hints') toast(`${bs.freeHints} free hints ready`, 'hint');
}
const EMBLEM = {
  'FAMILY COURT ACT':'fca', 'CPLR':'cplr', 'CRIMINAL PROCEDURE':'crimpro', 'UNIFORM RULES':'uniform',
  'DOMESTIC RELATIONS LAW':'drl', 'COURT TERMS':'courtterms', 'COURT PROCEDURES':'courtproc',
  'CORE: CHECKING':'checking', 'CORE: FILING':'filing', 'FILING ORDER':'filingorder',
  'LIFE OF A CASE':'lifecase', 'LOOK-ALIKES':'lookalikes',
};
const emblemSrc = set => artSrc('emblem_' + (EMBLEM[set] || 'courtterms'));

function storeSubjects(){
  return [...new Set(CARDS.map(c => c.set))].map(set => {
    const cards = CARDS.filter(c => c.set === set);
    const missing = cards.filter(c => !owned(c));
    return { set, label:titleCase(set), cards, missing, deckPrice:missing.length * PRICE.deckPerCard };
  }).sort((a, b) => b.cards.length - a.cards.length || a.label.localeCompare(b.label));
}

const deckArt = s => `<span class="st-art deck"><img src="${artSrc('deck_box')}" alt="">
  <span class="st-lab deck"><img src="${emblemSrc(s.set)}" alt=""><b>${esc(s.label)}</b></span></span>`;
const packArt = s => `<span class="st-art pack"><img src="${artSrc('pack_blank')}" alt="">
  <span class="st-lab pack"><img src="${emblemSrc(s.set)}" alt=""><b>${esc(s.label)}</b></span></span>`;
const priceTag = (n, can) => `<span class="st-price ${can ? '' : 'short'}">${COIN}${n.toLocaleString()}</span>`;

function storeHTML(){
  const coins = S.coins || 0, subs = storeSubjects();
  const decks = subs.map(s => {
    const done = !s.missing.length;
    return `<button class="st-item" data-act="st-deck" data-set="${esc(s.set)}">${deckArt(s)}
      <span class="st-name">${esc(s.label)} Deck</span><span class="st-sub">${s.cards.length} card${s.cards.length > 1 ? 's' : ''} · ${done ? 'all owned' : s.missing.length + ' new'}</span>
      ${done ? `<span class="st-price owned">${ICO('check')} Owned</span>` : priceTag(s.deckPrice, coins >= s.deckPrice)}</button>`;
  }).join('');
  const packs = subs.filter(s => s.cards.length >= PRICE.packMinCards).map(s => `<button class="st-item" data-act="st-pack" data-set="${esc(s.set)}">${packArt(s)}
      <span class="st-name">${esc(s.label)} Pack</span><span class="st-sub">3 random cards</span>${priceTag(PRICE.subjectPack, coins >= PRICE.subjectPack)}</button>`).join('');
  const boostRows = BOOSTS.map(b => { const ok = boostUsable(b);
    return `<button class="row st-boost ${ok ? '' : 'off'}" data-act="st-boost" data-set="${b.id}"><span class="st-bimg"><img src="${artSrc(b.art)}" alt=""></span>
      <span class="row-main"><b>${esc(b.name)}</b><small>${esc(boostStatus(b))}</small></span>${ok ? priceTag(b.price, coins >= b.price) : ''}</button>`; }).join('');
  return `<img class="st-banner" src="${artSrc('store_banner')}" alt="The Clerk's Counter">
    <button class="st-balance" data-act="coins-info"><img src="${artSrc('coin_big')}" alt=""><span><b>${coins.toLocaleString()}</b><small>coins · how to earn more</small></span>${chev}</button>
    <div class="sec-h"><span>Decks</span></div><p class="st-note">Every card in the subject. You only pay for cards you don't have yet.</p>
    <div class="st-grid">${decks}</div>
    <div class="sec-h"><span>Subject Packs</span></div><p class="st-note">3 random cards from one subject. Duplicates turn into coins.</p>
    <div class="st-grid">${packs}</div>
    <div class="sec-h"><span>Study Boosts</span></div><p class="st-note">They speed up studying. They never level up a card for you.</p>
    <div class="list">${boostRows}</div>`;
}

/* ---------- buying ---------- */
function buySheet({title, art, list, price, act, set, note}){
  const coins = S.coins || 0, can = coins >= price;
  openSheet(`<div class="st-sheet-art">${art}</div><h3>${esc(title)}</h3>${note ? `<p class="st-note c">${note}</p>` : ''}
    ${list || ''}
    <div class="st-after"><span>Your coins</span><b>${COIN}${coins.toLocaleString()}</b></div>
    <div class="st-after"><span>Price</span><b>−${price.toLocaleString()}</b></div>
    <div class="st-after total"><span>After</span><b>${can ? COIN + (coins - price).toLocaleString() : '—'}</b></div>
    <button class="btn-big gold" data-act="${act}" data-set="${esc(set)}" ${can ? '' : 'disabled'}>${can ? `BUY FOR ${price.toLocaleString()}` : `NEED ${(price - coins).toLocaleString()} MORE COINS`}</button>
    <button class="sheet-cancel" data-act="sheet-close">Not now</button>`);
}
function deckSheet(set){
  const s = storeSubjects().find(x => x.set === set); if (!s) return;
  if (!s.missing.length) { toast('You already own every card in this deck', 'check'); return; }
  const list = `<div class="list st-cards">${s.cards.map(c => `<div class="row"><span class="st-dot ${owned(c) ? 'have' : ''}">${owned(c) ? ICO('check') : ICO('star')}</span>
    <span class="row-main"><b>${esc(c.name)}</b><small>${owned(c) ? 'Already yours · free' : 'New · ' + PRICE.deckPerCard + ' coins'}</small></span></div>`).join('')}</div>`;
  buySheet({ title:s.label + ' Deck', art:deckArt(s), list, price:s.deckPrice, act:'st-buy-deck', set });
}
function packSheet(set){
  const s = storeSubjects().find(x => x.set === set); if (!s) return;
  buySheet({ title:s.label + ' Pack', art:packArt(s), price:PRICE.subjectPack, act:'st-buy-pack', set,
    note:`3 random cards from the ${s.cards.length} ${esc(s.label)} cards. ${s.missing.length ? `${s.missing.length} you don't have yet.` : 'You own them all, so every card turns into coins.'}` });
}
function buyDeck(set){
  const s = storeSubjects().find(x => x.set === set); if (!s || !s.missing.length) return;
  if (!spendCoins(s.deckPrice, `${s.label} Deck`)) return;
  s.missing.forEach(c => { S.cards[c.id].owned = true; });
  save(); closeSheet(true); refresh();
  openSheet(`<div class="reward"><h3>${esc(s.label)} Deck added!</h3><p>${s.missing.length} new card${s.missing.length > 1 ? 's' : ''} in your collection.</p></div>
    <div class="st-new">${s.missing.map(c => miniCard(c)).join('')}</div>
    <button class="btn-big gold" data-act="sheet-close">NICE</button>`);
}
function drawSubject(set){
  const cards = CARDS.filter(c => c.set === set), fresh = shuffle(cards.filter(c => !owned(c)));
  const picks = []; const take = c => { if (c && picks.length < 3 && !picks.includes(c)) picks.push(c); };
  take(fresh[0]);                                               // at least one new card while any remain
  let guard = 0;
  while (picks.length < 3 && guard++ < 60) take(fresh.length > 1 && Math.random() < .5 ? pick(fresh) : pick(cards));
  return picks;
}
function buyPack(set){
  const s = storeSubjects().find(x => x.set === set); if (!s) return;
  if (!spendCoins(PRICE.subjectPack, `${s.label} Pack`)) return;
  closeSheet(true);
  openPack({ pulls:resolvePulls(drawSubject(set)), img:artSrc('pack_blank'), label:s.label, emblem:emblemSrc(set), hint:`A ${s.label} pack! Tap it to tear it open.` });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const set = t.dataset.set;
  switch (t.dataset.act) {
    case 'st-deck': deckSheet(set); break;
    case 'st-pack': packSheet(set); break;
    case 'st-buy-deck': buyDeck(set); break;
    case 'st-buy-pack': buyPack(set); break;
    case 'coins-info': coinSheet(); break;
    case 'st-boost': { const b = BOOSTS.find(x => x.id === set); if (!b) break;
      if (!boostUsable(b)) { toast('No cold cases to warm up right now', 'thermo_snow'); break; }
      buySheet({ title:b.name, art:`<span class="st-art boost"><img src="${artSrc(b.art)}" alt=""></span>`, price:b.price, act:'st-buy-boost', set:b.id,
        note:esc(b.blurb) + (b.id === 'double' && doubleXPOn() ? ` Adds an hour to the ${doubleMinsLeft()} min you have left.` : '') }); break; }
    case 'st-buy-boost': buyBoost(set); break;
  }
});

const STORE_SCREENS = {
  store(){ return { title:'Store', body:storeHTML() }; },
};

const STORE_CSS = `
.st-banner{display:block;width:100%;border-radius:16px;border:2px solid var(--ink);margin:0 0 12px}
.st-balance{display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border:0;border-radius:16px;background:var(--bg2);color:var(--paper);text-align:left}
.st-balance img{width:44px;height:44px;object-fit:contain}
.st-balance span{flex:1;display:flex;flex-direction:column}
.st-balance b{font:400 28px "Bangers";letter-spacing:.04em;color:var(--mustard);line-height:1}
.st-balance small{font:13px var(--ui);color:var(--sub)}
.st-note{margin:-2px 2px 10px;font:14px/1.35 var(--ui);color:var(--sub)} .st-note.c{text-align:center;margin:0 8px 12px}
.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.st-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 8px 12px;border:0;border-radius:16px;background:var(--bg2);color:var(--paper);text-align:center}
.st-item:active{transform:scale(.97)}
.st-art{position:relative;display:block;width:100%}
.st-art>img{display:block;width:100%;height:auto}
.st-art.pack{width:72%}
.st-lab{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2%;color:var(--ink);text-align:center;container-type:inline-size}
.st-lab.deck{left:34%;top:30%;width:46%;height:56%}
.st-lab.pack{left:18%;top:28%;width:66%;height:34%}
.st-lab img{width:62%;height:auto;max-height:66%;object-fit:contain}
.st-lab b{font:400 13cqw/1 "Bangers";letter-spacing:.03em;padding:0 4%}
.st-name{font:400 17px "Bangers";letter-spacing:.05em;margin-top:4px}
.st-sub{font:12px var(--ui);color:var(--sub)}
.st-price{display:inline-flex;align-items:center;gap:4px;margin-top:6px;padding:4px 12px;border-radius:14px;background:var(--mustard);color:var(--ink);font:700 15px var(--ui)}
.st-price .ico{width:18px;height:18px}
.st-price.short{background:rgba(255,255,255,.1);color:var(--sub)}
.st-price.owned{background:rgba(111,168,110,.25);color:#bfe0b5}
.st-sheet-art{width:46%;margin:0 auto 4px}
.st-cards{margin:0 0 12px} .st-cards .row{min-height:48px}
.st-dot .ico{width:24px;height:24px} .st-dot:not(.have){opacity:.9}
.st-after{display:flex;justify-content:space-between;padding:4px 6px;font:15px var(--ui);color:var(--sub)}
.st-after b{color:var(--paper);font-weight:600} .st-after .ico{width:18px;height:18px}
.st-after.total{border-top:.5px solid var(--line);margin-bottom:10px;padding-top:8px} .st-after.total b{color:var(--mustard)}
.st-boost .st-bimg{flex:none;width:52px;height:52px;display:flex;align-items:center;justify-content:center}
.st-boost .st-bimg img{width:100%;height:100%;object-fit:contain}
.st-boost .st-price{margin-top:0} .st-boost.off{opacity:.55}
.st-art.boost{width:62%;margin:0 auto}
.st-new{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 14px}
.st-new .mini{width:auto;min-width:0}
.pk-label{position:absolute;left:18%;top:28%;width:66%;height:34%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;z-index:1;color:var(--ink);container-type:inline-size;pointer-events:none}
.pk-label img{position:static!important;width:56%!important;height:auto!important;filter:none!important}
.pk-label b{font:400 13cqw/1 "Bangers";letter-spacing:.03em;text-align:center}
.pk-pack.torn .pk-label{transition:transform .8s .5s ease-in,opacity .5s .85s;transform:translateY(80%);opacity:0}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STORE_CSS}</style>`);
