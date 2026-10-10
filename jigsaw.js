/* The Series 6 jigsaw (spec: docs/superpowers/specs/2026-10-10-series6-and-trick-pack-design.md, Part 3).
   A fixed 4 x 6 puzzle laid over the card's art window (975 x 826, the window in art/cc_frame.webp). A card's level decides how many
   pieces of its background are in place; the gaps show the Series 6 emblem. Pure helpers, no DOM. */
const JIG_COLS = 4, JIG_ROWS = 6, JIG_W = 975, JIG_H = 826;
/* pieces arrive in this fixed, spread-out order, so level 2 always contains level 1 */
const JIG_ORDER = [0, 13, 6, 19, 3, 10, 22, 8, 16, 1, 11, 20, 5, 14, 23, 9, 17, 2, 12, 21, 7, 15, 4, 18];
/* One edge of a piece, from (ax,ay) to (bx,by), without its end corner: the neck point where the tab starts, then the 9 points of the
   three cubic curves that draw the tab (the last one is where the tab ends). The tab is symmetric, so walking the edge backwards
   gives the same points. s = +1 bulges to the left of the direction of travel (the normal (-dy, dx)), s = -1 to the right,
   0 is a flat edge (no points). */
function jigsawEdge(ax, ay, bx, by, s){
  if (!s) return [];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const P = (t, o) => [ax + dx * t + nx * o * len * s, ay + dy * t + ny * o * len * s];
  return [P(.36, 0), P(.40, .02), P(.28, .12), P(.38, .20), P(.46, .27), P(.54, .27), P(.62, .20), P(.72, .12), P(.60, .02), P(.64, 0)];
}
/* the sign of the shared edge above row r of column c ('h') or left of column c in row r ('v'); it varies so the puzzle is not a pattern */
const jigsawSign = (c, r, axis) => ((c * 5 + r * 3 + (axis === 'h' ? 1 : 0)) % 2 ? 1 : -1);
function jigsawPiece(i){
  const c = i % JIG_COLS, r = Math.floor(i / JIG_COLS), cw = JIG_W / JIG_COLS, ch = JIG_H / JIG_ROWS;
  const x0 = c * cw, y0 = r * ch, x1 = x0 + cw, y1 = y0 + ch, f = v => +v.toFixed(2);
  // Clockwise from the top left. Horizontal edges are shaped left to right and vertical edges top to bottom (the canonical
  // direction), so the piece on the far side walks the same edge backwards with the opposite sign: both outlines are one curve.
  const top = r > 0 ? jigsawSign(c, r, 'h') : 0, right = c < JIG_COLS - 1 ? jigsawSign(c + 1, r, 'v') : 0;
  const bottom = r < JIG_ROWS - 1 ? -jigsawSign(c, r + 1, 'h') : 0, left = c > 0 ? -jigsawSign(c, r, 'v') : 0;
  const pt = q => q.map(f).join(',');
  const seg = (ax, ay, bx, by, s) => { const p = jigsawEdge(ax, ay, bx, by, s);
    return p.length ? `L${pt(p[0])} C${pt(p[1])} ${pt(p[2])} ${pt(p[3])} C${pt(p[4])} ${pt(p[5])} ${pt(p[6])} C${pt(p[7])} ${pt(p[8])} ${pt(p[9])} L${f(bx)},${f(by)}` : `L${f(bx)},${f(by)}`; };
  return `M${f(x0)},${f(y0)} ${seg(x0, y0, x1, y0, top)} ${seg(x1, y0, x1, y1, right)} ${seg(x1, y1, x0, y1, bottom)} ${seg(x0, y1, x0, y0, left)} Z`;
}
function jigsawPresent(level, max){
  const k = Math.round(JIG_ORDER.length * Math.min(Math.max(level, 0), max) / max);
  return JIG_ORDER.slice(0, k).sort((a, b) => a - b);
}
/* the pieces that arrived at the level just reached (none unless newLevel is that level) */
function jigsawArrived(level, max, newLevel){
  if (!newLevel || newLevel !== level) return [];
  const had = new Set(jigsawPresent(level - 1, max));
  return jigsawPresent(level, max).filter(i => !had.has(i));
}
/* one <path> per piece, all carrying the same attributes: the page draws the outlines, the glow and the mask from these */
const jigsawShapes = (indices, attrs) => indices.map(i => `<path d="${jigsawPiece(i)}" ${attrs}/>`).join('');
/* the mask: white pieces for what is in place (with a hairline stroke so neighbours overlap and no seam shows); the ones that just arrived fade in */
function jigsawMaskPaths(level, max, newLevel){
  const fresh = new Set(jigsawArrived(level, max, newLevel));
  return jigsawPresent(level, max).map(i => `<path d="${jigsawPiece(i)}" fill="#fff" stroke="#fff" stroke-width="1.6"${fresh.has(i) ? ' class="jig-new"' : ''}/>`).join('');
}
let jigCount = 0;
const jigsawUid = () => ++jigCount;
