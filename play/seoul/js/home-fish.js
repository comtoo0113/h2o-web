"use strict";

(function(SX) {
  const A = SX.art, U = SX.homeUse;
  const TF = SX.tankFish = {
    KINDS: {
      fishTank: 1,
      bigTank: 1
    },
    STEP: 15,
    on: true
  };
  TF.time = () => Date.now() % 864e6 / 1e3;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const SPR = {
    s: {
      R: [ [ "DD.B..", ".DBLBE", "..BBBB", "DD...." ], [ ".D.B..", "DDBLBE", "..BBBB", ".D...." ] ],
      F: [ [ ".B.", "EBE", "BLB", ".D." ], [ ".B.", "EBE", "BLB", "D.D" ] ],
      T: [ [ ".D.", "BDB", "BBB", ".D." ], [ "D..", "BDB", "BBB", "..D" ] ],
      Ff: [ [ ".B.", "EBE", ".D." ] ],
      Tf: [ [ ".D.", "BDB", ".D." ], [ "D..", "BDB", "..D" ] ]
    },
    n: {
      R: [ [ "DBBE", "DSS." ], [ "DBBE", ".SS." ] ],
      F: [ [ "BB", "SS" ] ],
      T: [ [ "D", "S" ] ],
      Ff: [ [ "B", "S" ] ],
      Tf: [ [ "S" ] ]
    },
    d: {
      R: [ [ "....DD...", "...BBBB..", "D.BLBSBB.", "DDBBBSBEB", "D.BWBSBB.", "...WWWW..", "....DD..." ], [ "....DD...", "...BBBB..", "..BLBSBB.", "DDBBBSBEB", "DDBWBSBB.", "...WWWW..", "....DD..." ] ],
      F: [ [ ".D.", ".B.", "BLB", "ESE", "BWB", ".W.", ".D." ] ]
    },
    b: {
      R: [ [ "....DDDD.....", "...BBBBBBBB..", "D.BBLLLLBBEB.", "DDBBBBBBBBBBB", "D.BWWWWWWBBB.", "...WWWWWWWW..", ".....D...D..." ], [ "....DDDD.....", "...BBBBBBBB..", ".DBBLLLLBBEB.", "DDBBBBBBBBBBB", ".DBWWWWWWBBB.", "...WWWWWWWW..", ".....D...D..." ] ],
      F: [ [ "..D..", ".BBB.", "BLLLB", "EBBBE", "BWWWB", ".WWW.", ".D.D." ] ]
    }
  };
  const LINE = {
    s: 0,
    n: 0,
    d: 1,
    b: 1
  };
  const PAL = (ty, c, c2) => ({
    B: c,
    L: A.shade(c, .4),
    W: A.shade(c, .22),
    D: ty === "b" ? c2 : A.shade(c, -.2),
    S: c2 || A.shade(c, -.35),
    E: "#1a1a1a"
  });
  function sprite(ty, c, c2, view, fr, off) {
    const S = SPR[ty], set = S[view === "L" ? "R" : view] || S.R, rows = set[fr % set.length], pad = LINE[ty], w = rows[0].length + pad * 2, h = rows.length + pad * 2;
    const key = "tankFish:" + ty + ":" + c + ":" + (c2 || "") + ":" + view + fr;
    if (off) return A.cached(key + ":off", w, h, P => {
      P.x.drawImage(sprite(ty, c, c2, view, fr, false), 0, 0);
      if (U && U.offPass) U.offPass(P, "fishTank", w, h);
    });
    return A.cached(key, w, h, P => {
      const pal = PAL(ty, c, c2), fl = view === "L";
      for (let y = 0; y < rows.length; y++) {
        const r = rows[y];
        for (let x = 0; x < r.length; x++) {
          const ch = r[fl ? r.length - 1 - x : x];
          if (ch !== ".") P.p(pad + x, pad + y, pal[ch]);
        }
      }
    }, pad ? {
      mat: true
    } : null);
  }
  const dimC = new Map;
  function dims(ty, side) {
    const k = ty + side;
    let d = dimC.get(k);
    if (d) return d;
    const S = SPR[ty], pad = LINE[ty];
    let w = 0, h = 0;
    for (const v of side ? [ "R", "F", "T" ] : [ "R", "F" ]) for (const rows of S[v] || []) {
      w = Math.max(w, rows[0].length);
      h = Math.max(h, rows.length);
    }
    d = {
      w: w + pad * 2,
      h: h + pad * 2
    };
    dimC.set(k, d);
    return d;
  }
  const SPD = {
    s: [ 4.5, 8.5 ],
    n: [ 7, 10 ],
    d: [ 3, 4.5 ],
    b: [ 2, 3 ]
  };
  const STOP = {
    s: [ 5, 11, .5, 1.3 ],
    n: [ 2.5, 5, .25, .6 ],
    d: [ 7, 13, 1, 2.2 ],
    b: [ 9, 16, 1.5, 3 ]
  };
  const BOB = {
    s: [ 1.2, 3 ],
    n: [ .8, 4 ],
    d: [ 1, 2 ],
    b: [ .8, 2 ]
  };
  const REACH = {
    s: [ .32, .68 ],
    n: [ .4, .6 ],
    d: [ .3, .7 ],
    b: [ .22, .78 ]
  };
  const WAG = {
    s: 4.5,
    n: 6,
    d: 2.6,
    b: 2
  };
  function members(T, kind) {
    const out = T.fish.map(([c, x, y]) => ({
      ty: "s",
      c,
      y: y - 1
    }));
    if (kind === "fishTank") out.push({
      ty: "n",
      c: "#5ad8f0",
      c2: "#e8484a",
      y: 3,
      n: 3
    }); else {
      const [, by, bc, bt] = T.big;
      out.push({
        ty: "b",
        c: bc,
        c2: bt,
        y: by - 1
      }, {
        ty: "d",
        c: "#e8743a",
        c2: "#f4cc5a",
        y: 9
      }, {
        ty: "d",
        c: "#4a9ae0",
        c2: "#24467e",
        y: 1
      }, {
        ty: "n",
        c: "#5ad8f0",
        c2: "#e8484a",
        y: 2,
        n: 5
      });
    }
    return out;
  }
  const tanks = new Map;
  function fishOf(kind, fid) {
    const key = kind + ":" + fid;
    let L = tanks.get(key);
    if (L) return L;
    const T = A.TANK[kind], dm = A.propDims(kind, 0), W = T.wet(dm.fh * SX.TS + dm.up - 2), g = new SX.Rng((SX.hash("tankFish:" + kind) ^ Math.imul((fid | 0) + 1, 2654435761)) >>> 0);
    L = [];
    const ms = members(T, kind), lanes = ms.map((_, i) => (i + .5) / ms.length);
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = g.i(i + 1), q = lanes[i];
      lanes[i] = lanes[j];
      lanes[j] = q;
    }
    for (const o of ms) {
      const lane = lanes[ms.indexOf(o)];
      const bx = dims(o.ty, false), RX = Math.max(8, W.x1 - W.x0 + 1 - bx.w), RZ = Math.max(4, W.y1 - W.y0 + 1 - bx.h);
      const sp = g.r(SPD[o.ty][0], SPD[o.ty][1]), st = STOP[o.ty], re = REACH[o.ty];
      const p = [ g.r(0, re[0]), g.r(re[1], 1), g.r(0, re[0]), g.r(re[1], 1) ], Ls = [ 0, 1, 2, 3 ].map(i => Math.abs(p[i + 1 & 3] - p[i]));
      const f = {
        ty: o.ty,
        c: o.c,
        c2: o.c2,
        v: sp / RX,
        p,
        L: Ls,
        C: Ls[0] + Ls[1] + Ls[2] + Ls[3],
        s0: g.r(0, 4),
        per: g.r(st[0], st[1]),
        pause: g.r(st[2], st[3]),
        ph: g.r(0, 30),
        z: clamp((W.fy + o.y - W.y0) / RZ, 0, 1),
        zA: BOB[o.ty][0] / RZ,
        zW: 6.2832 / g.r(2.4, 3.8),
        zP: g.r(0, 6.3),
        zD: BOB[o.ty][1] / RZ,
        zDW: 6.2832 / g.r(16, 34),
        zDP: g.r(0, 6.3),
        y: clamp(lane + g.r(-.04, .04), .08, .92),
        yA: g.r(.06, .12),
        yW: 6.2832 / g.r(14, 30),
        yP: g.r(0, 6.3),
        wag: WAG[o.ty],
        wP: g.r(0, 2),
        tr: g.i(2),
        dz: 0,
        dy: 0,
        lag: 0,
        lead: null,
        sA: g.r(.12, .22),
        sW: 6.2832 / g.r(7, 13),
        sP: g.r(0, 6.3)
      };
      f.td = f.v * .16;
      L.push(f);
      for (let k = 1; k < (o.n || 1); k++) L.push(Object.assign({}, f, {
        lead: f,
        lag: k * g.r(.28, .42),
        dz: g.r(-.16, .16),
        dy: g.r(-.14, .14),
        wP: g.r(0, 2),
        tr: g.i(2)
      }));
    }
    tanks.set(key, L);
    return L;
  }
  function at(f, t) {
    const q0 = f.lead || f, tt = t - f.lag, P = q0.per, run = P - q0.pause, u = tt + q0.ph, k = Math.floor(u / P), r = u - k * P;
    const mv = r < run, act = k * run + Math.min(r, run);
    let q = (q0.v * act + q0.s0) % q0.C;
    if (q < 0) q += q0.C;
    let i = 0;
    while (i < 3 && q > q0.L[i]) {
      q -= q0.L[i];
      i++;
    }
    const a = q0.p[i], b = q0.p[i + 1 & 3], h = b >= a ? 1 : -1;
    return {
      X: clamp(a + h * q, 0, 1),
      h,
      turn: q < q0.td || q0.L[i] - q < q0.td,
      mv,
      Z: clamp(q0.z + f.dz + q0.zA * Math.sin(tt * q0.zW + q0.zP) + q0.zD * Math.sin(tt * q0.zDW + q0.zDP), 0, 1),
      Y: clamp(q0.y + f.dy + q0.yA * Math.sin(tt * q0.yW + q0.yP), .04, .96),
      fr: Math.floor(t * (mv ? f.wag : f.wag / 3) + f.wP) & 1
    };
  }
  const MAPU = [ (X, Y) => X, (X, Y) => Y, (X, Y) => 1 - X, (X, Y) => 1 - Y ];
  const MAPF = [ (X, Y) => 1 - Y, (X, Y) => X, (X, Y) => Y, (X, Y) => 1 - X ];
  const ALPHA = far => far < .34 ? 1 : far < .67 ? .86 : .72;
  const geos = new Map;
  function geo(kind, rot, c) {
    const k = kind + ":" + rot + ":" + c.width + "x" + c.height;
    let G = geos.get(k);
    if (G !== undefined) return G;
    G = null;
    const T = A.TANK && A.TANK[kind];
    if (T) {
      let W = null, glare = null;
      if (rot === 0) {
        W = T.wet(c.height - 2);
        glare = P => T.glare(P, W.fy);
      } else {
        const M = A.rotModel && A.rotModel(kind), gm = M && M._geo ? M._geo(rot) : null, q = gm ? gm.parts.find(p => p.src.skipBox) : null;
        if (q && T.glareR) {
          const pad = M.pad == null ? 3 : M.pad, X = pad + Math.round(q.x * gm.Wpx), Wp = Math.max(1, Math.round(q.w * gm.Wpx)), fy = gm.B - Math.round((1 - q.y - q.d) * gm.Dpx) - q.z - q.hh;
          const F = {
            x: X,
            y: fy,
            w: Wp,
            h: q.hh
          };
          W = {
            fy,
            x0: F.x + 1,
            x1: F.x + F.w - 2,
            y0: F.y + 1,
            y1: F.y + F.h - 6,
            yb: F.y + F.h - 2
          };
          glare = P => T.glareR(P, F);
        }
      }
      if (W) {
        const side = rot & 1, ub = MAPU[rot](.93, .5);
        G = {
          W,
          rot,
          side,
          rx: W.x0,
          ry: W.y0,
          rw: W.x1 - W.x0 + 1,
          rh: Math.max(W.y1, W.yb || 0) - W.y0 + 1,
          bx: rot === 0 ? W.bx : W.x0 + Math.round(ub * (W.x1 - W.x0 - 1)),
          bfar: MAPF[rot](.93, .5),
          du: MAPU[rot](1, 0) - MAPU[rot](0, 0),
          df: MAPF[rot](1, 0) - MAPF[rot](0, 0),
          gc: A.mk(c.width, c.height)
        };
        glare(new A.Pen(G.gc.getContext("2d")));
      }
    }
    geos.set(k, G);
    return G;
  }
  function bare(kind, v, col, rot) {
    const d = A.propDef(kind);
    if (!d) return null;
    const dm = A.propDims(kind, rot), w = dm.fw * SX.TS, h = dm.fh * SX.TS + dm.up, own = rot === 0 ? d.draw : d.rotDraw && d.rotDraw[rot];
    if (!own) return null;
    return A.cached("tankBare:" + kind + ":" + v + ":" + (col || "") + ":" + rot, w, h, P => {
      A.tankBare = true;
      try {
        own(P, w, h, dm.up, new SX.Rng(v * 131 + kind.length), v, col || d.color, rot);
      } finally {
        A.tankBare = false;
      }
    }, d.outline ? {
      mat: true
    } : null);
  }
  TF.bare = bare;
  const modC = new WeakMap;
  function modded(c) {
    const M = SX.mods;
    if (!M || !M.tex || !M.tex.length) return false;
    const r = modC.get(c);
    if (r && r.n === M.tex.length) return r.v;
    const k = A.keyOf && A.keyOf(c), v = !!k && M.tex.some(t => t.exact ? t.pat === k : t.re && t.re.test(k));
    modC.set(c, {
      n: M.tex.length,
      v
    });
    return v;
  }
  let bubOff = null;
  function bubCol(off) {
    if (!off) return "#e8f8ff";
    if (!bubOff) {
      const c = A.mk(1, 1), x = c.getContext("2d");
      x.fillStyle = "#e8f8ff";
      x.fillRect(0, 0, 1, 1);
      if (U && U.offPass) U.offPass(new A.Pen(x), "fishTank", 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      bubOff = A.rgbHex(d[0], d[1], d[2]);
    }
    return bubOff;
  }
  const pxC = new WeakMap;
  function pix(c, x, y, w, h) {
    const k = x + "," + y + "," + w + "," + h, m = pxC.get(c);
    if (m && m.k === k) return m.d;
    const d = c.getContext("2d").getImageData(x, y, w, h).data;
    pxC.set(c, {
      k,
      d
    });
    return d;
  }
  const bubRgb = off => A.hexRgb(bubCol(off));
  function build(e, G, list, t, off, bc) {
    const W = G.W, {rx, ry, rw, rh} = G;
    if (!e.img || e.img.width !== rw || e.img.height !== rh) e.img = new ImageData(rw, rh);
    const D = e.img.data, gl = pix(G.gc, rx, ry, rw, rh), gk = (off ? .5 : 1) / 255;
    D.set(pix(bc, rx, ry, rw, rh));
    const sh = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const s = at(f, t), u = MAPU[G.rot](s.X, s.Y), far = MAPF[G.rot](s.X, s.Y), bx = dims(f.ty, G.side);
      let view;
      if (!G.side) view = s.turn ? "F" : s.h * G.du > 0 ? "R" : "L"; else {
        view = s.turn ? f.tr ? "R" : "L" : s.h * G.df > 0 ? "T" : "F";
        if (!s.turn && far >= .55 && SPR[f.ty][view + "f"]) view += "f";
      }
      const sp = sprite(f.ty, f.c, f.c2, view, s.fr, off);
      if (!G.side) {
        const x = W.x0 + Math.round(u * Math.max(0, W.x1 - W.x0 + 1 - bx.w)), y = W.y0 + Math.round(s.Z * Math.max(0, W.y1 - W.y0 + 1 - bx.h));
        sh.push({
          sp,
          far,
          x: x + (bx.w - sp.width >> 1),
          y: y + (bx.h - sp.height >> 1),
          view,
          ty: f.ty,
          i,
          mv: s.mv
        });
        continue;
      }
      const uu = clamp(u + f.sA * Math.sin(t * f.sW + f.sP), 0, 1), k = 1 - .38 * far, xc = (W.x0 + W.x1 + 1) / 2, yc = (W.y0 + W.y1 + 1) / 2;
      const cx = xc + (W.x0 + bx.w / 2 + uu * Math.max(0, W.x1 - W.x0 + 1 - bx.w) - xc) * k, cy = yc + (W.y0 + bx.h / 2 + s.Z * Math.max(0, W.y1 - W.y0 + 1 - bx.h) - yc) * k;
      sh.push({
        sp,
        far,
        x: Math.round(cx - sp.width / 2),
        y: Math.round(cy - sp.height / 2),
        view,
        ty: f.ty,
        i,
        mv: s.mv
      });
    }
    sh.sort((a, b) => b.far - a.far);
    for (const q of sh) {
      const sw = q.sp.width, sh2 = q.sp.height, sd = pix(q.sp, 0, 0, sw, sh2), a = ALPHA(q.far);
      for (let yy = 0; yy < sh2; yy++) {
        const Y = q.y + yy - ry;
        if (Y < 0 || Y >= rh) continue;
        for (let xx = 0; xx < sw; xx++) {
          const s = (yy * sw + xx) * 4;
          if (sd[s + 3] < 128) continue;
          const X = q.x + xx - rx;
          if (X < 0 || X >= rw) continue;
          const o = (Y * rw + X) * 4, g = gl[o + 3] * gk;
          let r = sd[s], gg = sd[s + 1], b = sd[s + 2];
          if (g > 0) {
            r += (gl[o] - r) * g;
            gg += (gl[o + 1] - gg) * g;
            b += (gl[o + 2] - b) * g;
          }
          D[o] = D[o] + (r - D[o]) * a;
          D[o + 1] = D[o + 1] + (gg - D[o + 1]) * a;
          D[o + 2] = D[o + 2] + (b - D[o + 2]) * a;
        }
      }
    }
    const span = W.y1 - W.y0 + 7, n = G.side ? 4 : Math.round(span / 4), sd = e.seed % 97, bub = [], bc3 = bubRgb(off), ba = ALPHA(G.bfar);
    for (let k = 0; k < n; k++) {
      const spd = 8.5 + (k * .37 + sd * .01) % .6, yy = W.y1 - Math.floor((t * spd + k * span / n + (k * 7 + sd) % 3 * .6 + sd) % span);
      if (yy < W.y0) continue;
      const xx = G.bx + ((yy >> 1) + k & 1), o = ((yy - ry) * rw + (xx - rx)) * 4;
      for (let q = 0; q < 3; q++) D[o + q] = D[o + q] + (bc3[q] - D[o + q]) * ba;
      bub.push([ xx, yy ]);
    }
    e.x.putImageData(e.img, rx, ry);
    e.last = {
      fish: sh.map(q => ({
        i: q.i,
        x: q.x,
        y: q.y,
        w: q.sp.width,
        h: q.sp.height,
        view: q.view,
        ty: q.ty,
        mv: q.mv,
        far: Math.round(q.far * 100) / 100
      })),
      bub,
      t
    };
  }
  const ents = new WeakMap;
  TF.entry = p => ents.get(p) || null;
  TF.geo = geo;
  TF.draw = function(ctx, p, s, x, y, now) {
    if (!TF.on || !p || p.lift || !s || !s.c || !A.TANK || ctx.globalCompositeOperation === "destination-out") return;
    const rot = A.noRot(p.kind) ? 0 : (p.rot | 0) & 3, v = p.v | 0, col = p.col || null;
    let e = ents.get(p);
    if (!e || e.src !== s.c || e.rot !== rot || e.v !== v || e.col !== col) {
      if (modded(s.c)) return;
      const G = geo(p.kind, rot, s.c);
      if (!G) return;
      const bc = bare(p.kind, v, col, rot);
      if (!bc || bc.width !== s.c.width || bc.height !== s.c.height) return;
      const fid = p.furn && p.furn.id != null ? p.furn.id : Math.round(p.x * 7 + p.y * 131), c = A.mk(s.c.width, s.c.height);
      e = {
        src: s.c,
        rot,
        v,
        col,
        G,
        bc,
        list: fishOf(p.kind, fid),
        off: v >= (U && U.OFFV || 1e3),
        c,
        x: c.getContext("2d"),
        fr: -1,
        seed: SX.hash(p.kind + ":" + fid)
      };
      ents.set(p, e);
    } else if (SX.mods && SX.mods.tex && SX.mods.tex.length && modded(s.c)) return;
    const t = TF.time(), fr = Math.floor(t * TF.STEP), G = e.G;
    if (e.fr !== fr) {
      build(e, G, e.list, t, e.off, e.bc);
      e.fr = fr;
    }
    ctx.drawImage(e.c, G.rx, G.ry, G.rw, G.rh, x + G.rx, y + G.ry, G.rw, G.rh);
    if (p.hl) {
      ctx.save();
      ctx.globalAlpha = .22 + Math.sin(now * 6) * .08;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(e.c, G.rx, G.ry, G.rw, G.rh, x + G.rx, y + G.ry, G.rw, G.rh);
      ctx.restore();
    }
  };
})(window.SX);
