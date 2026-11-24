(function(SX) {
  "use strict";
  const W = SX.week = {};
  const P_ = () => SX.prog, A_ = () => SX.actors, M_ = () => SX.map, T_ = () => SX.map.T;
  const R_ = () => SX.coop && SX.coop.raid && !SX.coop.raid.offline ? SX.coop.raid : null;
  function send(d, to) {
    if (R_() && SX.coop.wkSend) SX.coop.wkSend(d, to);
  }
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r2 = v => Math.round(v * 100) / 100;
  const key = () => SX.label ? SX.label("interact") : "F";
  const fname = f => SX.raid && SX.raid.fname ? SX.raid.fname(f) : f + 1 + "층";
  const now_ = () => SX.net && SX.net.now ? SX.net.now() : Date.now();
  const LS = "sxd_wk", ICON = {
    lock: "⛔",
    horde: "🦠",
    trove: "💰"
  };
  const SOL = {
    topStyle: "camo",
    top: "#4f5a38",
    camo1: "#3a4a2a",
    camo2: "#6a6a44",
    pants: "#3f4630",
    boot: "#1e1a16",
    vest: "#3a4228",
    hat: "helmet",
    hatCol: "#3f4a30",
    mask: null
  };
  W.DOOR = "군 잔당이 막았습니다 — 출입 통제 · 다른 출구로";
  let S = null, warned = false;
  function play(name, f, x, y, range, vol) {
    const p = A_().player;
    if (!p || p.floor !== f) return;
    SX.audio.play(name, {
      x,
      y,
      range: range || 14,
      vol: vol == null ? .8 : vol
    });
  }
  function inval(F) {
    F.ver = (F.ver || 0) + 1;
    if (F.chunks) F.chunks.clear();
    if (SX.render && SX.render.invalidate) SX.render.invalidate(F);
    F.blazes = null;
  }
  const inRoom = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  const area = r => (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
  function stairIn(F, r) {
    for (const s of F.stairs) if (s.x <= r.x1 && s.x + s.w > r.x0 && s.y <= r.y1 && s.y + s.h > r.y0) return true;
    return false;
  }
  function okRoom(F, r) {
    if (r.big || r.hall || r.open || r.part || r.nook || r.vault || r.ctrl) return false;
    if (F.vault && F.vault.r === r) return false;
    if (F.ctrl && F.ctrl.r === r) return false;
    return !stairIn(F, r);
  }
  const special = (F, x, y) => !!(F.vault && F.vault.r && inRoom(F.vault.r, x, y) || F.ctrl && F.ctrl.r && inRoom(F.ctrl.r, x, y));
  function freeT(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y);
    if (F.tile(x, y) !== T_().FLOOR || F.solid[i] || F.doorAt.get(i) || blk && blk.has(i)) return false;
    if (F.propAt && F.propAt[i]) return false;
    if (F.fireAt && F.fireAt[i]) return false;
    return A_().free(F, x + .5, y + .5, .3);
  }
  function nearDoor(F, x, y) {
    for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (F.in(x + dx, y + dy) && F.tile(x + dx, y + dy) === T_().DOOR) return true;
    return false;
  }
  function byWall(F, x, y) {
    for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (F.in(x + dx, y + dy) && F.tile(x + dx, y + dy) === T_().WALL) return true;
    return false;
  }
  function pass(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y), t = F.tile(x, y), T = T_();
    if (blk && blk.has(i)) return false;
    if (t === T.DOOR) {
      const d = F.doorAt.get(i);
      return !d || !d.locked;
    }
    if (t !== T.FLOOR && t !== T.STAIR) return false;
    return !F.solid[i];
  }
  function bfs(F, sx, sy, blk) {
    const D = new Int16Array(F.W * F.H).fill(-1), q = [];
    if (!pass(F, sx, sy, blk)) return D;
    D[F.i(sx, sy)] = 0;
    q.push(sx, sy);
    for (let h = 0; h < q.length; h += 2) {
      const x = q[h], y = q[h + 1], d = D[F.i(x, y)];
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const nx = x + dx, ny = y + dy;
        if (!F.in(nx, ny)) continue;
        const j = F.i(nx, ny);
        if (D[j] >= 0 || !pass(F, nx, ny, blk)) continue;
        D[j] = Math.min(32e3, d + 1);
        q.push(nx, ny);
      }
    }
    return D;
  }
  function stairOk(F, D) {
    for (const s of F.stairs) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (F.in(x, y) && D[F.i(x, y)] >= 0) return true;
    return false;
  }
  const cnt = D => {
    let n = 0;
    for (let i = 0; i < D.length; i++) if (D[i] >= 0) n++;
    return n;
  };
  function adjReach(F, D, x, y, w) {
    for (let k = 0; k < (w || 1); k++) for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
      const nx = x + k + dx, ny = y + dy;
      if (F.in(nx, ny) && D[F.i(nx, ny)] >= 0) return true;
    }
    return false;
  }
  function unstick(F, a) {
    const A = A_();
    if (!a || A.free(F, a.x, a.y, .3)) return;
    for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = Math.floor(a.x) + dx + .5, y = Math.floor(a.y) + dy + .5;
      if (A.free(F, x, y, .3) && pass(F, Math.floor(x), Math.floor(y))) {
        a.x = x;
        a.y = y;
        return;
      }
    }
  }
  function refOf(F) {
    for (const s of F.stairs) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) if (pass(F, x, y)) return [ x, y ];
    return null;
  }
  function placer(F, ref, must) {
    const D0 = ref ? bfs(F, ref[0], ref[1]) : new Int16Array(F.W * F.H).fill(-1), n0 = cnt(D0), blk = new Set, pick = [];
    const need = (must || []).map(([x, y]) => [ Math.floor(x), Math.floor(y) ]).filter(([x, y]) => F.in(x, y) && D0[F.i(x, y)] >= 0);
    return {
      D0,
      blk,
      put(tiles) {
        if (!ref) return false;
        for (const [x, y] of tiles) if (!freeT(F, x, y, blk) || D0[F.i(x, y)] < 0) return false;
        for (const [x, y] of tiles) blk.add(F.i(x, y));
        const D = bfs(F, ref[0], ref[1], blk);
        const ok = stairOk(F, D) && cnt(D) >= n0 - blk.size - 1 && pick.every(q => adjReach(F, D, q[0], q[1], q[2])) && adjReach(F, D, tiles[0][0], tiles[0][1], tiles.length) && need.every(([x, y]) => D[F.i(x, y)] >= 0);
        if (!ok) {
          for (const [x, y] of tiles) blk.delete(F.i(x, y));
          return false;
        }
        pick.push([ tiles[0][0], tiles[0][1], tiles.length ]);
        return true;
      }
    };
  }
  function interior(lv) {
    const n = Math.max(1, Math.min(lv.building.floors | 0, lv.floors.length)), o = [];
    for (let f = 0; f < n; f++) {
      const F = lv.floors[f];
      if (F && F.kind !== "roof" && !F.park && f !== lv.roofIdx && f !== lv.parkIdx) o.push(f);
    }
    return o;
  }
  W.cur = function(ms) {
    const P = P_();
    if (!P || !P.weekAt) return null;
    const w = P.weekAt(ms == null ? now_() : ms);
    return {
      k: w.k,
      b: w.b,
      st: w.st
    };
  };
  function fresh() {
    const Rd = SX.raid;
    return {
      lv: null,
      seed: Rd.seed,
      mil: new Set,
      vMine: false,
      seen: false,
      v: null,
      door: null,
      bar: [],
      guards: [],
      crates: [],
      haz: 0,
      brute: 0,
      job: null
    };
  }
  function save() {
    try {
      if (!S) return;
      localStorage.setItem(LS, JSON.stringify({
        s: S.seed,
        t: Date.now(),
        mil: [ ...S.mil ],
        vm: S.vMine ? 1 : 0,
        sn: S.seen ? 1 : 0
      }));
    } catch (e) {}
  }
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(LS) || "null");
      if (!o || o.s !== S.seed || !(Date.now() - (o.t || 0) < 3 * 36e5)) return;
      for (const k of o.mil || []) S.mil.add(String(k));
      S.vMine = !!o.vm;
      S.seen = !!o.sn;
    } catch (e) {}
  }
  W.begin = function(building, wkIn) {
    const Rd = SX.raid, I = SX.items, P = P_();
    let w = wkIn === undefined ? W.cur() : wkIn;
    if (!w || typeof w !== "object" || typeof w.b !== "string") w = null;
    Rd.wkIn = w ? {
      k: w.k | 0,
      b: w.b,
      st: String(w.st || "")
    } : null;
    const on = !!(w && P && P.WEEK_B && building && w.b && w.b === building.id && P.WEEK_B.indexOf(w.b) >= 0 && P.WEEK_ST.indexOf(w.st) >= 0 && !building.train && !building.final && !building.outdoor && !Rd.tutMode);
    Rd.wk = on ? Rd.wkIn : null;
    I.wkBoost = on && w.st === "horde" ? P.WEEK_LOOT : 0;
    if (S && S.job) stopJob();
    S = fresh();
    load();
  };
  W.zm = () => {
    const w = SX.raid && SX.raid.wk;
    return w && w.st === "horde" ? P_().WEEK_ZM : 1;
  };
  W.start = function(lv) {
    if (!S) S = fresh();
    S.lv = lv;
    const Rd = SX.raid, w = Rd.wk;
    if (!w || !lv) return;
    const I = SX.items, u0 = I.uidGet ? I.uidGet() : null;
    try {
      if (I.uidSet) I.uidSet(1e12 + Rd.seed % 1e6 * 1e5 + 96e3);
      const rng = new SX.Rng((Rd.seed >>> 0 ^ 388823) >>> 0);
      if (w.st === "lock") buildLock(lv, rng); else if (w.st === "horde") buildHorde(lv, rng); else if (w.st === "trove") buildTrove(lv, rng);
    } catch (e) {
      console.warn("[wk] start", e);
    } finally {
      if (I.uidSet && u0 != null) I.uidSet(u0);
    }
  };
  W.ensure = function() {
    const Rd = SX.raid, lv = Rd && Rd.level;
    if (!lv || !S || S.lv !== lv || !Rd.wk) return null;
    if (S.v && Rd.reg && Rd.conts && Rd.conts.get("wk:v") !== S.v.cont) Rd.reg(S.v.cont, "wk:v");
    return S;
  };
  function lobbies(lv) {
    const o = [], Rd = SX.raid;
    for (let k = 0; k < (Rd.SPAWNS || 12); k++) {
      const q = Rd.spawnFor(k, lv);
      if (q && !q.roof) o.push([ q.x, q.y ]);
    }
    return o;
  }
  function buildLock(lv, rng) {
    const P = P_(), M = M_(), A = A_(), Rd = SX.raid, fl = interior(lv).slice(0, 2), lob = lobbies(lv), F0 = lv.floors[0];
    const PLs = new Map, plOf = F => {
      if (!PLs.has(F.idx)) PLs.set(F.idx, placer(F, refOf(F), F.idx === 0 ? lob : null));
      return PLs.get(F.idx);
    };
    if (!Rd.fire && !Rd.flood && F0) {
      const d = F0.doors.find(q => q.exit && q.side === "s");
      if (d) {
        d.open = false;
        d.locked = true;
        d.fireShut = true;
        d.wkShut = true;
        S.door = d;
        for (const z of F0.zones) if (z.kind === "door" && z.door === d) {
          z.locked = true;
          z.why = W.DOOR;
        }
        PLs.delete(0);
        const PL = plOf(F0), at = [];
        for (const k of [ 0, 2 ]) for (const dy of [ 1, 2 ]) {
          const x = d.x + k, y = d.y - dy;
          if (PL.put([ [ x, y ], [ x + 1, y ] ])) {
            at.push([ x, y ]);
            break;
          }
        }
        at.forEach(([x, y], k) => {
          const pr = M.addProp(F0, "wkBlock", x, y, {
            v: at.length === 1 ? 1 : k,
            solid: true,
            cover: .6
          });
          if (pr) {
            pr.wkBlock = true;
            S.bar.push(pr);
          }
        });
      }
    }
    const nG = P.WEEK_GUARDS[0] + rng.i(P.WEEK_GUARDS[1] - P.WEEK_GUARDS[0] + 1), per = fl.length > 1 ? [ Math.ceil(nG / 2), Math.floor(nG / 2) ] : [ nG ];
    const taken = new Set, byF = new Map;
    let gk = 0;
    fl.forEach((f, fi) => {
      const F = lv.floors[f], PL = plOf(F), st = F.stairs.map(s => [ s.x + s.w / 2, s.y + s.h / 2 ]), far = f === 0 ? lob : st;
      const pts = [];
      for (const minD of f === 0 ? [ 12, 9, 6 ] : [ 7, 5 ]) {
        const cand = [];
        for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
          const i = F.i(x, y);
          if (!F.inside[i] || taken.has(i) || PL.D0[i] < 0 || !freeT(F, x, y, PL.blk) || nearDoor(F, x, y) || special(F, x, y)) continue;
          if (far.some(q => Math.hypot(q[0] - x - .5, q[1] - y - .5) < minD) || st.some(q => Math.hypot(q[0] - x - .5, q[1] - y - .5) < 5)) continue;
          cand.push([ x, y ]);
        }
        for (const c of rng.shuffle(cand)) {
          if (pts.length >= per[fi]) break;
          if (pts.every(q => Math.hypot(q[0] - c[0], q[1] - c[1]) >= 5)) pts.push(c);
        }
        if (pts.length >= per[fi]) break;
      }
      for (const [x, y] of pts) {
        taken.add(F.i(x, y));
        const e = mkGuard(F, x, y, rng, gk++);
        if (e) S.guards.push(e);
      }
      byF.set(f, pts);
    });
    const nC = P.WEEK_CRATES[0] + rng.i(P.WEEK_CRATES[1] - P.WEEK_CRATES[0] + 1), I = SX.items, G = SX.game;
    for (let k = 0; k < nC; k++) {
      const f = fl[k % fl.length], F = lv.floors[f], PL = plOf(F), gp = byF.get(f) || [];
      let done = false;
      for (const R of gp.length ? [ 7, 99 ] : [ 99 ]) {
        const cand = [];
        for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) {
          const i = F.i(x, y);
          if (!F.inside[i] || taken.has(i) || PL.D0[i] < 0 || !byWall(F, x, y) || nearDoor(F, x, y) || special(F, x, y)) continue;
          if (R < 99 && !gp.some(q => {
            const dd = Math.hypot(q[0] - x, q[1] - y);
            return dd >= 2 && dd <= R;
          })) continue;
          if (f === 0 && lob.some(q => Math.hypot(q[0] - x - .5, q[1] - y - .5) < 4)) continue;
          cand.push([ x, y ]);
        }
        for (const [x, y] of rng.shuffle(cand).slice(0, 40)) {
          if (!PL.put([ [ x, y ] ])) continue;
          const ctx = G.lootCtx ? G.lootCtx(f) : {
            building: lv.building,
            floor: f
          };
          const cont = M.mkCont("armory", I.rollContainer(rng, "armory", ctx), rng);
          cont.wkMil = true;
          const pr = M.addProp(F, "milCrate", x, y, {
            v: k,
            solid: true,
            cover: .6,
            cont
          });
          if (pr) {
            pr.wkMil = true;
            S.crates.push({
              f,
              x,
              y,
              prop: pr,
              cont
            });
          }
          taken.add(F.i(x, y));
          done = true;
          break;
        }
        if (done) break;
      }
    }
    for (const f of new Set([ 0 ].concat(fl))) {
      const F = lv.floors[f];
      if (!F) continue;
      for (const e of A.enemies) if (e.alive && e.floor === f) unstick(F, e);
      if (A.player && A.player.floor === f) unstick(F, A.player);
      inval(F);
    }
  }
  function mkGuard(F, x, y, rng, k) {
    const A = A_(), G = SX.game, ctx = G.lootCtx ? G.lootCtx(F.idx) : {
      building: S.lv.building,
      floor: F.idx
    };
    const e = A.spawnEnemy(F, "scav", x + .5, y + .5, rng, ctx);
    if (!e) return null;
    const tier = Math.max(3, e.tier || 2), ml = e.melee;
    e.items = e.items.filter(it => it && it !== ml).slice(0, 2);
    e.armed = true;
    e.melee = null;
    e.melee2 = false;
    delete e.meleeDmg;
    e.gun = SX.enemyGun(rng, tier);
    e.gunMods = A.rollGunMods(e.gun, tier, (SX.raid.seed >>> 0) % 1e5 + 7717 * (k + 1) | 0);
    e.hasArmor = true;
    e.helmet = true;
    e.doorSkill = true;
    e.wkGuard = true;
    e.spec = Object.assign({}, e.spec, SOL, {
      key: "wk-sol" + k % 2
    });
    e.leash = {
      x: x + .5,
      y: y + .5,
      r: 14,
      give: 12
    };
    return e;
  }
  function buildHorde(lv, rng) {
    const P = P_(), A = A_(), bid = lv.building.id, noHaz = bid === "school" || bid === "base";
    for (const f of interior(lv)) {
      const L = A.enemies.filter(e => e.alive && e.floor === f && e.type === "zombie" && !e.variant && !e.boss && !e.leash && !e.dormant);
      if (!noHaz) for (const e of L) if (rng.f() < P.WEEK_SPECIAL) {
        A.applyVariant(e, "hazmat", rng);
        S.haz++;
      }
      if (f >= 1 && rng.f() < .5) {
        const c = L.filter(e => !e.variant);
        if (c.length) {
          A.applyVariant(c[rng.i(c.length)], "brute", rng);
          S.brute++;
        }
      }
    }
  }
  function buildTrove(lv, rng) {
    const I = SX.items, M = M_(), T = T_(), fl = interior(lv);
    const order = rng.shuffle(fl.length > 1 ? fl.slice(1) : fl.slice()).concat(fl.length > 1 ? [ fl[0] ] : []);
    for (const f of order) {
      const F = lv.floors[f];
      if (!F || !F.rooms) continue;
      const ref = refOf(F);
      if (!ref) continue;
      const PL = placer(F, ref, f === 0 ? lobbies(lv) : null);
      const rooms = rng.shuffle(F.rooms.filter(r => okRoom(F, r) && area(r) >= 6 && area(r) <= 160));
      for (const r of rooms) {
        const top = [], any = [];
        for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x < r.x1; x++) {
          if (!freeT(F, x, y) || !freeT(F, x + 1, y) || nearDoor(F, x, y) || nearDoor(F, x + 1, y) || special(F, x, y) || PL.D0[F.i(x, y)] < 0) continue;
          if (F.tile(x, y - 1) === T.WALL && F.tile(x + 1, y - 1) === T.WALL) top.push([ x, y ]); else any.push([ x, y ]);
        }
        for (const [x, y] of rng.shuffle(top).concat(rng.shuffle(any)).slice(0, 8)) {
          if (!PL.put([ [ x, y ], [ x + 1, y ] ])) continue;
          const T3 = I.AIRDROP[3], items = [];
          const g = I.mk(rng.pick(T3.guns));
          if (g) {
            g.ammo = 0;
            g.wear = 70 + rng.i(30);
            items.push(g);
          }
          const nv = 1 + rng.i(2);
          for (let k = 0; k < nv; k++) {
            const it = I.mk(rng.pick(T3.val));
            if (it) items.push(it);
          }
          const cont = M.mkCont("armory", items, rng);
          cont.name = "보물 금고";
          cont.wkVault = true;
          const prop = M.addProp(F, "wkSafe", x, y, {
            v: 0,
            solid: true,
            cover: .8
          });
          if (prop) prop.wkSafe = true;
          S.v = {
            f,
            x,
            y,
            prop,
            cont,
            vo: false,
            r
          };
          const A = A_();
          for (const e of A.enemies) if (e.alive && e.floor === f) unstick(F, e);
          inval(F);
          return;
        }
      }
    }
  }
  function openVault(quiet) {
    const v = S && S.v;
    if (!v) return;
    v.vo = true;
    const p = v.prop;
    if (!p) return;
    if (p.v !== 1) {
      p.v = 1;
      const c = v.cont;
      p.cont = c;
      c.prop = p;
      c.floor = v.f;
      c.x = v.x + 1;
      c.y = v.y + .5;
      const F = S.lv.floors[v.f];
      if (F.conts.indexOf(c) < 0) F.conts.push(c);
      inval(F);
      W.ensure();
    }
    if (!quiet) play("metalCreak", v.f, v.x + 1, v.y + .5, 30, 1);
  }
  function startJob() {
    const p = A_().player;
    if (!p) return;
    S.job = {
      t: 0,
      x: p.x,
      y: p.y,
      sndT: 0,
      n: 0
    };
    p.reviving = "wk";
    p.reload = null;
    p.use = null;
  }
  function stopJob() {
    const p = A_().player;
    if (S) S.job = null;
    if (p && p.reviving === "wk") p.reviving = null;
  }
  W.cancelJob = function() {
    if (S && S.job) {
      stopJob();
      return true;
    }
    return false;
  };
  W.jobOn = () => !!(S && S.job);
  function jobTick(dt) {
    const j = S.job, p = A_().player, A = A_(), v = S.v;
    if (!p || !p.alive || p.down || Math.hypot(p.x - j.x, p.y - j.y) > .6 || SX.ui.isOpen && SX.ui.isOpen() || !v || v.vo) {
      stopJob();
      return;
    }
    p.reviving = "wk";
    j.t += dt;
    j.sndT -= dt;
    if (j.sndT <= 0) {
      j.sndT = 1;
      const nm = [ "trapPry", "metalCreak", "hitMetal" ][(j.n = (j.n | 0) + 1) % 3], F = S.lv.floors[p.floor];
      SX.audio.play(nm, {
        x: p.x,
        y: p.y,
        range: 30,
        vol: 1
      });
      A.noise(F, p.x, p.y, 22);
      send({
        q: "snd",
        f: p.floor,
        x: r2(p.x),
        y: r2(p.y),
        n: nm,
        r: 30
      });
    }
    if (j.t >= P_().WEEK_VAULT_T) {
      stopJob();
      openVault(false);
      S.vMine = true;
      save();
      send({
        q: "vlt"
      });
      SX.log("💰 보물 금고를 열었습니다", "good");
    }
  }
  W.tick = function(dt, lv) {
    if (!S || !S.lv || S.lv !== lv || !SX.raid.wk || SX.raid.over) return;
    try {
      if (S.job) jobTick(dt);
      const v = S.v, p = A_().player;
      if (v && !S.seen && p && p.alive && p.floor === v.f && Math.hypot(p.x - v.x - 1, p.y - v.y - .5) <= P_().WEEK_SEE) {
        S.seen = true;
        save();
        if (!v.vo) SX.log("💰 보물 금고를 찾았습니다 — 지도에 표시했습니다", "good");
      }
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn("[wk] tick", e);
      }
    }
  };
  W.onMsg = function(from, d) {
    if (!W.ensure()) return;
    switch (d.q) {
     case "vlt":
      if (S.v && !S.v.vo) {
        if (S.job) stopJob();
        openVault(false);
      }
      break;

     case "snd":
      play(d.n, d.f, d.x, d.y, d.r || 30, .9);
      break;
    }
  };
  W.dump = function() {
    if (!S || !SX.raid.wk || !S.v) return undefined;
    return {
      v: 1,
      vo: S.v.vo ? 1 : 0
    };
  };
  W.worldIn = function(w) {
    if (!w || !S || !S.v) return;
    try {
      if (w.vo) openVault(true);
    } catch (e) {
      console.warn("[wk] worldIn", e);
    }
  };
  W.target = function(F, p, add) {
    const v = S && S.v;
    if (!v || v.vo || !F || F.idx !== v.f || !W.ensure()) return null;
    const d = Math.hypot(v.x + 1 - p.x, v.y + .6 - p.y);
    if (d >= 1.8) return null;
    return add({
      kind: "wk",
      sub: "vlt",
      x: v.x + 1,
      y: v.y - .5,
      label: S.job ? "🔩 금고 비트는 중 — [" + key() + "] 그만" : "🔩 보물 금고 비틀어 열기 — [" + key() + "] 누르고 " + P_().WEEK_VAULT_T + "초 (아주 시끄럽습니다)"
    }, () => [ [ v.x, v.y - .6, v.x + 2, v.y + 1 ] ]);
  };
  W.interact = function(t) {
    if (!S || !t) return;
    if (t.sub === "vlt" && !S.job && S.v && !S.v.vo) startJob();
  };
  W.hud = function() {
    if (!S || !S.job) return null;
    return {
      text: "금고 비트는 중 … " + Math.max(0, P_().WEEK_VAULT_T - S.job.t).toFixed(1) + " · [" + key() + "] 그만",
      col: null
    };
  };
  W.marks = function(out) {
    const v = S && S.v;
    if (!v || !S.seen || v.vo || !SX.raid.wk) return;
    out.push({
      f: v.f,
      x: v.x + 1,
      y: v.y + .5,
      col: "rgb(232,192,64)",
      label: "보물 금고"
    });
  };
  W.pois = function(f) {
    const v = S && S.v;
    if (!v || !S.seen || f !== v.f || !SX.raid.wk) return [];
    return [ {
      kind: v.vo ? "vaultOpen" : "vault",
      x: v.x + 1,
      y: v.y + .5
    } ];
  };
  W.opened = function(cont) {
    const w = SX.raid.wk;
    if (!w || w.st !== "lock" || !S || !cont || cont.type !== "armory") return;
    const k = String(cont.key || "x" + cont.floor + "_" + cont.x + "_" + cont.y);
    if (S.mil.has(k)) return;
    S.mil.add(k);
    save();
  };
  W.report = function(r) {
    if (!r) return;
    const w = SX.raid.wk;
    if (!w) {
      delete r.wk;
      return;
    }
    r.wk = {
      k: w.k,
      b: w.b,
      st: w.st,
      mil: S ? S.mil.size : 0,
      vault: S && S.vMine ? 1 : 0
    };
  };
  const STN = st => P_().WEEK_NAME[st] || st;
  const SHORT = () => ({
    lock: "정문 쪽 출구가 막혔습니다 · 남은 군 잔당 · 군 상자",
    horde: "감염체가 " + P_().WEEK_ZM + "배 · 좋은 물건이 더 나옵니다",
    trove: "어딘가에 잠긴 보물 금고"
  });
  const HEAD = {
    lock: "📅 이번 주: 봉쇄",
    horde: "📅 이번 주: 대량 감염",
    trove: "📅 이번 주: 보물"
  };
  function lineTxt(st) {
    if (st === "lock") return "정문 출구가 막혔습니다 · 남은 군 잔당 · 군 상자가 있습니다";
    if (st === "horde") return "감염체가 " + P_().WEEK_ZM + "배입니다 · 좋은 물건이 더 나옵니다";
    return "숨은 금고를 먼저 연 사람이 가져갑니다";
  }
  function leftTxt(now) {
    const ms = P_().weekLeft(now);
    return ms >= 864e5 ? Math.ceil(ms / 864e5) + "일 뒤 바뀝니다" : Math.max(1, Math.ceil(ms / 36e5)) + "시간 뒤 바뀝니다";
  }
  W.pinOn = function(b) {
    const P = P_();
    if (!P || !P.weekAt || !b || b.place) return "";
    const w = W.cur();
    return w && w.b && w.b === b.id ? (ICON[w.st] || "") + " " : "";
  };
  function modeLine(b, fit, now) {
    const P = P_();
    {
      const m0 = fit || (P.raidMode ? P.raidMode(b.id, now) : "normal");
      if ((m0 === "nos" || m0 === "noz") && P.SP_B && P.SP_B.indexOf(b.id) >= 0 && !b.train && !b.final && !b.place) return true;
    }
    if (!P.MODE_B || !P.MODE_B[b.id]) return false;
    const m = fit || (P.raidMode ? P.raidMode(b.id, now) : "normal");
    if (m === "fire") return true;
    return m === "flood" && !b.train && !b.final && !b.outdoor && (b.floors | 0) >= 2 && !(SX.soloMap && SX.soloMap(b));
  }
  function wkSt(b, fit, now, len) {
    const P = P_();
    if (!P || !P.weekAt || !b || b.place || P.WEEK_B.indexOf(b.id) < 0) return null;
    if (fit) return P.WEEK_ST.slice().sort((a, c) => len(c) - len(a))[0];
    const w = W.cur(now);
    return w && w.b === b.id ? w.st : null;
  }
  const TR = x => SX.tr ? SX.tr(x) : x;
  W.line = function(b, fit) {
    const now = now_(), st = wkSt(b, fit, now, q => TR(HEAD[q]).length + TR(lineTxt(q)).length);
    if (!st || modeLine(b, fit, now)) return "";
    return `<p class="small fireNote wkNote"><b class="warn">${esc(HEAD[st])}</b> — <span>${esc(lineTxt(st))}</span> · <span>${esc(leftTxt(now))}</span></p>`;
  };
  W.tail = function(b, fit) {
    const now = now_(), st = wkSt(b, fit, now, q => TR(HEAD[q]).length);
    return st ? `<span class="wkNote"> · <b class="warn">${esc(HEAD[st])}</b></span>` : "";
  };
  W.fit = function(inf) {
    try {
      const p = inf && inf.querySelector("p.wkNote"), row = document.getElementById("todRow");
      if (!p || !row) return;
      const over = () => inf.scrollHeight - inf.clientHeight, o1 = over();
      if (o1 <= 1) return;
      const sp = document.createElement("span"), hb = p.querySelector("b");
      if (!hb) return;
      sp.className = "small wkNote wkBadge";
      sp.style.cssText = "align-self:center;margin-left:.7em";
      sp.appendChild(hb.cloneNode(true));
      const nx = p.nextSibling, par = p.parentNode;
      par.removeChild(p);
      row.appendChild(sp);
      if (over() >= o1) {
        row.removeChild(sp);
        par.insertBefore(p, nx);
      }
    } catch (e) {
      console.warn("[wk] fit", e);
    }
  };
  W.todayLine = function() {
    const w = SX.raid && SX.raid.wk;
    if (!w) return "";
    const nm = STN(w.st);
    if (w.st === "trove") return " · 📆 이번 주 서울: " + nm + (S && S.v ? " — " + fname(S.v.f) + " 어딘가에 금고" : "");
    if (w.st === "lock") return " · 📆 이번 주 서울: " + nm + " — " + (S && S.door ? "정문이 막혔습니다" : "남은 군 잔당이 있습니다");
    return " · 📆 이번 주 서울: " + nm + " — 감염체가 " + P_().WEEK_ZM + "배";
  };
  W.hubRow = function(L, now) {
    const P = P_();
    if (!P || !P.weekAt || !L) return;
    const w = W.cur(now);
    if (!w || !w.b) return;
    const r = document.createElement("div");
    r.className = "li wkRow";
    r.innerHTML = `<span class="nm">${esc("📆 이번 주 서울 — " + P.weekName(w.b) + " · " + STN(w.st))}<br><span class="small">${esc(SHORT()[w.st] + " · " + leftTxt(now))}</span></span>`;
    L.appendChild(r);
  };
  W.mapNote = function(scr) {
    const v = S && S.v;
    if (!v || !scr || !SX.raid.wk || !W.ensure()) return;
    const p = document.createElement("p");
    p.className = "small wkMapNote";
    p.textContent = v.vo ? "💰 보물 금고 — 이미 열렸습니다" : S.seen ? "💰 보물 금고 — " + fname(v.f) + " · 지도에 표시했습니다" : "💰 보물 금고 — " + fname(v.f) + " 어딘가";
    scr.appendChild(p);
  };
  W._S = () => S;
  void {
    open: () => openVault(false),
    see: () => {
      if (S) {
        S.seen = true;
      }
    },
    lineTxt,
    leftTxt
  };
  (function art() {
    const A = SX.art;
    if (!A || !A.defProp || !A.propSize) return;
    const PP = A.PP || {}, RP = c => A.ramp ? A.ramp(c) : [ c, c, c, c, c, c ];
    const sh = (P, x, y, w, h, a) => {
      if (PP.sbox) PP.sbox(P, x, y, w, h, a);
    };
    const hr = (a, b) => {
      let h = Math.imul((a | 0) * 374761393 + (b | 0) * 668265263, 1274126177);
      h ^= h >>> 13;
      h = Math.imul(h, 1103515245);
      return (h >>> 0) % 1e3 / 1e3;
    };
    if (!A.propSize("wkBlock")) A.defProp("wkBlock", 2, 1, 40, (P, w, h, up, g, v) => {
      const B = h - 2, cols = [ "#a89a72", "#9c9070", "#b0a078" ];
      sh(P, 1, B - 6, 62, 8, .42);
      const bag = (x, y, bw, c) => {
        const R = RP(c);
        P.r(x + 1, y, bw - 2, 8, R[2]).r(x, y + 1, bw, 6, R[2]).r(x + 1, y, bw - 2, 2, R[4]).r(x + 2, y, bw - 5, 1, R[5]).r(x + 1, y + 6, bw - 2, 2, R[1]).r(x, y + 3, 1, 3, R[3]).r(x + bw - 1, y + 2, 1, 5, R[1]).p(x + bw - 3, y + 3, R[1]);
      };
      for (let x = 1, k = 0; x < 62; x += 15, k++) bag(x, B - 9, Math.min(15, 63 - x), cols[(k + v) % 3]);
      for (let x = 8, k = 0; x < 55; x += 15, k++) bag(x, B - 17, Math.min(15, 56 - x), cols[(k + v + 1) % 3]);
      for (let x = 10; x < 54; x += 15) {
        const R = RP(cols[(v + 2) % 3]);
        P.r(x, B - 20, 11, 3, R[4]).r(x + 1, B - 21, 9, 1, R[5]);
      }
      for (const x of [ 3, 60 ]) {
        P.line(x - 3, B - 10, x + 3, B - 40, "#3a3e38").line(x + 3, B - 10, x - 3, B - 40, "#2c302a").r(x - 1, B - 26, 3, 2, "#4a4e46");
      }
      const cy = B - 31;
      for (let k = 0; k < 9; k++) {
        const cx = 2 + k * 7.5;
        for (let a = 0; a < 28; a++) {
          const t = a / 28 * Math.PI * 2, x = Math.round(cx + Math.cos(t) * 5.5), y = Math.round(cy + Math.sin(t) * 7);
          if (x < 0 || x > 63) continue;
          P.p(x, y, Math.sin(t) > 0 ? "#b8bec4" : "#5e646a");
        }
        P.p(Math.round(cx + 3), cy - 6, "#d8dde0").p(Math.round(cx - 4), cy + 3, "#d8dde0").p(Math.round(cx + 1), cy + 7, "#8a9096");
      }
      for (let i = 0; i < 10; i++) P.p(hr(v, i) * 62 | 0, B - 24 - (hr(i, v + 5) * 14 | 0), "#30343a");
      if (v === 1) {
        P.r(44, B - 50, 2, 34, "#4a4234").r(46, B - 50, 1, 34, "#2e281e");
        const bx = 24, by = B - 60, bw = 38, bh = 15;
        P.r(bx, by + 1, bw, bh, "rgba(0,0,0,0.35)");
        P.r(bx, by, bw, bh, "#b8282a").r(bx + 1, by + 1, bw - 2, bh - 2, "#ece8e0").r(bx + 1, by + bh - 3, bw - 2, 1, "#cfc9bd");
        if (PP.label) PP.label(P, bx + 1, by + 3, "출입 통제", "#b8282a", 7, bw - 2); else for (let x = bx + 4; x < bx + bw - 4; x += 4) P.r(x, by + 5, 2, 5, "#b8282a");
        P.r(bx + 2, by + 1, 1, 1, "#6a6a6a").r(bx + bw - 3, by + 1, 1, 1, "#6a6a6a");
      } else {
        for (let x = 0; x < 64; x++) P.p(x, B - 22 + (x >> 3 & 1), x >> 2 & 1 ? "#c8a830" : "#1e1e1e");
      }
    });
    if (!A.propSize("wkSafe")) A.defProp("wkSafe", 2, 1, 30, (P, w, h, up, g, v) => {
      const B = h - 2, c = "#30343c", R = RP(c), GD = "#c8a040", GL = "#e8c868";
      sh(P, 2, B - 4, 60, 6, .45);
      if (PP.box) PP.box(P, 4, B - 46, 56, 8, 36, c, {
        fi: 3
      }); else P.r(4, B - 46, 56, 44, R[2]);
      P.r(4, B - 46, 56, 1, GD).r(4, B - 3, 56, 1, "#7a6020");
      if (!v) {
        P.r(9, B - 35, 46, 28, R[3]).r(10, B - 34, 44, 26, R[2]).r(9, B - 35, 46, 1, GD).r(9, B - 8, 46, 1, "#8a6a24");
        P.r(8, B - 32, 2, 6, "#16181c").r(8, B - 16, 2, 6, "#16181c");
        for (let a = 0; a < 20; a++) {
          const t = a / 20 * Math.PI * 2;
          P.p(Math.round(40 + Math.cos(t) * 5), Math.round(B - 21 + Math.sin(t) * 5), a % 5 ? "#9aa0a8" : GL);
        }
        P.r(39, B - 22, 3, 3, GD).p(40, B - 27, GL);
        P.line(20, B - 25, 28, B - 17, "#a8acb4").line(20, B - 17, 28, B - 25, "#a8acb4").r(23, B - 22, 3, 3, GD);
        for (const x of [ 12, 52 ]) for (const y of [ B - 32, B - 11 ]) P.p(x, y, GL);
      } else {
        P.r(9, B - 35, 46, 28, "#0e1012").r(11, B - 22, 42, 2, R[4]).r(11, B - 34, 42, 1, "#22262c");
        for (let i = 0; i < 6; i++) P.p(14 + (hr(i, 3) * 36 | 0), B - 12 - (hr(5, i) * 6 | 0), i % 2 ? GL : GD);
        P.r(0, B - 38, 9, 33, R[3]).r(1, B - 37, 7, 31, R[2]).r(0, B - 38, 9, 1, GD).r(3, B - 24, 3, 3, GD);
        P.line(54, B - 30, 57, B - 22, "#c8c8c0").line(55, B - 31, 58, B - 24, "#8a8a84");
      }
      for (const x of [ 7, 57 ]) for (const y of [ B - 42, B - 6 ]) P.p(x, y, GL);
    });
    if (A.FOOT) {
      A.FOOT.wkBlock = A.FOOT.wkBlock || {
        x0: .02,
        x1: .98,
        d: .55
      };
      A.FOOT.wkSafe = A.FOOT.wkSafe || {
        x0: .04,
        x1: .96,
        d: .7
      };
    }
    if (A.PROP_MAT) {
      A.PROP_MAT.wkBlock = "sand";
      A.PROP_MAT.wkSafe = "metal";
    }
    if (A.defPropRot) for (const k of [ "wkBlock", "wkSafe" ]) A.defPropRot(k, {
      noRot: true
    });
  })();
})(window.SX);
