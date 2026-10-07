/* Clerk Quest bonus stickers: peel a sticker off its backing sheet in 3D. Ported from the user's Sticker Peel Test
   page (curl over a small roller, sticky back, shadow, matte or holo foil, crackle). Uses three.js through
   Pack3D.load() (pack3d.js). StickerPeel.mount(host, {src, holo, onPeeled}) fills host with the peel view.
   Card mode (the evolve tear, evolve.js): {aspect: width/height of the image (default 1, square), bare: true (no backing
   sheet, no shadow, no tilt, so the canvas lies exactly over a card in the page), frac: the share of the host's height
   the image fills (bare mode), edgeReach: how far from the edge a drag may start (sticker units, default .55)}. */
(function(){
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => window.__CLERK_QUEST_REDUCE_MOTION__ === true || motionQuery.matches;
  const PEEL = `
    uniform vec2 corner; uniform vec2 dir; uniform float fold; uniform float R;
    vec3 peel(vec3 p, out vec3 n, out float s){
      n = vec3(0.,0.,1.); s = -1.;
      if (fold < -8.) return p;
      float u = dot(p.xy - corner, dir); s = fold - u;
      if (s > 0.) {
        float a = s / R;
        if (a < 3.14159) { p.xy += dir * ((fold - R*sin(a)) - u); p.z = R*(1.-cos(a)); n = vec3(dir*sin(a), cos(a)); }
        else { p.xy += dir * ((fold + s - 3.14159*R) - u); p.z = 2.*R; n = vec3(0.,0.,-1.); }
      }
      return p;
    }`;
  const SW = 2.5, SH = 2.75;   // backing sheet; the sticker is 2 x 2 in the middle
  const OFF = 1.3;             // pull the edge this far (sticker is 2 wide) and it comes off

  async function mount(host, opt){
    await Pack3D.load();
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = opt.src; });
    const hc = document.createElement('canvas'); hc.width = hc.height = 128;   // small copy for "is the finger on the sticker"
    hc.getContext('2d').drawImage(img, 0, 0, 128, 128);
    const hits = hc.getContext('2d').getImageData(0, 0, 128, 128).data;
    const aspect = opt.aspect || 1, HW = Math.min(1, aspect), HH = Math.min(1, 1 / aspect), bare = !!opt.bare;   // half width/height in sticker units
    const onSticker = (x, y) => {
      const px = Math.floor((x / HW + 1) / 2 * 128), py = Math.floor((1 - (y / HH + 1) / 2) * 128);
      return px >= 0 && py >= 0 && px < 128 && py < 128 && hits[(py * 128 + px) * 4 + 3] > 100;
    };

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const cvs = renderer.domElement; cvs.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    host.appendChild(cvs);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 50); camera.position.set(0, 0, 7);
    const group = new THREE.Group(); scene.add(group);

    const tex = new THREE.Texture(img); tex.needsUpdate = true; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const U = { map:{ value:tex }, tilt:{ value:new THREE.Vector2() }, corner:{ value:new THREE.Vector2(9, 9) },
      dir:{ value:new THREE.Vector2(1, 0) }, fold:{ value:-9 }, R:{ value:.16 }, finish:{ value:opt.holo ? 2 : 0 }, fade:{ value:1 }, msg:{ value:null } };

    const blank = document.createElement('canvas'); blank.width = blank.height = 1;
    const blankTex = new THREE.CanvasTexture(blank); U.msg.value = blankTex;
    let msgTex = null;

    const stickerMat = new THREE.ShaderMaterial({
      uniforms:U, transparent:true, side:THREE.DoubleSide, extensions:{ derivatives:true },
      vertexShader: PEEL + `
        varying vec2 vUv; varying vec3 vN; varying float vS;
        void main(){ vUv = uv; vec3 n; float s; vec3 p = peel(position, n, s); vS = s;
          p.z += .004; vN = normalize(normalMatrix * n);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
      fragmentShader: `
        uniform sampler2D map; uniform vec2 tilt; uniform float finish; uniform float fold; uniform float fade;
        varying vec2 vUv; varying vec3 vN; varying float vS;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec4 t = texture2D(map, vUv);
          if (t.a < .03) discard;
          vec3 N = normalize(gl_FrontFacing ? vN : -vN);
          vec3 L = normalize(vec3(-tilt.x * 1.4 + .35, tilt.y * 1.4 + .55, 1.));
          float diff = .72 + .34 * max(dot(N, L), 0.);
          if (!gl_FrontFacing) { gl_FragColor = vec4(vec3(.93, .92, .89) * diff, t.a * fade); return; }   // the sticky back
          vec3 col = t.rgb * diff;
          if (fold > -8.) col *= 1. - step(vS, 0.) * .32 * exp(vS / .22);   // shadow beside the fold
          float lum = dot(t.rgb, vec3(.299, .587, .114));
          vec3 H = normalize(L + vec3(0., 0., 1.));
          float spec = pow(max(dot(N, H), 0.), 60.);
          float band = dot(vUv - .5, normalize(vec2(1., -.7))) - (tilt.x * .75 - tilt.y * .55);
          float glare = exp(-pow(band / .07, 2.));
          if (finish > .5) col += vec3(1.) * (spec * .35 + glare * .28);
          if (finish > 1.5) {                                                  // holo foil: rainbow sheen and sparkles
            col += vec3(1.) * (spec * .35 + glare * .28);
            float hue = vUv.x * 1.3 + vUv.y * .9 + tilt.x * 1.6 + tilt.y * 1.1 + N.x * 1.4 + N.y;
            vec3 rain = .5 + .5 * cos(6.2831 * (hue + vec3(0., .33, .67)));
            col = mix(col, col * .55 + rain * .62, .18 + .42 * smoothstep(.35, .95, lum));
            col += rain * glare * .35;
            float r = hash(floor(vUv * 170.));
            col += vec3(1.) * step(.975, r) * pow(max(0., sin(r * 60. + tilt.x * 22. + tilt.y * 17.)), 14.) * .9;
          }
          gl_FragColor = vec4(col, t.a * fade);
        }`,
    });
    const stickerGeo = new THREE.PlaneGeometry(2 * HW, 2 * HH, 140, 140), sticker = new THREE.Mesh(stickerGeo, stickerMat);
    group.add(sticker);

    // the backing sheet: paper, the die-cut line, the shiny liner under the sticker, and the flap's shadow
    const backMat = new THREE.ShaderMaterial({
      uniforms:U, extensions:{ derivatives:true },
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `
        uniform sampler2D map; uniform sampler2D msg; uniform vec2 tilt; uniform vec2 corner; uniform vec2 dir; uniform float fold; uniform float fade;
        varying vec2 vP;
        void main(){
          vec2 suv = (vP + 1.) * .5;
          float a = (suv.x > 0. && suv.x < 1. && suv.y > 0. && suv.y < 1.) ? texture2D(map, suv).a : 0.;
          vec3 paper = vec3(.95, .91, .82) * (.97 + fract(sin(dot(floor(vP * 260.), vec2(12.9898, 78.233))) * 43758.5453) * .03);
          vec3 liner = vec3(.91, .93, .95) + exp(-pow((dot(vP, vec2(.7, -.5)) - tilt.x + tilt.y) / .5, 2.)) * .08;
          vec4 m = texture2D(msg, clamp(suv, 0., 1.));
          liner = mix(liner, m.rgb, m.a);   // the surprise is printed on the liner, so it only shows inside the sticker's shape
          vec3 col = mix(paper, liner, smoothstep(.45, .55, a));
          col *= 1. - (1. - smoothstep(0., fwidth(a) * 1.6 + .001, abs(a - .5))) * .35;   // die-cut line
          if (fold > -8.) col *= 1. - .3 * fade * smoothstep(.3, .6, a) * exp(-abs(fold - dot(vP - corner, dir)) / .22);
          vec2 e = abs(vP) - vec2(${SW / 2}, ${SH / 2}) + .12;
          if (length(max(e, 0.)) - .12 > 0.) discard;
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const backGeo = new THREE.PlaneGeometry(SW, SH), backing = new THREE.Mesh(backGeo, backMat);
    backing.position.z = -.002; if (!bare) group.add(backing);
    const shMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false,
      vertexShader:`varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader:`varying vec2 vU; void main(){ vec2 d = abs(vU - .5) * 2.; gl_FragColor = vec4(0.,0.,0., .45 * (1. - smoothstep(.78, 1., max(d.x, d.y)))); }` });
    const shGeo = new THREE.PlaneGeometry(SW + .5, SH + .5), shadow = new THREE.Mesh(shGeo, shMat);
    shadow.position.set(.06, -.2, -.05); if (!bare) group.add(shadow);

    function fit(){
      const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      if (bare) {   // the image fills exactly opt.frac of the host's height, so it lines up with the page underneath
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(2 * HH / (opt.frac || 1) / 2 / 7)); camera.updateProjectionMatrix(); return;
      }
      const fovH = 2 * Math.atan((SH + .7) / 2 / 7), fovW = 2 * Math.atan((SW + .6) / 2 / 7 / camera.aspect);
      camera.fov = THREE.MathUtils.radToDeg(Math.max(fovH, fovW)); camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(fit); ro.observe(host); fit();

    /* sound: a soft paper crackle while peeling */
    let ac = null, noiseGain = null;
    function audio(){
      if (ac) return;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (Math.random() < .08 ? 1 : .25);
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .8;
        noiseGain = ac.createGain(); noiseGain.gain.value = 0;
        src.connect(bp); bp.connect(noiseGain); noiseGain.connect(ac.destination); src.start();
      } catch (_) { ac = null; }
    }
    const crackle = v => { if (ac && noiseGain) noiseGain.gain.setTargetAtTime(Math.min(v, .35), ac.currentTime, .03); };

    /* input: drag from the sticker's edge peels it; drag elsewhere tilts */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tilt = new THREE.Vector2(), tiltTarget = new THREE.Vector2();
    let vel = 0, mode = null, grab = null, edge = null, peelD = 0, peelTarget = 0, lastD = 0, lastInput = -1e9, off = false, fadeT = 0, live = true;
    let reduce = reducedMotion(), raf = 0;
    const schedule = () => { if (live && !raf && !document.hidden) raf = requestAnimationFrame(frame); };
    const motionChanged = () => { reduce = reducedMotion(); if (reduce) tiltTarget.set(0, 0); schedule(); };
    const visibilityChanged = () => { prev = performance.now(); if (!document.hidden) schedule(); };
    motionQuery.addEventListener?.('change', motionChanged);
    window.addEventListener('cq-native-motion', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    function local(e){
      const r = cvs.getBoundingClientRect();
      ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion), group.position);
      const p = new THREE.Vector3(); return ray.ray.intersectPlane(pl, p) ? group.worldToLocal(p) : null;
    }
    let started = false;
    function startPeel(from, dir){   // peel from an edge point in a direction (sticker units)
      edge = from.clone(); U.corner.value.copy(edge); U.dir.value.copy(dir);
      if (!started) { started = true; opt.onStart && opt.onStart(api); }   // the game decides what is under the sticker as the peel begins
    }

    /* the biggest wide rectangle that sits completely inside the sticker's shape (from the small alpha copy),
       found with a summed-area table; fractions of the sticker's square */
    function innerBox(){
      const N = 128, W = N + 1, sat = new Int32Array(W * W);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
        sat[(y + 1) * W + x + 1] = (hits[(y * N + x) * 4 + 3] > 100 ? 1 : 0) + sat[y * W + x + 1] + sat[(y + 1) * W + x] - sat[y * W + x];
      const full = (x0, y0, x1, y1) => sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0] === (x1 - x0) * (y1 - y0);
      let best = { a:0, x:44, y:48, w:40, h:32 };
      for (let h = 12; h <= N; h += 2) for (let w = Math.ceil(h * 1.3); w <= Math.min(N, h * 3.2); w += 2) {
        if (w * h <= best.a) continue;
        for (let y0 = 0; y0 + h <= N; y0 += 2) for (let x0 = 0; x0 + w <= N; x0 += 2)
          if (full(x0, y0, x0 + w, y0 + h)) { best = { a:w * h, x:x0, y:y0, w, h }; y0 = N; break; }
      }
      return { cx:(best.x + best.w / 2) / N, cy:(best.y + best.h / 2) / N, w:best.w / N, h:best.h / N };
    }

    /* print a message on the liner: {title, big, note, win}, drawn inside the sticker's shape */
    function setMessage(m){
      const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d'), b = innerBox(), bw = b.w * S * .96, bh = b.h * S * .96, cx = b.cx * S, cy = b.cy * S;
      const lines = [];
      const wrap = (txt, font, size, color, max) => {
        g.font = `${size}px ${font}`; let cur = '';
        txt.split(' ').forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > max && cur) { lines.push({ t:cur, font, size, color }); cur = w; } else cur = t; });
        if (cur) lines.push({ t:cur, font, size, color });
      };
      const u = Math.min(bw, bh * 1.8);   // type scales with the smaller side of the box
      if (m.title) lines.push({ t:m.title, font:'"Bangers"', size:u * .2, color:m.win ? '#b3261e' : '#2a231b' });   // these stay on one line (squeezed if needed)
      if (m.big) lines.push({ t:m.big, font:'"Luckiest Guy"', size:u * .24, color:'#1f1a14' });
      if (m.note) wrap(m.note, '"Patrick Hand"', u * .125, '#2a231b', bw);
      const lh = l => l.size * 1.12;
      let total = lines.reduce((a, l) => a + lh(l), 0), k = Math.min(1, bh / total);
      // squeeze any line that is still wider than the box
      lines.forEach(l => { g.font = `${l.size * k}px ${l.font}`; const w = g.measureText(l.t).width; if (w > bw) l.k = bw / w; });
      total = lines.reduce((a, l) => a + lh(l) * k * (l.k || 1), 0);
      let y = cy - total / 2;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach(l => { const sz = l.size * k * (l.k || 1); g.font = `${sz}px ${l.font}`; g.fillStyle = l.color; y += sz * .56; g.fillText(l.t, cx, y); y += sz * .56; });
      if (msgTex) msgTex.dispose();
      msgTex = new THREE.CanvasTexture(c); msgTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); U.msg.value = msgTex;
      schedule();
    }
    const api = {
      // "Peel it for me": peel from the bottom-right corner toward the top left
      autoPeel(){ if (off) return; audio(); startPeel(new THREE.Vector2(HW, -HH), new THREE.Vector2(-.7071, .7071)); comeOff(); schedule(); },
      setMessage,
      destroy,
    };
    cvs.addEventListener('pointerdown', e => {
      if (off) return; audio(); try { cvs.setPointerCapture(e.pointerId); } catch (_) {} lastInput = performance.now();
      const p = local(e);
      if (p && onSticker(p.x, p.y)) { mode = 'peel'; grab = new THREE.Vector2(p.x, p.y); edge = null; peelTarget = 0; peelD = 0; vel = 0; }
      else { mode = 'tilt'; }
      schedule();
    });
    cvs.addEventListener('pointermove', e => {
      lastInput = performance.now();
      if (mode === 'peel' && !off) {
        const p = local(e); if (!p) return;
        const P = new THREE.Vector2(p.x, p.y);
        if (!edge) {   // once the drag has a direction, find the sticker's edge behind the finger
          const v = P.clone().sub(grab); if (v.length() < .06) return;
          const dir = v.normalize(); let t = 0;
          while (t < 2.2 && onSticker(grab.x - dir.x * (t + .01), grab.y - dir.y * (t + .01))) t += .01;
          if (t > (opt.edgeReach || .55)) { mode = 'tilt'; opt.onHint && opt.onHint(); return; }   // started too far from the edge
          startPeel(new THREE.Vector2(grab.x - dir.x * t, grab.y - dir.y * t), dir);
        }
        const v = P.clone().sub(edge), d = v.length();
        if (d > .02) U.dir.value.copy(v).divideScalar(d);
        peelTarget = d;
        if (d > OFF) comeOff();
      } else if (mode === 'tilt') {
        const r = cvs.getBoundingClientRect();
        tiltTarget.set(((e.clientX - r.left) / r.width - .5) * 1.6, -((e.clientY - r.top) / r.height - .5) * 1.6);
      }
      schedule();
    });
    const up = () => { if (mode === 'peel' && !off) peelTarget = 0; mode = null; schedule(); };
    cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);

    function comeOff(){
      if (off) return; off = true; mode = null;
      peelTarget = 5.2;   // curl the whole sticker off the sheet, then fade it away
      setTimeout(() => { fadeT = performance.now(); schedule(); }, reduce ? 0 : 450);
      setTimeout(() => { crackle(0); opt.onPeeled && opt.onPeeled(); }, reduce ? 120 : 1000);
      schedule();
    }

    let prev = performance.now();
    function frame(now){
      raf = 0;
      if (!live) return;
      if (!cvs.isConnected) { destroy(); return; }
      const dt = Math.min((now - prev) / 1000, .05); prev = now;
      if (!bare && !reduce && now - lastInput > 2500 && mode === null) { const k = now / 1000; tiltTarget.set(Math.sin(k * .7) * .45, Math.cos(k * .53) * .3); }
      if (bare) tiltTarget.set(0, 0);   // stays flat on the card underneath
      if ((reduce || bare) && mode === null) tilt.set(0, 0);
      else tilt.lerp(tiltTarget, 1 - Math.pow(.001, dt));
      U.tilt.value.copy(tilt);
      group.rotation.y = tilt.x * .32; group.rotation.x = -tilt.y * .32;
      if (mode === 'peel' || off) { peelD += (peelTarget - peelD) * (1 - Math.pow(off ? .02 : .0005, dt)); vel = 0; }
      else { vel += (-90 * peelD - 13 * vel) * dt; peelD += vel * dt; if (Math.abs(peelD) < .002 && Math.abs(vel) < .01) { peelD = 0; vel = 0; } }
      const d = Math.max(peelD, 0), R = U.R.value;
      U.fold.value = d > .001 ? (d + Math.PI * R * Math.min(d / .5, 1)) * .5 : -9;
      if (fadeT) U.fade.value = Math.max(0, 1 - (now - fadeT) / 450);
      crackle(off && fadeT ? 0 : Math.abs(d - lastD) / Math.max(dt, .001) * .12 * (mode === 'peel' || off ? 1 : .4)); lastD = d;
      renderer.render(scene, camera);
      const animating = mode !== null || Math.abs(peelTarget - peelD) > .002 || Math.abs(vel) > .01 || (fadeT && now - fadeT < 450);
      if (!reduce || animating) schedule();
    }
    function destroy(){
      if (!live) return; live = false; if (raf) cancelAnimationFrame(raf); raf = 0; ro.disconnect();
      motionQuery.removeEventListener?.('change', motionChanged);
      window.removeEventListener('cq-native-motion', motionChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
      if (ac) { try { ac.close(); } catch (_) {} }
      [stickerGeo, backGeo, shGeo, stickerMat, backMat, shMat, tex, blankTex, msgTex].forEach(x => x && x.dispose());
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
    }
    schedule();

    return api;
  }

  window.StickerPeel = { mount };
})();
