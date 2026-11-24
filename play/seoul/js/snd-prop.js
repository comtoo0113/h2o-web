"use strict";

(function(SX) {
  const P = SX.sndProp = {
    on: true
  };
  const INF = 1073741823, CAP = 600;
  const db2g = d => Math.pow(10, d / 20);
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const MAT = {
    conc: [ .015, .002, .001 ],
    glass: [ .06, .044, .011 ],
    wood: [ .07, .014, .005 ],
    door: [ .18, .06, .02 ],
    metal: [ .2, .025, .01 ],
    plaster: [ .056, .056, .004 ]
  };
  const CAT_L = {
    step: {
      floor: -20,
      det: 20,
      cut: false
    }
  };
  const CAT = {
    gun: {
      floor: -22,
      det: 12,
      cut: false
    },
    voice: {
      floor: -30,
      det: 20,
      cut: false
    },
    step: {
      floor: -44,
      det: 30,
      cut: true
    },
    item: {
      floor: -32,
      det: 20,
      cut: false
    },
    ui: {
      floor: -32,
      det: 20,
      cut: false
    }
  };
  const FLOOR = {
    up1: [ 700, -4 ],
    up2: [ 350, -14 ],
    down1: [ 500, -8 ],
    down2: [ 250, -18 ]
  };
  function solid(F, x, y) {
    if (!F.in(x, y)) return true;
    const T = SX.map.T, t = F.t[y * F.W + x];
    if (t === T.WALL || t === T.VOID || t === T.WINDOW) return true;
    if (t === T.DOOR) {
      const d = F.doorAt.get(y * F.W + x);
      return !d || !d.open;
    }
    return false;
  }
  function matName(F, x, y) {
    const T = SX.map.T, i = y * F.W + x, t = F.t[i];
    if (t === T.WINDOW) return "glass";
    if (t === T.DOOR) {
      const d = F.doorAt.get(i), m = d && SX.doorPlace && SX.doorPlace.mat ? SX.doorPlace.mat(F, d) : null;
      return m === "steel" || m === "rusty" || m === "heavy" ? "metal" : m === "glass" || m === "slide" ? "glass" : "door";
    }
    const TP = SX.texPlace, st = F.wst ? F.wst[i] : 0;
    if (TP && TP.W && st) {
      const W = TP.W;
      if (st === W.CORR || st === W.CONT || st === W.HOARD || st === W.CAR || st === W.SOFF) return "metal";
      if (st === W.WOODP) return "wood";
      if (st === W.STUD) return "plaster";
    }
    return "conc";
  }
  P.matName = matName;
  function matAt(F, x, y) {
    return MAT[matName(F, x, y)];
  }
  function clear(F, ax, ay, bx, by) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (solid(F, Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t))) return false;
    }
    return true;
  }
  function through(F, ax, ay, bx, by) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3), b = [ 1, 1, 1 ];
    let last = -1, walls = 0;
    for (let k = 1; k < n; k++) {
      const t = k / n, x = Math.floor(ax + (bx - ax) * t), y = Math.floor(ay + (by - ay) * t), i = y * F.W + x;
      if (i === last || !solid(F, x, y)) continue;
      last = i;
      walls++;
      const m = F.in(x, y) ? matAt(F, x, y) : MAT.conc;
      b[0] *= m[0];
      b[1] *= m[1];
      b[2] *= m[2];
    }
    return {
      b,
      walls
    };
  }
  function bandsToLp(b) {
    const r1 = b[1] / b[0], r2 = b[2] / b[0];
    return r1 < .5 ? 400 * Math.pow(2500 / 400, r1 / .5) : 2500 * Math.pow(15e3 / 2500, Math.min(1, r2 / .5));
  }
  let fF = null, fx = -1, fy = -1, fSig = -1, dist = null, anch = null, sigT = 0, sigF = null, sigV = 0;
  P.builds = 0;
  function doorSig(F) {
    const now = performance.now();
    if (sigF === F && now - sigT < 100) return sigV;
    let h = 0;
    const ds = F.doors || [];
    for (let k = 0; k < ds.length; k++) if (ds[k].open) h = h + Math.imul(k + 1, 2654435761) >>> 0;
    sigF = F;
    sigT = now;
    sigV = h;
    return h;
  }
  function build(F, lx, ly) {
    const W = F.W, N = W * F.H;
    if (!dist || dist.length !== N) {
      dist = new Int32Array(N);
      anch = new Int32Array(N);
    }
    dist.fill(INF);
    anch.fill(-1);
    const s = ly * W + lx, cx = lx + .5, cy = ly + .5;
    dist[s] = 0;
    anch[s] = s;
    const B = [];
    for (let k = 0; k < 15; k++) B.push([]);
    B[0].push(s);
    let cur = 0, left = 1;
    while (left > 0 && cur <= CAP) {
      const q = B[cur % 15];
      while (q.length) {
        const c = q.pop();
        left--;
        if (dist[c] !== cur) continue;
        const x = c % W, y = (c - x) / W, seen = anch[c] === c;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (solid(F, nx, ny)) continue;
          const dg = dx && dy;
          if (dg && (solid(F, x + dx, y) || solid(F, x, y + dy))) continue;
          const nd = cur + (dg ? 14 : 10), n = ny * W + nx;
          if (nd >= dist[n] || nd > CAP) continue;
          dist[n] = nd;
          anch[n] = seen ? clear(F, cx, cy, nx + .5, ny + .5) ? n : c : anch[c];
          B[nd % 15].push(n);
          left++;
        }
      }
      cur++;
    }
    P.builds++;
  }
  function field(F, L) {
    const lx = Math.floor(L.x), ly = Math.floor(L.y), sg = doorSig(F);
    if (F !== fF || lx !== fx || ly !== fy || sg !== fSig) {
      fF = F;
      fx = lx;
      fy = ly;
      fSig = sg;
      build(F, lx, ly);
    }
  }
  function roomVerb(F, L) {
    const i = F.i(Math.floor(L.x), Math.floor(L.y));
    if (!F.inside[i]) return 0;
    const r = F.room[i] >= 0 ? F.rooms[F.room[i]] : null;
    if (!r) return .3;
    return cl(.1 + (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) / 260, .15, .45);
  }
  const fz = (lv, f) => lv.parkIdx === f ? -1 : f;
  P.at = function(o, L, range, cat) {
    const Rd = SX.raid;
    if (!P.on || !Rd || !Rd.on || !Rd.level || !Rd.floor) return null;
    const F = Rd.floor();
    if (!F || !F.doorAt) return null;
    const lv = Rd.level, sf = o.f == null ? F.idx : o.f;
    if (sf !== F.idx) {
      const dz = fz(lv, sf) - fz(lv, F.idx), s = FLOOR[(dz > 0 ? "up" : "down") + (Math.abs(dz) === 1 ? 1 : 2)];
      return {
        k: db2g(s[1]),
        lp: s[0],
        pan: null,
        verb: .35,
        floor: dz
      };
    }
    const sx = o.x, sy = o.y, tx = Math.floor(sx), ty = Math.floor(sy), rv = roomVerb(F, L);
    if (!F.in(tx, ty) || clear(F, L.x, L.y, sx, sy)) return {
      k: 1,
      lp: 2e4,
      pan: null,
      verb: rv
    };
    const C = CAT_L[cat] || CAT[cat] || CAT.item, R = range || 30, direct = Math.hypot(sx - L.x, sy - L.y);
    const vol = d => Math.pow(Math.max(0, 1 - d / R), 1.6), v0 = vol(direct);
    if (v0 <= 0) return {
      k: 0,
      lp: 2e4,
      pan: null,
      verb: rv
    };
    const th = through(F, L.x, L.y, sx, sy), tg = Math.max(db2g(C.floor), (th.b[0] + th.b[1]) / 2);
    const lpT = Math.max(300, bandsToLp(th.b));
    field(F, L);
    let c = ty * F.W + tx;
    if (dist[c] >= INF) {
      let best = INF, bc = -1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!F.in(tx + dx, ty + dy)) continue;
        const n = (ty + dy) * F.W + tx + dx;
        if (dist[n] < best) {
          best = dist[n];
          bc = n;
        }
      }
      if (bc >= 0) c = bc;
    }
    let gp = 0, lpP = 2e4, panP = 0, path = null;
    if (dist[c] < INF) {
      path = dist[c] / 10;
      const ratio = cl((path - direct) / Math.max(direct, 1), 0, 1);
      if (!(C.cut && ratio >= 1)) gp = vol(path) / v0 * db2g(-C.det * ratio);
      lpP = Math.max(500, 2e4 * Math.pow(10, -C.det * 1.5 * ratio / 30));
      const a = anch[c] >= 0 ? anch[c] : c, ax = a % F.W + .5 - L.x, ay = Math.floor(a / F.W) + .5 - L.y, da = Math.hypot(ax, ay) || 1;
      panP = cl(ax / da * path / 14, -1, 1);
    }
    const eP = gp * gp, eT = tg * tg, e = eP + eT;
    if (e <= 0) return {
      k: 0,
      lp: 2e4,
      pan: null,
      verb: rv
    };
    const panT = cl((sx - L.x) / 14, -1, 1);
    return {
      k: Math.sqrt(e),
      lp: Math.exp((eP * Math.log(lpP) + eT * Math.log(lpT)) / e),
      pan: (eP * panP + eT * panT) / e,
      verb: Math.min(1, rv + .35),
      walls: th.walls,
      path
    };
  };
  const rMul = d => cl(1 + d / 40, 0, 1);
  let hF = null, hS = -1, hSig = -1, hCap = 0, hd = null;
  function hfield(F, sx, sy, cap) {
    const W = F.W, N = W * F.H, s = sy * W + sx, sg = doorSig(F);
    if (F === hF && s === hS && sg === hSig && cap <= hCap && hd && hd.length === N) return hd;
    if (!hd || hd.length !== N) hd = new Int32Array(N);
    hd.fill(INF);
    hd[s] = 0;
    hF = F;
    hS = s;
    hSig = sg;
    hCap = cap;
    const B = [];
    for (let k = 0; k < 15; k++) B.push([]);
    B[0].push(s);
    let cur = 0, left = 1;
    while (left > 0 && cur <= cap) {
      const q = B[cur % 15];
      while (q.length) {
        const c = q.pop();
        left--;
        if (hd[c] !== cur) continue;
        const x = c % W, y = (c - x) / W;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (solid(F, nx, ny)) continue;
          const dg = dx && dy;
          if (dg && (solid(F, x + dx, y) || solid(F, x, y + dy))) continue;
          const nd = cur + (dg ? 14 : 10), n = ny * W + nx;
          if (nd >= hd[n] || nd > cap) continue;
          hd[n] = nd;
          B[nd % 15].push(n);
          left++;
        }
      }
      cur++;
    }
    return hd;
  }
  P.hears = function(F, sx, sy, ex, ey, radius, cat) {
    const direct = Math.hypot(ex - sx, ey - sy);
    if (direct > radius) return false;
    if (!P.on || !F || !F.doorAt || !F.t || !cat) return true;
    const tx = Math.floor(sx), ty = Math.floor(sy);
    if (!F.in(tx, ty) || clear(F, ex, ey, sx, sy)) return true;
    const C = CAT[cat] || CAT.item;
    const th = through(F, sx, sy, ex, ey), tg = Math.max(db2g(C.floor), (th.b[0] + th.b[1]) / 2);
    if (direct <= radius * rMul(20 * Math.log10(tg))) return true;
    const D = hfield(F, tx, ty, Math.min(CAP, Math.ceil(radius * 10)));
    const qx = Math.floor(ex), qy = Math.floor(ey);
    let best = F.in(qx, qy) ? D[qy * F.W + qx] : INF;
    if (best >= INF) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!F.in(qx + dx, qy + dy)) continue;
      const v = D[(qy + dy) * F.W + qx + dx];
      if (v < best) best = v;
    }
    if (best >= INF) return false;
    const path = best / 10, ratio = cl((path - direct) / Math.max(direct, 1), 0, 1);
    if (C.cut && ratio >= 1) return false;
    return path <= radius * rMul(-C.det * ratio);
  };
  P._solid = solid;
  P._clear = clear;
})(window.SX);
