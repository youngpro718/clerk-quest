/* Clerk Quest accounts. Try first, then sign up: a new player plays as a guest (welcome, first pack, first round).
   When the first study round ends, the sign-up screen covers the app until there's an account (the guest's progress
   moves into it; see cloud-sync.js). A guest can also sign up any time from Settings. Email + password, forgotten-password reset, change password, sign out,
   and delete account (an App Store requirement). Loaded before the main script; everything here runs at call time
   and uses the app's globals (S, esc, push, refresh, topEntry, goBack, nav, toast, iosAlert, ICO, chev, maybeWelcome)
   and window.CQCloud. */

const acct = { tab:'create', email:'', pw:'', show:false, busy:false, err:'', info:'' };   // typed values survive a re-render
const cloud = () => window.CQCloud && CQCloud.getStatus() !== 'unavailable' ? CQCloud : null;
const cloudUser = () => cloud() && CQCloud.getUser();

function acctField(kind, value, auto){
  const pw = kind === 'pw';
  return `<label class="acct-lab">${pw ? 'Password' : 'Email'}
    <span class="acct-in"><input id="acct-${kind}" data-k="${kind}" type="${pw ? (acct.show ? 'text' : 'password') : 'email'}" value="${esc(value)}"
      autocomplete="${auto}" ${pw ? '' : 'inputmode="email" autocapitalize="off" spellcheck="false"'} placeholder="${pw ? (auto === 'current-password' ? 'Your password' : 'At least 8 characters') : 'you@example.com'}">
    ${pw ? `<button type="button" class="acct-eye" data-act="acct-show">${acct.show ? 'Hide' : 'Show'}</button>` : ''}</span></label>`;
}
const acctNotes = () => `${acct.err ? `<p class="acct-err">${ICO('warning')} ${esc(acct.err)}</p>` : ''}${acct.info ? `<p class="acct-info">${ICO('check')} ${esc(acct.info)}</p>` : ''}`;
const acctBtn = label => `<button class="btn-big gold" ${acct.busy ? 'disabled' : ''}>${acct.busy ? 'ONE MOMENT…' : label}</button>`;

/* The sign-in forms, shared by the login screen and the account screen */
function authFormHTML(tab){
  if (tab === 'newpw') return `<p class="acct-sub">Choose a new password for your account.</p>
    <form class="acct-form" novalidate data-form="newpw">${acctField('pw', acct.pw, 'new-password')}${acctNotes()}${acctBtn('SAVE NEW PASSWORD')}</form>`;
  if (tab === 'forgot') return `<p class="acct-sub">Enter your email and we'll send a link to choose a new password.</p>
    <form class="acct-form" novalidate data-form="forgot">${acctField('email', acct.email, 'email')}${acctNotes()}${acctBtn('SEND RESET LINK')}</form>
    <button class="acct-link" data-act="acct-tab" data-tab="signin">‹ Back to sign in</button>`;
  const create = tab !== 'signin';
  return `<div class="seg" role="tablist">${[['create', 'Create account'], ['signin', 'Sign in']].map(([v, l]) =>
      `<button role="tab" class="${(create ? 'create' : 'signin') === v ? 'on' : ''}" data-act="acct-tab" data-tab="${v}">${l}</button>`).join('')}</div>
    <p class="acct-sub">${create ? 'Create a free account. Your cards, coins, and notes save to it, on every device.' : 'Welcome back. Sign in to pick up where you left off.'}</p>
    <form class="acct-form" novalidate data-form="${create ? 'create' : 'signin'}">
      ${acctField('email', acct.email, 'email')}${acctField('pw', acct.pw, create ? 'new-password' : 'current-password')}${acctNotes()}
      ${acctBtn(create ? 'CREATE ACCOUNT' : 'SIGN IN')}</form>
    ${create ? `<p class="acct-foot">Already have an account? <button class="acct-link in" data-act="acct-tab" data-tab="signin">Sign in</button></p>`
      : `<button class="acct-link" data-act="acct-tab" data-tab="forgot">Forgot password?</button>`}`;
}

