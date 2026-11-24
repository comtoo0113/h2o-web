"use strict";

(function(SX) {
  const A = SX.art, sh = A.shade, mix = A.mix, RP = A.ramp, PP = A.PP;
  const {sbox, box, post, grain, vgrain, grime, rust, scratch, rivet, glass, label, mini, txt, screen, vgrad, hgrad, cut, drip} = PP;
  const def = (kind, fw, fh, up, fn, o) => {
    if (!A.propSize(kind)) A.defProp(kind, fw, fh, up, fn, o);
  };
  const rgba = (hex, a) => {
    const [r, g, b] = A.hexRgb(hex);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  };
  const AP = SX.artPlace = {
    KINDS: []
  };
  AP.INFO = {};
  const info = (kind, o) => {
    AP.INFO[kind] = o;
    AP.KINDS.push(kind);
    if (o.foot) A.FOOT[kind] = o.foot;
    if (o.phys) A.PHYS[kind] = o.phys;
    if (o.foot === undefined && o.solid === false) A.FOOT[kind] = {
      none: true
    };
  };
  A.PROP_MAT = A.PROP_MAT || {};
  const caster = (P, x, y) => {
    P.r(x, y, 3, 3, "#2a2c30").r(x, y, 3, 1, "#4a4e54").p(x + 1, y + 1, "#6a6e74");
  };
  const wheel = (P, cx, cy, r, tire, hub) => {
    P.ring(cx, cy, r, r, tire).ring(cx, cy, r - 1, r - 1, sh(tire, .15));
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.283;
      P.line(cx, cy, cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), hub);
    }
    P.p(cx, cy, sh(hub, .3));
  };
  def("wheelchair", 1, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, fr = "#9aa0a6", Rf = RP(fr), seat = v % 2 ? "#2e3440" : "#3a2e30", Rs = RP(seat);
    P.shadow(16, B - 2, 13, 3, .4);
    P.r(8, B - 40, 2, 16, Rf[3]).r(22, B - 40, 2, 16, Rf[3]).r(8, B - 41, 4, 2, "#2a2c30").r(20, B - 41, 4, 2, "#2a2c30");
    P.r(9, B - 38, 14, 9, Rs[3]).r(9, B - 38, 14, 1, Rs[4]).r(9, B - 30, 14, 1, Rs[1]);
    for (let x = 11; x < 22; x += 3) P.p(x, B - 34, Rs[2]);
    P.r(7, B - 26, 18, 6, Rs[3]).r(7, B - 26, 18, 1, Rs[5]).r(7, B - 21, 18, 1, Rs[1]);
    P.r(6, B - 28, 2, 8, Rf[4]).r(24, B - 28, 2, 8, Rf[2]).r(5, B - 28, 4, 1, Rf[5]).r(23, B - 28, 4, 1, Rf[3]);
    for (const cx of [ 5, 27 ]) {
      P.oval(cx, B - 12, 3, 9, "#24262a").oval(cx, B - 12, 2, 8, "#3a3e44");
      P.r(cx, B - 20, 1, 16, Rf[4]);
      P.p(cx, B - 12, Rf[5]);
    }
    P.r(9, B - 20, 1, 12, Rf[2]).r(22, B - 20, 1, 12, Rf[2]).r(10, B - 9, 12, 1, Rf[1]);
    P.r(10, B - 7, 4, 2, Rf[3]).r(18, B - 7, 4, 2, Rf[3]);
    caster(P, 10, B - 4);
    caster(P, 19, B - 4);
    if (v % 3 === 1) P.r(12, B - 25, 7, 3, "#c8c2ae").r(12, B - 25, 7, 1, "#e0dccc");
    scratch(P, 7, B - 28, 18, 8, g, 2, Rf[5]);
    rust(P, 9, B - 10, 14, 3, g, 2);
  });
  info("wheelchair", {
    solid: true,
    cover: .3,
    mat: "metal",
    foot: {
      x0: .08,
      x1: .92,
      d: .45
    }
  });
  def("privCurtain", 2, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, cl = [ "#9ab4a6", "#a6b4c4", "#c4bca6" ][v % 3], Rc = RP(cl), fr = "#a8aeb4", Rf = RP(fr);
    sbox(P, 1, B - 3, 62, 5, .32);
    for (const x of [ 3, 31, 59 ]) P.r(x, B - 60, 2, 56, Rf[3]).r(x, B - 60, 1, 56, Rf[5]);
    P.r(3, B - 61, 58, 2, Rf[4]).r(3, B - 61, 58, 1, Rf[5]);
    for (let x = 5; x < 59; x++) {
      if (x === 31 || x === 32) continue;
      const k = (x + (x > 31 ? 2 : 0)) % 6, c = k < 2 ? Rc[4] : k < 4 ? Rc[3] : Rc[2];
      P.r(x, B - 58, 1, 48, c);
    }
    P.r(5, B - 58, 54, 2, Rc[5]).r(5, B - 11, 54, 1, Rc[1]);
    for (let k = 0; k < 6; k++) P.p(6 + k * 9, B - 57, "#d8dcd8");
    grime(P, 5, B - 22, 54, 10, g, 10, "rgba(90,80,50,0.16)");
    if (v % 4 === 2) {
      P.line(44, B - 40, 48, B - 28, Rc[0]).line(45, B - 40, 49, B - 28, Rc[1]);
    }
    if (v % 4 === 3) P.oval(18, B - 30, 3, 2, "rgba(110,30,26,0.4)");
    for (const x of [ 2, 30, 58 ]) {
      P.r(x - 1, B - 6, 6, 2, Rf[2]);
      caster(P, x, B - 4);
    }
  });
  info("privCurtain", {
    tall: true,
    solid: true,
    cover: .08,
    mat: "fabric",
    foot: {
      x0: .03,
      x1: .97,
      d: .22
    }
  });
  def("medCart", 1, 1, 20, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#5a7aa0", "#8a9aa8", "#6a9a8a" ][v % 3], R = RP(c);
    sbox(P, 3, B - 3, 26, 5, .4);
    box(P, 4, B - 40, 24, 9, 30, c, {
      fi: 3
    });
    for (let k = 0; k < 3; k++) {
      const y = B - 30 + k * 9;
      P.r(5, y, 22, 8, R[3]).r(5, y, 22, 1, R[4]).r(5, y + 7, 22, 1, R[1]).r(12, y + 3, 8, 2, R[1]).r(12, y + 3, 8, 1, R[5]);
      P.r(6, y + 2, 4, 3, "#e8e4d8").p(7, y + 3, "#8a8474");
    }
    P.r(4, B - 41, 24, 1, "#b8bec4").r(4, B - 41, 1, 4, "#b8bec4").r(27, B - 41, 1, 4, "#b8bec4");
    P.r(7, B - 46, 3, 7, "#d8d4c8").r(7, B - 46, 3, 1, "#c83a34").r(11, B - 45, 3, 6, "#8a5a2a").r(11, B - 46, 3, 1, "#e8e4d8");
    P.r(16, B - 43, 9, 5, "#e8e8e0").r(16, B - 43, 9, 1, "#f8f8f0").r(17, B - 41, 5, 1, "#4a8ad0");
    P.r(15, B - 39, 6, 2, "#f0f0e8");
    for (const x of [ 4, 25 ]) caster(P, x, B - 4);
    scratch(P, 5, B - 30, 22, 26, g, 3, R[5]);
    grime(P, 5, B - 8, 22, 4, g, 4);
  });
  info("medCart", {
    solid: true,
    cover: .4,
    mat: "plastic",
    foot: {
      x0: .1,
      x1: .9,
      d: .5
    },
    open: "openFiling"
  });
  def("gurney", 2, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, fr = "#a8aeb4", Rf = RP(fr), m = v % 2 ? "#9ab4c0" : "#b8c0b4", Rm = RP(m);
    sbox(P, 2, B - 4, 60, 6, .36);
    P.r(4, B - 30, 56, 12, Rm[4]).r(4, B - 30, 56, 1, Rm[5]).r(4, B - 19, 56, 1, Rm[2]).r(4, B - 30, 1, 12, Rm[5]).r(59, B - 30, 1, 12, Rm[2]);
    P.r(4, B - 18, 56, 4, Rm[3]).r(4, B - 15, 56, 1, Rm[1]);
    P.r(7, B - 28, 12, 7, "#e8e8e0").r(7, B - 28, 12, 1, "#f4f4ee").r(7, B - 22, 12, 1, "#b8b8ae");
    for (const x of [ 26, 44 ]) P.r(x, B - 30, 3, 16, "#3a3c44").r(x, B - 30, 3, 1, "#5a5e66").r(x + 1, B - 24, 1, 3, "#9aa0a8");
    P.r(3, B - 14, 58, 2, Rf[3]).r(3, B - 14, 58, 1, Rf[5]);
    for (const x of [ 8, 54 ]) {
      P.r(x, B - 12, 2, 8, Rf[2]).r(x - 2, B - 5, 6, 1, Rf[1]);
      caster(P, x - 1, B - 4);
    }
    P.r(3, B - 33, 58, 1, Rf[4]);
    for (let x = 6; x < 60; x += 9) P.r(x, B - 33, 1, 3, Rf[2]);
    if (v % 3 === 2) P.oval(36, B - 25, 4, 2, "rgba(110,30,26,0.45)");
    grime(P, 5, B - 29, 54, 10, g, 8, "rgba(110,100,60,0.14)");
  });
  info("gurney", {
    solid: true,
    cover: .35,
    mat: "metal",
    foot: {
      x0: .04,
      x1: .96,
      d: .4
    }
  });
  def("vitals", 1, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#9aa0a6");
    P.shadow(16, B - 2, 9, 2, .38);
    P.r(15, B - 40, 2, 34, M[3]).r(15, B - 40, 1, 34, M[5]);
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * 6.283;
      P.line(16, B - 6, 16 + Math.cos(a) * 8, B - 4 + Math.sin(a) * 2, M[2]);
      caster(P, 15 + Math.round(Math.cos(a) * 8), B - 5 + Math.round(Math.sin(a) * 2));
    }
    box(P, 6, B - 62, 20, 4, 16, "#3a3e44");
    P.r(8, B - 57, 16, 11, "#0e1a14");
    const on = v % 3 !== 2;
    if (on) {
      let y = B - 52;
      for (let x = 9; x < 23; x++) {
        const yy = x === 13 ? B - 56 : x === 14 ? B - 48 : y;
        P.p(x, yy, "#5ae07a");
      }
      P.r(18, B - 56, 4, 2, "#e85a4a").r(9, B - 49, 3, 1, "#6ac0e8");
    } else {
      P.r(8, B - 57, 16, 11, "#1a2024").line(9, B - 47, 22, B - 56, "#4a5a60");
    }
    P.r(7, B - 45, 18, 1, "#2a2c30");
    for (let k = 0; k < 3; k++) P.p(9 + k * 3, B - 44, k === 0 ? "#e85a4a" : "#9aa0a8");
    P.line(26, B - 50, 29, B - 30, "#2a2c30").line(29, B - 30, 27, B - 14, "#2a2c30");
  });
  info("vitals", {
    solid: true,
    cover: .2,
    mat: "metal",
    foot: {
      x0: .2,
      x1: .8,
      d: .2
    }
  });
  def("medBin", 1, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#d8b030", R = RP(c);
    P.shadow(16, B - 1, 10, 3, .4);
    P.cyl(7, B - 24, 18, 22, c, {
      e: 6
    });
    P.r(7, B - 26, 18, 4, "#b83a2e").r(7, B - 26, 18, 1, "#d85a4a").r(8, B - 23, 16, 1, "#8a2a20");
    P.ring(16, B - 13, 4, 3, "#2a2420").ring(16, B - 13, 2, 1, "#2a2420").p(16, B - 13, "#2a2420");
    label(P, 8, B - 9, "의료", "#3a2a14", 7, 16);
    grime(P, 8, B - 8, 16, 5, g, 4);
  });
  info("medBin", {
    solid: false,
    cover: .2,
    mat: "plastic"
  });
  def("schoolDesk", 2, 1, 16, (P, w, h, up, g, v) => {
    const B = h - 2, top = "#b08a5a", Rt = RP(top), fr = "#4e7a5a", Rf = RP(fr);
    sbox(P, 1, B - 3, 62, 5, .36);
    for (const ox of [ 2, 33 ]) {
      P.r(ox + 3, B - 46, 22, 2, Rf[3]).r(ox + 3, B - 46, 22, 1, Rf[4]).r(ox + 5, B - 44, 2, 6, Rf[2]).r(ox + 21, B - 44, 2, 6, Rf[2]);
      box(P, ox, B - 38, 29, 12, 4, top);
      grain(P, ox + 1, B - 37, 27, 10, top, g, 10);
      P.r(ox + 1, B - 26, 27, 6, Rf[2]).r(ox + 1, B - 26, 27, 1, Rf[4]).r(ox + 2, B - 21, 25, 1, Rf[0]);
      P.r(ox + 2, B - 20, 2, 18, Rf[3]).r(ox + 25, B - 20, 2, 18, Rf[1]).r(ox + 2, B - 3, 4, 1, "#2a2c28").r(ox + 23, B - 3, 4, 1, "#2a2c28");
    }
    const bk = [ "#a84a3a", "#3a6a9a", "#c8a03a", "#4a8a52" ];
    P.r(6, B - 36, 9, 6, bk[v % 4]).r(6, B - 36, 9, 1, sh(bk[v % 4], .3)).r(7, B - 31, 7, 1, "#e8e4d8");
    P.r(40 + v % 3 * 4, B - 34, 8, 2, "#3a3e44").p(41 + v % 3 * 4, B - 34, "#9aa0a8");
    P.line(20, B - 33, 25, B - 30, Rt[1]).line(48, B - 35, 53, B - 35, "#3a5a8a");
    P.p(56, B - 29, "#d8c8d0");
    for (let k = 0; k < 2; k++) P.r(8 + g.i(48), B - 25 + g.i(3), 3 + g.i(4), 1, "#e8e4d8");
    scratch(P, 3, B - 37, 56, 9, g, 3, Rt[5]);
  });
  info("schoolDesk", {
    solid: true,
    cover: .45,
    mat: "wood",
    foot: {
      x0: .03,
      x1: .97,
      d: .55
    },
    open: "openDrawer"
  });
  def("lectern", 1, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#8a6440", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 3, B - 48, 26, 10, 38, c, {
      fi: 3
    });
    vgrain(P, 4, B - 38, 24, 36, c, g, 18);
    P.r(5, B - 34, 22, 1, R[1]).r(5, B - 33, 22, 1, R[5]);
    P.r(12, B - 28, 8, 8, R[2]).r(12, B - 28, 8, 1, R[1]).p(15, B - 25, "#c8a83a").p(16, B - 25, "#c8a83a").p(15, B - 24, "#c8a83a").p(16, B - 24, "#c8a83a");
    P.r(6, B - 47, 12, 7, "#3a5a3a").r(6, B - 47, 12, 1, "#5a7a5a").r(7, B - 44, 9, 1, "#e8e4d8");
    P.r(20, B - 47, 6, 4, "#d8d4c8").r(21, B - 48, 1, 2, "#e8e4d8").r(23, B - 48, 1, 2, "#e0c050").r(25, B - 48, 1, 2, "#e07070");
    scratch(P, 4, B - 37, 24, 30, g, 4, R[5]);
    grime(P, 4, B - 8, 24, 6, g, 6);
  });
  info("lectern", {
    solid: true,
    cover: .6,
    mat: "wood",
    foot: {
      x0: .08,
      x1: .92,
      d: .5
    }
  });
  def("schoolLocker", 1, 1, 34, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#6a7a6a", "#7a8088", "#8a7a5a" ][v % 3], R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 3, B - 64, 26, 10, 54, c);
    for (let k = 0; k < 3; k++) {
      const y = B - 53 + k * 17;
      P.r(4, y, 24, 16, R[3]).r(4, y, 24, 1, R[4]).r(4, y + 15, 24, 1, R[1]).r(4, y, 1, 16, R[4]).r(27, y, 1, 16, R[2]);
      for (let s = 0; s < 3; s++) P.r(7, y + 3 + s * 2, 8, 1, R[0]).r(7, y + 4 + s * 2, 8, 1, R[5]);
      P.r(18, y + 3, 7, 4, "#e8e4d8").r(18, y + 3, 7, 1, "#c8c4b4");
      txt(P, 19, y + 5, 5, "#5a5850", g);
      P.r(23, y + 9, 2, 4, "#2a2c30").p(23, y + 9, "#9aa0a8");
      if (g.chance(.35)) P.r(8 + g.i(10), y + 9 + g.i(3), 4, 3, g.pick([ "#e8708a", "#70c0e8", "#e8d070", "#90e070" ]));
    }
    if (v % 4 === 1) {
      P.r(4, B - 36, 24, 16, "#15181b").r(4, B - 36, 3, 16, R[2]).r(9, B - 30, 6, 9, "#3a4a6a").r(16, B - 26, 8, 5, "#a84a3a");
    }
    scratch(P, 5, B - 52, 22, 48, g, 5, R[5]);
    rust(P, 4, B - 6, 24, 4, g, 4);
    if (g.chance(.5)) P.oval(10 + g.i(10), B - 20 - g.i(20), 2, 1, R[2]);
  });
  info("schoolLocker", {
    tall: true,
    solid: true,
    cover: .7,
    mat: "metal",
    phys: .45,
    foot: {
      x0: .1,
      x1: .9,
      d: .45
    },
    open: "openLocker"
  });
  def("trophyCase", 2, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#6a4a30", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 70, 60, 8, 62, c, {
      fi: 3
    });
    P.r(5, B - 60, 54, 44, "#1c2428");
    for (const sy of [ B - 46, B - 31 ]) P.r(5, sy, 54, 2, "#b8bcc0").r(5, sy, 54, 1, "#d8dce0");
    const gold = "#d8a830", Rg = RP(gold);
    for (const [x, sy, s] of [ [ 9, B - 46, 1 ], [ 22, B - 46, 0 ], [ 36, B - 46, 1 ], [ 48, B - 46, 0 ], [ 12, B - 31, 0 ], [ 28, B - 31, 1 ], [ 44, B - 31, 0 ] ]) {
      if (s) {
        P.r(x, sy - 4, 6, 4, "#3a2a1c").r(x + 1, sy - 10, 4, 6, Rg[3]).r(x, sy - 12, 6, 3, Rg[4]).r(x + 1, sy - 12, 1, 3, Rg[5]).p(x - 1, sy - 11, Rg[2]).p(x + 6, sy - 11, Rg[2]);
      } else {
        P.r(x + 1, sy - 3, 5, 3, "#3a2a1c").r(x + 2, sy - 9, 3, 6, "#a8acb0").r(x + 1, sy - 11, 5, 3, "#c8ccd0").p(x + 2, sy - 11, "#f0f4f8");
      }
    }
    P.r(8, B - 26, 14, 9, "#e8e0c8").r(8, B - 26, 14, 1, "#c8a830").r(9, B - 23, 10, 1, "#8a7a5a");
    P.r(40, B - 25, 4, 4, Rg[3]).r(41, B - 28, 2, 3, "#a83a3a");
    glass(P, 5, B - 60, 27, 44, {
      col: "#2a3c44",
      gap: 14,
      wide: false
    });
    glass(P, 32, B - 60, 27, 44, {
      col: "#2a3c44",
      gap: 14,
      wide: false
    });
    P.r(31, B - 60, 2, 44, R[2]);
    if (v % 3 === 1) {
      P.line(36, B - 58, 44, B - 40, "#a8c8d8").line(40, B - 50, 50, B - 46, "#a8c8d8");
    }
    P.r(4, B - 14, 56, 10, R[3]).r(4, B - 14, 56, 1, R[4]);
    for (const x of [ 16, 46 ]) P.r(x, B - 10, 4, 1, "#c8b080");
    grime(P, 4, B - 13, 56, 8, g, 6);
  });
  info("trophyCase", {
    tall: true,
    solid: true,
    cover: .5,
    mat: "glass",
    phys: .45,
    foot: {
      x0: .03,
      x1: .97,
      d: .45
    },
    open: "openGlass"
  });
  def("shoeRack", 2, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#8a6a48" : "#9a9a8e", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .4);
    box(P, 2, B - 50, 60, 8, 44, c, {
      fi: 3
    });
    for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
      const x = 4 + col * 11.4 | 0, y = B - 41 + row * 10;
      P.r(x, y, 10, 9, R[1]).r(x, y, 10, 1, R[0]);
      if (g.chance(.75)) {
        const sc = g.pick([ "#e8e4d8", "#d8d0c0", "#4a5a8a", "#3a3a3e", "#a84a3a", "#e0e0e0" ]), Rs = RP(sc);
        P.r(x + 1, y + 4, 8, 4, Rs[3]).r(x + 1, y + 4, 8, 1, Rs[5]).r(x + 6, y + 3, 3, 1, Rs[4]).p(x + 2, y + 7, Rs[1]);
      }
      P.r(x, y + 8, 10, 1, R[4]);
    }
    for (let k = 0; k < 4; k++) P.r(6 + g.i(50), B - 46, 6, 2, "#e8e4d8");
    scratch(P, 3, B - 42, 58, 36, g, 4, R[5]);
  });
  info("shoeRack", {
    solid: true,
    cover: .5,
    mat: "wood",
    foot: {
      x0: .02,
      x1: .98,
      d: .45
    }
  });
  def("tireStack", 1, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, t = "#26282c", R = RP(t), n = 2 + v % 3;
    P.shadow(16, B - 2, 14, 3, .45);
    for (let k = 0; k < n; k++) {
      const y = B - 8 - k * 8;
      P.oval(16, y, 13, 5, R[2]).oval(16, y - 1, 13, 4, R[3]).oval(16, y - 2, 6, 2, "#101114");
      for (let s = 0; s < 6; s++) P.p(5 + s * 4, y + 1, R[4]);
      P.r(4, y, 1, 3, R[4]);
    }
    if (v % 2) P.r(9, B - 8 - n * 8 + 6, 14, 1, "#e8e4d8");
  });
  info("tireStack", {
    solid: true,
    cover: .7,
    mat: "fabric",
    foot: {
      x0: .06,
      x1: .94,
      d: .6
    }
  });
  def("cubeDesk", 2, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, top = "#b4a68a", Rt = RP(top), pn = [ "#5a6270", "#6a6a60", "#5a6a6a" ][v % 3], Rp = RP(pn);
    sbox(P, 1, B - 3, 62, 5, .4);
    P.r(2, B - 56, 60, 18, Rp[3]).r(2, B - 56, 60, 2, Rp[5]).r(2, B - 39, 60, 1, Rp[1]);
    for (let x = 4; x < 60; x += 3) P.r(x, B - 54, 1, 14, Rp[2]);
    for (let k = 0; k < 3; k++) {
      const x = 6 + g.i(48), y = B - 52 + g.i(8);
      P.r(x, y, 5, 5, g.pick([ "#e8d070", "#e8a0b0", "#a0d0e8" ])).p(x + 1, y + 1, "#8a7a50");
    }
    box(P, 2, B - 38, 60, 14, 8, top);
    grain(P, 3, B - 37, 58, 12, top, g, 8);
    P.r(3, B - 24, 18, 22, Rp[2]).r(3, B - 24, 18, 1, Rp[4]);
    for (let k = 0; k < 3; k++) P.r(5, B - 21 + k * 6, 14, 1, Rp[0]).r(10, B - 19 + k * 6, 4, 1, "#c8ccd0");
    P.r(58, B - 24, 3, 22, Rp[1]);
    box(P, 24, B - 52, 18, 2, 12, "#2a2c32");
    P.r(26, B - 49, 14, 9, v % 4 === 3 ? "#101418" : "#2a4a6a");
    if (v % 4 !== 3) {
      P.r(27, B - 48, 8, 1, "#9ac8e8").r(27, B - 46, 10, 1, "#6a9ab8");
    }
    P.r(31, B - 38, 4, 3, "#3a3c42");
    P.r(24, B - 33, 18, 4, "#3a3c42").r(24, B - 33, 18, 1, "#5a5e66");
    for (let k = 0; k < 8; k++) P.p(25 + k * 2, B - 31, "#7a7e86");
    P.r(6, B - 36, 12, 8, "#e8e4d8").r(7, B - 35, 12, 8, "#f0ece0");
    txt(P, 8, B - 33, 9, "#8a8678", g);
    txt(P, 8, B - 31, 7, "#8a8678", g);
    P.r(47, B - 36, 5, 5, "#c8c4b8").r(47, B - 36, 5, 1, "#e8e4d8").p(52, B - 34, "#a8a49a").p(48, B - 35, "#4a2a18");
    P.r(54, B - 35, 6, 4, "#2a2c30").r(54, B - 36, 2, 1, "#3a3c40");
    scratch(P, 3, B - 37, 58, 12, g, 3, Rt[5]);
  });
  info("cubeDesk", {
    solid: true,
    cover: .5,
    mat: "wood",
    foot: {
      x0: .02,
      x1: .98,
      d: .6
    },
    open: "openDrawer"
  });
  def("officeChair", 1, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#2a2c32", "#3a3a42", "#2e3a4a" ][v % 3], R = RP(c);
    P.shadow(16, B - 2, 10, 3, .4);
    P.r(9, B - 40, 14, 14, R[3]).r(9, B - 40, 14, 1, R[5]);
    for (let y = B - 38; y < B - 27; y += 2) P.r(10, y, 12, 1, R[1]);
    P.r(8, B - 25, 16, 6, R[3]).r(8, B - 25, 16, 1, R[4]).r(8, B - 20, 16, 1, R[1]);
    P.r(6, B - 27, 3, 2, R[2]).r(23, B - 27, 3, 2, R[2]);
    P.r(15, B - 19, 2, 9, "#6a6e74").r(15, B - 19, 1, 9, "#9aa0a6");
    for (const [x, y] of [ [ 6, B - 6 ], [ 23, B - 6 ], [ 10, B - 3 ], [ 19, B - 3 ], [ 15, B - 8 ] ]) caster(P, x, y);
    P.line(16, B - 10, 7, B - 5, "#4a4e54").line(16, B - 10, 24, B - 5, "#4a4e54");
  });
  info("officeChair", {
    solid: false,
    cover: .15,
    mat: "plastic"
  });
  def("serverRack", 1, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#2a2c32", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .45);
    box(P, 3, B - 70, 26, 8, 62, c);
    for (let k = 0; k < 9; k++) {
      const y = B - 60 + k * 6;
      P.r(5, y, 22, 5, k % 3 === 2 ? "#3a3c44" : R[4]).r(5, y, 22, 1, R[5]);
      for (let s = 0; s < 4; s++) P.p(7 + s * 2, y + 2, g.pick([ "#5ae07a", "#5ae07a", "#e8d050", "#3a3c40", "#e85a4a" ]));
      P.r(18, y + 2, 7, 1, R[1]);
    }
    P.r(5, B - 6, 22, 3, "#1a1c20");
    for (let k = 0; k < 4; k++) P.line(8 + k * 4, B - 6, 6 + k * 5, B - 2, g.pick([ "#3a6aa0", "#c8c4b0", "#3a3c40" ]));
    P.r(3, B - 70, 1, 62, R[5]);
    scratch(P, 4, B - 60, 24, 50, g, 2, R[5]);
  });
  info("serverRack", {
    tall: true,
    solid: true,
    cover: .8,
    mat: "metal",
    phys: .6,
    foot: {
      x0: .1,
      x1: .9,
      d: .6
    }
  });
  def("clothesRack", 2, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#b8bec4");
    sbox(P, 2, B - 3, 60, 5, .34);
    for (const x of [ 5, 57 ]) {
      P.r(x, B - 56, 2, 52, M[3]).r(x, B - 56, 1, 52, M[5]);
      P.r(x - 3, B - 4, 8, 2, M[2]);
      caster(P, x - 2, B - 3);
      caster(P, x + 2, B - 3);
    }
    P.r(4, B - 58, 56, 2, M[4]).r(4, B - 58, 56, 1, M[5]);
    const cols = [ "#3a4a6a", "#a84a3a", "#4a6a4a", "#c8b08a", "#5a3a5a", "#2a2c30", "#d8d4c8", "#8a6a3a" ];
    let x = 8;
    while (x < 54) {
      const c = cols[g.i(cols.length)], R = RP(c), cw = 4 + g.i(3), ch = 22 + g.i(14);
      P.r(x + 1, B - 58, 1, 3, "#9aa0a8");
      P.r(x, B - 55, cw, ch, R[3]).r(x, B - 55, 1, ch, R[4]).r(x + cw - 1, B - 55, 1, ch, R[1]).r(x, B - 55, cw, 2, R[5]);
      if (g.chance(.4)) P.r(x + 1, B - 50, cw - 2, 1, R[1]);
      if (g.chance(.3)) P.r(x + cw - 2, B - 45, 2, 3, "#e8e4d8");
      x += cw - (g.chance(.3) ? 1 : 0);
    }
    if (v % 3 === 2) {
      P.r(20, B - 20, 10, 5, "#8a5a3a").r(20, B - 20, 10, 1, "#a87a5a");
    }
  });
  info("clothesRack", {
    solid: true,
    cover: .25,
    mat: "fabric",
    foot: {
      x0: .04,
      x1: .96,
      d: .3
    }
  });
  def("mannequin", 1, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, s = "#d8d4ca", R = RP(s), cl = [ "#3a4a6a", "#a84a3a", null, "#4a5a3a" ][v % 4];
    P.shadow(16, B - 2, 8, 2, .4);
    P.r(11, B - 4, 10, 2, "#3a3c40").r(15, B - 14, 2, 10, "#6a6e74");
    P.r(12, B - 32, 3, 18, R[3]).r(17, B - 32, 3, 18, R[2]).r(12, B - 32, 1, 18, R[4]);
    P.r(10, B - 52, 12, 20, R[3]).r(10, B - 52, 2, 20, R[4]).r(20, B - 52, 2, 20, R[2]).r(11, B - 34, 10, 3, R[2]);
    P.r(7, B - 51, 3, 14, R[3]).r(22, B - 51, 3, 14, R[2]);
    if (v % 5 !== 4) {
      P.ball(16, B - 58, 4, 5, s);
    } else {
      P.r(15, B - 54, 2, 2, R[2]);
    }
    if (cl) {
      const Rc = RP(cl);
      P.r(10, B - 51, 12, 14, Rc[3]).r(10, B - 51, 2, 14, Rc[4]).r(20, B - 51, 2, 14, Rc[2]).r(7, B - 51, 3, 6, Rc[3]).r(22, B - 51, 3, 6, Rc[2]);
      P.r(14, B - 50, 4, 1, Rc[1]);
      P.r(19, B - 46, 3, 4, "#e8e4d8");
    }
    scratch(P, 10, B - 50, 12, 30, g, 2, R[1]);
  });
  info("mannequin", {
    solid: true,
    cover: .15,
    mat: "plastic",
    foot: {
      x0: .25,
      x1: .75,
      d: .25
    }
  });
  def("dispRack", 2, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#a8acb0", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 70, 60, 8, 62, c, {
      fi: 3
    });
    P.r(4, B - 62, 56, 56, "#3a3e44");
    for (let x = 6; x < 58; x += 4) for (let y = B - 60; y < B - 8; y += 4) P.p(x, y, "#2a2c30");
    for (let k = 0; k < 4; k++) {
      const sy = B - 48 + k * 13;
      P.r(3, sy, 58, 2, R[4]).r(3, sy, 58, 1, R[5]).r(3, sy + 2, 58, 2, "#e8e4d8");
      for (let x = 6; x < 58; x += 9) P.r(x, sy + 2, 4, 2, g.pick([ "#c83a34", "#e8d050", "#e8e4d8" ]));
      PP.goods(P, 5, 59, sy, 11, g, {
        empty: v % 3 === 1 ? .5 : .2
      });
    }
    P.r(2, B - 70, 60, 6, "#c83a34").r(2, B - 70, 60, 1, "#e85a4a");
    label(P, 2, B - 70, [ "생활용품", "식료품", "할인" ][v % 3], "#f4f0e0", 7, 60);
    rust(P, 4, B - 6, 56, 4, g, 4);
  });
  info("dispRack", {
    tall: true,
    solid: true,
    cover: .6,
    mat: "metal",
    phys: .45,
    foot: {
      x0: .03,
      x1: .97,
      d: .45
    },
    open: "openShelf"
  });
  def("checkout", 2, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, top = "#8a8e94", Rt = RP(top), body = [ "#c8c4b8", "#3a5a8a", "#a84a3a" ][v % 3], Rb = RP(body);
    sbox(P, 1, B - 3, 62, 5, .4);
    box(P, 2, B - 40, 60, 16, 4, top);
    P.r(4, B - 39, 30, 14, "#2a2c30").r(4, B - 39, 30, 1, "#3a3c42");
    for (let x = 6; x < 33; x += 3) P.r(x, B - 38, 1, 12, "#3a3c42");
    box(P, 38, B - 50, 14, 4, 10, "#3a3c42");
    P.r(40, B - 45, 10, 4, "#1a3a2a").r(41, B - 44, 6, 1, "#5ae07a");
    P.r(54, B - 38, 6, 5, "#1a1c20").p(56, B - 36, "#e85a4a");
    box(P, 2, B - 24, 60, 0, 22, body, {
      flat: true
    });
    P.r(4, B - 18, 56, 1, Rb[1]).r(4, B - 17, 56, 1, Rb[5]);
    label(P, 2, B - 14, "계산", sh(body, -.55), 7, 30);
    P.r(36, B - 18, 22, 14, Rb[2]).r(36, B - 18, 22, 1, Rb[4]);
    P.r(10, B - 37, 6, 5, "#d8d4c8").r(20, B - 36, 4, 4, "#c8a03a");
    if (v % 2) P.poly([ [ 52, B - 48 ], [ 60, B - 47 ], [ 59, B - 40 ], [ 53, B - 41 ] ], "#e8e8e0");
    grime(P, 3, B - 23, 58, 20, g, 8);
    scratch(P, 3, B - 39, 58, 14, g, 3, Rt[5]);
  });
  info("checkout", {
    solid: true,
    cover: .7,
    mat: "metal",
    foot: {
      x0: .02,
      x1: .98,
      d: .6
    },
    open: "openFiling"
  });
  def("cart", 1, 1, 18, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#a8b0b8");
    P.shadow(16, B - 2, 12, 3, .4);
    for (let x = 5; x < 28; x += 3) P.line(x, B - 36, x + (x < 16 ? 1 : -1), B - 18, M[3]);
    for (let y = B - 36; y <= B - 18; y += 3) P.r(5 + (y > B - 27 ? 1 : 0), y, 22, 1, M[4]);
    P.r(4, B - 37, 24, 1, M[5]).r(6, B - 18, 20, 1, M[2]);
    P.r(2, B - 40, 3, 6, "#c83a34").r(2, B - 40, 3, 1, "#e85a4a");
    P.r(7, B - 16, 1, 10, M[2]).r(24, B - 16, 1, 10, M[2]).r(7, B - 8, 18, 1, M[3]);
    for (const x of [ 6, 23 ]) caster(P, x, B - 4);
    if (v % 3 === 1) {
      P.r(10, B - 33, 7, 6, "#c8a03a").r(18, B - 31, 5, 4, "#4a7aa0");
    }
  });
  info("cart", {
    solid: true,
    cover: .2,
    mat: "metal",
    foot: {
      x0: .12,
      x1: .88,
      d: .45
    }
  });
  def("scaffold", 2, 1, 64, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#8a9096"), pl = "#a07a48", Rp = RP(pl);
    sbox(P, 2, B - 3, 60, 5, .3);
    for (const x of [ 4, 30, 57 ]) P.r(x, B - 92, 3, 90, M[3]).r(x, B - 92, 1, 90, M[5]).r(x + 2, B - 92, 1, 90, M[1]);
    for (const y of [ B - 90, B - 60, B - 30 ]) {
      P.r(4, y, 56, 2, M[4]).r(4, y, 56, 1, M[5]);
      P.line(7, y + 2, 29, y + 28, M[2]);
      P.line(33, y + 28, 56, y + 2, M[2]);
      for (const x of [ 4, 30, 57 ]) P.r(x - 1, y - 1, 5, 4, "#5a5e64").p(x, y, "#b8bec4");
    }
    for (const y of [ B - 62, B - 32 ]) {
      P.r(4, y - 5, 56, 5, Rp[3]).r(4, y - 5, 56, 1, Rp[5]).r(4, y - 1, 56, 1, Rp[1]);
      for (let x = 10; x < 58; x += 13) P.r(x, y - 5, 1, 5, Rp[1]);
    }
    if (v % 2) for (let y = B - 88; y < B - 64; y += 3) for (let x = 8; x < 56; x += 3) P.p(x + (y >> 1 & 1), y, "#4a7a5a");
    P.r(2, B - 4, 8, 2, "#5a5e64").r(28, B - 4, 8, 2, "#5a5e64").r(55, B - 4, 8, 2, "#5a5e64");
    rust(P, 4, B - 40, 56, 36, g, 6);
  });
  info("scaffold", {
    solid: true,
    cover: .25,
    mat: "metal",
    foot: {
      x0: .03,
      x1: .97,
      d: .25
    }
  });
  def("mixer", 2, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, o = "#d0782e", Ro = RP(o), M = RP("#5a5e64");
    sbox(P, 2, B - 3, 60, 5, .42);
    P.r(8, B - 20, 46, 4, M[3]).r(8, B - 20, 46, 1, M[5]);
    for (const x of [ 10, 50 ]) {
      P.r(x, B - 34, 3, 16, M[2]);
    }
    P.poly([ [ 16, B - 52 ], [ 46, B - 56 ], [ 52, B - 34 ], [ 44, B - 22 ], [ 18, B - 22 ], [ 12, B - 36 ] ], Ro[3]);
    P.poly([ [ 16, B - 52 ], [ 46, B - 56 ], [ 48, B - 48 ], [ 18, B - 44 ] ], Ro[4]);
    P.line(14, B - 40, 50, B - 44, Ro[2]).line(16, B - 30, 48, B - 32, Ro[2]);
    P.oval(31, B - 54, 8, 3, "#3a3a38").oval(31, B - 54, 6, 2, "#8a8a84");
    P.r(44, B - 26, 14, 4, "#3a3c40").r(44, B - 26, 14, 1, "#5a5e66").p(56, B - 25, "#c83a34");
    wheel(P, 14, B - 8, 6, "#26282c", "#5a5e64");
    wheel(P, 48, B - 8, 6, "#26282c", "#5a5e64");
    for (let k = 0; k < 8; k++) P.p(14 + g.i(36), B - 50 + g.i(26), g.pick([ "#9a9a90", "#b8b4a8" ]));
    rust(P, 14, B - 46, 34, 20, g, 4);
  });
  info("mixer", {
    solid: true,
    cover: .7,
    mat: "metal",
    foot: {
      x0: .1,
      x1: .9,
      d: .55
    }
  });
  def("cone", 1, 1, 12, (P, w, h, up, g, v) => {
    const B = h - 2, o = v % 3 === 2 ? "#c8a02a" : "#d86a2a", R = RP(o);
    P.shadow(16, B - 2, 9, 2, .4);
    P.r(8, B - 6, 16, 4, "#2a2c30").r(8, B - 6, 16, 1, "#4a4e54");
    P.poly([ [ 14, B - 38 ], [ 18, B - 38 ], [ 23, B - 6 ], [ 9, B - 6 ] ], R[3]);
    P.poly([ [ 14, B - 38 ], [ 16, B - 38 ], [ 12, B - 6 ], [ 9, B - 6 ] ], R[4]);
    P.r(12, B - 26, 8, 3, "#e8e8e0").r(11, B - 16, 10, 3, "#e8e8e0").r(12, B - 26, 2, 3, "#ffffff");
    P.r(14, B - 39, 4, 1, R[5]);
    if (v % 4 === 1) P.r(10, B - 12, 4, 2, "#5a4a3a");
  });
  info("cone", {
    solid: false,
    cover: .05,
    mat: "plastic"
  });
  def("potty", 1, 1, 46, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#3a6aa8" : "#4a8a5a", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .45);
    P.r(3, B - 78, 26, 6, R[4]).r(3, B - 78, 26, 1, R[5]).r(5, B - 80, 22, 2, R[3]);
    box(P, 3, B - 72, 26, 4, 68, c, {
      fi: 3
    });
    P.r(6, B - 64, 20, 58, R[2]).r(6, B - 64, 1, 58, R[4]).r(25, B - 64, 1, 58, R[1]);
    for (let y = B - 62; y < B - 54; y += 2) P.r(9, y, 14, 1, R[0]);
    P.r(21, B - 38, 3, 6, "#c8ccd0").r(9, B - 48, 8, 3, v % 3 ? "#c83a34" : "#5ae07a");
    label(P, 6, B - 30, "화장실", "#e8ecf0", 7, 20);
    grime(P, 4, B - 14, 24, 10, g, 8, "rgba(60,50,30,0.25)");
    scratch(P, 4, B - 70, 24, 60, g, 4, R[5]);
  });
  info("potty", {
    tall: true,
    solid: true,
    cover: .6,
    mat: "plastic",
    phys: .6,
    foot: {
      x0: .06,
      x1: .94,
      d: .7
    }
  });
  def("rebar", 2, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2;
    sbox(P, 1, B - 3, 62, 5, .35);
    for (const x of [ 8, 32, 52 ]) P.r(x, B - 10, 6, 8, "#7a5a3a").r(x, B - 10, 6, 1, "#9a7a52");
    for (let k = 0; k < 14; k++) {
      const y = B - 22 + k % 5 * 3 + (k >= 10 ? -1 : 0), x0 = 2 + g.i(3), c = g.pick([ "#6e4a30", "#5e4028", "#7a5236", "#5a5a58" ]);
      P.r(x0, y, 57, 1, c).r(x0, y + 1, 57, 1, sh(c, -.35));
      for (let s = x0 + 2 + (k & 1); s < x0 + 55; s += 3) P.p(s, y, sh(c, .3));
      P.r(x0 + 57, y, 2, 2, k % 3 ? "#c83a30" : "#d8b030");
    }
    P.r(18, B - 22, 2, 10, "#3a3c40").r(40, B - 22, 2, 10, "#3a3c40");
  });
  info("rebar", {
    solid: true,
    cover: .3,
    mat: "metal",
    foot: {
      x0: .02,
      x1: .98,
      d: .5
    }
  });
  def("plyStack", 2, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#a88452", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .4);
    box(P, 2, B - 36, 60, 14, 0, c);
    grain(P, 3, B - 35, 58, 12, c, g, 12);
    for (let k = 0; k < 7; k++) {
      const y = B - 22 + k * 3;
      P.r(2, y, 60, 3, k % 2 ? R[3] : R[2]).r(2, y, 60, 1, R[4]);
    }
    for (const x of [ 14, 46 ]) P.r(x, B - 36, 3, 34, "#2a3a6a").r(x, B - 36, 1, 34, "#4a5a8a");
    if (v % 2) P.poly([ [ 3, B - 35 ], [ 26, B - 35 ], [ 22, B - 24 ], [ 3, B - 26 ] ], "#b8c4cc");
    P.oval(36, B - 30, 2, 3, "rgba(60,44,26,0.4)").oval(42, B - 28, 2, 3, "rgba(60,44,26,0.4)");
  });
  info("plyStack", {
    solid: true,
    cover: .7,
    mat: "wood",
    foot: {
      x0: .02,
      x1: .98,
      d: .6
    }
  });
  def("wheelbarrow", 1, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#4a7a4a" : "#a84a3a", R = RP(c);
    P.shadow(16, B - 2, 13, 3, .4);
    P.poly([ [ 3, B - 30 ], [ 29, B - 30 ], [ 25, B - 14 ], [ 7, B - 14 ] ], R[3]);
    P.poly([ [ 5, B - 29 ], [ 27, B - 29 ], [ 24, B - 22 ], [ 8, B - 22 ] ], "#5a5a54");
    P.r(3, B - 31, 26, 2, R[5]);
    for (let k = 0; k < 6; k++) P.p(8 + g.i(16), B - 27 + g.i(5), "#9a9a90");
    P.r(5, B - 14, 2, 10, "#4a4e54").r(25, B - 14, 2, 10, "#4a4e54").r(1, B - 34, 5, 2, "#2a2c30");
    wheel(P, 16, B - 6, 4, "#26282c", "#6a6e74");
  });
  info("wheelbarrow", {
    solid: true,
    cover: .3,
    mat: "metal",
    foot: {
      x0: .08,
      x1: .92,
      d: .45
    }
  });
  def("generator", 2, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#c8a02a", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .44);
    box(P, 3, B - 44, 58, 12, 38, c, {
      fi: 3
    });
    for (let y = B - 30; y < B - 10; y += 3) P.r(6, y, 26, 1, R[1]).r(6, y + 1, 26, 1, R[4]);
    P.r(36, B - 30, 20, 14, "#2a2c30").r(37, B - 29, 8, 5, "#1a2a1a").r(38, B - 28, 5, 1, "#5ae07a");
    P.r(47, B - 29, 3, 3, "#c83a34").r(51, B - 29, 3, 3, "#d8d4c8");
    for (let k = 0; k < 4; k++) P.p(38 + k * 4, B - 20, "#9aa0a8");
    P.r(52, B - 52, 4, 9, "#4a4e54").r(52, B - 52, 4, 1, "#6a6e74");
    P.oval(54, B - 53, 2, 1, "#1a1a1a");
    P.r(10, B - 42, 12, 6, "#2a2c30");
    label(P, 10, B - 42, "위험", c, 7, 12);
    for (let k = 0; k < 4; k++) P.r(3 + g.i(56), B - 8, 3, 2, "rgba(20,14,8,0.4)");
    rust(P, 4, B - 12, 56, 8, g, 6);
  });
  info("generator", {
    solid: true,
    cover: .8,
    mat: "metal",
    foot: {
      x0: .04,
      x1: .96,
      d: .6
    }
  });
  def("elecPanel", 2, 1, 36, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#b4b6ac", R = RP(c), T0 = B - 58, F0 = B - 52, BR = "#3a2a14", YE = "#e8c032";
    sbox(P, 2, B - 3, 60, 5, .44);
    for (const px of [ 10, 21, 47 ]) {
      P.r(px, 1, 3, T0 - 1, "#6a6e70").r(px, 1, 1, T0 - 1, "#8c9092").r(px + 2, 1, 1, T0 - 1, "#4a4e50");
      for (let y = 5; y < T0 - 3; y += 8) P.r(px - 1, y, 5, 2, "#55595b");
    }
    box(P, 4, T0, 56, 6, 52, c, {
      fi: 3
    });
    P.r(31, F0 + 2, 1, 48, R[0]).r(32, F0 + 2, 1, 48, R[1]).r(33, F0 + 2, 1, 48, R[4]);
    for (const hx of [ 27, 36 ]) P.r(hx, F0 + 22, 2, 8, "#3a3c40").r(hx, F0 + 22, 1, 8, "#70747a").p(hx + 1, F0 + 29, "#2a2c30");
    for (const hy of [ F0 + 6, F0 + 40 ]) P.r(5, hy, 1, 5, "#6a6e70").r(58, hy, 1, 5, "#6a6e70");
    const cx = 17, ty = F0 + 5;
    for (let k = 0; k < 12; k++) {
      const hw = Math.floor(k * .6);
      P.r(cx - hw - 1, ty + k, hw * 2 + 3, 1, BR);
      if (k > 0 && k < 11) P.r(cx - hw, ty + k, hw * 2 + 1, 1, YE);
    }
    P.p(cx, ty + 1, YE);
    for (const [x, y] of [ [ 18, 4 ], [ 17, 5 ], [ 17, 6 ], [ 16, 7 ], [ 17, 7 ], [ 18, 7 ], [ 17, 8 ], [ 16, 9 ] ]) P.p(x, ty + y, BR);
    txt(P, 9, F0 + 20, 16, R[1], g);
    txt(P, 9, F0 + 22, 12, R[1], g);
    P.r(37, F0 + 4, 20, 11, "#a83228").r(38, F0 + 5, 18, 9, "#c83a34");
    label(P, 37, F0 + 6, "고압", "#f4efe2", 7, 20);
    P.r(40, F0 + 18, 4, 4, "#3a3c40").r(41, F0 + 19, 2, 2, "#e0402c").p(41, F0 + 19, "#ff9a80");
    P.r(47, F0 + 18, 4, 4, "#3a3c40").r(48, F0 + 19, 2, 2, "#3ac85a").p(48, F0 + 19, "#a8f0b0");
    for (let y = B - 15; y < B - 6; y += 2) {
      P.r(9, y, 18, 1, R[1]).r(38, y, 18, 1, R[1]);
      P.r(9, y + 1, 18, 1, R[4]).r(38, y + 1, 18, 1, R[4]);
    }
    for (let k = 0; k < 9; k++) {
      const x = 6 + g.i(52);
      if (x >= 30 && x <= 34) continue;
      const y0 = T0 + 2 + g.i(26), l = 8 + g.i(18);
      for (let y = y0; y < Math.min(B - 2, y0 + l); y += 2) P.p(x, y, k % 3 ? "#7e93a4" : "#5f7486");
    }
    rust(P, 6, B - 9, 52, 7, g, 6);
    rust(P, 6, T0 + 1, 52, 4, g, 3);
  });
  info("elecPanel", {
    solid: true,
    cover: .8,
    mat: "metal",
    foot: {
      x0: .04,
      x1: .96,
      d: .5
    }
  });
  def("ticketMachine", 1, 1, 36, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#8a9096", "#3a5a8a", "#2a6a5a" ][v % 3], R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .44);
    box(P, 3, B - 66, 26, 8, 58, c);
    P.r(3, B - 66, 26, 4, "#2e5a8a");
    label(P, 3, B - 66, "승차권", "#f0f4f8", 7, 26);
    P.r(6, B - 56, 20, 14, "#101820");
    if (v % 4 !== 3) {
      screen(P, 7, B - 55, 18, 12, "#3a7ab8", g);
    } else {
      P.line(8, B - 54, 24, B - 44, "#5a6a7a").line(16, B - 54, 12, B - 44, "#5a6a7a");
    }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) P.r(7 + i * 5, B - 38 + j * 4, 3, 2, j === 2 && i === 3 ? "#c83a34" : "#d8d4c8");
    P.r(7, B - 24, 8, 2, "#1a1c20").r(18, B - 24, 7, 2, "#1a1c20").p(19, B - 24, "#5ae07a");
    P.r(9, B - 15, 14, 5, "#1a1c20").r(9, B - 15, 14, 1, "#0a0b0d").r(10, B - 12, 12, 1, R[4]);
    if (v % 3 === 1) P.r(11, B - 13, 4, 2, "#e8e4d8");
    scratch(P, 4, B - 56, 24, 50, g, 4, R[5]);
    grime(P, 4, B - 10, 24, 6, g, 5);
  });
  info("ticketMachine", {
    tall: true,
    solid: true,
    cover: .8,
    mat: "metal",
    phys: .55,
    foot: {
      x0: .1,
      x1: .9,
      d: .55
    }
  });
  def("luggageCart", 1, 1, 18, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#9aa0a8"), bags = [ [ "#3a4a6a", 18, 12 ], [ "#a84a3a", 14, 9 ], [ "#2a2c30", 16, 7 ], [ "#c8a03a", 12, 8 ] ];
    P.shadow(16, B - 2, 13, 3, .4);
    P.r(3, B - 40, 2, 34, M[3]).r(27, B - 40, 2, 34, M[2]).r(3, B - 41, 26, 2, M[4]).r(3, B - 8, 26, 2, M[3]);
    let y = B - 10;
    for (let k = 0; k < 2; k++) {
      const [c, bw, bh] = bags[(v + k) % 4], R = RP(c), x = 6 + (k ? 3 : 0);
      P.r(x, y - bh, bw, bh, R[3]).r(x, y - bh, bw, 1, R[5]).r(x, y - bh, 1, bh, R[4]).r(x + bw - 1, y - bh, 1, bh, R[1]).r(x + (bw >> 1) - 2, y - bh - 2, 4, 2, R[1]);
      P.r(x + 2, y - bh + 3, 3, 2, "#e8e4d8");
      y -= bh;
    }
    for (const x of [ 4, 25 ]) caster(P, x, B - 4);
  });
  info("luggageCart", {
    solid: true,
    cover: .4,
    mat: "metal",
    foot: {
      x0: .08,
      x1: .92,
      d: .45
    }
  });
  def("termBench", 2, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#5a6a7a", "#7a8088", "#3a5a8a" ][v % 3], R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .38);
    P.r(4, B - 8, 56, 2, "#4a4e54").r(10, B - 8, 2, 6, "#4a4e54").r(52, B - 8, 2, 6, "#4a4e54").r(8, B - 3, 6, 1, "#2a2c30").r(50, B - 3, 6, 1, "#2a2c30");
    for (let k = 0; k < 3; k++) {
      const x = 4 + k * 19;
      P.r(x, B - 38, 17, 14, R[3]).r(x, B - 38, 17, 1, R[5]).r(x, B - 25, 17, 1, R[1]);
      for (let yy = B - 36; yy < B - 26; yy += 3) for (let xx = x + 2; xx < x + 16; xx += 3) P.p(xx, yy, R[1]);
      P.r(x, B - 22, 17, 12, R[4]).r(x, B - 22, 17, 1, R[5]).r(x, B - 11, 17, 1, R[2]);
      for (let yy = B - 20; yy < B - 12; yy += 3) for (let xx = x + 2; xx < x + 16; xx += 3) P.p(xx, yy, R[2]);
    }
    for (const x of [ 2, 21, 40, 59 ]) P.r(x, B - 26, 3, 6, "#6a6e74").r(x, B - 26, 3, 1, "#9aa0a6");
    if (v % 3 === 1) P.r(26, B - 20, 9, 5, "#d8d4c8").r(26, B - 20, 9, 1, "#e8e4d8");
    scratch(P, 4, B - 37, 56, 26, g, 3, R[5]);
  });
  info("termBench", {
    solid: true,
    cover: .4,
    mat: "metal",
    foot: {
      x0: .03,
      x1: .97,
      d: .45
    }
  });
  def("departBoard", 2, 1, 60, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#5a5e64");
    sbox(P, 6, B - 3, 52, 4, .3);
    for (const x of [ 10, 52 ]) P.r(x, B - 60, 3, 58, M[3]).r(x, B - 60, 1, 58, M[5]).r(x - 3, B - 3, 9, 2, M[2]);
    box(P, 2, B - 90, 60, 4, 32, "#22252a");
    P.r(4, B - 85, 56, 5, "#2e5a8a");
    label(P, 4, B - 86, "출발", "#f0f4f8", 7, 28);
    mini(P, 34, B - 85, "DEPART", "#c8d8e8", 24);
    for (let k = 0; k < 5; k++) {
      const y = B - 78 + k * 5;
      P.r(4, y, 56, 4, "#14161a");
      if (k !== 3 || v % 2 === 0) {
        mini(P, 5, y, "0" + SX.hash("db" + k + v) % 10 + ":" + (10 + SX.hash("dm" + k) % 50), "#e8a030");
        txt(P, 28, y + 2, 18, "#c88a28", g);
        P.r(50, y + 1, 8, 2, k === 0 ? "#c83a34" : "#4a8a52");
      }
    }
  });
  info("departBoard", {
    solid: true,
    cover: .1,
    mat: "metal",
    foot: {
      x0: .12,
      x1: .88,
      d: .18
    }
  });
  def("suitcase", 1, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#3a4a6a", "#a84a3a", "#2a2c30", "#6a5a3a" ][v % 4], R = RP(c);
    P.shadow(16, B - 2, 13, 3, .4);
    P.r(4, B - 16, 22, 12, R[3]).r(4, B - 16, 22, 2, R[5]).r(4, B - 16, 1, 12, R[4]).r(25, B - 16, 1, 12, R[1]).r(4, B - 5, 22, 1, R[1]);
    P.r(14, B - 19, 4, 3, "#2a2c30").r(4, B - 11, 22, 1, R[2]).r(8, B - 13, 4, 3, "#e8e4d8");
    if (v % 2) {
      P.r(16, B - 26, 12, 10, "#4a5a3a").r(16, B - 26, 12, 1, "#6a7a5a").r(18, B - 22, 8, 2, "#3a4a2a");
    }
  });
  info("suitcase", {
    solid: false,
    cover: .2,
    mat: "fabric"
  });
  def("fareGate", 1, 1, 22, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#8a9096", R = RP(c);
    sbox(P, 3, B - 3, 26, 5, .42);
    box(P, 5, B - 44, 14, 10, 40, c);
    P.r(7, B - 42, 9, 5, "#1a1c20").r(8, B - 41, 4, 2, v % 3 === 2 ? "#e85a4a" : "#5ae07a");
    P.r(7, B - 32, 9, 3, "#2a2c30").p(8, B - 31, v % 3 === 2 ? "#e85a4a" : "#5ae07a").p(10, B - 31, "#5ae07a");
    P.r(19, B - 30, 10, 12, "#7aa0ac").r(19, B - 30, 10, 1, "#c8dce4").r(28, B - 30, 1, 12, "#5a7a88").line(20, B - 20, 25, B - 29, "#a8c8d4");
    scratch(P, 6, B - 32, 12, 26, g, 3, R[5]);
    grime(P, 6, B - 8, 12, 5, g, 4);
  });
  info("fareGate", {
    solid: true,
    cover: .5,
    mat: "metal",
    foot: {
      x0: .15,
      x1: .92,
      d: .5
    }
  });
  def("turnstile", 1, 1, 18, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#a8aeb4", R = RP(c);
    sbox(P, 4, B - 3, 22, 5, .42);
    box(P, 6, B - 38, 12, 8, 34, c);
    P.oval(18, B - 30, 3, 3, "#5a5e64");
    for (const [dx, dy] of [ [ 11, -2 ], [ -2, -10 ], [ 2, 8 ] ]) P.thick(18, B - 30, 18 + dx, B - 30 + dy, 2, "#c8ccd0");
    P.r(8, B - 36, 7, 4, "#1a1c20").p(9, B - 35, "#5ae07a");
    rust(P, 7, B - 8, 10, 4, g, 2);
  });
  info("turnstile", {
    solid: true,
    cover: .4,
    mat: "metal",
    foot: {
      x0: .18,
      x1: .95,
      d: .45
    }
  });
  def("fireHose", 1, 1, 30, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#b8322e", R = RP(c);
    box(P, 5, B - 60, 22, 4, 30, c, {
      fi: 3
    });
    P.r(7, B - 54, 18, 14, "#3a1a18");
    P.ring(16, B - 47, 6, 5, "#c8c4b0").ring(16, B - 47, 4, 3, "#a8a490").p(16, B - 47, "#5a5e64");
    glass(P, 7, B - 54, 18, 14, {
      col: "#4a2a2a",
      gap: 10,
      wide: false
    });
    label(P, 5, B - 39, "소화전", "#f4f0e0", 7, 22);
    P.r(8, B - 30, 16, 2, R[1]);
  });
  info("fireHose", {
    solid: false,
    cover: 0,
    mat: "metal"
  });
  def("cableDrum", 1, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#8a6a42", R = RP(c);
    P.shadow(16, B - 2, 13, 3, .45);
    P.oval(16, B - 16, 13, 13, R[3]).oval(16, B - 16, 12, 12, R[4]).oval(16, B - 16, 9, 9, "#1e2024");
    for (let k = 0; k < 5; k++) P.ring(16, B - 16, 8 - k, 8 - k, k % 2 ? "#2a2c30" : "#3a3c42");
    P.oval(16, B - 16, 3, 3, R[2]).p(16, B - 16, R[0]);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * 6.283;
      P.p(16 + Math.cos(a) * 11, B - 16 + Math.sin(a) * 11, R[1]);
    }
    P.line(26, B - 10, 30, B - 3, "#2a2c30");
  });
  info("cableDrum", {
    solid: true,
    cover: .6,
    mat: "wood",
    foot: {
      x0: .06,
      x1: .94,
      d: .5
    }
  });
  def("milCrate", 1, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 3 === 2 ? "#6a6a4a" : "#56603e", R = RP(c);
    sbox(P, 1, B - 3, 30, 5, .42);
    box(P, 2, B - 32, 28, 9, 22, c, {
      fi: 3
    });
    for (const y of [ B - 30, B - 26 ]) P.r(3, y, 26, 1, R[2]);
    mini(P, 4, B - 20, [ "7.62", "5.56", "K2", "9MM" ][v % 4], "#e0dcc8", 24);
    P.r(3, B - 13, 26, 1, R[1]).r(3, B - 12, 26, 1, R[5]);
    for (const x of [ 5, 25 ]) P.r(x, B - 24, 3, 6, "#4a4e54").p(x + 1, B - 22, "#9aa0a8");
    scratch(P, 3, B - 22, 26, 18, g, 3, R[5]);
    grime(P, 3, B - 8, 26, 5, g, 4);
  });
  info("milCrate", {
    solid: true,
    cover: .6,
    mat: "wood",
    foot: {
      x0: .06,
      x1: .94,
      d: .6
    }
  });
  def("jerrycans", 1, 1, 10, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#56603e" : "#6a5a3a", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .42);
    for (let k = 0; k < 3; k++) {
      const x = 3 + k * 9;
      P.r(x, B - 24, 8, 22, R[3]).r(x, B - 24, 1, 22, R[4]).r(x + 7, B - 24, 1, 22, R[1]).r(x, B - 24, 8, 1, R[5]);
      P.line(x + 1, B - 20, x + 6, B - 6, R[2]).line(x + 6, B - 20, x + 1, B - 6, R[2]);
      P.r(x + 5, B - 27, 2, 3, "#3a3c40");
      P.r(x + 1, B - 27, 3, 2, R[2]);
    }
    rust(P, 3, B - 10, 26, 6, g, 4);
  });
  info("jerrycans", {
    solid: true,
    cover: .5,
    mat: "metal",
    foot: {
      x0: .06,
      x1: .94,
      d: .45
    }
  });
  def("mapTable", 2, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#6a5a40", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .4);
    box(P, 2, B - 32, 60, 16, 4, c);
    P.r(5, B - 31, 52, 14, "#c8c0a0").r(5, B - 31, 52, 1, "#e0d8b8");
    for (let k = 0; k < 6; k++) {
      let x = 8 + g.i(40), y = B - 29 + g.i(11);
      for (let s = 0; s < 8; s++) {
        P.p(x, y, "#8a9a7a");
        x += 1;
        y = Math.max(B - 30, Math.min(B - 18, y + g.i(3) - 1));
      }
    }
    P.line(10, B - 22, 50, B - 26, "#5a7aa0");
    for (let k = 0; k < 7; k++) P.r(8 + g.i(46), B - 30 + g.i(11), 2, 2, k % 2 ? "#c83a34" : "#3a5a9a");
    P.r(50, B - 30, 5, 6, "#2a2c28").r(51, B - 31, 3, 1, "#4a4e48");
    P.r(12, B - 26, 4, 4, "#e8e4d8").p(13, B - 25, "#4a2a18");
    for (const x of [ 4, 57 ]) P.r(x, B - 12, 3, 10, R[1]);
  });
  info("mapTable", {
    solid: true,
    cover: .45,
    mat: "wood",
    foot: {
      x0: .03,
      x1: .97,
      d: .55
    }
  });
  def("boomGate", 2, 1, 16, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#8a9096");
    sbox(P, 2, B - 3, 18, 5, .42);
    box(P, 3, B - 30, 12, 6, 28, "#c8ccd0");
    P.r(5, B - 22, 8, 4, "#c83a34");
    for (let x = 15; x < 62; x++) {
      const on = x - 15 >> 3 & 1;
      P.r(x, B - 34, 1, 4, on ? "#c83a34" : "#e8e8e0");
    }
    P.r(15, B - 34, 47, 1, "#f4f4f0").r(15, B - 31, 47, 1, "#8a8a84");
    P.r(56, B - 31, 2, 28, M[3]).r(54, B - 3, 6, 1, M[1]);
    rust(P, 4, B - 10, 10, 6, g, 3);
  });
  info("boomGate", {
    solid: true,
    cover: .2,
    mat: "metal",
    foot: {
      x0: .03,
      x1: .97,
      d: .22
    }
  });
  def("roadSign", 1, 1, 52, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#8a9096");
    P.shadow(16, B - 2, 6, 2, .4);
    P.r(15, B - 62, 3, 60, M[3]).r(15, B - 62, 1, 60, M[5]);
    if (v % 2) {
      P.r(3, B - 82, 26, 18, "#2e5a8a").r(3, B - 82, 26, 1, "#4e7aaa").r(4, B - 81, 24, 16, "#2a5282");
      label(P, 3, B - 81, "강북", "#f0f4f8", 7, 26);
      mini(P, 4, B - 71, "3KM", "#f0f4f8", 24);
    } else {
      P.oval(16, B - 72, 11, 11, "#c83a34").oval(16, B - 72, 9, 9, "#f0f0e8");
      mini(P, 9, B - 74, "60", "#1a1c20", 14);
    }
    rust(P, 15, B - 30, 3, 20, g, 3);
    if (v % 3 === 2) P.r(14, B - 40, 5, 8, "#d8d4c8");
  });
  info("roadSign", {
    solid: true,
    cover: .1,
    mat: "metal",
    foot: {
      x0: .38,
      x1: .62,
      d: .16
    }
  });
  def("motorbike", 2, 1, 16, (P, w, h, up, g, v) => mbike(P, w, h, up, g, v));
  function mbike(P, w, h, up, g, v, noSh) {
    const B = h - 2, c = [ "#a84a3a", "#3a5a8a", "#e8e4d8" ][v % 3], R = RP(c);
    if (!noSh) P.oval(32, B - 4, 28, 4, "rgba(0,0,0,0.3)").oval(40, B - 2, 7, 2, "rgba(10,10,12,0.35)");
    wheel(P, 12, B - 10, 8, "#26282c", "#6a6e74");
    wheel(P, 50, B - 10, 8, "#26282c", "#6a6e74");
    P.poly([ [ 16, B - 20 ], [ 44, B - 22 ], [ 48, B - 12 ], [ 18, B - 10 ] ], R[3]);
    P.poly([ [ 16, B - 20 ], [ 44, B - 22 ], [ 42, B - 18 ], [ 18, B - 16 ] ], R[4]);
    P.r(22, B - 26, 14, 5, "#2a2c30").r(22, B - 26, 14, 1, "#4a4e54");
    P.r(44, B - 30, 3, 10, "#5a5e64").r(42, B - 31, 8, 2, "#2a2c30");
    box(P, 2, B - 36, 16, 6, 12, v % 2 ? "#c8302a" : "#e8a030");
    label(P, 2, B - 28, "배달", "#f4f0e0", 7, 16);
    scratch(P, 16, B - 20, 30, 8, g, 3, R[5]);
    rust(P, 20, B - 14, 26, 4, g, 2);
  }
  info("motorbike", {
    solid: true,
    cover: .45,
    mat: "metal",
    foot: {
      x0: .02,
      x1: .98,
      d: .45
    }
  });
  function scoot(P, w, h, up, g, v, noSh) {
    const B = h - 2, R = RP([ "#e8e6de", "#2a2c30", "#c8402e", "#3a64a8" ][v % 4]), bx = [ [ "#c8302a", "#f4f0e0" ], [ "#e8e4d8", "#2a2c30" ], [ "#2a8a8a", "#f4f0e0" ], [ "#e8a030", "#3a2410" ] ][(v + 1) % 4];
    if (!noSh) P.oval(32, B - 2, 26, 3, "rgba(0,0,0,0.3)").oval(24, B - 1, 6, 1, "rgba(10,10,12,0.3)");
    for (const cx of [ 14, 50 ]) {
      P.oval(cx, B - 7, 7, 7, "#1a1b1e").oval(cx, B - 7, 4, 4, "#6a6e74").oval(cx, B - 7, 2, 2, "#a8aeb4");
      P.p(cx - 2, B - 9, "#c8ced4");
    }
    P.r(4, B - 14, 14, 3, "#6a6e74").r(4, B - 14, 14, 1, "#9aa0a6").r(3, B - 13, 1, 2, "#2a2c30");
    P.poly([ [ 7, B - 21 ], [ 12, B - 28 ], [ 36, B - 28 ], [ 38, B - 15 ], [ 32, B - 11 ], [ 10, B - 12 ] ], R[3]);
    P.poly([ [ 9, B - 22 ], [ 13, B - 27 ], [ 35, B - 27 ], [ 35, B - 24 ], [ 12, B - 22 ] ], R[4]).r(12, B - 13, 22, 2, R[2]).line(14, B - 24, 30, B - 23, R[5]);
    P.r(7, B - 22, 2, 3, "#c03a30").p(7, B - 22, "#e06050");
    P.r(32, B - 14, 13, 3, "#2a2c30").r(32, B - 14, 13, 1, "#4a4e54");
    P.poly([ [ 43, B - 13 ], [ 45, B - 31 ], [ 50, B - 35 ], [ 53, B - 32 ], [ 50, B - 13 ] ], R[3]);
    P.line(46, B - 30, 45, B - 15, R[5]).line(49, B - 14, 51, B - 31, R[2]);
    P.poly([ [ 43, B - 13 ], [ 48, B - 16 ], [ 55, B - 14 ], [ 57, B - 11 ], [ 44, B - 11 ] ], R[3]).line(45, B - 14, 54, B - 14, R[4]);
    P.r(52, B - 33, 4, 3, "#e8e0c0").p(55, B - 33, "#fffbe8").r(52, B - 30, 3, 1, "#e0902a");
    P.line(49, B - 35, 48, B - 40, "#3a3d42");
    P.r(44, B - 41, 10, 2, "#2a2c30").r(44, B - 41, 10, 1, "#4a4e54");
    P.line(47, B - 41, 45, B - 45, "#3a3d42");
    P.r(43, B - 47, 4, 3, "#2a2c30").p(44, B - 46, "#8aa0b0");
    P.r(17, B - 32, 20, 4, "#2a2c30").r(17, B - 32, 20, 1, "#4a4e54").r(35, B - 31, 3, 3, "#2a2c30");
    P.r(4, B - 30, 16, 2, "#3a3d42");
    box(P, 3, B - 44, 17, 5, 12, bx[0]);
    label(P, 3, B - 38, "배달", bx[1], 7, 17);
    P.r(3, B - 39, 17, 1, sh(bx[0], -.4));
    if (!noSh) P.line(30, B - 11, 26, B - 2, "#3a3d42").p(26, B - 1, "#2a2c30");
    scratch(P, 12, B - 26, 22, 10, g, 2, R[5]);
    rust(P, 12, B - 20, 22, 6, g, 2);
    if (v % 3 === 2) {
      P.r(48, B - 26, 2, 4, "#0e1014");
      crack(P, 51, B - 33, g, 3, "#d8e0e4");
    }
  }
  const crack = (P, cx, cy, g, n, col) => {
    for (let k = 0; k < n; k++) {
      const a = g.f() * Math.PI * 2, l = 2 + g.i(4);
      P.line(cx, cy, cx + Math.cos(a) * l, cy + Math.sin(a) * l, col);
    }
    return P;
  };
  def("scooter", 2, 1, 24, (P, w, h, up, g, v) => scoot(P, w, h, up, g, v));
  info("scooter", {
    solid: true,
    cover: .4,
    mat: "metal",
    foot: {
      x0: .04,
      x1: .96,
      d: .4
    }
  });
  def("bikeFall", 2, 1, 8, (P, w, h, up, g, v) => {
    const B = h - 2, t1 = A.mk(64, 56), T = new P.constructor(t1.getContext("2d"));
    (v & 1 ? mbike : scoot)(T, 64, 56, 24, g, v >> 1, true);
    const t2 = A.mk(w, h), X = t2.getContext("2d", {
      willReadFrequently: true
    });
    X.imageSmoothingEnabled = false;
    if (A.rotDot) {
      const s = t1.getContext("2d").getImageData(0, 0, 64, 56).data, t3 = A.mk(64, 28), g3 = t3.getContext("2d", {
        willReadFrequently: true
      }), i3 = g3.createImageData(64, 28), o = i3.data;
      for (let y = 0; y < 28; y++) for (let x = 0; x < 64; x++) {
        const a = (y * 128 + x) * 4, b = a + 256, k = s[b + 3] > s[a + 3] ? b : a, j = (y * 64 + x) * 4;
        o[j] = s[k];
        o[j + 1] = s[k + 1];
        o[j + 2] = s[k + 2];
        o[j + 3] = s[k + 3];
      }
      g3.putImageData(i3, 0, 0);
      const q = A.rotDot(t3, [ -.05, .04, -.02, .06 ][v % 4], 0, 32, 27, true);
      X.drawImage(q.c, 32 + q.ox, B - 3 + q.oy);
    } else {
      X.translate(32, B - 3);
      X.rotate([ -.05, .04, -.02, .06 ][v % 4]);
      X.scale(1, .5);
      X.drawImage(t1, -32, -54);
    }
    const im = X.getImageData(0, 0, w, h), d = im.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] < 110 ? 0 : 255;
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.putImageData(im, 0, 0);
    P.oval(32, B - 4, 29, 5, "rgba(0,0,0,0.26)").oval(20 + g.i(10), B - 2, 9 + g.i(4), 2, "rgba(14,12,16,0.42)");
    P.x.drawImage(t2, 0, 0);
    if (v % 3 !== 1) {
      const x = 50 + g.i(6), y = B - 7 + g.i(3);
      P.oval(x, y, 4, 3, v & 2 ? "#2a2c30" : "#e8e4d8").r(x - 3, y, 7, 1, "#5a5e64").p(x - 1, y - 2, "#f4f0e8");
    }
    for (let i = 0; i < 2 + g.i(2); i++) {
      const x = 4 + g.i(14), y = B - 9 + g.i(6);
      P.r(x, y, 5, 3, g.pick([ "#e8e4d8", "#c8a070", "#d8d0c0" ])).r(x, y, 5, 1, "#f4f0e8").r(x, y + 2, 5, 1, "#a89878");
    }
  });
  info("bikeFall", {
    solid: false,
    cover: .2,
    mat: "metal",
    foot: {
      none: true
    }
  });
  def("waterBarrier", 2, 1, 14, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#e8e4d8" : "#d86a2a", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .4);
    P.poly([ [ 6, B - 34 ], [ 58, B - 34 ], [ 62, B - 4 ], [ 2, B - 4 ] ], R[3]);
    P.r(6, B - 34, 52, 3, R[5]).r(6, B - 31, 52, 1, R[4]);
    for (const x of [ 14, 32, 50 ]) P.r(x - 3, B - 26, 6, 10, R[2]).r(x - 3, B - 26, 6, 1, R[1]);
    P.r(2, B - 6, 60, 2, R[1]);
    P.r(26, B - 33, 12, 2, "#2a2c30");
    grime(P, 4, B - 14, 56, 10, g, 10, "rgba(40,30,20,0.25)");
    scratch(P, 6, B - 30, 52, 22, g, 4, R[5]);
  });
  info("waterBarrier", {
    solid: true,
    cover: .55,
    mat: "plastic",
    foot: {
      x0: .02,
      x1: .98,
      d: .5
    }
  });
  def("kimchiFridge", 1, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#d8d0bc" : "#c8ccc4", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 3, B - 48, 26, 12, 34, c, {
      fi: 3
    });
    P.r(4, B - 46, 24, 4, R[5]).r(4, B - 41, 24, 1, R[2]).r(4, B - 39, 24, 1, R[2]);
    P.r(4, B - 34, 24, 3, "#b89a50").r(4, B - 34, 24, 1, "#d8ba70");
    P.r(9, B - 28, 14, 7, "#1e2622").r(10, B - 27, 5, 2, "#5ae0a0").r(16, B - 27, 6, 1, "#9ac8b8");
    P.r(12, B - 17, 8, 2, R[1]).r(12, B - 17, 8, 1, R[5]);
    if (v % 3 !== 2) {
      P.r(7, B - 52, 16, 5, "#c8a060").r(7, B - 52, 16, 1, "#e0c080");
      for (let x = 8; x < 22; x += 2) P.p(x, B - 50, "#a07a40");
    }
    grime(P, 4, B - 14, 24, 10, g, 6);
    rust(P, 4, B - 5, 24, 3, g, 2);
  });
  info("kimchiFridge", {
    solid: true,
    cover: .6,
    mat: "metal",
    foot: {
      x0: .08,
      x1: .92,
      d: .55
    },
    open: "openFridge"
  });
  def("shoeCabinet", 1, 1, 26, (P, w, h, up, g, v) => {
    const B = h - 2, c = v % 2 ? "#8a6a48" : "#b8aa90", R = RP(c);
    sbox(P, 2, B - 3, 28, 5, .42);
    box(P, 3, B - 50, 26, 8, 44, c, {
      fi: 3
    });
    for (const x of [ 4, 16 ]) {
      P.r(x, B - 41, 11, 36, R[3]).r(x, B - 41, 11, 1, R[4]).r(x, B - 41, 1, 36, R[4]).r(x + 10, B - 41, 1, 36, R[2]);
      for (let y = B - 37; y < B - 9; y += 4) P.r(x + 2, y, 7, 1, R[2]);
    }
    P.r(13, B - 26, 2, 4, "#c8b080").r(17, B - 26, 2, 4, "#c8b080");
    P.r(6, B - 54, 6, 5, "#a0583a").r(7, B - 58, 4, 4, "#4a7a3a");
    P.r(18, B - 52, 7, 3, "#c8ccd0").p(20, B - 53, "#d8b44a");
    if (v % 3 === 1) {
      P.r(3, B - 5, 6, 3, "#3a3a3e").r(22, B - 5, 6, 3, "#a84a3a");
    }
    scratch(P, 4, B - 40, 24, 34, g, 3, R[5]);
  });
  info("shoeCabinet", {
    solid: true,
    cover: .55,
    mat: "wood",
    foot: {
      x0: .08,
      x1: .92,
      d: .45
    },
    open: "openCupboard"
  });
  def("lowTable", 1, 1, 6, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#8a5a32", R = RP(c);
    P.shadow(16, B - 3, 14, 3, .4);
    P.oval(16, B - 16, 14, 8, R[2]).oval(16, B - 17, 14, 7, R[4]).oval(16, B - 17, 12, 6, R[3]);
    for (const [x, y, cc] of [ [ 10, -18, "#e8e4d8" ], [ 17, -20, "#c84a3a" ], [ 21, -15, "#e8e4d8" ], [ 12, -14, "#5a8a3a" ] ]) P.oval(x, B + y, 2, 1, cc).p(x - 1, B + y - 1, "#ffffff");
    if (v % 2) P.line(19, B - 13, 25, B - 17, "#c8ccd0").line(20, B - 12, 26, B - 16, "#c8ccd0");
    P.r(8, B - 11, 2, 7, R[1]).r(22, B - 11, 2, 7, R[1]);
  });
  info("lowTable", {
    solid: true,
    cover: .25,
    mat: "wood",
    foot: {
      x0: .08,
      x1: .92,
      d: .5
    }
  });
  def("dryRack", 2, 1, 24, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#c8ccd0");
    sbox(P, 4, B - 3, 56, 4, .3);
    P.line(6, B - 2, 18, B - 44, M[3]).line(58, B - 2, 46, B - 44, M[3]).line(6, B - 44, 18, B - 2, M[2]).line(58, B - 44, 46, B - 2, M[2]);
    for (const y of [ B - 44, B - 38 ]) P.r(10, y, 44, 1, M[4]);
    const cols = [ "#e8e4d8", "#a8c0d8", "#d8a0a8", "#c8c4a0", "#5a6a8a", "#e0d0b0" ];
    let x = 12;
    while (x < 50) {
      const c = cols[g.i(cols.length)], R = RP(c), cw = 5 + g.i(4), ch = 9 + g.i(10);
      P.r(x, B - 43, cw, ch, R[3]).r(x, B - 43, cw, 1, R[5]).r(x + cw - 1, B - 43, 1, ch, R[1]);
      P.p(x + 1, B - 44, "#e85a4a");
      x += cw + 1;
    }
  });
  info("dryRack", {
    solid: true,
    cover: .12,
    mat: "fabric",
    foot: {
      x0: .06,
      x1: .94,
      d: .3
    }
  });
  def("cushion", 1, 1, 2, (P, w, h, up, g, v) => {
    const B = h - 2, c = [ "#a84a4a", "#4a6a8a", "#c8a04a", "#6a8a5a" ][v % 4], R = RP(c);
    P.r(5, B - 22, 22, 18, R[2]).r(5, B - 22, 22, 2, R[4]).r(6, B - 21, 20, 15, R[3]);
    P.p(16, B - 13, R[1]).p(15, B - 13, R[5]);
    for (let k = 0; k < 4; k++) P.p(7 + k * 6, B - 6, R[1]);
  });
  info("cushion", {
    solid: false,
    cover: 0,
    mat: "fabric"
  });
  def("camTripod", 1, 1, 40, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#5a5e64");
    P.shadow(16, B - 2, 10, 3, .4);
    P.line(16, B - 38, 5, B - 3, M[3]).line(16, B - 38, 27, B - 3, M[3]).line(16, B - 38, 16, B - 2, M[2]);
    box(P, 7, B - 58, 18, 6, 14, "#2a2c32");
    P.r(23, B - 54, 6, 6, "#1a1c20").oval(27, B - 51, 2, 3, "#3a5a7a").p(27, B - 52, "#9ac8e8");
    P.p(9, B - 56, v % 2 ? "#e85a4a" : "#3a3c40");
    P.r(9, B - 50, 10, 3, "#3a3c42");
    mini(P, 8, B - 57, "NEWS", "#d8d4c8", 16);
    P.line(10, B - 44, 4, B - 30, "#2a2c30");
  });
  info("camTripod", {
    solid: true,
    cover: .2,
    mat: "metal",
    foot: {
      x0: .14,
      x1: .86,
      d: .25
    }
  });
  def("studioLight", 1, 1, 48, (P, w, h, up, g, v) => {
    const B = h - 2, M = RP("#5a5e64");
    P.shadow(16, B - 2, 9, 2, .4);
    P.line(16, B - 30, 7, B - 3, M[3]).line(16, B - 30, 25, B - 3, M[3]);
    P.r(15, B - 64, 2, 36, M[3]).r(15, B - 64, 1, 36, M[5]);
    P.poly([ [ 4, B - 80 ], [ 28, B - 80 ], [ 24, B - 62 ], [ 8, B - 62 ] ], "#2a2c30");
    P.poly([ [ 6, B - 78 ], [ 26, B - 78 ], [ 23, B - 64 ], [ 9, B - 64 ] ], v % 2 ? "#e8e4d0" : "#9a968a");
    P.r(14, B - 62, 4, 3, "#3a3c40");
  });
  info("studioLight", {
    solid: true,
    cover: .1,
    mat: "metal",
    foot: {
      x0: .18,
      x1: .82,
      d: .2
    }
  });
  def("mixDesk", 2, 1, 20, (P, w, h, up, g, v) => {
    const B = h - 2, c = "#2e3036", R = RP(c);
    sbox(P, 1, B - 3, 62, 5, .42);
    box(P, 2, B - 40, 60, 18, 18, c);
    for (let k = 0; k < 12; k++) {
      const x = 5 + k * 4.6 | 0;
      P.r(x, B - 38, 1, 13, "#1a1c20");
      P.r(x - 1, B - 36 + g.i(9), 3, 2, "#c8ccd0");
      P.p(x, B - 39, g.pick([ "#5ae07a", "#e8d050", "#e85a4a", "#3a3c40" ]));
    }
    P.r(4, B - 22, 22, 6, "#1a1c20");
    for (let k = 0; k < 2; k++) {
      P.r(6 + k * 10, B - 21, 8, 4, "#e8d8a0").line(10 + k * 10, B - 18, 8 + k * 10 + g.i(4), B - 21, "#2a2c30");
    }
    P.r(30, B - 22, 30, 18, R[3]);
    for (let x = 32; x < 58; x += 3) P.r(x, B - 20, 1, 14, R[1]);
  });
  info("mixDesk", {
    solid: true,
    cover: .6,
    mat: "metal",
    foot: {
      x0: .02,
      x1: .98,
      d: .6
    }
  });
  for (const k of AP.KINDS) {
    const o = AP.INFO[k];
    A.PROP_MAT[k] = o.mat;
    A.defPropRot(k, {
      noRot: true
    });
  }
})(window.SX);
