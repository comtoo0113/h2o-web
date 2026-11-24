"use strict";

(function(SX) {
  const T = SX.map.T, A = SX.actors, I = SX.items, M = SX.map;
  const EXIT_LOCK_T = 75, GAS_RISE = .055 * .5, FLARE_T = 5;
  const HOLD = {
    door: 3,
    zip: 5,
    escape: 6,
    heli: 5,
    bridge: 4,
    tunnel: 4,
    site: 4,
    park: 3
  };
  const Rd = SX.raid = {
    level: null,
    on: false
  };
  Rd.EVENTS = [ {
    id: "horde",
    name: "감염 확산",
    desc: "감염체가 평소보다 40% 많습니다",
    zm: 1.4
  }, {
    id: "raiders",
    name: "약탈자 떼",
    desc: "약탈자 무리가 들어와 있습니다 — 약탈자 35% 많음",
    sm: 1.35
  }, {
    id: "blackout",
    name: "정전",
    desc: "전기가 나갔습니다 — 건물 안이 훨씬 어둡습니다(손전등 필수)",
    dim: .5
  }, {
    id: "gas",
    name: "가스 누출",
    desc: "가스가 평소보다 35% 빨리 찹니다 — 서두르십시오",
    gas: 1.35
  }, {
    id: "quiet",
    name: "조용한 날",
    desc: "적이 25% 적습니다",
    zm: .75,
    sm: .75
  }, {
    id: "drop",
    name: "보급 낙하",
    desc: "옥상 집라인 근처에 군 보급 상자가 떨어졌습니다 — 두목 무리도 노립니다",
    drop: true
  }, {
    id: "stairlock",
    name: "계단 봉쇄",
    desc: "한 층의 올라가는 계단이 잠겼습니다 — 그 층에서 열쇠를 찾아보십시오",
    lock: true
  } ];
  const EV_SHORT = {
    raiders: "약탈자가 35% 많습니다",
    blackout: "건물 안이 훨씬 어둡습니다(손전등 필수)",
    gas: "가스가 평소보다 35% 빨리 찹니다",
    drop: "옥상에 군 보급 상자가 떨어졌습니다",
    stairlock: "올라가는 계단 하나가 잠겼습니다"
  };
  Rd.STAIR_KEY = "비상계단 열쇠";
  Rd.eventFor = function(seed) {
    const r = new SX.Rng((seed >>> 0 ^ 1540483477) >>> 0).f();
    if (r < .5) return null;
    return Rd.EVENTS[Math.min(Rd.EVENTS.length - 1, Math.floor((r - .5) / .5 * Rd.EVENTS.length))];
  };
  Rd.todayText = function() {
    const b = Rd.level && Rd.level.building;
    if (!b) return null;
    const wk = SX.wx && SX.wx.KINDS[Rd.wx || "clear"], EV = Rd.event, it = Rd.intel && Rd.intel.building === b.id ? Rd.intel : null;
    return {
      title: "오늘 상황 — " + b.name + " · " + (Rd.tod === "night" ? "밤" : "낮"),
      sub: "날씨: " + (wk && wk.name || "맑음") + " · 상황: " + (EV ? EV.name : "평소") + (it ? " · 정보: " + (it.hotFloor + 1) + "층이 알짜" : "") + (Rd.fire ? " · 🔥 화재 — 옥상에서 아래로 · 지하 주차장 출구" : "") + (Rd.flood ? " · 🌊 침수 — 물이 아래부터 차오릅니다 · 위로" : "") + (Rd.noS ? " · 🔫 약탈자 없는 판" : "") + (Rd.noZ ? " · 🧟 좀비 없는 판" : "") + (SX.ev && SX.ev.todayLine ? SX.ev.todayLine() : "") + (SX.bdev && SX.bdev.todayLine ? SX.bdev.todayLine() : "") + (SX.week && SX.week.todayLine ? SX.week.todayLine() : "")
    };
  };
  Rd.todayLines = function() {
    const b = Rd.level && Rd.level.building;
    if (!b) return [];
    const it = Rd.intel && Rd.intel.building === b.id ? Rd.intel : null, out = [];
    if (it) out.push("정보: " + (it.hotFloor + 1) + "층이 알짜");
    for (const m of [ SX.ev, SX.bdev, SX.week ]) if (m && m.todayLine) {
      const t = m.todayLine().replace(/^\s*·\s*/, "");
      if (t) out.push(t);
    }
    return out;
  };
  Rd.todayNote = function() {
    if (Rd.tutMode || !SX.ui.bigNote) return;
    const seed = Rd.seed, OB = SX.onboard;
    if (OB && OB.cur && OB.cur.seed === seed) return;
    const wait = 700;
    setTimeout(() => {
      if (SX.game.state === "raid" && Rd.seed === seed && !Rd.tutMode) for (const l of Rd.todayLines()) SX.log(l);
    }, wait);
  };
  const FIRE_DOOR = "밖은 불길과 무너진 간판에 막혔습니다 — 지하 주차장으로", FIRE_ZIP = "줄이 열기에 끊겼습니다", SMOKE_V = .0175;
  Rd.mode = "normal";
  Rd.fire = false;
  Rd.smokeHere = 0;
  Rd.fireNear = 0;
  Rd.floorBase = (f, lv) => {
    lv = lv || Rd.level;
    return lv && lv.parkIdx === f ? -M.FH : f * M.FH;
  };
  Rd.fname = (f, lv) => {
    lv = lv || Rd.level;
    const b = lv && lv.building;
    return lv && lv.parkIdx === f ? "지하 1층" : b && f >= b.floors ? "옥상" : f + 1 + "층";
  };
  Rd.smokeBase = (f, lv) => {
    lv = lv || Rd.level;
    return lv && f === lv.roofIdx ? (lv.roofIdx - 1) * M.FH : Rd.floorBase(f, lv);
  };
  Rd.smokeAt = t => {
    const lv = Rd.level;
    return lv ? lv.roofIdx * M.FH - SMOKE_V * t : 0;
  };
  Rd.smokeEta = f => {
    const lv = Rd.level;
    if (!Rd.fire || !lv) return null;
    return Math.max(0, (Rd.smokeAt(Rd.t) - (Rd.smokeBase(f, lv) + 1.6)) / SMOKE_V);
  };
  function parkEnemies(lv, seed, diff, G) {
    const PF = lv.floors[lv.parkIdx];
    if (!PF) return;
    const avoid = [];
    for (const s of PF.stairs) avoid.push([ s.x + s.w / 2, s.y + s.h / 2 ]);
    for (const z of PF.zones) avoid.push([ z.x + z.w / 2, z.y + z.h / 2 ]);
    A.spawnPacks(PF, new SX.Rng((seed >>> 0) * 13 + 7919 >>> 0), Math.round((6 + diff * 3) * (SX.week ? SX.week.zm() : 1)), 0, G.lootCtx(0), avoid);
    const sr = new SX.Rng((seed >>> 0) * 19 + 7927 >>> 0), ng = diff >= 3 ? 2 : 1;
    for (let g = 0; g < ng; g++) {
      for (let t = 0; t < 300; t++) {
        const x = lv.X0 + 3 + sr.f() * (lv.X1 - lv.X0 - 6), y = lv.Y0 + 3 + sr.f() * (lv.Y1 - lv.Y0 - 6);
        if (avoid.some(([ax, ay]) => Math.hypot(x - ax, y - ay) < 18) || !A.free(PF, x, y, .35)) continue;
        const n = 2 + sr.i(2);
        for (let k = 0; k < n; k++) {
          const ox = x + (k - (n - 1) / 2) * 1.1;
          if (A.free(PF, ox, y, .35)) A.spawnEnemy(PF, "scav", ox, y, sr, G.lootCtx(1));
        }
        avoid.push([ x, y ]);
        break;
      }
    }
  }
  const FLOOD_DOOR = "문 밖 물이 무릎까지 차 문이 안 열립니다", FLOOD_WET = "물에 잠겼습니다", FLOOD_LOCK_Y = .4, BREATH_MAX = 20;
  Rd.flood = false;
  Rd.waterY = -99;
  Rd.wLv = 0;
  Rd.breath = BREATH_MAX;
  Rd.BREATH_MAX = BREATH_MAX;
  Rd.floodLocked = false;
  Rd.WMUL = [ 1, .9, .62, .45, .4, .4 ];
  Rd.WNAME = [ "마른 바닥", "발목", "무릎", "허리", "헤엄", "잠수" ];
  Rd.waterAt = function(t) {
    const lv = Rd.level;
    if (!lv || !Rd.flood) return -99;
    const r1 = Rd.gasRate(lv, 0), r2 = Rd.gasRate(lv, M.FH), t1 = (M.FH + 6) / r1;
    const y = t < t1 ? -6 + r1 * t : M.FH + r2 * (t - t1);
    return Math.min(y, lv.roofIdx * M.FH - .06);
  };
  Rd.wLvAt = d => d < .05 ? 0 : d < .3 ? 1 : d < .6 ? 2 : d < 1.3 ? 3 : d < M.FH - .4 ? 4 : 5;
  Rd.wDepth = f => {
    const lv = Rd.level;
    if (!Rd.flood || !lv || f == null || f >= lv.roofIdx) return 0;
    return Rd.waterY - Rd.floorBase(f, lv);
  };
  Rd.wLvOf = f => Rd.flood ? Rd.wLvAt(Rd.wDepth(f)) : 0;
  Rd.wMul = f => Rd.flood ? Rd.WMUL[Rd.wLvOf(f)] : 1;
  Rd.waterEta = function(f) {
    const lv = Rd.level;
    if (!lv || !Rd.flood || f >= lv.roofIdx) return null;
    const target = Rd.floorBase(f, lv) + .6;
    if (Rd.waterY >= target) return 0;
    const r1 = Rd.gasRate(lv, 0), r2 = Rd.gasRate(lv, M.FH);
    let y = Rd.waterY, t = 0;
    if (y < M.FH) {
      const a = Math.min(target, M.FH);
      t += (a - y) / r1;
      y = a;
    }
    if (y < target) t += (target - y) / r2;
    return t;
  };
  Rd.floodDoorEta = () => Rd.flood && !Rd.floodLocked && Rd.level ? Math.max(0, (FLOOD_LOCK_Y - Rd.waterY) / Rd.gasRate(Rd.level, 0)) : null;
  Rd.floodAmb = function(F, p) {
    if (!Rd.flood || !Rd.level || !p) return 0;
    if (F.kind === "roof") return .12;
    const d = Rd.wDepth(p.floor);
    if (d >= M.FH - .4) return .35;
    if (d > .05) return .55 + .45 * Math.min(1, d / 1.3);
    return .45 * Math.max(.15, 1 - -d / 8);
  };
  function floodLock(lv, quiet) {
    Rd.floodLocked = true;
    Rd.locked = true;
    const F0 = lv.floors[0], pp = A.player;
    if (!quiet && pp && pp.alive && !pp.down && !Rd.over && (inDoorZone(pp) || outsideNow(pp))) {
      SX.log("⛓ 물이 문을 막기 직전 — 이미 나와 있었습니다", "good");
      Rd.end(true, "door");
      return;
    }
    for (const d of F0.doors) if (d.exit) {
      d.open = false;
      d.locked = true;
      d.floodShut = true;
    }
    for (const z of F0.zones) if (z.kind === "door") {
      z.locked = true;
      z.why = FLOOD_DOOR;
    }
    if (!quiet) {
      SX.log("⛓ " + FLOOD_DOOR + " — 이제 나가는 길은 위층 · 옥상뿐입니다", "bad");
      if (SX.ui.bigNote) SX.ui.bigNote("⛓ 1층 문이 물에 막혔습니다", "이제 나가는 길은 위층 · 옥상뿐입니다", SX.ui.NOTE_MS);
      SX.audio.play("waterSlosh", {
        vol: .9
      });
    }
    if (pp && pp.floor === 0 && !A.free(F0, pp.x, pp.y)) {
      pp.x = SX.clamp(pp.x, lv.X0 + 1.5, lv.X1 - .5);
      pp.y = SX.clamp(pp.y, lv.Y0 + 1.5, lv.Y1 - .8);
    }
  }
  function floodTick(dt, lv, F, p, G) {
    Rd.waterY = Rd.waterAt(Rd.t);
    const wl = Rd.wLvOf(p.floor), was = Rd.wLv;
    Rd.wLv = wl;
    if (wl !== was) {
      SX.ui.hudDirty();
      if (p.alive && wl > was && wl >= 2) SX.audio.play("waterSlosh", {
        vol: .45 + wl * .08
      });
    }
    let hi = -1;
    for (let f = 0; f < lv.roofIdx; f++) if (Rd.waterY > Rd.floorBase(f, lv) + .05) hi = f;
    if (hi > Rd.waterWarned) {
      Rd.waterWarned = hi;
      SX.log("⚠ 물이 " + Rd.fname(hi, lv) + "까지 차올랐습니다", "warn");
      SX.audio.play("waterSlosh", {
        vol: .8
      });
    }
    if (!Rd.floodLocked && Rd.waterY >= FLOOD_LOCK_Y) {
      floodLock(lv, Rd.floodQuiet);
      if (Rd.over) return;
    }
    Rd.floodQuiet = false;
    for (let f = 0; f < lv.roofIdx; f++) {
      if (Rd.wLvOf(f) < 4) continue;
      for (const z of lv.floors[f].zones) if (z.kind === "escape" && !z.locked) {
        z.locked = true;
        z.why = FLOOD_WET;
        z.wet = true;
      }
    }
    if (p.alive && wl >= 5) {
      Rd.breath = Math.max(0, Rd.breath - dt);
      if (Rd.breath <= 0 && !G.god) {
        if (SX.recap) SX.recap.tick("drown", 8 * dt);
        A.rawHurt(8 * dt, "물에 잠겨 숨이 막혔습니다");
        p.hurtT = Math.max(p.hurtT, .15);
      }
      SX.ui.hudDirty();
    } else if (Rd.breath < BREATH_MAX) {
      Rd.breath = Math.min(BREATH_MAX, Rd.breath + dt * BREATH_MAX / 3);
      SX.ui.hudDirty();
    }
    if (SX.audio.underwater) SX.audio.underwater(p.alive && wl >= 5);
    const zw = F.zones.find(z => z.locked && z.why && p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) || null;
    if (zw && zw !== Rd.zoneWhy) SX.log("⛔ " + zw.why, "warn");
    Rd.zoneWhy = zw;
    if (!SX.coop || SX.coop.runEnemies()) {
      Rd.wDmgT = (Rd.wDmgT || 0) - dt;
      if (Rd.wDmgT <= 0) {
        Rd.wDmgT = .5;
        for (const e of A.enemies) {
          if (!e.alive) continue;
          const EF = lv.floors[e.floor];
          if (!EF) continue;
          if (Rd.wLvOf(e.floor) < 5) {
            e.wetT = 0;
            continue;
          }
          e.wetT = (e.wetT || 0) + .5;
          if (e.wetT > BREATH_MAX) A.damageEnemy(EF, e, 4, 0, {
            kind: "enemy",
            alive: false,
            type: "water"
          });
        }
      }
    }
  }
  function fireTick(dt, lv, F, p, G) {
    const FH = M.FH;
    Rd.smokeY = Rd.smokeAt(Rd.t);
    const sb = Rd.smokeBase(p.floor, lv);
    Rd.smokeHere = SX.clamp((sb + FH - Rd.smokeY) / (FH - .9), 0, 1);
    const low = Math.max(-1, Math.floor((Rd.smokeY - 1.6) / FH) + 1);
    if (low < Rd.smokeWarned) {
      Rd.smokeWarned = low;
      SX.log("⚠ 연기가 " + (low < 0 ? "지하 1층" : low + 1 + "층") + "까지 내려왔습니다", "warn");
      SX.audio.play("gas");
    }
    const gd = lv.building.gasDmg != null ? lv.building.gasDmg : 1;
    Rd.inSmoke = !!(p.alive && Rd.smokeY < sb + (p.crouch ? .9 : 1.6));
    if (Rd.inSmoke && !G.god) {
      if (SX.recap) SX.recap.tick("smoke", 5.2 * gd * dt);
      A.rawHurt(5.2 * gd * dt, "연기에 질식했습니다");
      p.hurtT = Math.max(p.hurtT, .15);
      SX.ui.hudDirty();
    }
    if (Rd.inSmoke && p.alive) {
      Rd.coughT = (Rd.coughT || 0) - dt;
      if (Rd.coughT <= 0) {
        Rd.coughT = 2.2 + Math.random() * 1.3;
        SX.audio.play("cough", {
          vol: .7
        });
      }
    }
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (p.alive && F.fireAt && F.in(tx, ty) && F.fireAt[F.i(tx, ty)] && !G.god) {
      if (SX.recap) SX.recap.tick("fire", 12 * dt);
      A.rawHurt(12 * dt, "불길에 휩싸였습니다");
      p.hurtT = Math.max(p.hurtT, .25);
      SX.ui.hudDirty();
    }
    if (F.fireAt) {
      Rd.fireScanT = (Rd.fireScanT || 0) - dt;
      if (Rd.fireScanT <= 0) {
        Rd.fireScanT = .25;
        let best = 99;
        for (let y = ty - 8; y <= ty + 8; y++) for (let x = tx - 8; x <= tx + 8; x++) if (F.in(x, y) && F.fireAt[F.i(x, y)]) {
          const d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
          if (d < best) best = d;
        }
        Rd.fireNear = best < 99 ? SX.clamp(1 - best / 9, 0, 1) : 0;
      }
      const bl = F.blazes || (F.blazes = F.props.filter(q => q.kind === "blaze"));
      if (bl.length && Math.random() < dt * 5) {
        const q = bl[Math.random() * bl.length | 0];
        if (Math.abs(q.x - p.x) < 24 && Math.abs(q.y - p.y) < 16) A.smoke(F, q.x + .5, q.y + .3, 1, true);
      }
    } else Rd.fireNear = 0;
    const zw = F.zones.find(z => z.locked && z.why && p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) || null;
    if (zw && zw !== Rd.zoneWhy) SX.log("⛔ " + zw.why, "warn");
    Rd.zoneWhy = zw;
    if (!SX.coop || SX.coop.runEnemies()) {
      Rd.fireDmgT = (Rd.fireDmgT || 0) - dt;
      if (Rd.fireDmgT <= 0) {
        Rd.fireDmgT = .5;
        for (const e of A.enemies) {
          if (!e.alive) continue;
          const EF = lv.floors[e.floor];
          if (!EF || !EF.fireAt) continue;
          const ex = Math.floor(e.x), ey = Math.floor(e.y);
          if (EF.in(ex, ey) && EF.fireAt[EF.i(ex, ey)]) A.damageEnemy(EF, e, 6, 0, {
            kind: "enemy",
            alive: false,
            type: "fire"
          });
        }
      }
    }
  }
  Rd.start = function(building, tod, rngSeed, mode, wkIn) {
    const G = SX.game;
    const seed = rngSeed != null ? rngSeed >>> 0 : Math.random() * 4294967296 >>> 0;
    Rd.seed = seed;
    Rd.tod = tod;
    Rd.intel = G.save.intel || null;
    Rd.mode = (mode === "nos" || mode === "noz") && !building.train && !building.final && !Rd.tutMode && !!(SX.prog && SX.prog.SP_B && SX.prog.SP_B.indexOf(building.id) >= 0) ? mode : (mode === "fire" || mode === "flood" && (building.floors | 0) >= 2 && !(SX.soloMap && SX.soloMap(building))) && !building.train && !building.final && !building.outdoor && !Rd.tutMode && !!(SX.prog && SX.prog.MODE_B && SX.prog.MODE_B[building.id]) ? mode : "normal";
    Rd.fire = Rd.mode === "fire";
    Rd.flood = Rd.mode === "flood";
    Rd.noS = Rd.mode === "nos";
    Rd.noZ = Rd.mode === "noz";
    Rd.smokeHere = 0;
    Rd.fireNear = 0;
    Rd.inSmoke = false;
    Rd.zoneWhy = null;
    Rd.smokeY = null;
    Rd.waterY = -99;
    Rd.wLv = 0;
    Rd.breath = BREATH_MAX;
    Rd.floodLocked = false;
    Rd.floodQuiet = false;
    Rd.waterWarned = -1;
    Rd.wDmgT = 0;
    if (SX.audio.underwater) SX.audio.underwater(false);
    if (SX.vault) SX.vault.cancelUnlock();
    if (SX.recap) SX.recap.reset();
    if (SX.access) SX.access.clear();
    const EV = Rd.event = building.train ? null : function() {
      const e = Rd.eventFor(seed);
      return e && ((e.lock || e.dim || e.drop) && building.outdoor || (e.lock || e.drop) && building.final || Rd.fire && (e.lock || e.drop || e.gas) || Rd.flood && (e.lock || e.gas) || Rd.noS && e.sm > 1 || Rd.noZ && e.zm > 1) ? null : e;
    }();
    Rd.snapN = 0;
    const uidKeep = I.uidGet();
    I.uidSet(1e12 + seed % 1e6 * 1e5);
    if (SX.week) SX.week.begin(building, wkIn);
    const lv = M.buildRaid({
      building,
      seed,
      intel: G.save.intel,
      fire: Rd.fire
    });
    I.wkBoost = 0;
    Rd.level = lv;
    Rd.on = true;
    Rd.t = 0;
    Rd.gasY = -6;
    Rd.lockLeft = building.train ? 1e9 : EXIT_LOCK_T;
    Rd.locked = false;
    Rd.flareT = 0;
    Rd.ext = null;
    Rd.over = false;
    Rd.gasWarned = 0;
    Rd.deadT = 0;
    if (Rd.fire) {
      Rd.gasY = -99;
      Rd.lockLeft = 1e9;
      Rd.locked = true;
    }
    if (Rd.flood) {
      Rd.gasY = -99;
      Rd.lockLeft = 1e9;
      Rd.waterY = Rd.waterAt(0);
    }
    Rd.smokeWarned = lv.roofIdx;
    Rd.coughT = 0;
    Rd.fireDmgT = 0;
    Rd.fireScanT = 0;
    Rd.pings = [];
    Rd.ctrlDone = false;
    Rd.storyGone = Object.create(null);
    Rd.mateFlare = null;
    Rd.mateFlareGo = false;
    Rd.startValue = I.kitValue(G.kit);
    G.rng = new SX.Rng(seed ^ 2654435769);
    const F0 = lv.floors[0];
    for (const d of F0.doors) if (d.exit) {
      let z;
      if (d.side === "s") z = {
        x: d.x - 1,
        y: d.y + 1,
        w: d.len + 2,
        h: 3
      }; else if (d.side === "n") z = {
        x: d.x - 1,
        y: d.y - 3,
        w: d.len + 2,
        h: 3
      }; else if (d.side === "w") z = {
        x: d.x - 3,
        y: d.y - 1,
        w: 3,
        h: d.len + 2
      }; else z = {
        x: d.x + 1,
        y: d.y - 1,
        w: 3,
        h: d.len + 2
      };
      F0.zones.push(Object.assign(z, {
        kind: "door",
        door: d,
        label: "출구"
      }));
    }
    if (Rd.fire) {
      for (const z of F0.zones) if (z.kind === "door") {
        z.locked = true;
        z.why = FIRE_DOOR;
      }
      for (const z of lv.floors[lv.roofIdx].zones) if (z.kind === "zip") {
        z.locked = true;
        z.why = FIRE_ZIP;
      }
    }
    G.env = {
      dim: EV && EV.dim || 1,
      night: tod === "night",
      rain: 0,
      flashT: 0,
      thunderT: 8,
      hub: false
    };
    Rd.wx = SX.wx.setup(G.env, seed, building).kind;
    if (Rd.flood && !SX.wx.force) {
      const wr = new SX.Rng((seed >>> 0) * 31 + 7919 >>> 0), st = wr.f() < .5, amt = wr.f();
      G.env.wx = st ? "storm" : "rain";
      G.env.rain = st ? 1 : .6 + amt * .4;
      G.env.fog = 0;
      G.env.storm = st ? 1 : 0;
      if (st) G.env.thunderT = 3 + wr.f() * 6;
      Rd.wx = G.env.wx;
    }
    if (SX.nvg) {
      SX.nvg.recharge(G.kit);
      SX.nvg.reset();
    }
    A.enemies = [];
    A.bullets = [];
    A.nades = [];
    A.parts = [];
    A.texts = [];
    if (SX.tac) SX.tac.reset();
    if (A.resetSlots) A.resetSlots();
    const south = lv.exits.find(e => e.side === "s");
    const sp0 = Rd.fire && lv.roofSpawns ? Rd.spawnFor(0, lv) : null;
    const sx = sp0 ? sp0.x : south.x + .5, sy = sp0 ? sp0.y : lv.Y1 - 3.5, sf = sp0 ? lv.roofIdx : 0;
    if (SX.minimap) SX.minimap.prepare(lv);
    A.newPlayer(G.kit, sx, sy, sf);
    A.allies = [];
    const diff = building.diff || 2;
    const em = building.enemy * (tod === "night" ? 1.1 : 1);
    const total = Math.min(200, Math.round(70 * em * (1 + .3 * (diff - 1))));
    const zShare = building.zShare != null ? building.zShare : [ .65, .6, .5, .45 ][Math.min(4, diff) - 1];
    const wt = [];
    let ws = 0;
    for (let i = 0; i < building.floors; i++) {
      const w = i === 0 ? .45 : 1 + (diff >= 3 ? .12 * i : 0);
      wt.push(w);
      ws += w;
    }
    const lobbies = Array.from({
      length: Rd.SPAWNS
    }, (_, k) => Rd.spawnFor(k, lv)).filter(Boolean).map(q => [ q.x, q.y ]);
    let packShort = 0;
    for (let f = 0; f < building.floors; f++) {
      const share = Math.round(total * wt[f] / ws), mons0 = Math.round(share * zShare);
      const zN = Rd.noS ? share : Rd.noZ ? 0 : mons0, sN = Rd.noZ ? share : Rd.noS ? 0 : share - mons0;
      const mons = Math.round(zN * (EV && EV.zm || 1) * (SX.week ? SX.week.zm() : 1)), scavs = Math.round(sN * (EV && EV.sm || 1));
      const nb = A.enemies.length;
      A.spawnPacks(lv.floors[f], new SX.Rng(seed * 13 + f * 101), mons, scavs, G.lootCtx(f), f === 0 ? lobbies : null);
      if (Rd.noS || Rd.noZ) packShort += Math.max(0, mons + scavs - (A.enemies.length - nb));
      A.spawnVariants(lv.floors[f], new SX.Rng(seed * 17 + f * 211), G.lootCtx(f), diff, f === 0 ? lobbies : null);
    }
    if (lv.parkIdx != null) parkEnemies(lv, seed, diff, G);
    Rd.dropAt = null;
    if (EV && EV.drop) {
      const RF = lv.floors[lv.roofIdx], zp = RF.zip, rng = new SX.Rng(seed * 31 + 7), sz = SX.art.propSize("airdrop");
      for (let k = 0; zp && sz && k < 400; k++) {
        const a = rng.f() * 6.283, d = 4 + rng.f() * 5, x = Math.floor(zp.x + Math.cos(a) * d), y = Math.floor(zp.y + Math.sin(a) * d);
        if (!M.freeRect(RF, x, y, sz.fw, sz.fh, 1)) continue;
        const c = M.mkCont("armory", I.rollAirdrop(rng, building.diff || 2), rng);
        c.name = "군 보급 상자";
        M.addProp(RF, "airdrop", x, y, {
          cont: c,
          v: 0
        });
        Rd.dropAt = {
          x: x + sz.fw / 2,
          y: y + .5,
          cont: c,
          smokeT: 0
        };
        RF.lamps.push({
          x: x + sz.fw / 2 - .2,
          y: y - .6,
          r: 6,
          c: [ 255, 60, 40 ],
          a: .9,
          flicker: true,
          drop: true
        });
        break;
      }
    }
    Rd.boss = building.train || building.noBoss || Rd.fire || Rd.noS ? null : A.spawnBossSquad(lv.floors[lv.roofIdx], new SX.Rng(seed * 7 + 991), G.lootCtx(lv.roofIdx), diff);
    Rd.stairLock = null;
    if (EV && EV.lock) {
      const nF = building.floors, rng = new SX.Rng(seed * 37 + 5), k = nF >= 3 ? 1 + rng.i(nF - 2) : 0, FL = lv.floors[k];
      FL.stairs.forEach(s => {
        if (s.dir === "up") s.locked = true;
      });
      let pool = FL.conts.filter(c => [ "desk", "locker", "cabinet", "shelf", "crate", "medcab" ].indexOf(c.type) >= 0);
      if (pool.length < 4) pool = FL.conts.slice();
      let n = 0;
      for (let t = 0; t < 4 && pool.length; t++) {
        const c = pool.splice(rng.i(pool.length), 1)[0], key = I.mk(Rd.STAIR_KEY);
        if (key && I.putGrow(c.grid, key)) n++;
      }
      Rd.stairLock = {
        f: k,
        keys: n
      };
    }
    if (SX.traps && !building.train) SX.traps.build(lv, seed, building);
    Rd.named = building.final || building.train ? null : A.spawnNamed ? A.spawnNamed(lv, new SX.Rng(seed * 53 + 3), G.lootCtx, building) : null;
    if (Rd.named && Rd.named.def && (Rd.noS && Rd.named.def.type === "scav" || Rd.noZ && Rd.named.def.type === "zombie")) Rd.named = null;
    finalSetup(lv, seed, building, G);
    if (SX.ev && SX.ev.start) SX.ev.start(lv);
    if (SX.week && SX.week.start) SX.week.start(lv);
    if (SX.mis && SX.mis.start) SX.mis.start(lv);
    if (SX.bdev && SX.bdev.start) SX.bdev.start(lv);
    if (SX.chem && SX.chem.rainPanel) SX.chem.rainPanel(lv, seed, building, G.env);
    if (Rd.noS || Rd.noZ) {
      const cut = Rd.noS ? "scav" : "zombie";
      let j = 0;
      const n0 = A.enemies.length;
      for (const e of A.enemies) {
        if (e.type === cut) {
          e.alive = false;
          e.dormant = false;
          e.gone = true;
          continue;
        }
        A.enemies[j++] = e;
      }
      A.enemies.length = j;
      let fill = n0 - j + packShort;
      const RF0 = lv.floors[lv.roofIdx];
      if (Rd.noS && !building.noBoss && RF0 && RF0.zip) fill += 2 + Math.max(1, Math.min(4, diff | 0 || 2));
      for (let f = 0, left = fill; f < building.floors && left > 0; f++) {
        const k = f === building.floors - 1 ? left : Math.min(left, Math.round(fill * wt[f] / ws));
        left -= k;
        if (k <= 0 || !lv.floors[f]) continue;
        A.spawnPacks(lv.floors[f], new SX.Rng(seed * 59 + f * 307), Rd.noS ? k : 0, Rd.noZ ? k : 0, G.lootCtx(f), f === 0 ? lobbies : null);
      }
      for (let t = 0, want = j + fill; t < 8 && A.enemies.length < want; t++) {
        const f = building.floors - 1 - t % building.floors, k = want - A.enemies.length;
        if (!lv.floors[f]) continue;
        A.spawnPacks(lv.floors[f], new SX.Rng(seed * 61 + t * 503), Rd.noS ? k : 0, Rd.noZ ? k : 0, G.lootCtx(f), f === 0 ? lobbies : null);
      }
    }
    I.uidSet(uidKeep);
    Rd.conts = new Map;
    Rd.extras = [];
    Rd.dropN = 0;
    lv.floors.forEach(F => F.conts.forEach((c, i) => Rd.reg(c, "c" + F.idx + "_" + i)));
    A.enemies.forEach((e, i) => {
      e.nid = i;
    });
    if (SX.logQ) SX.logQ(true);
    Rd.pax = null;
    {
      const P0 = SX.prog, who = building.final && P0.rsOf && P0.rsOpen(G.save.story, G.save) ? P0.rsOf(G.save.story).cur : null;
      if (who && Rd.spawnPax(who, F0, sx + 1, sy + .8)) {
        SX.log("🚁 " + (P0.ST_WHO[who] || who) + " 이(가) 따라옵니다 — 살려서 같이 헬기에 타십시오", "good");
        if (G.save.merc) SX.log("🤝 용병은 이번엔 못 데려갑니다 — 헬기 자리는 하나입니다");
      }
    }
    if (G.save.merc && !Rd.pax && !Rd.tutMode) {
      const m = SX.data.mercs.find(x => x.id === G.save.merc);
      if (m) {
        A.spawnAlly(lv.floors[sf], m, sx + 1, sy + .8);
        SX.log("🤝 " + m.name + " 이(가) 따라붙었습니다");
      }
      G.save.merc = null;
    }
    G.stats = {
      kills: 0,
      t0: performance.now(),
      picked: []
    };
    SX.audio.music(true);
    SX.log("🏢 " + building.name + " · " + (tod === "night" ? "밤" : "낮") + (SX.enterLine ? " — " + SX.enterLine(building, seed) : ""));
    const tip = ((G.save && G.save.runs) | 0) <= 3;
    if (EV) SX.log("📢 오늘 상황: " + EV.name + " — " + (EV.id === "blackout" && !tip ? "건물 안이 훨씬 어둡습니다" : EV_SHORT[EV.id] || EV.desc), "warn");
    if (lv.outdoor === "site") SX.log("공사장을 가로질러 북쪽 뒷문으로 탈출합니다"); else if (lv.outdoor === "tunnel") SX.log("선로를 따라 북쪽 비상 사다리로 탈출합니다"); else if (lv.outdoor) SX.log("다리를 건너 북단 검문소로 탈출합니다"); else if (Rd.fire) SX.log("🔥 화재 판 — 옥상에서 들어가 지하 주차장으로 나갑니다"); else if (Rd.flood) SX.log("🌊 침수 판 — 물이 아래부터 차오릅니다 · 위층 · 옥상으로 나갑니다"); else SX.log("옥상 집라인으로 탈출합니다");
    if (building.train) SX.log("🎓 연습장 — 문은 안 잠기고 가스도 안 찹니다 · 장비도 그대로입니다", "good"); else if (lv.outdoor === "site") SX.log("정문은 " + EXIT_LOCK_T + "초 뒤 잠깁니다 · 가스가 바닥부터 찹니다"); else if (lv.outdoor === "tunnel") SX.log("남쪽 역 셔터는 " + EXIT_LOCK_T + "초 뒤 내려갑니다 · 가스가 선로로 번집니다"); else if (lv.outdoor) SX.log("남단은 " + EXIT_LOCK_T + "초 뒤 봉쇄됩니다 · 가스가 다리로 번집니다"); else if (Rd.fire) SX.log(tip ? "⚠ 연기가 위층부터 내려옵니다 — 앉으면 덜 마십니다" : "⚠ 연기가 위층부터 내려옵니다", "warn"); else if (Rd.flood) SX.log(tip ? "⚠ 물이 무릎까지 차면 1층 문이 안 열립니다 · 잠기면 숨이 줄어듭니다" : "⚠ 물이 무릎까지 차면 1층 문이 안 열립니다", "warn"); else SX.log("1층 문은 " + EXIT_LOCK_T + "초 뒤 잠깁니다");
    if (Rd.noS) SX.log("🔫 약탈자 없는 판 — 감염체만 나옵니다", "good"); else if (Rd.noZ) SX.log("🧟 좀비 없는 판 — 약탈자만 나옵니다", "good");
    if (lv.escape && tip) SX.log("🧗 " + (lv.escape.f + 1) + "층 바깥 벽에 완강기가 있습니다(6초)");
    SX.wx.announce(G.env);
    if (Rd.heli) SX.log("🚁 마지막 작전 — 옥상 헬기장에서 [" + SX.label("interact") + "] 로 헬기를 부르고 " + HELI_WAIT + "초 버티십시오", "warn");
    if (Rd.named) SX.log("☠ 소문: " + (Rd.named.f + 1) + "층에 " + Rd.named.def.name + " — " + Rd.named.def.rumor, "warn");
    if (tip && lv.floors.some(F => F.traps && F.traps.length)) SX.log("⚠ 함정 조심 — 문턱 줄 · 바닥 곰덫 · [" + SX.label("quiet") + "] 조용히 걸으면 줄을 넘습니다", "warn");
    if (Rd.stairLock) SX.log("🔒 " + (Rd.stairLock.f + 1) + "층의 올라가는 계단이 잠겼습니다 — 열쇠는 그 층에 있습니다", "warn");
    Rd.storySetup();
    Rd.eggSetup();
    if (Rd.dropAt) {
      const z = lv.floors[lv.roofIdx].zip, dx = Rd.dropAt.x - z.x, dy = Rd.dropAt.y - z.y, dir = Math.abs(dx) > Math.abs(dy) * 2 ? dx > 0 ? "동쪽" : "서쪽" : Math.abs(dy) > Math.abs(dx) * 2 ? dy > 0 ? "남쪽" : "북쪽" : (dy > 0 ? "남" : "북") + (dx > 0 ? "동쪽" : "서쪽");
      SX.log("📦 보급 상자: 옥상(" + (lv.roofIdx + 1) + "층) 집라인에서 " + dir + "으로 " + Math.round(Math.hypot(dx, dy)) + "칸 — 지도에 노란 네모", "warn");
    }
    if (SX.logQ) SX.logQ(false);
    return lv;
  };
  Rd.pax = null;
  Rd.spawnPax = function(who, F, x, y, hp) {
    const P0 = SX.prog;
    if (!P0.rsBy || !P0.rsBy(who)) return null;
    const m = {
      id: "pax:" + who,
      name: P0.ST_WHO[who] || who,
      hp: 160,
      acc: 0,
      sight: 0,
      ear: 0,
      fov: 120,
      gun: null,
      melee: null,
      rate: 1
    };
    const al = A.spawnAlly(F, m, x, y);
    if (!al) return null;
    const spec = SX.hub && SX.hub.civSpec ? SX.hub.civSpec(who) : null;
    if (spec) al.spec = Object.assign({}, spec, {
      key: "pax" + who
    });
    al.passive = true;
    al.pax = who;
    al.hideWeapon = true;
    if (hp != null) al.hp = hp;
    Rd.pax = who;
    return al;
  };
  Rd.paxAlive = () => !!(Rd.pax && A.allies.some(a => a.pax === Rd.pax && a.alive));
  Rd.story = [];
  Rd.storySetup = function() {
    Rd.story = [];
    const G = SX.game, P = SX.prog, lv = Rd.level;
    if (!lv || !P || !P.stSpawns) return;
    const b = lv.building;
    if (b.train || b.final) return;
    const has = n => P.countIn(G.save.stash, n) > 0 || !!I.findInKit(G.kit, n);
    const GOOD = [ "desk", "cabinet", "locker", "shelf", "crate", "medcab", "fridge" ];
    const spotsOf = F => {
      const out = [], seen = new Set;
      const free = (x, y) => F.in(x, y) && F.tile(x, y) === T.FLOOR && !F.solid[F.i(x, y)] && !seen.has(x + "," + y) && !F.zones.some(z => x >= z.x - 1 && x < z.x + z.w + 1 && y >= z.y - 1 && y < z.y + z.h + 1);
      for (const pr of F.props) {
        if (!pr.cont || GOOD.indexOf(pr.cont.type) < 0 || pr.px != null) continue;
        if (SX.vault && SX.vault.inVault(F, pr.x, pr.y)) continue;
        const x0 = Math.floor(pr.x), x1 = Math.ceil(pr.x + pr.w) - 1, yb = Math.ceil(pr.y + pr.h), ym = Math.floor(pr.y + pr.h - .5), cand = [];
        for (let x = x0; x <= x1; x++) cand.push([ x, yb ]);
        cand.push([ x0 - 1, ym ], [ x1 + 1, ym ]);
        const c = cand.find(([x, y]) => free(x, y));
        if (!c) continue;
        seen.add(c[0] + "," + c[1]);
        out.push({
          x: c[0] + .5,
          y: c[1] + .5
        });
      }
      return out;
    };
    const base = lv.floors.map(F => spotsOf(F));
    for (const sp of P.stSpawns(G.save.story, b.id)) {
      if (has(sp.item) || Rd.storyGone && Rd.storyGone[sp.item] != null) continue;
      const rng = new SX.Rng((Rd.seed >>> 0 ^ Math.imul(SX.hash(sp.item) | 0, 40503)) >>> 0);
      const per = base.map(L => L.slice());
      const want = sp.lead ? 8 : 6, spots = [], floors = [];
      let order = lv.floors.map((F, i) => i).filter(i => per[i].length && !lv.floors[i].park);
      if (sp.up) {
        const half = Math.floor((b.floors || lv.floors.length) / 2), hi = order.filter(i => i >= half && i < (b.floors || lv.floors.length));
        if (hi.length) order = hi;
      }
      let k = order.length ? rng.i(order.length) : 0;
      for (let t = 0; t < 400 && spots.length < want && order.some(i => per[i].length); t++) {
        const f = order[k % order.length];
        k++;
        if (!per[f].length) continue;
        const c = per[f].splice(rng.i(per[f].length), 1)[0];
        spots.push({
          f,
          x: c.x,
          y: c.y
        });
        if (floors.indexOf(f) < 0) floors.push(f);
      }
      if (!spots.length) continue;
      floors.sort((x, y) => x - y);
      Rd.story.push({
        item: sp.item,
        id: sp.id,
        lead: !!sp.lead,
        spots,
        floors
      });
    }
    if (Rd.storySaid == null || Rd.storySaid.seed !== Rd.seed) Rd.storySaid = {
      seed: Rd.seed,
      items: {}
    };
    for (const e of Rd.story) if (!e.lead && !(SX.qhide && SX.qhide.has("s", e.id)) && !Rd.storySaid.items[e.item] && (Rd.storySaid.items[e.item] = 1)) SX.log("★ 임무 물건 「" + e.item + "」 — " + (e.floors.length > 2 ? e.floors[0] + 1 + "~" + (e.floors[e.floors.length - 1] + 1) : e.floors.map(f => f + 1).join("·")) + "층 바닥 " + e.spots.length + "곳에 있습니다(노란 빛)", "good");
  };
  Rd.egg = null;
  Rd.eggGot = null;
  Rd.eggSetup = function() {
    Rd.egg = null;
    Rd.eggGot = null;
    const G = SX.game, lv = Rd.level;
    if (!lv || !SX.eggOf) return;
    const b = lv.building;
    if (b.train || b.final) return;
    const def = SX.eggOf(b.id);
    if (!def || (G.save.eggs || []).indexOf(def.id) >= 0) return;
    const nF = lv.parkIdx != null ? lv.parkIdx : lv.floors.length, cand = [];
    lv.floors.forEach((F, f) => {
      if (F.park) return;
      const roof = F.kind === "roof", top = !roof && (f === nF - 2 || nF === 1 || f === nF - 1 && lv.floors[nF - 1].kind !== "roof");
      const ok = def.where === "roof" ? roof : def.where === "top" ? top : def.where === "f1" ? f === 0 && !roof : !roof;
      if (!ok) return;
      for (const pr of F.props) {
        if (pr.kind !== def.kind || SX.vault && SX.vault.inVault(F, pr.x, pr.y)) continue;
        if (def.room) {
          const ri = F.room[F.i(Math.floor(pr.x), Math.floor(pr.y))], rm = F.rooms[ri];
          if (def.room === "hall" ? ri >= 0 : !rm || rm.theme !== def.room) continue;
        }
        cand.push({
          f,
          pr
        });
      }
    });
    if (!cand.length) return;
    const rng = new SX.Rng((Rd.seed >>> 0 ^ Math.imul(SX.hash("egg:" + def.id) | 0, 2654435761)) >>> 0);
    const c = cand[rng.i(cand.length)];
    Rd.egg = {
      def,
      f: c.f,
      prop: c.pr,
      n: cand.length
    };
  };
  Rd.eggNear = function(F, p) {
    const e = Rd.egg;
    if (!e || e.f !== F.idx) return null;
    const pr = e.prop, cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
    const dx = Math.max(Math.abs(p.x - cx) - pr.w / 2, 0), dy = Math.max(Math.abs(p.y - .2 - cy) - pr.h / 2, 0);
    if (Math.hypot(dx, dy) > 1 || !SX.light.los(F, p.x, p.y - .05, Math.min(Math.max(p.x, pr.x + .1), pr.x + pr.w - .1), Math.min(Math.max(p.y - .2, pr.y + .1), pr.y + pr.h - .1))) return null;
    return {
      x: cx,
      y: pr.y - .2
    };
  };
  Rd.eggTake = function() {
    const e = Rd.egg;
    if (!e) return false;
    const G = SX.game, p = A.player, names = [ e.def.item ].concat(e.def.gift || []), its = names.map(n => I.mk(n)).filter(Boolean);
    const kit2 = JSON.parse(JSON.stringify(G.kit));
    if (!its.every(it => I.kitStow(kit2, JSON.parse(JSON.stringify(it))))) {
      SX.audio.play("denied");
      SX.log("🔍 무언가 있습니다 — 가방·리그에 자리가 " + its.length + "칸 필요합니다. 비우고 다시 살펴보십시오", "warn");
      return false;
    }
    for (const it of its) I.kitStow(G.kit, it);
    Rd.egg = null;
    Rd.eggGot = e.def.id;
    SX.audio.play("pickup");
    SX.audio.play("confirm", {
      delay: .15
    });
    if (p) A.float(p.floor, p.x, p.y - 1.7, "🔍 " + e.def.item, "#9fe0ff");
    SX.log("🔍 숨겨진 것을 찾았습니다 — 「" + e.def.item + "」 + " + (e.def.gift || []).join(", ") + " · 살아서 나가면 기록됩니다", "good");
    if (G.stats) (G.stats.picked || (G.stats.picked = [])).push(e.def.item);
    if (SX.ui) {
      SX.ui.refresh && SX.ui.refresh();
      SX.ui.hudDirty && SX.ui.hudDirty();
    }
    return true;
  };
  Rd.storyNear = function(F, p) {
    for (const e of Rd.story) for (const s of e.spots) {
      if (s.f !== F.idx) continue;
      if (Math.hypot(p.x - s.x, p.y - .2 - s.y) < 1.3 && SX.light.los(F, p.x, p.y - .05, s.x, s.y)) return {
        e,
        s
      };
    }
    return null;
  };
  Rd.storyTake = function(e) {
    if (!e || Rd.story.indexOf(e) < 0) return false;
    const G = SX.game, p = A.player, it = I.mk(e.item);
    if (!it) return false;
    if (!I.kitStow(G.kit, it)) {
      SX.audio.play("denied");
      SX.log("★ 「" + e.item + "」 — 가방·리그에 자리가 없습니다. 한 칸을 비우고 다시 주우십시오", "warn");
      return false;
    }
    Rd.story = Rd.story.filter(q => q !== e);
    if (SX.coop && SX.coop.storyTook) SX.coop.storyTook(e.item, it.id);
    const m = SX.prog.stById(e.id), who = m ? SX.prog.ST_WHO[m.who] : "";
    SX.audio.play("pickup");
    SX.audio.play("confirm", {
      delay: .12
    });
    if (p) A.float(p.floor, p.x, p.y - 1.7, "★ " + e.item, "#ffd24a");
    SX.log("★ 「" + e.item + "」을(를) 주웠습니다 — " + (e.lead ? "누군가 찾던 물건 같습니다. 장터의 " + who + "에게 보여 주십시오" : "살아서 나가 장터의 " + who + "에게 가져가십시오"), "good");
    if (G.stats) (G.stats.picked || (G.stats.picked = [])).push(e.item);
    if (SX.ui) {
      SX.ui.refresh && SX.ui.refresh();
      SX.ui.hudDirty && SX.ui.hudDirty();
    }
    return true;
  };
  Rd.drawStory = function(ctx, F, cam, TS, now, top) {
    if (!Rd.story.length) return;
    for (const e of Rd.story) {
      let ic = null;
      const hid = !!(SX.qhide && SX.qhide.has("s", e.id));
      if (top && hid) continue;
      for (const s of e.spots) {
        if (s.f !== F.idx) continue;
        const x = Math.round(s.x * TS - cam.x), y = Math.round(s.y * TS - cam.y), pul = .5 + .5 * Math.sin(now * 4 + s.x * 1.7);
        if (!top) {
          if (!hid) {
            ctx.fillStyle = "rgba(255,210,74," + (.12 + .14 * pul).toFixed(3) + ")";
            ctx.fillRect(x - 15, y - 11, 30, 22);
            ctx.fillRect(x - 12, y - 14, 24, 28);
          }
          if (!ic) ic = SX.art.icon(I.def(e.item));
          if (ic) {
            const w = 24, h = Math.max(8, Math.round(ic.height * w / ic.width));
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(ic, x - (w >> 1), y - (h >> 1), w, h);
          }
          continue;
        }
        const by = y - 24 + Math.round(Math.sin(now * 3 + s.y) * 2);
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 2, by - 7, 5, 15);
        ctx.fillRect(x - 7, by - 2, 15, 5);
        ctx.fillRect(x - 4, by - 4, 9, 9);
        ctx.fillStyle = "#ffd24a";
        ctx.fillRect(x - 1, by - 6, 3, 13);
        ctx.fillRect(x - 6, by - 1, 13, 3);
        ctx.fillRect(x - 3, by - 3, 7, 7);
        ctx.fillStyle = "#fff6c0";
        ctx.fillRect(x - 1, by - 1, 3, 3);
      }
    }
  };
  const HELI_WAIT = 90, WAVE_EVERY = 15, WAVES = 5, WAVE_N = 4, WAVE_DOOR = 24, WAVE_STEP = 20;
  Rd.HELI_WAIT = HELI_WAIT;
  function waveSrc(F, pad, hut) {
    const W = F.W, N = W * F.H, dist = new Int16Array(N).fill(-1), q = new Int32Array(N), NB = [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ];
    const ok = i => {
      const t = F.t[i];
      let pass = t === T.FLOOR || t === T.GROUND || t === T.STAIR;
      if (t === T.DOOR) {
        const d = F.doorAt.get(i);
        pass = !!d && !d.locked;
      }
      return pass && !(F.solid[i] && !(F.thin && F.thin[i]));
    };
    const s = Math.floor(pad.y + pad.h / 2) * W + Math.floor(pad.x + pad.w / 2);
    let h = 0, tl = 0;
    q[tl++] = s;
    dist[s] = 0;
    while (h < tl) {
      const c = q[h++], cx = c % W, cy = c / W | 0;
      for (const [dx, dy] of NB) {
        const nx = cx + dx, ny = cy + dy;
        if (!F.in(nx, ny)) continue;
        const n = ny * W + nx;
        if (dist[n] >= 0 || !ok(n)) continue;
        dist[n] = dist[c] + 1;
        q[tl++] = n;
      }
    }
    let c = Math.floor(hut.y) * W + Math.floor(hut.x);
    if (dist[c] >= 0 && dist[c] <= WAVE_DOOR) return {
      x: hut.x,
      y: hut.y,
      door: true,
      d: dist[c]
    };
    if (dist[c] >= 0) {
      while (dist[c] > WAVE_STEP) {
        const cx = c % W, cy = c / W | 0;
        let nx = -1;
        for (const [dx, dy] of NB) {
          if (!F.in(cx + dx, cy + dy)) continue;
          const n = (cy + dy) * W + cx + dx;
          if (dist[n] >= 0 && dist[n] < dist[c]) {
            nx = n;
            break;
          }
        }
        if (nx < 0) break;
        c = nx;
      }
    } else {
      let bd = 1e9;
      c = -1;
      for (let i = 0; i < N; i++) {
        if (dist[i] < WAVE_STEP - 2 || dist[i] > WAVE_STEP + 2) continue;
        const d = Math.hypot(i % W + .5 - hut.x, (i / W | 0) + .5 - hut.y);
        if (d < bd) {
          bd = d;
          c = i;
        }
      }
      if (c < 0) return {
        x: hut.x,
        y: hut.y,
        door: true,
        d: -1
      };
    }
    return {
      x: c % W + .5,
      y: (c / W | 0) + .5,
      door: false,
      d: dist[c]
    };
  }
  function finalSetup(lv, seed, building, G) {
    Rd.heli = null;
    if (!building.final) return;
    Rd.lockLeft = 3;
    for (const F of lv.floors) for (const z of F.zones) if (z.kind === "zip" || z.kind === "escape") {
      z.locked = true;
      z.hidden = true;
    }
    lv.escape = null;
    const RF = lv.floors[lv.roofIdx], hut = RF.hut, rng = new SX.Rng(seed * 59 + 17);
    let pad = null;
    for (let k = 0; k < 800 && !pad; k++) {
      const x = lv.X0 + 4 + rng.i(lv.X1 - lv.X0 - 10), y = lv.Y0 + 4 + rng.i(lv.Y1 - lv.Y0 - 10);
      if (Math.hypot(x + 3 - hut.x, y + 3 - hut.y) < 14) continue;
      if (!M.freeRect(RF, x - 1, y - 1, 8, 8, 0)) continue;
      pad = {
        x,
        y,
        w: 6,
        h: 6
      };
    }
    if (!pad) pad = {
      x: Math.round(RF.zip.x) - 3,
      y: Math.round(RF.zip.y) - 3,
      w: 6,
      h: 6
    };
    const zone = Object.assign({
      kind: "heli",
      label: "헬기",
      locked: true,
      hidden: true
    }, pad);
    RF.zones.push(zone);
    const waves = [], ctx = Object.assign({}, G.lootCtx(lv.roofIdx), {
      floor: 9
    }), src = waveSrc(RF, pad, hut);
    for (let w = 0; w < WAVES; w++) {
      const L = [];
      for (let k = 0; k < WAVE_N; k++) {
        let ex = src.x + (rng.f() - .5) * 3, ey = src.y + (rng.f() - .5) * 3;
        if (!src.door && !(RF.in(Math.floor(ex), Math.floor(ey)) && A.free(RF, ex, ey, .3))) {
          ex = src.x;
          ey = src.y;
        }
        const e = A.spawnEnemy(RF, "scav", ex, ey, rng, ctx);
        e.armed = true;
        e.melee = null;
        e.melee2 = false;
        e.gun = SX.enemyGun(rng, 4);
        e.gunMods = A.rollGunMods(e.gun, 3, seed + w * 31 + k | 0);
        e.hasArmor = true;
        e.doorSkill = true;
        e.items = e.items.slice(0, 1);
        e.alive = false;
        e.dormant = true;
        e.wave = w;
        L.push(e);
      }
      waves.push(L);
    }
    Rd.heli = {
      pad,
      zone,
      waves,
      t0: null,
      woke: [],
      landed: false,
      f: lv.roofIdx,
      src
    };
  }
  function wakeWave(w) {
    const H = Rd.heli;
    if (!H || H.woke[w]) return;
    H.woke[w] = 1;
    const c = {
      x: H.pad.x + H.pad.w / 2,
      y: H.pad.y + H.pad.h / 2
    };
    for (const e of H.waves[w] || []) {
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
    if (H.src) H.warn = {
      t: Rd.t,
      x: H.src.x,
      y: H.src.door ? H.src.y + 6 : H.src.y
    };
    if (A.player && A.player.floor === H.f) SX.log("⚠ " + (H.src && !H.src.door ? "옥상 출입구 쪽에서" : "옥상 출입구로") + " 약탈자가 몰려옵니다 (" + (w + 1) + "/" + WAVES + ")", "bad");
  }
  Rd.callHeli = function(remote, at) {
    const H = Rd.heli;
    if (!H || H.t0 != null) return false;
    H.t0 = remote && typeof at === "number" && isFinite(at) ? Math.max(Rd.t - 10, Math.min(Rd.t, at)) : Rd.t;
    if (!remote && SX.coop && SX.coop.heli) SX.coop.heli();
    SX.audio.play("beacon", {
      vol: 1
    });
    SX.audio.play("flare");
    const c = {
      x: H.pad.x + H.pad.w / 2,
      y: H.pad.y + H.pad.h / 2
    };
    SX.light.flash(H.f, c.x, c.y, 10, [ 120, 200, 255 ], 3, .8);
    A.noise(Rd.level.floors[H.f], c.x, c.y, 60, false, 0, true);
    SX.log("📻 " + (remote ? "같이 하는 사람이 " : "") + "헬기를 불렀습니다 — " + HELI_WAIT + "초 버티십시오!", "good");
    return true;
  };
  function heliTick() {
    const H = Rd.heli;
    if (!H || H.t0 == null) return;
    const el = Rd.t - H.t0;
    for (let w = 0; w < WAVES; w++) if (el >= w * WAVE_EVERY + 3 && !H.woke[w]) wakeWave(w);
    if (el >= HELI_WAIT && !H.landed) {
      H.landed = true;
      H.zone.hidden = false;
      H.zone.locked = false;
      SX.audio.play("heliLand", {
        vol: .8
      });
      SX.view.shake(4);
      SX.log("🚁 헬기가 내려앉았습니다 — 헬기장에 서십시오!", "good");
    }
  }
  Rd.heliSound = () => {
    const H = Rd.heli, p = A.player;
    if (!H || H.t0 == null || !p) return 0;
    const el = Rd.t - H.t0;
    const k = H.landed ? 1 : Math.max(0, Math.min(1, (el - (HELI_WAIT - 14)) / 14));
    return k * (p.floor === H.f ? 1 : .35);
  };
  Rd.heliLeft = () => {
    const H = Rd.heli;
    return H && H.t0 != null && !H.landed ? Math.max(0, HELI_WAIT - (Rd.t - H.t0)) : null;
  };
  Rd.floor = () => Rd.level && A.player ? Rd.level.floors[A.player.floor] : null;
  Rd.gasRate = function(lv, y) {
    const b = lv.building, g = (b.gas || 1) * (Rd.event && Rd.event.gas || 1), solo = !!(SX.soloMap && SX.soloMap(b));
    return GAS_RISE * (y < M.FH && !solo ? 2 : .5) * g;
  };
  Rd.catchUp = function(d) {
    const lv = Rd.level;
    if (!lv || !Rd.on || Rd.over || !(d > 0)) return;
    d = Math.min(d, 3600);
    Rd.t += d;
    if (!Rd.locked) Rd.lockLeft -= d;
    if (!lv.building.train && !Rd.fire && !Rd.flood) {
      let left = d;
      while (left > 0) {
        const s = Math.min(.5, left);
        Rd.gasY += Rd.gasRate(lv, Rd.gasY) * s;
        left -= s;
      }
    }
  };
  Rd.storyLost = function(n) {
    const k = Rd.story.length;
    Rd.story = Rd.story.filter(q => q.item !== n);
    return Rd.story.length !== k;
  };
  Rd.gasEta = function(f) {
    const lv = Rd.level;
    if (!lv) return null;
    const Fl = lv.floors[f];
    if (!Fl || Fl.kind === "roof" || lv.building.train) return null;
    const r1 = Rd.gasRate(lv, 0), r2 = Rd.gasRate(lv, M.FH), target = f * M.FH + 1.6;
    let y = Rd.gasY, t = 0;
    if (y >= target) return 0;
    if (y < M.FH) {
      const a = Math.min(target, M.FH);
      t += (a - y) / r1;
      y = a;
    }
    if (y < target) t += (target - y) / r2;
    return t;
  };
  Rd.SPAWNS = 12;
  Rd.spreadSpawns = function(lv) {
    lv.spawnSpread = true;
    const F = lv.floors[0], A = SX.actors, s0 = lv.spawnPts[0];
    if (!F || !A || !A.free || !s0) return;
    const depth = Math.max(10, Math.min(30, Math.round((lv.Y1 - lv.Y0) * .4))), yMin = lv.Y1 - depth, zip = F.zip;
    const ok = (x, y) => y >= yMin && y < lv.Y1 - 1.5 && A.free(F, x, y, .4) && !(zip && Math.hypot(x - zip.x, y - zip.y) < 14);
    const sx = Math.floor(s0[0]) + .5, sy = Math.floor(s0[1]) + .5;
    if (!ok(sx, sy)) return;
    const seen = new Set([ sx + "," + sy ]), q = [ [ sx, sy ] ], pts = [];
    while (q.length && pts.length < 6e3) {
      const [x, y] = q.shift();
      pts.push([ x, y ]);
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const nx = x + dx, ny = y + dy, k = nx + "," + ny;
        if (seen.has(k)) continue;
        seen.add(k);
        if (ok(nx, ny)) q.push([ nx, ny ]);
      }
    }
    if (pts.length < 24) return;
    const out = [ [ sx, sy ] ], dmin = pts.map(([x, y]) => Math.hypot(x - sx, y - sy));
    while (out.length < lv.spawnPts.length) {
      let bi = 0;
      for (let i = 1; i < pts.length; i++) if (dmin[i] > dmin[bi]) bi = i;
      const b = pts[bi];
      out.push(b);
      for (let i = 0; i < pts.length; i++) dmin[i] = Math.min(dmin[i], Math.hypot(pts[i][0] - b[0], pts[i][1] - b[1]));
    }
    lv.spawnPts = out;
  };
  Rd.spawnFor = function(k, lv) {
    lv = lv || Rd.level;
    if (!lv) return null;
    if (lv.spawnPts && !lv.spawnSpread) Rd.spreadSpawns(lv);
    if (lv.roofSpawns) {
      const k2 = typeof k === "string" ? Math.max(0, [ "s", "n", "w", "e" ].indexOf(k)) : (k | 0) % lv.roofSpawns.length, q = lv.roofSpawns[k2];
      return {
        side: q.side,
        x: q.x,
        y: q.y,
        ring: Math.floor(k2 / 4),
        roof: true
      };
    }
    if (lv.spawnPts) {
      const q = lv.spawnPts[typeof k === "string" ? 0 : (k | 0) % lv.spawnPts.length];
      return {
        side: "s",
        x: q[0],
        y: q[1],
        ring: typeof k === "string" ? 0 : Math.floor((k | 0) / 4)
      };
    }
    const side = typeof k === "string" ? k : [ "s", "n", "w", "e" ][(k | 0) % 4], ring = typeof k === "string" ? 0 : Math.floor((k | 0) / 4) % 3;
    const e = lv.exits.find(q => q.side === side);
    if (!e) return null;
    const horiz = side === "s" || side === "n", a0 = horiz ? lv.X0 : lv.Y0, span = horiz ? lv.X1 - lv.X0 : lv.Y1 - lv.Y0;
    const ef = ((horiz ? e.x + .5 : e.y + .5) - a0) / span, cand = [ .18, .5, .82 ].sort((p, q) => Math.abs(p - ef) - Math.abs(q - ef)).slice(1).sort((p, q) => p - q);
    const along = ring === 0 ? horiz ? e.x + .5 : e.y + .5 : a0 + span * cand[ring - 1];
    let x, y;
    if (side === "s") {
      x = along;
      y = lv.Y1 - 3.5;
    } else if (side === "n") {
      x = along;
      y = lv.Y0 + 3.5;
    } else if (side === "w") {
      x = lv.X0 + 3.5;
      y = along;
    } else {
      x = lv.X1 - 3.5;
      y = along;
    }
    const F = lv.floors[0];
    if (ring && F && !A.free(F, x, y)) {
      let best = null;
      for (let r = 1; r <= 6 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (A.free(F, x + dx, y + dy)) {
          best = {
            x: x + dx,
            y: y + dy
          };
          break;
        }
      }
      if (best) {
        x = best.x;
        y = best.y;
      }
    }
    return {
      side,
      x,
      y,
      ring
    };
  };
  const r2 = v => Math.round(v * 100) / 100;
  Rd.conts = new Map;
  Rd.extras = [];
  Rd.dropN = 0;
  Rd.reg = function(cont, key) {
    cont.key = key;
    cont.grid.shared = key;
    Rd.conts.set(key, cont);
  };
  Rd.addExtra = function(meta) {
    Rd.extras.push(meta);
  };
  Rd.newDropKey = owner => "d" + (owner != null ? owner : "me") + "_" + Rd.dropN++;
  const nd = it => {
    const o = Object.assign({}, it);
    if (it.grid) o.grid = gd(it.grid);
    return o;
  };
  const gd = g => ({
    cols: g.cols,
    rows: g.rows,
    list: g.list.map(e => ({
      x: e.x,
      y: e.y,
      it: nd(e.it)
    }))
  });
  const nr = o => {
    const it = Object.assign({}, o);
    if (o.grid) {
      it.grid = gr(o.grid);
      it.grid.owned = true;
      if (it.folded) it.grid.shut = true;
    }
    return it;
  };
  const gr = d => ({
    cols: d.cols,
    rows: d.rows,
    list: (d.list || []).map(e => ({
      x: e.x,
      y: e.y,
      it: nr(e.it)
    }))
  });
  Rd.nd = nd;
  Rd.gd = gd;
  Rd.nr = nr;
  Rd.gr = gr;
  Rd.worldDump = function() {
    const lv = Rd.level;
    if (!lv) return null;
    if (SX.ev) SX.ev.ensure();
    if (SX.bdev) SX.bdev.ensure();
    if (SX.week) SX.week.ensure();
    return {
      conts: [ ...Rd.conts ].map(([k, c]) => [ k, gd(c.grid), c.searched ? 1 : 0, c.revealed | 0 ]),
      en: A.enemies.map(e => [ e.nid, r2(e.x), r2(e.y), r2(e.face || 0), Math.round(e.hp * 10) / 10, e.alive ? 1 : 0, e.dormant ? "dormant" : e.ai, r2(e.deathA || 0) ]),
      extras: Rd.extras.slice(),
      doors: lv.floors.map(F => F.doors.map(d => d.open ? 1 : 0).join("")),
      dul: lv.floors.map(F => F.doors.map(d => d.locked || d.exit ? 0 : 1).join("")),
      stl: lv.floors.map(F => F.stairs.map(s => s.locked ? 1 : 0).join("")),
      tr: SX.traps ? SX.traps.dump(lv) : null,
      hl: Rd.heli && Rd.heli.t0 != null ? r2(Rd.heli.t0) : undefined,
      sg: Rd.storyGone && Object.keys(Rd.storyGone).length ? Object.keys(Rd.storyGone).slice(0, 40) : undefined,
      trp: SX.traps && SX.traps.dumpPlaced ? SX.traps.dumpPlaced(lv) : undefined,
      ch: SX.chem ? SX.chem.dump() : undefined,
      ev: SX.ev ? SX.ev.dump() : undefined,
      wk: SX.week ? SX.week.dump() : undefined,
      mi: SX.mis ? SX.mis.dump() : undefined,
      bd: SX.bdev ? SX.bdev.dump() : undefined
    };
  };
  Rd.worldApply = function(w, opt) {
    const lv = Rd.level;
    if (!lv || !w) return;
    opt = opt || {};
    if (SX.ev) {
      SX.ev.ensure();
      SX.ev.worldIn(w.ev, opt);
    }
    if (SX.bdev) {
      SX.bdev.ensure();
      SX.bdev.worldIn(w.bd);
    }
    if (SX.chem) SX.chem.worldIn(w.ch, opt);
    if (SX.week) {
      SX.week.ensure();
      SX.week.worldIn(w.wk);
    }
    if (SX.mis) {
      SX.mis.ensure();
      SX.mis.worldIn(w.mi, opt);
    }
    if (typeof w.hl === "number" && isFinite(w.hl) && Rd.heli && Rd.heli.t0 == null) {
      Rd.heli.t0 = w.hl;
      SX.log("📻 헬기를 이미 불렀습니다 — 헬기 도착까지 버티십시오", "good");
    }
    if (Array.isArray(w.sg) && Rd.storyGone) for (const n of w.sg) if (typeof n === "string") {
      if (Rd.storyGone[n] == null) Rd.storyGone[n] = -1;
      Rd.storyLost(n);
    }
    (w.dul || []).forEach((row, f) => {
      const F = lv.floors[f];
      if (!F) return;
      for (let i = 0; i < row.length && i < F.doors.length; i++) {
        const d = F.doors[i];
        if (row[i] === "1" && d.locked && !d.exit) d.locked = false;
      }
    });
    (w.doors || []).forEach((row, f) => {
      const F = lv.floors[f];
      if (!F) return;
      for (let i = 0; i < row.length && i < F.doors.length; i++) {
        const d = F.doors[i];
        if (!d.locked) d.open = row[i] === "1";
      }
    });
    if (w.trp && SX.traps && SX.traps.loadPlaced) SX.traps.loadPlaced(lv, w.trp);
    if (w.tr && SX.traps) SX.traps.load(lv, w.tr);
    (w.stl || []).forEach((row, f) => {
      const F = lv.floors[f];
      if (!F) return;
      for (let i = 0; i < row.length && i < F.stairs.length; i++) if (row[i] === "0") F.stairs[i].locked = false;
    });
    for (const a of w.en || []) {
      const e = A.enemies[a[0]];
      if (!e) continue;
      if (e.dormant && a[6] !== "dormant") {
        e.dormant = false;
        e.alive = true;
      }
      if (a[5]) {
        if (e.alive) {
          e.x = a[1];
          e.y = a[2];
          e.face = a[3];
          e.hp = a[4];
          e.ai = a[6] || "wander";
          e.tx = null;
        }
      } else if (e.alive) {
        e.alive = false;
        e.dead = true;
        e.deathT = 9;
        e.deathA = a[7];
        e.x = a[1];
        e.y = a[2];
      }
    }
    for (const x of w.extras || []) {
      if (Rd.conts.has(x.key)) continue;
      const F = lv.floors[x.f];
      if (!F) continue;
      const cont = M.mkCont(x.type || "loose", []);
      if (x.name) cont.name = x.name;
      cont.searched = true;
      const pr = M.addProp(F, x.kind || "loot", x.x, x.y, {
        v: x.v | 0,
        solid: false,
        cont
      });
      if (pr) {
        if (x.px != null) {
          pr.px = x.px;
          pr.py = x.py;
          pr.flipX = !!x.flipX;
        }
        if (x.body && x.body[0] === "e") {
          const e = A.enemies[+x.body.slice(1)];
          if (e) pr.body = e;
        } else if (x.body) pr.body = {
          spec: x.spec || SX.art.charSpec("scav", new SX.Rng(7)),
          deathT: 9,
          dead: true,
          type: "scav",
          _t0: x.live ? performance.now() / 1e3 : null
        };
      }
      Rd.reg(cont, x.key);
      Rd.extras.push(x);
    }
    for (const [k, g, se, rv] of w.conts || []) {
      const c = Rd.conts.get(k);
      if (!c) continue;
      const r = gr(g);
      c.grid.cols = r.cols;
      c.grid.rows = r.rows;
      c.grid.list = r.list;
      if (opt.search) {
        c.searched = !!se;
        c.revealed = rv;
      }
      if (c.revealed != null && c.revealed > c.grid.list.length) c.revealed = c.grid.list.length;
    }
    SX.ui && SX.ui.refresh && SX.ui.refresh();
  };
  const SNAP = "sxd_raid", SNAP_TTL = 10 * 6e4;
  Rd.snapSave = function() {
    if (SX.TRIAL) return;
    const G = SX.game, p = A.player;
    if (!Rd.level || !Rd.on || Rd.over || !p || !p.alive || G.state !== "raid") return;
    if (Rd.tutMode) return;
    const al = A.allies.find(a => a.alive);
    const o = {
      v: 1,
      at: Date.now(),
      seed: Rd.seed,
      sun: G.raidSun && G.raidSun.seed === Rd.seed ? G.raidSun.at : null,
      b: Rd.level.building.id,
      tod: Rd.tod,
      intel: Rd.intel || null,
      mode: Rd.fire ? "fire" : Rd.flood ? "flood" : undefined,
      wk: Rd.wkIn || null,
      park: Rd.level.parkIdx,
      t: Rd.t,
      lock: Rd.lockLeft,
      locked: Rd.locked,
      gasY: Rd.gasY,
      gasWarned: Rd.gasWarned,
      flareT: Rd.flareT,
      pings: Rd.pings,
      startValue: Rd.startValue,
      p: {
        x: r2(p.x),
        y: r2(p.y),
        f: p.floor,
        hp: p.hp,
        st: p.st,
        aim: p.aim,
        slot: p.slot,
        torch: p.torch,
        crouch: p.crouch,
        boxOn: p.boxOn,
        hot: p.hot,
        hotT: p.hotT,
        nv: p.nvOn ? 1 : 0,
        dn: p.down ? [ r2(p.down.t), r2(p.down.hp) ] : undefined
      },
      kit: I.kitDump(G.kit),
      kills: G.stats && G.stats.kills || 0,
      ally: al ? {
        id: al.merc.id,
        hp: al.hp,
        x: r2(al.x),
        y: r2(al.y)
      } : null,
      insured: G.insuredList || [],
      startKit: G.raidStartKit || null,
      heli: Rd.heli ? {
        t: Rd.heli.t0 != null ? Rd.t - Rd.heli.t0 : null,
        woke: Rd.heli.woke,
        landed: Rd.heli.landed
      } : null,
      match: SX.coop && SX.coop.matchInfo ? SX.coop.matchInfo() : null,
      ctl: Rd.ctrlDone ? 1 : undefined,
      world: Rd.worldDump()
    };
    try {
      localStorage.setItem(SNAP, JSON.stringify(o));
    } catch (e) {}
    if ((Rd.snapN = (Rd.snapN || 0) + 1) % 5 === 1 && SX.net && SX.net.raidSnap) SX.net.raidSnap(o);
  };
  Rd.snapClear = () => {
    try {
      localStorage.removeItem(SNAP);
    } catch (e) {}
  };
  Rd.snapLoad = function() {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem(SNAP) || "null");
    } catch (e) {}
    if (!o || o.v !== 1) return null;
    if (Date.now() - (o.at || 0) > SNAP_TTL) return {
      stale: true,
      snap: o
    };
    return o;
  };
  addEventListener("pagehide", () => Rd.snapSave());
  addEventListener("beforeunload", () => Rd.snapSave());
  Rd.update = function(dt, ctl) {
    if (SX.vault) SX.vault.unlockTick(dt);
    if (SX.ev) SX.ev.ensure();
    if (SX.bdev) SX.bdev.ensure();
    if (SX.week) SX.week.ensure();
    const DA = Rd.dropAt;
    if (DA && Rd.level && DA.cont.grid.list.length) {
      DA.beepT = (DA.beepT || 0) - dt;
      const pp = SX.actors.player;
      if (DA.beepT <= 0) {
        DA.beepT = 2.2;
        if (pp && pp.floor === Rd.level.roofIdx) SX.audio.play("beacon", {
          x: DA.x,
          y: DA.y,
          range: 26,
          vol: .6
        });
      }
      DA.smokeT -= dt;
      if (DA.smokeT <= 0) {
        DA.smokeT = .12;
        SX.actors.part({
          floor: Rd.level.roofIdx,
          x: DA.x - .3 + (Math.random() - .5) * .3,
          y: DA.y - .4,
          z: 1.2,
          vx: (Math.random() - .5) * .5 + .25,
          vy: -.15,
          vz: 1.3 + Math.random() * .6,
          c: "rgba(230,70,50,0.55)",
          s: 4 + Math.random() * 3,
          t: 2.6,
          life: 2.6,
          smoke: true
        });
      }
    }
    const G = SX.game, lv = Rd.level, p = A.player, F = Rd.floor();
    if (!lv || !p) return;
    Rd.t += dt;
    SX.light.update(dt);
    A.updatePlayer(dt, F, ctl && !Rd.over && !(SX.chem && SX.chem.held(A.player)));
    if (SX.needs) SX.needs.tick(dt, p);
    if (!SX.coop || SX.coop.runEnemies()) A.updateEnemies(dt, lv, G.env);
    if (SX.coop) SX.coop.update(dt);
    Rd.snapT = (Rd.snapT || 0) - dt;
    if (Rd.snapT <= 0) {
      Rd.snapT = 2;
      Rd.snapSave();
    }
    A.updateAllies(dt, lv, G.env);
    if (SX.traps) SX.traps.update(dt, lv);
    if (SX.ev) SX.ev.tick(dt, lv);
    if (SX.bdev) SX.bdev.tick(dt);
    if (SX.week) SX.week.tick(dt, lv);
    if (SX.mis) SX.mis.tick(dt, lv);
    A.updateProjectiles(dt, lv);
    if (!Rd.locked) {
      Rd.lockLeft -= dt;
      if (Rd.lockLeft <= 20 && Rd.lockLeft + dt > 20) SX.log("바깥이 소란스럽습니다 — 누가 문을 닫고 있습니다");
      if (Rd.lockLeft <= 0) lockExits();
    }
    heliTick();
    if (!lv.building.train && !Rd.fire && !Rd.flood) Rd.gasY += Rd.gasRate(lv, Rd.gasY) * dt;
    for (let k = Rd.pings.length - 1; k >= 0; k--) {
      const q = Rd.pings[k];
      if (q.f === p.floor && Math.hypot(q.x - p.x, q.y - p.y) < 1.6) {
        pingOut(0, Rd.pings.splice(k, 1)[0]);
        SX.audio.play("beep", {
          vol: .4
        });
      }
    }
    const gf = Math.max(0, Math.ceil(Rd.gasY / M.FH));
    if (gf > Rd.gasWarned && gf >= 1) {
      Rd.gasWarned = gf;
      SX.log("⚠ 가스가 " + Math.min(gf, lv.building.floors) + "층 높이까지 차올랐습니다", "warn");
      SX.audio.play("gas");
    }
    const pBase = p.floor * M.FH;
    Rd.gasHere = SX.clamp((Rd.gasY - pBase) / 1.6, 0, 1);
    if (p.alive && F.kind !== "roof" && Rd.gasY > pBase + 1.6 && !G.god) {
      if (SX.recap) SX.recap.tick("gas", 5.2 * (lv.building.gasDmg != null ? lv.building.gasDmg : 1) * dt);
      A.rawHurt(5.2 * (lv.building.gasDmg != null ? lv.building.gasDmg : 1) * dt, "가스에 질식했습니다");
      p.hurtT = Math.max(p.hurtT, .15);
      SX.ui.hudDirty();
    }
    if (Rd.fire) fireTick(dt, lv, F, p, G); else if (Rd.flood) {
      floodTick(dt, lv, F, p, G);
      if (Rd.over) return;
    }
    if (SX.chem) SX.chem.tick(dt, lv, F, p, G);
    SX.wx.tick(dt, F, p);
    if (Rd.flareT > 0) {
      Rd.flareT -= dt;
      if (Math.random() < dt * 20) A.smoke(F, p.x, p.y, 1);
      if (Rd.flareT <= 0 && p.alive) {
        if (SX.coop && SX.coop.flareDone) SX.coop.flareDone(p);
        Rd.end(true, "flare");
        return;
      }
    }
    if (Rd.mateFlareGo) {
      Rd.mateFlareGo = false;
      if (p.alive && !Rd.over) {
        Rd.end(true, "flare");
        return;
      }
    }
    if (p.alive && !p.down && !Rd.over) {
      const z = F.zones.find(z => !z.locked && p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h);
      if (z) {
        if (!Rd.ext || Rd.ext.zone !== z) {
          const h = (HOLD[z.kind] || 3) * SX.wx.holdMul(z.kind);
          Rd.ext = {
            zone: z,
            t: h,
            dur: h
          };
          SX.audio.play("beep", {
            hi: true
          });
        }
        const before = Math.ceil(Rd.ext.t);
        Rd.ext.t -= dt;
        if (Math.ceil(Rd.ext.t) !== before && Rd.ext.t > 0) SX.audio.play("beep");
        if (Rd.ext.t <= 0) {
          Rd.end(true, z.kind === "door" ? "door" : z.kind);
          return;
        }
      } else Rd.ext = null;
    }
    if (p.alive && !p.down && !Rd.over && Rd.locked && !Rd.fire && !Rd.flood && outsideNow(p)) {
      SX.log("밖에 나와 있었습니다 — 그대로 빠져나갔습니다", "good");
      Rd.end(true, "door");
      return;
    }
    if (!p.alive) {
      Rd.deadT += dt;
      const Cp = SX.coop;
      if (Cp && Cp.spec) {
        if (!Rd.over && !Cp.mates().length) Rd.end(false, G.deathWhy || "쓰러졌습니다");
      } else if (Rd.deadT > 2.2 && !Rd.over && !(Cp && Cp.startSpec && Cp.startSpec())) Rd.end(false, G.deathWhy || "쓰러졌습니다");
    }
    SX.audio.listener.x = p.x;
    SX.audio.listener.y = p.y;
    SX.audio.parkVerb = lv.parkIdx != null && p.floor === lv.parkIdx;
    const inside = !!F.inside[F.i(Math.floor(p.x), Math.floor(p.y))];
    const hpk = p.alive ? p.hp / (A.hpMax ? A.hpMax(p) : 100) : 1;
    SX.audio.ambient({
      rain: G.env.rain,
      inside,
      wind: (F.kind === "roof" ? 1 : inside ? .25 : .5) * (G.env.storm ? 1.8 : 1),
      hum: inside ? .4 : 0,
      night: inside ? 0 : 1,
      city: inside ? .15 : .6,
      storm: G.env.storm ? 1 : 0,
      heli: Rd.heliSound ? Rd.heliSound() : 0,
      fire: Math.max(Rd.fire ? Rd.fireNear || 0 : SX.ev && SX.ev.fireAmb ? SX.ev.fireAmb(p) : 0, SX.chem ? SX.chem.near || 0 : 0),
      flood: Rd.flood ? Rd.floodAmb(F, p) : 0,
      alarm: Rd.fire ? F.park ? .35 : F.kind === "roof" ? .25 : 1 : 0,
      heart: hpk < .35 ? Math.min(1, (.35 - hpk) / .2 + .3) : 0
    });
    if (!inside && Math.random() < dt / 45) SX.audio.play("dogBark", {
      x: p.x + (Math.random() - .5) * 70,
      y: p.y + (Math.random() - .5) * 70,
      range: 60,
      vol: .3,
      amb: 1
    });
    SX.audio.music(true, A.enemies.some(e => e.alive && e.floor === p.floor && e.ai === "chase"));
  };
  function outsideNow(p) {
    const lv = Rd.level;
    if (!lv || !p || p.floor !== 0 || lv.outdoor) return false;
    const F0 = lv.floors[0], tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (!F0.in(tx, ty) || !F0.inside[F0.i(tx, ty)]) return true;
    const d = F0.doorAt.get(F0.i(tx, ty));
    return !!(d && d.exit);
  }
  function inDoorZone(p) {
    const F0 = Rd.level.floors[0];
    if (!p || p.floor !== 0) return false;
    return F0.zones.some(z => z.kind === "door" && p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h);
  }
  function lockExits() {
    const pp = A.player;
    if (pp && pp.alive && !Rd.over && (inDoorZone(pp) || outsideNow(pp))) {
      Rd.locked = true;
      SX.log("⛓ 문이 잠기기 직전 — 이미 나와 있었습니다", "good");
      Rd.end(true, "door");
      return;
    }
    Rd.locked = true;
    const F0 = Rd.level.floors[0];
    for (const d of F0.doors) if (d.exit) {
      d.open = false;
      d.locked = true;
    }
    for (const z of F0.zones) if (z.kind === "door") z.locked = true;
    SX.log(Rd.level.outdoor === "site" ? "⛓ 정문이 잠겼습니다 — 이제 나가는 길은 북쪽 뒷문뿐입니다" : Rd.level.outdoor === "tunnel" ? "⛓ 남쪽 역 셔터가 내려왔습니다 — 이제 나가는 길은 북쪽 비상 사다리뿐입니다" : Rd.level.outdoor ? "⛓ 남단이 봉쇄됐습니다 — 이제 나가는 길은 북단 검문소뿐입니다" : "⛓ 밖에서 문이 잠겼습니다 — 이제 나가는 길은 옥상뿐입니다", "bad");
    SX.audio.play("gas");
    const p = A.player;
    if (p.floor === 0 && !A.free(F0, p.x, p.y)) {
      const lv = Rd.level;
      p.x = SX.clamp(p.x, lv.X0 + 1.5, lv.X1 - .5);
      p.y = SX.clamp(p.y, lv.Y0 + 1.5, lv.Y1 - .8);
    }
  }
  function propRect(pr) {
    return pr.px != null ? {
      x0: pr.px,
      y0: pr.py,
      x1: pr.px + 1,
      y1: pr.py + 1
    } : {
      x0: pr.x,
      y0: pr.y,
      x1: pr.x + pr.w,
      y1: pr.y + pr.h
    };
  }
  function nearPoint(pr, x, y) {
    const r = propRect(pr), qx = SX.clamp(x, r.x0, r.x1), qy = SX.clamp(y, r.y0, r.y1), d = Math.hypot(x - qx, y - qy) || 1;
    return {
      x: qx + (x - qx) / d * .06,
      y: qy + (y - qy) / d * .06
    };
  }
  Rd.pickable = function(F, pr) {
    const p = A.player;
    if (!p) return true;
    const sv = [ p.x, p.y, p.aim ];
    let ok = false;
    const cx = pr.x + .5, cy = pr.y + .5;
    for (const [dx, dy] of [ [ 0, 0 ], [ .5, 0 ], [ -.5, 0 ], [ 0, .5 ], [ 0, -.5 ], [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ], [ 1, 1 ], [ -1, -1 ], [ 1, -1 ], [ -1, 1 ] ]) {
      if (ok) break;
      const x = cx + dx, y = cy + dy;
      if (!A.free(F, x, y, .3)) continue;
      p.x = x;
      p.y = y;
      for (let a = 0; a < 16; a++) {
        p.aim = a * Math.PI / 8;
        const t = Rd.target(true);
        if (t && t.kind === "cont" && t.prop === pr) {
          ok = true;
          break;
        }
      }
    }
    p.x = sv[0];
    p.y = sv[1];
    p.aim = sv[2];
    return ok;
  };
  Rd.dropSpot = function(F, p, tx, ty) {
    const T = SX.map.T, cand = [];
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const x = tx + dx, y = ty + dy, t = F.tile(x, y);
      if (t !== T.FLOOR && t !== T.GROUND) continue;
      if (!A.free(F, x + .5, y + .5, .3)) continue;
      if ((dx || dy) && !SX.light.los(F, p.x, p.y - .05, x + .5, y + .5)) continue;
      cand.push([ x, y, Math.hypot(x + .5 - p.x, y + .5 - p.y) ]);
    }
    cand.sort((a, b) => a[2] - b[2]);
    const clean = (x, y) => !F.props.some(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
    const probe = {
      kind: "loot",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      solid: false,
      floor: F.idx,
      cont: {
        grid: {
          list: [ 1 ]
        },
        searched: true,
        name: ""
      }
    };
    F.props.push(probe);
    let best = null;
    try {
      for (const pass of [ true, false ]) {
        for (const [x, y] of cand) {
          if (pass && !clean(x, y)) continue;
          probe.x = x;
          probe.y = y;
          if (Rd.pickable(F, probe)) {
            best = [ x, y ];
            break;
          }
        }
        if (best) break;
      }
    } finally {
      const k = F.props.indexOf(probe);
      if (k >= 0) F.props.splice(k, 1);
    }
    return best || [ tx, ty ];
  };
  Rd.reach = function(F, p, pr) {
    const q = nearPoint(pr, p.x, p.y - .05);
    return SX.light.los(F, p.x, p.y - .05, q.x, q.y);
  };
  Rd.nearConts = function(r) {
    const p = A.player, F = Rd.floor();
    if (!p || !p.alive || p.down || !F) return [];
    r = r || 2.2;
    const out = [];
    for (const pr of F.props) {
      if (!pr.cont || pr.solid) continue;
      if (pr.cont.searched && !pr.cont.grid.list.length) continue;
      const q = nearPoint(pr, p.x, p.y), d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d > r || !Rd.reach(F, p, pr)) continue;
      out.push({
        cont: pr.cont,
        prop: pr,
        d
      });
    }
    out.sort((a, b) => a.d - b.d);
    return out;
  };
  Rd.target = function(raw) {
    const p = A.player, F = Rd.floor();
    if (!p || !p.alive || p.down || !F) return null;
    {
      const rt = SX.coop && SX.coop.reviveTarget ? SX.coop.reviveTarget(F, p) : null;
      if (rt) return rt;
    }
    const PK = SX.pick, K = raw ? null : PK, C = K ? [] : null, add = (t, bf, flat) => {
      if (C) C.push({
        t,
        b: bf(),
        flat: !!flat
      });
      return t;
    };
    let pri = null;
    for (const s of F.stairs) {
      if (p.x >= s.x - .2 && p.x <= s.x + s.w + .2 && p.y >= s.y - .2 && p.y <= s.y + s.h + .4) {
        const toName = Rd.fname(s.to);
        if (s.locked) pri = {
          kind: "stairlock",
          s,
          x: s.x + s.w / 2,
          y: s.y + 1,
          label: I.findInKit(SX.game.kit, Rd.STAIR_KEY) ? "🔑 열쇠로 열기 → " + toName : "🔒 잠겼습니다 — 비상계단 열쇠가 있어야 합니다"
        }; else pri = {
          kind: "stair",
          s,
          x: s.x + s.w / 2,
          y: s.y + 1,
          label: (s.dir === "up" ? "올라가기 → " : "내려가기 → ") + toName
        };
        add(pri, () => [ [ s.x, s.y, s.x + s.w, s.y + s.h ] ], true);
        break;
      }
    }
    if (pri && !C) return pri;
    {
      const tt = SX.traps && SX.traps.target(F, p, C);
      if (tt && !pri) pri = tt;
    }
    if (pri && !C) return pri;
    const H = Rd.heli;
    if (H && H.t0 == null && p.floor === H.f) {
      const cx = H.pad.x + H.pad.w / 2, cy = H.pad.y + H.pad.h / 2;
      if (Math.hypot(p.x - cx, p.y - cy) < 4) {
        const o = add({
          kind: "heli",
          x: cx,
          y: cy - 1,
          label: "📻 무전으로 헬기 부르기 — " + HELI_WAIT + "초 버티십시오"
        }, () => [ [ H.pad.x, H.pad.y, H.pad.x + H.pad.w, H.pad.y + H.pad.h ] ], true);
        if (!pri) pri = o;
      }
    }
    if (pri && !C) return pri;
    {
      const en = Rd.eggNear(F, p);
      if (en) {
        const o = add({
          kind: "egg",
          x: en.x,
          y: en.y,
          label: "🔍 " + Rd.egg.def.look
        }, () => [ PK.propBox(Rd.egg.prop) ]);
        if (!pri) pri = o;
      }
    }
    if (pri && !C) return pri;
    let ctrlO = null;
    {
      const cp = F.ctrl && F.ctrl.prop;
      if (cp && !F.ctrl.door.locked) {
        const q = nearPoint(cp, p.x, p.y);
        if (Math.hypot(q.x - p.x, q.y - p.y) < 1.6 && Rd.reach(F, p, cp)) {
          const o = add({
            kind: "ctrl",
            prop: cp,
            x: cp.x + cp.w / 2,
            y: cp.y - .2,
            label: Rd.ctrlDone ? "🖥 관제 화면 — 터미널 모든 층 구조가 이미 지도에 있습니다" : "🖥 관제 화면 켜기 — 터미널 모든 층 구조를 지도에"
          }, () => [ PK.propBox(cp) ]);
          if (Rd.ctrlDone) ctrlO = o; else if (!pri) pri = o;
        }
      }
    }
    if (pri && !C) return pri;
    {
      const sn = Rd.storyNear(F, p);
      if (sn) {
        const o = add({
          kind: "story",
          e: sn.e,
          x: sn.s.x,
          y: sn.s.y - .7,
          label: "★ " + sn.e.item + " 줍기"
        }, () => [ [ sn.s.x - .5, sn.s.y - .7, sn.s.x + .5, sn.s.y + .35 ] ], true);
        if (!pri) pri = o;
      }
    }
    if (pri && !C) return pri;
    {
      const et = SX.ev && SX.ev.target ? SX.ev.target(F, p, add, PK) : null;
      if (et && !pri) pri = et;
    }
    {
      const wt = SX.week && SX.week.target ? SX.week.target(F, p, add) : null;
      if (wt && !pri) pri = wt;
    }
    {
      const mt = SX.mis && SX.mis.target ? SX.mis.target(F, p, add) : null;
      if (mt && !pri) pri = mt;
    }
    if (pri && !C) return pri;
    {
      const bt = SX.bdev && SX.bdev.target ? SX.bdev.target(F, p, add, PK) : null;
      if (bt && !pri) pri = bt;
    }
    if (pri && !C) return pri;
    let best = null, bd = 1.6;
    const ax = p.x + Math.cos(p.aim) * .35, ay = p.y - .2 + Math.sin(p.aim) * .35;
    for (const pr of F.props) {
      if (!pr.cont) continue;
      if (pr.kind === "loot" && pr.cont.searched && !pr.cont.grid.list.length) continue;
      const cx = (pr.px != null ? pr.px : pr.x) + (pr.px != null ? .5 : pr.w / 2), cy = (pr.py != null ? pr.py : pr.y) + (pr.py != null ? .5 : pr.h / 2);
      const hw = pr.px != null ? .5 : pr.w / 2, hh = pr.py != null ? .5 : pr.h / 2;
      const dx = Math.max(Math.abs(ax - cx) - hw, 0), dy = Math.max(Math.abs(ay - cy) - hh, 0);
      const d = Math.hypot(dx, dy), d0 = C ? Math.hypot(Math.max(Math.abs(p.x - cx) - hw, 0), Math.max(Math.abs(p.y - .2 - cy) - hh, 0)) : 9;
      if ((d < bd || d0 < 1.95) && Rd.reach(F, p, pr)) {
        const o = {
          kind: "cont",
          prop: pr,
          x: cx,
          y: (pr.py != null ? pr.py : pr.y) - .2,
          label: pr.cont.name + (pr.cont.searched ? "" : " 뒤지기")
        };
        if (d0 < 1.95) add(o, () => [ PK.propBox(pr) ], pr.kind === "loot" || pr.kind === "corpse" || !!pr.flat);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
    }
    let bD = null, dD = 1e9, slD = .1;
    for (const d of F.doors) {
      if (d.evShut) continue;
      const dr = PK ? PK.doorDist(F, p, d) : Math.hypot(ax - d.cx, ay - d.cy) < 1.7 ? 0 : Infinity;
      if (dr === Infinity) continue;
      const dd = Math.hypot(ax - d.cx, ay - d.cy);
      let o, sl = .1;
      if (d.key && d.locked) {
        const k = SX.vault && SX.vault.keyIn(SX.game.kit, d.key);
        sl = .2;
        o = {
          kind: "keydoor",
          door: d,
          x: d.cx,
          y: d.cy - 1,
          label: k ? "🔑 " + d.vault + " 열기 — " + d.key + (d.keep ? " (닳지 않음)" : " (남은 " + SX.vault.usesOf(k.it) + "번)") : "🔒 " + d.vault + " — 「" + d.key + "」이(가) 있어야 열립니다"
        };
      } else if (d.exit && d.locked) {
        sl = .2;
        o = {
          kind: "locked",
          door: d,
          x: d.cx,
          y: d.cy - 1,
          label: d.wkShut && SX.week ? SX.week.DOOR : d.fireShut ? "불길에 막혔습니다 — 지하 주차장으로" : d.floodShut ? "물에 막혀 안 열립니다" : "잠겼습니다(밖에서 체인)"
        };
      } else o = {
        kind: "door",
        door: d,
        x: d.cx,
        y: d.cy - 1,
        label: d.open ? "문 닫기" : "문 열기"
      };
      add(o, () => [ PK.doorBox(d) ]);
      if (dd < dD) {
        dD = dd;
        bD = o;
        slD = sl;
      }
    }
    if (bD && (!best || dD < bd + slD)) best = bD;
    if (!best && ctrlO) best = ctrlO;
    return K ? K.choose(pri || best, C, p, !!pri) : pri || best;
  };
  Rd.interact = function(t) {
    const F = Rd.floor(), p = A.player;
    if (SX.vault && SX.vault.job) {
      SX.vault.cancelUnlock();
      return;
    }
    if (SX.ev && SX.ev.cancelJob && SX.ev.cancelJob()) return;
    if (SX.bdev && SX.bdev.cancelJob && SX.bdev.cancelJob()) return;
    if (SX.week && SX.week.cancelJob && SX.week.cancelJob()) return;
    if (SX.mis && SX.mis.cancelJob && SX.mis.cancelJob()) return;
    if (!t) return;
    if (t.kind === "ev") {
      SX.ev.interact(t);
      return;
    }
    if (t.kind === "bd") {
      SX.bdev.interact(t);
      return;
    }
    if (t.kind === "wk") {
      SX.week.interact(t);
      return;
    }
    if (t.kind === "mi") {
      SX.mis.interact(t);
      return;
    }
    if (t.kind === "revive") {
      SX.coop.reviveStart(t.g);
      return;
    }
    if (t.kind === "stair") return changeFloor(t.s);
    if (t.kind === "story") {
      if (Rd.storyTake(t.e)) A.noise(F, p.x, p.y, 2, true);
      return;
    }
    if (t.kind === "egg") {
      Rd.eggTake();
      return;
    }
    if (t.kind === "trap") return SX.traps.disarm(F, t.trap);
    if (t.kind === "heli") return Rd.callHeli(false);
    if (t.kind === "stairlock") {
      const G = SX.game, k = I.findInKit(G.kit, Rd.STAIR_KEY);
      if (!k) {
        SX.audio.play("locked");
        SX.log("🔒 잠겼습니다 — 이 층 책상·사물함·서랍장에서 비상계단 열쇠를 찾아보십시오");
        return;
      }
      I.kitTake(G.kit, k.it);
      Rd.unlockStair(F, t.s);
      SX.audio.play("gateUnlock", {
        vol: .9
      });
      A.noise(F, p.x, p.y, 4, true);
      SX.log("🔓 비상계단 열쇠로 계단을 열었습니다", "good");
      SX.ui.refresh && SX.ui.refresh();
      SX.ui.hudDirty && SX.ui.hudDirty();
      return;
    }
    if (t.kind === "door") {
      if (SX.map.toggleDoor(F, t.door)) {
        SX.audio.play(t.door.open ? "doorOpen" : "doorClose", {
          vol: .8,
          mat: SX.doorPlace && SX.doorPlace.mat(F, t.door)
        });
        A.noise(F, p.x, p.y, 5, true);
      } else SX.audio.play(t.door.locked ? "doorLocked" : "denied");
      return;
    }
    if (t.kind === "locked") {
      SX.audio.play("locked");
      SX.log(t.door && t.door.wkShut && SX.week ? "⛔ " + SX.week.DOOR : "⛓ 밖에서 잠겼습니다 — 옥상으로");
      return;
    }
    if (t.kind === "keydoor") {
      if (SX.vault) SX.vault.startUnlock(F, t.door);
      return;
    }
    if (t.kind === "ctrl") {
      if (Rd.ctrlDone) SX.log("🖥 터미널 모든 층 구조가 이미 지도에 있습니다 — [" + SX.label("terminal") + "] 단말기 지도"); else if (SX.vault) SX.vault.startCtrl(F, t.prop);
      return;
    }
    if (t.kind === "cont") {
      if (SX.week && SX.week.opened) SX.week.opened(t.prop.cont);
      SX.ui.openLoot(t.prop.cont);
      A.noise(F, p.x, p.y, 3, true);
    }
  };
  Rd.ctrlOn = function(quiet, remote) {
    const lv = Rd.level;
    if (!lv || !SX.minimap || !SX.minimap.revealAll) return;
    if (remote && Rd.ctrlDone) return;
    Rd.ctrlDone = true;
    SX.minimap.revealAll(lv);
    if (!quiet && !remote && SX.coop && SX.coop.ctl) SX.coop.ctl();
    if (quiet) return;
    if (remote) {
      SX.audio.play("beepHi", {
        vol: .6
      });
      SX.log("🖥 동료가 관제 화면을 켰습니다 — 터미널 모든 층 구조가 지도에 떴습니다", "good");
      if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
      if (Rd.snapSave) Rd.snapSave();
      return;
    }
    SX.audio.play("beepHi", {
      vol: .8
    });
    SX.log("🖥 관제 화면 — 터미널 모든 층 구조가 지도에 떴습니다([" + SX.label("terminal") + "] 단말기 지도)", "good");
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    if (Rd.snapSave) Rd.snapSave();
  };
  Rd.unlockStair = function(F, s, remote) {
    if (!s || !s.locked) return;
    s.locked = false;
    if (!remote && SX.coop && SX.coop.stair) SX.coop.stair(F, s);
  };
  function changeFloor(s) {
    if (s.locked) return;
    const lv = Rd.level, p = A.player;
    const F2 = lv.floors[s.to];
    if (!F2) return;
    const s2 = F2.stairs.find(q => q.key === s.key && q.dir !== s.dir);
    if (!s2) return;
    SX.audio.play((s.dir ? s.dir === "up" : s.to > p.floor) ? "stairsUp" : "stairsDown", {
      vol: .8,
      verb: true
    });
    if (SX.pose && SX.pose.stairBegin) SX.pose.stairBegin(p, 2, (s.dir ? s.dir === "up" : s.to > p.floor) ? 1 : -1, 0, .25);
    SX.view.fade(() => {
      p.floor = s.to;
      p.stairFx = null;
      p.x = s2.x + s2.w / 2;
      p.y = s2.y + s2.h + .8;
      p.reload = null;
      SX.light.box = null;
      SX.view.snap();
      const name = F2.park ? "지하 1층" : F2.kind === "roof" ? "옥상" : s.to + 1 + "층";
      SX.log("▶ " + name + (F2.kind === "roof" && !Rd.fire ? " — 난간 어딘가에 집라인이 있습니다" : ""));
      if (F2.kind === "roof" && Rd.boss && Rd.boss.boss.alive) SX.log(Rd.level.building.final ? "☠ 약탈자 두목 무리가 옥상을 돕니다 — 헬기를 부르기 전에 몰래 지나치거나 쓰러뜨리십시오" : "☠ 약탈자 두목 무리가 집라인 둘레를 돕니다 — 몰래 지나치거나 쓰러뜨리십시오", "warn");
    });
  }
  Rd.flare = function(it) {
    if (Rd.flood && A.player && Rd.wLvOf(A.player.floor) >= 4) {
      SX.log("⛔ " + FLOOD_WET + " — 여기선 신호탄을 못 씁니다", "warn");
      return false;
    }
    if (Rd.flareT > 0) {
      SX.log("이미 신호탄을 터뜨렸습니다");
      return false;
    }
    Rd.flareT = FLARE_T;
    SX.audio.play("flare");
    SX.log("🎆 신호탄 — " + FLARE_T + "초 뒤 구조됩니다. 버티십시오!", "good");
    const p = A.player;
    SX.light.flash(p.floor, p.x, p.y, 10, [ 255, 80, 60 ], FLARE_T, .9);
    A.noise(Rd.floor(), p.x, p.y, 40);
    if (SX.coop && SX.coop.flare) SX.coop.flare(p);
    return true;
  };
  const FLARE_R = 10;
  Rd.FLARE_R = FLARE_R;
  Rd.mateFlareIn = function(nm, f, x, y, done) {
    const p = A.player, lv = Rd.level;
    if (!Rd.on || Rd.over || !p || !lv || !lv.floors[f] || !isFinite(x) || !isFinite(y)) return;
    if (!done) {
      Rd.mateFlare = {
        f,
        x,
        y,
        t: Rd.t
      };
      if (p.floor === f) {
        SX.light.flash(f, x, y, FLARE_R, [ 255, 80, 60 ], FLARE_T, .9);
        SX.audio.play("flare", {
          x,
          y,
          vol: .7
        });
      }
      SX.log("🎆 " + nm + " 이(가) 신호탄을 쐈습니다 — " + FLARE_T + "초 안에 " + FLARE_R + "칸 안으로 오면 같이 구조됩니다", "good");
      return;
    }
    Rd.mateFlare = null;
    if (p.alive && p.floor === f && Math.hypot(p.x - x, p.y - y) <= FLARE_R) {
      Rd.mateFlareGo = true;
      SX.log("🎆 " + nm + " 의 신호탄 — 같이 구조됩니다", "good");
    } else if (p.alive) SX.log("🎆 " + nm + " 이(가) 신호탄으로 구조됐습니다 — 멀리 있어 같이 못 나갔습니다", "warn");
  };
  function pingOut(a, q) {
    if (q && q.id != null && SX.coop && SX.coop.ping) SX.coop.ping(a, q);
  }
  Rd.ping = function(f, x, y) {
    const k = Rd.pings.findIndex(q => q.f === f && Math.hypot(q.x - x, q.y - y) < 2.5);
    if (k >= 0) {
      pingOut(0, Rd.pings.splice(k, 1)[0]);
      SX.audio.play("click");
      return;
    }
    const me = SX.coop && SX.coop.pingMe ? SX.coop.pingMe() : null, mine = z => (z.by == null ? null : z.by) === me;
    const q = {
      f,
      x,
      y,
      t: Rd.t,
      id: (me != null ? me : "s") + "." + (Math.random() * 1e9 | 0),
      by: me
    };
    Rd.pings.push(q);
    pingOut(1, q);
    {
      const own = Rd.pings.filter(mine);
      if (own.length > 3) pingOut(0, Rd.pings.splice(Rd.pings.indexOf(own[0]), 1)[0]);
    }
    SX.audio.play("beep", {
      hi: true,
      vol: .6
    });
  };
  Rd.unping = function(f, x, y) {
    let bi = -1, bd = 6;
    Rd.pings.forEach((q, k) => {
      const d = q.f === f ? Math.hypot(q.x - x, q.y - y) : 99;
      if (d < bd) {
        bd = d;
        bi = k;
      }
    });
    if (bi >= 0) {
      pingOut(0, Rd.pings.splice(bi, 1)[0]);
      SX.audio.play("click");
    }
  };
  Rd.marks = function() {
    const out = [], lv = Rd.level;
    if (!lv) return out;
    for (const q of Rd.pings) out.push({
      f: q.f,
      x: q.x,
      y: q.y,
      col: "rgb(255,138,91)",
      label: "핑",
      big: true
    });
    if (Rd.mateFlare && Rd.t - Rd.mateFlare.t < FLARE_T + 1) out.push({
      f: Rd.mateFlare.f,
      x: Rd.mateFlare.x,
      y: Rd.mateFlare.y,
      col: "rgb(255,80,60)",
      label: "신호탄",
      big: true
    });
    if (Rd.dropAt && Rd.dropAt.cont.grid.list.length) out.push({
      f: lv.roofIdx,
      x: Rd.dropAt.x,
      y: Rd.dropAt.y,
      col: "rgb(232,192,64)",
      label: "보급 상자"
    });
    if (SX.ev && SX.ev.marks) SX.ev.marks(out);
    if (SX.bdev && SX.bdev.marks) SX.bdev.marks(out);
    if (SX.week && SX.week.marks) SX.week.marks(out);
    if (SX.mis && SX.mis.marks) SX.mis.marks(out);
    const hUp = Rd.heli && (Rd.heli.landed || Rd.heliLeft() != null && Rd.heliLeft() < 6) ? 3.4 : 0;
    if (Rd.heli) out.push({
      f: Rd.heli.f,
      x: Rd.heli.pad.x + Rd.heli.pad.w / 2,
      y: Rd.heli.pad.y + Rd.heli.pad.h / 2 - hUp,
      col: SX.cbc("mate", "rgb(120,200,255)", "rgb"),
      label: "헬기장",
      big: !Rd.heli.t0
    });
    const HW = Rd.heli && Rd.heli.warn;
    if (HW && Rd.t - HW.t < 5) out.push({
      f: Rd.heli.f,
      x: HW.x,
      y: HW.y,
      col: SX.cbc("bad", "rgb(240,90,70)", "rgb"),
      label: "약탈자"
    });
    const p = A.player;
    if (!p) return out;
    if (SX.coop) for (const m of SX.coop.marks(p.floor)) out.push(m);
    if (SX.course && SX.course.on) for (const m of SX.course.marks()) out.push(m);
    const zs = lv.floors[p.floor].zones.filter(z => !z.locked).map(z => ({
      z,
      d: Math.hypot(z.x + z.w / 2 - p.x, z.y + z.h / 2 - p.y)
    })).sort((a, b) => a.d - b.d);
    const ok = SX.cbc("ok", "rgb(110,240,130)", "rgb");
    const big = !!(SX.onboard && SX.onboard.hl());
    zs.forEach((q, k) => {
      if (q.z.kind === "heli" && Rd.heli) return;
      if (k === 0 || q.d < 30) out.push({
        f: p.floor,
        x: q.z.x + q.z.w / 2,
        y: q.z.y + q.z.h / 2,
        col: ok,
        label: q.z.label || "탈출",
        big
      });
    });
    return out;
  };
  Rd.hudState = function() {
    const p = A.player, Cp = SX.coop;
    if (p && p.down) {
      const d = p.down, nm = d.rvBy != null ? Cp.raid && Cp.raid.names.get(d.rvBy) || Cp.nameOf(d.rvBy) : null;
      return nm != null ? {
        text: nm + " 이(가) 일으키는 중 … " + Math.round(d.rv * 100) + "%",
        col: null
      } : {
        text: "쓰러졌습니다 — 동료가 일으켜 주기를 기다리십시오 · " + Math.ceil(d.t),
        col: null,
        bad: true
      };
    }
    if (Cp && Cp.job) return {
      text: Cp.job.g.name + " 일으키는 중 … " + Math.max(0, Cp.REVIVE_T - Cp.job.t).toFixed(1),
      col: null
    };
    {
      const jh = SX.ev && SX.ev.hud ? SX.ev.hud() : null;
      if (jh) return jh;
    }
    {
      const bh = SX.bdev && SX.bdev.hud ? SX.bdev.hud() : null;
      if (bh) return bh;
    }
    {
      const wh = SX.week && SX.week.hud ? SX.week.hud() : null;
      if (wh) return wh;
    }
    {
      const mh = SX.mis && SX.mis.hud ? SX.mis.hud() : null;
      if (mh) return mh;
    }
    if (Rd.flareT > 0) return {
      text: "구조까지 " + Rd.flareT.toFixed(2),
      col: p ? {
        x: p.x,
        y: p.y
      } : null
    };
    const hl = Rd.heliLeft();
    if (hl != null && !Rd.ext) return {
      text: "헬기 도착까지 " + hl.toFixed(1),
      col: null
    };
    if (Rd.ext) {
      const z = Rd.ext.zone;
      return {
        text: null,
        col: z.kind === "zip" ? Rd.floor().zip : z.kind === "escape" ? Rd.floor().escape : {
          x: z.x + z.w / 2,
          y: z.y + z.h / 2
        }
      };
    }
    {
      const h2 = SX.ev && SX.ev.hud2 ? SX.ev.hud2() : null;
      if (h2) return h2;
    }
    {
      const b2 = SX.bdev && SX.bdev.hud2 ? SX.bdev.hud2() : null;
      if (b2) return b2;
    }
    {
      const m2 = SX.mis && SX.mis.hud2 ? SX.mis.hud2() : null;
      if (m2) return m2;
    }
    return null;
  };
  Rd.end = function(win, how) {
    if (Rd.over) return;
    if (SX.audio.underwater) SX.audio.underwater(false);
    Rd.over = true;
    if (SX.ev && SX.ev.onEnd) SX.ev.onEnd(win, how);
    if (SX.bdev && SX.bdev.onEnd) SX.bdev.onEnd(win, how);
    if (SX.mis && SX.mis.onEnd) SX.mis.onEnd(win, how);
    if (SX.coop) SX.coop.leaveRaid();
    Rd.snapClear();
    const G = SX.game;
    {
      const p = A.player;
      if (p && p.down) {
        p.down = null;
        if (win) p.hp = Math.max(p.hp, SX.coop ? SX.coop.REVIVE_HP : 30);
      }
    }
    SX.audio.music(false);
    if (win) {
      SX.audio.play(how === "zip" ? "zip" : "extract");
    } else SX.audio.play("death");
    const lv = Rd.level;
    SX.view.fade(() => {
      Rd.on = false;
      G.finishRaid(win, how, lv);
    }, .6);
  };
})(window.SX);
