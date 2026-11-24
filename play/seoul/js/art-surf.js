"use strict";

(function(SX) {
  const A = SX.art, TS = SX.TS, RP = A.ramp, sh = A.shade, mix = A.mix, PP = A.PP, C = A.C;
  const AS = SX.artSurf = {};
  let WH = A.WALL_H, TH = WH - 5;
  const BH = 5;
  const setH = h => {
    WH = h;
    TH = h - BH;
  };
  const hsh = (a, b, c) => {
    let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 1274126177) >>> 0;
    return (h ^ h >>> 16) >>> 0;
  };
  const rgba = (hex, a) => {
    const [r, g, b] = A.hexRgb(hex);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  };
  const pmod = (a, n) => (a % n + n) % n;
  const W = {
    scuff(P, g, n, c) {
      for (let k = 0; k < n; k++) {
        const x = 3 + g.i(24), y = 3 + g.i(24), l = 2 + g.i(5);
        P.r(x, y, l, 1, c);
        if (g.chance(.4)) P.r(x + 1, y + 1, Math.max(1, l - 2), 1, c);
      }
    },
    scratch(P, g, n, c, lo) {
      for (let k = 0; k < n; k++) {
        let x = 3 + g.i(22), y = 3 + g.i(20);
        const l = 4 + g.i(7), dx = g.chance(.5) ? 1 : -1;
        for (let s = 0; s < l; s++) {
          if (x > 1 && x < 30 && y > 1 && y < 30) P.p(x, y, c);
          x += dx;
          if (s % 2) y++;
        }
        if (lo) P.p(x - dx, y, lo);
      }
    },
    stain(P, g, base, k) {
      const cx = 8 + g.i(16), cy = 8 + g.i(16), rx = 3 + g.i(4), ry = 2 + g.i(3);
      const R = RP(base), dk = k || -.12;
      P.oval(cx, cy, rx, ry, sh(base, dk * .6));
      P.oval(cx + 1, cy, Math.max(1, rx - 2), Math.max(1, ry - 1), sh(base, dk));
      P.ring(cx, cy, rx, ry, sh(base, dk * 1.3));
      if (g.chance(.5)) P.p(cx + rx + 1, cy - 1, sh(base, dk));
      return R;
    },
    ring(P, g, base) {
      const cx = 9 + g.i(14), cy = 9 + g.i(14), r = 3 + g.i(2);
      P.ring(cx, cy, r, r - 1, sh(base, -.18));
      P.ring(cx, cy, r - 1, r - 2, sh(base, -.07));
    },
    burn(P, g, base) {
      const x = 6 + g.i(20), y = 6 + g.i(20);
      P.r(x - 1, y, 4, 1, sh(base, -.3)).r(x, y - 1, 2, 3, sh(base, -.3)).r(x, y, 2, 1, "#2a1a10").p(x + 1, y - 1, "#3a2416").p(x + 3, y + 1, sh(base, -.15));
    },
    dust(P, g, n, c) {
      for (let k = 0; k < n; k++) P.p(2 + g.i(28), 2 + g.i(28), c);
    },
    crumbs(P, g, n) {
      for (let k = 0; k < n; k++) {
        const x = 3 + g.i(26), y = 3 + g.i(26);
        P.p(x, y, g.pick([ "#8a6a3a", "#c8b070", "#6a5030", "#d8d0b8" ]));
      }
    },
    tape(P, g, base, col) {
      const w = 7 + g.i(6), h = 3 + g.i(3), x = 4 + g.i(30 - w - 4), y = 4 + g.i(30 - h - 4), c = col || "#b89a5a", R = RP(c);
      P.r(x, y, w, h, c).r(x, y, w, 1, R[4]).r(x, y + h - 1, w, 1, R[2]).p(x, y + h - 1, R[1]).p(x + w - 1, y, R[2]);
      for (let k = 0; k < 2; k++) P.p(x + 1 + g.i(w - 2), y + 1 + g.i(Math.max(1, h - 2)), R[2]);
    },
    nail(P, x, y, c) {
      const R = RP(c || "#8a9098");
      P.p(x, y, R[4]).p(x + 1, y, R[2]).p(x, y + 1, R[1]);
    },
    hole(P, x, y, base) {
      P.p(x, y, sh(base, -.55)).p(x + 1, y, sh(base, -.3)).p(x, y + 1, sh(base, -.25)).p(x - 1, y - 1, sh(base, .12));
    },
    crack(P, g, c, n) {
      let x = 4 + g.i(24), y = 3 + g.i(6);
      for (let k = 0; k < (n || 12); k++) {
        if (x < 2 || x > 29 || y > 29) break;
        P.p(x, y, c);
        y++;
        if (g.chance(.45)) x += g.chance(.5) ? 1 : -1;
      }
    },
    hair(P, g, c) {
      let x = 4 + g.i(24), y = 4 + g.i(24);
      const l = 3 + g.i(4);
      for (let k = 0; k < l; k++) {
        P.p(x, y, c);
        x += g.chance(.6) ? 1 : 0;
        y += g.chance(.6) ? 1 : -1;
        if (x > 29 || y < 2 || y > 29) break;
      }
    }
  };
  AS.wear = W;
  const FL = {};
  const floor = (id, per, d) => {
    FL[id] = {
      per,
      d
    };
  };
  function planks(P, g, cx, cy, o) {
    const base = o.base, L = o.len || 96, tones = o.tones || [ 0, -.05, .04, -.09 ], RB = RP(base);
    for (let k = 0; k < 4; k++) {
      const y = k * 8, row = cy * 4 + k, tone = tones[SX.hash((o.key || "p") + row) % tones.length], c = tone ? sh(base, tone) : base, R = RP(c);
      P.r(0, y, TS, 8, c).r(0, y, TS, 1, R[4]).r(0, y + 7, TS, 1, RB[1]);
      const off = SX.hash((o.key || "p") + "o" + row) % L;
      for (let x = 0; x < TS; x++) {
        const wx = cx * TS + x;
        if ((wx + off) % L === 0) {
          P.r(x, y, 1, 8, RB[1]).r(x + 1, y, 1, 7, R[4]);
          if (o.nails && x < TS - 3) {
            P.p(x + 2, y + 2, o.nails).p(x + 2, y + 5, o.nails);
          }
        }
      }
      for (let s = 0; s < (o.grain || 3); s++) {
        const gx = g.i(TS - 6), gy = y + 2 + g.i(4);
        P.r(gx, gy, 4 + g.i(9), 1, g.chance(.6) ? R[2] : R[4]);
      }
      if (g.chance(o.knot || .06)) {
        const kx = 3 + g.i(24), ky = y + 3 + g.i(2);
        P.oval(kx, ky, 2, 1, R[1]).p(kx, ky, R[0]).r(kx - 4, ky - 1, 3, 1, R[2]).r(kx + 3, ky + 1, 3, 1, R[2]);
      }
    }
  }
  function woodWear(P, g, v, base) {
    if (v === 3) W.scratch(P, g, 2 + g.i(2), sh(base, .22), sh(base, -.2)); else if (v === 4) W.ring(P, g, base); else if (v === 5) {
      W.stain(P, g, base, -.14);
    } else if (v === 6) {
      const x = 5 + g.i(20), y = 5 + g.i(20);
      P.r(x, y, 3, 2, sh(base, -.22)).p(x, y, sh(base, -.35)).r(x, y - 1, 3, 1, sh(base, .12));
      W.scuff(P, g, 2, sh(base, -.12));
    } else if (v === 7) {
      W.dust(P, g, 10, sh(base, .18));
      W.crumbs(P, g, 2);
    }
  }
  floor("linoY", [ 2, 2 ], (P, g, cx, cy, v) => {
    const b = "#a8853f", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.06), sh(b, .05) ], .1, g);
    for (let y = 1; y < TS; y += 4) for (let x = (y >> 2 & 1) * 2 + 1; x < TS; x += 4) P.p(x, y, sh(b, .09));
    for (let k = 0; k < 3; k++) {
      const x = pmod(cx * TS + cy * 7 + k * 11, TS);
      P.r(x, 0, 1, TS, sh(b, .05));
    }
    if (cx === 0) P.r(0, 0, 1, TS, sh(b, -.12)).r(1, 0, 1, TS, sh(b, .06));
    P.line(4, 26, 26, 4, sh(b, .1)).line(5, 27, 27, 5, sh(b, .06));
    if (v === 3) W.scuff(P, g, 3, R[2]); else if (v === 4) W.burn(P, g, b); else if (v === 5) {
      const x = 6 + g.i(16), y = 8 + g.i(14);
      P.oval(x, y, 4, 2, sh(b, .12));
      P.r(x - 4, y + 2, 8, 1, R[2]);
    } else if (v === 6) {
      const x = 6 + g.i(18), y = 6 + g.i(18);
      P.line(x, y, x + 5, y + 2, "#2a2418").line(x, y + 1, x + 4, y + 3, sh(b, .15));
    } else if (v === 7) W.tape(P, g, b, "#9a7a48");
  });
  floor("linoP", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#a89272", R = RP(b), fl = "#8a5a36", fl2 = "#b8763a", lf = "#6a7448";
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.06), sh(b, .05) ], .09, g);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const x = i * 16 + 8 + (j ? 0 : 0), y = j * 16 + 8, ox = j ? 8 : 0, fx = pmod(x + ox, TS), fy = y;
      P.p(fx, fy - 2, fl).p(fx - 2, fy, fl).p(fx + 2, fy, fl).p(fx, fy + 2, fl).r(fx - 1, fy - 1, 3, 3, fl2).p(fx, fy, "#d8b45a");
      P.p(fx + 3, fy + 3, lf).p(fx + 4, fy + 3, lf).p(fx - 3, fy - 3, lf).p(fx - 4, fy - 4, lf);
      P.p(pmod(fx + 8, TS), fy + 8 > 31 ? fy - 8 : fy + 8, sh(b, -.1));
    }
    if (v === 3) W.scuff(P, g, 3, R[2]); else if (v === 4) W.stain(P, g, b, -.12); else if (v === 5) W.burn(P, g, b); else if (v === 6) {
      for (let k = 0; k < 14; k++) P.p(8 + g.i(16), 8 + g.i(16), sh(b, .12));
    } else if (v === 7) W.crumbs(P, g, 4);
  });
  floor("woodL", [ 3, 8 ], (P, g, cx, cy, v) => {
    const b = "#a07a48";
    planks(P, g, cx, cy, {
      base: b,
      key: "wl",
      nails: "#6a5a48",
      knot: .08
    });
    woodWear(P, g, v, b);
  });
  floor("woodD", [ 3, 8 ], (P, g, cx, cy, v) => {
    const b = "#5a3a26";
    planks(P, g, cx, cy, {
      base: b,
      key: "wd",
      tones: [ 0, -.07, .05, -.04, .08 ],
      nails: "#3a2a20",
      knot: .05,
      grain: 4
    });
    woodWear(P, g, v, b);
  });
  floor("herring", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#8a6640", U = 4;
    for (let Y = 0; Y < 8; Y++) for (let X = 0; X < 8; X++) {
      const wX = cx * 8 + X, wY = cy * 8 + Y, d = pmod(wX - wY, 4), hz = d < 2;
      const sx = hz ? wX - d : wX, sy = hz ? wY : wY - (d === 2 ? 1 : 0);
      const t = [ 0, -.06, .05, -.1, .03, -.03 ][hsh(sx, sy, 7) % 6], c = t ? sh(b, t) : b, R = RP(c);
      const px = X * U, py = Y * U;
      P.r(px, py, U, U, c);
      if (hz) {
        P.r(px, py, U, 1, R[4]);
        if (d === 1) P.r(px + U - 1, py, 1, U, R[1]);
        P.r(px, py + U - 1, U, 1, R[2]);
        if ((wX + wY) % 3 === 0) P.r(px, py + 2, U - 1, 1, R[2]);
      } else {
        P.r(px, py, 1, U, R[4]);
        P.r(px + U - 1, py, 1, U, R[2]);
        if (d === 2) P.r(px, py + U - 1, U, 1, R[1]);
        if ((wX + wY) % 3 === 1) P.r(px + 2, py, 1, U - 1, R[2]);
      }
    }
    woodWear(P, g, v, b);
  });
  floor("lam", [ 5, 8 ], (P, g, cx, cy, v) => {
    const b = "#8a8274", R = RP(b);
    for (let k = 0; k < 4; k++) {
      const y = k * 8, row = cy * 4 + k, off = SX.hash("lm" + row) % 160, c = sh(b, [ 0, .03, -.03, .05 ][SX.hash("lt" + row) % 4]), Rc = RP(c);
      P.r(0, y, TS, 8, c).r(0, y, TS, 1, Rc[4]).r(0, y + 7, TS, 1, R[2]);
      for (let x = 0; x < TS; x++) {
        const wx = cx * TS + x;
        if ((wx + off) % 160 === 0) P.r(x, y, 1, 7, R[2]).p(x + 1, y + 1, Rc[4]);
        const q = (wx + row * 37) % 23;
        if (q === 3 || q === 11) P.r(x, y + 2 + (q & 3), 1, 1, Rc[2]);
        if (q === 17) P.r(x, y + 4, 3, 1, Rc[2]);
      }
    }
    if (v === 3) W.scratch(P, g, 3, sh(b, .2)); else if (v === 4) {
      const y = 8 * (1 + g.i(3)) - 1, x = 4 + g.i(18);
      P.r(x, y - 1, 9, 1, sh(b, .14)).r(x, y, 9, 1, sh(b, -.25));
    } else if (v === 5) W.stain(P, g, b, -.1); else if (v === 6) {
      const x = 6 + g.i(18), y = 8 * g.i(4) + 2;
      P.r(x, y, 4, 3, sh(b, -.18)).r(x, y, 4, 1, "#b8b2a6");
    } else if (v === 7) W.dust(P, g, 12, sh(b, .16));
  });
  function tiles(P, g, a, gr, v, chk) {
    P.r(0, 0, TS, TS, gr);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const c0 = chk ? i + j & 1 ? chk : a : a, c = g.chance(.12) ? sh(c0, -.04) : c0, R = RP(c), x = i * 16 + 1, y = j * 16 + 1;
      P.r(x, y, 15, 15, c).r(x, y, 15, 1, R[4]).r(x, y, 1, 15, R[4]).r(x, y + 14, 15, 1, R[2]).r(x + 14, y, 1, 15, R[2]);
      P.r(x + 2, y + 2, 4, 1, sh(c, .12)).p(x + 2, y + 3, sh(c, .12));
    }
    const pick = () => [ g.i(2) * 16 + 1, g.i(2) * 16 + 1 ];
    if (v === 3) {
      const [x, y] = pick();
      P.line(x + 3, y + 2, x + 6, y + 7, sh(a, -.2)).line(x + 6, y + 7, x + 5, y + 12, sh(a, -.2)).p(x + 7, y + 8, sh(a, -.12));
    } else if (v === 4) {
      const [x, y] = pick();
      P.r(x + 12, y, 3, 2, gr).p(x + 13, y + 2, gr).p(x + 11, y, sh(gr, .1));
    } else if (v === 5) {
      for (let k = 0; k < TS; k += 2) if (g.chance(.5)) P.p(k, 15 + g.i(2), sh(gr, -.3));
      for (let k = 0; k < TS; k += 2) if (g.chance(.5)) P.p(15 + g.i(2), k, sh(gr, -.3));
    } else if (v === 6) W.stain(P, g, a, -.1); else if (v === 7) {
      W.hair(P, g, sh(a, -.35));
      W.dust(P, g, 6, sh(a, -.12));
    }
  }
  floor("tileW", [ 1, 1 ], (P, g, cx, cy, v) => tiles(P, g, "#cfcdc4", "#8e8c84", v));
  floor("tileC", [ 1, 1 ], (P, g, cx, cy, v) => tiles(P, g, "#d0ccc0", "#5a5850", v, "#2e2e33"));
  floor("terra", [ 2, 2 ], (P, g, cx, cy, v) => {
    const b = "#b4ab9a", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.06), sh(b, .05) ], .1, g);
    const chips = [ "#6a6a6c", "#8a4a32", "#2a2a2c", "#e6e0d2", "#4a6a52", "#9a8a6a", "#c89a6a" ];
    for (let k = 0; k < 34; k++) {
      const x = 1 + g.i(30), y = 1 + g.i(30), c = chips[g.i(chips.length)], s = g.i(4);
      P.p(x, y, c);
      if (s > 0) P.p(x + 1, y, c);
      if (s > 1) P.p(x, y + 1, sh(c, -.1));
      if (s > 2) P.p(x + 1, y + 1, sh(c, .1));
    }
    if (cx === 0) P.r(0, 0, 1, TS, "#9a8048");
    if (cy === 0) P.r(0, 0, TS, 1, "#a88a50");
    P.r(5, 5, 5, 1, sh(b, .1));
    if (v === 3) W.scuff(P, g, 3, R[2]); else if (v === 4) W.stain(P, g, b, -.08); else if (v === 5) W.hair(P, g, R[1]); else if (v === 6) W.ring(P, g, b); else if (v === 7) W.dust(P, g, 8, R[1]);
  });
  function pile(P, g, b, d) {
    const R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.08), sh(b, .06), sh(b, -.04) ], d || .34, g);
    for (let y = 0; y < TS; y += 2) for (let x = y >> 1 & 1; x < TS; x += 4) P.p(x, y, R[2]);
    return R;
  }
  function carpWear(P, g, v, b) {
    if (v === 3) W.stain(P, g, b, -.16); else if (v === 4) {
      for (let k = 0; k < 40; k++) P.p(6 + g.i(20), 6 + g.i(20), sh(b, .1));
    } else if (v === 5) {
      W.burn(P, g, b);
    } else if (v === 6) {
      for (let k = 0; k < 6; k++) {
        const x = 3 + g.i(26), y = 3 + g.i(26);
        P.p(x, y, "#c8c4b8").p(x + 1, y, "#a8a49a");
      }
    } else if (v === 7) W.crumbs(P, g, 5);
  }
  floor("carpG", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#5a5c60";
    pile(P, g, b);
    carpWear(P, g, v, b);
  });
  floor("carpR", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#7a2c2a";
    pile(P, g, b, .3);
    carpWear(P, g, v, b);
  });
  floor("carpP", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#2e3852", R = pile(P, g, b, .22), red = "#6a2a32", gold = "#9a7a3a";
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const dx = Math.abs(x - 15.5), dy = Math.abs(y - 15.5), m = dx + dy;
      if (m > 12.5 && m < 14.5) P.p(x, y, gold); else if (m < 7.5 && m > 5.5) P.p(x, y, red); else if (m < 2.5) P.p(x, y, gold); else if (dx < 1 && dy > 14 || dy < 1 && dx > 14) P.p(x, y, red);
    }
    for (let k = 0; k < 30; k++) P.p(g.i(TS), g.i(TS), R[2]);
    carpWear(P, g, v, b);
  });
  floor("concB", [ 2, 2 ], (P, g, cx, cy, v) => {
    const b = "#76736e", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.07), sh(b, .05), sh(b, -.03) ], .16, g);
    for (let k = 0; k < 5; k++) P.p(g.i(TS), g.i(TS), g.pick([ "#5a5854", "#9a968e", "#4a4844" ]));
    {
      const ox = cx * TS, oy = cy * TS;
      for (let a = 0; a < 2; a++) {
        const r = 22 + a * 9;
        for (let t = 0; t < 40; t++) {
          const ang = t / 40 * Math.PI, x = Math.round(48 + Math.cos(ang) * r) - ox, y = Math.round(40 - Math.sin(ang) * r * .6) - oy;
          if (x >= 0 && x < TS && y >= 0 && y < TS) P.p(x, y, sh(b, .06));
        }
      }
    }
    if (v === 3) {
      for (let k = 0; k < 3; k++) {
        const x = 4 + g.i(18), y = 4 + g.i(22);
        P.r(x, y, 6 + g.i(6), 1, "#4a3e30").p(x + 2, y + 1, "#4a3e30");
      }
    } else if (v === 4) W.crack(P, g, R[1], 16); else if (v === 5) {
      const x = 8 + g.i(14), y = 8 + g.i(14);
      P.r(x, y, 2, 2, "#2a2a2a").p(x - 1, y - 1, R[4]);
      P.r(x + 6, y + 1, 2, 2, "#2a2a2a");
    } else if (v === 6) {
      for (let k = 0; k < 4; k++) {
        const x = 4 + g.i(24), y = 4 + g.i(24);
        P.r(x, y, 2, 1, g.pick([ "#c8c4b8", "#b8402a", "#4a6aa8" ]));
      }
    } else if (v === 7) W.stain(P, g, b, -.12);
  });
  floor("concP", [ 2, 2 ], (P, g, cx, cy, v) => {
    const b = "#56685e", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ R[2], R[4] ], .05, g);
    P.line(2 + cx * 6, 28, 22 + cx * 6, 2, sh(b, .08)).line(3 + cx * 6, 29, 23 + cx * 6, 3, sh(b, .04));
    if (cx === 1 && cy === 1) P.r(0, 29, TS, 1, sh(b, -.08));
    if (v === 3) {
      const x = 4 + g.i(12), y = 6 + g.i(18);
      P.r(x, y, 12, 2, "#c8a032").r(x, y, 12, 1, "#d8b042").p(x + 4, y + 1, b).p(x + 9, y, R[1]);
    } else if (v === 4) {
      const x = 6 + g.i(16), y = 6 + g.i(16);
      P.oval(x, y, 3, 2, "#7a7670");
      P.p(x - 2, y, "#8a8680").p(x + 1, y + 1, "#6a6660");
    } else if (v === 5) {
      for (let x = 2; x < 30; x++) if ((x & 3) !== 0) P.p(x, 12 + (x >> 3 & 1), "#3a4440");
    } else if (v === 6) W.scuff(P, g, 4, "#3e4a44"); else if (v === 7) {
      W.dust(P, g, 10, sh(b, .12));
    }
  });
  floor("rubber", [ 1, 1 ], (P, g, cx, cy, v) => {
    const b = "#2e3034", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.1), sh(b, .08) ], .2, g);
    for (let k = 0; k < 10; k++) P.p(1 + g.i(30), 1 + g.i(30), g.pick([ "#3e5276", "#56585c", "#6e3e34", "#3e6a4a" ]));
    for (let k = 0; k < 4; k++) {
      const t = k * 8 + 2;
      P.r(t, 0, 4, 2, sh(b, .1)).r(t + 1, 2, 2, 1, sh(b, .1));
      P.r(0, t + 4, 2, 4, sh(b, -.12)).r(2, t + 5, 1, 2, sh(b, -.12));
    }
    if (v === 3) W.scuff(P, g, 4, "#4a4c50"); else if (v === 4) W.dust(P, g, 14, "#5a5c60"); else if (v === 5) {
      const x = 6 + g.i(18), y = 6 + g.i(18);
      P.r(x, y, 5, 3, "#3a3c40").r(x, y, 5, 1, "#46484c");
    } else if (v === 6) W.stain(P, g, b, .15); else if (v === 7) W.crumbs(P, g, 3);
  });
  floor("straw", [ 1, 4 ], (P, g, cx, cy, v) => {
    const b = "#b09a68", R = RP(b);
    for (let y = 0; y < TS; y += 2) {
      const row = cy * 16 + (y >> 1), c = row & 1 ? sh(b, .06) : sh(b, -.04);
      P.r(0, y, TS, 2, c).r(0, y + 1, TS, 1, sh(c, -.06));
      for (let x = (row & 1) * 4; x < TS; x += 8) P.p(x, y, sh(c, -.14));
    }
    for (let x = 3; x < TS; x += 8) for (let y = 0; y < TS; y += 2) if ((y >> 1) + (x >> 3) & 1) P.p(x, y + 1, "#7a6640");
    if (cy === 0) {
      P.r(0, 10, TS, 2, "#8a3a32").r(0, 12, TS, 2, "#4a6a3a").r(0, 14, TS, 2, "#8a3a32");
      for (let x = 1; x < TS; x += 4) P.p(x, 12, "#c8a050").p(x + 2, 13, "#c8a050");
    }
    if (v === 3) {
      const x = 5 + g.i(20), y = 2 * (2 + g.i(12));
      P.r(x, y, 5, 1, sh(b, .2)).p(x + 5, y - 1, sh(b, .2));
    } else if (v === 4) W.stain(P, g, b, -.12); else if (v === 5) W.burn(P, g, b); else if (v === 6) W.crumbs(P, g, 4); else if (v === 7) {
      W.dust(P, g, 8, sh(b, -.2));
    }
  });
  floor("steel", [ 2, 2 ], (P, g, cx, cy, v) => {
    const b = "#6e747a", R = RP(b);
    P.r(0, 0, TS, TS, b).noise(0, 0, TS, TS, [ sh(b, -.05), sh(b, .04) ], .06, g);
    for (let y = 2; y < TS; y += 6) for (let x = 0; x < TS; x += 6) {
      const ox = y / 6 & 1 ? 3 : 0, X = x + ox, up = ((cx * TS + X) / 6 | 0) + ((cy * TS + y) / 6 | 0) & 1;
      if (X > TS - 3) continue;
      if (up) {
        P.p(X, y + 1, R[4]).p(X + 1, y, R[4]).p(X + 1, y + 1, R[2]).p(X + 2, y, R[2]);
      } else {
        P.p(X, y, R[4]).p(X + 1, y + 1, R[4]).p(X + 1, y, R[2]).p(X + 2, y + 1, R[2]);
      }
    }
    if (cx === 0) {
      for (let y = 0; y < TS; y += 2) P.p(0, y, sh(b, .12)).p(1, y + 1, sh(b, -.12));
    }
    if (cx === 0 && cy === 0) {
      PP.rivet(P, 3, 3, R);
      PP.rivet(P, 3, 27, R);
    }
    if (v === 3) PP.rust(P, 4, 4, 24, 24, g, 3); else if (v === 4) {
      for (let k = 0; k < 16; k++) P.p(8 + g.i(16), 8 + g.i(16), R[5]);
    } else if (v === 5) W.scuff(P, g, 3, R[1]); else if (v === 6) {
      PP.rust(P, 6, 6, 20, 20, g, 5);
    } else if (v === 7) W.stain(P, g, b, -.1);
  });
  floor("turf", [ 1, 1 ], (P, g, cx, cy, v) => {
    const a = "#3e6430", c2 = "#466e36";
    for (let y = 0; y < TS; y++) P.r(0, y, TS, 1, cy * TS + y >> 4 & 1 ? a : c2);
    for (let k = 0; k < 70; k++) {
      const x = g.i(TS), y = 1 + g.i(TS - 2), h = 1 + g.i(3);
      P.r(x, Math.max(0, y - h + 1), 1, h, g.pick([ "#52803e", "#34582a", "#4a7438", "#5a8a46" ]));
    }
    for (let k = 0; k < 6; k++) P.p(g.i(TS), g.i(TS), "#1e2a1a");
    if (v === 3) {
      const x = 6 + g.i(18), y = 6 + g.i(18);
      P.r(x, y, 3, 2, "#a8662a").p(x + 1, y - 1, "#c8862a").p(x + 3, y + 1, "#7a4a1e");
    } else if (v === 4) {
      const x = 6 + g.i(18), y = 6 + g.i(18);
      P.r(x, y, 3, 1, "#e8e4da").p(x + 3, y, "#c8803a");
    } else if (v === 5) {
      for (let k = 0; k < 10; k++) P.p(8 + g.i(14), 8 + g.i(14), "#2a2a26");
    } else if (v === 6) {
      const x = 8 + g.i(14), y = 8 + g.i(14);
      P.oval(x, y, 3, 2, "#4a5a3a");
    } else if (v === 7) W.crumbs(P, g, 3);
  });
  const vOf = (tx, ty, s) => {
    const h = hsh(tx, ty, s) % 16;
    return h < 9 ? h % 3 : 3 + (h - 9) % 5;
  };
  AS.vOf = vOf;
  const fcache = A.keyMap ? A.keyMap(new Map, "surf:") : new Map;
  AS.floorIds = () => Object.keys(FL);
  AS.hasFloor = id => !!FL[id];
  AS.floor = function(id, tx, ty) {
    const f = FL[id];
    if (!f) return null;
    const cx = pmod(tx, f.per[0]), cy = pmod(ty, f.per[1]), v = vOf(tx, ty, 17), key = id + ":" + cx + ":" + cy + ":" + v;
    let c = fcache.get(key);
    if (!c) {
      c = A.mk(TS, TS);
      const P = new A.Pen(c.getContext("2d"));
      f.d(P, new SX.Rng(hsh(cx, cy, v) + SX.hash(id)), cx, cy, v);
      fcache.set(key, c);
    }
    return c;
  };
  const WLD = {};
  const wall = (id, per, base, d, cap) => {
    WLD[id] = {
      per,
      base,
      d,
      cap: cap || sh(base, -.42)
    };
  };
  function wallWear(P, g, v, base, o) {
    o = o || {};
    if (v === 3) {
      W.hole(P, 4 + g.i(24), 4 + g.i(TH - 9), base);
      W.hole(P, 4 + g.i(24), 4 + g.i(TH - 9), base);
    } else if (v === 4) {
      const x = 4 + g.i(22), y = 3 + g.i(4);
      for (let k = 0; k < 4 + g.i(6); k++) P.p(x + k % 2, y + k, sh(base, -.12));
      P.r(x - 1, y, 3, 1, sh(base, -.08));
    } else if (v === 5) {
      if (o.peel) {
        const x = 3 + g.i(20), y = 3 + g.i(6);
        P.poly([ [ x, y ], [ x + 7, y ], [ x + 2, y + 5 ] ], o.peel);
        P.line(x, y, x + 6, y, sh(base, .18)).line(x + 1, y + 1, x + 3, y + 4, sh(base, -.3));
      } else W.scuff(P, g, 3, sh(base, -.15));
    } else if (v === 6) {
      const x = 4 + g.i(18), y = (TH > 24 ? TH - 22 : 5) + g.i(6);
      P.r(x, y, 3, 4, sh(base, -.1)).p(x + 3, y + 1, sh(base, -.1)).p(x + 1, y + 4, sh(base, -.1));
      P.r(x + 6, y + 2, 2, 3, sh(base, -.08));
    } else if (v === 7) {
      W.crack(P, g, sh(base, -.3), 9);
    }
  }
  wall("wpFlower", 1, "#ac9c78", (P, g, cx, v) => {
    const b = "#ac9c78", R = RP(b);
    P.r(0, 0, TS, TH, b).noise(0, 0, TS, TH, [ R[2], R[4] ], .05, g);
    for (let oy = 0; oy + 4 < TH - 2; oy += 16) for (const [x, y0] of [ [ 4, 4 ], [ 20, 4 ], [ 12, 12 ], [ 28, 12 ] ]) {
      const y = y0 + oy;
      if (y + 3 >= TH) continue;
      P.p(x, y - 1, "#9a4a46").r(x - 1, y, 3, 1, "#b85a52").p(x, y + 1, "#8a3a38").p(x, y, "#d0786a");
      P.p(x - 2, y + 2, "#5a7048").p(x + 2, y + 2, "#5a7048").p(x + 1, y + 3, "#4a6040");
    }
    P.r(16, 0, 1, TH, sh(b, -.06));
    wallWear(P, g, v, b, {
      peel: sh(b, .14)
    });
  });
  wall("wpStripe", 1, "#7e8e7e", (P, g, cx, v) => {
    const a = "#7e8e7e", b2 = "#6e7e70";
    for (let x = 0; x < TS; x += 8) {
      P.r(x, 0, 4, TH, a).r(x + 4, 0, 4, TH, b2).r(x + 4, 0, 1, TH, "#a89a62");
    }
    P.noise(0, 0, TS, TH, [ sh(a, -.06), sh(a, .05) ], .05, g);
    wallWear(P, g, v, a, {
      peel: sh(a, .15)
    });
  });
  wall("wpDamask", 1, "#552a2e", (P, g, cx, v) => {
    const b = "#552a2e", m = "#7e4a46", au = "#b8945a";
    P.r(0, 0, TS, TH, b).noise(0, 0, TS, TH, [ sh(b, -.08) ], .06, g);
    for (let oy = 0; TH > 24 ? oy + 2 < TH : oy === 0; oy += 16) for (const x of oy >> 4 & 1 ? [ 0, 16, 32 ] : [ 8, 24 ]) {
      const y = 9 + oy;
      P.r(x, y - 6, 1, 13, m);
      P.r(x - 2, y - 4, 5, 1, m).r(x - 3, y - 2, 7, 1, m).r(x - 4, y, 9, 1, m).r(x - 3, y + 2, 7, 1, m).r(x - 2, y + 4, 5, 1, m);
      P.p(x - 4, y - 3, m).p(x + 4, y - 3, m).p(x - 5, y + 1, m).p(x + 5, y + 1, m).p(x, y - 7, au).p(x, y + 7, au).p(x - 6, y, au).p(x + 6, y, au);
    }
    wallWear(P, g, v, b, {
      peel: sh(b, .2)
    });
  });
  function paintWall(id, b) {
    wall(id, 1, b, (P, g, cx, v) => {
      const R = RP(b);
      P.r(0, 0, TS, TH, b);
      for (let x = 0; x < TS; x++) {
        const h = SX.hash(id + (cx * TS + x)) % 11;
        if (h < 2) P.r(x, 2, 1, TH - 3, sh(b, .03)); else if (h > 9) P.r(x, 3, 1, TH - 5, sh(b, -.03));
      }
      P.noise(0, 0, TS, TH, [ R[2], R[4] ], .03, g);
      if (v === 5) {
        const x = 6 + g.i(16);
        P.r(x, 4, 10, 8, sh(b, .04));
        P.r(x, 4, 10, 1, sh(b, .07));
      }
      wallWear(P, g, v, b);
    });
  }
  paintWall("pWhite", "#c6c2b6");
  paintWall("pMint", "#86ae9e");
  paintWall("pNavy", "#384860");
  wall("concX", 1, "#86857f", (P, g, cx, v) => {
    const b = "#86857f", R = RP(b);
    P.r(0, 0, TS, TH, b).noise(0, 0, TS, TH, [ R[2], R[4], sh(b, -.05) ], .12, g);
    P.r(0, 0, 1, TH, sh(b, -.1)).r(1, 0, 1, TH, sh(b, .06));
    for (let y = 6; y < TH - 2; y += TH > 24 ? 12 : 8) for (const x of [ 8, 24 ]) {
      P.r(x - 1, y - 1, 3, 3, sh(b, -.2)).p(x, y, "#3a3a38").p(x - 1, y - 1, sh(b, .1));
    }
    for (let k = 0; k < 6; k++) P.p(2 + g.i(28), 2 + g.i(TH - 3), sh(b, -.28));
    if (v === 4) {
      const x = 4 + g.i(22);
      for (let y = 6; y < TH; y++) if (g.chance(.7)) P.p(x + (y & 1), y, "#b8b6ac");
    } else wallWear(P, g, v, b);
  });
  wall("brick", 1, "#8a4636", (P, g, cx, v) => {
    const mort = "#857c70";
    P.r(0, 0, TS, TH, mort);
    for (let row = 0; row * 4 < TH; row++) {
      const y = row * 4, ox = row & 1 ? 4 : 0;
      for (let bx = -1; bx < 5; bx++) {
        const x = bx * 8 + ox, id = hsh(cx * 4 + bx + (ox ? 100 : 0), row, 3), c = [ "#8a4636", "#7a3a2e", "#9a5440", "#844030", "#6e3a30", "#96503a" ][id % 6], R = RP(c);
        const x0 = Math.max(0, x), x1 = Math.min(TS, x + 7);
        if (x1 <= x0) continue;
        P.r(x0, y, x1 - x0, 3, c).r(x0, y, x1 - x0, 1, R[4]).r(x0, y + 2, x1 - x0, 1, R[2]);
        if ((id >>> 3) % 5 === 0) P.p(x0 + 2, y + 1, R[1]);
        if ((id >>> 5) % 7 === 0) P.p(x1 - 1, y, mort);
      }
    }
    if (v === 3) {
      for (let k = 0; k < 12; k++) P.p(4 + g.i(24), 2 + g.i(6), "#2e2420");
    } else if (v === 4) {
      const x = 4 + g.i(22), y = 4 * (1 + g.i(3));
      P.r(x, y, 3, 2, mort).p(x + 1, y + 2, sh(mort, -.2));
    } else if (v === 5) {
      for (let x = 6; x < 26; x++) if (g.chance(.4)) P.p(x, 12 + g.i(4), "#c8c2b4");
    } else if (v === 6) W.hole(P, 6 + g.i(20), 6 + g.i(8), "#8a4636");
  });
  wall("panel", 1, "#6a4e34", (P, g, cx, v) => {
    const b = "#6a4e34";
    for (let k = 0; k < 4; k++) {
      const x = k * 8, c = sh(b, [ 0, -.06, .04, -.03 ][hsh(cx * 4 + k, 1, 9) % 4]), R = RP(c);
      P.r(x, 0, 8, TH, c).r(x, 0, 1, TH, RP(b)[1]).r(x + 1, 0, 1, TH, R[4]);
      PP.vgrain(P, x + 2, 0, 6, TH, c, g, 4);
      W.nail(P, x + 4, 3, "#4a4038");
      W.nail(P, x + 4, TH - 3, "#4a4038");
    }
    const my = TH > 24 ? WH - 20 : 8;
    P.r(0, my, TS, 2, sh(b, .12)).r(0, my, TS, 1, sh(b, .22)).r(0, my + 2, TS, 1, sh(b, -.3));
    if (v === 3) W.scratch(P, g, 2, sh(b, .2)); else if (v === 4) W.hole(P, 6 + g.i(20), my + 4 + g.i(4), b); else if (v === 6) {
      const x = 4 + g.i(22);
      P.r(x, my + 4, 3, 5, sh(b, -.2));
    }
  });
  wall("tileWall", 1, "#ccccc4", (P, g, cx, v) => {
    const t = "#ccccc4", gr = "#94928a";
    P.r(0, 0, TS, TH, gr);
    for (let row = 0; row * 4 < TH; row++) {
      const y = row * 4, ox = row & 1 ? 4 : 0;
      for (let bx = -1; bx < 5; bx++) {
        const x = bx * 8 + ox, x0 = Math.max(0, x), x1 = Math.min(TS, x + 7);
        if (x1 <= x0) continue;
        const c = hsh(cx * 4 + bx, row, 5) % 9 === 0 ? sh(t, -.05) : t, R = RP(c);
        P.r(x0, y, x1 - x0, 3, c).r(x0, y, x1 - x0, 1, R[5]).p(x0 + 1, y + 1, R[5]);
      }
    }
    for (let x = 0; x < TS; x += 2) if (g.chance(.5)) P.p(x, TH - 2 - g.i(3) * 4 + 3, sh(gr, -.25));
    if (v === 3) {
      P.line(8 + g.i(10), 4, 12 + g.i(10), 12, sh(gr, -.2));
    } else if (v === 4) W.stain(P, g, t, -.1); else if (v === 6) {
      const x = 4 + g.i(22);
      P.r(x, 8, 3, 3, gr);
    }
  });
  wall("foam", 1, "#3c3e44", (P, g, cx, v) => {
    const b = "#3c3e44", R = RP(b);
    P.r(0, 0, TS, TH, b);
    for (let row = 0; row * 8 < TH + 8; row++) for (let k = -1; k < 5; k++) {
      const x0 = k * 8 + (row & 1 ? 4 : 0), y0 = row * 8 - 2;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const X = x0 + x, Y = y0 + y;
        if (X < 0 || X >= TS || Y < 0 || Y >= TH) continue;
        const dx = x - 3.5, dy = y - 3.5;
        P.p(X, Y, Math.abs(dx) > Math.abs(dy) ? dx < 0 ? R[4] : R[2] : dy < 0 ? R[5] : R[1]);
      }
    }
    if (v === 3 || v === 6) {
      const y = 4 + g.i(10);
      P.r(0, y, TS, 3, "#9aa0a6").r(0, y, TS, 1, "#c8ccd0").r(0, y + 2, TS, 1, "#6a7076");
      for (let x = 2; x < TS; x += 5) P.p(x, y + 1, "#7a8086");
    } else if (v === 4) {
      const x = 6 + g.i(18), y = 4 + g.i(8);
      P.r(x, y, 4, 4, "#2a2c30");
    } else if (v === 5) W.dust(P, g, 10, "#5a5c62");
  });
  wall("news", 1, "#b8b29e", (P, g, cx, v) => {
    P.r(0, 0, TS, TH, "#8a8474");
    const pg = (x, y, w, h, s) => {
      const c = [ "#c4beaa", "#b8b29c", "#cac2a8", "#bcae8e" ][s % 4], R = RP(c);
      P.r(x, y, w, h, c).r(x, y + h - 1, w, 1, R[2]).r(x + w - 1, y, 1, h, R[2]);
      if (s % 3 === 0) {
        P.r(x + 1, y + 1, w - 2, 2, "#3a3632");
      } else PP.word(P, x + 1, y + 1, 3, "#4a4640", s, Math.max(1, (w - 2) / 5 | 0), 2, 1, 3);
      for (let ly = y + 5; ly < y + h - 1; ly += 2) PP.txt(P, x + 1, ly, w - 3, "#6a6458", g);
      if (s % 4 === 1 && w > 10 && h > 9) {
        P.r(x + w - 7, y + 5, 5, 4, "#6a6860").r(x + w - 7, y + 5, 5, 1, "#8a8880");
      }
    };
    const s0 = hsh(cx, 3, 11);
    pg(-4, 0, 18, 12, s0);
    pg(12, -2, 20, 11, s0 >>> 3);
    pg(2, 10, 16, 9, s0 >>> 6);
    pg(17, 8, 17, 11, s0 >>> 9);
    if (TH > 24) {
      const s1 = hsh(cx, 5, 17);
      pg(-3, 18, 17, 12, s1);
      pg(13, 17, 20, 13, s1 >>> 3);
      pg(3, 29, 18, 12, s1 >>> 6);
      pg(19, 29, 15, 12, s1 >>> 9);
      P.r(14, 17, 4, 2, "#c8b888").r(2, 29, 3, 2, "#c8b888");
    }
    P.r(11, 0, 4, 2, "#c8b888").r(16, 9, 4, 2, "#c8b888").r(1, 10, 3, 2, "#c8b888");
    if (v === 3 || v === 6) {
      for (let k = 0; k < 10; k++) P.p(3 + g.i(26), 2 + g.i(15), "#9a8a5a");
    } else if (v === 4) {
      const x = 4 + g.i(20);
      P.poly([ [ x, 6 ], [ x + 5, 6 ], [ x + 1, 11 ] ], "#8a8474");
    }
  });
  wall("foil", 1, "#a2a6aa", (P, g, cx, v) => {
    const b = "#a2a6aa", R = RP(b);
    P.r(0, 0, TS, TH, b);
    for (let y = 1; y < TH; y += 4) for (let x = (y >> 2 & 1) * 2; x < TS; x += 4) {
      P.p(x, y, R[5]).p(x + 1, y + 1, R[2]);
    }
    for (let k = 0; k < 5; k++) {
      const x = g.i(TS - 6), y = 2 + g.i(TH - 4);
      P.line(x, y, x + 3 + g.i(4), y + g.i(3) - 1, R[5]);
      P.p(x + 1, y + 1, R[1]);
    }
    P.r(0, 0, 3, TH, "#b8bcc0").r(2, 0, 1, TH, "#8a8e92");
    if (v === 3) {
      const x = 8 + g.i(14), y = 4 + g.i(8);
      P.r(x, y, 5, 3, "#6a6862").p(x + 2, y + 1, "#4a4844");
    } else if (v === 4) W.stain(P, g, b, -.15); else if (v === 5) {
      for (let k = 0; k < 8; k++) P.p(4 + g.i(24), 3 + g.i(14), R[0]);
    }
  });
  wall("graffiti", 2, "#66665f", (P, g, cx, v) => {
    const b = "#66665f", R = RP(b), pair = cx >> 1, half = cx & 1, q = hsh(pair, 7, 13);
    P.r(0, 0, TS, TH, b).noise(0, 0, TS, TH, [ sh(b, -.08), sh(b, .06) ], .1, g);
    const cols = [ "#c83a3a", "#3a7ac8", "#e8c030", "#5ab05a", "#e86ab4", "#e8e4d8", "#e87a2a" ], c1 = cols[q % 7], c2 = cols[(q >>> 4) % 7 === q % 7 ? (q % 7 + 3) % 7 : (q >>> 4) % 7];
    const WORDS = [ "SOS", "RUN", "EXIT", "HOME", "HELP", "OK", "NO", "KEEP OUT", "SAFE" ], word = WORDS[(q >>> 8) % WORDS.length], wpx = (word.length * 4 - 1) * 2;
    const ox = 3 + (q >>> 12) % Math.max(1, 58 - wpx) - half * TS, oy = (TH > 24 ? 13 : 3) + (q >>> 16 & 3);
    for (const [dx, dy] of [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ], [ 1, 1 ] ]) PP.mini(P, ox + dx, oy + dy, word, "#1e1e1c", 0, 2);
    PP.mini(P, ox, oy, word, c1, 0, 2);
    for (let k = 0; k < 3; k++) {
      const x = ox + 1 + (q >>> k * 5) % Math.max(1, wpx - 2);
      if (x >= 1 && x < TS - 1) P.r(x, oy + 10, 1, 2 + (q >>> k * 3 + 1) % 5, c1);
    }
    const fx = ox + wpx + 6;
    if (fx < 2 * TS - 12 - half * TS && fx + 10 > 0) {
      const k = (q >>> 20) % 3, x = fx + 4, y = oy + 9 - (q >>> 16 & 3);
      if (k === 0) {
        P.ring(x, y, 3, 3, c2);
        P.p(x - 1, y - 1, c2).p(x + 1, y - 1, c2).r(x - 1, y + 1, 3, 1, c2);
      } else if (k === 1) {
        P.thick(x - 4, y, x + 4, y, 1, c2).line(x + 2, y - 2, x + 4, y, c2).line(x + 2, y + 2, x + 4, y, c2);
      } else {
        for (let t = 0; t < 4; t++) P.r(x - 4 + t * 2, y - 2, 1, 5, "#e8e4d8");
        P.line(x - 5, y + 2, x + 3, y - 2, "#e8e4d8");
      }
    }
    const vy = TH > 24 ? 10 : 0;
    if (v === 4) {
      for (let k = 0; k < 18; k++) P.p(2 + g.i(28), 13 + vy + g.i(5), c2);
    } else if (v === 6) {
      P.r(4 + g.i(18), 12 + vy, 6, 4, sh(b, -.12)).r(4, 12 + vy, 1, 1, sh(b, -.2));
    }
  });
  wall("plywood", 1, "#a48a5e", (P, g, cx, v) => {
    const b = "#a48a5e", R = RP(b);
    P.r(0, 0, TS, TH, b).noise(0, 0, TS, TH, [ R[2], R[4] ], .06, g);
    for (let k = 0; k < (TH > 24 ? 5 : 3); k++) {
      const x = 4 + hsh(cx, k, 2) % 22, y = 3 + hsh(cx, k, 4) % (TH - 7);
      P.ring(x, y, 4, 2, R[2]);
      P.ring(x, y, 2, 1, R[2]);
    }
    if (TH > 24) P.r(0, 21, TS, 1, sh(b, -.2)).r(0, 22, TS, 1, sh(b, .08));
    P.r(0, 0, 1, TH, sh(b, -.2)).r(1, 0, 1, TH, sh(b, .08));
    for (let y = 3; y < TH; y += 6) {
      W.nail(P, 3, y, "#5a5650");
      W.nail(P, 29, y, "#5a5650");
    }
    if (v === 3) PP.mini(P, 9, 6, "CDX", "#3a4a8a"); else if (v === 4) {
      P.thick(10, 4, 20, 14, 2, "#c83a3a").thick(20, 4, 10, 14, 2, "#c83a3a");
    } else if (v === 5) W.stain(P, g, b, -.15); else if (v === 6) W.hole(P, 6 + g.i(20), 6 + g.i(8), b);
  });
  wall("tin", 1, "#848a90", (P, g, cx, v) => {
    const b = "#848a90", R = RP(b);
    for (let x = 0; x < TS; x++) P.r(x, 0, 1, TH, [ R[4], R[3], R[2], R[3] ][x & 3]);
    for (let x = 2; x < TS; x += 8) {
      PP.rivet(P, x, 2, R);
      PP.rivet(P, x, TH - 3, R);
    }
    for (let k = 0; k < 2; k++) {
      const x = 2 + hsh(cx, k, 6) % 26;
      for (let y = 4; y < TH - 1; y++) if (g.chance(.8)) P.p(x, y, k ? "#8a5a36" : "#9a6a3e");
    }
    if (v === 3) PP.rust(P, 4, 4, 24, 12, g, 5); else if (v === 4) {
      const x = 6 + g.i(14);
      P.r(x, 6, 10, 8, "#7a8086").r(x, 6, 10, 1, "#9aa0a6");
      PP.rivet(P, x + 1, 7, R);
      PP.rivet(P, x + 8, 12, R);
    } else if (v === 5) W.scuff(P, g, 2, R[1]);
  });
  const BB = {
    bWood(P, g, X) {
      const c = "#7a5634", R = RP(c);
      P.r(0, TH, TS, BH, c).r(0, TH, TS, 1, R[5]).r(0, TH + 1, TS, 1, R[4]).r(0, WH - 1, TS, 1, R[0]);
      for (let k = 0; k < 4; k++) P.r(g.i(TS - 6), TH + 2 + g.i(2), 4 + g.i(6), 1, R[2]);
      if (pmod(X, 96) < 32) W.nail(P, pmod(X + 7, TS), TH + 2, "#4a3a2a");
    },
    bWhite(P, g, X) {
      const c = "#d0ccc0", R = RP(c);
      P.r(0, TH, TS, BH, c).r(0, TH, TS, 1, R[5]).r(0, TH + 2, TS, 1, R[2]).r(0, WH - 1, TS, 1, R[1]);
      if (g.chance(.5)) P.r(4 + g.i(20), TH + 3, 3, 1, "#8a867c");
    },
    bSteel(P, g, X) {
      const c = "#9aa0a8", R = RP(c);
      P.r(0, TH, TS, BH, c);
      for (let y = TH; y < WH; y++) for (let x = 0; x < TS; x++) if ((x * 7 + y * 3 + X) % 11 === 0) P.p(x, y, R[4]);
      P.r(0, TH, TS, 1, R[5]).r(0, WH - 1, TS, 1, R[0]);
      P.p(pmod(8 - X, 16), TH + 2, R[1]).p(pmod(24 - X, 16) + 16, TH + 2, R[1]);
    },
    bBlack(P, g, X) {
      const c = "#2c2c2e", R = RP(c);
      P.r(0, TH, TS, BH, c).r(0, TH, TS, 1, R[4]).r(0, WH - 2, TS, 2, R[2]);
      if (g.chance(.6)) P.r(3 + g.i(22), TH + 2, 4, 1, "#4a4a4c");
    },
    bTile(P, g, X) {
      const gr = "#86827a";
      P.r(0, TH, TS, BH, gr);
      for (let x = 0; x < TS; x += 4) {
        const c = hsh(X + x, 1, 4) % 5 ? "#b4ae9e" : "#a49e90", R = RP(c);
        P.r(x, TH + 1, 3, 3, c).r(x, TH + 1, 3, 1, R[5]);
      }
      P.r(0, WH - 1, TS, 1, sh(gr, -.3));
    }
  };
  AS.baseIds = () => Object.keys(BB);
  AS.hasBase = id => !!BB[id];
  function defaultBase(P) {
    P.r(0, TH, TS, BH, C.wallBase).r(0, TH, TS, 1, sh(C.wallBase, .25)).r(0, WH - 1, TS, 1, sh(C.wallBase, -.4));
  }
  function windowOver(P, base) {
    const R = RP(base), G = A.winGeo(WH), y = G.y, h = G.h, bt = y + h - 3;
    P.r(3, y, 26, h, "#2a2c30").r(4, y + 1, 24, h - 2, C.glassDk);
    P.r(4, y + 1, 24, h - 2, C.glass).r(4, y + 1, 24, 2, C.glass2).r(15, y + 1, 2, h - 2, "#2a2c30");
    P.line(6, bt, 12, y + 3, C.glass2).line(8, bt, 13, y + 5, "#b8dce6").line(19, bt, 24, y + 5, C.glass2);
    P.r(3, y + h - 1, 26, 2, R[4]).r(3, y + h, 26, 1, R[1]);
  }
  AS.wallIds = () => Object.keys(WLD);
  AS.hasWall = id => !!WLD[id];
  AS.wallBase = id => WLD[id] ? WLD[id].base : null;
  AS.wallCap = id => WLD[id] ? WLD[id].cap : null;
  const wcache = A.keyMap ? A.keyMap(new Map, "wpap:") : new Map;
  AS.wallFront = function(wid, kind, tx, ty, ends, bid, col, fh) {
    const w = WLD[wid] || null, b = BB[bid] ? bid : "", H = fh || A.WALL_H;
    if (!w && !b) return A.wallFront(kind, tx, ends, col, 0, H);
    const per = w ? w.per : 1, cx = pmod(tx, per * 4), v = w ? vOf(tx, ty, 29) : 0, key = (wid || col || "") + ":" + kind + ":" + cx + ":" + (ends | 0) + ":" + b + ":" + v + ":" + pmod(tx, 3) + (H !== A.WALL_H ? ":h" + H : "");
    let c = wcache.get(key);
    if (!c) {
      setH(H);
      try {
        c = A.mk(TS, WH);
        const P = new A.Pen(c.getContext("2d")), g = new SX.Rng(hsh(cx, v, 41) + SX.hash(String(wid)));
        if (w) {
          w.d(P, g, cx, v);
          const R = RP(w.base);
          P.r(0, 0, TS, 2, R[1]).r(0, 2, TS, 1, R[2]);
          if (BB[b]) BB[b](P, new SX.Rng(hsh(tx, 2, 5)), tx * TS); else defaultBase(P);
          if (ends & 1) P.r(0, 0, 2, WH, R[4]).r(0, 0, 1, WH, R[5]);
          if (ends & 2) P.r(TS - 2, 0, 2, WH, R[1]).r(TS - 1, 0, 1, WH, R[0]);
          if (kind === 1) windowOver(P, w.base);
        } else {
          P.x.drawImage(A.wallFront(kind, tx, ends, col, 0, WH), 0, 0);
          BB[b](P, new SX.Rng(hsh(tx, 2, 5)), tx * TS);
          const R = RP(col || C.wallF);
          if (ends & 1) P.r(0, TH, 2, BH, R[4]).r(0, TH, 1, BH, R[5]);
          if (ends & 2) P.r(TS - 2, TH, 2, BH, R[1]).r(TS - 1, TH, 1, BH, R[0]);
        }
      } finally {
        setH(A.WALL_H);
      }
      wcache.set(key, c);
    }
    return c;
  };
  const tcache = new Map;
  AS.thumbFloor = function(id, n) {
    n = n || 2;
    const k = "tf:" + id + ":" + n;
    let c = tcache.get(k);
    if (c) return c;
    c = A.mk(n * TS, n * TS);
    const x = c.getContext("2d");
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const t = FL[id] ? AS.floor(id, i + 3, j + 5) : A.floorCached(SX.art.FS.LINO, i, j, i * 7 + j * 13);
      x.drawImage(t, i * TS, j * TS);
    }
    tcache.set(k, c);
    return c;
  };
  AS.thumbWall = function(id, bid, n) {
    n = n || 2;
    const k = "tw:" + id + ":" + (bid || "") + ":" + n;
    let c = tcache.get(k);
    if (c) return c;
    const capH = 8;
    c = A.mk(n * TS, WH + capH);
    const x = c.getContext("2d"), cap = AS.wallBase(id) || "#77725f";
    for (let i = 0; i < n; i++) {
      x.drawImage(A.wallCap(0, (i > 0 ? 8 : 0) | (i < n - 1 ? 2 : 0) | 4, cap), 0, TS - capH, TS, capH, i * TS, 0, TS, capH);
      x.drawImage(AS.wallFront(id, 0, i + 2, 1, (i === 0 ? 1 : 0) | (i === n - 1 ? 2 : 0), bid, AS.wallBase(id) || "#77725f"), i * TS, capH);
    }
    tcache.set(k, c);
    return c;
  };
  AS.block = function(id, nx, ny) {
    const c = A.mk(nx * TS, ny * TS), x = c.getContext("2d");
    for (let ty = 0; ty < ny; ty++) for (let tx = 0; tx < nx; tx++) x.drawImage(AS.floor(id, tx, ty), tx * TS, ty * TS);
    return c;
  };
  AS.wallStrip = function(id, bid, n) {
    const c = A.mk(n * TS, WH), x = c.getContext("2d");
    for (let i = 0; i < n; i++) x.drawImage(AS.wallFront(id, 0, i, 0, 0, bid, AS.wallBase(id) || "#77725f"), i * TS, 0);
    return c;
  };
  AS.clear = () => {
    fcache.clear();
    wcache.clear();
    tcache.clear();
  };
})(window.SX);
