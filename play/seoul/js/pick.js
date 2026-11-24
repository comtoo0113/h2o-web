"use strict";

(function(SX) {
  const TS = SX.TS;
  const K = SX.pick = {
    DOOR_R: 2.3,
    NEAR: .35,
    RAY_MAX: 4,
    PAD_ANG: .6,
    PAD_RAY: 3.5,
    hov: null
  };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const MASK = new WeakMap, CELL = 4, ALPHA = 40;
  function maskOf(c) {
    let m = MASK.get(c);
    if (m) return m;
    const w = c.width, h = c.height, gw = Math.max(1, Math.ceil(w / CELL)), gh = Math.max(1, Math.ceil(h / CELL)), g = new Uint8Array(gw * gh);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    try {
      const d = c.getContext("2d").getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] < ALPHA) continue;
        g[(y / CELL | 0) * gw + (x / CELL | 0)] = 1;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    } catch (e) {
      x1 = -1;
    }
    if (x1 < 0) {
      x0 = 0;
      y0 = 0;
      x1 = w - 1;
      y1 = h - 1;
      g.fill(1);
    }
    m = {
      x0,
      y0,
      x1: x1 + 1,
      y1: y1 + 1,
      g,
      gw,
      gh
    };
    MASK.set(c, m);
    return m;
  }
  function maskHit(k, wx, wy) {
    const m = k.m, cx = Math.floor((wx - k.ox) * TS / CELL), cy = Math.floor((wy - k.oy) * TS / CELL);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = cx + dx, Y = cy + dy;
      if (X >= 0 && Y >= 0 && X < m.gw && Y < m.gh && m.g[Y * m.gw + X]) return true;
    }
    return false;
  }
  K.propBox = function(pr) {
    const x = pr.px != null ? pr.px : pr.x, y = pr.py != null ? pr.py : pr.y;
    if (pr.kind === "loot") return [ pr.x + .05, pr.y + .1, pr.x + .95, pr.y + 1 ];
    if (pr.kind === "corpse" && pr.body) {
      const l = pr._lay, cx = x + .5 + (l && l.sx || 0), cy = y + .5 + (l && l.sy || 0);
      return [ cx - .8, cy - .75, cx + .8, cy + .45 ];
    }
    const A = SX.art, s = A && A.propBase ? A.propBase(pr.kind, pr.v, pr.col, pr.rot) : null;
    if (s && s.c && s.c.width && s.c.height) {
      const m = maskOf(s.c), ox = x + (s.ox || 0) / TS, oy = y + (s.oy || 0) / TS, b = [ ox + m.x0 / TS, oy + m.y0 / TS, ox + m.x1 / TS, oy + m.y1 / TS ];
      b.mk = {
        m,
        ox,
        oy
      };
      return b;
    }
    return [ x, y - .6, x + (pr.w || 1), y + (pr.h || 1) ];
  };
  K.on = (b, x, y) => inBox(b, x, y) && (!b.mk || maskHit(b.mk, x, y));
  K.manBox = (x, y) => [ x - .45, y - 1.6, x + .45, y + .1 ];
  K.doorBox = d => d.horiz ? [ d.x, d.y - .75, d.x + d.len, d.y + 1 ] : [ d.x, d.y - .75, d.x + 1, d.y + d.len ];
  function losTile(F, ax, ay, bx, by) {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 4));
    for (let k = 1; k <= n; k++) {
      const t = k / n, x = Math.floor(ax + (bx - ax) * t), y = Math.floor(ay + (by - ay) * t);
      if (F.opaqueTile ? F.opaqueTile(x, y) : F.opaque(x, y)) return false;
    }
    return true;
  }
  K.doorDist = function(F, p, d) {
    const w = d.horiz ? d.len : 1, h = d.horiz ? 1 : d.len, bx = p.x, by = p.y - .2;
    const dist = Math.hypot(bx - clamp(bx, d.x, d.x + w), by - clamp(by, d.y, d.y + h));
    if (dist > K.DOOR_R) return Infinity;
    if (dist <= .75) return dist;
    const fy = p.y - .05;
    let ex, ey;
    if (d.horiz) {
      if (fy >= d.y && fy <= d.y + 1) {
        ey = fy;
        ex = p.x < d.x ? d.x - .05 : d.x + w + .05;
      } else {
        ex = clamp(p.x, d.x + .1, d.x + w - .1);
        ey = fy > d.y + .5 ? d.y + 1.05 : d.y - .05;
      }
    } else {
      if (p.x >= d.x && p.x <= d.x + 1) {
        ex = p.x;
        ey = fy < d.y ? d.y - .05 : d.y + h + .05;
      } else {
        ex = p.x > d.x + .5 ? d.x + 1.05 : d.x - .05;
        ey = clamp(fy, d.y + .1, d.y + h - .1);
      }
    }
    return losTile(F, p.x, fy, ex, ey) ? dist : Infinity;
  };
  const inBox = (b, x, y) => x >= b[0] && x < b[2] && y >= b[1] && y < b[3];
  const boxD = (b, x, y) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3]));
  function rayIn(b, ox, oy, ux, uy, len) {
    if (inBox(b, ox, oy)) return Infinity;
    let t0 = 0, t1 = len;
    for (let k = 0; k < 2; k++) {
      const o = k ? oy : ox, u = k ? uy : ux, lo = b[k], hi = b[k + 2];
      if (Math.abs(u) < 1e-9) {
        if (o < lo || o >= hi) return Infinity;
        continue;
      }
      let a = (lo - o) / u, c = (hi - o) / u;
      if (a > c) {
        const q = a;
        a = c;
        c = q;
      }
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
      if (t0 > t1) return Infinity;
    }
    return t0;
  }
  function ahead(c, b, h, hb) {
    if (!!c.rug !== !!h.rug) return !c.rug;
    if (Math.abs(b[3] - hb[3]) > .02) return b[3] > hb[3];
    return (b[2] - b[0]) * (b[3] - b[1]) < (hb[2] - hb[0]) * (hb[3] - hb[1]);
  }
  function rayPick(C, ox, oy, ux, uy, len, doors) {
    let best = null, bt = Infinity, bb = null;
    for (const c of C) {
      if (c.flat || doors && !c.t.door) continue;
      for (const b of c.b) {
        const t = rayIn(b, ox, oy, ux, uy, len);
        if (t < bt) {
          bt = t;
          best = c;
          bb = b;
        }
      }
    }
    return best ? {
      c: best,
      b: bb
    } : null;
  }
  K.choose = function(def, C, p, firm) {
    K.hov = null;
    if (!C || !C.length || !p) return def;
    const V = SX.view, pad = !!(SX.pad && SX.pad.on), ex = p.x, ey = p.y - .55;
    const dc = def ? C.find(c => c.t === def) : null, hold = !!firm || !!(dc && dc.flat && boxD(dc.b[0], p.x, p.y - .2) < .6);
    let pick = null, pb = null, on = false;
    if (!pad) {
      const mx = V.mouseWorldX, my = V.mouseWorldY;
      let hit = null, hb = null, near = null, nb = null, nd = K.NEAR;
      for (const c of C) for (const b of c.b) {
        if (K.on(b, mx, my)) {
          if (!hit || ahead(c, b, hit, hb)) {
            hit = c;
            hb = b;
          }
        } else if (!hit && !b.mk) {
          const d = boxD(b, mx, my);
          if (d < nd) {
            nd = d;
            near = c;
            nb = b;
          }
        }
      }
      if (hit) {
        pick = hit;
        pb = hb;
        on = true;
      } else if (near) {
        pick = near;
        pb = nb;
        on = true;
      } else {
        const L = Math.hypot(mx - ex, my - ey);
        if (!hold && L > .5 && L <= K.RAY_MAX) {
          const r = rayPick(C, ex, ey, Math.cos(p.aim), Math.sin(p.aim), L, true);
          if (r) {
            pick = r.c;
            pb = r.b;
          }
        }
      }
    } else if (!hold) {
      const ux = Math.cos(p.aim), uy = Math.sin(p.aim), r = rayPick(C, ex, ey, ux, uy, K.PAD_RAY);
      if (r) {
        pick = r.c;
        pb = r.b;
      } else {
        let ba = K.PAD_ANG;
        for (const c of C) {
          const b = c.b[0], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
          if (Math.hypot(cx - ex, cy - ey) < .3) continue;
          let a = Math.atan2(cy - ey, cx - ex) - p.aim;
          a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
          if (a < ba) {
            ba = a;
            pick = c;
            pb = b;
          }
        }
      }
    }
    if (!pick) return def;
    const one = C.length < 2;
    if (one && !on) return def;
    K.hov = {
      b: pb,
      t: pick.t
    };
    return pick.t;
  };
  K.draw = function(ctx, cam) {
    const h = K.hov;
    K.hov = null;
    if (!h || !ctx) return;
    const b = h.b, x0 = Math.round(b[0] * TS - cam.x) - 1, y0 = Math.round(b[1] * TS - cam.y) - 1, x1 = Math.round(b[2] * TS - cam.x), y1 = Math.round(b[3] * TS - cam.y);
    const L = Math.max(3, Math.min(6, Math.floor(Math.min(x1 - x0, y1 - y0) / 4)));
    ctx.save();
    ctx.globalAlpha = .55 + .15 * Math.sin(performance.now() / 280);
    for (const [col, o] of [ [ "rgba(0,0,0,0.6)", 1 ], [ "#f4ecd0", 0 ] ]) {
      ctx.fillStyle = col;
      for (const [cx, cy, sx, sy] of [ [ x0, y0, 1, 1 ], [ x1, y0, -1, 1 ], [ x0, y1, 1, -1 ], [ x1, y1, -1, -1 ] ]) {
        ctx.fillRect(sx > 0 ? cx + o : cx - L + 1 + o, cy + o, L, 1);
        ctx.fillRect(cx + o, sy > 0 ? cy + o : cy - L + 1 + o, 1, L);
      }
    }
    ctx.restore();
  };
})(window.SX);
