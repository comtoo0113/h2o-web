"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, PP = A.PP, R2 = A.ROT, sh = A.shade;
  const {box, sbox, grime, scratch, rust, txt, label, mini, drip} = PP;
  const def = A.defProp;
  const build = (kind, fw, fh, M) => {
    def(kind, fw, fh, 0, () => {}, {
      color: typeof M.col === "string" ? M.col : undefined
    });
    R2.build(kind, M);
  };
  const pick = (g, a) => a[g.i(a.length)];
  const rotG = (g, v, rot, k) => rot ? new SX.Rng(v * 131 + k + rot * 977) : g;
  const INK = "#2a2622", TAPE = "#d8c89a", DUCT = "#a4a8ac";
  const PAPER = [ "#e8e4d8", "#d8d2c0", "#f0ece0" ], BAG = [ "#26292e", "#2e3a52", "#2f4a33" ], CANS = [ "#c4392f", "#2a64b8", "#3a8a4a", "#d8a030" ];
  const MET = "#8e959c", WIRE = "#8e969e", CARD = "#a57c4f", PEDAL = [ "#7aa898", "#d8ccb0", "#b8483a" ], PBASE = "#4a4c52";
  function can(P, x, y, c) {
    const R = RP(c);
    P.r(x, y, 4, 2, R[3]).p(x, y, R[5]).p(x + 3, y + 1, R[1]).p(x + 1, y + 1, R[2]).r(x + 4, y, 1, 2, "#b8bcc0").p(x + 2, y, "#e8e4d8");
  }
  function paperBall(P, x, y, c) {
    const R = RP(c || PAPER[0]);
    P.r(x, y + 1, 4, 2, R[3]).r(x + 1, y, 2, 1, R[4]).p(x, y + 1, R[5]).p(x + 3, y + 2, R[1]).p(x + 2, y + 1, R[2]).p(x + 1, y + 2, R[4]);
  }
  function butt(P, x, y) {
    P.r(x, y, 2, 1, "#e8e4d8").p(x + 2, y, "#c8803a");
  }
  function peel(P, x, y) {
    P.r(x + 1, y, 3, 1, "#e8c040").p(x, y + 1, "#d8b030").p(x + 4, y + 1, "#d8b030").r(x + 1, y + 1, 3, 1, "#f0e0a0").p(x + 2, y, "#6a4a1e");
  }
  function bagBlob(P, cx, cy, rx, ry, c) {
    const R = RP(c);
    P.ball(cx, cy, rx, ry, c);
    P.line(cx - rx + 1, cy, cx - 1, cy + ry - 1, R[1]).p(cx - rx + 2, cy - ry + 2, R[5]).p(cx + 1, cy - 1, R[2]);
  }
  function bagKnot(P, cx, y, c) {
    const R = RP(c);
    P.r(cx - 1, y + 1, 3, 2, R[3]).p(cx - 2, y, R[4]).p(cx + 2, y, R[3]).p(cx - 1, y + 1, R[5]).p(cx, y + 3, R[1]);
  }
  function cylBody(P, x, top, wd, ht, e, hex) {
    const R = RP(hex), rx = wd / 2;
    const cv = i => {
      const dx = (i + .5 - rx) / rx;
      return Math.sqrt(Math.max(0, 1 - dx * dx));
    };
    const k = i => {
      const t = (i + .5) / wd;
      return t < .1 ? 3 : t < .28 ? 5 : t < .45 ? 4 : t < .7 ? 3 : t < .88 ? 2 : 1;
    };
    const at = (i, y) => Math.round(y + e / 2 * cv(i)), bot = i => at(i, top + ht - e / 2);
    for (let i = 0; i < wd; i++) {
      const y0 = at(i, top);
      P.r(x + i, y0, 1, bot(i) - y0 + 1, R[k(i)]);
    }
    return {
      R,
      at,
      k,
      bot
    };
  }
  function band(P, x, wd, y, S, up, dn, Rr) {
    const R = Rr || S.R;
    for (let i = 0; i < wd; i++) {
      const yy = S.at(i, y), k = S.k(i);
      if (up != null) P.p(x + i, yy, R[Math.min(5, k + up)]);
      if (dn != null) P.p(x + i, yy + 1, R[Math.max(0, k - dn)]);
    }
  }
  function metalBin(P, w, h, up, g0, v, col, rot) {
    const B = h - 2, r = rot | 0, g = rotG(g0, v, r, 11), side = (r & 1) === 1, s = r === 0 || r === 3 ? 1 : -1;
    const x = 7, wd = 19, cx = 16, e = 6, top = B - 25;
    P.shadow(16, B - 1, 12, 3, .45);
    const S = cylBody(P, x, top, wd, 25, e, MET), R = S.R;
    band(P, x, wd, top + 1, S, 1, 1);
    for (const yy of [ top + 7, top + 13, top + 19 ]) band(P, x, wd, yy, S, 1, 2);
    for (let i = 0; i < wd; i++) {
      const yb = S.bot(i);
      P.p(x + i, yb - 1, R[Math.max(0, S.k(i) - 1)]);
    }
    if (!side) {
      P.r(x - 2, top + 4, 2, 1, R[4]).r(x - 3, top + 4, 1, 4, R[3]).r(x - 2, top + 7, 2, 1, R[2]);
      P.r(x + wd, top + 4, 2, 1, R[2]).r(x + wd + 2, top + 4, 1, 4, R[1]).r(x + wd, top + 7, 2, 1, R[1]);
    } else {
      P.r(cx - 3, top + 4, 7, 1, R[5]).r(cx - 3, top + 5, 7, 1, R[1]).r(cx - 4, top + 3, 1, 3, R[2]).r(cx + 4, top + 3, 1, 3, R[1]);
    }
    const dent = (i, dy) => {
      const yy = S.at(i, top + dy), k = S.k(i), dk = R[Math.max(0, k - 2)], lt = R[Math.min(5, k + 1)];
      P.p(x + i, yy, dk).p(x + i + 1, yy, dk).p(x + i - 1, yy + 1, R[Math.max(0, k - 1)]).p(x + i + 2, yy + 1, lt).p(x + i, yy + 2, lt).p(x + i + 1, yy + 2, lt);
    };
    for (const [i, dy] of [ [ [ 3, 15 ] ], [ [ 13, 9 ], [ 4, 16 ] ], [ [ 6, 9 ], [ 12, 16 ] ], [ [ 4, 16 ] ] ][r]) dent(i, dy);
    rust(P, x + 1, B - 5, wd - 2, 4, g, 5);
    rust(P, x + 2, top + 13, wd - 4, 3, g, 1);
    drip(P, x + 3 + g.i(12), top + 15, 3 + g.i(3), "rgba(110,55,25,0.5)");
    if (r === 0) {
      mini(P, cx - 6, top + 8, "102", "#dcd8c8");
      for (let k = 0; k < 3; k++) {
        const i = 4 + g.i(11), yy = top + 8 + g.i(5);
        P.p(x + i, yy, R[S.k(i)]);
      }
      P.r(x + 11, top + 15, 6, 4, "#ece6d2").r(x + 11, top + 15, 6, 1, "#c83a34").p(x + 12, top + 17, "#c83a34").p(x + 15, top + 17, "#c83a34").r(x + 13, top + 17, 2, 1, INK).r(x + 12, top + 18, 4, 1, "#c8c0a8");
    } else if (r === 2) {
      P.r(x + 9, top + 8, 6, 4, DUCT).r(x + 9, top + 8, 6, 1, "#c8ccd0").r(x + 9, top + 11, 6, 1, "#7a7e84").p(x + 10, top + 9, "#d8dce0").p(x + 13, top + 10, "#8a8e94");
      scratch(P, x + 2, top + 3, wd - 4, 15, g, 4, R[5]);
    } else {
      P.line(cx - 3, top + 8, cx + 2, top + 12, "#d8d4c8").line(cx + 2, top + 8, cx - 3, top + 12, "#d8d4c8");
      P.r(x + (r === 1 ? 2 : 13), top + 15, 4, 2, "#e8c040").p(x + (r === 1 ? 2 : 13), top + 16, "#b89020");
    }
    P.oval(cx, top, 9, 3, R[4]);
    P.oval(cx, top, 8, 2, "#17181b");
    const lx = cx - s * 4, ly = top - 3;
    P.oval(lx, ly + 1, 9, 3, R[1]);
    P.oval(lx, ly, 9, 3, R[3]);
    for (let i = -8; i <= 8; i++) {
      const yy = ly + Math.round(2.2 * Math.sqrt(Math.max(0, 1 - i / 8.5 * (i / 8.5))));
      P.p(lx + i, yy, i < -3 ? R[4] : R[2]);
    }
    P.oval(lx, ly - 1, 5, 2, R[4]);
    P.r(lx - 4, ly - 2, 3, 1, R[5]);
    P.r(lx - 3, ly - 4, 7, 1, R[5]).r(lx - 3, ly - 3, 7, 1, R[1]).p(lx - 3, ly - 3, R[2]).p(lx + 3, ly - 3, R[2]);
    rust(P, lx - 6, ly - 1, 12, 3, g, 2);
    const bc = BAG[v % 3], bx = cx + s * 6;
    bagBlob(P, bx, top - 2, 4, 3, bc);
    bagKnot(P, bx, top - 7, bc);
    P.r(bx - s * 3 - 1, top - 3, 3, 2, "#e8e4d8").p(bx - s * 3, top - 4, "#f4f0e4");
    P.r(bx + s * 2 - (s < 0 ? 1 : 0), top, 2, 2, "#c4392f").p(bx + s * 2 - (s < 0 ? 1 : 0), top, "#e86a5a");
    can(P, s > 0 ? 25 : 2, B - 1, pick(g, CANS));
    paperBall(P, s > 0 ? 2 : 26, B - 3);
    butt(P, 11 + g.i(9), B);
  }
  def("binMetal", 1, 1, 10, metalBin);
  function pedalBin(P, w, h, up, g0, v, col, rot) {
    const B = h - 2, r = rot | 0, g = rotG(g0, v, r, 13), hex = col || PEDAL[v % 3], D = RP(PBASE);
    const x = 9, wd = 15, cx = 16, e = 5, top = B - 18;
    P.shadow(16, B - 1, 10, 3, .42);
    const S = cylBody(P, x, top, wd, 18, e, hex), L = S.R;
    for (let i = 0; i < wd; i++) {
      const yb = S.bot(i), k = S.k(i);
      P.r(x + i, yb - 2, 1, 3, D[Math.max(0, k - 1)]).p(x + i, yb - 2, D[Math.min(5, k + 1)]);
    }
    if (r === 0) P.r(cx - 3, B - 1, 7, 2, D[2]).r(cx - 3, B - 1, 7, 1, D[4]).p(cx - 3, B - 1, D[5]).p(cx + 3, B, D[1]); else if (r === 1) P.r(x + wd, B - 3, 3, 2, D[3]).r(x + wd, B - 3, 3, 1, D[4]).p(x + wd + 2, B - 2, D[1]); else if (r === 3) P.r(x - 3, B - 3, 3, 2, D[3]).r(x - 3, B - 3, 3, 1, D[5]);
    for (let i = 0; i < wd; i++) {
      const yy = S.at(i, top + 1), n = 2 + ((i * 7 + v * 3) % 5 === 0 ? 1 : 0), k = S.k(i);
      P.r(x + i, yy, 1, n, k >= 4 ? "#f4f4ee" : k <= 1 ? "#a8aca8" : "#dcdeda");
    }
    if (r === 0) {
      P.oval(cx + 3, top + 9, 2, 2, "#f0d040");
      P.p(cx + 2, top + 8, INK).p(cx + 4, top + 8, INK).r(cx + 2, top + 10, 3, 1, INK).p(cx + 1, top + 8, "#f8e888");
    } else if (r === 2) mini(P, cx - 3, top + 7, "PP", L[1]); else {
      const tx = r === 1 ? x + 3 : x + 8;
      P.line(tx, top + 5, tx + 2, top + 11, L[1]);
      P.r(tx - 1, top + 6, 5, 2, "#ece8da").p(tx - 1, top + 6, "#f8f4ea");
    }
    scratch(P, x + 1, top + 3, wd - 2, 10, g, 3, L[5]);
    grime(P, x + 1, top + 11, wd - 2, 3, g, 3, "rgba(60,50,30,0.18)");
    P.oval(cx, top - 1, 8, 3, L[1]);
    P.oval(cx, top - 2, 8, 3, L[4]);
    P.oval(cx - 1, top - 3, 5, 1, L[5]);
    for (let i = -7; i <= 7; i++) P.p(cx + i, top - 2 + Math.round(2.4 * Math.sqrt(Math.max(0, 1 - i / 7.5 * (i / 7.5)))), i < -2 ? L[3] : L[2]);
    if (r === 2) P.r(cx - 3, top + 1, 7, 2, D[2]).r(cx - 3, top + 1, 7, 1, D[4]).p(cx - 2, top + 2, D[0]).p(cx + 2, top + 2, D[0]); else {
      P.r(cx + 1, top + 2, 3, 2, "#f4f4ee").p(cx + 2, top + 3, "#d8d8d0").p(cx + 4, top + 2, "#e8e8e2");
    }
    paperBall(P, r === 1 ? 2 : 25, B - 2, "#f4f4ee");
    peel(P, r === 1 ? 24 : 2, B - 1);
  }
  def("binPedal", 1, 1, 4, pedalBin);
  function meshBin(P, w, h, up, g0, v, col, rot) {
    const B = h - 2, r = rot | 0, g = rotG(g0, v, r, 17), Wr = RP(WIRE), bag = v % 2 ? "#4a6a98" : "#30343c", G = RP(bag);
    const x = 8, wd = 17, cx = 16, e = 5, top = B - 17, s = r === 0 || r === 3 ? 1 : -1;
    P.shadow(16, B - 1, 11, 3, .4);
    const S = cylBody(P, x, top, wd, 17, e, sh(bag, -.2));
    for (let k = 0; k < 8; k++) {
      const i = 2 + g.i(wd - 5), yy = S.at(i, top + 4 + g.i(9));
      P.r(x + i, yy, 3, 2, pick(g, [ "#c8c4b8", "#b8b4a8", "#a8804e", "#b85a48", "#d8d4c8" ]));
    }
    for (let i = 0; i < wd; i++) {
      const y0 = S.at(i, top) + 2, y1 = S.bot(i) - 1, k = S.k(i), X = x + i;
      for (let yy = y0; yy < y1; yy++) if ((X + yy) % 6 === 0 || (X - yy + 600) % 6 === 0) P.p(X, yy, Wr[Math.min(5, k + 1)]);
    }
    for (const i of [ 0, 5, 11, 16 ]) for (let yy = S.at(i, top) + 1; yy <= S.bot(i); yy++) P.p(x + i, yy, Wr[Math.min(5, S.k(i) + (i === 5 ? 2 : 1))]);
    for (let i = 0; i < wd; i++) {
      const yb = S.bot(i), k = S.k(i);
      P.p(x + i, yb, Wr[Math.max(0, k - 1)]).p(x + i, yb - 1, Wr[Math.min(5, k + 1)]);
    }
    if (r === 2) {
      for (const [i, dy] of [ [ 6, 9 ], [ 7, 10 ], [ 7, 9 ] ]) P.p(x + i, S.at(i, top + dy), G[1]);
    }
    P.oval(cx, top, 8, 2, Wr[4]);
    P.oval(cx, top, 7, 1, "#1a1b1e");
    paperBall(P, cx - 5, top - 3);
    paperBall(P, cx - 1, top - 2, PAPER[1]);
    P.r(cx + 2, top - 6, 3, 5, "#f0ece0").r(cx + 2, top - 4, 3, 2, "#8a5a3a").p(cx + 2, top - 6, "#ffffff").r(cx + 2, top - 7, 3, 1, "#d8d4c8");
    P.r(cx - 2, top - 5, 2, 3, "#d83a2a").p(cx - 2, top - 5, "#f0c040").p(cx - 1, top - 3, "#9a2a1e");
    for (let i = 0; i < wd; i++) {
      const yy = S.at(i, top + 1), n = 2 + ((i * 3 + v) % 4 === 0 ? 1 : 0) + (i % 5 === 2 ? 1 : 0), k = S.k(i);
      P.r(x + i, yy, 1, n, G[Math.min(5, k)]);
      P.p(x + i, yy + n - 1, G[Math.max(0, k - 1)]);
    }
    const ex = s > 0 ? x + wd : x - 1;
    P.poly([ [ ex, top ], [ ex + s * 2, top - 2 ], [ ex + s * 2, top + 1 ], [ ex, top + 3 ] ], G[4]);
    P.p(ex + s, top - 1, G[5]).p(ex + s, top + 2, G[2]);
    if (r === 0) {
      P.r(x + 3, top + 7, 4, 4, "#f0e060").r(x + 3, top + 7, 4, 1, "#f8f0a0").r(x + 4, top + 8, 2, 1, INK).p(x + 4, top + 9, "#c83a34");
    }
    paperBall(P, s > 0 ? 25 : 3, B - 3);
    paperBall(P, s > 0 ? 21 : 7, B - 1, "#f0e060");
    butt(P, 12 + g.i(8), B);
  }
  def("binMesh", 1, 1, 2, meshBin);
  function boxBin(P, w, h, up, g0, v, col, rot) {
    const B = h - 2, r = rot | 0, g = rotG(g0, v, r, 19), C = RP(CARD), bc = BAG[(v + 1) % 3], G = RP(bc), s = r === 0 || r === 3 ? 1 : -1;
    const x = 5, bw = 22, t = 7, f = 15, y = B - t - f;
    sbox(P, x - 1, B - 3, bw + 2, 5, .42);
    P.poly([ [ x + 2, y + 1 ], [ x + 3, y - 6 ], [ x + bw - 4, y - 7 ], [ x + bw - 2, y + 1 ] ], C[2]);
    P.line(x + 3, y - 6, x + bw - 4, y - 7, C[4]);
    P.line(x + 8, y - 5, x + 10, y - 2, C[1]);
    box(P, x, y, bw, t, f, CARD, {
      fi: 3
    });
    P.r(x + 1, y + 1, bw - 2, t - 2, G[0]);
    bagBlob(P, x + (s > 0 ? 7 : 14), y + 1, 5, 4, bc);
    bagKnot(P, x + (s > 0 ? 7 : 14), y - 6, bc);
    P.r(x + (s > 0 ? 15 : 3), y - 1, 4, 3, "#f0ece0").r(x + (s > 0 ? 15 : 3), y - 1, 4, 1, "#c83a34").p(x + (s > 0 ? 16 : 4), y + 1, "#c8c0a8");
    paperBall(P, x + 11, y - 2);
    P.r(x + (s > 0 ? 19 : 2), y - 5, 2, 6, "#3f8a4a").p(x + (s > 0 ? 19 : 2), y - 5, "#9ac89a").r(x + (s > 0 ? 19 : 2), y - 6, 2, 1, "#c8c0a8");
    P.r(x + 4, y + 2, 3, 2, "#2a64b8").p(x + 4, y + 2, "#6a9ae8");
    P.r(x, y, bw, 1, G[3]);
    P.r(x, y, 1, t, G[3]);
    P.r(x + bw - 1, y, 1, t, G[1]);
    for (let i = 0; i < bw; i++) {
      const d = 2 + ((i * 5 + v) % 4 === 0 ? 2 : i % 3 === 1 ? 1 : 0);
      P.r(x + i, y + t - 1, 1, d, i === 0 ? G[3] : i % 7 === 3 ? G[4] : G[2]);
      P.p(x + i, y + t - 2 + d, G[1]);
    }
    const fl = (sx, long) => {
      const ox = sx > 0 ? x + bw : x - 1, L = long ? 4 : 2;
      P.poly([ [ ox, y + t ], [ ox + sx * L, y + t - 3 ], [ ox + sx * L, y - 2 ], [ ox, y + 1 ] ], long ? C[4] : C[3]);
      P.line(ox + sx * L, y - 2, ox + sx * L, y + t - 3, C[2]);
    };
    fl(-1, s > 0);
    fl(1, s < 0);
    const fy = y + t;
    if (r === 0) {
      P.r(x + 1, fy + 4, bw - 2, 9, "#e4dcc4").r(x + 1, fy + 4, bw - 2, 1, "#f0ead8").r(x + 1, fy + 12, bw - 2, 1, "#c4b898").p(x + 1, fy + 4, "#c4b898").p(x + bw - 2, fy + 12, "#a89878");
      label(P, x, fy + 5, "쓰레기", INK, 7, bw);
    } else if (r === 1) {
      P.oval(x + 6, fy + 9, 3, 3, "#c83a34");
      P.oval(x + 6, fy + 9, 1, 1, "#f0e0c0");
      txt(P, x + 11, fy + 7, 9, "#c83a34", g);
      txt(P, x + 11, fy + 9, 7, "#6a5a44", g);
      txt(P, x + 11, fy + 11, 8, "#6a5a44", g);
    } else if (r === 2) {
      P.r(x + 4, fy + 5, 11, 8, "#ece8da").r(x + 4, fy + 5, 11, 1, "#faf8ee").r(x + 14, fy + 6, 1, 7, "#c8c2ae");
      for (let k = 0; k < 2; k++) txt(P, x + 5, fy + 7 + k * 2, 8, "#6a6458", g);
      for (let i = 0; i < 9; i++) if (g.chance(.6)) P.r(x + 5 + i, fy + 11, 1, 1, INK);
    } else {
      for (const ax of [ x + 4, x + 8 ]) {
        P.r(ax, fy + 7, 1, 5, C[1]).p(ax - 1, fy + 8, C[1]).p(ax + 1, fy + 8, C[1]);
      }
      P.r(x + 13, fy + 6, 5, 5, "#c83a34").r(x + 14, fy + 7, 3, 3, "#f0e0d0").p(x + 15, fy + 8, "#c83a34");
    }
    P.r(x + (s > 0 ? bw - 5 : 2), fy + 2, 3, 3, TAPE).p(x + (s > 0 ? bw - 5 : 2), fy + 2, "#e8dcb4").p(x + (s > 0 ? bw - 3 : 4), fy + 5, "#b8a878");
    P.p(x + bw - 1, fy, C[1]).p(x + bw - 2, fy + 1, C[2]).p(x + bw - 1, fy + 1, C[1]);
    P.r(x + 1, B - 5, bw - 2, 4, "rgba(60,40,20,0.3)");
    grime(P, x + 1, fy + 1, bw - 2, f - 2, g, 4, "rgba(70,50,30,0.2)");
    paperBall(P, s > 0 ? 27 : 1, B - 2);
    can(P, s > 0 ? 1 : 26, B, pick(g, CANS));
  }
  def("binBox", 1, 1, 6, boxBin);
  const RECY = [ [ "종이", "#2f62a8" ], [ "캔", "#c89a2a" ], [ "병", "#3a8a4a" ], [ "비닐", "#c8642a" ] ];
  function picto(P, x, y, k) {
    if (k === 0) {
      P.r(x, y, 6, 5, "#f0ece0").r(x, y, 6, 1, "#ffffff").r(x + 1, y + 2, 4, 1, "#9a968c").r(x + 1, y + 3, 3, 1, "#9a968c");
    } else if (k === 1) {
      P.r(x + 1, y, 4, 6, "#c8ccd0").r(x + 1, y, 1, 6, "#eef0f2").r(x + 4, y, 1, 6, "#8a8e94").r(x + 1, y + 2, 4, 2, "#c4392f");
    } else if (k === 2) {
      P.r(x + 2, y, 2, 2, "#2a5a32").r(x + 1, y + 2, 4, 4, "#3f8a4a").p(x + 1, y + 2, "#7ac08a");
    } else {
      P.poly([ [ x, y + 1 ], [ x + 6, y + 1 ], [ x + 5, y + 6 ], [ x + 1, y + 6 ] ], "#e8eae4");
      P.r(x + 1, y, 1, 2, "#e8eae4").r(x + 4, y, 1, 2, "#e8eae4").p(x + 2, y + 3, "#b8bcb4");
    }
  }
  const recyBin = k => ({
    x: .012 + k * .247,
    y: .1,
    w: .235,
    d: .8,
    z: 2,
    hh: 24,
    col: RECY[k][1],
    f: (P, F, g) => {
      const R = F.R;
      P.r(F.x + 1, F.y + 3, F.w - 2, 9, "#ece8dc").r(F.x + 1, F.y + 3, F.w - 2, 1, "#faf8f0").r(F.x + 1, F.y + 11, F.w - 2, 1, "#b8b2a0");
      label(P, F.x, F.y + 4, RECY[k][0], R[0], 7, F.w);
      picto(P, F.x + Math.floor(F.w / 2) - 3, F.y + 14, k);
      scratch(P, F.x + 1, F.y + 13, F.w - 2, F.h - 15, g, 2, R[4]);
      grime(P, F.x + 1, F.y + F.h - 5, F.w - 2, 4, g, 3, "rgba(40,30,18,0.2)");
      if (k === 2) P.r(F.x + 1, F.y + F.h - 9, 4, 3, "#f0d040").p(F.x + 2, F.y + F.h - 8, "#c83a34");
    },
    s: (P, F, g) => {
      const R = F.R;
      for (let yy = F.y + 6; yy < F.y + F.h - 3; yy += 5) P.r(F.x + 1, yy, F.w - 2, 1, R[2]);
      P.r(F.x + 2, F.y + 3, Math.max(1, F.w - 4), 2, R[1]);
      grime(P, F.x + 1, F.y + F.h - 5, F.w - 2, 4, g, 2, "rgba(40,30,18,0.2)");
    },
    b: (P, F, g) => {
      const R = F.R;
      for (let yy = F.y + 6; yy < F.y + F.h - 3; yy += 5) P.r(F.x + 1, yy, F.w - 2, 1, R[2]);
      if (k === 1) P.r(F.x + 3, F.y + 8, Math.min(6, F.w - 4), 4, "#e8e4d8");
    },
    t: () => {}
  });
  const recyLid = k => ({
    x: .006 + k * .247,
    y: .07,
    w: .247,
    d: .86,
    z: 26,
    hh: 2,
    col: sh(RECY[k][1], -.2),
    f: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y, F.w, 1, R[4]);
    },
    s: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y, F.w, 1, R[4]);
    },
    b: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y, F.w, 1, R[3]);
    },
    t: (P, T) => {
      const R = T.R, q = T.put(.25, .3, .5, .36);
      if (k === 0) {
        const m = T.put(.18, .44, .64, .12);
        P.r(m.x, m.y, m.w, m.h, "#141518");
        P.r(m.x, m.y + m.h, m.w, 1, R[4]);
      } else if (k === 3) {
        P.r(q.x, q.y, q.w, q.h, R[1]);
        P.r(q.x, q.y, q.w, 1, R[0]);
        P.p(q.x + Math.floor(q.w / 2), q.y + q.h - 1, R[5]);
      } else {
        P.oval(q.x + Math.floor(q.w / 2), q.y + Math.floor(q.h / 2), Math.max(1, Math.floor(q.w / 2) - 1), Math.max(1, Math.floor(q.h / 2)), "#141518");
      }
      P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), 1, R[4]);
    }
  });
  build("binRecycle", 2, 1, {
    front: true,
    pad: 2,
    tpu: 12,
    sh: .45,
    col: "#3a3d42",
    parts: [ {
      x: 0,
      y: .05,
      w: 1,
      d: .9,
      z: 0,
      hh: 2,
      metal: 1,
      col: "#3a3d42"
    }, recyBin(0), recyBin(1), recyBin(2), recyBin(3), recyLid(0), recyLid(1), recyLid(2), recyLid(3), {
      x: .05,
      y: .46,
      w: .15,
      d: .04,
      z: 28,
      hh: 7,
      col: CARD,
      nohit: 1,
      noTop: 1,
      all: (P, F, g) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, F.h, R[3]);
        P.r(F.x, F.y, F.w, 1, R[4]);
        if (F.w > 4) {
          P.r(F.x + 1, F.y + 2, F.w - 2, 1, "#c83a34");
          txt(P, F.x + 1, F.y + 4, F.w - 2, R[1], g);
        }
      }
    }, {
      x: .6,
      y: .42,
      w: .05,
      d: .08,
      z: 28,
      hh: 9,
      col: "#3f8a4a",
      nohit: 1,
      skipBox: true,
      all: (P, F) => {
        const cx = F.x + Math.floor(F.w / 2);
        P.r(cx - 1, F.y + 3, 3, F.h - 3, "#3f8a4a").p(cx - 1, F.y + 3, "#7ac08a").r(cx - 1, F.y + 5, 3, 2, "#e8e4d8").r(cx, F.y, 1, 3, "#2a6a3a").p(cx, F.y, "#c8c0a8");
      }
    }, {
      x: .79,
      y: .3,
      w: .14,
      d: .36,
      z: 28,
      hh: 4,
      col: "#e8eae4",
      nohit: 1,
      skipBox: true,
      all: (P, F) => {
        const cx = F.x + Math.floor(F.w / 2), cy = F.y + Math.floor(F.h / 2);
        P.ball(cx, cy, Math.max(2, Math.floor(F.w / 2)), 3, "#e0e2dc");
        P.p(cx - 1, cy - 2, "#ffffff").p(cx + 2, cy + 1, "#a8aca4");
      }
    }, {
      x: .32,
      y: .55,
      w: .08,
      d: .2,
      z: 28,
      hh: 2,
      col: "#c4392f",
      nohit: 1,
      skipBox: true,
      all: (P, F) => {
        P.r(F.x, F.y, 5, 2, "#c4392f").p(F.x, F.y, "#e86a5a").r(F.x + 4, F.y, 1, 2, "#b8bcc0");
      },
      t: () => {}
    } ],
    after: (P, G, g, v) => {
      const B = G.B;
      can(P, G.pad + 3 + g.i(6), B, pick(g, CANS));
      paperBall(P, G.pad + 44 + g.i(8), B - 1);
      butt(P, G.pad + 24 + g.i(8), B + 1);
    }
  });
  const WHL = "#232529";
  const caster = (x, y) => ({
    x,
    y,
    w: .09,
    d: .14,
    z: 0,
    hh: 5,
    col: WHL,
    nohit: 0,
    all: (P, F) => {
      const R = F.R;
      P.r(F.x, F.y + 1, F.w, F.h - 1, R[2]);
      P.r(F.x, F.y, F.w, 1, "#5a5e64");
      if (F.w > 3) P.r(F.x + Math.floor(F.w / 2) - 1, F.y + 2, 2, 2, "#8a8e94");
    }
  });
  function wheelieFront(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x, y, w, 3, R[4]).r(x, y, w, 1, R[5]).r(x, y + 3, w, 1, R[1]);
    for (let k = 1; k < 8; k++) {
      const xx = x + Math.round(k * w / 8);
      P.r(xx, y + 16, 1, h - 21, R[2]);
      P.r(xx + 1, y + 16, 1, h - 21, R[4]);
    }
    label(P, x, y + 5, "생활쓰레기", "#e4e0d0", 7, w);
    for (let k = 0; k < 3; k++) P.p(x + 8 + g.i(w - 16), y + 7 + g.i(4), R[3]);
    mini(P, x + w - 18, y + h - 10, "660L", R[1]);
    for (let xx = x + 2; xx < x + w - 2; xx++) P.r(xx, y + h - 4, 1, 2, (xx - x >> 1) % 2 ? "#e8c040" : "#2a2a2a");
    P.r(x + 4, y + 16, 8, 6, "#f0ece0").r(x + 4, y + 16, 8, 1, "#c83a34").r(x + 5, y + 18, 6, 1, INK).r(x + 5, y + 20, 4, 1, "#9a968c");
    P.line(x + 16, y + 20, x + 19, y + 17, "#d84a8a").line(x + 19, y + 17, x + 21, y + 21, "#d84a8a").line(x + 21, y + 21, x + 24, y + 18, "#d84a8a");
    scratch(P, x + 2, y + 4, w - 4, h - 8, g, 6, R[5]);
    grime(P, x + 1, y + h - 8, w - 2, 6, g, 6, "rgba(40,30,18,0.22)");
    P.p(x + w - 8, y + 12, R[1]).p(x + w - 7, y + 12, R[1]).p(x + w - 9, y + 13, R[2]).p(x + w - 6, y + 13, R[5]).p(x + w - 8, y + 14, R[5]);
  }
  function wheelieSide(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x, y, w, 3, R[4]).r(x, y, w, 1, R[5]).r(x, y + 3, w, 1, R[1]);
    P.r(x + 3, y + 6, Math.max(1, w - 6), 3, R[0]).r(x + 3, y + 6, Math.max(1, w - 6), 1, R[1]);
    for (let k = 1; k < 4; k++) {
      const xx = x + Math.round(k * w / 4);
      P.r(xx, y + 12, 1, h - 16, R[2]);
    }
    if (w >= 18) mini(P, x + 3, y + h - 9, "660L", R[1]);
    grime(P, x + 1, y + h - 7, w - 2, 5, g, 4, "rgba(40,30,18,0.22)");
    scratch(P, x + 1, y + 10, w - 2, h - 14, g, 3, R[5]);
  }
  function wheelieBack(P, F, g) {
    const R = F.R, x = F.x, y = F.y, w = F.w, h = F.h;
    P.r(x, y, w, 3, R[3]).r(x, y + 3, w, 1, R[1]);
    for (let k = 1; k < 6; k++) {
      const xx = x + Math.round(k * w / 6);
      P.r(xx, y + 6, 1, h - 10, R[2]);
    }
    P.r(x + 6, y + 9, 10, 6, "#e8e4d8").r(x + 6, y + 9, 10, 1, "#faf8ee");
    for (let i = 0; i < 8; i++) if (g.chance(.6)) P.r(x + 7 + i, y + 12, 1, 2, INK);
    grime(P, x + 1, y + h - 7, w - 2, 5, g, 5, "rgba(40,30,18,0.22)");
  }
  function bagsGap(P, F, g) {
    const c = BAG[g.i(3)], R = RP(c);
    P.r(F.x, F.y, F.w, F.h, R[1]);
    for (let xx = F.x + 2; xx < F.x + F.w - 2; xx += 5 + g.i(4)) {
      const cc = pick(g, BAG);
      P.ball(xx + 2, F.y + Math.floor(F.h / 2), 3, 2, cc);
      P.p(xx + 1, F.y, RP(cc)[5]);
    }
    if (F.w > 20) {
      P.r(F.x + Math.floor(F.w * .6), F.y, 4, 2, "#e8e4d8");
      P.r(F.x + Math.floor(F.w * .3), F.y + 1, 3, 2, "#c4392f");
    }
  }
  build("binWheelie", 2, 1, {
    front: true,
    pad: 2,
    tpu: 13,
    sh: .5,
    col: (c, v) => c || [ "#4a6a4e", "#55595e" ][v % 2],
    parts: [ caster(.04, .1), caster(.87, .1), caster(.04, .76), caster(.87, .76), {
      x: .02,
      y: .06,
      w: .96,
      d: .86,
      z: 5,
      hh: 30,
      f: wheelieFront,
      s: wheelieSide,
      b: wheelieBack,
      t: () => {}
    }, {
      x: .06,
      y: 0,
      w: .88,
      d: .05,
      z: 28,
      hh: 3,
      nohit: 1,
      col: b => sh(b, -.3),
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]);
      }
    }, {
      x: .04,
      y: .1,
      w: .92,
      d: .78,
      z: 35,
      hh: 3,
      nohit: 1,
      skipBox: true,
      all: bagsGap,
      t: () => {}
    }, {
      x: 0,
      y: .03,
      w: 1,
      d: .93,
      z: 38,
      hh: 3,
      col: b => sh(b, -.14),
      f: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[4]);
        for (const t of [ .22, .72 ]) P.r(F.x + Math.round(F.w * t), F.y + 1, 6, 1, R[0]);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[4]);
      },
      b: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[3]);
        for (const t of [ .2, .7 ]) P.r(F.x + Math.round(F.w * t), F.y + 1, 4, 2, R[1]);
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[3]);
        P.r(T.x, T.y, T.w, 1, R[4]);
        const m = T.put(.497, 0, .006, 1);
        P.r(m.x, m.y, Math.max(1, m.w), m.h, R[1]);
        for (const u of [ .12, .3, .62, .8 ]) {
          const q = T.put(u, .15, .03, .7);
          P.r(q.x, q.y, Math.max(1, q.w), Math.max(1, q.h), R[2]);
        }
        for (let k = 0; k < 4; k++) {
          const q = T.put(.1 + g.f() * .8, .2 + g.f() * .6, .02, .06);
          P.p(q.x, q.y, "#e8e4d8");
        }
        const c = T.put(.66, .4, .08, .2);
        P.r(c.x, c.y, Math.max(3, c.w), 2, "#2a64b8").p(c.x, c.y, "#6a9ae8");
      }
    } ],
    after: (P, G, g, v) => {
      const B = G.B, bc = pick(g, BAG);
      bagBlob(P, G.pad + 5, B - 3, 5, 3, bc);
      bagKnot(P, G.pad + 6, B - 9, bc);
      can(P, G.pad + 48 + g.i(6), B, pick(g, CANS));
      P.oval(G.pad + 30, B, 5, 1, "rgba(50,40,20,0.3)");
    }
  });
  for (const k of [ "binMetal", "binPedal", "binMesh", "binBox" ]) {
    const f = A.propDef(k).draw;
    A.defPropRot(k, {
      draw: {
        1: f,
        2: f,
        3: f
      }
    });
  }
  A.FOOT.binMetal = {
    x0: .22,
    x1: .81,
    d: .22
  };
  A.FOOT.binPedal = {
    x0: .28,
    x1: .75,
    d: .22
  };
  A.FOOT.binMesh = {
    x0: .25,
    x1: .78,
    d: .22
  };
  A.FOOT.binBox = {
    x0: .16,
    x1: .84,
    d: .24
  };
  const BASE = new Set([ "binBox", "binMesh", "binPedal", "binMetal", "binRecycle", "binWheelie", "trash", "plant", "bigPlant" ]);
  const hit0 = A.propHit;
  A.propHit = function(kind, rot) {
    const h = hit0(kind, rot);
    if (!h || !BASE.has(kind) || h._base || !h.walk || !h.walk.length) return h;
    h._base = 1;
    h.rects = h.walk.map(q => Object.assign({}, q));
    h.x0 = Math.min(...h.rects.map(q => q.x0));
    h.y0 = Math.min(...h.rects.map(q => q.y0));
    h.x1 = Math.max(...h.rects.map(q => q.x1));
    h.y1 = Math.max(...h.rects.map(q => q.y1));
    return h;
  };
  A.PROP_MAT = A.PROP_MAT || {};
  Object.assign(A.PROP_MAT, {
    binMetal: "metal",
    binMesh: "metal",
    binPedal: "plastic",
    binBox: "plastic",
    binRecycle: "plastic",
    binWheelie: "plastic"
  });
  A.TRASHBIN = {
    can,
    paperBall,
    bagBlob,
    cylBody,
    RECY
  };
})(window.SX);
