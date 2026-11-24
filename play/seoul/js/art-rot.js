"use strict";

(function(SX) {
  const A = SX.art, RP = A.ramp, mix = A.mix, PP = A.PP;
  const box = PP.box, sbox = PP.sbox, vgrad = PP.vgrad, grain = PP.grain, vgrain = PP.vgrain;
  const grime = PP.grime, post = PP.post, cut = PP.cut, rivet = PP.rivet, scratch = PP.scratch;
  const rgba = PP.rgba, rust = PP.rust, glass = PP.glass, books = PP.books;
  const TS = 32;
  const DKs = a => "rgba(10,12,20," + Math.max(0, Math.min(.9, a)).toFixed(3) + ")";
  function turn(p, rot) {
    const x = p.x, y = p.y, w = p.w, d = p.d;
    if (rot === 1) return {
      x: y,
      y: 1 - x - w,
      w: d,
      d: w
    };
    if (rot === 2) return {
      x: 1 - x - w,
      y: 1 - y - d,
      w,
      d
    };
    if (rot === 3) return {
      x: 1 - y - d,
      y: x,
      w: d,
      d: w
    };
    return {
      x,
      y,
      w,
      d
    };
  }
  const FACE = [ "f", "s", "b", "s" ];
  function behind(a, b) {
    const E = .001;
    if (a.y + a.d <= b.y + E) return -1;
    if (b.y + b.d <= a.y + E) return 1;
    if (a.z + a.hh <= b.z) return -1;
    if (b.z + b.hh <= a.z) return 1;
    return a.y + a.d - (b.y + b.d) || a.z - b.z;
  }
  function plinth(P, F, o) {
    o = o || {};
    const R = F.R, hgt = o.h || 4, y = F.y + F.h - hgt;
    if (F.h < hgt + 2) return;
    P.r(F.x, y, F.w, hgt, R[1]).r(F.x, y, F.w, 1, R[3]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
  }
  function feet(P, F, o) {
    o = o || {};
    const c = o.col || F.R[0], wd = o.w || 4, hgt = o.h || 3;
    P.r(F.x + 1, F.y + F.h - hgt, wd, hgt, c);
    P.r(F.x + F.w - wd - 1, F.y + F.h - hgt, wd, hgt, c);
  }
  function molding(P, F) {
    const R = F.R;
    P.r(F.x - 1, F.y, F.w + 2, 3, R[4]).r(F.x - 1, F.y, F.w + 2, 1, R[5]).r(F.x - 1, F.y + 2, F.w + 2, 1, R[1]);
  }
  function hseams(P, F, ys, o) {
    o = o || {};
    const R = F.R;
    for (const t of ys) {
      const y = Math.round(F.y + t * F.h);
      if (y < F.y + 1 || y > F.y + F.h - 2) continue;
      P.r(F.x + (o.in || 0), y, F.w - (o.in || 0) * 2, 1, R[o.dk == null ? 1 : o.dk]);
      P.r(F.x + (o.in || 0), y + 1, F.w - (o.in || 0) * 2, 1, R[o.lt == null ? 4 : o.lt]);
    }
  }
  function planks(P, F, n, o) {
    o = o || {};
    const R = F.R, x = F.x + 2, w = F.w - 4, y = F.y + 2, hh = F.h - 4;
    if (w < 6 || hh < 4) return;
    P.r(x, y, w, hh, R[o.fi == null ? 1 : o.fi]);
    vgrad(P, x, y, w, hh, R[2], R[0], .3, .95);
    for (let k = 1; k < n; k++) {
      const bx = x + Math.round(k * w / n);
      P.r(bx, y, 1, hh, R[o.soft ? 1 : 0]);
      if (bx + 1 < x + w) P.r(bx + 1, y, 1, hh, R[o.soft ? 3 : 3]);
    }
    P.r(x, y, w, 1, R[3]).r(x, y + hh - 1, w, 1, R[0]).r(x, y, 1, hh, R[3]).r(x + w - 1, y, 1, hh, R[0]);
  }
  function doorSeam(P, F, n, o) {
    o = o || {};
    const R = F.R, y = F.y + (o.top || 2), hh = F.h - (o.top || 2) - (o.bot || 4);
    if (hh < 6) return;
    for (let k = 0; k < n; k++) {
      const x = F.x + 1 + Math.round(k * (F.w - 2) / n), w = Math.round((F.w - 2) / n) - 1;
      if (w < 3) continue;
      P.r(x, y, w, hh, R[3]).r(x, y, 1, hh, R[4]).r(x + w - 1, y, 1, hh, R[1]).r(x, y, w, 1, R[4]).r(x, y + hh - 1, w, 1, R[1]);
      if (w > 7) {
        P.r(x + 2, y + 2, w - 4, hh - 4, R[2]).r(x + 2, y + 2, w - 4, 1, R[1]).r(x + 2, y + hh - 3, w - 4, 1, R[4]);
      }
    }
  }
  function cord(P, x, y, len, col) {
    let cx = x, cy = y;
    for (let k = 0; k < len; k++) {
      P.p(cx, cy, col || "#16171b");
      cy++;
      if (k % 5 === 3) cx += k % 10 === 3 ? 1 : -1;
    }
  }
  function vents(P, F, rows, o) {
    o = o || {};
    const R = F.R;
    for (const t of rows) {
      const y = Math.round(F.y + t * F.h);
      for (let k = 0; k < (o.n || 4); k++) {
        const yy = y + k * 2;
        if (yy > F.y + F.h - 3) break;
        P.r(F.x + 2, yy, F.w - 4, 1, R[0]);
        P.r(F.x + 2, yy + 1, F.w - 4, 1, R[5]);
      }
    }
  }
  function hinge(P, F, ts) {
    const R = F.R;
    for (const t of ts) {
      const y = Math.round(F.y + t * F.h);
      P.r(F.x, y, 4, 6, "#9aa0a6").r(F.x, y, 4, 1, "#c8ccd0").r(F.x, y + 5, 4, 1, "#5a5f66");
    }
  }
  function knob(P, x, y, hgt) {
    P.r(x, y, 2, hgt, "#c8a040");
    P.p(x, y, "#f0d070");
  }
  function tileWall(P, F, g) {
    P.r(F.x, F.y, F.w, F.h, "#d8d8d0");
    for (let y = F.y; y < F.y + F.h; y += 4) P.r(F.x, y, F.w, 1, "#a8a8a0");
    for (let x = F.x; x < F.x + F.w; x += 5) for (let y = F.y; y < F.y + F.h; y += 4) P.r(x + (y - F.y >> 2 & 1) * 2, y, 1, 4, "#b8b8b0");
    grime(P, F.x + 1, F.y + 1, F.w - 2, F.h - 2, g, 6, "rgba(120,100,50,0.15)");
  }
  function armPad(P, F, g) {
    const R = F.R;
    P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 6, R[3]);
    vgrad(P, F.x + 1, F.y + 2, F.w - 2, F.h - 6, R[4], R[2], .2, .92);
    P.r(F.x + 1, F.y + 2, F.w - 2, 1, R[5]).r(F.x + 1, F.y + F.h - 5, F.w - 2, 1, R[1]).r(F.x + 1, F.y + F.h - 4, F.w - 2, 3, R[1]);
    if (F.w > 10) for (let k = 1; k < Math.min(4, Math.round(F.w / 10)); k++) P.r(F.x + Math.round(k * F.w / Math.round(F.w / 10)), F.y + 4, 1, F.h - 10, R[2]);
    grime(P, F.x + 2, F.y + 4, F.w - 4, F.h - 10, g, 3);
  }
  function backTop(P, T, g) {
    const R = T.R;
    P.r(T.x, T.y, T.w, T.h, R[4]);
    vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .15, .9);
    P.r(T.x, T.y, T.w, 1, R[5]);
    if (T.w > T.h) {
      for (let x = T.x + 9; x < T.x + T.w - 3; x += 10) P.r(x, T.y + 1, 1, Math.max(1, T.h - 2), R[2]);
    } else {
      for (let y = T.y + 9; y < T.y + T.h - 3; y += 10) P.r(T.x + 1, y, Math.max(1, T.w - 2), 1, R[2]);
    }
  }
  function armTop(P, T, g) {
    const R = T.R;
    P.r(T.x, T.y, T.w, T.h, R[4]);
    vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .15, .9);
    P.r(T.x, T.y, T.w, 1, R[5]);
    if (T.w > T.h) {
      for (let x = T.x + 8; x < T.x + T.w - 3; x += 9) P.r(x, T.y + 1, 1, Math.max(1, T.h - 2), R[2]);
    } else {
      for (let y = T.y + 8; y < T.y + T.h - 3; y += 9) P.r(T.x + 1, y, Math.max(1, T.w - 2), 1, R[2]);
    }
  }
  function cotLeg(P, F, g) {
    const Fr = RP("#7a7a70");
    if (F.rot & 1) {
      for (const side of [ 0, 1 ]) {
        const top = F.x + (side ? F.w - 4 : 3), bot = F.x + (side ? F.w - 1 : 0);
        P.line(top, F.y + 2, bot, F.y + F.h - 1, side ? Fr[1] : Fr[3]);
        P.line(top + 1, F.y + 2, bot + 1, F.y + F.h - 1, side ? Fr[0] : Fr[2]);
        P.r(bot - 1, F.y + F.h - 1, 3, 1, Fr[1]);
      }
      P.r(F.x + 3, F.y + Math.round(F.h * .55), Math.max(1, F.w - 6), 1, Fr[2]);
      return;
    }
    const cx = F.x + Math.round(F.w / 2);
    P.line(cx - 3, F.y + F.h - 1, cx + 3, F.y + 2, Fr[2]);
    P.line(cx + 3, F.y + F.h - 1, cx - 3, F.y + 2, Fr[3]);
    P.r(cx - 4, F.y + F.h - 1, 3, 1, Fr[1]);
    P.r(cx + 2, F.y + F.h - 1, 3, 1, Fr[1]);
  }
  const MODELS = {};
  function build(kind, M) {
    const def = A.propDef(kind);
    if (!def) return;
    const fw = def.fw, fh = def.fh, pad = M.pad == null ? 3 : M.pad, tpu = M.tpu == null ? 10 : M.tpu;
    MODELS[kind] = M;
    const geo = rot => {
      const FW = rot & 1 ? fh : fw, FH = rot & 1 ? fw : fh;
      const cells = rot & 1 ? fw : fh;
      const Wpx = FW * TS - pad * 2, Dpx = Math.max(2, Math.round(tpu * cells));
      const parts = M.parts.map(p => {
        const t = turn(p, rot);
        return {
          src: p,
          x: t.x,
          y: t.y,
          w: t.w,
          d: t.d,
          z: p.z || 0,
          hh: p.hh || 0,
          dpx: p.tp == null ? Dpx : Math.max(0, Math.round(p.tp * cells))
        };
      });
      let ext = 0;
      for (const p of parts) ext = Math.max(ext, (1 - p.y - p.d) * Dpx + p.z + p.hh + (p.src.noTop ? 0 : p.d * p.dpx));
      const need = 2 + Math.ceil(ext), up = Math.max(0, need + 2 - FH * TS);
      const h = FH * TS + up, B = h - 2;
      return {
        FW,
        FH,
        Wpx,
        Dpx,
        parts,
        up,
        w: FW * TS,
        h,
        B
      };
    };
    const isOver = q => !!(q.src.over && q.y + q.d / 2 > .5);
    const paint = (rot, layer) => (P, w, h, up, g, v, col) => {
      const G = geo(rot), base = typeof M.col === "function" ? M.col(col, v) : col || def.color || M.col || "#6a6058";
      const B = G.B, Wpx = G.Wpx, Dpx = G.Dpx, over = layer === "over";
      if (!over) {
        const shA = M.sh == null ? .45 : M.sh;
        const fp = q => {
          const X = pad + Math.round(q.x * Wpx), Wq = Math.max(1, Math.round(q.w * Wpx)), yF = B - Math.round((1 - q.y - q.d) * Dpx), dep = Math.max(1, Math.round(q.d * q.dpx));
          return {
            X,
            Wq,
            yF,
            dep
          };
        };
        for (const q of G.parts) {
          if (q.src.nohit || q.z <= 3 || q.src.cond) continue;
          const f = fp(q);
          P.r(f.X, f.yF - f.dep, f.Wq, f.dep + 1, DKs(shA * .28));
        }
        for (const q of G.parts) {
          if (q.src.nohit || q.z > 3 || q.src.cond) continue;
          const f = fp(q);
          P.r(f.X - 1, f.yF - f.dep, f.Wq + 2, f.dep + 1, DKs(shA * .35));
          P.r(f.X, f.yF - Math.min(f.dep, 3), f.Wq, Math.min(f.dep, 3) + 1, DKs(shA * .45));
        }
      }
      const parts = [];
      for (const q of G.parts) {
        let i = parts.length;
        while (i > 0 && behind(q, parts[i - 1]) < 0) i--;
        parts.splice(i, 0, q);
      }
      for (const p of parts) {
        if (p.src.cond && !p.src.cond(v)) continue;
        if (isOver(p) !== over) continue;
        const s = p.src, hex = s.col ? typeof s.col === "function" ? s.col(base) : s.col : base, R = RP(hex);
        const X = pad + Math.round(p.x * Wpx), Wp = Math.max(1, Math.round(p.w * Wpx));
        const td = s.noTop ? 0 : Math.max(0, Math.round(p.d * p.dpx));
        const fb = B - Math.round((1 - p.y - p.d) * Dpx) - p.z;
        const fy = fb - p.hh, ty = fy - td;
        if (s.skipBox !== true) box(P, X, ty, Wp, td, p.hh, hex, s.boxo || null);
        const T = {
          x: X,
          y: ty,
          w: Wp,
          h: td,
          R,
          col: hex,
          rot,
          B,
          g,
          v,
          Wpx,
          Dpx,
          pad
        };
        T.put = (u, vv, du, dv) => {
          const t = turn({
            x: u,
            y: vv,
            w: du,
            d: dv
          }, rot);
          return {
            x: X + Math.round(t.x * Wp),
            y: ty + Math.round(t.y * td),
            w: Math.max(1, Math.round(t.w * Wp)),
            h: Math.max(1, Math.round(t.d * td))
          };
        };
        const F = {
          x: X,
          y: fy,
          w: Wp,
          h: p.hh,
          R,
          col: hex,
          rot,
          B,
          ty,
          td,
          fb,
          g,
          v,
          Wpx,
          Dpx,
          pad
        };
        if (s.wood && p.hh > 3) vgrain(P, X + 1, fy + 2, Wp - 2, p.hh - 4, hex, g, Math.round(Wp * p.hh / 26));
        if (s.wood && td > 3) grain(P, X + 1, ty + 1, Wp - 2, td - 2, hex, g, Math.round(Wp * td / 22));
        if (s.metal && p.hh > 3) scratch(P, X + 1, fy + 2, Wp - 2, p.hh - 4, g, 4, R[5]);
        if (s.t && td > 1) s.t(P, T, g, hex);
        if (s.base && p.hh > 1) s.base(P, F, g, hex);
        const fn = s[FACE[rot]];
        if (fn && p.hh > 1) fn(P, F, g, hex);
        if (s.all && p.hh > 1) s.all(P, F, g, hex);
      }
      if (M.after && !over) M.after(P, {
        B,
        Wpx,
        Dpx,
        pad,
        rot,
        col: base,
        R: RP(base)
      }, g, v);
    };
    const ups = {
      1: geo(1).up,
      2: geo(2).up,
      3: geo(3).up
    };
    A.defPropRot(kind, {
      draw: {
        1: paint(1),
        2: paint(2),
        3: paint(3)
      },
      up: ups
    });
    if (M.parts.some(p => p.over)) {
      const ov = {
        1: paint(1, "over"),
        2: paint(2, "over"),
        3: paint(3, "over")
      };
      if (M.front) ov[0] = paint(0, "over");
      A.defPropOver(kind, ov);
    }
    if (M.slots3 || M.racks3) {
      const sR = {}, rR = {};
      for (const rot of [ 1, 2, 3 ]) {
        const G = geo(rot);
        const conv = (q, icon) => {
          const t = turn({
            x: q.u,
            y: q.v,
            w: 0,
            d: 0
          }, rot);
          return [ Math.round(pad + t.x * G.Wpx - (icon ? 8 : 0)), Math.round(G.B - (1 - t.y) * G.Dpx - q.z - (icon ? 16 : 0)) ];
        };
        if (M.slots3) sR[rot] = M.slots3.map(q => conv(q, true));
        if (M.racks3) rR[rot] = M.racks3.map(q => conv(q, false));
      }
      A.defPropRot(kind, {
        slotsR: M.slots3 ? sR : null,
        racksR: M.racks3 ? rR : null
      });
    }
    M._geo = geo;
    M._paint = paint;
  }
  A.rotModel = k => MODELS[k] || null;
  A.ROT = {
    build: (kind, M) => {
      build(kind, M);
      if (M.front) {
        const d = A.propDef(kind);
        d.draw = M._paint(0);
        d.up = M._geo(0).up;
      }
    },
    turn,
    plinth,
    feet,
    molding,
    hseams,
    planks,
    doorSeam,
    cord,
    vents,
    hinge,
    knob,
    tileWall,
    armPad,
    backTop,
    armTop
  };
  for (const k of [ "gunRack", "displayCase", "displayShelf", "pedestal", "neon", "poster" ]) A.defPropRot(k, {
    noRot: true
  });
  for (const k of [ "drum", "boxes", "plant", "bigPlant", "floorLamp", "punchBag", "fire", "pedestal", "table", "rug", "o2", "trash", "hydrant", "ivStand", "lamp", "tree", "heater" ]) A.defPropRot(k, {
    sym: true
  });
  build("wardrobe", {
    pad: 3,
    tpu: 10,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 56,
      wood: 1,
      all: (P, F) => {
        molding(P, F);
        plinth(P, F, {
          h: 5
        });
      },
      f: (P, F, g) => {
        doorSeam(P, F, 2, {
          top: 4,
          bot: 12
        });
        knob(P, F.x + F.w / 2 - 4, F.y + 22, 3);
        knob(P, F.x + F.w / 2 + 2, F.y + 22, 3);
      },
      s: (P, F, g) => {
        const R = F.R, hh = F.h - 9;
        P.r(F.x + 2, F.y + 4, F.w - 4, hh, R[3]).r(F.x + 2, F.y + 4, F.w - 4, 1, R[4]);
        P.r(F.x + 2, F.y + 4, 1, hh, R[4]).r(F.x + F.w - 3, F.y + 4, 1, hh, R[1]);
        hinge(P, F, [ .14, .58 ]);
      },
      b: (P, F, g) => {
        planks(P, F, 6, {
          soft: 1
        });
      },
      t: (P, T, g) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    } ]
  });
  build("bookshelf", {
    pad: 3,
    tpu: 10,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 54,
      wood: 1,
      all: (P, F) => {
        plinth(P, F, {
          h: 4
        });
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 1, F.w - 6, F.h - 5, "#1c1612");
        vgrad(P, F.x + 3, F.y + 1, F.w - 6, F.h - 5, "#2a2018", "#16110d", 0, 1);
        for (let i = 0; i < 4; i++) {
          const ys = F.y + 12 + i * 12;
          if (ys > F.y + F.h - 4) break;
          books(P, F.x + 4, F.x + F.w - 4, ys, 10, g);
          P.r(F.x + 1, ys, F.w - 2, 2, R[4]).r(F.x + 1, ys, F.w - 2, 1, R[5]);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 7, R[3]);
        vgrad(P, F.x + 1, F.y + 2, F.w - 2, F.h - 7, R[4], R[2], .3, .95);
        P.r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]).r(F.x + 1, F.y + 2, 1, F.h - 7, R[4]).r(F.x + F.w - 2, F.y + 2, 1, F.h - 7, R[1]);
        for (let i = 0; i < 4; i++) {
          const y = F.y + 12 + i * 12;
          if (y > F.y + F.h - 8) break;
          P.r(F.x + 2, y, F.w - 4, 1, R[1]);
          P.r(F.x + 2, y + 1, F.w - 4, 1, R[4]);
        }
        P.r(F.x + 1, F.y + 1, F.w - 2, 2, "#2a2018");
      },
      b: (P, F, g) => {
        planks(P, F, 5);
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    }, {
      x: .08,
      y: .2,
      w: .18,
      d: .55,
      z: 54,
      hh: 6,
      col: "#8a7a6a"
    } ]
  });
  build("displayShelf", {
    pad: 2,
    tpu: 13,
    slots3: [ {
      u: .22,
      v: .5,
      z: 33
    }, {
      u: .5,
      v: .5,
      z: 33
    }, {
      u: .78,
      v: .5,
      z: 33
    }, {
      u: .22,
      v: .5,
      z: 8
    }, {
      u: .5,
      v: .5,
      z: 8
    }, {
      u: .78,
      v: .5,
      z: 8
    } ],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 60,
      wood: 1,
      all: (P, F) => {
        plinth(P, F, {
          h: 6
        });
      },
      f: (P, F, g) => {
        const R = F.R;
        for (const [a, b] of [ [ .06, .45 ], [ .5, .86 ] ]) {
          const y0 = Math.round(F.y + a * F.h), y1 = Math.round(F.y + b * F.h);
          P.r(F.x + 3, y0, F.w - 6, y1 - y0, "#241c16");
          vgrad(P, F.x + 3, y0, F.w - 6, y1 - y0, "#3a2e22", "#1e1712", 0, 1);
          P.r(F.x + 3, y0, F.w - 6, 1, "#f8e0a0").r(F.x + 3, y0 + 1, F.w - 6, 1, rgba("#ffd886", .45));
          P.r(F.x + 1, y1, F.w - 2, 3, R[4]).r(F.x + 1, y1, F.w - 2, 1, R[5]);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        for (const t of [ .45, .86 ]) {
          const y = Math.round(F.y + t * F.h);
          P.r(F.x, y, F.w, 3, R[4]).r(F.x, y, F.w, 1, R[5]).r(F.x + 1, y + 3, F.w - 2, 1, R[0]);
          P.r(F.x + 1, y - 3, F.w - 2, 3, rgba("#ffd886", .22));
        }
        P.r(F.x + 1, F.y + 1, F.w - 2, 3, R[3]);
      },
      b: (P, F, g) => {
        planks(P, F, 4);
        cord(P, F.x + 5, F.y + F.h - 18, 14);
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    } ]
  });
  build("displayCase", {
    pad: 2,
    tpu: 20,
    slots3: [ {
      u: .27,
      v: .21,
      z: 13
    }, {
      u: .73,
      v: .21,
      z: 13
    }, {
      u: .27,
      v: .79,
      z: 13
    }, {
      u: .73,
      v: .79,
      z: 13
    } ],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 12,
      noTop: 1,
      wood: 1,
      f: (P, F, g) => {
        const R = F.R;
        doorSeam(P, F, 2, {
          top: 2,
          bot: 2
        });
        knob(P, F.x + F.w / 2 - 3, F.y + 4, 3);
        knob(P, F.x + F.w / 2 + 1, F.y + 4, 3);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 4, R[3]).r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]);
      },
      b: (P, F) => planks(P, F, 3)
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 13,
      hh: 18,
      skipBox: true,
      col: "#4a3426",
      t: (P, T, g) => {
        const Rv = RP("#5a1e26");
        P.r(T.x + 2, T.y + 1, T.w - 4, T.h - 1, Rv[3]);
        P.r(T.x + 2, T.y + 1, T.w - 4, 2, Rv[1]);
        P.noise(T.x + 3, T.y + 2, T.w - 6, Math.max(1, T.h - 3), [ Rv[2], Rv[4] ], .08, g);
        P.r(T.x, T.y, T.w, 2, "#c8b070").r(T.x, T.y, T.w, 1, "#e8d8a0");
        P.r(T.x, T.y, 2, T.h, "#b8a060").r(T.x + T.w - 2, T.y, 2, T.h, "#9a8450");
      },
      f: (P, F, g) => glassBox(P, F, g, {
        two: true
      }),
      s: (P, F, g) => glassBox(P, F, g, {}),
      b: (P, F, g) => {
        glassBox(P, F, g, {
          two: true,
          back: true
        });
        P.r(F.x + 3, F.y + 3, F.w - 6, 2, rgba("#ffd886", .15));
      }
    } ]
  });
  function glassBox(P, F, g, o) {
    o = o || {};
    const Br = RP("#b8a060"), Rv = RP("#5a1e26");
    const x = F.x + 2, y = F.y + 2, w = Math.max(1, F.w - 4), hh = Math.max(1, F.h - 4);
    P.r(x, y, w, hh, Rv[1]);
    vgrad(P, x, y, w, hh, Rv[2], Rv[0], .2, .95);
    if (g) P.noise(x, y, w, hh, [ Rv[1], Rv[3] ], .08, g);
    P.r(x, y + hh - 3, w, 3, Rv[3]).r(x, y + hh - 3, w, 1, Rv[4]);
    if (!o.back) {
      for (const t of o.two ? [ .3, .72 ] : [ .5 ]) P.oval(F.x + Math.round(F.w * t), y + hh - 3, Math.max(2, Math.round(F.w * .18)), 1, "rgba(0,0,0,0.3)");
    }
    P.r(x, y, w, 1, Rv[0]);
    P.r(x, y, w, hh, rgba("#cfe8ff", .1));
    P.line(F.x + 3, F.y + F.h - 3, F.x + Math.round(F.w * .5), F.y + 2, rgba("#e8f6ff", .3));
    P.line(F.x + 6, F.y + F.h - 3, F.x + Math.round(F.w * .7), F.y + 2, rgba("#e8f6ff", .15));
    P.r(F.x, F.y, F.w, 2, Br[4]).r(F.x, F.y, F.w, 1, Br[5]).r(F.x, F.y + F.h - 2, F.w, 2, Br[3]);
    P.r(F.x, F.y, 2, F.h, Br[4]).r(F.x + F.w - 2, F.y, 2, F.h, Br[2]);
  }
  build("gunRack", {
    pad: 3,
    tpu: 13,
    racks3: [ {
      u: .19,
      v: .27,
      z: 16
    }, {
      u: .5,
      v: .27,
      z: 16
    }, {
      u: .81,
      v: .27,
      z: 16
    } ],
    parts: [ {
      x: 0,
      y: .04,
      w: 1,
      d: .46,
      z: 0,
      hh: 52,
      wood: 1,
      all: (P, F) => {
        const M = RP("#5a5e64");
        P.r(F.x, F.y + F.h - 5, F.w, 3, M[2]).r(F.x, F.y + F.h - 5, F.w, 1, M[4]);
      },
      f: (P, F, g) => {
        const M = RP("#5a5e64"), felt = "#6a1e22";
        P.r(F.x + 1, F.y + 8, F.w - 2, 5, M[3]).r(F.x + 1, F.y + 8, F.w - 2, 1, M[5]);
        for (let k = 0; k < 3; k++) {
          const x = F.x + 8 + k * Math.round((F.w - 16) / 2);
          P.r(x - 3, F.y + 8, 7, 3, felt).r(x - 3, F.y + 8, 7, 1, "#8a2e32");
        }
        P.r(F.x + 1, F.y + F.h - 14, F.w - 2, 3, M[4]).r(F.x + 1, F.y + F.h - 11, F.w - 2, 4, M[2]);
        P.r(F.x + Math.round(F.w / 2) - 5, F.y + 2, 10, 4, "#c8a040");
      },
      s: (P, F, g) => {
        const M = RP("#5a5e64"), R = F.R;
        P.r(F.x, F.y + 8, F.w, 5, M[3]).r(F.x, F.y + 8, F.w, 1, M[5]).r(F.x + 1, F.y + 10, F.w - 2, 2, "#6a1e22");
        P.r(F.x, F.y + F.h - 14, F.w, 3, M[4]).r(F.x, F.y + F.h - 11, F.w, 4, M[2]);
        vgrain(P, F.x + 1, F.y + 16, F.w - 2, F.h - 32, F.col, g, 8);
      },
      b: (P, F, g) => {
        planks(P, F, 4);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, 1, T.R[5]);
      }
    } ]
  });
  build("locker", {
    pad: 4,
    tpu: 12,
    col: (c, v) => c || [ "#4f6a74", "#56603f", "#7a7468", "#5a5a72" ][v % 4],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 44,
      metal: 1,
      f: (P, F, g) => {
        const R = F.R;
        doorSeam(P, F, 2, {
          top: 1,
          bot: 1
        });
        for (const k of [ 0, 1 ]) {
          const x = F.x + 3 + k * Math.round(F.w / 2);
          vents(P, {
            x,
            y: F.y + 3,
            w: Math.round(F.w / 2) - 5,
            h: 10,
            R
          }, [ 0 ], {
            n: 4
          });
          P.r(x + 1, F.y + 13, 5, 3, "#d8d2bc").r(x + 1, F.y + 13, 5, 1, "#8a8474");
          P.r(x + Math.round(F.w / 2) - 8, F.y + 20, 2, 6, R[1]);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, R[4]).r(F.x + 1, F.y + F.h - 7, F.w - 2, 1, R[4]);
        for (const y of [ F.y + 5, F.y + F.h - 13 ]) for (const x of [ F.x + 2, F.x + F.w - 4 ]) rivet(P, x, y, R);
        hinge(P, F, [ .1, .72 ]);
        rust(P, F.x + 1, F.y + F.h - 8, F.w - 2, 6, g, 4);
      },
      b: (P, F, g) => {
        const R = F.R;
        planks(P, F, 2, {
          fi: 1
        });
        for (const y of [ F.y + 5, F.y + F.h - 8 ]) for (const x of [ F.x + 3, F.x + F.w - 5 ]) rivet(P, x, y, R);
        rust(P, F.x + 2, F.y + F.h - 8, F.w - 4, 6, g, 4);
      },
      t: (P, T, g) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
        grime(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 3), g, 4);
      }
    } ]
  });
  build("fridge", {
    pad: 4,
    tpu: 12,
    col: (c, v) => c || [ "#cfcfc6", "#c8c6b8", "#9fbcae" ][v % 3],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 44,
      metal: 1,
      boxo: {
        fi: 3
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 14, F.w - 2, 1, R[0]).r(F.x + 1, F.y + 15, F.w - 2, 1, R[5]);
        P.r(F.x + F.w - 6, F.y + 4, 2, 8, R[1]).r(F.x + F.w - 6, F.y + 18, 2, 14, R[1]);
        P.r(F.x + 1, F.y + F.h - 8, F.w - 2, 7, "rgba(70,60,30,0.12)");
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 14, F.w - 2, 1, R[1]).r(F.x + 1, F.y + 15, F.w - 2, 1, R[5]);
        P.r(F.x + F.w - 4, F.y + 4, 3, 8, R[1]).r(F.x + F.w - 4, F.y + 18, 3, 14, R[1]);
        hinge(P, F, [ .08, .36, .72 ]);
        P.r(F.x + 1, F.y + F.h - 8, F.w - 2, 7, "rgba(70,60,30,0.1)");
        rust(P, F.x + 1, F.y + F.h - 5, F.w - 2, 4, g, 3);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 3, F.y + 4, F.w - 6, 18, "#5a5f66").r(F.x + 3, F.y + 4, F.w - 6, 1, "#8a9098");
        for (let y = F.y + 6; y < F.y + 21; y += 3) P.r(F.x + 4, y, F.w - 8, 1, "#8a9098");
        P.r(F.x + 3, F.y + F.h - 14, F.w - 6, 8, "#3a3d42");
        cord(P, F.x + 5, F.y + 23, 14);
      },
      t: (P, T, g) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
        grime(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 3), g, 4);
      }
    } ]
  });
  build("safe", {
    pad: 3,
    tpu: 12,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 30,
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y + F.h - 4, 3, 4, R[0]);
        P.r(F.x + F.w - 3, F.y + F.h - 4, 3, 4, R[0]);
      },
      f: (P, F, g) => {
        const R = F.R, M = RP("#9aa0a6");
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 7, R[2]).r(F.x + 3, F.y + 3, F.w - 6, F.h - 9, R[3]);
        P.r(F.x + 4, F.y + 4, F.w - 8, 1, "#b8983a").r(F.x + 4, F.y + F.h - 8, F.w - 8, 1, "#8a7028");
        P.oval(F.x + Math.round(F.w / 2), F.y + 12, 5, 5, M[1]).oval(F.x + Math.round(F.w / 2), F.y + 12, 4, 4, M[3]);
      },
      s: (P, F, g) => {
        const R = F.R, M = RP("#9aa0a6");
        for (const t of [ .15, .58 ]) {
          const y = Math.round(F.y + t * F.h);
          P.r(F.x, y, 3, 5, M[3]).r(F.x, y, 3, 1, M[5]).r(F.x, y + 4, 3, 1, M[1]);
        }
        P.r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]);
        scratch(P, F.x + 2, F.y + 4, F.w - 4, F.h - 10, g, 4, R[5]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 6, R[1]).r(F.x + 2, F.y + 2, F.w - 4, 1, R[3]);
        for (const x of [ F.x + 4, F.x + F.w - 6 ]) for (const y of [ F.y + 4, F.y + F.h - 9 ]) rivet(P, x, y, R);
      },
      t: (P, T, g) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
        scratch(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 3), g, 3, T.R[5]);
      }
    } ]
  });
  const DESK_BODY = "#646a72", DESK_TOP = "#8e7c5c";
  build("desk", {
    pad: 2,
    tpu: 13,
    col: DESK_TOP,
    parts: [ {
      x: .03,
      y: .08,
      w: .34,
      d: .84,
      z: 0,
      hh: 18,
      noTop: 1,
      col: DESK_BODY,
      f: (P, F, g) => {
        const R = F.R;
        for (let k = 0; k < 3; k++) {
          const y = F.y + 1 + k * 6;
          P.r(F.x + 1, y, F.w - 2, 5, R[3]).r(F.x + 1, y, F.w - 2, 1, R[4]).r(F.x + 1, y + 4, F.w - 2, 1, R[1]);
          P.r(F.x + Math.round(F.w / 2) - 4, y + 2, 8, 1, R[0]).r(F.x + Math.round(F.w / 2) - 4, y + 3, 8, 1, R[5]);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, R[2]);
        vgrad(P, F.x + 1, F.y + 1, F.w - 2, F.h - 3, R[3], R[1], .3, .95);
        P.r(F.x + 1, F.y + 1, F.w - 2, 1, R[4]).r(F.x + 1, F.y + F.h - 2, F.w - 2, 1, R[0]);
        P.r(F.x + 1, F.y + F.h - 3, F.w - 2, 3, R[1]).r(F.x + 1, F.y + F.h - 1, F.w - 2, 1, R[0]);
        scratch(P, F.x + 2, F.y + 2, F.w - 4, F.h - 6, g, 3, R[4]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, R[1]).r(F.x + 1, F.y + 1, F.w - 2, 1, R[3]);
        for (const x of [ F.x + 3, F.x + F.w - 5 ]) for (const y of [ F.y + 3, F.y + F.h - 6 ]) rivet(P, x, y, R);
      }
    }, {
      x: .37,
      y: .1,
      w: .5,
      d: .2,
      z: 0,
      hh: 18,
      noTop: 1,
      col: "#1c1f24",
      skipBox: true,
      all: (P, F) => {
        const Rb = RP(DESK_BODY);
        P.r(F.x, F.y, F.w, F.h, "#1c1f24");
        vgrad(P, F.x, F.y, F.w, F.h, "#2a2e35", "#15171b", .2, .7);
        P.r(F.x + 1, F.y + 2, F.w - 2, 9, Rb[1]).r(F.x + 1, F.y + 2, F.w - 2, 1, Rb[2]);
      }
    }, {
      x: .87,
      y: .08,
      w: .11,
      d: .84,
      z: 0,
      hh: 18,
      noTop: 1,
      col: DESK_BODY,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 18,
      hh: 3,
      col: DESK_TOP,
      wood: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + 2, F.w, 1, R[1]);
      },
      t: (P, T, g) => {
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 18));
        grime(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 4), g, 8);
      }
    }, {
      x: .08,
      y: .1,
      w: .3,
      d: .2,
      z: 21,
      hh: 13,
      col: "#17191d",
      skipBox: true,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, F.h, "#17191d").r(F.x, F.y, F.w, 1, "#3a3d44").r(F.x, F.y + F.h - 1, F.w, 1, "#0a0a0c");
      },
      f: (P, F, g) => {
        if (F.w < 5 || F.h < 4) return;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, "#23262c");
        glass(P, F.x + 2, F.y + 2, Math.max(1, F.w - 4), Math.max(1, F.h - 5), {
          col: "#1d2b33",
          gap: 9
        });
        P.p(F.x + F.w - 3, F.y + F.h - 3, "#5fbf6a");
      },
      s: (P, F) => {
        const R = RP("#2a2c32");
        P.r(F.x, F.y, F.w, Math.max(1, F.h - 4), R[2]);
        P.r(F.x, F.y, 1, Math.max(1, F.h - 4), R[4]).r(F.x + F.w - 1, F.y, 1, Math.max(1, F.h - 4), R[0]).r(F.x, F.y, F.w, 1, R[4]);
        P.r(F.x + 1, F.y + 2, Math.max(1, F.w - 2), 1, R[3]);
        const cx = F.x + Math.max(0, Math.round(F.w / 2) - 1);
        P.r(cx, F.y + F.h - 5, 2, 4, R[1]);
        P.r(F.x, F.y + F.h - 2, F.w, 2, R[0]);
      },
      b: (P, F) => {
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, "#2a2d33");
        for (let y = F.y + 3; y < F.y + F.h - 2; y += 3) P.r(F.x + 2, y, Math.max(1, F.w - 4), 1, "#1a1c20");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#1a1c20");
        P.r(T.x, T.y, T.w, 1, "#2e3138");
      }
    }, {
      x: .16,
      y: .2,
      w: .14,
      d: .12,
      z: 21,
      hh: 2,
      noTop: 1,
      col: "#2a2c31"
    }, {
      x: .08,
      y: .52,
      w: .3,
      d: .22,
      z: 21,
      hh: 2,
      col: "#34373d",
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#34373d");
        P.r(T.x, T.y, T.w, 1, "#4a4d54");
        for (let y = T.y + 2; y < T.y + T.h - 1; y += 2) for (let x = T.x + 2; x < T.x + T.w - 1; x += 2) P.p(x, y, "#565a62");
      }
    }, {
      x: .44,
      y: .55,
      w: .06,
      d: .1,
      z: 21,
      hh: 2,
      col: "#2a2c30"
    }, {
      x: .66,
      y: .16,
      w: .24,
      d: .34,
      z: 21,
      hh: 4,
      col: "#c8c2b0",
      t: (P, T, g) => {
        P.r(T.x, T.y, T.w, T.h, "#c8c2b0");
        P.r(T.x, T.y, T.w, 1, "#e6e1d0");
        for (let k = 1; k < 4; k++) {
          const y = T.y + Math.round(k * T.h / 4);
          if (y < T.y + T.h - 1) P.r(T.x + 1, y, Math.max(1, T.w - 2), 1, "#a09a88");
        }
      }
    }, {
      x: .92,
      y: .6,
      w: .06,
      d: .1,
      z: 21,
      hh: 5,
      col: "#e8e4d8",
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#e8e4d8");
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), Math.max(1, T.h - 2), "#4a2e1a");
      }
    } ]
  });
  build("workbench", {
    pad: 2,
    tpu: 11,
    col: "#8a6a44",
    parts: [ {
      x: .02,
      y: .02,
      w: .96,
      d: .16,
      z: 16,
      hh: 26,
      col: "#8a7454",
      all: (P, F, g) => {
        const Pb = F.R;
        for (let y = F.y + 3; y < F.y + F.h - 1; y += 3) for (let x = F.x + 3; x < F.x + F.w - 2; x += 3) P.p(x, y, Pb[1]);
      },
      f: (P, F, g) => {
        const M = RP("#6a6e74");
        if (F.w < 20) return;
        P.r(F.x + 5, F.y + 4, 2, 11, "#6a4a2a").r(F.x + 3, F.y + 3, 6, 3, M[3]).r(F.x + 3, F.y + 3, 6, 1, M[5]);
        P.r(F.x + 12, F.y + 3, 3, 3, M[3]).r(F.x + 13, F.y + 6, 1, 11, M[3]).r(F.x + 12, F.y + 16, 3, 3, M[3]);
        for (let k = 0; k < 3; k++) {
          const x = F.x + 20 + k * 4, c = [ "#c83a30", "#e8b030", "#3a70c0" ][k];
          P.r(x, F.y + 3, 2, 6, c).r(x, F.y + 9, 1, 7, "#b8bcc0");
        }
        P.r(F.x + F.w - 8, F.y + 4, 1, 8, "#c83a30").r(F.x + F.w - 6, F.y + 4, 1, 8, "#c83a30");
      },
      s: (P, F, g) => {
        const M = RP("#6a6e74");
        P.r(F.x + 1, F.y + 4, 2, 9, "#6a4a2a");
        P.r(F.x, F.y + 3, F.w, 2, M[3]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, R[1]);
        vgrain(P, F.x + 2, F.y + 2, F.w - 4, F.h - 4, F.col, g, 10);
      }
    }, {
      x: .04,
      y: .1,
      w: .08,
      d: .8,
      z: 0,
      hh: 11,
      noTop: 1,
      col: "#4a4e54"
    }, {
      x: .88,
      y: .1,
      w: .08,
      d: .8,
      z: 0,
      hh: 11,
      noTop: 1,
      col: "#4a4e54"
    }, {
      x: .1,
      y: .2,
      w: .8,
      d: .6,
      z: 4,
      hh: 2,
      noTop: 1,
      col: "#6a5a42"
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 11,
      hh: 5,
      wood: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
      },
      t: (P, T, g) => {
        const R = T.R;
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 16));
        for (let k = 0; k < 6; k++) P.p(T.x + 2 + g.i(Math.max(1, T.w - 4)), T.y + 1 + g.i(Math.max(1, T.h - 2)), g.pick([ "#b8bcc0", "#8a9098", "#c8a040" ]));
        const vise = T.put(.06, .1, .22, .34), tool = T.put(.08, .55, .3, .22), drill = T.put(.5, .2, .2, .3);
        if (vise.w > 3 && vise.h > 2) {
          P.r(vise.x, vise.y, vise.w, vise.h, "#6a6e74").r(vise.x, vise.y, vise.w, 1, "#9aa0a6");
        }
        if (tool.w > 3 && tool.h > 1) {
          P.r(tool.x, tool.y, tool.w, tool.h, "#8a3a2a").r(tool.x, tool.y, tool.w, 1, "#b05a44");
        }
        if (drill.w > 3 && drill.h > 2) {
          P.r(drill.x, drill.y, drill.w, drill.h, "#c8a030").r(drill.x, drill.y, drill.w, 1, "#e8c050");
        }
      }
    } ]
  });
  build("kitchen", {
    pad: 2,
    tpu: 13,
    parts: [ {
      x: 0,
      y: .08,
      w: 1,
      d: .92,
      z: 0,
      hh: 17,
      noTop: 1,
      wood: 1,
      all: (P, F) => plinth(P, F, {
        h: 3
      }),
      f: (P, F, g) => {
        const R = F.R;
        doorSeam(P, F, 2, {
          top: 2,
          bot: 4
        });
        knob(P, F.x + Math.round(F.w / 2) - 4, F.y + 5, 3);
        knob(P, F.x + Math.round(F.w / 2) + 2, F.y + 5, 3);
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 6, R[3]).r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]);
      },
      b: (P, F, g) => {
        planks(P, F, 3);
        cord(P, F.x + 5, F.y + 4, 12);
      }
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 17,
      hh: 3,
      col: "#b8b4a8",
      metal: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
      },
      t: (P, T, g) => {
        const Rt = T.R;
        P.noise(T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), [ Rt[3], Rt[5] ], .1, g);
        const hob = T.put(.05, .12, .42, .76), sink = T.put(.55, .14, .38, .7);
        if (sink.w > 4 && sink.h > 4) {
          P.r(sink.x, sink.y, sink.w, sink.h, "#8a9098").r(sink.x + 1, sink.y + 1, sink.w - 2, sink.h - 2, "#6a7078").r(sink.x + 1, sink.y + 1, sink.w - 2, 1, "#b0b6bc");
          P.r(sink.x + (sink.w >> 1) - 1, sink.y + (sink.h >> 1), 2, 2, "#3a3d42");
        }
        if (hob.w > 4 && hob.h > 4) {
          P.r(hob.x, hob.y, hob.w, hob.h, "#3a3d42").r(hob.x, hob.y, hob.w, 1, "#5a5d62");
          for (const [dx, dy] of [ [ .27, .28 ], [ .72, .28 ], [ .27, .72 ], [ .72, .72 ] ]) P.oval(hob.x + Math.round(hob.w * dx), hob.y + Math.round(hob.h * dy), Math.max(2, hob.w > 14 ? 3 : 2), 2, "#23252a");
        }
      }
    }, {
      x: .26,
      y: .3,
      w: .16,
      d: .44,
      z: 20,
      hh: 7,
      col: "#8a9098",
      metal: 1,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#c8ccd0");
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, Math.max(1, T.w - 2), Math.max(1, T.h - 2), "#4a4e54");
      }
    }, {
      x: .72,
      y: .02,
      w: .04,
      d: .1,
      z: 20,
      hh: 8,
      col: "#b8c0c4",
      metal: 1,
      nohit: 1,
      all: (P, F) => {
        P.r(F.x, F.y, F.w, 1, "#e0e8ec");
      }
    } ]
  });
  build("tv", {
    pad: 3,
    tpu: 10,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 14,
      wood: 1,
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, Math.round(F.w * .3), 10, R[1]).r(F.x + 1, F.y + 1, Math.round(F.w * .3), 1, R[0]);
        P.r(F.x + 3, F.y + 4, Math.round(F.w * .22), 3, "#2a2c30");
        P.p(F.x + 4, F.y + 6, "#4ae070");
        for (const t of [ .35, .68 ]) {
          const x = F.x + Math.round(F.w * t), w = Math.round(F.w * .28);
          P.r(x, F.y + 1, w, 10, R[3]).r(x, F.y + 1, w, 1, R[4]).r(x + w - 1, F.y + 1, 1, 10, R[1]);
          knob(P, x + w - 4, F.y + 4, 3);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 4, R[3]).r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]);
        P.r(F.x + 1, F.y + 5, F.w - 2, 1, R[1]);
      },
      b: (P, F, g) => {
        planks(P, F, 3);
        cord(P, F.x + 4, F.y + 4, 9);
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    }, {
      x: .42,
      y: .38,
      w: .16,
      d: .2,
      z: 14,
      hh: 8,
      noTop: 1,
      col: "#2a2a2e"
    }, {
      x: .14,
      y: .26,
      w: .72,
      d: .3,
      z: 22,
      hh: 22,
      col: "#141418",
      all: (P, F, g) => {
        P.r(F.x, F.y, F.w, F.h, "#141418").r(F.x, F.y, F.w, 1, "#3a3a42").r(F.x, F.y + F.h - 1, F.w, 1, "#0a0a0c");
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, T.h, "#1a1c20");
        P.r(T.x, T.y + T.h - 1, T.w, 1, "#0a0a0c");
        P.r(T.x, T.y, T.w, 1, "#2a2c32");
      },
      f: (P, F, g) => {
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, "#1c2228");
        vgrad(P, F.x + 1, F.y + 1, F.w - 2, F.h - 3, "#26303a", "#161b20", 0, 1);
        P.line(F.x + 3, F.y + F.h - 4, F.x + Math.round(F.w * .45), F.y + 2, "rgba(200,220,240,0.12)");
        P.p(F.x + F.w - 3, F.y + F.h - 3, "#e84a3a");
      },
      s: (P, F, g) => {
        const R = RP("#2a2c32");
        P.r(F.x, F.y, F.w, F.h, R[2]).r(F.x, F.y, 1, F.h, R[4]).r(F.x + F.w - 1, F.y, 1, F.h, R[0]);
        P.r(F.x, F.y, F.w, 1, R[4]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
        P.r(F.x + 1, F.y + 2, Math.max(1, F.w - 3), 1, R[3]);
        P.r(F.x, F.y + F.h - 4, F.w, 3, R[1]);
      },
      b: (P, F, g) => {
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, "#26282c");
        vgrad(P, F.x + 1, F.y + 1, F.w - 2, F.h - 2, "#33363c", "#1e2024", .1, .9);
        for (let y = F.y + 3; y < F.y + F.h - 2; y += 4) P.r(F.x + 3, y, F.w - 6, 1, "#1a1c20");
        cord(P, F.x + Math.round(F.w / 2), F.y + F.h - 2, 8);
      }
    } ]
  });
  build("speaker", {
    pad: 6,
    tpu: 8,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 48,
      wood: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x + 1, F.y + F.h - 5, F.w - 2, 2, R[0]);
      },
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 7, R[2]);
        const cone = (cx, cy, r) => {
          P.oval(cx, cy, r + 1, r + 1, R[0]).oval(cx, cy, r, r, "#3a3a3e").oval(cx, cy, Math.max(1, r - 1), Math.max(1, r - 1), "#26262a").oval(cx, cy, Math.max(1, r - 3), Math.max(1, r - 3), "#1a1a1e");
          P.p(cx - 1, cy - 1, "#8a8a90");
        };
        const cx = F.x + Math.round(F.w / 2);
        cone(cx, F.y + 6, 3);
        cone(cx, F.y + 17, 6);
        cone(cx, F.y + 32, 6);
        P.r(cx - 2, F.y + 1, 4, 1, "#b8bcc0");
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, 1, R[4]).r(F.x + 1, F.y + F.h - 7, F.w - 2, 1, R[4]);
        vgrain(P, F.x + 1, F.y + 4, F.w - 2, F.h - 12, F.col, g, 8);
      },
      b: (P, F, g) => {
        const R = F.R;
        planks(P, F, 2);
        P.r(F.x + 3, F.y + 8, F.w - 6, 8, "#1e2024");
        P.r(F.x + 4, F.y + 9, 3, 6, "#c8a040");
        P.r(F.x + F.w - 8, F.y + 9, 3, 6, "#b8302a");
        cord(P, F.x + 6, F.y + 16, 12);
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    } ]
  });
  build("neon", {
    pad: 2,
    tpu: 4,
    sh: .3,
    parts: [ {
      x: .14,
      y: .4,
      w: .05,
      d: .2,
      z: 0,
      hh: 14,
      noTop: 1,
      col: "#4a4d52"
    }, {
      x: .79,
      y: .4,
      w: .05,
      d: .2,
      z: 0,
      hh: 14,
      noTop: 1,
      col: "#4a4d52"
    }, {
      x: 0,
      y: .36,
      w: 1,
      d: .24,
      z: 14,
      hh: 35,
      col: "#2a2a30",
      skipBox: true,
      all: (P, F, g) => {
        P.r(F.x, F.y, F.w, F.h, "#2a2a30").r(F.x + 1, F.y + 1, F.w - 2, F.h - 2, "#16161a").r(F.x, F.y, F.w, 1, "#4a4a52");
      },
      f: (P, F, g, col) => {
        const c = col, core = mix(c, "#ffffff", .6), halo = mix(c, "#16161a", .62);
        if (F.w < 16) {
          P.r(F.x + 2, F.y + 4, F.w - 4, 2, halo);
          return;
        }
        for (let k = 0; k < 3; k++) {
          const y = F.y + 6 + k * 9;
          if (y > F.y + F.h - 5) break;
          P.r(F.x + 4, y, F.w - 8, 2, halo);
          P.r(F.x + 5, y, F.w - 10, 1, core);
        }
        P.r(F.x + 4, F.y + F.h - 7, F.w - 8, 1, halo);
      },
      s: (P, F, g, col) => {
        const R = RP("#2a2c30"), c = col;
        P.r(F.x, F.y, F.w, F.h, R[2]);
        vgrad(P, F.x, F.y, F.w, F.h, R[3], R[1], .3, .9);
        P.r(F.x, F.y, 1, F.h, R[4]).r(F.x + F.w - 1, F.y, 1, F.h, R[0]).r(F.x, F.y, F.w, 1, R[4]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
        P.r(F.x + 1, F.y + 3, Math.max(1, F.w - 2), F.h - 7, rgba(c, .5));
        P.r(F.x + 1, F.y + 3, 1, F.h - 7, rgba(c, .85));
        for (let y = F.y + 5; y < F.y + F.h - 5; y += 7) P.r(F.x, y, Math.max(1, F.w), 1, rgba(c, .25));
      },
      b: (P, F, g, col) => {
        const M = RP("#4a4d56");
        P.r(F.x + 2, F.y + 2, F.w - 4, F.h - 5, M[2]);
        vgrad(P, F.x + 2, F.y + 2, F.w - 4, F.h - 5, M[3], M[1], .2, .9);
        for (let y = F.y + 6; y < F.y + F.h - 4; y += 6) P.r(F.x + 3, y, F.w - 6, 1, M[1]);
        for (const x of [ F.x + 4, F.x + F.w - 6 ]) for (const y of [ F.y + 4, F.y + F.h - 8 ]) rivet(P, x, y, M);
        const bx = F.x + Math.round(F.w / 2) - 5, by = F.y + Math.round(F.h / 2) - 5;
        P.r(bx, by, 10, 10, "#2a2c32").r(bx, by, 10, 1, "#5a5f68").r(bx + 2, by + 3, 6, 1, "#8a9098");
        cord(P, bx + 5, by + 10, 10);
      }
    } ]
  });
  build("poster", {
    pad: 4,
    tpu: 4,
    sh: .32,
    parts: [ {
      x: .08,
      y: .58,
      w: .13,
      d: .34,
      z: 0,
      hh: 15,
      noTop: 1,
      col: c => c,
      wood: 1
    }, {
      x: .79,
      y: .58,
      w: .13,
      d: .34,
      z: 0,
      hh: 15,
      noTop: 1,
      col: c => c,
      wood: 1
    }, {
      x: 0,
      y: .3,
      w: 1,
      d: .2,
      z: 12,
      hh: 42,
      skipBox: true,
      all: (P, F, g, col) => {
        const Rw = RP(col);
        P.r(F.x, F.y, F.w, F.h, Rw[3]).r(F.x, F.y, F.w, 2, Rw[5]).r(F.x, F.y + F.h - 2, F.w, 2, Rw[1]);
        P.r(F.x, F.y, 2, F.h, Rw[4]).r(F.x + F.w - 2, F.y, 2, F.h, Rw[1]);
      },
      f: (P, F, g, col) => {
        const x = F.x + 2, y = F.y + 2, w = Math.max(1, F.w - 4), hh = Math.max(1, F.h - 4);
        P.r(x, y, w, hh, "#8fa6b4");
        vgrad(P, x, y, w, hh, "#cfe2ec", "#4f6472", 0, 1);
        P.r(x, y, w, 2, "#e8f4fa");
        P.r(x + 1, y + Math.round(hh * .55), Math.max(1, Math.round(w * .45)), Math.round(hh * .42), "rgba(40,44,52,0.28)");
        P.line(x + 2, y + hh - 3, x + Math.round(w * .75), y + 2, "rgba(255,255,255,0.45)");
        P.line(x + 5, y + hh - 3, x + w - 2, y + 4, "rgba(255,255,255,0.2)");
      },
      s: (P, F, g, col) => {
        const Rw = RP(col);
        const w = Math.max(2, F.w - 1), lean = Math.max(1, Math.round(F.w * .5));
        for (let k = 0; k < F.h - 3; k++) {
          const dx = Math.round(lean * (1 - k / Math.max(1, F.h - 4)));
          P.r(F.x + dx, F.y + 2 + k, w, 1, k < 2 ? Rw[5] : k > F.h - 8 ? Rw[1] : Rw[3]);
          P.p(F.x + dx, F.y + 2 + k, "rgba(220,240,250,0.5)");
        }
      },
      b: (P, F, g, col) => {
        const Rw = RP(col);
        P.r(F.x + 2, F.y + 2, Math.max(1, F.w - 4), F.h - 4, Rw[1]);
        for (let k = 1; k < 4; k++) {
          const x = F.x + Math.round(k * F.w / 4);
          P.r(x, F.y + 3, 1, F.h - 6, Rw[0]);
          P.r(x + 1, F.y + 3, 1, F.h - 6, Rw[2]);
        }
        P.r(F.x + Math.round(F.w / 2) - 4, F.y + 4, 8, 4, Rw[3]);
      },
      t: (P, T, g, col) => {
        const Rw = RP(col);
        P.r(T.x, T.y, T.w, T.h, Rw[2]);
        P.r(T.x, T.y, T.w, 1, Rw[4]);
      }
    } ]
  });
  build("stash", {
    pad: 3,
    tpu: 16,
    col: "#4a5a3c",
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 22,
      metal: 1,
      all: (P, F, g) => {
        const R = F.R, S = RP("#5a5e62");
        P.r(F.x, F.y, 5, F.h, S[3]).r(F.x, F.y, 5, 1, S[5]).r(F.x, F.y, 1, F.h, S[4]).r(F.x + 4, F.y, 1, F.h, S[1]);
        P.r(F.x + F.w - 5, F.y, 5, F.h, S[3]).r(F.x + F.w - 5, F.y, 5, 1, S[5]).r(F.x + F.w - 5, F.y, 1, F.h, S[4]).r(F.x + F.w - 1, F.y, 1, F.h, S[1]);
        for (const y of [ F.y + 4, F.y + F.h - 7 ]) {
          rivet(P, F.x + 2, y, S);
          rivet(P, F.x + F.w - 3, y, S);
        }
        P.r(F.x + 5, F.y, F.w - 10, 3, R[2]).r(F.x + 5, F.y, F.w - 10, 1, R[5]).r(F.x + 5, F.y + 2, F.w - 10, 1, R[0]);
        rust(P, F.x + 6, F.y + F.h - 5, F.w - 12, 4, g, 3);
      },
      f: (P, F, g) => {
        const R = F.R, S = RP("#5a5e62");
        for (const t of [ .24, .72 ]) {
          const x = F.x + Math.round(F.w * t);
          P.r(x, F.y + 1, 5, 7, S[2]).r(x, F.y + 1, 5, 1, S[5]);
        }
        const cx = F.x + Math.round(F.w / 2) - 3;
        P.r(cx, F.y + 1, 6, 8, S[3]).r(cx, F.y + 1, 6, 1, S[5]);
        P.r(cx + 1, F.y + 8, 8, 8, "#8a6a1a").r(cx + 2, F.y + 9, 6, 6, "#d8a830").r(cx + 2, F.y + 9, 6, 1, "#f8d870");
        P.r(F.x + 8, F.y + 11, 12, 6, "#d8d0a0").r(F.x + 8, F.y + 11, 12, 1, "#e8e0b8");
        for (let x = F.x + 9; x < F.x + F.w - 9; x += 6) rivet(P, x, F.y + F.h - 4, R);
      },
      s: (P, F, g) => {
        const R = F.R, S = RP("#5a5e62");
        P.r(F.x + 1, F.y + 5, F.w - 2, 5, S[1]).r(F.x + 1, F.y + 5, F.w - 2, 1, S[4]);
        scratch(P, F.x + 1, F.y + 4, F.w - 2, F.h - 8, g, 4, R[5]);
      },
      b: (P, F, g) => {
        const R = F.R;
        for (let x = F.x + 8; x < F.x + F.w - 7; x += 6) {
          rivet(P, x, F.y + 4, R);
          rivet(P, x, F.y + F.h - 4, R);
        }
        P.r(F.x + 6, F.y + 8, F.w - 12, 6, R[1]).r(F.x + 6, F.y + 8, F.w - 12, 1, R[3]);
      },
      t: (P, T, g) => {
        const R = T.R;
        for (let k = 1; k < 4; k++) {
          const y = T.y + Math.round(k * T.h / 4);
          P.r(T.x + 1, y, T.w - 2, 1, R[2]);
          P.r(T.x + 1, y + 1, T.w - 2, 1, R[5]);
        }
        P.r(T.x + Math.round(T.w / 2) - 4, T.y + 2, 8, Math.max(2, Math.round(T.h * .3)), "#8a7a4a");
        scratch(P, T.x + 2, T.y + 1, T.w - 4, Math.max(1, T.h - 2), g, 4, R[5]);
      }
    } ]
  });
  build("radio", {
    pad: 2,
    tpu: 12,
    col: "#5a5046",
    parts: [ {
      x: .04,
      y: .1,
      w: .92,
      d: .8,
      z: 0,
      hh: 11,
      noTop: 1,
      col: "#5a5046",
      wood: 1,
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 2, F.y + 2, F.w - 4, 4, R[1]).r(F.x + 2, F.y + 2, F.w - 4, 1, R[0]);
        P.r(F.x + Math.round(F.w / 2) - 2, F.y + 4, 4, 1, "#9aa0a8");
      },
      s: (P, F) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 4, R[2]);
      },
      b: (P, F) => planks(P, F, 2)
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 11,
      hh: 3,
      col: "#5a5046",
      wood: 1,
      t: (P, T, g) => {
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, 8);
        P.r(T.x + 2, T.y + 1, Math.max(4, Math.round(T.w * .36)), Math.max(3, T.h - 3), "#d8cca8").r(T.x + 2, T.y + 1, Math.max(4, Math.round(T.w * .36)), 1, "#e8dcb8");
      }
    }, {
      x: .18,
      y: .15,
      w: .64,
      d: .6,
      z: 14,
      hh: 18,
      col: "#4a5238",
      metal: 1,
      f: (P, F, g) => {
        const Ro = F.R;
        P.r(F.x + 1, F.y + 2, Math.max(4, Math.round(F.w * .6)), 9, "#10160e").r(F.x + 2, F.y + 3, Math.max(2, Math.round(F.w * .6) - 2), 7, "#1a3a1e");
        P.line(F.x + 3, F.y + 8, F.x + 6, F.y + 5, "#6ae06a").line(F.x + 6, F.y + 5, F.x + 9, F.y + 7, "#6ae06a");
        P.r(F.x + 2, F.y + 13, Math.max(4, F.w - 8), 2, Ro[1]);
        for (const y of [ F.y + 3, F.y + 8 ]) P.oval(F.x + F.w - 4, y, 2, 2, "#1c1c1e");
      },
      s: (P, F, g) => {
        const Ro = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, Ro[4]);
        P.r(F.x + 1, F.y + 8, F.w - 2, 4, Ro[1]);
        scratch(P, F.x + 1, F.y + 2, F.w - 2, F.h - 4, g, 3, Ro[5]);
      },
      b: (P, F, g) => {
        const Ro = F.R;
        P.r(F.x + 2, F.y + 3, F.w - 4, 10, "#26282c");
        for (let y = F.y + 5; y < F.y + 12; y += 3) P.r(F.x + 3, y, F.w - 6, 1, "#4a4d54");
        cord(P, F.x + 4, F.y + 13, 8);
      },
      t: (P, T) => {
        P.r(T.x + 1, T.y + 1, T.w - 2, 1, T.R[5]);
      }
    }, {
      x: .2,
      y: .2,
      w: .04,
      d: .08,
      z: 32,
      hh: 20,
      col: "#8a9098"
    } ]
  });
  const tankGlareR = (P, F) => P.line(F.x + 2, F.y + F.h - 4, F.x + Math.round(F.w * .3), F.y + 2, "rgba(255,255,255,0.28)");
  if (A.TANK && A.TANK.fishTank) A.TANK.fishTank.glareR = tankGlareR;
  build("fishTank", {
    pad: 3,
    tpu: 12,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 16,
      noTop: 1,
      col: "#3a3430",
      wood: 1,
      f: (P, F, g) => {
        const S = F.R;
        for (const t of [ .02, .5 ]) {
          const x = F.x + Math.round(F.w * t) + 1, w = Math.round(F.w * .46);
          P.r(x, F.y + 2, w, 11, S[3]).r(x, F.y + 2, w, 1, S[4]).r(x + w - 1, F.y + 2, 1, 11, S[1]);
          knob(P, x + w - 4, F.y + 6, 3);
        }
      },
      s: (P, F) => {
        const S = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, 11, S[2]).r(F.x + 1, F.y + 2, F.w - 2, 1, S[4]);
      },
      b: (P, F) => planks(P, F, 3)
    }, {
      x: .01,
      y: .03,
      w: .98,
      d: .94,
      z: 16,
      hh: 24,
      skipBox: true,
      all: (P, F, g, col) => {
        const W = RP(col);
        P.r(F.x, F.y, F.w, F.h, W[3]);
        vgrad(P, F.x, F.y, F.w, F.h, W[4], W[2], 0, 1);
        for (let x = F.x; x < F.x + F.w; x++) {
          const hgt = 2 + x * 7 % 3;
          P.r(x, F.y + F.h - hgt - 1, 1, hgt, g.pick([ "#c8b890", "#8a7a5a", "#a89878", "#e0d0a8" ]));
        }
        for (let k = 0; k < 4; k++) {
          let x = F.x + 3 + g.i(Math.max(1, F.w - 6)), y = F.y + F.h - 3;
          for (let s = 0; s < 8 + g.i(6); s++) {
            P.p(x, y, s % 3 ? "#3a8a3a" : "#5aaa4a");
            y--;
            x += s >> 2 & 1 ? 1 : -1;
            if (y < F.y + 2) break;
          }
        }
        P.r(F.x, F.y, 1, F.h, "#1a1a1c").r(F.x + F.w - 1, F.y, 1, F.h, "#1a1a1c").r(F.x, F.y + F.h - 1, F.w, 1, "#1a1a1c");
        tankGlareR(P, F);
      },
      f: (P, F, g, col) => {
        const fish = [ [ "#f08030", .2, .3 ], [ "#f0d040", .5, .5 ], [ "#4ac0e8", .35, .7 ], [ "#e84a4a", .78, .25 ] ];
        for (const [c, tx, ty] of fish) {
          const x = F.x + Math.round(F.w * tx), y = F.y + Math.round(F.h * ty);
          P.r(x, y, 4, 2, c).p(x + 1, y - 1, c).p(x + 3, y, "#1a1a1a").r(x - 2, y - 1, 2, 1, A.shade(c, -.2)).r(x - 2, y + 2, 2, 1, A.shade(c, -.2));
        }
      },
      s: (P, F, g, col) => {
        const fish = [ [ "#f08030", .4, .35 ], [ "#4ac0e8", .55, .68 ] ];
        for (const [c, tx, ty] of fish) {
          const x = F.x + Math.round(F.w * tx), y = F.y + Math.round(F.h * ty);
          P.r(x, y, 3, 2, c).p(x + 2, y, "#1a1a1a");
        }
      },
      b: (P, F, g) => {
        P.r(F.x + 2, F.y + 1, F.w - 4, 8, "#1e3a44");
        P.r(F.x + 2, F.y + 1, F.w - 4, 1, "#6fd0e8");
        P.r(F.x + F.w - 9, F.y + 2, 6, 9, "#2a2c30");
        cord(P, F.x + F.w - 6, F.y + 11, 10);
      },
      t: (P, T, g, col) => {
        const W = RP(col);
        P.r(T.x, T.y, T.w, T.h, "#1a1a1c");
        P.r(T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), "#3a3a3e");
        const bar = T.put(.08, .42, .84, .16);
        P.r(bar.x, bar.y, bar.w, Math.max(1, Math.round(bar.h / 2)), "#f0f8ff");
        P.r(bar.x, bar.y + Math.max(1, Math.round(bar.h / 2)), bar.w, Math.max(1, bar.h - Math.round(bar.h / 2)), rgba(W[5], .6));
      }
    } ]
  });
  build("sofa", {
    pad: 2,
    tpu: 6,
    col: (c, v) => c || [ "#6a4636", "#4f5e44", "#5a5a64" ][v % 3],
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 0,
      hh: 9,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[2]);
        feet(P, F, {
          col: "#2a1e16",
          w: 3,
          h: 3
        });
      }
    }, {
      x: .03,
      y: .04,
      w: .94,
      d: .34,
      z: 9,
      hh: 33,
      f: (P, F, g) => {
        const R = F.R;
        for (const t of [ .08, .52 ]) {
          const x = F.x + Math.round(F.w * t), w = Math.round(F.w * .4);
          P.r(x, F.y + 4, w, F.h - 8, R[3]).r(x + 1, F.y + 4, w - 2, 1, R[4]).r(x, F.y + 5, 1, F.h - 10, R[4]).r(x + w - 1, F.y + 5, 1, F.h - 10, R[1]);
          P.p(x + 5, F.y + 12, R[1]).p(x + 5, F.y + 13, R[5]);
        }
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, F.h - 7, R[3]);
        vgrad(P, F.x + 1, F.y + 3, F.w - 2, F.h - 7, R[4], R[2], .2, .9);
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, R[5]).r(F.x + 1, F.y + F.h - 5, F.w - 2, 1, R[1]);
        grime(P, F.x + 2, F.y + 6, F.w - 4, F.h - 12, g, 4);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 5, R[2]);
        vgrad(P, F.x + 1, F.y + 2, F.w - 2, F.h - 5, R[3], R[1], .3, .95);
        for (let k = 1; k < 3; k++) P.r(F.x + Math.round(k * F.w / 3), F.y + 3, 1, F.h - 7, R[1]);
        grime(P, F.x + 3, F.y + 5, F.w - 6, F.h - 10, g, 5);
      },
      t: backTop
    }, {
      x: .1,
      y: .38,
      w: .8,
      d: .56,
      z: 9,
      hh: 14,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[1]);
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[4]);
        vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .15, .9);
        const n = T.w > T.h ? 2 : 1;
        for (let k = 1; k < n; k++) {
          const x = T.x + Math.round(k * T.w / n);
          P.r(x, T.y, 1, T.h, R[1]).r(x + 1, T.y, 1, T.h, R[5]);
        }
        if (n === 1 && T.h > 10) {
          const y = T.y + Math.round(T.h / 2);
          P.r(T.x, y, T.w, 1, R[1]).r(T.x, y + 1, T.w, 1, R[5]);
        }
        grime(P, T.x + 2, T.y + 2, T.w - 4, Math.max(1, T.h - 4), g, 5);
      }
    }, {
      x: 0,
      y: .1,
      w: .12,
      d: .88,
      z: 1,
      hh: 22,
      boxo: {
        fi: 3
      },
      all: armPad,
      t: armTop
    }, {
      x: .88,
      y: .1,
      w: .12,
      d: .88,
      z: 1,
      hh: 22,
      boxo: {
        fi: 2
      },
      all: armPad,
      t: armTop
    } ]
  });
  build("armchair", {
    pad: 2,
    tpu: 6,
    parts: [ {
      x: 0,
      y: .05,
      w: 1,
      d: .95,
      z: 0,
      hh: 9,
      all: (P, F) => {
        feet(P, F, {
          col: "#3a2a1e",
          w: 2,
          h: 4
        });
      }
    }, {
      x: .06,
      y: .04,
      w: .88,
      d: .36,
      z: 9,
      hh: 31,
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, F.h - 7, R[3]).r(F.x + 1, F.y + 3, F.w - 2, 2, R[5]).r(F.x + 1, F.y + 3, 1, F.h - 7, R[4]).r(F.x + F.w - 2, F.y + 3, 1, F.h - 7, R[1]);
        for (const [dx, dy] of [ [ .25, 8 ], [ .5, 8 ], [ .75, 8 ], [ .35, 14 ], [ .65, 14 ] ]) P.p(F.x + Math.round(F.w * dx), F.y + dy, R[1]).p(F.x + Math.round(F.w * dx), F.y + dy + 1, R[5]);
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, F.h - 7, R[3]);
        vgrad(P, F.x + 1, F.y + 3, F.w - 2, F.h - 7, R[4], R[2], .2, .9);
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, R[5]);
        grime(P, F.x + 2, F.y + 6, F.w - 4, F.h - 12, g, 3);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 2, F.w - 2, F.h - 5, R[2]);
        vgrad(P, F.x + 1, F.y + 2, F.w - 2, F.h - 5, R[3], R[1], .3, .95);
        grime(P, F.x + 2, F.y + 4, F.w - 4, F.h - 9, g, 4);
      },
      t: backTop
    }, {
      x: .16,
      y: .4,
      w: .68,
      d: .54,
      z: 9,
      hh: 13,
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[4]);
        vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .15, .9);
        if (T.h > 6) {
          const y = T.y + Math.round(T.h / 2);
          P.r(T.x, y, T.w, 1, R[1]);
        }
        grime(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), g, 3);
      }
    }, {
      x: 0,
      y: .12,
      w: .16,
      d: .84,
      z: 5,
      hh: 22,
      boxo: {
        fi: 3
      },
      all: armPad,
      t: armTop
    }, {
      x: .84,
      y: .12,
      w: .16,
      d: .84,
      z: 5,
      hh: 22,
      boxo: {
        fi: 2
      },
      all: armPad,
      t: armTop
    } ]
  });
  const CH_FAB = [ "#3d4656", "#4a3a3a", "#3a4a40" ];
  build("chair", {
    pad: 3,
    tpu: 9,
    sh: .38,
    col: (c, v) => c || CH_FAB[v % 3],
    parts: [ {
      x: .12,
      y: .2,
      w: .76,
      d: .7,
      z: 0,
      hh: 4,
      col: "#3a3d44",
      skipBox: true,
      all: (P, F, g) => {
        const M = RP("#3a3d44"), cx = F.x + Math.round(F.w / 2), cy = F.y + Math.round(F.h / 2);
        for (const [dx, dy] of [ [ -1, .1 ], [ 1, .1 ], [ -.6, 1 ], [ .6, 1 ], [ 0, -.6 ] ]) {
          const ex = cx + Math.round(dx * F.w * .5), ey = cy + Math.round(dy * F.h * .7);
          P.thick(cx, cy, ex, ey, 2, dx < 0 ? M[3] : M[2]);
          P.r(ex - 1, ey, 3, 2, "#16171a").p(ex - 1, ey, "#4a4d54");
        }
        P.r(cx - 3, cy - 2, 6, 3, M[3]).r(cx - 3, cy - 2, 6, 1, M[4]);
      }
    }, {
      x: .44,
      y: .42,
      w: .12,
      d: .14,
      z: 4,
      hh: 6,
      noTop: 1,
      col: "#8a9098"
    }, {
      x: .1,
      y: .15,
      w: .8,
      d: .72,
      z: 10,
      hh: 4,
      col: c => c || CH_FAB[0],
      boxo: {
        fi: 3
      },
      t: (P, T, g) => {
        const R = T.R;
        P.r(T.x, T.y, T.w, T.h, R[4]);
        vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .2, .9);
        if (T.h > 5) P.r(T.x + 1, T.y + Math.round(T.h / 2), T.w - 2, 1, R[3]);
      }
    }, {
      x: .08,
      y: .08,
      w: .84,
      d: .24,
      z: 20,
      hh: 18,
      col: c => c || CH_FAB[0],
      f: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, R[2]);
        P.dith(F.x + 2, F.y + 3, F.w - 4, F.h - 8, R[1], 0);
        P.r(F.x + 1, F.y + 1, F.w - 2, 1, R[5]).r(F.x + 1, F.y + F.h - 4, F.w - 2, 2, R[4]);
      },
      s: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, R[3]);
        P.r(F.x + 1, F.y + 1, F.w - 2, 1, R[5]);
        P.r(F.x + 1, F.y + F.h - 4, F.w - 2, 1, R[1]);
      },
      b: (P, F, g) => {
        const R = F.R;
        P.r(F.x + 1, F.y + 1, F.w - 2, F.h - 3, R[1]);
        P.r(F.x + Math.round(F.w / 2) - 1, F.y + 2, 2, F.h - 6, R[3]);
      },
      t: (P, T) => {
        P.r(T.x, T.y, T.w, 1, T.R[5]);
      }
    }, {
      x: 0,
      y: .2,
      w: .1,
      d: .4,
      z: 14,
      hh: 3,
      col: "#3a3d44"
    }, {
      x: .9,
      y: .2,
      w: .1,
      d: .4,
      z: 14,
      hh: 3,
      col: "#3a3d44"
    } ]
  });
  {
    A.propHit("chair", 0);
    const d = A.propDef("chair"), M = MODELS.chair;
    if (d && M) {
      d.draw = M._paint(0);
      d.up = M._geo(0).up;
      if (A.clearCache) A.clearCache();
    }
  }
  build("cot", {
    pad: 2,
    tpu: 22,
    sh: .34,
    col: (c, v) => c || [ "#5a6a4a", "#4a5a4a", "#6a6450" ][v % 3],
    parts: [ {
      x: .03,
      y: .12,
      w: .1,
      d: .76,
      z: 0,
      hh: 12,
      col: "#7a7a70",
      skipBox: true,
      all: cotLeg
    }, {
      x: .45,
      y: .12,
      w: .1,
      d: .76,
      z: 0,
      hh: 12,
      col: "#7a7a70",
      skipBox: true,
      all: cotLeg
    }, {
      x: .87,
      y: .12,
      w: .1,
      d: .76,
      z: 0,
      hh: 12,
      col: "#7a7a70",
      skipBox: true,
      all: cotLeg
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 9,
      hh: 3,
      col: c => c || "#5a6a4a",
      all: (P, F) => {
        const Fr = RP("#7a7a70");
        P.r(F.x, F.y, F.w, 3, Fr[3]).r(F.x, F.y, F.w, 1, Fr[5]).r(F.x, F.y + 2, F.w, 1, Fr[1]);
      },
      t: (P, T, g, col) => {
        const R = RP(col || "#5a6a4a"), Fr = RP("#7a7a70");
        P.r(T.x, T.y, T.w, T.h, R[4]);
        vgrad(P, T.x, T.y, T.w, T.h, R[5], R[3], .1, .95);
        P.r(T.x, T.y, T.w, 2, Fr[4]).r(T.x, T.y, 2, T.h, Fr[4]).r(T.x + T.w - 2, T.y, 2, T.h, Fr[2]);
        const along = T.w >= T.h;
        const step2 = 9;
        if (along) for (let x = T.x + 9; x < T.x + T.w - 2; x += step2) P.r(x, T.y + 2, 1, T.h - 4, R[3]); else for (let y = T.y + 9; y < T.y + T.h - 2; y += step2) P.r(T.x + 2, y, T.w - 4, 1, R[3]);
        const pw = along ? Math.round(T.w * .2) : T.w - 6, ph = along ? T.h - 6 : Math.round(T.h * .2);
        const px = T.x + 3, py = T.y + 3;
        P.r(px, py, pw, ph, "#c8c0a8").r(px, py, pw, 1, "#e0d8c0").r(px, py + ph - 1, pw, 1, "#9a927e");
        const Rs = RP("#6a3a2a");
        if (along) {
          const sx = px + pw + 2, sw = T.x + T.w - 3 - sx;
          if (sw > 4) {
            P.r(sx, py, sw, ph, Rs[3]).r(sx, py, sw, 2, Rs[5]).r(sx, py + ph - 1, sw, 1, Rs[1]);
            for (let x = sx + 5; x < sx + sw - 1; x += 6) P.r(x, py + 1, 1, ph - 2, Rs[2]);
          }
        } else {
          const sy = py + ph + 2, sh3 = T.y + T.h - 3 - sy;
          if (sh3 > 4) {
            P.r(px, sy, pw, sh3, Rs[3]).r(px, sy, 2, sh3, Rs[5]).r(px + pw - 1, sy, 1, sh3, Rs[1]);
            for (let y = sy + 5; y < sy + sh3 - 1; y += 6) P.r(px + 1, y, pw - 2, 1, Rs[2]);
          }
        }
        grime(P, T.x + 3, T.y + 3, T.w - 6, T.h - 6, g, 6);
      }
    } ]
  });
  build("doubleBed", {
    pad: 2,
    tpu: 22,
    sh: .45,
    parts: [ {
      x: 0,
      y: 0,
      w: 1,
      d: .16,
      z: 0,
      hh: 15,
      col: "#5a3e2a",
      wood: 1,
      f: (P, F, g) => {
        const Rw = F.R;
        const n = F.w > 40 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const x = F.x + 3 + Math.round(k * (F.w - 6) / n), w = Math.round((F.w - 6) / n) - 3;
          if (w < 4) continue;
          P.r(x, F.y + 4, w, F.h - 14, Rw[2]).r(x, F.y + 4, w, 1, Rw[1]).r(x, F.y + F.h - 11, w, 1, Rw[4]);
        }
      },
      s: (P, F, g) => {
        const Rw = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, F.h - 6, Rw[3]);
        vgrad(P, F.x + 1, F.y + 3, F.w - 2, F.h - 6, Rw[4], Rw[2], .3, .95);
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, Rw[5]).r(F.x + 1, F.y + F.h - 4, F.w - 2, 1, Rw[1]);
      },
      b: (P, F, g) => {
        const Rw = F.R;
        P.r(F.x + 1, F.y + 3, F.w - 2, F.h - 9, Rw[2]);
        P.r(F.x + 1, F.y + 3, F.w - 2, 1, Rw[4]);
        for (let k = 1; k < 5; k++) {
          const x = F.x + Math.round(k * F.w / 5);
          P.r(x, F.y + 4, 1, F.h - 12, Rw[1]);
          P.r(x + 1, F.y + 4, 1, F.h - 12, Rw[3]);
        }
        P.r(F.x + 1, F.y + F.h - 7, F.w - 2, 2, Rw[3]).r(F.x + 1, F.y + F.h - 7, F.w - 2, 1, Rw[4]);
      },
      t: (P, T, g) => {
        const Rw = T.R;
        P.r(T.x, T.y, T.w, T.h, Rw[3]);
        vgrad(P, T.x, T.y, T.w, T.h, Rw[4], Rw[2], .25, .95);
        P.r(T.x, T.y, T.w, 1, Rw[5]).r(T.x, T.y + T.h - 1, T.w, 1, Rw[1]);
        grain(P, T.x + 1, T.y + 1, Math.max(1, T.w - 2), Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 20));
      }
    }, {
      x: 0,
      y: .16,
      w: 1,
      d: .84,
      z: 0,
      hh: 14,
      col: c => c || "#5a6a8a",
      boxo: {
        fi: 3
      },
      all: (P, F) => {
        const Rw = RP("#5a3e2a");
        P.r(F.x, F.y + F.h - 4, F.w, 4, Rw[2]).r(F.x, F.y + F.h - 4, F.w, 1, Rw[4]);
        P.r(F.x + 2, F.y + F.h - 1, 3, 1, Rw[0]);
        P.r(F.x + F.w - 5, F.y + F.h - 1, 3, 1, Rw[0]);
      },
      t: (P, T, g, col) => {
        const R = RP(col || "#5a6a8a"), lin = RP("#e0ddd4");
        P.r(T.x, T.y, T.w, T.h, lin[3]).r(T.x, T.y, T.w, 2, lin[1]);
        const duvet = T.put(0, .3, 1, .7);
        if (duvet.w > 3 && duvet.h > 4) {
          P.r(duvet.x, duvet.y, duvet.w, duvet.h, R[3]);
          vgrad(P, duvet.x, duvet.y, duvet.w, duvet.h, R[4], R[2], .1, .9);
          const lipH = Math.max(2, Math.round(Math.min(duvet.w, duvet.h) * .12));
          if (T.rot === 0) P.r(duvet.x, duvet.y, duvet.w, lipH, "#ecebe4"); else if (T.rot === 2) P.r(duvet.x, duvet.y + duvet.h - lipH, duvet.w, lipH, "#ecebe4"); else if (T.rot === 1) P.r(duvet.x, duvet.y, lipH, duvet.h, "#ecebe4"); else P.r(duvet.x + duvet.w - lipH, duvet.y, lipH, duvet.h, "#ecebe4");
          for (let k = 0; k < 6; k++) {
            const wx = duvet.x + 2 + g.i(Math.max(2, duvet.w - 4)), wy = duvet.y + 3 + g.i(Math.max(2, duvet.h - 5));
            if (duvet.w >= duvet.h) P.line(wx, wy, wx + 5 + g.i(9), wy + 1, R[2]); else P.line(wx, wy, wx + 1, wy + 5 + g.i(9), R[2]);
          }
        }
        for (const u of [ .05, .53 ]) {
          const q = T.put(u, .03, .42, .24);
          if (q.w < 4 || q.h < 3) continue;
          P.r(q.x, q.y, q.w, q.h, lin[5]);
          P.r(q.x, q.y, q.w, 1, "#f8f8f2").r(q.x, q.y + q.h - 1, q.w, 1, "#b8b8ae");
          P.r(q.x, q.y, 1, q.h, "#f4f4ee").r(q.x + q.w - 1, q.y, 1, q.h, "#c8c8c0");
          if (q.w > 8 && q.h > 6) P.r(q.x + 2, q.y + Math.round(q.h / 2), q.w - 4, 1, "#d8d8ce");
        }
        grime(P, T.x + 2, T.y + 2, T.w - 4, T.h - 4, g, 6);
      }
    } ]
  });
  build("coffeeTable", {
    pad: 3,
    tpu: 18,
    sh: .38,
    parts: [ {
      x: .03,
      y: .1,
      w: .08,
      d: .16,
      z: 0,
      hh: 8,
      noTop: 1,
      col: c => c
    }, {
      x: .89,
      y: .1,
      w: .08,
      d: .16,
      z: 0,
      hh: 8,
      noTop: 1,
      col: c => c
    }, {
      x: .03,
      y: .74,
      w: .08,
      d: .16,
      z: 0,
      hh: 8,
      noTop: 1,
      col: c => c
    }, {
      x: .89,
      y: .74,
      w: .08,
      d: .16,
      z: 0,
      hh: 8,
      noTop: 1,
      col: c => c
    }, {
      x: .1,
      y: .2,
      w: .8,
      d: .6,
      z: 3,
      hh: 2,
      noTop: 1,
      col: c => c
    }, {
      x: 0,
      y: 0,
      w: 1,
      d: 1,
      z: 6,
      hh: 4,
      wood: 1,
      all: (P, F) => {
        const R = F.R;
        P.r(F.x, F.y, F.w, 1, R[5]).r(F.x, F.y + F.h - 1, F.w, 1, R[0]);
      },
      t: (P, T, g) => {
        grain(P, T.x + 1, T.y + 1, T.w - 2, Math.max(1, T.h - 2), T.col, g, Math.round(T.w * T.h / 18));
        const mag = T.put(.06, .18, .24, .46), cup = T.put(.52, .22, .1, .24), rem = T.put(.68, .55, .18, .14);
        if (mag.w > 4 && mag.h > 3) {
          P.r(mag.x, mag.y, mag.w, mag.h, "#d8d4c4").r(mag.x, mag.y, mag.w, 1, "#f0ece0").r(mag.x + 1, mag.y + 1, mag.w - 2, Math.max(1, mag.h - 3), "#8a5a4a");
        }
        if (cup.w > 2 && cup.h > 2) {
          P.r(cup.x, cup.y, cup.w, cup.h, "#e8e4d8").r(cup.x, cup.y, cup.w, 1, "#4a2e1a");
        }
        if (rem.w > 3 && rem.h > 1) {
          P.r(rem.x, rem.y, rem.w, rem.h, "#2a2c30").p(rem.x + 1, rem.y, "#c83a30");
        }
      }
    } ]
  });
  A.ROT.glassBox = glassBox;
})(window.SX);
