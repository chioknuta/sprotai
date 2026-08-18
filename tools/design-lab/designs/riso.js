/* ŠPROTAI — direction: RISO PRINT ------------------------------------------
   Screenprint. Three inks and no more: smoked slate blue, fluorescent pink,
   warm ochre. Flat, unblended, printed slightly out of register so a fringe of
   the ink underneath shows along one side of every shape. Shading is halftone
   dots, never gradients. Paper grain sits visibly in the oil.

   The hero carries a fourth ink — metallic gold — and she is the only thing on
   the board that does. Special edition.

   LIFT-TO-STYLESHEET NOTE: this direction restyles the tin. `.tin` (the metal
   frame) becomes a flat slate-blue ink block with an ochre misregistration
   offset; `.tin-inner` (the oil) becomes flat ochre with paper grain and a
   halftone vignette instead of a gradient; `.grid i` (the lanes) become
   dotted rules. All of that lives in `css` below and would move wholesale.
--------------------------------------------------------------------------- */
(function () {
  /* --- the ink drawer ---------------------------------------------------- */
  const SLATE   = "#33506b";  // smoked slate blue
  const SLATE_D = "#1e3348";  // slate, double hit
  const OCHRE   = "#eda23c";  // warm ochre — this is the oil
  const RUST    = "#e05a35";  // fluo pink printed OVER ochre — honest overprint
  const PINK    = "#ff489e";  // fluorescent pink
  const PINK_L  = "#ffb0d6";  // fluo pink at ~45%
  const GOLD    = "#bd8a24";  // metallic gold, full
  const GOLD_L  = "#f6dc90";  // metallic gold, thin
  const PAPER   = "#fdf6e9";

  const f = n => Math.round(n * 10) / 10;

  /* Halftone field: rows of dots whose radius ramps r0 → r1, clipped to an
     ellipse so nothing escapes the shape it shades. No clipPath, no <pattern>,
     no ids anywhere in this design — nothing that can collide in the DOM. */
  function ht(o) {
    let s = "";
    const stepX = o.cols > 1 ? (o.x1 - o.x0) / (o.cols - 1) : 0;
    for (let j = 0; j < o.rows; j++) {
      const t = o.rows > 1 ? j / (o.rows - 1) : 0;
      const y = o.y0 + (o.y1 - o.y0) * t;
      const r = o.r0 + (o.r1 - o.r0) * t;
      if (r < 0.4) continue;
      for (let i = 0; i < o.cols; i++) {
        const x = o.x0 + stepX * i + (j % 2 ? stepX / 2 : 0);
        if (o.rx) {
          const u = (x - o.cx) / o.rx, v = (y - o.cy) / o.ry;
          if (u * u + v * v > 1) continue;
        }
        s += `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="${f(r)}"/>`;
      }
    }
    return s;
  }

  /* Each body part is its own <path> so overlapping subpaths union instead of
     cancelling — one shared string, printed twice: once off-register, once on. */
  const plate = parts => parts.map(d => `<path d="${d}"/>`).join("");

  /* --- the ordinary sprat: slate ink, ochre halftone belly ---------------- */
  function plain(w, len) {
    const body =
      `M${f(w - 4)} 50C${f(w * .93)} 29 ${f(w * .85)} 18 ${f(w * .70)} 14` +
      `C${f(w * .50)} 9 ${f(w * .28)} 17 ${f(w * .16)} 39L${f(w * .16)} 61` +
      `C${f(w * .28)} 84 ${f(w * .50)} 92 ${f(w * .70)} 87` +
      `C${f(w * .85)} 83 ${f(w * .93)} 71 ${f(w - 4)} 50Z`;
    const tail = `M${f(w * .18)} 50L4 5L${f(w * .10)} 50L4 95Z`;
    const parts = [body, tail];
    if (len === 3) {
      parts.push(`M${f(w * .28)} 18L${f(w * .36)} 2L${f(w * .45)} 15Z`);
      parts.push(`M${f(w * .53)} 13L${f(w * .61)} 1L${f(w * .69)} 15Z`);
    } else {
      parts.push(`M${f(w * .36)} 17L${f(w * .46)} 1L${f(w * .58)} 16Z`);
    }
    parts.push(`M${f(w * .42)} 85L${f(w * .48)} 99L${f(w * .57)} 87Z`);
    const sil = plate(parts);

    const ex = w - (len === 3 ? 44 : 31);   // eye centre
    const ey = 40;

    return `<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
<g fill="${RUST}" transform="translate(-3 6)">${sil}</g>
<g fill="${SLATE}">${sil}</g>
<path fill="${OCHRE}" d="M${f(w * .19)} 58C${f(w * .30)} 84 ${f(w * .58)} 92 ${f(w * .82)} 74C${f(w * .58)} 82 ${f(w * .30)} 75 ${f(w * .19)} 58Z"/>
<g fill="${OCHRE}">${ht({ x0: w * .20, x1: w * .84, y0: 42, y1: 72, cols: len === 3 ? 10 : 7, rows: 4, r0: 1, r1: 3.6, cx: w * .50, cy: 50, rx: w * .34, ry: 38 })}</g>
<path fill="${SLATE_D}" d="M${f(w * .70)} 54L${f(w * .785)} 66L${f(w * .675)} 70Z"/>
<path fill="none" stroke="${SLATE_D}" stroke-width="3" stroke-linecap="round" d="M${f(w * .795)} 22C${f(w * .755)} 40 ${f(w * .755)} 60 ${f(w * .805)} 76"/>
<circle cx="${f(ex)}" cy="${ey}" r="15.5" fill="${PAPER}"/>
<circle cx="${f(ex)}" cy="${ey}" r="15.5" fill="none" stroke="${SLATE_D}" stroke-width="2.2"/>
<g class="eye"><circle cx="${f(ex)}" cy="${ey}" r="6.2" fill="${SLATE_D}"/><circle cx="${f(ex + 2.7)}" cy="${ey - 2.3}" r="2.4" fill="${PAPER}"/></g>
<path fill="none" stroke="${SLATE_D}" stroke-width="3" stroke-linecap="round" d="M${f(w - 20)} 61q9 7 15 -2"/>
</svg>`;
  }

  /* --- the hero: fluorescent pink under a metallic gold overprint --------- */
  function heroFish(w) {
    const body =
      `M${f(w - 3)} 50C${f(w * .93)} 27 ${f(w * .85)} 15 ${f(w * .70)} 11` +
      `C${f(w * .48)} 5 ${f(w * .26)} 15 ${f(w * .18)} 39L${f(w * .18)} 61` +
      `C${f(w * .26)} 86 ${f(w * .48)} 96 ${f(w * .70)} 90` +
      `C${f(w * .85)} 86 ${f(w * .93)} 73 ${f(w - 3)} 50Z`;
    /* deep swallowtail — nothing else in the tin has a tail like this */
    const tail = `M${f(w * .25)} 50L${f(w * .02)} -4L${f(w * .135)} 34L${f(w * .05)} 50L${f(w * .135)} 66L${f(w * .02)} 104Z`;
    /* scalloped mane where the others have one dorsal fin */
    const mane =
      `M${f(w * .24)} 34Q${f(w * .25)} 3 ${f(w * .36)} 15` +
      `Q${f(w * .42)} -6 ${f(w * .51)} 10Q${f(w * .59)} -8 ${f(w * .65)} 11` +
      `Q${f(w * .71)} -2 ${f(w * .755)} 19L${f(w * .70)} 34Z`;
    const anal = `M${f(w * .40)} 87L${f(w * .47)} 100L${f(w * .56)} 89Z`;
    const sil = plate([body, tail, mane, anal]);

    /* gold star burst — reaches past her outline on every side */
    const bx = w * .50, by = 50;
    let burst = "";
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + .37;
      const rx = k % 2 ? w * .38 : w * .58, ry = k % 2 ? 46 : 70;
      const p = (ang, s) => `${Math.round(bx + Math.cos(ang) * rx * s)} ${Math.round(by + Math.sin(ang) * ry * s)}`;
      burst += `M${p(a - .42, .34)}L${p(a, 1)}L${p(a + .42, .34)}Z`;
    }

    /* The horn. Anchored to the HEAD, not to w — it used to be built from
       fractions of the strip, so the 3-cell hero grew a horn a third longer
       than the 2-cell one's. Now both wear the same horn.
       It rises off her brow, sweeps forward and tapers to a real point; the
       ridges are chevrons that follow the taper, which reads as a twist. Three
       straight bands used to sit here and they read as a filter-tip. */
    const hb = [w - 56, 22], hp = [w - 11, -30];
    const hd = [hp[0] - hb[0], hp[1] - hb[1]];
    const hL = Math.hypot(hd[0], hd[1]);
    const hn = [-hd[1] / hL, hd[0] / hL];
    const axis = t => {
      const s = Math.sin(Math.PI * t) * -5;     // swept back, clear of her eye
      return [hb[0] + hd[0] * t + hn[0] * s, hb[1] + hd[1] * t + hn[1] * s];
    };
    const halfw = t => 9.5 * Math.pow(1 - t, .8);
    /* each side is one quadratic through the swept midpoint — sampling it as
       ten line segments per side cost 500 bytes and looked identical */
    const side = sgn => {
      const p0 = [hb[0] + hn[0] * 9.5 * sgn, hb[1] + hn[1] * 9.5 * sgn];
      const m = axis(.5), hw = halfw(.5) * sgn;
      return [p0, [2 * (m[0] + hn[0] * hw) - (p0[0] + hp[0]) / 2,
                   2 * (m[1] + hn[1] * hw) - (p0[1] + hp[1]) / 2]];
    };
    const [uL, qL] = side(1), [uR, qR] = side(-1);
    const horn = `M${f(uL[0])} ${f(uL[1])}Q${f(qL[0])} ${f(qL[1])} ${f(hp[0])} ${f(hp[1])}` +
      `Q${f(qR[0])} ${f(qR[1])} ${f(uR[0])} ${f(uR[1])}Z`;
    const chev = t => {                          // one wound ridge
      const a = axis(t), b = axis(t - .13), hw = halfw(t);
      return `M${f(a[0] + hn[0] * hw)} ${f(a[1] + hn[1] * hw)}` +
        `Q${f(b[0])} ${f(b[1])} ${f(a[0] - hn[0] * hw)} ${f(a[1] - hn[1] * hw)}`;
    };

    const ex = w - 30, ey = 39;

    return `<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
<path class="burst" d="${burst}" fill="${GOLD_L}" stroke="${SLATE_D}" stroke-width="2.6" stroke-linejoin="round"/>
<g fill="${SLATE}" transform="translate(-3 6)">${sil}</g>
<g fill="${PINK}">${sil}</g>
<path fill="${PINK_L}" d="M${f(w * .21)} 62C${f(w * .34)} 90 ${f(w * .62)} 96 ${f(w * .84)} 78C${f(w * .62)} 86 ${f(w * .34)} 80 ${f(w * .21)} 62Z"/>
<g fill="${GOLD}">${ht({ x0: w * .24, x1: w * .80, y0: 24, y1: 62, cols: 7, rows: 4, r0: 4, r1: 1.1, cx: w * .49, cy: 44, rx: w * .32, ry: 34 })}</g>
<path d="${horn}" fill="${SLATE}" transform="translate(-3 6)"/>
<path d="${horn}" fill="${GOLD_L}"/>
<g fill="none" stroke="${GOLD}" stroke-width="3.4" stroke-linecap="round">
<path d="${chev(.26)}"/><path d="${chev(.5)}"/><path d="${chev(.74)}"/></g>
<path fill="${GOLD_L}" d="M${f(w * .33)} 36l4-13 4 13 13 4-13 4-4 13-4-13-13-4Z"/>
<circle cx="${f(ex)}" cy="${ey}" r="16" fill="${PAPER}"/>
<circle cx="${f(ex)}" cy="${ey}" r="16" fill="none" stroke="${SLATE_D}" stroke-width="2.2"/>
<g class="eye"><circle cx="${f(ex)}" cy="${ey}" r="6.4" fill="${SLATE_D}"/><circle cx="${f(ex + 2.8)}" cy="${ey - 2.5}" r="2.7" fill="${GOLD_L}"/></g>
<path fill="none" stroke="${SLATE_D}" stroke-width="3" stroke-linecap="round" d="M${f(w - 19)} 60q9 7 15 -2"/>
</svg>`;
  }

  /* --- the door ----------------------------------------------------------
     The client asked for "an opened can thingy". So: the rim is sheared across
     her lane, and the strip of lid that used to be there is wound onto a key.

     THE HOLE IS EMPTY. `.cut` used to be a slab of flat fluorescent pink and it
     was wrong twice over. It read as a pink sticker on the rim — a hard-edged
     shape with something *in* it, never a way through — and it was printed in
     the hero's own ink, so on the winning move her body and the door fused into
     one pink mass at the exact frame the game exists to be screenshotted in.
     Now the aperture is the PAPER itself: the cream of the page runs straight
     through the rim, because that is literally what is behind a hole in a tin.
     The slate rim visibly stops and starts again and nothing at all sits in
     between. It is cut 1.16 cells tall against her 1.0, so there is open paper
     above and below her the whole way out — which is what proves she is going
     THROUGH the gap rather than sitting on it.

     The fluorescent pink did not go away, it moved to where it does work: it is
     the UNDERSIDE OF THE LID. The sheet peels back, so we see its inside face,
     and that face is the loudest ink in the drawer — the pink lip above the
     gap, the pink flange below it, the pink spiral of the roll. Pink now clamps
     the gap top and bottom instead of filling it: the same loud ink doing the
     announcing from outside the opening, with the way through left empty. Every
     pink face is held back behind a band of slate cut edge — 0.16 cell above,
     0.12 below — so there is always dark metal between her body and the lid.
     Her mane rises 0.08 cell above her lane and her tail drops 0.04 below it;
     both land inside those slate bands, never against the pink.

     `.lip` is the tin's own flange on the far side of the hole from the roll,
     sheared off square — one clean edge against one torn one, because two
     matching curled lips read as a pair of tongs.
     `.lid` is the wound strip: the cut edge of the lid lifts off the rim, curls
     up and winds into a flat spiral of banded sheet, with a printed winding key
     on its axis. A spiral is the one mark that cannot be read as anything but
     "this was rolled up", and a bow with a real hole in it is a thing only a
     tin has. The roll TOUCHES the lip and the sheet visibly runs out of the
     roll and into the rim, so the two are one object instead of two.

     Nothing sits in her path: she darts 1.4 cells out through open paper, and
     every piece of metal lives above or below her lane, never in it.

     Lid box: 1.00 x 1.15 cell over a 100 x 115 viewBox, so one unit is one
     hundredth of a cell in both axes and nothing distorts between a 38px phone
     cell and a 58px laptop one. x = 14 is the oil's right edge; the 11px rim
     ends near x = 43 on a 38px cell and x = 34 on a 56px one, so anything drawn
     between those two is on metal at every size. y = 105 is the top of her
     lane, so y = 97 is the top edge of the aperture.
     NOTHING IN THE ASSEMBLY MAY BE DRAWN LEFT OF x = 14. The lip used to start
     at x = 0 and the roll's outer arc reached back to x = 18, so on boards with
     a sprat parked in the last column of a neighbouring row the wedge landed on
     its face and the curl clipped its tail. Everything now starts at the oil's
     edge and works outward.
     On rows 0 and 1 there is no room above for the key, so the whole assembly
     hinges on the other lip and rolls down instead — see `.lid.down`.
     ------------------------------------------------------------------------ */
  const S = [62, 28], RS = 22;                 // the roll, seen down its axis

  /* The lid: one sheet of metal that leaves the rim as the thick sheared lip
     along the TOP OF THE HOLE, runs outward, and curls over itself into a roll
     at its far end. Drawing it in that order is the whole fix. A roll parked a
     row above an aperture is hardware on the edge of a board; a lip that caps
     the hole and then visibly winds up at the end is a tin that has been
     opened. `LIP` is the flat run — fat where it is still tin, thinning as it
     goes — and `wind` is the same sheet carrying on round. `LIP_FACE` is the
     peeled underside, printed pink and held 16 units back from the cut edge so
     a band of slate metal always separates the pink from the hole, and from
     her when she is in it. The lip is deliberately fat: drawn thin it read as a
     pinstripe at 38px, and the door needs a pink mass, not a pink line. */
  const LIP      = "M14 45L70 36L70 92L14 97Z";
  const LIP_FACE = "M14 45L70 36L70 76L14 81Z";

  /* 1.55 turns, no more. At a 38px cell the roll is 20px across; a third turn
     is finer than the screen and collapses into a smudge. The sheet is stroked
     three times — slate wide, pink inside it, slate hairline down the middle —
     so the roll is the same pink underside as the lip that feeds it, wound in
     visible layers. The strip's outer end stops in a hard step off the circle;
     a clean circular edge here reads as a bun. */
  let wind = "";
  for (let i = 0; i <= 60; i++) {
    const t = i / 60, th = Math.PI / 2 - t * Math.PI * 3.1, r = RS - t * 19;
    wind += (i ? "L" : "M") + f(S[0] + Math.cos(th) * r) + " " + f(S[1] + Math.sin(th) * r);
  }

  /* the winding key: shaft on the roll's axis, and a flat bow with a real hole
     in it. Drawn under the roll so the shaft runs behind it — the key goes
     THROUGH the coil, which is the entire point of a key, and a bow is a thing
     only a tin has. The bow is small and pulled in to 82,0 so that with the
     whole assembly shifted clear of the oil its far corner still lands 41px
     past the rim at a 56px cell — inside the ~44px the brief allows. */
  const KT = [72, 14], KB = [82, 0];
  const kDeg = f(Math.atan2(KB[1] - S[1], KB[0] - S[0]) * 180 / Math.PI);
  const key =
    `<path d="M${S[0]} ${S[1]}L${KT[0]} ${KT[1]}" stroke-width="11" stroke-linecap="round"/>` +
    `<rect x="${KB[0] - 16}" y="${KB[1] - 13}" width="32" height="26" rx="11"` +
    ` transform="rotate(${kDeg} ${KB[0]} ${KB[1]})" stroke-width="7.5"/>`;

  /* the whole assembly as one silhouette, for the off-register plate underneath */
  const lidPlate = ink =>
    `<g stroke="${ink}" fill="none" stroke-linejoin="round">${key}` +
    `<path d="${wind}" stroke-width="19"/><path d="${LIP}" fill="${ink}"/></g>`;

  DESIGNS["riso"] = {
    name: "Riso Print",
    blurb: "three inks, off-register, gold only on her",

    css: `
  /* ---- the tin, reprinted --------------------------------------------- */
  .dz-riso .tin{
    background:${SLATE};
    border-radius:7px;
    /* The misregistration slips DOWN-LEFT here, the same way every fish and the
       lid slip. It used to slip down-RIGHT, which laid a solid ochre slab over
       exactly the strip of page where the cut rim and the spilling oil have to
       read — ochre cut on ochre ground, invisible. The right rim is now clean
       paper, which is the stage the door needs. */
    box-shadow:-7px 8px 0 ${OCHRE}, 0 0 0 1px ${SLATE_D};
  }
  .dz-riso .tin-inner{
    border-radius:3px;
    background-color:${OCHRE};
    /* paper tooth: one period only. Two dot layers on the same 5px pitch (one dark, one
       paper, offset half a cell) read as tooth; two different pitches beat
       into a visible lattice, which is what pegboard looks like. */
    background-image:
      radial-gradient(rgba(112,58,14,.075) 34%, transparent 40%),
      radial-gradient(rgba(255,247,230,.11) 30%, transparent 36%);
    background-size:5px 5px, 5px 5px;
    background-position:0 0, 2.5px 2.5px;
    box-shadow:none;
  }
  /* halftone shade — the same 5px screen, thickening toward the rim */
  .dz-riso .tin-inner::before{
    content:""; position:absolute; inset:0; border-radius:3px; pointer-events:none;
    background-image:radial-gradient(rgba(106,52,10,.25) 40%, transparent 46%);
    background-size:5px 5px;
    -webkit-mask-image:radial-gradient(128% 112% at 50% 44%, transparent 20%, #000 100%);
    mask-image:radial-gradient(128% 112% at 50% 44%, transparent 20%, #000 100%);
  }
  /* Lane rules. They were pitched at the same weight as the oil screen and
     vanished into it completely — and the lanes are gameplay information, not
     decoration: they are what says a sprat slides one way only. */
  .dz-riso .grid i{background:none}
  .dz-riso .grid i.h{height:2px;
    background:repeating-linear-gradient(90deg,rgba(30,51,72,.42) 0 3px,transparent 3px 9px)}
  .dz-riso .grid i.v{width:2px;
    background:repeating-linear-gradient(180deg,rgba(30,51,72,.42) 0 3px,transparent 3px 9px)}

  /* ---- the cut ---------------------------------------------------------
     A hole, not a panel. It is nothing but PAPER — the same #fdf6e9 the page is
     printed on — laid over the 11px of rim so the metal stops, the page shows
     through, and the opening is genuinely empty. It starts at the oil's edge
     and is cut 0.08 cell proud of her lane at both ends, so a sliver of paper
     stays visible above and below her as she goes through.
     This used to be a slab of flat fluorescent pink. It was findable and it was
     a sticker, and it was her own ink, so on the winning move she dissolved
     into it. The pink is now the lid's peeled underside instead: it clamps the
     gap from above and below, announces it just as loudly, and is not something
     she can be confused with. */
  .dz-riso .cut{
    position:absolute;
    left:100%;
    top:calc(var(--top) - var(--cell)*0.08);
    width:34px;
    height:calc(var(--cell)*1.16);
    background:${PAPER};
  }
  /* the tin's own flange on the far side of the hole from the roll, sheared
     off square. The lid side of the hole is drawn in the svg, because that
     edge has to curl. The .lip.up modifier is the mirror, for the rows where the
     roll has to hinge downward instead. Starts at the oil's edge, never inside
     it: it used to reach 0.14 cell back into the tin and land on whatever sprat
     was parked in the last column of the next row. */
  .dz-riso .lip{
    position:absolute;
    left:100%;
    width:calc(var(--cell)*0.34 + 22px);
    height:calc(var(--cell)*0.52);
    top:calc(var(--top) + var(--cell)*1.08);
    background:${SLATE_D};
    clip-path:polygon(0 0,76% 0,100% 100%,0 100%);
  }
  .dz-riso .lip.up{top:calc(var(--top) - var(--cell)*0.60);
    clip-path:polygon(0 0,100% 0,76% 100%,0 100%)}
  /* the peeled underside of that flange, fluorescent pink, held 0.12 cell back
     from the sheared edge so a band of cut slate always sits between the pink
     and the hole — and therefore between the pink and her, when she is in it. */
  .dz-riso .lip.face{
    background:${PINK};
    height:calc(var(--cell)*0.40);
    top:calc(var(--top) + var(--cell)*1.20);
    clip-path:polygon(0 0,70% 0,100% 100%,0 100%);
  }
  .dz-riso .lip.face.up{top:calc(var(--top) - var(--cell)*0.60);
    clip-path:polygon(0 0,100% 0,70% 100%,0 100%)}
  /* the ochre plate, slipped down-left the way the tin and every fish slip. On
     the lip the fringe lands along the sheared edge itself, which is where it
     does work. */
  .dz-riso .lip.reg{background:${OCHRE}; transform:translate(-3px,5px)}

  /* the wound strip of lid, curling up out of her lane */
  .dz-riso .lid{
    position:absolute;
    left:calc(100% - var(--cell)*0.14);
    top:calc(var(--top) - var(--cell)*1.05);
    width:calc(var(--cell)*1.00); height:calc(var(--cell)*1.15);
  }
  /* on the top two rows there is no room above for the key, so the assembly
     hinges on the other lip and rolls down instead. Same drawing, flipped —
     and .lip.up moves the tin's flange across to match. */
  /* 0.90, not 1.00: the box runs 0.10 cell past her lane at the bottom, and
     scaleY flips about the box's own centre, so hinging it at a whole cell
     parks the sheared lip a tenth of a cell clear of the hole and opens a seam
     of un-cut rim between the two. */
  .dz-riso .lid.down{top:calc(var(--top) + var(--cell)*0.90); transform:scaleY(-1)}
  .dz-riso .lid svg{width:100%; height:100%; display:block; overflow:visible}

  /* The hero is the FIRST fish in the DOM, so she was painted underneath every
     other sprat — her horn, her tail and her whole star burst were being buried
     by whatever sat next to her. She is the one fish that has to be on top. */
  .dz-riso .fish.hero{z-index:2}

  /* ---- hero sparkle: the one animation on the board --------------------- */
  .dz-riso .burst{
    transform-box:fill-box; transform-origin:50% 50%;
    animation:riso-turn 22s linear infinite;
  }
  @keyframes riso-turn{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion:reduce){ .dz-riso .burst{animation:none} }
    `,

    door(g) {
      const down = g && g.row <= 1 ? " down" : "", up = down && " up";
      return `<div class="cut"></div><div class="lip${up} reg"></div><div class="lip${up}"></div><div class="lip face${up}"></div>
<div class="lid${down}"><svg viewBox="0 0 100 115" preserveAspectRatio="none" aria-hidden="true">
<g transform="translate(-3 5)">${lidPlate(OCHRE)}</g>
<path d="${LIP}" fill="${SLATE_D}"/>
<path d="${LIP_FACE}" fill="${PINK}"/>
<g fill="none" stroke="${SLATE_D}" stroke-linejoin="round">${key}</g>
<path d="${wind}" fill="none" stroke="${SLATE_D}" stroke-width="19"/>
<path d="${wind}" fill="none" stroke="${PINK}" stroke-width="14"/>
<path d="${wind}" fill="none" stroke="${SLATE_D}" stroke-width="3.6"/>
</svg></div>`;
    },

    sprat(len, hero) {
      const w = len * 100;
      return hero ? heroFish(w) : plain(w, len);
    }
  };
})();
