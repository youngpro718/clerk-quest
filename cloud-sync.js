/* Clerk Quest cloud saves. The existing localStorage save remains the offline cache. */
(function () {
  'use strict';
  const URL = 'https://yfryuuqaznhjcqrotkjt.supabase.co';
  const KEY = 'sb_publishable_wyJS_rqCmfm2Fulzt6aG6g_0Yj9zbct';
  const SAVE = 'clerkquest-v2';
  const OWNER = 'clerkquest-cloud-owner';
  const MODIFIED = 'clerkquest-cloud-updated-at';
  const TABLE = 'clerk_quest_player_saves';
  let client, session = null, timer = null, pending = null, initialized = false;
  let applying = false, activeUser = null, deleting = false, reloading = false;
  // Reload after replacing or clearing the local save. Until the page is gone, the app must not save its
  // old in-memory state back over it (its pagehide save would undo the change and loop forever).
  const reload = () => { reloading = true; clearTimeout(timer); location.reload(); };

  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const remove = key => { try { localStorage.removeItem(key); } catch (_) {} };
  const local = () => { try { return JSON.parse(read(SAVE) || 'null'); } catch (_) { return null; } };
  const meaningful = state => !!(state && state.cards && (
    (state.stats && (state.stats.answered || state.stats.sessions || state.stats.xp)) ||
    state.packsOpened || (state.packs != null && state.packs !== 1) ||
    Object.values(state.cards).some(card => card && (card.level > 1 || card.xp > 0 || card.mastered)) ||
    Object.keys(state.milestones || {}).length
  ));
  const emit = (status, extra = {}) =>
    window.dispatchEvent(new CustomEvent('cq-cloud', { detail: { status, user: session?.user || null, ...extra } }));

  function markLocalUpdated() {
    if (applying || reloading) return;
    write(MODIFIED, new Date().toISOString());
  }

  async function pushNow() {
    clearTimeout(timer);
    if (!client || !session?.user || applying || deleting || reloading) return { skipped: true };
    if (pending) { await pending; if (!read(MODIFIED)) return { ok: true }; }
    const userId = session.user.id;
    const state = local();
    if (!state || read(OWNER) !== userId) return { skipped: true };
    const stamp = read(MODIFIED) || new Date().toISOString();
    write(MODIFIED, stamp);
    pending = (async () => {
      const { error } = await client.from(TABLE).upsert({
        user_id: userId, save_version: 1, save_data: state, device_updated_at: stamp
      }, { onConflict: 'user_id' });
      if (error) throw error;
      if (session?.user.id === userId) emit('synced');
      return { ok: true };
    })();
    try { return await pending; }
    catch (error) { emit('error', { error }); throw error; }
    finally {
      pending = null;
      if (session?.user.id === userId && read(MODIFIED) !== stamp) queuePush();
    }
  }

  function queuePush() {
    if (!session?.user || applying || read(OWNER) !== session.user.id) return;
    clearTimeout(timer);
    timer = setTimeout(() => pushNow().catch(() => {}), 700);
  }

  function applyCloud(state, stamp, userId) {
    applying = true;
    try {
      write(SAVE, JSON.stringify(state));
      write(OWNER, userId);
      if (stamp) write(MODIFIED, stamp); else remove(MODIFIED);
    } finally { applying = false; }
    reload();
  }

  async function pullAndResolve() {
    if (!session?.user) return;
    const userId = session.user.id;
    const { data, error } = await client.from(TABLE)
      .select('save_data,device_updated_at,updated_at')
      .eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (session?.user.id !== userId) return;
    const cloud = data?.save_data;
    const cloudHasProgress = meaningful(cloud);
    const owner = read(OWNER);
    const device = local();
    const deviceHasProgress = meaningful(device);

    // A signed-in user's cache must never be offered to a different account.
    if (owner && owner !== userId) {
      if (cloudHasProgress) return applyCloud(cloud, data.device_updated_at || data.updated_at, userId);
      return applyCloud(null, null, userId);
    }
    if (!cloudHasProgress && deviceHasProgress) {
      write(OWNER, userId);
      markLocalUpdated();
      await pushNow();
      emit('uploaded-local');
      return;
    }
    if (cloudHasProgress && !deviceHasProgress) {
      return applyCloud(cloud, data.device_updated_at || data.updated_at, userId);
    }
    if (!cloudHasProgress && !deviceHasProgress) {
      write(OWNER, userId);
      emit('signed-in');
      return;
    }

    // Existing account on this device: use its newest copy. A guest cache
    // with real progress asks before replacing either copy.
    if (!owner && JSON.stringify(device) !== JSON.stringify(cloud)) {
      const useDevice = window.confirm('This device and your account both have progress. Keep this device\'s progress? (Cancel loads your account\'s progress.)');
      if (!useDevice) return applyCloud(cloud, data.device_updated_at || data.updated_at, userId);
      write(OWNER, userId);
      markLocalUpdated();
      await pushNow();
      emit('uploaded-local');
      return;
    }
    const cloudTime = Date.parse(data.device_updated_at || data.updated_at || '') || 0;
    const deviceTime = Date.parse(read(MODIFIED) || '') || 0;
    if (cloudTime > deviceTime && JSON.stringify(device) !== JSON.stringify(cloud)) {
      const useCloud = window.confirm('Your account has newer progress from another device. Load it here? (Cancel keeps this device\'s progress.)');
      if (useCloud) return applyCloud(cloud, data.device_updated_at || data.updated_at, userId);
      markLocalUpdated();
      await pushNow();
      emit('uploaded-local');
      return;
    }
    write(OWNER, userId);
    if (deviceTime > cloudTime) await pushNow();
    emit('signed-in');
  }

  async function handleSession(next) {
    session = next;
    const userId = next?.user?.id || null;
    if (!userId) {
      if (activeUser) {
        clearTimeout(timer);
        remove(SAVE); remove(OWNER); remove(MODIFIED);
        activeUser = null;
        emit('signed-out');
        reload();
      } else emit('signed-out');
      return;
    }
    if (activeUser === userId) return;
    activeUser = userId;
    try { await pullAndResolve(); }
    catch (error) { emit('error', { error }); }
  }

  async function init() {
    if (initialized) return;
    if (!window.supabase?.createClient) throw new Error('Supabase library did not load');
    client = window.supabase.createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    initialized = true;
    client.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => emit('recovery'), 0);   // opened from a reset-password email
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      // Supabase auth callbacks must not await another Supabase request.
      setTimeout(() => handleSession(next), 0);
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    await handleSession(data.session);
    window.addEventListener('online', () => {
      if (session?.user) pullAndResolve().catch(error => emit('error', { error }));
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && session?.user) pushNow().catch(() => {});
    });
  }

  async function signIn(email) {
    if (!client) throw new Error('Cloud sync is unavailable. Please reload and try again.');
    const { error } = await client.auth.signInWithOtp({
      email, options: { emailRedirectTo: location.origin + location.pathname }
    });
    if (error) throw error;
    emit('link-sent');
  }

  async function signOut() {
    if (!client) return;
    await pushNow();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  /* ---------- email + password accounts ---------- */
  const redirect = () => location.origin + location.pathname;
  function friendlyError(error) {
    const code = String(error?.code || ''), msg = String(error?.message || '');
    if (/failed to fetch|network/i.test(msg) || !navigator.onLine) return "You're offline. Try again when you're connected.";
    if (code === 'user_already_exists' || /already registered/i.test(msg)) return 'That email already has an account. Sign in instead.';
    if (code === 'invalid_credentials' || /invalid login/i.test(msg)) return 'Wrong email or password.';
    if (code === 'weak_password' || (/password/i.test(msg) && /characters|short|weak/i.test(msg))) return 'Password needs at least 8 characters.';
    if (code === 'email_not_confirmed') return 'Check your email to confirm your account, then sign in.';
    if (code === 'same_password') return 'That is already your password. Pick a new one.';
    if (code.startsWith('over_') || /rate limit|too many/i.test(msg)) return 'Too many tries. Wait a minute and try again.';
    return msg || 'Something went wrong. Please try again.';
  }
  const need = () => { if (!client) throw new Error('Cloud save is unavailable. Please reload and try again.'); };
  async function signUp(email, password) {
    need();
    const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirect() } });
    if (error) throw error;
    // With email confirmation on, an existing email comes back as a user with no identities
    if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw { code: 'user_already_exists' };
    return { needsConfirm: !data.session };
  }
  async function signInPassword(email, password) {
    need();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function resetPassword(email) {
    need();
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect() });
    if (error) throw error;
  }
  /* Delete the account and its cloud save (Apple requires this in-app), then clear this device */
  async function deleteAccount() {
    need();
    deleting = true; clearTimeout(timer);
    const { error } = await client.rpc('clerk_quest_delete_my_account');
    if (error) { deleting = false; throw error; }
    remove(SAVE); remove(OWNER); remove(MODIFIED);
    activeUser = null;
    try { await client.auth.signOut({ scope: 'local' }); } catch (_) {}
    reload();
  }
  async function updatePassword(password) {
    need();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }

  window.CQCloud = {
    init, signIn, signOut, pushNow, queuePush, markLocalUpdated,
    signUp, signInPassword, resetPassword, updatePassword, deleteAccount, friendlyError,
    rpc: async (name, args) => { need(); const { data, error } = await client.rpc(name, args); if (error) throw error; return data; },   // admin view reads
    getUser: () => session?.user || null,
    isReloading: () => reloading,
    getStatus: () => !client ? 'unavailable' : session?.user ? 'signed-in' : 'signed-out'
  };
})();
