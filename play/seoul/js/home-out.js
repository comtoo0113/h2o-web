"use strict";

(function(SX) {
  const A = SX.art, TS = SX.TS, CH = 16, EXT = 44, S = CH * TS;
  const HO = SX.homeOut = {};
  HO.KIND = {
    0: "street2",
    1: "under",
    2: "roofs",
    3: "street2",
    4: "street",
    5: "street2",
    6: "high",
    7: "under",
    8: "roofs",
    9: "under"
  };
  const K = HO.K = {
    NONE: 0,
    LOT: 1,
    WALK: 2,
    ROAD: 3,
    LANE: 4,
    CROSS: 5,
    ALLEY: 6,
    ROOF: 7,
    FACE: 8,
    GREEN: 9,
    WATER: 10,
    GRASS: 11,
    BANK: 12,
    CITY: 13,
    FAR: 14,
    DEEP: 15,
    AWN: 16,
    SLAB: 17,
    CEIL: 18,
    HALL: 19,
    EARTH: 20,
    DUN: 21,
    BRIDGE: 22,
    TOWER: 23
  };
  HO.BLD = {
    0: {
      pad: [ 3, 3, 3, 5 ],
      hall: {
        x0: -6,
        x1: 7,
        d: 2,
        sty: "goshi"
      },
      ext: "#a69a84",
      uw: 5,
      ua: true
    },
    1: {
      pad: [ 3, 0, 3, 2 ],
      hall: {
        x0: -1,
        x1: 2,
        d: 2,
        sty: "steps"
      },
      top: "alley",
      bot: "alley",
      ext: "#5e5a52",
      uw: 5
    },
    3: {
      pad: [ 0, 0, 0, 2 ],
      corr: {
        d: 2
      },
      ext: "#b4ab98",
      uw: 5
    },
    4: {
      pad: [ 0, 3, 0, 0 ],
      hall: {
        x0: -1,
        x1: 2,
        d: 2,
        sty: "porch",
        ring: 1,
        open: true
      },
      ext: "#8e5e48",
      uw: 5
    },
    5: {
      pad: [ 0, 0, 0, 0 ],
      hall: {
        side: 1,
        w: 3,
        sty: "side2"
      },
      front: 3,
      ext: "#9a9488",
      uw: 5
    },
    6: {
      pad: [ 0, 0, 0, 0 ],
      hall: {
        full: 1,
        d: 3,
        sty: "lobby"
      },
      ext: "#c4beb0",
      uw: 4
    },
    7: {
      pad: [ 3, 3, 3, 5 ],
      hall: {
        x0: -10,
        x1: 11,
        d: 5,
        sty: "park"
      },
      ext: "#5a5c58",
      uw: 4
    },
    9: {
      pad: [ 3, 0, 3, 4 ],
      hall: {
        x0: -1,
        x1: 2,
        d: 3,
        sty: "exit"
      },
      ext: "#6a6c66",
      uw: 6
    }
  };
  const GROUNDK = new Set([ K.LOT, K.WALK, K.ROAD, K.LANE, K.CROSS, K.ALLEY, K.AWN ]);
  const ROOFC = [ "#4f7050", "#4f7050", "#5a7a52", "#6a6b67", "#7a5e48", "#566270", "#7c4c3c", "#878276" ];
  const WALLC = [ "#b8a88a", "#7a4a38", "#8a8a86", "#c4c0b4", "#6a5444", "#9a8f7a", "#a4664a" ];
  const AWNC = [ [ "#b83a32", "#e8e0d0" ], [ "#2f6a48", "#e0dcc8" ], [ "#2e4f8a", "#e4e0d4" ], [ "#c88a28", "#f0e8d0" ], [ "#6a3a6a", "#e8dce8" ] ];
  const LITC = [ "#f2c878", "#ffd890", "#f0b868", "#c8e4f8" ];
  const MINI = [ "#3a3c40", "#46423c", "#3c4048", "#4a3e36", "#38403a", "#504c46", "#42464c" ];
  const H32 = (x, y, s) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1103515245);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return (h ^ h >>> 16) >>> 0;
  };
  const md = (a, n) => (a % n + n) % n;
  const gidx = (O, x, y) => {
    const gx = x - O.GX, gy = y - O.GY;
    return gx < 0 || gy < 0 || gx >= O.GW || gy >= O.GH ? -1 : gy * O.GW + gx;
  };
  const kAt = (O, x, y) => {
    const i = gidx(O, x, y);
    return i < 0 ? K.NONE : O.k[i];
  };
  const lotAt = (O, x, y) => {
    const i = gidx(O, x, y);
    return i < 0 ? -1 : O.lot[i];
  };
  const bldAt = (O, x, y) => {
    const i = gidx(O, x, y);
    return i >= 0 && O.bld[i] === 1;
  };
  function fill(O, x0, y0, x1, y1, k) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = gidx(O, x, y);
      if (i < 0) continue;
      O.k[i] = k;
      O.lot[i] = -1;
      O.v[i] = 0;
    }
  }
  function addLot(O, g, x0, y0, x1, y1, o) {
    const L = {
      id: O.lots.length,
      x0,
      y0,
      x1,
      y1,
      roof: o.roof || g.pick(ROOFC),
      wall: o.wall || g.pick(WALLC),
      face: o.face | 0,
      shop: !!o.shop,
      lit: o.lit != null ? o.lit : g.r(.06, .14),
      awn: g.pick(AWNC),
      own: !!o.own,
      door: -1
    };
    if (!L.shop && x1 - x0 >= 4 && g.chance(.7)) L.door = x0 + 1 + g.i(x1 - x0 - 1);
    O.lots.push(L);
    stamp(O, L);
    return L;
  }
  function stamp(O, L) {
    for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) {
      const i = gidx(O, x, y);
      if (i < 0) continue;
      const fr = L.y1 - y;
      O.k[i] = fr < L.face ? K.FACE : L.own ? K.GREEN : K.ROOF;
      O.v[i] = fr < L.face ? fr : 0;
      O.lot[i] = L.id;
    }
  }
  function clearLots(O, x0, y0, x1, y1, k) {
    for (const L of O.lots) {
      if (L.dead || L.own || L.x1 < x0 || L.x0 > x1 || L.y1 < y0 || L.y0 > y1) continue;
      const c = [ [ L.x0, L.y0, L.x1, y0 - 1 ], [ L.x0, y1 + 1, L.x1, L.y1 ], [ L.x0, L.y0, x0 - 1, L.y1 ], [ x1 + 1, L.y0, L.x1, L.y1 ] ].filter(r => r[2] - r[0] >= 2 && r[3] - r[1] >= L.face + 2);
      fill(O, L.x0, L.y0, L.x1, L.y1, k);
      if (!c.length) {
        L.dead = true;
        if (L.door >= 0) L.door = -1;
        continue;
      }
      const r = c.sort((a, b) => (b[2] - b[0] + 1) * (b[3] - b[1] + 1) - (a[2] - a[0] + 1) * (a[3] - a[1] + 1))[0];
      L.x0 = r[0];
      L.y0 = r[1];
      L.x1 = r[2];
      L.y1 = r[3];
      if (L.door > L.x1 - 1 || L.door < L.x0 + 1) L.door = -1;
      stamp(O, L);
    }
  }
  function rowLots(O, g, xa, xb, y0, y1, o, rev) {
    const shopP = o.shop || 0;
    if (!rev) {
      for (let x = xa; x <= xb; ) {
        const x1 = Math.min(xb, x + g.ri(o.w0 || 6, o.w1 || 11) - 1);
        if (x1 - x >= 2) addLot(O, g, x, y0, x1, y1, Object.assign({}, o, {
          shop: g.chance(shopP)
        }));
        x = x1 + 1 + g.ri(o.a0 == null ? 1 : o.a0, o.a1 || 2);
      }
    } else {
      for (let x = xb; x >= xa; ) {
        const x0 = Math.max(xa, x - g.ri(o.w0 || 6, o.w1 || 11) + 1);
        if (x - x0 >= 2) addLot(O, g, x0, y0, x, y1, Object.assign({}, o, {
          shop: g.chance(shopP)
        }));
        x = x0 - 1 - g.ri(o.a0 == null ? 1 : o.a0, o.a1 || 2);
      }
    }
  }
  const CUST = {
    dish: {
      fw: 1,
      fh: 1,
      up: 12,
      d: (P, w, h) => {
        const B = h - 2;
        P.shadow(16, B - 3, 8, 2, .4);
        P.r(10, B - 4, 12, 3, "#4a4c50").r(10, B - 4, 12, 1, "#6a6c70");
        P.r(15, B - 18, 3, 14, "#5a5d62").r(15, B - 18, 1, 14, "#8a8e94");
        P.oval(14, B - 24, 10, 8, "#9a9a94");
        P.oval(14, B - 24, 9, 7, "#d4d4ce");
        P.oval(15, B - 23, 5, 4, "#bcbcb6");
        P.r(9, B - 29, 4, 2, "#eeeee8");
        P.line(14, B - 24, 25, B - 33, "#3a3c40");
        P.r(24, B - 35, 4, 4, "#2a2c30").p(25, B - 34, "#6a6c70");
      }
    },
    solar: {
      fw: 2,
      fh: 1,
      up: 10,
      d: (P, w, h) => {
        const B = h - 2;
        P.shadow(32, B - 3, 27, 3, .4);
        P.r(8, B - 10, 2, 9, "#4a4c50").r(54, B - 10, 2, 9, "#4a4c50").r(30, B - 12, 2, 11, "#4a4c50");
        P.r(3, B - 30, 58, 21, "#8a8e94");
        P.r(4, B - 29, 56, 19, "#1c2a44");
        for (let x = 4; x < 60; x += 9) P.r(x, B - 29, 1, 19, "#3a4e70");
        for (let y = B - 29; y < B - 10; y += 6) P.r(4, y, 56, 1, "#3a4e70");
        P.r(4, B - 29, 56, 1, "#7a96c0");
        P.r(8, B - 27, 6, 1, "#5a76a0").r(30, B - 21, 8, 1, "#4a6690");
        P.r(3, B - 10, 58, 2, "#5a5e64");
      }
    },
    line: {
      fw: 3,
      fh: 1,
      up: 24,
      d: (P, w, h, up, g) => {
        const B = h - 2;
        P.r(10, B - 4, 78, 2, "rgba(0,0,0,0.22)");
        for (const x of [ 5, 89 ]) {
          P.r(x, B - 38, 3, 37, "#5a5c60").r(x, B - 38, 1, 37, "#8a8c90").r(x - 2, B - 2, 7, 2, "#3a3c40");
        }
        P.r(7, B - 35, 83, 1, "#a8a8a2");
        const C = [ "#c84a3a", "#e8e4d8", "#4a6a9a", "#d8b040", "#6a8a5a", "#e0a0b0", "#5a5a60" ];
        for (let x = 11; x < 82; ) {
          const ww = 7 + g.i(8), hh = 9 + g.i(10), c = g.pick(C);
          P.r(x, B - 34, ww, hh, c).r(x, B - 34, ww, 1, A.shade(c, .25)).r(x + ww - 1, B - 34, 1, hh, A.shade(c, -.3)).r(x, B - 34 + hh - 1, ww, 1, A.shade(c, -.3));
          P.p(x + 1, B - 36, "#d8c070").p(x + ww - 2, B - 36, "#d8c070");
          x += ww + 2 + g.i(5);
        }
      }
    },
    stair: {
      fw: 2,
      fh: 2,
      up: 30,
      glow: [ [ 29, 48, 6, 2, "#ffe0a0" ] ],
      d: (P, w, h) => {
        const B = h - 2;
        P.r(2, B - 4, 62, 4, "rgba(0,0,0,0.3)");
        P.r(2, 6, 60, 40, "#7c7a74");
        P.noise(2, 6, 60, 40, [ "#6e6c66", "#8a8880" ], .12, new SX.Rng(5));
        P.r(2, 6, 60, 2, "#a09e96").r(2, 44, 60, 2, "#5a5852");
        P.r(2, 46, 60, B - 46, "#a8a294");
        P.r(2, 46, 60, 2, "#c4beb0");
        P.r(2, B - 2, 60, 2, "#6a665c");
        P.r(20, 56, 22, B - 56, "#3e4448").r(21, 57, 20, B - 58, "#52585e").r(21, 57, 20, 1, "#6a7076").p(37, 74, "#c8b060").r(20, 56, 22, 1, "#2a2e32");
        P.r(28, 48, 8, 3, "#3a3c40").r(29, 48, 6, 2, "#c8b070");
      }
    },
    vent: {
      fw: 1,
      fh: 1,
      up: 12,
      d: (P, w, h) => {
        const B = h - 2;
        P.shadow(16, B - 3, 7, 2, .4);
        P.r(11, B - 26, 10, 24, "#7a7e84").r(11, B - 26, 2, 24, "#a8acb2").r(19, B - 26, 2, 24, "#5a5e64");
        P.r(8, B - 31, 16, 6, "#5a5e64").r(8, B - 31, 16, 1, "#8a8e94").r(9, B - 25, 14, 1, "#2a2c30");
        P.r(11, B - 14, 10, 1, "#5a5e64");
      }
    },
    garden: {
      fw: 2,
      fh: 1,
      up: 8,
      d: (P, w, h, up, g) => {
        const B = h - 2;
        for (const x0 of [ 3, 34 ]) {
          P.r(x0, B - 18, 27, 17, "#d8d8d2").r(x0, B - 18, 27, 2, "#f0f0ea").r(x0, B - 3, 27, 2, "#a8a8a2");
          P.r(x0 + 2, B - 16, 23, 5, "#4a3a2a");
          for (let k = 0; k < 9; k++) {
            const x = x0 + 3 + g.i(21), y = B - 22 + g.i(8), c = g.pick([ "#4a7a3a", "#5a8a42", "#3a6a32", "#7a9a4a" ]);
            P.r(x, y, 2, 3, c).p(x, y + 3, "#2a4a22");
          }
        }
      }
    },
    doormat: {
      fw: 2,
      fh: 1,
      up: 0,
      d: (P, w, h, up, g, v) => {
        const C = [ [ "#8a6a3c", "#a8844c", "#5e4626" ], [ "#4a4c50", "#646669", "#2e3034" ], [ "#7a2a2c", "#9a3c3a", "#4a1618" ], [ "#3e5a3a", "#587a50", "#24361f" ] ][v & 3], x0 = 14, y0 = 8, ww = 36, hh = 15;
        P.r(x0 + 1, y0 + 2, ww, hh, "rgba(0,0,0,0.25)");
        P.r(x0, y0, ww, hh, C[2]).r(x0 + 1, y0 + 1, ww - 2, hh - 2, C[0]).noise(x0 + 2, y0 + 2, ww - 4, hh - 4, [ C[1], C[2] ], .22, g);
        P.r(x0 + 3, y0 + 3, ww - 6, 1, C[1]).r(x0 + 3, y0 + hh - 4, ww - 6, 1, C[2]);
        if (!(v & 1)) for (let k = 0; k < 6; k++) P.r(x0 + 6 + k * 4, y0 + 6, 2, 3, C[1]);
      }
    },
    pillar: {
      fw: 1,
      fh: 1,
      up: 32,
      d: (P, w, h) => {
        const x = 9, ww = 14, f = 14, b = 54;
        P.shadow(16, b + 3, 10, 3, .45);
        P.r(x, 0, ww, f, "#3a3c40").r(x, 0, ww, 1, "#5a5c60").r(x, f - 1, ww, 1, "#2a2c30");
        P.r(x, f, ww, b - f, "#9a9a94").r(x, f, 2, b - f, "#bcbcb4").r(x + ww - 2, f, 2, b - f, "#6e6e68");
        for (let y = b - 13; y < b - 1; y++) for (let xx = 0; xx < ww; xx++) P.p(x + xx, y, md(xx + y, 8) < 4 ? "#d8b020" : "#1e1e20");
        P.r(x, b - 14, ww, 1, "#4a4a46").r(x, b - 1, ww, 1, "#2a2a2c");
        P.r(x + 3, f + 7, ww - 6, 7, "#e4e0d4").r(x + 4, f + 8, ww - 8, 5, "#2f5a9a").r(x + 5, f + 9, 1, 3, "#e8eef8").r(x + 7, f + 9, 2, 3, "#e8eef8");
        for (let k = 0; k < 4; k++) P.p(x + 2 + k * 5 % 10, f + 18 + k * 4, "#7a7a74");
      }
    },
    gate: {
      fw: 1,
      fh: 2,
      up: 0,
      d: (P, w, h, up, g) => {
        for (const y of [ 3, 25, 47 ]) {
          const on = g.chance(.25);
          P.r(3, y + 16, 28, 3, "rgba(0,0,0,0.3)");
          P.r(2, y, 28, 8, "#9ea2a6").r(2, y, 28, 1, "#c8ccd0").r(2, y + 7, 28, 1, "#7a7e82");
          P.r(2, y + 8, 28, 8, "#5e6266").r(2, y + 8, 2, 8, "#7a7e82").r(28, y + 8, 2, 8, "#3e4246").r(2, y + 15, 28, 1, "#2a2c30");
          P.r(5, y + 2, 7, 4, "#2a2c30").r(6, y + 3, 5, 2, "#4a5a6a");
          P.r(21, y + 2, 6, 4, "#1a1c1e").r(22, y + 3, 4, 2, on ? "#5fd06a" : "#3a2a2a");
          P.r(13, y + 9, 6, 4, "#c8602a").r(13, y + 9, 6, 1, "#e8905a").r(4, y + 11, 5, 1, "#c8b040");
        }
      }
    },
    pole: {
      fw: 1,
      fh: 1,
      up: 104,
      glow: [ [ 21, 20, 8, 3, "#fff4c8" ], [ 17, 18, 16, 8, "rgba(255,220,150,0.18)" ] ],
      d: (P, w, h, up, g, v) => {
        const B = h - 2;
        P.shadow(16, B - 2, 6, 2, .45);
        P.r(13, 6, 6, B - 6, "#8a8882").r(13, 6, 2, B - 6, "#aaa8a0").r(18, 6, 1, B - 6, "#5e5c56");
        for (let y = 12; y < B - 8; y += 9) P.r(13, y, 6, 1, "#7a7872");
        P.r(3, 10, 26, 3, "#6a6862").r(3, 10, 26, 1, "#8a8882");
        for (const x of [ 4, 10, 21, 27 ]) P.r(x, 7, 2, 3, "#d8d4c8");
        P.r(19, 18, 6, 2, "#5a5c60").r(20, 19, 10, 3, "#3a3c40").r(21, 20, 8, 1, "#c8b070");
        if (v & 1) {
          P.r(4, 26, 9, 16, "#8a9094").r(4, 26, 2, 16, "#aab0b4").r(4, 26, 9, 2, "#6a7074").r(6, 30, 5, 1, "#5a6064");
        }
        P.r(12, B - 50, 8, 10, "#e8e4d4").r(13, B - 48, 6, 1, "#c03a2a").r(13, B - 46, 5, 1, "#6a6458").r(13, B - 44, 6, 1, "#6a6458");
        if (v & 2) P.r(13, B - 36, 6, 7, "#f0d040").r(14, B - 34, 4, 1, "#3a3c40");
        for (let y = B - 14; y < B - 2; y++) P.r(13, y, 6, 1, md(y, 6) < 3 ? "#d8b020" : "#1e1e20");
      }
    },
    bicycle: {
      fw: 2,
      fh: 1,
      up: 4,
      nv: 10,
      noOut: true,
      d: (P, w, h, up, g, v) => bike(P, w, h, g, v)
    },
    trashPile: {
      fw: 2,
      fh: 1,
      up: 10,
      d: (P, w, h, up, g) => {
        const B = h - 2;
        P.r(4, B - 4, 56, 4, "rgba(0,0,0,0.3)");
        const C = [ [ "#e8e4d8", "#b8b4a8" ], [ "#dcecf4", "#a8bcc8" ], [ "#2a2c30", "#1a1c1e" ], [ "#e8e0b8", "#b8ae88" ], [ "#f0f0ea", "#c4c4bc" ] ];
        for (let k = 0; k < 9; k++) {
          const c = g.pick(C), x = 8 + g.i(46), y = B - 8 - g.i(14) * (k > 5 ? 1 : .4), r = 6 + g.i(4);
          P.oval(x, y, r, r - 2, c[1]);
          P.oval(x - 1, y - 1, r - 1, r - 3, c[0]);
          P.r(x - 1, y - r + 1, 3, 2, c[1]);
          if (c[0] !== "#2a2c30" && g.chance(.6)) P.r(x - 3, y, 5, 1, g.pick([ "#3a70c0", "#3a9a5a", "#d8a030" ]));
        }
        P.r(40 + g.i(10), B - 12, 9, 7, "#a8844c").r(40, B - 12, 9, 1, "#c8a46c");
        P.r(10 + g.i(8), B - 6, 6, 3, "#c8c4b8");
      }
    },
    tubGarden: {
      fw: 1,
      fh: 1,
      up: 10,
      d: (P, w, h, up, g, v) => {
        const B = h - 2, c = v & 1 ? "#2a2c2e" : "#b8382e";
        P.oval(16, B - 3, 13, 3, "rgba(0,0,0,0.3)");
        P.oval(16, B - 12, 13, 5, A.shade(c, -.35));
        P.r(4, B - 12, 25, 9, c).r(4, B - 12, 25, 1, A.shade(c, .3)).r(6, B - 4, 21, 2, A.shade(c, -.3));
        P.oval(16, B - 13, 11, 3, "#4a3a2a");
        for (let k = 0; k < 8; k++) {
          const x = 7 + g.i(18), y = B - 22 + g.i(9), gc = g.pick([ "#4a7a3a", "#5a8a42", "#3a6a32", "#7a9a4a" ]);
          P.r(x, y, 2, 4, gc).p(x + 1, y - 1, gc);
          if (k < 2 && v & 2) P.p(x, y + 2, "#c83a2a");
        }
      }
    },
    wreck: {
      fw: 4,
      fh: 3,
      up: 0,
      noOut: true,
      d: (P, w, h, up, g, v) => crash(P, w, h, g, v, 0, true)
    },
    burnt: {
      fw: 4,
      fh: 3,
      up: 0,
      noOut: true,
      d: (P, w, h, up, g, v) => crash(P, w, h, g, v, 1, true)
    },
    wreckP: {
      fw: 3,
      fh: 2,
      up: 8,
      ex: 8,
      noOut: true,
      d: (P, w, h, up, g, v) => crash(P, w, h, g, v, 0, false)
    },
    burntP: {
      fw: 3,
      fh: 2,
      up: 8,
      noOut: true,
      d: (P, w, h, up, g, v) => crash(P, w, h, g, v, 1, false)
    },
    aband: {
      fw: 3,
      fh: 2,
      up: 8,
      ex: 8,
      noOut: true,
      d: (P, w, h, up, g, v) => crash(P, w, h, g, v, 2, false)
    },
    skid: {
      fw: 3,
      fh: 1,
      up: 0,
      noOut: true,
      d: (P, w, h, up, g, v) => {
        const bend = [ -6, 5, -3, 8 ][v];
        for (const y0 of [ 6, 24 ]) for (let x = 2; x < 94; x++) {
          if (g.chance(.12)) continue;
          const t = x / 94;
          P.r(x, y0 + Math.round(bend * t * t), 1, 2, "rgba(16,16,18," + (.14 + t * .32).toFixed(2) + ")");
        }
      }
    },
    debris: {
      fw: 2,
      fh: 1,
      up: 0,
      noOut: true,
      d: (P, w, h, up, g, v) => {
        P.oval(30 + g.i(8), 18, 10 + g.i(6), 3, "rgba(14,12,16,0.35)");
        for (let i = 0; i < 34; i++) P.p(3 + g.i(58), 5 + g.i(22), g.pick([ "#a8c0c8", "#c8dce4", "#6a8a9a", "#a8c0c8" ]));
        for (let i = 0; i < 5; i++) P.r(5 + g.i(52), 7 + g.i(18), 2, 1, g.pick([ "#b02a24", "#e0902a", "#c03a30", "#e8e0c0" ]));
        const x = 8 + g.i(34), y = 10 + g.i(10);
        P.r(x, y, 13, 3, "#2a2c30").r(x, y, 13, 1, "#4a4d54").r(x + 13, y + 1, 3, 2, "#1e2024");
        if (v & 1) {
          const c = CARC[v], q = 30 + g.i(16), r = 6 + g.i(12);
          P.r(q, r, 8, 5, A.shade(c, -.2)).r(q, r, 8, 1, A.shade(c, .2)).r(q, r + 4, 8, 1, A.shade(c, -.5));
        }
      }
    },
    sos: {
      fw: 3,
      fh: 1,
      up: 0,
      noOut: true,
      d: (P, w, h, up, g, v) => {
        const st = v & 1 ? 3 : 4, lw = 24, lh = 22, x0 = 4, y0 = 5, m = lh - st >> 1, M = new Uint8Array(w * h), holes = [];
        const R = (x, y, ww, hh) => {
          for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) M[yy * w + xx] = 1;
        };
        for (let i = 0; i < 3; i++) {
          const x = x0 + i * 32;
          R(x, y0, lw, st);
          R(x, y0 + lh - st, lw, st);
          if (i === 1) {
            R(x, y0, st, lh);
            R(x + lw - st, y0, st, lh);
          } else {
            R(x, y0 + m, lw, st);
            R(x, y0, st, m + st);
            R(x + lw - st, y0 + m, st, lh - m);
          }
        }
        for (let k = 0, n = 3 + g.i(3); k < n; k++) holes.push([ x0 + g.i(88), y0 + g.i(lh), 3 + g.i(5) ]);
        const C = [ "rgba(226,222,208,0.72)", "rgba(206,202,188,0.66)", "rgba(236,232,220,0.78)" ];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!M[y * w + x]) continue;
          if (holes.some(([a, b, r]) => (x - a) * (x - a) + (y - b) * (y - b) < r * r) ? g.chance(.8) : g.chance(.16)) continue;
          P.p(x, y, g.pick(C));
        }
        if (v & 1) for (let k = 0; k < 5; k++) {
          const x = x0 + g.i(88);
          if (M[(y0 + lh - 1) * w + x]) P.r(x, y0 + lh, 1, 1 + g.i(3), C[1]);
        }
      }
    }
  };
  const CARC = [ "#b8b6ae", "#9a3a32", "#34466a", "#d8903a", "#6b6f73", "#3a4a3a" ], BLD = [ "#4a1612", "#5e1c16", "#3a100e", "#6a1216" ];
  for (const k in A.VGEO || {}) {
    const G = A.VGEO[k];
    [ "Wk", "Bt", "Ab" ].forEach((s, m) => {
      CUST[k + s] = {
        fw: G.fw,
        fh: G.fh,
        up: G.up,
        ex: m === 1 ? 0 : 8,
        noOut: true,
        d: (P, w, h, up, g, v) => G.sedan ? crash(P, w, h, g, v, m, false, k) : crashG(P, w, h, g, v, m, k)
      };
    });
  }
  const DOOR = {
    f: {
      hx: 67,
      top: u => u <= 12 ? -23 - u : -35,
      bot: () => -7
    },
    r: {
      hx: 44,
      top: u => u <= 9 ? -35 : u <= 21 ? -35 + Math.round((u - 9) * 13 / 12) : -22,
      bot: u => u > 14 ? -14 : -7
    }
  };
  function doorHole(T, o, B, f) {
    const c0 = "#131518", c1 = "#1e2024", st = "#3a2e2a", stL = "#56463a";
    if (f) {
      T.poly([ [ o + 47, B - 22 ], [ o + 47, B - 35 ], [ o + 56, B - 35 ], [ o + 68, B - 22 ] ], c0).r(o + 45, B - 22, 22, 13, c0).r(o + 45, B - 11, 22, 2, c1);
      T.r(o + 48, B - 33, 6, 21, st).r(o + 48, B - 33, 1, 21, stL).r(o + 49, B - 36, 4, 3, st).r(o + 49, B - 36, 4, 1, stL);
      T.r(o + 48, B - 16, 14, 4, st).r(o + 48, B - 16, 14, 1, stL);
      T.r(o + 62, B - 25, 5, 9, "#22242a").r(o + 62, B - 25, 5, 1, "#3a3c42");
      T.ring(o + 60, B - 23, 3, 4, "#2c2c30");
    } else {
      T.poly([ [ o + 23, B - 22 ], [ o + 34, B - 35 ], [ o + 44, B - 35 ], [ o + 44, B - 22 ] ], c0).r(o + 23, B - 22, 21, 9, c0).r(o + 31, B - 13, 13, 2, c0).r(o + 31, B - 11, 13, 1, c1);
      T.r(o + 26, B - 31, 16, 18, st).r(o + 26, B - 31, 16, 1, stL);
      for (const x of [ 28, 37 ]) T.r(o + x, B - 34, 4, 3, st).r(o + x, B - 34, 4, 1, stL);
      T.r(o + 25, B - 16, 18, 4, st).r(o + 25, B - 16, 18, 1, stL).r(o + 33, B - 22, 2, 7, "#2a2420");
    }
  }
  function doorLeaf(T, o, B, R, f, broken) {
    const D = DOOR[f ? "f" : "r"], hx = o + D.hx, tr = "#4a4844", trL = "#66625a", trD = "#2c2a28";
    for (let s = 0; s <= 11; s++) {
      const u = Math.min(23, s * 2), du = Math.round(u * .52), x = hx + s, top = B + D.top(u) + du, belt = B - 21 + du, bot = B + D.bot(u) + du, ed = s === 0 || s === 11;
      if (top < belt) {
        T.p(x, top, R[0]);
        if (belt - top > 1) {
          if (ed) T.r(x, top + 1, 1, belt - top - 1, R[1]); else if (!broken) T.r(x, top + 1, 1, belt - top - 1, "rgba(120,160,180,0.5)"); else if (s & 1) T.p(x, belt - 1, "#a8c0c8");
        }
      }
      T.p(x, belt, R[2]);
      if (bot - belt > 1) T.r(x, belt + 1, 1, bot - belt - 1, ed ? R[1] : tr);
      T.p(x, bot, R[0]);
      if (!ed) {
        T.p(x, belt + 4, trL).p(x, belt + 5, trD);
        if (s >= 3 && s <= 8 && s & 1) T.p(x, bot - 4, "#1c1c1e");
        if (s === 2 || s === 3) T.p(x, belt + 2, "#a8acb0");
      }
    }
    if (!broken) T.line(hx + 3, B + D.top(6) + 4, hx + 6, B - 24 + 3, "rgba(220,236,244,0.6)");
  }
  function dust(T, c, g, amt) {
    const X = T.x, im = X.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200 || !g.chance(amt)) continue;
      d[i] = d[i] * 3 + 138 >> 2;
      d[i + 1] = d[i + 1] * 3 + 130 >> 2;
      d[i + 2] = d[i + 2] * 3 + 116 >> 2;
    }
    X.putImageData(im, 0, 0);
  }
  function crash(P, w, h, g, v, mode, tilt, kind) {
    const burnt = mode === 1, k = burnt ? [ 0, 2, 4, 1 ][v] : mode === 2 ? [ 0, 4, 3, 5 ][v] : [ 1, 0, 2, 4 ][v], G = kind && A.VGEO[kind], kk = G ? v % G.col.length : k, car = A.prop(kind || "car", kk, null, 0).c, R = A.ramp(G ? G.col[kk] : CARC[k]), ox = 4;
    const tc = document.createElement("canvas");
    tc.width = car.width + 8;
    tc.height = car.height + 10;
    const T = new P.constructor(tc.getContext("2d", {
      willReadFrequently: true
    })), B = car.height - 2, tY = B - 54, hb = tilt ? h : car.height;
    T.x.drawImage(car, ox, 0);
    if (mode === 0) {
      T.poly([ [ ox + 84, B - 22 ], [ ox + 95, B - 19 ], [ ox + 92, B - 14 ], [ ox + 95, B - 9 ], [ ox + 86, B - 5 ], [ ox + 82, B - 13 ] ], R[1]);
      for (const y of [ B - 20, B - 15, B - 10 ]) T.line(ox + 83, y, ox + 93, y + 2, R[0]).line(ox + 83, y + 1, ox + 92, y + 3, R[3]);
      T.r(ox + 88, B - 20, 5, 4, "#1e2024").p(ox + 89, B - 19, "#a8c0c8");
      for (let x = 76; x < 92; x += 3) T.line(ox + x, tY + 4, ox + x + 2, tY + 30, R[1]);
      T.poly([ [ ox + 58, B - 50 ], [ ox + 64, B - 47 ], [ ox + 63, B - 40 ], [ ox + 59, B - 42 ] ], "#0e1014");
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.283;
        T.line(ox + 61, B - 45, ox + 61 + Math.cos(a) * 9, B - 45 + Math.sin(a) * 9, "#c8dce4");
      }
      for (let i = 0; i < 10; i++) T.p(ox + 25 + g.i(19), B - 32 + g.i(9), g.chance(.5) ? "#0e1014" : "#a8c0c8");
      T.oval(ox + 21, B - 3, 8, 3, "#121316").r(ox + 13, B - 1, 16, 1, "#2a2c30");
      doorHole(T, ox, B, true);
      doorLeaf(T, ox, B, R, true, (v & 1) === 0);
      T.r(ox + 71, B - 6, 3, 2, BLD[1]).p(ox + 72, B - 4, BLD[2]).p(ox + 74, B - 7, BLD[0]);
    } else if (mode === 2) {
      dust(T, tc, g, .16);
      if (v === 2) {
        for (const cx of [ 21, 75 ]) T.oval(ox + cx, B - 3, 8, 3, "#121316").r(ox + cx - 8, B - 1, 16, 1, "#2a2c30");
        for (let i = 0; i < 16; i++) T.p(ox + 25 + g.i(40), B - 33 + g.i(10), g.chance(.5) ? "#0e1014" : "#a8c0c8");
        T.r(ox + 49, B - 31, 6, 7, "#e8e0c8").r(ox + 50, B - 29, 4, 1, "#c03a2a").r(ox + 50, B - 27, 3, 1, "#6a6458");
      } else {
        const fr = v <= 1, rr = v !== 0;
        if (rr) doorHole(T, ox, B, false);
        if (fr) doorHole(T, ox, B, true);
        if (rr) doorLeaf(T, ox, B, R, false, v === 3);
        if (fr) doorLeaf(T, ox, B, R, true, false);
      }
    } else {
      burnPx(T.x, tc.width, tc.height, v * 37 + 5);
      for (let i = 0; i < 26; i++) T.r(ox + 6 + g.i(84), tY + 2 + g.i(48), 1 + g.i(3), 1 + g.i(2), g.pick([ "#a0522a", "#7a3a1c", "#5a5550", "#1a1614" ]));
      T.poly([ [ ox + 25, B - 23 ], [ ox + 35, B - 34 ], [ ox + 55, B - 34 ], [ ox + 66, B - 23 ] ], "#080606");
      T.r(ox + 44, B - 34, 3, 11, "#2a2420");
      T.oval(ox + 21, B - 4, 7, 3, "#0e0c0b").oval(ox + 75, B - 4, 7, 3, "#0e0c0b");
    }
    const X = P.x;
    X.imageSmoothingEnabled = false;
    if (burnt) {
      P.oval(w / 2, hb - 20, 46, 14, "rgba(12,9,7,0.5)").oval(w / 2 + 6, hb - 18, 30, 9, "rgba(12,9,7,0.35)");
      for (let i = 0; i < 14; i++) P.r(w / 2 - 44 + g.i(88), hb - 30 + g.i(20), 2, 1, g.pick([ "#3a3632", "#5a544c", "#1a1614" ]));
    } else if (mode === 0) {
      P.oval(w / 2 - 10, hb - 14, 12, 4, "rgba(14,12,16,0.5)");
      for (let i = 0; i < 16; i++) P.p(w / 2 - 30 + g.i(70), hb - 26 + g.i(22), g.pick([ "#a8c0c8", "#c8dce4", "#6a8a9a" ]));
    } else P.oval(w / 2 + 14, hb - 12, 8, 3, "rgba(14,12,16,0.3)");
    X.save();
    if (tilt && A.rotDot) {
      const q = A.rotDot(tc, [ -.1, .07, -.05, .1 ][v], v & 1 ? 2 : 0, tc.width >> 1, Math.round((car.height - 8) / 2 + 8), true);
      X.drawImage(q.c, (w >> 1) + q.ox, (h >> 1) + q.oy);
    } else if (tilt) {
      X.translate(w / 2, h / 2);
      X.rotate([ -.1, .07, -.05, .1 ][v]);
      if (v & 1) X.scale(-1, 1);
      X.drawImage(tc, -tc.width / 2, -(car.height - 8) / 2 - 8);
    } else X.drawImage(tc, -ox, 0);
    X.restore();
  }
  function burnPx(X, W, H, seed) {
    const im = X.getImageData(0, 0, W, H), d = im.data, q = new SX.Rng(seed);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      const r = d[i], gg = d[i + 1], b = d[i + 2], l = (r * 3 + gg * 6 + b) / 10, z = q.f();
      const c = b > r + 14 && b >= gg ? l > 120 ? "#2a2420" : "#0c0a09" : l < 45 ? "#141110" : l < 90 ? z < .25 ? "#5a2e1a" : "#2a2420" : l < 150 ? z < .3 ? "#8a4a22" : z < .6 ? "#4a3a30" : "#3a322c" : z < .5 ? "#6a625a" : "#8a5030";
      const n = parseInt(c.slice(1), 16);
      d[i] = n >> 16;
      d[i + 1] = n >> 8 & 255;
      d[i + 2] = n & 255;
    }
    X.putImageData(im, 0, 0);
  }
  function crashG(P, w, h, g, v, mode, kind) {
    const G = A.VGEO[kind], ks = G.ks || G.col.map((c, i) => i), k = ks[(v + mode * 2) % ks.length], src = A.prop(kind, k, null, 0).c, R = A.ramp(G.col[k]), ox = 4, B = src.height - 2, hb = src.height;
    const tc = A.mk(src.width + 8, src.height + 14), T = new P.constructor(tc.getContext("2d", {
      willReadFrequently: true
    })), X = T.x, ST = "#3a2e2a", STL = "#56463a";
    const at = f => {
      X.save();
      X.globalCompositeOperation = "source-atop";
      f();
      X.restore();
    };
    const flat = cx => T.oval(ox + cx, B - 3, G.t + 1, 3, "#121316").r(ox + cx - G.t - 1, B - 1, 2 * G.t + 3, 1, "#2a2c30");
    const glass = n => at(() => {
      const q = G.sw;
      for (let i = 0; i < n; i++) T.p(ox + q[0] + g.i(q[2]), q[1] + g.i(q[3]), g.chance(.5) ? "#0e1014" : "#a8c0c8");
    });
    X.drawImage(src, ox, 0);
    const hole = d => {
      const x0 = ox + d.x0, wd = d.x1 - d.x0 + 1, ht = d.bot - d.top;
      if (d.fold) {
        T.r(x0, d.top, wd, ht, "#131518").r(x0 + 2, d.bot - 7, wd - 4, 2, "#4a4d54").r(x0 + 2, d.bot - 4, wd - 4, 4, "#2a2c30").r(x0 + (wd >> 1), d.top + 2, 1, ht - 9, "#8a9098");
        for (const xx of [ x0, x0 + wd - 3 ]) T.r(xx, d.top, 3, ht, "#1a1e22").r(xx + 1, d.top + 1, 1, ht - 2, "#4e7082");
        return;
      }
      if (d.slide) {
        const sh = Math.round(wd * .45), im = X.getImageData(x0, d.top, wd, ht);
        T.r(x0, d.top, wd, ht, "#131518").r(x0, d.bot - 2, wd, 2, "#1e2024");
        for (const x of [ x0 + 14, x0 + 22 ]) T.r(x, d.top + 6, 5, ht - 12, ST).r(x, d.top + 6, 5, 1, STL);
        T.r(x0 + 12, d.bot - 9, 16, 4, ST).r(x0 + 12, d.bot - 9, 16, 1, STL);
        X.putImageData(im, x0 - sh, d.top + 1);
        T.r(x0 - sh, d.bot + 1, wd, 1, "rgba(10,12,16,0.45)");
        return;
      }
      const Hp = d.hole.map(q => [ q[0] + ox, q[1] ]), x1 = ox + d.x1, front = d === G.doors[0];
      T.poly(Hp, "#131518");
      X.save();
      X.beginPath();
      Hp.forEach((q, i) => i ? X.lineTo(q[0], q[1]) : X.moveTo(q[0], q[1]));
      X.closePath();
      X.clip();
      if (d.cargo) {
        for (const [a, b, ww, hh, c] of [ [ 2, 4, 13, 11, "#a87c4a" ], [ 3, 16, 11, 10, "#b88a52" ], [ 9, 9, 10, 9, "#9a7044" ], [ 2, 27, 14, 9, "#c09a62" ] ]) T.r(x0 + a, d.top + b, ww, hh, c).r(x0 + a, d.top + b, ww, 1, A.shade(c, .25)).r(x0 + a + (ww >> 1), d.top + b + 1, 1, hh - 1, A.shade(c, -.25));
      } else {
        const sx = x0 + (front ? 3 : 4), sw = Math.min(16, x1 - sx - 3);
        T.r(sx, d.top + 4, 6, ht - 10, ST).r(sx, d.top + 4, 1, ht - 10, STL).r(sx + 1, d.top + 1, 4, 3, ST).r(sx + 1, d.top + 1, 4, 1, STL);
        T.r(sx, d.bot - 12, sw, 4, ST).r(sx, d.bot - 12, sw, 1, STL);
        if (front) {
          T.r(x1 - 6, d.belt - 4, 5, 9, "#22242a").r(x1 - 6, d.belt - 4, 5, 1, "#3a3c42");
          T.ring(x1 - 8, d.belt - 2, 3, 4, "#2c2c30");
        }
      }
      X.restore();
    };
    const leaf = (d, broken) => {
      if (d.fold || d.slide) return;
      const dir = d.dir || 1, hx = ox + (dir > 0 ? d.x1 : d.x0), n = Math.min(11, Math.round((d.x1 - d.x0) / 2)), gl = d.glass !== false, C = d.cargo ? R[2] : "#4a4844";
      for (let s = 0; s <= n; s++) {
        const u = s * 2, du = Math.round(u * .52), x = hx + s * dir, top = d.top + Math.max(0, (d.sl || 0) - u) + du, belt = d.belt + du, bot = d.bot + du, ed = s === 0 || s === n;
        if (gl && belt - top > 0) {
          T.p(x, top, R[0]);
          if (belt - top > 1) {
            if (ed) T.r(x, top + 1, 1, belt - top - 1, R[1]); else if (!broken) T.r(x, top + 1, 1, belt - top - 1, "rgba(120,160,180,0.5)"); else if (s & 1) T.p(x, belt - 1, "#a8c0c8");
          }
        }
        T.p(x, belt, gl ? R[2] : R[0]);
        if (bot - belt > 1) T.r(x, belt + 1, 1, bot - belt - 1, ed ? R[1] : C);
        T.p(x, bot, R[0]);
        if (!ed && !d.cargo) {
          T.p(x, belt + 4, "#66625a").p(x, belt + 5, "#2c2a28");
          if (s >= 3 && s <= 8 && s & 1) T.p(x, bot - 4, "#1c1c1e");
          if (s === 2 || s === 3) T.p(x, belt + 2, "#a8acb0");
        }
        if (!ed && d.cargo && s % 3 === 1) T.r(x, belt + 3, 1, bot - belt - 6, R[3]);
      }
    };
    const D0 = G.doors[0], D1 = G.doors[1];
    if (mode === 0) {
      const f = ox + G.x1, y0 = G.Bs + 1, y1 = B - 5, m = a => Math.round(y0 + (y1 - y0) * a);
      at(() => {
        T.poly([ [ f - 11, y0 ], [ f + 1, y0 + 3 ], [ f - 3, m(.45) ], [ f + 1, m(.72) ], [ f - 9, y1 ], [ f - 13, m(.5) ] ], R[1]);
        for (const a of [ .15, .45, .75 ]) T.line(f - 12, m(a), f - 2, m(a) + 2, R[0]).line(f - 12, m(a) + 1, f - 3, m(a) + 3, R[3]);
        T.r(f - 7, y0 + 1, 5, 4, "#1e2024").p(f - 6, y0 + 2, "#a8c0c8");
        for (let x = G.hood; x < G.x1 - 2; x += 3) T.line(ox + x, G.tY + 4, ox + x + 2, G.tY + G.D - 6, "rgba(12,12,16,0.3)");
        const cx = ox + G.ws[0], cy = G.ws[1];
        T.poly([ [ cx - 2, cy - 4 ], [ cx + 3, cy - 2 ], [ cx + 2, cy + 4 ], [ cx - 2, cy + 2 ] ], "#0e1014");
        for (let i = 0; i < 9; i++) {
          const a = i / 9 * 6.283;
          T.line(cx, cy, cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, "#c8dce4");
        }
      });
      glass(10);
      flat(G.wh[0]);
      hole(D0);
      leaf(D0, (v & 1) === 0);
      if (!D0.fold) T.r(ox + D0.x1 + 3, D0.bot - 1, 3, 2, BLD[1]).p(ox + D0.x1 + 4, D0.bot + 1, BLD[2]).p(ox + D0.x1 + 6, D0.bot - 2, BLD[0]);
    } else if (mode === 2) {
      dust(T, tc, g, .16);
      if (v === 2) {
        for (const cx of G.wh) flat(cx);
        glass(16);
        const q = G.sw;
        at(() => T.r(ox + q[0] + 2, q[1] + 1, 6, 7, "#e8e0c8").r(ox + q[0] + 3, q[1] + 3, 4, 1, "#c03a2a").r(ox + q[0] + 3, q[1] + 5, 3, 1, "#6a6458"));
      } else {
        const rr = v !== 0 && !!D1, fr = v <= 1 || !rr;
        if (rr) hole(D1);
        if (fr) hole(D0);
        if (rr) leaf(D1, v === 3);
        if (fr) leaf(D0, false);
      }
    } else {
      burnPx(X, tc.width, tc.height, v * 37 + 5 + kind.length);
      at(() => {
        for (let i = 0, n = Math.round(G.x1 / 4); i < n; i++) T.r(ox + 6 + g.i(G.x1 - 10), G.tY + 2 + g.i(B - G.tY - 6), 1 + g.i(3), 1 + g.i(2), g.pick([ "#a0522a", "#7a3a1c", "#5a5550", "#1a1614" ]));
      });
      for (const q of G.win) T.poly(q.map(p => [ p[0] + ox, p[1] ]), "#080606");
      for (const cx of G.wh) T.oval(ox + cx, B - 4, G.t, 3, "#0e0c0b");
    }
    const c = Math.round(w / 2), s = w / 96;
    if (mode === 1) {
      P.oval(c, hb - 20, Math.round(46 * s), 14, "rgba(12,9,7,0.5)").oval(c + 6, hb - 18, Math.round(30 * s), 9, "rgba(12,9,7,0.35)");
      for (let i = 0; i < 14 * s; i++) P.r(c - Math.round(44 * s) + g.i(Math.round(88 * s)), hb - 30 + g.i(20), 2, 1, g.pick([ "#3a3632", "#5a544c", "#1a1614" ]));
    } else if (mode === 0) {
      P.oval(c - 10, hb - 14, 12, 4, "rgba(14,12,16,0.5)");
      for (let i = 0; i < 16; i++) P.p(c - 30 + g.i(70), hb - 26 + g.i(22), g.pick([ "#a8c0c8", "#c8dce4", "#6a8a9a" ]));
    } else P.oval(c + 14, hb - 12, 8, 3, "rgba(14,12,16,0.3)");
    P.x.imageSmoothingEnabled = false;
    P.x.drawImage(tc, -ox, 0);
  }
  const BIKE = [ {
    t: 1,
    c: "#7aa8c8",
    bk: 1,
    rk: 1
  }, {
    t: 1,
    c: "#dcd8cc",
    bk: 2,
    rk: 1,
    lk: "#c83a2a"
  }, {
    t: 0,
    c: "#c8402e"
  }, {
    t: 0,
    c: "#d8b040",
    lk: "#3a6ab0"
  }, {
    t: 1,
    c: "#8aa890",
    bk: 1,
    rk: 1,
    ru: .35,
    fl: 1,
    dent: 1,
    tear: 1
  }, {
    t: 0,
    c: "#3a6a9a",
    ru: .2,
    fw: 0
  }, {
    t: 1,
    c: "#7a6ab0",
    bk: 1,
    rk: 1,
    lie: 1
  }, {
    t: 0,
    c: "#4a8a5a",
    ru: .12,
    fw: 2
  }, {
    t: 2,
    c: "#e090b0"
  }, {
    t: 0,
    c: "#6a6a70",
    ru: .6,
    fw: 0,
    rw: 0,
    ns: 1,
    lie: 1
  } ];
  function bike(P, w, h, g, v) {
    const o = BIKE[v % BIKE.length], kid = o.t === 2, city = o.t !== 0, lie = !!o.lie, R = kid ? 5 : 7, k = kid ? .72 : 1, B = h - 2, TY = "#202226", c = o.c;
    const th = lie ? -.1 : o.fw === 0 ? -Math.asin(R / (22 * k)) : 0, sy = lie ? o.rw === 0 ? .7 : .55 : 1, cs = Math.cos(th), sn = Math.sin(th), ox = lie ? 15 : kid ? 25 : 21, ay = lie ? B - 6 : B - R;
    const T = q => {
      const x = q[0] * k, y = q[1] * k;
      return [ ox + x * cs - y * sn, ay - (x * sn + y * cs) * sy ];
    };
    const RU = [ "#8a4f2e", "#a0522a", "#6a3a1c", "#b0623a" ], rc = cc => o.ru && g.chance(o.ru) ? g.pick(RU) : cc;
    const seg = (a, b, cc, alt) => {
      const p = T(a), q = T(b);
      let x0 = Math.round(p[0]), y0 = Math.round(p[1]), e;
      const x1 = Math.round(q[0]), y1 = Math.round(q[1]), dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sv = y0 < y1 ? 1 : -1;
      e = dx + dy;
      for (let n = 0; n < 99; n++) {
        P.p(x0, y0, alt === 0 ? cc : alt ? n & 1 ? alt : cc : rc(cc));
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) {
          e += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          e += dx;
          y0 += sv;
        }
      }
    };
    const cur = (a, m, b, cc, alt) => {
      let p = a;
      for (let i = 1; i <= 6; i++) {
        const t = i / 6, u = 1 - t, q = [ u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1] ];
        seg(p, q, cc, alt);
        p = q;
      }
    };
    const rim = o.ru > .3 ? "#8a7262" : "#a8acb2", spk = o.ru > .3 ? "#6a5a50" : "#767a80", fen = city && !kid ? o.ru > .3 ? "#7a5a44" : A.shade(c, -.25) : null;
    const wheel = (q, r, f) => {
      const cp = T(q), cx = Math.round(cp[0]), cy = Math.round(cp[1]) + (f === 1 ? 1 : 0), rx = f === 2 ? r * .8 : r, N = r > 5 ? 8 : 6, st = Math.PI * 2 / N;
      for (let y = -r - 3; y <= r + 3; y++) for (let x = -r - 3; x <= r + 3; x++) {
        if (cy + y > B) continue;
        const ex = x * r / rx, ey = y / sy, rr = Math.hypot(ex, ey), a = Math.atan2(ey, ex), gl = rr ? Math.hypot(ex * r / rx, ey / sy) / rr : 1;
        const da = f === 2 ? Math.atan2(Math.sin(a + .8), Math.cos(a + .8)) : 9, dd = (rr - r * (1 - .42 * Math.exp(-da * da / .25))) / gl, peel = f === 2 && a > .3 && a < 1.5;
        let col = null;
        if (dd >= -.5 && dd < .5) {
          if (!peel) col = TY;
        } else if (peel && dd >= 1.5 && dd < 2.5) col = TY; else if (dd >= -1.5 && dd < -.5) col = rim; else if (dd >= .5 && dd < 1.5) {
          if (fen && a > -2.75 && a < -.4) col = fen;
        } else if (rr < 1.3) col = "#c8ccd0"; else if (dd < -1.5 && rr >= 2.5) {
          const s = (a + .2) / st, i = Math.round(s);
          if (Math.abs(s - i) * st * rr < .45 && !(f === 2 && (md(i, 3) === 0 || Math.abs(da) < .8))) col = spk;
        }
        if (col) P.p(cx + x, cy + y, col);
      }
      if (f === 1) P.r(cx - 4, B, 9, 1, TY);
      if (f === 2) P.line(cx + Math.cos(-.8) * 2, cy + Math.sin(-.8) * 2, cx + Math.cos(-1.15) * (r + 2), cy + Math.sin(-1.15) * (r + 2), spk);
    };
    const RA = [ 0, 0 ], FA = [ 22, 0 ], BB = [ 8, -1 ], ST = kid ? [ 5.5, 7.5 ] : [ 5, 9 ], SP = kid ? [ 4.8, 10 ] : [ 4, 12 ], HT = city ? [ 17, 11 ] : [ 17, 10 ], HB = [ 19, 6 ];
    if (lie) P.oval(ox + 12, ay + 1, o.rw === 0 ? 13 : 19, o.rw === 0 ? 3 : 5, "rgba(0,0,0,0.14)"); else P.shadow(ox + 11 * k, B, 18 * k, 2, .35);
    if (kid) {
      const ra = T(RA), tx = Math.round(ra[0]) - 3, ty = B - 2;
      P.line(ra[0], ra[1], tx, ty, "#8a8e94");
      for (const [dx, dy] of [ [ -1, -2 ], [ 0, -2 ], [ 1, -2 ], [ -2, -1 ], [ 2, -1 ], [ -2, 0 ], [ 2, 0 ], [ -2, 1 ], [ 2, 1 ], [ -1, 2 ], [ 0, 2 ], [ 1, 2 ] ]) P.p(tx + dx, ty + dy, TY);
      P.p(tx, ty, "#e8e4d8");
    }
    if (o.rw !== 0) wheel(RA, R, o.fl ? 1 : 0);
    if (o.fw !== 0) wheel(FA, R, o.fw === 2 ? 2 : 0);
    if (o.rk) {
      seg([ -5, 9 ], [ 5, 9 ], "#9a9ea4");
      seg([ -4, 9 ], [ 0, 1 ], "#9a9ea4");
    }
    seg([ 8, 1.5 ], [ 0, 1 ], "#3a3c40", "#6e7276");
    if (o.ru > .3) cur([ 8, -3 ], [ 3, -8.5 ], [ 0, -1 ], "#6a3a1c", "#8a4f2e");
    seg(RA, BB, c);
    seg(RA, ST, c);
    seg(BB, ST, c);
    if (o.t === 1) cur([ 18.6, 7.5 ], [ 11, -1.5 ], BB, c); else {
      seg(ST, HT, c);
      seg(BB, HB, c);
    }
    seg(HT, HB, A.shade(c, -.3));
    seg(HB, FA, c);
    if (o.fw === 0) P.p(Math.round(T(FA)[0]), Math.round(T(FA)[1]), "#3a3c40");
    if (o.lk) {
      const lp = T([ 3.5, 2 ]);
      P.ring(Math.round(lp[0]), Math.round(lp[1]), 2, Math.max(1, Math.round(3 * sy)), o.lk).r(Math.round(lp[0]) + 1, Math.round(lp[1]) + 2, 2, 2, "#1e2024");
    }
    if (o.ns) seg(ST, [ 4.6, 10.4 ], "#8a8e94", 0); else {
      seg(ST, SP, "#a8acb2", 0);
      seg([ SP[0] - 3, SP[1] + 1 ], [ SP[0] + 3, SP[1] + 1 ], "#34363a", 0);
      seg([ SP[0] - 2, SP[1] ], [ SP[0] + 1, SP[1] ], "#1c1e22", 0);
      const sp = T([ SP[0] - 3, SP[1] + 1 ]);
      P.p(Math.round(sp[0]), Math.round(sp[1]), "#5a5e64");
      if (o.tear) {
        const tp = T([ SP[0], SP[1] + 1 ]);
        P.p(Math.round(tp[0]), Math.round(tp[1]), "#d8c070").p(Math.round(tp[0]) + 1, Math.round(tp[1]), "#e8d890");
      }
    }
    if (o.t === 0) {
      seg(HT, [ 16.6, 12.6 ], "#8a8e94", 0);
      seg([ 15, 13 ], [ 18.2, 13 ], "#2a2c30", 0);
    } else {
      seg(HT, [ 16.4, 14.3 ], "#a8acb2", 0);
      seg([ 16.4, 14.3 ], [ 13, 14.6 ], "#a8acb2", 0);
      seg([ 12, 14.6 ], [ 13.2, 14.6 ], "#2a2c30", 0);
    }
    if (o.bk === 1) {
      const TL = [ 18, 15 ], TR = o.dent ? [ 24.4, 13.4 ] : [ 25, 15 ], BL = [ 18.5, 10 ], BR = o.dent ? [ 24, 10.6 ] : [ 24.5, 10 ], lr = (a, b, t) => [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t ];
      seg([ 21, 10 ], [ 22, .5 ], "#8a8e94");
      seg([ 18.2, 14 ], [ 16.6, 13.6 ], "#8a8e94", 0);
      for (const t of [ .34, .67 ]) seg(lr(TL, TR, t), lr(BL, BR, t), "#7a7e84");
      seg(lr(TL, BL, .5), lr(TR, BR, .5), "#7a7e84");
      seg(TL, TR, "#b4b8be");
      seg(BL, BR, "#8a8e94");
      seg(TL, BL, "#9a9ea4");
      seg(TR, BR, "#9a9ea4");
    } else if (o.bk === 2) {
      const Q = [ [ 18, 15 ], [ 25, 15 ], [ 24.5, 10 ], [ 18.5, 10 ] ].map(T), bc = "#c8506a";
      P.poly(Q, bc);
      for (let x = 19.5; x < 24; x += 2) for (let y = 11.5; y < 14; y += 2) {
        const q = T([ x, y ]);
        P.p(Math.round(q[0]), Math.round(q[1]), A.shade(bc, -.45));
      }
      seg([ 18, 15 ], [ 25, 15 ], A.shade(bc, .3), 0);
      seg([ 18.5, 10 ], [ 24.5, 10 ], A.shade(bc, -.35), 0);
      seg([ 18.2, 14 ], [ 16.6, 13.6 ], "#8a8e94", 0);
    }
    {
      const b = T(BB), bx = Math.round(b[0]), by = Math.round(b[1]);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
        const d = Math.hypot(x, y / sy);
        if (d >= 1.5 && d < 2.5) P.p(bx + x, by + y, rc("#9a9ea4"));
      }
      seg(BB, [ 5.6, 1.4 ], "#3a3c40", 0);
      seg([ 4.5, 1.6 ], [ 6.5, 1.6 ], "#2a2c30", 0);
      seg(BB, [ 10.4, -3.4 ], "#2a2c30", 0);
      seg([ 9.4, -3.9 ], [ 11.9, -3.9 ], "#141518", 0);
      P.p(bx, by, "#3a3c40");
    }
    if (!lie && !kid && o.fw !== 0) seg([ 7.4, -1.6 ], [ 5.4, -7 ], "#4a4c50", 0);
    if (lie && o.bk) {
      const q = T([ 27, 11 ]), x = Math.round(q[0]), y = Math.round(q[1]);
      P.r(x, y + 2, 4, 3, "#e8e4d8").r(x, y + 2, 4, 1, "#f4f0e8").p(x + 1, y + 4, "#b8b4a8");
      P.r(x + 5, y, 3, 1, "#4a8a5a").p(x + 8, y, "#2a5a3a");
      P.p(x + 3, y - 2, "#e0902a").p(x + 7, y + 4, "#e0902a");
    }
  }
  function propImg(p) {
    if (!p.cust) return A.prop(p.kind, p.v, null, 0);
    const d = CUST[p.kind], w = d.fw * TS, h = d.fh * TS + d.up + (d.ex | 0), v = d.nv ? p.v % d.nv : p.v & 3;
    return {
      c: A.cached("ho:" + p.kind + ":" + v, w, h, P => d.d(P, w, h, d.up, new SX.Rng(SX.hash(p.kind) + v * 7919), v), d.noOut ? null : {
        mat: true
      }),
      oy: -d.up
    };
  }
  const TFC = new Map;
  function tfImg(p, s) {
    const key = p.kind + ":" + p.v + ":" + p.a + ":" + (p.fl ? 1 : 0);
    let r = TFC.get(key);
    if (r) return r;
    const w = s.c.width, h = s.c.height, ca = Math.abs(Math.cos(p.a)), sa = Math.abs(Math.sin(p.a)), W = Math.ceil(w * ca + h * sa) + 2, H = Math.ceil(w * sa + h * ca) + 2;
    if (A.rotDot) {
      const q = A.rotDot(s.c, p.a, p.fl ? 2 : 0, w >> 1, h >> 1, true);
      r = {
        c: q.c,
        tx: (w >> 1) + q.ox,
        oy: s.oy + (h >> 1) + q.oy
      };
      TFC.set(key, r);
      return r;
    }
    const c = A.mk(W, H), x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.translate(W / 2, H / 2);
    x.rotate(p.a);
    if (p.fl) x.scale(-1, 1);
    x.drawImage(s.c, -w / 2, -h / 2);
    r = {
      c,
      tx: Math.round((w - W) / 2),
      oy: s.oy + Math.round((h - H) / 2)
    };
    TFC.set(key, r);
    return r;
  }
  HO.img = (kind, v, a, fl) => {
    const p = {
      kind,
      v: v | 0,
      cust: !!CUST[kind],
      a: a || 0,
      fl: !!fl
    }, s = propImg(p);
    return s && s.c && (p.a || p.fl) ? tfImg(p, s) : s;
  };
  function canPut(O, x, y, fw, fh, up, okK) {
    for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) {
      const i = gidx(O, xx, yy);
      if (i < 0 || O.occ[i] || okK && !okK.has(O.k[i])) return false;
    }
    for (let yy = y - Math.ceil(up / TS); yy <= y + fh; yy++) for (let xx = x - 1; xx <= x + fw; xx++) if (bldAt(O, xx, yy)) return false;
    return true;
  }
  function place(O, kind, x, y, v, d, cust) {
    for (let yy = y; yy < y + d.fh; yy++) for (let xx = x; xx < x + d.fw; xx++) O.occ[gidx(O, xx, yy)] = 1;
    const p = {
      kind,
      x,
      y,
      v: v | 0,
      fw: d.fw,
      fh: d.fh,
      up: d.up,
      cust
    };
    O.props.push(p);
    if (cust && d.nv) {
      p.v = H32(x, y, v | 0) % d.nv;
      p.fl = (H32(y, x, 7) & 1) === 1;
    }
    if (cust && d.glow) for (const q of d.glow) O.heads.push({
      x: x * TS + q[0],
      y: y * TS - d.up + q[1],
      w: q[2],
      h: q[3],
      c: q[4]
    });
    return p;
  }
  function put(O, kind, x, y, v, okK) {
    const cust = !!CUST[kind], d = cust ? CUST[kind] : A.propDims(kind, 0);
    if (!d) return null;
    if (!canPut(O, x, y, d.fw, d.fh, d.up, okK)) return null;
    if (VEH[kind] && doorNear(O, x - 1, y - 1, x + d.fw, y + d.fh)) return null;
    return place(O, kind, x, y, v, d, cust);
  }
  function doorNear(O, x0, y0, x1, y1) {
    for (const L of O.lots || []) if (!L.dead && L.door >= 0 && L.door >= x0 && L.door <= x1 && L.y1 + 1 >= y0 && L.y1 + 1 <= y1) return true;
    return false;
  }
  function putNear(O, kind, x, y, v, okK, L) {
    const cust = !!CUST[kind], d = cust ? CUST[kind] : A.propDims(kind, 0);
    if (!d) return null;
    if (x < L.x0 + 1 || x + d.fw - 1 > L.x1 - 1 || y < L.y0 + 1 || y + d.fh - 1 > L.y1 - L.face - 1) return null;
    for (let yy = y - Math.ceil(d.up / TS); yy <= y + d.fh; yy++) for (let xx = x; xx < x + d.fw; xx++) if (bldAt(O, xx, yy)) return null;
    for (let yy = y; yy < y + d.fh; yy++) for (let xx = x; xx < x + d.fw; xx++) {
      const i = gidx(O, xx, yy);
      if (i < 0 || O.occ[i] || okK && !okK.has(O.k[i])) return null;
    }
    return place(O, kind, x, y, v, d, cust);
  }
  function carP(O, kind, px, py, v, a, fl, okK, force, lo) {
    const cust = !!CUST[kind], d = cust ? CUST[kind] : A.propDims(kind, 0);
    if (!d) return null;
    a = Math.round(a * 40) / 40;
    px = Math.round(px);
    py = Math.round(py);
    const sp = Math.abs(Math.sin(a)) * d.fw * TS / 2, x0 = Math.floor(px / TS), x1 = Math.floor((px + d.fw * TS - 1) / TS), y0 = Math.floor((py - sp) / TS), y1 = Math.floor((py + d.fh * TS + sp - 1) / TS), m = force ? 0 : 1;
    for (let yy = y0 - Math.ceil(d.up / TS); yy <= y1 + m; yy++) for (let xx = x0 - m; xx <= x1 + m; xx++) if (bldAt(O, xx, yy)) return null;
    if (!force) for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const i = gidx(O, xx, yy);
      if (i < 0 || O.occ[i] || okK && !okK.has(O.k[i])) return null;
    }
    if (!lo) for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const i = gidx(O, xx, yy);
      if (i >= 0) O.occ[i] = 1;
    }
    const y = Math.floor(py / TS), p = {
      kind,
      x: x0,
      y,
      v: v | 0,
      fw: d.fw,
      fh: d.fh,
      up: d.up,
      cust,
      dx: px - x0 * TS,
      dy: py - y * TS,
      a,
      fl: !!fl,
      lo: !!lo
    };
    O.props.push(p);
    return p;
  }
  function freeBox(O, x0, y0, x1, y1, okK) {
    for (let ty = Math.floor(y0 / TS); ty <= Math.floor(y1 / TS); ty++) for (let tx = Math.floor(x0 / TS); tx <= Math.floor(x1 / TS); tx++) {
      const i = gidx(O, tx, ty);
      if (i < 0 || O.occ[i] || bldAt(O, tx, ty) || okK && !okK.has(O.k[i])) return false;
    }
    return true;
  }
  const VEH = HO.VEH = {};
  for (const [k, t, n, w] of [ [ "car", "세단", 6, 28 ], [ "suv", "SUV", 6, 15 ], [ "carMini", "경차", 6, 11 ], [ "taxi", "택시", 4, 10 ], [ "van", "승합", 6, 12 ], [ "truck", "1톤 트럭", 6, 10 ], [ "boxTruck", "탑차", 4, 7 ], [ "busTown", "마을버스", 3, 4 ], [ "busSeoul", "버스", 4, 3 ] ]) {
    VEH[k] = {
      t,
      n,
      w
    };
    for (let m = 0; m < 3; m++) VEH[vMode(k, m)] = {
      t,
      n: 4
    };
  }
  Object.assign(VEH, {
    wreck: {
      t: "세단",
      n: 4
    },
    burnt: {
      t: "세단",
      n: 4
    },
    motorbike: {
      t: "오토바이",
      n: 3,
      b: 1
    },
    scooter: {
      t: "배달 스쿠터",
      n: 4,
      b: 1
    },
    bikeFall: {
      t: "쓰러진 오토바이",
      n: 8,
      b: 1
    }
  });
  function vMode(k, m) {
    return m < 0 ? k : k === "car" ? [ "wreckP", "burntP", "aband" ][m] : k + [ "Wk", "Bt", "Ab" ][m];
  }
  const V_ALL = [ "car", "suv", "carMini", "taxi", "van", "truck", "boxTruck", "busTown", "busSeoul" ], V_LOT = V_ALL.slice(0, 7), V3 = V_ALL.slice(0, 4);
  function vPick(g, set) {
    let s = 0;
    for (const k of set) s += VEH[k].w;
    let r = g.f() * s;
    for (const k of set) {
      r -= VEH[k].w;
      if (r < 0) return k;
    }
    return set[0];
  }
  function roadCars(O, g, ra, rb, X0, X1, dens) {
    const RD = new Set([ K.ROAD, K.LANE, K.CROSS ]), PK = new Set([ K.ROAD, K.LANE, K.WALK ]), CW = 3 * TS, CHh = 2 * TS, T0 = ra * TS, T1 = (rb + 1) * TS, XA = X0 * TS, XB = (X1 - 3) * TS;
    const sg = () => g.chance(.5) ? 1 : -1, fwOf = k => (CUST[k] || A.propDims(k, 0)).fw * TS, grp = ps => {
      const id = O.props.length;
      for (const p of ps) if (p) p.grp = id;
    };
    for (const top of [ true, false ]) for (let px = XA + g.i(CW); px < XB; ) {
      if (g.chance(.25)) {
        px += g.ri(2, 8) * TS;
        continue;
      }
      if (g.chance(.14)) {
        let q = px;
        for (let j = g.ri(1, 2); j > 0; j--) {
          if (carP(O, g.chance(.65) ? "scooter" : "motorbike", q, top ? T0 + g.ri(-4, 4) : T1 - TS - g.ri(-2, 6), g.i(6), g.chance(.3) ? sg() * g.r(.02, .08) : 0, top ? !g.chance(.2) : g.chance(.2), PK)) q += 2 * TS + g.ri(2, 10);
        }
        px = q + g.ri(16, 40);
        continue;
      }
      const b = vPick(g, V_ALL), up = g.chance(.2) ? g.ri(8, 18) : 0, py = top ? T0 - up + g.ri(0, 6) : T1 - CHh + up - g.ri(0, 6);
      const p = carP(O, g.chance(.15) ? vMode(b, 2) : b, px, py, g.i(6), g.chance(.3) ? sg() * g.r(.02, .06) : 0, top ? !g.chance(.12) : g.chance(.12), PK);
      px += p ? p.fw * TS + g.ri(0, 24) + (g.chance(.3) ? g.ri(1, 4) * TS : 0) : g.ri(8, 32);
    }
    const n = Math.max(2, Math.round((X1 - X0) / 14 * dens)), spanY = Math.max(1, T1 - T0 - CHh - 12);
    for (let k = 0, t = 0; k < n && t < n * 40; t++) {
      const px = XA + 2 * TS + g.i(Math.max(1, XB - XA - 4 * TS)), py = T0 + 6 + g.i(spanY), r = g.f(), fl = g.chance(.5), b = vPick(g, V_ALL), W = fwOf(b);
      if (r < .28) {
        if (carP(O, g.chance(.55) ? vMode(b, 2) : b, px, py, g.i(6), sg() * g.r(.08, W > 4 * TS ? .2 : .45), fl, RD)) {
          k++;
          if (g.chance(.35)) carP(O, "skid", px + (fl ? W - 8 : -CW + 8), py + 30, g.i(4), 0, fl, null, true, true);
        }
      } else if (r < .48) {
        const m = g.ri(2, 3), ks = [ b ], xs = [ px ];
        for (let j = 1; j < m; j++) {
          ks.push(vPick(g, V_LOT));
          xs.push(xs[j - 1] + fwOf(ks[j - 1]) - g.ri(4, 12));
        }
        const xe = xs[m - 1] + fwOf(ks[m - 1]);
        if (!freeBox(O, px - 8, py - 20, xe + 8, py + CHh + 20, RD)) continue;
        grp(ks.map((kk, j) => carP(O, (fl ? j === m - 1 : j === 0) ? vMode(kk, 0) : g.chance(.3) ? vMode(kk, 2) : kk, xs[j], py + g.ri(-6, 6), g.i(6), sg() * g.r(0, .1), fl, null, true)));
        carP(O, "skid", fl ? xe - 10 : px - CW + 10, py + 30, g.i(4), 0, fl, null, true, true);
        carP(O, "debris", fl ? xs[m - 1] - 24 : xs[1] - 36, py + 40, g.i(4), 0, false, null, true, true);
        k++;
      } else if (r < .66) {
        const dn = g.chance(.5), c = vPick(g, V_LOT), Wc = fwOf(c), bx = px + Math.round(fl ? W * .48 : -Wc * .48), by = py + (dn ? 34 : -30), ab = (dn ? -1 : 1) * (fl ? -1 : 1) * g.r(.35, .6);
        if (!freeBox(O, Math.min(px, bx) - 8, Math.min(py, by) - 24, Math.max(px + W, bx + Wc) + 8, Math.max(py, by) + CHh + 24, RD)) continue;
        grp([ carP(O, g.chance(.5) ? vMode(b, 2) : b, px, py, g.i(6), sg() * g.r(0, .12), g.chance(.5), null, true), carP(O, vMode(c, 0), bx, by, g.i(4), ab, fl, null, true) ]);
        carP(O, "debris", px + 16, py + (dn ? 44 : 20), g.i(4), 0, false, null, true, true);
        k++;
      } else if (r < .78) {
        if (carP(O, vMode(b, 1), px, py, g.i(4), sg() * g.r(.05, W > 4 * TS ? .2 : .4), fl, RD)) k++;
      } else if (r < .88) {
        if (carP(O, vMode(b, 0), px, py, g.i(4), sg() * g.r(.1, W > 4 * TS ? .25 : .55), fl, RD)) {
          k++;
          carP(O, "debris", px + (fl ? -20 : W - 30), py + 36, g.i(4), 0, false, null, true, true);
        }
      } else {
        let q = px;
        for (let j = g.ri(1, 2); j > 0; j--) {
          if (carP(O, "bikeFall", q, py + 20 + g.ri(-8, 8), g.i(8), sg() * g.r(0, .3), fl, RD)) {
            k++;
            if (g.chance(.5)) carP(O, "skid", q + (fl ? 2 * TS - 8 : -CW + 8), py + 24, g.i(4), 0, fl, null, true, true);
          }
          q += 2 * TS + g.ri(10, 60);
        }
      }
    }
  }
  function jitterCars(O, g) {
    for (const p of O.props) if (VEH[p.kind] && VEH[p.kind].w && p.dx == null) {
      p.fl = g.chance(.5);
      p.a = g.chance(.4) ? Math.round(g.r(-.06, .06) * 40) / 40 : 0;
      p.dx = g.ri(-6, 6);
      p.dy = g.ri(-6, 4);
    }
  }
  const lamp = (O, F, x, y, r, c, a) => F.lamps.push({
    x,
    y,
    r,
    c,
    a,
    out: true
  });
  const ROOFP = [ "tank", "ac", "ac", "planter", "jangdok", "dish", "solar", "line", "stair", "vent", "garden", "drum", "boxes", "planterBig" ];
  function roofProps(O, F, g, L, n) {
    const ok = new Set([ K.ROOF, K.GREEN ]);
    n = Math.max(n, Math.round((L.x1 - L.x0 + 1) * (L.y1 - L.y0 + 1 - L.face) / 12));
    for (let k = 0, t = 0; k < n && t < n * 8; t++) {
      const kind = g.pick(ROOFP), x = L.x0 + 1 + g.i(Math.max(1, L.x1 - L.x0 - 1)), y = L.y0 + 1 + g.i(Math.max(1, L.y1 - L.face - L.y0 - 1));
      const p = put(O, kind, x, y, g.i(6), ok);
      if (!p) continue;
      k++;
      if (kind === "stair" && g.chance(.6)) lamp(O, F, x + 1, y + 2.2, 3.2, [ 255, 205, 140 ], .4);
    }
  }
  function roofSigns(O) {
    const q = new SX.Rng(O.seed + 1029), ok = new Set([ K.ROOF ]), LS = O.lots.filter(L => !L.own && !L.dead && L.x1 - L.x0 >= 4 && L.y1 - L.face - L.y0 >= 2);
    const torch = (X, Y) => O.heads.push({
      x: X - 2,
      y: Y - 2,
      w: 6,
      h: 5,
      c: "rgba(220,235,255,0.1)"
    }, {
      x: X,
      y: Y,
      w: q.chance(.5) ? 2 : 1,
      h: 1,
      c: "#eef4ff"
    });
    const spot = L => [ (L.x0 + 1 + q.i(L.x1 - L.x0 - 1)) * TS + 6 + q.i(20), (L.y0 + 1 + q.i(Math.max(1, L.y1 - L.face - L.y0 - 1))) * TS + 6 + q.i(18) ];
    const hid = (x, y) => O.props.some(p => !p.lo && p.y > y && p.x < x + 3 && p.x + p.fw > x && p.y * TS + (p.dy | 0) - p.up < (y + 1) * TS);
    let ns = 0, nt = 0;
    for (const L of LS) {
      if (ns < 3 && q.chance(.08)) {
        for (let t = 0; t < 12; t++) {
          const x = L.x0 + 1 + q.i(L.x1 - L.x0 - 3), y = L.y0 + 1 + q.i(Math.max(1, L.y1 - L.face - L.y0 - 1)), v = q.i(4);
          if (hid(x, y)) continue;
          const p = put(O, "sos", x, y, v, ok);
          if (!p) continue;
          p.lo = true;
          ns++;
          if (nt < 4 && q.chance(.5)) {
            torch(...spot(L));
            nt++;
          }
          break;
        }
      } else if (nt < 4 && q.chance(.04)) {
        torch(...spot(L));
        nt++;
      }
    }
  }
  HO.setup = function(F, t, P, ox, oy) {
    const kind = HO.KIND[t.id] || "dark", TT = SX.map.T, cfg = HO.BLD[t.id] || null;
    const O = {
      kind,
      cfg,
      GX: -EXT,
      GY: -EXT,
      GW: F.W + EXT * 2,
      GH: F.H + EXT * 2,
      seed: SX.hash("homeOut:" + t.id) | 0,
      lots: [],
      props: [],
      heads: [],
      gc: new Map,
      cells: new Map,
      dim: 0
    };
    const N = O.GW * O.GH;
    O.k = new Uint8Array(N);
    O.lot = new Int16Array(N).fill(-1);
    O.v = new Uint8Array(N);
    O.bld = new Uint8Array(N);
    O.occ = new Uint8Array(N);
    F.out = O;
    O.sky = kind !== "dark" && !(kind === "under" && !(cfg && (cfg.top === "alley" || cfg.bot === "alley")));
    if (kind === "dark") return O;
    const B = O.B = {
      x0: ox - 1,
      y0: oy - 1,
      x1: ox + P.w,
      y1: oy + P.h
    };
    const rv = O.rv = P.river ? oy + P.river.y1 : -1e9;
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) if (F.t[F.i(x, y)] !== TT.VOID && y > rv) O.bld[gidx(O, x, y)] = 1;
    O.E = B;
    if (cfg) markBld(O, F, P, t, ox, oy);
    const g = new SX.Rng(O.seed);
    if (kind === "street" || kind === "street2") genStreet(O, F, P, g, kind === "street2"); else if (kind === "roofs") genRoofs(O, F, P, g); else if (kind === "high") genHigh(O, F, P, ox, oy, g); else if (kind === "under") genUnder(O, F, P, g);
    if (cfg) {
      stampBld(O, F);
      const n0 = F.lamps.length;
      hallDeco(O, F, g);
      for (let k = n0; k < F.lamps.length; k++) F.lamps[k].day = 1;
    }
    disaster(O, F, g);
    if (kind === "roofs") roofSigns(O);
    O.props.sort((a, b) => (a.lo ? 0 : 1) - (b.lo ? 0 : 1) || (a.y + a.fh) * TS + (a.dy | 0) - ((b.y + b.fh) * TS + (b.dy | 0)) || a.x - b.x);
    return O;
  };
  function markBld(O, F, P, t, ox, oy) {
    const TT = SX.map.T, W = F.W, Hh = F.H, cfg = O.cfg, rv = O.rv, ex = O.ex = ox + P.entry.x, ey = O.ey = oy + P.entry.y, N = W * Hh;
    const land = O.land = new Uint8Array(N), mk = O.mk = new Uint8Array(N), uk = O.uk = new Int32Array(N), pm = O.pm = new Uint8Array(N), our = O.our = new Uint8Array(N);
    const ld = F.homeLand || [ ex, ey + 1, ex + 1, Math.min(Hh - 1, ey + 2) ];
    for (let y = ld[1]; y <= ld[3]; y++) for (let x = ld[0]; x <= ld[2]; x++) land[F.i(x, y)] = 1;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const i = F.i(x, y);
      if (F.t[i] === TT.VOID || y <= rv || land[i]) continue;
      our[i] = 1;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const Bw = O.Bw = {
      x0,
      y0,
      x1,
      y1
    }, pd = cfg.pad, h = cfg.hall;
    const PR = {
      x0: Math.max(0, x0 - pd[0]),
      y0: Math.max(0, y0 - pd[1]),
      x1: Math.min(W - 1, x1 + pd[2]),
      y1: Math.min(Hh - 1, y1 + pd[3])
    };
    const HR = O.H = h && h.side ? {
      x0: ex + 1,
      x1: Math.min(W - 1, ex + h.w),
      y0: ey - 1,
      y1: Math.min(Hh - 1, y1 - 1),
      sty: h.sty,
      side: 1
    } : h && h.full ? {
      x0: x0 + 1,
      x1: x1 - 1,
      y0: ey + 1,
      y1: Math.min(Hh - 1, ey + h.d),
      sty: h.sty,
      full: 1
    } : h ? {
      x0: ex + h.x0,
      x1: ex + h.x1,
      y0: ey + 1,
      y1: Math.min(Hh - 1, ey + h.d),
      sty: h.sty
    } : cfg.corr ? {
      x0,
      x1,
      y0: y1 + 1,
      y1: Math.min(Hh - 1, y1 + cfg.corr.d),
      sty: "corr"
    } : null;
    const inR = (R, x, y) => !!R && x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1, vd = (x, y) => F.in(x, y) && F.t[F.i(x, y)] === TT.VOID && y > rv;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (vd(x, y)) mk[F.i(x, y)] = inR(HR, x, y) ? 2 : inR(Bw, x, y) ? cfg.notch === "slab" ? 3 : 1 : inR(PR, x, y) ? 1 : 0;
    if (h && h.ring) {
      const rg = (x, y) => {
        if (vd(x, y) && !mk[F.i(x, y)]) mk[F.i(x, y)] = 1;
      };
      for (let y = HR.y0; y <= HR.y1; y++) {
        rg(HR.x0 - 1, y);
        rg(HR.x1 + 1, y);
      }
      if (!h.open) for (let x = HR.x0 - 1; x <= HR.x1 + 1; x++) rg(x, HR.y1 + 1);
    }
    if (h && h.full) {
      const by = O.botY = Math.min(Hh - 1, HR.y1 + 1);
      for (let y = HR.y0; y <= by; y++) for (const x of [ x0, x1 ]) if (vd(x, y)) mk[F.i(x, y)] = 1;
      for (let x = x0; x <= x1; x++) if (vd(x, by)) mk[F.i(x, by)] = 1;
      O.wcols = new Set;
      for (let x = x0; x <= x1; x++) {
        let b = -1;
        for (let y = y0; y <= y1; y++) if (our[F.i(x, y)]) b = y;
        if (b >= 0 && F.t[F.i(x, b)] === TT.WINDOW) O.wcols.add(x);
      }
      if (!O.wcols.size) for (let x = x0 + 2; x < x1; x += 4) O.wcols.add(x);
      O.elx = [ HR.x0 + 1, HR.x0 + 3 ];
    }
    if (h && h.side) for (let x = HR.x0; x <= HR.x1; x++) for (const y of [ HR.y0 - 1, HR.y1 + 1 ]) if (vd(x, y) && !mk[F.i(x, y)]) mk[F.i(x, y)] = 1;
    let a = x0, b = y0, c = x1, d = y1;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const i = F.i(x, y);
      if (!mk[i] && !land[i]) continue;
      if (x < a) a = x;
      if (x > c) c = x;
      if (y < b) b = y;
      if (y > d) d = y;
    }
    if (cfg.front) d = Math.max(d, Math.min(Hh - 1, y1 + cfg.front));
    const E = O.E = {
      x0: a,
      y0: b,
      x1: c,
      y1: d
    }, uw = cfg.uw;
    O.ux = cfg.ua ? x0 - Math.ceil((x0 - a) / uw) * uw : a;
    const key = (x, y) => {
      const cl = Math.floor((x - O.ux) / uw);
      if (inR(Bw, x, y)) return 6e3 + cl;
      if (y < Bw.y0) return 1e3 + cl;
      if (y > Bw.y1) return HR && y >= HR.y0 && y <= HR.y1 ? (x < HR.x0 ? 7e3 : 8e3) + cl : 2e3 + cl;
      return (x < Bw.x0 ? 4e3 : 5e3) + Math.floor((y - Bw.y0) / uw);
    };
    const hid = !!F.storyOff;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const i = F.i(x, y);
      if (mk[i] === 1) {
        pm[i] = 1;
        uk[i] = key(x, y);
      } else if (hid && our[i]) {
        pm[i] = 2;
        uk[i] = 1;
      }
      if (mk[i]) O.bld[gidx(O, x, y)] = 1;
    }
    O.elz = null;
    if (h && h.full) {
      const wy = HR.y0 - 1, isP = (x, y) => F.in(x, y) && pm[F.i(x, y)] === 1;
      let xe = HR.x0 - 1;
      while (xe < HR.x0 + 4 && isP(xe + 1, wy)) xe++;
      const row = y => {
        for (let x = HR.x0; x <= xe; x++) if (!isP(x, y)) return false;
        return true;
      };
      if (xe === HR.x0 + 4 && row(wy - 1) && row(wy - 2)) O.elz = {
        x0: HR.x0,
        x1: xe,
        y0: wy - 2,
        y1: wy - 1,
        wy
      };
    }
    const wc = t.wall || "#8a8478";
    O.pcol = A.shade(wc, -.1);
    O.ocol = A.shade(wc, -.03);
    F.plateAt = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= Hh) return false;
      const v = pm[y * W + x];
      return v === 1 || v === 2 && !!F.voidAt && F.voidAt(x, y);
    };
  }
  function stampBld(O, F) {
    for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
      const i = F.i(x, y), m = O.mk[i];
      const k = m === 1 ? K.CEIL : m === 2 ? K.HALL : m === 3 ? K.SLAB : O.land[i] ? K.HALL : O.our[i] ? K.CEIL : -1;
      if (k < 0) continue;
      const gi = gidx(O, x, y);
      O.k[gi] = k;
      O.lot[gi] = -1;
      O.v[gi] = 0;
    }
  }
  const HL = {
    side2: [ [ 232, 240, 255 ], .5, 3.4, 9 ],
    stair2: [ [ 255, 214, 160 ], .5, 3, 9 ],
    goshi: [ [ 255, 226, 180 ], .42, 3.2, 4 ],
    steps: [ [ 255, 200, 140 ], .5, 3, 9 ],
    corr: [ [ 255, 224, 176 ], .42, 3.2, 5 ],
    porch: [ [ 255, 214, 160 ], .55, 3.6, 9 ],
    lobby: [ [ 255, 230, 196 ], .6, 4.2, 9 ],
    park: [ [ 210, 228, 255 ], .5, 4.5, 5 ],
    conc: [ [ 190, 206, 226 ], .32, 5, 7 ],
    exit: [ [ 226, 234, 246 ], .42, 3.4, 4 ]
  };
  function hallDeco(O, F, g) {
    const H = O.H;
    if (!H) return;
    const ex = O.ex, ey = O.ey, st = H.sty, w = H.x1 - H.x0 + 1, L = HL[st], n = Math.max(1, Math.round(w / L[3]));
    for (let k = 0; k < n; k++) lamp(O, F, H.x0 + (k + .5) * w / n, H.y0 + .6, L[2], L[0], L[1]);
    const mat = {
      goshi: 1,
      corr: 3,
      porch: 0,
      lobby: 2
    }[st];
    if (mat != null) hallPut(O, F, "doormat", ex, ey + 1, mat, true);
    if (st === "park") {
      for (let y = H.y0; y <= H.y0 + 5; y++) for (let x = H.x0 - 16; x <= H.x1 + 16; x++) if (kAt(O, x, y) === K.EARTH) O.k[gidx(O, x, y)] = K.HALL;
      for (const dx of [ -1, 2, -11, 12, -20, 21 ]) for (const y of [ ey + 2, ey + 5 ]) hallPut(O, F, "pillar", ex + dx, y, dx + y & 1);
      hallPut(O, F, "wreckP", ex - 4, ey + 2, g.i(4));
      for (const y of [ ey + 2, ey + 5 ]) for (const dx of [ -4, -7, -10, -13, -16, -19, -22, 3, 6, 9, 12, 15, 18, 21 ]) {
        const r = g.f();
        const b = vPick(g, V3);
        if (r < .3) hallPut(O, F, b, ex + dx, y, g.i(6)); else if (r < .5) hallPut(O, F, vMode(b, 0), ex + dx, y, g.i(4)); else if (r < .62) hallPut(O, F, vMode(b, 1), ex + dx, y, g.i(4));
      }
      for (let k = 0, t = 0; k < 3 && t < 40; t++) if (hallPut(O, F, g.chance(.5) ? "barrier" : "cone", ex - 18 + g.i(38), ey + 4, g.i(4))) k++;
      for (let x = H.x0 - 14; x <= H.x1 + 14; x += 6) if (x < H.x0 || x > H.x1) {
        if (g.chance(.7)) lamp(O, F, x + .5, H.y0 + .6, 4.5, [ 210, 228, 255 ], .45);
        if (g.chance(.5)) lamp(O, F, x + 3.5, H.y0 + 3.6, 4.5, [ 210, 228, 255 ], .4);
      }
    }
    if (st === "conc") {
      hallPut(O, F, "gate", ex - 4, ey + 1, 0);
      hallPut(O, F, "gate", ex + 5, ey + 1, 1);
      hallPut(O, F, "vending", H.x0, ey + 2, g.i(4));
      hallPut(O, F, g.chance(.5) ? "binMetal" : "trash", H.x1, ey + 2, g.i(4));
    }
    if (st === "stair2") {
      const E = O.E;
      addLot(O, g, E.x0, H.y0, E.x1, H.y1, {
        face: H.y1 - H.y0 + 1,
        shop: true,
        lit: .12,
        wall: "#9a9488"
      });
      for (let y = H.y0; y <= H.y1; y++) for (let x = H.x0; x <= H.x1; x++) {
        const i = gidx(O, x, y);
        O.k[i] = K.HALL;
        O.lot[i] = -1;
      }
      for (let x = H.x0; x <= H.x1; x++) {
        const i = gidx(O, x, H.y1 + 1);
        if (i >= 0 && O.k[i] === K.AWN) O.k[i] = K.WALK;
      }
    }
    if (st === "side2") {
      const E = O.E, Bw = O.Bw, FH = F.wallH || A.WALL_H;
      if (E.y1 > Bw.y1) addLot(O, g, E.x0, Bw.y1 + 1, E.x1, E.y1, {
        face: E.y1 - Bw.y1,
        shop: true,
        lit: .12,
        wall: "#9a9488"
      });
      for (let y = E.y0; y < H.y0 - 1; y++) for (let x = H.x0; x <= H.x1; x++) {
        const i = gidx(O, x, y);
        if (i >= 0 && O.k[i] === K.SLAB) {
          O.k[i] = K.ALLEY;
          O.lot[i] = -1;
          O.v[i] = 0;
        }
      }
      lamp(O, F, H.x0 + 1.5, H.y1 - .6, 2.6, [ 220, 232, 255 ], .3);
      O.heads.push({
        x: (H.x0 + 1) * TS + 1,
        y: H.y0 * TS - FH + 1,
        w: 30,
        h: 9,
        c: "rgba(225,238,255,0.16)"
      }, {
        x: (H.x0 + 1) * TS + 5,
        y: H.y0 * TS - FH + 4,
        w: 22,
        h: 2,
        c: "#f8fcff"
      });
      const AL = new Set([ K.ALLEY ]);
      for (let k = 0, t = 0; k < 2 && t < 30; t++) if (put(O, g.pick([ "binMetal", "trash", "boxes", "drum" ]), H.x0 + g.i(H.x1 - H.x0 + 1), E.y0 + g.i(Math.max(1, H.y0 - 2 - E.y0)), g.i(4), AL)) k++;
    }
    if (st === "lobby" && H.full) {
      const y1 = H.y1, y2 = H.y1 - 1, rug = hallPut(O, F, "rugBig", ex - 6, y2, g.i(4));
      if (rug) {
        rug.lo = true;
        for (let yy = rug.y; yy < rug.y + rug.fh; yy++) for (let xx = rug.x; xx < rug.x + rug.fw; xx++) O.occ[gidx(O, xx, yy)] = 0;
      }
      for (const [k, x, y] of [ [ "bigPlant", H.x0, y1 ], [ "bigPlant", H.x0 + 4, y1 ], [ "sofa", ex - 6, y2 ], [ "coffeeTable", ex - 6, y1 ], [ "armchair", ex - 7, y1 ], [ "armchair", ex - 4, y1 ], [ "floorLamp", ex - 8, y1 ], [ "plant", ex - 2, y1 ], [ "trash", ex + 3, y1 ], [ "planterBig", ex + 4, y2 ], [ "bench", ex + 6, y1 ], [ "fishTank", ex + 8, y2 ], [ "bigPlant", ex + 10, y1 ], [ "waterCooler", ex + 11, y2 ], [ "vending", ex + 12, y2 ], [ "planterBig", H.x1 - 1, y2 ], [ "bigPlant", H.x1, y1 ] ]) hallPut(O, F, k, x, y, g.i(4));
    } else if (st === "lobby") {
      hallPut(O, F, "planterBig", H.x0, ey + 2, g.i(4));
      hallPut(O, F, "planterBig", H.x1 - 1, ey + 2, g.i(4));
    }
    if (st === "porch") {
      hallPut(O, F, "planter", H.x0, H.y1, g.i(4));
      if (g.chance(.6)) hallPut(O, F, "planter", H.x1, H.y1, g.i(4));
    }
  }
  function hallPut(O, F, kind, x, y, v, land) {
    const cust = !!CUST[kind], d = cust ? CUST[kind] : A.propDims(kind, 0);
    if (!d) return null;
    const hk = (xx, yy) => kAt(O, xx, yy) === K.HALL;
    for (let yy = y; yy < y + d.fh; yy++) for (let xx = x; xx < x + d.fw; xx++) {
      const i = gidx(O, xx, yy);
      if (i < 0 || !hk(xx, yy) || O.occ[i] || !land && F.in(xx, yy) && O.land[F.i(xx, yy)]) return null;
    }
    for (let yy = y - Math.ceil(d.up / TS); yy < y; yy++) for (let xx = x; xx < x + d.fw; xx++) if (!hk(xx, yy)) return null;
    for (let yy = y; yy < y + d.fh; yy++) for (let xx = x; xx < x + d.fw; xx++) O.occ[gidx(O, xx, yy)] = 1;
    const p = {
      kind,
      x,
      y,
      v: v | 0,
      fw: d.fw,
      fh: d.fh,
      up: d.up,
      cust
    };
    O.props.push(p);
    return p;
  }
  function disaster(O, F, g) {
    const B = O.B;
    if (!B) return;
    const RD = new Set([ K.ROAD, K.LANE, K.CROSS ]), GD = new Set([ K.ALLEY, K.WALK, K.LOT ]), cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2;
    const tp = (kind, n, ok, rx, ry) => {
      for (let k = 0, t = 0; k < n && t < n * 80; t++) {
        const x = Math.round(cx - rx + g.i(rx * 2)), y = Math.round(cy - ry + g.i(ry * 2));
        if (put(O, kind, x, y, g.i(4), ok)) k++;
      }
    };
    tp("wreck", 3, RD, 34, 26);
    tp("burnt", 2, RD, 34, 26);
    tp("wreck", 2, GD, 30, 24);
    tp("burnt", 1, GD, 30, 24);
    for (let j = 0; j < 3; j++) tp(vMode(vPick(g, V_LOT), j & 1), 1, RD, 34, 26);
    tp("barrier", 2, RD, 30, 24);
    tp("cone", 4, RD, 30, 24);
    tp("sandbag", 2, GD, 26, 20);
  }
  function genUnder(O, F, P, g) {
    const E = O.E, W = O.Bw, cfg = O.cfg, X0 = O.GX, Y0 = O.GY, X1 = O.GX + O.GW - 1, Y1 = O.GY + O.GH - 1, AL = new Set([ K.ALLEY ]);
    if (cfg && (cfg.top === "alley" || cfg.bot === "alley")) {
      genAlleys(O, F, P, g);
      return;
    }
    fill(O, X0, Y0, X1, Y1, K.EARTH);
    if (!cfg) return;
    const lamps = y => {
      for (let x = X0 + 2 + g.i(4); x <= X1 - 1; x += 9 + g.i(4)) if (put(O, "lamp", x, y, 0, AL)) {
        lamp(O, F, x + .8, y + .5, 6, [ 255, 214, 150 ], .7);
        headGlow(O, x, y);
      }
    };
    const junk = (y0, y1, n) => {
      for (let k = 0, tr = 0; k < n && tr < n * 8; tr++) {
        const r = g.f();
        if (put(O, r < .3 ? "binMetal" : r < .55 ? "trash" : r < .7 ? "boxes" : r < .85 ? "drum" : "bicycle", X0 + g.i(O.GW), y0 + g.i(y1 - y0 + 1), g.i(4), AL)) k++;
      }
    };
    if (cfg.top === "alley") {
      const a0 = W.y0 - 3, a1 = W.y0 - 1;
      fill(O, X0, Y0, X1, a1, K.ALLEY);
      for (let yb = a0 - 1; yb >= Y0; ) {
        const d = g.ri(8, 12);
        rowLots(O, g, X0 + g.i(4), X1, yb - d + 1, yb, {
          face: 2,
          shop: .08
        });
        yb -= d + 2;
      }
      lamps(a0);
      junk(a0, a1, 36);
    }
    if (cfg.bot === "alley") {
      const a0 = E.y1 + 1, a1 = E.y1 + 3;
      fill(O, X0, a0, X1, Y1, K.ALLEY);
      for (let yt = a1 + 1; yt <= Y1; ) {
        const d = g.ri(8, 12);
        rowLots(O, g, X0 + g.i(4), X1, yt, yt + d - 1, {
          face: 2,
          shop: .12
        });
        yt += d + 2;
      }
      lamps(a1);
      junk(a0, a1, 36);
    }
    for (const L of O.lots) {
      roofProps(O, F, g, L, g.ri(1, 3));
      if (L.door >= 0 && g.chance(.45)) lamp(O, F, L.door + .5, L.y1 + 1.2, 3.2, [ 255, 205, 140 ], .45);
    }
  }
  function genAlleys(O, F, P, g) {
    const E = O.E, X0 = O.GX, Y0 = O.GY, X1 = X0 + O.GW - 1, Y1 = Y0 + O.GH - 1, GW = O.GW;
    fill(O, X0, Y0, X1, Y1, K.ALLEY);
    const al = new Uint8Array(O.GW * O.GH), li = (x, y) => (y - Y0) * GW + (x - X0), inG = (x, y) => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
    const setA = (x, y) => {
      if (inG(x, y)) al[li(x, y)] = 1;
    }, isA = (x, y) => inG(x, y) && al[li(x, y)] === 1;
    const inE = (x, y) => x >= E.x0 && x <= E.x1 && y >= E.y0 && y <= E.y1;
    const rows = [];
    const hAlley = (yb, dir, lock) => {
      let off = 0, wd = g.ri(2, 3), run = g.ri(3, 7);
      const tops = [];
      for (let x = X0; x <= X1; x++) {
        if (--run <= 0) {
          run = g.ri(3, 9);
          if (g.chance(.55)) off = SX.clamp(off + (g.chance(.5) ? 1 : -1), -1, 1);
          wd = g.ri(2, 4);
        }
        const lk = lock && x >= E.x0 - 3 && x <= E.x1 + 3, o = lk ? 0 : off, w = lk ? 3 : wd;
        const t0 = dir > 0 ? yb + o : yb - o - w + 1;
        for (let k = 0; k < w; k++) setA(x, t0 + k);
        tops.push(t0);
      }
      rows.push(tops);
    };
    hAlley(E.y1 + 1, 1, true);
    hAlley(E.y0 - 1, -1, true);
    for (let yb = E.y1 + 4 + g.ri(7, 11); yb < Y1; yb += g.ri(9, 14)) hAlley(yb, 1, false);
    for (let yb = E.y0 - 4 - g.ri(7, 11); yb > Y0; yb -= g.ri(9, 14)) hAlley(yb, -1, false);
    for (let x = X0 + g.ri(3, 10); x < X1; x += g.ri(9, 17)) {
      let o = 0, wd = g.ri(1, 3), run = g.ri(3, 6);
      for (let y = Y0; y <= Y1; y++) {
        if (--run <= 0) {
          run = g.ri(3, 7);
          if (g.chance(.5)) o = SX.clamp(o + (g.chance(.5) ? 1 : -1), -1, 1);
        }
        for (let k = 0; k < wd; k++) {
          const xx = x + o + k;
          if (!inE(xx, y)) setA(xx, y);
        }
      }
    }
    if (g.chance(.6)) {
      const sx = g.chance(.5) ? E.x0 - 1 : E.x1 + 1;
      for (let y = E.y0; y <= E.y1; y++) setA(sx, y);
    }
    const free = (x, y) => inG(x, y) && !al[li(x, y)] && !inE(x, y) && O.lot[gidx(O, x, y)] < 0 && !bldAt(O, x, y);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      if (!free(x, y)) continue;
      let w = 0;
      const wm = g.ri(3, 10);
      while (w < wm && free(x + w, y)) w++;
      let hh = 0;
      const hm = g.ri(4, 11);
      while (hh < hm) {
        let ok = true;
        for (let k = 0; k < w; k++) if (!free(x + k, y + hh)) {
          ok = false;
          break;
        }
        if (!ok) break;
        hh++;
      }
      if (w < 3 || hh < 3) {
        setA(x, y);
        continue;
      }
      if (g.chance(.07)) {
        fill(O, x, y, x + w - 1, y + hh - 1, K.LOT);
        for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + w; xx++) setA(xx, yy);
        continue;
      }
      addLot(O, g, x, y, x + w - 1, y + hh - 1, {
        face: Math.min(hh - 2, g.chance(.45) ? 1 : g.chance(.6) ? 2 : 3),
        shop: g.chance(.06),
        lit: g.r(.05, .15)
      });
      if (g.chance(.35)) for (let yy = y; yy < y + hh; yy++) setA(x + w, yy);
    }
    const AL = new Set([ K.ALLEY ]), LT = new Set([ K.LOT, K.ALLEY ]);
    O.wires = [];
    for (const tops of rows) {
      let last = null;
      for (let x = X0 + g.ri(2, 8); x <= X1 - 1; x += g.ri(11, 17)) {
        const y = tops[x - X0];
        if (y == null) continue;
        const p = put(O, "pole", x, y, g.i(4), AL);
        if (!p) {
          continue;
        }
        lamp(O, F, x + .8, y + .6, 5, [ 255, 214, 150 ], .6);
        const wx = x * TS, wy = y * TS - 104 + 9;
        if (last) {
          O.wires.push([ last[0] + 4, last[1], wx + 4, wy, 10 ]);
          O.wires.push([ last[0] + 28, last[1] + 1, wx + 28, wy + 1, 12 ]);
        }
        last = [ wx, wy ];
      }
    }
    const tp = (kind, n, ok) => {
      for (let k = 0, t = 0; k < n && t < n * 40; t++) if (put(O, typeof kind === "function" ? kind() : kind, X0 + g.i(O.GW), Y0 + g.i(O.GH), g.i(6), ok)) k++;
    };
    tp(() => vPick(g, V_LOT), 18, LT);
    jitterCars(O, g);
    tp("bicycle", 34, AL);
    tp("trashPile", 22, AL);
    tp("binMetal", 14, AL);
    tp("trash", 14, AL);
    tp(() => g.chance(.5) ? "scooter" : "motorbike", 2, AL);
    tp("boxes", 10, AL);
    tp("drum", 5, AL);
    for (const L of O.lots) {
      if (L.dead) continue;
      roofProps(O, F, g, L, g.ri(1, 3));
      if (g.chance(.4)) put(O, "tubGarden", L.x0 + g.i(L.x1 - L.x0 + 1), L.y1 + 1, g.i(4), AL);
      if (g.chance(.3)) put(O, "planter", L.x0 + g.i(L.x1 - L.x0 + 1), L.y1 + 1, g.i(4), AL);
      if (L.door >= 0 && g.chance(.45)) lamp(O, F, L.door + .5, L.y1 + 1.2, 3.2, [ 255, 205, 140 ], .45);
    }
  }
  function genStreet(O, F, P, g, two) {
    const B = O.E, fy = B.y1 + 1, X0 = O.GX, Y0 = O.GY, X1 = O.GX + O.GW - 1, Y1 = O.GY + O.GH - 1;
    const w0 = two ? fy + 1 : fy + 2, r0 = fy + 5, lane = fy + 8, r1 = fy + 11, w2 = fy + 14, opp = fy + 15;
    O.dim = two ? .22 : 0;
    fill(O, X0, Y0, X1, Y1, K.ALLEY);
    fill(O, X0, w0, X1, fy + 4, K.WALK);
    fill(O, X0, r0, X1, r1, K.ROAD);
    fill(O, X0, lane, X1, lane, K.LANE);
    fill(O, X0, r1 + 1, X1, w2, K.WALK);
    for (let x = X0; x <= X1; x++) {
      O.v[gidx(O, x, fy + 4)] |= 1;
      O.v[gidx(O, x, r1 + 1)] |= 2;
    }
    const cw0 = B.x0 - 6, cw1 = B.x0 - 2;
    fill(O, cw0, r0, cw1, r1, K.CROSS);
    if (two) {
      fill(O, B.x0, fy, B.x1, fy, K.AWN);
      fill(O, B.x0, B.y0, B.x1, B.y1, K.SLAB);
    } else fill(O, B.x0 - 1, B.y0 - 1, B.x1 + 1, fy + 1, K.LOT);
    const yb0 = B.y0 - 1, yb1 = w0 - 1, so = {
      face: 2,
      shop: two ? .85 : .15
    };
    rowLots(O, g, X0, B.x0 - 4, yb0, yb1, so, true);
    rowLots(O, g, B.x1 + 4, X1, yb0, yb1, so);
    for (let yb = B.y0 - 4; yb >= Y0; ) {
      const d = g.ri(8, 12);
      rowLots(O, g, X0 + g.i(4), X1, yb - d + 1, yb, {
        face: 2,
        shop: .05
      });
      yb -= d + 2;
    }
    for (let yt = opp; yt <= Y1; ) {
      const d = g.ri(8, 12);
      rowLots(O, g, X0 + g.i(4), X1, yt, yt + d - 1, {
        face: 2,
        shop: two ? .5 : .2
      });
      yt += d + 2;
    }
    const WK = new Set([ K.WALK ]), RD = new Set([ K.ROAD ]), LT = new Set([ K.LOT ]), AL = new Set([ K.ALLEY ]);
    for (let x = B.x0 + 2 - 48; x <= X1 - 1; x += 8) {
      if (x < X0 || x >= cw0 - 1 && x <= cw1 + 1) continue;
      if (put(O, "lamp", x, fy + 4, 0, WK)) {
        lamp(O, F, x + .8, fy + 4.5, 6, [ 255, 214, 150 ], .7);
        headGlow(O, x, fy + 4);
      }
      const tx = x + 4;
      if (tx >= cw0 - 1 && tx <= cw1 + 1) continue;
      if (g.chance(.65)) put(O, "tree", tx, fy + 4, g.i(4), WK); else if (g.chance(.5)) put(O, "hydrant", tx, fy + 4, 0, WK);
    }
    put(O, "roadSign", cw1 + 2, fy + 4, 0, WK);
    put(O, "roadSign", cw0 - 2, r1 + 1, 1, WK);
    for (let x = B.x0 + 6 - 50; x <= X1 - 1; x += 10) {
      if (x < X0 || x >= cw0 - 1 && x <= cw1 + 1) continue;
      if (put(O, "lamp", x, r1 + 1, 0, WK)) {
        lamp(O, F, x + .8, r1 + 1.5, 6, [ 255, 214, 150 ], .65);
        headGlow(O, x, r1 + 1);
      }
      if (g.chance(.6)) put(O, "tree", x + 5, r1 + 1, g.i(4), WK);
    }
    roadCars(O, g, r0, r1, X0, X1, 1);
    for (let x = X0; x <= X1 - 2; x++) {
      const r = g.f();
      if (r < .03) put(O, "bicycle", x, w0, g.i(4), WK); else if (r < .08) put(O, g.chance(.5) ? "binMetal" : "trash", x, w0, g.i(4), WK); else if (r < .095) put(O, "bench", x, fy + 3, 0, WK); else if (r < .105) put(O, "cone", x, r0, 0, RD); else if (r < .12) put(O, g.chance(.5) ? "boxes" : "trash", x, w2 - 1, g.i(4), WK);
    }
    if (!two) {
      for (let x = B.x0 - 1; x <= B.x1 + 1; x++) {
        const r = g.f();
        if (r < .18) put(O, "planter", x, fy + 1, g.i(4), LT); else if (r < .3) put(O, "binMetal", x, fy + 1, g.i(4), LT); else if (r < .36) put(O, "bicycle", x, fy + 1, g.i(4), LT);
      }
    }
    for (let k = 0; k < 140; k++) {
      const x = X0 + g.i(O.GW), y = Y0 + g.i(O.GH), r = g.f();
      put(O, r < .35 ? "binMetal" : r < .6 ? "trash" : r < .75 ? "boxes" : r < .88 ? "drum" : r < .98 ? "bicycle" : r < .99 ? "motorbike" : "scooter", x, y, g.i(4), AL);
    }
    for (const L of O.lots) {
      roofProps(O, F, g, L, g.ri(1, 3));
      if (L.door >= 0 && g.chance(.45)) lamp(O, F, L.door + .5, L.y1 + 1.2, 3.2, [ 255, 205, 140 ], .45);
      if (L.shop && Math.abs((L.x0 + L.x1) / 2 - (B.x0 + B.x1) / 2) < 40) lamp(O, F, (L.x0 + L.x1 + 1) / 2, L.y1 + 1.3, 4, A.hexRgb(L.awn[0]).map(c => Math.min(255, c + 70)), .35);
    }
    if (two) for (let x = B.x0 + 1; x < B.x1; x += 5) lamp(O, F, x + .5, fy + 1.2, 3, [ 255, 210, 150 ], .4);
  }
  function headGlow(O, x, y) {
    const X = x * TS, Y = y * TS - 84;
    O.heads.push({
      x: X + 17,
      y: Y + 5,
      w: 17,
      h: 9,
      c: "rgba(255,220,150,0.2)"
    }, {
      x: X + 21,
      y: Y + 8,
      w: 9,
      h: 2,
      c: "#fff4c8"
    });
  }
  function genRoofs(O, F, P, g) {
    const B = O.B, X0 = O.GX, Y0 = O.GY, X1 = O.GX + O.GW - 1, Y1 = O.GY + O.GH - 1;
    O.dim = .3;
    fill(O, X0, Y0, X1, Y1, K.ALLEY);
    const rw0 = B.y1 + 5, r0 = rw0 + 1, r1 = rw0 + 3, rw1 = rw0 + 4;
    for (let yb = Y0; yb <= Y1; ) {
      const d = g.ri(7, 11), y1 = Math.min(Y1, yb + d - 1);
      if (y1 >= rw0 - 1 && yb <= rw1 + 1) {
        if (yb < rw0 - 2) rowLots(O, g, X0 + g.i(3), X1, yb, rw0 - 2, {
          face: 1,
          a0: 1,
          a1: 2,
          lit: g.r(.08, .15)
        });
        yb = rw1 + 2;
        continue;
      }
      rowLots(O, g, X0 + g.i(3), X1, yb, y1, {
        face: 1,
        a0: 1,
        a1: 2,
        lit: g.r(.08, .15)
      });
      yb += d + g.ri(1, 2);
    }
    clearLots(O, B.x0 - 3, B.y0 - 3, B.x1 + 3, B.y1 + 4, K.ALLEY);
    fill(O, B.x0 - 3, B.y0 - 3, B.x1 + 3, B.y1 + 4, K.ALLEY);
    clearLots(O, X0, rw0, X1, rw1, K.ALLEY);
    fill(O, X0, rw0, X1, rw0, K.WALK);
    fill(O, X0, r0, X1, r1, K.ROAD);
    fill(O, X0, r0 + 1, X1, r0 + 1, K.LANE);
    fill(O, X0, rw1, X1, rw1, K.WALK);
    for (let x = X0; x <= X1; x++) {
      O.v[gidx(O, x, rw0)] |= 1;
      O.v[gidx(O, x, rw1)] |= 2;
    }
    const own = addLot(O, g, B.x0 - 2, B.y0 - 2, B.x1 + 2, B.y1 + 3, {
      face: 1,
      own: true,
      roof: "#4d7a52",
      wall: "#b4ab98",
      lit: .12
    });
    own.door = -1;
    {
      const WK = new Set([ K.WALK ]), RD = new Set([ K.ROAD ]), AL = new Set([ K.ALLEY ]);
      for (let x = X0 + 2 + g.i(4); x <= X1 - 1; x += 9 + g.i(3)) if (put(O, "lamp", x, rw0, 0, WK)) {
        lamp(O, F, x + .8, rw0 + .5, 6, [ 255, 214, 150 ], .6);
        headGlow(O, x, rw0);
      }
      roadCars(O, g, r0, r1, X0, X1, .6);
      for (let k = 0, t = 0; k < 120 && t < 1200; t++) {
        const r = g.f();
        if (put(O, r < .3 ? "trash" : r < .5 ? "binMetal" : r < .62 ? "boxes" : r < .7 ? "bicycle" : r < .71 ? "motorbike" : r < .72 ? "scooter" : r < .8 ? "drum" : r < .86 ? vPick(g, V_LOT) : "planter", X0 + g.i(O.GW), Y0 + g.i(O.GH), g.i(6), AL)) k++;
      }
      jitterCars(O, g);
    }
    const GR = new Set([ K.GREEN ]);
    for (let k = 0, t = 0; k < 7 && t < 400; t++) {
      const kind = g.pick([ "planter", "jangdok", "drum", "garden", "planter", "boxes", "binMetal" ]);
      if (putNear(O, kind, own.x0 + 1 + g.i(own.x1 - own.x0 - 1), own.y0 + 1 + g.i(own.y1 - own.face - own.y0 - 1), g.i(6), GR, own)) k++;
    }
    if (!O.cfg && P.entry) {
      const ex = B.x0 + 1 + P.entry.x, ey = B.y0 + 1 + P.entry.y;
      O.land = new Uint8Array(F.W * F.H);
      for (let y = ey + 1; y <= Math.min(F.H - 1, ey + 2); y++) for (let x = ex; x <= ex + 1; x++) if (F.in(x, y)) O.land[F.i(x, y)] = 1;
      O.props.push({
        kind: "doormat",
        x: ex,
        y: ey + 1,
        v: g.i(4),
        fw: 2,
        fh: 1,
        up: 0,
        cust: true,
        lo: true
      });
    }
    for (const L of O.lots) if (!L.own && !L.dead) roofProps(O, F, g, L, g.ri(2, 5));
  }
  const RF = 170, RW = 320, RN = 224, RH = RF + RW + RN, SEGW = 512, MOVE_LN = [ 1, 6 ];
  const mixC = (a, b, t) => {
    let s = "#";
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < 7; i += 2) {
      const p = parseInt(a.slice(i, i + 2), 16), q = parseInt(b.slice(i, i + 2), 16);
      s += Math.round(p + (q - p) * t).toString(16).padStart(2, "0");
    }
    return s;
  };
  const FACW = {
    play: [ 100, 130 ],
    shop: [ 112, 140 ],
    bball: [ 84, 90 ],
    futsal: [ 112, 118 ],
    pool: [ 224, 240 ],
    lot: [ 120, 200 ],
    lawn: [ 80, 150 ],
    wc: [ 40, 46 ],
    bike: [ 60, 72 ],
    tennis: [ 100, 106 ],
    stage: [ 116, 130 ],
    camp: [ 130, 170 ],
    mil: [ 110, 140 ]
  };
  function facList(g, u0, u1, s, near) {
    const KN = [ "play", "shop", "bball", "futsal", "pool", "lot", "lawn", "wc", "bike", "tennis", "stage", "lawn", "lot", "play" ].concat(near ? [ "camp", "mil" ] : []);
    const L = [];
    let u = u0 - g.i(160), a = "", b = "";
    while (u < u1) {
      let k = g.pick(KN);
      for (let t = 0; t < 10 && (k === a || k === b); t++) k = g.pick(KN);
      b = a;
      a = k;
      const w = g.ri(FACW[k][0], FACW[k][1]);
      L.push({
        u,
        w,
        kind: k,
        s: g.i(1e9)
      });
      u += Math.round((w + g.ri(8, 30)) * s);
    }
    return L;
  }
  function genHigh(O, F, P, ox, oy, g) {
    const X0 = O.GX, Y0 = O.GY, X1 = O.GX + O.GW - 1, Y1 = O.GY + O.GH - 1, rv = oy + P.river.y1, fx0 = ox - 1, U0 = X0 * TS, NW = O.GW * TS;
    fill(O, X0, Y0, X1, Y1, K.CITY);
    const SX0 = (ox - 1) * TS, SX1 = (ox + P.w + 1) * TS, YN0 = (rv - 6) * TS, rt = O.rt = new Int16Array(NW);
    for (let c = 0; c < NW; c++) {
      const wx = U0 + c + .5, o = wx < SX0 ? SX0 - wx : wx > SX1 ? wx - SX1 : 0;
      rt[c] = Math.round(YN0 + (o ? (wx < SX0 ? .42 : -.3) * o * o / (o + 220) : 0)) - RF - RW;
    }
    O.rseg = new Map;
    O.nbk = new Map;
    const rAt = (x, y) => y * TS + 16 - rt[x * TS + 16 - U0], cx = ox + (P.w >> 1), br = O.brg = [ cx - 21, cx + 20 ], isBr = x => br.some(b => x >= b && x <= b + 1);
    const Bw = O.Bw, T = O.T = {
      x0: Bw.x0 * TS,
      x1: (Bw.x1 + 1) * TS,
      y0: ((O.botY != null ? O.botY : Bw.y1) + 1) * TS,
      N: 40,
      a: .2
    };
    T.D = 58 * (1 + T.a) / T.a;
    T.vy = T.y0 + T.D;
    T.cx = (T.x0 + T.x1) / 2;
    T.fy = k => T.vy - T.D / (1 + T.a * k);
    T.yb = T.fy(T.N);
    T.wc = [ ...O.wcols || [] ].map(x => x * TS + 16);
    T.pil = [];
    for (let x = T.x0 + 4 * TS; x < T.x1 - 2 * TS; x += 4 * TS) T.pil.push(x);
    T.pal = [];
    for (let k = 0; k <= T.N; k++) {
      const t = Math.pow(k / T.N, .75);
      T.pal.push({
        wall: mixC("#bcb6a8", "#2e3644", t * .82),
        slab: mixC("#d8d2c4", "#3a4250", t * .82),
        lt: mixC("#e8e4d8", "#4a5260", t * .8),
        dk: mixC("#6a6458", "#1c222c", t),
        pil: mixC("#a49e90", "#2a323e", t * .85),
        gl: mixC("#34465a", "#1e2632", t),
        fr: mixC("#6e6a62", "#262c36", t),
        hl: mixC("#7a98b0", "#2a3442", t)
      });
    }
    T.palD = [];
    for (let k = 0; k <= T.N; k++) {
      const t = Math.pow(k / T.N, .75);
      T.palD.push({
        wall: mixC("#bcb6a8", "#8c96a2", t * .72),
        slab: mixC("#d8d2c4", "#9ea6b2", t * .72),
        lt: mixC("#e8e4d8", "#aab2be", t * .7),
        dk: mixC("#6a6458", "#6c7582", t * .8),
        pil: mixC("#a49e90", "#86909c", t * .75),
        gl: mixC("#5a7a96", "#7e8c9c", t),
        fr: mixC("#6e6a62", "#76808c", t),
        hl: mixC("#a8c4d8", "#8e9aa8", t)
      });
    }
    const inT = (x, y) => {
      if (y < T.y0 || y >= T.yb) return false;
      const s = (T.vy - y) / T.D;
      return x >= T.cx - (T.cx - T.x0) * s && x < T.cx + (T.x1 - T.cx) * s;
    };
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const i = gidx(O, x, y);
      if (O.bld[i]) continue;
      const r = rAt(x, y);
      O.k[i] = inT(x * TS + 16, y * TS + 16) ? K.TOWER : r < 0 ? K.FAR : r < RH && isBr(x) ? K.BRIDGE : r < RF ? K.BANK : r < RF + RW ? K.WATER : r < RH ? K.DUN : K.CITY;
    }
    const mx = fx0 + 6, my = Math.floor(rt[mx * TS + 16 - U0] / TS) - 13;
    for (let y = my - 10; y <= my + 10; y++) for (let x = mx - 21; x <= mx + 21; x++) {
      const dx = (x - mx) / 19, dy = (y - my) / 8.5;
      if (dx * dx + dy * dy > 1 + .12 * Math.sin(x * .7 + y * 1.3)) continue;
      const i = gidx(O, x, y);
      if (i < 0 || O.k[i] !== K.FAR) continue;
      O.v[i] = 4;
    }
    for (let y = my - 3; y <= my; y++) {
      const i = gidx(O, mx, y);
      if (i >= 0 && O.k[i] === K.FAR) O.v[i] = y === my - 3 ? 6 : 5;
    }
    O.mt = {
      x: mx,
      y: my
    };
    const roads = (n, lo, hi, bk) => {
      const r = new Uint8Array(n);
      for (let i = g.i(5), k = 0; i < n; k++) {
        const big = k % 3 === bk;
        r[i] = big ? 2 : 1;
        if (big && i + 1 < n) r[i + 1] = 3;
        i += (big ? 2 : 1) + g.ri(lo, hi);
      }
      return r;
    };
    const force = (r, a) => {
      if (a < 0 || a >= r.length) return;
      for (let k = a - 1; k >= 0 && r[k]; k--) r[k] = 0;
      for (let k = a + 2; k < r.length && r[k]; k++) r[k] = 0;
      r[a] = 2;
      if (a + 1 < r.length) r[a + 1] = 3;
    };
    const blocks = r => {
      const n = r.length, b0 = new Int16Array(n), b1 = new Int16Array(n), bi = new Int16Array(n);
      let s = 0, id = 0;
      for (let i = 0; i <= n; i++) if (i === n || r[i]) {
        for (let k = s; k < i; k++) {
          b0[k] = s;
          b1[k] = i - 1;
          bi[k] = id;
        }
        id++;
        s = i + 1;
      }
      return [ b0, b1, bi ];
    };
    O.rcol = roads(O.GW, 6, 11, 2);
    O.rrow = roads(O.GH, 6, 11, 2);
    for (const b of br) force(O.rcol, b - X0);
    O.cb = blocks(O.rcol);
    O.rb = blocks(O.rrow);
    O.ncol = roads(O.GW, 9, 15, 1);
    O.nrow = roads(O.GH, 7, 12, 1);
    const bcx = Math.floor(T.cx / TS) - X0, bby = Math.floor(T.yb / TS) - Y0;
    for (let k = bcx - 7; k <= bcx + 7; k++) if (k >= 0 && k < O.GW) O.ncol[k] = 0;
    for (let k = bby - 6; k <= bby + 6; k++) if (k >= 0 && k < O.GH) O.nrow[k] = 0;
    force(O.nrow, bby + 7);
    for (const b of br) force(O.ncol, b - X0);
    O.ncb = blocks(O.ncol);
    O.nrb = blocks(O.nrow);
    O.facN = facList(g, U0, U0 + NW, 1, true);
    O.facF = facList(g, U0, U0 + NW, .62, false);
    O.fires = [];
    for (let t = 0; t < 500 && O.fires.length < 6; t++) {
      const x = X0 + 4 + g.i(O.GW - 8), y = Y0 + 4 + g.i(O.GH - 8);
      if (kAt(O, x, y) !== K.CITY || O.ncol[x - X0] || O.nrow[y - Y0] || Math.abs(x - cx) < 9 && y < bby + Y0 + 5 || O.fires.some(f => Math.abs(f.tx - x) + Math.abs(f.ty - y) < 14)) continue;
      O.fires.push({
        tx: x,
        ty: y,
        x: x * TS + 4 + g.i(24),
        y: y * TS + 4 + g.i(24),
        r: g.ri(8, 16),
        s: g.i(1e9)
      });
      lamp(O, F, x + .5, y + .5, 3.2, [ 255, 140, 60 ], .3);
      F.lamps[F.lamps.length - 1].day = 1;
    }
    for (let x = X0 + md(-X0, 8); x <= X1; x += 8) {
      const t = rt[x * TS + 16 - U0];
      lamp(O, F, x + .5, (t + 149) / TS, 1.8, [ 255, 214, 150 ], .3);
      lamp(O, F, x + 4.5, (t + 37) / TS, 2.2, [ 255, 200, 140 ], .26);
    }
    for (const b of br) for (let r = 16; r < RF + RW * .55; r += 48) {
      const t = rt[b * TS + 32 - U0];
      lamp(O, F, b + .1, (t + r) / TS, 1.4, [ 255, 214, 150 ], .28);
      lamp(O, F, b + 1.9, (t + r) / TS, 1.4, [ 255, 214, 150 ], .28);
    }
  }
  function checker(P, tx, ty, px, py) {
    P.r(px, py, TS, TS, tx + ty & 1 ? "#0b0d11" : "#0c0e12");
    if (md(tx * 7 + ty * 13, 23) === 0) P.r(px + 14, py + 14, 2, 2, "#3a3320");
  }
  const roofBase = (col, v) => A.cached("hoRf:" + col + ":" + v, TS, TS, P => {
    const R = A.ramp(col), g = new SX.Rng(v * 977 + 31);
    P.r(0, 0, TS, TS, col).noise(0, 0, TS, TS, [ R[2], R[4], A.shade(col, -.08) ], .16, g);
    if (v === 1) P.oval(8 + g.i(16), 8 + g.i(16), 5 + g.i(4), 3, A.shade(col, -.18));
    if (v === 2) {
      const x = 4 + g.i(20);
      P.line(x, 2, x + 6 + g.i(6), 30, R[1]);
    }
    if (v === 3) P.oval(10 + g.i(12), 10 + g.i(12), 6, 3, A.shade(col, .1));
  });
  function gore(P, O, tx, ty, px, py, hall) {
    const q = new SX.Rng(H32(tx, ty, O.seed + 131)), r = q.f(), s = hall ? .6 : 1;
    if (r < .022 * s) {
      const x = px + 7 + q.i(17), y = py + 9 + q.i(14), n = 10 + q.i(12);
      P.oval(x, y, 4 + q.i(4), 2 + q.i(2), BLD[2]).oval(x - 1, y - 1, 2 + q.i(2), 1, BLD[1]);
      for (let k = 0; k < n; k++) {
        const a = q.f() * 6.283, d = 4 + q.f() * 9;
        P.r(x + Math.cos(a) * d, y + Math.sin(a) * d * .6, 1 + q.i(2), 1, q.pick(BLD));
      }
    } else if (r < .034 * s) {
      const vt = q.chance(.5), o = 8 + q.i(12);
      for (let t = 0; t < TS; t += 1 + q.i(2)) {
        if (q.chance(.18)) continue;
        const c = q.pick(BLD), ww = q.chance(.3) ? 2 : 1;
        if (vt) P.r(px + o + q.i(2), py + t, ww, 1, c).p(px + o + 5 + q.i(2), py + t, c); else P.r(px + t, py + o + q.i(2), 1, ww, c).p(px + t, py + o + 5 + q.i(2), c);
      }
    } else if (r < .05 * s) {
      let x = px + 4 + q.i(20), y = py + 6 + q.i(16);
      for (let k = 0, n = 3 + q.i(4); k < n && y < py + TS - 2; k++) {
        P.r(x, y, 2, 2, q.pick(BLD));
        x += q.i(5) - 2;
        y += 2 + q.i(3);
      }
    }
  }
  function tile(P, O, F, tx, ty, px, py, glow) {
    tile0(P, O, F, tx, ty, px, py, glow);
    if (glow || !O.sh) return;
    const gi = gidx(O, tx, ty);
    if (gi >= 0 && O.sh[gi]) P.r(px, py, TS, TS, O.sh[gi] >= 2 ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.3)");
  }
  function tile0(P, O, F, tx, ty, px, py, glow) {
    const gi = gidx(O, tx, ty);
    if (O.kind === "dark" || gi < 0) {
      if (!glow) checker(P, tx, ty, px, py);
      return;
    }
    const k = O.k[gi], v = O.v[gi], g = new SX.Rng(H32(tx, ty, O.seed)), X = P.x;
    const fl = (fs, tint) => X.drawImage(A.floorCached(fs, tx, ty, tx * 73856093 ^ ty * 19349663, tint), px, py);
    const mark = (name, x, y) => {
      const M = SX.decoHub && SX.decoHub.MARK && SX.decoHub.MARK[name];
      if (M) M.d(P, x, y, g);
    };
    const obj = (name, x, y) => {
      const c = SX.decoHub && SX.decoHub.objCanvas ? SX.decoHub.objCanvas(name, g.i(4)) : null;
      if (c) X.drawImage(c, c.width <= TS ? Math.min(x, px + TS - c.width) : x, c.height <= TS ? Math.min(y, py + TS - c.height) : y);
    };
    switch (k) {
     case K.NONE:
      if (!glow) checker(P, tx, ty, px, py);
      return;

     case K.LOT:
      if (glow) return;
      fl(A.FS.CONC, "#77736a");
      if (g.chance(.12)) mark(g.pick([ "stain", "crack", "puddleSm" ]), px + 4, py + 8);
      if (g.chance(.06)) obj(g.pick([ "leaf", "butt", "can", "paperBall" ]), px + 6 + g.i(16), py + 8 + g.i(14));
      {
        const ed = (dx, dy) => {
          const kk = kAt(O, tx + dx, ty + dy);
          return kk !== K.LOT && !bldAt(O, tx + dx, ty + dy);
        };
        const wall = (x, y, w, h) => P.r(x, y, w, h, "#7a4e3c").r(x, y, w, 1, "#a8705a").r(x, y + h - 1, w, 1, "#4a2e22");
        if (ed(0, -1)) wall(px, py, TS, 6);
        if (ed(-1, 0)) wall(px, py, 6, TS);
        if (ed(1, 0)) wall(px + TS - 6, py, 6, TS);
        if (ed(0, 1) && !bldAt(O, tx, ty - 1) && !bldAt(O, tx - 1, ty - 1) && !bldAt(O, tx + 1, ty - 1)) wall(px, py + TS - 6, TS, 6);
      }
      break;

     case K.WALK:
      if (glow) return;
      fl(A.FS.WALK);
      if (v & 1) P.r(px, py + TS - 5, TS, 5, "#8e8c86").r(px, py + TS - 5, TS, 1, "#b4b2aa").r(px, py + TS - 1, TS, 1, "#3a3a38");
      if (v & 2) P.r(px, py, TS, 5, "#8e8c86").r(px, py, TS, 1, "#3a3a38").r(px, py + 4, TS, 1, "#b4b2aa");
      if (g.chance(.1)) mark(g.pick([ "stain", "crack", "scuff", "puddleSm", "drips" ]), px + 4, py + 8);
      if (g.chance(.07)) obj(g.pick([ "butt", "can", "paperBall", "leaf", "receipt", "bottle" ]), px + 4 + g.i(18), py + 8 + g.i(14));
      break;

     case K.ROAD:
     case K.LANE:
     case K.CROSS:
      if (glow) return;
      fl(k === K.LANE ? A.FS.LANE : A.FS.ASPH);
      if (k === K.CROSS) for (let y = 3; y < TS; y += 11) {
        P.r(px + 1, py + y, TS - 2, 6, "#c5c1b5").r(px + 1, py + y, TS - 2, 1, "#dcd8cc");
        for (let s = 0; s < 6; s++) P.p(px + 1 + g.i(TS - 2), py + y + g.i(6), "#8a8a86");
      } else if (g.chance(.07)) mark(g.pick([ "manhole", "oil", "crack", "puddleSm", "drain" ]), px + 3, py + 8);
      break;

     case K.ALLEY:
      if (glow) return;
      fl(A.FS.CONC, "#5c5a54");
      if (g.chance(.14)) mark(g.pick([ "stain", "crack", "puddle", "oil", "drain", "mold" ]), px + 2, py + 8);
      if (g.chance(.1)) obj(g.pick([ "can", "bottle", "paperBall", "cardboard", "news", "butt", "trashBag", "brick" ]), px + 4 + g.i(14), py + 6 + g.i(12));
      if (kAt(O, tx, ty - 1) === K.FACE) P.r(px, py, TS, 6, "rgba(0,0,0,0.3)");
      break;

     case K.ROOF:
     case K.GREEN:
      {
        if (glow) return;
        const L = O.lots[O.lot[gi]], col = L ? L.roof : "#4d7a52";
        X.drawImage(roofBase(col, g.i(5)), px, py);
        if (g.chance(.05)) P.r(px + 10, py + 10, 10, 8, "#2a2c2a").r(px + 11, py + 11, 8, 1, "#4a4c49").r(px + 11, py + 14, 8, 1, "#4a4c49");
        if (g.chance(.06)) mark(g.pick([ "stain", "puddleSm", "crack" ]), px + 4, py + 8);
        if (g.chance(.08)) obj(g.pick([ "leaf", "leaf", "can", "brick", "bottle", "paperBall", "butt" ]), px + 6 + g.i(16), py + 8 + g.i(14));
        const same = (dx, dy) => {
          const kk = kAt(O, tx + dx, ty + dy);
          return lotAt(O, tx + dx, ty + dy) === O.lot[gi] && (kk === K.ROOF || kk === K.GREEN) || k === K.GREEN && bldAt(O, tx + dx, ty + dy);
        };
        const own = k === K.GREEN, rim = own ? "#9c998f" : A.shade(col, .2), rimD = own ? "#4a4844" : A.shade(col, -.45), rimL = own ? "#c8c4b8" : A.shade(col, .4), w = own ? 6 : 4;
        if (!same(0, -1)) P.r(px, py, TS, w, rim).r(px, py, TS, 1, rimD).r(px, py + 1, TS, 1, rimL).r(px, py + w, TS, 1, "rgba(0,0,0,0.2)");
        if (!same(0, 1)) P.r(px, py + TS - w, TS, w, rim).r(px, py + TS - w, TS, 1, rimL).r(px, py + TS - 1, TS, 1, rimD);
        if (!same(-1, 0)) P.r(px, py, w, TS, rim).r(px, py, 1, TS, rimD).r(px + 1, py, 1, TS, rimL).r(px + w, py, 1, TS, "rgba(0,0,0,0.15)");
        if (!same(1, 0)) P.r(px + TS - w, py, w, TS, rim).r(px + TS - 1, py, 1, TS, rimD);
        break;
      }

     case K.FACE:
      {
        const L = O.lots[O.lot[gi]];
        if (!L) return;
        const top = v === L.face - 1, R = A.ramp(L.wall), q = new SX.Rng(H32(tx, ty, O.seed + 77));
        if (!glow) {
          P.r(px, py, TS, TS, L.wall).noise(px, py, TS, TS, [ R[2], R[4] ], .08, g);
          if (top) P.r(px, py, TS, 4, "rgba(0,0,0,0.38)"); else P.r(px, py, TS, 1, R[1]);
          if (v === 0) P.r(px, py + TS - 2, TS, 2, "rgba(0,0,0,0.45)");
          if (lotAt(O, tx - 1, ty) !== L.id) P.r(px, py, 2, TS, R[4]);
          if (lotAt(O, tx + 1, ty) !== L.id) P.r(px + TS - 2, py, 2, TS, R[1]);
        }
        if (v === 0 && L.shop) {
          const open = q.chance(.3), signOn = q.chance(.6), sc = L.awn[0];
          if (!glow) {
            P.r(px, py + 2, TS, 8, sc).r(px, py + 2, TS, 1, A.shade(sc, .3)).r(px, py + 9, TS, 1, A.shade(sc, -.4));
            for (let s = 0; s < 4; s++) P.r(px + 4 + s * 7, py + 4, 4, 4, L.awn[1]);
            if (open) P.r(px + 2, py + 12, TS - 4, TS - 14, "#f0c878").r(px + 2, py + 12, TS - 4, 1, "#3a3c40").r(px + 15, py + 12, 2, TS - 14, "#3a3c40"); else {
              P.r(px + 1, py + 12, TS - 2, TS - 14, "#7a7c80");
              for (let y = py + 13; y < py + TS - 2; y += 3) P.r(px + 1, y, TS - 2, 1, "#5a5c60");
              P.r(px + 1, py + 12, TS - 2, 1, "#3a3c40");
            }
          } else {
            if (signOn) {
              P.r(px, py + 2, TS, 8, A.shade(sc, .25));
              for (let s = 0; s < 4; s++) P.r(px + 4 + s * 7, py + 4, 4, 4, "#fffaf0");
              P.r(px, py + 10, TS, 2, "rgba(255,230,190,0.2)");
            }
            if (open) P.r(px + 2, py + 12, TS - 4, TS - 14, "#f6d490").r(px + 15, py + 12, 2, TS - 14, "#3a3c40");
          }
          return;
        }
        if (v === 0 && L.door === tx) {
          const on = H32(L.id, 3, O.seed) % 100 < 45;
          if (!glow) {
            P.r(px + 8, py + 8, 16, TS - 10, "#3a2e24").r(px + 9, py + 9, 14, TS - 12, "#5a4634").r(px + 9, py + 9, 14, 1, "#7a6248").p(px + 20, py + 20, "#c8b060").r(px + 13, py + 4, 6, 3, on && !O.day ? "#e8c890" : "#4a4844");
          } else if (on) P.r(px + 13, py + 4, 6, 3, "#fff0c8").r(px + 11, py + 2, 10, 7, "rgba(255,220,160,0.18)");
          return;
        }
        const lit = q.f() < L.lit && !O.day, lc = q.pick(LITC), wx = px + 7, wy = py + (top ? 8 : 6), ww = 18, wh = 14;
        if (!glow) {
          P.r(wx - 1, wy - 1, ww + 2, wh + 2, R[0]);
          P.r(wx, wy, ww, wh, lit ? lc : "#1e2632");
          P.r(wx + 8, wy, 2, wh, R[1]);
          if (lit) P.r(wx, wy, 4, wh, A.shade(lc, -.25)); else P.p(wx + 2, wy + 2, "#4a5a6a").p(wx + 12, wy + 3, "#3a4a5a");
          P.r(wx - 1, wy + wh + 1, ww + 2, 2, R[4]);
          if (!top && q.chance(.25)) P.r(px + 9, py + 24, 12, 7, "#9a9c9e").r(px + 9, py + 24, 12, 1, "#c4c6c8").r(px + 11, py + 26, 8, 3, "#5a5c60");
        } else if (lit) {
          P.r(wx - 2, wy - 2, ww + 4, wh + 4, "rgba(255,210,140,0.16)");
          P.r(wx, wy, ww, wh, lc).r(wx, wy, 4, wh, A.shade(lc, -.25)).r(wx + 8, wy, 2, wh, "#2a2a2c");
        }
        return;
      }

     case K.DEEP:
      {
        if (!glow) {
          P.r(px, py, TS, TS, "#0d0f12").noise(px, py, TS, TS, [ "#121418", "#0a0b0e" ], .2, g);
          if (kAt(O, tx, ty - 1) === K.FACE || kAt(O, tx, ty - 1) === K.ROOF) P.r(px, py, TS, 8, "rgba(0,0,0,0.4)");
          if (g.chance(.05)) {
            const c = g.pick([ "#5a2a26", "#2a3a5a", "#6a6c70", "#8a7a40", "#3a3c40" ]);
            P.r(px + 9, py + 6, 12, 20, A.shade(c, -.3)).r(px + 10, py + 7, 10, 18, c).r(px + 11, py + 10, 8, 4, "#1a2028");
          }
        }
        const q = new SX.Rng(H32(tx, ty, O.seed + 5));
        if (q.chance(.06)) {
          const x = px + 6 + q.i(18), y = py + 6 + q.i(18);
          if (glow) P.r(x - 6, y - 4, 14, 10, "rgba(255,150,60,0.12)").r(x, y, 2, 2, "#ffb060"); else P.oval(x + 1, y + 1, 9, 5, "rgba(120,70,20,0.35)");
        }
        return;
      }

     case K.AWN:
      {
        const seg = Math.floor((tx - O.E.x0) / 4), C = AWNC[md(seg + O.seed, AWNC.length)], on = md(H32(seg, 9, O.seed), 3) !== 0;
        if (glow) {
          if (on) P.r(px + 1, py + 26, TS - 2, 4, "rgba(255,214,150,0.22)");
          return;
        }
        fl(A.FS.WALK);
        P.r(px, py + 25, TS, 7, "rgba(0,0,0,0.35)");
        P.r(px, py, TS, 22, C[0]);
        for (let x = md(-tx * TS, 8); x < TS; x += 8) P.r(px + x, py, 4, 22, C[1]);
        P.r(px, py, TS, 3, "rgba(0,0,0,0.35)").r(px, py + 3, TS, 1, "rgba(255,255,255,0.15)").r(px, py + 16, TS, 6, "rgba(0,0,0,0.12)");
        for (let x = 0; x < TS; x += 8) {
          P.r(px + x, py + 22, 6, 2, C[0]).r(px + x + 1, py + 24, 4, 1, A.shade(C[0], -.3));
        }
        return;
      }

     case K.SLAB:
      {
        if (glow) return;
        P.r(px, py, TS, TS, "#5c5b56").noise(px, py, TS, TS, [ "#52514c", "#66655f" ], .14, g);
        if (g.chance(.12)) mark(g.pick([ "stain", "puddleSm", "crack" ]), px + 4, py + 8);
        if (g.chance(.06)) obj(g.pick([ "can", "brick", "scrap", "butt" ]), px + 6 + g.i(14), py + 8 + g.i(12));
        if (!bldAt(O, tx, ty - 1) && kAt(O, tx, ty - 1) !== K.SLAB) P.r(px, py, TS, 3, "#7a7872");
        return;
      }

     case K.CEIL:
     case K.EARTH:
      if (!glow) checker(P, tx, ty, px, py);
      return;

     case K.HALL:
      if (!glow) {
        hallTile(P, O, F, tx, ty, px, py, g, fl, mark, obj);
        gore(P, O, tx, ty, px, py, true);
      }
      return;

     case K.WATER:
      if (O.rt) {
        hiTile(P, O, F, tx, ty, px, py, glow, g, k, v);
        return;
      }
      if (glow) {
        waterGlow(P, O, tx, ty, px, py);
        return;
      }
      fl(A.FS.WATER);
      return;

     case K.GRASS:
      if (glow) return;
      fl(A.FS.GRASS);
      return;

     case K.BANK:
      if (O.rt) {
        hiTile(P, O, F, tx, ty, px, py, glow, g, k, v);
        return;
      }
      if (glow) return;
      fl(A.FS.WALK);
      return;

     case K.DUN:
     case K.BRIDGE:
     case K.TOWER:
     case K.CITY:
     case K.FAR:
      if (O.rt) hiTile(P, O, F, tx, ty, px, py, glow, g, k, v); else if (!glow) checker(P, tx, ty, px, py);
      return;
    }
    if (!glow && k !== K.AWN && GROUNDK.has(k)) gore(P, O, tx, ty, px, py, false);
    if (!glow && O.dim && GROUNDK.has(k)) P.r(px, py, TS, TS, "rgba(0,0,0," + O.dim + ")");
  }
  const HFS = {
    side2: "TILE",
    stair2: "CONC",
    goshi: "LINO",
    steps: "CONC",
    corr: "CONC",
    porch: "TILE",
    lobby: "MARBLE",
    park: "CONC",
    conc: "LOBBY",
    exit: "CONC"
  };
  const HTN = {
    stair2: "#8e8a80",
    steps: "#7a766c",
    park: "#62665f",
    corr: "#8c887e",
    exit: "#8a867c"
  };
  const OBH = n => {
    const o = SX.decoHub && SX.decoHub.OBJ && SX.decoHub.OBJ[n];
    return o ? o.h + 2 : 0;
  };
  const OBW = n => {
    const o = SX.decoHub && SX.decoHub.OBJ && SX.decoHub.OBJ[n];
    return o ? o.w + 2 : 0;
  };
  function hallTile(P, O, F, tx, ty, px, py, g, fl, mark, obj) {
    const H = O.H || {
      x0: tx,
      x1: tx,
      y0: ty,
      y1: ty,
      sty: "goshi"
    }, st = H.sty, ex = O.ex, ey = O.ey, uw = O.cfg.uw, dx = tx - ex;
    const hk = (ax, ay) => kAt(O, tx + ax, ty + ay) === K.HALL, pAt = (x, y) => F.in(x, y) && O.pm[F.i(x, y)] === 1;
    const lo = !hk(0, 1) && kAt(O, tx, ty + 1) === K.CEIL, top = !hk(0, -1), bot = !hk(0, 1);
    const ob = (n, x, by) => obj(n, x, (lo ? Math.min(by, py + 9) : by) - OBH(n));
    fl(A.FS[HFS[st]] || A.FS.CONC, HTN[st]);
    if (st === "steps") {
      for (let y = 0; y < TS; y += 8) P.r(px, py + y, TS, 1, "#4a463e").r(px, py + y + 1, TS, 1, "#9a958a").r(px, py + y + 2, TS, 1, "rgba(0,0,0,0.12)");
      for (const sd of [ -1, 1 ]) if (!hk(sd, 0)) {
        const x = sd < 0 ? px + 1 : px + TS - 4;
        P.r(x, py, 3, TS, "#6a4030").r(x, py, 1, TS, "#9a6040").r(x + 2, py, 1, TS, "#3e2418");
        for (let y = 4; y < TS; y += 10) P.r(x - 1, py + y, 5, 2, "#4a2c1e");
      }
    }
    if (st === "side2") {
      const lx = (tx - H.x0) * TS, S0 = H.y0 + 3, S1 = H.y1 - 2, F0 = 44, F1 = 50, F2 = (H.x1 - H.x0 + 1) * TS - 5;
      const seg = (a, b, fn) => {
        const s = Math.max(a, lx), e = Math.min(b, lx + TS);
        if (e > s) fn(px + s - lx, e - s);
      };
      const band = (x, w, y, a, up) => {
        P.r(x, y, w, 8, "#aaa59a");
        for (let q = md(x * 7 + y, 5); q < w; q += 5) P.p(x + q, y + 3 + (q >> 1 & 3), "#8e8a80");
        if (up) P.r(x, y, w, 2, "#cdc9bd").r(x, y + 2, w, 1, "#3e3a34"); else P.r(x, y + 6, w, 2, "#cdc9bd").r(x, y + 5, w, 1, "#3e3a34");
        for (let q = 2; q < w; q += 4) P.p(x + q, up ? y + 4 : y + 3, "#5a564e");
        P.r(x, y, w, 8, "rgba(0,0,0," + Math.min(.78, a).toFixed(2) + ")");
      };
      const rail = (x, w, y, h) => P.r(x, y, w, h, "#7a5432").r(x, y, 1, h, "#a8784a").r(x + w - 1, y, 1, h, "#4a301c");
      if (ty >= S0 && ty <= S1) {
        for (let j = 0; j < 4; j++) {
          const y = py + j * 8, kA = (ty - S0) * 4 + j, kB = (S1 - ty) * 4 + 3 - j;
          seg(0, F0, (x, w) => band(x, w, y, .04 + kA * .02, true));
          seg(F1, F2, (x, w) => band(x, w, y, .4 + kB * .024, false));
        }
        if (ty === S0) seg(F1, F2, (x, w) => P.r(x, py, w, 7, "rgba(0,0,0,0.42)"));
        seg(1, 4, (x, w) => rail(x, w, py, TS));
        seg(F2 - 4, F2 - 1, (x, w) => rail(x, w, py, TS));
        seg(F0, F1, (x, w) => {
          P.r(x, py, w, TS, "rgba(0,0,0,0.35)").r(x + 1, py, 4, TS, "#80848a").r(x + 1, py, 1, TS, "#c4c8ce").r(x + 4, py, 1, TS, "#3a3c40");
          for (let q = 2; q < TS; q += 8) P.r(x, py + q, 6, 2, "#4a4e54");
          if (ty === S1) P.r(x, py + TS - 5, 6, 5, "#4a4e54").r(x + 1, py + TS - 5, 4, 1, "#9a9ea4");
        });
      } else if (ty > S1) {
        seg(0, F2, (x, w) => {
          P.r(x, py, w, TS, "rgba(0,0,0,0.36)");
          if (g.chance(.3)) mark(g.pick([ "dust", "scuff" ]), x + 2, py + 4);
        });
      } else {
        if (ty === S0 - 1) seg(F1 - 2, F2, (x, w) => {
          P.r(x, py + TS - 5, w, 5, "#7a766c").r(x, py + TS - 5, w, 1, "#b4b0a4").r(x, py + TS - 1, w, 1, "#3a3834");
          for (let q = 0; q < w; q++) if (md(lx + x - px + q, 6) === 0) P.r(x + q, py + TS - 18, 2, 13, "#5a5e64").p(x + q, py + TS - 18, "#9a9ea4");
          P.r(x, py + TS - 20, w, 3, "#80848a").r(x, py + TS - 20, w, 1, "#c4c8ce").r(x, py + TS - 18, w, 1, "#3a3c40");
        });
        if (tx === H.x0 && (ty === ey || ty === ey + 1)) {
          const y0 = ty === ey ? py + 5 : py, h = TS - 5;
          P.r(px + 2, y0, 13, h, "#3e4434");
          for (let q = y0 + 2; q < y0 + h; q += 3) P.r(px + 3, q, 11, 1, "#2c3226");
          P.r(px + 2, y0, 1, h, "#5a6248").r(px + 14, y0, 1, h, "#262a20");
          if (ty === ey) P.r(px + 2, y0, 13, 1, "#5a6248"); else P.r(px + 2, y0 + h - 1, 13, 1, "#262a20");
        }
        if (tx === H.x0 + 1 && ty === ey + 1) obj(g.pick([ "shoes", "slippers" ]), px + 2, py + 8);
        if (tx === H.x1 && ty === H.y0 && g.chance(.7)) obj("umbLean", px + 18, py + 1);
        if (tx !== H.x0 && g.chance(.4)) obj(g.pick([ "news", "receipt", "paperBall", "leaf", "butt", "news" ]), px + 4 + g.i(16), py + 8 + g.i(12));
        if (g.chance(.3)) mark(g.pick([ "scuff", "dust", "stain" ]), px + 4 + g.i(10), py + 8 + g.i(10));
      }
      if (tx === H.x1) P.r(px + TS - 5, py, 5, TS, "#6a6660").r(px + TS - 5, py, 1, TS, "#3a3834").r(px + TS - 1, py, 1, TS, "#4a4844");
    }
    if (st === "stair2") {
      const ry = ty - H.y0, lf = !hk(-1, 0), rt = !hk(1, 0);
      if (ry >= 1) for (let y = 0; y < TS; y += 8) {
        const k = (ry - 1) * 4 + y / 8;
        P.r(px, py + y, TS, 8, "rgba(0,0,0," + Math.min(.45, .04 + k * .05).toFixed(2) + ")").r(px, py + y, TS, 2, "#b4b0a4").r(px, py + y + 2, TS, 1, "#4a463e");
        for (let x = 3; x < TS; x += 4) P.p(px + x, py + y + 1, "#7a766c");
      } else if (g.chance(.4)) mark(g.pick([ "scuff", "stain", "dust" ]), px + 6, py + 10);
      if (lf) P.r(px, py, 5, TS, "#6a6660").r(px, py, 1, TS, "#8a867e").r(px + 4, py, 1, TS, "#3a3834");
      if (rt) P.r(px + TS - 5, py, 5, TS, "#6a6660").r(px + TS - 5, py, 1, TS, "#3a3834").r(px + TS - 1, py, 1, TS, "#4a4844");
      if (ry >= 1) {
        const x = lf ? px + 6 : px + TS - 9;
        if (lf || rt) P.r(x, py, 3, TS, "#7a5432").r(x, py, 1, TS, "#a8784a").r(x + 2, py, 1, TS, "#4a301c");
      }
      if (ry === 1 && lf) {
        P.r(px + 9, py + 1, 14, 20, "#2a2c30").r(px + 10, py + 2, 12, 18, "#e8e4d8");
        for (const [y, c] of [ [ 4, "#c03a2a" ], [ 8, "#2f5a9a" ], [ 12, "#3a8a4a" ], [ 16, "#c88a28" ] ]) P.r(px + 11, py + y, 3, 2, c).r(px + 15, py + y, 6, 1, "#5a5650").r(px + 15, py + y + 1, 4, 1, "#8a867e");
      }
      if (ry === 0 && rt) P.r(px + TS - 15, py + 2, 9, 11, "#7a7e84").r(px + TS - 14, py + 3, 7, 1, "#a8acb2").r(px + TS - 14, py + 6, 7, 1, "#3a3c40").r(px + TS - 14, py + 9, 7, 1, "#3a3c40");
    }
    if (st === "park") {
      const ry = ty - H.y0, sd = dx <= -2 ? 0 : dx >= 3 ? 1 : 2;
      if (ry === 0 || ry === 3) {
        P.r(px, py + 9, TS, 3, "rgba(18,18,18,0.16)").r(px, py + 21, TS, 3, "rgba(18,18,18,0.16)");
        if (md(dx, 5) === 0) mark("arrow", px + 6, py + 12);
      } else if (sd < 2) {
        const a = sd ? md(dx - 3, 3) : md(dx + 4, 3);
        if (a === 0) P.r(px, py, 2, TS, "#d0ccc0");
        if (a === 2) P.r(px + TS - 2, py, 2, TS, "#d0ccc0");
        if (g.chance(.35)) mark(g.pick([ "oil", "stain", "oil" ]), px + 2, py + 4);
        if ((ry === 2 || ry === 5) && a === 1) P.r(px + 5, py + 2, 22, 5, "#b4b0a4").r(px + 5, py + 2, 22, 1, "#d8d4c8").r(px + 5, py + 6, 22, 1, "#4a463e").r(px + 11, py + 3, 10, 3, "#d8b020");
      } else {
        for (let y = 0; y < TS; y++) {
          const o = md(-(tx * TS + ty * TS + y), 10);
          for (let x = o; x < TS; x += 10) P.r(px + x, py + y, Math.min(3, TS - x), 1, "#b89a26");
        }
      }
      if (bot) P.r(px, py + TS - 4, TS, 4, "#3a3c40").r(px, py + TS - 4, TS, 1, "#5a5c60");
    }
    if (st === "exit") {
      const ry = ty - H.y0, n = Math.max(1, H.y1 - H.y0), lf = !hk(-1, 0), rt = !hk(1, 0);
      if (ry === 0) {
        if (dx === 0 || dx === 1) {
          P.r(px + 1, py + 1, TS - 2, TS - 2, "#c8a42a").r(px + 1, py + 1, TS - 2, 1, "#e0c050").r(px + 1, py + TS - 2, TS - 2, 1, "#7a6214");
          for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) P.r(px + 4 + a * 5, py + 4 + b * 5, 3, 3, "#e8c850").p(px + 6 + a * 5, py + 6 + b * 5, "#8a6e18");
        } else if (g.chance(.5)) mark(g.pick([ "dust", "scuff", "stain", "dust" ]), px + 6 + g.i(10), lo ? py : py + 10 + g.i(8));
        if (lf) {
          P.r(px + 12, py + 6, 11, 13, "#1a1a1e").r(px + 13, py + 7, 9, 11, "#e2b62a").r(px + 13, py + 7, 9, 1, "#f4d460").r(px + 13, py + 17, 9, 1, "#a8841a");
          A.PP.mini(P, px + 16, py + 10, "4", "#1a1a1e");
          P.r(px + 16, py + 19, 3, 8, "#5a5e64").r(px + 16, py + 19, 1, 8, "#9a9ea4").r(px + 14, py + 26, 7, 2, "#3a3c40");
        }
      } else {
        for (let y = 0; y < TS; y += 8) {
          const k = (ry - 1) * 4 + y / 8, t = Math.min(1, k / Math.max(1, n * 4 - 1));
          P.r(px, py + y, TS, 8, "rgba(240,236,224," + (.03 + t * .15).toFixed(2) + ")").r(px, py + y, TS, 1, "#3e3a34").r(px, py + y + 1, TS, 2, "#b4b0a4").r(px, py + y + 3, TS, 1, "rgba(0,0,0,0.14)");
          for (let x = 2; x < TS; x += 3) P.p(px + x, py + y + 2, "#7a766c");
        }
        if (ry === n && g.chance(.6)) mark("puddleSm", px + 6 + g.i(8), lo ? py : py + 12);
        if (g.chance(.45)) ob(g.pick([ "leaf", "leaf", "news", "receipt", "paperBall", "can", "leaf" ]), px + 4 + g.i(18), py + 10 + g.i(14));
        if (g.chance(.25)) mark(g.pick([ "dust", "scuff", "crack" ]), px + 4 + g.i(14), lo ? py : py + 6 + g.i(12));
        if (dx === 1) P.r(px - 2, py, 4, TS, "#80848a").r(px - 2, py, 1, TS, "#c4c8ce").r(px + 1, py, 1, TS, "#3a3c40");
        if (lf) P.r(px + 6, py, 3, TS, "#80848a").r(px + 6, py, 1, TS, "#c4c8ce").r(px + 8, py, 1, TS, "#3a3c40");
        if (rt) P.r(px + TS - 9, py, 3, TS, "#80848a").r(px + TS - 9, py, 1, TS, "#c4c8ce").r(px + TS - 7, py, 1, TS, "#3a3c40");
      }
      for (const sd of [ -1, 1 ]) if (sd < 0 ? lf : rt) {
        const x = sd < 0 ? px : px + TS - 5;
        P.r(x, py, 5, TS, "#b0aca2").r(sd < 0 ? x + 4 : x, py, 1, TS, "#5a5650").r(sd < 0 ? x : x + 4, py, 1, TS, "#d4d0c6");
        for (let y = 3; y < TS; y += 6) P.r(x + (sd < 0 ? 0 : 1), py + y, 4, 1, "#8a867c");
      }
    }
    if (st === "conc") {
      if ((dx === 0 || dx === 1) && ty <= ey + 2) {
        P.r(px + 1, py + 1, TS - 2, TS - 2, "#c8a42a").r(px + 1, py + 1, TS - 2, 1, "#e0c050").r(px + 1, py + TS - 2, TS - 2, 1, "#7a6214");
        for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) P.r(px + 4 + a * 5, py + 4 + b * 5, 3, 3, "#e8c850").p(px + 6 + a * 5, py + 6 + b * 5, "#8a6e18");
      } else if (ty === ey + 2) {
        P.r(px, py + 8, TS, 16, "#c8a42a").r(px, py + 8, TS, 1, "#e0c050").r(px, py + 23, TS, 1, "#7a6214");
        for (let k = 0; k < 4; k++) P.r(px, py + 10 + k * 4, TS, 2, "#e8c850").r(px, py + 12 + k * 4, TS, 1, "#9a7e1c");
        if (!md(tx, 2)) P.r(px, py + 8, 1, 16, "#8a6e18");
      }
      if (g.chance(.2)) mark(g.pick([ "dust", "stain", "tapeLine", "crack", "dust" ]), px + 3, lo ? py : py + 8 + g.i(10));
      if (g.chance(.18)) ob(g.pick([ "paperBall", "news", "can", "receipt", "butt", "bottle", "leaf" ]), px + 4 + g.i(18), py + 12 + g.i(16));
    }
    if (st === "corr") {
      for (const sd of [ -1, 1 ]) if (!hk(sd, 0) && kAt(O, tx + sd, ty) !== K.CEIL) {
        const x = sd < 0 ? px : px + TS - 3;
        P.r(x, py, 3, TS, "#7a7c80").r(x, py, 1, TS, "#b4b6b8");
      }
      if (bot) {
        P.r(px, py + TS - 4, TS, 4, "#6a6c6e").r(px, py + TS - 4, TS, 1, "#9a9c9e");
        for (let x = 2; x < TS; x += 6) P.r(px + x, py + TS - 20, 2, 16, "#5a5c60").r(px + x, py + TS - 20, 1, 16, "#8a8c90");
        P.r(px, py + TS - 23, TS, 3, "#7a7c80").r(px, py + TS - 23, TS, 1, "#b4b6b8").r(px, py + TS - 20, TS, 1, "#3a3c40");
        if (g.chance(.3)) obj("planterBox", px + 4 + g.i(8), py + TS - 34);
      } else if (g.chance(.3)) ob(g.pick([ "bucket", "boxOne", "trashBag", "potPlant", "chairFold", "boxStack", "bucket" ]), px + 3 + g.i(16), py + 14 + g.i(8));
    }
    if (st === "porch") {
      if (bot && O.cfg.hall && O.cfg.hall.open && !lo) P.r(px, py + TS - 6, TS, 6, "#a49e92").r(px, py + TS - 6, TS, 1, "#cac4b6").r(px, py + TS - 1, TS, 1, "#5a564e"); else if (g.chance(.3)) ob(g.pick([ "shoes", "slippers", "news", "boxOne", "umbrella" ]), px + 4 + g.i(14), py + 14 + g.i(10));
    }
    if (st === "lobby" && H.full) {
      if (top && O.elx.includes(tx)) P.r(px + 2, py, TS - 4, 5, "#8a8e94").r(px + 2, py, TS - 4, 1, "#c4c8ce").r(px + 2, py + 4, TS - 4, 1, "#4a4e54").r(px + (TS >> 1) - 1, py, 2, 4, "#5a5e64");
      if (g.chance(.3)) P.line(px + g.i(TS), py + g.i(TS), px + g.i(TS), py + g.i(TS), "rgba(140,130,118,0.35)");
      if (g.chance(.12)) mark(g.pick([ "scuff", "dust", "stain" ]), px + 6, lo ? py : py + 12);
      if (g.chance(.1)) ob(g.pick([ "receipt", "leaf", "paperBall", "news" ]), px + 4 + g.i(18), py + 14 + g.i(12));
    } else if (st === "lobby") {
      if (!top && (!hk(-1, 0) || !hk(1, 0))) {
        const x = !hk(-1, 0) ? px : px + TS - 5;
        P.r(x, py + 2, 5, TS - 4, "#8a8e94").r(x + 1, py + 2, 1, TS - 4, "#c4c8ce").r(x + 4, py + 2, 1, TS - 4, "#4a4e54");
        for (let y = 5; y < TS - 3; y += 4) P.p(x + 2, py + y, "#5a5e64");
      }
      if (g.chance(.1)) mark("scuff", px + 6, lo ? py : py + 12);
    }
    if (st === "goshi") {
      if (g.chance(.14)) mark(g.pick([ "scuff", "dust", "stain" ]), px + 4, lo ? py : py + 8 + g.i(8));
      if (g.chance(.14)) ob(g.pick([ "paperBall", "receipt", "butt", "slippers", "trashBag", "bucket" ]), px + 4 + g.i(18), py + 14 + g.i(14));
    }
    if (top && st !== "park" && st !== "steps") {
      if ((tx === H.x0 || tx === H.x1) && st !== "corr" && g.chance(.6)) obj("extinguisher", tx === H.x0 ? px + 3 : px + 22, py + 1); else if (st === "goshi" && g.chance(.2)) {
        const n = g.pick([ "mop", "broom", "umbLean" ]);
        obj(n, px + 18 + g.i(Math.max(1, TS - 17 - OBW(n))), lo ? py : py + 7);
      }
    }
    if (st === "steps") {
      if (g.chance(.18)) mark("puddleSm", px + 8, lo ? py : py + 14);
      if (g.chance(.3)) ob("leaf", px + 4 + g.i(22), py + 8 + g.i(20));
      if ((tx === H.x0 || tx === H.x1) && g.chance(.5)) ob("potPlant", tx === H.x0 ? px + 6 : px + 16, py + 22);
    }
    if (top) P.r(px, py, TS, 4, "rgba(0,0,0,0.3)").r(px, py + 4, TS, 2, "rgba(0,0,0,0.12)");
    if (st !== "side2" && !H.full && pAt(tx, ty - 1) && md(tx - (O.ux != null ? O.ux : O.E.x0), uw) === 2) {
      const q = new SX.Rng(H32(tx, ty, O.seed + 91));
      if (q.chance(.6)) obj("mat", px + 3, py + 1);
      const s = q.pick([ "shoes", "slippers", "shoes", null, "slippers" ]);
      if (s) obj(s, px + 6 + q.i(8), py + 6 + q.i(3));
      if (q.chance(.45)) obj("umbLean", px + 25, py);
      if (q.chance(.4)) obj(q.pick([ "boxOne", "boxOne", "trashBag", "news", "boxStack" ]), px + 14 + q.i(4), py + 6 + q.i(3));
    }
    if (!hk(-1, 0)) P.r(px, py, 3, TS, "rgba(0,0,0,0.16)");
    if (!hk(1, 0)) P.r(px + TS - 3, py, 3, TS, "rgba(0,0,0,0.16)");
  }
  const PLC = new Map;
  function frontKind(O, F, tx, ty) {
    const i = ty * F.W + tx;
    if (O.pm[i] === 2) {
      const t = F.t[i], TT = SX.map.T;
      return t === TT.DOOR ? 5 : t === TT.WINDOW ? 6 : 1;
    }
    if (O.H && O.H.side && ty === O.H.y0 - 1 && tx >= O.H.x0 && tx <= O.H.x1) return 8;
    if (O.H && O.H.full) {
      if (kAt(O, tx, ty + 1) === K.HALL) return 9;
      if (ty === O.botY) return O.wcols.has(tx) ? 2 : 1;
    }
    if (kAt(O, tx, ty + 1) === K.HALL) {
      const r = md(tx - (O.ux != null ? O.ux : O.E.x0), O.cfg.uw);
      return r === 2 ? 3 : r === 4 && O.cfg.uw >= 5 ? 4 : r === 0 && H32(tx, ty, O.seed + 3) % 3 === 0 ? 7 : 1;
    }
    return md(tx, 3) === 1 ? 2 : 1;
  }
  HO.plate = function(ctx, F, tx, ty, px, py, capish) {
    const O = F.out;
    if (!O || !O.pm) return;
    const W = F.W, uk = O.uk, u = uk[ty * W + tx] || 1, WH = A.WALL_H, FH = F.wallH || WH;
    const pl = (x, y) => F.in(x, y) && capish(F, x, y), sol = (x, y) => pl(x, y) || kAt(O, x, y) === K.EARTH;
    const isP = (x, y) => !!F.plateAt(x, y), ukAt = (x, y) => F.in(x, y) ? uk[y * W + x] || 1 : 0, ow = (x, y) => pl(x, y) && !isP(x, y);
    const m = (pl(tx, ty - 1) ? 1 : 0) | (pl(tx + 1, ty) ? 2 : 0) | (sol(tx, ty + 1) ? 4 : 0) | (pl(tx - 1, ty) ? 8 : 0);
    let s = (isP(tx, ty - 1) && ukAt(tx, ty - 1) !== u ? 1 : 0) | (isP(tx - 1, ty) && ukAt(tx - 1, ty) !== u ? 8 : 0) | (ow(tx, ty - 1) ? 64 : 0) | (ow(tx + 1, ty) ? 128 : 0) | (ow(tx, ty + 1) ? 256 : 0) | (ow(tx - 1, ty) ? 512 : 0);
    const ez = O.elz, onE = !!ez && tx >= ez.x0 && tx <= ez.x1 && ty >= ez.y0 && ty <= ez.wy, inE = onE && ty <= ez.y1;
    if (onE) {
      if (tx > ez.x0) s &= ~8;
      if (ty > ez.y0) s &= ~1;
    }
    let fk = 0, ends = 0, vv = 0;
    if (!(m & 4)) {
      const fr = (x, y) => pl(x, y) && !sol(x, y + 1);
      ends = (fr(tx - 1, ty) ? 0 : 1) | (fr(tx + 1, ty) ? 0 : 2);
      if (isP(tx - 1, ty) && ukAt(tx - 1, ty) !== u || ow(tx - 1, ty)) s |= 16;
      if (isP(tx + 1, ty) && ukAt(tx + 1, ty) !== u || ow(tx + 1, ty)) s |= 32;
      fk = frontKind(O, F, tx, ty);
      if (fk === 3 || fk === 4 || fk === 7) vv = H32(tx, ty, O.seed + 5) % 12; else if (fk === 8 || fk === 9) vv = tx - O.H.x0;
      if (fk === 5) vv = F.in(tx - 1, ty) && F.t[F.i(tx - 1, ty)] === SX.map.T.DOOR ? 2 : 1;
    }
    const col = u === 1 ? O.ocol : A.shade(O.pcol, (H32(u, 7, 3) % 7 - 3) * .012), ext = O.cfg ? O.cfg.ext : col;
    const el = inE ? {
      c: elevTop(TS * 5, TS * 2, O.ocol),
      sx: (tx - ez.x0) * TS,
      sy: (ty - ez.y0) * TS
    } : null;
    const key = m + ":" + s + ":" + fk + ":" + ends + ":" + vv + ":" + (tx & 3) + col + ext + FH + (el ? ":e" + el.sx + "," + el.sy + O.ocol : "");
    let c = PLC.get(key);
    if (!c) {
      c = makePlate(m, s, fk, ends, vv, tx, col, ext, FH, WH, el);
      PLC.set(key, c);
      if (PLC.size > 600) PLC.delete(PLC.keys().next().value);
    }
    ctx.drawImage(c, px, py - WH);
  };
  function makePlate(m, s, fk, ends, vv, tx, col, ext, FH, WH, el) {
    const c = A.mk(TS, TS + WH), P = new A.Pen(c.getContext("2d")), X = P.x, cap = A.wallCap(0, m, col), dk = A.shade(col, -.32), lt = A.shade(col, .12), ln = A.shade(col, -.55);
    const front = !(m & 4), ct = front ? TS + WH - FH : TS;
    if (front) {
      X.drawImage(cap, 0, 0, TS, ct - 1, 0, 0, TS, ct - 1);
      X.drawImage(cap, 0, TS - 1, TS, 1, 0, ct - 1, TS, 1);
    } else X.drawImage(cap, 0, 0);
    if (s & 1) P.r(0, 0, TS, 1, dk).r(0, 1, TS, 1, lt);
    if (s & 8) P.r(0, 0, 1, ct, dk).r(1, 0, 1, ct, lt);
    if (s & 64) P.r(0, 0, TS, 1, ln).r(0, 1, TS, 1, dk);
    if (s & 512) P.r(0, 0, 1, ct, ln).r(1, 0, 1, ct, dk);
    if (s & 128) P.r(TS - 1, 0, 1, ct, ln).r(TS - 2, 0, 1, ct, dk);
    if (s & 256 && !front) P.r(0, ct - 1, TS, 1, ln).r(0, ct - 2, TS, 1, dk);
    if (el) X.drawImage(el.c, el.sx, el.sy, TS, TS, 0, 0, TS, TS);
    if (front) {
      const wk = fk === 2 || fk === 6 ? 1 : 0, sd = A.shade(ext, -.42);
      X.drawImage(A.wallFront(wk, tx, ends, ext, 0, FH), 0, ct);
      if (s & 16) P.r(0, ct, 1, FH, sd);
      if (s & 32) P.r(TS - 1, ct, 1, FH, sd);
      const q = new SX.Rng(vv * 7919 + 17);
      if (fk === 5) ownDoor(P, ct, FH, vv); else if (fk === 3) nDoor(P, ct, FH, vv); else if (fk === 4) nWin(P, ct, FH, q); else if (fk === 7) nFix(P, ct, FH, q, vv); else if (fk === 8) sWall(P, ct, FH, q, vv); else if (fk === 9) eWall(P, ct, FH, q, vv);
    }
    return c;
  }
  const ELC = new Map;
  function elevTop(w, h, col) {
    const ck = w + "x" + h + col;
    let c = ELC.get(ck);
    if (c) return c;
    c = A.mk(w, h);
    const P = new A.Pen(c.getContext("2d")), q = new SX.Rng(4127), sh = A.shade;
    const ed = sh(col, -.5), st = "#a4a8ae", stL = "#d2d6dc", stD = "#6c7076", ol = "#3a3d42", sy0 = 4;
    for (let n = 0; TS * (1.5 + 2 * n) + 30 <= w; n++) {
      const cx = TS * (1.5 + 2 * n), L = n % 2 === 0, gx0 = L ? cx - 44 : cx - 30, gx1 = L ? cx + 30 : cx + 44;
      P.r(gx0 - 1, sy0 - 1, gx1 - gx0 + 2, h - sy0 + 1, ed).vband(gx0, sy0, gx1 - gx0, h - sy0, [ "#18191c", "#141518", "#111215", "#0e0f12", "#0c0d10" ]);
      P.vband(gx0, sy0, gx1 - gx0, 9, [ sh(col, -.4), sh(col, -.5), sh(col, -.6), sh(col, -.7), sh(col, -.78) ]);
      for (let k = 0; k < 5; k++) P.r(gx0 + 2 + q.i(gx1 - gx0 - 8), sy0 + 1 + q.i(5), 2 + q.i(5), 1, "rgba(0,0,0,0.3)");
      const w0 = L ? gx0 : cx + 27, w1 = L ? cx - 27 : gx1, mid = w0 + w1 >> 1;
      for (const rx of [ w0 + 1, w1 - 2 ]) {
        P.r(rx, sy0 + 6, 1, h - sy0 - 6, "#34373c");
        for (let y = sy0 + 9; y < h; y += 9) P.r(rx - 1, y, 3, 1, "#44474c");
      }
      for (const k of [ -3, -1, 1, 3 ]) {
        P.r(mid + k, sy0 + 1, 1, h - sy0 - 1, k === -1 || k === 3 ? "#4c5056" : "#41454b");
        if (q.chance(.7)) P.p(mid + k, sy0 + 3 + q.i(10), "#6e7278");
      }
      P.vband(w0, sy0 + 22, w1 - w0, h - sy0 - 22, [ "rgba(0,0,0,0)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.34)" ]);
      for (const rx of [ cx - 29, cx + 28 ]) P.r(rx, sy0 + 2, 1, h - sy0 - 2, "#55585e").r(rx + (rx < cx ? -1 : 1), sy0 + 2, 1, h - sy0 - 2, "#2e3034");
      const x0 = cx - 26, x1 = cx + 26, y0 = h - 50, fw = x1 - x0, fy0 = y0 + 14, fy1 = h - 4, fh = fy1 - fy0;
      P.r(x0 - 1, y0 - 1, fw + 2, h - y0 + 1, ol);
      if (L) {
        P.r(x0 + 2, fy0, fw - 4, fh, "#545458");
        for (let gx = x0 + 18; gx < x1 - 2; gx += 16) P.r(gx, fy0, 1, fh, "#46464a");
        P.r(x0 + 2, fy0 + 16, fw - 4, 1, "#46464a");
        P.noise(x0 + 2, fy0, fw - 4, fh, [ "#626266", "#4a4a4e", "#6e6e70", "#3e3e42" ], .18, q);
      } else {
        P.r(x0 + 2, fy0, fw - 4, fh, "#8a8274");
        for (let gx = x0 + 14; gx < x1 - 2; gx += 12) P.r(gx, fy0, 1, fh, "#776f62");
        for (let gy = fy0 + 12; gy < fy1; gy += 12) P.r(x0 + 2, gy, fw - 4, 1, "#776f62");
        P.noise(x0 + 2, fy0, fw - 4, fh, [ "#96907f", "#7e7668", "#a09886" ], .14, q);
      }
      P.r(x0, y0, fw, 2, st).r(x0, y0, fw, 1, stL);
      P.r(x0, y0, 2, h - y0 - 3, st).r(x0, y0, 1, h - y0 - 3, stL).r(x1 - 2, y0, 2, h - y0 - 3, st).r(x1 - 1, y0, 1, h - y0 - 3, stD);
      if (L) {
        P.vband(x0 + 2, y0 + 2, fw - 4, 12, [ "#b8bcc2", "#aeb2b8", "#a2a6ac", "#969aa0" ]);
        for (let k = 0; k < 8; k++) P.r(x0 + 3 + q.i(fw - 6), y0 + 3 + q.i(8), 1, 1 + q.i(3), "rgba(255,255,255,0.22)");
        const mx = cx - 13, mw = 26;
        P.r(mx - 1, y0 + 3, mw + 2, 9, "#5e6268").vband(mx, y0 + 4, mw, 7, [ "#a6bccb", "#93abbc", "#8199ab", "#738b9d" ]);
        P.line(mx + 3, y0 + 9, mx + 7, y0 + 5, "#d6e6ee").line(mx + 5, y0 + 10, mx + 10, y0 + 5, "#c2d6e2");
        const kx = mx + 19, ky = y0 + 7;
        P.line(kx, ky, kx - 4, ky - 3, "#eef6fa").line(kx, ky, kx + 5, ky - 2, "#eef6fa").line(kx, ky, kx + 2, ky + 3, "#eef6fa").line(kx, ky, kx - 3, ky + 3, "#e4eef4").p(kx, ky, "#ffffff");
        P.r(mx + 8, y0 + 6, 2, 3, "#6e241e").p(mx + 10, y0 + 7, "#6e241e").p(mx + 7, y0 + 7, "#6e241e").p(mx + 8, y0 + 9, "#5a1c18").p(mx + 9, y0 + 10, "#5a1c18");
        P.r(x0 + 4, y0 + 4, 7, 5, ol).r(x0 + 5, y0 + 5, 5, 3, "#1a1d22").p(x0 + 5, y0 + 5, "#3e4650");
        P.r(x1 - 9, y0 + 4, 5, 6, "#8a7a5a").r(x1 - 8, y0 + 5, 3, 4, "#ece8dc").p(x1 - 7, y0 + 5, "#3a6ab0").p(x1 - 7, y0 + 7, "#8a8478");
        P.r(x0 + 2, y0 + 11, fw - 4, 1, "#e2e6ea").r(x0 + 2, y0 + 12, fw - 4, 1, "#5a5e64").r(x0 + 2, y0 + 13, fw - 4, 1, "#6a6e74");
        P.r(x0 + 2, fy0 + 3, 1, 18, "#cfd3d8").r(x0 + 3, fy0 + 3, 1, 18, "rgba(0,0,0,0.3)").r(x1 - 3, fy0 + 3, 1, 18, "#cfd3d8").r(x1 - 4, fy0 + 3, 1, 18, "rgba(0,0,0,0.22)");
      } else {
        const pc = "#3e4a5c";
        P.r(x0 + 2, y0 + 2, fw - 4, 12, pc);
        for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < fw - 4; xx++) if ((xx + yy) % 5 === 0 || (xx - yy + 60) % 5 === 0) P.p(x0 + 2 + xx, y0 + 2 + yy, "#334052");
        P.r(x0 + 2, y0 + 2, fw - 4, 1, "#56647a");
        for (const vx of [ x0 + 14, cx, x1 - 14 ]) P.r(vx, y0 + 2, 1, 12, "#283242");
        P.r(x0 + 2, fy0, 1, fh - 1, pc).r(x1 - 3, fy0, 1, fh - 1, pc);
        P.r(x1 - 15, fy0, 12, 5, pc).r(x1 - 14, fy0 + 5, 9, 2, pc).r(x1 - 14, fy0 + 7, 8, 1, "#283242");
        for (let k = 0; k < 6; k++) P.p(x1 - 14 + q.i(10), fy0 + 1 + q.i(5), "#334052");
      }
      P.r(x0 + 2, fy0, fw - 4, 1, "rgba(0,0,0,0.3)").r(x0 + 2, fy0 + 1, 1, fh - 2, "rgba(0,0,0,0.16)");
      if (L) {
        P.oval(cx - 6, fy0 + 18, 6, 3, "#4e1814").oval(cx - 4, fy0 + 19, 4, 2, "#5e1e18").r(cx - 4, fy0 + 21, 2, 7, "#521a16").p(cx - 3, fy0 + 28, "#521a16");
        P.r(x0 + 7, fy0 + 6, 6, 3, "#d8d8d2").r(x0 + 7, fy0 + 8, 6, 1, "#8a8a84").r(x0 + 11, fy0 + 6, 2, 2, "#b8b8b2").p(x0 + 9, fy0 + 7, "#c03a2a");
        P.r(x1 - 17, fy0 + 19, 6, 7, "#d8d2c4").r(x1 - 16, fy0 + 21, 4, 1, "#9a9486").r(x1 - 16, fy0 + 23, 3, 1, "#9a9486").r(x1 - 12, fy0 + 15, 5, 4, "#e4dece").p(x1 - 11, fy0 + 16, "#c03a2a");
        P.r(cx + 10, fy0 + 6, 2, 1, "#d8cba4").p(cx + 12, fy0 + 6, "#b86a32").r(cx + 3, fy0 + 26, 2, 1, "#d8cba4").p(cx + 2, fy0 + 26, "#b86a32");
        P.r(x0 + 6, fy0 + 25, 4, 2, "#9cc0cc").p(x0 + 10, fy0 + 25, "#2a5aa8").p(x0 + 7, fy0 + 25, "#d4ecf2");
        for (let k = 0; k < 5; k++) P.p(cx + 2 + q.i(9), fy0 + 1 + q.i(3), "#dce8f0");
        P.r(x1 - 5, fy1 - 15, 3, 11, ol).r(x1 - 4, fy1 - 14, 1, 9, "#b4b8be");
        for (let k = 0; k < 4; k++) P.p(x1 - 4, fy1 - 13 + k * 2, "#e8e4d8");
        P.p(x1 - 4, fy1 - 6, "#c03a2a");
      } else {
        const bx = x0 + 6, by = fy0 + 12;
        P.r(bx - 1, by - 1, 15, 15, "#6a4e2e").r(bx, by, 13, 9, "#b48c5c").r(bx, by + 9, 13, 4, "#8c6a40").r(bx + 6, by, 1, 9, "#d8c48e").r(bx + 2, by + 2, 3, 1, "#2a2a2a");
        P.ring(cx + 6, fy0 + 24, 2, 2, "#c8b070").p(cx + 6, fy0 + 24, "#5a5040");
        P.oval(x1 - 13, fy1 - 9, 4, 3, "#1e2024").p(x1 - 14, fy1 - 11, "#3a3e44").p(x1 - 12, fy1 - 10, "#3a3e44").r(x1 - 13, fy1 - 13, 1, 2, "#1e2024");
        P.noise(x0 + 3, fy0 + 2, fw - 6, fh - 4, [ "rgba(60,52,40,0.35)", "rgba(200,190,170,0.25)" ], .05, q);
        P.r(x0 + 2, fy1 - 15, 3, 11, ol).r(x0 + 3, fy1 - 14, 1, 9, "#b4b8be");
        for (let k = 0; k < 4; k++) P.p(x0 + 3, fy1 - 13 + k * 2, "#e8e4d8");
        P.p(x0 + 3, fy1 - 6, "#c03a2a");
      }
      const dx0 = cx - 14, dx1 = cx + 14;
      P.r(x0 + 2, fy1, fw - 4, 1, "#b8bcc2");
      for (let k = dx0; k < dx1; k += 2) P.p(k, fy1, "#6a6e74");
      P.r(x0, fy1 + 1, fw, 3, st).r(x0, fy1 + 1, fw, 1, stL);
      P.r(dx0, fy1 + 1, dx1 - dx0, 3, "#8c9096").r(dx0, fy1 + 1, dx1 - dx0, 1, "#b0b4ba").r(cx - 1, fy1 + 1, 2, 3, ol);
    }
    ELC.set(ck, c);
    return c;
  }
  function eWall(P, y0, H, q, v) {
    P.r(0, y0 + H - 3, TS, 3, "#6a665e").r(0, y0 + H - 3, TS, 1, "#a8a296");
    if (v === 1 || v === 3) {
      const x = 3, w = 26, y = y0 + 9, h = H - 9;
      P.r(x - 2, y - 2, w + 4, h + 2, "#3a3c40").r(x - 1, y - 1, w + 2, h + 1, "#8a8e94").r(x - 1, y - 1, w + 2, 1, "#c4c8ce");
      P.r(x, y, w, h, "#9ea2a8").vband(x, y, w >> 1, h, [ "#b4b8be", "#a6aab0", "#989ca2" ]).vband(x + (w >> 1), y, w >> 1, h, [ "#b0b4ba", "#a2a6ac", "#94989e" ]);
      P.r(x + (w >> 1) - 1, y, 2, h, "#4a4e54").r(x + (w >> 1), y, 1, h, "#2a2c30");
      for (let k = 0; k < 6; k++) P.r(x + 2 + q.i(w - 4), y + 3 + q.i(h - 8), 1, 2 + q.i(4), "rgba(255,255,255,0.18)");
      P.r(x + 4, y + h - 5, 6, 1, "rgba(0,0,0,0.25)").r(x + w - 9, y + h - 9, 4, 2, "rgba(120,30,20,0.35)");
      P.r(x + 7, y0 + 2, 12, 5, "#141618").r(x + 8, y0 + 3, 10, 3, "#2a1a14").r(x + 9, y0 + 3, 2, 3, "#ff7a30").r(x + 12, y0 + 3, 2, 3, "#ff7a30").p(x + 16, y0 + 4, v === 1 ? "#ff7a30" : "#5a2a18");
      return;
    }
    if (v === 2) {
      const x = 10, y = y0 + 16;
      P.r(x - 1, y - 1, 9, 15, "#5a5e64").r(x, y, 7, 13, "#b4b8be").r(x, y, 7, 1, "#dce0e4");
      P.oval(x + 3, y + 4, 2, 2, "#3a3c40").oval(x + 3, y + 4, 1, 1, "#ffb060").oval(x + 3, y + 9, 2, 2, "#3a3c40").oval(x + 3, y + 9, 1, 1, "#6a6c70");
      P.r(x - 6, y0 + 4, 20, 9, "#2a2c30").r(x - 5, y0 + 5, 18, 7, "#e8e4d8");
      for (let k = 0; k < 3; k++) P.r(x - 4, y0 + 6 + k * 2, 8 + q.i(8), 1, "#6a6458");
      P.r(x + 12, y + 2, 9, 12, "rgba(0,0,0,0.25)").r(x + 11, y + 1, 9, 12, "#f4f0e4").r(x + 11, y + 1, 9, 2, "#d84a3a").r(x + 12, y + 5, 6, 1, "#6a6458").r(x + 12, y + 7, 7, 1, "#6a6458").r(x + 12, y + 9, 4, 1, "#6a6458").p(x + 15, y, "#c8b040");
      P.r(x - 7, y + 22, 3, 3, "#3a3c40").p(x - 6, y + 23, "#c03a2a");
      return;
    }
    if (v === 4) {
      const x = 3, y = y0 + 10;
      P.r(x - 1, y - 1, 16, 26, "#3a3c40").r(x, y, 14, 24, "#8a8478");
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        const xx = x + 1 + c * 7, yy = y + 1 + r * 6;
        P.r(xx, yy, 6, 5, "#a49e90").r(xx, yy, 6, 1, "#c4beb0").r(xx + 1, yy + 2, 4, 1, "#2a2826");
        if (q.chance(.4)) P.r(xx + 1, yy + 1, 3, 1, q.pick([ "#ece6d4", "#e8c8d0", "#d8e8f0" ]));
      }
      P.r(x + 17, y0 + 6, 11, 16, "#5a4632").r(x + 18, y0 + 7, 9, 14, "#c8b89a");
      for (let k = 0; k < 3; k++) {
        const xx = x + 18 + q.i(4), yy = y0 + 8 + k * 4;
        P.r(xx, yy, 5, 4, q.pick([ "#ece6d4", "#f0e070", "#e8c8d0", "#d8e8f0" ])).p(xx + 2, yy, "#c03a2a");
      }
      return;
    }
    nFix(P, y0, H, q, 0);
    P.r(25, y0 + 6, 4, 3, "#2a2c30").p(26, y0 + 7, "#c03a2a");
  }
  function ownDoor(P, y0, H, half) {
    const o = half === 2 ? -TS : 0, x = 12 + o, w = 24, y = y0 + 4, h = H - 4, dc = "#4a3a2e";
    P.r(x - 3, y - 3, w + 6, h + 3, "#24262a").r(x - 2, y - 2, w + 4, 1, "#44464a");
    P.r(x, y, w, h, dc).r(x, y, w, 1, A.shade(dc, .2)).r(x + w - 1, y, 1, h, A.shade(dc, -.3)).r(x, y + h - 1, w, 1, A.shade(dc, -.35));
    for (const py of [ y + 4, y + 22 ]) P.r(x + 3, py, w - 6, 14, A.shade(dc, -.08)).r(x + 3, py, w - 6, 1, A.shade(dc, -.22));
    P.r(x + w - 7, y + 13, 4, 7, "#1e2024").r(x + w - 6, y + 14, 2, 1, "#5fbf6a");
    P.r(x + w - 9, y + 22, 6, 2, "#c8c4b8").r(x + w - 4, y + 21, 2, 4, "#8a867c");
    P.p(x + (w >> 1), y + 7, "#0e0f11");
  }
  const NDC = [ "#7e7a70", "#5c4636", "#55625c", "#6c3d36", "#8e8b84", "#4a5260" ];
  function nDoor(P, y0, H, v) {
    const dc = NDC[v % NDC.length], x = 7, w = 18, y = y0 + 6, h = H - 6;
    P.r(x - 2, y - 2, w + 4, h + 2, "#2a2c30").r(x - 1, y - 1, w + 2, 1, "#4a4c50");
    P.r(x, y, w, h, dc).r(x, y, w, 1, A.shade(dc, .22)).r(x + w - 1, y, 1, h, A.shade(dc, -.3)).r(x, y + h - 1, w, 1, A.shade(dc, -.35));
    for (const py of [ y + 4, y + 21 ]) P.r(x + 3, py, w - 6, 13, A.shade(dc, -.07)).r(x + 3, py, w - 6, 1, A.shade(dc, -.22)).r(x + 3, py + 12, w - 6, 1, A.shade(dc, .12));
    P.r(x + w - 6, y + 12, 4, 6, "#1e2024").r(x + w - 5, y + 13, 2, 1, "#5fbf6a").r(x + w - 5, y + 15, 2, 2, "#3a3c40");
    P.r(x + w - 8, y + 20, 5, 2, "#c8c4b8").r(x + w - 4, y + 19, 2, 4, "#8a867c");
    P.p(x + (w >> 1), y + 7, "#0e0f11").p(x + (w >> 1), y + 6, A.shade(dc, -.4));
    P.r(1, y + 6, 5, 4, "#d8d4c8").r(2, y + 7, 3, 1, "#3a3c40").r(2, y + 9, 2, 1, "#6a6c70");
    const r = (v >> 1) % 4;
    if (r === 1) P.r(x + 4, y + 7, 6, 8, "#ece6d4").r(x + 5, y + 9, 4, 1, "#c03a2a").r(x + 5, y + 11, 3, 1, "#6a6458").r(x + 5, y + 13, 4, 1, "#6a6458");
    if (r === 2) P.r(x + w - 8, y + 23, 4, 6, "#e8eef4").r(x + w - 8, y + 25, 4, 2, "#3a70c0").p(x + w - 7, y + 22, "#c8c4b8");
    if (r === 3) P.r(x + 3, y + 2, 4, 3, "#d84a3a").r(x + 8, y + 2, 3, 3, "#e8c040");
  }
  function nWin(P, y0, H, q) {
    const x = 8, w = 16, y = y0 + 8, h = 12;
    P.r(x - 1, y - 1, w + 2, h + 2, "#3a3c40").r(x, y, w, h, "#9aa6ac").noise(x, y, w, h, [ "#b4bec4", "#8a969c" ], .35, q).r(x, y, w, 1, "#c8d2d8");
    for (let k = x + 2; k < x + w; k += 3) P.r(k, y - 2, 1, h + 4, "#4a4c50");
    P.r(x - 2, y - 3, w + 4, 1, "#5a5c60").r(x - 2, y + h + 1, w + 4, 2, "#8a8680").r(x - 2, y + h + 3, w + 4, 1, "#4a4844");
    if (q.chance(.45)) {
      const my = y + h + 8;
      P.r(x + 3, my, 8, 10, "#c8c4b8").r(x + 3, my, 8, 1, "#e0dcd0").r(x + 4, my + 2, 6, 4, "#3a3c40").r(x + 5, my + 3, 4, 2, "#b8d0a0").r(x + 6, my + 10, 2, y0 + H - my - 10, "#8a8478");
    }
  }
  function sWall(P, y0, H, q, v) {
    P.r(0, y0 + H - 4, TS, 4, "#5e5a52").r(0, y0 + H - 4, TS, 1, "#7a766c");
    if (v === 0) {
      const x = 7, y = y0 + 8;
      P.r(x - 1, y - 1, 17, 25, "#2a2c30").r(x, y, 15, 23, "#e8e4d8").r(x, y, 15, 3, "#3a4a6a").r(x + 2, y + 1, 11, 1, "#c8d0e0");
      for (const [yy, c] of [ [ 6, "#c03a2a" ], [ 10, "#2f5a9a" ], [ 14, "#3a8a4a" ], [ 18, "#c88a28" ] ]) P.r(x + 2, y + yy, 3, 2, c).r(x + 6, y + yy, 7, 1, "#5a5650").r(x + 6, y + yy + 1, 5, 1, "#8a867e");
      P.r(x + 19, y + 12, 4, 6, "#d8d4c8").r(x + 20, y + 13, 2, 2, "#3a3c40");
    } else if (v === 1) {
      P.r(3, y0 + 2, 26, 6, "#c8ccc8").r(3, y0 + 2, 26, 1, "#e8ece8").r(3, y0 + 7, 26, 1, "#7a7e7a").r(5, y0 + 4, 22, 2, "#f8fcff");
      for (let k = 0; k < 3; k++) {
        const x = 2 + k * 10 + q.i(2), y = y0 + 14 + q.i(10), c = q.pick([ "#ece6d4", "#f0e070", "#e8c8d0", "#d8e8f0" ]);
        P.r(x + 1, y + 1, 8, 11, "rgba(0,0,0,0.25)").r(x, y, 8, 11, c).r(x, y, 8, 2, q.pick([ "#d84a3a", "#2f5a9a", "#3a8a4a" ]));
        for (let r = 0; r < 3; r++) P.r(x + 1, y + 4 + r * 2, 3 + q.i(4), 1, "#6a6458");
        P.p(x + 3, y - 1, "#c8b040");
      }
    } else {
      nFix(P, y0, H, q, 0);
      P.r(27, y0 + 12, 3, 4, "#e8c040").r(26, y0 + 22, 4, 3, "#3a70c0").r(2, y0 + 30, 3, 3, "#d84a3a");
    }
  }
  function nFix(P, y0, H, q, v) {
    const r = v % 4;
    if (r === 0) {
      const x = 6, y = y0 + 8, w = 20, h = 26;
      P.r(x - 1, y - 1, w + 2, h + 2, "#5a1a16").r(x, y, w, h, "#b8322e").r(x, y, w, 1, "#d85a4a").r(x + w - 1, y, 1, h, "#7a1e1a");
      P.r(x + 3, y + 3, w - 6, 5, "#e8e0d0").r(x + 5, y + 4, 2, 3, "#b8322e").r(x + 9, y + 4, 2, 3, "#b8322e").r(x + 13, y + 4, 2, 3, "#b8322e");
      P.r(x + 3, y + 11, w - 6, h - 14, "#a02a26").p(x + w - 5, y + 18, "#e8e0d0").oval(x + 9, y + 17, 3, 3, "#e8c040");
    } else if (r === 1) {
      const x = 9, y = y0 + 10, w = 14, h = 18;
      P.r(x - 1, y - 1, w + 2, h + 2, "#3a3c40").r(x, y, w, h, "#9a9c98").r(x, y, w, 1, "#c4c6c2");
      P.r(x + 3, y + 3, w - 6, 6, "#1e2024").r(x + 4, y + 4, w - 8, 4, "#a8c0b0").r(x + 5, y + 5, 3, 1, "#2a3a30").r(x + 3, y + 12, w - 6, 3, "#5a5c60").r(x + 4, y + h + 1, 2, y0 + H - y - h - 1, "#2a2c30");
    } else if (r === 2) {
      const x = 10 + q.i(6), y = y0 + 9 + q.i(4);
      P.r(x + 1, y + 1, 11, 14, "rgba(0,0,0,0.25)").r(x, y, 11, 14, "#ece6d4").r(x, y, 11, 2, "#d84a3a");
      for (let k = 0; k < 4; k++) P.r(x + 2, y + 4 + k * 2, 5 + q.i(4), 1, "#6a6458");
      P.p(x + 5, y - 1, "#c8b040");
    } else {
      const x = 8, y = y0 + 4;
      P.r(x - 1, y - 1, 18, 9, "#2a2c30").r(x, y, 16, 7, "#2f8a45").r(x + 2, y + 2, 2, 3, "#e6f6e0").r(x + 5, y + 1, 1, 5, "#e6f6e0").r(x + 7, y + 3, 6, 1, "#e6f6e0").r(x + 11, y + 2, 2, 3, "#e6f6e0");
    }
  }
  function waterGlow(P, O, tx, ty, px, py) {
    const q = new SX.Rng(H32(tx, ty, O.seed + 41));
    if (!q.chance(.3)) return;
    const c = q.pick([ "rgba(255,210,140,0.35)", "rgba(255,190,120,0.3)", "rgba(255,110,200,0.25)", "rgba(110,210,255,0.25)" ]);
    for (let k = 0; k < 2; k++) P.r(px + q.i(20), py + 4 + q.i(24), 4 + q.i(9), 1, c);
  }
  const CARM = [ "#6a6c70", "#8a2a26", "#2a3a5a", "#b8b6ae", "#3a3c40", "#c8a040" ];
  const clipT = (P, px, py, fn) => {
    P.x.save();
    P.x.beginPath();
    P.x.rect(px, py, TS, TS);
    P.x.clip();
    fn();
    P.x.restore();
  };
  const CARN = [ "#8a8c90", "#b8b6ae", "#3a3c40", "#7a2a26", "#2a3a5a", "#d8d4cc", "#4a4e3a", "#a08040", "#5a5e66" ], TRC = [ "#2e4a2a", "#355230", "#2a4228", "#3a5634", "#314c2c" ];
  const STN = [ "#7a766c", "#6a675e", "#827e74", "#5e5b53" ];
  const tree = (P, x, y, r, c) => {
    const r2 = Math.max(1, r - 1);
    P.oval(x + 2, y + 2, r, r2, "rgba(0,0,0,0.38)").oval(x, y, r, r2, c);
    if (r >= 3) P.oval(x - 1, y - 1, r - 2, Math.max(1, r - 3), A.shade(c, .14));
    P.p(x - (r >> 1), y - (r >> 1), A.shade(c, .3));
  };
  function miniCar(P, x, y, hz, col, st, fw) {
    const W = hz ? 11 : 5, H = hz ? 5 : 11, c = st === 3 ? "#2a2522" : col, d = A.shade(c, -.38), gw = st === 3 ? "#141210" : "#1c2430";
    P.r(x + 1, y + 1, W, H, "rgba(0,0,0,0.42)").r(x, y, W, H, d).r(x + (hz ? 1 : 0), y + (hz ? 0 : 1), W - (hz ? 2 : 0), H - (hz ? 0 : 2), c);
    if (hz) P.r(fw ? x + 7 : x + 2, y + 1, 2, 3, gw).r(fw ? x + 3 : x + 6, y + 1, 1, 3, gw).r(x + 4, y + 1, 2, 3, A.shade(c, .14)); else P.r(x + 1, fw ? y + 7 : y + 2, 3, 2, gw).r(x + 1, fw ? y + 3 : y + 6, 3, 1, gw).r(x + 1, y + 4, 3, 2, A.shade(c, .14));
    if (st === 1) {
      if (hz) P.r(x + 4, y - 2, 3, 2, d); else P.r(x - 2, y + 4, 2, 3, d);
    }
    if (st === 2) {
      if (hz) P.r(fw ? x + W - 3 : x, y, 3, H, "#2e2c2a"); else P.r(x, fw ? y + H - 3 : y, W, 3, "#2e2c2a");
      P.p(x + 2, y + H + 1, "#c8c8c0").p(x + 6, y + H, "#9a9a92");
    }
    if (st === 3) P.p(x + 2, y + 1, "#5a2a10").p(x + W - 3, y + H - 2, "#3a1a0a").r(x - 2, y + H, W + 4, 1, "rgba(20,16,14,0.5)");
  }
  const each = (u0, W, per, fn) => {
    for (let n = Math.floor((u0 - 40) / per); n * per < u0 + W + 40; n++) fn(n, n * per - u0);
  };
  function rseg(O, si) {
    let S = O.rseg.get(si);
    if (S) return S;
    const c = A.mk(SEGW, RH), gl = A.mk(SEGW, RH), P = new A.Pen(c.getContext("2d")), G = new A.Pen(gl.getContext("2d")), u0 = si * SEGW, W = SEGW, q = new SX.Rng(H32(si, 7, O.seed + 301)), sd = O.seed;
    const band = (y, h, cc) => P.r(0, y, W, h, cc), dash = (y, len, gap, cc) => {
      const pp = len + gap;
      for (let x = md(y * 7 - u0, pp) - pp; x < W; x += pp) P.r(x, y, len, 1, cc);
    };
    band(0, 3, "#4a4a48");
    each(u0, W, 11, (n, x) => tree(P, x + md(H32(n, 1, sd), 4), 2, 2, TRC[n & 3]));
    band(3, 10, "#46585e");
    band(3, 1, "#7a8c92");
    band(12, 1, "#222a2c");
    each(u0, W, 7, (n, x) => P.r(x, 3, 1, 10, "#2e3a3e"));
    band(13, 48, "#2e2f33");
    band(13, 1, "#5a5a56");
    band(60, 1, "#5a5a56");
    band(14, 1, "#8a8a80");
    band(59, 1, "#8a8a80");
    band(36, 2, "#6a6a62");
    band(36, 1, "#9a9a90");
    for (const y of [ 20, 25, 30, 43, 48, 53 ]) dash(y, 5, 6, "#6e6e66");
    for (let ln = 0; ln < 8; ln++) {
      const y = ln < 4 ? 16 + ln * 5 : 39 + (ln - 4) * 5, rg = ln >= 4;
      if (MOVE_LN.includes(ln)) continue;
      each(u0, W, 13, (n, x) => {
        const h = H32(n, ln, sd + 5);
        if (h % 100 > 58) return;
        const xx = x + md(h >> 8, 6), col = CARN[md(h >> 12, CARN.length)];
        P.r(xx, y, 7, 3, A.shade(col, -.3)).r(xx + 1, y, 5, 3, col).r(xx + (rg ? 4 : 1), y, 2, 3, "#1c2430");
        const hx = rg ? xx + 7 : xx - 1, tx = rg ? xx - 1 : xx + 7;
        G.r(hx, y, 1, 1, "#fff6d8").r(hx, y + 2, 1, 1, "#fff6d8").r(rg ? hx : hx - 3, y - 1, 4, 5, "rgba(255,246,216,0.14)").r(tx, y, 1, 1, "#ff3a24").r(tx, y + 2, 1, 1, "#ff3a24").r(rg ? tx - 1 : tx, y, 2, 3, "rgba(255,60,40,0.16)");
      });
    }
    band(61, 14, "#3c5234");
    for (let x = md(-u0, 4); x < W; x += 4) P.line(x, 62, x + 3, 74, "#34482e");
    band(61, 1, "#6a6a62");
    band(75, 62, "#3e5a34");
    P.noise(0, 75, W, 62, [ "#46643a", "#36502e", "#4a6a3c" ], .05, q);
    each(u0, W, 13, (n, x) => {
      const h = H32(n, 2, sd);
      if (h % 3 === 0) tree(P, x + md(h >> 4, 9), 78 + md(h >> 9, 3), 3, TRC[n & 3]);
      if (h % 4 === 1) tree(P, x + 4, 133, 2, TRC[n + 1 & 3]);
    });
    for (const f of O.facF) if (f.u < u0 + W && f.u + f.w * .62 > u0) fac(P, G, f, f.u - u0, 81, .62, true);
    band(137, 10, "#6a4a44");
    band(137, 1, "#8a8a80");
    band(146, 1, "#8a8a80");
    dash(141, 4, 4, "#d8c050");
    each(u0, W, 29, (n, x) => {
      const h = H32(n, 9, sd);
      if (h % 3) return;
      const xx = x + md(h >> 4, 20), y = 139 + (h >> 8 & 1) * 4;
      P.r(xx, y + 1, 4, 1, "#2a2c30").r(xx + 1, y, 2, 1, q.pick([ "#3a5a8a", "#c84a3a", "#e8e4d8", "#3a8a4a" ]));
      G.p(h >> 8 & 1 ? xx + 4 : xx - 1, y + 1, "#fff6d8");
    });
    band(147, 6, "#9a968a");
    band(147, 1, "#b4b0a4");
    each(u0, W, 256, (n, x) => {
      P.r(x + 15, 145, 1, 4, "#3a3c40").r(x + 14, 144, 3, 1, "#5a5c60");
      G.r(x + 14, 143, 3, 2, "#ffe8b0").r(x + 10, 140, 11, 8, "rgba(255,220,150,0.16)");
    });
    P.vband(0, 153, W, RF + RW - 153 + 16, [ "#1e2e3e", "#1c2c3c", "#1a2a3a", "#192838", "#182636", "#172534", "#162432", "#152230" ]);
    for (let r = RF + 2; r < RF + RW; r += 1 + Math.floor((r - RF) / 80)) {
      const t = (r - RF) / RW, n = Math.round(W / (10 + t * 36)), len = 2 + Math.round(t * 8);
      for (let k = 0; k < n; k++) if (q.chance(.55)) P.r(q.i(W), r, 1 + q.i(len), 1, q.chance(.5) ? "#24384c" : "#203244");
    }
    for (let k = 0; k < 22; k++) P.r(q.i(W), RF + 6 + q.i(RW - 12), 1 + q.i(3), 1, "#33506a");
    each(u0, W, 5, (n, x) => {
      const h = H32(n, 11, sd);
      if (h % 5 > 2) return;
      const xx = x + md(h >> 3, 5), len = 16 + md(h >> 7, 90), cc = [ "255,214,150", "255,196,120", "255,236,200", "255,110,200", "110,210,255", "255,170,90" ][md(h >> 12, 6)];
      for (let y = RF + 1; y < RF + len; y += 2 + (y - RF >> 5)) {
        const a = .34 * (1 - (y - RF) / (len + 4));
        if (md(H32(n, y, 3), 10) < 7) G.r(xx + md(H32(n, y, 5), 3) - 1, y, 1 + md(H32(n, y, 6), 2), 1, "rgba(" + cc + "," + a.toFixed(2) + ")");
      }
    });
    each(u0, W, 256, (n, x) => {
      for (let y = RF + 2; y < RF + 130; y += 3) if (md(H32(n, y, 8), 10) < 8) G.r(x + 14 + md(H32(n, y, 9), 4) - 1, y, 2 + md(H32(n, y, 7), 3), 1, "rgba(255,220,150," + (.3 * (1 - (y - RF) / 134)).toFixed(2) + ")");
    });
    each(u0, W, 97, (n, x) => {
      const h = H32(n, 13, sd), r = RF + 30 + md(h >> 4, RW - 50), xx = x + md(h >> 12, 60), kk = md(h, 13);
      if (kk === 0) {
        P.r(xx + 1, r + 7, 12, 2, "rgba(0,0,0,0.35)").r(xx, r + 1, 12, 6, "#e8e4d8").r(xx + 8, r - 3, 5, 5, "#f0ece0").p(xx + 12, r - 2, "#d8a030").r(xx + 2, r + 2, 5, 3, "#3a6aa0");
      } else if (kk === 1) P.oval(xx + 6, r + 3, 6, 2, "#c8c4b8").oval(xx + 6, r + 3, 5, 1, "#e0dcd0").r(xx, r + 5, 13, 1, "rgba(0,0,0,0.3)"); else if (kk < 5) {
        P.r(xx, r, 3 + md(h >> 5, 4), 1, "#3a3630").p(xx + 1, r - 1, "#5a544a");
        if (kk === 4) P.oval(xx + 4, r + 3, 7, 2, "rgba(96,80,120,0.3)");
      } else if (kk === 5) {
        P.r(xx, r, 3, 3, "#c83a2a").r(xx, r, 3, 1, "#e8e0d0").r(xx, r + 3, 3, 1, "rgba(0,0,0,0.4)");
        if (r < RF + RW / 2) G.p(xx + 1, r - 1, "#ff6a3a");
      }
    });
    for (let x = 0; x < W; x++) {
      const u = u0 + x, e = 165 + Math.round(2.2 * Math.sin(u * .061) + 1.6 * Math.sin(u * .017 + 2));
      for (let y = 153; y < e; y++) {
        const row = (y - 153) / 3 | 0, s = u + (row & 1) * 2, gap = md(s, 5) === 4 || (y - 153) % 3 === 2;
        P.p(x, y, gap ? "#4e4b44" : STN[H32(Math.floor(s / 5), row, 43) & 3]);
      }
      P.p(x, e, "#a8b4b8").r(x, e + 1, 1, 2, "rgba(170,190,200,0.3)");
    }
    for (let x = 0; x < W; x++) {
      const u = u0 + x, e = RF + RW + 1 + Math.round(2.5 * Math.sin(u * .047 + 1) + 1.5 * Math.sin(u * .013));
      P.r(x, e - 2, 1, 2, "rgba(150,170,180,0.28)");
      for (let y = e; y < RF + RW + 14; y++) {
        const row = y - RF - RW + 4 >> 2, s = u + (row & 1) * 3, gap = md(s, 7) === 6 || md(y - RF - RW + 4, 4) === 3;
        P.p(x, y, gap ? "#4a4740" : STN[H32(Math.floor(s / 7), row, 41) & 3]);
      }
    }
    band(504, 4, "#9a9488");
    band(504, 1, "#b8b2a4");
    band(508, 14, "#4a4a4e");
    band(509, 1, "#c8c4b8");
    band(520, 1, "#c8c4b8");
    dash(515, 6, 5, "#d8b830");
    each(u0, W, 256, (n, x) => P.r(x + 15, 503, 2, 5, "#3a3c40").r(x + 13, 502, 6, 2, "#4a4c50"));
    each(u0, W, 41, (n, x) => {
      const h = H32(n, 17, sd), xx = x + md(h >> 4, 30), k = md(h, 9);
      if (k === 0) P.r(xx, 512, 6, 1, "#2a2c30").r(xx, 511, 1, 3, "#2a2c30").r(xx + 5, 511, 1, 3, "#2a2c30").p(xx + 2, 510, q.pick([ "#3a8a4a", "#c84a3a", "#e8e4d8" ])); else if (k === 1) P.r(xx, 516, 5, 1, "#5a5c60").r(xx + 4, 514, 1, 3, "#5a5c60"); else if (k < 4) P.oval(xx + 3, 512 + md(h >> 9, 7), 3, 1, "rgba(86,20,16,0.6)").p(xx + 7, 513, "rgba(86,20,16,0.6)"); else if (k === 4) P.r(xx, 514, 3, 3, q.pick([ "#3a5a8a", "#6a4a2a", "#8a3a3a" ])).r(xx, 514, 3, 1, "#d8d4cc");
    });
    band(522, 6, "#466238");
    band(528, 80, "#405c36");
    P.noise(0, 528, W, 80, [ "#4a6a3e", "#3a5432", "#52703f" ], .05, q);
    each(u0, W, 17, (n, x) => {
      const h = H32(n, 19, sd);
      if (h % 2) tree(P, x + md(h >> 3, 10), 532 + md(h >> 8, 70), 3 + md(h >> 13, 3), TRC[md(h >> 16, 5)]);
    });
    for (const f of O.facN) if (f.u < u0 + W && f.u + f.w > u0) fac(P, G, f, f.u - u0, 528, 1, false);
    band(608, 18, "#3e5834");
    for (let x = md(-u0, 5); x < W; x += 5) P.line(x, 609, x + 4, 625, "#36502e");
    band(608, 1, "#56704a");
    band(625, 1, "#2a3a24");
    each(u0, W, 420, (n, x) => {
      const xx = x + 40 + md(H32(n, 21, sd), 300);
      P.r(xx - 5, 596, 14, 12, "#8a867a").r(xx - 5, 596, 1, 12, "#6a665c").r(xx + 8, 596, 1, 12, "#6a665c").r(xx - 9, 609, 22, 17, "#6a675e").r(xx - 7, 611, 18, 15, "#0c0e10").r(xx - 9, 609, 22, 2, "#8a867a").r(xx - 9, 608, 22, 1, "#c8b040");
      P.r(xx - 4, 600, 3, 2, "rgba(86,20,16,0.55)");
    });
    band(626, 64, "#3c3d41");
    P.noise(0, 626, W, 64, [ "#44454a", "#36373a" ], .06, q);
    band(626, 1, "#6a6a66");
    band(689, 1, "#6a6a66");
    band(627, 1, "#b8b4a8");
    band(688, 1, "#b8b4a8");
    band(657, 3, "#8a8a82");
    band(657, 1, "#b4b4ac");
    band(659, 1, "#4a4a46");
    for (const y of [ 634, 642, 650, 667, 675, 683 ]) dash(y, 8, 8, "#9a9890");
    for (let ln = 0; ln < 8; ln++) {
      const y = ln < 4 ? 628 + ln * 8 : 661 + (ln - 4) * 8;
      each(u0, W, 17, (n, x) => {
        const h = H32(n, ln, sd + 51);
        if (h % 100 >= 30) return;
        const k = md(h >> 8, 10), st = k < 2 ? 3 : k < 4 ? 2 : k < 6 ? 1 : 0;
        miniCar(P, x + md(h >> 12, 6), y + md(h >> 16, 2), true, CARN[md(h >> 18, CARN.length)], st, ln >= 4);
        if (st === 2 && md(h, 3) === 0) miniCar(P, x + md(h >> 12, 6) + 9, y + 2, true, CARN[md(h >> 20, CARN.length)], 2, ln < 4);
      });
    }
    each(u0, W, 23, (n, x) => {
      const h = H32(n, 23, sd), xx = x + md(h >> 4, 20), y = 628 + md(h >> 9, 58), k = md(h, 11);
      if (k < 3) P.oval(xx, y, 3 + (k & 1), 1, "rgba(80,18,14,0.6)"); else if (k < 5) P.p(xx, y, "#9a9a92").p(xx + 2, y + 1, "#c8c8c0").p(xx - 1, y + 2, "#6a6a62"); else if (k === 5) for (let z = 0; z < 3 + md(h >> 14, 4); z++) {
        const zx = xx + md(H32(n, z, 3), 12), zy = y + md(H32(n, z, 4), 6);
        P.r(zx, zy + 1, 2, 2, "#4a5040").p(zx, zy, "#7a8a6a");
      }
    });
    band(690, 12, "#5a6c72");
    band(690, 1, "#8a9ca2");
    band(701, 1, "#2a3438");
    each(u0, W, 9, (n, x) => P.r(x, 690, 1, 12, "#3a464a"));
    each(u0, W, 70, (n, x) => {
      const h = H32(n, 25, sd);
      if (h % 3 === 0) P.r(x + md(h >> 4, 50), 692, 7, 8, "#22282a").p(x + md(h >> 4, 50) + 2, 703, "#8a9ca2");
    });
    band(702, 12, "#8a8478");
    band(702, 1, "#a8a296");
    each(u0, W, 4, (n, x) => P.p(x, 708, "#7a7468"));
    each(u0, W, 26, (n, x) => tree(P, x + md(H32(n, 31, sd), 6), 707, 5, TRC[n & 3]));
    O.brg.forEach((b, j) => {
      const x = b * TS - u0;
      if (x < W && x + 64 > 0) bridgeS(P, G, O, x, j);
    });
    S = {
      c,
      gl
    };
    O.rseg.set(si, S);
    if (O.rseg.size > 12) O.rseg.delete(O.rseg.keys().next().value);
    return S;
  }
  function bridgeS(P, G, O, x, j) {
    const w = 64, q = new SX.Rng(H32(j, 3, O.seed + 307)), mid = RF + RW * .55, by = RF + RW + 4, m1 = Math.round(RF + RW / 3), m2 = Math.round(RF + RW * 2 / 3);
    G.x.clearRect(x, 0, w, RH);
    P.r(x + w, RF, 8, RW, "rgba(0,0,0,0.34)");
    for (let r = RF + 24; r < RF + RW - 16; r += 64) P.r(x - 5, r, w + 10, 9, "#4a4c50").r(x - 5, r, w + 10, 1, "#6a6c70").r(x + w + 5, r + 3, 6, 9, "rgba(0,0,0,0.3)");
    P.r(x, 0, w, RH, "#3e3f43").noise(x, 0, w, RH, [ "#46474b", "#38393c" ], .05, q);
    P.r(x, 0, 4, RH, "#8a8c90").r(x, 0, 1, RH, "#b4b6ba").r(x + 3, 0, 1, RH, "#2a2b2e").r(x + w - 4, 0, 4, RH, "#7a7c80").r(x + w - 1, 0, 1, RH, "#4a4c50").r(x + w - 4, 0, 1, RH, "#2a2b2e");
    P.r(x + 31, 0, 1, RH, "#c8a830").r(x + 33, 0, 1, RH, "#c8a830");
    for (const lx of [ x + 13, x + 22, x + 42, x + 51 ]) for (let y = md(lx * 3, 12); y < RH; y += 12) P.r(lx, y, 1, 6, "#9a9890");
    if (j === 1) {
      for (const ax of [ x + 5, x + w - 7 ]) P.r(ax, RF - 6, 2, RW + 12, "#a8503a").r(ax, RF - 6, 1, RW + 12, "#c87050");
      for (let y = RF + 4; y < RF + RW - 4; y += 16) P.r(x + 7, y, w - 14, 1, "rgba(168,80,58,0.55)");
    }
    for (let y = 16; y < RH; y += 48) {
      P.r(x + 1, y, 3, 3, "#5a5c60").r(x + w - 4, y, 3, 3, "#5a5c60");
      if (y < mid) {
        G.r(x + 1, y, 3, 3, "#ffe8b0").r(x - 3, y - 4, 11, 11, "rgba(255,220,150,0.15)").r(x + w - 4, y, 3, 3, "#ffe8b0").r(x + w - 8, y - 4, 11, 11, "rgba(255,220,150,0.15)");
        if (y > RF && y < RF + RW) for (let yy = y + 6; yy < y + 40; yy += 3) G.r(x - 2 + q.i(3), yy, 2, 1, "rgba(255,220,150," + (.22 * (1 - (yy - y) / 42)).toFixed(2) + ")");
      }
    }
    for (let k = 0; k < 7; k++) {
      let lx = 0, y = 0, n = 0;
      const inBlk = () => y + 12 > m2 - 36 && y < m2 + 13;
      do {
        lx = x + 6 + q.i(w - 18);
        y = mid + q.i(by - mid - 16);
      } while (inBlk() && ++n < 8);
      if (!inBlk()) miniCar(P, lx, y, false, q.pick(CARN), q.pick([ 0, 1, 2, 3, 1 ]), q.chance(.5));
    }
    for (let k = 0; k < 10; k++) P.oval(x + 6 + q.i(w - 12), mid + q.i(RH - mid), 2, 1, "rgba(80,18,14,0.55)");
    blockS(P, x, w, 40, true, true);
    blockS(P, x, w, m1, true, false);
    blockS(P, x, w, m2, true, false);
    blockS(P, x, w, by, false, true);
  }
  function blockS(P, x, w, L, up, sign) {
    for (let xx = x + 4; xx < x + w - 4; xx += 7) P.r(xx + 1, L + 4, 6, 3, "rgba(0,0,0,0.35)").r(xx, L, 6, 4, "#c8c4b8").r(xx, L, 6, 1, "#e8e4d8").r(xx, L + 3, 6, 1, "#7a766c");
    for (let xx = x + 4, a = up ? L + 8 : L - 5; xx < x + w - 4; xx += 3) P.line(xx, a, xx + 2, a + 3, "#9a9a92").p(xx + 1, a + 1, "#c8c8c0");
    for (let yy = up ? L - 9 : L + 8, y1 = yy + 6; yy < y1; yy += 3) for (let xx = x + 5 + (yy >> 1 & 2); xx < x + 28; xx += 4) P.oval(xx, yy, 2, 1, "#a8946a").p(xx - 1, yy, "#c8b48a");
    if (up) {
      const T0 = L - 35;
      P.r(x + 40, T0 + 2, 11, 26, "rgba(0,0,0,0.4)").r(x + 39, T0, 10, 25, "#3e4a2e").r(x + 40, T0 + 1, 8, 17, "#56603e").r(x + 39, T0 + 19, 10, 6, "#4a5838").r(x + 41, T0 + 22, 6, 2, "#1c2430");
    } else P.r(x + 40, L + 10, 11, 26, "rgba(0,0,0,0.4)").r(x + 39, L + 8, 10, 25, "#3e4a2e").r(x + 39, L + 8, 10, 6, "#4a5838").r(x + 40, L + 15, 8, 17, "#56603e").r(x + 41, L + 9, 6, 2, "#1c2430");
    if (sign) {
      const sy = up ? L - 28 : L + 18;
      P.r(x + 18, sy, 9, 6, "#d8d4cc").r(x + 19, sy + 1, 7, 2, "#c83a2a").r(x + 22, sy + 6, 1, 4, "#5a5c60");
    }
  }
  function fac(P, G, f, X, Y, s, far) {
    const q = new SX.Rng(f.s), w = f.w, H = 80, mx = x => X + x * s, my = y => Y + y * s, sz = n => Math.max(1, n * s);
    const RR = {}, R = RR.r = (x, y, ww, hh, c) => {
      P.r(mx(x), my(y), sz(ww), sz(hh), c);
      return RR;
    }, Gr = (x, y, ww, hh, c) => G.r(mx(x), my(y), sz(ww), sz(hh), c);
    const E = (x, y, rx, ry, c) => P.oval(mx(x), my(y), Math.max(1, Math.round(rx * s)), Math.max(1, Math.round(ry * s)), c);
    const Ge = (x, y, rx, ry, c) => G.oval(mx(x), my(y), Math.max(1, Math.round(rx * s)), Math.max(1, Math.round(ry * s)), c);
    const L = (x0, y0, x1, y1, c) => P.line(mx(x0), my(y0), mx(x1), my(y1), c), D = (x, y, c) => P.p(mx(x), my(y), c);
    const Tr = (x, y, r) => tree(P, mx(x), my(y), Math.max(1, Math.round(r * s)), q.pick(TRC));
    const Bn = (x, y, vt) => {
      if (vt) R(x, y, 2, 8, "#6a4a30").r(x, y, 1, 8, "#8a6a48"); else R(x, y, 8, 2, "#6a4a30").r(x, y, 8, 1, "#8a6a48");
      R(x + (vt ? 2 : 0), y + (vt ? 0 : 2), vt ? 1 : 8, vt ? 8 : 1, "rgba(0,0,0,0.35)");
    };
    const fence = (x, y, ww, hh, c) => {
      c = c || "#7a7c80";
      for (let k = 0; k < ww; k += 2) D(x + k, y, c), D(x + k, y + hh, c);
      for (let k = 0; k < hh; k += 2) D(x, y + k, c), D(x + ww, y + k, c);
      for (let k = 0; k <= ww; k += 10) R(x + k, y - 1, 1, 2, "#4a4c50"), R(x + k, y + hh - 1, 1, 2, "#4a4c50");
    };
    const lampP = (x, y) => {
      R(x, y, 1, 4, "#3a3c40");
      R(x - 1, y - 1, 3, 1, "#5a5c60");
      if (far) {
        Gr(x - 1, y - 1, 3, 2, "#ffe8b0");
        Ge(x, y + 3, 9, 6, "rgba(255,220,150,0.1)");
      }
    };
    const ppl = (x, y, alive) => {
      const z = !far && !alive && q.f() < .85, px = Math.round(mx(x)), py = Math.round(my(y));
      const bc = z ? q.pick([ "#4a5040", "#5a5a48", "#3e4636", "#54504a" ]) : q.pick([ "#3a5a8a", "#c84a3a", "#e8e4d8", "#3a8a4a", "#d8b040", "#6a4a8a", "#2a2c30" ]), sk = z ? "#7a8a6a" : "#d8b090";
      if (far) {
        P.r(px, py + 1, 1, 2, bc).p(px, py, sk);
        return;
      }
      P.r(px + 1, py + 4, 2, 1, "rgba(0,0,0,0.35)").r(px, py + 2, 2, 3, bc).r(px, py, 2, 2, sk);
      if (z) {
        P.p(px + 2, py + 2, sk);
        if (q.chance(.3)) P.p(px - 1, py + 4, "rgba(86,20,16,0.7)");
      }
    };
    const blood = (x, y) => {
      if (!far) E(x, y, 3 + q.i(3), 1 + q.i(2), "rgba(80,18,14,0.55)");
    };
    const junk = (x, y) => {
      if (far) return;
      const k = q.i(5);
      if (k === 0) R(x, y, 3, 2, q.pick([ "#3a5a8a", "#8a3a3a", "#6a4a2a" ])); else if (k === 1) R(x, y, 2, 1, "#c8c4b8"); else if (k === 2) R(x, y, 1, 2, "#3a7a3a"); else if (k === 3) R(x, y, 4, 1, "#5a544a"); else D(x, y, "#c8b040");
    };
    const grass = () => {
      for (let k = 0; k < w * .5; k++) D(q.i(w), q.i(H), q.pick([ "#4a6a3e", "#36502e", "#52703f" ]));
    };
    grass();
    switch (f.kind) {
     case "play":
      {
        R(6, 8, w - 12, 64, "#6a3c30").r(8, 6, w - 16, 68, "#7a4636").r(8, 6, w - 16, 1, "#9a6a5a");
        P.noise(mx(8), my(6), sz(w - 16), sz(68), [ "#844c3c", "#6c3e32", "#8a5444" ], .08, q);
        R(18, 14, 24, 20, "rgba(0,0,0,0.3)").r(16, 12, 24, 20, "#d8b040").r(16, 12, 24, 3, "#c84a3a").r(18, 16, 20, 14, "#e0c060").r(24, 18, 8, 8, "#3a3a3a");
        R(40, 20, 20, 6, "#2e7ac8").r(40, 20, 20, 1, "#6aa8e0").r(58, 18, 4, 10, "#2e6aa8");
        R(16, 32, 2, 8, "#c84a3a").r(30, 32, 2, 8, "#c84a3a");
        for (let k = 0; k < 4; k++) R(18, 33 + k * 2, 12, 1, "#9a9a92");
        const sx = w - 44;
        R(sx, 18, 34, 2, "#c84a3a").r(sx, 18, 2, 24, "#a83a2a").r(sx + 32, 18, 2, 24, "#a83a2a");
        for (let k = 0; k < 3; k++) {
          const cx = sx + 7 + k * 10, br = !far && k === 1;
          L(cx, 20, cx, br ? 28 : 36, "#9a9a92");
          L(cx + 3, 20, cx + 3, 36, "#9a9a92");
          if (br) R(cx - 1, 38, 6, 2, "#3a3a3a"); else R(cx - 1, 36, 6, 2, "#3a3a3a");
        }
        R(14, 46, 34, 20, "#8a6a40").r(16, 48, 30, 16, "#c8b080");
        P.noise(mx(16), my(48), sz(30), sz(16), [ "#d8c090", "#b8a070" ], .1, q);
        D(22, 54, "#c83a2a");
        D(30, 58, "#3a6ac8");
        R(36, 52, 3, 2, "#d8b040");
        for (let k = 0; k < 3; k++) {
          const c = q.pick([ "#c84a3a", "#3a8a4a", "#d8b040", "#2e7ac8" ]);
          E(58 + k * 11, 58, 3, 2, c);
          D(58 + k * 11, 56, A.shade(c, .3));
        }
        Bn(4, 74);
        Bn(w - 14, 74);
        Bn(w - 4, 30, true);
        Tr(4, 6, 5);
        Tr(w - 4, 8, 5);
        Tr(w - 6, 66, 4);
        lampP(w >> 1, 2);
        for (let k = 0; k < (far ? 4 : 3); k++) ppl(20 + q.i(w - 40), 40 + q.i(26));
        if (!far) {
          blood(52, 44);
          junk(70, 66);
          R(66, 62, 5, 3, "#c8c4b8");
          R(66, 65, 1, 1, "#2a2c30");
          R(70, 65, 1, 1, "#2a2c30");
        }
        break;
      }

     case "shop":
      {
        R(4, 42, w - 8, 34, "#7a5a3c");
        for (let x = 6; x < w - 4; x += 4) R(x, 42, 1, 34, "#6a4a30");
        R(4, 42, w - 8, 1, "#9a7a58");
        const bw = 58;
        R(12, 12, bw, 32, "rgba(0,0,0,0.35)").r(8, 8, bw, 20, "#b8b0a0").r(8, 8, bw, 1, "#d0c8b8").r(8, 27, bw, 1, "#8a8478");
        R(14, 12, 8, 5, "#8a8c90").r(14, 12, 8, 1, "#aaacb0");
        R(28, 13, 6, 4, "#9a9c9e");
        D(31, 15, "#5a5c60");
        R(8, 28, bw, 4, "#2f6a48");
        for (let k = 0; k < 6; k++) R(12 + k * 8, 29, 4, 2, "#e8f0e0");
        R(8, 32, bw, 12, "#d8d0bc").r(8, 43, bw, 1, "#8a8478");
        R(12, 34, 28, 8, "#1c2a34");
        R(46, 34, 10, 10, "#1a1c20");
        if (far) {
          Gr(12, 34, 28, 8, "#f8ecc8");
          Gr(12, 34, 28, 1, "#fffaf0");
          Gr(8, 28, bw, 4, "#7aff9a");
          Ge(38, 46, 36, 10, "rgba(255,236,190,0.12)");
        } else {
          for (let k = 0; k < 9; k++) D(12 + q.i(28), 34 + q.i(8), q.pick([ "#c8d4dc", "#8a9aa4" ]));
          for (let k = 0; k < 6; k++) D(10 + q.i(34), 45 + q.i(6), "#c8d4dc");
          R(46, 34, 4, 10, "#3a2a20");
        }
        R(bw + 12, 24, 7, 16, "#c83a2a").r(bw + 20, 24, 7, 16, "#2e4f8a").r(bw + 12, 24, 15, 1, "#e8e4d8");
        if (far) {
          Gr(bw + 13, 27, 5, 7, "#fff0d0");
          Gr(bw + 21, 27, 5, 7, "#d8f0ff");
        } else {
          R(bw + 21, 27, 5, 7, "#141618");
          D(bw + 22, 29, "#c8d4dc");
          D(bw + 24, 32, "#c8d4dc");
        }
        R(bw + 30, 30, 4, 6, "#3a6a4a").r(bw + 30, 30, 4, 1, "#5a8a6a");
        R(bw + 36, 30, 8, 5, "#e8e4d8").r(bw + 36, 30, 8, 1, "#f8f4e8");
        for (let k = 0, n = Math.floor((w - 16) / 22); k < n; k++) {
          const ux = 14 + k * 22 + q.i(4), uy = 56 + q.i(8), c = q.pick([ "#c84a3a", "#2e4f8a", "#d8b040", "#2f6a48", "#e8e4d8" ]);
          if (far || q.chance(.35)) {
            E(ux, uy, 8, 6, c);
            E(ux, uy, 4, 3, A.shade(c, .2));
            D(ux, uy, "#3a3a3a");
            R(ux - 6, uy + 7, 3, 2, "#c8c4b8");
            R(ux + 4, uy + 7, 3, 2, "#c8c4b8");
          } else {
            E(ux + 3, uy + 4, 8, 3, c);
            E(ux + 3, uy + 4, 6, 1, A.shade(c, -.25));
            L(ux - 6, uy + 2, ux - 1, uy + 4, "#5a5c60");
            R(ux - 8, uy + 10, 2, 3, "#c8c4b8");
            R(ux + 8, uy - 2, 3, 2, "#c8c4b8");
            junk(ux + 2, uy + 12);
          }
        }
        lampP(4, 30);
        lampP(w - 6, 40);
        for (let k = 0; k < (far ? 6 : 3); k++) ppl(10 + q.i(w - 20), 48 + q.i(24));
        if (!far) {
          blood(30, 50);
          blood(60, 66);
        }
        break;
      }

     case "bball":
      {
        const cx0 = w - 67 >> 1, cy0 = 22;
        R(cx0 - 4, cy0 - 4, 75, 44, "#4a4a46");
        R(cx0, cy0, 67, 36, "#2e5a8a");
        R(cx0, cy0 + 11, 13, 14, "#a8503a");
        R(cx0 + 54, cy0 + 11, 13, 14, "#a8503a");
        const wl = "#e8e4d8";
        R(cx0, cy0, 67, 1, wl).r(cx0, cy0 + 35, 67, 1, wl).r(cx0, cy0, 1, 36, wl).r(cx0 + 66, cy0, 1, 36, wl).r(cx0 + 33, cy0, 1, 36, wl);
        P.ring(mx(cx0 + 33), my(cy0 + 18), Math.max(2, Math.round(6 * s)), Math.max(2, Math.round(6 * s)), wl);
        P.ring(mx(cx0 + 13), my(cy0 + 18), Math.max(2, Math.round(5 * s)), Math.max(2, Math.round(5 * s)), wl);
        P.ring(mx(cx0 + 54), my(cy0 + 18), Math.max(2, Math.round(5 * s)), Math.max(2, Math.round(5 * s)), wl);
        for (const hx of [ cx0 + 2, cx0 + 64 ]) {
          R(hx, cy0 + 14, 1, 8, wl);
          D(hx + (hx < cx0 + 30 ? 2 : -2), cy0 + 18, "#e87a30");
          R(hx + (hx < cx0 + 30 ? -3 : 1), cy0 + 17, 3, 2, "#5a5c60");
        }
        fence(cx0 - 5, cy0 - 6, 77, 48);
        Bn(cx0 + 10, cy0 + 44);
        Bn(cx0 + 46, cy0 + 44);
        Tr(2, 10, 4);
        Tr(w - 2, 70, 4);
        if (far) {
          lampP(cx0 - 6, cy0 - 8);
          lampP(cx0 + 72, cy0 - 8);
          Ge(cx0 + 33, cy0 + 18, 40, 24, "rgba(230,240,255,0.07)");
          for (let k = 0; k < 6; k++) ppl(cx0 + 6 + q.i(55), cy0 + 4 + q.i(28));
        } else {
          E(cx0 + 20, cy0 + 26, 2, 2, "#c86a30");
          for (let k = 0; k < 2; k++) ppl(cx0 + 6 + q.i(55), cy0 + 4 + q.i(28));
          blood(cx0 + 40, cy0 + 12);
          junk(cx0 + 60, cy0 + 40);
        }
        break;
      }

     case "futsal":
      {
        const x0 = w - 95 >> 1, y0 = 16;
        R(x0 - 4, y0 - 4, 103, 56, "#3a5a36");
        R(x0, y0, 95, 48, "#2e7a32");
        for (let k = 0; k < 95; k += 12) R(x0 + k, y0, 6, 48, "#348838");
        const wl = "#e8e4d8";
        R(x0, y0, 95, 1, wl).r(x0, y0 + 47, 95, 1, wl).r(x0, y0, 1, 48, wl).r(x0 + 94, y0, 1, 48, wl).r(x0 + 47, y0, 1, 48, wl);
        P.ring(mx(x0 + 47), my(y0 + 24), Math.max(2, Math.round(7 * s)), Math.max(2, Math.round(7 * s)), wl);
        R(x0, y0 + 14, 10, 1, wl).r(x0, y0 + 33, 10, 1, wl).r(x0 + 10, y0 + 14, 1, 20, wl).r(x0 + 85, y0 + 14, 10, 1, wl).r(x0 + 85, y0 + 33, 10, 1, wl).r(x0 + 84, y0 + 14, 1, 20, wl);
        R(x0 - 3, y0 + 19, 3, 10, "#d8d8d0").r(x0 + 95, y0 + 19, 3, 10, "#d8d8d0");
        fence(x0 - 5, y0 - 6, 105, 60, "#6a6c70");
        for (const [lx, ly] of [ [ x0 - 6, y0 - 8 ], [ x0 + 100, y0 - 8 ], [ x0 - 6, y0 + 54 ], [ x0 + 100, y0 + 54 ] ]) {
          R(lx, ly, 2, 3, "#5a5c60");
          R(lx - 1, ly - 1, 4, 1, "#8a8c90");
          if (far) {
            Gr(lx - 1, ly - 1, 4, 2, "#ffffff");
            Ge(lx, ly + 2, 14, 8, "rgba(230,240,255,0.08)");
          }
        }
        if (far) {
          Ge(x0 + 47, y0 + 24, 50, 26, "rgba(230,245,255,0.07)");
          for (let k = 0; k < 10; k++) ppl(x0 + 6 + q.i(83), y0 + 4 + q.i(40));
        } else {
          for (let k = 0; k < 3; k++) ppl(x0 + 6 + q.i(83), y0 + 4 + q.i(40));
          E(x0 + 30, y0 + 30, 2, 2, "#e8e4d8");
          blood(x0 + 60, y0 + 20);
          R(x0 + 70, y0 + 52, 6, 3, "#3a5a8a");
        }
        break;
      }

     case "pool":
      {
        R(4, 4, w - 8, 72, "#bcb4a4");
        for (let x = 4; x < w - 4; x += 6) R(x, 4, 1, 72, "#aca494");
        for (let y = 4; y < 76; y += 6) R(4, y, w - 8, 1, "#aca494");
        const px0 = 12, py0 = 10;
        R(px0 - 2, py0 - 2, 124, 64, "#e8e4d8");
        if (far) {
          R(px0, py0, 120, 60, "#2a7ab8");
          for (let y = py0 + 8; y < py0 + 60; y += 10) for (let x = px0 + 2; x < px0 + 118; x += 3) D(x, y, x >> 1 & 1 ? "#c84a3a" : "#e8e4d8");
          for (let k = 0; k < 40; k++) D(px0 + q.i(120), py0 + q.i(60), q.pick([ "#4a9ad8", "#3a8ac8", "#6ab8e8" ]));
          Gr(px0, py0, 120, 60, "rgba(80,180,255,0.14)");
          for (let k = 0; k < 8; k++) Gr(px0 + 6 + k * 15, py0 + 1, 2, 1, "#c8f0ff");
          for (let k = 0; k < 6; k++) ppl(px0 + 6 + q.i(108), py0 + 6 + q.i(48));
        } else {
          R(px0, py0, 120, 60, "#8aa0a4");
          for (let y = py0 + 9; y < py0 + 60; y += 10) R(px0 + 2, y, 116, 1, "#4a6a8a");
          R(px0, py0, 120, 2, "#6a8488");
          E(px0 + 28, py0 + 48, 22, 9, "#3e5a44");
          E(px0 + 26, py0 + 47, 16, 6, "#466a4c");
          for (let k = 0; k < 10; k++) E(px0 + 8 + q.i(104), py0 + 6 + q.i(48), 2 + q.i(4), 1, "rgba(60,64,58,0.5)");
          R(px0 + 70, py0 + 30, 6, 3, "#c8c4b8");
          R(px0 + 90, py0 + 14, 4, 2, "#3a5a8a");
          R(px0 + 50, py0 + 20, 2, 5, "#6a4a2a");
          ppl(px0 + 84, py0 + 40);
          blood(px0 + 60, py0 + 44);
        }
        const kx = 162, ky = 26;
        E(kx, ky, 20, 13, "#e8e4d8");
        E(kx, ky, 18, 11, far ? "#3a92c8" : "#8aa4a8");
        if (far) Ge(kx, ky, 18, 11, "rgba(80,190,255,0.12)"); else E(kx - 4, ky + 3, 8, 4, "#466a4c");
        R(142, 50, 40, 22, "rgba(0,0,0,0.3)");
        for (let k = 0; k < 38; k += 6) R(140 + k, 46, 3, 20, far ? "#e8e4d8" : "#c8c4b8").r(143 + k, 46, 3, 20, "#3a7ab8");
        if (!far) {
          R(146, 58, 14, 10, "#2a2c30");
          L(140, 46, 156, 62, "#5a5c60");
        }
        R(w - 40, 6, 32, 22, "#8a8a86").r(w - 40, 6, 32, 1, "#aaaaa6").r(w - 40, 28, 32, 10, "#c8c4b8").r(w - 36, 30, 6, 8, "#3a5a8a").r(w - 22, 30, 6, 8, "#a83a3a");
        if (far) {
          Gr(w - 36, 30, 6, 3, "#fff0d0");
          Gr(w - 22, 30, 6, 3, "#fff0d0");
        } else R(w - 36, 30, 6, 8, "#141618");
        for (let k = 0; k < 9; k++) {
          const x = px0 + 4 + k * 13, y = 72;
          if (!far && k % 3 === 1) {
            R(x + 2, y - 1, 3, 7, "#d8d4cc");
            continue;
          }
          R(x, y, 7, 3, "#e8e4d8").r(x, y, 2, 3, "#c84a3a");
        }
        R(px0 + 122, py0 + 20, 3, 8, "#e8e4d8").r(px0 + 121, py0 + 19, 5, 2, "#c84a3a");
        fence(2, 2, w - 4, 76);
        lampP(6, 40);
        lampP(w - 8, 44);
        break;
      }

     case "lot":
      {
        R(2, 4, w - 4, 72, "#2a2b2f");
        P.noise(mx(2), my(4), sz(w - 4), sz(72), [ "#323337", "#26272a" ], .06, q);
        R(2, 4, w - 4, 1, "#5a5a56").r(2, 75, w - 4, 1, "#5a5a56");
        const n = Math.floor((w - 8) / 7);
        for (let k = 0; k <= n; k++) {
          R(4 + k * 7, 6, 1, 13, "#8a8a80");
          R(4 + k * 7, 61, 1, 13, "#8a8a80");
        }
        for (let k = 0; k < n; k++) for (const yy of [ 7, 62 ]) if (q.chance(far ? .6 : .42)) {
          const st = far ? 0 : q.pick([ 0, 0, 1, 1, 2, 3, 3 ]);
          miniCar(P, Math.round(mx(5 + k * 7)), Math.round(my(yy)), false, q.pick(CARN), st, yy > 30);
        }
        for (let x = 12; x < w - 12; x += 24) {
          R(x, 38, 8, 1, "#c8c4b8");
          R(x + 6, 37, 2, 3, "#c8c4b8");
        }
        if (!far) for (let k = 0; k < 2; k++) {
          const x = 10 + q.i(w - 30);
          miniCar(P, Math.round(mx(x)), Math.round(my(34)), true, q.pick(CARN), q.pick([ 2, 3 ]), q.chance(.5));
          if (q.chance(.5)) E(x + 6, 40, 9, 3, "rgba(20,16,14,0.5)");
        }
        R(w - 16, 30, 10, 9, "#c8c4b8").r(w - 16, 30, 10, 2, "#2e6aa8").r(w - 14, 33, 5, 3, far ? "#f8ecc8" : "#1c232c");
        R(w - 18, 37, 2, 2, "#c8a830");
        if (far) {
          Gr(w - 14, 33, 5, 3, "#fff0d0");
          lampP(4, 30);
          lampP(w >> 1, 30);
        } else {
          ppl(w >> 1, 46);
          ppl((w >> 1) + 9, 48);
          blood(w >> 2, 44);
          junk(30, 48);
          junk(60, 30);
        }
        break;
      }

     case "lawn":
      {
        for (let k = 0, n = 4 + (w >> 4); k < n; k++) Tr(6 + q.i(w - 12), 6 + q.i(68), 3 + q.i(4));
        for (let k = 0, n = 2 + (w >> 5); k < n; k++) {
          const x = 8 + q.i(w - 30), y = 12 + q.i(50), c = q.pick([ "#3a6ac8", "#d8b040", "#c84a3a", "#e8e4d8", "#3a8a6a" ]);
          R(x, y, 14, 9, c);
          for (let yy = 1; yy < 9; yy += 3) R(x, y + yy, 14, 1, A.shade(c, .25));
          if (q.chance(.6)) R(x + 3, y + 3, 3, 2, "#c8c4b8").r(x + 8, y + 4, 2, 2, "#3a7a3a");
          if (far) ppl(x + 5, y + 1, true);
        }
        for (let k = 0, n = 1 + (w >> 6); k < n; k++) {
          const x = 10 + q.i(w - 30), y = 20 + q.i(40), c = q.pick([ "#d84a3a", "#3a8ac8", "#e8c040", "#7a3a8a" ]);
          if (far || q.chance(.3)) {
            P.poly([ [ mx(x), my(y + 8) ], [ mx(x + 8), my(y) ], [ mx(x + 16), my(y + 8) ] ], c);
            R(x + 2, y + 8, 12, 2, "rgba(0,0,0,0.3)");
          } else {
            E(x + 8, y + 6, 8, 3, c);
            E(x + 8, y + 6, 6, 2, A.shade(c, -.3));
            L(x + 2, y + 3, x + 6, y + 8, "#2a2c30");
            junk(x + 18, y + 4);
          }
        }
        Bn(4, 72);
        Bn(w - 14, 4);
        lampP(w >> 1, 40);
        for (let k = 0; k < (far ? 5 : 4); k++) ppl(8 + q.i(w - 16), 10 + q.i(60));
        if (!far) {
          blood(w >> 1, 30);
          junk(12, 40);
          junk(w - 20, 60);
        }
        break;
      }

     case "wc":
      {
        R(10, 22, 30, 26, "rgba(0,0,0,0.35)").r(6, 18, 30, 18, "#7a7a76").r(6, 18, 30, 1, "#9a9a96").r(6, 36, 30, 10, "#c8c4b8").r(6, 45, 30, 1, "#8a867c");
        R(9, 38, 7, 8, "#2e4f8a").r(26, 38, 7, 8, "#a83a3a");
        D(12, 37, "#e8e4d8");
        D(29, 37, "#e8e4d8");
        R(18, 39, 6, 3, "#8aa0a4");
        if (far) {
          Gr(18, 39, 6, 3, "#e8f8ff");
          Ge(21, 44, 10, 5, "rgba(220,240,255,0.1)");
        } else {
          R(26, 38, 7, 8, "#121416");
          for (let k = 0; k < 6; k++) D(30 + k * 2, 48 + k, "rgba(80,18,14,0.7)");
        }
        Tr(38, 14, 4);
        Tr(4, 60, 3);
        lampP(36, 50);
        ppl(16, 56);
        if (!far) junk(8, 52);
        break;
      }

     case "bike":
      {
        R(4, 34, w - 8, 2, "#7a7c80").r(4, 33, w - 8, 1, "#9a9c9e");
        for (let x = 6, k = 0; x < w - 14; x += 5, k++) {
          const has = far ? q.chance(.8) : q.chance(.35);
          if (has) {
            L(x, 28, x, 40, "#3a8a4a");
            D(x, 27, "#2a2c30");
            D(x, 41, "#2a2c30");
            D(x + 1, 32, "#e8e4d8");
          }
        }
        if (!far) for (let k = 0; k < 4; k++) {
          const x = 8 + q.i(w - 24), y = 46 + q.i(20);
          L(x, y, x + 8, y + 2, "#3a8a4a");
          D(x, y, "#2a2c30");
          D(x + 8, y + 2, "#2a2c30");
        }
        R(w - 12, 22, 8, 12, "#3a8a4a").r(w - 12, 22, 8, 1, "#5aaa6a").r(w - 10, 25, 4, 3, far ? "#c8f0d8" : "#1c232c");
        if (far) Gr(w - 10, 25, 4, 3, "#e8fff0");
        Tr(6, 10, 4);
        Tr(w - 8, 66, 4);
        lampP(w >> 1, 12);
        ppl(20, 52);
        if (far) ppl(30, 44, true); else blood(40, 60);
        break;
      }

     case "tennis":
      {
        R(3, 5, w - 6, 70, "#3a6a4a");
        const cw = w - 16 >> 1;
        for (let k = 0; k < 2; k++) {
          const x = 6 + k * (cw + 4), y = 10, wl = "#e8e4d8";
          R(x, y, cw, 60, "#3a6a8a");
          R(x, y, cw, 1, wl).r(x, y + 59, cw, 1, wl).r(x, y, 1, 60, wl).r(x + cw - 1, y, 1, 60, wl);
          R(x + 4, y, 1, 60, wl).r(x + cw - 5, y, 1, 60, wl).r(x + 4, y + 16, cw - 8, 1, wl).r(x + 4, y + 43, cw - 8, 1, wl).r(x + (cw >> 1), y + 16, 1, 28, wl);
          R(x - 1, y + 29, cw + 2, 2, "#2a2c30").r(x - 1, y + 29, cw + 2, 1, "#e8e4d8");
        }
        fence(2, 3, w - 4, 74, "#5a7a5a");
        if (far) {
          lampP(2, 2);
          lampP(w - 3, 2);
          for (let k = 0; k < 4; k++) ppl(10 + q.i(w - 20), 14 + q.i(52), true);
          Ge(w >> 1, 40, w >> 1, 30, "rgba(230,245,255,0.05)");
        } else {
          E(30, 50, 1, 1, "#d8e040");
          E(60, 20, 1, 1, "#d8e040");
          ppl(40, 36);
          L(6 + cw - 10, 39, 6 + cw, 41, "#2a2c30");
        }
        break;
      }

     case "stage":
      {
        const cx = w >> 1;
        for (let r = 18; r <= 46; r += 6) for (let a = .15; a < Math.PI - .15; a += .08 / Math.max(1, r / 18)) D(cx + Math.cos(a) * r * 1.3, 24 + Math.sin(a) * r, r % 12 ? "#9a968a" : "#7a766c");
        R(cx - 24, 8, 48, 16, "#5a5048").r(cx - 24, 8, 48, 1, "#7a7068").r(cx - 24, 23, 48, 2, "#3a3430");
        E(cx, 8, 28, 7, "#d8d4cc");
        E(cx, 7, 24, 5, "#e8e4d8");
        for (let k = 0; k < 5; k++) R(cx - 20 + k * 10, 4, 1, 6, "#8a8c90");
        if (far) {
          for (const [c, x] of [ [ "#ff4ab0", -14 ], [ "#4ad0ff", 0 ], [ "#ffd070", 14 ] ]) {
            Gr(cx + x - 1, 9, 3, 2, c);
            Ge(cx + x, 16, 6, 4, "rgba(255,230,200,0.1)");
          }
          for (let k = 0; k < 12; k++) ppl(cx - 40 + q.i(80), 34 + q.i(30), true);
        } else {
          L(cx - 24, 8, cx - 10, 2, "#c8c4b8");
          for (let k = 0; k < 8; k++) junk(cx - 40 + q.i(80), 30 + q.i(34));
          for (let k = 0; k < 4; k++) ppl(cx - 30 + q.i(60), 34 + q.i(30));
          blood(cx - 10, 40);
        }
        Tr(6, 8, 5);
        Tr(w - 6, 10, 5);
        Tr(8, 70, 4);
        Tr(w - 8, 68, 4);
        lampP(10, 40);
        lampP(w - 10, 40);
        break;
      }

     case "camp":
      {
        for (let k = 0; k < 16; k++) {
          const a = k / 16 * Math.PI * 2, x = (w >> 1) + Math.cos(a) * (w / 2 - 8), y = 40 + Math.sin(a) * 32;
          const t = q.i(4);
          if (t === 0) R(x - 4, y - 2, 9, 4, q.pick(CARN)).r(x - 3, y - 1, 3, 2, "#1c2430"); else if (t === 1) R(x - 4, y - 1, 8, 3, "#8a6a40").r(x - 4, y, 8, 1, "#6a4a2a"); else if (t === 2) E(x, y, 2, 2, "#1e1e20"); else R(x - 3, y - 3, 6, 6, "#7a5a3a").r(x - 3, y - 3, 6, 1, "#9a7a58");
        }
        const fx = w >> 1, fy = 42;
        E(fx, fy + 1, 5, 3, "#3a3430");
        for (let k = 0; k < 6; k++) D(fx - 3 + q.i(7), fy - 1 + q.i(3), "#6a5a4a");
        E(fx, fy, 2, 1, "#ff9a3a");
        D(fx, fy - 1, "#ffd070");
        Ge(fx, fy, 16, 11, "rgba(255,140,60,0.12)");
        Ge(fx, fy, 7, 5, "rgba(255,170,80,0.22)");
        Gr(fx - 1, fy - 1, 3, 2, "#ffb060");
        Gr(fx, fy - 2, 1, 1, "#ffe0a0");
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2 + .4, x = fx + Math.cos(a) * 30, y = fy + Math.sin(a) * 18, c = q.pick([ "#3a6a4a", "#2e4f8a", "#c84a3a", "#8a7a40", "#5a5c60" ]);
          E(x, y, 7, 5, A.shade(c, -.3));
          E(x, y - 1, 6, 4, c);
          L(x - 6, y - 1, x + 6, y - 1, A.shade(c, .25));
          R(x - 1, y + 2, 3, 3, "#141618");
        }
        L(fx - 26, 18, fx + 20, 16, "#8a8a82");
        for (let k = 0; k < 5; k++) R(fx - 22 + k * 9, 17, 3, 4, q.pick([ "#e8e4d8", "#3a5a8a", "#c84a3a", "#d8b040" ]));
        for (let k = 0; k < 4; k++) {
          const a = k / 4 * Math.PI * 2 + 1, x = fx + Math.cos(a) * 9, y = fy + Math.sin(a) * 6;
          ppl(x, y - 3, true);
        }
        R(fx + 14, 54, 6, 4, "#3a5a8a");
        R(fx - 20, 56, 5, 5, "#6a6c70");
        R(fx - 18, 55, 1, 1, "#c8c4b8");
        R(fx + 22, 30, 4, 6, "#8a3a2a");
        break;
      }

     case "mil":
      {
        const mo = "#4a5838", md2 = "#3e4a2e", sb = (x, y, n, vt) => {
          for (let k = 0; k < n; k++) {
            const xx = vt ? x : x + k * 4, yy = vt ? y + k * 3 : y;
            E(xx, yy, 2, 1, "#a8946a");
            D(xx - 1, yy, "#c8b48a");
            D(xx + 1, yy + 1, "#8a7650");
          }
        };
        sb(6, 10, Math.floor((w - 12) / 4));
        sb(6, 14, Math.floor((w - 12) / 4));
        sb(6, 18, 2, true);
        sb(w - 8, 18, 2, true);
        sb(30, 60, 8);
        sb(30, 63, 8);
        for (let k = 0; k < 2; k++) {
          const x = 14 + k * 40, y = 26;
          R(x + 2, y + 2, 30, 18, "rgba(0,0,0,0.35)").r(x, y, 30, 16, mo).r(x, y, 30, 1, "#5a6848");
          for (let yy = 4; yy < 16; yy += 5) R(x, y + yy, 30, 1, md2);
          R(x + 12, y + 14, 6, 3, "#1a1c18");
        }
        const tx = w - 30, ty2 = 30;
        R(tx + 2, ty2 + 2, 14, 30, "rgba(0,0,0,0.4)").r(tx, ty2, 13, 28, md2).r(tx, ty2, 13, 8, mo).r(tx + 2, ty2 + 1, 9, 3, "#1c2430").r(tx + 1, ty2 + 10, 11, 17, "#56603e");
        for (let yy = ty2 + 12; yy < ty2 + 26; yy += 4) R(tx + 1, yy, 11, 1, md2);
        for (let x = 4; x < w - 4; x += 3) {
          D(x, 4, "#9a9a92");
          D(x + 1, 3, "#c8c8c0");
          D(x + 2, 5, "#6a6a62");
        }
        R(w >> 1, 66, 12, 7, "#d8d4cc").r((w >> 1) + 1, 67, 10, 2, "#c83a2a");
        R((w >> 1) + 5, 73, 1, 4, "#5a5c60");
        R(8, 66, 10, 6, "#4a5838").r(8, 66, 10, 1, "#5a6848");
        R(20, 68, 4, 4, "#3a3a30");
        for (let k = 0; k < 5; k++) D(26 + k * 2, 72, "#c8a830");
        for (let k = 0; k < 4; k++) {
          const x = 8 + q.i(w - 16), y = 40 + q.i(24);
          const px = Math.round(mx(x)), py = Math.round(my(y));
          P.r(px, py + 2, 2, 3, "#4a5838").r(px, py, 2, 2, "#7a8a6a").p(px + 2, py + 2, "#7a8a6a");
        }
        blood(40, 50);
        blood(70, 44);
        E(50, 56, 6, 2, "rgba(20,16,14,0.4)");
        break;
      }
    }
  }
  function hiTile(P, O, F, tx, ty, px, py, glow, g, k, v) {
    const rt = O.rt, U0 = O.GX * TS, wx = tx * TS, wy = ty * TS, c0 = wx - U0, X = P.x;
    let full = true;
    for (let c = 0; c < TS; c++) {
      const t = rt[c0 + c];
      if (t > wy || t + RH < wy + TS) {
        full = false;
        break;
      }
    }
    if (!full) {
      if (wy + 16 - rt[c0 + 16] < RH / 2) far(P, O, tx, ty, px, py, glow, k === K.FAR ? v : 0, g); else nearTile(P, O, tx, ty, px, py, glow);
    }
    for (let c = 0; c < TS; ) {
      const t = rt[c0 + c], si = Math.floor((wx + c) / SEGW);
      let e = c + 1;
      while (e < TS && rt[c0 + e] === t && Math.floor((wx + e) / SEGW) === si) e++;
      const sy0 = Math.max(0, wy - t), sy1 = Math.min(RH, wy + TS - t);
      if (sy1 > sy0) {
        const S = rseg(O, si), sx = wx + c - si * SEGW, dy = py + sy0 - (wy - t);
        if (glow) {
          X.clearRect(px + c, dy, e - c, sy1 - sy0);
          X.drawImage(S.gl, sx, sy0, e - c, sy1 - sy0, px + c, dy, e - c, sy1 - sy0);
        } else X.drawImage(S.c, sx, sy0, e - c, sy1 - sy0, px + c, dy, e - c, sy1 - sy0);
      }
      c = e;
    }
    const T = O.T;
    if (wx + TS > T.x0 && wx < T.x1 && wy + TS > T.y0 && wy < T.yb) tBody(P, O, tx, ty, px, py, glow);
    if (!glow) {
      const Bw = O.Bw, by = O.botY != null ? O.botY : Bw.y1;
      if (ty >= Bw.y0 && ty <= by) for (let c = 0; c < TS; c++) {
        const x = wx + c, d = x < Bw.x0 * TS ? Bw.x0 * TS - x : x >= (Bw.x1 + 1) * TS ? x - (Bw.x1 + 1) * TS + 1 : -1;
        if (d > 0 && d < 72) P.r(px + c, py, 1, TS, "rgba(0,0,0," + ((O.day ? .32 : .55) * (1 - d / 72)).toFixed(3) + ")");
      }
    }
  }
  function tBody(P, O, tx, ty, px, py, glow) {
    const T = O.T, wx = tx * TS, wy = ty * TS, X = P.x, y0 = Math.max(wy, Math.ceil(T.y0)), y1 = Math.min(wy + TS, Math.ceil(T.yb));
    for (let y = y0; y < y1; y++) {
      const yc = y + .5, sc = (T.vy - yc) / T.D, xl = T.cx - (T.cx - T.x0) * sc, xr = T.cx + (T.x1 - T.cx) * sc, a = Math.max(wx, Math.round(xl)), b = Math.min(wx + TS, Math.round(xr));
      if (b <= a) continue;
      const kf = (T.D / (T.vy - yc) - 1) / T.a, k = Math.floor(kf), f = kf - k, C = (O.day ? T.palD : T.pal)[Math.min(T.N, k)], fh = T.D * T.a / Math.pow(1 + T.a * kf, 2), ry = py + y - wy, ax = px + a - wx;
      const W0 = .32, W1 = .32 + .46, inW = fh >= 4 && f >= W0 && f < W1;
      if (glow) {
        X.clearRect(ax, ry, b - a, 1);
        if (inW) for (const xc of T.wc) {
          if (H32(xc, k, O.seed + 501) % 100 >= 3) continue;
          const cx = T.cx + (xc - T.cx) * sc, hw = 10 * sc, l = Math.max(a, Math.round(cx - hw)), r = Math.min(b, Math.round(cx + hw));
          if (r > l) P.r(px + l - wx, ry, r - l, 1, H32(xc, k, 7) & 1 ? "#ffd890" : "#f2c878");
        }
        continue;
      }
      const slab = f < (fh < 3 ? .5 : .2);
      P.r(ax, ry, b - a, 1, slab ? fh >= 8 && f * fh < 1 ? C.lt : C.slab : f < .27 && fh >= 4 ? C.dk : C.wall);
      if (!slab && fh >= 10 && f >= .2 && f < .24) P.r(ax, ry, b - a, 1, C.hl);
      if (!slab && fh >= 2) for (const xp of T.pil) {
        const x = Math.round(T.cx + (xp - T.cx) * sc);
        if (x >= a && x < b) P.p(px + x - wx, ry, C.pil);
      }
      if (inW) for (const xc of T.wc) {
        const cx = T.cx + (xc - T.cx) * sc, hw = 10 * sc, l = Math.max(a, Math.round(cx - hw)), r = Math.min(b, Math.round(cx + hw));
        if (r <= l) continue;
        const top = (f - W0) * fh < 1, bot = (W1 - f) * fh <= 1;
        if (top || bot) P.r(px + l - wx, ry, r - l, 1, bot ? C.lt : C.fr); else {
          P.r(px + l - wx, ry, r - l, 1, C.gl);
          if (r - l >= 3) {
            P.p(px + l - wx, ry, C.fr).p(px + r - 1 - wx, ry, C.fr);
            if ((f - W0) / (W1 - W0) < .4) P.r(px + l + 1 - wx, ry, Math.max(1, Math.round((r - l) * .3)), 1, C.hl);
          }
        }
      }
      if (Math.round(xl) >= wx && Math.round(xl) < wx + TS) P.p(px + Math.round(xl) - wx, ry, C.lt);
      if (Math.round(xr) - 1 >= wx && Math.round(xr) - 1 < wx + TS) P.p(px + Math.round(xr) - 1 - wx, ry, C.dk);
    }
  }
  function nearTile(P, O, tx, ty, px, py, glow) {
    const cj = tx - O.GX, rj = ty - O.GY;
    if (cj < 0 || rj < 0 || cj >= O.GW || rj >= O.GH) return;
    const cr = O.ncol[cj], rr = O.nrow[rj];
    if (cr || rr) {
      nRoad(P, O, tx, ty, px, py, glow, cr, rr, cj, rj);
      return;
    }
    const B = nBlock(O, cj, rj), wx = tx * TS, wy = ty * TS, X = P.x;
    X.save();
    X.beginPath();
    X.rect(px, py, TS, TS);
    X.clip();
    X.translate(px - wx, py - wy);
    for (const it of B.it) if (it.x1 > wx && it.x0 < wx + TS && it.y1 > wy && it.y0 < wy + TS) it.d(P, glow, wx, wy);
    X.restore();
  }
  function nRoad(P, O, tx, ty, px, py, glow, cr, rr, cj, rj) {
    const q = new SX.Rng(H32(tx, ty, O.seed + 409)), h = q.i(1e3), ex = px + 8 + q.i(14), ey = py + 8 + q.i(14);
    if (glow) {
      if (h < 4) P.oval(ex, ey, 10, 7, "rgba(255,120,40,0.13)").r(ex - 3, ey - 2, 6, 3, "#ff9a3a").r(ex - 1, ey - 3, 2, 1, "#ffd070"); else if (h < 8) P.p(ex + 2, ey + 2, "#fff6d8").oval(ex + 3, ey + 7, 3, 5, "rgba(255,246,216,0.1)");
      return;
    }
    const wx = tx * TS, wy = ty * TS, hz = rr && !cr, vt = cr && !rr, SW = "#6e6b63", SL = "#625f58", CB = "#9a968a", WL = "#b8b4a8", YL = "#a8902a";
    P.r(px, py, TS, TS, "#3a3b3f").noise(px, py, TS, TS, [ "#414246", "#333438", "#46474a" ], .07, q);
    const walkH = (y, hh, top) => {
      P.r(px, y, TS, hh, SW);
      for (let x = md(-wx, 4); x < TS; x += 4) P.r(px + x, y, 1, hh, SL);
      if (hh > 4) P.r(px, y + (hh >> 1), TS, 1, SL);
      P.r(px, top ? y + hh - 1 : y, TS, 1, CB).r(px, top ? y + hh : y - 1, TS, 1, "#26272a");
    }, walkV = (x, ww, lf) => {
      P.r(x, py, ww, TS, SW);
      for (let y = md(-wy, 4); y < TS; y += 4) P.r(x, py + y, ww, 1, SL);
      if (ww > 4) P.r(x + (ww >> 1), py, 1, TS, SL);
      P.r(lf ? x + ww - 1 : x, py, 1, TS, CB).r(lf ? x + ww : x - 1, py, 1, TS, "#26272a");
    }, dashH = (y, c) => {
      for (let x = md(-wx, 12); x < TS; x += 12) P.r(px + x, py + y, 6, 1, c);
    }, dashV = (x, c) => {
      for (let y = md(-wy, 12); y < TS; y += 12) P.r(px + x, py + y, 1, 6, c);
    };
    let lanes = [];
    if (hz) {
      if (rr === 1) {
        walkH(py, 4, true);
        walkH(py + 28, 4, false);
        dashH(15, WL);
        lanes = [ 7, 19 ];
      } else if (rr === 2) {
        walkH(py, 8, true);
        dashH(20, WL);
        P.r(px, py + 29, TS, 1, YL).r(px, py + 31, TS, 1, YL);
        lanes = [ 11, 22 ];
      } else {
        P.r(px, py, TS, 1, YL).r(px, py + 2, TS, 1, YL);
        dashH(12, WL);
        walkH(py + 24, 8, false);
        lanes = [ 4, 15 ];
      }
      if (md(tx, 4) === 0) {
        const ly = rr === 3 ? py + 26 : py + 1;
        P.r(px + 14, ly, 2, 3, "#2a2c30").r(px + 13, ly + (rr === 3 ? 3 : -1), 4, 1, "#4a4c50");
      }
    } else if (vt) {
      if (cr === 1) {
        walkV(px, 4, true);
        walkV(px + 28, 4, false);
        dashV(15, WL);
        lanes = [ 7, 19 ];
      } else if (cr === 2) {
        walkV(px, 8, true);
        dashV(20, WL);
        P.r(px + 29, py, 1, TS, YL).r(px + 31, py, 1, TS, YL);
        lanes = [ 11, 22 ];
      } else {
        P.r(px, py, 1, TS, YL).r(px + 2, py, 1, TS, YL);
        dashV(12, WL);
        walkV(px + 24, 8, false);
        lanes = [ 4, 15 ];
      }
      if (md(ty, 4) === 0) {
        const lx = cr === 3 ? px + 26 : px + 1;
        P.r(lx, py + 14, 3, 2, "#2a2c30").r(lx + (cr === 3 ? 3 : -1), py + 13, 1, 4, "#4a4c50");
      }
    } else {
      const zb = (x, y, w2, h2, hzz) => {
        if (hzz) for (let k = 2; k < TS - 1; k += 4) P.r(px + k, y, 2, h2, WL); else for (let k = 2; k < TS - 1; k += 4) P.r(x, py + k, w2, 2, WL);
      };
      if (rj > 0 && !O.nrow[rj - 1]) zb(0, py + 1, 0, 7, true);
      if (rj < O.GH - 1 && !O.nrow[rj + 1]) zb(0, py + 24, 0, 7, true);
      if (cj > 0 && !O.ncol[cj - 1]) zb(px + 1, 0, 7, 0, false);
      if (cj < O.GW - 1 && !O.ncol[cj + 1]) zb(px + 24, 0, 7, 0, false);
      lanes = [ 8, 19 ];
    }
    const hzC = hz || !vt && q.chance(.5);
    if (h < 4) {
      miniCar(P, ex - 5, ey - 2, true, q.pick(CARN), 3, q.chance(.5));
      P.oval(ex, ey + 2, 9, 3, "rgba(20,16,14,0.45)");
      return;
    }
    if (h < 8) {
      P.r(ex + 1, ey + 3, 2, 3, "#3a4a5a").r(ex + 1, ey + 1, 2, 2, "#d8b090");
      return;
    }
    if (h < 150) {
      const ln = q.pick(lanes), a = 2 + q.i(TS - 15), st = q.pick([ 0, 1, 1, 2, 2, 3 ]);
      if (hzC) miniCar(P, px + a, py + ln, true, q.pick(CARN), st, q.chance(.5)); else miniCar(P, px + ln, py + a, false, q.pick(CARN), st, q.chance(.5));
      if (h < 50) {
        if (hzC) miniCar(P, px + a + 7, py + ln - 6, false, q.pick(CARN), 2, true); else miniCar(P, px + ln + 6, py + a + 7, true, q.pick(CARN), 2, false);
        for (let k = 0; k < 6; k++) P.p(px + a + q.i(16), py + ln + q.i(10) - 2, q.pick([ "#c8d4dc", "#9a9a92", "#c8c8c0" ]));
      }
      if (st === 3) P.oval(px + (hzC ? a + 5 : ln + 2), py + (hzC ? ln + 2 : a + 5), 8, 4, "rgba(20,16,14,0.35)");
      return;
    }
    if (h < 230) {
      for (let k = 0; k < 4 + q.i(6); k++) P.p(px + 3 + q.i(26), py + 3 + q.i(26), q.pick([ "#c8d4dc", "#9a9a92", "#5a5c60", "#c8b040" ]));
      return;
    }
    if (h < 300) {
      const x = px + 6 + q.i(18), y = py + 6 + q.i(18);
      P.oval(x, y, 4 + q.i(3), 1 + q.i(2), "rgba(80,18,14,0.6)");
      for (let k = 0; k < 4; k++) P.p(x - 6 + q.i(13), y - 3 + q.i(7), "rgba(86,20,16,0.7)");
      return;
    }
    if (h < 345) {
      for (let z = 0, n = 3 + q.i(5); z < n; z++) {
        const x = px + 2 + q.i(26), y = py + 2 + q.i(24);
        P.r(x + 1, y + 4, 2, 1, "rgba(0,0,0,0.35)").r(x, y + 2, 2, 3, q.pick([ "#4a5040", "#5a5a48", "#3e4636" ])).r(x, y, 2, 2, "#7a8a6a").p(x + 2, y + 2, "#7a8a6a");
      }
      return;
    }
    if (h < 380) {
      const x = px + 4 + q.i(20), y = py + 4 + q.i(20);
      P.r(x, y, 5 + q.i(4), 3, q.pick([ "#3a5a8a", "#6a4a2a", "#8a3a3a", "#c8c4b8" ])).r(x, y, 5, 1, "#d8d4cc");
    }
  }
  const SOSF = [ "111100111001111", "111101101101111" ];
  function sosAt(x, y, w, h, s) {
    if (w < 17 || h < 9 || H32(x, y, s + 9) % 100 >= 4) return null;
    return [ x + 2 + md(H32(x, y, s + 10), w - 15), y + 2 + md(H32(x, y, s + 12), h - 8) ];
  }
  function sosTiny(P, sx, sy, s) {
    for (let i = 0; i < 3; i++) {
      const f = SOSF[i === 1 ? 1 : 0];
      for (let j = 0; j < 15; j++) if (f[j] === "1" && H32(sx + i * 4 + j, sy, s + 14) % 6) P.p(sx + i * 4 + j % 3, sy + (j / 3 | 0), "rgba(214,210,196,0.5)");
    }
  }
  function nBld(P, x, y, w, h, fh, o, glow) {
    const s = o.s, fy = y + h, burnt = o.burnt, kd = o.kind;
    if (glow) {
      if (burnt) return;
      const sg = sosAt(x, y, w, h, s);
      if (sg && H32(sg[0], sg[1], s) & 1) P.r(sg[0] + 11, sg[1] + 1, 4, 3, "rgba(220,235,255,0.1)").p(sg[0] + 12, sg[1] + 2, "#eef4ff");
      if (kd === "glass") return;
      for (let wy = fy + 2; wy + 2 <= fy + fh - 1; wy += 4) for (let wx = x + 2; wx + 2 <= x + w - 1; wx += 4) if (H32(wx, wy, s) % 100 < 3) P.r(wx - 1, wy - 1, 4, 4, "rgba(255,210,140,0.12)").r(wx, wy, 2, 2, H32(wx, wy, s + 1) & 1 ? "#ffd890" : "#f2c878");
      {
        const nx = w >= 5 ? (w - 5 >> 2) + 1 : 0, ny = fh >= 5 ? (fh - 5 >> 2) + 1 : 0, ht = H32(x, y, s + 11);
        if (nx && ny && ht % 100 < 2) {
          const wx = x + 2 + 4 * md(ht >> 8, nx), wy = fy + 2 + 4 * md(ht >> 16, ny);
          P.r(wx - 1, wy - 1, 4, 3, "rgba(220,235,255,0.1)").p(wx + (ht >> 24 & 1), wy, "#eef4ff");
        }
      }
      return;
    }
    const q = new SX.Rng(s), wc = burnt ? "#2a2522" : o.c, rf = burnt ? "#1e1a18" : o.rf, R = A.ramp(wc), gc = burnt ? "#0c0a08" : "#1e2630";
    P.r(x + 3, y + 3, w, h + fh, "rgba(0,0,0,0.4)");
    P.r(x, fy, w, fh, wc).r(x, fy, w, 1, R[1]).r(x, fy + fh - 1, w, 1, R[0]).r(x, fy, 1, fh, R[4]).r(x + w - 1, fy, 1, fh, R[1]);
    if (kd === "glass") {
      P.r(x + 1, fy + 1, w - 2, fh - 2, "#2e3e4e");
      for (let wy = fy + 2; wy < fy + fh - 1; wy += 3) P.r(x + 1, wy, w - 2, 1, "#40505e");
      for (let wx = x + 3; wx < x + w - 1; wx += 4) P.r(wx, fy + 1, 1, fh - 2, "#1e2a36");
    } else {
      for (let wy = fy + 2; wy + 2 <= fy + fh - 1; wy += 4) {
        for (let wx = x + 2; wx + 2 <= x + w - 1; wx += 4) P.r(wx, wy, 2, 2, gc);
        if (kd === "apt") P.r(x + 1, wy + 2, w - 2, 1, R[4]);
      }
    }
    if (o.sign && fh >= 6) {
      P.r(x + 1, fy + 1, w - 2, 3, burnt ? "#141210" : A.shade(o.sign, -.3));
      for (let k = x + 3; k < x + w - 3; k += 4) P.p(k, fy + 2, burnt ? "#2a2420" : A.shade(o.sign, .3));
      const sy = fy + fh - 5;
      P.r(x + 2, sy, w - 4, 4, burnt ? "#141210" : "#6a6c70");
      for (let k = sy; k < sy + 4; k += 2) P.r(x + 2, k, w - 4, 1, burnt ? "#0a0806" : "#54565a");
      if (!burnt && q.chance(.4)) P.r(x + 4 + q.i(Math.max(1, w - 12)), sy, 5, 4, "#141618");
    } else if (fh >= 6 && kd !== "apt" && kd !== "glass") P.r(x + (w >> 1) - 1, fy + fh - 4, 3, 3, burnt ? "#0a0806" : "#3a2e24");
    if (o.stripe) P.r(x, fy, w, 2, o.stripe);
    P.r(x, y, w, h, rf).noise(x + 1, y + 1, w - 2, h - 2, [ A.shade(rf, .08), A.shade(rf, -.1) ], .06, q);
    P.r(x, y, w, 1, A.shade(rf, .3)).r(x, y, 1, h, A.shade(rf, .15)).r(x + w - 1, y, 1, h, A.shade(rf, -.3)).r(x, y + h - 1, w, 1, A.shade(rf, -.35)).r(x + 1, y + 1, w - 2, 1, A.shade(rf, -.12));
    if (burnt) {
      for (let k = 0, n = 2 + (w * h >> 7); k < n; k++) P.r(x + 1 + q.i(Math.max(1, w - 5)), y + 1 + q.i(Math.max(1, h - 4)), 2 + q.i(4), 1 + q.i(3), "#0a0806");
      for (let k = 0; k < 4; k++) P.p(x + 1 + q.i(w - 2), y + 1 + q.i(h - 2), "#5a2a10");
      P.r(x, fy, w, 2, "#141210");
      return;
    }
    {
      const sg = sosAt(x, y, w, h, s);
      if (sg) sosTiny(P, sg[0], sg[1], s);
    }
    const spot = (ww, hh) => [ x + 2 + q.i(Math.max(1, w - ww - 4)), y + 2 + q.i(Math.max(1, h - hh - 4)) ];
    if (w >= 18 && h >= 12 && q.chance(.7)) {
      const [a, b] = spot(6, 6), c = q.pick([ "#3a6aa8", "#6a7a8a", "#c8c4b8", "#3a7a5a" ]);
      P.r(a + 1, b + 1, 6, 6, "rgba(0,0,0,0.35)").oval(a + 2, b + 2, 2, 2, c).p(a + 1, b + 1, A.shade(c, .35));
    }
    for (let k = 0, n = 1 + (w * h / 260 | 0); k < n; k++) {
      const [a, b] = spot(3, 2);
      P.r(a, b, 3, 2, "#9a9c9e").p(a + 1, b, "#5a5c60");
    }
    if ((kd === "villa" || kd === "apt" || kd === "shop") && w >= 24) {
      const [a, b] = spot(7, 5);
      P.r(a + 1, b + 1, 7, 7, "rgba(0,0,0,0.3)").r(a, b, 7, 4, A.shade(rf, .18)).r(a, b + 4, 7, 3, wc).r(a + 2, b + 4, 2, 3, "#2a2420");
    }
    if (q.chance(.3) && w >= 16) {
      const [a, b] = spot(6, 4);
      P.r(a, b, 4 + q.i(6), 3 + q.i(3), "#4a6a3a");
      P.p(a + 1, b + 1, "#6a8a4a");
    }
    if (q.chance(.18) && w >= 20) {
      const [a, b] = spot(8, 5);
      P.r(a, b, 8, 5, "#2a3a5a");
      for (let k = a + 2; k < a + 8; k += 2) P.r(k, b, 1, 5, "#4a5a7a");
      P.r(a, b + 2, 8, 1, "#4a5a7a");
    }
    if (q.chance(.25)) {
      const [a, b] = spot(2, 2);
      P.p(a, b, q.pick([ "#c8c4b8", "#3a5a8a", "#8a3a3a", "#c8b040" ]));
    }
    if (kd === "apt") for (let k = x + 20 + q.i(30); k < x + w - 14; k += 40 + q.i(30)) {
      P.r(k + 1, y + 4, 10, 8, "rgba(0,0,0,0.3)").r(k, y + 3, 10, 6, A.shade(rf, .2)).r(k, y + 9, 10, 3, wc);
      P.r(k + 2, y + 1, 1, 3, "#5a5c60");
    }
  }
  const NZ = [ [ "res", 28 ], [ "apt", 16 ], [ "comm", 10 ], [ "park", 6 ], [ "school", 5 ], [ "market", 5 ], [ "church", 4 ], [ "constr", 4 ], [ "hill", 5 ], [ "gas", 3 ], [ "farm", 4 ], [ "burnt", 10 ] ];
  const NGR = {
    res: "#4a4945",
    apt: "#46453f",
    comm: "#4a4a48",
    park: "#384a30",
    school: "#46453f",
    market: "#4a4640",
    church: "#46453f",
    constr: "#5a4c3a",
    hill: "#24331f",
    gas: "#444446",
    farm: "#4a3e2e",
    burnt: "#2e2a27",
    base: "#4e4c46"
  };
  function nBlock(O, cj, rj) {
    const bi = O.ncb[2][cj], bj = O.nrb[2][rj], key = bi * 4096 + bj;
    let B = O.nbk.get(key);
    if (B) return B;
    const X0 = (O.ncb[0][cj] + O.GX) * TS, X1 = (O.ncb[1][cj] + O.GX + 1) * TS, Y0 = (O.nrb[0][rj] + O.GY) * TS, Y1 = (O.nrb[1][rj] + O.GY + 1) * TS, BW = X1 - X0, BH = Y1 - Y0;
    const q = new SX.Rng(H32(bi, bj, O.seed + 401)), T = O.T, sd = O.seed, it = [];
    let z = "res";
    {
      let hh = q.i(100);
      for (const [n, p] of NZ) {
        if (hh < p) {
          z = n;
          break;
        }
        hh -= p;
      }
    }
    if (T.cx >= X0 && T.cx < X1 && T.yb >= Y0 - TS && T.yb < Y1) z = "base"; else if (BW < 96 || BH < 80) z = q.chance(.5) ? "park" : "burnt";
    const add = (x0, y0, x1, y1, zz, d) => it.push({
      x0,
      y0,
      x1,
      y1,
      z: zz,
      d
    }), gnd = (zz, x0, y0, x1, y1, d) => add(x0, y0, x1, y1, -1e8 + zz, d);
    const gc = NGR[z];
    add(X0, Y0, X1, Y1, -1e9, (P, gl, wx, wy) => {
      if (gl) return;
      const r = new SX.Rng(H32(wx, wy, sd + 403));
      P.r(wx, wy, TS, TS, gc).noise(wx, wy, TS, TS, [ A.shade(gc, .07), A.shade(gc, -.1) ], .08, r);
      if (r.chance(.08)) P.p(wx + r.i(TS), wy + r.i(TS), r.pick([ "#c8c4b8", "#5a2a20", "#3a5a8a" ]));
    });
    const bld = (x, y, w, h, fh, o) => {
      o.s = o.s || q.i(1e9);
      add(x, y, x + w + 4, y + h + fh + 4, y + h + fh, (P, gl) => nBld(P, x, y, w, h, fh, o, gl));
    };
    const tr = (x, y, r) => {
      const c = q.pick(TRC);
      add(x - r - 1, y - r - 1, x + r + 3, y + r + 3, y + r, (P, gl) => {
        if (!gl) tree(P, x, y, r, c);
      });
    };
    const car = (x, y, hz, st) => {
      const c = q.pick(CARN), fw = q.chance(.5);
      gnd(2, x - 2, y - 2, x + 14, y + 14, (P, gl) => {
        if (!gl) miniCar(P, x, y, hz, c, st, fw);
      });
    };
    const zg = (x, y, n) => {
      const s2 = q.i(1e9);
      gnd(3, x - 2, y - 2, x + 22, y + 14, (P, gl) => {
        if (gl) return;
        for (let k = 0; k < n; k++) {
          const a = x + md(H32(k, 1, s2), 20), b = y + md(H32(k, 2, s2), 10);
          P.r(a + 1, b + 4, 2, 1, "rgba(0,0,0,0.35)").r(a, b + 2, 2, 3, [ "#4a5040", "#5a5a48", "#3e4636" ][md(H32(k, 3, s2), 3)]).r(a, b, 2, 2, "#7a8a6a").p(a + 2, b + 2, "#7a8a6a");
        }
      });
    };
    const blood = (x, y) => {
      const r = 3 + q.i(4);
      gnd(1, x - r - 6, y - 5, x + r + 7, y + 6, (P, gl) => {
        if (gl) return;
        P.oval(x, y, r, 1 + (r >> 2), "rgba(80,18,14,0.6)");
        P.p(x - r - 3, y + 1, "rgba(86,20,16,0.7)").p(x + r + 2, y - 2, "rgba(86,20,16,0.7)");
      });
    };
    const forest = (x0, y0, x1, y1, sp, dens, r0, r1, skip) => {
      const s2 = q.i(1e9);
      add(x0 - r1 - 2, y0 - r1 - 2, x1 + r1 + 4, y1 + r1 + 4, -5e5, (P, gl, wx, wy) => {
        if (gl) return;
        const i0 = Math.max(0, Math.floor((wx - r1 - 4 - x0) / sp) - 1), i1 = Math.floor((wx + TS + r1 + 2 - x0) / sp), j0 = Math.max(0, Math.floor((wy - r1 - 4 - y0) / sp) - 1), j1 = Math.floor((wy + TS + r1 + 2 - y0) / sp);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const hh = H32(i, j, s2);
          if (md(hh, 100) >= dens * 100) continue;
          const x = x0 + i * sp + md(hh >> 8, sp), y = y0 + j * sp + md(hh >> 12, sp);
          if (x > x1 || y > y1 || skip && skip(x, y)) continue;
          tree(P, x, y, r0 + md(hh >> 16, r1 - r0 + 1), TRC[md(hh >> 20, 5)]);
        }
      });
    };
    const patch = (x, y, w, h, c, zz) => gnd(zz || 0, x, y, x + w, y + h, (P, gl) => {
      if (!gl) P.r(x, y, w, h, c);
    });
    const lotRow = (x, y, w, dn, pc) => {
      gnd(1, x, y, x + w, y + 13, (P, gl) => {
        if (gl) return;
        P.r(x, y, w, 13, "#3a3b3f");
        for (let k = 0; k * 7 <= w - 1; k++) P.r(x + k * 7, dn ? y : y + 1, 1, 12, "#7a786e");
      });
      for (let k = 0; (k + 1) * 7 <= w; k++) if (q.chance(pc)) car(x + 1 + k * 7, y + 1, false, q.pick([ 0, 0, 1, 1, 2, 3 ]));
    };
    switch (z) {
     case "res":
     case "burnt":
      {
        const bz = z === "burnt";
        for (let y = Y0 + 4; y < Y1 - 24; ) {
          const rh = q.ri(24, 36);
          for (let x = X0 + 4 + q.i(6); x < X1 - 18; ) {
            const vl = q.chance(.3), w = vl ? q.ri(30, 46) : q.ri(16, 30), h = vl ? q.ri(20, 28) : q.ri(14, 22), fh = vl ? q.ri(10, 14) : q.ri(5, 10);
            if (x + w > X1 - 4) break;
            const yy = y + q.i(Math.max(1, rh - h - fh + 6));
            if (yy + h + fh > Y1 - 4) {
              x += w;
              continue;
            }
            if (q.chance(.08)) {
              patch(x, yy, w, h + fh, q.chance(.5) ? "#4a5a36" : "#5a4a34");
              for (let k = 0; k < 3; k++) patch(x + 2, yy + 3 + k * 5, w - 4, 1, "#3a4a2a", 1);
              x += w + q.ri(3, 8);
              continue;
            }
            bld(x, yy, w, h, fh, {
              c: q.pick(WALLC),
              rf: q.pick(ROOFC),
              burnt: bz ? q.chance(.8) : q.chance(.06),
              kind: vl ? "villa" : "house"
            });
            if (q.chance(.3)) tr(x + w + 2, yy + 4 + q.i(h), 3 + q.i(2));
            x += w + q.ri(3, 9);
          }
          const ay = y + rh + 6;
          for (let k = 0, n = Math.floor(BW / 70); k < n; k++) if (q.chance(.45)) car(X0 + 6 + q.i(BW - 20), ay - 3, true, q.pick([ 0, 1, 2, 3 ]));
          if (q.chance(.25)) zg(X0 + 10 + q.i(BW - 40), ay - 6, 3 + q.i(4));
          if (q.chance(.35)) blood(X0 + 10 + q.i(BW - 20), ay);
          y += rh + q.ri(6, 10);
        }
        if (bz) for (let k = 0; k < 6; k++) {
          const x = X0 + 10 + q.i(BW - 20), y = Y0 + 10 + q.i(BH - 20), s2 = q.i(1e9);
          add(x - 12, y - 10, x + 14, y + 10, 1e6, (P, gl) => {
            if (gl) return;
            const r = new SX.Rng(s2);
            for (let n = 0; n < 8; n++) P.p(x - 8 + r.i(16), y - 4 + r.i(8), r.pick([ "#141210", "#3a3430", "#5a2a10" ]));
            P.oval(x + 3, y - 4, 7, 4, "rgba(40,38,36,0.35)");
          });
        }
        break;
      }

     case "apt":
      {
        const col = q.pick([ "#c4bcac", "#bab4a8", "#c8c0b4", "#b0aca4" ]), stp = q.pick([ "#5a7aa8", "#a85a4a", "#4a8a6a", "#c8a040" ]);
        let y = Y0 + 10;
        for (;y + 70 < Y1 - 8; ) {
          const w = Math.min(BW - 20, q.ri(150, 280));
          if (w < 70) break;
          const h = q.ri(22, 28), fh = q.ri(32, 46);
          if (y + h + fh + 20 > Y1 - 6) break;
          const x = X0 + 10 + q.i(Math.max(1, BW - 20 - w));
          bld(x, y, w, h, fh, {
            c: col,
            rf: "#7a7a76",
            kind: "apt",
            stripe: stp,
            burnt: q.chance(.05)
          });
          const py2 = y + h + fh + 6;
          lotRow(x, py2, w, false, .5);
          for (let k = x + 6; k < x + w - 4; k += 14 + q.i(8)) tr(k, py2 + 20, 3 + q.i(2));
          if (q.chance(.5)) zg(x + q.i(Math.max(1, w - 30)), py2 - 5, 4 + q.i(5));
          if (q.chance(.4)) blood(x + q.i(w), py2 - 2);
          y = py2 + 28 + q.ri(4, 12);
        }
        if (Y1 - y > 46 && BW > 80) {
          const x = X0 + 20 + q.i(Math.max(1, BW - 90));
          patch(x, y, 50, 30, "#6a3c30");
          patch(x + 6, y + 6, 12, 10, "#c84a3a", 1);
          patch(x + 22, y + 8, 18, 3, "#2e7ac8", 1);
          patch(x + 30, y + 18, 14, 8, "#c8b080", 1);
          tr(x + 54, y + 6, 4);
        }
        break;
      }

     case "comm":
      {
        for (let y = Y0 + 4; y < Y1 - 30; ) {
          const rh = q.ri(30, 54);
          for (let x = X0 + 4; x < X1 - 30; ) {
            const gs = q.chance(.2), w = gs ? q.ri(60, 100) : q.ri(40, 90), h = gs ? q.ri(30, 40) : q.ri(18, 26), fh = gs ? q.ri(30, 40) : q.ri(10, 16);
            if (x + w > X1 - 4) break;
            if (y + h + fh > Y1 - 4) {
              x += w;
              continue;
            }
            if (q.chance(.12)) {
              lotRow(x, y + 4, w, true, .5);
              lotRow(x, y + 20, w, false, .4);
              x += w + q.ri(4, 10);
              continue;
            }
            bld(x, y, w, h, fh, gs ? {
              c: "#4a5664",
              rf: "#5a5c60",
              kind: "glass",
              burnt: q.chance(.06)
            } : {
              c: q.pick(WALLC),
              rf: q.pick([ "#6a6b67", "#878276", "#566270", "#5a5650" ]),
              kind: "shop",
              sign: q.pick([ "#ff4ab0", "#4ad0ff", "#ffb030", "#7aff6a", "#e84a3a", "#e8e4d8" ]),
              burnt: q.chance(.08)
            });
            x += w + q.ri(4, 10);
          }
          const ay = y + rh + 4;
          for (let k = 0, n = Math.floor(BW / 60); k < n; k++) if (q.chance(.5)) car(X0 + 6 + q.i(BW - 20), ay - 3, true, q.pick([ 0, 1, 2, 2, 3 ]));
          if (q.chance(.5)) zg(X0 + 10 + q.i(BW - 40), ay - 6, 4 + q.i(6));
          if (q.chance(.5)) blood(X0 + 10 + q.i(BW - 20), ay);
          y += rh + q.ri(8, 14);
        }
        break;
      }

     case "park":
      {
        const cx = X0 + (BW >> 1) + q.ri(-20, 20), cy = Y0 + (BH >> 1) + q.ri(-16, 16), pond = q.chance(.5), prx = Math.min(60, BW / 4 | 0), pry = Math.min(36, BH / 4 | 0), pc = "#7a7060";
        gnd(0, X0, cy - 3, X1, cy + 4, (P, gl) => {
          if (!gl) P.r(X0, cy - 3, BW, 6, pc).r(X0, cy - 3, BW, 1, "#8a8070");
        });
        gnd(0, cx - 3, Y0, cx + 4, Y1, (P, gl) => {
          if (!gl) P.r(cx - 3, Y0, 6, BH, pc).r(cx - 3, Y0, 1, BH, "#8a8070");
        });
        if (pond) gnd(1, cx - prx - 6, cy - pry - 6, cx + prx + 7, cy + pry + 7, (P, gl) => {
          if (gl) return;
          P.oval(cx, cy, prx + 3, pry + 3, "#6a6458").oval(cx, cy, prx, pry, "#1e2e3a").oval(cx - (prx >> 2), cy - (pry >> 2), prx >> 1, pry >> 2, "#24384a");
          P.r(cx - 4, cy - pry - 3, 8, pry * 2 + 6, "#6a5a44").r(cx - 4, cy - pry - 3, 1, pry * 2 + 6, "#8a7a60");
        }); else gnd(1, cx - 26, cy - 18, cx + 27, cy + 19, (P, gl) => {
          if (gl) return;
          P.oval(cx, cy, 26, 18, pc).oval(cx, cy, 22, 15, "#4a5a3a");
          P.oval(cx, cy, 6, 4, "#6a6a62").oval(cx, cy, 4, 3, "#2a3a44");
        });
        const px2 = X0 + 20 + q.i(Math.max(1, BW - 60)), py2 = Y0 + 16 + q.i(Math.max(1, BH - 60));
        add(px2 - 2, py2 - 2, px2 + 30, py2 + 28, py2 + 24, (P, gl) => {
          if (gl) return;
          P.r(px2 + 3, py2 + 3, 26, 22, "rgba(0,0,0,0.4)").r(px2 + 2, py2 + 16, 2, 8, "#5a3a28").r(px2 + 22, py2 + 16, 2, 8, "#5a3a28");
          P.r(px2, py2, 26, 18, "#5a3a32").r(px2 + 2, py2 + 2, 22, 14, "#6a4a3a").r(px2 + 12, py2, 2, 18, "#4a2e26").r(px2, py2 + 8, 26, 2, "#4a2e26").r(px2, py2, 26, 1, "#8a6a58").r(px2, py2 + 17, 26, 1, "#3a2420");
        });
        const skip = (x, y) => Math.abs(y - cy) < 8 || Math.abs(x - cx) < 8 || (pond ? ((x - cx) / (prx + 8)) ** 2 + ((y - cy) / (pry + 8)) ** 2 < 1 : ((x - cx) / 32) ** 2 + ((y - cy) / 24) ** 2 < 1) || x > px2 - 6 && x < px2 + 32 && y > py2 - 6 && y < py2 + 30;
        forest(X0 + 4, Y0 + 4, X1 - 4, Y1 - 4, 11, .62, 3, 6, skip);
        for (let k = 0; k < 6; k++) {
          const bx = X0 + 10 + q.i(BW - 30), by = cy + (k & 1 ? 6 : -7);
          gnd(2, bx, by - 1, bx + 9, by + 4, (P, gl) => {
            if (!gl) P.r(bx, by, 8, 2, "#6a4a30").r(bx, by, 8, 1, "#8a6a48").r(bx, by + 2, 8, 1, "rgba(0,0,0,0.35)");
          });
        }
        {
          const ex = cx + 12 + q.i(20), ey = cy + 10 + q.i(10);
          gnd(2, ex - 2, ey - 2, ex + 24, ey + 12, (P, gl) => {
            if (gl) return;
            P.r(ex, ey + 6, 22, 4, "#6a5a44");
            for (let k = 0; k < 4; k++) P.r(ex + 1 + k * 6, ey, 1, 7, "#d8b040").r(ex + k * 6, ey, 4, 1, "#c84a3a");
          });
        }
        zg(cx - 30 + q.i(40), cy - 8, 4 + q.i(5));
        blood(cx + q.ri(-30, 30), cy + 1);
        if (q.chance(.5)) zg(X0 + 10 + q.i(BW - 40), Y0 + 10 + q.i(BH - 30), 3 + q.i(3));
        break;
      }

     case "school":
      {
        const w = BW - 24, x = X0 + 12, by = Y0 + 10;
        bld(x, by, w, 20, 22, {
          c: "#c8b89a",
          rf: "#7a6a5a",
          kind: "villa"
        });
        const fy0 = by + 54, fx0 = X0 + 14, fw = BW - 28, fh2 = BH - (fy0 - Y0) - 14;
        if (fh2 > 40) gnd(0, fx0, fy0, fx0 + fw, fy0 + fh2, (P, gl) => {
          if (gl) return;
          P.r(fx0, fy0, fw, fh2, "#6a5440").noise(fx0, fy0, fw, fh2, [ "#725c46", "#62503c" ], .05, new SX.Rng(sd + 7));
          const cx = fx0 + (fw >> 1), cy = fy0 + (fh2 >> 1), rx = (fw >> 1) - 8, ry = (fh2 >> 1) - 6;
          for (let k = 0; k < 5; k++) P.ring(cx, cy, rx - k, ry - k, k === 0 || k === 4 ? "#d8d4cc" : "#8a4a3a");
          P.r(fx0 + 16, cy - 6, 2, 12, "#d8d8d0").r(fx0 + fw - 18, cy - 6, 2, 12, "#d8d8d0").r(cx, fy0 + 8, 1, fh2 - 16, "#a8a090");
          P.r(fx0 + 4, fy0 + 4, 1, 10, "#9a9a92").r(fx0 + 5, fy0 + 4, 5, 3, "#e8e4d8");
        });
        gnd(1, X0 + 3, Y0 + 3, X1 - 3, Y1 - 3, (P, gl, wx, wy) => {
          if (gl) return;
          for (let k = md(-wx, 3); k < TS; k += 3) {
            if (wy <= Y0 + 3 && wy + TS > Y0 + 3) P.p(wx + k, Y0 + 3, "#7a7c80");
            if (wy <= Y1 - 4 && wy + TS > Y1 - 4) P.p(wx + k, Y1 - 4, "#7a7c80");
          }
          for (let k = md(-wy, 3); k < TS; k += 3) {
            if (wx <= X0 + 3 && wx + TS > X0 + 3) P.p(X0 + 3, wy + k, "#7a7c80");
            if (wx <= X1 - 4 && wx + TS > X1 - 4) P.p(X1 - 4, wy + k, "#7a7c80");
          }
        });
        car(X0 + 20, by + 46, true, 1);
        car(X0 + 34, by + 46, true, 2);
        zg(x + 20 + q.i(Math.max(1, w - 60)), by + 44, 6 + q.i(6));
        blood(x + q.i(w), by + 48);
        for (let k = X0 + 12; k < X1 - 10; k += 20) tr(k, Y1 - 10, 4);
        break;
      }

     case "market":
      {
        for (let y = Y0 + 6; y < Y1 - 18; y += 24) {
          for (let x = X0 + 4; x < X1 - 14; ) {
            const w = q.ri(10, 18), c = q.pick([ "#3a6ac8", "#d88a3a", "#3a8a5a", "#d8d4cc", "#c84a3a", "#8a6ac8" ]), s2 = q.i(1e9), torn = q.chance(.3);
            add(x, y, x + w + 2, y + 16, y + 12, (P, gl) => {
              if (gl) return;
              P.r(x + 1, y + 2, w, 13, "rgba(0,0,0,0.35)").r(x, y, w, 9, c);
              for (let k = 2; k < w; k += 4) P.r(x + k, y, 1, 9, A.shade(c, .2));
              P.r(x, y + 8, w, 1, A.shade(c, -.35)).r(x, y + 9, w, 4, "#3a3430");
              const r = new SX.Rng(s2);
              for (let k = 0; k < 3; k++) P.r(x + 1 + r.i(w - 3), y + 10, 2, 2, r.pick([ "#c84a3a", "#d8b040", "#3a8a3a", "#8a6a40" ]));
              if (torn) P.r(x + 2 + r.i(w - 5), y + 1 + r.i(5), 3, 2, "#1a1816");
            });
            x += w + (q.chance(.25) ? q.ri(5, 8) : 1);
          }
          for (let k = 0; k < 5; k++) {
            const x = X0 + 6 + q.i(BW - 12), yy = y + 17 + q.i(4), c = q.pick([ "#8a6a40", "#6a4a2a", "#3a5a8a" ]);
            gnd(2, x, yy, x + 4, yy + 3, (P, gl) => {
              if (!gl) P.r(x, yy, 3, 2, c).p(x, yy, A.shade(c, .3));
            });
          }
          if (q.chance(.5)) zg(X0 + 6 + q.i(BW - 30), y + 15, 3 + q.i(4));
          if (q.chance(.4)) blood(X0 + 6 + q.i(BW - 12), y + 19);
        }
        break;
      }

     case "church":
      {
        const w = q.ri(44, 60), x = X0 + 16 + q.i(Math.max(1, BW - w - 40)), y = Y0 + 16 + q.i(Math.max(1, BH - 80));
        bld(x, y, w, 26, 16, {
          c: "#8a4a3a",
          rf: "#5a5450",
          kind: "villa"
        });
        add(x + w - 4, y - 30, x + w + 16, y + 30, y + 26.5, (P, gl) => {
          if (gl) return;
          const sx = x + w - 2;
          P.r(sx + 3, y - 12, 12, 40, "rgba(0,0,0,0.35)").r(sx, y + 2, 10, 24, "#9a5a4a").r(sx, y + 2, 10, 1, "#ba7a6a").r(sx, y - 8, 10, 10, "#5a5450").r(sx, y - 8, 10, 1, "#7a7470");
          P.r(sx + 4, y - 24, 2, 16, "#6a2a2a").r(sx + 1, y - 19, 8, 2, "#6a2a2a");
          P.r(sx + 3, y + 8, 4, 6, "#2a3a5a");
        });
        lotRow(x - 6, y + 50, Math.min(BW - 20, 70), false, .3);
        zg(x + 6, y + 44, 3 + q.i(4));
        tr(X0 + 10, Y1 - 12, 4);
        tr(X1 - 12, Y0 + 12, 4);
        for (let k = 0; k < 4; k++) {
          const vx = X0 + 10 + q.i(BW - 40), vy = Y0 + 10 + q.i(BH - 40);
          if (vx > x - 30 && vx < x + w + 20 && vy > y - 30 && vy < y + 60) continue;
          bld(vx, vy, q.ri(16, 26), q.ri(14, 20), q.ri(5, 9), {
            c: q.pick(WALLC),
            rf: q.pick(ROOFC),
            kind: "house"
          });
        }
        break;
      }

     case "constr":
      {
        const s2 = q.i(1e9);
        gnd(5, X0, Y0, X1, Y1, (P, gl, wx, wy) => {
          if (gl) return;
          const fc = (x, y, w2, h2) => P.r(x, y, w2, h2, "#8a8c90").r(x, y, w2, 1, "#aaacb0");
          if (wy <= Y0 + 4 && wy + TS > Y0 + 2) {
            fc(wx, Y0 + 2, TS, 3);
            P.r(wx, Y0 + 3, TS, 1, "#3a6aa8");
          }
          if (wy <= Y1 - 3 && wy + TS > Y1 - 5) {
            fc(wx, Y1 - 5, TS, 3);
            P.r(wx, Y1 - 4, TS, 1, "#3a6aa8");
          }
          if (wx <= X0 + 4 && wx + TS > X0 + 2) fc(X0 + 2, wy, 3, TS);
          if (wx <= X1 - 3 && wx + TS > X1 - 5) fc(X1 - 5, wy, 3, TS);
        });
        const fw = Math.min(BW - 60, q.ri(90, 160)), fx = X0 + 20 + q.i(Math.max(1, BW - fw - 40)), fy = Y0 + 20, fd = Math.min(BH - 70, q.ri(50, 90));
        add(fx, fy, fx + fw + 4, fy + fd + 24, fy + fd + 20, (P, gl) => {
          if (gl) return;
          P.r(fx + 3, fy + 3, fw, fd + 20, "rgba(0,0,0,0.35)").r(fx, fy, fw, fd, "#8a8a86").r(fx, fy + fd, fw, 20, "#6a6a66");
          for (let x = fx + 2; x < fx + fw - 2; x += 10) for (let y = fy + 2; y < fy + fd - 2; y += 10) P.r(x, y, 3, 3, "#aaaaa6").p(x + 1, y - 2, "#7a5a3a");
          for (let y = fy + fd + 4; y < fy + fd + 18; y += 5) {
            P.r(fx, y, fw, 1, "#4a4a46");
            for (let x = fx + 2; x < fx + fw - 2; x += 10) P.r(x, y - 3, 2, 4, "#9a9a96");
          }
          for (let k = 0; k < 12; k++) P.r(fx + 4 + md(H32(k, 1, s2), fw - 8), fy + 4 + md(H32(k, 2, s2), fd - 8), 4, 1, "#7a5a3a");
        });
        {
          const mx2 = fx + fw + 10 > X1 - 20 ? fx - 14 : fx + fw + 10, my2 = fy + 10, jl = Math.min(220, BW), dir = mx2 > X0 + BW / 2 ? -1 : 1;
          add(Math.min(mx2, mx2 + dir * jl) - 4, my2 - 60, Math.max(mx2, mx2 + dir * jl) + 8, my2 + 60, 2e6, (P, gl) => {
            if (gl) return;
            P.r(mx2 + 6, my2 + 4, 6, 50, "rgba(0,0,0,0.3)");
            for (let y = my2 - 50; y < my2 + 50; y += 4) P.r(mx2, y, 6, 1, "#c8a030").p(mx2 + 1, y + 2, "#c8a030").p(mx2 + 4, y + 2, "#c8a030");
            P.r(mx2, my2 - 50, 1, 100, "#a88020").r(mx2 + 5, my2 - 50, 1, 100, "#a88020");
            const jx0 = Math.min(mx2 - dir * 30, mx2 + dir * jl), jw = jl + 30;
            P.r(jx0, my2 - 52, jw, 3, "#c8a030").r(jx0, my2 - 52, jw, 1, "#e8c050");
            for (let x = jx0; x < jx0 + jw; x += 5) P.p(x, my2 - 50, "#a88020");
            P.r(mx2 - dir * 30 - (dir > 0 ? 0 : 8), my2 - 54, 8, 6, "#6a6a66");
            P.r(mx2 + 1, my2 - 56, 5, 4, "#c8c4b8").r(mx2 + 2, my2 - 55, 3, 2, "#2a3a4a");
            P.r(jx0 + 4, my2 + 70, jw - 8, 1, "rgba(0,0,0,0.25)");
            const hx = mx2 + dir * (jl * .6 | 0);
            P.r(hx, my2 - 49, 1, 40, "#5a5c60").r(hx - 2, my2 - 9, 5, 3, "#c8a030");
          });
        }
        {
          const ex = X0 + 20 + q.i(Math.max(1, BW - 60)), ey = Y1 - 40;
          add(ex, ey - 10, ex + 30, ey + 14, ey + 10, (P, gl) => {
            if (gl) return;
            P.r(ex + 2, ey + 2, 18, 10, "rgba(0,0,0,0.35)").r(ex, ey + 6, 18, 4, "#2a2c30").r(ex + 2, ey, 14, 7, "#d8a830").r(ex + 2, ey, 14, 1, "#f0c850").r(ex + 4, ey + 1, 5, 4, "#2a3a4a");
            P.line(ex + 16, ey + 2, ex + 24, ey - 8, "#c89820");
            P.line(ex + 24, ey - 8, ex + 28, ey + 4, "#c89820");
            P.r(ex + 26, ey + 4, 4, 3, "#5a5c60");
          });
        }
        for (let k = 0; k < 5; k++) {
          const x = X0 + 10 + q.i(BW - 30), y = Y1 - 24 - q.i(30), t = q.i(3);
          gnd(3, x, y, x + 16, y + 8, (P, gl) => {
            if (gl) return;
            if (t === 0) for (let n = 0; n < 4; n++) P.r(x, y + n, 14, 1, n & 1 ? "#6a4a3a" : "#8a5a3a"); else if (t === 1) P.oval(x + 6, y + 4, 7, 3, "#9a8a6a").oval(x + 6, y + 3, 5, 2, "#b0a07a"); else for (let n = 0; n < 3; n++) P.oval(x + 3 + n * 4, y + 3, 2, 2, "#7a7c80").p(x + 3 + n * 4, y + 3, "#3a3c40");
          });
        }
        zg(X0 + 20 + q.i(BW - 50), Y1 - 30, 3 + q.i(4));
        break;
      }

     case "hill":
      {
        const s2 = q.i(1e9), pts = [];
        for (let k = 0; k <= 8; k++) pts.push([ X0 + BW * (.2 + .6 * md(H32(k, 5, s2), 100) / 100), Y0 + BH * k / 8 ]);
        gnd(0, X0, Y0, X1, Y1, (P, gl, wx, wy) => {
          if (gl) return;
          for (let k = 0; k < 8; k++) {
            const a = pts[k], b = pts[k + 1];
            if (Math.max(a[1], b[1]) < wy - 4 || Math.min(a[1], b[1]) > wy + TS + 4) continue;
            P.thick(a[0], a[1], b[0], b[1], 4, "#5a5040");
            P.line(a[0] - 2, a[1], b[0] - 2, b[1], "#6a6050");
          }
        });
        const near = (x, y) => {
          for (let k = 0; k < 8; k++) {
            const a = pts[k], b = pts[k + 1], t = Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1)));
            if (Math.hypot(x - a[0] - t * (b[0] - a[0]), y - a[1] - t * (b[1] - a[1])) < 7) return true;
          }
          return false;
        };
        forest(X0 + 2, Y0 + 2, X1 - 2, Y1 - 2, 8, .92, 4, 7, near);
        {
          const p = pts[4], x = Math.round(p[0]) + 8, y = Math.round(p[1]) - 10;
          add(x, y, x + 20, y + 20, y + 16, (P, gl) => {
            if (gl) return;
            P.r(x + 2, y + 2, 18, 16, "rgba(0,0,0,0.4)").r(x, y, 18, 13, "#5a3a32").r(x + 8, y, 2, 13, "#4a2e26").r(x, y, 18, 1, "#8a6a58").r(x + 1, y + 13, 2, 4, "#4a2e26").r(x + 15, y + 13, 2, 4, "#4a2e26");
          });
        }
        if (q.chance(.5)) zg(Math.round(pts[2][0]) - 6, Math.round(pts[2][1]), 3);
        break;
      }

     case "gas":
      {
        const cw = Math.min(BW - 40, 76), cx = X0 + 20 + q.i(Math.max(1, BW - cw - 40)), cy = Y0 + 20 + q.i(Math.max(1, BH - 100)), brand = q.pick([ "#e84a3a", "#2e6ac8", "#2f8a45", "#e8a030" ]);
        gnd(0, cx - 10, cy - 6, cx + cw + 10, cy + 56, (P, gl) => {
          if (!gl) P.r(cx - 10, cy - 6, cw + 20, 62, "#545456");
        });
        for (let k = 0; k < 4; k++) {
          const ux = cx + 10 + k * ((cw - 20) / 3 | 0), uy = cy + 24;
          gnd(2, ux - 3, uy - 2, ux + 6, uy + 10, (P, gl) => {
            if (!gl) P.r(ux, uy, 4, 7, "#d8d4cc").r(ux, uy, 4, 2, brand).r(ux + 1, uy + 3, 2, 2, "#1c232c").r(ux - 2, uy + 7, 8, 1, "#6a6a66");
          });
        }
        car(cx + 18, cy + 34, true, 1);
        car(cx + cw - 30, cy + 16, true, 3);
        blood(cx + 40, cy + 46);
        gnd(1, cx + cw - 40, cy + 8, cx + cw - 10, cy + 30, (P, gl) => {
          if (!gl) P.oval(cx + cw - 25, cy + 19, 14, 8, "rgba(20,16,14,0.5)");
        });
        add(cx, cy, cx + cw + 4, cy + 22, 2e6, (P, gl) => {
          if (gl) return;
          P.r(cx + 4, cy + 4, cw, 18, "rgba(0,0,0,0.25)").r(cx, cy, cw, 16, "#d8d4cc").r(cx, cy, cw, 1, "#f0ece4").r(cx, cy + 13, cw, 3, brand).r(cx, cy + 16, cw, 1, A.shade(brand, -.4));
          for (let k = 0; k < 4; k++) P.r(cx + 8 + k * ((cw - 16) / 3 | 0), cy + 16, 2, 8, "#9a968a");
        });
        bld(cx, cy + 60, Math.min(46, cw), 16, 10, {
          c: "#d8d4cc",
          rf: "#8a8a86",
          kind: "shop",
          sign: brand
        });
        add(cx + cw + 12, cy - 30, cx + cw + 24, cy + 10, cy + 8, (P, gl) => {
          if (gl) return;
          P.r(cx + cw + 16, cy - 10, 2, 18, "#5a5c60").r(cx + cw + 12, cy - 30, 10, 20, brand).r(cx + cw + 13, cy - 26, 8, 3, "#1c232c").r(cx + cw + 13, cy - 21, 8, 3, "#1c232c");
        });
        zg(cx + 4, cy + 44, 4 + q.i(4));
        for (let k = 0; k < 3; k++) {
          const vx = X0 + 10 + q.i(BW - 40), vy = Y1 - 50 + q.i(20);
          if (vx > cx - 30 && vx < cx + cw + 30) continue;
          bld(vx, vy, q.ri(16, 28), q.ri(14, 20), q.ri(5, 9), {
            c: q.pick(WALLC),
            rf: q.pick(ROOFC),
            kind: "house"
          });
        }
        break;
      }

     case "farm":
      {
        gnd(0, X0, Y0, X1, Y1, (P, gl, wx, wy) => {
          if (gl) return;
          for (let y = md(Y0 - wy, 4); y < TS; y += 4) P.r(wx, wy + y, TS, 2, md(Math.floor((wy + y - Y0) / 4) + bi, 3) ? "#3e4a2c" : "#5a4630");
        });
        for (let y = Y0 + 10, n = 0; y < Y1 - 30 && n < 4; y += q.ri(30, 44), n++) {
          const w = Math.min(BW - 30, q.ri(80, 160)), x = X0 + 10 + q.i(Math.max(1, BW - w - 20));
          if (q.chance(.35)) continue;
          add(x, y, x + w + 4, y + 22, y + 18, (P, gl) => {
            if (gl) return;
            P.r(x + 3, y + 3, w, 18, "rgba(0,0,0,0.3)").r(x, y, w, 14, "#a8b4b4").r(x, y, w, 1, "#c8d4d4").r(x, y + 14, w, 4, "#8a9494");
            for (let k = x + 5; k < x + w; k += 6) P.r(k, y, 1, 18, "#8a9898");
            P.r(x + 3, y + 5, w - 6, 1, "#c8d4d4");
            P.r(x + (w >> 1), y + 3, 5, 4, "#4a5a4a");
          });
        }
        bld(X1 - 34, Y1 - 34, 22, 14, 7, {
          c: "#8a8a86",
          rf: "#4a6a8a",
          kind: "house"
        });
        gnd(2, X1 - 44, Y1 - 24, X1 - 36, Y1 - 16, (P, gl) => {
          if (!gl) P.oval(X1 - 40, Y1 - 20, 3, 3, "#3a6aa8").p(X1 - 41, Y1 - 21, "#6a9ad8");
        });
        if (q.chance(.6)) zg(X0 + 20 + q.i(BW - 50), Y0 + 20 + q.i(BH - 40), 2 + q.i(3));
        break;
      }

     case "base":
      {
        const bw = (T.x1 - T.x0) / (1 + T.a * T.N), pw = Math.round(bw * 2.2), x = Math.round(T.cx - pw / 2), ry = Math.round(T.yb - 22), rh = 28, ph = 12, fy = ry + rh;
        gnd(0, X0, fy + ph, X1, Y1, (P, gl, wx, wy) => {
          if (gl) return;
          for (let y = md(-wy, 8); y < TS; y += 8) P.r(wx, wy + y, TS, 1, "#46443e");
          for (let k = md(-wx, 8); k < TS; k += 8) P.r(wx + k, wy, 1, TS, "#46443e");
        });
        const fcx = Math.round(T.cx), fcy = fy + ph + 44;
        gnd(1, fcx - 70, fcy - 34, fcx + 71, fcy + 35, (P, gl) => {
          if (gl) return;
          P.ring(fcx, fcy, 66, 30, "#3a3b3f");
          for (let k = 1; k < 10; k++) P.ring(fcx, fcy, 66 - k, 30 - k * .45, "#3a3b3f");
          P.ring(fcx, fcy, 56, 25, "#8a867a");
          P.oval(fcx, fcy, 20, 9, "#8a867a").oval(fcx, fcy, 18, 8, "#4a4c48").oval(fcx - 4, fcy + 2, 8, 3, "#3a4038").r(fcx - 1, fcy - 6, 3, 6, "#9a968a").r(fcx - 1, fcy - 6, 1, 6, "#b8b4a8");
        });
        for (const a of [ .4, 1.3, 2.2, 3.6, 4.4, 5.5 ]) car(Math.round(fcx + Math.cos(a) * 61) - 5, Math.round(fcy + Math.sin(a) * 27) - 2, true, q.pick([ 0, 1, 1, 2, 3 ]));
        lotRow(X0 + 12, fy + ph + 12, Math.max(14, x - X0 - 30), false, .55);
        lotRow(x + pw + 18, fy + ph + 12, Math.max(14, X1 - x - pw - 30), false, .55);
        for (let k = 0; k < 7; k++) zg(x + 20 + q.i(Math.max(1, pw - 50)), fy + ph + 2 + q.i(14), 6 + q.i(6));
        for (let k = 0; k < 6; k++) blood(x + q.i(pw), fy + ph + 4 + q.i(30));
        car(fcx - 40, fy + ph + 4, true, 2);
        car(fcx + 24, fy + ph + 6, true, 1);
        for (let k = X0 + 14; k < X1 - 10; k += 18 + q.i(10)) tr(k, Y1 - 14, 4 + q.i(2));
        for (let y = Y0 + 8; y < ry - 24; y += 34) {
          if (x - X0 > 44) lotRow(X0 + 8, y, x - X0 - 24, false, .5);
          if (X1 - x - pw > 44) lotRow(x + pw + 16, y, X1 - x - pw - 24, false, .5);
          tr(X0 + 10, y + 22, 4);
          tr(X1 - 12, y + 22, 4);
        }
        for (const bx of [ x - 12, x + pw + 8 ]) for (let k = 0; k < 3; k++) tr(bx + q.i(6), fy + ph + 20 + k * 22, 4);
        {
          const py0 = fcy + 38, py1 = Y1 - 22, pc = Math.round(T.cx), wl = X0 + 10, wr = X1 - 10;
          if (py1 - py0 > 30 && wr - wl > 120) {
            const yh = Math.round((py0 + py1) / 2) - 5;
            gnd(.5, pc - 9, fcy + 30, pc + 9, Y1, (P, gl, wx, wy) => {
              if (gl) return;
              const t = Math.max(wy, fcy + 30), b = Math.min(wy + TS, Y1);
              if (b <= t) return;
              P.r(pc - 8, t, 16, b - t, "#58564e").r(pc - 8, t, 1, b - t, "#6e6b62").r(pc + 7, t, 1, b - t, "#3c3a34");
              for (let y = t + md(-t, 6); y < b; y += 6) P.r(pc - 7, y, 14, 1, "#4c4a44");
            });
            gnd(.4, wl, yh, wr, yh + 10, (P, gl) => {
              if (gl) return;
              P.r(wl, yh, wr - wl, 10, "#55534c").r(wl, yh, wr - wl, 1, "#6a675e").r(wl, yh + 9, wr - wl, 1, "#3c3a34");
              for (let x = wl + md(-wl, 8); x < wr; x += 8) P.r(x, yh + 1, 1, 8, "#4a4842");
            });
            gnd(1.5, wl, py0, wr, py1, (P, gl, wx, wy) => {
              if (gl) return;
              const r = new SX.Rng(H32(wx, wy, sd + 431));
              for (let k = 0, n = 3 + r.i(5); k < n; k++) {
                const a = wx + r.i(TS), b = wy + r.i(TS);
                if (a < wl || a >= wr || b < py0 || b >= py1) continue;
                P.p(a, b, r.pick([ "#c8c4b8", "#8a867a", "#5a2a20", "#3a5a8a", "#a08040", "#2a2a2c" ]));
              }
            });
            for (let bx = wl + 6; bx + 30 < wr; ) {
              const bw = q.ri(14, 30);
              if (Math.abs(bx + (bw >> 1) - pc) < 16 + (bw >> 1)) {
                bx += 8;
                continue;
              }
              const b0 = bx;
              for (const by of [ yh - 12, yh + 14 ]) {
                if (by < py0 || by + 7 > py1 || q.chance(.25)) continue;
                const s2 = q.i(1e9), dead = q.chance(.55);
                gnd(1, b0 - 1, by - 1, b0 + bw + 2, by + 9, (P, gl) => {
                  if (gl) return;
                  const r = new SX.Rng(s2);
                  P.r(b0, by, bw, 7, "#6e6a60").r(b0 + 1, by + 1, bw - 2, 5, dead ? "#3e3428" : "#2e3a26").r(b0, by + 7, bw, 1, "rgba(0,0,0,0.35)");
                  for (let k = 0; k < bw * .6; k++) P.p(b0 + 2 + r.i(bw - 4), by + 2 + r.i(3), dead ? r.pick([ "#5a4a30", "#6a5638", "#4a3a26" ]) : r.pick([ "#3e5a32", "#4a6a3a", "#8a4a5a", "#c8b05a" ]));
                });
                if (!dead && q.chance(.45)) tr(b0 + (bw >> 1), by + 2, 3);
              }
              bx += bw + q.ri(8, 20);
            }
            gnd(2, pc - 8, yh - 3, pc + 9, yh + 13, (P, gl) => {
              if (gl) return;
              P.oval(pc, yh + 5, 7, 4, "#7a766c").oval(pc, yh + 5, 6, 3, "#3e3428");
              for (let k = 0; k < 8; k++) P.p(pc - 4 + k * 5 % 9, yh + 3 + k * 3 % 5, "#5a4a30");
            });
            tr(pc, yh + 3, 4);
            const bench = (bx, by, br) => gnd(2, bx - 1, by - 1, bx + 10, by + 5, (P, gl) => {
              if (gl) return;
              P.r(bx, by, 8, 2, br ? "#4a3a2a" : "#6a4a30").r(bx, by, 8, 1, br ? "#5a4a38" : "#8a6a48").r(bx, by + 2, 8, 1, "rgba(0,0,0,0.35)");
              if (br) P.r(bx + 3, by, 1, 2, "#2a2420");
            });
            for (let y = py0 + 4; y < py1 - 6; y += 22) {
              if (y + 3 > yh - 1 && y < yh + 11) continue;
              bench(pc - 20, y, q.chance(.3));
              bench(pc + 12, y + 8 < yh - 1 || y + 8 > yh + 10 ? y + 8 : y, q.chance(.3));
            }
            for (let x = wl + 24; x < wr - 16; x += 52 + q.i(16)) if (Math.abs(x - pc) > 30) bench(x, yh - 4, q.chance(.3));
            const lampP = (lx, ly, bent) => add(lx - 2, ly - 8, lx + 5, ly + 3, ly, (P, gl) => {
              if (gl) return;
              P.r(lx, ly + 1, 3, 1, "rgba(0,0,0,0.35)");
              if (bent) {
                P.r(lx, ly - 2, 1, 3, "#3a3c40").r(lx + 1, ly - 3, 3, 1, "#3a3c40").p(lx + 4, ly - 2, "#5a5c60");
                return;
              }
              P.r(lx, ly - 6, 1, 7, "#3a3c40").r(lx - 1, ly - 7, 3, 1, "#5a5c60").p(lx, ly - 6, "#2a2c30");
            });
            for (let y = py0 + 2; y < py1; y += 26) {
              lampP(pc - 11, y, q.chance(.15));
              lampP(pc + 10, y, q.chance(.15));
            }
            for (let x = wl + 20; x < wr - 10; x += 48) if (Math.abs(x - pc) > 16) lampP(x, yh - 1, q.chance(.15));
            gnd(2, wl, Y1 - 6, wr, Y1 - 2, (P, gl) => {
              if (gl) return;
              for (let x = wl; x < wr; x += 7) if (Math.abs(x - pc) > 10) P.r(x, Y1 - 5, 1, 2, "#7a7870").p(x, Y1 - 3, "rgba(0,0,0,0.35)");
            });
            {
              const sx = pc + 40 + q.i(Math.max(1, wr - pc - 80)), sy = Y1 - 11;
              add(sx - 1, sy - 6, sx + 18, sy + 4, sy + 2, (P, gl) => {
                if (gl) return;
                P.r(sx + 1, sy + 2, 16, 1, "rgba(0,0,0,0.35)").r(sx, sy - 5, 16, 3, "#4a5a66").r(sx, sy - 5, 16, 1, "#6a7a86").r(sx + 6, sy - 4, 3, 1, "#2a3440").r(sx, sy - 2, 1, 4, "#3a3c40").r(sx + 15, sy - 2, 1, 4, "#3a3c40").r(sx + 3, sy, 10, 2, "#5a5a56").r(sx + 2, sy - 2, 1, 2, "#8a9aa6").r(sx + 9, sy - 2, 3, 2, "#5a2a20");
              });
            }
            {
              const ya = fy + ph + 30, yb = yh - 16;
              if (yb - ya > 10) for (const [l0, l1] of [ [ wl + 4, pc - 78 ], [ pc + 78, wr - 4 ] ]) {
                for (let x0 = l0; x0 + 30 < l1; ) {
                  const x = x0, w = Math.min(l1 - x, q.ri(40, 90)), s2 = q.i(1e9);
                  gnd(.6, x, ya, x + w, yb, (P, gl, wx, wy) => {
                    if (gl) return;
                    const r = new SX.Rng(H32(wx, wy, s2));
                    const t = Math.max(wy, ya), bt = Math.min(wy + TS, yb), lf = Math.max(wx, x), rg = Math.min(wx + TS, x + w);
                    if (bt <= t || rg <= lf) return;
                    P.r(lf, t, rg - lf, bt - t, "#2c3a26");
                    for (let k = 0; k < 10; k++) {
                      const a = lf + r.i(rg - lf), c = t + r.i(bt - t);
                      P.p(a, c, r.pick([ "#34442c", "#263220", "#3a4a2e", "#4a4232" ]));
                    }
                    if (ya >= wy && ya < wy + TS) P.r(lf, ya, rg - lf, 1, "#3e4a34");
                    if (yb - 1 >= wy && yb - 1 < wy + TS) P.r(lf, yb - 1, rg - lf, 1, "#1e2618");
                  });
                  for (let k = 0, n = 2 + q.i(4); k < n; k++) tr(x + 6 + q.i(Math.max(1, w - 12)), ya + 4 + q.i(Math.max(1, yb - ya - 8)), 3 + q.i(3));
                  if (q.chance(.4)) {
                    const sx = x + 4 + q.i(Math.max(1, w - 8)), sy = yb - 3;
                    add(sx - 1, sy - 4, sx + 4, sy + 2, sy, (P, gl) => {
                      if (!gl) P.r(sx, sy - 3, 3, 2, "#c8c4b8").r(sx + 1, sy - 1, 1, 2, "#5a5a56");
                    });
                  }
                  x0 += w + q.ri(10, 24);
                }
              }
            }
            {
              const lt = q.chance(.5), ax = lt ? wl + 8 : pc + 30, aw = Math.max(40, (lt ? pc - 30 : wr - 8) - ax), y0 = yh + 24, yr = Math.max(4, py1 - y0);
              const bigT = (x, y) => add(x - 1, y - 9, x + 21, y + 3, y, (P, gl) => {
                if (gl) return;
                P.r(x + 1, y + 1, 20, 1, "rgba(0,0,0,0.4)").r(x, y - 8, 20, 9, "#a8a69c").r(x, y - 8, 20, 2, "#c8c6bc").r(x, y - 1, 20, 1, "#6a6860").r(x + 7, y - 3, 6, 4, "#2a2c30");
                P.r(x + 3, y - 6, 3, 1, "#b83a30").r(x + 4, y - 7, 1, 3, "#b83a30").r(x + 16, y - 7, 2, 6, "#7a7870");
              });
              const tent = (x, y, tc, col) => add(x - 1, y - 6, x + 12, y + 3, y, (P, gl) => {
                if (gl) return;
                P.r(x + 1, y + 1, 10, 1, "rgba(0,0,0,0.4)");
                if (col) {
                  P.r(x, y - 2, 10, 3, A.shade(tc, -.2)).r(x + 2, y - 3, 5, 1, tc).p(x + 8, y - 3, "#2a2420");
                  return;
                }
                for (let r = 0; r < 5; r++) P.r(x + 4 - r, y - 5 + r, 2 + r * 2, 1, r < 2 ? A.shade(tc, .12) : tc);
                P.r(x + 4, y - 3, 2, 3, "#1a1c20");
              });
              const bx0 = ax + 30 + q.i(Math.max(1, aw - 130)), c0 = Math.max(ax, bx0 - 34), cw = Math.min(ax + aw, bx0 + 96) - c0;
              bigT(bx0, y0 + Math.min(yr - 1, 10));
              if (aw > 120) bigT(bx0 + 26, y0 + Math.min(yr - 1, 10));
              for (let k = 0, n = 6 + q.i(4); k < n; k++) tent(c0 + q.i(Math.max(1, cw - 12)), y0 + 4 + q.i(Math.max(1, yr - 4)), q.pick([ "#3a5a8a", "#8a5a2a", "#5a6a4a", "#7a3a34", "#6a6a70", "#4a7a6a" ]), q.chance(.3));
              {
                const sy = y0 - 2, s0 = Math.max(ax, bx0 - 12), s1 = Math.min(ax + aw, bx0 + 64);
                gnd(2, s0, sy - 2, s1, sy + 3, (P, gl) => {
                  if (gl) return;
                  for (let x = s0; x < s1; x += 4) if (md(H32(x, 7, sd), 7)) P.r(x, sy - 1, 4, 3, "#7a705a").r(x, sy - 1, 4, 1, "#9a907a").p(x + 3, sy, "#5a5442");
                });
              }
              for (let k = 0; k < 4; k++) {
                const cx2 = c0 + q.i(Math.max(1, cw - 10)), cy2 = y0 + 3 + q.i(Math.max(1, yr - 6)), nn = 2 + q.i(3);
                add(cx2 - 1, cy2 - 6, cx2 + 10, cy2 + 2, cy2, (P, gl) => {
                  if (gl) return;
                  for (let m = 0; m < nn; m++) {
                    const ox = m % 2 * 4, oy = -(m >> 1) * 3;
                    P.r(cx2 + ox, cy2 - 3 + oy, 4, 3, m % 2 ? "#8a7a5a" : "#6a7a5a").r(cx2 + ox, cy2 - 3 + oy, 4, 1, "#aa9a7a");
                  }
                });
              }
              {
                const tx2 = c0 + q.i(Math.max(1, cw - 20)), ty2 = y0 + 2 + q.i(Math.max(1, yr - 8));
                gnd(2.5, tx2 - 1, ty2 - 1, tx2 + 18, ty2 + 9, (P, gl) => {
                  if (gl) return;
                  P.r(tx2 + 1, ty2 + 7, 17, 1, "rgba(0,0,0,0.4)").r(tx2, ty2, 17, 7, "#3e4632").r(tx2, ty2, 11, 7, "#4e5a3e").r(tx2, ty2, 11, 1, "#6a7454").r(tx2 + 12, ty2 + 1, 4, 5, "#2a3440").r(tx2 + 16, ty2 + 1, 1, 5, "#3a4230");
                });
              }
              for (let k = 0; k < 4; k++) zg(c0 + q.i(Math.max(1, cw - 20)), y0 + q.i(Math.max(1, yr - 8)), 3 + q.i(4));
              for (let k = 0; k < 4; k++) blood(c0 + q.i(Math.max(1, cw)), y0 + 2 + q.i(Math.max(1, yr - 2)));
              const ox2 = lt ? pc + 40 : wl + 14, ow = Math.max(40, (lt ? wr - 10 : pc - 40) - ox2), px2 = ox2 + q.i(Math.max(1, ow - 46)), py2 = y0 + 1;
              if (yr > 16) {
                patch(px2, py2, 44, Math.min(22, yr - 2), "#5a3a30");
                patch(px2 + 4, py2 + 4, 10, 8, "#a8463a", 1);
                patch(px2 + 18, py2 + 6, 14, 2, "#2e6aa8", 1);
                patch(px2 + 18, py2 + 6, 1, 6, "#5a5a56", 1);
                patch(px2 + 31, py2 + 6, 1, 6, "#5a5a56", 1);
                patch(px2 + 34, py2 + 12, 8, 6, "#b8a070", 1);
                patch(px2 + 6, py2 + 13, 1, 4, "#3a3c40", 1);
                patch(px2 + 6, py2 + 13, 6, 1, "#c8a040", 1);
                for (let k = 0; k < 3; k++) patch(px2 + 50 + k * 8, py2 + 6, 1, 6, "#5a5c60", 1);
                patch(px2 + 49, py2 + 6, 18, 1, "#6a6c70", 1);
                patch(px2 + 52, py2 + 14, 10, 2, "#4a4c50", 1);
              }
            }
            for (let k = 0; k < 18; k++) {
              const jx = wl + q.i(wr - wl), jy = py0 + q.i(py1 - py0), jc = q.pick([ "#2a3a5a", "#7a2a26", "#3a3c40", "#a08040", "#5a6a4a", "#c8c4b8" ]), jk = q.i(4);
              gnd(2, jx - 1, jy - 2, jx + 6, jy + 4, (P, gl) => {
                if (gl) return;
                if (jk === 0) P.r(jx, jy, 4, 3, jc).r(jx, jy, 4, 1, A.shade(jc, .15)).p(jx + 1, jy - 1, "#2a2420"); else if (jk === 1) P.r(jx, jy, 5, 2, jc).r(jx + 1, jy + 2, 3, 1, "rgba(0,0,0,0.35)"); else if (jk === 2) P.p(jx, jy, "#d8d4cc").p(jx + 2, jy + 1, "#c8c4b8").p(jx + 4, jy, "#b8b4a8"); else P.r(jx, jy, 3, 3, "#5a5a56").p(jx + 1, jy + 1, "#2a2a2c").p(jx + 3, jy + 2, "#7a786e");
              });
            }
            car(wl + 30 + q.i(60), yh - 2, true, 2);
            car(wr - 80 - q.i(60), yh + 18, false, q.pick([ 1, 3 ]));
            for (let k = 0; k < 6; k++) zg(wl + 10 + q.i(Math.max(1, wr - wl - 40)), py0 + q.i(Math.max(1, py1 - py0 - 12)), 2 + q.i(4));
            for (let k = 0; k < 7; k++) blood(wl + 10 + q.i(Math.max(1, wr - wl - 20)), py0 + 4 + q.i(Math.max(1, py1 - py0 - 8)));
          }
        }
        add(x, ry, x + pw + 4, fy + ph + 4, fy + ph, (P, gl) => {
          if (gl) {
            for (let k = x + 6; k < x + pw - 6; k += 9) if (H32(k, 3, sd) % 100 < 6) P.r(k, fy + 3, 6, 6, "#f2c878");
            return;
          }
          P.r(x + 4, ry + 4, pw, rh + ph, "rgba(0,0,0,0.45)").r(x, fy, pw, ph, "#8a8478").r(x, fy, pw, 1, "#5a564e").r(x, fy + ph - 1, pw, 1, "#3a3832");
          for (let k = x + 6; k < x + pw - 6; k += 9) P.r(k, fy + 3, 6, 7, "#1e2832").r(k, fy + 3, 6, 1, "#4a5a6a");
          P.r(Math.round(T.cx) - 10, fy + 2, 20, 10, "#2a3440").r(Math.round(T.cx) - 12, fy, 24, 2, "#c8c4b8");
          P.r(x, ry, pw, rh, "#5a6050").r(x, ry, pw, 1, "#8a9080").r(x, ry, 1, rh, "#7a8070").r(x + pw - 1, ry, 1, rh, "#3a4034").r(x, ry + rh - 1, pw, 1, "#3a4034");
          for (let k = x + 4; k < x + pw - 4; k += 10) {
            P.oval(k + 3, ry + 5, 3, 2, "#3a5a34");
            P.oval(k + 6, ry + rh - 6, 3, 2, "#3a5a34").p(k + 5, ry + rh - 7, "#5a7a4a");
          }
          P.r(x + 8, ry + 10, pw - 16, 1, "#7a7868");
          P.r(x + 8, ry + rh - 11, pw - 16, 1, "#7a7868");
        });
        break;
      }
    }
    for (const f of O.fires) if (f.x >= X0 && f.x < X1 && f.y >= Y0 && f.y < Y1) {
      const fx = f.x, fy = f.y, r = f.r, s2 = f.s;
      add(fx - r * 2 - 4, fy - r * 3 - 8, fx + r * 2 + 6, fy + r + 6, 3e6, (P, gl) => {
        const rq = new SX.Rng(s2);
        if (gl) {
          P.oval(fx, fy, r + 6, (r >> 1) + 4, "rgba(255,120,40,0.13)").oval(fx, fy, r, r >> 1, "rgba(255,150,60,0.2)");
          for (let k = 0; k < 6 + r; k++) {
            const a = fx - r + rq.i(r * 2), b = fy - 2 - rq.i(r);
            P.r(a, b, 2 + rq.i(2), 2 + rq.i(3), rq.pick([ "#ff9a3a", "#ffd070", "#ff6a20" ]));
          }
          return;
        }
        P.oval(fx, fy + 2, r + 4, (r >> 1) + 3, "#1a1614");
        for (let k = 0; k < 4; k++) {
          const a = fx - r + rq.i(r * 2 - 6), b = fy - r + rq.i(r);
          P.r(a, b, 6 + rq.i(8), 4 + rq.i(5), "#120e0c").r(a, b, 6, 1, "#2a2420");
        }
        for (let k = 0; k < 4; k++) P.oval(fx + 4 + k * 5, fy - r - 6 - k * 6, 6 + k * 2, 4 + k, "rgba(40,38,36," + (.42 - k * .07).toFixed(2) + ")");
      });
    }
    it.sort((a, b) => a.z - b.z);
    B = {
      z,
      it
    };
    O.nbk.set(key, B);
    return B;
  }
  function zoneOf(O, cj, rj) {
    const bi = O.cb[2][cj], bj = O.rb[2][rj];
    if (md(H32(bi >> 1, bj >> 1, O.seed + 61), 100) < 9) return "hill";
    const h = md(H32(bi, bj, O.seed + 67), 100);
    return h < 9 ? "park" : h < 25 ? "apt" : h < 35 ? "comm" : h < 40 ? "school" : h < 45 ? "plaza" : "res";
  }
  function city(P, O, tx, ty, px, py, glow, g) {
    const cj = tx - O.GX, rj = ty - O.GY, cr = O.rcol[cj], rr = O.rrow[rj], lit = md(H32(Math.floor(tx / 9), Math.floor(ty / 7), O.seed + 79), 100) >= 3;
    if (cr || rr) {
      if (!glow) {
        P.r(px, py, TS, TS, "#16181c").noise(px, py, TS, TS, [ "#1c1e22", "#121316" ], .15, g);
        if (rr && !cr) {
          if (rr !== 3) P.r(px, py, TS, 3, "#2a2b2e");
          if (rr !== 2) P.r(px, py + TS - 3, TS, 3, "#2a2b2e");
          if (rr === 1) for (let x = 2; x < TS; x += 8) P.r(px + x, py + 15, 4, 1, "#5a5440"); else P.r(px, rr === 2 ? py + TS - 1 : py, TS, 1, "#6a5a2a");
        }
        if (cr && !rr) {
          if (cr !== 3) P.r(px, py, 3, TS, "#2a2b2e");
          if (cr !== 2) P.r(px + TS - 3, py, 3, TS, "#2a2b2e");
          if (cr === 1) for (let y = 2; y < TS; y += 8) P.r(px + 15, py + y, 1, 4, "#5a5440"); else P.r(cr === 2 ? px + TS - 1 : px, py, 1, TS, "#6a5a2a");
        }
        if (cr && rr && (cr === 1 || rr === 1)) for (let k = 4; k < TS - 4; k += 4) P.r(px + k, py + 1, 2, 3, "#3a3a3a");
      }
      const q = new SX.Rng(H32(tx, ty, O.seed + 9)), L = (x, y) => glow ? lit && P.r(px + x - 2, py + y - 2, 6, 6, "rgba(255,170,80,0.16)").r(px + x, py + y, 2, 2, "#ffb060") : P.r(px + x, py + y, 2, 2, "#6a4a28");
      if (rr && !cr) {
        if (rr !== 3) L(4, 1);
        if (rr !== 2) L(20, TS - 3);
      } else if (cr && !rr) {
        if (cr !== 3) L(1, 6);
        if (cr !== 2) L(TS - 3, 22);
      } else if (md(tx + ty, 2)) L(2, 2);
      for (let n = 0; n < 2; n++) if (q.chance(.4)) {
        const hz = rr && (!cr || q.chance(.5)), a = 3 + q.i(22), lane = q.chance(.5), head = q.chance(.5);
        const x = hz ? px + a : px + (lane ? 9 : 19), y = hz ? py + (lane ? 9 : 19) : py + a, body = q.pick([ "#3a3c40", "#5a2a26", "#6a6c70", "#2a3a5a" ]);
        if (!glow) P.r(x, y, hz ? 6 : 3, hz ? 3 : 6, body); else {
          const c = head ? "#fff6d8" : "#ff3a24", h2 = head ? "rgba(255,246,216,0.2)" : "rgba(255,60,40,0.2)";
          if (hz) {
            const ex = head ? x + 6 : x - 1;
            P.r(ex, y, 1, 1, c).r(ex, y + 2, 1, 1, c).r(ex + (head ? 1 : -3), y - 1, 3, 5, h2);
          } else {
            const ey = head ? y + 6 : y - 1;
            P.r(x, ey, 1, 1, c).r(x + 2, ey, 1, 1, c).r(x - 1, ey + (head ? 1 : -3), 5, 3, h2);
          }
        }
      }
      return;
    }
    const cb0 = O.cb[0][cj], cb1 = O.cb[1][cj], rb0 = O.rb[0][rj], rb1 = O.rb[1][rj], BX = px + (cb0 - cj) * TS, BY = py + (rb0 - rj) * TS, BW = (cb1 - cb0 + 1) * TS, BH = (rb1 - rb0 + 1) * TS;
    const z = zoneOf(O, cj, rj), bq = new SX.Rng(H32(O.cb[2][cj], O.rb[2][rj], O.seed + 89));
    const rl = rj - rb0, cl = cj - cb0;
    if (z === "hill") {
      if (glow) return;
      P.r(px, py, TS, TS, "#0d1710");
      for (let k = 0; k < 12; k++) {
        const x = px + 3 + g.i(26), y = py + 3 + g.i(26), r = 3 + g.i(4);
        P.oval(x + 1, y + 1, r, r - 1, "#091008").oval(x, y, r, r - 1, g.pick([ "#15261a", "#1a2e1e", "#1e3422" ])).p(x - 1, y - 1, "#28402c");
      }
      return;
    }
    if (z === "park") {
      const pond = bq.chance(.4), cx = BX + (BW >> 1), cy = BY + (BH >> 1);
      if (!glow) {
        P.r(px, py, TS, TS, "#17291c").noise(px, py, TS, TS, [ "#1a2e1f", "#142419" ], .2, g);
        clipT(P, px, py, () => {
          P.r(BX, cy - 1, BW, 3, "#2a2a26").r(cx - 1, BY, 3, BH, "#2a2a26");
          if (pond) P.oval(cx, cy, Math.min(40, BW / 4), Math.min(24, BH / 4), "#2a2a26").oval(cx, cy, Math.min(38, BW / 4 - 2), Math.min(22, BH / 4 - 2), "#0e1a24");
        });
        for (let k = 0; k < 11; k++) {
          const x = px + 3 + g.i(26), y = py + 3 + g.i(26), r = 2 + g.i(3);
          if (Math.abs(x - cx) < 4 + r || Math.abs(y - cy) < 4 + r) continue;
          P.oval(x + 1, y + 1, r, r, "#0c160f").oval(x, y, r, r, g.pick([ "#24402a", "#2a4a30", "#1f3825" ])).p(x - 1, y - 1, "#3a5e40");
        }
        if (g.chance(.12)) {
          const x = px + 6 + g.i(18), y = py + 8 + g.i(16);
          if (Math.abs(x - cx) > 8 && Math.abs(y - cy) > 6) P.r(x, y, 7, 2, "#5a4632");
        }
      } else if (lit) clipT(P, px, py, () => {
        for (let x = BX + 20; x < BX + BW - 8; x += 64) P.r(x, cy - 4, 2, 2, "#ffd890").r(x - 2, cy - 6, 6, 6, "rgba(255,216,144,0.15)");
      });
      return;
    }
    if (z === "apt") {
      const col = bq.pick([ "#8e8a82", "#a49e90", "#7e8288", "#9a8e80" ]), r3 = rl % 3;
      if (r3 === 0) {
        const x0 = cj === cb0 ? 4 : 0, x1 = cj === cb1 ? TS - 4 : md(cl, 4) === 3 ? TS - 7 : TS, w = x1 - x0;
        if (!glow) {
          P.r(px, py, TS, TS, "#15171a");
          P.r(px + x0 + 2, py + 8, w, 20, "rgba(0,0,0,0.5)").r(px + x0, py + 5, w, 13, col).r(px + x0, py + 5, w, 1, A.shade(col, .25)).r(px + x0, py + 17, w, 1, A.shade(col, -.25)).r(px + x0, py + 18, w, 9, A.shade(col, -.45));
          if (md(cl, 4) === 1) P.r(px + x0 + 8, py + 8, 10, 6, A.shade(col, -.15)).r(px + x0 + 8, py + 8, 10, 1, A.shade(col, .15));
          for (let y = py + 19; y < py + 26; y += 3) for (let x = px + x0 + 1; x < px + x1 - 1; x += 3) P.p(x, y, A.shade(col, -.25));
        } else if (lit) {
          const q = new SX.Rng(H32(tx, ty, O.seed + 93));
          for (let y = py + 19; y < py + 26; y += 3) for (let x = px + x0 + 1; x < px + x1 - 1; x += 3) if (q.f() < .5) P.p(x, y, q.pick([ "#ffd890", "#f2c878", "#c8e4f8" ]));
        }
        return;
      }
      if (glow) return;
      if (r3 === 1) {
        P.r(px, py, TS, TS, "#1a1b1e");
        for (let x = 1; x < TS; x += 6) {
          P.r(px + x, py + 3, 1, 8, "#4a4a46").r(px + x, py + 21, 1, 8, "#4a4a46");
          if (g.chance(.55)) P.r(px + x + 1, py + 4, 4, 7, g.pick(CARM));
          if (g.chance(.55)) P.r(px + x + 1, py + 21, 4, 7, g.pick(CARM));
        }
        return;
      }
      P.r(px, py, TS, TS, "#16241a").r(px, py + 14, TS, 3, "#2a2a26");
      for (let k = 0; k < 4; k++) {
        const x = px + 4 + k * 8, y = py + 6 + (k & 1) * 16;
        P.oval(x, y, 3, 3, "#223a28").p(x - 1, y - 1, "#2e4a34");
      }
      return;
    }
    if (z === "comm") {
      const gx = cb0 + (cl & ~1), gy = rb0 + (rl & ~1), whole = gx + 1 <= cb1 && gy + 1 <= rb1, gq = new SX.Rng(H32(gx, gy, O.seed + 99)), two = whole && gq.chance(.45);
      const q = two ? gq : new SX.Rng(H32(tx, ty, O.seed + 95)), col = q.pick([ "#3a4048", "#4a4a52", "#2e3a4a", "#50483e", "#3e3a44", "#5a5650" ]), sign = q.chance(.5), sc = q.pick([ "#ff4ab0", "#4ad0ff", "#ffb030", "#7aff6a" ]);
      const OX = two ? px + (gx - cj) * TS : px, OY = two ? py + (gy - rj) * TS : py, W = two ? 54 + q.i(8) : 14 + q.i(14), fh = two ? 12 + q.i(6) : 4 + q.i(7), h = two ? 52 - fh - q.i(6) : 24 - fh - q.i(6), x0 = OX + (two ? 2 : 1 + q.i(Math.max(1, 30 - W))), y0 = OY + (two ? 3 : 1 + q.i(4));
      const empty = !two && q.chance(.3), rgba = (c, al) => c.replace(/^#(..)(..)(..)$/, (m, a, b, d) => "rgba(" + parseInt(a, 16) + "," + parseInt(b, 16) + "," + parseInt(d, 16) + "," + al + ")");
      clipT(P, px, py, () => {
        if (!glow) {
          P.r(px, py, TS, TS, "#141518");
          if (empty) return;
          P.r(x0 + 2, y0 + 2, W, h + fh + 1, "rgba(0,0,0,0.5)").r(x0, y0, W, h, col).r(x0, y0, W, 1, A.shade(col, .25)).r(x0, y0 + h - 1, W, 1, A.shade(col, -.25)).r(x0, y0 + h, W, fh, A.shade(col, -.45));
          for (let y = y0 + h + 1; y < y0 + h + fh - 1; y += 2) for (let x = x0 + 1; x < x0 + W - 1; x += 2) P.p(x, y, A.shade(col, -.3));
          if (two) {
            if (q.chance(.4)) {
              P.ring(x0 + (W >> 1), y0 + (h >> 1), 8, 6, "#8a8a80");
              P.r(x0 + (W >> 1) - 2, y0 + (h >> 1) - 3, 1, 6, "#8a8a80").r(x0 + (W >> 1) + 2, y0 + (h >> 1) - 3, 1, 6, "#8a8a80").r(x0 + (W >> 1) - 2, y0 + (h >> 1), 5, 1, "#8a8a80");
            } else for (let k = 0; k < 3; k++) P.r(x0 + 5 + q.i(W - 16), y0 + 4 + q.i(h - 12), 6 + q.i(6), 4 + q.i(4), A.shade(col, q.chance(.5) ? .12 : -.15));
          } else if (q.chance(.6)) P.r(x0 + 2 + q.i(Math.max(1, W - 7)), y0 + 2 + q.i(Math.max(1, h - 6)), 4, 3, A.shade(col, .12));
          if (sign) P.r(x0 + 2, y0 + h + 1, W - 4, 2, A.shade(sc, -.6));
        } else if (lit && !empty) {
          const wq = new SX.Rng(H32(gx, gy, O.seed + 101));
          for (let y = y0 + h + 1; y < y0 + h + fh - 1; y += 2) for (let x = x0 + 1; x < x0 + W - 1; x += 2) if (wq.f() < .6) P.p(x, y, wq.pick([ "#ffe8b0", "#c8e4f8", "#ffd890" ]));
          if (sign) P.r(x0 + 2, y0 + h + 1, W - 4, 2, sc).r(x0, y0 + h - 1, W, 6, rgba(sc, .18));
          if (two && q.chance(.5)) P.r(x0 + W - 4, y0 + 2, 2, 2, "#ff3020");
        }
      });
      return;
    }
    if (z === "school") {
      if (rl === 0) {
        if (!glow) {
          P.r(px, py, TS, TS, "#16171a").r(px + 1, py + 7, TS, 20, "rgba(0,0,0,0.5)").r(px, py + 4, TS, 14, "#c8bca4").r(px, py + 4, TS, 1, "#e0d6c0").r(px, py + 18, TS, 8, "#6a6252");
          for (let x = px + 1; x < px + TS - 1; x += 4) P.r(x, py + 20, 2, 3, "#3a3a3a");
        } else if (lit && g.chance(.5)) P.r(px + 5 + g.i(20), py + 20, 2, 3, "#ffe8b0");
        return;
      }
      if (glow) return;
      P.r(px, py, TS, TS, "#3a3024");
      clipT(P, px, py, () => {
        const fy = BY + TS, fhh = BH - TS, cx = BX + (BW >> 1), cy = fy + (fhh >> 1), rx = (BW >> 1) - 8, ry = (fhh >> 1) - 6;
        if (rx > 6 && ry > 4) for (let k = 0; k < 4; k++) P.ring(cx, cy, rx - k, ry - k, k === 3 ? "#c8c4b8" : "#7a3e30");
      });
      return;
    }
    if (z === "plaza") {
      const cx = BX + (BW >> 1), cy = BY + (BH >> 1);
      if (!glow) {
        P.r(px, py, TS, TS, "#3a3834");
        for (let k = 0; k < TS; k += 8) {
          P.r(px + k, py, 1, TS, "#44423d");
          P.r(px, py + k, TS, 1, "#44423d");
        }
        clipT(P, px, py, () => {
          P.oval(cx, cy, 16, 10, "#5a5852").oval(cx, cy, 13, 8, "#16303e").r(cx - 1, cy - 3, 2, 4, "#8aa4b4");
          for (const [x, y] of [ [ BX + 10, BY + 10 ], [ BX + BW - 10, BY + 10 ], [ BX + 10, BY + BH - 10 ], [ BX + BW - 10, BY + BH - 10 ] ]) P.oval(x, y, 5, 4, "#223a28").p(x - 1, y - 2, "#2e4a34");
        });
      } else if (lit && md(tx + ty, 2) === 0) P.r(px - 2, py - 2, 6, 6, "rgba(255,220,150,0.16)").r(px, py, 2, 2, "#ffe0a0");
      return;
    }
    if (!glow) P.r(px, py, TS, TS, "#101215");
    const q = new SX.Rng(H32(tx >> 1, ty >> 1, O.seed + 13)), big = q.chance(.22);
    const bldg = (x, y, w, h, fh, seed) => {
      const r = new SX.Rng(seed), col = r.pick(MINI), lt = r.r(.35, .65), det = r.chance(.3), ddx = r.i(Math.max(1, w - 5)), ddy = r.i(Math.max(1, h - 5));
      if (!glow) {
        P.r(px + x + 1, py + y + 1, w, h + fh, "rgba(0,0,0,0.5)");
        P.r(px + x, py + y, w, h, col).r(px + x, py + y, w, 1, A.shade(col, .25)).r(px + x, py + y + h - 1, w, 1, A.shade(col, -.3));
        P.r(px + x, py + y + h, w, fh, A.shade(col, -.45));
        if (det) P.r(px + x + 2 + ddx, py + y + 2 + ddy, 3, 3, A.shade(col, .15));
      }
      for (let wy = y + h + 1; wy < y + h + fh - 1; wy += 2) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r.f() < lt) {
        if (glow) {
          if (lit) P.r(px + wx, py + wy, 1, 1, r.pick([ "#ffd890", "#f2c878", "#c8e4f8" ]));
        } else P.r(px + wx, py + wy, 1, 1, "#8a7650");
      }
    };
    if (big) {
      const ox = tx & 1 ? 0 : 3, oy = ty & 1 ? 0 : 3;
      bldg(ox, oy, 26, 18, 7, H32(tx, ty, O.seed + 3));
    } else for (let k = 0; k < 4; k++) {
      const qx = (k & 1) * 16, qy = (k >> 1) * 16, r = new SX.Rng(H32(tx * 2 + (k & 1), ty * 2 + (k >> 1), O.seed + 7));
      if (r.chance(.12)) continue;
      const w = 7 + r.i(8), h = 5 + r.i(5);
      bldg(qx + r.i(Math.max(1, 16 - w)), qy + r.i(Math.max(1, 12 - h)), w, h, 2 + r.i(3), r.i(1e9));
    }
  }
  function far(P, O, tx, ty, px, py, glow, v, g) {
    const c = Math.max(0, Math.min(O.rt.length - 1, tx * TS + 16 - O.GX * TS)), d = O.rt[c] / TS - ty, a = Math.min(.34, .04 + Math.max(0, d - 2) * .014), haze = () => P.r(px, py, TS, TS, O.day ? "rgba(176,188,202," + (a * 1.15).toFixed(3) + ")" : "rgba(24,36,60," + a.toFixed(3) + ")");
    if (v >= 4) {
      if (!glow) {
        P.r(px, py, TS, TS, "#0c150f");
        for (let k = 0; k < 10; k++) {
          const x = px + 3 + g.i(26), y = py + 3 + g.i(26), r = 3 + g.i(4);
          P.oval(x, y, r, r - 1, g.pick([ "#132219", "#17281c", "#1b2e20" ])).p(x - 1, y - 1, "#22382a");
        }
        if (v === 5) P.r(px + 13, py, 5, TS, "#7a7e84").r(px + 13, py, 1, TS, "#a8acb2").r(px + 17, py, 1, TS, "#4a4e54");
        if (v === 6) P.r(px + 13, py + 16, 5, 16, "#7a7e84").r(px + 13, py + 16, 1, 16, "#a8acb2").oval(px + 15, py + 14, 8, 4, "#8a8e94").oval(px + 15, py + 13, 7, 3, "#b0b4b8").r(px + 15, py + 2, 1, 10, "#9a9ea4").r(px + 14, py + 9, 3, 2, "#6a6e74");
        haze();
        return;
      }
      if (v === 6) P.r(px + 11, py - 1, 9, 8, "rgba(255,40,30,0.25)").r(px + 14, py + 1, 3, 2, "#ff3020").r(px + 9, py + 14, 13, 1, "#ffd890").r(px + 12, py + 13, 1, 1, "#ffe8b0").r(px + 18, py + 13, 1, 1, "#ffe8b0");
      return;
    }
    if (glow) {
      const ga = P.x.globalAlpha;
      P.x.globalAlpha = ga * (1 - a * 1.2);
      city(P, O, tx, ty, px, py, true, g);
      P.x.globalAlpha = ga;
      return;
    }
    city(P, O, tx, ty, px, py, false, g);
    haze();
  }
  HO.draw = function(ctx, F, tx, ty, px, py) {
    const O = F.out;
    if (O) tile(new A.Pen(ctx), O, F, tx, ty, px, py, false);
  };
  HO.cell = function(ctx, F, tx, ty, px, py, capish) {
    const O = F.out;
    if (!O) return;
    if (O.cfg && capish && kAt(O, tx, ty) === K.CEIL) {
      HO.plate(ctx, F, tx, ty, px, py, capish);
      return;
    }
    const key = tx + "," + ty;
    let c = O.cells.get(key);
    if (!c) {
      c = A.mk(TS, TS);
      tile(new A.Pen(c.getContext("2d")), O, F, tx, ty, 0, 0, false);
      O.cells.set(key, c);
    }
    ctx.drawImage(c, px, py);
  };
  HO.paintChunk = function(F, ctx, cx, cy) {
    const O = F.out;
    if (!O || !O.props.length) return;
    const X0 = cx * S, Y0 = cy * S;
    for (const p of O.props) {
      let s = propImg(p);
      if (!s || !s.c) continue;
      if (p.a || p.fl) s = tfImg(p, s);
      const x = p.x * TS + (p.dx | 0) + (s.tx | 0), y = p.y * TS + (p.dy | 0) + s.oy;
      if (x >= X0 + S || y >= Y0 + S || x + s.c.width <= X0 || y + s.c.height <= Y0) continue;
      ctx.drawImage(s.c, x - X0, y - Y0);
    }
    if (O.wires) for (const w of O.wires) {
      if (Math.max(w[0], w[2]) < X0 || Math.min(w[0], w[2]) >= X0 + S || Math.max(w[1], w[3]) + w[4] < Y0 || Math.min(w[1], w[3]) >= Y0 + S) continue;
      const n = Math.max(2, Math.ceil(Math.abs(w[2] - w[0]) + Math.abs(w[3] - w[1])));
      ctx.fillStyle = "#16171a";
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = w[0] + (w[2] - w[0]) * t, y = w[1] + (w[3] - w[1]) * t + w[4] * 4 * t * (1 - t);
        ctx.fillRect(Math.round(x - X0), Math.round(y - Y0), 1, 1);
      }
    }
  };
  function glowChunk(F, O, cx, cy) {
    const key = cx + "," + cy;
    if (O.gc.has(key)) {
      const c = O.gc.get(key);
      O.gc.delete(key);
      O.gc.set(key, c);
      return c;
    }
    const w = A.mk(S, S), x = w.getContext("2d", {
      willReadFrequently: true
    }), P = new A.Pen(x), TT = SX.map.T, high = O.kind === "high";
    for (let ty = cy * CH; ty < (cy + 1) * CH; ty++) for (let tx = cx * CH; tx < (cx + 1) * CH; tx++) {
      const px = (tx - cx * CH) * TS, py = (ty - cy * CH) * TS;
      if (F.in(tx, ty)) {
        const i = F.i(tx, ty);
        if (F.t[i] !== TT.VOID) continue;
        if (F.fs[i] === A.FS.WATER) {
          if (high) waterGlow(P, O, tx, ty, px, py);
          continue;
        }
      }
      tile(P, O, F, tx, ty, px, py, true);
    }
    for (const h of O.heads) {
      if (h.x >= (cx + 1) * S || h.y >= (cy + 1) * S || h.x + h.w <= cx * S || h.y + h.h <= cy * S) continue;
      P.r(h.x - cx * S, h.y - cy * S, h.w, h.h, h.c);
    }
    for (let ty = cy * CH; ty <= (cy + 1) * CH; ty++) for (let tx = cx * CH; tx < (cx + 1) * CH; tx++) if (bldAt(O, tx, ty)) x.clearRect((tx - cx * CH) * TS, (ty - cy * CH) * TS - TS, TS, TS * 2);
    const d = x.getImageData(0, 0, S, S).data;
    let any = false;
    for (let i = 3; i < d.length; i += 4) if (d[i]) {
      any = true;
      break;
    }
    let out = null;
    if (any) {
      out = A.mk(S, S);
      out.getContext("2d").drawImage(w, 0, 0);
    }
    O.gc.set(key, out);
    if (O.gc.size > 24) O.gc.delete(O.gc.keys().next().value);
    return out;
  }
  function highMove(ctx, F, O, cam, vw, vh, day) {
    const rt = O.rt, U0 = O.GX * TS, NW = rt.length, t = performance.now() / 1e3, sd = O.seed, TT = SX.map.T, cx0 = Math.round(cam.x), cy0 = Math.round(cam.y);
    const x0 = Math.max(U0, Math.floor(cam.x) - 10), x1 = Math.min(U0 + NW - 1, Math.ceil(cam.x + vw) + 10);
    if (x1 <= x0) return;
    const ok = (u, y) => {
      if (u < U0 || u >= U0 + NW || y < cam.y - 6 || y > cam.y + vh + 6 || O.brg.some(b => u >= b * TS - 2 && u < b * TS + 66)) return false;
      const tx = Math.floor(u / TS), ty = Math.floor(y / TS);
      if (F.in(tx, ty) && F.t[F.i(tx, ty)] !== TT.VOID) return false;
      return !bldAt(O, tx, ty);
    };
    const dot = (u, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(u - cx0, y - cy0, w, h);
    };
    for (const ln of MOVE_LN) {
      const y = ln < 4 ? 16 + ln * 5 : 39 + (ln - 4) * 5, rg = ln >= 4, h0 = H32(ln, 3, sd + 9), per = 170 + md(h0, 90), off = md(h0 >> 12, per) + (15 + md(h0 >> 8, 11)) * (rg ? t : -t);
      for (let k = Math.floor((x0 - 60 - off) / per); k * per + off < x1 + 12; k++) {
        const hk = H32(k, ln, sd + 13);
        if (hk % 3 === 0) continue;
        const u = Math.floor(k * per + off) + md(hk >> 4, 40), hx = rg ? u + 7 : u - 1, tx = rg ? u - 1 : u + 7;
        if (day) {
          const yy = rt[Math.min(NW - 1, Math.max(0, u + 3 - U0))] + y;
          if (ok(u + 3, yy)) {
            const col = CARN[md(hk >> 9, CARN.length)];
            dot(u, yy, 7, 3, A.shade(col, -.3));
            dot(u + 1, yy, 5, 3, col);
            dot(u + (rg ? 4 : 1), yy, 2, 3, "#1c2430");
          }
          continue;
        }
        if (ok(hx, rt[Math.min(NW - 1, Math.max(0, hx - U0))] + y)) {
          const yy = rt[hx - U0] + y;
          dot(rg ? hx : hx - 3, yy - 1, 4, 5, "rgba(255,246,216,0.14)");
          dot(hx, yy, 1, 1, "#fff6d8");
          dot(hx, yy + 2, 1, 1, "#fff6d8");
        }
        if (ok(tx, rt[Math.min(NW - 1, Math.max(0, tx - U0))] + y)) {
          const yy = rt[tx - U0] + y;
          dot(rg ? tx - 1 : tx, yy, 2, 3, "rgba(255,60,40,0.16)");
          dot(tx, yy, 1, 1, "#ff3a24");
          dot(tx, yy + 2, 1, 1, "#ff3a24");
        }
      }
    }
    for (let u = x0 - md(x0, 6); u <= x1; u += 6) {
      const h = H32(Math.floor(u / 6), 5, sd + 77);
      if (h % 5 || u < U0) continue;
      const r = RF + 6 + md(h >> 3, RW - 14), d = (r - RF) / RW, y = rt[u - U0] + r;
      if (!ok(u, y)) continue;
      const T = 3 + md(h >> 12, 21) / 10, a = (.05 + d * .08) * (.5 - .5 * Math.cos((t / T + md(h >> 17, 100) / 100) * 6.2832));
      if (a < .008) continue;
      dot(u, y, 1 + Math.round(d * 3), 1, "rgba(196,218,236," + a.toFixed(3) + ")");
    }
  }
  HO.glow = function(ctx, F, cam, vw, vh) {
    const O = F.out;
    if (!O || O.kind === "dark") return;
    if (O.day) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (O.fires && O.fires.length) dayFire(ctx, F, O, cam, vw, vh);
      if (O.kind === "high" && O.rt) highMove(ctx, F, O, cam, vw, vh, true);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (let cy = Math.floor(cam.y / S); cy <= Math.floor((cam.y + vh + 96) / S); cy++) for (let cx = Math.floor(cam.x / S); cx <= Math.floor((cam.x + vw) / S); cx++) {
      const g = glowChunk(F, O, cx, cy);
      if (g) ctx.drawImage(g, Math.round(cx * S - cam.x), Math.round(cy * S - cam.y));
    }
    if (O.kind === "high" && O.rt) highMove(ctx, F, O, cam, vw, vh);
    ctx.restore();
  };
  function dayFire(ctx, F, O, cam, vw, vh) {
    const P = new A.Pen(ctx), ox = Math.round(cam.x), oy = Math.round(cam.y), TT = SX.map.T;
    const off = (a, b) => {
      const tx = Math.floor((a + ox) / TS), ty = Math.floor((b + oy) / TS);
      if (!F.in(tx, ty)) return false;
      const i = F.i(tx, ty);
      return F.t[i] !== TT.VOID || F.fs[i] === A.FS.WATER;
    };
    for (const f of O.fires) {
      const fx = f.x - ox, fy = f.y - oy, r = f.r;
      if (fx < -r * 2 - 8 || fx > vw + r * 2 + 8 || fy < -r - 8 || fy > vh + r * 3 + 8) continue;
      const rq = new SX.Rng(f.s);
      for (let k = 0; k < 6 + r; k++) {
        const a = fx - r + rq.i(r * 2), b = fy - 2 - rq.i(r), w = 2 + rq.i(2), h = 2 + rq.i(3), c = rq.pick([ "#ff9a3a", "#ffd070", "#ff6a20" ]);
        if (!off(a, b)) P.r(a, b, w, h, c);
      }
    }
  }
  HO.setDay = function(F, day) {
    const O = F && F.out;
    if (!O) return false;
    day = !!(day && O.sky);
    if (!!O.day === day) return false;
    O.day = day;
    O.gc.clear();
    O.cells.clear();
    if (F.chunks) F.chunks.clear();
    return true;
  };
  HO.roofAt = (F, tx, ty) => {
    const O = F.out;
    if (!O) return false;
    const i = gidx(O, tx, ty);
    return i >= 0 && O.k[i] === K.HALL;
  };
  HO.stats = function(F) {
    const O = F && F.out;
    if (!O) return null;
    const n = {};
    for (const k in K) {
      n[k] = 0;
    }
    const names = Object.keys(K);
    for (let i = 0; i < O.k.length; i++) n[names[O.k[i]]]++;
    return {
      kind: O.kind,
      lots: O.lots.filter(L => !L.dead).length,
      props: O.props.length,
      lamps: F.lamps.filter(l => l.out).length,
      heads: O.heads.length,
      cells: n
    };
  };
})(window.SX);
