/* Clerk Quest pack room: a floor of raised 3D letters behind the pack opening, like a word search of court words
   (after "Plain Sight", motion-pieces.pages.dev). Letters sink under your finger on springs, a ripple runs out
   when the pack tears, and a hidden word rises in the series colour. Uses three.js through Pack3D.load() (pack3d.js)
   and the Bangers outlines in fonts/bangers-typeface.json (tools/make_typeface.py).
   PackField.mount(host, {tint, word, wordColor}) -> Promise<{tear(), destroy()}>; if anything fails, the old background stays. */
(function(){
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => window.__CLERK_QUEST_REDUCE_MOTION__ === true || motionQuery.matches;
  // the jumble is made of these, so stray court words show up in it, word-search style
  const FILLER = 'CLERKCOURTDOCKETFILEDSEALOATHJURYBENCHCASEORDERMOTIONRECORDSUMMONSEXHIBITCALENDARPARTGAVELWRIT';
  const CELL_W = .62, CELL_H = 1, DEPTH = 3, PITCH = 36, YAW = -16, FOV = 30;
  const NIGHT = 0x0d0b09, PAPER = 0x4e4031;   // dark letters on a night floor (a light paper version was tried and dropped)
  let fontP = null;
  const loadFont = () => fontP || (fontP = fetch('fonts/bangers-typeface.json').then(r => { if (!r.ok) throw new Error('font'); return r.json(); }).then(j => new THREE.Font(j)).catch(e => { fontP = null; throw e; }));
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  async function mount(host, opt = {}){
    await Pack3D.load();
    const font = await loadFont();
    if (!host.isConnected) throw new Error('closed');
    const T = THREE, tint = new T.Color(opt.tint || '#e3b23c'), word = (opt.word || 'CLERK').toUpperCase().replace(/[^A-Z]/g, '');
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

    // one extruded shape per letter, centred in its cell, its top face at z = 0
    const geos = {};
    const glyph = ch => geos[ch] || (geos[ch] = (() => {
      const g = new T.TextGeometry(ch, { font, size:.8, height:DEPTH, curveSegments:3, bevelEnabled:false });
      g.computeBoundingBox(); const b = g.boundingBox, w = b.max.x - b.min.x, h = b.max.y - b.min.y;
      g.translate(-(b.min.x + w / 2), -(b.min.y + h / 2), -DEPTH);
      g.scale(Math.min(CELL_W * .9 / w, CELL_H * .9 / h * 1.3), CELL_H * .9 / h, 1);   // fill the cell, like a tight word-search grid (wide letters squeezed)
      return g;
    })());

    let cols = 0, rows = 0, ox = 0, oy = 0, cells = [], meshes = [], wordCells = [], w = 0, h = 0;
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

    function build(){
      meshes.forEach(m => { scene.remove(m); m.dispose(); }); meshes = [];
      const rand = rng(7), grid = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid.push({ c, r, ch:FILLER[Math.floor(rand() * FILLER.length)], word:-1 });
      // the hidden word: between the cards and the hint on a phone, beside the cards on a wide screen
      const spot = w / h >= 1 ? onPlane(.52, -.05) : onPlane(0, -.3);
      wordCells = [];
      if (spot) {
        const c0 = Math.round((spot.x - ox) / CELL_W + (cols - 1) / 2 - (word.length - 1) / 2), r0 = Math.round((rows - 1) / 2 - (spot.y - oy) / CELL_H);
        [...word].forEach((ch, i) => { const cell = grid[r0 * cols + c0 + i]; if (cell) { cell.ch = ch; cell.word = i; wordCells.push(cell); } });
      }
      cells = grid;
      const byChar = {};
      cells.forEach(cell => { (byChar[cell.ch] = byChar[cell.ch] || []).push(cell); [cell.x, cell.y] = cellXY(cell.c, cell.r); cell.z = cell.z || 0; cell.v = 0; cell.col = letterCol.clone(); cell.delay = 0; });
      for (const ch in byChar) {
        const list = byChar[ch], m = new T.InstancedMesh(glyph(ch), mat, list.length);
        m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
        list.forEach((cell, i) => { cell.mesh = m; cell.i = i; m.setColorAt(i, cell.col); });
        meshes.push(m); scene.add(m);
      }
      place(); dirty = true;
    }
    const M = new T.Matrix4();
    function place(){
      for (const cell of cells) { M.makeTranslation(cell.x, cell.y, cell.z); cell.mesh.setMatrixAt(cell.i, M); cell.mesh.setColorAt(cell.i, cell.col); }
      meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    }

    // the finger (or mouse) on the floor; when nobody touches it for a while, a slow drifting point keeps it alive
    let finger = null, lastTouch = -1e9, tearAt = -1, reveal = -1, dirty = true, live = true, raf = 0;
    const toFloor = e => { const r = cv.getBoundingClientRect(); return onPlane((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const onMove = e => { if (!live) return; const p = toFloor(e); if (p) { finger = p; lastTouch = performance.now() / 1000; } };
    const onUp = e => { if (e.pointerType !== 'mouse') finger = null; };
    addEventListener('pointermove', onMove); addEventListener('pointerdown', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    const ro = new ResizeObserver(() => { const nw = cv.clientWidth, nh = cv.clientHeight; if (nw && nh && (nw !== w || nh !== h)) layout(); });
    ro.observe(cv);

    const wordCol = new T.Color(opt.wordColor || tint);   // the hidden word's own colour, picked to stand out and match the pack
    let prev = performance.now() / 1000;
    function frame(){
      raf = 0; if (!live) return;
      if (!host.isConnected) return destroy();
      const now = performance.now() / 1000, dt = Math.min(now - prev, 1 / 30); prev = now;
      const still = reducedMotion();
      let probe = finger, sinkAmt = .9;
      if (!probe && !still && now - lastTouch > 2.5) {   // the drifting point
        probe = { x:Math.sin(now * .23) * cols * CELL_W * .32, y:Math.sin(now * .17 + 1) * rows * CELL_H * .3 }; sinkAmt = .55;
      }
      let moving = false;
      for (const cell of cells) {
        let target = 0;
        if (probe) { const dx = (cell.x - probe.x) / 1.25, dy = (cell.y - probe.y) / 1.25; target -= sinkAmt * Math.exp(-(dx * dx + dy * dy)); }
        if (tearAt >= 0 && now - tearAt < 2.4) {   // the ripple from the torn pack
          const d = Math.hypot(cell.x, cell.y), ring = (now - tearAt) * 7;
          target += .7 * Math.exp(-Math.pow((d - ring) / .9, 2)) * Math.max(0, 1 - (now - tearAt) / 2.4);
        }
        const inWord = reveal >= 0 && cell.word >= 0 && now >= reveal + cell.word * .08;
        if (inWord) target = 1;
        else if (reveal >= 0 && now > reveal) target -= .3;
        if (still) { cell.z = target; cell.v = 0; }
        else { const a = 120 * (target - cell.z) - 11 * cell.v; cell.v += a * dt; cell.z += cell.v * dt; }
        const want = inWord ? wordCol : letterCol;
        const before = cell.col.r + cell.col.g + cell.col.b;
        cell.col.lerp(want, 1 - Math.exp(-dt * 8));
        if (Math.abs(cell.v) > .002 || Math.abs(target - cell.z) > .002 || Math.abs(before - (cell.col.r + cell.col.g + cell.col.b)) > .001) moving = true;
      }
      if (moving || dirty) { place(); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); dirty = false; }
      raf = requestAnimationFrame(frame);
    }
    layout();
    renderer.render(scene, camera);
    requestAnimationFrame(() => cv.classList.add('on'));
    raf = requestAnimationFrame(frame);

    function destroy(){
      if (!live) return; live = false; if (raf) cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      ro.disconnect(); meshes.forEach(m => m.dispose()); Object.values(geos).forEach(g => g.dispose()); mat.dispose();
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {} cv.remove();
    }
    return {
      // the pack is open: a ripple runs out from the middle, then the hidden word rises letter by letter
      tear(){ const now = performance.now() / 1000; tearAt = now; reveal = now + .45; },
      destroy,
    };
  }

  window.PackField = { mount };
})();
