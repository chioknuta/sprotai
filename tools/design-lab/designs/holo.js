/* HOLO FOIL — iridescent chrome sprats in warm amber oil.
   Everything lives inside an IIFE so no helper leaks into the shared page. */
(function () {
  "use strict";

  const R = n => Math.round(n * 10) / 10;

  /* ---- four-point sparkle ---- */
  function star(cx, cy, r, op) {
    const k = R(r * .18), x = R(cx), y = R(cy),
          u = R(cy - r), d = R(cy + r), l = R(cx - r), t = R(cx + r),
          xa = R(cx + k), xb = R(cx - k), ya = R(cy - k), yb = R(cy + k);
    return `<path d="M ${x} ${u}Q ${xa} ${ya} ${t} ${y}Q ${xa} ${yb} ${x} ${d}`
         + `Q ${xb} ${yb} ${l} ${y}Q ${xb} ${ya} ${x} ${u}Z" fill="#fff" opacity="${op}"/>`;
  }

  /* =================== THE DOOR =================== */
  /* Chrome is a value material, so the door is built out of value: two slabs
     of near-black sheared steel with a blazing prismatic slot between them,
     and a mirror winding key with the lid tongue running continuously from
     the cut into the roll.

     Split in two on purpose: the CUT through the rim is a div, because the
     rim is a fixed 11px at every cell size, while everything that scales with
     the board — the lips, the tongue, the roll, the key — is this SVG.
     viewBox 0 0 100 240 in a 1.5cell x 3.6cell box, so x and y share one
     scale: 1 cell = 66.67 units. The row is centred on y=140, the opening
     runs y 106.7..173.3, and x=0 is the outer edge of the oil. Content stops
     at x=56, i.e. 36px past the rim at a 56px cell and 21px at a 38px cell,
     inside the 44px budget. Her lane (y 107..173) holds nothing but light. */
  const CURL = `
<defs>
 <linearGradient id="holo-d-tube" x2="0" y2="1">
  <stop offset="0" stop-color="#eaf3fb"/><stop offset=".16" stop-color="#93a9bf"/>
  <stop offset=".32" stop-color="#42566b"/><stop offset=".47" stop-color="#fdfeff"/>
  <stop offset=".63" stop-color="#3b4f64"/><stop offset=".85" stop-color="#8ea4ba"/>
  <stop offset="1" stop-color="#dfe9f3"/>
 </linearGradient>
 <linearGradient id="holo-d-lid" x2=".28" y2="1">
  <stop offset="0" stop-color="#f4faff"/><stop offset=".2" stop-color="#b9cee2"/>
  <stop offset=".4" stop-color="#68e6d0"/><stop offset=".55" stop-color="#74acf2"/>
  <stop offset=".7" stop-color="#cd86e8"/><stop offset=".82" stop-color="#ff7fb2"/>
  <stop offset=".93" stop-color="#cfe0ee"/><stop offset="1" stop-color="#8299b0"/>
 </linearGradient>
 <linearGradient id="holo-d-cap" x2=".7" y2="1">
  <stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#7f94aa"/>
  <stop offset=".64" stop-color="#f3f8fd"/><stop offset="1" stop-color="#69809a"/>
 </linearGradient>
 <linearGradient id="holo-d-bow" x1="0" y1="0" x2=".8" y2="1">
  <stop offset="0" stop-color="#ffffff"/><stop offset=".26" stop-color="#8ba1b7"/>
  <stop offset=".44" stop-color="#fdfeff"/><stop offset=".66" stop-color="#3d5266"/>
  <stop offset=".84" stop-color="#d3e1ef"/><stop offset="1" stop-color="#6c8299"/>
 </linearGradient>
 <!-- the sheared sheet: near-black steel, darkest at the cut edge -->
 <linearGradient id="holo-d-lipT" x2=".16" y2="1">
  <stop offset="0" stop-color="#3d5c7c"/><stop offset=".22" stop-color="#15293c"/>
  <stop offset=".46" stop-color="#22394f"/><stop offset=".78" stop-color="#060d15"/>
  <stop offset="1" stop-color="#02070c"/>
 </linearGradient>
 <linearGradient id="holo-d-lipB" x2=".16" y2="1">
  <stop offset="0" stop-color="#02070c"/><stop offset=".22" stop-color="#060d15"/>
  <stop offset=".54" stop-color="#22394f"/><stop offset=".78" stop-color="#15293c"/>
  <stop offset="1" stop-color="#3d5c7c"/>
 </linearGradient>
 <!-- the peeled tongue, lit across its curve. Value first — black shadow
      side, blown white crest — with the foil film only as a narrow band, or
      it stops reading as metal and starts reading as ribbon. -->
 <linearGradient id="holo-d-strip" gradientUnits="userSpaceOnUse" x1="7" y1="86" x2="29" y2="94">
  <stop offset="0" stop-color="#08141f"/><stop offset=".16" stop-color="#7f97ad"/>
  <stop offset=".34" stop-color="#ffffff"/><stop offset=".48" stop-color="#dfeef8"/>
  <stop offset=".60" stop-color="#9ed3d6"/><stop offset=".70" stop-color="#b6a4d8"/>
  <stop offset=".80" stop-color="#8497ab"/><stop offset=".92" stop-color="#2a4055"/>
  <stop offset="1" stop-color="#071320"/>
 </linearGradient>
</defs>

<!-- a little light dispersing off the two cut edges onto the page -->
<path d="M 12 108 L 32 104.4 L 32 108.8 L 12 112.4 Z" fill="#3fe8ca" opacity=".36"/>
<path d="M 12 172 L 32 175.6 L 32 171.2 L 12 167.6 Z" fill="#ff77b6" opacity=".32"/>

<!-- THE TWO SHEARED LIPS. Near-black slabs laid across a bright chrome rim,
     with the blazing slot between them: the darkest and the brightest thing
     on the whole board, three millimetres apart. This is the shape that has
     to say "the wall is open here" at a 38px cell. -->
<path d="M -4 85.4 C 10 83.8 18 85 24 87.9 C 36 93.6 46 99 54 103 L 54 107 L -4 107 Z" fill="url(#holo-d-lipT)"/>
<path d="M -4 194.6 C 10 196.2 18 195 24 192.1 C 36 186.4 46 181 54 177 L 54 173 L -4 173 Z" fill="url(#holo-d-lipB)"/>
<path d="M -3 87.9 C 10 86.3 18 87.5 23.7 90.3 C 34 95.2 42 99.4 48 102.6" fill="none" stroke="#ffffff"
      stroke-opacity=".95" stroke-width="3" stroke-linecap="round"/>
<path d="M -3 192.1 C 10 193.7 18 192.5 23.7 189.7 C 34 184.8 42 180.6 48 177.4" fill="none" stroke="#ffffff"
      stroke-opacity=".9" stroke-width="2.8" stroke-linecap="round"/>

<!-- THE TONGUE. One continuous piece of lid: out of the cut, up the rim and
     under the roll, so the eye can trace hole -> strip -> coil. -->
<path d="M 11 107 C 11 96 14 85 24 71 L 38 78 C 29 91 25 98 26 107 Z" fill="url(#holo-d-strip)"/>
<path d="M 11.6 105 C 11.6 95 15 84.5 24.4 71.4" fill="none" stroke="#ffffff"
      stroke-opacity=".92" stroke-width="2.3" stroke-linecap="round"/>
<path d="M 37.4 78.6 C 28.6 91 25.6 97.6 25.4 105" fill="none" stroke="#050d16"
      stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>

<!-- the key's neck, straight up out of the roll (drawn first so the roll
     covers where it enters the wound sheet) -->
<path d="M 34 28 L 44.5 28 L 46.5 58 L 31.5 58 Z" fill="url(#holo-d-bow)"
      stroke="#08131f" stroke-opacity=".7" stroke-width="1.5"/>

<!-- THE ROLL: the lid wound up on the key's shaft, coil end to us -->
<rect x="8" y="44.5" width="28" height="31" rx="14" ry="15.5" fill="url(#holo-d-tube)"/>
<rect x="8" y="57.5" width="26" height="4.8" fill="url(#holo-d-lid)" opacity=".6"/>
<rect x="11" y="48.8" width="21" height="4.4" rx="2.2" fill="#fff" opacity=".72"/>
<rect x="8" y="68.6" width="26" height="2.4" fill="#08131f" opacity=".45"/>
<path d="M 14 45.1 A 15.5 15.5 0 0 0 14 74.9 L 8 73.5 A 15.5 15.5 0 0 1 8 46.5 Z" fill="#08131f" opacity=".3"/>
<circle cx="36" cy="60" r="15.5" fill="url(#holo-d-cap)"/>
<circle cx="36" cy="60" r="15.5" fill="none" stroke="#08131f" stroke-opacity=".72" stroke-width="1.7"/>
<path id="holo-d-coil" d="M 36 73.4 A 13.4 13.4 0 0 1 36 49.7 A 11.2 11.2 0 0 1 36 67.8 A 8.2 8.2 0 0 1 36 55.3 A 5.2 5.2 0 0 1 36 63.5"/>
<use href="#holo-d-coil" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3.1"/>
<use href="#holo-d-coil" fill="none" stroke="#2b4055" stroke-opacity=".85" stroke-width="1.5"/>

<!-- THE BOW: the winding key's oval handle, standing straight up off the
     roll in mirror chrome, outlined black so the counter still punches at a
     38px cell. A ring on a shaft is a thing only a tin has, and it is what
     makes the rest of this legible. -->
<g transform="rotate(-17 39 21)">
 <ellipse cx="39" cy="21" rx="12.4" ry="8.4" fill="none" stroke="#08131f" stroke-opacity=".92" stroke-width="9.4"/>
 <ellipse cx="39" cy="21" rx="12.4" ry="8.4" fill="none" stroke="url(#holo-d-bow)" stroke-width="6.4"/>
 <path d="M 29.6 16.4 A 12.4 8.4 0 0 1 39 12.6" fill="none" stroke="#ffffff"
       stroke-opacity=".95" stroke-width="1.9" stroke-linecap="round"/>
</g>`;

  /* =================== THE FISH =================== */
  function fish(len, hero) {
    const w = len * 100;
    const T = 52;                 // tail root  (fixed, so length reads as length)
    const L = w - 4;              // snout tip
    const HX = L - 62;            // head starts here (the head is a fixed size)
    const S = L - T;
    const id = (hero ? "h" : "n") + len;
    const ty = hero ? 8 : 12, by = hero ? 92 : 88;

    /* The wrist: the body does NOT taper to a point at the tail root. It ends
       blunt, 24 units tall, and the tail fin is cut to the same 24 units where
       they meet. A point-to-point join measured 2px at a 38px cell and the
       tail read as a loose chevron floating beside the fish. */
    const wt = 38, wb = 62;
    const body =
      `M ${T} ${wt}` +
      ` C ${R(T + .10 * S)} ${ty + 14} ${R(T + .28 * S)} ${ty} ${R(T + .48 * S)} ${ty}` +
      ` C ${R(T + .64 * S)} ${ty} ${HX - 4} ${ty + 2} ${HX + 8} ${ty + 12}` +
      ` C ${HX + 28} ${ty + 24} ${L - 10} 35 ${L} 50` +
      ` C ${L - 10} 65 ${HX + 28} ${by - 24} ${HX + 8} ${by - 12}` +
      ` C ${HX - 4} ${by - 2} ${R(T + .64 * S)} ${by} ${R(T + .48 * S)} ${by}` +
      ` C ${R(T + .28 * S)} ${by} ${R(T + .10 * S)} ${by - 14} ${T} ${wb} Z`;

    const tail = hero
      ? `M ${T + 3} 35 L 1 1 Q 25 26 31 50 Q 25 74 1 99 L ${T + 3} 65 Z`
      : `M ${T + 3} ${wt} L 4 6 Q 26 31 31 50 Q 26 69 4 94 L ${T + 3} ${wb} Z`;

    /* The hero's dorsal is pulled back and flattened. At full height it sat
       right beside the horn and the two merged into one white lump at 38px —
       she needs exactly one spike on her back, and it has to be the horn. */
    const d0 = R(T + (hero ? .30 : .40) * S), d1 = R(T + (hero ? .52 : .63) * S);
    const dh = hero ? -13 : -12;
    const a0 = R(T + .44 * S), a1 = R(T + .62 * S);
    const dors = `M ${d0} ${ty + 5} C ${R(d0 + .3 * (d1 - d0))} ${ty + dh} ${R(d1 - .3 * (d1 - d0))} ${ty + dh - 1} ${d1} ${ty + 3} Z`;
    const anal = `M ${a0} ${by - 4} C ${R(a0 + .32 * (a1 - a0))} ${by + 10} ${R(a1 - .3 * (a1 - a0))} ${by + 11} ${a1} ${by - 3} Z`;
    const pect = `M ${HX + 10} 55 C ${HX} 70 ${HX + 16} 78 ${HX + 30} 67 Z`;

    const ex = L - 42, ey = hero ? 44 : 43, er = hero ? 13 : 12;
    const min = s => s.replace(/\n\s*/g, "");

    if (!hero) return min(`
<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
<defs>
<path id="holo-s-${id}" d="${body}"/>
<clipPath id="holo-c-${id}"><use href="#holo-s-${id}"/></clipPath>
<linearGradient id="holo-cv-${id}" x2="0" y2="1">
<stop offset="0" stop-color="#eff9ff"/><stop offset=".18" stop-color="#bcdaf1"/>
<stop offset=".38" stop-color="#77a2c9"/>
<stop offset=".455" stop-color="#6b9ac4" stop-opacity="0"/>
<stop offset=".595" stop-color="#22507a" stop-opacity="0"/>
<stop offset=".66" stop-color="#1d4870"/><stop offset=".84" stop-color="#163b5d"/>
<stop offset="1" stop-color="#5c87a9"/></linearGradient>
<linearGradient id="holo-ir-${id}">
<stop offset="0" stop-color="#3fe4d8"/><stop offset=".3" stop-color="#49b6ff"/>
<stop offset=".58" stop-color="#8f86ff"/><stop offset=".82" stop-color="#c977e8"/>
<stop offset="1" stop-color="#4fdfd8"/></linearGradient>
<linearGradient id="holo-am-${id}" x2="0" y2="1">
<stop offset=".72" stop-color="#ffbf6a" stop-opacity="0"/>
<stop offset="1" stop-color="#ffdda2" stop-opacity=".9"/></linearGradient>
<linearGradient id="holo-fn-${id}" x2="0" y2="1">
<stop offset="0" stop-color="#a9c8e2"/><stop offset=".5" stop-color="#48719a"/>
<stop offset="1" stop-color="#7cbccd"/></linearGradient>
<radialGradient id="holo-sp-${id}">
<stop offset="0" stop-color="#fff" stop-opacity=".8"/>
<stop offset=".6" stop-color="#fff" stop-opacity=".35"/>
<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<path d="${tail}" fill="url(#holo-fn-${id})"/>
<path d="${dors}" fill="url(#holo-fn-${id})"/>
<path d="${anal}" fill="url(#holo-fn-${id})"/>
<use href="#holo-s-${id}" fill="#5a86ae"/>
<g clip-path="url(#holo-c-${id})">
<ellipse cx="${R(T + S * .52)}" cy="53" rx="${R(S * .58)}" ry="17" fill="url(#holo-ir-${id})" opacity=".92"/>
<use href="#holo-s-${id}" fill="url(#holo-cv-${id})"/>
<use href="#holo-s-${id}" fill="url(#holo-am-${id})"/>
<ellipse cx="${R(T + S * .44)}" cy="25" rx="${R(S * .36)}" ry="10" fill="url(#holo-sp-${id})"/>
<path d="${pect}" fill="#2f5c82" opacity=".75"/>
<path d="M ${HX + 2} ${ty + 4} C ${HX - 6} 40 ${HX - 6} 62 ${HX + 4} ${by - 4}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2.6"/>
<path d="M ${HX + 6} ${ty + 5} C ${HX - 2} 40 ${HX - 2} 62 ${HX + 8} ${by - 5}" fill="none" stroke="#07182a" stroke-opacity=".22" stroke-width="2.2"/>
<path d="M ${L - 23} 58 q 8 5.5 14 -1" fill="none" stroke="#07182a" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>
</g>
<circle cx="${ex}" cy="${ey}" r="${er}" fill="#f7fbff"/>
<circle cx="${ex}" cy="${ey}" r="${er}" fill="none" stroke="#20476d" stroke-opacity=".6" stroke-width="1.7"/>
<g class="eye">
<circle cx="${ex + 1}" cy="${ey + .5}" r="5.8" fill="#0b1c2b"/>
<circle cx="${ex + 3.5}" cy="${ey - 2.4}" r="2.2" fill="#fff"/>
<circle cx="${ex - 2}" cy="${ey + 3.5}" r="1.2" fill="#7ef0d4" opacity=".9"/>
</g>
</svg>`);

    /* ---------------- HERO: the rare card ---------------- */
    const hb = L - 46;                 // horn base centre: on the brow, over the eye
    return min(`
<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
<defs>
<path id="holo-s-${id}" d="${body}"/>
<clipPath id="holo-c-${id}"><use href="#holo-s-${id}"/></clipPath>
<linearGradient id="holo-fo-${id}">
<stop offset="0" stop-color="#ffdf6e"/><stop offset=".18" stop-color="#3aefbe"/>
<stop offset=".38" stop-color="#4fbaff"/><stop offset=".56" stop-color="#b566ff"/>
<stop offset=".74" stop-color="#ff2e90"/><stop offset="1" stop-color="#ff77b4"/>
</linearGradient>
<linearGradient id="holo-fv-${id}" x2="0" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity=".42"/>
<stop offset=".26" stop-color="#fff" stop-opacity="0"/>
<stop offset=".72" stop-color="#5d1f85" stop-opacity=".1"/>
<stop offset=".93" stop-color="#4d1272" stop-opacity=".3"/>
<stop offset="1" stop-color="#fff0cd" stop-opacity=".6"/></linearGradient>
<linearGradient id="holo-sw-${id}">
<stop offset="0" stop-color="#fff" stop-opacity="0"/>
<stop offset=".5" stop-color="#fff" stop-opacity=".9"/>
<stop offset=".7" stop-color="#b6fff0" stop-opacity=".4"/>
<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="holo-hf-${id}" x2="0" y2="1">
<stop offset="0" stop-color="#fffdff"/><stop offset=".55" stop-color="#ffe3f3"/>
<stop offset="1" stop-color="#bb98ea"/></linearGradient>
<linearGradient id="holo-hn-${id}" x2="1" y2=".35">
<stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff2fb"/>
<stop offset="1" stop-color="#dcc4ff"/></linearGradient>
</defs>
<use href="#holo-s-${id}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="7"/>
<path d="${tail}" fill="url(#holo-hf-${id})" stroke="#fff" stroke-opacity=".85" stroke-width="2.2"/>
<path d="${dors}" fill="url(#holo-hf-${id})" stroke="#fff" stroke-opacity=".85" stroke-width="2.2"/>
<path d="${anal}" fill="url(#holo-hf-${id})" stroke="#fff" stroke-opacity=".85" stroke-width="2.2"/>
<use href="#holo-s-${id}" fill="url(#holo-fo-${id})"/>
<g clip-path="url(#holo-c-${id})">
<use href="#holo-s-${id}" fill="url(#holo-fv-${id})"/>
<ellipse cx="${R(T + S * .42)}" cy="24" rx="${R(S * .34)}" ry="8" fill="#fff" opacity=".3"/>
<path d="${pect}" fill="#fff" opacity=".4"/>
<g class="holo-sweep" style="--hw:${w}">
<path d="M -34 -12 L 40 -12 L 6 112 L -68 112 Z" fill="url(#holo-sw-${id})"/>
</g>
${star(ex - 27, 60, 9.5, "1")}
${star(ex - 10, 71, 6, ".95")}
${star(ex - 41, 52, 4.6, ".9")}
<path d="M ${L - 23} 58 q 8 6 13 -1" fill="none" stroke="#7d1a52" stroke-opacity=".85" stroke-width="2.5" stroke-linecap="round"/>
</g>
<use href="#holo-s-${id}" fill="none" stroke="#fff" stroke-opacity=".92" stroke-width="2.2"/>
<path d="M ${hb - 10} 33 C ${hb - 8} 10 ${hb - 3} -1 ${hb + 4} -11 C ${hb + 10} 2 ${hb + 12} 13 ${hb + 12} 32 Z" fill="url(#holo-hn-${id})" stroke="#6f28bd" stroke-opacity=".8" stroke-width="2"/>
<path d="M ${hb - 8.5} 21 L ${hb + 1.5} 15.5 L ${hb + 11} 21 M ${hb - 5} 11 L ${hb + 2.5} 6.5 L ${hb + 9} 12" fill="none" stroke="#8e3fdb" stroke-opacity=".92" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="${ex}" cy="${ey}" r="${er}" fill="#fff"/>
<circle cx="${ex}" cy="${ey}" r="${er}" fill="none" stroke="#c04fb4" stroke-opacity=".8" stroke-width="1.8"/>
<g class="eye">
<circle cx="${ex + 1}" cy="${ey + .5}" r="6.2" fill="#331040"/>
<circle cx="${ex + 3.8}" cy="${ey - 2.6}" r="2.5" fill="#fff"/>
<circle cx="${ex - 2.2}" cy="${ey + 3.8}" r="1.4" fill="#8ff0e0" opacity=".95"/>
</g>
</svg>`);
  }

  DESIGNS["holo"] = {
    name: "Holo Foil",
    blurb: "iridescent chrome, one pearl horn",
    /* Tin restyle below is meant to be lifted to the real stylesheet:
       a harder mirror-chrome frame with a faint rainbow film over it, and a
       slightly deeper amber oil, so cold metal fish read against warm honey
       and a cream-bright hole in the rim actually punches. */
    css: `
.dz-holo .tin{
  background:
    linear-gradient(118deg, rgba(255,120,190,.13), rgba(140,190,255,.12) 20%,
      rgba(150,255,220,.11) 40%, rgba(255,225,140,.12) 60%,
      rgba(200,150,255,.13) 80%, rgba(160,220,255,.12)),
    linear-gradient(150deg,#fff,#b7c6da 14%,#596c85 32%,#f2f7fc 48%,
      #8194ab 64%,#dde7f1 82%,#5f7288);
  box-shadow:0 14px 30px #b98c4a33, inset 0 1px 0 #fff, inset 0 -1px 0 #fff88;
}
.dz-holo .tin-inner{
  background:
    radial-gradient(120% 90% at 24% 10%, #ffd68f 0%, rgba(255,214,143,0) 60%),
    linear-gradient(160deg,#efb35c,#d68f31 55%,#bc7823);
  box-shadow:inset 0 3px 14px #0000003d, inset 0 -2px 8px #fff1f;
}
.dz-holo .grid i{ background:#4a2a0822 }

/* --- the notch: the rim cut clean through, at her row.
       Fixed px, not cell-relative, because the rim is 11px at every size. --- */
.dz-holo .holo-mouth{           /* cold daylight falling on the oil inside */
  position:absolute; right:-3px;
  top:calc(var(--top) + var(--cell)*.5 - var(--cell)*.95);
  height:calc(var(--cell)*1.9); width:calc(var(--cell)*1.05);
  background:radial-gradient(closest-side ellipse at 100% 50%,
    rgba(255,255,255,.80) 0%, rgba(233,251,255,.46) 26%,
    rgba(201,240,255,.17) 54%, rgba(190,238,255,0) 82%);
}
.dz-holo .holo-gap{             /* the rim genuinely cut away, at fixed 11px.
                                   White-hot core, spectrum at the two shear
                                   edges: light through a hole in foil. */
  position:absolute; left:calc(100% - 3px); width:19px;
  top:var(--top); height:var(--cell);
  background:linear-gradient(180deg,
    #4fedd0 0%, #d9fff6 9%, #ffffff 26%, #ffffff 74%,
    #ffdbef 91%, #ff7fb8 100%);
  box-shadow:0 0 10px 3px rgba(255,255,255,.95), 0 0 26px 10px rgba(150,238,255,.45);
}
.dz-holo .holo-curl{
  position:absolute; left:100%; margin-left:-1px; overflow:visible;
  top:calc(var(--top) + var(--cell)*.5 - var(--cell)*2.1);
  width:calc(var(--cell)*1.5); height:calc(var(--cell)*3.6);
}
/* rows 0–1 have no metal above to roll: wind the lid downwards instead.
   Origin is her row's centre line, not the box's, so the cut stays put. */
.dz-holo .holo-curl.holo-flip{
  transform:scaleY(-1); transform-origin:50% calc(var(--cell)*2.1);
}
/* flip the slot's spectrum with it, so mint stays on the roll's side */
.dz-holo .holo-gap.holo-flip{ transform:scaleY(-1) }

/* --- the hero's light sweep: the shine crossing a holo card --- */
.dz-holo .holo-sweep{
  animation:holoSweep 3.6s cubic-bezier(.5,0,.5,1) infinite;
}
@keyframes holoSweep{
  0%   { transform:translateX(calc(var(--hw) * -0.30px)) }
  60%  { transform:translateX(calc(var(--hw) * 1.05px)) }
  100% { transform:translateX(calc(var(--hw) * 1.05px)) }
}
@media (prefers-reduced-motion: reduce){
  .dz-holo .holo-sweep{ animation:none; transform:translateX(calc(var(--hw) * .34px)) }
}`,
    door(g) {
      const row = (g && g.row) || 0, rows = (g && g.H) || 6;
      const flip = (row < 2 && rows - row - 1 >= 2) ? " holo-flip" : "";
      return `<div class="holo-mouth"></div><div class="holo-gap${flip}"></div>`
           + `<svg class="holo-curl${flip}" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">${CURL}</svg>`;
    },
    sprat(len, hero) { return fish(len, hero); }
  };
})();
