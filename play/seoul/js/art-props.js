"use strict";

(function(SX) {
  const A = SX.art, C = A.C, sh = A.shade, mix = A.mix, RP = A.ramp;
  const def = A.defProp;
  const rgba = (hex, a) => {
    const [r, g, b] = A.hexRgb(hex);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  };
  const DK = a => "rgba(10,12,20," + a + ")";
  const cut = (P, ...xy) => {
    for (let i = 0; i + 1 < xy.length; i += 2) P.x.clearRect(xy[i], xy[i + 1], 1, 1);
    return P;
  };
  function sbox(P, x, y, w, h, a) {
    a = a == null ? .34 : a;
    const c = DK((a * .5).toFixed(3));
    y -= 1;
    P.r(x + 1, y, w - 2, h, c).r(x, y + 1, w, h - 2, c).r(x + 2, y + 1, w - 4, h - 2, c);
    P.r(x + 2, y + h - 3, w - 4, 1, DK((a * .4).toFixed(3)));
    return P;
  }
  const step = (c1, c2, t) => t <= 0 ? c1 : t >= 1 ? c2 : mix(c1, c2, Math.round(t * 3) / 3);
  function vgrad(P, x, y, w, h, c1, c2, a, b) {
    a = a == null ? .45 : a;
    b = b == null ? .75 : b;
    const y0 = Math.round(h * a), y1 = Math.max(y0 + 1, Math.round(h * b));
    for (let k = 0; k < h; k++) P.r(x, y + k, w, 1, step(c1, c2, (k - y0 + .5) / (y1 - y0)));
    return P;
  }
  function hgrad(P, x, y, w, h, c1, c2, a, b) {
    a = a == null ? .45 : a;
    b = b == null ? .75 : b;
    const x0 = Math.round(w * a), x1 = Math.max(x0 + 1, Math.round(w * b));
    for (let k = 0; k < w; k++) P.r(x + k, y, 1, h, step(c1, c2, (k - x0 + .5) / (x1 - x0)));
    return P;
  }
  function box(P, x, y, w, t, f, hex, o) {
    o = o || {};
    const R = RP(hex);
    if (t > 0) {
      P.r(x, y, w, t, R[4]);
      if (t > 3) vgrad(P, x, y, w, Math.ceil(t / 2), R[3], R[4], .3, .9);
      P.r(x, y, w, 1, R[3]).r(x, y + t - 1, w, 1, R[5]).r(x, y, 1, t, R[5]).r(x + w - 1, y, 1, t, R[3]);
    }
    if (f > 0) {
      const fy = y + t;
      const fi = o.fi || 2;
      if (o.flat) P.r(x, fy, w, f, R[fi]); else vgrad(P, x, fy, w, f, R[fi], R[fi - 1], .55, .95);
      if (f > 3) P.r(x, fy, w, 1, o.lip ? R[fi - 1] : R[fi + 1]);
      P.r(x, fy, 1, f, R[fi + 1]).r(x + w - 1, fy, 1, f, R[fi - 1]);
      if (f > 4) P.r(x, fy + f - 1, w, 1, R[0]);
    }
    return P;
  }
  function post(P, x, y, w, h, hex) {
    const R = RP(hex);
    if (w <= 1) return P.r(x, y, 1, h, R[3]);
    P.r(x, y, w, h, R[2]).r(x, y, 1, h, R[4]);
    if (w > 2) P.r(x + 1, y, 1, h, R[3]);
    P.r(x + w - 1, y, 1, h, R[1]);
    return P;
  }
  function grain(P, x, y, w, h, hex, g, n) {
    const R = RP(hex);
    n = n || Math.round(w * h / 14);
    for (let k = 0; k < n; k++) {
      const yy = y + g.i(h), xx = x + g.i(w), l = 2 + g.i(Math.max(2, Math.min(12, w / 3)));
      P.r(xx, yy, Math.min(l, x + w - xx), 1, g.chance(.6) ? R[2] : R[4]);
    }
    if (w > 12 && g.chance(.5)) {
      const kx = x + 3 + g.i(w - 6), ky = y + g.i(h);
      P.p(kx, ky, R[1]).p(kx + 1, ky, R[2]);
    }
    return P;
  }
  function vgrain(P, x, y, w, h, hex, g, n) {
    const R = RP(hex);
    n = n || Math.round(w * h / 14);
    for (let k = 0; k < n; k++) {
      const xx = x + g.i(w), yy = y + g.i(h), l = 2 + g.i(Math.max(2, Math.min(10, h / 3)));
      P.r(xx, yy, 1, Math.min(l, y + h - yy), g.chance(.6) ? R[2] : R[4]);
    }
    return P;
  }
  function grime(P, x, y, w, h, g, n, col) {
    col = col || "rgba(40,30,18,0.16)";
    for (let k = 0; k < n; k++) {
      const xx = x + g.i(w), yy = y + g.i(h), rw = 1 + g.i(4), rh = 1 + g.i(2);
      P.r(xx, yy, Math.min(rw, x + w - xx), Math.min(rh, y + h - yy), col);
    }
    return P;
  }
  const RUST = [ "#7a4228", "#94532e", "#6a3620", "#a8683c" ];
  function rust(P, x, y, w, h, g, n) {
    for (let k = 0; k < n; k++) {
      let xx = x + g.i(w), yy = y + g.i(h);
      const m = 2 + g.i(5);
      for (let s = 0; s < m; s++) {
        if (xx >= x && xx < x + w && yy >= y && yy < y + h) P.p(xx, yy, RUST[g.i(4)]);
        xx += g.i(3) - 1;
        yy += g.i(3) - 1;
      }
    }
    return P;
  }
  function scratch(P, x, y, w, h, g, n, col) {
    for (let k = 0; k < n; k++) {
      const xx = x + g.i(w), yy = y + g.i(h), l = 2 + g.i(3);
      for (let s = 0; s < l; s++) if (xx + s < x + w && yy + (s >> 1) < y + h) P.p(xx + s, yy + (s >> 1), col);
    }
    return P;
  }
  function drip(P, x, y, l, col) {
    P.r(x, y, 1, l, col).p(x, y + l, col);
    return P;
  }
  function rivet(P, x, y, R) {
    P.p(x, y, R[5]).p(x + 1, y + 1, R[0]).p(x + 1, y, R[2]).p(x, y + 1, R[2]);
    return P;
  }
  function glass(P, x, y, w, h, o) {
    o = o || {};
    const base = o.col || "#2c4751", R = RP(base);
    P.r(x, y, w, h, base);
    vgrad(P, x, y, w, h, R[3], R[2], .4, .9);
    for (let k = -h; k < w; k += o.gap || 9) {
      for (let s = 0; s < h; s++) {
        const xx = x + k + s;
        if (xx >= x && xx < x + w) P.p(xx, y + h - 1 - s, R[4]);
        const x2 = xx + 2;
        if (o.wide !== false && x2 >= x && x2 < x + w) P.p(x2, y + h - 1 - s, R[5]);
      }
    }
    P.r(x, y, w, 1, R[5]);
    return P;
  }
  function polyf(P, pts, fn) {
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [], yc = y + .5;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (a[1] <= yc && b[1] > yc || b[1] <= yc && a[1] > yc) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
        if (xb > xa) P.r(xa, y, xb - xa, 1, fn(y));
      }
    }
    return P;
  }
  function crack(P, cx, cy, g, n, col) {
    for (let k = 0; k < n; k++) {
      const a = g.f() * Math.PI * 2, l = 3 + g.i(6);
      P.line(cx, cy, cx + Math.cos(a) * l, cy + Math.sin(a) * l, col);
    }
    return P;
  }
  function cons(P, t, x, y, w, h, sw, c) {
    w = Math.max(w, sw * 2 + 1);
    h = Math.max(h, sw * 2 + 1);
    switch (t) {
     case 0:
      P.r(x, y, w, sw, c).r(x + w - sw, y, sw, h, c);
      break;

     case 1:
      P.r(x, y, sw, h, c).r(x, y + h - sw, w, sw, c);
      break;

     case 2:
      P.r(x, y, w, sw, c).r(x, y, sw, h, c).r(x, y + h - sw, w, sw, c);
      break;

     case 3:
      P.r(x, y, w, sw, c).r(x, y, sw, h, c).r(x, y + h - sw, w, sw, c).r(x + w - sw, y, sw, h, c);
      break;

     case 4:
      P.r(x + sw, y, w - sw * 2, sw, c).r(x + sw, y + h - sw, w - sw * 2, sw, c).r(x, y + sw, sw, h - sw * 2, c).r(x + w - sw, y + sw, sw, h - sw * 2, c);
      break;

     case 5:
      {
        const m = x + (w >> 1);
        P.thick(m, y, x, y + h - 1, sw, c).thick(m, y, x + w - 1, y + h - 1, sw, c);
        break;
      }

     case 6:
      {
        P.r(x, y, w, sw, c);
        const m = x + (w >> 1);
        P.thick(m, y + sw, x, y + h - 1, sw, c).thick(m, y + sw, x + w - 1, y + h - 1, sw, c);
        break;
      }

     case 7:
      {
        const hh = h >> 1;
        P.r(x, y, w, sw, c).r(x, y + hh, w, sw, c).r(x + w - sw, y, sw, hh, c).r(x, y + hh, sw, h - hh, c).r(x, y + h - sw, w, sw, c);
        break;
      }

     case 8:
      P.r(x, y, sw, h, c).r(x + w - sw, y, sw, h, c).r(x, y + (h >> 1), w, sw, c).r(x, y + h - sw, w, sw, c);
      break;

     default:
      {
        const m = x + (w >> 1);
        P.r(m, y, sw, sw, c).r(x, y + sw + 1, w, sw, c);
        cons(P, 4, x + 1, y + sw * 2 + 2, w - 2, h - sw * 2 - 2, sw, c);
      }
    }
  }
  function glyph(P, x, y, s, c, k, sw, hs) {
    sw = sw || (s >= 11 ? 2 : 1);
    hs = hs || s;
    const g = new SX.Rng(k * 7919 + 13);
    const t = g.i(10), vw = g.i(5), fin = g.chance(.5) && hs >= 7;
    const top = fin ? Math.round(hs * .52) : hs, gap = fin ? Math.max(1, sw) : 0;
    if (vw >= 3) {
      const ch = Math.max(sw * 2 + 1, top - sw * 2 - 1);
      cons(P, t, x + 1, y, s - 2, ch, sw, c);
      const by = y + ch + 1;
      P.r(x, by, s, sw, c);
      if (vw === 3) P.r(x + (s >> 1), by - 1, sw, 1, c); else P.r(x + (s >> 1), by + sw, sw, Math.max(1, top - ch - 1 - sw), c);
    } else {
      const cw = Math.max(sw * 2 + 1, s - sw * 2 - 2);
      cons(P, t, x, y, cw, top, sw, c);
      const vx = x + s - sw;
      P.r(vx, y, sw, top, c);
      if (vw === 0) P.r(vx + sw, y + (top >> 1), 1 + (sw > 1 ? 1 : 0), sw, c); else if (vw === 1) P.r(vx - 2, y + (top >> 1), 2, sw, c);
    }
    if (fin) cons(P, [ 1, 4, 3, 0, 8 ][g.i(5)], x + 1, y + top + gap, s - 2, hs - top - gap, sw, c);
    return P;
  }
  function word(P, x, y, s, c, k, n, sp, sw, hs) {
    for (let i = 0; i < n; i++) glyph(P, x + i * (s + (sp == null ? 2 : sp)), y, s, c, k * 13 + i, sw, hs);
    return P;
  }
  const TXTC = new Map;
  const FONT_PX = {
    7: 8,
    9: 10,
    11: 12
  };
  function textMask(text, f) {
    const key = f + "|" + text;
    let m = TXTC.get(key);
    if (m) return m;
    const font = FONT_PX[f] + "px Galmuri" + f, ready = !document.fonts || document.fonts.check(font);
    const c = document.createElement("canvas"), x = c.getContext("2d", {
      willReadFrequently: true
    });
    x.font = font;
    c._notr = 1;
    const PAD = 2, w = Math.ceil(x.measureText(text).width) + 2, h = FONT_PX[f] + 3 + PAD;
    c.width = w;
    c.height = h;
    x.font = font;
    x.textBaseline = "top";
    x.fillStyle = "#fff";
    x.fillText(text, 0, PAD);
    const d = x.getImageData(0, 0, w, h).data, pts = [];
    let x1 = 0;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 127) {
      pts.push(xx, yy - PAD);
      x1 = Math.max(x1, xx + 1);
    }
    m = {
      pts,
      w: x1,
      h: f === 7 ? 7 : f === 9 ? 9 : 10
    };
    if (ready) TXTC.set(key, m); else A.textStale = true;
    return m;
  }
  function label(P, x, y, text, c, f, w, o) {
    const m = textMask(String(text), f || 7), s = o && o.s || 1, ox = w ? x + Math.floor((w - m.w * s) / 2) : x;
    if (s > 1) {
      if (o.sh) for (let i = 0; i < m.pts.length; i += 2) P.r(ox + m.pts[i] * s, y + m.pts[i + 1] * s + s, s, s, o.sh);
      for (let i = 0; i < m.pts.length; i += 2) P.r(ox + m.pts[i] * s, y + m.pts[i + 1] * s, s, s, c);
      return m.w * s;
    }
    if (o && o.sh) for (let i = 0; i < m.pts.length; i += 2) P.p(ox + m.pts[i], y + m.pts[i + 1] + 1, o.sh);
    for (let i = 0; i < m.pts.length; i += 2) P.p(ox + m.pts[i], y + m.pts[i + 1], c);
    return m.w;
  }
  const MINI = {
    0: "111101101101111",
    1: "010110010010111",
    2: "111001111100111",
    3: "111001111001111",
    4: "101101111001001",
    5: "111100111001111",
    6: "111100111101111",
    7: "111001010010010",
    8: "111101111101111",
    9: "111101111001111",
    A: "010101111101101",
    B: "110101110101110",
    C: "011100100100011",
    D: "110101101101110",
    E: "111100110100111",
    F: "111100110100100",
    G: "011100101101011",
    H: "101101111101101",
    I: "111010010010111",
    K: "101110100110101",
    L: "100100100100111",
    M: "101111111101101",
    N: "110101101101101",
    O: "010101101101010",
    P: "110101110100100",
    R: "110101110101101",
    S: "011100010001110",
    T: "111010010010010",
    U: "101101101101111",
    V: "101101101101010",
    W: "101101111111101",
    X: "101101010101101",
    Y: "101101010010010",
    "-": "000000111000000",
    ".": "000000000000010",
    " ": "000000000000000",
    "#": "101111101111101"
  };
  function mini(P, x, y, text, c, w, s) {
    s = s || 1;
    text = String(text).toUpperCase();
    const tw = (text.length * 4 - 1) * s, ox = w ? x + Math.floor((w - tw) / 2) : x;
    for (let k = 0; k < text.length; k++) {
      const g = MINI[text[k]] || MINI[" "];
      for (let i = 0; i < 15; i++) if (g[i] === "1") P.r(ox + (k * 4 + i % 3) * s, y + Math.floor(i / 3) * s, s, s, c);
    }
    return tw;
  }
  function txt(P, x, y, w, c, g) {
    let xx = x;
    while (xx < x + w - 1) {
      const l = Math.min(1 + g.i(3), x + w - xx);
      P.r(xx, y, l, 1, c);
      xx += l + 1;
    }
    return P;
  }
  function screen(P, x, y, w, h, col, g, o) {
    o = o || {};
    const R = RP(col);
    P.r(x, y, w, h, R[1]);
    vgrad(P, x, y, w, h, R[2], R[1], .2, .9);
    for (let k = 1; k < h; k += 2) P.r(x, y + k, w, 1, rgba(R[0], .35));
    if (o.lines !== false) for (let k = 0; k < Math.floor(h / 3); k++) txt(P, x + 2, y + 2 + k * 3, Math.max(2, w - 4 - g.i(Math.max(1, w >> 1))), R[4], g);
    P.r(x, y, w, 1, R[3]).p(x + 1, y + 1, R[5]);
    return P;
  }
  const GOODS = [ "#b0503c", "#c9b36a", "#6f8fb0", "#d7d2c3", "#7a9a5a", "#8a6a4a", "#c07a3a", "#5a7a9a", "#a04a5a", "#e0d0a0" ];
  function goods(P, x0, x1, ys, maxH, g, o) {
    o = o || {};
    let x = x0;
    while (x < x1 - 2) {
      const r = g.f(), room = x1 - x;
      if (r < (o.empty || .14)) {
        const l = 3 + g.i(8);
        if (g.chance(.5)) P.r(x, ys - 1, Math.min(l, room), 1, "rgba(200,190,160,0.12)");
        x += l;
        continue;
      }
      const col = g.pick(o.cols || GOODS), R = RP(col);
      if (r < .42 && room >= 5) {
        const cw = 4 + g.i(2), ch = Math.min(maxH, 5 + g.i(3));
        P.r(x, ys - ch, cw, ch, R[3]).r(x, ys - ch, 1, ch, R[4]).r(x + cw - 1, ys - ch, 1, ch, R[1]).r(x, ys - ch + 2, cw, 2, "#d8d4c8").r(x + cw - 1, ys - ch + 2, 1, 2, "#a8a498");
        P.r(x, ys - ch - 1, cw, 1, "#b8bcc0").p(x + 1, ys - ch - 1, "#e8ecef");
        x += cw + (g.chance(.5) ? 0 : 1);
      } else if (r < .62 && room >= 3) {
        const bh = Math.min(maxH, 8 + g.i(4)), glassy = g.chance(.5), bc = glassy ? g.pick([ "#4a7a4a", "#7a5a2a", "#6a8a9a" ]) : col, B = RP(bc);
        P.r(x, ys - bh + 3, 3, bh - 3, B[3]).r(x, ys - bh + 3, 1, bh - 3, B[4]).r(x + 2, ys - bh + 3, 1, bh - 3, B[1]).r(x + 1, ys - bh, 1, 3, B[2]).p(x + 1, ys - bh - 1, g.pick([ "#c8c0b0", "#b83030", "#e0e0e0" ]));
        if (!glassy) P.r(x, ys - bh + 5, 3, 2, "#e0dccc"); else P.p(x, ys - bh + 4, B[5]);
        x += 4;
      } else if (r < .9 && room >= 6) {
        const bw = Math.min(room, 6 + g.i(6)), bh = Math.min(maxH, 5 + g.i(6));
        P.r(x, ys - bh, bw, bh, R[3]).r(x, ys - bh, bw, 1, R[5]).r(x, ys - bh, 1, bh, R[4]).r(x + bw - 1, ys - bh, 1, bh, R[1]).r(x, ys - 1, bw, 1, R[1]);
        if (bw > 6) P.r(x + 2, ys - bh + 2, bw - 4, Math.min(2, bh - 3), g.chance(.5) ? "#e8e4d8" : R[1]);
        if (bh > 6 && bw > 5) txt(P, x + 1, ys - 3, bw - 2, R[1], g);
        x += bw + (g.chance(.4) ? 0 : 1);
      } else {
        const bw = Math.min(room, 5 + g.i(3)), bh = Math.min(maxH, 4 + g.i(3));
        P.r(x, ys - bh + 1, bw, bh - 1, R[3]).r(x + 1, ys - bh, bw - 2, 1, R[4]).r(x, ys - bh + 1, 1, bh - 2, R[4]).r(x + bw - 1, ys - bh + 1, 1, bh - 1, R[1]).p(x + 2, ys - bh + 2, R[5]);
        x += bw + 1;
      }
    }
  }
  def("desk", 2, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, top = "#8e7c5c", body = "#646a72", Rb = RP(body), Rt = RP(top);
    sbox(P, 1, B - 3, 62, 6, .4);
    const ty = B - 38;
    box(P, 4, B - 18, 20, 0, 18, body);
    for (let k = 0; k < 3; k++) {
      const y = B - 17 + k * 6;
      P.r(5, y, 18, 5, Rb[3]).r(5, y, 18, 1, Rb[4]).r(5, y + 4, 18, 1, Rb[1]).r(10, y + 2, 8, 1, Rb[0]).r(10, y + 3, 8, 1, Rb[5]).r(12, y + 1, 4, 1, "#c8c2ae");
    }
    P.r(24, B - 18, 30, 18, "#1c1f24");
    vgrad(P, 24, B - 18, 30, 18, "#2a2e35", "#15171b", .2, .7);
    P.r(25, B - 16, 28, 9, Rb[1]).r(25, B - 16, 28, 1, Rb[2]);
    box(P, 54, B - 18, 6, 0, 18, body);
    P.r(54, B - 1, 6, 1, Rb[0]);
    box(P, 2, ty, 60, 20, 3, top);
    grain(P, 3, ty + 1, 58, 17, top, g, 60);
    P.r(2, ty + 20, 60, 1, Rt[5]).r(2, ty + 22, 60, 1, Rt[1]);
    grime(P, 3, ty + 2, 58, 16, g, 10);
    const k = v % 4;
    if (k === 0 || k === 1) {
      const mx = k === 0 ? 8 : 6;
      if (k === 0) {
        P.r(mx + 8, ty + 5, 8, 2, "#2a2c31").r(mx + 8, ty + 5, 8, 1, "#44474e").r(mx + 11, ty + 1, 2, 4, "#303338");
        P.r(mx, ty - 13, 24, 15, "#17191d").r(mx + 1, ty - 12, 22, 13, "#23262c");
        glass(P, mx + 2, ty - 11, 20, 11, {
          col: "#1d2b33",
          gap: 11
        });
        if (v % 8 === 4) crack(P, mx + 14, ty - 6, g, 5, "#a8c8d0");
        P.r(mx, ty + 1, 24, 1, "#0f1013").p(mx + 20, ty, "#5fbf6a");
      } else {
        box(P, mx, ty - 12, 22, 7, 13, "#b8b09a");
        P.r(mx + 3, ty - 4, 16, 10, "#2a2c28");
        screen(P, mx + 4, ty - 3, 14, 8, "#3a6a4a", g, {
          lines: false
        });
        P.r(mx + 4, ty - 3, 14, 1, "#6a9a7a");
        P.r(mx + 18, ty + 7, 2, 1, "#6a8a5a");
      }
      box(P, mx + 1, ty + 11, 22, 4, 2, k === 0 ? "#34373d" : "#bdb5a0");
      for (let i = 0; i < 10; i++) P.p(mx + 2 + i * 2, ty + 12, k === 0 ? "#565a62" : "#e0d8c4").p(mx + 3 + i * 2, ty + 13, k === 0 ? "#565a62" : "#e0d8c4");
      P.r(mx + 26, ty + 12, 3, 4, "#2a2c30").p(mx + 26, ty + 12, "#5a5e66");
      for (let s = 0; s < 3; s++) P.r(40 + s, ty + 4 - s, 12, 8, s === 2 ? "#e6e1d0" : "#c8c2b0").r(40 + s, ty + 11 - s, 12, 1, "#a09a88");
      txt(P, 44, ty + 4, 8, "#8a8474", g);
      txt(P, 44, ty + 6, 6, "#8a8474", g);
      P.r(55, ty + 9, 4, 5, "#e8e4d8").r(55, ty + 9, 4, 1, "#5a3a22").r(58, ty + 10, 1, 4, "#b8b4a8").p(59, ty + 11, "#d8d4c8");
    } else if (k === 2) {
      P.r(18, ty + 1, 22, 10, "#2a2d33").r(19, ty + 2, 20, 8, "#1b242c");
      screen(P, 19, ty + 2, 20, 8, "#2a5a7a", g);
      box(P, 17, ty + 11, 24, 6, 1, "#5a5e66");
      for (let i = 0; i < 9; i++) P.r(19 + i * 2, ty + 12, 1, 3, "#3a3d42");
      P.oval(50, ty + 12, 5, 2, "#3a2414").oval(49, ty + 12, 3, 1, "#4a2e1a");
      P.r(48, ty + 6, 4, 4, "#e8e4d8").r(48, ty + 6, 4, 1, "#3a2414");
      for (let s = 0; s < 4; s++) {
        const px = 4 + g.i(8), py = ty + 3 + g.i(10);
        P.r(px, py, 8, 5, "#dcd6c4").r(px, py + 4, 8, 1, "#a8a290");
        txt(P, px + 1, py + 1, 6, "#8a8474", g);
      }
    } else {
      for (let s = 0; s < 5; s++) P.r(6, ty + 8 - s, 14, 9, s % 2 ? "#dcd6c4" : "#c9c3b0").r(6, ty + 16 - s, 14, 1, "#9a947f");
      for (let b = 0; b < 4; b++) {
        const c = [ "#3a5a8a", "#8a3a3a", "#3a6a4a", "#b8a040" ][b];
        P.r(24 + b * 4, ty - 6, 4, 14, c).r(24 + b * 4, ty - 6, 1, 14, sh(c, .3)).r(27 + b * 4, ty - 6, 1, 14, sh(c, -.4)).r(25 + b * 4, ty - 2, 2, 3, "#e0dccc");
      }
      P.r(44, ty + 5, 18, 7, "#17191d").r(45, ty + 6, 16, 5, "#23262c").r(45, ty + 11, 16, 1, "#3a3d44");
      P.r(56, ty - 10, 2, 12, "#3a3d42").thick(57, ty - 10, 51, ty - 13, 2, "#3a3d42").r(46, ty - 15, 8, 4, "#2a7a5a").r(46, ty - 12, 8, 1, "#1a4a3a").r(47, ty - 11, 6, 1, "#f0e8a0");
      P.r(53, ty + 1, 7, 2, "#2a2d33");
    }
    if (v % 5 === 3) {
      P.oval(12 + g.i(30), ty + 14, 3, 1, C.blood2);
      P.p(20 + g.i(20), ty + 17, C.blood);
    }
  });
  def("chair", 1, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, fab = [ "#3d4656", "#4a3a3a", "#3a4a40" ][v % 3], R = RP(fab), M = RP("#3a3d44");
    P.shadow(16, B - 2, 12, 3, .4);
    const by = B - 38;
    P.r(9, by + 1, 14, 17, R[2]).r(10, by, 12, 1, R[3]);
    hgrad(P, 9, by + 1, 14, 16, R[3], R[2], .3, .8);
    P.dith(11, by + 3, 10, 11, R[1], 0);
    P.r(9, by + 1, 1, 16, R[4]).r(22, by + 1, 1, 16, R[1]).r(10, by, 12, 1, R[5]).r(11, by + 14, 10, 2, R[4]).r(11, by + 16, 10, 1, R[1]);
    P.r(15, by + 17, 2, 4, M[2]).p(15, by + 17, M[4]);
    for (const ax of [ 5, 25 ]) {
      P.r(ax + 1, B - 23, 1, 9, M[1]);
      P.r(ax, B - 25, 3, 3, M[3]).r(ax, B - 25, 3, 1, M[4]).r(ax, B - 23, 3, 1, M[1]);
    }
    P.r(8, B - 22, 16, 1, R[4]).r(7, B - 21, 18, 7, R[4]).r(7, B - 21, 18, 2, R[5]).r(7, B - 21, 1, 7, R[5]).r(24, B - 21, 1, 7, R[3]);
    P.r(10, B - 18, 12, 1, R[3]);
    box(P, 7, B - 14, 18, 0, 4, fab);
    P.r(8, B - 10, 16, 1, R[0]);
    P.r(15, B - 10, 3, 6, "#8a9098").r(15, B - 10, 1, 6, "#c8ccd0").r(17, B - 10, 1, 6, "#50555c");
    P.thick(16, B - 5, 5, B - 3, 2, M[2]).thick(16, B - 5, 27, B - 3, 2, M[1]).thick(16, B - 5, 11, B - 1, 2, M[3]).thick(16, B - 5, 22, B - 1, 2, M[2]);
    for (const [cx, cy] of [ [ 4, B - 3 ], [ 27, B - 3 ], [ 10, B - 1 ], [ 22, B - 1 ] ]) P.r(cx - 1, cy, 3, 2, "#16171a").p(cx - 1, cy, "#4a4d54");
    P.r(14, B - 5, 5, 2, M[3]).r(14, B - 5, 5, 1, M[4]);
  });
  def("shelf", 2, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, st = [ "#6a7078", "#6e6a5c", "#5a6a70" ][v % 3], R = RP(st);
    sbox(P, 1, B - 3, 62, 5, .4);
    const ty = B - 68, fy = ty + 12;
    P.r(4, fy, 56, 56, "#1e2126");
    vgrad(P, 4, fy, 56, 56, "#2a2e34", "#181a1e", .1, .9);
    for (let k = 6; k < 58; k += 4) P.r(k, fy, 1, 56, "rgba(0,0,0,0.18)");
    const lv = [ fy + 13, fy + 27, fy + 41, fy + 53 ];
    for (let i = 0; i < 4; i++) {
      const ys = lv[i];
      P.r(4, ys - 12, 56, 2, "rgba(0,0,0,0.35)");
      goods(P, 6, 58, ys, 11, g, {
        empty: v % 4 === 3 ? .4 : .14
      });
      P.r(3, ys, 58, 2, R[4]).r(3, ys, 58, 1, R[5]).r(3, ys + 2, 58, 2, R[2]).r(3, ys + 3, 58, 1, R[1]);
      if (i === 3) P.r(3, ys + 2, 58, 2, R[1]);
      rust(P, 4, ys + 2, 56, 2, g, 2);
    }
    for (const x of [ 2, 59 ]) {
      post(P, x, ty + 2, 3, B - ty - 2, st);
      for (let y = fy; y < B - 2; y += 4) P.p(x + 1, y, R[0]);
      P.r(x - 1, B - 1, 5, 1, R[0]);
    }
    box(P, 2, ty, 60, 12, 3, st, {
      flat: true
    });
    grime(P, 3, ty + 1, 58, 10, g, 8, "rgba(60,50,40,0.18)");
    if (g.chance(.6)) {
      const bx = 8 + g.i(30);
      box(P, bx, ty + 1, 14, 7, 0, "#a57c4f");
      P.r(bx + 6, ty + 1, 2, 7, "#c8b28a");
    }
    if (g.chance(.5)) {
      const bx = 40 + g.i(10);
      P.r(bx, ty + 3, 8, 5, "#3a4a5a").r(bx, ty + 3, 8, 1, "#5a6a7a");
    }
  });
  def("cabinet", 1, 1, 16, (P, w, h, up, g, v) => {
    const B = h - 2;
    sbox(P, 3, B - 3, 26, 5, .4);
    if (v === 5) {
      const W = "#d6d8d2", R = RP(W);
      box(P, 4, B - 44, 24, 10, 34, W);
      P.r(5, B - 33, 22, 4, R[4]).r(12, B - 33, 8, 4, "#f0f0ea").r(15, B - 33, 2, 4, "#2e9a4e").r(13, B - 32, 6, 2, "#2e9a4e");
      P.r(5, B - 28, 22, 14, "#1d2a30");
      for (const sy of [ B - 21, B - 15 ]) {
        P.r(6, sy, 20, 1, "#8a9a9a");
        goods(P, 6, 26, sy, 5, g, {
          cols: [ "#e8e4d8", "#8a5a2a", "#6a8ab0", "#e0e0e0", "#c84a3a" ],
          empty: .2
        });
      }
      glass(P, 5, B - 28, 11, 14, {
        col: "#35535e",
        gap: 13,
        wide: false
      });
      glass(P, 16, B - 28, 11, 14, {
        col: "#35535e",
        gap: 13,
        wide: false
      });
      P.r(15, B - 28, 2, 14, R[2]).r(5, B - 28, 22, 1, R[1]).p(14, B - 22, "#9aa0a8").p(17, B - 22, "#9aa0a8");
      P.r(5, B - 13, 22, 1, R[1]);
      for (const dx of [ 5, 16 ]) {
        P.r(dx, B - 12, 11, 10, R[3]).r(dx, B - 12, 11, 1, R[4]).r(dx + 10, B - 12, 1, 10, R[2]);
      }
      P.r(14, B - 9, 1, 3, "#8a9098").r(17, B - 9, 1, 3, "#8a9098");
      grime(P, 5, B - 8, 22, 6, g, 8, "rgba(90,80,50,0.18)");
      drip(P, 9, B - 12, 4, "rgba(120,90,50,0.25)");
      return;
    }
    const base = [ "#8a8a80", "#6f7680", "#7a7460" ][v % 3], R = RP(base);
    box(P, 4, B - 44, 24, 12, 32, base);
    grime(P, 5, B - 43, 22, 10, g, 6);
    const open = v % 3 === 1 ? 1 : -1;
    for (let k = 3; k >= 0; k--) {
      const y = B - 31 + k * 7;
      if (k === open) continue;
      P.r(5, y, 22, 6, R[3]).r(5, y, 22, 1, R[4]).r(5, y + 5, 22, 1, R[1]).r(5, y, 1, 6, R[4]).r(26, y, 1, 6, R[2]);
      P.r(11, y + 3, 10, 1, R[0]).r(11, y + 4, 10, 1, R[5]).r(13, y + 1, 6, 2, "#d8d2bc").r(13, y + 1, 6, 1, "#a8a28c");
    }
    if (open >= 0) {
      const y = B - 31 + open * 7;
      P.r(5, y - 1, 22, 5, "#23252a");
      for (let i = 0; i < 6; i++) P.r(6 + i * 3 + g.i(2), y - 2 + g.i(2), 3, 3, g.pick([ "#d8d2bc", "#c9b36a", "#a8c0d8", "#e8e4d8" ]));
      box(P, 4, y + 3, 24, 0, 6, base);
      P.r(11, y + 6, 10, 1, R[0]).r(11, y + 7, 10, 1, R[5]);
    }
    scratch(P, 6, B - 30, 20, 26, g, 4, R[5]);
    rust(P, 5, B - 5, 22, 4, g, 3);
  });
  def("locker", 1, 1, 28, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#4f6a74", "#56603f", "#7a7468", "#5a5a72" ][v % 4], R = RP(base);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 4, B - 56, 24, 12, 44, base);
    const fy = B - 44;
    P.r(15, fy + 1, 2, 42, R[1]).r(16, fy + 1, 1, 42, R[4]);
    const openR = v % 4 === 2;
    for (const dx of [ 5, 17 ]) {
      if (openR && dx === 17) continue;
      P.r(dx, fy + 1, 10, 41, R[3]).r(dx, fy + 1, 1, 41, R[4]).r(dx + 9, fy + 1, 1, 41, R[2]);
      for (let k = 0; k < 4; k++) P.r(dx + 2, fy + 4 + k * 2, 6, 1, R[0]).r(dx + 2, fy + 5 + k * 2, 6, 1, R[5]);
      for (let k = 0; k < 3; k++) P.r(dx + 2, fy + 34 + k * 2, 6, 1, R[0]).r(dx + 2, fy + 35 + k * 2, 6, 1, R[4]);
      P.r(dx + 2, fy + 14, 5, 3, "#d8d2bc").r(dx + 2, fy + 14, 5, 1, "#8a8474").p(dx + 3, fy + 15, "#6a6458");
      P.r(dx + 7, fy + 20, 2, 6, R[1]).r(dx + 7, fy + 20, 1, 6, R[5]).r(dx + 7, fy + 26, 2, 2, "#9aa0a8").p(dx + 8, fy + 28, "#6a6e74");
      if (g.chance(.4)) P.oval(dx + 3 + g.i(4), fy + 24 + g.i(8), 2, 1, R[2]);
    }
    if (openR) {
      P.r(17, fy + 1, 10, 41, "#15181b");
      vgrad(P, 17, fy + 1, 10, 41, "#23282c", "#121416", .1, .8);
      P.r(17, fy + 8, 10, 1, "#4a5056").r(18, fy + 5, 7, 3, "#8a6a4a").r(19, fy + 10, 1, 2, "#9aa0a8").r(18, fy + 12, 5, 14, "#3a4a5a").r(18, fy + 12, 1, 14, "#4a5a6a").r(18, fy + 26, 5, 1, "#2a3440");
      P.r(27, fy - 1, 3, 44, R[2]).r(27, fy - 1, 1, 44, R[4]).r(29, fy, 1, 42, R[1]);
      P.r(27, fy + 2, 3, 1, R[0]).r(27, fy + 5, 3, 1, R[0]);
    }
    scratch(P, 6, fy + 3, 20, 36, g, 5, R[5]);
    rust(P, 5, B - 6, 22, 5, g, 5);
    drip(P, 8 + g.i(14), fy + 30, 6, "rgba(110,60,30,0.3)");
    grime(P, 5, B - 56, 22, 10, g, 6);
  });
  def("fridge", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#cfcfc6", "#c8c6b8", "#9fbcae" ][v % 3], R = RP(base);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 4, B - 56, 24, 12, 44, base, {
      fi: 3
    });
    const fy = B - 44;
    P.r(5, fy + 14, 22, 1, R[0]).r(5, fy + 15, 22, 1, R[5]);
    P.r(5, fy + 1, 1, 42, R[5]).r(26, fy + 1, 1, 42, R[1]);
    P.r(22, fy + 4, 2, 8, R[1]).r(22, fy + 4, 1, 8, R[5]).r(22, fy + 18, 2, 14, R[1]).r(22, fy + 18, 1, 14, R[5]);
    P.r(20, fy + 1, 6, 42, "rgba(20,30,40,0.08)").r(24, fy + 1, 2, 42, "rgba(20,30,40,0.08)");
    P.r(5, B - 9, 22, 8, "rgba(70,60,30,0.12)").r(5, B - 5, 22, 4, "rgba(70,60,30,0.14)");
    if (v % 3 !== 2) {
      for (let k = 0; k < 3 + g.i(3); k++) {
        const x = 7 + g.i(12), y = fy + 17 + g.i(16);
        P.r(x, y, 2, 2, g.pick([ "#c84a3a", "#e0b040", "#4a8ad0", "#5aa05a" ])).p(x, y, "#ffffff");
      }
      P.r(8, fy + 19, 7, 8, "#e8e4d4").r(8, fy + 19, 7, 1, "#f8f4e8").r(8, fy + 26, 7, 1, "#b8b4a4");
      txt(P, 9, fy + 21, 5, "#6a6458", g);
      txt(P, 9, fy + 23, 4, "#6a6458", g);
      if (v % 3 === 1) {
        P.r(9, fy + 4, 9, 7, "#f0ecd8").line(10, fy + 9, 12, fy + 6, "#c84a3a").line(12, fy + 6, 15, fy + 9, "#4a8ad0").oval(15, fy + 6, 1, 1, "#e0b040");
      }
    }
    rust(P, 5, B - 4, 22, 3, g, 4);
    rust(P, 5, fy + 13, 3, 3, g, 1);
    scratch(P, 6, fy + 2, 20, 38, g, 3, R[5]);
    grime(P, 5, B - 55, 22, 10, g, 5);
    if (g.chance(.6)) {
      box(P, 7, B - 58, 12, 6, 4, "#a57c4f");
      P.r(12, B - 58, 2, 6, "#c8b28a");
    }
    P.r(6, B - 1, 3, 1, "#1a1b1e").r(23, B - 1, 3, 1, "#1a1b1e");
  });
  function pleaf(P, x0, y0, x1, y1, wd, hex) {
    const R = RP(hex), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const mx = x0 + dx * .45, my = y0 + dy * .45, up1 = ny < 0 || ny === 0 && nx < 0;
    P.poly([ [ x0, y0 ], [ mx + nx * wd, my + ny * wd ], [ x1, y1 ] ], up1 ? R[4] : R[2]);
    P.poly([ [ x0, y0 ], [ x1, y1 ], [ mx - nx * wd, my - ny * wd ] ], up1 ? R[2] : R[4]);
    P.line(x0, y0, x0 + dx * .85, y0 + dy * .85, R[1]);
    P.p(mx + nx * wd * .5, my + ny * wd * .5, R[5]);
    return P;
  }
  def("bed", 1, 2, 24, (P, w, h, up, g, v) => {
    const B = h - 2, sheet = v % 2 ? "#a9c0ca" : "#b9c8b4", Rs = RP(sheet), M = RP("#9aa0a6"), bl = [ "#6a8aa8", "#8a9a7a", "#a89a80" ][v % 3], Rl = RP(bl);
    sbox(P, 1, B - 5, 30, 7, .42);
    box(P, 3, 4, 26, 3, 12, "#c8c6bc", {
      fi: 3
    });
    cut(P, 3, 4, 28, 4);
    P.r(6, 10, 20, 1, "#a8a69c").r(6, 13, 20, 1, "#a8a69c");
    const ty = 16, by = B - 16;
    P.r(4, ty, 24, by - ty, Rs[4]).r(4, ty, 1, by - ty, Rs[5]).r(27, ty, 1, by - ty, Rs[2]).r(4, ty, 24, 2, "rgba(0,0,0,0.25)");
    P.r(7, ty + 3, 18, 10, "#e8e8e0").r(8, ty + 2, 16, 1, "#f4f4ee").r(7, ty + 12, 18, 1, "#b8b8ae").r(24, ty + 3, 1, 9, "#c8c8c0").r(10, ty + 7, 7, 1, "#d0d0c6").r(14, ty + 5, 1, 4, "#d0d0c6").p(9, ty + 4, "#ffffff");
    const fy = ty + 22;
    P.r(4, fy, 24, by - fy, Rl[3]).r(4, fy, 24, 3, Rl[5]).r(4, fy + 3, 24, 1, Rl[2]).r(4, fy, 1, by - fy, Rl[4]).r(27, fy, 1, by - fy, Rl[1]);
    for (let k = 0; k < 4; k++) {
      const y = fy + 7 + k * 6 + g.i(3);
      P.line(6 + g.i(4), y, 16 + g.i(8), y + 2, Rl[2]).line(7 + g.i(4), y - 1, 15 + g.i(8), y + 1, Rl[4]);
    }
    if (v % 3 === 1) {
      P.oval(15, fy + 14, 4, 2, "#7a2a28").oval(14, fy + 13, 2, 1, C.blood);
    }
    grime(P, 5, ty + 14, 22, 30, g, 8, "rgba(120,100,40,0.14)");
    for (const x of [ 2, 28 ]) {
      P.r(x, ty + 10, 2, 30, M[4]).r(x + 1, ty + 10, 1, 30, M[2]);
      for (let y = ty + 12; y < ty + 40; y += 9) P.r(x, y, 2, 1, M[1]);
    }
    box(P, 3, B - 26, 26, 3, 20, "#c8c6bc", {
      fi: 3
    });
    cut(P, 3, B - 26, 28, B - 26);
    P.r(6, B - 21, 20, 1, "#a8a69c");
    P.r(11, B - 20, 10, 12, "#6a4a30").r(12, B - 19, 8, 10, "#e6e2d4").r(14, B - 21, 4, 2, "#9aa0a8");
    txt(P, 13, B - 16, 6, "#7a7466", g);
    txt(P, 13, B - 14, 5, "#7a7466", g);
    P.r(13, B - 12, 4, 1, "#b83a34");
    P.r(4, B - 6, 24, 2, "#1c1e22");
    for (const x of [ 5, 24 ]) {
      P.r(x, B - 6, 3, 3, M[2]).r(x, B - 3, 3, 3, "#18191c").p(x, B - 3, "#44474c");
    }
  });
  def("mattress", 2, 1, 2, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#b3a996", R = RP(base);
    sbox(P, 1, B - 4, 62, 6, .36);
    box(P, 2, 4, 60, 24, 4, base, {
      fi: 3
    });
    cut(P, 2, 4, 61, 4);
    for (let x = 5; x < 60; x += 4) P.r(x, 5, 1, 22, rgba("#7a8aa0", .18));
    for (let y = 9; y < 26; y += 7) for (let x = 8; x < 58; x += 8) P.p(x + (y / 7 & 1) * 4, y, R[2]).p(x + (y / 7 & 1) * 4 + 1, y + 1, R[5]);
    P.r(3, 5, 58, 1, R[5]).r(3, 26, 58, 1, R[2]);
    for (let k = 0; k < 4; k++) {
      const x = 10 + g.i(40), y = 8 + g.i(14), rx = 3 + g.i(5), ry = 2 + g.i(2);
      P.oval(x, y, rx + 1, ry, "rgba(110,80,30,0.28)").oval(x, y, rx, ry - 1, "rgba(150,120,50,0.22)");
    }
    const tx = 30 + g.i(12);
    P.r(tx, 14, 7, 4, "#d8b050").r(tx, 14, 7, 1, "#6a5a3a").p(tx + 2, 15, "#8a8a8a").p(tx + 4, 16, "#8a8a8a");
    P.r(5, 8, 12, 16, "#9a927e").r(6, 7, 10, 1, "#a8a08a").r(5, 8, 1, 16, "#b8b09a").r(5, 23, 12, 1, "#7a7462").r(8, 12, 6, 1, "#8a8270");
    const bc = [ "#4a5a3a", "#5a4a5a", "#3a4a5a" ][v % 3], Rb = RP(bc);
    P.poly([ [ 40, 6 ], [ 60, 7 ], [ 61, 20 ], [ 52, 26 ], [ 38, 24 ] ], Rb[3]);
    P.poly([ [ 40, 6 ], [ 60, 7 ], [ 57, 12 ], [ 42, 12 ] ], Rb[4]);
    P.line(44, 14, 58, 12, Rb[1]).line(42, 19, 55, 18, Rb[1]).line(45, 15, 57, 13, Rb[5]).line(40, 24, 52, 26, Rb[1]);
    grime(P, 3, 5, 58, 22, g, 14);
  });
  def("sofa", 2, 1, 14, (P, w, h, up, g, v, col) => {
    const B = h - 2, base = col || [ "#6a4636", "#4f5e44", "#5a5a64" ][v % 3], R = RP(base);
    sbox(P, 1, B - 4, 62, 6, .42);
    box(P, 4, B - 42, 56, 4, 0, base);
    cut(P, 4, B - 42, 59, B - 42);
    for (const x of [ 9, 33 ]) {
      P.r(x, B - 38, 23, 15, R[3]).r(x + 1, B - 38, 21, 1, R[4]).r(x, B - 37, 1, 13, R[4]).r(x + 22, B - 37, 1, 13, R[1]).r(x + 1, B - 24, 21, 1, R[1]);
      P.p(x + 7, B - 32, R[1]).p(x + 15, B - 32, R[1]).p(x + 7, B - 31, R[5]).p(x + 15, B - 31, R[5]);
    }
    P.r(4, B - 38, 5, 15, R[2]).r(55, B - 38, 5, 15, R[1]);
    for (const x of [ 9, 33 ]) {
      P.r(x, B - 23, 23, 9, R[4]).r(x + 1, B - 23, 21, 1, R[5]).r(x, B - 22, 1, 7, R[5]).r(x + 22, B - 22, 1, 7, R[3]);
      box(P, x, B - 14, 23, 0, 5, base, {
        fi: 3
      });
    }
    P.r(32, B - 23, 1, 14, R[1]);
    if (v % 4 === 1) {
      P.oval(20, B - 18, 4, 2, "#d8d0b8").p(19, B - 19, "#f0e8d0").line(16, B - 20, 24, B - 16, R[0]);
    }
    for (const [x, dark] of [ [ 2, false ], [ 55, true ] ]) {
      box(P, x, B - 30, 8, 7, 22, base, {
        fi: dark ? 2 : 3
      });
      cut(P, x, B - 30, x + 7, B - 30);
      P.r(x + 1, B - 23, 6, 1, R[dark ? 1 : 2]);
    }
    P.r(10, B - 9, 45, 7, R[1]).r(10, B - 9, 45, 1, R[2]);
    for (const x of [ 4, 57 ]) P.r(x, B - 2, 3, 2, "#2a1e16").p(x, B - 2, "#5a4232");
    grime(P, 9, B - 23, 46, 10, g, 8);
    scratch(P, 3, B - 28, 58, 20, g, 3, R[5]);
  });
  def("counter", 2, 1, 20, (P, w, h, up, g, v) => {
    const B = h - 2, top = "#b8b4a8", cab = [ "#7a6448", "#8a8a80", "#6a7a6a" ][v % 3], Rt = RP(top), Rc = RP(cab);
    sbox(P, 1, B - 3, 62, 5, .4);
    const ty = B - 38;
    P.r(2, ty - 3, 60, 3, Rt[2]).r(2, ty - 3, 60, 1, Rt[4]);
    box(P, 2, ty, 60, 20, 2, top);
    P.noise(3, ty + 1, 58, 18, [ Rt[3], Rt[5], Rt[2] ], .12, g);
    box(P, 3, ty + 22, 58, 0, 13, cab, {
      flat: true
    });
    for (let k = 0; k < 4; k++) {
      const x = 4 + k * 14.25 | 0;
      P.r(x, ty + 23, 13, 11, Rc[3]).r(x, ty + 23, 13, 1, Rc[4]).r(x, ty + 23, 1, 11, Rc[4]).r(x + 12, ty + 23, 1, 11, Rc[1]).r(x, ty + 33, 13, 1, Rc[1]).r(x + 2, ty + 25, 9, 7, Rc[2]).r(x + 2, ty + 31, 9, 1, Rc[4]);
      P.r(k % 2 ? x + 2 : x + 9, ty + 24, 2, 1, "#c8ccd0").p(k % 2 ? x + 2 : x + 9, ty + 25, "#6a6e74");
    }
    P.r(3, B - 3, 58, 3, "#1b1c1f").r(3, B - 3, 58, 1, "#2e3035");
    rust(P, 4, B - 5, 56, 2, g, 2);
    grime(P, 4, ty + 23, 56, 10, g, 6);
    if (v % 2) {
      const sx = 30, sy = ty + 3;
      P.r(sx, sy, 24, 14, "#9aa2a8").r(sx, sy, 24, 1, "#c8d0d4").r(sx + 2, sy + 2, 20, 10, "#5a6268").r(sx + 2, sy + 2, 20, 3, "#7a8288").r(sx + 2, sy + 11, 20, 1, "#aab2b8").p(sx + 12, sy + 8, "#2a2e32");
      P.oval(sx + 8, sy + 8, 4, 2, "#d8d4c8").oval(sx + 8, sy + 8, 2, 1, "#b0aa98").r(sx + 15, sy + 5, 4, 5, "#c84a3a").r(sx + 15, sy + 5, 4, 1, "#e07060");
      P.r(sx + 11, ty - 8, 2, 8, "#b8c0c4").r(sx + 11, ty - 8, 7, 2, "#b8c0c4").r(sx + 11, ty - 8, 7, 1, "#e0e8ec").r(sx + 17, ty - 6, 1, 2, "#8a9298").r(sx + 8, ty - 2, 8, 2, "#8a9298");
      P.r(6, ty + 5, 14, 9, "#a8845a").r(6, ty + 5, 14, 1, "#c8a47a").r(19, ty + 5, 1, 9, "#7a5a3a").r(8, ty + 7, 5, 1, "#8a2a2a");
      P.r(22, ty + 2, 3, 7, "#4a7a4a").r(22, ty + 2, 1, 7, "#6a9a6a").r(23, ty, 1, 2, "#d8d4c8");
    } else if (v % 4 === 0) {
      box(P, 8, ty + 1, 22, 9, 8, "#3a3d44");
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) P.p(11 + i * 3, ty + 3 + j * 2, "#8a9098");
      P.r(10, ty + 12, 18, 3, "#23252a").r(18, ty + 13, 3, 1, "#8a9098");
      P.r(24, ty - 6, 2, 7, "#2a2c30").r(20, ty - 10, 10, 5, "#1a1c20").r(21, ty - 9, 8, 3, "#2a4a2a").r(22, ty - 8, 5, 1, "#7ae07a");
      P.r(36, ty + 4, 16, 10, "#d8d2bc").r(36, ty + 4, 16, 1, "#eae4d0");
      txt(P, 38, ty + 6, 12, "#8a8474", g);
      txt(P, 38, ty + 9, 9, "#8a8474", g);
    } else {
      box(P, 6, ty - 6, 26, 8, 12, "#d0ccc0", {
        fi: 3
      });
      P.r(8, ty + 3, 15, 8, "#1c2024");
      glass(P, 8, ty + 3, 15, 8, {
        col: "#2a3438",
        gap: 12,
        wide: false
      });
      P.r(25, ty + 3, 5, 8, "#a8a498");
      P.r(26, ty + 4, 3, 2, "#2a3a2a");
      for (let j = 0; j < 2; j++) P.r(26, ty + 7 + j * 2, 3, 1, "#7a766a");
      P.r(40, ty + 5, 5, 6, "#8a4a2a").r(40, ty + 5, 5, 1, "#b87050").r(48, ty + 2, 3, 9, "#e8e4d8").r(48, ty + 2, 3, 1, "#b83a34");
    }
  });
  def("vending", 1, 1, 28, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#a8342e", "#2e5aa0", "#2f7a4a" ][v % 3], R = RP(base);
    sbox(P, 1, B - 3, 30, 5, .45);
    box(P, 3, B - 56, 26, 10, 46, base);
    for (let x = 6; x < 26; x += 3) P.r(x, B - 54, 2, 6, R[3]);
    const fy = B - 46;
    P.r(4, fy - 1, 24, 8, R[4]).r(4, fy - 1, 24, 1, R[5]);
    label(P, 4, fy, [ "음료", "커피", "생수" ][v % 3], "#f4f0e0", 7, 24, {
      sh: R[2]
    });
    P.r(5, fy + 7, 16, 26, "#10151a");
    for (let r = 0; r < 4; r++) {
      const ys = fy + 13 + r * 6;
      for (let k = 0; k < 4; k++) {
        if (g.chance(.18)) continue;
        const c = g.pick([ "#e0c050", "#d85040", "#50a0e0", "#f0f0f0", "#60c070", "#e08030" ]), Rc = RP(c);
        P.r(6 + k * 4, ys - 5, 3, 5, Rc[3]).r(6 + k * 4, ys - 5, 1, 5, Rc[5]).r(8 + k * 4, ys - 5, 1, 5, Rc[1]).r(6 + k * 4, ys - 3, 3, 1, "#f0ece0");
      }
      P.r(5, ys, 16, 1, "#5a6068").p(5 + r * 3, ys, "#9aa0a8");
    }
    for (let k = 0; k < 3; k++) P.line(6 + k * 6, fy + 32, 16 + k * 6, fy + 8, "rgba(200,230,240,0.13)");
    if (v % 4 === 1) {
      P.r(8, fy + 18, 8, 7, "#0a0c10");
      crack(P, 12, fy + 21, g, 7, "#9ab8c4");
    }
    P.r(22, fy + 7, 5, 26, R[2]).r(22, fy + 7, 1, 26, R[4]);
    P.r(23, fy + 9, 3, 2, "#1a2a1a").p(24, fy + 9, "#e84a3a");
    for (let j = 0; j < 4; j++) P.r(23, fy + 13 + j * 2, 3, 1, j === 1 ? "#f0e070" : "#c8c8c0");
    P.r(23, fy + 23, 3, 1, "#0e0f12").r(23, fy + 26, 3, 3, "#2a2c30").p(24, fy + 27, "#8a9098");
    P.r(6, B - 11, 16, 6, "#15171a").r(6, B - 11, 16, 1, "#08090b").r(7, B - 8, 14, 2, R[1]).r(7, B - 8, 14, 1, R[3]);
    P.r(4, B - 4, 24, 3, R[1]);
    rust(P, 4, B - 6, 24, 4, g, 4);
    scratch(P, 4, fy + 2, 24, 40, g, 4, R[5]);
    P.r(22, fy + 30, 5, 3, "#e8e4d8").r(22, fy + 30, 5, 1, "#b83a34");
  });
  def("plant", 1, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, pot = v % 2 ? "#a0583a" : "#d0ccc0", Rp = RP(pot);
    P.shadow(16, B - 1, 10, 3, .4);
    const L = [ "#4a7a3a", "#3e6a32", "#5a8a42", "#6a8a3a" ], dry = "#8a7a40", leaves = [];
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (g.f() - .5) * 2.6, len = 10 + g.i(9);
      leaves.push([ a, len, g.chance(.18) ? dry : g.pick(L) ]);
    }
    leaves.sort((p, q) => Math.sin(p[0]) - Math.sin(q[0]));
    for (const [a, len, c] of leaves) {
      const x0 = 16 + Math.cos(a) * 2, y0 = B - 18, x1 = Math.max(3, Math.min(28, 16 + Math.cos(a) * len)), y1 = y0 + Math.sin(a) * len * 1.35;
      pleaf(P, x0, y0, x1, y1, 2.6, c);
    }
    P.r(15, B - 26, 2, 10, "#4a3a22").r(15, B - 26, 1, 10, "#6a5a3a");
    P.r(8, B - 15, 16, 3, Rp[4]).r(8, B - 15, 16, 1, Rp[5]).r(9, B - 14, 14, 1, "#3a2a1c");
    for (let i = 0; i < 14; i++) {
      const t = (i + .5) / 14;
      P.r(9 + i, B - 12, 1, 11, t < .25 ? Rp[4] : t < .6 ? Rp[3] : t < .85 ? Rp[2] : Rp[1]);
    }
    P.r(10, B - 1, 12, 1, Rp[1]).r(9, B - 12, 14, 1, Rp[1]);
    if (v % 2 === 0) P.r(9, B - 8, 14, 1, Rp[2]);
    rust(P, 10, B - 5, 12, 4, g, 1);
    P.r(3 + g.i(4), B - 2, 3, 1, dry).r(24 + g.i(3), B - 1, 3, 1, "#6a5a30");
  });
  def("trash", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2;
    P.oval(16, B - 11, 15, 10, "rgba(40,32,16,0.2)").oval(8 + g.i(14), B - 3, 7, 2, "rgba(50,40,15,0.3)");
    for (let k = 0; k < 11; k++) {
      const x = 1 + g.i(27), y = B - 22 + g.i(21), c = g.pick([ "#d0cabb", "#b8b09a", "#e0dccc", "#8a8578", "#c8b890" ]), dx = g.i(3) - 1;
      P.poly([ [ x, y + 1 ], [ x + 4, y + dx ], [ x + 6, y + 3 ], [ x + 2, y + 4 - dx ] ], c);
      P.line(x + 1, y + 3, x + 5, y + 3, sh(c, -.35));
      if (g.chance(.4)) txt(P, x + 1, y + 1, 4, sh(c, -.4), g);
    }
    P.poly([ [ 2, B - 9 ], [ 12, B - 11 ], [ 14, B - 4 ], [ 4, B - 2 ] ], "#8a6a44");
    P.line(3, B - 6, 13, B - 8, "#6a4e30").line(2, B - 9, 12, B - 11, "#a88860");
    P.hcyl(22, B - 5, 7, 3, "#3a6a3a");
    P.r(29, B - 5, 2, 2, "#c8c0a8").p(23, B - 5, "#9ac89a");
    P.hcyl(5, B - 17, 5, 3, "#9aa0a8");
    P.r(6, B - 16, 2, 1, "#b83a34");
    P.r(24, B - 24, 6, 4, "#e8e8e0").r(24, B - 24, 6, 1, "#ffffff").r(25, B - 23, 4, 2, "#c8c0b0");
    const bags = [ [ "#26292e", 10, B - 16, 8, 6 ], [ v % 2 ? "#2f4a33" : "#2e3a52", 21, B - 18, 7, 6 ], [ "#2a2d33", 15, B - 9, 8, 5 ], [ "#bab8ae", 26, B - 9, 5, 4 ] ];
    for (const [c, x, y, rx, ry] of bags) {
      P.oval(x, y + 2, rx + 1, ry, "rgba(0,0,0,0.35)");
      P.oval(x, y, rx + 1, ry + 1, sh(c, -.55));
      P.ball(x, y, rx, ry, c);
      P.line(x - rx + 2, y + 1, x - 1, y + ry - 1, sh(c, -.35)).line(x + 1, y - ry + 2, x + rx - 2, y + 1, sh(c, -.35)).line(x - 2, y - 2, x + 2, y + 2, sh(c, -.25));
      P.p(x - rx + 2, y - ry + 2, "#9aa0a8").p(x - rx + 3, y - ry + 2, "#6a7078").p(x - rx + 3, y - ry + 3, "#6a7078");
      P.r(x - 1, y - ry - 2, 3, 2, sh(c, .15)).p(x - 2, y - ry - 3, sh(c, .3)).p(x + 1, y - ry - 3, sh(c, .25)).p(x, y - ry - 1, sh(c, -.4));
    }
    for (let k = 0; k < 6; k++) P.p(2 + g.i(28), B - 2 - g.i(22), g.pick([ "#c83a30", "#e8c040", "#e8e4d8", "#5a8ac0" ]));
  });
  function carton(P, x, y, w, t, f, g, o) {
    o = o || {};
    const base = o.col || "#a57c4f", R = RP(base);
    box(P, x, y, w, t, f, base, {
      fi: 3
    });
    const m = x + (w >> 1);
    if (o.open) {
      P.r(x + 1, y + 1, w - 2, t - 2, "#3a2a1a").r(x + 1, y + 1, w - 2, 2, "#2a1e12");
      P.poly([ [ x, y + t - 1 ], [ x + 3, y - 4 ], [ m - 1, y - 3 ], [ m - 1, y + t - 1 ] ], R[4]);
      P.poly([ [ m + 1, y + t - 1 ], [ m + 1, y - 2 ], [ x + w - 2, y - 5 ], [ x + w, y + t - 1 ] ], R[3]);
    } else {
      P.r(m, y, 1, t, R[2]);
      P.r(m - 2, y, 5, t, "#c9b389").r(m - 2, y, 1, t, "#e0d0a8").r(m + 2, y, 1, t, "#a8946a");
      P.r(m - 2, y + t, 5, Math.min(5, f), "#c9b389").r(m - 2, y + t, 1, Math.min(5, f), "#e0d0a8");
    }
    if (f > 9) {
      const lx = x + 3, ly = y + t + 3;
      P.r(lx, ly, 6, 4, "#e6e0cc").r(lx, ly, 6, 1, "#f4f0e0");
      txt(P, lx + 1, ly + 2, 4, "#6a6458", g);
      P.r(x + w - 6, y + t + 3, 1, 4, "#3a2a1a").p(x + w - 7, y + t + 4, "#3a2a1a").p(x + w - 5, y + t + 4, "#3a2a1a");
    }
    P.r(x + 1, y + t + f - 4, w - 2, 3, "rgba(60,40,20,0.22)");
    grime(P, x + 1, y + t + 1, w - 2, f - 2, g, 3, "rgba(70,50,30,0.2)");
  }
  def("clothes", 1, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, cols = [ [ "#6a4a3a", "#8a6a55" ], [ "#3a4a6a", "#5a6a8a" ], [ "#7a3a3a", "#9a5a55" ], [ "#4a5a3a", "#6a7a55" ], [ "#8a8060", "#aaa080" ] ];
    sbox(P, 2, B - 3, 28, 5, .4);
    const pick = k => cols[(v + k) % cols.length];
    const c0 = pick(0), c1 = pick(1), c2 = pick(2);
    P.r(3, B - 9, 26, 8, c0[0]).r(4, B - 10, 24, 2, c0[1]).r(3, B - 9, 26, 1, c0[1]);
    P.r(6, B - 15, 18, 7, c1[0]).r(7, B - 16, 16, 2, c1[1]).r(8, B - 12, 6, 1, "rgba(10,12,20,0.25)");
    P.r(9, B - 20, 12, 6, c2[0]).r(10, B - 21, 10, 2, c2[1]).r(12, B - 18, 5, 1, "rgba(10,12,20,0.25)");
    P.r(1, B - 7, 5, 3, c1[0]).r(1, B - 8, 5, 1, c1[1]);
    P.r(26, B - 6, 5, 2, c2[0]).r(26, B - 7, 5, 1, c2[1]);
    P.r(5, B - 4, 22, 1, "rgba(10,12,20,0.3)").r(8, B - 11, 14, 1, "rgba(10,12,20,0.3)");
  });
  A.defPropRot("clothes", {
    sym: true
  });
  def("boxes", 1, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2;
    sbox(P, 1, B - 3, 30, 5, .42);
    carton(P, 3, B - 28, 26, 12, 16, g);
    P.r(7, B - 19, 20, 2, "rgba(10,12,20,0.35)");
    carton(P, 6 + g.i(3), B - 40, 18, 9, 12, g, {
      col: "#b08a58",
      open: v % 3 === 1
    });
    if (v % 3 !== 1) {
      P.r(10, B - 42, 12, 2, "rgba(10,12,20,0.3)");
      carton(P, 10, B - 50, 11, 6, 7, g, {
        col: "#9a7448"
      });
    }
  });
  def("airdrop", 2, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, O = RP("#56613f"), K = RP("#26282c"), W = RP("#e8e2d0"), Rr = RP("#c8302a");
    sbox(P, 1, B - 5, 62, 7, .5);
    P.poly([ [ 34, 6 ], [ 62, 10 ], [ 63, B - 6 ], [ 50, B - 2 ], [ 44, B - 18 ], [ 36, 22 ] ], W[3]);
    for (const [x0, x1] of [ [ 40, 46 ], [ 52, 58 ] ]) P.poly([ [ x0, 8 ], [ x1, 9 ], [ x1 + 3, B - 8 ], [ x0 + 4, B - 12 ] ], "#e8762a");
    P.line(34, 6, 62, 10, W[5]).line(44, B - 18, 50, B - 2, W[1]);
    for (const [x, y] of [ [ 36, 8 ], [ 48, 9 ], [ 60, 10 ] ]) P.line(x, y, 30, 22, "#9a9484");
    box(P, 3, B - 42, 44, 16, 26, "#56613f");
    P.r(4, B - 41, 42, 14, O[3]).r(4, B - 41, 42, 1, O[5]);
    for (let x = 6; x < 46; x += 8) P.r(x, B - 26, 1, 24, O[1]);
    for (let k = 0; k < 5; k++) {
      const x = 4 + k * 9;
      P.poly([ [ x, B - 26 ], [ x + 4, B - 26 ], [ x, B - 20 ] ], Rr[3]);
    }
    P.r(4, B - 26, 42, 1, Rr[4]);
    P.r(10, B - 17, 24, 9, "#e8e0b8").r(10, B - 17, 24, 1, "#fff6d0");
    label(P, 12, B - 16, "보급", "#56613f", 7, 20);
    for (const x of [ 3, 45 ]) P.r(x, B - 27, 2, 26, K[2]).r(x, B - 27, 1, 26, K[3]);
    for (const y of [ B - 22, B - 8 ]) P.r(3, y, 44, 2, K[2]).r(3, y, 44, 1, K[4]);
    P.r(22, B - 48, 6, 6, K[2]).r(21, B - 51, 8, 4, "#ff4030").r(22, B - 52, 6, 1, "#ff9a80").r(23, B - 50, 2, 2, "#ffe0d0");
    scratch(P, 5, B - 40, 38, 36, g, 5, O[5]);
  }, {
    color: "#56613f"
  });
  def("crate", 1, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, olive = v % 2 === 1, base = olive ? "#56613f" : "#8a6a40", R = RP(base);
    sbox(P, 1, B - 3, 30, 5, .45);
    box(P, 2, B - 32, 28, 14, 18, base);
    if (olive) {
      P.r(3, B - 31, 26, 12, R[3]).r(3, B - 31, 26, 1, R[4]).r(5, B - 29, 22, 8, R[4]).r(5, B - 22, 22, 1, R[5]).r(5, B - 29, 22, 1, R[3]);
      label(P, 5, B - 29, [ "탄약", "군용", "보급" ][(v >> 1) % 3], "#d8d0a0", 7, 22);
      P.r(3, B - 17, 26, 1, R[1]);
      for (const x of [ 6, 22 ]) {
        P.r(x, B - 16, 4, 5, "#3a3d38").r(x, B - 16, 4, 1, "#7a7d78").r(x + 1, B - 13, 2, 1, "#9aa098");
      }
      P.r(12, B - 12, 8, 5, "#d8d0a0").r(12, B - 12, 8, 1, "#e8e0b8");
      txt(P, 13, B - 10, 6, "#56613f", g);
      for (const x of [ 2, 28 ]) P.r(x, B - 18, 2, 18, R[1]).r(x, B - 18, 1, 18, R[2]);
      scratch(P, 3, B - 30, 26, 28, g, 6, R[5]);
      rust(P, 3, B - 5, 26, 4, g, 2);
      for (let k = 0; k < 4; k++) {
        const x = 4 + g.i(24), y = B - 16 + g.i(12);
        P.r(x, y, 2, 1, "#8a6a40");
      }
    } else {
      for (let k = 0; k < 3; k++) {
        const y = B - 30 + k * 4;
        P.r(3, y + 3, 26, 1, R[2]);
      }
      grain(P, 3, B - 31, 26, 12, base, g, 16);
      for (let k = 0; k < 3; k++) {
        const y = B - 17 + k * 6;
        P.r(3, y, 26, 5, k % 2 ? R[2] : R[3]).r(3, y, 26, 1, R[4]).r(3, y + 5, 26, 1, R[1]);
        grain(P, 3, y + 1, 26, 4, k % 2 ? R[2] : R[3], g, 5);
        P.p(4, y + 2, R[0]).p(27, y + 2, R[0]);
      }
      for (const x of [ 5, 24 ]) {
        P.r(x, B - 32, 3, 32, "#4a4d52").r(x, B - 32, 1, 32, "#7a7d82").r(x + 2, B - 32, 1, 32, "#2a2c30");
        P.p(x + 1, B - 28, "#9aa0a8").p(x + 1, B - 14, "#9aa0a8").p(x + 1, B - 5, "#9aa0a8");
      }
      label(P, 8, B - 16, [ "구호", "식량", "생수", "부품" ][(v >> 1) % 4], "#2a1e14", 7, 16);
    }
  });
  function hoop(P, x, w, y, e, c1, c2) {
    for (let i = 0; i < w; i++) {
      const dx = (i + .5 - w / 2) / (w / 2), yy = Math.round(y + e / 2 * Math.sqrt(Math.max(0, 1 - dx * dx)));
      P.p(x + i, yy, c1).p(x + i, yy + 1, c2);
    }
  }
  def("drum", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#2f5a8a", "#8a2f2a", "#4f5a36", "#b89030" ][v % 4], R = RP(base);
    P.shadow(16, B - 2, 12, 3, .45);
    P.cyl(6, B - 34, 20, 33, base, {
      e: 8
    });
    for (const y of [ B - 25, B - 15 ]) hoop(P, 6, 20, y, 8, R[5], R[0]);
    P.oval(15, B - 30, 8, 3, R[2]).oval(15, B - 30, 7, 2, R[3]).p(10, B - 31, R[5]);
    P.oval(12, B - 30, 1, 1, R[1]).p(12, B - 31, R[5]).oval(19, B - 29, 1, 0, R[1]);
    if (v % 4 === 3) {
      P.poly([ [ 16, B - 23 ], [ 20, B - 19 ], [ 16, B - 15 ], [ 12, B - 19 ] ], "#1a1a1a");
      P.poly([ [ 16, B - 22 ], [ 19, B - 19 ], [ 16, B - 16 ], [ 13, B - 19 ] ], "#e8c040");
      P.r(15, B - 20, 2, 2, "#1a1a1a");
    } else {
      P.r(10, B - 22, 9, 6, "#d8d2bc").r(10, B - 22, 9, 1, "#eae4d0");
      txt(P, 11, B - 20, 7, "#6a6458", g);
      txt(P, 11, B - 18, 5, "#b83a34", g);
    }
    rust(P, 6, B - 30, 20, 28, g, 9);
    drip(P, 9 + g.i(10), B - 13, 8, "rgba(110,55,25,0.45)");
    P.r(7, B - 3, 18, 1, R[0]);
  });
  def("o2", 1, 1, 18, (P, w, h, up, g, v) => {
    const B = h - 2, Mb = RP("#4a4d52");
    P.shadow(16, B - 2, 12, 3, .42);
    for (const [x, c] of [ [ 6, "#3a7a50" ], [ 17, "#3f7f55" ] ]) {
      P.cyl(x, B - 38, 9, 36, c, {
        e: 4
      });
      P.ball(x + 4, B - 37, 4, 3, "#e0e0d6");
      P.r(x + 3, B - 44, 3, 5, "#9a8a50").r(x + 3, B - 44, 1, 5, "#d8c890").r(x + 1, B - 45, 7, 2, "#3a3d42").r(x + 1, B - 45, 7, 1, "#6a6d72");
      P.r(x + 1, B - 26, 7, 6, "#e6e2d4").r(x + 1, B - 26, 7, 1, "#f4f0e4");
      txt(P, x + 2, B - 24, 5, "#3a7a50", g);
      txt(P, x + 2, B - 22, 4, "#6a6458", g);
      rust(P, x + 1, B - 12, 7, 8, g, 1);
    }
    P.thick(5, B - 32, 26, B - 30, 1, "#8a9098").thick(5, B - 31, 26, B - 29, 1, "#5a6068");
    box(P, 4, B - 8, 24, 3, 3, "#4a4d52");
    P.r(6, B - 36, 1, 30, Mb[3]).r(25, B - 36, 1, 30, Mb[2]);
    for (const x of [ 5, 23 ]) P.r(x, B - 3, 4, 3, "#18191c").p(x + 1, B - 2, "#5a5e64");
  });
  def("table", 2, 2, 4, (P, w, h, up, g, v) => {
    const B = h - 2, wood = [ "#6e5a44", "#5a4a3a", "#7a6a52" ][v % 3], R = RP(wood);
    sbox(P, 2, B - 20, 60, 22, .4);
    for (const x of [ 5, 55 ]) post(P, x, B - 16, 4, 16, "#3a3d42");
    P.r(9, B - 16, 46, 3, "rgba(10,12,20,0.4)");
    box(P, 2, B - 60, 60, 41, 4, wood);
    for (let k = 1; k < 5; k++) P.r(3, B - 60 + k * 8, 58, 1, R[3]);
    grain(P, 3, B - 59, 58, 38, wood, g, 34);
    P.line(10, B - 25, 26, B - 55, "rgba(255,246,220,0.08)").line(13, B - 25, 29, B - 55, "rgba(255,246,220,0.06)");
    for (let k = 0; k < 4; k++) {
      const x = 6 + g.i(40), y = B - 56 + g.i(26), s = g.chance(.5);
      P.r(x, y, s ? 10 : 8, s ? 7 : 10, "#d8d2c0").r(x, y, s ? 10 : 8, 1, "#eae4d4").r(x, y + (s ? 6 : 9), s ? 10 : 8, 1, "#a8a290");
      txt(P, x + 1, y + 2, 6, "#8a8474", g);
      txt(P, x + 1, y + 4, 5, "#8a8474", g);
    }
    for (let k = 0; k < 3; k++) {
      const x = 8 + g.i(46), y = B - 52 + g.i(24);
      P.ring(x, y, 2, 1, "rgba(60,30,10,0.35)");
    }
    for (let k = 0; k < 2 + v % 2; k++) {
      const x = 10 + g.i(42), y = B - 50 + g.i(22);
      P.r(x, y, 4, 5, "#e8e4d8").r(x, y, 4, 1, "#5a3a22").r(x + 3, y, 1, 5, "#b8b4a8");
    }
    if (v % 3 === 0) {
      box(P, 36, B - 44, 18, 11, 2, "#4a4d54");
      P.r(38, B - 42, 14, 1, "#6a6d74");
      P.p(52, B - 34, "#6ae06a");
    } else {
      P.r(40, B - 52, 3, 9, "#9ac8e0").r(40, B - 52, 1, 9, "#d0ecf8").r(40, B - 53, 3, 1, "#3a70c0").r(46, B - 48, 3, 9, "#9ac8e0").r(46, B - 48, 1, 9, "#d0ecf8").r(46, B - 49, 3, 1, "#3a70c0");
    }
    P.r(20, B - 36, 6, 1, "#2a2c30").p(25, B - 36, "#b83a34");
  });
  def("board", 2, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#8a9098");
    sbox(P, 2, B - 9, 60, 10, .3);
    for (const x of [ 6, 55 ]) {
      P.r(x - 1, B - 9, 4, 8, M[2]).r(x - 1, B - 9, 4, 1, M[4]).r(x - 1, B - 2, 2, 2, "#18191c").r(x + 1, B - 10, 2, 2, "#18191c");
      post(P, x, B - 26, 2, 18, "#8a9098");
    }
    const y0 = B - 54;
    P.r(2, y0, 60, 2, M[5]).r(2, y0 + 1, 60, 1, M[3]);
    P.r(2, y0 + 2, 60, 30, M[3]).r(4, y0 + 3, 56, 27, "#e4e4dc");
    vgrad(P, 4, y0 + 3, 56, 27, "#ecece6", "#d4d4ca", .2, .95);
    P.r(2, y0 + 2, 1, 30, M[5]).r(61, y0 + 2, 1, 30, M[1]).r(2, y0 + 31, 60, 1, M[1]).r(3, y0 + 30, 58, 1, M[2]);
    for (let k = 0; k < 5; k++) P.r(6 + g.i(40), y0 + 5 + g.i(20), 6 + g.i(10), 2, "rgba(120,130,140,0.12)");
    const ink = [ "#2a4aa0", "#1a1a20", "#b0302a", "#2a7a3a" ];
    if (v % 3 === 0) {
      P.r(8, y0 + 6, 1, 18, ink[1]).r(8, y0 + 23, 22, 1, ink[1]);
      let yy = y0 + 20;
      for (let x = 9; x < 29; x++) {
        const ny = yy + g.i(3) - 1 - (x > 22 ? -1 : 0);
        P.line(x - 1, yy, x, ny, ink[2]);
        yy = Math.max(y0 + 7, Math.min(y0 + 22, ny));
      }
      const L = [ [ "감염", "생존", "식량" ], [ "환자", "사망", "완치" ], [ "출격", "탈출", "실종" ] ][(v / 3 | 0) % 3];
      for (let r = 0; r < 3; r++) label(P, 34, y0 + 6 + r * 8, L[r], ink[r % 2 ? 1 : 0], 7);
    } else if (v % 3 === 1) {
      P.line(8, y0 + 24, 20, y0 + 10, ink[0]).line(20, y0 + 10, 40, y0 + 14, ink[0]).line(40, y0 + 14, 54, y0 + 6, ink[0]).line(14, y0 + 6, 30, y0 + 26, ink[1]).line(34, y0 + 24, 56, y0 + 22, ink[1]);
      P.line(42, y0 + 16, 48, y0 + 22, ink[2]).line(48, y0 + 16, 42, y0 + 22, ink[2]).ring(45, y0 + 19, 5, 4, ink[2]);
      label(P, 7, y0 + 4, [ "탈출로", "집라인", "비상구" ][(v / 3 | 0) % 3], ink[1], 7);
    } else {
      P.r(32, y0 + 5, 1, 22, ink[1]);
      const L = [ [ "당번", "1조", "2조" ], [ "대피", "3층", "옥상" ], [ "배급", "물", "약" ] ][(v / 3 | 0) % 3];
      for (let r = 0; r < 3; r++) {
        label(P, 7, y0 + 5 + r * 8, L[r], ink[0], 7);
        P.r(36, y0 + 8 + r * 8, 2, 2, ink[2]);
        txt(P, 40, y0 + 9 + r * 8, 14 + g.i(4), ink[1], g);
      }
      P.line(36, y0 + 13, 54, y0 + 13, ink[2]);
    }
    box(P, 3, y0 + 32, 58, 3, 2, "#9aa0a8");
    P.r(10, y0 + 31, 6, 2, "#2a4aa0").r(10, y0 + 31, 1, 2, "#e8e4d8").r(18, y0 + 31, 6, 2, "#b0302a").r(18, y0 + 31, 1, 2, "#e8e4d8").r(40, y0 + 30, 9, 3, "#2a2c30").r(40, y0 + 30, 9, 1, "#d8d4c8");
  });
  def("copier", 1, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#c3c4bc", R = RP(base), D = RP("#5a5c62");
    sbox(P, 1, B - 3, 30, 5, .42);
    box(P, 3, B - 36, 26, 12, 24, base, {
      fi: 3
    });
    P.r(4, B - 35, 18, 9, D[3]).r(4, B - 35, 18, 1, D[4]).r(4, B - 27, 18, 1, D[1]).r(4, B - 35, 1, 9, D[4]);
    P.r(22, B - 35, 6, 10, R[3]).r(23, B - 34, 4, 3, "#2a3a2a").r(24, B - 33, 2, 1, "#6a9a6a");
    for (let j = 0; j < 2; j++) P.r(23, B - 30 + j * 2, 4, 1, "#8a8c86").p(23 + j * 2, B - 30 + j * 2, "#e0e0d8");
    P.r(2, B - 23, 4, 2, "#e8e4d8").r(1, B - 22, 5, 1, "#d8d4c8");
    P.r(4, B - 22, 24, 3, D[2]).r(4, B - 22, 24, 1, D[1]);
    for (let k = 0; k < 2; k++) {
      const y = B - 18 + k * 7;
      P.r(4, y, 24, 6, R[3]).r(4, y, 24, 1, R[4]).r(4, y + 5, 24, 1, R[1]).r(10, y + 2, 10, 1, R[1]).r(10, y + 3, 10, 1, R[5]).r(23, y + 1, 3, 3, "#1c2024").p(23, y + 3 - k, "#e8e4d8");
    }
    P.r(4, B - 4, 24, 3, D[2]);
    if (v % 3 === 1) {
      P.poly([ [ 9, B - 22 ], [ 16, B - 22 ], [ 18, B - 26 ], [ 11, B - 27 ] ], "#f0ece0");
      P.line(12, B - 25, 16, B - 24, "#8a8474");
    }
    mini(P, 5, B - 32, "A4", D[1]);
    grime(P, 4, B - 22, 24, 20, g, 8);
    scratch(P, 4, B - 20, 24, 16, g, 3, R[5]);
  });
  def("partition", 1, 1, 16, (P, w, h, up, g, v) => {
    const B = h - 2, fab = [ "#5f6a7a", "#6a6a5e", "#5a6a62" ][v % 3], R = RP(fab), M = RP("#a8acb0");
    sbox(P, 1, B - 4, 30, 6, .36);
    P.r(2, B - 42, 28, 3, M[4]).r(2, B - 42, 28, 1, M[5]).r(2, B - 40, 28, 1, M[2]);
    P.r(2, B - 39, 28, 35, R[3]);
    P.noise(3, B - 39, 26, 35, [ R[2], R[4], R[2] ], .35, g);
    P.r(3, B - 39, 26, 2, R[1]);
    P.r(2, B - 39, 2, 35, M[4]).r(2, B - 39, 1, 35, M[5]).r(28, B - 39, 2, 35, M[1]).r(4, B - 6, 24, 2, M[2]);
    for (const x of [ 6, 25 ]) P.r(x - 1, B - 4, 3, 4, "#2a2c30").r(x - 1, B - 4, 3, 1, "#5a5c62");
    const notes = [ [ 6, B - 34, "#e8e070" ], [ 15, B - 30, "#e8e4d8" ], [ 9, B - 22, "#f0a0b0" ], [ 19, B - 19, "#a8d0e8" ] ];
    for (const [x, y, c] of notes) {
      if (g.chance(.25)) continue;
      P.r(x, y, 7, 7, c).r(x, y + 6, 7, 1, sh(c, -.25)).r(x + 6, y, 1, 7, sh(c, -.15));
      txt(P, x + 1, y + 2, 5, sh(c, -.5), g);
      txt(P, x + 1, y + 4, 4, sh(c, -.5), g);
      P.p(x + 3, y, g.pick([ "#c83030", "#3050c0", "#30a040" ]));
    }
    if (v % 2) {
      P.r(18, B - 36, 8, 6, "#3a4a5a").r(19, B - 35, 6, 4, "#8ab0c8").r(19, B - 33, 6, 2, "#5a7a5a");
    }
  });
  def("opTable", 1, 2, 34, (P, w, h, up, g, v) => {
    const B = h - 2, pad = "#4f8a86", Rp = RP(pad), M = RP("#a8b0b4");
    sbox(P, 4, B - 7, 24, 8, .42);
    box(P, 7, B - 7, 18, 3, 4, "#8a9298");
    post(P, 12, B - 22, 8, 16, "#8a9298");
    P.r(12, B - 22, 8, 2, "rgba(10,12,20,0.4)");
    const ty = B - 72;
    P.r(5, ty, 22, 52, M[3]).r(5, ty, 1, 52, M[5]).r(26, ty, 1, 52, M[1]);
    for (const [y0, l] of [ [ ty + 1, 12 ], [ ty + 14, 20 ], [ ty + 35, 15 ] ]) {
      P.r(6, y0, 20, l, Rp[3]).r(6, y0, 20, 1, Rp[5]).r(6, y0, 1, l, Rp[4]).r(25, y0, 1, l, Rp[2]).r(6, y0 + l - 1, 20, 1, Rp[1]);
      P.r(8, y0 + 2, 3, l - 4, Rp[4]);
    }
    for (const y of [ ty + 20, ty + 40 ]) {
      P.r(5, y, 22, 2, "#1e2024").r(14, y, 3, 2, "#9aa0a8");
    }
    if (v % 2 === 0) {
      P.oval(17, ty + 26, 4, 3, "#6a1a1e").oval(16, ty + 25, 2, 1, C.blood).p(21, ty + 31, C.blood).p(12, ty + 44, C.blood2);
    }
    box(P, 5, ty + 52, 22, 0, 4, "#a8b0b4");
    P.r(6, ty + 56, 20, 1, "rgba(10,12,20,0.5)");
    post(P, 27, 12, 2, 36, "#c8ccd0");
    P.r(26, 47, 4, 2, "#5a5e64");
    P.thick(28, 13, 20, 17, 2, "#c8ccd0").p(28, 12, "#eef0f2");
    P.oval(16, 22, 10, 6, "#6a7076").oval(16, 21, 9, 5, "#d8dcde").oval(16, 22, 7, 4, "#9aa0a6");
    for (const [x, y] of [ [ 12, 21 ], [ 16, 20 ], [ 20, 21 ], [ 14, 24 ], [ 18, 24 ] ]) P.oval(x, y, 1, 1, "#fff8d8").p(x - 1, y - 1, "#ffffff");
    P.r(15, 15, 3, 3, "#8a9096").r(15, 15, 1, 3, "#c8ccd0");
  });
  def("ivStand", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#b8bec4");
    P.shadow(16, B - 2, 10, 3, .4);
    for (const [x, y] of [ [ 5, B - 2 ], [ 27, B - 2 ], [ 10, B ], [ 22, B ], [ 16, B - 5 ] ]) {
      P.line(16, B - 3, x, y - 1, M[2]);
      P.r(x - 1, y - 1, 3, 2, "#18191c").p(x - 1, y - 1, "#5a5e64");
    }
    P.r(14, B - 5, 5, 3, M[3]).r(14, B - 5, 5, 1, M[5]);
    P.r(15, 6, 2, B - 10, M[3]).r(15, 6, 1, B - 10, M[5]).r(16, 6, 1, B - 10, M[1]);
    P.r(8, 5, 17, 2, M[3]).r(8, 5, 17, 1, M[5]).r(8, 7, 1, 2, M[2]).r(24, 7, 1, 2, M[2]);
    box(P, 11, B - 36, 10, 3, 9, "#d8d8d0", {
      fi: 3
    });
    P.r(12, B - 32, 6, 3, "#1a2a30").r(13, B - 31, 3, 1, "#5ad0e0").p(19, B - 31, "#e84a3a");
    const bag = (x, c1, c2, lv) => {
      P.r(x, 9, 7, 13, c1).r(x, 9, 7, 1, "#f4fbff").r(x, 9, 1, 13, "#f4fbff").r(x + 6, 9, 1, 13, sh(c1, -.2));
      P.r(x + 1, 9 + lv, 5, 12 - lv, c2).r(x + 1, 9 + lv, 5, 1, sh(c2, .3));
      P.r(x + 1, 11, 4, 3, "#f0f0e8");
      P.r(x + 2, 22, 3, 3, "#d8e8ee").p(x + 3, 23, c2);
      P.r(x + 3, 7, 1, 2, M[2]);
    };
    bag(6, "#d8ecf4", "#a8d0e0", 4);
    P.line(9, 25, 10, 34, "#d0e0e6").line(10, 34, 14, 42, "#d0e0e6").line(14, 42, 13, B - 10, "#c0d0d6").line(13, B - 10, 6, B - 6, "#c0d0d6");
    if (v % 2) bag(19, "#e8d0d0", "#8a1a1e", 3);
  });
  def("sink", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, W = "#d8d8d0", R = RP(W);
    P.shadow(16, B - 1, 9, 3, .4);
    post(P, 12, B - 16, 8, 15, W);
    P.r(11, B - 2, 10, 2, R[2]).r(11, B - 2, 10, 1, R[3]);
    P.r(4, B - 30, 24, 13, R[4]).r(5, B - 31, 22, 1, R[5]).r(4, B - 30, 1, 13, R[5]).r(27, B - 30, 1, 13, R[2]);
    P.oval(16, B - 23, 9, 4, R[1]).oval(16, B - 23, 8, 3, R[3]).oval(16, B - 22, 7, 2, R[2]).r(9, B - 26, 14, 1, R[1]);
    P.oval(16, B - 22, 1, 0, "#2a2c30").r(15, B - 23, 3, 1, "#8a8c86");
    box(P, 4, B - 17, 24, 0, 4, W, {
      fi: 3
    });
    cut(P, 4, B - 14, 27, B - 14);
    P.r(15, B - 33, 2, 4, "#b8c0c4").r(15, B - 33, 4, 2, "#b8c0c4").r(15, B - 33, 4, 1, "#e8f0f4").r(18, B - 31, 1, 1, "#8a9298");
    P.r(9, B - 31, 3, 2, "#b8c0c4").p(10, B - 31, "#c84040").r(20, B - 31, 3, 2, "#b8c0c4").p(21, B - 31, "#4060c0");
    drip(P, 18, B - 28, 5, "rgba(130,80,30,0.35)");
    P.r(6, B - 29, 4, 2, "#e8d8a0").r(6, B - 29, 4, 1, "#f8ecc0");
    grime(P, 5, B - 16, 22, 3, g, 4, "rgba(120,100,50,0.2)");
  });
  def("toilet", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, W = "#dcdcd4", R = RP(W);
    P.shadow(16, B - 2, 9, 3, .42);
    box(P, 8, B - 36, 16, 4, 11, W, {
      fi: 3
    });
    P.r(9, B - 36, 14, 1, R[5]).r(10, B - 34, 2, 1, "#a8b0b4");
    P.r(9, B - 30, 14, 10, R[4]).r(10, B - 31, 12, 1, R[5]).r(9, B - 30, 1, 10, R[5]).r(22, B - 30, 1, 10, R[2]).r(9, B - 21, 14, 1, R[2]);
    P.oval(16, B - 14, 9, 6, R[2]).oval(16, B - 15, 9, 5, R[4]).oval(16, B - 14, 6, 3, R[1]).oval(16, B - 13, 5, 2, "#6a7a5a").p(14, B - 14, "#9aaa8a");
    P.r(8, B - 18, 16, 1, R[5]);
    P.r(11, B - 8, 10, 7, R[3]).r(11, B - 8, 1, 7, R[4]).r(20, B - 8, 1, 7, R[1]).r(10, B - 2, 12, 2, R[2]);
    grime(P, 10, B - 12, 12, 10, g, 5, "rgba(140,120,40,0.22)");
    if (v % 3 === 1) P.line(20, B - 30, 17, B - 24, R[0]).line(17, B - 24, 18, B - 22, R[0]);
  });
  def("bathtub", 2, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, W = "#dcdcd4", R = RP(W);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 30, 60, 6, 26, W, {
      fi: 3
    });
    P.r(3, B - 30, 58, 1, R[5]);
    P.r(6, B - 27, 52, 8, R[1]).r(7, B - 26, 50, 6, v % 2 ? "#6a9ab0" : "#7aa8b8").r(8, B - 26, 48, 1, "#a8d0e0").r(7, B - 21, 50, 1, "#4a7a90");
    for (let k = 0; k < 5; k++) P.p(10 + g.i(44), B - 25 + g.i(4), "#d8f0f8");
    P.r(50, B - 36, 2, 7, "#b8c0c4").r(50, B - 36, 6, 2, "#b8c0c4").r(50, B - 36, 6, 1, "#e8f0f4").r(55, B - 34, 1, 2, "#8a9298");
    P.r(44, B - 33, 3, 2, "#b8c0c4").p(45, B - 33, "#c84040").r(58, B - 33, 3, 2, "#b8c0c4").p(59, B - 33, "#4060c0");
    P.r(4, B - 4, 56, 2, R[1]);
    grime(P, 4, B - 16, 56, 12, g, 6, "rgba(120,110,60,0.16)");
    if (v % 3 === 1) {
      P.r(8, B - 34, 10, 4, "#e8d8a0").r(8, B - 34, 10, 1, "#f8ecc0");
    }
  });
  def("shower", 1, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#9aa2a8");
    sbox(P, 2, B - 3, 28, 5, .4);
    P.r(3, B - 6, 26, 5, "#c8c8c0").r(3, B - 6, 26, 1, "#e0e0d8").r(4, B - 5, 24, 3, "#a8b0b4").oval(16, B - 4, 2, 1, "#4a5258");
    glass(P, 4, B - 64, 24, 58, {});
    P.r(4, B - 64, 24, 2, M[4]).r(4, B - 64, 2, 58, M[4]).r(26, B - 64, 2, 58, M[2]).r(4, B - 8, 24, 2, M[3]);
    P.r(20, B - 60, 2, 12, "#b8c0c4").r(14, B - 62, 8, 3, "#b8c0c4").r(14, B - 62, 8, 1, "#e8f0f4");
    for (let k = 0; k < 6; k++) P.p(13 + k * 2, B - 58 + k % 2, "#cfe8f0");
    P.line(8, B - 50, 8, B - 20, "rgba(255,255,255,0.35)").line(11, B - 46, 11, B - 14, "rgba(255,255,255,0.22)");
    P.r(6, B - 30, 5, 3, "#e8d8a0").r(6, B - 30, 5, 1, "#f8ecc0");
  });
  def("washer", 1, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, base = v % 2 ? "#d8d8d0" : "#c8ccd4", R = RP(base);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 4, B - 50, 24, 10, 40, base, {
      fi: 3
    });
    P.r(6, B - 39, 20, 5, R[1]).r(7, B - 38, 6, 3, "#2a3038").r(15, B - 38, 3, 3, "#4a8ad0").p(16, B - 37, "#8ad0ff").r(20, B - 38, 4, 3, "#3a3e44");
    P.oval(16, B - 21, 9, 9, R[1]).oval(16, B - 21, 8, 8, "#3a4048").oval(16, B - 21, 6, 6, "#1e2228").oval(15, B - 22, 3, 2, "rgba(255,255,255,0.25)");
    if (v % 3 === 1) P.oval(16, B - 20, 5, 4, "#4a6a8a").oval(16, B - 21, 3, 2, "#e8e8e0");
    P.r(5, B - 7, 22, 4, R[1]);
  });
  def("clock", 1, 1, 52, (P, w, h, up, g, v, col) => {
    const B = h - 2 - 22, R = RP(col);
    P.oval(16, B - 40, 10, 10, R[1]).oval(16, B - 41, 10, 10, R[3]).oval(16, B - 41, 8, 8, "#f0ecdc").oval(16, B - 41, 8, 8, "#f0ecdc");
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      P.p(Math.round(16 + Math.sin(a) * 6.5), Math.round(B - 41 - Math.cos(a) * 6.5), k % 3 ? "#8a8478" : "#2a2622");
    }
    const hh = v * 5 % 12, mm = v * 17 % 60;
    P.line(16, B - 41, Math.round(16 + Math.sin(hh / 12 * 6.283) * 4), Math.round(B - 41 - Math.cos(hh / 12 * 6.283) * 4), "#2a2622");
    P.line(16, B - 41, Math.round(16 + Math.sin(mm / 60 * 6.283) * 6), Math.round(B - 41 - Math.cos(mm / 60 * 6.283) * 6), "#2a2622");
    P.p(16, B - 41, "#c84040");
    P.r(15, B - 52, 2, 3, R[2]);
  }, {
    color: "#6a4a2a"
  });
  def("nightstand", 1, 1, 16, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 3, B - 3, 26, 5, .42);
    box(P, 5, B - 24, 22, 6, 18, col);
    grain(P, 6, B - 23, 20, 4, col, g, 5);
    P.r(7, B - 16, 18, 6, R[2]).r(7, B - 16, 18, 1, R[4]).r(15, B - 14, 2, 2, "#c8a040");
    P.r(7, B - 9, 18, 5, R[2]).r(7, B - 9, 18, 1, R[4]).r(15, B - 7, 2, 2, "#c8a040");
    P.r(14, B - 30, 4, 6, "#3a3a3c").r(11, B - 36, 10, 6, "#e8d8a0").r(11, B - 36, 10, 1, "#f8ecc0").r(11, B - 31, 10, 1, "#b8a870");
  }, {
    color: "#8a6a40"
  });
  def("singleBed", 1, 2, 18, (P, w, h, up, g, v, col) => {
    const B = h - 2, Rl = RP(col), F = RP("#8a6a40");
    sbox(P, 1, B - 5, 30, 7, .42);
    box(P, 3, 6, 26, 4, 12, "#8a6a40", {
      fi: 3
    });
    grain(P, 4, 7, 24, 3, "#8a6a40", g, 5);
    const ty = 18, by = B - 6;
    P.r(3, ty, 26, by - ty, "#e8e6dc").r(3, ty, 1, by - ty, "#f4f2ea").r(28, ty, 1, by - ty, "#b8b6ae");
    P.r(6, ty + 3, 20, 9, "#f4f4ee").r(6, ty + 11, 20, 1, "#c8c8c0").r(25, ty + 4, 1, 7, "#d8d8d0").p(8, ty + 4, "#ffffff");
    const fy = ty + 18;
    P.r(3, fy, 26, by - fy, Rl[3]).r(3, fy, 26, 3, Rl[5]).r(3, fy + 3, 26, 1, Rl[2]).r(3, fy, 1, by - fy, Rl[4]).r(28, fy, 1, by - fy, Rl[1]);
    for (let k = 0; k < 3; k++) {
      const y = fy + 8 + k * 7 + g.i(3);
      P.line(6 + g.i(4), y, 18 + g.i(6), y + 2, Rl[2]);
    }
    P.r(3, by, 26, 4, F[2]).r(3, by, 26, 1, F[4]).r(3, by + 3, 26, 1, F[0]);
  }, {
    color: "#5a6a8a"
  });
  def("bunkBed", 1, 2, 44, (P, w, h, up, g, v, col) => {
    const B = h - 2, M = RP("#5a6068"), Rl = RP(col), Rl2 = RP(mix(col, "#ffffff", .3));
    sbox(P, 1, B - 5, 30, 7, .42);
    const bunk = (ty, by, R) => {
      P.r(4, ty, 24, by - ty, "#e8e6dc").r(4, ty, 1, by - ty, "#f4f2ea").r(27, ty, 1, by - ty, "#b8b6ae");
      P.r(7, ty + 2, 18, 7, "#f4f4ee").r(7, ty + 8, 18, 1, "#c8c8c0");
      P.r(4, ty + 13, 24, by - ty - 13, R[3]).r(4, ty + 13, 24, 2, R[5]).r(4, ty + 15, 24, 1, R[2]);
    };
    bunk(B - 46, B - 8, Rl);
    P.r(2, B - 50, 28, 3, M[3]).r(2, B - 50, 28, 1, M[5]);
    bunk(4, B - 52, Rl2);
    P.r(2, 2, 28, 3, M[3]).r(2, 2, 28, 1, M[5]);
    for (const x of [ 2, 28 ]) {
      P.r(x, 2, 2, B - 2, M[3]).r(x, 2, 1, B - 2, M[5]);
    }
    for (let y = 8; y < B - 52; y += 9) P.r(26, y, 4, 1, M[4]);
    P.r(24, 6, 2, B - 58, M[2]).r(29, 6, 1, B - 58, M[2]);
  }, {
    color: "#8a4a3a"
  });
  def("vanity", 2, 1, 30, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 3, B - 24, 58, 6, 18, col);
    grain(P, 4, B - 23, 56, 4, col, g, 8);
    for (const x of [ 5, 43 ]) {
      P.r(x, B - 16, 16, 12, R[2]).r(x, B - 16, 16, 1, R[4]).r(x + 7, B - 11, 2, 2, "#c8a040");
    }
    P.r(14, B - 52, 36, 30, R[1]);
    vgrad(P, 15, B - 51, 34, 28, "#a8b8c0", "#5a6a74", 0, 1);
    P.line(17, B - 30, 40, B - 48, "rgba(255,255,255,0.35)");
    P.r(14, B - 53, 36, 1, R[4]).r(14, B - 52, 1, 30, R[4]).r(49, B - 52, 1, 30, R[1]);
    for (let k = 0; k < 5; k++) {
      const x = 24 + k * 4, hh = 3 + g.i(4);
      P.r(x, B - 24 - hh, 2, hh, g.pick([ "#c84a3a", "#e0b040", "#f0a0c0", "#4a8ad0", "#e8e8e0" ])).p(x, B - 24 - hh, "#ffffff");
    }
    P.r(40, B - 28, 5, 4, "#e8d8a0").r(40, B - 28, 5, 1, "#f8ecc0");
  }, {
    color: "#c8b090"
  });
  def("coatRack", 1, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3a3c");
    P.shadow(16, B - 2, 7, 2, .45);
    P.oval(16, B - 3, 7, 2, M[1]).oval(16, B - 4, 7, 2, M[3]);
    P.r(15, 8, 2, B - 12, M[3]).r(15, 8, 1, B - 12, M[5]);
    for (const [dx, y] of [ [ -8, 12 ], [ 8, 14 ], [ -6, 20 ], [ 7, 22 ] ]) {
      P.line(16, y, 16 + dx, y - 4, M[4]);
      P.p(16 + dx, y - 5, M[5]);
    }
    const cs = [ [ "#6a4a3a", 12 ], [ "#3a4a6a", 8 ], [ "#7a3a3a", 16 ] ];
    P.r(6, 10, 7, 24, cs[v % 3][0]).r(6, 10, 7, 1, RP(cs[v % 3][0])[5]).r(6, 10, 1, 24, RP(cs[v % 3][0])[4]);
    P.r(20, 20, 6, 14, cs[(v + 1) % 3][0]).r(20, 20, 6, 1, RP(cs[(v + 1) % 3][0])[5]);
    P.r(22, 36, 6, 7, "#4a5238").r(22, 36, 6, 1, "#6a7258").r(24, 34, 2, 3, "#2a2e20");
    P.oval(16, 12, 3, 2, "#5a4a3a").r(13, 12, 6, 2, "#5a4a3a");
  });
  def("microwave", 1, 1, 20, (P, w, h, up, g, v) => {
    const B = h - 2, S = "#8a8074", Rs = RP(S), M = RP("#c8ccd0");
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 4, B - 22, 24, 6, 18, S);
    P.r(6, B - 14, 20, 8, Rs[2]).r(6, B - 14, 20, 1, Rs[4]).r(15, B - 11, 2, 2, "#c8a040");
    box(P, 3, B - 40, 26, 4, 15, "#c8ccd0", {
      fi: 3
    });
    P.r(5, B - 35, 15, 10, "#1e2228").r(6, B - 34, 13, 8, v % 2 ? "#3a3020" : "#24282e");
    if (v % 2) P.oval(12, B - 30, 4, 3, "#e0b040").oval(12, B - 31, 3, 2, "#f8e0a0");
    P.r(22, B - 35, 5, 10, M[1]).r(23, B - 34, 3, 2, "#4ae06a").r(23, B - 31, 3, 1, M[4]).r(23, B - 29, 3, 1, M[4]).r(23, B - 27, 3, 1, M[4]);
    if (v % 3 === 2) {
      P.r(8, B - 44, 8, 4, "#e8e4d8").r(8, B - 44, 8, 1, "#f8f4e8").r(11, B - 46, 2, 2, "#c84a3a");
    }
  });
  def("waterCooler", 1, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#d8dce0", R = RP(base);
    sbox(P, 3, B - 3, 26, 5, .42);
    box(P, 6, B - 36, 20, 6, 30, base, {
      fi: 3
    });
    P.r(8, B - 26, 16, 6, R[1]).r(9, B - 25, 3, 2, "#c84040").r(13, B - 25, 3, 2, "#4060c0").r(18, B - 25, 5, 3, R[4]);
    P.r(12, B - 19, 8, 3, "#3a4048").r(9, B - 16, 14, 1, "#3a4048");
    P.r(9, B - 54, 14, 20, "#7ab0d8").r(9, B - 54, 14, 1, "#b8e0f8").r(9, B - 54, 1, 20, "#a8d0f0").r(22, B - 54, 1, 20, "#4a80a8").r(11, B - 50, 3, 12, "rgba(255,255,255,0.35)");
    P.r(10, B - 58, 12, 4, "#5a8ab0").r(10, B - 58, 12, 1, "#7aaad0");
    P.oval(16, B - 40, 7, 2, "#4a80a8");
  });
  def("cupboard", 2, 1, 40, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .45);
    box(P, 3, B - 66, 58, 8, 58, col);
    grain(P, 4, B - 65, 56, 6, col, g, 10);
    const fy = B - 57;
    for (const x of [ 5, 33 ]) {
      P.r(x, fy, 26, 26, R[1]);
      glass(P, x + 1, fy + 1, 24, 24, {});
      P.r(x + 1, fy + 1, 24, 1, "rgba(255,255,255,0.35)");
      for (let k = 0; k < 3; k++) {
        const y = fy + 8 + k * 8;
        P.r(x + 2, y, 22, 1, R[4]);
        for (let j = 0; j < 3; j++) {
          const px = x + 4 + j * 7;
          P.r(px, y - 4, 5, 4, g.pick([ "#e8e4d8", "#c8d8e8", "#e8c8a8" ])).r(px, y - 4, 5, 1, "#ffffff");
        }
      }
    }
    P.r(5, fy + 27, 26, 1, R[0]).r(33, fy + 27, 26, 1, R[0]);
    for (const x of [ 5, 33 ]) {
      P.r(x, fy + 29, 26, 26, R[3]).r(x, fy + 29, 26, 1, R[4]).r(x + 1, fy + 30, 24, 24, R[2]);
      vgrain(P, x + 2, fy + 31, 22, 22, R[2], g, 8);
      P.r(x + 12, fy + 40, 2, 3, "#c8a040");
    }
    P.r(31, fy, 2, 55, R[0]);
  }, {
    color: "#a07850"
  });
  def("diningTable", 2, 1, 22, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), L = RP("#5a4a34");
    sbox(P, 2, B - 3, 60, 5, .38);
    for (const x of [ 6, 54 ]) {
      P.r(x, B - 22, 4, 20, L[2]).r(x, B - 22, 1, 20, L[4]);
    }
    box(P, 2, B - 36, 60, 14, 4, col);
    grain(P, 3, B - 35, 58, 12, col, g, 10);
    for (const cx of [ 16, 32, 48 ]) {
      P.oval(cx, B - 29, 6, 3, "#e8e4d8").oval(cx, B - 30, 6, 3, "#f4f2ea").oval(cx, B - 30, 4, 2, "#d8d4c8");
      if (v % 2) P.oval(cx, B - 30, 2, 1, g.pick([ "#c84a3a", "#e0b040", "#5aa05a" ]));
    }
    P.r(24, B - 34, 3, 4, "#a8c8d8").r(24, B - 34, 3, 1, "#e8f4f8").r(40, B - 33, 3, 3, "#a8c8d8").r(40, B - 33, 3, 1, "#e8f4f8");
    if (v % 3 === 2) {
      P.r(29, B - 38, 6, 3, "#e8d8a0").r(29, B - 38, 6, 1, "#f8ecc0");
    }
  }, {
    color: "#a07850"
  });
  def("fan", 1, 1, 32, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#5a6068"), W = RP("#d8dce0");
    P.shadow(16, B - 2, 7, 2, .45);
    P.oval(16, B - 3, 7, 2, W[1]).oval(16, B - 4, 7, 2, W[3]).r(15, B - 26, 2, 22, M[3]).r(15, B - 26, 1, 22, M[5]);
    P.oval(16, B - 36, 11, 11, M[1]).oval(16, B - 37, 11, 11, W[2]).oval(16, B - 37, 9, 9, "#2a2e34");
    for (let k = 0; k < 3; k++) {
      const a = (k / 3 + v * .11) * Math.PI * 2;
      P.line(16, B - 37, Math.round(16 + Math.cos(a) * 8), Math.round(B - 37 + Math.sin(a) * 8), W[4]);
      P.line(16, B - 36, Math.round(16 + Math.cos(a + .2) * 7), Math.round(B - 36 + Math.sin(a + .2) * 7), W[3]);
    }
    P.ring(16, B - 37, 10, 10, W[4]);
    for (let a = 0; a < 6.283; a += .7) P.line(16, B - 37, Math.round(16 + Math.cos(a) * 9), Math.round(B - 37 + Math.sin(a) * 9), "rgba(216,220,224,0.35)");
    P.oval(16, B - 37, 2, 2, M[4]);
    P.r(12, B - 8, 8, 3, M[3]).p(14, B - 7, "#4ae06a").p(17, B - 7, "#c84040");
  });
  def("aircon", 1, 1, 62, (P, w, h, up, g, v) => {
    const B = h - 2 - 32, W = RP("#e0e4e6");
    box(P, 2, B - 50, 28, 3, 12, "#e0e4e6", {
      fi: 3
    });
    P.r(3, B - 41, 26, 4, W[1]).r(4, B - 40, 24, 1, W[4]).r(4, B - 39, 24, 1, W[3]);
    P.r(22, B - 45, 5, 2, "#2a3038").p(23, B - 45, v % 2 ? "#4ae06a" : "#3a4048").p(25, B - 45, "#c84040");
    P.r(4, B - 46, 12, 1, W[5]);
  });
  def("bathCabinet", 1, 1, 62, (P, w, h, up, g, v) => {
    const B = h - 2 - 28, W = RP("#e0e0d8");
    box(P, 4, B - 56, 24, 3, 24, "#e0e0d8", {
      fi: 3
    });
    P.r(6, B - 51, 20, 18, W[1]);
    vgrad(P, 7, B - 50, 18, 16, "#a8b8c0", "#5a6a74", 0, 1);
    P.line(9, B - 36, 22, B - 49, "rgba(255,255,255,0.35)");
    P.r(4, B - 30, 24, 2, W[3]).r(4, B - 30, 24, 1, W[5]);
    P.r(6, B - 28, 5, 3, "#e8d8a0").r(6, B - 28, 5, 1, "#f8ecc0").r(12, B - 27, 3, 2, "#4a8ad0").r(16, B - 28, 2, 3, "#c84a3a").r(19, B - 27, 4, 2, "#5aa05a");
    P.r(4, B - 24, 24, 2, "rgba(0,0,0,0.25)");
  });
  def("prepCounter", 2, 1, 14, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), Rt = RP("#b8b4a8");
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 30, 60, 12, 3, "#b8b4a8");
    P.noise(3, B - 29, 58, 10, [ Rt[3], Rt[5] ], .1, g);
    box(P, 2, B - 15, 60, 0, 12, col, {
      flat: true
    });
    for (const x of [ 5, 33 ]) {
      P.r(x, B - 13, 26, 9, R[2]).r(x, B - 13, 26, 1, R[4]).r(x + 12, B - 9, 2, 2, "#c8a040");
    }
    P.r(8, B - 27, 18, 8, "#c8a878").r(8, B - 27, 18, 1, "#e8c898").r(8, B - 20, 18, 1, "#8a6a48");
    P.r(12, B - 30, 12, 1, "#c8ccd0").r(11, B - 31, 3, 2, "#3a2a1e");
    for (let k = 0; k < 4; k++) P.oval(34 + k * 6, B - 25 + k % 2, 2, 2, g.pick([ "#c84a3a", "#5aa05a", "#e0b040", "#e08040" ]));
    P.r(48, B - 32, 8, 6, "#9aa2a8").r(48, B - 32, 8, 1, "#c8d0d4").r(56, B - 31, 3, 1, "#5a5e64");
  }, {
    color: "#6a5a4a"
  });
  def("dresser", 1, 1, 28, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 4, B - 50, 24, 6, 44, col);
    grain(P, 5, B - 49, 22, 4, col, g, 5);
    for (let k = 0; k < 4; k++) {
      const y = B - 43 + k * 10;
      P.r(6, y, 20, 8, R[2]).r(6, y, 20, 1, R[4]).r(6, y + 7, 20, 1, R[0]).r(15, y + 3, 2, 2, "#c8a040");
    }
    if (v % 2) {
      P.r(8, B - 56, 6, 6, "#4a5a3a").r(8, B - 56, 6, 1, "#6a7a5a").r(10, B - 60, 2, 4, "#5aa05a").oval(11, B - 60, 3, 2, "#5aa05a");
    }
  }, {
    color: "#8a6a40"
  });
  A.defPropRot("clock", {
    noRot: true
  });
  A.defPropRot("aircon", {
    noRot: true
  });
  A.defPropRot("bathCabinet", {
    noRot: true
  });
  A.defPropRot("coatRack", {
    sym: true
  });
  const CARB = [ "#b8b6ae", "#9a3a32", "#34466a", "#d8903a", "#6b6f73", "#3a4a3a" ];
  def("car", 3, 2, 8, (P, w, h, up, g, v) => {
    const k = v % 6;
    sedan(P, w, h, g, v, CARB[k], k === 3);
  });
  function sedan(P, w, h, g, v, body, taxi, noRack) {
    const B = h - 2, R = RP(body);
    const GL = "#2c3c46", Rg = RP(GL);
    sbox(P, 1, B - 12, 94, 14, .5);
    P.r(8, B - 8, 80, 6, DK(.5));
    const tY = B - 54, INS = [ 5, 3, 2, 1, 1 ];
    for (let r = 0; r < 34; r++) {
      const ins = INS[Math.min(r, 33 - r)] || 0;
      const c = r < 3 ? R[3] : r < 8 ? mix(R[3], R[4], .5) : r === 33 ? R[5] : R[4];
      P.r(3 + ins, tY + r, 90 - ins * 2, 1, c);
      P.r(3 + ins, tY + r, 2, 1, R[3]).r(91 - ins, tY + r, 2, 1, r < 30 ? R[3] : R[4]);
    }
    P.r(20, tY + 3, 1, 28, R[2]);
    P.r(74, tY + 10, 16, 1, R[3]).r(74, tY + 24, 16, 1, R[3]).r(74, tY + 11, 16, 1, R[5]).r(74, tY + 25, 16, 1, R[5]);
    P.noise(4, tY + 1, 88, 32, [ R[5], R[3], "#9a9282" ], .05, g);
    P.r(89, tY + 5, 2, 4, "#f0e8c8").r(89, tY + 26, 2, 4, "#f0e8c8").p(89, tY + 5, "#ffffff");
    P.r(5, tY + 5, 2, 4, "#c03a30").r(5, tY + 26, 2, 4, "#c03a30");
    P.poly([ [ 34, B - 58 ], [ 33, B - 47 ], [ 34, B - 36 ], [ 22, B - 23 ], [ 20, B - 37 ], [ 22, B - 51 ] ], Rg[2]);
    P.line(33, B - 57, 23, B - 50, Rg[4]).line(21, B - 49, 21, B - 26, "rgba(0,0,0,0.35)");
    polyf(P, [ [ 56, B - 58 ], [ 57, B - 47 ], [ 56, B - 36 ], [ 69, B - 23 ], [ 71, B - 37 ], [ 69, B - 51 ] ], y => y < B - 49 ? "#6a8ea0" : y < B - 40 ? "#4e7082" : y < B - 31 ? "#3e5a6a" : "#324a58");
    for (let d = 2; d < 22; d += 7) {
      P.line(58, B - 38 - d, 67, B - 28 - d, "#9ab8c4");
      P.line(59, B - 38 - d, 68, B - 28 - d, "#6a8a9a");
    }
    P.line(56, B - 58, 69, B - 51, R[5]).line(70, B - 50, 70, B - 25, "rgba(0,0,0,0.35)");
    P.line(62, B - 29, 67, B - 43, "#141619").line(64, B - 29, 69, B - 40, "#141619");
    P.r(34, B - 58, 22, 22, R[4]);
    vgrad(P, 34, B - 58, 22, 22, R[3], R[5], .05, .85);
    P.r(34, B - 58, 22, 1, R[2]).r(34, B - 37, 22, 1, R[5]).r(34, B - 58, 1, 22, R[5]).r(55, B - 58, 1, 22, R[3]);
    cut(P, 34, B - 58, 55, B - 58);
    P.noise(35, B - 57, 20, 20, [ "#a09888", R[5], R[3] ], .1, g);
    if (v % 4 === 2 && !taxi && !noRack) {
      for (const x of [ 37, 52 ]) P.r(x, B - 57, 2, 20, "#2a2c30").r(x, B - 57, 1, 20, "#5a5e64");
      P.r(39, B - 54, 12, 13, "#4a5a3a").r(39, B - 54, 12, 2, "#6a7a52").r(44, B - 54, 2, 13, "#2a2c28");
    }
    P.poly([ [ 22, B - 22 ], [ 34, B - 36 ], [ 56, B - 36 ], [ 69, B - 22 ] ], R[2]);
    P.poly([ [ 25, B - 23 ], [ 35, B - 34 ], [ 44, B - 34 ], [ 44, B - 23 ] ], GL);
    P.poly([ [ 47, B - 23 ], [ 47, B - 34 ], [ 55, B - 34 ], [ 66, B - 23 ] ], GL);
    P.line(27, B - 24, 35, B - 33, Rg[4]).line(51, B - 24, 53, B - 33, Rg[4]).line(53, B - 24, 55, B - 33, Rg[3]);
    P.r(44, B - 36, 3, 13, R[1]).r(44, B - 36, 1, 13, R[2]);
    P.r(3, B - 21, 90, 15, R[3]);
    vgrad(P, 3, B - 21, 90, 15, R[3], R[1], .4, .95);
    P.r(3, B - 21, 90, 1, R[5]).r(3, B - 20, 90, 1, R[4]).r(3, B - 14, 90, 1, R[2]).r(3, B - 13, 90, 1, R[4]);
    cut(P, 3, B - 21, 92, B - 21, 3, B - 7, 92, B - 7);
    for (const x of [ 44, 67 ]) P.r(x, B - 21, 1, 14, R[1]);
    P.r(38, B - 18, 4, 1, R[5]).r(38, B - 17, 4, 1, R[1]).r(61, B - 18, 4, 1, R[5]).r(61, B - 17, 4, 1, R[1]);
    P.r(66, B - 26, 5, 4, R[2]).r(66, B - 26, 5, 1, R[4]).r(70, B - 25, 1, 3, R[0]);
    P.r(88, B - 20, 5, 4, "#e8e0c0").r(88, B - 20, 5, 1, "#fffbe8").r(89, B - 16, 4, 2, "#e0902a");
    P.r(3, B - 20, 3, 4, "#b02a24").r(3, B - 20, 3, 1, "#e06050");
    P.r(2, B - 9, 92, 4, "#2a2c30").r(2, B - 9, 92, 1, "#4a4d54");
    for (const cx of [ 21, 75 ]) {
      P.oval(cx, B - 7, 9, 7, "#121316");
      const flat = cx === 75 && v % 2 ? 1 : 0;
      P.oval(cx, B - 5 + flat, 7, 5 - flat, "#1e1f23");
      P.r(cx - 7, B - 1, 15, 1, "#101114").r(cx - 5, B - 9 + flat, 10, 1, "#34363b");
      P.oval(cx, B - 5 + flat, 4, 3 - flat, "#6a6e74");
      P.oval(cx, B - 5 + flat, 2, 1, "#8a9098");
      P.p(cx - 2, B - 7 + flat, "#b8bec4");
      P.p(cx, B - 5 + flat, "#3a3d42");
    }
    rust(P, 4, B - 21, 88, 13, g, 10);
    rust(P, 6, tY + 2, 84, 30, g, 6);
    for (let i = 0; i < 3; i++) {
      const x = 8 + g.i(76), y = B - 19 + g.i(8);
      P.r(x, y, 3, 2, R[1]).p(x, y, R[5]);
    }
    crack(P, 62, B - 44, g, 8, "#c8dce4");
    P.oval(62, B - 44, 1, 1, "#0e1014");
    if (v % 3 !== 1) {
      P.poly([ [ 48, B - 23 ], [ 48, B - 32 ], [ 53, B - 29 ], [ 51, B - 26 ], [ 58, B - 23 ] ], "#0e1014");
      for (let i = 0; i < 7; i++) P.p(44 + g.i(22), B + g.i(2) - 1, "#a8c0c8");
    }
    for (let i = 0; i < 3; i++) P.p(24 + i * 3 + g.i(2), B - 17 + g.i(3), "#0e0f12");
    if (taxi) {
      box(P, 37, B - 55, 17, 3, 8, "#e8c040");
      P.r(38, B - 51, 15, 5, "#f4f0e0");
      mini(P, 38, B - 51, "TAXI", "#2a2410", 15);
      P.r(46, B - 19, 16, 3, "#2a2c30");
      for (let i = 0; i < 8; i++) P.p(46 + i * 2, B - 18 + (i & 1), "#e8e4d8");
    }
  }
  def("bus", 5, 2, 16, (P, w, h, up, g, v) => {
    busSide(P, w, h, g, v, [ "#3f6fa8", "#3f8a5a", "#b8a040" ][v % 3]);
  });
  A.busSide = busSide;
  function busSide(P, w, h, g, v, body, o) {
    const B = h - 2, R = RP(body), GL = "#26343c", Rg = RP(GL), Gy = RP("#6a6e74");
    sbox(P, 1, B - 12, 158, 14, .5);
    const tY = B - 74;
    P.r(4, tY, 152, 36, Gy[4]);
    P.r(3, tY + 2, 154, 32, Gy[4]);
    vgrad(P, 4, tY, 152, 12, Gy[3], Gy[4], .1, .9);
    P.r(3, B - 39, 154, 1, Gy[5]).r(3, B - 38, 154, 1, R[4]);
    P.noise(4, tY + 1, 152, 34, [ Gy[3], Gy[5], "#8a8272" ], .08, g);
    for (const [x, ww] of [ [ 30, 34 ], [ 96, 30 ] ]) {
      box(P, x, tY + 6, ww, 16, 4, "#9aa0a4");
      for (let i = x + 3; i < x + ww - 3; i += 3) P.r(i, tY + 8, 1, 12, "#6a7074");
    }
    for (const x of [ 74, 134 ]) {
      box(P, x, tY + 10, 10, 10, 2, "#7a7e84");
      P.r(x + 2, tY + 12, 6, 6, "#5a5e64");
    }
    rust(P, 5, tY + 2, 150, 32, g, 10);
    const sy = B - 38;
    P.r(2, sy, 156, 34, R[3]);
    vgrad(P, 2, sy + 16, 156, 18, R[3], R[1], .4, 1);
    P.r(2, sy, 156, 1, R[5]).r(2, sy + 16, 156, 2, "#d8dcd8").r(2, sy + 18, 156, 1, "#9a9e9a").r(2, sy + 28, 156, 6, "#2a3440").r(2, sy + 28, 156, 1, "#4a5460");
    for (let x = 6; x < 130; x += 16) {
      if (x >= 68 && x < 84) continue;
      P.r(x, sy + 3, 14, 11, GL);
      P.r(x, sy + 3, 14, 1, Rg[4]);
      P.line(x + 2, sy + 12, x + 7, sy + 4, Rg[4]).line(x + 4, sy + 12, x + 9, sy + 4, Rg[3]);
      if (g.chance(.35)) {
        P.r(x + 3 + g.i(5), sy + 5 + g.i(3), 5, 4, "#0c0e12");
        crack(P, x + 6, sy + 7, g, 4, "#9ab0b8");
      }
    }
    for (const x of [ 70, 138 ]) {
      P.r(x, sy + 3, 12, 27, "#1a1e22").r(x + 1, sy + 4, 5, 25, GL).r(x + 6, sy + 4, 5, 25, GL).r(x + 1, sy + 4, 1, 25, Rg[4]).r(x + 6, sy + 4, 1, 25, Rg[4]).r(x, sy + 16, 12, 1, "#3a3d42");
    }
    P.r(151, sy + 2, 6, 24, GL).r(151, sy + 2, 1, 24, Rg[4]).r(150, sy + 2, 1, 26, R[1]);
    if (!o) {
      P.r(128, sy + 1, 8, 5, "#101214");
      for (let i = 0; i < 4; i++) P.p(129 + i * 2, sy + 3, "#f0a030");
      P.r(10, sy + 19, 26, 9, "#e8e4d8").r(10, sy + 19, 26, 1, "#fffbef");
      label(P, 10, sy + 20, [ "서울시", "대피소", "우유" ][v % 3], "#2a4aa0", 7, 26);
      P.r(101, sy + 20, 13, 7, "#e8e4d8");
      mini(P, 101, sy + 21, [ "143", "602", "7011" ][v % 3].slice(0, 3), "#b0302a", 13);
    } else {
      P.r(116, sy + 3, 20, 9, "#101214").r(116, sy + 3, 20, 1, "#2a2c30");
      mini(P, 116, sy + 5, o.route, "#f0a030", 20);
      P.oval(10, sy + 23, 5, 5, "#f4f0e0").oval(10, sy + 23, 4, 4, o.rc);
      mini(P, 9, sy + 21, o.letter, "#f4f0e0");
      P.r(8, sy + 4, 14, 7, "#101214");
      mini(P, 8, sy + 5, o.route.slice(0, 3), "#f0a030", 14);
    }
    P.line(40, sy + 22, 60, sy + 26, "#b83a8a").line(42, sy + 26, 58, sy + 21, "#e0e040").line(44, sy + 20, 52, sy + 27, "#b83a8a");
    for (const cx of [ 30, 118 ]) {
      P.oval(cx, B - 8, 11, 8, "#101114");
      P.oval(cx, B - 6, 9, 6, "#1e1f23");
      P.oval(cx, B - 6, 5, 4, "#5a5e64").oval(cx, B - 6, 2, 2, "#8a9098");
      P.p(cx - 3, B - 8, "#b8bec4");
    }
    rust(P, 3, sy + 18, 154, 16, g, 18);
    for (let i = 0; i < 6; i++) drip(P, 6 + g.i(148), sy + 19, 4 + g.i(8), "rgba(110,55,25,0.35)");
    {
      const a = SX.adOf ? SX.adOf("bus") : {
        brand: "광고",
        sub: "AD",
        bg: "#f2d034",
        fg: "#1c1c1c",
        acc: "#d8402a"
      };
      P.r(43, sy + 13, 58, 17, "#1c1d20").r(44, sy + 14, 56, 15, a.bg).r(44, sy + 14, 56, 2, a.acc).r(44, sy + 27, 56, 2, a.acc);
      label(P, 44, sy + 17, a.brand, a.fg, 11, 34);
      mini(P, 78, sy + 19, a.sub, a.acc, 20);
    }
    P.r(2, sy, 1, 34, R[4]).r(157, sy, 1, 34, R[1]);
  }
  const vWheel = (P, cx, B, t, flat) => {
    const f = flat ? 1 : 0;
    P.oval(cx, B - t, t + 2, t, "#121316");
    P.oval(cx, B - t + 2 + f, t, t - 2 - f, "#1e1f23");
    P.r(cx - t, B - 1, 2 * t + 1, 1, "#101114").r(cx - t + 2, B - 2 * t + 5 + f, 2 * t - 4, 1, "#34363b");
    P.oval(cx, B - t + 2 + f, Math.round(t * .57), Math.round(t * .43) - f, "#6a6e74");
    P.oval(cx, B - t + 2 + f, Math.max(1, (t >> 1) - 1), 1, "#8a9098");
    P.p(cx - 2, B - t + f, "#b8bec4");
    P.p(cx, B - t + 2 + f, "#3a3d42");
  };
  function carL(P, g, v, S) {
    const B = S.B, R = RP(S.col), GL = "#2c3c46", Rg = RP(GL), x0 = S.x0, x1 = S.x1, L = x1 - x0, D = S.D, Bs = B - S.bl, sb = B - 7, tY = Bs - D + 1, rB = Bs - S.hc, rT = rB - S.rd + 1;
    const wr = S.gl[0], ra = S.gl[1], rf = S.gl[2], wf = S.gl[3], rm = Math.round((rT + rB) / 2), dm = Math.round((tY + Bs) / 2);
    sbox(P, x0 - 2, B - 12, L + 4, 14, .5);
    P.r(x0 + 5, B - 8, L - 10, 6, DK(.5));
    const INS = [ 5, 3, 2, 1, 1 ];
    for (let r = 0; r < D; r++) {
      const ins = INS[Math.min(r, D - 1 - r)] || 0, c = r < 3 ? R[3] : r < 8 ? mix(R[3], R[4], .5) : r === D - 1 ? R[5] : R[4];
      P.r(x0 + ins, tY + r, L - ins * 2, 1, c).r(x0 + ins, tY + r, 2, 1, R[3]).r(x1 - 2 - ins, tY + r, 2, 1, r < D - 4 ? R[3] : R[4]);
    }
    if (x1 - wf > 10) {
      const hw = x1 - wf - 7;
      P.r(wf + 4, tY + 10, hw, 1, R[3]).r(wf + 4, tY + 11, hw, 1, R[5]).r(wf + 4, Bs - 10, hw, 1, R[3]).r(wf + 4, Bs - 9, hw, 1, R[5]);
    }
    if (wr - x0 > 8) P.r(wr - 3, tY + 3, 1, D - 6, R[2]);
    P.noise(x0 + 1, tY + 1, L - 2, D - 2, [ R[5], R[3], "#9a9282" ], .05, g);
    P.r(x1 - 4, tY + 5, 2, 4, "#f0e8c8").r(x1 - 4, Bs - 8, 2, 4, "#f0e8c8").p(x1 - 4, tY + 5, "#ffffff");
    P.r(x0 + 2, tY + 5, 2, 4, "#c03a30").r(x0 + 2, Bs - 8, 2, 4, "#c03a30");
    P.poly([ [ ra, rT ], [ ra - 1, rm ], [ ra, rB + 1 ], [ wr, Bs - 2 ], [ wr - 2, dm ], [ wr, tY + 3 ] ], Rg[2]);
    P.line(ra - 1, rT + 1, wr + 1, tY + 4, Rg[4]);
    polyf(P, [ [ rf, rT ], [ rf + 1, rm ], [ rf, rB + 1 ], [ wf, Bs - 2 ], [ wf + 2, dm ], [ wf, tY + 3 ] ], y => y < rT + 9 ? "#6a8ea0" : y < rT + 18 ? "#4e7082" : y < rT + 27 ? "#3e5a6a" : "#324a58");
    for (let d = 3; d < rB - rT - 2; d += 7) P.line(rf + 2, rB - d, wf - 2, Bs - 6 - d, "#9ab8c4");
    P.line(rf, rT, wf, tY + 3, R[5]).line(wf + 1, tY + 4, wf + 1, Bs - 3, "rgba(0,0,0,0.35)");
    P.r(ra, rT, rf - ra, rB - rT + 1, R[4]);
    vgrad(P, ra, rT, rf - ra, rB - rT + 1, R[3], R[5], .05, .85);
    P.r(ra, rT, rf - ra, 1, R[2]).r(ra, rB, rf - ra, 1, R[5]).r(ra, rT, 1, rB - rT + 1, R[5]).r(rf - 1, rT, 1, rB - rT + 1, R[3]);
    cut(P, ra, rT, rf - 1, rT);
    P.noise(ra + 1, rT + 1, rf - ra - 2, rB - rT - 1, [ "#a09888", R[5], R[3] ], .1, g);
    P.poly([ [ wr, Bs - 1 ], [ ra, rB + 1 ], [ rf, rB + 1 ], [ wf, Bs - 1 ] ], R[2]);
    P.poly([ [ wr + 3, Bs - 2 ], [ ra + 1, rB + 3 ], [ rf - 1, rB + 3 ], [ wf - 3, Bs - 2 ] ], GL);
    for (const x of S.pil) P.r(x, rB + 1, 3, Bs - rB - 1, R[1]).r(x, rB + 1, 1, Bs - rB - 1, R[2]);
    for (const x of [ wr + 3 ].concat(S.pil.map(q => q + 3))) P.line(x + 2, Bs - 3, x + 7, rB + 4, Rg[4]);
    P.r(x0, Bs, L, sb - Bs, R[3]);
    vgrad(P, x0, Bs, L, sb - Bs, R[3], R[1], .4, .95);
    P.r(x0, Bs, L, 1, R[5]).r(x0, Bs + 1, L, 1, R[4]).r(x0, Bs + 7, L, 1, R[2]).r(x0, Bs + 8, L, 1, R[4]);
    cut(P, x0, Bs, x1 - 1, Bs, x0, sb, x1 - 1, sb);
    for (const x of S.doors) P.r(x, Bs, 1, sb - Bs, R[1]);
    for (const x of S.hdl) P.r(x, Bs + 3, 4, 1, R[5]).r(x, Bs + 4, 4, 1, R[1]);
    P.r(wf - 3, Bs - 5, 5, 4, R[2]).r(wf - 3, Bs - 5, 5, 1, R[4]).r(wf + 1, Bs - 4, 1, 3, R[0]);
    P.r(x1 - 5, Bs + 1, 5, 4, "#e8e0c0").r(x1 - 5, Bs + 1, 5, 1, "#fffbe8").r(x1 - 4, Bs + 5, 4, 2, "#e0902a");
    P.r(x0, Bs + 1, 3, 4, "#b02a24").r(x0, Bs + 1, 3, 1, "#e06050");
    if (S.clad) P.r(x0, sb - 4, L, 4, "#2a2c30").r(x0, sb - 4, L, 1, "#3a3d42");
    P.r(x0 - 1, B - 9, L + 2, 4, "#2a2c30").r(x0 - 1, B - 9, L + 2, 1, "#4a4d54");
    for (const cx of S.wh) {
      if (S.clad) P.oval(cx, B - S.t, S.t + 4, S.t + 2, "#26282c");
      vWheel(P, cx, B, S.t, cx === S.wh[1] && v % 2);
    }
    rust(P, x0 + 1, Bs, L - 2, sb - Bs - 1, g, Math.round(L / 9));
    rust(P, x0 + 3, tY + 2, L - 6, D - 4, g, Math.round(L / 15));
    for (let i = 0; i < 3; i++) {
      const x = x0 + 5 + g.i(L - 12), y = Bs + 2 + g.i(sb - Bs - 6);
      P.r(x, y, 3, 2, R[1]).p(x, y, R[5]);
    }
    crack(P, rf + 5, rm + 3, g, 8, "#c8dce4");
    P.oval(rf + 5, rm + 3, 1, 1, "#0e1014");
    if (v % 3 !== 1) {
      const pa = S.pil[S.pil.length - 1] + 3;
      P.poly([ [ pa + 1, Bs - 2 ], [ pa + 1, rB + 5 ], [ pa + 6, rB + 8 ], [ pa + 4, Bs - 5 ], [ pa + 11, Bs - 2 ] ], "#0e1014");
      for (let i = 0; i < 7; i++) P.p(pa + g.i(22), B + g.i(2) - 1, "#a8c0c8");
    }
    for (let i = 0; i < 3; i++) P.p(x0 + 21 + i * 3 + g.i(2), Bs + 4 + g.i(3), "#0e0f12");
    return {
      B,
      Bs,
      rB,
      rT,
      tY,
      sb,
      R
    };
  }
  const MINIC = [ "#e8e6de", "#c8402e", "#7ab0c8", "#a8c050", "#e0b8b8", "#e0c040" ];
  const MINIS = {
    x0: 12,
    x1: 84,
    bl: 20,
    D: 32,
    hc: 17,
    rd: 22,
    gl: [ 18, 27, 60, 68 ],
    pil: [ 43 ],
    doors: [ 43, 64 ],
    hdl: [ 37, 58 ],
    wh: [ 25, 73 ],
    t: 6
  };
  def("carMini", 3, 2, 8, (P, w, h, up, g, v) => {
    carL(P, g, v, Object.assign({
      B: h - 2,
      col: MINIC[v % 6]
    }, MINIS));
  });
  const SUVC = [ "#1e2024", "#e8e6de", "#a8acb0", "#4a4e54", "#2e3a52", "#3a4a3a" ];
  const SUVS = {
    x0: 4,
    x1: 93,
    bl: 25,
    D: 36,
    hc: 17,
    rd: 26,
    gl: [ 7, 11, 64, 75 ],
    pil: [ 31, 51 ],
    doors: [ 31, 52, 72 ],
    hdl: [ 25, 46 ],
    wh: [ 21, 79 ],
    t: 8,
    clad: true
  };
  def("suv", 3, 2, 16, (P, w, h, up, g, v) => {
    const q = carL(P, g, v, Object.assign({
      B: h - 2,
      col: SUVC[v % 6]
    }, SUVS));
    for (const y of [ q.rT + 3, q.rB - 3 ]) {
      P.r(14, y, 48, 2, "#2a2c30").r(14, y, 48, 1, "#5a5e64");
      for (const x of [ 16, 58 ]) P.r(x, y - 1, 2, 4, "#1a1b1e");
    }
    if (v % 3 === 2) {
      box(P, 22, q.rT + 6, 30, 12, 5, "#3a3d42");
      P.r(24, q.rT + 8, 26, 1, "#5a5e64");
    }
  });
  const TAXC = [ "#dc9a5a", "#e8e6de", "#a8acb0", "#26282c" ];
  def("taxi", 3, 2, 8, (P, w, h, up, g, v) => {
    const k = v % 4, B = h - 2;
    sedan(P, w, h, g, v, TAXC[k], false, true);
    const s = [ [ "#f4f0e0", "#c8602a", "TAXI" ], [ "#e8c040", "#2a2410", "개인" ], [ "#f4f0e0", "#2a64b0", "TAXI" ], [ "#e0b040", "#1a1408", "모범" ] ][k];
    box(P, 37, B - 55, 17, 3, 8, s[0]);
    P.r(38, B - 52, 15, 7, s[0]);
    if (k & 1) label(P, 38, B - 52, s[2], s[1], 7, 15); else mini(P, 38, B - 51, s[2], s[1], 15);
    if (k === 3) P.r(4, B - 14, 88, 1, "#c8a040"); else {
      P.r(46, B - 19, 18, 7, k === 0 ? "#f4f0e0" : "#e8c040");
      mini(P, 46, B - 18, "TAXI", k === 0 ? "#c8602a" : "#2a2410", 18);
    }
  });
  const VANC = [ "#e8e6de", "#a8acb0", "#5a5e64", "#e8c030", "#e8e6de", "#2e3e5e" ];
  const VANS = {
    x0: 8,
    x1: 116,
    bl: 24,
    D: 36,
    hc: 22,
    rd: 30,
    gl: [ 11, 13, 96, 106 ],
    pil: [ 40, 70 ],
    doors: [ 43, 72, 100 ],
    hdl: [ 66, 75 ],
    wh: [ 26, 96 ],
    t: 7
  };
  def("van", 4, 2, 24, (P, w, h, up, g, v) => {
    const k = v % 6, q = carL(P, g, v, Object.assign({
      B: h - 2,
      col: VANC[k]
    }, VANS)), R = q.R, Bs = q.Bs;
    P.r(13, Bs + 2, 30, 1, R[1]).r(13, Bs + 3, 30, 1, R[4]);
    if (k === 3) {
      label(P, 12, Bs + 2, "어린이", "#c8302a", 7, 30);
      for (const [x, y, c] of [ [ 16, q.rT + 2, "#e03a2a" ], [ 90, q.rT + 2, "#e03a2a" ], [ 16, q.rB - 4, "#f0a020" ], [ 90, q.rB - 4, "#f0a020" ] ]) P.r(x, y, 4, 3, c).p(x + 1, y, "#fff0d0");
    }
    if (v % 3 === 2) {
      const x0 = 43, top = q.rB + 2, wd = 29, ht = q.sb - top, sh = 13, im = P.x.getImageData(x0, top, wd, ht);
      P.r(x0, top, wd, ht, "#131518").r(x0, q.sb - 2, wd, 2, "#1e2024");
      for (const x of [ x0 + 14, x0 + 22 ]) P.r(x, top + 6, 5, ht - 12, "#3a2e2a").r(x, top + 6, 5, 1, "#56463a");
      P.r(x0 + 12, q.sb - 9, 16, 4, "#3a2e2a").r(x0 + 12, q.sb - 9, 16, 1, "#56463a");
      P.x.putImageData(im, x0 - sh, top + 1);
      P.r(x0 - sh, q.sb + 1, wd, 1, "rgba(10,12,16,0.45)");
    }
  });
  function cabOver(P, g, v, B, col) {
    const R = RP(col), GL = "#2c3c46", Rg = RP(GL), a = 82, b = 116, cT = B - 50, sb = B - 10, rT = cT - 33;
    P.r(a, rT, b - a - 2, 34, R[4]);
    vgrad(P, a, rT, b - a - 2, 34, R[5], R[4], .05, .5);
    P.r(a, rT, b - a - 2, 1, R[3]).r(a, rT, 1, 34, R[5]).r(b - 3, rT, 1, 34, R[3]).r(b - 6, rT + 2, 1, 30, R[3]);
    cut(P, b - 3, rT, b - 3, rT + 33);
    P.noise(a + 1, rT + 1, b - a - 5, 32, [ R[5], R[3], "#9a9282" ], .05, g);
    P.r(a + 4, rT + 3, 5, 2, "#e0902a").r(a + 4, rT + 29, 5, 2, "#e0902a");
    P.r(a, cT, b - a, sb - cT, R[3]);
    vgrad(P, a, cT, b - a, sb - cT, R[3], R[1], .55, 1);
    P.r(a, cT, b - a, 1, R[5]).r(a, cT + 19, b - a, 1, R[2]).r(a, cT + 20, b - a, 1, R[4]);
    cut(P, b - 1, cT, a, cT);
    P.poly([ [ b - 5, cT + 1 ], [ b - 1, cT + 3 ], [ b - 1, cT + 19 ], [ b - 5, cT + 19 ] ], "#4e7082");
    P.line(b - 4, cT + 4, b - 2, cT + 16, "#9ab8c4");
    P.r(87, cT + 3, 22, 15, R[2]).r(88, cT + 4, 20, 13, GL);
    P.line(90, cT + 15, 96, cT + 5, Rg[4]).line(92, cT + 15, 98, cT + 5, Rg[3]);
    P.r(86, cT + 1, 1, sb - cT - 4, R[1]).r(110, cT + 1, 1, sb - cT - 4, R[1]).r(89, cT + 23, 4, 1, R[5]).r(89, cT + 24, 4, 1, R[1]);
    P.r(b - 5, sb - 13, 5, 4, "#e8e0c0").r(b - 5, sb - 13, 5, 1, "#fffbe8").r(b - 4, sb - 9, 4, 2, "#e0902a");
    P.r(b - 9, sb - 4, 11, 4, "#2a2c30").r(b - 9, sb - 4, 11, 1, "#4a4d54").r(89, sb - 2, 16, 2, "#2a2c30");
    P.line(b, cT + 6, b + 2, cT + 4, "#2a2c30");
    P.r(b + 2, cT - 1, 3, 10, "#2a2c30").r(b + 2, cT - 1, 3, 1, "#4a4e54");
    rust(P, a + 1, cT + 20, b - a - 2, sb - cT - 22, g, 5);
    rust(P, a + 2, rT + 2, b - a - 8, 30, g, 3);
    crack(P, b - 3, cT + 9, g, 5, "#c8dce4");
    vWheel(P, 100, B, 7, v % 4 === 1);
  }
  function chassis(P, B, x0) {
    sbox(P, x0 - 2, B - 12, 120 - x0, 14, .5);
    P.r(x0 + 2, B - 19, 80 - x0, 6, "#1e2024").r(x0 + 2, B - 19, 80 - x0, 1, "#34363b");
    P.r(46, B - 17, 18, 6, "#3a3c40").r(46, B - 17, 18, 1, "#5a5e64").r(48, B - 15, 3, 2, "#6a6e74");
    P.r(x0, B - 15, 3, 7, "#2a2c30").r(40, B - 14, 2, 9, "#1a1a1c");
  }
  function cargo(P, g, c, B) {
    if (c === 0) {
      P.oval(58, B - 40, 7, 4, "#1e1f23").oval(58, B - 40, 3, 2, "#3a3c40");
      P.ring(30, B - 36, 5, 3, "#b8a070").ring(30, B - 36, 3, 2, "#9a8458");
      for (let i = 0; i < 6; i++) P.r(14 + g.i(60), B - 50 + g.i(22), 2 + g.i(3), 1, g.pick([ "#8a8272", "#5a5550", "#a88050" ]));
    } else if (c === 1) {
      for (const [x, y, ww, t, f, col] of [ [ 12, B - 50, 20, 10, 12, "#a87c4a" ], [ 54, B - 46, 20, 10, 10, "#b88a52" ], [ 34, B - 48, 18, 9, 14, "#9a7044" ], [ 14, B - 62, 16, 8, 12, "#c09a62" ], [ 36, B - 60, 14, 7, 12, "#a87c4a" ] ]) {
        box(P, x, y, ww, t, f, col);
        P.r(x + (ww >> 1), y, 2, t, "#d8c8a0");
        P.r(x + 2, y + t + 3, 6, 3, "#f0ece0");
      }
    } else if (c === 2) {
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) {
        const x = 16 + i * 12 + (r & 1) * 5, y = B - 46 + r * 7;
        if (x > 72) continue;
        P.oval(x, y, 6, 4, "#d8d4c4").oval(x, y - 1, 5, 2, "#ece8dc");
        P.r(x - 3, y + 1, 5, 1, "#c03a2a").p(x + 2, y + 1, "#2a6a3a");
      }
      for (let i = 0; i < 3; i++) {
        const x = 24 + i * 16, y = B - 52;
        P.oval(x, y, 6, 4, "#d8d4c4").oval(x, y - 1, 5, 2, "#ece8dc");
      }
    } else if (c === 3) {
      P.poly([ [ 10, B - 27 ], [ 13, B - 58 ], [ 32, B - 66 ], [ 58, B - 64 ], [ 76, B - 56 ], [ 79, B - 27 ] ], "#2e5aa0");
      P.poly([ [ 16, B - 56 ], [ 32, B - 63 ], [ 56, B - 61 ], [ 70, B - 54 ], [ 50, B - 50 ], [ 24, B - 50 ] ], "#3e6ab4");
      for (const x of [ 22, 40, 58 ]) P.line(x, B - 60, x + 6, B - 30, "#22447a");
      for (const x of [ 18, 44, 68 ]) P.line(x - 6, B - 28, x + 4, B - 62, "#d8c8a0");
    } else if (c === 4) {
      box(P, 14, B - 56, 38, 8, 20, "#c8b8a0");
      for (let x = 18; x < 50; x += 6) P.p(x, B - 42, "#a89880").p(x + 3, B - 38, "#a89880");
      box(P, 56, B - 80, 16, 10, 42, "#d8d8d0");
      P.r(57, B - 58, 14, 1, "#a8a8a0").r(69, B - 66, 1, 6, "#8a8a84").r(69, B - 52, 1, 8, "#8a8a84");
    } else {
      for (const [x, y] of [ [ 18, B - 32 ], [ 28, B - 32 ], [ 38, B - 32 ], [ 48, B - 32 ], [ 58, B - 32 ], [ 68, B - 32 ], [ 22, B - 38 ], [ 32, B - 38 ], [ 42, B - 38 ], [ 52, B - 38 ], [ 62, B - 38 ], [ 27, B - 44 ], [ 37, B - 44 ], [ 47, B - 44 ], [ 57, B - 44 ], [ 32, B - 50 ], [ 42, B - 50 ], [ 52, B - 50 ] ]) {
        P.oval(x, y, 5, 4, "#2e6a2e");
        for (const d of [ -3, 0, 3 ]) P.line(x + d, y - 3, x + d, y + 3, "#1a3e1a");
        P.p(x - 2, y - 2, "#6aaa5a").p(x - 1, y - 3, "#8aca6a");
      }
      P.r(28, B - 36, 24, 9, "#d8c8a0").r(28, B - 36, 24, 1, "#f0e4c0");
      label(P, 28, B - 35, "수박", "#c8302a", 7, 24);
    }
  }
  const TRKC = [ "#e8e6de", "#3a64a8", "#e8e6de", "#a8acb0", "#3a64a8", "#e8e6de" ];
  def("truck", 4, 2, 32, (P, w, h, up, g, v) => {
    const B = h - 2, k = v % 6, R = RP(TRKC[k]), fT = B - 52, gN = B - 27, gF = B - 61;
    chassis(P, B, 8);
    P.r(10, fT, 69, 34, R[2]);
    for (let y = fT + 3; y < gN; y += 5) P.r(10, y, 69, 1, R[1]);
    P.noise(10, fT, 69, 26, [ R[1], R[3], "#6a6458" ], .06, g);
    P.r(8, gF, 72, 9, R[2]).r(8, gF, 72, 1, R[4]).r(8, gF + 8, 72, 1, R[1]);
    for (const x of [ 26, 44, 62 ]) P.r(x, gF + 1, 1, 7, R[1]);
    P.r(8, gF, 2, 43, R[3]).r(8, gF, 1, 43, R[4]);
    P.r(78, gF - 8, 4, 51, R[1]).r(78, gF - 8, 1, 51, R[3]).r(78, gF - 8, 4, 1, R[4]);
    for (let y = gF - 4; y < gN; y += 6) P.r(78, y, 4, 1, R[0]);
    cargo(P, g, k, B);
    P.r(8, gN, 72, 9, R[3]);
    vgrad(P, 8, gN, 72, 9, R[3], R[1], .5, 1);
    P.r(8, gN, 72, 1, R[5]).r(8, gN + 4, 72, 1, R[2]).r(8, gN + 5, 72, 1, R[4]).r(8, gN + 8, 72, 1, R[0]);
    for (const x of [ 26, 44, 62 ]) P.r(x, gN + 1, 1, 7, R[1]);
    P.r(10, gN + 2, 2, 3, "#5a5e64").r(76, gN + 2, 2, 3, "#5a5e64");
    if (k === 2) {
      P.r(30, gN + 1, 24, 7, "#f4f0e0");
      label(P, 30, gN + 1, "용달", "#2a5aa0", 7, 24);
    }
    rust(P, 9, gN + 1, 70, 7, g, 8);
    cabOver(P, g, v, B, TRKC[k]);
    vWheel(P, 30, B, 7, v % 4 === 3);
  });
  const BOXC = [ [ "#e8e8e2", "택배", "#2a5aa0" ], [ "#b8bcc0", "", "" ], [ "#e8e8e2", "냉동", "#2a6ab0" ], [ "#d8702a", "이사", "#f4f0e0" ] ];
  def("boxTruck", 4, 2, 40, (P, w, h, up, g, v) => {
    const B = h - 2, k = v % 4, c = BOXC[k], R = RP(c[0]), bT = B - 62, bB = B - 18, rT = bT - 34;
    chassis(P, B, 6);
    P.r(6, rT, 74, 35, R[4]);
    vgrad(P, 6, rT, 74, 35, R[5], R[4], .05, .4);
    for (let x = 14; x < 78; x += 8) P.r(x, rT + 1, 1, 33, R[3]);
    P.r(6, rT, 74, 1, R[3]).r(6, rT, 1, 35, R[5]).r(79, rT, 1, 35, R[3]);
    P.noise(7, rT + 1, 72, 33, [ R[5], R[3], "#9a9282" ], .05, g);
    if (k === 2) {
      box(P, 62, rT + 6, 14, 10, 5, "#9aa0a6");
      for (let x = 64; x < 74; x += 2) P.r(x, rT + 8, 1, 7, "#6a7074");
    }
    P.r(6, bT, 74, bB - bT, R[3]);
    vgrad(P, 6, bT, 74, bB - bT, R[4], R[2], .1, 1);
    if (k === 1) for (let x = 12; x < 76; x += 6) P.r(x, bT + 2, 1, bB - bT - 5, R[2]).r(x + 1, bT + 2, 1, bB - bT - 5, R[4]); else for (const x of [ 24, 42 ]) P.r(x, bT + 2, 1, bB - bT - 5, R[2]);
    P.r(6, bT, 74, 2, R[5]).r(6, bB - 3, 74, 3, "#3a3c40").r(6, bB - 3, 74, 1, "#5a5e64").r(6, bT, 3, bB - bT, R[2]).r(77, bT, 3, bB - bT, R[2]);
    P.r(56, bT + 4, 1, bB - bT - 7, R[1]).r(74, bT + 4, 1, bB - bT - 7, R[1]).r(56, bT + 4, 19, 1, R[1]);
    for (const y of [ bT + 10, bB - 12 ]) P.r(57, y, 2, 3, "#5a5e64");
    P.r(71, bT + 18, 2, 10, "#6a6e74");
    if (k === 2) P.r(9, bT + 28, 46, 4, "#2a6ab0");
    if (c[1]) label(P, 10, bT + 8, c[1], c[2], 7, 44, {
      s: 2
    });
    if (k === 0) {
      box(P, 22, bT + 28, 14, 4, 9, "#c8a070");
      P.r(28, bT + 28, 2, 13, "#e8d8b0");
    }
    rust(P, 7, bT + 2, 72, bB - bT - 5, g, k === 1 ? 10 : 5);
    for (let i = 0; i < 5; i++) drip(P, 8 + g.i(68), bT + 2, 4 + g.i(10), "rgba(110,80,50,0.3)");
    cabOver(P, g, v, B, k === 3 ? "#e8e6de" : [ "#e8e6de", "#3a64a8", "#e8e6de" ][k]);
    vWheel(P, 30, B, 7, 0);
  });
  const BUSC = [ [ "#2f64b0", "472", "B" ], [ "#4a9a40", "7016", "G" ], [ "#c43a30", "9401", "R" ], [ "#d8a830", "01", "Y" ] ];
  def("busSeoul", 5, 2, 16, (P, w, h, up, g, v) => {
    const c = BUSC[v % 4];
    busSide(P, w, h, g, v, c[0], {
      route: c[1],
      letter: c[2],
      rc: sh(c[0], -.35)
    });
  });
  const TOWNC = [ [ "#3f9a4a", "종로", "09" ], [ "#5aa83a", "마포", "02" ], [ "#2f8a5a", "성북", "13" ] ];
  def("busTown", 4, 2, 16, (P, w, h, up, g, v) => {
    const B = h - 2, c = TOWNC[v % 3], R = RP(c[0]), GL = "#26343c", Rg = RP(GL), Gy = RP("#6a6e74"), tY = B - 66, sy = B - 34;
    sbox(P, 1, B - 12, 124, 14, .5);
    P.r(4, tY, 118, 32, Gy[4]);
    P.r(3, tY + 2, 120, 28, Gy[4]);
    vgrad(P, 4, tY, 118, 10, Gy[3], Gy[4], .1, .9);
    P.r(3, sy - 1, 120, 1, Gy[5]).r(3, sy, 120, 1, R[4]);
    P.noise(4, tY + 1, 118, 30, [ Gy[3], Gy[5], "#8a8272" ], .08, g);
    box(P, 40, tY + 6, 30, 14, 4, "#9aa0a4");
    for (let i = 43; i < 67; i += 3) P.r(i, tY + 8, 1, 12, "#6a7074");
    box(P, 90, tY + 9, 10, 9, 2, "#7a7e84");
    P.r(92, tY + 11, 6, 5, "#5a5e64");
    rust(P, 5, tY + 2, 116, 28, g, 8);
    P.r(2, sy, 122, 28, R[3]);
    vgrad(P, 2, sy + 12, 122, 16, R[3], R[1], .4, 1);
    P.r(2, sy, 122, 1, R[5]).r(2, sy + 13, 122, 2, "#e8d860").r(2, sy + 15, 122, 1, "#a89a40").r(2, sy + 23, 122, 5, "#2a3440").r(2, sy + 23, 122, 1, "#4a5460");
    for (let x = 6; x < 100; x += 14) {
      if (x === 48) continue;
      P.r(x, sy + 3, 12, 9, GL).r(x, sy + 3, 12, 1, Rg[4]);
      P.line(x + 2, sy + 10, x + 6, sy + 4, Rg[4]).line(x + 4, sy + 10, x + 8, sy + 4, Rg[3]);
      if (g.chance(.35)) {
        P.r(x + 3 + g.i(4), sy + 5 + g.i(2), 4, 3, "#0c0e12");
        crack(P, x + 5, sy + 7, g, 3, "#9ab0b8");
      }
    }
    for (const x of [ 49, 102 ]) P.r(x, sy + 3, 11, 22, "#1a1e22").r(x + 1, sy + 4, 4, 20, GL).r(x + 6, sy + 4, 4, 20, GL).r(x + 1, sy + 4, 1, 20, Rg[4]).r(x + 6, sy + 4, 1, 20, Rg[4]).r(x, sy + 13, 11, 1, "#3a3d42");
    P.r(117, sy + 2, 6, 20, GL).r(117, sy + 2, 1, 20, Rg[4]).r(116, sy + 2, 1, 22, R[1]).r(120, sy + 18, 3, 3, "#e8e0c0").r(2, sy + 16, 2, 5, "#b02a24");
    P.r(8, sy + 16, 24, 7, "#f4f0e0");
    label(P, 8, sy + 16, c[1], sh(c[0], -.4), 7, 24);
    P.r(34, sy + 16, 13, 7, sh(c[0], -.3));
    label(P, 34, sy + 16, "마을", "#f4f0e0", 7, 13);
    P.r(64, sy + 16, 13, 7, "#f4f0e0");
    mini(P, 64, sy + 17, c[2], sh(c[0], -.4), 13);
    for (const cx of [ 24, 98 ]) {
      P.oval(cx, B - 7, 10, 7, "#101114");
      P.oval(cx, B - 5, 8, 5, "#1e1f23");
      P.oval(cx, B - 5, 4, 3, "#5a5e64").oval(cx, B - 5, 2, 1, "#8a9098");
      P.p(cx - 2, B - 7, "#b8bec4");
    }
    rust(P, 3, sy + 14, 120, 14, g, 12);
    for (let i = 0; i < 4; i++) drip(P, 6 + g.i(114), sy + 15, 3 + g.i(6), "rgba(110,55,25,0.35)");
    P.r(2, sy, 1, 28, R[4]).r(123, sy, 1, 28, R[1]);
  });
  const swing = (x0, x1, top, belt, bot, sl, hole, o) => Object.assign({
    x0,
    x1,
    top,
    belt,
    bot,
    sl,
    hole
  }, o || {});
  A.VGEO = {
    taxi: {
      kind: "taxi",
      fw: 3,
      fh: 2,
      up: 8,
      wr: 9,
      col: TAXC,
      sedan: true
    },
    carMini: {
      kind: "carMini",
      fw: 3,
      fh: 2,
      up: 8,
      wr: 8,
      col: MINIC,
      n: 6,
      x1: 84,
      Bs: 50,
      tY: 19,
      D: 32,
      hood: 68,
      ws: [ 65, 25 ],
      sw: [ 47, 37, 14, 10 ],
      wh: [ 25, 73 ],
      t: 6,
      win: [ [ [ 21, 48 ], [ 28, 36 ], [ 59, 36 ], [ 65, 48 ] ] ],
      doors: [ swing(44, 64, 36, 49, 63, 10, [ [ 44, 36 ], [ 59, 36 ], [ 65, 48 ], [ 64, 63 ], [ 44, 63 ] ]), swing(22, 43, 36, 49, 63, 0, [ [ 28, 36 ], [ 43, 36 ], [ 43, 63 ], [ 24, 63 ], [ 21, 48 ] ]) ]
    },
    suv: {
      kind: "suv",
      fw: 3,
      fh: 2,
      up: 16,
      wr: 8,
      col: SUVC,
      n: 6,
      x1: 93,
      Bs: 53,
      tY: 18,
      D: 36,
      hood: 75,
      ws: [ 69, 26 ],
      sw: [ 36, 41, 13, 9 ],
      wh: [ 21, 79 ],
      t: 8,
      win: [ [ [ 10, 51 ], [ 12, 39 ], [ 63, 39 ], [ 72, 51 ] ] ],
      doors: [ swing(53, 72, 39, 52, 71, 10, [ [ 53, 39 ], [ 63, 39 ], [ 72, 51 ], [ 72, 71 ], [ 53, 71 ] ]), swing(32, 51, 39, 52, 71, 0, [ [ 32, 39 ], [ 51, 39 ], [ 51, 71 ], [ 32, 71 ] ]) ]
    },
    van: {
      kind: "van",
      fw: 4,
      fh: 2,
      up: 24,
      wr: 8,
      col: VANC,
      n: 6,
      ks: [ 0, 1, 3, 4 ],
      x1: 116,
      Bs: 62,
      tY: 27,
      D: 36,
      hood: 106,
      ws: [ 101, 28 ],
      sw: [ 18, 45, 18, 12 ],
      wh: [ 26, 96 ],
      t: 7,
      win: [ [ [ 14, 60 ], [ 14, 43 ], [ 95, 43 ], [ 103, 60 ] ] ],
      doors: [ swing(73, 100, 43, 61, 79, 10, [ [ 73, 43 ], [ 95, 43 ], [ 103, 60 ], [ 100, 79 ], [ 73, 79 ] ]), {
        slide: true,
        x0: 43,
        x1: 72,
        top: 42,
        bot: 79
      } ]
    },
    truck: {
      kind: "truck",
      fw: 4,
      fh: 2,
      up: 32,
      wr: 4,
      col: TRKC,
      n: 6,
      x1: 117,
      Bs: 64,
      tY: 11,
      D: 34,
      hood: 100,
      ws: [ 113, 52 ],
      sw: [ 90, 50, 16, 9 ],
      wh: [ 30, 100 ],
      t: 7,
      win: [ [ [ 88, 48 ], [ 108, 48 ], [ 108, 60 ], [ 88, 60 ] ], [ [ 111, 45 ], [ 115, 47 ], [ 115, 63 ], [ 111, 63 ] ] ],
      doors: [ swing(87, 110, 47, 62, 83, 0, [ [ 87, 47 ], [ 110, 47 ], [ 110, 83 ], [ 87, 83 ] ]) ]
    },
    boxTruck: {
      kind: "boxTruck",
      fw: 4,
      fh: 2,
      up: 40,
      wr: 4,
      col: BOXC.map(c => c[0]),
      n: 4,
      x1: 117,
      Bs: 72,
      tY: 19,
      D: 34,
      hood: 100,
      ws: [ 113, 60 ],
      sw: [ 90, 58, 16, 9 ],
      wh: [ 30, 100 ],
      t: 7,
      win: [ [ [ 88, 56 ], [ 108, 56 ], [ 108, 68 ], [ 88, 68 ] ], [ [ 111, 53 ], [ 115, 55 ], [ 115, 71 ], [ 111, 71 ] ] ],
      doors: [ swing(87, 110, 55, 70, 91, 0, [ [ 87, 55 ], [ 110, 55 ], [ 110, 91 ], [ 87, 91 ] ]), swing(57, 74, 45, 45, 80, 0, [ [ 57, 45 ], [ 74, 45 ], [ 74, 80 ], [ 57, 80 ] ], {
        dir: -1,
        glass: false,
        cargo: true
      }) ]
    },
    busSeoul: {
      kind: "busSeoul",
      fw: 5,
      fh: 2,
      up: 16,
      wr: 4,
      col: BUSC.map(c => c[0]),
      n: 4,
      x1: 157,
      Bs: 54,
      tY: 4,
      D: 36,
      hood: 140,
      ws: [ 154, 52 ],
      sw: [ 22, 44, 14, 10 ],
      wh: [ 30, 118 ],
      t: 9,
      win: [ 6, 22, 38, 54, 86, 102, 118 ].map(x => [ [ x, 43 ], [ x + 14, 43 ], [ x + 14, 54 ], [ x, 54 ] ]).concat([ [ [ 151, 42 ], [ 157, 42 ], [ 157, 66 ], [ 151, 66 ] ] ]),
      doors: [ {
        fold: true,
        x0: 138,
        x1: 150,
        top: 43,
        bot: 70
      }, {
        fold: true,
        x0: 70,
        x1: 82,
        top: 43,
        bot: 70
      } ]
    },
    busTown: {
      kind: "busTown",
      fw: 4,
      fh: 2,
      up: 16,
      wr: 4,
      col: TOWNC.map(c => c[0]),
      n: 3,
      x1: 123,
      Bs: 58,
      tY: 12,
      D: 32,
      hood: 108,
      ws: [ 120, 54 ],
      sw: [ 22, 47, 12, 9 ],
      wh: [ 24, 98 ],
      t: 8,
      win: [ 6, 20, 34, 62, 76, 90 ].map(x => [ [ x, 47 ], [ x + 12, 47 ], [ x + 12, 56 ], [ x, 56 ] ]).concat([ [ [ 117, 46 ], [ 123, 46 ], [ 123, 66 ], [ 117, 66 ] ] ]),
      doors: [ {
        fold: true,
        x0: 102,
        x1: 113,
        top: 47,
        bot: 69
      }, {
        fold: true,
        x0: 49,
        x1: 60,
        top: 47,
        bot: 69
      } ]
    }
  };
  def("lamp", 1, 1, 84, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#4a4f55");
    P.shadow(16, B - 2, 7, 2, .45);
    box(P, 10, B - 8, 12, 3, 5, "#6a6a66");
    P.r(12, B - 12, 8, 5, M[2]).r(12, B - 12, 2, 5, M[4]).r(18, B - 12, 2, 5, M[1]).r(12, B - 12, 8, 1, M[4]);
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      P.r(14 + i, 12, 1, B - 24, [ M[4], M[3], M[2], M[1] ][i]);
    }
    P.r(13, 30, 6, 2, M[3]).r(13, 30, 6, 1, M[4]);
    P.r(13, B - 44, 6, 8, "#d8d2bc").r(13, B - 44, 6, 1, "#eae4d0");
    txt(P, 14, B - 42, 4, "#6a6458", g);
    txt(P, 14, B - 40, 3, "#b03a30", g);
    P.r(13, B - 30, 6, 2, "#c8b050").r(13, B - 58, 6, 5, "#e8e4d8").r(13, B - 58, 6, 1, "#b83030");
    P.r(15, B - 70, 5, 7, "#3a3d42").r(15, B - 70, 5, 1, "#5a5e64").p(16, B - 67, "#e0c040");
    P.thick(16, 13, 18, 8, 2, M[3]).thick(18, 8, 24, 6, 2, M[3]).p(17, 9, M[5]).p(21, 6, M[5]);
    P.r(20, 4, 11, 4, M[2]).r(20, 4, 11, 1, M[4]).r(21, 3, 8, 1, M[3]).r(21, 8, 9, 2, "#e8dca0").r(21, 8, 9, 1, "#fff4c8").r(20, 7, 1, 3, M[1]);
    rust(P, 13, B - 24, 7, 14, g, 3);
  });
  def("tree", 1, 1, 80, (P, w, h, up, g, v) => {
    const B = h - 2, bark = "#4a3a2c", Rb = RP(bark), Gr = RP("#3a3d3a");
    P.r(3, B - 12, 26, 12, Gr[2]).r(3, B - 12, 26, 1, Gr[4]).r(3, B - 1, 26, 1, Gr[0]).r(3, B - 12, 1, 12, Gr[4]).r(28, B - 12, 1, 12, Gr[1]);
    for (let x = 5; x < 28; x += 3) P.r(x, B - 11, 1, 10, Gr[0]);
    P.oval(16, B - 6, 6, 3, "#3a2e22").oval(16, B - 6, 5, 2, "#4a3a2a");
    P.shadow(16, B - 6, 6, 2, .5);
    const L = [];
    const br = (x, y, a, len, th, d) => {
      const x1 = Math.max(4, Math.min(27, x + Math.cos(a) * len)), y1 = Math.max(4, y + Math.sin(a) * len);
      L.push([ x, y, x1, y1, th ]);
      if (d <= 0 || y1 < 9) {
        if (g.chance(.45)) L.push([ "leaf", x1, y1 ]);
        return;
      }
      const n = d > 2 ? 2 : 1 + g.i(2);
      for (let i = 0; i < n; i++) br(x1, y1, a + (i === 0 ? -1 : 1) * (.25 + g.f() * .45), len * (.62 + g.f() * .2), Math.max(1, th - 1), d - 1);
    };
    br(16, B - 6, -Math.PI / 2, 34, 5, 0);
    br(16, B - 38, -Math.PI / 2 - .35, 20, 3, 4);
    br(16, B - 40, -Math.PI / 2 + .3, 22, 3, 4);
    br(16, B - 30, -Math.PI / 2 + .9, 14, 2, 3);
    br(16, B - 26, -Math.PI / 2 - .9, 12, 2, 3);
    br(16, B - 44, -Math.PI / 2, 26, 2, 4);
    for (const s of L) {
      if (s[0] === "leaf") continue;
      const [x0, y0, x1, y1, th] = s;
      if (th >= 3) {
        P.thick(x0, y0, x1, y1, th, Rb[2]);
        P.line(x0 - (th >> 1), y0, x1 - (th >> 1), y1, Rb[4]);
        P.line(x0 + (th >> 1), y0, x1 + (th >> 1), y1, Rb[1]);
      } else P.thick(x0, y0, x1, y1, th, th > 1 ? Rb[2] : Rb[3]);
    }
    for (let y = B - 40; y < B - 8; y += 3 + g.i(3)) P.r(15 + g.i(3), y, 1, 2, Rb[0]);
    const YL = [ "#d8b040", "#c89a30", "#e8c858", "#a88a3a" ];
    for (const s of L) {
      if (s[0] !== "leaf") continue;
      for (let i = 0; i < 2 + g.i(3); i++) {
        const x = Math.max(2, Math.min(28, s[1] + g.i(5) - 2)), y = Math.max(2, s[2] + g.i(5) - 2), c = g.pick(YL);
        P.r(x, y, 2, 1, c).p(x, y + 1, sh(c, -.3));
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = 4 + g.i(24), y = B - 11 + g.i(10);
      P.r(x, y, 2, 1, g.pick(YL));
    }
  });
  def("bench", 2, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, wood = [ "#8a6a44", "#6a5a44", "#7a5238" ][v % 3], R = RP(wood), I = RP("#2e332e");
    sbox(P, 2, B - 5, 60, 6, .4);
    for (const x of [ 8, 54 ]) post(P, x, B - 36, 2, 20, "#2e332e");
    for (let k = 0; k < 3; k++) {
      const y = B - 36 + k * 5;
      P.r(4, y, 56, 4, R[3]).r(4, y, 56, 1, R[5]).r(4, y + 3, 56, 1, R[1]).r(4, y, 1, 4, R[4]).r(59, y, 1, 4, R[2]);
      grain(P, 5, y + 1, 54, 2, R[3], g, 8);
    }
    P.r(4, B - 22, 56, 2, "rgba(10,12,20,0.4)");
    for (let k = 0; k < 3; k++) {
      const y = B - 20 + k * 3;
      P.r(3, y, 58, 2, R[4]).r(3, y, 58, 1, R[5]).r(3, y + 2, 58, 1, R[1]);
    }
    P.r(3, B - 11, 58, 3, R[2]).r(3, B - 11, 58, 1, R[3]).r(3, B - 9, 58, 1, R[0]);
    grain(P, 4, B - 20, 56, 8, R[4], g, 12);
    for (const x of [ 4, 55 ]) {
      P.r(x, B - 24, 5, 3, I[3]).r(x, B - 24, 5, 1, I[4]).r(x + 1, B - 21, 3, 12, I[2]).r(x + 1, B - 21, 1, 12, I[4]).r(x, B - 9, 5, 8, I[2]).r(x, B - 9, 1, 8, I[4]).r(x - 1, B - 2, 7, 2, I[1]);
    }
    scratch(P, 5, B - 36, 54, 14, g, 4, R[5]);
    rust(P, 4, B - 9, 56, 7, g, 3);
    if (v % 3 === 2) {
      P.r(20, B - 21, 12, 7, "#d8d4c4").r(20, B - 21, 12, 1, "#eae6d8").r(26, B - 21, 1, 7, "#b8b4a4");
      txt(P, 21, B - 19, 4, "#6a6458", g);
      txt(P, 28, B - 18, 3, "#6a6458", g);
    }
  });
  def("hydrant", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, red = "#b8342e", R = RP(red);
    P.shadow(16, B - 2, 8, 2, .45);
    P.oval(16, B - 3, 8, 2, R[1]).r(8, B - 5, 17, 3, R[2]).r(8, B - 5, 17, 1, R[4]);
    for (const x of [ 9, 14, 19, 23 ]) P.p(x, B - 4, "#d8c890");
    P.cyl(10, B - 26, 12, 22, red, {
      e: 3
    });
    P.ball(16, B - 26, 6, 4, red);
    P.r(14, B - 32, 4, 3, R[2]).r(14, B - 32, 4, 1, R[5]).r(13, B - 30, 6, 1, R[1]);
    P.r(10, B - 22, 12, 2, "#e8e070").r(10, B - 22, 12, 1, "#fff8a0").r(21, B - 22, 1, 2, "#b0a840");
    for (const [x, s] of [ [ 5, -1 ], [ 22, 1 ] ]) {
      P.r(x, B - 17, 5, 5, R[2]).r(x, B - 17, 5, 1, R[4]);
      P.r(s < 0 ? x - 1 : x + 4, B - 18, 2, 7, "#8a8a82").r(s < 0 ? x - 1 : x + 4, B - 18, 2, 1, "#c8c8c0");
    }
    P.line(5, B - 11, 9, B - 8, "#9aa0a8").line(26, B - 11, 22, B - 8, "#9aa0a8");
    scratch(P, 11, B - 20, 10, 14, g, 4, R[5]);
    rust(P, 10, B - 10, 12, 6, g, 3);
  });
  def("rangePlate", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#8d9298");
    sbox(P, 6, B - 3, 20, 5, .34);
    post(P, 12, B - 14, 3, 14, "#4a4e54");
    post(P, 18, B - 14, 3, 14, "#4a4e54");
    P.r(10, B - 16, 12, 3, M[1]).r(10, B - 16, 12, 1, M[3]);
    const cx = 16, cy = B - 24, r = 9;
    for (let y = -r; y <= r; y++) {
      const wdt = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      if (!wdt) continue;
      P.r(cx - wdt, cy + y, wdt * 2, 1, y < -2 ? M[4] : y > 3 ? M[1] : M[2]);
    }
    P.r(cx - 3, cy - 3, 6, 6, "#c8452e").r(cx - 2, cy - 2, 4, 4, "#e86a44");
    scratch(P, cx - 7, cy - 7, 14, 14, g, 5, "#cfd4da");
    rust(P, cx - 6, cy + 1, 12, 6, g, 3);
  });
  def("silh", 1, 1, 42, (P, w, h, up, g, v) => {
    const B = h - 2, W = RP("#6b5a44");
    sbox(P, 7, B - 3, 18, 5, .32);
    post(P, 15, B - 12, 3, 12, "#4a4238");
    const body = "#7a6748";
    P.r(9, B - 34, 14, 22, body).r(9, B - 34, 14, 1, W[4]).r(9, B - 13, 14, 1, "#4e4130");
    P.r(6, B - 32, 3, 12, body).r(23, B - 32, 3, 12, body);
    P.r(12, B - 41, 8, 8, body).r(12, B - 41, 8, 1, W[4]);
    P.r(13, B - 26, 6, 6, "#3a3026").r(14, B - 25, 4, 4, "#c8452e");
    P.r(14, B - 39, 4, 3, "#3a3026");
    scratch(P, 9, B - 41, 14, 29, g, 6, "#8f7c58");
    if (v % 2) grime(P, 9, B - 30, 14, 14, g, 6);
  });
  def("barrier", 2, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#5a5e64");
    sbox(P, 2, B - 7, 60, 8, .36);
    for (const x of [ 9, 53 ]) {
      P.r(x - 1, B - 8, 4, 8, M[2]).r(x - 1, B - 8, 4, 1, M[4]);
      post(P, x, B - 30, 2, 22, "#5a5e64");
    }
    const board = (y, hh) => {
      P.r(3, y, 58, hh, "#e8e4d8");
      for (let x = -hh; x < 60; x += 8) P.poly([ [ 3 + x, y + hh ], [ 3 + x + hh, y ], [ 3 + x + hh + 4, y ], [ 3 + x + 4, y + hh ] ], "#d86a24");
      P.x.clearRect(0, y, 3, hh);
      P.x.clearRect(61, y, 3, hh);
      P.r(3, y, 58, 1, "rgba(255,255,255,0.35)").r(3, y + hh - 1, 58, 1, "rgba(0,0,0,0.3)").r(3, y, 1, hh, "rgba(255,255,255,0.25)").r(60, y, 1, hh, "rgba(0,0,0,0.3)");
    };
    board(B - 32, 7);
    board(B - 20, 6);
    grime(P, 4, B - 32, 56, 19, g, 10, "rgba(40,30,20,0.25)");
    scratch(P, 4, B - 32, 56, 19, g, 5, "#f8f4ea");
    P.r(4, B - 38, 7, 6, "#1e2024").r(5, B - 37, 5, 4, "#e8a030").r(5, B - 37, 2, 1, "#fff0a0").r(5, B - 34, 5, 1, "#a86a20");
    if (v % 2) {
      P.r(44, B - 8, 12, 6, "#8a8062").r(44, B - 8, 12, 1, "#a89c7a").r(49, B - 8, 1, 6, "#6a6048");
    }
  });
  def("pillar", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#8f9094", "#86888c", "#94918a" ][v % 3], R = RP(base);
    sbox(P, 3, B - 6, 26, 8, .42);
    box(P, 5, B - 56, 22, 9, 47, base);
    P.r(6, B - 46, 1, 44, R[4]).r(25, B - 46, 1, 44, R[1]);
    for (let x = 5; x < 27; x += 6) {
      P.poly([ [ x, B - 6 ], [ x + 3, B - 12 ], [ x + 6, B - 12 ], [ x + 3, B - 6 ] ], "#e0b020");
    }
    P.r(5, B - 13, 22, 1, "#2a2a2a").r(5, B - 6, 22, 1, "#2a2a2a");
    for (let x = 8; x < 27; x += 6) P.poly([ [ x, B - 6 ], [ x + 3, B - 12 ], [ x + 6, B - 12 ], [ x + 3, B - 6 ] ].map(([a, b]) => [ Math.min(26, a), b ]), "#26262a");
    grime(P, 6, B - 46, 20, 32, g, 14, "rgba(30,28,24,0.2)");
    scratch(P, 6, B - 44, 20, 28, g, 5, R[5]);
    {
      const cx = 6 + g.i(3), cy = B - 40 + g.i(12);
      for (let k = 0; k < 7; k++) P.p(cx + k + (k > 3 ? 1 : 0), cy + (k >> 1) + (k % 3 === 0 ? 1 : 0), R[0]);
    }
    if (v >= 100) {
      P.r(5, B - 41, 22, 14, "#2a3240").r(5, B - 41, 22, 1, "#4a5464").r(5, B - 28, 22, 1, "#1a1e26");
      mini(P, 5, B - 38, "B1", "#e6e2d4", 22, 2);
    } else if (v % 2) {
      P.r(21, B - 30, 5, 7, R[1]).r(22, B - 29, 4, 5, "#4a4038");
      P.r(23, B - 29, 1, 5, "#8a4a2a").r(25, B - 28, 1, 4, "#7a4228");
    } else {
      P.r(10, B - 38, 11, 9, "#d8d2bc").r(10, B - 38, 11, 1, "#eae4d0");
      P.r(12, B - 35, 7, 1, "#6a6458").r(12, B - 33, 5, 1, "#b83a34").p(19, B - 31, "#8a8474");
    }
    drip(P, 8 + g.i(14), B - 20, 6, "rgba(40,34,26,0.35)");
  });
  def("plate", 2, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#6a7078", "#72685c", "#5e6a66" ][v % 3], R = RP(base);
    sbox(P, 2, B - 5, 60, 7, .4);
    for (const x of [ 6, 54 ]) {
      P.poly([ [ x, B - 2 ], [ x + 3, B - 2 ], [ x + 1, B - 30 ], [ x - 1, B - 30 ] ], "#5a4630");
      P.r(x - 1, B - 3, 6, 2, "#3e3020");
    }
    P.r(3, B - 52, 58, 3, R[4]).r(3, B - 52, 58, 1, R[5]);
    vgrad(P, 3, B - 49, 58, 46, R[3], R[1], .3, .95);
    for (let x = 4; x < 61; x += 4) {
      P.r(x, B - 49, 1, 46, R[4]).r(x + 2, B - 49, 1, 46, R[1]);
    }
    P.r(3, B - 49, 1, 46, R[5]).r(60, B - 49, 1, 46, R[0]).r(3, B - 4, 58, 1, R[0]);
    P.r(24, B - 38, 16, 5, "#0e1014").r(24, B - 38, 16, 1, R[0]).r(24, B - 34, 16, 1, R[5]);
    for (const [x, y] of [ [ 6, B - 46 ], [ 56, B - 46 ], [ 6, B - 8 ], [ 56, B - 8 ], [ 31, B - 46 ] ]) rivet(P, x, y, R);
    rust(P, 4, B - 48, 56, 44, g, 16);
    for (let k = 0; k < 3; k++) drip(P, 6 + g.i(52), B - 30 + g.i(10), 6 + g.i(8), "rgba(110,55,25,0.4)");
    scratch(P, 4, B - 46, 56, 40, g, 7, R[5]);
    if (v % 3 === 0) {
      P.poly([ [ 10, B - 28 ], [ 12, B - 28 ], [ 20, B - 14 ], [ 18, B - 14 ] ], "#c8302a");
      P.poly([ [ 18, B - 28 ], [ 20, B - 28 ], [ 12, B - 14 ], [ 10, B - 14 ] ], "#c8302a");
    } else if (v % 3 === 1) {
      for (const [x, y] of [ [ 46, B - 26 ], [ 50, B - 20 ], [ 44, B - 16 ] ]) {
        P.r(x, y, 2, 2, "#0e1014").p(x - 1, y, R[5]).p(x + 2, y + 1, R[5]);
      }
    }
  });
  def("sandbag", 2, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, cols = [ "#a89a72", "#9c9070", "#b0a078" ], D = "#5e5438";
    sbox(P, 1, B - 6, 62, 8, .42);
    const bag = (x, y, bw, c) => {
      const R = RP(c);
      P.r(x + 1, y, bw - 2, 8, R[2]).r(x, y + 1, bw, 6, R[2]);
      P.r(x + 1, y, bw - 2, 2, R[4]).r(x + 2, y, bw - 5, 1, R[5]);
      P.r(x + 1, y + 6, bw - 2, 2, R[1]).r(x, y + 3, 1, 3, R[3]).r(x + bw - 1, y + 2, 1, 5, R[1]);
      P.p(x + bw - 3, y + 3, R[1]).p(x + bw - 4, y + 4, R[1]);
      P.r(x + 2, y + 8, bw - 4, 1, D);
    };
    for (let x = 1, k = 0; x < 62; x += 15, k++) bag(x, B - 9, Math.min(15, 63 - x), cols[(k + v) % 3]);
    for (let x = 8, k = 0; x < 55; x += 15, k++) bag(x, B - 17, Math.min(15, 56 - x), cols[(k + v + 1) % 3]);
    for (let x = 1, k = 0; x < 62; x += 15, k++) bag(x, B - 25, Math.min(15, 63 - x), cols[(k + v + 2) % 3]);
    for (let x = 3; x < 60; x += 15) {
      P.r(x, B - 28, 11, 3, RP(cols[v % 3])[4]).r(x + 1, B - 29, 9, 1, RP(cols[v % 3])[5]);
    }
    grime(P, 2, B - 26, 60, 24, g, 14, "rgba(50,40,24,0.22)");
    if (v % 2) {
      P.r(40 + g.i(8), B - 12, 2, 2, "#3a3020");
      P.r(20 + g.i(6), B - 20, 2, 1, "#3a3020");
      for (let k = 0; k < 5; k++) P.p(41 + g.i(6), B - 3 + g.i(2), "#c8b888");
    }
  });
  {
    const ST = "#9aa0a4", SR = RP(ST), PAN = "#262a30", FL = "#c8662e", GLS = "#c4d6da", GLD = "#8ea4aa";
    const cab = (P, g, x, F0, o) => {
      o = o || {};
      const W = 7, T0 = F0 - 15, T1 = F0 + 9, B1 = F0 + 28;
      sbox(P, x, F0 + 7, W + 2, 23, .3);
      P.r(x, T0, W, T1 - T0, SR[4]).r(x, T0, W, 1, SR[5]).r(x, T0, 1, T1 - T0, SR[5]).r(x + W - 1, T0, 1, T1 - T0, SR[2]);
      P.noise(x + 1, T0 + 1, W - 2, T1 - T0 - 2, [ SR[3], SR[5] ], .08, g);
      P.r(x + 1, T0 + 2, W - 2, 3, PAN).p(x + 3, T0 + 3, "#4a2c28");
      if (o.smash) {
        P.r(x + 1, T0 + 10, W - 2, 7, PAN).p(x + 2, T0 + 11, "#c8d0d4").p(x + 3, T0 + 12, "#c8d0d4").p(x + 4, T0 + 12, "#8a949a").p(x + 4, T0 + 14, "#c8d0d4").p(x + 2, T0 + 15, "#8a949a");
      } else {
        P.r(x + 1, T0 + 10, W - 2, 7, PAN).r(x + 2, T0 + 11, W - 4, 4, "#1e2c40").p(x + 2, T0 + 11, "#3c4e64");
      }
      P.r(x, T1, W, B1 - T1, SR[3]).r(x, T1, W, 1, SR[5]).r(x, T1 + 1, 1, B1 - T1 - 1, SR[4]).r(x + W - 1, T1 + 1, 1, B1 - T1 - 1, SR[1]);
      if (o.open) {
        P.r(x + 1, T1 + 3, W - 2, B1 - T1 - 6, "#14161a").p(x + 2, T1 + 5, "#b83a30").p(x + 3, T1 + 7, "#d8b028").p(x + 2, T1 + 9, "#3a62a8").p(x + 4, T1 + 11, "#b83a30").r(x + 3, T1 + 12, 1, 3, "#5a5e62");
      } else {
        P.r(x + 1, T1 + 3, W - 2, 5, PAN).r(x + 2, T1 + 4, W - 4, 3, "#1c2228");
        P.noise(x + 1, T1 + 9, W - 2, B1 - T1 - 13, [ SR[2], SR[4] ], .1, g);
      }
      if (o.chair) {
        P.r(x + 1, T1 + 10, W - 2, 6, "#2f5fa8").p(x + 3, T1 + 11, "#e8ecf0").r(x + 2, T1 + 12, 3, 1, "#e8ecf0").p(x + 2, T1 + 13, "#e8ecf0").r(x + 2, T1 + 14, 3, 1, "#e8ecf0");
      }
      if (o.graf) {
        P.r(x + 1, T1 + 10, 2, 1, "#c84a8a").r(x + 2, T1 + 11, 3, 1, "#c84a8a").p(x + 4, T1 + 12, "#c84a8a").r(x + 1, T1 + 13, 4, 1, "#c84a8a");
      }
      P.r(x + 1, B1 - 4, W - 2, 1, SR[2]).r(x, B1, W, 2, SR[0]);
      if (g.chance(.6)) drip(P, x + 1 + g.i(W - 2), T1 + 9, 3 + g.i(5), "rgba(110,62,30,0.4)");
    };
    const flap = (P, g, x0, x1, F0, o) => {
      o = o || {};
      const R = RP(o.c || FL), y0 = F0, y1 = F0 + 9, w = x1 - x0;
      P.r(x0, y0, w, y1 - y0, R[3]).r(x0, y0, w, 1, R[5]).r(x0, y1 - 1, w, 1, R[1]).r(x0 + 1, y0 + 2, Math.max(1, w - 3), 1, R[4]);
      P.noise(x0 + 1, y0 + 3, Math.max(1, w - 2), 4, [ R[2], R[4] ], .12, g);
      if (o.crack) {
        P.line(x0 + 2, y0 + 1, x0 + w - 3, y1 - 2, R[0]);
        P.p(x0 + 3, y0 + 1, R[5]);
      }
      if (o.round === "r") P.p(x1 - 1, y0, R[2]).p(x1 - 1, y1 - 1, R[0]);
      if (o.round === "l") P.p(x0, y0, R[2]).p(x0, y1 - 1, R[0]);
    };
    const glass = (P, g, x0, x1, F0, o) => {
      o = o || {};
      const yb = F0 + 16, yt = yb - 17;
      P.r(x0, yb - 1, x1 - x0, 2, SR[0]).r(x0, yb - 2, x1 - x0, 1, SR[2]);
      P.r(x0, yt, x1 - x0, 2, SR[4]).r(x0, yt, x1 - x0, 1, SR[5]).r(x0, yt + 2, x1 - x0, 1, SR[1]);
      for (let k = 0; k < 2; k++) {
        const sx = x0 + 4 + k * 13 + g.i(3);
        for (let d = 0; d < yb - 2 - (yt + 3); d++) {
          const xx = sx + (d >> 1);
          if (xx >= x1 - 1) break;
          P.p(xx, yb - 3 - d, k ? GLD : GLS);
        }
      }
      if (o.crack) {
        const cx = x0 + 9 + g.i(8), cy = yt + 8;
        P.line(cx, cy, cx - 4, yt + 3, GLS).line(cx, cy, cx + 5, yb - 3, GLS).line(cx, cy, cx + 6, yt + 4, GLD);
        P.r(cx - 3, yt + 3, 1, 1, GLS);
      }
      if (o.tape) {
        for (let d = 0; d < 12; d++) {
          const xx = x0 + 6 + d, yy = yt + 3 + d;
          if (xx < x1 - 1 && yy < yb - 2) P.r(xx, yy, 2, 1, (d >> 1) % 2 ? "#1c1c1e" : "#d8b028");
        }
      }
    };
    def("gateFare", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up;
      v = v | 0;
      cab(P, g, 0, F0, {
        graf: v === 2
      });
      flap(P, g, 7, 19, F0, {
        round: "r",
        crack: v === 2
      });
      flap(P, g, 19, 32, F0, {
        round: "l",
        crack: v === 3
      });
      if (v === 1) {
        P.r(1, F0 - 6, 5, 4, "#e4e0d2").r(2, F0 - 5, 3, 1, "#8a8678").r(2, F0 - 3, 2, 1, "#8a8678");
        for (let k = 0; k < 9; k++) P.p(14 + k, F0 + 2 + (k >> 1), (k >> 1) % 2 ? "#1c1c1e" : "#d8b028");
      }
      if (v === 3) {
        P.r(9, F0 + 3, 3, 3, "#e8e4d8").p(10, F0 + 4, "#b83a30");
        P.r(26, F0 + 5, 2, 2, "#5aa0c8");
      }
      for (let k = 0; k < 3 + v; k++) P.p(8 + g.i(22), F0 + 18 + g.i(8), g.pick([ "#6a665e", "#8a857a", "#4e4c48" ]));
    });
    def("gateBroke", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up, R = RP(FL);
      cab(P, g, 0, F0, {
        open: true,
        smash: true
      });
      P.r(10, F0 + 18, 15, 4, R[3]).r(10, F0 + 18, 15, 1, R[5]).r(10, F0 + 22, 15, 1, R[0]).r(11, F0 + 19, 12, 1, R[4]).p(10, F0 + 22, R[1]).p(24, F0 + 18, R[2]);
      P.line(13, F0 + 19, 20, F0 + 21, R[1]);
      P.r(4, F0 + 30, 9, 2, SR[2]).r(4, F0 + 30, 9, 1, SR[4]).p(12, F0 + 31, SR[1]);
      flap(P, g, 27, 32, F0, {
        round: "l"
      });
      for (const [xx, yy] of [ [ 15, F0 + 25 ], [ 19, F0 + 26 ], [ 22, F0 + 24 ], [ 9, F0 + 27 ], [ 26, F0 + 27 ] ]) P.p(xx, yy, g.chance(.5) ? GLS : "#e8ecf0");
    });
    def("gateWide", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up;
      cab(P, g, 0, F0, {
        chair: true
      });
      flap(P, g, 7, 10, F0, {
        round: "r"
      });
      flap(P, g, 28, 32, F0, {
        round: "l"
      });
      P.r(12, F0 + 25, 6, 1, "#8a857a").p(17, F0 + 24, "#8a857a");
    });
    def("gateEmer", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up, RD = RP("#b8302a");
      sbox(P, 0, F0 + 14, 7, 10, .3);
      P.r(1, F0 - 18, 4, 30, SR[3]).r(1, F0 - 18, 1, 30, SR[5]).r(4, F0 - 18, 1, 30, SR[1]).r(1, F0 - 18, 4, 1, SR[5]).r(1, F0 - 4, 4, 1, SR[1]);
      P.r(2, F0 - 14, 2, 8, RD[3]).p(2, F0 - 13, "#f0e8e0").p(3, F0 - 11, "#f0e8e0").p(2, F0 - 9, "#f0e8e0").r(2, F0 - 7, 2, 1, RD[1]);
      P.r(0, F0 + 2, 6, 18, SR[4]).r(0, F0 + 2, 6, 1, SR[5]).r(0, F0 + 2, 1, 18, SR[5]).r(5, F0 + 2, 1, 18, SR[1]).r(1, F0 + 6, 4, 1, SR[2]);
      P.r(1, F0 + 8, 4, 3, "#d8b028").r(2, F0 + 9, 2, 1, "#6a5410");
      P.r(0, F0 + 20, 6, 2, SR[0]);
      P.r(8, F0 + 14, 9, 1, "#d8b028").r(8, F0 + 13, 9, 1, "#1c1c1e");
    });
    def("gateRail", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up;
      sbox(P, 0, F0 + 13, 32, 6, .22);
      glass(P, g, 0, 32, F0, {
        crack: (v | 0) === 2,
        tape: (v | 0) === 2 && g.chance(.5)
      });
      const yb = F0 + 16, yt = yb - 17;
      P.r(0, yt, 3, yb - yt + 1, SR[3]).r(0, yt, 1, yb - yt + 1, SR[5]).r(2, yt, 1, yb - yt + 1, SR[1]).r(0, yb, 3, 2, SR[0]);
    });
    def("gateEnd", 1, 1, 22, (P, w, h, up, g, v) => {
      const F0 = up;
      sbox(P, 7, F0 + 13, 25, 6, .22);
      glass(P, g, 7, 32, F0, {});
      cab(P, g, 0, F0, {});
    });
    Object.assign(A.FOOT, {
      gateFare: {
        x0: 0,
        x1: 1,
        d: .75,
        b: .12
      },
      gateEnd: {
        x0: 0,
        x1: 1,
        d: .75,
        b: .12
      },
      gateBroke: {
        x0: 0,
        x1: .22,
        d: .75,
        b: .12
      },
      gateWide: {
        x0: 0,
        x1: .22,
        d: .75,
        b: .12
      },
      gateEmer: {
        x0: 0,
        x1: .19,
        d: .5,
        b: .12
      },
      gateRail: {
        x0: 0,
        x1: 1,
        d: .3,
        b: .35
      }
    });
    A.PROP_MAT = A.PROP_MAT || {};
    Object.assign(A.PROP_MAT, {
      gateFare: "metal",
      gateBroke: "metal",
      gateWide: "metal",
      gateEmer: "metal",
      gateEnd: "metal",
      gateRail: "glass"
    });
  }
  {
    const TAC = [ "#b89a34", "#d6b850", "#7a6420", "#e0c860" ], tacG = (P, x, y, w, h, g) => {
      for (let k = 0; k < 4; k++) P.p(x + g.i(w), y + g.i(h), "rgba(40,32,16,0.4)");
    };
    const tV = (P, x, y, g) => {
      P.r(x, y, 12, 32, TAC[0]).r(x, y, 1, 32, TAC[1]).r(x + 11, y, 1, 32, TAC[2]);
      for (let yy = 0; yy < 32; yy += 8) {
        P.r(x + 1, y + yy, 10, 1, TAC[2]);
        for (const bx of [ 3, 7 ]) P.r(x + bx, y + yy + 2, 2, 5, TAC[3]).r(x + bx + 1, y + yy + 2, 1, 5, TAC[2]);
      }
      tacG(P, x, y, 12, 32, g);
    };
    const tH = (P, x, y, g) => {
      P.r(x, y, 32, 12, TAC[0]).r(x, y, 32, 1, TAC[1]).r(x, y + 11, 32, 1, TAC[2]);
      for (let xx = 0; xx < 32; xx += 8) {
        P.r(x + xx, y + 1, 1, 10, TAC[2]);
        for (const by of [ 3, 7 ]) P.r(x + xx + 2, y + by, 5, 2, TAC[3]).r(x + xx + 2, y + by + 1, 5, 1, TAC[2]);
      }
      tacG(P, x, y, 32, 12, g);
    };
    const tD = (P, x, y, g) => {
      P.r(x, y, 12, 12, TAC[0]).r(x, y, 12, 1, TAC[1]).r(x, y + 11, 12, 1, TAC[2]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) P.r(x + 2 + a * 3, y + 2 + b * 3, 2, 2, TAC[3]).p(x + 3 + a * 3, y + 3 + b * 3, TAC[2]);
      tacG(P, x, y, 12, 12, g);
    };
    const SZ = {
      V: [ 12, 32, tV ],
      H: [ 32, 12, tH ],
      D: [ 12, 12, tD ]
    };
    const put = (P, g, t, cx, cy, ax, ay) => {
      const z = SZ[t];
      z[2](P, Math.round((cx + .5) * 32 + ax * 11 - z[0] / 2), Math.round((cy + .5) * 32 + ay * 11 - z[1] / 2), g);
    };
    const piece = (k, fw, fh, spec) => def(k, fw, fh, 0, (P, w, h, up, g) => {
      for (const [t, cx, cy, arms] of spec) {
        put(P, g, t, cx, cy, 0, 0);
        for (const a of arms || []) put(P, g, t, cx, cy, a[0], a[1]);
      }
    }, {
      outline: false
    });
    const hs = (a, b) => {
      const o = [];
      for (let x = a; x <= b; x++) o.push([ "H", x, 0 ]);
      return o;
    };
    piece("tacStair", 2, 1, [ [ "D", 0, 0, [ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ] ] ], [ "D", 1, 0, [ [ -1, 0 ], [ 0, -1 ] ] ] ]);
    piece("tacRow", 11, 1, [ [ "D", 0, 0, [ [ 0, 1 ], [ 1, 0 ] ] ], [ "H", 1, 0 ], [ "D", 2, 0, [ [ -1, 0 ], [ 0, -1 ], [ 1, 0 ] ] ] ].concat(hs(3, 9), [ [ "D", 10, 0, [ [ -1, 0 ], [ 0, -1 ] ] ] ]));
    piece("tacLink", 1, 1, [ [ "V", 0, 0 ] ]);
    piece("tacRow2", 7, 1, [ [ "D", 0, 0, [ [ 1, 0 ], [ 0, -1 ] ] ] ].concat(hs(1, 5), [ [ "D", 6, 0, [ [ 0, 1 ], [ -1, 0 ] ] ] ]));
    piece("tacCol", 1, 2, [ [ "V", 0, 0 ], [ "D", 0, 1, [ [ 0, -1 ], [ 0, 1 ] ] ] ]);
    for (const k of [ "gateEmer", "gateWide", "gateFare", "gateBroke", "gateEnd", "gateRail", "tacStair", "tacRow", "tacLink", "tacRow2", "tacCol" ]) A.defPropRot(k, {
      noRot: true
    });
  }
  def("railSeal", 3, 3, 30, (P, w, h, up, g, v) => {
    const fx = v % 2 === 1, X = P.x, B = h - 2, F0 = up, R1 = F0 + 25, R2 = F0 + 68;
    if (fx) {
      X.save();
      X.setTransform(-1, 0, 0, 1, w, 0);
    }
    sbox(P, 44, F0 + 2, 50, B - F0 - 2, .3);
    {
      const R = RP("#d8b028");
      P.r(64, 9, 24, 13, "#1c1c1e").r(65, 10, 22, 11, R[3]).r(65, 10, 22, 1, R[4]).r(65, 20, 22, 1, R[2]);
      P.p(66, 11, "#6a6a6e").p(85, 11, "#6a6a6e");
      drip(P, 70 + g.i(12), 21, 3 + g.i(3), "rgba(110,55,25,0.45)");
    }
    const BX = 20, BW = 26, T0 = F0 - 24, T1 = F0 + 72, BC = "#8f8c84", BR = RP(BC), MOR = "#67645d", MD = sh(MOR, -.22);
    P.r(BX, T0, BW, T1 - T0, MOR);
    for (let col = 0; col < 2; col++) {
      const cx = BX + 1 + col * 13;
      for (let yy = T0 + 1 - (col ? 6 : 0); yy < T1 - 1; yy += 12) {
        const y0 = Math.max(T0 + 1, yy), y1 = Math.min(T1 - 1, yy + 11);
        if (y1 - y0 < 2) continue;
        const c = g.chance(.25) ? sh(BC, -.06) : g.chance(.2) ? sh(BC, .05) : BC, R = RP(c);
        P.r(cx, y0, 11, y1 - y0, R[3]).r(cx, y0, 11, 1, R[4]).r(cx, y0, 1, y1 - y0, R[4]).r(cx + 10, y0, 1, y1 - y0, R[2]).r(cx, y1 - 1, 11, 1, R[2]);
        P.noise(cx + 1, y0 + 1, 9, Math.max(1, y1 - y0 - 2), [ R[2], R[4] ], .08, g);
        if (g.chance(.3)) P.p(cx + (g.chance(.5) ? 0 : 10), g.chance(.5) ? y0 : y1 - 1, R[1]);
      }
    }
    for (let k = 0; k < 16; k++) P.p(BX + g.i(BW), T0 + g.i(T1 - T0), g.pick([ "#a8a49a", "#9c988e", "#5a574f" ]));
    P.r(BX, T0, BW, 1, BR[5]).r(BX, T0, 1, T1 - T0, BR[4]).r(BX + BW - 1, T0, 1, T1 - T0, BR[1]);
    for (let k = 0; k < 4; k++) P.r(BX + 4 + k * 3, T1 - 16, 1, 6, "#d8d4c8");
    P.line(BX + 3, T1 - 15, BX + 15, T1 - 11, "#d8d4c8");
    P.r(BX, T1, BW, B - T1, BR[1]);
    for (let yy = T1 + 1, k = 0; yy < B; yy += 6, k++) {
      P.r(BX, yy, BW, 1, BR[2]);
      P.r(BX, Math.min(B - 1, yy + 5), BW, 1, MD);
      for (let xx = BX + (k % 2 ? 6 : 0); xx < BX + BW; xx += 12) P.r(xx, yy, 1, 5, MD);
    }
    P.r(BX, T1, BW, 1, BR[3]);
    for (let k = 0; k < 3; k++) drip(P, BX + 2 + g.i(BW - 4), T1 + 1, 2 + g.i(4), "rgba(178,172,158,0.7)");
    const PX0 = 46, PX1 = 60, PZ = 20, slope = (c, y) => Math.round(y - PZ + (c - PX0) / (PX1 - PX0) * PZ);
    [ [ F0 + 1, F0 + 34 ], [ F0 + 31, F0 + 64 ], [ F0 + 61, F0 + 94 ] ].forEach(([ya, yb], k) => {
      const base = [ "#6a7078", "#72685c", "#5e6a66" ][(k + v) % 3], R = RP(base);
      for (let c = PX0; c < PX1; c++) {
        const t0 = slope(c, ya), t1 = slope(c, yb);
        P.r(c, t0, 1, t1 - t0, c < PX0 + 2 ? R[4] : c > PX1 - 3 ? R[2] : R[3]);
        P.p(c, t0, R[5]);
        P.r(c, t1 - 1, 1, 2, R[0]);
      }
      P.r(PX1 - 1, ya, 1, yb - ya, R[1]);
      for (let c = PX0 + 1; c < PX1 - 1; c += 3) P.r(c, slope(c, ya) + 2, 1, Math.max(1, yb - ya - 5), "rgba(20,24,30,0.12)");
      for (const [c, o] of [ [ 47, 3 ], [ 47, yb - ya - 4 ], [ 57, 3 ], [ 57, yb - ya - 4 ] ]) rivet(P, c, slope(c, ya) + o, R);
      if (k > 0) for (let c = PX0; c < PX1; c++) P.p(c, slope(c, ya), c & 1 ? "#b0aca2" : "#4a4640").p(c, slope(c, ya) + 1, "#5a5650");
      for (let n = 0; n < 3; n++) {
        const r0 = ya - PZ + 4 + g.i(Math.max(1, yb - ya - 10)), L = 4 + g.i(7);
        P.line(PX0 + 1, r0, PX0 + 1 + L, r0 + Math.round(L * PZ / (PX1 - PX0)), "rgba(120,58,24,0.5)");
      }
      rust(P, PX0 + 1, slope(PX0, ya) + 2, PX1 - PX0 - 2, yb - ya, g, 5);
      if (k === 1) {
        const c0 = 49, r0 = slope(c0, ya) + 9;
        P.line(c0, r0, c0 + 7, r0 + 14, "#c8302a").line(c0 + 1, r0, c0 + 8, r0 + 14, "#c8302a").line(c0 + 7, r0, c0, r0 + 14, "#c8302a").line(c0 + 8, r0, c0 + 1, r0 + 14, "#c8302a");
      }
    });
    const BAG = [ "#a89a72", "#9c9070", "#b0a078" ];
    const bag = (x, y, bw, bh, c) => {
      const R = RP(c);
      P.r(x + 1, y, bw - 2, bh, R[3]).r(x, y + 1, bw, bh - 2, R[3]);
      P.r(x + 1, y, bw - 2, 1, R[4]).r(x, y + 1, 1, bh - 3, R[4]).p(x + 2, y + 1, R[5]);
      P.r(x + 1, y + bh - 2, bw - 2, 2, R[1]).r(x + bw - 1, y + 1, 1, bh - 2, R[2]);
      P.p(x + bw - 3, y + 2, R[1]).p(x + bw - 4, y + 3, R[1]);
      P.r(x + 2, y + bh, bw - 4, 1, "#4a422c");
    };
    for (let k = 0, y = F0 + 3; y < B - 10; y += 10, k++) bag(56, y, 16, 10, BAG[(k + v) % 3]);
    for (let k = 0, y = F0 + 7; y < B - 16; y += 10, k++) if (g.chance(.65)) bag(59, y - 4, 12, 9, BAG[(k + 1 + v) % 3]);
    {
      const y = F0 + 44 + g.i(20);
      for (let n = 0; n < 9; n++) P.p(66 + g.i(9), y + g.i(4), g.pick([ "#c8b888", "#b0a070" ]));
      P.r(70, y - 1, 3, 2, "#5e5438");
    }
    for (const y of [ F0 + 30, F0 + 80 ]) {
      P.thick(52, y - 14, 76, y, 3, "#6a5034");
      P.line(52, y - 15, 76, y - 1, "#8c6c46");
      P.r(74, y - 2, 5, 4, "#4e3c26").r(74, y - 2, 5, 1, "#6e5636");
      P.p(53, y - 13, "#3a2c1c");
    }
    const SX0 = 80, S0 = R1 - 22, S1 = R2 - 4;
    for (const ry of [ R1, R2 ]) {
      P.thick(SX0 + 1, ry - 12, SX0 - 6, ry + 1, 2, "#3a3c40");
      P.r(SX0 - 8, ry - 1, 4, 3, "#26282c");
    }
    P.each(SX0, S0, 8, S1 - S0, (xx, yy) => (yy - xx & 7) < 4 ? "#e4e0d6" : "#c4302a");
    P.r(SX0, S0, 8, 1, "#f4f0e8").r(SX0, S0, 1, S1 - S0, "rgba(255,255,255,0.25)").r(SX0 + 7, S0, 1, S1 - S0, "rgba(0,0,0,0.3)");
    P.each(SX0, S1, 8, 5, (xx, yy) => (yy - xx & 7) < 4 ? "#a8a49a" : "#8a2420");
    P.r(SX0, S1 + 4, 8, 1, "#3a1410");
    grime(P, SX0, S0, 8, S1 - S0, g, 6, "rgba(40,30,20,0.3)");
    {
      const cy = S0 + S1 >> 1;
      P.r(SX0 + 1, cy - 2, 6, 4, "#2a1a18").r(SX0 + 2, cy - 4, 4, 3, "#ff4a30").p(SX0 + 3, cy - 4, "#ffd8c0").p(SX0 + 4, cy - 3, "#ff8a60");
    }
    for (let k = 0; k < 18; k++) {
      const t = k / 17, xx = SX0 + 8 + Math.round(Math.sin(Math.PI * t) * 4), yy = S0 + 6 + Math.round(t * (S1 - S0 - 12));
      P.p(xx, yy, k & 1 ? "#5a5c60" : "#a4a6aa").p(xx + 1, yy, k & 1 ? "#a4a6aa" : "#3a3c40");
    }
    for (let yy = F0 - 6; yy < B - 6; yy++) {
      const t = (yy - F0 + 6) / (B - F0), xx = 92 + Math.round(Math.sin(Math.PI * t) * 2);
      P.r(xx, yy, 2, 1, ((yy - F0) / 3 | 0) % 2 ? "#1a1a1a" : "#e8c020");
    }
    box(P, 86, F0 + 36, 8, 4, 3, "#8f8c84");
    P.r(87, F0 + 37, 2, 2, "#5a574f").r(91, F0 + 37, 2, 2, "#5a574f");
    box(P, 84, F0 + 50, 5, 3, 3, "#86837b");
    {
      const bx = 84, by = F0 + 80;
      P.r(bx, by, 9, 9, "#5a5c60").r(bx + 1, by + 1, 7, 8, "#7a7c80").r(bx, by, 9, 3, "#3a3c40").r(bx + 1, by, 7, 2, "#c8c4b8").p(bx + 2, by, "#e8e4d8");
      P.r(bx + 1, by + 3, 1, 5, "#9a9ca0");
      drip(P, bx + 6, by + 3, 3, "#c8c4b8");
    }
    {
      const tx = 76, ty = F0 + 88;
      P.poly([ [ tx, ty ], [ tx + 4, ty - 2 ], [ tx + 7, ty ], [ tx + 4, ty + 2 ] ], "#9a9ca0");
      P.p(tx + 3, ty - 1, "#d0d2d6");
      P.r(tx + 7, ty - 1, 4, 2, "#7a5a34");
    }
    for (const [x, y] of [ [ 88, F0 + 62 ], [ 79, F0 + 72 ], [ 90, F0 + 92 ] ]) {
      P.r(x, y, 3, 1, "#e8e4d8").p(x + 3, y, "#c87a3a");
    }
    if (fx) X.restore();
    const mx = (x0, ww) => fx ? w - x0 - ww : x0;
    {
      const tx = mx(BX, BW), ty = T0 + 28;
      for (let k = 0; k < 6; k++) P.p(tx + 2 + g.i(BW - 4), ty - 2 + g.i(14), "rgba(200,48,42,0.45)");
      label(P, tx, ty, "봉쇄", "#c42c26", 9, BW);
    }
    label(P, mx(64, 24), 12, "위험", "#1a1a1a", 7, 24);
  });
  def("jangdok", 3, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, T0 = up + 6, T1 = up + 24;
    sbox(P, 2, T0 + 2, 92, B - T0, .3);
    const CM = RP("#8e8a80"), BR = [ "#9a4c3a", "#8a4232", "#a4583e" ], MO = "#6e665c";
    P.r(2, T0, 92, T1 - T0, CM[3]).r(2, T0, 92, 1, CM[4]).r(2, T0, 1, T1 - T0, CM[4]).r(93, T0, 1, T1 - T0, CM[1]);
    P.noise(3, T0 + 1, 90, T1 - T0 - 2, [ CM[2], CM[4] ], .1, g);
    for (let k = 0; k < 5; k++) {
      const x = 6 + g.i(80), y = T0 + 3 + g.i(T1 - T0 - 6), r = 3 + g.i(4);
      P.oval(x, y, r, 1 + g.i(2), "#7e7a70");
    }
    {
      let x = 10 + g.i(10), y = T0 + 2;
      for (let k = 0; k < 12; k++) {
        P.p(x, y, CM[1]);
        x += 1 + g.i(2);
        y += g.i(3) - (y > T1 - 4 ? 1 : 0);
        if (y >= T1 - 1) break;
      }
    }
    P.r(2, T1, 92, B - T1, MO);
    for (let row = 0; row < 2; row++) {
      const y0 = T1 + row * 4, off = row ? 5 : 0;
      for (let x = 2 - off, k = 0; x < 94; x += 10, k++) {
        const a = Math.max(2, x), b = Math.min(94, x + 9);
        if (b - a < 2) continue;
        const c = BR[(k + row + v) % 3], R = RP(c);
        P.r(a, y0, b - a, 3, R[3]).r(a, y0, b - a, 1, R[4]).r(a, y0 + 2, b - a, 1, R[2]);
        if (g.chance(.18)) P.p(a + g.i(b - a), y0 + 1, R[1]);
      }
    }
    P.r(2, T1, 92, 1, CM[2]);
    {
      const cx = 70 + g.i(10);
      P.r(cx, T1 + 4, 4, 3, MO).p(cx + 1, T1 + 5, "#4a4038").p(cx + 4, T1 + 5, BR[0]);
    }
    for (let k = 0; k < 9; k++) P.p(3 + g.i(90), T1 + (g.chance(.5) ? 3 : 7), g.pick([ "#4e6a2c", "#5a7a34", "#3e5824" ]));
    const OG = [ "#4e2e1e", "#57331f", "#46281a" ];
    const jar = (cx, by, R0, Hh, lid, k) => {
      const base = OG[(k + v) % 3], R = RP(base), top = by - Hh;
      P.shadow(cx, by, R0 + 1, 2, .4);
      const prof = t => t < .07 ? .56 : t < .34 ? .56 + .44 * Math.sin((t - .07) / .27 * Math.PI / 2) : 1 - .3 * Math.pow((t - .34) / .66, 1.5);
      for (let yy = top; yy <= by; yy++) {
        const t = (yy - top) / Hh, r = Math.max(1, Math.round(R0 * prof(t))), foot = t > .9;
        for (let xx = cx - r; xx <= cx + r; xx++) {
          const u = (xx - (cx - r) + .5) / (2 * r + 1);
          let c = u < .1 ? R[2] : u < .24 ? R[4] : u < .36 ? R[3] : u < .66 ? R[2] : u < .86 ? R[1] : R[0];
          if (foot) c = u < .3 ? "#86563c" : u < .7 ? "#74482f" : "#5e3a26";
          P.p(xx, yy, c);
        }
      }
      for (let yy = top + Math.round(Hh * .14); yy < top + Math.round(Hh * .55); yy++) {
        const t = (yy - top) / Hh, r = Math.round(R0 * prof(t));
        P.p(cx - Math.round(r * .5), yy, R[5]);
      }
      P.p(cx - Math.round(R0 * .45), top + Math.round(Hh * .2), "#c8a488");
      for (let n = 0; n < 2 + (R0 >> 2); n++) {
        const xx = cx - R0 + 3 + g.i(2 * R0 - 5), y0 = top + Math.round(Hh * .32) + g.i(3), L = 3 + g.i(Math.max(2, Hh >> 2));
        P.r(xx, y0, 1, L, "#6e4a38");
      }
      for (let n = 0; n < R0; n++) P.p(cx - R0 + 2 + g.i(2 * R0 - 3), top + 3 + g.i(Hh - 6), g.pick([ "#7a5a46", "#3a2216" ]));
      for (let n = 0; n < 2 + (R0 >> 2); n++) P.p(cx - R0 + 1 + g.i(2 * R0 - 1), by - g.i(2), g.pick([ "#4e6a2c", "#3e5824", "#5a7a34" ]));
      const mr = Math.max(2, Math.round(R0 * .56));
      P.r(cx - mr, top, 2 * mr + 1, 2, R[1]).r(cx - mr + 1, top, 2 * mr - 1, 1, R[3]);
      if (lid === 2) {
        P.oval(cx, top - 1, mr + 2, 2, "#d4cfc2");
        P.r(cx - mr - 2, top - 1, 2 * mr + 5, 3, "#c8c2b2");
        P.r(cx - mr - 1, top + 1, 2 * mr + 3, 1, "#a8a090");
        P.r(cx - mr - 1, top + 2, 2 * mr + 3, 1, "#7a5a3a");
        P.p(cx + mr + 1, top + 3, "#7a5a3a").p(cx + mr + 1, top + 4, "#7a5a3a");
        P.p(cx - 1, top - 2, "#ece8de");
        return;
      }
      if (lid === 3) {
        P.r(cx - mr + 1, top, 2 * mr - 1, 1, "#1e120a");
        const bx = cx - 2;
        P.oval(bx + 3, top - 1, 4, 2, "#c8a868");
        P.r(bx, top - 2, 6, 1, "#e0c888");
        P.r(bx + 6, top - 1, 4, 1, "#a8884a");
        return;
      }
      const lr = mr + 2, LR = RP(sh(base, .06));
      P.oval(cx, top - 1, lr, 2, LR[3]);
      P.r(cx - lr, top, 2 * lr + 1, 1, LR[1]);
      P.r(cx - lr + 2, top - 2, 2 * lr - 3, 1, LR[4]);
      P.r(cx - 1, top - 3, 3, 1, LR[2]).p(cx, top - 4, LR[4]);
      if (lid === 1) {
        P.oval(cx + 1, top - 4, 4, 2, "#8a8a84");
        P.r(cx - 2, top - 6, 6, 1, "#a8a8a0");
        P.p(cx + 3, top - 3, "#5a5a54");
      }
    };
    jar(18, T0 + 9, 11, 26, 0, 0);
    jar(46, T0 + 8, 12, 28, 1, 1);
    jar(75, T0 + 9, 10, 24, 0, 2);
    jar(31, T0 + 16, 7, 15, 2, 1);
    jar(60, T0 + 16, 6, 13, 0, 0);
    jar(85, T0 + 16, 5, 11, 3, 2);
    {
      const x = 8, y = T1 - 4;
      P.oval(x, y, 3, 1, "#d8d0c0");
      P.r(x - 2, y, 5, 1, "#a89c88");
      P.p(x - 1, y - 1, "#f0ece4");
    }
    for (let k = 0; k < 4; k++) {
      const x = 4 + g.i(88), y = T0 + 2 + g.i(T1 - T0 - 3);
      P.p(x, y, g.pick([ "#a8742a", "#8a5a22", "#b8862e" ])).p(x + 1, y, g.pick([ "#8a5a22", "#6a4418" ]));
    }
    for (let k = 0; k < 5; k++) P.p(4 + g.i(88), T1 - 2 - g.i(3), g.pick([ "#6a665e", "#a8a49a" ]));
  });
  def("dryRack", 2, 1, 22, (P, w, h, up, g, v) => {
    const SR = RP("#a8acb0"), FB = up + 8, FF = up + 28, HT = 24, RY = [ FB - HT, FB - HT + 6, FB - HT + 12, FB - HT + 18 ];
    sbox(P, 4, FB + 4, 56, FF - FB - 3, .12);
    const rod = y => {
      P.r(4, y, 56, 1, SR[4]).r(4, y + 1, 56, 1, SR[1]);
    };
    const leg = (x, back) => {
      const a = back ? [ x, RY[0] ] : [ x, RY[3] ], b = back ? [ x + (x < 32 ? 1 : -1), FB ] : [ x - (x < 32 ? 1 : -1), FF ];
      P.thick(a[0], a[1], b[0], b[1], 2, back ? SR[2] : SR[3]);
      P.r(b[0] - 1, b[1] - 1, 3, 2, "#2a2c30");
    };
    for (const x of [ 4, 59 ]) leg(x, true);
    P.r(4, FB - 1, 56, 1, SR[2]);
    const cloth = (x0, x1, y, L, col, o) => {
      o = o || {};
      const R = RP(col);
      P.r(x0, y - 1, x1 - x0, L + 1, R[3]).r(x0, y - 1, x1 - x0, 1, R[4]).r(x0, y, x1 - x0, 1, R[5]).r(x1 - 1, y, 1, L, R[1]).r(x0, y + 1, 1, L - 1, R[4]);
      for (let yy = y + 3; yy < y + L - 1; yy += 4) P.r(x0 + 2 + g.i(Math.max(1, x1 - x0 - 6)), yy, 1, 2, R[2]);
      if (o.stripe) for (const sy of o.stripe) P.r(x0, y + sy, x1 - x0, 1, o.sc || "#e8e4dc");
      if (o.fringe) for (let xx = x0; xx < x1; xx += 2) P.p(xx, y + L, R[2]);
      P.r(x0, y + L - 1, x1 - x0, 1, R[1]);
    };
    rod(RY[0]);
    cloth(7, 25, RY[0], 15, "#4a7ab0", {
      stripe: [ 10, 12 ],
      fringe: true
    });
    cloth(38, 55, RY[0], 13, "#d88aa0", {
      stripe: [ 9 ],
      sc: "#f4e0e6",
      fringe: true
    });
    rod(RY[1]);
    {
      const x0 = 22, x1 = 38, y = RY[1], R = RP("#dcdcd2");
      P.r(x0 - 4, y - 1, 4, 6, R[3]).r(x1, y - 1, 4, 6, R[3]).r(x0 - 4, y + 4, 4, 1, R[1]).r(x1, y + 4, 4, 1, R[1]);
      cloth(x0, x1, y, 16, "#dcdcd2");
      P.r(28, y - 1, 4, 2, "#8a8a84").r(29, y - 1, 2, 1, "#5a5a54");
      P.r(25, y + 6, 6, 4, "#3a6ab0").r(26, y + 7, 4, 2, "#e8c040");
    }
    rod(RY[2]);
    cloth(44, 56, RY[2], 11, "#d8c860", {});
    P.r(46, RY[2] + 1, 2, 3, "#c4b450").r(52, RY[2] + 1, 2, 3, "#c4b450");
    cloth(8, 17, RY[2], 8, "#e0dcd0", {});
    for (let yy = RY[2]; yy < RY[2] + 8; yy += 2) for (let xx = 8; xx < 17; xx += 2) P.p(xx + (yy >> 1 & 1), yy, "#c85a4a");
    rod(RY[3]);
    const sock = (x, col, stripe) => {
      const R = RP(col), y = RY[3] + 1;
      P.r(x, y, 3, 8, R[3]).r(x, y, 1, 8, R[4]).r(x + 2, y, 1, 8, R[1]).r(x - 2, y + 7, 4, 2, R[2]).r(x - 2, y + 8, 4, 1, R[1]);
      if (stripe) P.r(x, y + 2, 3, 1, stripe);
      P.r(x, y - 1, 3, 2, g.pick([ "#e86a9a", "#5ab86a", "#4a8ae0", "#e8c040" ]));
    };
    sock(10, "#3a3a3e");
    sock(15, "#3a3a3e");
    sock(24, "#e4e2da", "#c83a3a");
    sock(29, "#e4e2da", "#c83a3a");
    sock(40, "#8a8e94", "#3a5aa0");
    sock(52, "#c87a3a");
    for (const x of [ 4, 59 ]) leg(x, false);
    P.r(3, FF - 2, 58, 1, SR[3]).r(3, FF - 1, 58, 1, SR[1]);
    for (const x of [ 4, 59 ]) {
      P.r(x - 1, RY[0] - 1, 2, RY[3] - RY[0] + 3, SR[3]);
      P.r(x - 1, RY[0] - 1, 1, RY[3] - RY[0] + 3, SR[4]);
    }
    for (const x of [ 4, 59 ]) P.p(x, RY[2] + 4, "#5a5e64");
    {
      const x = 20 + g.i(14), y = FF - 4;
      P.r(x, y, 5, 2, "#3a3a3e").r(x, y, 5, 1, "#5a5a5e").r(x + 4, y - 1, 2, 2, "#3a3a3e");
    }
    {
      const x = 44 + g.i(8), y = FF - 6;
      P.r(x, y, 3, 1, "#4a8ae0").p(x + 3, y, "#2a5aa0");
    }
  });
  def("ac", 2, 2, 8, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#9a9d98", R = RP(base), D = RP("#3a3d40");
    sbox(P, 1, B - 5, 62, 7, .5);
    P.r(5, B - 3, 54, 3, "#3a3c3e").r(5, B - 3, 54, 1, "#5a5c5e");
    box(P, 3, B - 60, 58, 36, 22, base);
    const cx = 30, cy = B - 42;
    P.oval(cx, cy, 16, 15, R[2]).oval(cx, cy, 15, 14, D[1]).oval(cx, cy, 14, 13, D[0]);
    for (let b = 0; b < 4; b++) {
      const a = b * Math.PI / 2 + v % 4 * .4;
      P.poly([ [ cx, cy ], [ cx + Math.cos(a) * 13, cy + Math.sin(a) * 12 ], [ cx + Math.cos(a + .55) * 12, cy + Math.sin(a + .55) * 11 ] ], D[3]);
      P.line(cx, cy, cx + Math.cos(a) * 13, cy + Math.sin(a) * 12, D[4]);
    }
    for (const r of [ 4, 8, 12 ]) P.ring(cx, cy, r, r - 1, R[3]);
    P.r(cx - 14, cy, 29, 1, R[3]).r(cx, cy - 13, 1, 27, R[3]);
    P.oval(cx, cy, 2, 2, R[4]).p(cx - 1, cy - 1, R[5]);
    for (const [x, y] of [ [ 6, B - 58 ], [ 56, B - 58 ], [ 6, B - 28 ], [ 56, B - 28 ] ]) rivet(P, x, y, R);
    for (let y = B - 21; y < B - 5; y += 3) P.r(5, y, 38, 1, R[0]).r(5, y + 1, 38, 1, R[3]);
    P.r(46, B - 22, 13, 17, R[3]).r(46, B - 22, 13, 1, R[4]).r(58, B - 22, 1, 17, R[1]);
    rivet(P, 47, B - 21, R);
    rivet(P, 56, B - 21, R);
    rivet(P, 47, B - 8, R);
    rivet(P, 56, B - 8, R);
    P.r(48, B - 17, 8, 5, "#e8d850").r(48, B - 17, 8, 1, "#f8f0a0");
    P.poly([ [ 52, B - 16 ], [ 54, B - 13 ], [ 50, B - 13 ] ], "#1a1a1a");
    P.r(58, B - 12, 4, 2, "#b87a4a").r(58, B - 12, 4, 1, "#e0a070").r(58, B - 8, 4, 2, "#b87a4a");
    rust(P, 4, B - 58, 56, 34, g, 8);
    for (let i = 0; i < 4; i++) drip(P, 6 + g.i(52), B - 22, 5 + g.i(10), "rgba(110,55,25,0.35)");
    for (let i = 0; i < 5; i++) P.p(8 + g.i(48), B - 58 + g.i(10), g.pick([ "#8a7a40", "#e8e4d8" ]));
  });
  def("tank", 2, 2, 16, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#6a9ab0", "#7aa088", "#c8c4a8" ][v % 3], R = RP(base), S = RP("#4a4d50");
    sbox(P, 1, B - 5, 62, 7, .5);
    P.r(3, B - 6, 58, 6, S[2]).r(3, B - 6, 58, 1, S[4]).r(3, B - 1, 58, 1, S[0]);
    for (let x = 8; x < 58; x += 12) P.r(x, B - 5, 2, 4, S[1]);
    box(P, 4, B - 74, 56, 32, 36, base);
    for (let x = 4; x < 60; x += 14) {
      for (let y = B - 42; y < B - 6; y += 12) {
        P.r(x + 2, y + 2, 10, 8, R[3]).r(x + 2, y + 2, 10, 1, R[4]).r(x + 2, y + 2, 1, 8, R[4]).r(x + 11, y + 2, 1, 8, R[1]).r(x + 2, y + 9, 10, 1, R[1]);
      }
      if (x > 4) P.r(x, B - 42, 1, 36, R[1]);
    }
    for (let y = B - 30; y < B - 6; y += 12) P.r(5, y, 54, 1, R[1]);
    for (let x = 18; x < 60; x += 14) P.r(x, B - 73, 1, 30, R[3]);
    P.r(12, B - 66, 14, 12, R[2]).r(12, B - 66, 14, 1, R[1]).r(13, B - 65, 12, 10, R[4]).r(13, B - 65, 12, 1, R[5]).r(24, B - 65, 1, 10, R[2]).r(17, B - 61, 4, 1, R[1]);
    P.r(46, B - 70, 3, 8, "#8a9098").r(46, B - 70, 1, 8, "#c8ccd0").r(44, B - 71, 7, 2, "#8a9098").r(44, B - 71, 7, 1, "#c8ccd0");
    for (const x of [ 44, 52 ]) P.r(x, B - 46, 2, 42, S[3]).r(x, B - 46, 1, 42, S[5]);
    for (let y = B - 43; y < B - 6; y += 5) P.r(45, y, 8, 1, S[4]).r(45, y + 1, 8, 1, S[1]);
    grime(P, 5, B - 42, 54, 36, g, 16, "rgba(40,50,30,0.18)");
    for (let i = 0; i < 6; i++) drip(P, 6 + g.i(50), B - 42, 6 + g.i(14), "rgba(40,50,40,0.25)");
  });
  def("zipline", 1, 1, 64, (P, w, h, up, g, v) => {
    const B = h - 2, Y = "#e8b830", Ry = RP(Y), Rk = RP("#2a2a2e"), M = RP("#7a7e84"), Cn = RP("#7a7a74");
    sbox(P, 1, B - 6, 30, 7, .5);
    box(P, 2, B - 15, 28, 8, 7, "#7a7a74");
    for (let y = B - 7; y < B - 1; y++) for (let x = 3; x < 29; x++) P.p(x, y, (x - y + 60) % 8 < 4 ? Ry[3] : Rk[3]);
    P.r(3, B - 7, 26, 1, "rgba(255,255,255,0.25)").r(2, B - 1, 28, 1, Rk[0]);
    for (const x of [ 4, 26 ]) rivet(P, x, B - 13, Cn);
    const px = 8, shade = [ 4, 3, 3, 2, 1, 1 ];
    for (let y = 9; y < B - 10; y++) for (let i = 0; i < 6; i++) {
      const s = (y + i >> 2 & 1) === 0;
      P.p(px + i, y, (s ? Ry : Rk)[shade[i]]);
    }
    P.r(px - 1, B - 12, 8, 3, M[2]).r(px - 1, B - 12, 8, 1, M[4]);
    P.thick(14, 44, 22, B - 12, 2, M[2]).line(14, 43, 22, B - 13, M[4]);
    box(P, 16, B - 32, 14, 3, 15, Y);
    P.r(17, B - 26, 12, 9, "#1c1c1e");
    P.hcyl(18, B - 25, 10, 7, "#8a8a8c");
    for (let x = 19; x < 28; x += 2) P.r(x, B - 25, 1, 7, "#4a4a4c");
    P.r(17, B - 16, 12, 1, Ry[1]);
    P.r(29, B - 24, 2, 1, M[4]).r(30, B - 24, 1, 6, M[3]).r(29, B - 19, 3, 2, "#c83a30");
    P.poly([ [ 20, B - 31 ], [ 23, B - 28 ], [ 17, B - 28 ] ], "#1c1c1e");
    box(P, 6, 7, 22, 2, 3, Y);
    P.r(6, 12, 22, 1, "rgba(0,0,0,0.3)");
    P.oval(25, 14, 3, 3, M[1]).oval(25, 14, 2, 2, M[4]).p(25, 14, M[0]);
    P.line(27, 12, 31, 3, "#1e1e20").line(28, 12, 31, 5, "#9a9a9c");
    P.line(24, 17, 23, B - 32, "#1e1e20");
    P.r(22, 20, 1, 5, M[3]).r(19, 25, 7, 2, "#e84a2a").r(19, 25, 7, 1, "#ff9a70");
    P.r(1, 29, 17, 10, "#1e6a3a").r(1, 29, 17, 1, "#3aa060").r(2, 30, 15, 8, "#2a8a4a");
    label(P, 1, 30, "탈출", "#f0fff0", 7, 17);
    P.poly([ [ 14, 16 ], [ 22, 19 ], [ 14, 22 ] ], "#e8602a");
    P.line(14, 16, 22, 19, "#ffa070");
    P.oval(11, 4, 6, 4, "rgba(90,255,130,0.22)");
    P.r(8, 4, 7, 3, "#1c1c1e").oval(11, 3, 2, 2, "#4ae070").r(10, 2, 2, 1, "#e8ffe8").p(12, 4, "#2a9a4a");
  });
  def("corpse", 1, 1, 4, (P, w, h, up, g, v) => {
    const B = h - 2, cloth = [ "#4a5a3a", "#5a4535", "#3a3d4a", "#6a3a3a" ][v % 4], Rc = RP(cloth), pants = [ "#2c3040", "#3a372c", "#2e2e2e" ][v % 3], Rp = RP(pants), skin = v % 5 === 0 ? C.zskin : C.skin2, Rs = RP(skin);
    const limb = (x0, y0, x1, y1, t, R) => {
      P.thick(x0, y0, x1, y1, t + 2, "#15161a");
      P.thick(x0, y0, x1, y1, t, R[2]);
      P.line(x0 - 1, y0, x1 - 1, y1, R[4]);
    };
    limb(12, B - 13, 4, B - 5, 4, Rp);
    limb(14, B - 12, 10, B - 3, 4, Rp);
    P.r(1, B - 7, 5, 4, "#15161a").r(2, B - 6, 3, 3, "#2a2622").r(8, B - 4, 5, 4, "#15161a").r(9, B - 3, 3, 2, "#2a2622");
    limb(21, B - 20, 12, B - 12, 8, Rc);
    P.line(15, B - 19, 20, B - 14, Rc[1]).line(13, B - 15, 18, B - 11, Rc[4]);
    limb(22, B - 21, 28, B - 13, 3, Rc);
    P.oval(29, B - 12, 2, 2, "#15161a").oval(29, B - 12, 1, 1, Rs[3]);
    limb(16, B - 20, 9, B - 24, 3, Rc);
    P.oval(7, B - 25, 2, 2, "#15161a").oval(7, B - 25, 1, 1, Rs[3]);
    P.oval(24, B - 25, 5, 4, "#15161a");
    P.ball(24, B - 25, 4, 3, skin);
    P.r(22, B - 29, 6, 3, "#2a2019").r(21, B - 27, 2, 3, "#2a2019");
    P.p(25, B - 25, "#1b1418").p(23, B - 24, "#1b1418").r(28, B - 23, 2, 2, C.blood2);
    P.r(17, B - 17, 2, 2, C.blood).p(18, B - 16, "#b83a3e");
  }, {
    under: (P, w, h, up, g) => {
      const B = h - 2;
      P.oval(15, B - 13, 13, 8, "#4a0e12").oval(14, B - 14, 11, 6, C.blood2).oval(12, B - 15, 6, 3, C.blood).p(10, B - 16, "#b83a3e").p(18, B - 11, "#a82a30");
      for (let k = 0; k < 6; k++) P.r(2 + g.i(26), B - 26 + g.i(22), 1 + g.i(2), 1, g.chance(.5) ? C.blood : C.blood2);
    }
  });
  def("bag", 1, 1, 4, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#5a4a36", "#4a5a3a", "#3a3f4a" ][v % 3], R = RP(base);
    P.shadow(16, B - 3, 13, 4, .4);
    P.thick(5, B - 10, 2, B - 3, 3, R[1]).thick(6, B - 10, 3, B - 3, 1, R[3]).thick(26, B - 11, 28, B - 4, 3, R[1]).thick(25, B - 11, 27, B - 4, 1, R[3]);
    P.r(2, B - 4, 4, 2, "#8a8a82").r(26, B - 5, 3, 2, "#8a8a82");
    box(P, 6, B - 22, 20, 12, 8, base);
    cut(P, 6, B - 3, 25, B - 3);
    P.r(9, B - 20, 14, 8, R[3]).r(9, B - 20, 14, 1, R[5]).r(9, B - 20, 1, 8, R[4]).r(22, B - 20, 1, 8, R[2]).r(9, B - 13, 14, 1, R[1]);
    for (let x = 10; x < 22; x += 2) P.p(x, B - 18, "#c8c0a0");
    P.r(15, B - 19, 2, 3, "#8a8a82").p(15, B - 19, "#d8d8d0");
    P.r(12, B - 24, 8, 2, R[2]).r(12, B - 24, 8, 1, R[4]);
    P.r(3, B - 16, 3, 7, "#6a8aa0").r(3, B - 16, 1, 7, "#9ab8c8").r(3, B - 17, 3, 1, "#2a2c30");
    P.r(7, B - 9, 18, 1, R[4]);
    for (let x = 8; x < 25; x += 3) P.p(x, B - 6, R[1]);
    grime(P, 7, B - 21, 18, 18, g, 5);
  });
  def("loot", 1, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2;
    P.shadow(16, B - 5, 11, 4, .36);
    P.poly([ [ 5, B - 6 ], [ 11, B - 14 ], [ 23, B - 13 ], [ 28, B - 5 ], [ 20, B - 2 ], [ 9, B - 2 ] ], "#6a5a42");
    P.poly([ [ 5, B - 6 ], [ 11, B - 14 ], [ 16, B - 13 ], [ 12, B - 6 ] ], "#8a7858");
    box(P, 9, B - 16, 10, 4, 6, "#4a5a3a");
    P.r(11, B - 11, 6, 2, "#c8b050");
    P.cyl(19, B - 16, 6, 9, "#b8bcc0", {
      e: 3
    });
    P.r(19, B - 12, 6, 3, "#c84a3a").r(19, B - 12, 1, 3, "#e87060");
    P.hcyl(12, B - 6, 9, 4, "#e8e4d8");
    P.r(12, B - 6, 1, 4, "#f8f4ea").p(15, B - 5, "#c83a34");
    P.r(24, B - 8, 2, 2, "#c8a040");
    P.r(22, B - 24, 1, 7, "#fff8d0").r(19, B - 21, 7, 1, "#fff8d0").p(22, B - 21, "#ffffff").p(21, B - 22, "#fff0a0").p(23, B - 20, "#fff0a0");
  });
  def("stash", 2, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#4a5a3c", R = RP(base), S = RP("#5a5e62");
    sbox(P, 1, B - 4, 62, 6, .48);
    box(P, 3, B - 38, 58, 16, 22, base);
    P.r(4, B - 36, 56, 12, R[3]).r(4, B - 36, 56, 1, R[4]).r(6, B - 34, 52, 8, R[4]).r(6, B - 27, 52, 1, R[5]).r(6, B - 34, 52, 1, R[3]);
    P.r(3, B - 22, 58, 3, R[2]).r(3, B - 22, 58, 1, R[5]).r(3, B - 20, 58, 1, R[0]);
    for (const x of [ 3, 55 ]) {
      P.r(x, B - 38, 6, 38, S[3]).r(x, B - 38, 6, 1, S[5]).r(x, B - 38, 1, 38, S[4]).r(x + 5, B - 38, 1, 38, S[1]);
      for (const y of [ B - 34, B - 26, B - 16, B - 6 ]) rivet(P, x + 2, y, S);
    }
    for (let x = 12; x < 54; x += 6) {
      rivet(P, x, B - 21, R);
      rivet(P, x, B - 3, R);
    }
    for (const x of [ 16, 44 ]) {
      P.r(x, B - 22, 5, 7, S[2]).r(x, B - 22, 5, 1, S[5]).r(x + 1, B - 16, 3, 1, S[1]);
    }
    P.r(29, B - 22, 6, 8, S[3]).r(29, B - 22, 6, 1, S[5]);
    P.r(30, B - 16, 1, 3, "#8a8a82").r(33, B - 16, 1, 3, "#8a8a82").r(30, B - 17, 4, 1, "#b8b8b0");
    P.r(28, B - 14, 8, 8, "#8a6a1a").r(29, B - 13, 6, 6, "#d8a830").r(29, B - 13, 6, 1, "#f8d870").r(29, B - 13, 1, 6, "#e8c050").r(34, B - 13, 1, 6, "#9a7420").r(31, B - 11, 2, 3, "#3a2a10");
    P.r(12, B - 12, 12, 6, "#d8d0a0").r(12, B - 12, 12, 1, "#e8e0b8");
    mini(P, 12, B - 11, "NO" + (1 + v % 9), "#3a4a2a", 12);
    P.r(40, B - 11, 12, 1, "rgba(216,208,160,0.6)").r(40, B - 8, 9, 1, "rgba(216,208,160,0.6)");
    scratch(P, 10, B - 36, 44, 34, g, 8, R[5]);
    rust(P, 10, B - 6, 44, 4, g, 3);
    for (const x of [ 1, 61 ]) P.r(x, B - 16, 2, 5, S[1]).r(x, B - 16, 2, 1, S[4]);
  });
  def("cot", 2, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, can = [ "#5a6a4a", "#4a5a4a", "#6a6450" ][v % 3], R = RP(can), F = RP("#7a7a70");
    P.r(4, B - 5, 56, 5, DK(.3));
    for (const x of [ 6, 30, 54 ]) {
      P.line(x - 3, B - 1, x + 3, B - 9, F[2]).line(x + 3, B - 1, x - 3, B - 9, F[3]);
      P.r(x - 4, B - 1, 3, 1, F[1]).r(x + 2, B - 1, 3, 1, F[1]);
    }
    P.r(3, B - 12, 58, 3, F[3]).r(3, B - 12, 58, 1, F[5]).r(3, B - 10, 58, 1, F[1]);
    P.r(3, B - 34, 58, 22, R[4]).r(3, B - 34, 58, 2, F[4]).r(3, B - 34, 2, 22, F[4]).r(59, B - 34, 2, 22, F[2]);
    for (let x = 12; x < 58; x += 9) P.r(x, B - 32, 1, 20, R[3]);
    P.r(6, B - 31, 12, 16, "#c8c0a8").r(6, B - 31, 12, 1, "#e0d8c0").r(6, B - 16, 12, 1, "#9a927e").r(9, B - 25, 6, 1, "#b0a890");
    const sb = [ "#6a3a2a", "#3a4a6a", "#5a5a3a" ][v % 3], Rs = RP(sb);
    P.r(22, B - 32, 36, 18, Rs[3]).r(22, B - 32, 36, 2, Rs[5]).r(22, B - 32, 1, 18, Rs[4]).r(57, B - 32, 1, 18, Rs[1]).r(22, B - 15, 36, 1, Rs[1]);
    for (let x = 28; x < 56; x += 6) P.r(x, B - 30, 1, 15, Rs[2]);
    P.r(22, B - 32, 3, 18, "#c8c0a8").r(23, B - 32, 1, 18, "#e0d8c0");
    grime(P, 5, B - 33, 54, 20, g, 8);
  });
  def("radio", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, dsk = "#5a5046", Rd = RP(dsk), Ol = "#4a5238", Ro = RP(Ol);
    sbox(P, 1, B - 3, 30, 5, .45);
    box(P, 2, B - 26, 28, 12, 3, dsk);
    grain(P, 3, B - 25, 26, 10, dsk, g, 8);
    box(P, 3, B - 11, 26, 0, 11, dsk, {
      fi: 2
    });
    P.r(6, B - 9, 20, 4, Rd[1]).r(6, B - 9, 20, 1, Rd[0]).r(14, B - 7, 4, 1, "#9aa0a8");
    P.r(4, B - 22, 11, 7, "#d8cca8").r(4, B - 22, 11, 1, "#e8dcb8").line(5, B - 18, 13, B - 20, "#b83a30").r(9, B - 21, 1, 5, "#5a8ab0");
    box(P, 8, B - 42, 18, 5, 18, Ol);
    P.r(9, B - 35, 11, 9, "#10160e").r(10, B - 34, 9, 7, "#1a3a1e");
    P.line(10, B - 29, 14, B - 32, "#6ae06a").line(14, B - 32, 18, B - 30, "#6ae06a").r(15, B - 31, 2, 2, "#e8f070").ring(15, B - 30, 3, 2, "rgba(106,224,106,0.5)");
    for (let k = 0; k < 3; k++) P.r(10, B - 33 + k * 3, 9, 1, "rgba(0,0,0,0.25)");
    P.r(10, B - 34, 9, 1, "#8aff8a");
    for (const [x, y] of [ [ 22, B - 34 ], [ 22, B - 29 ] ]) {
      P.oval(x, y, 2, 2, "#1c1c1e").p(x - 1, y - 1, "#8a8a8c").p(x, y, "#5a5a5c");
    }
    P.r(10, B - 24, 14, 2, Ro[1]);
    for (let x = 11; x < 23; x += 3) P.r(x, B - 24, 2, 1, "#c8c8c0");
    P.r(9, B - 43, 3, 2, "#2a2c30").r(10, B - 56, 1, 14, "#8a9098").p(10, B - 57, "#c8ccd0").oval(10, B - 58, 1, 1, "#c83a30");
    P.r(26, B - 30, 4, 8, "#23252a").r(26, B - 30, 4, 1, "#4a4d54").r(27, B - 22, 2, 1, "#23252a");
    for (let y = B - 22; y < B - 15; y += 2) P.p(27 + (y >> 1 & 1), y, "#3a3d44");
    P.oval(14, B - 30, 8, 6, "rgba(106,224,106,0.12)");
  });
  const STALL = [ [ "#5a6040", "#c8b888" ], [ "#8a4a24", "#d8a050" ], [ "#e8e4d8", "#b8342e" ], [ "#3a5068", "#9aa8b0" ], [ "#4a2e5a", "#d8b048" ], [ "#2e3430", "#2e3430" ], [ "#4a5236", "#6a5a3a" ], [ "#2a3a5a", "#e0e0d8" ], [ "#3a6a4a", "#e0d8b8" ], [ "#2a6a6a", "#e8e4d8" ], [ "#2a5a7a", "#e0e8e8" ] ];
  function gun(P, x, y, len, c) {
    const R = RP(c || "#2e3034");
    P.r(x, y, len, 2, R[3]).r(x, y, len, 1, R[4]).r(x - 5, y, 6, 3, "#6a4a2e").r(x - 5, y, 6, 1, "#8a6a44").r(x + 3, y + 2, 2, 3, R[2]).r(x + 6, y + 2, 3, 4, R[1]).r(x + len - 1, y - 1, 1, 1, R[4]);
  }
  function medbox(P, x, y, w) {
    box(P, x, y, w, 3, 5, "#e8e4d8", {
      fi: 3
    });
    P.r(x + (w >> 1) - 1, y + 3, 2, 5, "#2e9a4e").r(x + (w >> 1) - 2, y + 4, 4, 2, "#2e9a4e");
  }
  function helmet(P, x, y, c) {
    P.ball(x, y, 5, 4, c || "#4a5638");
    P.r(x - 6, y + 2, 12, 2, sh(c || "#4a5638", -.4));
    P.dith(x - 3, y - 2, 6, 3, sh(c || "#4a5638", -.2), 1);
  }
  function vest(P, x, y, c) {
    const R = RP(c || "#4a5234");
    P.r(x, y, 14, 12, R[3]).r(x, y, 14, 1, R[4]).r(x + 3, y - 2, 3, 2, R[2]).r(x + 8, y - 2, 3, 2, R[2]).r(x + 5, y, 4, 3, R[1]);
    for (let k = 0; k < 3; k++) P.r(x + 1 + k * 4, y + 6, 4, 5, R[2]).r(x + 1 + k * 4, y + 6, 4, 1, R[4]);
  }
  function house(P, x, y, c) {
    const R = RP(c);
    box(P, x, y + 3, 9, 2, 6, c, {
      fi: 3
    });
    P.poly([ [ x - 1, y + 4 ], [ x + 4, y - 1 ], [ x + 10, y + 4 ] ], "#a8483a");
    P.line(x - 1, y + 4, x + 4, y - 1, "#d0705a");
    P.r(x + 2, y + 7, 2, 3, "#3a2a1a").r(x + 5, y + 6, 2, 2, "#e8d890");
  }
  def("stall", 3, 2, 26, (P, w, h, up, g, v) => {
    const B = h - 2, role = v % 11, [c1, c2] = STALL[role], R1 = RP(c1), R2 = RP(c2), wood = "#6a5038", Rw = RP(wood);
    sbox(P, 1, B - 8, 94, 10, .45);
    const ty = B - 38;
    for (const x of [ 6, 88 ]) post(P, x, 24, 2, ty - 24, "#4a3a2a");
    P.r(8, ty - 22, 80, 22, "rgba(10,12,20,0.35)");
    if (role === 0) {
      box(P, 12, ty - 20, 40, 2, 18, wood);
      for (let k = 0; k < 4; k++) {
        const x = 16 + k * 9;
        P.r(x, ty - 26, 3, 26, "#2a2c30").r(x, ty - 26, 1, 26, "#5a5e64").r(x - 1, ty - 8, 5, 6, "#6a4a2e").r(x - 1, ty - 8, 1, 6, "#8a6a44").r(x + 1, ty - 16, 3, 4, "#1e2024");
      }
      box(P, 60, ty - 12, 22, 5, 7, "#56613f");
    } else if (role === 1) {
      for (const [x, y, c] of [ [ 12, ty - 14, "#56613f" ], [ 34, ty - 14, "#6d5536" ], [ 56, ty - 14, "#56613f" ], [ 22, ty - 26, "#6d5536" ], [ 46, ty - 26, "#56613f" ] ]) {
        box(P, x, y, 22, 5, 9, c);
        mini(P, x, y + 7, {
          12: "9MM",
          34: "556",
          56: "762",
          22: "12G",
          46: "9MM"
        }[x] || "9MM", "#d8d0a0", 22);
      }
    } else if (role === 2) {
      box(P, 12, ty - 24, 70, 3, 22, wood);
      for (const sy of [ ty - 13, ty - 3 ]) {
        P.r(13, sy, 68, 1, Rw[4]);
        goods(P, 14, 80, sy, 8, g, {
          cols: [ "#e8e4d8", "#8a5a2a", "#6a8ab0", "#c84a3a", "#5a8a4a" ],
          empty: .1
        });
      }
    } else if (role === 3) {
      P.r(20, ty - 26, 1, 26, "#5a5e64").r(20, ty - 26, 26, 1, "#8a9098");
      vest(P, 24, ty - 22, "#3e4630");
      vest(P, 40, ty - 20, "#2e3440");
      box(P, 58, ty - 14, 24, 4, 12, "#5a5e64");
      helmet(P, 64, ty - 16);
      helmet(P, 76, ty - 16, "#3a3d42");
    } else if (role === 4) {
      box(P, 60, ty - 26, 22, 6, 24, "#3a3d42");
      P.oval(71, ty - 12, 4, 4, "#1c1c1e").oval(71, ty - 12, 3, 3, "#8a8a8c").p(71, ty - 12, "#1c1c1e").r(76, ty - 14, 3, 1, "#c8a040");
      P.r(14, ty - 22, 40, 20, "#5a2a2a").r(14, ty - 22, 40, 1, "#7a4a4a");
      for (let k = 0; k < 4; k++) P.r(18 + k * 9, ty - 18, 6, 12, "#d8b048").r(18 + k * 9, ty - 18, 6, 1, "#f8e090");
    } else if (role === 5) {
      for (const [x, y] of [ [ 10, ty - 16 ], [ 34, ty - 18 ], [ 58, ty - 15 ] ]) box(P, x, y, 24, 5, 12, "#5a4a36");
      P.poly([ [ 8, ty - 2 ], [ 14, ty - 22 ], [ 40, ty - 26 ], [ 70, ty - 22 ], [ 86, ty - 2 ] ], "#2a302c");
      P.line(14, ty - 22, 40, ty - 26, "#4a524c").line(40, ty - 26, 70, ty - 22, "#3a423c");
      P.line(30, ty - 20, 34, ty - 4, "#1e2220").line(60, ty - 20, 58, ty - 4, "#1e2220");
    } else if (role === 6) {
      box(P, 14, ty - 26, 36, 2, 22, "#8a7a5a");
      P.r(16, ty - 23, 32, 18, "#c8b890");
      P.line(18, ty - 10, 30, ty - 20, "#3a5a8a").line(30, ty - 20, 44, ty - 14, "#3a5a8a").r(34, ty - 17, 3, 3, "#c83a30").line(20, ty - 18, 26, ty - 8, "#6a5a3a");
      post(P, 72, 6, 2, ty - 6, "#5a5e64");
      P.r(74, 7, 14, 9, "#b83a30").r(74, 11, 14, 1, "#e8e4d8").r(74, 7, 14, 1, "#e06050");
    } else if (role === 7) {
      box(P, 14, ty - 26, 40, 2, 22, "#7a5a3a");
      P.r(16, ty - 23, 36, 18, "#a8845a");
      for (let k = 0; k < 6; k++) {
        const x = 17 + k % 3 * 12, y = ty - 22 + (k >> 1 << 3 >> 1) + (k > 2 ? 4 : 0);
        P.r(x, y, 9, 7, g.pick([ "#e8e4d8", "#e8e070", "#c8e0f0" ])).p(x + 4, y, "#c83030");
        txt(P, x + 1, y + 3, 7, "#6a6458", g);
      }
      box(P, 62, ty - 22, 16, 4, 20, "#7a7d82");
      for (let k = 0; k < 3; k++) P.r(64, ty - 16 + k * 6, 12, 1, "#4a4d52").r(68, ty - 14 + k * 6, 4, 1, "#c8ccd0");
    } else if (role === 8) {
      post(P, 20, ty - 28, 2, 26, "#3a3a3a");
      P.poly([ [ 14, ty - 28 ], [ 28, ty - 28 ], [ 25, ty - 36 ], [ 17, ty - 36 ] ], "#d8c49a");
      P.r(17, ty - 28, 8, 1, "#fff0c0");
      box(P, 34, ty - 16, 18, 4, 12, "#7a5a3a");
      P.r(36, ty - 10, 14, 1, "#5a3a2a").p(42, ty - 8, "#d8b048");
      P.oval(70, ty - 20, 7, 7, "#3a3a3a").oval(70, ty - 20, 6, 6, "#e8e4d8").r(70, ty - 24, 1, 5, "#1a1a1a").r(70, ty - 20, 4, 1, "#1a1a1a");
    } else if (role === 10) {
      for (const [x, c] of [ [ 12, "#8a6a3a" ], [ 17, "#a07a48" ], [ 22, "#6a5030" ] ]) {
        P.line(x, ty - 2, x + 6, ty - 30, c);
        P.line(x + 1, ty - 2, x + 7, ty - 30, "#3a2a1a");
        P.r(x - 1, ty - 4, 3, 6, "#2a2a2e");
        P.ring(x + 3, ty - 16, 2, 2, "#3a3a44");
      }
      P.r(34, ty - 26, 30, 20, "rgba(120,150,170,0.25)");
      for (let y = ty - 26; y < ty - 6; y += 4) P.line(34, y, 64, y, "#7a9aa8");
      for (let x = 34; x <= 64; x += 5) P.line(x, ty - 26, x, ty - 6, "#7a9aa8");
      P.line(66, ty - 24, 86, ty - 24, "#c8b890");
      for (let k = 0; k < 4; k++) {
        const x = 68 + k * 5;
        P.line(x, ty - 24, x, ty - 20, "#c8b890");
        P.oval(x, ty - 16, 2, 4, "#8a7a5a");
        P.p(x, ty - 19, "#1a1a1a");
        P.poly([ [ x - 2, ty - 12 ], [ x + 2, ty - 12 ], [ x, ty - 10 ] ], "#8a7a5a");
      }
    } else {
      box(P, 14, ty - 26, 34, 2, 22, "#6a5038");
      P.r(16, ty - 23, 30, 18, "#3a3a34");
      for (let k = 0; k < 12; k++) {
        const x = 18 + k % 6 * 5, y = ty - 21 + (k / 6 | 0) * 9;
        P.p(x + 1, y, "#8a8a82").r(x, y + 1, 3, 3, "#d8b048").r(x + 1, y + 4, 1, 3, "#d8b048").p(x, y + 1, "#f8e090");
      }
      P.r(56, ty - 24, 24, 20, "#e8e4d8").r(56, ty - 24, 24, 1, "#fffbf0");
      house(P, 60, ty - 20, "#c8c0a8");
      house(P, 70, ty - 16, "#a8b8c8");
      txt(P, 58, ty - 7, 20, "#6a6458", g);
    }
    if (role === 6) {
      box(P, 4, ty, 88, 20, 0, "#7a6a4a");
      grain(P, 5, ty + 1, 86, 18, "#7a6a4a", g, 20);
      for (let r = 0; r < 3; r++) for (let x = 3 + (r & 1) * 6; x < 80; x += 12) {
        const y = B - 6 - r * 6;
        P.oval(x + 7, y, 6, 3, "#5a5038").oval(x + 7, y - 1, 6, 2, "#a89a70").r(x + 3, y - 2, 6, 1, "#c8ba90").p(x + 7, y + 1, "#6a5c40");
      }
    } else if (role === 5) {
      box(P, 4, ty, 88, 20, 18, "#5a4a36");
      for (let x = 4; x < 92; x += 22) {
        P.r(x, ty + 20, 1, 18, "#2a2018");
        label(P, x + 1, ty + 25, {
          4: "담배",
          26: "양주",
          48: "약품",
          70: "라면"
        }[x] || "", "#c8b890", 7, 21, {
          sh: "#2a2018"
        });
      }
      grain(P, 5, ty + 21, 86, 16, "#5a4a36", g, 20);
    } else {
      box(P, 4, ty, 88, 20, 18, wood);
      grain(P, 5, ty + 1, 86, 18, wood, g, 30);
      const cl = role === 2 ? "#e8e4d8" : role === 4 ? "#5a2a4a" : c1, Rl = RP(cl);
      P.r(4, ty + 20, 88, 16, Rl[3]);
      for (let x = 6; x < 92; x += 8) P.r(x, ty + 21, 2, 15, Rl[2]).r(x + 2, ty + 21, 1, 15, Rl[4]);
      P.r(4, ty + 20, 88, 1, Rl[5]);
      for (let x = 4; x < 92; x += 2) P.p(x, ty + 36, Rl[1]);
      if (role === 2) {
        P.r(45, ty + 21, 6, 16, "#2e9a4e").r(40, ty + 26, 16, 6, "#2e9a4e").r(45, ty + 21, 6, 1, "#64c482").r(40, ty + 26, 5, 1, "#64c482").r(51, ty + 26, 5, 1, "#64c482");
      }
    }
    const top = ty + 2;
    if (role === 0) {
      gun(P, 14, top + 4, 26);
      gun(P, 16, top + 12, 22, "#3a3d30");
      for (let k = 0; k < 3; k++) P.r(50 + k * 5, top + 2, 3, 6, "#2a2c30").r(50 + k * 5, top + 2, 1, 6, "#5a5e64");
      P.r(66, top + 4, 10, 4, "#2a2c30").r(64, top + 6, 4, 4, "#3a2a1a");
      P.r(66, top + 12, 14, 2, "#c8ccd0").r(62, top + 11, 5, 3, "#2a2018");
    } else if (role === 1) {
      for (let k = 0; k < 3; k++) {
        box(P, 10 + k * 14, top + 2, 11, 4, 6, "#4a5a3a");
        P.r(13 + k * 14, top + 1, 5, 2, "#2a2c28");
      }
      for (let r = 0; r < 2; r++) for (let x = 56; x < 86; x += 2) P.r(x, top + 3 + r * 7, 1, 4, "#c8a040").p(x, top + 3 + r * 7, "#b87050");
      box(P, 58, top + 12, 12, 3, 4, "#b83a30");
    } else if (role === 2) {
      for (let k = 0; k < 5; k++) {
        const x = 10 + k * 6;
        P.r(x, top + 3, 4, 6, "#e8e4d8").r(x, top + 3, 1, 6, "#ffffff").r(x, top + 2, 4, 2, g.pick([ "#c83a34", "#3a70c0", "#e8b030" ]));
      }
      medbox(P, 44, top + 2, 14);
      medbox(P, 62, top + 8, 12);
      P.hcyl(78, top + 4, 8, 4, "#e8e4d8");
      for (let k = 0; k < 4; k++) {
        const x = 12 + k * 20;
        P.r(x, 20, 1, 5, "#6a5a3a").r(x - 2, 25, 5, 7, "#5a7a3a").r(x - 2, 25, 5, 1, "#7a9a4a").p(x, 31, "#3a5a2a");
      }
    } else if (role === 3) {
      helmet(P, 16, top + 6);
      helmet(P, 30, top + 6, "#3a3d42");
      vest(P, 44, top + 2, "#4a5234");
      vest(P, 62, top + 3, "#5a4a36");
      P.r(80, top + 4, 6, 8, "#2a2c30").r(80, top + 4, 6, 1, "#5a5e64");
    } else if (role === 4) {
      P.r(18, top + 1, 2, 10, "#c8a040").r(10, top + 1, 18, 1, "#e8c060");
      for (const x of [ 10, 26 ]) {
        P.line(x + 1, top + 2, x - 1, top + 6, "#8a7030").line(x + 1, top + 2, x + 3, top + 6, "#8a7030");
        P.r(x - 2, top + 6, 7, 2, "#d8b048").r(x - 2, top + 6, 7, 1, "#f8e090");
      }
      P.r(15, top + 11, 8, 2, "#8a7030");
      for (let k = 0; k < 3; k++) box(P, 36 + k * 8, top + 4 - k, 7, 2, 3 + k, "#6a8a5a");
      for (let k = 0; k < 3; k++) P.poly([ [ 62 + k * 7, top + 12 ], [ 64 + k * 7, top + 8 ], [ 68 + k * 7, top + 8 ], [ 70 + k * 7, top + 12 ] ], "#e8c040");
      P.r(64, top + 8, 4, 1, "#fff0a0").r(80, top + 3, 5, 4, "#1c1c1e").ring(82, top + 5, 3, 2, "#c8c8c0");
    } else if (role === 5) {
      P.ball(30, top + 6, 12, 6, "#2a302c");
      P.ball(60, top + 5, 10, 5, "#343a36");
      P.r(76, top - 2, 6, 9, "#3a3a2a").r(77, top, 4, 5, "#f0b040").r(77, top, 4, 1, "#fff0a0");
      P.oval(79, top + 2, 6, 5, "rgba(255,190,80,0.18)");
      P.r(12, top + 8, 3, 7, "#4a7a4a").r(12, top + 8, 1, 7, "#6a9a6a");
    } else if (role === 6) {
      helmet(P, 20, top + 4);
      helmet(P, 68, top + 5, "#3a3d42");
      box(P, 34, top + 2, 16, 4, 8, "#4a5238");
      P.r(36, top + 7, 8, 3, "#1a3a1e").r(37, top + 8, 5, 1, "#6ae06a");
    } else if (role === 7) {
      for (let k = 0; k < 3; k++) P.r(10 + k * 3, top + 4 - k, 14, 10, k === 2 ? "#e8e4d8" : "#c8c2b0").r(10 + k * 3, top + 13 - k, 14, 1, "#9a947f");
      txt(P, 17, top + 4, 8, "#6a6458", g);
      box(P, 36, top + 2, 14, 5, 5, "#2a2c30");
      P.r(37, top + 1, 12, 2, "#1a1a1c").r(38, top, 3, 2, "#1a1a1c").r(45, top, 3, 2, "#1a1a1c");
      P.r(56, top + 6, 4, 6, "#8a3a2a").r(55, top + 12, 6, 2, "#c83a34");
      P.r(66, top + 3, 16, 11, "#3a5a8a").r(66, top + 3, 16, 1, "#5a7aaa").r(73, top + 3, 1, 11, "#2a4a7a");
    } else if (role === 8) {
      box(P, 12, top + 2, 16, 8, 5, "#7a5a3a");
      P.r(14, top + 11, 2, 4, "#5a3a2a").r(24, top + 11, 2, 4, "#5a3a2a");
      P.hcyl(36, top + 4, 26, 6, "#8a3a32");
      P.r(36, top + 4, 2, 6, "#d8c090");
      P.r(70, top + 1, 2, 10, "#3a3a3a").poly([ [ 66, top + 2 ], [ 76, top + 2 ], [ 74, top - 4 ], [ 68, top - 4 ] ], "#c8a870");
    } else if (role === 10) {
      P.hcyl(10, top + 3, 12, 8, "#6a4a3a");
      P.r(11, top + 2, 10, 2, "#8a6a4a");
      for (let k = 0; k < 4; k++) P.p(12 + k * 2, top + 1, "#d08478");
      for (let k = 0; k < 4; k++) {
        const x = 30 + k * 5;
        P.r(x, top + 2, 2, 4, "#e03a2a").r(x, top + 6, 2, 3, "#f0f0f0");
      }
      P.cyl(52, top - 2, 16, 14, "#4a5a6a", {
        e: 5
      });
      P.oval(60, top - 1, 7, 2, "#2a3a4a");
      P.oval(58, top - 2, 3, 1, "#9ab0c0").oval(63, top - 1, 3, 1, "#d8c890");
      P.oval(80, top + 6, 5, 5, "#3a3a44").oval(80, top + 6, 3, 3, "#8a8a96").p(80, top + 6, "#2a2a2e");
      P.r(84, top + 3, 4, 2, "#3a3a44");
    } else {
      house(P, 14, top + 2, "#e8e4d8");
      house(P, 28, top + 4, "#c8b8a0");
      house(P, 42, top + 1, "#a8c0b0");
      P.r(58, top + 4, 12, 8, "#e8e4d8").r(58, top + 4, 12, 1, "#fffbf0");
      txt(P, 59, top + 6, 10, "#6a6458", g);
      txt(P, 59, top + 9, 7, "#6a6458", g);
      P.r(76, top + 5, 6, 3, "#d8b048").r(81, top + 6, 3, 1, "#d8b048");
    }
    for (const x of [ 3, 91 ]) post(P, x, 20, 2, B - 20, "#4a3a2a");
    if (role === 5) {
      P.poly([ [ 2, 18 ], [ 6, 4 ], [ 48, 2 ], [ 90, 4 ], [ 94, 18 ] ], "#2a302c");
      for (let k = 0; k < 5; k++) {
        const x = 8 + g.i(76), y = 6 + g.i(10);
        P.r(x, y, 7 + g.i(6), 4 + g.i(3), g.pick([ "#3a4038", "#343a3a", "#40402e" ]));
      }
      P.line(6, 4, 48, 2, "#4a524c").line(48, 2, 90, 4, "#3a423c");
      for (let x = 2; x < 94; x += 2) P.p(x, 18 + (x >> 1 & 1), "#1e2220");
    } else if (role === 6) {
      P.r(1, 4, 94, 15, "#4a5236");
      for (let k = 0; k < 30; k++) P.oval(6 + g.i(84), 5 + g.i(13), 2 + g.i(3), 1 + g.i(2), g.pick([ "#5a5a3a", "#3a4028", "#6a5a3a", "#2e3424" ]));
      for (let x = 1; x < 92; x += 3) P.line(x, 19, x + 2, 22 + x % 2, "#3a4028");
      P.dith(1, 4, 94, 15, "rgba(20,24,16,0.4)", 0);
    } else {
      for (let x = 1; x < 95; x++) {
        const s = Math.floor((x - 1) / 8) & 1, R = s ? R2 : R1;
        P.r(x, 3, 1, 16, R[3]).p(x, 3, R[5]).r(x, 16, 1, 3, R[2]);
        if ((x - 1) % 8 === 0) P.r(x, 3, 1, 16, R[4]);
      }
      for (let k = 0; k < 12; k++) {
        const x = 1 + k * 8, R = k & 1 ? R2 : R1;
        P.r(x, 19, Math.min(8, 95 - x), 3, R[3]).r(x + 1, 22, 6, 1, R[3]).r(x + 2, 23, 4, 1, R[2]).r(x, 19, 8, 1, R[1]);
      }
    }
    P.x.clearRect(95, 0, 1, 30);
    P.r(1, 2, 94, 1, "rgba(255,255,255,0.18)");
    grime(P, 2, 4, 92, 14, g, 12, "rgba(40,30,20,0.18)");
    P.r(40, 22, 1, 4, "#3a3a3a").r(55, 22, 1, 4, "#3a3a3a");
    box(P, 34, 25, 28, 2, 11, "#e8e0c8", {
      fi: 3
    });
    label(P, 34, 28, [ "총포", "탄약", "약국", "방어구", "고물상", "창고", "용병", "보험", "가구", "부동산", "낚시" ][role] || "", "#2a2a2a", 7, 28);
  });
  const FIRE_N = 12, FIRE_C = [ "", "#c42c18", "#e8521a", "#ff9220", "#ffd646", "#fff8d6" ];
  const FIRE_L = [ {
    dx: 0,
    w: 5.8,
    h: 21,
    f: 1,
    p: 0,
    sw: 1.2,
    pw: 1.15,
    a: .12
  }, {
    dx: -3.6,
    w: 3.5,
    h: 14,
    f: 2,
    p: 1.7,
    sw: .9,
    pw: 1.25,
    a: .2
  }, {
    dx: 3.7,
    w: 3.3,
    h: 16,
    f: 1,
    p: 3.9,
    sw: 1,
    pw: 1.25,
    a: .2
  }, {
    dx: -6,
    w: 1.9,
    h: 7.5,
    f: 3,
    p: 2.6,
    sw: .7,
    pw: 1.2,
    a: .25
  }, {
    dx: 6,
    w: 1.9,
    h: 8,
    f: 2,
    p: 4.4,
    sw: .7,
    pw: 1.2,
    a: .25
  } ];
  const FIRE_B = [ {
    l: 0,
    f: 1,
    p: 0,
    rise: 7
  }, {
    l: 2,
    f: 2,
    p: .35,
    rise: 5
  }, {
    l: 1,
    f: 1,
    p: .62,
    rise: 5
  } ];
  function fireGrid(W, yb, cx, k) {
    const TAU = Math.PI * 2, ph = k / FIRE_N, H = yb + 1, g = new Uint8Array(W * H), I = new Float32Array(W * H), HT = 21, PER = 40, SEED = 11, scroll = ph * PER;
    const hash = (x, y, s) => {
      let q = x * 374761393 + y * 668265263 + s * 144665 + 7 | 0;
      q = Math.imul(q ^ q >>> 13, 1274126177);
      return ((q ^ q >>> 16) >>> 0) / 4294967296;
    };
    const vn = (x, y, cw, chh, PY, s) => {
      const gx = x / cw, gy = y / chh, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), Y = q => (q % PY + PY) % PY;
      const a = hash(x0, Y(y0), s), b = hash(x0 + 1, Y(y0), s), c = hash(x0, Y(y0 + 1), s), d = hash(x0 + 1, Y(y0 + 1), s);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    const lob = FIRE_L.map(L => L.h * (1 + L.a * Math.sin(TAU * ph * L.f + L.p)));
    for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
      const up = yb - y + .5, t = up / HT;
      const X = x + (vn(x * .5, y + scroll, 3, PER / 8, 8, SEED + 9) - .5) * 4.4 * Math.min(1, t * 1.4);
      let env = 0;
      FIRE_L.forEach((L, li) => {
        const tt = up / lob[li];
        if (tt >= 1) return;
        const sway = Math.sin(TAU * ph + L.p + tt * 2.4) * tt * tt * L.sw, half = L.w * Math.pow(1 - tt, L.pw), d = Math.abs(X + .5 - (cx + L.dx + sway)) / Math.max(.5, half);
        if (d >= 1) return;
        const e = (1 - d * d) * (1 - tt * .8);
        if (e > env) env = e;
      });
      if (env <= 0) continue;
      const n = .62 * vn(x, y + scroll, 4, PER / 8, 8, SEED) + .38 * vn(x, y + scroll, 2, PER / 16, 16, SEED + 3);
      I[y * W + x] = env * 1.8 - n * (.08 + .95 * t) * .35;
    }
    const TH = [ .1, .34, .66, 1, 1.45 ];
    for (let i = 0; i < W * H; i++) {
      let b = 0;
      for (let q = 0; q < 5; q++) if (I[i] > TH[q]) b = q + 1;
      g[i] = b;
    }
    const at = (x, y) => x < 0 || x >= W || y < 0 ? 0 : y > yb ? 4 : g[y * W + x];
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!g[i]) continue;
      const n = (at(x - 1, y) > 0) + (at(x + 1, y) > 0) + (at(x, y - 1) > 0) + (at(x, y + 1) > 0);
      if (n <= (y === yb ? 1 : 0)) g[i] = 0;
    }
    for (let pass = 0; pass < 4; pass++) for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!g[i]) continue;
      const m = Math.min(at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)) + 1;
      if (g[i] > m) g[i] = m;
    }
    for (let y = 0; y <= yb; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (g[i] !== 5) continue;
      if ((at(x - 1, y) === 5) + (at(x + 1, y) === 5) + (at(x, y - 1) === 5) + (y === yb || at(x, y + 1) === 5) < 2) g[i] = 4;
    }
    for (const b of FIRE_B) {
      const q = ((ph * b.f + b.p) % 1 + 1) % 1;
      if (q > .85) continue;
      const L = FIRE_L[b.l], bx = Math.round(cx + L.dx + Math.sin(TAU * q + b.p * 5) * 1.2), by = Math.round(yb - lob[b.l] * .82 - q * b.rise), sz = q < .35 ? 2 : 1;
      for (let a = 0; a < sz + (q < .2 ? 1 : 0); a++) for (let c = 0; c < sz; c++) {
        const X = bx + c, Y = by + a;
        if (X >= 0 && X < W && Y >= 0 && Y <= yb && !g[Y * W + X]) g[Y * W + X] = q < .3 ? 3 : q < .6 ? 2 : 1;
      }
    }
    return g;
  }
  A.fireGrid = fireGrid;
  A.FIRE_N = FIRE_N;
  def("fire", 1, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, dr = "#5a3a2a", R = RP(dr), fk = ((SX.fireAnim && SX.fireAnim.ph) | 0) % FIRE_N;
    P.shadow(16, B - 2, 10, 3, .4);
    P.cyl(7, B - 26, 18, 25, dr, {
      e: 6
    });
    hoop(P, 7, 18, B - 18, 6, R[4], R[0]);
    rust(P, 7, B - 24, 18, 22, g, 12);
    [ [ 11, B - 12 ], [ 17, B - 10 ], [ 14, B - 16 ], [ 21, B - 13 ] ].forEach(([x, y], i) => {
      const dim = fk > 0 && (fk + i * 3) % 4 === 0;
      P.r(x, y, 2, 3, dim ? "#f08020" : "#ff9a30").p(x, y, dim ? "#ffc040" : "#fff0a0").p(x + 1, y + 2, "#c84a1a");
    });
    P.oval(16, B - 23, 8, 2, "#2a0e08").oval(16, B - 23, 7, 1, "#e0501a");
    P.r(10, B - 24, 3, 2, "#3a2a1a").r(18, B - 25, 4, 2, "#4a3222");
    const yb = B - 22, fg = fireGrid(w, yb, 16, fk);
    for (let y = 0; y <= yb; y++) for (let x = 0; x < w; x++) {
      const b = fg[y * w + x];
      if (b) P.p(x, y, FIRE_C[b]);
    }
  });
  const BZ_UP = 40, BZ_N = 12, BZ_TAU = Math.PI * 2, BZ_J = 24, BZ_HC = [ 21, 28, 34 ];
  const bzRGB = h => (4278190080 | (h & 255) << 16 | h & 65280 | h >> 16 & 255) >>> 0;
  const BZC = {
    cr: bzRGB(16774338),
    ye: bzRGB(16765503),
    or: bzRGB(16752412),
    ro: bzRGB(15884315),
    rd: bzRGB(12068378),
    tp: bzRGB(9051154),
    dk: bzRGB(5903376),
    c0: bzRGB(1840916),
    c1: bzRGB(2760988),
    c2: bzRGB(3811872),
    c3: bzRGB(3352094),
    b0: bzRGB(4855824),
    b1: bzRGB(6955026),
    b2: bzRGB(9055252)
  };
  const BZ_EMB = [ BZC.or, BZC.or, BZC.ro, BZC.ro, BZC.ro, BZC.rd, BZC.rd, BZC.rd, BZC.dk, BZC.dk, BZC.c2, BZC.c2 ];
  const bzH = (a, b) => {
    let q = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0;
    q = Math.imul(q ^ q >>> 13, 1274126177);
    return ((q ^ q >>> 16) >>> 0) / 4294967296;
  };
  A.blazeV = (m, hl, x, y) => 256 + (m & 15) + 16 * ((x & 3) + 4 * ((y % 3 + 3) % 3 + 3 * Math.max(0, Math.min(2, hl | 0))));
  A.blazeInfo = v => {
    v |= 0;
    if (v < 256) return {
      m: 0,
      hl: 0,
      xp: v & 3,
      yp: (v >> 2) % 3
    };
    let c = v - 256;
    const m = c & 15;
    c = c >> 4;
    const xp = c & 3;
    c = c >> 2;
    return {
      m,
      hl: Math.min(2, c / 3 | 0),
      xp,
      yp: c % 3
    };
  };
  A.blazeLink = function(F) {
    if (!F || !F.props || !F.fireAt) return 0;
    const on = (x, y) => F.in(x, y) && F.fireAt[F.i(x, y)] ? 1 : 0;
    let n = 0;
    for (const p of F.props) {
      if (p.kind !== "blaze") continue;
      const x = Math.floor(p.x), y = Math.floor(p.y);
      let c8 = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && on(x + dx, y + dy)) c8++;
      const v = A.blazeV(on(x - 1, y) | on(x + 1, y) << 1 | on(x, y - 1) << 2 | on(x, y + 1) << 3, c8 <= 1 ? 0 : c8 <= 4 ? 1 : 2, x, y);
      if (p.v !== v) {
        p.v = v;
        n++;
      }
    }
    return n;
  };
  const bzT = new Map;
  function bzTable(rs, fk) {
    const key = rs * 16 + fk;
    let T = bzT.get(key);
    if (T) return T;
    T = {
      t: new Float32Array(128),
      pc: []
    };
    const t = fk / BZ_N;
    for (let X = 0; X < 128; X++) T.t[X] = .3 + .05 * Math.sin(BZ_TAU * (X * 2 / 128 + t) + rs);
    for (let k = 0; k < 16; k++) {
      const h = j => bzH(rs * 97 + k, j);
      const xc = k * 8 + 4 + (h(1) - .5) * 5, wd = 2.6 + h(2) * 2.2, pw = 1.25 + h(3) * .8, m = 1 + Math.floor(h(4) * 3), ph = h(5) * BZ_TAU;
      let a = (.58 + h(6) * .42) * (.7 + .3 * Math.sin(BZ_TAU * m * t + ph));
      const lk = Math.max(0, Math.sin(BZ_TAU * (1 + Math.floor(h(7) * 2)) * t + h(8) * BZ_TAU));
      a = Math.min(1.12, a + .28 * Math.pow(lk, 6));
      const c = xc + (h(9) - .5) * 2.4 * Math.sin(BZ_TAU * t * (1 + (k & 1)) + h(10) * BZ_TAU);
      for (let dx = -Math.ceil(wd); dx <= Math.ceil(wd); dx++) {
        const X = Math.round(c) + dx, z = Math.abs(X - c) / wd;
        if (z >= 1) continue;
        const val = a * Math.pow(1 - z, pw), Xi = (X % 128 + 128) % 128;
        if (val > T.t[Xi]) T.t[Xi] = val;
      }
      if (h(11) < .41) {
        const age = (fk + Math.floor(h(12) * BZ_N)) % BZ_N;
        if (age < 3) T.pc.push({
          x: c + (h(13) - .5) * 2 * age,
          a,
          age
        });
      }
    }
    bzT.set(key, T);
    return T;
  }
  const BZ_RK = [ 0, BZC.rd, BZC.ro, BZC.or, BZC.ye, BZC.cr ];
  const bzNz = [];
  function bzNoise(yp) {
    let N = bzNz[yp];
    if (N) return N;
    N = {
      a: new Float32Array(16 * 5),
      b: new Float32Array(32 * 10)
    };
    for (let i = 0; i < 80; i++) N.a[i] = bzH(i, 7001 + yp * 13);
    for (let i = 0; i < 320; i++) N.b[i] = bzH(i, 9001 + yp * 17);
    bzNz[yp] = N;
    return N;
  }
  const bzSm = f => f * f * (3 - 2 * f);
  function bzVn(A, nx, ny, X, Y, sx, sy) {
    const fx = X / sx, fy = Y / sy, ix = Math.floor(fx), iy = Math.floor(fy), tx = bzSm(fx - ix), tq = bzSm(fy - iy);
    const x0 = ix % nx, x1 = (ix + 1) % nx, y0 = iy % ny * nx, y1 = (iy + 1) % ny * nx;
    const a = A[y0 + x0] + (A[y0 + x1] - A[y0 + x0]) * tx, b = A[y1 + x0] + (A[y1 + x1] - A[y1 + x0]) * tx;
    return a + (b - a) * tq;
  }
  let bzBuf = null, bzTy = null;
  const bzTop = new Float32Array(64);
  function blazeDraw(P, w, h, up, v, fk) {
    const I = A.blazeInfo(v), Xb = I.xp * 32, tt = fk / BZ_N;
    if (!bzBuf || bzBuf.width !== w || bzBuf.height !== h) {
      bzBuf = P.x.createImageData(w, h);
      bzTy = new Uint8Array(w * h);
    }
    const px = new Uint32Array(bzBuf.data.buffer), ty = bzTy;
    px.fill(0);
    ty.fill(0);
    for (let ly = 0; ly < 32; ly++) for (let lx = 0; lx < w; lx++) {
      const dW = I.m & 1 ? 99 : lx + .5, dE = I.m & 2 ? 99 : w - .5 - lx, dN = I.m & 4 ? 99 : ly + .5, dS = I.m & 8 ? 99 : 31.5 - ly;
      let dd = Math.min(dW, dE, dN, dS);
      if (dW < 99 && dN < 99) dd = Math.min(dd, 6 - Math.hypot(Math.max(0, 6 - dW), Math.max(0, 6 - dN)));
      if (dE < 99 && dN < 99) dd = Math.min(dd, 6 - Math.hypot(Math.max(0, 6 - dE), Math.max(0, 6 - dN)));
      if (dW < 99 && dS < 99) dd = Math.min(dd, 6 - Math.hypot(Math.max(0, 6 - dW), Math.max(0, 6 - dS)));
      if (dE < 99 && dS < 99) dd = Math.min(dd, 6 - Math.hypot(Math.max(0, 6 - dE), Math.max(0, 6 - dS)));
      const e = dd + (bzH(Xb + lx + ly * 128, I.yp * 977 + 5) - .5) * 3;
      if (e < .6) continue;
      const i = (up + ly) * w + lx, h2 = bzH(Xb + lx + ly * 128, I.yp * 977 + 9);
      ty[i] = 1;
      if (e < 4.2) px[i] = e > 1.8 && h2 < .1 ? BZ_EMB[(fk + (h2 * 120 | 0)) % BZ_N] : h2 < .45 ? BZC.c1 : h2 < .8 ? BZC.c3 : BZC.c2; else px[i] = h2 < .08 ? BZ_EMB[(fk + (h2 * 150 | 0)) % BZ_N] : h2 < .4 ? BZC.b0 : h2 < .75 ? BZC.b1 : BZC.b2;
    }
    const Hc = BZ_HC[I.hl], half = w / 2, T = bzTable(I.yp, fk).t, N = bzNoise(I.yp), So = I.m & 8 ? 0 : 1, No = I.m & 4 ? 0 : 1, sc = fk * 5, rp = I.yp * 1.7;
    for (let lx = 0; lx < w; lx++) {
      const X = lx + .5, left = X < half, u0 = left ? X : w - X, jn = left ? I.m & 1 : I.m & 2;
      let bj = 0, ex = 1;
      if (jn) {
        const u = Math.min(1, u0 / half);
        bj = 1 - bzSm(u);
      } else {
        const u = (u0 - 3) / 10;
        if (u <= 0) {
          bzTop[lx] = 999;
          continue;
        }
        ex = u >= 1 ? 1 : bzSm(u);
      }
      const Xw = Xb + lx, yB = So ? up + 28 + 1.5 * Math.sin(BZ_TAU * Xw * 5 / 128 + I.yp * 2.3) : up + 32, Dd = 22 - 5 * No + (20 - (22 - 5 * No)) * bj, Eh = Hc * (No ? .8 : 1) + (BZ_J - Hc * (No ? .8 : 1)) * bj;
      let top = 999;
      const Hmax = (Dd + yB - up - 28 + Eh * 1.15) * (.4 + .6 * ex) + 6;
      for (let y = Math.min(h - 1, Math.floor(yB)); y >= Math.max(0, Math.floor(yB - Hmax)); y--) {
        const hh = yB - y;
        const sw = (.2 + hh / 30) * (1.1 * Math.sin(BZ_TAU * (Xw * 3 / 128 + 2 * tt) + .3 * hh + rp) + .6 * Math.sin(BZ_TAU * (Xw * 7 / 128 - 3 * tt) - .5 * hh + 2 * rp));
        let xq = Xw + .5 + sw;
        xq -= Math.floor(xq / 128) * 128;
        const xi = Math.floor(xq), f = xq - xi, Tv = T[xi] * (1 - f) + T[xi + 1 & 127] * f;
        const Ht = (Dd + yB - up - 28 + Eh * (.45 + .6 * Tv)) * (.4 + .6 * ex), sq = hh / Ht;
        let Yn = up + 32 - y - sc;
        Yn -= Math.floor(Yn / 60) * 60;
        const n = .65 * bzVn(N.a, 16, 5, xq, Yn, 8, 12) + .35 * bzVn(N.b, 32, 10, xq, Yn, 4, 6);
        const Iv = 1.25 - 1.1 * sq + (n - .5) * .85 * Math.min(1, .3 + sq) - (1 - ex) * .3;
        if (Iv <= .16) continue;
        const i = y * w + lx;
        px[i] = BZ_RK[Iv > 1 ? 5 : Iv > .72 ? 4 : Iv > .47 ? 3 : 2];
        ty[i] = 2;
        top = y;
      }
      bzTop[lx] = top;
    }
    for (const pc of bzTable(I.yp, fk).pc) {
      let lx = pc.x - Xb;
      lx -= Math.round(lx / 128) * 128;
      if (lx < 2 || lx > w - 3) continue;
      const cx = Math.round(lx), tp = bzTop[cx];
      if (tp > up + 10) continue;
      const cy = tp - 3 - pc.age * 3;
      const sh = pc.age === 0 ? [ [ 0, 0, BZC.ro ], [ 1, 0, BZC.rd ], [ 0, -1, BZC.rd ], [ 0, 1, BZC.rd ], [ 1, 1, BZC.tp ] ] : pc.age === 1 ? [ [ 0, 0, BZC.rd ], [ 1, 0, BZC.tp ], [ 0, 1, BZC.tp ] ] : [ [ 0, 0, BZC.dk ] ];
      for (const [dx, dy, c] of sh) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const i = y * w + x;
        if (ty[i]) continue;
        px[i] = c;
        ty[i] = 3;
      }
    }
    const nd = (bzH(Xb + 7, I.yp * 31 + I.hl) < .6 ? 1 : 0) + (I.hl === 2 && bzH(Xb + 9, I.yp * 31) < .5 ? 1 : 0);
    for (let k = 0; k < nd; k++) {
      const hh = j => bzH(Xb * 3 + k * 17 + I.yp * 101, j), len = 5 + (hh(1) * 4 | 0), x0 = 5 + (hh(2) * (w - 10 - len) | 0), y0 = up + 25 + (hh(3) * 4 | 0), sl = hh(4) < .5 ? 0 : hh(4) < .75 ? 1 : -1;
      for (let j = 0; j < len; j++) {
        const x = x0 + j, y = y0 + (sl ? Math.floor(j * sl / 3) : 0);
        for (let s = 0; s < 2; s++) {
          const yy = y + s, i = yy * w + x;
          if (yy >= h || !ty[i]) continue;
          px[i] = s ? BZC.c1 : (fk + (bzH(j + k * 31, Xb + 3) * 12 | 0)) % BZ_N < 3 ? BZC.or : (j * 7 + k) % 3 === 0 ? BZC.ro : BZC.c2;
          ty[i] = 1;
        }
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, t = ty[i];
      if (t !== 1 && t !== 2) continue;
      const eU = y > 0 && !ty[i - w], eD = y < h - 1 && !ty[i + w], eL = x > 0 && !ty[i - 1], eR = x < w - 1 && !ty[i + 1];
      if (!(eU || eD || eL || eR)) continue;
      px[i] = t === 1 ? BZC.c0 : eU && (eL || eR) ? BZC.tp : BZC.rd;
    }
    P.x.putImageData(bzBuf, 0, 0);
  }
  A.blazeDraw = blazeDraw;
  def("blaze", 1, 1, BZ_UP, (P, w, h, up, g, v) => blazeDraw(P, w, h, up, v, ((SX.fireAnim && SX.fireAnim.ph) | 0) % BZ_N), {
    outline: false
  });
  def("plankV", 1, 3, 3, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#8a6a48", "#7a5e40", "#94744e", "#806246" ][v % 4], R = RP(base);
    sbox(P, 8, B - 2, 17, 4, .3);
    box(P, 9, 2, 14, B - 5, 2, base);
    for (let k = 0; k < 9; k++) {
      const x = 11 + g.i(10), y = 6 + g.i(B - 20), l = 4 + g.i(10);
      P.r(x, y, 1, l, g.chance(.6) ? R[2] : R[4]);
    }
    for (const y of [ 6, B - 9 ]) P.p(12, y, "#3a3430").p(19, y, "#3a3430");
  });
  def("plankH", 3, 1, 3, (P, w, h, up, g, v) => {
    const B = h - 2, base = [ "#8a6a48", "#7a5e40", "#94744e", "#806246" ][v % 4];
    sbox(P, 2, B - 4, 92, 5, .3);
    box(P, 3, 9, 90, 13, 2, base);
    grain(P, 5, 10, 86, 11, base, g, 12);
    for (const x of [ 7, 88 ]) P.p(x, 12, "#3a3430").p(x, 18, "#3a3430");
  });
  def("adBoard", 3, 1, 30, (P, w, h, up, g, v) => {
    const a = SX.adOf ? SX.adOf("board") : {
      brand: "광고",
      sub: "AD",
      bg: "#f2d034",
      fg: "#1c1c1c",
      acc: "#d8402a"
    }, B = h - 2, M = RP("#4a4d52"), R = RP(a.bg);
    for (const x of [ 16, 77 ]) {
      P.shadow(x + 1, B - 1, 4, 1, .4);
      post(P, x, 38, 3, B - 39, "#4a4d52");
      P.r(x - 1, B - 3, 5, 3, M[2]).r(x - 1, B - 3, 5, 1, M[4]);
    }
    P.r(2, 2, 92, 38, M[1]).r(3, 3, 90, 36, a.bg);
    vgrad(P, 3, 3, 90, 36, R[4], R[2], .1, .9);
    P.r(3, 3, 90, 3, a.acc).r(3, 36, 90, 3, a.acc).r(2, 39, 92, 1, M[0]);
    label(P, 3, 9, a.brand, a.fg, 11, 90, {
      sh: R[1]
    });
    mini(P, 3, 22, a.sub, a.acc, 90);
    if (!(SX.ADS && SX.ADS.slots && SX.ADS.slots.board)) label(P, 3, 27, "광고 문의", a.fg, 9, 90);
    for (const x of [ 8, 48, 86 ]) P.r(x, 0, 2, 3, "#2a2c30").p(x, 3, "#ffe8a0");
  });
  def("bigBoard", 4, 1, 64, (P, w, h, up, g, v) => {
    const a = SX.adOf ? SX.adOf("board") : {
      brand: "광고",
      sub: "AD",
      bg: "#f2d034",
      fg: "#1c1c1c",
      acc: "#d8402a"
    }, B = h - 2, M = RP("#4a4d52"), R = RP(a.bg);
    for (const x of [ 28, 96 ]) {
      P.shadow(x + 1, B - 1, 5, 1, .45);
      post(P, x, 58, 4, B - 59, "#4a4d52");
      P.r(x - 1, B - 3, 6, 3, M[2]).r(x - 1, B - 3, 6, 1, M[4]);
    }
    P.r(30, 58, 70, 2, M[1]);
    P.r(1, 1, 126, 58, M[0]).r(2, 2, 124, 56, M[2]).r(4, 4, 120, 52, a.bg);
    vgrad(P, 4, 4, 120, 52, R[4], R[2], .1, .9);
    P.r(4, 4, 120, 3, a.acc).r(4, 53, 120, 3, a.acc);
    label(P, 4, 10, a.brand, a.fg, 11, 120, {
      sh: R[1],
      s: 2
    });
    mini(P, 4, 32, a.sub, a.acc, 120, 2);
    if (!(SX.ADS && SX.ADS.slots && SX.ADS.slots.board)) label(P, 4, 43, "광고 문의", a.fg, 9, 120);
    for (const x of [ 14, 62, 110 ]) {
      P.r(x, 0, 3, 3, "#2a2c30").r(x - 1, 3, 5, 1, "#ffe8a0");
    }
  }, {
    outline: true
  });
  def("sign", 2, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, bg = [ "#2a4a8a", "#8a2a2a", "#2a6a3a", "#8a6a1a" ][v % 4], R = RP(bg), M = RP("#4a4d52");
    for (const x of [ 11, 50 ]) {
      P.shadow(x + 1, B - 1, 4, 1, .4);
      post(P, x, 30, 3, B - 31, "#4a4d52");
      P.r(x - 1, B - 3, 5, 3, M[2]).r(x - 1, B - 3, 5, 1, M[4]);
    }
    P.r(2, 4, 60, 2, M[4]).r(2, 4, 60, 1, M[5]);
    P.r(2, 6, 60, 26, M[1]).r(3, 7, 58, 24, R[3]);
    vgrad(P, 3, 7, 58, 24, R[4], R[2], .1, .95);
    P.r(3, 7, 58, 1, R[5]).r(2, 31, 60, 1, M[0]);
    P.oval(10, 18, 5, 5, "#f0e8d0").oval(10, 18, 3, 3, R[2]).r(9, 15, 2, 7, "#f0e8d0");
    label(P, 17, 13, [ "편의점", "약국", "식당", "부동산", "세탁소", "미용실", "노래방", "치킨", "장터", "환전소", "수리점", "식수", "사격장", "헬스장", "낚시터" ][v % 15], "#f0e8d0", 11, 44, {
      sh: R[1]
    });
    for (let k = 0; k < 6; k++) {
      const x = 4 + g.i(54), y = 8 + g.i(20);
      P.r(x, y, 2 + g.i(4), 1 + g.i(2), R[1]);
    }
    for (let k = 0; k < 3; k++) drip(P, 6 + g.i(52), 28, 3 + g.i(4), "rgba(110,55,25,0.45)");
    for (const x of [ 16, 46 ]) {
      P.r(x, 1, 1, 4, M[3]).r(x - 2, 1, 5, 2, "#2a2c30").r(x - 1, 3, 3, 1, "#f0e0a0");
    }
  });
  def("atm", 1, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, base = "#5a6270", R = RP(base);
    sbox(P, 1, B - 3, 30, 5, .45);
    box(P, 3, B - 50, 26, 8, 42, base);
    P.r(4, B - 42, 24, 6, "#2a6ab0").r(4, B - 42, 24, 1, "#6aa0e0").r(4, B - 37, 24, 1, "#1a4a80");
    mini(P, 4, B - 41, "ATM", "#f0f4ff", 24);
    P.r(4, B - 36, 24, 2, "rgba(0,0,0,0.35)");
    P.r(6, B - 34, 20, 13, R[1]).r(7, B - 33, 18, 11, "#1a2430");
    screen(P, 8, B - 32, 16, 9, "#3a8ac0", g);
    if (v % 3 === 1) crack(P, 13, B - 28, g, 6, "#c8e0f0");
    P.r(6, B - 20, 20, 9, R[2]).r(6, B - 20, 20, 1, R[4]);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) P.r(8 + i * 3, B - 19 + j * 2, 2, 1, "#c8ccd0");
    P.r(18, B - 19, 3, 1, "#c83a30").r(18, B - 17, 3, 1, "#e8c030").r(18, B - 15, 3, 1, "#3aa050");
    P.r(22, B - 19, 3, 1, "#101214").p(23, B - 18, "#4ae070");
    P.r(7, B - 9, 18, 3, "#101214").r(7, B - 9, 18, 1, "#08090a").r(8, B - 7, 16, 1, R[4]);
    if (v % 2) {
      P.line(9, B - 8, 13, B - 11, "#b8bcc0").line(16, B - 9, 20, B - 12, "#b8bcc0");
    }
    scratch(P, 4, B - 34, 24, 30, g, 5, R[5]);
    grime(P, 4, B - 6, 24, 5, g, 5);
  });
  def("escape", 1, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, red = "#c02a26", R = RP(red), M = RP("#9aa0a6");
    sbox(P, 1, B - 4, 30, 6, .48);
    post(P, 2, 12, 3, B - 12, "#9aa0a6");
    P.r(1, B - 2, 5, 2, M[1]).r(1, B - 2, 5, 1, M[3]);
    P.r(2, 12, 28, 3, M[3]).r(2, 12, 28, 1, M[5]).r(2, 14, 28, 1, M[1]);
    P.thick(5, 22, 12, 15, 2, M[2]);
    P.r(26, 15, 2, 3, M[2]);
    P.oval(26, 21, 4, 4, "#4a4e54").oval(26, 20, 3, 3, "#c8ccd0").oval(26, 20, 1, 1, red).p(25, 18, "#ffffff");
    P.r(24, 24, 1, B - 38, "#e8e4d8").r(30, 24, 1, B - 42, "#e8e4d8");
    for (let y = 25; y < B - 14; y += 3) P.p(24, y, "#c83a30");
    for (let y = 26; y < B - 18; y += 3) P.p(30, y, "#c83a30");
    P.ring(27, B - 13, 3, 4, "#e8702a").ring(27, B - 13, 2, 3, "#f8b070").r(25, B - 9, 5, 2, "#e8702a");
    box(P, 5, B - 36, 18, 5, 31, red);
    P.r(6, B - 30, 16, 29, R[3]).r(6, B - 30, 16, 1, R[5]).r(6, B - 30, 1, 29, R[4]).r(21, B - 30, 1, 29, R[1]).r(6, B - 2, 16, 1, R[0]);
    label(P, 6, B - 28, "비상", "#fff8f0", 7, 16);
    P.r(7, B - 19, 14, 11, "#f0ece0").r(7, B - 19, 14, 1, "#ffffff");
    P.r(13, B - 18, 3, 1, "#2a2c30").r(14, B - 17, 1, 3, "#2a2c30").oval(14, B - 13, 1, 1, "#2a2c30").line(14, B - 12, 12, B - 10, "#2a2c30").line(14, B - 12, 16, B - 10, "#2a2c30").r(9, B - 17, 1, 7, "#c83a30").r(19, B - 17, 1, 7, "#c83a30");
    P.r(19, B - 6, 2, 3, "#e8e4d8");
    scratch(P, 6, B - 30, 16, 26, g, 3, R[5]);
    P.oval(12, 6, 11, 5, "rgba(80,255,130,0.16)");
    P.r(2, 2, 19, 9, "#1a3a22").r(3, 3, 17, 7, "#2ec060").r(3, 3, 17, 1, "#9af0b0");
    P.r(5, 4, 2, 2, "#f0fff0").r(5, 6, 3, 1, "#f0fff0").p(4, 8, "#f0fff0").p(7, 8, "#f0fff0").r(11, 4, 7, 5, "#f0fff0").r(12, 5, 5, 3, "#2ec060").r(10, 5, 1, 3, "#f0fff0");
    P.r(3, 11, 1, 1, "#3a3d42");
  });
  const parkGateOver = (P, w, h, up, g, v) => {
    const y = 18, x0 = 3, bw = w - 6, M = RP("#5a5e64"), cx = w >> 1;
    for (const x of [ 16, w - 18 ]) P.r(x, 0, 2, y, M[2]).r(x, 0, 1, y, M[4]);
    P.r(x0, y, bw, 7, "#1e2024");
    for (let x = -8; x < bw; x += 12) P.poly([ [ x0 + x, y + 7 ], [ x0 + x + 7, y ], [ x0 + x + 13, y ], [ x0 + x + 6, y + 7 ] ], "#e8b830");
    P.x.clearRect(0, y, x0, 7);
    P.x.clearRect(x0 + bw, y, w - x0 - bw, 7);
    P.r(x0, y, bw, 1, "rgba(255,255,255,0.4)").r(x0, y + 6, bw, 1, "rgba(0,0,0,0.4)").r(x0, y, 1, 7, "rgba(255,255,255,0.25)").r(x0 + bw - 1, y, 1, 7, "rgba(0,0,0,0.35)");
    scratch(P, x0 + 1, y + 1, bw - 2, 5, g, 6, "#3a3020");
    P.oval(cx, y - 6, 26, 8, "rgba(80,255,130,0.14)");
    P.r(cx - 22, y - 13, 44, 13, "#1a3a22").r(cx - 21, y - 12, 42, 11, "#2ec060").r(cx - 21, y - 12, 42, 1, "#9af0b0");
    label(P, cx - 20, y - 11, "출구", "#f0fff0", 7, 26);
    if (v === 1) P.r(cx + 11, y - 10, 2, 6, "#f0fff0").r(cx + 9, y - 5, 6, 1, "#f0fff0").r(cx + 10, y - 4, 4, 1, "#f0fff0").r(cx + 11, y - 3, 2, 1, "#f0fff0"); else P.r(cx + 11, y - 8, 2, 6, "#f0fff0").r(cx + 9, y - 8, 6, 1, "#f0fff0").r(cx + 10, y - 9, 4, 1, "#f0fff0").r(cx + 11, y - 10, 2, 1, "#f0fff0");
    const sx = w - 34, sy = y - 8;
    P.oval(sx, sy, 10, 10, "#1e2024").oval(sx, sy, 9, 9, "#c83a30").oval(sx, sy, 7, 7, "#f8f4ea");
    mini(P, sx - 4, sy - 2, "2", "#1e2024");
    P.r(sx, sy + 2, 1, 1, "#1e2024");
    mini(P, sx + 2, sy - 2, "3", "#1e2024");
  };
  def("parkGate", 5, 1, 72, (P, w, h, up, g, v) => {
    P.r(6, h - 22, w - 12, 2, "rgba(0,0,0,0.1)");
  }, {
    over: parkGateOver
  });
  const exitSignOver = (P, w, h, up, g, v) => {
    const y = 10, cx = w >> 1, M = RP("#5a5e64"), L = "#f0fff0";
    for (const x of [ cx - 15, cx + 13 ]) P.r(x, 0, 2, y, M[2]).r(x, 0, 1, y, M[4]);
    P.oval(cx, y + 7, 26, 10, "rgba(80,255,130,0.16)");
    P.r(cx - 20, y, 40, 14, "#1a3a22").r(cx - 19, y + 1, 38, 12, "#2ec060").r(cx - 19, y + 1, 38, 1, "#9af0b0").r(cx - 19, y + 12, 38, 1, "#1e8a44");
    const ax = cx - 18, ay = y + 2;
    P.r(ax + 3, ay + 1, 2, 2, L).r(ax + 2, ay + 3, 3, 3, L).r(ax + 5, ay + 4, 2, 1, L).r(ax + 1, ay + 4, 1, 1, L).p(ax + 1, ay + 7, L).r(ax + 2, ay + 6, 1, 2, L).r(ax + 4, ay + 6, 1, 1, L).r(ax + 5, ay + 7, 1, 2, L);
    P.r(ax + 9, ay + 1, 1, 8, L).r(ax + 9, ay + 1, 4, 1, L);
    label(P, cx - 7, y + 3, "비상구", L, 7, 25);
  };
  def("exitSign", 2, 1, 64, (P, w, h, up, g, v) => {}, {
    over: exitSignOver
  });
  def("mapBoard", 1, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, wood = "#6a4a30", Rw = RP(wood);
    for (const x of [ 6, 23 ]) {
      P.shadow(x + 1, B - 1, 4, 1, .45);
      post(P, x, 34, 3, B - 34, wood);
      P.r(x - 1, B - 2, 5, 2, Rw[1]);
    }
    P.poly([ [ 1, 9 ], [ 5, 3 ], [ 27, 3 ], [ 31, 9 ] ], Rw[3]);
    P.r(1, 8, 30, 2, Rw[1]).r(5, 3, 22, 1, Rw[5]);
    P.line(1, 9, 5, 3, Rw[4]);
    P.r(2, 10, 28, 25, Rw[2]).r(2, 10, 28, 1, Rw[4]).r(2, 10, 1, 25, Rw[4]).r(29, 10, 1, 25, Rw[1]).r(2, 34, 28, 1, Rw[0]);
    P.r(4, 12, 24, 21, "#d8cca4");
    P.r(4, 12, 24, 21, "#d8cca4");
    for (let k = 0; k < 4; k++) P.r(5 + g.i(18), 13 + g.i(16), 4, 3, "#9ab880");
    P.poly([ [ 4, 22 ], [ 12, 19 ], [ 20, 22 ], [ 28, 18 ], [ 28, 22 ], [ 20, 26 ], [ 12, 23 ], [ 4, 26 ] ], "#5a8ab8");
    P.line(4, 23, 12, 20, "#8ab8e0").line(20, 23, 28, 19, "#8ab8e0");
    for (const x of [ 9, 17, 24 ]) P.r(x, 12, 1, 21, "#8a8272");
    for (const y of [ 15, 29 ]) P.r(4, y, 24, 1, "#8a8272");
    for (let k = 0; k < 4; k++) {
      const x = 6 + g.i(20), y = 13 + g.i(18);
      P.line(x - 1, y - 1, x + 1, y + 1, "#c83030").line(x + 1, y - 1, x - 1, y + 1, "#c83030");
    }
    for (let x = 6; x < 26; x += 3) P.p(x, 30 - (x / 3 & 1), "#c83030");
    P.r(22, 13, 5, 4, "#f0ece0").p(24, 13, "#3050c0").r(5, 28, 3, 3, "#e8e070").p(6, 28, "#c83030");
    P.oval(14, 17, 2, 2, "#1a1a1a").oval(14, 17, 1, 1, "#f0c030");
    grime(P, 4, 12, 24, 21, g, 6, "rgba(90,70,40,0.2)");
  });
  def("rug", 2, 2, 0, (P, w, h, up, g, v, col) => {
    const R = RP(col), cr = mix(col, "#e8d8b0", .62), Rc = RP(cr), nv = mix(col, "#1e2a44", .65);
    const x0 = 5, y0 = 5, W = 54, H = 54;
    P.r(x0 + 1, y0 + H, W, 1, "rgba(0,0,0,0.3)");
    for (let y = y0 + 1; y < y0 + H - 1; y += 2) {
      P.r(x0 - 3, y, 3, 1, Rc[3]).r(x0 + W, y, 3, 1, Rc[3]);
    }
    P.r(x0, y0, W, H, R[1]).r(x0 + 1, y0 + 1, W - 2, H - 2, cr).r(x0 + 3, y0 + 3, W - 6, H - 6, nv).r(x0 + 5, y0 + 5, W - 10, H - 10, cr).r(x0 + 6, y0 + 6, W - 12, H - 12, R[3]);
    for (let k = 4; k < W - 4; k += 4) {
      P.p(x0 + k, y0 + 4, Rc[5]).p(x0 + k, y0 + H - 5, Rc[5]);
    }
    for (let k = 4; k < H - 4; k += 4) {
      P.p(x0 + 4, y0 + k, Rc[5]).p(x0 + W - 5, y0 + k, Rc[5]);
    }
    const cx = x0 + W / 2, cy = y0 + H / 2;
    P.poly([ [ cx, cy - 18 ], [ cx + 18, cy ], [ cx, cy + 18 ], [ cx - 18, cy ] ], R[1]);
    P.poly([ [ cx, cy - 15 ], [ cx + 15, cy ], [ cx, cy + 15 ], [ cx - 15, cy ] ], nv);
    P.poly([ [ cx, cy - 11 ], [ cx + 11, cy ], [ cx, cy + 11 ], [ cx - 11, cy ] ], cr);
    P.poly([ [ cx, cy - 8 ], [ cx + 8, cy ], [ cx, cy + 8 ], [ cx - 8, cy ] ], R[4]);
    P.poly([ [ cx, cy - 4 ], [ cx + 4, cy ], [ cx, cy + 4 ], [ cx - 4, cy ] ], R[1]);
    P.r(cx - 1, cy - 1, 2, 2, cr);
    for (const [ax, ay, sx, sy] of [ [ x0 + 6, y0 + 6, 1, 1 ], [ x0 + W - 6, y0 + 6, -1, 1 ], [ x0 + 6, y0 + H - 6, 1, -1 ], [ x0 + W - 6, y0 + H - 6, -1, -1 ] ]) {
      P.poly([ [ ax, ay ], [ ax + sx * 10, ay ], [ ax, ay + sy * 10 ] ], nv);
      P.poly([ [ ax, ay ], [ ax + sx * 6, ay ], [ ax, ay + sy * 6 ] ], cr);
    }
    for (let k = 0; k < 10; k++) P.p(x0 + 8 + g.i(W - 16), y0 + 8 + g.i(H - 16), R[4]);
    P.oval(x0 + 14 + g.i(20), y0 + 36 + g.i(8), 6, 3, "rgba(255,240,220,0.07)");
    grime(P, x0 + 2, y0 + 2, W - 4, H - 4, g, 8, "rgba(40,30,20,0.12)");
  }, {
    color: "#8a3a32"
  });
  def("rugBig", 3, 2, 0, (P, w, h, up, g, v, col) => {
    const R = RP(col), cr = mix(col, "#e8d8b0", .62), nv = mix(col, "#1e2a44", .7), oc = mix(col, "#c89030", .55);
    const x0 = 6, y0 = 6, W = 84, H = 52;
    P.r(x0 + 1, y0 + H, W, 1, "rgba(0,0,0,0.3)");
    for (let y = y0 + 1; y < y0 + H - 1; y += 2) {
      P.r(x0 - 4, y, 4, 1, cr).r(x0 + W, y, 4, 1, cr);
    }
    P.r(x0, y0, W, H, R[1]).r(x0 + 1, y0 + 1, W - 2, H - 2, R[3]);
    const bands = [ [ 3, cr ], [ 4, nv ], [ 2, oc ], [ 5, R[3] ], [ 3, cr ], [ 6, nv ], [ 3, cr ], [ 5, R[3] ], [ 2, oc ], [ 4, nv ], [ 3, cr ] ];
    let x = x0 + 2;
    for (const [bw, c] of bands) {
      P.r(x, y0 + 1, bw * 2 - 1, H - 2, c);
      x += bw * 2;
    }
    for (let k = 0; k < 3; k++) {
      const bx = x0 + 20 + k * 20, by = y0 + H / 2;
      P.poly([ [ bx, by - 12 ], [ bx + 6, by ], [ bx, by + 12 ], [ bx - 6, by ] ], k === 1 ? cr : oc);
      P.poly([ [ bx, by - 7 ], [ bx + 3, by ], [ bx, by + 7 ], [ bx - 3, by ] ], R[1]);
    }
    for (let y = y0 + 4; y < y0 + H - 4; y += 6) for (let xx = x0 + 4; xx < x0 + W - 4; xx += 10) P.p(xx + (y >> 1) % 5, y, cr);
    P.r(x0 + 1, y0 + 1, W - 2, 1, R[4]).r(x0 + 1, y0 + H - 2, W - 2, 1, R[0]);
    grime(P, x0 + 2, y0 + 2, W - 4, H - 4, g, 12, "rgba(40,30,20,0.12)");
  }, {
    color: "#7a3a2e"
  });
  def("floorLamp", 1, 1, 36, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), M = RP("#3a3a3c");
    P.shadow(16, B - 2, 7, 2, .45);
    P.oval(16, B - 3, 6, 2, M[1]).oval(16, B - 4, 6, 2, M[3]).r(12, B - 5, 4, 1, M[5]);
    P.r(15, 18, 2, B - 21, M[3]).r(15, 18, 1, B - 21, M[5]);
    P.oval(16, 20, 3, 1, "#fff0c0");
    for (let y = 4; y < 19; y++) {
      const t = (y - 4) / 14, hw = Math.round(6 + t * 4);
      for (let x = 16 - hw; x < 16 + hw; x++) {
        const u = (x - (16 - hw)) / (hw * 2);
        P.p(x, y, u < .18 ? R[5] : u < .5 ? R[4] : u < .8 ? R[3] : R[2]);
      }
    }
    P.r(10, 4, 12, 1, R[3]).r(6, 18, 20, 1, mix(col, "#fff4d0", .5)).r(7, 19, 18, 1, R[2]);
    for (let x = 11; x < 22; x += 3) P.r(x, 6, 1, 11, rgba(R[2], .25));
    P.r(21, 19, 1, 4, "#c8a040").p(21, 23, "#e8c060");
  }, {
    color: "#d8c49a"
  });
  def("tv", 2, 1, 24, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 3, B - 28, 58, 14, 14, col);
    grain(P, 4, B - 27, 56, 12, col, g, 18);
    P.r(4, B - 13, 18, 10, R[1]).r(4, B - 13, 18, 1, R[0]);
    box(P, 6, B - 10, 14, 2, 3, "#2a2c30");
    P.p(18, B - 7, "#4ae070");
    for (const x of [ 23, 42 ]) {
      P.r(x, B - 13, 18, 10, R[3]).r(x, B - 13, 18, 1, R[4]).r(x, B - 13, 1, 10, R[4]).r(x + 17, B - 13, 1, 10, R[1]).r(x, B - 4, 18, 1, R[1]).r(x + (x === 23 ? 15 : 2), B - 9, 1, 3, "#c8a040");
    }
    P.r(5, B - 2, 3, 2, R[0]).r(56, B - 2, 3, 2, R[0]);
    P.r(26, B - 24, 12, 2, "#1c1c20").r(26, B - 24, 12, 1, "#3a3a40").r(31, B - 28, 2, 4, "#2a2a2e");
    P.r(9, B - 50, 46, 24, "#141418").r(10, B - 49, 44, 21, "#1c2228");
    vgrad(P, 10, B - 49, 44, 21, "#26303a", "#161b20", 0, 1);
    P.line(12, B - 30, 30, B - 48, "rgba(200,220,240,0.12)").line(15, B - 30, 33, B - 48, "rgba(200,220,240,0.08)").line(38, B - 30, 50, B - 42, "rgba(200,220,240,0.08)");
    P.r(9, B - 50, 46, 1, "#3a3a42").p(52, B - 27, "#e84a3a");
    if (v % 3 === 1) crack(P, 38, B - 40, g, 7, "#9ab0c0");
    P.r(12, B - 24, 10, 2, "#2a2c30").r(12, B - 24, 10, 1, "#4a4d54").r(46, B - 22, 5, 2, "#1a1a1e").p(47, B - 22, "#c83a30");
  }, {
    color: "#5a4030"
  });
  const BOOKS = [ "#7a2a2a", "#2a3a5a", "#3a5a3a", "#8a6a2a", "#5a3a2a", "#d8cca8", "#4a2a4a", "#2a4a4a", "#a84a2a", "#6a6a60" ];
  function books(P, x0, x1, ys, maxH, g) {
    let x = x0;
    while (x < x1 - 1) {
      if (g.chance(.08)) {
        x += 3 + g.i(4);
        continue;
      }
      if (g.chance(.06) && x1 - x > 8) {
        const c = g.pick(BOOKS), R = RP(c);
        P.poly([ [ x, ys ], [ x + 3, ys ], [ x + 9, ys - maxH + 3 ], [ x + 6, ys - maxH + 2 ] ], R[3]);
        P.line(x + 1, ys - 1, x + 7, ys - maxH + 3, R[5]);
        x += 9;
        continue;
      }
      if (g.chance(.05) && x1 - x > 7) {
        for (let k = 0; k < 3; k++) {
          const c = g.pick(BOOKS), R = RP(c);
          P.r(x, ys - 2 - k * 2, 7 - k, 2, R[3]).r(x, ys - 2 - k * 2, 7 - k, 1, R[5]);
        }
        x += 7;
        continue;
      }
      const bw = Math.min(x1 - x, 2 + g.i(3)), bh = maxH - g.i(4), c = g.pick(BOOKS), R = RP(c);
      P.r(x, ys - bh, bw, bh, R[3]).r(x, ys - bh, 1, bh, R[4]).r(x, ys - bh, bw, 1, R[5]);
      if (bw > 2) P.r(x + bw - 1, ys - bh, 1, bh, R[2]);
      if (bh > 6) P.r(x, ys - bh + 2, bw, 1, g.chance(.5) ? "#c8a040" : R[1]);
      x += bw;
    }
  }
  def("bookshelf", 2, 1, 42, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .45);
    box(P, 3, B - 64, 58, 10, 54, col);
    P.r(6, B - 53, 52, 50, "#1c1612");
    vgrad(P, 6, B - 53, 52, 50, "#2a2018", "#16110d", 0, 1);
    for (let i = 0; i < 4; i++) {
      const ys = B - 42 + i * 12;
      P.r(6, ys - 11, 52, 2, "rgba(0,0,0,0.4)");
      books(P, 7, 57, ys, 10, g);
      P.r(4, ys, 56, 2, R[4]).r(4, ys, 56, 1, R[5]).r(4, ys + 2, 56, 1, R[1]);
    }
    P.r(3, B - 54, 3, 51, R[3]).r(3, B - 54, 1, 51, R[4]).r(58, B - 54, 3, 51, R[2]).r(60, B - 54, 1, 51, R[1]);
    P.r(3, B - 4, 58, 4, R[2]).r(3, B - 4, 58, 1, R[4]).r(3, B - 1, 58, 1, R[0]);
    grain(P, 4, B - 63, 56, 8, col, g, 10);
    box(P, 8, B - 70, 10, 4, 6, "#8a7a6a");
  }, {
    color: "#6a4a30"
  });
  def("displayCase", 2, 1, 24, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), vel = "#5a1e26", Rv = RP(vel), Br = RP("#b8a060");
    sbox(P, 1, B - 3, 62, 5, .42);
    P.r(4, 3, 56, 20, Rv[3]).r(4, 3, 56, 2, Rv[1]);
    P.r(4, 20, 56, 4, Rv[1]).r(4, 20, 56, 1, Rv[4]);
    P.r(4, 24, 56, 18, Rv[3]).r(4, 24, 56, 1, Rv[1]);
    P.noise(4, 5, 56, 36, [ Rv[2], Rv[4] ], .08, g);
    for (const sx of [ 18, 46 ]) {
      P.oval(sx, 20, 6, 1, "rgba(0,0,0,0.25)");
      P.oval(sx, 39, 6, 1, "rgba(0,0,0,0.25)");
    }
    P.line(5, 22, 12, 4, "rgba(220,240,255,0.3)").line(7, 22, 14, 4, "rgba(220,240,255,0.15)").line(52, 41, 58, 27, "rgba(220,240,255,0.25)");
    P.r(2, 1, 60, 2, Br[4]).r(2, 1, 60, 1, Br[5]).r(2, 1, 2, 41, Br[4]).r(60, 1, 2, 41, Br[2]).r(2, 22, 60, 2, Br[3]).r(2, 22, 60, 1, Br[5]).r(2, 41, 60, 1, Br[1]);
    P.r(31, 2, 1, 20, "rgba(200,180,120,0.5)");
    box(P, 2, B - 12, 60, 0, 12, col);
    grain(P, 3, B - 11, 58, 10, col, g, 12);
    P.r(4, B - 10, 27, 8, R[3]).r(33, B - 10, 27, 8, R[3]).r(4, B - 10, 27, 1, R[4]).r(33, B - 10, 27, 1, R[4]).r(30, B - 10, 1, 8, R[1]).r(59, B - 10, 1, 8, R[1]);
    P.r(29, B - 7, 2, 3, "#c8a040").r(33, B - 7, 2, 3, "#c8a040").r(31, B - 6, 2, 2, "#3a2a10");
  }, {
    color: "#4a3426",
    slots: [ [ 10, 5 ], [ 38, 5 ], [ 10, 24 ], [ 38, 24 ] ]
  });
  def("displayShelf", 2, 1, 40, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .45);
    box(P, 2, 2, 60, 8, 60, col);
    for (const [y0, y1] of [ [ 13, 36 ], [ 39, 60 ] ]) {
      P.r(5, y0, 54, y1 - y0, "#241c16");
      vgrad(P, 5, y0, 54, y1 - y0, "#3a2e22", "#1e1712", 0, 1);
      P.r(5, y0, 54, 1, "#f8e0a0").r(5, y0 + 1, 54, 1, "rgba(255,220,150,0.45)").r(5, y0 + 2, 54, 3, "rgba(255,220,150,0.12)");
      P.oval(32, y1 - 1, 24, 2, "rgba(255,220,150,0.1)");
    }
    for (const ys of [ 36, 60 ]) {
      P.r(3, ys, 58, 3, R[4]).r(3, ys, 58, 1, R[5]).r(3, ys + 3, 58, 1, R[1]);
    }
    P.r(2, 10, 3, 60, R[3]).r(2, 10, 1, 60, R[4]).r(59, 10, 3, 60, R[2]).r(61, 10, 1, 60, R[1]).r(3, 10, 58, 3, R[3]).r(3, 12, 58, 1, R[1]);
    P.r(2, 64, 60, 6, R[2]).r(2, 64, 60, 1, R[4]).r(2, 69, 60, 1, R[0]);
    grain(P, 3, 3, 58, 6, col, g, 8);
  }, {
    color: "#7a5a3a",
    slots: [ [ 7, 20 ], [ 24, 20 ], [ 41, 20 ], [ 7, 44 ], [ 24, 44 ], [ 41, 44 ] ]
  });
  def("gunRack", 2, 1, 30, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), M = RP("#5a5e64"), felt = "#6a1e22";
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 3, B - 58, 58, 4, 52, col);
    grain(P, 4, B - 53, 56, 48, col, g, 40);
    for (const x of [ 23, 41 ]) P.r(x, B - 52, 1, 44, R[2]).r(x + 1, B - 52, 1, 44, R[4]);
    P.r(4, B - 48, 56, 5, M[3]).r(4, B - 48, 56, 1, M[5]).r(4, B - 44, 56, 1, M[1]);
    for (const x of [ 14, 32, 50 ]) {
      P.r(x - 3, B - 48, 7, 3, felt).r(x - 3, B - 48, 7, 1, "#8a2e32");
      rivet(P, x - 7, B - 47, M);
      rivet(P, x + 6, B - 47, M);
    }
    P.r(3, B - 10, 58, 3, M[4]).r(3, B - 10, 58, 1, M[5]);
    P.r(3, B - 7, 58, 4, M[2]).r(3, B - 4, 58, 1, M[0]);
    for (const x of [ 14, 32, 50 ]) P.r(x - 5, B - 10, 11, 2, felt).r(x - 5, B - 10, 11, 1, "#8a2e32");
    P.r(4, B - 3, 4, 3, M[1]).r(56, B - 3, 4, 3, M[1]);
    P.r(25, B - 57, 14, 7, "#c8a040").r(25, B - 57, 14, 1, "#f0d070");
    mini(P, 25, B - 56, "GUN", "#3a2a10", 14);
  }, {
    color: "#8a6a48",
    racks: [ [ 14, 34 ], [ 32, 34 ], [ 50, 34 ] ]
  });
  def("pedestal", 1, 1, 24, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    P.shadow(16, B - 2, 12, 3, .45);
    box(P, 4, B - 11, 24, 5, 6, col);
    cut(P, 4, B - 11, 27, B - 11);
    for (let i = 0; i < 16; i++) {
      const t = (i + .5) / 16;
      P.r(8 + i, B - 32, 1, 21, t < .2 ? R[4] : t < .55 ? R[3] : t < .8 ? R[2] : R[1]);
    }
    for (const x of [ 11, 15, 19 ]) P.r(x, B - 31, 1, 19, rgba(R[1], .6));
    for (let k = 0; k < 3; k++) {
      let x = 9 + g.i(12), y = B - 30 + g.i(10);
      for (let s = 0; s < 8; s++) {
        P.p(x, y, R[4]);
        x += g.chance(.5) ? 1 : 0;
        y++;
      }
    }
    P.r(7, B - 34, 18, 2, R[3]).r(7, B - 34, 18, 1, R[4]);
    box(P, 4, B - 46, 24, 10, 4, col);
    cut(P, 4, B - 46, 27, B - 46);
    P.r(8, B - 44, 16, 6, "#6a1e26").r(8, B - 44, 16, 1, "#8a2e36").r(8, B - 39, 16, 1, "#4a1018");
    P.r(11, B - 9, 10, 2, "#c8a040").r(11, B - 9, 10, 1, "#f0d070");
  }, {
    color: "#c8c2b4",
    slots: [ [ 8, 2 ] ]
  });
  def("safe", 1, 1, 14, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), M = RP("#9aa0a6");
    sbox(P, 1, B - 3, 30, 5, .48);
    box(P, 3, B - 42, 26, 12, 30, col);
    cut(P, 3, B - 42, 28, B - 42);
    P.r(3, B - 4, 3, 4, R[0]).r(26, B - 4, 3, 4, R[0]);
    P.r(5, B - 28, 22, 23, R[2]).r(6, B - 27, 20, 21, R[3]).r(6, B - 27, 20, 1, R[4]).r(6, B - 27, 1, 21, R[4]).r(25, B - 27, 1, 21, R[1]).r(6, B - 7, 20, 1, R[1]);
    P.r(7, B - 26, 18, 1, "#b8983a").r(7, B - 8, 18, 1, "#8a7028").r(7, B - 26, 1, 19, "#b8983a").r(24, B - 26, 1, 19, "#8a7028");
    for (const y of [ B - 24, B - 12 ]) P.r(3, y, 3, 5, M[3]).r(3, y, 3, 1, M[5]).r(3, y + 4, 3, 1, M[1]);
    P.oval(16, B - 19, 5, 5, M[1]).oval(16, B - 19, 4, 4, M[3]).oval(15, B - 20, 2, 2, M[4]).p(16, B - 19, M[0]);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      P.p(16 + Math.round(Math.cos(a) * 5), B - 19 + Math.round(Math.sin(a) * 5), k % 3 ? M[2] : M[5]);
    }
    P.r(16, B - 25, 1, 2, "#e84a3a");
    P.r(13, B - 12, 7, 1, M[4]).r(16, B - 14, 1, 5, M[4]).p(13, B - 12, M[5]);
    P.r(8, B - 39, 17, 7, "#c8a040").r(8, B - 39, 17, 1, "#f0d070");
    mini(P, 8, B - 38, "SAFE", "#3a2a10", 17);
    scratch(P, 5, B - 28, 22, 22, g, 5, R[5]);
  }, {
    color: "#3e4a44"
  });
  def("workbench", 2, 1, 30, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), Pb = RP("#8a7454"), M = RP("#6a6e74");
    sbox(P, 1, B - 3, 62, 5, .45);
    P.r(3, 2, 58, 26, Pb[3]).r(3, 2, 58, 1, Pb[5]).r(3, 2, 1, 26, Pb[4]).r(60, 2, 1, 26, Pb[1]);
    for (let y = 5; y < 27; y += 3) for (let x = 6; x < 59; x += 3) P.p(x, y, Pb[1]);
    P.r(8, 6, 2, 12, "#6a4a2a").r(6, 5, 6, 3, M[3]).r(6, 5, 6, 1, M[5]);
    P.r(15, 5, 3, 3, M[3]).r(16, 8, 1, 12, M[3]).r(15, 19, 3, 3, M[3]).p(16, 20, Pb[3]);
    P.poly([ [ 22, 6 ], [ 34, 6 ], [ 34, 14 ], [ 22, 10 ] ], "#b8bcc0");
    P.r(34, 5, 5, 10, "#8a3a2a").r(34, 5, 1, 10, "#b85a4a");
    for (let x = 23; x < 34; x += 2) P.p(x, 10 + (x - 22 >> 2), "#6a6e74");
    for (let k = 0; k < 3; k++) {
      const x = 43 + k * 4, c = [ "#c83a30", "#e8b030", "#3a70c0" ][k];
      P.r(x, 5, 2, 6, c).r(x, 5, 1, 6, sh(c, .3)).r(x, 11, 1, 7, "#b8bcc0");
    }
    P.r(55, 6, 1, 8, "#c83a30").r(57, 6, 1, 8, "#c83a30").line(55, 14, 56, 18, M[4]).line(57, 14, 56, 18, M[4]);
    P.r(3, 28, 58, 2, "rgba(0,0,0,0.35)");
    box(P, 2, B - 32, 60, 16, 5, col);
    grain(P, 3, B - 31, 58, 14, col, g, 30);
    for (let k = 0; k < 6; k++) P.p(6 + g.i(50), B - 30 + g.i(12), g.pick([ "#b8bcc0", "#8a9098", "#c8a040" ]));
    P.r(8, B - 28, 16, 4, "#b8a070").r(8, B - 28, 16, 1, "#d8c090");
    box(P, 28, B - 29, 10, 4, 5, "#c8a030");
    P.r(30, B - 24, 3, 4, "#2a2c30");
    for (const x of [ 4, 56 ]) post(P, x, B - 11, 4, 11, "#4a4e54");
    P.r(8, B - 6, 48, 2, R[3]).r(8, B - 6, 48, 1, R[4]);
    box(P, 12, B - 14, 16, 3, 5, "#b8342e");
    P.r(18, B - 15, 4, 1, "#2a2c30");
    P.r(40, B - 12, 8, 6, "#7a8288").r(40, B - 12, 8, 1, "#aab2b8").r(40, B - 12, 1, 6, "#9aa2a8");
    box(P, 46, B - 22, 12, 4, 7, "#4a5a6a");
    P.r(44, B - 20, 3, 5, "#4a5a6a").r(58, B - 18, 3, 2, "#9aa0a6").r(60, B - 20, 1, 6, "#c8ccd0");
    P.r(47, B - 22, 1, 4, "#1a1c20");
  }, {
    color: "#8a6a44"
  });
  const TANK = A.TANK = {};
  TANK.fishTank = {
    fish: [ [ "#f08030", 14, 7 ], [ "#f0d040", 30, 12 ], [ "#4ac0e8", 22, 16 ], [ "#e84a4a", 50, 6 ] ],
    wet: B => {
      const fy = B - 40;
      return {
        fy,
        x0: 4,
        x1: 59,
        y0: fy + 2,
        y1: B - 21,
        yb: B - 18,
        bx: 56
      };
    },
    glare: (P, fy) => P.line(6, fy + 20, 14, fy + 2, "rgba(255,255,255,0.3)").line(8, fy + 20, 16, fy + 2, "rgba(255,255,255,0.15)")
  };
  def("fishTank", 2, 1, 28, (P, w, h, up, g, v, col) => {
    const B = h - 2, W = RP(col), S = RP("#3a3430");
    sbox(P, 1, B - 3, 62, 5, .45);
    box(P, 3, B - 16, 58, 0, 16, "#3a3430");
    for (const x of [ 4, 32 ]) P.r(x, B - 14, 27, 11, S[3]).r(x, B - 14, 27, 1, S[4]).r(x + 26, B - 14, 1, 11, S[1]).r(x + (x === 4 ? 24 : 2), B - 10, 1, 3, "#c8a040");
    P.r(4, B - 52, 56, 12, W[4]);
    for (let k = 0; k < 6; k++) P.r(6 + g.i(46), B - 50 + g.i(8), 6, 1, W[5]);
    P.r(3, B - 53, 58, 5, "#1a1a1c").r(3, B - 53, 58, 1, "#3a3a3e").r(8, B - 49, 48, 1, "#f0f8ff").r(8, B - 48, 48, 1, rgba(W[5], .6));
    const fy = B - 40;
    vgrad(P, 4, fy, 56, 24, W[4], W[2], 0, 1);
    P.r(4, fy, 56, 1, W[5]);
    for (let x = 4; x < 60; x++) {
      const hh = 2 + x * 7 % 3;
      P.r(x, B - 16 - hh, 1, hh, g.pick([ "#c8b890", "#8a7a5a", "#a89878", "#e0d0a8", "#6a6a6a" ]));
    }
    for (let k = 0; k < 5; k++) {
      let x = 8 + k * 11 + g.i(4), y = B - 18;
      for (let s = 0; s < 10 + g.i(8); s++) {
        P.p(x, y, s % 3 ? "#3a8a3a" : "#5aaa4a");
        y--;
        x += s >> 2 & 1 ? 1 : -1;
        if (y < fy + 3) break;
      }
    }
    P.poly([ [ 40, B - 17 ], [ 42, B - 26 ], [ 46, B - 26 ], [ 48, B - 17 ] ], "#6a6a70");
    P.r(43, B - 23, 2, 3, "#1a1a1e").r(41, B - 28, 2, 2, "#6a6a70").r(46, B - 28, 2, 2, "#6a6a70");
    if (!A.tankBare) {
      for (const [c, x, y0] of TANK.fishTank.fish) {
        const y = fy + y0;
        P.r(x, y, 4, 2, c).p(x + 1, y - 1, c).p(x + 3, y, "#1a1a1a").r(x - 2, y - 1, 2, 1, sh(c, -.2)).r(x - 2, y + 2, 2, 1, sh(c, -.2)).p(x - 1, y, sh(c, -.2)).p(x + 1, y, sh(c, .4));
      }
      for (let y = fy + 2; y < B - 20; y += 3) P.p(56 + (y & 1), y, "#e8f8ff");
    }
    P.r(3, fy, 1, 24, "#1a1a1c").r(60, fy, 1, 24, "#1a1a1c").r(3, B - 17, 58, 1, "#1a1a1c");
    TANK.fishTank.glare(P, fy);
  }, {
    color: "#3aa0b0"
  });
  def("treadmill", 2, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3d42"), K = RP("#1e2024");
    sbox(P, 3, B - 8, 58, 8, .4);
    P.r(4, B - 12, 56, 10, K[2]).r(4, B - 12, 56, 1, K[4]).r(4, B - 3, 56, 1, K[0]);
    for (let x = 8; x < 56; x += 6) P.r(x, B - 10, 3, 6, K[3]);
    P.r(2, B - 14, 6, 13, M[2]).r(56, B - 14, 6, 13, M[2]).r(2, B - 14, 6, 1, M[4]).r(56, B - 14, 6, 1, M[4]);
    post(P, 6, 6, 3, B - 18, "#3a3d42");
    post(P, 55, 6, 3, B - 18, "#3a3d42");
    P.r(6, 6, 52, 4, M[3]).r(6, 6, 52, 1, M[5]).r(6, 9, 52, 1, M[1]);
    P.r(24, 2, 16, 8, "#1c1d21").r(26, 4, 12, 4, "#4ac0ff").r(27, 5, 5, 2, "#0a2a3a");
  });
  def("barbell", 3, 2, 26, (P, w, h, up, g, v) => {
    const B = h - 2, W = RP("#7a5234"), M = RP("#3a3d42"), K = RP("#1e2024");
    sbox(P, 20, B - 6, 56, 6, .4);
    P.r(24, B - 14, 48, 9, W[3]).r(24, B - 14, 48, 1, W[5]).r(24, B - 6, 48, 1, W[1]);
    post(P, 27, B - 6, 3, 5, "#3a3d42");
    post(P, 66, B - 6, 3, 5, "#3a3d42");
    post(P, 10, 4, 4, B - 8, "#3a3d42");
    post(P, 82, 4, 4, B - 8, "#3a3d42");
    P.r(6, 8, 84, 3, M[4]).r(6, 8, 84, 1, M[5]).r(6, 10, 84, 1, M[2]);
    for (const x of [ 8, 14, 78, 84 ]) P.r(x, 1, 5, 17, K[3]).r(x, 1, 5, 1, K[4]).r(x, 17, 5, 1, K[1]);
  });
  def("dumbbellRack", 2, 1, 2, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3d42"), K = RP("#1e2024"), C2 = [ "#b0303a", "#2a6ab0", "#c8a030", "#3a8a4a", "#8a8e96", "#1e2024" ];
    sbox(P, 3, B - 8, 58, 8, .4);
    post(P, 4, B - 20, 3, 20, "#3a3d42");
    post(P, 57, B - 20, 3, 20, "#3a3d42");
    [ [ B - 24, 4 ], [ B - 13, 5 ] ].forEach(([y, s], row) => {
      P.r(4, y + s + 1, 56, 3, M[3]).r(4, y + s + 1, 56, 1, M[5]).r(4, y + s + 3, 56, 1, M[1]);
      for (let k = 0, x = 9; x < 52; x += 8, k++) {
        const Rc = RP(C2[(k + row * 2) % C2.length]);
        P.r(x, y, 3, s + 1, Rc[2]).r(x + 5, y, 3, s + 1, Rc[2]).r(x, y, 3, 1, Rc[4]).r(x + 5, y, 3, 1, Rc[4]).r(x + 3, y, 2, s + 1, M[2]).r(x + 3, y + (s >> 1), 2, 1, M[5]);
      }
    });
  });
  def("exBike", 2, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3d42"), R = RP("#b0303a"), K = RP("#1e2024"), X = 26;
    sbox(P, X - 13, B - 3, 38, 3, .4);
    P.r(X - 11, B - 2, 13, 2, K[3]).r(X - 11, B - 2, 13, 1, K[5]).r(X + 8, B - 2, 15, 2, K[3]).r(X + 8, B - 2, 15, 1, K[5]);
    P.oval(X + 14, B - 8, 6, 6, K[1]).oval(X + 14, B - 8, 5, 5, K[3]).oval(X + 14, B - 8, 3, 3, M[2]).oval(X + 14, B - 8, 1, 1, M[5]);
    P.thick(X - 3, B - 2, X - 1, B - 14, 3, R[2]);
    P.line(X - 4, B - 2, X - 2, B - 14, R[4]);
    P.thick(X - 2, B - 7, X + 14, B - 4, 2, R[2]);
    P.line(X - 2, B - 8, X + 14, B - 5, R[4]);
    P.thick(X + 17, B - 2, X + 14, B - 22, 3, R[2]);
    P.line(X + 16, B - 2, X + 13, B - 22, R[4]);
    P.r(X - 4, B - 16, 8, 2, K[3]).r(X - 4, B - 16, 8, 1, K[5]);
    P.r(X + 8, B - 24, 8, 2, K[3]).r(X + 8, B - 24, 8, 1, K[5]).r(X + 8, B - 24, 2, 4, K[3]);
    P.r(X + 12, B - 30, 8, 5, "#1c1d21").r(X + 13, B - 29, 6, 3, "#4ac0ff").r(X + 14, B - 28, 3, 1, "#0a2a3a");
    P.oval(X + 5, B - 7, 2, 2, M[3]).p(X + 5, B - 7, M[5]);
    P.line(X + 6, B - 8, X + 13, B - 10, M[1]);
  });
  let gymBarC = null;
  A.gymBar = function() {
    if (gymBarC) return gymBarC;
    const c = A.mk(64, 14), x = c.getContext("2d"), r = (px, py, w2, h2, col) => {
      x.fillStyle = col;
      x.fillRect(px, py, w2, h2);
    }, M = RP("#8a8e94"), K = RP("#1e2024");
    r(0, 6, 64, 3, M[3]);
    r(0, 6, 64, 1, M[5]);
    r(0, 8, 64, 1, M[1]);
    for (const px of [ 11, 51 ]) {
      r(px, 4, 2, 7, M[2]);
      r(px, 4, 2, 1, M[4]);
    }
    for (const px of [ 2, 7, 53, 58 ]) {
      r(px, 1, 4, 12, K[3]);
      r(px, 1, 4, 1, K[4]);
      r(px, 12, 4, 1, K[1]);
      r(px, 1, 1, 12, K[4]);
      r(px + 3, 1, 1, 12, K[2]);
    }
    gymBarC = {
      c,
      cx: 32,
      cy: 7
    };
    return gymBarC;
  };
  const squatRackOver = (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3d42");
    post(P, 11, B - 48, 4, 48, "#3a3d42");
    post(P, 49, B - 48, 4, 48, "#3a3d42");
    P.r(11, B - 48, 42, 3, M[3]).r(11, B - 48, 42, 1, M[5]).r(11, B - 46, 42, 1, M[1]);
    for (let y = B - 42; y < B - 4; y += 5) {
      P.p(12, y, M[5]);
      P.p(50, y, M[5]);
    }
    for (const x of [ 15, 46 ]) {
      P.r(x, B - 25, 3, 5, M[2]).r(x, B - 25, 3, 1, M[4]).r(x, B - 21, 3, 1, M[0]);
    }
    if (v !== 1) {
      const b = A.gymBar();
      P.x.drawImage(b.c, 0, B - 22 - b.cy);
    }
  };
  def("squatRack", 2, 2, 16, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#3a3d42"), Wd = RP("#6a4a30");
    sbox(P, 2, B - 28, 60, 28, .3);
    P.r(4, B - 28, 56, 26, Wd[2]).r(4, B - 28, 56, 1, Wd[4]).r(4, B - 3, 56, 1, Wd[0]);
    for (let x = 11; x < 56; x += 9) P.r(x, B - 27, 1, 24, Wd[1]);
    grime(P, 6, B - 24, 52, 18, g, 6, "rgba(40,30,18,0.14)");
    post(P, 13, B - 76, 3, 48, "#4a4d52");
    post(P, 48, B - 76, 3, 48, "#4a4d52");
    P.r(13, B - 76, 38, 3, M[3]).r(13, B - 76, 38, 1, M[5]);
    for (let y = B - 70; y < B - 32; y += 5) {
      P.p(14, y, M[5]);
      P.p(49, y, M[5]);
    }
    for (const x of [ 16, 45 ]) P.r(x, B - 30, 3, 2, M[2]);
  }, {
    over: squatRackOver
  });
  def("kettleRow", 2, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, K = RP("#26282c"), Wd = RP("#5a4030");
    sbox(P, 3, B - 6, 58, 6, .35);
    P.r(3, B - 8, 58, 6, Wd[2]).r(3, B - 8, 58, 1, Wd[4]).r(3, B - 3, 58, 1, Wd[0]);
    [ 5, 6, 7, 8 ].forEach((s, i) => {
      const cx = 10 + i * 14, cy = B - 8 - s;
      P.oval(cx, cy, s, s, K[2]).oval(cx - 1, cy - 1, s - 2, s - 3, K[3]).p(cx - s + 2, cy - 2, K[5]);
      P.r(cx - 3, cy - s - 5, 6, 2, K[3]).r(cx - 4, cy - s - 3, 2, 3, K[3]).r(cx + 2, cy - s - 3, 2, 3, K[3]);
    });
  });
  def("plateTree", 1, 1, 2, (P, w, h, up, g, v) => {
    const B = h - 2, K = RP("#1e2024"), M = RP("#3a3d42");
    P.shadow(16, B - 3, 12, 3, .4);
    P.r(4, B - 5, 24, 4, M[2]).r(4, B - 5, 24, 1, M[4]);
    post(P, 14, B - 29, 4, 24, "#3a3d42");
    [ [ B - 28, 9 ], [ B - 19, 8 ], [ B - 11, 7 ] ].forEach(([y, s]) => {
      P.r(7, y, 6, s, K[3]).r(7, y, 6, 1, K[4]).r(7, y + s - 1, 6, 1, K[1]);
      P.r(19, y, 6, s, K[3]).r(19, y, 6, 1, K[4]).r(19, y + s - 1, 6, 1, K[1]);
    });
  });
  def("waterCooler", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, Wt = RP("#c8ccd0"), Bl = RP("#4a90c8");
    P.shadow(16, B - 3, 11, 3, .4);
    P.r(7, 26, 18, B - 27, Wt[2]).r(7, 26, 18, 1, Wt[4]).r(7, 26, 1, B - 27, Wt[3]).r(24, 26, 1, B - 27, Wt[1]).r(7, B - 2, 18, 1, Wt[0]);
    P.r(11, 32, 3, 3, "#d04040").r(18, 32, 3, 3, "#4080d0").r(10, 40, 12, 7, "#2a2c30").r(11, 46, 10, 1, "#4a4c50");
    P.r(9, 5, 14, 21, Bl[2]).r(9, 5, 14, 1, Bl[4]).r(10, 6, 2, 18, Bl[4]).r(13, 2, 6, 4, Bl[1]).r(9, 14, 14, 1, Bl[3]);
  });
  def("gymMirror", 2, 1, 20, (P, w, h, up, g, v) => {
    const B = h - 2;
    sbox(P, 4, B - 6, 56, 6, .3);
    P.r(4, 4, 56, B - 6, "#2a2c30");
    vgrad(P, 6, 6, 52, B - 10, "#a8c4d2", "#607e8e", .2, .9);
    P.line(12, B - 8, 26, 8, "rgba(255,255,255,0.35)").line(16, B - 8, 30, 8, "rgba(255,255,255,0.18)").line(40, B - 8, 52, 16, "rgba(255,255,255,0.2)");
  });
  def("ropeMat", 2, 2, 0, (P, w, h, up, g, v) => {
    const R = RP("#3a5a6a");
    P.r(2, 2, w - 4, h - 4, R[2]).r(2, 2, w - 4, 1, R[4]).r(2, h - 3, w - 4, 1, R[0]).r(2, 2, 1, h - 4, R[3]);
    for (let y = 6; y < h - 6; y += 6) P.r(6, y, w - 12, 1, R[1]);
    P.line(10, h - 10, 22, h - 22, "#c8b070").line(22, h - 22, 40, h - 12, "#c8b070");
  });
  def("punchBag", 1, 1, 30, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), M = RP("#3a3d42");
    P.shadow(20, B - 2, 10, 2, .35);
    P.r(1, B - 5, 12, 4, M[2]).r(1, B - 5, 12, 1, M[4]).r(1, B - 2, 12, 1, M[0]);
    P.oval(7, B - 7, 3, 2, "#1c1c1e").oval(7, B - 8, 3, 1, "#4a4a4e");
    post(P, 3, B - 58, 3, 53, "#3a3d42");
    P.r(3, B - 58, 22, 3, M[3]).r(3, B - 58, 22, 1, M[5]).r(3, B - 56, 22, 1, M[1]);
    P.thick(5, B - 46, 14, B - 55, 2, M[2]);
    for (let y = B - 55; y < B - 47; y += 2) P.p(20, y, "#9aa0a6").p(21, y + 1, "#6a6e74");
    P.line(20, B - 47, 14, B - 44, "#8a9098").line(21, B - 47, 27, B - 44, "#8a9098");
    for (let i = 0; i < 17; i++) {
      const t = (i + .5) / 17;
      P.r(12 + i, B - 42, 1, 40, t < .15 ? R[3] : t < .4 ? R[5] : t < .6 ? R[4] : t < .82 ? R[3] : R[2]);
    }
    P.oval(20, B - 42, 8, 1, R[4]).oval(20, B - 3, 8, 1, R[1]);
    for (const y of [ B - 39, B - 8 ]) {
      P.r(12, y, 17, 2, "#2a2a2c").r(12, y, 17, 1, "#4a4a4e");
    }
    P.r(20, B - 36, 1, 26, R[2]);
    for (let y = B - 35; y < B - 11; y += 3) P.p(21, y, R[1]);
    grime(P, 13, B - 36, 15, 26, g, 7, "rgba(0,0,0,0.12)");
    scratch(P, 13, B - 37, 14, 27, g, 5, R[5]);
  }, {
    color: "#9a2a24"
  });
  def("neon", 2, 1, 22, (P, w, h, up, g, v, col) => {
    const B = h - 2, bd = "#16161a", core = mix(col, "#ffffff", .65), halo = mix(col, bd, .62), halo2 = mix(col, bd, .82);
    for (const x of [ 12, 50 ]) {
      post(P, x, 38, 2, B - 40, "#4a4d52");
      P.r(x - 2, B - 2, 6, 2, "#2a2c30");
    }
    P.r(2, 4, 60, 35, "#2a2a30").r(3, 5, 58, 33, bd).r(2, 4, 60, 1, "#4a4a52").r(2, 38, 60, 1, "#0a0a0c");
    for (let k = 0; k < 20; k++) P.p(4 + g.i(56), 6 + g.i(30), "#1e1e24");
    const draw = fn => {
      for (const [dx, dy, c] of [ [ -2, 0, halo2 ], [ 2, 0, halo2 ], [ 0, -2, halo2 ], [ 0, 2, halo2 ], [ -1, -1, halo ], [ 1, 1, halo ], [ -1, 1, halo ], [ 1, -1, halo ], [ -1, 0, halo ], [ 1, 0, halo ], [ 0, -1, halo ], [ 0, 1, halo ] ]) fn(dx, dy, c);
      fn(0, 0, col);
    };
    const NT = [ "호프", "노래방", "PC방", "24시", "당구장", "치킨" ][v % 6];
    draw((dx, dy, c) => label(P, 6 + dx, 13 + dy, NT, c, 11, 42));
    draw((dx, dy, c) => {
      P.ring(52 + dx, 16 + dy, 3, 3, c).ring(56 + dx, 16 + dy, 3, 3, c).line(49 + dx, 17 + dy, 54 + dx, 24 + dy, c).line(59 + dx, 17 + dy, 54 + dx, 24 + dy, c);
    });
    draw((dx, dy, c) => P.r(8 + dx, 31 + dy, 40, 1, c));
    label(P, 6, 13, NT, core, 11, 42);
    P.r(9, 31, 38, 1, core);
    P.p(52, 14, core).p(56, 14, core);
    P.r(30, 1, 1, 3, "#3a3a3e").r(34, 1, 1, 3, "#3a3a3e");
  }, {
    color: "#ff4fa0"
  });
  def("poster", 1, 1, 26, (P, w, h, up, g, v, col) => {
    const B = h - 2, wood = col, Rw = RP(wood);
    P.shadow(16, B - 2, 11, 3, .4);
    P.thick(12, 42, 7, B - 2, 2, Rw[1]);
    P.thick(20, 42, 25, B - 2, 2, Rw[2]);
    P.r(5, B - 3, 6, 3, Rw[1]).r(5, B - 3, 6, 1, Rw[3]);
    P.r(21, B - 3, 6, 3, Rw[0]).r(21, B - 3, 6, 1, Rw[2]);
    P.r(4, 2, 24, 42, Rw[3]);
    P.r(4, 2, 24, 2, Rw[5]);
    P.r(4, 42, 24, 2, Rw[1]);
    P.r(4, 2, 2, 42, Rw[4]);
    P.r(26, 2, 2, 42, Rw[1]);
    grain(P, 5, 3, 22, 40, wood, g, 10);
    P.r(6, 4, 20, 38, "#8fa6b4");
    vgrad(P, 6, 4, 20, 38, "#cfe2ec", "#4f6472", 0, 1);
    P.r(6, 4, 20, 2, "#e8f4fa");
    if (v % 3 === 0) {
      P.r(7, 24, 9, 17, "rgba(40,44,52,0.3)");
      P.r(17, 28, 8, 13, "rgba(40,44,52,0.22)");
    } else if (v % 3 === 1) {
      P.ball(16, 20, 4, 5, "rgba(200,170,140,0.35)");
      P.r(12, 26, 9, 15, "rgba(60,64,74,0.3)");
    } else {
      P.r(8, 8, 7, 6, "rgba(255,250,220,0.25)");
      P.r(7, 30, 18, 11, "rgba(40,44,52,0.25)");
    }
    P.line(8, 38, 22, 7, "rgba(255,255,255,0.45)").line(12, 40, 25, 11, "rgba(255,255,255,0.2)");
    if (v % 4 === 3) crack(P, 20, 18, g, 6, "rgba(230,240,250,0.7)");
    grime(P, 7, 30, 18, 11, g, 4, "rgba(80,90,100,0.16)");
  }, {
    color: "#6a4a30"
  });
  def("armchair", 1, 1, 14, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    P.shadow(16, B - 2, 14, 3, .42);
    P.r(6, B - 40, 20, 20, R[3]).r(7, B - 41, 18, 1, R[4]).r(6, B - 40, 1, 20, R[4]).r(25, B - 40, 1, 20, R[1]).r(7, B - 40, 18, 2, R[5]);
    for (const [x, y] of [ [ 11, B - 34 ], [ 16, B - 34 ], [ 21, B - 34 ], [ 13, B - 28 ], [ 19, B - 28 ] ]) P.p(x, y, R[1]).p(x, y + 1, R[5]);
    P.r(7, B - 22, 18, 2, "rgba(0,0,0,0.35)");
    P.r(8, B - 22, 16, 8, R[4]).r(8, B - 22, 16, 1, R[5]).r(8, B - 22, 1, 8, R[5]);
    box(P, 8, B - 14, 16, 0, 5, col, {
      fi: 3
    });
    for (const [x, dark] of [ [ 2, false ], [ 24, true ] ]) {
      P.r(x, B - 27, 6, 5, R[dark ? 3 : 4]).r(x + 1, B - 28, 4, 1, R[5]).r(x, B - 22, 6, 17, R[dark ? 1 : 2]).r(x, B - 22, 6, 1, R[dark ? 2 : 3]).r(dark ? x + 5 : x, B - 22, 1, 17, R[dark ? 0 : 3]);
    }
    P.r(8, B - 9, 16, 4, R[1]);
    for (const x of [ 4, 26 ]) P.r(x, B - 5, 2, 4, "#3a2a1e").p(x, B - 5, "#6a5040");
    if (v % 2) {
      P.r(13, B - 30, 9, 7, "#d8c890").r(13, B - 30, 9, 1, "#f0e0a8").r(21, B - 30, 1, 7, "#a89860");
    }
    grime(P, 8, B - 22, 16, 8, g, 3);
  }, {
    color: "#7a4a3a"
  });
  def("coffeeTable", 2, 1, 2, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 3, B - 6, 58, 7, .4);
    for (const x of [ 6, 54 ]) post(P, x, B - 8, 4, 8, col);
    P.r(10, B - 5, 44, 2, R[2]).r(10, B - 5, 44, 1, R[3]);
    P.r(22, B - 7, 12, 2, "#c83a34").r(24, B - 8, 12, 2, "#3a5a8a");
    box(P, 4, B - 28, 56, 18, 4, col);
    grain(P, 5, B - 27, 54, 16, col, g, 18);
    cut(P, 4, B - 28, 59, B - 28);
    P.r(10, B - 24, 12, 9, "#d8d4c4").r(10, B - 24, 12, 1, "#f0ece0").r(12, B - 22, 8, 4, "#8a5a4a");
    txt(P, 11, B - 17, 9, "#6a6458", g);
    P.r(30, B - 22, 5, 5, "#e8e4d8").r(30, B - 22, 5, 1, "#4a2e1a").r(35, B - 21, 1, 3, "#c8c4b8").p(31, B - 24, "rgba(255,255,255,0.4)").p(32, B - 26, "rgba(255,255,255,0.3)");
    P.r(42, B - 20, 8, 3, "#2a2c30").r(42, B - 20, 8, 1, "#4a4d54").p(44, B - 19, "#c83a30");
  }, {
    color: "#6a4a30"
  });
  def("doubleBed", 2, 2, 18, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), wood = "#5a3e2a", Rw = RP(wood);
    sbox(P, 1, B - 5, 62, 7, .45);
    box(P, 2, 2, 60, 3, 18, wood);
    grain(P, 3, 5, 58, 16, wood, g, 12);
    for (const x of [ 6, 34 ]) P.r(x, 8, 24, 10, Rw[2]).r(x, 8, 24, 1, Rw[1]).r(x, 17, 24, 1, Rw[4]);
    const ty = 20, by = B - 16;
    P.r(3, ty, 58, by - ty, "#e0ddd4").r(3, ty, 58, 2, "#b8b4a8");
    for (const x of [ 7, 34 ]) {
      P.r(x, ty + 3, 23, 11, "#ecebe4").r(x + 1, ty + 2, 21, 1, "#f8f8f2").r(x, ty + 13, 23, 1, "#b8b8ae").r(x + 22, ty + 3, 1, 10, "#c8c8c0").r(x + 6, ty + 7, 9, 1, "#d8d8ce");
    }
    const fy = ty + 17;
    P.r(3, fy, 58, by - fy, R[3]).r(3, fy, 58, 4, "#ecebe4").r(3, fy + 4, 58, 3, R[5]).r(3, fy + 7, 58, 1, R[2]).r(3, fy, 1, by - fy, R[4]).r(60, fy, 1, by - fy, R[1]);
    for (let k = 0; k < 5; k++) {
      const y = fy + 11 + k * 5 + g.i(2), x = 6 + g.i(20);
      P.line(x, y, x + 14 + g.i(14), y + 1, R[2]).line(x + 1, y - 1, x + 12 + g.i(12), y, R[4]);
    }
    box(P, 2, by, 60, 0, 10, col, {
      fi: 3
    });
    for (let x = 8; x < 58; x += 9) P.r(x, by + 1, 1, 8, R[2]);
    P.r(2, B - 6, 60, 4, Rw[2]).r(2, B - 6, 60, 1, Rw[4]).r(4, B - 2, 3, 2, Rw[0]).r(57, B - 2, 3, 2, Rw[0]);
  }, {
    color: "#5a6a8a"
  });
  def("wardrobe", 2, 1, 38, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col);
    sbox(P, 1, B - 3, 62, 5, .45);
    box(P, 3, B - 66, 58, 10, 56, col);
    grain(P, 4, B - 65, 56, 8, col, g, 10);
    P.r(2, B - 56, 60, 3, R[4]).r(2, B - 56, 60, 1, R[5]).r(2, B - 54, 60, 1, R[1]);
    const fy = B - 53;
    P.r(5, fy + 1, 26, 40, R[3]).r(33, fy + 1, 26, 40, R[3]).r(31, fy + 1, 2, 40, R[1]).r(31, fy + 1, 1, 40, R[0]);
    P.r(5, fy + 1, 1, 40, R[4]).r(33, fy + 1, 1, 40, R[4]).r(30, fy + 1, 1, 40, R[2]).r(58, fy + 1, 1, 40, R[2]);
    P.r(8, fy + 4, 20, 34, R[1]);
    vgrad(P, 9, fy + 5, 18, 32, "#a8b8c0", "#5a6a74", 0, 1);
    P.r(10, fy + 18, 8, 19, "rgba(40,36,40,0.35)").oval(14, fy + 15, 3, 3, "rgba(40,36,40,0.3)");
    P.line(10, fy + 30, 22, fy + 6, "rgba(255,255,255,0.4)").line(12, fy + 34, 26, fy + 8, "rgba(255,255,255,0.25)").line(9, fy + 5, 26, fy + 5, "#d8e8f0");
    for (const [y0, l] of [ [ fy + 4, 16 ], [ fy + 23, 15 ] ]) {
      P.r(36, y0, 20, l, R[2]).r(36, y0, 20, 1, R[1]).r(36, y0 + l - 1, 20, 1, R[4]).r(37, y0 + 1, 18, l - 2, R[3]);
      vgrain(P, 38, y0 + 2, 16, l - 4, R[3], g, 8);
    }
    P.r(28, fy + 20, 2, 3, "#c8a040").p(28, fy + 20, "#f0d070").r(34, fy + 20, 2, 3, "#c8a040").p(34, fy + 20, "#f0d070");
    P.r(5, B - 11, 54, 7, R[3]).r(5, B - 11, 54, 1, R[4]).r(5, B - 5, 54, 1, R[1]);
    for (const x of [ 17, 45 ]) P.r(x, B - 8, 4, 1, "#c8a040");
    P.r(3, B - 4, 58, 2, R[1]).r(4, B - 2, 4, 2, R[0]).r(56, B - 2, 4, 2, R[0]);
  }, {
    color: "#6a4a30"
  });
  def("bigPlant", 1, 1, 36, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), L = [ "#3a6a32", "#2e5a2a", "#4a7a3a", "#467034" ];
    P.shadow(16, B - 2, 11, 3, .45);
    const bx = 16, by = B - 20, lv = [];
    for (let k = 0; k < 12; k++) {
      const a = -Math.PI / 2 + (k / 11 - .5) * 3 + (g.f() - .5) * .2, len = 26 + g.i(8) - Math.abs(k - 5.5) * 1.4;
      lv.push([ a, len, k ]);
    }
    lv.sort((p, q) => Math.abs(q[0] + Math.PI / 2) - Math.abs(p[0] + Math.PI / 2));
    for (const [a, len, k] of lv) {
      const sx = bx + Math.cos(a) * 3, sy = by, mx = bx + Math.cos(a) * len * .3, my = by + Math.sin(a) * len * .6;
      const tx = Math.max(2, Math.min(29, bx + Math.cos(a) * len * .85)), ty = Math.max(3, by + Math.sin(a) * len * 1.55 + (Math.abs(Math.cos(a)) > .8 ? 7 : 0));
      P.line(sx, sy, mx, my, "#34522a");
      pleaf(P, mx, my, tx, ty, 4.2, L[k % 4]);
      const Rl = RP(L[k % 4]);
      P.line(mx + (tx - mx) * .3, my + (ty - my) * .3 + 1, mx + (tx - mx) * .3 + 2, my + (ty - my) * .3 + 2, Rl[0]);
    }
    for (let i = 0; i < 18; i++) {
      const t = (i + .5) / 18;
      P.r(7 + i, B - 17, 1, 16, t < .2 ? R[4] : t < .55 ? R[3] : t < .8 ? R[2] : R[1]);
    }
    P.r(6, B - 19, 20, 3, R[4]).r(6, B - 19, 20, 1, R[5]).r(7, B - 18, 18, 1, "#2a2018").r(8, B - 1, 16, 1, R[1]);
    P.r(7, B - 10, 18, 1, R[2]);
    pleaf(P, 14, B - 19, 5, B - 12, 2.6, "#467034");
    pleaf(P, 18, B - 19, 27, B - 13, 2.6, "#3a6a32");
  }, {
    color: "#8a8680"
  });
  const CROP_COL = [ [ "#8ac85a", "#5e9a3c", "#c8ec9a" ], [ "#3e7a34", "#2a5a26", "#d8382a" ], [ "#4a8a3a", "#30662a", "#e04a3a" ], [ "#3e6e34", "#2a4e24", "#f0f0e8" ], [ "#9ad07a", "#62984a", "#d8f0b0" ] ];
  function bedBox(P, x0, x1, B, col, g) {
    const R = RP(col), w = x1 - x0;
    sbox(P, x0 - 1, B - 3, w + 2, 5, .42);
    P.r(x0, B - 24, w, 2, R[4]).r(x0 + 1, B - 24, w - 2, 1, R[5]);
    P.r(x0 + 2, B - 22, w - 4, 12, "#3a2a1c");
    P.noise(x0 + 2, B - 22, w - 4, 12, [ "#2e2016", "#4a3828", "#332418" ], Math.round(w * 1.2), g);
    P.r(x0 + 2, B - 22, w - 4, 1, "#2a1c12");
    P.r(x0, B - 22, 2, 12, R[3]).r(x1 - 2, B - 22, 2, 12, R[2]);
    P.r(x0, B - 10, w, 9, R[2]).r(x0, B - 10, w, 1, R[4]).r(x0, B - 6, w, 1, R[1]).r(x0, B - 5, w, 1, R[3]).r(x0, B - 2, w, 1, R[0]);
    vgrain(P, x0 + 1, B - 9, w - 2, 3, col, g, Math.round(w / 5));
    vgrain(P, x0 + 1, B - 4, w - 2, 2, col, g, Math.round(w / 5));
    for (const x of [ x0 + 3, x1 - 7 ]) P.r(x, B - 8, 4, 6, R[1]).r(x + 1, B - 7, 2, 4, R[3]);
    P.r(x0 + 1, B - 1, 3, 1, "#1a1b1e").r(x1 - 4, B - 1, 3, 1, "#1a1b1e");
  }
  function plantAt(P, sx, sy, code, g) {
    const crop = Math.floor(code / 7) % 5, st = code % 7, C = CROP_COL[crop], lf = C[0], dk = C[1], fr = C[2];
    if (st === 0) {
      P.p(sx - 5, sy + 2, "#4a3828").p(sx + 4, sy - 2, "#2e2016");
      return;
    }
    if (st === 1) {
      P.oval(sx, sy, 5, 3, "#4a3828").oval(sx, sy - 1, 4, 2, "#5a4630");
      P.p(sx - 2, sy - 1, "#d8c080").p(sx + 1, sy - 2, "#e8d090").p(sx + 2, sy, "#c8b070").p(sx - 1, sy + 1, "#d0b878");
      return;
    }
    if (st === 6) {
      P.line(sx, sy, sx - 1, sy - 7, "#6a5a30").line(sx - 1, sy - 7, sx + 4, sy - 9, "#7a6a38");
      pleaf(P, sx - 1, sy - 5, sx - 7, sy - 1, 2, "#8a7a3a");
      pleaf(P, sx + 3, sy - 9, sx + 8, sy - 6, 2, "#9a8a40");
      P.p(sx + 5, sy + 1, "#8a7a3a").p(sx - 4, sy + 2, "#7a6a38");
      return;
    }
    const hgt = st === 2 ? 4 : st === 3 ? 9 : st === 4 ? 14 : 16, n = st === 2 ? 2 : st === 3 ? 4 : st === 4 ? 6 : 7;
    P.line(sx, sy, sx, sy - hgt, dk);
    if (crop === 4 && st >= 4) {
      P.oval(sx, sy - 6, st === 5 ? 9 : 7, st === 5 ? 8 : 6, lf);
      P.oval(sx - 1, sy - 7, st === 5 ? 6 : 4, st === 5 ? 5 : 3, st === 5 ? fr : lf);
      for (let k = 0; k < 5; k++) {
        const a = Math.PI + k / 4 * Math.PI;
        pleaf(P, sx, sy - 2, sx + Math.cos(a) * 11, sy - 4 + Math.sin(a) * 9, 3, k % 2 ? dk : lf);
      }
      P.p(sx - 2, sy - 9, "#f0f8e0");
      return;
    }
    if (crop === 0 && st >= 3) {
      for (let k = 0; k < n + 1; k++) {
        const a = Math.PI + k / n * Math.PI, L = hgt * .75;
        pleaf(P, sx, sy, sx + Math.cos(a) * L, sy - 2 + Math.sin(a) * L * .9, 3.4, k % 2 ? dk : lf);
      }
      if (st === 5) {
        P.oval(sx, sy - 5, 4, 3, fr);
      }
      return;
    }
    for (let k = 0; k < n; k++) {
      const t = (k + 1) / (n + 1), y = sy - hgt * t, side = k % 2 ? 1 : -1, L = st === 2 ? 4 : 5 + (1 - t) * 5;
      pleaf(P, sx, y, sx + side * L, y - L * .5, st === 2 ? 1.6 : 2.6, k % 3 === 1 ? dk : lf);
    }
    if (st >= 4 && crop === 2) {
      P.line(sx + 3, sy, sx + 3, sy - hgt - 3, "#8a7a5a");
    }
    if (st === 5) {
      if (crop === 1) {
        for (const [dx, dy] of [ [ -4, -6 ], [ 3, -9 ], [ -2, -12 ] ]) P.r(sx + dx, sy + dy, 2, 4, fr).p(sx + dx, sy + dy, "#ff6a5a");
      } else if (crop === 2) {
        for (const [dx, dy] of [ [ -4, -5 ], [ 4, -8 ], [ -3, -11 ], [ 2, -13 ] ]) P.oval(sx + dx, sy + dy, 1.5, 1.5, fr).p(sx + dx - 1, sy + dy - 1, "#ff9a8a");
      } else if (crop === 3) {
        for (const [dx, dy] of [ [ -3, -15 ], [ 2, -17 ], [ 5, -13 ] ]) P.p(sx + dx, sy + dy, fr).p(sx + dx + 1, sy + dy, "#e8e0c0");
        P.p(sx - 6, sy + 1, "#c8a870").p(sx + 5, sy + 2, "#b89860");
      }
    }
  }
  const KIT_FILL = [ 0, 0, .3, .6, .95 ];
  function kitAt(P, x0, x1, B, xs, kl) {
    const tx0 = x1 - 9, tx1 = x1 - 3, hy = B - 14, wet = kl >= 2;
    P.r(tx0, B - 26, 7, 3, "#9a4a3a").r(tx0, B - 26, 7, 1, "#b85a46").r(tx0 + 3, B - 25, 1, 2, "#7a3a2e").r(tx0, B - 24, 7, 1, "#86402f").p(tx0 + 5, B - 25, "#a8523e");
    P.r(tx0, B - 38, 7, 12, "#dfe6ea").r(tx0, B - 38, 1, 12, "#f4f8fa").r(tx1, B - 38, 1, 12, "#b4c0c8").r(tx0, B - 27, 7, 1, "#a8b4bc").r(tx0 + 1, B - 39, 5, 1, "#e8eef2");
    const fh = Math.round(KIT_FILL[kl] * 10);
    if (fh > 0) {
      P.r(tx0 + 1, B - 27 - fh, 5, fh, "#7eb2da").r(tx0 + 1, B - 27 - fh, 5, 1, "#b8dcf2").r(tx1 - 1, B - 27 - fh + 1, 1, Math.max(0, fh - 1), "#6498c4");
      if (fh > 3) P.p(tx0 + 2, B - 29, "#e8f4fc");
    } else P.r(tx0 + 1, B - 28, 5, 1, "#c4ccd0");
    for (const y of [ B - 30, B - 33, B - 36 ]) P.p(tx0 + 1, y, "#9aa8b2");
    P.r(tx0 + 2, B - 36, 4, 3, "#f0e8c8").r(tx0 + 2, B - 35, 3, 1, "#8a7a5a").p(tx0 + 2, B - 34, "#8a7a5a").p(tx0 + 5, B - 36, "#3a5a9a").p(tx0 + 4, B - 34, "#3a5a9a");
    P.r(tx0, B - 31, 7, 1, "#383a42").p(tx0 + 4, B - 31, "#50535c").p(tx1, B - 32, "#383a42");
    P.p(tx1 - 1, B - 37, "#c8d2d8").p(tx1 - 2, B - 36, "#c8d2d8");
    P.r(tx0 + 2, B - 40, 3, 1, "#c8d0d6").r(tx0 + 2, B - 42, 3, 2, "#2a64b8").r(tx0 + 2, B - 42, 3, 1, "#4a86d0").p(tx0 + 3, B - 41, "#1e4a8a");
    P.r(tx1 - 2, B - 41, 3, 1, "#c8d0d6").p(tx1 - 2, B - 40, "#c8d0d6").p(tx1, B - 40, "#aab4bc").p(tx1 - 1, B - 40, "#8a969e");
    P.r(tx0 - 2, B - 29, 2, 2, "#c8963e").p(tx0 - 2, B - 29, "#e8c070").r(tx0 - 3, B - 31, 3, 1, "#c83a2e").p(tx0 - 3, B - 31, "#e85a4a");
    if (wet) P.p(tx0 - 1, B - 27, "#8ac4ee");
    if (wet) for (const sx of xs) P.oval(sx, hy + 1, 3.2, 1.2, "#22160e").p(sx + 2, hy + 1, "#2e2016");
    P.r(tx0 - 2, B - 27, 1, B - 27 - hy + 1, "#2a2e32").r(tx0 - 3, B - 26, 1, B - 27 - hy - 1, "#454b52");
    P.r(x0 + 4, hy, tx0 - 2 - (x0 + 4) + 1, 1, "#2a2e32").r(x0 + 4, hy - 1, tx0 - 3 - (x0 + 4), 1, "#454b52");
    P.r(x0 + 3, hy - 1, 1, 2, "#c83a2e").p(x0 + 2, hy, "#8a2a22");
    for (const sx of xs) {
      P.r(sx - 1, hy - 1, 2, 1, "#c83a2e").p(sx - 1, hy - 1, "#e85a4a").p(sx, hy + 1, "#3a3e44");
      if (wet) P.p(sx + 1, hy + 1, "#8ac4ee");
    }
    for (const x of [ x0 + 7, tx0 - 2 ]) P.p(x, hy - 1, "#e4e2da").p(x, hy + 1, "#e4e2da");
    const pts = [ x0 + 4 ].concat(xs, [ tx0 - 2 ]);
    for (let i = 0; i + 1 < pts.length; i++) if (pts[i + 1] - pts[i] >= 8) {
      const x = Math.round((pts[i] + pts[i + 1]) / 2);
      P.r(x, hy - 3, 1, 3, "#3e7a34").p(x, hy - 3, "#5e9a4c").p(x + 1, hy - 3, "#3e7a34");
    }
  }
  def("planter", 1, 1, 22, (P, w, h, up, g, v, col) => {
    const B = h - 2, kl = Math.floor((v | 0) / 35) % 5;
    bedBox(P, 2, 30, B, col, g);
    if (kl) kitAt(P, 2, 30, B, [ 16 ], kl);
    plantAt(P, 16, B - 16, (v | 0) % 35, g);
  }, {
    color: "#7a5a36"
  });
  def("planterBig", 2, 1, 22, (P, w, h, up, g, v, col) => {
    const B = h - 2, kl = Math.floor((v | 0) / 42875) % 5;
    bedBox(P, 1, 63, B, col, g);
    if (kl) kitAt(P, 1, 63, B, [ 12, 32, 52 ], kl);
    let q = v | 0;
    for (const sx of [ 12, 32, 52 ]) {
      plantAt(P, sx, B - 16, q % 35, g);
      q = Math.floor(q / 35);
    }
  }, {
    color: "#7a5a36"
  });
  A.defPropRot("planter", {
    sym: true
  });
  A.defPropRot("planterBig", {
    noRot: true
  });
  A.FOOT.planter = {
    x0: .06,
    x1: .94,
    d: .5
  };
  A.FOOT.planterBig = {
    x0: .02,
    x1: .98,
    d: .5
  };
  def("kitchen", 2, 1, 10, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), top = "#b8b4a8", Rt = RP(top);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 38, 60, 18, 3, top);
    P.noise(3, B - 37, 58, 16, [ Rt[3], Rt[5] ], .1, g);
    P.r(4, B - 37, 26, 16, "#2a2c30").r(4, B - 37, 26, 1, "#4a4d54");
    for (const cx of [ 11, 23 ]) {
      P.ring(cx, B - 29, 5, 3, "#5a5e64").ring(cx, B - 29, 3, 2, "#6a6e74").r(cx - 5, B - 29, 11, 1, "#4a4d54").r(cx, B - 33, 1, 8, "#4a4d54").oval(cx, B - 29, 1, 1, "#8a9098");
    }
    P.r(18, B - 35, 11, 8, "#8a9098").r(18, B - 35, 11, 1, "#c8ccd0").r(17, B - 34, 1, 4, "#5a5e64").r(29, B - 34, 2, 1, "#5a5e64");
    P.r(36, B - 35, 22, 12, "#9aa2a8").r(36, B - 35, 22, 1, "#c8d0d4").r(38, B - 33, 18, 8, "#5a6268").r(38, B - 33, 18, 2, "#7a8288").p(47, B - 29, "#2a2e32");
    P.r(46, B - 39, 2, 4, "#b8c0c4").r(46, B - 39, 6, 2, "#e0e8ec").r(51, B - 37, 1, 2, "#8a9298");
    box(P, 2, B - 17, 60, 0, 14, col, {
      flat: true
    });
    P.r(4, B - 16, 26, 12, "#2a2c30").r(6, B - 13, 22, 7, "#1a1e22").r(7, B - 12, 20, 1, "#3a4048").r(6, B - 15, 22, 1, "#b8bcc0");
    for (let x = 6; x < 28; x += 4) P.p(x, B - 17, "#c8ccd0");
    for (const x of [ 32, 47 ]) {
      P.r(x, B - 16, 14, 12, R[3]).r(x, B - 16, 14, 1, R[4]).r(x, B - 16, 1, 12, R[4]).r(x + 13, B - 16, 1, 12, R[1]).r(x, B - 5, 14, 1, R[1]).r(x + (x === 32 ? 11 : 2), B - 13, 1, 4, "#c8ccd0");
    }
    P.r(2, B - 3, 60, 3, "#1b1c1f");
  }, {
    color: "#8a9a88"
  });
  const HEAT_N = 8, HEAT_C = [ "#a8281a", "#e8521a", "#ff9220", "#ffd646", "#fff8d6" ];
  def("heater", 1, 1, 24, (P, w, h, up, g, v, col) => {
    const B = h - 2 - 12, R = RP(col), fk = ((SX.fireAnim && SX.fireAnim.ph) | 0) % HEAT_N;
    P.shadow(16, B - 2, 10, 3, .4);
    P.oval(16, B - 3, 10, 3, R[1]).oval(16, B - 4, 10, 2, R[3]);
    P.cyl(7, B - 28, 18, 25, col, {
      e: 5
    });
    P.r(10, B - 22, 12, 13, "#2a1e18");
    P.r(11, B - 21, 10, 11, "#1c0e0a");
    const band = B - 12 - Math.floor(fk * 8 / HEAT_N);
    for (let x = 12; x <= 19; x++) for (let y = B - 19; y <= B - 12; y++) {
      let lv = [ 0, 1, 2, 3, 3, 2, 1, 0 ][x - 12];
      if (y === band || y === band + 8) lv++;
      if ((y - (B - 19) & 1) === 1) lv--;
      if (y === B - 19 && (x === 12 || x === 19)) continue;
      P.p(x, y, HEAT_C[Math.max(0, Math.min(4, lv))]);
    }
    const tip = [ [ 13, 1, 0 ], [ 14, 2, 3 ], [ 16, 2, 5 ], [ 17, 1, 1 ], [ 18, 1, 6 ] ];
    for (const [x, n, o] of tip) {
      const ln = (fk + o) % 4 === 0 ? n + 1 : (fk + o) % 4 === 2 ? n - 1 : n;
      for (let k = 0; k < ln; k++) P.p(x, B - 20 - k, k === 0 ? "#ff9220" : "#e8521a");
    }
    for (let x = 12; x <= 19; x++) P.p(x, B - 11, (x + fk) % 3 === 0 ? "#9ac4ff" : "#3a6ad8");
    P.r(10, B - 22, 12, 1, "#3a2a20").r(10, B - 10, 12, 1, "#3a2a20").r(15, B - 22, 1, 13, "#3a2a20");
    P.oval(16, B - 26, 8, 2, "#4a4a4e");
    for (let k = -6; k <= 6; k += 3) P.r(16 + k, B - 27, 1, 3, "#8a8a8e");
    P.r(22, B - 8, 3, 3, "#1a1a1a").p(23, B - 7, "#c83a30");
    P.r(8, B - 8, 3, 2, "#e8e4d8").p(9, B - 7, "#3a70c0");
    P.ball(16, B - 31, 5, 4, "#b8bcc0");
    P.r(11, B - 30, 10, 2, "#8a9098");
    P.thick(21, B - 31, 25, B - 34, 2, "#9aa0a8");
    P.ring(16, B - 36, 3, 2, "#3a3a3e");
    P.p(26, B - 36, "rgba(255,255,255,0.4)").p(27, B - 38, "rgba(255,255,255,0.3)").p(26, B - 40, "rgba(255,255,255,0.2)");
  }, {
    color: "#c8c0a8"
  });
  def("speaker", 1, 1, 28, (P, w, h, up, g, v, col) => {
    const B = h - 2, R = RP(col), cone = (cx, cy, r) => {
      P.oval(cx, cy, r + 1, r + 1, R[0]).oval(cx, cy, r, r, "#3a3a3e").oval(cx, cy, r - 1, r - 1, "#26262a").oval(cx, cy, Math.max(1, r - 3), Math.max(1, r - 3), "#1a1a1e").oval(cx, cy, Math.max(1, r >> 2), Math.max(1, r >> 2), "#4a4a50");
      P.p(cx - (r >> 1), cy - (r >> 1), "#6a6a70").p(cx - 1, cy - 1, "#8a8a90");
    };
    sbox(P, 3, B - 3, 26, 5, .45);
    box(P, 6, B - 56, 20, 8, 48, col);
    P.r(7, B - 47, 18, 46, R[2]);
    cone(16, B - 42, 3);
    cone(16, B - 31, 6);
    cone(16, B - 16, 6);
    P.r(11, B - 6, 10, 2, R[0]).r(11, B - 6, 10, 1, "#000000");
    P.r(14, B - 48, 4, 1, "#b8bcc0");
    for (const x of [ 7, 23 ]) P.r(x, B - 1, 2, 2, "#8a9098");
    if (v % 2) {
      P.r(7, B - 47, 18, 46, "rgba(40,40,46,0.8)");
      P.dith(7, B - 47, 18, 46, "rgba(80,80,90,0.5)", 0);
      P.r(7, B - 47, 18, 1, R[4]);
    }
  }, {
    color: "#2a2a2e"
  });
  const K = RP("#34373c"), PL = RP("#2a2c30"), WD = RP("#7a5234"), ST = RP("#a8aeb4"), OL = RP("#4e5238");
  A.WPN["권총"] = {
    w: 21,
    h: 12,
    gx: 7,
    gy: 8,
    draw(P) {
      P.poly([ [ 5, 6 ], [ 11, 6 ], [ 10, 11 ], [ 4, 11 ] ], PL[2]);
      P.line(5, 6, 4, 10, PL[4]);
      P.r(4, 10, 6, 1, PL[1]);
      for (let y = 7; y < 10; y++) for (let x = 6 + (y & 1); x < 10; x += 2) P.p(x - (y - 6 >> 1), y, PL[3]);
      P.r(9, 6, 8, 2, K[2]).r(9, 6, 8, 1, K[3]);
      P.r(11, 8, 4, 1, K[1]).r(14, 8, 1, 2, K[1]).r(11, 10, 4, 1, K[1]).p(12, 8, K[4]);
      P.r(4, 2, 15, 4, K[3]).r(4, 2, 15, 1, K[5]).r(4, 5, 15, 1, K[1]).r(18, 2, 1, 4, K[2]);
      for (let x = 5; x < 9; x += 2) P.r(x, 3, 1, 2, K[1]);
      P.r(12, 3, 3, 1, K[0]).p(19, 3, K[0]).p(19, 4, K[1]);
      P.p(17, 1, K[4]).p(5, 1, K[4]);
    }
  };
  A.WPN["소총"] = {
    w: 37,
    h: 13,
    gx: 13,
    gy: 8,
    draw(P) {
      P.poly([ [ 1, 3 ], [ 10, 4 ], [ 10, 8 ], [ 2, 9 ], [ 1, 8 ] ], OL[2]);
      P.line(1, 3, 9, 4, OL[4]);
      P.r(1, 3, 1, 6, K[1]).r(2, 8, 8, 1, OL[1]);
      P.r(4, 5, 4, 1, OL[1]);
      P.r(9, 3, 12, 4, K[3]).r(9, 3, 12, 1, K[4]).r(9, 6, 12, 1, K[1]);
      for (let x = 10; x < 20; x += 2) P.p(x, 2, K[2]).p(x + 1, 2, K[4]);
      P.r(15, 4, 3, 1, K[0]).p(10, 4, K[5]);
      P.poly([ [ 11, 7 ], [ 14, 7 ], [ 13, 11 ], [ 10, 11 ] ], PL[2]);
      P.line(11, 7, 10, 10, PL[4]);
      P.r(14, 7, 3, 1, K[1]).p(15, 8, K[3]).r(14, 9, 3, 1, K[1]);
      P.poly([ [ 17, 7 ], [ 21, 7 ], [ 22, 11 ], [ 18, 12 ] ], K[2]);
      P.line(17, 7, 18, 11, K[4]);
      P.r(18, 11, 4, 1, K[0]);
      P.r(21, 3, 9, 4, OL[3]).r(21, 3, 9, 1, OL[4]).r(21, 6, 9, 1, OL[1]);
      for (let x = 22; x < 29; x += 2) P.p(x, 4, OL[1]).p(x + 1, 5, OL[1]);
      P.r(30, 4, 4, 2, K[3]).r(30, 4, 4, 1, K[4]);
      P.r(29, 1, 1, 3, K[2]).p(29, 1, K[4]);
      P.r(33, 3, 3, 4, K[2]).r(33, 3, 3, 1, K[4]).p(34, 4, K[0]).p(34, 5, K[0]);
    }
  };
  A.WPN["샷건"] = {
    w: 37,
    h: 12,
    gx: 11,
    gy: 7,
    draw(P) {
      P.poly([ [ 1, 2 ], [ 11, 4 ], [ 11, 7 ], [ 1, 9 ] ], WD[3]);
      P.line(1, 2, 10, 4, WD[5]);
      P.r(1, 2, 1, 7, "#1a1a1a");
      P.line(2, 8, 10, 7, WD[1]);
      P.line(3, 5, 8, 5, WD[2]);
      P.r(10, 3, 8, 5, K[3]).r(10, 3, 8, 1, K[4]).r(10, 7, 8, 1, K[1]).r(13, 5, 3, 1, K[0]);
      P.r(12, 8, 4, 1, K[1]).r(15, 8, 1, 2, K[1]).r(12, 10, 4, 1, K[1]).p(13, 8, K[4]);
      P.r(18, 3, 17, 2, K[3]).r(18, 3, 17, 1, K[5]);
      P.p(34, 2, "#d8d0a0");
      P.r(18, 5, 13, 2, K[2]).r(18, 6, 13, 1, K[1]).p(30, 5, K[4]);
      P.r(20, 4, 8, 4, WD[3]).r(20, 4, 8, 1, WD[5]).r(20, 7, 8, 1, WD[1]);
      for (let x = 21; x < 28; x += 2) P.r(x, 5, 1, 2, WD[2]);
      P.r(34, 3, 1, 2, K[0]);
    }
  };
  A.PP = {
    rgba,
    DK,
    cut,
    sbox,
    vgrad,
    hgrad,
    step,
    box,
    post,
    grain,
    vgrain,
    grime,
    rust,
    scratch,
    drip,
    rivet,
    glass,
    crack,
    word,
    txt,
    label,
    mini,
    books,
    goods,
    gun,
    medbox,
    helmet,
    vest,
    screen,
    hoop
  };
  const GPAL = {
    1: "#141518",
    2: "#202226",
    3: "#2e3136",
    4: "#41454c",
    5: "#5c616a",
    6: "#868c96",
    0: "#08090a",
    g: "#2a2c2f",
    h: "#3a3d41",
    i: "#4e5257",
    j: "#6a6f75",
    p: "#18191c",
    q: "#232528",
    r: "#303337",
    s: "#43474c",
    w: "#3e2212",
    x: "#5e3419",
    y: "#7e4823",
    z: "#a0622f",
    Z: "#c07c40",
    m: "#30331f",
    n: "#424730",
    o: "#575d40",
    u: "#6f7652",
    c: "#7a5a1e",
    b: "#b08a34",
    B: "#dcbc64",
    t: "#151517",
    T: "#2e2f33",
    d: "#6e7072",
    D: "#9a9c9e",
    e: "#7c8186",
    E: "#c2c6ca",
    l: "#4a3020",
    L: "#6a4630",
    R: "#8a5e3c",
    7: "#3a3c40",
    8: "#50535a",
    9: "#6c7078",
    A: "#8e939a",
    v: "#2a5a78",
    V: "#8fd0ea",
    "!": "#e04a3a"
  };
  function gunPix(rows) {
    return P => {
      for (let y = 0; y < rows.length; y++) {
        const t = rows[y];
        for (let x = 0; x < t.length; x++) {
          const c = GPAL[t[x]];
          if (c) P.p(x, y, c);
        }
      }
    };
  }
  A.WPN["K5 권총"] = {
    w: 20,
    h: 15,
    gx: 5,
    gy: 8,
    draw: gunPix([ "", "...3...........4", ".345555555555555654", ".232323233111333331", "..21212122222222221", "..iiiiiiiiiiiiiih", "..irrrrrh1411h", "..iqrqrqh1311h", "..irqrqrh3111g", ".iqrqrqhgggggg", ".irqrqrh", ".iqrqrqh", ".irqrqrh", ".3222222" ])
  };
  A.WPN["K13 소음권총"] = {
    w: 32,
    h: 15,
    gx: 5,
    gy: 8,
    draw: gunPix([ "", "...3...........4", ".345555555555555654444454444443", ".232323233111333331883333333332", "..21212122222222221773333333332", "..iiiiiiiiiiiiiih..772222222221", "..irrrrrh1411h.......2222222221", "..iqrqrqh1311h", "..irqrqrh3111g", ".iqrqrqhgggggg", ".irqrqrh", ".iqrqrqh", ".irqrqrh", ".3222222" ])
  };
  A.WPN[".38 리볼버"] = {
    w: 20,
    h: 14,
    gx: 4,
    gy: 8,
    draw: gunPix([ "", "....3", "....43............4", ".....45555555555555", ".....43365453444443", ".....32254342333331", ".....32143231", "...Zzyx232121", "...zyyx3.1.2", "..Zybx.3.1.2", "..zyyx.2222", ".zyyx", ".wxxw" ])
  };
  A.WPN["K1A 기관단총"] = {
    w: 32,
    h: 15,
    gx: 7,
    gy: 8,
    draw: gunPix([ "", "", ".........34..............4", ".qs.....jjjjjjjjjsssssss55", ".qr44444iiii111iirrrrrrr44.4143", ".qr.....iiiiiiiihqpqpqpq3343332", ".qr.....gggggggggqqqqqqp2222221", ".qr33333hhhhhhhhg", ".pq...rqq141432", "......rqpggg432", ".....rqq....432", ".....rqp.....432", "....qpp......432", ".............211" ])
  };
  A.WPN["K7 소음기관단총"] = {
    w: 35,
    h: 15,
    gx: 12,
    gy: 8,
    draw: gunPix([ "", "", "............34............4", ".qs........jjjjjjjjjj45454354", ".qr44444444iiii111iii3131344345443", ".qr........iiiiiiiiih3131333233332", ".qr........gggggggggg2121222122221", ".qr33333333hhhhhhhhhg", ".pq........rqq141432", "...........rqpggg432", "..........rqq....432", "..........rqp....432", ".........qpp.....432", ".................211" ])
  };
  A.WPN["M16A1 소총"] = {
    w: 40,
    h: 14,
    gx: 9,
    gy: 8,
    draw: gunPix([ "", "...........ijjjjji............4", "...........i.....i............3", ".pssssssssjjjjjjjj5ssssss....43", ".prrrrrrrriii111ii4rrrrrrrrrr32......43", ".pqqqqqqppiiiiiiii4pqpqpqpqpq3244444412", ".pqqqqpphhhhhhhhhh3qqqqqqqqqp2.......21", ".pqppp..ghghhhhhhg2ppppp", ".pp.....rqq141A98", "........rqpgggA98", ".......rqq....A98", ".......rqp....A98", "......qpp.....877" ])
  };
  A.WPN["K2 소총"] = {
    w: 40,
    h: 15,
    gx: 11,
    gy: 8,
    draw: gunPix([ "", "", "............343.................4", ".psssssss3iiiiiiiiii.ssssss....34", ".prrrrrrr3ihhh111h4hrrrrrrrr...32", ".pqqqqqpp3hhhhhhhhhhqpqpqpqp44443...414", ".pqqqpp...ggggggggggqqqqqqqq.2221222332", ".pqpp.....ggggggggg..pppppp....3....221", ".pp.......rqq141432", "..........rqpggg432", ".........rqq.....432", ".........rqp.....432", "........qpp.......432", "..................211" ])
  };
  A.WPN["K2C1 소총"] = {
    w: 41,
    h: 16,
    gx: 11,
    gy: 9,
    draw: gunPix([ "", "..............4443V", "..............3322v", ".qss......42424242424..........4", ".qsrrrr...iiiiiiiiiii53535353534", ".qrrrr4444ihhh111hh4hiiiiiiiiii3.....414", ".qqqqq3333hhhhhhhhhhhi111i111ih244444332", ".qqqqp2222ggggggggggghhhhhhhhhh222222221", ".qqp......gggggggggg.3131313131", ".pp.......rqq141432....rq", "..........rqpggg432....rq", ".........rqq.....432...rq", ".........rqp.....432...qp", "........qpp.......432", "..................211" ])
  };
  A.WPN["K3 기관총"] = {
    w: 45,
    h: 16,
    gx: 10,
    gy: 9,
    draw: gunPix([ "", "", ".............jjjjjjjjjjjj..3443", ".qssssssssssiiiiiiiiiiiiii.2..2....4", ".qqqqqqqqqqqiiiiiiiiiiii4h45454545.3", ".qr........qhhhhhhhhhhhhhh31313131.3......41", ".qr.......qqhhhh111hhhhhhh222222224444444432", ".qr......qqqgggggggggggggg3333333333......21", ".qr....qqq..gggggggggggggg444444444", ".qr..qqq.rqq141uooooonBb..22222222", ".pqqqq...rqpgggoooooonbc", "........rqq....onnnnnm", "........rqp....oooooon", ".......qpp.....nnnnnnm", "...............mmmmmmm" ])
  };
  A.WPN["K14 저격소총"] = {
    w: 48,
    h: 16,
    gx: 13,
    gy: 9,
    draw: gunPix([ "", "...........33....4...4443", "...........4444444444444V", ".qs.ssssss.2222222222222v", ".qr.rrrrrr.....3....3", ".qrsssssssssssss55555555jjjjjjjjj", ".qrqqqqqqqqqqqqq44444444i1ii1ii1i56565656565454", ".qr............433333333iiiiiiiii33333333333313", ".qr............622222222hhhhhhhhh444444.....212", ".qr.........rqq.141432...........222222", ".qr.........r.q.ggg211", ".qr.........rqq", ".pqqqqqqqqqqrqp", "....q.......qpp", "....p" ])
  };
  A.WPN["엽총"] = {
    w: 38,
    h: 12,
    gx: 11,
    gy: 7,
    draw: gunPix([ "", "", "", ".............A9.....................E", ".........zyzyEEA555555555555555555555", ".lZZZZZZZyxyxEA9111111111111111111111", ".LzzzzzzzxyxyA99Zzzzzzy44444444444444", ".Lyyyyxxx.xxx99eyyyyyyx22222222222222", ".Lxxxxwww....eee.xxxxw", ".Lwwww......1414", "...........22222" ])
  };
  A.WPN["USAS-12 산탄총"] = {
    w: 40,
    h: 17,
    gx: 12,
    gy: 9,
    draw: gunPix([ "", "............iiiiiiiii", "............hgggggggh", ".pssss......hhhhhhhhh.........4", ".prrrrsssssjjjjjjjjjjsssssssss3", ".pqqqqrrrrriiii111iiirrrrrrrrr3", ".pqqqqqqqppiiiiiiiiiippppp5ppp255555555", ".pqqqqppp..hhhhhhhhhhqqqqqqqqq.33333333", ".ppppp.....ggggggggggpppppppp", "...........rqq141.543", "...........rqpggg.321", "..........rqq.....543", "..........rqp.....321", ".........qpp......543", "..................321", "..................211" ])
  };
  A.WPN["사제 파이프 권총"] = {
    w: 20,
    h: 14,
    gx: 4,
    gy: 8,
    draw: gunPix([ "", "", "......999E9999E99RR", "..A8A8777e7777e77LL", ".TTTTTTTTETTT", ".tTttTttTettt", ".ttttttttettt", "..tTTt..E", "..tttt..e", "..DDdd", "..dddd", "..tttt", "..tttt" ])
  };
  A.WPN["사제 산탄총"] = {
    w: 28,
    h: 12,
    gx: 5,
    gy: 7,
    draw: gunPix([ "", "", ".8.......999999TTTTT9999RRR", ".8999E999888888tTtTt8888LRL", ".7777e777888888ttttt8888LLl", ".7.zzey..777777ttttt7777lll", "...zyex", "...zyyx", "..zyyx", "..zyyx", "..wxxw" ])
  };
  A.WPN["사제 기관단총"] = {
    w: 26,
    h: 14,
    gx: 9,
    gy: 8,
    draw: gunPix([ "", "", "", "..8988TTTTTTTTTTDDTET", ".8....tTttTtETttDdtet999R", ".7....ttttttttttddtet777L", ".7....ttttttttttddtet", "..778777zyx.E.tTt", "........zyx.e.tTt", "........zyx...tTt", "........zyx...tTt", "........wxw...tTt", "..............ttt" ])
  };
  A.WPN["사제 사냥총"] = {
    w: 36,
    h: 10,
    gx: 12,
    gy: 6,
    draw: gunPix([ "", "", "", ".............99999......E....E", ".xyyyyyyyyyyy877789TT999e9999e99RRL", ".wyyyyyyyyyyyx7777zTtzzzezzzzez", ".wxxyyyyyyyyx..8exxttxxxexxxxex", ".wxxxxxxxx....E.e.......e....e", ".wwwww" ])
  };
  A.MEL.knife = {
    w: 21,
    h: 8,
    gx: 3,
    gy: 4,
    draw(P) {
      P.r(1, 3, 7, 3, "#2a2420").r(1, 3, 7, 1, "#4a4038").r(1, 5, 7, 1, "#1a1614");
      P.p(3, 4, "#c8c0b0").p(6, 4, "#c8c0b0");
      P.r(8, 2, 1, 5, ST[2]).r(8, 2, 1, 1, ST[4]);
      P.poly([ [ 9, 2 ], [ 17, 2 ], [ 20, 4 ], [ 9, 6 ] ], ST[3]);
      P.r(9, 2, 9, 1, ST[1]);
      P.line(9, 5, 19, 4, ST[5]);
      P.r(9, 3, 7, 1, ST[4]);
      P.p(19, 4, ST[5]);
    }
  };
  A.MEL.pick = {
    w: 22,
    h: 7,
    gx: 4,
    gy: 3,
    draw(P) {
      P.r(1, 1, 8, 5, "#c8a020").r(1, 1, 8, 1, "#f0d060").r(1, 5, 8, 1, "#8a6a10");
      for (let x = 2; x < 9; x += 2) P.r(x, 2, 1, 3, "#a88418");
      P.r(1, 2, 1, 3, "#1a1a1a");
      P.r(9, 2, 2, 3, "#8a9098").r(9, 2, 2, 1, "#c8ccd0");
      P.r(11, 3, 8, 1, ST[4]).r(11, 2, 8, 1, ST[2]).p(19, 3, ST[5]).p(20, 3, ST[3]);
    }
  };
  A.MEL.axe = {
    w: 26,
    h: 14,
    gx: 4,
    gy: 7,
    draw(P) {
      for (let x = 1; x < 19; x++) {
        const y = 6 + (x < 4 ? 1 : 0);
        P.r(x, y, 1, 3, WD[3]).p(x, y, WD[5]).p(x, y + 2, WD[1]);
      }
      P.r(1, 6, 1, 4, "#2a1e14");
      P.r(3, 7, 3, 1, WD[2]);
      P.r(16, 2, 6, 5, ST[2]).r(16, 2, 6, 1, ST[4]).r(16, 2, 1, 5, ST[4]).r(21, 2, 1, 5, ST[1]);
      P.poly([ [ 16, 7 ], [ 22, 7 ], [ 23, 9 ], [ 24, 13 ], [ 12, 13 ], [ 14, 9 ] ], ST[3]);
      P.line(15, 8, 13, 12, ST[4]);
      P.r(13, 12, 11, 1, ST[5]).r(14, 11, 9, 1, ST[4]);
      P.r(17, 8, 4, 1, ST[1]).p(18, 5, ST[0]).p(22, 9, ST[1]).p(23, 11, ST[1]);
    }
  };
  A.MEL.bat = {
    w: 32,
    h: 10,
    gx: 4,
    gy: 5,
    draw(P) {
      P.x.translate(0, 1);
      P.r(1, 2, 2, 5, WD[2]).p(1, 2, WD[4]);
      for (let x = 3; x < 31; x++) {
        const t = (x - 3) / 27, hw = t < .35 ? 1 : t < .6 ? 1 + Math.round((t - .35) * 6) : 3;
        const y0 = 4 - hw, hh = hw * 2 + (hw > 1 ? 0 : 1);
        P.r(x, y0, 1, hh, WD[3]).p(x, y0, WD[5]);
        if (hh > 2) P.p(x, y0 + hh - 1, WD[1]);
        if (hh > 3) P.p(x, y0 + 1, WD[4]);
      }
      for (let x = 3; x < 11; x += 2) P.r(x, 3, 1, 3, "#1e1e22");
      P.p(30, 2, WD[2]).p(30, 5, WD[1]);
      P.r(22, 0, 1, 2, "#8a9098").r(26, 0, 1, 2, "#8a9098").p(22, 0, "#d0d4d8").p(26, 0, "#d0d4d8");
    }
  };
  A.MEL.wrench = {
    w: 26,
    h: 12,
    gx: 4,
    gy: 6,
    draw(P) {
      P.r(1, 5, 17, 3, ST[3]).r(1, 5, 17, 1, ST[5]).r(1, 7, 17, 1, ST[1]).r(4, 6, 11, 1, ST[2]);
      P.r(1, 5, 1, 3, ST[2]);
      P.r(17, 2, 5, 7, ST[3]).r(17, 2, 5, 1, ST[5]).r(17, 2, 1, 7, ST[4]);
      P.r(21, 1, 4, 3, ST[3]).r(21, 1, 4, 1, ST[5]).r(24, 1, 1, 3, ST[1]);
      P.r(20, 7, 4, 3, ST[2]).r(20, 7, 4, 1, ST[4]).r(23, 7, 1, 3, ST[1]);
      P.x.clearRect(22, 4, 3, 3);
      P.r(17, 8, 3, 2, "#8a7a4a").p(18, 8, "#c8b870").p(17, 9, "#6a5a30");
    }
  };
  const px = (P, x, y, c) => P.r(x, y, 1, 1, c);
  A.WPN["식칼"] = {
    w: 26,
    h: 9,
    gx: 4,
    gy: 4,
    draw(P) {
      P.r(1, 3, 8, 3, "#2a2426").r(1, 3, 8, 1, "#46403e").r(1, 5, 8, 1, "#161214");
      px(P, 3, 4, "#c8ccd2");
      px(P, 6, 4, "#c8ccd2");
      P.r(9, 2, 2, 5, "#aab2ba").r(9, 2, 2, 1, "#dce2e8").r(9, 6, 2, 1, "#7a828a");
      for (let x = 11; x <= 24; x++) {
        const t = (x - 11) / 13, top = 2, bot = Math.round(6 - Math.pow(Math.max(0, t - .4) / .6, 2) * 4);
        if (bot < top) continue;
        P.r(x, top, 1, bot - top + 1, "#b8c0c8");
        px(P, x, top, "#dce2e8");
        if (bot - top >= 3) px(P, x, bot - 1, "#8a929c");
        px(P, x, bot, "#f0f4f8");
      }
      px(P, 25, 2, "#dce2e8");
      P.r(16, 4, 2, 1, "#6a2a26");
      px(P, 18, 5, "#6a2a26");
    }
  };
  A.WPN["군용칼"] = {
    w: 26,
    h: 9,
    gx: 6,
    gy: 4,
    draw(P) {
      P.r(1, 3, 2, 3, "#6a7078");
      px(P, 1, 3, "#9aa2aa");
      for (let x = 3; x < 10; x++) P.r(x, 3, 1, 3, (x - 3 >> 1) % 2 ? "#7a5234" : "#9a6c44");
      P.r(3, 5, 7, 1, "#5a3a22");
      P.r(10, 1, 2, 7, "#5a6068").r(10, 1, 1, 7, "#8a9098");
      for (let x = 12; x <= 25; x++) {
        const top = x < 20 ? 2 : 2 + Math.round((x - 20) * .45), bot = x < 20 ? 6 : Math.round(6 - Math.pow((x - 20) / 5.5, 1.6) * 2.5);
        if (bot < top) continue;
        P.r(x, top, 1, bot - top + 1, "#5a6068");
        px(P, x, top, "#9aa2aa");
        if (bot - top >= 3) px(P, x, bot - 1, "#aab2ba");
        px(P, x, bot, "#dce2e8");
      }
      P.r(13, 3, 7, 1, "#3a3e44");
      for (let x = 12; x < 19; x += 2) px(P, x, 1, "#5a6068");
    }
  };
  A.WPN["스크류드라이버"] = {
    w: 24,
    h: 7,
    gx: 5,
    gy: 3,
    draw(P) {
      P.r(1, 1, 9, 5, "#d8b030").r(1, 1, 9, 1, "#fff0a0").r(1, 5, 9, 1, "#9a7a18");
      for (const x of [ 2, 4, 6 ]) P.r(x, 2, 1, 3, "#2a2c30");
      P.r(1, 2, 1, 3, "#2a2c30");
      P.r(10, 2, 2, 3, "#2a2c30");
      px(P, 10, 2, "#4a4c52");
      P.r(12, 2, 10, 2, "#c0c8d0").r(12, 2, 10, 1, "#e8eef4").r(12, 3, 10, 1, "#8a929a");
      P.r(22, 2, 1, 2, "#9aa2aa");
      px(P, 23, 2, "#c0c8d0");
    }
  };
  A.WPN["장도리"] = {
    w: 22,
    h: 17,
    gx: 5,
    gy: 8,
    draw(P) {
      P.r(1, 7, 15, 3, "#b8342a").r(1, 7, 15, 1, "#d85a4a").r(1, 9, 15, 1, "#7a2018");
      for (let x = 7; x < 15; x += 3) P.r(x, 7, 1, 3, "#8a2a22");
      P.r(1, 7, 5, 3, "#1e2024").r(1, 7, 5, 1, "#3a3c42");
      P.r(15, 4, 5, 8, "#6a7078").r(15, 4, 1, 8, "#8a9098");
      P.r(15, 1, 5, 3, "#7e848c").r(14, 0, 7, 2, "#a8b0b8").r(14, 0, 7, 1, "#e0e6ec");
      P.poly([ [ 15, 12 ], [ 20, 12 ], [ 19, 14 ], [ 16, 16 ], [ 11, 16 ], [ 12, 15 ], [ 15, 14 ] ], "#7e848c");
      P.line(17, 13, 13, 15, "#26282c");
    }
  };
  A.WPN["캠핑도끼"] = {
    w: 23,
    h: 17,
    gx: 5,
    gy: 8,
    draw(P) {
      for (let x = 1; x < 18; x++) {
        if (x < 8) P.r(x, 7, 1, 3, x % 3 ? "#2a2c30" : "#c8581e"); else {
          P.r(x, 7, 1, 3, "#a0703e");
          px(P, x, 7, "#c8945a");
          px(P, x, 9, "#6a4a28");
        }
      }
      P.r(15, 2, 3, 2, "#3a3e44");
      P.r(14, 4, 5, 6, "#3a3e44").r(14, 4, 5, 1, "#5a6068");
      for (let y = 10; y <= 16; y++) {
        const k = y - 10, x0 = 14 - Math.round(k * .5), x1 = 18 + Math.round(k * .6);
        P.r(x0, y, x1 - x0 + 1, 1, y >= 16 ? "#e0e6ec" : y >= 14 ? "#a8b0b8" : "#3a3e44");
      }
    }
  };
  A.WPN["소방도끼"] = {
    w: 34,
    h: 20,
    gx: 6,
    gy: 9,
    draw(P) {
      for (let x = 1; x < 27; x++) {
        if (x < 10) P.r(x, 8, 1, 3, x % 3 ? "#26282c" : "#3a3c42"); else {
          P.r(x, 8, 1, 3, "#e0b030");
          px(P, x, 8, "#f8d860");
          px(P, x, 10, "#a07818");
        }
      }
      P.r(1, 8, 1, 3, "#16181c");
      P.r(24, 5, 6, 9, "#b8302a").r(24, 5, 6, 1, "#f06a5a").r(24, 5, 1, 9, "#d84a3a").r(29, 5, 1, 9, "#8a2018");
      for (let y = 1; y < 5; y++) {
        const hw = Math.round((y - 1) * .6);
        P.r(27 - hw, y, 1 + hw * 2, 1, "#b8302a");
      }
      P.r(27, 0, 1, 2, "#c8ced4");
      for (let k = 0; k <= 5; k++) {
        const y = 14 + k, x0 = 24 - Math.round(k * .9), x1 = 29 + Math.round(k * .6);
        P.r(x0, y, x1 - x0 + 1, 1, k >= 5 ? "#f0f4f8" : k >= 4 ? "#d8dee4" : "#b8302a");
        if (k === 3) {
          px(P, x0, y, "#d8dee4");
          px(P, x1, y, "#d8dee4");
        }
      }
      P.r(25, 14, 1, 3, "#8a2018");
    }
  };
  A.WPN["야구방망이"] = {
    w: 32,
    h: 10,
    gx: 4,
    gy: 5,
    draw(P) {
      P.r(1, 2, 2, 6, "#2a2426");
      px(P, 1, 2, "#4a4446");
      for (let x = 3; x < 31; x++) {
        const t = (x - 3) / 27, hw = t < .35 ? 1 : t < .65 ? 1 + Math.round((t - .35) * 6.7) : 3, y0 = 5 - hw, hh = hw * 2;
        if (x < 11) {
          P.r(x, y0, 1, hh, x % 2 ? "#2a2c32" : "#3e4048");
          continue;
        }
        P.r(x, y0, 1, hh, "#c8a06a");
        px(P, x, y0, "#e0c08a");
        px(P, x, y0 + hh - 1, "#8a6438");
        if (hh > 3 && x % 5 === 0) px(P, x, y0 + 2, "#a87c4a");
      }
      P.r(31, 3, 1, 4, "#b08a58");
      P.r(26, 3, 2, 1, "#6a1e1e");
      px(P, 27, 4, "#6a1e1e");
    }
  };
  A.WPN["하키스틱"] = {
    w: 34,
    h: 11,
    gx: 5,
    gy: 4,
    draw(P) {
      for (let x = 1; x < 27; x++) {
        if (x < 7) {
          P.r(x, 3, 1, 2, x % 2 ? "#e8e4dc" : "#c8c4bc");
          continue;
        }
        if (x >= 13 && x < 16) {
          P.r(x, 3, 1, 2, "#c8302a");
          continue;
        }
        P.r(x, 3, 1, 2, "#c49a5e");
        px(P, x, 3, "#dcb67a");
      }
      P.r(1, 3, 1, 2, "#a8a49c");
      P.line(26, 4, 28, 7, "#c49a5e");
      P.line(27, 4, 29, 7, "#a87c48");
      P.r(27, 7, 7, 3, "#2a2c32");
      for (let x = 28; x < 34; x += 3) P.r(x, 7, 1, 3, "#40424a");
      P.r(27, 7, 7, 1, "#6a6e78");
      P.x.clearRect(33, 9, 1, 1);
    }
  };
  A.WPN["몽키렌치"] = {
    w: 27,
    h: 12,
    gx: 5,
    gy: 6,
    draw(P) {
      P.r(1, 5, 14, 3, "#b8302a").r(1, 5, 14, 1, "#d85a4a").r(1, 7, 14, 1, "#7a1a16");
      for (let x = 5; x < 14; x += 3) P.r(x, 5, 1, 3, "#8a2420");
      P.x.clearRect(2, 6, 2, 1);
      P.r(15, 5, 3, 3, "#a8b0b8").r(15, 5, 3, 1, "#e8eef4");
      P.r(17, 2, 5, 9, "#a8b0b8").r(17, 2, 5, 1, "#e8eef4").r(17, 2, 1, 9, "#c8d0d8").r(21, 2, 1, 9, "#7a828a");
      P.r(20, 1, 6, 3, "#a8b0b8").r(20, 1, 6, 1, "#e8eef4").r(25, 1, 1, 3, "#7a828a");
      P.r(20, 8, 5, 2, "#a8b0b8").r(24, 8, 1, 2, "#7a828a");
      P.r(17, 8, 3, 2, "#6a7078");
      px(P, 17, 8, "#c8d0d8");
      px(P, 19, 8, "#c8d0d8");
    }
  };
  A.WPN["스패너"] = {
    w: 27,
    h: 9,
    gx: 13,
    gy: 4,
    draw(P) {
      const c = "#b0b8c0", hi = "#e0e6ec", lo = "#7a828a", col = y => y < 3 ? hi : y > 5 ? lo : c;
      P.r(7, 3, 13, 3, c).r(7, 3, 13, 1, hi).r(7, 5, 13, 1, lo);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        const d = Math.hypot(x - 4, y - 4);
        if (d <= 4.2 && d >= 1.8) px(P, x, y, col(y));
      }
      for (let y = 0; y < 9; y++) for (let x = 19; x < 27; x++) {
        const dx = x - 22, dy = y - 4;
        if (Math.hypot(dx, dy) > 4.4) continue;
        if (dx >= -.5 && Math.abs(dy) <= 1.2) continue;
        px(P, x, y, col(y));
      }
    }
  };
  def("goldStatue", 1, 1, 44, (P, w, h, up, g, v) => {
    const B = h - 2, G = RP("#d8a830"), M = RP("#d8d4cc");
    sbox(P, 4, B - 3, 24, 5, .45);
    box(P, 6, B - 20, 20, 4, 16, "#d8d4cc");
    P.r(7, B - 12, 18, 1, M[3]).r(9, B - 9, 14, 4, M[2]).r(10, B - 8, 12, 2, "#c8a040");
    P.oval(16, B - 25, 11, 5, G[1]).oval(16, B - 26, 11, 5, G[3]).r(5, B - 26, 22, 4, G[3]).r(5, B - 26, 22, 1, G[5]);
    P.r(12, B - 32, 8, 6, G[2]).r(13, B - 32, 6, 6, G[3]);
    P.oval(16, B - 38, 6, 7, G[2]).oval(15, B - 39, 5, 6, G[4]).oval(14, B - 40, 3, 3, G[5]);
    P.oval(16, B - 43, 8, 5, G[1]).oval(16, B - 44, 7, 4, G[3]).r(8, B - 42, 16, 2, G[2]).r(10, B - 46, 3, 1, G[5]);
    P.r(12, B - 38, 3, 1, G[1]).r(18, B - 38, 3, 1, G[1]).r(14, B - 34, 4, 1, G[1]);
    for (const [x, y] of [ [ 8, B - 27 ], [ 22, B - 44 ], [ 11, B - 41 ], [ 24, B - 25 ] ]) P.p(x, y, "#fff8d8");
  });
  def("painting", 2, 1, 56, (P, w, h, up, g, v) => {
    const B = h - 2 - 30, F = RP("#c8a040");
    P.r(6, B - 44, 52, 34, F[1]).r(7, B - 45, 52, 34, F[3]).r(8, B - 44, 50, 32, F[2]).r(7, B - 45, 52, 1, F[5]);
    const x0 = 11, y0 = B - 41, W = 44, H = 26;
    for (let k = 0; k < H; k++) P.r(x0, y0 + k, W, 1, k < 12 ? mix("#e8a070", "#6a88c8", 1 - k / 12) : k < 17 ? "#5a7a5a" : mix("#3a6a9a", "#2a4a6a", (k - 17) / 9));
    P.poly([ [ x0, y0 + 14 ], [ x0 + 10, y0 + 7 ], [ x0 + 18, y0 + 12 ], [ x0 + 28, y0 + 5 ], [ x0 + 38, y0 + 11 ], [ x0 + W, y0 + 8 ], [ x0 + W, y0 + 17 ], [ x0, y0 + 17 ] ], "#4a6a4a");
    P.oval(x0 + 34, y0 + 7, 3, 3, "#f8d890");
    for (let k = 0; k < 5; k++) P.r(x0 + 4 + k * 8, y0 + 19 + (k & 1), 5, 1, "#8ab0d8");
    P.r(x0 + 6, y0 + 16, 30, 1, "#2a2a30");
    for (let k = 0; k < 6; k++) P.r(x0 + 8 + k * 5, y0 + 16, 1, 3, "#2a2a30");
    P.r(28, B - 11, 8, 2, F[4]);
  });
  def("grandPiano", 3, 2, 40, (P, w, h, up, g, v) => {
    const B = h - 2, K = RP("#2a2a30");
    sbox(P, 4, B - 6, 88, 8, .5);
    for (const x of [ 10, 82 ]) P.r(x, B - 22, 4, 20, K[1]).r(x, B - 22, 1, 20, K[3]);
    P.r(46, B - 14, 4, 12, K[1]);
    P.poly([ [ 6, B - 44 ], [ 70, B - 58 ], [ 90, B - 50 ], [ 90, B - 26 ], [ 6, B - 26 ] ], K[2]);
    P.poly([ [ 6, B - 44 ], [ 70, B - 58 ], [ 72, B - 56 ], [ 8, B - 42 ] ], K[4]);
    P.r(6, B - 28, 84, 8, K[1]).r(6, B - 28, 84, 1, K[3]);
    P.poly([ [ 34, B - 52 ], [ 66, B - 84 ], [ 92, B - 78 ], [ 62, B - 48 ] ], K[2]);
    P.poly([ [ 34, B - 52 ], [ 66, B - 84 ], [ 67, B - 82 ], [ 36, B - 51 ] ], K[4]);
    P.poly([ [ 62, B - 48 ], [ 92, B - 78 ], [ 92, B - 76 ], [ 63, B - 46 ] ], K[0]);
    P.line(50, B - 48, 62, B - 66, "#8a8a90");
    P.r(10, B - 36, 60, 8, "#f4f0e4");
    for (let k = 0; k < 20; k++) {
      P.r(10 + k * 3, B - 36, 1, 8, "#c8c4b8");
      if ([ 0, 1, 3, 4, 5 ].includes(k % 7)) P.r(12 + k * 3, B - 36, 2, 5, "#1a1a1e");
    }
    P.r(8, B - 38, 64, 2, K[3]);
    P.r(30, B - 46, 22, 6, "#e8e0c8").r(31, B - 45, 20, 1, "#8a8478").r(31, B - 43, 16, 1, "#8a8478");
    for (const [x, y] of [ [ 20, B - 40 ], [ 60, B - 52 ], [ 84, B - 44 ] ]) P.p(x, y, "#e8e8f0");
  });
  TANK.bigTank = {
    fish: [ [ "#f08030", 14, 8 ], [ "#f0d040", 34, 14 ], [ "#4ac0e8", 24, 20 ], [ "#e84a4a", 52, 6 ], [ "#b060e0", 78, 12 ], [ "#f0f0f0", 86, 22 ] ],
    big: [ 38, 4, "#8aa0b0", "#6a8090" ],
    wet: B => {
      const fy = B - 44;
      return {
        fy,
        x0: 4,
        x1: 91,
        y0: fy + 2,
        y1: B - 21,
        yb: B - 18,
        bx: 88
      };
    },
    glare: (P, fy) => P.line(8, fy + 24, 18, fy + 2, "rgba(255,255,255,0.3)").line(10, fy + 24, 20, fy + 2, "rgba(255,255,255,0.15)")
  };
  def("bigTank", 3, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, S = RP("#3a3430"), W = RP("#3aa0b0");
    sbox(P, 1, B - 3, 94, 5, .45);
    box(P, 3, B - 16, 90, 0, 16, "#3a3430");
    for (const x of [ 4, 34, 64 ]) P.r(x, B - 14, 28, 11, S[3]).r(x, B - 14, 28, 1, S[4]).r(x + 27, B - 14, 1, 11, S[1]).r(x + 13, B - 10, 2, 3, "#c8a040");
    P.r(4, B - 58, 88, 14, W[4]);
    P.r(3, B - 59, 90, 5, "#1a1a1c").r(3, B - 59, 90, 1, "#3a3a3e").r(8, B - 55, 80, 1, "#f0f8ff");
    const fy = B - 44;
    for (let k = 0; k < 28; k++) P.r(4, fy + k, 88, 1, mix(W[4], W[1], k / 28));
    for (let x = 4; x < 92; x++) {
      const hh = 2 + x * 7 % 3;
      P.r(x, B - 16 - hh, 1, hh, g.pick([ "#c8b890", "#8a7a5a", "#a89878", "#e0d0a8", "#6a6a6a" ]));
    }
    for (let k = 0; k < 8; k++) {
      let x = 8 + k * 11 + g.i(4), y = B - 18;
      for (let s = 0; s < 14 + g.i(10); s++) {
        P.p(x, y, s % 3 ? "#3a8a3a" : "#5aaa4a");
        y--;
        x += s >> 2 & 1 ? 1 : -1;
        if (y < fy + 3) break;
      }
    }
    P.poly([ [ 60, B - 17 ], [ 63, B - 30 ], [ 69, B - 30 ], [ 72, B - 17 ] ], "#8a8a90");
    P.r(65, B - 26, 3, 4, "#1a1a1e");
    if (!A.tankBare) {
      for (const [c, x, y0] of TANK.bigTank.fish) {
        const y = fy + y0;
        P.r(x, y, 4, 2, c).p(x + 1, y - 1, c).p(x + 3, y, "#1a1a1a").r(x - 2, y - 1, 2, 1, sh(c, -.2)).r(x - 2, y + 2, 2, 1, sh(c, -.2));
      }
      const [rx, ry, rc, rt] = TANK.bigTank.big;
      P.r(rx, fy + ry, 10, 5, rc).r(rx - 2, fy + ry + 1, 3, 3, rt).p(rx + 8, fy + ry + 1, "#1a1a1a");
      for (let y = fy + 2; y < B - 20; y += 3) P.p(88 + (y & 1), y, "#e8f8ff");
    }
    P.r(3, fy, 1, 28, "#1a1a1c").r(92, fy, 1, 28, "#1a1a1c").r(3, B - 17, 90, 1, "#1a1a1c");
    TANK.bigTank.glare(P, fy);
  });
  A.defPropRot && A.defPropRot("goldStatue", {
    sym: true
  });
  for (const k of [ "painting", "grandPiano", "bigTank" ]) A.defPropRot && A.defPropRot(k, {
    noRot: true
  });
  {
    const OD = "#5b6542", R = RP(OD), MT = "#6a7078", RM = RP(MT), GL = "#2c4751", RG = RP(GL), BLK = "#1a1c20";
    const WHT = "#dcd8c8", YEL = "#d8b040", RED = "#b8382e", BLU = "#34508e", SUIT = "#5e6448";
    const HW = 206, HH = 116, G = 110, NR = 12, NT = 8;
    const prof = x => {
      if (x < 38) {
        const u = 38 - x;
        return {
          yT: 54 + u * u / 46,
          yB: 94 - u * u / 80,
          D: 22 * Math.sqrt(Math.max(0, 1 - (u / 36) ** 2))
        };
      }
      if (x < 130) return {
        yT: 54,
        yB: 94,
        D: 22
      };
      if (x < 142) {
        const u = x - 130;
        return {
          yT: 54 + u * .25,
          yB: 94 - u * .92,
          D: 22 - u
        };
      }
      const u = x - 142;
      return {
        yT: 57 + u * .13,
        yB: 83 - u * .22,
        D: Math.max(4, 10 - u * .12)
      };
    };
    const PR = x => {
      const p = prof(x);
      return {
        yT: Math.round(p.yT),
        yB: Math.round(p.yB),
        D: Math.round(p.D)
      };
    };
    function crewSpr(wave) {
      return A.cached("heli:crew" + wave, 22, 36, P => {
        const B = 33, S = RP(SUIT);
        P.r(8, B - 9, 3, 9, S[2]).r(12, B - 9, 3, 9, S[1]).r(7, B - 1, 4, 2, BLK).r(12, B - 1, 4, 2, BLK);
        P.r(7, B - 21, 9, 12, S[3]).r(7, B - 21, 2, 12, S[4]).r(9, B - 19, 5, 8, "#3a4030").r(10, B - 17, 3, 1, "#59603f").r(10, B - 14, 3, 1, "#59603f");
        P.r(5, B - 20, 2, 9, S[2]).r(5, B - 11, 2, 2, BLK);
        P.r(8, B - 27, 7, 6, "#c79871").r(8, B - 23, 7, 1, "#9c7050");
        P.r(7, B - 31, 9, 5, "#4a5038").r(8, B - 32, 7, 1, "#5e6648").r(8, B - 27, 7, 2, "#20242a").p(9, B - 27, "#8ab0c8").r(15, B - 29, 1, 3, "#2a2e22");
        if (wave) {
          P.r(16, B - 22, 2, 4, S[3]).r(17, B - 27, 2, 5, S[3]).r(17, B - 30, 3, 3, BLK);
        } else {
          P.r(16, B - 21, 2, 4, S[3]).r(18, B - 24, 2, 4, S[3]).r(19, B - 27, 3, 3, BLK);
        }
      }, {
        col: A.OUTLINE.char
      });
    }
    function bodySpr(wave) {
      return A.cached("heli:body" + wave, HW, HH, P => {
        const g = new SX.Rng(968);
        P.r(36, G - 24, 118, 1, RM[4]).r(36, G - 23, 118, 1, RM[3]).r(36, G - 22, 118, 1, RM[1]).thick(36, G - 23, 30, G - 29, 2, RM[3]);
        P.poly([ [ 158, 50 ], [ 170, 50 ], [ 169, 56 ], [ 159, 56 ] ], R[3]).r(158, 50, 12, 1, R[4]);
        for (let x = 6; x <= 190; x++) {
          const {yT, yB, D} = PR(x);
          for (let y = yT - D; y < yT; y++) P.p(x, y, y === yT - 1 ? R[5] : y < yT - D + 2 ? R[3] : y < yT - D * .55 ? mix(R[3], R[4], .5) : R[4]);
          const h = Math.max(1, yB - yT);
          for (let y = yT; y <= yB; y++) {
            const t = (y - yT) / h;
            P.p(x, y, t < .06 ? R[4] : t < .5 ? R[3] : t < .8 ? mix(R[3], R[2], .5) : t < .93 ? R[2] : R[1]);
          }
        }
        P.noise(40, 34, 90, 18, [ R[5], R[3] ], .018, g);
        for (let x = 124; x < 166; x++) {
          const {yT, D} = PR(x), n = Math.max(1, Math.round((166 - x) / 9));
          for (let k = 0; k < n; k++) {
            const y = yT - D + 1 + g.i(Math.max(1, D - 2));
            P.p(x, y, g.chance(.5) ? "#2e3026" : "#3c3f30");
          }
        }
        for (let x = 11; x <= 37; x++) {
          const {yT, D} = PR(x);
          for (let y = yT - D + 2; y <= yT - 2; y++) {
            const s = (x * 2 + y) % 13;
            P.p(x, y, s < 2 ? RG[5] : s < 4 ? RG[4] : y < yT - D * .5 ? RG[3] : RG[2]);
          }
          if (x === 24 || x === 37) for (let y = yT - D + 1; y <= yT - 1; y++) P.p(x, y, R[2]);
          P.p(x, yT - D + 1, R[2]);
          P.p(x, yT - 1, R[1]);
        }
        for (let x = 13; x <= 35; x++) {
          const {yT} = PR(x);
          for (let y = yT + 2; y <= 72; y++) {
            const s = (x + y * 2) % 15;
            P.p(x, y, s < 2 ? RG[5] : s < 4 ? RG[4] : RG[3]);
          }
          P.p(x, 73, R[1]);
        }
        P.r(25, 56, 1, 17, R[2]).r(36, 54, 1, 20, R[2]);
        P.r(28, 59, 6, 4, "#4a5038").r(29, 58, 4, 1, "#5e6648").r(28, 61, 5, 2, "#20242a").p(29, 61, "#9ac0d8").r(27, 63, 8, 6, "#3e4432");
        P.p(32, 52, "#7ae07a").p(30, 52, "#e8c050").p(34, 51, "#7ae07a");
        for (let x = 13; x <= 25; x++) {
          const {yB} = PR(x);
          for (let y = 81; y <= yB - 3; y++) P.p(x, y, (x + y) % 9 < 2 ? RG[4] : RG[2]);
        }
        P.r(38, 56, 1, 37, R[1]).r(59, 56, 1, 37, R[1]).r(39, 56, 20, 1, R[4]);
        glass(P, 41, 59, 15, 11, {
          col: GL,
          gap: 7
        });
        P.r(40, 58, 17, 1, R[1]).r(40, 70, 17, 1, R[4]);
        P.r(54, 75, 3, 1, RM[4]).r(54, 76, 3, 1, RM[1]);
        box(P, 52, 24, 64, 10, 16, OD);
        P.r(54, 36, 9, 10, BLK);
        for (let y = 37; y < 46; y += 2) P.r(55, y, 7, 1, R[1]);
        for (let x = 70; x < 110; x += 5) P.r(x, 37, 2, 9, R[1]).r(x + 2, 37, 1, 9, R[4]);
        P.r(115, 30, 4, 9, R[2]).oval(121, 34, 4, 5, "#4a4640").oval(121, 34, 3, 4, "#2a2826").oval(122, 34, 2, 3, "#121110").p(119, 31, "#6a665e").p(120, 30, "#6a665e");
        P.r(78, 10, 6, 20, RM[2]).r(78, 10, 1, 20, RM[4]).r(83, 10, 1, 20, RM[1]);
        P.r(75, 18, 12, 3, RM[3]).r(75, 18, 12, 1, RM[5]).r(75, 20, 12, 1, RM[1]);
        P.r(66, 20, 30, 4, R[3]).r(66, 20, 30, 1, R[4]).r(66, 23, 30, 1, R[2]);
        P.r(60, 46, 10, 7, RM[3]).r(60, 46, 10, 1, RM[5]).r(69, 46, 1, 7, RM[1]).r(70, 48, 8, 2, RM[2]).r(77, 50, 1, 4, "#202224").r(76, 54, 3, 2, YEL);
        P.r(60, 55, 72, 1, RM[2]).r(60, 54, 72, 1, RM[4]).r(62, 93, 70, 1, RM[1]);
        P.r(64, 58, 37, 34, "#232720").r(64, 58, 37, 3, INTC).r(64, 84, 37, 8, "#2b2e28").r(64, 91, 37, 1, RM[4]);
        P.r(66, 71, 33, 3, "#4c5534").r(66, 74, 33, 6, "#59633e").r(66, 74, 33, 1, "#6c7650");
        for (let x = 68; x < 98; x += 6) P.r(x, 62, 1, 12, "#8a3a2e");
        P.r(82, 59, 3, 1, "#e8d890").p(83, 60, "#b8a860");
        P.r(96, 63, 3, 9, RED).r(96, 63, 1, 9, "#e06050").r(96, 62, 3, 1, BLK);
        P.r(105, 61, 15, 11, R[1]);
        glass(P, 106, 62, 13, 9, {
          col: GL,
          gap: 6
        });
        P.oval(124, 80, 4, 4, WHT);
        P.r(121, 77, 7, 3, RED).r(120, 79, 9, 1, RED).r(121, 81, 7, 3, BLU).r(120, 80, 9, 1, BLU).p(122, 79, RED).p(126, 81, BLU);
        for (const x of [ 62, 102, 130 ]) for (let y = 57; y < 92; y++) if (!(x === 62 && y > 56)) P.p(x, y, R[2]);
        for (let x = 104; x < 130; x += 4) P.p(x, 75, R[4]).p(x + 1, 76, R[1]);
        for (let y = 58; y < 92; y += 4) P.p(132, y, R[4]);
        for (let n = 0; n < 60; n++) {
          const x = 10 + g.i(130), {yB} = PR(x), y = yB - 1 - g.i(9), l = 1 + g.i(3);
          for (let q = 0; q < l; q++) if (PR(x + q).yB > y) P.p(x + q, y, mix(R[2], "#2a2418", .35));
        }
        scratch(P, 104, 60, 24, 30, g, 6, R[4]);
        mini(P, 148, 64, "07", WHT);
        P.r(148, 70, 7, 1, R[1]);
        for (let x = 168; x < 180; x++) {
          const {yT} = PR(x);
          for (let y = yT + 1; y < yT + 5; y++) P.p(x, y, (x + y >> 1) % 2 ? YEL : BLK);
        }
        polyf(P, [ [ 176, 66 ], [ 182, 42 ], [ 188, 22 ], [ 198, 20 ], [ 199, 26 ], [ 195, 46 ], [ 192, 70 ] ], y => y < 26 ? WHT : y < 30 ? RED : y < 52 ? R[3] : R[2]);
        P.line(182, 42, 188, 22, R[4]).line(177, 64, 182, 43, R[4]).line(196, 44, 199, 27, R[1]);
        P.r(183, 41, 7, 8, RM[3]).r(183, 41, 7, 1, RM[5]).r(189, 41, 1, 8, RM[1]);
        P.line(184, 72, 190, 80, RM[2]).line(185, 72, 191, 80, RM[4]);
        P.poly([ [ 155, 73 ], [ 171, 73 ], [ 173, 79 ], [ 152, 79 ] ], R[4]).r(152, 79, 21, 1, R[2]).r(155, 73, 16, 1, R[5]);
        P.line(132, 33, 128, 20, RM[2]).p(128, 19, RM[4]);
        P.r(38, 44, 2, 11, RM[2]).r(38, 44, 1, 11, RM[4]);
        for (let y = 46; y < 54; y += 2) P.p(40, y, RM[3]);
        P.r(1, 73, 7, 1, RM[3]).r(1, 74, 7, 1, RM[1]);
        P.r(22, 93, 8, 4, BLK).r(23, 94, 6, 2, "#c8c8b0").p(24, 94, "#fffbe8");
        P.line(110, 95, 113, 99, RM[2]);
        for (const [x0, x1] of [ [ 47, 44 ], [ 122, 125 ] ]) {
          P.thick(x0, 92, x1, G - 2, 3, RM[3]);
          P.line(x0 - 1, 92, x1 - 1, G - 2, RM[5]);
          P.line(x0 + 1, 92, x1 + 1, G - 2, RM[1]);
        }
        P.r(24, G - 2, 128, 1, RM[5]).r(24, G - 1, 128, 1, RM[3]).r(24, G, 128, 1, RM[1]).r(151, G - 2, 2, 3, RM[1]);
        P.thick(25, G - 1, 18, G - 8, 2, RM[3]);
        P.line(24, G - 2, 18, G - 8, RM[5]);
        P.r(70, G - 7, 18, 2, RM[3]).r(70, G - 7, 18, 1, RM[5]).r(72, G - 5, 2, 3, RM[2]).r(84, G - 5, 2, 3, RM[2]);
      }, {
        mat: true
      });
    }
    const INTC = "#151815";
    function doorSpr() {
      return A.cached("heli:door", 42, 40, P => {
        P.r(1, 1, 39, 37, R[3]);
        vgrad(P, 1, 1, 39, 37, R[3], R[2], .5, .95);
        P.r(1, 1, 39, 1, R[4]).r(1, 1, 1, 37, R[4]).r(39, 1, 1, 37, R[2]).r(1, 37, 39, 1, R[1]);
        P.r(7, 4, 26, 13, R[1]);
        glass(P, 8, 5, 24, 11, {
          col: GL,
          gap: 8
        });
        label(P, 1, 21, "구조", WHT, 7, 40, {
          sh: R[1]
        });
        P.r(4, 22, 2, 7, RM[3]).p(4, 22, RM[5]).r(5, 29, 1, 1, RM[1]);
        for (let y = 4; y < 36; y += 5) P.p(2, y, R[5]).p(38, y, R[1]);
        P.r(2, 33, 37, 3, YEL);
        for (let x = 2; x < 39; x += 4) P.r(x, 33, 2, 3, BLK);
      }, {
        mat: true
      });
    }
    function rotorSpr(f) {
      return A.cached("heli:rotor" + f, 238, 68, P => {
        const cx = 119, cy = 31, rx = 112, ry = 27, a0 = f / NR * Math.PI / 2, L = [];
        for (let k = 0; k < 4; k++) L.push(a0 + k * Math.PI / 2);
        L.sort((p, q) => Math.sin(p) - Math.sin(q));
        for (const a of L) {
          const c = Math.cos(a), s = Math.sin(a), cw = Math.hypot(-s * 2.6, c * 2.6 * ry / rx), w = Math.max(2, Math.round(cw * 2));
          const x0 = cx + c * 8, y0 = cy + s * 2, x1 = cx + c * rx, y1 = cy + s * ry;
          P.thick(x0, y0, x1, y1, w, "#34373c");
          P.line(x0, y0 - 1, x1, y1 - 1, "#50545a");
          P.thick(cx + c * rx * .9, cy + s * ry * .9, x1, y1, w, YEL);
        }
        P.oval(cx, cy, 8, 3, "#2a2c30").oval(cx, cy - 1, 6, 2, "#5a5e64").r(cx - 3, cy - 3, 3, 1, "#8a8e94");
        for (let k = 0; k < 4; k++) {
          const a = a0 + k * Math.PI / 2;
          P.p(cx + Math.cos(a) * 5, cy + Math.sin(a) * 2 - 1, "#9aa0a6");
        }
      }, {
        mat: true
      });
    }
    function blurSpr(f) {
      return A.cached("heli:blur" + f, 238, 68, P => {
        const cx = 119, cy = 31;
        for (const [rx, ry, col, st, on] of [ [ 112, 27, "#9a9ea4", 6, 3 ], [ 104, 25, "#72767c", 8, 3 ], [ 80, 19, "#62666c", 10, 2 ] ]) {
          const n = Math.round((rx + ry) * 3.4);
          for (let i = 0; i < n; i++) {
            if ((i + f * 2) % st >= on) continue;
            const a = i / n * Math.PI * 2;
            P.p(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, col);
          }
        }
      });
    }
    function tailSpr(f) {
      return A.cached("heli:tail" + f, 34, 34, P => {
        const cx = 17, cy = 17, r = 14, a0 = f / NT * Math.PI;
        for (let i = 0; i < 40; i++) {
          if ((i + f) % 4 >= 2) continue;
          const a = i / 40 * Math.PI * 2;
          P.p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, "#8a8e94");
        }
        for (let k = 0; k < 2; k++) {
          const a = a0 + k * Math.PI, x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r;
          P.thick(cx, cy, x1, y1, 3, "#34373c");
          P.thick(cx + Math.cos(a) * r * .75, cy + Math.sin(a) * r * .75, x1, y1, 3, k ? RED : WHT);
        }
        P.oval(cx, cy, 2, 2, "#5a5e64").p(cx - 1, cy - 1, "#9aa0a6");
      }, {
        mat: true
      });
    }
    A.heli = {
      W: HW,
      H: HH,
      G,
      NR,
      NT,
      hub: [ 81, 10 ],
      rotorHub: [ 119, 31 ],
      tailHub: [ 186, 45 ],
      tailC: 17,
      doorAt: {
        x: 62,
        y: 55,
        slide: 28
      },
      lights: {
        top: [ 108, 22 ],
        belly: [ 92, 96 ],
        tail: [ 198, 20 ],
        nav: [ 152, 78 ],
        search: [ 25, 95 ]
      },
      body: bodySpr,
      door: doorSpr,
      rotor: rotorSpr,
      blur: blurSpr,
      tail: tailSpr
    };
  }
  {
    const TSZ = SX.TS, GLY = {
      N: "110101101101101",
      E: "111100110100111",
      W: "101101111111101",
      S: "011100010001110"
    }, Q = {};
    for (const [k, v] of Object.entries({
      f0: "#45574a",
      f1: "#3d4e42",
      f2: "#4f6253",
      f3: "#5a6b5b",
      fs: "#33423a",
      fp: "#4b5f50",
      w0: "#d8d5c8",
      w1: "#c9c6b8",
      w2: "#b5b3a6",
      w3: "#e4e1d4",
      oW: "#a19d8d",
      oW2: "#8d897a",
      oF: "#334038",
      oF2: "#2b352f",
      oR: "#4b4d50",
      oR2: "#424447",
      cW: "#858278",
      cF: "#29332c",
      cR: "#3c3e42",
      sD: "#2f3432",
      sL: "#7c7f78",
      ru: "#7a5638",
      ru2: "#8e6845",
      mD: "#2b2e30",
      mM: "#7e8386",
      mH: "#b2b6b6",
      hR: "#585c60",
      hL: "#3a4640",
      hH: "#6a7a6e",
      d1: "#2f3430",
      d2: "#6e6e66",
      d3: "#5a5034",
      d4: "#8a8a80"
    })) Q[k] = parseInt(v.slice(1), 16);
    let padC = null, padK = "";
    A.heliPad = function(pad) {
      const key = [ pad.x, pad.y, pad.w, pad.h ].join(":");
      if (padC && padK === key) return padC;
      const W = pad.w * TSZ, H = pad.h * TSZ, cx = W / 2, cy = H / 2, s = Math.min(W, H) / 192, S = v => Math.round(v * s);
      const sd = (Math.imul(pad.x + 7, 73856093) ^ Math.imul(pad.y + 3, 19349663)) >>> 0, g = new SX.Rng(sd % 2147483646 + 1);
      const hh = (i, j, o) => {
        let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(o + 1, 1274126177) + sd | 0;
        n = Math.imul(n ^ n >>> 13, 1103515245);
        n ^= n >>> 16;
        return (n >>> 0) / 4294967296;
      };
      const vn = (x, y, z, o) => {
        const X = Math.floor(x / z), Y = Math.floor(y / z);
        let u = x / z - X, v = y / z - Y;
        u = u * u * (3 - 2 * u);
        v = v * v * (3 - 2 * v);
        const a = hh(X, Y, o), b = hh(X + 1, Y, o), c = hh(X, Y + 1, o), d = hh(X + 1, Y + 1, o);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
      };
      const N = W * H, C = new Int32Array(N).fill(-1), Ly = new Uint8Array(N);
      const put = (x, y, c, ly) => {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const i = y * W + x;
        C[i] = c;
        if (ly != null) Ly[i] = ly;
      };
      const by = (x, y, cW, cF, cR) => {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const l = Ly[y * W + x];
        put(x, y, l === 2 ? cW : l === 1 ? cF : cR);
      };
      const e0 = S(6), e1 = S(10), rI = 67 * s, rO = 79 * s, hX0 = 22 * s, hX1 = 32 * s, hY = 44 * s, hB = 5 * s;
      const skid = (ax, ay) => ax > -67 * s && ax < 51 * s && (Math.abs(ay - 12 * s) < 4 * s || Math.abs(ay + 12 * s) < 4 * s);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dE = Math.min(x, y, W - 1 - x, H - 1 - y);
        if (dE < 2) continue;
        const i = y * W + x, ax = x + .5 - cx, ay = y + .5 - cy, r = Math.hypot(ax, ay);
        const eK = dE < 18 ? (18 - dE) / 18 : 0, np = vn(x, y, 22, 1) * .65 + vn(x, y, 7, 2) * .35;
        if (np > .8 - eK * .17 || dE < 4 && hh(x, y, 3) < .3) continue;
        const n2 = vn(x, y, 13, 4), q = hh(x, y, 5);
        let c = n2 < .28 ? Q.f1 : n2 > .86 ? Q.f3 : n2 > .72 ? Q.f2 : Q.f0;
        if (q < .025) c = Q.fs; else if (q > .985) c = Q.f3;
        C[i] = c;
        Ly[i] = 1;
        const isW = dE >= e0 && dE < e1 || r >= rI && r < rO || Math.abs(ay) < hY && Math.abs(ax) >= hX0 && Math.abs(ax) < hX1 || Math.abs(ay) < hB && Math.abs(ax) < hX0;
        if (!isW) continue;
        const nw = vn(x, y, 9, 6) * .6 + vn(x, y, 3.5, 7) * .4, thr = .75 - (r < 50 * s ? .05 : 0) - (skid(ax, ay) ? .12 : 0);
        if (nw > thr) continue;
        const n3 = vn(x, y, 17, 8), p = hh(x, y, 9);
        C[i] = p < .012 ? Q.f0 : p < .035 ? Q.w2 : nw > thr - .07 ? Q.w2 : n3 < .3 ? Q.w1 : n3 > .8 ? Q.w3 : Q.w0;
        Ly[i] = 2;
      }
      {
        const pw = S(18) + g.i(S(10)), ph = S(10) + g.i(S(8)), px0 = g.chance(.5) ? S(14) + g.i(S(16)) : W - S(14) - pw - g.i(S(16)), py0 = S(40) + g.i(Math.max(1, H - S(80) - ph));
        for (let y = py0; y < py0 + ph; y++) for (let x = px0; x < px0 + pw; x++) {
          const i = y * W + x;
          if (Ly[i] !== 2) {
            C[i] = hh(x, y, 11) < .04 ? Q.f1 : Q.fp;
            Ly[i] = 1;
          }
        }
      }
      {
        const ox = cx + S(g.i(100) - 50), oy = cy + S(g.i(100) - 50), rx = S(12) + g.i(S(8)), ry = Math.round(rx * .6);
        for (let k = 0; k < 90; k++) {
          const a = k / 90 * 6.2832, x = Math.round(ox + Math.cos(a) * rx), y = Math.round(oy + Math.sin(a) * ry);
          if (x >= 0 && y >= 0 && x < W && y < H && Ly[y * W + x] === 1 && hh(x, y, 15) > .2) put(x, y, Q.f3);
        }
      }
      for (const yb of [ -12, 12, -15, 15 ]) {
        const n = Math.abs(yb) === 12 ? 26 : 10;
        for (let k = 0; k < n; k++) {
          const x0 = cx + S(-67) + g.i(S(118)), len = S(3) + g.i(S(10)), y0 = cy + S(yb) + g.i(5) - 2, dk = g.chance(.7);
          for (let j = 0; j < len; j++) if (g.chance(.85)) put(x0 + j, y0 + (j > len * .6 && g.chance(.2) ? 1 : 0), dk ? Q.sD : Q.sL);
        }
      }
      for (let k = 0, n = 3 + g.i(2); k < n; k++) {
        const ox = cx + S(g.i(90) - 45), oy = cy + S(g.i(56) - 28), rx = S(4) + g.i(S(7)), ry = Math.max(2, Math.round(rx * (.5 + g.f() * .25)));
        for (let y = -ry - 2; y <= ry + 2; y++) for (let x = -rx - 2; x <= rx + 2; x++) {
          const e = x * x / (rx * rx) + y * y / (ry * ry) + (hh(ox + x, oy + y, 12) - .5) * .6;
          if (e < 1) by(ox + x, oy + y, e < .4 ? Q.oW2 : Q.oW, e < .4 ? Q.oF2 : Q.oF, e < .4 ? Q.oR2 : Q.oR);
        }
      }
      for (let k = 0, n = 4 + g.i(2); k < n; k++) {
        let x = S(4) + g.i(W - S(8)), y = S(4) + g.i(H - S(8)), a = g.f() * 6.2832;
        const len = S(36) + g.i(S(70));
        for (let j = 0; j < len; j++) {
          by(x, y, Q.cW, Q.cF, Q.cR);
          a += (g.f() - .5) * .7;
          x += Math.cos(a);
          y += Math.sin(a);
          if (j === len >> 1 && g.chance(.6)) {
            let bx = x, bq = y, ba = a + (g.chance(.5) ? 1 : -1) * (.6 + g.f() * .6);
            for (let t = 0, m = S(8) + g.i(S(10)); t < m; t++) {
              by(bx, bq, Q.cW, Q.cF, Q.cR);
              ba += (g.f() - .5) * .8;
              bx += Math.cos(ba);
              bq += Math.sin(ba);
            }
          }
        }
      }
      const tie = (tx, ty) => {
        tx = Math.round(tx);
        ty = Math.round(ty);
        for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) + Math.abs(y) < 4) put(tx + x, ty + y, Q.mD);
        for (const [x, y] of [ [ -1, -1 ], [ 0, -1 ], [ 1, -1 ], [ -1, 0 ], [ 1, 0 ], [ -1, 1 ], [ 0, 1 ], [ 1, 1 ] ]) put(tx + x, ty + y, Q.mM);
        put(tx - 1, ty - 1, Q.mH);
        put(tx, ty - 1, Q.mH);
        for (let j = 3, m = 3 + g.i(4); j < 3 + m; j++) put(tx + (j > 4 && g.chance(.4) ? 1 : 0), ty + j, j % 2 ? Q.ru : Q.ru2);
        put(tx + 2, ty + 2, Q.ru2);
      };
      tie(cx + 62 * s, cy - 62 * s);
      tie(cx - 62 * s, cy + 62 * s);
      tie(cx + 62 * s, cy + 62 * s);
      {
        const tx0 = S(15), ty0 = S(15), z = Math.max(1, S(2));
        let k = 0;
        for (const ch of "NEWS") {
          const gl = GLY[ch];
          for (let j = 0; j < 5; j++) for (let i2 = 0; i2 < 3; i2++) if (gl[j * 3 + i2] === "1") for (let v = 0; v < z; v++) for (let u = 0; u < z; u++) {
            const X = tx0 + k * 4 * z + i2 * z + u, Y = ty0 + j * z + v;
            if (Ly[Y * W + X] && hh(X, Y, 13) > .14) put(X, Y, hh(X, Y, 14) < .3 ? Q.w2 : Q.w1, 2);
          }
          k++;
        }
      }
      for (let k = 0; k < 100; k++) {
        const x = S(3) + g.i(W - S(6)), y = S(3) + g.i(H - S(6)), c = [ Q.d1, Q.d2, Q.d2, Q.d3, Q.d4 ][g.i(5)];
        put(x, y, c);
        if (g.chance(.25)) put(x + 1, y, c);
      }
      const LT = [ [ S(7), S(7) ], [ cx - 1, S(7) ], [ W - S(9), S(7) ], [ S(7), cy - 1 ], [ W - S(9), cy - 1 ], [ S(7), H - S(9) ], [ cx - 1, H - S(9) ], [ W - S(9), H - S(9) ] ];
      for (const [lx, ly] of LT) {
        for (let y = -1; y <= 2; y++) for (let x = -1; x <= 2; x++) put(lx + x, ly + y, Q.hR, 2);
        put(lx, ly, Q.hH);
        put(lx + 1, ly, Q.hL);
        put(lx, ly + 1, Q.hL);
        put(lx + 1, ly + 1, Q.hL);
      }
      const c = A.mk(W, H), x2 = c.getContext("2d"), img = x2.createImageData(W, H), D = img.data;
      for (let i = 0; i < N; i++) {
        const v = C[i];
        if (v < 0) continue;
        D[i * 4] = v >> 16 & 255;
        D[i * 4 + 1] = v >> 8 & 255;
        D[i * 4 + 2] = v & 255;
        D[i * 4 + 3] = 255;
      }
      x2.putImageData(img, 0, 0);
      c.lights = LT.map(([a, b]) => [ Math.round(a), Math.round(b) ]);
      padC = c;
      padK = key;
      return c;
    };
  }
})(window.SX);
