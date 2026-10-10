/* Clerk Quest store: spend coins on decks (known cards) and subject packs (random cards).
   Loaded before the main script; everything here runs at call time and uses the app's globals
   (S, CARDS, save, esc, openSheet, closeSheet, push, refresh, toast, ICO, COIN, artSrc, openPack, resolvePulls,
   titleCase, owned, miniCard, shuffle, pick, spendCoins). */

const PRICE = {
  deckCommon: 120,     // a deck costs this for each common card not yet owned (owned cards are free)
  deckUncommon: 200,   //   …and this for each uncommon card
  deckRare: 300,       //   rares are only sold inside Lesson Decks (so a quiz is never blocked by luck); Store Decks skip them
  subjectPack: 300,    // 3 random cards from one subject
  packsPerWeek: 2,     // store packs a player can buy each week (the daily pack stays the main way to collect)
  packMinCards: 4,     // subjects smaller than this sell only as a deck
  copy: 50,            // one Copy (10 certify a card); TUNE
  copiesPerWeek: 10,   // Copies a player can buy each week, so coins speed certifying up but never skip it
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
/* Card styles: frames are bought per card; card backs are bought once for the whole collection.
   Holo foil was retired on 2026-10-05: shine now comes from a card's version (Certified, Exhibit, Gold Seal). Buyers were refunded. */
const FRAMES = [
  { id:'marble', name:'Courthouse Marble', price:200 },
  { id:'night', name:'Night Court', price:200 },
  { id:'vintage', name:'Old Parchment', price:200 },
];
const BACKS = [
  { id:'navy', name:'Gavel & Quill', price:150 },
  { id:'redtape', name:'Red Tape', price:150 },
  { id:'marble', name:'Marble Nameplate', price:150 },
  { id:'night', name:'Night Skyline', price:150 },
];
/* Paperwork extras (replaced holo foil, 2026-10-05): rubber stamps and card sleeves. Buy a style once, then put it on any cards.
   A sleeve's win is its clear window in the art (x0, y0, x1, y1 of size), so the card can sit exactly inside it. */
const STAMPS = [
  { id:'received', name:'Received', price:60 }, { id:'urgent', name:'Urgent', price:60 }, { id:'approved', name:'Approved', price:60 },
  { id:'record', name:'On the Record', price:60 }, { id:'ordered', name:'So Ordered', price:60 }, { id:'timestamped', name:'Time Stamped', price:60 },
];
const SLEEVES = [
  { id:'manila', name:'Manila Folder', price:120, size:[372, 507], win:[39, 73, 325, 440] },
  { id:'redtape', name:'Red Tape', price:120, size:[371, 501], win:[53, 62, 318, 418] },
  { id:'navy', name:'Navy Legal', price:120, size:[372, 487], win:[40, 40, 331, 437] },
  { id:'ledger', name:'Green Ledger', price:120, size:[369, 488], win:[51, 46, 319, 437] },
];
const DECO = { stamp:{ list:STAMPS, owned:'stamps', label:'Stamp', none:'No stamp', art:id => `art/deco_stamp_${id}.webp` },
               sleeve:{ list:SLEEVES, owned:'sleeves', label:'Sleeve', none:'No sleeve', art:id => `art/deco_sleeve_${id}.webp` } };
const styles = () => { S.styles = S.styles || { cards:{}, backs:[], back:'' }; S.styles.stamps = S.styles.stamps || []; S.styles.sleeves = S.styles.sleeves || []; return S.styles; };
const cardStyle = id => (styles().cards[id] = styles().cards[id] || { frames:[], foil:false, eq:{ frame:'', foil:false } });
const framesAllowed = c => ![3,4,5].includes(c.series);   // store frames are shaped for the Series 1/2 layout
function styleSheet(id){
  const c = byId(id); if (!c || !owned(c)) return;
  const cs = cardStyle(id), coins = S.coins || 0;
  const btn = (act, label, extra = '', can = true) => `<button class="sty-btn ${extra}" data-act="${act}" data-id="${id}" ${can ? '' : 'disabled'}>${label}</button>`;
  const frameRow = f => {
    const have = cs.frames.includes(f.id), on = cs.eq.frame === f.id;
    return `<div class="sty-row"><img class="sty-prev" src="${artSrc('frame_' + f.id)}" alt=""><span class="row-main"><b>${esc(f.name)}</b><small>${have ? 'Yours' : f.price + ' coins'}</small></span>
      ${on ? btn('sty-frame', `${ICO('check')} In use`, 'on" data-v="' + f.id) : have ? btn('sty-frame', 'Use', '" data-v="' + f.id) : btn('sty-buyframe', `${COIN}${f.price}`, 'buy" data-v="' + f.id, coins >= f.price)}</div>`;
  };
  openSheet(`<h3>Card Style</h3><div class="sty-card">${cardEl(c, S.cards[id])}</div><p class="st-note c">${esc(c.name)}</p>
    <div class="sec-h"><span>Frame</span></div>
    ${framesAllowed(c) ? `<div class="list sty-list">
      <div class="sty-row"><img class="sty-prev" src="${c.trickType ? artSrc('frame_trick') : artSrc('frame_base')}" alt=""><span class="row-main"><b>Standard</b><small>The series frame</small></span>
        ${cs.eq.frame ? btn('sty-frame', 'Use', '" data-v="') : btn('sty-frame', `${ICO('check')} In use`, 'on" data-v="')}</div>
      ${FRAMES.map(frameRow).join('')}</div>`
      : `<p class="st-note">This series keeps its own signature frame.</p>`}
    ${['stamp', 'sleeve'].map(k => { const D = DECO[k], on = cs.eq[k] || '';
      return `<div class="sec-h"><span>${D.label}</span></div><div class="list sty-list">
        <div class="sty-row"><span class="sty-prev none"></span><span class="row-main"><b>${D.none}</b></span>${on ? btn('sty-deco', 'Use', `" data-k="${k}" data-v="`) : btn('sty-deco', `${ICO('check')} In use`, `on" data-k="${k}" data-v="`)}</div>
        ${D.list.map(x => { const have = styles()[D.owned].includes(x.id);
          return `<div class="sty-row"><img class="sty-prev deco ${k}" src="${D.art(x.id)}" alt=""><span class="row-main"><b>${esc(x.name)}</b><small>${have ? 'Yours · use on any card' : x.price + ' coins, then use on any card'}</small></span>
            ${on === x.id ? btn('sty-deco', `${ICO('check')} In use`, `on" data-k="${k}" data-v="${x.id}`) : have ? btn('sty-deco', 'Use', `" data-k="${k}" data-v="${x.id}`) : btn('sty-buydeco', `${COIN}${x.price}`, `buy" data-k="${k}" data-v="${x.id}`, coins >= x.price)}</div>`; }).join('')}</div>`; }).join('')}
    <p class="st-note c">You have ${COIN}${coins.toLocaleString()}</p>
    <button class="sheet-cancel" data-act="sheet-close">Done</button>`);
}
function cardPicker(kind){
  const list = CARDS.filter(owned).filter(c => kind !== 'frame' || framesAllowed(c));
  openSheet(`<h3>${kind === 'frame' ? 'Frame' : DECO[kind] ? DECO[kind].label : 'Style'}: pick a card</h3><div class="list">${list.map(c => `<button class="row" data-act="sty-open" data-id="${c.id}">${thumb(c)}<span class="row-main"><b>${esc(c.name)}</b><small>${esc(c.num)}</small></span>${chev}</button>`).join('')}</div>
    <button class="sheet-cancel" data-act="sheet-close">Cancel</button>`);
}
const backStyleHTML = () => `<div class="st-grid backs">${[{ id:'', name:'Classic', price:0 }].concat(BACKS).map(b => {
    const have = !b.id || styles().backs.includes(b.id), on = styles().back === b.id;
    return `<button class="st-item" data-act="sty-back" data-set="${b.id}"><span class="st-art back"><img src="${artSrc(b.id ? 'back_' + b.id : 'cardback')}" alt=""></span>
      <span class="st-name">${esc(b.name)}</span>${on ? `<span class="st-price owned">${ICO('check')} In use</span>` : have ? `<span class="st-price owned">Use</span>` : priceTag(b.price, (S.coins || 0) >= b.price)}</button>`; }).join('')}</div>`;
const EMBLEM = {
  'FAMILY COURT ACT':'fca', 'CPLR':'cplr', 'CRIMINAL PROCEDURE':'crimpro', 'UNIFORM RULES':'uniform',
  'DOMESTIC RELATIONS LAW':'drl', 'COURT TERMS':'courtterms', 'COURT PROCEDURES':'courtproc',
  'CORE: CHECKING':'checking', 'CORE: FILING':'filing', 'FILING ORDER':'filingorder',
  'LIFE OF A CASE':'lifecase', 'LOOK-ALIKES':'lookalikes',
};
const emblemSrc = set => artSrc('emblem_' + (EMBLEM[set] || 'courtterms'));

const cardPrice = c => c.rarity === 'common' ? PRICE.deckCommon : c.rarity === 'uncommon' ? PRICE.deckUncommon : PRICE.deckRare;
/* Each series has its own pack entry and Complete Deck. A pack only draws from the series on its wrapper.
   The loose trick cards (no series) come only from the Memory Tricks add-on pack (ADDON_PACKS below). */
const SERIES_DEFS = [
  { n:1, label:'Series 1', test:c => !c.series && !c.trickType, pack:'pack',    deck:'deck_s1' },
  { n:2, label:'Series 2', test:c => c.series === 2,           pack:'pack_s2', deck:'deck_s2' },
  { n:3, label:'Series 3', test:c => c.series === 3,           pack:'pack_s3', deck:'deck_s3' },
  { n:4, label:'Series 4 · Doodle Files', test:c => c.series === 4, pack:'pack_s4', deck:'deck_s4' },
  { n:5, label:'Series 5 · Vintage Heroes', test:c => c.series === 5, pack:'pack_s5', deck:'deck_s5' },
  { n:6, label:'Series 6 · Look-alike Rules', test:c => c.series === 6, pack:'pack_s6', deck:'deck_s6' },
];
const seriesDef = n => SERIES_DEFS.find(d => d.n === +n);
const seriesPackArt = n => artSrc(seriesDef(n).pack);
/* Add-on packs belong to no series (no deck, goals or card back). The Memory Tricks pack holds the loose tricks. */
const ADDON_PACKS = [
  { n:'tricks', label:'Memory Tricks', test:c => !!c.trickType && !c.series, pack:'pack_tricks' },
];
const packDef = k => SERIES_DEFS.find(d => String(d.n) === String(k)) || ADDON_PACKS.find(d => d.n === k);
const packArtOf = k => artSrc(packDef(k).pack);
function storeSeries(){
  return SERIES_DEFS.map(d => { const cards = CARDS.filter(d.test), missing = cards.filter(c => !owned(c));
    return { ...d, cards, missing, deckPrice:missing.reduce((n, c) => n + cardPrice(c), 0) }; });
}
const seriesDeckArt = d => `<span class="st-art deck series-product"><img src="${artSrc(d.deck)}" alt="${esc(d.label)} complete deck box"></span>`;
const seriesPackImg = d => `<span class="st-art pack series-product"><img src="${artSrc(d.pack)}" alt="${esc(d.label)} booster pack"></span>`;
const weekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };   // this week's Monday
const storePacksLeft = () => { const w = S.storePacks; return !w || w.week !== weekKey() ? PRICE.packsPerWeek : Math.max(0, PRICE.packsPerWeek - w.n); };
function storeSubjects(){
  return [...new Set(CARDS.map(c => c.set))].map(set => {
    const cards = CARDS.filter(c => c.set === set);
    const missing = cards.filter(c => !owned(c)), buyable = missing.filter(c => c.rarity !== 'rare');   // rares only come from packs
    return { set, label:titleCase(set), cards, missing, buyable, deckPrice:buyable.reduce((n, c) => n + cardPrice(c), 0) };
  }).sort((a, b) => b.cards.length - a.cards.length || a.label.localeCompare(b.label));
}

