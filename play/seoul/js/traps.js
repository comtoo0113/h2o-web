"use strict";

(function(SX) {
  const M = SX.map, T = M.T, A = SX.actors, I = SX.items;
  const Tr = SX.traps = {};
  const SEE = 3.2, WIRE_FUSE = 1.1, BEAR_DMG = 18, BEAR_HOLD = 2.5;
  const TRAP_FROM = {
    kind: "enemy",
    trap: true,
    alive: false,
    type: "trap"
  };
  const PLACE_T = 2;
  Tr.PLACE_T = PLACE_T;
  const ME = () => SX.coop && SX.coop.raid ? SX.coop.raid.me : null;
  let placeN = 0, said = false;
  const newId = () => "p" + (ME() == null ? "s" : ME()) + "_" + placeN++ + "_" + (Math.random() * 1e6 | 0);
  Tr.build = function(lv, seed, building) {
    const diff = building.diff || 2, R = SX.raid;
    const lob = [];
    for (let k = 0; k < (R.SPAWNS || 12); k++) {
      const q = R.spawnFor(k, lv);
      if (q) lob.push(q);
    }
    const nearLobby = (x, y, r) => lob.some(q => Math.hypot(q.x - x, q.y - y) < r);
    const nearStairs = (F, x, y, r) => F.stairs.some(s => x > s.x - r && x < s.x + s.w + r && y > s.y - r && y < s.y + s.h + r);
    const outdoor = !!building.outdoor;
    const free = (F, x, y) => (F.tile(x, y) === T.FLOOR || outdoor && F.tile(x, y) === T.GROUND && F.room[F.i(x, y)] >= 0) && !F.solid[F.i(x, y)] && !F.doorAt.get(F.i(x, y));
    const hidden = (F, x, y) => {
      const t = F.tile(x, y + 1);
      if (t === T.WALL || t === T.WINDOW) return true;
      const d = t === T.DOOR && F.doorAt.get(F.i(x, y + 1));
      return !!(d && d.horiz);
    };
    lv.floors.forEach((F, f) => {
      F.traps = [];
      if (F.kind === "roof") return;
      const rng = new SX.Rng(seed * 43 + f * 97 + 11);
      const n = Math.round((.5 + diff * .5) * (.6 + rng.f() * .8)) * (outdoor ? 3 : 1), nw = outdoor ? 0 : Math.round(n * .55);
      const doors = F.doors.filter(d => !d.exit && !d.parkExit && !d.locked && !nearStairs(F, d.cx, d.cy, 5) && !(f === 0 && nearLobby(d.cx, d.cy, 9)));
      for (let k = 0; k < nw && doors.length; k++) {
        const d = doors.splice(rng.i(doors.length), 1)[0];
        for (const side of d.horiz ? [ 1 ] : rng.chance(.5) ? [ 1, -1 ] : [ -1, 1 ]) {
          const cells = [];
          for (let j = 0; j < d.len; j++) {
            const x = d.horiz ? d.x + j : d.x + side, y = d.horiz ? d.y + side : d.y + j;
            if (!free(F, x, y) || hidden(F, x, y)) break;
            cells.push([ x, y ]);
          }
          if (cells.length !== d.len) continue;
          const x0 = cells[0][0], y0 = cells[0][1];
          F.traps.push({
            kind: "wire",
            st: 0,
            horiz: !!d.horiz,
            x: x0,
            y: y0,
            len: d.len,
            ax: d.horiz ? x0 + .15 : x0 + .5,
            ay: d.horiz ? y0 + .5 : y0 + .15
          });
          break;
        }
      }
      for (let k = 0, tries = 0; k < n - nw && tries < 300; tries++) {
        const x = lv.X0 + 2 + rng.i(lv.X1 - lv.X0 - 3), y = lv.Y0 + 2 + rng.i(lv.Y1 - lv.Y0 - 3);
        if (!free(F, x, y) || hidden(F, x, y) || !(outdoor || F.inside[F.i(x, y)]) || nearStairs(F, x + .5, y + .5, 3) || f === 0 && nearLobby(x + .5, y + .5, 8)) continue;
        if (F.traps.some(t => Math.hypot(t.x - x, t.y - y) < 4)) continue;
        F.traps.push({
          kind: "bear",
          st: 0,
          x,
          y
        });
        k++;
      }
    });
  };
  const rectOf = t => t.kind === "wire" ? t.horiz ? {
    x0: t.x,
    y0: t.y + .25,
    x1: t.x + t.len,
    y1: t.y + .75
  } : {
    x0: t.x + .25,
    y0: t.y,
    x1: t.x + .75,
    y1: t.y + t.len
  } : {
    x0: t.x + .2,
    y0: t.y + .2,
    x1: t.x + .8,
    y1: t.y + .8
  };
  const on = (t, x, y) => {
    const r = rectOf(t);
    return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  };
  const center = t => t.kind === "wire" ? t.horiz ? {
    x: t.x + t.len / 2,
    y: t.y + .5
  } : {
    x: t.x + .5,
    y: t.y + t.len / 2
  } : {
    x: t.x + .5,
    y: t.y + .5
  };
  Tr.center = center;
  Tr.on = on;
  const distTo = (t, x, y) => {
    const r = rectOf(t), qx = SX.clamp(x, r.x0, r.x1), qy = SX.clamp(y, r.y0, r.y1);
    return Math.hypot(x - qx, y - qy);
  };
  function ownerOf(t) {
    if (!t.id) return TRAP_FROM;
    if (t.own == null || t.own === ME()) return A.player;
    if (!t._from) {
      const c = center(t);
      t._from = {
        kind: "peer",
        pid: t.own,
        mate: false,
        trap: true,
        x: c.x,
        y: c.y,
        alive: true
      };
    }
    return t._from;
  }
  function spring(F, t, who, remote) {
    if (t.st) return;
    t.st = 1;
    t.seen = true;
    t.wait = false;
    if (!remote && SX.coop && SX.coop.trap) SX.coop.trap(F, t);
    const from = ownerOf(t);
    if (t.kind === "wire") {
      SX.audio.play("pin", {
        x: t.ax,
        y: t.ay,
        range: 12
      });
      A.nades.push({
        floor: F.idx,
        x: t.ax,
        y: t.ay,
        z: .4,
        vx: 0,
        vy: 0,
        vz: 0,
        fuse: WIRE_FUSE,
        from,
        dmg: 70,
        radius: 3,
        remote: !!remote
      });
      if (who === A.player) SX.log(t.id ? "⚠ 딸깍 — 놓아 둔 인계철선을 건드렸습니다! 수류탄이 곧 터집니다" : "⚠ 딸깍 — 인계철선! 수류탄이 곧 터집니다", "bad");
      return;
    }
    SX.audio.play("trapSnap", {
      x: t.x + .5,
      y: t.y + .5,
      range: 14,
      vol: .9
    });
    if (!who) return;
    if (who === A.player) {
      if (SX.game.god) return;
      const J0 = Object.assign({}, A.inj(who));
      who.hurtT = .5;
      SX.audio.play("hurt", {
        vol: .8
      });
      A.bleedAt(F, who.x, who.y);
      SX.view.shake(3);
      A.rawHurt(BEAR_DMG, "곰덫에 물렸습니다");
      const rec = SX.recap && SX.game.state === "raid" ? SX.recap.hit({
        d0: BEAR_DMG,
        d: BEAR_DMG,
        leg: true,
        J0,
        J1: A.inj(who),
        meta: {
          trap: "bear"
        },
        dead: who.hp <= 0
      }) : null;
      if (!who.alive || who.down) return;
      if (Math.random() < .5) A.injure(who, "frac"); else if (Math.random() < .6) A.injure(who, "bleedL");
      if (rec) SX.recap.injAfter(rec, J0, A.inj(who));
      who.trapT = BEAR_HOLD;
      who.trapAt = {
        x: who.x,
        y: who.y
      };
      SX.log(t.id ? "⚠ 놓아 둔 곰덫을 밟았습니다 — 잠깐 못 움직입니다" : "⚠ 곰덫에 물렸습니다 — 잠깐 못 움직입니다", "bad");
    } else if (who.kind === "enemy") {
      A.damageEnemy(F, who, 30, 0, from, false);
      who.trapT = 3;
      who.trapAt = {
        x: who.x,
        y: who.y
      };
    }
  }
  Tr.spring = spring;
  Tr.update = function(dt, lv) {
    const p = A.player;
    if (!lv || !p) return;
    const F = lv.floors[p.floor], G = SX.game;
    if (p.use && p.use.trap && Math.hypot(p.x - p.use.ax, p.y - p.use.ay) > .5) {
      p.use = null;
      SX.log("덫 놓기를 그만뒀습니다 — 움직였습니다");
      SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    }
    if (F && F.traps && p.alive) {
      for (const t of F.traps) {
        if (t.st) continue;
        if (t.wait) {
          if (distTo(t, p.x, p.y) > .3) t.wait = false;
          continue;
        }
        const d = distTo(t, p.x, p.y);
        if (!t.seen && d < SEE) {
          const c = center(t);
          if (SX.light.los(F, p.x, p.y - .2, c.x, c.y) && (G.env.dim >= 1 || p.torch || d < 1.6)) {
            t.seen = true;
            SX.log(t.kind === "wire" ? "⚠ 문턱에 가는 줄이 걸려 있습니다 — 인계철선([Ctrl] 조용히 걸으면 넘습니다 · [F] 풀기)" : "⚠ 바닥에 곰덫이 있습니다 — 밟지 마십시오([F] 치우기)", "warn");
          }
        }
        if (on(t, p.x, p.y)) {
          if (t.kind === "wire" && (p.quietWalk || p.crouch)) continue;
          spring(F, t, p, false);
        }
      }
    }
    if (p.trapT > 0) {
      p.trapT = Math.max(0, p.trapT - dt);
      if (p.trapAt) {
        p.x = p.trapAt.x;
        p.y = p.trapAt.y;
      }
      if (!p.trapT) p.trapAt = null;
    }
    if (!SX.coop || SX.coop.runEnemies()) {
      for (const e of A.enemies) {
        if (!e.alive) continue;
        if (e.trapT > 0) {
          e.trapT = Math.max(0, e.trapT - dt);
          if (e.trapAt) {
            e.x = e.trapAt.x;
            e.y = e.trapAt.y;
          }
          continue;
        }
        const EF = lv.floors[e.floor];
        if (!EF || !EF.traps) continue;
        for (const t of EF.traps) if (!t.st && (t.id || e.type === "zombie") && on(t, e.x, e.y)) {
          spring(EF, t, e, false);
          break;
        }
      }
    }
  };
  Tr.target = function(F, p, out) {
    if (!F || !F.traps) return null;
    let best = null, bd = 1.5;
    for (const t of F.traps) {
      if (t.st || !t.seen) continue;
      const d = distTo(t, p.x, p.y);
      if (d < 1.5) {
        const c = center(t), r = rectOf(t);
        const who = t.id && t.mine ? t.own == null || t.own === ME() ? "내 " : "우리 편 " : "";
        const o = {
          kind: "trap",
          trap: t,
          x: c.x,
          y: c.y - .6,
          label: who ? who + (t.kind === "wire" ? "인계철선 거두기" : "곰덫 거두기") : t.kind === "wire" ? "인계철선 풀기(키트 챙기기)" : "곰덫 치우기(챙기기)",
          d
        };
        if (out) out.push({
          t: o,
          b: [ [ r.x0 - .15, r.y0 - .2, r.x1 + .15, r.y1 + .15 ] ],
          flat: true
        });
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
    }
    return best;
  };
  Tr.disarm = function(F, t) {
    if (!t || t.st) return;
    const it = I.mk(t.kind === "wire" ? "인계철선 키트" : "곰덫"), k = SX.game.kit;
    const got = !!(it && I.kitStow(k, it));
    if (t.id && !got) {
      SX.log("가방에 자리가 없어 덫을 챙기지 못했습니다 — 자리를 비운 뒤 거두십시오");
      SX.audio.play("denied");
      return;
    }
    t.st = 2;
    if (SX.coop && SX.coop.trap) SX.coop.trap(F, t);
    if (!t.id && SX.game.stats) SX.game.stats.disarm = (SX.game.stats.disarm | 0) + 1;
    SX.audio.play("rustle");
    if (t.kind === "bear") SX.audio.play("trapChain", {
      vol: .7,
      delay: .15
    });
    if (got && SX.game.stats && SX.game.stats.picked) SX.game.stats.picked.push(it.name);
    if (t.id) SX.log((t.kind === "wire" ? "인계철선을 거뒀습니다 — " : "곰덫을 거뒀습니다 — ") + it.name + " 챙김", "good"); else if (t.kind === "wire") SX.log(got ? "✂ 인계철선을 풀었습니다 — 인계철선 키트 챙김" : "✂ 인계철선을 풀었습니다 — 가방에 자리가 없어 두고 왔습니다", got ? "good" : undefined); else SX.log(got ? "곰덫을 치웠습니다 — 곰덫 챙김" : "곰덫을 치웠습니다 — 가방에 자리가 없어 두고 왔습니다", got ? "good" : undefined);
    SX.ui && SX.ui.refresh && SX.ui.refresh();
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
  };
  Tr.apply = function(F, i, st, id) {
    const t = F && F.traps && (id ? F.traps.find(q => q.id === id) : F.traps[i]);
    if (!t || t.st >= st) return;
    if (st === 1) spring(F, t, null, true); else {
      t.st = 2;
    }
  };
  Tr.dump = lv => lv.floors.map(F => (F.traps || []).filter(t => !t.id).map(t => t.st).join(""));
  Tr.load = function(lv, rows) {
    (rows || []).forEach((row, f) => {
      const F = lv.floors[f];
      if (!F || !F.traps) return;
      const gen = F.traps.filter(t => !t.id);
      for (let i = 0; i < row.length && i < gen.length; i++) {
        const st = +row[i] || 0;
        if (st > gen[i].st) {
          gen[i].st = st;
          gen[i].seen = true;
        }
      }
    });
  };
  function cellOk(F, x, y, lv) {
    const t = F.tile(x, y), outdoor = !!(lv && lv.outdoor);
    if (!(t === T.FLOOR || outdoor && t === T.GROUND)) return false;
    if (F.solid[F.i(x, y)] || F.doorAt.get(F.i(x, y))) return false;
    const n = F.tile(x, y + 1);
    if (n === T.WALL || n === T.WINDOW) return false;
    {
      const d = n === T.DOOR && F.doorAt.get(F.i(x, y + 1));
      if (d && d.horiz) return false;
    }
    if (F.stairs.some(s => x >= s.x - 1 && x < s.x + s.w + 1 && y >= s.y - 1 && y < s.y + s.h + 1)) return false;
    if (F.traps.some(q => !q.st && (q.kind === "wire" ? q.horiz ? y === q.y && x >= q.x && x < q.x + q.len : x === q.x && y >= q.y && y < q.y + q.len : q.x === x && q.y === y))) return false;
    return true;
  }
  Tr.spotFor = function(F, p, kind) {
    const lv = SX.raid.level, x = Math.floor(p.x), y = Math.floor(p.y);
    if (!F || !F.traps || !lv || !cellOk(F, x, y, lv)) return null;
    if (kind === "bear") return {
      kind: "bear",
      x,
      y
    };
    const horiz = Math.abs(Math.sin(p.aim)) > Math.abs(Math.cos(p.aim));
    let x0 = x, y0 = y, len = 1;
    for (let k = 0; k < 2 && len < 3; k++) {
      const nx = horiz ? x0 - 1 : x0, ny = horiz ? y0 : y0 - 1;
      if (!cellOk(F, nx, ny, lv)) break;
      x0 = nx;
      y0 = ny;
      len++;
    }
    for (let k = 0; k < 2 && len < 3; k++) {
      const nx = horiz ? x0 + len : x0, ny = horiz ? y0 : y0 + len;
      if (!cellOk(F, nx, ny, lv)) break;
      len++;
    }
    return {
      kind: "wire",
      horiz,
      x: x0,
      y: y0,
      len,
      ax: horiz ? x0 + .15 : x0 + .5,
      ay: horiz ? y0 + .5 : y0 + .15
    };
  };
  function spotStillOk(F, s) {
    const lv = SX.raid.level;
    if (!lv) return false;
    if (s.kind === "bear") return cellOk(F, s.x, s.y, lv);
    for (let k = 0; k < s.len; k++) if (!cellOk(F, s.horiz ? s.x + k : s.x, s.horiz ? s.y : s.y + k, lv)) return false;
    return true;
  }
  Tr.startPlace = function(F, p, it) {
    if (!p || !p.alive || p.use || SX.game.state !== "raid" || !it) return false;
    if (!I.kitFind(p.kit, it.id)) {
      SX.log("가방 · 리그에 넣은 뒤 쓸 수 있습니다");
      return false;
    }
    const spot = Tr.spotFor(F, p, it.trap);
    if (!spot) {
      SX.log("여기엔 덫을 놓을 수 없습니다 — 바닥 빈칸에서(소품 · 문 · 계단 둘레 · 다른 함정 자리는 안 됩니다)");
      SX.audio.play("denied");
      return false;
    }
    p.use = {
      it,
      t: PLACE_T,
      dur: PLACE_T,
      label: it.trap === "wire" ? "인계철선 걸기" : "곰덫 놓기",
      trap: true,
      ax: p.x,
      ay: p.y
    };
    p.trapSpot = spot;
    p.reload = null;
    if (SX.tac && SX.tac.put) SX.tac.put();
    SX.audio.play("rustle");
    SX.audio.play("trapLay", {
      wire: it.trap === "wire",
      delay: .25
    });
    if (!said) {
      said = true;
      SX.log("덫을 놓는 중 — " + PLACE_T + "초 동안 앉아 있습니다(움직이거나 맞으면 그만둡니다)");
    }
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    return true;
  };
  Tr.finishPlace = function(F, p, it) {
    if (!it || !I.kitFind(p.kit, it.id)) return false;
    const keep = p.trapSpot;
    p.trapSpot = null;
    const spot = keep && keep.kind === it.trap && spotStillOk(F, keep) ? keep : Tr.spotFor(F, p, it.trap);
    if (!spot) {
      SX.log("여기엔 덫을 놓을 수 없습니다 — " + it.name + " 은(는) 그대로 남았습니다");
      SX.audio.play("denied");
      return false;
    }
    I.kitTake(p.kit, it);
    const t = Object.assign(spot, {
      st: 0,
      seen: true,
      mine: true,
      own: ME(),
      id: newId(),
      wait: true
    });
    F.traps.push(t);
    if (SX.coop && SX.coop.trapPlace) SX.coop.trapPlace(F, t);
    SX.audio.play("trapArm", {
      wire: t.kind === "wire",
      vol: .8
    });
    A.noise(F, p.x, p.y, 2, true);
    const K = "[" + SX.label("interact") + "]";
    SX.log(t.kind === "wire" ? "인계철선을 걸었습니다(" + t.len + "칸) — 나와 우리 편에게만 보입니다 · 조용히 걸으면 넘습니다 · " + K + " 거두기" : "곰덫을 놓았습니다 — 나와 우리 편에게만 보입니다 · 밟지 마십시오 · " + K + " 거두기", "good");
    SX.ui && SX.ui.refresh && SX.ui.refresh();
    SX.ui && SX.ui.hudDirty && SX.ui.hudDirty();
    return true;
  };
  Tr.pack = t => ({
    id: t.id,
    k: t.kind,
    x: t.x,
    y: t.y,
    h: t.horiz ? 1 : 0,
    l: t.len || 1,
    ax: t.ax,
    ay: t.ay,
    st: t.st | 0,
    o: t.own == null ? null : t.own
  });
  Tr.dumpPlaced = lv => lv.floors.map(F => (F.traps || []).filter(t => t.id).map(Tr.pack));
  Tr.addRemote = function(F, d, own, mate) {
    if (!F || !F.traps || !d || typeof d.id !== "string") return null;
    const kind = d.k === "wire" ? "wire" : d.k === "bear" ? "bear" : null;
    if (!kind) return null;
    const num = (v, dflt) => Number.isFinite(+v) ? +v : dflt;
    let t = F.traps.find(q => q.id === d.id);
    if (t) {
      if ((d.st | 0) > t.st) {
        t.st = Math.min(2, d.st | 0);
        t.seen = true;
      }
      return t;
    }
    const x = Math.round(num(d.x, -1)), y = Math.round(num(d.y, -1));
    if (x < 0 || y < 0 || x >= F.W || y >= F.H) return null;
    t = {
      kind,
      st: Math.max(0, Math.min(2, d.st | 0)),
      x,
      y,
      id: d.id.slice(0, 40),
      own: own == null ? null : own,
      mine: !!mate,
      seen: !!mate
    };
    if (kind === "wire") {
      t.horiz = !!d.h;
      t.len = Math.max(1, Math.min(3, d.l | 0));
      t.ax = num(d.ax, t.horiz ? x + .15 : x + .5);
      t.ay = num(d.ay, t.horiz ? y + .5 : y + .15);
    }
    const p = A.player;
    t.wait = !!(p && p.alive && p.floor === F.idx && distTo(t, p.x, p.y) <= .3);
    F.traps.push(t);
    return t;
  };
  Tr.loadPlaced = function(lv, rows) {
    const R = SX.coop && SX.coop.raid, me = R ? R.me : null;
    (rows || []).forEach((row, f) => {
      const F = lv.floors[f];
      if (!F || !F.traps || !Array.isArray(row)) return;
      for (const d of row) {
        const own = d && d.o == null ? null : d.o, mate = own == null || own === me || !!(R && R.teams.get(own) === R.team);
        Tr.addRemote(F, d, own, mate);
      }
    });
  };
  Tr.draw = function(ctx, F, cam, TS, now) {
    if (!F || !F.traps || !F.traps.length) return;
    const p = A.player, L = SX.light;
    for (const t of F.traps) {
      if (t.st === 2) continue;
      let a = 1;
      if (!t.seen) {
        const d = p ? distTo(t, p.x, p.y) : 99, c = center(t);
        if (d > 6 || !L.seen(F, c.x, c.y)) continue;
        a = .18 + .5 * Math.max(0, 1 - d / 6);
      }
      ctx.globalAlpha = a;
      if (t.kind === "wire") {
        const x0 = Math.round(t.x * TS - cam.x), y0 = Math.round(t.y * TS - cam.y);
        const ax = Math.round(t.ax * TS - cam.x), ay = Math.round(t.ay * TS - cam.y);
        if (t.st === 0) {
          ctx.fillStyle = t.seen ? t.mine ? "rgba(120,200,255,0.95)" : "rgba(255,110,90,0.95)" : "rgba(210,215,222,0.9)";
          if (t.horiz) {
            const y = y0 + (TS >> 1);
            ctx.fillRect(x0 + 3, y, t.len * TS - 6, 1);
            ctx.fillStyle = "rgba(255,255,255," + (.5 + .5 * Math.sin(now * 4 + t.x)) + ")";
            ctx.fillRect(x0 + 6 + now * 20 % Math.max(1, t.len * TS - 12), y, 2, 1);
          } else {
            const x = x0 + (TS >> 1);
            ctx.fillRect(x, y0 + 3, 1, t.len * TS - 6);
            ctx.fillStyle = "rgba(255,255,255," + (.5 + .5 * Math.sin(now * 4 + t.y)) + ")";
            ctx.fillRect(x, y0 + 6 + now * 20 % Math.max(1, t.len * TS - 12), 1, 2);
          }
          ctx.fillStyle = "#3a2e22";
          if (t.horiz) {
            ctx.fillRect(x0 + 2, y0 + (TS >> 1) - 2, 2, 4);
            ctx.fillRect(x0 + t.len * TS - 4, y0 + (TS >> 1) - 2, 2, 4);
          } else {
            ctx.fillRect(x0 + (TS >> 1) - 2, y0 + 2, 4, 2);
            ctx.fillRect(x0 + (TS >> 1) - 2, y0 + t.len * TS - 4, 4, 2);
          }
          ctx.fillStyle = "#1a1f14";
          ctx.fillRect(ax - 4, ay - 5, 8, 10);
          ctx.fillStyle = "#4e5a36";
          ctx.fillRect(ax - 3, ay - 4, 6, 8);
          ctx.fillStyle = "#6b7a4a";
          ctx.fillRect(ax - 3, ay - 4, 2, 7);
          ctx.fillStyle = "#9aa0a8";
          ctx.fillRect(ax - 1, ay - 7, 4, 2);
          ctx.fillRect(ax + 2, ay - 6, 1, 5);
        } else {
          ctx.fillStyle = "rgba(160,160,160,0.6)";
          if (t.horiz) ctx.fillRect(x0 + 3, y0 + (TS >> 1) + 2, 8, 1); else ctx.fillRect(x0 + (TS >> 1) + 2, y0 + 3, 1, 8);
        }
      } else {
        const x = Math.round(t.x * TS - cam.x), y = Math.round(t.y * TS - cam.y), cx = x + (TS >> 1), cy = y + (TS >> 1);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(cx - 11, cy - 5, 22, 12);
        ctx.fillStyle = "#3b3d40";
        ctx.fillRect(cx - 10, cy - 1, 20, 3);
        ctx.fillStyle = "#6e7278";
        ctx.fillRect(cx - 3, cy - 2, 6, 5);
        ctx.fillStyle = "#9aa0a8";
        ctx.fillRect(cx - 2, cy - 1, 2, 1);
        if (t.st === 0) {
          for (const s of [ -1, 1 ]) {
            ctx.fillStyle = "#55595e";
            ctx.fillRect(cx - 10, cy + s * 5 - (s < 0 ? 1 : 0), 20, 2);
            ctx.fillStyle = "#b8bcc2";
            for (let k = -9; k < 10; k += 3) ctx.fillRect(cx + k, cy + s * 3 - (s < 0 ? 0 : 1), 1, 2);
          }
          ctx.fillStyle = t.mine && t.seen ? "#6ab8ff" : "#7a2a24";
          ctx.fillRect(cx - 12, cy + 1, 2, 1);
          ctx.fillRect(cx + 10, cy + 1, 2, 1);
        } else {
          ctx.fillStyle = "#55595e";
          ctx.fillRect(cx - 9, cy - 3, 18, 3);
          ctx.fillStyle = "#b8bcc2";
          for (let k = -8; k < 9; k += 3) ctx.fillRect(cx + k, cy - 1, 1, 2);
          ctx.fillStyle = "rgba(120,20,20,0.7)";
          ctx.fillRect(cx - 4, cy + 3, 7, 2);
        }
      }
      ctx.globalAlpha = 1;
    }
  };
  Tr.pois = function(F) {
    const out = [];
    for (const t of F && F.traps || []) if (t.seen && t.st === 0) {
      const c = center(t);
      out.push({
        kind: "trap",
        x: c.x,
        y: c.y
      });
    }
    return out;
  };
})(window.SX);