/* ---------- the login screen: covers everything until you're signed in ---------- */
function showLogin(wall){
  let el = document.getElementById('login-root');
  if (!el) { el = document.createElement('div'); el.id = 'login-root'; document.body.appendChild(el); }
  if (wall) el.dataset.wall = '1';
  const closable = !el.dataset.wall && !guestWallDue();
  el.innerHTML = `<div class="login">
    ${brandHTML('small')}
    ${el.dataset.wall ? `<p class="login-wall"><b>Nice work!</b> Create your account to keep your cards and keep playing.</p>`
      : `<p class="login-tag">Study the court rules. Collect the cards.</p>`}
    ${closable ? `<button class="login-x" data-act="acct-close" aria-label="Close">Not now</button>` : ''}
    ${cloud() ? authFormHTML(acct.tab)
      : `<p class="acct-err">${ICO('warning')} Can't reach Becoming a Clerk right now. Check your connection, then try again.</p>
         <button class="btn-big gold" data-act="acct-retry">TRY AGAIN</button>`}</div>`;
}
function hideLogin(){ const el = document.getElementById('login-root'); if (!el) return; el.remove(); refresh(); maybeWelcome(); }
/* Signing in on purpose (Settings, Home, or the welcome): the same screen, with a way to close it */
function openSignIn(tab){ Object.assign(acct, { tab:tab || 'signin', err:'', info:'' }); showLogin(false); }
document.addEventListener('click', e => { if (e.target.closest('[data-act="acct-close"]')) { document.getElementById('login-root')?.remove(); refresh(); } });
/* The guest wall: once a guest has finished a study round, they sign up (or sign in) to keep playing. */
const guestWallDue = () => !cloudUser() && !!(S.stats && S.stats.sessions >= 1);
function guestWall(){ if (guestWallDue() && !document.getElementById('login-root')) { acct.tab = 'create'; showLogin(true); } }
/* Called once at startup, after the cloud has loaded: guests play until their first round is done */
function requireLogin(){ if (cloudUser()) maybeWelcome(); else if (guestWallDue()) guestWall(); else maybeWelcome(); }

const ACCOUNT_SCREENS = {
  account(p){
    const user = cloudUser();
    if (!user) return { title:'Account', body:`<p class="st-note">You're playing as a guest.</p><button class="btn-big gold" data-act="cloud-signin" data-tab="signin">SIGN IN</button>
      <button class="btn-big alt" data-act="cloud-signin" data-tab="create">CREATE AN ACCOUNT</button>` };
    if (p.tab === 'newpw') return { title:'New Password', body:authFormHTML('newpw') };
    return { title:'Account', body:`
      <div class="acct-card on">${ICO('cloud')}<span><b>Signed in</b><small>${esc(user.email || '')}</small></span></div>
      <p class="st-note">Your progress saves to your account automatically. Sign in on any phone or computer to pick up where you left off.</p>
      ${acctNotes()}
      <div class="list">
        <button class="row" data-act="acct-changepw"><span class="th emo gi">${ICO('lock')}</span><span class="row-main"><b>Change password</b></span>${chev}</button>
        <button class="row" data-act="acct-signout"><span class="th emo gi">${ICO('signout')}</span><span class="row-main"><b>Sign out</b></span></button>
      </div>
      <button class="acct-delete" data-act="acct-delete">Delete account</button>` };
  },
};

/* ---------- actions ---------- */
function acctRender(){ if (document.getElementById('login-root')) showLogin(); else refresh(); }
function acctSet(patch){ Object.assign(acct, patch); acctRender(); }
async function acctRun(job, done){
  acctSet({ busy:true, err:'', info:'' });
  try { const r = await job(); acct.busy = false; done(r); }
  catch (e) { acctSet({ busy:false, err:CQCloud.friendlyError(e) }); }
}
function acctSubmit(kind){
  const email = acct.email.trim(), pw = acct.pw;
  if (kind !== 'newpw' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return acctSet({ err:'Enter a valid email address.', info:'' });
  if (kind !== 'forgot' && pw.length < 8) return acctSet({ err:'Password needs at least 8 characters.', info:'' });
  // Create / sign in: the login screen closes when the cloud reports the new session (see the cq-cloud listener)
  if (kind === 'create') acctRun(() => CQCloud.signUp(email, pw), r => {
    acct.pw = '';
    if (r && r.needsConfirm) acctSet({ tab:'signin', info:'Account created. Check your email to confirm it, then sign in here.' });
    else acctSet({ info:'Account created. Loading…' });
  });
  if (kind === 'signin') acctRun(() => CQCloud.signInPassword(email, pw), () => { acct.pw = ''; acctSet({ info:'Signed in. Loading…' }); });
  if (kind === 'forgot') acctRun(() => CQCloud.resetPassword(email), () => acctSet({ info:'If that email has an account, a reset link is on its way.' }));
  if (kind === 'newpw') acctRun(() => CQCloud.updatePassword(pw), () => {
    acct.pw = ''; toast('New password saved', 'check');
    const st = nav.stacks[nav.tab];
    if (st.length > 1 && st[st.length - 2].s === 'account') goBack();   // back to the account screen it came from
    else { const en = topEntry(); en.p = { ...en.p, tab:'' }; refresh(); }
  });
}
document.addEventListener('submit', e => {
  const f = e.target.closest('.acct-form'); if (!f) return;
  e.preventDefault(); if (!acct.busy) acctSubmit(f.dataset.form);
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.k; if (e.target.closest('.acct-form') && k) acct[k] = e.target.value; });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  switch (t.dataset.act) {
    case 'acct-tab': acctSet({ tab:t.dataset.tab, err:'', info:'' }); break;
    case 'acct-show': acctSet({ show:!acct.show }); break;
    case 'acct-retry': location.reload(); break;
    case 'acct-changepw': Object.assign(acct, { pw:'', err:'', info:'' }); push('account', { tab:'newpw' }); break;
    case 'acct-signout':
      iosAlert({ title:'Sign out?', msg:'Your progress stays in your account. Sign back in any time to keep playing.',
        buttons:[{ label:'Cancel', value:false, style:'bold' }, { label:'Sign Out', value:true, style:'destructive' }] })
        .then(ok => { if (ok) CQCloud.signOut().catch(err => toast(CQCloud.friendlyError(err))); });
      break;
    case 'acct-delete':
      iosAlert({ title:'Delete your account?', msg:'This permanently deletes your account and all your progress: cards, coins, notes, and binders. It can\'t be undone.',
        buttons:[{ label:'Cancel', value:false, style:'bold' }, { label:'Delete', value:true, style:'destructive' }] })
        .then(ok => { if (ok) acctRun(() => CQCloud.deleteAccount(), () => {}); });
      break;
  }
});
window.addEventListener('cq-cloud', e => {
  const st = e.detail.status;
  if (st === 'recovery') { hideLogin(); Object.assign(acct, { pw:'', err:'', info:'' }); push('account', { tab:'newpw' }); return; }
  if (['signed-in', 'uploaded-local', 'synced'].includes(st) && cloudUser()) {
    Object.assign(acct, { pw:'', busy:false, err:'', info:'' });
    hideLogin();
  }
  if (st === 'error' && cloudUser() && document.getElementById('login-root')) { acct.busy = false; hideLogin(); }   // signed in but the save didn't load: play on this device
  if (topEntry && topEntry() && topEntry().s === 'account' && !acct.busy) refresh();
});

