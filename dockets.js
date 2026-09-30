/* Clerk Quest Hot Dockets: situational cards written as a court docket (spec: docs/superpowers/specs/2026-09-29-hot-docket-design.md).
   Step 1: the Docket folder, a third tab in Collection, still empty. Art: Docket Folder.png (art/docket_folder.png);
   the four Study File pages (Situational Card - Learn/Example/Source/Practice.png) come in step 2.
   Loaded before the main script; everything here runs at call time and uses the app's globals (S, artSrc). */

const dockets = () => (S.dockets = Array.isArray(S.dockets) ? S.dockets : []);   // one entry per Hot Docket the player has had

/* ---------- the Dockets tab (inside Collection) ---------- */
function docketsTabHTML(){
  const n = dockets().length;
  return `<p class="st-note">Hot Dockets are court situations written as a docket. Read the file, then decide how to handle it. They test judgment, not just memory.</p>
    <div class="dk-folder"><img src="${artSrc('docket_folder')}" alt="Docket folder"></div>
    ${n ? '' : `<p class="empty">No Hot Dockets yet.</p>`}
    <p class="foot">A new Hot Docket arrives on your Home screen about once a week. Finished ones stay in this folder as your record.</p>`;
}

const DOCKET_CSS = `
.dk-folder{width:min(78%,320px);margin:8px auto 4px}
.dk-folder img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${DOCKET_CSS}</style>`);