function storeAddons(){
  return ADDON_PACKS.map(d => { const cards = CARDS.filter(d.test); return { ...d, cards, missing:cards.filter(c => !owned(c)) }; });
}
const storePackList = () => storeSeries().concat(storeAddons());

const deckArt = s => `<span class="st-art deck"><img src="${artSrc('deck_box')}" alt="">
  <span class="st-lab deck"><img src="${emblemSrc(s.set)}" alt=""><b>${esc(s.label)}</b></span></span>`;
const packArt = s => `<span class="st-art pack"><img src="${artSrc('pack_blank')}" alt="">
  <span class="st-lab pack"><img src="${emblemSrc(s.set)}" alt=""><b>${esc(s.label)}</b></span></span>`;
const priceTag = (n, can) => `<span class="st-price ${can ? '' : 'short'}">${COIN}${n.toLocaleString()}</span>`;

function storeHTML(){
  const coins = S.coins || 0, ser = storeSeries();
  const decks = ser.map(d => {
    const done = !d.missing.length;
    return `<button class="st-item" data-act="st-deck" data-set="${d.n}">${seriesDeckArt(d)}
      <span class="st-name">${esc(d.label)} Complete Deck</span><span class="st-sub">${d.cards.length} cards · ${done ? 'all owned' : d.missing.length + ' new'}</span>
      ${done ? `<span class="st-price owned">${ICO('check')} Owned</span>` : priceTag(d.deckPrice, coins >= d.deckPrice)}</button>`;
  }).join('');
  const packs = ser.map(d => `<button class="st-item" data-act="st-pack" data-set="${d.n}">${seriesPackImg(d)}
      <span class="st-name">${esc(d.label)} Pack</span><span class="st-sub">3 cards from ${esc(d.label)} · ${storePacksLeft()} left this week</span>${priceTag(PRICE.subjectPack, coins >= PRICE.subjectPack)}</button>`).join('');
  const addons = storeAddons().map(d => `<button class="st-item" data-act="st-pack" data-set="${d.n}">${seriesPackImg(d)}
      <span class="st-name">${esc(d.label)} Pack</span><span class="st-sub">3 trick cards · ${storePacksLeft()} left this week</span>${priceTag(PRICE.subjectPack, coins >= PRICE.subjectPack)}</button>`).join('');
  const boostRows = BOOSTS.map(b => { const ok = boostUsable(b);
    return `<button class="row st-boost ${ok ? '' : 'off'}" data-act="st-boost" data-set="${b.id}"><span class="st-bimg"><img src="${artSrc(b.art)}" alt=""></span>
      <span class="row-main"><b>${esc(b.name)}</b><small>${esc(boostStatus(b))}</small></span>${ok ? priceTag(b.price, coins >= b.price) : ''}</button>`; }).join('');
  return `<img class="st-banner" src="${artSrc('store_banner')}" alt="The Clerk's Counter">
    <button class="st-balance" data-act="coins-info"><img src="${artSrc('coin_big')}" alt=""><span><b>${coins.toLocaleString()}</b><small>coins · how to earn more</small></span>${chev}</button>
    <div class="sec-h"><span>Series Packs</span></div><p class="st-note">Each pack holds cards from its own series, and some hold a sticker. Duplicates turn into Copies and a few coins.</p>
    <div class="st-grid">${packs}</div>
    <div class="sec-h"><span>Add-on Packs</span></div><p class="st-note">Not a series: three Memory Trick cards that help you tell look-alike rules apart. They share the weekly limit with series packs.</p>
    <div class="st-grid">${addons}</div>
    <div class="sec-h"><span>Copies</span></div><p class="st-note">Collect ${COPIES_TO_CERTIFY} Copies to certify any card you own. Duplicate cards give Copies too. You have ${copies()}.</p>
    <div class="list"><button class="row" data-act="st-copy"><span class="st-bimg"><img src="art/copy.webp" alt=""></span>
      <span class="row-main"><b>1 Copy</b><small>${copyBuysLeft() ? `${copyBuysLeft()} left this week` : 'Sold out until Monday'}</small></span>${copyBuysLeft() ? priceTag(PRICE.copy, coins >= PRICE.copy) : ''}</button></div>
    <div class="sec-h"><span>Complete Decks</span></div><p class="st-note">Every card in a series, all at once, for anyone who wants to start studying without waiting on packs. You only pay for cards you don't have yet.</p>
    <div class="st-grid">${decks}</div>
    <div class="sec-h"><span>Lesson Decks</span></div><p class="st-note">Every card in a built-in lesson, so you can take its quiz. You only pay for cards you don't have yet.</p>
    <div class="st-grid">${LESSONS.map(L => { const m = lessonMissing(L).length;
      return `<button class="st-item" data-act="ls-get" data-id="${L.id}">${lessonDeckArt(L)}<span class="st-name">${esc(L.name)}</span>
        <span class="st-sub">${L.cards.length} cards · ${m ? m + ' new' : 'all owned'}</span>
        ${m ? priceTag(lessonDeckPrice(L), coins >= lessonDeckPrice(L)) : `<span class="st-price owned">${ICO('check')} Owned</span>`}</button>`; }).join('')}</div>
    <div class="sec-h"><span>Card Styles</span></div><p class="st-note">Frames go on one card. Stamps and sleeves are bought once, then go on as many cards as you like. Or open any card and tap ••• → Card Style.</p>
    <div class="list">
      <button class="row" data-act="sty-pick" data-set="frame"><span class="st-bimg"><img src="${artSrc('frame_marble')}" alt=""></span><span class="row-main"><b>Frames</b><small>Marble, Night Court, Old Parchment · 200 each</small></span>${chev}</button>
      <button class="row" data-act="sty-pick" data-set="stamp"><span class="st-bimg"><img src="art/deco_stamp_ordered.webp" alt=""></span><span class="row-main"><b>Rubber Stamps</b><small>Received, Urgent, So Ordered and more · 60 each</small></span>${chev}</button>
      <button class="row" data-act="sty-pick" data-set="sleeve"><span class="st-bimg"><img src="art/deco_sleeve_manila.webp" alt=""></span><span class="row-main"><b>Card Sleeves</b><small>Manila, Red Tape, Navy, Ledger · 120 each</small></span>${chev}</button>
    </div>
    <div class="sec-h"><span>Card Backs</span></div><p class="st-note">One back for your whole collection. See it in packs, or tap a card on its page to flip it. With Classic, each series shows its own back, and in Series 1 to 5 getting every card to Certified earns that series an exclusive back that can't be bought.</p>
    ${backStyleHTML()}
    <div class="sec-h"><span>Binder Covers</span></div><p class="st-note">Dress up your binders. Put a cover on from a binder's ••• menu. Extra pages are added inside each binder.</p>
    <div class="st-grid backs">${COVERS.filter(cv => cv.price).map(cv => { const have = ownedCovers().includes(cv.id);
      return `<button class="st-item" data-act="st-cover" data-set="${cv.id}">${coverHTML({ id:'_store', name:cv.name, cover:cv.id, slots:[] })}<span class="st-name">${esc(cv.name)}</span>
        ${have ? `<span class="st-price owned">${ICO('check')} Yours</span>` : priceTag(cv.price, (S.coins || 0) >= cv.price)}</button>`; }).join('')}</div>
    <div class="sec-h"><span>Study Boosts</span></div><p class="st-note">They speed up studying. They never level up a card for you.</p>
    <div class="list">${boostRows}</div>`;
}

