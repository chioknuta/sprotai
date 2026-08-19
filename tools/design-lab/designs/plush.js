/* SPRAT PLUSH — soft-toy sprats. Chubby silhouettes, felt-fuzz edges, a soft
   ambient shadow all round, blush cheeks, glossy bead eyes. The hero is a
   pastel unicorn sprat: gold horn, rainbow mane, heart tail, sparkles.
   The door is the rim cut clean through at her row and the two cut lips bent
   back off it, the top one wound onto its key, the way a sardine tin opens. */
DESIGNS["plush"] = {
  name: "Sprat Plush",
  blurb: "soft toys in oil; the hero is a unicorn",

  css: `
  /* ---- tin restyle: bone-pewter frame, DEEP smoked-oil ground, readable
         lanes. Lift these three rules to the real stylesheet if this wins.

         The oil used to be honey (#f3b360) and the fish were pastel, so fish
         and ground sat at the same lightness and separated by hue alone — a
         1.05 luminance ratio, which cost a Plush player moves against a par
         shared with three other looks. Real smoked-sprat oil is dark brown, so
         the fix was free: take the ground down to chestnut and leave the toys
         pastel. Nothing about the felt had to change. ---- */
  .dz-plush .tin{
    border-radius:26px;
    background:linear-gradient(150deg,#fbf7f0,#d3cabb 42%,#efe8dc 58%,#bfb5a5);
    box-shadow:0 16px 30px #4a2c0e4d, inset 0 2px 0 #fffffff2, inset 0 -2px 0 #00000014;
  }
  /* Not cocoa — oil. The radial is the tin's own gloss coming off the top-left
     rim; the raking band over it is the sheen on the surface of the oil, which
     is the thing that stops a dark ground reading as brown card. Kept a shade
     lighter than it wants to be, because the door's throat is near-black and
     needs to stay clearly darker than the oil it opens out of. */
  .dz-plush .tin-inner{
    border-radius:16px;
    background:
      linear-gradient(114deg, #ffffff00 22%, #ffd89a2b 38%, #ffd89a0f 50%, #ffffff00 64%),
      radial-gradient(112% 98% at 22% 2%, #ad6527 0%, #90521c 38%, #663810 72%, #3d1f07 100%);
    box-shadow:inset 0 3px 14px #00000073, inset 0 0 0 1px #ffd9a026;
  }
  /* lanes: warm cream, not white — they are puzzle information (which track a
     sprat slides along), so they have to be countable, not decorative. */
  .dz-plush .grid i{background:#ffe6bf3b}

  /* ---- the door. Everything is sized off --cell so the hole keeps the same
         share of the corridor at 38px as at 58px. The whole thing is one SVG
         with a fixed aspect (1.30 : 2.40 cells, viewBox 130x240, so one user
         unit is exactly 1/100 of a cell) — uniform scale, nothing distorts.
         The oil's right edge is at x=30 in that box; the hero's lane is the
         band y 70..170, and nothing solid is drawn inside it. ---- */
  .dz-plush .door{
    position:absolute; left:100%; top:var(--top);
    width:0; height:var(--cell);
  }
  .dz-plush .cut{
    position:absolute; left:calc(var(--cell) * -.30); top:50%;
    width:calc(var(--cell) * 1.30); height:calc(var(--cell) * 2.4);
    transform:translateY(-50%); overflow:visible;
  }

  /* ---- the one animation: a gentle pulse, shared by every sparkle
         and by the hero's iridescent sheen ---- */
  @keyframes plush-pulse{
    0%,100%{opacity:.55; transform:scale(.84)}
    50%    {opacity:1;   transform:scale(1.1)}
  }
  .dz-plush .tw{
    animation:plush-pulse 2.6s ease-in-out infinite;
    transform-box:fill-box; transform-origin:center;
  }
  .dz-plush .tw-b{animation-duration:3.4s; animation-delay:-.9s}
  .dz-plush .tw-c{animation-duration:2.1s; animation-delay:-1.6s}
  .dz-plush .sheen{
    animation:plush-pulse 5.2s ease-in-out infinite;
    transform-box:fill-box; transform-origin:62% 50%;
  }
  @media (prefers-reduced-motion: reduce){
    .dz-plush .tw,.dz-plush .sheen{animation:none}
  }
  `,

  door(g){
    // A hole, then the hardware. The loudest thing here is the aperture: a
    // near-black throat where the oil ends, flaring outward and brightening to
    // daylight, so it goes dark-to-light left-to-right and never caps off at
    // the far end. The two cut lips frame it and bend away from each other; one
    // of them winds onto the key.
    //
    // WHICH one is the only thing --row changes. The key normally winds off the
    // metal ABOVE her lane, which is fine on rows 1-5 because there is board up
    // there to wind onto. On row 0 there is not: 24px above the oil the date
    // line starts, and the key was landing on it. So on row 0 the whole
    // assembly — roll, key, and the little tab on the far lip — is reflected
    // about her lane and winds off the metal BELOW instead. Everything that
    // does NOT move (throat, both lips, the dribble) is drawn symmetrically
    // about y=120 and inside y 38..202, i.e. within 0.35 of a cell of the oil's
    // edge, so it clears the date line and the Moves row at every row. The hole
    // itself is untouched by the flip: she swims out of exactly the same gap.
    // (fit/door-budget.mjs measures this; fit/rows.mjs walks all six rows.)
    const lip = (d) => `<path d="${d}" fill="url(#plush-metal)" stroke="#5d5344" stroke-width="1.8" stroke-linejoin="round"/>`;
    const flip = (g && g.row === 0) ? ` transform="matrix(1 0 0 -1 0 240)"` : "";
    return `<div class="door">
  <svg class="cut" viewBox="0 0 130 240" aria-hidden="true">
    <defs>
      <linearGradient id="plush-throat" gradientUnits="userSpaceOnUse" x1="12" y1="0" x2="114" y2="0">
        <stop offset="0" stop-color="#150a01"/>
        <stop offset=".34" stop-color="#251202"/>
        <stop offset=".58" stop-color="#7d4d18"/>
        <stop offset=".74" stop-color="#f0d7a8"/>
        <stop offset=".86" stop-color="#fffdf5" stop-opacity=".92"/>
        <stop offset="1" stop-color="#fffdf5" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="plush-oil" gradientUnits="userSpaceOnUse" x1="-14" y1="0" x2="30" y2="0">
        <stop offset="0" stop-color="#3a1e04" stop-opacity="0"/>
        <stop offset="1" stop-color="#2c1602" stop-opacity=".85"/>
      </linearGradient>
      <linearGradient id="plush-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8e8574"/>
        <stop offset=".22" stop-color="#fffdf7"/>
        <stop offset=".62" stop-color="#ded6c5"/>
        <stop offset="1" stop-color="#8a8170"/>
      </linearGradient>
      <radialGradient id="plush-roll" cx=".34" cy=".28" r=".82">
        <stop offset="0" stop-color="#fdfbf5"/>
        <stop offset=".46" stop-color="#d5ccba"/>
        <stop offset="1" stop-color="#8a8170"/>
      </radialGradient>
      <linearGradient id="plush-key" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffeec4"/>
        <stop offset="1" stop-color="#c68f34"/>
      </linearGradient>
    </defs>

    <!-- the oil goes dark as it runs up to the cut -->
    <rect x="-14" y="72" width="44" height="96" fill="url(#plush-oil)"/>

    <!-- THE HOLE: a flaring throat, black where the tin was, daylight outward -->
    <path d="M 12 72 C 46 68 82 56 118 34 L 118 206 C 82 184 46 172 12 168 Z"
          fill="url(#plush-throat)"/>
    <path d="M 12 74 C 46 70 82 60 110 44" fill="none" stroke="#150a01" stroke-opacity=".8" stroke-width="7"/>
    <path d="M 12 166 C 46 170 82 180 110 196" fill="none" stroke="#150a01" stroke-opacity=".8" stroke-width="7"/>

    <!-- The two cut lips, bent back off the hole. They used to splay to y 24
         and 216 — 28px past the oil at a 58px cell, over the date line — so
         they are tucked to 38/202 and now lie along the throat's own edge
         instead of outside it. The hole keeps its full flare (34..206); only
         the metal around it comes in. -->
    ${lip("M 8 59 C 44 55 78 48 101 38 L 107 50 C 82 62 46 70 10 73 Z")}
    ${lip("M 8 181 C 44 185 78 192 101 202 L 107 190 C 82 178 46 170 10 167 Z")}
    <path d="M 10 73 C 46 70 82 62 107 50" fill="none" stroke="#fffdf6" stroke-opacity=".5" stroke-width="2"/>
    <path d="M 10 167 C 46 170 82 178 107 190" fill="none" stroke="#fffdf6" stroke-opacity=".5" stroke-width="2"/>

    <!-- THE HARDWARE, and the only thing --row moves: the little bent tab on
         one lip, and the lid wound onto its key on the other. -->
    <g${flip}>
      <g transform="rotate(32 105 194)">
        <ellipse cx="105" cy="194" rx="5" ry="9.5" fill="url(#plush-metal)" stroke="#5d5344" stroke-width="1.8"/>
        <path d="M 103 187 V 201" fill="none" stroke="#5d5344" stroke-opacity=".5" stroke-width="1.6"/>
      </g>
      <circle cx="92" cy="31" r="15.5" fill="url(#plush-roll)" stroke="#544b3a" stroke-width="2.3"/>
      <path d="M 92 19 A 12 12 0 1 1 80 34 A 7.5 7.5 0 1 1 94 38" fill="none" stroke="#7e7563" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M 82 22 A 12 12 0 0 1 94 17" fill="none" stroke="#fffdf6" stroke-opacity=".8" stroke-width="2.6" stroke-linecap="round"/>
      <g stroke-linecap="round" fill="none">
        <path d="M 92 31 L 113 14" stroke="#4a4232" stroke-width="8"/>
        <ellipse cx="119" cy="11" rx="7.5" ry="5.8" fill="none" stroke="#4a4232" stroke-width="7"/>
        <path d="M 92 31 L 113 14" stroke="url(#plush-key)" stroke-width="5"/>
        <ellipse cx="119" cy="11" rx="7.5" ry="5.8" fill="none" stroke="url(#plush-key)" stroke-width="4.4"/>
      </g>
      <circle cx="92" cy="31" r="3.6" fill="url(#plush-key)" stroke="#4a4232" stroke-width="1.6"/>
    </g>

    <!-- oil dribbling out under the lower lip (shorter than it was: it hung
         31px past the oil and landed on the Moves row on row 5), and a little
         glitter outside -->
    <path d="M 34 176 C 39 187 37 196 31 202 C 26 194 27 186 28 175 Z" fill="#c9832c" opacity=".5"/>
    <g fill="#dd9a3e">
      <path class="tw" d="M 118 56 q 2 -2 2.5 -7.5 q .5 5.5 2.5 7.5 q -2 2 -2.5 7.5 q -.5 -5.5 -2.5 -7.5 Z"/>
      <path class="tw tw-b" d="M 104 186 q 1.5 -1.5 1.9 -5.6 q .4 4.1 1.9 5.6 q -1.5 1.5 -1.9 5.6 q -.4 -4.1 -1.9 -5.6 Z"/>
      <path class="tw tw-c" d="M 122 152 q 1.4 -1.4 1.7 -5 q .3 3.6 1.7 5 q -1.4 1.4 -1.7 5 q -.3 -3.6 -1.7 -5 Z"/>
    </g>
  </svg>
</div>`;
  },

  sprat(len, hero){
    const w = len * 100;
    const r = v => Math.round(v);
    const sfx = (hero ? "h" : "n") + len;
    const ID = k => `plush-${k}-${sfx}`;
    const L = (a, b, t) => r(a + (b - a) * t);

    // ---- ONE continuous silhouette, and it is a FISH, not a capsule. Three
    // landmarks do the work: a snout at `nose`, a gill line at `hb`, and a
    // waist at `pd`. Between them the belly swells to FULL depth (y 6..94) at
    // `xp` and tapers off both ways — the taper is what stops a three-cell
    // sprat reading as a tube, and it costs almost nothing in packing because
    // the neighbour's own taper meets it. Head (74u) and tail (44u) are
    // ABSOLUTE, so a 3-cell sprat is a 2-cell sprat plus one cell of belly.
    const nose = w - 4;
    const hb   = nose - 74;                  // gill line / base of the head
    const pd   = 44;                         // peduncle — the waist
    const xp   = r(pd + (hb - pd) * 0.56);   // deepest point of the belly

    // snout -> forehead -> nape. The snout is conical, not a dome.
    const head = `M ${nose} 48 C ${nose - 2} 34 ${nose - 10} 24 ${nose - 25} 19` +
                 ` C ${nose - 42} 15 ${nose - 57} 15 ${hb} 15`;
    // nape -> over the belly's peak -> down into the waist
    const back = ` C ${L(hb, xp, .40)} 15 ${L(xp, hb, .42)} 5.5 ${xp} 6` +
                 ` C ${L(xp, pd, .42)} 6.5 ${L(pd, xp, .40)} 15 ${pd} 36`;
    // forked caudal, reaching x=5 and fanning nearly the full height there
    const tail = hero
      ? ` C 30 20 13 3 4 8 C 17 25 30 42 33 50 C 30 58 17 75 4 92 C 13 97 30 80 ${pd} 64`
      : ` C 34 26 18 13 5 9 C 14 24 24 38 27 50 C 24 62 14 76 5 91 C 18 87 34 74 ${pd} 64`;
    // waist -> under the belly's deepest -> up the throat -> jaw -> snout
    const belly = ` C ${L(pd, xp, .40)} 82 ${L(xp, pd, .42)} 93.5 ${xp} 94` +
                  ` C ${L(xp, hb, .48)} 94 ${L(hb, xp, .40)} 88 ${hb} 86` +
                  ` C ${nose - 57} 86 ${nose - 42} 85 ${nose - 26} 79` +
                  ` C ${nose - 10} 71 ${nose - 2} 60 ${nose} 48 Z`;
    const body = head + back + tail + belly;

    // ---- colour. The ordinary sprat is a SMOKED sprat rendered in felt:
    // powder-blue satin back, a silver flank, and an oatmeal underside. Every
    // stop sits WELL ABOVE the chestnut oil in value — the old top stop
    // (#3f677f) was darker than some of the ground and the back sank into it,
    // which is exactly how you lose count of a sprat's length. `tint` is the
    // separate, lighter blue used on the tail, because the tail is the thinnest
    // part of the silhouette and the last thing that should go dim.
    // White belongs to the hero. The ordinary sprat now bottoms out at wheat
    // (#ffe4a6), not at near-white — it stays far above the oil, but it is a
    // WARM pale, so the hero's cool white-pink is the only near-white object in
    // the tin and she separates by hue and by value at once.
    const pal = hero
      ? { stops: [[0,"#fffcfe"],[.40,"#ffcee3"],[1,"#ff9dc5"]],
          fin:"#ff8fbc", tint:"#ffa8ca", pec:"#ff8fbc", fuzz:"#fff0f7",
          belly:"#fff6fb", blush:"#ff5f97", shade:"#7a3a55", }
      : { stops: [[0,"#5f9ab9"],[.13,"#86b8d0"],[.30,"#bcd6e0"],[.44,"#e7e2cd"],
                  [.60,"#f8da93"],[.80,"#ffdf99"],[1,"#ffe7b4"]],
          fin:"#4e88a8", tint:"#82b3ce", pec:"#eda94e", fuzz:"#fff6ea",
          belly:"#ffdf9c", blush:"#ff8a63", shade:"#3d2611", };

    const felt = `stroke="${pal.fuzz}" stroke-opacity=".5" stroke-width="2.4"`;

    // ---- crest. Every fin lives INSIDE the silhouette — a felt patch appliqued
    // onto the back — so a fish never splays past its own lane and you can
    // always tell which lane it is in and which way up it lies.
    let crest;
    if (hero){
      const x0 = 78, x1 = hb - 8, n = len === 2 ? 5 : 7, step = (x1 - x0) / n;
      const cols = ["#b9a3f2","#8fcdf5","#8fe4bb","#ffdc7a","#ffab74","#ff8fb8","#c0a6ff"];
      crest = `<g ${felt}>`;
      for (let i = 0; i < n; i++){
        const a = r(x0 + i * step), b = r(a + step * 1.5), m = r((a + b) / 2);
        const top = 13 + (i % 2) * 4;
        crest += `<path d="M ${a} 36 C ${a} ${top + 8} ${m - 4} ${top} ${m} ${top} ` +
                 `C ${r(m + 4)} ${top} ${b} ${top + 9} ${b} 34 Q ${m} 41 ${a} 36 Z" fill="${cols[i % 7]}"/>`;
      }
      crest += `</g>`;
    } else {
      // a felt sail sewn onto the back: steep leading edge, long concave
      // trailing edge, and a base that ARCS with the back so it can never
      // read as a ruled line. It is a shade DARKER than the back it sits on,
      // which is what makes it a patch instead of an outline.
      const bx0 = L(xp, hb, .55), ax = L(xp, hb, .22), bx1 = L(xp, pd, .35);
      const sail = `M ${bx0} 35 C ${bx0 - 4} 22 ${ax + 9} 9 ${ax} 9 ` +
                   `C ${ax - 20} 12 ${bx1 + 14} 22 ${bx1} 31 ` +
                   `C ${L(bx1, bx0, .34)} 36 ${L(bx1, bx0, .70)} 38 ${bx0} 35 Z`;
      crest = `<path d="${sail}" fill="${pal.fin}"/>` +
              `<path d="M ${bx0} 35 C ${bx0 - 4} 22 ${ax + 9} 9 ${ax} 9 ` +
              `C ${ax - 20} 12 ${bx1 + 14} 22 ${bx1} 31" fill="none" ` +
              `stroke="${pal.fuzz}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>` +
              `<g stroke="#3d6a84" stroke-opacity=".3" stroke-width="1.8" ` +
              `stroke-linecap="round" fill="none">` +
              `<path d="M ${ax - 1} 32 Q ${ax - 5} 21 ${ax - 4} 13"/>` +
              `<path d="M ${L(ax, bx1, .34)} 31 Q ${L(ax, bx1, .30)} 24 ${L(ax, bx1, .28)} 17"/></g>`;
    }

    // pectoral: a felt blade rooted behind the gill and swept back and down,
    // with one stitched ray. It used to be a plain rotated ellipse, which on a
    // pale belly read as a stain rather than a fin — the point at the trailing
    // end is what makes it a flipper at 38px.
    const fpx = hero ? hb - 6 : hb - 12;
    const flipper =
      `<g stroke="${pal.fuzz}" fill="none" stroke-width="2.2">` +
      `<path d="M ${fpx + 11} 57 C ${fpx - 1} 60 ${fpx - 10} 70 ${fpx - 16} 85 ` +
      `C ${fpx + 3} 82 ${fpx + 11} 71 ${fpx + 11} 57 Z" fill="${pal.pec}" ` +
      `fill-opacity=".83" stroke-opacity=".62"/>` +
      `<path d="M ${fpx + 5} 64 C ${fpx - 2} 70 ${fpx - 7} 76 ${fpx - 11} 82" ` +
      `stroke-opacity=".34" stroke-linecap="round"/></g>`;

    // ---- seams. A plush sprat is sewn from panels, and the panel joins sit on
    // the cell lines: one seam means two cells, two seams mean three. Length is
    // the puzzle information, so it gets stated twice — outline and stitching.
    // Two threads, not one: a dark one laid a hair to the right of a light one.
    // A single light dash disappeared against the cream belly and a single dark
    // one disappeared against the slate back; the pair reads over both, so the
    // cell count survives wherever the seam happens to cross.
    let dark = "", light = "";
    for (let k = 1; k < len; k++){
      dark  += `M${k * 100 + 1.7} 4V96`;
      light += `M${k * 100} 4V96`;
    }
    const seams = `<g fill="none" stroke-width="2.6" stroke-dasharray="7 8">` +
      `<path d="${dark}" stroke="${pal.shade}" stroke-opacity=".26"/>` +
      `<path d="${light}" stroke="${pal.fuzz}" stroke-opacity=".72"/></g>`;

    const eyeX = r(nose - 33), eyeY = 44;

    const star = (x, y, rad, cls) =>
      `<path class="${cls}" d="M ${r(x)} ${r(y - rad)} q ${r(rad * .22)} ${r(rad * .78)} ${rad} ${rad} ` +
      `q ${r(-rad * .78)} ${r(rad * .22)} ${-rad} ${rad} q ${r(-rad * .22)} ${r(-rad * .78)} ${-rad} ${-rad} ` +
      `q ${r(rad * .78)} ${r(-rad * .22)} ${rad} ${-rad} Z"/>`;

    const hx = r(nose - 50);
    const horn = hero ? `
      <path d="M ${hx - 7} 30 Q ${hx + 4} 11 ${nose - 14} 7 Q ${hx + 14} 21 ${hx + 8} 31 Z"
            fill="url(#${ID('hn')})" stroke="#e0a94c" stroke-opacity=".6" stroke-width="1.6"/>
      <g stroke="#e0a94c" stroke-opacity=".95" stroke-width="2.6" stroke-linecap="round" fill="none">
        <path d="M ${hx - 3} 25 Q ${hx + 6} 21 ${hx + 13} 18"/>
        <path d="M ${hx + 6} 18 Q ${hx + 14} 14 ${hx + 22} 11"/>
      </g>` : "";

    const sparkles = hero ? `<g fill="#fffcf0">` +
      star(nose - 12, 17, 9, "tw") + star(nose - 30, 84, 6, "tw tw-b") +
      star(58, 34, 5, "tw tw-c") + `</g>` : "";

    const glow = hero
      ? `<ellipse cx="${r(w / 2)}" cy="50" rx="${r(w / 2 - 2)}" ry="49" fill="url(#${ID('gl')})"/>` : "";

    const stops = pal.stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join("");


    // the head, told as a head: a lighter gill cover with a bright felt seam
    const gill = `<path d="M ${hb + 7} 15 C ${hb + 17} 38 ${hb + 17} 62 ${hb + 4} 85 ` +
      `L ${nose + 6} 92 L ${nose + 6} 8 Z" fill="#fff5e2" fill-opacity=".15"/>` +
      `<path d="M ${hb + 7} 15 C ${hb + 17} 38 ${hb + 17} 62 ${hb + 4} 85" fill="none" ` +
      `stroke="${pal.fuzz}" stroke-opacity=".5" stroke-width="2.2"/>` +
      `<ellipse cx="${nose - 34}" cy="58" rx="26" ry="19" fill="#fff6e6" fill-opacity=".14"/>`;

    const svg = `
<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="${ID('b')}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
    <linearGradient id="${ID('lit')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".26"/>
      <stop offset=".30" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".70" stop-color="${pal.belly}" stop-opacity="0"/>
      <stop offset="1" stop-color="${pal.belly}" stop-opacity="${hero ? ".9" : ".34"}"/>
    </linearGradient>
    <linearGradient id="${ID('tt')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="72" y2="0">
      <stop offset="0" stop-color="${pal.tint}" stop-opacity=".7"/>
      <stop offset="1" stop-color="${pal.tint}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${ID('bl')}">
      <stop offset="0" stop-color="${pal.blush}" stop-opacity=".62"/>
      <stop offset="1" stop-color="${pal.blush}" stop-opacity="0"/>
    </radialGradient>
    <path id="${ID('p')}" d="${body}"/>
    <clipPath id="${ID('c')}"><use href="#${ID('p')}"/></clipPath>
    ${hero ? `
    <radialGradient id="${ID('gl')}">
      <stop offset=".3" stop-color="#fff2f8" stop-opacity=".9"/>
      <stop offset=".62" stop-color="#ffdcee" stop-opacity=".4"/>
      <stop offset="1" stop-color="#ffd9ec" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${ID('hn')}" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#f3bf60"/>
      <stop offset=".5" stop-color="#ffedb4"/>
      <stop offset="1" stop-color="#fffdf4"/>
    </linearGradient>
    <linearGradient id="${ID('sh')}" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#9fe9d8" stop-opacity=".7"/>
      <stop offset=".5" stop-color="#fff3c9" stop-opacity=".15"/>
      <stop offset="1" stop-color="#cbb2ff" stop-opacity=".7"/>
    </linearGradient>` : ``}
  </defs>
  ${glow}
  <use href="#${ID('p')}" fill="none" stroke="${pal.shade}" stroke-opacity=".24" stroke-width="5"/>
  <use href="#${ID('p')}" fill="none" stroke="${pal.fuzz}" stroke-opacity=".12" stroke-width="9"/>
  <use href="#${ID('p')}" fill="url(#${ID('b')})" stroke="${pal.fuzz}" stroke-opacity=".62" stroke-width="2.8"/>
  <g clip-path="url(#${ID('c')})">
    <rect x="0" y="0" width="72" height="100" fill="url(#${ID('tt')})"/>
    <rect x="0" y="0" width="${w}" height="100" fill="url(#${ID('lit')})"/>
    ${seams}
    <path d="M ${pd + 18} 71 C ${xp} 86 ${L(xp, hb, .7)} 83 ${nose - 30} 70" fill="none"
          stroke="${pal.shade}" stroke-opacity=".16" stroke-width="2.2" stroke-linecap="round"
          stroke-dasharray="5 8"/>
    ${hero ? `<ellipse class="sheen" cx="${r(w * .58)}" cy="50" rx="${r(w * .34)}" ry="42" fill="url(#${ID('sh')})"/>` : ``}
    ${crest}${flipper}${gill}
    <ellipse cx="${r(nose - 46)}" cy="61" rx="13" ry="8.5" fill="url(#${ID('bl')})"/>
  </g>
  <circle cx="${eyeX}" cy="${eyeY}" r="13" fill="#fffdf7" stroke="${pal.shade}" stroke-opacity=".22" stroke-width="1.5"/>
  <g class="eye">
    <circle cx="${eyeX}" cy="${eyeY}" r="6.8" fill="#3a2a1e"/>
    <circle cx="${r(eyeX + 2)}" cy="${eyeY - 2.6}" r="2.5" fill="#fff"/>
    <circle cx="${r(eyeX - 2.6)}" cy="${eyeY + 3}" r="1.2" fill="#fff" opacity=".8"/>
  </g>
  <path d="M ${r(nose - 19)} 63 q 7 8 13 -3" fill="none" stroke="${pal.shade}" stroke-opacity=".55"
        stroke-width="2.6" stroke-linecap="round"/>
  ${horn}${sparkles}
</svg>`;
    return svg.replace(/\s{2,}/g, " ").replace(/> </g, "><").replace(/\s+\/>/g, "/>").trim();
  }
};
