"use strict";

(function(SX) {
  const A = SX.art, TS = SX.TS, RP = A.ramp;
  const DP = SX.doorPlace = {
    on: true
  };
  DP.STY = {
    villa: "wood",
    train: "ply",
    office: "steel",
    metro: "stain",
    mall: "glass",
    school: "slide",
    hos: "hosp",
    base: "olive",
    tunnel: "rust",
    site: "site",
    bridge: "site",
    heli: "studio"
  };
  DP.MAT = {
    wood: "wood",
    ply: "wood",
    steel: "steel",
    stain: "steel",
    site: "steel",
    glass: "glass",
    slide: "slide",
    hosp: "plastic",
    olive: "heavy",
    studio: "heavy",
    rust: "rusty"
  };
  DP.NAME = {
    wood: "연립 방문(무늬목)",
    ply: "합판 문",
    steel: "철제 방화문",
    stain: "스테인리스 관계자 문",
    glass: "알루미늄 틀 유리문",
    slide: "교실 미닫이",
    hosp: "병실 문",
    olive: "군부대 철문",
    rust: "녹슨 설비 철문",
    site: "현장 사무실 문",
    studio: "방송국 방음문"
  };
  DP.styleOf = function(F, d) {
    if (!DP.on || !F) return null;
    if (F.kind === "hub") return (d && d.hsty !== undefined ? d.hsty : F.homeDoor) || null;
    if (F._dsty !== undefined) return F._dsty;
    const lv = SX.raid && SX.raid.level;
    if (!lv || !lv.floors || lv.floors.indexOf(F) < 0) return null;
    const b = lv.building || {}, id = b.outdoor === "site" ? "site" : b.outdoor === "tunnel" ? "tunnel" : b.outdoor ? "bridge" : b.id;
    return F._dsty = DP.STY[id] || null;
  };
  DP.mat = (F, d) => {
    const s = DP.styleOf(F, d);
    return s ? DP.MAT[s] : null;
  };
  const DARK = "#2a2c30";
  const hsh = s => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  };
  function grain(P, x0, y0, w, h, R, g, n) {
    for (let k = 0; k < n; k++) {
      const x = x0 + g.i(w), y = y0 + g.i(h), l = 2 + g.i(Math.max(2, h >> 1));
      P.r(x, y, 1, Math.min(l, y0 + h - y), g.chance(.6) ? R[2] : R[4]);
    }
  }
  function specks(P, x0, y0, w, h, cols, n, g) {
    for (let k = 0; k < n; k++) P.p(x0 + g.i(w), y0 + g.i(h), cols[g.i(cols.length)]);
  }
  function scratch(P, x, y, n, c, g) {
    for (let k = 0; k < n; k++) {
      P.p(x, y, c);
      x += g.chance(.5) ? 1 : 0;
      y += 1;
    }
  }
  function screw(P, x, y, c, hi) {
    P.p(x, y, c);
    if (hi) P.p(x, y - 1, hi);
  }
  function panel(P, x, y, w, h, R) {
    P.r(x, y, w, 1, R[2]).r(x, y, 1, h, R[2]).r(x, y + h - 1, w, 1, R[4]).r(x + w - 1, y, 1, h, R[4]);
  }
  function lever(P, x, y, kn, metal) {
    const M = RP(metal);
    P.r(x - 1, y - 1, 3, 4, M[1]).r(x - 1, y - 1, 3, 1, M[3]);
    const lx = kn > 0 ? x - 5 : x + 2;
    P.r(lx, y, 4, 2, M[3]).r(lx, y, 4, 1, M[5]);
    P.p(x, y + 3, M[0]);
  }
  function paper(P, x, y, w, h, g, ink, tape) {
    P.r(x, y, w, h, "#d8d4c6").r(x, y + h - 1, w, 1, "#b8b2a2");
    for (let yy = y + 1; yy < y + h - 1; yy += 2) P.r(x + 1, yy, Math.max(1, w - 2 - g.i(3)), 1, ink || "#5a5a60");
    if (tape) P.r(x + 1, y - 1, w - 2, 1, tape);
  }
  const DIG = {
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
    "-": "000000111000000"
  };
  function num(P, x, y, s, c) {
    for (const ch of String(s)) {
      const m = DIG[ch];
      if (m) for (let k = 0; k < 15; k++) if (m[k] === "1") P.p(x + k % 3, y + (k / 3 | 0), c);
      x += 4;
    }
  }
  let CL = false;
  const LEAF = {
    wood(P, x0, x1, H, kn, g) {
      const R = RP("#7a4a2c"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      grain(P, x0 + 1, 0, w - 2, H - 2, R, g, H > 30 ? 34 : 16);
      panel(P, x0 + 4, yy(.08), w - 8, yy(.34), R);
      if (H > 30) panel(P, x0 + 4, yy(.5), w - 8, yy(.38), R);
      const hx = kn > 0 ? x1 - 5 : x0 + 4, hy = yy(.45);
      if (kn) {
        P.r(hx - 2, hy - 2, 5, 6, R[4]);
        lever(P, hx, hy, kn, "#b8913a");
      }
      if (H > 30) {
        P.r(kn < 0 ? x1 - 4 : x0 + 1, 6, 2, 4, "#8a8a84").r(kn < 0 ? x1 - 4 : x0 + 1, H - 12, 2, 4, "#8a8a84");
        if (!CL) {
          paper(P, x0 + 7 + g.i(4), yy(.12), 7, 6, g, "#4a4a58", "#e2d8a4");
        }
        if (!CL) {
          P.p(x0 + 6, yy(.62), "#d84a5a").p(x0 + 8, yy(.64), "#4a8ad8").p(x0 + 7, yy(.67), "#e0c040").r(x0 + 10, yy(.6), 2, 2, "#5fbf6a");
        }
        if (!CL) {
          scratch(P, x0 + 12, yy(.72), 4, R[1], g);
          scratch(P, x0 + 16, yy(.78), 3, R[2], g);
        }
        if (!CL) {
          P.r(x0 + 2, H - 4, w - 4, 2, R[1]);
          specks(P, x0 + 1, H - 7, w - 2, 4, [ R[1], R[2] ], 9, g);
        }
        P.r(kn < 0 ? x1 - 3 : x0 + 2, H - 3, 2, 1, "#5a5c60");
      }
    },
    ply(P, x0, x1, H, kn, g) {
      const R = RP("#b08a58"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      for (let k = 0; k < (H > 30 ? 6 : 3); k++) P.oval(x0 + 3 + g.i(w - 6), 3 + g.i(H - 8), 2 + g.i(2), 1, R[2]);
      grain(P, x0 + 1, 0, w - 2, H - 2, R, g, H > 30 ? 20 : 10);
      for (let y = 2; y < H - 3; y += H > 30 ? 8 : 6) {
        screw(P, x0 + 1, y, R[0], R[5]);
        screw(P, x1 - 2, y, R[0], R[5]);
      }
      if (kn) {
        const hx = kn > 0 ? x1 - 5 : x0 + 3, hy = yy(.36);
        P.r(hx, hy, 2, yy(.2), "#2a2a2c").r(hx, hy, 2, 1, "#4a4a4e");
        P.p(hx - (kn > 0 ? 1 : -2), hy + 1, "#2a2a2c").p(hx - (kn > 0 ? 1 : -2), hy + yy(.2) - 2, "#2a2a2c");
      }
      if (H > 30 && !CL) {
        const c = "#a83228";
        num(P, x0 + 6, 6, "3", c);
        P.line(x0 + 6, yy(.3), x0 + 15, yy(.3), c).line(x0 + 13, yy(.3) - 2, x0 + 15, yy(.3), c).line(x0 + 13, yy(.3) + 2, x0 + 15, yy(.3), c);
        P.p(x0 + 16, yy(.3) + 2, c).p(x0 + 7, 12, c);
        P.thick(x0 + 3, yy(.66), x0 + 9, yy(.76), 2, "#8e908c").thick(x0 + 3, yy(.76), x0 + 9, yy(.66), 2, "#a2a49e");
        P.oval(x0 + 14, H - 7, 3, 2, R[1]).p(x0 + 14, H - 9, R[1]);
        P.r(x0 + 4, yy(.52), 7, 1, "#5a5a60");
      }
    },
    steel(P, x0, x1, H, kn, g) {
      const R = RP("#8d9296"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      for (const f of H > 30 ? [ .3, .68 ] : [ .5 ]) {
        const y = yy(f);
        P.r(x0 + 2, y, w - 4, 1, R[4]).r(x0 + 2, y + 1, w - 4, 1, R[2]);
      }
      if (kn) lever(P, kn > 0 ? x1 - 5 : x0 + 4, yy(.47), kn, "#c4c8cc");
      if (H > 30) {
        const cx = kn < 0 ? x1 - 11 : x0 + 1;
        P.r(cx, 1, 10, 3, "#5a5e62").r(cx, 1, 10, 1, "#7a7e82");
        P.line(cx + (kn < 0 ? 0 : 9), 2, cx + (kn < 0 ? -1 : 10), 1, "#3a3d40");
        P.r(x0 + 7, 6, 12, 5, "#dcdcd4").r(x0 + 7, 6, 2, 5, "#2f5ea8").r(x0 + 10, 7, 7, 1, "#3a3d40").r(x0 + 10, 9, 5, 1, "#6a6e72");
        if (!CL) {
          P.r(x0 + 8, yy(.56), 9, 3, "#b8322e").r(x0 + 9, yy(.56) + 1, 7, 1, "#e8d8d0");
        }
        if (!CL) {
          P.r(kn > 0 ? x1 - 9 : x0 + 6, yy(.36), 4, 4, "#e2cc5a").r(kn > 0 ? x1 - 9 : x0 + 6, yy(.36) + 3, 4, 1, "#c4ae40");
        }
        if (!CL) {
          specks(P, x0 + 2, 12, w - 4, H - 20, [ R[2], R[5], "#7a5236" ], 10, g);
        }
        if (!CL) {
          for (let k = 0; k < 6; k++) P.r(x0 + 2 + g.i(w - 6), H - 3 - g.i(5), 2 + g.i(3), 1, R[1]);
        }
        screw(P, x0 + 1, 8, R[1]);
        screw(P, x0 + 1, H - 10, R[1]);
        screw(P, x1 - 2, 8, R[1]);
        screw(P, x1 - 2, H - 10, R[1]);
      }
    },
    stain(P, x0, x1, H, kn, g) {
      const R = RP("#a4abb0"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      for (let x = x0 + 2; x < x1 - 1; x++) if (g.chance(.4)) P.r(x, g.i(4), 1, H - 4 - g.i(8), g.chance(.5) ? R[4] : R[2]);
      if (H > 30) {
        if (!CL) {
          P.r(x0 + 4, 4, w - 8, 8, "#e0b830").r(x0 + 4, 4, w - 8, 2, "#c0302c").r(x0 + 6, 7, w - 13, 1, "#1e1e22").r(x0 + 6, 9, w - 16, 1, "#1e1e22");
        }
        if (!CL) {
          P.r(x0 + 4, 11, w - 8, 1, "#a88a20");
        }
        const kx = kn > 0 ? x1 - 7 : x0 + 3;
        P.r(kx, yy(.3), 4, 6, "#1e2024").r(kx + 1, yy(.3) + 1, 2, 1, "#5fd06a").p(kx + 1, yy(.3) + 3, "#6a6e72").p(kx + 2, yy(.3) + 4, "#6a6e72");
        P.r(x0 + 2, H - 12, w - 4, 8, R[4]).r(x0 + 2, H - 12, w - 4, 1, R[5]).r(x0 + 2, H - 5, w - 4, 1, R[1]);
        if (!CL) {
          for (let k = 0; k < 7; k++) P.p(x0 + 3 + g.i(w - 6), H - 11 + g.i(6), R[2]);
        }
        screw(P, x0 + 3, H - 11, R[1]);
        screw(P, x1 - 4, H - 11, R[1]);
        if (!CL) {
          P.r(x0 + 9, yy(.62), 3, 2, "#d8d6cc").p(x0 + 13, yy(.6), "#d8d6cc");
        }
      }
      if (kn) {
        const hx = kn > 0 ? x1 - 5 : x0 + 3, hy = yy(H > 30 ? .42 : .3);
        P.r(hx, hy, 2, yy(.2), "#d4d8dc").r(hx + 1, hy, 1, yy(.2), "#8a9094");
        if (!CL) specks(P, hx - 3, hy, 5, yy(.2), [ R[2] ], 4, g);
      }
    },
    glass(P, x0, x1, H, kn, g) {
      const M = RP("#9ea4aa"), w = x1 - x0, yy = f => Math.round(f * H), gx0 = x0 + 3, gx1 = x1 - 3, gy0 = 3, gy1 = H - (H > 30 ? 9 : 5);
      P.r(x0, 0, w, H - 1, M[3]).r(x0, 0, 1, H - 1, M[4]).r(x1 - 1, 0, 1, H - 1, M[1]);
      P.r(gx0, gy0, gx1 - gx0, gy1 - gy0, "#30434c").r(gx0, gy0, gx1 - gx0, 1, M[1]).r(gx0, gy0, 1, gy1 - gy0, M[1]);
      P.line(gx0 + 2, gy0 + 9, gx0 + 9, gy0 + 2, "#5c7886").line(gx0 + 3, gy0 + 12, gx0 + 12, gy0 + 3, "#46606c").line(gx1 - 7, gy1 - 3, gx1 - 2, gy1 - 8, "#5c7886");
      P.r(x0 + 1, gy1, w - 2, 1, M[4]).r(x0 + 1, H - 3, w - 2, 1, M[1]);
      if (kn !== 0 || H > 30) {
        const by = yy(.47);
        P.r(gx0 - 1, by, gx1 - gx0 + 2, 2, "#d0d4d8").r(gx0 - 1, by + 1, gx1 - gx0 + 2, 1, "#8a9096").r(gx0, by - 1, 1, 4, M[1]).r(gx1 - 1, by - 1, 1, 4, M[1]);
      }
      if (H > 30) {
        if (!CL) {
          P.r(gx0 + 2, 5, 9, 7, "#d8d4c6");
          for (let y = 6; y < 11; y += 2) P.r(gx0 + 3, y, 5 + g.i(3), 1, "#4a4a52");
        }
        if (!CL) {
          P.r(gx0 + 2, 13, 3, 2, "#2f5ea8").r(gx0 + 6, 13, 3, 2, "#d8a030").r(gx0 + 10, 13, 3, 2, "#c03028");
        }
        if (!CL) {
          P.r(gx0 + 6, yy(.4), 6, 3, "#e8e4d8").r(gx0 + 7, yy(.4) + 1, 4, 1, "#c03028");
        }
        if (!CL) {
          P.r(gx1 - 10, yy(.58), 9, 9, "#dcd8ca").r(gx1 - 9, yy(.58) + 2, 7, 2, "#b8302c").r(gx1 - 9, yy(.58) + 5, 5, 1, "#5a5a62").r(gx1 - 10, yy(.58) - 1, 3, 1, "#e2d8a4").r(gx1 - 4, yy(.58) - 1, 3, 1, "#e2d8a4");
        }
        if (!CL) {
          const cx = gx0 + 5, cy = yy(.72);
          P.p(cx, cy, "#c8dce4").line(cx, cy, cx - 3, cy - 4, "#9cb4c0").line(cx, cy, cx + 4, cy - 2, "#9cb4c0").line(cx, cy, cx + 2, cy + 4, "#9cb4c0").line(cx, cy, cx - 4, cy + 1, "#7e98a4");
        }
        if (!CL) {
          specks(P, gx0, gy1 - 6, gx1 - gx0, 6, [ "#4a5e68", "#56685e" ], 10, g);
        }
        screw(P, x0 + 1, H - 6, M[1]);
        screw(P, x1 - 2, H - 6, M[1]);
      }
    },
    slide(P, x0, x1, H, kn, g) {
      const R = RP("#a07a48"), w = x1 - x0, yy = f => Math.round(f * H), gy0 = 3, gy1 = yy(.44);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      grain(P, x0 + 1, gy1, w - 2, H - gy1 - 2, R, g, H > 30 ? 14 : 6);
      const mx = x0 + x1 >> 1;
      P.r(x0 + 3, gy0, w - 6, gy1 - gy0, "#34444c").r(mx, gy0, 2, gy1 - gy0, R[2]).r(x0 + 3, gy0, w - 6, 1, R[1]).r(x0 + 3, gy1, w - 6, 1, R[4]);
      P.line(x0 + 4, gy0 + 6, x0 + 9, gy0 + 1, "#5a7280").line(mx + 3, gy1 - 2, mx + 8, gy0 + 3, "#4a6270");
      if (H > 30) panel(P, x0 + 3, yy(.54), w - 6, yy(.33), R);
      if (kn) {
        const hx = kn > 0 ? x1 - 5 : x0 + 3, hy = yy(H > 30 ? .5 : .56);
        P.r(hx - 1, hy - 1, 4, 7, "#8a8c88").r(hx, hy, 2, 5, "#2e2418");
      }
      if (H > 30) {
        if (!CL) {
          P.r(x0 + 5, gy0 + 2, 8, 7, "#dcd8ca");
          num(P, x0 + 6, gy0 + 3, "2-3", "#2a2a34");
        }
        if (!CL) {
          P.r(mx + 4, gy0 + 3, 3, 3, "#e8c040").p(mx + 5, gy0 + 4, "#c06020");
        }
        if (!CL) {
          P.r(x0 + 5, yy(.5), 9, 2, "#e8e4d8").r(x0 + 6, yy(.5), 6, 1, "#4a4a5a");
        }
        if (!CL) {
          P.line(x0 + 6, yy(.7), x0 + 10, yy(.66), "#4a4a5a").line(x0 + 10, yy(.66), x0 + 13, yy(.72), "#4a4a5a").p(x0 + 15, yy(.69), "#c03028").p(x0 + 16, yy(.7), "#c03028");
        }
        if (!CL) {
          scratch(P, x1 - 8, yy(.76), 4, R[1], g);
        }
        P.r(x0, H - 3, w, 2, "#8a8c88").r(x0, H - 3, w, 1, "#b0b2ae");
      }
    },
    hosp(P, x0, x1, H, kn, g) {
      const R = RP("#c8d2ca"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      const wx = kn >= 0 ? x0 + 5 : x1 - 11, wy = H > 30 ? 6 : 3, wh = H > 30 ? 14 : 7;
      P.r(wx - 1, wy - 1, 8, wh + 2, "#7c8682").r(wx, wy, 6, wh, "#3c4c50");
      for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + 6; x++) if ((x + y) % 3 === 0) P.p(x, y, "#5c7076");
      P.line(wx + 1, wy + 3, wx + 3, wy + 1, "#7c9498");
      if (kn) lever(P, kn > 0 ? x1 - 5 : x0 + 4, yy(.47), kn, "#c4c8cc");
      if (H > 30) {
        P.r(x0 + 12, 2, 12, 4, "#e6e8e2").r(x0 + 12, 2, 12, 1, "#2f5ea8");
        P.r(x0 + 14, 4, 7, 1, "#3a3d48");
        P.r(x0 + 2, H - 11, w - 4, 8, "#b0b8bc").r(x0 + 2, H - 11, w - 4, 1, "#d0d6da").r(x0 + 2, H - 4, w - 4, 1, "#7a8286");
        screw(P, x0 + 3, H - 10, "#6a7276");
        screw(P, x1 - 4, H - 10, "#6a7276");
        if (!CL) {
          P.r(x0 + 2, H - 15, 6, 1, R[1]).r(x1 - 10, H - 14, 7, 1, R[2]);
        }
        const bx = kn > 0 ? x1 - 11 : x0 + 6, by = yy(.55);
        if (!CL) P.r(bx, by, 3, 3, "#7a1e1c").p(bx - 1, by - 1, "#7a1e1c").p(bx, by - 2, "#7a1e1c").p(bx + 1, by - 2, "#7a1e1c").p(bx + 2, by - 1, "#7a1e1c").p(bx + 3, by + 1, "#7a1e1c");
        if (!CL) {
          P.r(bx + 1, by + 3, 1, 5, "#6a1a18").p(bx, by + 6, "#6a1a18");
        }
        if (!CL) {
          P.r(kn > 0 ? x0 + 4 : x1 - 9, yy(.66), 5, 5, "#e0b830").p((kn > 0 ? x0 + 4 : x1 - 9) + 2, yy(.66) + 2, "#1e1e22").p((kn > 0 ? x0 + 4 : x1 - 9) + 1, yy(.66) + 3, "#1e1e22").p((kn > 0 ? x0 + 4 : x1 - 9) + 3, yy(.66) + 3, "#1e1e22");
        }
        if (!CL) {
          specks(P, x0 + 2, 10, w - 4, H - 24, [ R[2], R[4] ], 8, g);
        }
      }
    },
    olive(P, x0, x1, H, kn, g) {
      const R = RP("#5c6440"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      for (const f of H > 30 ? [ .3, .66 ] : [ .5 ]) {
        const y = yy(f);
        P.r(x0 + 1, y - 1, w - 2, 3, R[3]).r(x0 + 1, y - 1, w - 2, 1, R[4]).r(x0 + 1, y + 1, w - 2, 1, R[1]);
        for (let x = x0 + 3; x < x1 - 2; x += 5) P.p(x, y, R[5]);
      }
      for (let y = 3; y < H - 3; y += H > 30 ? 5 : 4) {
        P.p(x0 + 2, y, R[5]).p(x0 + 2, y + 1, R[1]);
        P.p(x1 - 3, y, R[5]).p(x1 - 3, y + 1, R[1]);
      }
      if (kn) {
        const bx = kn > 0 ? x1 - 13 : x0 + 3, by = yy(.47);
        P.r(bx, by, 10, 2, "#3a3e30").r(bx, by, 10, 1, "#7a806a").r(kn > 0 ? bx + 8 : bx, by - 2, 2, 6, "#2e3226").r(kn > 0 ? bx + 3 : bx + 6, by - 1, 1, 4, "#9a9c8a");
      }
      if (H > 30 && !CL) {
        num(P, x0 + 7, 5, "07", "#cfc89a");
        P.p(x0 + 9, 7, R[3]).p(x0 + 13, 9, R[3]);
        P.r(x0 + 6, yy(.38), 13, 5, "#a82a24").r(x0 + 7, yy(.38) + 2, 11, 1, "#e8d8cc");
        for (let k = 0; k < 5; k++) {
          const x = x0 + 4 + g.i(w - 8), y = 6 + g.i(H - 16);
          P.r(x, y, 2 + g.i(3), 2, "#7c7e78").p(x, y, "#7a4a2a");
        }
        for (let k = 0; k < 4; k++) {
          const x = x0 + 2 + g.i(w - 4), y = 4 + g.i(H - 20);
          P.r(x, y, 1, 4 + g.i(6), "#6a4a2c");
        }
        specks(P, x0 + 1, H - 8, w - 2, 6, [ "#4a3a28", "#5a4a32", R[1] ], 16, g);
      }
    },
    rust(P, x0, x1, H, kn, g) {
      const R = RP("#4e5652"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      if (!CL) {
        for (let k = 0; k < (H > 30 ? 9 : 4); k++) P.oval(x0 + 3 + g.i(w - 6), 3 + g.i(H - 8), 1 + g.i(3), 1 + g.i(2), g.chance(.5) ? "#7a4226" : "#8c5430");
      }
      if (!CL) {
        for (let k = 0; k < (H > 30 ? 7 : 3); k++) {
          const x = x0 + 2 + g.i(w - 4), y = g.i(H >> 1);
          P.r(x, y, 1, 5 + g.i(H >> 2), "#6a3a20");
        }
      }
      const vy = H > 30 ? H - 14 : H - 8, vh = H > 30 ? 9 : 5;
      P.r(x0 + 4, vy, w - 8, vh, R[1]);
      for (let y = vy + 1; y < vy + vh; y += 2) P.r(x0 + 5, y, w - 10, 1, R[4]);
      if (kn) {
        const hx = kn > 0 ? x1 - 5 : x0 + 3, hy = yy(.42);
        P.r(hx, hy, 2, 7, "#2a2c2a").r(hx + (kn > 0 ? -1 : 2), hy, 1, 1, "#2a2c2a").r(hx + (kn > 0 ? -1 : 2), hy + 6, 1, 1, "#2a2c2a").p(hx, hy, "#6a6e6a");
        P.r(hx - (kn > 0 ? 3 : -3), hy + 9, 3, 2, "#8a8c88").r(hx - (kn > 0 ? 3 : -3), hy + 11, 3, 3, "#b08a2a").p(hx - (kn > 0 ? 2 : -4), hy + 12, "#3a2a10");
      }
      if (H > 30 && !CL) {
        const tx = x0 + 6, ty = 4;
        for (let k = 0; k < 7; k++) P.r(tx + 6 - k, ty + k, k * 2 + 1, 1, "#d8b030");
        P.r(tx + 6, ty + 2, 1, 3, "#1e1e22").p(tx + 6, ty + 6, "#1e1e22");
        P.r(x0 + 4, 13, 14, 4, "#d6d2c4").r(x0 + 5, 14, 9, 1, "#b8302c").r(x0 + 5, 16, 6, 1, "#4a4a52");
        P.r(x0 + 1, H - 18, w - 2, 1, R[2]).r(x0 + 1, H - 16, w - 2, 1, "#46504c");
        specks(P, x0 + 1, H - 5, w - 2, 3, [ "#2e3430", "#3a2a1c" ], 12, g);
      }
    },
    site(P, x0, x1, H, kn, g) {
      const R = RP("#c6cac2"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, R[3]).r(x0, 0, 1, H - 1, R[4]).r(x1 - 1, 0, 1, H - 1, R[1]);
      panel(P, x0 + 2, 2, w - 4, H - 5, R);
      const wx = kn >= 0 ? x0 + 5 : x1 - 14, wy = H > 30 ? 5 : 3, wh = H > 30 ? 9 : 5;
      P.r(wx - 1, wy - 1, 11, wh + 2, R[1]).r(wx, wy, 9, wh, "#37464c");
      for (let x = wx + 2; x < wx + 9; x += 3) P.r(x, wy, 1, wh, "#56666c");
      for (let y = wy + 2; y < wy + wh; y += 3) P.r(wx, y, 9, 1, "#56666c");
      if (kn) lever(P, kn > 0 ? x1 - 5 : x0 + 4, yy(.47), kn, "#b8bcc0");
      if (H > 30) {
        if (!CL) {
          P.r(x0 + 5, yy(.33), 15, 4, "#2f5ea8").r(x0 + 6, yy(.33) + 1, 11, 1, "#e6ecf4").r(x0 + 6, yy(.33) + 3, 7, 1, "#8aa6d0");
        }
        if (!CL) {
          const sx = kn > 0 ? x0 + 5 : x1 - 10;
          P.r(sx, yy(.56), 6, 6, "#2f8a4a").r(sx + 2, yy(.56) + 1, 2, 4, "#e8f0e4").r(sx + 1, yy(.56) + 2, 4, 2, "#e8f0e4");
        }
        if (kn) {
          const hx = kn > 0 ? x1 - 7 : x0 + 3;
          P.r(hx, yy(.56), 4, 2, "#8a8c88").r(hx + 1, yy(.56) + 2, 3, 3, "#c4a030").p(hx + 2, yy(.56) + 3, "#4a3a10");
        }
        if (!CL) {
          P.r(x0 + 12, yy(.72), 4, 1, R[2]).r(x0 + 11, yy(.73), 1, 2, R[2]).r(x0 + 12, yy(.75), 4, 1, R[4]);
        }
        if (!CL) {
          for (let k = 0; k < 22; k++) {
            const y = H - 2 - Math.floor(Math.pow(g.f(), 2) * 12);
            P.p(x0 + 1 + g.i(w - 2), y, g.chance(.5) ? "#6a5236" : "#806446");
          }
        }
        if (!CL) {
          P.r(x0 + 1, H - 4, 2, 2, "#8a5a32").r(x1 - 3, H - 4, 2, 2, "#8a5a32");
        }
      }
    },
    studio(P, x0, x1, H, kn, g) {
      const R = RP("#3c3e46"), M = RP("#6a6e72"), w = x1 - x0, yy = f => Math.round(f * H);
      P.r(x0, 0, w, H - 1, M[3]).r(x0, 0, 1, H - 1, M[4]).r(x1 - 1, 0, 1, H - 1, M[1]);
      const px0 = x0 + 2, px1 = x1 - 2, py0 = H > 30 ? 7 : 2, py1 = H - 3;
      P.r(px0, py0, px1 - px0, py1 - py0, R[3]);
      for (let y = py0; y < py1; y++) for (let x = px0; x < px1; x++) {
        const a = (x - px0 + y - py0) % 6, b = (x - px0 - (y - py0) + 600) % 6;
        if (a === 0 || b === 0) P.p(x, y, R[2]);
        if (a === 0 && b === 0) {
          P.p(x, y, R[0]);
          P.p(x, y - 1, R[4]);
        }
      }
      if (kn) {
        const hx = kn > 0 ? x1 - 6 : x0 + 4, hy = yy(H > 30 ? .36 : .25);
        P.r(hx, hy, 2, yy(.3), "#c0c4c8").r(hx + 1, hy, 1, yy(.3), "#80868a").r(hx - (kn > 0 ? 1 : -1), hy, 1, 2, "#5a5e62").r(hx - (kn > 0 ? 1 : -1), hy + yy(.3) - 2, 1, 2, "#5a5e62");
      }
      if (H > 30) {
        P.r(x0 + 8, 1, 11, 5, "#2a1614").r(x0 + 9, 2, 9, 3, "#7a2a24").r(x0 + 10, 3, 7, 1, "#c8564a");
        const cx = kn > 0 ? x0 + 3 : x1 - 7;
        P.r(cx, 1, 4, 5, "#18191c").p(cx + 1, 2, "#e0514a").r(cx + 1, 4, 2, 1, "#3a3c42");
        if (!CL) {
          P.r(x0 + 5, yy(.52), 9, 6, "#dcd8ca").r(x0 + 6, yy(.52) + 1, 6, 1, "#b8302c").r(x0 + 6, yy(.52) + 3, 7, 1, "#5a5a62").r(x0 + 7, yy(.52) - 1, 4, 1, "#e2d8a4");
        }
        if (!CL) {
          P.r(x0 + 10, yy(.74), 4, 3, "#c8b060").p(x0 + 9, yy(.74), R[1]).p(x0 + 14, yy(.74) + 2, R[1]).p(x0 + 11, yy(.74) + 1, "#a89040");
        }
        screw(P, x0 + 1, 3, M[1]);
        screw(P, x1 - 2, 3, M[1]);
        screw(P, x0 + 1, H - 4, M[1]);
        screw(P, x1 - 2, H - 4, M[1]);
      }
    }
  };
  const LOOK = {
    wood: {
      face: "#7a4a2c",
      sill: "#5a3a22",
      knob: "#b8913a"
    },
    ply: {
      face: "#b08a58",
      sill: "#7a5e3a",
      knob: "#2a2a2c"
    },
    steel: {
      face: "#8d9296",
      sill: "#6a6e72",
      knob: "#c4c8cc"
    },
    stain: {
      face: "#a4abb0",
      sill: "#8a9094",
      knob: "#d4d8dc"
    },
    glass: {
      face: "#9ea4aa",
      sill: "#7a8086",
      knob: "#d0d4d8",
      glass: "#30434c"
    },
    slide: {
      face: "#a07a48",
      sill: "#8a8c88",
      knob: "#8a8c88",
      glass: "#34444c"
    },
    hosp: {
      face: "#c8d2ca",
      sill: "#3a3c3e",
      knob: "#c4c8cc"
    },
    olive: {
      face: "#5c6440",
      sill: "#4a4e44",
      knob: "#3a3e30"
    },
    rust: {
      face: "#4e5652",
      sill: "#5a4a3a",
      knob: "#2a2c2a"
    },
    site: {
      face: "#c6cac2",
      sill: "#6a6e72",
      knob: "#b8bcc0"
    },
    studio: {
      face: "#3c3e46",
      sill: "#2a2c30",
      knob: "#c0c4c8"
    }
  };
  const CLEAN_NAME = {
    wood: "깔끔한 무늬목 방문",
    ply: "깔끔한 합판 문",
    steel: "깔끔한 철제 방화문",
    stain: "깔끔한 스테인리스 문",
    glass: "깔끔한 유리문",
    slide: "깔끔한 교실 미닫이",
    hosp: "깔끔한 병실 문",
    olive: "깔끔한 국방색 철문",
    rust: "깔끔한 설비 철문",
    site: "깔끔한 현장 사무실 문",
    studio: "깔끔한 방음문"
  };
  DP.base = sty => typeof sty === "string" && sty.length > 1 && sty[sty.length - 1] === "C" && LEAF[sty.slice(0, -1)] ? sty.slice(0, -1) : sty;
  for (const k of Object.keys(CLEAN_NAME)) {
    const f = LEAF[k];
    LEAF[k + "C"] = function() {
      CL = true;
      try {
        return f.apply(this, arguments);
      } finally {
        CL = false;
      }
    };
    LOOK[k + "C"] = LOOK[k];
    DP.MAT[k + "C"] = DP.MAT[k];
    DP.NAME[k + "C"] = CLEAN_NAME[k];
  }
  DP.LEAF = LEAF;
  DP.LOOK = LOOK;
  function lockOver(P, H) {
    const C = A.C || {};
    const ch = C.chain || "#a0a3a8", lr = C.lockRed || "#b8322e";
    const s = H / 47;
    P.thick(3, Math.round(8 * s), 28, Math.round(36 * s), 2, ch).thick(3, Math.round(36 * s), 28, Math.round(8 * s), 2, ch);
    const y = Math.round(16 * s);
    P.r(12, y, 8, 9, DARK).r(13, y + 1, 6, 7, lr).r(13, y + 1, 6, 1, "#e06060").r(15, y + 3, 2, 3, DARK);
  }
  DP.tall = function(kind, ends, sty) {
    const H = A.DOOR_H;
    ends = ends | 0;
    return A.cached("dpT" + sty + kind + ":" + ends, TS, H, P => {
      const jl = ends & 32, jr = ends & 16, x0 = jl ? 1 : 3, x1 = jr ? TS - 1 : TS - 3, kn = ends & 8 ? 0 : ends & 4 ? -1 : 1;
      P.r(0, 0, TS, H, DARK);
      LEAF[sty](P, x0, x1, H, kn, new SX.Rng(hsh(sty) ^ ends * 977 ^ kind));
      P.r(0, H - 1, TS, 1, "#1c1d21");
      if (kind === 5) lockOver(P, H);
    });
  };
  DP.front = function(kind, sty, h) {
    const H = h || A.WALL_H;
    return A.cached("dpF" + sty + kind + (H !== A.WALL_H ? ":h" + H : ""), TS, H, P => {
      P.r(2, 0, TS - 4, H, DARK);
      LEAF[sty](P, 4, TS - 4, H + 1, 1, new SX.Rng(hsh(sty) ^ 31 ^ kind));
      if (kind === 5) lockOver(P, H);
    });
  };
  function aptLeaf(P, x0, x1, H, g, dc, old, lux) {
    const w = x1 - x0, yy = f => Math.round(f * H), R = RP(dc);
    P.r(x0, 0, w, H - 1, dc).r(x0, 0, w, 1, A.shade(dc, .22)).r(x0, 0, 1, H - 1, A.shade(dc, .12)).r(x1 - 1, 0, 1, H - 1, A.shade(dc, -.3)).r(x0, H - 2, w, 1, A.shade(dc, -.35));
    if (lux) {
      for (let x = x0 + 3; x < x1 - 3; x += 4) P.r(x, 2, 1, H - 5, A.shade(dc, -.12));
      P.r(x1 - 6, yy(.22), 2, yy(.5), "#c8ccd0").r(x1 - 5, yy(.22), 1, yy(.5), "#8a9094");
      P.r(x1 - 11, yy(.36), 4, 7, "#141518").r(x1 - 10, yy(.36) + 1, 2, 2, "#3a6ad0").p(x1 - 10, yy(.36) + 5, "#5fbf6a");
    } else {
      for (const f of [ .08, .5 ]) P.r(x0 + 3, yy(f), w - 6, yy(.36), A.shade(dc, -.07)).r(x0 + 3, yy(f), w - 6, 1, A.shade(dc, -.22)).r(x0 + 3, yy(f) + yy(.36) - 1, w - 6, 1, A.shade(dc, .12));
      if (!old) for (let k = 0; k < 14; k++) {
        const x = x0 + 2 + g.i(w - 4), y = 2 + g.i(H - 6);
        P.r(x, y, 1, 2 + g.i(4), A.shade(dc, g.chance(.5) ? -.12 : .08));
      }
      P.r(x1 - 7, yy(.3), 4, 7, "#1e2024").r(x1 - 6, yy(.3) + 1, 2, 1, "#5fbf6a").r(x1 - 6, yy(.3) + 3, 2, 2, "#3a3c40");
      P.r(x1 - 9, yy(.48), 6, 2, "#c8c4b8").r(x1 - 4, yy(.46), 2, 4, "#8a867c");
      if (old) {
        specks(P, x0 + 1, 2, w - 2, H - 4, [ "#7a4a2a", "#8c5a34", A.shade(dc, -.25), A.shade(dc, .15) ], 26, g);
        P.r(x0 + 1, H - 7, w - 2, 4, A.shade(dc, -.3));
        specks(P, x0 + 1, H - 8, w - 2, 5, [ "#6a3a20", "#8c5a34" ], 10, g);
        P.r(x0 + 4, yy(.56), 8, 2, "#8a8a84").r(x0 + 4, yy(.56), 8, 1, "#a8a8a0");
      }
    }
    P.p(x0 + (w >> 1), yy(.17), "#0e0f11").p(x0 + (w >> 1), yy(.17) - 1, A.shade(dc, -.4));
    const r = g.i(4);
    if (r === 1) P.r(x0 + 4, yy(.12), 6, 8, "#ece6d4").r(x0 + 5, yy(.12) + 2, 4, 1, "#c03a2a").r(x0 + 5, yy(.12) + 4, 3, 1, "#6a6458").r(x0 + 5, yy(.12) + 6, 4, 1, "#6a6458");
    if (r === 2) P.r(x0 + 3, 3, 4, 3, "#d84a3a").r(x0 + 8, 3, 3, 3, "#e8c040");
    if (r === 3) paper(P, x0 + 4, yy(.62), 7, 6, g, "#4a4a58", "#e2d8a4");
  }
  const SINGLE = {
    apt: (P, a, b, H, g) => aptLeaf(P, a, b, H, g, "#5c4636"),
    old: (P, a, b, H, g) => aptLeaf(P, a, b, H, g, "#55625c", true),
    lux: (P, a, b, H, g) => aptLeaf(P, a, b, H, g, "#3a3d42", false, true)
  };
  const singleW = sty => {
    const b = DP.base(sty);
    return b === "shut" ? 40 : b === "lux" || b === "olive" || b === "rust" ? 28 : 24;
  };
  DP.singleSpan = sty => [ 9 / TS, (12 + singleW(sty) + 3) / TS ];
  DP.single = function(sty, kind) {
    const H = A.DOOR_H, W = TS * 2;
    return A.cached("dpS" + sty + kind, W, H, P => {
      const g = new SX.Rng(hsh("single" + sty) ^ kind), lw = singleW(sty), x0 = 12, x1 = x0 + lw;
      P.r(x0 - 3, 0, lw + 6, H, DARK).r(x0 - 2, 0, lw + 4, 1, "#4a4c50");
      if (SINGLE[sty]) SINGLE[sty](P, x0, x1, H, g); else (LEAF[sty] || LEAF.wood)(P, x0, x1, H, 1, g);
      P.r(x0 - 3, H - 1, lw + 6, 1, "#1c1d21");
      if (kind === 5) {
        const C = A.C || {};
        P.thick(x0, 8, x1, 36, 2, C.chain || "#a0a3a8").thick(x0, 36, x1, 8, 2, C.chain || "#a0a3a8");
      }
      if (sty === "shut") return;
      const ix = x1 + 7;
      if (DP.base(sty) === "olive" || DP.base(sty) === "stain") {
        P.r(ix, 10, 9, 6, "#e0d8b8").r(ix + 1, 11, 7, 1, "#2a2c30").r(ix + 1, 13, 5, 1, "#6a6458");
      } else if (sty === "rust") {
        P.r(ix, 14, 6, 8, "#d8d4c6").r(ix + 1, 15, 4, 1, "#c03a2a").r(ix + 1, 17, 3, 1, "#5a5a60").r(ix + 1, 19, 4, 1, "#5a5a60").r(ix + 1, 13, 4, 1, "#e2d8a4");
      } else {
        P.r(ix, 4, 9, 4, "#d8d4c8").r(ix + 1, 5, 7, 1, "#3a3c40").r(ix + 1, 6, 4, 1, "#6a6c70");
        if (sty === "wood") P.r(ix + 2, 18, 4, 5, "#c8c4b8").p(ix + 3, 20, "#3a3c40"); else {
          P.r(ix, 16, 8, 12, "#c8c4b8").r(ix, 16, 8, 1, "#e0dcd0").r(ix + 1, 18, 6, 5, "#26282c").r(ix + 2, 19, 4, 3, sty === "lux" ? "#4a7ab0" : "#3a4a3c").r(ix + 3, 24, 2, 2, "#8a867c").r(ix, 27, 8, 1, "#8a8680");
        }
      }
    });
  };
  const LINE2 = "#3a9a4a";
  const mixC = (a, b, t) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = k => Math.round((pa >> k & 255) * (1 - t) + (pb >> k & 255) * t);
    return "rgb(" + ch(16) + "," + ch(8) + "," + ch(0) + ")";
  };
  SINGLE.shut = function(P, x0, x1, H, g) {
    const w = x1 - x0, L = A.PP, sb = 27, by = sb + 3;
    P.r(x0 - 3, 0, w + 6, 11, "#1a1a1e").r(x0 - 2, 1, w + 4, 9, "#e2b62a").r(x0 - 2, 1, w + 4, 1, "#f4d460").r(x0 - 2, 9, w + 4, 1, "#a8841a");
    P.r(x0 - 2, 2, 5, 7, "#1a1a1e");
    L.mini(P, x0 - 1, 3, "4", "#f4d460");
    L.label(P, x0 + 4, 2, "나가는 곳", "#1a1a1e", 7, w - 2);
    P.r(x0 - 3, 11, 3, H - 12, "#45474a").r(x0 - 3, 11, 1, H - 12, "#6a6c70").r(x1, 11, 3, H - 12, "#45474a").r(x1 + 2, 11, 1, H - 12, "#2a2c2e");
    P.r(x0, 11, w, 4, "#5c6062").r(x0, 11, w, 1, "#868a8c").r(x0, 14, w, 1, "#2e3032");
    for (let y = 15; y < sb; y++) {
      const k = (y - 15) % 3;
      P.r(x0, y, w, 1, k === 0 ? "#a2a49e" : k === 1 ? "#80827c" : "#5c5e58");
    }
    for (let k = 0; k < 34; k++) P.p(x0 + g.i(w), 15 + g.i(sb - 15), g.pick([ "#7a4a2a", "#8c5a34", "#6a3a20", "#9a6a40" ]));
    for (let k = 0; k < 6; k++) P.r(x0 + 2 + g.i(w - 4), 15 + g.i(4), 1, 3 + g.i(5), "#7a4a2a");
    P.r(x0 + 24, 16, 9, 8, "#e6e0cc").r(x0 + 25, 17, 7, 1, "#c03a2a").r(x0 + 25, 19, 6, 1, "#6a6458").r(x0 + 25, 21, 5, 1, "#6a6458").r(x0 + 23, 16, 3, 1, "rgba(230,220,170,0.9)").r(x0 + 31, 23, 3, 1, "rgba(230,220,170,0.9)");
    P.r(x0, sb, w, 3, "#3c3e40").r(x0, sb, w, 1, "#6c6e70");
    P.r(x0 + 5, sb + 1, 5, 1, "#b8bcc0").r(x1 - 10, sb + 1, 5, 1, "#b8bcc0").r((x0 + x1 >> 1) - 1, sb + 1, 3, 3, "#8a8e90").p(x0 + x1 >> 1, sb + 2, "#2a2c2e");
    P.r(x0, by, w, H - 1 - by, "#111214");
    for (let k = 0; k < 4; k++) {
      const y = H - 4 - k * 3;
      if (y <= by) break;
      const c = [ "#6a6862", "#4e4c48", "#36352f", "#24231f" ][k];
      P.r(x0, y, w, 1, c).r(x0, y + 1, w, 1, mixC(c, "#000000", .35));
    }
    P.r(x0 + 2, by, 1, H - 1 - by, "#3a3c40").r(x1 - 3, by, 1, H - 1 - by, "#3a3c40");
  };
  DP.shutOpen = function(ctx, di, px, top) {
    const H = A.DOOR_H, img = A.cached("dpShutOpen", TS * 2, H, P => {
      const x0 = 12, x1 = x0 + 40, w = 40;
      P.r(x0 - 3, 0, w + 6, 11, "#1a1a1e").r(x0 - 2, 1, w + 4, 9, "#e2b62a").r(x0 - 2, 1, w + 4, 1, "#f4d460").r(x0 - 2, 9, w + 4, 1, "#a8841a");
      P.r(x0 - 2, 2, 5, 7, "#1a1a1e");
      A.PP.mini(P, x0 - 1, 3, "4", "#f4d460");
      A.PP.label(P, x0 + 4, 2, "나가는 곳", "#1a1a1e", 7, w - 2);
      P.r(x0 - 3, 11, 3, H - 12, "#45474a").r(x0 - 3, 11, 1, H - 12, "#6a6c70").r(x1, 11, 3, H - 12, "#45474a").r(x1 + 2, 11, 1, H - 12, "#2a2c2e");
      P.r(x0, 11, w, 5, "#5c6062").r(x0, 11, w, 1, "#868a8c").r(x0, 15, w, 1, "#2e3032").r(x0, 16, w, 2, "#3c3e40").r(x0, 16, w, 1, "#6c6e70");
      P.r(x0 + 5, 17, 5, 1, "#b8bcc0").r(x1 - 10, 17, 5, 1, "#b8bcc0");
    });
    ctx.drawImage(img, Math.max(0, Math.min(1, di | 0)) * TS, 0, TS, H, px, top, TS, H);
  };
  const PSD_FIX = [ 0, 3, 1, 2, 5, 0, 4, 3, 6, 1, 2, 0, 5, 3 ];
  const psdSign = (F, tx, ty) => {
    const M = F._psdS || (F._psdS = new Map), i = F.i(tx, ty);
    let v = M.get(i);
    if (v === undefined) {
      v = 0;
      for (let k = 1; k <= 6 && !v; k++) {
        const j = F.i(tx, ty + k), d = F.doorAt && F.doorAt.get(j);
        if (d && d.stair) v = 1 + d.tiles.indexOf(j);
      }
      M.set(i, v);
    }
    return v;
  };
  function psdSignArt(P, ox) {
    P.r(ox + 2, 0, 60, 10, "#1a1a1e").r(ox + 3, 1, 58, 8, "#e2b62a").r(ox + 3, 1, 58, 1, "#f4d460").r(ox + 3, 8, 58, 1, "#a8841a");
    A.PP.label(P, ox + 6, 1, "나가는 곳", "#1a1a1e", 7, 42);
    const ax = ox + 53;
    P.r(ax, 2, 2, 3, "#1a1a1e").r(ax - 2, 5, 6, 1, "#1a1a1e").r(ax - 1, 6, 4, 1, "#1a1a1e").r(ax, 7, 2, 1, "#1a1a1e");
  }
  function psdTile(P, door, lE, rE, sg, k, rv, lab) {
    const T0 = 10, B0 = 41, SR = RP("#8a8e94"), g = new SX.Rng(hsh("psd" + k + ":" + rv + lab));
    P.r(0, 0, TS, 10, "#464a50").r(0, 0, TS, 1, "#74787e").r(0, 6, TS, 2, LINE2).r(0, 8, TS, 1, mixC(LINE2, "#000000", .4)).r(0, 9, TS, 1, "#1e2024");
    if (door) {
      P.r(3, 1, 14, 4, "#101114");
      for (let n = 0; n < 3; n++) P.p(4 + g.i(12), 2 + g.i(2), "#5a3a16");
      P.r(19, 0, 12, 6, "#d6d4ca");
      A.PP.mini(P, 19, 0, lab, "#1a1a1e", 12);
    } else P.p(5, 3, "#2a2c30").p(26, 3, "#2a2c30").r(10, 2, 12, 2, "#3a3e44");
    if (sg) psdSignArt(P, sg === 1 ? 0 : -TS);
    P.r(2, T0, TS - 4, B0 - T0, "rgba(150,196,214,0.17)");
    const r0 = 4 + rv * 5 % 14;
    for (let j = 0; j < 9; j++) {
      const x = r0 + j;
      if (x < TS - 3) P.p(x, T0 + 22 - j * 2, "rgba(240,250,255,0.45)").p(x, T0 + 23 - j * 2, "rgba(240,250,255,0.22)");
    }
    if (door) {
      P.r(2, T0, TS - 4, 1, SR[3]).r(2, B0 - 3, TS - 4, 3, SR[2]).r(2, B0 - 3, TS - 4, 1, SR[4]);
      P.r(13, T0, 1, B0 - T0, SR[3]).r(18, T0, 1, B0 - T0, SR[3]).r(15, T0, 2, B0 - T0, "#2e3236").p(15, T0 + 4, "#4a4e54");
      P.r(11, 22, 2, 6, "#b82a24").p(11, 22, "#e86a5a").r(19, 22, 2, 6, "#b82a24").p(19, 22, "#e86a5a");
      P.r(3, 31, 10, 2, "#d8b030").r(19, 31, 10, 2, "#d8b030");
      for (let x = 4; x < 12; x += 2) P.p(x, 31, "#4a3a10").p(x + 16, 31, "#4a3a10");
    } else {
      if (k === 2) {
        P.r(9, T0 + 2, 14, 7, "#1e6a38").r(10, T0 + 3, 12, 5, "#2a8a4a").p(13, T0 + 4, "#f0f4ec").r(12, T0 + 5, 3, 1, "#f0f4ec").p(13, T0 + 6, "#f0f4ec").p(12, T0 + 7, "#f0f4ec").p(14, T0 + 7, "#f0f4ec").r(16, T0 + 4, 5, 3, "#e8f0e0").r(17, T0 + 5, 3, 1, "#2a8a4a");
        P.r(4, 26, TS - 8, 2, "#c8ccd0").r(4, 28, TS - 8, 1, "#5a5e64").r(4, 25, 2, 4, "#8a8e94").r(TS - 6, 25, 2, 4, "#8a8e94");
      } else if (k === 3) {
        P.r(5, T0 + 3, 22, 24, "#2a2c30").r(6, T0 + 4, 20, 22, "#b8ae98").r(6, T0 + 4, 20, 9, "#7a9ab0").r(6, T0 + 13, 20, 1, "#e8e2d0").r(9, T0 + 6, 6, 5, "#c8a070").r(17, T0 + 7, 7, 3, "#e8e0c8");
        A.PP.txt(P, 8, T0 + 16, 16, "#8a7e68", g);
        A.PP.txt(P, 8, T0 + 19, 12, "#8a7e68", g);
        P.r(20, T0 + 19, 6, 7, "#d8d0bc").p(20, T0 + 19, "#2a2c30");
      } else if (k === 4) {
        const cx = 10 + g.i(12), cy = T0 + 8 + g.i(14);
        for (let a = 0; a < 7; a++) {
          const an = a * .9 + g.f() * .5, l = 5 + g.i(9);
          P.line(cx, cy, Math.round(cx + Math.cos(an) * l), Math.round(cy + Math.sin(an) * l), "rgba(236,246,250,0.6)");
        }
        P.p(cx, cy, "#f8fcff");
      } else if (k === 5) P.r(9, T0 + 6, 13, 15, "#e6e0cc").r(10, T0 + 8, 11, 2, "#c03a2a").r(10, T0 + 12, 9, 1, "#6a6458").r(10, T0 + 14, 10, 1, "#6a6458").r(10, T0 + 16, 7, 1, "#6a6458").r(8, T0 + 5, 4, 2, "rgba(230,220,170,0.85)").r(19, T0 + 20, 4, 2, "rgba(230,220,170,0.85)"); else if (k === 6) for (let n = 0; n < 4; n++) {
        const x = 6 + g.i(18), y = T0 + 12 + g.i(14);
        P.r(x, y, 2, 3, "rgba(70,30,26,0.45)").p(x + 2, y + 1, "rgba(70,30,26,0.35)").r(x, y + 3, 1, 2 + g.i(4), "rgba(70,30,26,0.3)");
      }
      P.r(2, B0 - 1, TS - 4, 1, SR[2]);
    }
    for (let n = 0; n < 10; n++) P.p(3 + g.i(TS - 6), B0 - 2 - g.i(6), "rgba(80,70,58,0.35)");
    P.r(0, T0, 2, B0 - T0, SR[3]).r(0, T0, 1, B0 - T0, SR[5]).r(TS - 2, T0, 2, B0 - T0, SR[2]).r(TS - 1, T0, 1, B0 - T0, SR[1]);
    if (lE) P.r(0, 0, 3, 46, "#2e3034").r(1, T0, 1, B0 - T0, "#4a4e54");
    if (rE) P.r(TS - 3, 0, 3, 46, "#2e3034").r(TS - 2, T0, 1, B0 - T0, "#4a4e54");
    P.r(0, B0, TS, 5, "#585c62").r(0, B0, TS, 1, "#9a9ea4").r(0, 45, TS, 1, "#24262a");
    if (door) P.r(3, B0 + 2, TS - 6, 1, "#26282c");
  }
  DP.psd = function(ctx, F, m, tx, ty, px, py) {
    const rx = tx - ((SX.map && SX.map.HOME_MG) | 0) - 1, door = (rx & 1) === 0, nb = rx >> 1, sg = psdSign(F, tx, ty), lE = !(m & 8), rE = !(m & 2);
    const k = door ? 0 : PSD_FIX[(nb % 14 + 14) % 14], rv = (rx % 7 + 7) % 7, lab = door ? 1 + (nb >> 2 & 7) + "-" + (1 + (nb & 3)) : "";
    ctx.drawImage(A.cached("dpPSD" + (door ? "d" : "f") + (lE ? 1 : 0) + (rE ? 1 : 0) + sg + ":" + k + ":" + rv + ":" + lab, TS, 46, P => psdTile(P, door, lE, rE, sg, k, rv, lab)), px, py - 14);
  };
  function topSign(P) {
    P.r(20, 0, 1, 1, "#5a5e64").r(43, 0, 1, 1, "#5a5e64");
    P.r(11, 1, 42, 9, "#1a1a1e").r(12, 2, 40, 7, "#2c3a56").r(12, 2, 40, 1, "#46587a");
    P.oval(17, 5, 3, 3, LINE2);
    A.PP.mini(P, 16, 3, "2", "#ffffff");
    A.PP.label(P, 23, 2, "타는 곳", "#eef0e8", 7, 28);
  }
  function stairArt(P, H) {
    P.r(0, 0, TS * 2, H, "#141518");
    const base = H, sh = 5, n = 8;
    for (let k = 0; k < n; k++) {
      const y1 = base - k * sh, y0 = Math.max(10, y1 - sh);
      if (y1 <= 10) break;
      const t = k / (n - 1);
      P.r(0, y0, TS * 2, y1 - y0, mixC("#8e8a80", "#1c1c1e", t));
      P.r(0, y0, TS * 2, 1, k === 0 ? "#c8a42a" : mixC("#c4c0b4", "#2a2a2c", t));
      if (k > 0) for (let x = 3; x < TS * 2; x += 3) P.p(x, y0 + 1, mixC("#6a665e", "#161618", t));
      const rc = mixC("#c8ccd0", "#2a2c2e", t), rd = mixC("#6a6e74", "#18191b", t);
      for (const x of [ 4, 31, 58 ]) P.r(x, y0, 2, y1 - y0, rd).r(x, y0, 1, y1 - y0, rc);
    }
    for (let x = 6; x < TS * 2 - 6; x += 4) if (x < 29 || x > 34) P.r(x, H - 4, 2, 2, "#e0c050").p(x + 1, H - 3, "#8a6e18");
    P.r(0, 0, 3, H, "#2a2c30").r(TS * 2 - 3, 0, 3, H, "#2a2c30");
    topSign(P);
  }
  function escArt(P, H) {
    P.r(0, 0, TS * 2, H, "#141518");
    for (const a of [ 0, TS ]) {
      const base = H;
      P.r(a + 6, base - 5, 20, 5, "#9ea2a6").r(a + 6, base - 5, 20, 1, "#d0d4d8").r(a + 6, base - 6, 20, 1, "#d8b030");
      for (let x = a + 7; x < a + 26; x += 2) P.p(x, base - 3, "#5a5e64").p(x, base - 2, "#6a6e74");
      for (let k = 0; k < 7; k++) {
        const y1 = base - 6 - k * 5, y0 = Math.max(10, y1 - 5);
        if (y1 <= 10) break;
        const t = k / 6, yc = mixC("#d8b030", "#2a2416", t);
        P.r(a + 6, y0, 20, y1 - y0, mixC("#80848a", "#1a1b1e", t));
        for (let x = a + 8; x < a + 25; x += 2) P.r(x, y0 + 1, 1, y1 - y0 - 1, mixC("#5a5e64", "#121316", t));
        P.r(a + 6, y0, 20, 1, yc).r(a + 6, y0, 1, y1 - y0, yc).r(a + 25, y0, 1, y1 - y0, yc);
      }
      for (const sx of [ a + 1, a + 26 ]) for (let y = 10; y < base; y++) {
        const t = 1 - (y - 10) / (base - 10);
        P.r(sx, y, 5, 1, "#232528").r(sx + 1, y, 2, 1, mixC("#2c2c30", "#0e0e10", t)).p(sx + 1, y, mixC("#4a4a50", "#141416", t)).r(sx + 3, y, 1, 1, mixC("#a8acb2", "#1e2024", t));
      }
      const rx = a + 1, ry = base - 6;
      P.r(rx, ry, 5, 5, "#121214").p(rx + 1, ry + 1, "#e0302a").p(rx + 3, ry + 1, "#e0302a").p(rx + 2, ry + 2, "#e0302a").p(rx + 1, ry + 3, "#e0302a").p(rx + 3, ry + 3, "#e0302a");
    }
    P.r(0, 0, 3, H, "#2a2c30").r(TS * 2 - 3, 0, 3, H, "#2a2c30");
    topSign(P);
  }
  DP.stairOpen = function(ctx, kind, di, px, top) {
    const H = A.DOOR_H, img = A.cached("dpStair" + kind, TS * 2, H, P => (kind === "esc" ? escArt : stairArt)(P, H));
    ctx.drawImage(img, Math.max(0, Math.min(1, di | 0)) * TS, 0, TS, H, px, top, TS, H);
  };
  DP.plank = function(locked, knob, sty) {
    knob = knob | 0;
    return A.cached("dpP" + sty + (locked ? 1 : 0) + knob, TS, TS, P => {
      const b = DP.base(sty), L = LOOK[sty], R = RP(L.face), wide = b === "studio" || b === "olive" || b === "rust", x0 = wide ? 11 : 12, x1 = wide ? 21 : 20;
      P.r(x0, 0, x1 - x0, TS, R[0]).r(x0 + 1, 0, x1 - x0 - 2, TS, R[3]).r(x0 + 1, 0, 1, TS, R[4]).r(x1 - 2, 0, 1, TS, R[2]);
      if (L.glass) P.r(x0 + 3, 0, x1 - x0 - 6, TS, L.glass);
      if (b === "olive" || b === "studio") for (let y = 3; y < TS; y += 6) P.p(x0 + 2, y, R[5]).p(x1 - 3, y, R[5]);
      if (sty === "rust") P.r(x0 + 2, 9, 2, 3, "#7a4226").r(x1 - 4, 21, 2, 4, "#8c5430");
      if (b === "hosp") P.r(x0 + 1, 0, x1 - x0 - 2, 3, "#b0b8bc");
      if (knob === 1) P.r(x0, TS - 1, x1 - x0, 1, R[0]); else if (knob === 2) P.r(x0, 0, x1 - x0, 1, R[0]);
      if (knob !== 3) P.r(x0 + 2, knob === 1 ? 26 : knob === 2 ? 4 : 15, x1 - x0 - 4, 2, L.knob);
      if (locked) P.r(x0 - 2, 12, x1 - x0 + 4, 8, A.C && A.C.lockRed || "#b8322e").r(x0 - 2, 12, x1 - x0 + 4, 1, "#e06060");
    });
  };
  DP.drawOpen = function(ctx, sty, side, px, top, h) {
    const L = LOOK[sty];
    if (!L) return;
    const R = RP(L.face), b = DP.base(sty);
    const f = (x, y, w, hh, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, hh);
    };
    f(px, top + h - 3, TS, 2, L.sill);
    f(px, top + h - 3, TS, 1, RP(L.sill)[4]);
    if (b === "slide") {
      f(px, top, TS, 2, "#8a8c88");
      f(px, top + 1, TS, 1, "#5a5c58");
      return;
    }
    if (!side) return;
    const w = b === "studio" || b === "olive" || b === "rust" ? 5 : 4, x = side < 0 ? px + 3 : px + TS - 3 - w, y = top + 1, hh = h - 5;
    f(x, y, w, hh, R[0]);
    f(x + 1, y, w - 2, hh - 1, L.glass && b === "glass" ? L.glass : R[2]);
    f(side < 0 ? x + w - 2 : x + 1, y, 1, hh - 1, R[4]);
    if (b === "glass") {
      f(x + 1, y, w - 2, 2, R[3]);
      f(x + 1, y + hh - 6, w - 2, 5, R[3]);
    }
    if (b === "hosp" || b === "stain") f(x + 1, y + hh - 8, w - 2, 7, "#b0b8bc");
    f(side < 0 ? x + w - 1 : x, y + Math.round(hh * .45), 1, 2, L.knob);
  };
  const VSIDE = new WeakMap;
  function vSide(F, d, tx, y) {
    let s = VSIDE.get(d);
    if (s) return s;
    const n = x => {
      const Rm = F.room;
      if (!Rm || !F.in(x, y)) return 1e9;
      const id = Rm[F.i(x, y)];
      if (id < 0) return 1e9;
      let c = 0;
      for (let k = 0; k < Rm.length; k++) if (Rm[k] === id) c++;
      return c;
    };
    s = n(tx + 1) <= n(tx - 1) ? 1 : -1;
    VSIDE.set(d, s);
    return s;
  }
  function plainLeaf(P, x0, x1, H, kn) {
    const C = A.C, Rr = RP(C.door || "#6b4a2d"), w = x1 - x0;
    P.r(x0, 0, w, H - 1, Rr[3]).r(x0, 0, 1, H - 1, Rr[4]).r(x1 - 1, 0, 1, H - 1, Rr[1]);
    panel(P, x0 + 3, 4, w - 6, 16, Rr);
    panel(P, x0 + 3, 24, w - 6, 18, Rr);
    if (kn) P.r(kn > 0 ? x1 - 5 : x0 + 2, 22, 3, 2, C.knob || "#d8b44a");
  }
  DP.swing = function(sty, w, kn, locked) {
    const H = A.DOOR_H;
    return A.cached("dpV" + sty + ":" + w + ":" + kn + (locked ? "L" : ""), w, H, P => {
      P.r(0, 0, w, H, DARK);
      if (sty && LEAF[sty]) LEAF[sty](P, 1, w - 1, H, kn, new SX.Rng(hsh(String(sty)) ^ w * 131 ^ (kn > 0 ? 7 : 3))); else plainLeaf(P, 1, w - 1, H, kn);
      P.r(0, H - 1, w, 1, "#1c1d21");
      if (locked) lockOver(P, H);
    });
  };
  DP.vdoor = function(ctx, F, d, sty, tx, ty, px, py, FH, wallish) {
    if (!d || d.horiz || d.secret || !d.tiles || !d.tiles.length) return false;
    let y0 = 1e9, y1 = -1;
    for (const i of d.tiles) {
      const y = i / F.W | 0;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const wl = (x, y) => wallish(x, y) && !F.doorAt.get(F.i(x, y));
    if (!wl(tx, y0 - 1) || !wl(tx, y1 + 1)) return false;
    const WH = A.WALL_H, dn = d.tiles.length, di = ty - y0, py0 = py - di * TS, py1 = py + (y1 - ty) * TS, top = py0 - FH, lk = !!d.locked;
    const b = sty ? DP.base(sty) : null, L = sty ? LOOK[sty] : null, wide = b === "studio" || b === "olive" || b === "rust", x0 = px + (wide ? 11 : 12), x1 = px + (wide ? 21 : 20);
    const f = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    const plank = kn => sty ? DP.plank(lk, kn, sty) : A.doorPlank(lk, kn);
    const face = L ? L.face : A.C.door || "#6b4a2d", Rf = RP(face);
    if (!d.open) {
      const mid = Math.ceil(dn / 2), leaf = dn <= 1 ? 0 : di === mid - 1 ? 1 : di === mid && dn % 2 === 0 ? 2 : 3;
      const ox = b === "slide" || d.home ? 0 : vSide(F, d, tx, y0) > 0 ? px - x0 : px + TS - x1, fa = Math.max(px, x0 + ox - 2), fb = Math.min(px + TS, x1 + ox + 2), ga = Math.max(px, x0 + ox - 1), gb = Math.min(px + TS, x1 + ox + 1);
      if (di === 0) {
        f(fa, top, fb - fa, FH, DARK);
        if (FH > WH) ctx.drawImage(plank(3), 0, 0, TS, FH - WH, px + ox, top, TS, FH - WH);
      }
      ctx.drawImage(plank(leaf), px + ox, py - WH);
      if (di === dn - 1) {
        f(fa, py1 + TS - WH - 3, fb - fa, 3, DARK);
        f(ga, py1 + TS - WH - 3, gb - ga, 1, "#4a4c50");
      }
      return true;
    }
    if (b === "slide") {
      if (di !== 0) return true;
      const e = 12, w = x1 - x0;
      f(x0 - 2, top, w + 4, FH, DARK);
      ctx.drawImage(plank(3), 0, 0, TS, e, px, top, TS, e);
      f(x0, top + e, w, FH, Rf[0]);
      f(x0 + 1, top + e, w - 2, FH - 1, Rf[2]);
      f(x0 + 1, top + e, 1, FH - 1, Rf[3]);
      f(x0 + 1, top + e, w - 2, 1, Rf[4]);
      f(x0 + (w >> 1) - 1, top + e + 18, 2, 10, "#2a2c30");
      f(x0 + (w >> 1) - 1, top + e + 18, 2, 1, "#5a5c58");
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(x0 - 1, py0 + e, w + 2, 2);
      return true;
    }
    const s = vSide(F, d, tx, y0), H = A.DOOR_H, nT = Math.ceil(dn / 2), nB = dn - nT;
    const one = (n, base) => {
      const w = n * TS - 3, x = s > 0 ? px : px + TS - w;
      ctx.fillStyle = "rgba(0,0,0,0.26)";
      ctx.fillRect(x, base - 1, w, 3);
      f(x, base - H - 2, w, 2, DARK);
      f(x + 1, base - H - 2, w - 2, 1, Rf[4]);
      ctx.drawImage(DP.swing(sty, w, s, lk), x, base - H);
      f(s > 0 ? x : x + w - 2, base - H, 2, H, DARK);
    };
    if (di === 0) one(nT, py0);
    const T = SX.map.T, cap = (x, y) => {
      const t = F.tile(x, y);
      return wallish(x, y) || t === T.WALL || t === T.WINDOW || t === T.DOOR;
    };
    let lo = di === dn - 1 && nB > 1;
    for (let k = 1; lo && k < nB; k++) if (cap(tx + s * k, y1 + 1)) lo = false;
    if (lo) one(nB, py1 + TS);
    return true;
  };
  DP.SLIDE_MS = 800;
  DP.BACK = 3;
  DP.secretPose = function(d, now) {
    const W = d.tiles.length * TS, SMAX = W, BK = DP.BACK;
    now = now == null ? performance.now() : now;
    const ez = k => {
      k = Math.max(0, Math.min(1, k));
      return k * k * (3 - 2 * k);
    };
    const sl = d.slide;
    if (sl && now - sl.t0 < DP.SLIDE_MS) {
      const k = (now - sl.t0) / DP.SLIDE_MS;
      if (sl.open) return sl.held ? {
        s: Math.round(ez(k) * SMAX),
        b: BK
      } : k < .3 ? {
        s: 0,
        b: Math.round(ez(k / .3) * BK)
      } : {
        s: Math.round(ez((k - .3) / .7) * SMAX),
        b: BK
      };
      return k < .7 ? {
        s: Math.round((1 - ez(k / .7)) * SMAX),
        b: BK
      } : {
        s: 0,
        b: Math.round((1 - ez((k - .7) / .3)) * BK)
      };
    }
    if (d.open) return {
      s: SMAX,
      b: BK
    };
    const h = d.hold;
    if (h) {
      const e = now - h.t0 - 120;
      if (e > 0) return {
        s: 0,
        b: Math.round(ez(e / Math.max(1, h.ms - 120)) * BK)
      };
    }
    return {
      s: 0,
      b: 0
    };
  };
  DP.secretShift = (d, now) => DP.secretPose(d, now).s;
  DP.shelfSpan = function(F) {
    const s = F.secret;
    if (!s || !s.door) return null;
    if (s.span !== undefined) return s.span;
    const T = SX.map.T, d = s.door, xs = d.tiles.map(i => i % F.W), y = Math.floor(d.tiles[0] / F.W);
    const solid = (x, yy) => {
      const t = F.tile(x, yy);
      return t === T.WALL || t === T.WINDOW || t === T.DOOR || t === T.VOID;
    };
    const face = x => F.tile(x, y) === T.WALL && !solid(x, y + 1);
    let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    const dx0 = x0;
    while (face(x0 - 1)) x0--;
    while (face(x1 + 1)) x1++;
    return s.span = d.horiz ? {
      y,
      x0,
      x1,
      dx0
    } : null;
  };
  DP.shelfAt = (F, x, y) => {
    const sp = F.secret ? DP.shelfSpan(F) : null;
    return !!(sp && y === sp.y && x >= sp.x0 && x <= sp.x1);
  };
  const shelfC = new Map;
  DP.shelfImg = function(n, H) {
    const key = n + ":" + H;
    let c = shelfC.get(key);
    if (c) return c;
    const W = n * TS;
    c = A.mk(W, H);
    const P = new A.Pen(c.getContext("2d")), g = new SX.Rng(SX.hash("bshelf:" + n + ":" + H)), sh = A.shade;
    const O = "#22150b", DK = "#3e2715", MD = "#5c3b22", LT = "#7a5232", HL = "#986a42", BK = "#1b110a", BK2 = "#2b1c11";
    P.r(0, 0, W, H, MD);
    P.r(0, 0, W, 1, O).r(0, 1, W, 1, HL).r(0, 2, W, 1, LT).r(0, 3, W, 1, DK);
    P.r(0, H - 5, W, 1, LT).r(0, H - 4, W, 1, MD).r(0, H - 3, W, 1, DK).r(0, H - 2, W, 2, O);
    const rows = H >= 40 ? 4 : 2, y0 = 4, inner = H - 5 - y0, bd = 2, base = Math.floor((inner - bd * (rows - 1)) / rows), extra = inner - bd * (rows - 1) - base * rows;
    const comps = [];
    {
      let y = y0;
      for (let r = 0; r < rows; r++) {
        const h = base + (r < extra ? 1 : 0);
        comps.push([ y, y + h - 1 ]);
        y += h;
        if (r < rows - 1) {
          P.r(0, y, W, 1, HL).r(0, y + 1, W, 1, DK);
          y += bd;
        }
      }
    }
    const BOOK = [ "#7a2a26", "#2c3a5c", "#2f5233", "#a8842c", "#d2c6a2", "#5a3a24", "#2f5c5c", "#6a6a72", "#26262a", "#5c2238", "#8a4a2a", "#3e4e7a", "#b0a07a", "#4a6a3a" ];
    for (let k = 0; k < n; k++) {
      const xa = k === 0 ? 4 : k * TS + 2, xb = k === n - 1 ? W - 4 : (k + 1) * TS - 2;
      for (const [ya, yb] of comps) {
        P.r(xa, ya, xb - xa, yb - ya + 1, BK2).r(xa, ya, xb - xa, 1, BK).r(xa, ya, 1, yb - ya + 1, BK);
        const ch = yb - ya + 1;
        let x = xa + 1, orn = false;
        while (x < xb - 1) {
          const room = xb - 1 - x;
          if (room >= 6 && !orn && g.chance(.16)) {
            orn = true;
            const w = ornament(P, g, x, yb, ch);
            x += w + 1;
            continue;
          }
          if (room >= 8 && g.chance(.08)) {
            const w = 6 + g.i(3), m = 2 + g.i(2);
            for (let j = 0; j < m; j++) {
              const c = g.pick(BOOK), yy = yb - j * 2 - 1, ww = w - g.i(2);
              P.r(x + g.i(2), yy, ww, 2, c).r(x, yy, 1, 2, sh(c, -.35));
              P.r(x + 1, yy, ww - 1, 1, sh(c, .18));
            }
            x += w + 1;
            continue;
          }
          if (g.chance(.1)) {
            x += 2 + g.i(3);
            continue;
          }
          const w = Math.min(room, g.pick([ 2, 2, 3, 3, 3, 4 ])), h = Math.max(4, ch - 1 - g.i(3)), c = g.pick(BOOK), yt = yb - h + 1;
          if (w < 2) break;
          P.r(x, yt, w, h, c).r(x, yt, w, 1, sh(c, .22));
          if (w >= 3) P.r(x, yt + 1, 1, h - 1, sh(c, .14));
          P.r(x + w - 1, yt + 1, 1, h - 1, sh(c, -.32));
          if (h >= 6 && g.chance(.45)) {
            const bc = g.chance(.5) ? "#c8a84a" : sh(c, .4);
            P.r(x, yt + 2, w, 1, bc);
            if (g.chance(.4)) P.r(x, yb - 2, w, 1, bc);
          }
          x += w + (g.chance(.12) ? 1 : 0);
        }
      }
      const px = k * TS;
      if (k === 0) {
        P.r(0, 0, 1, H, O).r(1, 1, 1, H - 3, HL).r(2, 1, 1, H - 3, MD).r(3, 4, 1, H - 9, DK);
      } else {
        P.r(px - 1, 4, 1, H - 9, HL).r(px, 4, 1, H - 9, MD).r(px + 1, 4, 1, H - 9, DK);
      }
      if (k === n - 1) {
        P.r(W - 4, 4, 1, H - 9, HL).r(W - 3, 1, 1, H - 3, MD).r(W - 2, 1, 1, H - 3, DK).r(W - 1, 0, 1, H, O);
      }
    }
    shelfC.set(key, c);
    return c;
  };
  function ornament(P, g, x, yb, ch) {
    const k = g.i(6);
    if (k === 0) {
      P.r(x, yb - 3, 6, 4, "#8a6a44").r(x, yb - 3, 6, 1, "#a8865a").r(x + 5, yb - 2, 1, 3, "#5e4630").r(x + 2, yb - 2, 2, 1, "#c8a84a");
      return 6;
    }
    if (k === 1) {
      P.r(x + 1, yb - 2, 4, 3, "#a0583a").r(x + 1, yb - 2, 4, 1, "#c07050").r(x + 4, yb - 1, 1, 2, "#743c26");
      for (let j = 0; j < 7; j++) P.p(x + g.i(6), yb - 3 - g.i(Math.max(1, ch - 5)), g.chance(.5) ? "#4a7a3a" : "#6a9a4a");
      return 6;
    }
    if (k === 2) {
      const h = Math.min(6, ch - 2);
      P.r(x, yb - h + 1, 5, h, "#c8a84a").r(x + 1, yb - h + 2, 3, h - 2, "#7aa6c8").r(x + 1, yb - 2, 3, 2, "#6a9a4a").r(x + 4, yb - h + 2, 1, h - 1, "#8a7030");
      return 5;
    }
    if (k === 3) {
      const h = Math.min(5, ch - 3), ft = yb - h;
      P.r(x + 1, ft + 1, 3, h, "#d8d4c8").r(x + 1, ft + 1, 1, h, "#f0ece0").r(x + 3, ft + 2, 1, h - 1, "#a8a498").p(x + 2, ft, "#3a6a3a").p(x + 1, ft - 1, "#c04a4a").p(x + 3, ft - 1, "#e07a7a");
      return 5;
    }
    if (k === 4) {
      P.r(x + 1, yb - 5, 4, 4, "#3a6a9a").p(x + 1, yb - 5, "#5a8aba").r(x + 2, yb - 4, 2, 2, "#6aa04a").r(x + 2, yb - 1, 2, 1, "#5a5c60").r(x + 1, yb, 4, 1, "#8a8c90");
      return 6;
    }
    P.r(x, yb - 4, 1, 5, "#8a8c90").r(x, yb, 3, 1, "#8a8c90").r(x + 1, yb - 4, 1, 4, "#5a5c60");
    return 3;
  }
  DP.shelfBay = function(ctx, F, tx, top, px, H) {
    const sp = DP.shelfSpan(F);
    if (!sp) return;
    ctx.drawImage(DP.shelfImg(sp.x1 - sp.x0 + 1, H), (tx - sp.x0) * TS, 0, TS, H, px, top, TS, H);
  };
  DP.secret = function(ctx, F, d, tx, ty, px, py, wc) {
    const T = SX.map.T, WH = A.WALL_H, dn = d.tiles.length, di = Math.max(0, d.tiles.indexOf(F.i(tx, ty))), W = dn * TS;
    const capish = (x, y) => {
      if (F.plateAt && F.plateAt(x, y)) return true;
      if (F.ceilAt && F.ceilAt(x, y)) return true;
      if (F.voidAt && F.voidAt(x, y)) return false;
      const t = F.tile(x, y);
      return t === T.WALL || t === T.WINDOW || t === T.DOOR;
    };
    const m = (capish(tx - 1, ty) ? 8 : 0) | (capish(tx + 1, ty) ? 2 : 0) | (capish(tx, ty - 1) ? 1 : 0) | 4;
    ctx.drawImage(A.wallCap(0, m, wc), 0, 0, TS, 8, px, py - WH, TS, 8);
    ctx.fillStyle = "#1c1d21";
    ctx.fillRect(px, py - WH + 8, TS, 1);
    const q = DP.secretPose(d), first = di === 0, last = di === dn - 1;
    if (q.s > 0 || q.b > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(px, py - WH + 9, TS, WH + 7);
      ctx.fillStyle = "#2a2c30";
      if (first) ctx.fillRect(px, py - WH + 9, 3, WH + 23);
      if (last) ctx.fillRect(px + TS - 3, py - WH + 9, 3, WH + 23);
    }
    const span = DP.shelfSpan(F), FH = F.wallH || WH, top = py + TS - FH;
    if (span && q.s < W) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, top, TS, FH);
      ctx.clip();
      ctx.drawImage(DP.shelfImg(span.x1 - span.x0 + 1, FH), (span.dx0 - span.x0) * TS, 0, W, FH, px - di * TS + q.s, top - q.b, W, FH);
      ctx.restore();
    } else {
      const sp = q.s < W ? A.prop("bookshelf", 0, null) : null;
      if (sp) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py + sp.oy - 6, TS, TS - sp.oy + 6);
        ctx.clip();
        ctx.drawImage(sp.c, px - di * TS + q.s, py + sp.oy - q.b);
        ctx.restore();
      }
    }
    if (last && q.s >= W - 4) {
      ctx.fillStyle = "#1c1d21";
      ctx.fillRect(px + TS - 5, py - WH + 9, 1, WH + 23);
    }
  };
  DP.secretSliding = (d, now) => !!(d && d.slide && (now == null ? performance.now() : now) - d.slide.t0 < DP.SLIDE_MS);
  const S = SX.audio;
  if (S && S.addSounds) {
    const V2 = (b, n) => {
      const a = [];
      for (let k = 1; k <= n; k++) a.push([ b + "_" + k, 1, 1 ]);
      return a;
    };
    S.addSounds({
      bank: {
        drSteelO: V2("dr_steel_open", 2),
        drSteelC: V2("dr_steel_close", 2),
        drHeavyO: V2("dr_heavy_open", 2),
        drHeavyC: V2("dr_heavy_close", 2),
        drSlideO: V2("dr_slide_open", 2),
        drSlideC: V2("dr_slide_close", 2),
        drGlassO: V2("dr_glass_open", 2),
        drGlassC: V2("dr_glass_close", 2),
        drPlasticO: V2("dr_plastic_open", 1),
        drPlasticC: V2("dr_plastic_close", 2),
        drRustyO: V2("dr_rusty_open", 1),
        drRustyC: V2("dr_rusty_close", 1),
        uiHover: [ [ "ui_hover_1", 1, 1 ], [ "ui_hover_2", 1, 1 ] ]
      },
      gain: {
        drSteelO: .6,
        drSteelC: .55,
        drHeavyO: .6,
        drHeavyC: .65,
        drSlideO: .6,
        drSlideC: .5,
        drGlassO: .6,
        drGlassC: .6,
        drPlasticO: .55,
        drPlasticC: .45,
        drRustyO: .4,
        drRustyC: .5,
        uiHover: .12
      },
      fx: {
        doorOpen(d, t, o, smp, pick) {
          const m = o.mat;
          if (m === "steel" && pick("drSteelO")) return smp(d, t, "drSteelO");
          if (m === "heavy" && pick("drHeavyO")) return smp(d, t, "drHeavyO");
          if (m === "slide" && pick("drSlideO")) return smp(d, t, "drSlideO");
          if (m === "glass" && pick("drGlassO")) return smp(d, t, "drGlassO");
          if (m === "plastic" && pick("drPlasticO")) {
            smp(d, t, "doorLocked", {
              v: .4
            });
            return smp(d, t + .1, "drPlasticO");
          }
          if (m === "rusty" && pick("drRustyO")) {
            smp(d, t, "__gate_latch", {
              v: .45
            });
            return smp(d, t + .12, "drRustyO");
          }
          if (!pick("doorOpen")) return false;
          if (Math.random() < .12 && pick("__door_creak")) {
            smp(d, t, "__door_creak", {
              v: .8
            });
            return true;
          }
          if (Math.random() < .5) smp(d, t, "doorLocked", {
            v: .35
          });
          smp(d, t + .06, "doorOpen");
          return true;
        },
        doorClose(d, t, o, smp, pick) {
          const k = {
            steel: "drSteelC",
            heavy: "drHeavyC",
            slide: "drSlideC",
            glass: "drGlassC",
            plastic: "drPlasticC",
            rusty: "drRustyC"
          }[o.mat];
          return !!(k && pick(k) && smp(d, t, k));
        }
      },
      cat: {
        uiHover: "ui"
      }
    });
  }
})(window.SX);
