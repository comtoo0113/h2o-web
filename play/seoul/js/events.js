(function(SX) {
  "use strict";
  const E = SX.ev = {};
  const SV_SPD = 2.4, SV_HP = 120, CLEAR_T = 3, VAULT_T = 8, RADIO_T = 90, OUT_D = 4, HEAR_D = 8;
  const ROOM_KO = {
    office: "사무실",
    meeting: "회의실",
    pantry: "탕비실",
    store: "창고",
    shop: "가게",
    ward: "병실",
    surgery: "수술실",
    kitchen: "부엌",
    bunk: "방",
    classroom: "교실",
    library: "도서실",
    lab: "실험실",
    cafeteria: "급식실",
    maint: "기계실",
    toilet: "화장실",
    barracks: "생활관",
    armory: "무기고",
    mess: "식당",
    command: "지휘실",
    motor: "정비고",
    reception: "접수처"
  };
  const PREF = {
    toilet: 1,
    store: 1,
    pantry: 1,
    maint: 1
  };
  const BTH = {
    villa: [ "bunk", "kitchen", "store" ],
    office: [ "office", "meeting", "pantry", "store", "reception" ],
    mall: [ "shop", "store", "pantry", "office" ],
    hos: [ "ward", "surgery", "office", "store", "pantry", "reception" ],
    school: [ "classroom", "library", "lab", "cafeteria", "office", "store" ],
    metro: [ "maint", "toilet", "store", "office" ],
    base: [ "barracks", "armory", "mess", "command", "motor", "store" ]
  };
  let S = null, warned = false;
  const A_ = () => SX.actors, M_ = () => SX.map, T_ = () => SX.map.T;
  const R_ = () => SX.coop && SX.coop.raid && !SX.coop.raid.offline ? SX.coop.raid : null;
  const isAuth = () => !R_() || !SX.coop.runEnemies || SX.coop.runEnemies();
  const me = () => R_() ? R_().me : "me";
  function send(d, to) {
    if (R_() && SX.coop.evSend) SX.coop.evSend(d, to);
  }
  function teamSend(d) {
    if (R_() && SX.coop.evTeam) SX.coop.evTeam(d);
  }
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r2 = v => Math.round(v * 100) / 100;
  const key = () => SX.label ? SX.label("interact") : "F";
  const fname = f => SX.raid.fname ? SX.raid.fname(f) : f + 1 + "층";
  function play(name, f, x, y, range, vol, delay) {
    const p = A_().player;
    if (!p || p.floor !== f) return;
    SX.audio.play(name, {
      x,
      y,
      range: range || 14,
      vol: vol == null ? .8 : vol,
      delay: delay || 0
    });
  }
  function inval(F) {
    F.ver = (F.ver || 0) + 1;
    if (F.chunks) F.chunks.clear();
    if (SX.render && SX.render.invalidate) SX.render.invalidate(F);
    F.blazes = null;
  }
  function doorTiles(d) {
    const o = [];
    for (let k = 0; k < (d.len || 1); k++) o.push(d.horiz ? [ d.x + k, d.y ] : [ d.x, d.y + k ]);
    return o;
  }
  const inRoom = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  const area = r => (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
  function doorsOf(F, r) {
    return F.doors.filter(d => doorTiles(d).some(([x, y]) => inRoom(r, x + 1, y) || inRoom(r, x - 1, y) || inRoom(r, x, y + 1) || inRoom(r, x, y - 1)));
  }
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
  function freeT(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y);
    if (F.tile(x, y) !== T_().FLOOR || F.solid[i] || F.doorAt.get(i) || blk && blk.has(i)) return false;
    if (F.propAt && F.propAt[i]) return false;
    return A_().free(F, x + .5, y + .5, .3);
  }
  function nearDoor(F, x, y) {
    for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (F.in(x + dx, y + dy) && F.tile(x + dx, y + dy) === T_().DOOR) return true;
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
  function svSpec(id, seed) {
    const spec = SX.art.charSpec("scav", new SX.Rng(seed));
    Object.assign(spec, {
      mask: null,
      vest: null,
      pack: null,
      gloves: false
    });
    if (spec.hat === "helmet") spec.hat = "beanie";
    spec.key = "evsv" + id + seed % 97;
    return spec;
  }
  function mkSv(id, F, x, y, seed, st) {
    return {
      kind: "ally",
      evs: true,
      id,
      name: "",
      x,
      y,
      floor: F.idx,
      spec: svSpec(id, seed),
      dir: 0,
      frame: 0,
      face: Math.PI / 2,
      walkT: 0,
      alive: true,
      hideWeapon: true,
      hp: SV_HP,
      st,
      by: null,
      pathT: 0,
      path: null,
      blockedT: 0,
      r: .28,
      doorSkill: true,
      hop: 0,
      bodyPose: "sit",
      moving: false,
      lx: x,
      ly: y,
      lf: F.idx,
      xT: 0,
      nx: x,
      ny: y,
      coughT: 3
    };
  }
  function backSpot(F, r, d, rng, blk) {
    let best = null, bd = -1;
    const dc = d ? {
      x: d.cx != null ? d.cx : d.x,
      y: d.cy != null ? d.cy : d.y
    } : {
      x: r.x0,
      y: r.y0
    };
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      if (!freeT(F, x, y, blk)) continue;
      const v = Math.hypot(x + .5 - dc.x, y + .5 - dc.y) + rng.f() * .5;
      if (v > bd) {
        bd = v;
        best = {
          x,
          y
        };
      }
    }
    return best;
  }
  function plan(lv) {
    const Rd = SX.raid, G = SX.game, b = lv.building;
    if (!b || !SX.evRoll || b.train || b.final || b.outdoor || Rd.tutMode || SX.course && SX.course.on) return null;
    const sv = G && G.save, OB = SX.onboard;
    if (!R_() && sv && OB) {
      const pre = !OB.test && !sv.obOff && (sv.obN | 0) < OB.RAIDS;
      if (OB.cur && OB.cur.seed === Rd.seed || pre) sv.evObSeed = Rd.seed;
      if (sv.evObSeed === Rd.seed) return null;
    }
    let o = SX.evRoll.roll(b.id, Rd.seed, Rd.mode || "normal", b.floors | 0);
    return o.b || o.c || o.d ? o : null;
  }
  function build(lv) {
    const Rd = SX.raid, I = SX.items;
    const s = {
      lv,
      o: plan(lv),
      sv: [],
      cr: null,
      rd: null,
      job: null,
      clr: [],
      mk: false,
      ear: null,
      rew: null,
      snapT: 0,
      chkT: 0,
      smT: 0,
      fireT: 0,
      said: {},
      regd: false
    };
    if (!s.o) return s;
    const u0 = I.uidGet ? I.uidGet() : null;
    try {
      if (I.uidSet) I.uidSet(1e12 + Rd.seed % 1e6 * 1e5 + 9e4);
      const rng = new SX.Rng(s.o.s2 >>> 0);
      if (s.o.c) planCrash(s, lv, new SX.Rng((s.o.s2 ^ 92) >>> 0));
      if (s.o.b) placeTrapped(s, lv, rng);
      if (s.o.d) placeRadio(s, lv, new SX.Rng((s.o.s2 ^ 209) >>> 0));
    } catch (e) {
      console.warn("[ev] build", e);
    } finally {
      if (I.uidSet && u0 != null) I.uidSet(u0);
    }
    return s;
  }
  E.start = function(lv) {
    if (S && S.job) stopJob();
    S = build(lv);
    E.rew = null;
  };
  E.ensure = function() {
    const lv = SX.raid && SX.raid.level;
    if (!lv) {
      S = null;
      return null;
    }
    if (!S || S.lv !== lv) {
      if (S && S.job) stopJob();
      S = build(lv);
      E.rew = null;
    }
    if (S.o) regAll();
    return S;
  };
  function regAll() {
    const Rd = SX.raid;
    if (!Rd.reg || !Rd.conts) return;
    const L = [];
    if (S.cr) {
      S.cr.cs.forEach((c, k) => L.push([ c.cont, "ev:c" + k ]));
      L.push([ S.cr.vc, "ev:v" ], [ S.cr.pc, "ev:p" ]);
    }
    if (S.rd && S.rd.cont) L.push([ S.rd.cont, "ev:r" ]);
    for (const [c, k] of L) if (c && Rd.conts.get(k) !== c) Rd.reg(c, k);
  }
  function placeTrapped(s, lv, rng) {
    const top = lv.building.floors | 0;
    if (top < 2) return;
    let fl = [];
    for (let f = 1; f < top; f++) fl.push(f);
    const mode = SX.raid.mode || "normal";
    if (mode === "flood") fl.reverse(); else if (mode !== "fire") fl = rng.shuffle(fl);
    for (const f of fl) {
      const F = lv.floors[f];
      if (!F || !F.rooms) continue;
      let best = null, bs = -1;
      for (const r of F.rooms) {
        if (!okRoom(F, r) || area(r) < 6 || area(r) > 100) continue;
        if (s.cr && s.cr.f === f && inRoom(r, s.cr.bx + 1, s.cr.wy + 1)) continue;
        const ds = doorsOf(F, r);
        if (ds.length !== 1) continue;
        const d = ds[0];
        if (d.locked || d.key || d.exit || d.vault || d.open || d.fireShut || d.floodShut) continue;
        let sc = (PREF[r.theme] ? 3 : 0) + (area(r) <= 48 ? 2 : 0) + rng.f();
        const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
        for (const st of F.stairs) if (Math.hypot(st.x - cx, st.y - cy) < 9) {
          sc += 2;
          break;
        }
        if (sc > bs && backSpot(F, r, d, new SX.Rng(7), null)) {
          bs = sc;
          best = {
            r,
            d
          };
        }
      }
      if (!best) continue;
      const sp = backSpot(F, best.r, best.d, rng, null);
      const sv = mkSv("b", F, sp.x + .5, sp.y + .6, 9100 + s.o.s2 % 997, 0);
      sv.room = best.r;
      sv.door = best.d;
      sv.deb = [];
      const d = best.d;
      d.locked = true;
      d.fireShut = true;
      d.evShut = true;
      doorTiles(d).forEach(([x, y], k) => {
        const p = M_().addProp(F, "evDebris", x, y, {
          v: k,
          solid: false,
          tall: false,
          cover: 0
        });
        if (p) {
          p.evDebris = true;
          sv.deb.push(p);
        }
      });
      inval(F);
      s.sv.push(sv);
      return;
    }
  }
  function clearDebris(sv, quiet) {
    if (!S || !sv || !sv.door || !sv.door.evShut) return;
    const F = S.lv.floors[sv.floor], d = sv.door;
    d.locked = false;
    d.fireShut = false;
    d.evShut = false;
    for (const p of sv.deb) M_().removeProp(F, p);
    sv.deb = [];
    inval(F);
    if (S.clr.indexOf(sv.id) < 0) S.clr.push(sv.id);
    if (sv.st === 0) sv.st = 1;
    if (!quiet) {
      const c = doorTiles(d)[0];
      play("brick", F.idx, c[0] + .5, c[1] + .5, 16, .9);
      A_().smoke(F, c[0] + .5, c[1] + .5, 6, true);
    }
  }
  const svById = id => S ? S.sv.find(v => v.id === id) : null;
  function carrier(by) {
    if (by == null) return null;
    if (by === me()) {
      const p = A_().player;
      return p ? {
        x: p.x,
        y: p.y,
        floor: p.floor,
        alive: p.alive,
        down: !!p.down
      } : null;
    }
    const g = SX.coop && SX.coop.ghosts && SX.coop.ghosts.get(by);
    return g ? {
      x: g.x,
      y: g.y,
      floor: g.floor,
      alive: g.alive !== false,
      down: !!g.down
    } : null;
  }
  function setSt(sv, st, by, net) {
    const was = sv.st;
    sv.st = st;
    sv.by = by == null ? null : by;
    if (st === 2 && was !== 2) A_().say(sv, "같이 갑시다");
    if (st === 2) {
      sv.lx = sv.x;
      sv.ly = sv.y;
      sv.lf = sv.floor;
      sv.xT = 0;
    }
    if (net && isAuth()) send({
      q: "st",
      id: sv.id,
      st,
      by: sv.by,
      x: r2(sv.x),
      y: r2(sv.y),
      f: sv.floor
    });
  }
  function take(sv, who) {
    if (!sv.alive || sv.st === 3 || sv.st === 4 || sv.st === 0) return;
    if (sv.st === 2) {
      const c = carrier(sv.by);
      if (c && c.alive && !c.down) return;
    }
    if (sv.st === 5 && S.rd) S.rd.reached = true;
    setSt(sv, 2, who, true);
  }
  function hurtSv(sv, dmg, ang) {
    if (!sv.alive || sv.st === 3 || sv.st === 4) return;
    sv.hp -= dmg;
    const F = S.lv.floors[sv.floor];
    if (F && A_().bleedAt) A_().bleedAt(F, sv.x, sv.y, ang);
    if (sv.hp <= 0) die(sv, 0, true);
  }
  function die(sv, why, net) {
    if (!sv.alive && sv.st === 3) return;
    sv.alive = false;
    sv.st = 3;
    sv.hp = 0;
    sv.moving = false;
    sv.bodyPose = null;
    sv.hop = 0;
    if (why === 1) {
      if (S.mk) SX.log("📻 무전이 끊겼습니다", "bad");
    } else {
      SX.log("생존자가 숨졌습니다", "bad");
      if (SX.ui && SX.ui.bigNote) SX.ui.bigNote("생존자가 숨졌습니다", "", 2200);
    }
    if (net && isAuth()) send({
      q: "die",
      id: sv.id,
      w: why | 0
    });
  }
  function svTickAuth(sv, dt) {
    const lv = S.lv, F = lv.floors[sv.floor];
    if (!F) return;
    sv.moving = false;
    if (sv.st === 2) {
      const c = carrier(sv.by);
      if (!c || !c.alive || c.down) {
        setSt(sv, 1, null, true);
        return;
      }
      if (c.floor === sv.floor) {
        sv.lx = c.x;
        sv.ly = c.y;
        sv.lf = c.floor;
        sv.xT = 0;
        const d = Math.hypot(c.x - sv.x, c.y - sv.y);
        if (d > 1.3) sv.moving = !!A_().steer(F, sv, c.x, c.y, SV_SPD, dt);
      } else {
        sv.xT += dt;
        const d = Math.hypot(sv.lx - sv.x, sv.ly - sv.y);
        if (d > .6 && sv.xT < 8) sv.moving = !!A_().steer(F, sv, sv.lx, sv.ly, SV_SPD, dt); else {
          const NF = lv.floors[c.floor];
          if (!NF) return;
          sv.floor = c.floor;
          sv.x = c.x;
          sv.y = c.y + .4;
          sv.path = null;
          sv.pathT = 0;
          sv.xT = 0;
          unstick(NF, sv);
          sv.nx = sv.x;
          sv.ny = sv.y;
        }
      }
    }
    const i = F.in(Math.floor(sv.x), Math.floor(sv.y)) ? F.i(Math.floor(sv.x), Math.floor(sv.y)) : -1;
    if (i >= 0 && F.fireAt && F.fireAt[i] && sv.st !== 3 && sv.st !== 4) {
      sv.hp -= 12 * dt;
      if (sv.hp <= 0) die(sv, 0, true);
    }
  }
  function svAnim(sv, dt) {
    if (sv.st === 3) {
      sv.bodyPose = null;
      sv.hop = 0;
      return;
    }
    const sit = sv.st === 0 || sv.st === 1 || sv.st === 5;
    if (!isAuth()) {
      const dx = sv.nx - sv.x, dy = sv.ny - sv.y, d = Math.hypot(dx, dy);
      if (d > 4) {
        sv.x = sv.nx;
        sv.y = sv.ny;
      } else {
        const k = Math.min(1, dt * 10);
        sv.x += dx * k;
        sv.y += dy * k;
      }
      if (sv.moving) sv.walkT += dt * SV_SPD * 3.2;
      if (d > .05) sv.face = Math.atan2(dy, dx);
    }
    sv.dir = A_().dirOf(sv.face);
    sv.frame = sv.moving ? Math.floor(sv.walkT) % 4 : 0;
    sv.bodyPose = sit ? "sit" : null;
    sv.hop = sit ? -(SX.art.SIT_DY || 0) : sv.moving && sv.frame === 1 ? -1 : 0;
  }
  function planCrash(s, lv, rng) {
    const b = lv.building, top = b.floors | 0, T = T_();
    if (top < 3) return;
    const fl = [];
    for (let f = 1; f < top; f++) fl.push(f);
    const G = SX.game, I = SX.items;
    for (const f of rng.shuffle(fl)) {
      const F = lv.floors[f];
      if (!F) continue;
      const cand = [];
      for (const wy of [ lv.Y0, lv.Y0 + 1, lv.Y0 - 1 ]) {
        for (let x = (lv.X0 | 0) + 2; x <= (lv.X1 | 0) - 4; x++) {
          let ok = true;
          for (let k = -1; k <= 3 && ok; k++) {
            const t = F.tile(x + k, wy);
            if (t !== T.WALL && t !== T.WINDOW) ok = false;
          }
          for (let k = 0; k < 3 && ok; k++) {
            const out = F.tile(x + k, wy - 1);
            if (out === T.FLOOR || out === T.DOOR || out === T.STAIR) ok = false;
            if (!freeT(F, x + k, wy + 1) || !F.in(x + k, wy + 2) || F.tile(x + k, wy + 2) !== T.FLOOR) ok = false;
            if (ok && (F.vault && F.vault.r && inRoom(F.vault.r, x + k, wy + 1) || F.ctrl && F.ctrl.r && inRoom(F.ctrl.r, x + k, wy + 1))) ok = false;
          }
          if (ok) cand.push([ x, wy ]);
        }
        if (cand.length) break;
      }
      for (const [bx, wy] of rng.shuffle(cand).slice(0, 6)) {
        const D0 = bfs(F, bx + 1, wy + 1);
        if (!stairOk(F, D0)) continue;
        const n0 = cnt(D0), blk = new Set, pick = [];
        const near = [];
        for (let y = wy + 1; y <= wy + 8; y++) for (let x = bx - 6; x <= bx + 8; x++) {
          if (!F.in(x, y)) continue;
          const dd = D0[F.i(x, y)];
          if (dd >= 2 && dd <= 8 && freeT(F, x, y) && !nearDoor(F, x, y)) near.push([ x, y ]);
        }
        const tryPut = tiles => {
          for (const [x, y] of tiles) blk.add(F.i(x, y));
          const D = bfs(F, bx + 1, wy + 1, blk);
          const ok = stairOk(F, D) && cnt(D) >= n0 - blk.size - 1 && pick.every(q => adjReach(F, D, q[0], q[1], q[2])) && adjReach(F, D, tiles[0][0], tiles[0][1], tiles.length);
          if (!ok) for (const [x, y] of tiles) blk.delete(F.i(x, y));
          return ok;
        };
        let vt = null;
        for (const [x, y] of rng.shuffle(near.slice())) {
          if (blk.has(F.i(x, y)) || !freeT(F, x + 1, y) || nearDoor(F, x + 1, y) || D0[F.i(x + 1, y)] < 0) continue;
          if (tryPut([ [ x, y ], [ x + 1, y ] ])) {
            vt = [ x, y ];
            pick.push([ x, y, 2 ]);
            break;
          }
        }
        if (!vt) continue;
        const nC = 3 + (rng.f() < .5 ? 1 : 0), cs = [];
        for (const [x, y] of rng.shuffle(near.slice())) {
          if (cs.length >= nC) break;
          if (blk.has(F.i(x, y))) continue;
          if (tryPut([ [ x, y ] ])) {
            cs.push([ x, y ]);
            pick.push([ x, y, 1 ]);
          }
        }
        if (cs.length < 3) continue;
        let pt = null;
        for (const [x, y] of near) {
          if (!blk.has(F.i(x, y)) && D0[F.i(x, y)] <= 4) {
            pt = [ x, y ];
            break;
          }
        }
        if (!pt) continue;
        const ctx = G.lootCtx ? G.lootCtx(f) : {
          building: b,
          floor: f
        };
        const crates = cs.map(([x, y]) => ({
          x,
          y,
          cont: M_().mkCont("armory", I.rollContainer(rng, "armory", ctx), rng)
        }));
        const vc = M_().mkCont("armory", I.rollAirdrop(rng, 4), rng);
        vc.name = "군용 금고";
        const pil = [];
        for (const nm of [ "K5 권총", "9mm 탄창", rng.f() < .5 ? "진통제" : "구급킷" ]) {
          try {
            const it = I.mk(nm);
            if (it) pil.push(it);
          } catch (e) {}
        }
        const pc = M_().mkCont("corpse", pil, rng);
        pc.name = "조종사 시신";
        const fire = [];
        for (const x of [ bx - 1, bx + 3 ]) if (F.tile(x, wy + 1) === T.FLOOR && !blk.has(F.i(x, wy + 1))) fire.push([ x, wy + 1 ]);
        const pspec = SX.art.charSpec("scav", new SX.Rng(s.o.s2 % 9973));
        Object.assign(pspec, {
          hat: "helmet",
          mask: null,
          top: "#55603e",
          pants: "#4a5238",
          key: "evpilot"
        });
        s.cr = {
          f,
          bx,
          wy,
          cT: s.o.cT,
          cs: crates,
          vc,
          pc,
          vx: vt[0],
          vy: vt[1],
          px: pt[0],
          py: pt[1],
          fire,
          pspec,
          done: false,
          vo: false,
          calm: false,
          warn: false,
          D: null,
          vp: null,
          x: bx + 1.5,
          y: wy + 1
        };
        return;
      }
    }
  }
  function doCrash(quiet) {
    const c = S && S.cr;
    if (!c || c.done) return;
    c.done = true;
    const F = S.lv.floors[c.f], T = T_(), M = M_(), A = A_();
    for (let k = 0; k < 3; k++) {
      const x = c.bx + k, y = c.wy, j = F.i(x, y + 1);
      F.set(x, y, T.FLOOR, F.fs[j]);
      if (F.room) F.room[F.i(x, y)] = F.room[j];
    }
    for (let k = 0; k < 3; k++) M.addProp(F, "evBreach", c.bx + k, c.wy, {
      v: k,
      solid: true,
      tall: true,
      cover: .9
    });
    c.cs.forEach((q, k) => {
      q.prop = M.addProp(F, "milCrate", q.x, q.y, {
        v: k,
        solid: true,
        cover: .6,
        cont: q.cont
      });
    });
    c.vp = M.addProp(F, "evVault", c.vx, c.vy, {
      v: 0,
      solid: true,
      cover: .8
    });
    const pp = M.addProp(F, "corpse", c.px, c.py, {
      v: 1,
      solid: false,
      cont: c.pc
    });
    if (pp) {
      pp.px = c.px;
      pp.py = c.py;
      pp.flipX = (c.px & 1) === 1;
      pp.body = {
        spec: c.pspec,
        deathT: 9,
        dead: true,
        type: "scav"
      };
    }
    F.fireAt = F.fireAt || new Uint8Array(F.W * F.H);
    c.fire.forEach(([x, y], k) => {
      F.fireAt[F.i(x, y)] = 1;
      M.addProp(F, "blaze", x, y, {
        v: k * 3 % 8,
        solid: false,
        tall: false,
        cover: 0
      });
      if (F.lamps) F.lamps.push({
        x: x + .5,
        y: y + .5,
        r: 7,
        c: [ 255, 130, 50 ],
        a: .7,
        flicker: true
      });
    });
    if (SX.art && SX.art.blazeLink) SX.art.blazeLink(F);
    if (c.vo) openVault(true);
    c.D = bfs(F, c.bx + 1, c.wy + 1);
    if (A.player && A.player.floor === c.f) unstick(F, A.player);
    if (isAuth()) for (const e of A.enemies) if (e.alive && e.floor === c.f) unstick(F, e);
    for (const sv of S.sv) if (sv.floor === c.f) unstick(F, sv);
    inval(F);
    if (quiet) return;
    const p = A.player, here = p && p.floor === c.f;
    if (here) {
      SX.audio.play("explode", {
        x: c.x,
        y: c.y,
        range: 60,
        vol: 1
      });
      SX.audio.play("hitMetal", {
        x: c.x,
        y: c.y,
        range: 40,
        vol: 1,
        delay: .25
      });
      SX.audio.play("brick", {
        x: c.x,
        y: c.y,
        range: 40,
        vol: 1,
        delay: .5
      });
    } else if (p) SX.audio.play("explode", {
      x: p.x,
      y: p.y - 6,
      range: 60,
      vol: .45
    });
    if (SX.view && SX.view.shake) SX.view.shake(here ? 8 : 3);
    A.smoke(F, c.x, c.y + .5, 18, true);
    const msg = "군 수송 헬기가 " + fname(c.f) + " 북쪽 벽에 부딪혔습니다";
    SX.log("🚁 " + (SX.tr ? SX.tr(msg) : msg), "bad");
    if (SX.ui && SX.ui.bigNote) SX.ui.bigNote(msg, "", 3200);
  }
  function openVault(quiet) {
    const c = S.cr;
    if (!c) return;
    c.vo = true;
    const p = c.vp;
    if (!p) return;
    if (p.v !== 1) {
      p.v = 1;
      const cont = c.vc;
      p.cont = cont;
      cont.prop = p;
      cont.floor = c.f;
      cont.x = c.vx + 1;
      cont.y = c.vy + .5;
      const F = S.lv.floors[c.f];
      if (F.conts.indexOf(cont) < 0) F.conts.push(cont);
      inval(F);
    }
    if (!quiet) play("metalCreak", c.f, c.vx + 1, c.vy + .5, 30, 1);
  }
  const contEmpty = ct => !ct || !ct.grid || !ct.grid.list || ct.grid.list.length === 0;
  function crashEmpty() {
    const c = S.cr;
    return c.vo && contEmpty(c.vc) && contEmpty(c.pc) && c.cs.every(q => contEmpty(q.cont));
  }
  function crashTick(dt) {
    const c = S.cr, Rd = SX.raid, A = A_(), p = A.player;
    if (!c.done) {
      if (!c.warn && Rd.t >= c.cT - 4 && Rd.t < c.cT) {
        c.warn = true;
        if (p) SX.audio.play("heliLand", {
          x: p.x,
          y: p.y - 5,
          range: 60,
          vol: p.floor === c.f ? .9 : .5
        });
      }
      if (Rd.t >= c.cT) doCrash(Rd.t - c.cT > 5);
      return;
    }
    const F = S.lv.floors[c.f];
    S.chkT -= dt;
    if (S.chkT <= 0) {
      S.chkT = 1;
      if (!c.calm && crashEmpty()) {
        c.calm = true;
        c.calmT = Rd.t;
      }
    }
    if (p && p.alive && p.floor === c.f && F.fireAt) {
      const tx = Math.floor(p.x), ty = Math.floor(p.y);
      if (F.in(tx, ty) && F.fireAt[F.i(tx, ty)] && c.fire.some(q => q[0] === tx && q[1] === ty)) {
        if (SX.recap) SX.recap.tick("fire", 12 * dt);
        A.rawHurt(12 * dt, "불길에 휩싸였습니다");
        p.hurtT = Math.max(p.hurtT || 0, .25);
        if (SX.ui.hudDirty) SX.ui.hudDirty();
      }
    }
    if (isAuth()) {
      S.fireT -= dt;
      if (S.fireT <= 0) {
        S.fireT = .5;
        for (const e of A.enemies) {
          if (!e.alive || e.floor !== c.f) continue;
          const tx = Math.floor(e.x), ty = Math.floor(e.y);
          if (c.fire.some(q => q[0] === tx && q[1] === ty)) A.damageEnemy(F, e, 6, 0, {
            kind: "enemy",
            alive: false,
            type: "fire"
          });
        }
      }
    }
    if (!p || p.floor !== c.f) return;
    const k = c.calm ? Math.max(0, 1 - (Rd.t - c.calmT) / 8) : 1;
    if (k <= 0) return;
    S.smT -= dt;
    if (S.smT > 0) return;
    S.smT = .12;
    A.part({
      floor: c.f,
      x: c.x + (Math.random() - .5) * 2.4,
      y: c.y + .4 + Math.random() * .6,
      z: 1,
      vx: (Math.random() - .5) * .4,
      vy: .25 + Math.random() * .3,
      vz: .35,
      c: "rgba(60,58,54,0.4)",
      s: 6 + Math.random() * 6,
      t: 3,
      life: 3,
      smoke: true
    });
    const D = c.D;
    if (!D) return;
    for (let n = 0; n < 2; n++) {
      if (Math.random() > k) continue;
      const tx = Math.floor(p.x + (Math.random() - .5) * 14), ty = Math.floor(p.y + (Math.random() - .5) * 10);
      if (!F.in(tx, ty)) continue;
      const dd = D[F.i(tx, ty)];
      if (dd < 1 || dd > 48 || Math.random() > 1 - dd / 52) continue;
      let vx = 0, vy = 0;
      for (const [ax, ay] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        if (!F.in(tx + ax, ty + ay)) continue;
        if (D[F.i(tx + ax, ty + ay)] === dd + 1) {
          vx = ax;
          vy = ay;
          break;
        }
      }
      A.part({
        floor: c.f,
        x: tx + Math.random(),
        y: ty + Math.random(),
        z: 1.3,
        vx: vx * .45,
        vy: vy * .45,
        vz: .04,
        c: "rgba(78,76,70," + (.3 * (1 - dd / 60)).toFixed(2) + ")",
        s: 6 + Math.random() * 5,
        t: 2.6,
        life: 2.6,
        smoke: true
      });
    }
  }
  function placeRadio(s, lv, rng) {
    const top = lv.building.floors | 0, o = s.o, T = T_();
    const fl = [];
    for (let f = 0; f < Math.max(1, top); f++) fl.push(f);
    const used = (F, r) => s.sv.some(v => v.room === r) || s.cr && s.cr.f === F.idx && inRoom(r, s.cr.bx + 1, s.cr.wy + 1);
    let rad = null;
    for (const f of rng.shuffle(fl.slice())) {
      const F = lv.floors[f];
      if (!F || !F.rooms) continue;
      for (const r of rng.shuffle(F.rooms.slice())) {
        if (!okRoom(F, r) || area(r) < 9 || used(F, r)) continue;
        for (let x = r.x0 + 1; x <= r.x1 - 1 && !rad; x++) {
          const y = r.y0;
          if (F.tile(x, y - 1) !== T.WALL || !freeT(F, x, y) || nearDoor(F, x, y) || nearDoor(F, x, y + 1) || !freeT(F, x, y + 1)) continue;
          rad = {
            F,
            r,
            x,
            y
          };
        }
        if (rad) break;
      }
      if (rad) break;
    }
    if (!rad) return;
    let call = null;
    for (const f of rng.shuffle(fl.slice())) {
      const F = lv.floors[f];
      if (!F || !F.rooms) continue;
      for (const r of rng.shuffle(F.rooms.slice())) {
        if (r === rad.r || !ROOM_KO[r.theme] || !okRoom(F, r) || area(r) < 9 || used(F, r)) continue;
        const ds = doorsOf(F, r).filter(d => !d.locked && !d.key && !d.exit && !d.vault);
        if (!ds.length) continue;
        call = {
          F,
          r,
          d: ds[0]
        };
        break;
      }
      if (call) break;
    }
    if (!call) return;
    const F = rad.F, pr = M_().addProp(F, "radio", rad.x, rad.y, {
      v: 0,
      solid: true,
      tall: false,
      cover: .3
    });
    if (!pr) return;
    pr.evRadio = true;
    inval(F);
    let rn = ROOM_KO[call.r.theme];
    if (!o.real && o.fake) {
      const have = new Set(call.F.rooms.map(r => r.theme));
      const bt = BTH[lv.building.id] || Object.keys(ROOM_KO), fk = bt.filter(k => !have.has(k));
      if (fk.length) rn = ROOM_KO[fk[Math.floor(rng.f() * fk.length)]];
    }
    const R = call.r, rd = {
      f: F.idx,
      x: rad.x + .5,
      y: rad.y + .5,
      prop: pr,
      cf: call.F.idx,
      room: R,
      door: call.d,
      rn,
      real: o.real,
      sup: o.sup,
      clue: o.clue,
      rT: null,
      reached: false,
      cut: false,
      woke: false,
      es: null,
      tp: null,
      cont: null
    };
    if (o.real && !o.sup) {
      const sp = backSpot(call.F, R, call.d, rng, null);
      if (sp) s.sv.push(Object.assign(mkSv("r", call.F, sp.x + .5, sp.y + .6, 9300 + o.s2 % 991, 5), {
        room: R
      }));
    } else if (o.real && o.sup) {
      const sp = backSpot(call.F, R, call.d, rng, null);
      if (sp) {
        const ct = M_().mkCont("armory", SX.items.rollContainer(rng, "armory", SX.game.lootCtx ? SX.game.lootCtx(call.F.idx) : null), rng);
        M_().addProp(call.F, "milCrate", sp.x, sp.y, {
          v: 1,
          solid: true,
          cover: .6,
          cont: ct
        });
        rd.cont = ct;
        inval(call.F);
      }
    } else {
      const dc = doorTiles(call.d)[0], tp = [];
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
        if (!freeT(call.F, x, y)) continue;
        const dd = Math.hypot(x - dc[0], y - dc[1]);
        if (dd >= 1 && dd <= 3.2) tp.push([ x, y, dd ]);
      }
      tp.sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]);
      const rr = new SX.Rng((o.s2 ^ 1961) >>> 0), ctx = SX.game.lootCtx ? SX.game.lootCtx(call.F.idx) : null, A = A_();
      rd.es = tp.slice(0, o.trapN).map(q => {
        const x = q[0] + .5, y = q[1] + .5, e = A.spawnEnemy(call.F, "scav", x, y, rr, ctx);
        e.armed = true;
        e.melee = null;
        e.melee2 = false;
        if (SX.enemyGun) e.gun = SX.enemyGun(rr, 3);
        e.doorSkill = true;
        e.alive = false;
        e.dormant = true;
        e.evTrap = true;
        e.face = Math.atan2(call.d.cy - y, call.d.cx - x);
        return e;
      });
    }
    s.rd = rd;
  }
  function wake(quiet, x, y) {
    const rd = S.rd;
    if (!rd) return;
    rd.woke = true;
    rd.reached = true;
    if (!rd.es) return;
    const c = {
      x: x != null ? x : rd.door.x + .5,
      y: y != null ? y : rd.door.y + .5
    };
    for (const e of rd.es) {
      if (!e.dormant) continue;
      e.dormant = false;
      e.alive = true;
      e.ai = "alert";
      e.lureX = c.x;
      e.lureY = c.y;
      e.lureT = 30;
      e.seenX = c.x;
      e.seenY = c.y;
    }
    if (!quiet && S.mk) S.mk = false;
  }
  function transcript() {
    const rd = S.rd, a = "치직… 누구 없어요? 여기 " + fname(rd.cf) + " " + rd.rn + "… 다리를 다쳤어요. 제발 와 주세요…";
    if (rd.real) return [ a ];
    return [ a, [ "…혼자 와.", "…무기는 두고 와.", "(무전 너머로 철컥 — 장전하는 소리)" ][rd.clue | 0] ];
  }
  const radioOver = () => {
    const rd = S.rd;
    return !rd || rd.cut || rd.reached || rd.woke;
  };
  function earPose(dir) {
    return dir === 1 ? {
      n: [ 3, -29 ],
      f: [ 7, -18 ]
    } : dir === 3 ? {
      n: [ -4, -29 ],
      f: [ -8, -18 ]
    } : dir === 2 ? {
      n: [ -5, -28 ],
      f: [ 4, -19 ]
    } : {
      n: [ 5, -28 ],
      f: [ -4, -18 ]
    };
  }
  function earOn() {
    const p = A_().player;
    if (!p || S.ear) return;
    S.ear = {
      ap: p.armPose || null,
      hw: p.hideWeapon,
      t: 15
    };
  }
  function earOff() {
    const p = A_().player;
    if (!S || !S.ear) return;
    if (p) {
      p.armPose = S.ear.ap;
      p.hideWeapon = S.ear.hw;
    }
    S.ear = null;
  }
  function listen(fromNet) {
    const rd = S.rd, p = A_().player;
    if (!rd || !p) return;
    play("squelch", rd.f, rd.x, rd.y, 14, .8);
    if (radioOver()) {
      SX.log("📻 치직… 지지직…");
      return;
    }
    play("radioVoice", rd.f, rd.x, rd.y, 14, .9, .3);
    if (!rd.real) play("slideRack", rd.f, rd.x, rd.y, 10, .35, 2.4);
    const L = transcript();
    for (const l of L) SX.log("📻 " + (SX.tr ? SX.tr(l) : l));
    earOn();
    const done = () => earOff();
    if (SX.ui && SX.ui.ask) SX.ui.ask("📻 구조 무전", esc(L[0]) + (L[1] ? "<br><br>" + esc(L[1]) : ""), 0, () => {
      done();
      respond();
    }, () => done(), {
      yes: "응답",
      no: "무시"
    });
    if (!fromNet) send({
      q: "lsn",
      f: rd.f,
      x: r2(p.x),
      y: r2(p.y)
    });
  }
  function respond() {
    const rd = S.rd;
    if (!rd || radioOver()) return;
    S.mk = true;
    if (rd.rT == null) {
      rd.rT = SX.raid.t;
      send({
        q: "rt",
        t: r2(rd.rT)
      });
    }
    teamSend({
      q: "mk"
    });
    SX.log("📻 응답했습니다 — 지도에 " + fname(rd.cf) + " " + rd.rn + " 을(를) 표시했습니다 · 90초");
  }
  function radioTick(dt) {
    const rd = S.rd, A = A_(), p = A.player, Rd = SX.raid;
    if (p && p.floor === rd.f && Math.hypot(p.x - rd.x, p.y - rd.y) < 14 && SX.audio.spotLoop) SX.audio.spotLoop("evRadio", "chatter", {
      x: rd.x,
      y: rd.y,
      range: 14,
      vol: radioOver() ? .25 : .55
    });
    if (S.ear && p) {
      S.ear.t -= dt;
      if (S.ear.t <= 0 || S.ear.t < 14.6 && !(SX.ui.asking && SX.ui.asking()) && SX.ui.isOpen && !SX.ui.isOpen()) earOff(); else {
        p.armPose = earPose(A.dirOf(p.aim || 0));
        p.hideWeapon = true;
      }
    }
    const inside = (x, y, f) => f === rd.cf && inRoom(rd.room, Math.floor(x), Math.floor(y));
    if (p && p.alive && S.mk && inside(p.x, p.y, p.floor)) S.mk = false;
    if (!isAuth()) return;
    S.radT = (S.radT || 0) - dt;
    if (S.radT > 0) return;
    S.radT = .2;
    const who = [];
    if (p && p.alive) who.push(p);
    if (SX.coop && SX.coop.ghosts) for (const g of SX.coop.ghosts.values()) if (g.alive !== false) who.push(g);
    const w = who.find(a => inside(a.x, a.y, a.floor));
    if (w && !rd.reached) {
      rd.reached = true;
      if (!rd.real && !rd.woke) {
        wake(false, w.x, w.y);
        send({
          q: "wake",
          x: r2(w.x),
          y: r2(w.y)
        });
      } else send({
        q: "rch"
      });
      const sv = svById("r");
      if (sv && sv.st === 5) setSt(sv, 1, null, true);
    }
    if (rd.rT != null && !rd.reached && !rd.cut && Rd.t > rd.rT + RADIO_T) {
      rd.cut = true;
      const sv = svById("r");
      if (sv && sv.st === 5) {
        die(sv, 1, false);
      } else if (S.mk) SX.log("📻 무전이 끊겼습니다", "bad");
      S.mk = false;
      send({
        q: "cut"
      });
    }
  }
  function startJob(k, sv) {
    const p = A_().player;
    if (!p) return;
    S.job = {
      k,
      sv,
      t: 0,
      x: p.x,
      y: p.y,
      sndT: 0
    };
    p.reviving = "ev";
    p.reload = null;
    p.use = null;
  }
  function stopJob() {
    const p = A_().player;
    if (S) S.job = null;
    if (p && p.reviving === "ev") p.reviving = null;
  }
  E.cancelJob = function() {
    if (S && S.job && S.job.k === "vlt") {
      stopJob();
      return true;
    }
    return false;
  };
  E.jobOn = () => !!(S && S.job);
  function jobTick(dt) {
    const j = S.job, p = A_().player, A = A_();
    const bad = !p || !p.alive || p.down || Math.hypot(p.x - j.x, p.y - j.y) > .6 || SX.ui.isOpen && SX.ui.isOpen() || j.k === "clr" && (!SX.input.held("interact") || !j.sv.door || !j.sv.door.evShut) || j.k === "vlt" && (!S.cr || S.cr.vo);
    if (bad) {
      stopJob();
      return;
    }
    p.reviving = "ev";
    j.t += dt;
    j.sndT -= dt;
    const F = S.lv.floors[p.floor];
    if (j.sndT <= 0) {
      j.sndT = 1;
      if (j.k === "clr") {
        const nm = j.n = ((j.n | 0) + 1) % 2 ? "brick" : "rustle";
        SX.audio.play(nm, {
          x: p.x,
          y: p.y,
          range: 16,
          vol: .8
        });
        A.noise(F, p.x, p.y, 14);
        send({
          q: "snd",
          f: p.floor,
          x: r2(p.x),
          y: r2(p.y),
          n: nm,
          r: 16
        });
      } else {
        const nm = [ "trapPry", "metalCreak", "hitMetal" ][(j.n = (j.n | 0) + 1) % 3];
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
    }
    if (j.k === "clr" && j.t >= CLEAR_T) {
      stopJob();
      clearDebris(j.sv, false);
      const d = j.sv.door;
      if (d && !d.open) M_().toggleDoor(F, d, true);
      send({
        q: "clr",
        id: j.sv.id
      });
      if (isAuth()) setSt(j.sv, 1, null, true);
    }
    if (j.k === "vlt" && j.t >= VAULT_T) {
      stopJob();
      openVault(false);
      send({
        q: "vlt"
      });
    }
  }
  E.tick = function(dt, lv) {
    if (!S || !S.o || SX.raid.over) return;
    try {
      if (S.cr) crashTick(dt);
      if (S.rd) radioTick(dt);
      if (S.job) jobTick(dt);
      const p = A_().player, auth = isAuth();
      for (const sv of S.sv) {
        if (sv.st === 4) continue;
        if (auth) svTickAuth(sv, dt);
        svAnim(sv, dt);
        if (sv.st === 0 && p && p.floor === sv.floor && Math.hypot(p.x - sv.x, p.y - sv.y) < 9) {
          sv.coughT -= dt;
          if (sv.coughT <= 0) {
            sv.coughT = 4 + Math.random() * 4;
            play("cough", sv.floor, sv.x, sv.y, 10, .6);
          }
        }
        if (sv.st === 2 && sv.by === me() && p && p.floor === sv.floor && Math.hypot(p.x - sv.x, p.y - sv.y) < OUT_D) sv.nearT = SX.raid.t;
      }
      if (auth && R_() && S.sv.length) {
        S.snapT -= dt;
        const mv = S.sv.some(v => v.st === 2);
        if (S.snapT <= 0) {
          S.snapT = mv ? .15 : 1;
          send({
            q: "s",
            r: S.sv.map(row)
          });
        }
      }
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn("[ev] tick", e);
      }
    }
  };
  const row = v => [ v.id, r2(v.x), r2(v.y), v.floor, Math.round(v.hp), v.st, v.by, r2(v.face), v.moving ? 1 : 0 ];
  function applyRow(q, snap) {
    const sv = svById(q[0]);
    if (!sv) return;
    const [, x, y, f, hp, st, by, face, mv] = q;
    if (sv.floor !== f || snap) {
      sv.x = x;
      sv.y = y;
    }
    sv.nx = x;
    sv.ny = y;
    sv.floor = f;
    sv.hp = hp;
    sv.face = face;
    sv.moving = !!mv;
    if (st === 3 && sv.st !== 3) {
      sv.alive = false;
      sv.st = 3;
      return;
    }
    if (st !== sv.st) {
      if (st === 2 || sv.st === 2) setSt(sv, st, by, false); else {
        sv.st = st;
        sv.by = by;
      }
    } else sv.by = by;
  }
  E.onMsg = function(from, d) {
    if (!E.ensure() || !S.o) return;
    const auth = isAuth(), p = A_().player;
    switch (d.q) {
     case "s":
      if (!auth) for (const q of d.r || []) applyRow(q, false);
      break;

     case "st":
      {
        const sv = svById(d.id);
        if (!sv) break;
        if (sv.floor !== d.f) {
          sv.x = sv.nx = d.x;
          sv.y = sv.ny = d.y;
          sv.floor = d.f;
        }
        setSt(sv, d.st, d.by, false);
        break;
      }

     case "take":
      {
        const sv = svById(d.id);
        if (sv && auth) take(sv, from);
        break;
      }

     case "clr":
      {
        const sv = svById(d.id);
        if (sv) {
          clearDebris(sv, false);
          if (auth && sv.st === 0) setSt(sv, 1, null, true);
        }
        break;
      }

     case "die":
      {
        const sv = svById(d.id);
        if (sv) die(sv, d.w | 0, false);
        break;
      }

     case "out":
      {
        const sv = svById(d.id);
        if (sv) {
          sv.st = 4;
          sv.by = null;
          if (auth) send({
            q: "st",
            id: sv.id,
            st: 4,
            by: null,
            x: r2(sv.x),
            y: r2(sv.y),
            f: sv.floor
          });
        }
        break;
      }

     case "hit":
      {
        const sv = svById(d.id);
        if (sv && auth) hurtSv(sv, +d.d || 0, null);
        break;
      }

     case "lsn":
      if (S.rd && p && p.alive && p.floor === d.f && Math.hypot(p.x - d.x, p.y - d.y) < HEAR_D) listen(true);
      break;

     case "rt":
      if (S.rd && (S.rd.rT == null || d.t < S.rd.rT)) S.rd.rT = +d.t;
      break;

     case "mk":
      if (S.rd && !radioOver() && SX.coop.evSame && SX.coop.evSame(from)) S.mk = true;
      break;

     case "wake":
      if (S.rd) wake(false, d.x, d.y);
      break;

     case "rch":
      if (S.rd) S.rd.reached = true;
      break;

     case "cut":
      if (S.rd && !S.rd.cut) {
        S.rd.cut = true;
        const sv = svById("r");
        if (sv && sv.st === 5) die(sv, 1, false); else if (S.mk) SX.log("📻 무전이 끊겼습니다", "bad");
        S.mk = false;
      }
      break;

     case "snd":
      play(d.n, d.f, d.x, d.y, d.r || 16, .9);
      break;

     case "vlt":
      openVault(false);
      break;
    }
  };
  E.dump = function() {
    if (!S || !S.o) return undefined;
    const rd = S.rd;
    return {
      v: 1,
      sv: S.sv.map(row),
      clr: S.clr.slice(),
      cr: S.cr && S.cr.done ? 1 : 0,
      vo: S.cr && S.cr.vo ? 1 : 0,
      rT: rd ? rd.rT : null,
      wk: rd && rd.woke ? 1 : 0,
      rc: rd && rd.reached ? 1 : 0,
      cut: rd && rd.cut ? 1 : 0
    };
  };
  E.worldIn = function(w) {
    if (!w || !S || !S.o) return;
    try {
      for (const id of w.clr || []) clearDebris(svById(id), true);
      if (w.cr && S.cr) doCrash(true);
      if (w.vo && S.cr) {
        S.cr.vo = true;
        if (S.cr.done) openVault(true);
      }
      for (const q of w.sv || []) applyRow(q, true);
      const rd = S.rd;
      if (rd) {
        if (w.rT != null) rd.rT = w.rT;
        if (w.rc) rd.reached = true;
        if (w.cut) rd.cut = true;
        if (w.wk) wake(true);
      }
    } catch (e) {
      console.warn("[ev] worldIn", e);
    }
  };
  E.target = function(F, p, add) {
    if (!E.ensure() || !S.o || !F) return null;
    let best = null, bd = 9;
    const put = (o, box, d) => {
      if (d < bd) {
        bd = d;
        best = add(o, () => [ box ]);
      } else add(o, () => [ box ]);
    };
    for (const sv of S.sv) {
      if (sv.floor !== F.idx || !sv.alive) continue;
      if (sv.st === 0 && sv.door && sv.door.evShut) {
        for (const [x, y] of doorTiles(sv.door)) {
          const d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
          if (d < 1.5) {
            put({
              kind: "ev",
              sub: "clr",
              sv,
              x: x + .5,
              y,
              label: "🧱 잔해 치우기 — [" + key() + "] 누르고 3초 (시끄럽습니다)"
            }, [ x, y - .4, x + 1, y + 1 ], d);
            break;
          }
        }
      } else if (sv.st === 1 || sv.st === 5) {
        const d = Math.hypot(sv.x - p.x, sv.y - p.y);
        if (d < 1.5) put({
          kind: "ev",
          sub: "take",
          sv,
          x: sv.x,
          y: sv.y - 1,
          label: "🙋 다친 생존자 — 같이 가기"
        }, [ sv.x - .45, sv.y - 1.1, sv.x + .45, sv.y + .2 ], d);
      }
    }
    const c = S.cr;
    if (c && c.done && !c.vo && F.idx === c.f) {
      const d = Math.hypot(c.vx + 1 - p.x, c.vy + .6 - p.y);
      if (d < 1.8) put({
        kind: "ev",
        sub: "vlt",
        x: c.vx + 1,
        y: c.vy - .5,
        label: S.job && S.job.k === "vlt" ? "🔩 금고 비트는 중 — [" + key() + "] 그만" : "🔩 군용 금고 비틀어 열기 (8초 · 아주 시끄럽습니다)"
      }, [ c.vx, c.vy - .6, c.vx + 2, c.vy + 1 ], d);
    }
    const rd = S.rd;
    if (rd && F.idx === rd.f) {
      const d = Math.hypot(rd.x - p.x, rd.y + .4 - p.y);
      if (d < 1.6) put({
        kind: "ev",
        sub: "rad",
        x: rd.x,
        y: rd.y - .8,
        label: "📻 무전기 듣기"
      }, [ rd.x - .5, rd.y - 1, rd.x + .5, rd.y + .5 ], d);
    }
    return best;
  };
  E.interact = function(t) {
    if (!S || !t) return;
    if (t.sub === "clr") startJob("clr", t.sv); else if (t.sub === "vlt") {
      if (!S.job) startJob("vlt", null);
    } else if (t.sub === "rad") listen(false); else if (t.sub === "take") {
      const sv = t.sv;
      if (isAuth()) take(sv, me()); else {
        send({
          q: "take",
          id: sv.id
        }, R_().auth);
        if (sv.st === 5 && S.rd) S.rd.reached = true;
      }
    }
  };
  E.hud = function() {
    if (!S || !S.job) return null;
    const j = S.job;
    return j.k === "clr" ? {
      text: "잔해 치우는 중 … " + Math.max(0, CLEAR_T - j.t).toFixed(1),
      col: null
    } : {
      text: "금고 비트는 중 … " + Math.max(0, VAULT_T - j.t).toFixed(1) + " · [" + key() + "] 그만",
      col: null
    };
  };
  E.hud2 = function() {
    const rd = S && S.rd;
    if (!rd || !S.mk || rd.rT == null || radioOver()) return null;
    const left = Math.max(0, rd.rT + RADIO_T - SX.raid.t);
    return {
      text: "📻 " + fname(rd.cf) + " " + rd.rn + " — " + Math.ceil(left) + "초",
      col: null
    };
  };
  E.marks = function(out) {
    if (!S || !S.o) return;
    const c = S.cr;
    if (c && c.done && !c.calm) out.push({
      f: c.f,
      x: c.x,
      y: c.y,
      col: "rgb(232,120,64)",
      label: "추락한 헬기"
    });
    const rd = S.rd;
    if (rd && S.mk) out.push({
      f: rd.cf,
      x: (rd.room.x0 + rd.room.x1 + 1) / 2,
      y: (rd.room.y0 + rd.room.y1 + 1) / 2,
      col: "rgb(120,200,255)",
      label: "무전 — " + rd.rn
    });
  };
  E.pois = function(f) {
    const o = [];
    if (!S || !S.o) return o;
    const c = S.cr;
    if (c && c.done && f === c.f && !c.calm) o.push({
      kind: "drop",
      x: c.x,
      y: c.y
    });
    const rd = S.rd;
    if (rd && S.mk && f === rd.cf) o.push({
      kind: "ping",
      x: (rd.room.x0 + rd.room.x1 + 1) / 2,
      y: (rd.room.y0 + rd.room.y1 + 1) / 2
    });
    return o;
  };
  E.actors = function(fi) {
    return S && S.o && SX.raid && SX.raid.level === S.lv ? S.sv.filter(v => v.floor === fi && v.st !== 4) : [];
  };
  E.targets = function(out) {
    if (!S || !S.o) return;
    for (const sv of S.sv) {
      if (!sv.alive || sv.st !== 1 && sv.st !== 2) continue;
      if (!sv._tg) sv._tg = {
        evs: sv,
        player: false,
        get x() {
          return sv.x;
        },
        get y() {
          return sv.y;
        },
        get alive() {
          return sv.alive && (sv.st === 1 || sv.st === 2);
        },
        get floor() {
          return sv.floor;
        },
        stealth: 1,
        cover: null,
        view: null
      };
      out.push(sv._tg);
    }
  };
  E.hurt = function(sv, dmg, e) {
    if (S && isAuth()) hurtSv(sv, dmg, e ? Math.atan2(sv.y - e.y, sv.x - e.x) : null);
  };
  E.bulletHit = function(b, dist) {
    if (!S || !S.o || !S.sv.length) return false;
    for (const sv of S.sv) {
      if (!sv.alive || sv.st === 3 || sv.st === 4 || sv.floor !== b.floor) continue;
      if (Math.abs(sv.x - b.x) >= .35 || Math.abs(sv.y - .5 - b.y) >= .55) continue;
      if (b.vis) return true;
      const fk = b.from && b.from.kind;
      if (fk === "enemy") {
        if (isAuth()) hurtSv(sv, b.dmg || 0, Math.atan2(b.y - b.oy, b.x - b.ox));
        return true;
      }
      if (b.from === A_().player) {
        let dmg = b.dmg || 0;
        if (b.falloff) dmg *= Math.max(.25, 1 - dist / b.falloff);
        if (isAuth()) hurtSv(sv, dmg, Math.atan2(b.y - b.oy, b.x - b.ox)); else {
          send({
            q: "hit",
            id: sv.id,
            d: Math.round(dmg)
          });
          const F = S.lv.floors[sv.floor];
          if (F && A_().bleedAt) A_().bleedAt(F, sv.x, sv.y);
        }
        return true;
      }
      return false;
    }
    return false;
  };
  E.fireAmb = function(p) {
    const c = S && S.cr;
    if (!c || !c.done || !p || p.floor !== c.f || !c.fire.length) return 0;
    let d = 99;
    for (const [x, y] of c.fire) d = Math.min(d, Math.hypot(x + .5 - p.x, y + .5 - p.y));
    return Math.max(0, 1 - d / 9);
  };
  E.onEnd = function(win) {
    E.rew = null;
    if (!S || !S.o) return;
    if (S.job) stopJob();
    earOff();
    if (!win) return;
    const p = A_().player, my = me();
    let n = 0;
    for (const sv of S.sv) {
      if (!sv.alive || sv.st !== 2 || sv.by !== my) continue;
      const near = p && p.floor === sv.floor && Math.hypot(p.x - sv.x, p.y - sv.y) < OUT_D || sv.nearT != null && SX.raid.t - sv.nearT < 6;
      if (!near) continue;
      n++;
      sv.st = 4;
      sv.by = null;
      send({
        q: "out",
        id: sv.id
      });
    }
    if (!n) return;
    const m = (S.o.bonus | 0) * n;
    E.rew = {
      money: m,
      n,
      line: "생존자 구출 +" + Math.round(m / 1e4) + "만 원"
    };
  };
  E.reward = function() {
    const r = E.rew;
    E.rew = null;
    return r;
  };
  E.todayLine = function() {
    const s = E.ensure();
    if (!s || !s.o) return "";
    let t = "";
    if (s.sv.some(v => v.id === "b")) t += " · 🆘 갇힌 생존자";
    if (s.cr) t += " · 🚁 군 헬기가 지납니다";
    if (s.rd) t += " · 📻 구조 무전";
    return t;
  };
  E._S = () => S;
  void {
    crash: () => doCrash(false),
    clear: id => clearDebris(svById(id), false),
    take: (id, who) => take(svById(id), who == null ? me() : who),
    vault: () => openVault(false),
    listen: () => listen(false),
    respond: () => respond(),
    transcript: () => transcript(),
    row,
    svById,
    earPose
  };
  (function art() {
    const A = SX.art;
    if (!A || !A.defProp || !A.propSize) return;
    const PP = A.PP || {}, RP = c => A.ramp ? A.ramp(c) : [ c, c, c, c, c, c ];
    const hr = (a, b) => {
      let h = Math.imul((a | 0) * 374761393 + (b | 0) * 668265263, 1274126177);
      h ^= h >>> 13;
      h = Math.imul(h, 1103515245);
      return (h >>> 0) % 1e3 / 1e3;
    };
    const sh = (P, x, y, w, h, a) => {
      if (PP.sbox) PP.sbox(P, x, y, w, h, a);
    };
    function rock(P, x, y, w, h, c) {
      const R = RP(c);
      P.r(x, y, w, h, R[2]).r(x, y, w, 1, R[0]).r(x, y + h - 1, w, 1, R[4]).r(x + w - 1, y, 1, h, R[3]);
    }
    if (!A.propSize("evDebris")) A.defProp("evDebris", 1, 1, 16, (P, w, h, up, g, v) => {
      const B = h - 2;
      sh(P, 1, B - 3, 30, 5, .4);
      P.r(2, B - 15, 27, 3, "#7a5a3a").r(2, B - 15, 27, 1, "#9a7a52").r(2, B - 13, 27, 1, "#4a3422");
      rock(P, 1, B - 10, 10, 9, "#7e7a72");
      rock(P, 10, B - 13, 12, 12, "#8a867c");
      rock(P, 21, B - 9, 10, 8, "#6e6a62");
      rock(P, 6, B - 19, 8, 6, "#76726a");
      rock(P, 17, B - 18, 9, 6, "#827e74");
      P.line(3, B - 21, 27, B - 6, "#6a3a22");
      P.line(5, B - 4, 24, B - 20, "#5a3020");
      for (let i = 0; i < 9; i++) P.p(2 + (hr(v, i) * 27 | 0), B - 2 - (hr(i, v + 3) * 4 | 0), "#5a5650");
    });
    if (!A.propSize("evBreach")) A.defProp("evBreach", 1, 1, 56, (P, w, h, up, g, v) => {
      const B = h - 2, ox = (v | 0) * 32, R = RP("#4f5a3a"), W = RP("#8a8478");
      sh(P, 0, B - 4, 32, 6, .5);
      if (v === 0) {
        for (let y = B - 50; y < B; y += 2) P.r(0, y, 3 + (hr(y, 1) * 4 | 0), 2, W[2]);
      }
      if (v === 2) {
        for (let y = B - 50; y < B; y += 2) {
          const ww = 3 + (hr(y, 2) * 4 | 0);
          P.r(32 - ww, y, ww, 2, W[3]);
        }
      }
      for (let X = ox; X < ox + 32; X++) {
        const x = X - ox;
        if (X >= 10 && X <= 92) {
          const k = (X - 10) / 82, cy = Math.round(B - 64 + k * 30), th = Math.round(4 + k * 9);
          P.r(x, cy - th, 1, th * 2, R[2]).p(x, cy - th, R[0]).r(x, cy - th + 1, 1, Math.max(1, th / 2 | 0), R[1]).r(x, cy + th - 2, 1, 2, R[4]).p(x, cy + th - 1, R[5]);
          if (X % 13 === 0) P.r(x, cy - th + 1, 1, th * 2 - 2, R[4]);
          if (X >= 40 && X <= 46) P.r(x, cy - 2, 1, 2, "#e8e0c8");
          if (hr(X, 7) < .12) P.p(x, cy + (hr(X, 9) * th | 0) - (th >> 1), "#22261e");
        }
        if (X >= 6 && X <= 13) {
          const fy = B - 82 + (X - 6);
          P.r(x, fy, 1, B - 64 - fy + 2, R[3]).p(x, fy, R[1]);
        }
        if (X >= 2 && X <= 18) {
          const t = X - 10;
          P.p(x, B - 74 + t, "#2a2c28");
          P.p(x, B - 74 - t, "#2a2c28");
        }
      }
      if (v === 2) {
        P.r(14, B - 44, 18, 26, R[3]).r(14, B - 44, 18, 2, R[1]).r(18, B - 38, 8, 6, "#1a2024").r(19, B - 37, 3, 2, "#5a7080");
      }
      for (let i = 0; i < 7; i++) {
        const x = hr(v * 11, i) * 26 | 0, y = B - 6 - (hr(i, v * 5) * 10 | 0), s2 = 3 + (hr(i * 3, v) * 4 | 0);
        rock(P, x, y, s2 + 1, s2, i % 2 ? "#7e7a72" : "#6a665e");
      }
      for (let i = 0; i < 14; i++) P.p(hr(i, v + 21) * 32 | 0, B - 10 - (hr(v + 8, i) * 50 | 0), "rgba(20,18,16,0.6)");
    });
    if (!A.propSize("evVault")) A.defProp("evVault", 2, 1, 30, (P, w, h, up, g, v) => {
      const B = h - 2, c = "#4a5446", R = RP(c);
      sh(P, 2, B - 4, 60, 6, .45);
      if (PP.box) PP.box(P, 4, B - 46, 56, 8, 36, c, {
        fi: 3
      }); else P.r(4, B - 46, 56, 44, R[2]);
      if (!v) {
        P.r(9, B - 35, 46, 28, R[3]).r(10, B - 34, 44, 26, R[2]);
        P.r(8, B - 32, 2, 6, "#2a2e2a").r(8, B - 16, 2, 6, "#2a2e2a");
        P.line(34, B - 21, 46, B - 21, "#1e2220").line(40, B - 27, 40, B - 15, "#1e2220").line(36, B - 25, 44, B - 17, "#1e2220").line(36, B - 17, 44, B - 25, "#1e2220");
        P.r(39, B - 22, 3, 3, "#9aa0a8");
        for (let i = 0; i < 6; i++) P.r(12 + i * 7, B - 44, 4, 3, i % 2 ? "#c8a830" : "#1e1e1e");
        P.r(14, B - 31, 14, 5, "#d8d0b0").r(15, B - 29, 12, 1, "#4a4a40");
      } else {
        P.r(9, B - 35, 46, 28, "#121614").r(11, B - 22, 42, 2, R[4]).r(11, B - 34, 42, 1, "#262c28");
        P.r(0, B - 38, 9, 33, R[3]).r(1, B - 37, 7, 31, R[2]).r(3, B - 24, 3, 3, "#9aa0a8");
        P.line(54, B - 30, 57, B - 22, "#c8c8c0").line(55, B - 31, 58, B - 24, "#8a8a84");
      }
      for (const x of [ 7, 57 ]) for (const y of [ B - 40, B - 9 ]) P.p(x, y, R[0]);
    });
    if (A.FOOT) {
      A.FOOT.evVault = A.FOOT.evVault || {
        x0: .04,
        x1: .96,
        d: .7
      };
      A.FOOT.evBreach = A.FOOT.evBreach || {
        x0: 0,
        x1: 1,
        d: .9
      };
    }
    if (A.PROP_MAT) {
      A.PROP_MAT.evVault = "metal";
      A.PROP_MAT.evBreach = "metal";
      A.PROP_MAT.evDebris = "wood";
    }
    if (A.defPropRot) for (const k of [ "evDebris", "evBreach", "evVault" ]) A.defPropRot(k, {
      noRot: true
    });
  })();
})(window.SX);