/* ---------- buying ---------- */
function buySheet({title, art, list, price, act, set, note, locked, lockedText = 'NO MORE PACKS THIS WEEK'}){
  const coins = S.coins || 0, can = coins >= price && !locked;
  openSheet(`<div class="st-sheet-art">${art}</div><h3>${esc(title)}</h3>${note ? `<p class="st-note c">${note}</p>` : ''}
    ${list || ''}
    <div class="st-after"><span>Your coins</span><b>${COIN}${coins.toLocaleString()}</b></div>
    <div class="st-after"><span>Price</span><b>−${price.toLocaleString()}</b></div>
    <div class="st-after total"><span>After</span><b>${can ? COIN + (coins - price).toLocaleString() : '—'}</b></div>
    <button class="btn-big gold" data-act="${act}" data-set="${esc(set)}" ${can ? '' : 'disabled'}>${locked ? lockedText : can ? `BUY FOR ${price.toLocaleString()}` : `NEED ${(price - coins).toLocaleString()} MORE COINS`}</button>
    <button class="sheet-cancel" data-act="sheet-close">Not now</button>`);
}
function deckSheet(n){
  const d = storeSeries().find(x => x.n === +n); if (!d) return;
  if (!d.missing.length) { toast('You already own every card in this deck', 'check'); return; }
  const list = `<div class="list st-cards">${d.cards.map(c => `<div class="row"><span class="st-dot ${owned(c) ? 'have' : ''}">${owned(c) ? ICO('check') : ICO('star')}</span>
    <span class="row-main"><b>${esc(c.name)}</b><small>${owned(c) ? 'Already yours · free' : 'New · ' + cardPrice(c) + ' coins'}</small></span></div>`).join('')}</div>`;
  buySheet({ title:d.label + ' Complete Deck', art:seriesDeckArt(d), list, price:d.deckPrice, act:'st-buy-deck', set:d.n,
    note:`Every ${esc(d.label)} card, rares included. You only pay for the ones you don't have.` });
}
function packSheet(n){
  const d = storePackList().find(x => String(x.n) === String(n)); if (!d) return;
  const left = storePacksLeft();
  buySheet({ title:d.label + ' Pack', art:seriesPackImg(d), price:PRICE.subjectPack, act:'st-buy-pack', set:d.n, locked:!left,
    note:`${left ? `${left} of ${PRICE.packsPerWeek} store packs left this week. ` : `You have bought this week's ${PRICE.packsPerWeek} store packs. Your daily pack is still free. `}3 cards, all from ${esc(d.label)}, sometimes with a sticker. ${d.missing.length ? `${d.missing.length} of the ${d.cards.length} ${esc(d.label)} cards are new to you.` : 'You own every card in this series, so each card turns into coins.'}` });
}
const copyBuysLeft = () => { const w = S.copyBuys; return !w || w.week !== weekKey() ? PRICE.copiesPerWeek : Math.max(0, PRICE.copiesPerWeek - w.n); };
function copySheet(){
  const left = copyBuysLeft();
  buySheet({ title:'1 Copy', art:`<span class="st-art boost"><img src="art/copy.webp" alt=""></span>`, price:PRICE.copy, act:'st-buy-copy', set:'copy', locked:!left, lockedText:'NO MORE COPIES THIS WEEK',
    note:`You have ${copies()} of the ${COPIES_TO_CERTIFY} Copies needed to certify a card. ${left ? `${left} of ${PRICE.copiesPerWeek} left to buy this week.` : 'You can buy more on Monday.'}` });
}
function buyCopy(){
  if (!copyBuysLeft() || !spendCoins(PRICE.copy, '1 Copy')) return;
  S.copyBuys = { week:weekKey(), n:PRICE.copiesPerWeek - copyBuysLeft() + 1 }; S.copies = copies() + 1;
  save(); closeSheet(true); refresh();
  toast(copies() >= COPIES_TO_CERTIFY ? `${copies()} Copies: open a card to certify it` : `+1 Copy · ${copies()} of ${COPIES_TO_CERTIFY}`, 'check');
}
function buyDeck(n){
  const d = storeSeries().find(x => x.n === +n); if (!d || !d.missing.length) return;
  if (!spendCoins(d.deckPrice, `${d.label} Complete Deck`)) return;
  d.missing.forEach(c => { S.cards[c.id].owned = true; });
  save(); closeSheet(true); refresh();
  openSheet(`<div class="reward"><h3>${esc(d.label)} Complete Deck added!</h3><p>${d.missing.length} new card${d.missing.length > 1 ? 's' : ''} in your collection.</p></div>
    <div class="st-new">${d.missing.map(c => miniCard(c)).join('')}</div>
    <button class="btn-big gold" data-act="sheet-close">NICE</button>`);
}
function buyPack(n){
  const d = packDef(n); if (!d) return;
  if (!storePacksLeft()) { toast(`You have bought this week's ${PRICE.packsPerWeek} store packs`, 'pack'); return; }
  if (!spendCoins(PRICE.subjectPack, `${d.label} Pack`)) return;
  S.storePacks = { week:weekKey(), n:PRICE.packsPerWeek - storePacksLeft() + 1 };
  closeSheet(true);
  const pulls = ADDON_PACKS.includes(d) ? drawAddonPack(d.n) : drawPack(d.n);
  openPack({ pulls, img:packArtOf(d.n), hint:`A ${d.label} pack! Tap it to tear it open.` });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const set = t.dataset.set;
  switch (t.dataset.act) {
    case 'st-deck': deckSheet(set); break;
    case 'st-pack': packSheet(set); break;
    case 'st-buy-deck': buyDeck(set); break;
    case 'st-buy-pack': buyPack(set); break;
    case 'st-copy': copySheet(); break;
    case 'st-buy-copy': buyCopy(); break;
    case 'coins-info': coinSheet(); break;
    case 'st-boost': { const b = BOOSTS.find(x => x.id === set); if (!b) break;
      if (!boostUsable(b)) { toast('No cold cases to warm up right now', 'thermo_snow'); break; }
      buySheet({ title:b.name, art:`<span class="st-art boost"><img src="${artSrc(b.art)}" alt=""></span>`, price:b.price, act:'st-buy-boost', set:b.id,
        note:esc(b.blurb) + (b.id === 'double' && doubleXPOn() ? ` Adds an hour to the ${doubleMinsLeft()} min you have left.` : '') }); break; }
    case 'st-buy-boost': buyBoost(set); break;
    case 'sty-pick': cardPicker(set); break;
    case 'sty-open': case 'card-style': closeSheet(true); styleSheet(t.dataset.id); break;
    case 'sty-deco': { const k = t.dataset.k; if (!DECO[k]) break; cardStyle(t.dataset.id).eq[k] = t.dataset.v || ''; save(); refresh(); styleSheet(t.dataset.id); break; }
    case 'sty-buydeco': { const k = t.dataset.k, D = DECO[k], x = D && D.list.find(y => y.id === t.dataset.v), c = byId(t.dataset.id);
      if (x && c && spendCoins(x.price, `${x.name} ${D.label.toLowerCase()}`)) { styles()[D.owned].push(x.id); cardStyle(c.id).eq[k] = x.id; save(); refresh(); styleSheet(c.id); toast(`${x.name} ${D.label.toLowerCase()} on ${c.name}. Use it on any card.`, 'sparkle'); } break; }
    case 'sty-frame': { const cs = cardStyle(t.dataset.id); cs.eq.frame = t.dataset.v || ''; save(); refresh(); styleSheet(t.dataset.id); break; }
    case 'sty-buyframe': { const f = FRAMES.find(x => x.id === t.dataset.v), c = byId(t.dataset.id);
      if (f && spendCoins(f.price, `${f.name} frame: ${c.name}`)) { const cs = cardStyle(c.id); cs.frames.push(f.id); cs.eq.frame = f.id; save(); refresh(); styleSheet(c.id); toast(`${f.name} frame on ${c.name}`, 'sparkle'); } break; }
    case 'sty-back': { const b = BACKS.find(x => x.id === set), st = styles();
      if (!set || st.backs.includes(set)) { st.back = set || ''; save(); refresh(); toast(`${set ? b.name : 'Classic'} card back in use`, 'cards'); break; }
      buySheet({ title:b.name + ' Card Back', art:`<span class="st-art back"><img src="${artSrc('back_' + b.id)}" alt=""></span>`, price:b.price, act:'sty-buyback', set:b.id, note:'For every card in your collection.' }); break; }
    case 'sty-buyback': { const b = BACKS.find(x => x.id === set);
      if (b && spendCoins(b.price, `${b.name} card back`)) { styles().backs.push(b.id); styles().back = b.id; save(); closeSheet(true); refresh(); toast(`${b.name} card back in use`, 'cards'); } break; }
    case 'st-cover': { const cv = COVERS.find(x => x.id === set); if (!cv) break;
      if (ownedCovers().includes(cv.id)) { toast('Yours already. Put it on from a binder\'s ••• menu.', 'check'); break; }
      buySheet({ title:cv.name + ' Cover', art:`<span class="st-art back">${coverHTML({ id:'_store', name:cv.name, cover:cv.id, slots:[] })}</span>`, price:cv.price, act:'st-buy-cover', set:cv.id, note:'Put it on any of your binders.' }); break; }
    case 'st-buy-cover': { const cv = COVERS.find(x => x.id === set);
      if (cv && spendCoins(cv.price, `${cv.name} binder cover`)) { ownedCovers().push(cv.id); save(); closeSheet(true); refresh(); toast(`${cv.name} cover is yours`, 'sparkle'); } break; }
    case 'cd-flip': { const w = t.closest('.cd-card'); if (w) w.classList.toggle('flipped'); break; }
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
.st-note{margin:-2px 2px 10px;font:18px/1.3 "Patrick Hand";color:var(--sub)} .st-note.c{text-align:center;margin:0 8px 12px}
.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.st-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 8px 12px;border:0;border-radius:16px;background:var(--bg2);color:var(--paper);text-align:center}
.st-item:active{transform:scale(.97)}
.st-art{position:relative;display:block;width:100%}
.st-art>img{display:block;width:100%;height:auto}
.st-art.pack{width:72%}
.st-art.deck.series-product{width:86%}.st-art.deck.series-product img{border-radius:10px}.st-art.pack.series-product{width:76%}
.st-art.series-product .st-series-tag{position:absolute;right:4%;bottom:5%;display:grid;place-items:center;min-width:34px;height:28px;padding:0 5px;border:2px solid #1d1b17;border-radius:6px;background:#f0c755;color:#1d1b17;font:20px/1 "Bangers";letter-spacing:.04em;transform:rotate(-5deg);box-shadow:2px 2px 0 rgba(0,0,0,.35)}
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
.st-after{display:flex;justify-content:space-between;padding:4px 6px;font:18px "Patrick Hand";color:var(--sub)}
.st-after b{color:var(--paper);font-weight:600} .st-after .ico{width:18px;height:18px}
.st-after.total{border-top:.5px solid var(--line);margin-bottom:10px;padding-top:8px} .st-after.total b{color:var(--mustard)}
.st-bimg{flex:none;width:52px;height:52px;display:flex;align-items:center;justify-content:center}
.st-bimg img{width:100%;height:100%;object-fit:contain}
.st-boost .st-price{margin-top:0} .st-boost.off{opacity:.55}
.st-art.boost{width:62%;margin:0 auto}
.st-art.back{width:62%} .st-art.back img{border-radius:6%/4%;box-shadow:0 4px 10px rgba(0,0,0,.4)}
.st-grid.backs{grid-template-columns:1fr 1fr 1fr} .st-grid.backs .st-name{font-size:14px}
.sty-card{width:42%;margin:0 auto 4px}
.sty-list .sty-row{display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:.5px solid var(--line)} .sty-list .sty-row:last-child{border-bottom:0}
.sty-prev{width:38px;height:56px;object-fit:cover;border-radius:5px;background:#3a342c}
.sty-btn{flex:none;min-height:34px;padding:0 14px;border-radius:17px;border:0;background:rgba(255,255,255,.1);color:var(--paper);font:600 14px var(--ui)}
.sty-btn.buy{background:var(--mustard);color:var(--ink)} .sty-btn.on{background:rgba(111,168,110,.25);color:#bfe0b5}
.sty-btn .ico{width:16px;height:16px;vertical-align:-3px} .sty-btn[disabled]{opacity:.45}
.cd-card{position:relative;perspective:1200px;cursor:pointer;isolation:isolate}
.cd-card .card,.cd-card .cd-back{transition:transform .6s cubic-bezier(.3,.8,.3,1);backface-visibility:hidden;-webkit-backface-visibility:hidden}
.cd-card .cd-back{position:absolute;inset:0;transform:rotateY(180deg);border-radius:6%/4%;overflow:hidden}
.cd-card .cd-back img{width:100%;height:100%;object-fit:cover}
.cd-card.flipped .card{transform:rotateY(-180deg)} .cd-card.flipped .cd-back{transform:rotateY(0)}
.st-new{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 14px}
.st-new .mini{width:auto;min-width:0}
.pk-label{position:absolute;left:18%;top:28%;width:66%;height:34%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;z-index:1;color:var(--ink);container-type:inline-size;pointer-events:none}
.pk-label img{position:static!important;width:56%!important;height:auto!important;filter:none!important}
.pk-label b{font:400 13cqw/1 "Bangers";letter-spacing:.03em;text-align:center}
.pk-pack.torn .pk-label{transition:transform .8s .5s ease-in,opacity .5s .85s;transform:translateY(80%);opacity:0}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STORE_CSS}</style>`);
