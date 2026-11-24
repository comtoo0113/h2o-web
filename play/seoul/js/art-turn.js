"use strict";

(function(SX) {
  const A = SX.art, TN = SX.turn = {};
  const W = 32, H = 44, CX = 16, HIP = 29, OP = 150;
  TN.MAX = 3200;
  TN.N = 3;
  TN.NH = 2;
  TN.YAW = 30;
  const HEAD = 17;
  TN.KS = .45;
  const cache = A.keyMap ? A.keyMap(new Map, "turn:") : new Map;
  const opq = (d, x, y) => x >= 0 && x < W && y >= 0 && y < H && d[(y * W + x) * 4 + 3] > OP;
  function spans(test) {
    const out = [];
    let s = -1;
    for (let x = 0; x <= W; x++) {
      const o = x < W && test(x);
      if (o && s < 0) s = x;
      if (!o && s >= 0) {
        out.push([ s, x - 1 ]);
        s = -1;
      }
    }
    return out;
  }
  function comps(F, S, B, y) {
    const us = spans(F ? x => opq(F, x, y) : x => opq(B, W - 1 - x, y)), ws = spans(x => opq(S, x, y)), out = [];
    for (const [a0, a1] of us) for (const [b0, b1] of ws) out.push({
      uc: (a0 + a1 + 1) / 2 - CX,
      a: (a1 - a0 + 1) / 2,
      wc: (b0 + b1 + 1) / 2 - CX,
      b: (b1 - b0 + 1) / 2,
      sy: y,
      n: y < HEAD ? TN.NH : TN.N
    });
    return out;
  }
  const fval = (c, u, w) => {
    const p = Math.abs(u - c.uc) / c.a, q = Math.abs(w - c.wc) / c.b;
    return (c.n === 2 ? p * p + q * q : p * p * p + q * q * q) - 1;
  };
  function build(spec, k, fr, pose, yaw) {
    const raw = (d, f) => A.charRawPx(spec, d, f, pose);
    const F = k === 0 ? raw(0, fr) : null, S = raw(1, fr), B = k === 1 ? raw(2, fr) : null;
    const F0 = F && fr ? raw(0, 0) : F, S0 = fr ? raw(1, 0) : S, B0 = B && fr ? raw(2, 0) : B;
    if (yaw == null) yaw = TN.YAW;
    const th = (k === 0 ? 1 : -1) * (90 - yaw) * Math.PI / 180, sn = Math.sin(th), cs = Math.cos(th);
    const step = [ 0, 1, 0, -1 ][fr % 4];
    const rows = [];
    for (let y = 0; y < H; y++) rows.push([]);
    for (let y = 0; y < H; y++) {
      if (y < HIP) {
        for (const c of comps(F, S, B, y)) {
          c.src = 0;
          rows[y].push(c);
        }
        continue;
      }
      for (const c of comps(F0, S0, B0, y)) {
        const side = c.uc > .6 ? 1 : c.uc < -.6 ? -1 : 0;
        const fwd = side * step, lift = fwd > 0 ? 2 : 0;
        if (side) c.b = Math.min(c.b, Math.max(c.a, 3));
        c.wc += fwd * 3;
        c.src = 1;
        const oy = y - lift;
        if (oy >= HIP) rows[oy].push(c);
      }
    }
    for (const r of rows) for (const c of r) {
      c.x0 = c.uc * sn + c.wc * cs;
      c.d0 = -c.uc * cs + c.wc * sn;
      c.ex = c.a * Math.abs(sn) + c.b * Math.abs(cs);
      c.ed = c.a * Math.abs(cs) + c.b * Math.abs(sn);
    }
    const out = new ImageData(W, H), od = out.data;
    for (let y = 0; y < H; y++) {
      const cs0 = rows[y];
      if (!cs0.length) continue;
      for (let X = 0; X < W; X++) {
        const xc = X + .5 - CX;
        let best = null, bd = -1e9;
        for (const c of cs0) {
          if (Math.abs(xc - c.x0) > c.ex + .01) continue;
          let lo = null, hi = c.d0 + c.ed + .5;
          for (let d = c.d0 + c.ed; d >= c.d0 - c.ed - .01; d -= .5) {
            if (fval(c, xc * sn - d * cs, xc * cs + d * sn) <= 0) {
              lo = d;
              break;
            }
            hi = d;
          }
          if (lo == null) continue;
          for (let t = 0; t < 4; t++) {
            const m = (lo + hi) / 2;
            if (fval(c, xc * sn - m * cs, xc * cs + m * sn) <= 0) lo = m; else hi = m;
          }
          if (lo > bd) {
            bd = lo;
            best = c;
          }
        }
        if (!best) continue;
        const c = best, u = xc * sn - bd * cs, w = xc * cs + bd * sn;
        const du = (u - c.uc) / c.a, dw = (w - c.wc) / c.b;
        const nu = (c.n === 2 ? du : du * Math.abs(du)) / c.a, nw = (c.n === 2 ? dw : dw * Math.abs(dw)) / c.b;
        const TF = c.src ? F0 : F, TS_ = c.src ? S0 : S, TB = c.src ? B0 : B, sy = c.sy;
        const sideOk = k === 0 ? dw < .15 : dw > -.15 && (y >= HEAD || dw < .4);
        const xf = Math.floor(u + CX);
        const cand = [ [ TF ? nw : -9, TF, xf ], [ TB ? -nw : -9, TB, W - 1 - xf ], [ sideOk ? Math.abs(nu) * TN.KS : -9, TS_, Math.floor(w + CX) ] ].filter(q => q[1]).sort((p, q) => q[0] - p[0]);
        let ci = -1, T = null;
        for (const [, T1, sx] of cand) {
          if (opq(T1, sx, sy)) {
            ci = (sy * W + sx) * 4;
            T = T1;
            break;
          }
        }
        if (ci < 0) {
          const [, T1, sx] = cand[0];
          for (let r = 1; r < 6 && ci < 0; r++) for (const xx of [ sx - r, sx + r ]) if (opq(T1, xx, sy)) {
            ci = (sy * W + xx) * 4;
            T = T1;
            break;
          }
        }
        if (ci < 0) continue;
        const o = (y * W + X) * 4;
        od[o] = T[ci];
        od[o + 1] = T[ci + 1];
        od[o + 2] = T[ci + 2];
        od[o + 3] = 255;
      }
    }
    const body = A.mk(W, H);
    body.getContext("2d").putImageData(out, 0, 0);
    const c = A.mk(W, H), P = new A.Pen(c.getContext("2d"));
    P.shadow(16, 41, 9, 3, .4);
    P.x.drawImage(body, 0, 0);
    return A.outline(c, A.charLine(spec));
  }
  const keyOf = (spec, q, fr, pose) => (spec.key || JSON.stringify(spec)) + ":" + q + ":" + fr + ":" + pose;
  TN.char = function(spec, q, fr, pose) {
    pose = pose || "walk";
    fr = (fr | 0) & 3;
    const key = keyOf(spec, q, fr, pose);
    let c = cache.get(key);
    if (c) return c;
    c = q === 0 || q === 1 ? build(spec, q, fr, pose) : A.flipX(TN.char(spec, q === 2 ? 1 : 0, fr, pose));
    cache.set(key, c);
    if (cache.size > TN.MAX) cache.delete(cache.keys().next().value);
    return c;
  };
  TN.charA = function(spec, va, fr, pose) {
    pose = pose || "walk";
    fr = (fr | 0) & 3;
    va = (Math.round(va) % 360 + 360) % 360;
    const Y = TN.YAW;
    if (va === Y || va === 180 - Y || va === 180 + Y || va === 360 - Y) return TN.char(spec, va === Y ? 0 : va === 180 - Y ? 1 : va === 180 + Y ? 2 : 3, fr, pose);
    if (va % 90 === 0) return A.char(spec, va / 90 === 0 ? 0 : va / 90 === 1 ? 1 : va / 90 === 2 ? 2 : 3, fr, pose);
    const key = keyOf(spec, "a" + va, fr, pose);
    let c = cache.get(key);
    if (c) return c;
    c = va < 90 ? build(spec, 0, fr, pose, va) : va < 180 ? build(spec, 1, fr, pose, 180 - va) : A.flipX(TN.charA(spec, 360 - va, fr, pose));
    cache.set(key, c);
    if (cache.size > TN.MAX) cache.delete(cache.keys().next().value);
    return c;
  };
  TN._build = build;
  TN.BUDGET = 3;
  let winT = 0, spent = 0, estB = 2;
  TN.stat = {
    n: 0,
    ms: 0,
    maxWin: 0,
    est: 2
  };
  const tick = () => {
    const now = performance.now();
    if (now - winT > 14) {
      winT = now;
      spent = 0;
    }
    return now;
  };
  const canBuild = cap => spent === 0 ? cap > 0 : spent + estB <= cap;
  const timed = fn => {
    const t0 = performance.now(), r = fn(), d = performance.now() - t0;
    spent += d;
    if (d > .3) TN.stat.est = estB = estB * .8 + d * .2;
    TN.stat.n++;
    TN.stat.ms += d;
    if (spent > TN.stat.maxWin) TN.stat.maxWin = spent;
    return r;
  };
  TN.get = function(spec, q, fr, pose) {
    pose = pose || "walk";
    fr = (fr | 0) & 3;
    const c = cache.get(keyOf(spec, q, fr, pose));
    if (c) return c;
    tick();
    if (!canBuild(TN.BUDGET)) return null;
    return timed(() => TN.char(spec, q, fr, pose));
  };
  TN.clear = () => {
    cache.clear();
    done.clear();
    wq.clear();
  };
  TN.size = () => cache.size;
  TN.SMOOTH = true;
  TN.RATE = {
    player: [ 40, 900 ],
    peer: [ 24, 600 ],
    other: [ 16, 360 ],
    npc: [ 6, 110 ]
  };
  TN.STEP_FULL = 15;
  TN.STEP_ENEMY = 30;
  TN.WARM = true;
  const n360 = v => (v % 360 + 360) % 360;
  const vaQ = q => [ TN.YAW, 180 - TN.YAW, 180 + TN.YAW, 360 - TN.YAW ][q & 3];
  const qOf = v => {
    const Y = TN.YAW;
    return v === Y ? 0 : v === 180 - Y ? 1 : v === 180 + Y ? 2 : v === 360 - Y ? 3 : -1;
  };
  TN.vaQ = vaQ;
  const angCache = new Map;
  const angsOf = st => {
    const k = st + ":" + TN.YAW;
    let L = angCache.get(k);
    if (!L) {
      const s = new Set([ 0, 1, 2, 3 ].map(vaQ));
      for (let v = 0; v < 360; v += st) s.add(v);
      L = [ ...s ].sort((a, b) => a - b);
      angCache.set(k, L);
    }
    return L;
  };
  const cdist = (a, b) => {
    const d = Math.abs(n360(a - b));
    return Math.min(d, 360 - d);
  };
  TN.getA = function(spec, va, fr, pose) {
    pose = pose || "walk";
    fr = (fr | 0) & 3;
    va = n360(Math.round(va));
    if (va % 90 === 0) return A.char(spec, va / 90, fr, pose);
    const q = qOf(va);
    if (q >= 0) return TN.get(spec, q, fr, pose);
    const c = cache.get(keyOf(spec, "a" + va, fr, pose));
    if (c) return c;
    if (va > 180 && cache.get(keyOf(spec, "a" + (360 - va), fr, pose))) return TN.charA(spec, va, fr, pose);
    tick();
    if (!canBuild(TN.BUDGET)) return null;
    return timed(() => TN.charA(spec, va, fr, pose));
  };
  TN.shAt = function(va) {
    const PO = SX.pose;
    va = n360(va);
    const L = va > 180, v = L ? 360 - va : va, Y = TN.YAW;
    const f = PO.shoulders(0), s = PO.shoulders(1), b = PO.shoulders(2), q0 = PO.shouldersQ(0), q1 = PO.shouldersQ(1);
    const K = [ [ 0, f.near, f.far ], [ Y, q0.near, q0.far ], [ 90, s.near, s.far ], [ 180 - Y, q1.near, q1.far ], [ 180, b.far, b.near ] ];
    let i = 0;
    while (i < K.length - 2 && v > K[i + 1][0]) i++;
    const k0 = K[i], k1 = K[i + 1], t = (v - k0[0]) / (k1[0] - k0[0]);
    const lp = (p, q) => {
      const x = Math.round(p[0] + (q[0] - p[0]) * t), y = Math.round(p[1] + (q[1] - p[1]) * t);
      return [ L ? -1 - x : x, y ];
    };
    return {
      near: lp(k0[1], k1[1]),
      far: lp(k0[2], k1[2])
    };
  };
  const catOf = v => v <= 52.5 || v >= 307.5 ? 0 : v < 127.5 ? 1 : v <= 232.5 ? 2 : 3;
  TN.catOf = catOf;
  const done = new Set, wq = new Map;
  let wSch = false;
  const ric = typeof requestIdleCallback === "function" ? requestIdleCallback : f => setTimeout(() => f({
    didTimeout: true,
    timeRemaining: () => 0
  }), 50);
  function nextMissing(spec, T, fr, pose, st) {
    const L = angsOf(st).slice().sort((a, b) => cdist(a, T) - cdist(b, T));
    for (const v0 of L) {
      if (v0 % 90 === 0) continue;
      const v = v0 > 180 ? 360 - v0 : v0, q = qOf(v);
      if (!cache.get(q >= 0 ? keyOf(spec, q, fr, pose) : keyOf(spec, "a" + v, fr, pose))) return [ v, q ];
    }
    return null;
  }
  function idle(dl) {
    wSch = false;
    let n = 0;
    while (wq.size && (dl.timeRemaining() > estB + 1 || dl.didTimeout && n === 0)) {
      const [dk, w] = wq.entries().next().value, m = nextMissing(w[0], w[1], w[2], w[3], w[4]);
      if (!m) {
        wq.delete(dk);
        done.add(dk);
        if (done.size > 4e3) done.clear();
        continue;
      }
      const t0 = performance.now();
      if (m[1] >= 0) TN.char(w[0], m[1], w[2], w[3]); else TN.charA(w[0], m[0], w[2], w[3]);
      const d = performance.now() - t0;
      if (d > .3) TN.stat.est = estB = estB * .8 + d * .2;
      TN.stat.n++;
      TN.stat.ms += d;
      TN.stat.idle = (TN.stat.idle || 0) + 1;
      n++;
    }
    if (wq.size) schedule();
  }
  const schedule = () => {
    if (wSch) return;
    wSch = true;
    ric(idle, {
      timeout: 500
    });
  };
  function warm(spec, T, fr, pose, st) {
    if (!TN.WARM) return;
    const dk = (spec.key || JSON.stringify(spec)) + ":" + fr + ":" + pose + ":" + st + ":" + T;
    if (done.has(dk) || wq.has(dk)) return;
    wq.set(dk, [ spec, T, fr, pose, st ]);
    if (wq.size > 48) wq.delete(wq.keys().next().value);
    schedule();
  }
  TN.warmDone = () => done.size;
  TN.ease = function(a, T, now, spec, fr, pose) {
    if (T == null || !TN.SMOOTH || !spec) {
      a._tv = a._tvG = a._tvT = null;
      return null;
    }
    const t0 = a._tvT, g0 = a._tvG, st = a.kind === "enemy" ? TN.STEP_ENEMY : TN.STEP_FULL;
    a._tvT = now;
    a._tvG = T;
    let s = a._tv;
    const dt = t0 == null ? -1 : now - t0;
    if (s == null || dt > .5 || dt < 0 || dt === 0 && T !== g0) s = a._tv = T; else if (dt > 0 && s !== T) {
      let d = n360(T - s + 180) - 180;
      if (Math.abs(d) > 179) d = cdist(s + 90, 0) <= cdist(s - 90, 0) ? 180 : -180;
      const R = TN.RATE[a.kind === "player" ? "player" : a.kind === "peer" ? "peer" : a.kind === "npc" ? "npc" : "other"], ad = Math.abs(d);
      const left = Math.min(ad * Math.exp(-R[0] * dt), ad - R[1] * dt);
      s = a._tv = left <= .01 ? T : n360(T - Math.sign(d) * left);
    }
    if (s === T) {
      warm(spec, T, fr | 0, pose, st);
      return null;
    }
    let p = T, best = 1e9;
    for (const v of angsOf(st)) {
      const dd = cdist(v, s);
      if (dd < best - 1e-9) {
        best = dd;
        p = v;
      }
    }
    if (p === T) return null;
    if (p % 90 === 0) return {
      dg: -1,
      dir: p / 90,
      tv: -1,
      spr: null
    };
    const q = qOf(p), spr = q >= 0 ? TN.get(spec, q, fr, pose) : TN.getA(spec, p, fr, pose);
    if (!spr) return null;
    return {
      dg: q,
      dir: catOf(p),
      tv: q >= 0 ? -1 : p,
      spr
    };
  };
})(window.SX);
