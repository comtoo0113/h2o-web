"use strict";

(function(SX) {
  const A = SX.actors, L = SX.light, I = SX.items;
  const TC = SX.tac = {
    eyes: [],
    cover: null,
    clouds: [],
    blindT: 0,
    tearT: 0,
    coughT: 0,
    said: {}
  };
  const DIRS = [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ];
  const LEAN = .95;
  TC.reset = function() {
    TC.eyes = [];
    TC.cover = null;
    TC.clouds = [];
    TC.blindT = 0;
    TC.tearT = 0;
    TC.coughT = 0;
    TC.coverK = 0;
    TC.inSmoke = false;
    TC.hold = null;
    TC.aim = null;
  };
  function hug(F, fx, fy, sx, sy) {
    if (sx ? F.opaqueTile(Math.floor(fx + sx * .62), Math.floor(fy - .1)) : sy > 0 ? F.opaqueTile(Math.floor(fx), Math.floor(fy + .6)) : F.opaqueTile(Math.floor(fx), Math.floor(fy - .65))) return true;
    if (F.noPropOcc) return false;
    for (const p of F.props) {
      if (!p.tall || p.hidden || p.lift || p.x > fx + 2 || p.x + p.w < fx - 2 || p.y > fy + 2 || p.y + p.h < fy - 2) continue;
      const g = L.propGeo(p);
      if (sx) {
        const e = sx > 0 ? g.bx0 - fx : fx - g.bx1;
        if (e >= -.05 && e <= .62 && fy - .1 >= p.y && fy - .1 < p.y + p.h) return true;
      } else if (fx > g.bx0 && fx < g.bx1) {
        const e = sy > 0 ? g.sy0 - fy : fy - g.sy1;
        if (e >= -.05 && e <= (sy > 0 ? .6 : .65)) return true;
      }
    }
    return false;
  }
  const eyeY = (F, x, fy) => L.eyeY(F, x, fy);
  TC.findEyes = function(F, p) {
    const out = [];
    if (!F || !p || !p.alive || p.sprinting || p.boxOn || F.noPropOcc) return out;
    const fx = p.x, fy = p.y, by = eyeY(F, fx, fy);
    for (const [sx, sy] of DIRS) {
      if (!hug(F, fx, fy, sx, sy)) continue;
      for (const k of [ 1, -1 ]) {
        const dx = sy * k, dy = sx * k;
        const lx = fx + dx * LEAN, ly = fy + dy * LEAN;
        if (F.blocked(lx, ly - .1, true) || F.opaque(Math.floor(lx), Math.floor(ly - .1))) continue;
        if (hug(F, lx, ly, sx, sy)) continue;
        const lby = eyeY(F, lx, ly);
        if (!(L.los(F, fx, by, lx, by) && L.los(F, lx, by, lx, lby))) continue;
        const ex = sx ? lx + sx * .75 : lx, ey = sx ? lby : sy > 0 ? ly + .8 : ly - .85;
        if (!F.in(Math.floor(ex), Math.floor(ey)) || (L.eyeBlock ? L.eyeBlock(F, Math.floor(ex), Math.floor(ey)) : F.opaque(Math.floor(ex), Math.floor(ey)))) continue;
        if (out.some(q => Math.hypot(q.x - ex, q.y - ey) < .3)) continue;
        out.push({
          x: ex,
          y: ey,
          lx,
          ly: lby
        });
      }
    }
    return out;
  };
  TC.peekVis = function(F) {
    const p = A.player;
    TC.eyes = SX.game.state === "raid" ? TC.findEyes(F, p) : [];
    for (const e of TC.eyes) L.computeVis(F, e.x, e.y, 18, true, e.y);
    if (TC.eyes.length && !TC.said.peek) {
      TC.said.peek = true;
      SX.log("👁 모서리에 붙어 서면 몸은 숨긴 채 너머를 엿봅니다(달리는 중에는 안 됩니다)");
    }
  };
  TC.peeking = () => TC.eyes.length > 0;
  const lowCover = pr => !!(pr && pr.solid && !pr.tall && (pr.cover || 0) >= .45);
  TC.findCover = function(F, p) {
    if (!F || !p || !p.alive || !p.crouch) return null;
    let set = null;
    for (const [sx, sy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ], [ 1, 1 ], [ -1, 1 ], [ 1, -1 ], [ -1, -1 ] ]) {
      const tx = Math.floor(p.x + sx * .7), ty = Math.floor(p.y - .15 + sy * .7);
      const pr = F.in(tx, ty) ? F.propAt[ty * F.W + tx] : null;
      if (lowCover(pr)) (set = set || new Set).add(pr);
    }
    return set;
  };
  const mates = () => SX.coop && SX.coop.inCoop() ? SX.coop.ghosts.values() : [];
  TC.coverOf = function(pr, b) {
    if (b && b.from && b.from.kind === "enemy") {
      if (TC.cover && TC.cover.has(pr)) return Math.max(pr.cover || 0, .96);
      for (const g of mates()) if (g.cover && g.cover.has(pr)) return Math.max(pr.cover || 0, .96);
    }
    return pr.cover;
  };
  TC.hiddenFrom = function(F, e, T) {
    const p = T || A.player, cov = T ? T.cover : TC.cover;
    if (!cov || !p || !e || e.floor !== p.floor) return false;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d < 2) return false;
    for (let s = .3; s <= 1.6; s += .25) {
      const tx = Math.floor(p.x + dx / d * s), ty = Math.floor(p.y - .15 + dy / d * s);
      const pr = F.in(tx, ty) ? F.propAt[ty * F.W + tx] : null;
      if (pr && cov.has(pr)) return true;
    }
    return false;
  };
  TC.netState = function() {
    const h = TC.hold ? TC.hold.name : "";
    const fl = (TC.blindT > .5 ? 1 : 0) | (TC.tearT > 0 ? 2 : 0) | (TC.aim && !TC.aim.cancel ? 4 : 0);
    return fl || h ? [ 0, 0, fl, h ] : null;
  };
  TC.netApply = function(g, v) {
    if (!Array.isArray(v)) {
      if (g.tac) {
        g.tac.fl = 0;
        g.tac.hold = null;
      }
      return;
    }
    const q = g.tac || (g.tac = {
      fl: 0,
      hold: null
    });
    q.fl = v[2] | 0;
    const n = typeof v[3] === "string" ? v[3].slice(0, 12) : "";
    q.hold = n ? q.hold && q.hold.name === n ? q.hold : {
      name: n,
      brick: n === "벽돌"
    } : null;
  };
  TC.dazeSay = function(e, kind) {
    if (kind === "gas") A.texts.push({
      a: e,
      text: SX.rnd.pick([ "콜록!", "최루탄이다!", "눈 따가워!" ]),
      t: 1.4,
      col: "#d8e0b8"
    }); else A.texts.push({
      a: e,
      text: e.type === "scav" ? SX.rnd.pick([ "눈이…!", "안 보여!", "으악!" ]) : "…!",
      t: 1.6,
      col: "#fff6a0"
    });
  };
  TC.dazeFx = function(e, dt) {
    if (e.gasT > 0 && Math.random() < dt * .5) SX.audio.play("cough", {
      x: e.x,
      y: e.y,
      range: 16,
      vol: .6,
      r: .9
    });
  };
  function fireBurst(F, n) {
    SX.audio.play("hitGlass", {
      x: n.x,
      y: n.y,
      f: F.idx,
      range: 22,
      vol: .95
    });
    SX.audio.play("stoveIgnite", {
      x: n.x,
      y: n.y,
      f: F.idx,
      range: 18,
      vol: .8
    });
    L.flash(F.idx, n.x, n.y, 5, [ 255, 150, 60 ], .45, 1.2);
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * 6.28, v = 1 + Math.random() * 2.5;
      A.part({
        floor: F.idx,
        x: n.x,
        y: n.y,
        z: .2,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 1 + Math.random() * 1.5,
        g: 9,
        c: k < 4 ? "#7ac890" : A.FX.spark,
        t: .35,
        life: .35
      });
    }
    A.noise(F, n.x, n.y, 14, false, 0, true);
    if (!n.remote && SX.chem) SX.chem.molotov(F, n.x, n.y);
  }
  TC.burst = function(F, n) {
    if (n.sub === "fire") fireBurst(F, n); else if (n.sub === "flash") flashBang(F, n); else if (n.sub === "gas") cloudStart(F, n, "gas"); else if (n.sub === "smoke") cloudStart(F, n, "smoke");
  };
  const runsEnemies = () => !SX.coop || SX.coop.runEnemies();
  const mateNade = n => !!(n.from && n.from.kind === "peer" && n.from.mate);
  function flashBang(F, n) {
    const R0 = n.radius || 7.5;
    SX.audio.play("flashbang", {
      x: n.x,
      y: n.y,
      f: F.idx,
      range: 70
    });
    L.flash(F.idx, n.x, n.y, 15, [ 255, 255, 255 ], .5, 2.4);
    A.smoke(F, n.x, n.y, 8, true);
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * 6.28, v = 4 + Math.random() * 7;
      A.part({
        floor: F.idx,
        x: n.x,
        y: n.y,
        z: .4,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 1 + Math.random() * 2,
        g: 9,
        c: A.FX ? A.FX.spark : "#ffffff",
        t: .3,
        life: .3
      });
    }
    A.noise(F, n.x, n.y, 30, false, 0, true);
    const p = A.player;
    if (p && p.alive && p.floor === F.idx && !mateNade(n) && !SX.game.god) {
      const nv = !!(SX.nvg && SX.nvg.on(p)), NV = SX.nvg;
      const d = Math.hypot(p.x - n.x, p.y - n.y), R1 = R0 * 1.3 * (nv ? NV.FLASH_R : 1);
      if (d < R1 && L.los(F, n.x, n.y - .2, p.x, p.y - .5)) {
        const facing = d < 1 ? 1 : Math.cos(SX.angDiff(p.aim, Math.atan2(n.y - p.y, n.x - p.x))) > .15 ? 1 : nv ? NV.FLASH_AWAY : .35;
        const t = (1 + 3.6 * (1 - d / R1) * facing) * (nv ? NV.FLASH_T : 1);
        if (t > TC.blindT) {
          TC.blindT = t;
          SX.log(nv ? "섬광탄 — 투시경 화면이 하얗게 타 눈이 멀었습니다" : facing < 1 ? "섬광탄 — 등지고 있어 눈은 덜 멀었습니다" : "섬광탄에 눈이 멀었습니다", "bad");
        }
        SX.view.shake(4);
      }
    }
    if (runsEnemies()) for (const e of A.enemies) {
      if (!e.alive || e.floor !== F.idx) continue;
      const d = Math.hypot(e.x - n.x, e.y - n.y);
      if (d > R0 || !L.los(F, n.x, n.y - .2, e.x, e.y - .5)) continue;
      const away = d > 1 && Math.cos(SX.angDiff(e.face || 0, Math.atan2(n.y - e.y, n.x - e.x))) < 0 ? .6 : 1;
      const t = (e.type === "zombie" ? 2.4 : 5.5) * (1 - d / R0 * .5) * away * (e.boss || e.named ? .5 : 1);
      TC.stun(e, t);
    }
    if (n.from === A.player && SX.game.state === "raid" && SX.game.stats) {
      let k = 0;
      for (const e of A.enemies) {
        if (!e.alive || e.floor !== F.idx || e.spar) continue;
        if (Math.hypot(e.x - n.x, e.y - n.y) <= R0 && L.los(F, n.x, n.y - .2, e.x, e.y - .5)) k++;
      }
      SX.game.stats.flash = (SX.game.stats.flash | 0) + k;
    }
  }
  TC.stun = function(e, t) {
    if (!(t > (e.stunT || 0))) return;
    e.stunT = t;
    e.seesP = false;
    e.aimT = null;
    e.burst = 0;
    e.laser = false;
    A.texts.push({
      a: e,
      text: e.type === "scav" ? SX.rnd.pick([ "눈이…!", "안 보여!", "으악!" ]) : "…!",
      t: Math.min(t, 1.6),
      col: "#fff6a0"
    });
  };
  function cloudStart(F, n, kind) {
    SX.audio.play("gasPop", {
      x: n.x,
      y: n.y,
      f: F.idx,
      range: 34
    });
    const life = n.dur || (kind === "smoke" ? 18 : 14);
    TC.clouds.push({
      kind,
      floor: F.idx,
      x: n.x,
      y: n.y,
      r: .6,
      r0: .6,
      R: n.radius || (kind === "smoke" ? 4.2 : 3.6),
      t: life,
      life,
      puffT: 0,
      hissT: 0
    });
    A.noise(F, n.x, n.y, 10, false, 0, true);
  }
  TC.cloudAt = function(F, x, y, kind) {
    for (const c of TC.clouds) if (c.kind === kind && c.floor === F.idx && Math.hypot(x - c.x, y - c.y) < c.r && L.los(F, c.x, c.y - .2, x, y - .3)) return c;
    return null;
  };
  TC.gasAt = (F, x, y) => TC.cloudAt(F, x, y, "gas");
  const SMOKE_DEPTH = 1.1, SMOKE_K = .9;
  TC.SMOKE_DEPTH = SMOKE_DEPTH;
  TC.smokes = function(F) {
    let out = null;
    for (const c of TC.clouds) if (c.kind === "smoke" && c.floor === F.idx && c.r > .8) {
      const r = c.r * SMOKE_K;
      (out = out || []).push({
        x: c.x,
        y: c.y - .3,
        r2: r * r
      });
    }
    return out;
  };
  TC.smokeBlocks = function(F, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    if (len < .01) return false;
    let inside = 0;
    for (const c of TC.clouds) {
      if (c.kind !== "smoke" || c.floor !== F.idx || c.r <= .8) continue;
      const r = c.r * SMOKE_K, fx = ax - c.x, fy = ay - (c.y - .3);
      const b = (fx * dx + fy * dy) / len, q = fx * fx + fy * fy - r * r, disc = b * b - q;
      if (disc <= 0) continue;
      const sq = Math.sqrt(disc), t0 = Math.max(0, -b - sq), t1 = Math.min(len, -b + sq);
      if (t1 > t0) inside += t1 - t0;
    }
    return inside > SMOKE_DEPTH;
  };
  const THROW_T = .34, THROW_REL = .16;
  TC.THROW_Q = THROW_T * .55;
  TC.startThrow = function(p, release, quick) {
    if (quick) {
      p.throwT = TC.THROW_Q;
      p.throwJob = null;
      release();
      return;
    }
    p.throwT = THROW_T;
    p.throwJob = {
      t: THROW_REL,
      release
    };
  };
  const inPlay = () => SX.game.state === "raid" || A.canShootHere();
  const PRAC = {};
  const prac = name => PRAC[name] || (PRAC[name] = I.mk(name));
  TC.hold = null;
  TC.aim = null;
  const ORDER = [ "수류탄", "섬광탄", "최루탄", "연막탄", "화염병" ];
  const kitItems = p => {
    const out = [];
    for (const g of I.kitGrids(p.kit)) for (const e of g.list) out.push(e.it);
    return out;
  };
  TC.take = function(p, it) {
    if (!it || !p || !p.alive) return;
    if (TC.hold && TC.hold.name === it.name) {
      TC.put();
      return;
    }
    TC.hold = {
      id: it.id,
      name: it.name,
      brick: it.name === "벽돌"
    };
    TC.aim = null;
    p.reload = null;
    SX.audio.play("pickup", {
      vol: .5
    });
    if (!TC.said.hold) {
      TC.said.hold = true;
      SX.log(it.name + " 을 손에 쥐었습니다 — " + SX.label("fire") + "을 누르고 있으면 날아갈 길이 보이고, 놓으면 던집니다(누른 채 " + SX.label("aim") + " = 취소)");
    }
    SX.ui && SX.ui.hudDirty();
  };
  TC.put = function() {
    if (!TC.hold && !TC.aim) return;
    TC.hold = null;
    TC.aim = null;
    SX.ui && SX.ui.hudDirty();
  };
  TC.cycle = function(p) {
    const all = kitItems(p), free = A.canShootHere(), have = free ? ORDER.slice() : ORDER.filter(n => all.some(it => it.name === n && it.kind === "grenade"));
    if (!have.length) {
      SX.log("던질 것이 없습니다(수류탄 · 섬광탄 · 최루탄 · 연막탄 · 화염병)");
      SX.audio.play("denied");
      return;
    }
    const k = TC.hold && !TC.hold.brick ? have.indexOf(TC.hold.name) : -1;
    if (k >= 0 && k >= have.length - 1) {
      TC.put();
      return;
    }
    const name = have[k + 1];
    TC.hold = null;
    TC.take(p, all.find(it => it.name === name) || (free ? prac(name) : null));
  };
  TC.takeBrick = function(p) {
    const f = I.findInKit(p.kit, "벽돌");
    if (!f && !A.canShootHere()) {
      SX.log("벽돌이 없습니다");
      SX.audio.play("denied");
      return;
    }
    TC.take(p, f ? f.it : prac("벽돌"));
  };
  function heldItem(p) {
    const h = TC.hold;
    if (!h) return null;
    let it = I.kitFind(p.kit, h.id);
    if (!it || it.name !== h.name) {
      it = kitItems(p).find(q => q.name === h.name) || null;
      if (it) h.id = it.id;
    }
    if (!it && A.canShootHere()) it = prac(h.name);
    return it;
  }
  TC.heldItem = () => A.player ? heldItem(A.player) : null;
  TC.sim = function(F, p, it) {
    const V = SX.view, wx = V.mouseWorldX, wy = V.mouseWorldY, pts = [], DT = .025;
    if (it.name === "벽돌") {
      const b = A.brickInit(p, wx, wy);
      for (let k = 0; k < 160; k++) {
        pts.push([ b.x, b.y, b.z ]);
        if (A.brickStep(F, b, DT)) break;
      }
      pts.push([ b.x, b.y, 0 ]);
      return {
        pts,
        end: {
          x: b.x,
          y: b.y
        },
        r: 0,
        kind: "brick"
      };
    }
    const n = A.nadeInit(p, it, wx, wy);
    for (let t = n.fuse; t > 0; t -= DT) {
      pts.push([ n.x, n.y, n.z ]);
      if (!A.nadeStep(F, n, DT, true)) break;
      if (n.sub === "fire" && (n.z <= 0 || n.bonk)) break;
    }
    pts.push([ n.x, n.y, n.z ]);
    return {
      pts,
      end: {
        x: n.x,
        y: n.y
      },
      r: n.radius,
      kind: it.sub || "frag"
    };
  };
  function holdTick(F, p, ctl) {
    if (!TC.hold) {
      TC.aim = null;
      return;
    }
    const In = SX.input, it = heldItem(p);
    if (!it || !p.alive || !F) {
      TC.put();
      return;
    }
    if (A.swimNo && A.swimNo(p)) {
      TC.put();
      return;
    }
    if (ctl && (In.pressed("w1") || In.pressed("w2") || In.pressed("w3") || In.wheel || In.pressed("reload") || In.pressed("melee"))) {
      TC.put();
      return;
    }
    if (p.throwJob || p.use) {
      TC.aim = null;
      return;
    }
    const eat = !!(SX.ui && (SX.ui.wheel || SX.ui.wheelEat));
    if (TC.aim) {
      if (ctl && In.pressed("aim")) {
        TC.aim.cancel = true;
        SX.audio.play("click", {
          vol: .4
        });
      }
      if (!ctl || !In.held("fire")) {
        const go = ctl && !TC.aim.cancel;
        TC.aim = null;
        if (go) {
          if (TC.hold.brick) A.throwBrick(F, true); else A.throwGrenade(F, p, it, true);
          if (!heldItem(p)) TC.put();
        }
        SX.ui && SX.ui.hudDirty();
        return;
      }
      if (!TC.aim.cancel) Object.assign(TC.aim, TC.sim(F, p, it));
    } else if (ctl && !eat && In.pressed("fire")) {
      TC.aim = Object.assign({
        cancel: false
      }, TC.sim(F, p, it));
      if (!TC.hold.brick) SX.audio.play("pin", {
        vol: .7
      });
      SX.ui && SX.ui.hudDirty();
    }
  }
  function throwTick(p, dt) {
    if (p.throwT > 0) p.throwT = Math.max(0, p.throwT - dt);
    const j = p.throwJob;
    if (!j) return;
    j.t -= dt;
    if (!p.alive) {
      p.throwJob = null;
      p.throwT = 0;
      return;
    }
    if (j.t <= 0) {
      p.throwJob = null;
      j.release();
    }
  }
  TC.coverK = 0;
  TC.update = function(dt, level, ctl) {
    const p = A.player;
    if (!level || !p) return;
    const F = level.floors[p.floor];
    throwTick(p, dt);
    holdTick(F, p, ctl !== false);
    TC.cover = F ? TC.findCover(F, p) : null;
    if (TC.cover && !TC.said.cover) {
      TC.said.cover = true;
      SX.log("🛡 엄폐물에 붙어 앉았습니다 — 너머의 적에게 안 보이고 총알도 거의 막힙니다(일어서면 넘겨 쏩니다)");
    }
    TC.coverK = SX.approach(TC.coverK, TC.cover ? 1 : 0, dt * 6);
    for (const g of mates()) {
      const GF = level.floors[g.floor];
      g.cover = GF && g.alive ? TC.findCover(GF, g) : null;
      g.coverK = SX.approach(g.coverK || 0, g.cover ? 1 : 0, dt * 6);
      if (g.throwT > 0) g.throwT = Math.max(0, g.throwT - dt);
    }
    if (TC.blindT > 0) TC.blindT = Math.max(0, TC.blindT - dt);
    for (let i = TC.clouds.length - 1; i >= 0; i--) {
      const c = TC.clouds[i];
      c.t -= dt;
      if (c.t <= 0) {
        TC.clouds.splice(i, 1);
        continue;
      }
      c.r0 = Math.min(c.R, c.r0 + dt * 1.6);
      c.r = c.r0 * (c.t < 2.5 ? Math.max(.4, c.t / 2.5) : 1);
      const CF = level.floors[c.floor];
      if (!CF) continue;
      c.puffT -= dt;
      if (c.puffT <= 0 && c.floor === p.floor) {
        c.puffT = .07;
        for (let k = 0; k < 2; k++) {
          const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * c.r, x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
          if (r > .6 && !L.los(CF, c.x, c.y - .2, x, y - .2)) continue;
          A.part({
            floor: c.floor,
            x,
            y,
            z: .5 + Math.random() * .5,
            vx: (Math.random() - .5) * .5,
            vy: (Math.random() - .5) * .5,
            vz: .12 + Math.random() * .2,
            c: c.kind === "smoke" ? "rgba(190,192,196,0.32)" : "rgba(190,194,178,0.3)",
            s: 5 + Math.random() * 6,
            t: 1.5,
            life: 1.5,
            smoke: true
          });
        }
      }
      c.hissT -= dt;
      if (c.hissT <= 0 && c.t > 3) {
        c.hissT = 2.2;
        if (c.floor === p.floor) SX.audio.play("gasHiss", {
          x: c.x,
          y: c.y,
          range: 22,
          vol: .7
        });
      }
      if (c.kind === "gas" && runsEnemies()) for (const e of A.enemies) {
        if (!e.alive || e.floor !== c.floor || e.type !== "scav") continue;
        if (Math.hypot(e.x - c.x, e.y - c.y) > c.r || !L.los(CF, c.x, c.y - .2, e.x, e.y - .4)) continue;
        if (!(e.gasT > 0)) A.texts.push({
          a: e,
          text: SX.rnd.pick([ "콜록!", "최루탄이다!", "눈 따가워!" ]),
          t: 1.4,
          col: "#d8e0b8"
        });
        e.gasT = e.boss || e.named ? 1.5 : 3;
        e.gasX = c.x;
        e.gasY = c.y;
      }
    }
    TC.inSmoke = !!(F && p.alive && TC.cloudAt(F, p.x, p.y, "smoke"));
    if (F && p.alive && !SX.game.god && TC.gasAt(F, p.x, p.y)) {
      if (!(TC.tearT > 0)) SX.log("최루 연기 속입니다 — 조준이 흔들리고 기침 소리가 납니다", "bad");
      TC.tearT = 2.5;
    }
    if (TC.tearT > 0) {
      TC.tearT = Math.max(0, TC.tearT - dt);
      TC.coughT -= dt;
      p.stT = Math.max(p.stT || 0, .5);
      if (TC.coughT <= 0 && p.alive) {
        TC.coughT = 1.5 + Math.random() * .8;
        SX.audio.play("cough", {
          vol: .8
        });
        if (F) A.noise(F, p.x, p.y, 9, true);
      }
    }
  };
  TC.aimPenalty = () => (TC.tearT > 0 ? .13 : 0) + (TC.blindT > .3 ? .08 : 0) + (SX.wx ? SX.wx.aimPenalty() : 0);
  TC.dazed = function(F, e, dt) {
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.seesP = false;
      e.laser = false;
      e.aimT = null;
      e.wantT = null;
      e.waiting = false;
      e.sprinting = false;
      if (e.ai === "chase") {
        if (A.suspect) A.suspect(e, true); else e.ai = "search";
      }
      e.calmT = 0;
      e.cool = Math.max(e.cool || 0, .5);
      e.face += Math.sin(A.clock * 7 + e.x * 3) * dt * 2.4;
      if (Math.random() < dt * 2) A.move(F, e, (Math.random() - .5) * .12, (Math.random() - .5) * .12);
      return true;
    }
    if (e.gasT > 0) {
      e.gasT -= dt;
      e.seesP = false;
      e.laser = false;
      e.aimT = null;
      e.wantT = null;
      e.waiting = false;
      e.sprinting = false;
      e.cool = Math.max(e.cool || 0, .6);
      const dx = e.x - (e.gasX == null ? e.x : e.gasX), dy = e.y - (e.gasY == null ? e.y : e.gasY), d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d, sp = 2.4 * dt;
      if (A.move(F, e, ux * sp, uy * sp) || A.move(F, e, -uy * sp, ux * sp) || A.move(F, e, uy * sp, -ux * sp)) {
        e.walkT = (e.walkT || 0) + dt * 3;
        e.face = Math.atan2(uy, ux);
      }
      if (Math.random() < dt * .5) SX.audio.play("cough", {
        x: e.x,
        y: e.y,
        range: 16,
        vol: .6,
        r: .9
      });
      return true;
    }
    return false;
  };
  const faceHands = dir => dir === 1 ? {
    n: [ 5, -31 ],
    f: [ 6, -32 ]
  } : dir === 3 ? {
    n: [ -6, -31 ],
    f: [ -7, -32 ]
  } : {
    n: [ -3, -31 ],
    f: [ 3, -31 ]
  };
  const mouthHands = dir => dir === 1 ? {
    n: [ 5, -27 ],
    f: [ 3, -15 ]
  } : dir === 3 ? {
    n: [ -6, -27 ],
    f: [ -4, -15 ]
  } : {
    n: [ -1, -27 ],
    f: [ 5, -15 ]
  };
  const coughK = (now, seed) => {
    const t = (now * 1.9 + seed) % 1;
    return t < .18 ? Math.sin(t / .18 * Math.PI) : 0;
  };
  const TS1 = {
    cov: 0,
    blind: false,
    tear: false,
    hold: null,
    aim: false,
    smoke: false
  };
  const smokeUp = a => {
    const R = SX.raid, FH = SX.map.FH;
    if (!R || !R.fire || !R.on || a.crouch || a.floor == null || !R.smokeAt) return false;
    return (R.smokeBase(a.floor) + FH - R.smokeAt(R.t)) / (FH - .9) > .55;
  };
  function tacOf(a) {
    const s = TS1;
    if (a === A.player) {
      if (!inPlay()) return null;
      s.cov = TC.coverK;
      s.blind = TC.blindT > .5;
      s.tear = TC.tearT > 0;
      s.hold = TC.hold;
      s.aim = !!(TC.aim && !TC.aim.cancel);
      s.smoke = smokeUp(a);
      return s;
    }
    if (a.kind === "peer" && !a.isAlly && a.alive) {
      const q = a.tac, sm = smokeUp(a);
      if (!q && !(a.coverK > .05) && !sm) return null;
      s.cov = a.coverK || 0;
      s.blind = !!(q && q.fl & 1);
      s.tear = !!(q && q.fl & 2);
      s.hold = q ? q.hold : null;
      s.aim = !!(q && q.fl & 4);
      s.smoke = sm;
      return s;
    }
    return null;
  }
  TC.pose = function(a, now, dir) {
    let o = null;
    const P = () => o || (o = {
      lx: 0,
      sq: 0,
      duck: 0,
      hands: null,
      hide: false
    });
    const fx = dir === 1 ? 1 : dir === 3 ? -1 : 0, S = tacOf(a);
    if (S) {
      if (S.cov > .05) P().sq = Math.max(o.sq, Math.round(5 * S.cov));
      if (S.blind) {
        P().hands = faceHands(dir);
        o.hide = true;
        o.lx += Math.round(Math.sin(now * 8) * 1.6);
      } else if (S.tear) {
        const c = coughK(now, 0);
        P().sq = Math.max(o.sq, 2 + Math.round(c * 2));
        o.lx += fx * Math.round(2 + c);
        if (!a.reload && !a.use && !a.aimHeld && !(a.muzzleT > -.4)) {
          o.hands = mouthHands(dir);
          o.hide = true;
        }
      } else if (S.smoke && !S.aim && !S.hold && !a.reload && !a.use && !a.aimHeld && !(a.muzzleT > -.4)) {
        const c = coughK(now, .5);
        P().sq = Math.max(o.sq, 1 + Math.round(c * 2));
        o.lx += fx * Math.round(1 + c);
        o.hands = mouthHands(dir);
        o.hide = true;
      }
    } else if (a.kind === "enemy" && a.alive) {
      if (a.stunT > 0) {
        P().lx = Math.round(Math.sin(now * 8 + a.x * 5) * 3);
        o.sq = 1;
        o.hands = faceHands(dir);
        o.hide = true;
      } else if (a.gasT > 0) {
        const c = coughK(now, a.x * .37);
        P().sq = 3 + Math.round(c * 2);
        o.lx = fx * (3 + Math.round(c));
        o.hands = mouthHands(dir);
        o.hide = true;
      }
    }
    const placing = a === A.player ? !!(a.use && a.use.trap) : !!(a.kind === "peer" && !a.isAlly && a.placing);
    if (placing) {
      const w = Math.round(Math.sin(now * 7) * 1.5);
      P().sq = Math.max(o.sq, 7);
      o.hide = true;
      o.hands = dir === 1 ? {
        n: [ 9, -4 + w ],
        f: [ 6, -3 ]
      } : dir === 3 ? {
        n: [ -10, -4 + w ],
        f: [ -7, -3 ]
      } : dir === 2 ? {
        n: [ -5, -6 ],
        f: [ 5, -6 + w ]
      } : {
        n: [ -5, -3 + w ],
        f: [ 5, -3 ]
      };
    }
    if (a.takeT > 0 && (a === A.player || a.kind === "peer" && !a.isAlly)) {
      const TT = A.TAKE_T || .55, k = 1 - a.takeT / TT, ang = a === A.player && a.takeAng != null ? a.takeAng : a.aim || 0, ca = Math.cos(ang), sa = Math.sin(ang);
      const grab = [ ca * 9, -27 + sa * 3 ], rest = [ -ca * 3, -17 ], mid = [ ca, -20 ], stab = [ ca * 10, -24 + sa * 4 ];
      let f;
      if (k < .4) {
        const t = k / .4;
        f = [ rest[0] + (mid[0] - rest[0]) * t, rest[1] + (mid[1] - rest[1]) * t ];
      } else {
        const t = 1 - Math.pow(1 - (k - .4) / .6, 2);
        f = [ mid[0] + (stab[0] - mid[0]) * t, mid[1] + (stab[1] - mid[1]) * t ];
      }
      P().hands = {
        n: grab,
        f
      };
      o.hide = true;
      o.lx += Math.round(ca * 4);
      o.duck = (o.duck | 0) + 2;
      o.knife = {
        h: "f",
        ang
      };
    }
    if (S && S.hold && !(a.throwT > 0) && !placing && !(a.takeT > 0)) {
      const ang = a.aim || 0, ca = Math.cos(ang);
      if (S.aim) {
        P().hands = {
          n: [ -ca * 6, -32 ],
          f: null
        };
        o.hide = true;
        o.lx += Math.round(ca * -3);
        o.inHand = S.hold;
        o.aiming = true;
      } else if (!o || !o.hands) {
        P().hands = dir === 1 ? {
          n: [ 6, -20 ],
          f: null
        } : dir === 3 ? {
          n: [ -7, -20 ],
          f: null
        } : {
          n: [ -4, -19 ],
          f: null
        };
        o.hide = true;
        o.inHand = S.hold;
      }
    }
    if (a.throwT > 0) {
      const k = 1 - a.throwT / THROW_T, ang = a.kind === "enemy" ? a.face || 0 : a.aim || 0, ca = Math.cos(ang), sa = Math.sin(ang);
      const back = [ -ca * 6, -32 ], fwd = [ ca * 11, -24 + sa * 7 ], rest = [ fx * 2, -18 ];
      let h;
      if (k < .45) {
        const t = k / .45;
        h = [ rest[0] + (back[0] - rest[0]) * t, rest[1] + (back[1] - rest[1]) * t ];
      } else {
        const t = 1 - Math.pow(1 - (k - .45) / .55, 2);
        h = [ back[0] + (fwd[0] - back[0]) * t, back[1] + (fwd[1] - back[1]) * t ];
      }
      P().hands = {
        n: h,
        f: null
      };
      o.hide = true;
      o.lx += Math.round(ca * (k < .45 ? -3 : 4));
    }
    return o;
  };
  TC.overlay = function(ctx, vw, vh, now) {
    if (TC.tearT > 0) {
      const a = Math.min(1, TC.tearT / .8) * (.3 + Math.sin(now * 5) * .05);
      ctx.fillStyle = "rgba(206,214,188," + a.toFixed(3) + ")";
      ctx.fillRect(0, 0, vw, vh);
    }
    if (TC.blindT > 0) {
      const a = Math.min(1, TC.blindT / 1.3);
      ctx.fillStyle = (SX.opts && SX.opts.glare ? "rgba(12,14,18," : "rgba(255,255,255,") + a.toFixed(3) + ")";
      ctx.fillRect(0, 0, vw, vh);
    }
  };
  TC.drawInHand = function(ctx, hx, hy, h) {
    const x = Math.round(hx), y = Math.round(hy), d = h && I.def(h.name), sub = d && d.sub;
    if (h && h.brick) {
      ctx.fillStyle = "#3a2018";
      ctx.fillRect(x - 4, y - 5, 8, 6);
      ctx.fillStyle = "#8a5a44";
      ctx.fillRect(x - 3, y - 4, 6, 4);
      ctx.fillStyle = "#a8725a";
      ctx.fillRect(x - 3, y - 4, 6, 1);
      return;
    }
    if (sub === "fire") {
      const fr = (performance.now() / 83 | 0) % 3;
      ctx.fillStyle = "#1e4a2a";
      ctx.fillRect(x - 3, y - 8, 6, 8);
      ctx.fillRect(x - 2, y - 11, 4, 3);
      ctx.fillStyle = "#3aa05a";
      ctx.fillRect(x - 2, y - 7, 4, 6);
      ctx.fillRect(x - 1, y - 10, 2, 3);
      ctx.fillStyle = "#9aa848";
      ctx.fillRect(x - 2, y - 4, 4, 3);
      ctx.fillStyle = "#8ad0a0";
      ctx.fillRect(x - 2, y - 7, 1, 2);
      ctx.fillStyle = "#d8ccb0";
      ctx.fillRect(x - 1, y - 12, 2, 2);
      ctx.fillRect(x + 1, y - 11, 1, 3);
      ctx.fillStyle = "#e0461a";
      ctx.fillRect(x - 1, y - 14 + (fr === 1 ? 0 : 1), 2, 2 + (fr === 1 ? 1 : 0));
      ctx.fillStyle = fr === 2 ? "#ffd27a" : "#ff8a2a";
      ctx.fillRect(x - (fr === 0 ? 1 : 0), y - 15 + (fr === 1 ? 0 : 1), 1, 1);
      return;
    }
    ctx.fillStyle = "#15171a";
    ctx.fillRect(x - 3, y - 8, 6, 8);
    if (!sub) {
      ctx.fillStyle = "#5a6a3a";
      ctx.fillRect(x - 2, y - 7, 4, 6);
      ctx.fillStyle = "#7a8a52";
      ctx.fillRect(x - 2, y - 7, 2, 2);
      ctx.fillStyle = "#c8a830";
      ctx.fillRect(x - 2, y - 4, 4, 1);
      return;
    }
    const body = sub === "flash" ? "#9aa0a8" : sub === "smoke" ? "#6f7860" : "#5c6670", lite = sub === "flash" ? "#d4d9df" : sub === "smoke" ? "#98a288" : "#8a949e", band = sub === "flash" ? "#2a2d32" : sub === "smoke" ? "#e8e8de" : "#4f8fc8";
    ctx.fillStyle = body;
    ctx.fillRect(x - 2, y - 7, 4, 6);
    ctx.fillStyle = lite;
    ctx.fillRect(x - 2, y - 7, 1, 6);
    ctx.fillStyle = band;
    ctx.fillRect(x - 2, y - 5, 4, 1);
  };
  const AIM_COL = {
    fire: "255,150,70",
    frag: "255,128,96",
    flash: "255,246,190",
    gas: "204,226,150",
    smoke: "220,224,230",
    brick: "226,176,136"
  };
  TC.drawAim = function(ctx, cam, TS, now) {
    const a = TC.aim;
    if (!a || a.cancel || !a.pts || a.pts.length < 2) return;
    const col = AIM_COL[a.kind] || "255,255,255", n = a.pts.length, ph = Math.floor(now * 12) % 2, AZ = SX.render && SX.render.ARCZ || .5;
    for (let k = 0; k < n; k++) {
      const q = a.pts[k], sx = Math.round(q[0] * TS - cam.x), gy = Math.round(q[1] * TS - cam.y), sy = Math.round((q[1] - q[2] * AZ) * TS - cam.y);
      if (k % 2 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.fillRect(sx - 1, gy, 3, 2);
      }
      if ((k + ph) % 2 === 0) {
        ctx.fillStyle = "rgba(10,12,16,0.7)";
        ctx.fillRect(sx - 2, sy - 2, 5, 5);
        ctx.fillStyle = "rgba(" + col + "," + (1 - .3 * k / n).toFixed(2) + ")";
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
      }
    }
    const ex = a.end.x * TS - cam.x, ey = a.end.y * TS - cam.y;
    if (a.r > 0) {
      const R = a.r * TS, m = Math.max(24, Math.round(a.r * 9));
      for (let i = 0; i < m; i++) {
        const t = i / m * 6.2832 + now * .5, x = Math.round(ex + Math.cos(t) * R), y = Math.round(ey + Math.sin(t) * R);
        ctx.fillStyle = "rgba(10,12,16,0.5)";
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = "rgba(" + col + ",0.85)";
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    const x = Math.round(ex), y = Math.round(ey);
    ctx.fillStyle = "rgba(10,12,16,0.7)";
    ctx.fillRect(x - 7, y - 2, 14, 4);
    ctx.fillRect(x - 2, y - 7, 4, 14);
    ctx.fillStyle = "rgb(" + col + ")";
    ctx.fillRect(x - 6, y - 1, 12, 2);
    ctx.fillRect(x - 1, y - 6, 2, 12);
  };
  let cc = null, cx2 = null;
  TC.drawClouds = function(ctx, cam, F, TS, now, vw, vh) {
    const list = TC.clouds.filter(c => c.floor === F.idx);
    if (!list.length) return;
    const K = 4, w = Math.ceil(vw / K) + 2, h = Math.ceil(vh / K) + 2;
    if (!cc || cc.width !== w || cc.height !== h) {
      cc = SX.art.mk(w, h);
      cx2 = cc.getContext("2d");
    }
    cx2.clearRect(0, 0, w, h);
    for (const c of list) {
      const fade = Math.min(1, c.t / 2.5) * Math.min(1, (c.life - c.t) / .6 + .25);
      const sm = c.kind === "smoke", N = sm ? 30 : 18;
      for (let k = 0; k < N; k++) {
        const a = k * 2.399 + now * (.15 + k % 3 * .05) * (k % 2 ? 1 : -1), rr = c.r * (.12 + .8 * (k * .618 % 1)), x = c.x + Math.cos(a) * rr, y = c.y - .5 + Math.sin(a) * rr * .8;
        if (rr > .8 && !L.los(F, c.x, c.y - .2, x, y)) continue;
        const br = (.9 + k % 4 * .25) * Math.min(1, c.r / 1.5) * TS / K * (sm ? 1.15 : 1);
        cx2.fillStyle = "rgba(" + (sm ? k % 2 ? "214,216,220" : "186,190,196" : k % 2 ? "216,222,200" : "196,204,182") + "," + ((sm ? .36 : .2) * fade).toFixed(3) + ")";
        cx2.beginPath();
        cx2.arc((x * TS - cam.x) / K, (y * TS - cam.y) / K, br, 0, 6.2832);
        cx2.fill();
      }
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cc, 0, 0, w, h, 0, 0, w * K, h * K);
    ctx.restore();
  };
  TC.drawEyes = function(ctx, cam, TS, now) {
    if (!TC.eyes.length) return;
    const p = A.player, on = (now * 3 | 0) % 2;
    for (const e of TC.eyes) {
      const x0 = p.x * TS - cam.x, y0 = (p.y - .75) * TS - cam.y, x1 = e.x * TS - cam.x, y1 = (e.y - .35) * TS - cam.y;
      const x = Math.round(x1), y = Math.round(y1);
      ctx.fillStyle = "rgba(16,18,22,0.7)";
      ctx.fillRect(x - 3, y - 2, 7, 5);
      ctx.fillStyle = "rgba(255,246,200,0.9)";
      ctx.fillRect(x - 2, y - 1, 5, 3);
      ctx.fillStyle = "#101216";
      ctx.fillRect(x - 1 + (on ? 1 : 0), y - 1, 2, 3);
    }
  };
})(window.SX);
