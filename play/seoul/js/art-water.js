"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, PP = A.PP, R2 = A.ROT;
  const {box, sbox, vgrad, grain, vgrain, grime, scratch, rust, txt, label, mini} = PP;
  const def = A.defProp;
  const build = (kind, fw, fh, M) => {
    def(kind, fw, fh, 0, () => {}, {
      color: typeof M.col === "string" ? M.col : undefined
    });
    R2.build(kind, M);
  };
  const DKs = a => "rgba(10,12,20," + Math.max(0, Math.min(.9, a)).toFixed(3) + ")";
  const W = [ "#2c5672", "#44809f", "#6ea8c8", "#9ccbe0", "#cbe7f3", "#effaff" ];
  const E = [ "#6a8a96", "#8aa8b2", "#a8c4cc", "#c4dce2", "#dcecf0", "#f4fbfc" ];
  const CAPS = [ "#2a64b8", "#e8e6dc", "#3a9a4a", "#c83a34", "#4ab0e0", "#e08a2a" ];
  const LABS = [ "#2a64b8", "#3a8a4a", "#c8402e", "#1e7a9a", "#e0b040" ];
  const NECK = "#dcecf2", TAPE = "#d8c89a", TAPE2 = "#b8a878", INK = "#2a2622", DUST = "rgba(90,74,52,0.22)", CHALK = "#e8e4d8";
  const pick = (g, a) => a[g.i(a.length)];
  function bottle(P, x, y, sz, cap, lab, o) {
    o = o || {};
    const C = RP(cap), L = RP(lab || LABS[0]), B = o.empty ? E : W;
    const w = sz === 2 ? 4 : sz === 1 ? 3 : 2, h = sz === 2 ? 10 : sz === 1 ? 7 : 5;
    if (sz === 2) {
      P.r(x + 1, y, 2, 1, C[4]).r(x + 1, y + 1, 2, 1, C[2]).p(x + 1, y, C[5]);
      P.r(x + 1, y + 2, 2, 1, NECK);
      P.r(x, y + 3, 4, 1, B[3]).p(x, y + 3, B[4]).p(x + 3, y + 3, B[2]);
      P.r(x, y + 4, 1, h - 5, B[4]).r(x + 1, y + 4, 2, h - 5, B[2]).r(x + 3, y + 4, 1, h - 5, B[1]);
      if (!o.nolab) {
        P.r(x, y + 5, 4, 2, L[3]).p(x, y + 5, L[4]).p(x + 3, y + 6, L[1]).p(x + 1, y + 5, "#f4f8ff");
      }
      P.r(x, y + 8, 4, 1, B[1]).p(x, y + 8, B[3]);
      P.r(x, y + h - 1, 4, 1, B[1]).p(x + 1, y + h - 1, B[2]);
      if (o.lvl && !o.empty) {
        const ly = y + 3 + Math.round(o.lvl * 5);
        P.r(x, y + 4, 4, Math.max(0, ly - y - 4), E[3]).p(x, y + 4, E[4]);
        P.r(x, ly, 4, 1, W[4]);
      }
      P.p(x, y + 4, o.empty ? E[5] : "#ffffff");
    } else if (sz === 1) {
      P.p(x + 1, y, C[4]).p(x + 1, y + 1, NECK);
      P.r(x, y + 2, 3, 1, B[3]).p(x, y + 2, B[4]);
      P.r(x, y + 3, 1, h - 4, B[4]).r(x + 1, y + 3, 1, h - 4, B[2]).r(x + 2, y + 3, 1, h - 4, B[1]);
      if (!o.nolab) {
        P.r(x, y + 4, 3, 1, L[3]).p(x, y + 4, L[4]);
      }
      P.r(x, y + h - 1, 3, 1, B[1]);
    } else {
      P.p(x, y, C[4]).p(x + 1, y, C[2]);
      P.r(x, y + 1, 1, h - 2, B[4]).r(x + 1, y + 1, 1, h - 2, B[2]);
      if (!o.nolab) P.r(x, y + 2, 2, 1, L[3]);
      P.r(x, y + h - 1, 2, 1, B[1]);
    }
    if (o.dim) P.r(x, y, w, h, DKs(o.dim));
    return w;
  }
  function lying(P, x, y, cap, lab, dir, o) {
    o = o || {};
    const C = RP(cap), L = RP(lab || LABS[0]), B = o.empty ? E : W, f = i => dir > 0 ? x + i : x + 9 - i;
    for (let i = 0; i < 7; i++) {
      const xx = f(i);
      P.p(xx, y, B[4]).p(xx, y + 1, B[3]).p(xx, y + 2, B[2]).p(xx, y + 3, B[1]);
    }
    if (!o.nolab) for (let i = 2; i < 4; i++) {
      const xx = f(i);
      P.p(xx, y, L[4]).p(xx, y + 1, L[3]).p(xx, y + 2, L[3]).p(xx, y + 3, L[1]);
    }
    P.p(f(7), y + 1, B[3]).p(f(7), y + 2, B[2]);
    P.p(f(8), y + 1, NECK).p(f(8), y + 2, NECK);
    P.p(f(9), y + 1, C[4]).p(f(9), y + 2, C[2]);
    P.p(f(1), y, o.empty ? E[5] : "#ffffff");
  }
  function crushed(P, x, y, cap, g) {
    const C = RP(cap);
    P.r(x + 1, y, 4, 1, E[4]).r(x, y + 1, 6, 1, E[3]).r(x, y + 2, 6, 1, E[1]);
    P.p(x + 2, y + 1, E[1]).p(x + 4, y, E[2]).p(x + 1, y + 2, E[2]).p(x + 3, y + 1, E[5]);
    P.p(x + 6, y + 1, NECK).p(x + 7, y + 1, C[4]).p(x + 7, y + 2, C[2]);
    if (g && g.chance(.5)) P.p(x + 2, y + 2, LABS[g.i(LABS.length)]);
  }
  function capDot(P, x, y, cap) {
    const C = RP(cap);
    P.p(x, y, C[4]).p(x + 1, y, C[2]);
  }
  function pack6(P, x, y, cap, lab, g, o) {
    o = o || {};
    for (let k = 0; k < 3; k++) bottle(P, x + k * 4, y, 2, cap, lab, {
      dim: .12
    });
    for (let k = 0; k < 3; k++) {
      if (o.miss === k) {
        P.r(x + k * 4, y + 3, 4, 10, W[1]).r(x + k * 4, y + 3, 4, 1, W[0]);
        continue;
      }
      bottle(P, x + k * 4, y + 3, 2, cap, lab);
    }
    P.r(x, y + 7, 12, 1, "rgba(255,255,255,0.2)");
    P.r(x, y + 10, 12, 1, "rgba(30,60,110,0.3)");
    P.r(x + 4, y - 2, 4, 1, "#e4e3da").p(x + 3, y - 1, "#e4e3da").p(x + 8, y - 1, "#c8c7be");
    if (o.tag) {
      P.r(x + 8, y + 11, 3, 2, "#f0c040").p(x + 9, y + 11, "#c83a34");
    }
    if (o.tape) {
      P.r(x + 1, y + 11, 6, 2, TAPE).r(x + 1, y + 12, 6, 1, TAPE2).r(x + 2, y + 11, 3, 1, INK).p(x + 5, y + 12, INK).p(x + 6, y + 11, INK);
    }
  }
  function bottleRow(P, x0, x1, yb, maxH, g, o) {
    o = o || {};
    let x = x0;
    const brandCap = pick(g, CAPS), brandLab = pick(g, LABS);
    while (x < x1 - 1) {
      const room = x1 - x, r = g.f();
      if (r < (o.gap == null ? .1 : o.gap)) {
        x += 2 + g.i(3);
        continue;
      }
      const sz = maxH >= 10 && room >= 4 && g.chance(o.big == null ? .5 : o.big) ? 2 : maxH >= 7 && room >= 3 && g.chance(.6) ? 1 : 0;
      const same = g.chance(.6), cap = same ? brandCap : pick(g, CAPS), lab = same ? brandLab : pick(g, LABS), h = sz === 2 ? 10 : sz === 1 ? 7 : 5;
      if (o.fall && room >= 10 && maxH >= 4 && g.chance(.12)) {
        lying(P, x, yb - 4, cap, lab, g.chance(.5) ? 1 : -1, {
          empty: g.chance(.3)
        });
        x += 11;
        continue;
      }
      bottle(P, x, yb - h, sz, cap, lab, {
        empty: g.chance(o.empty || .06),
        lvl: g.chance(.15) ? .4 + g.f() * .4 : 0,
        dim: o.dim || 0
      });
      x += (sz === 2 ? 4 : sz === 1 ? 3 : 2) + (g.chance(.35) ? 1 : 0);
    }
    if (o.tag) for (let tx = x0 + 2 + g.i(4); tx < x1 - 4; tx += 9 + g.i(6)) {
      P.r(tx, yb, 4, 2, g.chance(.7) ? "#f4f0dc" : "#f0d040").p(tx + 1, yb, "#c83a34").p(tx + 2, yb + 1, INK);
    }
  }
  function capGrid(P, x, y, w, h, g, o) {
    o = o || {};
    const cap = o.cap || pick(g, CAPS), C = RP(cap);
    P.r(x, y, w, h, o.bg || W[1]);
    for (let yy = y + 1; yy < y + h - 1; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 3) {
      if (o.miss && g.chance(o.miss)) {
        P.p(xx, yy, W[0]);
        continue;
      }
      P.p(xx, yy, C[4]).p(xx + 1, yy, C[2]);
      if (yy + 1 < y + h) P.p(xx, yy + 1, W[3]);
    }
    if (o.film) for (let k = 0; k < 2; k++) {
      const sx = x + g.i(Math.max(1, w - 4));
      P.line(sx, y, sx + 3, y + h - 1, "rgba(255,255,255,0.22)");
    }
  }
  function packFace(P, F, g, o) {
    o = o || {};
    const lv = Math.max(1, Math.floor(F.h / 10)), cap = o.cap || CAPS[0], lab = o.lab || LABS[0];
    P.r(F.x, F.y, F.w, F.h, W[1]);
    for (let k = 0; k < lv; k++) {
      const yb = F.y + F.h - k * 10;
      for (let xx = F.x; xx + 4 <= F.x + F.w; xx += 4) {
        const c = o.mix && g.chance(.25) ? pick(g, CAPS) : cap;
        bottle(P, xx, yb - 10, 2, c, lab, {
          dim: o.dim || 0,
          empty: o.spent && k === lv - 1 && g.chance(.2)
        });
      }
      P.r(F.x, yb - 1, F.w, 1, W[0]);
      if (k < lv - 1) P.r(F.x, yb - 10, F.w, 1, "rgba(255,255,255,0.18)");
    }
    const top = F.y + F.h - lv * 10;
    if (top > F.y) P.r(F.x, F.y, F.w, top - F.y, W[0]);
    if (o.wrap !== false) {
      for (let k = 0; k < Math.max(2, Math.round(F.w / 10)); k++) {
        const sx = F.x + g.i(Math.max(1, F.w - 3));
        P.line(sx, F.y + F.h - 1, sx + 4, F.y + 1, "rgba(255,255,255,0.24)");
      }
      P.r(F.x + Math.round(F.w * .7), F.y, 1, F.h, "rgba(255,255,255,0.3)");
      if (o.tear) {
        const tx = F.x + 2 + g.i(Math.max(1, F.w - 8)), ty = F.y + 2 + g.i(Math.max(1, F.h - 8));
        P.line(tx, ty, tx + 4, ty + 3, "#f4f8fa").line(tx + 1, ty + 4, tx + 5, ty + 6, "#e0ecf0");
      }
      if (o.flap) {
        const fx = F.x + F.w - 5;
        P.poly([ [ fx, F.y + F.h - 8 ], [ fx + 4, F.y + F.h - 9 ], [ fx + 5, F.y + F.h - 2 ], [ fx + 1, F.y + F.h - 3 ] ], "#e4eef2");
        P.line(fx + 1, F.y + F.h - 7, fx + 3, F.y + F.h - 3, "#c4d4dc");
      }
    }
  }
  function cartonFace(P, F, g, o) {
    o = o || {};
    const R = F.R;
    if (F.w >= 6 && F.h >= 5) {
      const lx = F.x + 2, ly = F.y + 2;
      P.p(lx + 1, ly, "#4a8ad0").r(lx, ly + 1, 3, 2, "#2a64b8").p(lx, ly + 1, "#6aa8e8");
      txt(P, lx + 4, ly + 1, Math.max(2, F.w - 7), "#2a64b8", g);
    }
    if (o.tape) P.r(F.x + Math.floor(F.w / 2) - 1, F.y, 3, Math.min(3, F.h), TAPE);
    if (o.mark && F.w >= 10 && F.h >= 7) mini(P, F.x + F.w - 9, F.y + F.h - 6, o.mark, INK);
    grime(P, F.x + 1, F.y + 1, F.w - 2, F.h - 2, g, 2, "rgba(70,50,30,0.2)");
  }
  const pileRot = kind => {
    const d = A.propDef(kind), f = d.draw;
    A.defPropRot(kind, {
      draw: {
        1: f,
        2: f,
        3: f
      }
    });
  };
  const rotG = (g, v, rot, k) => rot ? new SX.Rng(v * 131 + k + rot * 977) : g;
  def("waterPack", 1, 1, 4, (P, w, h, up, g0, v, col, rot) => {
    const B = h - 2, g = rotG(g0, v, rot, 9);
    sbox(P, 1, B - 5, 30, 7, .42);
    const brands = [ [ CAPS[0], LABS[0] ], [ CAPS[2], LABS[1] ], [ CAPS[1], LABS[2] ], [ CAPS[4], LABS[3] ] ], s = (v + (rot | 0) + g.i(4)) % 4;
    const b0 = brands[s], b1 = brands[(s + 1) % 4], b2 = brands[(s + 2) % 4], sw = (rot | 0) % 2;
    pack6(P, 3, B - 17, b0[0], b0[1], g, {
      tape: !sw,
      tag: !!sw
    });
    pack6(P, 16, B - 17, b1[0], b1[1], g, {
      tag: !sw,
      tape: !!sw,
      miss: g.chance(.4) ? 2 : null
    });
    P.r(3, B - 15, 25, 1, DKs(.18));
    pack6(P, sw ? 13 : 6, B - 27, b2[0], b2[1], g, {
      miss: g.chance(.5) ? 0 : null,
      tag: g.chance(.5)
    });
    P.r(sw ? 13 : 6, B - 25, 12, 2, DUST);
    lying(P, sw ? 3 : 19, B - 4, b1[0], b1[1], sw ? 1 : -1, {});
    crushed(P, sw ? 22 : 3, B - 3, pick(g, CAPS), g);
    capDot(P, 12 + g.i(4), B - 2, pick(g, CAPS));
  });
  function waterCarton(P, x, y, wd, t, f, g, o) {
    o = o || {};
    const base = o.col || "#b08a58", R = RP(base);
    box(P, x, y, wd, t, f, base, {
      fi: 3
    });
    const m = x + (wd >> 1);
    if (o.open) {
      P.r(x + 1, y + 1, wd - 2, t - 1, "#2a1e12");
      capGrid(P, x + 2, y + 1, wd - 4, t - 1, g, {
        cap: o.cap || CAPS[0],
        bg: "#3a4048",
        miss: .15
      });
      P.poly([ [ x, y + t - 1 ], [ x + 2, y - 3 ], [ m - 1, y - 2 ], [ m - 1, y + t - 1 ] ], R[4]);
      P.poly([ [ m + 1, y + t - 1 ], [ m + 1, y - 1 ], [ x + wd - 2, y - 4 ], [ x + wd, y + t - 1 ] ], R[3]);
      P.line(x + 2, y - 3, m - 1, y - 2, R[5]);
      P.p(m - 2, y - 1, TAPE).p(m + 2, y, TAPE);
    } else {
      P.r(m - 1, y, 3, t, TAPE).r(m - 1, y, 1, t, "#e8dcb4").r(m + 1, y, 1, t, TAPE2);
      P.r(m - 1, y + t, 3, 3, TAPE).r(m - 1, y + t, 1, 3, "#e8dcb4");
      if (o.torn) P.p(m + 1, y + t + 3, TAPE2).p(m, y + t + 3, TAPE);
    }
    const fy = y + t;
    if (f >= 7 && wd >= 10) {
      const lx = x + 2, ly = fy + 2;
      P.r(lx + 1, ly, 1, 1, "#4a8ad0").r(lx, ly + 1, 3, 2, "#2a64b8").p(lx, ly + 1, "#6aa8e8").r(lx + 1, ly + 3, 1, 1, "#2a64b8");
      txt(P, lx + 4, ly + 1, Math.min(8, wd - 8), "#2a64b8", g);
      txt(P, lx + 4, ly + 3, Math.min(6, wd - 10), "#6a5a44", g);
      if (o.mark) mini(P, x + wd - 9, fy + f - 6, o.mark, INK);
      if (o.fragile) {
        P.r(x + wd - 6, fy + 1, 4, 3, "#c83a34").r(x + wd - 5, fy + 2, 2, 1, "#f0e0d0");
      }
      if (o.tag) {
        P.r(x + 1, fy + f - 4, 4, 3, "#f0c040").p(x + 2, fy + f - 3, "#c83a34").p(x + 3, fy + f - 3, "#c83a34");
      } else {
        P.r(x + 3, fy + f - 3, 1, 2, R[1]).r(x + 5, fy + f - 3, 1, 2, R[1]).p(x + 3, fy + f - 4, R[1]).p(x + 5, fy + f - 4, R[1]);
      }
    }
    if (o.dent) {
      P.p(x + wd - 1, fy, R[1]).p(x + wd - 2, fy + 1, R[2]).p(x + wd - 1, fy + 1, R[1]);
    }
    if (o.wet) P.r(x + 1, fy + f - 5, Math.min(7, wd - 2), 4, "rgba(60,40,20,0.28)");
    grime(P, x + 1, fy + 1, wd - 2, f - 2, g, 3, "rgba(70,50,30,0.2)");
  }
  def("waterBoxes", 1, 1, 22, (P, w, h, up, g0, v, col, rot) => {
    const B = h - 2, g = rotG(g0, v, rot, 5), sw = (rot | 0) % 2;
    sbox(P, 1, B - 3, 30, 5, .42);
    waterCarton(P, 2, B - 19, 14, 6, 13, g, sw ? {
      fragile: true,
      dent: true,
      col: "#a8824e"
    } : {
      mark: String(10 + g.i(30)),
      wet: g.chance(.6),
      tag: true
    });
    waterCarton(P, 16, B - 19, 14, 6, 13, g, sw ? {
      mark: String(10 + g.i(30)),
      wet: g.chance(.6),
      tag: true
    } : {
      fragile: true,
      dent: true,
      col: "#a8824e"
    });
    P.r(3, B - 20, 27, 1, DKs(.3));
    const ox = sw ? 11 + g.i(3) : 5 + g.i(3), side = sw ? 2 : 20;
    waterCarton(P, ox, B - 37, 15, 7, 11, g, {
      open: true,
      cap: pick(g, CAPS),
      col: "#b89464"
    });
    if (g.chance(.6)) {
      P.r(side, B - 22, 9, 1, DKs(.25));
      bottle(P, side + 2, B - 31, 2, pick(g, CAPS), pick(g, LABS), {
        lvl: .5
      });
      bottle(P, side + 6, B - 27, 1, pick(g, CAPS), pick(g, LABS), {});
    } else waterCarton(P, side, B - 30, 10, 4, 7, g, {
      torn: true,
      col: "#9a7a4a"
    });
    crushed(P, sw ? 3 : 21, B - 3, pick(g, CAPS), g);
    capDot(P, (sw ? 20 : 4) + g.i(6), B - 1, pick(g, CAPS));
  });
  def("bottleSack", 1, 1, 10, (P, w, h, up, g0, v, col, rot) => {
    const B = h - 2, g = rotG(g0, v, rot, 3), net = (v + (rot | 0)) % 3 === 2 ? "#3a8a4a" : "#d8642a", N = RP(net), sw = (rot | 0) % 2;
    const X = (x, wd) => sw ? 32 - x - (wd || 1) : x;
    sbox(P, 2, B - 4, 28, 6, .4);
    const bx = X(18, 11);
    P.poly([ [ bx + 1, B - 4 ], [ bx, B - 15 ], [ bx + 3, B - 20 ], [ bx + 9, B - 19 ], [ bx + 11, B - 12 ], [ bx + 10, B - 4 ] ], E[2]);
    P.line(bx + 1, B - 14, bx + 9, B - 18, E[5]);
    P.r(bx + 4, B - 22, 3, 2, E[1]).p(bx + 5, B - 23, E[2]);
    for (let k = 0; k < 4; k++) crushed(P, bx + 1 + g.i(2), B - 16 + k * 3, pick(g, CAPS), null);
    P.r(bx + 1, B - 5, 9, 1, E[1]);
    const ax = sw ? 8 : 0, top = B - 26, pts = [ [ ax + 3, B - 2 ], [ ax + 2, B - 12 ], [ ax + 5, top + 5 ], [ ax + 10, top + 1 ], [ ax + 17, top + 1 ], [ ax + 22, top + 5 ], [ ax + 24, B - 12 ], [ ax + 23, B - 2 ] ];
    P.poly(pts, "#5a7078");
    for (let yy = top + 3; yy < B - 3; yy += 3) for (let xx = ax + 3 + (yy >> 1) % 3; xx < ax + 21; xx += 9) crushed(P, xx, yy, pick(g, CAPS), g);
    for (let k = 0; k < 5; k++) capDot(P, ax + 5 + g.i(15), top + 5 + g.i(B - top - 9), pick(g, CAPS));
    const inside = (x, y) => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i], b = pts[j];
        if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    };
    for (let y = top; y < B; y++) for (let x = ax + 1; x < ax + 26; x++) if (inside(x + .5, y + .5) && ((x + y) % 6 === 0 || (x - y + 96) % 6 === 0)) P.p(x, y, (x + y) % 12 === 0 ? N[4] : N[2]);
    P.r(ax + 3, B - 3, 20, 1, N[1]);
    const cx = ax + 13;
    P.r(cx - 3, top - 3, 6, 4, N[3]).r(cx - 3, top - 3, 6, 1, N[4]).r(cx - 2, top - 6, 4, 3, N[2]).p(cx - 1, top - 6, N[4]);
    P.r(cx - 4, top - 1, 8, 1, "#c8b890").p(cx + 4, top, "#c8b890").p(cx + 5, top + 1, "#c8b890");
    P.r(cx + 4, top + 2, 6, 5, "#e8e0c8").r(cx + 4, top + 2, 6, 1, "#f8f0dc").p(cx + 5, top + 3, INK).r(cx + 6, top + 4, 3, 1, INK).p(cx + 7, top + 5, "#2a64b8");
    crushed(P, X(22, 8), B - 3, pick(g, CAPS), g);
    capDot(P, X(26, 2) + g.i(2), B - 1, pick(g, CAPS));
    capDot(P, X(1, 2) + g.i(2), B - 1, pick(g, CAPS));
  });
  def("bottleWall", 1, 1, 52, (P, w, h, up, g, v) => {
    const B = h - 2 - 22, WD = RP("#8a6a44");
    P.r(3, B - 44, 26, 15, WD[3]);
    grain(P, 3, B - 44, 26, 15, "#8a6a44", g, 10);
    P.r(3, B - 44, 26, 1, WD[5]).r(3, B - 30, 26, 1, WD[1]).r(3, B - 37, 26, 1, WD[2]);
    for (const [x, y] of [ [ 4, B - 43 ], [ 27, B - 43 ], [ 4, B - 32 ], [ 27, B - 32 ] ]) P.p(x, y, "#c8ccd0").p(x + 1, y + 1, WD[1]);
    for (let k = 0; k < 4; k++) P.p(7 + k * 4, B - 46, CAPS[(k + v) % CAPS.length]).p(8 + k * 4, B - 46, RP(CAPS[(k + v) % CAPS.length])[2]).p(7 + k * 4, B - 45, "#9aa0a8");
    const cs = [ pick(g, CAPS), pick(g, CAPS), pick(g, CAPS) ];
    for (let k = 0; k < 3; k++) {
      const x = 6 + k * 6;
      bottle(P, x, B - 41, 2, cs[k], pick(g, LABS), {
        lvl: k === 1 ? .6 : 0,
        empty: k === 2 && g.chance(.5)
      });
      P.r(x - 1, B - 36, 6, 1, "#9aa0a8").p(x - 1, B - 37, "#c8ccd0").p(x + 4, B - 37, "#c8ccd0");
    }
    for (let k = 0; k < 4; k++) P.r(6 + k * 2, B - 31, 1, 2, CHALK);
    P.line(5, B - 30, 13, B - 31, CHALK);
    P.r(22, B - 42, 6, 9, "#ece6d2").r(22, B - 42, 6, 1, "#f8f4e6").r(27, B - 41, 1, 8, "#c8c0a8");
    P.r(23, B - 43, 3, 2, TAPE).p(23, B - 43, "#e8dcb4");
    P.r(23, B - 40, 4, 1, INK).p(24, B - 39, INK).r(23, B - 38, 3, 1, "#2a64b8");
    mini(P, 23, B - 37, "2", "#c83a34");
    P.r(16, B - 30, 1, 4, "#c8b890");
    lying(P, 12, B - 26, CAPS[3], LABS[2], 1, {
      empty: true
    });
    P.r(3, B - 29, 5, 2, "#9aa0a8").p(3, B - 29, "#c0c6cc");
    scratch(P, 4, B - 43, 22, 12, g, 3, WD[4]);
  });
  const PAL = "#9a7a4a";
  function palletFace(P, F, g) {
    const R = F.R, n = Math.max(2, Math.round(F.w / 22));
    P.r(F.x, F.y, F.w, F.h, R[3]).r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
    for (let k = 0; k < n; k++) {
      const gx = F.x + 4 + Math.round(k * (F.w - 8) / n), gw = Math.max(3, Math.round((F.w - 8) / n) - 5);
      P.r(gx, F.y + 1, gw, F.h - 2, "#1e1810").r(gx, F.y + 1, gw, 1, "#3a2e20");
    }
    for (let x = F.x + 2; x < F.x + F.w - 1; x += 7) P.p(x, F.y + 1, "#c8ccd0");
    vgrain(P, F.x, F.y, F.w, F.h, PAL, g, Math.round(F.w / 6));
  }
  function stockSheet(P, x, y, g) {
    P.r(x, y, 7, 9, "#ece8da").r(x, y, 7, 1, "#faf8ee").r(x + 6, y + 1, 1, 8, "#c8c2ae");
    for (let k = 0; k < 3; k++) txt(P, x + 1, y + 2 + k * 2, 5, "#6a6458", g);
    P.r(x + 1, y + 8, 3, 1, "#c83a34");
    P.r(x + 2, y - 1, 3, 2, TAPE);
  }
  build("waterPallet", 2, 1, {
    front: true,
    pad: 2,
    tpu: 13,
    sh: .45,
    col: PAL,
    parts: [ {
      x: .01,
      y: .03,
      w: .98,
      d: .94,
      z: 0,
      hh: 5,
      wood: 1,
      f: (P, F, g) => palletFace(P, F, g),
      s: (P, F, g) => palletFace(P, F, g),
      b: (P, F, g) => palletFace(P, F, g),
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[4]);
        for (let k = 0; k < 5; k++) {
          const q = T.put(0, k / 5, 1, .12);
          P.r(q.x, q.y, q.w, q.h, R[2]);
        }
      }
    }, {
      x: .03,
      y: .08,
      w: .53,
      d: .84,
      z: 5,
      hh: 30,
      col: W[2],
      f: (P, F, g) => {
        packFace(P, F, g, {
          cap: CAPS[0],
          lab: LABS[0],
          tear: true,
          flap: true
        });
        stockSheet(P, F.x + 3, F.y + 9, g);
        mini(P, F.x + F.w - 14, F.y + 2, "A-3", INK);
      },
      s: (P, F, g) => {
        packFace(P, F, g, {
          cap: CAPS[0],
          lab: LABS[0]
        });
        P.r(F.x + 2, F.y + 12, 5, 3, TAPE).p(F.x + 3, F.y + 13, INK).p(F.x + 5, F.y + 13, INK);
      },
      b: (P, F, g) => {
        packFace(P, F, g, {
          cap: CAPS[0],
          lab: LABS[0],
          dim: .2
        });
        P.r(F.x + 4, F.y + 4, 9, 5, "#e8e4d8").r(F.x + 4, F.y + 4, 9, 1, "#2a64b8");
        txt(P, F.x + 5, F.y + 6, 7, "#6a6458", g);
      },
      t: (P, T, g) => {
        capGrid(P, T.x, T.y, T.w, T.h, g, {
          cap: CAPS[0],
          film: true
        });
        const q = T.put(.3, .3, .3, .3);
        P.r(q.x, q.y, q.w, Math.max(1, q.h), DUST);
      }
    }, {
      x: .59,
      y: .14,
      w: .38,
      d: .74,
      z: 5,
      hh: 20,
      col: W[2],
      f: (P, F, g) => {
        packFace(P, F, g, {
          cap: CAPS[2],
          lab: LABS[1],
          mix: true,
          spent: true,
          tear: true
        });
        P.r(F.x + F.w - 6, F.y + F.h - 5, 4, 3, "#f0c040").p(F.x + F.w - 5, F.y + F.h - 4, "#c83a34");
      },
      s: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[2],
        lab: LABS[1],
        mix: true,
        spent: true,
        flap: true
      }),
      b: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[2],
        lab: LABS[1],
        dim: .2
      }),
      t: (P, T, g) => capGrid(P, T.x, T.y, T.w, T.h, g, {
        cap: CAPS[2],
        miss: .3,
        film: true
      })
    }, {
      x: .64,
      y: .3,
      w: .26,
      d: .4,
      z: 25,
      hh: 10,
      col: W[2],
      nohit: 1,
      cond: v => v % 2 === 0,
      f: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[1],
        lab: LABS[2],
        wrap: false
      }),
      s: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[1],
        lab: LABS[2],
        wrap: false
      }),
      b: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[1],
        lab: LABS[2],
        wrap: false,
        dim: .2
      }),
      t: (P, T, g) => capGrid(P, T.x, T.y, T.w, T.h, g, {
        cap: CAPS[1]
      })
    } ],
    after: (P, G, g, v) => {
      const B = G.B;
      crushed(P, G.pad + 2 + g.i(6), B - 3, pick(g, CAPS), g);
      capDot(P, G.pad + 14 + g.i(20), B - 1, pick(g, CAPS));
    }
  });
  const SHF = "#6e747c";
  const shelfBoard = (z, hh) => ({
    x: 0,
    y: 0,
    w: 1,
    d: 1,
    z,
    hh: hh || 2,
    metal: 1,
    all: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y, F.w, 1, R[5]);
      if (F.h > 2) P.r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
    },
    t: (P, T, g) => {
      const R = T.R;
      P.r(T.x, T.y, T.w, T.h, R[3]);
      P.r(T.x, T.y, T.w, 1, R[4]);
      rust(P, T.x + 1, T.y, T.w - 2, Math.max(1, T.h - 1), g, 2);
    }
  });
  const shelfRow = (z, big, back) => ({
    x: .05,
    y: back ? .08 : .42,
    w: .9,
    d: back ? .3 : .44,
    z,
    hh: 10,
    skipBox: true,
    nohit: 1,
    f: (P, F, g) => bottleRow(P, F.x, F.x + F.w, F.y + F.h, 10, g, back ? {
      big,
      gap: .04,
      dim: .28
    } : {
      fall: true,
      big
    }),
    s: (P, F, g) => bottleRow(P, F.x, F.x + F.w, F.y + F.h, 10, g, {
      big,
      gap: .15,
      dim: back ? .28 : 0
    }),
    b: (P, F, g) => {
      bottleRow(P, F.x, F.x + F.w, F.y + F.h, 10, g, {
        big,
        gap: .15
      });
      P.r(F.x, F.y, F.w, F.h, "rgba(10,12,20,0.25)");
    }
  });
  const priceStrip = z => ({
    x: 0,
    y: .92,
    w: 1,
    d: .08,
    z,
    hh: 2,
    noTop: 1,
    nohit: 1,
    col: "#d8d2c0",
    f: (P, F, g) => {
      P.r(F.x, F.y, F.w, F.h, "#d8d2c0");
      for (let x = F.x + 2 + g.i(4); x < F.x + F.w - 4; x += 8 + g.i(6)) {
        P.r(x, F.y, 4, 2, g.chance(.75) ? "#f4f0dc" : "#f0d040").p(x + 1, F.y, "#c83a34").p(x + 2, F.y, "#c83a34").p(x + 1, F.y + 1, INK);
      }
    },
    s: (P, F) => {
      P.r(F.x, F.y, F.w, F.h, "#c8c2b0");
    },
    b: (P, F) => {
      P.r(F.x, F.y, F.w, F.h, "#a8a494");
    }
  });
  build("waterShelf", 2, 1, {
    front: true,
    pad: 2,
    tpu: 12,
    col: SHF,
    parts: [ {
      x: .02,
      y: 0,
      w: .96,
      d: .05,
      z: 2,
      hh: 52,
      col: "#1e2126",
      skipBox: true,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#1e2126");
        vgrad(P, F.x, F.y, F.w, F.h, "#2a2e34", "#181a1e", .1, .9);
        for (let x = F.x + 2; x < F.x + F.w - 1; x += 4) P.r(x, F.y, 1, F.h, "rgba(0,0,0,0.2)");
      },
      b: (P, F, g) => {
        P.r(F.x, F.y, F.w, F.h, "#2a2e34");
        for (let x = F.x + 2; x < F.x + F.w - 1; x += 4) for (let y = F.y + 2; y < F.y + F.h - 1; y += 4) P.p(x, y, "#0e1012");
        P.r(F.x + 6, F.y + 8, 8, 10, "#e8e4d8").r(F.x + 6, F.y + 8, 8, 1, "#faf8ee");
        for (let k = 0; k < 4; k++) txt(P, F.x + 7, F.y + 10 + k * 2, 6, "#6a6458", g);
        P.r(F.x + 8, F.y + 7, 4, 2, TAPE);
        P.r(F.x + F.w - 14, F.y + 20, 6, 6, "#4a8ad0").r(F.x + F.w - 13, F.y + 22, 4, 3, "#e8f4ff");
        rust(P, F.x + 2, F.y + F.h - 8, F.w - 4, 6, g, 6);
      }
    }, shelfBoard(0, 3), shelfRow(3, .6, true), shelfRow(3, .7), priceStrip(1), shelfBoard(14), shelfRow(16, .4, true), shelfRow(16, .5), priceStrip(14), shelfBoard(27), shelfRow(29, .2, true), shelfRow(29, .3), priceStrip(27), shelfBoard(40), shelfRow(42, .2, true), shelfRow(42, .2), priceStrip(40), shelfBoard(52, 3), ...[ [ 0, 0 ], [ .95, 0 ], [ 0, .9 ], [ .95, .9 ] ].map(([x, y]) => ({
      x,
      y,
      w: .05,
      d: .1,
      z: 0,
      hh: 55,
      noTop: 1,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[4]);
        for (let yy = F.y + 3; yy < F.y + F.h - 2; yy += 4) P.p(F.x + Math.round(F.w / 2), yy, R[0]);
      }
    })), {
      x: .05,
      y: .12,
      w: .38,
      d: .6,
      z: 55,
      hh: 10,
      col: W[2],
      nohit: 1,
      f: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[4],
        lab: LABS[3],
        wrap: false
      }),
      s: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[4],
        lab: LABS[3],
        wrap: false
      }),
      b: (P, F, g) => packFace(P, F, g, {
        cap: CAPS[4],
        lab: LABS[3],
        wrap: false,
        dim: .2
      }),
      t: (P, T, g) => capGrid(P, T.x, T.y, T.w, T.h, g, {
        cap: CAPS[4]
      })
    }, {
      x: .5,
      y: .16,
      w: .44,
      d: .56,
      z: 55,
      hh: 9,
      col: "#b08a58",
      nohit: 1,
      f: (P, F, g) => cartonFace(P, F, g, {
        tape: true,
        mark: "24"
      }),
      s: (P, F, g) => cartonFace(P, F, g, {}),
      b: (P, F, g) => cartonFace(P, F, g, {}),
      t: (P, T) => {
        P.r(T.x + Math.floor(T.w / 2) - 1, T.y, 3, T.h, TAPE);
      }
    }, {
      x: .24,
      y: .9,
      w: .52,
      d: .06,
      z: 52,
      hh: 10,
      col: "#2a64b8",
      noTop: 1,
      nohit: 1,
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, F.h, R[3]).r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
        label(P, F.x, F.y + 1, "생수", "#f4f8ff", 7, F.w - 6, {
          sh: R[1]
        });
        const dx = F.x + F.w - 6;
        P.p(dx + 1, F.y + 2, "#e8f4ff").r(dx, F.y + 3, 3, 3, "#bfe0f8").p(dx, F.y + 3, "#ffffff");
        P.p(F.x + 1, F.y + 2, "#c8ccd0").p(F.x + F.w - 2, F.y + 2, "#c8ccd0");
        P.r(F.x + 2, F.y + F.h - 3, 3, 1, R[1]);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, F.h, R[2]).r(F.x, F.y, F.w, 1, R[4]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, F.h, R[2]);
        txt(P, F.x + 2, F.y + 4, F.w - 4, R[1], g);
      }
    } ],
    after: (P, G, g, v) => {
      const B = G.B;
      crushed(P, G.pad + 4 + g.i(10), B - 3, pick(g, CAPS), g);
      capDot(P, G.pad + 30 + g.i(20), B - 1, pick(g, CAPS));
    }
  });
  const JUG = [ "#5a9ad0", "#6aa8c0", "#7ab6d8" ], RACK = "#5e646c";
  function jugEnd(P, F, g, cap, hue, o) {
    o = o || {};
    const J = RP(hue), cx = F.x + Math.floor(F.w / 2), cy = F.y + Math.floor(F.h / 2), rx = Math.max(2, Math.floor(F.w / 2) - 1), ry = Math.max(2, Math.floor(F.h / 2) - 1);
    P.oval(cx, cy, rx, ry, J[2]);
    P.oval(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), J[3]);
    P.ring(cx, cy, Math.max(1, rx - 2), Math.max(1, ry - 2), J[4]);
    if (o.cap) {
      const C = RP(cap);
      P.r(cx - 1, cy - 1, 3, 3, C[3]).p(cx - 1, cy - 1, C[5]).p(cx + 1, cy + 1, C[1]);
    }
    if (o.lvl) P.r(cx - rx + 1, cy - ry + 1, rx * 2 - 1, Math.max(1, Math.round(ry * o.lvl)), "rgba(220,236,244,0.55)");
    P.p(cx - rx + 1, cy - 1, J[5]).p(cx - rx + 2, cy - ry + 1, J[5]);
  }
  function jugSide(P, F, g, cap, hue, o) {
    o = o || {};
    const J = RP(hue), C = RP(cap), x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x + 1, y, w - 3, h, J[3]).r(x, y + 1, w - 1, h - 2, J[3]);
    P.r(x + 1, y, w - 3, 1, J[5]).r(x, y + h - 2, w - 1, 1, J[1]).r(x + 1, y + h - 1, w - 3, 1, J[1]);
    for (let k = 3; k < w - 4; k += 4) P.r(x + k, y + 1, 1, h - 2, J[2]);
    if (w > 10) {
      P.r(x + Math.round(w * .35), y + 1, Math.max(3, Math.round(w * .25)), h - 2, "#f0ece0");
      P.r(x + Math.round(w * .35) + 1, y + 2, 2, 1, "#2a64b8");
    }
    const nx = o.flip ? x - 1 : x + w - 2;
    P.r(nx, y + Math.floor(h / 2) - 1, 2, 3, C[3]).p(nx, y + Math.floor(h / 2) - 1, C[5]);
    if (o.lvl) P.r(x + 1, y + 1, w - 3, Math.max(1, Math.round((h - 2) * o.lvl)), "rgba(220,236,244,0.5)");
  }
  function jugTop(P, T, g, cap, hue) {
    const J = RP(hue);
    P.r(T.x, T.y, T.w, T.h, J[4]);
    P.r(T.x, T.y, T.w, 1, J[5]);
    if (T.w > 6) P.r(T.x + 2, T.y + Math.floor(T.h / 2), T.w - 4, 1, J[3]);
  }
  const jug = (x, y, z, hue, cap, lvl) => ({
    x,
    y,
    w: .42,
    d: .86,
    z,
    hh: 9,
    skipBox: true,
    col: hue,
    f: (P, F, g) => jugEnd(P, F, g, cap, hue, {
      cap: true,
      lvl
    }),
    b: (P, F, g) => jugEnd(P, F, g, cap, hue, {}),
    s: (P, F, g) => jugSide(P, F, g, cap, hue, {
      lvl,
      flip: F.rot === 3
    }),
    t: (P, T, g) => jugTop(P, T, g, cap, hue)
  });
  const standJug = (x, y, w, d, hh, hue, cap, o) => Object.assign({
    x,
    y,
    w,
    d,
    z: 25,
    hh,
    col: hue,
    nohit: 1,
    skipBox: true,
    all: (P, F, g) => {
      const J = RP(hue), C = RP(cap);
      const X0 = F.x, Y0 = F.y, Wd = F.w, Hh = F.h;
      P.r(X0, Y0, Wd, Hh, J[3]);
      vgrad(P, X0, Y0, Wd, Hh, J[4], J[2], .2, .95);
      P.r(X0, Y0 + 2, Wd, 1, J[2]).r(X0, Y0 + Hh - 3, Wd, 1, J[2]).r(X0 + Wd - 1, Y0, 1, Hh, J[1]).r(X0 + 1, Y0 + 1, 1, Hh - 3, J[5]);
      if (o && o.empty) {
        P.r(X0 + 1, Y0 + 1, Wd - 2, Hh - 3, "rgba(240,248,252,0.35)");
        P.r(X0 + Wd - 3, Y0 + 4, 4, 3, "#e8c040").p(X0 + Wd - 2, Y0 + 5, "#c83a34");
      } else {
        P.r(X0 + 1, Y0 + 4, Wd - 2, 3, "#f0ece0").p(X0 + 2, Y0 + 5, "#2a64b8");
        P.r(X0, Y0 + Math.round(Hh * .35), Wd, 1, J[4]);
      }
    },
    t: (P, T) => {
      const J = RP(hue), C = RP(cap), cx = T.x + Math.floor(T.w / 2), cy = T.y + Math.floor(T.h / 2);
      P.oval(cx, cy, Math.max(1, Math.floor(T.w / 2)), Math.max(1, Math.floor(T.h / 2)), J[4]);
      P.oval(cx, cy, Math.max(1, Math.floor(T.w / 2) - 1), Math.max(1, Math.floor(T.h / 2) - 1), J[5]);
      P.r(cx - 1, cy - 2, 3, 3, C[3]).p(cx - 1, cy - 2, C[5]).p(cx + 1, cy, C[1]);
    }
  }, o || {});
  build("waterJugRack", 1, 1, {
    front: true,
    pad: 3,
    tpu: 14,
    col: RACK,
    parts: [ ...[ 0, 12 ].map(z => ({
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z,
      hh: 2,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[2]);
        for (let k = 1; k < 4; k++) {
          const q = T.put(k / 4, 0, .02, 1);
          P.r(q.x, q.y, 1, q.h, R[4]);
        }
        rust(P, T.x + 1, T.y, T.w - 2, Math.max(1, T.h - 1), g, 2);
      }
    })), jug(.05, .07, 2, JUG[0], CAPS[0], 0), jug(.53, .07, 2, JUG[1], CAPS[0], .45), jug(.05, .07, 14, JUG[2], CAPS[4], 0), jug(.53, .07, 14, JUG[0], CAPS[1], 0), {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 23,
      hh: 2,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[3]);
        P.r(T.x, T.y, T.w, 1, R[4]);
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), 1, DUST);
      }
    }, standJug(.1, .26, .36, .48, 12, JUG[0], CAPS[0]), standJug(.56, .3, .32, .42, 11, "#b4ccd6", CAPS[1], {
      empty: true,
      cond: v => v % 3 !== 2
    }), ...[ [ 0, 0 ], [ .92, 0 ], [ 0, .88 ], [ .92, .88 ] ].map(([x, y]) => ({
      x,
      y,
      w: .08,
      d: .12,
      z: 0,
      hh: 25,
      noTop: 1,
      metal: 1,
      all: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y, 1, F.h, R[5]);
        for (let yy = F.y + 2; yy < F.y + F.h - 2; yy += 4) P.p(F.x + Math.max(0, Math.round(F.w / 2)), yy, R[0]);
        rust(P, F.x, F.y + F.h - 5, F.w, 4, g, 1);
      }
    })) ],
    after: (P, G, g, v) => {
      const B = G.B;
      capDot(P, G.pad + 2 + g.i(20), B - 1, CAPS[0]);
    }
  });
  const STAND = "#d8dce0", STAND_JUG = "#3e86c4", STEEL = "#b8c0c4";
  function standFront(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x + 5, y + 1, w - 10, 1, R[1]).p(x + 6, y + 1, "#ff6a4a").p(x + 8, y + 1, "#5ad0ff").p(x + w - 6, y + 1, "#4ae06a");
    const tl = x + 3, tr = x + w - 6;
    P.r(tl, y + 2, 3, 2, "#c83a34").p(tl, y + 2, "#f06a5a").p(tl + 2, y + 3, "#8a2420");
    P.p(tl - 1, y + 3, "#e8902a");
    P.r(tr, y + 2, 3, 2, "#2a64b8").p(tr, y + 2, "#5a9ae8").p(tr + 2, y + 3, "#1a3a78");
    const rx = x + 2, ry = y + 4, rw = w - 4, rh = 9;
    P.r(rx, ry, rw, rh, "#2a3038").r(rx + 1, ry + 1, rw - 2, rh - 3, "#3a424c").r(rx, ry, rw, 1, "#1a1e24");
    P.r(rx + 1, ry + 3, rw - 2, 1, "#46505a");
    P.r(tl + 1, ry, 1, 2, STEEL).p(tl + 1, ry + 1, "#e8eef2").r(tr + 1, ry, 1, 2, STEEL).p(tr + 1, ry + 1, "#e8eef2");
    P.p(tr + 1, ry + 3, "#9ad0f0");
    P.r(rx + 1, ry + rh - 3, rw - 2, 2, "#5a626c");
    for (let k = rx + 2; k < rx + rw - 1; k += 2) P.p(k, ry + rh - 3, "#1a1e24");
    P.p(rx + 3, ry + rh - 2, "#9ad0f0").p(rx + rw - 4, ry + rh - 2, "#cfe8f8");
    P.r(rx, ry + rh - 1, rw, 1, STEEL).p(rx, ry + rh - 1, "#e8eef2");
    const dy = ry + rh;
    P.r(x + 2, dy, w - 4, 1, R[1]).r(x + 2, dy, 1, h - (dy - y) - 2, R[1]).r(x + w - 3, dy, 1, h - (dy - y) - 2, R[1]);
    P.r(x + w - 5, dy + 2, 1, 3, STEEL).p(x + w - 5, dy + 2, "#e8eef2");
    P.r(x + 4, dy + 1, 4, 5, "#f4f4ee").r(x + 4, dy + 2, 2, 1, "#3aa04a").r(x + 4, dy + 3, 3, 1, "#a8c838").r(x + 4, dy + 4, 4, 1, "#f0b030").p(x + 7, dy + 1, "#2a64b8");
    P.p(x + 10, dy + 1, "#6aa8e8").r(x + 9, dy + 2, 3, 2, "#2a64b8").p(x + 10, dy + 4, "#2a64b8");
    for (let k = x + 9; k < x + w - 6; k += 2) P.p(k, dy + 5, R[1]);
  }
  function standSide(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x + 1, y + 3, w - 2, 1, R[4]).r(x + 1, y + 12, w - 2, 1, R[1]);
    if (w >= 9) {
      const cx = x + 3;
      P.p(cx + 1, y + 5, "#f4f8ff").r(cx, y + 6, 3, 3, "#f4f8ff").r(cx + 1, y + 6, 1, 2, "#4a8ad0").p(cx + 2, y + 7, "#2a64b8");
    }
    if (w >= 12) {
      P.r(x + w - 7, y + 5, 5, 5, "#e8e4d8").r(x + w - 7, y + 5, 5, 1, "#c83a34");
      txt(P, x + w - 6, y + 7, 3, "#8a8478", g);
      P.p(x + w - 5, y + 9, "#2a64b8");
    }
    for (let yy = y + h - 8; yy < y + h - 3; yy += 2) P.r(x + 3, yy, w - 6, 1, R[1]);
    scratch(P, x + 1, y + 2, w - 2, h - 6, g, 3, R[5]);
  }
  function standBack(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x + 2, y + 3, w - 4, h - 9, "#3a3e44");
    for (let yy = y + 4; yy < y + h - 7; yy += 2) P.r(x + 3, yy, w - 6, 1, "#6a7078");
    for (let xx = x + 4; xx < x + w - 3; xx += 4) P.r(xx, y + 3, 1, h - 9, "#24282e");
    P.r(x + 3, y + h - 5, 6, 3, "#e8e4d8").r(x + 4, y + h - 4, 4, 1, "#8a8478");
    P.r(x + w - 4, y + 1, 2, 2, "#5a5e64").p(x + w - 4, y + 1, "#8a8e94");
    R2.cord(P, x + w - 3, y + 3, h - 3);
    P.p(x + 10, y + h - 4, "#c83a34").p(x + 11, y + h - 4, "#8a2420");
  }
  function standJugFace(P, F, g) {
    const J = RP(STAND_JUG), x = F.x, y = F.y, w = F.w, h = F.h, bh = h - 3;
    P.r(x, y, w, bh, J[3]).r(x, y, 2, bh, J[4]).r(x + w - 3, y, 2, bh, J[2]).r(x + w - 1, y, 1, bh, J[1]);
    P.r(x + 1, y + 1, 1, bh - 3, J[5]);
    P.r(x, y + 1, w, 1, J[2]).r(x + 1, y + 2, w - 2, 1, J[4]);
    P.r(x, y + bh - 2, w, 1, J[2]).r(x + 1, y + bh - 1, w - 2, 1, J[4]);
    P.r(x + 2, y + 4, w - 4, 2, "#f0ece0").r(x + 2, y + 6, w - 4, 1, "#d8d2c0");
    for (let k = x + 2; k < x + w - 2; k++) P.p(k, y + 4 + ((k - x) % 4 < 2 ? 0 : 1), "#6aa8e0");
    P.p(x + w - 4, y + 8, "#cfe8f8").p(x + 4, y + 8, "#a8d4f0").p(x + w - 6, y + 3, "#a8d4f0");
    P.r(x + 1, y + bh, w - 2, 1, J[2]).p(x + 1, y + bh, J[3]);
    P.r(x + 3, y + bh + 1, w - 6, 1, J[2]).p(x + 3, y + bh + 1, J[4]);
    P.r(x + 4, y + bh + 2, w - 8, 1, J[1]);
  }
  function standJugTop(P, T) {
    const J = RP(STAND_JUG), cx = T.x + Math.floor(T.w / 2), cy = T.y + Math.floor(T.h / 2), rx = Math.max(1, Math.floor(T.w / 2)), ry = Math.max(1, Math.floor(T.h / 2));
    P.r(T.x, cy, T.w, T.h - (cy - T.y), J[3]).r(T.x, cy, 2, T.h - (cy - T.y), J[4]).r(T.x + T.w - 2, cy, 2, T.h - (cy - T.y), J[2]);
    P.oval(cx, cy, rx, ry, J[4]);
    P.oval(cx, cy, Math.max(1, rx - 1), Math.max(1, ry - 1), J[3]);
    P.ring(cx, cy, Math.max(1, rx - 3), Math.max(1, ry - 2), J[5]);
    P.p(cx, cy, J[2]).p(cx - rx + 2, cy - 1, J[5]).p(cx - rx + 3, cy - ry + 1, "#ffffff");
  }
  function cupTube(P, F) {
    const x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x, y, w, 2, "#8a9098").r(x, y, w, 1, "#c8ccd0");
    P.r(x, y + 2, w, h - 5, "#e8ecee");
    for (let yy = y + 3; yy < y + h - 3; yy += 2) P.r(x, yy, w, 1, "#c8ccd0");
    P.r(x, y + 2, 1, h - 5, "#a8b4bc").r(x + w - 1, y + 2, 1, h - 5, "#8a98a2");
    P.r(x - 1, y + h - 3, w + 2, 1, "#f8f8f4").r(x, y + h - 2, w, 2, "#f0f0ea").p(x + w - 1, y + h - 1, "#d0d0c8");
  }
  build("waterStand", 1, 1, {
    front: true,
    pad: 3,
    tpu: 14,
    col: STAND,
    parts: [ {
      x: .19,
      y: .2,
      w: .62,
      d: .66,
      z: 0,
      hh: 22,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => standFront(P, F, g),
      s: (P, F, g) => standSide(P, F, g),
      b: (P, F, g) => standBack(P, F, g),
      all: (P, F) => {
        P.r(F.x, F.y + F.h - 2, F.w, 2, "#4a4e54").r(F.x, F.y + F.h - 2, F.w, 1, "#6a6e74").p(F.x + 1, F.y + F.h - 1, "#2a2c30").p(F.x + F.w - 2, F.y + F.h - 1, "#2a2c30");
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), 1, R[5]);
        grime(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), g, 2, DUST);
      }
    }, {
      x: .32,
      y: .33,
      w: .36,
      d: .36,
      z: 22,
      hh: 2,
      col: "#9aa2aa"
    }, {
      x: .24,
      y: .25,
      w: .52,
      d: .52,
      z: 24,
      hh: 11,
      col: STAND_JUG,
      nohit: 1,
      skipBox: true,
      all: (P, F, g) => standJugFace(P, F, g),
      t: (P, T) => standJugTop(P, T)
    }, {
      x: .81,
      y: .42,
      w: .1,
      d: .18,
      z: 7,
      hh: 13,
      col: "#e8ecee",
      nohit: 1,
      skipBox: true,
      noTop: 1,
      all: (P, F) => cupTube(P, F)
    } ],
    after: (P, G, g, v) => {
      const B = G.B;
      if (v % 2 === 0) {
        const cx = G.pad + 1 + g.i(3);
        P.r(cx, B - 2, 3, 2, "#f0f0ea").p(cx + 3, B - 1, "#d8d8d0").p(cx + 1, B - 2, "#ffffff");
      }
    }
  });
  const CASE = (c, v) => c || [ "#b8342e", "#2e5aa0", "#d8d8d0" ][v % 3];
  function caseDoor(P, F, g) {
    const R = F.R, x = F.x + 2, y = F.y + 10, w = F.w - 4, h = F.h - 17;
    P.r(F.x, F.y, F.w, 10, R[2]).r(F.x, F.y, F.w, 1, R[4]);
    P.r(F.x + 2, F.y + 2, F.w - 4, 7, "#dff2ff").r(F.x + 2, F.y + 8, F.w - 4, 1, "#a8d0e8");
    label(P, F.x + 2, F.y + 2, "생수", "#1e5aa8", 7, F.w - 4);
    P.r(x - 1, y - 1, w + 2, h + 2, "#3a3e44");
    P.r(x, y, w, h, "#9cc4d8");
    vgrad(P, x, y, w, h, "#b8dcec", "#7aa8c0", .1, .95);
    const n = 4, rh = Math.floor(h / n);
    for (let k = 0; k < n; k++) {
      const yb = y + (k + 1) * rh - 1;
      bottleRow(P, x + 1, x + w - 1, yb, rh - 2, g, {
        big: k === n - 1 ? .8 : .3,
        gap: .08
      });
      P.r(x, yb, w, 1, "#e8eef2");
      P.r(x + 2 + g.i(4), yb, 3, 1, "#f0d040");
    }
    P.line(x + 1, y + h - 2, x + w - 3, y + 2, "rgba(255,255,255,0.25)");
    P.line(x + 3, y + h - 2, x + w - 1, y + 4, "rgba(255,255,255,0.14)");
    P.r(x + w - 3, y + Math.round(h * .3), 2, Math.round(h * .4), "#c8ccd0").r(x + w - 3, y + Math.round(h * .3), 1, Math.round(h * .4), "#eef0f2");
    P.r(x + 1, y + 2, 4, 3, "#f0e040").p(x + 2, y + 3, "#c83a34");
    P.r(F.x + 1, F.y + F.h - 7, F.w - 2, 5, R[1]);
    for (let xx = F.x + 3; xx < F.x + F.w - 3; xx += 2) P.r(xx, F.y + F.h - 6, 1, 3, "#16181c");
    P.p(F.x + F.w - 4, F.y + F.h - 2, "#4ae06a");
  }
  function caseSide(P, F, g) {
    const R = F.R;
    P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 4, R[3]);
    P.r(F.x + 1, F.y + 2, 1, F.h - 4, R[4]);
    P.r(F.x + F.w - 2, F.y + 2, 1, F.h - 4, R[1]);
    P.r(F.x + 1, F.y + 4, F.w - 2, 2, "#e8e8e0").r(F.x + 1, F.y + 7, F.w - 2, 1, "#e8e8e0");
    if (F.w >= 8) {
      const cx = F.x + Math.floor(F.w / 2);
      P.r(cx - 2, F.y + 14, 4, 6, "#f0f4f8").p(cx - 1, F.y + 12, "#f0f4f8").r(cx - 2, F.y + 13, 4, 1, "#f0f4f8");
      P.r(cx - 1, F.y + 15, 2, 4, "#4a8ad0");
    }
    for (let yy = F.y + F.h - 12; yy < F.y + F.h - 4; yy += 2) P.r(F.x + 2, yy, F.w - 4, 1, R[1]);
    P.r(F.x + 2, F.y + 26, Math.min(5, F.w - 4), 3, "#e8e4d8").r(F.x + 2, F.y + 26, Math.min(5, F.w - 4), 1, "#c83a34");
    P.r(F.x + F.w - 6, F.y + 31, 3, 3, "#f0d040").p(F.x + F.w - 5, F.y + 32, "#2a2622");
    scratch(P, F.x + 1, F.y + 3, F.w - 2, F.h - 8, g, 5, R[5]);
    rust(P, F.x + 1, F.y + F.h - 6, F.w - 2, 4, g, 3);
    P.p(F.x + F.w - 3, F.y + 20, R[1]).p(F.x + F.w - 3, F.y + 21, R[2]).p(F.x + F.w - 4, F.y + 21, R[2]);
  }
  build("waterCase", 1, 1, {
    front: true,
    pad: 4,
    tpu: 11,
    sh: .45,
    col: CASE,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 52,
      metal: 1,
      f: (P, F, g) => caseDoor(P, F, g),
      s: (P, F, g) => caseSide(P, F, g),
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 5, R[2]);
        P.r(F.x + 4, F.y + 8, F.w - 8, 18, "#2a2c30");
        for (let y = F.y + 9; y < F.y + 26; y += 2) P.r(F.x + 5, y, F.w - 10, 1, "#5a5e64");
        R2.cord(P, F.x + F.w - 6, F.y + 28, F.h - 32);
        P.r(F.x + 4, F.y + 30, 7, 4, "#e8e4d8").r(F.x + 5, F.y + 31, 5, 1, "#8a8478");
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[3]);
        for (let k = 1; k < 5; k++) {
          const q = T.put(.15, k / 6, .7, .04);
          P.r(q.x, q.y, q.w, Math.max(1, q.h), R[1]);
        }
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), 1, DUST);
      }
    }, {
      x: .2,
      y: .3,
      w: .32,
      d: .3,
      z: 52,
      hh: 4,
      col: W[3],
      nohit: 1,
      cond: v => v % 2 === 0,
      skipBox: true,
      all: (P, F) => lying(P, F.x, F.y + Math.max(0, F.h - 4), CAPS[3], LABS[2], 1, {
        empty: true
      }),
      t: () => {}
    } ]
  });
  for (const k of [ "waterPack", "waterBoxes", "bottleSack" ]) pileRot(k);
  A.defPropRot("bottleWall", {
    noRot: true
  });
  A.FOOT.waterPack = {
    x0: .06,
    x1: .94,
    d: .55
  };
  A.FOOT.waterBoxes = {
    x0: .05,
    x1: .95,
    d: .62
  };
  A.FOOT.bottleSack = {
    x0: .08,
    x1: .92,
    d: .4
  };
  A.FOOT.bottleWall = {
    none: true
  };
  A.PHYS.waterPallet = .85;
  A.PHYS.waterShelf = .45;
  A.PHYS.waterJugRack = .8;
  A.PHYS.waterCase = .65;
  A.PHYS.waterStand = .4;
  A.WATER = {
    bottle,
    lying,
    crushed,
    pack6,
    bottleRow,
    capGrid,
    CAPS,
    LABS,
    W,
    E
  };
})(window.SX);