const ACCOUNT_CSS = `
#login-root{position:fixed;inset:0;z-index:950;background:var(--bg);overflow-y:auto;color:var(--paper)}
.login{max-width:420px;margin:0 auto;padding:calc(64px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom))}
.login .home-logo{text-align:center;margin:0 0 6px}
.login-tag{margin:0 0 22px;text-align:center;font:19px "Patrick Hand";color:var(--sub)}
.login-x{position:absolute;top:calc(12px + env(safe-area-inset-top));right:14px;min-height:40px;padding:0 14px;border:0;border-radius:20px;background:var(--bg2);color:var(--mustard);font:18px "Patrick Hand"}
.guest-bar{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:40px;margin:-4px 0 12px;border:0;border-radius:12px;background:rgba(143,179,209,.12);color:var(--sub);font:17px "Patrick Hand"}
.guest-bar b{color:var(--mustard);font-weight:400;text-decoration:underline}
.wl-signin{display:block;margin:12px auto 0;border:0;background:none;color:var(--mustard);font:18px "Patrick Hand";text-decoration:underline}
.login-wall{margin:0 0 22px;text-align:center;font:20px/1.35 "Patrick Hand";color:var(--paper)}
.login-wall b{display:block;font:400 30px/1.1 "Bangers";letter-spacing:.05em;color:var(--mustard)}
.acct-sub{margin:0 0 14px;font:19px/1.3 "Patrick Hand";color:var(--sub)}
.acct-foot{margin:6px 0 0;text-align:center;font:18px "Patrick Hand";color:var(--sub)}
.acct-card{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:14px;border:2px solid var(--mustard);border-radius:16px;background:var(--bg2);color:var(--paper);text-align:left}
.acct-card .ico{width:40px;height:40px;flex:none} .acct-card span{flex:1;display:flex;flex-direction:column;gap:2px}
.acct-card b{font:400 20px "Bangers";letter-spacing:.04em} .acct-card small{font:14px var(--ui);color:var(--sub)}
.acct-card.on{border-color:#5fd47a}
.acct-form{display:flex;flex-direction:column;gap:12px;margin:0 0 12px}
.acct-lab{display:flex;flex-direction:column;gap:6px;font:18px "Patrick Hand";color:var(--sub)}
.acct-in{position:relative;display:block}
.acct-in input{display:block;width:100%;height:50px;padding:0 70px 0 14px;border:2px solid transparent;border-radius:12px;background:var(--bg2);color:var(--paper);font:20px "Patrick Hand"}
.acct-in input:focus{outline:none;border-color:var(--mustard)}
.acct-eye{position:absolute;right:6px;top:7px;height:36px;padding:0 12px;border:0;border-radius:9px;background:rgba(255,255,255,.08);color:var(--paper);font:17px "Patrick Hand"}
.acct-err,.acct-info{display:flex;align-items:flex-start;gap:8px;margin:0 0 12px;padding:10px 12px;border-radius:12px;font:18px/1.25 "Patrick Hand"}
.acct-form .acct-err,.acct-form .acct-info{margin:0}
.acct-err{background:rgba(200,70,50,.18);color:#ffb4a6} .acct-info{background:rgba(95,212,122,.14);color:#bfeec9}
.acct-err .ico,.acct-info .ico{width:18px;height:18px;flex:none;margin-top:1px}
.acct-link{display:block;margin:4px auto;padding:8px;border:0;background:none;color:var(--mustard);font:19px "Patrick Hand"}
.acct-link.in{display:inline;margin:0;padding:0}
.acct-delete{display:block;margin:24px auto 8px;padding:10px;border:0;background:none;color:#ff8a78;font:19px "Patrick Hand"}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${ACCOUNT_CSS}</style>`);
