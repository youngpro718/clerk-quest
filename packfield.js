/* Clerk Quest pack room: a word search in raised 3D letters behind the pack opening (after "Plain Sight",
   motion-pieces.pages.dev/plain-sight). How it behaves, as in the reference:
   - a few real words hide in a jumble of letters (across and down), each with its own colour; broken pieces of
     them are scattered around as decoys, and accidental full copies are removed
   - your finger presses a trench into the letters (deeper when you move fast); pressed letters take on a colour
     that drifts through the word colours
   - near a hidden word, it glows a little in its colour and lifts; touch it and it rises letter by letter from
     where you touched, the rest sinks a little, and the background leans toward its colour
   - tap a word and the whole floor floods with its colour for a moment
   - when the pack tears, the pack's own word does that for good: the floor floods its colour and the word keeps
     rising toward you, growing
   - on arrival every word pops up once, and when nobody touches the floor a slow invisible finger visits the words
   Uses three.js through Pack3D.load() (pack3d.js) and the Bangers outlines in fonts/bangers-typeface.json
   (tools/make_typeface.py). PackField.mount(host, {tint, words:[{word, color}, ...]}) -> Promise<{tear(), destroy()}>;
   words[0] is the pack's own word. If anything fails, the old background stays. */
(function(){
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => window.__CLERK_QUEST_REDUCE_MOTION__ === true || motionQuery.matches;
  const COMMON = 'ETAOINSRHLDCUMWFGYPBVK';   // filler letters, by how often they turn up in English, plus the words' own letters
  const CELL_W = .62, CELL_H = 1, DEPTH = 6, PITCH = 36, YAW = -16, FOV = 30;
  const RISE = 1.2, SINK = .6, TROUGH = 1.2, NEAR = 2.2;
  const NIGHT = 0x0d0b09, PAPER = 0x4e4031;   // dark letters on a night floor (a light paper version was tried and dropped)
  // where the words sit, as fractions of the screen, clear of the pack in the middle: the pack's own word first
  const SPOTS = {
    tall:[{ x:.5, y:.74 }, { x:.085, y:.4, down:true }, { x:.915, y:.3, down:true }, { x:.5, y:.95 }],
    wide:[{ x:.76, y:.52 }, { x:.2, y:.25 }, { x:.12, y:.68, down:true }, { x:.7, y:.88 }],
  };
  let fontP = null;
  const loadFont = () => fontP || (fontP = fetch('fonts/bangers-typeface.json').then(r => { if (!r.ok) throw new Error('font'); return r.json(); }).then(j => new THREE.Font(j)).catch(e => { fontP = null; throw e; }));
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  async function mount(host, opt = {}){
    await Pack3D.load();
    const font = await loadFont();
    if (!host.isConnected) throw new Error('closed');
    const T = THREE, tint = new T.Color(opt.tint || '#e3b23c');
    const words = (opt.words || [{ word:'CLERK', color:'#e8473a' }]).slice(0, 4).map(w => ({ letters:w.word.toUpperCase().replace(/[^A-Z]/g, ''), color:new T.Color(w.color) }));
    words.forEach(w => { w.lit = w.color.clone().lerp(new T.Color(0xffffff), .18); w.floor = new T.Color(NIGHT).lerp(w.color, .42); w.dim = new T.Color(NIGHT).lerp(w.color, .4); w.glow = w.color.clone().lerp(new T.Color(0xffffff), .35); });   // dim: the flooded letters, darker than the word so it stands out
    const ground = new T.Color(NIGHT).lerp(tint, .12), letterCol = new T.Color(PAPER).lerp(tint, .3);

    const cv = document.createElement('canvas'); cv.className = 'pk-field';
    host.insertBefore(cv, host.querySelector('.pk-bg')?.nextSibling || host.firstChild);
    const renderer = new T.WebGLRenderer({ canvas:cv, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(ground);
    renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(FOV, 1, .5, 200);
    scene.add(new T.HemisphereLight(0xffffff, 0x222222, .55));
    const sun = new T.DirectionalLight(0xfff2dd, 1.35); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
    scene.add(sun, sun.target);
    const mat = new T.MeshStandardMaterial({ color:0xffffff, roughness:.85, metalness:0 });

    // one extruded shape per letter, filling its cell, its top face at z = 0
    const geos = {};
    const glyph = ch => geos[ch] || (geos[ch] = (() => {
      const g = new T.TextGeometry(ch, { font, size:.8, height:DEPTH, curveSegments:3, bevelEnabled:false });
      g.computeBoundingBox(); const b = g.boundingBox, w = b.max.x - b.min.x, h = b.max.y - b.min.y;
      g.translate(-(b.min.x + w / 2), -(b.min.y + h / 2), -DEPTH);
      g.scale(Math.min(CELL_W * .9 / w, CELL_H * .9 / h * 1.3), CELL_H * .9 / h, 1);   // fill the cell, like a tight word-search grid (wide letters squeezed)
      return g;
    })());

    let cols = 0, rows = 0, ox = 0, oy = 0, cells = [], meshes = [], w = 0, h = 0;
    const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3();
    const onPlane = (nx, ny) => { ray.setFromCamera(new T.Vector2(nx, ny), camera); return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null; };
    const cellXY = (c, r) => [ox + (c - (cols - 1) / 2) * CELL_W, oy + ((rows - 1) / 2 - r) * CELL_H];   // the grid is centred on what the camera sees

    function layout(){
      w = cv.clientWidth || host.clientWidth; h = cv.clientHeight || host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const across = w / h >= 1 ? 16 : 10;   // about this many letters across the middle of the screen
      const dist = across * CELL_W / camera.aspect / 2 / Math.tan(T.MathUtils.degToRad(FOV / 2));
      const p = T.MathUtils.degToRad(PITCH), y = T.MathUtils.degToRad(YAW);
      camera.position.set(Math.sin(y) * Math.sin(p) * dist, -Math.cos(y) * Math.sin(p) * dist, Math.cos(p) * dist);
      camera.up.set(-Math.sin(y), Math.cos(y), 0); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      scene.fog = new T.Fog(ground, dist * .95, dist * 1.5);
      const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => onPlane(a, b)).filter(Boolean);
      const xs = corners.map(v => v.x), ys = corners.map(v => v.y);
      ox = (Math.max(...xs) + Math.min(...xs)) / 2; oy = (Math.max(...ys) + Math.min(...ys)) / 2;
      cols = Math.ceil((Math.max(...xs) - Math.min(...xs)) / CELL_W) + 4; rows = Math.ceil((Math.max(...ys) - Math.min(...ys)) / CELL_H) + 4;
      const half = Math.max(cols * CELL_W, rows * CELL_H) * .6;
      sun.target.position.set(ox, oy, 0); sun.position.set(ox - dist * .3, oy + dist * .25, dist * .45);
      Object.assign(sun.shadow.camera, { left:-half, right:half, top:half, bottom:-half, near:.5, far:dist * 3 }); sun.shadow.camera.updateProjectionMatrix();
      build();
    }

    // the word search: hidden words, decoy pieces of them, random letters, and no accidental extra copies
    function puzzle(){
      const rand = rng(7), N = cols * rows, ch = new Array(N).fill(''), owner = new Int16Array(N).fill(-1), at = (c, r) => r * cols + c;
      const spots = SPOTS[w / h >= 1 ? 'wide' : 'tall'];
      words.forEach((wd, k) => {
        const s = spots[k], p = s && onPlane(s.x * 2 - 1, 1 - s.y * 2); wd.cells = []; if (!p) return;
        const len = wd.letters.length, c0 = Math.round((p.x - ox) / CELL_W + (cols - 1) / 2) - (s.down ? 0 : Math.floor(len / 2)), r0 = Math.round((rows - 1) / 2 - (p.y - oy) / CELL_H) - (s.down ? Math.floor(len / 2) : 0);
        for (let i = 0; i < len; i++) {
          const c = s.down ? c0 : c0 + i, r = s.down ? r0 + i : r0;
          if (c < 0 || r < 0 || c >= cols || r >= rows || owner[at(c, r)] >= 0) continue;
          ch[at(c, r)] = wd.letters[i]; owner[at(c, r)] = k; wd.cells.push({ i:at(c, r), pos:i });
        }
      });
      const pool = COMMON + words.map(x => x.letters).join('');
      for (let i = 0; i < N; i++) if (!ch[i]) ch[i] = pool[Math.floor(rand() * pool.length)];
      const nearWord = i => { const c = i % cols, r = Math.floor(i / cols); for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const cc = c + dc, rr = r + dr; if (cc >= 0 && rr >= 0 && cc < cols && rr < rows && owner[at(cc, rr)] >= 0) return true; } return false; };
      for (let n = Math.floor(N / 34), t = 0; t < n; t++) {   // decoys: a word missing a letter or two, across or down
        const L = words[Math.floor(rand() * words.length)].letters, cut = 1 + Math.floor(rand() * 2), len = Math.max(3, L.length - cut);
        const piece = rand() < .5 ? L.slice(0, len) : L.slice(L.length - len), down = rand() < .5;
        const c0 = Math.floor(rand() * (cols - (down ? 1 : len))), r0 = Math.floor(rand() * (rows - (down ? len : 1)));
        const idx = [...piece].map((_, i) => down ? at(c0, r0 + i) : at(c0 + i, r0));
        if (!idx.some(i => owner[i] >= 0 || nearWord(i))) idx.forEach((i, k) => ch[i] = piece[k]);
      }
      const forms = words.flatMap(x => [x.letters, [...x.letters].reverse().join('')]);
      for (let pass = 0; pass < 50; pass++) {   // take out any full copy of a word that isn't the hidden one
        let changed = false;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (const f of forms) for (const down of [false, true]) {
          const idx = []; let ok = true;
          for (let k = 0; k < f.length && ok; k++) { const cc = down ? c : c + k, rr = down ? r + k : r; if (cc >= cols || rr >= rows) ok = false; else { idx.push(at(cc, rr)); if (ch[at(cc, rr)] !== f[k]) ok = false; } }
          if (!ok) continue;
          const free = idx.filter(i => owner[i] < 0); if (!free.length) continue;
          ch[free[Math.floor(rand() * free.length)]] = pool[Math.floor(rand() * pool.length)]; changed = true;
        }
        if (!changed) break;
      }
      return { ch, owner };
    }

    function build(){
      meshes.forEach(m => { scene.remove(m); m.dispose(); }); meshes = [];
      const { ch, owner } = puzzle();
      cells = ch.map((c, i) => { const col = i % cols, row = Math.floor(i / cols), [x, y] = cellXY(col, row); return { ch:c, word:owner[i], pos:-1, x, y, z:0, v:0, t:0, state:0, next:0, at:Infinity, col:letterCol.clone() }; });
      words.forEach((wd, k) => {
        wd.cells.forEach(({ i, pos }) => cells[i].pos = pos);
        const xs = wd.cells.map(({ i }) => cells[i].x), ys = wd.cells.map(({ i }) => cells[i].y);
        wd.box = xs.length ? { x0:Math.min(...xs) - CELL_W / 2 - .3, x1:Math.max(...xs) + CELL_W / 2 + .3, y0:Math.min(...ys) - CELL_H / 2, y1:Math.max(...ys) + CELL_H / 2 + .3 } : null;
        wd.mid = xs.length ? { x:(Math.min(...xs) + Math.max(...xs)) / 2, y:(Math.min(...ys) + Math.max(...ys)) / 2 } : { x:0, y:0 };
      });
      cells.forEach((cell, i) => { const c = i % cols, r = Math.floor(i / cols); cell.nb = [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < cols && b < rows).map(([a, b]) => b * cols + a); });
      const byChar = {};
      cells.forEach(cell => (byChar[cell.ch] = byChar[cell.ch] || []).push(cell));
      for (const c in byChar) {
        const list = byChar[c], m = new T.InstancedMesh(glyph(c), mat, list.length);
        m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
        list.forEach((cell, i) => { cell.mesh = m; cell.i = i; m.setColorAt(i, cell.col); });
        meshes.push(m); scene.add(m);
      }
      place(); dirty = true;
      if (chosen >= 0) choose(performance.now() / 1000, chosen, true);
      else if (!introDone) intro = performance.now() / 1000;
    }
    const M = new T.Matrix4(), V3 = new T.Vector3(), S3 = new T.Vector3(), Q = new T.Quaternion(), P3 = new T.Vector3();
    function place(){
      for (const cell of cells) {
        P3.set(cell.x, cell.y, cell.z);
        if (cell.t > .001) { V3.copy(camera.position).sub(P3).normalize(); P3.addScaledVector(V3, cell.t); }   // flying straight at the camera: same spot on screen, only bigger
        M.compose(P3, Q, S3.set(1, 1, 1)); cell.mesh.setMatrixAt(cell.i, M); cell.mesh.setColorAt(cell.i, cell.col);
      }
      meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    }

    // states: 0 resting, 1 a risen word letter, 2 sunk a little (another word is up), 3 flooded (a word was tapped / the pack opened)
    // each cell switches at its own time, so changes roll out from where they start, letter by letter
    const boxDist = (k, x, y) => { const b = words[k].box; if (!b) return Infinity; return Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1)); };
    function wave(now, k, x, y, delay = 0){   // word k comes up from (x, y); k = -1 puts everything back
      let from = 0;
      if (k >= 0) { let best = Infinity; words[k].cells.forEach(({ i, pos }) => { const d = Math.hypot(cells[i].x - x, cells[i].y - y); if (d < best) { best = d; from = pos; } }); }
      cells.forEach(cell => {
        const mine = k >= 0 && cell.word === k, st = mine ? 1 : k >= 0 ? 2 : 0;
        if (st === cell.next && cell.at <= now) return;
        cell.next = st; cell.at = now + delay + (mine ? Math.abs(cell.pos - from) * .06 : Math.hypot(cell.x - x, cell.y - y) * .028);
      });
    }
    let flood = -1, floodAt = 0, chosen = -1, chosenAt = 0, intro = -1, introDone = false;
    function choose(now, k, keep){   // flood the floor with word k's colour
      if (k < 0 || !words[k].box) return;
      flood = k; floodAt = now; if (keep) { chosen = k; chosenAt = chosenAt || now; }
      const m = words[k].mid;
      cells.forEach(cell => { if (cell.word === k) { cell.next = 1; cell.at = now + Math.abs(cell.pos - (words[k].letters.length - 1) / 2) * .06; } else { cell.next = 3; cell.at = now + Math.hypot(cell.x - m.x, cell.y - m.y) * .02; } });
      cells.forEach(cell => { if (cell.word === k) cell.v += 6; });   // a kick upward
    }

    // the finger (or mouse) on the floor
    let finger = null, lastTouch = -1e9, hover = -1, speed = 0, last = null, dirty = true, live = true, raf = 0;
    const toFloor = e => { const r = cv.getBoundingClientRect(); return onPlane((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const onMove = e => { if (!live) return; const p = toFloor(e); if (p) { finger = p; lastTouch = performance.now() / 1000; } };
    const onDown = e => {
      onMove(e); if (!finger || chosen >= 0 || e.pointerType === 'mouse' && e.button) return;
      const k = words.findIndex((_, i) => boxDist(i, finger.x, finger.y) === 0);
      if (k >= 0 && !e.target.closest?.('.pk-pack, .pk-card, button')) { const now = performance.now() / 1000; hover = k; wave(now, k, finger.x, finger.y); choose(now, k, false); }
    };
    const onUp = e => { if (e.pointerType !== 'mouse') finger = null; };
    addEventListener('pointermove', onMove); addEventListener('pointerdown', onDown); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    const ro = new ResizeObserver(() => { const nw = cv.clientWidth, nh = cv.clientHeight; if (nw && nh && (nw !== w || nh !== h)) layout(); });
    ro.observe(cv);

    // when nobody touches the floor, a slow invisible finger glides from word to word (a spring, so it eases in and out)
    const pilot = { x:0, y:-3, vx:0, vy:0, leg:0, dwell:0, on:false };
    function autopilot(now, dt){
      if (reducedMotion() || chosen >= 0 || now - lastTouch < 3.2) { pilot.on = false; return null; }
      if (!pilot.on) { pilot.on = true; pilot.x = finger ? finger.x : 0; pilot.y = finger ? finger.y : -3; pilot.vx = pilot.vy = 0; pilot.dwell = 0; }
      const order = [3, 1, 2, 0].filter(k => words[k] && words[k].box), wd = words[order[Math.floor(pilot.leg / 2) % order.length]];
      const stop = pilot.leg % 2 === 1, tx = stop ? wd.mid.x : wd.mid.x - 1.8, ty = stop ? wd.mid.y : wd.mid.y - 1.6, k = 2.6;
      pilot.vx += (k * k * (tx - pilot.x) - 2 * k * pilot.vx) * dt; pilot.vy += (k * k * (ty - pilot.y) - 2 * k * pilot.vy) * dt;
      pilot.x += pilot.vx * dt; pilot.y += pilot.vy * dt;
      if (Math.hypot(tx - pilot.x, ty - pilot.y) < (stop ? .15 : .6)) { pilot.dwell += dt; if (pilot.dwell >= (stop ? 1.6 : 0)) { pilot.leg++; pilot.dwell = 0; } }
      return { x:pilot.x, y:pilot.y };
    }

    const want = new T.Color(), groundNow = ground.clone(), groundWant = new T.Color(), cycle = new T.Color();
    let prev = performance.now() / 1000;
    function frame(){
      raf = 0; if (!live) return;
      if (!host.isConnected) return destroy();
      const now = performance.now() / 1000, raw = now - prev, dt = Math.min(raw, 1 / 30); prev = now;
      const still = reducedMotion();
      // arrival: every word pops up once, then settles
      if (intro >= 0 && !introDone) {
        if (now - intro > .35 && now - intro < 1.85 && !cells._introUp) { cells._introUp = true; cells.forEach(c => { c.next = c.word >= 0 ? 1 : 2; c.at = now + (c.word >= 0 ? c.pos * .06 : Math.hypot(c.x, c.y) * .028); }); }
        if (now - intro >= 1.85) { introDone = true; cells.forEach(c => { c.next = 0; c.at = now + (c.word >= 0 ? c.pos * .06 : Math.hypot(c.x, c.y) * .028); }); }
      }
      if (flood >= 0 && chosen < 0 && now - floodAt > 1.6) { flood = -1; if (finger && hover >= 0) wave(now, hover, finger.x, finger.y); else wave(now, -1, 0, 0); }
      const probe = finger || autopilot(now, dt);
      if (probe && last && raw > 0) speed = Math.max(speed * Math.exp(-raw * 6), Math.min(Math.hypot(probe.x - last.x, probe.y - last.y) / raw, 40));
      last = probe ? { x:probe.x, y:probe.y } : null;
      const press = (finger ? 1 : .6) * (.4 + .6 * Math.min(speed / 10, 1));
      // which word is under the finger, and how close each word is
      const near = words.map((_, k) => probe ? 1 - smooth(0, NEAR, boxDist(k, probe.x, probe.y)) : 0);
      if (chosen < 0 && flood < 0 && introDone) {
        const k = probe ? words.findIndex((_, i) => boxDist(i, probe.x, probe.y) === 0) : -1;
        if (k !== hover) { hover = k; wave(now, k, probe ? probe.x : 0, probe ? probe.y : 0); }
      }
      // the colour pressed letters take on: the word that's up, or a slow drift through all the word colours
      const lead = flood >= 0 ? flood : hover;
      if (lead >= 0) cycle.copy(words[lead].color);
      else { const n = Math.floor(now / 4.5), f = smooth(3, 4.5, now - n * 4.5); cycle.copy(words[n % words.length].color).lerp(words[(n + 1) % words.length].color, f); }
      // the pack's word, once chosen, comes toward you quickly at first and then keeps slowly growing
      const camDist = camera.position.length(), since = chosen >= 0 ? now - chosenAt : 0;
      const grow = chosen >= 0 ? Math.min(camDist * (.24 * (1 - Math.exp(-since * 1.1)) + .02 * since), camDist * .42) : 0;
      let moving = false;
      for (const cell of cells) {
        if (now >= cell.at) { cell.state = cell.next; cell.at = Infinity; }
        let target = cell.state === 1 ? (cell.word === chosen ? RISE * .5 : RISE * (cell.word === flood ? 1.45 : 1)) :   // the pack's word comes toward you instead of up, so the cards don't hide it
           cell.state === 2 ? -SINK : cell.state === 3 ? -SINK * .8 : 0;
        if (cell.state !== 1) {
          if (probe) { const dx = (cell.x - probe.x) / TROUGH, dy = (cell.y - probe.y) / TROUGH; target -= press * Math.exp(-(dx * dx + dy * dy)); }
          if (cell.word >= 0) target += RISE * .3 * Math.pow(near[cell.word], 1.5);
        }
        const tTarget = cell.state === 1 && cell.word === chosen ? grow : 0;
        if (still) { cell.z = target; cell.v = 0; cell.t = tTarget; }
        else {
          let pull = 0; for (const j of cell.nb) if (cells[j].state === cell.state) pull += cells[j].z - cell.z;   // neighbours tug on each other, so the floor moves like a sheet
          const k = cell.state === 1 ? 170 : 120, c = cell.state === 1 ? 11 : 9;
          cell.v += (k * (target - cell.z) + 55 * pull - c * cell.v) * dt; cell.z += cell.v * dt;
          cell.t += (tTarget - cell.t) * (1 - Math.exp(-dt * 4));
        }
        // colour
        if (cell.state === 1 && cell.word >= 0) want.copy(cell.word === chosen ? words[cell.word].glow : words[cell.word].lit);
        else {
          want.copy(letterCol);
          if (cell.state === 2 && hover >= 0) want.lerp(words[hover].color, .16);
          if (cell.state === 3 && flood >= 0) want.lerp(words[flood].dim, chosen >= 0 ? .75 : .6);
          if (cell.word >= 0 && near[cell.word] > 0) want.lerp(words[cell.word].color, .45 * Math.pow(near[cell.word], 1.5));
          const depth = -cell.z - (cell.state === 2 ? SINK : 0), f = .9 * smooth(.08, .75, depth);
          if (f > 0) want.lerp(cycle, f);
        }
        const dr = want.r - cell.col.r, dg = want.g - cell.col.g, db = want.b - cell.col.b, e = still ? 1 : 1 - Math.exp(-dt * 9);
        cell.col.r += dr * e; cell.col.g += dg * e; cell.col.b += db * e;
        if (Math.abs(cell.v) > .002 || Math.abs(target - cell.z) > .002 || Math.abs(cell.t - tTarget) > .002 || Math.abs(dr) + Math.abs(dg) + Math.abs(db) > .004 || cell.at < Infinity) moving = true;
      }
      // the floor itself leans toward the word that's up: a little while you touch it, a lot when it floods
      groundWant.copy(ground);
      if (flood >= 0) groundWant.lerp(words[flood].floor, chosen >= 0 ? .7 : .55);
      else { if (hover >= 0) groundWant.lerp(words[hover].floor, .25); else { const k = near.indexOf(Math.max(...near)); if (k >= 0 && near[k] > 0) groundWant.lerp(words[k].floor, .15 * near[k]); } }
      const before = groundNow.r + groundNow.g + groundNow.b;
      groundNow.lerp(groundWant, still ? 1 : 1 - Math.exp(-dt * (flood >= 0 ? 4 : 3)));
      if (Math.abs(before - groundNow.r - groundNow.g - groundNow.b) > .001) { moving = true; renderer.setClearColor(groundNow); if (scene.fog) scene.fog.color.copy(groundNow); }
      if (moving || dirty || probe) { place(); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); dirty = false; }
      raf = requestAnimationFrame(frame);
    }
    layout();
    renderer.render(scene, camera);
    requestAnimationFrame(() => cv.classList.add('on'));
    raf = requestAnimationFrame(frame);

    function destroy(){
      if (!live) return; live = false; if (raf) cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      ro.disconnect(); meshes.forEach(m => m.dispose()); Object.values(geos).forEach(g => g.dispose()); mat.dispose();
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {} cv.remove();
    }
    return {
      // the pack is open: its word (words[0]) floods the floor with its colour and keeps rising toward you
      tear(){ const now = performance.now() / 1000; introDone = true; hover = 0; choose(now, 0, true); },
      destroy,
    };
  }

  window.PackField = { mount };
})();
