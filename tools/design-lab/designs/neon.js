/* NIGHT CATCH — the tin after dark.
   Deep teal-black brine, sprats cut out of the dark by a cold cyan rim light
   coming off the opened lid, and one hero who is herself the light source.
   NOTE: this direction restyles the tin (dark oil + gunmetal frame). Those
   rules are marked TIN: below so they can be lifted to the real stylesheet. */
DESIGNS["neon"] = {
  name: "Night Catch",
  blurb: "black brine, cyan rim-light, one fish that glows",

  css: `
  /* TIN: gunmetal frame, cold. */
  .dz-neon .tin{
    background:linear-gradient(145deg,#8b99a6,#333d47 36%,#5f6d7a 54%,#1e262e);
    box-shadow:0 16px 34px #06121a55, inset 0 1px 0 #ffffff3d;
  }
  /* TIN: the oil goes deep — teal-black brine with a faint diagonal sheen.
     Pulled a stop darker than the first cut: the brine has to stay clearly
     BELOW every part of a fish in value, or the tails sink into it. */
  .dz-neon .tin-inner{
    background:
      linear-gradient(116deg, transparent 26%, #7fe9ff10 43%, #7fe9ff05 52%, transparent 64%),
      radial-gradient(135% 95% at 20% 8%, #0c2b34 0%, #071d26 42%, #041014 76%, #010709 100%);
    box-shadow:inset 0 3px 16px #000000c2, inset 0 0 0 1px #6fe6ff1f;
  }
  /* TIN: lane lines. Still faint, but they have to be countable — this is a
     game about how many cells long a thing is. */
  .dz-neon .grid i{ background:#7fe9ff1f; }

  /* the hero paints over her neighbours so her glow can light them.
     (real stylesheet: the hero's .fish element needs this z-index) */
  .dz-neon .fish.hero{ z-index:5; }

  /* ---------- THE DOOR: the lid, torn at her lane and peeled back ---------- */
  /* daylight landing on the brine just inside the gap */
  .dz-neon .neon-spill{
    position:absolute; right:-6px;
    top:calc(var(--top) + var(--cell)*0.5 - var(--cell)*1.6);
    width:calc(var(--cell)*2.3); height:calc(var(--cell)*3.2);
    background:radial-gradient(closest-side ellipse at 100% 50%,
      rgba(226,255,255,.66) 0%, rgba(140,233,255,.32) 30%,
      rgba(60,172,216,.12) 56%, rgba(0,0,0,0) 76%);
  }
  /* the shaft of light through the opening, widening as it enters */
  .dz-neon .neon-beam{
    position:absolute; right:-6px;
    top:calc(var(--top) - var(--cell)*0.42); height:calc(var(--cell)*1.84);
    width:calc(var(--cell)*1.5);
    background:linear-gradient(270deg, rgba(240,255,255,.62), rgba(150,236,255,.17) 42%, rgba(0,0,0,0) 88%);
    clip-path:polygon(100% 32%, 100% 68%, 0 98%, 0 2%);
    -webkit-mask-image:linear-gradient(180deg, transparent 0%, #000 26%, #000 74%, transparent 100%);
    mask-image:linear-gradient(180deg, transparent 0%, #000 26%, #000 74%, transparent 100%);
  }
  /* the gap itself: a bright cut clean through the rim */
  .dz-neon .neon-gap{
    position:absolute; left:calc(100% - 6px); width:21px;
    background:linear-gradient(90deg,#8fe4ff 0%,#ffffff 30%,#dcf8ff 62%,#79dcff 100%);
    -webkit-mask-image:linear-gradient(90deg, transparent 0%, #000 26%, #000 100%);
    mask-image:linear-gradient(90deg, transparent 0%, #000 26%, #000 100%);
    box-shadow:0 0 14px 5px rgba(198,248,255,.72), 0 0 46px 20px rgba(90,206,244,.32),
               0 0 90px 34px rgba(60,170,220,.16);
  }
  /* the light blasting back OUT through the torn lane, so the cream page
     between the two flaps is part of the beam and not a bright lozenge.
     --oh is its height in cells, centred on her lane; door() trims it on the
     rows where there is no board to splay over (see there). Its last stop is
     transparent, but the ramp is still visible at ~94% of the radius, so this
     ellipse is the outermost thing the door paints — it, not the metal, is
     what decides how far above and below the oil the door reaches. */
  .dz-neon .neon-out{
    position:absolute; left:calc(100% + 2px); --oh:2;
    top:calc(var(--top) + var(--cell)*0.5 - var(--cell)*var(--oh)/2);
    width:54px; height:calc(var(--cell)*var(--oh));
    background:radial-gradient(farthest-side ellipse at 0% 50%,
      rgba(160,238,255,.88) 0%, rgba(86,208,247,.52) 30%,
      rgba(50,172,224,.2) 58%, rgba(40,150,205,0) 100%);
  }
  /* the two peeled halves of the lid. Width is fixed px (like the 11px rim —
     it is a sheet of metal, not a grid unit); height tracks the cell so the
     door never dwarfs the board on a small phone. */
  .dz-neon .neon-panel{
    position:absolute; left:calc(100% - 12px); width:53px; overflow:visible;
  }
  /* top/height are set inline by door(): the peel is clamped to the metal that
     actually exists above and below the lane, so on row 0 or row 5 a flap is
     shortened or dropped instead of floating off the board. */
  .dz-neon .neon-panel.b{ transform:scaleY(-1); transform-origin:50% 50%; }

  /* ---------- the hero's one animation ---------- */
  @keyframes neon-breathe{ 0%,100%{opacity:.6} 50%{opacity:1} }
  .dz-neon .neon-pulse{ animation:neon-breathe 3.6s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce){
    .dz-neon .neon-pulse{ animation:none; opacity:.85 }
  }`,

  door(g){
    // the lid, torn across her lane and bent back off the rim: a bowed sheet
    // of metal, its far edge rolled into a bead, its torn edge ragged, creased
    // dark where it folds against the rim. Mirrored below the gap, so the peel
    // works on any row and her lane straight out through it is always clear.
    const PH = 1.06, r3 = n => Math.round(n * 1000) / 1000;
    const row = g && g.row || 0, rows = g && g.H || 6;
    const hT = Math.min(PH, row), hB = Math.min(PH, rows - row - 1);
    // the cut only overhangs the lane where a peel exists to chew its edge
    const oT = r3(Math.min(.13, hT)), oB = r3(Math.min(.13, hB));
    // ...and the halo outside the gap splays only as far as there is peel to
    // splay off. Two cells of it, centred on her lane, is 25px past the oil on
    // row 0 and row 5 — over the date line and over the Moves row — because on
    // those rows one flap is missing and the glow was still drawn as if both
    // were there. Same rule as hT/hB: clamp it to the metal that exists.
    const oh = (hT < 1 || hB < 1) ? 1.7 : 2;
    const panel = (cls, h, top) => h < .12 ? "" : `
<svg class="neon-panel ${cls}" style="top:${top};height:calc(var(--cell)*${h})"
     viewBox="0 0 53 56" preserveAspectRatio="none" aria-hidden="true">
  <path d="M9 58 L11 7 C25 3 40 5 49 11 C52 24 52 42 49 56
           L44 51 C37 55 33 49 26 52 C20 54 16 50 12 57 Z"
        fill="#02080c" opacity=".4"/>
  <path d="M5 55 L7 4 C21 0 36 2 45 8 C48 21 48 39 45 53
           L40 48 C33 52 29 46 22 49 C16 51 12 47 8 54 Z"
        fill="url(#neon-sheet)"/>
  <path d="M45 53 L40 48 C33 52 29 46 22 49 C16 51 12 47 8 54"
        fill="none" stroke="#cfeaf7" stroke-width="1.3" stroke-linejoin="round" opacity=".55"/>
  <path d="M7 4 C21 0 36 2 45 8" fill="none" stroke="#040a0f" stroke-width="1.8" opacity=".75"/>
  <path d="M5 55 L7 4" fill="none" stroke="#02070b" stroke-width="3.4" opacity=".85"/>
  <path d="M9.6 5 L7.6 54" fill="none" stroke="#bcd6e8" stroke-width="1.4" opacity=".42"/>
  <path d="M45 8 C48 21 48 39 45 53" fill="none" stroke="url(#neon-bead)"
        stroke-width="6.4" stroke-linecap="round"/>
  <path d="M43.4 11 C46 21 46 38 43.6 49.4" fill="none" stroke="#ffffff"
        stroke-width="1.7" stroke-linecap="round" opacity=".88"/>
  <path d="M26 2.6 C28.6 20 28.4 38 26.2 51" fill="none" stroke="#e6f6ff"
        stroke-width="2.6" stroke-linecap="round" opacity=".3"/>
</svg>`;
    return `
<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <defs>
    <linearGradient id="neon-sheet" x1="0" y1="0" x2="1" y2=".16">
      <stop offset="0" stop-color="#0a1218"/>
      <stop offset=".38" stop-color="#1a2630"/>
      <stop offset=".56" stop-color="#57697a"/>
      <stop offset=".63" stop-color="#dcefff"/>
      <stop offset=".71" stop-color="#2f3d48"/>
      <stop offset="1" stop-color="#070e13"/>
    </linearGradient>
    <linearGradient id="neon-bead" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="51" y2="0">
      <stop offset="0" stop-color="#080e13"/>
      <stop offset=".42" stop-color="#e6f5ff"/>
      <stop offset="1" stop-color="#141d25"/>
    </linearGradient>
  </defs>
</svg>
<div class="neon-spill"></div>
<div class="neon-beam"></div>
<div class="neon-gap" style="top:calc(var(--top) - var(--cell)*${oT});height:calc(var(--cell)*${r3(1 + oT + oB)})"></div>` + panel("t", hT, `calc(var(--top) - var(--cell)*${hT})`)
      + panel("b", hB, "calc(var(--top) + var(--cell))")
      + `<div class="neon-out" style="--oh:${oh}"></div>`;
  },

  sprat(len, hero){
    const w = len * 100;
    const id = "neon-" + (hero ? "h" : "n") + len;
    const r = n => Math.round(n * 10) / 10;
    // head and tail are FIXED in user units; only the middle stretches — so a
    // 3-cell sprat reads as longer, never as bigger.
    const x0 = 24, x1 = w - 5, L = x1 - x0, mx = r(x0 + L * 0.38);
    const P = p => r(x0 + L * p);

    const C = hero
      ? { top:"#fff3fb", mid:"#ff4fb8", low:"#e2118f", deep:"#7d0757",
          rim:"#ffffff", fin:"#ff7ccd", finDeep:"#a20d78", gill:"#ffd9f2",
          sclera:"#fff2fb", iris:"#ff3fae", warm:"#fff0a8" }
      // the ordinary sprat is a CLOSED shape, not an edge: every stop here,
      // including the darkest belly and the tail fan, sits above the brine.
      : { top:"#6fb8ca", mid:"#1f5567", low:"#174350", deep:"#153a47",
          rim:"#b4faff", fin:"#2b6274", finDeep:"#1a4453", gill:"#7fe0f2",
          warm:"#ffb567" };
    const ink = hero ? "#3d0129" : "#03131b";
    const sclera = hero ? "#fff2fb" : "#e2f8ff";
    const iris = hero ? "#ff3fae" : "#2f7f95";

    // blunt caudal peduncle: the body ends in a waist, not a taper
    const body =
      `M ${x0} 38 C ${P(.05)} 22 ${P(.20)} 9 ${mx} 8.5` +
      ` C ${P(.60)} 7.6 ${r(x1-56)} 19 ${x1} 51`;

    // belly bounce: its lower edge IS the body's own ventral curve, so warm
    // light can never leak outside the silhouette
    const vent =
      ` C ${r(x1-56)} 83 ${P(.60)} 93.4 ${mx} 92.5` +
      ` C ${P(.20)} 92 ${P(.05)} 79 ${x0} 63`;
    const belly =
      `M ${x1} 51` + vent +
      ` L ${x0+3} 57 C ${P(.11)} 76 ${P(.34)} 84 ${mx} 84.5` +
      ` C ${P(.60)} 85 ${r(x1-54)} 76 ${x1} 51 Z`;

    // HERO: fan tucked 16 units under the body. She is lit from inside and
    // sits on her own glow, so a tucked fan still reads as hers.
    const tail = `M ${x0+16} 50 L 3 5 Q ${x0+4} 50 3 95 Z`;

    // ORDINARY SPRAT: the fan is not a separate shape tucked under the body,
    // it is the far end of ONE closed silhouette — body, peduncle and fork in a
    // single outline. Tucked-and-separately-outlined read as a detached lens
    // floating in the seam between two fish; this cannot.
    // The fork is deliberately narrower than the body and deeply notched: a fan
    // as tall as the body made two tails meeting end to end read as one fat
    // lozenge lying across the seam, which is the exact confusion to avoid.
    const fan = `L 4 86 Q ${x0+9} 50 4 14 Z`;                // vent-end → fork
    const fanFill = `M ${x0} 38 L 4 14 Q ${x0+9} 50 4 86 L ${x0} 63 Z`;
    const sil = hero ? `${body}${vent} Z` : `${body}${vent} ${fan}`;

    // dorsal + anal fins, unchanged and still drawn under the body. Tried
    // moving them on top so the dark moat would stop eating them: at 38px they
    // came back as arcs INSIDE the fish that read as scratches, which is worse
    // than a clean closed sprat. Left where they were.
    const fy = 0, ay = 100;
    const fins =
      `<path d="M ${r(mx-26)} 17 C ${r(mx-12)} ${fy} ${r(mx+8)} ${fy+1} ${r(mx+32)} 15 Z" fill="url(#${id}-f)"/>` +
      `<path d="M ${r(mx-26)} 17 C ${r(mx-12)} ${fy} ${r(mx+8)} ${fy+1} ${r(mx+32)} 15" fill="none"` +
      ` stroke="${C.rim}" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>` +
      `<path d="M ${r(mx+3)} 84 C ${r(mx+16)} ${ay} ${r(mx+32)} ${ay-1} ${r(mx+45)} 85 Z" fill="url(#${id}-f)"/>` +
      `<path d="M ${r(mx+3)} 84 C ${r(mx+16)} ${ay} ${r(mx+32)} ${ay-1} ${r(mx+45)} 85" fill="none"` +
      ` stroke="${C.rim}" stroke-width="2.2" stroke-linecap="round" opacity=".36"/>`;

    // hero horn: a slender twisted spike off the forehead, tip up-and-forward.
    // 3:1 length-to-base, split light/shadow down its own axis so it reads as a
    // cone and not a party hat at 4px.
    const hx = r(x1 - 30), hy = -20;                                // tip
    const b1x = r(x1 - 66), b1y = 16, b2x = r(x1 - 48), b2y = 30;   // base, on the skull
    const axx = r((b1x + b2x) / 2), axy = r((b1y + b2y) / 2);       // base midpoint
    const lp = t => `${r(b1x + (hx - b1x) * t)} ${r(b1y + (hy - b1y) * t)}`;
    const ap = t => `${r(axx + (hx - axx) * t)} ${r(axy + (hy - axy) * t)}`;

    return (`
<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
<defs>
<linearGradient id="${id}-b" x2="0" y2="1">
<stop offset="0" stop-color="${C.top}"/><stop offset=".24" stop-color="${C.mid}"/>
<stop offset=".64" stop-color="${C.low}"/><stop offset="1" stop-color="${C.deep}"/>
</linearGradient>
<linearGradient id="${id}-r">
<stop offset="0" stop-color="${C.rim}" stop-opacity="0"/>
<stop offset=".24" stop-color="${C.rim}" stop-opacity=".95"/>
<stop offset="1" stop-color="${C.rim}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="${id}-f" x2="0" y2="1">
<stop offset="0" stop-color="${C.fin}"/><stop offset="1" stop-color="${C.finDeep}"/>
</linearGradient>
<linearGradient id="${id}-w" x2="0" y2="1">
<stop offset="${hero ? .68 : .42}" stop-color="${C.warm}" stop-opacity="0"/>
<stop offset="1" stop-color="${C.warm}" stop-opacity="${hero ? .3 : .27}"/>
</linearGradient>
${hero ? "" : `<linearGradient id="${id}-c" x2="0" y2="1">
<stop offset="0" stop-color="${C.rim}" stop-opacity=".95"/>
<stop offset=".55" stop-color="#8fe2f4" stop-opacity=".6"/>
<stop offset="1" stop-color="#dcab86" stop-opacity=".5"/>
</linearGradient>`}
<path id="${id}-bd" d="${sil}"/>
${hero ? `<radialGradient id="${id}-g">
<stop offset="0" stop-color="#ff8ad4" stop-opacity=".78"/>
<stop offset=".34" stop-color="#ff3fae" stop-opacity=".42"/>
<stop offset="1" stop-color="#d01f92" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-bl">
<stop offset="0" stop-color="#fff"/>
<stop offset=".2" stop-color="#fff0fb" stop-opacity=".76"/>
<stop offset="1" stop-color="#ff8ad8" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-hn" y1="1" x2=".4" y2="0">
<stop offset="0" stop-color="#ff86cf"/><stop offset=".45" stop-color="#ffdcf3"/>
<stop offset="1" stop-color="#fff"/></linearGradient>
<path id="${id}-s" d="M0-10 2-2 10 0 2 2 0 10-2 2-10 0-2-2Z"/>` : ""}
</defs>
${hero ? `<ellipse class="neon-pulse" cx="${r(w/2)}" cy="52" rx="${r(w*1.02)}" ry="136" fill="url(#${id}-g)"/>` : ""}
${hero ? `<path d="${tail}" fill="url(#${id}-f)"/>
<path d="M ${x0+15} 50 L 4 7" fill="none" stroke="${C.rim}"
 stroke-width="2.4" stroke-linecap="round" opacity=".45"/>` : ""}
${fins}
${hero ? `<use href="#${id}-bd" fill="url(#${id}-b)"/>
<use href="#${id}-bd" fill="url(#${id}-b)" stroke="#ffa6e0" stroke-width="3.4" opacity=".55"/>`
      // a dark moat, then the body, then a rim light that goes ALL the way
      // round. Two sprats lying end to end are two closed shapes with black
      // between them, never one long one.
      : `<use href="#${id}-bd" fill="none" stroke="#020b10" stroke-width="6.4"/>
<use href="#${id}-bd" fill="url(#${id}-b)"/>
<path d="${fanFill}" fill="url(#${id}-f)"/>
<path d="M ${x0-1} 44 L 9 22 M ${x0-1} 57 L 9 78" fill="none" stroke="${C.rim}"
 stroke-width="2" stroke-linecap="round" opacity=".3"/>
<use href="#${id}-bd" fill="none" stroke="url(#${id}-c)" stroke-width="3.4"/>`}
<path d="${belly}" fill="url(#${id}-w)"/>
<path d="M ${r(x1-70)} 59 C ${r(x1-56)} 82 ${r(x1-36)} 80 ${r(x1-28)} 65 Z" fill="${C.rim}" opacity="${hero ? .18 : .12}"/>
<path d="M ${x0+2} 40 C ${P(.06)} 23 ${P(.21)} 11.5 ${mx} 11 C ${P(.60)} 10.2 ${r(x1-54)} 21 ${r(x1-11)} 43"
 fill="none" stroke="url(#${id}-r)" stroke-width="5.6" stroke-linecap="round"/>
<path d="M ${P(.17)} 33.5 Q ${r(mx+L*0.09)} 23 ${P(.76)} 29.5 Q ${r(mx+L*0.09)} 27 ${P(.17)} 33.5 Z"
 fill="url(#${id}-r)" opacity="${hero ? .62 : .34}"/>
<path d="M ${r(x1-60)} 24 C ${r(x1-68)} 43 ${r(x1-68)} 59 ${r(x1-57)} 75" fill="none"
 stroke="${C.gill}" stroke-width="2.6" opacity=".26"/>
${hero ? `<g>
<circle cx="${hx}" cy="${hy}" r="36" fill="url(#${id}-bl)"/>
<path d="M ${b1x} ${b1y} L ${hx} ${hy} L ${b2x} ${b2y} Z" fill="url(#${id}-hn)"/>
<path d="M ${axx} ${axy} L ${hx} ${hy} L ${b2x} ${b2y} Z" fill="#c00f79" opacity=".5"/>
<path d="M ${lp(.26)} L ${ap(.20)} M ${lp(.55)} L ${ap(.50)}" fill="none"
 stroke="#d70f92" stroke-width="2.1" stroke-linecap="round" opacity=".45"/>
<path d="M ${b1x} ${b1y} L ${hx} ${hy}" fill="none" stroke="#ffffff"
 stroke-width="3" stroke-linecap="round" opacity=".95"/>
<path d="M ${hx} ${hy-17.6} l 3 14.6 15 3 -15 3 -3 15 -3 -15 -15 -3 15 -3 Z" fill="#ffffff"/>
</g>
<g fill="#ffffff">
<use href="#${id}-s" transform="translate(${P(.15)} 24) scale(.8)" opacity=".95"/>
<use href="#${id}-s" transform="translate(${P(.44)} 95) scale(.6)" opacity=".85"/>
<use href="#${id}-s" transform="translate(${r(x1-8)} 27) scale(.55)" opacity=".9"/>
<use href="#${id}-s" transform="translate(${r(mx+L*0.32)} 4) scale(.62)" opacity=".9"/>
</g>` : ""}
<circle cx="${r(x1-42)}" cy="41" r="15" fill="${sclera}"/>
<circle cx="${r(x1-42)}" cy="41" r="15" fill="none" stroke="${iris}" stroke-width="2.6" opacity=".5"/>
<g class="eye">
<circle cx="${r(x1-40.8)}" cy="41.6" r="7.6" fill="${ink}"/>
<circle cx="${r(x1-37.4)}" cy="38.2" r="3" fill="#ffffff"/>
</g>
<path d="M ${r(x1-1)} 54 Q ${r(x1-14)} ${hero ? 65 : 68} ${r(x1-(hero?26:30))} ${hero ? 62 : 64}"
 fill="none" stroke="${ink}" stroke-width="${hero ? 2.6 : 3}" stroke-linecap="round"
 opacity="${hero ? .5 : .75}"/>
</svg>`).replace(/\n\s*/g, " ").trim();
  }
};
