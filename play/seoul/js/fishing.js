"use strict";

(function(SX) {
  const Fi = SX.fishing = {
    on: null,
    anglers: [],
    hinted: false
  };
  const A = SX.actors, I = SX.items, H = SX.hub, TS = SX.TS;
  const ROD = SX.ROD.name, BAIT = SX.BAIT.name;
  const rnd = () => (Fi.rng || Math.random)();
  const grids = () => I.kitGrids(SX.game.kit);
  Fi.CREEL = [ 10, 5 ];
  Fi.isFish = it => {
    const d = it && I.def(it.name);
    return !!(d && d.fish);
  };
  Fi.isBait = it => !!it && it.name === BAIT;
  const baitMark = g => {
    g.cols = 1;
    g.rows = 1;
    g.creel = true;
    g.creelBait = true;
    g.accept = Fi.isBait;
    g.acceptMsg = "미끼 칸엔 지렁이만 넣습니다";
    return g;
  };
  const creelMark = g => {
    g.creel = true;
    g.accept = Fi.isFish;
    g.acceptMsg = "조과통엔 물고기만 넣습니다";
    g.bait = baitMark(g.bait && Array.isArray(g.bait.list) ? g.bait : I.grid(1, 1));
    return g;
  };
  const baitFix = g => {
    for (const e of g.list.slice()) if (Fi.isBait(e.it)) {
      const s = g.bait.list[0] && g.bait.list[0].it;
      if (s ? I.stackTop([ g.bait ], e.it) : I.put(g.bait, e.it, 0, 0)) g.list.splice(g.list.indexOf(e), 1);
    }
    return g;
  };
  Fi.creelNew = () => creelMark(I.grid(Fi.CREEL[0], Fi.CREEL[1]));
  const grow = g => {
    if ((g.cols | 0) < Fi.CREEL[0]) g.cols = Fi.CREEL[0];
    if ((g.rows | 0) < Fi.CREEL[1]) g.rows = Fi.CREEL[1];
    return g;
  };
  Fi.creelFrom = o => {
    if (!o || typeof o !== "object" || !Array.isArray(o.list)) return Fi.creelNew();
    const g = I.gridFrom(o);
    if (o.bait && Array.isArray(o.bait.list)) g.bait = I.gridFrom(o.bait);
    return baitFix(grow(creelMark(g)));
  };
  Fi.creelOf = save => {
    save = save || SX.game.save;
    if (!save.creel || !Array.isArray(save.creel.list)) save.creel = Fi.creelNew(); else {
      if (!save.creel.creel || !save.creel.bait) creelMark(save.creel);
      grow(save.creel);
    }
    return save.creel;
  };
  Fi.creelDump = save => {
    const g = Fi.creelOf(save), o = I.gridDump(g);
    o.bait = I.gridDump(g.bait);
    return o;
  };
  const findIn = name => {
    for (const g of grids()) for (const e of g.list) if (e.it.name === name) return {
      it: e.it,
      g,
      e
    };
    return null;
  };
  const baitGrids = () => {
    const cg = Fi.creelOf(SX.game.save);
    return [ cg.bait ].concat(grids(), [ cg ]);
  };
  const findBait = () => {
    for (const g of baitGrids()) for (const e of g.list) if (e.it.name === BAIT) return {
      it: e.it,
      g,
      e
    };
    return null;
  };
  const baitN = () => {
    let n = 0;
    for (const g of baitGrids()) for (const e of g.list) if (e.it.name === BAIT) n += I.qty(e.it);
    return n;
  };
  const kitFish = () => {
    const out = [];
    for (const g of [ Fi.creelOf(SX.game.save) ].concat(grids())) for (const e of g.list) if (I.def(e.it.name) && I.def(e.it.name).fish) out.push({
      it: e.it,
      g,
      e
    });
    return out;
  };
  const room1 = () => {
    const d = {
      w: 1,
      h: 1,
      rot: false
    };
    return grids().some(g => !!I.findSpot(g, d));
  };
  const moveKey = In => [ "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight" ].some(k => In.hit.has(k));
  const strike = In => In.hit.has("Space") || In.hit.has("Mouse0");
  const holding = In => In.down.has("Space") || In.down.has("Mouse0");
  const splash = vol => SX.audio.play("step", {
    surface: "water",
    w: 1,
    vol: vol || .8
  });
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  Fi.POSE = {
    hold: {
      n: [ -4, -17 ],
      f: [ 6, -13 ]
    },
    up: {
      n: [ -1, -30 ],
      f: [ 9, -34 ]
    },
    reel: k => ({
      n: [ -5, -22 ],
      f: [ 5 + Math.round(Math.cos(k * 6.28) * 2), -18 + Math.round(Math.sin(k * 6.28) * 2) ]
    }),
    show: {
      n: [ -5, -16 ],
      f: [ 9, -37 ]
    }
  };
  const TIP_HOLD = [ 22, 8 ], TIP_UP = [ 18, -70 ], TIP_REEL = [ 20, -18 ], BOB = [ 30, 34 ];
  function tipOf(o) {
    if (!o) return TIP_HOLD;
    if (o.phase === "cast") {
      const k = Math.min(1, o.t / .55);
      if (k < .3) return TIP_UP;
      const a0 = Math.atan2(TIP_UP[1] + 17, TIP_UP[0] + 4), a1 = Math.atan2(TIP_HOLD[1] + 17, TIP_HOLD[0] + 4), a = a0 + (a1 - a0) * ease((k - .3) / .7);
      const L = 58 - 34 * ease((k - .3) / .7);
      return [ -4 + Math.cos(a) * L, -17 + Math.sin(a) * L ];
    }
    if (o.phase === "reel") {
      const b = Math.min(1, o.T);
      return [ TIP_REEL[0] + Math.round(8 * b), TIP_REEL[1] + Math.round(26 * b) ];
    }
    if (o.phase === "catch" || o.phase === "done") return TIP_REEL;
    if (o.phase === "bite") return [ TIP_HOLD[0] + 2, TIP_HOLD[1] + 5 ];
    return TIP_HOLD;
  }
  function poseOf(o) {
    if (!o) return Fi.POSE.hold;
    if (o.phase === "cast") return o.t < .3 ? Fi.POSE.up : o.t < .42 ? {
      n: [ -3, -24 ],
      f: [ 8, -24 ]
    } : Fi.POSE.hold;
    if (o.phase === "reel") return Fi.POSE.reel(o.crank || 0);
    if (o.phase === "catch" || o.phase === "done") return o.got ? Fi.POSE.show : Fi.POSE.hold;
    return Fi.POSE.hold;
  }
  Fi.target = function(F, p, out) {
    const ax = p.x + Math.cos(p.aim) * .3, ay = p.y - .2 + Math.sin(p.aim) * .3;
    let best = null, bd = 1.3, label = null, bo = null;
    const lab = () => {
      if (label == null) {
        const rod = findIn(ROD), bait = baitN();
        label = !rod ? "낚시 — 낚싯대가 없습니다" : !bait ? "낚시 — 지렁이가 없습니다" : "낚시하기 · 지렁이 " + bait + "마리";
      }
      return label;
    };
    for (const sp of F.fishSpots || []) {
      if (sp.npc) continue;
      const d = Math.hypot(ax - sp.x, ay - (sp.y - .3));
      const o = out && Math.hypot(p.x - sp.x, p.y - .2 - (sp.y - .3)) < 1.6 ? {
        kind: "fishSpot",
        spot: sp,
        x: sp.x,
        y: sp.y - 1.2,
        d,
        label: lab()
      } : null;
      if (o) out.push({
        t: o,
        b: [ [ sp.x - .5, sp.y - 1, sp.x + .5, sp.y + .3 ] ],
        flat: true
      });
      if (d < bd) {
        bd = d;
        best = sp;
        bo = o;
      }
    }
    if (!best) return null;
    if (bo) {
      bo.d = bd;
      return bo;
    }
    return {
      kind: "fishSpot",
      spot: best,
      x: best.x,
      y: best.y - 1.2,
      d: bd,
      label: lab()
    };
  };
  Fi.start = function(spot) {
    const p = A.player, s = SX.game.save;
    if (!p || Fi.on || !spot || spot.npc) return false;
    const rod = findIn(ROD);
    if (!rod) {
      SX.log("낚싯대가 없습니다 — 낚시 가게에서 사서 가방 · 리그에 넣으십시오", "bad");
      SX.audio.play("denied");
      return false;
    }
    const bait = findBait();
    if (!bait) {
      SX.log("지렁이가 없습니다 — 낚시 가게에서 삽니다(텃밭에서도 나옵니다)", "bad");
      SX.audio.play("denied");
      return false;
    }
    if (!room1()) {
      SX.log("가방 · 리그에 빈 칸이 없습니다 — 잡은 물고기를 넣을 자리를 비우십시오", "bad");
      SX.audio.play("denied");
      return false;
    }
    if (!I.takeOne(bait.g, bait.it)) return false;
    if (rod.it.uses == null) rod.it.uses = SX.ROD.uses;
    rod.it.uses = Math.max(0, rod.it.uses - 1);
    s.fishCasts = (s.fishCasts | 0) + 1;
    Fi.on = {
      f0: true,
      spot,
      phase: "cast",
      t: 0,
      rod: rod.it,
      fromX: p.x,
      fromY: p.y,
      bob: 0,
      dip: 0,
      ripple: 0,
      waitT: 0,
      nib: [],
      T: 0,
      P: 0,
      run: false,
      runT: 0,
      crank: 0,
      sndT: 0,
      roll: null,
      got: null
    };
    p.x = spot.x;
    p.y = spot.y;
    p.aim = Math.PI / 2;
    p.dir = 0;
    p.reload = null;
    p.use = null;
    p.frame = 0;
    p.walkT = 0;
    SX.audio.play("fishThrow", {
      vol: .8
    });
    if (!Fi.hinted) {
      Fi.hinted = true;
      SX.log("🎣 찌가 쑥 들어갈 때 [Space] · 좌클릭으로 챕니다(살짝 흔들리는 것은 헛입질 — 기다리십시오). 걸리면 [Space] 를 눌렀다 놓았다 하며 끌어냅니다 · 이동 키나 [" + SX.label("interact") + "] 로 그만둡니다", "good");
    }
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    return true;
  };
  Fi.stop = function(quiet) {
    const o = Fi.on, p = A.player;
    Fi.on = null;
    if (p) {
      p.armPose = null;
      p.bodyPose = null;
      p.hop = 0;
    }
    if (o && !quiet && SX.ui && SX.ui.center) SX.ui.center("");
    if (o && SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
  };
  function fail(o, msg, snap) {
    const p = A.player, F = H.floor();
    if (snap) {
      o.rod.uses = Math.max(0, (o.rod.uses | 0) - 3);
      SX.audio.play("fishCreak", {
        vol: .9
      });
      SX.audio.play("gymSwish", {
        vol: .6,
        r: .9,
        delay: .08
      });
      SX.audio.play("denied", {
        delay: .2
      });
    } else SX.audio.play("denied");
    SX.log("🎣 " + msg, "bad");
    if (F) A.float(F.idx, p.x, p.y - 1.6, snap ? "뚝!" : "놓침", "#e0514a");
    o.phase = "done";
    o.t = 0;
    o.got = null;
    rodCheck(o);
  }
  function rodCheck(o) {
    if ((o.rod.uses | 0) > 0) return;
    for (const g of grids()) if (I.take(g, o.rod)) break;
    SX.audio.play("brick", {
      vol: .6,
      delay: .3
    });
    SX.log("🎣 낚싯대가 부러졌습니다 — 낚시 가게에서 새것을 삽니다", "bad");
  }
  function land(o) {
    const p = A.player, s = SX.game.save, F = H.floor(), r = o.roll;
    if (!r) return;
    let it;
    if (r.junk) {
      it = I.mk(r.junk.name);
      SX.log("🎣 " + r.junk.name + " — 꽝입니다", "warn");
      if (F) A.float(F.idx, p.x, p.y - 1.6, "꽝", "#c8c0a8");
    } else {
      it = I.mk(r.fish.name, {
        kg: r.kg
      });
      const st = s.fish || (s.fish = {
        n: 0,
        kg: 0,
        best: null
      });
      st.n++;
      if (r.kg > (st.kg || 0)) {
        st.kg = r.kg;
        st.best = r.fish.name;
      }
      SX.log("🐟 " + r.fish.name + " " + r.kg + "kg — " + (I.put(Fi.creelOf(s), it) ? "조과통" : "가방") + "에 넣었습니다(팔면 " + SX.won(I.sellValue(it, true)) + " · 날로 먹으면 배고픔 +10 · 구우면 +45)" + (st.kg === r.kg && st.n > 1 ? " ★ 가장 큰 것" : ""), "good");
      if (F) A.float(F.idx, p.x, p.y - 1.6, r.fish.name + " " + r.kg + "kg", "#ffd26a");
      SX.audio.play("fishLand", {
        vol: .9
      });
    }
    let put = !!I.at(Fi.creelOf(s), it);
    for (const g of grids()) if (!put && I.put(g, it)) {
      put = true;
      break;
    }
    if (!put) SX.log((Fi.isFish(it) ? "조과통 · " : "") + "가방 · 리그가 가득 차 " + it.name + "을(를) 놓아줬습니다", "bad");
    o.got = it;
    rodCheck(o);
    SX.game.persist();
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    if (SX.ui && SX.ui.afterChange && SX.ui.panelKind === "inv") SX.ui.afterChange();
  }
  Fi.update = function(F, dt, In, ctl) {
    tickAnglers(dt);
    const o = Fi.on;
    if (!o) return;
    const p = A.player, U = SX.ui;
    p.x = o.spot.x;
    p.y = o.spot.y;
    p.aim = Math.PI / 2;
    p.dir = 0;
    p.frame = 0;
    p.moving = false;
    p.sprinting = false;
    o.t += dt;
    o.ripple = Math.max(0, o.ripple - dt);
    const fKey = !o.f0 && In.pressed("interact");
    o.f0 = false;
    if (ctl && (moveKey(In) || fKey) && o.phase !== "done" && o.phase !== "catch") {
      const reeling = o.phase === "reel";
      SX.log("🎣 낚시를 그만뒀습니다" + (reeling ? " — 물고기가 달아났습니다" : "(미끼는 썼습니다)"), "warn");
      o.phase = "done";
      o.t = .3;
      o.got = null;
    }
    if (o.phase === "cast") {
      if (o.t >= .33 && !o.landed) {
        o.landed = true;
        splash(.7);
        o.ripple = .8;
      }
      if (o.t >= .55) {
        o.phase = "wait";
        o.t = 0;
        o.waitT = 2.5 + rnd() * 6;
        o.nib = [];
        for (let k = 0, n = rnd() < .55 ? 1 + (rnd() < .4 ? 1 : 0) : 0; k < n; k++) o.nib.push(.8 + rnd() * (o.waitT - 1.4));
      }
    } else if (o.phase === "wait") {
      const nib = o.nib.some(t => o.t >= t && o.t < t + .35);
      o.dip = nib ? 1 + Math.round(Math.sin(o.t * 40) * .5 + .5) : Math.sin(o.t * 1.3) > .6 ? 1 : 0;
      if (nib && !o.nibSnd) {
        o.nibSnd = true;
        splash(.2);
      }
      if (!nib) o.nibSnd = false;
      if (ctl && strike(In)) {
        fail(o, nib ? "헛입질에 챘습니다 — 쑥 들어갈 때까지 기다리십시오" : "너무 빨리 챘습니다 — 찌가 쑥 들어갈 때 누르십시오");
      } else if (o.t >= o.waitT) {
        o.phase = "bite";
        o.t = 0;
        o.dip = 3;
        o.ripple = .6;
        splash(.5);
      }
    } else if (o.phase === "bite") {
      o.dip = 3 + Math.round(Math.sin(o.t * 30));
      if (ctl && strike(In)) {
        o.roll = SX.fishRoll(rnd);
        if (o.roll.junk) {
          o.phase = "catch";
          o.t = 0;
          land(o);
        } else {
          o.phase = "reel";
          o.t = 0;
          o.T = .15;
          o.P = 0;
          o.run = false;
          o.runT = 1 + rnd() * 1.5;
          o.pull = o.roll.fish.pull;
          SX.audio.play("fishHook", {
            vol: .8
          });
          o.ripple = .6;
        }
      } else if (o.t >= .75) fail(o, "입질을 놓쳤습니다 — 미끼만 뜯겼습니다");
    } else if (o.phase === "reel") {
      const S = o.pull, hold = ctl && holding(In);
      o.runT -= dt;
      if (o.runT <= 0) {
        o.run = !o.run;
        o.runT = o.run ? .45 + rnd() * .6 : 1.1 + rnd() * 1.9 * (1 - S * .4);
        if (o.run) {
          o.ripple = .5;
          splash(.3);
          SX.audio.play("fishRun", {
            vol: .7
          });
        }
      }
      if (hold) {
        o.T += dt * (.35 + .5 * S) * (o.run ? 2.6 : 1);
        if (!o.run) o.P += dt * (.3 - .12 * S);
        o.crank = (o.crank + dt * 2.2) % 1;
        o.sndT -= dt;
        if (o.sndT <= 0) {
          o.sndT = .45;
          SX.audio.play("fishReel", {
            vol: .7
          });
        }
        if (o.T > .65) {
          o.crT = (o.crT || 0) - dt;
          if (o.crT <= 0) {
            o.crT = .55 + Math.random() * .4;
            SX.audio.play("fishCreak", {
              vol: .35 + o.T * .4
            });
          }
        }
      } else {
        o.T -= dt * 1.1;
        if (o.P > 0) o.P -= dt * .03;
      }
      o.T = Math.max(0, o.T);
      o.P = Math.max(0, o.P);
      o.dip = 3 + Math.round(o.T * 2);
      if (o.T >= 1) fail(o, "줄이 끊어졌습니다 — 당길 때는 놓았다가 다시 감으십시오(낚싯대가 세 번 몫 닳았습니다)", true); else if (o.P >= 1) {
        o.phase = "catch";
        o.t = 0;
        splash(.9);
        o.ripple = .8;
        land(o);
      }
    } else if (o.phase === "catch") {
      if (o.t >= 1.4) {
        o.phase = "done";
        o.t = 0;
      }
    } else if (o.phase === "done") {
      if (o.t >= .4) {
        Fi.stop();
        if (U && U.center) U.center("");
        return;
      }
    }
    p.armPose = poseOf(o);
    p.bodyPose = null;
    p.hop = 0;
    if (U && U.mini) {
      const fish = o.roll && o.roll.fish;
      U.mini(o.phase === "cast" ? {
        t: "낚시",
        msg: "던집니다…"
      } : o.phase === "wait" ? {
        t: "낚시",
        msg: "찌를 보십시오",
        key: [ "Space", "좌클릭" ],
        tip: "쑥 들어가면"
      } : o.phase === "bite" ? {
        t: "낚시",
        msg: "찌를 보십시오",
        key: [ "Space", "좌클릭" ],
        tip: "쑥 들어가면",
        now: "지금!"
      } : o.phase === "reel" ? {
        t: "낚시",
        rows: [ {
          k: "끌어내기",
          pct: o.P
        } ],
        key: [ "Space" ],
        tip: "눌러 감기",
        warn: o.run ? "◀ 당깁니다! 놓으십시오" : "",
        gauge: {
          k: "줄 긴장",
          v: Math.round(Math.max(0, Math.min(1, o.T)) * 100) + "%",
          zones: [ [ 0, .7, SX.cbc ? SX.cbc("st", "#3a8a3a") : "#3a8a3a" ], [ .7, .9, "#b09a2a" ], [ .9, 1, "#a83a2a" ] ],
          mark: o.T,
          mc: o.T > .9 ? "#ff6a5a" : "#fff",
          ticks: 10
        }
      } : o.phase === "catch" && o.got ? {
        t: "낚시",
        res: fish ? o.got.name + " " + o.roll.kg + "kg!" : o.got.name,
        sub: fish ? "" : "꽝"
      } : null);
    }
  };
  const NAMES = [ "밤낚시 아저씨", "낚시 동호회 총무", "수산시장에서 일하던 사람" ];
  const LINES = [ [ "밤에는 메기가 뭅니다. 찌가 천천히, 깊게 들어가면 그놈이에요.", "살짝 흔들릴 때 채면 안 됩니다. 쑥 들어갈 때까지 기다리세요.", "강물이 저래 봬도 고기는 아직 삽니다. 사람보다 낫지." ], [ "당길 때 같이 당기면 줄이 나갑니다. 놓았다가 다시 감으세요.", "지렁이는 텃밭 흙을 뒤집으면 나옵니다. 가게 것보다 싸요.", "잉어 한 마리면 하루 치 밥값은 나옵니다. 브로커가 꽤 쳐 줘요." ], [ "쏘가리는 한 달에 한 번 볼까 말까입니다. 걸리면 절대 당기지 마세요.", "작은 건 구워 먹고 큰 건 파세요. 그게 남는 장사예요.", "모닥불에 구우면 날것보다 배가 훨씬 든든합니다." ] ];
  Fi.spawnAnglers = function(F) {
    Fi.anglers = [];
    const spots = F.fishSpots || [], use = [ spots[0], spots[4], spots[7] ].filter(Boolean);
    use.forEach((sp, k) => {
      const spec = SX.art.charSpec("scav", new SX.Rng(1300 + k * 11));
      spec.mask = null;
      spec.vest = null;
      spec.pack = null;
      spec.hat = k === 1 ? "cap" : k === 2 ? "beanie" : null;
      spec.key = "angler" + k;
      const c = {
        kind: "npc",
        civ: true,
        angler: true,
        id: 200 + k,
        name: NAMES[k],
        lines: LINES[k],
        x: sp.x,
        y: sp.y,
        floor: 0,
        spec,
        dir: 0,
        frame: 0,
        walkT: 0,
        alive: true,
        state: "post",
        t: 1e9,
        anim: rnd() * 5,
        reelT: 4 + rnd() * 9,
        reel: 0,
        dip: 0,
        ripple: 0,
        fspot: sp
      };
      sp.npc = c;
      Fi.anglers.push(c);
      (F.npcs || (F.npcs = [])).push(c);
    });
    return Fi.anglers;
  };
  function tickAnglers(dt) {
    const p = A.player;
    for (const c of Fi.anglers) {
      c.anim += dt;
      c.ripple = Math.max(0, c.ripple - dt);
      if (c.reel > 0) {
        c.reel -= dt;
        c.crank = ((c.crank || 0) + dt * 2) % 1;
        c.armPose = Fi.POSE.reel(c.crank);
        c.dip = 3;
        if (c.reel <= 0) {
          c.reelT = 6 + rnd() * 10;
          c.dip = 0;
        }
      } else {
        c.reelT -= dt;
        c.armPose = Fi.POSE.hold;
        c.dip = Math.sin(c.anim * 1.7) > .93 ? 1 : 0;
        if (c.reelT <= 0) {
          c.reel = 1.6;
          c.ripple = .6;
          if (p && Math.hypot(c.x - p.x, c.y - p.y) < 12) {
            SX.audio.play("step", {
              surface: "water",
              w: .6,
              vol: .35,
              x: c.x,
              y: c.y + 1,
              range: 12
            });
            SX.audio.play("fishReel", {
              vol: .35,
              x: c.x,
              y: c.y,
              range: 12
            });
          }
        }
      }
      c.dir = 0;
      c.frame = 0;
    }
  }
  const ROD_C = {
    grip: [ "#c8a676", "#b08a5a", "#4a3420" ],
    blank: [ "#4e7a62", "#1a2e24", "#0e1a14", "#3e6450" ],
    ring: "#c8d0d8",
    tip: [ "#d83a2a", "#f0f0f0" ],
    reel: [ "#9aa0aa", "#d0d6e0", "#22242a", "#5a5e68", "#e0c890" ]
  };
  function dots(ctx, cells, skip) {
    const s = new Set(cells.map(q => q[0] + "," + q[1]));
    for (const [x, y, , oc] of cells) if (oc) {
      ctx.fillStyle = oc;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const X = x + ox, Y = y + oy;
        if (!s.has(X + "," + Y) && !(skip && skip(X, Y))) ctx.fillRect(X, Y, 1, 1);
      }
    }
    for (const [x, y, col] of cells) if (!(skip && skip(x, y))) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  function drawRig(ctx, px, py, pose, tip, o, c) {
    const base = [ px + pose.n[0], py + pose.n[1] ], mid = [ px + pose.f[0], py + pose.f[1] ], tx = px + tip[0], ty = py + tip[1];
    const bend = o && o.phase === "reel" ? Math.min(1, o.T) : 0;
    const cx = mid[0] + (tx - mid[0]) * .5 + 6 * bend, cy = mid[1] + (ty - mid[1]) * .5 - 10 + 14 * bend;
    const at = t => {
      const u = 1 - t;
      return [ u * u * base[0] + 2 * u * t * cx + t * t * tx, u * u * base[1] + 2 * u * t * cy + t * t * ty ];
    };
    const N = Math.max(8, Math.ceil((Math.hypot(cx - base[0], cy - base[1]) + Math.hypot(tx - cx, ty - cy)) * 3)), pts = [], seen = new Set;
    let im = 0, dm = 1e9;
    {
      const l = Math.hypot(cx - base[0], cy - base[1]) || 1, ux = (cx - base[0]) / l, uy = (cy - base[1]) / l;
      for (let k = 4; k >= 1; k--) {
        const x = Math.round(base[0] - ux * k), y = Math.round(base[1] - uy * k), key = x + "," + y;
        if (!seen.has(key)) {
          seen.add(key);
          pts.push([ x, y ]);
        }
      }
    }
    for (let i = 0; i <= N; i++) {
      const q = at(i / N), x = Math.round(q[0]), y = Math.round(q[1]), key = x + "," + y, d = Math.hypot(q[0] - mid[0], q[1] - mid[1]);
      if (!seen.has(key)) {
        seen.add(key);
        pts.push([ x, y ]);
      }
      if (d < dm) {
        dm = d;
        im = pts.length - 1;
      }
    }
    const off = i => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      return Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? [ 0, 1 ] : [ 1, 0 ];
    };
    im = Math.min(im, 11);
    const rod = [], nb = pts.length - 1 - im;
    pts.forEach(([x, y], i) => {
      const [ox, oy] = off(i);
      if (i <= im) {
        rod.push([ x, y, ROD_C.grip[0], ROD_C.grip[2] ], [ x + ox, y + oy, ROD_C.grip[1], ROD_C.grip[2] ]);
        return;
      }
      const j = i - im, fromTip = pts.length - 1 - i;
      if (fromTip < 6) {
        rod.push([ x, y, ROD_C.tip[fromTip >> 1 & 1], null ]);
        return;
      }
      if (j < nb * .45) {
        rod.push([ x, y, ROD_C.blank[0], null ], [ x + ox, y + oy, j % 10 === 5 ? ROD_C.ring : ROD_C.blank[1], null ]);
        return;
      }
      rod.push([ x, y, ROD_C.blank[3], null ]);
      if (j % 10 === 5) rod.push([ x + ox, y + oy, ROD_C.ring, null ]);
    });
    const mx = Math.round(mid[0]), my = Math.round(mid[1]), ka = ((o ? o.crank : c ? c.crank : 0) || 0) * Math.PI * 2, R = ROD_C.reel, reel = [ [ mx, my + 2, R[3], R[2] ] ];
    for (let yy = 0; yy < 3; yy++) for (let xx = -1; xx <= 1; xx++) reel.push([ mx + xx, my + 3 + yy, xx === -1 && yy === 0 ? R[1] : xx === 0 && yy === 1 ? R[3] : R[0], R[2] ]);
    const ax = Math.round(Math.cos(ka) * 3), ay = Math.round(Math.sin(ka) * 3);
    reel.push([ mx + Math.round(ax / 2), my + 4 + Math.round(ay / 2), R[2], null ], [ mx + ax, my + 4 + ay, R[4], R[2] ]);
    const hands = [ [ Math.round(base[0]), Math.round(base[1]) ], [ mx, my ] ], handAt = (x, y) => hands.some(h => Math.abs(x - h[0]) <= 1 && Math.abs(y - h[1]) <= 1);
    dots(ctx, reel, null);
    dots(ctx, rod, handAt);
    let bx = px + BOB[0], by = py + BOB[1], show = true, inWater = true;
    const dip = (o ? o.dip : c ? c.dip : 0) || 0;
    if (o && o.phase === "cast") {
      const k = Math.min(1, o.t / .55);
      if (k < .3) {
        show = false;
      } else {
        const q = ease((k - .3) / .25);
        if (q < 1) {
          inWater = false;
          bx = tx + (px + BOB[0] - tx) * q;
          by = ty + (py + BOB[1] - ty) * q - Math.sin(q * Math.PI) * 22;
        }
      }
    } else if (o && (o.phase === "catch" || o.phase === "done")) show = false;
    if (show) {
      const X = Math.round(bx), Y = Math.round(by) + dip, Yw = Math.round(by) + 1, sag = !inWater || o && (o.phase === "reel" || o.phase === "bite") || c && c.reel > 0 ? 0 : 3;
      {
        const x0 = Math.round(tx), y0 = Math.round(ty), x1 = X, y1 = Y - 6, n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5)), ln = new Set;
        ctx.fillStyle = "rgba(230,240,255,0.55)";
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + 4 * sag * t * (1 - t)), key = x + "," + y;
          if (!ln.has(key)) {
            ln.add(key);
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      const OC = "#2a1410", bob = [ [ X, Y - 6, "#e03a2a", OC ], [ X, Y - 5, "#e03a2a", OC ], [ X, Y - 4, "#f0d040", OC ], [ X, Y - 3, "#f0d040", OC ] ];
      for (let yy = 0; yy < 3; yy++) for (let xx = -1; xx <= 1; xx++) bob.push([ X + xx, Y - 2 + yy, xx === -1 && yy === 0 ? "#ffb8a0" : yy === 0 ? "#f06a4a" : yy === 1 ? "#e03a2a" : "#f0f0f0", OC ]);
      dots(ctx, bob, inWater ? (x, y) => y >= Yw : null);
      if (inWater) {
        ctx.fillStyle = "#cfe4f4";
        ctx.fillRect(X - 2, Yw, 5, 1);
        const rip = o ? o.ripple : c ? c.ripple : 0;
        if (rip > 0) {
          const r = 4 + (.8 - rip) * 14;
          ctx.save();
          ctx.strokeStyle = "rgba(180,210,240," + (rip * .8).toFixed(2) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(bx, by, r, r * .45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }
  function drawFish(ctx, x, y, f, kg) {
    const L = Math.round(8 + Math.min(14, kg * 4)), hh = Math.round(2 + Math.min(4, kg * 1.2));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 2 + Math.sin(performance.now() / 120) * .08);
    ctx.fillStyle = f.col[0];
    ctx.beginPath();
    ctx.ellipse(0, 0, L, hh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = f.col[1];
    ctx.beginPath();
    ctx.ellipse(1, 1, L - 3, Math.max(1, hh - 1.5), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = f.col[0];
    ctx.beginPath();
    ctx.moveTo(L - 1, 0);
    ctx.lineTo(L + 4, -hh - 1);
    ctx.lineTo(L + 4, hh + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#101418";
    ctx.fillRect(-L + 2, -1, 1, 1);
    ctx.restore();
  }
  Fi.draw = function(ctx, cam, F) {
    for (const c of Fi.anglers) {
      const sh = SX.motion ? SX.motion.shift(c) : [ 0, 0 ], px = Math.round(c.x * TS - cam.x) + sh[0], py = Math.round(c.y * TS - cam.y) + sh[1];
      drawRig(ctx, px, py, SX.motion && SX.motion.poseRel(c) || c.armPose || Fi.POSE.hold, c.reel > 0 ? [ TIP_REEL[0] + 4, TIP_REEL[1] + 12 ] : TIP_HOLD, null, c);
    }
    const o = Fi.on;
    if (!o) return;
    const p = A.player, sh = SX.motion ? SX.motion.shift(p) : [ 0, 0 ], px = Math.round(p.x * TS - cam.x) + sh[0], py = Math.round(p.y * TS - cam.y) + sh[1];
    const rp = SX.motion && SX.motion.poseRel(p), pose = rp || poseOf(o);
    if (!(o.phase === "catch" || o.phase === "done") || !o.got) drawRig(ctx, px, py, pose, tipOf(o), o, null);
    ctx.save();
    ctx.font = "12px Galmuri7";
    ctx.textAlign = "center";
    if (o.phase === "bite") {
      ctx.fillStyle = "#6fe06a";
      ctx.fillText("지금!", px, py - 48);
      ctx.fillStyle = "#fff";
      ctx.fillText("!", px + BOB[0], py + BOB[1] - 12);
    } else if (o.phase === "wait" && o.dip) {
      ctx.fillStyle = "#c8c0a8";
      ctx.fillText("…", px + BOB[0], py + BOB[1] - 10);
    } else if (o.phase === "reel") {
      if (o.run) {
        ctx.fillStyle = "#ff6a5a";
        ctx.fillText("!! 당깁니다", px, py - 50);
      }
    } else if ((o.phase === "catch" || o.phase === "done") && o.got) {
      const hx = px + (rp ? rp.f : Fi.POSE.show.f)[0], hy = py + (rp ? rp.f : Fi.POSE.show.f)[1];
      if (o.roll && o.roll.fish) {
        ctx.strokeStyle = "rgba(230,240,255,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 1, hy + 6);
        ctx.stroke();
        drawFish(ctx, hx + 1, hy + 6 + Math.round(6 + Math.min(14, o.roll.kg * 4)), o.roll.fish, o.roll.kg);
      } else {
        const ic = SX.art.icon(o.got);
        if (ic) ctx.drawImage(ic, Math.round(hx) - 8, Math.round(hy) - 2, 16, 16);
      }
    }
    ctx.restore();
  };
  const esc = s => SX.esc(s);
  function giveKit(it) {
    for (const g of grids()) if (I.put(g, it)) return true;
    return false;
  }
  Fi.openShop = function() {
    const U = SX.ui, s = SX.game.save;
    U.open("fishShop", `<div class="win" style="min-width:calc(var(--u)*170);max-width:calc(var(--u)*240)"><header><h2>낚시 가게 — 강태공</h2><button class="x" data-close>닫기 ✕</button></header><div class="body col" id="fishShopBody"></div></div>`);
    const body = document.getElementById("fishShopBody");
    if (!body) return;
    const render = () => {
      body.innerHTML = `<p class="story">"밤낚시는 메기지. 지렁이 넉넉히 가져가."</p><div class="small">가진 돈 <b class="money">${SX.won(s.money)}</b> ${U.qm ? U.qm("산 물건은 가방 · 리그로 들어갑니다.<br>지렁이는 조과통 미끼 칸 · 가방 · 리그의 뭉치에 더합니다.") : ""}</div>`;
      const L = document.createElement("div");
      L.className = "list";
      const row = (d, price, n, label) => {
        const r = document.createElement("div");
        r.className = "li";
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.innerHTML = esc(d.name) + (n > 1 ? " ×" + n : "") + "<br><span class='small'>" + esc(d.desc || "") + "</span>";
        r.appendChild(nm);
        const pr = document.createElement("span");
        pr.className = "pr";
        pr.textContent = SX.won(price * n);
        r.appendChild(pr);
        r.oncontextmenu = e => {
          e.preventDefault();
          U.showDetail({
            item: d
          });
        };
        r.title = "우클릭: 자세히";
        const b = document.createElement("button");
        b.textContent = label || "구매";
        b.onclick = () => {
          if (s.money < price * n) {
            SX.audio.play("denied");
            SX.log("돈이 모자랍니다 — " + SX.won(price * n));
            return;
          }
          if (I.isStack(d)) {
            const k = SX.game.kit, bg = Fi.creelOf(s).bait, g = I.stackGive([ bg, k.bag && k.bag.grid, k.rig && k.rig.grid ], d.name, n);
            if (!g) {
              SX.audio.play("denied");
              SX.log("조과통 미끼 칸 · 가방 · 리그에 자리가 없습니다 — 한 칸을 비우고 다시 오십시오");
              return;
            }
            let tot = 0;
            for (const e of g.list) if (e.it.name === d.name) tot += I.qty(e.it);
            s.money -= price * n;
            SX.audio.play("buy");
            SX.log("샀습니다: " + d.name + " " + n + "마리 — " + (g === bg ? "조과통 미끼 칸" : "가방 · 리그") + "의 뭉치에 넣었습니다(모두 " + tot + "마리)");
            SX.game.persist();
            render();
            if (U.hudDirty) U.hudDirty();
            return;
          }
          const got = [];
          for (let k = 0; k < n; k++) {
            const it = I.mk(d.name);
            if (!giveKit(it)) break;
            got.push(it);
          }
          if (!got.length) {
            SX.audio.play("denied");
            SX.log("가방 · 리그에 자리가 없습니다 — 비우고 다시 오십시오" + (d.h > 1 ? "(낚싯대는 세로 세 칸)" : ""));
            return;
          }
          s.money -= price * got.length;
          SX.audio.play("buy");
          SX.log("샀습니다: " + d.name + (got.length > 1 ? " ×" + got.length : "") + (got.length < n ? " (자리가 모자라 " + got.length + "개만)" : "") + " — 가방 · 리그에 넣었습니다");
          SX.game.persist();
          render();
          if (U.hudDirty) U.hudDirty();
        };
        r.appendChild(b);
        L.appendChild(r);
      };
      row(SX.ROD, SX.ROD.price, 1);
      row(SX.BAIT, SX.BAIT.price, 1);
      row(SX.BAIT, SX.BAIT.price, 10, "10마리 사기");
      body.appendChild(L);
      const fish = kitFish().concat([]);
      for (const g of grids()) for (const e of g.list) if (SX.FISH_JUNK.some(j => j.name === e.it.name)) fish.push({
        it: e.it,
        g,
        e
      });
      const h = document.createElement("div");
      h.className = "small secHd";
      h.textContent = fish.length ? "잡은 것을 사 갑니다 — 브로커와 같은 값" : "잡은 물고기가 있으면 여기서 바로 팝니다(브로커와 같은 값)";
      body.appendChild(h);
      if (fish.length) {
        const S = document.createElement("div");
        S.className = "list";
        for (const q of fish) {
          const r = document.createElement("div"), v = I.sellValue(q.it, true);
          r.className = "li";
          const nm = document.createElement("span");
          nm.className = "nm";
          nm.textContent = q.it.name + (q.it.kg ? " " + q.it.kg + "kg" : "");
          r.appendChild(nm);
          const pr = document.createElement("span");
          pr.className = "pr";
          pr.textContent = SX.won(v);
          r.appendChild(pr);
          const b = document.createElement("button");
          b.textContent = "판매";
          b.onclick = () => {
            if (!I.take(q.g, q.it)) return;
            s.money += v;
            SX.audio.play("buy");
            SX.log("팔았습니다: " + q.it.name + " — " + SX.won(v));
            SX.game.persist();
            render();
            if (U.hudDirty) U.hudDirty();
          };
          r.appendChild(b);
          S.appendChild(r);
        }
        body.appendChild(S);
      }
      {
        const L0 = Fi.sellList(), ab = document.createElement("button");
        ab.id = "fishSellAll";
        ab.className = "big";
        ab.textContent = "물고기 전부 판매" + (L0.length ? "(" + L0.length + "마리)" : "");
        ab.disabled = !L0.length;
        ab.title = "조과통 · 가방 · 리그의 물고기를 한 번에 팝니다(임무에 쓰는 것 · 찜한 것은 빼고)";
        ab.onclick = () => sellAllAsk(render);
        body.appendChild(ab);
      }
    };
    render();
  };
  Fi.sellList = function() {
    const s = SX.game.save, T = SX.trade, NM = SX.needmark, need = NM && NM.map ? NM.map() : new Map, grp = need.get("물고기");
    if (grp && grp.some(r => r.k !== "craft")) return [];
    return kitFish().filter(q => !(q.it.quest || q.it.story) && !need.has(q.it.name) && !(T && T.wished && T.wished(s, q.it.name)) && I.sellValue(q.it, true) > 0);
  };
  function sellAllAsk(render) {
    const U = SX.ui, L = Fi.sellList();
    if (!L.length) {
      SX.audio.play("denied");
      SX.log("팔 물고기가 없습니다 — 임무에 쓰는 것 · 찜한 것은 빼고 셉니다");
      return;
    }
    const by = new Map;
    let total = 0;
    for (const q of L) {
      const v = I.sellValue(q.it, true), r = by.get(q.it.name) || {
        n: 0,
        v: 0
      };
      r.n++;
      r.v += v;
      by.set(q.it.name, r);
      total += v;
    }
    const rows = [ ...by.entries() ].sort((a, b) => b[1].v - a[1].v);
    const lines = rows.map(([n, r]) => `<div class="li"><span class="nm">${esc(n)}${r.n > 1 ? " ×" + r.n : ""}</span><span class="pr">${SX.won(r.v)}</span></div>`).join("");
    U.ask("물고기 전부 판매", `${esc("조과통 · 가방 · 리그의 물고기 " + L.length + "마리를 강태공에게 팝니다. 임무에 쓰는 것 · 찜한 것은 뺐습니다.")}</p><div class="junkList">${lines}</div><p class="small">${esc("하나씩 팔 때와 같은 값입니다.")}`, 0, () => {
      const s = SX.game.save;
      let n = 0, got = 0;
      for (const q of Fi.sellList()) {
        const v = I.sellValue(q.it, true);
        if (!I.take(q.g, q.it)) continue;
        s.money += v;
        n++;
        got += v;
      }
      if (n) {
        SX.audio.play("buy");
        SX.log("🐟 물고기 " + n + "마리를 팔았습니다 +" + SX.won(got), "good");
        SX.game.persist();
      }
      if (document.getElementById("fishShopBody")) render();
      if (U.afterChange) U.afterChange();
      if (U.hudDirty) U.hudDirty();
    }, null, {
      q: "합계 " + SX.won(total) + " 에 모두 파시겠습니까?",
      yes: "전부 판매",
      no: "그만두기"
    });
  }
  Fi.openGrill = function() {
    const U = SX.ui;
    U.open("fishGrill", `<div class="win" style="min-width:calc(var(--u)*150);max-width:calc(var(--u)*220)"><header><h2>모닥불 — 생선 굽기</h2><button class="x" data-close>닫기 ✕</button></header><div class="body col" id="fishGrillBody"></div></div>`);
    const body = document.getElementById("fishGrillBody");
    if (!body) return;
    const cook = q => {
      const c = I.mk(SX.FISH_COOKED.name);
      if (!I.take(q.g, q.it)) return false;
      if (!(q.g.creel ? giveKit(c) : I.put(q.g, c, q.e.x, q.e.y) || giveKit(c))) {
        I.put(q.g, q.it, q.e.x, q.e.y);
        return false;
      }
      return true;
    };
    const render = () => {
      const fish = kitFish();
      body.innerHTML = `<div class="small">조과통 · 가방 · 리그의 날생선을 굽습니다 — 「구운 생선」 배고픔 +45 · 목마름 −5 (날것은 +10). 큰 물고기는 파는 편이 낫습니다 · 셸터 가스레인지에서도 굽습니다</div>`;
      if (!fish.length) {
        const e = document.createElement("div");
        e.className = "small";
        e.style.padding = "calc(var(--u)*4)";
        e.textContent = "구울 물고기가 없습니다 — 물가에서 낚시하십시오";
        body.appendChild(e);
        return;
      }
      const L = document.createElement("div");
      L.className = "list";
      for (const q of fish) {
        const r = document.createElement("div");
        r.className = "li";
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = q.it.name + (q.it.kg ? " " + q.it.kg + "kg" : "") + " · 팔면 " + SX.won(I.sellValue(q.it, true));
        r.appendChild(nm);
        const b = document.createElement("button");
        b.textContent = "굽기";
        b.onclick = () => {
          if (cook(q)) {
            SX.audio.play("rustle", {
              vol: .5
            });
            SX.log("🔥 " + q.it.name + "을(를) 구웠습니다 — 구운 생선(우클릭으로 먹습니다)", "good");
            SX.game.persist();
            render();
            if (U.afterChange) U.afterChange();
          }
        };
        r.appendChild(b);
        L.appendChild(r);
      }
      body.appendChild(L);
      const all = document.createElement("button");
      all.className = "big";
      all.textContent = "모두 굽기(" + fish.length + "마리)";
      all.onclick = () => {
        let n = 0;
        for (const q of fish) if (cook(q)) n++;
        if (n) {
          SX.audio.play("rustle", {
            vol: .5
          });
          SX.log("🔥 " + n + "마리를 구웠습니다 — 구운 생선(우클릭으로 먹습니다)", "good");
          SX.game.persist();
          if (U.afterChange) U.afterChange();
        }
        render();
      };
      body.appendChild(all);
    };
    render();
  };
})(window.SX);
