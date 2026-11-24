"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, sh = A.shade, mix = A.mix;
  const IC = A.ICON = 32;
  const LX = -.55, LY = -.65, LZ = .52;
  const COOL = [ 26, 32, 48 ], WARM = [ 255, 244, 216 ];
  const LVK = [ [ -.62, .25 ], [ -.42, .15 ], [ -.2, .06 ], [ 0, 0 ], [ .16, .1 ], [ .34, .2 ], [ .55, .3 ] ];
  function lvRgb(d, k, s) {
    const q = LVK[Math.max(-3, Math.min(3, Math.round(s))) + 3], M = q[0] < 0 ? COOL : WARM;
    for (let c = 0; c < 3; c++) {
      const v = q[0] < 0 ? d[k + c] * (1 + q[0]) : d[k + c] + (255 - d[k + c]) * q[0];
      d[k + c] = v + (M[c] - v) * q[1];
    }
  }
  function relight(P, f, x, y, w, h) {
    const cw = P.x.canvas.width, ch = P.x.canvas.height;
    x = x || 0;
    y = y || 0;
    w = Math.min(cw - x, w || cw);
    h = Math.min(ch - y, h || ch);
    const img = P.x.getImageData(x, y, w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4;
      if (d[k + 3] < 8) continue;
      const s = f(x + i, y + j);
      if (s) lvRgb(d, k, s);
    }
    P.x.putImageData(img, x, y);
    return P;
  }
  function bevel(P, up, dn) {
    const W = P.x.canvas.width, H = P.x.canvas.height, img = P.x.getImageData(0, 0, W, H), d = img.data, src = new Uint8ClampedArray(d);
    const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] > 100;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!a(x, y)) continue;
      const l = !a(x - 1, y) || !a(x, y - 1), r = !a(x + 1, y) || !a(x, y + 1);
      if (l && !r && up) lvRgb(d, (y * W + x) * 4, up); else if (r && !l && dn) lvRgb(d, (y * W + x) * 4, dn);
    }
    P.x.putImageData(img, 0, 0);
  }
  const pen = (W, H) => new A.Pen(A.mk(W, H).getContext("2d", {
    willReadFrequently: true
  }));
  function layer(P, fn, o) {
    o = o || {};
    const W = P.x.canvas.width, H = P.x.canvas.height, Q = pen(W, H);
    fn(Q);
    if (o.lit) relight(Q, o.lit);
    if (o.bevel) bevel(Q, o.bevel[0], o.bevel[1]);
    const cs = o.cast == null ? -2 : o.cast;
    if (cs) {
      const m = Q.x.getImageData(0, 0, W, H).data, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy;
      const hit = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[(y * W + x) * 4 + 3] > 100;
      relight(P, (x, y) => !hit(x, y) && (hit(x - sx, y - sy) || sx > 1 && hit(x - sx + 1, y - sy) || sy > 1 && hit(x - sx, y - sy + 1)) ? cs : 0);
    }
    P.x.drawImage(Q.x.canvas, 0, 0);
    return Q;
  }
  const litLv = (nx, ny, nz) => {
    const d = nx * LX + ny * LY + nz * LZ;
    return d > .88 ? 2 : d > .66 ? 1 : d > .4 ? 0 : d > .14 ? -1 : d > -.14 ? -2 : -3;
  };
  const cylLv = (t, sp) => t < .1 ? 0 : t < .24 ? 1 : t < .36 ? sp ? 2 : 1 : t < .6 ? 0 : t < .8 ? -1 : t < .93 ? -2 : sp ? -1 : -2;
  const vcylF = (x, w, sp) => px => cylLv((px + .5 - x) / w, sp);
  const hcylF = (y, h, sp) => (px, py) => cylLv((py + .5 - y) / h, sp);
  const ballF = (cx, cy, rx, ry) => (px, py) => {
    const nx = (px + .5 - cx) / rx, ny = (py + .5 - cy) / (ry || rx), q = Math.min(1, nx * nx + ny * ny);
    return litLv(nx, ny, Math.sqrt(1 - q));
  };
  const pillowF = (x, y, w, h, p) => (px, py) => {
    let u = (px + .5 - x) / w * 2 - 1, v = (py + .5 - y) / h * 2 - 1;
    u = Math.sign(u) * Math.pow(Math.min(1, Math.abs(u)), p || 3);
    v = Math.sign(v) * Math.pow(Math.min(1, Math.abs(v)), p || 3);
    const l = Math.hypot(u, v, 1);
    return litLv(u / l, v / l, 1 / l);
  };
  function rodGeo(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    let nx = -uy, ny = ux;
    if (nx * .6 + ny * .8 < 0) {
      nx = -nx;
      ny = -ny;
    }
    return {
      L,
      f: (x, y) => {
        const px = x + .5 - x0, py = y + .5 - y0;
        return [ px * ux + py * uy, px * nx + py * ny ];
      }
    };
  }
  function rod(P, x0, y0, x1, y1, hw, fn) {
    const g = rodGeo(x0, y0, x1, y1);
    const xa = Math.floor(Math.min(x0, x1) - hw - 2), xb = Math.ceil(Math.max(x0, x1) + hw + 2), ya = Math.floor(Math.min(y0, y1) - hw - 2), yb = Math.ceil(Math.max(y0, y1) + hw + 2);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const [l, d] = g.f(x, y);
      if (Math.abs(d) > hw + 1) continue;
      const c = fn(l, d, g.L);
      if (c) P.p(x, y, c);
    }
    return P;
  }
  const rodLit = (x0, y0, x1, y1, rf, sp) => {
    const g = rodGeo(x0, y0, x1, y1);
    return (x, y) => {
      const [l, d] = g.f(x, y), r = typeof rf === "function" ? rf(l) : rf;
      return cylLv((d / r + 1) / 2, sp);
    };
  };
  function tubeRing(P, cx, cy, rx, ry, th, col, a0, a1, sp) {
    const R = RP(col), hw = th / 2;
    for (let y = Math.floor(cy - ry - hw - 1); y <= cy + ry + hw + 1; y++) for (let x = Math.floor(cx - rx - hw - 1); x <= cx + rx + hw + 1; x++) {
      const px = x + .5 - cx, py = y + .5 - cy;
      let a = Math.atan2(py / ry, px / rx);
      if (a < a0) a += Math.PI * 2;
      if (a > a1) continue;
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry, nl = Math.hypot(ex / (rx * rx), ey / (ry * ry)), gx = ex / (rx * rx) / nl, gy = ey / (ry * ry) / nl;
      const s = (px - ex) * gx + (py - ey) * gy;
      if (Math.abs(s) > hw) continue;
      const q = s / hw, lv = litLv(gx * q, gy * q, Math.sqrt(Math.max(0, 1 - q * q)));
      P.p(x, y, R[Math.max(0, Math.min(5, 3 + lv + (sp && lv >= 1 ? 1 : 0)))]);
    }
  }
  function blob(P, cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const c = fn(nx, ny, x, y);
      if (c) P.p(x, y, c);
    }
    return P;
  }
  const disc = (P, cx, cy, rx, ry, c) => blob(P, cx, cy, rx, ry, () => c);
  function rrect(P, x, y, w, h, r, c) {
    for (let k = 0; k < h; k++) {
      const e = k < r ? r - k - .5 : k >= h - r ? k - (h - r) + .5 : -1;
      const i = e < 0 ? 0 : Math.round(r - Math.sqrt(Math.max(0, r * r - e * e)));
      P.r(x + i, y + k, w - 2 * i, 1, c);
    }
    return P;
  }
  function obox(P, x, y, w, h, dx, dy, col, o) {
    o = o || {};
    const R = RP(col);
    P.poly([ [ x, y ], [ x + dx, y - dy ], [ x + w + dx, y - dy ], [ x + w, y ] ], o.top || R[4]);
    if (dx > 0) P.poly([ [ x + w, y ], [ x + w + dx, y - dy ], [ x + w + dx, y + h - dy ], [ x + w, y + h ] ], o.side || R[1]);
    P.r(x, y, w, h, o.front || R[2]);
    P.r(x, y, w, 1, R[5]).r(x, y, 1, h, o.front ? sh(o.front, .12) : R[3]);
    return P;
  }
  const CONS = [ "111001001", "100100111", "111100111", "111101111", "010101101", "010101010", "111010101", "110011110" ];
  function hg(P, x, y, c, seed) {
    const k = Math.abs(seed | 0), cs = CONS[k % 8], v = ((k >> 3) + k) % 3;
    if (v < 2) {
      for (let i = 0; i < 9; i++) if (cs[i] === "1") P.p(x + i % 3, y + (i / 3 | 0) + 1, c);
      P.r(x + 4, y, 1, 5, c);
      if (v === 0) P.p(x + 5, y + 2, c);
    } else {
      for (let i = 0; i < 9; i++) if (cs[i] === "1") P.p(x + 1 + i % 3, y + (i / 3 | 0), c);
      P.r(x, y + 4, 5, 1, c);
    }
    return P;
  }
  const hgs = (P, x, y, c, str) => {
    A.PP.label(P, x, y - 1, str, c, 7);
    return P;
  };
  function txt(P, x, y, w, c, seed) {
    const g = new SX.Rng(seed || 7);
    let i = 0;
    while (i < w) {
      const n = Math.min(w - i, 1 + g.i(3));
      P.r(x + i, y, n, 1, c);
      i += n + 1;
    }
    return P;
  }
  const glint = (P, x, y, c) => P.p(x, y, c || "#fffaf0");
  const star = (P, x, y, c) => {
    c = c || "#fffaf0";
    P.p(x, y, c).p(x - 1, y, mix(c, "#000000", .25)).p(x + 1, y, mix(c, "#000000", .25)).p(x, y - 1, mix(c, "#000000", .25)).p(x, y + 1, mix(c, "#000000", .25));
  };
  const D = {};
  const def = (name, w, h, fn) => {
    for (const n of [].concat(name)) D[n] = {
      w,
      h,
      fn
    };
  };
  def("볼펜", 1, 1, P => {
    const x0 = 4, y0 = 28, x1 = 28.5, y1 = 3.5, rf = l => l < 4 ? .8 + l * .38 : 2.3;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 4, (l, d, L) => {
      const r = rf(l);
      if (l >= 0 && l <= L && Math.abs(d) <= r) return l < 1.3 ? "#1e2a60" : l < 4 ? "#b4bac2" : l < 9 ? (l | 0) % 2 ? "#3c5cb4" : "#2c4494" : l < L - 5 ? "#e4e2da" : "#3c5cb4";
      if (l > L - 14 && l < L - 2 && d < -r && d > -r - 1.4) return "#5a78c8";
      return null;
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    rod(P, x0, y0, x1, y1, 4, (l, d, L) => l > 11 && l < 16 && d > -.6 && d < .6 ? "#9aa0b0" : null);
  });
  def("칫솔", 1, 1, P => {
    const x0 = 3.5, y0 = 28.5, x1 = 27.5, y1 = 4.5, rf = l => l < 17 ? 2.5 : l < 22 ? 2.5 - (l - 17) * .24 : l < 24.5 ? 1.3 : 2.1;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 4, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= rf(l) ? l > 3 && l < 13 && d > -1.2 ? "#e8f0f0" : "#3a9ab8" : null), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    layer(P, Q => rod(Q, x0, y0, x1, y1, 7, (l, d, L) => l > 24.5 && l < L - .6 && d < -1.8 && d > -6.4 ? (l | 0) % 2 ? d < -5.2 ? "#ffffff" : "#d0dce2" : d < -5.2 ? "#9adcf0" : "#4aa8cc" : null), {
      cast: -1
    });
  });
  def("머리빗", 1, 1, P => {
    const c = "#b0703e";
    layer(P, Q => {
      Q.r(4, 7, 24, 7, c).r(3, 8, 26, 5, c);
      for (let x = 4; x < 28; x += 2) Q.r(x, 14, 1, x < 12 ? 13 : 11, c);
      const g = new SX.Rng(9);
      for (let k = 0; k < 22; k++) Q.r(4 + g.i(23), 8 + g.i(5), 1 + g.i(3), 1, g.chance(.55) ? "#6e3c1c" : "#d49a58");
    }, {
      lit: (x, y) => y < 8 ? 2 : y < 10 ? 1 : y === 13 ? -1 : y > 13 ? y > 22 ? -1 : 0 : 0,
      bevel: [ 1, -1 ],
      cast: 0
    });
    P.r(6, 7, 14, 1, "#f4d4a0");
  });
  def("고체 풀", 1, 1, P => {
    layer(P, Q => {
      disc(Q, 26, 14, 4, 1.6, "#d8342c");
      Q.r(22, 14, 9, 15, "#d8342c");
      disc(Q, 26, 28.6, 4.5, 1.4, "#d8342c");
      Q.r(22, 19, 9, 1, "#9a2018");
    }, {
      lit: vcylF(22, 9, true),
      cast: 0
    });
    P.oval(26, 14, 3, 1, "#f06a5a");
    layer(P, Q => {
      Q.r(5, 11, 13, 16, "#e8e4d8");
      disc(Q, 11, 27, 6.5, 1.8, "#e8e4d8");
      Q.r(5, 14, 13, 8, "#e8b830");
      hgs(Q, 8, 15, "#2a4a9a", "풀");
      Q.r(5, 23, 13, 1, "#b8b4a8");
      Q.r(5, 25, 13, 3, "#c8c4b8");
    }, {
      lit: vcylF(5, 13, true)
    });
    layer(P, Q => {
      Q.r(7, 6, 9, 6, "#f4f6f8");
      disc(Q, 11, 6, 4.5, 2, "#f4f6f8");
      Q.r(6, 11, 11, 1, "#c8ccd0");
    }, {
      lit: vcylF(6.5, 10),
      cast: 0
    });
    P.r(8, 5, 3, 1, "#ffffff").p(8, 6, "#ffffff");
  });
  def("고무줄 뭉치", 1, 1, P => {
    const cols = [ "#c84a3a", "#e0b040", "#4a9a5a", "#3a6ab8", "#d87a30", "#c86a9a", "#8a5ab0", "#c84a3a" ];
    const g = new SX.Rng(3), planes = cols.map(() => {
      const a = g.f() * Math.PI, b = (g.f() - .5) * 2.4;
      return [ Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b) ];
    });
    blob(P, 16, 16, 12.5, 12.5, (nx, ny) => {
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let col = "#a0784a";
      for (let k = 0; k < planes.length; k++) {
        const p = planes[k];
        if (Math.abs(nx * p[0] + ny * p[1] + nz * p[2]) < .12) col = cols[k];
      }
      const R = RP(col);
      return R[Math.max(0, Math.min(5, 3 + litLv(nx, ny, nz)))];
    });
    tubeRing(P, 26, 25, 3.5, 2.5, 1.4, "#c84a3a", -1.2, 3.4);
    glint(P, 11, 9);
    glint(P, 12, 9);
    glint(P, 11, 10);
  });
  def("손거울", 1, 1, P => {
    const fr = "#d88a9a";
    layer(P, Q => rod(Q, 13, 20, 4, 29, 3, (l, d, L) => l > 0 && l < L && Math.abs(d) <= (l > L - 2.5 ? 2.4 : 1.9) ? fr : null), {
      lit: rodLit(13, 20, 4, 29, 2, true),
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 18.5, 13, 11, 11, fr);
    }, {
      lit: ballF(18.5, 13, 11, 11),
      cast: 0
    });
    blob(P, 18.5, 13, 8.5, 8.5, (nx, ny) => {
      const t = nx + ny;
      return t < -.9 ? "#dcecf0" : Math.abs(t + .1) < .18 || Math.abs(t - .35) < .08 ? "#f4fcff" : t < .5 ? "#9ec0cc" : t < 1 ? "#7aa0b0" : "#5a8090";
    });
    tubeRing(P, 18.5, 13, 9, 9, 1.2, "#b86a7a", -Math.PI, Math.PI);
    glint(P, 10, 5, "#ffffff");
    glint(P, 11, 4, "#ffe8ee");
  });
  def("손톱깎이", 1, 1, P => {
    const R = RP("#aab2ba");
    tubeRing(P, 6, 26, 3.2, 3.2, 1.3, "#b8c0c8", -Math.PI, Math.PI, true);
    P.r(3, 16, 3, 6, R[3]).p(3, 16, R[5]).r(3, 21, 3, 1, R[1]);
    P.r(4, 16, 22, 1, R[5]).r(4, 17, 22, 1, R[2]);
    P.p(26, 17, R[5]).p(26, 18, R[2]).r(27, 18, 2, 1, R[4]).p(29, 18, R[3]);
    P.r(4, 20, 22, 1, R[4]).r(4, 21, 22, 1, R[1]);
    P.p(26, 19, R[4]).p(27, 19, R[3]).p(28, 19, R[2]).p(26, 20, R[1]);
    P.r(21, 13, 2, 8, R[2]).p(21, 13, R[4]).r(21, 18, 2, 2, R[1]);
    P.p(4, 18, "#1a1c20");
    for (let x = 2; x < 25; x++) {
      const t = Math.round(7 + (x - 2) * 5 / 22), e = x === 2 ? 1 : 0;
      P.r(x, t + e, 1, 1, R[5]).r(x, t + 1, 1, 1, R[4]).r(x, t + 2 - e, 1, 1, R[2]).r(x, t + 3 - e, 1, 1, R[1]);
    }
    P.r(5, 9, 4, 1, R[3]).r(6, 8, 2, 1, R[4]);
    P.r(20, 10, 4, 1, R[5]).r(20, 11, 4, 1, R[3]).r(20, 12, 4, 1, R[1]);
    P.p(20, 10, "#ffffff");
    glint(P, 13, 9);
    glint(P, 12, 9, "#e8eef4");
    glint(P, 29, 19, "#ffffff");
  });
  def("일회용 면도기", 1, 1, P => {
    const hx0 = 4.5, hy0 = 28.5, hx1 = 21.5, hy1 = 11.5, rf = l => l < 13 ? 2.4 : 2.4 - (l - 13) * .18;
    layer(P, Q => rod(Q, hx0, hy0, hx1, hy1, 3, (l, d, L) => l > 0 && l < L + .5 && Math.abs(d) <= rf(l) ? l > 4 && l < 11 ? (l | 0) % 2 ? "#e8e8e0" : "#c8c8c0" : "#2f68c0" : null), {
      lit: rodLit(hx0, hy0, hx1, hy1, rf, true),
      cast: 0
    });
    const ax = 19.5, ay = 4.5, bx = 29, by = 14;
    layer(P, Q => rod(Q, ax, ay, bx, by, 4, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > 3) return null;
      if (d < -1.9) return "#6ac088";
      return d > -1.2 && d < -.4 || d > .5 && d < 1.3 ? "#e4eaf0" : "#2a5aa8";
    }), {
      lit: (x, y) => rodGeo(ax, ay, bx, by).f(x, y)[1] > 2 ? -2 : 0
    });
    glint(P, 21, 6, "#ffffff");
  });
  def("리모컨", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 9, 2, 14, 28, 3, "#3a3d44");
      Q.r(11, 3, 10, 2, "#1a1216");
      Q.r(11, 6, 3, 2, "#d8403a");
      Q.r(18, 6, 3, 2, "#8a8e96");
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) Q.r(11 + k * 4, 10 + r * 2, 2, 1, "#aeb2ba");
      disc(Q, 16, 21, 3.6, 3.6, "#5a5e66");
      disc(Q, 16, 21, 1.6, 1.6, "#9aa0a8");
      const cc = [ "#d04a40", "#4aa860", "#e0c040", "#4a7ad0" ];
      for (let k = 0; k < 4; k++) Q.r(11 + k * 3, 26, 2, 2, cc[k]);
    }, {
      lit: vcylF(9, 14, true),
      bevel: [ 1, -2 ],
      cast: 0
    });
    glint(P, 11, 3, "#8a6a70");
    glint(P, 12, 3, "#6a4a50");
  });
  def("시디 케이스", 1, 1, P => {
    const cx = 21, cy = 11;
    blob(P, cx, cy, 9.5, 9.5, (nx, ny) => {
      const r = Math.hypot(nx, ny);
      if (r < .14) return null;
      if (r < .36) return r < .2 ? "#8a9098" : "#c8d0d8";
      const a = Math.atan2(ny, nx), hue = [ "#e8b0c8", "#f0e0a8", "#b8e8c0", "#a8d0f0", "#c8b0f0", "#e8b0c8" ];
      const k = ((a / Math.PI + 1) * 2.5 + r * 2) % 5;
      const base = r > .93 ? "#9aa2ac" : "#d4dae2";
      return Math.abs(r - .66) < .16 ? hue[k | 0] : (k | 0) % 2 ? base : mix(base, "#ffffff", .35);
    });
    layer(P, Q => {
      Q.r(3, 9, 21, 20, "#2a2c34");
      Q.r(6, 10, 17, 18, "#6a4a9a");
      Q.r(6, 10, 17, 6, "#8a5ab0");
      disc(Q, 17, 21, 4, 4, "#e8a040");
      disc(Q, 17, 21, 2, 2, "#f4d070");
      hgs(Q, 7, 11, "#f0e8f8", "늦별");
      Q.r(3, 9, 3, 20, "#1a1c22");
      Q.r(4, 10, 1, 18, "#4a4e58");
    }, {
      bevel: [ 2, -2 ]
    });
    for (let k = 0; k < 7; k++) P.p(21 - k, 11 + k * 2, "#e8ecf4").p(22 - k, 11 + k * 2, "#bcc4d4");
  });
  def("재떨이", 1, 1, P => {
    const gl = "#6a9aa0";
    layer(P, Q => {
      disc(Q, 16, 20, 13, 8, sh(gl, -.25));
      Q.r(3, 16, 27, 4, sh(gl, -.25));
      disc(Q, 16, 15.5, 13.5, 7.5, gl);
    }, {
      lit: (x, y) => y > 22 ? -2 : y > 19 ? -1 : 0,
      cast: 0
    });
    blob(P, 16, 15.5, 13.5, 7.5, (nx, ny) => nx * nx + ny * ny > .72 ? ny < -.2 || nx < -.6 ? "#b8dcdc" : "#5a8a92" : null);
    disc(P, 16, 16, 9, 4.5, "#3e5c62");
    disc(P, 16, 16.5, 7, 3, "#6a7070");
    const g = new SX.Rng(4);
    for (let k = 0; k < 16; k++) P.p(10 + g.i(12), 14 + g.i(5), g.pick([ "#8a8e8e", "#a0a4a4", "#5a5e5e" ]));
    P.r(9, 16, 6, 2, "#e8e4d8").r(9, 16, 2, 2, "#d8903a").r(9, 17, 6, 1, "#b8b4a8");
    P.r(17, 14, 5, 2, "#e8e4d8").r(20, 14, 2, 2, "#d8903a").r(17, 15, 5, 1, "#b8b4a8").p(16, 15, "#4a4a4a");
    for (const [x, y] of [ [ 3, 15 ], [ 29, 15 ], [ 16, 8 ] ]) P.r(x - 1, y, 2, 2, "#2e4a50");
    glint(P, 6, 12, "#ffffff");
    glint(P, 7, 11, "#ffffff");
    glint(P, 5, 20, "#c8ecec");
  });
  def("플라스틱 옷걸이", 1, 1, P => {
    const c = "#6aa4d0";
    layer(P, Q => {
      rod(Q, 16, 11, 3, 24, 2, (l, d, L) => l > -1 && l < L + 1 && Math.abs(d) <= 1.6 ? c : null);
      rod(Q, 16, 11, 29, 24, 2, (l, d, L) => l > -1 && l < L + 1 && Math.abs(d) <= 1.6 ? c : null);
    }, {
      lit: (x, y) => {
        const a = rodGeo(16, 11, 3, 24).f(x, y), b = rodGeo(16, 11, 29, 24).f(x, y);
        const d = Math.abs(a[1]) < Math.abs(b[1]) ? a[1] : b[1];
        return cylLv((d / 1.6 + 1) / 2, true);
      },
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 22, 26, 4, c);
      Q.r(2, 23, 1, 2, c).r(29, 23, 1, 2, c);
    }, {
      lit: hcylF(22, 4, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(15, 7, 2, 5, "#b8bec6");
      tubeRing(Q, 18.5, 5.5, 3, 3, 1.6, "#b8bec6", -Math.PI, .9);
      Q.r(14, 10, 4, 3, "#4a86b8");
    }, {
      cast: -1
    });
  });
  def("열쇠 꾸러미", 1, 1, P => {
    const key = (a, len, col, cap) => {
      const bx = 9 + Math.cos(a) * 6, by = 8 + Math.sin(a) * 6, ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      layer(P, Q => {
        rod(Q, bx, by, ex, ey, 6, (l, d, L) => {
          if (l < 3 && Math.hypot(l, d) < 4.4) {
            if (Math.hypot(l + 1.2, d) < 1.3) return null;
            return cap || col;
          }
          if (l >= 2.5 && l < 5.5 && Math.abs(d) <= 2.3) return col;
          if (l >= 5.5 && l <= L && d >= -1.3 && d <= 1.2 - (l > L - 2 ? (l - L + 2) * .8 : 0)) return col;
          if (l >= 7 && l < L - 2 && d > 1.2 && d < 2.8 && [ 1, 1, 0, 1, 0, 0, 1 ][(l | 0) % 7]) return col;
          return null;
        });
        rod(Q, bx, by, ex, ey, 6, (l, d, L) => l > 7 && l < L - 1 && Math.abs(d + .1) < .45 ? sh(col, -.35) : null);
      }, {
        bevel: [ 2, -2 ],
        cast: -2
      });
    };
    key(1.45, 13, "#b8c0c8", "#c8402e");
    key(.85, 15, "#a8b0b8");
    key(.18, 16, "#d0a848");
    layer(P, Q => tubeRing(Q, 9, 8, 6, 6, 1.6, "#c4ccd4", -Math.PI, Math.PI, true), {
      cast: -1
    });
    glint(P, 5, 4);
    glint(P, 25, 10);
  });
  def("자물쇠", 1, 1, P => {
    layer(P, Q => {
      tubeRing(Q, 16, 10, 6.5, 6.5, 3, "#b8c0c8", -Math.PI, 0, true);
      Q.r(8, 10, 3, 6, "#b8c0c8").r(21, 10, 3, 6, "#b8c0c8");
    }, {
      lit: (x, y) => y >= 10 ? cylLv(((x < 16 ? x - 8 : x - 21) + .5) / 3, true) : 0,
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 4, 13, 24, 17, 2, "#c8a046");
      Q.r(5, 13, 22, 3, "#e0bc60");
      Q.r(4, 16, 24, 1, "#8a6a28");
      disc(Q, 16, 21, 2, 2, "#2a2018");
      Q.r(15, 22, 2, 4, "#2a2018");
      Q.r(5, 27, 22, 1, "#9a7a34");
    }, {
      lit: (x, y) => y < 16 ? x < 9 ? 2 : 1 : cylLv((x + .5 - 4) / 24, true),
      bevel: [ 0, -1 ]
    });
    glint(P, 7, 18);
    glint(P, 7, 19);
    glint(P, 8, 14, "#fff4d0");
  });
  def("충전 케이블", 1, 1, P => {
    const c = "#e0e0da";
    tubeRing(P, 16, 13, 11, 7, 2.2, c, -Math.PI, Math.PI);
    layer(P, Q => tubeRing(Q, 17, 16, 10, 7, 2.2, c, -Math.PI, Math.PI), {
      cast: -1
    });
    layer(P, Q => tubeRing(Q, 15, 18, 10, 6.5, 2.2, c, -2.2, 2), {
      cast: -1
    });
    layer(P, Q => {
      rod(Q, 6, 21, 4, 27, 3, (l, d, L) => l > 0 && l < L && Math.abs(d) < 1.2 ? c : null);
      Q.r(1, 24, 7, 4, "#eeeeea");
      Q.r(1, 28, 7, 3, "#aab2ba");
      Q.r(2, 29, 5, 1, "#3a3e44");
    }, {
      bevel: [ 1, -2 ]
    });
    layer(P, Q => {
      Q.r(26, 19, 4, 6, "#eeeeea");
      Q.r(27, 25, 2, 3, "#aab2ba");
    }, {
      bevel: [ 1, -2 ]
    });
  });
  def("이어폰", 1, 1, P => {
    const w = "#ecece6", pts = [];
    const bez = (a, b, c, n) => {
      const o = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        o.push([ (1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * b[1] + t * t * c[1] ]);
      }
      return o;
    };
    const cord = (a, b, c) => {
      const q = bez(a, b, c, 30);
      for (let i = 0; i < q.length - 1; i++) {
        P.line(q[i][0], q[i][1] + 1, q[i + 1][0], q[i + 1][1] + 1, "#8a8e94");
      }
      for (let i = 0; i < q.length - 1; i++) P.line(q[i][0], q[i][1], q[i + 1][0], q[i + 1][1], "#dcdcd6");
    };
    cord([ 8, 14 ], [ 4, 22 ], [ 15, 22 ]);
    cord([ 23, 14 ], [ 26, 21 ], [ 15, 22 ]);
    cord([ 15, 22 ], [ 15, 25 ], [ 16, 26 ]);
    layer(P, Q => {
      Q.r(14, 26, 3, 2, "#e0e0da");
      Q.r(15, 28, 2, 3, "#b8c0c8");
      Q.p(15, 29, "#3a3e44");
    }, {
      bevel: [ 1, -1 ]
    });
    const bud = (cx, cy, fl) => layer(P, Q => {
      rod(Q, cx, cy + 2, cx + (fl ? 1 : -1), cy + 8, 2, (l, d, L) => l > 0 && l < L && Math.abs(d) < 1.3 ? w : null);
      disc(Q, cx, cy, 5, 4.5, w);
      disc(Q, cx + (fl ? -2 : 2), cy - 1, 2.2, 2, "#8a9098");
    }, {
      lit: ballF(cx, cy, 5, 4.5),
      cast: -1
    });
    bud(8, 8, 1);
    bud(23, 8, 0);
    glint(P, 6, 5, "#ffffff");
    glint(P, 21, 5, "#ffffff");
  });
  def("치약", 1, 1, P => {
    const x0 = 3, y0 = 28, x1 = 28, y1 = 4, rf = l => l < 3 ? 5 : l < 6 ? 5 - (l - 3) * .2 : l < 23 ? 4.4 - (l - 6) * .03 : l < 27 ? 3.89 - (l - 23) * .42 : 2.4;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 6, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > rf(l)) return null;
      if (l < 3) return (l | 0) % 2 ? "#d8d8d0" : "#b8b8b0";
      if (l >= 27) return Math.round(d * 1.5) % 2 ? "#2a5ab0" : "#3a6ac8";
      if (l >= 24) return "#e8e8e0";
      if (l > 9 && l < 18) return d < -1 ? "#d8342c" : d < 1.4 ? "#ffffff" : "#2a5ab0";
      return "#eeeee6";
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    rod(P, x0, y0, x1, y1, 6, (l, d) => l > 11 && l < 16 && Math.abs(d - .2) < .5 ? "#d8342c" : null);
  });
  def("립스틱", 1, 1, P => {
    layer(P, Q => {
      Q.r(18, 10, 10, 20, "#26222a");
      disc(Q, 23, 10, 5, 2, "#26222a");
      disc(Q, 23, 29.5, 5, 1.5, "#26222a");
      Q.r(18, 24, 10, 2, "#d8b050");
    }, {
      lit: vcylF(18, 10, true),
      cast: 0
    });
    P.oval(23, 10, 4, 1, "#4a4450");
    layer(P, Q => {
      Q.r(4, 17, 11, 13, "#d8b050");
      disc(Q, 9.5, 29.5, 5.5, 1.5, "#d8b050");
      Q.r(4, 20, 11, 1, "#8a6a28");
      Q.r(5, 13, 9, 4, "#e0c060");
      Q.poly([ [ 6, 13 ], [ 6, 7 ], [ 13, 3 ], [ 13, 13 ] ], "#c02a3a");
    }, {
      lit: (x, y) => y < 13 ? cylLv((x + .5 - 6) / 7, true) : cylLv((x + .5 - 4) / 11, true),
      cast: 0
    });
    P.line(6, 7, 12, 4, "#f06a78").p(6, 8, "#e04a5a");
    glint(P, 6, 18);
    glint(P, 6, 19);
  });
  def("화투 한 목", 1, 1, P => {
    layer(P, Q => {
      Q.r(14, 2, 15, 22, "#1a1618");
      Q.r(15, 3, 13, 20, "#efe4c8");
      Q.line(15, 20, 26, 6, "#4a3024").line(16, 20, 27, 6, "#4a3024");
      for (const [x, y] of [ [ 18, 9 ], [ 24, 13 ], [ 21, 16 ], [ 26, 5 ] ]) {
        Q.r(x - 1, y, 3, 1, "#d8344a").r(x, y - 1, 1, 3, "#d8344a").p(x, y, "#f0d040");
      }
      Q.r(16, 11, 4, 8, "#c02a3a").p(17, 13, "#1a1618").p(17, 15, "#1a1618");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 26, 16, 4, "#b82a2a");
      for (let y = 26; y < 30; y += 2) Q.r(3, y, 16, 1, "#2a1a1a");
      Q.r(3, 8, 16, 19, "#1a1618");
      Q.r(4, 9, 14, 17, "#c83a2e");
      disc(Q, 11, 14, 4.5, 4.5, "#f4ecd8");
      disc(Q, 12, 15, 3, 3, "#fff8e8");
      Q.poly([ [ 4, 26 ], [ 4, 21 ], [ 9, 18 ], [ 14, 20 ], [ 18, 17 ], [ 18, 26 ] ], "#1e1a1c");
      Q.r(5, 22, 3, 1, "#3a3438").r(12, 21, 4, 1, "#3a3438");
    }, {
      bevel: [ 1, -1 ]
    });
  });
  function lathe(P, cx, y0, y1, rf, col) {
    for (let y = y0; y < y1; y++) {
      const r = rf(y);
      if (!(r > 0)) continue;
      const xa = Math.round(cx - r), xb = Math.round(cx + r);
      for (let x = xa; x < xb; x++) {
        const c = typeof col === "function" ? col(x, y, (x + .5 - (cx - r)) / (2 * r)) : col;
        if (c) P.p(x, y, c);
      }
    }
    return P;
  }
  const latheLit = (cx, rf, sp) => (x, y) => {
    const r = rf(y);
    return r > 0 ? cylLv((x + .5 - (cx - r)) / (2 * r), sp) : 0;
  };
  const noise = (P, x, y, w, h, cols, n, seed) => {
    const g = new SX.Rng(seed || 1);
    for (let k = 0; k < n; k++) P.p(x + g.i(w), y + g.i(h), cols[g.i(cols.length)]);
    return P;
  };
  def("두루마리 휴지", 1, 2, P => {
    const pp = "#e6e4dc";
    const roll = (y0, hh) => layer(P, Q => {
      Q.r(3, y0 + 4, 26, hh - 8, pp);
      disc(Q, 16, y0 + hh - 4.5, 13, 4, pp);
      for (let y = y0 + 7; y < y0 + hh - 3; y += 3) for (let x = 5 + y % 2 * 2; x < 28; x += 4) Q.p(x, y, "#cfccc2");
    }, {
      lit: vcylF(3, 26),
      cast: y0 < 20 ? -2 : 0
    });
    roll(30, 32);
    roll(4, 30);
    disc(P, 16, 8.5, 13, 4.5, "#f4f3ee");
    P.ring(16, 8.5, 10.5, 3.5, "#dddbd2");
    P.ring(16, 8.5, 8, 2.7, "#dddbd2");
    disc(P, 16, 8.5, 5, 2, "#c09a68");
    disc(P, 16, 8.9, 3.5, 1.3, "#3a2c20");
    P.r(6, 5, 6, 1, "#ffffff");
    layer(P, Q => {
      Q.r(17, 28, 9, 18, "#eeede6");
      for (let x = 17; x < 26; x++) Q.r(x, 46, 1, x % 3 ? 1 : 2, "#eeede6");
      for (let x = 17; x < 26; x += 2) Q.p(x, 37, "#c8c6bc");
    }, {
      lit: x => x === 17 ? 1 : x === 25 ? -1 : 0,
      cast: -2
    });
  });
  def("샴푸통", 1, 2, P => {
    const c = "#a8508a", rf = y => y < 20 ? 0 : y < 27 ? 6 + 6.5 * Math.sqrt((y - 19.5) / 7.5) : y < 60 ? 12.5 : 12.5 - (y - 59) * 1.3;
    layer(P, Q => lathe(Q, 16, 20, 63, rf, (x, y) => y > 33 && y < 52 ? y === 34 || y === 50 ? "#d8c8b8" : "#ece6da" : c), {
      lit: latheLit(16, rf, true),
      cast: 0
    });
    hgs(P, 8, 37, "#6a2a5a", "샴푸");
    P.r(8, 44, 16, 1, "#b87aa8");
    txt(P, 9, 47, 13, "#a08a98", 3);
    layer(P, Q => {
      disc(Q, 26, 41, 1.8, 3, "#5a9a4a");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(11, 14, 10, 7, "#e8e6e0");
      Q.r(15, 8, 2, 6, "#d8d6d0");
      Q.r(9, 4, 13, 5, "#eeeeea");
      Q.r(3, 5, 7, 2, "#eeeeea");
      Q.p(3, 7, "#eeeeea");
    }, {
      lit: (x, y) => y < 5 ? 1 : y > 7 && y < 14 ? cylLv((x - 15 + .5) / 2) : y >= 14 ? cylLv((x + .5 - 11) / 10, true) : y === 8 ? -2 : 0,
      bevel: [ 1, -1 ]
    });
    for (let y = 27; y < 58; y++) if (y < 33 || y > 51) P.p(8, y, "#e8b8d8");
    glint(P, 8, 25, "#ffffff");
  });
  def("낡은 잡지", 2, 1, P => {
    const mag = (x, y, bg, mast, pic, seed) => layer(P, Q => {
      Q.r(x, y, 22, 28, bg);
      Q.r(x, y + 1, 22, 7, mast);
      hgs(Q, x + 3, y + 2, "#f4f0e4", [ "주간", "월간", "여행", "낚시", "요리" ][Math.abs(seed | 0) % 5]);
      pic(Q, x, y);
      txt(Q, x + 2, y + 24, 10, "#f0e8d0", seed);
      Q.r(x + 16, y + 22, 4, 4, "#f0f0e8");
      for (let k = 0; k < 4; k++) Q.r(x + 16 + k, y + 22, 1, 3, k % 2 ? "#f0f0e8" : "#2a2a2a");
      Q.x.clearRect(x + 19, y + 26, 3, 2);
      Q.x.clearRect(x + 21, y + 24, 1, 2);
      Q.poly([ [ x + 17, y + 28 ], [ x + 22, y + 23 ], [ x + 17, y + 23 ] ], "#e8e0c8");
      noise(Q, x + 1, y + 8, 20, 18, [ "#8a6a3a", "#7a5a2a" ], 6, seed);
    }, {
      lit: pillowF(x, y, 22, 28, 3),
      bevel: [ 1, -1 ]
    });
    mag(2, 2, "#3a6a8a", "#c83a2e", (Q, x, y) => {
      Q.poly([ [ x + 2, y + 22 ], [ x + 6, y + 14 ], [ x + 12, y + 12 ], [ x + 19, y + 16 ], [ x + 21, y + 22 ] ], "#c8403a");
      Q.r(x + 5, y + 18, 3, 3, "#1e1e22").r(x + 15, y + 18, 3, 3, "#1e1e22");
      Q.r(x + 8, y + 14, 6, 2, "#8ac0e0");
    }, 1);
    mag(21, 3, "#e0c8a0", "#2a4a8a", (Q, x, y) => {
      disc(Q, x + 11, y + 16, 8, 7, "#6a8a4a");
      disc(Q, x + 11, y + 15, 5, 4, "#d8a040");
      Q.r(x + 6, y + 13, 3, 2, "#c83a2e");
    }, 2);
    mag(40, 2, "#d8d0c0", "#9a2a3a", (Q, x, y) => {
      Q.r(x + 5, y + 9, 12, 13, "#3a2a22");
      disc(Q, x + 11, y + 15, 4.5, 5.5, "#e0b48c");
      Q.r(x + 6, y + 9, 11, 3, "#3a2a22");
      Q.p(x + 9, y + 15, "#1e1418").p(x + 13, y + 15, "#1e1418").r(x + 10, y + 18, 3, 1, "#c03a4a");
      Q.r(x + 3, y + 21, 16, 2, "#6a4a7a");
    }, 3);
  });
  def("종이컵 묶음", 2, 1, P => {
    const hh = x => 7 + (x - 3) / 53 * 5.5, cy = 16, rims = [ 18, 23, 28, 33, 38, 43, 48, 53 ];
    layer(P, Q => {
      for (let x = 3; x <= 56; x++) {
        const h = hh(x);
        Q.r(x, Math.round(cy - h), 1, Math.round(cy + h) - Math.round(cy - h), "#ecebe4");
      }
      for (const x of rims) {
        const h = hh(x);
        Q.r(x - 3, Math.round(cy - h), 1, Math.round(2 * h), "#c8a878");
        Q.r(x, Math.round(cy - h - 1), 1, Math.round(2 * h + 2), "#fafaf4");
        Q.r(x - 1, Math.round(cy - h), 1, Math.round(2 * h), "#a8a8a0");
      }
      Q.r(6, 12, 7, 8, "#b86a3a");
      Q.r(7, 13, 5, 4, "#ecebe4");
      Q.r(12, 14, 2, 2, "#b86a3a");
    }, {
      lit: (x, y) => {
        const h = hh(x) + 1;
        return cylLv((y + .5 - (cy - h)) / (2 * h));
      }
    });
    disc(P, 57.5, cy, 3, 13, "#f6f6f0");
    disc(P, 58, cy + .5, 2, 11.5, "#9a9a92");
    disc(P, 58.6, cy + 2, 1.2, 8.5, "#6a6a64");
    P.r(3, 10, 1, 12, "#b0b0a8");
  });
  def("나무젓가락 묶음", 2, 1, P => {
    const g = new SX.Rng(11), w = "#c8a468";
    layer(P, Q => {
      for (let r = 0; r < 8; r++) {
        const y = 8 + r * 2, x0 = 3 + g.i(4), x1 = 57 + g.i(4);
        Q.r(x0 + 8, y, x1 - x0 - 8, 2, g.chance(.3) ? "#d4b478" : w);
        Q.r(x0, y, 8, 1, w);
        Q.r(x1 - 1, y, 1, 2, "#e8d0a0");
        Q.p(x0 + 4 + g.i(20), y, "#a88450");
      }
    }, {
      lit: (x, y) => (y - 8) % 2 ? -1 : cylLv((y + .5 - 8) / 16) + 1
    });
    layer(P, Q => {
      Q.r(27, 6, 9, 20, "#f0ece0");
      Q.r(27, 11, 9, 3, "#c8302a");
      hgs(Q, 28, 16, "#c8302a", "젓");
      Q.r(27, 22, 9, 1, "#d8d4c8");
    }, {
      lit: hcylF(6, 20),
      bevel: [ 1, -1 ]
    });
  });
  def("낡은 운동화", 2, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 4, 24 ], [ 3, 15 ], [ 5, 8 ], [ 9, 5 ], [ 13, 6 ], [ 17, 10 ], [ 22, 10 ], [ 24, 5 ], [ 28, 3 ], [ 31, 5 ], [ 31, 9 ], [ 38, 12 ], [ 45, 15 ], [ 53, 17 ], [ 59, 19 ], [ 62, 22 ], [ 62, 25 ], [ 4, 25 ] ], "#cdc9bc");
      Q.poly([ [ 12, 7 ], [ 17, 11 ], [ 22, 11 ], [ 23, 8 ], [ 16, 6 ] ], "#2a2a2e");
      Q.poly([ [ 3, 12 ], [ 9, 6 ], [ 11, 8 ], [ 5, 22 ], [ 3, 22 ] ], "#3a4a6a");
      Q.poly([ [ 50, 17 ], [ 59, 19 ], [ 62, 22 ], [ 62, 25 ], [ 49, 25 ] ], "#b8b2a2");
      Q.poly([ [ 12, 22 ], [ 22, 18 ], [ 34, 20 ], [ 46, 16 ], [ 48, 18 ], [ 34, 23 ], [ 22, 21 ], [ 13, 24 ] ], "#9a3a34");
      for (let k = 0; k < 5; k++) {
        const x = 27 + k * 4, y = 8 + k * 1.6;
        Q.line(x, y, x + 3, y + 3.5, "#f0ece0");
        Q.line(x + 3, y, x, y + 3.5, "#e0dcd0");
        Q.p(x, y + 3, "#3a3a3e");
      }
      noise(Q, 6, 17, 50, 7, [ "#9a8a70", "#8a7a60" ], 22, 4);
    }, {
      lit: pillowF(3, 3, 60, 22, 2),
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 3, 23 ], [ 62, 23 ], [ 63, 25 ], [ 61, 28 ], [ 4, 28 ], [ 2, 26 ] ], "#e0dcd0");
      Q.r(3, 27, 58, 2, "#3a3a3a");
      for (let x = 6; x < 60; x += 4) Q.r(x, 28, 2, 1, "#1e1e20");
      Q.r(4, 25, 56, 1, "#c8c4b6");
    }, {
      bevel: [ 1, -1 ]
    });
  });
  def("마우스", 1, 1, P => {
    P.line(16, 6, 16, 3, "#44464e").line(16, 3, 18, 1, "#44464e").line(18, 1, 23, 1, "#44464e").p(19, 1, "#7a7e88");
    layer(P, Q => {
      disc(Q, 16, 18, 9.5, 12, "#c4c8ce");
      Q.r(16, 6, 1, 11, "#6a6e76");
      Q.r(15, 9, 3, 6, "#2a2c30");
      for (let y = 9; y < 15; y += 2) Q.r(15, y, 3, 1, "#6a6e76");
      Q.r(7, 17, 19, 1, "#9a9ea6");
    }, {
      lit: ballF(15.5, 17, 11, 13),
      cast: 0
    });
    P.r(11, 9, 2, 1, "#f4f6f8").p(10, 10, "#f4f6f8");
  });
  def("키보드", 3, 1, P => {
    layer(P, Q => {
      rrect(Q, 2, 4, 92, 26, 2, "#34363c");
      Q.r(2, 27, 92, 3, "#22242a");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    const key = (x, y, w, c) => {
      P.r(x, y, w, 2, c || "#b4b8be").r(x, y + 2, w, 1, "#5e626a").p(x, y, "#dce0e4");
    };
    for (let r = 0; r < 5; r++) {
      const y = 6 + r * 4, off = [ 0, 2, 3, 5, 0 ][r];
      if (r < 4) for (let k = 0; k < 13 - (r > 1 ? 1 : 0); k++) key(4 + off + k * 5, y, 4, r === 0 && k === 0 ? "#c86a5a" : null); else {
        key(4, y, 6);
        key(11, y, 5);
        key(17, y, 5);
        key(23, y, 28);
        key(52, y, 5);
        key(58, y, 6);
        key(65, y, 4);
      }
    }
    for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) if (!(r === 4 && k > 1)) key(73 + k * 5, 6 + r * 4, 4, r === 4 && k === 0 ? null : null);
    key(73, 22, 9);
    P.r(88, 23, 2, 1, "#6aff8a").p(84, 23, "#3a8a4a");
  });
  def("헌 청바지", 2, 2, P => {
    const dn = "#3e5a8a";
    layer(P, Q => {
      Q.poly([ [ 13, 4 ], [ 51, 4 ], [ 53, 26 ], [ 56, 61 ], [ 35, 61 ], [ 32, 28 ], [ 29, 61 ], [ 8, 61 ], [ 11, 26 ] ], dn);
    }, {
      lit: (x, y) => {
        const lg = y > 27 ? x < 32 ? [ 9, 31 ] : [ 34, 56 ] : [ 11, 53 ];
        return cylLv((x + .5 - lg[0]) / (lg[1] - lg[0])) + ((x + y * 2) % 5 === 0 ? -1 : 0);
      },
      cast: 0
    });
    P.r(13, 4, 38, 5, "#46649a").r(13, 8, 38, 1, "#2e4470");
    for (const x of [ 16, 25, 38, 47 ]) P.r(x, 3, 2, 7, "#2e4470").p(x, 3, "#5a78ac");
    P.r(31, 5, 3, 3, "#c8a048").p(31, 5, "#f0d890");
    P.line(33, 9, 33, 21, "#d0903a").line(33, 21, 30, 24, "#d0903a");
    P.line(13, 9, 19, 15, "#d0903a").line(51, 9, 45, 15, "#d0903a");
    for (const x of [ 11, 34 ]) {
      const lx = x + 3;
      P.r(lx, 40, 14, 7, "#6a86b4").dith(lx, 39, 14, 9, "#5a78a8", 1);
    }
    for (let k = 0; k < 4; k++) P.r(37 + k % 2, 42 + k * 1.5, 11, 1, "#e8e4dc");
    P.r(8, 58, 22, 3, "#5a78ac").r(35, 58, 22, 3, "#5a78ac").r(8, 60, 22, 1, "#2e4470").r(35, 60, 22, 1, "#2e4470");
    P.line(30, 28, 31, 58, "#26385c").line(35, 28, 34, 58, "#26385c");
  });
  def("인형", 2, 2, P => {
    const b = "#a0703e", lt = "#d8b080";
    const part = (fn, cx, cy, rx, ry) => layer(P, fn, {
      lit: ballF(cx, cy, rx, ry)
    });
    part(Q => {
      disc(Q, 16, 56, 8, 6, b);
      disc(Q, 48, 56, 8, 6, b);
    }, 32, 50, 22, 12);
    P.oval(15, 57, 4, 3, lt).oval(49, 57, 4, 3, lt);
    part(Q => disc(Q, 32, 43, 15, 15, b), 32, 43, 15, 15);
    disc(P, 32, 46, 8, 9, lt);
    P.oval(32, 46, 6, 7, "#e0bc8e");
    layer(P, Q => {
      Q.r(26, 50, 9, 7, "#4a6a9a");
      for (let x = 26; x < 35; x += 2) Q.p(x, 50, "#e8e0d0").p(x, 56, "#e8e0d0");
    }, {
      bevel: [ 1, -1 ]
    });
    part(Q => {
      disc(Q, 14, 40, 6, 9, b);
      disc(Q, 50, 40, 6, 9, b);
    }, 32, 36, 24, 14);
    part(Q => {
      disc(Q, 18, 8, 6, 6, b);
      disc(Q, 46, 8, 6, 6, b);
    }, 32, 6, 20, 8);
    P.oval(18, 8, 3, 3, "#c89a78").oval(46, 8, 3, 3, "#c89a78");
    part(Q => disc(Q, 32, 20, 15, 13, b), 32, 20, 15, 13);
    layer(P, Q => disc(Q, 32, 26, 7, 5, lt), {
      lit: ballF(32, 26, 7, 5),
      cast: -1
    });
    disc(P, 32, 23.5, 2.5, 1.6, "#2a1a16");
    P.p(31, 23, "#8a6a60");
    P.r(32, 25, 1, 2, "#4a2a1e").r(30, 27, 2, 1, "#4a2a1e").r(33, 27, 2, 1, "#4a2a1e");
    for (const x of [ 26, 38 ]) {
      disc(P, x, 18, 2, 2, "#18121a");
      P.p(x - 1, 17, "#f4f0e8");
    }
    layer(P, Q => {
      Q.poly([ [ 24, 31 ], [ 32, 34 ], [ 40, 31 ], [ 40, 37 ], [ 32, 34 ], [ 24, 37 ] ], "#c03a3a");
      disc(Q, 32, 34, 2, 2, "#d84a4a");
    }, {
      bevel: [ 1, -1 ]
    });
    P.line(40, 11, 44, 13, "#4a2a1e").line(40, 13, 44, 11, "#4a2a1e");
  });
  def("액자", 2, 2, P => {
    layer(P, Q => {
      Q.r(4, 5, 56, 54, "#7a5230");
      Q.r(11, 12, 42, 40, "#9cc4d8");
      Q.r(11, 12, 42, 6, "#b8d8e4");
      disc(Q, 43, 21, 4, 4, "#f4e8b0");
      Q.poly([ [ 11, 38 ], [ 20, 26 ], [ 27, 33 ], [ 35, 22 ], [ 46, 34 ], [ 53, 30 ], [ 53, 44 ], [ 11, 44 ] ], "#5a7a9a");
      Q.poly([ [ 11, 44 ], [ 53, 40 ], [ 53, 52 ], [ 11, 52 ] ], "#5a8a44");
      Q.r(18, 40, 7, 6, "#e8dcc0");
      Q.poly([ [ 17, 40 ], [ 21.5, 36 ], [ 26, 40 ] ], "#b84a3a");
      Q.r(21, 43, 2, 3, "#4a3a2a");
    }, {
      cast: 0
    });
    relight(P, (x, y) => {
      const o = Math.min(x - 4, y - 5, 59 - x, 58 - y);
      if (o < 0 || o > 6) return 0;
      const tl = x - 4 < 59 - x ? y - 5 < 58 - y ? x - 4 < y - 5 ? "l" : "t" : x - 4 < 58 - y ? "l" : "b" : y - 5 < 58 - y ? 59 - x < y - 5 ? "r" : "t" : 59 - x < 58 - y ? "r" : "b";
      const lit = tl === "l" || tl === "t";
      return o < 2 ? lit ? 1 : -2 : o < 4 ? 0 : lit ? -2 : 1;
    });
    P.r(10, 11, 44, 1, "#c8a050").r(10, 11, 1, 42, "#c8a050").r(10, 52, 44, 1, "#e0c070").r(53, 11, 1, 42, "#e0c070");
    for (let k = 0; k < 14; k++) {
      P.p(14 + k, 30 - k, "rgba(255,255,255,0.55)");
      P.p(18 + k, 30 - k, "rgba(255,255,255,0.3)");
    }
    P.line(53, 44, 45, 50, "#e8f0f4").line(45, 50, 41, 52, "#e8f0f4").line(45, 50, 44, 46, "#e8f0f4");
  });
  def("화분", 2, 2, P => {
    const pot = "#b4603a", rf = y => y < 38 ? 0 : y < 43 ? 17 : 15 - (y - 43) * .2;
    const g = new SX.Rng(21);
    const leaf = (x0, h, lean, w) => layer(P, Q => {
      for (let k = 0; k < h; k++) {
        const y = 40 - k, t = k / h, ww = Math.max(1, Math.round(w * (t < .7 ? 1 : (1 - t) / .3))), x = Math.round(x0 + lean * t * t * h);
        Q.r(x, y, ww, 1, "#3e6a34");
        if (ww > 2) {
          Q.p(x, y, "#c8b848");
          Q.p(x + ww - 1, y, "#b0a040");
        }
        if (k % 5 === g.i(3)) Q.r(x + 1, y, ww - 2, 1, "#6a9a52");
      }
    }, {
      lit: (x, y) => 0,
      bevel: [ 1, -1 ],
      cast: -1
    });
    leaf(24, 32, -.35, 6);
    leaf(36, 30, .3, 6);
    leaf(29, 38, -.05, 7);
    leaf(19, 22, -.6, 5);
    leaf(40, 24, .55, 5);
    layer(P, Q => {
      lathe(Q, 32, 43, 61, rf, pot);
      disc(Q, 32, 61, 11.5, 1.5, pot);
    }, {
      lit: latheLit(32, rf)
    });
    layer(P, Q => {
      disc(Q, 32, 40.5, 17, 4, "#c87048");
      Q.r(15, 40, 34, 4, "#c87048");
      disc(Q, 32, 44, 17, 2, "#c87048");
    }, {
      lit: (x, y) => y < 40 ? 1 : cylLv((x + .5 - 15) / 34),
      cast: -1
    });
    disc(P, 32, 40, 14, 2.6, "#3a2a1e");
    noise(P, 20, 39, 24, 3, [ "#5a4230", "#2a1e16" ], 14, 2);
    P.line(22, 48, 24, 54, "#7a3a22").line(24, 54, 23, 57, "#7a3a22");
  });
  def("트로피", 2, 2, P => {
    const au = "#d4a42e";
    layer(P, Q => {
      obox(Q, 14, 50, 30, 10, 6, 4, "#3a2a24");
      Q.r(24, 52, 12, 5, "#c8a048");
      Q.r(25, 53, 10, 1, "#8a6a28");
      Q.r(25, 55, 8, 1, "#8a6a28");
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 20, 43, 20, 6, 4, 3, "#4a3a32");
    }, {
      cast: -2
    });
    layer(P, Q => {
      lathe(Q, 30, 30, 41, y => y < 33 ? 3 : y < 36 ? 5 : y < 39 ? 2.5 : 6, au);
    }, {
      lit: latheLit(30, y => y < 33 ? 3 : y < 36 ? 5 : y < 39 ? 2.5 : 6, true),
      cast: -2
    });
    tubeRing(P, 14, 16, 5, 7, 2.6, au, Math.PI * .45, Math.PI * 1.6, true);
    tubeRing(P, 46, 16, 5, 7, 2.6, au, -Math.PI * .6, Math.PI * .55, true);
    const rf = y => y < 6 ? 0 : 15.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 6) / 25, 2)));
    layer(P, Q => {
      lathe(Q, 30, 6, 31, rf, au);
    }, {
      lit: latheLit(30, rf, true),
      cast: -1
    });
    disc(P, 30, 7, 15, 3, "#8a6418");
    disc(P, 30, 8, 13, 2, "#6a4a10");
    P.ring(30, 7, 15, 3, "#f4d878");
    const sx = 30, sy = 18;
    P.r(sx - 1, sy - 4, 3, 9, "#f4d878").r(sx - 4, sy - 1, 9, 3, "#f4d878").r(sx - 1, sy - 1, 3, 3, "#fff4c0").p(sx + 2, sy + 2, "#a07a20");
    star(P, 21, 12, "#ffffff");
    glint(P, 22, 22, "#fff8e0");
  });
  const screw = (P, hx, hy, ang, len, col) => layer(P, Q => {
    const ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len, R = RP(col);
    rod(Q, hx, hy, ex, ey, 3, (l, d, L) => {
      if (l < 2 || l > L) return null;
      const r = l > L - 3 ? (L - l) * .4 + .3 : 1.3, th = (l + d * .7 & 1) === 0;
      if (Math.abs(d) <= r) return th ? R[4] : R[2];
      if (Math.abs(d) <= r + .9 && (l | 0) % 2 === 0 && l < L - 2) return R[3];
      return null;
    });
    blob(Q, hx, hy, 3.2, 3.2, (nx, ny) => {
      if ((Math.abs(nx) < .18 || Math.abs(ny) < .18) && nx * nx + ny * ny < .55) return R[0];
      return R[Math.max(0, Math.min(5, 3 + litLv(nx * .7, ny * .7, .7)))];
    });
  }, {
    cast: -2
  });
  const nut = (P, cx, cy, r, col) => layer(P, Q => {
    const R = RP(col), v = [];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      v.push([ cx + Math.cos(a) * r, cy + Math.sin(a) * r * .6 ]);
    }
    const th = Math.max(2, Math.round(r * .45)), fc = [ R[1], R[2], R[3] ];
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[k + 1];
      Q.poly([ a, b, [ b[0], b[1] + th ], [ a[0], a[1] + th ] ], fc[k]);
    }
    Q.poly(v, R[4]);
    disc(Q, cx, cy, r * .46, r * .3, R[0]);
    blob(Q, cx, cy, r * .46, r * .3, (nx, ny) => ny > .3 ? R[2] : null);
    Q.line(v[3][0], v[3][1], v[4][0], v[4][1], R[5]);
    Q.line(v[4][0], v[4][1], v[5][0], v[5][1], R[5]);
  }, {
    cast: -2
  });
  const bolt = (P, hx, hy, ang, len, col) => layer(P, Q => {
    const ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len, R = RP(col);
    rod(Q, hx, hy, ex, ey, 5, (l, d, L) => {
      if (l >= -2 && l < 3) return Math.abs(d) <= 4.2 ? d < -1.5 ? R[4] : d < 1.5 ? R[3] : R[1] : null;
      if (l >= 3 && l < 4) return Math.abs(d) <= 4.8 ? R[2] : null;
      if (l >= 4 && l <= L) {
        const r = l > L - 1 ? 1.5 : 2.2;
        if (Math.abs(d) > r) return null;
        const t = (d / r + 1) / 2;
        if (l > 10 && (l * 2 + d | 0) % 3 === 0) return R[1];
        return t < .35 ? R[5] : t < .7 ? R[3] : R[1];
      }
      return null;
    });
  }, {
    cast: -2
  });
  const nail = (P, hx, hy, ang, len, col) => layer(P, Q => {
    const ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len, R = RP(col);
    rod(Q, hx, hy, ex, ey, 4, (l, d, L) => {
      if (l >= -1.2 && l < .6) return Math.abs(d) <= 2.8 ? d < 0 ? R[4] : R[2] : null;
      if (l >= .6 && l <= L) {
        const r = l > L - 3 ? (L - l) * .3 + .2 : .95;
        if (Math.abs(d) > r) return null;
        return d < -.1 ? R[5] : R[2];
      }
      return null;
    });
  }, {
    cast: -2
  });
  def("나사 한 줌", 1, 1, P => {
    screw(P, 24, 6, 2.3, 15, "#c8b878");
    screw(P, 7, 7, .55, 16, "#b0b8c0");
    screw(P, 22, 24, -2.6, 15, "#b0b8c0");
    screw(P, 6, 24, -.25, 16, "#c8b878");
    screw(P, 15, 14, 1.25, 14, "#b0b8c0");
  });
  def("너트 한 줌", 1, 1, P => {
    nut(P, 10, 9, 7, "#a2aab2");
    nut(P, 23, 9, 6, "#c8a048");
    nut(P, 17, 17, 7.5, "#a2aab2");
    nut(P, 8, 23, 6.5, "#9098a2");
    nut(P, 24, 23, 6.5, "#a2aab2");
  });
  def("볼트 한 줌", 1, 1, P => {
    bolt(P, 5, 7, .28, 23, "#9aa2aa");
    bolt(P, 27, 13, 2.75, 22, "#6a7078");
    bolt(P, 8, 26, -.12, 21, "#a8b0b8");
    nut(P, 24, 25, 4.5, "#8a929a");
  });
  def("못 한 줌", 1, 1, P => {
    const g = new SX.Rng(8);
    const n = [ [ 4, 5, .6, 24 ], [ 27, 4, 2.2, 22 ], [ 3, 20, -.4, 24 ], [ 16, 3, 1.4, 22 ], [ 28, 18, 3.3, 22 ], [ 8, 28, -.95, 22 ], [ 25, 28, -2.3, 20 ] ];
    for (const [x, y, a, l] of n) nail(P, x, y, a, l, g.chance(.3) ? "#8a6a52" : "#8e969e");
  });
  def("경첩", 1, 1, P => {
    const c = "#b8943e", R = RP(c);
    layer(P, Q => {
      rrect(Q, 2, 5, 13, 22, 2, c);
      rrect(Q, 18, 5, 13, 22, 2, c);
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    for (const [x, y] of [ [ 8, 9 ], [ 8, 16 ], [ 8, 23 ], [ 25, 9 ], [ 25, 16 ], [ 25, 23 ] ]) {
      disc(P, x, y, 2.2, 2.2, R[1]);
      disc(P, x - .3, y - .3, 1.2, 1.2, R[0]);
      P.p(x, y, R[4]).p(x - 1, y - 2, R[2]);
    }
    layer(P, Q => {
      Q.r(14, 3, 5, 26, c);
      for (const y of [ 11, 20 ]) Q.r(14, y, 5, 1, R[0]);
      Q.r(15, 2, 3, 1, R[3]).r(15, 29, 3, 1, R[2]);
    }, {
      lit: vcylF(14, 5, true),
      cast: -2
    });
  });
  def("배관 이음쇠", 1, 1, P => {
    const c = "#c8963e";
    layer(P, Q => {
      Q.r(11, 16, 10, 8, c);
      Q.r(9, 22, 14, 8, c);
      for (const x of [ 13, 18 ]) Q.r(x, 22, 1, 8, sh(c, -.25));
    }, {
      lit: (x, y) => cylLv((x + .5 - (y < 22 ? 11 : 9)) / (y < 22 ? 10 : 14), true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(7, 9, 18, 11, c);
      Q.r(2, 6, 7, 16, c);
      Q.r(23, 6, 7, 16, c);
      for (let x = 9; x < 23; x += 2) Q.r(x, 9, 1, 11, sh(c, -.12));
      Q.r(2, 11, 7, 1, sh(c, -.3)).r(2, 17, 7, 1, sh(c, -.3)).r(23, 11, 7, 1, sh(c, -.3)).r(23, 17, 7, 1, sh(c, -.3));
    }, {
      lit: (x, y) => {
        const e = x < 9 || x > 22;
        return cylLv((y + .5 - (e ? 6 : 9)) / (e ? 16 : 11), true);
      }
    });
    disc(P, 29.5, 14, 1.4, 6, "#4a3a20");
    disc(P, 29.8, 14.5, .8, 4, "#2a2016");
    glint(P, 4, 8);
    glint(P, 5, 8);
    glint(P, 12, 11);
  });
  def("케이블 타이", 1, 1, P => {
    const tie = (off, hl, col) => layer(P, Q => {
      const x0 = 3 + off * .7, y0 = 24 + off * .7, x1 = 27 + off * .7 + hl, y1 = 3 + off * .7 - hl, R = RP(col);
      rod(Q, x0, y0, x1, y1, 3, (l, d, L) => {
        if (l >= -2 && l < 2) return Math.abs(d) <= 2.4 ? Math.abs(d) < .8 && Math.abs(l) < .8 ? R[0] : d < -1 ? R[4] : R[2] : null;
        if (l >= 2 && l <= L && Math.abs(d) <= 1) return d < 0 ? (l | 0) % 2 ? R[4] : R[3] : R[2];
        return null;
      });
    }, {
      cast: -2
    });
    tie(-5, 0, "#40424a");
    tie(-2, -3, "#e4e2da");
    tie(1, 1, "#40424a");
    tie(4, -2, "#c83a2e");
    tie(7, 0, "#40424a");
    layer(P, Q => {
      tubeRing(Q, 17, 17, 6, 3, 1.6, "#40424a", -.4, 2.8);
    }, {
      cast: -1
    });
  });
  def("사포", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 8, 2 ], [ 30, 5 ], [ 28, 26 ], [ 6, 23 ] ], "#c8aa70");
      noise(Q, 8, 3, 21, 22, [ "#b09460", "#d8bc80" ], 90, 3);
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(2, 7, 23, 22, "#9a5234");
      noise(Q, 2, 7, 23, 22, [ "#7a3a24", "#b86a48", "#6a3020", "#c88060" ], 200, 5);
      noise(Q, 2, 7, 23, 22, [ "#f0d8c0" ], 10, 6);
      Q.x.clearRect(19, 23, 6, 6);
      Q.poly([ [ 18, 29 ], [ 25, 22 ], [ 18, 22 ] ], "#ece4d0");
      Q.line(19, 26, 21, 24, "#6a5a4a").p(19, 23, "#6a5a4a");
    }, {
      bevel: [ 1, -1 ]
    });
  });
  def("페인트 붓", 2, 1, P => {
    const hr = l => l < 6 ? 3.4 : l < 10 ? 3.4 - (l - 6) * .35 : l < 24 ? 2 + (l - 10) * .12 : 3.6;
    layer(P, Q => rod(Q, 2, 16, 29, 16, 4, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= hr(l) ? Math.hypot(l - 3.5, d) < 1.2 ? null : "#b8803e" : null), {
      lit: rodLit(2, 16, 29, 16, hr),
      cast: 0
    });
    layer(P, Q => {
      Q.r(29, 8, 13, 16, "#b4bcc4");
      for (const x of [ 32, 35 ]) Q.r(x, 8, 1, 16, "#7a828a");
      Q.r(40, 8, 2, 16, "#9aa2aa");
    }, {
      lit: hcylF(8, 16, true)
    });
    layer(P, Q => {
      for (let x = 42; x < 62; x++) {
        const t = (x - 42) / 20, h = Math.round(16 - Math.max(0, t - .6) * 10), y0 = 8 + (16 - h >> 1);
        Q.r(x, y0, 1, h, x > 52 ? "#3a78c0" : "#d8c49a");
        for (let y = y0; y < y0 + h; y += 2) Q.p(x, y + x % 2, x > 52 ? "#2a5a9a" : "#b8a070");
      }
      Q.r(52, 24, 2, 3, "#3a78c0").p(52, 27, "#3a78c0");
      Q.p(58, 24, "#3a78c0");
    }, {
      lit: hcylF(8, 16),
      cast: -2
    });
  });
  def("벽돌", 2, 1, P => {
    const c = "#a84a3a";
    layer(P, Q => {
      obox(Q, 3, 13, 48, 15, 9, 8, c);
      Q.x.globalCompositeOperation = "source-atop";
      noise(Q, 4, 6, 55, 21, [ "#8a3a2c", "#c05a44", "#6a2a20", "#b8a898" ], 120, 7);
      Q.x.globalCompositeOperation = "source-over";
      Q.x.clearRect(3, 13, 3, 2);
      Q.p(5, 13, "#6a2a20");
      Q.x.clearRect(55, 5, 5, 1);
    }, {
      cast: 0
    });
    P.r(4, 13, 46, 1, "#d8826a");
    noise(P, 8, 7, 45, 5, [ "#c8c0b0", "#d8d0c0" ], 14, 9);
  });
  def("종이상자", 3, 3, P => {
    const c = "#b08858", R = RP(c);
    layer(P, Q => {
      obox(Q, 6, 40, 62, 50, 22, 26, c);
      Q.poly([ [ 33, 40 ], [ 55, 14 ], [ 63, 14 ], [ 41, 40 ] ], "#d8c49a");
      Q.r(33, 40, 8, 18, "#c8b088");
      for (let x = 33; x < 41; x++) Q.r(x, 58, 1, x % 3 + 1, "#c8b088");
      Q.line(6, 40, 28, 14, R[5]);
      Q.line(68, 41, 68, 89, R[0]);
      const ar = (x, y) => {
        Q.r(x, y + 3, 2, 7, "#4a3422").poly([ [ x - 2, y + 4 ], [ x + 1, y ], [ x + 4, y + 4 ] ], "#4a3422");
      };
      ar(13, 46);
      ar(20, 46);
      Q.r(11, 57, 15, 1, "#4a3422");
      Q.r(52, 47, 7, 5, "#4a3422").r(53, 47, 5, 3, R[2]).r(55, 52, 1, 4, "#4a3422").r(52, 56, 7, 1, "#4a3422");
      hgs(Q, 12, 70, "#5a4030", "상자주의", 1);
      txt(Q, 12, 80, 40, "#6a5038", 4);
      txt(Q, 12, 83, 30, "#6a5038", 5);
      Q.r(74, 50, 10, 8, R[0]).r(75, 51, 8, 6, R[1]);
      noise(Q, 7, 41, 60, 48, [ R[2], R[1] ], 60, 3);
      noise(Q, 20, 16, 50, 22, [ R[3], R[5] ], 30, 4);
      Q.r(6, 88, 62, 2, R[0]);
      Q.poly([ [ 20, 89 ], [ 24, 86 ], [ 28, 89 ] ], R[0]);
    }, {
      cast: 0
    });
  });
  def("비누 한 장", 1, 1, P => {
    const c = "#b4d0a4", R = RP(c);
    layer(P, Q => rrect(Q, 3, 11, 26, 16, 6, c), {
      lit: (x, y) => y > 22 ? y > 24 ? -2 : -1 : 0,
      cast: 0
    });
    layer(P, Q => rrect(Q, 3, 9, 26, 14, 6, R[4]), {
      lit: pillowF(3, 9, 26, 14, 3),
      cast: 0
    });
    blob(P, 16, 15.5, 8.5, 3.8, (nx, ny) => nx * nx + ny * ny > .62 ? ny < 0 ? R[2] : R[5] : null);
    hgs(P, 11, 13, R[2], "비누");
    for (const [x, y, r] of [ [ 25, 5, 2.5 ], [ 21, 3, 1.5 ], [ 28, 9, 1.5 ] ]) {
      P.ring(x, y, r, r, "#e8f4f8");
      P.p(x - 1, y - 1, "#ffffff");
    }
  });
  def("성냥갑", 1, 1, P => {
    layer(P, Q => {
      obox(Q, 12, 17, 15, 7, 3, 8, "#d8ccaa");
      for (let y = 10; y < 17; y++) {
        const x0 = 13 + Math.round((17 - y) * 3 / 8);
        Q.r(x0, y, 13, 1, y % 2 ? "#e4cc94" : "#d0b478");
        Q.r(x0 + 10, y, 3, 1, y % 2 ? "#d8382c" : "#b02a22");
      }
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 2, 17, 16, 10, 3, 8, "#e8dab4", {
        front: "#6a4a32",
        top: "#ece0bc"
      });
      noise(Q, 2, 17, 16, 10, [ "#4a3222", "#8a6a4a" ], 40, 3);
      Q.poly([ [ 5, 16 ], [ 8, 10 ], [ 20, 10 ], [ 17, 16 ] ], "#3a6aa8");
      Q.poly([ [ 9, 15 ], [ 11, 10 ], [ 12, 12 ], [ 14, 11 ], [ 13, 15 ] ], "#e8a030");
      Q.poly([ [ 10, 15 ], [ 11, 12 ], [ 12, 15 ] ], "#f8e070");
    }, {
      cast: -2
    });
    layer(P, Q => rod(Q, 3, 29, 19, 28, 3, (l, d, L) => l < 0 || l > L ? null : l > L - 2.5 ? Math.abs(d) < 1.6 ? "#c8342a" : null : Math.abs(d) < .8 ? "#e0c890" : null), {
      lit: rodLit(3, 29, 19, 28, l => l > 13 ? 1.6 : .8, true),
      cast: -2
    });
  });
  def("양초", 1, 1, P => {
    const c = "#e6dcc2";
    layer(P, Q => {
      Q.r(7, 13, 18, 16, c);
      disc(Q, 16, 28.5, 9, 1.6, c);
    }, {
      lit: vcylF(7, 18),
      cast: 0
    });
    disc(P, 16, 13, 9, 2.6, "#f2ead6");
    disc(P, 16, 13.4, 6, 1.5, "#e0cc98");
    layer(P, Q => {
      Q.r(9, 13, 2, 6, "#f4eee0");
      Q.p(9, 19, "#f4eee0");
      Q.r(20, 13, 2, 4, "#efe8d6");
      Q.r(13, 14, 2, 3, "#f4eee0");
    }, {
      lit: x => x < 12 ? 1 : 0,
      cast: -1
    });
    P.r(16, 8, 1, 5, "#2a2420");
    const fl = [ [ 0, 16, 1 ], [ 1, 16, 1 ], [ 2, 15, 3 ], [ 3, 15, 3 ], [ 4, 14, 5 ], [ 5, 14, 5 ], [ 6, 14, 5 ], [ 7, 15, 3 ] ];
    for (const [y, x, w] of fl) P.r(x, y, w, 1, "#e8782a");
    P.r(16, 2, 1, 5, "#f4b440").r(15, 4, 3, 3, "#f4b440").r(16, 4, 1, 3, "#fff0b0").p(16, 7, "#6a8ad0");
  });
  def("라이터", 1, 1, P => {
    const c = "#3a9a58";
    layer(P, Q => {
      rrect(Q, 9, 9, 14, 21, 3, c);
      Q.r(9, 9, 14, 3, c);
      Q.r(10, 11, 12, 6, mix(c, "#e8f4ec", .5));
      Q.r(15, 12, 1, 16, "#c8ecd4");
      Q.r(10, 17, 12, 1, sh(c, .35));
    }, {
      lit: vcylF(9, 14, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(9, 3, 14, 7, "#b4bcc4");
      for (let x = 11; x < 22; x += 2) Q.p(x, 8, "#4a5058");
      Q.r(18, 4, 4, 4, "#2a2c30");
      Q.r(18, 4, 4, 1, "#4a4e56");
    }, {
      lit: vcylF(9, 14, true),
      bevel: [ 1, -1 ]
    });
    layer(P, Q => {
      Q.r(11, 1, 5, 5, "#7a828a");
      for (let x = 11; x < 16; x += 2) Q.r(x, 1, 1, 5, "#aab2ba");
    }, {
      lit: hcylF(1, 5, true)
    });
    glint(P, 11, 21, "#e8fff0");
    glint(P, 11, 22, "#e8fff0");
  });
  def("노끈 뭉치", 1, 1, P => {
    const c = "#d4aa2c", R = RP(c);
    layer(P, Q => blob(Q, 15, 14, 12, 11, (nx, ny, x, y) => {
      const u = (x + y) % 4, v = (x - y + 40) % 4, side = nx < 0 === ny < 0;
      return (side ? u : v) === 0 ? R[2] : (side ? v : u) === 0 ? R[4] : c;
    }), {
      lit: ballF(15, 14, 12, 11),
      cast: 0
    });
    const pts = [ [ 24, 20 ], [ 27, 23 ], [ 26, 26 ], [ 22, 27 ], [ 19, 29 ], [ 15, 28 ] ];
    for (let i = 0; i < pts.length - 1; i++) {
      P.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, R[1]);
      P.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], R[4]);
    }
    P.r(13, 27, 3, 2, R[3]).p(12, 29, R[4]).p(13, 29, R[2]);
  });
  const tapeRoll = (P, cx, cy, rx, ry, th, col, core, fabric) => {
    const R = RP(col);
    layer(P, Q => {
      Q.r(cx - rx, cy, rx * 2 + 1, th, col);
      disc(Q, cx, cy + th, rx, ry, col);
      if (fabric) for (let y = cy; y < cy + th + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) if ((x + y) % 3 === 0) Q.p(x, y, R[2]);
    }, {
      lit: x => cylLv((x + .5 - (cx - rx)) / (rx * 2 + 1), true),
      cast: 0
    });
    blob(P, cx, cy, rx, ry, (nx, ny) => {
      const r = Math.hypot(nx, ny);
      return r > .93 ? R[5] : fabric && r > .5 && (nx * 9 + ny * 5 | 0) % 2 ? R[3] : R[4];
    });
    for (let k = 1; k < 4; k++) P.ring(cx, cy, rx * (.52 + k * .12), ry * (.52 + k * .12), R[3]);
    const cr = .5;
    disc(P, cx, cy, rx * cr, ry * cr, core);
    blob(P, cx, cy, rx * cr - 1.2, ry * cr - .8, (nx, ny) => ny < .2 ? "#1e1a18" : sh(core, -.35));
  };
  def("절연테이프", 1, 1, P => {
    tapeRoll(P, 15, 12, 11, 7, 7, "#383a42", "#4a4c54");
    layer(P, Q => {
      Q.poly([ [ 20, 22 ], [ 26, 19 ], [ 29, 27 ], [ 24, 29 ] ], "#383a42");
      Q.r(24, 28, 2, 1, "#383a42");
    }, {
      lit: (x, y) => x - y > -2 ? -1 : 1,
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(7, 8, 5, 1, "#b0b4c0").p(6, 9, "#8a8e9a");
  });
  def("청테이프", 1, 1, P => {
    tapeRoll(P, 16, 11, 13, 8, 9, "#3a62a4", "#c8a470", true);
    layer(P, Q => {
      Q.r(21, 22, 7, 7, "#3a62a4");
      for (let x = 21; x < 28; x++) Q.r(x, 29, 1, x % 2 ? 1 : 2, "#3a62a4");
    }, {
      lit: x => x > 25 ? -1 : 0,
      cast: -2
    });
    P.r(6, 5, 6, 1, "#a8c4ec");
  });
  const aa = (P, x0, y0, x1, y1, r, body, band) => layer(P, Q => rod(Q, x0, y0, x1, y1, r + 1, (l, d, L) => {
    if (l < 0 || l > L) return null;
    if (l > L - 1.6) return Math.abs(d) <= r * .38 ? "#c8ccd2" : null;
    if (Math.abs(d) > r) return null;
    if (l < 1.3 || l > L - 3) return "#b8bcc4";
    if (band && l > L - 9) return band;
    return body;
  }), {
    lit: rodLit(x0, y0, x1, y1, r, true),
    cast: -2
  });
  def("건전지 낱개", 1, 1, P => {
    aa(P, 5, 27, 26, 5, 4.4, "#b8342a", "#e0c060");
    rod(P, 5, 27, 26, 5, 5, (l, d, L) => l > L - 7 && l < L - 5 && Math.abs(d) < .6 || Math.abs(l - L + 6) < .6 && Math.abs(d) < 2 ? "#3a2a10" : null);
    rod(P, 5, 27, 26, 5, 5, (l, d) => l > 5 && l < 14 && Math.abs(d - .3) < .5 && (l | 0) % 3 ? "#f0e0d0" : null);
  });
  def("건전지 묶음", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 3, 1, 26, 29, 2, "#e0a830");
      Q.r(3, 1, 26, 8, "#c8302a");
      hgs(Q, 5, 2, "#fff0c0", "건전");
      Q.x.clearRect(14, 3, 4, 2);
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    for (let k = 0; k < 4; k++) {
      const x = 5 + k * 6;
      aa(P, x + 2.5, 28, x + 2.5, 10, 2.6, "#b8342a", "#e0c060");
    }
    layer(P, Q => {
      Q.r(4, 9, 24, 20, "rgba(220,240,255,0.14)");
      Q.r(4, 9, 24, 1, "rgba(240,250,255,0.5)");
    }, {
      cast: 0
    });
    for (let k = 0; k < 4; k++) P.p(5 + k * 6, 12, "#ffffff").p(5 + k * 6, 13, "#f0f0f0");
  });
  def("부탄가스", 1, 1, P => {
    const rf = y => y < 3 ? 0 : y < 9 ? 3.5 + (y - 3) * 1.05 : 9.5;
    layer(P, Q => lathe(Q, 16, 3, 30, rf, (x, y) => y < 8 ? "#c0c6cc" : y > 11 && y < 26 ? y < 14 || y > 23 ? "#e8e4dc" : "#d0402a" : "#c0c6cc"), {
      lit: latheLit(16, rf, true),
      cast: 0
    });
    disc(P, 16, 29.5, 9.5, 1, "#8a9098");
    P.poly([ [ 14, 22 ], [ 16, 15 ], [ 19, 19 ], [ 18, 22 ] ], "#f4a030");
    P.poly([ [ 15, 22 ], [ 16, 18 ], [ 18, 22 ] ], "#fff0a0");
    hgs(P, 10, 16, "#fff0e0", "가");
    layer(P, Q => {
      Q.r(13, 0, 6, 5, "#e07a2a");
      Q.r(15, 0, 2, 1, "#2a2c30");
    }, {
      lit: vcylF(13, 6, true),
      bevel: [ 1, -1 ]
    });
    P.r(9, 10, 1, 3, "#ffffff");
  });
  def("기름 라이터", 1, 1, P => {
    const c = "#b8c0c8";
    layer(P, Q => {
      Q.r(21, 3, 8, 11, c);
      Q.r(21, 12, 8, 1, "#6a727a");
    }, {
      lit: vcylF(21, 8, true),
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(9, 5, 11, 9, "#a8b0b8");
      for (let y = 7; y < 13; y += 3) for (let x = 10; x < 19; x += 2) Q.p(x, y, "#2a2e34");
      Q.r(15, 2, 4, 4, "#6a727a");
      for (let x = 15; x < 19; x += 2) Q.r(x, 2, 1, 4, "#9aa2aa");
      Q.r(11, 3, 2, 3, "#e8e4d8");
    }, {
      lit: vcylF(9, 11, true),
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 7, 13, 16, 17, 2, c);
      Q.r(7, 13, 16, 2, c);
      Q.r(7, 16, 16, 1, "#6a727a");
      for (let x = 9; x < 22; x += 3) Q.r(x, 18, 1, 10, sh(c, .12));
    }, {
      lit: vcylF(7, 16, true),
      cast: -2
    });
    glint(P, 9, 20);
    glint(P, 9, 21);
    glint(P, 23, 5);
  });
  def("담배 한 갑", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 9, 8 ], [ 12, 2 ], [ 28, 2 ], [ 25, 8 ] ], "#e8e6de");
      Q.r(12, 2, 16, 1, "#c0beb4");
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 5, 9, 20, 21, 4, 4, "#e8e6de");
      for (let k = 0; k < 6; k++) Q.r(7 + k * 3, 6, 2, 3, "#d8a060"), Q.p(7 + k * 3, 6, "#f0d8b0");
      Q.poly([ [ 5, 9 ], [ 9, 5 ], [ 9, 6 ], [ 6, 9 ] ], "#c8ccd4");
      Q.r(5, 11, 21, 8, "#28406e");
      disc(Q, 15, 15, 2, 2, "#d8b050");
      hgs(Q, 6, 12, "#e8e4d8", "담");
      hgs(Q, 19, 12, "#e8e4d8", "배");
      Q.r(6, 21, 18, 8, "#2a2a2c");
      Q.r(7, 22, 7, 6, "#8a6a5a");
      txt(Q, 15, 23, 8, "#e8e4d8", 2);
      txt(Q, 15, 25, 7, "#e8e4d8", 3);
    }, {
      lit: (x, y) => x > 24 ? -2 : x < 7 ? 1 : 0,
      cast: -2
    });
  });
  def("향수병", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 6, 12, 20, 18, 3, "#e8c0d0");
      rrect(Q, 8, 16, 16, 12, 2, "#d88aa8");
      Q.r(12, 9, 8, 4, "#c8a048");
    }, {
      lit: (x, y) => y < 13 ? cylLv((x + .5 - 12) / 8, true) : x < 8 ? 1 : x < 10 ? 2 : x > 23 ? -2 : x > 20 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 10, 9 ], [ 11, 3 ], [ 16, 1 ], [ 21, 3 ], [ 22, 9 ] ], "#d8e4ec");
      Q.poly([ [ 16, 1 ], [ 16, 9 ], [ 22, 9 ], [ 21, 3 ] ], "#a8bccc");
      Q.line(11, 4, 15, 2, "#ffffff");
    }, {
      bevel: [ 1, -1 ]
    });
    P.r(8, 13, 1, 14, "#fff4f8").r(9, 14, 1, 5, "#fff4f8");
    glint(P, 21, 19, "#ffe8f0");
    hgs(P, 12, 19, "#f8e8f0", "향");
  });
  def("LED 손전등", 1, 1, P => {
    const x0 = 4, y0 = 28, x1 = 24.5, y1 = 7.5, rf = l => l < 3 ? 3.4 : l < 15 ? 3.8 : l < 20 ? 3.8 + (l - 15) * .4 : 5.8;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 6, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > rf(l)) return null;
      if (l < 1.2) return "#2a2c30";
      if (l < 3) return "#50545c";
      if (l < 17) return ((l | 0) + Math.round(d)) % 2 ? "#4a4e58" : "#3a3e46";
      if (l > L - 1.5) return "#b8c0c8";
      return (l | 0) === 19 ? "#c8342a" : "#4a4e58";
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    const g = rodGeo(x0, y0, x1, y1);
    for (let y = 0; y < 18; y++) for (let x = 14; x < 32; x++) {
      const [l, d] = g.f(x, y), u = (l - g.L) / 2, v = d / 5.6;
      if (l > g.L - 1 && u * u + v * v <= 1) {
        const r = Math.hypot(u * .4, v);
        P.p(x, y, r < .35 ? "#ffffff" : r < .62 ? "#fff4c0" : r < .85 ? "#c8d0d8" : "#8a929a");
      }
    }
    for (let k = 0; k < 3; k++) P.p(28 + k, 3 - k, "#88846c");
  });
  def("보조배터리", 1, 1, P => {
    layer(P, Q => {
      obox(Q, 3, 21, 22, 7, 5, 15, "#9aa4b0");
      rrect(Q, 5, 8, 14, 9, 1, "#8a94a0");
      for (let k = 0; k < 4; k++) Q.r(7 + k * 3, 17 - k, 2, 1, k < 3 ? "#5ad0f0" : "#3a5a70");
      Q.r(5, 23, 5, 2, "#1e2024");
      Q.r(12, 23, 3, 2, "#1e2024");
      Q.r(18, 24, 3, 1, "#3a3e44");
    }, {
      cast: 0
    });
    P.poly([ [ 3, 21 ], [ 8, 6 ], [ 30, 6 ], [ 25, 21 ] ], "rgba(255,255,255,0.08)");
    P.line(4, 20, 8, 7, "#dce4ec");
    layer(P, Q => {
      Q.r(20, 26, 2, 4, "#e8e8e4");
      Q.r(19, 22, 4, 4, "#c8ccd2");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("무전기", 2, 1, P => {
    layer(P, Q => {
      rrect(Q, 44, 10, 6, 7, 1, "#3a3e44");
      rod(Q, 49, 13.5, 62, 13.5, 3, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= (l > L - 1 ? 1.2 : 2.4 - l * .06) ? (l | 0) % 3 ? "#2e3036" : "#3e424a" : null);
    }, {
      lit: hcylF(10, 7, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(44, 18, 5, 7, "#40444c");
      for (let y = 18; y < 25; y += 2) Q.r(44, y, 5, 1, "#5a5e68");
    }, {
      lit: hcylF(18, 7, true),
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 3, 6, 42, 22, 3, "#34373e");
      Q.r(12, 4, 12, 3, "#26282e");
      for (let y = 10; y < 25; y += 2) Q.r(7, y, 14, 1, "#1a1c20");
      Q.r(25, 9, 15, 8, "#1a1c20");
      Q.r(26, 10, 13, 6, "#8ab87a");
      hgs(Q, 27, 10, "#2a4a2a", "채널");
      for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) Q.r(26 + k * 5, 19 + j * 4, 3, 2, "#6a6e78");
      Q.r(3, 6, 42, 1, "#4a4e56");
    }, {
      lit: hcylF(6, 22, true),
      bevel: [ 1, -2 ]
    });
    P.r(28, 10, 8, 1, "#b8e0a8");
  });
  def("정수 필터", 1, 2, P => {
    const rf = y => y < 6 ? 2.6 : 9;
    layer(P, Q => lathe(Q, 16, 1, 62, rf, (x, y) => y < 6 ? "#3a78c0" : y < 13 || y > 54 ? "#3a78c0" : y > 36 && y < 45 ? "#ecece6" : "#bcd4e0"), {
      lit: latheLit(16, rf, true),
      cast: 0
    });
    for (let y = 14; y < 54; y++) if (y < 37 || y > 44) P.r(12, y, 8, 1, y % 3 ? "#e8eef0" : "#a8bcc8");
    P.r(7, 13, 18, 1, "#2a5a9a").r(7, 54, 18, 1, "#2a5a9a");
    disc(P, 16, 40.5, 2, 3, "#3a78c0");
    P.p(15, 39, "#a8d0f0");
    hgs(P, 20, 38, "#3a5a7a", "수");
    hgs(P, 6, 38, "#3a5a7a", "정");
    P.r(8, 15, 1, 20, "#f4fcff").r(8, 46, 1, 7, "#f4fcff");
  });
  def("휘발유 통", 2, 2, P => {
    const c = "#b83a2a", R = RP(c);
    layer(P, Q => {
      obox(Q, 8, 16, 38, 45, 12, 9, c);
      Q.poly([ [ 12, 20 ], [ 16, 20 ], [ 42, 56 ], [ 38, 56 ] ], R[1]);
      Q.poly([ [ 38, 20 ], [ 42, 20 ], [ 16, 56 ], [ 12, 56 ] ], R[1]);
      Q.poly([ [ 13, 20 ], [ 15, 20 ], [ 41, 56 ], [ 39, 56 ] ], R[3]);
      Q.r(12, 20, 30, 1, R[1]).r(12, 56, 30, 1, R[4]).r(12, 20, 1, 37, R[1]).r(42, 20, 1, 37, R[4]);
      hgs(Q, 48, 26, "#e8d8a0", "휘");
      hgs(Q, 48, 34, "#e8d8a0", "발");
      hgs(Q, 48, 42, "#e8d8a0", "유");
      noise(Q, 9, 17, 36, 43, [ "#c8c0b0", "#6a2a1e", "#8a8e92" ], 26, 5);
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(24, 3, 22, 4, "#9a2e22");
      for (const x of [ 24, 31, 38, 45 ]) Q.r(x, 3, 2, 8, "#9a2e22");
      Q.r(24, 3, 22, 1, "#d85a48");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(11, 6, 9, 7, "#3a3c40");
      Q.r(10, 3, 11, 4, "#5a5e64");
      Q.r(18, 8, 6, 2, "#8a8e94");
    }, {
      lit: vcylF(10, 11, true),
      cast: -2
    });
  });
  const glassLv = t => t < .09 ? -1 : t < .2 ? 1 : t < .3 ? 2 : t < .62 ? 0 : t < .86 ? -1 : -2;
  const glassLit = (cx, rf) => (x, y) => {
    const r = rf(y);
    return r > 0 ? glassLv((x + .5 - (cx - r)) / (2 * r)) : 0;
  };
  function tin(P, x, y, w, h, ry, body, label, lid) {
    const cx = x + w / 2;
    layer(P, Q => {
      Q.r(x, y + ry, w, h - ry * 2, body);
      disc(Q, cx, y + h - ry, w / 2, ry, body);
      if (label) label(Q);
      for (const yy of [ y + ry + 1, y + h - ry - 2 ]) Q.r(x, yy, w, 1, "#9aa0a8");
    }, {
      lit: vcylF(x, w, true),
      cast: 0
    });
    const L = RP(lid || "#b8bec6");
    disc(P, cx, y + ry, w / 2, ry, L[2]);
    disc(P, cx, y + ry - .3, w / 2 - 1, ry - .8, L[4]);
    disc(P, cx, y + ry + .2, w / 2 - 2.5, ry - 1.8, L[3]);
    P.ring(cx, y + ry + .2, w / 2 - 4.5, Math.max(1, ry - 2.8), L[2]);
  }
  def("참치캔", 1, 1, P => {
    tin(P, 3, 6, 26, 24, 6, "#b8bec6", Q => {
      Q.r(3, 15, 26, 10, "#2a5a9a");
      Q.r(3, 16, 26, 1, "#e8e4d8");
      Q.poly([ [ 8, 21 ], [ 13, 18 ], [ 19, 19 ], [ 23, 17 ], [ 23, 23 ], [ 19, 21 ], [ 13, 23 ] ], "#8ac0e0");
      Q.p(11, 20, "#1a2a4a");
      hgs(Q, 21, 18, "#f0e8d0", "참");
    });
    layer(P, Q => {
      tubeRing(Q, 16, 15, 3.5, 1.8, 1.4, "#c8ced6", -Math.PI, Math.PI, true);
      Q.r(15, 11, 3, 3, "#aab0b8");
    }, {
      cast: -1
    });
    glint(P, 8, 10);
    glint(P, 9, 10);
  });
  def("햄 통조림", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 3, 12, 26, 18, 3, "#8e2a2a");
      Q.r(3, 15, 26, 6, "#ece2c8");
      hgs(Q, 6, 15, "#5a2a1a", "고기햄");
      Q.r(3, 21, 26, 1, "#c89a48");
      Q.r(8, 23, 12, 5, "#d88a88");
      Q.r(8, 23, 12, 1, "#f0b0a8");
      Q.p(11, 25, "#f0c0b8").p(15, 26, "#b86a68");
      Q.r(21, 24, 5, 3, "#5a9a4a");
    }, {
      lit: (x, y) => x < 5 ? 1 : x > 26 ? -2 : x > 24 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 3, 4, 26, 11, 4, "#b8bec6");
      rrect(Q, 5, 5, 22, 8, 3, "#cdd3da");
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(18, 7, 8, 3, "#9aa2aa");
      tubeRing(Q, 24, 8.5, 2.6, 1.8, 1.2, "#dce2e8", -Math.PI, Math.PI, true);
    }, {
      cast: -1
    });
    glint(P, 7, 6);
  });
  def("통조림 복숭아", 1, 1, P => {
    tin(P, 5, 2, 22, 28, 4.5, "#b8bec6", Q => {
      Q.r(5, 10, 22, 16, "#e8a030");
      Q.r(5, 10, 22, 3, "#3a7a3a");
      hgs(Q, 8, 10, "#f0f0d8", "복숭");
      for (const [x, y] of [ [ 11, 19 ], [ 19, 18 ], [ 15, 22 ] ]) {
        disc(Q, x, y, 3.6, 3, "#f4c070");
        disc(Q, x + .5, y + .5, 1.4, 1.1, "#c8603a");
      }
      Q.r(20, 23, 4, 2, "#5a9a3a");
    });
    glint(P, 8, 5);
    glint(P, 7, 14, "#fff0d0");
  });
  def("비상식량 압축비스킷", 1, 1, P => {
    layer(P, Q => {
      obox(Q, 3, 15, 23, 13, 4, 10, "#7a7a4e");
      noise(Q, 4, 6, 25, 22, [ "#8e8e5e", "#666640", "#9a9a6a" ], 70, 3);
      Q.r(3, 15, 23, 1, "#a8a878");
      hgs(Q, 6, 18, "#1e1e14", "비상");
      txt(Q, 6, 25, 16, "#2a2a1c", 4);
      Q.poly([ [ 7, 12 ], [ 9, 8 ], [ 23, 8 ], [ 21, 12 ] ], "#d8d0a0");
      hgs(Q, 9, 8, "#3a3a2a", "비상");
    }, {
      cast: 0
    });
    for (let y = 15; y < 28; y += 2) P.p(3, y, "#4a4a30");
    for (let y = 6; y < 24; y += 2) P.p(30, y, "#3a3a26");
  });
  def("소금 봉지", 1, 1, P => {
    layer(P, Q => {
      disc(Q, 16, 19.5, 12.5, 10, "#e4e8ec");
      Q.poly([ [ 10, 12 ], [ 13, 7 ], [ 19, 7 ], [ 22, 12 ] ], "#e4e8ec");
      noise(Q, 5, 11, 23, 18, [ "#ffffff", "#c8d0d8", "#b0bcc8", "#f4f8ff" ], 150, 4);
    }, {
      lit: ballF(16, 19, 13, 11),
      cast: 0
    });
    P.r(5, 18, 23, 6, "#3a6ab0");
    hgs(P, 10, 18, "#f0f4f8", "소금");
    P.r(5, 18, 23, 1, "#6a9ad8");
    layer(P, Q => {
      Q.r(12, 4, 8, 3, "#e4e8ec");
      Q.r(11, 6, 10, 2, "#c83a2e");
      Q.p(21, 5, "#c83a2e").p(22, 4, "#c83a2e");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    glint(P, 9, 13);
    glint(P, 8, 14);
  });
  def("커피믹스 한 통", 1, 1, P => {
    const stick = (x, y0, y1) => layer(P, Q => {
      Q.r(x, y0, 3, y1 - y0, "#e0b030");
      Q.r(x, y0 + 2, 3, 2, "#6a3a1e");
      Q.p(x + 1, y0 - 1, "#e0b030");
    }, {
      lit: vcylF(x, 3),
      cast: -1
    });
    stick(9, 4, 12);
    stick(13, 2, 12);
    stick(17, 5, 12);
    stick(21, 3, 12);
    layer(P, Q => {
      obox(Q, 4, 12, 20, 17, 5, 4, "#d8a42c");
      Q.r(4, 16, 20, 5, "#5a2e18");
      hgs(Q, 5, 16, "#f0d890", "커피");
      disc(Q, 15, 25, 3, 2, "#f0ece0");
      Q.r(12, 22, 6, 3, "#f0ece0");
      Q.r(13, 22, 4, 1, "#7a4a2a");
      Q.r(18, 23, 1, 2, "#f0ece0");
    }, {
      cast: -2
    });
    layer(P, Q => rod(Q, 20, 29, 30, 21, 2, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1.4 ? l > L - 3 ? "#6a3a1e" : "#e0b030" : null), {
      lit: rodLit(20, 29, 30, 21, 1.4),
      cast: -2
    });
  });
  const pouchSeal = (Q, x, y, w, h, c, vert) => {
    if (vert) for (let k = 0; k < w; k++) Q.r(x + k, y, 1, h, k % 2 ? sh(c, -.18) : sh(c, .1)); else for (let k = 0; k < h; k++) Q.r(x, y + k, w, 1, k % 2 ? sh(c, -.18) : sh(c, .1));
  };
  def("군용 전투식량", 2, 2, P => {
    const c = "#6e5e3e";
    layer(P, Q => {
      Q.r(7, 8, 46, 52, c);
      pouchSeal(Q, 7, 4, 46, 6, "#7e6e4c");
      for (let x = 7; x < 53; x += 2) Q.p(x, 3, "#7e6e4c");
      Q.x.clearRect(29, 4, 2, 3);
      hgs(Q, 12, 14, "#1e1a12", "전투식량", 1);
      txt(Q, 12, 22, 30, "#2a2418", 5);
      txt(Q, 12, 25, 24, "#2a2418", 6);
      Q.r(12, 30, 18, 12, "#2a2418");
      Q.r(13, 31, 16, 10, "#8a7a54");
      Q.r(16, 33, 2, 7, "#2a2418");
      Q.r(21, 33, 2, 7, "#2a2418").r(20, 33, 4, 2, "#2a2418");
      noise(Q, 8, 10, 44, 48, [ "#5e5034", "#7e6e4c" ], 80, 7);
    }, {
      lit: pillowF(7, 4, 46, 56, 3),
      cast: 0
    });
    layer(P, Q => {
      Q.r(34, 36, 24, 24, "#b8a478");
      pouchSeal(Q, 34, 34, 24, 4, "#c8b488");
      hgs(Q, 37, 41, "#3a2e1e", "밥");
      hgs(Q, 44, 41, "#3a2e1e", "류");
      Q.r(37, 50, 18, 6, "#8a3a2a");
      txt(Q, 38, 52, 15, "#e8d8b0", 3);
    }, {
      lit: pillowF(34, 34, 24, 26, 3),
      cast: -2
    });
  });
  def("분유 통", 1, 2, P => {
    const R = RP("#e8e4da");
    layer(P, Q => {
      Q.r(3, 12, 26, 46, "#e8e4da");
      disc(Q, 16, 58, 13, 4, "#e8e4da");
      Q.r(3, 16, 26, 6, "#6aa0d0");
      Q.r(3, 50, 26, 5, "#e8a0b0");
      disc(Q, 16, 35, 8, 7, "#c8905a");
      disc(Q, 9.5, 29, 3, 3, "#c8905a");
      disc(Q, 22.5, 29, 3, 3, "#c8905a");
      disc(Q, 16, 38, 4, 3, "#e8c8a0");
      Q.p(13, 33, "#2a1a14").p(19, 33, "#2a1a14").p(16, 37, "#2a1a14");
      hgs(Q, 10, 44, "#4a6a9a", "분유");
      Q.poly([ [ 22, 17 ], [ 24, 18 ], [ 26, 17 ], [ 26, 19 ], [ 24, 21 ], [ 22, 19 ] ], "#e8e4da");
    }, {
      lit: vcylF(3, 26, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(2, 6, 28, 8, "#8ac0d8");
      disc(Q, 16, 14, 14, 3, "#8ac0d8");
    }, {
      lit: vcylF(2, 28, true),
      cast: -2
    });
    disc(P, 16, 6, 14, 4, "#a8d4e8");
    disc(P, 16, 6.3, 11, 2.8, "#98c8dc");
    P.r(12, 5, 8, 2, "#6aa8c4");
    P.r(6, 4, 4, 1, "#e0f4fc");
  });
  def("꿀단지", 1, 2, P => {
    const rf = y => y < 14 ? 0 : y < 18 ? 11 + (y - 14) * .5 : y < 58 ? 13 : 13 - (y - 58) * 1.2;
    layer(P, Q => lathe(Q, 16, 14, 62, rf, (x, y, t) => y < 20 ? "#e8c070" : y > 34 && y < 46 ? y === 35 || y === 45 ? "#8a6a3a" : "#d8c8a0" : t > .3 && t < .6 ? "#f0a830" : "#d88a18"), {
      lit: glassLit(16, rf),
      cast: 0
    });
    hgs(P, 10, 38, "#5a3a1a", "꿀");
    for (const [x, y] of [ [ 20, 38 ], [ 22, 41 ], [ 20, 41 ] ]) {
      P.r(x, y, 2, 2, "#e0a020");
    }
    P.p(21, 40, "#5a3a1a");
    P.r(5, 21, 1, 12, "#fff4d0").r(6, 22, 1, 5, "#fff4d0").r(5, 48, 1, 7, "#fff4d0");
    P.r(4, 19, 24, 1, "#f4d890");
    layer(P, Q => {
      Q.r(4, 7, 24, 9, "#c83a3a");
      for (let y = 7; y < 16; y++) for (let x = 4; x < 28; x++) if (((x >> 1) + (y >> 1)) % 2) Q.p(x, y, "#f0e8e0");
      for (let x = 3; x < 29; x += 2) Q.r(x, 15, 1, 2 + (x % 3 === 0 ? 1 : 0), x % 4 ? "#c83a3a" : "#f0e8e0");
      disc(Q, 16, 7, 11, 4, "#c83a3a");
      for (let x = 6; x < 27; x++) for (let y = 3; y < 11; y++) if (((x >> 1) + (y >> 1)) % 2 && Math.hypot((x + .5 - 16) / 11, (y + .5 - 7) / 4) < 1) Q.p(x, y, "#f0e8e0");
      Q.r(4, 12, 24, 2, "#8a6a3a");
    }, {
      lit: (x, y) => y < 9 ? 1 : cylLv((x + .5 - 4) / 24),
      cast: -2
    });
    P.r(26, 13, 2, 4, "#8a6a3a").p(27, 17, "#8a6a3a");
  });
  const biscuit = (P, x, y) => layer(P, Q => {
    rrect(Q, x, y, 6, 5, 1, "#d8b070");
    Q.p(x + 2, y + 2, "#8a6030").p(x + 4, y + 2, "#8a6030");
  }, {
    bevel: [ 1, -2 ],
    cast: -1
  });
  def("건빵 봉지", 2, 1, P => {
    layer(P, Q => {
      Q.r(4, 3, 54, 25, "#c8a870");
      pouchSeal(Q, 2, 3, 4, 25, "#d8b880", true);
      pouchSeal(Q, 56, 3, 4, 25, "#d8b880", true);
      Q.r(8, 5, 18, 21, "#e8dcc0");
      Q.r(8, 4, 18, 8, "#6a5a36");
      hgs(Q, 9, 5, "#f0e8c8", "건빵");
      Q.r(9, 13, 16, 12, "#a88450");
      Q.r(10, 14, 14, 10, "#e8d8b0");
      Q.r(28, 6, 26, 19, "#f0ece0");
    }, {
      lit: pillowF(2, 3, 58, 25, 3),
      cast: 0
    });
    const g = new SX.Rng(4);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) biscuit(P, 29 + k * 6 + r % 2 * 2, 7 + r * 6);
    for (let k = 0; k < 6; k++) {
      const x = 30 + g.i(22), y = 8 + g.i(15), c = g.pick([ "#e86a8a", "#f0e060", "#6ac0f0", "#f0f0f0" ]);
      P.p(x, y, c).p(x - 1, y, c).p(x + 1, y, c).p(x, y - 1, c).p(x, y + 1, c);
    }
    P.r(28, 6, 26, 1, "#ffffff");
    P.r(29, 7, 1, 8, "rgba(255,255,255,0.6)");
  });
  def("초코파이 상자", 2, 1, P => {
    const c = "#9a5a28";
    layer(P, Q => {
      obox(Q, 3, 12, 46, 17, 10, 8, c);
      Q.r(3, 12, 46, 3, "#e0b040");
      hgs(Q, 8, 18, "#f8f0e0", "초코");
      txt(Q, 6, 25, 20, "#f0d8b0", 3);
      Q.poly([ [ 14, 5 ], [ 17, 2 ], [ 44, 2 ], [ 41, 5 ] ], "#e0b040");
    }, {
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 40, 22, 7, 3, "#4a2818");
      Q.r(33, 18, 15, 4, "#4a2818");
      Q.r(33, 20, 15, 1, "#f0ece0");
      disc(Q, 40, 18, 7, 3, "#6a3a22");
    }, {
      lit: (x, y) => y < 18 ? 1 : cylLv((x + .5 - 33) / 15),
      cast: -2
    });
    glint(P, 36, 17, "#a86a4a");
  });
  function ramen(P, bg, band, tc, title, soup, top) {
    layer(P, Q => {
      Q.r(5, 3, 54, 26, bg);
      pouchSeal(Q, 2, 4, 4, 24, sh(bg, .1), true);
      pouchSeal(Q, 58, 4, 4, 24, sh(bg, .1), true);
      for (let y = 4; y < 28; y += 2) Q.p(1, y, sh(bg, .1)).p(62, y, sh(bg, .1));
      Q.r(5, 5, 54, 3, band);
      Q.r(5, 24, 54, 2, band);
      hgs(Q, 8, 11, sh(tc, -.5), title, 1);
      hgs(Q, 7, 10, tc, title, 1);
      disc(Q, 46, 17, 10, 7, "#f0ece4");
      disc(Q, 46, 15.5, 9, 4.5, soup);
      disc(Q, 46, 22, 7, 3, "#d8d4ca");
      for (let k = 0; k < 4; k++) for (let x = 38; x < 54; x++) if ((x + k * 2) % 4 < 2) Q.p(x, 13 + k + (x >> 1) % 2, "#f0d070");
      if (top) top(Q);
    }, {
      lit: pillowF(2, 3, 60, 26, 3),
      cast: 0
    });
    P.r(7, 5, 20, 1, "rgba(255,255,255,0.45)");
  }
  def("봉지라면", 2, 1, P => ramen(P, "#d8582a", "#f0c040", "#fff4d0", "라면", "#e0702a", Q => {
    Q.r(42, 12, 3, 2, "#f8f4e8").p(43, 12, "#f0c040");
    Q.p(49, 15, "#5aa040").p(51, 14, "#5aa040");
  }));
  def("매운 라면", 2, 1, P => ramen(P, "#8e1a1e", "#1e1a1a", "#fff0e0", "매운", "#c02a1e", Q => {
    Q.poly([ [ 20, 16 ], [ 30, 13 ], [ 33, 16 ], [ 29, 20 ], [ 21, 21 ] ], "#e0301e");
    Q.r(31, 12, 2, 3, "#4a9a3a");
    Q.p(24, 16, "#ff9070");
    for (const x of [ 10, 14 ]) Q.poly([ [ x, 22 ], [ x + 1.5, 18 ], [ x + 3, 22 ] ], "#f09030");
  }));
  def("된장 라면", 2, 1, P => ramen(P, "#7a6634", "#e8dcb8", "#f4ecd0", "된장", "#9a6a2e", Q => {
    Q.r(43, 13, 3, 3, "#f4f0e0").r(48, 14, 3, 3, "#f4f0e0");
    Q.p(45, 16, "#5a9a3a").p(51, 13, "#5a9a3a");
    disc(Q, 26, 19, 5, 3.5, "#4a2e1e");
    Q.r(21, 15, 10, 2, "#6a4430");
    Q.r(24, 13, 4, 2, "#4a2e1e");
  }));
  def("우동 라면", 2, 1, P => ramen(P, "#e4dcc6", "#2a3a6a", "#2a3a6a", "우동", "#d8b878", Q => {
    for (let k = 0; k < 3; k++) Q.r(38, 13 + k * 2, 16, 1, "#fbf8ee");
    disc(Q, 49, 15, 3, 2, "#f8f4f0");
    Q.p(48, 15, "#e87a9a").p(49, 14, "#e87a9a").p(50, 15, "#e87a9a");
    Q.p(42, 17, "#5a9a3a").p(44, 12, "#5a9a3a");
    Q.r(21, 16, 10, 5, "#c8a860");
    Q.r(21, 16, 10, 1, "#e8d090");
  }));
  def("김치 한 포기", 2, 2, P => {
    layer(P, Q => {
      disc(Q, 32, 47, 29, 13, "#dcdad2");
    }, {
      lit: (x, y) => y > 54 ? -2 : y > 51 ? -1 : 0,
      cast: 0
    });
    disc(P, 32, 45.5, 29, 12, "#eceae2");
    disc(P, 32, 46, 23, 9, "#dedcd4");
    P.ring(32, 45.5, 28, 11.5, "#f8f8f2");
    disc(P, 36, 49, 16, 5, "#c8603a");
    disc(P, 36, 49, 13, 3.5, "#d87048");
    const x0 = 9, y0 = 48, x1 = 57, y1 = 22, g = new SX.Rng(12), jag = [];
    for (let k = 0; k < 64; k++) jag.push(g.f());
    const rf = l => l < 4 ? 6 + l : l < 26 ? 10 + (l - 4) * .12 : 12.6 + Math.sin(l * .9) * 1.2 + jag[(l | 0) % 64] * 2.2 - Math.max(0, l - 46) * 1.5;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 16, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > rf(l)) return null;
      const s = d / rf(l), w = Math.sin(s * 5.5 + l * .12);
      if (l < 2.2) return Math.abs(Math.sin(s * 9)) < .3 ? "#c85a3a" : "#f0e6bc";
      if (l > 27 + jag[(Math.abs(d * 3) | 0) % 64] * 8) return jag[(l * 5 + d * 7 | 0) % 64 | 0] < .28 ? "#c8401e" : w > 0 ? "#6a9a3c" : "#4e7a2e";
      if (w > .72 && jag[(l * .7 | 0) % 64] > .45 - l * .012) return w > .9 ? "#f0e0bc" : "#dca888";
      return jag[(l * 3 + d * 11 | 0) % 64 | 0] < .2 ? "#e0582a" : "#b8341c";
    }), {
      lit: (x, y) => {
        const q = rodGeo(x0, y0, x1, y1).f(x, y);
        return cylLv((q[1] / rf(Math.max(0, q[0])) + 1) / 2);
      },
      cast: -2
    });
    const q = new SX.Rng(3);
    for (let k = 0; k < 40; k++) {
      const x = 12 + q.i(44), y = 12 + q.i(38);
      if (P.x.getImageData(x, y, 1, 1).data[3] > 100 && q.chance(.5)) P.p(x, y, q.pick([ "#f07040", "#8a1e12" ]));
    }
    for (const [x, y] of [ [ 20, 36 ], [ 31, 30 ], [ 42, 27 ], [ 26, 40 ] ]) P.p(x, y, "#fff4e8");
  });
  function bottle(P, cx, y0, y1, rf, fill, o) {
    o = o || {};
    layer(P, Q => lathe(Q, cx, y0, y1, rf, fill), {
      lit: o.matte ? latheLit(cx, rf) : glassLit(cx, rf),
      cast: o.cast || 0
    });
    if (o.glint !== false) for (let y = y0; y < y1; y++) {
      const r = rf(y);
      if (r > 3 && (o.gl && o.gl(y) || !o.gl && y % 9 > 1)) P.p(Math.round(cx - r * .55), y, "rgba(255,255,255,0.75)");
    }
  }
  def("식용유", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 7 ? 3.6 : y < 10 ? 3 : y < 19 ? 3 + (y - 10) * .95 : y > 31 && y < 37 ? 10.5 : y > 60 ? 11.5 - (y - 60) : 11.5;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 7 ? "#c83a2a" : y < 10 ? "#e8e8e0" : y < 14 ? "#d8dcc8" : y > 38 && y < 53 ? y === 39 || y === 52 ? "#2a6a2a" : "#e8d858" : "#e0b428");
    hgs(P, 10, 42, "#2a5a2a", "식용");
    P.r(9, 49, 14, 1, "#5a8a3a");
    disc(P, 23, 45, 1.6, 1.6, "#f0a020");
  });
  def("간장 한 병", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 8 ? 3.4 : y < 17 ? 2.6 : y < 26 ? 2.6 + (y - 17) * .85 : y > 60 ? 10.2 - (y - 60) : 10.2;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 8 ? "#c8302a" : y > 35 && y < 52 ? y === 36 || y === 51 ? "#b82a2a" : "#ece6d8" : t < .14 || t > .9 ? "#5a2418" : "#2a1410");
    hgs(P, 11, 39, "#1e1414", "간장");
    disc(P, 20.5, 47.5, 2.4, 2.4, "#c8302a");
    P.p(20, 47, "#f0d8c8");
    txt(P, 8, 47, 8, "#6a5a4a", 2);
  });
  const AD = slot => SX.adOf ? SX.adOf(slot) : {
    brand: "광고",
    sub: "AD",
    bg: "#f2d034",
    fg: "#1c1c1c",
    acc: "#d8402a"
  };
  def("광고 음료캔", 1, 1, P => {
    const a = AD("drink");
    tin(P, 5, 2, 22, 28, 4, a.bg, Q => {
      Q.r(5, 7, 22, 2, a.acc);
      Q.r(5, 25, 22, 1, a.acc);
      A.PP.label(Q, 5, 10, a.brand, a.fg, 9, 22);
      A.PP.mini(Q, 5, 20, a.sub, a.acc, 22);
    });
    glint(P, 8, 8);
    glint(P, 8, 9);
  });
  def("광고 사이다", 1, 2, P => {
    const a = AD("soda");
    const rf = y => y < 2 ? 0 : y < 7 ? 3.6 : y < 9 ? 4.5 : y < 18 ? 3.4 + (y - 9) * .75 : y > 60 ? 10.2 - (y - 60) : 10.2;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 7 ? a.acc : y < 9 ? "#e0ece0" : y > 27 && y < 47 ? y === 28 || y === 46 ? a.acc : a.bg : "#b8e0c4");
    A.PP.label(P, 6, 30, a.brand, a.fg, 9, 20);
    A.PP.mini(P, 6, 40, a.sub, a.acc, 20);
    const g = new SX.Rng(11);
    for (let k = 0; k < 10; k++) {
      const x = 9 + g.i(14), y = 14 + g.i(46);
      if (y > 26 && y < 48) continue;
      P.p(x, y, "#f0fff4");
    }
  });
  def("광고 과자", 2, 1, P => {
    const a = AD("snack");
    layer(P, Q => {
      Q.r(4, 3, 54, 25, a.bg);
      pouchSeal(Q, 2, 3, 4, 25, a.acc, true);
      pouchSeal(Q, 56, 3, 4, 25, a.acc, true);
      Q.r(8, 6, 28, 19, a.acc);
      Q.r(9, 7, 26, 17, a.bg);
      A.PP.label(Q, 9, 9, a.brand, a.fg, 11, 26);
      A.PP.mini(Q, 9, 20, a.sub, a.acc, 26);
    }, {
      lit: pillowF(2, 3, 58, 25, 3),
      cast: 0
    });
    for (const [x, y] of [ [ 41, 9 ], [ 47, 14 ], [ 42, 18 ], [ 50, 8 ] ]) {
      disc(P, x, y, 3, 2.4, "#e8b860");
      P.p(x - 1, y - 1, "#f8d890");
    }
  });
  def("광고 초코바", 1, 1, P => {
    const a = AD("bar");
    layer(P, Q => {
      rrect(Q, 1, 7, 30, 18, 2, a.bg);
      Q.r(1, 7, 3, 18, a.acc);
      Q.r(28, 7, 3, 18, a.acc);
      A.PP.label(Q, 4, 9, a.brand, a.fg, 9, 24);
      A.PP.mini(Q, 4, 19, a.sub, a.acc, 24);
    }, {
      lit: pillowF(1, 7, 30, 18, 2),
      cast: -1
    });
    for (let y = 8; y < 24; y += 2) {
      P.p(1, y, "#5a3a20");
      P.p(30, y, "#5a3a20");
    }
  });
  def("생수병", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 7 ? 3.6 : y < 9 ? 4.5 : y < 18 ? 3.4 + (y - 9) * .75 : y > 60 ? 10.2 - (y - 60) : y % 5 === 0 && (y < 30 || y > 43) ? 9.6 : 10.2;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 7 ? "#2a64b8" : y < 9 ? "#e0e8ec" : y < 16 ? "#d4e8f0" : y > 30 && y < 43 ? y === 31 || y === 42 ? "#2a64b8" : "#4a8ad0" : y % 5 === 0 ? "#8ab8d0" : "#a8d0e4");
    P.line(8, 47, 24, 44, "#e8f4fc");
    hgs(P, 9, 35, "#f0f8ff", "샘물");
  });
  def("탄산수", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 7 ? 3.6 : y < 9 ? 4.5 : y < 20 ? 3.4 + (y - 9) * .6 : y > 60 ? 10 - (y - 60) : 10;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 7 ? "#3a8a3a" : y < 9 ? "#e0ece0" : y < 13 ? "#d8ecde" : y > 28 && y < 45 ? y === 29 || y === 44 ? "#e8f0c0" : "#7ab848" : "#b0dcc0");
    hgs(P, 10, 32, "#f4fff0", "탄산");
    P.r(9, 39, 14, 1, "#4a8a2a");
    const g = new SX.Rng(9);
    for (let k = 0; k < 14; k++) {
      const x = 9 + g.i(14), y = 14 + g.i(46);
      if (y > 27 && y < 46) continue;
      P.p(x, y, "#f0fff4");
      if (g.chance(.4)) P.p(x + 1, y, "#d0f0dc");
    }
  });
  def("이온음료", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 8 ? 4 : y < 10 ? 4.8 : y < 18 ? 3.6 + (y - 10) * .8 : y > 60 ? 10.4 - (y - 60) : 10.4;
    bottle(P, 16, 2, 63, rf, (x, y, t) => y < 8 ? "#e8ecf0" : y < 10 ? "#3a8aa8" : y < 14 ? "#e4ecf2" : y > 20 && y < 38 ? "#3a8aa8" : y > 37 && y < 54 ? y === 38 ? "#e0c040" : "#eef2f4" : "#dce6ee", {
      gl: y => y > 12 && y % 7 > 1
    });
    disc(P, 16, 29, 3, 3.6, "#eaf6fa");
    P.poly([ [ 14, 28 ], [ 16, 23 ], [ 18, 28 ] ], "#eaf6fa");
    P.p(15, 28, "#ffffff");
    hgs(P, 10, 41, "#2a6a88", "이온");
    txt(P, 9, 48, 14, "#8aa8b8", 5);
  });
  def("우유팩", 1, 2, P => {
    layer(P, Q => {
      Q.r(4, 24, 16, 38, "#ecebe4");
      Q.poly([ [ 20, 24 ], [ 28, 19 ], [ 28, 57 ], [ 20, 62 ] ], "#c8c8c0");
      Q.poly([ [ 4, 24 ], [ 20, 24 ], [ 24, 10 ], [ 8, 10 ] ], "#dcdcd4");
      Q.poly([ [ 20, 24 ], [ 28, 19 ], [ 24, 10 ] ], "#b8b8b0");
      Q.poly([ [ 8, 10 ], [ 24, 10 ], [ 24, 7 ], [ 8, 7 ] ], "#e4e4dc");
      Q.r(4, 34, 16, 12, "#3a6ab8");
      Q.poly([ [ 20, 34 ], [ 28, 29 ], [ 28, 41 ], [ 20, 46 ] ], "#2a5098");
      hgs(Q, 6, 36, "#f4f8ff", "우");
      hgs(Q, 12, 36, "#f4f8ff", "유");
      disc(Q, 12, 52, 3.5, 3, "#ffffff");
      Q.p(10, 51, "#2a2a2a").p(14, 52, "#2a2a2a").r(9, 54, 7, 1, "#e8b8b8");
      Q.r(4, 24, 16, 1, "#ffffff");
      Q.line(8, 10, 4, 24, "#ffffff");
    }, {
      cast: 0,
      bevel: [ 0, -1 ]
    });
  });
  def("주스팩", 1, 1, P => {
    layer(P, Q => {
      rod(Q, 21, 7, 25, 1, 1.5, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1 ? (l * 1.2 | 0) % 2 ? "#e84a3a" : "#f4f0e8" : null);
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 5, 11, 17, 19, 6, 4, "#e88a24");
      disc(Q, 13, 21, 6, 6, "#f4c040");
      disc(Q, 13, 21, 5, 5, "#f8a830");
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        Q.line(13, 21, 13 + Math.cos(a) * 4.5, 21 + Math.sin(a) * 4.5, "#f8dc80");
      }
      Q.r(5, 11, 17, 3, "#3a8a3a");
      hgs(Q, 7, 11, "#f4f0e0", "주");
      Q.r(23, 16, 3, 1, "#b8601a").r(23, 19, 4, 1, "#b8601a").r(23, 22, 3, 1, "#b8601a");
      Q.r(20, 8, 2, 1, "#6a3a10");
    }, {
      cast: -1
    });
  });
  def("청주 한 병", 1, 2, P => {
    const rf = y => y < 1 ? 0 : y < 8 ? 3.4 : y < 21 ? 3 : y < 29 ? 3 + (y - 21) * .95 : y > 60 ? 10.6 - (y - 60) : 10.6;
    bottle(P, 16, 1, 63, rf, (x, y, t) => y < 8 ? "#d8b048" : y > 33 && y < 55 ? x > 9 && x < 22 ? "#f0ebdc" : "#e4dcb8" : y < 26 ? "#e8e4d0" : "#e8dca8");
    P.r(15, 36, 2, 14, "#1e1a18").r(13, 38, 2, 2, "#1e1a18").r(17, 42, 2, 1, "#1e1a18").r(13, 45, 1, 3, "#1e1a18");
    disc(P, 12, 51.5, 1.8, 1.8, "#c8302a");
    P.r(12, 8, 8, 2, "#b89030");
  });
  def("소주 두 병", 1, 2, P => {
    const one = (cx, dy) => {
      const rf = y => {
        y -= dy;
        return y < 0 ? 0 : y < 4 ? 2.6 : y < 15 ? 2.3 : y < 23 ? 2.3 + (y - 15) * .52 : y > 51 ? 6.5 - (y - 51) : 6.5;
      };
      bottle(P, cx, dy, dy + 53, rf, (x, y, t) => {
        const yy = y - dy;
        return yy < 4 ? "#4a8a5a" : yy > 29 && yy < 42 ? yy === 30 || yy === 41 ? "#2a6a3a" : "#e0ecd8" : "#3aa05a";
      }, {
        cast: -2,
        gl: y => (y - dy) % 7 > 1
      });
      hgs(P, Math.round(cx - 3), dy + 33, "#2a6a3a", "소");
    };
    one(10, 3);
    one(21, 10);
  });
  def("만년필", 1, 1, P => {
    const x0 = 3.5, y0 = 28.5, x1 = 28.5, y1 = 3.5, rf = l => l < 6 ? .6 + l * .38 : l < 9 ? 2.2 : l < 23 ? 3 : 3.3;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 5, (l, d, L) => {
      if (l < 0 || l > L) return null;
      if (l > 23 && l < L - 1.5 && d < -3.3 && d > -4.8) return "#e0bc58";
      if (Math.abs(d) > rf(l)) return null;
      if (l < 6) return Math.abs(d) < .45 && l > .8 ? "#3a2a10" : "#dcb450";
      if (l >= 21.5 && l < 23) return "#e0bc58";
      if (l > L - 1.5) return "#e0bc58";
      return l < 9 ? "#3a3c42" : "#22242a";
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    rod(P, x0, y0, x1, y1, 3, (l, d) => Math.abs(l - 4.6) < .6 && Math.abs(d) < .6 ? "#3a2a10" : null);
  });
  def("태블릿", 2, 1, P => {
    layer(P, Q => {
      rrect(Q, 3, 4, 58, 25, 3, "#2a2c32");
      Q.r(4, 27, 56, 2, "#8a929a");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    P.r(7, 7, 50, 18, "#3a4a8a");
    for (let y = 7; y < 25; y++) P.r(7, y, 50, 1, mix("#3a5aa8", "#7a4a9a", (y - 7) / 18));
    const ac = [ "#e0a040", "#5ab86a", "#e05a5a", "#5ab0e0", "#e0e0e0", "#b07ae0" ];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) {
      const x = 11 + k * 7, y = 10 + r * 7;
      P.r(x, y, 4, 4, ac[(k + r * 3) % 6]).p(x, y, "#ffffff");
    }
    P.poly([ [ 7, 25 ], [ 22, 7 ], [ 30, 7 ], [ 15, 25 ] ], "rgba(255,255,255,0.12)");
    P.p(5, 16, "#4a4e58");
    P.line(52, 7, 45, 14, "#e8f0f8").line(45, 14, 47, 19, "#e8f0f8").line(45, 14, 40, 15, "#c8d4e0");
  });
  def("노트북", 2, 2, P => {
    layer(P, Q => {
      rrect(Q, 8, 3, 48, 33, 2, "#3a3d44");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    for (let y = 6; y < 33; y++) P.r(11, y, 42, 1, mix("#2a6aa8", "#1a3a6a", (y - 6) / 27));
    P.r(14, 9, 18, 12, "#e8ecf0").r(14, 9, 18, 2, "#4a7ac0").r(34, 14, 15, 10, "#e8ecf0").r(34, 14, 15, 2, "#c8604a");
    txt(P, 16, 13, 14, "#8a9098", 2);
    txt(P, 16, 16, 12, "#8a9098", 3);
    txt(P, 36, 18, 11, "#8a9098", 4);
    P.r(11, 30, 42, 3, "#1a1e28");
    P.poly([ [ 11, 33 ], [ 26, 6 ], [ 32, 6 ], [ 17, 33 ] ], "rgba(255,255,255,0.07)");
    layer(P, Q => {
      Q.poly([ [ 8, 36 ], [ 56, 36 ], [ 61, 57 ], [ 3, 57 ] ], "#aab2ba");
      Q.r(3, 57, 58, 3, "#6a7078");
      for (let r = 0; r < 4; r++) {
        const y = 38 + r * 3, ix = 10 - r * 1.1, w = 44 + r * 2.2;
        for (let k = 0; k < 12; k++) Q.r(Math.round(ix + k * w / 12), y, Math.max(2, Math.round(w / 12) - 1), 2, "#2a2c32");
      }
      Q.r(Math.round(15), 50, 34, 1, "#2a2c32");
      Q.poly([ [ 24, 52 ], [ 40, 52 ], [ 41, 56 ], [ 23, 56 ] ], "#9aa2aa");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(4, 57, 56, 1, "#c8d0d8");
  });
  def("기밀 서류", 2, 1, P => {
    layer(P, Q => {
      for (let k = 0; k < 3; k++) Q.r(50 + k, 5 + k * 2, 10, 20, k % 2 ? "#e8e4d8" : "#f4f0e4");
      txt(Q, 53, 9, 6, "#8a8a80", 2);
      txt(Q, 53, 12, 5, "#8a8a80", 3);
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(4, 3, 16, 4, "#c8a468");
      Q.r(3, 6, 52, 23, "#d8b878");
      Q.r(3, 6, 52, 1, "#e8cc90");
      Q.r(12, 10, 26, 12, "#c8302a");
      Q.r(13, 11, 24, 10, "#d8b878");
      hgs(Q, 15, 13, "#c8302a", "기밀", 1);
      Q.r(41, 14, 2, 1, "#c8302a").r(40, 16, 6, 1, "#b02a26");
      disc(Q, 46, 20, 2, 2, "#8a6a3a");
      Q.line(46, 20, 50, 24, "#c8302a").line(46, 20, 44, 25, "#c8302a");
      noise(Q, 4, 7, 50, 21, [ "#c8a468", "#b89458" ], 40, 6);
      txt(Q, 8, 25, 24, "#8a6a3a", 7);
    }, {
      lit: pillowF(3, 6, 52, 23, 4),
      bevel: [ 1, -2 ]
    });
    layer(P, Q => {
      Q.r(47, 2, 2, 8, "#c8d0d8");
      Q.r(49, 3, 1, 6, "#8a929a");
      Q.r(47, 2, 3, 1, "#c8d0d8");
    }, {
      cast: -1
    });
  });
  def("손목시계", 1, 1, P => {
    const st = "#7a4a2a";
    layer(P, Q => {
      Q.r(11, 1, 10, 30, st);
      for (let y = 2; y < 31; y++) if (y < 8 || y > 24) Q.p(12, y, "#a8744a").p(19, y, "#a8744a");
      for (const y of [ 25, 28 ]) Q.r(15, y, 2, 1, "#3a2210");
    }, {
      lit: vcylF(11, 10),
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 16, 16, 9.5, 9.5, "#c8a040");
      Q.r(25, 14, 3, 4, "#c8a040");
    }, {
      lit: ballF(16, 16, 10, 10),
      cast: -2
    });
    disc(P, 16, 16, 7.5, 7.5, "#f0ecdc");
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, rr = k % 3 ? 6.3 : 5.8;
      P.p(Math.round(16 + Math.cos(a) * rr - .5), Math.round(16 + Math.sin(a) * rr - .5), k % 3 ? "#8a8a80" : "#2a2a2a");
    }
    P.line(16, 16, 16, 11, "#1e1e22").line(16, 16, 19, 18, "#1e1e22").line(16, 16, 12, 20, "#c83a2e");
    P.p(16, 16, "#c8a040");
    P.p(12, 11, "#ffffff").p(13, 10, "#ffffff").p(11, 12, "#f0f4f8");
  });
  def("금목걸이", 1, 1, P => {
    const au = RP("#d8a830"), pts = [];
    for (let k = 0; k <= 60; k++) {
      const a = Math.PI * (1.05 + k / 60 * .9);
      pts.push([ 15.5 + Math.cos(a) * 12, 13 + Math.sin(a) * 9 ]);
    }
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      pts.push([ 27.4 - t * 11.4 + Math.sin(t * 3) * 1.5, 11 + t * 10 ]);
    }
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      pts.push([ 16 - t * 11.4 - Math.sin(t * 3) * 1.5, 21 - t * 10 ]);
    }
    pts.forEach((p, i) => {
      P.p(p[0], p[1] + 1, au[1]);
    });
    pts.forEach((p, i) => {
      P.p(p[0], p[1], (i >> 1) % 2 ? au[5] : au[3]);
    });
    layer(P, Q => {
      disc(Q, 16, 24.5, 5, 5, "#d8a830");
      Q.r(15, 18, 2, 3, "#d8a830");
    }, {
      lit: ballF(16, 24.5, 5, 5),
      cast: -1
    });
    disc(P, 16, 24.5, 2.2, 2.2, "#c02a3a");
    P.p(15, 23, "#ff8a9a");
    star(P, 13, 22, "#fffae8");
  });
  def("산삼 뿌리", 1, 2, P => {
    const leaf = (cx, cy, s) => {
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * .62, lx = cx + Math.cos(a) * 3.2 * s, ly = cy + Math.sin(a) * 3.2 * s;
        layer(P, Q => blob(Q, lx, ly, 2 * s, 2 * s, () => "#4a8a3a"), {
          lit: ballF(lx, ly, 2 * s, 2 * s),
          cast: 0
        });
      }
    };
    P.line(16, 21, 16, 13, "#5a7a3a").line(16, 13, 8, 10, "#5a7a3a").line(16, 13, 24, 10, "#5a7a3a").line(16, 13, 16, 7, "#5a7a3a");
    leaf(7, 9, 1.1);
    leaf(25, 9, 1.1);
    leaf(16, 6, 1.2);
    for (const [x, y] of [ [ 15, 12 ], [ 17, 12 ], [ 16, 11 ], [ 16, 13 ], [ 14, 13 ], [ 18, 13 ] ]) P.p(x, y, "#d83a2a");
    P.p(15, 11, "#ff8a7a");
    const skin = "#d8c49a";
    layer(P, Q => {
      for (let y = 20; y < 28; y++) Q.r(15 + y % 2, y, 2, 1, "#a88a5a");
      for (let y = 27; y < 46; y++) {
        const w = 4 + Math.round(Math.sin((y - 27) / 19 * Math.PI) * 3);
        Q.r(16 - w, y, w * 2, 1, skin);
      }
      rod(Q, 13, 44, 7, 60, 3, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 2.6 - l * .12 ? skin : null);
      rod(Q, 19, 44, 25, 61, 3, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 2.6 - l * .12 ? skin : null);
      for (let y = 29; y < 44; y += 3) Q.r(12, y, 8, 1, "#b8a070");
    }, {
      lit: (x, y) => y < 44 ? cylLv((x + .5 - 11) / 10) : x < 16 ? cylLv((x + .5 - 5) / 9) : cylLv((x + .5 - 18) / 9),
      cast: 0
    });
    const hair = [ [ 10, 36, 3, 40 ], [ 22, 34, 29, 38 ], [ 9, 50, 3, 54 ], [ 7, 58, 4, 62 ], [ 24, 52, 29, 56 ], [ 26, 59, 29, 62 ], [ 21, 40, 27, 44 ], [ 11, 42, 5, 47 ] ];
    for (const [a, b, c, d] of hair) {
      P.line(a, b, (a + c) / 2 + 1, (b + d) / 2, "#e8dcc0").line((a + c) / 2 + 1, (b + d) / 2, c, d, "#e8dcc0");
    }
  });
  def("금두꺼비", 2, 2, P => {
    const au = "#d8a030", dk = "#8a5a10";
    const coin = (x, y) => layer(P, Q => {
      disc(Q, x, y + 1.5, 7, 2.6, sh(au, -.3));
      Q.r(x - 7, y, 15, 2, sh(au, -.2));
      disc(Q, x, y, 7, 2.6, au);
      Q.r(x - 1, y - 1, 3, 1, sh(au, -.45));
    }, {
      lit: (xx, yy) => yy > y ? -1 : 1,
      cast: -1
    });
    coin(10, 57);
    coin(27, 59);
    coin(47, 58);
    coin(55, 54);
    coin(17, 53);
    const part = (fn, cx, cy, rx, ry) => layer(P, fn, {
      lit: ballF(cx, cy, rx, ry),
      cast: -2
    });
    part(Q => {
      disc(Q, 12, 44, 9, 8, au);
      disc(Q, 52, 44, 9, 8, au);
    }, 32, 40, 27, 11);
    part(Q => disc(Q, 32, 40, 21, 14, au), 29, 36, 21, 14);
    for (const [x, y] of [ [ 20, 31 ], [ 29, 28 ], [ 39, 30 ], [ 24, 38 ], [ 35, 37 ], [ 45, 39 ], [ 16, 41 ], [ 29, 45 ] ]) {
      P.p(x, y, "#fff0a0").p(x + 1, y, "#f0c860").p(x + 1, y + 1, dk).p(x, y + 1, "#b88420");
    }
    part(Q => {
      disc(Q, 21, 52, 6, 4, au);
      disc(Q, 43, 52, 6, 4, au);
    }, 32, 49, 22, 6);
    for (const lx of [ 21, 43 ]) for (let k = -1; k <= 1; k++) P.r(lx + k * 3, 55, 2, 1, dk);
    part(Q => disc(Q, 32, 29, 17, 9.5, au), 29, 26, 17, 10);
    part(Q => {
      disc(Q, 22, 20, 6, 5.5, au);
      disc(Q, 42, 20, 6, 5.5, au);
    }, 32, 17, 16, 7);
    for (const x of [ 22, 42 ]) {
      disc(P, x, 20.5, 3.2, 2.8, "#1a1210");
      disc(P, x, 20.5, 1.8, 1.5, "#c01e2a");
      P.p(x - 1, 19, "#ffffff");
    }
    P.line(17, 32, 25, 34, dk).line(39, 34, 47, 32, dk);
    layer(P, Q => {
      disc(Q, 32, 35, 6, 4.5, "#e8bc48");
      Q.r(31, 34, 3, 2, "#6a4410");
    }, {
      lit: ballF(32, 35, 6, 4.5),
      cast: -2
    });
    star(P, 20, 25, "#ffffff");
    star(P, 15, 38, "#fff8d0");
    glint(P, 10, 41, "#fff8d0");
  });
  def("낡은 학생증", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 2, 7, 28, 19, 2, "#e8ecf0");
      Q.r(2, 8, 28, 5, "#3a64a8");
      disc(Q, 6, 10.5, 2, 2, "#e8c050");
      hgs(Q, 10, 8, "#f0f4f8", "학생");
      Q.r(4, 14, 8, 10, "#9ab0c8");
      disc(Q, 8, 18, 2.5, 3, "#e0b48c");
      Q.r(5, 14, 6, 3, "#2a2019");
      Q.r(4, 21, 8, 3, "#28406e");
      Q.p(7, 18, "#1a1418").p(9, 18, "#1a1418");
      txt(Q, 14, 15, 13, "#3a4a6a", 3);
      txt(Q, 14, 18, 11, "#6a7a8a", 4);
      txt(Q, 14, 21, 12, "#6a7a8a", 5);
      Q.r(14, 23, 9, 1, "#2a2a2a");
      noise(Q, 3, 8, 26, 17, [ "#c8ccd0", "#b8b0a0" ], 30, 9);
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    P.x.clearRect(28, 24, 2, 2);
    P.p(28, 24, "#b8bcc4");
  });
  def("군번줄", 1, 1, P => {
    const ch = pts => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = pts[i], [c, d] = pts[i + 1], n = Math.max(Math.abs(c - a), Math.abs(d - b));
        for (let k = 0; k <= n; k++) P.p(a + (c - a) * k / n, b + (d - b) * k / n, k % 2 ? "#6a7078" : "#d0d6dc");
      }
    };
    ch([ [ 9, 12 ], [ 7, 6 ], [ 11, 2 ], [ 18, 2 ], [ 23, 5 ], [ 20, 13 ] ]);
    const tag = (x, y, rub) => layer(P, Q => {
      rrect(Q, x, y, 11, 16, 3, rub ? "#26282c" : "#b8c0c8");
      rrect(Q, x + 1, y + 1, 9, 14, 3, "#b8c0c8");
      disc(Q, x + 5.5, y + 2.5, 1, 1, "#1a1c20");
      for (let k = 0; k < 4; k++) Q.r(x + 2, y + 5 + k * 2, 5 + k * 3 % 3, 1, "#e8eef4"), 
      Q.r(x + 2, y + 6 + k * 2, 5 + k * 3 % 3, 1, "#6a7078");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    tag(4, 11, false);
    tag(15, 13, true);
    glint(P, 6, 13);
    glint(P, 17, 15);
  });
  def("회사 사원증", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 8, 0 ], [ 11, 0 ], [ 16, 7 ], [ 13, 7 ] ], "#2a3a6a");
      Q.poly([ [ 21, 0 ], [ 24, 0 ], [ 19, 7 ], [ 16, 7 ] ], "#223260");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(14, 6, 4, 4, "#b8c0c8");
      Q.r(15, 7, 2, 2, "#6a7078");
    }, {
      bevel: [ 1, -1 ]
    });
    layer(P, Q => {
      rrect(Q, 7, 9, 18, 22, 2, "#d8e4ec");
      Q.r(8, 10, 16, 20, "#f4f4f0");
      Q.r(8, 10, 16, 5, "#b82a36");
      Q.r(10, 11, 3, 3, "#f4f4f0").p(11, 12, "#b82a36");
      Q.r(12, 16, 8, 7, "#8aa0b8");
      disc(Q, 16, 19.5, 2.3, 2.8, "#e0b48c");
      Q.r(13, 16, 6, 2, "#2a2019");
      Q.r(12, 21, 8, 2, "#2a2a30");
      txt(Q, 10, 25, 12, "#2a2a30", 2);
      for (let x = 10; x < 22; x++) Q.r(x, 27, 1, 2, x % 2 || x % 5 === 0 ? "#2a2a30" : "#f4f4f0");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    P.r(8, 10, 1, 9, "#ffffff");
  });
  def("낡은 지갑", 1, 1, P => {
    layer(P, Q => {
      Q.r(7, 5, 17, 8, "#8aa878");
      Q.r(7, 5, 17, 1, "#a8c498");
      txt(Q, 9, 7, 10, "#5a7a4a", 3);
      disc(Q, 20, 8.5, 1.5, 1.5, "#5a7a4a");
      Q.r(19, 6, 7, 6, "#3a6ab8");
      Q.r(19, 6, 7, 1, "#6a9ae0");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 3, 10, 26, 19, 3, "#6a4228");
      for (let x = 5; x < 27; x += 2) Q.p(x, 12, "#a07a50").p(x, 26, "#a07a50");
      for (let y = 12; y < 27; y += 2) Q.p(5, y, "#a07a50").p(26, y, "#a07a50");
      noise(Q, 4, 11, 24, 17, [ "#8a5a38", "#5a3620", "#9a6a44" ], 40, 5);
      Q.r(3, 10, 26, 1, "#8a5a38");
    }, {
      lit: pillowF(3, 10, 26, 19, 2),
      cast: -2
    });
  });
  def("선로 반장의 공구 주머니", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 7, 3, 5, 10, 2, "#d8a020");
      for (let y = 5; y < 12; y += 2) Q.r(8, y, 3, 1, "#b88418");
      Q.r(13, 5, 2, 8, "#e0c050");
      Q.p(13, 4, "#3a3028").p(14, 4, "#c09a70");
      Q.r(17, 6, 3, 7, "#a8b0b8");
      rrect(Q, 16, 2, 6, 5, 2, "#a8b0b8");
      Q.x.clearRect(18, 2, 2, 3);
      Q.thick(23, 12, 22, 4, 2, "#c0302a");
      Q.thick(26, 12, 27, 4, 2, "#c0302a");
    }, {
      lit: x => x < 10 ? 1 : 0,
      bevel: [ 1, -2 ],
      cast: 0
    });
    P.r(8, 7, 2, 1, "#7a5810").r(17, 9, 2, 1, "#6a7078").p(23, 8, "#7a1a16").p(27, 7, "#7a1a16");
    layer(P, Q => {
      rrect(Q, 4, 11, 24, 19, 3, "#8a5630");
      noise(Q, 5, 13, 22, 16, [ "#9a6238", "#7a4a28", "#946038" ], 45, 11);
      Q.r(5, 11, 22, 1, "#a87048");
      Q.r(6, 12, 20, 1, "#5e3820");
      for (let y = 14; y < 28; y += 2) Q.p(5, y, "#c49a68").p(26, y, "#c49a68");
    }, {
      lit: pillowF(4, 11, 24, 19, 2),
      cast: -2
    });
    layer(P, Q => {
      rrect(Q, 8, 17, 16, 11, 2, "#9a6438");
      Q.r(8, 17, 16, 1, "#b47c4c");
      for (let x = 10; x < 23; x += 2) Q.p(x, 18, "#d0a878").p(x, 26, "#d0a878");
      for (let y = 20; y < 26; y += 2) Q.p(9, y, "#d0a878").p(22, y, "#d0a878");
    }, {
      lit: pillowF(8, 17, 16, 11, 2),
      cast: -1
    });
    P.p(9, 18, "#e8c860").p(22, 18, "#e8c860").p(6, 13, "#d8b050").p(25, 13, "#d8b050");
    P.r(15, 18, 2, 2, "#c8a048").p(15, 18, "#f0d880");
    txt(P, 11, 22, 9, "#5a3a20", 9);
    P.line(19, 24, 21, 25, "#b8845a").line(6, 20, 7, 22, "#a87450").p(12, 27, "#6a4024");
  });
  def("은행 금고 열쇠", 1, 1, P => {
    const b = "#c09a3e", g = rodGeo(8, 8, 27, 27);
    layer(P, Q => {
      Q.r(20, 2, 8, 6, "#c83a2e");
      Q.r(21, 3, 6, 1, "#f0e0d0");
      hgs(Q, 20, 3, "#f8f0e0", "금");
      disc(Q, 21.5, 4.5, .8, .8, "#2a1a14");
      Q.line(14, 6, 20, 4, "#e8e0c8");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => rod(Q, 8, 8, 27, 27, 7, (l, d, L) => {
      const dist = Math.hypot(l, d);
      if (l < 3.5 && dist <= 6.5) {
        if (dist < 2.3) return null;
        if (dist > 4.2 && dist < 5 && (Math.atan2(d, l) * 4 / Math.PI + 8 | 0) % 2) return null;
        return b;
      }
      if (l >= 3.5 && l < 6 && Math.abs(d) <= 2.4) return b;
      if (l >= 6 && l <= L && Math.abs(d) <= 1.5) return b;
      if (l > L - 8 && l < L - .5 && Math.abs(d) >= 1.5 && Math.abs(d) <= 5 && ![ 2, 5 ].includes((l | 0) % 7)) return b;
      return null;
    }), {
      bevel: [ 2, -2 ],
      cast: -2
    });
    rod(P, 8, 8, 27, 27, 3, (l, d, L) => l > 6 && l < L && Math.abs(d + .3) < .5 ? "#f4d880" : null);
  });
  def("비상계단 열쇠", 1, 1, P => {
    const b = "#b8bcc4", g = rodGeo(8, 8, 27, 27);
    layer(P, Q => {
      Q.r(19, 2, 10, 7, "#2e9a4e");
      Q.r(20, 3, 8, 1, "#bff0c8");
      hgs(Q, 20, 3, "#f4fff4", "비");
      disc(Q, 21, 5, .8, .8, "#10301a");
      Q.line(14, 6, 19, 4, "#e8e0c8");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => rod(Q, 8, 8, 27, 27, 7, (l, d, L) => {
      const dist = Math.hypot(l, d);
      if (l < 3.5 && dist <= 6.5) {
        if (dist < 2.3) return null;
        return b;
      }
      if (l >= 3.5 && l < 6 && Math.abs(d) <= 2.4) return b;
      if (l >= 6 && l <= L && Math.abs(d) <= 1.5) return b;
      if (l > L - 7 && l < L - .5 && d >= 1.5 && d <= 5 && ![ 3 ].includes((l | 0) % 5)) return b;
      return null;
    }), {
      bevel: [ 2, -2 ],
      cast: -2
    });
    rod(P, 8, 8, 27, 27, 3, (l, d, L) => l > 6 && l < L && Math.abs(d + .3) < .5 ? "#eef2f6" : null);
  });
  const roomKey = (metal, hi, tag, tagHi, ch) => P => {
    layer(P, Q => {
      Q.r(19, 2, 10, 7, tag);
      Q.r(20, 3, 8, 1, tagHi);
      hgs(Q, 20, 3, "#fffaf0", ch);
      disc(Q, 21, 5, .8, .8, "#1a1410");
      Q.line(14, 6, 19, 4, "#e8e0c8");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => rod(Q, 8, 8, 27, 27, 7, (l, d, L) => {
      const dist = Math.hypot(l, d);
      if (l < 3.5 && dist <= 6.5) {
        if (dist < 2.3) return null;
        return metal;
      }
      if (l >= 3.5 && l < 6 && Math.abs(d) <= 2.4) return metal;
      if (l >= 6 && l <= L && Math.abs(d) <= 1.5) return metal;
      if (l > L - 8 && l < L - .5 && Math.abs(d) >= 1.5 && Math.abs(d) <= 5 && ![ 2, 5 ].includes((l | 0) % 7)) return metal;
      return null;
    }), {
      bevel: [ 2, -2 ],
      cast: -2
    });
    rod(P, 8, 8, 27, 27, 3, (l, d, L) => l > 6 && l < L && Math.abs(d + .3) < .5 ? hi : null);
  };
  def("집주인 창고 열쇠", 1, 1, roomKey("#b08a3a", "#ecd080", "#7a4a22", "#c89a68", "창"));
  def("사장실 열쇠", 1, 1, roomKey("#c8a040", "#f8e090", "#24305a", "#6a7ab0", "사"));
  def("교장실 열쇠", 1, 1, roomKey("#b8bcc4", "#eef2f6", "#226a7a", "#7ac0cc", "교"));
  def("귀금속 매장 열쇠", 1, 1, roomKey("#c8ccd4", "#ffffff", "#6a2e8a", "#b88ad0", "귀"));
  def("역무실 금고 열쇠", 1, 1, roomKey("#a8b0b8", "#e8eef4", "#c86a18", "#f0b070", "역"));
  def("약품 보관실 열쇠", 1, 1, roomKey("#98a2ac", "#dce4ec", "#b82a2a", "#f08a8a", "약"));
  def("탄약고 열쇠", 1, 1, roomKey("#7a8270", "#c8d0b8", "#4a5a22", "#9aaa6a", "탄"));
  def("금괴", 1, 1, P => {
    P.shadow(16, 26, 13, 3, .45);
    P.poly([ [ 5, 16 ], [ 27, 16 ], [ 24, 9 ], [ 8, 9 ] ], "#f0c448");
    P.r(5, 16, 23, 9, "#c8901e");
    P.poly([ [ 27, 16 ], [ 29, 15 ], [ 29, 23 ], [ 27, 25 ] ], "#8a5a10");
    P.r(8, 9, 16, 1, "#fff2b0");
    P.r(5, 16, 23, 1, "#ffe080");
    P.r(5, 24, 23, 1, "#7a4a0c");
    P.r(11, 11, 10, 4, "#d8a430");
    P.r(12, 12, 8, 1, "#b8801a");
    P.r(12, 14, 6, 1, "#b8801a");
    for (let x = 7; x < 26; x += 4) P.p(x, 20, "#e8b038");
    star(P, 9, 11, "#ffffff");
    glint(P, 25, 18, "#fff0b0");
  });
  def("5만원권 돈다발", 1, 1, P => {
    P.shadow(16, 27, 13, 3, .4);
    for (let k = 0; k < 5; k++) {
      const y = 20 - k * 2;
      P.r(3, y, 26, 2, k % 2 ? "#d8b05a" : "#e8c470");
      P.r(3, y, 26, 1, "#f4dc98");
      P.p(3, y + 1, "#a8803a").p(28, y + 1, "#a8803a");
    }
    P.r(4, 7, 24, 5, "#f0cc78");
    P.r(4, 7, 24, 1, "#fff0c0");
    disc(P, 11, 9.5, 2, 2, "#c89040");
    P.r(18, 8, 8, 1, "#b88a40");
    P.r(18, 10, 6, 1, "#b88a40");
    P.r(13, 7, 6, 15, "#f4f0e8");
    P.r(13, 7, 6, 1, "#ffffff");
    P.r(13, 12, 6, 2, "#c83a2e");
    P.r(18, 7, 1, 15, "#c8c0b0");
    glint(P, 6, 8, "#ffffff");
  });
  def("다이아몬드 반지", 1, 1, P => {
    P.shadow(16, 27, 12, 3, .45);
    layer(P, Q => {
      rrect(Q, 5, 15, 22, 11, 2, "#2a2a58");
      Q.r(6, 15, 20, 1, "#4a4a8a");
    }, {
      lit: pillowF(5, 15, 22, 11, 2),
      cast: 0
    });
    P.r(6, 18, 20, 1, "#18183a");
    layer(P, Q => {
      for (let k = 0; k < 40; k++) {
        const a = k / 40 * Math.PI * 2;
        Q.p(16 + Math.cos(a) * 6, 15 + Math.sin(a) * 3, k > 22 && k < 38 ? "#8a6418" : "#e8b838");
      }
    }, {
      cast: -1
    });
    P.poly([ [ 13, 9 ], [ 19, 9 ], [ 21, 11 ], [ 16, 15 ], [ 11, 11 ] ], "#cfe8f8");
    P.r(13, 9, 6, 1, "#ffffff");
    P.poly([ [ 16, 15 ], [ 11, 11 ], [ 21, 11 ] ], "#9ac8e8");
    P.p(16, 13, "#e8f8ff");
    star(P, 22, 7, "#ffffff");
    glint(P, 10, 9, "#ffffff");
  });
  def("명품 손목시계", 1, 1, P => {
    layer(P, Q => {
      for (let y = 1; y < 31; y++) {
        if (y > 8 && y < 24) continue;
        Q.r(11, y, 10, 1, y % 2 ? "#c8ccd4" : "#9aa0aa");
        Q.p(11, y, "#6a7078").p(20, y, "#6a7078");
      }
    }, {
      lit: vcylF(11, 10, true),
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 16, 16, 9.5, 9.5, "#d8b048");
      Q.r(25, 14, 3, 4, "#d8b048");
    }, {
      lit: ballF(16, 16, 10, 10),
      cast: -2
    });
    disc(P, 16, 16, 7.5, 7.5, "#14161c");
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, rr = 6.2;
      P.p(Math.round(16 + Math.cos(a) * rr - .5), Math.round(16 + Math.sin(a) * rr - .5), k % 3 ? "#8a8a80" : "#e8c860");
    }
    P.line(16, 16, 16, 11, "#f0f0e8").line(16, 16, 20, 17, "#f0f0e8").line(16, 16, 12, 20, "#d8b048");
    P.p(16, 16, "#d8b048");
    P.r(18, 19, 3, 2, "#2a2c34");
    P.p(19, 19, "#e8e8e0");
    P.p(12, 11, "#ffffff").p(13, 10, "#ffffff").p(11, 12, "#d8dce4");
  });
  def("야간 투시경", 2, 1, P => {
    P.shadow(32, 28, 26, 3, .45);
    layer(P, Q => {
      rrect(Q, 6, 8, 52, 16, 4, "#3a4030");
      Q.r(26, 4, 12, 6, "#2e3428");
      Q.r(28, 2, 8, 3, "#3a4030");
    }, {
      lit: pillowF(6, 4, 52, 20, 2),
      cast: 0
    });
    for (const cx of [ 17, 47 ]) {
      layer(P, Q => disc(Q, cx, 16, 9, 8, "#1c2018"), {
        lit: ballF(cx, 16, 9, 8),
        cast: -1
      });
      disc(P, cx, 16, 6, 5.5, "#0a1408");
      disc(P, cx, 16, 4, 3.5, "#1e5a2a");
      disc(P, cx - 1, 15, 2, 1.5, "#5ae07a");
      P.p(cx - 2, 14, "#c8ffd0");
    }
    P.r(28, 12, 8, 9, "#2a2e24");
    P.r(29, 13, 2, 2, "#8a9a7a");
    P.r(33, 18, 2, 2, "#c83a2e");
    P.r(7, 9, 50, 1, "#5a6248");
  });
  def("희귀 의약품 상자", 2, 1, P => {
    P.shadow(32, 28, 26, 3, .4);
    layer(P, Q => obox(Q, 4, 10, 50, 15, 5, 5, "#d8dce4", {
      front: "#e8ecf2",
      side: "#a8b0bc"
    }), {
      cast: 0
    });
    P.r(4, 16, 50, 3, "#3a6ab8");
    P.r(4, 16, 50, 1, "#6a9ae0");
    P.r(8, 12, 9, 9, "#ffffff");
    P.r(11, 13, 3, 7, "#2e9a4e");
    P.r(9, 15, 7, 3, "#2e9a4e");
    for (const [x, y] of [ [ 40, 12 ], [ 38, 14 ], [ 42, 14 ], [ 40, 16 ], [ 40, 13 ], [ 40, 15 ], [ 39, 14 ], [ 41, 14 ] ]) P.p(x, y, "#7ac8f0");
    P.r(26, 9, 7, 17, "#c83a2e");
    P.r(26, 9, 7, 1, "#f08a7a");
    P.r(28, 15, 3, 3, "#f0d070");
    txt(P, 44, 21, 8, "#6a7480", 3);
  });
  def(Array.from({
    length: 10
  }, (_, k) => "개인 금고 " + (k + 1) + "칸"), 1, 1, P => {
    P.shadow(16, 27, 13, 3, .45);
    layer(P, Q => obox(Q, 4, 9, 22, 16, 4, 4, "#6a7280", {
      front: "#8a929e",
      side: "#4a5260"
    }), {
      cast: 0
    });
    for (let y = 11; y < 24; y += 4) for (let x = 6; x < 24; x += 4) P.r(x, y, 3, 3, "#5a626e");
    layer(P, Q => {
      disc(Q, 15, 17, 5.5, 5.5, "#d8a830");
    }, {
      lit: ballF(15, 17, 5.5, 5.5),
      cast: -2
    });
    disc(P, 15, 17, 3, 3, "#6a4a10");
    P.r(15, 13, 1, 3, "#fff0a0");
    P.p(13, 15, "#fff4c0");
    P.r(4, 9, 22, 1, "#c8d0d8");
    star(P, 7, 10, "#ffffff");
  });
  def("손때 묻은 일기장", 2, 1, P => {
    layer(P, Q => {
      obox(Q, 3, 21, 52, 6, 5, 18, "#6a4228", {
        front: "#e4d8b8",
        side: "#c8bc9a"
      });
      for (let x = 4; x < 55; x += 2) Q.p(x, 23, "#b8ac8a").p(x + 1, 25, "#b8ac8a");
      Q.r(3, 27, 52, 1, "#4a2e1c");
      Q.r(3, 20, 52, 1, "#4a2e1c");
      Q.r(3, 21, 1, 7, "#5a3820");
      Q.poly([ [ 7, 18 ], [ 21, 4 ], [ 55, 4 ], [ 41, 18 ] ], "#5a3820");
      Q.poly([ [ 9, 17 ], [ 21, 5 ], [ 53, 5 ], [ 41, 17 ] ], "#6a4228");
      hgs(Q, 26, 8, "#c8a050", "일기", 1);
      noise(Q, 8, 5, 46, 14, [ "#3e2616", "#4a2e1c", "#8a5a38" ], 70, 9);
      Q.r(42, 3, 5, 25, "#3a2416");
      Q.poly([ [ 42, 20 ], [ 47, 20 ], [ 47, 27 ], [ 42, 27 ] ], "#3a2416");
      Q.r(42, 22, 5, 4, "#c8a048");
      Q.p(44, 23, "#3a2416");
      Q.r(18, 27, 3, 4, "#b82a2a");
      Q.p(18, 31, "#b82a2a").p(20, 31, "#b82a2a");
    }, {
      cast: 0
    });
    P.r(4, 21, 50, 1, "#f4ecd0");
  });
  def("병원 진료기록", 2, 1, P => {
    layer(P, Q => {
      Q.r(34, 2, 24, 22, "#f4f4ee");
      Q.r(36, 4, 24, 22, "#fafaf6");
      const ecg = [ 0, 0, 0, -1, 0, 0, -5, 4, 0, 0, -1, -1, 0, 0, 0, 0, -5, 4, 0, 0, -1, 0 ];
      for (let k = 0; k < 21; k++) Q.line(38 + k, 12 + ecg[k], 39 + k, 12 + ecg[k + 1], "#c8302a");
      txt(Q, 38, 17, 18, "#6a6a70", 3);
      txt(Q, 38, 20, 14, "#6a6a70", 4);
      for (let x = 38; x < 58; x += 4) Q.p(x, 6, "#a8b8c8");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 6, 42, 22, "#8ab8a8");
      Q.r(3, 6, 42, 1, "#b0d4c8");
      Q.r(45, 9, 3, 5, "#d8b030");
      Q.r(45, 16, 3, 5, "#c83a3a");
      Q.r(8, 10, 22, 10, "#f0f0e8");
      Q.r(10, 12, 2, 6, "#2a8a7a").r(8, 14, 6, 2, "#2a8a7a");
      hgs(Q, 15, 12, "#2a4a4a", "진료");
      txt(Q, 8, 23, 30, "#4a7a6a", 5);
    }, {
      lit: pillowF(3, 6, 42, 22, 4),
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(24, 3, 2, 7, "#c8d0d8");
      Q.r(26, 4, 1, 5, "#8a929a");
      Q.r(24, 3, 3, 1, "#c8d0d8");
    }, {
      cast: -1
    });
  });
  def("오래된 사진첩", 2, 2, P => {
    layer(P, Q => {
      Q.r(2, 7, 60, 50, "#6a2430");
      Q.r(3, 53, 58, 5, "#e8e0cc");
      for (let x = 4; x < 60; x += 2) Q.p(x, 55, "#b8ae98");
      Q.r(2, 57, 60, 2, "#4a1a22");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(4, 9, 27, 44, "#2c2826");
      Q.r(33, 9, 27, 44, "#2c2826");
    }, {
      lit: x => x > 27 && x < 31 || x > 32 && x < 36 ? -1 : 0,
      cast: 0
    });
    P.r(31, 8, 2, 46, "#1a1614");
    const photo = (x, y, w, h, fn) => layer(P, Q => {
      Q.r(x, y, w, h, "#ece4d0");
      fn(Q, x + 2, y + 2, w - 4, h - 6);
      for (const [cx, cy] of [ [ x - 1, y - 1 ], [ x + w - 2, y - 1 ], [ x - 1, y + h - 2 ], [ x + w - 2, y + h - 2 ] ]) Q.r(cx, cy, 3, 3, "#0e0c0c");
    }, {
      cast: -1
    });
    photo(7, 12, 21, 18, (Q, x, y, w, h) => {
      Q.r(x, y, w, h, "#b8986a");
      Q.r(x, y + h - 4, w, 4, "#8a6a44");
      disc(Q, x + 8, y + 5, 2.5, 2.5, "#5a3e28");
      Q.r(x + 6, y + 8, 5, 5, "#4a3020");
      disc(Q, x + 13, y + 6, 2, 2, "#5a3e28");
      Q.r(x + 12, y + 8, 4, 5, "#6a4a30");
    });
    photo(9, 34, 18, 16, (Q, x, y, w, h) => {
      Q.r(x, y, w, h, "#c8b490");
      Q.poly([ [ x + 2, y + h ], [ x + 2, y + 5 ], [ x + 7, y + 1 ], [ x + 12, y + 5 ], [ x + 12, y + h ] ], "#6a5438");
      Q.r(x + 6, y + 6, 2, 2, "#e8d8b0");
    });
    photo(36, 11, 21, 17, (Q, x, y, w, h) => {
      Q.r(x, y, w, h, "#a0a0a0");
      Q.r(x, y + h - 3, w, 3, "#707070");
      for (let k = 0; k < 4; k++) {
        disc(Q, x + 3 + k * 4, y + 3, 1.5, 1.5, "#3a3a3a");
        Q.r(x + 2 + k * 4, y + 5, 3, 4, k % 2 ? "#505050" : "#303030");
      }
    });
    photo(38, 33, 18, 17, (Q, x, y, w, h) => {
      Q.r(x, y, w, h, "#d0b488");
      disc(Q, x + 7, y + 5, 3, 3.5, "#6a4a2e");
      Q.r(x + 4, y + 8, 7, 3, "#7a5a3a");
      Q.r(x + 1, y + h - 2, w - 2, 2, "#a88a60");
    });
    P.r(5, 10, 25, 1, "#3e3a36");
  });
  def("권총", 3, 1, P => {
    layer(P, Q => {
      Q.r(50, 3, 43, 10, "#3a3c42");
      Q.r(50, 3, 3, 10, "#2a2c30");
      Q.r(90, 3, 3, 10, "#4a4e56");
      for (const x of [ 56, 59, 84 ]) Q.r(x, 3, 1, 10, "#2a2c30");
      Q.r(92, 7, 1, 2, "#0e0f12");
    }, {
      lit: hcylF(3, 10, true),
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 9, 14 ], [ 25, 14 ], [ 21, 29 ], [ 5, 29 ] ], "#2e3036");
      for (let y = 17; y < 27; y++) for (let x = 0; x < 13; x++) if ((x + y) % 2 === 0) Q.p(Math.round(10 + x - (y - 14) * .26), y, "#3c3e46");
      Q.r(4, 28, 18, 2, "#222428");
      Q.r(4, 11, 5, 4, "#2e3036");
    }, {
      lit: (x, y) => x < 10 - (y - 14) * .26 ? 1 : 0,
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(9, 11, 39, 5, "#2e3036");
      Q.r(33, 15, 14, 2, "#26282c");
      for (let x = 34; x < 46; x += 2) Q.p(x, 16, "#46484e");
      tubeRing(Q, 29, 16, 6.5, 5, 2.2, "#2e3036", .05, Math.PI - .05);
      Q.r(26, 15, 2, 5, "#1e2024");
      Q.p(27, 20, "#1e2024");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(6, 4, 45, 8, "#3e4250");
      Q.r(7, 2, 3, 2, "#2a2c32");
      Q.r(46, 2, 2, 2, "#2a2c32");
      for (let x = 9; x < 18; x += 2) Q.r(x, 5, 1, 6, "#22242a");
      Q.r(29, 5, 10, 3, "#16181c");
      Q.r(6, 10, 45, 2, "#30343c");
    }, {
      lit: hcylF(4, 8, true),
      bevel: [ 1, -2 ],
      cast: -2
    });
    P.p(8, 2, "#e8e0c0").p(47, 2, "#e8e0c0");
    P.r(10, 4, 20, 1, "#7a8090");
    P.r(40, 4, 10, 1, "#7a8090");
  });
  def("소총", 4, 1, P => {
    const fur = "#5c604a", mt = "#35383f";
    layer(P, Q => {
      for (let y = 16; y < 31; y++) {
        const t = (y - 16) / 14, x = 55 + t * t * 8;
        Q.r(Math.round(x), y, 9, 1, "#7a4428");
        if ((y - 16) % 4 === 3) Q.r(Math.round(x), y, 9, 1, "#5a3018");
      }
      Q.r(61, 29, 10, 2, "#3a3c40");
    }, {
      lit: (x, y) => {
        const t = (y - 16) / 14, x0 = 55 + t * t * 8;
        return cylLv((x + .5 - x0) / 9, true);
      },
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 3, 7 ], [ 35, 9 ], [ 35, 17 ], [ 24, 18 ], [ 3, 25 ] ], fur);
      Q.r(2, 7, 3, 18, "#26282c");
      Q.r(8, 8, 18, 1, "#7a7e66");
      Q.line(8, 14, 30, 13, "#4a4e3a");
      Q.r(16, 20, 3, 2, "#26282c");
    }, {
      lit: (x, y) => y < 9 ? 1 : y > 21 ? -1 : 0,
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 42, 16 ], [ 50, 16 ], [ 47, 30 ], [ 39, 30 ] ], fur);
      for (let y = 19; y < 29; y += 2) Q.r(Math.round(42 - (y - 16) * .2), y, 5, 1, "#4a4e3a");
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      tubeRing(Q, 53, 17, 4.5, 4, 1.8, "#2a2c32", .1, Math.PI - .1);
      Q.r(52, 16, 2, 4, "#1a1c20");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(33, 7, 40, 11, mt);
      Q.r(33, 5, 38, 2, "#26282e");
      for (let x = 34; x < 71; x += 3) Q.p(x, 5, "#50545e");
      Q.r(52, 9, 10, 3, "#16181c");
      Q.r(36, 12, 8, 1, "#50545e");
      Q.r(33, 12, 40, 1, "#26282e");
      Q.r(62, 13, 3, 2, "#6a6e78");
      Q.r(38, 1, 5, 4, "#2a2c32");
      Q.r(39, 2, 3, 1, "#50545e");
    }, {
      lit: hcylF(5, 13, true),
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(73, 7, 30, 10, fur);
      for (let x = 76; x < 101; x += 4) Q.r(x, 10, 2, 3, "#2e3024");
      Q.r(73, 5, 29, 2, "#26282e");
      for (let x = 74; x < 101; x += 3) Q.p(x, 5, "#50545e");
    }, {
      lit: hcylF(5, 12),
      bevel: [ 1, -2 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(103, 10, 16, 4, "#2e3036");
      Q.r(106, 8, 4, 7, "#2a2c32");
      Q.r(107, 2, 2, 6, "#2a2c32");
      Q.r(106, 1, 4, 2, "#2a2c32");
      Q.r(119, 8, 7, 8, "#26282c");
      for (const x of [ 121, 123 ]) Q.r(x, 9, 1, 2, "#0e0f12"), Q.r(x, 13, 1, 2, "#0e0f12");
    }, {
      lit: hcylF(8, 8, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(34, 7, 38, 1, "#6a707c");
    P.r(74, 7, 28, 1, "#7a7e66");
  });
  def("샷건", 4, 2, P => {
    const wd = "#8a5a32", mt = "#34373e";
    const sl = [];
    for (let k = 0; k <= 60; k++) {
      const t = k / 60;
      sl.push([ 14 + t * 94, 30 * (1 - t) + 25 * t + Math.sin(t * Math.PI) * 26 ]);
    }
    for (let i = 0; i < sl.length - 1; i++) P.thick(sl[i][0], sl[i][1] + 1, sl[i + 1][0], sl[i + 1][1] + 1, 3, "#3a3e2c");
    for (let i = 0; i < sl.length - 1; i++) P.thick(sl[i][0], sl[i][1], sl[i + 1][0], sl[i + 1][1], 3, "#5e6446");
    for (let i = 0; i < sl.length - 1; i++) P.line(sl[i][0], sl[i][1] - 1, sl[i + 1][0], sl[i + 1][1] - 1, "#7e8660");
    layer(P, Q => {
      Q.r(58, 48, 7, 5, "#8a929a");
      Q.r(59, 49, 5, 3, "#3a3e2c");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.poly([ [ 4, 13 ], [ 9, 13 ], [ 40, 19 ], [ 40, 27 ], [ 31, 28 ], [ 12, 32 ], [ 4, 33 ] ], wd);
      Q.r(3, 13, 3, 20, "#26282c");
      for (let k = 0; k < 5; k++) Q.line(10 + k * 5, 18 + k * .6, 20 + k * 4, 20 + k * .5, "#74482a");
    }, {
      lit: (x, y) => y < 16 ? 1 : y > 29 ? -1 : 0,
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(62, 16, 62, 5, mt);
      Q.r(62, 21, 50, 4, "#2e3036");
      Q.r(108, 20, 5, 6, "#3e424a");
      Q.r(121, 15, 2, 1, "#d8d0b0");
    }, {
      lit: hcylF(16, 9, true),
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(38, 15, 26, 13, mt);
      Q.r(46, 18, 9, 3, "#16181c");
      for (let k = 0; k < 4; k++) {
        Q.r(40 + k * 5, 20, 4, 6, "#b8302a");
        Q.r(40 + k * 5, 24, 4, 2, "#c8a048");
      }
      tubeRing(Q, 48, 28, 5, 4, 1.8, "#2a2c32", .1, Math.PI - .1);
      Q.r(47, 27, 2, 4, "#1a1c20");
    }, {
      lit: hcylF(15, 13, true),
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(72, 20, 26, 8, wd);
      for (let x = 74; x < 97; x += 3) Q.r(x, 20, 1, 8, "#5e3a1e");
    }, {
      lit: hcylF(20, 8),
      bevel: [ 1, -2 ],
      cast: -2
    });
    P.r(39, 15, 24, 1, "#6a707c");
    P.r(63, 16, 58, 1, "#7a808c");
  });
  def("9mm 탄창", 1, 1, P => {
    const sk = y => (28 - y) * .18;
    layer(P, Q => {
      for (let k = 0; k < 2; k++) {
        const y = 3 + k * 2;
        Q.r(Math.round(11 + sk(y)), y, 7, 3, "#c8a040");
        Q.r(Math.round(18 + sk(y)), y + .5, 3, 2, "#b86a3a");
        Q.p(Math.round(20 + sk(y)), y + 1, "#b86a3a");
      }
    }, {
      lit: (x, y) => (y - 3) % 2 ? -1 : 1,
      cast: 0
    });
    layer(P, Q => {
      for (let y = 7; y < 28; y++) Q.r(Math.round(9 + sk(y)), y, 13, 1, "#3a3e48");
      for (let y = 10; y < 25; y += 3) Q.r(Math.round(18 + sk(y)), y, 2, 2, "#c8a040");
      Q.r(7, 27, 16, 3, "#2a2c32");
      Q.r(7, 27, 16, 1, "#4a4e58");
    }, {
      lit: (x, y) => cylLv((x + .5 - (9 + sk(y))) / 13, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(9, 7, 13, 1, "#6a707c");
  });
  def("7mm 탄창", 1, 2, P => {
    const cxf = y => 8 + Math.pow((y - 9) / 50, 2) * 10;
    layer(P, Q => {
      for (let k = 0; k < 2; k++) {
        const y = 3 + k * 3;
        Q.r(9 + k * 2, y, 9, 3, "#c8a040");
        Q.r(18 + k * 2, y, 5, 3, "#b86a3a");
        Q.r(23 + k * 2, y + 1, 1, 1, "#b86a3a");
      }
    }, {
      lit: (x, y) => (y - 3) % 3 === 0 ? 1 : (y - 3) % 3 === 2 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      for (let y = 9; y < 60; y++) {
        const x = Math.round(cxf(y));
        Q.r(x, y, 14, 1, "#7a4428");
        if ((y - 9) % 7 === 6) Q.r(x, y, 14, 1, "#5a3018");
      }
      Q.r(Math.round(cxf(59)) - 1, 58, 16, 4, "#3a3c40");
      Q.r(Math.round(cxf(12)), 12, 14, 1, "#5a3018");
    }, {
      lit: (x, y) => cylLv((x + .5 - cxf(y)) / 14, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
  });
  const shell = (P, x, y, h, lie) => layer(P, Q => {
    if (lie) {
      Q.r(x + 5, y, h - 5, 7, "#b8302a");
      Q.r(x, y, 5, 7, "#c8a048");
      Q.r(x, y - .5, 2, 8, "#d8b858");
      for (let k = x + 7; k < x + h; k += 3) Q.r(k, y, 1, 7, "#9a2620");
      return;
    }
    Q.r(x, y, 7, h - 5, "#b8302a");
    Q.r(x, y + h - 5, 7, 5, "#c8a048");
    Q.r(x - .5, y + h - 2, 8, 2, "#d8b858");
    disc(Q, x + 3.5, y, 3.5, 1.5, "#d8483a");
    Q.p(x + 3, y, "#7a1a14");
    for (let k = y + 3; k < y + h - 6; k += 3) Q.r(x, k, 7, 1, "#9a2620");
  }, {
    lit: lie ? hcylF(y, 7, true) : vcylF(x, 7, true),
    cast: -2
  });
  def("12게이지 탄", 1, 1, P => {
    shell(P, 4, 3, 19);
    shell(P, 12, 2, 19);
    shell(P, 20, 4, 19);
    shell(P, 4, 23, 24, true);
  });
  const CALC = {
    "9mm": "#3a64a8",
    "5.56mm": "#5a6a3a",
    "7.62mm": "#8a6a2a",
    "7mm": "#5a6a3a",
    "12게이지": "#b8302a"
  };
  function ammoBox(P, W, H, cal) {
    const bc = CALC[cal] || "#8a6a3a";
    if (W >= 2 * IC) {
      layer(P, Q => {
        obox(Q, 4, 12, 48, 17, 8, 7, "#565e3c");
        Q.r(4, 12, 48, 1, "#8a9468");
        hgs(Q, 8, 16, "#e0c858", "탄약", 1);
        Q.r(8, 23, 24, 3, bc);
        for (let k = 0; k < 3; k++) {
          const x = 34 + k * 3;
          if (cal === "12게이지") {
            Q.r(x, 16, 2, 6, "#c8302a");
            Q.r(x, 22, 2, 2, "#d8b050");
          } else if (cal === "7mm") {
            Q.r(x, 15, 2, 2, "#c87a40");
            Q.r(x, 17, 2, 7, "#d8b050");
          } else {
            Q.r(x, 18, 2, 2, "#c87a40");
            Q.r(x, 20, 2, 4, "#d8b050");
          }
        }
        Q.r(44, 16, 5, 9, "#3e4430");
        Q.r(45, 17, 3, 7, "#6a7450");
      }, {
        cast: 0
      });
      layer(P, Q => {
        Q.r(18, 3, 22, 3, "#3e4430");
        Q.r(18, 3, 3, 7, "#3e4430");
        Q.r(37, 3, 3, 7, "#3e4430");
        Q.r(19, 3, 20, 1, "#7a8460");
      }, {
        bevel: [ 1, -1 ],
        cast: -2
      });
      return;
    }
    layer(P, Q => {
      Q.poly([ [ 8, 12 ], [ 11, 3 ], [ 29, 3 ], [ 26, 12 ] ], "#b8986a");
      Q.r(11, 3, 18, 1, "#d8bc88");
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 3, 14, 22, 15, 5, 5, "#c8a878");
      for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
        const x = 5 + k * 4 + r * 2, y = 10 + r * 2;
        disc(Q, x + 1, y, 1.6, 1.2, cal === "12게이지" ? "#c8302a" : "#c8a048");
        Q.p(x + 1, y - .5, cal === "12게이지" ? "#e86a5a" : "#b86a3a");
      }
      Q.r(3, 18, 22, 6, bc);
      hgs(Q, 5, 18, "#f0ece0", cal === "12게이지" ? "산탄" : "탄약");
    }, {
      cast: -2
    });
  }
  def("9mm 탄약상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "9mm"));
  def("5.56mm 탄약상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "5.56mm"));
  def("7.62mm 탄약상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "7.62mm"));
  def("5.56mm 탄통 한 개", 2, 2, (P, W, H, d) => drawAs(P, W, H, d, "5.56mm 탄통"));
  def("12게이지 탄약상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "12게이지"));
  def("9mm 탄 상자", 1, 1, (P, W, H) => ammoBox(P, W, H, "9mm"));
  def("5.56mm 탄 상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "5.56mm"));
  def("7.62mm 탄 상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "7.62mm"));
  def("12게이지 탄 상자", 2, 1, (P, W, H) => ammoBox(P, W, H, "12게이지"));
  function partCrate(P, col, tag) {
    layer(P, Q => {
      obox(Q, 3, 16, 22, 44, 5, 8, col);
      for (let y = 22; y < 58; y += 9) Q.r(4, y, 20, 1, sh(col, -.25));
      Q.r(3, 16, 22, 2, sh(col, .2));
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(6, 26, 16, 12, "#e8e2cc");
      hgs(Q, 7, 28, "#2a2a2a", "파츠");
      Q.r(7, 34, 14, 2, col);
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      disc(Q, 14, 48, 5, 5, "#8a8e96");
      disc(Q, 14, 48, 2, 2, "#3a3d42");
      for (const [dx, dy] of [ [ 0, -6 ], [ 0, 6 ], [ -6, 0 ], [ 6, 0 ] ]) Q.r(13 + dx, 47 + dy, 3, 3, "#8a8e96");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    if (tag) P.r(20, 10, 4, 4, tag);
  }
  def("하급 파츠 상자", 1, 2, P => partCrate(P, "#7a6a4a", null));
  def("중급 파츠 상자", 1, 2, P => partCrate(P, "#4a5a3a", "#6ab8e0"));
  def("상급 파츠 상자", 1, 2, P => partCrate(P, "#3a3d42", "#e0c050"));
  def("에너지 드링크", 1, 2, P => {
    layer(P, Q => {
      rrect(Q, 6, 8, 20, 52, 4, "#1a3a8a");
      Q.r(6, 8, 20, 4, "#c8ccd2");
      Q.r(6, 56, 20, 4, "#a8acb2");
      Q.poly([ [ 18, 18 ], [ 11, 34 ], [ 16, 34 ], [ 13, 48 ], [ 22, 28 ], [ 17, 28 ], [ 20, 18 ] ], "#f0d030");
      hgs(Q, 8, 50, "#ffffff", "힘");
    }, {
      lit: vcylF(6, 20),
      cast: 0
    });
    layer(P, Q => {
      Q.r(12, 4, 8, 3, "#b8bcc2");
      Q.r(14, 3, 4, 1, "#6a6e76");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("군용 응급 파우치", 1, 2, P => {
    layer(P, Q => {
      obox(Q, 3, 14, 23, 46, 4, 6, "#5a6440");
      for (let y = 18; y < 58; y += 3) Q.r(4, y, 21, 1, "#4e5838");
      Q.r(3, 14, 23, 9, "#4a5434");
      Q.r(12, 18, 5, 3, "#26282c");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(10, 30, 9, 21, "#c8302a");
      Q.r(4, 36, 21, 9, "#c8302a");
      Q.r(11, 31, 7, 1, "#e86a5a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("수술 키트", 2, 2, P => {
    layer(P, Q => {
      strap(Q, [ [ 22, 14 ], [ 24, 6 ], [ 40, 6 ], [ 42, 14 ] ], 4, "#26282c");
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 5, 20, 48, 38, 8, 10, "#b8c0c8");
      Q.r(5, 38, 48, 2, "#8a929a");
      Q.r(26, 36, 6, 6, "#6a727a");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(12, 25, 6, 16, "#2a8ad0");
      Q.r(7, 30, 16, 6, "#2a8ad0");
      hgs(Q, 30, 24, "#26282c", "수술");
      Q.r(30, 46, 18, 2, "#6a727a");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
  });
  def("방탄 수리 키트", 2, 1, P => {
    layer(P, Q => {
      obox(Q, 4, 10, 50, 18, 5, 5, "#4e5838");
      for (let x = 8; x < 52; x += 4) Q.r(x, 14, 1, 13, "#454e32");
      Q.r(4, 10, 50, 3, "#3e4630");
      Q.r(27, 10, 6, 3, "#26282c");
      hgs(Q, 32, 18, "#e0dcc0", "방탄");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 7, 5 ], [ 23, 3 ], [ 25, 21 ], [ 9, 23 ] ], "#8a8e96");
      Q.poly([ [ 10, 8 ], [ 21, 7 ], [ 22, 12 ], [ 11, 13 ] ], "#b8bcc4");
      Q.r(13, 16, 7, 1, "#6a6e76");
      Q.r(12, 19, 8, 1, "#6a6e76");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(45, 3, 9, 9, "#e0b030");
      Q.r(47, 5, 5, 5, "#26282c");
      Q.r(45, 3, 9, 1, "#f8d860");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("리튬 배터리 팩", 1, 1, P => {
    layer(P, Q => {
      obox(Q, 4, 10, 22, 18, 3, 5, "#2a2e36");
      Q.r(6, 14, 18, 8, "#3a6ab8");
      hgs(Q, 7, 15, "#e8f0ff", "Li");
      Q.r(6, 24, 18, 2, "#6fe06a");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(9, 6, 4, 4, "#c83a3a");
      Q.r(18, 6, 4, 4, "#26282c");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("차량용 배터리", 2, 1, P => {
    layer(P, Q => {
      obox(Q, 4, 10, 50, 19, 6, 6, "#26282c");
      Q.r(6, 14, 46, 9, "#3a3d42");
      hgs(Q, 10, 15, "#f0d030", "배터리");
      Q.r(40, 15, 10, 6, "#f0d030");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(12, 4, 6, 5, "#c83a3a");
      Q.r(40, 4, 6, 5, "#8a8e96");
      Q.r(14, 2, 2, 2, "#e86a5a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("태양광 충전기", 2, 2, P => {
    layer(P, Q => {
      Q.poly([ [ 6, 14 ], [ 50, 8 ], [ 58, 46 ], [ 12, 54 ] ], "#1c2a4a");
      for (let k = 1; k < 4; k++) {
        Q.line(6 + k * 11, 14 - k * 1.5, 12 + k * 11.5, 54 - k * 2, "#8aa8d0");
        Q.line(6 + k * 1.5, 14 + k * 10, 50 + k * 2, 8 + k * 9.5, "#8aa8d0");
      }
      Q.line(6, 14, 50, 8, "#c8ccd2").line(50, 8, 58, 46, "#c8ccd2").line(58, 46, 12, 54, "#c8ccd2").line(12, 54, 6, 14, "#c8ccd2");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(40, 48, 12, 8, "#2a2c30");
      Q.r(42, 50, 6, 3, "#6fe06a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  function crateOf(P, wood, bottle, label) {
    layer(P, Q => {
      obox(Q, 5, 22, 46, 34, 8, 10, wood);
      for (let y = 30; y < 56; y += 8) Q.r(6, y, 44, 1, sh(wood, -.25));
      Q.r(10, 36, 28, 10, "#e8e2cc");
      hgs(Q, 12, 38, "#3a2a1a", label);
    }, {
      cast: 0
    });
    for (let k = 0; k < 4; k++) layer(P, Q => {
      const x = 10 + k * 10;
      rrect(Q, x, 6, 7, 16, 2, bottle);
      Q.r(x + 2, 2, 3, 5, sh(bottle, -.2));
      Q.r(x + 1, 9, 1, 8, "rgba(255,255,255,0.35)");
    }, {
      cast: -1
    });
  }
  def("증류 소주 짝", 2, 2, P => crateOf(P, "#3a7a4a", "#6ab88a", "소주"));
  def("전통 청주 상자", 2, 2, P => crateOf(P, "#8a6a3a", "#e8e0c0", "청주"));
  def("숙성 양주", 1, 2, P => {
    const rf = y => y < 4 ? 2.5 : y < 18 ? 2.8 : y < 26 ? 2.8 + (y - 18) * .9 : y > 58 ? 10 - (y - 58) : 10;
    bottle(P, 16, 3, 62, rf, (x, y) => y < 8 ? "#2a1a10" : y < 30 ? "#7a3a14" : y > 34 && y < 50 ? y === 35 || y === 49 ? "#c8a040" : "#f0e2c0" : "#8a4418");
    hgs(P, 9, 39, "#5a2a0a", "양주");
  });
  def("아드레날린 주사", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 4, 24 ], [ 22, 6 ], [ 27, 11 ], [ 9, 29 ] ], "#e8c030");
      Q.poly([ [ 4, 24 ], [ 8, 20 ], [ 13, 25 ], [ 9, 29 ] ], "#c8302a");
      Q.poly([ [ 22, 6 ], [ 25, 3 ], [ 30, 8 ], [ 27, 11 ] ], "#3a3d42");
      Q.line(11, 20, 21, 10, "#fff4b0");
    }, {
      cast: 0
    });
    hgs(P, 12, 14, "#3a2a10", "A");
  });
  def("탄약상자", 1, 1, (P, W, H, d) => ammoBox(P, W, H, d.cal));
  def("수류탄", 1, 1, P => {
    layer(P, Q => {
      disc(Q, 14.5, 19.5, 9.5, 10.5, "#5a6440");
      Q.r(5, 18, 19, 3, "#c8a830");
    }, {
      lit: ballF(14.5, 19.5, 9.5, 10.5),
      cast: 0
    });
    layer(P, Q => {
      Q.r(11, 5, 8, 6, "#8a929a");
      Q.r(10, 8, 10, 2, "#6a7078");
    }, {
      lit: vcylF(10, 10, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(18, 5, 5, 3, "#9aa2aa");
      for (let y = 8; y < 22; y++) Q.r(Math.round(22 + Math.sin((y - 8) / 14 * 1.7) * 3), y, 2, 1, "#9aa2aa");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    tubeRing(P, 7, 7, 4, 4, 1.5, "#c8ccd2", -Math.PI, Math.PI, true);
    P.r(10, 7, 3, 1, "#c8ccd2");
    glint(P, 10, 13);
    glint(P, 11, 13);
  });
  const canTop = (P, lever) => {
    layer(P, Q => {
      Q.r(11, 4, 9, 5, "#8a929a");
      Q.r(10, 7, 11, 2, "#6a7078");
    }, {
      lit: vcylF(10, 11, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(19, 4, 5, 3, lever);
      for (let y = 7; y < 22; y++) Q.r(Math.round(23 + Math.sin((y - 7) / 15 * 1.6) * 2), y, 2, 1, lever);
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    tubeRing(P, 7, 6, 4, 4, 1.5, "#c8ccd2", -Math.PI, Math.PI, true);
    P.r(10, 6, 3, 1, "#c8ccd2");
  };
  def("섬광탄", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 7, 9, 16, 21, 3, "#a8aeb6");
      Q.r(7, 12, 16, 2, "#7a8088");
      Q.r(7, 25, 16, 2, "#7a8088");
      for (const y of [ 16, 20 ]) for (const x of [ 10, 14, 18 ]) rrect(Q, x, y, 2, 3, 1, "#1e2126");
    }, {
      lit: vcylF(7, 16, true),
      cast: 0
    });
    canTop(P, "#b4bac2");
    glint(P, 10, 15);
    glint(P, 10, 16);
    glint(P, 11, 22);
  });
  def("최루탄", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 7, 9, 16, 21, 3, "#6a737c");
      Q.r(7, 15, 16, 5, "#3f7fc0");
      Q.r(7, 15, 16, 1, "#6aa8e0");
      Q.r(7, 26, 16, 1, "#4a525a");
    }, {
      lit: vcylF(7, 16, true),
      cast: 0
    });
    hgs(P, 10, 26, "#dfe6ee", "CS");
    canTop(P, "#8a929a");
    glint(P, 10, 12);
    glint(P, 10, 13);
  });
  def("연막탄", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 7, 9, 16, 21, 3, "#6f7860");
      Q.r(7, 13, 16, 3, "#e4e4da");
      Q.r(7, 23, 16, 3, "#e4e4da");
      Q.r(7, 13, 16, 1, "#f6f6ee");
      Q.r(7, 28, 16, 1, "#4a5240");
    }, {
      lit: vcylF(7, 16, true),
      cast: 0
    });
    canTop(P, "#7e8674");
    glint(P, 10, 18);
    glint(P, 10, 19);
  });
  def("화염병", 1, 1, P => {
    const rf = y => y < 7 ? 0 : y < 13 ? 2.2 : y < 19 ? 2.2 + (y - 13) * .72 : y > 27 ? 6.5 - (y - 27) * 1.5 : 6.5;
    bottle(P, 16, 7, 30, rf, (x, y, t) => y < 19 ? "#3aa05a" : t < .14 || t > .9 ? "#5a7a2a" : "#9aa848", {
      cast: -2
    });
    layer(P, Q => {
      Q.r(13, 9, 6, 3, "#cfc2a2");
      Q.poly([ [ 18, 10 ], [ 22, 12 ], [ 21, 19 ], [ 19, 18 ], [ 19, 12 ] ], "#d8ccb0");
      Q.poly([ [ 13, 9 ], [ 14, 3 ], [ 16, 5 ], [ 18, 2 ], [ 19, 9 ] ], "#e2d8be");
      Q.r(15, 6, 1, 2, "#8a7a5a");
      Q.r(20, 14, 1, 2, "#8a7a5a");
      Q.r(13, 11, 6, 1, "#6a5a3a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("인계철선 키트", 2, 1, P => {
    drawAs(P, 32, 32, {}, "수류탄");
    for (const [cx, cy, c] of [ [ 41, 17, "#a8acb4" ], [ 43, 16, "#c0c4cc" ], [ 42, 18, "#9094a0" ] ]) tubeRing(P, cx, cy, 7, 6, 1.1, c, -Math.PI, Math.PI, true);
    layer(P, Q => {
      Q.r(54, 5, 3, 21, "#6a4a2c");
      Q.r(58, 7, 3, 20, "#5a3e24");
      Q.poly([ [ 54, 26 ], [ 57, 26 ], [ 55.5, 30 ] ], "#4a3018");
      Q.poly([ [ 58, 27 ], [ 61, 27 ], [ 59.5, 31 ] ], "#3e2814");
      Q.r(54, 5, 1, 21, "#8a6a44");
      Q.r(58, 7, 1, 20, "#7a5a38");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    glint(P, 44, 12);
  });
  def("곰덫", 2, 1, P => {
    layer(P, Q => {
      disc(Q, 32, 22, 27, 7, "#2e3034");
      disc(Q, 32, 21, 25, 5.5, "#3b3d40");
    }, {
      lit: pillowF(5, 15, 54, 14, 2),
      cast: 0
    });
    tubeRing(P, 32, 20, 22, 13, 2.6, "#7a7e86", -Math.PI, 0, true);
    tubeRing(P, 32, 23, 22, 8, 2.6, "#5e626a", 0, Math.PI, true);
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI + (k + .5) / 9 * Math.PI;
      P.r(Math.round(32 + Math.cos(a) * 19), Math.round(20 + Math.sin(a) * 10.5), 1, 2, "#d0d4da");
    }
    for (let k = 0; k < 9; k++) {
      const a = (k + .5) / 9 * Math.PI;
      P.r(Math.round(32 + Math.cos(a) * 19), Math.round(23 + Math.sin(a) * 5.5) - 1, 1, 2, "#c0c4ca");
    }
    layer(P, Q => {
      Q.r(28, 19, 8, 5, "#8a9098");
      Q.r(29, 20, 6, 1, "#b8bec6");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(8, 22, 3, 2, "#7a2a24");
      Q.r(53, 22, 3, 2, "#7a2a24");
    }, {
      cast: 0
    });
    for (const [cx, cy] of [ [ 57, 10 ], [ 60, 6 ] ]) tubeRing(P, cx, cy, 2.5, 2.5, 1, "#8a8e94", -Math.PI, Math.PI, true);
    glint(P, 22, 9);
    glint(P, 23, 9);
  });
  def("식칼", 2, 1, P => {
    layer(P, Q => {
      rrect(Q, 3, 12, 22, 8, 3, "#2a2426");
      for (const x of [ 8, 14, 20 ]) disc(Q, x, 16, 1.2, 1.2, "#c8ccd2");
    }, {
      lit: hcylF(12, 8, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(24, 11, 4, 10, "#aab2ba");
      for (let x = 28; x < 62; x++) {
        const t = (x - 28) / 33, bot = Math.round(22 - Math.pow(Math.max(0, t - .45) / .55, 2) * 12), top = Math.round(9 + Math.max(0, t - .85) * 12);
        if (bot <= top) continue;
        Q.r(x, top, 1, bot - top, "#b8c0c8");
        Q.r(x, top, 1, 2, "#dce2e8");
        Q.r(x, bot - 3, 1, 2, "#8a929c");
        Q.r(x, bot - 1, 1, 1, "#f0f4f8");
      }
      Q.r(44, 17, 3, 2, "#6a2a26");
      Q.p(47, 18, "#6a2a26");
    }, {
      bevel: [ 1, 0 ],
      cast: -1
    });
  });
  def("스크류드라이버", 2, 1, P => {
    layer(P, Q => rod(Q, 25, 16, 60, 16, 3, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= (l > L - 3 ? 1 : 1.6) ? "#c0c8d0" : null), {
      lit: rodLit(25, 16, 60, 16, 1.6, true),
      cast: 0
    });
    const hr = l => l < 2 ? 4 : l < 20 ? 4.6 : l < 23 ? 4.6 - (l - 20) * .8 : 2.2;
    layer(P, Q => rod(Q, 2, 16, 27, 16, 5, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= hr(l) ? l < 13 && Math.abs(d) < 3.6 && (d + 10 | 0) % 2 === 0 ? "#2a2c30" : l < 20 ? "#d8b030" : "#2a2c30" : null), {
      lit: rodLit(2, 16, 27, 16, hr, true),
      cast: -1
    });
    P.r(5, 13, 16, 1, "#fff0a0");
  });
  def("장도리", 2, 2, P => {
    const hx0 = 12, hy0 = 60, hx1 = 36, hy1 = 17, L = Math.hypot(hx1 - hx0, hy1 - hy0), ux = (hx1 - hx0) / L, uy = (hy1 - hy0) / L, rf = l => l < 3 ? 4.2 : l < 24 ? 3.6 : 2.8;
    layer(P, Q => rod(Q, hx0, hy0, hx1, hy1, 5, (l, d, L) => l >= 0 && l <= L + 2 && Math.abs(d) <= rf(l) ? l < 24 ? l < 3 ? "#1e2024" : (l | 0) % 4 === 0 ? "#8a2a22" : "#b8342a" : "#6a7078" : null), {
      lit: rodLit(hx0, hy0, hx1, hy1, rf, true),
      cast: 0
    });
    const ax = -uy, ay = ux, bx = -ux, by = -uy, cx = hx1 + ux * 2, cy = hy1 + uy * 2, T = (s, t) => [ cx + s * ax + t * bx, cy + s * ay + t * by ];
    const poly = (Q, pts, c) => Q.poly(pts.map(([a, b]) => T(a, b)), c);
    layer(P, Q => {
      poly(Q, [ [ -4, -4.5 ], [ 4.5, -4.5 ], [ 4.5, 5 ], [ -4, 5 ] ], "#6a7078");
      poly(Q, [ [ 4, -3.2 ], [ 11.5, -3.2 ], [ 11.5, 3.2 ], [ 4, 3.2 ] ], "#7e848c");
      poly(Q, [ [ 11, -4.4 ], [ 14.5, -4.4 ], [ 14.5, 4.4 ], [ 11, 4.4 ] ], "#a8b0b8");
      poly(Q, [ [ -3.5, -4.2 ], [ -10, -3.8 ], [ -15, -2 ], [ -19, 2 ], [ -17.5, 3.2 ], [ -13.5, 1.2 ], [ -9, 1.6 ], [ -3.5, 3.8 ] ], "#7e848c");
    }, {
      bevel: [ 2, -2 ],
      cast: -2
    });
    P.line(...T(-5, .2), ...T(-17, 2), "#26282c");
    P.line(...T(12, -4), ...T(12, 3), "#e0e6ec");
  });
  def("캠핑도끼", 2, 2, P => {
    const hx0 = 10, hy0 = 61, hx1 = 40, hy1 = 12, rf = l => l < 4 ? 4 : l < 16 ? 3.6 : 3;
    layer(P, Q => rod(Q, hx0, hy0, hx1, hy1, 5, (l, d, L) => l >= 0 && l <= L + 3 && Math.abs(d) <= rf(l) ? l < 16 ? (l | 0) % 3 ? "#2a2c30" : "#c8581e" : "#a0703e" : null), {
      lit: rodLit(hx0, hy0, hx1, hy1, rf),
      cast: 0
    });
    const g = rodGeo(hx0, hy0, hx1, hy1), ux = (hx1 - hx0) / g.L, uy = (hy1 - hy0) / g.L, px = -uy, py = ux;
    const cx = hx1 - ux * 3, cy = hy1 - uy * 3;
    layer(P, Q => rod(Q, cx - px * 8, cy - py * 8, cx + px * 20, cy + py * 20, 12, (l, d, L) => {
      if (l < 0 || l > L) return null;
      const w = l < 9 ? 4 : 4 + Math.pow((l - 9) / 19, 1.6) * 9;
      if (Math.abs(d) > w) return null;
      return l > L - 3 ? "#e0e6ec" : l > L - 6 ? "#a8b0b8" : "#3a3e44";
    }), {
      lit: (x, y) => {
        const q = rodGeo(cx - px * 8, cy - py * 8, cx + px * 20, cy + py * 20).f(x, y);
        return q[1] < -2 ? 1 : q[1] > 3 ? -1 : 0;
      },
      bevel: [ 1, -2 ],
      cast: -2
    });
  });
  def("군용칼", 2, 1, P => {
    layer(P, Q => {
      for (let x = 5; x < 23; x++) Q.r(x, 11, 1, 10, (x - 5 >> 1) % 2 ? "#7a5234" : "#9a6c44");
      Q.r(2, 11, 4, 10, "#6a7078");
      disc(Q, 3, 16, 2, 5, "#6a7078");
    }, {
      lit: hcylF(11, 10, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(22, 6, 4, 20, "#5a6068");
    }, {
      lit: vcylF(22, 4, true),
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      for (let x = 26; x < 62; x++) {
        const t = (x - 26) / 35, top = x < 48 ? 10 : Math.round(10 + (x - 48) / 13 * 6), bot = Math.round(22 - Math.pow(Math.max(0, t - .55) / .45, 1.6) * 6);
        if (bot <= top) continue;
        Q.r(x, top, 1, bot - top, "#5a6068");
        Q.r(x, top, 1, 1, "#9aa2aa");
        if (x > 28 && x < 46) Q.r(x, top + 3, 1, 1, "#3a3e44");
        Q.r(x, bot - 2, 1, 1, "#aab2ba");
        Q.r(x, bot - 1, 1, 1, "#dce2e8");
      }
      for (let x = 27; x < 40; x += 2) Q.p(x, 9, "#5a6068");
    }, {
      bevel: [ 1, 0 ],
      cast: -1
    });
  });
  def("소방도끼", 2, 3, P => {
    layer(P, Q => rod(Q, 33, 94, 33, 14, 4, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= (l < 3 ? 3.8 : 3) ? l < 22 ? (l | 0) % 3 ? "#26282c" : "#3a3c42" : "#e0b030" : null), {
      lit: rodLit(33, 94, 33, 14, 3, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(20, 6, 20, 14, "#b8302a");
      for (let y = 2; y < 28; y++) {
        const c = Math.abs(y - 13) / 13, x0 = Math.round(6 + c * c * 10);
        Q.r(x0, y, 21 - x0, 1, "#b8302a");
        if (y > 3 && y < 27) Q.r(x0, y, 3, 1, "#d8dee4");
      }
      Q.poly([ [ 40, 8 ], [ 60, 12 ], [ 61, 14 ], [ 40, 18 ] ], "#b8302a");
      Q.poly([ [ 52, 10 ], [ 60, 12 ], [ 61, 14 ], [ 52, 16 ] ], "#c8ced4");
    }, {
      lit: (x, y) => y < 9 ? 1 : y > 17 ? -1 : 0,
      bevel: [ 1, -2 ],
      cast: -2
    });
    P.r(22, 8, 16, 1, "#f06a5a");
  });
  def("야구방망이", 2, 3, P => {
    const x0 = 10, y0 = 91, x1 = 54, y1 = 5, rf = l => l < 2.5 ? 4.2 : l < 34 ? 2.6 : l < 62 ? 2.6 + (l - 34) * .11 : 5.6;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 7, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > rf(l)) return null;
      if (l < 2.5) return "#2a2426";
      if (l < 26) return (l * 1.4 | 0) % 3 ? "#2a2c32" : "#3e4048";
      const gr = Math.sin(d * 1.7 + l * .08) > .85;
      return gr ? "#a87c4a" : "#c8a06a";
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    rod(P, x0, y0, x1, y1, 7, (l, d) => l > 80 && l < 86 && Math.abs(d - 1.5) < 1.2 || l > 84 && l < 87 && d > 2 ? "#6a1e1e" : null);
  });
  def("하키스틱", 2, 3, P => {
    const x0 = 48, y0 = 3, x1 = 26, y1 = 80;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 4, (l, d, L) => l >= 0 && l <= L + 1 && Math.abs(d) <= 2.6 ? l < 10 ? (l | 0) % 2 ? "#e8e4dc" : "#c8c4bc" : l > 28 && l < 33 ? "#c8302a" : Math.sin(d * 2 + l * .2) > .8 ? "#a87c48" : "#c49a5e" : null), {
      lit: rodLit(x0, y0, x1, y1, 2.6, true),
      cast: 0
    });
    layer(P, Q => {
      for (let x = 4; x < 30; x++) {
        const t = (29 - x) / 25, yb = Math.round(88 - t * t * 4), yt = Math.round(yb - 8 + t * 1.5);
        Q.r(x, yt, 1, yb - yt, x % 3 ? "#2a2c32" : "#40424a");
        Q.p(x, yt, "#6a6e78");
      }
      for (let y = 78; y < 88; y++) Q.r(25, y, 5, 1, y % 3 ? "#2a2c32" : "#40424a");
    }, {
      lit: (x, y) => 0,
      bevel: [ 1, -2 ],
      cast: -2
    });
  });
  def("스패너", 2, 1, P => {
    const c = "#b0b8c0", R = RP(c);
    layer(P, Q => {
      Q.r(12, 13, 38, 6, c);
      blob(Q, 55, 16, 8, 8.5, (nx, ny) => {
        const a = Math.atan2(ny, nx);
        if (Math.abs(a) < .62 && Math.hypot(nx, ny) > .25) return null;
        return c;
      });
      blob(Q, 9, 16, 7.5, 7.5, (nx, ny) => Math.hypot(nx, ny) < .5 ? null : c);
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6;
        Q.p(Math.round(9 + Math.cos(a) * 3.9 - .5), Math.round(16 + Math.sin(a) * 3.9 - .5), c);
      }
    }, {
      bevel: [ 2, -2 ],
      cast: 0
    });
    P.r(16, 14, 30, 1, R[5]).r(16, 17, 30, 1, R[2]);
    hgs(P, 24, 14, R[2], "스");
  });
  def("몽키렌치", 2, 1, P => {
    const c = "#a8b0b8";
    layer(P, Q => {
      rrect(Q, 3, 12, 30, 9, 4, "#b8302a");
      Q.x.clearRect(6, 15, 3, 3);
      for (let x = 12; x < 32; x += 3) Q.r(x, 12, 1, 9, "#8a2420");
    }, {
      lit: hcylF(12, 9),
      cast: 0
    });
    layer(P, Q => {
      Q.r(31, 13, 14, 7, c);
      rrect(Q, 42, 6, 13, 21, 3, c);
      Q.r(50, 5, 11, 7, c);
      Q.r(51, 19, 9, 6, c);
      Q.x.clearRect(53, 12, 9, 7);
    }, {
      lit: (x, y) => y < 8 ? 1 : y > 24 ? -1 : 0,
      bevel: [ 2, -2 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(43, 20, 8, 5, "#6a7078");
      for (let x = 43; x < 51; x += 2) Q.r(x, 20, 1, 5, "#c8d0d8");
    }, {
      lit: hcylF(20, 5, true),
      cast: -1
    });
    P.r(32, 13, 12, 1, "#e8eef4");
    P.r(51, 5, 9, 1, "#e8eef4");
    for (let x = 52; x < 59; x += 2) P.p(x, 19, "#6a7078");
  });
  const weave = (x, y) => y % 2 === 0 && (x + (y >> 1)) % 4 === 0 ? -1 : 0;
  const strap = (Q, pts, w, c) => {
    for (let i = 0; i < pts.length - 1; i++) Q.thick(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, c);
  };
  const buckle = (P, x, y, w, h) => layer(P, Q => {
    Q.r(x, y, w, h, "#26282c");
    Q.r(x + 1, y + 1, w - 2, h - 2, "#40424a");
    Q.r(x + 1, y + (h >> 1), w - 2, 1, "#1a1c20");
  }, {
    bevel: [ 1, -1 ],
    cast: -1
  });
  def("천 가방", 2, 2, P => {
    const c = "#c4b48a", R = RP(c);
    layer(P, Q => {
      strap(Q, [ [ 20, 24 ], [ 24, 4 ], [ 40, 4 ], [ 44, 24 ] ], 3, "#4e4430");
    }, {
      cast: 0
    });
    layer(P, Q => {
      strap(Q, [ [ 16, 25 ], [ 20, 7 ], [ 44, 7 ], [ 48, 25 ] ], 3, "#6e6044");
    }, {
      lit: (x, y) => y < 9 ? 1 : x > 44 ? -1 : 0,
      cast: -2
    });
    layer(P, Q => {
      Q.poly([ [ 10, 23 ], [ 54, 23 ], [ 56, 40 ], [ 55, 58 ], [ 52, 61 ], [ 12, 61 ], [ 9, 58 ], [ 8, 40 ] ], c);
      Q.r(10, 23, 44, 4, R[4]);
      for (let x = 11; x < 53; x += 2) Q.p(x, 26, R[2]);
      disc(Q, 32, 38, 7, 6, "#5a8a4a");
      Q.r(31, 42, 2, 7, "#6a4a2a");
      disc(Q, 29, 36, 3, 2.6, "#7aa85a");
      hgs(Q, 26, 51, "#4a6a3a", "숲");
    }, {
      lit: (x, y) => {
        const b = pillowF(8, 23, 48, 38, 2)(x, y);
        return b + weave(x, y) + ((x === 21 || x === 43) && y > 30 && y < 55 ? -1 : (x === 22 || x === 44) && y > 30 && y < 55 ? 1 : 0);
      },
      cast: -2
    });
  });
  def("작은 가방", 2, 2, P => {
    const c = "#34466e", R = RP(c);
    layer(P, Q => {
      Q.r(26, 3, 12, 3, "#26282c");
      Q.r(26, 3, 3, 7, "#26282c");
      Q.r(35, 3, 3, 7, "#26282c");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 10, 8, 44, 54, 13, c);
      Q.r(10, 57, 44, 5, R[1]);
      for (let a = 0; a <= 40; a++) {
        const t = a / 40 * Math.PI, x = 32 - Math.cos(t) * 19, y = 22 - Math.sin(t) * 10;
        Q.p(x, y, "#8a929e");
      }
    }, {
      lit: (x, y) => pillowF(10, 8, 44, 54, 2)(x, y) + weave(x, y),
      cast: -2
    });
    layer(P, Q => {
      rrect(Q, 15, 32, 34, 25, 7, R[2]);
      for (let x = 20; x < 45; x++) Q.p(x, 35, "#8a929e");
      Q.r(46, 21, 3, 5, "#c8ccd2");
      Q.r(20, 34, 2, 5, "#c8ccd2");
      Q.r(29, 44, 7, 5, "#e07a30");
      Q.r(30, 45, 5, 1, "#f0b080");
    }, {
      lit: pillowF(15, 32, 34, 25, 2),
      cast: -2
    });
    for (let a = 0; a <= 40; a++) {
      const t = a / 40 * Math.PI, x = 32 - Math.cos(t) * 19, y = 22 - Math.sin(t) * 10;
      if (a % 2) P.p(x, y + 1, R[0]);
    }
  });
  def("긴 가방", 2, 3, P => {
    const c = "#5e6444", R = RP(c);
    const rf = y => y < 6 ? 0 : y < 22 ? 5 + (y - 6) / 16 * 14 : y < 84 ? 19 : 19 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 84) / 9, 2)));
    layer(P, Q => {
      lathe(Q, 32, 6, 93, rf, c);
      for (let k = 0; k < 7; k++) {
        const x = 25 + k * 2.3;
        Q.line(x, 8, x + (x - 32) * .7, 20, R[1]);
      }
      Q.r(13, 21, 38, 2, R[2]);
      hgs(Q, 24, 50, "#d8d0a8", "군용");
      txt(Q, 21, 58, 22, "#1e2016", 3);
    }, {
      lit: (x, y) => latheLit(32, rf)(x, y) + weave(x, y),
      cast: 0
    });
    layer(P, Q => {
      strap(Q, [ [ 48, 16 ], [ 50, 40 ], [ 50, 70 ], [ 47, 86 ] ], 4, "#3e4230");
    }, {
      lit: x => x > 50 ? -1 : 0,
      cast: -2
    });
    buckle(P, 47, 46, 7, 6);
    layer(P, Q => {
      Q.r(29, 1, 7, 7, "#9aa2aa");
      Q.x.clearRect(31, 3, 3, 3);
      Q.line(28, 8, 22, 18, "#c8b890").line(36, 8, 42, 16, "#c8b890");
      disc(Q, 22, 19, 1.5, 1.5, "#c8b890");
      disc(Q, 42, 17, 1.5, 1.5, "#c8b890");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("배낭", 2, 3, P => {
    const c = "#7a6444", R = RP(c);
    layer(P, Q => {
      blob(Q, 9, 56, 6, 16, () => R[2]);
      blob(Q, 55, 56, 6, 16, () => R[2]);
    }, {
      lit: x => x < 9 || x > 55 ? x < 9 ? 0 : -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 10, 14, 44, 70, 10, c);
      for (const y of [ 40, 62 ]) Q.r(10, y, 44, 2, "#3a3226");
    }, {
      lit: (x, y) => pillowF(10, 14, 44, 70, 2)(x, y) + weave(x, y),
      cast: -2
    });
    layer(P, Q => {
      rrect(Q, 15, 46, 34, 30, 6, R[2]);
      Q.r(18, 50, 28, 1, "#8a929e");
      Q.r(28, 58, 8, 6, "#3a4a2a");
      Q.r(29, 59, 6, 1, "#6a7a4a");
    }, {
      lit: pillowF(15, 46, 34, 30, 2),
      cast: -2
    });
    layer(P, Q => {
      rrect(Q, 8, 5, 48, 23, 8, R[4]);
      Q.r(12, 22, 40, 1, "#8a929e");
    }, {
      lit: pillowF(8, 5, 48, 23, 2),
      cast: -2
    });
    layer(P, Q => {
      for (const x of [ 18, 42 ]) Q.r(x, 18, 4, 30, "#2e2a22");
    }, {
      lit: x => x === 18 || x === 42 ? 1 : 0,
      cast: -2
    });
    buckle(P, 17, 30, 6, 6);
    buckle(P, 41, 30, 6, 6);
    layer(P, Q => {
      Q.r(6, 80, 52, 14, "#3a7a8a");
      disc(Q, 58, 87, 2.5, 7, "#4a8a9a");
      for (let x = 9; x < 56; x += 4) Q.r(x, 80, 1, 14, "#2e6270");
      for (const x of [ 16, 45 ]) Q.r(x, 79, 4, 16, "#26282c");
    }, {
      lit: hcylF(80, 14),
      cast: -2
    });
    disc(P, 58, 87, 2.5, 7, "#5a9aaa");
    P.ring(58, 87, 1.5, 4, "#3a7a8a");
  });
  def("접힌 천 가방", 1, 1, P => {
    const c = "#c4b48a", R = RP(c);
    layer(P, Q => {
      strap(Q, [ [ 8, 12 ], [ 10, 4 ], [ 15, 4 ], [ 17, 12 ] ], 2, "#4e4430");
      strap(Q, [ [ 15, 12 ], [ 17, 6 ], [ 22, 6 ], [ 24, 12 ] ], 2, "#6e6044");
    }, {
      lit: (x, y) => y < 7 ? 1 : 0,
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 4, 11 ], [ 28, 11 ], [ 28, 27 ], [ 26, 29 ], [ 6, 29 ], [ 4, 27 ] ], c);
      disc(Q, 16, 24, 4, 3, "#5a8a4a");
      disc(Q, 15, 23, 1.8, 1.3, "#7aa85a");
      Q.r(16, 27, 1, 2, "#6a4a2a");
    }, {
      lit: (x, y) => pillowF(4, 11, 24, 18, 2)(x, y) + weave(x, y),
      cast: 0
    });
    layer(P, Q => {
      Q.r(4, 10, 24, 9, R[4]);
      Q.r(4, 18, 24, 1, R[3]);
      for (let x = 6; x < 27; x += 3) Q.p(x, 17, R[2]);
    }, {
      lit: (x, y) => (y === 10 ? 1 : 0) + weave(x, y),
      cast: -2
    });
  });
  def("접힌 작은 가방", 1, 1, P => {
    const c = "#34466e", R = RP(c);
    layer(P, Q => {
      rrect(Q, 3, 8, 22, 19, 7, c);
      for (let x = 6; x < 22; x += 3) Q.p(x, 11, "#8a929e");
      Q.r(7, 21, 5, 3, "#e07a30");
      Q.r(8, 21, 3, 1, "#f0b080");
    }, {
      lit: (x, y) => hcylF(8, 19)(x, y) + weave(x, y),
      cast: 0
    });
    layer(P, Q => {
      blob(Q, 24, 17.5, 5, 9.5, () => R[4]);
    }, {
      lit: (x, y) => ballF(22, 15, 5, 9.5)(x, y) > 0 ? 1 : 0,
      cast: -1
    });
    P.ring(24, 17.5, 3.2, 6.4, R[2]);
    P.ring(24, 17.5, 1.6, 3.3, R[2]);
    P.p(24, 17, R[1]).p(24, 18, R[1]);
    layer(P, Q => {
      Q.r(13, 7, 3, 21, "#26282c");
    }, {
      lit: x => x === 13 ? 1 : x === 15 ? -1 : 0,
      cast: -1
    });
    buckle(P, 12, 14, 5, 5);
  });
  def("접힌 긴 가방", 1, 2, P => {
    const c = "#5e6444", R = RP(c);
    layer(P, Q => {
      rrect(Q, 6, 9, 20, 49, 5, c);
      hgs(Q, 8, 30, "#d8d0a8", "군용");
      txt(Q, 9, 38, 14, "#1e2016", 3);
    }, {
      lit: (x, y) => vcylF(6, 20)(x, y) + weave(x, y),
      cast: 0
    });
    layer(P, Q => {
      blob(Q, 16, 9, 10, 4.5, () => R[4]);
    }, {
      lit: ballF(14, 7, 10, 4.5),
      cast: -1
    });
    P.ring(16, 9, 6.5, 2.6, R[2]);
    P.ring(16, 9, 3, 1.2, R[2]);
    P.p(16, 9, R[1]);
    for (const y of [ 20, 46 ]) layer(P, Q => {
      Q.r(5, y, 22, 3, "#3e4230");
    }, {
      lit: x => x < 9 ? 1 : x > 22 ? -1 : 0,
      cast: -1
    });
    buckle(P, 18, 19, 6, 5);
    layer(P, Q => {
      Q.line(10, 6, 7, 2, "#c8b890").line(22, 6, 25, 3, "#c8b890");
      disc(Q, 7, 2.5, 1.3, 1.3, "#c8b890");
      disc(Q, 25, 3, 1.3, 1.3, "#c8b890");
    }, {
      cast: 0
    });
  });
  def("접힌 배낭", 2, 1, P => {
    const c = "#7a6444", R = RP(c);
    layer(P, Q => {
      rrect(Q, 5, 6, 52, 17, 6, c);
      Q.r(6, 14, 50, 1, "#3a3226");
    }, {
      lit: (x, y) => pillowF(5, 6, 52, 17, 2)(x, y) + weave(x, y),
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 5, 5, 16, 11, 4, R[4]);
      Q.r(7, 13, 12, 1, "#8a929e");
    }, {
      lit: pillowF(5, 5, 16, 11, 2),
      cast: -2
    });
    layer(P, Q => {
      Q.r(5, 20, 54, 8, "#3a7a8a");
      for (let x = 8; x < 58; x += 4) Q.r(x, 20, 1, 8, "#2e6270");
    }, {
      lit: hcylF(20, 8),
      cast: -2
    });
    disc(P, 58, 24, 2, 4, "#5a9aaa");
    P.ring(58, 24, 1, 2.2, "#3a7a8a");
    layer(P, Q => {
      for (const x of [ 26, 44 ]) Q.r(x, 4, 4, 25, "#2e2a22");
    }, {
      lit: x => x === 26 || x === 44 ? 1 : 0,
      cast: -2
    });
    buckle(P, 25, 9, 6, 6);
    buckle(P, 43, 9, 6, 6);
  });
  function vestShape(Q, c, open) {
    Q.poly([ [ 14, 3 ], [ 23, 3 ], [ 31, 17 ], [ 31, 60 ], [ 7, 60 ], [ 7, 29 ], [ 14, 22 ] ], c);
    Q.poly([ [ 50, 3 ], [ 41, 3 ], [ 33, 17 ], [ 33, 60 ], [ 57, 60 ], [ 57, 29 ], [ 50, 22 ] ], c);
    if (!open) Q.r(30, 16, 4, 45, c);
  }
  def("기본 리그", 2, 2, P => {
    const c = "#9a8a62", R = RP(c);
    layer(P, Q => {
      strap(Q, [ [ 16, 30 ], [ 22, 2 ] ], 5, R[2]);
      strap(Q, [ [ 48, 30 ], [ 42, 2 ] ], 5, R[2]);
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    buckle(P, 16, 13, 6, 5);
    buckle(P, 41, 13, 6, 5);
    layer(P, Q => {
      Q.r(2, 42, 8, 5, R[1]);
      Q.r(54, 42, 8, 5, R[1]);
    }, {
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 7, 28, 50, 26, 3, c);
      for (let x = 9; x < 56; x += 2) Q.p(x, 51, R[2]);
    }, {
      lit: (x, y) => pillowF(7, 28, 50, 26, 3)(x, y) + weave(x, y),
      cast: -2
    });
    for (let k = 0; k < 3; k++) {
      const x = 10 + k * 15;
      layer(P, Q => {
        Q.r(x + 2, 20, 9, 10, "#2e3036");
        Q.r(x + 2, 20, 9, 1, "#50545e");
        Q.r(x + 3, 21, 3, 2, "#c8a040");
      }, {
        lit: vcylF(x + 2, 9, true),
        cast: -1
      });
      layer(P, Q => {
        rrect(Q, x, 26, 13, 24, 2, R[3]);
        Q.r(x, 28, 13, 1, "#26282c");
        Q.r(x + 5, 26, 3, 4, "#26282c");
        for (let y = 33; y < 48; y += 4) Q.r(x, y, 13, 1, R[1]);
      }, {
        lit: vcylF(x, 13),
        bevel: [ 1, -1 ],
        cast: -2
      });
    }
  });
  def("전술 조끼", 2, 2, P => {
    const c = "#4e5a36", R = RP(c);
    layer(P, Q => vestShape(Q, c, true), {
      lit: (x, y) => (x % 3 === 0 || y % 3 === 0 ? -1 : 0) + (x < 12 || x > 33 && x < 36 ? 1 : 0) + (x > 52 || x > 27 && x < 31 ? -1 : 0),
      bevel: [ 1, -2 ],
      cast: 0
    });
    for (let y = 17; y < 60; y += 2) P.p(31, y, "#8a929a").p(33, y, "#6a7078");
    const pouch = (x, y, w, h) => layer(P, Q => {
      rrect(Q, x, y, w, h, 2, R[3]);
      Q.r(x, y, w, 4, R[4]);
      Q.r(x + (w >> 1) - 1, y + 3, 3, 3, "#26282c");
    }, {
      lit: vcylF(x, w),
      bevel: [ 1, -1 ],
      cast: -2
    });
    pouch(15, 20, 11, 11);
    pouch(38, 20, 11, 11);
    for (const x of [ 8, 19, 35, 46 ]) pouch(x, 38, 10, 17);
    layer(P, Q => {
      Q.r(17, 2, 2, 17, "#1e2024");
      Q.r(16, 1, 4, 2, "#2e3036");
    }, {
      cast: -1
    });
  });
  def("플레이트 캐리어", 2, 2, P => {
    const c = "#3a3c3a", R = RP(c);
    layer(P, Q => {
      rrect(Q, 13, 2, 11, 16, 4, c);
      rrect(Q, 40, 2, 11, 16, 4, c);
    }, {
      lit: (x, y) => pillowF(13, 2, 38, 16, 2)(x, y),
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 30, 10, 25, R[2]);
      Q.r(51, 30, 10, 25, R[2]);
      for (let y = 33; y < 54; y += 4) {
        Q.r(3, y, 10, 1, R[0]);
        Q.r(51, y, 10, 1, R[0]);
      }
    }, {
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 11, 12, 42, 48, 4, c);
      for (let y = 16; y < 36; y += 4) Q.r(13, y, 38, 1, R[1]);
      for (let y = 16; y < 36; y += 4) for (let x = 15; x < 50; x += 6) Q.p(x, y, R[4]);
    }, {
      lit: pillowF(11, 12, 42, 48, 3),
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(21, 17, 22, 10, "#6a6c6a");
      Q.r(23, 19, 18, 6, "#3e5a3a");
      hgs(Q, 26, 19, "#e8e4d8", "특");
      Q.r(33, 20, 6, 4, "#b8302a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    for (let k = 0; k < 3; k++) layer(P, Q => {
      const x = 14 + k * 12;
      Q.r(x + 1, 33, 9, 5, "#26282c");
      Q.r(x, 37, 11, 20, R[3]);
      Q.r(x, 37, 11, 5, R[4]);
      Q.r(x + 4, 41, 3, 2, "#1a1c1e");
    }, {
      lit: vcylF(14 + k * 12, 11),
      bevel: [ 1, -1 ],
      cast: -2
    });
  });
  def("방탄조끼", 2, 2, P => {
    const c = "#4a5a70", R = RP(c);
    layer(P, Q => {
      vestShape(Q, c, false);
      for (let y = 48; y < 60; y += 4) Q.r(8, y, 48, 1, R[2]);
      Q.r(7, 44, 5, 12, "#2a2c30");
      Q.r(52, 44, 5, 12, "#2a2c30");
    }, {
      lit: (x, y) => x < 12 ? 1 : x > 52 ? -1 : 0,
      bevel: [ 1, -2 ],
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 16, 17, 32, 28, 3, R[3]);
      Q.r(20, 19, 24, 8, "#8a9098");
      hgs(Q, 24, 20, "#1a1c20", "방탄");
    }, {
      lit: pillowF(16, 17, 32, 28, 3),
      bevel: [ 1, -2 ],
      cast: -2
    });
    P.r(15, 4, 7, 2, R[4]).r(42, 4, 7, 2, R[4]);
    clsMark(P, 50, 48, 3);
  });
  def("방탄모", 2, 2, P => {
    const c = "#5a6044", R = RP(c);
    layer(P, Q => {
      strap(Q, [ [ 13, 40 ], [ 20, 52 ], [ 28, 58 ], [ 36, 58 ], [ 44, 52 ], [ 51, 40 ] ], 3, "#2a2c28");
      Q.r(29, 55, 7, 5, "#6a6e68");
      Q.r(30, 56, 5, 3, "#2a2c28");
    }, {
      lit: (x, y) => y > 55 ? -1 : 0,
      cast: 0
    });
    const edge = x => 44 - Math.max(0, Math.abs(x - 32) - 12) * .5;
    layer(P, Q => {
      blob(Q, 32, 40, 28, 34, (nx, ny, x, y) => y <= edge(x) ? c : null);
    }, {
      lit: (x, y) => ballF(30, 34, 28, 30)(x, y) + ((x * 3 + y * 5) % 7 === 0 ? -1 : 0),
      cast: -2
    });
    for (let x = 5; x < 60; x++) {
      const y = Math.round(edge(x));
      if (Math.hypot((x + .5 - 32) / 28, (y + .5 - 40) / 34) <= 1) P.r(x, y - 1, 1, 2, "#26282a");
    }
    layer(P, Q => {
      Q.poly([ [ 8, 30 ], [ 18, 24 ], [ 19, 27 ], [ 9, 33 ] ], "#2a2c2a");
      Q.poly([ [ 56, 30 ], [ 46, 24 ], [ 45, 27 ], [ 55, 33 ] ], "#2a2c2a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.poly([ [ 27, 9 ], [ 37, 9 ], [ 36, 17 ], [ 28, 17 ] ], "#26282a");
      Q.r(29, 11, 6, 3, "#3e403e");
      Q.p(28, 10, "#8a8e8a").p(35, 10, "#8a8e8a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    P.r(16, 14, 6, 1, R[5]).r(14, 15, 3, 1, R[5]);
    clsMark(P, 48, 46, 3);
  });
  const DIG5 = {
    1: "010110010010111",
    2: "110001010100111",
    3: "110001010001110",
    4: "101101111001001",
    5: "111100110001110",
    6: "011100110101010"
  };
  function clsMark(P, x, y, n, fg) {
    const g = DIG5[n];
    if (!g) return;
    P.r(x - 2, y - 2, 10, 14, "#16181a");
    P.r(x - 1, y - 1, 8, 12, "#2c2a24");
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === "1") P.r(x + i * 2, y + j * 2, 2, 2, fg || "#f2d27a");
  }
  function vestPoly(Q, c, k) {
    const m = p => p.map(([x, y]) => [ Math.round(x * k), Math.round(y * k) ]);
    Q.poly(m([ [ 14, 3 ], [ 23, 3 ], [ 31, 17 ], [ 31, 60 ], [ 7, 60 ], [ 7, 29 ], [ 14, 22 ] ]), c);
    Q.poly(m([ [ 50, 3 ], [ 41, 3 ], [ 33, 17 ], [ 33, 60 ], [ 57, 60 ], [ 57, 29 ], [ 50, 22 ] ]), c);
    Q.r(Math.round(30 * k), Math.round(16 * k), Math.round(4 * k), Math.round(45 * k), c);
  }
  function vestIcon(c, cls, o) {
    return (P, W) => {
      const k = W / 64, R = RP(c), q = v => Math.round(v * k);
      layer(P, Q => {
        vestPoly(Q, c, k);
        for (let y = q(48); y < q(60); y += q(4)) Q.r(q(8), y, q(48), 1, R[2]);
        if (o.quilt) for (let y = q(20); y < q(58); y += q(6)) {
          Q.r(q(8), y, q(22), 1, R[1]);
          Q.r(q(34), y, q(22), 1, R[1]);
        }
        if (o.camo) for (let n = 0; n < 40; n++) {
          const x = q(8 + n * 37 % 48), y = q(8 + n * 23 % 50);
          if (Math.abs(x - q(32)) > q(3) || y > q(16)) Q.r(x, y, q(4), q(3), n % 3 ? R[1] : R[4]);
        }
      }, {
        lit: x => x < q(12) ? 1 : x > q(52) ? -1 : 0,
        bevel: [ 1, -2 ],
        cast: 0
      });
      if (o.pad) layer(P, Q => {
        Q.poly([ [ q(10), q(2) ], [ q(26), q(2) ], [ q(30), q(12) ], [ q(8), q(12) ] ], R[2]);
        Q.poly([ [ q(38), q(2) ], [ q(54), q(2) ], [ q(56), q(12) ], [ q(34), q(12) ] ], R[2]);
        Q.r(q(2), q(20), q(8), q(22), R[3]);
        Q.r(q(54), q(20), q(8), q(22), R[3]);
        Q.r(q(24), q(58), q(16), q(6), R[2]);
      }, {
        bevel: [ 1, -1 ],
        cast: -1
      });
      if (o.plate) layer(P, Q => {
        rrect(Q, q(15), q(15), q(34), q(24), q(3), R[4]);
        Q.r(q(18), q(18), q(28), 1, R[5]);
      }, {
        lit: pillowF(q(15), q(15), q(34), q(24), 3),
        bevel: [ 1, -2 ],
        cast: -2
      }); else if (!o.quilt) layer(P, Q => {
        rrect(Q, q(16), q(17), q(32), q(28), q(3), R[3]);
        Q.r(q(20), q(20), q(24), q(5), o.strip || "#8a9098");
      }, {
        lit: pillowF(q(16), q(17), q(32), q(28), 3),
        bevel: [ 1, -2 ],
        cast: -2
      });
      for (let n = 0; n < (o.pouch || 0); n++) layer(P, Q => {
        const x = q(14 + n * 12);
        Q.r(x, q(40), q(10), q(14), R[3]);
        Q.r(x, q(40), q(10), q(3), R[4]);
        Q.r(x + q(4), q(43), q(2), q(2), "#1a1c1e");
      }, {
        bevel: [ 1, -1 ],
        cast: -1
      });
      P.r(q(15), q(4), q(7), 2, R[4]).r(q(42), q(4), q(7), 2, R[4]);
      clsMark(P, W - 12, W - 16, cls);
    };
  }
  def("군 작전 지도", 2, 1, (P, W, H, d) => drawAs(P, W, H, d, "기밀 서류"));
  def("방검복", 2, 2, vestIcon("#77776c", 1, {
    quilt: true
  }));
  def("소프트 방탄조끼", 2, 2, vestIcon("#34394a", 2, {
    strip: "#d8d0b0"
  }));
  def("방탄판 조끼", 2, 2, vestIcon("#5a5c3a", 4, {
    plate: true,
    pouch: 3
  }));
  def("군용 방탄복", 2, 2, vestIcon("#4a5a38", 5, {
    plate: true,
    pouch: 3,
    camo: true,
    pad: true
  }));
  def("중전투 방탄복", 3, 3, vestIcon("#2e3a2e", 6, {
    plate: true,
    pouch: 3,
    pad: true
  }));
  function helmIcon(c, cls, o) {
    return P => {
      const R = RP(c), edge = x => 44 - Math.max(0, Math.abs(x - 32) - 12) * .5;
      if (!o.hard) layer(P, Q => {
        strap(Q, [ [ 13, 40 ], [ 20, 52 ], [ 28, 58 ], [ 36, 58 ], [ 44, 52 ], [ 51, 40 ] ], 3, "#2a2c28");
      }, {
        cast: 0
      });
      layer(P, Q => {
        blob(Q, 32, 40, 28, o.hard ? 30 : 34, (nx, ny, x, y) => y <= edge(x) ? c : null);
        if (o.hard) Q.r(2, 40, 60, 5, c);
        if (o.stripe) Q.r(6, 30, 52, 3, o.stripe);
      }, {
        lit: (x, y) => ballF(30, 34, 28, 30)(x, y),
        cast: -2
      });
      if (o.hard) layer(P, Q => {
        Q.r(29, 10, 6, 30, R[4]);
      }, {
        bevel: [ 1, -1 ],
        cast: -1
      });
      if (o.rail) layer(P, Q => {
        Q.r(6, 28, 8, 5, "#26282a");
        Q.r(50, 28, 8, 5, "#26282a");
        Q.r(26, 8, 12, 6, "#26282a");
        Q.r(29, 10, 6, 2, "#4a4c4a");
      }, {
        bevel: [ 1, -1 ],
        cast: -1
      });
      if (o.visor) layer(P, Q => {
        Q.poly([ [ 8, 36 ], [ 56, 36 ], [ 52, 56 ], [ 12, 56 ] ], "#1e2a30");
        Q.r(12, 40, 40, 2, "#5a7a88");
      }, {
        lit: (x, y) => y < 40 ? 1 : 0,
        bevel: [ 1, -1 ],
        cast: -1
      });
      P.r(16, 14, 6, 1, R[5]).r(14, 15, 3, 1, R[5]);
      clsMark(P, 50, 48, cls);
    };
  }
  def("공사장 안전모", 2, 2, helmIcon("#d8b02a", 1, {
    hard: true
  }));
  def("경찰 방석모", 2, 2, helmIcon("#26304a", 2, {
    stripe: "#d8d0b0"
  }));
  def("전술 헬멧", 2, 2, helmIcon("#8a7a58", 4, {
    rail: true
  }));
  def("중형 방탄 헬멧", 2, 2, helmIcon("#2a2c2e", 5, {
    rail: true,
    visor: true
  }));
  def("구급킷", 2, 2, P => {
    const c = "#c0302c", R = RP(c);
    layer(P, Q => {
      strap(Q, [ [ 20, 14 ], [ 22, 6 ], [ 42, 6 ], [ 44, 14 ] ], 4, "#26282c");
    }, {
      cast: 0
    });
    layer(P, Q => {
      obox(Q, 5, 22, 47, 36, 8, 10, c);
      for (let x = 8; x < 50; x += 2) Q.p(x, 25, "#8a929a").p(x, 55, "#8a929a");
      for (let y = 25; y < 56; y += 2) Q.p(8, y, "#8a929a").p(49, y, "#8a929a");
    }, {
      lit: (x, y) => pillowF(5, 12, 55, 46, 4)(x, y),
      cast: -2
    });
    layer(P, Q => {
      Q.r(24, 28, 9, 25, "#f4f2ec");
      Q.r(16, 36, 25, 9, "#f4f2ec");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(46, 13, 4, 6, "#c8ccd2");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("진통제", 1, 1, P => {
    layer(P, Q => {
      rrect(Q, 3, 3, 26, 26, 2, "#b4bcc6");
      for (let y = 4; y < 28; y += 2) for (let x = 12 + y % 4 / 2; x < 28; x += 2) Q.p(x, y, "#a4acb6");
      Q.r(3, 3, 8, 26, "#e8ecf0");
      Q.r(3, 3, 8, 7, "#2e7da0");
      hgs(Q, 4, 4, "#f0f8ff", "약");
      txt(Q, 4, 13, 6, "#6a7078", 2);
      txt(Q, 4, 16, 5, "#6a7078", 3);
      Q.r(4, 21, 6, 1, "#c83a3a");
    }, {
      bevel: [ 1, -2 ],
      cast: 0
    });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) {
      const x = 16 + k * 8, y = 8 + r * 8;
      if (r === 2 && k === 1) {
        disc(P, x, y, 3.2, 3, "#5a6068");
        P.p(x - 2, y - 2, "#e8ecf0").p(x + 2, y + 1, "#e8ecf0");
        continue;
      }
      layer(P, Q => disc(Q, x, y, 3.4, 3.2, "#dce4ea"), {
        lit: ballF(x, y, 3.4, 3.2),
        cast: -1
      });
      disc(P, x, y + .3, 2.4, 2, "#f8f8f4");
      P.r(x - 2, y, 4, 1, "#c8ccd0");
      P.p(x - 2, y - 2, "#ffffff");
    }
  });
  def("붕대", 1, 1, P => {
    const c = "#ece6d6", R = RP(c);
    layer(P, Q => {
      Q.poly([ [ 19, 16 ], [ 27, 18 ], [ 29, 29 ], [ 21, 29 ] ], c);
      for (let y = 17; y < 29; y += 2) for (let x = 20; x < 29; x += 2) Q.p(x + (y % 4 ? 1 : 0), y, R[2]);
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 10, 20, 12, c);
      disc(Q, 13, 22, 10, 3.5, c);
      for (let y = 10; y < 25; y += 2) for (let x = 3; x < 23; x += 2) Q.p(x + (y % 4 ? 1 : 0), y, R[2]);
    }, {
      lit: vcylF(3, 20),
      cast: -2
    });
    disc(P, 13, 10, 10, 3.5, R[4]);
    for (const k of [ 7.5, 5, 2.5 ]) P.ring(13, 10, k, k * .35, R[2]);
    P.r(8, 8, 5, 1, R[5]);
    layer(P, Q => {
      Q.r(22, 20, 6, 2, "#c8ccd2");
      Q.p(28, 21, "#c8ccd2");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("지혈대", 1, 1, P => {
    const c = "#3a3c42";
    layer(P, Q => {
      tubeRing(Q, 15, 19, 11.5, 8, 4.4, c, -Math.PI, Math.PI);
      for (let a = 0; a < 40; a++) {
        const t = a / 40 * Math.PI * 2;
        if (a % 2) Q.p(15 + Math.cos(t) * 11.5, 19 + Math.sin(t) * 8, "#5a5e66");
      }
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(22, 22, 8, 6, "#c8342a");
      Q.r(23, 23, 6, 1, "#e86a5a");
      hgs(Q, 22, 22, "#f8e8e0", "혈");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => rod(Q, 4, 11, 21, 6, 2.5, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1.8 ? l < 1.5 || l > L - 1.5 ? "#4a4e56" : "#26282c" : null), {
      lit: rodLit(4, 11, 21, 6, 1.8, true),
      cast: -2
    });
    layer(P, Q => {
      Q.poly([ [ 22, 4 ], [ 29, 3 ], [ 27, 11 ] ], "#6a6e76");
      Q.poly([ [ 24, 5 ], [ 27, 5 ], [ 26, 8 ] ], "#26282c");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("소독약", 1, 2, P => {
    const rf = y => y < 3 ? 0 : y < 9 ? 1.8 : y < 17 ? 6 : y < 22 ? 6 + (y - 17) : y > 60 ? 11 - (y - 60) : 11;
    bottle(P, 16, 3, 63, rf, (x, y) => y < 17 ? "#ecece6" : y < 26 ? "#b0683a" : y > 30 && y < 53 ? y === 31 || y === 52 ? "#2a8a7a" : "#f2f2ec" : "#6a2a12");
    P.r(7, 36, 2, 8, "#2a9a8a").r(4, 39, 8, 2, "#2a9a8a");
    hgs(P, 13, 37, "#2a4a4a", "소독");
    txt(P, 8, 47, 16, "#8a8a84", 3);
    P.r(5, 17, 22, 1, "#c8c8c0");
  });
  def("진통 주사기", 1, 1, P => {
    const x0 = 2.5, y0 = 29.5, x1 = 29.5, y1 = 2.5;
    const f = (l, d) => {
      if (l < 0) return null;
      if (l < 7) return Math.abs(d) <= .5 ? "#d0d8e0" : null;
      if (l < 9) return Math.abs(d) <= 1.5 ? "#6ab88a" : null;
      if (l < 24) {
        if (Math.abs(d) > 3.1) return null;
        if (Math.abs(d) > 2.3) return "#b8c8d4";
        if (d > 1.2 && (l | 0) % 2 === 0) return "#4a5a6a";
        if (l < 16) return l > 11 && l < 13 ? "#c83a3a" : "#e8dca0";
        if (l < 17.5) return "#26282c";
        return Math.abs(d) <= 1 ? "#f0f0ec" : "#d8e6ee";
      }
      if (l < 25.5) return Math.abs(d) <= 5.2 ? "#e8ecf0" : null;
      if (l < 33) return Math.abs(d) <= 1 ? "#f0f0ec" : null;
      if (l < 35) return Math.abs(d) <= 3.6 ? "#e8ecf0" : null;
      return null;
    };
    layer(P, Q => rod(Q, x0, y0, x1, y1, 6, (l, d) => f(l, d)), {
      lit: rodLit(x0, y0, x1, y1, l => l < 9 ? 1.5 : l < 24 ? 3.1 : l < 25.5 ? 5.2 : l < 33 ? 1 : 3.6, true),
      cast: 0
    });
  });
  def("항생제", 1, 1, P => {
    const cap = (x0, y0, x1, y1, a, b) => layer(P, Q => rod(Q, x0, y0, x1, y1, 3, (l, d, L) => l >= -1.5 && l <= L + 1.5 && Math.hypot(Math.max(0, Math.max(-l, l - L)), d) <= 2 ? l < L / 2 ? a : b : null), {
      lit: rodLit(x0, y0, x1, y1, 2, true),
      cast: -2
    });
    layer(P, Q => {
      Q.r(4, 10, 16, 19, "#d8782a");
      disc(Q, 12, 29, 8, 1.5, "#d8782a");
      Q.r(4, 16, 16, 9, "#f0ece0");
      hgs(Q, 5, 17, "#3a3a3a", "항생");
      txt(Q, 6, 23, 11, "#8a8a84", 2);
      for (const [x, y] of [ [ 6, 12 ], [ 11, 11 ], [ 15, 13 ] ]) Q.r(x, y, 3, 2, "#c83a3a");
    }, {
      lit: vcylF(4, 16, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(3, 4, 18, 7, "#f0f0ea");
      for (let x = 4; x < 21; x += 2) Q.r(x, 5, 1, 5, "#c8c8c0");
    }, {
      lit: vcylF(3, 18, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    cap(20, 27, 27, 23, "#c83a3a", "#f0ece0");
    cap(22, 18, 28, 21, "#3a6ab8", "#f0ece0");
  });
  def("증상 억제약", 1, 1, P => {
    const x0 = 4, y0 = 28, x1 = 28, y1 = 4, rf = l => l < 4 ? 2.6 : 3.6;
    layer(P, Q => rod(Q, x0, y0, x1, y1, 5, (l, d, L) => {
      if (l < 0 || l > L || Math.abs(d) > rf(l)) return null;
      if (l < 4) return "#2a5aa8";
      if (l < 6) return (l * 2 | 0) % 2 ? "#e0c030" : "#26282c";
      if (l > 9 && l < 21) return Math.abs(d) < 2.4 ? (l * 3 + d * 2 | 0) % 9 === 0 ? "#e0fff8" : "#3ae0c0" : "#9aa4ae";
      if (l > L - 6) return (l | 0) % 2 ? "#e8782a" : "#c85a1a";
      return "#e4e8ec";
    }), {
      lit: rodLit(x0, y0, x1, y1, rf, true),
      cast: 0
    });
    star(P, 5, 7, "#c8fff0");
    star(P, 25, 25, "#c8fff0");
    glint(P, 12, 16, "#ffffff");
  });
  def("긴급 탈출 신호탄", 1, 2, P => {
    const rf = y => y < 2 ? 0 : y < 12 ? 6 : y < 58 ? 7 : 7 - (y - 58);
    layer(P, Q => lathe(Q, 16, 2, 62, rf, (x, y) => y < 12 ? y < 4 ? "#6a6e76" : "#2a2c30" : y > 24 && y < 38 ? y === 25 || y === 37 ? "#e0c030" : "#f0ece0" : y > 42 && y < 48 ? (x + y >> 1) % 2 ? "#e0c030" : "#26282c" : y > 55 ? "#3a3c42" : "#c8302a"), {
      lit: latheLit(16, rf, true),
      cast: 0
    });
    hgs(P, 10, 28, "#b8302a", "탈출");
    P.r(11, 34, 10, 1, "#8a8a84");
    for (let y = 4; y < 11; y += 2) P.r(10, y, 12, 1, "#3e4046");
    P.r(12, 1, 8, 2, "#8a8e96");
    star(P, 25, 5, "#fff0b0");
    P.p(27, 8, "#f0a040");
  });
  const GMT = "#3a3d44", GBL = "#26282e", GPL = "#2c2e34", GWD = "#7a5234", GOD = "#4d5139";
  function gTube(P, x, y, w, h, col, o) {
    o = o || {};
    layer(P, Q => {
      Q.r(x, y, w, h, col);
      if (o.rib) for (let k = x + 2; k < x + w - 1; k += o.rib) Q.r(k, y, 1, h, sh(col, -.3));
      if (o.holes) for (let k = x + 3; k < x + w - 3; k += o.holes) Q.r(k, y + (h / 2 | 0) - 1, 2, 2, "#141519");
    }, {
      lit: hcylF(y, h, true),
      bevel: [ 1, -1 ],
      cast: o.cast == null ? -2 : o.cast
    });
  }
  function gBody(P, x, y, w, h, col, o) {
    o = o || {};
    layer(P, Q => {
      Q.r(x, y, w, h, col);
      if (o.line) Q.r(x, y + o.line, w, 1, sh(col, -.32));
      if (o.slot) Q.r(o.slot[0], o.slot[1], o.slot[2], o.slot[3], "#15171b");
      if (o.grip) for (let k = x + 2; k < x + w - 1; k += o.grip) Q.r(k, y + 1, 1, h - 2, sh(col, -.24));
      if (o.vent) for (let k = x + 3; k < x + w - 3; k += o.vent) {
        Q.r(k, y + 2, 2, 2, "#15171b");
        Q.r(k, y + h - 4, 2, 2, "#15171b");
      }
    }, {
      lit: hcylF(y, h, true),
      bevel: [ 1, -2 ],
      cast: o.cast == null ? -2 : o.cast
    });
  }
  function gGrip(P, x, y, w, h, col, lean) {
    lean = lean == null ? 3 : lean;
    layer(P, Q => {
      Q.poly([ [ x, y ], [ x + w, y ], [ x + w - lean, y + h ], [ x - lean, y + h ] ], col);
      for (let k = 2; k < h - 1; k += 2) Q.r(x - Math.round(lean * k / h) + 1, y + k, w - 2, 1, sh(col, -.26));
    }, {
      lit: px => px < x + w * .42 ? 1 : -1,
      bevel: [ 1, -2 ],
      cast: -2
    });
  }
  function gTrig(P, x, y, w, h, col) {
    layer(P, Q => {
      Q.r(x, y, w, 1, col).r(x, y + h - 1, w, 1, col).r(x + w - 1, y, 1, h, col);
      Q.r(x + 1, y + 1, 1, h - 3, sh(col, .25));
    }, {
      cast: -1
    });
  }
  function gMag(P, x, y, w, h, col, curve) {
    curve = curve || 0;
    layer(P, Q => {
      Q.poly([ [ x, y ], [ x + w, y ], [ x + w + curve, y + h ], [ x + curve, y + h ] ], col);
      Q.poly([ [ x + w - 2, y ], [ x + w, y ], [ x + w + curve, y + h ], [ x + w + curve - 2, y + h ] ], sh(col, -.26));
      for (let k = 3; k < h - 2; k += 4) Q.r(x + Math.round(curve * k / h) + 1, y + k, w - 3, 1, sh(col, .14));
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
  }
  function gDrum(P, cx, cy, r, col) {
    layer(P, Q => {
      disc(Q, cx, cy, r, r, col);
      disc(Q, cx, cy, r - 3, r - 3, sh(col, -.16));
      disc(Q, cx, cy, 2.2, 2.2, sh(col, .3));
    }, {
      lit: ballF(cx, cy, r, r),
      bevel: [ 1, -1 ],
      cast: -2
    });
  }
  function gStock(P, pts, col, o) {
    o = o || {};
    layer(P, Q => {
      Q.poly(pts, col);
      if (o.pad) Q.poly(o.pad, "#1c1e22");
    }, {
      lit: o.lit || hcylF(o.y0 || 4, o.hh || 16),
      bevel: [ 1, -2 ],
      cast: o.cast == null ? -2 : o.cast
    });
  }
  function gScope(P, x, y, w, h) {
    layer(P, Q => {
      Q.r(x, y, w, h, "#2a2c32");
      Q.r(x + 3, y - 1, 6, h + 2, "#33363d");
      Q.r(x + w - 10, y - 1, 6, h + 2, "#33363d");
      Q.r(x + w - 3, y + 1, 3, h - 2, "#6fb0d4");
      Q.r(x + w - 2, y + 2, 1, h - 4, "#a8e0f4");
      Q.r(x, y + 1, 2, h - 2, "#8fd0ea");
    }, {
      lit: hcylF(y, h, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
  }
  function gRail(P, x, y, w) {
    layer(P, Q => {
      Q.r(x, y, w, 3, "#26282e");
      for (let k = x + 1; k < x + w - 1; k += 2) Q.r(k, y, 1, 1, "#4e525c");
    }, {
      cast: -1
    });
  }
  function gDot(P, x, y) {
    layer(P, Q => {
      Q.r(x, y, 11, 8, "#2a2c32");
      Q.r(x + 1, y + 1, 9, 5, "#12262c");
      Q.r(x + 2, y + 2, 7, 3, "#1e4e58");
      Q.p(x + 6, y + 3, "#ff5a4a");
      Q.r(x + 3, y + 8, 5, 3, "#26282e");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
  }
  function gSight(P, x, y, h) {
    layer(P, Q => {
      Q.r(x, y, 3, h, "#2e3036");
      Q.r(x + 1, y - 2, 1, 3, "#454951");
    }, {
      cast: -1
    });
  }
  function gHandle(P, x, y, w, h) {
    layer(P, Q => {
      Q.r(x, y, w, 2, "#2e3036");
      Q.r(x, y, 2, h, "#2e3036");
      Q.r(x + w - 2, y, 2, h, "#2e3036");
      Q.r(x + 1, y, w - 2, 1, "#525761");
    }, {
      cast: -2
    });
  }
  function gBipod(P, x, y, h) {
    layer(P, Q => {
      Q.line(x, y, x - 7, y + h, "#3a3d44");
      Q.line(x + 2, y, x + 9, y + h, "#3a3d44");
      Q.r(x - 10, y + h, 5, 2, "#2a2c32");
      Q.r(x + 7, y + h, 5, 2, "#2a2c32");
    }, {
      cast: -1
    });
  }
  const gMuzzle = (P, x, y, h) => P.r(x, y, 2, h, "#121317");
  function wpnPic(P, W, H, name) {
    const w = A.WPN[name];
    if (!w) return;
    const Q = pen(w.w, w.h);
    w.draw(Q);
    const d = Q.x.getImageData(0, 0, w.w, w.h).data;
    let x0 = w.w, y0 = w.h, x1 = -1, y1 = -1;
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) if (d[(y * w.w + x) * 4 + 3] > 100) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    if (x1 < 0) return;
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, s = Math.max(1, Math.floor(Math.min((W - 4) / cw, (H - 4) / ch)));
    P.x.imageSmoothingEnabled = false;
    P.x.drawImage(Q.x.canvas, x0, y0, cw, ch, Math.round((W - cw * s) / 2), Math.round((H - ch * s) / 2), cw * s, ch * s);
  }
  def("K5 권총", 3, 1, (P, W, H) => wpnPic(P, W, H, "K5 권총"));
  def(".38 리볼버", 3, 1, (P, W, H) => wpnPic(P, W, H, ".38 리볼버"));
  def("K13 소음권총", 3, 1, (P, W, H) => wpnPic(P, W, H, "K13 소음권총"));
  def("K1A 기관단총", 3, 1, (P, W, H) => wpnPic(P, W, H, "K1A 기관단총"));
  def("K7 소음기관단총", 3, 1, (P, W, H) => wpnPic(P, W, H, "K7 소음기관단총"));
  def("M16A1 소총", 4, 1, (P, W, H) => wpnPic(P, W, H, "M16A1 소총"));
  def("K2 소총", 4, 1, (P, W, H) => wpnPic(P, W, H, "K2 소총"));
  def("K2C1 소총", 4, 1, (P, W, H) => wpnPic(P, W, H, "K2C1 소총"));
  def("K3 기관총", 5, 2, (P, W, H) => wpnPic(P, W, H, "K3 기관총"));
  def("K14 저격소총", 5, 1, (P, W, H) => wpnPic(P, W, H, "K14 저격소총"));
  def("엽총", 4, 2, (P, W, H) => wpnPic(P, W, H, "엽총"));
  const TAPE = "#8a8060", PIPE = "#5a5e66";
  def("사제 파이프 권총", 3, 1, (P, W, H) => wpnPic(P, W, H, "사제 파이프 권총"));
  def("사제 산탄총", 3, 1, (P, W, H) => wpnPic(P, W, H, "사제 산탄총"));
  def("사제 기관단총", 3, 1, (P, W, H) => wpnPic(P, W, H, "사제 기관단총"));
  def("사제 사냥총", 4, 1, (P, W, H) => wpnPic(P, W, H, "사제 사냥총"));
  def("USAS-12 산탄총", 4, 2, (P, W, H) => wpnPic(P, W, H, "USAS-12 산탄총"));
  def("5.56mm 탄창", 1, 2, (P, W, H, d) => drawAs(P, W, H, d, "7mm 탄창"));
  def("7.62mm 탄창", 1, 2, P => {
    const cx = y => 8 + Math.pow((y - 9) / 52, 2) * 7;
    layer(P, Q => {
      for (let k = 0; k < 2; k++) {
        const y = 2 + k * 4;
        Q.r(9 + k, y, 10, 4, "#c8a040");
        Q.r(19 + k, y, 5, 4, "#a8642e");
        Q.r(24 + k, y + 1, 2, 2, "#a8642e");
      }
    }, {
      lit: (x, y) => (y - 2) % 4 === 0 ? 1 : (y - 2) % 4 === 3 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      for (let y = 10; y < 58; y++) {
        const x = Math.round(cx(y));
        Q.r(x, y, 15, 1, "#3d424c");
        if ((y - 10) % 8 === 7) Q.r(x, y, 15, 1, "#2a2e36");
      }
      Q.r(Math.round(cx(57)) - 1, 56, 17, 5, "#2a2c32");
      Q.r(Math.round(cx(57)) - 1, 56, 17, 1, "#545a66");
    }, {
      lit: (x, y) => cylLv((x + .5 - cx(y)) / 15, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(8, 10, 15, 1, "#6a707c");
  });
  def("5.56mm 탄통", 2, 2, P => {
    layer(P, Q => {
      obox(Q, 6, 22, 52, 34, 8, 8, "#4e5638");
      Q.r(6, 22, 52, 1, "#7d8a5e");
      Q.r(8, 30, 44, 4, "#2f3626");
      hgs(Q, 10, 38, "#dcd2a0", "탄통", 2);
      Q.r(46, 30, 8, 20, "#3a4230");
      Q.r(47, 31, 6, 18, "#606c48");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.r(20, 8, 26, 4, "#3a4230");
      Q.r(20, 8, 4, 10, "#3a4230");
      Q.r(42, 8, 4, 10, "#3a4230");
      Q.r(21, 8, 24, 1, "#76825a");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => {
      for (let k = 0; k < 5; k++) {
        const x = 9 + k * 5;
        Q.r(x, 14, 3, 5, "#c8a048");
        Q.r(x, 12, 3, 2, "#a8642e");
      }
    }, {
      cast: -1
    });
  });
  const RED = "#e0463a";
  function partMag(P, W, H, long, quick) {
    const x = 10, y = 4, h = long ? H - 14 : H - 10, curve = long ? 5 : 2;
    gMag(P, x, y, 12, h, GMT, curve);
    layer(P, Q => {
      Q.r(x + curve - 1, y + h, 14, 3, "#26282e");
      Q.r(x + curve - 1, y + h, 14, 1, "#4a4e58");
    }, {
      cast: -1
    });
    layer(P, Q => {
      for (let k = 0; k < 2; k++) Q.r(x + 2 + k, y - 2 + k, 7, 2, "#c8a040");
    }, {
      cast: 0
    });
    if (quick) layer(P, Q => {
      const bx = x + curve + 1, by = y + h + 3;
      Q.r(bx, by, 10, 2, RED);
      Q.r(bx, by, 2, 5, RED);
      Q.r(bx + 8, by, 2, 5, RED);
      Q.r(bx, by + 4, 10, 2, "#b0322a");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  }
  def("권총 소음기", 2, 1, P => {
    gTube(P, 12, 9, 48, 14, GBL, {
      rib: 7
    });
    layer(P, Q => {
      Q.r(4, 12, 9, 8, "#5a5f69");
      for (let x = 5; x < 12; x += 2) Q.r(x, 12, 1, 8, "#3a3d44");
    }, {
      lit: hcylF(12, 8, true),
      cast: -1
    });
    P.r(58, 13, 2, 6, "#0e0f12");
    P.r(14, 11, 44, 1, "#4e525c");
  });
  def("소총 소음기", 2, 1, P => {
    gTube(P, 10, 7, 52, 18, GOD, {
      rib: 8
    });
    layer(P, Q => {
      Q.r(3, 11, 8, 10, "#5a5f69");
      for (let x = 4; x < 10; x += 2) Q.r(x, 11, 1, 10, "#3a3d44");
    }, {
      lit: hcylF(11, 10, true),
      cast: -1
    });
    P.r(60, 12, 2, 8, "#0e0f12");
    P.r(12, 9, 48, 1, "#6a7258");
  });
  def("보정기", 1, 1, P => {
    gTube(P, 6, 10, 22, 12, GBL);
    layer(P, Q => {
      Q.r(2, 13, 5, 6, "#5a5f69");
    }, {
      cast: -1
    });
    for (let x = 10; x < 26; x += 5) P.r(x, 10, 3, 3, "#0e0f12");
    P.r(27, 13, 1, 6, "#1c1e24");
  });
  def("소염기", 1, 1, P => {
    layer(P, Q => {
      Q.r(2, 13, 6, 6, "#5a5f69");
      Q.r(7, 10, 5, 12, GBL);
      for (let k = 0; k < 4; k++) Q.r(12, 10 + k * 3, 16, 2, GBL);
    }, {
      lit: hcylF(10, 12, true),
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(27, 12, 1, 8, "#1c1e24");
  });
  def("산탄 초크", 1, 1, P => {
    gTube(P, 4, 11, 24, 10, "#6a6e76");
    layer(P, Q => {
      Q.r(4, 11, 5, 10, "#c8a048");
      for (let x = 12; x < 26; x += 2) Q.r(x, 11, 1, 10, "#4a4e56");
    }, {
      cast: 0
    });
    P.r(27, 14, 1, 4, "#1c1e24");
  });
  def("대용량 탄창", 1, 2, (P, W, H) => partMag(P, W, H, true, false));
  def("퀵드로우 탄창", 1, 1, (P, W, H) => partMag(P, W, H - 6, false, true));
  def("대용량 퀵드로우 탄창", 1, 2, (P, W, H) => partMag(P, W, H - 6, true, true));
  def("스피드로더", 1, 1, P => {
    layer(P, Q => {
      disc(Q, 16, 17, 11, 11, "#3a3d44");
    }, {
      lit: ballF(16, 17, 11, 11),
      bevel: [ 1, -1 ],
      cast: -2
    });
    layer(P, Q => {
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2;
        disc(Q, 16 + Math.cos(a) * 6.5, 17 + Math.sin(a) * 6.5, 2.6, 2.6, "#c8a040");
      }
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(14, 2, 4, 9, "#26282e");
      Q.r(12, 2, 8, 3, "#3a3d44");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
  });
  def("수직 손잡이", 1, 1, P => {
    gRail(P, 4, 4, 24);
    layer(P, Q => {
      Q.r(6, 6, 20, 5, "#2e3036");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      Q.r(11, 11, 10, 18, GPL);
      for (let y = 14; y < 28; y += 3) Q.r(11, y, 10, 1, sh(GPL, -.3));
    }, {
      lit: x => x < 15 ? 1 : x > 18 ? -1 : 0,
      bevel: [ 1, -2 ],
      cast: -2
    });
  });
  def("앵글 손잡이", 1, 1, P => {
    gRail(P, 3, 6, 26);
    layer(P, Q => {
      Q.poly([ [ 4, 9 ], [ 28, 9 ], [ 28, 13 ], [ 12, 24 ], [ 6, 24 ] ], GPL);
      Q.line(8, 22, 26, 11, sh(GPL, .2));
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
  });
  def("레드닷 사이트", 1, 1, P => {
    gRail(P, 6, 22, 20);
    layer(P, Q => {
      Q.r(8, 10, 16, 12, "#2a2c32");
      Q.r(10, 12, 12, 7, "#12262c");
      Q.r(11, 13, 10, 5, "#1e4e58");
      Q.r(15, 15, 2, 2, "#ff5a4a");
      Q.r(21, 8, 3, 3, "#3a3d44");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
  });
  def("홀로그램 사이트", 1, 1, P => {
    gRail(P, 4, 23, 24);
    layer(P, Q => {
      Q.r(5, 17, 22, 6, "#2e3036");
      Q.r(5, 7, 3, 11, "#2a2c32");
      Q.r(24, 7, 3, 11, "#2a2c32");
      Q.r(5, 6, 22, 3, "#2a2c32");
      Q.r(8, 9, 16, 8, "#1b3a44");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(15, 11, 2, 1, "#ff6a5a").r(15, 14, 2, 1, "#ff6a5a").r(13, 12, 1, 2, "#ff6a5a").r(18, 12, 1, 2, "#ff6a5a");
    P.r(9, 10, 3, 1, "#8fd0ea");
  });
  def("4배율 조준경", 2, 1, P => {
    gScope(P, 6, 9, 52, 11);
    layer(P, Q => {
      Q.r(20, 20, 4, 4, "#26282e");
      Q.r(40, 20, 4, 4, "#26282e");
      Q.r(29, 5, 5, 5, "#33363d");
    }, {
      cast: -1
    });
    gRail(P, 14, 24, 36);
  });
  def("전술 개머리판", 2, 1, P => {
    gStock(P, [ [ 4, 5 ], [ 34, 9 ], [ 58, 9 ], [ 58, 20 ], [ 34, 20 ], [ 4, 27 ] ], "#2f3138", {
      y0: 5,
      hh: 22,
      pad: [ [ 4, 5 ], [ 9, 5 ], [ 9, 27 ], [ 4, 27 ] ]
    });
    layer(P, Q => {
      Q.r(14, 13, 18, 3, "#1c1e22");
      Q.r(40, 12, 14, 5, "#3a3d44");
    }, {
      cast: 0
    });
  });
  def("레이저 사이트", 1, 1, P => {
    gRail(P, 4, 8, 20);
    layer(P, Q => {
      Q.r(5, 11, 18, 11, "#2a2c32");
      Q.r(7, 13, 4, 3, "#3a3d44");
      Q.r(20, 13, 3, 6, "#44262a");
    }, {
      bevel: [ 1, -1 ],
      cast: -2
    });
    P.r(23, 15, 8, 1, RED).p(22, 15, "#ffb0a0").r(23, 16, 8, 1, "rgba(224,70,58,0.35)");
  });
  function drawAs(P, W, H, d, name) {
    const e = D[name];
    if (!e) return false;
    if (e.w * IC === W && e.h * IC === H) {
      e.fn(P, W, H, d);
      return true;
    }
    const c = pen(e.w * IC, e.h * IC).x.canvas;
    e.fn(new A.Pen(c.getContext("2d")), c.width, c.height, d);
    const s = Math.min(1, W / c.width, H / c.height);
    P.x.imageSmoothingEnabled = false;
    P.x.drawImage(c, Math.round((W - c.width * s) / 2), Math.round((H - c.height * s) / 2), Math.round(c.width * s), Math.round(c.height * s));
    return true;
  }
  const SEED_PK = {
    "상추 씨앗": [ "#7ac050", "상추" ],
    "고추 씨앗": [ "#d8402a", "고추" ],
    "방울토마토 씨앗": [ "#e05a3a", "방울" ],
    "배추 씨앗": [ "#a8d880", "김장" ]
  };
  for (const nm of Object.keys(SEED_PK)) def(nm, 1, 1, P => {
    const q = SEED_PK[nm];
    layer(P, Q => {
      rrect(Q, 6, 5, 20, 25, 2, "#e8dcb0");
      Q.r(6, 5, 20, 2, "#d0c098");
      for (let x = 7; x < 26; x += 3) Q.p(x, 5, "#b8a880");
      Q.r(7, 10, 18, 6, q[0]);
      Q.r(7, 10, 18, 1, sh(q[0], .25));
      Q.r(7, 15, 18, 1, sh(q[0], -.2));
    }, {
      lit: pillowF(6, 5, 20, 25, 4),
      cast: -2
    });
    hgs(P, 8, 18, "#3a3020", q[1]);
    P.line(16, 29, 16, 24, "#4a7a3a");
    P.p(14, 25, "#6aa842").p(13, 24, "#6aa842").p(18, 26, "#6aa842").p(19, 25, "#6aa842");
    txt(P, 8, 27, 7, "#a89878", 3);
    txt(P, 19, 27, 6, "#a89878", 5);
  });
  def("감자 씨눈", 1, 1, P => {
    layer(P, Q => disc(Q, 16, 21, 9, 6, "#b89060"), {
      lit: ballF(16, 21, 9, 6),
      cast: -2
    });
    P.p(12, 19, "#6a4a2a").p(19, 23, "#6a4a2a").p(15, 24, "#6a4a2a").p(21, 19, "#6a4a2a");
    P.line(17, 15, 15, 8, "#7ac050");
    P.p(13, 9, "#9ad870").p(12, 8, "#9ad870").p(14, 8, "#c8ec9a").p(17, 10, "#9ad870").p(18, 9, "#9ad870");
  });
  def("상추", 1, 1, P => {
    for (const [cx, cy, rx, ry, c] of [ [ 9, 20, 7, 9, "#6aa842" ], [ 23, 20, 7, 9, "#6aa842" ], [ 16, 13, 8, 8, "#8ac85a" ], [ 16, 22, 9, 8, "#8ac85a" ] ]) layer(P, Q => disc(Q, cx, cy, rx, ry, c), {
      lit: ballF(cx, cy, rx, ry),
      cast: -1
    });
    P.line(16, 29, 16, 16, "#c8ec9a").line(16, 23, 11, 18, "#c8ec9a").line(16, 23, 21, 18, "#c8ec9a").line(9, 27, 7, 20, "#a8dc78").line(23, 27, 25, 20, "#a8dc78");
    P.p(12, 10, "#e0f8c0").p(20, 11, "#e0f8c0");
  });
  def("고추", 1, 1, P => {
    for (const [x0, y0, x1, y1] of [ [ 8, 9, 20, 27 ], [ 16, 7, 27, 24 ] ]) {
      const G = rodGeo(x0, y0, x1, y1);
      layer(P, Q => rod(Q, x0, y0, x1, y1, 4, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 3.2 - Math.max(0, l - L * .6) * .14 ? "#d8382a" : null), {
        lit: (x, y) => cylLv((G.f(x, y)[1] + 3.2) / 6.4, 1),
        cast: -2
      });
      P.line(x0, y0, x0 - 1, y0 - 4, "#4a8a3a");
      P.r(x0 - 2, y0 - 1, 4, 2, "#5e9a3c");
    }
    P.p(11, 12, "#ff8a7a").p(19, 10, "#ff8a7a");
  });
  def("방울토마토", 1, 1, P => {
    for (const [cx, cy] of [ [ 10, 21 ], [ 22, 21 ], [ 16, 12 ] ]) {
      layer(P, Q => disc(Q, cx, cy, 6, 6, "#e04a3a"), {
        lit: ballF(cx, cy, 6, 6),
        cast: -2
      });
      P.p(cx - 1, cy - 4, "#4a8a3a").p(cx, cy - 5, "#4a8a3a").p(cx + 1, cy - 4, "#4a8a3a").p(cx - 2, cy - 2, "#ff9a8a");
    }
  });
  def("감자", 1, 1, P => {
    layer(P, Q => disc(Q, 16, 17, 11, 8, "#b89060"), {
      lit: ballF(16, 17, 11, 8),
      cast: -2
    });
    P.p(10, 15, "#6a4a2a").p(19, 13, "#6a4a2a").p(14, 21, "#6a4a2a").p(22, 19, "#6a4a2a").p(8, 19, "#8a6a40");
    P.r(9, 24, 5, 1, "#8a6a40").r(19, 23, 4, 1, "#8a6a40");
  });
  def("배추", 1, 2, P => {
    layer(P, Q => {
      disc(Q, 16, 36, 12, 24, "#9ad07a");
      disc(Q, 16, 30, 8, 16, "#c8e8a0");
      disc(Q, 16, 26, 4, 9, "#eef8d8");
    }, {
      lit: ballF(16, 36, 12, 24),
      cast: -2
    });
    for (const [a, b] of [ [ 6, 20 ], [ 26, 20 ], [ 9, 12 ], [ 23, 12 ] ]) P.line(16, 58, a, b, "#62984a");
    P.line(16, 58, 16, 20, "#f4fce8");
    P.r(12, 56, 8, 3, "#e8e8c8");
    P.r(13, 59, 6, 1, "#d8d8b0");
  });
  def("삶은 감자", 1, 1, P => {
    for (const [cx, cy, rx, ry] of [ [ 11, 20, 8, 6 ], [ 21, 17, 8, 6 ] ]) layer(P, Q => disc(Q, cx, cy, rx, ry, "#e8d070"), {
      lit: ballF(cx, cy, rx, ry),
      cast: -2
    });
    P.p(9, 19, "#b89860").p(14, 22, "#b89860").p(20, 15, "#b89860").p(24, 19, "#b89860");
    for (const [x, y] of [ [ 8, 8 ], [ 12, 5 ], [ 20, 6 ], [ 24, 9 ] ]) P.p(x, y, "#949698").p(x + 1, y - 2, "#666a6e");
  });
  def("채소 샐러드", 2, 1, P => {
    layer(P, Q => {
      disc(Q, 32, 22, 26, 7, "#d8d8d0");
      Q.r(6, 22, 52, 7, "#c8c8c0");
      disc(Q, 32, 29, 24, 3, "#b8b8b0");
    }, {
      lit: (x, y) => y < 20 ? 1 : y > 27 ? -2 : 0,
      cast: -2
    });
    disc(P, 32, 21, 24, 5, "#8ac85a");
    for (const [cx, cy, c] of [ [ 14, 19, "#6aa842" ], [ 24, 16, "#8ac85a" ], [ 36, 15, "#c8ec9a" ], [ 46, 18, "#6aa842" ], [ 30, 20, "#a8dc78" ] ]) layer(P, Q => disc(Q, cx, cy, 6, 4, c), {
      lit: ballF(cx, cy, 6, 4),
      cast: 0
    });
    for (const [cx, cy] of [ [ 20, 14 ], [ 40, 13 ], [ 50, 17 ] ]) {
      layer(P, Q => disc(Q, cx, cy, 3, 3, "#e04a3a"), {
        lit: ballF(cx, cy, 3, 3),
        cast: 0
      });
      P.p(cx - 1, cy - 1, "#ff9a8a");
    }
  });
  def("지렁이", 1, 1, P => {
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      pts.push([ 5 + t * 22, 19 + Math.sin(t * Math.PI * 2) * 5 ]);
    }
    layer(P, Q => {
      for (let k = 0; k < 16; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
        Q.thick(x0, y0, x1, y1, 4, k < 4 ? "#d08a8a" : k > 12 ? "#c87a7a" : "#e09a9a");
      }
    }, {
      lit: (x, y) => {
        const t = (x - 5) / 22;
        const cy = 19 + Math.sin(Math.max(0, Math.min(1, t)) * Math.PI * 2) * 5;
        return cylLv((y + .5 - cy + 2) / 4, 0);
      },
      cast: -2
    });
    for (let k = 2; k < 15; k += 2) {
      const [x, y] = pts[k];
      P.p(Math.round(x), Math.round(y) - 1, "#b86a6a");
    }
    P.p(26, 19, "#2a1a1a");
  });
  def("빈 텃밭 칸", 1, 1, P => {
    const g = new SX.Rng(26);
    layer(P, Q => {
      Q.thick(24, 10, 28, 3, 3, "#b4503a");
      Q.line(23, 9, 27, 2, "#d87a5e");
      Q.p(28, 2, "#8a3a2a");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 18, 22 ], [ 17.5, 15 ], [ 20.5, 11 ], [ 25, 13 ], [ 23.5, 19 ] ], "#a4acb4");
      Q.line(19, 14, 21, 12, "#d8dee4");
      Q.r(23, 10, 2, 2, "#7a8088");
    }, {
      lit: (x, y) => x - y > 6 ? -1 : 0,
      cast: -2
    });
    const lump = (x, y) => {
      const nx = (x + .5 - 16) / 14, ny = (y + .5 - 23) / 7.5;
      if (nx * nx + ny * ny <= 1) return true;
      for (const [cx, cy] of [ [ 7, 17.5 ], [ 12, 16.5 ], [ 17, 16.2 ], [ 22.5, 16.8 ], [ 26, 18.5 ] ]) if (((x + .5 - cx) / 3) ** 2 + ((y + .5 - cy) / 1.8) ** 2 <= 1) return true;
      return false;
    };
    layer(P, Q => {
      for (let y = 12; y < 31; y++) for (let x = 1; x < 31; x++) if (lump(x, y)) Q.p(x, y, y < 19 ? "#6c4830" : y < 25 ? "#5c3e2a" : "#4c3222");
    }, {
      lit: (x, y) => y < 19 && x < 15 ? 1 : y > 27 || x > 27 ? -1 : 0,
      bevel: [ 1, -1 ],
      cast: 0
    });
    for (let y = 14; y < 30; y++) for (let x = 2; x < 30; x++) if (lump(x, y) && lump(x - 1, y) && lump(x + 1, y) && lump(x, y - 1) && g.f() < .24) P.p(x, y, g.pick([ "#8a6244", "#7a5438", "#34241a", "#3e2a1c" ]));
    for (const [x, y] of [ [ 8, 21 ], [ 16, 20 ], [ 24, 21 ] ]) {
      P.r(x - 1, y, 3, 1, "#2e1e14").p(x, y + 1, "#2e1e14").r(x - 1, y + 1, 1, 1, "#4a3222").p(x + 1, y + 1, "#4a3222").r(x - 1, y + 2, 3, 1, "#8a6244");
    }
    for (const [x, y] of [ [ 11, 26 ], [ 21, 25 ] ]) P.r(x, y, 2, 1, "#a4a49c").p(x, y + 1, "#6a6a64").p(x + 1, y + 1, "#7a7a74");
  });
  def("자동 급수기", 2, 1, P => {
    layer(P, Q => {
      for (let k = 0; k < 3; k++) tubeRing(Q, 45 + k, 18 + k % 2, 13 - k * 2, 8 - k, 2.6, "#34383e", -Math.PI, Math.PI);
    }, {
      cast: -2
    });
    layer(P, Q => {
      Q.r(26, 22, 8, 2, "#34383e");
      Q.r(26, 22, 8, 1, "#4e545c");
    }, {
      cast: -1
    });
    for (const [x, y] of [ [ 32, 14 ], [ 55, 11 ], [ 51, 26 ], [ 38, 25 ], [ 58, 18 ] ]) P.r(x, y, 3, 2, "#c83a2e").p(x, y, "#e85a4a").p(x + 2, y + 1, "#8a2a22");
    for (const [x, y] of [ [ 44, 9 ], [ 57, 21 ], [ 36, 19 ] ]) P.r(x, y, 1, 3, "#e4e2da").p(x, y, "#ffffff");
    layer(P, Q => {
      Q.r(59, 23, 2, 7, "#3e7a34");
      Q.r(57, 23, 5, 1, "#4e8a44");
    }, {
      lit: vcylF(57, 5),
      cast: -1
    });
    layer(P, Q => {
      rrect(Q, 3, 7, 22, 23, 3, "#dfe6ea");
      Q.r(7, 5, 14, 3, "#e8eef2");
    }, {
      lit: vcylF(3, 22),
      cast: -2
    });
    P.r(5, 17, 18, 11, "#a8cce4").r(5, 17, 18, 1, "#d0e6f4").r(20, 18, 2, 10, "#8ab6d4").p(8, 21, "#e8f4fc").p(14, 24, "#e8f4fc");
    for (const y of [ 12, 17, 22, 27 ]) P.r(4, y, 2, 1, "#9aa8b2");
    P.r(8, 9, 11, 6, "#f0e8c8").r(8, 9, 11, 1, "#d8cca0").r(9, 11, 7, 1, "#8a7a5a").r(9, 13, 5, 1, "#8a7a5a").p(17, 12, "#3a5a9a").p(16, 13, "#3a5a9a").p(18, 13, "#3a5a9a");
    P.r(3, 25, 22, 2, "#383a42").r(3, 25, 22, 1, "#50535c").r(22, 27, 3, 1, "#383a42");
    layer(P, Q => {
      Q.r(11, 1, 6, 4, "#2a64b8");
      for (let x = 11; x < 17; x += 2) Q.r(x, 1, 1, 4, "#1e4a8a");
    }, {
      lit: vcylF(11, 6, true),
      bevel: [ 1, -1 ]
    });
    layer(P, Q => {
      Q.r(17, 2, 6, 2, "#c8d0d6");
      Q.r(21, 2, 2, 5, "#c8d0d6");
    }, {
      lit: (x, y) => y < 3 ? 1 : -1,
      cast: -1
    });
    layer(P, Q => {
      Q.r(24, 20, 4, 5, "#c8963e");
      Q.r(23, 17, 6, 2, "#c83a2e");
    }, {
      lit: vcylF(24, 4, true),
      cast: -1,
      bevel: [ 1, -1 ]
    });
    P.p(18, 6, "#c8d2d8").p(19, 7, "#c8d2d8").p(5, 8, "#f8fbfc").p(5, 9, "#f8fbfc").p(10, 28, "#b8c2c8").p(16, 29, "#b8c2c8");
    P.p(23, 6, "#8a7a5a").p(24, 7, "#8a7a5a");
    layer(P, Q => {
      Q.r(24, 8, 5, 4, "#e8d8a8");
      Q.p(25, 9, "#c83a2e").p(26, 9, "#c83a2e").r(25, 10, 3, 1, "#a89870");
    }, {
      cast: -1
    });
  });
  const WORDS = [ [ "라면", "봉지라면" ], [ "통조림", "통조림 복숭아" ], [ "캔", "참치캔" ], [ "주스", "주스팩" ], [ "우유", "우유팩" ], [ "소주", "소주 두 병" ], [ "술", "청주 한 병" ], [ "물", "생수병" ], [ "음료", "이온음료" ], [ "약", "진통제" ], [ "붕대", "붕대" ], [ "열쇠", "열쇠 꾸러미" ], [ "테이프", "청테이프" ], [ "건전지", "건전지 낱개" ], [ "배터리", "보조배터리" ], [ "서류", "기밀 서류" ], [ "기록", "병원 진료기록" ], [ "일기", "손때 묻은 일기장" ], [ "사진", "오래된 사진첩" ], [ "시계", "손목시계" ], [ "목걸이", "금목걸이" ], [ "라이터", "라이터" ], [ "담배", "담배 한 갑" ], [ "공구", "몽키렌치" ] ];
  const K = {};
  K.loot = (P, W, H, d) => {
    const nm = d.name || "";
    for (const [w, n] of WORDS) if (nm.includes(w) && drawAs(P, W, H, d, n)) return;
    const hues = [ "#9a7a52", "#6a7a8a", "#7a6a8a", "#6a8a5a", "#8a6a5a", "#8a8a5a" ], col = hues[SX.hash(nm || "?") % hues.length];
    const dx = Math.max(3, Math.round(W / 10)), dy = Math.max(4, Math.round(H * .22)), w = W - 6 - dx, h = Math.round(H * .5), x = 3, y = H - 3 - h;
    layer(P, Q => {
      obox(Q, x, y, w, h, dx, dy, col);
      noise(Q, x, y - dy, w + dx, h + dy, [ sh(col, -.12), sh(col, .1) ], w * h >> 3, SX.hash(nm) % 97);
      const mx = x + (w >> 1), tw = "#d8c490";
      Q.r(mx, y, 2, h, tw);
      Q.poly([ [ mx, y ], [ mx + dx, y - dy ], [ mx + dx + 2, y - dy ], [ mx + 2, y ] ], tw);
      Q.poly([ [ x + dx / 2, y - dy / 2 - 1 ], [ x + w + dx / 2, y - dy / 2 - 1 ], [ x + w + dx / 2, y - dy / 2 + 1 ], [ x + dx / 2, y - dy / 2 + 1 ] ], tw);
      Q.r(mx - 2, y - 3, 6, 3, "#c8b078");
    }, {
      cast: 0
    });
  };
  const CLS_PIC = {
    pistol: "K5 권총",
    revolver: ".38 리볼버",
    smg: "K1A 기관단총",
    rifle: "K2 소총",
    lmg: "K3 기관총",
    sniper: "K14 저격소총",
    shotgun: "USAS-12 산탄총"
  };
  K.gun = (P, W, H, d) => drawAs(P, W, H, d, CLS_PIC[d.cls] || (d.caliber === "12게이지" || H > IC ? "USAS-12 산탄총" : W >= 4 * IC ? "K2 소총" : "K5 권총"));
  K.melee = (P, W, H, d) => drawAs(P, W, H, d, {
    knife: "식칼",
    pick: "스크류드라이버",
    axe: "캠핑도끼",
    bat: "야구방망이",
    wrench: "몽키렌치"
  }[d.style] || (H > 2 * IC ? "야구방망이" : H > IC ? "캠핑도끼" : "식칼"));
  K.mag = (P, W, H, d) => drawAs(P, W, H, d, d.cap > 60 ? "5.56mm 탄통" : d.caliber === "5.56mm" || d.caliber === "7mm" ? "5.56mm 탄창" : d.caliber === "7.62mm" ? "7.62mm 탄창" : d.caliber === "12게이지" ? "12게이지 탄" : "9mm 탄창");
  K.ammo = (P, W, H, d) => ammoBox(P, W, H, d.cal || d.caliber);
  K.heal = (P, W, H, d) => drawAs(P, W, H, d, W >= 2 * IC && H >= 2 * IC ? "구급킷" : H > W ? "소독약" : "진통제");
  K.cure = (P, W, H, d) => drawAs(P, W, H, d, "증상 억제약");
  K.flare = (P, W, H, d) => drawAs(P, W, H, d, "긴급 탈출 신호탄");
  K.grenade = (P, W, H, d) => drawAs(P, W, H, d, "수류탄");
  K.armor = (P, W, H, d) => drawAs(P, W, H, d, "방탄조끼");
  K.helmet = (P, W, H, d) => drawAs(P, W, H, d, "방탄모");
  K.bag = (P, W, H, d) => drawAs(P, W, H, d, H >= 3 * IC ? "배낭" : "작은 가방");
  K.rig = (P, W, H, d) => drawAs(P, W, H, d, "전술 조끼");
  K.junk = K.loot;
  K.part = (P, W, H, d) => drawAs(P, W, H, d, {
    muzzle: "보정기",
    mag: "퀵드로우 탄창",
    grip: "수직 손잡이",
    sight: "레드닷 사이트",
    stock: "전술 개머리판",
    laser: "레이저 사이트"
  }[d.slot] || "보정기");
  function fishBody(P, cx, cy, len, hh, body, belly, o) {
    o = o || {};
    layer(P, Q => {
      Q.oval(cx, cy, len, hh, body);
      Q.oval(cx + 1, cy + 1, len - 3, Math.max(1, hh - 2), belly);
      Q.poly([ [ cx + len - 1, cy ], [ cx + len + 4, cy - hh ], [ cx + len + 4, cy + hh ] ], body);
      Q.poly([ [ cx - 2, cy - hh + 1 ], [ cx + 3, cy - hh - 3 ], [ cx + 5, cy - hh + 1 ] ], body);
      Q.poly([ [ cx - 3, cy + 1 ], [ cx, cy + hh + 2 ], [ cx + 2, cy + 1 ] ], belly);
      if (o.spots) for (let k = 0; k < 4; k++) Q.r(cx - len + 5 + k * 4, cy - 1 + k % 2, 2, 2, o.spots);
      if (o.whisker) {
        Q.line(cx - len, cy + 1, cx - len - 5, cy + 4, body);
        Q.line(cx - len, cy, cx - len - 5, cy - 2, body);
      }
    }, {
      lit: (x, y) => y < cy - hh / 2 ? 1 : y > cy + hh / 2 ? -1 : 0,
      cast: 0
    });
    P.p(cx - len + 3, cy - 1, "#101418").p(cx - len + 3, cy - 2, "#f0f4f8");
    P.line(cx - len + 1, cy + 2, cx - len + 4, cy + 3, sh(body, -.3));
  }
  for (const f of SX.FISH || []) def(f.name, 1, 1, P => fishBody(P, 15, 17, f.kg[1] > 1 ? 11 : 9, f.kg[1] > 1 ? 5 : 4, f.col[0], f.col[1], {
    spots: f.name === "쏘가리" ? "#5a3a1a" : f.name === "배스" ? "#2a3a22" : null,
    whisker: f.name === "메기"
  }));
  def("구운 생선", 1, 1, P => {
    layer(P, Q => {
      Q.r(4, 23, 24, 2, "#8a6a3a").r(6, 25, 20, 1, "#6a4a2a");
    }, {
      cast: 0
    });
    fishBody(P, 15, 16, 10, 4, "#b07838", "#e0b068");
    P.r(7, 14, 3, 1, "#3a2a1a").r(14, 18, 4, 1, "#3a2a1a").r(20, 15, 3, 1, "#3a2a1a");
    P.line(3, 12, 29, 20, "#c8b890");
    for (const [x, y] of [ [ 9, 7 ], [ 16, 5 ], [ 22, 8 ] ]) P.p(x, y, "#c0c0c0").p(x + 1, y - 2, "#d8d8d8");
  });
  def("지렁이", 1, 1, P => {
    const g = new SX.Rng(5);
    layer(P, Q => {
      Q.oval(16, 20, 11, 6, "#6a4a3a");
      Q.oval(16, 19, 9, 4, "#8a6a4a");
      for (let k = 0; k < 14; k++) Q.p(7 + g.i(18), 16 + g.i(8), "#5a3a2a");
      for (let x = 6; x <= 26; x++) {
        const y = 12 + Math.round(Math.sin(x * .55) * 3);
        Q.r(x, y, 1, 3, x % 4 === 0 ? "#b8706a" : "#d8887a");
        Q.p(x, y, "#e8a89a");
      }
      for (let x = 10; x <= 22; x++) {
        const y = 21 + Math.round(Math.cos(x * .7) * 2);
        Q.r(x, y, 1, 2, x % 3 === 0 ? "#b8706a" : "#d08478");
      }
    }, {
      cast: 0
    });
    P.p(6, 11, "#3a1a1a");
    P.p(10, 21, "#3a1a1a");
  });
  def("낚싯대", 1, 3, P => {
    const x0 = 5, y0 = 90, x1 = 27, y1 = 4;
    layer(P, Q => {
      Q.thick(x0, y0, x0 + 4, y0 - 16, 4, "#2a2a2e");
      Q.thick(x0 + 4, y0 - 16, x0 + 6, y0 - 24, 3, "#6a4a2a");
      Q.thick(x0 + 6, y0 - 24, x1, y1, 2, "#8a6a3a");
      Q.line(x0 + 10, y0 - 40, x1, y1, "#c8a870");
      for (const t of [ .35, .55, .75, .92 ]) {
        const x = x0 + 6 + (x1 - x0 - 6) * t, y = y0 - 24 + (y1 - y0 + 24) * t;
        Q.ring(x, y, 2, 2, "#3a3a44");
      }
      Q.oval(12, 66, 5, 5, "#3a3a44");
      Q.oval(12, 66, 3, 3, "#8a8a96");
      Q.r(15, 63, 5, 2, "#3a3a44");
      Q.p(19, 60, "#c8c8d0");
    }, {
      cast: 0
    });
    P.line(27, 4, 29, 14, "#e8eef4");
    P.r(28, 14, 3, 4, "#d83a2a").r(28, 18, 3, 2, "#f0f0f0");
    P.p(12, 65, "#e8e8f0");
  });
  def("낡은 장화", 1, 1, P => {
    layer(P, Q => {
      Q.r(9, 5, 9, 18, "#3a4a3a");
      Q.r(9, 20, 18, 7, "#3a4a3a");
      Q.r(9, 24, 18, 3, "#1a2420");
      Q.r(10, 6, 2, 14, "#5a6a5a");
    }, {
      lit: (x, y) => x < 11 ? 1 : y > 23 ? -1 : 0,
      cast: 0
    });
    P.r(8, 4, 11, 2, "#6a5a3a");
    P.p(14, 12, "#2a3028");
    P.p(22, 22, "#8a7a5a");
    P.line(12, 17, 15, 19, "#2a3028");
  });
  def("빈 깡통", 1, 1, P => {
    layer(P, Q => {
      Q.r(10, 8, 12, 18, "#9a8a6a");
      Q.oval(16, 8, 6, 2, "#b8b0a0");
      Q.oval(16, 26, 6, 2, "#6a5a3a");
      Q.r(10, 13, 12, 7, "#8a3a2a");
    }, {
      lit: (x, y) => x < 13 ? 1 : x > 19 ? -1 : 0,
      cast: 0
    });
    for (const [x, y] of [ [ 12, 10 ], [ 19, 22 ], [ 15, 24 ] ]) P.p(x, y, "#7a4a2a");
    P.poly([ [ 13, 6 ], [ 17, 3 ], [ 20, 7 ] ], "#c8c0b0");
  });
  def("물먹은 나뭇가지", 1, 1, P => {
    layer(P, Q => {
      Q.thick(4, 26, 28, 8, 3, "#4a3a2a");
      Q.thick(14, 18, 20, 6, 2, "#4a3a2a");
      Q.thick(10, 21, 6, 14, 2, "#3a2a1a");
    }, {
      cast: 0
    });
    P.p(8, 22, "#2a4a3a");
    P.p(22, 11, "#2a4a3a");
    P.p(16, 16, "#6a5a4a");
  });
  def("폐지", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 3, 17 ], [ 22, 13 ], [ 27, 26 ], [ 6, 29 ] ], "#a57c4f");
      for (let k = 0; k < 5; k++) Q.line(6 + k * 4, 16 + k, 9 + k * 4, 28 - k % 2, "#8a6440");
      Q.r(15, 19, 6, 2, "#d8c890");
      Q.p(9, 25, "#6a4a2a").p(20, 24, "#6a4a2a");
    }, {
      lit: (x, y) => y < 18 ? 1 : y > 26 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 8, 6 ], [ 22, 4 ], [ 24, 17 ], [ 10, 19 ] ], "#d8d4c8");
      Q.poly([ [ 20, 4 ], [ 22, 4 ], [ 24, 9 ], [ 21, 8 ] ], "#c0bcb0");
      for (let y = 8; y < 17; y += 2) txt(Q, 11, y, 9, "#8a867c", y);
      Q.r(11, 7, 5, 1, "#4a4640");
    }, {
      lit: (x, y) => x > 21 ? -1 : y < 7 ? 1 : 0,
      cast: -2
    });
    layer(P, Q => {
      disc(Q, 23, 21, 5, 4.5, "#e8e4d8");
      Q.line(20, 19, 24, 22, "#c8c4b8").line(22, 18, 25, 20, "#b8b4a8").line(21, 23, 26, 22, "#c8c4b8");
    }, {
      lit: ballF(23, 21, 5, 4.5),
      cast: -2
    });
    layer(P, Q => {
      Q.r(4, 9, 5, 14, "#f0ece4");
      for (let y = 11; y < 20; y += 2) Q.r(5, y, 3, 1, "#9a968c");
      Q.r(5, 20, 2, 1, "#c83a2a");
      for (let x = 4; x < 9; x += 2) Q.p(x, 23, "#f0ece4");
    }, {
      cast: -1
    });
    P.r(14, 3, 4, 2, "#d8cc98").p(14, 3, "#e8dcb0");
  });
  def("빈 캔", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 5, 15 ], [ 20, 8 ], [ 25, 18 ], [ 11, 26 ] ], "#c4392f");
      Q.poly([ [ 9, 19 ], [ 21, 13 ], [ 22, 15 ], [ 10, 21 ] ], "#e9e5da");
      Q.line(13, 13, 16, 22, "#8a2a22").line(17, 11, 20, 20, "#e06050");
      Q.p(14, 18, "#e8e4da");
    }, {
      lit: (x, y) => y < x * .4 + 9 ? 1 : y > x * .4 + 15 ? -2 : 0,
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 22.5, 12.5, 3.5, 5.5, "#b9bec4");
      disc(Q, 22.5, 12.5, 2, 4, "#8a9098");
      Q.p(22, 10, "#d8dce0");
    }, {
      cast: -1
    });
    layer(P, Q => {
      disc(Q, 7, 21, 2.5, 4.5, "#9aa0a8");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.ring(26, 25, 2, 1.5, "#c8ccd0");
      Q.r(25, 24, 1, 1, "#9aa0a8");
    }, {
      cast: -1
    });
    P.p(9, 16, "#f07060").p(12, 15, "#f07060");
    P.p(20, 23, "#7a2018").p(18, 24, "#7a2018");
  });
  def("빈 병", 1, 1, P => {
    const G = rodGeo(5, 25, 24, 8);
    layer(P, Q => rod(Q, 5, 25, 24, 8, 6, (l, d, L) => {
      const r = l < L * .62 ? 5 : l < L * .78 ? 5 - (l - L * .62) / (L * .16) * 3 : 2;
      return l >= 0 && l <= L && Math.abs(d) <= r ? l > L * .25 && l < L * .5 ? Math.abs(d) < 4.2 ? "#e8eef0" : "#3f8a4a" : "#3f8a4a" : null;
    }), {
      lit: (x, y) => glassLv((G.f(x, y)[1] + 5) / 10),
      cast: 0
    });
    layer(P, Q => {
      const [cx, cy] = [ 11.5, 18.5 ];
      Q.line(cx - 2, cy - 3, cx + 2, cy + 1, "#3f8a4a");
      Q.p(cx - 1, cy - 1, "#2a6a3a").p(cx + 1, cy, "#2a6a3a");
    }, {
      cast: 0
    });
    layer(P, Q => {
      Q.poly([ [ 4, 23 ], [ 8, 21 ], [ 10, 25 ], [ 6, 27 ] ], "#2a6a34");
    }, {
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 26, 25, 3, 2, "#c8ccd0");
      Q.p(24, 24, "#e8ecf0").p(28, 26, "#8a9098");
    }, {
      cast: -1
    });
    for (const [x, y] of [ [ 13, 12 ], [ 15, 11 ], [ 21, 9 ] ]) P.p(x, y, "rgba(255,255,255,0.75)");
  });
  def("비닐", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 4, 14 ], [ 11, 8 ], [ 22, 9 ], [ 28, 16 ], [ 25, 27 ], [ 13, 29 ], [ 5, 24 ] ], "#d8dcdc");
      for (const [a, b, c, d] of [ [ 8, 15, 14, 24 ], [ 14, 11, 18, 22 ], [ 20, 12, 24, 23 ], [ 9, 20, 22, 18 ] ]) Q.line(a, b, c, d, "#aeb4b8");
      Q.r(12, 16, 7, 3, "#c83a2a");
      Q.r(13, 17, 5, 1, "#f0e8d8");
    }, {
      lit: (x, y) => x < 10 && y < 18 ? 1 : x > 23 || y > 25 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      Q.ring(11, 7, 3, 2.5, "#d8dcdc");
      Q.ring(20, 7, 3, 2.5, "#d8dcdc");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.poly([ [ 20, 21 ], [ 28, 19 ], [ 29, 25 ], [ 21, 27 ] ], "#e07a2a");
      Q.r(22, 22, 5, 2, "#c8ccd0");
      Q.line(20, 21, 21, 27, "#b8bcc0");
      Q.line(28, 19, 29, 25, "#b8bcc0");
    }, {
      cast: -2
    });
    P.p(7, 15, "#f4f8f8").p(16, 10, "#f4f8f8").p(25, 15, "#f4f8f8");
  });
  def("잡쓰레기", 1, 1, P => {
    layer(P, Q => {
      Q.poly([ [ 6, 12 ], [ 17, 9 ], [ 20, 22 ], [ 9, 25 ] ], "#ece8dc");
      Q.poly([ [ 7, 15 ], [ 18, 12 ], [ 18, 15 ], [ 7, 18 ] ], "#c8302a");
      Q.r(10, 19, 6, 1, "#c8c4b8");
    }, {
      lit: (x, y) => x < 9 ? 1 : x > 17 ? -2 : 0,
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 18.5, 15.5, 2.5, 6, "#d8d4c8");
      disc(Q, 18.5, 15.5, 1.2, 4.2, "#8a6a3a");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.thick(3, 28, 26, 22, 2, "#d8b880");
      Q.line(4, 29, 26, 24, "#c8a870");
    }, {
      cast: -2
    });
    layer(P, Q => {
      Q.r(22, 9, 5, 2, "#e8e4da");
      Q.r(27, 9, 2, 2, "#c8803a");
      Q.r(23, 13, 4, 2, "#e8e4da");
      Q.r(21, 13, 2, 2, "#c8803a");
      Q.p(22, 9, "#6a6660");
    }, {
      cast: -1
    });
    layer(P, Q => {
      disc(Q, 26, 18, 2.5, 2.5, "#c8ccd0");
      for (const [x, y] of [ [ 24, 18 ], [ 28, 18 ], [ 26, 16 ], [ 26, 20 ] ]) Q.p(x, y, "#8a9098");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.poly([ [ 2, 16 ], [ 6, 15 ], [ 5, 21 ], [ 2, 20 ] ], "#8a7a6a");
      Q.p(3, 18, "#6a5a4a");
    }, {
      cast: 0
    });
    P.p(12, 22, "#b8a070").p(14, 23, "#b8a070");
  });
  def("구리 전선", 1, 1, P => {
    const cu = [ "#c8763a", "#b4652e", "#d4844a", "#be6e34" ];
    for (let k = 0; k < 4; k++) layer(P, Q => tubeRing(Q, 15.5 + k % 2 * .8, 13 + k * 1.4, 11.5 - k * .4, 8 - k * .3, 1.8, cu[k], -Math.PI, Math.PI, true), {
      cast: k ? -1 : 0
    });
    for (const [x, y] of [ [ 4, 12 ], [ 26, 15 ] ]) layer(P, Q => {
      Q.r(x, y, 3, 8, "#2e3036");
      Q.r(x, y + 2, 3, 1, "#4a4e56");
      Q.r(x, y + 5, 3, 1, "#4a4e56");
    }, {
      lit: vcylF(x, 3, true),
      cast: -1
    });
    layer(P, Q => {
      rod(Q, 18, 24, 29, 29, 2, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1 ? l > L - 2.5 ? "#f2b678" : "#c8763a" : null);
      Q.r(27, 26, 3, 2, "#e8a868");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(10, 4, 7, 4, "#e8dcb0");
      txt(Q, 11, 5, 5, "#3a3a8a", 3);
      Q.p(16, 7, "#c8bc90");
    }, {
      cast: -1
    });
    P.p(8, 9, "#ffe0b0").p(9, 9, "#ffe0b0").p(23, 10, "#ffe0b0").p(13, 22, "#5a8a6a").p(20, 23, "#5a8a6a");
  });
  def("소형 모터", 1, 1, P => {
    const bd = "#5a6878", R = RP(bd);
    layer(P, Q => {
      Q.r(5, 24, 18, 4, "#3e4650");
      Q.r(4, 27, 20, 2, "#3e4650");
      for (const x of [ 6, 20 ]) disc(Q, x, 27.5, 1, .8, "#1e2226");
    }, {
      lit: (x, y) => y < 25 ? 1 : 0,
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      Q.r(5, 9, 18, 16, bd);
      for (let x = 7; x < 21; x += 2) Q.r(x, 9, 1, 16, R[1]);
      Q.r(9, 13, 9, 6, "#e0d8c0");
      hgs(Q, 9, 13, "#2a2e34", "모터");
      Q.r(9, 18, 9, 1, "#b8b098");
    }, {
      lit: hcylF(9, 16, true),
      cast: 0
    });
    layer(P, Q => {
      disc(Q, 5, 17, 2.5, 8, "#7a8694");
      disc(Q, 5, 17, 1.4, 5, "#56606c");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(22, 10, 4, 14, "#8a96a2");
      disc(Q, 25, 17, 2, 4, "#a8b2bc");
      for (const y of [ 11, 22 ]) Q.p(23, y, "#3a4048");
    }, {
      lit: hcylF(10, 14, true),
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.r(26, 16, 5, 2, "#c8ccd0");
      Q.p(30, 16, "#eef2f4");
      Q.r(28, 18, 2, 1, "#8a9098");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(10, 6, 3, 3, "#c8a048");
      Q.r(15, 6, 3, 3, "#c8a048");
    }, {
      bevel: [ 1, -1 ],
      cast: -1
    });
    layer(P, Q => {
      Q.line(11, 5, 7, 2, "#c83a2e");
      Q.line(7, 2, 3, 3, "#c83a2e");
      Q.line(16, 5, 19, 1, "#2a2c30");
      Q.line(19, 1, 24, 2, "#2a2c30");
      Q.p(3, 3, "#f0a868").p(24, 2, "#f0a868");
    }, {
      cast: -1
    });
    P.p(7, 22, "#a86a3a").p(8, 23, "#8a5a32").p(19, 11, "#a86a3a").line(12, 21, 16, 21, "#7a8898");
  });
  const casing = (P, x, y, ang, len, r, col) => {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, R = RP(col || "#c89a3a");
    const rf = l => l < .9 ? r + .3 : l < 1.8 ? r - .7 : l < len - 4 ? r : l < len - 2.5 ? r - (l - (len - 4)) / 1.5 * r * .4 : r * .6;
    layer(P, Q => rod(Q, x, y, ex, ey, r + 1, (l, d, L) => l < 0 || l > L || Math.abs(d) > rf(l) ? null : l < .9 ? R[1] : l < 1.8 ? R[0] : R[3]), {
      lit: rodLit(x, y, ex, ey, rf, true),
      cast: -2
    });
    disc(P, ex - Math.cos(ang) * .6, ey - Math.sin(ang) * .6, Math.max(.7, r * .45), Math.max(.7, r * .45), "#3a2a12");
  };
  def("빈 탄피 한 줌", 1, 1, P => {
    casing(P, 3, 5, .15, 13, 2.4);
    casing(P, 19, 3, .75, 11, 2.2, "#b8862e");
    casing(P, 2, 15, -.05, 12, 2.4, "#d0a848");
    casing(P, 17, 15, .5, 11, 2.2);
    casing(P, 4, 27, -.2, 12, 2.4, "#b8862e");
    layer(P, Q => {
      disc(Q, 25, 26, 4, 3.4, "#b8862e");
      disc(Q, 25, 26, 3, 2.4, "#d8ac4a");
      disc(Q, 25, 26, 1.3, 1.1, "#a8acb0");
      Q.p(24, 25, "#e8ecf0");
    }, {
      cast: -2
    });
    P.p(6, 4, "#f8e098").p(21, 4, "#f8e098").p(5, 14, "#f8e098").p(19, 15, "#f8e098").p(9, 25, "#6a5a3a").p(14, 8, "#6a5a3a");
  });
  def("화약 통", 1, 1, P => {
    const c = "#3e4a36", R = RP(c);
    layer(P, Q => {
      obox(Q, 4, 9, 19, 20, 5, 5, c);
      Q.r(6, 13, 15, 11, "#d8c890");
      Q.r(6, 13, 15, 1, "#f0e4b0");
      hgs(Q, 7, 14, "#9a2a1e", "화약");
      Q.poly([ [ 14, 23 ], [ 17, 18 ], [ 20, 23 ] ], "#e8782a");
      Q.p(17, 20, "#3a2210").p(17, 22, "#3a2210");
      txt(Q, 7, 22, 6, "#6a5a3a", 5);
      Q.r(6, 25, 15, 1, R[1]);
      Q.line(8, 10, 12, 10, R[4]);
      Q.p(20, 27, "#8a5a2a").p(5, 19, "#8a5a2a").p(19, 11, R[0]);
    }, {
      lit: (x, y) => x < 6 ? 1 : x > 21 ? -1 : 0,
      cast: 0
    });
    layer(P, Q => {
      Q.r(16, 2, 6, 6, "#b8342a");
      for (let x = 16; x < 22; x += 2) Q.r(x, 2, 1, 6, "#8a2218");
      Q.r(16, 2, 6, 1, "#e06a58");
    }, {
      lit: vcylF(16, 6, true),
      cast: -2
    });
    layer(P, Q => {
      Q.r(24, 14, 3, 9, "#c8c0a8");
      Q.r(24, 16, 3, 1, "#a8a088");
    }, {
      cast: -1
    });
  });
  def("구리 냉각관", 2, 1, P => {
    const cu = "#c8763a";
    layer(P, Q => {
      rod(Q, 1, 10, 13, 10, 2, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1.4 ? cu : null);
      Q.r(1, 7, 4, 7, "#c8a048");
      Q.r(2, 7, 1, 7, "#e8c870");
    }, {
      lit: hcylF(8.6, 3, true),
      cast: 0
    });
    layer(P, Q => {
      Q.r(15, 5, 37, 23, "#6a3a1e");
      for (let k = 0; k < 7; k++) Q.r(16 + k * 6, 6, 2, 21, "#5a301a");
    }, {
      cast: 0
    });
    for (let k = 0; k < 7; k++) layer(P, Q => tubeRing(Q, 15 + k * 6, 16, 4, 11, 2.4, k % 3 === 2 ? "#b4652e" : cu, -Math.PI, Math.PI, true), {
      cast: -1
    });
    layer(P, Q => {
      rod(Q, 54, 24, 61, 29, 2, (l, d, L) => l >= 0 && l <= L && Math.abs(d) <= 1.4 ? cu : null);
      Q.r(58, 26, 5, 4, "#c8a048");
      Q.r(58, 26, 5, 1, "#e8c870");
    }, {
      cast: -1
    });
    layer(P, Q => {
      Q.r(30, 3, 8, 3, "#e8dcb0");
      txt(Q, 31, 4, 6, "#2a3a8a", 7);
    }, {
      cast: -1
    });
    for (const [x, y] of [ [ 21, 9 ], [ 34, 23 ], [ 46, 8 ], [ 27, 25 ] ]) P.p(x, y, "#5a9a7a").p(x + 1, y, "#4a8a6a");
    P.p(13, 7, "#ffe0b0").p(25, 6, "#ffe0b0").p(37, 6, "#ffe0b0").p(49, 6, "#ffe0b0");
  });
  def("철판", 2, 2, P => {
    const c = "#7a8490", R = RP(c);
    layer(P, Q => {
      obox(Q, 3, 50, 50, 7, 10, 38, c, {
        top: R[3],
        front: R[2],
        side: R[1]
      });
      Q.x.globalCompositeOperation = "source-atop";
      noise(Q, 6, 14, 52, 34, [ R[2], R[4], "#8a929c" ], 160, 13);
      Q.x.globalCompositeOperation = "source-over";
      for (const [x, y, rx, ry] of [ [ 46, 34, 6, 3.5 ], [ 16, 41, 5, 3 ], [ 50, 18, 4, 2.5 ] ]) blob(Q, x, y, rx, ry, (nx, ny) => nx * nx + ny * ny > .55 ? "#8a5a3a" : "#a86a3a");
      for (const [x, y] of [ [ 10, 45 ], [ 47, 45 ], [ 18, 17 ], [ 56, 17 ] ]) {
        disc(Q, x, y, 2.6, 1.8, "#22262c");
        Q.p(x - 1, y - 1, "#4a525c");
      }
      Q.line(14, 26, 30, 22, R[5]);
      Q.line(26, 38, 44, 35, R[5]);
      Q.line(33, 20, 38, 19, "#c8d0d8");
      hgs(Q, 22, 28, "#e8e4d8", "강판");
      txt(Q, 23, 37, 12, "#d8d4c8", 4);
      Q.poly([ [ 42, 41 ], [ 49, 41 ], [ 47, 46 ], [ 40, 46 ] ], "#e8c020");
      Q.poly([ [ 44, 41 ], [ 46, 41 ], [ 43, 46 ], [ 41, 46 ] ], "#2a2a2a");
      Q.poly([ [ 48, 41 ], [ 49, 41 ], [ 47, 46 ], [ 45, 46 ] ], "#2a2a2a");
      for (let x = 4; x < 53; x += 3) Q.p(x, 53, R[1]);
    }, {
      cast: 0
    });
    P.line(4, 49, 13, 13, R[5]);
    P.p(14, 12, "#e8eef4");
  });
  def("금고 다이얼", 1, 1, P => {
    layer(P, Q => {
      Q.r(17, 15, 13, 5, "#c8a048");
      Q.r(17, 15, 13, 1, "#e8c870");
      for (let x = 19; x < 30; x += 3) Q.r(x, 20, 2, 2, "#a88838");
      Q.r(28, 13, 3, 9, "#b8943e");
    }, {
      bevel: [ 1, -1 ],
      cast: 0
    });
    layer(P, Q => {
      rrect(Q, 2, 4, 22, 24, 2, "#4a4e56");
      for (const [x, y] of [ [ 4, 6 ], [ 21, 6 ], [ 4, 25 ], [ 21, 25 ] ]) {
        disc(Q, x, y, 1, 1, "#9aa0a8");
      }
      Q.r(3, 27, 20, 1, "#2a2c30");
    }, {
      bevel: [ 1, -2 ],
      cast: -2
    });
    layer(P, Q => {
      blob(Q, 13, 16, 9, 9, (nx, ny) => {
        const a = Math.atan2(ny, nx), r = Math.hypot(nx, ny);
        return r > .82 ? (a * 12 / Math.PI + 24 | 0) % 2 ? "#e8ecf0" : "#8a929a" : "#c0c6cc";
      });
    }, {
      lit: ballF(13, 16, 9, 9),
      cast: 0
    });
    layer(P, Q => {
      blob(Q, 13, 16, 6, 6, (nx, ny) => {
        const a = Math.atan2(ny, nx);
        return Math.hypot(nx, ny) > .8 && (a * 10 / Math.PI + 20 | 0) % 2 ? "#3a3e44" : "#24272c";
      });
      disc(Q, 13, 16, 2, 2, "#5a6068");
    }, {
      lit: ballF(13, 16, 6, 6),
      cast: -2
    });
    P.r(13, 6, 1, 3, "#d8402a").p(12, 7, "#d8402a").p(14, 7, "#d8402a");
    P.p(10, 12, "#8a9098").p(11, 12, "#aab0b8");
    P.p(6, 22, "#8a6a3a").p(20, 9, "#8a6a3a");
    P.line(4, 14, 4, 18, "#5a6068");
  });
  function drawInto(P, W, H, d) {
    const Q = pen(W, H);
    if (!drawAs(Q, W, H, d, d.name || "") && !(d.pic && drawAs(Q, W, H, d, d.pic))) (K[d.kind] || K.loot)(Q, W, H, d);
    P.x.drawImage(Q.x.canvas, 0, 0);
  }
  A.icon = function(def) {
    if (def && def.folded && D["접힌 " + def.name]) def = Object.assign({}, def, {
      name: "접힌 " + def.name,
      folded: 0
    });
    const w = (def.w || 1) * IC, h = (def.h || 1) * IC;
    const key = "ic" + (def.name || "") + ":" + (def.kind || "") + ":" + w + "x" + h;
    const base = A.cached(key, w, h, P => drawInto(P, w, h, def), {
      mat: true,
      inset: true,
      bg: "#111317"
    });
    if (!def.rot) return ammoBadge(base, def, key);
    return ammoBadge(A.cached(key + ":r", h, w, P => {
      P.x.translate(h, 0);
      P.x.rotate(Math.PI / 2);
      P.x.drawImage(base, 0, 0);
    }), def, key + ":r");
  };
  A.iconNames = () => Object.keys(D);
  A.iconDef = name => D[name] ? {
    name,
    w: D[name].w,
    h: D[name].h
  } : null;
  function ammoBadge(c, def, key) {
    const at = def.ammoType, T = def.kind === "mag" && at && SX.AMMO_TYPES && SX.AMMO_TYPES[at];
    if (!T) return c;
    const tag = SX.ammoTypeTag ? SX.ammoTypeTag(def.caliber, at) : T.tag;
    return A.cached(key + ":at", c.width, c.height, P => {
      P.x.drawImage(c, 0, 0);
      P.r(0, 0, 11, 8, "#1a1a1e").r(1, 1, 9, 6, T.col).r(10, 1, 1, 6, "#2e3036").r(2, 7, 8, 1, "#2e3036");
      P.r(0, 8, 3, c.height - 8, "#1a1a1e").r(1, 7, 1, c.height - 8, T.col).r(2, 8, 1, c.height - 9, "#2e3036");
      A.PP.mini(P, 1, 1, tag, T.ink, 9);
    });
  }
})(window.SX);
