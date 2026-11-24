"use strict";

(function(SX) {
  const ART = SX.art;
  const PO = SX.pose = {};
  PO.shoulders = function(dir) {
    if (dir === 1) return {
      near: [ 0, -21 ],
      far: [ -2, -21 ]
    };
    if (dir === 3) return {
      near: [ -1, -21 ],
      far: [ 1, -21 ]
    };
    return {
      near: [ -8, -21 ],
      far: [ 7, -21 ]
    };
  };
  const SQ = [ {
    near: [ -7, -21 ],
    far: [ 6, -21 ]
  }, {
    near: [ 6, -21 ],
    far: [ -7, -21 ]
  }, {
    near: [ -7, -21 ],
    far: [ 6, -21 ]
  }, {
    near: [ 6, -21 ],
    far: [ -7, -21 ]
  } ];
  PO.shouldersQ = q => SQ[q & 3];
  const colCache = new Map;
  PO.colors = function(spec) {
    const key = spec && (spec.key || JSON.stringify(spec));
    let c = key && colCache.get(key);
    if (c) return c;
    const R = ART.ramp;
    if (spec && spec.custom) {
      const cu = spec.custom, v = cu.views[0];
      const pick = (x0, y0, x1, y1) => {
        const m = new Map;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const ci = v && v[y * 32 + x];
          if (ci) m.set(ci, (m.get(ci) || 0) + 1);
        }
        let best = 0, bn = 0;
        for (const [k, n] of m) if (n > bn) {
          bn = n;
          best = k;
        }
        return best ? cu.pal[best] : null;
      };
      const sleeve = pick(4, 20, 9, 27) || pick(22, 20, 27, 27) || "#55663a", hand = pick(4, 28, 9, 31) || pick(22, 28, 27, 31) || "#d9b38c";
      const Z = ART.ARM_ZONE || {
        front: {
          x0: 8,
          x1: 23,
          y0: 18
        },
        side: {
          x0: 13,
          x1: 19,
          y0: 19
        }
      }, cnt = new Map, S2 = cu.views[2] || v;
      const add = (w, x0, y0, x1, y1) => {
        if (w) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const ci = w[y * 32 + x];
          if (ci) cnt.set(ci, (cnt.get(ci) || 0) + 1);
        }
      };
      add(v, 0, Z.front.y0, Z.front.x0, 27);
      add(v, Z.front.x1, Z.front.y0, 31, 27);
      add(S2, Z.side.x0, Z.side.y0, Z.side.x1, 27);
      const lum = h => {
        const q = rgb(h);
        return (.299 * q[0] + .587 * q[1] + .114 * q[2]) / 255;
      };
      const byN = [ ...cnt ].map(([ci, n]) => [ cu.pal[ci], n ]).filter(q => q[0] && lum(q[0]) > .06).sort((a, b) => b[1] - a[1]).map(q => q[0]), four = byN.slice(0, 4).sort((a, b) => lum(a) - lum(b));
      const own = four.length === 4 ? [ ART.shade(four[0], -.25), four[0], four[1], four[2], four[3], four[3] ] : null, base = byN[0] || sleeve;
      c = {
        up: own || R(base),
        low: own || R(base),
        hand: R(hand),
        line: ART.charLine(spec).col
      };
    } else {
      const top = spec && spec.top || "#55663a", skin = spec && spec.skin || "#d9b38c";
      c = {
        up: R(top),
        low: spec && spec.topStyle === "tee" ? R(skin) : R(top),
        hand: spec && spec.gloves ? R("#2a2a2e") : R(skin),
        line: ART.charLine(spec || {}).col
      };
    }
    if (key) {
      colCache.set(key, c);
      if (colCache.size > 400) colCache.delete(colCache.keys().next().value);
    }
    return c;
  };
  PO.UP = 6;
  PO.LOW = 6;
  PO.SUPPORT = 9;
  const B = 48, SCR = document.createElement("canvas");
  SCR.width = SCR.height = B;
  const SC = SCR.getContext("2d"), IMG = SC.createImageData(B, B), CELL = new Int16Array(B * B), DST = new Float32Array(B * B);
  const rgbCache = new Map;
  const rgb = hex => {
    let v = rgbCache.get(hex);
    if (!v) {
      const h = String(hex).replace("#", "");
      v = [ parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0 ];
      rgbCache.set(hex, v);
    }
    return v;
  };
  PO.elbow = function(sx, sy, hx, hy, out, outW, low) {
    const U = PO.UP, L = low || PO.LOW;
    let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy);
    if (d >= U + L - .2 || d < .01) return [ sx + dx * U / Math.max(d, .01) * (d ? 1 : 0), sy + (d ? dy * U / d : U) ];
    const a = (U * U - L * L + d * d) / (2 * d), h = Math.sqrt(Math.max(0, U * U - a * a)), ux = dx / d, uy = dy / d, mx = sx + ux * a, my = sy + uy * a;
    const c1 = [ mx - uy * h, my + ux * h ], c2 = [ mx + uy * h, my - ux * h ];
    const sc = c => c[1] - my + (outW == null ? .8 : outW) * (out || 0) * (c[0] - mx);
    return sc(c1) >= sc(c2) ? c1 : c2;
  };
  const armCache = new Map, colIds = new WeakMap, sprIds = new WeakMap;
  let colN = 0, sprN = 0, lastBox = null;
  const idOf = (m, o, nx) => {
    let v = m.get(o);
    if (!v) {
      v = nx();
      m.set(o, v);
    }
    return v;
  };
  PO.arm = function(ctx, sx, sy, hx, hy, col, far, o) {
    o = o || {};
    if (!o.cache || !o.spr) return armCore(ctx, sx, sy, hx, hy, col, far, o);
    const R = Math.round, E0 = o.elbow ? [ R(o.elbow[0]), R(o.elbow[1]) ] : null;
    sx = R(sx);
    sy = R(sy);
    hx = R(hx);
    hy = R(hy);
    const key = idOf(colIds, col, () => ++colN) + "|" + (far ? 1 : 0) + "|" + idOf(sprIds, o.spr, () => ++sprN) + "|" + (sx - o.sprX) + "," + (sy - o.sprY) + "|" + (o.lean | 0) + "|" + (hx - sx) + "," + (hy - sy) + "|" + (E0 ? E0[0] - sx + "," + (E0[1] - sy) : "a" + (o.out || 0) + "," + (o.outW == null ? "" : o.outW) + "," + (o.low || 0)) + "|" + (o.noHand ? 1 : 0);
    let q = armCache.get(key);
    if (!q) {
      const off = B >> 1, T = ART.mk(B, B), m = o.mask;
      armCore(T.getContext("2d"), off, off, hx - sx + off, hy - sy + off, col, far, Object.assign({}, o, {
        cache: false,
        elbow: E0 ? [ E0[0] - sx + off, E0[1] - sy + off ] : null,
        mask: m ? (x, y) => m(x - off + sx, y - off + sy) : null
      }));
      const bx = lastBox;
      let C = null;
      if (bx) {
        C = ART.mk(bx[2], bx[3]);
        C.getContext("2d").drawImage(T, bx[0], bx[1], bx[2], bx[3], 0, 0, bx[2], bx[3]);
      }
      q = {
        c: C,
        dx: bx ? bx[0] - off : 0,
        dy: bx ? bx[1] - off : 0
      };
      armCache.set(key, q);
      if (armCache.size > 4e3) armCache.delete(armCache.keys().next().value);
    }
    if (q.c) ctx.drawImage(q.c, sx + q.dx, sy + q.dy);
  };
  function armCore(ctx, sx, sy, hx, hy, col, far, o) {
    lastBox = null;
    const U = PO.UP, L = o.low || PO.LOW;
    let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy);
    if (!o.elbow && d > U + L) {
      const k = (U + L) / d;
      hx = sx + dx * k;
      hy = sy + dy * k;
    }
    const e = o.elbow || PO.elbow(sx, sy, hx, hy, o.out, o.outW, L);
    const ox = Math.round(sx) - (B >> 1), oy = Math.round(sy) - (B >> 1);
    CELL.fill(0);
    DST.fill(9);
    const put = (x, y, v) => {
      const rx = Math.round(x), ry = Math.round(y), dd = (x - rx) * (x - rx) + (y - ry) * (y - ry);
      x = rx - ox;
      y = ry - oy;
      if (x < 1 || y < 1 || x >= B - 1 || y >= B - 1) return;
      const i = y * B + x, p = v / 10 | 0, q = CELL[i] / 10 | 0;
      if (p > q || p === q && dd < DST[i]) {
        CELL[i] = v;
        DST[i] = dd;
      }
    };
    const seg = (x0, y0, x1, y1, part) => {
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len * 2)), ux = len ? (x1 - x0) / len : 0, uy = len ? (y1 - y0) / len : 1;
      let px = -uy, py = ux;
      if (px * -.7 + py * -.7 < 0) {
        px = -px;
        py = -py;
      }
      for (let k = 0; k <= n; k++) {
        const t = k / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
        for (let w = -1.5; w <= 1.5; w += .5) {
          const lv = w > 1.25 ? 4 : w > .25 ? 3 : w > -.75 ? 2 : 1;
          put(cx + px * w, cy + py * w, part * 10 + lv);
        }
      }
    };
    seg(sx, sy, e[0], e[1], 1);
    seg(e[0], e[1], hx, hy, 2);
    if (!o.noHand) {
      const hx0 = Math.round(hx) - 2, hy0 = Math.round(hy) - 1;
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 4; xx++) {
        const x = hx0 + xx - ox, y = hy0 + yy - oy;
        if (x > 0 && y > 0 && x < B - 1 && y < B - 1) CELL[y * B + x] = 30 + (yy === 0 ? 4 : yy === 1 ? xx < 3 ? 3 : 2 : 1);
      }
    }
    const D = IMG.data;
    D.fill(0);
    const f = far ? 1 : 0, pal = [ null, col.up, col.low, col.hand ];
    const outC = rgb(col.line || ART.OUTLINE.char);
    const bx0 = Math.max(1, Math.floor(Math.min(sx, e[0], hx)) - ox - 4), bx1 = Math.min(B - 2, Math.ceil(Math.max(sx, e[0], hx)) - ox + 4);
    const by0 = Math.max(1, Math.floor(Math.min(sy, e[1], hy)) - oy - 4), by1 = Math.min(B - 2, Math.ceil(Math.max(sy, e[1], hy)) - oy + 4);
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const i = y * B + x, v = CELL[i], j = i * 4;
      if (v) {
        const R = pal[v / 10 | 0], c = rgb(R[Math.max(0, v % 10 - f)]);
        D[j] = c[0];
        D[j + 1] = c[1];
        D[j + 2] = c[2];
        D[j + 3] = 255;
        continue;
      }
      if (!(CELL[i - 1] || CELL[i + 1] || CELL[i - B] || CELL[i + B])) continue;
      const onBody = o.mask && o.mask(x + ox, y + oy), nb = CELL[i - 1] || CELL[i + 1] || CELL[i - B] || CELL[i + B];
      const c = onBody ? rgb(pal[nb / 10 | 0][1]) : outC;
      D[j] = c[0];
      D[j + 1] = c[1];
      D[j + 2] = c[2];
      D[j + 3] = onBody ? 200 : 255;
    }
    if (bx1 < bx0 || by1 < by0) return;
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
    pixDraw(ctx, bx0, by0, bw, bh, ox + bx0, oy + by0);
    lastBox = [ ox + bx0, oy + by0, bw, bh ];
  }
  const PIX = new Map, D32 = new Uint32Array(IMG.data.buffer);
  function pixDraw(ctx, bx0, by0, bw, bh, dx, dy) {
    const bx1 = bx0 + bw, by1 = by0 + bh;
    let h = 2166136261 ^ bw * 977 + bh;
    for (let y = by0; y < by1; y++) {
      const r = y * B;
      for (let x = bx0; x < bx1; x++) h = Math.imul(h ^ D32[r + x], 16777619);
    }
    const key = bw + "x" + bh + ":" + (h >>> 0);
    let q = PIX.get(key), same = false;
    if (q) {
      same = true;
      const w = q.w;
      let k = 0;
      for (let y = by0; y < by1 && same; y++) {
        const r = y * B;
        for (let x = bx0; x < bx1; x++) if (w[k++] !== D32[r + x]) {
          same = false;
          break;
        }
      }
    }
    if (same) {
      PIX.delete(key);
      PIX.set(key, q);
      if (!q.c) {
        q.c = ART.mk(bw, bh);
        q.c.getContext("2d").putImageData(IMG, -bx0, -by0, bx0, by0, bw, bh);
      }
      ctx.drawImage(q.c, dx, dy);
      return;
    }
    if (!q) {
      const w = new Uint32Array(bw * bh);
      let k = 0;
      for (let y = by0; y < by1; y++) {
        const r = y * B;
        for (let x = bx0; x < bx1; x++) w[k++] = D32[r + x];
      }
      PIX.set(key, {
        w,
        c: null
      });
      if (PIX.size > 3e3) PIX.delete(PIX.keys().next().value);
    }
    SC.putImageData(IMG, 0, 0, bx0, by0, bw, bh);
    ctx.drawImage(SCR, bx0, by0, bw, bh, dx, dy, bw, bh);
  }
  PO.hand = function(ctx, x, y, col, far) {
    x = Math.round(x);
    y = Math.round(y);
    const R = col.hand, i = far ? 1 : 0;
    ctx.fillStyle = col.line || ART.OUTLINE.char;
    ctx.fillRect(x - 3, y - 2, 6, 5);
    ctx.fillStyle = R[4 - i];
    ctx.fillRect(x - 2, y - 1, 4, 1);
    ctx.fillStyle = R[3 - i];
    ctx.fillRect(x - 2, y, 3, 1);
    ctx.fillStyle = R[2 - i];
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillStyle = R[Math.max(0, 1 - i)];
    ctx.fillRect(x - 2, y + 1, 4, 1);
  };
  const foreCache = new Map;
  PO.foreOf = function(def, wp) {
    const k = def && def.name;
    if (k && foreCache.has(k)) return foreCache.get(k);
    let f;
    const cls = def && def.cls, short = def && (def.kind === "melee" || cls === "pistol" || cls === "revolver" || wp.c.width < 24);
    if (def && def.kind === "melee") {
      const two = SX.melee ? SX.melee.two(def) : /bat|sledge|club|hockey|shovel/.test(def.style || "");
      f = two ? {
        x: wp.gx + 5,
        y: wp.gy,
        two: true
      } : null;
    } else if (short) f = {
      x: wp.gx + 2,
      y: wp.gy + 1,
      two: true
    }; else {
      const W = wp.c.width, H = wp.c.height, x = Math.min(W - 4, wp.gx + Math.round((W - wp.gx) * .42));
      const d = wp.c.getContext("2d").getImageData(0, 0, W, H).data;
      let by = wp.gy;
      for (let y = H - 1; y >= 0; y--) if (d[(y * W + x) * 4 + 3] > 100) {
        by = y;
        break;
      }
      f = {
        x,
        y: Math.min(by, wp.gy + 1),
        two: true
      };
    }
    if (k) {
      foreCache.set(k, f);
      if (foreCache.size > 200) foreCache.delete(foreCache.keys().next().value);
    }
    return f;
  };
  const sm01 = x => {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
  };
  PO.stairStep = function(u, rise) {
    u = Math.max(0, Math.min(1, u));
    const lead = sm01(u / .6), trail = sm01((u - .4) / .6), body = (lead + trail) / 2;
    return {
      body: -Math.round(body * rise),
      front: -Math.round(lead * rise),
      back: -Math.round(trail * rise),
      bodyRaw: -body * rise
    };
  };
  PO.STAIR_RISE = 8;
  let stairSeq = 0;
  PO.stairBegin = function(a, n, sgn, z0, dur, wait) {
    if (!a) return null;
    return a.stairFx = {
      seq: ++stairSeq,
      n: Math.max(1, n | 0),
      sgn: sgn < 0 ? -1 : 1,
      z0: z0 || 0,
      dur: Math.max(.05, dur),
      t0: performance.now() / 1e3 + (wait || 0)
    };
  };
  PO.stairAt = function(a) {
    const S = a && a.stairFx;
    if (!S) return null;
    const e = performance.now() / 1e3 - S.t0;
    if (e > S.dur + 1) {
      a.stairFx = null;
      return null;
    }
    const f = Math.max(0, Math.min(1, e / S.dur)), s = f * S.n, k = Math.min(S.n, Math.floor(s)), u = k >= S.n ? 0 : s - k;
    const z = S.z0 + S.sgn * (k * PO.STAIR_RISE - PO.stairStep(u, PO.STAIR_RISE).bodyRaw);
    return {
      dy: -Math.round(z) || 0,
      fr: e >= 0 && f < 1 ? u < .5 ? 1 : 3 : null
    };
  };
  PO.stairPack = function(a) {
    const S = a && a.stairFx;
    if (!S) return null;
    const e = performance.now() / 1e3 - S.t0;
    if (e > S.dur + 1) return null;
    return [ S.seq, S.n, S.sgn, S.z0, Math.round(S.dur * 1e3) / 1e3, Math.round(e * 1e3) / 1e3 ];
  };
  PO.stairUnpack = function(g, sf) {
    if (!g) return;
    if (!Array.isArray(sf) || sf.length < 6) {
      g.stairFx = null;
      return;
    }
    if (g.stairFx && g.stairFx.seq === sf[0]) return;
    g.stairFx = {
      seq: sf[0],
      n: Math.max(1, Math.min(8, sf[1] | 0)),
      sgn: sf[2] < 0 ? -1 : 1,
      z0: Math.max(-64, Math.min(64, +sf[3] || 0)),
      dur: Math.max(.05, Math.min(5, +sf[4] || .25)),
      t0: performance.now() / 1e3 - (+sf[5] || 0)
    };
  };
})(window.SX);
