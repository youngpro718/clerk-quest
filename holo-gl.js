/* Clerk Quest holo foil drawn on the graphics chip (study: docs/design-notes/holo-study.md).
   Instead of one rainbow slid under a stencil (the CSS .holo), the card is covered in tiny gold flakes. Each flake is a
   little mirror turned at its own fixed random angle, lit by an imaginary lamp, so flakes catch the light one by one,
   change colour as the card tilts and flash white when they face the lamp. The border carries its own finer glitter.
   HoloGL.attach(card) puts one canvas inside the card's .holo-wrap (so the text-safe mask still applies) and drives it
   from the tilt the card already has (--rx/--ry/--mx/--my from BreakoutMotion). No WebGL: the CSS foil simply stays.
   BreakoutMotion (index.html) attaches it to every big Gold Seal card (card screen, zoom, level-up, results); thumbnails keep the CSS foil.
   Test screen: open the app with ?holotest (or ?holotest=<card id>) to see the current foil and this one side by side. */
const HoloGL = (() => {
  const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
  const FRAG = `precision highp float;
uniform vec2 uSize; uniform vec2 uTilt; uniform vec2 uLight; uniform float uAwake; uniform float uTime;
const float TAU = 6.2831853;
float hash(vec2 p){ p = fract(p * vec2(127.13, 311.71)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
vec2 hash2(vec2 p){ return vec2(hash(p), hash(p + 41.7)); }
vec3 rainbow(float t){ return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67))); }
float hexDist(vec2 d){ vec2 a = abs(d); return max(a.x * 0.866 + a.y * 0.5, a.y); }
mat2 rot(float s){ return mat2(cos(s), -sin(s), sin(s), cos(s)); }
void main(){
  vec2 uv = vec2(gl_FragCoord.x / uSize.x, 1.0 - gl_FragCoord.y / uSize.y);
  float aspect = uSize.y / uSize.x;
  vec2 p = vec2(uv.x, uv.y * aspect), c = vec2(0.5, 0.5 * aspect);
  // the card's turn, the eye in front of it and a lamp that follows the tilt
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(uTilt.x), sin(uTilt.x), 0.0, -sin(uTilt.x), cos(uTilt.x));
  mat3 ry = mat3(cos(uTilt.y), 0.0, -sin(uTilt.y), 0.0, 1.0, 0.0, sin(uTilt.y), 0.0, cos(uTilt.y));
  mat3 turn = rx * ry;
  vec3 world = turn * vec3(p - c, 0.0);
  vec3 view = normalize(vec3(0.0, 0.0, 1.6) * turn - world * turn);
  vec3 lamp = vec3((uLight - 0.5) * vec2(1.1, 1.1 * aspect), 0.9);
  vec3 light = normalize(lamp * turn - world * turn);
  vec3 halfway = normalize(light + view);
  vec2 sweep = light.xy + view.xy;
  float sheen = pow(max(halfway.z, 0.0), 10.0);
  vec3 gold = vec3(1.0, 0.76, 0.32);

  // gold flakes: each cell holds one six-sided flake with its own angle and face
  vec2 g = p * 26.0, cell = floor(g);
  float spin = hash(cell + 3.0) * TAU;
  vec2 d = rot(spin) * (fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.4);
  float size = mix(0.24, 0.45, hash(cell + 5.0)), hd = hexDist(d);
  float flake = smoothstep(size, size - 0.07, hd) * step(0.3, hash(cell + 7.0));
  vec3 face = normalize(vec3((hash2(cell + 11.0) - 0.5) * 1.5, 1.0));   // faces point many ways, so only a few catch the lamp at once
  float phase = dot(sweep, vec2(cos(spin), sin(spin))) * 0.9 + dot(sweep, vec2(0.8, 0.6)) * 1.0 + hash(cell + 9.0) * 0.7;
  vec3 tint = mix(rainbow(phase), gold, 0.62);
  float facing = max(dot(face, halfway), 0.0);
  float lit = pow(facing, 9.0), glint = pow(facing, 70.0);   // dim until it faces the lamp, then a hard white flash like a mirror
  float rim = smoothstep(size - 0.12, size - 0.03, hd);        // a bright edge on the lit side reads as a bevelled metal flake
  vec3 col = flake * (tint * (0.07 + 1.1 * lit + 0.25 * sheen) + tint * rim * lit * 0.6 + vec3(1.0, 0.95, 0.82) * glint * 2.8);

  // between the flakes: fine etched gold lines that light up in a band as the card turns
  float etch = smoothstep(0.55, 0.95, abs(fract((p.x * 0.6 + p.y) * 120.0) - 0.5) * 2.0);
  float band = smoothstep(0.35, 0.95, 0.5 + 0.5 * cos(phase * 2.6 + 1.3));
  col += (1.0 - flake) * gold * etch * band * 0.16;

  // the border: tiny flakes and specks, each flashing on its own
  float edge = min(min(p.x, 1.0 - p.x), min(p.y, aspect - p.y));
  float frame = 1.0 - smoothstep(0.03, 0.05, edge);
  vec2 fg = p * 90.0, fc = floor(fg);
  float fs = hash(fc + 2.0) * TAU;
  float bit = smoothstep(0.34, 0.24, hexDist(rot(fs) * (fract(fg) - 0.5))) * step(0.45, hash(fc + 4.0));
  float bitFlash = pow(max(dot(normalize(vec3((hash2(fc + 6.0) - 0.5) * 1.3, 1.0)), halfway), 0.0), 16.0);
  col += frame * bit * mix(rainbow(dot(sweep, vec2(cos(fs), sin(fs))) * 1.2 + hash(fc) * 0.5), gold, 0.4) * (0.12 + 2.2 * bitFlash);

  // specks everywhere: the finest glitter, only seen when one faces the lamp
  vec2 sg = p * 140.0, sc = floor(sg);
  float speck = smoothstep(0.26, 0.0, length(fract(sg) - 0.5 - (hash2(sc) - 0.5) * 0.5)) * step(0.8, hash(sc + 1.0));
  col += vec3(1.0, 0.97, 0.88) * speck * pow(max(dot(normalize(vec3((hash2(sc + 2.0) - 0.5) * 0.9, 1.0)), halfway), 0.0), 12.0) * 1.3;

  gl_FragColor = vec4(clamp(col * uAwake, 0.0, 1.0), 1.0);
}`;

  // not live yet (the owner asked to hold it): on only with ?holo=1 (remembered on this device), off with ?holo=0
  let on = false;
  try { const m = location.search.match(/[?&]holo=([01])/); if (m) localStorage.setItem('cq-holo-test', m[1]); on = localStorage.getItem('cq-holo-test') === '1'; } catch (_) {}
  const live = new Set();
  let raf = 0;
  const reduced = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
  const num = (st, k) => parseFloat(st.getPropertyValue(k)) || 0;

  function attach(card, force){
    if (!on && !force) return false;
    const wrap = card && card.querySelector('.holo-wrap');
    if (!wrap || card.closest('.ht-old') || getComputedStyle(wrap).display === 'none') return false;   // e.g. Series 7 has no foil
    if (wrap.querySelector('.holo-gl')) return true;
    const cv = document.createElement('canvas'); cv.className = 'holo-gl';
    const gl = cv.getContext('webgl', { alpha:false, antialias:false, premultipliedAlpha:false, powerPreference:'low-power' });
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one triangle covers the canvas
    const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = {}; ['uSize', 'uTilt', 'uLight', 'uAwake', 'uTime'].forEach(n => u[n] = gl.getUniformLocation(prog, n));
    wrap.appendChild(cv); wrap.classList.add('gl');
    const s = { card, cv, gl, u, key:'' };
    const fit = () => { const dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; s.key = ''; } };
    s.ro = new ResizeObserver(() => { fit(); wake(); }); s.ro.observe(cv);
    fit(); live.add(s); wake();
    return true;
  }

  function draw(s, now){
    const st = getComputedStyle(s.card), rx = num(st, '--rx'), ry = num(st, '--ry'), mx = num(st, '--mx'), my = num(st, '--my');
    const still = reduced();
    // with no touch or tilt the lamp drifts slowly, so a resting card still twinkles a little
    const t = still ? 0 : now / 1000;
    const lx = .5 + mx * .5 + Math.sin(t * .45) * .18, ly = .38 + my * .4 + Math.sin(t * .37 + .6) * .12;
    // moving the card makes the foil livelier for a moment (s.boost rises with speed, then settles)
    const speed = s.last ? Math.hypot(rx - s.last[0], ry - s.last[1]) : 0; s.last = [rx, ry];
    s.boost = Math.min(1, (s.boost || 0) * .92 + speed * .35);
    const tilt = Math.hypot(rx, ry), awake = .6 + .4 * Math.min(1, tilt / 8) + .35 * s.boost;
    const key = [rx, ry, lx, ly, s.boost].map(v => v.toFixed(3)).join();
    if (key === s.key || !s.cv.width) return;
    s.key = key;
    const { gl, u } = s;
    gl.viewport(0, 0, s.cv.width, s.cv.height);
    gl.uniform2f(u.uSize, s.cv.width, s.cv.height);
    gl.uniform2f(u.uTilt, rx * 2.4 * Math.PI / 180, ry * 2.4 * Math.PI / 180);   // the light swings further than the card, so a small tilt sweeps across many flakes
    gl.uniform2f(u.uLight, lx, ly);
    gl.uniform1f(u.uAwake, awake);
    gl.uniform1f(u.uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now){
    raf = 0;
    for (const s of live) {
      if (!s.cv.isConnected) { s.ro.disconnect(); live.delete(s); continue; }
      draw(s, now);
    }
    if (live.size && !document.hidden && !reduced()) raf = requestAnimationFrame(frame);
  }
  function wake(){ if (!raf && live.size) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', wake);

  /* side-by-side test screen: ?holotest or ?holotest=<card id> */
  function testScreen(id){
    const c = (id && typeof byId === 'function' && byId(id)) || CARDS.find(x => maxL(x) >= 4) || CARDS[0];
    const st = { ...(S.cards[c.id] || {}), owned:true, level:maxL(c), xp:0, mastered:true, vers:['certified', 'exhibit', 'gold'] };
    const ov = document.createElement('div'); ov.className = 'holo-test';
    ov.innerHTML = `<div class="ht-top"><b>Gold Seal foil test</b><button type="button" aria-label="Close">✕</button></div>
      <div class="ht-row"><figure><div class="cd-card ht-old">${cardEl(c, st)}</div><figcaption>NOW</figcaption></figure>
      <figure><div class="cd-card ht-new">${cardEl(c, st)}</div><figcaption>NEW</figcaption></figure></div>
      <p>Tilt your phone, or move your finger or mouse over a card.</p>`;
    ov.querySelector('button').onclick = () => ov.remove();
    document.body.appendChild(ov);
    if (!attach(ov.querySelector('.ht-new .card'), true)) ov.querySelector('.ht-new ~ figcaption').textContent = 'NEW (no WebGL here)';
  }
  if (/[?&]holotest/.test(location.search)) addEventListener('load', () => setTimeout(() => {
    const m = location.search.match(/[?&]holotest=([^&]+)/); testScreen(m && decodeURIComponent(m[1]));
  }, 600));

  document.head.insertAdjacentHTML('beforeend', `<style>
.holo-wrap.gl > .holo{display:none}
.holo-wrap.gl{mix-blend-mode:screen}   /* the black canvas adds only its light to the card */
.holo-gl{position:absolute;inset:1.3% 1.7% 1.6%;width:calc(100% - 3.4%);height:calc(100% - 2.9%);border-radius:5cqw;pointer-events:none}
.holo-test{position:fixed;inset:0;z-index:400;background:#14110d;color:var(--paper,#f1e5c9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;font:16px "Patrick Hand",cursive}
.holo-test .ht-top{position:absolute;top:calc(12px + env(safe-area-inset-top));left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;font:20px "Bangers";letter-spacing:.06em}
.holo-test .ht-top button{width:40px;height:40px;border-radius:20px;border:0;background:rgba(255,255,255,.1);color:inherit;font-size:18px}
.holo-test .ht-row{display:flex;gap:12px;width:100%;max-width:760px;justify-content:center}
.holo-test figure{margin:0;flex:1;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:8px}
.holo-test .cd-card{width:100%}
.holo-test .cd-card .card{width:100%}
.holo-test figcaption{font:18px "Bangers";letter-spacing:.1em;opacity:.85}
.holo-test p{margin:0;opacity:.7;text-align:center}
</style>`);
  return { attach, testScreen };
})();
