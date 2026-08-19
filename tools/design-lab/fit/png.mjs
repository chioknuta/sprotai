/** Minimal PNG reader: 8-bit, non-interlaced, colour type 2 (RGB) or 6 (RGBA). */
import { inflateSync } from "node:zlib";
export function readPNG(buf){
  let p = 8, w = 0, h = 0, ct = 0, bd = 0, idat = [];
  while (p < buf.length){
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p+4, p+8);
    const data = buf.subarray(p+8, p+8+len);
    if (type === "IHDR"){ w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG"); }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bd !== 8 || (ct !== 2 && ct !== 6)) throw new Error("unsupported PNG bd="+bd+" ct="+ct);
  const ch = ct === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w*h*ch), stride = w*ch;
  let rp = 0;
  for (let y = 0; y < h; y++){
    const f = raw[rp++]; const row = out.subarray(y*stride, y*stride+stride);
    raw.copy(row, 0, rp, rp+stride); rp += stride;
    const prev = y ? out.subarray((y-1)*stride, y*stride) : null;
    for (let i = 0; i < stride; i++){
      const a = i >= ch ? row[i-ch] : 0, b = prev ? prev[i] : 0, c = (prev && i >= ch) ? prev[i-ch] : 0;
      let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a+b)>>1;
      else if (f === 4){ const pp = a+b-c, pa = Math.abs(pp-a), pb = Math.abs(pp-b), pc = Math.abs(pp-c);
        v += (pa<=pb && pa<=pc) ? a : (pb<=pc ? b : c); }
      row[i] = v & 255;
    }
  }
  return { w, h, ch, data: out };
}
