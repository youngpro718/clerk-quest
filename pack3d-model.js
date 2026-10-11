/* Clerk Quest pack in real 3D: the whole foil packet (a glb from tools/blender/foil_pack.py) in a WebGL canvas laid over
   the .pk-pack button. It sways with the button's own tilt, the foil shines as it turns, the top strip curls off as you
   swipe, and when the tear finishes the strip flies away and the packet drops out of the way of the card reveal.
   PackModel3D.attach(btn, packImg, line, tearY) has the same controller as Pack3D: { peel(p, dir), finish(dir, done), destroy() }.
   It rejects when it can't run (unknown pack art, no WebGL, files missing); openPack then falls back to pack3d.js. */
(function(){
  const THREE_URLS = ['three.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => window.__CLERK_QUEST_REDUCE_MOTION__ === true || motionQuery.matches;
  const scriptOnce = {};
  function loadScript(url){
    return scriptOnce[url] || (scriptOnce[url] = new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = url; s.async = true;
      s.onload = ok; s.onerror = () => { s.remove(); delete scriptOnce[url]; no(new Error('failed to load ' + url)); };
      document.head.appendChild(s);
    }));
  }
  function loadLibs(){
    const three = window.THREE ? Promise.resolve() : THREE_URLS.reduce((p, u) => p.catch(() => loadScript(u).then(() => { if (!window.THREE) throw 0; })), Promise.reject());
    return three.then(() => THREE.GLTFLoader ? 0 : loadScript('pack3d/GLTFLoader.js')).then(() => { if (!THREE.GLTFLoader) throw new Error('no GLTFLoader'); });
  }
  function glbFor(src){
    const m = /(?:^|\/)pack(?:_(s[2-9]|tricks))?\.(?:png|webp|jpe?g)(?:$|\?)/.exec(String(src));
    return m ? 'pack3d/pack_' + (m[1] || 's1') + '.glb' : null;
  }
  // where the packet sits inside the pack art: the alpha bounding box (+4px), the same crop foil_pack.py made
  function artBox(img){
    const w = 480, h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data; let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { x0:0, x1:1, y0:0, y1:1 };
    const pad = 4 / img.naturalWidth, pady = 4 / img.naturalHeight;
    return { x0:Math.max(0, x0 / w - pad), x1:Math.min(1, (x1 + 1) / w + pad), y0:Math.max(0, y0 / h - pady), y1:Math.min(1, (y1 + 1) / h + pady) };
  }

  // the peel: the strip's vertices roll over a cylinder of radius uR between the grabbed corner and the fold
  const PEEL_GLSL = `
    uniform float uFold; uniform float uR; uniform vec2 uCorner; uniform vec2 uDir;
    vec4 peelCalc(vec3 p){
      float u = dot(p.xy - uCorner, uDir); float s = uFold - u;
      if (uFold < -8. || s <= 0.) return vec4(0., 0., 0., 0.);
      float a = s / uR;
      if (a < 3.14159) return vec4((uFold - uR*sin(a)) - u, uR*(1.-cos(a)), a, 0.);
      return vec4((uFold + s - 3.14159*uR) - u, 2.*uR, 3.14159, 1.);
    }`;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const clamp01 = t => Math.min(1, Math.max(0, t));

  // cache: libraries, each glb, each pack art (preload fills it early so attach() has everything on the first frame)
  const cache = { gltf:{}, img:{}, libs:null };
  const libsOnce = () => cache.libs || (cache.libs = loadLibs().catch(e => { cache.libs = null; throw e; }));
  function gltfOnce(url){
    return cache.gltf[url] || (cache.gltf[url] = libsOnce().then(() => new Promise((ok, no) => new THREE.GLTFLoader().load(url, ok, undefined, no))).catch(e => { delete cache.gltf[url]; throw e; }));
  }
  function imgOnce(src){
    return cache.img[src] || (cache.img[src] = new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error('pack art')); i.src = src; }).catch(e => { delete cache.img[src]; throw e; }));
  }
  // the pack after it was torn open: art/pack_opened_<key>.webp (pack.png -> pack_opened_s1, pack_s3.png -> pack_opened_s3, pack_tricks.png -> pack_opened_tricks); same extension as the pack art
  function openedFor(src){
    const m = /^(.*?\/)?pack(?:_(s[2-9]|tricks))?(\.(?:png|webp|jpe?g)(?:\?.*)?)$/.exec(String(src));
    return m ? (m[1] || '') + 'pack_opened_' + (m[2] || 's1') + m[3] : null;
  }
  const openedImg = packImg => { const u = openedFor(packImg); return u ? imgOnce(u).catch(() => null) : Promise.resolve(null); };
  function preload(packImg){
    const url = glbFor(packImg); if (!url) return Promise.resolve(false);
    openedImg(packImg);
    return Promise.all([gltfOnce(url), imgOnce(packImg)]).then(() => true, () => false);
  }

  // The torn-open pack as a gently puffed textured sheet. o: { w, h } plane size and { cx, cy } its centre (packet units), z (front),
  // bulge (puff), split (also build a back wall: the front copy has the silver mouth cut out so things can rise out of it).
  function mouthCut(img, keepMouth){   // a copy of the art with the open mouth (the silver inside, found column by column from the top edge down to the gold torn rim) made transparent
    const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    let id; try { id = g.getImageData(0, 0, w, h); } catch (e) { return null; }
    const mouth = new Uint8Array(w * h), d = id.data, Y = Math.round(h * 0.28), ys = new Array(w).fill(-1), ye = new Array(w).fill(-1);
    const sat = i => { const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b); return mx ? (mx - Math.min(r, gg, b)) / mx : 0; };
    const gold = (x, y) => d[(y * w + x) * 4 + 3] > 127 && sat((y * w + x) * 4) > 0.3;
    for (let x = 0; x < w; x++) {
      let y0 = 0; while (y0 < Y && d[(y0 * w + x) * 4 + 3] <= 127) y0++;
      if (y0 >= Y) continue;
      let n = 0; for (let k = 0; k < 6; k++) if (gold(x, Math.min(Y, y0 + k))) n++;
      if (n > 2) continue;
      let y = y0; while (y < Y) { let q = 0; for (let k = 0; k < 5; k++) if (y + k < h && gold(x, y + k)) q++; if (q >= 4) break; y++; }
      ys[x] = y0; ye[x] = y;
    }
    // columns that failed (thin gold lines) take their neighbours' median
    const med = (arr, x, r) => { const v = []; for (let k = -r; k <= r; k++) if (arr[x + k] >= 0) v.push(arr[x + k]); v.sort((a, b) => a - b); return v.length ? v[v.length >> 1] : -1; };
    const ye2 = ye.slice(), ys2 = ys.slice();
    for (let x = 0; x < w; x++) { if (ye[x] < 0 && x > 0.14 * w && x < 0.93 * w) { ye2[x] = med(ye, x, 6); ys2[x] = med(ys, x, 6); } else if (ye[x] >= 0) { ye2[x] = med(ye, x, 3); } }
    for (let x = 0; x < w; x++) { if (ye2[x] < 0) continue; const e = Math.max(ys2[x], ye2[x] - 2); for (let y = Math.max(0, ys2[x] - 1); y < e; y++) mouth[y * w + x] = 1; }
    for (let i = 0; i < w * h; i++) if (keepMouth ? !mouth[i] : mouth[i]) d[i * 4 + 3] = 0;
    g.putImageData(id, 0, 0);
    return c;
  }
  // Registration of each opened-pack PNG onto its closed-pack PNG (both 1024x1536). The torn-open art was drawn separately, so its artwork is
  // shifted/squashed against the closed art: s1 measured by patch matching (title, badge, Gavel, copier, banner, laurels, side borders; residual <= 4px):
  //   closedX = (openedX - 3.9) / 0.9948 ; closedY = (openedY - 163.1) / 0.9066 down to the banner (opened y 1238 = closed 1190), then the bottom crimp
  //   is stretched so the opened bottom edge (1509) lands on the closed bottom edge (1504). Knots are [openedY, closedY]; ox/sx map x: closedX = sx*openedX + ox.
  // On top of that, ox/dy/ys (3px right, 15px down, y squashed 2% about y=760, x squashed 1.4% about x=512) remove the small residual between the flat PNG and how the puffed 3D body renders it,
  // measured on screen in pack3d/test.html (patch-matching the body alone against the opened sheet alone: residual within ~2 screen px).
  // Other packs default to fitting the opaque bounding boxes onto each other (see defaultReg).
  const OPENED_REG = { s1: { sx:1 / 0.9948, ox:-3.9 / 0.9948 + 3, dy:15, ys:0.98, xs:0.986, y:[[0, -179.9], [1237.7, 1190], [1509, 1504], [1536, 1531]] } };
  function defaultReg(closedBox, openBox){   // boxes are normalised 0..1; returns a reg in 1024x1536 pixel terms
    const sx = (closedBox.x1 - closedBox.x0) / (openBox.x1 - openBox.x0), sy = (closedBox.y1 - closedBox.y0) / (openBox.y1 - openBox.y0);
    return { sx, ox:(closedBox.x0 - openBox.x0 * sx) * 1024, y:[[0, (closedBox.y0 - openBox.y0 * sy) * 1536], [1536, (closedBox.y0 + (1 - openBox.y0) * sy) * 1536]] };
  }
  function regFor(packImg, img, openImg){
    const m = /pack_opened_(s[2-9]|tricks)/.exec(openedFor(packImg) || '') , key = m ? m[1] : 's1';
    return OPENED_REG[key] || defaultReg(artBox(img), artBox(openImg));
  }
  function makeOpened(img, o){
    const tex = src => { const t = new THREE.Texture(src); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.needsUpdate = true; return t; };
    const group = new THREE.Group(), mats = [], geos = [];
    // o.w/o.h/cx/cy = the CLOSED art's frame; o.reg registers the opened art onto it (see OPENED_REG), so the artwork lands on the 3D body's artwork
    const reg = o.reg || { sx:1, ox:0, y:[[0, 0], [1, 1]] }, fw = img.naturalWidth || 1, fh = img.naturalHeight || 1;
    const regY = py => { const k = reg.y; let i = 1; while (i < k.length - 1 && py > k[i][0]) i++; const a = k[i - 1], b = k[i]; return a[1] + (py - a[0]) * (b[1] - a[1]) / (b[0] - a[0]); };
    const mk = (src, z) => {
      const geo = new THREE.PlaneGeometry(1, 1, 24, 48), p = geo.attributes.position, uv = geo.attributes.uv, bu = o.bulge || 0.04;
      for (let i = 0; i < p.count; i++) {
        const iu = uv.getX(i), iv = 1 - uv.getY(i), px = 512 + (reg.sx * iu * fw + reg.ox - 512) * (reg.xs || 1), py = 760 + (regY(iv * fh) - 760) * (reg.ys || 1) + (reg.dy || 0);   // image pixel -> closed-art pixel
        p.setX(i, (px / fw - 0.5) * o.w); p.setY(i, (0.5 - py / fh) * o.h);
        const u = clamp01((px / fw - 0.065) / 0.87), v = clamp01((py / fh - 0.03) / 0.95);
        p.setZ(i, bu * Math.pow(Math.sin(Math.PI * u), 0.8) * (0.35 + 0.65 * Math.sin(Math.PI * v)) * (1 - 0.35 * (1 - v)));   // fatter low down, where the cards sit
      }
      geo.computeVertexNormals();
      const t = tex(src), m = new THREE.MeshStandardMaterial({ map:t, metalness:0.25, roughness:0.42, envMapIntensity:0.9, emissiveMap:t, emissive:new THREE.Color(0.55, 0.55, 0.55), emissiveIntensity:0.5, transparent:true, opacity:1, alphaTest:0.05 });
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(o.cx, o.cy, z); mesh.frustumCulled = false;
      mats.push(m); geos.push(geo); group.add(mesh); return mesh;
    };
    let front = null, back = null;
    const cut = o.split ? mouthCut(img) : null, wall = o.split ? mouthCut(img, true) : null;
    if (cut && wall) { back = mk(wall, o.z - (o.backGap || 0.07)); front = mk(cut, o.z); back.renderOrder = 1; front.renderOrder = 3; }
    else front = mk(img, o.z);
    return { group, front, back, mats,
      setOpacity(op){ mats.forEach(m => { m.opacity = op; m.transparent = op < 1; }); group.visible = op > 0.01; },
      dispose(){ geos.forEach(g => g.dispose()); mats.forEach(m => { m.map && m.map.dispose(); m.dispose(); }); } };
  }

  async function attach(btn, packImg, line, tearY){
    const url = glbFor(packImg);
    if (!url) throw new Error('no 3D model for ' + packImg);
    const W = btn.clientWidth, H = btn.clientHeight; if (!W || !H) throw new Error('pack not laid out');
    const [gltf0, img, openImg] = await Promise.all([gltfOnce(url), imgOnce(packImg), openedImg(packImg)]);
    const gltf = { scene: gltf0.scene.clone(true) };
    if (!btn.isConnected) throw new Error('pack closed');
    const box = artBox(img);
    const bodyObj = gltf.scene.getObjectByName('Body'), stripObj = gltf.scene.getObjectByName('Strip');
    if (!bodyObj || !stripObj) throw new Error('model has no Body/Strip');

    // canvas over the button, with room above and at the sides for the strip, and below for the packet to drop away
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const PXl = W * .6, PXr = W * .6, PYt = H * .55, PYb = H * .7, CW = W + PXl + PXr, CH = H + PYt + PYb;
    const cv = document.createElement('canvas'); cv.className = 'pk-3d-model';
    Object.assign(cv.style, { position:'absolute', left:-PXl + 'px', top:-PYt + 'px', width:CW + 'px', height:CH + 'px', pointerEvents:'none', zIndex:4, visibility:'hidden' });
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:true, alpha:true, premultipliedAlpha:true }); }
    catch (e) { throw new Error('no WebGL'); }
    btn.appendChild(cv);
    renderer.setPixelRatio(dpr); renderer.setSize(CW, CH, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, CW / CH, 0.1, 60);
    const disposables = [];

    // environment: a dark navy room with a few bright soft boxes, baked with PMREM, so the foil has something to reflect
    (function makeEnv(){
      const env = new THREE.Scene();
      const sg = new THREE.SphereGeometry(10, 32, 16), cols = [], p = sg.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = p.getY(i) / 20 + 0.5, k = t * t; cols.push(0.02 + 0.26 * k, 0.04 + 0.36 * k, 0.09 + 0.53 * k); }
      sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      env.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.BackSide })));
      const bx = (w, h, pos, c) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color:new THREE.Color(c, c, c * 0.95), side:THREE.DoubleSide }));
        m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
      };
      bx(5, 3, [-5, 4, 5], 2.4); bx(2.5, 5, [6, 1, 4], 1.4); bx(6, 1.2, [0, 6, -1], 2); bx(3, 3, [0, -4, 6], 0.5); bx(3, 3, [-6, 0, -4], 1);
      const pm = new THREE.PMREMGenerator(renderer);
      const rt = pm.fromScene(env, 0.02); scene.environment = rt.texture; disposables.push(rt);
      pm.dispose();
      env.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    })();
    const key = new THREE.DirectionalLight(0xfff2dd, 0.5); key.position.set(-2, 3, 4); scene.add(key);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.1));

    // scene graph:  floatG (tilt, placed over the packet)  ->  spinG (drag-to-turn)  ->  packG (drop, shake)  ->  Body, stripG -> Strip ; flecks
    const floatG = new THREE.Group(); scene.add(floatG);
    const spinG = new THREE.Group(); floatG.add(spinG);   // turns the whole packet around its vertical axis (front <-> back)
    const packG = new THREE.Group(); spinG.add(packG);
    const stripG = new THREE.Group(); packG.add(stripG);
    const U = { uFold:{ value:-9 }, uR:{ value:0.07 }, uCorner:{ value:new THREE.Vector2() }, uDir:{ value:new THREE.Vector2(0.99, 0.14).normalize() } };
    const patchPeel = mat => {
      mat.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n' + PEEL_GLSL)
          .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
            { vec4 pc = peelCalc(position); float c = cos(pc.z), sn = sin(pc.z);
              objectNormal = vec3(objectNormal.x*c + objectNormal.z*sn, objectNormal.y, -objectNormal.x*sn + objectNormal.z*c); }`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            { vec4 pc = peelCalc(position); transformed.xy += uDir * (pc.x + position.z * sin(pc.z)); transformed.z += pc.y + position.z * (cos(pc.z) - 1.); }`);
      };
      mat.customProgramCacheKey = () => 'peelmodel';
    };
    const own = [];   // materials we cloned, to dispose
    // the silver inside the wrapper: in the dark navy room a metal reads as steel, so make it a bright, matte-ish crinkled foil lit from within
    const brightenInside = m => {
      if (m.name !== 'PackInside') return;
      m.metalness = 0.2; m.roughness = 0.55; m.envMapIntensity = 1.8;
      if (m.map) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0.75, 0.78, 0.85); m.emissiveIntensity = 0.9; }
      m.needsUpdate = true;
    };
    [bodyObj, stripObj].forEach(root => root.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.envMapIntensity = 1.25; own.push(m); brightenInside(m); }); } }));
    stripObj.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patchPeel); });
    const setFade = (root, op) => root.traverse(o => {
      if (!o.isMesh) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.transparent = op < 1; m.opacity = op; m.alphaTest = 0.5 * Math.max(op, 0.02); });
      o.visible = op > 0.01;
    });

    // centre the packet on the origin, then scale/place the whole thing so it covers the art's packet area of the button
    const all = new THREE.Box3().setFromObject(gltf.scene), ctr = all.getCenter(new THREE.Vector3());
    packG.add(bodyObj);
    const stripBox = new THREE.Box3().setFromObject(stripObj), stripC = stripBox.getCenter(new THREE.Vector3());
    stripObj.position.set(-stripC.x, -stripC.y, -stripC.z); stripG.position.copy(stripC); stripG.add(stripObj);
    packG.position.set(0, 0, 0);
    [bodyObj, stripG].forEach(o => o.position.sub(ctr));   // body keeps its own offset; strip group moves by the same amount
    const stripCw = stripC.clone().sub(ctr);   // strip group position in packet space; stripBox stays in the model's own coordinates (the peel shader works on those)
    const sizeY = all.max.y - all.min.y;
    const tearYw = stripBox.min.y + 0.004;
    const pxPerUnit = (box.y1 - box.y0) * H / sizeY;            // glb units -> button pixels
    const cx = (box.x0 + box.x1) / 2 * W, cy = (box.y0 + box.y1) / 2 * H;   // packet centre in button pixels
    const cutPct = (box.y0 + (all.max.y - stripBox.min.y) / sizeY * (box.y1 - box.y0)) * 100;   // where the model's tear line is, % down the button
    const visH = CH / pxPerUnit, dist = visH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    floatG.position.set((PXl + cx - CW / 2) / pxPerUnit, -(PYt + cy - CH / 2) / pxPerUnit, 0);

    // the torn-open pack (when there is art for it): a puffed sheet over the same outline, faded in as the tear finishes
    let opened = null;
    if (openImg) {
      const bb = new THREE.Box3().setFromObject(bodyObj);   // bodyObj is already centred; its front face sets the sheet's depth
      opened = makeOpened(openImg, { w:W / pxPerUnit, h:H / pxPerUnit, cx:(W / 2 - cx) / pxPerUnit, cy:-(H / 2 - cy) / pxPerUnit, z:bb.max.z + 0.004, bulge:0.045, split:false, reg:regFor(packImg, img, openImg) });
      opened.setOpacity(0); packG.add(opened.group);
    }

    // foil flecks along the tear
    const FN = 60;
    const fPos = new Float32Array(FN * 3), fCol = new Float32Array(FN * 3), fVel = new Float32Array(FN * 3), fLife = new Float32Array(FN);
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); fGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3));
    const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
    { const g = dotC.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(.35, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
    const dotTex = new THREE.CanvasTexture(dotC);
    const flecks = new THREE.Points(fGeo, new THREE.PointsMaterial({ size:0.022, vertexColors:true, map:dotTex, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true }));
    flecks.frustumCulled = false; floatG.add(flecks);
    let fNext = 0, anyFleck = false;
    const spawnFleck = (x, y) => {
      x -= ctr.x; y -= ctr.y;
      const i = fNext++ % FN; anyFleck = true;
      fPos.set([x, y, 0.02 + Math.random() * 0.05], i * 3);
      fVel.set([(Math.random() - .3) * 0.5, 0.25 + Math.random() * 0.6, 0.2 + Math.random() * 0.6], i * 3);
      fLife[i] = 0.5 + Math.random() * 0.5;
      fCol.set(Math.random() < .6 ? [1, .82, .4] : [.85, .92, 1], i * 3);
    };
    const stepFlecks = dt => {
      if (!anyFleck) return; let alive = false;
      for (let i = 0; i < FN; i++) {
        if (fLife[i] <= 0) { fCol[i * 3] = fCol[i * 3 + 1] = fCol[i * 3 + 2] = 0; continue; }
        alive = true; fLife[i] -= dt; fVel[i * 3 + 1] -= 1.6 * dt;
        for (let k = 0; k < 3; k++) fPos[i * 3 + k] += fVel[i * 3 + k] * dt;
        const f = Math.min(1, Math.max(fLife[i], 0) * 1.6); for (let k = 0; k < 3; k++) fCol[i * 3 + k] *= Math.pow(f, dt * 6);
      }
      anyFleck = alive; fGeo.attributes.position.needsUpdate = true; fGeo.attributes.color.needsUpdate = true;
    };

    // peel geometry for each side: the grabbed corner, the sweep direction, and how far the fold has to travel
    let dir = 1, uMax = 1;
    function setDir(d){
      d = d < 0 ? -1 : 1; dir = d;
      const dv = U.uDir.value.set(d * 0.99, 0.14).normalize();
      const cxw = d < 0 ? stripBox.max.x : stripBox.min.x;
      U.uCorner.value.set(cxw, stripBox.max.y);
      uMax = Math.max(...[stripBox.min.x, stripBox.max.x].flatMap(x => [stripBox.min.y, stripBox.max.y].map(y => (x - cxw) * dv.x + (y - stripBox.max.y) * dv.y)));
    }
    setDir(1);
    const R = U.uR.value, foldEnd = () => 0.55 * uMax + 0.5 * Math.PI * R;

    // state
    const st = { phase:'idle', t:0, target:0, fold:0, rx:0, ry:0, done:null, flyT:-1, shown:false, dropT:-1,
      yaw:0, yawV:0, yawTgt:0, spin:null, pendP:-1, pendD:1, waitFin:null };
    let live = true, raf = 0, prev = performance.now(), reduce = reducedMotion();
    const TEAR_T = .55, FLY_START = .4, FLY_T = .7, DROP_DELAY0 = .62, DROP_DELAY_OPEN = .9, OPEN_FADE = .08, DROP_T = 1.1, TILT_IN = .22, TILT_OUT = .3, TILT = 0.7;   // after the tear the top leans toward you so the silver inside shows, then the packet drops
    const dropDelay = () => opened && !reduce ? DROP_DELAY_OPEN : DROP_DELAY0;
    const schedule = () => { if (live && !raf && !document.hidden) raf = requestAnimationFrame(frame); };
    const motionChanged = () => { reduce = reducedMotion(); };
    const visibilityChanged = () => { prev = performance.now(); schedule(); };
    motionQuery.addEventListener?.('change', motionChanged);
    window.addEventListener('cq-native-motion', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);

    const cssNum = name => parseFloat(btn.style.getPropertyValue(name)) || 0;
    const TWO_PI = Math.PI * 2;
    const isFront = () => !st.spin && Math.abs(st.yawTgt - Math.round(st.yawTgt / TWO_PI) * TWO_PI) < 1e-6 && Math.abs(st.yaw - st.yawTgt) < 0.1;
    function requestFront(){
      st.yawTgt = Math.round(st.yaw / TWO_PI) * TWO_PI;
      if (reduce) { st.yaw = st.yawTgt; st.yawV = 0; }
      schedule();
    }
    // horizontal drag on the lower part of the pack turns it; the top strip stays the tear swipe
    const spinDown = e => {
      if (!live || st.spin || (st.phase !== 'idle' && st.phase !== 'peel') || st.fold > 0.003 || btn._drag) return;
      const r = btn.getBoundingClientRect();
      if ((e.clientY - r.top) / r.height <= 0.25) return;
      st.spin = { id:e.pointerId, x:e.clientX, y:e.clientY, yaw0:st.yaw, on:false, t:performance.now(), lastYaw:st.yaw, v:0, w:r.width };
      st.waitFin = null; st.pendP = -1;
    };
    const spinMove = e => {
      const sp = st.spin; if (!sp || e.pointerId !== sp.id) return;
      const dx = e.clientX - sp.x, dy = e.clientY - sp.y;
      if (!sp.on) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        sp.on = true; st.yawV = 0; btn._swiped = true;   // no tap-to-open after a spin
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }
      st.yaw = sp.yaw0 + dx * Math.PI / (sp.w * 0.7);
      const now = performance.now(), dtm = Math.max(1, now - sp.t);
      sp.v = sp.v * 0.6 + ((st.yaw - sp.lastYaw) / dtm * 1000) * 0.4; sp.t = now; sp.lastYaw = st.yaw;
      st.yawTgt = st.yaw; schedule();
    };
    const spinUp = e => {
      const sp = st.spin; if (!sp || e.pointerId !== sp.id) return;
      st.spin = null;
      if (!sp.on) return;
      const v = performance.now() - sp.t > 120 ? 0 : sp.v;
      st.yawV = reduce ? 0 : Math.max(-14, Math.min(14, v));
      st.yawTgt = Math.round((st.yaw + st.yawV * 0.22) / Math.PI) * Math.PI;
      if (reduce) { st.yaw = st.yawTgt; st.yawV = 0; }
      schedule();
    };
    btn.addEventListener('pointerdown', spinDown);
    btn.addEventListener('pointermove', spinMove);
    btn.addEventListener('pointerup', spinUp); btn.addEventListener('pointercancel', spinUp);
    function flyStrip(t){
      const f = clamp01(t / FLY_T);
      stripG.position.set(stripCw.x + dir * (0.75 * f * f + 0.2 * f), stripCw.y + 1.0 * f + 0.4 * f * f, stripCw.z + 0.5 * f);
      stripG.rotation.set(-0.8 * f, dir * 0.5 * f, -dir * 1.4 * f);
      setFade(stripObj, 1 - clamp01((f - 0.35) / 0.65));
    }
    function update(dt, time){
      // tilt: mirror the button's own spring (packTilt sets --rx / --ry); with reduced motion those stay at 0
      const trx = reduce ? 0 : -cssNum('--rx') * Math.PI / 180 * 1.15, try_ = reduce ? 0 : cssNum('--ry') * Math.PI / 180 * 1.15;
      const k = Math.min(1, dt * 14); st.rx += (trx - st.rx) * k; st.ry += (try_ - st.ry) * k;
      floatG.rotation.set(st.rx, st.ry, 0);
      // spin: follow the finger while dragging, then a spring (with the release speed as momentum) settles on front or back
      if (!st.spin) {
        const a = (st.yawTgt - st.yaw) * 90 - st.yawV * 13;
        st.yawV += a * dt; st.yaw += st.yawV * dt;
        if (Math.abs(st.yawTgt - st.yaw) < 0.002 && Math.abs(st.yawV) < 0.02) { st.yaw = st.yawTgt; st.yawV = 0; }
      }
      spinG.rotation.y = st.yaw;
      if (isFront()) {   // a tear that was asked for while the back showed starts now that the front faces you
        if (st.pendP >= 0 && (st.phase === 'idle' || st.phase === 'peel')) { const pp = st.pendP; st.pendP = -1; peelNow(pp, st.pendD); }
        if (st.waitFin) { const w = st.waitFin; st.waitFin = null; finishNow(w.d, w.done); }
      }
      if (st.phase === 'idle' || st.phase === 'peel') {
        // follow the finger: ease the fold toward the target
        st.fold += (st.target - st.fold) * (1 - Math.pow(.0005, dt));
        U.uFold.value = st.fold > 0.003 ? -0.02 + st.fold : -9;
        if (st.fold > 0.003) { const fx = stripBox.min.x + Math.max(0, st.fold) * U.uDir.value.x; if (!reduce && Math.random() < .35) spawnFleck(Math.min(stripBox.max.x, Math.max(stripBox.min.x, dir < 0 ? stripBox.max.x - (fx - stripBox.min.x) : fx)), tearYw + (Math.random() - .5) * 0.02); }
      } else if (st.phase === 'tear') {
        st.t += dt;
        if (reduce) {
          setFade(stripObj, 1 - clamp01(st.t / 0.25));
          if (st.t >= 0.25) { stripObj.visible = false; endTear(); }
        } else {
          const p = clamp01(st.t / st.tearDur), e = ease(p);
          st.fold = st.fold0 + (foldEnd() - st.fold0) * e; U.uFold.value = -0.02 + st.fold;
          const sh = Math.sin(st.t * 70) * 0.012 * (1 - p);
          bodyObj.position.set(sh - ctr.x, Math.sin(st.t * 53) * 0.006 * (1 - p) - ctr.y, -ctr.z);
          if (p < 0.95) { const fxw = Math.min(stripBox.max.x - stripBox.min.x, st.fold * Math.abs(U.uDir.value.x)); const fx = dir < 0 ? stripBox.max.x - fxw : stripBox.min.x + fxw; for (let n = 0; n < 2; n++) spawnFleck(fx - 0.02 + Math.random() * 0.04, tearYw + (Math.random() - .5) * 0.02); }
          if (st.t > FLY_START) flyStrip(st.t - FLY_START);
          if (p >= 1 && st.t >= FLY_START + 0.12) endTear();
        }
      } else if (st.phase === 'drop') {
        st.t += dt;
        if (st.flyT >= 0 && !reduce) { st.flyT += dt; if (st.flyT <= FLY_T + .05) flyStrip(st.flyT); else stripObj.visible = false; }
        const dd = dropDelay(), f = clamp01((st.t - (reduce ? 0 : dd)) / (reduce ? .4 : DROP_T));
        packG.rotation.x = reduce ? 0 : TILT * ease(clamp01(st.t / TILT_IN)) * (1 - ease(clamp01((st.t - (dd - .05)) / TILT_OUT)));
        packG.position.y = -(f * f) * 2.6 * (reduce ? .3 : 1); packG.rotation.z = reduce ? 0 : 0.07 * f;
        const fo = 1 - clamp01((f - 0.45) / 0.55);
        if (opened) {   // the flat body cross-fades into the torn-open sheet, holds so you can see inside, then drops away with it
          const cf = reduce ? 1 : clamp01(st.t / OPEN_FADE);
          if (cf >= 1) bodyObj.visible = false;
          opened.setOpacity(Math.min(cf, fo));
        } else setFade(bodyObj, fo);
        if (f >= 1) { st.phase = 'gone'; setTimeout(destroy, 0); }
      }
      stepFlecks(dt);
    }
    function endTear(){
      // the tear is complete: the card reveal starts now, and the packet slides away under it
      bodyObj.position.set(-ctr.x, -ctr.y, -ctr.z);
      st.flyT = reduce ? -1 : Math.max(0, st.t - FLY_START);   // the strip keeps flying while the packet drops
      st.phase = 'drop'; st.t = 0;
      const cb = st.done; st.done = null; if (cb) cb();
    }
    function frame(now){
      raf = 0; if (!live) return;
      if (!cv.isConnected) { destroy(); return; }
      const dt = Math.min((now - prev) / 1000, .05); prev = now;
      update(window.__freeze3d ? 0 : dt, now / 1000);
      if (!live) return;
      renderer.render(scene, camera);
      if (!st.shown) {   // first picture is ready: swap the flat pack for the 3D one
        st.shown = true; cv.style.visibility = 'visible'; btn.classList.add('m3d');
        btn.querySelector('.pk-slash')?.style.setProperty('--cut-y', cutPct.toFixed(2) + '%');
        btn.querySelectorAll('.pk-body, .pk-rest, .pk-flap').forEach(el => { el.style.visibility = 'hidden'; });
      }
      schedule();
    }
    function destroy(){
      if (!live) return; live = false; if (raf) cancelAnimationFrame(raf); raf = 0;
      motionQuery.removeEventListener?.('change', motionChanged);
      window.removeEventListener('cq-native-motion', motionChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
      btn.removeEventListener('pointerdown', spinDown); btn.removeEventListener('pointermove', spinMove);
      btn.removeEventListener('pointerup', spinUp); btn.removeEventListener('pointercancel', spinUp);
      gltf.scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
      if (opened) opened.dispose();
      own.forEach(m => { ['map', 'normalMap', 'metalnessMap', 'roughnessMap', 'emissiveMap', 'aoMap'].forEach(k => m[k] && m[k].dispose()); m.dispose(); });
      fGeo.dispose(); flecks.material.dispose(); dotTex.dispose(); disposables.forEach(d => d.dispose());
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (_) {}
      cv.remove(); btn.classList.remove('m3d');
    }
    function peelNow(p, d){
      if (st.phase === 'tear' || st.phase === 'drop') return;
      if (st.phase === 'idle') { st.phase = 'peel'; setDir(d); }
      st.target = Math.max(st.target, clamp01(p) * 0.75 * uMax); schedule();
    }
    function finishNow(d, done){
      if (st.phase === 'idle') setDir(d);
      st.phase = 'tear'; st.t = 0; st.done = done; st.fold0 = Math.max(0, st.fold);
      st.tearDur = TEAR_T * (1 - clamp01(st.fold0 / foldEnd()) * .5) + .15;
      schedule();
    }
    schedule();

    return {
      // p: 0..1 of the way across; dir: 1 = torn from the left, -1 = from the right
      peel(p, d){
        if (!live || st.phase === 'tear' || st.phase === 'drop') return;
        if (!isFront()) { st.pendP = Math.max(st.pendP, p); st.pendD = d; requestFront(); return; }   // tearing needs the front: turn it round first
        peelNow(p, d);
      },
      // curl the rest of the strip over, fling it away, then call done (the card reveal), while the packet drops away
      finish(d, done){
        if (!live) return done();
        if (!isFront()) { st.waitFin = { d, done }; requestFront(); return; }
        finishNow(d, done);
      },
      destroy,
    };
  }

  window.PackModel3D = { attach, preload, glbFor, openedFor, makeOpened, regFor, OPENED_REG };
})();
