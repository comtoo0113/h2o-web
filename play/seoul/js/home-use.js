"use strict";

(function(SX) {
  const U = SX.homeUse = {
    cur: null
  };
  const A = SX.art, TS = SX.TS;
  const FURN = SX.home.FURN;
  const SIT = [ "chair", "armchair", "sofa", "bench" ];
  const GYM = {
    treadmill: "st",
    barbell: "str",
    ropeMat: "run",
    punchBag: "hit"
  };
  const LIGHTS = Object.keys(FURN).filter(k => FURN[k].light && k !== "tv");
  for (const k of SIT) if (FURN[k] && !FURN[k].use) FURN[k].use = "sit";
  if (FURN.tv && !FURN.tv.use) FURN.tv.use = "tv";
  for (const k of LIGHTS) if (!FURN[k].use) FURN[k].use = "lamp";
  for (const k in GYM) if (FURN[k] && !FURN[k].use) FURN[k].use = "hgym";
  const ROLES = new Set([ "sit", "tv", "lamp", "hgym", "fan" ]);
  U.has = role => ROLES.has(role);
  U.SIT = SIT;
  U.GYM = GYM;
  U.LIGHTS = LIGHTS;
  const live = f => SX.home.live ? SX.home.live(f) : f;
  U.tvOn = f => !!(f && f.tvOn);
  U.lit = function(p) {
    const f = p && p.furn ? live(p.furn) : null;
    if (!f) return true;
    return p.kind === "tv" ? U.tvOn(f) : !f.off;
  };
  U.EGG_SECS = 73 * 60;
  U.EGG_FRAC = 1e-5;
  U.eggRate = () => (SX.ui && SX.ui.GYM_STEP || .1) * U.EGG_FRAC / U.EGG_SECS;
  U.eggFlush = function() {
    const c = U.cur;
    if (!c || !c.stat || !(c.pend > 0)) return 0;
    const s = SX.game.save;
    if (!s) return 0;
    const b = s.body || (s.body = {
      st: 0,
      str: 0,
      run: 0,
      last: {}
    });
    const v0 = Math.max(0, Math.min(5, +b[c.stat] || 0)), add = c.pend * U.eggRate();
    c.pend = 0;
    if (v0 >= 5) return 0;
    b[c.stat] = Math.min(5, v0 + add);
    return add;
  };
  const SEAT0 = {
    chair: {
      xs: [ 16 ],
      hip: 16
    },
    armchair: {
      xs: [ 16 ],
      hip: 16
    },
    sofa: {
      xs: [ 20, 44 ],
      hip: 16
    }
  };
  const PART = {
    chair: {
      seat: 2,
      back: 3,
      sink: 1
    },
    armchair: {
      seat: 2,
      back: 1,
      sink: 1
    },
    sofa: {
      seat: 2,
      back: 1,
      sink: 1,
      n: 2
    },
    bench: {
      back: 5
    }
  };
  const NECK = 13;
  const geoC = new Map;
  U.seatGeo = function(kind, rot) {
    rot = (rot | 0) & 3;
    const key = kind + ":" + rot;
    if (geoC.has(key)) return geoC.get(key);
    const M = A.rotModel && A.rotModel(kind), S = PART[kind];
    if (!M || !M._geo || !S) return null;
    const pad = M.pad == null ? 3 : M.pad;
    const bx = (G, q) => {
      const X = pad + Math.round(q.x * G.Wpx), td = q.src.noTop ? 0 : Math.max(0, Math.round(q.d * q.dpx)), fb = G.B - Math.round((1 - q.y - q.d) * G.Dpx) - q.z;
      return {
        x0: X,
        x1: X + Math.max(1, Math.round(q.w * G.Wpx)),
        y0: fb - q.hh - td,
        ym: fb - q.hh,
        y1: fb,
        d0: q.y,
        d1: q.y + q.d,
        cx: q.x + q.w / 2,
        cy: q.y + q.d / 2
      };
    };
    const seatOf = G => S.seat != null ? G.parts[S.seat] : G.parts.find(q => q.src.wood && q.z === 8);
    const G0 = M._geo(0), s0 = bx(G0, seatOf(G0)), b0 = bx(G0, G0.parts[S.back]);
    const turned = q => A.ROT.turn({
      x: q.cx,
      y: q.cy,
      w: 0,
      d: 0
    }, rot);
    const sc = turned(s0), bc = turned(b0), dx = sc.x - bc.x, dy = sc.y - bc.y;
    const dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 0 : 2;
    const G = M._geo(rot), sq = seatOf(G), seat = bx(G, sq), back = bx(G, G.parts[S.back]);
    const out = {
      kind,
      rot,
      dir,
      seat,
      back,
      front: [],
      B: G.B
    };
    if (rot === 1 || rot === 3) {
      const n = S.n || 1;
      out.depth = n === 1 ? [ seat.d0 + (seat.d1 - seat.d0) / 2 ] : [ .25, .75 ].map(t => seat.d0 + (seat.d1 - seat.d0) * t);
      for (const q of G.parts) {
        if (q === sq || q.src.cond) continue;
        const b = bx(G, q);
        if (b.d0 >= out.depth[0] - 1e-6 && b.x1 > b.x0) out.front.push([ b.x0 - 1, b.y0, b.x1 - b.x0 + 2, b.y1 - b.y0 + 2 ]);
      }
    }
    geoC.set(key, out);
    return out;
  };
  function backDepth(pl, dir) {
    try {
      const spec = SX.nvg ? SX.nvg.specOf(pl) : pl.spec, c = A.char(spec, dir, 0, "benchSit-na"), w = c.width, d = c.getContext("2d").getImageData(0, 15, w, 15).data;
      let a = w, b = -1;
      for (let i = 0; i < w * 15; i++) if (d[i * 4 + 3] > 0) {
        const x = i % w;
        if (x < a) a = x;
        if (x > b) b = x;
      }
      return b < 0 ? 6 : dir === 1 ? A.CHAR_OX - a : b - A.CHAR_OX;
    } catch (e) {
      return 6;
    }
  }
  U.seatsOf = function(p, who) {
    if (!p) return [];
    const rot = (p.rot | 0) & 3, dm = A.propDims(p.kind, rot), HIP = A.BSIT_HIP || 13, B = (p.y + dm.fh) * TS - 2;
    const yRow = p.y + dm.fh - .004;
    if (p.kind === "bench") {
      return [ 0, 1 ].map(k => SX.hub.seatOf(p, k)).filter(Boolean).map(s => {
        if (rot & 1) {
          s.y = yRow;
          s.front = 1;
        }
        return s;
      });
    }
    const S = PART[p.kind], g = U.seatGeo(p.kind, rot);
    if (!S || !g) return [];
    const top = p.y * TS - dm.up;
    const mk = (xpx, y, hip, at) => ({
      prop: p,
      x: xpx / TS,
      y,
      hop: Math.round(y * TS) - (hip + HIP),
      dir: g.dir,
      pose: "benchSit",
      at,
      hipX: xpx,
      hipY: hip
    });
    if (rot === 0) {
      const Z = SEAT0[p.kind];
      return Z.xs.map(xx => mk(p.x * TS + xx, p.y + dm.fh, B - Z.hip, null));
    }
    const s = g.seat;
    if (rot === 2) {
      const xs = (S.n || 1) === 1 ? [ (s.x0 + s.x1) / 2 ] : [ .25, .75 ].map(t => s.x0 + (s.x1 - s.x0) * t);
      const hip = Math.min(Math.round((s.y0 + s.ym) / 2) + S.sink, g.back.y0 + NECK);
      return xs.map(xx => mk(p.x * TS + Math.round(xx), p.y + dm.fh * .5, top + hip, null));
    }
    const pl = who || SX.actors.player, bd = backDepth(pl, g.dir), cx = (s.x0 + s.x1) / 2;
    const ax = g.dir === 1 ? Math.min(s.x1 - 3, Math.max(cx, g.back.x1 + bd - 1)) : Math.max(s.x0 + 3, Math.min(cx, g.back.x0 - bd + 1));
    const M = A.rotModel(p.kind), G = M._geo(rot), q = G.parts[S.seat], hy = dp => G.B - Math.round((1 - dp) * G.Dpx) - q.z - q.hh + S.sink;
    const hb = p.hit || {
      y0: p.y,
      y1: p.y + dm.fh
    };
    return g.depth.map(dp => Object.assign(mk(p.x * TS + Math.round(ax), yRow, top + hy(dp), {
      x: p.x + ax / TS,
      y: hb.y0 + (hb.y1 - hb.y0) * dp
    }), {
      front: 1
    }));
  };
  U.drawFront = function(ctx, cam, cut, who) {
    let c = U.cur, pl = SX.actors.player;
    if (who) {
      c = peerSit.get(who);
      pl = who;
      if (!c || !c.prop || who.bodyPose !== "benchSit") return;
    } else if (!c || c.kind !== "sit" || !c.prop) return;
    const p = c.prop, s = c.front ? A.prop(p.kind, p.v, p.col, p.rot) : null, g = s ? U.seatGeo(p.kind, p.rot) : null;
    if (s && g && g.front.length && !(!who && U.spinning())) {
      const x = Math.round(p.x * TS - cam.x), y = Math.round(p.y * TS - cam.y) + s.oy;
      for (const [fx, fy, fw, fh] of g.front) {
        const x0 = Math.max(0, fx), y0 = Math.max(0, fy), w = Math.min(s.c.width, fx + fw) - x0, h = Math.min(s.c.height, fy + fh) - y0;
        if (!(w > 0 && h > 0)) continue;
        const draw = q => q.drawImage(s.c, x0, y0, w, h, x + x0, y + y0, w, h);
        draw(ctx);
        if (cut) cut(x + x0, y + y0, w, h, draw);
      }
    }
    underTable(ctx, cam, cut, pl, p);
  };
  const TABLES = new Set([ "desk", "table", "diningTable", "coffeeTable", "counter", "prepCounter", "workbench", "vanity", "nightstand" ]);
  U.sideTables = function() {
    const c = U.cur, pl = SX.actors.player;
    if (!c || c.kind !== "sit" || !c.prop || !pl) return null;
    return sideOf(pl, c.prop);
  };
  function sideOf(pl, chair) {
    const F = SX.hub.level ? SX.hub.floor() : null;
    if (!F) return null;
    let out = null;
    for (const q of F.props) {
      if (!TABLES.has(q.kind) || q === chair || q.hidden || q.lift) continue;
      if (pl.y <= q.y + .3 || pl.y > q.y + q.h + .12) continue;
      if (pl.x < q.x - .9 || pl.x > q.x + q.w + .9) continue;
      (out || (out = new Set)).add(q);
    }
    return out;
  }
  U.sideRows = function() {
    let m = null;
    const add = (pl, chair) => {
      const s = sideOf(pl, chair);
      if (s) for (const q of s) {
        const r = Math.floor(pl.y);
        if (!m) m = new Map;
        if (!m.has(q) || r < m.get(q)) m.set(q, r);
      }
    };
    const c = U.cur, pl = SX.actors.player;
    if (c && c.kind === "sit" && c.prop && pl) add(pl, c.prop);
    for (const [g, r] of peerSit) if (r.prop && g.bodyPose === "benchSit") add(g, r.prop);
    return m;
  };
  const peerSit = new Map;
  const PEER_DX = 13;
  const peerKey = (F, g) => g.tx + "," + g.ty + "," + g.hop + "," + g.dir + "," + (F.ver | 0) + "," + F.props.length;
  const spun = (p, r) => Object.assign({}, p, {
    rot: r,
    hit: A.hitAt(A.propHit(p.kind, r), p.x, p.y)
  });
  function peerSeat(F, g) {
    const o = peerSit.get(g);
    if (o && o.F === F && o.key === peerKey(F, g)) return o;
    let best = null, bd = 1e9;
    for (const p of F.props) {
      if (!SIT.includes(p.kind) || p.hidden || p.lift || Math.abs(p.x + p.w / 2 - g.tx) > 3 || Math.abs(p.y + p.h / 2 - g.ty) > 3) continue;
      const r0 = (p.rot | 0) & 3, rots = SPIN.has(p.kind) ? [ r0, r0 + 1 & 3, r0 + 2 & 3, r0 + 3 & 3 ] : [ r0 ];
      for (const r of rots) for (const s of U.seatsOf(r === r0 ? p : spun(p, r), g)) {
        if (s.dir !== g.dir || s.hop !== g.hop || Math.abs(s.y - g.ty) > .02) continue;
        const dx = Math.abs(g.tx - s.x) * TS;
        if (dx > PEER_DX || dx >= bd) continue;
        bd = dx;
        best = {
          prop: p,
          rot: r,
          front: !!s.front,
          sx: s.x,
          sy: s.y
        };
      }
    }
    if (best) {
      g.tx = best.sx;
      g.ty = best.sy;
      if (Math.abs(g.x - g.tx) < .02 && Math.abs(g.y - g.ty) < .02) {
        g.x = g.tx;
        g.y = g.ty;
      }
    }
    const r = Object.assign(best || {
      prop: null
    }, {
      key: peerKey(F, g),
      F
    });
    peerSit.set(g, r);
    return r;
  }
  U.peers = function(F) {
    const list = F && SX.meet && SX.meet.seen ? SX.meet.seen() : [], want = new Map, mine = U.cur && U.cur.kind === "sit" ? U.cur.prop : null, V = SX.visit;
    for (const g of list) {
      if (g.bodyPose !== "benchSit") {
        peerSit.delete(g);
        continue;
      }
      const r = peerSeat(F, g);
      if (r.prop && SPIN.has(r.prop.kind) && r.prop !== mine && !want.has(r.prop)) want.set(r.prop, {
        rot: r.rot,
        g
      });
    }
    for (const g of [ ...peerSit.keys() ]) if (!list.includes(g) || g.bodyPose !== "benchSit") peerSit.delete(g);
    if (SX.home.deco) want.clear();
    for (const [p, w] of want) {
      if (w.rot === (p.rot | 0)) continue;
      const own = SX.hub.scene === "visit" && V && V.cur && w.g.pid === V.cur.owner;
      const np = SX.home.spinProp(F, p, w.rot, !own);
      if (np) {
        want.delete(p);
        want.set(np, w);
        const e = peerSit.get(w.g);
        if (e && e.prop === p) e.prop = np;
      }
    }
    for (const p of F.props) {
      if (!SPIN.has(p.kind) || !p.furn || want.has(p) || p === mine) continue;
      const f = live(p.furn);
      if (f && (f.rot | 0) !== (p.rot | 0)) SX.home.spinProp(F, p, f.rot | 0);
    }
  };
  U._peerSit = peerSit;
  const SPIN = new Set([ "chair" ]);
  U.SPIN = SPIN;
  U.spinnable = () => {
    const c = U.cur;
    return !!(c && c.kind === "sit" && c.prop && SPIN.has(c.prop.kind));
  };
  function spinFits(F, p, r) {
    const lv = SX.hub.level, T = SX.map.T, d = lv && lv.door;
    if (!lv || !SX.home.solidCells) return false;
    const cells = SX.home.solidCells(p.kind, p.x, p.y, r);
    return cells.every(([x, y]) => F.tile(x, y) === T.FLOOR) && !(d && SX.map.doorFrontHit(F, d, cells, SX.home.solidRects(p.kind, r), p.x, p.y));
  }
  U.spin = function(dirn) {
    const c = U.cur, F = SX.hub.level ? SX.hub.floor() : null, p = c && c.prop;
    if (!F || !p || !U.spinnable() || !p.furn) return false;
    const r = (((p.rot | 0) + (dirn > 0 ? 1 : -1)) % 4 + 4) % 4;
    if (!spinFits(F, p, r)) {
      SX.audio.play("denied", {
        vol: .5
      });
      return false;
    }
    const was = U.spinning(), a0 = c.angT != null ? c.angT : (p.rot | 0) * 90;
    if (!c.seat4) c.seat4 = seats4(p);
    const np = SX.home.spinProp(F, p, r);
    if (!np) return false;
    if (SX.hub.scene === "home") c.spinT = .8;
    const s = U.seatsOf(np)[0];
    if (!s) {
      c.prop = np;
      U.stop();
      return false;
    }
    Object.assign(c, {
      prop: np,
      x: s.x,
      y: s.y,
      dir: s.dir,
      hop: s.hop,
      pose: s.pose,
      front: !!s.front
    });
    if (!was) c.ang = a0;
    c.angT = a0 + (dirn > 0 ? 90 : -90);
    if (!was) SX.audio.play("chairSpin", {
      x: np.x + np.w / 2,
      y: np.y + np.h / 2
    });
    U.pose(SX.actors.player);
    return true;
  };
  const SPIN_STEP = 15, SPIN_MIN = 140, SPIN_K = 9;
  const ang360 = a => (a % 360 + 360) % 360;
  U.spinning = () => {
    const c = U.cur;
    return !!(c && c.kind === "sit" && c.angT != null && c.ang !== c.angT);
  };
  function seats4(p) {
    const r0 = (p.rot | 0) & 3;
    return [ 0, 1, 2, 3 ].map(r => U.seatsOf(r === r0 ? p : spun(p, r))[0] || null);
  }
  function spinTick(c, dt) {
    if (c.angT == null || c.ang === c.angT) return;
    const d = c.angT - c.ang, st = Math.max(SPIN_MIN, SPIN_K * Math.abs(d)) * dt;
    c.ang = Math.abs(d) <= st ? c.angT : c.ang + Math.sign(d) * st;
    if (c.ang === c.angT) {
      c.ang = c.angT = ang360(c.angT);
    }
  }
  function spinPose(p, c) {
    const S = c.seat4;
    if (!S || S.some(s => !s)) return false;
    const a = ang360(c.ang), r0 = Math.floor(a / 90) & 3, r1 = r0 + 1 & 3, t = (a - Math.floor(a / 90) * 90) / 90;
    const hp = s => [ s.x * TS, Math.round(s.y * TS) - s.hop ], h0 = hp(S[r0]), h1 = hp(S[r1]), hx = h0[0] + (h1[0] - h0[0]) * t, hy = h0[1] + (h1[1] - h0[1]) * t;
    const diag = t >= .25 && t <= .75, rs = t < .5 ? r0 : r1, d = S[rs].dir, back = diag ? r0 === 1 || r0 === 2 : d === 2;
    const y = back ? S[2].y : S[rs].y, L = SX.hub.POSE.lap;
    p.x = hx / TS;
    p.y = y;
    p.hop = Math.round(Math.round(y * TS) - hy);
    p.dir = d;
    p.aim = DIR_AIM[d];
    p.spinQ = diag ? r0 : -1;
    if (diag) {
      const sq = SX.pose && SX.pose.shouldersQ ? SX.pose.shouldersQ(r0) : {
        near: [ -7, -21 ],
        far: [ 6, -21 ]
      }, fx = r0 === 0 || r0 === 1 ? 3 : -3;
      p.armPose = {
        n: [ sq.near[0] + fx, -11 ],
        f: [ sq.far[0] + fx, -12 ]
      };
    } else p.armPose = L(d);
    return true;
  }
  U.netSeat = function(p) {
    const c = U.cur;
    if (!U.spinning() || p !== SX.actors.player) return null;
    return {
      x: c.x,
      y: c.y,
      dir: c.dir,
      hop: c.hop,
      aim: DIR_AIM[c.dir]
    };
  };
  U.spinImg = function(p) {
    const c = U.cur;
    if (!c || c.prop !== p || !U.spinning()) return null;
    const a = Math.round(ang360(c.ang) / SPIN_STEP) * SPIN_STEP % 360;
    if (a % 90 === 0) {
      const s = A.prop(p.kind, p.v, p.col, a / 90);
      return s ? {
        c: s.c,
        ox: 0,
        oy: s.oy
      } : null;
    }
    return {
      c: spinFrame(p.kind, p.v | 0, p.col, a),
      ox: -FR_MX,
      oy: -FR_UP
    };
  };
  const FR_MX = 8, FR_UP = 24, NARROW = {};
  const framesMade = new Set;
  function spinFrame(kind, v, col, deg) {
    const key = "spinF:" + kind + ":" + v + ":" + (col || "") + ":" + deg;
    framesMade.add(key);
    const M = A.rotModel(kind), W = 32 + FR_MX * 2, H = 32 + FR_UP;
    return A.cached(key, W, H, P => {
      const RP = A.ramp, B = H - 2, pad = M.pad == null ? 3 : M.pad, Wpx = 32 - pad * 2, Dpx = Math.max(2, Math.round(M.tpu == null ? 10 : M.tpu));
      const th = deg * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th), fa = Math.min(deg, 360 - deg), kf = Math.min(1, fa / 90), NW = NARROW[kind] || {};
      const rot = (u, w) => [ .5 + (u - .5) * cs + (w - .5) * sn, .5 - (u - .5) * sn + (w - .5) * cs ];
      const pj = (u, w, z) => [ FR_MX + pad + u * Wpx, B - (1 - w) * Dpx - z ];
      const base = typeof M.col === "function" ? M.col(col, v) : col || M.col || "#5a5a5a";
      const inPoly = (pts, x, y) => {
        let sg0 = 0;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
          if (Math.abs(cr) < 1e-9) continue;
          const sg = cr > 0 ? 1 : -1;
          if (!sg0) sg0 = sg; else if (sg !== sg0) return false;
        }
        return true;
      };
      const fill = (pts, colOf) => {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const [x, y] of pts) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
        const on = (x, y) => inPoly(pts, x + .5, y + .5);
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (on(x, y)) P.p(x, y, colOf(on(x, y - 1), on(x, y + 1)));
      };
      P.shadow(FR_MX + 16, B - 2, 12, 3, .4);
      const parts = M.parts.map((q, i) => {
        const k = NW[i] ? NW[i] + (1 - NW[i]) * kf : 1, cx = q.x + q.w / 2, hw = q.w / 2 * k;
        const cn = [ [ cx - hw, q.y ], [ cx + hw, q.y ], [ cx + hw, q.y + q.d ], [ cx - hw, q.y + q.d ] ].map(([u, w]) => rot(u, w)), vs = cn.map(p => p[1]);
        return {
          q,
          cn,
          v0: Math.min(...vs),
          v1: Math.max(...vs),
          z0: q.z || 0,
          z1: (q.z || 0) + (q.hh || 0)
        };
      });
      const behind = (a, b) => {
        const E = .001;
        if (a.v1 <= b.v0 + E) return -1;
        if (b.v1 <= a.v0 + E) return 1;
        if (a.z1 <= b.z0) return -1;
        if (b.z1 <= a.z0) return 1;
        return a.v1 - b.v1 || a.z0 - b.z0;
      };
      const order = [];
      for (const p of parts) {
        let i = order.length;
        while (i > 0 && behind(p, order[i - 1]) < 0) i--;
        order.splice(i, 0, p);
      }
      for (const p of order) {
        const q = p.q, hex = q.col ? typeof q.col === "function" ? q.col(base) : q.col : base, R = RP(hex);
        if (q.skipBox) {
          const hc = rot(q.x + q.w / 2, q.y + q.d / 2), hp = pj(hc[0], hc[1], 2), hx = Math.round(hp[0]), hy = Math.round(hp[1]);
          const legs = [ 0, 72, -72, 144, -144 ].map(a => {
            const r = a * Math.PI / 180;
            return rot(.5 + Math.sin(r) * .4, .55 - Math.cos(r) * .36);
          }).sort((e, f) => e[1] - f[1]);
          for (const e of legs) {
            const ep = pj(e[0], e[1], 1), ex = Math.round(ep[0]), ey = Math.round(ep[1]);
            P.thick(hx, hy, ex, ey, 2, ex < hx ? R[3] : R[2]);
            P.r(ex - 1, ey, 3, 2, "#16171a").p(ex - 1, ey, "#4a4d54");
          }
          P.r(hx - 3, hy - 2, 6, 3, R[3]).r(hx - 3, hy - 2, 6, 1, R[4]);
          continue;
        }
        const fi = q.boxo && q.boxo.fi || 2, cn = p.cn;
        for (let k = 0; k < 4; k++) {
          const a = cn[k], b = cn[(k + 1) % 4], nu = b[1] - a[1], nv = a[0] - b[0], ln = Math.hypot(nu, nv) || 1;
          if (nv / ln <= .02) continue;
          const sh = Math.max(1, Math.min(4, nu / ln < -.45 ? fi + 1 : nu / ln > .45 ? fi - 1 : fi));
          fill([ pj(a[0], a[1], p.z0), pj(b[0], b[1], p.z0), pj(b[0], b[1], p.z1), pj(a[0], a[1], p.z1) ], (up, dn) => dn ? R[sh] : R[sh - 1]);
        }
        if (!q.noTop) fill(cn.map(([u, w]) => pj(u, w, p.z1)), up => up ? R[4] : R[5]);
      }
    }, {
      mat: true
    });
  }
  U._spinFrame = (kind, v, col, deg) => spinFrame(kind, v | 0, col, deg);
  function warmSpin(c, pl) {
    const p = c.prop;
    if (!p) return;
    for (let a = SPIN_STEP; a < 360; a += SPIN_STEP) {
      if (a % 90 === 0) continue;
      const key = "spinF:" + p.kind + ":" + (p.v | 0) + ":" + (p.col || "") + ":" + a;
      if (!framesMade.has(key)) {
        spinFrame(p.kind, p.v | 0, p.col, a);
        break;
      }
    }
    if (SX.turn && SX.turn.get && pl && pl.spec) {
      const spec = SX.nvg ? SX.nvg.specOf(pl) : pl.spec;
      for (let q = 0; q < 4; q++) SX.turn.get(spec, q, 0, "benchSit-na");
    }
  }
  let tabCv = null;
  function tablePaint(q, s, now) {
    const M = 32, W = s.c.width + M * 2, H = s.c.height + M * 2;
    if (!tabCv || tabCv.width < W || tabCv.height < H) tabCv = A.mk(Math.max(W, tabCv ? tabCv.width : 0), Math.max(H, tabCv ? tabCv.height : 0));
    const g = tabCv.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, tabCv.width, tabCv.height);
    g.drawImage(s.c, M, M);
    if (q.furn && SX.top && SX.top.drawOn) SX.top.drawOn(g, q, M, M, now);
    return {
      c: tabCv,
      M
    };
  }
  function underTable(ctx, cam, cut, pl, chair) {
    const Tp = SX.top, side = pl ? sideOf(pl, chair) : null;
    if (!pl || !Tp || !Tp.geom || !side) return;
    const px = Math.round(pl.x * TS - cam.x), py = Math.round(pl.y * TS - cam.y), bx0 = px - 20, bx1 = px + 20, by0 = py - 60, by1 = py + 6;
    const hip = py - (pl.hop || 0) - (A.BSIT_HIP || 13), now = performance.now() / 1e3;
    for (const q of side) {
      const s = A.prop(q.kind, q.v, q.col, q.rot), g = Tp.geom(q.kind, q.rot);
      if (!s || !g || !g.top) continue;
      const x = Math.round(q.x * TS - cam.x), y = Math.round(q.y * TS - cam.y) + s.oy;
      const x0 = Math.max(0, bx0 - x), x1 = Math.min(s.c.width, bx1 - x), y0 = Math.max(Math.min(g.top.y + g.top.d, hip - y), by0 - y), y1 = Math.min(s.c.height, by1 - y);
      if (!(x1 > x0 && y1 > y0)) continue;
      const T = tablePaint(q, s, now), draw = k => k.drawImage(T.c, x0 + T.M, y0 + T.M, x1 - x0, y1 - y0, x + x0, y + y0, x1 - x0, y1 - y0);
      draw(ctx);
      if (cut) cut(x + x0, y + y0, x1 - x0, y1 - y0, draw);
    }
  }
  function gymSpot(F, p) {
    const k = p.kind, rot = (p.rot | 0) & 3, dm = A.propDims(k, rot);
    if (k === "treadmill") {
      const q = A.treadSpot ? A.treadSpot(p) : null;
      if (q) return {
        mode: q.side ? "run" : "jog",
        x: q.x,
        y: q.y,
        dir: q.dir
      };
      if (rot === 0) return {
        mode: "run",
        x: p.x + p.w * .4,
        y: p.y + p.h * .62,
        dir: 1
      };
      if (rot === 2) return {
        mode: "run",
        x: p.x + p.w * .6,
        y: p.y + p.h * .62,
        dir: 3
      };
      return {
        mode: "jog",
        x: p.x + p.w / 2,
        y: p.y + p.h * (rot === 1 ? .6 : .42),
        dir: rot === 1 ? 2 : 0
      };
    }
    if (k === "barbell") {
      if (rot === 0) return {
        mode: "press",
        x: p.x + 1.5,
        y: p.y + 1.9,
        dir: 0
      };
      const M = A.rotModel && A.rotModel(k), G = M && M._geo(rot), q = G && G.parts[3];
      if (!q) return null;
      const B = (p.y + dm.fh) * TS - 2, td = Math.round(q.d * q.dpx), fb = B - Math.round((1 - q.y - q.d) * G.Dpx), top = fb - q.z - q.hh, pad = M.pad == null ? 3 : M.pad;
      const cx = p.x * TS + pad + Math.round((q.x + q.w / 2) * G.Wpx), y = p.y + dm.fh, hip = top - Math.round(td / 2);
      return {
        mode: "curl",
        x: cx / TS,
        y,
        dir: 0,
        hop: Math.round(y * TS) - (hip + (A.BSIT_HIP || 13))
      };
    }
    if (k === "ropeMat") return {
      mode: "rope",
      x: p.x + p.w / 2,
      y: p.y + p.h / 2 + .3,
      dir: 0
    };
    if (k === "punchBag") {
      const r = {
        mode: "bag",
        x: p.x + 1.2,
        y: p.y + 1.12,
        dir: 3
      };
      if (!SX.actors.free(F, r.x, r.y) && SX.actors.free(F, p.x - .2, r.y)) {
        r.x = p.x - .2;
        r.dir = 1;
      }
      return r;
    }
    return null;
  }
  U.act = function(role, prop, f) {
    const F = SX.hub.floor(), p = SX.actors.player;
    if (!prop || !p || !F) return;
    f = f || live(prop.furn);
    if ((role === "tv" || role === "lamp" || role === "fan") && SX.motion && SX.motion.press) SX.motion.press(p, prop, role);
    if (role === "tv") {
      if (U.tvOn(f)) {
        delete f.tvOn;
        f.off = 1;
      } else {
        f.tvOn = 1;
        delete f.off;
      }
      if (SX.fanSpin && SX.fanSpin.mark) SX.fanSpin.mark(f, U.tvOn(f));
      SX.audio.play("lightSwitch", {
        x: prop.x + prop.w / 2,
        y: prop.y + prop.h / 2,
        vol: .8
      });
      SX.map.homeLights(F);
      F.ver = (F.ver || 0) + 1;
      U.labels(F);
      SX.game.persist();
      return;
    }
    if (role === "fan") {
      if (SX.fanSpin) SX.fanSpin.toggle(prop, f);
      return;
    }
    if (role === "lamp") {
      if (f.off) delete f.off; else f.off = 1;
      if (SX.fanSpin && SX.fanSpin.mark) SX.fanSpin.mark(f, !f.off);
      SX.audio.play("lightSwitch", {
        x: prop.x + prop.w / 2,
        y: prop.y + prop.h / 2
      });
      SX.map.homeLights(F);
      F.ver = (F.ver || 0) + 1;
      U.labels(F);
      SX.game.persist();
      return;
    }
    if (U.cur) U.stop();
    if (role === "sit") {
      let ss = U.seatsOf(prop);
      if (SX.hub.scene === "market") ss = ss.filter(s => !SX.hub.seatTaken(s));
      if (!ss.length) {
        SX.audio.play("denied");
        return;
      }
      const at = s => s.at || s;
      ss.sort((a, b) => Math.hypot(at(a).x - p.x, at(a).y - p.y) - Math.hypot(at(b).x - p.x, at(b).y - p.y));
      const s = ss[0];
      U.cur = {
        kind: "sit",
        prop,
        fid: f && f.id,
        fromX: p.x,
        fromY: p.y,
        x: s.x,
        y: s.y,
        dir: s.dir,
        hop: s.hop,
        pose: s.pose,
        hide: p.hideWeapon,
        front: !!s.front
      };
      SX.audio.play("rustle", {
        vol: .45,
        r: .85
      });
    } else if (role === "hgym") {
      const g = gymSpot(F, prop);
      if (!g) {
        SX.audio.play("denied");
        return;
      }
      U.cur = Object.assign({
        kind: "gym",
        prop,
        fid: f && f.id,
        stat: SX.hub.scene === "visit" ? null : GYM[prop.kind],
        fromX: p.x,
        fromY: p.y,
        anim: 0,
        walkT: 0,
        sndT: .6,
        pend: 0,
        flushT: 0,
        hide: p.hideWeapon,
        v0: prop.v
      }, g);
      if (g.mode === "press") prop.v = 1;
      SX.audio.play(g.mode === "press" || g.mode === "curl" ? "gymDumbbell" : "rustle", {
        vol: .5
      });
    } else return;
    p.reload = null;
    p.use = null;
    p.hideWeapon = true;
    p.moving = false;
    U.pose(p);
  };
  U.stop = function(quiet) {
    const c = U.cur;
    if (!c) return;
    if (c.kind === "gym") {
      U.eggFlush();
      if (c.mode === "press" && c.prop) c.prop.v = c.v0;
      if (SX.game.save) SX.game.persist();
    }
    if (c.spinT > 0 && SX.game.save) SX.game.persist();
    U.cur = null;
    const p = SX.actors.player;
    if (!p) return;
    p.bodyPose = null;
    p.armPose = null;
    p.hop = 0;
    p.squat = 0;
    p.frame = 0;
    p.hideWeapon = !!c.hide;
    p.spinQ = -1;
    const F = SX.hub.level ? SX.hub.floor() : null;
    let x = c.fromX, y = c.fromY;
    if (F && !SX.actors.free(F, x, y)) {
      let got = false;
      for (let r = .3; r < 3 && !got; r += .2) for (let k = 0; k < 16; k++) {
        const a = k / 16 * 6.283, qx = c.x + Math.cos(a) * r, qy = c.y + Math.sin(a) * r;
        if (SX.actors.free(F, qx, qy)) {
          x = qx;
          y = qy;
          got = true;
          break;
        }
      }
    }
    p.x = x;
    p.y = y;
    if (quiet !== true) SX.audio.play(c.kind === "sit" ? "reviveUp" : "gymBreath", {
      vol: .35
    });
  };
  U.selfTarget = function() {
    const c = U.cur, p = SX.actors.player;
    if (!c || !p) return null;
    return {
      kind: "homeUse",
      x: p.x,
      y: p.y - (c.kind === "sit" ? Math.max(1.7, ((p.hop || 0) + 46) / TS) : 1.7),
      label: c.kind === "sit" ? "일어나기" : "그만하기",
      more: U.spinnable() ? [ [ SX.pad && SX.pad.on ? "LB · RB" : "휠", "의자 돌리기" ] ] : null
    };
  };
  const DIR_AIM = [ Math.PI / 2, 0, -Math.PI / 2, Math.PI ];
  U.pose = function(p) {
    const c = U.cur;
    if (!c || !p) return;
    p.x = c.x;
    p.y = c.y;
    p.dir = c.dir;
    p.aim = DIR_AIM[c.dir];
    p.moving = false;
    p.squat = 0;
    const H = SX.hub;
    if (c.kind === "sit") {
      p.bodyPose = c.pose;
      p.frame = 0;
      if (U.spinning() && spinPose(p, c)) return;
      p.spinQ = -1;
      p.hop = c.hop;
      p.armPose = H.POSE.lap(c.dir);
      return;
    }
    const a = c.anim;
    if (c.mode === "run") {
      p.frame = Math.floor(c.walkT) % 8;
      p.bodyPose = "run";
      p.hop = (p.frame & 3) === 1 || (p.frame & 3) === 2 ? 1 : 0;
      p.armPose = H.POSE.run(p.frame, c.dir);
    } else if (c.mode === "jog") {
      p.frame = Math.floor(c.walkT) % 4;
      p.bodyPose = null;
      p.armPose = null;
      p.hop = p.frame & 1 ? 1 : 0;
      p.moving = true;
    } else if (c.mode === "press") {
      p.frame = 0;
      p.bodyPose = "lie";
      p.hop = H.BENCH_HOP;
      p.armPose = H.POSE.bench(1 - Math.max(0, Math.sin(a * 2.2)));
    } else if (c.mode === "curl") {
      p.frame = 0;
      p.bodyPose = "benchSit";
      p.hop = c.hop;
      p.armPose = H.POSE.curl(Math.max(0, Math.sin(a * 3)), Math.max(0, Math.sin(a * 3 + 1.6)));
    } else if (c.mode === "rope") {
      const ph = a * 1.6 % 1;
      p.frame = 0;
      p.bodyPose = null;
      p.hop = ph > .35 && ph < .65 ? 10 : 0;
      p.armPose = H.POSE.rope;
    } else if (c.mode === "bag") {
      const ph = a * 2.4 % 1;
      p.frame = 0;
      p.bodyPose = null;
      p.hop = 0;
      p.armPose = H.POSE.punch(ph < .35 ? ph / .35 : 0, Math.floor(a * 2.4) % 2, c.dir === 3);
    }
  };
  const MOVE = [ "up", "down", "left", "right" ];
  U.update = function(dt, F, ctl) {
    const H = SX.hub, home = (H.scene === "home" || H.scene === "visit") && SX.game.state === "hub";
    const mk = H.scene === "market" && SX.game.state === "hub";
    if (!home && !mk) {
      if (U.cur) U.stop(true);
      if (peerSit.size) peerSit.clear();
      return;
    }
    if (mk && H.fight && U.cur) U.stop();
    const c = U.cur, p = SX.actors.player;
    if (c) {
      const pr = c.prop && F.props.includes(c.prop) ? c.prop : null;
      if (!pr || SX.home.deco) {
        U.stop();
      } else if (ctl && MOVE.some(k => SX.input.pressed(k))) U.stop(); else {
        c.anim += dt;
        if (ctl && SX.input.wheel && U.spinnable()) {
          U.spin(SX.input.wheel);
          SX.input.wheel = 0;
        }
        if (c.spinT > 0 && (c.spinT -= dt) <= 0 && SX.game.save) SX.game.persist();
        if (U.spinnable()) {
          spinTick(c, dt / (SX.PACE || 1));
          warmSpin(c, p);
        }
        if (c.kind === "gym") {
          c.walkT += dt * (c.mode === "run" ? 12 : c.mode === "jog" ? 9 : 0);
          if (H.gymCivTick) {
            const q = {
              x: c.x,
              y: c.y,
              anim: c.anim,
              walkT: c.walkT,
              sndT: c.sndT,
              id: 0,
              prop: c.prop
            };
            H.gymCivTick(q, c.mode === "jog" ? "run" : c.mode === "press" ? "str" : c.mode, dt);
            c.sndT = q.sndT;
          }
          c.pend += dt / (SX.PACE || 1);
          c.flushT += dt;
          if (c.flushT > 30) {
            c.flushT = 0;
            U.eggFlush();
            SX.game.persist();
          }
        }
        U.pose(p);
      }
    }
    if (mk) {
      U.peers(F);
      return;
    }
    U.labT = (U.labT || 0) - dt;
    if (U.labT <= 0) {
      U.labT = .5;
      U.labels(F);
    }
    U.tvTick(F);
    if (SX.fanSpin) SX.fanSpin.tick(F);
    U.peers(F);
  };
  U.netLight = function(F, id, on) {
    const p = F.props.find(x => x.furn && x.furn.id === id && FURN[x.kind] && (FURN[x.kind].use === "tv" || FURN[x.kind].use === "lamp"));
    if (!p) return;
    const f = live(p.furn);
    if (!f) return;
    const tv = FURN[p.kind].use === "tv", now = tv ? U.tvOn(f) : !f.off;
    if (now === !!on) return;
    if (tv) {
      if (on) {
        f.tvOn = 1;
        delete f.off;
      } else {
        delete f.tvOn;
        f.off = 1;
      }
    } else {
      if (on) delete f.off; else f.off = 1;
    }
    SX.audio.play("lightSwitch", {
      x: p.x + p.w / 2,
      y: p.y + p.h / 2,
      vol: .8
    });
    SX.map.homeLights(F);
    F.ver = (F.ver || 0) + 1;
    U.labels(F);
    if (SX.hub && SX.hub.scene === "home" && SX.game && SX.game.persist) SX.game.persist();
  };
  U.labels = function(F) {
    for (const p of F.props) {
      if (!p.furn || !p.npc || !ROLES.has(p.npc.role)) continue;
      const f = live(p.furn), nm = (FURN[p.kind] || {}).name || p.kind, r = p.npc.role;
      p.npc.name = r === "sit" ? nm + " — 앉기" : r === "tv" ? nm + (U.tvOn(f) ? " — 끄기" : " — 켜기") : r === "lamp" || r === "fan" ? nm + (f.off ? " — 켜기" : " — 끄기") : nm + " — 사용하기";
    }
  };
  U.NEAR = 2;
  U.speakerOf = function(F, tv) {
    let best = null, bd = 1e9;
    for (const q of F.props) {
      if (q.kind !== "speaker" || !q.furn) continue;
      const gx = Math.max(0, q.x - (tv.x + tv.w), tv.x - (q.x + q.w)), gy = Math.max(0, q.y - (tv.y + tv.h), tv.y - (q.y + q.h)), d = Math.max(gx, gy);
      if (d <= U.NEAR + 1e-6 && d < bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  };
  const chan = t => {
    const ph = t % 15.2;
    return ph < 7 ? 0 : ph < 7.6 ? 2 : ph < 14.6 ? 1 : 2;
  };
  U.tvTick = function(F) {
    const now = performance.now() / 1e3;
    for (const l of F.lamps) {
      const p = l.prop;
      if (!p || p.kind !== "tv") continue;
      const f = live(p.furn), t = now + (f.id | 0) * 3.7, ch = chan(t);
      l.a = (ch === 2 ? .75 : ch === 1 ? .62 : .55) + Math.sin(now * 9.3 + f.id) * .05 + Math.sin(now * 23.1) * .03;
    }
    const best = new Map;
    for (const p of F.props) {
      if (p.kind !== "tv" || !p.furn) continue;
      const f = live(p.furn);
      if (!U.tvOn(f)) continue;
      const sp = U.speakerOf(F, p);
      if (!sp) continue;
      const d = Math.hypot(p.x - sp.x, p.y - sp.y), b = best.get(sp);
      if (!b || d < b.d) best.set(sp, {
        f,
        d
      });
    }
    for (const [sp, b] of best) SX.audio.spotLoop("tv" + b.f.id, "tvVoice", {
      x: sp.x + sp.w / 2,
      y: sp.y + sp.h / 2,
      range: 12,
      vol: .32
    });
  };
  const SW = 44, SH = 21, scr = new Map;
  const hx = c => [ parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16) ];
  function screen(id, now) {
    const t = now + (id | 0) * 3.7, fr = Math.floor(t * 12);
    let e = scr.get(id);
    if (!e) {
      e = {
        c: A.mk(SW, SH),
        fr: -1
      };
      scr.set(id, e);
    }
    if (e.fr === fr) return e.c;
    e.fr = fr;
    const x = e.c.getContext("2d"), im = x.createImageData(SW, SH), d = im.data, ch = chan(t), g = new SX.Rng(fr * 7 + (id | 0));
    const put = (px, py, c, k) => {
      if (px < 0 || py < 0 || px >= SW || py >= SH) return;
      const i = (py * SW + px) * 4, v = k == null ? 1 : k;
      d[i] = c[0] * v;
      d[i + 1] = c[1] * v;
      d[i + 2] = c[2] * v;
      d[i + 3] = 255;
    };
    const rect = (x0, y0, w, h, c, k) => {
      for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) put(xx, yy, c, k);
    };
    if (ch === 2) {
      const band = Math.floor(t * 30 % SH);
      for (let yy = 0; yy < SH; yy++) for (let xx = 0; xx < SW; xx++) {
        const v = 40 + g.i(120) + (Math.abs(yy - band) < 2 ? 40 : 0);
        put(xx, yy, [ v, v, v + 8 ]);
      }
    } else if (ch === 0) {
      for (let yy = 0; yy < SH; yy++) rect(0, yy, SW, 1, hx("#16304e"), 1 - yy * .012);
      rect(0, 0, SW, 4, hx("#7a1e22"));
      rect(0, 3, SW, 1, hx("#4a1014"));
      const blink = Math.floor(t * 2) % 2;
      for (let k = 0; k < 6; k++) rect(12 + k * 4, 1, 3, 2, hx("#e8d8c8"), blink || k % 2 ? .9 : .55);
      rect(2, 1, 1, 2, hx("#ffd24a"));
      put(2, 3, hx("#ffd24a"));
      for (let a = 0; a < 40; a++) {
        const an = a / 40 * 6.283;
        put(Math.round(9 + Math.cos(an) * 5), Math.round(10 + Math.sin(an) * 5), hx("#8aa8c8"));
      }
      rect(7, 8, 5, 5, hx("#2a4a6a"));
      rect(8, 9, 3, 3, hx("#c8d4e0"), .8);
      for (const [yy, len] of [ [ 7, 22 ], [ 10, 18 ], [ 13, 20 ] ]) for (let xx = 17; xx < 17 + len; xx++) if ((xx * 7 + yy) % 5 !== 0) put(xx, yy, hx("#b8c4d0"), .85);
      rect(0, 17, SW, 4, hx("#b8902e"));
      rect(0, 17, SW, 1, hx("#d8b050"));
      const off = Math.floor(t * 10) % 48;
      for (let k = 0; k < 14; k++) {
        const gx = ((k * 7 - off) % 48 + 48) % 48 - 2, w = 2 + k * 5 % 4;
        rect(gx, 18, w, 2, hx("#5a3e14"));
      }
    } else {
      for (let yy = 0; yy < SH; yy++) rect(0, yy, SW, 1, hx("#26405e"), 1 - yy * .022);
      for (let xx = 2; xx < SW; xx += 6) rect(xx, 2, 3, 11, hx("#30506e"), .7);
      const talk = Math.floor(t * 6) % 3, nod = Math.floor(t * .7) % 4 === 0 ? 1 : 0;
      rect(15, 11, 14, 6, hx("#2a3446"));
      rect(17, 10, 10, 2, hx("#2a3446"));
      rect(21, 10, 2, 4, hx("#c8ccd0"));
      put(21, 13, hx("#8a2a2a"));
      put(22, 12, hx("#8a2a2a"));
      rect(19, 3 + nod, 6, 7, hx("#b08a70"));
      rect(19, 2 + nod, 6, 2, hx("#2a2420"));
      rect(18, 3 + nod, 1, 4, hx("#2a2420"));
      rect(25, 3 + nod, 1, 3, hx("#2a2420"));
      put(20, 6 + nod, hx("#2a2420"));
      put(23, 6 + nod, hx("#2a2420"));
      rect(21, 8 + nod, 2, 1, hx(talk ? "#5a2a24" : "#8a6450"));
      rect(4, 15, 36, 2, hx("#3a2a20"));
      rect(4, 15, 36, 1, hx("#5a4030"));
      rect(0, 17, SW, 4, hx("#d0d4d8"));
      rect(0, 17, 9, 4, hx("#2a5aa8"));
      rect(1, 18, 7, 2, hx("#e8eef4"), .8);
      for (let k = 0; k < 7; k++) rect(11 + k * 4, 18, 3, 2, hx("#2a2c30"), .85);
      rect(38, 2, 4, 3, hx("#e84a3a"), Math.floor(t * 1.5) % 2 ? 1 : .7);
    }
    for (let yy = 1; yy < SH; yy += 2) for (let xx = 0; xx < SW; xx++) {
      const i = (yy * SW + xx) * 4;
      d[i] *= .86;
      d[i + 1] *= .86;
      d[i + 2] *= .86;
    }
    const fl = .9 + Math.sin(t * 17) * .05;
    for (let i = 0; i < d.length; i += 4) {
      d[i] *= fl;
      d[i + 1] *= fl;
      d[i + 2] *= fl;
    }
    x.putImageData(im, 0, 0);
    return e.c;
  }
  U.screen = screen;
  U.OFFV = 1e3;
  U.drawOn = function(ctx, p, s, x, y, now) {
    if (SX.tankFish && SX.tankFish.KINDS[p.kind]) SX.tankFish.draw(ctx, p, s, x, y, now);
    if (SX.fanSpin && SX.fanSpin.KINDS[p.kind]) SX.fanSpin.draw(ctx, p, s, x, y, now);
    if (p.kind !== "tv" && LIGHTS.includes(p.kind)) {
      const f = live(p.furn), want = (f.v | 0) % U.OFFV + (f.off ? U.OFFV : 0);
      if (p.v !== want) p.v = want;
      return;
    }
    if (p.kind !== "tv") return;
    const f = live(p.furn);
    if (!U.tvOn(f)) return;
    const rot = (p.rot | 0) & 3, B = s.c.height - 2;
    if (rot === 0) {
      ctx.drawImage(screen(f.id, now), x + 10, y + B - 49);
      ctx.fillStyle = "#4ae070";
      ctx.fillRect(x + 52, y + B - 27, 1, 1);
    } else {
      ctx.fillStyle = "rgba(150,190,255," + (.35 + Math.sin(now * 9) * .08).toFixed(2) + ")";
      const sx = rot === 1 ? x + s.c.width - 6 : rot === 3 ? x + 5 : null;
      if (sx != null) ctx.fillRect(sx, y + B - 40, 1, 14);
    }
  };
  U.draw = function(ctx, cam, F) {
    const c = U.cur, p = SX.actors.player;
    if (!c || c.kind !== "gym" || !p) return;
    const H = SX.hub, sh = SX.motion ? SX.motion.shift(p) : [ 0, 0 ], px = Math.round(p.x * TS - cam.x) + sh[0], py = Math.round(p.y * TS - cam.y) + sh[1], y0 = py - (p.hop || 0), a = c.anim;
    if (c.mode === "press") H.drawBar(ctx, px, y0 + H.benchY(1 - Math.max(0, Math.sin(a * 2.2)))); else if (c.mode === "curl") {
      const u1 = Math.round(Math.max(0, Math.sin(a * 3)) * 8), u2 = Math.round(Math.max(0, Math.sin(a * 3 + 1.6)) * 8);
      const hn = SX.motion && SX.motion.handAt(p, "n", cam), hf = SX.motion && SX.motion.handAt(p, "f", cam);
      H.drawBell(ctx, hn ? Math.round(hn[0]) : px - 8, hn ? Math.round(hn[1]) - 1 : y0 - 13 - u1);
      H.drawBell(ctx, hf ? Math.round(hf[0]) : px + 8, hf ? Math.round(hf[1]) - 1 : y0 - 13 - u2);
    } else if (c.mode === "rope") H.drawRope(ctx, px, py - (p.hop || 0), a * 1.6 % 1, false); else if (c.mode === "run") {
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      const ph = c.walkT / 8 % 1, sg = c.dir === 3 ? -1 : 1;
      for (let k = 0; k < 5; k++) {
        const xx = px - sg * (18 - (k / 5 + ph) % 1 * 36);
        ctx.fillRect(Math.round(xx), py - 3, 1, 6);
      }
    }
  };
  const rgbHsv = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
    let h = 0;
    if (dl) {
      if (mx === r) h = (g - b) / dl % 6; else if (mx === g) h = (b - r) / dl + 2; else h = (r - g) / dl + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [ h, mx ? dl / mx : 0, mx / 255 ];
  };
  const OFFP = {
    fire: (r, g, b, hsv, x, y, B) => hsv[1] > .45 && hsv[2] > .5 && (hsv[0] < 60 || hsv[0] > 340) ? y < B - 22 ? null : x + y & 1 ? [ 46, 38, 34 ] : [ 58, 48, 42 ] : undefined,
    heater: (r, g, b, hsv) => hsv[1] > .4 && hsv[2] > .55 && (hsv[0] < 60 || hsv[0] > 340) ? [ Math.round(r * .22 + 22), Math.round(g * .22 + 18), Math.round(b * .22 + 16) ] : undefined,
    neon: (r, g, b, hsv, x, y) => x >= 3 && x <= 60 && y >= 5 && y <= 37 && (hsv[2] > .28 || hsv[1] > .3) ? [ Math.round(r * .18 + 30), Math.round(g * .18 + 30), Math.round(b * .18 + 36) ] : undefined
  };
  const dim = (r, g, b, hsv) => hsv[2] > .82 && hsv[1] < .5 || hsv[2] > .62 && hsv[1] > .4 ? [ Math.round(r * .42 + 14), Math.round(g * .42 + 14), Math.round(b * .42 + 16) ] : undefined;
  function offPass(P, kind, w, h) {
    const c = P.x.canvas, x = P.x, im = x.getImageData(0, 0, c.width, c.height), d = im.data, W = c.width, B = h - 2 - (kind === "heater" ? 12 : 0), fn = OFFP[kind] || dim;
    for (let i = 0, n = W * c.height; i < n; i++) {
      const k = i * 4;
      if (d[k + 3] < 8) continue;
      const r = d[k], g = d[k + 1], b = d[k + 2], o = fn(r, g, b, rgbHsv(r, g, b), i % W, i / W | 0, B);
      if (o === undefined) continue;
      if (o === null) {
        d[k + 3] = 0;
        continue;
      }
      d[k] = o[0];
      d[k + 1] = o[1];
      d[k + 2] = o[2];
    }
    x.putImageData(im, 0, 0);
  }
  U.offPass = offPass;
  function wrap(kind) {
    const d = A.propDef(kind);
    if (!d || d._off) return;
    d._off = 1;
    const seed = (v, rot) => new SX.Rng(v * 131 + kind.length + (d.rotSym && rot ? rot * 977 : 0));
    const w1 = fn => function(P, w, h, up, g, v, col, rot) {
      if ((v | 0) < U.OFFV) return fn.apply(this, arguments);
      const v0 = (v | 0) - U.OFFV, r = fn.call(this, P, w, h, up, seed(v0, rot | 0), v0, col, rot);
      offPass(P, kind, w, h);
      return r;
    };
    d.draw = w1(d.draw);
    if (d.rotDraw) for (const k of Object.keys(d.rotDraw)) d.rotDraw[k] = w1(d.rotDraw[k]);
  }
  for (const k of LIGHTS) wrap(k);
})(window.SX);
