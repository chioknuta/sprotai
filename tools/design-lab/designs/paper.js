/* ŠPROTAI — direction: CUT PAPER
   Every fish is layered paper stock: body, smoked back, belly, gill plate,
   fins — each a separate cut piece with a pale cut edge (the paper's core)
   and a soft offset shadow onto the piece beneath. Matte stock: dusty blue,
   oatmeal, clay. The oil is a sheet of warm amber paper, creased into lanes.
   The hero is cut from holographic stock — but JEWEL holo, not pastel: deep
   saturated foil so she is darker and far more chromatic than the amber
   sheet, mounted on a thick cream mat so she carries her own bright halo.
   The door is a key-opened tin: a short length of lid stock laid down the
   right rim, sheared clean across her lane, both cut ends curled back and
   flicked out past the rim, and the missing cell peeled up off the tin and
   wound once round a brass winding key that stands at her own row. The cut
   between the two lips goes dark — the one deep value on the board, so the
   opening holds against the amber oil inside and the cream page outside —
   and the lifted piece carries a real cast shadow, which is what says this
   is up here and that is a hole down there.
   (Tin / oil / lane-crease restyling lives in `css` and is meant to be lifted
   into the real stylesheet if this direction wins.) */

(function () {

  /* ---------- paper stock ---------- */
  var BODY  = "#7f9cb7";   /* dusty blue     */
  var BACK  = "#4d6a86";   /* smoked back    */
  var HEAD  = "#a0bacd";   /* pale gill plate*/
  var FLUKE = "#6d8aa6";   /* tail stock     */
  var BELLY = "#ecdbb6";   /* oatmeal        */
  var CLAY  = "#cd8b68";   /* clay fins      */
  var CLAY2 = "#dc9d7b";   /* pale clay      */
  var EDGE  = "#fdf4e2";   /* the cut core of the paper */
  var INK   = "#3b2c20";

  function star(x, y, r) {
    var s = Math.round(r * 0.22 * 10) / 10;
    return "M " + x + " " + (y - r) +
      "Q" + (x + s) + " " + (y - s) + " " + (x + r) + " " + y +
      "Q" + (x + s) + " " + (y + s) + " " + x + " " + (y + r) +
      "Q" + (x - s) + " " + (y + s) + " " + (x - r) + " " + y +
      "Q" + (x - s) + " " + (y - s) + " " + x + " " + (y - r) + "Z";
  }

  /* a wound strip seen end-on: an archimedean spiral as a polyline */
  function coil(cx, cy, r0, r1, turns, a0) {
    var n = Math.round(turns * 14), p = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = a0 + t * turns * 6.2832, r = r0 + (r1 - r0) * t;
      p.push((cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r).toFixed(1));
    }
    return "M" + p.join("L");
  }

  DESIGNS["paper"] = {
    name: "Cut Paper",
    blurb: "layered paper stock, a jewel-foil hero",

    css: `
  /* --- the tin as cut paper: a grey stock mat over an amber paper sheet --- */
  .dz-paper .tin{
    border-radius:16px;
    background:linear-gradient(163deg,#c8d2dc,#b4c0cc 62%,#c2ccd6);
    box-shadow:
      inset 0 2px 0 #e2eaf1, inset 0 -3px 0 #9caab7,
      0 0 0 3px #fdf4e2,                 /* the mat's own cut core, all the way round */
      0 12px 22px rgba(150,108,58,.22);
  }
  .dz-paper .tin-inner{
    border-radius:7px;
    /* amber paper sheet, with a whisper of laid grain */
    background:
      repeating-linear-gradient(92deg, rgba(255,246,226,.03) 0 1px, rgba(0,0,0,0) 1px 5px),
      repeating-linear-gradient(2deg, rgba(120,70,20,.018) 0 1px, rgba(0,0,0,0) 1px 6px),
      #efb164;
    box-shadow:
      inset 0 4px 8px rgba(122,72,22,.22),
      inset 0 -2px 0 rgba(255,244,222,.30),
      0 0 0 2px rgba(255,252,243,.7);   /* the mat's cut core around the window */
  }
  /* lanes read as creases in the amber sheet, not printed lines */
  .dz-paper .grid i.h{height:2px;
    background:linear-gradient(180deg,rgba(122,70,20,.17),rgba(255,247,228,.46))}
  .dz-paper .grid i.v{width:2px;
    background:linear-gradient(90deg,rgba(122,70,20,.17),rgba(255,247,228,.46))}

  /* --- the door ---------------------------------------------------------
     Two flat layers, the way paper craft wants it.
     .prim  sits ON the tin: a short length of lid stock laid over the right
            rim, faded out at both ends so it is an EVENT at her row and not
            a rail down the side of the tin. One cell of it is missing: the
            two cut ends are bright curled lips, and the cut between them
            goes dark — the shadowed thickness of the opening. That dark is
            the one deep value on the board, so the hole holds against the
            amber oil on the inside AND the cream page on the outside.
     .plidwrap sits ABOVE the tin: the missing cell of lid, peeled up off
            the rim at her own row and wound once round a brass winding key,
            carrying a real cast shadow. The shadow is the whole argument —
            this piece is up here, so that hole is down there.             */
  .dz-paper .prim{
    position:absolute; left:calc(100% - var(--cell) * .45);
    top:calc(var(--top) - var(--cell) * 1.10);
    width:calc(var(--cell) * 1.40); height:calc(var(--cell) * 3.20);
    transform-origin:50% 50%;            /* = her row centre, so it can flip */
  }
  .dz-paper .plidwrap{
    position:absolute; left:calc(100% - var(--cell) * .45);
    top:calc(var(--top) - var(--cell) * 1.30);
    width:calc(var(--cell) * 1.40); height:calc(var(--cell) * 3.60);
    /* one soft shadow for the whole lifted piece — onto the lid, onto the oil,
       onto the page. Carried by the OUTER box so it stays cast down-and-right
       even on the rows where the assembly is mirrored. */
    filter:drop-shadow(2px 5px 4px rgba(98,56,14,.52));
  }
  .dz-paper .pflip{ width:100%; height:100%; transform-origin:50% 50% }
  .dz-paper .plid{
    width:100%; height:100%;
    transform-origin:32% 54%;            /* the hinge, at the torn lip */
    animation:paper-peel 6.5s ease-in-out infinite;
  }
  .dz-paper .prim svg, .dz-paper .plid svg{display:block; width:100%; height:100%; overflow:visible}
  @keyframes paper-peel{ 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-1.6deg)} }

  /* the hero's stock shifts hue the way holographic paper does when it turns */
  .dz-paper .holo{ animation:paper-holo 5s ease-in-out infinite alternate }
  @keyframes paper-holo{ from{filter:hue-rotate(-16deg)} to{filter:hue-rotate(16deg)} }

  @media (prefers-reduced-motion: reduce){
    .dz-paper .plid, .dz-paper .holo{ animation:none }
  }`,

    door: function (g) {
      /* The peeled tongue and its key stand a little under one cell clear of
         her lane, so on the top two rows there is no tin left to stand them
         on. Mirror the whole assembly about her row centre and it winds the
         other way instead — same drawing, and the lane it opens does not move. */
      var row  = g ? g.row : 2;
      var flip = row <= 1;
      var fs   = flip ? ' style="transform:scaleY(-1)"' : '';
      /* on the first and last rows there is no tin left on one side of her
         lane, so the far LENGTH of strip must not be drawn there — it would
         float off the top or bottom edge. Both torn lips are always drawn:
         they sit inside the tin's own 11px rim even on those rows, and an
         uncapped end of the cut reads as a black bite out of the corner. */
      var above = row >= 1, below = row <= 4;
      var lenB  = flip ? above : below;

      /* ---- .prim : the rim, and the cell of it that is missing -----------
         viewBox 140x320 · 100 units = one cell · the oil ends at x=45 · her
         lane is y 110..210. The laid-on lid strip runs x 40..76 — at 38px
         cells that is very nearly the tin's own 11px rim, at 56px it
         overhangs it a little, which is what a strip laid on top should do.
         It reaches less than a cell each way and fades out at both ends, so
         it is an event at her row and not a rail.
         The cut runs x 30..84 and stops there — about the thickness of the
         tin wall. Carried further out over the page it stops being a hole and
         becomes a tab, which is exactly how the last pass failed; drawn any
         narrower it loses the mass it needs to be spotted at 38px. */
      var prim =
        '<div class="prim"' + fs + '><svg viewBox="0 0 140 320" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs>' +
          /* light getting past the cut, onto the oil */
          '<linearGradient id="paper-glow" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#fff3d6" stop-opacity="0"/>' +
            '<stop offset="1" stop-color="#fffaec" stop-opacity=".62"/></linearGradient>' +
          /* the strip, fading out at its far end so it never becomes a rail */
          '<linearGradient id="paper-stkT" gradientUnits="userSpaceOnUse" x1="0" y1="16" x2="0" y2="106">' +
            '<stop offset="0" stop-color="#93a3b1" stop-opacity="0"/>' +
            '<stop offset=".6" stop-color="#8494a3" stop-opacity=".95"/>' +
            '<stop offset="1" stop-color="#6e7f8e" stop-opacity="1"/></linearGradient>' +
          '<linearGradient id="paper-stkB" gradientUnits="userSpaceOnUse" x1="0" y1="304" x2="0" y2="214">' +
            '<stop offset="0" stop-color="#93a3b1" stop-opacity="0"/>' +
            '<stop offset=".6" stop-color="#8494a3" stop-opacity=".95"/>' +
            '<stop offset="1" stop-color="#6e7f8e" stop-opacity="1"/></linearGradient>' +
          '<linearGradient id="paper-edgT" gradientUnits="userSpaceOnUse" x1="0" y1="16" x2="0" y2="106">' +
            '<stop offset="0" stop-color="#fdf4e2" stop-opacity="0"/>' +
            '<stop offset=".7" stop-color="#fdf4e2" stop-opacity="1"/></linearGradient>' +
          '<linearGradient id="paper-edgB" gradientUnits="userSpaceOnUse" x1="0" y1="304" x2="0" y2="214">' +
            '<stop offset="0" stop-color="#fdf4e2" stop-opacity="0"/>' +
            '<stop offset=".7" stop-color="#fdf4e2" stop-opacity="1"/></linearGradient>' +
          /* the cut itself: the shadowed thickness of the opening. This is the
             one deep value on the whole board, which is what lets it hold
             against amber on one side and cream on the other. */
          '<linearGradient id="paper-void" x1="0" y1="0" x2=".7" y2="1">' +
            '<stop offset="0" stop-color="#120c05"/><stop offset=".5" stop-color="#1d1409"/>' +
            '<stop offset="1" stop-color="#3a2911"/></linearGradient>' +
          /* daylight on the far side of the cut, thrown out onto the page */
          '<linearGradient id="paper-out" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#fffdf6" stop-opacity=".8"/>' +
            '<stop offset="1" stop-color="#fffdf6" stop-opacity="0"/></linearGradient>' +
          '<linearGradient id="paper-lipB" x1="0" y1="0" x2=".2" y2="1">' +
            '<stop offset="0" stop-color="#f8fbfd"/><stop offset=".45" stop-color="#d2dce6"/>' +
            '<stop offset="1" stop-color="#7c8c9a"/></linearGradient>' +
        '</defs>' +
        /* light getting past the cut: onto the oil on the inside … */
        '<path d="M2 114L45 114L45 206L2 206Z" fill="url(#paper-glow)"/>' +
        /* … and a little of it out past the rim */
        '<path d="M66 124L110 138L110 182L66 196Z" fill="url(#paper-out)"/>' +
        /* the length of lid above the cut */
        '<path d="M40 16L76 16L76 106L40 106Z" fill="url(#paper-stkT)"/>' +
        '<path d="M41.8 16L41.8 106" stroke="url(#paper-edgT)" stroke-width="3.4"/>' +
        /* the length below */
        (lenB ? '<path d="M40 304L76 304L76 214L40 214Z" fill="url(#paper-stkB)"/>' +
          '<path d="M41.8 304L41.8 214" stroke="url(#paper-edgB)" stroke-width="3.4"/>' : '') +
        /* the cut: one cell of that strip simply is not there. It stops where
           the tin wall stops — a dark shape that carries on out over the page
           is not a hole any more, it is a tab. */
        '<path d="M30 112L64 111C76 116 84 134 84 160C84 186 76 204 64 209L30 208Z" ' +
          'fill="url(#paper-void)"/>' +
        /* the cut core of the amber sheet, where the knife went through … */
        '<path d="M31.4 115L31.4 205" stroke="#fffaea" stroke-width="4.6" stroke-linecap="round"/>' +
        /* … and the far cut face, catching the daylight. Dark between two lit
           edges is a recess; dark with soft edges is a bar. */
        '<path d="M64 112C76 117 83 134 83 160C83 186 76 203 64 208" fill="none" ' +
          'stroke="#ffe9bb" stroke-width="5" stroke-linecap="round" opacity=".95"/>' +
        /* the lower cut end of the strip, curled back on itself and flicked
           out past the rim — the tin's own outline visibly broken */
        '<path d="M22 200L72 200C90 205 104 216 112 232C98 225 80 220 64 221L22 226Z" ' +
          'fill="url(#paper-lipB)" stroke="' + EDGE + '" stroke-width="3.4" paint-order="stroke" ' +
          'stroke-linejoin="round"/>' +
        '<path d="M26 205L68 205" stroke="#fffdf6" stroke-width="3" stroke-linecap="round" ' +
          'opacity=".9"/>' +
        '<path d="M24 227L64 222C81 221 99 227 112 234" fill="none" stroke="#6d5836" ' +
          'stroke-width="3.2" stroke-linecap="round" opacity=".5"/>' +
        '</svg></div>';

      /* ---- .plid : the cell of lid that came off ------------------------
         viewBox 140x360, sitting 20 units higher than .prim, so her lane is
         y 130..230 and the oil still ends at x=45. The tongue is hinged at
         the upper cut end AT HER ROW — the same piece of lid the hole was cut
         in — peeled up off the rim and wound once round the key. The roll
         stands a third of a cell clear of her lane, so the hardware points at
         her row and nothing solid sits in her way. */
      var plid =
        '<div class="plidwrap"><div class="pflip"' + fs + '><div class="plid">' +
        '<svg viewBox="0 0 140 360" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="paper-au" x1=".08" y1="0" x2=".92" y2="1">' +
            '<stop offset="0" stop-color="#ffe9b4"/><stop offset=".42" stop-color="#e5a63f"/>' +
            '<stop offset="1" stop-color="#a2611a"/></linearGradient>' +
          '<linearGradient id="paper-lidface" x1="0" y1="1" x2=".25" y2="0">' +
            '<stop offset="0" stop-color="#8b9aa7"/><stop offset=".55" stop-color="#c2cdd8"/>' +
            '<stop offset="1" stop-color="#e7eef4"/></linearGradient>' +
          '<radialGradient id="paper-roll" cx=".34" cy=".26" r=".92">' +
            '<stop offset="0" stop-color="#b8c5d1"/><stop offset=".55" stop-color="#6c7b88"/>' +
            '<stop offset="1" stop-color="#3b4751"/></radialGradient>' +
          '<linearGradient id="paper-lipT" x1="0" y1="1" x2="0" y2="0">' +
            '<stop offset="0" stop-color="#f6f9fc"/><stop offset=".42" stop-color="#d4dee7"/>' +
            '<stop offset="1" stop-color="#7f8f9d"/></linearGradient>' +
        '</defs>' +
        /* the peeled length, standing up off the torn lip */
        '<path d="M57 124L83 134L106 77L81 67Z" fill="url(#paper-lidface)" stroke="' + EDGE + '" ' +
          'stroke-width="4.4" paint-order="stroke" stroke-linejoin="round"/>' +
        /* the upper cut end it lifted off — the mirror of the lower one, so
           the two torn lips read as one cut across one strip */
        '<path d="M22 140L72 140C90 135 104 124 112 108C98 115 80 120 64 119L22 114Z" ' +
          'fill="url(#paper-lipT)" stroke="' + EDGE + '" stroke-width="3.4" paint-order="stroke" ' +
          'stroke-linejoin="round"/>' +
        '<path d="M26 135L68 135" stroke="#fffdf6" stroke-width="3" stroke-linecap="round" ' +
          'opacity=".9"/>' +
        '<path d="M24 141L72 141C90 136 105 125 113 109" fill="none" stroke="#6d5836" ' +
          'stroke-width="3.2" stroke-linecap="round" opacity=".45"/>' +
        /* the roll: that cell of lid, wound once round the shaft */
        '<circle cx="94" cy="68" r="22" fill="url(#paper-roll)" stroke="' + EDGE + '" stroke-width="4.4"/>' +
        '<path d="' + coil(94, 68, 18, 5, 1.7, 2.2) + '" fill="none" stroke="#39454f" ' +
          'stroke-width="4.6" stroke-linecap="round" opacity=".85"/>' +
        '<path d="' + coil(94, 68, 21, 8, 1.7, 2.2) + '" fill="none" stroke="#f0f6fb" ' +
          'stroke-width="3" stroke-linecap="round" opacity=".95"/>' +
        /* the key: brass stock, cream cut edge — shaft through the roll, bow
           leaning off it. Tilted, because a ring on a dead vertical shaft
           reads as a power button. (Flat fills on the shaft: an
           objectBoundingBox gradient on a straight stroke can have a
           zero-width box and silently render nothing.) */
        '<path d="M94 74L114 24" fill="none" stroke="' + EDGE + '" stroke-width="18" ' +
          'stroke-linecap="round"/>' +
        '<path d="M94 74L114 24" fill="none" stroke="#d5912c" stroke-width="12" ' +
          'stroke-linecap="round"/>' +
        '<path d="M91 69L106 30" fill="none" stroke="#ffe4a6" stroke-width="3.2" ' +
          'stroke-linecap="round" opacity=".85"/>' +
        '<ellipse cx="116" cy="17" rx="12" ry="16" transform="rotate(22 116 17)" fill="none" ' +
          'stroke="' + EDGE + '" stroke-width="15"/>' +
        '<ellipse cx="116" cy="17" rx="12" ry="16" transform="rotate(22 116 17)" fill="none" ' +
          'stroke="url(#paper-au)" stroke-width="8.5"/>' +
        '<path d="M107 8C110 2 117 -1 123 1" fill="none" stroke="#ffeec2" stroke-width="2.8" ' +
          'stroke-linecap="round" opacity=".9"/>' +
        '</svg></div></div></div>';

      return prim + plid;
    },

    sprat: function (len, hero) {
      var w = len * 100, T = 22, N = w - 5, M = Math.round((T + N) / 2);
      var id = "paper-" + (hero ? "h" : "n") + len + "-";

      /* one silhouette — head and tail are FIXED size, only the middle
         stretches, so a 3-cell fish is a longer fish, not a bigger one */
      /* the dorsal and anal are CUT INTO this same piece of paper — a fin laid on
         as its own piece always carries its own cream cut edge, which severs it
         from the body and litters the board with loose triangles */
      var body = "M" + T + " 52C" + (T + 7) + " 28 " + (T + 38) + " 15 " + (M - 24) + " 16" +
                 "L" + (M - 11) + " 3L" + (M - 5) + " 3L" + (M + 16) + " 17" +
                 "C" + (N - 58) + " 19 " + (N - 30) + " 25 " + N + " 46" +
                 "C" + (N - 30) + " 67 " + (N - 58) + " 84 " + (M + 13) + " 85" +
                 "L" + (M - 1) + " 94L" + (M - 7) + " 94L" + (M - 18) + " 86" +
                 "C" + (T + 38) + " 87 " + (T + 7) + " 76 " + T + " 52Z";

      /* swept sail fins, leading edge to the right */
      var pect = "M" + (N - 56) + " 65C" + (N - 46) + " 73 " + (N - 50) + " 85 " + (N - 64) + " 89" +
                 "C" + (N - 68) + " 79 " + (N - 64) + " 70 " + (N - 56) + " 65Z";
      var belly = "M" + (T + 32) + " 57C" + (M - 20) + " 62 " + (N - 70) + " 60 " + (N - 30) + " 48" +
                  "C" + (N - 54) + " 76 " + (M - 4) + " 84 " + (T + 32) + " 57Z";
      var back = "M" + (T + 14) + " 50C" + (T + 32) + " 23 " + M + " 18 " + (N - 28) + " 41" +
                 "C" + (M + 6) + " 38 " + (T + 36) + " 43 " + (T + 14) + " 50Z";
      var head = "M" + (N - 58) + " 23C" + (N - 34) + " 29 " + (N - 12) + " 36 " + (N - 1) + " 46" +
                 "C" + (N - 13) + " 58 " + (N - 34) + " 71 " + (N - 58) + " 80" +
                 "C" + (N - 72) + " 61 " + (N - 72) + " 42 " + (N - 58) + " 23Z";
      var tail = "M" + (T + 22) + " 52C" + (T - 2) + " 34 " + (T - 8) + " 21 6 11" +
                 "C12 31 14 44 14 52C14 60 12 73 6 93C" + (T - 9) + " 84 " + (T - 2) + " 70 " +
                 (T + 22) + " 52Z";
      var mouth = "M" + (N - 18) + " 49C" + (N - 12) + " 56 " + (N - 7) + " 56 " + (N - 4) + " 50" +
                  "C" + (N - 8) + " 53 " + (N - 13) + " 53 " + (N - 18) + " 49Z";

      var ex = N - 38, ey = 43;   /* eye centre */
      var SH = '<g transform="translate(2,3)" fill="#33261a" opacity=".17">';

      /* ---------------- the hero: jewel holographic stock ----------------
         Pastel foil on amber oil is the same VALUE as the oil, so at 38px she
         disappears. So: the foil is deep and saturated (her body is far darker
         and far more chromatic than the sheet), and she is mounted on a thick
         cream cut-paper mat, which gives her a bright halo no other fish has.
         Dark core + bright ring = she survives being small.               */
      if (hero) {
        var fan = "M" + (T + 22) + " 52C" + (T - 2) + " 34 " + (T - 6) + " 18 4 5" +
                  "C6 24 " + (T - 6) + " 32 " + (T - 2) + " 38" +
                  "C" + (T - 8) + " 40 0 46 0 52C0 58 " + (T - 8) + " 64 " + (T - 2) + " 66" +
                  "C" + (T - 6) + " 72 6 80 4 99C" + (T - 6) + " 86 " + (T - 2) + " 70 " +
                  (T + 22) + " 52Z";
        var crest = "M" + (M - 36) + " 25C" + (M - 32) + " 7 " + (M - 22) + " 6 " + (M - 19) + " 18" +
                    "C" + (M - 15) + " 4 " + (M - 4) + " 4 " + (M - 2) + " 16" +
                    "C" + (M + 4) + " 6 " + (M + 15) + " 9 " + (M + 18) + " 21Z";
        var horn = "M" + (N - 40) + " 29L" + (N - 19) + " -7L" + (N - 24) + " 33Z";
        var horn2 = "M" + (N - 19) + " -7L" + (N - 24) + " 33L" + (N - 20) + " 32Z";
        var hornb = "M" + (N - 37) + " 23L" + (N - 25) + " 25M" + (N - 33) + " 14L" +
                    (N - 23) + " 16M" + (N - 29) + " 5L" + (N - 21) + " 7";
        var seq = [[T + 46, 40], [T + 64, 66], [M - 14, 33], [M + 8, 63], [M + 30, 39], [N - 64, 61]];
        var stars = [[T + 15, 8, 8], [T + 2, 93, 6], [N - 2, 15, 7], [N - 26, 92, 7], [M + 44, 94, 5]];
        return '<svg class="art" viewBox="0 0 ' + w + ' 100" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="' + id + 'f" x1=".04" y1=".95" x2=".96" y2=".05">' +
              '<stop offset="0" stop-color="#12c1a3"/><stop offset=".2" stop-color="#1a86e6"/>' +
              '<stop offset=".4" stop-color="#7a3fdc"/><stop offset=".58" stop-color="#dc2189"/>' +
              '<stop offset=".76" stop-color="#ef5a2f"/><stop offset=".92" stop-color="#11b39c"/>' +
              '<stop offset="1" stop-color="#1c9ce0"/></linearGradient>' +
            '<linearGradient id="' + id + 'n" x1="0" y1="1" x2="1" y2="0">' +
              '<stop offset="0" stop-color="#ff2f9e"/><stop offset=".5" stop-color="#7b3fe8"/>' +
              '<stop offset="1" stop-color="#0fbcb2"/></linearGradient>' +
            '<radialGradient id="' + id + 's" cx=".34" cy=".28" r=".85">' +
              '<stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#ffe2f6"/>' +
              '<stop offset="1" stop-color="#a58cff"/></radialGradient>' +
            '<g id="' + id + 'g"><path d="' + fan + '"/><path d="' + crest + '"/>' +
              '<path d="' + body + '"/></g>' +
          '</defs>' +
          /* punched confetti, behind her */
          '<g fill="#fffdf2" stroke="#fff" stroke-width="2.4" paint-order="stroke">' +
            stars.map(function (s) { return '<path d="' + star(s[0], s[1], s[2]) + '"/>'; }).join("") +
          '</g>' +
          /* her shadow on the amber sheet, then the cream mount she is cut onto */
          '<use href="#' + id + 'g" transform="translate(3,7)" fill="#6d3f12" opacity=".3"/>' +
          '<use href="#' + id + 'g" fill="' + EDGE + '" stroke="' + EDGE + '" stroke-width="15" ' +
            'stroke-linejoin="round"/>' +
          '<g class="holo" stroke="#fffaf0" stroke-width="3.6" paint-order="stroke" stroke-linejoin="round">' +
            '<g fill="url(#' + id + 'n)"><path d="' + fan + '"/><path d="' + crest + '"/></g>' +
            '<path d="' + body + '" fill="url(#' + id + 'f)"/>' +
            '<g stroke="none">' +
              '<path d="M' + (T + 34) + ' 59C' + (M - 16) + ' 66 ' + (N - 66) + ' 64 ' + (N - 30) + ' 50' +
                'C' + (N - 52) + ' 82 ' + (M - 4) + ' 86 ' + (T + 34) + ' 59Z" fill="#fff8fc" opacity=".92"/>' +
              '<g fill="url(#' + id + 's)" stroke="#fff" stroke-width="1.3">' +
                seq.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6"/>'; }).join("") +
              '</g></g>' +
            '<path d="' + horn + '" fill="#fff0bd" stroke-width="4.5"/>' +
            '<path d="' + horn2 + '" fill="#efb162" stroke="none"/>' +
            '<path d="' + hornb + '" fill="none" stroke="#d18f36" stroke-width="2.2" ' +
              'stroke-linecap="round"/>' +
          '</g>' +
          '<circle cx="' + ex + '" cy="' + ey + '" r="14.6" fill="#fffdf6" stroke="#c0407e" stroke-width="2.2"/>' +
          '<g class="eye"><circle cx="' + (ex + 1) + '" cy="' + (ey + 0.5) + '" r="7.4" fill="' + INK + '"/>' +
            '<circle cx="' + (ex + 4) + '" cy="' + (ey - 3) + '" r="2.8" fill="#fff"/></g>' +
          '<g fill="none" stroke="' + INK + '" stroke-width="2.8" stroke-linecap="round" opacity=".9">' +
            '<path d="M' + (ex - 9) + ' 32q-3-4-2-7"/><path d="M' + (ex - 1) + ' 29q-1-4 1-7"/>' +
            '<path d="M' + (ex + 7) + ' 31q1-4 4-6"/></g>' +
          '<path d="' + mouth + '" fill="#c2255f"/>' +
          '</svg>';
      }

      /* ---------------- the shoal: matte stock ---------------- */
      return '<svg class="art" viewBox="0 0 ' + w + ' 100" preserveAspectRatio="none" aria-hidden="true">' +
        /* the whole cut-out, shadowed onto the amber sheet */
        '<g transform="translate(3,5)" fill="#8a5a24" opacity=".22"><path d="' + body + '"/></g>' +
        /* fin pieces, tucked under the body */
        '<path d="' + tail + '" fill="' + FLUKE + '" stroke="' + EDGE + '" stroke-width="4" ' +
          'paint-order="stroke" stroke-linejoin="round"/>' +
        /* body */
        '<path d="' + body + '" fill="' + BODY + '" stroke="' + EDGE + '" stroke-width="5" ' +
          'paint-order="stroke" stroke-linejoin="round"/>' +
        /* smoked back piece */
        SH + '<path d="' + back + '"/></g>' +
        '<path d="' + back + '" fill="' + BACK + '"/>' +
        /* belly piece */
        SH + '<path d="' + belly + '"/></g>' +
        '<path d="' + belly + '" fill="' + BELLY + '"/>' +
        /* pectoral */
        '<path d="' + pect + '" fill="' + CLAY2 + '" stroke="' + EDGE + '" stroke-width="3" paint-order="stroke"/>' +
        /* gill plate */
        SH + '<path d="' + head + '"/></g>' +
        '<path d="' + head + '" fill="' + HEAD + '" stroke="' + EDGE + '" stroke-width="3.4" paint-order="stroke"/>' +
        '<path d="M' + (N - 52) + ' 31C' + (N - 61) + ' 45 ' + (N - 61) + ' 58 ' + (N - 52) + ' 72" ' +
          'fill="none" stroke="' + CLAY + '" stroke-width="4" stroke-linecap="round" opacity=".9"/>' +
        /* the eye: a punched paper dot */
        '<circle cx="' + ex + '" cy="' + ey + '" r="14.4" fill="#fffdf6" stroke="#c9bba0" stroke-width="1.5"/>' +
        '<g class="eye"><circle cx="' + (ex + 1) + '" cy="' + (ey + 0.5) + '" r="7.2" fill="' + INK + '"/>' +
          '<circle cx="' + (ex + 4) + '" cy="' + (ey - 3) + '" r="2.7" fill="#fff"/></g>' +
        '<path d="' + mouth + '" fill="' + INK + '" opacity=".8"/>' +
        '</svg>';
    }
  };
})();
