// Builds the 1200x630 social preview card, using the same sprat drawing the
// game uses so the card and the game can't drift apart visually.
import { writeFileSync } from "node:fs";

function sprat(len, hero, id){
  const w = len * 100;
  const body  = hero ? ["#ffc7d2","#f2657f","#d64460"] : ["#dcebf3","#98bed5","#6e96b0"];
  const belly = hero ? "#fff2f4" : "#f8f3e6";
  const fin   = hero ? "#e0546e" : "#7ea9c2";
  return `
<svg viewBox="0 0 ${w} 100" preserveAspectRatio="none" width="100%" height="100%">
  <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${body[0]}"/>
    <stop offset=".45" stop-color="${body[1]}"/>
    <stop offset="1" stop-color="${body[2]}"/>
  </linearGradient></defs>
  <path fill="${fin}" d="M ${w*0.10} 50 L 5 19 Q ${w*0.055} 50 5 81 Z"/>
  <path fill="${fin}" d="M ${w*0.42} 25 Q ${w*0.50} 5 ${w*0.60} 23 Z"/>
  <path fill="${fin}" d="M ${w*0.45} 77 Q ${w*0.52} 95 ${w*0.62} 79 Z"/>
  <path fill="url(#g${id})"
        d="M ${w*0.08} 50 C ${w*0.16} 17 ${w*0.55} 9 ${w*0.80} 23
           C ${w*0.93} 31 ${w-6} 41 ${w-6} 50
           C ${w-6} 59 ${w*0.93} 69 ${w*0.80} 77
           C ${w*0.55} 91 ${w*0.16} 83 ${w*0.08} 50 Z"/>
  <path fill="${belly}" opacity=".9"
        d="M ${w*0.18} 65 C ${w*0.36} 83 ${w*0.68} 81 ${w*0.86} 65
           C ${w*0.68} 73 ${w*0.36} 73 ${w*0.18} 65 Z"/>
  <ellipse cx="${w*0.69}" cy="59" rx="${w*0.05}" ry="6.5" fill="#ff9db0" opacity="${hero ? .8 : .45}"/>
  <circle cx="${w*0.80}" cy="42" r="12" fill="#fff"/>
  <circle cx="${w*0.815}" cy="43" r="6.8" fill="#2f2318"/>
  <circle cx="${w*0.845}" cy="40" r="2.5" fill="#fff"/>
  <path d="M ${w*0.855} 61 q ${w*0.035} 7 ${w*0.075} 1" fill="none"
        stroke="#2f2318" stroke-width="2.8" stroke-linecap="round" opacity=".75"/>
  ${hero ? `<path d="M ${w*0.28} 28 l 3.5 -8 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 Z" fill="#fff6b8"/>` : ""}
</svg>`;
}

const CELL = 74, W = 6, H = 6;
const TIN_X = 640, TIN_Y = 88;
// hero in row 2 with a clear lane; a readable, believable arrangement
const FISH = [
  { r:2, c:1, len:2, dir:"R", hero:true },
  { r:0, c:0, len:2, dir:"D" }, { r:0, c:2, len:3, dir:"R" },
  { r:0, c:5, len:2, dir:"D" }, { r:1, c:1, len:2, dir:"R" },
  { r:2, c:3, len:3, dir:"D" }, { r:2, c:4, len:2, dir:"D" },
  { r:3, c:0, len:2, dir:"D" }, { r:4, c:1, len:3, dir:"R" },
  { r:2, c:5, len:3, dir:"D" }, { r:5, c:4, len:2, dir:"R" },
];
const isH = f => f.dir === "R" || f.dir === "L";

let inner = "";
for (let r = 1; r < H; r++)
  inner += `<line x1="0" y1="${r*CELL}" x2="${W*CELL}" y2="${r*CELL}" stroke="#00000010"/>`;
for (let c = 1; c < W; c++)
  inner += `<line x1="${c*CELL}" y1="0" x2="${c*CELL}" y2="${H*CELL}" stroke="#00000010"/>`;

let sprats = "";
FISH.forEach((f, i) => {
  const w = (isH(f) ? f.len : 1) * CELL, h = (isH(f) ? 1 : f.len) * CELL;
  const x = f.c * CELL, y = f.r * CELL;
  const inner2 = sprat(f.len, !!f.hero, i);
  const rot = isH(f) ? "" : `transform="rotate(90 ${x + w/2} ${y + h/2})"`;
  const sw = f.len * CELL, sh = CELL;
  const sx = x + w/2 - sw/2, sy = y + h/2 - sh/2;
  sprats += `<g ${rot}><svg x="${sx}" y="${sy}" width="${sw}" height="${sh}" overflow="visible">${inner2}</svg></g>`;
});

/* qlmanage always renders a square thumbnail and scales to fill it, so the
   card is drawn inside a 1200x1200 canvas in the middle 630px band. Cropping
   that band back out with sips gives an exact, unscaled 1200x630. */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#fdf6e9"/>
    </linearGradient>
    <linearGradient id="ttl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6a93c"/><stop offset="1" stop-color="#e0722f"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2f4f7"/><stop offset=".45" stop-color="#b9c0c9"/>
      <stop offset=".6" stop-color="#dfe3e9"/><stop offset="1" stop-color="#aeb5bd"/>
    </linearGradient>
    <linearGradient id="oil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0bd6d"/><stop offset="1" stop-color="#dc9c44"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <g transform="translate(0 285)">
  <text x="86" y="240" font-family="Helvetica,Arial,sans-serif" font-size="86" font-weight="bold"
        letter-spacing="10" fill="url(#ttl)">ŠPROTAI</text>
  <text x="90" y="300" font-family="Helvetica,Arial,sans-serif" font-size="34" fill="#8a6b42">Free the little one.</text>
  <text x="90" y="382" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="#a08a68">A tin of sprats, packed too tight.</text>
  <text x="90" y="422" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="#a08a68">Slide them aside. A new tin every day.</text>
  <text x="90" y="516" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold" fill="#e8834a">sprot.ai</text>

  <g transform="translate(${TIN_X} ${TIN_Y})">
    <rect x="-14" y="-14" width="${W*CELL+28}" height="${H*CELL+28}" rx="26" fill="url(#rim)"/>
    <rect x="0" y="0" width="${W*CELL}" height="${H*CELL}" rx="13" fill="url(#oil)"/>
    <rect x="${W*CELL}" y="${2*CELL+6}" width="14" height="${CELL-12}" fill="#f8dfae"/>
    ${inner}
    ${sprats}
  </g>
  </g>
</svg>`;

writeFileSync(process.argv[2] || "og.svg", svg);
console.log("wrote", process.argv[2]);
