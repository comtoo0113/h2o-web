"use strict";

(function(SX) {
  const A = SX.actors;
  const H = SX.hub = {
    level: null,
    scene: "home",
    rangeKit: null
  };
  function build(scene) {
    if (scene === "market") return SX.map.buildMarket();
    if (scene === "range") return SX.map.buildRange();
    if (scene === "gym") return SX.map.buildGym();
    if (scene === "fish") return SX.map.buildFish();
    if (scene === "visit" && SX.visit && SX.visit.cur) return SX.visit.build();
    const s = SX.game.save;
    return SX.map.buildHome(SX.home.tier(), s.home);
  }
  const CIV_NAMES = [ "봉천동 아저씨", "편의점 알바였던 청년", "택배 기사", "간호조무사", "고등학생", "공사장 반장", "택시 기사", "대학원생", "미용사", "경비원 출신", "배달 라이더", "소방관이었던 사람" ];
  const CIV_LINES_M = [ "", "", "", "", "", "", "", "", "", "", "", "", "", "" ];
  H.civs = [];
  const CIV_WHO = [ "uncle", "clerk", "courier", "nurse", "student", "foreman", "taxi", "grad" ];
  const POSTS = [ {
    who: "vet",
    x: 22.7,
    y: 11.3,
    look: {
      top: "#3a4a2a",
      topStyle: "camo",
      camo1: "#2a3a1e",
      camo2: "#5a5a3a",
      pants: "#2e3624",
      hat: "beanie",
      hatCol: "#27301c",
      hair: "#8a8a80",
      hairStyle: "buzz",
      beard: true
    },
    lines: [ "", "", "" ]
  }, {
    who: "teacher",
    x: 10.7,
    y: 13,
    look: {
      top: "#5a5a52",
      topStyle: "coat",
      pants: "#2a2c30",
      hat: null,
      hair: "#6a6a5a",
      hairStyle: "bob"
    },
    lines: [ "", "", "" ]
  }, {
    who: "metro",
    x: 5.4,
    y: 8.6,
    look: {
      top: "#2a3a5a",
      topStyle: "uniform",
      pants: "#1e2430",
      hat: "cap",
      hatCol: "#1a1e2a",
      hair: "#2a2019",
      hairStyle: "short"
    },
    lines: [ "", "", "" ]
  } ];
  H.eggHint = function(civ) {
    if (!civ || !civ.who || !SX.EGGS) return null;
    const s = SX.game.save, P = SX.prog, e = SX.EGGS.find(q => q.who === civ.who);
    if (!e || (s.eggs || []).indexOf(e.id) >= 0) return null;
    if (P && P.stCanGo && !P.stCanGo(s.story, e.b)) return null;
    return e.hint;
  };
  H.sideSay = role => {
    const P = SX.prog, sd = P && P.SIDES && P.stSide ? P.SIDES[P.stSide(SX.game.save && SX.game.save.story)] : null;
    return sd && sd.shop === role && sd.hello ? sd.hello : null;
  };
  H.civLine = function(civ, not) {
    if (civ && civ.shop) {
      const hi = H.sideSay(civ.shop);
      if (hi && !civ.sideHi) {
        civ.sideHi = 1;
        return hi;
      }
      const L = (civ.lines || [ "..." ]).concat(hi ? [ hi ] : []);
      let l = L[Math.floor(Math.random() * L.length)];
      for (let k = 0; k < 6 && L.length > 1 && l === not; k++) l = L[Math.floor(Math.random() * L.length)];
      return l;
    }
    {
      const hint = H.eggHint(civ);
      if (hint && hint !== not && Math.random() < .45) return hint;
    }
    const CIV_LINES = civ && (civ.post || civ.angler) ? civ.lines : civ && civ.gym ? GYM_LINES : CIV_LINES_M;
    let l = CIV_LINES[Math.floor(Math.random() * CIV_LINES.length)];
    if (l === not) l = CIV_LINES[(CIV_LINES.indexOf(l) + 1) % CIV_LINES.length];
    return l;
  };
  function civFree(F, x, y, any) {
    const tx = Math.floor(x), ty = Math.floor(y);
    return F.in(tx, ty) && F.tile(tx, ty) === SX.map.T.GROUND && !F.solid[F.i(tx, ty)] && (any || !H.inBenchZone(F, x, y));
  }
  const boxCache = new Map;
  function spriteBox(p) {
    const key = p.kind + ":" + (p.v | 0) + ":" + (p.col || "") + ":" + (p.rot | 0);
    if (boxCache.has(key)) return boxCache.get(key);
    let b = null;
    const s = SX.art.prop(p.kind, p.v, p.col, p.rot);
    if (s) {
      const c = s.c, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 200) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (x1 >= 0) b = {
        x0,
        y0: y0 + s.oy,
        x1,
        y1: y1 + s.oy
      };
    }
    boxCache.set(key, b);
    return b;
  }
  H.ZONE_SIDE = 12;
  H.ZONE_TOP = 6;
  H.benchZones = function(F) {
    const ver = F.props.length + ":" + (F.ver || 0);
    if (F._bz && F._bzV === ver) return F._bz;
    const TS = SX.TS, out = [];
    for (const p of F.props) {
      if (p.kind !== "bench" || p.hidden) continue;
      const b = spriteBox(p);
      if (!b) continue;
      const X = p.x * TS, Y = p.y * TS, front = Math.ceil(p.y + p.h - 1e-6);
      out.push({
        p,
        box: [ X + b.x0, Y + b.y0, X + b.x1, Y + b.y1 ],
        x0: (X + b.x0 - H.ZONE_SIDE) / TS,
        x1: (X + b.x1 + H.ZONE_SIDE) / TS,
        y0: (Y + b.y0 - H.ZONE_TOP) / TS,
        y1: Math.min(front, (Y + b.y1 + 2) / TS)
      });
    }
    F._bz = out;
    F._bzV = ver;
    return out;
  };
  H.inBenchZone = (F, x, y) => H.benchZones(F).some(z => x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1);
  const DIR8 = [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ], [ 1, 1 ], [ 1, -1 ], [ -1, 1 ], [ -1, -1 ] ];
  function lineFree(F, x0, y0, x1, y1, any) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .1));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (!civFree(F, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, any)) return false;
    }
    return true;
  }
  let civB = null;
  function civRoute(F, sx, sy, tx, ty) {
    if (!civFree(F, tx, ty)) return null;
    if (lineFree(F, sx, sy, tx, ty)) return [ {
      x: tx,
      y: ty
    } ];
    const W = F.W, ok = (x, y) => x >= 0 && y >= 0 && x < W && y < F.H && civFree(F, x + .5, y + .5);
    const N = W * F.H;
    if (!civB || civB.n < N) civB = {
      n: N,
      prev: new Int32Array(N),
      mk: new Uint32Array(N),
      q: new Int32Array(N),
      st: 0
    };
    if (++civB.st >= 4294967280) {
      civB.mk.fill(0);
      civB.st = 1;
    }
    const st = civB.st, prev = civB.prev, mk = civB.mk, q = civB.q;
    const s = F.i(Math.floor(sx), Math.floor(sy)), t = F.i(Math.floor(tx), Math.floor(ty));
    let ql = 0;
    q[ql++] = s;
    mk[s] = st;
    prev[s] = s;
    let found = s === t;
    for (let qi = 0; qi < ql && !found; qi++) {
      const c = q[qi], cx = c % W, cy = c / W | 0;
      for (const [dx, dy] of DIR8) {
        const nx = cx + dx, ny = cy + dy;
        if (!ok(nx, ny)) continue;
        const n = F.i(nx, ny);
        if (mk[n] === st) continue;
        if (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy))) continue;
        mk[n] = st;
        prev[n] = c;
        if (n === t) {
          found = true;
          break;
        }
        q[ql++] = n;
      }
    }
    if (!found) return null;
    const cells = [];
    for (let k = t; k !== s; k = prev[k]) cells.push({
      x: k % W + .5,
      y: (k / W | 0) + .5
    });
    cells.reverse();
    cells.push({
      x: tx,
      y: ty
    });
    const out = [];
    let px = sx, py = sy, i = 0;
    while (i < cells.length) {
      let j = Math.min(cells.length - 1, i + 10);
      while (j > i && !lineFree(F, px, py, cells[j].x, cells[j].y)) j--;
      out.push(cells[j]);
      px = cells[j].x;
      py = cells[j].y;
      i = j + 1;
    }
    return out;
  }
  function civGo(F, c, x, y, next, tail) {
    const r = civRoute(F, c.x, c.y, x, y);
    if (!r) return false;
    if (c.seat) H.standUp(F, c);
    if (tail) r.push(tail);
    let len = 0, px = c.x, py = c.y;
    for (const q of r) {
      len += Math.hypot(q.x - px, q.y - py);
      px = q.x;
      py = q.y;
    }
    const w = r.shift();
    c.state = "walk";
    c.tx = w.x;
    c.ty = w.y;
    c.legAny = !!w.any;
    c.path = r;
    c.next = next;
    c.t = 0;
    c.walkMax = 4 + len * 1.4;
    c.seatTo = null;
    c.snapSit = false;
    return true;
  }
  function civOut(F, c) {
    if (civFree(F, c.x, c.y)) return;
    for (let r = .15; r < 3; r += .15) for (let k = 0; k < 16; k++) {
      const a = k / 16 * 6.283, x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
      if (civFree(F, x, y)) {
        c.x = x;
        c.y = y;
        c.frame = 0;
        return;
      }
    }
  }
  H.civOut = civOut;
  H.seatOf = function(pr, k) {
    if (!pr || pr.kind !== "bench") return null;
    const TS = SX.TS, A2 = SX.art, rot = (pr.rot | 0) & 3, dm = A2.propDims(pr.kind, rot);
    if (!dm) return null;
    const B = (pr.y + dm.fh) * TS - 2, HIP = A2.BSIT_HIP || 13, mk = (x, y, feet, dir) => ({
      prop: pr,
      k,
      x: x / TS,
      y,
      hop: Math.round(y * TS) - feet,
      dir,
      pose: "benchSit"
    });
    if (rot === 0) return mk(pr.x * TS + [ 17, 47 ][k & 1], pr.y + dm.fh, B, 0);
    if (rot & 1 && k & 1) return null;
    const M = A2.rotModel && A2.rotModel("bench"), G = M && M._geo && M._geo(rot), seat = G && G.parts.find(q => q.src.wood && q.z === 8);
    if (!seat) return mk(pr.x * TS + [ 17, 47 ][k & 1], pr.y + dm.fh, B, 0);
    const pad = M.pad == null ? 3 : M.pad, td = Math.round(seat.d * seat.dpx), fb = B - Math.round((1 - seat.y - seat.d) * G.Dpx), top = fb - seat.z - seat.hh;
    if (rot === 2) return mk(pr.x * TS + [ 17, 47 ][k & 1], pr.y - .001, top - Math.round(td / 2) + HIP, 2);
    const cx = pr.x * TS + pad + Math.round((seat.x + seat.w / 2) * G.Wpx), hipY = top - Math.round(td * .5);
    return mk(cx, pr.y + dm.fh, hipY + HIP, rot === 1 ? 1 : 3);
  };
  H.sitDown = function(c, s) {
    c.x = s.x;
    c.y = s.y;
    c.dir = s.dir;
    c.bodyPose = s.pose;
    c.hop = s.hop;
    c.armPose = H.POSE.lap(s.dir);
    c.seat = s;
    c.frame = 0;
    c.state = "sit";
    c.path = null;
    c.legAny = false;
  };
  H.standUp = function(F, c) {
    const st = c.seat;
    c.bodyPose = null;
    c.hop = 0;
    c.armPose = null;
    c.seat = null;
    c.frame = 0;
    if (F && st && c.x === st.x && c.y === st.y && H.inBenchZone(F, st.x, st.y)) {
      const a = H.seatFront(st);
      c.x = a.x;
      c.y = a.y;
    }
    if (F && !c.legAny) civOut(F, c);
  };
  H.sameSeat = (a, b) => !!(a && b && a.prop === b.prop && a.k === b.k);
  const seatOn = (a, s) => !!(a && a.bodyPose === "benchSit" && Math.abs(a.x - s.x) < .3 && Math.abs(a.y - s.y) < .3);
  H.seatHeld = function(s) {
    if (!s) return false;
    const U = SX.homeUse;
    if (U && U.cur && U.cur.kind === "sit" && U.cur.prop === s.prop && Math.abs(U.cur.x - s.x) < .3 && Math.abs(U.cur.y - s.y) < .3) return true;
    const L = SX.meet && SX.meet.seen ? SX.meet.seen() : [];
    return L.some(g => seatOn(g, s));
  };
  H.seatTaken = s => H.civs.some(o => H.sameSeat(o.seat, s) || H.sameSeat(o.seatTo, s) && Math.hypot(o.x - s.x, o.y - s.y) < 1) || (SX.meet && SX.meet.seen ? SX.meet.seen() : []).some(g => seatOn(g, s));
  H.seatFront = s => ({
    x: s.x,
    y: s.dir === 2 ? s.y - .5 : s.y + .5
  });
  H.civSeats = F => civSpots(F).benches;
  function civSpots(F) {
    const benches = [];
    for (const p of F.props) if (p.kind === "bench") for (let k = 0; k < 2; k++) {
      const s = H.seatOf(p, k);
      if (!s || !civFree(F, s.x, s.y, true)) continue;
      const a = H.seatFront(s);
      if (civFree(F, a.x, a.y) && lineFree(F, a.x, a.y, s.x, s.y, true)) benches.push(s);
    }
    const fires = F.props.filter(p => p.kind === "fire").map(p => ({
      kind: "warm",
      x: p.x + .5,
      y: p.y + .5
    }));
    return {
      benches,
      fires
    };
  }
  H.civSpec = function(who) {
    const k = CIV_WHO.indexOf(who);
    if (k >= 0) {
      const spec = SX.art.charSpec("scav", new SX.Rng(500 + k));
      spec.mask = null;
      spec.vest = null;
      if (spec.hat === "helmet") spec.hat = "beanie";
      spec.key = "civ" + k;
      return spec;
    }
    const pk = POSTS.findIndex(q => q.who === who);
    if (pk < 0) return null;
    const spec = Object.assign(SX.art.charSpec("scav", new SX.Rng(700 + pk)), {
      mask: null,
      vest: null,
      pack: null,
      gloves: false,
      beard: false
    }, POSTS[pk].look);
    spec.key = "post" + who;
    return spec;
  };
  H.spawnCivs = function(F) {
    H.civs = [];
    const rng = new SX.Rng(20260923), n = 8;
    const gone = who => !!(who && SX.prog && SX.prog.rsOut && SX.prog.rsOut(SX.game.save.story, who));
    for (let k = 0; k < n; k++) {
      let x, y, t = 0;
      do {
        x = 4 + rng.f() * (F.W - 8);
        y = 4 + rng.f() * (F.H - 8);
      } while (!civFree(F, x, y) && t++ < 60);
      if (gone(CIV_WHO[k])) continue;
      const spec = SX.art.charSpec("scav", new SX.Rng(500 + k));
      spec.mask = null;
      spec.vest = null;
      if (spec.hat === "helmet") spec.hat = "beanie";
      spec.key = "civ" + k;
      const c = {
        kind: "npc",
        civ: true,
        id: k,
        who: CIV_WHO[k] || null,
        name: CIV_NAMES[k % CIV_NAMES.length],
        x,
        y,
        floor: 0,
        spec,
        dir: 0,
        frame: 0,
        walkT: 0,
        alive: true,
        state: "idle",
        t: 1 + rng.f() * 3,
        tx: x,
        ty: y
      };
      H.civs.push(c);
      (F.npcs || (F.npcs = [])).push(c);
    }
    const WHO = SX.prog && SX.prog.ST_WHO || {};
    POSTS.forEach((q, k) => {
      if (gone(q.who)) return;
      let x = q.x, y = q.y;
      for (let r = 0; r < 3 && !civFree(F, x, y); r += .4) for (let a = 0; a < 8 && !civFree(F, x, y); a++) {
        x = q.x + Math.cos(a * .785) * (r + .4);
        y = q.y + Math.sin(a * .785) * (r + .4);
      }
      const spec = Object.assign(SX.art.charSpec("scav", new SX.Rng(700 + k)), {
        mask: null,
        vest: null,
        pack: null,
        gloves: false,
        beard: false
      }, q.look);
      spec.key = "post" + q.who;
      const c = {
        kind: "npc",
        civ: true,
        post: true,
        id: 100 + k,
        who: q.who,
        name: WHO[q.who] || q.who,
        lines: q.lines,
        x,
        y,
        floor: 0,
        spec,
        dir: 0,
        frame: 0,
        walkT: 0,
        alive: true,
        state: "post",
        t: 1e9,
        tx: x,
        ty: y
      };
      H.civs.push(c);
      F.npcs.push(c);
    });
  };
  H.updateCivs = function(F, dt) {
    const p = A.player, sp = civSpots(F);
    for (const c of H.civs) {
      if (c.hidden) continue;
      if (c.post) {
        if (p && Math.hypot(p.x - c.x, p.y - c.y) < 3.2) c.dir = A.dirOf(Math.atan2(p.y - c.y, p.x - c.x));
        continue;
      }
      c.t -= dt;
      if (c.state !== "sit" && (c.bodyPose || c.seat)) H.standUp(F, c);
      if (c.state === "walk") {
        let dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d < .15 && c.path && c.path.length) {
          if (c.path[0].any && c.next === "sit" && c.seatTo && (H.civs.some(o => o !== c && H.sameSeat(o.seat, c.seatTo)) || H.seatHeld(c.seatTo))) c.path = null; else {
            const w = c.path.shift();
            c.tx = w.x;
            c.ty = w.y;
            c.legAny = !!w.any;
            dx = c.tx - c.x;
            dy = c.ty - c.y;
            d = Math.hypot(dx, dy);
          }
        }
        if (d < .15 || c.t < -(c.walkMax || 8)) {
          const left = c.path && c.path.length;
          c.path = null;
          c.state = c.next || "idle";
          c.next = null;
          c.t = c.state === "sit" ? 8 + Math.random() * 10 : c.state === "warm" ? 6 + Math.random() * 8 : 2 + Math.random() * 4;
          if (c.state === "warm") {
            c.dir = 2;
          }
          c.bodyPose = null;
          c.hop = 0;
          c.frame = 0;
          if (c.state === "sit") {
            const s = c.seatTo;
            c.seatTo = null;
            if (s && d < .15 && !left && (c.legAny || c.snapSit) && !H.civs.some(o => o !== c && H.sameSeat(o.seat, s)) && !H.seatHeld(s)) H.sitDown(c, s); else {
              c.state = "idle";
              c.t = 1;
            }
          }
          c.legAny = false;
          c.snapSit = false;
          if (c.state !== "sit") civOut(F, c);
          continue;
        }
        const s = 1.15 * dt, nx = c.x + dx / d * s, ny = c.y + dy / d * s;
        if (civFree(F, nx, ny, c.legAny) && !(p && Math.hypot(nx - p.x, ny - p.y) < .7)) {
          c.x = nx;
          c.y = ny;
          c.walkT += dt * 3.2;
          c.frame = Math.floor(c.walkT) % 4;
          c.face = Math.atan2(dy, dx);
          c.dir = A.dirOf(c.face);
        } else {
          c.t = -1e9;
        }
      } else if (c.state === "sit" && c.t <= 0) {
        const st = c.seat, a = st && H.seatFront(st), snap = !!(st && H.inBenchZone(F, st.x, st.y));
        H.standUp(F, c);
        if (a && !snap) {
          c.state = "walk";
          c.tx = a.x;
          c.ty = a.y;
          c.legAny = true;
          c.path = [];
          c.next = "idle";
          c.t = 0;
          c.walkMax = 3;
        } else {
          c.state = "idle";
          c.t = 1;
        }
      } else if (c.t <= 0) {
        const r = Math.random();
        let dst = null, next = "idle";
        let seat = null;
        if (r < .4) {
          for (let t = 0; t < 30 && !dst; t++) {
            const x = 3.5 + Math.random() * (F.W - 7), y = 3.5 + Math.random() * (F.H - 7);
            if (civFree(F, x, y)) dst = {
              x,
              y
            };
          }
        } else if (r < .65 && sp.benches.length) {
          const b = sp.benches[Math.floor(Math.random() * sp.benches.length)];
          if (!H.civs.some(o => o !== c && (H.sameSeat(o.seat, b) || H.sameSeat(o.seatTo, b))) && !H.seatHeld(b)) {
            dst = H.seatFront(b);
            next = "sit";
            seat = b;
          }
        } else if (r < .9 && sp.fires.length) {
          const f = sp.fires[Math.floor(Math.random() * sp.fires.length)], a = Math.random() * 6.28;
          dst = {
            x: f.x + Math.cos(a) * 1.6,
            y: f.y + Math.sin(a) * 1.6 + .6
          };
          next = "warm";
          c.fireAt = f;
        }
        const tail = seat && !H.inBenchZone(F, seat.x, seat.y) ? {
          x: seat.x,
          y: seat.y,
          any: true
        } : null;
        if (dst && civFree(F, dst.x, dst.y) && civGo(F, c, dst.x, dst.y, next, tail)) {
          if (seat) {
            c.seatTo = seat;
            c.snapSit = !tail;
          }
        } else {
          c.state = "idle";
          c.t = 1 + Math.random() * 2;
          c.dir = [ 0, 1, 3, 2 ][Math.random() * 4 | 0];
        }
      } else if (c.state === "warm" && c.fireAt) {
        c.dir = A.dirOf(Math.atan2(c.fireAt.y - c.y, c.fireAt.x - c.x));
      } else if (c.state === "ringStand" && c.ringC) {
        c.dir = A.dirOf(Math.atan2(c.ringC.y - c.y, c.ringC.x - c.x));
        c.t = 99;
      }
    }
  };
  const GYM_NAMES = [ "새벽반 회원", "전직 트레이너", "택배 상하차 알바", "복싱 체육관 관장", "군 전역자", "재활 중인 간호사", "마라톤 동호회", "대학 역도부", "헬스 유튜버였던 사람", "체대 입시생", "경찰 특공대 출신", "요가 강사", "주짓수 하던 사람", "배달 라이더" ];
  H.SHOP_LINES = {
    gun: [ "", "", "" ],
    ammo: [ "", "", "" ],
    med: [ "", "", "" ],
    gear: [ "", "", "" ],
    furn: [ "", "", "" ],
    broker: [ "", "", "" ],
    smuggle: [ "", "", "" ],
    merc: [ "", "", "" ],
    insure: [ "", "", "" ],
    estate: [ "", "", "" ],
    fishShop: [ "", "", "" ]
  };
  const GYM_LINES = [ "", "", "", "", "", "", "", "", "", "", "", "" ];
  const GYM_STAY = {
    run: [ 14, 26 ],
    bike: [ 14, 24 ],
    str: [ 12, 20 ],
    squat: [ 10, 18 ],
    curl: [ 8, 14 ],
    bag: [ 10, 18 ],
    rope: [ 8, 14 ],
    stretch: [ 8, 14 ],
    drink: [ 3, 5 ],
    rest: [ 8, 16 ]
  };
  function gymWalkGrid(F) {
    const G = new Uint8Array(F.W * F.H);
    for (let y = 1; y < F.H - 1; y++) for (let x = 1; x < F.W - 1; x++) G[F.i(x, y)] = F.tile(x, y) === SX.map.T.FLOOR && A.free(F, x + .5, y + .5, .3) ? 1 : 0;
    return G;
  }
  function gymPath(F, G, sx, sy, tx, ty) {
    const W = F.W, s = F.i(sx, sy), t = F.i(tx, ty);
    if (!G[t]) return null;
    if (s === t) return [];
    const prev = new Int32Array(W * F.H).fill(-1), q = [ s ];
    prev[s] = s;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % W, cy = c / W | 0;
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ], [ 1, 1 ], [ 1, -1 ], [ -1, 1 ], [ -1, -1 ] ]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= F.H) continue;
        const n = F.i(nx, ny);
        if (prev[n] >= 0 || !G[n]) continue;
        if (dx && dy && (!G[F.i(cx + dx, cy)] || !G[F.i(cx, cy + dy)])) continue;
        prev[n] = c;
        if (n === t) {
          const out = [];
          for (let k = t; k !== s; k = prev[k]) out.push({
            x: k % W + .5,
            y: (k / W | 0) + .5
          });
          return out.reverse();
        }
        q.push(n);
      }
    }
    return null;
  }
  function gymSpots(F, G) {
    const out = [];
    for (const p of F.props) {
      if (!p.gym) continue;
      const k = p.gym;
      const u = k === "bike" ? {
        x: p.x + H.RIDE_X,
        y: p.y + H.RIDE_Y
      } : k === "run" ? {
        x: p.x + p.w * .4,
        y: p.y + p.h * .62
      } : k === "rope" || k === "stretch" ? {
        x: p.x + p.w / 2,
        y: p.y + p.h / 2 + .3
      } : k === "str" && p.kind === "barbell" ? {
        x: p.x + 1.5,
        y: p.y + 1.9
      } : k === "bag" ? {
        x: p.x + 1.2,
        y: p.y + 1.12
      } : k === "rest" ? H.seatOf(p, 0) || {
        x: p.x + 1,
        y: p.y + .3
      } : k === "drink" ? {
        x: p.x - .1,
        y: p.y + .9
      } : k === "squat" && p.kind === "squatRack" ? {
        x: p.x + H.SQUAT_X,
        y: p.y + H.SQUAT_Y
      } : {
        x: p.x + p.w / 2,
        y: p.y + p.h + .35
      };
      let best = null, bd = 1e9;
      for (let y = Math.floor(u.y) - 3; y <= Math.floor(u.y) + 3; y++) for (let x = Math.floor(u.x) - 3; x <= Math.floor(u.x) + 3; x++) {
        if (!F.in(x, y) || !G[F.i(x, y)]) continue;
        const d = Math.hypot(x + .5 - u.x, y + .5 - u.y) + (y + .5 < u.y - .2 ? .8 : 0);
        if (d < bd) {
          bd = d;
          best = {
            x,
            y
          };
        }
      }
      if (best) out.push({
        prop: p,
        kind: k,
        u,
        a: best
      });
    }
    return out;
  }
  H.spawnGymCivs = function(F) {
    H.civs = [];
    H.gymG = gymWalkGrid(F);
    H.gymSpots = gymSpots(F, H.gymG);
    const rng = new SX.Rng(20260925), n = 12, spots = H.gymSpots.filter(s => s.kind !== "drink" && s.kind !== "rest").slice();
    for (let k = 0; k < n; k++) {
      const spec = SX.art.charSpec("scav", new SX.Rng(900 + k * 7));
      spec.mask = null;
      spec.vest = null;
      spec.hat = k % 3 === 0 ? "beanie" : null;
      spec.key = "gym" + k;
      const c = {
        kind: "npc",
        civ: true,
        gym: true,
        id: k,
        name: GYM_NAMES[k % GYM_NAMES.length],
        x: 13.5,
        y: 13.5,
        floor: 0,
        spec,
        dir: 0,
        frame: 0,
        walkT: 0,
        alive: true,
        state: "idle",
        t: .5 + rng.f() * 3,
        anim: rng.f() * 6
      };
      const i = rng.i(spots.length), s = spots.splice(i, 1)[0];
      if (s && k < 8) {
        c.spot = s;
        c.x = s.u.x;
        c.y = s.u.y;
        c.state = "use";
        c.t = 3 + rng.f() * 15;
      } else {
        for (let t = 0; t < 40; t++) {
          const x = 2 + rng.i(F.W - 4), y = 2 + rng.i(F.H - 4);
          if (H.gymG[F.i(x, y)]) {
            c.x = x + .5;
            c.y = y + .5;
            break;
          }
        }
      }
      H.civs.push(c);
      (F.npcs || (F.npcs = [])).push(c);
    }
  };
  H.WARM_S = 40;
  H.warmCivs = function(F, scene) {
    if (!H.civs || !H.civs.length || !(H.WARM_S > 0)) return;
    H._warm = true;
    try {
      for (let t = 0; t < H.WARM_S; t += .1) {
        if (scene === "gym") H.updateGymCivs(F, .1); else H.updateCivs(F, .1);
      }
    } finally {
      H._warm = false;
    }
  };
  H.gymLeave = function(c, say) {
    if (!c.spot) return;
    const F = H.floor();
    {
      const k = c.spot.kind;
      gymSnd(c, k === "squat" || k === "str" ? Math.random() < .2 ? "gymDrop" : "gymRack" : k === "curl" ? "gymDumbbell" : null, .6);
      if ((k === "run" || k === "rope" || k === "bag" || k === "bike") && Math.random() < .5) gymSnd(c, "gymBreath", .45);
    }
    c.x = c.spot.a.x + .5;
    c.y = c.spot.a.y + .5;
    c.spot = null;
    c.state = "idle";
    c.t = .5 + Math.random() * 1.5;
    c.hop = 0;
    c.squat = 0;
    c.crouch = false;
    c.frame = 0;
    c.path = null;
    c.armPose = null;
    c.bodyPose = null;
    c.hop = 0;
    c.seat = null;
    H.gymStepAway(c);
    if (say && F) A.float(F.idx, c.x, c.y - 1.6, say, "#cfd6de");
  };
  H.gymStepAway = function(c) {
    const F = H.floor(), p = A.player, ex = H.ex, ox = ex ? ex.x : p && p.x, oy = ex ? ex.y : p && p.y, G = H.gymG;
    if (!F || !G || ox == null || Math.hypot(c.x - ox, c.y - oy) >= 1.6) return false;
    let best = null, bd = 1e9;
    for (let y = Math.floor(c.y) - 4; y <= Math.floor(c.y) + 4; y++) for (let x = Math.floor(c.x) - 4; x <= Math.floor(c.x) + 4; x++) {
      if (!F.in(x, y) || !G[F.i(x, y)]) continue;
      if (Math.hypot(x + .5 - ox, y + .5 - oy) < 1.8) continue;
      const d = Math.hypot(x + .5 - c.x, y + .5 - c.y);
      if (d < bd) {
        bd = d;
        best = {
          x: x + .5,
          y: y + .5
        };
      }
    }
    if (!best) return false;
    c.x = best.x;
    c.y = best.y;
    c.frame = 0;
    return true;
  };
  function gymSnd(c, name, vol, extra) {
    const p = A.player;
    if (H._warm || !name || !p || Math.hypot(c.x - p.x, c.y - p.y) > 14) return;
    SX.audio.play(name, Object.assign({
      x: c.x,
      y: c.y,
      range: 14,
      vol
    }, extra || {}));
  }
  function gymCivTick(c, k, dt) {
    const at = (rate, ph) => Math.floor(c.anim * rate + ph) !== Math.floor((c.anim - dt) * rate + ph);
    const rep = 2.2 / (2 * Math.PI);
    if (k === "bag") {
      if (at(2.4, 0)) {
        gymSnd(c, "gymBag", .5);
        const bp = c.prop || c.spot && c.spot.prop;
        if (bp && SX.render.bagHit && !H._warm) SX.render.bagHit(bp, c.x < bp.x + bp.w / 2 ? 1 : -1);
      }
    } else if (k === "squat" || k === "str") {
      if (at(rep, .75)) {
        gymSnd(c, "gymBench", .35);
        if (Math.random() < .3) gymSnd(c, "gymGrunt", .4, {
          delay: .15
        });
      }
    } else if (k === "curl") {
      if (at(3 / (2 * Math.PI), 0) && Math.random() < .25) gymSnd(c, "gymGrunt", .3, {
        r: 1.05
      });
    } else if (k === "rope") {
      if (at(1.6, .5)) gymSnd(c, "gymSlap", .3);
      if (at(1.6, 0)) gymSnd(c, "gymSwish", .25);
      if (at(1.6, .35)) gymSnd(c, "gymLand", .35);
    } else if (k === "run" || k === "bike") {
      c.sndT -= dt;
      if (c.sndT <= 0) {
        c.sndT = 4.2;
        gymSnd(c, k === "run" ? "gymMotor" : "gymBike", .35);
      }
      if (k === "run" && Math.floor(c.walkT / 2) !== Math.floor((c.walkT - dt * 5) / 2)) gymSnd(c, "step", .3, {
        surface: "carpet",
        w: .7
      });
    } else if (k === "rest" || k === "stretch") {
      c.sndT -= dt;
      if (c.sndT <= 0) {
        c.sndT = 5 + Math.random() * 5;
        if (Math.random() < .4) gymSnd(c, "gymBreath", .3);
      }
    }
  }
  H.gymCivTick = gymCivTick;
  H.updateGymCivs = function(F, dt) {
    const p = A.player, G = H.gymG;
    if (!G) return;
    for (const q of F.props) if (q.kind === "barbell" || q.kind === "squatRack") q.v = H.ex && H.ex.role === "exStr" && H.ex.prop === q || H.civs.some(c => c.state === "use" && c.spot && c.spot.prop === q) ? 1 : 0;
    const busy = s => H.civs.some(o => o.spot === s || o.goal === s) || H.ex && (H.ex.prop === s.prop || Math.hypot(s.u.x - H.ex.x, s.u.y - H.ex.y) < 1.3);
    for (const c of H.civs) {
      c.t -= dt;
      c.anim += dt;
      if (H.ex && c.state === "idle") H.gymStepAway(c);
      if (c.state === "walk") {
        const w = c.path && c.path[0];
        if (!w) {
          const s = c.goal;
          c.goal = null;
          c.path = null;
          if (s && !(H.ex && (H.ex.prop === s.prop || Math.hypot(s.u.x - H.ex.x, s.u.y - H.ex.y) < 1.3))) {
            c.spot = s;
            c.x = s.u.x;
            c.y = s.u.y;
            c.state = "use";
            const r = GYM_STAY[s.kind] || [ 8, 14 ];
            c.t = r[0] + Math.random() * (r[1] - r[0]);
            c.anim = 0;
            c.sndT = .5 + Math.random();
            gymSnd(c, s.kind === "squat" || s.kind === "str" ? Math.random() < .6 ? "gymPlate" : "gymRack" : s.kind === "curl" ? "gymDumbbell" : null, .55);
          } else {
            c.state = "idle";
            c.t = 1;
          }
          continue;
        }
        const dx = w.x - c.x, dy = w.y - c.y, d = Math.hypot(dx, dy), sp = 1.25 * dt;
        if (p && Math.hypot(c.x + dx / (d || 1) * .4 - p.x, c.y + dy / (d || 1) * .4 - p.y) < .6) {
          c.wait = (c.wait || 0) + dt;
          c.frame = 0;
          if (c.wait > 2.5) {
            c.wait = 0;
            c.state = "idle";
            c.goal = null;
            c.path = null;
            c.t = .5;
          }
          continue;
        }
        c.wait = 0;
        if (d <= sp) {
          c.x = w.x;
          c.y = w.y;
          c.path.shift();
        } else {
          c.x += dx / d * sp;
          c.y += dy / d * sp;
        }
        c.walkT += dt * 3.4;
        c.frame = Math.floor(c.walkT) % 4;
        c.face = Math.atan2(dy, dx);
        c.dir = A.dirOf(c.face);
        continue;
      }
      if (c.state === "use") {
        const s = c.spot;
        if (!s) {
          c.state = "idle";
          continue;
        }
        const k = s.kind;
        c.hop = 0;
        c.squat = 0;
        c.crouch = false;
        c.armPose = null;
        c.bodyPose = null;
        if (k === "run") {
          c.dir = 1;
          c.walkT += dt * 12;
          c.frame = Math.floor(c.walkT) % 8;
          c.bodyPose = "run";
          c.hop = (c.frame & 3) === 1 || (c.frame & 3) === 2 ? 1 : 0;
          c.armPose = H.POSE.run(c.frame);
        } else if (k === "bike") {
          c.dir = 1;
          c.walkT += dt * 9;
          c.frame = Math.floor(c.walkT) % 8;
          c.bodyPose = "ride";
          c.hop = H.RIDE_HOP;
          c.armPose = H.POSE.ride;
        } else if (k === "rope") {
          c.dir = 0;
          const ph = c.anim * 1.6 % 1;
          c.hop = ph > .35 && ph < .65 ? 10 : 0;
          c.frame = 0;
          c.armPose = H.POSE.rope;
        } else if (k === "squat") {
          c.dir = 0;
          c.hop = 0;
          c.squat = Math.max(0, Math.sin(c.anim * 2.2));
          c.frame = 0;
          c.armPose = H.POSE.squat;
        } else if (k === "str") {
          c.dir = 0;
          c.frame = 0;
          c.bodyPose = "lie";
          c.hop = H.BENCH_HOP;
          c.armPose = H.POSE.bench(1 - Math.max(0, Math.sin(c.anim * 2.2)));
        } else if (k === "curl") {
          c.dir = 0;
          c.frame = 0;
          c.armPose = H.POSE.curl(Math.max(0, Math.sin(c.anim * 3 + c.id % 2 * 1.5)), Math.max(0, Math.sin(c.anim * 3 + 1.6 + c.id % 2 * 1.5)));
        } else if (k === "bag") {
          c.dir = 3;
          c.frame = 0;
          const ph = c.anim * 2.4 % 1;
          c.armPose = H.POSE.punch(ph < .35 ? ph / .35 : 0, Math.floor(c.anim * 2.4) % 2, true);
        } else if (k === "stretch") {
          c.dir = 0;
          c.frame = 0;
          c.armPose = H.POSE.stretch(Math.sin(c.anim * 1.3));
        } else if (k === "rest") {
          const st = c.seat || (c.seat = H.seatOf(s.prop, c.id & 1));
          c.frame = 0;
          if (st) {
            c.x = st.x;
            c.y = st.y;
            c.dir = st.dir;
            c.bodyPose = st.pose;
            c.hop = st.hop;
            c.armPose = H.POSE.lap(st.dir);
          } else {
            c.dir = 2;
            c.bodyPose = "sit";
          }
        } else if (k === "drink") {
          const ph = c.anim % 7 / 7;
          c.frame = 0;
          if (ph < .4) {
            c.dir = 1;
            c.armPose = H.POSE.tap;
          } else {
            c.dir = 0;
            c.armPose = ph < .48 ? H.POSE.cupLow : H.POSE.sip;
          }
        } else {
          c.dir = 0;
          c.frame = 0;
        }
        gymCivTick(c, k, dt);
        if (c.t <= 0) H.gymLeave(c);
        continue;
      }
      if (c.t > 0) continue;
      const r = Math.random(), want = r < .8 ? s => s.kind !== "drink" && s.kind !== "rest" : r < .9 ? s => s.kind === "drink" : s => s.kind === "rest";
      const cand = H.gymSpots.filter(s => want(s) && !busy(s));
      const tx = Math.floor(c.x), ty = Math.floor(c.y);
      let go = null;
      for (let tries = 0; tries < 4 && cand.length && !go; tries++) {
        const s = cand.splice(Math.floor(Math.random() * cand.length), 1)[0], path = gymPath(F, G, tx, ty, s.a.x, s.a.y);
        if (path) {
          go = s;
          c.path = path;
        }
      }
      if (go) {
        c.goal = go;
        c.state = "walk";
        c.path.push({
          x: go.a.x + .5,
          y: go.a.y + .5
        });
      } else {
        c.t = 1 + Math.random() * 2;
        c.dir = [ 0, 1, 3, 2 ][Math.random() * 4 | 0];
      }
    }
    if (H.ex) for (const c of H.civs) if (c.state === "idle") H.gymStepAway(c);
  };
  H.POSE = {
    press: t => {
      const y = -23 - Math.round(t * 11);
      return {
        n: [ -8, y ],
        f: [ 8, y ]
      };
    },
    bench: t => {
      const y = H.benchY(t), d = 1 - t;
      return {
        n: [ -10, y ],
        f: [ 10, y ],
        ne: [ -9 - Math.round(5 * d), -27 + Math.round(10 * d) ],
        fe: [ 9 + Math.round(5 * d), -27 + Math.round(10 * d) ]
      };
    },
    squat: {
      n: [ -11, -22 ],
      f: [ 11, -22 ],
      ne: [ -13, -16 ],
      fe: [ 13, -16 ]
    },
    curl: (a, b) => ({
      n: [ -8, -12 - Math.round(a * 8) ],
      f: [ 8, -12 - Math.round(b * 8) ]
    }),
    rope: {
      n: [ -9, -15 ],
      f: [ 9, -15 ]
    },
    run: (fr, dir) => {
      const a = Math.cos(((fr | 0) & 7) * Math.PI / 4), m = dir === 3 ? -1 : 1, sh = SX.pose ? SX.pose.shoulders(dir === 3 ? 3 : 1) : {
        near: [ 0, -21 ],
        far: [ -2, -21 ]
      }, D = Math.PI / 180;
      const one = (s, k) => {
        const tu = (30 * k - 12) * D, tf = tu + (95 + 10 * (1 - k)) * D, ex = s[0] + m * 6 * Math.sin(tu), ey = s[1] + 6 * Math.cos(tu);
        return {
          e: [ Math.round(ex), Math.round(ey) ],
          h: [ Math.round(ex + m * 6 * Math.sin(tf)), Math.round(ey + 6 * Math.cos(tf)) ]
        };
      };
      const n = one(sh.near, -a), f = one(sh.far, a);
      return {
        n: n.h,
        f: f.h,
        ne: n.e,
        fe: f.e
      };
    },
    lap: dir => dir === 1 ? {
      n: [ 9, -11 ],
      f: [ 7, -12 ]
    } : dir === 3 ? {
      n: [ -9, -11 ],
      f: [ -7, -12 ]
    } : {
      n: [ -6, -11 ],
      f: [ 6, -11 ]
    },
    ride: {
      n: [ 10, -19 ],
      f: [ 9, -20 ]
    },
    stretch: s => ({
      n: [ -3 + Math.round(s * 3), -40 ],
      f: [ 3 + Math.round(s * 3), -40 ]
    }),
    punch: (t, alt, left) => {
      const m = left ? -1 : 1, q = alt ? {
        n: [ 5, -23 ],
        f: [ 8 + Math.round(t * 8), -25 ]
      } : {
        n: [ 5 + Math.round(t * 9), -23 ],
        f: [ 7, -25 ]
      };
      return {
        n: [ q.n[0] * m, q.n[1] ],
        f: [ q.f[0] * m, q.f[1] ]
      };
    },
    tap: {
      n: [ 14, -10 ],
      f: [ 2, -13 ],
      cup: "n"
    },
    cupLow: {
      n: [ -5, -19 ],
      f: [ 7, -12 ],
      cup: "n"
    },
    sip: {
      n: [ -2, -27 ],
      f: [ 7, -12 ],
      cup: "n"
    }
  };
  H.SQUAT_X = 1;
  H.SQUAT_Y = 1.625;
  H.RIDE_X = 26 / 32;
  H.RIDE_Y = 1;
  H.RIDE_HOP = 6;
  H.BENCH_HOP = 1;
  H.benchY = t => -19 - Math.round(14 * t);
  H.drawBarNeck = function(ctx, px, y) {
    const b = SX.art.gymBar && SX.art.gymBar();
    if (b) {
      const W = b.c.width, H0 = b.c.height, l = b.cx - 6, r = b.cx + 7;
      ctx.drawImage(b.c, 0, 0, l, H0, px - b.cx, y - b.cy, l, H0);
      ctx.drawImage(b.c, r, 0, W - r, H0, px - b.cx + r, y - b.cy, W - r, H0);
      return;
    }
    ctx.fillStyle = "#6a6e76";
    ctx.fillRect(px - 26, y - 1, 20, 3);
    ctx.fillRect(px + 7, y - 1, 20, 3);
    ctx.fillStyle = "#1e2024";
    ctx.fillRect(px - 30, y - 7, 6, 15);
    ctx.fillRect(px + 24, y - 7, 6, 15);
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(px - 30, y - 7, 6, 1);
    ctx.fillRect(px + 24, y - 7, 6, 1);
  };
  let barImg = null;
  function heldBar() {
    if (barImg !== null) return barImg;
    barImg = false;
    try {
      const s = SX.art.prop("barbell", 0, null, 0), c = s && s.c;
      if (!c) return barImg;
      const W = c.width, HH = c.height, cx = W >> 1, d = c.getContext("2d").getImageData(0, 0, W, HH).data, rows = [];
      for (let y = 0; y < HH; y++) if (d[(y * W + cx + 22) * 4 + 3] > 200 && d[(y * W + cx - 22) * 4 + 3] > 200) rows.push(y);
      if (!rows.length) return barImg;
      const y0 = rows[0], y1 = rows[rows.length - 1], o = SX.art.mk(W, HH), oc = o.getContext("2d"), im = oc.createImageData(W, HH), od = im.data;
      for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
        const far = Math.abs(x - cx) >= 30;
        if (!far && (y < y0 - 1 || y > y1 + 1)) continue;
        const k = (y * W + x) * 4;
        if (!d[k + 3]) continue;
        od[k] = d[k];
        od[k + 1] = d[k + 1];
        od[k + 2] = d[k + 2];
        od[k + 3] = d[k + 3];
      }
      oc.putImageData(im, 0, 0);
      barImg = {
        c: o,
        cx,
        cy: Math.round((y0 + y1) / 2)
      };
    } catch (e) {
      barImg = false;
    }
    return barImg;
  }
  H.drawBar = function(ctx, px, y) {
    const b = heldBar();
    if (b) {
      ctx.drawImage(b.c, px - b.cx, y - b.cy);
      return;
    }
    ctx.fillStyle = "#6a6e76";
    ctx.fillRect(px - 26, y - 1, 52, 3);
    ctx.fillStyle = "#1e2024";
    ctx.fillRect(px - 30, y - 7, 6, 15);
    ctx.fillRect(px + 24, y - 7, 6, 15);
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(px - 30, y - 7, 6, 1);
    ctx.fillRect(px + 24, y - 7, 6, 1);
  };
  H.drawBell = function(ctx, x, y) {
    ctx.fillStyle = "#26282c";
    ctx.fillRect(x - 5, y - 2, 3, 5);
    ctx.fillRect(x + 3, y - 2, 3, 5);
    ctx.fillStyle = "#6a6e76";
    ctx.fillRect(x - 2, y, 5, 1);
  };
  const ROPE_C = {
    f: [ "#e8d8a0", "#c8b47a", "#5a4a2a" ],
    b: [ "#8a7a52", "#76683f", "#3a2e18" ],
    g: [ "#8af080", "#5ac85a", "#1e5a1e" ]
  }, GRIP_C = [ "#b83a2a", "#e06a4a", "#4a1410" ];
  const ropeBlob = (ctx, cells, oc, skip) => {
    const s = new Set(cells.map(c => c[0] + "," + c[1]));
    ctx.fillStyle = oc;
    for (const [x, y] of cells) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const X = x + ox, Y = y + oy;
      if (!s.has(X + "," + Y) && !skip(X, Y)) ctx.fillRect(X, Y, 1, 1);
    }
    for (const [x, y, c] of cells) if (!skip(x, y)) {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  };
  H.drawRope = function(ctx, px, py, ph, near) {
    const a = ph * Math.PI * 2, ca = Math.cos(a), back = Math.sin(a) < 0, hy = py - 15, mid = hy - 24 * ca - 6, w = 2 + 4 * Math.abs(ca), C = near ? ROPE_C.g : back ? ROPE_C.b : ROPE_C.f;
    const hid = (x, y) => {
      if (!back) return false;
      const dx = Math.abs(x - px), dy = y - py;
      return dx <= 6 && dy >= -40 && dy <= -29 || dx <= 7 && dy >= -28 && dy <= -12 || dx <= 5 && dy >= -11 && dy <= 0;
    };
    const yc0 = (8 * mid - 2 * hy) / 6, hands = [ -1, 1 ].map(sd => {
      const dx = sd * w, dy = yc0 - hy, l = Math.hypot(dx, dy) || 1;
      return {
        x: px + sd * 9,
        y: hy,
        ux: dx / l,
        uy: dy / l
      };
    });
    const P0 = [ hands[0].x + hands[0].ux * 5, hands[0].y + hands[0].uy * 5 ], P3 = [ hands[1].x + hands[1].ux * 5, hands[1].y + hands[1].uy * 5 ];
    const yc = (8 * mid - P0[1] - P3[1]) / 6, x1 = P0[0] - w, x2 = P3[0] + w, pts = [], seen = new Set;
    for (let i = 0; i <= 64; i++) {
      const t = i / 64, u = 1 - t, x = Math.round(u * u * u * P0[0] + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * P3[0]), y = Math.round(u * u * u * P0[1] + 3 * u * t * yc + t * t * t * P3[1]), k = x + "," + y;
      if (!seen.has(k)) {
        seen.add(k);
        pts.push([ x, y, C[pts.length >> 1 & 1] ]);
      }
    }
    ropeBlob(ctx, pts, C[2], hid);
    const grip = [];
    for (const h of hands) for (const t of [ -3, -2, 2, 3, 4 ]) {
      const gx = Math.round(h.x + h.ux * t - .5), gy = Math.round(h.y + h.uy * t - .5);
      grip.push([ gx, gy, GRIP_C[0] ], [ gx + 1, gy, GRIP_C[0] ], [ gx, gy + 1, GRIP_C[0] ], [ gx + 1, gy + 1, GRIP_C[0] ]);
    }
    for (const h of hands) {
      const gx = Math.round(h.x + h.ux * 3 - .5), gy = Math.round(h.y + h.uy * 3 - .5);
      grip.push([ gx, gy, GRIP_C[1] ]);
    }
    ropeBlob(ctx, grip, GRIP_C[2], (x, y) => hands.some(h => Math.abs(x - Math.round(h.x)) <= 1 && Math.abs(y - Math.round(h.y)) <= 1));
  };
  H.drawGymCivs = function(ctx, cam) {
    for (const c of H.civs) {
      const s = c.spot;
      if (c.state !== "use" || !s) continue;
      if (SX.render.behindMe) SX.render.behindMe(ctx, cam, c, (g, cm) => gymCivEx(g, cm, c, s)); else gymCivEx(ctx, cam, c, s);
    }
  };
  function gymCivEx(ctx, cam, c, s) {
    const TS = SX.TS;
    {
      const sh = SX.motion ? SX.motion.shift(c) : [ 0, 0 ], px = Math.round(c.x * TS - cam.x) + sh[0], py = Math.round(c.y * TS - cam.y) - (c.hop || 0) + sh[1];
      if (s.kind === "str") H.drawBar(ctx, px, py + H.benchY(1 - Math.max(0, Math.sin(c.anim * 2.2)))); else if (s.kind === "squat") H.drawBarNeck(ctx, px, py - 22 + Math.round((c.squat || 0) * 7)); else if (s.kind === "curl") {
        const up = Math.round(Math.max(0, Math.sin(c.anim * 3 + c.id % 2 * 1.5)) * 8), up2 = Math.round(Math.max(0, Math.sin(c.anim * 3 + 1.6 + c.id % 2 * 1.5)) * 8);
        const hn = SX.motion && SX.motion.handAt(c, "n", cam), hf = SX.motion && SX.motion.handAt(c, "f", cam);
        H.drawBell(ctx, hn ? Math.round(hn[0]) : px - 8, hn ? Math.round(hn[1]) - 1 : py - 13 - up);
        H.drawBell(ctx, hf ? Math.round(hf[0]) : px + 8, hf ? Math.round(hf[1]) - 1 : py - 13 - up2);
      } else if (s.kind === "rope") H.drawRope(ctx, px, py, c.anim * 1.6 % 1, false);
    }
  }
  H.ex = null;
  H.EX = {
    exRun: {
      id: "st",
      name: "러닝머신",
      stat: "체력"
    },
    exStr: {
      id: "str",
      name: "역기",
      stat: "근력"
    },
    exRope: {
      id: "run",
      name: "줄넘기",
      stat: "지구력"
    },
    exBag: {
      id: "hit",
      name: "샌드백",
      stat: "타격"
    }
  };
  const quitKey = In => [ "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].some(k => In.hit.has(k));
  H.exGame = function(role, prop) {
    const nd = (id, b) => SX.ui && SX.ui.gymNeed ? SX.ui.gymNeed(id) : b;
    if (role === "exRun") return {
      role,
      t: 0,
      need: nd("st", 40),
      steps: 0,
      idle: 0,
      speed: 0,
      last: null,
      slipT: 0,
      done: false,
      win: false,
      belt: 0,
      bike: !!(prop && prop.kind === "exBike"),
      tick(dt, In) {
        if (this.done) return;
        this.t += dt;
        this.idle += dt;
        this.slipT = Math.max(0, this.slipT - dt);
        const a = In.hit.has("KeyA") || In.hit.has("ArrowLeft"), d = In.hit.has("KeyD") || In.hit.has("ArrowRight");
        if (a || d) {
          const foot = a ? "L" : "R";
          if (foot !== this.last) {
            this.steps++;
            this.last = foot;
            this.idle = 0;
            this.speed = Math.min(1, this.speed + .35);
            if (!this.bike) SX.audio.play("step", {
              vol: .7,
              w: .8,
              surface: "carpet"
            });
          } else this.slipT = .4;
        }
        this.speed = Math.max(0, this.speed - dt * .9);
        this.belt += this.speed * dt * 6;
        if (this.steps >= this.need) {
          this.done = true;
          this.win = true;
        } else if (this.idle > 1.5 && this.t > 1.5) {
          this.done = true;
          this.win = false;
        }
      }
    };
    if (role === "exStr") return {
      role,
      t: 0,
      lifts: 0,
      need: nd("str", 10),
      cool: 0,
      bar: 0,
      done: false,
      win: false,
      limit: 25,
      tick(dt, In) {
        if (this.done) return;
        this.t += dt;
        this.cool = Math.max(0, this.cool - dt);
        this.bar = Math.max(0, this.bar - dt * 2.2);
        if (this.cool <= 0 && In.hit.has("Space")) {
          this.lifts++;
          this.cool = .45;
          this.bar = 1;
          SX.audio.play("gymBench", {
            vol: .7
          });
          if (this.lifts % 3 === 0 || this.lifts >= this.need - 2) SX.audio.play("gymGrunt", {
            vol: .6,
            delay: .1
          });
        }
        if (this.lifts >= this.need) {
          this.done = true;
          this.win = true;
        } else if (this.t > this.limit) {
          this.done = true;
          this.win = false;
        }
      }
    };
    if (role === "exBag") return {
      role,
      t: 0,
      phase: .1,
      period: .95,
      hits: 0,
      misses: 0,
      need: nd("hit", 10),
      passed: false,
      done: false,
      win: false,
      hitT: 0,
      tick(dt, In) {
        if (this.done) return;
        this.t += dt;
        this.phase += dt / this.period;
        this.hitT = Math.max(0, this.hitT - dt);
        this.slipT = Math.max(0, (this.slipT || 0) - dt);
        if (quitKey(In)) {
          this.done = true;
          this.win = false;
          this.quit = true;
          return;
        }
        if (this.phase >= 1) {
          this.phase -= 1;
          this.passed = false;
        }
        this.near = this.phase >= .38 && this.phase <= .62;
        const hit = In.hit.has("Space") || In.hit.has("Mouse0");
        if (hit && !this.passed) {
          if (this.near) {
            this.passed = true;
            this.hits++;
            this.hitT = .3;
            SX.audio.play("gymBag", {
              vol: 1
            });
            if (SX.render.bagHit) SX.render.bagHit(prop, A.player && prop && A.player.x < prop.x + prop.w / 2 ? 1 : -1);
            if (this.hits >= this.need) {
              this.done = true;
              this.win = true;
            }
          } else {
            this.misses++;
            this.slipT = .5;
            SX.audio.play("gymSwish", {
              vol: .7,
              r: .8
            });
            if (this.misses >= 5) {
              this.done = true;
              this.win = false;
            }
          }
        }
      }
    };
    return {
      role,
      t: 0,
      phase: 0,
      period: 1,
      jumps: 0,
      misses: 0,
      need: nd("run", 12),
      jumpT: 0,
      passed: false,
      done: false,
      win: false,
      tick(dt, In) {
        if (this.done) return;
        this.t += dt;
        this.phase += dt / this.period;
        this.jumpT = Math.max(0, this.jumpT - dt);
        if (quitKey(In)) {
          this.done = true;
          this.win = false;
          this.quit = true;
          return;
        }
        if (this.phase >= 1) {
          this.phase -= 1;
          SX.audio.play("gymSwish", {
            vol: .45
          });
          this.passed = false;
        }
        this.near = this.phase >= .35 && this.phase <= .65;
        if (In.hit.has("Space") && !this.passed) {
          if (this.near) {
            this.passed = true;
            this.jumps++;
            this.jumpT = .35;
            SX.audio.play("gymSlap", {
              vol: .5
            });
            SX.audio.play("gymLand", {
              vol: .7,
              delay: .3
            });
            if (this.jumps >= this.need) {
              this.done = true;
              this.win = true;
            }
          } else {
            this.misses++;
            this.slipT = .5;
            if (this.misses >= 5) {
              this.done = true;
              this.win = false;
            }
          }
        }
        this.slipT = Math.max(0, (this.slipT || 0) - dt);
      }
    };
  };
  H.startExercise = function(role, prop) {
    const U = SX.ui, p = A.player, bike = role === "exRun" && prop && prop.kind === "exBike", d = bike ? H.EX_BIKE : H.EX[role];
    if (!d || H.ex || H.exPay || !p) return false;
    H.exPay = true;
    U.gymPayThen(d.id, ok => {
      H.exPay = false;
      if (ok) H.exBegin(role, prop, d, bike);
    });
    return true;
  };
  H.exBegin = function(role, prop, d, bike) {
    const p = A.player;
    if (H.ex || !p || H.scene !== "gym") return false;
    SX.audio.play("click");
    const bench = role === "exStr" && prop && prop.kind === "barbell", rack = role === "exStr" && prop && prop.kind === "squatRack";
    const px = prop ? role === "exBag" ? prop.x + 1.2 : bench ? prop.x + 1.5 : rack ? prop.x + H.SQUAT_X : bike ? prop.x + H.RIDE_X : prop.x + prop.w * (role === "exRun" ? .4 : .5) : p.x, py = prop ? prop.y + (role === "exRope" ? prop.h / 2 + .3 : bike ? H.RIDE_Y : role === "exRun" ? prop.h * .62 : role === "exBag" ? 1.12 : bench ? 1.9 : rack ? H.SQUAT_Y : prop.h + .15) : p.y;
    H.ex = {
      role,
      d,
      g: H.exGame(role, prop),
      prop,
      x: px,
      y: py,
      doneT: 0,
      fromX: p.x,
      fromY: p.y,
      walkT: 0,
      bike,
      f0: true
    };
    if (prop) for (const c of H.civs) if (c.spot && (c.spot.prop === prop || Math.hypot(c.spot.u.x - px, c.spot.u.y - py) < 1.3)) H.gymLeave(c, "자리 비켜 줄게");
    p.x = px;
    p.y = py;
    p.aim = -Math.PI / 2;
    p.reload = null;
    p.use = null;
    H.exStrip(p);
    const n = H.ex.g.need;
    H.ex.ease = SX.ui.gymEaseTxt ? SX.ui.gymEaseTxt(d.id) : "";
    SX.log("🏋 " + d.name + " — " + (role === "exBag" ? "되돌아오는 샌드백이 가운데(초록)일 때 [Space]·좌클릭, " + n + "번(엉뚱한 때 쳐서 헛손질 5번이면 실패)" : bike ? "[A]·[D] 를 번갈아 눌러 페달을 " + n + "번 밟습니다(1.5초 멈추면 실패)" : role === "exRun" ? "[A]·[D] 를 번갈아 눌러 " + n + "걸음 달립니다(1.5초 멈추면 실패)" : role === "exStr" ? "[Space] 로 " + n + "번 들어 올립니다(25초)" : "줄이 초록(발밑)으로 올 때 [Space], " + n + "번. 아래 막대의 표시가 초록 칸에 오면 누르십시오"), "good");
    if (role === "exRope" || role === "exBag") SX.log("그냥 지나가는 것은 세지 않고 잘못 누른 것만 셉니다 · 그만두려면 이동 키나 [" + SX.label("interact") + "]", "good"); else SX.log("그만두려면 [" + SX.label("interact") + "]", "good");
    return true;
  };
  H.EX_BIKE = {
    id: "st",
    name: "실내 자전거",
    stat: "체력"
  };
  H.exStrip = function(p) {
    const ex = H.ex;
    if (!ex || ex.kit) return;
    ex.kit = p.kit;
    ex.slot = p.slot;
    p.kit = {
      w1: null,
      w2: null,
      melee: null,
      armor: null,
      helmet: null,
      bag: null,
      rig: null,
      quick: SX.items.quickNew()
    };
    p.slot = "melee";
    p.fists = true;
    p.reload = null;
    p.use = null;
    if (SX.ui) SX.ui.hudDirty();
  };
  H.exDress = function(p) {
    const ex = H.ex;
    if (!ex || !ex.kit || !p) return;
    p.kit = ex.kit;
    p.slot = ex.kit[ex.slot] ? ex.slot : ex.kit.w1 ? "w1" : ex.kit.w2 ? "w2" : "melee";
    p.fists = false;
    ex.kit = null;
    if (SX.ui) SX.ui.hudDirty();
  };
  H.exTick = function(dt, In) {
    const ex = H.ex;
    if (!ex) return;
    const p = A.player, U = SX.ui;
    p.x = ex.x;
    p.y = ex.y;
    p.moving = ex.role === "exRun" && ex.g.speed > .05;
    if (ex.role === "exRun") {
      const sp = ex.g.speed;
      ex.walkT += dt * (ex.bike ? 4 + 8 * sp : 6 + 10 * sp) * (sp > .05 ? 1 : 0);
      p.frame = Math.floor(ex.walkT) % 8;
      p.dir = 1;
      if (ex.bike) {
        p.bodyPose = "ride";
        p.hop = H.RIDE_HOP;
        p.armPose = H.POSE.ride;
      } else {
        const go = sp > .05;
        p.bodyPose = go ? "run" : null;
        p.hop = sp > .5 && ((p.frame & 3) === 1 || (p.frame & 3) === 2) ? 1 : 0;
        p.armPose = go ? H.POSE.run(p.frame) : null;
        if (!go) p.frame = 0;
      }
    } else if (ex.role === "exRope") {
      p.dir = 0;
      p.armPose = H.POSE.rope;
    } else if (ex.role === "exBag") {
      p.dir = 3;
      p.aim = Math.PI;
      p.frame = 0;
      const g = ex.g;
      p.armPose = H.POSE.punch(g.hitT > 0 ? Math.min(1, (.3 - g.hitT) / .12 + .4) : g.slipT > .35 ? .8 : 0, (g.hits + (g.misses || 0)) % 2, true);
    } else if (ex.role === "exStr") {
      p.dir = 0;
      p.frame = 0;
      const ph = ex.g.bar > 0 ? Math.sin((1 - ex.g.bar) * Math.PI) : 0;
      if (ex.prop && ex.prop.kind === "barbell") {
        p.bodyPose = "lie";
        p.hop = H.BENCH_HOP;
        p.armPose = H.POSE.bench(1 - ph);
      } else {
        p.bodyPose = null;
        p.hop = 0;
        p.squat = ph;
        p.armPose = H.POSE.squat;
      }
    } else p.dir = 0;
    if (ex.role === "exRun" && !ex.g.done) {
      ex.motT = (ex.motT || 0) - dt;
      if (ex.motT <= 0) {
        ex.motT = 4.2;
        if (!ex.bike) SX.audio.play("gymMotor", {
          vol: .5
        }); else if (ex.g.speed > .05) SX.audio.play("gymBike", {
          vol: .5
        });
      }
    }
    if (!ex.g.done) {
      if (ex.f0) ex.f0 = false; else if (In.pressed("interact")) {
        ex.g.done = true;
        ex.g.win = false;
        ex.g.quit = true;
      }
      if (!ex.g.done) ex.g.tick(dt, In);
      const g = ex.g;
      const nm = ex.d.name;
      const beat = (a, b) => ({
        zones: [ [ a, b, SX.cbc ? SX.cbc("st", "#3a8a3a") : "#3a8a3a" ] ],
        mark: g.phase,
        mc: g.near ? "#fff" : "#ffd26a",
        ticks: 8
      });
      U.mini(Object.assign({
        msg: ex.ease || ""
      }, ex.role === "exBag" ? {
        t: nm,
        rows: [ {
          k: "친 횟수",
          n: g.hits,
          of: g.need
        }, {
          k: "헛손질",
          n: g.misses,
          of: 5,
          x: true
        } ],
        gauge: beat(.38, .62),
        key: [ "Space" ],
        tip: "가운데(초록)일 때",
        now: g.near ? "◀ 지금!" : ""
      } : ex.role === "exRun" ? {
        t: nm,
        rows: [ {
          k: ex.bike ? "페달" : "걸음",
          n: g.steps,
          of: g.need
        } ],
        key: [ "A", "D" ],
        tip: "번갈아",
        warn: g.slipT > 0 ? "같은 발!" : ""
      } : ex.role === "exStr" ? {
        t: nm,
        time: Math.max(0, g.limit - g.t).toFixed(0) + "초",
        rows: [ {
          k: "들어 올림",
          n: g.lifts,
          of: g.need
        } ],
        key: [ "Space" ]
      } : {
        t: nm,
        rows: [ {
          k: "넘은 횟수",
          n: g.jumps,
          of: g.need
        }, {
          k: "헛발",
          n: g.misses,
          of: 5,
          x: true
        } ],
        gauge: beat(.35, .65),
        key: [ "Space" ],
        tip: "줄이 초록(발밑)일 때",
        now: g.near ? "◀ 지금!" : ""
      }));
      if (g.done) {
        const r = U.gymApply(ex.d.id, g.win);
        if (ex.role === "exStr") SX.audio.play("gymRack", {
          vol: .8,
          delay: .2
        });
        SX.audio.play("gymBreath", {
          vol: .6,
          delay: .6
        });
        if (g.win) {
          SX.log("🏋 " + ex.d.name + " 성공 — " + ex.d.stat + " " + r.lv.toFixed(1) + "단계", "good");
          SX.audio.play("buy");
          A.float(H.floor().idx, p.x, p.y - 1.6, "성공!", "#ffd26a");
        } else if (g.quit) {
          SX.log("🏋 " + ex.d.name + " — 그만뒀습니다(이용료는 냈습니다)", "bad");
          A.float(H.floor().idx, p.x, p.y - 1.6, "그만둠", "#c8c0a8");
        } else {
          SX.log("🏋 " + ex.d.name + " 실패 — 다음에 다시 해 보십시오(이용료는 냈습니다)", "bad");
          SX.audio.play("denied");
          A.float(H.floor().idx, p.x, p.y - 1.6, "실패", "#e0514a");
        }
        if (g.quit) U.center(""); else U.mini(g.win ? {
          t: ex.d.name,
          res: "성공!",
          sub: ex.d.stat + " " + r.lv.toFixed(1) + "단계"
        } : {
          t: ex.d.name,
          res: "실패",
          sub: "다음에 다시",
          bad: true
        });
      }
    } else {
      ex.doneT += dt;
      if (ex.doneT > 1.4) {
        H.exDress(p);
        H.exLeave(p);
        U.center("");
      }
    }
  };
  H.exLeave = function(p) {
    const ex = H.ex;
    H.ex = null;
    if (p) {
      p.armPose = null;
      p.bodyPose = null;
      p.hop = 0;
      p.squat = 0;
    }
    if (!ex || !p) return;
    const F = H.floor();
    let x = ex.fromX, y = ex.fromY;
    if (F && !A.free(F, x, y)) {
      for (let r = .3; r < 3; r += .2) {
        let got = false;
        for (let k = 0; k < 16; k++) {
          const a = k / 16 * 6.283, qx = ex.x + Math.cos(a) * r, qy = ex.y + Math.sin(a) * r;
          if (A.free(F, qx, qy)) {
            x = qx;
            y = qy;
            got = true;
            break;
          }
        }
        if (got) break;
      }
    }
    p.x = x;
    p.y = y;
  };
  function drawMarks(ctx, cam, F) {
    const TS = SX.TS, bob = Math.round(Math.sin(performance.now() / 260) * 1.5);
    for (const n of F.npcs || []) {
      const who = n.civ ? n.who : n.role, m = who && H.marks[who];
      if (!m || n.hidden) continue;
      const x = Math.round(n.x * TS - cam.x), y = Math.round(n.y * TS - cam.y) - 52 + bob - (n.hop || 0);
      if (m === "wait") {
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 6, y + 5, 13, 4);
        ctx.fillStyle = "#9aa0a8";
        for (let k = 0; k < 3; k++) ctx.fillRect(x - 5 + k * 4, y + 6, 3, 2);
        continue;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 2, y - 1, 5, 12);
      ctx.fillStyle = m === "claim" ? "#6fe06a" : m === "heli" ? "#5adcff" : "#ffd24a";
      ctx.fillRect(x - 1, y, 3, 6);
      ctx.fillRect(x - 1, y + 8, 3, 2);
    }
  }
  H.gauge = function(ctx, x, y, w, h, zones, mark, mc, ticks) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = "#000";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = "#15181c";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#08090b";
    ctx.fillRect(x, y, w, 1);
    for (const z of zones) {
      const a = x + Math.round(w * Math.max(0, z[0])), b = x + Math.round(w * Math.min(1, z[1]));
      if (b <= a) continue;
      ctx.fillStyle = z[2];
      ctx.fillRect(a, y, b - a, h);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(a, y, b - a, 1);
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(a, y + h - 1, b - a, 1);
    }
    if (ticks) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      for (let k = 1; k < ticks; k++) ctx.fillRect(x + Math.round(w * k / ticks), y + h - 2, 1, 2);
    }
    if (mark == null) return;
    const m = x + Math.round(w * Math.max(0, Math.min(1, mark)));
    ctx.fillStyle = "#000";
    ctx.fillRect(m - 1, y - 1, 3, h + 2);
    ctx.fillRect(m - 3, y - 6, 7, 2);
    ctx.fillRect(m - 2, y - 4, 5, 1);
    ctx.fillRect(m - 1, y - 3, 3, 1);
    ctx.fillRect(m, y - 2, 1, 1);
    ctx.fillStyle = mc || "#fff";
    ctx.fillRect(m, y, 1, h);
    ctx.fillRect(m - 2, y - 5, 5, 1);
    ctx.fillRect(m - 1, y - 4, 3, 1);
    ctx.fillRect(m, y - 3, 1, 1);
  };
  H.drawEx = function(ctx, cam, F) {
    if (H.scene === "market" && H.level && H.floor() === F) drawMarks(ctx, cam, F);
    if (H.scene === "home" && H.gd && H.level && H.floor() === F) H.gdDraw(ctx, cam);
    if (H.scene === "home" && SX.clean && H.level && H.floor() === F) SX.clean.draw(ctx, cam, F);
    if ((H.scene === "home" || H.scene === "visit") && SX.homeUse && H.level && H.floor() === F) SX.homeUse.draw(ctx, cam, F);
    if (H.scene === "range" && H.rangeHelm && H.level && H.floor() === F) for (const pr of F.targets || []) {
      const TS = SX.TS, x = Math.round((pr.x + pr.w / 2) * TS - cam.x), y = Math.round((pr.y + pr.h / 2 - .45) * TS - cam.y), v = pr.target.helm, d = SX.items.def(H.rangeHelm), k = v ? v.armor / (d.armor || 1) : 1;
      ctx.fillStyle = k > .3 ? "#4a5a3a" : "#5a4a3a";
      ctx.fillRect(x - 5, y - 19, 10, 4);
      ctx.fillRect(x - 4, y - 21, 8, 2);
      ctx.fillStyle = "#2a3024";
      ctx.fillRect(x - 6, y - 15, 12, 1);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(x - 6, y - 24, 12, 2);
      ctx.fillStyle = k > .6 ? "#6fe06a" : k > .3 ? "#ffd26a" : "#e0514a";
      ctx.fillRect(x - 6, y - 24, Math.round(12 * Math.max(0, k)), 2);
    }
    if (H.scene === "range" && H.rangeVest && H.level && H.floor() === F) for (const pr of F.targets || []) {
      const TS = SX.TS, x = Math.round((pr.x + pr.w / 2) * TS - cam.x), y = Math.round((pr.y + pr.h / 2 - .45) * TS - cam.y), v = pr.target.vest, d = SX.items.def(H.rangeVest), k = v ? v.armor / (d.armor || 1) : 1;
      ctx.fillStyle = k > .3 ? "#3e4a34" : "#5a4a3a";
      ctx.fillRect(x - 7, y - 6, 14, 14);
      ctx.fillStyle = "#2a3024";
      ctx.fillRect(x - 7, y - 6, 3, 14);
      ctx.fillRect(x + 4, y - 6, 3, 14);
      ctx.fillRect(x - 7, y + 3, 14, 2);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(x - 8, y + 10, 16, 2);
      ctx.fillStyle = k > .6 ? "#6fe06a" : k > .3 ? "#ffd26a" : "#e0514a";
      ctx.fillRect(x - 8, y + 10, Math.round(16 * Math.max(0, k)), 2);
    }
    if (H.scene === "gym" && H.level && H.floor() === F) H.drawGymCivs(ctx, cam);
    if (H.scene === "fish" && SX.fishing && H.level && H.floor() === F) SX.fishing.draw(ctx, cam, F);
    if (H.scene === "home" && SX.homeSurf && SX.homeSurf.work && H.level && H.floor() === F) SX.homeSurf.drawWork(ctx, cam);
    if (SX.meet && SX.meet.drawEx && H.level && H.floor() === F) SX.meet.drawEx(ctx, cam, F);
    const ex = H.ex;
    if (!ex || !H.level || H.floor() !== F) return;
    const TS = SX.TS, g = ex.g, p = A.player;
    const sh = SX.motion ? SX.motion.shift(p) : [ 0, 0 ], px = Math.round(p.x * TS - cam.x) + sh[0], py = Math.round(p.y * TS - cam.y) + sh[1];
    if (ex.role === "exStr") {
      const ph = g.bar > 0 ? Math.sin((1 - g.bar) * Math.PI) : 0, y0 = py - (p.hop || 0);
      if (ex.prop && ex.prop.kind === "barbell") H.drawBar(ctx, px, y0 + H.benchY(1 - ph)); else H.drawBarNeck(ctx, px, y0 - 22 + Math.round(ph * 7));
    } else if (ex.role === "exRope") {
      H.drawRope(ctx, px, py - (g.jumpT > 0 ? 14 : 0), g.phase, g.near);
      if (g.near) {
        ctx.font = "12px Galmuri7";
        ctx.textAlign = "center";
        ctx.fillStyle = "#6fe06a";
        ctx.fillText("지금!", px, py - 48);
      }
      if (g.slipT > 0) {
        ctx.font = "12px Galmuri7";
        ctx.textAlign = "center";
        ctx.fillStyle = "#e0514a";
        ctx.fillText("삐끗", px + 22, py - 30);
      }
    } else if (ex.role === "exBag") {
      const sw = Math.sin(g.phase * Math.PI * 2) * 10;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(px - 16 + Math.round(sw) - 6, py - 46, 12, 3);
      ctx.font = "12px Galmuri7";
      ctx.textAlign = "center";
      if (g.hitT > 0) {
        ctx.fillStyle = "#ffd26a";
        ctx.fillText("퍽!", px - 22, py - 44);
      } else if (g.near) {
        ctx.fillStyle = "#6fe06a";
        ctx.fillText("지금!", px, py - 48);
      }
      if (g.slipT > 0) {
        ctx.fillStyle = "#e0514a";
        ctx.fillText("헛손질", px - 18, py - 30);
      }
    } else if (ex.role === "exRun") {
      const ph = (g.belt || 0) % 1;
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      for (let k = 0; k < 5; k++) {
        const x = px + 18 - (k / 5 + ph) % 1 * 36;
        ctx.fillRect(Math.round(x), py - 3, 1, 6);
      }
      ctx.font = "12px Galmuri7";
      ctx.textAlign = "center";
      ctx.fillStyle = g.last === "L" ? "#6a6e76" : "#ffd26a";
      ctx.fillText("A", px - 14, py + 26);
      ctx.fillStyle = g.last === "R" ? "#6a6e76" : "#ffd26a";
      ctx.fillText("D", px + 14, py + 26);
      if (g.slipT > 0) {
        ctx.fillStyle = "#e0514a";
        ctx.fillText("같은 발", px, py - 30);
      }
    }
  };
  H.gd = null;
  H.gdT = 0;
  H.GD_DUR = 1.3;
  H.gdNow = () => SX.net && SX.net.now ? SX.net.now() : Date.now();
  H.gdRefresh = function(F) {
    const P = SX.prog, s = SX.game.save;
    if (!F || !P.gSummary || !s) return;
    const now = H.gdNow();
    let gs = null;
    for (const p of F.props) {
      const wc = p.furn && p.npc && SX.home.FURN[p.furn.kind];
      if (wc && wc.use === "water") {
        p.npc.name = wc.name + " — " + SX.home.waterLabel(p.furn);
        continue;
      }
      if (p.furn && p.npc && p.furn.kind === P.KITCHEN.stove && P.gasShort) {
        p.npc.name = SX.home.FURN.kitchen.name + " — " + P.gasShort(SX.home.live(p.furn));
        continue;
      }
      if (!p.furn || !P.PLANTERS[p.furn.kind] || !p.npc) continue;
      if (!gs) gs = s.garden = P.gFix(s.garden);
      const o = P.gSummary(gs, p.furn, now);
      let v = P.gVariant(o.codes) + (o.kitLv ? Math.pow(35, o.codes.length) * o.kitLv : 0);
      const g0 = H.gd;
      if (g0 && g0.v0 != null && g0.prop === p && g0.t < .55) v = g0.v0;
      if (p.v !== v) {
        p.v = v;
        F.ver = (F.ver || 0) + 1;
      }
      const kt = o.kit >= 0 ? +(P.gKitOf(gs, p.furn) || {}).t || 0 : 0;
      if (o.kit >= 0 && p._kt === kt && p._kn != null && o.kit < p._kn && !g0) {
        SX.audio.play("kitDrip", {
          x: p.x + p.w / 2,
          y: p.y + p.h / 2,
          vol: .7
        });
        if (A.float) A.float(F.idx, p.x + p.w / 2, p.y - .3, "💧", "#8ac4ee");
      }
      p._kn = o.kit >= 0 ? o.kit : null;
      p._kt = kt;
      const nm = SX.home.FURN[p.furn.kind].name;
      p.npc.name = nm + (o.ripe ? " — 다 자랐습니다 " + o.ripe : o.dead ? " — 시들었습니다 " + o.dead : o.seed || o.dry ? " — 물을 주셔야 합니다" : o.n ? " — 자라는 중" : " — 비어 있습니다") + (o.kit > 0 ? " · 급수기 물 " + o.kit + "병" : o.kit === 0 ? " · 급수기 물이 없습니다" : "");
    }
  };
  H.GD_POSE = {
    plant: (t, side) => {
      const dip = Math.round(Math.sin(t * Math.PI * 3) * 2);
      return side ? {
        n: [ 9, -9 + dip ],
        f: [ 6, -12 ],
        sq: .7
      } : {
        n: [ -5, -9 + dip ],
        f: [ 5, -12 ],
        sq: .7
      };
    },
    water: (t, side) => {
      const tilt = Math.round(Math.min(1, t * 2) * 3);
      return side ? {
        n: [ 11, -20 + tilt ],
        f: [ 4, -15 ],
        sq: 0
      } : {
        n: [ -10, -19 + tilt ],
        f: [ 6, -14 ],
        sq: 0
      };
    },
    harvest: (t, side) => {
      const up = t < .45 ? 0 : Math.min(1, (t - .45) / .4), hy = -8 - Math.round(up * 18);
      return side ? {
        n: [ 8 - Math.round(up * 3), hy ],
        f: [ 5, -13 ],
        sq: .8 * (1 - up)
      } : {
        n: [ -4, hy ],
        f: [ 5, -12 ],
        sq: .8 * (1 - up)
      };
    }
  };
  H.GD_POSE.clear = H.GD_POSE.harvest;
  H.GD_POSE.cook = (t, side) => {
    const a = t * Math.PI * 6, sx = Math.round(Math.cos(a) * 2), sy = Math.round(Math.sin(a) * 1.5);
    return side ? {
      n: [ 10 + sx, -21 + sy ],
      f: [ 6, -17 ],
      sq: 0
    } : {
      n: [ -4 + sx, -21 + sy ],
      f: [ 6, -17 ],
      sq: 0
    };
  };
  H.GD_POSE.chop = (t, side) => {
    const up = Math.round(Math.abs(Math.sin(t * Math.PI * 5)) * 5);
    return side ? {
      n: [ 10, -16 - up ],
      f: [ 5, -14 ],
      sq: 0
    } : {
      n: [ -4, -16 - up ],
      f: [ 6, -14 ],
      sq: 0
    };
  };
  H.GD_POSE.drink = (t, side) => {
    const ph = t < .45 ? 0 : t < .6 ? 1 : 2;
    const q = ph === 0 ? side ? {
      n: [ 12, -17 ],
      f: [ 2, -13 ]
    } : {
      n: [ -6, -17 ],
      f: [ 6, -13 ]
    } : ph === 1 ? {
      n: [ -5, -19 ],
      f: [ 7, -12 ]
    } : {
      n: [ -2, -27 ],
      f: [ 7, -12 ]
    };
    return Object.assign(q, {
      sq: 0,
      cup: "n",
      face: ph === 0 ? null : 0
    });
  };
  H.GD_POSE.gasIn = (t, side) => {
    const push = Math.round(Math.min(1, t / .55) * 3);
    return side ? {
      n: [ 8 + push, -12 ],
      f: [ 6, -10 ],
      sq: .75
    } : {
      n: [ -10, -13 - Math.round(push / 2) ],
      f: [ 5, -11 ],
      sq: .75
    };
  };
  H.GD_POSE.kitOn = (t, side) => {
    const sl = t < .5 ? 0 : Math.round((t - .5) / .5 * 6), dip = t > .5 ? Math.round(Math.abs(Math.sin(t * Math.PI * 6)) * 2) : 0, hy = (t < .5 ? -15 + Math.round(t * 6) : -10) + dip;
    return side ? {
      n: [ 11 - sl, hy ],
      f: [ 5, -12 ],
      sq: .75
    } : {
      n: [ -6 - sl, hy ],
      f: [ 6, -12 ],
      sq: .75
    };
  };
  H.GD_POSE.kitFill = (t, side) => {
    const lift = Math.round(Math.min(1, t / .25) * 5), tilt = t < .25 ? 0 : Math.min(1, (t - .25) / .2);
    return side ? {
      n: [ 10, -18 - lift + Math.round(tilt * 2) ],
      f: [ 6, -15 ],
      sq: .3
    } : {
      n: [ -12, -17 - lift + Math.round(tilt * 2) ],
      f: [ 6, -15 ],
      sq: .3
    };
  };
  H.GD_POSE.kitOff = (t, side) => {
    const pull = t < .5 ? 0 : Math.round((t - .5) / .5 * 5);
    return side ? {
      n: [ 11 - pull, -12 - Math.round(pull / 2) ],
      f: [ 5 - Math.round(pull / 2), -13 ],
      sq: .75
    } : {
      n: [ -6 + pull, -12 - Math.round(pull / 2) ],
      f: [ 6, -13 ],
      sq: .75
    };
  };
  H.TAP = {
    waterCooler: [ 20, 7, 1 ],
    waterStand: [ 19, 18, 1 ]
  };
  H.TAP_ROT = {
    waterCooler: [ null, [ 25, 7, 1 ], [ 11, 7, 1 ], [ 6, 7, 1 ] ]
  };
  H.tapOf = pr => {
    const r = H.TAP_ROT[pr.kind];
    return r && r[(pr.rot | 0) & 3] || H.TAP[pr.kind] || H.TAP.waterCooler;
  };
  H.GD_LEN = {
    cook: 1.8,
    chop: 1.8,
    drink: 2.4,
    gasIn: 1.3,
    kitOn: 1.8,
    kitFill: 1.7,
    kitOff: 1.4
  };
  H.GD_KIT_X = {
    planter: 21,
    planterBig: 54
  };
  H.gdVOf = furn => {
    const F = H.level && H.scene === "home" ? H.floor() : null, pr = F && furn ? F.props.find(q => q.furn && (q.furn === furn || q.furn.id === furn.id)) : null;
    return pr ? pr.v | 0 : null;
  };
  H.gdStart = function(act, furn, r, b) {
    const p = A.player, F = H.level && H.scene === "home" ? H.floor() : null;
    if (!p || !F || !H.GD_POSE[act]) return false;
    const pr = furn ? F.props.find(q => q.furn && (q.furn === furn || q.furn.id === furn.id)) : null;
    if (!pr) return false;
    if (H.gd) H.gdEnd(p);
    const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2, dx = cx - p.x, dy = cy - p.y;
    const dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? dx > 0 ? 1 : 3 : dy > 0 ? 0 : 2;
    H.gd = {
      act,
      t: 0,
      prop: pr,
      dir,
      len: H.GD_LEN[act] || H.GD_DUR,
      slot: b && b.slot != null ? b.slot | 0 : -1,
      crop: r && r.crop ? SX.prog.CROP_KEYS.indexOf(r.crop) : 0,
      worm: !!(r && r.worm),
      hw: !!p.hideWeapon,
      v0: b && b.v0 != null ? b.v0 : null
    };
    p.dir = dir;
    p.aim = dir === 1 ? 0 : dir === 3 ? Math.PI : dir === 0 ? Math.PI / 2 : -Math.PI / 2;
    p.moving = false;
    p.frame = 0;
    p.reload = null;
    p.use = null;
    p.hideWeapon = true;
    H.gdRefresh(F);
    return true;
  };
  H.gdTick = function(dt) {
    const g = H.gd, p = A.player;
    if (!g || !p) {
      H.gd = null;
      return;
    }
    g.t += dt / (g.len || H.GD_DUR);
    if (g.t >= 1) {
      H.gdEnd(p);
      return;
    }
    if (g.v0 != null && g.t >= .55) {
      g.v0 = null;
      H.gdRefresh(H.floor());
    }
    const side = g.dir === 1 || g.dir === 3, q = H.GD_POSE[g.act](g.t, side), m = g.dir === 3 ? -1 : 1;
    const dir = q.face != null ? q.face : g.dir;
    p.dir = dir;
    p.frame = 0;
    p.moving = false;
    p.squat = q.sq || 0;
    const mm = q.face != null ? 1 : m;
    p.armPose = {
      n: [ q.n[0] * mm, q.n[1] ],
      f: [ q.f[0] * mm, q.f[1] ],
      back: true
    };
    if (q.cup) p.armPose.cup = q.cup;
    const tp = g.act === "drink" && g.t < .45 && (H.TAP[g.prop.kind] ? H.tapOf(g.prop) : null);
    if (tp && tp[2]) {
      const T = SX.TS, pr = g.prop, cl = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
      let hy = (pr.y + pr.h) * T - 2 - tp[1] + 10 - p.y * T;
      if (hy > -12) {
        p.squat = 1;
        hy -= 7;
      }
      p.armPose.n = [ cl(pr.x * T + tp[0] - p.x * T, -16, 16), cl(hy, -34, -12) ];
    }
  };
  H.gdEnd = function(p) {
    const g = H.gd;
    H.gd = null;
    if (p) {
      p.armPose = null;
      p.squat = 0;
      if (g) p.hideWeapon = g.hw;
    }
  };
  H.GD_SLOT_X = {
    planter: [ 16 ],
    planterBig: [ 12, 32, 52 ]
  };
  H.gdDraw = function(ctx, cam) {
    const g = H.gd, p = A.player;
    if (!g || !p || !p.armPose) return;
    const TS = SX.TS, px = Math.round(p.x * TS - cam.x), py = Math.round(p.y * TS - cam.y), duck = Math.round(Math.min(1, p.squat || 0) * 7) - (p.hop || 0);
    const hA = SX.motion && SX.motion.handAt(p, "n", cam), hx = hA ? Math.round(hA[0]) : px + p.armPose.n[0], hy = hA ? Math.round(hA[1]) : py + p.armPose.n[1] + duck, pr = g.prop;
    const xs = H.GD_SLOT_X[pr.kind] || [ 16 ], tx = Math.round(pr.x * TS - cam.x) + (g.slot >= 0 && xs[g.slot] != null ? xs[g.slot] : xs[Math.floor(xs.length / 2)]), ty = Math.round((pr.y + pr.h) * TS - cam.y) - 16;
    const L = tx < hx, m = L ? -1 : 1;
    const fly = (x0, y0, ft, arc) => [ Math.round(x0 + (tx - x0) * ft), Math.round(y0 + (ty - y0) * ft - Math.sin(ft * Math.PI) * arc) ];
    if (g.act === "cook") {
      const px0 = Math.round(pr.x * TS - cam.x), by = Math.round((pr.y + pr.h) * TS - cam.y) - 2, potX = px0 + (pr.kind === "kitchen" ? 23 : 56), potY = by - 36;
      ctx.fillStyle = "#1a1b1e";
      ctx.fillRect(hx - 1, hy - 9, 3, 11);
      ctx.fillStyle = "#c8ccd0";
      ctx.fillRect(hx, hy - 8, 1, 9);
      ctx.fillStyle = "#8a9098";
      ctx.fillRect(hx - 2, hy, 5, 2);
      ctx.fillStyle = "rgba(230,236,240,0.55)";
      for (let k = 0; k < 3; k++) {
        const ft = (g.t * 1.6 + k * .33) % 1;
        ctx.fillRect(potX - 4 + k * 4 + Math.round(Math.sin(ft * 6.28 + k) * 2), potY - Math.round(ft * 14), 2, 2);
      }
      return;
    }
    if (g.act === "chop") {
      const px0 = Math.round(pr.x * TS - cam.x), by = Math.round((pr.y + pr.h) * TS - cam.y) - 2, bx = px0 + 17, bY = by - 24, kd = g.dir === 3 ? -1 : 1;
      ctx.fillStyle = "#1a1b1e";
      ctx.fillRect(kd > 0 ? hx - 1 : hx - 9, hy - 1, 11, 3);
      ctx.fillStyle = "#c8ccd0";
      ctx.fillRect(kd > 0 ? hx + 2 : hx - 8, hy, 7, 1);
      ctx.fillStyle = "#3a2a1e";
      ctx.fillRect(hx - 1, hy - 1, 2, 3);
      const n = Math.min(5, Math.floor(g.t * 6));
      ctx.fillStyle = "#5aa05a";
      for (let k = 0; k < n; k++) ctx.fillRect(bx + k * 3, bY - k % 2, 2, 2);
      return;
    }
    if (g.act === "gasIn") {
      if (g.t < .6) {
        const cx = hx - 2, cy = hy - 7;
        ctx.fillStyle = "#4a4e54";
        ctx.fillRect(cx - 1, cy, 7, 8);
        ctx.fillRect(cx + 1, cy - 1, 3, 1);
        ctx.fillStyle = "#c8ccd0";
        ctx.fillRect(cx, cy + 1, 5, 6);
        ctx.fillStyle = "#eef2f4";
        ctx.fillRect(cx + 1, cy + 1, 1, 6);
        ctx.fillStyle = "#d8702a";
        ctx.fillRect(cx, cy + 3, 5, 2);
        ctx.fillStyle = "#2e3034";
        ctx.fillRect(cx + 2, cy - 1, 1, 1);
      }
      return;
    }
    if (g.act === "kitOn" || g.act === "kitFill" || g.act === "kitOff") {
      const flip = pr.kind === "planter" && pr.rot & 2, kx0 = H.GD_KIT_X[pr.kind] != null ? H.GD_KIT_X[pr.kind] : 21, px0 = Math.round(pr.x * TS - cam.x), by = Math.round((pr.y + pr.h) * TS - cam.y) - 2;
      const kx = px0 + (flip ? Math.round(pr.w * TS) - kx0 - 7 : kx0), capX = kx + 3, capY = by - 42;
      const tank = (x, y) => {
        ctx.fillStyle = "#7a8a96";
        ctx.fillRect(x - 1, y - 1, 7, 10);
        ctx.fillStyle = "#dfe6ea";
        ctx.fillRect(x, y, 5, 8);
        ctx.fillStyle = "#f4f8fa";
        ctx.fillRect(x, y, 1, 8);
        ctx.fillStyle = "#b4c0c8";
        ctx.fillRect(x + 4, y, 1, 8);
        ctx.fillStyle = "#383a42";
        ctx.fillRect(x, y + 5, 5, 1);
        ctx.fillStyle = "#1e3a6a";
        ctx.fillRect(x, y - 3, 5, 3);
        ctx.fillStyle = "#2a64b8";
        ctx.fillRect(x + 1, y - 2, 3, 2);
        ctx.fillStyle = "#f0e8c8";
        ctx.fillRect(x + 1, y + 2, 3, 2);
      };
      if (g.act === "kitOn") {
        if (g.t < .5) {
          const ft = Math.max(0, (g.t - .25) / .25), x = Math.round(hx - 2 + (kx + 1 - (hx - 2)) * ft), y = Math.round(hy - 4 + (by - 37 - (hy - 4)) * ft);
          tank(x, y);
          ctx.fillStyle = "#2a2e32";
          ctx.fillRect(x - 2, y + 7, 3, 1);
          ctx.fillRect(x - 3, y + 5, 1, 2);
        } else {
          ctx.fillStyle = "#1a1c20";
          ctx.fillRect(hx - 2, hy - 2, 5, 4);
          ctx.fillStyle = "#2a2e32";
          ctx.fillRect(hx - 1, hy - 1, 3, 2);
          ctx.fillStyle = "#c83a2e";
          ctx.fillRect(hx, hy - 1, 1, 1);
          ctx.fillStyle = "#e4e2da";
          ctx.fillRect(hx + 1, hy, 1, 1);
        }
        return;
      }
      if (g.act === "kitOff") {
        if (g.t >= .5) {
          const ft = Math.min(1, (g.t - .5) / .3), x = Math.round(kx + 1 + (hx - 2 - (kx + 1)) * ft), y = Math.round(by - 37 + (hy - 4 - (by - 37)) * ft);
          tank(x, y);
          ctx.fillStyle = "#2a2e32";
          ctx.fillRect(x + 5, y + 7, 4, 1);
        } else {
          ctx.fillStyle = "#1a1c20";
          ctx.fillRect(hx - 1, hy - 1, 3, 3);
          ctx.fillStyle = "#2a2e32";
          ctx.fillRect(hx, hy, 1, 1);
        }
        return;
      }
      const tilt = g.t < .25 ? 0 : Math.min(1, (g.t - .25) / .2), bx = hx - 2, byy = hy - 10, L2 = capX < hx;
      if (tilt < .5) {
        ctx.fillStyle = "#1e4a7a";
        ctx.fillRect(bx - 1, byy - 2, 6, 13);
        ctx.fillStyle = "#a8d0e4";
        ctx.fillRect(bx, byy + 2, 4, 8);
        ctx.fillStyle = "#4a8ad0";
        ctx.fillRect(bx, byy + 4, 4, 3);
        ctx.fillStyle = "#d4e8f0";
        ctx.fillRect(bx + 1, byy, 2, 2);
        ctx.fillStyle = "#2a64b8";
        ctx.fillRect(bx + 1, byy - 1, 2, 1);
        ctx.fillStyle = "#e8f4fc";
        ctx.fillRect(bx, byy + 2, 1, 3);
      } else {
        const x0 = L2 ? bx - 6 : bx - 2, y0 = byy + 3;
        ctx.fillStyle = "#1e4a7a";
        ctx.fillRect(x0 - 2, y0 - 1, 14, 6);
        ctx.fillStyle = "#a8d0e4";
        ctx.fillRect(x0, y0, 10, 4);
        ctx.fillStyle = "#4a8ad0";
        ctx.fillRect(x0 + 3, y0, 3, 4);
        ctx.fillStyle = "#e8f4fc";
        ctx.fillRect(x0 + 1, y0, 2, 1);
        ctx.fillStyle = "#2a64b8";
        ctx.fillRect(L2 ? x0 - 1 : x0 + 10, y0 + 1, 1, 2);
        const sx = L2 ? x0 - 2 : x0 + 11, sy = y0 + 2;
        ctx.fillStyle = "#7ac0ff";
        for (let k = 0; k < 8; k++) {
          const ft = (g.t * 2.6 + k * .125) % 1, x = Math.round(sx + (capX - sx) * ft), y = Math.round(sy + (capY - sy) * ft - Math.sin(ft * Math.PI) * 3);
          ctx.fillRect(x, y, 1, 2);
        }
        ctx.fillStyle = "#cde4f4";
        ctx.fillRect(capX - 2, capY - 1, 1, 1);
        ctx.fillRect(capX + 2, capY - 2, 1, 1);
      }
      return;
    }
    if (g.act === "drink") {
      if (g.t < .45) {
        const px0 = Math.round(pr.x * TS - cam.x), by = Math.round((pr.y + pr.h) * TS - cam.y) - 2, tp = H.tapOf(pr), sy = by - tp[1];
        ctx.fillStyle = "#7ac0ff";
        ctx.fillRect(px0 + tp[0] + (tp[2] ? 0 : Math.round(g.t * 3)), sy, 1, tp[2] ? Math.max(2, Math.min(40, hy - 4 - sy)) : 4 + Math.round(g.t * 6));
      }
      return;
    }
    if (g.act === "plant") {
      ctx.fillStyle = "#1a1b1e";
      ctx.fillRect(hx - 3, hy - 7, 7, 8);
      ctx.fillStyle = "#e8d8a8";
      ctx.fillRect(hx - 2, hy - 6, 5, 6);
      ctx.fillStyle = "#5e9a3c";
      ctx.fillRect(hx - 1, hy - 4, 3, 2);
      ctx.fillStyle = "#c8b070";
      ctx.fillRect(hx, hy - 6, 1, 1);
      if (g.t > .3) {
        ctx.fillStyle = "#d8c080";
        for (let k = 0; k < 4; k++) {
          const ft = (g.t - .3 - k * .1) / .45;
          if (ft > 0 && ft < 1) {
            const [x, y] = fly(hx + m * 3, hy - 2, ft, 6);
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    } else if (g.act === "water") {
      const bx = hx + (L ? -8 : 0), by = hy - 6, tilt = Math.min(1, g.t * 2);
      ctx.fillStyle = "#1a1b1e";
      ctx.fillRect(bx - 1, by - 1, 10, 8);
      ctx.fillStyle = "#3a7a4a";
      ctx.fillRect(bx, by, 8, 6);
      ctx.fillStyle = "#4e9a5e";
      ctx.fillRect(bx, by, 8, 1);
      ctx.fillStyle = "#2a5a3a";
      ctx.fillRect(bx, by + 5, 8, 1);
      ctx.fillStyle = "#2a5a3a";
      ctx.fillRect(bx + (L ? 6 : 0), by - 2, 2, 2);
      ctx.fillRect(L ? bx - 4 : bx + 8, by + 1 - Math.round(tilt * 2), 4, 2);
      ctx.fillStyle = "#1a1b1e";
      ctx.fillRect(bx + 2, by - 3, 4, 1);
      if (tilt > .5) {
        const sx = L ? bx - 5 : bx + 12, sy = by + 2 - Math.round(tilt * 2);
        ctx.fillStyle = "#7ac0ff";
        for (let k = 0; k < 7; k++) {
          const ft = (g.t * 2.4 + k * .14) % 1;
          const [x, y] = fly(sx, sy, ft, 5);
          ctx.fillRect(x + k % 2, y, 1, 2);
        }
        ctx.fillStyle = "rgba(120,180,255,0.35)";
        ctx.fillRect(tx - 5, ty - 1, 11, 2);
      }
    } else if (g.act === "harvest") {
      const up = g.t < .45 ? 0 : 1, C = [ [ "#8ac85a", "#c8ec9a" ], [ "#d8382a", "#ff6a5a" ], [ "#e04a3a", "#ff9a8a" ], [ "#c8a870", "#e8d0a0" ], [ "#9ad07a", "#d8f0b0" ] ][g.crop] || [ "#8ac85a", "#c8ec9a" ];
      if (up) {
        ctx.fillStyle = "#1a1b1e";
        ctx.fillRect(hx - 3, hy - 4, 7, 7);
        ctx.fillStyle = C[0];
        ctx.fillRect(hx - 2, hy - 3, 5, 5);
        ctx.fillStyle = C[1];
        ctx.fillRect(hx - 1, hy - 2, 2, 1);
        if (g.worm && g.t > .7) {
          ctx.fillStyle = "#c87a7a";
          ctx.fillRect(hx + 3, hy + 1, 4, 1);
          ctx.fillRect(hx + 6, hy, 2, 1);
        }
      }
    } else if (g.act === "clear") {
      const up = g.t < .45 ? 0 : 1;
      if (up) {
        ctx.fillStyle = "#1a1b1e";
        ctx.fillRect(hx - 1, hy - 7, 3, 9);
        ctx.fillStyle = "#7a6a38";
        ctx.fillRect(hx, hy - 6, 1, 7);
        ctx.fillStyle = "#9a8a40";
        ctx.fillRect(hx + m, hy - 5, 2, 1);
        ctx.fillRect(hx - m, hy - 2, 2, 1);
      }
    }
  };
  H.fight = null;
  H.startFight = function(civ) {
    const G = SX.game, F = H.floor(), p = A.player;
    if (H.fight || !F || H.scene !== "market") return false;
    const s = G.save, wins = (s.fights && s.fights.wins) | 0;
    const mid = {
      x: (p.x + civ.x) / 2,
      y: (p.y + civ.y) / 2
    }, open = (cx, cy) => {
      for (let r = 0; r <= 2.6; r += .65) for (let k = 0; k < (r ? 12 : 1); k++) {
        const a = k / 12 * 6.283;
        if (!A.free(F, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8)) return false;
      }
      return true;
    };
    let arena = null, bd = 1e9;
    for (let y = 1; y < F.H - 1; y++) for (let x = 1; x < F.W - 1; x++) {
      const cx = x + .5, cy = y + .5, d = Math.hypot(cx - mid.x, cy - mid.y);
      const tt = F.tile(x, y);
      if (d < bd && (tt === SX.map.T.FLOOR || tt === SX.map.T.GROUND) && open(cx, cy)) {
        bd = d;
        arena = {
          x: cx,
          y: cy
        };
      }
    }
    if (arena) {
      p.x = arena.x - 1.2;
      p.y = arena.y;
      civ.x = arena.x + 1.2;
      civ.y = arena.y;
      p.aim = 0;
    }
    const e = A.spawnEnemy(F, "scav", civ.x, civ.y, new SX.Rng(77 + wins), {
      building: {
        id: "villa",
        diff: 1
      },
      floor: 0
    });
    e.spar = true;
    e.armed = false;
    e.melee = null;
    e.melee2 = true;
    e.meleeDmg = 30 + 2 * Math.min(10, wins);
    e.items = [];
    e.hasArmor = false;
    e.helmet = false;
    e.gun = null;
    e.gunMods = [];
    e.hp = 60 + 10 * Math.min(8, wins);
    e.hpMax = e.hp;
    e.spec = civ.spec;
    e.ai = "chase";
    e.seesP = true;
    e.seenX = p.x;
    e.seenY = p.y;
    e.cool = 1;
    e.civ = civ;
    e.name = civ.name;
    e.windT = null;
    civ.hidden = true;
    civ.state = "idle";
    const bare = {
      w1: null,
      w2: null,
      melee: null,
      armor: null,
      helmet: null,
      bag: null,
      rig: null,
      quick: SX.items.quickNew()
    };
    H.fight = {
      e,
      civ,
      t: 0,
      kit: p.kit,
      slot: p.slot,
      cx: (p.x + e.x) / 2,
      cy: (p.y + e.y) / 2,
      body: {
        hp: p.hp,
        st: p.st,
        stT: p.stT
      }
    };
    p.kit = bare;
    p.slot = "melee";
    p.fists = true;
    p.reload = null;
    p.use = null;
    const ring = H.civs.filter(c => c !== civ && !c.hidden && !c.post), n = ring.length;
    ring.forEach((c, k) => {
      const a = k / Math.max(1, n) * Math.PI * 2 + .3;
      let rr = 2.6, tx = H.fight.cx + Math.cos(a) * rr, ty = H.fight.cy + Math.sin(a) * rr * .8;
      if (!civFree(F, tx, ty)) {
        rr = 3.4;
        tx = H.fight.cx + Math.cos(a) * rr;
        ty = H.fight.cy + Math.sin(a) * rr * .8;
      }
      if (civFree(F, tx, ty) && civGo(F, c, tx, ty, "ringStand")) c.ringC = {
        x: H.fight.cx,
        y: H.fight.cy
      };
    });
    if (SX.view && SX.view.fade) SX.view.fade(() => {}, .35);
    SX.log("👊 " + civ.name + " 와(과) 주먹 싸움 — 장비는 벗어 뒀습니다. 좌클릭·[" + SX.label("melee") + '] 주먹 · 가드 올린 상대는 거의 막습니다 — "!" 하면 물러나 헛치게 하고, "빈틈!" 동안 치십시오(한 번에 기력 14)', "good");
    return true;
  };
  H.fightTick = function(F, dt) {
    const f = H.fight;
    if (!f) return;
    const e = f.e, p = A.player;
    e.recoverT = Math.max(0, (e.recoverT || 0) - dt);
    if (e.windT != null) {
      e.windT -= dt;
      e.swing = Math.max(e.swing, .05);
      e.face = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.windT <= 0) {
        e.windT = null;
        e.swing = .22;
        const d = Math.hypot(p.x - e.x, p.y - e.y), ang = Math.atan2(p.y - e.y, p.x - e.x);
        let whiff = false;
        if (d < 1.35) {
          A.hurtPlayer(e.meleeDmg, e.name + "의 주먹에 맞았습니다", false, ang, "melee");
          A.float(F.idx, p.x, p.y - 1.6, "퍽!", "#ffd26a");
          SX.audio.play("punch", {
            vol: .8
          });
        } else {
          whiff = true;
          A.float(F.idx, e.x, e.y - 1.6, "휙 — 빈틈!", "#8fd0ea");
          SX.audio.play("melee", {
            vol: .35
          });
        }
        e.cool = .9 + Math.random() * .5;
        e.recoverT = whiff ? 1 : 0;
        if (whiff) e.blockN = 0;
      }
    }
  };
  H.endFight = function(win) {
    const f = H.fight;
    if (!f) return;
    H.fight = null;
    const s = SX.game.save, F = H.floor(), p = A.player;
    if (!s.fights) s.fights = {
      wins: 0,
      losses: 0
    };
    f.e.alive = false;
    f.e.dead = false;
    const k = A.enemies.indexOf(f.e);
    if (k >= 0) A.enemies.splice(k, 1);
    f.civ.hidden = false;
    f.civ.x = f.e.x;
    f.civ.y = f.e.y;
    f.civ.state = "idle";
    f.civ.t = 4;
    f.civ.path = null;
    if (F) H.civOut(F, f.civ);
    if (f.kit) {
      p.kit = f.kit;
      p.slot = f.kit.w1 ? "w1" : f.kit.w2 ? "w2" : "melee";
    }
    for (const c of H.civs) {
      if (c.state === "ringStand" || c.next === "ringStand") {
        c.state = "idle";
        c.next = null;
        c.t = 1 + Math.random() * 3;
        c.ringC = null;
        c.path = null;
        c.legAny = false;
      }
    }
    if (win) {
      s.fights.wins++;
      SX.log("👊 이겼습니다 — " + f.civ.name + " 이(가) 손을 들었습니다. 전적 " + s.fights.wins + "승 " + s.fights.losses + "패 · 근접 치명타 " + (A.meleeCrit() * 100).toFixed(2) + "%", "good");
      A.float(F.idx, f.e.x, f.e.y - 1.4, "항복!", "#ffd26a");
    } else {
      s.fights.losses++;
      SX.log("👊 졌습니다 — 눈앞이 캄캄했습니다. 전적 " + s.fights.wins + "승 " + s.fights.losses + "패", "bad");
    }
    const b0 = f.body || {
      hp: 100,
      st: 100,
      stT: 0
    };
    p.hp = b0.hp;
    p.st = b0.st;
    p.stT = b0.stT;
    p.hurtT = 0;
    p.swing = 0;
    p.alive = true;
    p.fists = false;
    if (p.slot === "melee" && !s.kit) {}
    SX.game.persist();
    if (SX.ui) SX.ui.hudDirty();
  };
  H.enter = function(scene, keepPos) {
    const G = SX.game;
    if (scene === "home" && !H._rebuilding && !keepPos) setTimeout(() => {
      if (H.scene === "home" && SX.game.state === "hub") H.facNote();
    }, 0);
    if (H.fight) H.endFight(false);
    if (H.ex) {
      H.exDress(A.player);
      H.exLeave(A.player);
      if (SX.ui.center) SX.ui.center("");
    }
    if (H.gd) H.gdEnd(A.player);
    if (SX.clean) SX.clean.stop(true);
    if (SX.fishing && SX.fishing.on) SX.fishing.stop(true);
    if (SX.homeUse) SX.homeUse.stop(true);
    scene = scene || H.scene || "home";
    if (scene === "visit" && !(SX.visit && SX.visit.cur)) scene = "home";
    if (scene !== "visit" && SX.visit) SX.visit.leave();
    const old = A.player;
    if (SX.home.deco && !H._rebuilding) SX.home.stopDeco(true);
    if (scene === "range" && G.save && SX.map.rangeRec) SX.map.rangeRec(G.save);
    if (scene === "range" && H.scene !== "range") H.rangeKit = SX.items.kitDump(G.kit); else if (scene !== "range" && H.scene === "range" && H.rangeKit) {
      G.kit = G.save.kit = SX.items.kitFrom(H.rangeKit);
      H.rangeKit = null;
      SX.log("사격장 물건은 두고 나왔습니다 — 장비는 들어갈 때 그대로입니다");
    }
    const prevScene = H.scene;
    H.scene = scene;
    H.level = build(scene);
    if (scene === "home") H.level.homeTier = G.save.home.tier | 0;
    if (SX.decoHub) {
      if (scene === "visit" && SX.visit) SX.visit.deco(H.level); else SX.decoHub.apply(H.level, scene);
    }
    const F = H.level.floors[0];
    A.enemies = [];
    A.allies = [];
    A.bullets = [];
    A.nades = [];
    A.parts = [];
    A.texts = [];
    A.thrown = [];
    if (SX.tac) SX.tac.reset();
    let sx = F.spawn.x, sy = F.spawn.y;
    if (scene === "market" && (prevScene === "range" || prevScene === "gym" || prevScene === "fish")) {
      const d = (F.doors || []).find(q => prevScene === "range" ? q.range : prevScene === "fish" ? q.fish : q.gym);
      if (d) {
        const cx = d.cx != null ? d.cx : d.x + .5, cy = d.cy != null ? d.cy : d.y + (d.len || 1) / 2, side = d.x < F.W / 2 ? 1 : -1;
        for (let k = 0; k < 8; k++) {
          const tx = cx + side * (1.1 + k * .3);
          if (A.free(F, tx, cy)) {
            sx = tx;
            sy = cy;
            break;
          }
        }
      }
    }
    A.newPlayer(G.kit, keepPos && old ? old.x : sx, keepPos && old ? old.y : sy, 0);
    A.player.torch = false;
    if (scene === "home" && SX.home.fixLoose) SX.home.fixLoose(F);
    if (scene === "home" && SX.top) SX.top.tidy(G.save.home, SX.home.deco && SX.home.deco.sel);
    if (scene === "home" && H.gdRefresh) {
      H.gdT = 1;
      H.gdRefresh(F);
    }
    if (scene === "gym" || scene === "fish") A.player.hideWeapon = true;
    H.markT = 0;
    G.env = {
      night: scene !== "range",
      rain: scene === "market" || scene === "range" || scene === "fish" ? 0 : .3,
      flashT: 0,
      hub: true
    };
    if (scene === "home" || scene === "visit") {
      H.todT = 1;
      H.dayNow(true);
    }
    for (const n of F.npcs || []) {
      n.kind = "npc";
      n.frame = 0;
      n.alive = true;
      n.floor = 0;
    }
    if (scene === "market") H.spawnCivs(F); else if (scene === "gym") H.spawnGymCivs(F); else if (scene === "fish" && SX.fishing) H.civs = SX.fishing.spawnAnglers(F); else H.civs = [];
    if (scene === "market" || scene === "gym") H.warmCivs(F, scene);
    SX.light.box = null;
    SX.light.visF = null;
    SX.audio.music(false);
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
  };
  H.relink = function() {
    if (H.scene !== "home" || !H.level || SX.game.state !== "hub") return false;
    const F = H.floor(), home = SX.game.save.home, byId = new Map(home.furn.map(f => [ f.id, f ]));
    const props = F.props.filter(p => p.furn), placed = home.furn.filter(f => f.placed);
    let same = props.length === placed.length && (home.tier | 0) === (H.level.homeTier | 0);
    if (same) for (const p of props) {
      const nf = byId.get(p.furn.id);
      if (!nf || !nf.placed || nf.kind !== p.furn.kind || nf.x !== p.furn.x || nf.y !== p.furn.y || (nf.rot | 0) !== (p.furn.rot | 0) || (nf.v | 0) !== (p.furn.v | 0)) {
        same = false;
        break;
      }
    }
    if (SX.home.deco) {
      const d = SX.home.deco;
      if (d.sel) d.sel = byId.get(d.sel.id) || null;
      if (d.hover) d.hover.hl = false;
      d.hover = null;
    }
    if (!same) {
      H.rebuild(true);
      return true;
    }
    for (const p of props) {
      const nf = byId.get(p.furn.id);
      p.furn = nf;
      if (p.npc) p.npc.furn = nf;
      p.items = nf.items || null;
      p.col = nf.col || null;
    }
    for (const p of F.props.slice()) if (p.cont && p.cont.home) SX.map.removeProp(F, p);
    for (const l of home.loose || []) SX.home.placeLoose(F, l);
    if (H.gd && H.gd.prop && H.gd.prop.furn) H.gd.prop = props.find(p => p.furn.id === H.gd.prop.furn.id) || H.gd.prop;
    F.ver = (F.ver || 0) + 1;
    return true;
  };
  H.rebuild = function(keep) {
    if (H.scene !== "home") return;
    H._rebuilding = true;
    try {
      H.enter("home", keep);
    } finally {
      H._rebuilding = false;
    }
    if (SX.home.deco) {
      SX.home.deco.hover = null;
      SX.ui.renderDeco();
    }
  };
  H.facNote = function() {
    const P = SX.prog, s = SX.game.save, fs = s && s.fac;
    if (!P || !fs || !P.facItems || !P.FAC) return "";
    const now = Date.now(), sum = new Map, per = [];
    for (const f of P.FAC) {
      if (f.addon || !P.facLevel(fs, f.id)) continue;
      const L = P.facItems(fs, f.id, now).filter(q => q[1] > 0);
      if (L.length) per.push(L);
    }
    for (let i = 0; per.some(L => L[i]); i++) for (const L of per) if (L[i]) sum.set(L[i][0], (sum.get(L[i][0]) || 0) + L[i][1]);
    if (!sum.size) return "";
    const parts = [ ...sum ].map(([n, k]) => n + " " + k), list = parts.slice(0, 4).concat(parts.length > 4 ? [ "…" ] : []).join(" · ");
    const msg = "설비 — " + list + " 준비됨";
    if (H._facNote === msg && now - (H._facNoteAt || 0) < 12e4) return msg;
    H._facNote = msg;
    H._facNoteAt = now;
    SX.log(msg, "good");
    return msg;
  };
  H.travel = function(scene) {
    SX.ui.closePanel();
    const msg = {
      market: "🏪 시장 — 상인에게 [" + SX.label("interact") + "] 로 말을 걸어 보십시오",
      range: "🧪 사격장 — 여기선 쏴도 됩니다. 관리대에서 총·파츠를 고르시면 됩니다(예비탄 무한 · 장전은 해야 합니다). 투척물도 무한입니다 — [" + SX.label("grenade") + "] 로 쥐고 좌클릭을 눌렀다 놓으시면 됩니다",
      gym: "🏋 헬스장 — 기구 앞에서 [" + SX.label("interact") + "]. 기구마다 한 번에 이용료 " + SX.ui.GYM_FEE / 1e4 + "만 원(실패해도 돈은 나갑니다), 해내면 그 능력이 0.1단계 오릅니다",
      fish: "🎣 한강 낚시터 — 가방 · 리그에 낚싯대를, 가방 · 리그 · 조과통에 지렁이를 넣고 물가에서 [" + SX.label("interact") + "]. 낚싯대 · 지렁이는 낚시 가게에서, 잡은 물고기는 모닥불에 굽거나 브로커에게 팝니다",
      home: "🏠 셸터로 돌아왔습니다"
    }[scene] || "";
    SX.view.fade(() => {
      H.enter(scene);
      SX.view.snap();
      if (msg) SX.log(msg);
      SX.game.persist();
      if ((scene === "market" || scene === "home") && SX.prog.stNow) {
        const now = SX.prog.stNow(SX.game.save.story, SX.ui.storyHands ? SX.ui.storyHands() : null), W0 = SX.prog.ST_WHO;
        if (now && (now.state === "claim" || !(SX.qhide && SX.qhide.has("s", now.m.id)))) SX.log(now.state === "accept" ? "★ 이야기 — 장터의 " + W0[now.m.who] + "에게 말을 걸어 보십시오" : now.state === "claim" ? "★ 임무 「" + now.m.name + "」 다 했습니다 — 장터의 " + W0[now.m.who] + "에게" : "★ 임무 「" + now.m.name + "」 — " + now.m.brief, now.state === "claim" ? "good" : undefined);
      }
      if (scene === "gym" && SX.ui.bigNote) SX.ui.bigNote("헬스장 — 기구마다 이용료 " + SX.ui.GYM_FEE / 1e4 + "만 원", "한 번 할 때마다 돈이 나갑니다 · 성공하면 그 능력 +0.1단계(실패해도 이용료는 안 돌려줍니다)", SX.ui.NOTE_MS);
    }, .35);
  };
  H.canSleep = () => (SX.game.save.nap | 0) > 0;
  H.sleep = function() {
    const s = SX.game.save;
    if (!H.canSleep()) {
      SX.audio.play("denied");
      SX.log("잠이 안 옵니다 — 한 판(" + Math.round(SX.game.NAP_SECS / 60) + "분 넘게) 다녀와야 다시 잘 수 있습니다(탈출하든 의식을 잃든 한 번)", "warn");
      return false;
    }
    s.nap = 0;
    SX.items.restock(s);
    SX.audio.play("rustle", {
      vol: .6
    });
    SX.view.fade(() => {
      SX.log("🌙 한숨 잤습니다 — 시장 좌판에 새 물건이 들어왔습니다(다음 잠은 한 판 다녀온 뒤에)", "good");
      SX.game.persist();
      if (SX.settle) SX.settle.dayWin();
    }, .6);
    return true;
  };
  H.floor = () => H.level.floors[0];
  H.dayNow = function(force) {
    const fl = H.level && H.level.floors;
    if (!fl || !SX.game.env) return;
    let tod = "night";
    try {
      if (SX.ui && SX.ui.todNow) tod = SX.ui.todNow();
    } catch (e) {}
    const night = !(tod === "day" && fl.some(f => f.out && f.out.sky));
    if (!force && night === !!SX.game.env.night) return;
    SX.game.env.night = night;
    if (SX.homeOut && SX.homeOut.setDay) for (const f of fl) SX.homeOut.setDay(f, !night);
  };
  H.RANGE_FRESH_MS = 8e3;
  H.rangeRefresh = function(F, now) {
    now = now || performance.now();
    for (const pr of F && F.targets || []) {
      const t = pr.target;
      if (!t || !(t.vest || t.helm)) continue;
      const worn = t.vest && t.vest.armor < (t.vest.armorMax || t.vest.armor) || t.helm && t.helm.armor < (t.helm.armorMax || t.helm.armor);
      if (!worn || now - (t.armorAt || 0) < H.RANGE_FRESH_MS) continue;
      t.vest = null;
      t.helm = null;
      A.float(F.idx, pr.x + pr.w / 2, pr.y - .6, "새 방탄", "#9ad0ff");
    }
  };
  H.update = function(dt, ctl) {
    const F = H.floor(), p = A.player;
    SX.light.update(dt);
    const fishing = SX.fishing && H.scene === "fish";
    A.updatePlayer(dt, F, ctl && !H.ex && !(fishing && SX.fishing.on) && !H.gd && !(SX.clean && SX.clean.busy()) && !(SX.homeUse && SX.homeUse.cur) && !H.stairGo);
    if (H.stairGo) H.stairTick(dt);
    if (H.ex) H.exTick(dt, SX.input);
    if (H.scene === "home" || H.scene === "visit") {
      H.todT = (H.todT || 0) - dt;
      if (H.todT <= 0) {
        H.todT = 1;
        H.dayNow(false);
      }
    }
    if (H.scene === "home") {
      H.gdT = (H.gdT || 0) - dt;
      if (H.gdT <= 0) {
        H.gdT = 1;
        H.gdRefresh(F);
      }
      if (H.gd) H.gdTick(dt);
    }
    if (SX.homeUse) SX.homeUse.update(dt, F, ctl);
    if (H.scene === "home" && SX.clean) SX.clean.update(dt, F, ctl);
    if (H.secHold) H.secHoldTick();
    if (fishing) SX.fishing.update(F, dt, SX.input, ctl);
    A.updateProjectiles(dt, H.level);
    if (H.scene === "range") H.rangeRefresh(F);
    if (H.scene === "range" && SX.tac) {
      if (ctl && !H.ex && SX.input.pressed("brick")) SX.tac.takeBrick(p);
      A.updateThrown(F, dt);
      SX.tac.update(dt, H.level, ctl && !H.ex);
    }
    if (SX.home.deco) SX.home.updateDeco(dt);
    if (H.scene === "home") SX.home.sweepLoose(F);
    for (const n of F.npcs || []) {
      if (n.civ) continue;
      n.idle = (n.idle || Math.random() * 5) - dt;
      if (n.idle <= 0) {
        n.idle = 2 + Math.random() * 4;
        n.dir = [ 0, 1, 3, 0, 2 ][Math.random() * 5 | 0];
      }
    }
    if (H.scene === "gym") H.updateGymCivs(F, dt);
    if (H.scene === "market") {
      H.markT -= dt;
      if (H.markT <= 0) {
        H.markT = .5;
        H.marks = SX.ui && SX.ui.storyMarks ? SX.ui.storyMarks() : {};
      }
    }
    if (H.scene === "market") {
      H.updateCivs(F, dt);
      if (H.fight) {
        const e = H.fight.e;
        e.seesP = true;
        e.fsT = 1e9;
        e.leash = null;
        e.pT = null;
        if (e.ai !== "chase") e.ai = "chase";
        A.updateEnemies(dt, H.level, SX.game.env);
        H.fightTick(F, dt);
        if (H.fight) H.fight.t += dt;
        if (H.fight && (Math.hypot(e.x - p.x, e.y - p.y) > 14 || H.fight.t > 60)) {
          H.endFight(false);
        }
      }
    }
    SX.audio.listener.x = p.x;
    SX.audio.listener.y = p.y;
    const inside = !!F.inside[F.i(Math.floor(p.x), Math.floor(p.y))];
    const fires = F.lamps.filter(l => l.flicker);
    const fireD = fires.length ? Math.min(...fires.map(l => Math.hypot(l.x - p.x, l.y - p.y))) : 99;
    const river = H.scene === "fish";
    const hk = (H.scene === "home" || H.scene === "visit") && SX.homeOut ? SX.homeOut.KIND[H.level.homeTier | 0] : null, deep = hk === "under" && (H.level.homeTier | 0) !== 1;
    SX.audio.ambient({
      rain: H.scene === "market" || H.scene === "range" || river || deep ? 0 : .18,
      inside: H.scene !== "market" && !river || inside,
      wind: H.scene === "market" ? .2 : river ? .45 : hk === "high" ? .22 : hk === "roofs" ? .14 : deep ? 0 : .05,
      fire: Math.max(0, 1 - fireD / 8),
      gym: H.scene === "gym" ? 1 : 0,
      river: river ? 1 : 0,
      market: H.scene === "market" ? 1 : 0,
      city: H.scene === "market" ? .7 : H.scene === "range" ? .5 : H.scene === "gym" ? 0 : river ? .25 : .15
    });
    if (H.scene === "market" && Math.random() < dt / 30) SX.audio.play("dogBark", {
      x: p.x + (Math.random() - .5) * 60,
      y: p.y + (Math.random() - .5) * 60,
      range: 55,
      vol: .3
    });
    for (const t of F.targets || []) if (t.target.hitT > 0) t.target.hitT -= dt;
  };
  H.marks = {};
  H.markT = 0;
  const markTail = who => {
    const m = who && H.scene === "market" ? H.marks[who] : null;
    return m === "claim" ? " ★ 임무 넘기기" : m === "accept" ? " ★ 할 말이 있는 듯합니다" : "";
  };
  const wishTail = role => H.scene === "market" && SX.ui && SX.ui.wishIn && SX.ui.wishIn(role).length ? " · ★ 찜한 물건" : "";
  const wishDoor = () => {
    const w = SX.game.save && SX.game.save.wishNew;
    return Array.isArray(w) && w.length ? " · ★ 장터에 찜한 물건" : "";
  };
  H.target = function() {
    if (SX.home.deco) return null;
    if (H.ex || H.stairGo) return null;
    if (SX.fishing && SX.fishing.on) return null;
    if (H.gd) return null;
    if (SX.homeUse && SX.homeUse.cur) return SX.homeUse.selfTarget();
    const F = H.floor(), p = A.player;
    if (H.scene === "home" && SX.clean && SX.clean.job) return SX.clean.target(F, p, 0, 0, null, null);
    {
      const st = H.stairAt(F, p);
      if (st) return st;
    }
    const K = SX.pick, C = K ? [] : null, by = p.y - .2;
    let best = null, bd = 2.2;
    const ax = p.x + Math.cos(p.aim) * .3, ay = p.y - .2 + Math.sin(p.aim) * .3;
    if (H.scene === "fish" && SX.fishing) {
      const t = SX.fishing.target(F, p, C);
      if (t) {
        bd = t.d;
        best = t;
      }
    }
    for (const n of F.npcs || []) {
      if (n.civ) continue;
      const dm = Math.hypot(ax - n.x, ay - n.y), ds = Math.hypot(ax - n.stall.x, ay - n.stall.y - .5) - .8, d0 = C ? Math.min(Math.hypot(p.x - n.x, by - n.y), Math.hypot(p.x - n.stall.x, by - n.stall.y - .5) - .8) : 9;
      if (Math.min(dm, ds) >= bd && d0 >= 2.5) continue;
      const sp = n._stp !== undefined ? n._stp : n._stp = F.props.find(q => q.kind === "stall" && Math.abs(q.x + 1.5 - n.stall.x) < .01 && Math.abs(q.y + 1 - n.stall.y) < .01) || null;
      const om = {
        kind: "talk",
        npc: n,
        x: n.x,
        y: n.y - 1.4,
        label: n.name + " — 말 걸기" + markTail(n.role)
      };
      const os = {
        kind: "npc",
        npc: n,
        stall: true,
        x: sp ? sp.x + sp.w / 2 : n.stall.x,
        y: sp ? sp.y - .3 : n.stall.y - 1.4,
        label: n.name + " — 가게 보기" + wishTail(n.role)
      };
      if (d0 < 2.5) {
        C.push({
          t: om,
          b: [ K.manBox(n.x, n.y) ]
        });
        C.push({
          t: os,
          b: [ sp ? K.propBox(sp) : [ n.stall.x - 1.5, n.stall.y - 1.6, n.stall.x + 1.5, n.stall.y + 1 ] ]
        });
      }
      if (dm < bd && dm <= ds) {
        bd = dm;
        best = om;
      } else if (ds < bd) {
        bd = ds;
        best = os;
      }
    }
    for (const pr of F.props) {
      if (!pr.npc || pr.kind === "stall") continue;
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
      const d = Math.hypot(Math.max(Math.abs(ax - cx) - pr.w / 2, 0), Math.max(Math.abs(ay - cy) - pr.h / 2, 0)), d0 = C ? Math.hypot(Math.max(Math.abs(p.x - cx) - pr.w / 2, 0), Math.max(Math.abs(by - cy) - pr.h / 2, 0)) : 9;
      if (d < Math.min(bd, 1.4) || d0 < 1.7) {
        const o = {
          kind: "npc",
          npc: pr.npc,
          prop: pr,
          x: cx,
          y: pr.y - .3,
          label: pr.npc.name
        };
        if (d0 < 1.7) C.push({
          t: o,
          b: [ K.propBox(pr) ],
          flat: !!pr.flat,
          rug: !!pr.flat
        });
        if (d < Math.min(bd, 1.4)) {
          bd = d;
          best = o;
        }
      }
    }
    let bD = null, dD = 1e9;
    for (const d of F.doors) {
      if (d.stair) continue;
      const dr = K ? K.doorDist(F, p, d) : Math.hypot(ax - d.cx, ay - d.cy) < 1.6 ? 0 : Infinity;
      if (dr === Infinity) continue;
      const dd = Math.hypot(ax - d.cx, ay - d.cy), o = {
        kind: "door",
        door: d,
        x: d.cx,
        y: d.cy - 1,
        label: d.secret ? d.open ? "책장 닫기" : p.y > d.cy ? (SX.home.FURN.secretShelf || {}).name || "책장" : "책장 밀기" : d.home ? "밖으로(도심 지도)" + wishDoor() : d.range ? "사격장 들어가기" : d.gym ? "헬스장 들어가기" : d.fish ? "한강 낚시터 내려가기" : d.back ? "장터로 나가기" : d.market ? "장터 나가기(도심 지도)" : d.open ? "문 닫기" : "문 열기"
      };
      if (C) C.push({
        t: o,
        b: [ K.doorBox(d) ]
      });
      if (dd < dD) {
        dD = dd;
        bD = o;
      }
    }
    if (bD && (!best || dD < Math.min(bd, 1.6))) {
      bd = Math.min(bd, dD);
      best = bD;
    }
    for (const c of H.civs) {
      if (c.hidden || H.fight) continue;
      if (c.spot && c.spot.prop.npc) continue;
      const d = Math.hypot(ax - c.x, ay - (c.y - .4)), d0 = C ? Math.hypot(p.x - c.x, by - (c.y - .4)) : 9;
      if (d < Math.min(bd, 1.3) || d0 < 1.6) {
        const o = {
          kind: "civ",
          civ: c,
          x: c.x,
          y: c.y - 1.5,
          label: c.name + " — 말 걸기" + markTail(c.who)
        };
        if (d0 < 1.6) C.push({
          t: o,
          b: [ K.manBox(c.x, c.y) ]
        });
        if (d < Math.min(bd, 1.3)) {
          bd = d;
          best = o;
        }
      }
    }
    for (const pr of F.props) {
      if (!pr.cont || !pr.cont.grid.list.length) continue;
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2, d = Math.hypot(ax - cx, ay - cy), d0 = C ? Math.hypot(p.x - cx, by - cy) : 9;
      if (d < Math.min(bd, 1.6) || d0 < 1.9) {
        const o = {
          kind: "cont",
          prop: pr,
          x: cx,
          y: pr.y - .3,
          label: H.scene === "visit" ? "바닥에 둔 것 — 열어 보기" : "바닥에 둔 것 줍기"
        };
        if (d0 < 1.9) C.push({
          t: o,
          b: [ K.propBox(pr) ],
          flat: true
        });
        if (d < Math.min(bd, 1.6)) {
          bd = d;
          best = o;
        }
      }
    }
    if (H.scene === "home" && SX.clean) {
      const nb = best && best.kind === "door" && best === bD && dD >= 1.6 ? null : best;
      const c = SX.clean.target(F, p, ax, ay, nb, nb ? bd : null, C);
      if (c !== undefined) best = c;
    }
    return K ? K.choose(best, C, p) : best;
  };
  H.nearConts = function(r) {
    const p = A.player, F = H.level && H.scene === "home" ? H.floor() : null;
    if (!p || !F) return [];
    r = r || 2.2;
    const out = [];
    for (const pr of F.props) {
      if (!pr.cont || !pr.cont.home || !pr.cont.grid.list.length) continue;
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2, d = Math.hypot(cx - p.x, cy - p.y);
      if (d <= r) out.push({
        cont: pr.cont,
        prop: pr,
        d
      });
    }
    out.sort((a, b) => a.d - b.d);
    return out;
  };
  H.stairAt = function(F, p) {
    if (H.stairGo || !p || !F.stairs) return null;
    for (const s of F.stairs) {
      if (!s.home || F.seeOff && F.seeOff(Math.floor(s.x), Math.floor(s.y))) continue;
      const up = s.dir === "up", inS = p.x >= s.x - .2 && p.x <= s.x + s.w + .2 && p.y >= s.y - .2 && p.y <= s.y + s.h + (up ? .75 : .2), side = !up && p.x >= s.x - 1 && p.x < s.x && p.y >= s.y - .2 && p.y <= s.y + 1.2;
      if (inS || side) return {
        kind: "stair",
        s,
        x: s.x + s.w / 2,
        y: s.y + (up ? 1 : .2),
        label: up ? "복층으로 올라가기" : "아래층으로 내려가기"
      };
    }
    return null;
  };
  H.STAIR_SPD = 2.6;
  const polyLen = pts => {
    let n = 0;
    for (let k = 1; k < pts.length; k++) n += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    return n;
  };
  const stairIn = (pts, len, s, inside) => {
    for (let d = 0; d <= len; d += .02) {
      const q = polyAt(pts, d), i = q[0] >= s.x - .01 && q[0] <= s.x + s.w + .01 && q[1] >= s.y && q[1] <= s.y + s.h;
      if (i === inside) return d;
    }
    return len;
  };
  const polyAt = (pts, d) => {
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l || k === pts.length - 1) {
        const q = l > 0 ? Math.min(1, d / l) : 1;
        return [ a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, b[0] - a[0], b[1] - a[1] ];
      }
      d -= l;
    }
    const z = pts[pts.length - 1];
    return [ z[0], z[1], 0, 0 ];
  };
  H.stairStart = function(s) {
    const F = H.floor(), p = A.player, s2 = F.stairs[s.pair];
    if (!p || !s2 || H.stairGo) return;
    const up = s.dir === "up", cx = s.x + s.w / 2, c2 = s2.x + s2.w / 2;
    const inn = up ? [ [ p.x, p.y ], [ cx, SX.clamp(p.y, s.y + .45, s.y + s.h + .7) ], [ cx, s.y + .45 ] ] : p.x >= s.x ? [ [ p.x, p.y ], [ cx, s.y + s.h - .3 ] ] : [ [ p.x, p.y ], [ cx, s.y + .5 ], [ cx, s.y + s.h - .3 ] ];
    const out = up ? [ [ c2, s2.y + .5 ], [ s2.x - .5, s2.y + .55 ] ] : [ [ c2, s2.y + .45 ], [ c2, s2.y + s2.h + .6 ] ];
    H.stairGo = {
      s,
      s2,
      up,
      ph: 0,
      t: 0,
      pts: inn,
      len: polyLen(inn),
      out,
      wt: 0,
      faded: false
    };
    if (SX.pose && SX.pose.stairBegin) {
      const dIn = stairIn(inn, H.stairGo.len, s, true), L = H.stairGo.len - dIn;
      if (L > .05) SX.pose.stairBegin(p, Math.round(L * 1.5), up ? 1 : -1, 0, L / H.STAIR_SPD, dIn / H.STAIR_SPD);
    }
    SX.audio.play(up ? "stairsUp" : "stairsDown", {
      vol: .75
    });
  };
  H.stairTick = function(dt) {
    const g = H.stairGo, p = A.player;
    if (!p) {
      H.stairGo = null;
      return;
    }
    g.t += dt;
    g.wt += dt * H.STAIR_SPD * 3;
    const T = Math.max(.3, g.len / H.STAIR_SPD), q = polyAt(g.pts, Math.min(g.len, g.t * H.STAIR_SPD));
    p.x = q[0];
    p.y = q[1];
    if (q[2] || q[3]) {
      p.aim = Math.atan2(q[3], q[2]);
      p.dir = A.dirOf(p.aim);
    }
    const walking = g.t * H.STAIR_SPD < g.len;
    p.moving = walking;
    p.frame = walking ? Math.floor(g.wt) % 4 : 0;
    if (g.ph === 0 && !g.faded && g.t >= T - .25) {
      g.faded = true;
      SX.view.fade(() => {
        const o = g.out;
        p.x = o[0][0];
        p.y = o[0][1];
        g.ph = 1;
        g.t = 0;
        g.pts = o;
        g.len = polyLen(o);
        SX.light.box = null;
        SX.view.snap();
        p.stairFx = null;
        if (SX.pose && SX.pose.stairBegin) {
          const dOut = stairIn(o, g.len, g.s2, false), m = Math.max(1, Math.round(dOut * 1.5));
          SX.pose.stairBegin(p, m, g.up ? 1 : -1, (g.up ? -1 : 1) * m * SX.pose.STAIR_RISE, Math.max(.1, dOut) / H.STAIR_SPD, 0);
        }
      });
    }
    if (g.ph === 1 && !walking) {
      H.stairGo = null;
      p.moving = false;
      p.frame = 0;
      p.walkT = 0;
      p.stairFx = null;
    }
  };
  H.interactStair = t => {
    if (t && t.kind === "stair") {
      H.stairStart(t.s);
      return true;
    }
    return false;
  };
  H.SEC_HOLD = 500;
  H.SEC_TAP = 250;
  H.secretPush = function(d, held) {
    const want = !d.open;
    if (SX.map.toggleDoor(H.floor(), d)) {
      d.slide = {
        t0: performance.now(),
        open: want,
        held: !!held
      };
      const p = SX.actors.player;
      if (p) {
        p.pushUntil = performance.now() / 1e3 + .8;
        p.pushDur = held ? .8 / .65 : .8;
      }
      SX.audio.play(want ? "secretSlide" : "secretClose");
    } else SX.audio.play("denied");
  };
  H.secretShelf = function() {
    const F = H.floor(), f = F.secret && F.secret.shelf, name = (SX.home.FURN.secretShelf || {}).name || "책장", snd = (SX.audio.OPEN_FURN || {}).bookshelf || "openCrate";
    if (!f) {
      SX.audio.play("denied");
      return;
    }
    if (H.scene === "visit" && SX.visit && SX.visit.view) {
      SX.audio.play(snd, {
        vol: .8
      });
      SX.visit.view(name, [ {
        grid: SX.home.gridOf(f)
      } ]);
      return;
    }
    const g = SX.home.gridOf(f);
    g.noPut = false;
    SX.ui.openInventory({
      kind: "box",
      grid: g,
      title: name,
      snd
    });
  };
  H.secHoldEnd = function() {
    const s = H.secHold;
    H.secHold = null;
    if (!s) return;
    s.d.hold = null;
    const p = SX.actors.player;
    if (p && !s.pushed) p.pushUntil = 0;
  };
  H.secHoldTick = function() {
    const s = H.secHold, F = H.floor(), p = SX.actors.player, now = performance.now(), el = now - s.t0;
    if (!p || !F.doors.includes(s.d) || s.d.open || SX.ui.isOpen()) {
      H.secHoldEnd();
      return;
    }
    if (Math.hypot(p.x - s.x, p.y - s.y) > .4 || SX.pick && SX.pick.doorDist(F, p, s.d) === Infinity) {
      H.secHoldEnd();
      return;
    }
    if (!SX.input.held("interact")) {
      H.secHoldEnd();
      if (el < H.SEC_TAP) H.secretShelf();
      return;
    }
    if (el >= H.SEC_HOLD) {
      s.pushed = true;
      H.secHoldEnd();
      H.secretPush(s.d, true);
      return;
    }
    if (el > 120) {
      p.pushDur = .8;
      p.pushUntil = now / 1e3 + .8 * (1 - .35 * Math.min(1, (el - 120) / (H.SEC_HOLD - 120)));
    }
  };
  H.interact = function(t) {
    if (!t) return;
    if (H.interactStair(t)) return;
    if (H.scene === "visit" && SX.visit && SX.visit.interact(t)) return;
    if (t.kind === "cont") {
      SX.ui.openLoot(t.prop.cont);
      return;
    }
    if (t.kind === "fishSpot") {
      SX.fishing.start(t.spot);
      return;
    }
    if (t.kind === "clean") {
      if (SX.clean) SX.clean.start(t);
      return;
    }
    if (t.kind === "homeUse") {
      if (SX.homeUse) SX.homeUse.stop();
      return;
    }
    if (t.kind === "talk") {
      SX.audio.play("click");
      const n = t.npc, c = n._talk || (n._talk = {
        name: n.name,
        shop: n.role,
        lines: H.SHOP_LINES[n.role] || [ "어서 와." ]
      });
      if (SX.prog.ST_WHO[n.role] && H.scene === "market") SX.ui.openStory(n.role, () => SX.ui.openTalk(c), "그냥 얘기"); else SX.ui.openTalk(c);
      return;
    }
    if (t.kind === "civ") {
      SX.audio.play("click");
      const c = t.civ;
      if (c.who && H.scene === "market") SX.ui.openStory(c.who, () => {
        if (!(SX.ui.openRescue && SX.ui.openRescue(c.who, () => SX.ui.openTalk(c)))) SX.ui.openTalk(c);
      }, "그냥 얘기"); else SX.ui.openTalk(c);
      return;
    }
    if (t.kind === "door") {
      if (t.door.range) {
        SX.audio.play("doorOpen");
        H.travel("range");
        return;
      }
      if (t.door.gym) {
        SX.audio.play("doorOpen");
        H.travel("gym");
        return;
      }
      if (t.door.fish) {
        SX.audio.play("doorOpen");
        H.travel("fish");
        return;
      }
      if (t.door.back) {
        SX.audio.play("doorOpen");
        H.travel("market");
        return;
      }
      const dm = {
        mat: SX.doorPlace ? SX.doorPlace.mat(H.floor(), t.door) : null
      };
      if (t.door.home || t.door.market) {
        SX.audio.play("doorOpen", dm);
        SX.ui.openRaidMap();
        return;
      }
      if (t.door.secret) {
        const d = t.door, p = SX.actors.player;
        if (!d.open && p && p.y > d.cy && !(SX.doorPlace && SX.doorPlace.secretSliding(d))) {
          H.secHoldEnd();
          H.secHold = {
            d,
            t0: performance.now(),
            x: p.x,
            y: p.y
          };
          d.hold = {
            t0: H.secHold.t0,
            ms: H.SEC_HOLD
          };
          return;
        }
        H.secretPush(d, false);
        return;
      }
      if (SX.map.toggleDoor(H.floor(), t.door)) SX.audio.play(t.door.open ? "doorOpen" : "doorClose", dm); else SX.audio.play("denied");
      return;
    }
    const role = t.npc.role;
    if (!(role === "stash" || role === "safe" || role === "display" || role === "rack" || role === "wardrobe" || role === "fridge" || role === "dump" || SX.homeUse && SX.homeUse.has(role))) SX.audio.play("click");
    const lf = t.npc && t.npc.furn ? SX.home.live(t.npc.furn) : null;
    if (role === "stash") SX.ui.openStash(); else if (role === "fridge") {
      const g = SX.home.gridOf(lf);
      g.noPut = false;
      SX.ui.openInventory({
        kind: "box",
        grid: g,
        title: "냉장고 — 먹을 것 · 마실 것만",
        snd: "openFridge"
      });
    } else if (role === "cook" || role === "stove") SX.ui.openCook(lf, role === "stove"); else if (role === "craft") SX.ui.openCook(lf, false, "craft"); else if (role === "water") SX.ui.openWater(lf); else if (role === "map") SX.ui.openRaidMap(); else if (role === "wardrobe") {
      SX.audio.play((SX.audio.OPEN_FURN || {})[t.npc.furn ? t.npc.furn.kind : "wardrobe"] || "openCloset", {
        vol: .8
      });
      SX.ui.openLook();
    } else if (role === "display" || role === "rack") SX.ui.openDisplay(lf); else if (role === "safe") {
      const g = SX.home.gridOf(lf);
      g.noPut = false;
      SX.ui.openInventory({
        kind: "box",
        grid: g,
        title: g.accept === SX.home.waterOnly ? t.npc.name + " — 생수병만" : t.npc.name,
        snd: (SX.audio.OPEN_FURN || {})[t.npc.furn.kind] || "openCrate"
      });
    } else if (role === "rangeDesk") SX.ui.openRange(); else if (role === "fishShop") SX.fishing.openShop(); else if (role === "grill") SX.fishing.openGrill(); else if (role === "exRun" || role === "exStr" || role === "exRope" || role === "exBag") {
      const d = H.EX[role], U = SX.ui, g = U.GYM.find(q => q.id === d.id), lv = +((SX.game.save.body || {})[d.id] || 0);
      if (H.noAsk || lv >= 5) H.startExercise(role, t.prop); else U.ask(d.name + " — " + d.stat, (g ? g.desc + "<br>" : "") + (U.gymEaseTxt ? U.gymEaseTxt(d.id) + "<br>" : "") + "성공하면 " + d.stat + " +0.1단계(지금 " + lv.toFixed(1) + " / 5) · 실패해도 이용료는 돌려받지 못합니다.", U.GYM_FEE, () => H.startExercise(role, t.prop), null, {
        q: "이용료를 내고 운동하시겠습니까?",
        yes: "내고 운동"
      });
    } else if (role === "sleep") H.sleep(); else if (role === "garden") SX.ui.openGarden(lf); else if (role === "dump") {
      if (SX.clean) SX.clean.dumpAt(lf, t.prop);
    } else if (SX.homeUse && SX.homeUse.has(role)) SX.homeUse.act(role, t.prop, lf); else if (SX.prog.ST_WHO[role] && H.scene === "market" && !t.stall) SX.ui.openStory(role, () => SX.ui.openShop(role), "가게 보기", {
      noWait: true
    }); else SX.ui.openShop(role);
  };
})(window.SX);
