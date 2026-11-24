"use strict";

(function(SX) {
  const C = SX.clean = {};
  const TS = SX.TS;
  C.SPOT_T = 1.5;
  C.SPOT_R = .75;
  C.SPOT_MAX = 6;
  C.REACH = 1.25;
  C.REGROW = 0;
  C.BIG_T0 = 3, C.BIG_PER = .05, C.BIG_MAX = 20;
  C.BIG_CYCLE = 1.1;
  C.CARRY_MAX = 5e3;
  C.job = null;
  const save = () => SX.game && SX.game.save;
  const I = () => SX.items;
  const homeF = () => {
    const H = SX.hub;
    return H && H.scene === "home" && H.level && SX.game && SX.game.state === "hub" ? H.floor() : null;
  };
  const tagOf = k => {
    const T = SX.decoHub && SX.decoHub.CLEAN, t = T ? T[k] : null;
    return t ? {
      give: t[0] || "",
      how: t[1] || "sweep",
      n: t[2] || 1
    } : null;
  };
  const wallTagOf = k => {
    const T = SX.decoHub && SX.decoHub.CLEAN_WALL;
    return T && T[k] === "wipe" ? {
      give: "",
      how: "wall",
      n: 1,
      wall: true
    } : null;
  };
  C.tagOf = tagOf;
  C.wallTagOf = wallTagOf;
  C.isTrash = it => !!(it && (I().def(it.name) || {}).trash);
  C.isDump = f => {
    const c = f && SX.home && SX.home.FURN && SX.home.FURN[f.kind];
    return !!(c && c.use === "dump");
  };
  C.DUMP_SND = {
    trash: "trashThrow",
    binBox: "binDumpCard",
    binMesh: "binDumpMesh",
    binPedal: "binDumpPedal",
    binMetal: "binDumpMetal",
    binRecycle: "binDumpSort",
    binWheelie: "binDumpBig"
  };
  function posOf(it) {
    if (it._p) return it._p;
    if (it.seg) return it._p = {
      x: (it.seg.a * TS + it.x + it.w / 2) / TS,
      y: ((it.row + 1) * TS + 3) / TS
    };
    return it._p = {
      x: (it.x + it.w / 2) / TS,
      y: (it.y + it.h / 2) / TS
    };
  }
  C.posOf = posOf;
  const listOf = F => F && F.dh && F.dh.cln || [];
  const live = it => !it.gone && !it.hid && !it.cov;
  C.pieces = F => listOf(F || homeF()).filter(live);
  const shut = (F, it) => {
    if (!F || !F.hideAt) return false;
    const q = posOf(it);
    return F.hideAt(Math.floor(q.x), Math.floor(q.y));
  };
  function state(h, tier, make) {
    if (!h) return null;
    let c = h.cln;
    if (!c || typeof c !== "object" || Array.isArray(c)) {
      if (!make) return null;
      c = h.cln = {};
    }
    let s = c[tier];
    if (!s || typeof s !== "object" || !Array.isArray(s.g)) {
      if (!make) return null;
      s = c[tier] = {
        g: [],
        r: save().runs | 0
      };
    }
    s.g = s.g.filter(x => typeof x === "string").slice(0, 4e3);
    s.r = Math.max(0, +s.r || 0);
    return s;
  }
  C.attach = function(level, F, dh) {
    const seen = new Map, L = [];
    const mk = (it, pre) => {
      const t = it.seg && it.type !== "base" ? wallTagOf(it.k) : tagOf(it.k);
      if (!t) return;
      const key = pre + it.k + "@" + it.x + "," + it.y + (it.seg ? ":" + it.row + ":" + it.seg.a : ""), n = seen.get(key) || 0;
      seen.set(key, n + 1);
      it.cid = (SX.hash(key + "#" + n) >>> 0).toString(36);
      it.tg = t;
      L.push(it);
    };
    for (const it of dh.floor) mk(it, "f");
    for (const it of dh.wall) mk(it, it.type === "base" ? "w" : "v");
    dh.cln = L;
    dh.clnTier = level.homeTier | 0;
    C.sync(F, SX.game && SX.game.state === "hub", false);
  };
  C.sync = function(F, grow, paint) {
    const dh = F && F.dh, s = save();
    if (!dh || !dh.cln || !s || !s.home) return;
    const st = state(s.home, dh.clnTier, false);
    if (st && grow) {
      const ids = new Set(dh.cln.map(it => it.cid)), runs = s.runs | 0;
      if (dh.cln.length) st.g = st.g.filter(x => ids.has(x));
      if (runs < st.r) st.r = runs; else if (runs > st.r) {
        const n = Math.min(st.g.length, (runs - st.r) * C.REGROW);
        st.r = runs;
        if (n > 0) {
          const g = new SX.Rng(SX.hash("cln:" + dh.clnTier + ":" + runs + ":" + st.g.length));
          for (let k = 0; k < n; k++) st.g.splice(g.i(st.g.length), 1);
          C._regrew = (C._regrew || 0) + n;
        }
        C._dirty = true;
      }
    }
    const gone = new Set(st ? st.g : []), ch = [];
    for (const it of dh.cln) {
      const g = gone.has(it.cid);
      if (!!it.gone !== g) {
        it.gone = g;
        ch.push(it);
      }
    }
    if (paint && ch.length && SX.decoHub.repaint) SX.decoHub.repaint(F, ch);
    C._home = s.home;
  };
  const kitGrids = s => {
    const k = SX.game.kit || s && s.kit;
    return k ? [ "bag", "rig" ].map(sl => k[sl] && k[sl].grid).filter(g => g && Array.isArray(g.list)) : [];
  };
  const allGrids = s => [ s.stash ].concat(kitGrids(s), SX.prog && SX.prog.safeGrids ? SX.prog.safeGrids(s) : []).filter(g => g && Array.isArray(g.list));
  C.carried = function() {
    const s = save();
    if (!s) return 0;
    let n = 0;
    for (const g of allGrids(s)) for (const e of g.list) if (e && e.it && C.isTrash(e.it)) n += I().qty(e.it);
    return n;
  };
  C.total = function() {
    const s = save();
    if (!s) return 0;
    let n = C.carried();
    for (const f of s.home && s.home.furn || []) {
      const g = f && (f.gridObj || f.grid);
      for (const e of g && g.list || []) if (e && e.it && C.isTrash(e.it)) n += I().qty(e.it);
    }
    for (const l of s.home && s.home.loose || []) for (const it of SX.home && SX.home.looseItems ? SX.home.looseItems(l) : l.items || []) if (it && C.isTrash(it)) n += I().qty(it);
    return n;
  };
  C.carriedBy = function() {
    const s = save(), o = {};
    if (!s) return o;
    for (const g of allGrids(s)) for (const e of g.list) if (e && e.it && C.isTrash(e.it)) o[e.it.name] = (o[e.it.name] || 0) + I().qty(e.it);
    return o;
  };
  C.give = function(name, n) {
    const s = save(), It = I();
    n = Math.max(1, n | 0);
    const inv = [];
    const k = SX.game.kit || {};
    if (k.bag && k.bag.grid) inv.push([ "bag", k.bag.grid ]);
    if (k.rig && k.rig.grid) inv.push([ "rig", k.rig.grid ]);
    const join = g => {
      const st = It.stackIn(g, name);
      if (st && It.qty(st) + n <= It.STACK_MAX) {
        st.n = It.qty(st) + n;
        return true;
      }
      return false;
    };
    const put = g => {
      const it = It.mk(name, {
        n
      });
      return !!(it && It.put(g, it));
    };
    for (const [w, g] of inv) if (join(g)) return w;
    for (const [w, g] of inv) if (put(g)) return w;
    if (s.stash && (join(s.stash) || put(s.stash))) return "stash";
    const it = It.mk(name, {
      n
    });
    if (it && SX.home && SX.home.dropLoose) {
      SX.home.dropLoose(it);
      return "floor";
    }
    return null;
  };
  C.dumpAt = function(f, prop) {
    const s = save(), It = I();
    if (!s) return false;
    if (C.job) return false;
    if (SX.net && SX.net.hold) {
      SX.audio.play("denied");
      SX.log("서버 답을 기다리는 중입니다 — 잠깐 뒤에 버려 주십시오");
      return false;
    }
    let n = 0;
    const by = {};
    for (const g of allGrids(s)) for (const e of g.list.slice()) if (e && e.it && C.isTrash(e.it)) {
      const q = It.qty(e.it);
      n += q;
      by[e.it.name] = (by[e.it.name] || 0) + q;
      It.take(g, e.it);
    }
    if (!n) {
      SX.audio.play("denied");
      SX.log("버릴 쓰레기가 없습니다 — 셸터 바닥을 청소하면 쓰레기가 가방에 모입니다");
      return false;
    }
    const p = SX.actors.player, at = prop ? {
      x: prop.x + prop.w / 2,
      y: prop.y + prop.h / 2
    } : p, kind = prop && prop.kind || f && f.kind || "trash";
    SX.audio.play(C.DUMP_SND[kind] || "trashThrow", {
      x: at.x,
      y: at.y,
      by
    });
    SX.log("🗑 쓰레기 " + n + "개를 버렸습니다 — " + listTxt(by), "good");
    if (p && prop) startToss(p, prop);
    if (SX.ui.hudDirty) SX.ui.hudDirty();
    SX.game.persist();
    return true;
  };
  const NAMES = [ "폐지", "빈 캔", "빈 병", "비닐", "잡쓰레기" ];
  function listTxt(by) {
    return NAMES.filter(k => by[k]).map(k => k + " " + by[k]).join(" · ");
  }
  C.target = function(F, p, ax, ay, best, bd, out) {
    const j = C.job;
    if (j) return j.big || j.toss || j.frozen ? null : {
      kind: "clean",
      x: j.cx,
      y: j.cy - .7,
      label: "청소하기",
      job: true
    };
    if (!F || !F.dh || !F.dh.cln || SX.home && SX.home.deco || SX.hub && (SX.hub.gd || SX.hub.ex)) return undefined;
    let pc = null, pd = C.REACH, po = null;
    for (const it of F.dh.cln) {
      if (!live(it) || shut(F, it)) continue;
      const q = posOf(it), d = Math.hypot(q.x - ax, q.y - ay);
      const o = out && p && Math.hypot(q.x - p.x, q.y - p.y + .2) < C.REACH + .3 ? {
        kind: "clean",
        piece: it,
        x: q.x,
        y: q.y - .7,
        label: "청소하기"
      } : null;
      if (o) {
        const hw = Math.max(.25, (it.w || 0) / TS / 2 + .05), hh = Math.max(.25, (it.h || 0) / TS / 2 + .05);
        out.push({
          t: o,
          b: [ it.seg ? [ q.x - hw, q.y - 1, q.x + hw, q.y + .1 ] : [ q.x - hw, q.y - hh, q.x + hw, q.y + hh ] ],
          flat: true
        });
      }
      if (d < pd) {
        pd = d;
        pc = it;
        po = o;
      }
    }
    if (!pc) return undefined;
    if (best && (best.kind === "cont" || best.kind === "door" || pd >= (bd == null ? 9 : bd) - .3)) return undefined;
    const q = posOf(pc);
    return po || {
      kind: "clean",
      piece: pc,
      x: q.x,
      y: q.y - .7,
      label: "청소하기"
    };
  };
  function spotOf(F, it) {
    const q0 = posOf(it);
    return F.dh.cln.filter(o => live(o) && Math.hypot(posOf(o).x - q0.x, posOf(o).y - q0.y) <= C.SPOT_R).sort((a, b) => Math.hypot(posOf(a).x - q0.x, posOf(a).y - q0.y) - Math.hypot(posOf(b).x - q0.x, posOf(b).y - q0.y)).slice(0, C.SPOT_MAX);
  }
  const howOf = L => L.some(o => o.tg.give && o.tg.how === "pick") ? "pick" : L.some(o => o.tg.how === "tidy") ? "tidy" : L.some(o => o.tg.how === "wall") ? "wall" : L.some(o => o.tg.how === "wipe") ? "wipe" : "sweep";
  C.howOf = howOf;
  const AIM = [ Math.PI / 2, 0, -Math.PI / 2, Math.PI ];
  function face(p, x, y) {
    const dx = x - p.x, dy = y - p.y;
    p.dir = Math.abs(dx) > Math.abs(dy) * .9 ? dx > 0 ? 1 : 3 : dy > 0 ? 0 : 2;
    p.aim = p.dir === 1 ? 0 : p.dir === 3 ? Math.PI : p.dir === 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  function newJob(F, L, big) {
    const p = SX.actors.player, c = L.reduce((a, o) => {
      const q = posOf(o);
      a.x += q.x / L.length;
      a.y += q.y / L.length;
      return a;
    }, {
      x: 0,
      y: 0
    });
    const j = {
      big: !!big,
      list: L,
      k: 0,
      t: 0,
      len: big ? Math.min(C.BIG_MAX, C.BIG_T0 + C.BIG_PER * L.length) : C.SPOT_T,
      cx: c.x,
      cy: c.y,
      how: howOf(L),
      level: SX.hub.level,
      got: {},
      where: {},
      marks: {
        wipe: 0,
        sweep: 0,
        tidy: 0,
        wall: 0
      },
      sT: .05,
      hw: C.job ? C.job.hw : !!p.hideWeapon
    };
    p.reload = null;
    p.use = null;
    p.moving = false;
    p.hideWeapon = true;
    if (!big) {
      face(p, c.x, c.y);
      if (j.how === "wall") {
        p.dir = 2;
        p.aim = AIM[2];
      }
      j.dir = p.dir;
    }
    return j;
  }
  C.busy = () => !!C.job;
  C.start = function(t) {
    if (C.job || !t || !t.piece) return false;
    const F = homeF(), p = SX.actors.player;
    if (!F || !p || SX.hub.gd || SX.hub.ex) return false;
    if (C.total() >= C.CARRY_MAX) {
      SX.audio.play("denied");
      SX.log("쓰레기를 너무 많이 들고 있습니다 — 쓰레기 더미나 쓰레기통에 먼저 버려 주십시오", "warn");
      return false;
    }
    const L = spotOf(F, t.piece);
    if (!L.length) return false;
    C.job = newJob(F, L, false);
    return true;
  };
  C.roomOf = function(F, x, y) {
    const R = F.rooms || [], tx = Math.floor(x), ty = Math.floor(y);
    let k = R.findIndex(r => tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1);
    if (k >= 0) return k;
    let bd = 1e9;
    R.forEach((r, i) => {
      const d = Math.hypot(Math.max(r.x0 - x, 0, x - r.x1 - 1), Math.max(r.y0 - y, 0, y - r.y1 - 1));
      if (d < bd) {
        bd = d;
        k = i;
      }
    });
    return k;
  };
  C.roomStats = function(F) {
    F = F || homeF();
    const R = F && F.rooms || [], out = R.map((r, i) => ({
      i,
      name: r.name || "방",
      trash: 0,
      tidy: 0,
      mark: 0,
      wall: 0,
      list: []
    }));
    for (const it of listOf(F)) {
      if (it.gone || shut(F, it)) continue;
      const q = posOf(it), k = C.roomOf(F, q.x, q.y);
      if (k < 0 || !out[k]) continue;
      const o = out[k];
      o.list.push(it);
      if (it.tg.give) o.trash += it.tg.n; else if (it.tg.how === "tidy") o.tidy++; else if (it.tg.how === "wall") o.wall++; else o.mark++;
    }
    return out;
  };
  C.left = F => {
    F = F || homeF();
    return listOf(F).filter(it => !it.gone && !shut(F, it));
  };
  C.bigTime = n => Math.min(C.BIG_MAX, C.BIG_T0 + C.BIG_PER * n);
  C.startBig = function(room) {
    const F = homeF(), p = SX.actors.player;
    if (!F || !p || C.job || SX.hub.gd || SX.hub.ex) return false;
    if (C.total() >= C.CARRY_MAX) {
      SX.audio.play("denied");
      SX.log("쓰레기를 너무 많이 들고 있습니다 — 쓰레기 더미나 쓰레기통에 먼저 버려 주십시오", "warn");
      return false;
    }
    const all = room == null || room === "all";
    let L, name;
    if (all) {
      L = C.left(F);
      name = "집 전체";
    } else {
      const k = room | 0, st = C.roomStats(F)[k];
      if (!st || !st.list.length) {
        SX.audio.play("denied");
        SX.log("이 방은 깨끗합니다");
        return false;
      }
      if (k !== C.roomOf(F, p.x, p.y)) {
        SX.audio.play("denied");
        SX.log("대청소는 그 방에 들어가서 하시면 됩니다 — " + st.name);
        return false;
      }
      L = st.list;
      name = st.name;
    }
    if (!L.length) {
      SX.audio.play("denied");
      SX.log("집이 깨끗합니다");
      return false;
    }
    L = L.slice().sort((a, b) => Math.hypot(posOf(a).x - p.x, posOf(a).y - p.y) - Math.hypot(posOf(b).x - p.x, posOf(b).y - p.y));
    C.job = newJob(F, L, true);
    C.job.room = name;
    C.job.all = all;
    C.job.pend = {};
    SX.log("🧹 " + name + " 대청소를 시작합니다 — 약 " + Math.round(C.job.len) + "초 · 움직이면 멈춥니다");
    return true;
  };
  function startToss(p, prop) {
    C.job = {
      toss: true,
      t: 0,
      len: .9,
      level: SX.hub.level,
      list: [],
      hw: !!p.hideWeapon,
      cx: p.x,
      cy: p.y
    };
    p.hideWeapon = true;
    face(p, prop.x + prop.w / 2, prop.y + prop.h / 2);
    C.job.dir = p.dir;
  }
  C.stop = function(quiet) {
    const j = C.job;
    if (!j) return;
    C.job = null;
    const p = SX.actors.player;
    if (p) {
      p.armPose = null;
      p.squat = 0;
      p.cleanTool = null;
      p.hideWeapon = j.hw;
    }
    if (j.big) {
      flush(j);
      if (!quiet && j.k < j.list.length) {
        SX.log("🧹 대청소를 멈췄습니다 — " + report(j) + whereTxt(j));
        SX.game.persist();
      }
    }
  };
  function takeOne(F, j, it, paint) {
    if (it.gone) return;
    const s = save(), st = state(s.home, F.dh.clnTier, true);
    it.gone = true;
    if (!st.g.includes(it.cid)) st.g.push(it.cid);
    if (it.tg.give) {
      j.got[it.tg.give] = (j.got[it.tg.give] || 0) + it.tg.n;
      if (j.pend) j.pend[it.tg.give] = (j.pend[it.tg.give] || 0) + it.tg.n; else {
        const w = C.give(it.tg.give, it.tg.n);
        if (w) j.where[w] = (j.where[w] || 0) + it.tg.n;
      }
    } else j.marks[it.tg.how === "tidy" ? "tidy" : it.tg.how === "wall" ? "wall" : it.tg.how === "wipe" ? "wipe" : "sweep"]++;
    if (paint) SX.decoHub.repaint(F, [ it ]);
  }
  function flush(j) {
    const P = j.pend;
    if (!P) return;
    for (const nm of Object.keys(P)) {
      if (!P[nm]) continue;
      const w = C.give(nm, P[nm]);
      if (w) j.where[w] = (j.where[w] || 0) + P[nm];
      P[nm] = 0;
    }
  }
  function report(j) {
    const M = j.marks, parts = [];
    const got = listTxt(j.got);
    if (got) parts.push(got);
    if (M.tidy) parts.push("정리 " + M.tidy + "개");
    if (M.wipe) parts.push("얼룩 " + M.wipe + "군데");
    if (M.sweep) parts.push("먼지 " + M.sweep + "군데");
    if (M.wall) parts.push("벽 " + M.wall + "군데");
    return parts.join(" · ");
  }
  function whereTxt(j) {
    const w = j.where;
    if (!Object.keys(w).length) return "";
    if (w.floor) return " — 가방 · 보관함이 가득 차 발밑에 두었습니다";
    if (w.stash) return w.bag || w.rig ? " — 가방이 가득 차 나머지는 보관함에 넣었습니다" : " — 가방이 가득 차 보관함에 넣었습니다";
    return w.rig && !w.bag ? " → 리그" : " → 가방";
  }
  const MAT = {
    cloth: [ "sock", "slippers", "towel", "shirt", "laundry", "cushion", "hat", "glove", "shoes", "mat", "umbrella", "umbLean", "earMuff", "gymBag", "sandbags", "sackFlat", "rice", "tarp", "rope", "ropeCoil", "netBag", "band", "matRoll", "rubber" ],
    paper: [ "book", "magazine", "cards", "tissue", "bookStack" ],
    card: [ "boxOne", "boxStack", "ramenBox" ],
    wood: [ "plank", "planksPile", "pallet", "palletLean", "stick", "broom", "mop", "crateSm", "ammoCrate", "rods", "pencil", "reed" ],
    metal: [ "wrench", "screwdriver", "hammer", "nails", "coin", "key", "spoon", "plateDisc", "dumbbell", "dumbPair", "kettle", "kettleCan", "jerry", "toolbox", "extinguisher", "ladder", "wheel", "drumSm", "hanger", "ammoBox", "mag", "chairFold", "cableRun", "cableDrop" ],
    glass: [ "mug", "glasses", "platesLean", "candle" ],
    plant: [ "potPlant", "flower", "cabbage", "weed", "tuft" ]
  };
  const MAT_OF = {};
  for (const m of Object.keys(MAT)) for (const k of MAT[m]) MAT_OF[k] = m;
  const MAT_SND = {
    cloth: "rustle",
    paper: "paper",
    card: "box",
    wood: "woodTap",
    metal: "gearRattle",
    glass: "bottle",
    plant: "harvestLeaf",
    plastic: "pickup"
  };
  const MAT_COL = {
    cloth: [ "#5a7aa0", "#2e3e52" ],
    paper: [ "#e8e4d8", "#8a867c" ],
    card: [ "#a57c4f", "#5a3e22" ],
    wood: [ "#8a6a42", "#4a3420" ],
    metal: [ "#9aa1a8", "#4a4e54" ],
    glass: [ "#9cc8dc", "#3a6a7a" ],
    plant: [ "#5a8a3a", "#2a4a1a" ],
    plastic: [ "#c8b048", "#6a5a1e" ]
  };
  C.matOf = k => MAT_OF[k] || "plastic";
  const TRASH_SND = {
    폐지: "trashPaper",
    "빈 캔": "trashCan",
    "빈 병": "trashBottle",
    비닐: "trashBag",
    잡쓰레기: "trashMisc"
  };
  const sndOf = it => !it ? "pickup" : it.tg.give ? TRASH_SND[it.tg.give] || "trashMisc" : it.tg.how === "tidy" ? MAT_SND[C.matOf(it.k)] : it.tg.how === "sweep" ? "cleanSweep" : "cleanWipe";
  C.sndOf = sndOf;
  function soundOf(j, at) {
    const n = Object.keys(j.got), S = SX.audio, o = {
      x: at.x,
      y: at.y,
      vol: .85
    };
    if (n.length) {
      S.play(TRASH_SND[n[0]] || "trashMisc", o);
      if (n[1]) S.play(TRASH_SND[n[1]] || "trashMisc", Object.assign({}, o, {
        delay: .18,
        vol: .6
      }));
      S.play("trashBag", Object.assign({}, o, {
        delay: .32,
        vol: .45
      }));
    } else if (j.marks.tidy) {
      const t = j.list.find(q => q.tg.how === "tidy");
      S.play(sndOf(t), o);
    }
  }
  function finishSpot(F, j) {
    const p = SX.actors.player;
    for (const it of j.list) takeOne(F, j, it, false);
    SX.decoHub.repaint(F, j.list);
    soundOf(j, {
      x: j.cx,
      y: j.cy
    });
    const got = listTxt(j.got), M = j.marks;
    SX.log(got ? "🧹 치웠습니다 — " + got + whereTxt(j) : M.tidy ? "🧺 정리했습니다" : M.wall ? "🧽 벽을 닦았습니다" : M.wipe ? "🧽 얼룩을 닦았습니다" : "🧹 먼지를 쓸었습니다");
    tip();
    if (SX.ui.hudDirty) SX.ui.hudDirty();
    SX.game.persist();
    const hw = j.hw;
    C.job = null;
    if (SX.input.held("interact") && C.total() < C.CARRY_MAX) {
      let pc = null, pd = C.REACH + .35;
      const ax = p.x + Math.cos(p.aim) * .3, ay = p.y - .2 + Math.sin(p.aim) * .3;
      for (const it of F.dh.cln) {
        if (!live(it)) continue;
        const q = posOf(it), d = Math.min(Math.hypot(q.x - ax, q.y - ay), Math.hypot(q.x - p.x, q.y - p.y));
        if (d < pd) {
          pd = d;
          pc = it;
        }
      }
      if (pc) {
        C.job = newJob(F, spotOf(F, pc), false);
        C.job.hw = hw;
        return;
      }
    }
    C.job = j;
    C.stop(true);
  }
  function finishBig(F, j) {
    flush(j);
    soundOf(j, SX.actors.player);
    SX.log("🧹 " + (j.room || "방") + " 대청소를 마쳤습니다 — " + report(j) + whereTxt(j), "good");
    tip(true);
    C.stop(true);
    if (SX.ui.hudDirty) SX.ui.hudDirty();
    SX.game.persist();
  }
  function tip(big) {
    const s = save(), c = s && s.home && s.home.cln;
    if (!c || c.tip || big) return;
    c.tip = 1;
    SX.log("💡 집 전체를 한 번에 치우려면 단말기([" + SX.label("terminal") + "]) 「집 청소」에서 대청소를 누르시면 됩니다 · 모은 쓰레기는 쓰레기 더미나 쓰레기통에서 [" + SX.label("interact") + "] 로 버립니다");
  }
  const MOVE = [ "up", "down", "left", "right" ];
  C.update = function(dt, F, ctl) {
    const s = save();
    if (!s || !F) return;
    if (C._home && C._home !== s.home) {
      const j = C.job;
      if (j && !j.toss) C.stop(true);
      C.sync(F, false, true);
    }
    C._home = s.home;
    if (C._dirty) {
      C._dirty = false;
      SX.game.persist();
    }
    if (C._regrew) {
      SX.log("🏚 판에 다녀온 사이 셸터 바닥에 쓰레기 · 얼룩이 " + C._regrew + "군데 다시 생겼습니다");
      C._regrew = 0;
    }
    C._lt = (C._lt || 0) - dt;
    if (C._lt <= 0) {
      C._lt = .5;
      dumpLabels(F);
    }
    const j = C.job;
    if (!j) return;
    const p = SX.actors.player;
    if (!p || SX.hub.level !== j.level || SX.home && SX.home.deco) {
      C.stop(true);
      return;
    }
    if (j.frozen) {
      const z = j.frozen;
      pose(p, j, z.how, z.u, z.ph, z.give ? {
        tg: {
          give: z.give
        }
      } : null, z.k);
      return;
    }
    if (j.toss) {
      j.t += dt;
      pose(p, j, "toss", j.t / j.len, j.t);
      if (j.t >= j.len) C.stop(true);
      return;
    }
    if (!j.big) {
      if (!SX.input.held("interact") || SX.ui.isOpen()) {
        C.stop(true);
        return;
      }
    } else if (ctl && MOVE.some(k => SX.input.held(k))) {
      C.stop();
      return;
    }
    const hold = !!(SX.net && SX.net.hold);
    if (!hold || j.t < j.len - .05) j.t = Math.min(j.len, j.t + dt);
    if (!j.big) {
      const it0 = j.list.find(q => q.tg.how === "tidy");
      pose(p, j, j.how, j.t / j.len, j.t, j.how === "tidy" ? it0 : null, it0 && it0.k);
      j.sT -= dt;
      if (j.sT <= 0) {
        j.sT = j.how === "pick" || j.how === "tidy" ? 9 : j.how === "wipe" || j.how === "wall" ? .5 : .42;
        if (j.how !== "pick" && j.how !== "tidy") SX.audio.play(j.how === "sweep" ? "cleanSweep" : "cleanWipe", {
          x: j.cx,
          y: j.cy,
          vol: .75
        });
      }
      if ((j.how === "pick" || j.how === "tidy") && !j.pk && j.t / j.len > .45) {
        j.pk = 1;
        SX.audio.play(sndOf(j.list.find(q => q.tg.give) || it0 || j.list[0]), {
          x: j.cx,
          y: j.cy,
          vol: .6
        });
      }
      if (j.t >= j.len && !hold) finishSpot(F, j);
      return;
    }
    const n = j.list.length, per = j.len / n, cyc = Math.floor(j.t / C.BIG_CYCLE), u = j.t % C.BIG_CYCLE / C.BIG_CYCLE;
    if (j.cyc !== cyc) {
      j.cyc = cyc;
      const cur = j.list[Math.min(n - 1, j.k)], rest = j.list.slice(j.k);
      const hows = [ "sweep", "pick", "wipe", "tidy", "wall" ].filter(h => rest.some(o => (o.tg.give && o.tg.how === "pick" ? "pick" : o.tg.how) === h));
      j.bh = hows.length ? hows[cyc % hows.length] : "sweep";
      j.bit = rest.find(o => o.tg.how === "tidy") || null;
      j.bgv = rest.find(o => o.tg.give) || null;
      if (cur) {
        const q = posOf(cur);
        face(p, q.x, q.y);
        j.dir = p.dir;
      }
      if (j.bh === "wall") j.dir = 2;
    }
    pose(p, j, j.bh, u, j.t, j.bh === "pick" ? j.bgv : j.bit, j.bit && j.bit.k);
    j.sT -= dt;
    if (j.sT <= 0) {
      j.sT = j.bh === "wipe" || j.bh === "wall" ? .55 : .45;
      if (j.bh === "sweep" || j.bh === "wipe" || j.bh === "wall") SX.audio.play(j.bh === "sweep" ? "cleanSweep" : "cleanWipe", {
        x: p.x,
        y: p.y,
        vol: .7
      });
    }
    if (!hold) {
      const due = Math.min(n, Math.floor(j.t / per + 1e-6)), done = [];
      while (j.k < due) {
        const it = j.list[j.k++];
        takeOne(F, j, it, false);
        done.push(it);
      }
      if (done.length) {
        SX.decoHub.repaint(F, done);
        const it = done.find(o => o.tg.give || o.tg.how === "tidy");
        if (it && (j.sndT || 0) <= j.t) {
          j.sndT = j.t + .3;
          SX.audio.play(sndOf(it), {
            x: posOf(it).x,
            y: posOf(it).y,
            vol: .5
          });
        }
      }
      if (j.k >= n) {
        finishBig(F, j);
      }
    }
  };
  function dumpLabels(F) {
    const n = C.carried();
    for (const p of F.props) if (p.furn && p.npc && C.isDump(p.furn)) p.npc.name = SX.home.FURN[p.furn.kind].name + (n ? " — 버리기(쓰레기 " + n + "개)" : " — 버릴 쓰레기가 없습니다");
  }
  const lerp = (a, b, t) => [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t ];
  const POSE = {
    sweep(u, side, ph) {
      const o = Math.sin(ph * Math.PI * 2 * 1.7), r = Math.round(o * 2);
      return side ? {
        n: [ 6 + r, -14 ],
        f: [ 1, -20 ],
        sq: .12,
        tool: "broom",
        hx: 15 + Math.round(o * 4),
        hy: 0
      } : {
        n: [ -3 + r, -13 ],
        f: [ 5, -19 ],
        sq: .12,
        tool: "broom",
        hx: -9 + Math.round(o * 4),
        hy: 2
      };
    },
    pick(u, side) {
      const a = u < .45 ? u / .45 : u < .62 ? 1 : 1 - (u - .62) / .38, up = u < .62 ? 0 : (u - .62) / .38, hold = u > .5 && u < .92;
      const n = side ? up ? lerp([ 6, -11 ], [ -2, -14 ], up) : lerp([ 6, -14 ], [ 6, -11 ], a) : up ? lerp([ -6, -11 ], [ 3, -14 ], up) : lerp([ -5, -14 ], [ -6, -11 ], a);
      return {
        n,
        f: side ? [ -4, -11 ] : [ 6, -11 ],
        sq: a,
        tool: "bag",
        hold
      };
    },
    tidy(u, side) {
      const a = u < .4 ? u / .4 : u < .55 ? 1 : 1 - (u - .55) / .45, up = u < .55 ? 0 : (u - .55) / .45, hold = u > .42;
      const n = side ? up ? lerp([ 7, -11 ], [ 6, -18 ], up) : lerp([ 5, -15 ], [ 7, -11 ], a) : up ? lerp([ -4, -11 ], [ -3, -18 ], up) : lerp([ -4, -15 ], [ -4, -11 ], a);
      const f = side ? up ? lerp([ 4, -11 ], [ 3, -18 ], up) : lerp([ 2, -15 ], [ 4, -11 ], a) : up ? lerp([ 4, -11 ], [ 3, -18 ], up) : lerp([ 4, -15 ], [ 4, -11 ], a);
      return {
        n,
        f,
        sq: a,
        tool: hold ? "carry" : null,
        hold
      };
    },
    wipe(u, side, ph) {
      const a = ph * Math.PI * 2 * 1.3, cx = Math.round(Math.cos(a) * (side ? 2 : 3)), cy = Math.round(Math.sin(a));
      return side ? {
        n: [ 6 + cx, -11 + cy ],
        f: [ 3, -13 ],
        sq: 1,
        tool: "rag"
      } : {
        n: [ -5 + cx, -11 + cy ],
        f: [ 5, -13 ],
        sq: 1,
        tool: "rag"
      };
    },
    wall(u, side, ph) {
      const a = ph * Math.PI * 2 * 1.2, cx = Math.round(Math.cos(a) * 3), cy = Math.round(Math.sin(a) * 2);
      return side ? {
        n: [ 9 + Math.round(cx / 2), -27 + cy ],
        f: [ 7, -22 ],
        sq: 0,
        tool: "ragHigh",
        back: true
      } : {
        n: [ -5 + cx, -29 + cy ],
        f: [ 6, -24 ],
        sq: 0,
        tool: "ragHigh",
        back: true
      };
    },
    toss(u, side) {
      const t = Math.min(1, u / .5), th = Math.max(0, (u - .5) / .5);
      const n = side ? u < .5 ? lerp([ 3, -14 ], [ -3, -30 ], t) : lerp([ -3, -30 ], [ 12, -20 ], th) : u < .5 ? lerp([ -4, -14 ], [ -7, -31 ], t) : lerp([ -7, -31 ], [ -3, -22 ], th);
      return {
        n,
        f: side ? [ 3, -15 ] : [ 6, -17 ],
        sq: u > .5 ? .15 * (1 - th) : 0,
        tool: u < .6 ? "bagHand" : null,
        back: true
      };
    }
  };
  C.POSE = POSE;
  function pose(p, j, how, u, ph, cur, kind) {
    if (j.dir != null && p.dir !== j.dir) {
      p.dir = j.dir;
      p.aim = AIM[j.dir];
    }
    const dir = p.dir, side = dir === 1 || dir === 3, m = dir === 3 ? -1 : 1, q = POSE[how] ? POSE[how](u, side, ph) : POSE.sweep(u, side, ph);
    p.frame = 0;
    p.moving = false;
    p.squat = q.sq || 0;
    p.armPose = {
      n: [ Math.round(q.n[0] * m), Math.round(q.n[1]) ],
      f: [ Math.round(q.f[0] * m), Math.round(q.f[1]) ],
      back: !!q.back
    };
    const give = how === "pick" ? cur && cur.tg.give || ((j.list.find(o => o.tg.give) || {}).tg || {}).give : null;
    p.cleanTool = q.tool ? {
      kind: q.tool,
      m,
      hx: q.hx != null ? Math.round(q.hx * m) : 0,
      hy: q.hy || 0,
      item: q.hold ? give : null,
      mat: how === "tidy" ? C.matOf(kind || cur && cur.k || "") : null
    } : null;
  }
  C.poseAt = function(p, how, u, ph, give, dir, kind) {
    const hw = C.job ? C.job.hw : !!p.hideWeapon;
    C.stop(true);
    C.job = {
      frozen: {
        how,
        u,
        ph,
        give,
        k: kind
      },
      dir: dir != null ? dir : p.dir,
      level: SX.hub.level,
      list: [],
      hw,
      cx: p.x,
      cy: p.y,
      t: 0,
      len: 1
    };
    p.hideWeapon = true;
    pose(p, C.job, how, u, ph, give ? {
      tg: {
        give
      }
    } : null, kind);
  };
  const BROOM = {
    stick: "#b89a62",
    stickHi: "#d8c08a",
    stickLine: "#5a3a22",
    straw: "#c8a050",
    strawDk: "#a8803a",
    strawLine: "#6a4a1e",
    band: "#c83a2a",
    bandLine: "#7a1a14"
  };
  const ITEM_C = {
    폐지: [ "#e8e4d8", "#8a867c" ],
    "빈 캔": [ "#c4392f", "#6a1a14" ],
    "빈 병": [ "#3f8a4a", "#1a4a24" ],
    비닐: [ "#d8dcdc", "#7a8084" ],
    잡쓰레기: [ "#c8803a", "#5a3a1a" ]
  };
  const R = (ctx, x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  function stick(ctx, x0, y0, x1, y1) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), P = [];
    for (let k = 0; k <= n; k++) P.push([ Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n) ]);
    for (const [x, y] of P) R(ctx, x - 1, y - 1, 3, 3, BROOM.stickLine);
    for (const [x, y] of P) R(ctx, x, y, 1, 1, BROOM.stick);
    R(ctx, P[0][0], P[0][1], 1, 1, BROOM.stickHi);
  }
  function broomHead(ctx, x, y, m) {
    const rows = [ [ -6, 3, "band" ], [ -5, 5, "band" ], [ -4, 5, "straw" ], [ -3, 6, "straw" ], [ -2, 7, "straw" ], [ -1, 7, "straw" ] ];
    for (const [dy, w] of rows) R(ctx, x - (w >> 1) - 1, y + dy - 1, w + 2, 3, rows[0] && dy < -4 ? BROOM.bandLine : BROOM.strawLine);
    R(ctx, x - 4, y, 9, 1, BROOM.strawLine);
    for (const [dy, w, k] of rows) {
      const x0 = x - (w >> 1);
      for (let i = 0; i < w; i++) R(ctx, x0 + i, y + dy, 1, 1, k === "band" ? BROOM.band : (i + dy) % 2 ? BROOM.strawDk : BROOM.straw);
    }
    R(ctx, x - (m > 0 ? 2 : -1), y - 4, 1, 1, "#e0c070");
  }
  function bag(ctx, x, y) {
    const rows = [ [ 0, 2 ], [ 1, 3 ], [ 2, 5 ], [ 3, 6 ], [ 4, 7 ], [ 5, 7 ], [ 6, 7 ], [ 7, 6 ], [ 8, 5 ] ];
    for (const [dy, w] of rows) R(ctx, x - (w >> 1) - 1, y + dy - 1, w + 2, 3, "#121216");
    for (const [dy, w] of rows) R(ctx, x - (w >> 1), y + dy, w, 1, dy < 2 ? "#3a3a40" : "#26262c");
    R(ctx, x - 2, y + 4, 1, 3, "#4a4a54");
    R(ctx, x + 1, y + 5, 2, 1, "#3e3e46");
    R(ctx, x - 1, y + 8, 2, 1, "#1c1c22");
    R(ctx, x - 2, y + 2, 1, 1, "#e8e4d8");
    R(ctx, x + 1, y + 2, 1, 1, "#c4392f");
    R(ctx, x, y + 1, 1, 1, "#5a5a64");
  }
  function rag(ctx, x, y) {
    R(ctx, x - 4, y - 1, 8, 4, "#5a4a2e");
    R(ctx, x - 3, y, 6, 2, "#c8b890");
    R(ctx, x - 3, y + 1, 3, 1, "#a89870");
    R(ctx, x + 1, y, 1, 1, "#e0d4b0");
  }
  function carry(ctx, x, y, mat) {
    const c = MAT_COL[mat] || MAT_COL.plastic;
    R(ctx, x - 4, y - 3, 9, 7, c[1]);
    R(ctx, x - 3, y - 2, 7, 5, c[0]);
    R(ctx, x - 2, y - 2, 5, 1, "#f0ece0");
    R(ctx, x, y - 1, 1, 4, c[1]);
  }
  function reach(hands, k) {
    const h = hands[k], S = hands.S && hands.S[k], PO = SX.pose;
    if (!S || !PO) return h;
    const L = PO.UP + PO.LOW, dx = h[0] - S[0], dy = h[1] - S[1], d = Math.hypot(dx, dy);
    return d > L ? [ S[0] + dx * L / d, S[1] + dy * L / d ] : h;
  }
  C.drawTool = function(ctx, a, hands, px, py, dir, pre, back) {
    const t = a.cleanTool;
    if (!t || !hands || !hands.n) return;
    const n = reach(hands, "n"), f = reach(hands, "f"), high = t.kind === "bagHand" && n[1] < py - 26 || t.kind === "ragHigh";
    if (pre ? high : back && !high) return;
    ctx.save();
    const behind = !!pre;
    if (t.kind === "broom") {
      const hx = px + t.hx, hy = py + t.hy - 1, dx = f[0] - hx, dy = f[1] - hy, d = Math.hypot(dx, dy) || 1, tx = f[0] + dx / d * 5, ty = f[1] + dy / d * 5;
      stick(ctx, tx, ty, hx, hy - 6);
      broomHead(ctx, hx, hy, t.m);
    } else if (t.kind === "bag" || t.kind === "bagHand") {
      const h = t.kind === "bag" ? f : n;
      bag(ctx, h[0], h[1] + 1);
      if (t.item) {
        const c = ITEM_C[t.item] || ITEM_C["잡쓰레기"], ix = n[0] + t.m, iy = n[1] + 2;
        R(ctx, ix - 3, iy - 1, 6, 4, c[1]);
        R(ctx, ix - 2, iy, 4, 2, c[0]);
        R(ctx, ix - 2, iy, 1, 1, "#ffffff");
      }
    } else if (t.kind === "rag") {
      rag(ctx, n[0], n[1] + 2);
      if (!behind) for (let k = 0; k < 3; k++) R(ctx, n[0] - 6 + k * 5, py + 1, 2, 1, "#a8b8c4");
    } else if (t.kind === "ragHigh") {
      rag(ctx, n[0], n[1] - 1);
    } else if (t.kind === "carry") {
      carry(ctx, (n[0] + f[0]) / 2, (n[1] + f[1]) / 2 - 2, t.mat);
    }
    ctx.restore();
  };
  C.draw = function(ctx, cam, F) {
    const j = C.job;
    if (!j || j.toss || j.frozen) return;
    const p = SX.actors.player, big = j.big;
    const x = Math.round((big ? p.x : j.cx) * TS - cam.x), y = Math.round((big ? p.y - 1.75 : j.cy) * TS - cam.y);
    const k = Math.min(1, j.t / j.len), N = 20, r = 8;
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + i / N * Math.PI * 2, bx = Math.round(x + Math.cos(a) * r), by = Math.round(y + Math.sin(a) * r);
      ctx.fillStyle = "#0e1014";
      ctx.fillRect(bx - 1, by - 1, 3, 3);
      ctx.fillStyle = i / N < k ? "#ffd24a" : "#5a5e66";
      ctx.fillRect(bx, by, 2, 2);
      if (i / N < k) {
        ctx.fillStyle = "#fff4c0";
        ctx.fillRect(bx, by, 1, 1);
      }
    }
    if (big) {
      ctx.font = "12px Galmuri7";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const s = "대청소 " + j.k + "/" + j.list.length;
      ctx.fillStyle = "#000";
      ctx.fillText(s, x + 1, y - r - 2);
      ctx.fillStyle = "#ffd24a";
      ctx.fillText(s, x, y - r - 3);
    }
  };
  C.termOk = () => !!homeF();
  C.term = function(scr, rerender) {
    const F = homeF(), esc = SX.esc, p = SX.actors.player;
    if (!F) {
      scr.innerHTML = `<h3><span class="led"></span> 청소</h3><p class="small">셸터에서 합니다.</p>`;
      return;
    }
    const st = C.roomStats(F), cur = p ? C.roomOf(F, p.x, p.y) : -1, by = C.carriedBy(), have = listTxt(by), heap = F.props.some(q => q.furn && C.isDump(q.furn));
    const tier = SX.home && SX.home.tier ? SX.home.tier().name : "셸터", K = "[" + SX.label("interact") + "]", nAll = C.left(F).length;
    const rows = st.filter(r => {
      const R = F.rooms && F.rooms[r.i];
      return !(R && F.hideAt && F.hideAt(R.x0, R.y0));
    }).map(r => {
      const n = r.list.length, here = r.i === cur;
      const b = !n ? `<span class="small">깨끗합니다</span>` : here ? `<button class="mini" data-cln="${r.i}">이 방만 — 약 ${Math.round(C.bigTime(n))}초</button>` : `<span class="small">—</span>`;
      return `<div class="row" style="justify-content:space-between;gap:calc(var(--u)*6)"><span>${esc(r.name)}${here ? " <b>(지금 있는 방)</b>" : ""}</span><span class="small">쓰레기 ${r.trash} · 정리 ${r.tidy} · 얼룩·먼지 ${r.mark} · 벽 ${r.wall}</span>${b}</div>`;
    }).join("");
    const big = nAll ? `<button class="big" data-cln="all">집 전체 대청소 — 약 ${Math.round(C.bigTime(nAll))}초</button>` : `<p><b>집이 깨끗합니다</b></p>`;
    scr.innerHTML = `<h3><span class="led"></span> 청소 — ${esc(tier)}</h3>\n      <p class="small">🧹 바닥 · 벽을 치웁니다 ${SX.ui.qm ? SX.ui.qm(`바닥의 쓰레기 · 물건 · 얼룩 · 먼지와 벽의 때를 치웁니다(가구 · 가구 위 작은 물건 · 벽에 건 것은 그대로).<br>가까이 가서 ${esc(K)} 를 누르고 있으면 둘레를 한 군데씩 치웁니다.<br>대청소는 가구 밑까지 한 번에 치웁니다(움직이면 멈춥니다).`) : ""}</p>\n      ${big}\n      <div class="col">${rows || `<p class="small">치울 방이 없습니다.</p>`}</div>\n      <p class="small">${C.REGROW > 0 ? "판을 한 번 다녀올 때마다 쓰레기 · 얼룩이 " + C.REGROW + "군데쯤 다시 생깁니다(처음보다 많아지지는 않습니다)." : "치운 곳은 깨끗하게 남습니다."}</p>\n      <p>가진 쓰레기: ${have ? esc(have) + ` — 쓰레기 더미나 쓰레기통에서 ${esc(K)} 로 버리시면 됩니다` : "없습니다"}${heap ? "" : `<br><span class="small">쓰레기 더미 · 쓰레기통은 장터 가구점 「쓰레기통」에서 삽니다.</span>`}</p>`;
    scr.onclick = e => {
      const b = e.target.closest("[data-cln]");
      if (!b) return;
      SX.audio.play("click");
      if (C.startBig(b.dataset.cln === "all" ? "all" : +b.dataset.cln)) SX.ui.closePanel(); else rerender();
    };
  };
})(window.SX);
