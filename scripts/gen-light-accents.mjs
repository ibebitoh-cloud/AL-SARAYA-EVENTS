// Writes src/light-accents.css. Run: node scripts/gen-light-accents.mjs > src/light-accents.css
const P = 'html[data-theme="light"]';
// [700 text, 50 tint, 200 border]
const hues = {
  red:['#b91c1c','#fef2f2','#fecaca'], orange:['#c2410c','#fff7ed','#fed7aa'], amber:['#b45309','#fffbeb','#fde68a'],
  yellow:['#a16207','#fefce8','#fef08a'], lime:['#4d7c0f','#f7fee7','#d9f99d'], green:['#15803d','#f0fdf4','#bbf7d0'],
  emerald:['#047857','#ecfdf5','#a7f3d0'], teal:['#0f766e','#f0fdfa','#99f6e4'], cyan:['#0e7490','#ecfeff','#a5f3fc'],
  sky:['#0369a1','#f0f9ff','#bae6fd'], blue:['#1d4ed8','#eff6ff','#bfdbfe'], indigo:['#4338ca','#eef2ff','#c7d2fe'],
  violet:['#6d28d9','#f5f3ff','#ddd6fe'], purple:['#7e22ce','#faf5ff','#e9d5ff'], fuchsia:['#a21caf','#fdf4ff','#f5d0fe'],
  pink:['#be185d','#fdf2f8','#fbcfe8'], rose:['#be123c','#fff1f2','#fecdd3'],
};
const op = ['', '/60', '/70', '/80', '/90'];
const esc = (c) => c.replace(/[:/]/g, (m) => '\\' + m);
const sel = (cls, pseudo = '') => `.${esc(cls)}${pseudo}`;
let out = [];
out.push(`/* LIGHT THEME ACCENT CONTRAST
   Accent shades picked for dark screens (text-*-50..500, dark tinted
   panels and borders) are swapped for readable light-mode shades.
   Generated per hue; add a hue here instead of patching single classes. */`);
for (const [h, [txt, tint, border]] of Object.entries(hues)) {
  const t = [];
  for (const s of [50,100,200,300,400,500]) for (const o of op) {
    t.push(sel(`text-${h}-${s}${o}`));
    t.push(sel(`hover:text-${h}-${s}${o}`, ':hover'));
    t.push(`.group:hover .${esc(`group-hover:text-${h}-${s}${o}`)}`);
  }
  out.push(`${P} :is(${t.join(', ')}) { color: ${txt} !important; }`);
  const b = [];
  for (const s of [800,900,950]) for (const o of ['', '/30', '/40', '/50', '/60', '/70', '/80']) {
    b.push(sel(`bg-${h}-${s}${o}`));
    b.push(sel(`hover:bg-${h}-${s}${o}`, ':hover'));
  }
  out.push(`${P} :is(${b.join(', ')}) { background-color: ${tint} !important; }`);
  const br = [];
  for (const s of [700,800,900,950]) for (const o of ['', '/40', '/50', '/60', '/80']) br.push(sel(`border-${h}-${s}${o}`));
  out.push(`${P} :is(${br.join(', ')}) { border-color: ${border} !important; }`);
}
// White text stays white on solid accent buttons/badges.
const w = [];
for (const h of Object.keys(hues)) for (const s of [500,600,700]) for (const k of ['bg','from']) {
  w.push(`.${k}-${h}-${s}`);
}
const W = w.join(', ');
out.push(`${P} :is(${W}).text-white,\n${P} :is(${W}) > .text-white { color: #ffffff !important; }`);
console.log(out.join('\n'));
