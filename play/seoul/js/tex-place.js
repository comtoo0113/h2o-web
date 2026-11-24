"use strict";

(function(SX) {
  const A = SX.art, TS = SX.TS, FS = A.FS, sh = A.shade, mix = A.mix, RP = A.ramp;
  const TP = SX.texPlace = {
    on: true
  };
  const MAT = TP.MAT = {
    JANG: 40,
    KVINYL: 41,
    BATH: 42,
    CARPT: 43,
    CARPM: 44,
    VCT: 45,
    GRANITE: 46,
    SWOOD: 47,
    TERR: 48,
    GYM: 49,
    MALL: 50,
    LAM: 51,
    CONCB: 52,
    GRAVEL: 53,
    PLY: 54,
    BIGT: 55,
    TACT: 56,
    PLAT: 57,
    BALLAST: 58,
    TCONC: 59,
    CARF: 60,
    HVINYL: 61,
    HGREEN: 62,
    EPOXY: 63,
    PCONC: 64,
    MCONC: 65,
    ROAD: 66,
    JOINT: 67,
    BWALK: 68,
    RGREEN: 69,
    RGREY: 70,
    PAVER: 71,
    STUDIO: 72,
    GRATE: 73,
    OWOOD: 74,
    OTERR: 75,
    CARPA: 76,
    ALLEY: 77,
    GPAVE: 78,
    YARD: 79,
    CARPS: 80
  };
  for (const k in MAT) FS["P_" + k] = MAT[k];
  TP.isMat = v => (v & 127) >= 40 && (v & 127) < 96;
  TP.idOf = v => v & 127;
  TP.vOf = v => v >> 7;
  TP.val = (id, v) => id | v << 7;
  const mod = (a, n) => (a % n + n) % n;
  const rgba = (hex, a) => {
    const [r, g, b] = A.hexRgb(hex);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  };
  function speck(P, x, y, w, h, cols, n, g) {
    for (let k = 0; k < n; k++) P.p(x + g.i(w), y + g.i(h), cols[g.i(cols.length)]);
    return P;
  }
  function chip(P, x, y, w, h, cols, n, g) {
    for (let k = 0; k < n; k++) {
      const xx = x + g.i(w - 1), yy = y + g.i(h - 1), c = cols[g.i(cols.length)];
      P.p(xx, yy, c);
      if (g.chance(.45)) P.p(xx + 1, yy, c);
      if (g.chance(.3)) P.p(xx, yy + 1, c);
    }
    return P;
  }
  function blotch(P, cx, cy, rx, ry, c, g, n) {
    for (let k = 0; k < (n || 5); k++) {
      const a = g.f() * 6.283, r = g.f() * .7;
      P.oval(Math.round(cx + Math.cos(a) * rx * r), Math.round(cy + Math.sin(a) * ry * r), Math.max(1, Math.round(rx * (.35 + g.f() * .4))), Math.max(1, Math.round(ry * (.35 + g.f() * .4))), c);
    }
    return P;
  }
  function crackLine(P, g, x, y, n, c, c2) {
    for (let k = 0; k < n; k++) {
      P.p(x, y, c);
      if (c2 && g.chance(.3)) P.p(x + 1, y, c2);
      if (g.chance(.55)) x += g.chance(.5) ? 1 : -1;
      y += g.chance(.75) ? 1 : 0;
      if (g.chance(.12)) {
        x += g.chance(.5) ? 2 : -2;
      }
    }
    return P;
  }
  function scuff(P, x, y, w, h, c, g, n) {
    for (let k = 0; k < n; k++) {
      const xx = x + g.i(w), yy = y + g.i(h), l = 2 + g.i(5);
      P.r(xx, yy, Math.min(l, x + w - xx), 1, c);
    }
    return P;
  }
  function tactStrip(P, x, y) {
    P.r(x + 8, y, 16, TS, "#b59a3a").r(x + 8, y, 1, TS, "#cdb14a").r(x + 23, y, 1, TS, "#8a7428");
    for (let yy = 2; yy < TS; yy += 5) for (let xx = 10; xx < 23; xx += 5) P.r(x + xx, y + yy, 2, 2, "#d6ba50").p(x + xx + 1, y + yy + 1, "#8a7428");
  }
  function common(P, x, y, g, v, b, o) {
    o = o || {};
    const R = RP(b);
    if (v === 8) {
      const c = o.stain || "rgba(52,36,18,0.20)";
      blotch(P, x + 8 + g.i(16), y + 8 + g.i(16), 6 + g.i(5), 4 + g.i(4), c, g, 6);
      blotch(P, x + 10 + g.i(12), y + 10 + g.i(12), 3, 2, c, g, 3);
    } else if (v === 9) {
      crackLine(P, g, x + 3 + g.i(26), y, 30, R[1], R[2]);
      if (g.chance(.5)) crackLine(P, g, x + g.i(30), y + 12 + g.i(8), 12, R[1]);
    } else if (v === 10) {
      const c = o.wear || rgba(R[5], .22);
      blotch(P, x + 16, y + 16, 12, 9, c, g, 7);
      scuff(P, x + 3, y + 4, 26, 24, rgba(R[1], .35), g, 6);
    } else if (v === 11) {
      const c = o.wet || "rgba(18,26,34,0.26)";
      blotch(P, x + 9 + g.i(14), y + 9 + g.i(14), 9 + g.i(4), 5 + g.i(3), c, g, 6);
      for (let k = 0; k < 3; k++) {
        const xx = x + 6 + g.i(20), yy = y + 6 + g.i(18);
        P.r(xx, yy, 3 + g.i(4), 1, "rgba(200,220,235,0.16)");
      }
    }
    return P;
  }
  const DRAW = {}, PER = {};
  const def = (id, per, fn) => {
    DRAW[id] = fn;
    PER[id] = per;
  };
  def(MAT.JANG, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#a8884e", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[4], R[2], sh(b, .06) ], 70, g);
    for (let k = 0; k < 6; k++) {
      let xx = x + g.i(TS), yy = y + g.i(TS);
      for (let s = 0; s < 6 + g.i(6); s++) {
        P.p(xx, yy, rgba(R[5], .35));
        xx += g.i(3) - 1;
        yy += g.chance(.5) ? 1 : 0;
      }
    }
    P.r(x, y + 9, TS, 1, rgba(R[4], .25)).r(x, y + 23, TS, 1, rgba(R[2], .18));
    if (cx === 0) P.r(x, y, 1, TS, R[2]).r(x + 1, y, 1, TS, rgba(R[5], .35));
    if (v === 12) {
      for (const [a, c] of [ [ 6, 20 ], [ 22, 9 ] ]) P.oval(x + a, y + c, 2, 1, "#3a2a18").p(x + a, y + c, "#1e140a");
    }
    if (v === 13) {
      P.r(x + 5, y + 6, 8, 8, rgba(R[1], .3)).r(x + 19, y + 6, 8, 8, rgba(R[1], .3)).r(x + 5, y + 20, 8, 8, rgba(R[1], .3)).r(x + 19, y + 20, 8, 8, rgba(R[1], .3));
    }
    common(P, x, y, g, v, b, {
      stain: "rgba(70,40,14,0.22)"
    });
  });
  def(MAT.KVINYL, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#8a8068", b2 = "#9a8e72", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const on = (i + j + cx * 4 + cy * 4 & 1) === 0, xx = x + i * 8, yy = y + j * 8;
      if (on) {
        P.poly([ [ xx + 4, yy ], [ xx + 8, yy + 4 ], [ xx + 4, yy + 8 ], [ xx, yy + 4 ] ], b2);
        P.p(xx + 4, yy + 4, "#a87a5a").p(xx + 3, yy + 4, "#c8a070").p(xx + 5, yy + 4, "#c8a070").p(xx + 4, yy + 3, "#c8a070").p(xx + 4, yy + 5, "#c8a070");
      }
    }
    speck(P, x, y, TS, TS, [ R[2], R[4] ], 40, g);
    if (cx === 0 && cy === 0) P.r(x, y, TS, 1, R[2]);
    if (v === 12) blotch(P, x + 16, y + 16, 7, 5, "rgba(120,90,40,0.22)", g, 5);
    common(P, x, y, g, v, b);
  });
  def(MAT.BATH, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const gr = "#7e807c";
    P.r(x, y, TS, TS, gr);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const wx = cx * 4 + i, wy = cy * 4 + j, blue = SX.hash("bt" + wx + ":" + wy) % 7 === 0, c = blue ? "#7f98a6" : g.chance(.15) ? "#bab8ae" : "#c6c4ba", R = RP(c), xx = x + i * 8 + 1, yy = y + j * 8 + 1;
      P.r(xx, yy, 7, 7, c).r(xx, yy, 7, 1, R[4]).r(xx, yy, 1, 7, R[4]).r(xx, yy + 6, 7, 1, R[2]).r(xx + 6, yy, 1, 7, R[2]);
      if (g.chance(.05)) {
        P.p(xx + 6, yy + 6, gr).p(xx + 5, yy + 6, R[1]);
      }
    }
    speck(P, x, y, TS, TS, [ "rgba(60,52,30,0.25)" ], 14, g);
    if (v === 11 || v === 12) {
      blotch(P, x + 16, y + 16, 11, 8, "rgba(150,180,200,0.16)", g, 6);
      for (let k = 0; k < 4; k++) P.r(x + 4 + g.i(22), y + 4 + g.i(24), 2 + g.i(4), 1, "rgba(230,240,250,0.35)");
    }
    if (v === 8) blotch(P, x + 16, y + 16, 8, 6, "rgba(60,70,40,0.22)", g, 5); else common(P, x, y, g, v === 11 || v === 12 ? -1 : v, "#c6c4ba");
  });
  def(MAT.CARPT, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const cols = [ "#4a525f", "#535b69" ];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const wx = cx * 2 + i, wy = cy * 2 + j, k = wx + wy & 1, b = cols[SX.hash("ct" + wx + ":" + wy) % 5 === 0 ? 1 - k : k], R = RP(b), xx = x + i * 16, yy = y + j * 16;
      P.r(xx, yy, 16, 16, b);
      if (k) for (let s = 0; s < 16; s += 2) P.r(xx, yy + s, 16, 1, rgba(R[2], .8)).r(xx, yy + s + 1, 16, 1, rgba(R[4], .25)); else for (let s = 0; s < 16; s += 2) P.r(xx + s, yy, 1, 16, rgba(R[2], .8)).r(xx + s + 1, yy, 1, 16, rgba(R[4], .25));
      speck(P, xx, yy, 16, 16, [ R[4], R[1], "#6a7080" ], 7, g);
    }
    if (v === 8) {
      P.oval(x + 10 + g.i(10), y + 10 + g.i(10), 4, 3, "rgba(60,36,16,0.35)").oval(x + 11 + g.i(8), y + 11 + g.i(8), 2, 1, "rgba(40,24,10,0.3)");
    } else common(P, x, y, g, v, cols[0], {
      wear: "rgba(150,156,170,0.12)"
    });
  });
  def(MAT.CARPM, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#4c3a3e", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#5a4448" ], 120, g);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const xx = x + i * 16 + 8, yy = y + j * 16 + 8;
      P.p(xx, yy - 3, R[5]).p(xx - 3, yy, R[5]).p(xx + 3, yy, R[5]).p(xx, yy + 3, R[5]).p(xx - 1, yy - 2, R[4]).p(xx + 1, yy + 2, R[4]).p(xx + 2, yy - 1, R[4]).p(xx - 2, yy + 1, R[4]).p(xx, yy, "#8a6a4a");
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.VCT, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const cols = [ "#a29c8a", "#8c887a" ];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const wx = cx * 2 + i, wy = cy * 2 + j, b = cols[wx + wy & 1], R = RP(b), xx = x + i * 16, yy = y + j * 16;
      P.r(xx, yy, 16, 16, b);
      speck(P, xx, yy, 16, 16, [ R[2], R[4], R[1] ], 30, g);
      P.r(xx, yy, 16, 1, R[4]).r(xx, yy, 1, 16, R[4]).r(xx, yy + 15, 16, 1, R[2]).r(xx + 15, yy, 1, 16, R[2]);
    }
    common(P, x, y, g, v, cols[0]);
  });
  def(MAT.GRANITE, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#5e6064", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#2e3034", "#46484c", "#8a8c90", "#a89a92", "#3a3c40" ], 150, g);
    if (cx === 0) P.r(x, y, 1, TS, R[4]);
    if (cy === 0) P.r(x, y, TS, 1, R[4]);
    if (cx === 1) P.r(x + TS - 1, y, 1, TS, R[2]);
    if (cy === 1) P.r(x, y + TS - 1, TS, 1, R[2]);
    for (let k = 0; k < 10; k++) {
      const xx = x + (cx * 32 + cy * 32 + k * 3) % 32, yy = y + k * 3;
      P.p(xx, yy, rgba("#d8dce0", .12)).p(xx + 1, yy, rgba("#d8dce0", .08));
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.SWOOD, [ 4, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#8a6840", R = RP(b);
    for (let k = 0; k < 8; k++) {
      const yy = y + k * 4, row = k, tone = [ 0, -.05, .04, -.08, .02, -.03, .06, -.06 ][(SX.hash("sw" + (cx >> 2) + ":" + k + ":" + g.i(3)) >>> 3) % 8], c = sh(b, tone);
      P.r(x, yy, TS, 4, c).r(x, yy, TS, 1, rgba(RP(c)[4], .6)).r(x, yy + 3, TS, 1, R[1]);
      const off = row * 37 % 128;
      for (let s = 0; s < TS; s++) {
        const wx = cx * TS + s;
        if ((wx + off) % 128 === 0) P.r(x + s, yy, 1, 3, R[1]);
      }
      for (let s = 0; s < 2; s++) P.r(x + g.i(TS - 6), yy + 1 + g.i(2), 3 + g.i(6), 1, rgba(R[2], .6));
    }
    if (v === 12) {
      P.oval(x + 8 + g.i(16), y + 8 + g.i(16), 2, 1, "#1a2a4a").p(x + 6 + g.i(20), y + 6 + g.i(20), "#1a2a4a");
    }
    common(P, x, y, g, v, b, {
      wear: "rgba(200,170,120,0.16)"
    });
  });
  def(MAT.TERR, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#9a958a", R = RP(b);
    P.r(x, y, TS, TS, b);
    chip(P, x, y, TS, TS, [ "#c8c4b8", "#5c5852", "#8a6c52", "#6c7a6c", "#b2ac9e", "#4a4642", "#a88e6e" ], 46, g);
    speck(P, x, y, TS, TS, [ R[2], R[4] ], 30, g);
    if (cx === 0) P.r(x, y, 1, TS, "#86764e");
    if (cy === 0) P.r(x, y, TS, 1, "#86764e");
    for (let k = 0; k < 6; k++) {
      const xx = x + 2 + (k * 11 + cx * 7) % 28;
      P.p(xx, y + 2 + k * 5, rgba("#ffffff", .08));
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.GYM, [ 4, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#ae8a58", R = RP(b);
    for (let k = 0; k < 5; k++) {
      const yy = y + Math.round(k * 6.4), hh = Math.round((k + 1) * 6.4) - Math.round(k * 6.4), c = sh(b, [ 0, -.04, .03, -.06, .02 ][(k + cx) % 5]);
      P.r(x, yy, TS, hh, c).r(x, yy, TS, 1, rgba(RP(c)[4], .6)).r(x, yy + hh - 1, TS, 1, R[2]);
      const off = k * 53 % 128;
      for (let s = 0; s < TS; s++) {
        if ((cx * TS + s + off) % 128 === 0) P.r(x + s, yy, 1, hh - 1, R[2]);
      }
      scuff(P, x, yy + 1, TS, hh - 2, rgba(R[2], .5), g, 2);
    }
    if (v === 12) P.r(x, y + 14, TS, 3, "#c8c2ae").r(x, y + 14, TS, 1, "#dcd6c2");
    if (v === 13) P.r(x + 14, y, 3, TS, "#c8c2ae").r(x + 14, y, 1, TS, "#dcd6c2");
    if (v === 14) P.r(x, y + 14, TS, 3, "#3a6a9a").r(x, y + 14, TS, 1, "#5a8aba");
    if (v === 15) P.r(x + 14, y, 3, TS, "#a8483a").r(x + 14, y, 1, TS, "#c8685a");
    for (let k = 0; k < 3; k++) P.oval(x + 4 + g.i(24), y + 4 + g.i(24), 2 + g.i(2), 1, "rgba(30,20,10,0.16)");
    if (v < 12) common(P, x, y, g, v, b);
  });
  def(MAT.MALL, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = SX.hash("ml" + (cx >> 1) + (cy >> 1) + g.i(2)) & 1 ? "#b6ae9e" : "#aea696", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let k = 0; k < 3; k++) {
      let xx = x + g.i(TS), yy = y + g.i(TS);
      for (let s = 0; s < 14; s++) {
        P.p(xx, yy, rgba(R[2], .6));
        xx += g.chance(.7) ? 1 : 0;
        yy += g.chance(.5) ? 1 : 0;
      }
    }
    speck(P, x, y, TS, TS, [ R[4], R[2] ], 30, g);
    if (cx === 0) P.r(x, y, 1, TS, R[5]);
    if (cy === 0) P.r(x, y, TS, 1, R[5]);
    if (cx === 1) P.r(x + TS - 1, y, 1, TS, R[2]);
    if (cy === 1) P.r(x, y + TS - 1, TS, 1, R[2]);
    const sx = cx * 32 + cy * 32;
    for (let k = 0; k < 20; k++) {
      const xx = x + mod(sx + k * 2 - 20, 64) - (cx ? 32 : 0);
      if (xx >= x && xx < x + TS) P.p(xx, y + k + 6, rgba("#ffffff", .13));
    }
    if (v === 12) for (let k = 0; k < 4; k++) {
      const xx = x + 4 + k * 7, yy = y + 6 + (k & 1) * 12;
      P.oval(xx, yy, 2, 3, "rgba(50,42,30,0.16)");
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.LAM, [ 4, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#9c7c58", R = RP(b);
    for (let k = 0; k < 4; k++) {
      const yy = y + k * 8, c = sh(b, [ 0, -.05, .05, -.03 ][(k + (cx >> 1)) % 4]);
      P.r(x, yy, TS, 8, c).r(x, yy, TS, 1, rgba(RP(c)[4], .7)).r(x, yy + 7, TS, 1, R[2]);
      const off = k * 41 % 96;
      for (let s = 0; s < TS; s++) if ((cx * TS + s + off) % 96 === 0) P.r(x + s, yy, 1, 7, R[2]);
      for (let s = 0; s < 3; s++) {
        const xx = x + g.i(TS - 8);
        P.r(xx, yy + 2 + g.i(4), 5 + g.i(8), 1, rgba(R[2], .55));
      }
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.CONCB, [ 4, 4 ], (P, x, y, g, cx, cy, v) => {
    const b = "#6c6b66", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#5e5d58", "#7c7b76" ], 90, g);
    for (let k = 0; k < 3; k++) {
      const ox = x + 4 + g.i(24), oy = y + 4 + g.i(24), r = 5 + g.i(6);
      for (let a = 0; a < 3.2; a += .2) P.p(ox + Math.cos(a + k) * r, oy + Math.sin(a + k) * r * .6, rgba(R[4], .5));
    }
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    if (cy === 0) P.r(x, y, TS, 1, R[2]);
    if (v === 12) {
      for (const [a, c] of [ [ 9, 12 ], [ 22, 19 ], [ 14, 25 ] ]) {
        P.r(x + a, y + c - 3, 2, 4, "#7a4a2a").p(x + a, y + c - 3, "#9a6a40").p(x + a + 1, y + c, "#4a2a18");
        P.oval(x + a + 1, y + c + 1, 2, 1, "rgba(0,0,0,0.3)");
      }
    }
    if (v === 13) blotch(P, x + 16, y + 16, 12, 9, "rgba(205,200,190,0.18)", g, 7);
    if (v === 14) {
      for (let k = 0; k < 3; k++) {
        const xx = x + 5 + k * 9, yy = y + 6 + (k & 1) * 12;
        P.oval(xx, yy, 2, 3, "rgba(40,34,26,0.28)").p(xx, yy - 2, "rgba(40,34,26,0.3)");
      }
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.GRAVEL, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#625d54", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[1], R[2] ], 120, g);
    for (let k = 0; k < 38; k++) {
      const xx = x + g.i(TS - 3), yy = y + g.i(TS - 3), c = g.pick([ "#7a746a", "#6c665e", "#857f74", "#625c52", "#8e887c" ]), Rc = RP(c), w = 2 + g.i(2), h = 2 + g.i(2);
      P.r(xx, yy, w, h, c).p(xx, yy, Rc[5]).r(xx, yy + h, w, 1, "rgba(0,0,0,0.3)").p(xx + w - 1, yy + h - 1, Rc[1]);
    }
    if (v === 12) {
      for (let k = 0; k < 4; k++) {
        const xx = x + 3 + g.i(26), yy = y + 6 + g.i(22);
        P.r(xx, yy - 3, 1, 3, "#4a5a2c").p(xx - 1, yy - 2, "#5a6a34").p(xx + 1, yy - 1, "#3e4c24");
      }
    }
    if (v === 11) blotch(P, x + 16, y + 16, 10, 6, "rgba(20,26,30,0.3)", g, 6);
  });
  def(MAT.PLY, [ 2, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#a88452", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let k = 0; k < 7; k++) {
      const yy = y + 2 + k * 4 + g.i(2);
      let xx = x;
      for (;xx < x + TS; xx += 1 + g.i(3)) P.p(xx, yy + Math.round(Math.sin((xx + cx * 32) / 6 + k) * 1.2), rgba(R[2], .6));
    }
    for (let k = 0; k < 2; k++) {
      const ox = x + 6 + g.i(20), oy = y + 6 + g.i(20);
      P.ring(ox, oy, 3 + g.i(2), 2, rgba(R[1], .5)).p(ox, oy, R[1]);
    }
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    P.r(x, y, TS, 1, R[4]).r(x, y + TS - 1, TS, 1, R[2]);
    for (const xx of cx === 0 ? [ 3 ] : [ TS - 4 ]) for (let yy = 4; yy < TS; yy += 9) P.p(x + xx, y + yy, "#4a4a4c");
    if (v === 12 || v === 14) {
      for (let k = 0; k < 3; k++) {
        const xx = x + 5 + k * 9, yy = y + 6 + (k & 1) * 12;
        P.oval(xx, yy, 2, 3, "rgba(60,44,26,0.3)");
      }
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.BIGT, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = (cx >> 0) + (cy >> 0) & 1 ? "#86888a" : "#8c8e90", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#7a7c7e" ], 40, g);
    if (cx === 0) P.r(x, y, 1, TS, R[5]);
    if (cy === 0) P.r(x, y, TS, 1, R[5]);
    if (cx === 1) P.r(x + TS - 1, y, 1, TS, R[2]);
    if (cy === 1) P.r(x, y + TS - 1, TS, 1, R[2]);
    for (let k = 0; k < TS; k++) {
      const xx = x + mod(k + cx * 32 - cy * 16, 48);
      if (xx < x + TS) P.p(xx, y + k, rgba("#e8eef4", .1)).p(xx + 1, y + k, rgba("#e8eef4", .06));
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.TACT, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#b6983a", R = RP(b);
    P.r(x, y, TS, TS, R[2]);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const xx = x + 1 + i * 10 + (i ? 1 : 0), yy = y + 1 + j * 10 + (j ? 1 : 0);
      P.r(xx, yy, 9, 9, b).r(xx, yy, 9, 1, R[4]).r(xx, yy, 1, 9, R[4]);
      if (v === 12) for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++) P.r(xx + 2 + a * 4, yy + 2 + c * 4, 2, 2, R[5]).p(xx + 3 + a * 4, yy + 3 + c * 4, R[1]); else P.r(xx + 2, yy + 1, 2, 7, R[5]).r(xx + 6, yy + 1, 2, 7, R[5]).r(xx + 3, yy + 1, 1, 7, R[3]).r(xx + 7, yy + 1, 1, 7, R[3]);
    }
    speck(P, x, y, TS, TS, [ "rgba(40,30,10,0.28)" ], 20, g);
    common(P, x, y, g, v >= 12 ? -1 : v, b);
  });
  def(MAT.PLAT, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#787672", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#6a6864", "#8a8884" ], 110, g);
    P.r(x, y, TS, 1, R[2]).r(x, y + 16, TS, 1, R[2]).r(x, y, 1, TS, R[2]).r(x + 16, y, 1, TS, R[2]);
    if (v === 15) {
      P.r(x + 8, y, 16, TS, "#b8963a");
      for (let yy = 2; yy < TS; yy += 5) for (let xx = 10; xx < 23; xx += 5) P.r(x + xx, y + yy, 2, 2, "#d4b452").p(x + xx + 1, y + yy + 1, "#8a7028");
      P.r(x + 8, y, 1, TS, "#c8a648").r(x + 23, y, 1, TS, "#8a7028");
    }
    if (v === 12) {
      P.r(x, y + 8, TS, 16, "#b8963a");
      for (let xx = 2; xx < TS; xx += 5) for (let yy = 10; yy < 23; yy += 5) P.r(x + xx, y + yy, 2, 2, "#d4b452").p(x + xx + 1, y + yy + 1, "#8a7028");
      P.r(x, y + 8, TS, 1, "#c8a648").r(x, y + 23, TS, 1, "#8a7028");
    }
    if (v === 13) {
      P.r(x + 22, y, 10, TS, "#a8a69e").r(x + 22, y, 1, TS, "#c8c6be").r(x + 29, y, 3, TS, "#5a5854");
      for (let yy = 0; yy < TS; yy += 8) P.r(x + 22, y + yy, 7, 1, "#8a8882");
    }
    if (v === 14) {
      P.r(x + 0, y, 10, TS, "#a8a69e").r(x + 9, y, 1, TS, "#c8c6be").r(x, y, 3, TS, "#5a5854");
      for (let yy = 0; yy < TS; yy += 8) P.r(x + 3, y + yy, 7, 1, "#8a8882");
    }
    if (v < 12) common(P, x, y, g, v, b);
  });
  def(MAT.BALLAST, [ 3, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#4e4c48", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let k = 0; k < 60; k++) {
      const xx = x + g.i(TS - 2), yy = y + g.i(TS - 2), c = g.pick([ "#6a6862", "#5a5852", "#7a776e", "#46443f", "#84807a" ]);
      P.r(xx, yy, 2 + g.i(2), 2, c).p(xx, yy, sh(c, .2)).p(xx + 1, yy + 1, sh(c, -.3));
    }
    for (let yy = 2; yy < TS; yy += 11) {
      P.r(x, y + yy, TS, 5, "#76726a").r(x, y + yy, TS, 1, "#8e8a82").r(x, y + yy + 4, TS, 1, "#4e4a44");
      speck(P, x, y + yy + 1, TS, 3, [ "#6a665e", "#827e76" ], 14, g);
    }
    const rail = rx => {
      P.r(x + rx, y, 3, TS, "#5c5e62").r(x + rx, y, 1, TS, "#9a9ca2").r(x + rx + 2, y, 1, TS, "#36383c");
      for (let yy = 2; yy < TS; yy += 11) P.r(x + rx - 2, y + yy + 1, 7, 2, "#3a3c40").p(x + rx - 2, y + yy + 1, "#6a6c70");
      rust(x + rx, 3);
    };
    const rust = (rx, w) => {
      for (let k = 0; k < 5; k++) P.p(x + rx + g.i(w), y + g.i(TS), g.pick([ "#7a4a2a", "#8a5a34" ]));
    };
    if (cx === 0) rail(26); else if (cx === 2) rail(3); else {
      if (g.chance(.5)) blotch(P, x + 16, y + 10 + g.i(12), 6, 3, "rgba(10,10,12,0.35)", g, 4);
    }
    if (v === 11) blotch(P, x + 16, y + 16, 9, 5, "rgba(20,30,40,0.32)", g, 5);
  });
  def(MAT.TCONC, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#4c4c49", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#3e3e3b", "#58584f" ], 110, g);
    if (g.chance(.4)) blotch(P, x + 16, y + 16, 12, 10, "rgba(10,10,10,0.07)", g, 4);
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    if (cy === 0) P.r(x, y, TS, 1, R[2]);
    if (v === 12) {
      P.r(x + 6, y + 6, 20, 20, "#2e2e2c");
      for (let k = 0; k < 6; k++) P.r(x + 8 + k * 3, y + 7, 1, 18, "#5a5a56");
      P.r(x + 6, y + 6, 20, 1, "#6a6a66").r(x + 6, y + 25, 20, 1, "#262624");
    }
    if (v === 13) {
      P.r(x, y + 12, TS, 8, "#5a5a54").r(x, y + 12, TS, 1, "#6e6e68").r(x, y + 19, TS, 1, "#383834");
      for (let xx = 4; xx < TS; xx += 10) P.p(x + xx, y + 15, "#2a2a28").p(x + xx + 1, y + 16, "#7a7a74");
    }
    common(P, x, y, g, v, b, {
      wet: "rgba(14,22,30,0.32)"
    });
  });
  def(MAT.CARF, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#55595e", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const xx = x + 2 + i * 4 + (j & 1) * 2, yy = y + 2 + j * 4;
      if (xx < x + TS - 1) P.p(xx, yy, R[4]).p(xx + 1, yy + 1, R[2]);
    }
    speck(P, x, y, TS, TS, [ "rgba(20,20,20,0.3)" ], 16, g);
    if (v === 12) P.r(x, y + 26, TS, 4, "#b89a3a").r(x, y + 26, TS, 1, "#d8ba5a");
    common(P, x, y, g, v, b);
  });
  def(MAT.HVINYL, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#b2b6b0", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#9aa0a0", "#bcc0ba", "#a6aaa6", "#a0a6a4" ], 45, g);
    if (cx === 0 && cy === 0) P.r(x, y, TS, 1, rgba(R[2], .6));
    const gl = (c, hz) => {
      const Rc = RP(c);
      if (hz) P.r(x, y + 13, TS, 6, c).r(x, y + 13, TS, 1, Rc[4]).r(x, y + 18, TS, 1, Rc[2]); else P.r(x + 13, y, 6, TS, c).r(x + 13, y, 1, TS, Rc[4]).r(x + 18, y, 1, TS, Rc[2]);
    };
    if (v === 12) gl("#5a8e66", true);
    if (v === 13) gl("#5a8e66", false);
    if (v === 14) gl("#b8743a", true);
    if (v === 15) gl("#b8743a", false);
    if (v === 8) {
      blotch(P, x + 16, y + 16, 6, 4, "rgba(96,24,22,0.32)", g, 5);
      P.p(x + 22, y + 9, "rgba(96,24,22,0.4)").p(x + 9, y + 23, "rgba(96,24,22,0.4)");
    } else if (v < 12) common(P, x, y, g, v, b, {
      wet: "rgba(120,150,170,0.18)"
    });
  });
  def(MAT.HGREEN, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#8aa296", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#7a9286", "#94aea2", "#7e968a", "#9cb6aa" ], 55, g);
    if (cx === 0) P.r(x, y, 1, TS, rgba(R[2], .7));
    if (v === 12) {
      for (const [a, c] of [ [ 7, 5 ], [ 24, 5 ], [ 7, 26 ], [ 24, 26 ] ]) P.oval(x + a, y + c, 2, 1, "rgba(30,40,36,0.28)");
    }
    common(P, x, y, g, v === 12 ? -1 : v, b, {
      stain: "rgba(110,80,40,0.18)"
    });
  });
  def(MAT.EPOXY, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#56867a", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4] ], 40, g);
    for (let k = 0; k < TS; k++) {
      const xx = x + mod(k * 2 + cx * 20 + cy * 7, 64);
      if (xx < x + TS) P.p(xx, y + k, rgba("#e0f4ee", .1));
    }
    if (v === 12) {
      P.oval(x + 16, y + 16, 5, 4, "#3a4a44").oval(x + 16, y + 16, 4, 3, "#24302c");
      for (let k = -3; k <= 3; k += 2) P.r(x + 16 + k, y + 13, 1, 7, "#6a7a74");
    }
    common(P, x, y, g, v === 12 ? -1 : v, b, {
      stain: "rgba(90,30,24,0.22)"
    });
  });
  def(MAT.PCONC, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#5d6558", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#545c50" ], 60, g);
    for (let k = 0; k < 2; k++) blotch(P, x + 6 + g.i(20), y + 6 + g.i(20), 4 + g.i(4), 3, "#73746c", g, 3);
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    if (cy === 0) P.r(x, y, TS, 1, R[2]);
    if (v === 12) P.r(x, y + 13, TS, 5, "#b4962e").r(x, y + 13, TS, 1, "#d0b24a");
    if (v === 13) P.r(x + 13, y, 5, TS, "#b4962e").r(x + 13, y, 1, TS, "#d0b24a");
    if (v === 14) {
      const n = String(1 + SX.hash("pc" + cx + ":" + cy + g.i(9)) % 9);
      A.PP.mini(P, x + 10, y + 12, n + "0", "#c8c6b8", 12, 2);
    }
    if (v < 12) common(P, x, y, g, v, b, {
      wear: "rgba(150,150,140,0.16)"
    });
  });
  def(MAT.MCONC, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#5c5c58", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#525250" ], 90, g);
    if (g.chance(.45)) blotch(P, x + 8 + g.i(16), y + 8 + g.i(16), 7 + g.i(5), 4 + g.i(3), "rgba(12,10,8,0.3)", g, 6);
    if (g.chance(.3)) for (let k = 0; k < TS; k += 2) P.r(x + k, y + 9 + g.i(2), 1, 3, "rgba(20,20,20,0.18)");
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    if (v === 12) P.r(x, y + 13, TS, 5, "#b4962e").r(x, y + 13, TS, 1, "#d0b24a");
    if (v === 13) P.r(x + 13, y, 5, TS, "#b4962e").r(x + 13, y, 1, TS, "#d0b24a");
    if (v === 14) for (let k = -TS; k < TS; k += 8) {
      for (let s = 0; s < 4; s++) P.line(x + k + s, y + TS - 1, x + k + s + TS, y, "#b4962e");
    }
    if (v < 12) common(P, x, y, g, v, b);
  });
  def(MAT.ROAD, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#3a3c40", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#333539", "#45474c", "#2c2e31", "#4c4e52", "#4a4844" ], 200, g);
    if (v === 10) {
      const pts = [ [ 4 + g.i(4), 5 ], [ 22 + g.i(6), 4 + g.i(3) ], [ 27, 16 + g.i(6) ], [ 18 + g.i(5), 26 ], [ 5, 23 + g.i(4) ], [ 3, 13 ] ].map(([a, c]) => [ x + a, y + c ]);
      P.poly(pts, "#2e3033");
      speck(P, x + 6, y + 7, 20, 16, [ "#3a3c40", "#26282b" ], 40, g);
    }
    if (v === 9) {
      P.oval(x + 16, y + 16, 7, 4, "#1c1d20").oval(x + 16, y + 15, 6, 3, "#26282b");
      chip(P, x + 9, y + 12, 14, 8, [ "#55575c", "#6a6c70" ], 8, g);
    }
    if (v === 8) {
      for (let k = 0; k < TS; k++) P.p(x + k, y + 10 + Math.round(Math.sin(k / 7) * 2), "rgba(10,10,12,0.4)").p(x + k, y + 20 + Math.round(Math.sin(k / 7) * 2), "rgba(10,10,12,0.35)");
    }
    if (v === 11) blotch(P, x + 16, y + 16, 11, 6, "rgba(40,60,80,0.28)", g, 6);
    const paint = (px, pw, c) => {
      P.r(x + px, y, pw, TS, c).r(x + px, y, 1, TS, sh(c, .12));
      for (let k = 0; k < 14; k++) P.p(x + px + g.i(pw), y + g.i(TS), g.chance(.6) ? "#3a3c40" : sh(c, -.25));
    };
    if (v === 12) paint(14, 4, "#c8c4b6");
    if (v === 13) {
      paint(25, 2, "#c0a03a");
      paint(29, 2, "#c0a03a");
    }
    if (v === 14) {
      paint(1, 2, "#c0a03a");
      paint(5, 2, "#c0a03a");
    }
    if (v === 15) paint(2, 3, "#c8c4b6");
    if (v === 16) paint(27, 3, "#c8c4b6");
    if (v === 17) for (let k = 0; k < 32; k += 8) paint(k, 5, "#c8c4b6");
  });
  def(MAT.JOINT, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#3a3c40";
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#333539", "#45474c", "#55575c" ], 120, g);
    P.r(x, y + 9, TS, 14, "#55595e").r(x, y + 9, TS, 1, "#7a7e84").r(x, y + 22, TS, 1, "#2a2c30");
    for (let k = 0; k < TS; k += 4) {
      P.r(x + k, y + 11, 2, 5, "#686c72").r(x + k + 2, y + 16, 2, 5, "#686c72").p(x + k, y + 11, "#8a8e94").p(x + k + 2, y + 20, "#3a3c40");
    }
    P.r(x, y + 15, TS, 1, "#1e2024");
    for (const xx of [ 4, 20 ]) P.p(x + xx, y + 10, "#9aa0a6").p(x + xx + 1, y + 21, "#9aa0a6");
    for (let k = 0; k < 6; k++) P.p(x + g.i(TS), y + 10 + g.i(12), g.pick([ "#7a4a2a", "#8a5a34", "#6a3a20" ]));
  });
  def(MAT.BWALK, [ 1, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#76746e", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[3], "#6a6862" ], 60, g);
    if (cy === 0) P.r(x, y, TS, 1, R[2]).r(x, y + 1, TS, 1, rgba(R[5], .4));
    if (v === 12) {
      P.r(x + 8, y + 8, 16, 16, "#2a2c2e");
      for (let k = 0; k < 5; k++) P.r(x + 9 + k * 3, y + 9, 2, 14, "#5a5e62").p(x + 9 + k * 3, y + 9, "#7a7e82");
    }
    common(P, x, y, g, v, b);
  });
  def(MAT.RGREEN, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#4a7458", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#3e664c" ], 70, g);
    if (g.chance(.5)) blotch(P, x + 8 + g.i(16), y + 8 + g.i(16), 8, 6, "#5a8466", g, 4);
    if (cx === 0) P.r(x, y, 1, TS, rgba(R[2], .7));
    if (v === 12) {
      P.ring(x + 16, y + 16, 9, 6, "rgba(200,200,180,0.25)").ring(x + 16, y + 16, 7, 4, "rgba(200,200,180,0.18)");
    }
    if (v === 9) {
      crackLine(P, g, x + 4 + g.i(24), y, 32, "#6e706a", "#5a5c56");
    } else common(P, x, y, g, v === 12 ? -1 : v, b, {
      stain: "rgba(40,50,20,0.3)"
    });
  });
  def(MAT.RGREY, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#64666a", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], "#5a5c60", "#6e706c" ], 70, g);
    if (cy === 0) P.r(x, y, TS, 2, R[4]).r(x, y + 2, TS, 1, R[2]);
    if (v === 12) {
      P.oval(x + 16, y + 16, 6, 4, "#2a2c2e");
      for (let k = -4; k <= 4; k += 2) P.r(x + 16 + k, y + 13, 1, 7, "#5a5c60");
    }
    if (g.chance(.4)) chip(P, x + g.i(20), y + g.i(20), 12, 10, [ "#7a7c78", "#8a8c86" ], 10, g);
    common(P, x, y, g, v === 12 ? -1 : v, b);
  });
  def(MAT.PAVER, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    P.r(x, y, TS, TS, "#4c4a46");
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const wx = cx * 2 + i, wy = cy * 2 + j, red = SX.hash("pr" + (wx >> 2) + ":" + (wy >> 2)) % 5 === 0 && (wx + wy & 1) === 0, hv = SX.hash("pv" + wx + ":" + wy) % 7;
      const c = red ? "#76584c" : hv === 0 ? "#5e5c58" : hv === 1 ? "#74716a" : "#6a6762", R = RP(c), xx = x + i * 16, yy = y + j * 16;
      P.r(xx + 1, yy + 1, 14, 14, c).r(xx + 2, yy + 1, 12, 1, R[4]).r(xx + 1, yy + 2, 1, 12, R[4]).r(xx + 2, yy + 14, 12, 1, R[2]).r(xx + 14, yy + 2, 1, 12, R[2]);
      speck(P, xx + 2, yy + 2, 12, 12, [ R[2], R[4] ], 8, g);
    }
    if (v === 12) for (let k = 0; k < 5; k++) {
      const xx = x + (g.chance(.5) ? 0 : 15) + g.i(2), yy = y + g.i(TS);
      P.p(xx, yy, "#4a6a2c").p(xx + 1, yy - 1, "#5a7a34");
    }
    if (v === 9) {
      const xx = x + 16 * g.i(2), yy = y + 16 * g.i(2);
      P.r(xx + 1, yy + 1, 14, 14, "#3e3428");
      speck(P, xx + 1, yy + 1, 14, 14, [ "#5a4a36", "#2e2620" ], 24, g);
    }
    if (v === 8 || v === 10 || v === 11) common(P, x, y, g, v, "#6a6762");
    if (v === 15) tactStrip(P, x, y);
  });
  def(MAT.STUDIO, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#2c2c30", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[3], R[2], "#36363a" ], 40, g);
    if (cx === 0) P.r(x, y, 1, TS, R[4]);
    if (v === 12) P.r(x + 12, y + 15, 9, 2, "#c8c4b0").r(x + 15, y + 12, 2, 9, "#c8c4b0");
    if (v === 13) P.r(x, y + 14, TS, 3, "#c0a43a").r(x, y + 14, TS, 1, "#d8bc52");
    scuff(P, x + 2, y + 2, 28, 28, rgba(R[5], .4), g, 3);
  });
  def(MAT.GRATE, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    P.r(x, y, TS, TS, "#202224");
    for (let k = 0; k < TS; k += 4) P.r(x, y + k, TS, 2, "#54585c").r(x, y + k, TS, 1, "#6e7276");
    for (let k = 0; k < TS; k += 8) P.r(x + k, y, 2, TS, "#4a4e52").r(x + k, y, 1, TS, "#62666a");
    for (let k = 0; k < 10; k++) P.p(x + g.i(TS), y + g.i(TS), g.pick([ "#7a4a2a", "#8a5a34" ]));
    if (v === 11) blotch(P, x + 16, y + 16, 8, 5, "rgba(20,30,40,0.3)", g, 4);
  });
  def(MAT.OWOOD, [ 4, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#6a5036", R = RP(b);
    for (let k = 0; k < 8; k++) {
      const yy = y + k * 4, c = sh(b, [ 0, -.08, .04, -.12, .02, -.05, .06, -.1 ][(k + cx * 3 + g.i(2)) % 8]);
      P.r(x, yy, TS, 4, c).r(x, yy, TS, 1, rgba(RP(c)[4], .5)).r(x, yy + 3, TS, 1, R[0]);
      const off = k * 29 % 96;
      for (let s = 0; s < TS; s++) if ((cx * TS + s + off) % 96 === 0) P.r(x + s, yy, 1, 3, R[0]);
      if (g.chance(.12)) P.r(x + g.i(TS - 8), yy + 1, 6 + g.i(6), 2, R[1]);
    }
    speck(P, x, y, TS, TS, [ "rgba(30,20,10,0.3)" ], 30, g);
    common(P, x, y, g, v, b, {
      wear: "rgba(170,140,100,0.14)"
    });
  });
  def(MAT.OTERR, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#8a857a", R = RP(b);
    P.r(x, y, TS, TS, b);
    chip(P, x, y, TS, TS, [ "#c6c2b6", "#4c4842", "#7a5c44", "#5c6a5c" ], 60, g);
    speck(P, x, y, TS, TS, [ R[2], R[1], "rgba(40,30,16,0.3)" ], 70, g);
    if (cx === 0) P.r(x, y, 1, TS, "#76684a");
    if (cy === 0) P.r(x, y, TS, 1, "#76684a");
    if (g.chance(.35)) crackLine(P, g, x + g.i(TS), y, 28, R[1]);
    common(P, x, y, g, v, b);
  });
  def(MAT.CARPA, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#4a5040", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[4], "#545a48", "#3e4436" ], 160, g);
    for (let s = 0; s < TS; s += 3) P.r(x, y + s, TS, 1, rgba(R[2], .25));
    common(P, x, y, g, v, b);
  });
  def(MAT.ALLEY, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#74726c", R = RP(b);
    P.r(x, y, TS, TS, b);
    for (let s = 0; s < TS; s += 2) P.r(x, y + s, TS, 1, rgba(g.chance(.5) ? R[4] : R[2], .35));
    speck(P, x, y, TS, TS, [ R[2], R[4] ], 60, g);
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    if (cy === 0) P.r(x, y, TS, 1, R[2]);
    if (v === 12) {
      P.oval(x + 16, y + 16, 11, 7, "#3a3c3e").oval(x + 16, y + 16, 10, 6, "#4e5052");
      for (let k = -8; k <= 8; k += 4) P.r(x + 16 + k, y + 12, 2, 9, "#5e6062");
    }
    common(P, x, y, g, v === 12 ? -1 : v, b);
    if (v === 15) tactStrip(P, x, y);
  });
  def(MAT.GPAVE, [ 2, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#6a6c6e", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#58595c", "#747678", "#7e8082", "#4a4c4e" ], 110, g);
    if (cx === 0) P.r(x, y, 1, TS, R[2]);
    P.r(x, y, TS, 1, R[2]).r(x, y + 1, TS, 1, rgba(R[5], .4));
    common(P, x, y, g, v, b);
    if (v === 15) tactStrip(P, x, y);
  });
  def(MAT.YARD, [ 1, 1 ], (P, x, y, g, cx, cy, v) => {
    const b = "#5c4a38", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ "#4e3e2e", "#665440", "#56463a", "#6e5c48" ], 180, g);
    for (let k = 0; k < 6; k++) {
      const xx = x + g.i(TS - 2), yy = y + g.i(TS - 2);
      P.r(xx, yy, 2, 2, "#7a6a58").p(xx, yy, "#8e7e6a").p(xx + 1, yy + 1, "#3e3024");
    }
    const rut = hz => {
      for (let k = 0; k < TS; k++) {
        for (const o of [ 7, 22 ]) {
          const a = hz ? x + k : x + o + Math.round(Math.sin((cy * TS + k) / 9)), b2 = hz ? y + o + Math.round(Math.sin((cx * TS + k) / 9)) : y + k;
          P.r(a, b2, hz ? 1 : 4, hz ? 4 : 1, "#4a3a2a");
          if (k % 3 === 0) P.p(hz ? a : a + 1, hz ? b2 + 1 : b2, "#3a2c20");
        }
      }
    };
    if (v === 12) rut(true);
    if (v === 13) rut(false);
    if (v === 11) blotch(P, x + 16, y + 16, 11, 7, "rgba(30,36,40,0.4)", g, 6);
  });
  def(MAT.CARPS, [ 2, 2 ], (P, x, y, g, cx, cy, v) => {
    const b = "#2e3646", R = RP(b);
    P.r(x, y, TS, TS, b);
    speck(P, x, y, TS, TS, [ R[2], R[3], "#3a4256" ], 90, g);
    if ((cx + cy & 1) === 0) for (let s = 0; s < TS; s += 4) P.r(x + s, y, 1, TS, rgba(R[4], .18));
    common(P, x, y, g, v, b);
  });
  TP.DRAW = DRAW;
  const baseTile = A.floorTile, baseCached = A.floorCached, fcache = A.keyMap ? A.keyMap(new Map, "pfloor:") : new Map;
  function drawMat(ctx, val, px, py, sub, cx, cy) {
    const id = val & 127, v = val >> 7, P = new A.Pen(ctx), g = new SX.Rng(SX.hash("mt" + id + ":" + v + ":" + sub + ":" + cx + ":" + cy));
    DRAW[id](P, px, py, g, cx, cy, v);
  }
  A.floorTile = function(ctx, style, px, py, seed, tx, ty, tint) {
    if (DRAW[style & 127] && (style & 127) >= 40) {
      const per = PER[style & 127];
      drawMat(ctx, style, px, py, (seed >>> 0) % 3, mod(tx, per[0]), mod(ty, per[1]));
      return;
    }
    return baseTile(ctx, style, px, py, seed, tx, ty, tint);
  };
  A.floorCached = function(style, tx, ty, seed, tint) {
    const id = style & 127;
    if (id < 40 || !DRAW[id]) return baseCached(style, tx, ty, seed, tint);
    const per = PER[id], cx = mod(tx, per[0]), cy = mod(ty, per[1]), sub = (seed >>> 0 >>> 3) % 3, key = style + ":" + cx + ":" + cy + ":" + sub;
    let c = fcache.get(key);
    if (!c) {
      c = A.mk(TS, TS);
      drawMat(c.getContext("2d"), style, 0, 0, sub, cx, cy);
      fcache.set(key, c);
    }
    return c;
  };
  const W = TP.W = {
    FLOWER: 1,
    BRICK: 2,
    OFFI: 3,
    OFFX: 4,
    SCHI: 5,
    SCHX: 6,
    MALI: 7,
    SHUT: 8,
    MALX: 9,
    HOSI: 10,
    HOSW: 11,
    HOSX: 12,
    METI: 13,
    METX: 14,
    BASI: 15,
    CORR: 16,
    BASX: 17,
    TUN: 18,
    STAT: 19,
    SCON: 20,
    HOARD: 21,
    CONT: 22,
    OLDS: 23,
    STUD: 24,
    HELX: 25,
    SOFF: 26,
    CAR: 27,
    HUT: 28,
    VHALL: 29,
    KITCH: 30,
    BATHW: 31,
    WOODP: 32,
    CMU: 33
  };
  const CAP = {
    1: "#2e2a27",
    2: "#2f2a28",
    3: "#2a2c31",
    4: "#2a2c30",
    5: "#2a2e2a",
    6: "#2c2e2a",
    7: "#2d2c2a",
    8: "#2d2c2a",
    9: "#2e2d2b",
    10: "#2b2f2f",
    11: "#2b2f2e",
    12: "#2c302f",
    13: "#28292c",
    14: "#27282b",
    15: "#2a2d27",
    16: "#2a2c28",
    17: "#2b2d27",
    18: "#252624",
    19: "#28292b",
    20: "#2e2e2b",
    21: "#2a2c2e",
    22: "#2a2b2d",
    23: "#2c2b27",
    24: "#232327",
    25: "#25272b",
    26: "#2c2e2e",
    27: "#2a2d30",
    28: "#282926",
    29: "#2d2b28",
    30: "#2c2c2a",
    31: "#2a2d2e",
    32: "#2c2926",
    33: "#2b2b29"
  };
  const BASEC = {
    1: "#b0a284",
    2: "#7a4a3a",
    3: "#8c9095",
    4: "#7a7c7e",
    5: "#b8b096",
    6: "#b4aa90",
    7: "#c2c0b8",
    8: "#7e8288",
    9: "#a29888",
    10: "#c0c4c0",
    11: "#a2b6aa",
    12: "#b6bab6",
    13: "#98989a",
    14: "#5c5e62",
    15: "#8c9286",
    16: "#6a6e62",
    17: "#7e7c66",
    18: "#5a5a56",
    19: "#b6ae9e",
    20: "#7a7974",
    21: "#7c8288",
    22: "#5a5a62",
    23: "#9a9478",
    24: "#3a3a40",
    25: "#3e464e",
    26: "#a8aaa6",
    27: "#8a9096",
    28: "#6e6e66",
    29: "#a49c88",
    30: "#c0beb4",
    31: "#a8bcc4",
    32: "#7a5a3c",
    33: "#8a8a84"
  };
  TP.CAP = CAP;
  TP.BASEC = BASEC;
  const tokInfo = new Map;
  TP.tok = (st, col) => {
    const k = "@" + st + (col ? ":" + col : "");
    if (!tokInfo.has(k)) tokInfo.set(k, {
      st,
      col: col || null
    });
    return k;
  };
  const parseTok = k => {
    let t = tokInfo.get(k);
    if (!t) {
      const m = /^@(\d+)(?::(#[0-9a-fA-F]{6}))?$/.exec(k);
      t = {
        st: m ? +m[1] : 3,
        col: m && m[2] ? m[2] : null
      };
      tokInfo.set(k, t);
    }
    return t;
  };
  TP.colOf = k => {
    const t = parseTok(k);
    return t.col || BASEC[t.st] || A.C.wallF;
  };
  let FH = 24, DH = 0;
  const MV = k => Math.round(DH * k);
  function topShade(P, R) {
    P.r(0, 0, TS, 2, R[1]).r(0, 2, TS, 1, R[2]);
  }
  function skirt(P, c, h) {
    const R = RP(c);
    h = h || 4;
    P.r(0, FH - h, TS, h, c).r(0, FH - h, TS, 1, R[4]).r(0, FH - 1, TS, 1, R[1]);
  }
  function endsOf(P, R, ends) {
    if (ends & 1) P.r(0, 0, 2, FH, R[4]).r(0, 0, 1, FH, R[5]);
    if (ends & 2) P.r(TS - 2, 0, 2, FH, R[1]).r(TS - 1, 0, 1, FH, R[0]);
  }
  function oldDeco(P, R, deco) {
    const o = MV(.5);
    if (deco === 1) P.r(9, 4 + o, 12, 11, "#c9c3b0").r(9, 4 + o, 12, 1, "#e0dccb").r(20, 5 + o, 1, 10, "#a39c86").r(11, 6 + o, 8, 1, "#9a3a30").r(11, 8 + o, 6, 1, "#6a6458").r(11, 10 + o, 7, 1, "#6a6458").r(11, 12 + o, 5, 1, "#6a6458").r(10, 4 + o, 3, 1, "rgba(230,220,170,0.8)"); else if (deco === 2) P.line(6, 14 + o, 12, 8 + o, "#b8322e").line(12, 8 + o, 16, 14 + o, "#b8322e").line(18, 9 + o, 26, 9 + o, "#3a70c0").line(22, 9 + o, 22, 15 + o, "#3a70c0"); else if (deco === 3) {
      let x = 20, y = 3;
      for (let k = 0; k < 14; k++) {
        P.p(x, y, R[0]);
        x += k % 3 === 0 ? -1 : 0;
        y++;
      }
    } else if (deco === 4) P.r(12, 6, 8, 5, "#2a2c30").r(13, 7, 6, 3, "#d8e6d0").p(14, 8, "#5fbf6a");
  }
  function win(P, o) {
    const F = RP(o.frame || "#2a2c30"), G = o.glass || A.C.glass, Q = A.winGeo(FH), y0 = Q.y, h = Q.h, b = y0 + h - 3;
    P.r(3, y0, 26, h, o.frame || "#2a2c30").r(4, y0 + 1, 24, h - 2, A.C.glassDk).r(4, y0 + 1, 24, h - 2, G).r(4, y0 + 1, 24, 2, A.C.glass2);
    P.line(6, b, 12, y0 + 3, A.C.glass2).line(8, b, 13, y0 + 5, "#b8dce6").line(19, b, 24, y0 + 5, A.C.glass2);
    if (o.split !== false) P.r(15, y0 + 1, 2, h - 2, o.frame || "#2a2c30");
    P.r(3, y0, 26, 1, F[4]).r(3, y0 + h - 1, 26, 1, F[1]);
    if (o.grill) {
      const gc = o.grill, Rg = RP(gc);
      for (let x = 6; x < 28; x += 4) P.r(x, y0 + 1, 1, h - 2, gc).p(x, y0 + 1, Rg[4]);
      P.r(4, y0 + Math.round(h * .4), 24, 1, gc).r(4, y0 + Math.round(h * .67), 24, 1, gc);
      P.r(3, y0 - 1, 26, 1, Rg[1]);
    }
    if (o.tape) P.line(5, y0 + 2, 26, y0 + h - 2, o.tape).line(5, y0 + h - 2, 26, y0 + 2, o.tape);
    if (o.blind) {
      for (let y = y0 + 2; y < y0 + h - 2; y += 2) P.r(4, y, 24, 1, o.blind);
    }
    if (o.sill !== false) P.r(3, y0 + h - 1, 26, 2, o.sill || "#9c988e").r(3, y0 + h, 26, 1, sh(o.sill || "#9c988e", -.4));
  }
  const tiles = (P, x0, y0, w, h, s, c, gr, g, o) => {
    o = o || {};
    P.r(x0, y0, w, h, gr);
    for (let y = y0; y < y0 + h; y += s) for (let x = x0; x < x0 + w; x += s) {
      const cc = o.acc && g.chance(o.acc) ? o.accCol : g.chance(.18) ? sh(c, -.05) : c, R = RP(cc), ww = Math.min(s - 1, x0 + w - x), hh = Math.min(s - 1, y0 + h - y);
      P.r(x, y, ww, hh, cc).r(x, y, ww, 1, R[4]).r(x + ww - 1, y, 1, hh, R[2]);
    }
  };
  const stain = (P, g, x, y, c) => {
    for (let k = 0; k < 5; k++) P.r(x + g.i(4), y + g.i(3), 1, 2 + g.i(6), c);
  };
  const smallBits = (P, g, ph, kind, o) => {
    if (kind !== 0) return;
    const h = SX.hash("wb" + o.st + ":" + ph) % 13, q = MV(.5);
    if (h === 1) {
      P.r(5, 15 + DH, 4, 3, "#d8d4c8").r(5, 15 + DH, 4, 1, "#f0ece0").p(6, 16 + DH, "#3a3a3a").p(7, 16 + DH, "#3a3a3a");
    } else if (h === 4) {
      P.r(24, 9 + q, 3, 5, "#d8d4c8").r(24, 9 + q, 3, 1, "#f0ece0").p(25, 11 + q, "#6a665e");
    } else if (h === 7 && o.alarm !== false) {
      P.r(14, 4 + q, 4, 3, "#a83a30").r(14, 4 + q, 4, 1, "#d8584a").p(15, 5 + q, "#f0d0a0");
    } else if (h === 9) {
      P.r(20, 6 + q, 6, 4, "rgba(230,220,170,0.35)").r(8, 11 + q, 4, 3, "rgba(230,220,170,0.3)");
    } else if (h === 11 && o.plate) {
      P.r(11, 5 + q, 10, 5, o.plate).r(11, 5 + q, 10, 1, sh(o.plate, .3)).r(11, 9 + q, 10, 1, sh(o.plate, -.35));
      A.PP.mini(P, 12, 5 + q, String(100 + SX.hash("pl" + ph) % 300).slice(0, 2), "#2a2c30", 8);
    }
  };
  const FRONT = {};
  FRONT[W.FLOWER] = (P, g, ph, kind) => {
    const b = BASEC[W.FLOWER], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let j = 0, nj = 3 + Math.floor(DH / 5); j < nj; j++) for (let i = 0; i < 4; i++) {
      const x = i * 8 + (j & 1) * 4 + 2, y = 4 + j * 5;
      P.p(x, y, "#a8705a").p(x - 1, y, "#b8806a").p(x + 1, y, "#b8806a").p(x, y - 1, "#b8806a").p(x, y + 1, "#b8806a").p(x + 2, y + 1, "#7a8a5a").p(x + 1, y + 2, "#6a7a4a");
    }
    for (let x = 0; x < TS; x += 8) P.r(x + 6, 3, 1, 16 + DH, rgba(R[4], .35));
    topShade(P, R);
    skirt(P, "#6a4a30", 4);
    const h = SX.hash("fl" + ph) % 9;
    if (h === 2) {
      P.poly([ [ 26, 3 ], [ 32, 3 ], [ 32, 12 ], [ 28, 8 ] ], "#9a948a");
      P.line(26, 3, 28, 8, R[1]).line(28, 8, 31, 12, R[1]);
    } else if (h === 5) for (let k = 0; k < 6; k++) P.r(8 + g.i(14), 3, 1, 5 + g.i(9) + MV(.5), "rgba(110,80,40,0.25)"); else if (h === 7) for (let k = 0; k < 14; k++) P.p(2 + g.i(28), 15 + DH + g.i(4), "rgba(40,50,30,0.5)");
  };
  FRONT[W.BRICK] = (P, g, ph, kind) => {
    P.r(0, 0, TS, FH, "#8e867a");
    for (let row = 0, nr = 6 + (DH >> 2); row < nr; row++) {
      const y = row * 4 + 1, off = (row & 1) * 4;
      for (let x = -off; x < TS; x += 8) {
        const c = SX.hash("br" + ph + ":" + row + ":" + x) % 7 === 0 ? "#5e3a2e" : SX.hash("bq" + ph + row + x) % 3 === 0 ? "#86523e" : "#7a4a3a", R = RP(c), a = Math.max(0, x), e = Math.min(TS, x + 7);
        P.r(a, y, e - a, 3, c).r(a, y, e - a, 1, R[4]);
      }
    }
    if (SX.hash("ef" + ph) % 3 === 0) for (let k = 0; k < 5; k++) P.r(3 + g.i(26), 6 + g.i(10 + DH), 1, 2 + g.i(4), "rgba(220,216,200,0.35)");
    P.r(0, 0, TS, 2, "#5a5650").r(0, 2, TS, 1, "#6e6a62");
    skirt(P, "#6a6862", 3);
  };
  FRONT[W.OFFI] = (P, g, ph, kind) => {
    const b = BASEC[W.OFFI], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 3, TS, 16 + DH, [ R[2], R[4] ], .04, g);
    if ((ph & 1) === 0) P.r(0, 3, 1, 16 + DH, R[2]);
    P.r(0, 12 + DH, TS, 3, "#5e6268").r(0, 12 + DH, TS, 1, "#7e848a").r(0, 14 + DH, TS, 1, "#44474c");
    topShade(P, R);
    skirt(P, "#3c3e42", 4);
    for (let k = 0; k < 3; k++) P.r(2 + g.i(26), 16 + DH + g.i(2), 2 + g.i(5), 1, R[2]);
  };
  FRONT[W.OFFX] = (P, g, ph, kind) => {
    const b = BASEC[W.OFFX], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4] ], .08, g);
    for (let y = 11; y < FH - 4; y += 24) P.r(0, y, TS, 1, R[2]);
    if ((ph & 1) === 0) P.r(0, 0, 1, FH, R[2]);
    for (let k = 0; k < FH; k += 24) for (const [x, y] of [ [ 3, 5 ], [ 28, 5 ], [ 3, 16 ], [ 28, 16 ] ]) P.p(x, y + k, R[1]);
    for (let k = 0; k < 4; k++) P.r(5 + g.i(22), 2, 1, 4 + g.i(10), rgba(R[1], .35));
    topShade(P, R);
    skirt(P, "#4e5052", 3);
  };
  FRONT[W.SCHI] = (P, g, ph, kind) => {
    const b = BASEC[W.SCHI], R = RP(b), gr = "#76967a", Rg = RP(gr), e = MV(.5), y1 = 12 + DH - e;
    P.r(0, 0, TS, FH, b);
    P.r(0, y1, TS, 8 + e, gr).noise(0, y1, TS, 8 + e, [ Rg[2], Rg[4] ], .06, g);
    P.r(0, y1 - 1, TS, 1, "#6a4e32").r(0, y1 - 2, TS, 1, "#8a6e4e");
    topShade(P, R);
    skirt(P, "#3e5a44", 4);
    const h = SX.hash("sc" + ph) % 7;
    if (h === 1) blotchW(P, 6 + g.i(18), y1 + 3, "#a8a48e"); else if (h === 3) for (let k = 0; k < 4; k++) P.line(4 + k * 5, 6 + g.i(2) + MV(.6), 7 + k * 5, 4 + g.i(3) + MV(.6), "rgba(60,60,70,0.45)"); else if (h === 5) {
      const q = MV(.25);
      P.r(12, 4 + q, 8, 5, "#3a3e44").r(13, 5 + q, 6, 3, "#e8e4d8");
      A.PP.mini(P, 13, 5 + q, String(1 + SX.hash("cl" + ph) % 9) + "-" + String(1 + SX.hash("cm" + ph) % 9), "#2a2c30", 6);
    }
  };
  function blotchW(P, x, y, c) {
    P.r(x, y, 5, 3, c).r(x + 1, y - 1, 3, 1, c).r(x + 1, y + 3, 4, 1, c);
  }
  FRONT[W.SCHX] = (P, g, ph, kind) => {
    const b = BASEC[W.SCHX], R = RP(b), e = MV(.5), y1 = 13 + DH - e;
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, y1, [ R[2], R[4] ], .05, g);
    for (let row = 0, nr = 2 + Math.floor(e / 3); row < nr; row++) {
      const y = y1 + 1 + row * 3, off = (row & 1) * 4;
      for (let x = -off; x < TS; x += 8) {
        const a = Math.max(0, x), e = Math.min(TS, x + 7);
        P.r(a, y, e - a, 2, "#7a4a3a").r(a, y, e - a, 1, "#8e5a46");
      }
    }
    P.r(0, y1, TS, 1, "#9a9480");
    topShade(P, R);
    skirt(P, "#5a5650", 3);
    for (let k = 0; k < 3; k++) P.r(4 + g.i(24), 3, 1, 3 + g.i(7), rgba(R[1], .3));
  };
  FRONT[W.MALI] = (P, g, ph, kind) => {
    const b = BASEC[W.MALI], q = MV(.5);
    tiles(P, 0, 3, TS, 16 + DH, 8, b, "#a2a29c", g);
    P.r(0, 9 + q, TS, 2, "#b0503c").r(0, 9 + q, TS, 1, "#c8705c");
    topShade(P, RP(b));
    skirt(P, "#9aa0a6", 3);
  };
  FRONT[W.SHUT] = (P, g, ph, kind) => {
    const b = BASEC[W.SHUT], R = RP(b);
    P.r(0, 0, TS, FH, b);
    const sc = [ "#a8463a", "#3a6a9a", "#4a8a52", "#c8962e", "#7a4a8a" ][SX.hash("sg" + (ph >> 1)) % 5], Rs = RP(sc);
    P.r(0, 2, TS, 4, sc).r(0, 2, TS, 1, Rs[4]).r(0, 5, TS, 1, Rs[1]);
    A.PP.word(P, 4 + (ph & 1) * 2, 3, 3, Rs[5], SX.hash("sw" + ph) % 999, 3, 2, 1, 2);
    for (let y = 6; y < 20 + DH; y += 2) P.r(0, y, TS, 1, R[4]).r(0, y + 1, TS, 1, R[2]);
    P.r(0, 19 + DH, TS, 2, R[1]).r(0, 19 + DH, TS, 1, R[3]);
    if ((ph & 1) === 0) {
      P.r(14, 17 + DH, 4, 2, "#3a3c40").p(15, 17 + DH, "#9aa0a8");
    } else {
      P.r(3, 18 + DH, 3, 3, "#2a2c30").r(3, 18 + DH, 3, 1, "#8a9098");
    }
    if (SX.hash("sr" + ph) % 3 === 0) for (let k = 0; k < 6; k++) P.r(2 + g.i(28), 8 + g.i(6 + DH), 1, 2 + g.i(5), g.pick([ "#7a4a2a", "#8a5a34" ]));
    if (SX.hash("sx" + ph) % 4 === 1) {
      const q = MV(.6);
      P.line(6, 16 + q, 12, 9 + q, "#d8d0b0").line(12, 9 + q, 18, 15 + q, "#d8d0b0").line(20, 10 + q, 26, 10 + q, "#c83a3a");
    }
    skirt(P, "#3a3c40", 3);
  };
  FRONT[W.MALX] = (P, g, ph, kind) => {
    const b = BASEC[W.MALX], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4] ], .1, g);
    for (let k = 0; k * 12 < FH; k++) {
      const y = k * 12;
      if (y + 11 < FH) P.r(0, y + 11, TS, 1, R[2]);
      if (k & 1) P.r(7, y, 1, Math.min(12, FH - y), R[2]).r(23, y, 1, Math.min(12, FH - y), R[2]); else P.r(15, y, 1, 11, R[2]);
    }
    topShade(P, R);
    skirt(P, "#5a5650", 3);
  };
  FRONT[W.HOSI] = (P, g, ph, kind) => {
    const b = BASEC[W.HOSI], R = RP(b), e = MV(.25), y1 = DH - e;
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, 10 + y1, [ R[2], R[4] ], .04, g);
    tiles(P, 0, 11 + y1, TS, 9 + e, 8, "#9ab2a6", "#7e968a", g);
    P.r(0, 8 + y1, TS, 2, "#b0905e").r(0, 8 + y1, TS, 1, "#c8aa76").r(0, 10 + y1, TS, 1, "rgba(0,0,0,0.25)");
    for (const x of [ 4, 20 ]) P.r(x, 9 + y1, 2, 3, "#8a9096").p(x, 9 + y1, "#b8bec4");
    for (let k = 0; k < 3; k++) P.r(2 + g.i(24), 14 + DH + g.i(4), 4 + g.i(6), 1, "rgba(60,70,64,0.4)");
    topShade(P, R);
    skirt(P, "#6a7a72", 4);
    smallBits(P, g, ph, kind, {
      st: W.HOSI,
      plate: "#d8dcd8"
    });
  };
  FRONT[W.HOSW] = (P, g, ph, kind) => {
    const b = BASEC[W.HOSW], R = RP(b), e = MV(.25), q = MV(.5);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, 20 + DH, [ R[2], R[4] ], .04, g);
    tiles(P, 0, 13 + DH - e, TS, 7 + e, 8, "#c4c2b4", "#a4a294", g);
    if (SX.hash("gw" + ph) % 3 === 0) {
      P.r(8, 4 + q, 16, 6, "#d8dcd8").r(8, 4 + q, 16, 1, "#eef0ee").r(8, 9 + q, 16, 1, "#9aa09c");
      P.oval(11, 7 + q, 1, 1, "#3a8a4a").oval(16, 7 + q, 1, 1, "#e8e8e8").oval(21, 7 + q, 1, 1, "#d8c040");
    }
    topShade(P, R);
    skirt(P, "#7a8a82", 4);
  };
  FRONT[W.HOSX] = (P, g, ph, kind) => {
    const b = BASEC[W.HOSX], R = RP(b), q = MV(.5);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4] ], .05, g);
    P.r(0, 13 + q, TS, 3, "#4a8a62").r(0, 13 + q, TS, 1, "#6aaa82");
    if ((ph & 1) === 0) P.r(0, 0, 1, FH, R[2]);
    P.r(0, 8 + MV(.25), TS, 1, R[2]);
    topShade(P, R);
    skirt(P, "#5a5e5a", 3);
  };
  FRONT[W.METI] = (P, g, ph, kind) => {
    const b = BASEC[W.METI], q = MV(.25);
    tiles(P, 0, 3, TS, 16 + DH, 16, b, "#7e7e80", g);
    P.r(0, 6 + q, TS, 4, "#2e5a8a").r(0, 6 + q, TS, 1, "#4e7aaa").r(0, 9 + q, TS, 1, "#1e3a5a");
    const h = SX.hash("mt" + ph) % 4;
    if (h === 0) {
      P.r(4, 7 + q, 5, 1, "#e8ecf0").r(7, 6 + q, 1, 3, "#e8ecf0").p(8, 7 + q, "#e8ecf0");
      A.PP.word(P, 12, 7 + q, 2, "#d8e0e8", ph, 4, 1, 1, 2);
    } else if (h === 2) A.PP.word(P, 3, 7 + q, 2, "#d8e0e8", ph + 7, 6, 2, 1, 2);
    topShade(P, RP(b));
    skirt(P, "#4a4c50", 4);
    smallBits(P, g, ph, kind, {
      st: W.METI
    });
  };
  FRONT[W.METX] = (P, g, ph, kind) => {
    const b = BASEC[W.METX], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ "#4a4c50", "#6a6c70", "#7a7c80" ], .2, g);
    for (let y = 11; y < FH - 4; y += 24) P.r(0, y, TS, 1, R[4]);
    if ((ph & 1) === 0) P.r(0, 0, 1, FH, R[4]);
    topShade(P, R);
    skirt(P, "#3a3c40", 3);
  };
  FRONT[W.BASI] = (P, g, ph, kind) => {
    const b = BASEC[W.BASI], R = RP(b), lo = "#4e5a46", Rl = RP(lo), e = MV(.5), y1 = 11 + DH - e;
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, y1, [ R[2], R[4] ], .05, g);
    P.r(0, y1, TS, 9 + e, lo).noise(0, y1, TS, 9 + e, [ Rl[2], Rl[4] ], .06, g);
    P.r(0, y1, TS, 1, "#2e3628");
    const h = SX.hash("ba" + ph) % 6;
    if (h === 1) A.PP.mini(P, 9, 4 + MV(.5), [ "A-1", "B-2", "C-3", "D-4" ][SX.hash("bb" + ph) % 4], "#e0dcc8", 14); else if (h === 4) {
      P.r(10, y1 + 2, 12, 4, "#c8a830");
      for (let x = 10; x < 22; x += 3) P.r(x, y1 + 2, 1, 4, "#2a2a24");
    }
    topShade(P, R);
    skirt(P, "#262c22", 4);
    smallBits(P, g, ph, kind, {
      st: W.BASI,
      alarm: false
    });
  };
  FRONT[W.CORR] = (P, g, ph, kind, col) => {
    const b = col || BASEC[W.CORR], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let x = 0; x < TS; x += 4) P.r(x, 0, 1, FH, R[4]).r(x + 1, 0, 1, FH, R[3]).r(x + 2, 0, 1, FH, R[2]).r(x + 3, 0, 1, FH, R[1]);
    for (let k = 0; k < 4; k++) {
      const x = g.i(TS);
      P.r(x, 3 + g.i(4), 1, 5 + g.i(12) + DH, g.pick([ "rgba(122,74,40,0.55)", "rgba(140,86,48,0.5)" ]));
    }
    for (const x of [ 2, 18 ]) {
      P.p(x, 4, "#b8bcc0").p(x, 20 + DH, "#b8bcc0");
      if (DH) P.p(x, 12 + (DH >> 1), "#b8bcc0");
    }
    topShade(P, R);
    skirt(P, sh(b, -.5), 2);
  };
  FRONT[W.BASX] = (P, g, ph, kind) => {
    const b = BASEC[W.BASX], R = RP(b);
    P.r(0, 0, TS, FH, b);
    const cols = [ "#5a6040", "#6e5a40", "#3a3c32" ];
    for (let x = 0; x < TS; x++) for (let y = 3; y < 21 + DH; y++) {
      const n = Math.sin((ph * TS + x) / 9 + y / 5) + Math.sin((ph * TS + x) / 4.3 - y / 7) * .6, m = Math.sin((ph * TS + x) / 6.7 + y / 3.1);
      if (n > .9) P.p(x, y, cols[0]); else if (m > 1.1 - n * .2 && n < -.2) P.p(x, y, cols[1]); else if (n < -1.15) P.p(x, y, cols[2]);
    }
    topShade(P, R);
    skirt(P, "#3e3c30", 3);
  };
  FRONT[W.TUN] = (P, g, ph, kind) => {
    const b = BASEC[W.TUN], R = RP(b), q = MV(.5);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4], "#4a4a46" ], .12, g);
    for (const t0 of [ 5, 11 ]) {
      const ty = t0 + q;
      P.r(0, ty, TS, 3, "#3a3c40").r(0, ty, TS, 1, "#5e6268");
      for (let x = 0; x < TS; x++) {
        P.p(x, ty + 1, (x + ty) % 5 === 0 ? "#2a2a2c" : "#141416");
      }
      P.r(0, ty + 1, TS, 1, t0 === 5 ? "#8a7a2a" : "#7a2a24");
      for (const x of [ 6, 22 ]) P.r(x, ty - 1, 2, 5, "#6a6e74").p(x, ty - 1, "#9aa0a6");
    }
    for (let k = 0; k < 3; k++) P.r(2 + g.i(28), 15 + DH, 1, 3 + g.i(5), "rgba(20,24,24,0.4)");
    if (SX.hash("km" + ph) % 7 === 2) {
      P.r(12, 15 + q, 9, 5, "#d8d8d0").r(12, 15 + q, 9, 1, "#f0f0e8");
      A.PP.mini(P, 13, 15 + q, String(SX.hash("kn" + ph) % 9) + "K", "#2a2c30", 8);
    } else if (SX.hash("km" + ph) % 7 === 5) {
      P.r(14, 15 + q, 5, 4, "#2a2c30").r(15, 16 + q, 3, 2, "#d84a3a");
    }
    topShade(P, R);
    skirt(P, "#3a3a38", 3);
  };
  FRONT[W.STAT] = (P, g, ph, kind) => {
    const b = BASEC[W.STAT], q = MV(.25);
    tiles(P, 0, 3, TS, 16 + DH, 8, b, "#948c7e", g);
    P.r(0, 7 + q, TS, 5, "#2e4a7a").r(0, 7 + q, TS, 1, "#4e6a9a").r(0, 11 + q, TS, 1, "#1e2e4a");
    if (SX.hash("st" + ph) % 3 === 0) A.PP.word(P, 3 + (ph & 3), 8 + q, 3, "#e8ecf0", 77 + (ph >> 2), 3, 3, 1, 3);
    topShade(P, RP(b));
    skirt(P, "#3a3c40", 4);
  };
  FRONT[W.SCON] = (P, g, ph, kind) => {
    const b = BASEC[W.SCON], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4], "#6e6d68" ], .12, g);
    for (let y = 8; y < FH - 6; y += 7) P.r(0, y, TS, 1, R[2]);
    for (let x = 4; x < TS; x += 12) for (let y = 5; y < FH - 4; y += 7) P.p(x, y, R[0]).p(x + 1, y, R[1]);
    for (let k = 0; k < 3; k++) P.r(2 + g.i(28), 3, 1, 4 + g.i(10), rgba(R[1], .4));
    if (SX.hash("rb" + ph) % 3 === 0) for (const x of [ 6, 15, 25 ]) P.r(x, 0, 1, 3, "#7a4a2a").p(x, 0, "#9a6a3a");
    topShade(P, R);
    skirt(P, "#5e5d58", 2);
  };
  FRONT[W.HOARD] = (P, g, ph, kind) => {
    const b = BASEC[W.HOARD], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, 17 + DH, [ R[2], R[4] ], .05, g);
    for (let y = 6; y < 13 + DH; y += 6) P.r(0, y, TS, 2, R[4]).r(0, y + 1, TS, 1, R[2]);
    if ((ph & 1) === 0) P.r(0, 0, 1, 18 + DH, R[1]);
    for (let x = 0; x < TS; x++) {
      const on = x + ph * TS >> 2 & 1;
      P.r(x, 17 + DH, 1, 4, on ? "#d0a82a" : "#1c1c1e");
    }
    for (let k = 0; k < 3; k++) P.r(g.i(TS), 9 + g.i(6 + DH), 1, 3 + g.i(5), "rgba(122,74,40,0.5)");
    if (SX.hash("hd" + ph) % 6 === 3) {
      P.r(10, 2, 12, 4, "#c83a30");
      A.PP.word(P, 11, 3, 2, "#f0e8d8", 31, 3, 2, 1, 2);
    }
    topShade(P, R);
    skirt(P, "#3a3c3e", 3);
  };
  FRONT[W.CONT] = (P, g, ph, kind, col) => {
    const b = col || BASEC[W.CONT], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let x = 0; x < TS; x += 8) P.r(x, 0, 2, FH, R[4]).r(x + 2, 0, 3, FH, R[3]).r(x + 5, 0, 2, FH, R[2]).r(x + 7, 0, 1, FH, R[1]);
    for (let k = 0; k < 5; k++) P.r(g.i(TS), 2 + g.i(6), 1, 4 + g.i(12), g.pick([ "rgba(122,74,40,0.55)", "rgba(150,90,50,0.45)" ]));
    if (SX.hash("ct" + ph) % 5 === 1) A.PP.mini(P, 5, 9 + MV(.5), "SXU" + SX.hash("cn" + ph) % 9, "#e0e0d8", 22);
    if (SX.hash("ct" + ph) % 5 === 3) for (const x of [ 9, 21 ]) P.r(x, 2, 1, 20 + DH, "#9aa0a8").r(x - 1, 9 + MV(.5), 3, 2, "#5a5e64");
    P.r(0, 0, TS, 2, R[0]).r(0, 2, TS, 1, R[1]);
    skirt(P, R[1], 2);
  };
  FRONT[W.OLDS] = (P, g, ph, kind) => {
    const b = BASEC[W.OLDS], R = RP(b), gr = "#6a7e64", Rg = RP(gr), e = MV(.5), y1 = 12 + DH - e, q = MV(.5);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, y1, [ R[2], R[4], "#8a8468" ], .12, g);
    P.r(0, y1, TS, 8 + e, gr).noise(0, y1, TS, 8 + e, [ Rg[2], Rg[4], "#7a7a68" ], .16, g);
    P.r(0, y1 - 1, TS, 1, "#4e3a26");
    for (let k = 0; k < 3; k++) blotchW(P, 2 + g.i(24), 4 + g.i(14 + DH), "#a8a28c");
    if (SX.hash("ol" + ph) % 4 === 1) {
      for (let k = 0; k < 4; k++) P.r(6 + k * 2, 5 + q, 1, 5, "#e0dcd0");
      P.line(5, 9 + q, 14, 5 + q, "#e0dcd0");
    }
    if (SX.hash("ol" + ph) % 4 === 2) {
      let x = 12, y = 3;
      for (let k = 0; k < 16; k++) {
        P.p(x, y, R[0]);
        x += k % 3 === 0 ? 1 : 0;
        y++;
      }
    }
    topShade(P, R);
    skirt(P, "#2e3a2a", 4);
  };
  FRONT[W.STUD] = (P, g, ph, kind) => {
    const b = BASEC[W.STUD], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let y = 3; y < 19 + DH; y += 4) for (let x = 0; x < TS; x += 4) {
      const on = x + y >> 2 & 1;
      P.r(x, y, 4, 4, on ? R[4] : R[2]).p(x + 1, y + 1, on ? R[5] : R[3]);
    }
    P.r(0, 2, TS, 1, "#d8d4c0").r(0, 3, TS, 1, "#8a8676");
    topShade(P, R);
    skirt(P, "#18181c", 4);
  };
  FRONT[W.HELX] = (P, g, ph, kind) => {
    P.r(0, 0, TS, FH, "#2e3a44");
    P.r(1, 3, 30, 16 + DH, "#3a4e5c");
    for (let k = 0; k < 16 + DH; k++) P.p(4 + k + (ph & 3) * 2, 18 + DH - k, "rgba(170,200,220,0.25)");
    P.r(0, 0, TS, 3, "#5a5e64");
    for (let y = 11; y < FH - 4; y += 12) P.r(0, y, TS, 1, "#5a5e64");
    if ((ph & 1) === 0) P.r(0, 0, 2, FH, "#5a5e64");
    skirt(P, "#3a3c40", 3);
  };
  FRONT[W.SOFF] = (P, g, ph, kind) => {
    const b = BASEC[W.SOFF], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let x = 0; x < TS; x += 16) P.r(x, 0, 1, FH, R[2]).r(x + 1, 0, 1, FH, R[4]);
    for (let k = 0; k < 4; k++) P.r(2 + g.i(28), 3, 1, 3 + g.i(9), "rgba(90,80,60,0.25)");
    topShade(P, R);
    skirt(P, "#5a5c5a", 2);
  };
  FRONT[W.CAR] = (P, g, ph, kind) => {
    const b = BASEC[W.CAR], R = RP(b), q = MV(.5);
    P.r(0, 0, TS, FH, b);
    for (let x = 0; x < TS; x += 3) P.r(x, 3, 1, 18 + DH, R[4]);
    P.r(0, 12 + q, TS, 3, "#b8322e").r(0, 12 + q, TS, 1, "#d8524e");
    P.r(0, 0, TS, 3, R[1]);
    skirt(P, "#3a3c40", 3);
  };
  FRONT[W.HUT] = (P, g, ph, kind) => {
    const b = BASEC[W.HUT], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let row = 0, nr = 4 + (DH >> 2); row < nr; row++) {
      const y = 3 + row * 4, off = (row & 1) * 8;
      for (let x = -off; x < TS; x += 16) P.r(Math.max(0, x), y, 1, 4, R[2]);
      P.r(0, y, TS, 1, R[2]);
    }
    for (let x = 0; x < TS; x++) {
      const on = x + ph * TS >> 2 & 1;
      P.r(x, 18 + DH, 1, 2, on ? "#c8a02a" : "#1c1c1e");
    }
    topShade(P, R);
    skirt(P, "#3a3a36", 3);
  };
  FRONT[W.VHALL] = (P, g, ph, kind) => {
    const b = BASEC[W.VHALL], R = RP(b), lo = "#7a7262", e = MV(.25), y1 = 13 + DH - e, q = MV(.5), q2 = MV(.25);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, y1, [ R[2], R[4] ], .06, g);
    P.r(0, y1, TS, 7 + e, lo).r(0, y1, TS, 1, "#5a5446");
    const h = SX.hash("vh" + ph) % 8;
    if (h === 2) {
      P.r(6, 5 + q, 20, 7, "#8a8e94").r(6, 5 + q, 20, 1, "#aab0b6");
      for (let k = 0; k < 4; k++) P.r(7 + k * 5, 7 + q, 4, 3, "#4a4e54").p(8 + k * 5, 7 + q, "#c8c4b0");
    } else if (h === 5) {
      P.r(11, 4 + q2, 10, 8, "#4a4e48").r(12, 5 + q2, 8, 4, "#c8ccc0").r(13, 6 + q2, 6, 1, "#2a2c28");
    }
    topShade(P, R);
    skirt(P, "#4a443a", 3);
  };
  FRONT[W.KITCH] = (P, g, ph, kind) => {
    const b = BASEC[W.KITCH];
    tiles(P, 0, 3, TS, 16 + DH, 8, b, "#9e9c92", g, {
      acc: .08,
      accCol: "#8aa0b0"
    });
    if (SX.hash("kt" + ph) % 5 === 1) blotchW(P, 12, 8 + MV(.6), "rgba(140,110,50,0.3)");
    topShade(P, RP(b));
    skirt(P, "#7a786e", 3);
  };
  FRONT[W.BATHW] = (P, g, ph, kind) => {
    const b = BASEC[W.BATHW];
    tiles(P, 0, 3, TS, 17 + DH, 6, b, "#7e9098", g, {
      acc: .1,
      accCol: "#d0d4d0"
    });
    for (let k = 0; k < 8; k++) P.p(g.i(TS), 15 + DH + g.i(5), "rgba(30,40,30,0.5)");
    topShade(P, RP(b));
    skirt(P, "#6a7a80", 2);
  };
  FRONT[W.WOODP] = (P, g, ph, kind) => {
    const b = BASEC[W.WOODP], R = RP(b);
    P.r(0, 0, TS, FH, b);
    for (let x = 0; x < TS; x += 8) P.r(x, 3, 1, 17 + DH, R[1]).r(x + 1, 3, 1, 17 + DH, R[4]);
    A.PP.vgrain(P, 0, 3, TS, 17 + DH, b, g, 20);
    topShade(P, R);
    skirt(P, "#3e2c1c", 3);
  };
  FRONT[W.CMU] = (P, g, ph, kind) => {
    const b = BASEC[W.CMU], R = RP(b);
    P.r(0, 0, TS, FH, b);
    P.noise(0, 0, TS, FH, [ R[2], R[4] ], .08, g);
    for (let row = 0, nr = 4 + (DH >> 2); row < nr; row++) {
      const y = 3 + row * 4, off = (row & 1) * 8;
      P.r(0, y, TS, 1, R[2]);
      for (let x = -off; x < TS; x += 16) if (x >= 0) P.r(x, y, 1, 4, R[2]);
    }
    topShade(P, R);
    skirt(P, "#4a4a46", 3);
  };
  const WIN = {
    1: {
      frame: "#8a8e94",
      grill: "#4a4e54"
    },
    2: {
      frame: "#8a8e94",
      grill: "#3a3e44",
      sill: "#8a8478"
    },
    3: {
      frame: "#3a3c40",
      blind: "rgba(200,200,190,0.35)"
    },
    4: {
      frame: "#3a3c40",
      split: false
    },
    5: {
      frame: "#c8c4b8",
      sill: "#a8a490"
    },
    6: {
      frame: "#c8c4b8"
    },
    7: {
      frame: "#9aa0a6"
    },
    9: {
      frame: "#5a5650"
    },
    10: {
      frame: "#d8dcd8"
    },
    11: {
      frame: "#d8dcd8",
      blind: "rgba(220,230,224,0.35)"
    },
    12: {
      frame: "#d8dcd8"
    },
    13: {
      frame: "#4a4c50"
    },
    14: {
      frame: "#3a3c40",
      split: false
    },
    15: {
      frame: "#3e4a34",
      tape: "rgba(200,190,150,0.7)"
    },
    17: {
      frame: "#3e4a34",
      grill: "#2e3228"
    },
    23: {
      frame: "#7a7660",
      tape: "rgba(200,190,150,0.6)"
    },
    25: {
      frame: "#5a5e64",
      split: false
    },
    26: {
      frame: "#8a8c88"
    },
    29: {
      frame: "#8a8e94",
      grill: "#4a4e54"
    },
    32: {
      frame: "#3e2c1c"
    }
  };
  const baseCap = A.wallCap, baseFront = A.wallFront;
  const capTex = {
    2: "brick",
    16: "corr",
    22: "corr",
    21: "hoard",
    18: "tun",
    20: "conc"
  };
  A.wallCap = function(kind, m, col) {
    if (kind === 1 && !col) {
      const F = SX.render && SX.render._F;
      if (F && F.parSt) return parCap(F.parSt, m);
    }
    if (typeof col !== "string" || col[0] !== "@") return baseCap(kind, m, col);
    const t = parseTok(col), cc = t.st === W.CONT && t.col ? mix(t.col, "#1a1c20", .62) : CAP[t.st] || A.C.capTop, tx = capTex[t.st] || "";
    return A.cached("tcap" + kind + ":" + m + ":" + cc + tx, TS, TS, P => {
      const R = RP(cc), g = new SX.Rng(m * 31 + kind + t.st * 7);
      P.r(0, 0, TS, TS, cc);
      P.noise(0, 0, TS, TS, [ R[2], R[4] ], .05, g);
      if (tx === "corr") for (let x = 0; x < TS; x += 4) P.r(x, 0, 1, TS, R[4]);
      if (tx === "brick") for (let y = 4; y < TS; y += 8) P.r(0, y, TS, 1, R[2]);
      if (tx === "tun") P.noise(0, 0, TS, TS, [ "#1e1f1d" ], .08, g);
      if (tx === "conc") P.noise(0, 0, TS, TS, [ R[5] ], .03, g);
      if (!(m & 1)) P.r(0, 0, TS, 2, R[4]).r(0, 0, TS, 1, R[5]);
      if (!(m & 8)) P.r(0, 0, 2, TS, R[4]).r(0, 0, 1, TS, R[5]);
      if (!(m & 2)) P.r(TS - 2, 0, 2, TS, R[1]).r(TS - 1, 0, 1, TS, R[0]);
      if (!(m & 4)) P.r(0, TS - 1, TS, 1, R[5]);
      if (m & 1 && m & 8) P.p(0, 0, R[3]);
    });
  };
  A.wallFront = function(kind, wx, ends, col, deco, fh) {
    if (kind === 2 && !col) {
      const F = SX.render && SX.render._F;
      if (F && F.parSt) return parFront(F.parSt, wx, ends);
    }
    if (typeof col !== "string" || col[0] !== "@") return baseFront(kind, wx, ends, col, deco, fh);
    const t = parseTok(col);
    if (kind > 1 || !FRONT[t.st]) return baseFront(kind, wx, ends, t.col || BASEC[t.st] || null, deco, fh);
    const ph = (wx % 8 + 8) % 8, H = fh || A.WALL_H;
    return A.cached("tfr" + t.st + ":" + (t.col || "") + ":" + kind + ":" + ph + ":" + (ends | 0) + ":" + (deco | 0) + (H !== A.WALL_H ? ":h" + H : ""), TS, H, P => {
      const g = new SX.Rng(SX.hash("wf" + t.st + ":" + ph + ":" + kind)), b = t.col || BASEC[t.st], R = RP(b);
      FH = H;
      DH = H - 24;
      try {
        FRONT[t.st](P, g, ph, kind, t.col);
        if (kind === 0) oldDeco(P, R, deco);
        if (kind === 1) win(P, WIN[t.st] || {});
        endsOf(P, R, ends);
      } finally {
        FH = 24;
        DH = 0;
      }
    });
  };
  function parCap(st, m) {
    return A.cached("tpc" + st + ":" + m, TS, TS, P => {
      const g = new SX.Rng(m * 13 + 5), c = "#6a6c68", R = RP(c);
      P.r(0, 0, TS, TS, c);
      P.noise(0, 0, TS, TS, [ R[2], R[4], "#5e605c" ], .12, g);
      const vert = m & 5 && !(m & 10);
      if (vert) {
        P.r(12, 0, 8, TS, "#4e5256").r(12, 0, 2, TS, "#8a9096").r(18, 0, 2, TS, "#2e3236");
        for (let y = 6; y < TS; y += 16) P.r(10, y, 12, 4, "#5e6266").r(10, y, 12, 1, "#9aa0a6");
        for (let k = 0; k < 4; k++) P.p(13 + g.i(6), g.i(TS), "#8a5a34");
      } else {
        P.r(0, 12, TS, 8, "#4e5256").r(0, 12, TS, 2, "#8a9096").r(0, 18, TS, 2, "#2e3236");
        for (let x = 6; x < TS; x += 16) P.r(x, 10, 4, 12, "#5e6266").r(x, 10, 1, 12, "#9aa0a6");
      }
      if (!(m & 1)) P.r(0, 0, TS, 2, R[4]);
      if (!(m & 8)) P.r(0, 0, 2, TS, R[4]);
      if (!(m & 2)) P.r(TS - 2, 0, 2, TS, R[1]);
      if (!(m & 4)) P.r(0, TS - 2, TS, 2, R[2]);
    });
  }
  function parFront(st, wx, ends) {
    const ph = (wx % 4 + 4) % 4;
    return A.cached("tpf" + st + ":" + ph + ":" + (ends | 0), TS, 10, P => {
      const c = "#5d5f5b", R = RP(c);
      P.r(0, 0, TS, 10, c).r(0, 0, TS, 1, R[4]).r(0, 9, TS, 1, R[1]);
      P.r(0, 2, TS, 3, "#7a8086").r(0, 2, TS, 1, "#a8aeb4").r(0, 4, TS, 1, "#3a3e42");
      P.r(ph * 8 % TS, 1, 2, 8, "#4e5256");
      P.p(4 + ph * 5, 7, "#2e3032").p(20, 7, "#2e3032");
      if (ends & 1) P.r(0, 0, 2, 10, "#7a7c77");
      if (ends & 2) P.r(TS - 2, 0, 2, 10, "#3e403c");
    });
  }
  const SPEC = TP.SPEC = {
    villa: {
      room: {
        bunk: MAT.JANG,
        kitchen: MAT.KVINYL,
        toilet: MAT.BATH,
        store: MAT.CONCB,
        none: MAT.JANG
      },
      corr: MAT.TERR,
      lobby: MAT.TERR,
      side: MAT.ALLEY,
      roof: MAT.RGREEN,
      wall: {
        bunk: W.FLOWER,
        kitchen: W.KITCH,
        toilet: W.BATHW,
        store: W.CMU,
        none: W.FLOWER
      },
      wcorr: W.VHALL,
      ext: W.BRICK
    },
    office: {
      room: {
        office: MAT.CARPT,
        meeting: MAT.CARPM,
        pantry: MAT.VCT,
        store: MAT.CONCB,
        cubicles: MAT.CARPT,
        none: MAT.CARPT
      },
      corr: MAT.VCT,
      lobby: MAT.GRANITE,
      side: MAT.GPAVE,
      roof: MAT.RGREY,
      wall: {
        meeting: W.WOODP,
        store: W.CMU,
        none: W.OFFI
      },
      wcorr: W.OFFI,
      ext: W.OFFX
    },
    mall: {
      room: {
        shop: [ MAT.LAM, MAT.MALL ],
        store: MAT.CONCB,
        pantry: MAT.VCT,
        office: MAT.CARPT,
        atrium: MAT.MALL,
        none: MAT.MALL
      },
      corr: MAT.MALL,
      lobby: MAT.MALL,
      side: MAT.GPAVE,
      roof: MAT.RGREY,
      wall: {
        store: W.CMU,
        office: W.OFFI,
        none: W.MALI
      },
      wcorr: W.MALI,
      ext: W.MALX,
      shopFront: "shop"
    },
    hos: {
      room: {
        ward: MAT.HGREEN,
        surgery: MAT.EPOXY,
        office: MAT.HVINYL,
        store: MAT.CONCB,
        pantry: MAT.VCT,
        reception: MAT.GRANITE,
        none: MAT.HVINYL
      },
      corr: MAT.HVINYL,
      lobby: MAT.HVINYL,
      side: MAT.PAVER,
      roof: MAT.RGREY,
      wall: {
        ward: W.HOSW,
        store: W.CMU,
        none: W.HOSI
      },
      wcorr: W.HOSI,
      ext: W.HOSX,
      guide: true
    },
    school: {
      room: {
        classroom: MAT.SWOOD,
        library: MAT.CARPM,
        lab: MAT.BATH,
        cafeteria: MAT.VCT,
        office: MAT.VCT,
        store: MAT.CONCB,
        gym: MAT.GYM,
        none: MAT.SWOOD
      },
      corr: MAT.TERR,
      lobby: MAT.TERR,
      side: MAT.PAVER,
      roof: MAT.RGREEN,
      wall: {
        lab: W.KITCH,
        store: W.CMU,
        none: W.SCHI
      },
      wcorr: W.SCHI,
      ext: W.SCHX,
      court: true
    },
    metro: {
      room: {
        platform: MAT.PLAT,
        concourse: MAT.BIGT,
        maint: MAT.PCONC,
        toilet: MAT.BATH,
        store: MAT.CONCB,
        none: MAT.BIGT
      },
      corr: MAT.BIGT,
      lobby: MAT.BIGT,
      side: MAT.GPAVE,
      roof: MAT.RGREY,
      wall: {
        maint: W.CMU,
        toilet: W.BATHW,
        store: W.CMU,
        platform: W.STAT,
        none: W.METI
      },
      wcorr: W.METI,
      ext: W.METX,
      tactile: true,
      trainEdge: true
    },
    base: {
      room: {
        barracks: MAT.PCONC,
        armory: MAT.PCONC,
        mess: MAT.VCT,
        command: MAT.CARPA,
        motor: MAT.MCONC,
        yard: MAT.MCONC,
        store: MAT.CONCB,
        none: MAT.PCONC
      },
      corr: MAT.PCONC,
      lobby: MAT.PCONC,
      side: MAT.ALLEY,
      roof: MAT.RGREY,
      wall: {
        armory: W.CMU,
        motor: W.CORR,
        yard: W.CORR,
        store: W.CORR,
        none: W.BASI
      },
      wcorr: W.BASI,
      ext: W.BASX,
      lines: true
    },
    train: {
      room: {
        none: MAT.OWOOD
      },
      corr: MAT.OTERR,
      lobby: MAT.OTERR,
      side: MAT.ALLEY,
      roof: MAT.RGREEN,
      wall: {
        none: W.OLDS
      },
      wcorr: W.OLDS,
      ext: W.SCHX
    },
    heli: {
      room: {
        office: MAT.CARPS,
        meeting: MAT.STUDIO,
        pantry: MAT.VCT,
        store: MAT.CONCB,
        none: MAT.CARPS
      },
      corr: MAT.GRANITE,
      lobby: MAT.GRANITE,
      side: MAT.GPAVE,
      roof: MAT.RGREY,
      wall: {
        meeting: W.STUD,
        store: W.CMU,
        none: W.OFFI
      },
      wcorr: W.OFFI,
      ext: W.HELX
    }
  };
  const PROF = {};
  const prof = (ids, o) => {
    for (const id of [].concat(ids)) PROF[id] = Object.assign({
      st: .035,
      cr: .02,
      wr: .035
    }, o);
  };
  prof([ MAT.JANG ], {
    cr: 0,
    st: .05,
    wr: .05,
    sp: [ [ 12, .02 ], [ 13, .015 ] ]
  });
  prof([ MAT.KVINYL ], {
    cr: .01,
    st: .05,
    wr: .05,
    sp: [ [ 12, .04 ] ]
  });
  prof([ MAT.BATH ], {
    st: .08,
    wetAll: .3
  });
  prof([ MAT.CARPT ], {
    cr: 0,
    st: .06,
    wr: .05
  });
  prof([ MAT.CARPM, MAT.CARPA, MAT.CARPS ], {
    cr: 0
  });
  prof([ MAT.VCT, MAT.GRANITE, MAT.LAM, MAT.CARF, MAT.GPAVE ], {});
  prof([ MAT.SWOOD ], {
    cr: .01,
    wr: .07,
    sp: [ [ 12, .02 ] ]
  });
  prof([ MAT.OWOOD ], {
    cr: .02,
    wr: .08,
    st: .06
  });
  prof([ MAT.TERR ], {
    cr: .035
  });
  prof([ MAT.OTERR ], {
    cr: .08,
    st: .07
  });
  prof([ MAT.GYM ], {
    cr: 0,
    st: .01
  });
  prof([ MAT.MALL ], {
    cr: .03,
    sp: [ [ 12, .04 ] ],
    wet: 1
  });
  prof([ MAT.CONCB ], {
    cr: .06,
    sp: [ [ 12, .03 ], [ 13, .05 ], [ 14, .03 ] ],
    wet: 2
  });
  prof([ MAT.GRAVEL ], {
    st: 0,
    cr: 0,
    wr: 0,
    sp: [ [ 12, .06 ] ],
    wet: 1
  });
  prof([ MAT.PLY ], {
    cr: 0,
    sp: [ [ 12, .06 ] ]
  });
  prof([ MAT.BIGT ], {
    wet: 1
  });
  prof([ MAT.PLAT ], {
    cr: .03,
    wet: 1
  });
  prof([ MAT.BALLAST ], {
    st: 0,
    cr: 0,
    wr: 0,
    wet: 1
  });
  prof([ MAT.TCONC ], {
    st: .06,
    cr: .04,
    sp: [ [ 12, .02 ], [ 13, .03 ] ],
    wet: 3
  });
  prof([ MAT.HVINYL ], {
    st: .025,
    cr: .01
  });
  prof([ MAT.HGREEN ], {
    sp: [ [ 12, .03 ] ]
  });
  prof([ MAT.EPOXY ], {
    st: .04,
    cr: 0,
    sp: [ [ 12, .02 ] ]
  });
  prof([ MAT.PCONC ], {
    wr: .05,
    sp: [ [ 14, .015 ] ]
  });
  prof([ MAT.MCONC ], {
    wr: .03
  });
  prof([ MAT.ROAD ], {
    st: 0,
    cr: 0,
    wr: .025,
    sp: [ [ 9, .006 ], [ 8, .008 ] ],
    wet: 2
  });
  prof([ MAT.RGREEN ], {
    cr: .03,
    sp: [ [ 12, .04 ] ],
    wet: 1
  });
  prof([ MAT.RGREY ], {
    sp: [ [ 12, .01 ] ],
    wet: 1
  });
  prof([ MAT.PAVER ], {
    st: 0,
    cr: 0,
    wr: 0,
    sp: [ [ 12, .06 ], [ 9, .02 ] ]
  });
  prof([ MAT.STUDIO ], {
    st: 0,
    cr: 0,
    wr: 0,
    sp: [ [ 12, .05 ] ]
  });
  prof([ MAT.GRATE ], {
    st: 0,
    cr: 0,
    wr: 0,
    wet: 1
  });
  prof([ MAT.ALLEY ], {
    cr: .05,
    st: .04,
    sp: [ [ 12, .008 ] ]
  });
  prof([ MAT.YARD ], {
    st: 0,
    cr: 0,
    wr: 0,
    wet: 3
  });
  prof([ MAT.BWALK ], {
    cr: .04
  });
  prof([ MAT.TACT ], {
    st: 0,
    cr: 0,
    wr: 0
  });
  prof([ MAT.JOINT ], {
    st: 0,
    cr: 0,
    wr: 0
  });
  TP.PROF = PROF;
  const T = () => SX.map.T;
  TP.apply = function(lv, opt) {
    if (!TP.on || !lv || !lv.floors) return;
    const b = lv.building || {}, id = b.outdoor === "site" ? "site" : b.outdoor === "tunnel" ? "tunnel" : b.outdoor ? "bridge" : b.id;
    for (const F of lv.floors) {
      F.mat = new Uint16Array(F.W * F.H);
      F.wst = new Uint8Array(F.W * F.H);
      F.wcol = null;
      const rng = new SX.Rng(SX.hash("mat:" + (lv.seed >>> 0) + ":" + id + ":" + F.idx));
      if (id === "bridge") paintBridge(lv, F, rng); else if (id === "tunnel") paintTunnel(lv, F, rng); else if (id === "site") paintSite(lv, F, rng); else if (SPEC[id] || SPEC.office) paintBuilding(lv, F, rng, SPEC[id] || SPEC.office);
      variants(F, rng);
      const toks = [];
      F.wallTok = (x, y) => {
        if (x < 0 || y < 0 || x >= F.W || y >= F.H) return null;
        const i = y * F.W + x, s = F.wst[i];
        if (!s) return null;
        const c = F.wcol ? F.wcol[i] : 0;
        const k = s + c * 64;
        return toks[k] || (toks[k] = TP.tok(s, c ? F.wcolList[c] : null));
      };
      if (F.chunks) F.chunks.clear();
    }
  };
  TP.fsAt = (F, x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!F.in(tx, ty)) return 0;
    const i = ty * F.W + tx;
    return F.mat && F.mat[i] || F.fs[i];
  };
  const N4 = [ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ], [ -1, 0 ] ];
  function wallStyles(F, styleOf) {
    const TT = T();
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x, t = F.t[i];
      if (t !== TT.WALL && t !== TT.WINDOW) continue;
      F.wst[i] = styleOf(x, y) || 0;
    }
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x;
      if (F.t[i] !== TT.DOOR) continue;
      const d = F.doorAt.get(i), nb = d && d.horiz ? [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ] ] : [ [ 0, -1 ], [ 0, 1 ], [ -1, 0 ], [ 1, 0 ] ];
      for (let k = 1; k < 6 && !F.wst[i]; k++) for (const [dx, dy] of nb) {
        const xx = x + dx * k, yy = y + dy * k;
        if (F.in(xx, yy) && F.wst[F.i(xx, yy)]) {
          F.wst[i] = F.wst[F.i(xx, yy)];
          break;
        }
      }
    }
  }
  function paintBuilding(lv, F, rng, S) {
    const TT = T(), M = SX.map, B = M.BLOCK, C = M.CORR, X0 = lv.X0, Y0 = lv.Y0, X1 = lv.X1, Y1 = lv.Y1;
    const roomMat = new Map;
    const matOfRoom = r => {
      if (roomMat.has(r.id)) return roomMat.get(r.id);
      let m = S.room[r.theme] != null ? S.room[r.theme] : S.room.none;
      if (Array.isArray(m)) m = m[SX.hash("rm" + lv.seed + ":" + F.idx + ":" + r.id) % m.length];
      roomMat.set(r.id, m);
      return m;
    };
    const isRoof = F.kind === "roof";
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x, t = F.t[i], fs = F.fs[i];
      let m = 0;
      if (isRoof) {
        if (t === TT.GROUND && fs === FS.ROOF) m = S.roof;
      } else if (t === TT.FLOOR) {
        const rid = F.room[i];
        if (rid >= 0 && F.rooms[rid]) m = matOfRoom(F.rooms[rid]); else if (fs === FS.LOBBY) m = S.lobby; else if (F.inside[i] && !(F.park && (fs === FS.ASPH || fs === FS.STAIR))) m = S.corr;
      } else if (t === TT.GROUND && F.idx === 0 && fs === FS.WALK) m = x % 6 === 0 ? TP.val(S.side, 15) : S.side;
      if (m) F.mat[i] = m;
    }
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x;
      if (F.t[i] !== TT.DOOR) continue;
      let best = 0;
      for (const [dx, dy] of N4) {
        const xx = x + dx, yy = y + dy;
        if (!F.in(xx, yy)) continue;
        const j = F.i(xx, yy);
        if (F.t[j] !== TT.FLOOR && F.t[j] !== TT.GROUND) continue;
        const m = F.mat[j];
        if (m && (!best || F.room[j] < 0)) best = m;
      }
      if (best) F.mat[i] = best;
    }
    const inBand = (v, o) => {
      const k = (v - o) % (B + C);
      return k >= 0 && k < C;
    };
    if (S.guide && !isRoof) for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const i = y * F.W + x;
      if (F.t[i] !== TT.FLOOR || F.room[i] >= 0 || F.fs[i] === FS.LOBBY || (F.mat[i] & 127) !== MAT.HVINYL) continue;
      const hy = inBand(y, Y0), vx = inBand(x, X0), oy = (y - Y0) % (B + C), ox = (x - X0) % (B + C);
      if (hy && (oy === 1 || oy === 2)) F.mat[i] = TP.val(MAT.HVINYL, oy === 1 ? 12 : 14); else if (vx && (ox === 1 || ox === 2)) F.mat[i] = TP.val(MAT.HVINYL, ox === 1 ? 13 : 15);
    }
    if (S.court && !isRoof) for (const r of F.rooms) if (r.big === "gym") {
      const ax = r.x0 + 2, bx = r.x1 - 2, ay = r.y0 + 2, by = r.y1 - 2, mx = r.x0 + r.x1 >> 1;
      for (let x = ax; x <= bx; x++) for (const y of [ ay, by ]) set(F, x, y, MAT.GYM, 12);
      for (let y = ay; y <= by; y++) for (const x of [ ax, bx ]) set(F, x, y, MAT.GYM, 13);
      for (let y = ay; y <= by; y++) set(F, mx, y, MAT.GYM, 15);
      for (let x = mx - 3; x <= mx + 3; x++) for (const y of [ (ay + by >> 1) - 2, (ay + by >> 1) + 2 ]) set(F, x, y, MAT.GYM, 14);
    }
    if (S.lines && !isRoof) for (const r of F.rooms) if (r.theme === "motor" || r.theme === "yard" || r.theme === "armory") {
      const want = r.theme === "armory" ? MAT.PCONC : MAT.MCONC;
      for (let x = r.x0 + 1; x <= r.x1 - 1; x++) set(F, x, r.y0 + 1, want, 12);
      if (r.theme !== "armory") for (let x = r.x0 + 3; x <= r.x1 - 2; x += 4) for (let y = r.y0 + 2; y <= Math.min(r.y1 - 1, r.y0 + 5); y++) set(F, x, y, want, 13);
    }
    if (S.tactile && F.idx === 0) for (const e of lv.exits) {
      const dx = e.side === "w" ? 1 : e.side === "e" ? -1 : 0, dy = e.side === "n" ? 1 : e.side === "s" ? -1 : 0;
      for (let k = 1; k <= 14; k++) {
        const x = Math.round(e.x + dx * k - (dx ? 0 : .5)), y = Math.round(e.y + dy * k - (dy ? 0 : .5));
        if (!F.in(x, y) || F.t[F.i(x, y)] !== TT.FLOOR) break;
        F.mat[F.i(x, y)] = TP.val(MAT.TACT, k === 1 || k === 14 ? 12 : 0);
      }
    }
    if (S.trainEdge && !isRoof) for (const p of F.props) if (p.kind === "bus") {
      for (let x = p.x - 1; x <= p.x + p.w; x++) for (const y of [ p.y - 1, p.y + p.h ]) if (F.in(x, y) && (F.mat[F.i(x, y)] & 127) === MAT.PLAT) F.mat[F.i(x, y)] = TP.val(MAT.PLAT, 12);
    }
    const roomOf = (x, y) => {
      if (!F.in(x, y)) return null;
      const r = F.room[F.i(x, y)];
      return r >= 0 ? F.rooms[r] : null;
    };
    wallStyles(F, (x, y) => {
      if (isRoof) return 0;
      for (let k = 1; k <= 2; k++) {
        const yy = y + k;
        if (!F.in(x, yy)) return S.ext;
        const j = F.i(x, yy), t = F.t[j];
        if (t === TT.WALL || t === TT.WINDOW) continue;
        if (!F.inside[j]) return S.ext;
        const r = roomOf(x, yy);
        if (!r) {
          if (S.shopFront) {
            const n = roomOf(x, y - 1);
            if (n && n.theme === S.shopFront) return W.SHUT;
          }
          return S.wcorr;
        }
        return S.wall[r.theme] != null ? S.wall[r.theme] : S.wall.none;
      }
      const r = roomOf(x, y - 1) || roomOf(x - 1, y) || roomOf(x + 1, y);
      return r ? S.wall[r.theme] != null ? S.wall[r.theme] : S.wall.none : F.inside[F.i(x, Math.max(0, y - 1))] ? S.wcorr : S.ext;
    });
  }
  function set(F, x, y, id, v) {
    if (!F.in(x, y)) return;
    const i = F.i(x, y);
    if (F.t[i] !== T().FLOOR && F.t[i] !== T().GROUND) return;
    if ((F.mat[i] & 127) !== id && F.mat[i]) return;
    F.mat[i] = TP.val(id, v);
  }
  function paintBridge(lv, F, rng) {
    const TT = T(), X0 = lv.X0, X1 = lv.X1, Y0 = lv.Y0, Y1 = lv.Y1, landN1 = Y0 + 15, landS0 = Y1 - 15, cx = X0 + 9;
    F.parSt = "bridge";
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x, t = F.t[i], fs = F.fs[i];
      if (t !== TT.GROUND) continue;
      const deck = y > landN1 && y < landS0;
      if (fs === FS.ASPH) {
        let v = 0;
        if (deck) {
          const dash = (y - landN1) % 6 < 3;
          if (x === X0 + 5 || x === X0 + 12) v = dash ? 12 : 0; else if (x === cx - 1) v = 13; else if (x === cx) v = 14; else if (x === X0 + 2) v = 15; else if (x === X1 - 2) v = 16;
          if ((y - landN1) % 28 === 14) {
            F.mat[i] = MAT.JOINT;
            continue;
          }
        } else if (y === landS0 + 4 && Math.abs(x - cx) < 6) v = 17;
        F.mat[i] = TP.val(MAT.ROAD, v);
      } else if (fs === FS.WALK) {
        if (deck && (y - landN1) % 28 === 14) {
          F.mat[i] = MAT.JOINT;
          continue;
        }
        F.mat[i] = deck ? TP.val(MAT.BWALK, (y - landN1) % 9 === 4 ? 12 : 0) : MAT.PAVER;
      }
    }
  }
  function paintTunnel(lv, F, rng) {
    const TT = T();
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x, t = F.t[i], fs = F.fs[i];
      if (t !== TT.FLOOR) continue;
      if (fs === FS.RAIL) F.mat[i] = MAT.BALLAST; else if (fs === FS.CONC) F.mat[i] = y < lv.Y0 + 12 && (x === 4 || x === 22 || y < lv.Y0 + 3 && x > 9 && x < 17) ? MAT.GRATE : MAT.TCONC; else if (fs === FS.WALK) F.mat[i] = TP.val(MAT.PLAT, x === 7 ? 13 : x === 19 ? 14 : x === 6 || x === 20 || x === 13 ? 15 : 0); else if (fs === FS.LINO) F.mat[i] = x >= 8 && x <= 18 ? TP.val(MAT.CARF, (x === 9 || x === 17) && rng.chance(.4) ? 12 : 0) : MAT.VCT;
    }
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x;
      if (F.t[i] !== TT.DOOR) continue;
      for (const [dx, dy] of N4) {
        const j = F.in(x + dx, y + dy) ? F.i(x + dx, y + dy) : -1;
        if (j >= 0 && F.mat[j]) {
          F.mat[i] = F.mat[j] & 127;
          break;
        }
      }
    }
    wallStyles(F, (x, y) => {
      const below = F.in(x, y + 1) ? F.mat[F.i(x, y + 1)] & 127 : 0, above = F.in(x, y - 1) ? F.mat[F.i(x, y - 1)] & 127 : 0;
      if (x >= 8 && x <= 18 && (below === MAT.CARF || above === MAT.CARF)) return W.CAR;
      if (below === MAT.VCT || above === MAT.VCT || F.in(x - 1, y) && (F.mat[F.i(x - 1, y)] & 127) === MAT.VCT || F.in(x + 1, y) && (F.mat[F.i(x + 1, y)] & 127) === MAT.VCT) return W.HUT;
      if (below === MAT.PLAT || above === MAT.PLAT) return W.STAT;
      return W.TUN;
    });
  }
  function paintSite(lv, F, rng) {
    const TT = T(), X0 = lv.X0, X1 = lv.X1, Y0 = lv.Y0, Y1 = lv.Y1, cx = Math.floor(F.W / 2);
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x, t = F.t[i], fs = F.fs[i];
      if (t === TT.GROUND && fs === FS.DIRT) F.mat[i] = MAT.YARD; else if (t === TT.GROUND && fs === FS.ASPH) F.mat[i] = TP.val(MAT.ROAD, rng.chance(.08) ? 10 : 0); else if (t === TT.FLOOR && fs === FS.CONC) F.mat[i] = MAT.CONCB; else if (t === TT.FLOOR && fs === FS.LINO) F.mat[i] = MAT.VCT;
    }
    for (let k = 0; k < 11; k++) {
      const ox = X0 + 3 + rng.i(X1 - X0 - 6), oy = Y0 + 3 + rng.i(Y1 - Y0 - 6), rx = 2 + rng.f() * 4, ry = 2 + rng.f() * 3;
      for (let y = Math.floor(oy - ry); y <= oy + ry; y++) for (let x = Math.floor(ox - rx); x <= ox + rx; x++) {
        if (!F.in(x, y)) continue;
        const d = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2;
        const i = F.i(x, y);
        if (d < 1 - rng.f() * .25 && (F.mat[i] & 127) === MAT.YARD) F.mat[i] = MAT.GRAVEL;
      }
    }
    for (const y of [ Y0 + 12, Y0 + 30, Y0 + 46 ]) for (const dir of [ -1, 1 ]) for (let k = 4; k < 22; k++) {
      const x = cx + dir * k;
      if (F.in(x, y) && (F.mat[F.i(x, y)] & 127) === MAT.YARD) F.mat[F.i(x, y)] = TP.val(MAT.YARD, 12);
    }
    for (const x of [ cx - 5, cx + 5 ]) for (let y = Y0 + 2; y < Y1 - 1; y++) if ((F.mat[F.i(x, y)] & 127) === MAT.YARD && rng.chance(.85)) F.mat[F.i(x, y)] = TP.val(MAT.YARD, 13);
    for (const r of F.rooms) if (r.theme === "store") {
      const my = r.y0 + r.y1 >> 1;
      for (let x = r.x0; x <= r.x1; x++) for (const y of [ my, my + 1 ]) if (F.in(x, y) && (F.mat[F.i(x, y)] & 127) === MAT.CONCB) F.mat[F.i(x, y)] = MAT.PLY;
    }
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = y * F.W + x;
      if (F.t[i] !== TT.DOOR) continue;
      for (const [dx, dy] of N4) {
        const j = F.in(x + dx, y + dy) ? F.i(x + dx, y + dy) : -1;
        if (j >= 0 && F.mat[j]) {
          F.mat[i] = F.mat[j] & 127;
          break;
        }
      }
    }
    const cols = [ null ], colIx = new Map;
    F.wcol = new Uint8Array(F.W * F.H);
    F.wcolList = cols;
    wallStyles(F, (x, y) => {
      const wc = F.wallColAt ? F.wallColAt(x, y) : null;
      if (wc === "#6e6f68") return W.HOARD;
      if (wc) {
        let k = colIx.get(wc);
        if (k == null) {
          k = cols.length;
          cols.push(wc);
          colIx.set(wc, k);
        }
        F.wcol[F.i(x, y)] = k;
        return W.CONT;
      }
      for (const [dx, dy] of N4.concat([ [ 1, 1 ], [ -1, -1 ], [ 1, -1 ], [ -1, 1 ] ])) {
        const xx = x + dx, yy = y + dy;
        if (F.in(xx, yy) && (F.mat[F.i(xx, yy)] & 127) === MAT.VCT) return W.SOFF;
      }
      return W.SCON;
    });
  }
  function variants(F, rng) {
    const TT = T(), N = F.W * F.H, wetIds = new Map;
    const nearDoor = new Uint8Array(N);
    for (const d of F.doors) for (const i of d.tiles) {
      const x = i % F.W, y = i / F.W | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (F.in(xx, yy)) nearDoor[F.i(xx, yy)] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      const m = F.mat[i];
      if (!m || m >> 7) continue;
      const pr = PROF[m] || {};
      let v = rng.i(8);
      const r = rng.f();
      if (nearDoor[i] && pr.wr && rng.chance(.45)) v = 10; else if (r < pr.st) v = 8; else if (r < pr.st + pr.cr) v = 9; else if (r < pr.st + pr.cr + pr.wr) v = 10; else if (pr.sp) {
        let q = r - pr.st - pr.cr - pr.wr;
        for (const [sv, sp] of pr.sp) {
          if (q < sp) {
            v = sv;
            break;
          }
          q -= sp;
        }
      }
      if (pr.wetAll && rng.chance(pr.wetAll)) v = 11;
      F.mat[i] = TP.val(m, v);
      if (pr.wet) {
        if (!wetIds.has(m)) wetIds.set(m, []);
        wetIds.get(m).push(i);
      }
    }
    for (const [m, list] of wetIds) {
      const pr = PROF[m], n = Math.min(40, Math.round(list.length / 500 * pr.wet) + (list.length > 40 ? 1 : 0));
      for (let k = 0; k < n; k++) {
        const c = list[rng.i(list.length)], cx0 = c % F.W, cy0 = c / F.W | 0, rad = .8 + rng.f() * 1.8;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const x = cx0 + dx, y = cy0 + dy;
          if (!F.in(x, y) || Math.hypot(dx, dy * 1.3) > rad) continue;
          const j = F.i(x, y);
          if ((F.mat[j] & 127) === m && F.mat[j] >> 7 < 12) F.mat[j] = TP.val(m, 11);
        }
      }
    }
  }
})(window.SX);
