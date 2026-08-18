/* TIN LABEL 1936 — heritage Baltic sprat packaging.
   Deep sea-teal lacquer ground, gold engraving, one gilded sprat.

   This direction restyles the tin as well as the fish: aged-brass frame,
   dark lacquered teal "oil", hairline gold lane rules. Those live in
   .dz-deco .tin / .tin::before / .tin-inner / .grid i below and should be
   lifted straight into the real stylesheet if this direction wins. */
DESIGNS["deco"] = {
  name:  "Tin Label 1936",
  blurb: "sea-teal lacquer, gold engraving, one gilded sprat",

  css: `
  /* ---- the tin: aged brass frame, dark lacquered teal oil ---- */
  .dz-deco .tin{
    background:linear-gradient(145deg,#fbf1dc 0%,#cfb175 22%,#8b6c37 44%,#f0e0b3 58%,#a8874a 78%,#6a4f22 100%);
    box-shadow:0 14px 28px #4a351240, inset 0 1px 0 #fff8e6;
  }
  .dz-deco .tin::before{                  /* engraved double keyline in the rim */
    content:""; position:absolute; inset:4px; border-radius:16px;
    border:1.5px solid #5d4416aa; box-shadow:inset 0 0 0 1.5px #fbeec4bb;
    pointer-events:none;
  }
  .dz-deco .tin-inner{
    background:radial-gradient(130% 100% at 24% 6%, #1c6a70 0%, #115059 34%, #0a3941 68%, #05262d 100%);
    box-shadow:inset 0 3px 16px #00000075, inset 0 0 0 1px #d8bb7a4d;
  }
  .dz-deco .grid i{ background:#f0dca61c; }

  /* ---- the door: the rim punched clean out at the hero's row, and the
         strip that was there torn off and wound onto the key ---- */
  .dz-deco .mouth{                        /* the hole: no rim, the page beyond */
    position:absolute; left:calc(100% - 3px); top:var(--top);
    width:14px; height:var(--cell);
    background:linear-gradient(90deg,#01141a 0%,#04222a 30%,#0b2b2c 44%,#2e2712 50%,
                                      #f6e0a8 55%,#fffaee 58%,#fdf6e9 63%,#fdf6e9 100%);
    box-shadow:inset 0 2px 0 #fff6da, inset 0 -2px 0 #fff6da,
               inset 0 3.5px 0 #6b4d17, inset 0 -3.5px 0 #6b4d17,
               inset 0 5px 0 #a9853d99, inset 0 -5px 0 #a9853d99;
  }
  .dz-deco .wash{                         /* daylight coming in through the hole */
    position:absolute; left:calc(100% - var(--cell) * 1.3);
    top:calc(var(--top) - var(--cell) * 0.36); width:calc(var(--cell) * 1.3);
    height:calc(var(--cell) * 1.72);
    clip-path:polygon(100% 32%, 100% 68%, 0% 97%, 0% 3%);
    background:linear-gradient(270deg,#ffe9b278 0%,#ffdf9c26 26%,#ffdf9c00 66%);
  }
  .dz-deco .lid{                          /* the torn strip, rolled onto the key */
    --s: clamp(30px, var(--cell), 42px);
    position:absolute; left:calc(100% - 1px);
    top:calc(var(--top) - var(--s) * 1.2);
    width:calc(var(--s) * 1.34); height:calc(var(--s) * 1.2); overflow:visible;
  }
  .dz-deco .lid.dn{                       /* hero on row 0: roll it the other way */
    top:calc(var(--top) + var(--cell)); transform:scaleY(-1);
  }
  .dz-deco .lid svg{ width:100%; height:100%; display:block; overflow:visible }

  /* ---- the hero's foil gleam: her one animation, no filters ---- */
  .dz-deco .gleam{ animation:deco-gleam 6s linear infinite; animation-delay:-1.9s }
  @keyframes deco-gleam{
    0%,10%  { transform:translateX(-90px); opacity:0 }
    16%     { opacity:1 }
    64%     { opacity:1 }
    70%,100%{ transform:translateX(var(--gx,360px)); opacity:0 }
  }
  @media (prefers-reduced-motion: reduce){
    .dz-deco .gleam{ animation:none; transform:translateX(45%); opacity:.5 }
  }`,

  door(g){
    /* one strip of tin: torn out of the rim at the hero's row, run up the
       side and wound into a tight coil on the key's shaft. Turns just touch,
       so the dark outline shows between them and it reads as rolled metal. */
    const COIL = "M46 81 A34 34 0 0 1 12 47 A34 34 0 0 1 46 13"
      + " A31 31 0 0 1 77 47 A27 27 0 0 1 46 74"
      + " A23 23 0 0 1 23 47 A19 19 0 0 1 46 28 A15 15 0 0 1 61 47 A11 11 0 0 1 46 58 A7 7 0 0 1 39 47";
    const TAIL = "M54 68 C48 86 38 98 31 120 L3 120 C10 96 19 84 24 60 Z";
    const BOW  = "M114 27 L129 37 L129 58 L114 68 L99 58 L99 37 Z";
    const dn = g && g.row === 0 ? " dn" : "";
    return `
<div class="wash"></div>
<div class="mouth"></div>
<div class="lid${dn}"><svg viewBox="0 0 134 120" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="deco-brass" x1="0" y1="0" x2=".25" y2="1">
      <stop offset="0" stop-color="#fff9e8"/><stop offset=".22" stop-color="#f2daa6"/>
      <stop offset=".48" stop-color="#c69d45"/><stop offset=".7" stop-color="#8a6626"/>
      <stop offset=".88" stop-color="#e0c281"/><stop offset="1" stop-color="#7a5920"/>
    </linearGradient>
    <linearGradient id="deco-strip" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6dd"/><stop offset=".4" stop-color="#d6b263"/>
      <stop offset=".75" stop-color="#8b6829"/><stop offset="1" stop-color="#e6cd91"/>
    </linearGradient>
  </defs>
  <path d="${TAIL}" fill="url(#deco-strip)" stroke="#4a3410" stroke-width="3" stroke-linejoin="round"/>
  <path d="M25 59 C20 80 13 96 6 118" fill="none" stroke="#fff6de" stroke-width="2.6" opacity=".85"/>
  <rect x="40" y="40" width="72" height="15" rx="6" fill="#4a3410"/>
  <rect x="42" y="42" width="70" height="11" rx="4.5" fill="url(#deco-brass)"/>
  <path d="${BOW}" fill="none" stroke="#4a3410" stroke-width="16" stroke-linejoin="round"/>
  <path d="${BOW}" fill="none" stroke="url(#deco-brass)" stroke-width="11" stroke-linejoin="round"/>
  <circle cx="46" cy="47" r="42" fill="#63481a"/>
  <path d="${COIL}" fill="none" stroke="#4a3410" stroke-width="18" stroke-linecap="round"/>
  <path d="${COIL}" fill="none" stroke="url(#deco-brass)" stroke-width="13.5" stroke-linecap="round"/>
  <path d="${COIL}" fill="none" stroke="#fff8e4" stroke-width="2.2" stroke-linecap="round"
        opacity=".55" transform="translate(-2,-4)"/>
</svg></div>`;
  },

  sprat(len, hero){
    const w = len * 100, r = n => Math.round(n);
    const id = "deco-" + (hero ? "h" : "n") + len;
    const X = w - 5;      // snout tip — the head is a fixed size at both lengths,
    const S = w - 80;     // back peak      so a 3-cell sprat is a LONGER fish,
    const P = 46;         // peduncle       not a bigger one
    const L = S - P;

    const B = `M${X} 47C${X-14} 31 ${X-34} 20 ${X-58} 19C${r(S-L*.15)} 17 ${r(P+L*.35)} 24 ${P} 42`
            + `L${P} 58C${r(P+L*.35)} 76 ${r(S-L*.15)} 83 ${X-58} 81C${X-34} 80 ${X-14} 69 ${X} 53Z`;

    const d1=r(P+L*.34), d2=r(P+L*.74), dA=r(P+L*.34+L*.128), pv=r(P+L*.72);
    const a1=r(P+L*.12), a2=r(P+L*.46), aA=r(P+L*.12+L*.116);
    const TAIL = hero
      ? `M48 40L3 2L23 50L3 98L48 60Z`          // hero: deep-forked, her own silhouette
      : `M48 40L5 6Q27 50 5 94L48 60Z`;
    const DORS = `M${d2} 26L${dA} 11Q${r(d1+(dA-d1)*.35)} 20 ${d1} 30Z`;
    const ANAL = `M${a2} 74L${aA} 89Q${r(a1+(aA-a1)*.35)} 81 ${a1} 70Z`;
    const PELV = `M${pv} 74L${pv-5} 87Q${pv-10} 83 ${pv-16} 72Z`;
    const PECT = `M${X-46} 53C${X-56} 64 ${X-64} 73 ${X-74} 80C${X-75} 69 ${X-69} 60 ${X-43} 57Z`;
    const SMALL = DORS + ANAL + PELV;   // the three small fins as one subpathed d
    const fan = (x,y,p) => p.map(q => `M${x} ${y}L${q[0]} ${q[1]}`).join("");

    const gold = hero ? "#8a5510" : "#e8cd93";
    /* Fins are the length information, so they are lit like an engraver lights
       them: the membrane runs PALE at its outer margin — the exact contour that
       has to separate from the oil — and drops to body-teal where it meets the
       fish. The gradient is objectBoundingBox, so it rotates with the strip and
       the light stays on the outer edge in all four directions. */
    const finF = `url(#${id}-ft)`;               // the TAIL only — it carries length
    const finP = hero ? "#f4aab9" : "#2b7570";   // pectoral lies on the pale belly: stays mid
    const finM = hero ? "#f0a3b4" : "#2f7a74";   // dorsal/anal/pelvic: subordinate to the tail
    const finR = hero ? "#cf8394" : "#e9cf98";
    const finS = hero ? "#b06d78" : "#f6e2b4";   // the outer contour, and it carries weight

    const stops = hero
      ? `<stop offset="0" stop-color="#fff6d5"/><stop offset=".14" stop-color="#f9de8c"/>`
      + `<stop offset=".32" stop-color="#f1b62c"/><stop offset=".5" stop-color="#dd9508"/>`
      + `<stop offset=".66" stop-color="#efb936"/><stop offset=".84" stop-color="#f9dd8d"/>`
      + `<stop offset="1" stop-color="#b0720c"/>`
      : `<stop offset="0" stop-color="#0b333a"/><stop offset=".24" stop-color="#155258"/>`
      + `<stop offset=".5" stop-color="#22706c"/><stop offset=".74" stop-color="#3e9280"/>`
      + `<stop offset=".9" stop-color="#7fb08d"/><stop offset="1" stop-color="#bfcb92"/>`;

    const finStops = hero
      ? `<stop offset="0" stop-color="#ffe4ee"/><stop offset=".36" stop-color="#f9bccb"/>`
      + `<stop offset="1" stop-color="#e28ea6"/>`
      : `<stop offset="0" stop-color="#dbe8bf"/><stop offset=".26" stop-color="#9cc59e"/>`
      + `<stop offset=".56" stop-color="#3f8380"/><stop offset="1" stop-color="#1f5e66"/>`;

    const E = X - 40;     // eye centre

    return `<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true"`
+ ` stroke-linejoin="round" stroke-linecap="round"><defs>`
+ `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>`
+ `<linearGradient id="${id}-ft" x1="0" y1="0" x2="1" y2="0">${finStops}</linearGradient>`
+ `<pattern id="${id}-s" width="16" height="12" patternUnits="userSpaceOnUse">`
+ `<path d="M0 12Q8 2 16 12M-8 6Q0 -4 8 6M8 6Q16 -4 24 6" fill="none" stroke="${hero?"#a9720f":"#eddaab"}" stroke-width="1.25" opacity="${hero?.2:.55}"/></pattern>`
+ `<clipPath id="${id}-c"><path d="${B}"/></clipPath>`
+ `<clipPath id="${id}-f"><path d="${TAIL}"/><path d="${DORS}"/><path d="${ANAL}"/><path d="${PELV}"/><path d="${PECT}"/></clipPath>`
+ (hero ? `<linearGradient id="${id}-hn" x1="0" y1="1" x2=".35" y2="0">`
+ `<stop offset="0" stop-color="#ffd3df"/><stop offset=".45" stop-color="#fff9f0"/>`
+ `<stop offset="1" stop-color="#ffffff"/></linearGradient>`
+ `<linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="0">`
+ `<stop offset="0" stop-color="#fffdf0" stop-opacity="0"/><stop offset=".34" stop-color="#fffdf0" stop-opacity=".2"/>`
+ `<stop offset=".5" stop-color="#fffdf0" stop-opacity=".72"/><stop offset=".66" stop-color="#fffdf0" stop-opacity=".2"/>`
+ `<stop offset="1" stop-color="#fffdf0" stop-opacity="0"/></linearGradient>` : ``)
+ `</defs>`

/* The counter. The oil goes dark right behind every trailing fin, so the pale
   margin has something to be pale AGAINST wherever the tin's own gradient
   happens to put it. Widest behind the tail, which is the one that carries
   length; a hair behind the small fins, which only have to read as fins. */
+ `<path d="${SMALL}" fill="#03202a" stroke="#03202a" stroke-width="3.6"/>`
+ `<path d="${TAIL}" fill="#03202a" stroke="#03202a" stroke-width="5.4"/>`
+ `<path d="${SMALL}" fill="${finM}" stroke="${finS}" stroke-width="2.2"/>`
+ `<path d="${TAIL}" fill="${finF}" stroke="${finS}" stroke-width="2.8"/>`

+ `<path d="${B}" fill="url(#${id}-g)" stroke="${hero?"#7a4a0b":"#ebd29c"}" stroke-width="2.6"/>`

+ `<g clip-path="url(#${id}-c)">`
+ `<rect width="${w}" height="100" fill="url(#${id}-s)"/>`
+ `<path d="M${P+12} 60C${r(P+L*.4)} 80 ${S} 84 ${X-40} 72" fill="none" stroke="${hero?"#fff2cb":"#eef0d2"}" stroke-width="12" opacity="${hero?.22:.38}"/>`
+ `<path d="M${P+12} 46C${r((P+S)/2)} 39 ${S} 37 ${X-44} 39" fill="none" stroke="${gold}" stroke-width="1.8" stroke-dasharray="5 6" opacity=".6"/>`
+ (hero ? `<path class="gleam" style="--gx:${w+95}px" d="M0 -8L46 -8L24 108L-22 108Z" fill="url(#${id}-l)"/>` : ``)
+ `</g>`

+ `<path d="${PECT}" fill="${finP}" fill-opacity="${hero?.72:.94}" stroke="${hero?"#d295a3":gold}" stroke-width="${hero?1.2:1.5}"/>`
+ `<g clip-path="url(#${id}-f)" fill="none" stroke="${finR}" stroke-width="1.5" opacity=".92">`
+ fan(54,50,[[2,2],[4,20],[10,34],[2,98],[4,80],[10,66]])
+ fan(d1-2,36,[[dA,0],[r((dA+d2)/2),6],[d2,20]])
+ fan(a1-2,64,[[aA,100],[r((aA+a2)/2),94],[a2,80]])
+ fan(X-45,56,[[X-78,84],[X-72,76],[X-64,67]])
+ `</g>`

+ `<path d="M${X-42} 22C${X-56} 40 ${X-56} 60 ${X-42} 78" fill="none" stroke="${gold}" stroke-width="1.8" opacity=".75"/>`
+ `<path d="M${X-3} 51q-7 8 -19 7" fill="none" stroke="${gold}" stroke-width="2.3" opacity=".95"/>`

+ (hero
  ? `<path d="M${X-32} 29L${X-4} 2L${X-18} 34Z" fill="url(#${id}-hn)" stroke="#7a4a0b" stroke-width="1.8"/>`
  + `<g fill="none" stroke="#c26f80" stroke-width="1.5" opacity=".95">`
  + `<path d="M${X-25} 22L${X-15} 27"/><path d="M${X-18} 14L${X-10} 19"/><path d="M${X-12} 7L${X-6} 11"/></g>`
  + `<path d="M${X-29} 28L${X-6} 5" fill="none" stroke="#fffdf6" stroke-width="2.4" opacity=".95"/>` : ``)

+ `<circle cx="${E}" cy="40" r="11.8" fill="${hero?"#fff6df":"#f2e9cd"}" stroke="${hero?"#a9720f":"#c9a860"}" stroke-width="2"/>`
+ `<g class="eye">`
+ (hero
  ? `<polygon points="${E},33 ${E+6},36 ${E+6},44 ${E},47 ${E-6},44 ${E-6},36" fill="#e0546e"/>`
  + `<polygon points="${E},40 ${E},33 ${E-6},36" fill="#ffc6d3"/>`
  + `<polygon points="${E},40 ${E-6},36 ${E-6},44" fill="#f28ba1"/>`
  + `<polygon points="${E},40 ${E+6},36 ${E+6},44" fill="#c13f63"/>`
  + `<polygon points="${E},40 ${E+6},44 ${E},47" fill="#96214a"/>`
  + `<circle cx="${E-2.5}" cy="37" r="1.7" fill="#fff"/>`
  : `<circle cx="${E}" cy="40" r="6.4" fill="#bf8d33"/>`
  + `<circle cx="${E}" cy="40" r="4.2" fill="#0e2027"/>`
  + `<circle cx="${E-2.4}" cy="37.3" r="2" fill="#fff" opacity=".95"/>`)
+ `</g></svg>`;
  }
};
