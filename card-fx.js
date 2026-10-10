/* Card effects (spec: docs/superpowers/specs/2026-10-10-visual-lab-and-admin-design.md, Part 1).
   Level decides how strong a card's glow and foil are; version decides their colour and style. Pure data and
   functions, no DOM: index.html's cardEl adds the markup fxMarkup() returns, and the CSS draws it. */
const FX_FLOOR = { filed:0, certified:.2, exhibit:.3, gold:.4 };   // a version never looks like a plainer one, even at level 1
const HOLO_PATTERNS = ['sheen', 'diamonds', 'dots', 'starburst', 'scales'];
const HOLO_RAMPS = {
  silver:['#dfe9ff', '#a9c3ff', '#ffffff', '#b7c9e8', '#e8f0ff'],
  rainbow:['#ff9fc8', '#ffd69a', '#a6ffc6', '#9fd8ff', '#c9a6ff'],
  ember:['#ff9a6a', '#ffcf8a', '#fff3c4', '#ffae7a', '#e0765a'],
  gold:['#fff0a0', '#ffc83a', '#fff7cf', '#e3a21d', '#ffd96a'],
};
const FX_VERSIONS = {
  filed:{ glow:{ rgb:[255, 244, 214], style:'plain' }, holo:{ pattern:'none', ramp:'silver', strength:0, area:0, speed:1, drive:'tilt' } },
  certified:{ glow:{ rgb:[170, 205, 255], style:'shimmer' }, holo:{ pattern:'sheen', ramp:'silver', strength:.3, area:.7, speed:1, drive:'tilt' } },
  exhibit:{ glow:{ rgb:[255, 150, 60], style:'ember' }, holo:{ pattern:'diamonds', ramp:'ember', strength:.3, area:.8, speed:1, drive:'tilt' } },
  gold:{ glow:{ rgb:[255, 200, 58], style:'pulse' }, holo:{ pattern:'starburst', ramp:'rainbow', strength:.38, area:1, speed:1, drive:'tilt' } },
};
/* where the foil may NOT go, per look: rectangles on the 1024 x 1536 grid that hold card text (header, title, caption, footer).
   tools/check_holo_safe.js proves every label box of every front layout lies inside one of these. */
const HOLO_SAFE = {
  series1:[[48, 54, 968, 166], [94, 166, 932, 444], [236, 1082, 792, 1272], [72, 1280, 954, 1458]],
  series2:[[48, 54, 968, 166], [94, 166, 932, 444], [236, 1082, 792, 1272], [72, 1280, 954, 1458]],
  series3:[[50, 24, 976, 128], [82, 138, 946, 288], [240, 1196, 792, 1302], [34, 1312, 992, 1468]],
  series4:[[92, 67, 932, 149], [195, 187, 885, 362], [220, 1138, 870, 1246], [130, 1308, 923, 1428]],
  series5:[[55, 69, 956, 158], [130, 193, 900, 433], [125, 1070, 900, 1313], [72, 1320, 952, 1460]],
  cc:[[30, 28, 995, 108], [116, 102, 908, 314], [53, 1155, 977, 1357], [31, 1380, 995, 1491]],
};
const HOLO_SELECTORS = { series1:'.card.series1', series2:'.card.series2', series3:'.card.series3', series4:'.card.series4', series5:'.card.series5', cc:'.card.look-cc' };

const fxClamp = (n, a, b) => Math.min(b, Math.max(a, n));
const fxNum = (v, d, a, b) => (v !== '' && v != null && Number.isFinite(+v)) ? fxClamp(+v, a, b) : d;
const fxLevel = (level, max) => max <= 1 ? 1 : fxClamp((level - 1) / (max - 1), 0, 1);
let FX_PLAY = null;   // the Card Visual Lab's playground settings, applied only inside withFxPlay
function withFxPlay(map, fn){ const keep = FX_PLAY; FX_PLAY = map; try { return fn(); } finally { FX_PLAY = keep; } }
function fxHolo(version, over){
  const base = FX_VERSIONS[version].holo, o = over || {};
  return {
    pattern:(o.pattern === 'none' || HOLO_PATTERNS.includes(o.pattern)) ? o.pattern : base.pattern,
    ramp:HOLO_RAMPS[o.ramp] ? o.ramp : base.ramp,
    strength:fxNum(o.strength, base.strength, 0, 1), area:fxNum(o.area, base.area, 0, 1), speed:fxNum(o.speed, base.speed, .25, 3),
    drive:(o.drive === 'tilt' || o.drive === 'auto') ? o.drive : base.drive,
  };
}
function fxFor(version, level, max, over = FX_PLAY && FX_PLAY[version]){
  const v = FX_VERSIONS[version] ? version : 'filed', spec = FX_VERSIONS[v], i = fxLevel(level, max), floor = FX_FLOOR[v];
  const e = +(floor + (1 - floor) * i).toFixed(3), h = fxHolo(v, over), on = e > 0;
  return { version:v, i:+i.toFixed(3), e,
    glow:{ rgb:spec.glow.rgb, style:spec.glow.style, blur:on ? +(1.2 + 4.8 * e).toFixed(2) : 0, alpha:on ? +(.22 + .58 * e).toFixed(3) : 0,
      rim:on ? +(.15 + .25 * e).toFixed(3) : 0, pulse:e >= .5, sweep:e >= .75, sparkle:i >= .99 && e >= .99 },
    holo:{ pattern:h.pattern, ramp:h.ramp, strength:+(h.strength * e).toFixed(3), area:h.pattern === 'none' ? 0 : +(h.area * (.3 + .7 * e)).toFixed(3), speed:h.speed, drive:h.drive } };
}
const FX_SPARKS = [[8, 12, 0], [92, 20, .9], [88, 88, 1.7], [10, 82, 2.4]];   // left %, top %, delay (s)
function fxMarkup(version, level, max, over){
  const f = fxFor(version, level, max, over), g = f.glow, h = f.holo;
  const cls = ['fx', 'fx-v-' + f.version, g.pulse ? 'fx-pulse' : '', g.sweep ? 'fx-sweep' : '', g.sparkle ? 'fx-sparkle' : ''].filter(Boolean).join(' ');
  const style = `--fx-blur:${g.blur}cqw;--fx-a:${g.alpha};--fx-rgb:${g.rgb.join(',')};--fx-rim:${g.rim}cqw;--holo-op:${h.strength};--holo-area:${h.area};--holo-speed:${h.speed};`;
  const edge = g.sweep ? '<i class="fx-edge" aria-hidden="true"></i>' : '';
  const holo = h.pattern !== 'none' && h.strength > 0 ? `<i class="holo-wrap" aria-hidden="true"><i class="holo holo-${h.pattern} ramp-${h.ramp}"></i></i>` : '';
  const sparks = g.sparkle ? FX_SPARKS.map(([x, y, d]) => `<i class="fx-sp" style="left:${x}%;top:${y}%;--d:${d}s"></i>`).join('') : '';
  return { cls, style, html:edge + holo + sparks, f };
}
function holoMaskSVG(zones){
  const holes = zones.map(([x1, y1, x2, y2]) => `M${x1} ${y1}H${x2}V${y2}H${x1}Z`).join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1536' preserveAspectRatio='none'><path fill-rule='evenodd' d='M0 0H1024V1536H0Z${holes}'/></svg>`;
}
function holoMaskCSS(){
  return Object.entries(HOLO_SAFE).map(([k, z]) => `${HOLO_SELECTORS[k]} .holo-wrap{--holo-mask:url("data:image/svg+xml,${encodeURIComponent(holoMaskSVG(z))}")}`).join('\n');
}
