/* The design that ships today — the control. */
DESIGNS["00-current"] = {
  name: "Current (shipping today)",
  blurb: "the control — what the game looks like right now",
  css: `
  .dz-00-current .notch{
    position:absolute; left:100%; width:11px; border-radius:0 4px 4px 0;
    top:calc(var(--top) + 4px); height:calc(var(--cell) - 8px);
    background:linear-gradient(90deg,#dc9c44,#f8dfae);
  }
  .dz-00-current .notch::after{
    content:""; position:absolute; right:-8px; top:50%; transform:translateY(-50%);
    border:6px solid transparent; border-left-color:#e8834a88;
  }`,
  door(){ return `<div class="notch"></div>`; },
  sprat(len, hero){
    const w = len * 100;
    const body  = hero ? ["#ffc7d2","#f2657f","#d64460"] : ["#dcebf3","#98bed5","#6e96b0"];
    const belly = hero ? "#fff2f4" : "#f8f3e6";
    const fin   = hero ? "#e0546e" : "#7ea9c2";
    const id = "cur" + (hero ? "h" : "n") + len;
    return `
<svg class="art" viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${body[0]}"/>
    <stop offset=".45" stop-color="${body[1]}"/>
    <stop offset="1" stop-color="${body[2]}"/>
  </linearGradient></defs>
  <path fill="${fin}" d="M ${w*0.10} 50 L 5 19 Q ${w*0.055} 50 5 81 Z"/>
  <path fill="${fin}" d="M ${w*0.42} 25 Q ${w*0.50} 5 ${w*0.60} 23 Z"/>
  <path fill="${fin}" d="M ${w*0.45} 77 Q ${w*0.52} 95 ${w*0.62} 79 Z"/>
  <path fill="url(#g${id})"
        d="M ${w*0.08} 50
           C ${w*0.16} 17 ${w*0.55} 9  ${w*0.80} 23
           C ${w*0.93} 31 ${w-6} 41 ${w-6} 50
           C ${w-6} 59 ${w*0.93} 69 ${w*0.80} 77
           C ${w*0.55} 91 ${w*0.16} 83 ${w*0.08} 50 Z"/>
  <path fill="${belly}" opacity=".9"
        d="M ${w*0.18} 65 C ${w*0.36} 83 ${w*0.68} 81 ${w*0.86} 65
           C ${w*0.68} 73 ${w*0.36} 73 ${w*0.18} 65 Z"/>
  <ellipse cx="${w*0.69}" cy="59" rx="${w*0.05}" ry="6.5" fill="#ff9db0" opacity="${hero ? .8 : .45}"/>
  <g class="eye">
    <circle cx="${w*0.80}" cy="42" r="12" fill="#fff"/>
    <circle cx="${w*0.815}" cy="43" r="6.8" fill="#2f2318"/>
    <circle cx="${w*0.845}" cy="40" r="2.5" fill="#fff"/>
  </g>
  <path d="M ${w*0.855} 61 q ${w*0.035} 7 ${w*0.075} 1" fill="none"
        stroke="#2f2318" stroke-width="2.8" stroke-linecap="round" opacity=".75"/>
  ${hero ? `<path d="M ${w*0.28} 28 l 3.5 -8 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 Z" fill="#fff6b8"/>` : ""}
</svg>`;
  }
};
