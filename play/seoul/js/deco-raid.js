"use strict";

(function(SX) {
  const TS = SX.TS, A = SX.art, M = SX.map, T = M.T, FS = A.FS;
  const DR = SX.decoRaid = {
    on: true,
    KEEP: .5
  };
  const CH = 16, CPX = CH * TS;
  const sh = A.shade, RP = A.ramp;
  const PP = () => A.PP;
  const K = DR.K = {};
  const KL = [];
  const def = (name, o) => {
    o.name = name;
    o.nv = o.nv || 6;
    o.L = o.L == null ? o.mark ? 0 : 2 : o.L;
    o.idx = KL.length;
    KL.push(o);
    K[name] = o;
    return o;
  };
  const pick = (g, a) => a[g.i(a.length)];
  const rgba = (r, g, b, a) => "rgba(" + r + "," + g + "," + b + "," + a + ")";
  def("stain", {
    w: 30,
    h: 18,
    mark: true,
    nv: 10,
    draw(P, g, v) {
      const col = [ [ 20, 22, 26, .22 ], [ 60, 40, 22, .22 ], [ 12, 14, 20, .26 ], [ 96, 56, 30, .2 ], [ 70, 22, 20, .16 ], [ 30, 34, 28, .2 ] ][v % 6];
      const c = rgba(col[0], col[1], col[2], col[3]), c2 = rgba(col[0], col[1], col[2], (col[3] * .7).toFixed(3));
      const cx = 15, cy = 9, rx = 7 + g.i(6), ry = 4 + g.i(3);
      P.oval(cx, cy, rx, ry, c);
      for (let k = 0; k < 4; k++) P.oval(cx - rx + g.i(rx * 2), cy - ry + g.i(ry * 2), 2 + g.i(4), 1 + g.i(3), c2);
      for (let k = 0; k < 5; k++) P.p(cx - rx - 2 + g.i(rx * 2 + 4), cy - ry - 1 + g.i(ry * 2 + 2), c);
    }
  });
  def("spill", {
    w: 14,
    h: 8,
    mark: true,
    nv: 6,
    draw(P, g, v) {
      const c = [ rgba(70, 44, 24, .3), rgba(20, 26, 34, .26), rgba(90, 30, 40, .22) ][v % 3];
      P.oval(6, 4, 4 + g.i(2), 2, c).oval(10, 5, 2, 1, c);
      P.p(2 + g.i(3), 6, c).p(12, 2 + g.i(2), c);
    }
  });
  def("crack", {
    w: 26,
    h: 20,
    mark: true,
    nv: 8,
    draw(P, g) {
      const c = rgba(0, 0, 0, .32), c2 = rgba(0, 0, 0, .18), lt = rgba(255, 255, 255, .06);
      let x = 2 + g.i(6), y = 2 + g.i(4);
      const br = [];
      for (let k = 0; k < 22; k++) {
        P.p(x, y, c);
        P.p(x + 1, y + 1, lt);
        if (g.chance(.18)) br.push([ x, y ]);
        x += g.chance(.7) ? 1 : 0;
        y += g.chance(.55) ? 1 : g.chance(.3) ? -1 : 0;
        x = Math.min(25, x);
        y = Math.max(0, Math.min(19, y));
      }
      for (const [bx, by] of br) {
        let xx = bx, yy = by;
        const dy = g.chance(.5) ? 1 : -1;
        for (let s = 0; s < 3 + g.i(5); s++) {
          xx += g.chance(.5) ? 1 : 0;
          yy += dy;
          if (yy < 0 || yy > 19) break;
          P.p(xx, yy, c2);
        }
      }
    }
  });
  def("scuff", {
    w: 16,
    h: 7,
    mark: true,
    nv: 6,
    draw(P, g) {
      const c = g.chance(.5) ? rgba(0, 0, 0, .22) : rgba(255, 250, 235, .1);
      for (let k = 0; k < 2 + g.i(3); k++) {
        const y = 1 + g.i(5), x = g.i(4), l = 6 + g.i(9);
        for (let s = 0; s < l; s++) P.p(x + s, y + Math.round(Math.sin(s / l * 3.1) * 1.2), c);
      }
    }
  });
  def("dust", {
    w: 22,
    h: 12,
    mark: true,
    nv: 6,
    draw(P, g) {
      P.oval(11, 6, 9, 4, rgba(200, 190, 168, .1)).oval(11, 6, 5, 2, rgba(200, 190, 168, .08));
      for (let k = 0; k < 22; k++) P.p(1 + g.i(20), 1 + g.i(10), rgba(210, 200, 180, .26));
    }
  });
  def("prints", {
    w: 12,
    h: 12,
    mark: true,
    nv: 8,
    draw(P, g, v) {
      const c = v & 4 ? rgba(215, 205, 185, .2) : rgba(10, 8, 6, .26), d = v & 3;
      const foot = (x, y) => {
        if (d === 0) P.r(x, y, 3, 4, c).r(x, y + 5, 3, 2, c); else if (d === 2) P.r(x, y, 3, 2, c).r(x, y + 3, 3, 4, c); else if (d === 1) P.r(x, y, 2, 3, c).r(x + 3, y, 4, 3, c); else P.r(x, y, 4, 3, c).r(x + 5, y, 2, 3, c);
      };
      if (d === 0 || d === 2) {
        foot(2, 1 + (d === 0 ? 0 : 3));
        foot(7, 4 - (d === 0 ? 0 : 3));
      } else {
        foot(1 + (d === 1 ? 0 : 3), 2);
        foot(4 - (d === 1 ? 0 : 3), 7);
      }
    }
  });
  def("paws", {
    w: 12,
    h: 9,
    mark: true,
    nv: 4,
    draw(P, g) {
      const c = rgba(12, 10, 8, .2);
      for (const [x, y] of [ [ 1, 1 ], [ 6, 4 ], [ 2, 6 ] ]) {
        P.r(x, y + 1, 2, 2, c).p(x - 1, y, c).p(x + 1, y - 1, c).p(x + 2, y, c);
      }
    }
  });
  def("puddle", {
    w: 28,
    h: 14,
    mark: true,
    nv: 6,
    draw(P, g) {
      const rx = 9 + g.i(4), ry = 4 + g.i(2);
      P.oval(14, 7, rx, ry, rgba(16, 26, 38, .42)).oval(14 + g.i(3) - 1, 7, rx - 3, ry - 1, rgba(30, 46, 62, .35));
      P.r(14 - rx + 3, 7 - ry + 1, 4 + g.i(4), 1, rgba(150, 175, 195, .28)).p(14 + rx - 4, 7 + ry - 2, rgba(150, 175, 195, .22));
    }
  });
  def("drain", {
    w: 10,
    h: 10,
    mark: true,
    L: 1,
    nv: 2,
    draw(P, g, v) {
      P.r(0, 0, 10, 10, "#3c3e42").r(1, 1, 8, 8, "#25272a");
      for (let k = 2; k < 9; k += 2) P.r(2, k, 6, 1, "#5a5d62");
      P.r(0, 0, 10, 1, "#6a6d72").r(0, 9, 10, 1, "#2a2c30");
      if (v) P.p(7, 2, "#8a5a32").p(3, 7, "#8a5a32");
    }
  });
  def("manhole", {
    w: 28,
    h: 28,
    mark: true,
    L: 1,
    nv: 3,
    draw(P, g, v) {
      P.oval(14, 14, 13, 13, "#2a2b2e").oval(14, 14, 12, 12, "#4a4b4f").oval(14, 14, 10, 10, "#404145");
      for (let y = 6; y <= 22; y += 3) for (let x = 6; x <= 22; x += 3) if ((x - 14) * (x - 14) + (y - 14) * (y - 14) < 90) P.r(x, y, 2, 1, "#56585c");
      P.r(9, 13, 10, 2, "#36373a");
      if (v !== 1) PP().mini(P, 9, 12, v ? "SEW" : "TEL", "#5e6064");
      for (let k = 0; k < 6; k++) P.p(4 + g.i(20), 4 + g.i(20), "#6a4a30");
      P.ring(14, 14, 12, 12, "#5a5b60");
    }
  });
  def("grate", {
    w: 28,
    h: 10,
    mark: true,
    L: 1,
    nv: 2,
    draw(P, g) {
      P.r(0, 0, 28, 10, "#26282b").r(1, 1, 26, 8, "#1a1b1d");
      for (let x = 3; x < 26; x += 3) P.r(x, 1, 1, 8, "#55585d");
      P.r(0, 0, 28, 1, "#6a6c70");
      for (let k = 0; k < 4; k++) P.p(2 + g.i(24), 2 + g.i(6), "#5a4a30");
    }
  });
  def("leaves", {
    w: 14,
    h: 10,
    mark: true,
    L: 1,
    nv: 8,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(3); k++) {
        const c = pick(g, [ "#8a6a2a", "#a07a28", "#7a4a22", "#b8962e", "#6a5a2a" ]), x = 1 + g.i(10), y = 1 + g.i(7);
        P.r(x, y, 3, 2, c).p(x + 1, y - 1, c).p(x + 3, y + 1, sh(c, -.3)).p(x, y + 2, sh(c, -.3));
      }
    }
  });
  def("butts", {
    w: 8,
    h: 5,
    mark: true,
    L: 1,
    nv: 6,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(3); k++) {
        const x = g.i(5), y = g.i(4);
        if (g.chance(.5)) P.r(x, y, 2, 1, "#a8a29a").p(x + 2, y, "#a8743a"); else P.p(x, y, "#a8a29a").p(x, y + 1, "#a8743a");
      }
    }
  });
  def("glass", {
    w: 12,
    h: 9,
    mark: true,
    L: 1,
    nv: 8,
    draw(P, g) {
      for (let k = 0; k < 5 + g.i(5); k++) {
        const x = g.i(11), y = g.i(8), c = pick(g, [ "#7a9aa6", "#6a8692", "#8aacb6" ]);
        P.p(x, y, c);
        if (g.chance(.5)) P.p(x + 1, y, sh(c, -.25));
        if (g.chance(.3)) P.p(x, y + 1, sh(c, -.25));
      }
      P.p(2 + g.i(8), 1 + g.i(6), "#c8e0e6");
    }
  });
  def("chips", {
    w: 11,
    h: 7,
    mark: true,
    L: 1,
    nv: 8,
    draw(P, g) {
      for (let k = 0; k < 4 + g.i(5); k++) {
        const x = g.i(9), y = g.i(6), c = pick(g, [ "#7a7a76", "#8a8984", "#6a6a66", "#94928a" ]);
        P.r(x, y, 1 + g.i(2), 1 + g.i(2), c);
        P.p(x, y + 1, sh(c, -.35));
      }
    }
  });
  def("casings", {
    w: 9,
    h: 5,
    mark: true,
    L: 1,
    nv: 6,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(3); k++) {
        const x = g.i(6), y = g.i(4);
        P.r(x, y + 1, 3, 1, "#5a4622").r(x, y, 3, 1, "#8a7036").p(x, y, "#a8904e");
      }
    }
  });
  def("nails", {
    w: 7,
    h: 5,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      for (let k = 0; k < 3 + g.i(3); k++) {
        const x = g.i(6), y = g.i(4);
        P.p(x, y, "#8a8c90");
        if (g.chance(.5)) P.p(x + 1, y, "#55575b"); else P.p(x, y + 1, "#55575b");
      }
    }
  });
  def("bolts", {
    w: 7,
    h: 5,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(3); k++) {
        const x = g.i(5), y = g.i(3);
        P.r(x, y, 2, 2, "#6a6c70").p(x, y, "#9a9ca0").p(x + 1, y + 1, "#3a3c40");
      }
    }
  });
  def("sand", {
    w: 16,
    h: 9,
    mark: true,
    nv: 6,
    draw(P, g) {
      P.oval(8, 5, 6, 2, rgba(150, 128, 90, .18));
      for (let k = 0; k < 22; k++) P.p(1 + g.i(14), 1 + g.i(7), pick(g, [ "#8a7650", "#9a845a", "#7a6646" ]));
    }
  });
  def("scorch", {
    w: 26,
    h: 16,
    mark: true,
    nv: 6,
    draw(P, g) {
      P.oval(13, 8, 11, 6, rgba(14, 12, 10, .22)).oval(13, 8, 6, 3, rgba(10, 8, 6, .3));
      for (let k = 0; k < 24; k++) P.p(2 + g.i(22), 2 + g.i(12), g.chance(.5) ? rgba(20, 18, 16, .4) : rgba(50, 44, 38, .35));
    }
  });
  def("gum", {
    w: 9,
    h: 7,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(4); k++) {
        const x = g.i(8), y = g.i(6);
        P.r(x, y, 2, 1, rgba(20, 20, 22, .35));
      }
    }
  });
  def("drop", {
    w: 7,
    h: 5,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(2, 1, 3, 2, "#c8c6bc").p(1, 2, "#a8a69c").p(5, 3, "#c8c6bc").p(3, 3, "#5a5a50");
    }
  });
  def("weedsM", {
    w: 10,
    h: 6,
    mark: true,
    L: 1,
    nv: 6,
    draw(P, g) {
      for (let k = 0; k < 5 + g.i(5); k++) P.p(g.i(10), g.i(6), pick(g, [ "#4a5a32", "#566a3a", "#3e4c2a" ]));
    }
  });
  def("pebbles", {
    w: 10,
    h: 6,
    mark: true,
    L: 1,
    nv: 6,
    draw(P, g) {
      for (let k = 0; k < 4 + g.i(4); k++) {
        const x = g.i(8), y = g.i(5), c = pick(g, [ "#8a847a", "#7a746a", "#9a9488" ]);
        P.r(x, y, 2, 1, c).p(x, y + 1, sh(c, -.35)).p(x + 1, y + 1, sh(c, -.2));
      }
    }
  });
  def("food", {
    w: 10,
    h: 6,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      for (let k = 0; k < 6 + g.i(5); k++) P.p(g.i(10), g.i(6), pick(g, [ "#d8d2c0", "#c8c0a8", "#a8743a", "#7a8a3a" ]));
    }
  });
  def("chalkD", {
    w: 12,
    h: 6,
    mark: true,
    nv: 4,
    draw(P, g) {
      P.oval(6, 3, 5, 2, rgba(230, 230, 220, .1));
      for (let k = 0; k < 10; k++) P.p(1 + g.i(10), 1 + g.i(4), rgba(235, 235, 225, .3));
    }
  });
  def("survey", {
    w: 16,
    h: 12,
    mark: true,
    nv: 8,
    draw(P, g, v) {
      const c = v & 1 ? "#c8662a" : "#b8a030";
      if ((v >> 1) % 3 === 0) {
        P.line(2, 2, 11, 10, c).line(11, 2, 2, 10, c);
      } else if ((v >> 1) % 3 === 1) {
        P.r(1, 5, 11, 2, c).line(9, 2, 13, 6, c).line(9, 9, 13, 6, c);
      } else {
        P.r(1, 5, 4, 2, c).r(7, 5, 4, 2, c);
      }
    }
  });
  def("sticker", {
    w: 13,
    h: 8,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g, v) {
      P.r(0, 0, 13, 8, "#2f6a3a").r(0, 0, 13, 1, "#3f8a4c").r(0, 7, 13, 1, "#22502c");
      const c = "#c8e0c0", d = v & 3;
      if (d === 0) {
        P.r(3, 3, 6, 2, c).line(7, 1, 10, 4, c).line(7, 6, 10, 3, c);
      } else if (d === 2) {
        P.r(4, 3, 6, 2, c).line(5, 1, 2, 4, c).line(5, 6, 2, 3, c);
      } else if (d === 1) {
        P.r(5, 2, 3, 5, c).r(4, 2, 5, 1, c).p(6, 1, c);
      } else {
        P.r(5, 1, 3, 5, c).r(4, 5, 5, 1, c).p(6, 6, c);
      }
      P.r(0, 0, 1, 1, "#22502c").r(12, 0, 1, 1, "#22502c");
    }
  });
  def("tireT", {
    w: 14,
    h: 32,
    mark: true,
    nv: 4,
    draw(P, g, v) {
      const c = rgba(20, 14, 10, .2), c2 = rgba(20, 14, 10, .12), hz = v & 1;
      for (let k = 0; k < 32; k += 3) {
        if (hz) {
          if (k < 14) {
            P.r(k, 2, 2, 3, c).r(k, 9, 2, 3, c);
          }
        } else {
          P.r(2, k, 3, 2, c).r(9, k, 3, 2, c);
        }
      }
      if (!hz) P.r(1, 0, 1, 32, c2).r(12, 0, 1, 32, c2);
    }
  });
  def("oil", {
    w: 20,
    h: 11,
    mark: true,
    nv: 4,
    draw(P, g) {
      P.oval(10, 5, 8, 4, rgba(8, 8, 14, .32)).oval(9, 5, 4, 2, rgba(8, 8, 14, .2));
      P.p(6 + g.i(6), 3 + g.i(3), rgba(120, 90, 160, .35)).p(8 + g.i(4), 5, rgba(80, 140, 120, .3));
    }
  });
  def("patch", {
    w: 26,
    h: 18,
    mark: true,
    nv: 4,
    draw(P, g) {
      const w = 14 + g.i(10), h = 8 + g.i(8);
      P.r(1, 1, w, h, "#2e3034").r(1, 1, w, 1, "#3e4044").noise(1, 1, w, h, [ "#26282c", "#36383c" ], .25, g);
    }
  });
  def("skid", {
    w: 32,
    h: 12,
    mark: true,
    nv: 4,
    draw(P, g) {
      const c = rgba(10, 10, 12, .3);
      for (const y0 of [ 2, 8 ]) {
        let y = y0;
        for (let x = 0; x < 30; x++) {
          P.p(x + 1, y, c).p(x + 1, y + 1, rgba(10, 10, 12, .15));
          if (g.chance(.15)) y += g.chance(.5) ? 1 : -1;
          y = Math.max(0, Math.min(10, y));
        }
      }
    }
  });
  const arrowWear = (P, g, w, h) => {
    const x = P.x;
    x.save();
    x.globalCompositeOperation = "source-atop";
    for (let k = 0; k < 46; k++) P.p(g.i(w), g.i(h), "rgba(57,59,64,0.85)");
    x.restore();
  };
  def("roadArrowV", {
    w: 18,
    h: 30,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g, v) {
      const c = "#b0ac9f", up = !(v & 1), turn = v & 2;
      if (up) {
        P.r(7, 10, 4, 19, c).poly([ [ 9, 0 ], [ 17, 11 ], [ 1, 11 ] ], c);
        if (turn) P.r(11, 17, 4, 3, c).poly([ [ 15, 13 ], [ 18, 18 ], [ 15, 23 ] ], c);
      } else {
        P.r(7, 1, 4, 19, c).poly([ [ 9, 30 ], [ 17, 19 ], [ 1, 19 ] ], c);
        if (turn) P.r(3, 10, 4, 3, c).poly([ [ 3, 6 ], [ 0, 11 ], [ 3, 16 ] ], c);
      }
      arrowWear(P, g, 18, 30);
    }
  });
  def("roadArrowH", {
    w: 30,
    h: 18,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g, v) {
      const c = "#b0ac9f", right = !(v & 1), turn = v & 2;
      if (right) {
        P.r(1, 7, 19, 4, c).poly([ [ 30, 9 ], [ 19, 1 ], [ 19, 17 ] ], c);
        if (turn) P.r(10, 3, 3, 4, c).poly([ [ 6, 3 ], [ 11, 0 ], [ 16, 3 ] ], c);
      } else {
        P.r(10, 7, 19, 4, c).poly([ [ 0, 9 ], [ 11, 1 ], [ 11, 17 ] ], c);
        if (turn) P.r(17, 11, 3, 4, c).poly([ [ 13, 15 ], [ 18, 18 ], [ 23, 15 ] ], c);
      }
      arrowWear(P, g, 30, 18);
    }
  });
  def("tag", {
    w: 18,
    h: 12,
    mark: true,
    nv: 6,
    draw(P, g, v) {
      const c = pick(g, [ "#a8382e", "#3a5aa0", "#c8c4b8", "#3a8a4a" ]);
      if (v % 3 === 0) {
        let x = 1, y = 6;
        for (let k = 0; k < 15; k++) {
          P.r(x, y, 1, 2, c);
          x += 1;
          y += g.chance(.5) ? g.chance(.5) ? 1 : -1 : 0;
          y = Math.max(1, Math.min(9, y));
        }
      } else if (v % 3 === 1) {
        P.ring(8, 6, 5, 4, c);
        P.line(4, 3, 12, 9, c);
      } else {
        P.line(2, 2, 14, 10, c).line(14, 2, 2, 10, c);
      }
    }
  });
  def("tracks", {
    w: 14,
    h: 6,
    mark: true,
    nv: 4,
    draw(P, g) {
      const c = rgba(10, 10, 10, .2);
      P.r(0, 1, 14, 1, c).r(0, 4, 14, 1, c);
    }
  });
  def("baseDust", {
    w: 32,
    h: 7,
    mark: true,
    nv: 8,
    draw(P, g) {
      for (let x = 0; x < 32; x++) {
        const h = 1 + (x * 5 + g.i(3)) % 4;
        P.r(x, 0, 1, h, rgba(20, 18, 14, .18));
      }
      for (let k = 0; k < 10; k++) P.p(g.i(32), 1 + g.i(5), pick(g, [ rgba(200, 190, 170, .28), rgba(30, 26, 20, .3) ]));
      if (g.chance(.5)) {
        const x = g.i(28);
        P.r(x, 2, 2, 1, "#77756e").p(x + 2, 3, "#5a5852");
      }
    }
  });
  def("sideDust", {
    w: 6,
    h: 32,
    mark: true,
    nv: 6,
    draw(P, g, v) {
      const R = v & 1;
      for (let y = 0; y < 32; y++) {
        const w = 1 + (y * 3 + g.i(3)) % 3;
        P.r(R ? 6 - w : 0, y, w, 1, rgba(20, 18, 14, .16));
      }
      for (let k = 0; k < 6; k++) P.p(R ? 3 + g.i(3) : g.i(3), g.i(32), rgba(200, 190, 170, .26));
    }
  });
  def("bits", {
    w: 14,
    h: 10,
    mark: true,
    L: 1,
    nv: 8,
    draw(P, g) {
      for (let k = 0; k < 4 + g.i(5); k++) {
        const x = g.i(13), y = g.i(9), c = pick(g, [ "#a8a494", "#9a9a92", "#b0a890", "#8a96a0", "#a89a8a" ]);
        P.p(x, y, c);
        if (g.chance(.5)) P.p(x + 1, y, sh(c, -.2));
      }
    }
  });
  def("grit", {
    w: 12,
    h: 8,
    mark: true,
    nv: 8,
    draw(P, g) {
      for (let k = 0; k < 8 + g.i(8); k++) P.p(g.i(12), g.i(8), pick(g, [ rgba(24, 20, 16, .32), rgba(200, 190, 170, .2), rgba(60, 50, 40, .3) ]));
    }
  });
  def("rubble", {
    w: 20,
    h: 11,
    mark: true,
    L: 1,
    nv: 6,
    draw(P, g) {
      P.oval(10, 7, 9, 3, rgba(160, 150, 130, .12));
      for (let k = 0; k < 14; k++) {
        const x = 2 + g.i(15), y = 2 + g.i(7), c = pick(g, [ "#7a7a76", "#8a8984", "#6a6a66", "#94928a", "#5e5e5a" ]), w = 1 + g.i(3), h = 1 + g.i(2);
        P.r(x, y, w, h, c).r(x, y + h, w, 1, sh(c, -.4));
      }
    }
  });
  def("ceil", {
    w: 14,
    h: 12,
    L: 1,
    nv: 6,
    draw(P, g, v) {
      const c = pick(g, [ "#a09c90", "#98968c", "#a8a498" ]);
      P.r(0, 0, 14, 12, c).r(0, 0, 14, 1, sh(c, .1)).r(13, 0, 1, 12, sh(c, -.18)).r(0, 11, 14, 1, sh(c, -.18));
      for (let y = 2; y < 11; y += 3) for (let x = 2; x < 13; x += 3) P.p(x, y, sh(c, -.25));
      if (v & 1) P.x.clearRect(10, 8, 4, 4);
      if (v & 2) P.r(2 + g.i(8), 4 + g.i(5), 3, 2, "rgba(110,80,40,0.6)");
    }
  });
  def("blanket", {
    w: 18,
    h: 11,
    L: 1,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#5a4a6a", "#3a5a6a", "#6a4a3a", "#5a6a4a", "#7a6a4a" ]);
      P.r(0, 0, 18, 11, c).r(0, 0, 18, 1, sh(c, .18)).r(0, 10, 18, 1, sh(c, -.25));
      for (let k = 0; k < 3; k++) {
        const y = 2 + g.i(7);
        P.r(1, y, 16, 1, sh(c, -.15));
      }
      P.r(13, 1, 4, 3, sh(c, .25)).r(2, 7, 4, 1, sh(c, .12));
    }
  });
  def("pallet", {
    w: 18,
    h: 13,
    L: 1,
    nv: 3,
    draw(P, g) {
      const c = pick(g, [ "#7a603e", "#86684a", "#6e5638" ]);
      for (let y = 0; y < 13; y += 4) P.r(0, y, 18, 3, c).r(0, y, 18, 1, sh(c, .2));
      P.r(1, 0, 2, 13, sh(c, -.2)).r(8, 0, 2, 13, sh(c, -.2)).r(15, 0, 2, 13, sh(c, -.2));
    }
  });
  def("tarp", {
    w: 20,
    h: 12,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#3a5a8a", "#3a6a4a", "#6a6a6a" ]);
      P.poly([ [ 0, 3 ], [ 14, 0 ], [ 20, 6 ], [ 17, 12 ], [ 3, 11 ] ], c);
      P.line(3, 4, 16, 2, sh(c, .2)).line(5, 9, 17, 7, sh(c, -.25));
      P.p(2, 4, "#a8a69c").p(16, 1, "#a8a69c");
    }
  });
  def("paper", {
    w: 9,
    h: 7,
    L: 1,
    nv: 8,
    draw(P, g, v) {
      const c = pick(g, [ "#a9a493", "#b1ac9a", "#9fa096", "#aaa391" ]), ln = sh(c, -.32);
      if (v & 1) {
        P.poly([ [ 0, 2 ], [ 7, 0 ], [ 9, 5 ], [ 2, 7 ] ], c);
        P.r(2, 3, 4, 1, ln).r(3, 5, 3, 1, ln);
      } else {
        P.r(0, 0, 9, 7, c).r(0, 0, 9, 1, sh(c, .08));
        for (let y = 2; y < 6; y += 2) P.r(1, y, 3 + g.i(5), 1, ln);
        if (v & 2) P.p(8, 0, sh(c, -.18)).p(7, 0, sh(c, -.1));
      }
    }
  });
  def("papers", {
    w: 15,
    h: 10,
    L: 1,
    nv: 6,
    draw(P, g) {
      for (let k = 0; k < 2 + g.i(2); k++) {
        const c = pick(g, [ "#a9a493", "#b1ac9a", "#9fa096", "#a39d8c" ]), x = g.i(6), y = g.i(4);
        if (g.chance(.5)) P.r(x, y, 8, 6, c).r(x + 1, y + 2, 4 + g.i(3), 1, sh(c, -.3)).r(x + 1, y + 4, 3 + g.i(3), 1, sh(c, -.3)); else P.poly([ [ x, y + 2 ], [ x + 6, y ], [ x + 8, y + 5 ], [ x + 2, y + 6 ] ], c).r(x + 2, y + 3, 3, 1, sh(c, -.3));
      }
    }
  });
  def("file", {
    w: 10,
    h: 7,
    L: 1,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#a08a5a", "#4a5a7a", "#7a3a34", "#4a6a4a" ]);
      P.r(1, 0, 8, 2, "#aaa594").r(0, 1, 10, 6, c).r(0, 1, 10, 1, sh(c, .12)).r(0, 6, 10, 1, sh(c, -.2)).r(1, 3, 3, 1, sh(c, .25));
    }
  });
  def("clip", {
    w: 8,
    h: 10,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 1, 8, 9, "#6a5236").r(1, 2, 6, 7, "#aaa594").r(2, 0, 4, 2, "#8a8c90").p(2, 0, "#b0b2b6");
      for (let y = 4; y < 9; y += 2) P.r(2, y, 2 + g.i(3), 1, "#6a665a");
    }
  });
  def("cup", {
    w: 7,
    h: 4,
    nv: 4,
    draw(P, g, v) {
      const c = v & 1 ? "#a8a498" : "#8a6a48";
      P.r(0, 1, 5, 2, c).r(5, 0, 2, 4, sh(c, .1)).r(1, 1, 4, 1, sh(c, .12)).r(2, 1, 1, 2, v & 2 ? "#7a4a3a" : "#4a6a7a");
    }
  });
  def("can", {
    w: 6,
    h: 3,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#8a3a32", "#3a6a4a", "#8a8c90", "#a08a3a", "#3a4a7a" ]);
      P.r(1, 0, 4, 3, c).r(1, 0, 4, 1, sh(c, .2)).r(0, 0, 1, 3, "#9a9ca0").r(5, 0, 1, 3, "#7a7c80").p(3, 2, sh(c, -.3));
    }
  });
  def("pbottle", {
    w: 9,
    h: 3,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 6, 3, "#7a929a").r(0, 0, 6, 1, "#9ab0b6").r(6, 1, 2, 1, "#7a929a").r(8, 0, 1, 3, pick(g, [ "#3a5a8a", "#8a3a32", "#3a6a3a" ])).r(2, 1, 3, 1, pick(g, [ "#a83a32", "#3a6a9a", "#c8a03a" ]));
    }
  });
  def("soju", {
    w: 9,
    h: 3,
    nv: 3,
    draw(P, g) {
      P.r(0, 0, 5, 3, "#3a6a42").r(0, 0, 5, 1, "#5a8a5a").r(5, 1, 3, 1, "#3a6a42").r(8, 1, 1, 1, "#7a7c70").r(1, 1, 3, 1, "#a8b0a0");
    }
  });
  def("pbag", {
    w: 9,
    h: 7,
    nv: 6,
    draw(P, g, v) {
      const c = [ "#8a8c88", "#2a2c2e", "#5a6a8a", "#8a8a6a" ][v % 4];
      P.poly([ [ 1, 2 ], [ 4, 0 ], [ 8, 2 ], [ 7, 6 ], [ 2, 6 ] ], c);
      P.p(3, 2, sh(c, .2)).p(5, 3, sh(c, .2)).p(4, 4, sh(c, -.25)).r(2, 0, 1, 2, sh(c, -.1)).r(6, 0, 1, 2, sh(c, -.1));
    }
  });
  def("shoe", {
    w: 9,
    h: 4,
    nv: 8,
    draw(P, g, v) {
      const c = pick(g, [ "#5a5a5e", "#7a3a32", "#3a4a6a", "#8a8478", "#3a3226" ]), f = v & 1;
      const X = x => f ? 8 - x : x;
      P.r(Math.min(X(0), X(6)), 1, 7, 2, c).r(Math.min(X(4), X(7)), 0, 4, 1, c).r(Math.min(X(0), X(8)), 3, 9, 1, "#a8a498").p(X(5), 1, sh(c, .25));
    }
  });
  def("slipper", {
    w: 8,
    h: 4,
    nv: 6,
    draw(P, g) {
      const b = pick(g, [ "#3a5a9a", "#3a7a4a", "#9a3a3a" ]);
      P.r(0, 1, 8, 2, "#a8a69c").r(0, 0, 3, 1, "#a8a69c").r(5, 1, 3, 2, b).r(0, 3, 8, 1, "#8a8678");
    }
  });
  def("sock", {
    w: 6,
    h: 4,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#8a8a84", "#3a3a3e", "#6a5a4a" ]);
      P.r(0, 0, 2, 3, c).r(0, 2, 6, 2, c).r(4, 2, 2, 2, sh(c, -.15));
    }
  });
  def("toy", {
    w: 7,
    h: 5,
    nv: 8,
    draw(P, g, v) {
      const t = v % 4;
      if (t === 0) {
        P.r(0, 1, 7, 2, "#9a3a32").r(2, 0, 3, 1, "#9a3a32").r(3, 0, 1, 1, "#7a9aa6").r(1, 3, 2, 2, "#2a2a2c").r(4, 3, 2, 2, "#2a2a2c");
      } else if (t === 1) {
        P.r(1, 2, 5, 3, "#b89a2a").r(4, 0, 2, 2, "#b89a2a").p(6, 1, "#b8642a").p(5, 0, "#2a2a2c");
      } else if (t === 2) {
        P.r(0, 1, 3, 3, "#3a5a9a").r(3, 1, 3, 3, "#9a3a32").r(1, 0, 1, 1, "#3a5a9a").r(4, 0, 1, 1, "#9a3a32");
      } else {
        P.r(1, 1, 5, 4, "#7a5a3a").r(0, 0, 2, 2, "#7a5a3a").r(5, 0, 2, 2, "#7a5a3a").p(2, 2, "#2a2a2c").p(4, 2, "#2a2a2c").p(3, 3, "#a87a5a");
      }
    }
  });
  def("photo", {
    w: 6,
    h: 5,
    L: 1,
    nv: 4,
    draw(P, g, v) {
      if (v & 1) P.r(0, 0, 6, 5, "#a8a294").p(1, 1, "#8a8478"); else P.r(0, 0, 6, 5, "#a8a294").r(1, 1, 4, 3, "#6a7a8a").r(2, 2, 2, 2, "#a88a6a").r(1, 3, 4, 1, "#4a5a4a");
    }
  });
  def("pills", {
    w: 9,
    h: 5,
    nv: 4,
    draw(P, g) {
      P.r(0, 1, 4, 3, "#a8642a").r(0, 1, 4, 1, "#c8843a").r(4, 1, 1, 3, "#a8a69c");
      for (let k = 0; k < 3 + g.i(3); k++) P.p(5 + g.i(4), g.i(5), pick(g, [ "#c8c4b8", "#b8b4a8", "#c8a8a0" ]));
    }
  });
  def("gauze", {
    w: 12,
    h: 4,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 4, 4, "#aaa69a").r(1, 1, 2, 2, "#8a867a");
      let y = 1;
      for (let x = 4; x < 12; x++) {
        P.r(x, y, 1, 2, "#a8a498");
        if (g.chance(.3)) y = y ? 0 : 1;
      }
    }
  });
  def("syringe", {
    w: 8,
    h: 3,
    nv: 2,
    draw(P, g) {
      P.r(0, 1, 2, 1, "#8a8c90").r(2, 0, 4, 3, "#a8aaa8").r(3, 1, 2, 1, "#8aa0a8").r(6, 1, 2, 1, "#9a9ca0");
    }
  });
  def("glove", {
    w: 7,
    h: 5,
    nv: 4,
    draw(P, g) {
      const c = g.chance(.6) ? "#5a7a9a" : "#7a6a9a";
      P.r(0, 1, 4, 3, c).r(4, 0, 3, 1, c).r(4, 2, 3, 1, c).r(4, 4, 2, 1, c).p(1, 2, sh(c, .2));
    }
  });
  def("mask", {
    w: 7,
    h: 4,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = g.chance(.6) ? "#8aa0aa" : "#a8a69c";
      P.r(1, 0, 5, 4, c).r(1, 1, 5, 1, sh(c, -.15)).p(0, 0, "#8a8c88").p(6, 3, "#8a8c88");
    }
  });
  def("tissue", {
    w: 5,
    h: 4,
    nv: 4,
    draw(P, g) {
      P.poly([ [ 0, 1 ], [ 3, 0 ], [ 5, 2 ], [ 2, 4 ] ], "#a8a69e");
      P.p(2, 2, "#8a887e");
    }
  });
  def("chalk", {
    w: 7,
    h: 3,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 3, 1, "#c8c6bc").r(4, 1, 3, 1, pick(g, [ "#c8b85a", "#c88a8a", "#c8c6bc" ])).p(2, 2, "#a8a69c");
    }
  });
  def("eraser", {
    w: 7,
    h: 4,
    nv: 3,
    draw(P, g) {
      P.r(0, 0, 7, 2, pick(g, [ "#3a5a8a", "#8a3a3a", "#3a6a3a" ])).r(0, 2, 7, 2, "#6a6a66").r(1, 3, 5, 1, "#8a8a84");
    }
  });
  def("pencil", {
    w: 8,
    h: 2,
    nv: 3,
    draw(P, g) {
      P.r(0, 0, 6, 2, pick(g, [ "#b8942a", "#3a5a8a", "#8a3a3a" ])).r(6, 0, 1, 2, "#a88a6a").p(7, 0, "#3a3a3a");
    }
  });
  def("pball", {
    w: 5,
    h: 5,
    nv: 4,
    draw(P, g) {
      P.r(1, 0, 3, 5, "#a8a494").r(0, 1, 5, 3, "#a8a494").p(2, 1, "#8a8676").p(1, 3, "#8a8676").p(3, 2, "#c0bcac");
    }
  });
  def("notebook", {
    w: 11,
    h: 7,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#3a5a8a", "#8a4a3a", "#4a7a4a", "#8a7a3a" ]);
      P.r(0, 0, 11, 7, c).r(1, 1, 4, 5, "#aaa696").r(6, 1, 4, 5, "#aaa696").r(5, 1, 1, 5, sh(c, -.2));
      for (let y = 2; y < 6; y += 1) {
        P.r(1, y, 3, 1, y % 2 ? "#8a8a9a" : "#aaa696");
        P.r(6, y, 3, 1, y % 2 ? "#8a8a9a" : "#aaa696");
      }
    }
  });
  def("book", {
    w: 8,
    h: 5,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#6a3a32", "#3a4a6a", "#4a5a3a", "#7a6a3a", "#5a3a5a" ]);
      P.r(0, 0, 8, 4, c).r(0, 4, 8, 1, "#aaa494").r(1, 1, 5, 1, sh(c, .2)).r(7, 0, 1, 4, sh(c, -.25));
    }
  });
  def("ticket", {
    w: 6,
    h: 3,
    L: 1,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#a89a6a", "#8a9aaa", "#aa8a8a", "#9aa88a" ]);
      P.r(0, 0, 6, 3, c).r(1, 1, 3, 1, sh(c, -.3)).p(5, 0, sh(c, -.1));
    }
  });
  def("ltag", {
    w: 6,
    h: 5,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#a88a3a", "#a8a69c", "#8a3a3a" ]);
      P.r(1, 1, 5, 4, c).p(0, 0, "#7a7468").p(1, 0, "#7a7468").r(2, 3, 3, 1, sh(c, -.3));
    }
  });
  def("news", {
    w: 12,
    h: 8,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 12, 8, "#9a9890").r(1, 1, 5, 2, "#4a4a48").r(6, 0, 1, 8, "#7a7870");
      for (let y = 4; y < 8; y += 2) {
        P.r(1, y, 4, 1, "#6a6a66");
        P.r(7, y - 2, 4, 1, "#6a6a66");
      }
    }
  });
  def("flyer", {
    w: 7,
    h: 9,
    L: 1,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#a83a32", "#c89a2a", "#3a6aa8", "#3a8a5a", "#8a3a8a" ]);
      P.r(0, 0, 7, 9, "#aaa696").r(0, 0, 7, 3, c).r(1, 4, 5, 1, sh(c, -.1)).r(1, 6, 4, 1, "#6a665a").r(1, 7, 3, 1, "#6a665a");
    }
  });
  def("wrapper", {
    w: 7,
    h: 4,
    nv: 8,
    draw(P, g, v) {
      const c = v & 4 ? pick(g, [ "#5a5a3a", "#6a5a3a" ]) : pick(g, [ "#a83a32", "#c8902a", "#3a6aa8", "#3a8a4a" ]);
      P.poly([ [ 0, 1 ], [ 6, 0 ], [ 7, 3 ], [ 1, 4 ] ], c);
      P.r(2, 1, 3, 1, v & 4 ? "#2a2a1e" : "#aaa69a").p(6, 0, sh(c, -.3));
    }
  });
  def("tray", {
    w: 12,
    h: 8,
    L: 1,
    nv: 3,
    draw(P, g, v) {
      const c = v ? "#8a8c90" : "#9a8a6a";
      P.r(0, 0, 12, 8, c).r(0, 0, 12, 1, sh(c, .2)).r(1, 1, 4, 3, sh(c, -.15)).r(6, 1, 5, 3, sh(c, -.15)).r(1, 5, 10, 2, sh(c, -.15)).p(2, 2, "#a8743a").p(8, 2, "#c8c0a8");
    }
  });
  def("spoon", {
    w: 8,
    h: 3,
    nv: 3,
    draw(P, g) {
      P.r(0, 1, 5, 1, "#8a8c90").r(5, 0, 3, 3, "#8a8c90").p(6, 1, "#a8aaae");
    }
  });
  def("milk", {
    w: 4,
    h: 6,
    nv: 3,
    draw(P, g) {
      const c = pick(g, [ "#3a6aa8", "#c86a8a", "#c8a03a" ]);
      P.r(0, 1, 4, 5, "#aaa69a").r(0, 3, 4, 2, c).r(1, 0, 2, 1, "#aaa69a");
    }
  });
  def("receipt", {
    w: 4,
    h: 10,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 3, 9, "#aaa89e").r(1, 9, 3, 1, "#aaa89e");
      for (let y = 1; y < 8; y += 2) P.r(0, y, 2, 1, "#7a786e");
    }
  });
  def("ptag", {
    w: 5,
    h: 3,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#c8a83a", "#aaa69a", "#c86a3a" ]);
      P.r(0, 0, 5, 3, c).r(1, 1, 2, 1, "#3a3a3a");
    }
  });
  def("card", {
    w: 5,
    h: 3,
    L: 1,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#3a5a9a", "#3a8a5a", "#8a8c90" ]);
      P.r(0, 0, 5, 3, c).r(0, 0, 5, 1, sh(c, .2)).r(3, 1, 1, 1, "#c8a83a");
    }
  });
  def("lanyard", {
    w: 9,
    h: 7,
    nv: 3,
    draw(P, g) {
      const c = pick(g, [ "#3a5a9a", "#9a3a3a", "#3a3a3e" ]);
      P.r(3, 3, 5, 4, "#a8a69c").r(4, 4, 2, 2, "#6a7a8a").r(4, 6, 3, 1, "#6a665a");
      P.line(4, 3, 1, 0, c).line(1, 0, 0, 3, c).line(6, 3, 8, 1, c);
    }
  });
  def("rag", {
    w: 8,
    h: 5,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#6a6458", "#5a5a5a", "#7a6a5a" ]);
      P.poly([ [ 0, 1 ], [ 5, 0 ], [ 8, 3 ], [ 3, 5 ] ], c);
      P.p(3, 2, sh(c, -.3)).p(5, 2, sh(c, .15)).p(2, 3, "#2a2a2a");
    }
  });
  def("boot", {
    w: 10,
    h: 5,
    nv: 4,
    draw(P, g, v) {
      const f = v & 1, X = x => f ? 9 - x : x, c = "#3a3630";
      P.r(Math.min(X(0), X(3)), 0, 4, 3, c).r(Math.min(X(0), X(8)), 2, 9, 2, c).r(Math.min(X(0), X(9)), 4, 10, 1, "#1e1c1a").p(X(2), 1, "#5a564e").p(X(6), 2, "#5a564e");
    }
  });
  def("target", {
    w: 12,
    h: 12,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 12, 12, "#a8a494");
      P.ring(6, 6, 5, 5, "#3a3a38").ring(6, 6, 3, 3, "#3a3a38").r(5, 5, 2, 2, "#8a3a32");
      for (let k = 0; k < 3 + g.i(4); k++) P.p(2 + g.i(8), 2 + g.i(8), "#1a1a1a");
    }
  });
  def("umbrella", {
    w: 16,
    h: 5,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#2a2a3a", "#6a2a2a", "#2a4a6a", "#4a4a4a" ]);
      P.poly([ [ 0, 2 ], [ 11, 0 ], [ 11, 4 ] ], c);
      P.r(11, 2, 4, 1, "#6a6a6a").r(14, 2, 2, 2, "#5a3a2a").line(3, 2, 10, 1, sh(c, .2));
    }
  });
  def("cardboard", {
    w: 15,
    h: 9,
    L: 1,
    nv: 4,
    draw(P, g) {
      P.r(0, 0, 15, 9, "#7a5e3c").r(0, 0, 15, 1, "#8a6e4a").r(7, 0, 1, 9, "#6a5032").r(3, 4, 9, 2, "#9a9488").p(12, 7, "#5a4228");
    }
  });
  def("brick", {
    w: 7,
    h: 4,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#7a3e2e", "#8a4a36", "#6a3a2a" ]);
      P.r(0, 0, 7, 4, c).r(0, 0, 7, 1, sh(c, .18)).p(5, 2, sh(c, -.25)).p(2, 3, sh(c, -.25));
    }
  });
  def("plank", {
    w: 15,
    h: 4,
    nv: 4,
    draw(P, g) {
      const c = pick(g, [ "#7a5e3a", "#8a6a44", "#6a5232" ]);
      P.r(0, 0, 15, 4, c).r(0, 0, 15, 1, sh(c, .18)).r(3, 2, 6, 1, sh(c, -.18)).p(11, 1, "#4a3a28").p(12, 2, "#8a8c90");
    }
  });
  def("rebar", {
    w: 17,
    h: 3,
    nv: 4,
    draw(P, g) {
      P.r(0, 1, 17, 1, "#6a3e26").r(0, 0, 17, 1, "#8a5434");
      for (let x = 1; x < 17; x += 3) P.p(x, 2, "#4a2a1a");
    }
  });
  def("cone", {
    w: 11,
    h: 6,
    nv: 2,
    draw(P, g, v) {
      const f = v & 1, X = x => f ? 10 - x : x;
      P.poly(f ? [ [ 10, 1 ], [ 2, 2 ], [ 2, 4 ], [ 10, 5 ] ] : [ [ 0, 1 ], [ 8, 2 ], [ 8, 4 ], [ 0, 5 ] ], "#b8582a");
      P.r(Math.min(X(8), X(10)), 0, 3, 6, "#3a3a3a").r(Math.min(X(4), X(5)), 2, 2, 3, "#aaa69a");
    }
  });
  def("fsign", {
    w: 18,
    h: 8,
    nv: 4,
    draw(P, g, v) {
      P.r(0, 3, 11, 2, "#7a7c80").r(0, 3, 11, 1, "#9a9ca0");
      if (v & 1) {
        P.oval(14, 4, 3, 3, "#9a2a24").r(12, 3, 5, 2, "#c8c4b6");
      } else {
        P.oval(14, 4, 3, 3, "#2a4a8a").r(12, 4, 4, 1, "#c8c4b6").p(15, 3, "#c8c4b6").p(15, 5, "#c8c4b6");
      }
    }
  });
  def("tapeRoll", {
    w: 6,
    h: 6,
    nv: 2,
    draw(P, g) {
      P.oval(3, 3, 2, 2, "#8a7a5a");
      P.r(2, 2, 2, 2, "#5a4a32");
      P.r(5, 3, 1, 3, "#8a7a5a");
    }
  });
  def("weeds", {
    w: 8,
    h: 6,
    nv: 6,
    draw(P, g) {
      const c = pick(g, [ "#4a6a32", "#56723a", "#3e5a2a" ]);
      for (let k = 0; k < 4 + g.i(3); k++) {
        const x = 1 + g.i(6), h = 2 + g.i(4);
        P.r(x, 6 - h, 1, h, c);
      }
      P.r(1, 5, 6, 1, sh(c, -.2));
    }
  });
  def("wire", {
    w: 12,
    h: 8,
    mark: true,
    L: 1,
    nv: 4,
    draw(P, g) {
      let x = 0, y = 2 + g.i(4);
      const c = pick(g, [ "#2a2a2e", "#5a2a22", "#2a3a5a" ]);
      for (let k = 0; k < 14; k++) {
        P.p(x, y, c);
        x += 1;
        y += g.chance(.5) ? g.chance(.5) ? 1 : -1 : 0;
        y = Math.max(0, Math.min(7, y));
        if (x > 11) break;
      }
      P.p(x, y, "#b8743a");
    }
  });
  def("hanger", {
    w: 9,
    h: 5,
    mark: true,
    L: 1,
    nv: 2,
    draw(P, g) {
      const c = g.chance(.5) ? "#2a2a2c" : "#9a9890";
      P.line(0, 4, 4, 1, c).line(4, 1, 8, 4, c).r(0, 4, 9, 1, c).p(4, 0, c);
    }
  });
  const LINES = DR.LINES = {
    tapeY(c, r, ox, oy) {
      c.fillStyle = "#8a7a2e";
      c.fillRect(r.x - ox, r.y - oy, r.w, r.h);
    },
    tapeH(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy;
      c.fillStyle = "#8a7a2e";
      c.fillRect(x0, y0, r.w, r.h);
      c.fillStyle = "#26241e";
      const hz = r.w >= r.h;
      for (let k = 0; k < (hz ? r.w : r.h); k += 8) if (hz) c.fillRect(x0 + k, y0, 4, r.h); else c.fillRect(x0, y0 + k, r.w, 4);
    },
    paintW(c, r, ox, oy) {
      c.fillStyle = "rgba(200,196,182,0.42)";
      c.fillRect(r.x - ox, r.y - oy, r.w, r.h);
    },
    paintWd(c, r, ox, oy) {
      c.fillStyle = "rgba(200,196,182,0.42)";
      const hz = r.w >= r.h, L = hz ? r.w : r.h;
      for (let k = 0; k < L; k += 48) {
        const l = Math.min(26, L - k);
        if (hz) c.fillRect(r.x - ox + k, r.y - oy, l, r.h); else c.fillRect(r.x - ox, r.y - oy + k, r.w, l);
      }
    },
    paintY(c, r, ox, oy) {
      c.fillStyle = "rgba(196,164,60,0.55)";
      c.fillRect(r.x - ox, r.y - oy, r.w, r.h);
    },
    safety(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy;
      c.fillStyle = "#9a8432";
      c.fillRect(x0, y0, r.w, r.h);
      c.fillStyle = "#b89c3e";
      const hz = r.w >= r.h;
      for (let k = 2; k < (hz ? r.w : r.h) - 1; k += 5) {
        if (hz) {
          c.fillRect(x0 + k, y0 + 1, 2, 1);
          c.fillRect(x0 + k, y0 + r.h - 2, 2, 1);
        } else {
          c.fillRect(x0 + 1, y0 + k, 1, 2);
          c.fillRect(x0 + r.w - 2, y0 + k, 1, 2);
        }
      }
    },
    joint(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy;
      c.fillStyle = "#2a2b2e";
      c.fillRect(x0, y0, r.w, r.h);
      c.fillStyle = "#6a6c70";
      c.fillRect(x0, y0, r.w, 1);
      c.fillStyle = "#4a4c50";
      for (let k = 2; k < r.w; k += 6) c.fillRect(x0 + k, y0 + 1, 2, r.h - 2);
    },
    zebra(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy, hz = r.v & 1;
      c.fillStyle = "rgba(190,186,172,0.5)";
      const L = hz ? r.w : r.h, D = hz ? r.h : r.w;
      for (let k = 4; k < L; k += 14) {
        if (hz) c.fillRect(x0 + k, y0, 7, D); else c.fillRect(x0, y0 + k, D, 7);
      }
      c.fillStyle = "rgba(57,59,64,0.6)";
      for (let k = 0; k < L; k += 9) if (hz) c.fillRect(x0 + k + 3, y0 + k * 7 % Math.max(1, D), 1, 2); else c.fillRect(x0 + k * 7 % Math.max(1, D), y0 + k + 3, 2, 1);
    },
    wire(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy, hz = r.w >= r.h, L = hz ? r.w : r.h, D = hz ? r.h : r.w;
      c.fillStyle = "rgba(0,0,0,0.14)";
      for (let k = 0; k < L; k++) {
        const sag = Math.round(Math.sin(k / L * Math.PI) * 5), d = Math.round(k / L * Math.max(0, D - 12));
        for (const o of [ 0, 7 ]) {
          if (hz) c.fillRect(x0 + k, y0 + d + sag + o, 1, 1); else c.fillRect(x0 + d + sag + o, y0 + k, 1, 1);
        }
      }
    },
    court(c, r, ox, oy) {
      const x0 = r.x - ox, y0 = r.y - oy, w = r.w, h = r.h, col = "rgba(206,200,180,0.5)";
      c.fillStyle = col;
      c.fillRect(x0, y0, w, 2);
      c.fillRect(x0, y0 + h - 2, w, 2);
      c.fillRect(x0, y0, 2, h);
      c.fillRect(x0 + w - 2, y0, 2, h);
      c.fillRect(x0 + (w >> 1) - 1, y0, 2, h);
      const cx = x0 + (w >> 1), cy = y0 + (h >> 1), rr = Math.min(48, h >> 2);
      for (let k = 0; k < 96; k++) {
        const a = k / 96 * Math.PI * 2;
        c.fillRect(Math.round(cx + Math.cos(a) * rr) - 1, Math.round(cy + Math.sin(a) * rr) - 1, 2, 2);
      }
      const kw = Math.min(96, w >> 3), kh = Math.min(128, h >> 1);
      c.fillStyle = "rgba(160,70,50,0.22)";
      c.fillRect(x0 + 2, cy - (kh >> 1), kw, kh);
      c.fillRect(x0 + w - 2 - kw, cy - (kh >> 1), kw, kh);
      c.fillStyle = col;
      c.fillRect(x0 + kw, cy - (kh >> 1), 2, kh);
      c.fillRect(x0 + w - 2 - kw, cy - (kh >> 1), 2, kh);
    }
  };
  const Z = DR.Z = {
    "th:office": {
      p: .73,
      list: [ [ "ceil", 1 ], [ "papers", 5 ], [ "paper", 6 ], [ "file", 3 ], [ "cup", 2 ], [ "clip", 1 ], [ "pball", 2 ], [ "lanyard", 1 ], [ "stain", 2 ], [ "scuff", 2 ], [ "crack", 1 ], [ "dust", 1 ], [ "wire", 2 ], [ "spill", 1 ], [ "mask", 1 ], [ "card", 1 ] ]
    },
    "th:cubicles": {
      p: .73,
      list: [ [ "ceil", 1 ], [ "papers", 5 ], [ "paper", 6 ], [ "file", 3 ], [ "cup", 2 ], [ "pball", 2 ], [ "lanyard", 1 ], [ "stain", 2 ], [ "scuff", 2 ], [ "wire", 3 ], [ "spill", 1 ], [ "mask", 1 ] ]
    },
    "th:meeting": {
      p: .61,
      list: [ [ "paper", 6 ], [ "papers", 3 ], [ "pbottle", 2 ], [ "cup", 2 ], [ "pencil", 2 ], [ "stain", 2 ], [ "scuff", 2 ], [ "dust", 1 ], [ "file", 1 ] ]
    },
    "th:pantry": {
      p: .68,
      list: [ [ "cup", 4 ], [ "can", 3 ], [ "spill", 3 ], [ "wrapper", 3 ], [ "stain", 3 ], [ "food", 2 ], [ "spoon", 2 ], [ "pbottle", 2 ], [ "drain", 1 ], [ "crack", 1 ], [ "tissue", 2 ] ]
    },
    "th:kitchen": {
      p: .72,
      list: [ [ "spoon", 3 ], [ "food", 3 ], [ "spill", 3 ], [ "stain", 3 ], [ "soju", 2 ], [ "can", 2 ], [ "wrapper", 2 ], [ "pbag", 2 ], [ "drain", 1 ], [ "crack", 1 ], [ "tissue", 2 ], [ "glass", 1 ] ]
    },
    "th:bunk": {
      p: .72,
      list: [ [ "sock", 3 ], [ "toy", 3 ], [ "shoe", 2 ], [ "photo", 2 ], [ "book", 2 ], [ "flyer", 2 ], [ "tissue", 2 ], [ "stain", 2 ], [ "scuff", 2 ], [ "dust", 2 ], [ "pbag", 1 ], [ "soju", 1 ], [ "mask", 1 ], [ "paper", 2 ] ]
    },
    "th:store": {
      p: .7,
      list: [ [ "pallet", 2 ], [ "tarp", 1 ], [ "cardboard", 4 ], [ "chips", 3 ], [ "tapeRoll", 1 ], [ "nails", 2 ], [ "stain", 3 ], [ "crack", 2 ], [ "dust", 3 ], [ "pbag", 2 ], [ "paper", 2 ], [ "scuff", 2 ], [ "rag", 1 ], [ "bolts", 1 ] ]
    },
    "th:shop": {
      p: .72,
      list: [ [ "receipt", 4 ], [ "ptag", 4 ], [ "pbag", 3 ], [ "wrapper", 3 ], [ "can", 2 ], [ "hanger", 2 ], [ "flyer", 2 ], [ "glass", 2 ], [ "stain", 2 ], [ "scuff", 2 ], [ "card", 1 ], [ "pbottle", 2 ] ]
    },
    "th:atrium": {
      p: .61,
      list: [ [ "receipt", 3 ], [ "pbag", 3 ], [ "flyer", 3 ], [ "wrapper", 2 ], [ "can", 2 ], [ "glass", 2 ], [ "stain", 2 ], [ "scuff", 3 ], [ "prints", 2 ], [ "umbrella", 1 ], [ "cup", 2 ], [ "mask", 1 ] ]
    },
    "th:ward": {
      p: .7,
      list: [ [ "ceil", 1 ], [ "pills", 3 ], [ "gauze", 3 ], [ "glove", 3 ], [ "mask", 3 ], [ "syringe", 1 ], [ "clip", 2 ], [ "tissue", 2 ], [ "stain", 3 ], [ "tracks", 2 ], [ "paper", 2 ], [ "scuff", 2 ], [ "spill", 1 ] ]
    },
    "th:surgery": {
      p: .72,
      list: [ [ "gauze", 4 ], [ "glove", 4 ], [ "mask", 3 ], [ "syringe", 2 ], [ "pills", 1 ], [ "stain", 4 ], [ "drain", 1 ], [ "tracks", 1 ], [ "spill", 2 ], [ "tissue", 2 ] ]
    },
    "th:reception": {
      p: .61,
      list: [ [ "paper", 4 ], [ "clip", 2 ], [ "mask", 3 ], [ "glove", 2 ], [ "ticket", 3 ], [ "tracks", 3 ], [ "stain", 2 ], [ "scuff", 2 ], [ "cup", 1 ], [ "pills", 1 ] ]
    },
    "th:classroom": {
      p: .73,
      list: [ [ "ceil", 1 ], [ "chalk", 3 ], [ "chalkD", 2 ], [ "pball", 4 ], [ "paper", 4 ], [ "pencil", 3 ], [ "notebook", 2 ], [ "eraser", 1 ], [ "slipper", 2 ], [ "milk", 1 ], [ "wrapper", 1 ], [ "scuff", 3 ], [ "dust", 1 ], [ "book", 1 ] ]
    },
    "th:library": {
      p: .68,
      list: [ [ "book", 6 ], [ "paper", 4 ], [ "papers", 2 ], [ "notebook", 2 ], [ "pencil", 1 ], [ "dust", 3 ], [ "scuff", 1 ], [ "stain", 1 ] ]
    },
    "th:lab": {
      p: .68,
      list: [ [ "glass", 4 ], [ "paper", 3 ], [ "notebook", 1 ], [ "glove", 2 ], [ "stain", 4 ], [ "spill", 3 ], [ "pencil", 1 ], [ "drain", 1 ], [ "scorch", 1 ] ]
    },
    "th:cafeteria": {
      p: .74,
      list: [ [ "tray", 3 ], [ "spoon", 3 ], [ "milk", 3 ], [ "food", 4 ], [ "spill", 3 ], [ "wrapper", 2 ], [ "can", 1 ], [ "stain", 3 ], [ "tissue", 2 ], [ "slipper", 1 ] ]
    },
    "th:mess": {
      p: .74,
      list: [ [ "tray", 4 ], [ "spoon", 3 ], [ "food", 4 ], [ "spill", 3 ], [ "wrapper", 3 ], [ "can", 2 ], [ "stain", 3 ], [ "tissue", 1 ], [ "boot", 1 ] ]
    },
    "th:gym": {
      p: .72,
      list: [ [ "blanket", 6 ], [ "shoe", 3 ], [ "sock", 2 ], [ "pbottle", 3 ], [ "mask", 2 ], [ "paper", 2 ], [ "scuff", 4 ], [ "dust", 1 ], [ "wrapper", 2 ], [ "tissue", 1 ], [ "toy", 2 ], [ "cup", 1 ], [ "can", 1 ] ]
    },
    "th:platform": {
      p: .61,
      list: [ [ "ticket", 4 ], [ "news", 3 ], [ "cup", 2 ], [ "can", 2 ], [ "ltag", 2 ], [ "gum", 3 ], [ "prints", 2 ], [ "paws", 2 ], [ "stain", 2 ], [ "butts", 2 ], [ "umbrella", 1 ], [ "pbag", 1 ], [ "mask", 1 ] ]
    },
    "th:concourse": {
      p: .61,
      list: [ [ "ticket", 5 ], [ "news", 3 ], [ "ltag", 3 ], [ "cup", 2 ], [ "receipt", 2 ], [ "gum", 2 ], [ "prints", 2 ], [ "paws", 2 ], [ "stain", 2 ], [ "umbrella", 1 ], [ "mask", 1 ], [ "card", 1 ] ]
    },
    "th:maint": {
      p: .72,
      list: [ [ "oil", 3 ], [ "rag", 3 ], [ "bolts", 3 ], [ "nails", 2 ], [ "wire", 3 ], [ "stain", 3 ], [ "crack", 2 ], [ "paper", 1 ], [ "cup", 1 ], [ "chips", 1 ] ]
    },
    "th:toilet": {
      p: .72,
      list: [ [ "tissue", 4 ], [ "puddle", 2 ], [ "stain", 3 ], [ "drain", 2 ], [ "crack", 2 ], [ "mask", 1 ], [ "paper", 1 ], [ "glass", 1 ] ]
    },
    "th:barracks": {
      p: .72,
      list: [ [ "boot", 2 ], [ "sock", 3 ], [ "wrapper", 4 ], [ "can", 2 ], [ "butts", 3 ], [ "prints", 3 ], [ "paper", 2 ], [ "sand", 2 ], [ "casings", 1 ], [ "stain", 2 ], [ "scuff", 2 ], [ "photo", 1 ] ]
    },
    "th:armory": {
      p: .72,
      list: [ [ "casings", 5 ], [ "oil", 2 ], [ "rag", 2 ], [ "wrapper", 2 ], [ "paper", 2 ], [ "stain", 2 ], [ "prints", 2 ], [ "scuff", 2 ], [ "bolts", 1 ], [ "sand", 1 ] ]
    },
    "th:command": {
      p: .64,
      list: [ [ "paper", 5 ], [ "papers", 3 ], [ "file", 3 ], [ "cup", 2 ], [ "butts", 2 ], [ "clip", 1 ], [ "stain", 2 ], [ "prints", 2 ], [ "scuff", 1 ], [ "pencil", 1 ] ]
    },
    "th:motor": {
      p: .68,
      list: [ [ "oil", 5 ], [ "rag", 3 ], [ "bolts", 3 ], [ "tireT", 2 ], [ "stain", 3 ], [ "crack", 2 ], [ "can", 1 ], [ "wire", 2 ], [ "chips", 1 ] ]
    },
    "th:yard": {
      p: .55,
      list: [ [ "sand", 4 ], [ "prints", 3 ], [ "casings", 2 ], [ "butts", 2 ], [ "wrapper", 2 ], [ "crack", 2 ], [ "pebbles", 2 ], [ "tireT", 1 ], [ "leaves", 1 ] ]
    },
    "th:none": {
      p: .78,
      list: [ [ "rubble", 1 ], [ "ceil", 1 ], [ "dust", 3 ], [ "chips", 2 ], [ "crack", 2 ], [ "stain", 2 ], [ "paper", 2 ], [ "pbag", 1 ], [ "scuff", 2 ], [ "can", 1 ], [ "cardboard", 1 ] ]
    },
    corr: {
      p: .65,
      list: [ [ "paper", 4 ], [ "scuff", 4 ], [ "stain", 3 ], [ "crack", 3 ], [ "dust", 2 ], [ "prints", 2 ], [ "mask", 1 ], [ "pbag", 1 ], [ "can", 1 ], [ "flyer", 1 ], [ "chips", 2 ], [ "wire", 1 ], [ "ceil", 1 ], [ "rubble", 1 ], [ "glass", 1 ], [ "butts", 1 ] ]
    },
    lobby: {
      p: .78,
      list: [ [ "leaves", 4 ], [ "prints", 4 ], [ "paper", 3 ], [ "flyer", 2 ], [ "news", 2 ], [ "stain", 2 ], [ "scuff", 2 ], [ "glass", 2 ], [ "mask", 1 ], [ "umbrella", 1 ], [ "pebbles", 2 ], [ "blanket", 1 ], [ "cardboard", 1 ], [ "rubble", 1 ] ]
    },
    walk: {
      p: .61,
      list: [ [ "fsign", 1 ], [ "leaves", 5 ], [ "butts", 3 ], [ "gum", 3 ], [ "weeds", 3 ], [ "weedsM", 2 ], [ "flyer", 2 ], [ "can", 2 ], [ "soju", 1 ], [ "pbag", 2 ], [ "crack", 2 ], [ "stain", 1 ], [ "mask", 1 ], [ "drop", 1 ], [ "cup", 1 ], [ "umbrella", 1 ] ]
    },
    road: {
      p: .44,
      list: [ [ "fsign", 1 ], [ "cone", 1 ], [ "crack", 4 ], [ "patch", 2 ], [ "oil", 3 ], [ "leaves", 3 ], [ "pebbles", 2 ], [ "glass", 2 ], [ "skid", 1 ], [ "can", 1 ], [ "pbag", 1 ], [ "stain", 2 ], [ "shoe", 1 ], [ "brick", 1 ] ]
    },
    roof: {
      p: .51,
      list: [ [ "drop", 4 ], [ "puddle", 2 ], [ "leaves", 3 ], [ "butts", 3 ], [ "weedsM", 3 ], [ "crack", 3 ], [ "stain", 3 ], [ "pebbles", 2 ], [ "can", 1 ], [ "soju", 1 ], [ "cup", 1 ], [ "chips", 1 ], [ "wire", 1 ] ]
    },
    roofHut: {
      p: .61,
      list: [ [ "butts", 3 ], [ "can", 2 ], [ "dust", 2 ], [ "stain", 2 ], [ "prints", 2 ], [ "paper", 1 ] ]
    },
    stair: {
      p: .16,
      list: [ [ "dust", 2 ], [ "paper", 1 ], [ "butts", 1 ], [ "chips", 1 ] ]
    },
    bRoad: {
      p: .4,
      list: [ [ "crack", 4 ], [ "patch", 2 ], [ "oil", 3 ], [ "glass", 3 ], [ "skid", 2 ], [ "leaves", 2 ], [ "pebbles", 2 ], [ "shoe", 1 ], [ "pbag", 1 ], [ "can", 1 ], [ "paper", 1 ], [ "stain", 2 ], [ "drop", 1 ] ]
    },
    bWalk: {
      p: .64,
      list: [ [ "leaves", 3 ], [ "butts", 3 ], [ "gum", 2 ], [ "drop", 2 ], [ "weedsM", 2 ], [ "can", 1 ], [ "soju", 1 ], [ "pbag", 1 ], [ "crack", 2 ], [ "umbrella", 1 ], [ "flyer", 1 ], [ "mask", 1 ] ]
    },
    tRail: {
      p: .44,
      list: [ [ "puddle", 3 ], [ "paper", 2 ], [ "can", 2 ], [ "wire", 3 ], [ "bolts", 3 ], [ "chips", 2 ], [ "news", 1 ], [ "pbag", 1 ], [ "stain", 2 ], [ "butts", 1 ] ]
    },
    tConc: {
      p: .51,
      list: [ [ "stain", 3 ], [ "puddle", 2 ], [ "crack", 2 ], [ "chips", 2 ], [ "wire", 2 ], [ "paws", 2 ], [ "paper", 1 ], [ "can", 1 ], [ "prints", 2 ], [ "tag", 1 ] ]
    },
    tPlat: {
      p: .64,
      list: [ [ "ticket", 4 ], [ "news", 3 ], [ "gum", 3 ], [ "cup", 2 ], [ "can", 2 ], [ "ltag", 1 ], [ "prints", 3 ], [ "butts", 2 ], [ "stain", 2 ], [ "mask", 1 ], [ "umbrella", 1 ], [ "tag", 1 ] ]
    },
    tCar: {
      p: .72,
      list: [ [ "ticket", 3 ], [ "news", 3 ], [ "cup", 2 ], [ "can", 2 ], [ "pbag", 2 ], [ "mask", 2 ], [ "umbrella", 1 ], [ "shoe", 1 ], [ "stain", 2 ], [ "scuff", 2 ], [ "paper", 1 ] ]
    },
    tHut: {
      p: .72,
      list: [ [ "oil", 2 ], [ "rag", 2 ], [ "bolts", 2 ], [ "cup", 2 ], [ "butts", 2 ], [ "paper", 2 ], [ "stain", 2 ], [ "wire", 1 ] ]
    },
    tMach: {
      p: .61,
      list: [ [ "oil", 3 ], [ "bolts", 3 ], [ "wire", 3 ], [ "casings", 2 ], [ "stain", 3 ], [ "chips", 2 ], [ "rag", 1 ], [ "sand", 1 ] ]
    },
    sDirt: {
      p: .72,
      list: [ [ "pallet", 1 ], [ "tarp", 1 ], [ "rubble", 2 ], [ "pebbles", 4 ], [ "brick", 2 ], [ "plank", 2 ], [ "rebar", 2 ], [ "chips", 3 ], [ "nails", 2 ], [ "puddle", 2 ], [ "prints", 3 ], [ "weeds", 2 ], [ "can", 1 ], [ "cone", 1 ], [ "butts", 1 ], [ "cardboard", 1 ] ]
    },
    sRoad: {
      p: .44,
      list: [ [ "tireT", 2 ], [ "oil", 2 ], [ "pebbles", 3 ], [ "chips", 2 ], [ "crack", 2 ], [ "puddle", 2 ], [ "cone", 1 ], [ "butts", 1 ], [ "can", 1 ] ]
    },
    sFrame: {
      p: .7,
      list: [ [ "rubble", 3 ], [ "pallet", 1 ], [ "chips", 4 ], [ "rebar", 3 ], [ "nails", 3 ], [ "plank", 2 ], [ "brick", 2 ], [ "survey", 3 ], [ "dust", 3 ], [ "cone", 1 ], [ "wire", 2 ], [ "can", 1 ], [ "butts", 1 ], [ "cup", 1 ] ]
    },
    sOffice: {
      p: .72,
      list: [ [ "paper", 4 ], [ "papers", 2 ], [ "cup", 2 ], [ "butts", 2 ], [ "prints", 3 ], [ "stain", 2 ], [ "clip", 1 ], [ "can", 1 ] ]
    }
  };
  const FLAV = DR.FLAV = {
    villa: [ [ "shoe", 3 ], [ "toy", 2 ], [ "flyer", 3 ], [ "soju", 2 ], [ "pbag", 2 ], [ "sock", 1 ], [ "photo", 1 ] ],
    office: [ [ "papers", 3 ], [ "file", 2 ], [ "cup", 2 ], [ "lanyard", 1 ], [ "card", 1 ] ],
    mall: [ [ "receipt", 3 ], [ "ptag", 2 ], [ "pbag", 3 ], [ "wrapper", 2 ], [ "hanger", 1 ], [ "glass", 1 ] ],
    hos: [ [ "pills", 2 ], [ "gauze", 2 ], [ "glove", 2 ], [ "mask", 3 ], [ "tracks", 3 ], [ "clip", 1 ], [ "syringe", 1 ] ],
    school: [ [ "slipper", 3 ], [ "paper", 2 ], [ "pball", 2 ], [ "chalk", 1 ], [ "milk", 1 ], [ "notebook", 1 ] ],
    metro: [ [ "ticket", 3 ], [ "news", 2 ], [ "ltag", 2 ], [ "paws", 2 ], [ "gum", 1 ] ],
    base: [ [ "boot", 2 ], [ "casings", 3 ], [ "wrapper", 3 ], [ "sand", 2 ], [ "butts", 2 ], [ "prints", 2 ] ],
    heli: [ [ "papers", 2 ], [ "news", 2 ], [ "wire", 3 ], [ "tapeRoll", 1 ], [ "casings", 1 ] ],
    train: [ [ "target", 2 ], [ "casings", 3 ], [ "chalk", 1 ], [ "paper", 2 ], [ "slipper", 1 ] ]
  };
  const walkT = t => t === T.FLOOR || t === T.GROUND;
  function zoneOf(F, b, x, y) {
    const i = y * F.W + x, t = F.t[i], fs = F.fs[i];
    if (t === T.STAIR) return "stair";
    if (!walkT(t)) return null;
    if (b.outdoor === true) return fs === FS.ASPH ? "bRoad" : fs === FS.WALK ? "bWalk" : null;
    if (b.outdoor === "tunnel") {
      if (fs === FS.RAIL) return "tRail";
      if (fs === FS.WALK) return "tPlat";
      if (fs === FS.LINO) return x >= 8 && x <= 18 ? "tCar" : "tHut";
      return y < 14 ? "tMach" : "tConc";
    }
    if (b.outdoor === "site") return fs === FS.DIRT ? "sDirt" : fs === FS.ASPH ? "sRoad" : fs === FS.LINO ? "sOffice" : "sFrame";
    if (F.kind === "roof") return F.inside[i] ? "roofHut" : "roof";
    if (!F.inside[i]) return fs === FS.WALK ? "walk" : fs === FS.ASPH || fs === FS.LANE || fs === FS.CROSS ? "road" : null;
    const r = F.room[i] >= 0 ? F.rooms[F.room[i]] : null;
    if (!r) return fs === FS.LOBBY ? "lobby" : "corr";
    const k = "th:" + (r.big && Z["th:" + r.big] ? r.big : r.theme);
    return Z[k] ? k : "th:none";
  }
  const ZN = [ null ].concat(Object.keys(Z)), ZID = {};
  ZN.forEach((k, i) => {
    if (k) ZID[k] = i;
  });
  function wpick(g, list) {
    let s = 0;
    for (const e of list) s += e[1];
    let r = g.f() * s;
    for (const e of list) {
      if ((r -= e[1]) <= 0) return e[0];
    }
    return list[list.length - 1][0];
  }
  const zlists = new Map;
  function zlist(zk, bid) {
    const key = zk + "|" + bid;
    let L = zlists.get(key);
    if (L) return L;
    const z = Z[zk];
    L = z.list.slice();
    if ((zk === "corr" || zk === "lobby" || zk === "th:none") && FLAV[bid]) L = L.concat(FLAV[bid]);
    zlists.set(key, L);
    return L;
  }
  DR.build = function(lv, opt) {
    if (!DR.on || !lv || !lv.floors) return;
    const t0 = performance.now();
    const b = lv.building || {}, seed = (opt && opt.seed) >>> 0 || 0;
    DR.warm(150);
    for (const F of lv.floors) {
      const W = F.W, H = F.H, occ = new Uint8Array(W * H), keep = [];
      for (const p of F.props) {
        const x0 = Math.floor(p.x + 1e-6), y0 = Math.floor(p.y + 1e-6), x1 = Math.ceil(p.x + (p.w || 1) - 1e-6) - 1, y1 = Math.ceil(p.y + (p.h || 1) - 1e-6) - 1;
        const loot = !!p.cont || p.kind === "loot" || p.kind === "bag" || p.kind === "trash", m = loot ? 1 : 0;
        for (let y = y0 - m; y <= y1 + m; y++) for (let x = x0 - m; x <= x1 + m; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const i = y * W + x;
          if (x >= x0 && x <= x1 && y >= y0 && y <= y1) occ[i] |= 1; else occ[i] |= 2;
        }
        if (p.kind === "sandbag" || p.kind === "bus") keep.push({
          kind: p.kind,
          x: p.x,
          y: p.y,
          w: p.w || 1,
          h: p.h || 1
        });
      }
      for (const z of F.zones || []) for (let y = Math.floor(z.y); y < z.y + z.h; y++) for (let x = Math.floor(z.x); x < z.x + z.w; x++) if (x >= 0 && y >= 0 && x < W && y < H) occ[y * W + x] |= 2;
      F.decoR = {
        lv,
        b,
        seed,
        occ,
        props: keep,
        done: false
      };
    }
    DR.lastMs = performance.now() - t0;
  };
  DR.clear = function(F) {
    F.decoL = F.decoCh = F.decoW = F.decoC = null;
    F.decoN = 0;
    F._dfc = F._dcc = F._dfl = null;
  };
  const ensure = DR.ensure = function(F) {
    const R = F.decoR;
    if (!R || R.done) return !!R;
    R.done = true;
    const t0 = performance.now();
    try {
      buildFloor(F, R.lv, R.b, R.seed, R);
    } catch (e) {
      console.warn("deco-raid", e);
      DR.clear(F);
    }
    R.lv = null;
    R.occ = null;
    R.ms = performance.now() - t0;
    return true;
  };
  function buildFloor(F, lv, b, seed, R) {
    const W = F.W, H = F.H, N = W * H, bid = b.id || "office";
    const g = new SX.Rng(SX.hash("decoRaid:" + seed + ":" + bid + ":" + F.idx));
    const occ = R.occ;
    const zid = new Uint8Array(N), wl = new Uint8Array(N), ft = F.t;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = ft[i];
      wl[i] = t === T.WALL || t === T.WINDOW || t === T.PARAPET || t === T.VOID ? 1 : 0;
      const zk = zoneOf(F, b, x, y);
      if (zk && Z[zk]) zid[i] = ZID[zk];
    }
    const zAt = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? null : ZN[zid[y * W + x]];
    const wallAt = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 1 : wl[y * W + x];
    const recs = [];
    const okTile = (x, y, obj) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const i = y * W + x, t = ft[i];
      if (!(t === T.FLOOR || t === T.GROUND || t === T.STAIR)) return false;
      const o = occ[i];
      return !(o & 1) && !(obj && o & 2);
    };
    const put = (k, tx, ty, g2, o) => {
      const d = K[k];
      if (!d) return null;
      const sw = d.mark ? d.w : d.w + 2, shh = d.mark ? d.h : d.h + 2, u = g2.f() * 4294967296 >>> 0;
      const px = tx * TS + (o && o.dx != null ? o.dx : (u & 63) % Math.max(1, TS - Math.min(TS, sw) + 1)), py = ty * TS + (o && o.dy != null ? o.dy : (u >>> 6 & 63) % Math.max(1, TS - Math.min(TS, shh) + 1));
      const ax = px / TS | 0, ay = py / TS | 0, bx = (px + sw - 1) / TS | 0, by = (py + shh - 1) / TS | 0, obj = !d.mark;
      for (let yy = ay; yy <= by; yy++) for (let xx = ax; xx <= bx; xx++) if (!okTile(xx, yy, obj)) return null;
      const r = {
        k,
        x: px,
        y: py,
        w: sw,
        h: shh,
        v: (u >>> 12) % (d.nv * 7),
        L: d.L
      };
      recs.push(r);
      return r;
    };
    const MS = 7, mw = Math.ceil(W / MS) + 2, mh = Math.ceil(H / MS) + 2, mg = new Float32Array(mw * mh);
    for (let i = 0; i < mg.length; i++) mg[i] = .3 + 1.9 * Math.pow(g.f(), 1.6);
    const mess = (x, y) => {
      const fx = x / MS, fy = y / MS, ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, r0 = Math.min(mh - 1, iy) * mw, r1 = Math.min(mh - 1, iy + 1) * mw, c0 = Math.min(mw - 1, ix), c1 = Math.min(mw - 1, ix + 1);
      return (mg[r0 + c0] * (1 - ax) + mg[r0 + c1] * ax) * (1 - ay) + (mg[r1 + c0] * (1 - ax) + mg[r1 + c1] * ax) * ay;
    };
    const zl = ZN.map(zk => zk ? zlist(zk, bid) : null), zw = zl.map(L => L ? L.reduce((a, e) => a + e[1], 0) : 0);
    const near2 = (x, y) => {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if ((dx || dy) && wallAt(x + dx, y + dy)) return true;
      return false;
    };
    const wq = zi => {
      const L = zl[zi];
      let r = g.f() * zw[zi];
      for (let j = 0; j < L.length; j++) {
        if ((r -= L[j][1]) <= 0) return L[j][0];
      }
      return L[L.length - 1][0];
    };
    const FINE = {
      road: [ "grit", "pebbles", "grit" ],
      bRoad: [ "grit", "pebbles", "grit" ],
      tRail: [ "grit", "chips", "bits" ],
      sDirt: [ "pebbles", "grit", "chips" ],
      sRoad: [ "grit", "pebbles" ],
      roof: [ "grit", "bits", "pebbles", "drop" ],
      walk: [ "grit", "bits", "butts", "leaves" ],
      bWalk: [ "grit", "bits", "butts", "leaves" ]
    };
    const FINE0 = [ "bits", "grit", "grit", "chips", "bits", "butts" ], dustOK = F.kind !== "roof" && b.outdoor !== true;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const zi = zid[y * W + x];
      if (!zi) continue;
      const zk = ZN[zi], ms = mess(x, y);
      const nWall = wallAt(x + 1, y) + wallAt(x - 1, y) + wallAt(x, y + 1) + wallAt(x, y - 1);
      let p = Z[zk].p * ms * (nWall >= 2 ? 1.8 : nWall === 1 ? 1.4 : near2(x, y) ? .9 : .6);
      const n = (p | 0) + (g.f() < p - (p | 0) ? 1 : 0);
      for (let k = 0; k < n; k++) put(wq(zi), x, y, g);
      if (zk === "stair") continue;
      if (dustOK) {
        const up = y > 0 ? ft[(y - 1) * W + x] : T.VOID;
        if ((up === T.WALL || up === T.WINDOW) && g.f() < .6) put("baseDust", x, y, g, {
          dx: 0,
          dy: 0
        });
        if (wallAt(x - 1, y) && g.f() < .35) {
          const r = put("sideDust", x, y, g, {
            dx: 0,
            dy: 0
          });
          if (r) r.v &= ~1;
        }
        if (wallAt(x + 1, y) && g.f() < .35) {
          const r = put("sideDust", x, y, g, {
            dx: 26,
            dy: 0
          });
          if (r) r.v |= 1;
        }
      }
      if (g.f() < .42 * ms) {
        const L = FINE[zk] || FINE0;
        put(L[g.f() * L.length | 0], x, y, g);
      }
    }
    {
      const nPile = Math.round(N / 140);
      for (let k = 0, t = 0; k < nPile && t < nPile * 8; t++) {
        const x = 1 + g.i(W - 2), y = 1 + g.i(H - 2), zi = zid[y * W + x];
        if (!zi || ZN[zi] === "stair" || ZN[zi] === "road" || ZN[zi] === "bRoad") continue;
        k++;
        const m = 4 + g.i(5);
        for (let q = 0; q < m; q++) {
          const k2 = wq(zi);
          if (K[k2] && K[k2].mark && g.chance(.6)) continue;
          put(k2, x + g.i(3) - 1, y + g.i(3) - 1, g);
        }
      }
    }
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const t = F.t[y * W + x];
      if (t === T.WINDOW && F.kind === "floor") {
        for (let q = 0; q < 4; q++) {
          const dx = q === 2 ? 1 : q === 3 ? -1 : 0, dy = q === 0 ? 1 : q === 1 ? -1 : 0, tt = ft[(y + dy) * W + x + dx];
          if ((tt === T.FLOOR || tt === T.GROUND) && g.chance(.32)) put("glass", x + dx, y + dy, g);
        }
      } else if (t === T.DOOR && g.chance(.12)) {
        const d = F.doorAt.get(y * W + x);
        if (d && d.exit) {
          for (let k = 0; k < 2; k++) {
            const ox = d.horiz ? 0 : (d.side === "w" ? 1 : -1) * (1 + g.i(2)), oy = d.horiz ? (d.side === "n" ? 1 : -1) * (1 + g.i(2)) : 0;
            put(g.chance(.6) ? "leaves" : "prints", x + ox, y + oy, g);
          }
        } else {
          const ox = d && d.horiz ? 0 : g.chance(.5) ? 1 : -1, oy = d && d.horiz ? g.chance(.5) ? 1 : -1 : 0;
          put(g.chance(.5) ? "paper" : "scuff", x + ox, y + oy, g);
        }
      }
    }
    for (const p of R.props) if (p.kind === "sandbag" && g.chance(.8)) put("sand", Math.floor(p.x) + g.i(Math.max(1, p.w | 0)), Math.floor(p.y + p.h), g);
    linesFor(F, lv, b, g, recs, occ, R, put);
    trails(F, b, g, recs, okTile, zAt);
    const nDmg = Math.round(N / 2600);
    for (let k = 0, t = 0; k < nDmg && t < nDmg * 30; t++) {
      const x = 2 + g.i(W - 4), y = 2 + g.i(H - 4);
      const zk = zAt(x, y);
      if (!zk || zk === "stair") continue;
      if (!put("scorch", x, y, g)) continue;
      k++;
      for (let q = 0; q < 3 + g.i(4); q++) put(pick(g, [ "chips", "chips", "glass", "casings", "paper", "brick" ]), x + g.i(3) - 1, y + g.i(3) - 1, g);
    }
    {
      const gk = new SX.Rng(SX.hash("decoRaidKeep:" + seed + ":" + bid + ":" + F.idx)), keep = DR.KEEP * (SX.decoAmt ? SX.decoAmt() : 1);
      let j = 0;
      for (let i = 0; i < recs.length; i++) {
        const r = recs[i];
        if (r.line || gk.f() < keep) recs[j++] = r;
      }
      recs.length = j;
    }
    recs.sort((a, b2) => a.L - b2.L);
    const n = recs.length, D = new Int32Array(n * 6), cnt = new Map, span = (r, fn) => {
      const cx0 = Math.floor(r.x / CPX), cy0 = Math.floor(r.y / CPX), cx1 = Math.floor((r.x + r.w - 1) / CPX), cy1 = Math.floor((r.y + r.h - 1) / CPX);
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) fn(cy * 4096 + cx);
    };
    recs.forEach((r, k) => {
      const o = k * 6;
      D[o] = r.line ? -1 - LINE_IDX[r.k] : K[r.k].idx;
      D[o + 1] = r.x;
      D[o + 2] = r.y;
      D[o + 3] = r.v;
      D[o + 4] = r.w;
      D[o + 5] = r.h;
      span(r, key => cnt.set(key, (cnt.get(key) || 0) + 1));
    });
    const ch = new Map;
    for (const [key, c] of cnt) ch.set(key, new Uint32Array(c));
    const fillN = new Map;
    recs.forEach((r, k) => span(r, key => {
      const a = ch.get(key), j = fillN.get(key) || 0;
      a[j] = k;
      fillN.set(key, j + 1);
    }));
    F.decoL = D;
    F.decoN = n;
    F.decoCh = ch;
    wallsFor(F, lv, b, seed);
  }
  function linesFor(F, lv, b, g, recs, occ, R, put) {
    const walkOK = (x, y) => {
      const t = F.tile(x, y);
      return t === T.FLOOR || t === T.GROUND || t === T.STAIR;
    };
    const add = (k, x, y, w, h, v, whole) => {
      x = Math.round(x);
      y = Math.round(y);
      w = Math.max(1, Math.round(w));
      h = Math.max(1, Math.round(h));
      const push = (x0, y0, w0, h0) => recs.push({
        k,
        x: x0,
        y: y0,
        w: w0,
        h: h0,
        v: v | 0,
        L: -1,
        line: true
      });
      if (whole) {
        push(x, y, w, h);
        return;
      }
      const hz = w >= h, a0 = hz ? x : y, a1 = hz ? x + w : y + h, b0 = Math.floor((hz ? y : x) / TS), b1 = Math.floor(((hz ? y + h : x + w) - 1) / TS);
      let s0 = null;
      const ok = t => {
        for (let q = b0; q <= b1; q++) if (!(hz ? walkOK(t, q) : walkOK(q, t))) return false;
        return true;
      };
      for (let t = Math.floor(a0 / TS); t <= Math.floor((a1 - 1) / TS) + 1; t++) {
        const lo = Math.max(a0, t * TS), good = t * TS < a1 && ok(t);
        if (good && s0 == null) s0 = lo;
        if ((!good || t * TS >= a1) && s0 != null) {
          const e = Math.min(a1, t * TS);
          if (e > s0) {
            if (hz) push(s0, y, e - s0, h); else push(x, s0, w, e - s0);
          }
          s0 = null;
        }
      }
    };
    if (F.parkLines) {
      for (const q of F.parkLines) add(q.k, q.x, q.y, q.w, q.h, 0, false);
      return;
    }
    const W = F.W, H = F.H;
    if (b.outdoor === true) {
      const X0 = lv.X0, X1 = lv.X1, ya = lv.Y0, yb = lv.Y1;
      const xs = X0 + 2, xe = X1 - 1, cx = (X0 + X1 + 1) / 2;
      add("paintY", cx * TS - 4, ya * TS, 2, (yb - ya + 1) * TS);
      add("paintY", cx * TS + 2, ya * TS, 2, (yb - ya + 1) * TS);
      add("paintWd", (xs + cx) / 2 * TS - 1, ya * TS, 3, (yb - ya + 1) * TS);
      add("paintWd", (cx + xe) / 2 * TS - 1, ya * TS, 3, (yb - ya + 1) * TS);
      add("paintW", xs * TS + 3, ya * TS, 2, (yb - ya + 1) * TS);
      add("paintW", xe * TS - 5, ya * TS, 2, (yb - ya + 1) * TS);
      for (let y = ya + 22; y < yb - 18; y += 26) add("joint", (X0 + 1) * TS, y * TS + 12, (X1 - X0 - 1) * TS, 6);
      for (let y = ya + 30; y < yb - 30; y += 40 + g.i(20)) add("wire", (X0 + 1) * TS, y * TS, (X1 - X0 - 1) * TS, (2 + g.i(2)) * TS, 0, true);
      for (let y = ya + 6; y < yb - 6; y += 9 + g.i(8)) if (g.chance(.6)) {
        const up = g.chance(.5), r = put("roadArrowV", up ? Math.floor(cx) + 1 + g.i(5) : Math.floor(cx) - 6 + g.i(5), y, g, {
          dx: 7,
          dy: 1
        });
        if (r) r.v = (up ? 0 : 1) | (g.chance(.25) ? 2 : 0);
      }
      return;
    }
    if (b.outdoor === "tunnel") {
      for (let y = 0; y < H; y++) {
        const plat = x => F.tile(x, y) === T.FLOOR && F.fs[y * W + x] === FS.WALK, track = x => {
          const t = F.tile(x, y);
          return t === T.FLOOR && F.fs[y * W + x] !== FS.WALK && F.fs[y * W + x] !== FS.LINO;
        };
        for (let x = 1; x < W - 1; x++) {
          if (!plat(x)) continue;
          if (track(x + 1)) add("safety", x * TS + TS - 7, y * TS, 6, TS);
          if (track(x - 1)) add("safety", x * TS + 1, y * TS, 6, TS);
        }
      }
      return;
    }
    if (b.outdoor === "site") {
      for (let y = lv.Y0 + 2; y < lv.Y1 - 2; y += 1) if (g.chance(.5)) {
        const x = Math.floor((lv.X0 + lv.X1) / 2) - 2 + g.i(4);
        if (F.tile(x, y) === T.GROUND) {
          const r = put("tireT", x, y, g, {
            dx: g.i(10),
            dy: 0
          });
          if (r) r.v = 0;
        }
      }
      return;
    }
    if (F.kind === "roof") return;
    if (F.idx === 0 && lv.exits) {
      const X0 = lv.X0, Y0 = lv.Y0, X1 = lv.X1, Y1 = lv.Y1;
      for (const e of lv.exits) {
        if (e.side === "s") add("zebra", (e.x - 3) * TS, (Y1 + 4) * TS, 6 * TS, 6 * TS, 1, true); else if (e.side === "n") add("zebra", (e.x - 3) * TS, (Y0 - 9) * TS, 6 * TS, 6 * TS, 1, true); else if (e.side === "w") add("zebra", (X0 - 9) * TS, (e.y - 3) * TS, 6 * TS, 6 * TS, 0, true); else add("zebra", (X1 + 4) * TS, (e.y - 3) * TS, 6 * TS, 6 * TS, 0, true);
      }
      const road = (x, y) => {
        if (!F.in(x, y) || F.inside[y * W + x]) return false;
        const fs = F.fs[y * W + x];
        return F.t[y * W + x] === T.GROUND && (fs === FS.ASPH || fs === FS.LANE);
      };
      const walk = (x, y) => F.in(x, y) && !F.inside[y * W + x] && F.t[y * W + x] === T.GROUND && F.fs[y * W + x] === FS.WALK;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (road(x, y) && g.chance(.012)) put("manhole", x, y, g, {
          dx: 2,
          dy: 2
        });
        if (walk(x, y) && g.chance(.08)) {
          if (road(x, y + 1)) put("grate", x, y, g, {
            dx: 2,
            dy: 21
          }); else if (road(x, y - 1)) put("grate", x, y, g, {
            dx: 2,
            dy: 1
          });
        }
      }
      for (let k = 8; k < M.SIZE - 8; k += 14 + g.i(9)) {
        add("wire", (X0 + k) * TS, (Y1 + 1) * TS, (2 + g.i(3)) * TS, 10 * TS, 0, true);
        add("wire", (X0 + k) * TS, (Y0 - 11) * TS, (2 + g.i(3)) * TS, 10 * TS, 0, true);
        add("wire", (X0 - 11) * TS, (Y0 + k) * TS, 10 * TS, (2 + g.i(3)) * TS, 0, true);
        add("wire", (X1 + 1) * TS, (Y0 + k) * TS, 10 * TS, (2 + g.i(3)) * TS, 0, true);
      }
      const arr = (k, x, y, v) => {
        const r = put(k, x, y, g, k === "roadArrowH" ? {
          dx: 1,
          dy: 7
        } : {
          dx: 7,
          dy: 1
        });
        if (r) r.v = v | (g.chance(.25) ? 2 : 0);
      };
      for (let k = 6; k < M.SIZE - 6; k += 8 + g.i(7)) {
        if (g.chance(.4)) arr("roadArrowH", X0 + k, Y1 + 5, 1);
        if (g.chance(.4)) arr("roadArrowH", X0 + k, Y1 + 8, 0);
        if (g.chance(.4)) arr("roadArrowH", X0 + k, Y0 - 8, 1);
        if (g.chance(.4)) arr("roadArrowH", X0 + k, Y0 - 5, 0);
        if (g.chance(.4)) arr("roadArrowV", X0 - 8, Y0 + k, 1);
        if (g.chance(.4)) arr("roadArrowV", X0 - 5, Y0 + k, 0);
        if (g.chance(.4)) arr("roadArrowV", X1 + 5, Y0 + k, 1);
        if (g.chance(.4)) arr("roadArrowV", X1 + 8, Y0 + k, 0);
      }
    }
    for (const r of F.rooms) {
      const th = r.big || r.theme, w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1;
      if ((th === "store" || th === "armory" || th === "motor" || th === "maint") && w >= 5 && h >= 5 && g.chance(.75)) {
        const k = th === "store" ? "tapeY" : "tapeH", ins = 1;
        add(k, (r.x0 + ins) * TS, (r.y0 + ins) * TS + 8, (w - ins * 2) * TS, 4);
        add(k, (r.x0 + ins) * TS, (r.y1 - ins) * TS + 20, (w - ins * 2) * TS, 4);
        add(k, (r.x0 + ins) * TS + 8, (r.y0 + ins) * TS + 8, 4, (h - ins * 2) * TS - 8);
        add(k, (r.x1 - ins) * TS + 20, (r.y0 + ins) * TS + 8, 4, (h - ins * 2) * TS - 8);
      }
      if (th === "gym" && w >= 14 && h >= 8) add("court", (r.x0 + 1) * TS + 8, (r.y0 + 1) * TS + 8, (w - 2) * TS - 16, (h - 2) * TS - 16, 0, true);
      if (th === "yard" && w >= 8) {
        for (let y = r.y0 + 2; y < r.y1 - 1; y += 4) add("paintW", (r.x0 + 1) * TS, y * TS + 14, (w - 2) * TS, 3);
      }
      if (th === "motor" && r.big) {
        for (let x = r.x0 + 1; x < r.x1; x += 4) add("paintY", x * TS, (r.y0 + 1) * TS, 3, (h - 2) * TS);
      }
      if (th === "platform" && r.big) {
        const tr = R.props.filter(p => p.kind === "bus" && p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1);
        if (tr.length) {
          const y0 = Math.min(...tr.map(p => p.y)), y1 = Math.max(...tr.map(p => p.y + p.h));
          add("safety", r.x0 * TS, (y0 - 1) * TS + 20, w * TS, 6);
          add("safety", r.x0 * TS, y1 * TS + 6, w * TS, 6);
        }
      }
    }
    const tg = [];
    if (F.idx === 0 && lv.exits) for (const e of lv.exits) tg.push([ e.x, e.y ]);
    if (lv.stairBlocks) {
      const B = M.BLOCK, C = M.CORR;
      for (const s of lv.stairBlocks) tg.push([ lv.X0 + C + s.i * (B + C) + B / 2, lv.Y0 + C + s.j * (B + C) + 2 ]);
    }
    if (tg.length) for (let y = lv.Y0 + 1; y < lv.Y1; y++) for (let x = lv.X0 + 1; x < lv.X1; x++) {
      const i = y * W + x;
      if (F.t[i] !== T.FLOOR || F.room[i] !== -1 || occ[i] & 1) continue;
      if (F.tile(x, y - 1) !== T.WALL || (x * 5 + y * 3) % 11 !== 0 || !g.chance(.5)) continue;
      let best = tg[0], bd = 1e9;
      for (const q of tg) {
        const d = Math.abs(q[0] - x) + Math.abs(q[1] - y);
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
      const dx = best[0] - x, dy = best[1] - y, d = Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? 0 : 2 : dy >= 0 ? 3 : 1;
      const r = put("sticker", x, y, g, {
        dx: 9,
        dy: 2
      });
      if (r) r.v = d;
    }
  }
  function trails(F, b, g, recs, okTile, zAt) {
    const W = F.W, H = F.H, n = Math.round(W * H / (b.outdoor ? 700 : 900));
    const light = b.outdoor === "site" ? false : true;
    for (let k = 0, t = 0; k < n && t < n * 20; t++) {
      let x = 2 + g.i(W - 4), y = 2 + g.i(H - 4);
      const zk = zAt(x, y);
      if (!zk || zk === "stair" || zk === "road" || zk === "bRoad" || zk === "tRail") continue;
      const d = g.i(4), len = 4 + g.i(10), dx = [ 1, 0, -1, 0 ][d], dy = [ 0, -1, 0, 1 ][d];
      const vd = [ 1, 0, 3, 2 ][d];
      const mud = !light || g.chance(.4);
      k++;
      for (let s = 0; s < len; s++) {
        if (!okTile(x, y, false)) break;
        for (const off of [ 4, 18 ]) {
          const px = x * TS + (dx ? off : 10 + (s & 1) * 4), py = y * TS + (dy ? off : 10 + (s & 1) * 4);
          recs.push({
            k: "prints",
            x: px,
            y: py,
            w: 12,
            h: 12,
            v: vd | (mud ? 0 : 4),
            L: 0
          });
        }
        x += dx;
        y += dy;
      }
    }
  }
  const LINE_NAMES = Object.keys(LINES), LINE_IDX = {};
  LINE_NAMES.forEach((k, i) => {
    LINE_IDX[k] = i;
  });
  const sprCache = new Map;
  function sprOf(d, vi) {
    const key = d.name + ":" + vi;
    let c = sprCache.get(key);
    if (c) return c;
    const g = new SX.Rng(SX.hash("dk:" + d.name) + vi * 7919);
    if (d.mark) {
      c = A.mk(d.w, d.h);
      d.draw(new A.Pen(c.getContext("2d")), g, vi);
    } else {
      c = A.mk(d.w + 2, d.h + 2);
      const x = c.getContext("2d", {
        willReadFrequently: true
      });
      x.translate(1, 1);
      d.draw(new A.Pen(x), g, vi);
      x.setTransform(1, 0, 0, 1, 0, 0);
      A.outline(c, {
        mat: true
      });
    }
    sprCache.set(key, c);
    return c;
  }
  DR.sprite = (name, vi) => K[name] ? sprOf(K[name], (vi | 0) % K[name].nv) : null;
  let warmI = 0;
  DR.warm = function(budgetMs) {
    const t0 = performance.now(), n = KL.length * 8;
    while (warmI < n) {
      const d = KL[warmI / 8 | 0], v = warmI % 8;
      warmI++;
      if (v < d.nv) sprOf(d, v);
      if (performance.now() - t0 > budgetMs) return false;
    }
    return true;
  };
  {
    const idle = window.requestIdleCallback ? fn => window.requestIdleCallback(fn, {
      timeout: 2e3
    }) : fn => setTimeout(() => fn({
      timeRemaining: () => 6
    }), 60);
    const step = dl => {
      if (!DR.warm(Math.max(2, Math.min(8, dl.timeRemaining() - 1)))) idle(step);
    };
    setTimeout(() => idle(step), 2500);
  }
  const recOf = (D, k) => {
    const o = k * 6, id = D[o];
    return {
      k: id < 0 ? LINE_NAMES[-1 - id] : KL[id].name,
      line: id < 0,
      x: D[o + 1],
      y: D[o + 2],
      v: D[o + 3],
      w: D[o + 4],
      h: D[o + 5]
    };
  };
  DR.paint = function(ctx, F, cx, cy) {
    if (!F.decoR.done) ensure(F);
    const list = F.decoCh && F.decoCh.get(cy * 4096 + cx);
    if (!list) return;
    const D = F.decoL, ox = cx * CPX, oy = cy * CPX;
    for (let j = 0; j < list.length; j++) {
      const o = list[j] * 6, id = D[o];
      if (id < 0) {
        const f = LINES[LINE_NAMES[-1 - id]];
        if (f) f(ctx, recOf(D, list[j]), ox, oy);
        continue;
      }
      const d = KL[id];
      if (d === K.weeds && SX.grass && SX.grass.live(F)) continue;
      ctx.drawImage(sprOf(d, D[o + 3] % d.nv), D[o + 1] - ox, D[o + 2] - oy);
    }
  };
  DR.list = function(F) {
    ensure(F);
    const out = [];
    if (!F.decoL) return out;
    for (let k = 0; k < F.decoN; k++) out.push(recOf(F.decoL, k));
    return out;
  };
  const isWallish = (F, x, y) => {
    const t = F.tile(x, y);
    if (t === T.WALL || t === T.WINDOW) return true;
    if (t === T.DOOR) {
      const d = F.doorAt.get(F.i(x, y));
      return !!(d && !d.horiz);
    }
    return false;
  };
  const WR = DR.WR = [ null ];
  const WRI = {};
  const wr = (name, o) => {
    o.name = name;
    o.id = WR.length;
    WR.push(o);
    WRI[name] = o.id;
    return o;
  };
  const BANDS = [ null ];
  const BI = {};
  const band = (name, fn) => {
    BI[name] = BANDS.length;
    BANDS.push({
      name,
      fn
    });
  };
  const CR = [ null ], CRI = {};
  const cr = (name, fn) => {
    CRI[name] = CR.length;
    CR.push({
      name,
      fn
    });
  };
  const SX0 = (s, w) => s === 0 ? 2 : s === 2 ? 30 - w : Math.round(16 - w / 2);
  const lbl = (P, x, y, t, c, w, o) => PP().label(P, x, y, t, c, 7, w, o);
  const mini = (P, x, y, t, c, w) => PP().mini(P, x, y, t, c, w);
  const SIGN_EN = DR.SIGN_EN = {
    대피소: "EVAC",
    급수대: "WATER",
    구호소: "AID",
    집결지: "RALLY",
    배급소: "FOOD",
    실종: "MISSING",
    손씻기: "WASH",
    마스크: "MASK",
    대피로: "EXIT",
    구조대: "SOS",
    예방: "VAX",
    병동: "WARD",
    격리: "QUAR",
    처치실: "ER",
    검사실: "LAB",
    수술실: "OR",
    약국: "DRUGS",
    분식: "SNACK",
    세탁: "WASH",
    안경: "OPTIC",
    미용실: "HAIR",
    편의점: "MART",
    세일: "SALE",
    식단: "MENU",
    근무: "DUTY",
    충성: "LOYAL",
    단결: "UNITY",
    필승: "WIN",
    명예: "HONOR",
    안전: "SAFE",
    제일: "SAFE",
    출입: "STOP",
    금지: "NO GO",
    통제: "SHUT",
    살려줘: "HELP",
    탈출: "RUN",
    감염: "SICK",
    여기: "HERE",
    한강: "RIVER",
    가족: "FAMILY",
    도와줘: "SOS",
    배고파: "FOOD?"
  };
  const F35 = {
    A: "010101111101101",
    B: "110101110101110",
    C: "011100100100011",
    D: "110101101101110",
    E: "111100110100111",
    F: "111100110100100",
    G: "011100101101011",
    H: "101101111101101",
    I: "111010010010111",
    J: "001001001101010",
    K: "101110100110101",
    L: "100100100100111",
    M: "101111111101101",
    N: "110101101101101",
    O: "010101101101010",
    P: "110101110100100",
    Q: "010101101110011",
    R: "110101110101101",
    S: "011100010001110",
    T: "111010010010010",
    U: "101101101101111",
    V: "101101101101010",
    W: "101101111111101",
    X: "101101010101101",
    Y: "101101010010010",
    Z: "111001010100111",
    0: "010101101101010",
    1: "010110010010111",
    2: "111001111100111",
    3: "111001111001111",
    4: "101101111001001",
    5: "111100111001111",
    6: "111100111101111",
    7: "111001010010010",
    8: "111101111101111",
    9: "111101111001111",
    "?": "111001010000010",
    "!": "010010010000010",
    "-": "000000111000000",
    ".": "000000000000010",
    " ": "000000000000000"
  };
  const f35W = (t, k) => (t.length * 4 - 1) * k;
  const f35 = (P, x, y, t, c, w, k) => {
    const ox = w ? x + Math.floor((w - f35W(t, k)) / 2) : x;
    for (let n = 0; n < t.length; n++) {
      const g = F35[t[n]] || F35[" "];
      for (let i = 0; i < 15; i++) if (g[i] === "1") P.r(ox + (n * 4 + i % 3) * k, y + Math.floor(i / 3) * k, k, k, c);
    }
  };
  const sign = (P, x, y, ko, c, w, o) => {
    const en = SX.lang === "en" ? SIGN_EN[ko] : null;
    if (!en) return lbl(P, x, y, ko, c, w, o);
    if (o && o.big && f35W(en, 2) <= w) {
      f35(P, x, y - 1, en, c, w, 2);
      return;
    }
    let t = en;
    while (t.length > 1 && f35W(t, 1) > w) t = t.slice(0, -1);
    f35(P, x, y + 1, t, c, w, 1);
  };
  DR.sign = sign;
  wr("outlet", {
    w: 5,
    draw(P, g, v, s) {
      const x = SX0(s, 5);
      P.r(x, 12, 5, 6, "#c8c4b6").r(x, 12, 5, 1, "#dcd8ca").r(x, 17, 5, 1, "#8a8678").p(x + 1, 14, "#2a2a2a").p(x + 3, 14, "#2a2a2a").p(x + 1, 16, "#2a2a2a").p(x + 3, 16, "#2a2a2a");
      if (v & 1) {
        P.r(x + 2, 18, 1, 1, "#2a2a2e");
      }
    }
  });
  wr("switch", {
    w: 4,
    draw(P, g, v, s) {
      const x = SX0(s, 4);
      P.r(x, 7, 4, 6, "#c8c4b6").r(x, 7, 4, 1, "#dcd8ca").r(x + 1, 9, 2, 2, "#9a968a").p(x + 1, v & 1 ? 9 : 10, "#e8e4d6");
      if (v & 2) P.r(x - 1, 6, 6, 8, "rgba(40,30,20,0.12)");
    }
  });
  wr("clock", {
    w: 9,
    draw(P, g, v, s) {
      const x = SX0(s, 9), y = 3;
      P.oval(x + 4, y + 4, 4, 4, "#2a2a2c").oval(x + 4, y + 4, 3, 3, "#d8d4c6");
      P.p(x + 4, y + 1, "#2a2a2c").p(x + 7, y + 4, "#2a2a2c").p(x + 4, y + 7, "#2a2a2c").p(x + 1, y + 4, "#2a2a2c");
      const h = v % 12, mm = v * 5 % 12, hx = [ 0, 1, 2, 2, 2, 1, 0, -1, -2, -2, -2, -1 ][h], hy = [ -2, -2, -1, 0, 1, 2, 2, 2, 1, 0, -1, -2 ][h];
      P.line(x + 4, y + 4, x + 4 + hx, y + 4 + hy, "#1a1a1a");
      P.line(x + 4, y + 4, x + 4 + Math.round(hx * 0 + [ 0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1 ][mm]), y + 4 + [ -3, -2, -2, 0, 2, 2, 3, 2, 2, 0, -2, -2 ][mm], "#8a2a22");
    }
  });
  wr("extSign", {
    w: 7,
    draw(P, g, v, s) {
      const x = SX0(s, 7);
      P.r(x, 3, 7, 9, "#9a2a24").r(x, 3, 7, 1, "#b8443a").r(x + 2, 5, 3, 5, "#d8d0c0").r(x + 3, 4, 1, 1, "#d8d0c0").r(x + 2, 7, 3, 1, "#9a2a24");
    }
  });
  wr("alarm", {
    w: 7,
    draw(P, g, v, s) {
      const x = SX0(s, 7);
      P.oval(x + 3, 6, 3, 3, "#6a1a16").oval(x + 3, 6, 2, 2, "#b8342c").p(x + 2, 5, "#e0705a");
      P.r(x + 1, 11, 5, 4, "#8a2a24").r(x + 2, 12, 3, 2, "#c8c0b0");
    }
  });
  wr("vent", {
    w: 10,
    draw(P, g, v, s) {
      const x = SX0(s, 10);
      P.r(x, 3, 10, 6, "#5a5c60").r(x + 1, 4, 8, 4, "#2a2c30");
      for (let k = 4; k < 8; k += 1) if (k % 2 === 0) P.r(x + 1, k, 8, 1, "#7a7c80");
      P.r(x, 9, 10, 1, "rgba(30,26,20,0.25)");
      if (v & 1) P.r(x + 2, 9, 1, 4, "rgba(60,40,24,0.25)");
    }
  });
  wr("stain", {
    w: 7,
    draw(P, g, v, s) {
      const x = SX0(s, 7);
      const c = v & 1 ? "rgba(90,64,34,0.22)" : "rgba(40,36,30,0.2)";
      for (let k = 0; k < 5; k++) {
        const xx = x + g.i(7), l = 4 + g.i(12);
        P.r(xx, 3, 1 + g.i(2), l, c);
      }
      P.oval(x + 3, 4, 3, 1, c);
    }
  });
  wr("crack", {
    w: 9,
    draw(P, g, v, s) {
      const x0 = SX0(s, 9);
      let x = x0 + 2 + g.i(4), y = 3;
      const c = "#4a4740";
      for (let k = 0; k < 15; k++) {
        P.p(x, y, c);
        if (g.chance(.3)) P.p(x + 1, y, "#a8a498");
        x += g.chance(.5) ? g.chance(.5) ? 1 : -1 : 0;
        y++;
        if (y > 18) break;
        if (k === 5 && g.chance(.6)) {
          let xx = x, yy = y;
          for (let q = 0; q < 4; q++) {
            xx++;
            yy += g.chance(.5) ? 1 : 0;
            P.p(xx, yy, c);
          }
        }
      }
    }
  });
  wr("holes", {
    w: 10,
    draw(P, g, v, s) {
      const x0 = SX0(s, 10);
      for (let k = 0; k < 3 + g.i(3); k++) {
        const x = x0 + g.i(9), y = 4 + g.i(11);
        P.r(x, y, 2, 2, "#2a2824").p(x + 2, y, "#a8a498").p(x - 1, y + 2, "#6a665c").p(x + 1, y - 1, "#6a665c");
      }
    }
  });
  wr("scorch", {
    w: 12,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.oval(x + 6, 10, 6, 6, "rgba(20,16,12,0.25)").oval(x + 6, 9, 3, 4, "rgba(16,12,10,0.3)");
      for (let k = 0; k < 12; k++) P.p(x + g.i(12), 3 + g.i(14), "rgba(20,16,12,0.4)");
    }
  });
  wr("peel", {
    w: 10,
    draw(P, g, v, s) {
      const x = SX0(s, 10), y = 5 + g.i(6);
      P.r(x + 1, y, 7, 5, "#6a6a66").r(x, y + 1, 9, 3, "#6a6a66").r(x + 2, y + 1, 4, 2, "#5a5a56").r(x + 1, y - 1, 7, 1, "#a8a498").p(x + 8, y + 4, "#a8a498");
    }
  });
  wr("hand", {
    w: 8,
    draw(P, g, v, s) {
      const x = SX0(s, 8), y = 5 + g.i(5), c = "rgba(70,30,22,0.24)";
      P.r(x + 1, y + 3, 5, 4, c);
      for (let k = 0; k < 4; k++) P.r(x + 1 + k + (k > 1 ? 1 : 0) - 1, y + (k === 0 || k === 3 ? 1 : 0), 1, 3, c);
      P.r(x + 6, y + 4, 2, 1, c);
    }
  });
  wr("tally", {
    w: 12,
    draw(P, g, v, s) {
      const x = SX0(s, 12), c = v & 1 ? "#c8c4b6" : "#3a3836";
      for (let n = 0; n < 2 + v % 2; n++) {
        const ox = x + n * 6, y = 5;
        P.r(ox, y, 5, 1, c).r(ox + 2, y, 1, 7, c).r(ox + 2, y + 3, 3, 1, c).r(ox, y + 4, 1, 3, c).r(ox, y + 7, 5, 1, c);
      }
    }
  });
  wr("cctv", {
    w: 8,
    draw(P, g, v, s) {
      const x = SX0(s, 8);
      P.r(x + (s === 2 ? 6 : 0), 3, 2, 3, "#3a3c40").r(x + 1, 4, 6, 3, "#c8c6be").r(x + 1, 6, 6, 1, "#8a8a86").p(s === 2 ? x + 1 : x + 6, 5, "#2a2a2a").p(s === 2 ? x + 2 : x + 5, 5, v & 1 ? "#a8302a" : "#3a3a3a");
    }
  });
  wr("intercom", {
    w: 6,
    draw(P, g, v, s) {
      const x = SX0(s, 6);
      P.r(x, 6, 6, 8, "#3a3c40").r(x + 1, 7, 4, 3, "#2a4a3a").r(x + 1, 11, 4, 2, "#8a8c90").p(x + 2, 8, "#5a8a6a");
    }
  });
  wr("pipeV", {
    w: 4,
    tall: 1,
    draw(P, g, v, s, G, dh) {
      dh = dh | 0;
      const x = SX0(s, 4), L = 19 + dh;
      P.r(x, 0, 3, L, "#6a6c70").r(x, 0, 1, L, "#9a9ca0").r(x + 2, 0, 1, L, "#45474b");
      for (const y of dh ? [ 4, 13 + (dh >> 1), 13 + dh ] : [ 4, 13 ]) P.r(x - 1, y, 5, 2, "#3a3c40");
      if (v & 1) {
        P.r(x + 1, 8, 1, 3, "#8a5432");
      }
    }
  });
  wr("cable", {
    w: 6,
    draw(P, g, v, s) {
      const x = SX0(s, 6);
      P.r(x + 2, 0, 1, 3, "#1e1f22");
      let xx = x + 2;
      for (let y = 3; y < 15; y++) {
        P.p(xx, y, "#1e1f22");
        if (y % 3 === 0) xx += g.chance(.5) ? 1 : -1;
        xx = Math.max(x, Math.min(x + 5, xx));
      }
      P.p(xx, 15, "#b8743a").p(xx + 1, 15, "#8a8c90");
    }
  });
  wr("hooks", {
    w: 12,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 6, 12, 2, "#6a5232").r(x, 6, 12, 1, "#8a6e4a");
      for (let k = 1; k < 12; k += 4) P.r(x + k, 8, 1, 2, "#8a8c90").p(x + k + 1, 10, "#8a8c90");
      if (v & 1) P.r(x + 4, 10, 4, 7, pick(g, [ "#4a4a5a", "#5a3a2a", "#3a4a3a" ])).r(x + 4, 10, 4, 1, "#2a2a2a");
    }
  });
  wr("scraps", {
    w: 9,
    draw(P, g, v, s) {
      const x = SX0(s, 9);
      for (let k = 0; k < 3; k++) {
        const xx = x + g.i(6), y = 3 + g.i(11), c = pick(g, [ "#c8c2ae", "#b8a87a", "#a8b8c8", "#c8a8a8" ]);
        P.r(xx, y, 3 + g.i(2), 2 + g.i(2), c).p(xx, y, "#d8d4c6");
      }
    }
  });
  wr("plate", {
    w: 12,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 5, 12, 6, "#2a2c30").r(x + 1, 6, 10, 4, "#c8c4b4");
      mini(P, x + 1, 6, String((v >> 4 & 3) + 1) + "0" + ((v & 15) % 9 + 1), "#2a2c30", 10);
    }
  });
  wr("exit", {
    w: 13,
    draw(P, g, v, s) {
      const x = SX0(s, 13);
      P.r(x, 2, 13, 7, "#1e4a2a").r(x + 1, 3, 11, 5, "#3a8a4c").r(x + 2, 4, 2, 2, "#d8ecd0").r(x + 3, 6, 1, 1, "#d8ecd0").r(x + 5, 4, 1, 3, "#d8ecd0").r(x + 7, 5, 4, 1, "#d8ecd0").p(x + 10, 4, "#d8ecd0").p(x + 10, 6, "#d8ecd0");
    }
  });
  wr("sanit", {
    w: 6,
    draw(P, g, v, s) {
      const x = SX0(s, 6);
      P.r(x, 4, 6, 9, "#c8c6be").r(x, 4, 6, 1, "#e0ded6").r(x + 1, 6, 4, 4, "#7aa0b8").r(x + 2, 11, 2, 2, "#6a6c70").p(x + 2, 7, "#a8c8d8");
    }
  });
  wr("o2", {
    w: 12,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 5, 12, 6, "#c8c6be").r(x, 5, 12, 1, "#e0ded6");
      P.oval(x + 3, 8, 1, 1, "#3a8a4a").oval(x + 6, 8, 1, 1, "#c8c6be").oval(x + 9, 8, 1, 1, "#e8e6de");
      P.p(x + 6, 8, "#2a2a2a").p(x + 9, 8, "#8a8c90").r(x + 2, 11, 2, 4, "#5a8a6a");
    }
  });
  wr("nurse", {
    w: 5,
    draw(P, g, v, s) {
      const x = SX0(s, 5);
      P.r(x, 8, 5, 6, "#c8c6be").oval(x + 2, 10, 1, 1, "#b8342c").r(x + 1, 12, 3, 1, "#8a8c90");
    }
  });
  wr("speaker", {
    w: 11,
    draw(P, g, v, s) {
      const x = SX0(s, 11);
      P.r(x, 2, 11, 8, "#6a5a42").r(x + 1, 3, 9, 6, "#3a3228");
      for (let yy = 4; yy < 9; yy += 2) for (let xx = 2; xx < 10; xx += 2) P.p(x + xx, 3 + yy - 3 + 1, "#5a4e3c");
      P.r(x, 9, 11, 1, "#4a3e2c");
    }
  });
  wr("notice", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const en = SX.lang === "en", x = en ? 2 : 3, sw = en ? 28 : 26;
      P.r(x, 3, sw, 14, "#b8b2a0").r(x, 3, sw, 1, "#ccc6b4").r(x + sw - 1, 4, 1, 13, "#8a8474");
      P.r(x + 10, 2, 6, 2, "rgba(200,190,150,0.7)");
      sign(P, x + 1, 4, [ "대피소", "급수대", "구호소", "집결지", "배급소" ][v % 5], "#8a2a22", sw - 2);
      P.r(x + 6, 13, 12, 1, "#8a2a22").line(x + 15, 11, x + 18, 13, "#8a2a22").line(x + 15, 15, x + 18, 13, "#8a2a22");
    }
  });
  wr("missing", {
    w: 18,
    big: 1,
    draw(P, g, v, s) {
      if (SX.lang === "en") {
        P.r(1, 2, 30, 16, "#b8b2a0").r(1, 2, 30, 1, "#ccc6b4");
        sign(P, 2, 3, "실종", "#8a2a22", 28);
        P.r(3, 10, 6, 7, "#6a6a6a").r(4, 11, 4, 3, "#8a7a6a").r(4, 14, 4, 3, "#4a4a5a");
        for (let y = 11; y < 17; y += 2) P.r(11, y, 14 - g.i(5), 1, "#6a665a");
        return;
      }
      const x = 7;
      P.r(x, 2, 18, 16, "#b8b2a0").r(x, 2, 18, 1, "#ccc6b4");
      lbl(P, x + 1, 2, "실종", "#8a2a22", 16);
      P.r(x + 2, 10, 6, 7, "#6a6a6a").r(x + 3, 11, 4, 3, "#8a7a6a").r(x + 3, 14, 4, 3, "#4a4a5a");
      for (let y = 11; y < 17; y += 2) P.r(x + 10, y, 6 - g.i(3), 1, "#6a665a");
      if (v & 1) P.r(x + 15, 2, 3, 3, "#8a8474");
    }
  });
  wr("poster", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5, c = pick(g, [ "#3a6a9a", "#9a3a32", "#3a7a4a", "#a88a2a" ]);
      P.r(x, 2, 22, 16, sh(c, -.1)).r(x + 1, 3, 20, 14, c);
      sign(P, x + 1, 4, [ "손씻기", "마스크", "대피로", "구조대", "예방" ][v % 5], "#e0dccb", 20);
      P.r(x + 3, 13, 16, 1, sh(c, .3)).r(x + 3, 15, 10, 1, sh(c, .3));
      if (v & 2) P.poly([ [ x + 22, 12 ], [ x + 22, 18 ], [ x + 16, 18 ] ], "#8b877e");
      if (v & 4) P.r(x, 2, 3, 3, "#8b877e");
    }
  });
  wr("board", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 2, 24, 15, "#5a4028").r(x + 1, 3, 22, 13, "#9a7a52");
      for (let k = 0; k < 5; k++) {
        const xx = x + 2 + g.i(17), y = 4 + g.i(8), c = pick(g, [ "#c8c2ae", "#c8b86a", "#a8c0c8", "#c8a0a0", "#a8c8a0" ]);
        P.r(xx, y, 4, 4, c).p(xx + 1, y, "#b8342c");
      }
    }
  });
  wr("calendar", {
    w: 12,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 2, 12, 15, "#b8b2a0").r(x, 2, 12, 4, "#9a3a32");
      mini(P, x + 3, 3, "10", "#e0dccb");
      for (let yy = 7; yy < 16; yy += 2) for (let xx = 1; xx < 11; xx += 2) P.p(x + xx, yy, "#7a766a");
      P.ring(x + 5 + v % 3 * 2, 9 + v % 2 * 2, 1, 1, "#b8342c");
    }
  });
  wr("evac", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 2, 24, 15, "#2a2c30").r(x + 1, 3, 22, 13, "#c8c4b4").r(x + 1, 3, 22, 3, "#3a7a4a");
      P.r(x + 3, 8, 18, 1, "#5a5a56").r(x + 3, 8, 1, 6, "#5a5a56").r(x + 11, 8, 1, 6, "#5a5a56").r(x + 3, 13, 18, 1, "#5a5a56").r(x + 20, 8, 1, 6, "#5a5a56");
      P.r(x + 6, 10, 10, 1, "#3a8a4a").p(x + 15, 9, "#3a8a4a").p(x + 15, 11, "#3a8a4a").r(x + 7 + v % 6, 11, 2, 2, "#b8342c");
    }
  });
  wr("timetable", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5;
      P.r(x, 2, 22, 16, "#b8b2a0").r(x, 2, 22, 3, "#4a6a9a");
      for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 5; c2++) {
        const col = pick(g, [ "#c8a0a0", "#a0b8c8", "#c8c0a0", "#a8c8a0", "#c8c4b6" ]);
        P.r(x + 1 + c2 * 4, 6 + r * 3, 3, 2, col);
      }
    }
  });
  wr("flag", {
    w: 16,
    big: 1,
    draw(P, g, v, s) {
      const x = 8;
      P.r(x, 2, 16, 12, "#6a5232").r(x + 1, 3, 14, 10, "#d8d4c6");
      P.r(x + 6, 6, 4, 2, "#b8342c").r(x + 6, 8, 4, 2, "#3a5aa0");
      P.r(x + 2, 4, 2, 1, "#1a1a1a").r(x + 12, 4, 2, 1, "#1a1a1a").r(x + 2, 11, 2, 1, "#1a1a1a").r(x + 12, 11, 2, 1, "#1a1a1a");
    }
  });
  wr("periodic", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 2, 24, 14, "#c8c4b4");
      for (let r = 0; r < 5; r++) for (let c2 = 0; c2 < 11; c2++) {
        if (r < 2 && c2 > 1 && c2 < 9) continue;
        P.r(x + 1 + c2 * 2, 3 + r * 2, 1, 1, [ "#c88a8a", "#c8b86a", "#8ab8c8", "#8ac88a", "#b88ac8" ][(c2 + r) % 5]);
      }
    }
  });
  wr("menu", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5;
      P.r(x, 2, 22, 15, "#3a4a3a").r(x + 1, 3, 20, 13, "#2a3a2a");
      sign(P, x + 1, 3, "식단", "#d8d4c6", 20);
      for (let y = 11; y < 16; y += 2) P.r(x + 3, y, 8 + g.i(8), 1, "#c8c4b4");
    }
  });
  wr("route", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const x = 3;
      P.r(x, 3, 26, 13, "#c8c4b4");
      const L = [ "#3a7a3a", "#3a5aa0", "#c86a2a", "#8a3a8a" ];
      for (let k = 0; k < 3; k++) {
        const y = 6 + k * 3, c = L[(v + k) % 4];
        P.r(x + 2, y, 22, 1, c);
        for (let xx = 3; xx < 24; xx += 4) P.r(x + xx, y - 1, 2, 3, c).p(x + xx, y, "#e8e4d6");
      }
    }
  });
  wr("station", {
    w: 28,
    big: 1,
    draw(P, g, v, s) {
      const x = 2, c = [ "#3a7a3a", "#3a5aa0", "#c86a2a", "#8a3a8a" ][v % 4];
      P.r(x, 3, 28, 11, "#d8d4c6").r(x, 12, 28, 2, c);
      lbl(P, x + 1, 4, [ "시청", "을지로", "종로", "동대문", "신당" ][v % 5], "#1e1e22", 26);
    }
  });
  wr("ward", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 3, 24, 10, "#2a5a6a").r(x + 1, 4, 22, 8, "#3a7a8a");
      sign(P, x + 1, 4, [ "병동", "격리", "처치실", "검사실", "수술실" ][v % 5], "#e0ecec", 22);
    }
  });
  wr("shop", {
    w: 28,
    big: 1,
    draw(P, g, v, s) {
      const x = 2, c = [ "#9a3a32", "#3a5a9a", "#3a7a4a", "#a8842a", "#6a3a7a" ][v % 5];
      P.r(x, 2, 28, 12, sh(c, -.3)).r(x + 1, 3, 26, 10, c);
      sign(P, x + 1, 4, [ "약국", "분식", "세탁", "안경", "미용실", "편의점" ][v % 6], "#ece8da", 26);
    }
  });
  wr("sale", {
    w: 18,
    big: 1,
    draw(P, g, v, s) {
      const x = 7;
      P.r(x, 3, 18, 13, "#b8342c").r(x + 1, 4, 16, 11, "#d84a3a");
      sign(P, x + 1, 4, "세일", "#f0e8c8", 16);
      mini(P, x + 3, 12, [ "50%", "30%", "70%" ][v % 3], "#f0e8c8");
    }
  });
  wr("map", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const x = 3;
      P.r(x, 2, 26, 15, "#4a4a3a").r(x + 1, 3, 24, 13, "#a8a47a");
      for (let k = 0; k < 6; k++) P.line(x + 2 + g.i(20), 4 + g.i(10), x + 2 + g.i(20), 4 + g.i(10), "#7a7a5a");
      for (let k = 0; k < 4; k++) P.p(x + 2 + g.i(21), 4 + g.i(11), pick(g, [ "#b8342c", "#3a5aa0" ]));
      P.line(x + 4, 13, x + 20, 5, "#b8342c");
    }
  });
  wr("roster", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 2, 24, 15, "#3a3c30").r(x + 1, 3, 22, 13, "#c8c4b0");
      sign(P, x + 1, 3, "근무", "#3a3c30", 22);
      for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 5; c2++) P.r(x + 2 + c2 * 4, 11 + r * 2, 3, 1, g.chance(.7) ? "#5a5a4a" : "#b8342c");
    }
  });
  wr("slogan", {
    w: 28,
    big: 1,
    draw(P, g, v, s) {
      const x = 2;
      P.r(x, 4, 28, 10, "#6a5a2a").r(x + 1, 5, 26, 8, "#c8b46a");
      sign(P, x + 1, 5, [ "충성", "단결", "필승", "명예" ][v % 4], "#3a2a12", 26);
    }
  });
  wr("hazard", {
    w: 12,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.poly([ [ x + 6, 3 ], [ x + 12, 15 ], [ x, 15 ] ], "#2a2a2a");
      P.poly([ [ x + 6, 5 ], [ x + 10, 14 ], [ x + 2, 14 ] ], "#c8a02a");
      P.line(x + 7, 7, x + 5, 10, "#1a1a1a").line(x + 5, 10, x + 7, 10, "#1a1a1a").line(x + 7, 10, x + 5, 13, "#1a1a1a");
    }
  });
  wr("safety", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5;
      P.r(x, 3, 22, 12, "#2a5a32").r(x + 1, 4, 20, 10, "#3a7a44");
      if (SX.lang === "en") {
        P.r(x + 1, 7, 4, 2, "#e0ecdc").r(x + 2, 6, 2, 4, "#e0ecdc");
        sign(P, x + 6, 5, "안전", "#e0ecdc", 15);
        return;
      }
      P.r(x + 3, 6, 6, 2, "#e0ecdc").r(x + 5, 4, 2, 6, "#e0ecdc");
      lbl(P, x + 10, 5, [ "안전", "제일" ][v % 2], "#e0ecdc", 11);
    }
  });
  wr("peg", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const x = 3;
      P.r(x, 2, 26, 15, "#7a6a4a");
      for (let yy = 4; yy < 16; yy += 2) for (let xx = 2; xx < 25; xx += 2) P.p(x + xx, yy, "#5a4a32");
      const c = "#3a3226";
      P.r(x + 3, 4, 2, 9, c).r(x + 2, 4, 4, 2, c);
      P.r(x + 9, 5, 1, 9, c).r(x + 8, 5, 3, 3, c);
      P.r(x + 14, 4, 6, 2, c).r(x + 15, 6, 2, 8, c);
      P.oval(x + 22, 9, 2, 3, c);
    }
  });
  wr("wboard", {
    w: 24,
    big: 1,
    draw(P, g, v, s) {
      const x = 4;
      P.r(x, 2, 24, 15, "#8a8c90").r(x + 1, 3, 22, 12, "#d8d6ce");
      for (let k = 0; k < 3; k++) {
        let xx = x + 3, y = 5 + k * 3;
        const c = pick(g, [ "#3a5aa0", "#2a2a2a", "#a8302a" ]);
        while (xx < x + 18 + g.i(3)) {
          P.p(xx, y + (g.chance(.3) ? 1 : 0), c);
          xx++;
        }
      }
      P.r(x + 1, 15, 22, 1, "#6a6c70").r(x + 5, 14, 3, 1, "#a8302a");
    }
  });
  wr("height", {
    w: 12,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      for (let k = 0; k < 4; k++) {
        const y = 4 + k * 3 + g.i(2);
        P.r(x, y, 5, 1, "#4a4a5a");
        mini(P, x + 6, y - 2, String(9 - k), "#4a4a5a");
      }
    }
  });
  wr("frame", {
    w: 11,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 11);
      P.r(x, 3, 11, 9, "#5a4228").r(x + 1, 4, 9, 7, "#8a9aaa").r(x + 2, 6, 3, 5, "#6a5a4a").r(x + 6, 7, 3, 4, "#7a6a5a").r(x + 2, 5, 2, 1, "#a88a6a").r(x + 6, 6, 2, 1, "#a88a6a");
      if (v & 1) P.line(x + 1, 4, x + 9, 10, "#d8e0e6");
    }
  });
  wr("mirror", {
    w: 14,
    big: 1,
    draw(P, g, v, s) {
      const x = 9;
      P.r(x, 2, 14, 12, "#8a8c90").r(x + 1, 3, 12, 10, "#7a9aa6").line(x + 3, 11, x + 8, 4, "#a8c8d0");
      if (v & 1) {
        P.line(x + 6, 3, x + 10, 12, "#3a4a52").line(x + 8, 7, x + 12, 6, "#3a4a52");
      }
    }
  });
  wr("xray", {
    w: 20,
    big: 1,
    draw(P, g, v, s) {
      const x = 6;
      P.r(x, 2, 20, 14, "#5a5c60").r(x + 1, 3, 18, 11, "#2a3a44");
      P.r(x + 4, 4, 1, 9, "#8a9aa6").r(x + 9, 4, 1, 9, "#8a9aa6");
      for (let y = 5; y < 13; y += 2) {
        P.r(x + 3, y, 3, 1, "#7a8a96");
        P.r(x + 8, y, 3, 1, "#7a8a96");
      }
      P.r(x + 13, 4, 4, 5, "#6a7a86");
    }
  });
  wr("screen", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const x = 3;
      P.r(x, 2, 26, 3, "#2a2c30").r(x + 1, 3, 24, 1, "#4a4c50");
      if (v & 1) P.r(x + 2, 5, 22, 10, "#c8c6be").r(x + 2, 14, 22, 1, "#8a8a86");
    }
  });
  wr("graff", {
    w: 28,
    big: 1,
    draw(P, g, v, s) {
      const c = pick(g, [ "#a8302a", "#2a2a2a", "#c8c4b6", "#3a5aa0" ]);
      const w = [ "살려줘", "탈출", "감염", "여기", "한강", "가족", "도와줘", "배고파" ][v % 8], gx = 2 + g.i(4);
      sign(P, gx, 4 + g.i(5), w, c, SX.lang === "en" ? 30 - gx : 0, {
        big: 1
      });
      if (v & 8) {
        P.r(4, 15, 14, 1, c).line(15, 13, 18, 15, c).line(15, 17, 18, 15, c);
      }
      for (let k = 0; k < 4; k++) {
        const xx = 3 + g.i(24);
        P.r(xx, 12 + g.i(4), 1, 2 + g.i(3), c);
      }
    }
  });
  wr("address", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5;
      P.r(x, 3, 22, 10, "#1e3a7a").r(x + 1, 4, 20, 8, "#2a4a9a");
      lbl(P, x + 1, 4, [ "세종로", "을지로", "청계로", "퇴계로" ][v % 4], "#e8ecf4", 20);
    }
  });
  wr("meter", {
    w: 12,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 3, 12, 12, "#5a5c58").r(x + 1, 4, 10, 10, "#7a7c76").r(x + 3, 6, 6, 4, "#2a2c2a").r(x + 4, 7, 4, 2, "#8a9a7a").r(x + 2, 15, 2, 4, "#8a7a3a").r(x + 8, 15, 2, 4, "#8a7a3a");
    }
  });
  wr("noentry", {
    w: 22,
    big: 1,
    draw(P, g, v, s) {
      const x = 5;
      P.r(x, 3, 22, 11, "#c8c4b6").r(x, 3, 22, 3, "#a8302a");
      sign(P, x + 1, 6, [ "출입", "금지", "통제" ][v % 3], "#a8302a", 20);
      P.r(x + 1, 4, 20, 1, "#e0dccb");
    }
  });
  wr("km", {
    w: 12,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 12);
      P.r(x, 4, 12, 7, "#d8d4c6").r(x, 4, 12, 1, "#a8a498");
      mini(P, x + 1, 5, String(10 + v % 30) + "." + v % 10, "#1e1e22");
    }
  });
  wr("phone", {
    w: 9,
    big: 0,
    draw(P, g, v, s) {
      const x = SX0(s, 9);
      P.r(x, 3, 9, 13, "#b8642a").r(x + 1, 4, 7, 11, "#d8843a").r(x + 2, 6, 5, 6, "#3a3a3a").r(x + 3, 7, 3, 2, "#6a6a6a");
      mini(P, x + 1, 12, "SOS", "#f0e0c8");
    }
  });
  wr("contId", {
    w: 26,
    big: 1,
    draw(P, g, v, s) {
      const c = "#d8d4c6";
      mini(P, 3, 5, [ "SEOU", "HGNU", "MPOU", "YDPU" ][v % 4], c);
      mini(P, 3, 11, String(100 + v * 37 % 899), c);
    }
  });
  wr("ties", {
    w: 28,
    big: 1,
    tall: 1,
    draw(P, g, v, s, G, dh) {
      dh = dh | 0;
      for (let y = 5; y < 18 + dh; y += 6) for (let x = 4; x < 30; x += 8) P.r(x, y, 2, 2, "#4a4a48").p(x + 1, y + 1, "#6a6a66");
      P.r(0, 11 + (dh >> 1), 32, 1, "rgba(0,0,0,0.12)");
    }
  });
  wr("windowTape", {
    w: 28,
    big: 1,
    win: 1,
    tall: 1,
    draw(P, g, v, s, G) {
      const c = "#b8a87a", y0 = G ? G.y : 3, h = G ? G.h : 15;
      P.line(5, y0 + 2, 26, y0 + h - 3, c).line(5, y0 + 3, 26, y0 + h - 2, c).line(26, y0 + 2, 5, y0 + h - 3, c).line(26, y0 + 3, 5, y0 + h - 2, c);
    }
  });
  wr("windowCrack", {
    w: 28,
    big: 1,
    win: 1,
    tall: 1,
    draw(P, g, v, s, G) {
      const y0 = G ? G.y : 3, h = G ? G.h : 15, cx = 8 + g.i(16), cy = y0 + 4 + g.i(h - 9), c = "#d8ecf0";
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + g.f(), l = 4 + g.i(6);
        P.line(cx, cy, Math.round(cx + Math.cos(a) * l), Math.round(cy + Math.sin(a) * l * .7), c);
      }
      P.r(cx - 1, cy - 1, 2, 2, "#2a3a42");
    }
  });
  wr("windowBoard", {
    w: 28,
    big: 1,
    win: 1,
    tall: 1,
    draw(P, g, v, s, G) {
      const y0 = G ? G.y : 3, h = G ? G.h : 15;
      for (let y = y0 + 2; y + 4 <= y0 + h - 1; y += 6) {
        const c = pick(g, [ "#7a5e3a", "#8a6a44" ]);
        P.r(2, y + (g.i(3) - 1), 28, 4, c).r(2, y, 28, 1, sh(c, .15)).p(4, y + 2, "#3a3a3a").p(27, y + 2, "#3a3a3a");
      }
    }
  });
  wr("windowBlind", {
    w: 28,
    big: 1,
    win: 1,
    tall: 1,
    draw(P, g, v, s, G) {
      const y0 = G ? G.y : 3, wh = G ? G.h : 15, h = 4 + g.i(wh - 6), t = y0 + 1;
      for (let y = t; y < t + h; y += 2) P.r(4, y, 24, 1, "#a8a69c");
      P.r(4, y0, 24, 1, "#6a6c70");
      if (v & 1) P.line(6, t + h, 26, t + h + 3, "#a8a69c");
    }
  });
  wr("windowCurtain", {
    w: 28,
    big: 1,
    win: 1,
    tall: 1,
    draw(P, g, v, s, G) {
      const c = pick(g, [ "#6a3a3a", "#3a4a6a", "#6a6a4a" ]), t = (G ? G.y : 3) + 1, h = (G ? G.h : 15) - 2;
      P.r(4, t, 5, h, c).r(23, t, 5, h, c).r(5, t, 1, h, sh(c, .2)).r(25, t, 1, h, sh(c, -.2));
    }
  });
  wr("para", {
    w: 32,
    para: 1,
    draw(P, g, v) {
      const k = v % 4;
      if (k === 0) {
        P.r(8 + g.i(14), 2, 3, 3, "#8a5a1a").p(9 + g.i(12), 3, "#d8a030");
      }
      if (k <= 1) for (let q = 0; q < 2; q++) {
        const x = 2 + g.i(28);
        P.r(x, 3, 1, 4 + g.i(3), "rgba(120,60,24,0.35)");
      }
      if (k === 2) {
        P.r(4 + g.i(18), 3, 6, 2, "#7a7c77").p(5 + g.i(16), 4, "#4a4c48");
      }
      if (k === 3) {
        const c = pick(g, [ "#a8302a", "#3a5aa0", "#c8c4b6" ]);
        P.r(6, 4, 8, 1, c).r(14, 3, 1, 3, c).r(17, 4, 5, 1, c);
      }
    }
  });
  band("conduit", (P, g, ends) => {
    P.r(0, 4, TS, 2, "#6a6c70").r(0, 4, TS, 1, "#9a9ca0");
    P.r(10, 3, 2, 4, "#3a3c40").r(26, 3, 2, 4, "#3a3c40");
    if (ends & 1) P.r(0, 3, 2, 4, "#4a4c50");
    if (ends & 2) P.r(TS - 2, 3, 2, 4, "#4a4c50");
  });
  band("tray", (P, g, ends) => {
    P.r(0, 3, TS, 4, "#3a3c40").r(0, 3, TS, 1, "#6a6c70");
    for (let k = 0; k < 4; k++) P.r(0, 4 + k % 3, TS, 1, [ "#1e1f22", "#5a2a22", "#2a3a5a", "#2a2a2e" ][k]);
    P.r(4, 7, 1, 3, "#4a4c50").r(20, 7, 1, 3, "#4a4c50");
  });
  band("hazard", (P, g, ends, d) => {
    d = d | 0;
    P.r(0, 15 + d, TS, 4, "#b8942a");
    for (let x = -4; x < TS; x += 8) P.poly([ [ x, 19 + d ], [ x + 4, 15 + d ], [ x + 8, 15 + d ], [ x + 4, 19 + d ] ], "#2a2824");
  });
  band("tiles", (P, g, ends, d) => {
    d = d | 0;
    const e = d >> 1, y0 = 9 + d - e, h = 10 + e;
    P.r(0, y0, TS, h, "#b8b6ac");
    for (let x = 0; x < TS; x += 6) P.r(x, y0, 1, h, "#8a887e");
    for (let y = y0; y < y0 + h; y += 5) P.r(0, y, TS, 1, "#8a887e");
    P.r(0, y0, TS, 1, "#cac8be");
  });
  band("wainscotG", (P, g, ends, d) => {
    d = d | 0;
    const e = d >> 1, y0 = 11 + d - e;
    P.r(0, y0, TS, 8 + e, "#5a7a62").r(0, y0, TS, 1, "#3a5a42").r(0, y0 + 1, TS, 1, "#6a8a72");
    for (let k = 0; k < 6; k++) P.p(g.i(TS), y0 + 2 + g.i(5 + e), "#4a6a52");
  });
  band("wainscotB", (P, g, ends, d) => {
    d = d | 0;
    const e = d >> 1, y0 = 11 + d - e;
    P.r(0, y0, TS, 8 + e, "#5a6a82").r(0, y0, TS, 1, "#3a4a62").r(0, y0 + 1, TS, 1, "#6a7a92");
    for (let k = 0; k < 6; k++) P.p(g.i(TS), y0 + 2 + g.i(5 + e), "#4a5a72");
  });
  band("pads", (P, g, ends, d) => {
    d = d | 0;
    const e = Math.round(d * .75), y0 = 6 + d - e, h = 13 + e;
    P.r(0, y0, TS, h, "#2a4a8a").r(0, y0, TS, 1, "#3a5aa0");
    P.r(15, y0, 2, h, "#1e3a6a");
    P.p(4 + g.i(8), y0 + 3 + g.i(6 + e), "#3a5aa0");
  });
  band("rail", (P, g, ends, d) => {
    const y = 10 + Math.round((d | 0) * 15 / 24);
    P.r(0, y, TS, 2, "#6a5232").r(0, y, TS, 1, "#8a6e4a");
  });
  band("grime", (P, g, ends, d) => {
    d = d | 0;
    for (let x = 0; x < TS; x++) {
      const h = 2 + (x * 7 + g.i(3)) % 5;
      P.r(x, 19 + d - h, 1, h, "rgba(40,34,24,0.14)");
    }
  });
  cr("dust", (P, g) => {
    for (let k = 0; k < 10; k++) P.p(2 + g.i(28), 2 + g.i(28), pick(g, [ "#3c3f46", "#44474e", "#363940" ]));
  });
  cr("crack", (P, g) => {
    let x = 4 + g.i(24), y = 1;
    for (let k = 0; k < 16; k++) {
      P.p(x, y, "#18191c");
      x += g.chance(.5) ? g.chance(.5) ? 1 : -1 : 0;
      y += 2;
      if (y > 30) break;
    }
  });
  cr("cableV", (P, g) => {
    P.r(20, 0, 2, TS, "#141518").r(20, 0, 1, TS, "#3a3c42");
  });
  cr("cableH", (P, g) => {
    P.r(0, 18, TS, 2, "#141518").r(0, 18, TS, 1, "#3a3c42");
  });
  cr("debris", (P, g) => {
    for (let k = 0; k < 4; k++) {
      const x = 3 + g.i(25), y = 3 + g.i(25), c = pick(g, [ "#4a4c52", "#5a5c62", "#3e4046" ]);
      P.r(x, y, 2, 2, c).p(x, y, sh(c, .3));
    }
  });
  cr("moss", (P, g) => {
    for (let k = 0; k < 14; k++) P.p(g.i(TS), g.i(TS), pick(g, [ "#2e3a26", "#34422a", "#283220" ]));
  });
  cr("drop", (P, g) => {
    for (let k = 0; k < 3; k++) {
      const x = 3 + g.i(25), y = 3 + g.i(25);
      P.r(x, y, 2, 1, "#8a8a84").p(x + 1, y + 1, "#6a6a64");
    }
  });
  cr("chip", (P, g) => {
    const x = 4 + g.i(22);
    P.r(x, 0, 5, 2, "#3e4148").r(x + 1, 2, 3, 1, "#3e4148").p(x + 2, 0, "#505460");
  });
  cr("butt", (P, g) => {
    const x = 6 + g.i(20), y = 6 + g.i(20);
    P.r(x, y, 3, 1, "#8a867e").p(x + 3, y, "#8a5a32");
  });
  cr("pRefl", (P, g, v) => {
    const x = v ? 3 : 25;
    P.r(x, 12, 4, 6, "#4a3a1a").r(x + 1, 13, 2, 4, "#c8902a").p(x + 1, 13, "#f0c050");
  });
  cr("pDrop", (P, g) => {
    for (let k = 0; k < 3; k++) {
      const x = 3 + g.i(25), y = 3 + g.i(25);
      P.r(x, y, 2, 2, "#c8c6bc").p(x + 2, y + 1, "#a8a69c").p(x, y + 1, "#4a4a44");
    }
  });
  cr("pMoss", (P, g) => {
    const x = g.chance(.5) ? 0 : 24;
    for (let k = 0; k < 16; k++) P.p(x + g.i(8), g.i(TS), pick(g, [ "#4a5a32", "#566a3a", "#3e4a2a" ]));
  });
  cr("pRust", (P, g) => {
    const x = 6 + g.i(18);
    P.r(x, 0, 2, TS, "rgba(120,62,26,0.3)").r(x + 1, 4 + g.i(10), 1, 8, "rgba(140,72,30,0.35)");
  });
  cr("pChip", (P, g) => {
    const x = 4 + g.i(22), y = 4 + g.i(20);
    P.r(x, y, 4, 3, "#5a5c58").r(x + 1, y + 1, 2, 1, "#4a4c48").p(x, y, "#8a8c88");
  });
  cr("pBolt", (P, g) => {
    P.r(10, 10, 12, 12, "#5a5c60").r(10, 10, 12, 1, "#8a8c90");
    for (const [x, y] of [ [ 12, 12 ], [ 19, 12 ], [ 12, 19 ], [ 19, 19 ] ]) P.p(x, y, "#2a2c30").p(x + 1, y, "#9a9ca0");
    P.r(14, 14, 4, 4, "#4a4c50");
  });
  function faceZone(F, b, x, y) {
    const zk = zoneOf(F, b, x, y + 1);
    if (b.outdoor === "site") {
      const wc = F.wallColAt && F.wallColAt(x, y);
      if (wc === "#6e6f68") return "sFence";
      if (wc) return "sCont";
      return zk || "sFrame";
    }
    if (b.outdoor === "tunnel") {
      if (!zk) return "tConc";
      return zk;
    }
    if (b.outdoor === true) return "bridge";
    if (F.kind === "roof") return "roofHut";
    return zk || "corr";
  }
  const FW = {
    corr: [ [ "evac", 3 ], [ "notice", 3 ], [ "missing", 3 ], [ "poster", 2 ], [ "exit", 2 ], [ "extSign", 2 ], [ "alarm", 2 ], [ "outlet", 3 ], [ "switch", 2 ], [ "vent", 2 ], [ "cctv", 2 ], [ "stain", 3 ], [ "crack", 3 ], [ "holes", 2 ], [ "peel", 2 ], [ "graff", 2 ], [ "scraps", 2 ], [ "hand", 1 ], [ "tally", 1 ], [ "pipeV", 1 ], [ "cable", 1 ], [ "board", 1 ] ],
    lobby: [ [ "evac", 2 ], [ "notice", 3 ], [ "missing", 3 ], [ "poster", 3 ], [ "exit", 2 ], [ "cctv", 2 ], [ "board", 2 ], [ "stain", 2 ], [ "holes", 2 ], [ "graff", 2 ], [ "scraps", 2 ], [ "clock", 1 ], [ "intercom", 1 ] ],
    stair: [ [ "exit", 3 ], [ "notice", 2 ], [ "stain", 2 ], [ "crack", 2 ], [ "holes", 1 ], [ "graff", 2 ], [ "tally", 1 ], [ "alarm", 1 ] ],
    "th:office": [ [ "clock", 3 ], [ "calendar", 3 ], [ "wboard", 2 ], [ "board", 2 ], [ "outlet", 4 ], [ "switch", 3 ], [ "frame", 1 ], [ "vent", 2 ], [ "stain", 2 ], [ "crack", 2 ], [ "holes", 1 ], [ "scraps", 2 ], [ "hooks", 1 ] ],
    "th:cubicles": [ [ "clock", 2 ], [ "calendar", 2 ], [ "wboard", 2 ], [ "board", 2 ], [ "outlet", 4 ], [ "switch", 2 ], [ "vent", 2 ], [ "stain", 2 ], [ "holes", 1 ], [ "scraps", 2 ] ],
    "th:meeting": [ [ "screen", 3 ], [ "clock", 3 ], [ "wboard", 2 ], [ "outlet", 3 ], [ "switch", 2 ], [ "frame", 1 ], [ "stain", 1 ], [ "vent", 1 ] ],
    "th:pantry": [ [ "calendar", 2 ], [ "notice", 1 ], [ "outlet", 4 ], [ "switch", 2 ], [ "clock", 2 ], [ "stain", 3 ], [ "vent", 2 ], [ "hooks", 2 ], [ "crack", 1 ] ],
    "th:kitchen": [ [ "calendar", 2 ], [ "frame", 2 ], [ "outlet", 4 ], [ "switch", 2 ], [ "hooks", 3 ], [ "stain", 3 ], [ "vent", 2 ], [ "clock", 1 ], [ "intercom", 1 ] ],
    "th:bunk": [ [ "frame", 3 ], [ "calendar", 2 ], [ "height", 2 ], [ "clock", 2 ], [ "outlet", 3 ], [ "switch", 2 ], [ "intercom", 2 ], [ "hooks", 2 ], [ "stain", 3 ], [ "crack", 2 ], [ "peel", 2 ], [ "poster", 1 ], [ "mirror", 1 ] ],
    "th:store": [ [ "hazard", 2 ], [ "safety", 2 ], [ "notice", 1 ], [ "outlet", 2 ], [ "switch", 2 ], [ "stain", 3 ], [ "crack", 3 ], [ "peel", 2 ], [ "pipeV", 2 ], [ "cable", 2 ], [ "tally", 2 ], [ "vent", 2 ] ],
    "th:shop": [ [ "shop", 4 ], [ "sale", 3 ], [ "poster", 2 ], [ "clock", 1 ], [ "outlet", 2 ], [ "cctv", 2 ], [ "stain", 2 ], [ "holes", 1 ], [ "scraps", 2 ], [ "graff", 1 ] ],
    "th:atrium": [ [ "shop", 3 ], [ "sale", 3 ], [ "poster", 3 ], [ "evac", 2 ], [ "exit", 2 ], [ "cctv", 2 ], [ "notice", 2 ], [ "missing", 2 ], [ "holes", 2 ], [ "graff", 2 ] ],
    "th:ward": [ [ "o2", 4 ], [ "nurse", 3 ], [ "sanit", 3 ], [ "ward", 2 ], [ "clock", 2 ], [ "calendar", 1 ], [ "outlet", 2 ], [ "stain", 3 ], [ "hand", 1 ], [ "crack", 2 ], [ "noentry", 1 ], [ "scraps", 1 ] ],
    "th:surgery": [ [ "xray", 3 ], [ "o2", 3 ], [ "clock", 2 ], [ "sanit", 2 ], [ "outlet", 2 ], [ "stain", 3 ], [ "ward", 1 ], [ "vent", 2 ] ],
    "th:reception": [ [ "ward", 2 ], [ "notice", 3 ], [ "missing", 2 ], [ "poster", 3 ], [ "clock", 2 ], [ "sanit", 2 ], [ "cctv", 1 ], [ "exit", 1 ], [ "stain", 2 ], [ "scraps", 2 ] ],
    "th:classroom": [ [ "flag", 2 ], [ "speaker", 3 ], [ "timetable", 3 ], [ "clock", 3 ], [ "board", 2 ], [ "poster", 2 ], [ "outlet", 2 ], [ "switch", 2 ], [ "plate", 1 ], [ "scraps", 2 ], [ "stain", 2 ], [ "crack", 1 ], [ "graff", 1 ], [ "tally", 1 ] ],
    "th:library": [ [ "clock", 2 ], [ "poster", 2 ], [ "notice", 2 ], [ "board", 1 ], [ "outlet", 2 ], [ "switch", 2 ], [ "stain", 2 ], [ "peel", 1 ], [ "crack", 1 ] ],
    "th:lab": [ [ "periodic", 4 ], [ "hazard", 2 ], [ "clock", 2 ], [ "outlet", 3 ], [ "sanit", 1 ], [ "vent", 2 ], [ "stain", 3 ], [ "scorch", 2 ], [ "crack", 1 ] ],
    "th:cafeteria": [ [ "menu", 4 ], [ "clock", 2 ], [ "poster", 2 ], [ "outlet", 2 ], [ "vent", 2 ], [ "stain", 3 ], [ "speaker", 2 ], [ "notice", 1 ] ],
    "th:mess": [ [ "menu", 4 ], [ "slogan", 2 ], [ "clock", 2 ], [ "outlet", 2 ], [ "vent", 2 ], [ "stain", 3 ], [ "notice", 1 ] ],
    "th:gym": [ [ "slogan", 1 ], [ "clock", 2 ], [ "speaker", 2 ], [ "poster", 2 ], [ "stain", 2 ], [ "holes", 2 ], [ "scraps", 1 ], [ "graff", 1 ] ],
    "th:platform": [ [ "station", 4 ], [ "route", 3 ], [ "poster", 3 ], [ "exit", 2 ], [ "cctv", 2 ], [ "clock", 2 ], [ "stain", 3 ], [ "holes", 2 ], [ "graff", 2 ], [ "missing", 2 ] ],
    "th:concourse": [ [ "route", 3 ], [ "station", 2 ], [ "poster", 3 ], [ "notice", 2 ], [ "missing", 2 ], [ "exit", 2 ], [ "cctv", 2 ], [ "clock", 2 ], [ "stain", 2 ], [ "graff", 2 ] ],
    "th:maint": [ [ "hazard", 4 ], [ "meter", 2 ], [ "pipeV", 3 ], [ "cable", 2 ], [ "intercom", 1 ], [ "clock", 1 ], [ "stain", 3 ], [ "crack", 2 ], [ "tally", 1 ], [ "safety", 1 ] ],
    "th:toilet": [ [ "mirror", 4 ], [ "outlet", 1 ], [ "stain", 4 ], [ "crack", 3 ], [ "graff", 2 ], [ "vent", 2 ], [ "scraps", 1 ] ],
    "th:barracks": [ [ "roster", 3 ], [ "slogan", 3 ], [ "clock", 2 ], [ "hooks", 3 ], [ "outlet", 2 ], [ "switch", 2 ], [ "calendar", 1 ], [ "stain", 2 ], [ "holes", 2 ], [ "tally", 2 ] ],
    "th:armory": [ [ "noentry", 3 ], [ "hazard", 2 ], [ "slogan", 2 ], [ "roster", 1 ], [ "outlet", 2 ], [ "stain", 2 ], [ "holes", 3 ], [ "tally", 2 ], [ "cctv", 2 ] ],
    "th:command": [ [ "map", 4 ], [ "flag", 2 ], [ "clock", 3 ], [ "roster", 2 ], [ "wboard", 2 ], [ "outlet", 2 ], [ "intercom", 2 ], [ "stain", 1 ], [ "holes", 1 ] ],
    "th:motor": [ [ "peg", 3 ], [ "hazard", 2 ], [ "safety", 2 ], [ "meter", 1 ], [ "pipeV", 2 ], [ "cable", 2 ], [ "stain", 3 ], [ "crack", 2 ], [ "tally", 1 ] ],
    "th:yard": [ [ "slogan", 2 ], [ "noentry", 2 ], [ "holes", 3 ], [ "stain", 2 ], [ "graff", 1 ], [ "crack", 2 ] ],
    "th:none": [ [ "stain", 3 ], [ "crack", 3 ], [ "peel", 2 ], [ "holes", 2 ], [ "outlet", 2 ], [ "switch", 1 ], [ "scraps", 2 ], [ "graff", 1 ], [ "tally", 1 ] ],
    walk: [ [ "graff", 4 ], [ "poster", 3 ], [ "missing", 3 ], [ "address", 2 ], [ "meter", 2 ], [ "pipeV", 2 ], [ "cctv", 2 ], [ "stain", 3 ], [ "holes", 2 ], [ "scraps", 3 ], [ "noentry", 1 ], [ "crack", 2 ] ],
    road: [ [ "graff", 3 ], [ "poster", 2 ], [ "stain", 2 ], [ "holes", 2 ] ],
    roofHut: [ [ "stain", 3 ], [ "crack", 3 ], [ "graff", 2 ], [ "pipeV", 2 ], [ "meter", 2 ], [ "exit", 1 ] ],
    tConc: [ [ "km", 3 ], [ "phone", 2 ], [ "exit", 2 ], [ "stain", 4 ], [ "crack", 3 ], [ "graff", 3 ], [ "pipeV", 1 ], [ "hazard", 1 ], [ "holes", 1 ] ],
    tRail: [ [ "km", 3 ], [ "phone", 2 ], [ "exit", 2 ], [ "stain", 4 ], [ "crack", 3 ], [ "graff", 3 ], [ "hazard", 1 ] ],
    tPlat: [ [ "station", 3 ], [ "route", 3 ], [ "poster", 3 ], [ "exit", 2 ], [ "missing", 2 ], [ "cctv", 2 ], [ "stain", 2 ], [ "graff", 2 ], [ "holes", 2 ] ],
    tCar: [ [ "route", 2 ], [ "poster", 2 ], [ "stain", 2 ], [ "graff", 2 ], [ "scraps", 2 ] ],
    tHut: [ [ "hazard", 2 ], [ "meter", 2 ], [ "phone", 1 ], [ "stain", 3 ], [ "tally", 2 ], [ "clock", 1 ] ],
    tMach: [ [ "hazard", 3 ], [ "meter", 3 ], [ "pipeV", 3 ], [ "cable", 2 ], [ "exit", 2 ], [ "stain", 3 ], [ "holes", 2 ] ],
    sFence: [ [ "safety", 3 ], [ "noentry", 3 ], [ "graff", 3 ], [ "poster", 2 ], [ "stain", 3 ], [ "holes", 2 ], [ "scraps", 2 ] ],
    sCont: [ [ "contId", 5 ], [ "stain", 3 ], [ "graff", 2 ], [ "holes", 1 ], [ "hazard", 1 ] ],
    sFrame: [ [ "ties", 5 ], [ "graff", 2 ], [ "stain", 2 ], [ "crack", 3 ], [ "holes", 1 ] ],
    sDirt: [ [ "ties", 3 ], [ "graff", 2 ], [ "stain", 2 ], [ "crack", 2 ] ],
    sRoad: [ [ "ties", 2 ], [ "graff", 2 ], [ "stain", 2 ] ],
    sOffice: [ [ "calendar", 2 ], [ "wboard", 2 ], [ "safety", 2 ], [ "clock", 2 ], [ "outlet", 2 ], [ "notice", 1 ], [ "stain", 2 ] ],
    bridge: []
  };
  const FWF = {
    mall: {
      walk: [ [ "shop", 5 ], [ "sale", 3 ], [ "poster", 2 ] ],
      corr: [ [ "shop", 2 ], [ "sale", 2 ] ]
    },
    hos: {
      walk: [ [ "ward", 1 ], [ "noentry", 2 ] ],
      corr: [ [ "ward", 3 ], [ "sanit", 2 ], [ "noentry", 1 ] ]
    },
    school: {
      walk: [ [ "notice", 2 ], [ "poster", 2 ] ],
      corr: [ [ "timetable", 1 ], [ "board", 2 ], [ "speaker", 1 ], [ "poster", 2 ] ]
    },
    metro: {
      walk: [ [ "route", 2 ], [ "station", 2 ] ],
      corr: [ [ "route", 2 ], [ "poster", 2 ] ]
    },
    base: {
      walk: [ [ "noentry", 3 ], [ "slogan", 2 ] ],
      corr: [ [ "slogan", 3 ], [ "roster", 1 ], [ "noentry", 1 ] ]
    },
    office: {
      walk: [ [ "address", 1 ] ],
      corr: [ [ "board", 1 ], [ "clock", 1 ], [ "evac", 1 ] ]
    },
    villa: {
      walk: [ [ "address", 2 ], [ "meter", 2 ], [ "poster", 1 ] ],
      corr: [ [ "meter", 2 ], [ "intercom", 2 ], [ "poster", 1 ] ]
    },
    heli: {
      walk: [ [ "noentry", 1 ], [ "poster", 2 ] ],
      corr: [ [ "clock", 2 ], [ "notice", 1 ], [ "board", 1 ] ]
    },
    train: {
      walk: [ [ "notice", 2 ] ],
      corr: [ [ "notice", 2 ], [ "board", 1 ], [ "tally", 2 ] ]
    }
  };
  const fwl = new Map;
  const fwList = (zk, bid) => {
    const key = zk + "|" + bid;
    let L = fwl.get(key);
    if (L) return L;
    L = (FW[zk] || FW.corr).concat(FWF[bid] && FWF[bid][zk] || []);
    fwl.set(key, L);
    return L;
  };
  const FWIN = [ [ "windowTape", 4 ], [ "windowCrack", 2 ], [ "windowBoard", 2 ], [ "windowBlind", 2 ], [ "windowCurtain", 2 ] ];
  const FB = {
    corr: {
      school: [ [ "wainscotG", 3 ] ],
      hos: [ [ "wainscotB", 2 ], [ "wainscotG", 1 ] ],
      base: [ [ "wainscotG", 1 ], [ "grime", 1 ] ],
      metro: [ [ "tiles", 2 ] ],
      _: [ [ "conduit", 1 ], [ "grime", 1 ], [ "rail", 1 ] ]
    },
    "th:store": [ [ "hazard", 2 ], [ "conduit", 1 ], [ "grime", 1 ] ],
    "th:motor": [ [ "hazard", 3 ] ],
    "th:armory": [ [ "hazard", 2 ] ],
    "th:maint": [ [ "conduit", 2 ], [ "hazard", 1 ] ],
    "th:toilet": [ [ "tiles", 4 ] ],
    "th:surgery": [ [ "tiles", 3 ] ],
    "th:kitchen": [ [ "tiles", 2 ] ],
    "th:pantry": [ [ "tiles", 1 ], [ "rail", 1 ] ],
    "th:gym": [ [ "pads", 4 ] ],
    "th:classroom": [ [ "rail", 2 ], [ "wainscotG", 1 ] ],
    "th:office": [ [ "rail", 1 ] ],
    "th:bunk": [ [ "rail", 1 ] ],
    "th:ward": [ [ "wainscotB", 2 ], [ "rail", 1 ] ],
    tConc: [ [ "tray", 4 ] ],
    tRail: [ [ "tray", 4 ] ],
    tMach: [ [ "conduit", 2 ], [ "tray", 1 ] ],
    tPlat: [ [ "tiles", 2 ] ],
    walk: [ [ "grime", 2 ] ],
    roofHut: [ [ "grime", 1 ] ]
  };
  function wallsFor(F, lv, b, seed) {
    const W = F.W, H = F.H, bid = b.id || "office";
    const g = new SX.Rng(SX.hash("decoWall:" + seed + ":" + bid + ":" + F.idx));
    const fw = new Map, fc = new Map, ft = F.t, N = W * H;
    const wsh = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const t = ft[i];
      wsh[i] = t === T.WALL || t === T.WINDOW ? 1 : t === T.DOOR && isWallish(F, i % W, i / W | 0) ? 1 : 0;
    }
    const wsA = (x, y) => x >= 0 && y >= 0 && x < W && y < H && wsh[y * W + x] === 1, tA = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? ft[y * W + x] : T.VOID;
    for (let y = 0; y < H; y++) {
      let x = 0;
      const front = xx => ft[y * W + xx] === T.WALL && wsh[y * W + xx] && !wsA(xx, y + 1);
      while (x < W) {
        if (!front(x)) {
          x++;
          continue;
        }
        let x2 = x;
        const zk = faceZone(F, b, x, y);
        while (x2 + 1 < W && front(x2 + 1) && faceZone(F, b, x2 + 1, y) === zk) x2++;
        let tb = FB[zk];
        if (tb && !Array.isArray(tb)) tb = (tb[bid] || []).concat(tb._ || []);
        if (tb && tb.length && x2 - x >= 1 && g.chance(zk === "corr" ? .5 : .7)) {
          const bn = BI[wpick(g, tb)];
          for (let xx = x; xx <= x2; xx++) fw.set(y * W + xx, [ bn, 0, 0 ]);
        }
        x = x2 + 1;
      }
    }
    const near = (x, y, dx) => {
      const t = tA(x + dx, y);
      if (t !== T.DOOR) return false;
      const d = F.doorAt.get(F.i(x + dx, y));
      return !!(d && d.horiz);
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = ft[i];
      if (t !== T.PARAPET && t !== T.WALL && t !== T.WINDOW) continue;
      if (t === T.PARAPET) {
        if (tA(x, y + 1) !== T.PARAPET && g.chance(.6)) fw.set(i, [ 0, WRI.para * 64 + g.i(16), 0 ]);
        const vert = tA(x, y - 1) === T.PARAPET && tA(x, y + 1) === T.PARAPET;
        if (b.outdoor === true && vert && y % 4 === 0) fc.set(i, CRI.pRefl * 64 + (x < W / 2 ? 0 : 1)); else if (g.chance(.3)) fc.set(i, CRI[pick(g, [ "pDrop", "pMoss", "pRust", "pChip", "pDrop", "pBolt" ])] * 64 + g.i(16));
        continue;
      }
      const front = !wsA(x, y + 1);
      if (front) {
        const zk = faceZone(F, b, x, y);
        const e = fw.get(i) || [ 0, 0, 0 ];
        if (t === T.WINDOW) {
          if (F.kind === "floor" && g.chance(b.outdoor ? .5 : .55)) {
            e[1] = WRI[wpick(g, FWIN)] * 64 + g.i(16);
            fw.set(i, e);
          }
          continue;
        }
        const h = (x * 7 + y * 13) % 29, base = h === 3 ? 1 : h === 11 ? 2 : h === 17 ? 3 : h === 23 && F.kind === "floor" ? 4 : 0;
        const list = fwList(zk, bid);
        if (!list.length) {
          if (e[0]) fw.set(i, e);
          continue;
        }
        const dl = near(x, y, -1), dr = near(x, y, 1);
        if ((dl || dr) && g.chance(.6)) {
          const nm = zk.startsWith("th:") ? pick(g, [ "plate", "plate", "switch" ]) : pick(g, [ "exit", "plate", "switch", "extSign" ]);
          e[1] = WRI[nm] * 64 + (nm === "plate" ? (F.idx & 3) << 4 | g.i(9) : g.i(64));
          e[3] = dl ? 0 : 2;
          fw.set(i, e);
          continue;
        }
        if (!g.chance(.72)) {
          if (e[0]) fw.set(i, e);
          continue;
        }
        let tries = 0, nm = null;
        while (tries++ < 6) {
          const c = wpick(g, list);
          const d = WR[WRI[c]];
          if (!d) continue;
          if (d.big && base) continue;
          if (d.big && e[0] && d.name === "ties") continue;
          nm = c;
          break;
        }
        if (!nm) {
          if (e[0]) fw.set(i, e);
          continue;
        }
        const d1 = WR[WRI[nm]], s1 = d1.big ? 1 : base ? g.chance(.5) ? 0 : 2 : g.i(3);
        e[1] = d1.id * 64 + g.i(16);
        e[3] = s1;
        if (!d1.big && g.chance(.45)) {
          const small = [ "stain", "crack", "holes", "outlet", "scraps", "peel", "hand", "switch" ].filter(n => n !== nm);
          e[2] = WRI[pick(g, small)] * 64 + g.i(16);
          e[4] = s1 === 0 ? 2 : s1 === 2 ? 0 : g.chance(.5) ? 0 : 2;
          if (base && e[4] === 1) e[4] = 2;
        }
        fw.set(i, e);
      }
      if (t === T.WALL && g.chance(.26)) {
        const out = !F.inside[i] || b.outdoor;
        const vert = wsA(x, y - 1) && wsA(x, y + 1), hor = tA(x - 1, y) === T.WALL && tA(x + 1, y) === T.WALL;
        let nm = pick(g, out ? [ "dust", "crack", "moss", "drop", "debris", "chip" ] : [ "dust", "dust", "crack", "debris", "chip", "butt" ]);
        if (vert && g.chance(.25)) nm = "cableV"; else if (hor && g.chance(.2)) nm = "cableH";
        fc.set(i, CRI[nm] * 64 + g.i(16));
      }
    }
    for (const [i, c] of [ ...fc ]) {
      const nm = CR[c >> 6] && CR[c >> 6].name;
      if (nm !== "cableV" && nm !== "cableH") continue;
      const x = i % W, y = i / W | 0;
      for (let k = 1; k < 4 + g.i(5); k++) {
        const xx = nm === "cableH" ? x + k : x, yy = nm === "cableV" ? y + k : y;
        if (tA(xx, yy) !== T.WALL) break;
        if (nm === "cableV" && !wsA(xx, yy + 1)) break;
        fc.set(yy * W + xx, c);
      }
    }
    {
      const amt = SX.decoAmt ? SX.decoAmt() : 1;
      if (amt < 1) {
        const keep = (i, k) => (SX.hash("decoWallKeep:" + k + ":" + seed + ":" + bid + ":" + F.idx + ":" + i) >>> 0) / 4294967296 < amt;
        for (const i of [ ...fw.keys() ]) if (!keep(i, "f")) fw.delete(i);
        for (const i of [ ...fc.keys() ]) if (!keep(i, "c")) fc.delete(i);
      }
    }
    F.decoW = fw;
    F.decoC = fc;
    F._dfc = new Map;
    F._dcc = new Map;
    const fl = new Uint8Array(N);
    for (const i of fw.keys()) fl[i] |= 1;
    for (const i of fc.keys()) fl[i] |= 2;
    F._dfl = fl;
  }
  const ASW = 32, ASH = 48, ACOL = 32, AROW = 64, ACAP = ACOL * AROW;
  const AT = {
    c: null,
    x: null,
    n: 0,
    key: new Array(ACAP).fill(null),
    use: new Float64Array(ACAP),
    map: new Map,
    free: [],
    stale: []
  };
  const unstale = () => {
    for (const s of AT.stale) {
      if (AT.key[s] != null) AT.map.delete(AT.key[s]);
      AT.key[s] = null;
      AT.free.push(s);
    }
    AT.stale.length = 0;
  };
  let tick = 0, bid0 = 0;
  const baseId = b => b._drId || (b._drId = ++bid0);
  function slotOf(key, w, h, fn) {
    let s = AT.map.get(key);
    if (s != null) {
      AT.use[s] = ++tick;
      return s;
    }
    if (!AT.c) {
      AT.c = A.mk(ACOL * ASW, AROW * ASH);
      AT.x = AT.c.getContext("2d");
    }
    if (AT.n < ACAP) s = AT.n++; else {
      if (!AT.free.length) {
        const ord = [];
        for (let k = 0; k < ACAP; k++) ord.push(k);
        ord.sort((a, b2) => AT.use[a] - AT.use[b2]);
        for (const k of ord.slice(0, ACAP >> 2)) {
          if (AT.key[k] != null) AT.map.delete(AT.key[k]);
          AT.key[k] = null;
          AT.free.push(k);
        }
      }
      s = AT.free.pop();
    }
    const x = AT.x, sx = s % ACOL * ASW, sy = (s / ACOL | 0) * ASH;
    x.save();
    x.clearRect(sx, sy, ASW, ASH);
    x.beginPath();
    x.rect(sx, sy, w, h);
    x.clip();
    x.translate(sx, sy);
    fn(new A.Pen(x));
    x.restore();
    AT.use[s] = ++tick;
    AT.key[s] = key;
    AT.map.set(key, s);
    if (A.textStale) AT.stale.push(s);
    return s;
  }
  DR.composites = () => AT.map.size;
  const YOFF = DR.YOFF = {
    clock: 3,
    extSign: 6,
    alarm: 8,
    vent: 1,
    stain: 0,
    crack: 0,
    holes: 10,
    scorch: 12,
    peel: 12,
    hand: 12,
    tally: 12,
    cctv: 0,
    intercom: 12,
    cable: 0,
    hooks: 7,
    scraps: 12,
    plate: 8,
    exit: 0,
    sanit: 14,
    o2: 12,
    nurse: 12,
    speaker: 0,
    station: 2,
    ward: 2,
    shop: 0,
    slogan: 2,
    address: 4,
    screen: 2,
    height: 16,
    phone: 12,
    meter: 10,
    hazard: 8,
    graff: 12,
    contId: 4,
    km: 10,
    outlet: 24,
    switch: 12
  };
  const blit = (ctx, s, w, h, px, py) => ctx.drawImage(AT.c, s % ACOL * ASW, (s / ACOL | 0) * ASH, w, h, px, py, w, h);
  DR.drawFront = function(ctx, F, tx, ty, base, px, py) {
    if (!F.decoR.done) ensure(F);
    if (AT.stale.length && !A.textStale) unstale();
    const i = ty * F.W + tx;
    if (!F._dfl || !(F._dfl[i] & 1)) {
      ctx.drawImage(base, px, py);
      return;
    }
    const hit = F._dfc.get(i);
    if (hit && hit.b === base && AT.key[hit.s] === hit.k) {
      AT.use[hit.s] = ++tick;
      blit(ctx, hit.s, base.width, base.height, px, py);
      return;
    }
    const e = F.decoW.get(i), ends = (F.tile(tx - 1, ty) === T.WALL ? 0 : 1) | (F.tile(tx + 1, ty) === T.WALL ? 0 : 2), key = "f" + baseId(base) + ":" + ends + ":" + e.join(",");
    const s = slotOf(key, base.width, base.height, P => {
      P.x.drawImage(base, 0, 0);
      if (base.height < A.WALL_H) {
        const d = WR[e[1] >> 6];
        if (d && d.para) d.draw(P, new SX.Rng(e[1] * 2654435761 >>> 0), e[1] & 63, 1);
        return;
      }
      const dh = Math.max(0, base.height - A.WALL_H), G = A.winGeo(base.height);
      if (e[0] && BANDS[e[0]]) BANDS[e[0]].fn(P, new SX.Rng(e[0] * 131 + 7), ends, dh);
      for (const [ci, si] of [ [ 1, 3 ], [ 2, 4 ] ]) {
        const code = e[ci];
        if (!code) continue;
        const d = WR[code >> 6];
        if (!d) continue;
        const rg = new SX.Rng(code * 2654435761 >>> 0), sv = e[si] == null ? 1 : e[si];
        if (!dh || d.tall) {
          d.draw(P, rg, code & 63, sv, G, dh);
          continue;
        }
        const off = Math.round((YOFF[d.name] != null ? YOFF[d.name] : 8) * dh / 24);
        P.x.save();
        P.x.translate(0, off);
        d.draw(P, rg, code & 63, sv, G, dh);
        P.x.restore();
      }
    });
    F._dfc.set(i, {
      b: base,
      s,
      k: key
    });
    blit(ctx, s, base.width, base.height, px, py);
  };
  DR.drawCap = function(ctx, F, tx, ty, base, px, py) {
    if (!F.decoR.done) ensure(F);
    if (AT.stale.length && !A.textStale) unstale();
    const i = ty * F.W + tx;
    if (!F._dfl || !(F._dfl[i] & 2)) {
      ctx.drawImage(base, px, py);
      return;
    }
    const hit = F._dcc.get(i);
    if (hit && hit.b === base && AT.key[hit.s] === hit.k) {
      AT.use[hit.s] = ++tick;
      blit(ctx, hit.s, base.width, base.height, px, py);
      return;
    }
    const code = F.decoC.get(i), key = "c" + baseId(base) + ":" + code;
    const s = slotOf(key, base.width, base.height, P => {
      P.x.drawImage(base, 0, 0);
      const d = CR[code >> 6];
      if (d) d.fn(P, new SX.Rng(code * 40503 >>> 0), code & 63);
    });
    F._dcc.set(i, {
      b: base,
      s,
      k: key
    });
    blit(ctx, s, base.width, base.height, px, py);
  };
  DR.front = function(F, tx, ty, base) {
    const c = A.mk(base.width, base.height);
    DR.drawFront(c.getContext("2d"), F, tx, ty, base, 0, 0);
    return c;
  };
  DR.cap = function(F, tx, ty, base) {
    const c = A.mk(base.width, base.height);
    DR.drawCap(c.getContext("2d"), F, tx, ty, base, 0, 0);
    return c;
  };
  DR.count = function(F) {
    ensure(F);
    let walk = 0;
    for (let i = 0; i < F.W * F.H; i++) {
      const t = F.t[i];
      if (t === T.FLOOR || t === T.GROUND) walk++;
    }
    return {
      floor: F.decoN || 0,
      walk,
      wall: F.decoW ? F.decoW.size : 0,
      cap: F.decoC ? F.decoC.size : 0
    };
  };
})(window.SX);
