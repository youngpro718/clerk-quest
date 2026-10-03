/* Clerk Quest pack rip in 3D: the torn flap curls back over itself like a peeled sticker (the curl from the
   Sticker Peel Test page). Uses three.js, loaded only for packs. The pack screen (openPack in index.html) calls
   Pack3D.attach() and drives it with peel() and finish(); if three.js can't load, the flat CSS rip is used instead. */
(function(){
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => window.__CLERK_QUEST_REDUCE_MOTION__ === true || motionQuery.matches;
  let loading = null;
  function load(){
    if (window.THREE) return Promise.resolve();
    if (!loading) loading = new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = THREE_URL; s.async = true;
      s.onload = () => window.THREE ? ok() : no(new Error('no THREE'));
      s.onerror = () => { loading = null; no(new Error('three.js failed to load')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  setTimeout(() => load().catch(() => {}), 4000);   // warm up after startup, so the first pack is ready

  // The curl: points between the grabbed edge and the fold roll over a cylinder of radius R, then lie flat on top.
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

  /* ---- a soft paper crackle while peeling (Web Audio noise through a band-pass filter) ---- */
  function crackler(){
    let ac = null, gain = null;
    return {
      start(){
        if (ac) return;
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
          for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (Math.random() < .08 ? 1 : .25);
          const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
          const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .8;
          gain = ac.createGain(); gain.gain.value = 0;
          src.connect(bp); bp.connect(gain); gain.connect(ac.destination); src.start();
        } catch (_) { ac = null; }
      },
      set(v){ if (ac && gain) gain.gain.setTargetAtTime(Math.min(v, .35), ac.currentTime, .03); },
      stop(){ if (ac) { try { ac.close(); } catch (_) {} ac = null; } },
    };
  }

  /* Attach to a pack button. line: [[x%, y%], ...] ragged tear line; tearY: its average height in %. */
  async function attach(btn, src, line, tearY){
    await load();
    const img = new Image(); img.crossOrigin = 'anonymous';
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = src; });
    const W = btn.clientWidth, H = btn.clientHeight; if (!W || !H) throw new Error('pack not laid out');
    const maxY = Math.max(...line.map(p => p[1])), Hf = Math.ceil(H * (maxY + .5) / 100);

    // the flap as a texture: the top of the pack art, cut along the ragged line
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fc = document.createElement('canvas'); fc.width = Math.round(W * dpr); fc.height = Math.round(Hf * dpr);
    const g = fc.getContext('2d'); g.scale(dpr, dpr);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0);
    for (let i = line.length - 1; i >= 0; i--) g.lineTo(line[i][0] / 100 * W, line[i][1] / 100 * H);
    g.closePath(); g.clip(); g.drawImage(img, 0, 0, W, H);

    // canvas around the flap, with room above and to the sides for the curl and the fling
    const PX = W * .5, PY = H * .45;
    const cv = document.createElement('canvas'); cv.className = 'pk-3d';
    Object.assign(cv.style, { position:'absolute', left:-PX + 'px', top:-PY + 'px', width:(W + 2 * PX) + 'px', height:(Hf + PY + 6) + 'px', pointerEvents:'none', zIndex:4, visibility:'hidden' });
    btn.appendChild(cv);
    const renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:true, alpha:true, premultipliedAlpha:false });
    renderer.setPixelRatio(dpr); renderer.setSize(W + 2 * PX, Hf + PY + 6, false);
    const scene = new THREE.Scene();
    // camera in CSS pixels: x right from the pack's left edge, y up from the pack's top edge. A little
    // perspective, so the curling flap comes toward you; the flat flap still lines up with the pack art.
    // The view is centered on the flap (so a lifted curl grows evenly, not upward); the canvas shows the top part of it.
    const CW = W + 2 * PX, CH = Hf + PY + 6, FH = 2 * (PY + Hf / 2), D = FH * 3;
    const camera = new THREE.PerspectiveCamera(2 * Math.atan(FH / 2 / D) * 180 / Math.PI, CW / FH, 1, D * 3);
    camera.position.set(W / 2, -Hf / 2, D); camera.setViewOffset(CW, FH, 0, 0, CW, CH);

    const tex = new THREE.CanvasTexture(fc); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const R = Math.max(8, W * .09);   // curl radius: a loose bend you can see
    const U = { map:{ value:tex }, corner:{ value:new THREE.Vector2(0, 0) }, dir:{ value:new THREE.Vector2(1, 0) }, fold:{ value:-9 }, R:{ value:R } };
    const mat = new THREE.ShaderMaterial({
      uniforms:U, transparent:true, side:THREE.DoubleSide,
      vertexShader: PEEL + `
        varying vec2 vUv; varying vec3 vN; varying float vS;
        void main(){ vUv = uv; vec3 n; float s; vec3 p = peel(position, n, s); vS = s; vN = n;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
      fragmentShader: `
        uniform sampler2D map; uniform float fold; uniform float R;
        varying vec2 vUv; varying vec3 vN; varying float vS;
        void main(){
          vec4 t = texture2D(map, vUv);
          if (t.a < .03) discard;
          vec3 N = normalize(gl_FrontFacing ? vN : -vN);
          vec3 L = normalize(vec3(.35, .55, 1.));
          float diff = 1. + .34 * (max(dot(N, L), 0.) - L.z);          // exactly 1 where the flap lies flat
          float spec = pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), 40.);
          if (!gl_FrontFacing) {                                         // the inside of the wrapper: silver foil
            float cr = sin(vUv.x * 41. + sin(vUv.y * 7. + vUv.x * 11.) * 2.2 + sin(vUv.x * 13. - vUv.y * 5.) * 1.4) * .5 + .5;   // soft crinkles in the foil
            float band = exp(-pow((vUv.x * 1.6 - vUv.y * .4 - .55 + N.x * .8) / .18, 2.));   // a moving sheen
            vec3 foil = (vec3(.68, .71, .76) + vec3(.12) * cr) * diff + vec3(.55) * spec + vec3(.35) * band;
            gl_FragColor = vec4(foil, t.a); return;
          }
          vec3 col = t.rgb * diff + vec3(.25) * spec * step(0., vS);
          if (fold > -8.) col *= 1. - step(vS, 0.) * .32 * exp(vS / (R * 1.4));   // shadow beside the fold
          gl_FragColor = vec4(col, t.a);
        }`,
    });
    const geo = new THREE.PlaneGeometry(W, Hf, Math.min(200, Math.round(W / 1.5)), 6);
    geo.translate(W / 2, -Hf / 2, 0);
    scene.add(new THREE.Mesh(geo, mat));

    const snd = crackler();
    let shown = false, target = 0, cur = 0, last = 0, fin = null, prev = performance.now(), live = true, raf = 0;
    let reduce = reducedMotion();
    const schedule = () => { if (live && !raf && !document.hidden) raf = requestAnimationFrame(frame); };
    const motionChanged = () => { reduce = reducedMotion(); schedule(); };
    const visibilityChanged = () => { prev = performance.now(); if (!document.hidden) schedule(); };
    motionQuery.addEventListener?.('change', motionChanged);
    window.addEventListener('cq-native-motion', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    function show(){
      if (shown) return; shown = true; cv.style.visibility = 'visible';
      btn.querySelectorAll('.pk-rest, .pk-flap').forEach(el => el.style.visibility = 'hidden');
    }
    function setDir(d){ const r = d < 0; U.corner.value.set(r ? W : 0, 0); U.dir.value.set(r ? -1 : 1, 0); }
    function frame(now){
      raf = 0;
      if (!live) return;
      if (!cv.isConnected) { destroy(); return; }
      const dt = Math.min((now - prev) / 1000, .05); prev = now;
      if (reduce) cur = target;
      else cur += (target - cur) * (1 - Math.pow(fin ? .00001 : .0005, dt));
      const d = Math.max(cur, 0);
      U.fold.value = d > .5 ? d : -9;   // the fold (where the tear has reached) sits under the finger
      snd.set(Math.abs(d - last) / Math.max(dt, .001) / W * .5); last = d;
      if (fin && d >= target - 2) { const cb = fin; fin = null; snd.set(0); cb(); }
      renderer.render(scene, camera);
      if (fin || Math.abs(target - cur) > .05) schedule();
    }
    function destroy(){
      live = false; if (raf) cancelAnimationFrame(raf); raf = 0; snd.stop();
      motionQuery.removeEventListener?.('change', motionChanged);
      window.removeEventListener('cq-native-motion', motionChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
      geo.dispose(); mat.dispose(); tex.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
    }
    schedule();

    return {
      // p: 0..1 of the way across; dir: 1 = torn from the left, -1 = from the right
      peel(p, dir){ if (!live) return; snd.start(); setDir(dir); show(); target = p * W; schedule(); },
      // curl the whole strip over, fling it away, then call done
      finish(dir, done){
        if (!live) return done();
        snd.start(); setDir(dir); show(); target = W * 1.2;
        fin = () => {
          cv.style.transition = reduce ? 'none' : 'transform .6s cubic-bezier(.3,.8,.4,1), opacity .45s .15s';
          cv.style.transformOrigin = '50% 100%';
          cv.style.transform = `translate(${dir < 0 ? -30 : 30}%, -45%) rotate(${dir < 0 ? -24 : 24}deg)`;
          cv.style.opacity = '0';
          setTimeout(destroy, reduce ? 0 : 800);
          done();
        };
        schedule();
      },
      destroy,
    };
  }

  window.Pack3D = { load, attach };
})();
