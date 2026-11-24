"use strict";

(function(SX) {
  const TS = SX.TS, A = SX.actors, I = SX.items;
  const canvas = document.getElementById("screen");
  const low = SX.art.mk(960, 540), lctx = low.getContext("2d");
  if (SX.art.OFF) SX.art.OFF.delete(low);
  const sctx = canvas.getContext("2d");
  const V = SX.view = {
    ctx: lctx,
    vw: 960,
    vh: 540,
    scale: 2,
    cam: {
      x: 0,
      y: 0
    },
    shakeA: 0,
    shx: 0,
    shy: 0,
    dt: 0,
    mouseWorldX: 0,
    mouseWorldY: 0,
    fadeA: 0
  };
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = Math.floor(innerWidth * dpr), H = Math.floor(innerHeight * dpr);
    const base = Math.max(1, Math.round(H / 540)), s = Math.max(1, Math.min(base + 3, base + (V.zoomOff | 0)));
    V.baseScale = base;
    V.scale = s;
    V.vw = Math.ceil(W / s);
    V.vh = Math.ceil(H / s);
    low.width = V.vw + 1;
    low.height = V.vh + 1;
    canvas.width = W;
    canvas.height = H;
    const k = Math.max(1, Math.round(Math.min(W / 1920, H / 1080) * 3 * 2 * (SX.opts && SX.opts.ui || 1)) / 2);
    const u = k / dpr;
    const root = document.documentElement.style;
    root.setProperty("--u", u + "px");
    root.setProperty("--cell", Math.round(k * 64 / 3) / dpr + "px");
    root.setProperty("--fs", Math.round(k * 22 / 3) / dpr + "px");
    document.body.style.fontSize = "var(--fs)";
    V.uiK = k;
  }
  addEventListener("resize", resize);
  resize();
  const inShelter = () => SX.game && SX.game.state === "hub" && SX.hub && SX.hub.scene === "home";
  V.zoomOff = 0;
  V.zoomBy = d => {
    const lo = 1 - (V.baseScale || 2), n = Math.max(lo, Math.min(3, (V.zoomOff | 0) + d));
    if (n === V.zoomOff) return false;
    V.zoomOff = n;
    resize();
    V.snap();
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    return true;
  };
  addEventListener("wheel", e => {
    if (!(e.ctrlKey || e.metaKey) || e.target.id !== "screen" || !inShelter()) return;
    e.preventDefault();
    V.zoomBy(e.deltaY < 0 ? 1 : -1);
  }, {
    passive: false
  });
  V.shake = a => {
    V.shakeA = Math.max(V.shakeA, a * (SX.opts.shake == null ? 1 : SX.opts.shake));
    if (SX.pad) SX.pad.rumble(a);
  };
  V.snap = () => {
    const p = A.player;
    if (p) {
      V.cam.x = p.x * TS - V.vw / 2;
      V.cam.y = (p.y - .5) * TS - V.vh / 2;
    }
    V.camCut = true;
  };
  const fadeEl = document.getElementById("fade");
  V.fade = function(fn, dur) {
    dur = dur || .25;
    fadeEl.classList.remove("hidden");
    fadeEl.style.transition = "opacity " + dur + "s";
    fadeEl.style.opacity = "0";
    requestAnimationFrame(() => {
      fadeEl.style.opacity = "1";
    });
    setTimeout(() => {
      try {
        fn();
        if (G.warmHub) try {
          G.warmHub();
        } catch (e) {
          console.error(e);
        }
      } finally {
        fadeEl.style.opacity = "0";
        setTimeout(() => fadeEl.classList.add("hidden"), dur * 1e3);
      }
    }, dur * 1e3 + 30);
  };
  const camBox = new WeakMap;
  function camBounds(F) {
    let b = camBox.get(F);
    if (b) return b;
    const W = F.W, H = F.H, t = F.t, fs = F.fs, VOID = SX.map.T.VOID, WATER = SX.art.FS.WATER;
    const ground = F.kind === "floor" && !F.idx, all = !!F.out, hub = F.kind === "hub";
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (t[i] === VOID && !all && !(ground && fs[i] !== 0) && !(hub && fs[i] === WATER)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x1 < 0) {
      x0 = 0;
      y0 = 0;
      x1 = W - 1;
      y1 = H - 1;
    }
    const m = TS / 2;
    b = {
      x0: Math.max(0, x0 * TS - m),
      y0: Math.max(0, y0 * TS - m),
      x1: Math.min(W * TS, (x1 + 1) * TS + m),
      y1: Math.min(H * TS, (y1 + 1) * TS + m)
    };
    camBox.set(F, b);
    return b;
  }
  function camAxis(c, lo, hi, view) {
    return hi - lo <= view ? (lo + hi) / 2 : Math.min(Math.max(c, lo + view / 2), hi - view / 2);
  }
  function camLook(S, a, v, sp, size, h, on) {
    const dk = "d" + a, rk = "r" + a, lk = "l" + a, full = .12 * size;
    const d = Math.abs(v) >= 20 ? Math.sign(v) : 0;
    if (d !== 0) {
      if (S[dk] === 0) {
        S[dk] = d;
        S[rk] = 0;
      } else if (d !== S[dk]) {
        S[rk] += Math.abs(v) * h;
        if (S[rk] >= .06 * size) {
          S[dk] = d;
          S[rk] = 0;
        }
      } else S[rk] = 0;
    }
    const goal = on ? S[dk] * full * Math.min(1, sp / (3 * TS)) : 0, step = 2 * full / .5 * h, dl = goal - S[lk];
    S[lk] = Math.abs(dl) <= step ? goal : S[lk] + Math.sign(dl) * step;
  }
  function updateCamera(dt) {
    const p = A.player;
    if (!p) return;
    const mx = SX.input.mx * (window.devicePixelRatio || 1) / V.scale, my = SX.input.my * (window.devicePixelRatio || 1) / V.scale;
    const wg = A.weaponOf(p), look = p.aimHeld && wg && wg.kind === "gun" ? A.gunLook(wg) : 1;
    const deco = !!(SX.home && SX.home.deco), still = deco || SX.ui.isOpen();
    const lookK = deco ? 0 : p.aimHeld ? .55 * look : .28;
    const lim = Math.min(.35 * look, .47);
    const ox = still ? 0 : SX.clamp((mx - V.vw / 2) * lookK, -V.vw * lim, V.vw * lim), oy = still ? 0 : SX.clamp((my - V.vh / 2) * lookK, -V.vh * lim, V.vh * lim);
    const px0 = p.x * TS, py0 = (p.y - .5) * TS;
    const tx = px0 - V.vw / 2 + ox, ty = py0 - V.vh / 2 + oy;
    const L = V.camP, cut = !!V.camCut || !L || Math.abs(px0 - L.x) > 3 * TS || Math.abs(py0 - L.y) > 3 * TS;
    V.camCut = false;
    V.camStill = !!L && px0 === L.x && py0 === L.y;
    V.camP = {
      x: px0,
      y: py0
    };
    let cf = V.camF;
    if (cut || !cf || V.cam.x !== cf.lx || V.cam.y !== cf.ly) cf = V.camF = {
      x: V.cam.x,
      y: V.cam.y
    };
    const fx = cf.x, fy = cf.y, k = 1 - Math.exp(-7 * Math.max(0, dt));
    if (cut) {
      cf.x = tx;
      cf.y = ty;
    } else {
      cf.x += (tx - cf.x) * k;
      cf.y += (ty - cf.y) * k;
    }
    if (V.pixLock !== false) {
      const X = p.x * TS, Y = p.y * TS;
      let cx = Math.round(X) - Math.round(X - cf.x), cy = Math.round(Y) - Math.round(Y - cf.y);
      if (!cut && cf.lx != null) {
        if (cf.x > fx && cx < cf.lx || cf.x < fx && cx > cf.lx) cx = cf.lx;
        if (cf.y > fy && cy < cf.ly || cf.y < fy && cy > cf.ly) cy = cf.ly;
      }
      V.cam.x = cx;
      V.cam.y = cy;
    } else {
      V.cam.x = cf.x;
      V.cam.y = cf.y;
    }
    cf.lx = V.cam.x;
    cf.ly = V.cam.y;
    V.shakeA = Math.max(0, V.shakeA - dt * 14);
    V.shT = (V.shT || 0) + dt * 18;
    V.shx = shNoise(V.shT, 0) * V.shakeA;
    V.shy = shNoise(V.shT, 71) * V.shakeA;
  }
  function shHash(i) {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s) - .5;
  }
  function shNoise(t, o) {
    const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f), a = shHash(i + o * 1e3), b = shHash(i + 1 + o * 1e3);
    return a + (b - a) * u;
  }
  function mouseWorld() {
    const s = V.scale / (window.devicePixelRatio || 1);
    const cx = Math.round(V.cam.x + V.shx), cy = Math.round(V.cam.y + V.shy);
    V.mouseScreenX = SX.input.mx / s;
    V.mouseScreenY = SX.input.my / s;
    V.mouseWorldX = (V.mouseScreenX + cx) / TS;
    V.mouseWorldY = (V.mouseScreenY + cy) / TS;
  }
  const START_MONEY = 3e5;
  const G = SX.game = {
    state: "title",
    god: false,
    env: {
      night: true,
      rain: .3,
      flashT: 0,
      hub: true
    },
    stats: {
      kills: 0
    },
    rng: new SX.Rng(1),
    deathWhy: null
  };
  G.newSave = function() {
    const stash = I.grid(10, 6);
    I.put(stash, I.mk("9mm 탄창"));
    I.put(stash, I.mk("9mm 탄창"));
    I.put(stash, I.mk("붕대"));
    I.put(stash, I.mk("진통제"));
    return {
      v: 1,
      gift0920: true,
      gift0930: true,
      money: START_MONEY,
      stash,
      kit: I.starterKit(),
      infect: 0,
      insured: false,
      intel: null,
      merc: null,
      stock: I.rollStock(),
      nap: 0,
      runs: 0,
      extracts: 0,
      deaths: 0,
      kills: 0,
      playedMs: 0,
      markers: [],
      home: SX.home.newHome(),
      look: Object.assign({}, SX.art.PRESETS[0].look),
      quests: SX.prog.qNew(),
      fac: SX.prog.fNew(),
      story: SX.prog.stNew(),
      body: {
        st: 0,
        str: 0,
        run: 0,
        last: {}
      },
      fights: {
        wins: 0,
        losses: 0
      },
      safe: SX.vault ? SX.vault.newSafe() : null,
      creel: SX.fishing ? SX.fishing.creelNew() : null,
      loadouts: [],
      loyal: SX.trade ? SX.trade.loyNew() : {},
      wish: []
    };
  };
  G.load = function() {
    const wasKit = G.kit;
    const o = SX.save.load();
    if (!o || o.v !== 1) {
      G.save = G.newSave();
    } else {
      G.save = Object.assign(G.newSave(), o);
      if (!G.save.body) G.save.body = {
        st: 0,
        str: 0,
        run: 0,
        last: {}
      };
      if (!G.save.fights) G.save.fights = {
        wins: 0,
        losses: 0
      };
      G.save.stash = I.gridFrom(o.stash);
      G.save.kit = I.kitFrom(o.kit);
      G.save.home = SX.home.restore(o.home);
      if (SX.vault) {
        G.save.safe = SX.vault.from(o.safe);
        if (SX.vault.legacy(G.save)) G.giftDirty = true;
      }
      if (SX.fishing) G.save.creel = SX.fishing.creelFrom(o.creel);
      if (!o.look) G.save.look = Object.assign({}, SX.art.PRESETS[0].look);
      if (!Object.prototype.hasOwnProperty.call(o, "gift0920")) {
        G.save.gift0920 = true;
        G.save.money += 3e6;
        G.gift = 3e6;
      }
    }
    if (!G.save.stock) G.save.stock = I.rollStock();
    if (SX.trade) {
      const L = G.save.loyal && typeof G.save.loyal === "object" ? G.save.loyal : {}, n = SX.trade.loyNew();
      for (const k of SX.trade.WHO) n[k] = Math.max(0, Math.round(+L[k] || 0));
      G.save.loyal = n;
    }
    if (!Array.isArray(G.save.wish)) G.save.wish = []; else G.save.wish = G.save.wish.filter(n => typeof n === "string").slice(0, 20);
    G.save.nap = (G.save.nap | 0) > 0 ? 1 : 0;
    if (!G.save.quests || !Array.isArray(G.save.quests.done)) G.save.quests = SX.prog.qNew();
    if (!G.save.fac || typeof G.save.fac !== "object") G.save.fac = SX.prog.fNew();
    if (!G.save.story || typeof G.save.story !== "object" || !Array.isArray(G.save.story.done) || !G.save.story.act) G.save.story = SX.prog.stNew();
    if (SX.prog.stMig) SX.prog.stMig(G.save.story);
    if (SX.loadout) SX.loadout.fix(G.save);
    if (o && o.v === 1 && !Object.prototype.hasOwnProperty.call(o, "gift0930")) {
      G.save.gift0930 = true;
      const h = G.save.home;
      let n = 0;
      for (const [k, c] of Object.entries(SX.home.FURN)) {
        if (c.builtin || c.lux || !SX.art.propSize(k)) continue;
        if (h.furn.some(f => f.kind === k)) continue;
        const f = {
          id: h.nextId++,
          kind: k,
          placed: false
        };
        if (c.grid) f.grid = I.gridDump(I.grid(c.grid[0], c.grid[1]));
        h.furn.push(f);
        n++;
      }
      if (n) {
        G.gift2 = n;
        G.giftDirty = true;
      }
    }
    G.kit = G.save.kit;
    if (SX.free && G.save.freeKeep && SX.free.orphan()) G.giftDirty = true;
    if (SX.actors && SX.actors.player && wasKit && SX.actors.player.kit === wasKit) SX.actors.player.kit = G.kit;
    G.gen = (G.gen | 0) + 1;
    if (SX.hub && SX.hub.relink) SX.hub.relink();
    if (SX.ui && SX.ui.relink) SX.ui.relink();
    if (G.gift || G.giftDirty) G.persist();
  };
  G.persist = function() {
    const s = G.save;
    if (G.state !== "raid" && SX.feats) SX.feats.check(s);
    SX.save.write(G.pack());
    if (SX.net && SX.net.touch) SX.net.touch();
  };
  G.pack = function() {
    const s = G.save;
    const rk = G.state === "hub" && SX.hub && SX.hub.scene === "range" && SX.hub.rangeKit;
    const o = Object.assign({}, s, {
      stash: I.gridDump(s.stash),
      kit: rk ? JSON.parse(JSON.stringify(rk)) : I.kitDump(G.kit),
      home: SX.home.dump(s.home)
    });
    o.vm = 2;
    o.bm = 1;
    if (SX.vault) o.safe = SX.vault.dump(SX.vault.of(s));
    if (SX.fishing) o.creel = SX.fishing.creelDump(s);
    return o;
  };
  G.inRaid = () => G.state === "raid" && SX.raid.on;
  G.floorObj = () => G.state === "raid" ? SX.raid.floor() : SX.hub.level ? SX.hub.floor() : null;
  G.lootCtx = f => ({
    building: SX.raid.level ? SX.raid.level.building : SX.data.buildings[1],
    floor: f,
    intel: G.save.intel
  });
  G.playerDied = function(why) {
    G.deathWhy = why;
    if (SX.recap) SX.recap.died(why);
    if (SX.net && SX.net.on() && SX.net.raidSnap) {
      const o = SX.raid.snapLoad();
      if (o && !o.stale) SX.net.raidSnap(Object.assign({}, o, {
        dead: true
      }));
    }
    SX.raid.snapClear();
    if (SX.coop) SX.coop.died();
    SX.log("💀 " + why, "bad");
    SX.ui.closePanel();
  };
  G.canCure = function() {
    if (SX.hub && SX.hub.scene === "range" && G.state === "hub") return "사격장에선 억제약을 못 씁니다 — 나올 때 장비가 들어갈 때로 돌아갑니다";
    if (!(G.save.infect > .01)) return "아직 억제약을 먹을 필요가 없습니다";
    return null;
  };
  G.cure = function() {
    G.save.infect = 0;
    SX.log("💉 억제약 — 감염 게이지가 내려갔습니다", "good");
    SX.audio.play("heal");
  };
  G.enterHub = function(scene) {
    G.state = "hub";
    SX.hub.enter(scene || "home");
    document.getElementById("hud").classList.remove("hidden");
    document.getElementById("title").classList.add("hidden");
    V.snap();
    SX.ui.hudDirty();
    if (G.gift) {
      SX.log("💰 보상: 꾸미기 창이 묻지 않고 돈을 빼 간 것 — " + SX.won(G.gift) + " 채웠습니다", "good");
      G.gift = 0;
    }
    if (G.gift2) {
      SX.log("🛋 가구를 종류마다 하나씩 넣어 뒀습니다(" + G.gift2 + "개) — 셸터에서 [" + SX.label("deco") + "] 꾸미기", "good");
      G.gift2 = 0;
    }
    if (!G.storyHinted && SX.prog.stNow) {
      G.storyHinted = true;
      const now = SX.prog.stNow(G.save.story, SX.ui.storyHands ? SX.ui.storyHands() : null), W0 = SX.prog.ST_WHO;
      if (now && (now.state === "claim" || !(SX.qhide && SX.qhide.has("s", now.m.id)))) SX.log(now.state === "accept" ? "★ 이야기 — 장터(도심 지도 → 장터)의 " + W0[now.m.who] + "에게 말을 걸어 보십시오" : now.state === "claim" ? "★ 임무 「" + now.m.name + "」 다 했습니다 — 장터의 " + W0[now.m.who] + "에게" : "★ 임무 「" + now.m.name + "」 — " + now.m.brief + " · 단말기 [이야기]");
    }
  };
  G.startRaid = function(building, tod, opt) {
    opt = opt || {};
    const s = G.save;
    const fr = opt.free && SX.free ? opt.free : null;
    s.runs++;
    if (fr) SX.free.begin(fr);
    G.raidStartKit = I.kitDump(G.kit);
    const autoOk = !fr && !(building && building.train);
    let insure = (!!s.insured || !!s.insAuto && autoOk) && !fr;
    if (insure) {
      const fee = SX.ui.insureFee ? SX.ui.insureFee() : 2e3, pre = Math.max(0, +s.insuredFee || 0), due = Math.max(0, fee - pre);
      if (s.money < due) {
        insure = false;
        SX.log("🛡 보험료 " + SX.won(due) + " 가 모자라 보험 없이 나갑니다(신청은 남아 있습니다)", "bad");
      } else {
        s.money -= due;
        s.insuredFee = 0;
        SX.log("🛡 보험 — 장착한 장비 값 기준 보험료 " + SX.won(fee) + (pre ? "(미리 낸 " + SX.won(pre) + " 빼고 " + SX.won(due) + ")" : "") + " 냈습니다", "good");
      }
    }
    G.insuredList = insure ? [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig" ].map(k => G.kit[k] ? I.dump(G.kit[k]) : null).filter(Boolean) : [];
    if (insure) s.insured = false;
    if (autoOk && !s.merc && s.mercAuto) {
      const m = (SX.data.mercs || []).find(x => x.id === s.mercAuto);
      if (!m) s.mercAuto = null; else if ((+s.money || 0) < m.price) SX.log("🤝 " + m.name + " 고용비 " + SX.won(m.price) + " 가 모자라 이번 판은 용병 없이 나갑니다(다음 판도 같은 사람은 켜져 있습니다)", "bad"); else {
        s.money -= m.price;
        s.merc = m.id;
        SX.log("🤝 다음 판도 같은 사람 — " + m.name + " 고용비 " + SX.won(m.price) + " 냈습니다", "good");
      }
    }
    const own = s.intel, mt = opt.match;
    const useIntel = mt ? mt.intel || null : fr ? null : own;
    const spent = !fr && (!mt || mt.lead && mt.intel);
    if (spent) s.intel = null; else if (own && mt && own.building === building.id) SX.log("🌐 여럿이 들어간 판이라 정보는 안 썼습니다 — 다음 판에 씁니다");
    const seed = opt.seed != null ? opt.seed : Math.random() * 4294967296 >>> 0;
    G.raidSun = {
      seed,
      at: mt ? typeof mt.at === "number" && isFinite(mt.at) ? mt.at : null : SX.net && SX.net.now ? SX.net.now() : Date.now()
    };
    const wkIn = mt && mt.wk !== undefined ? mt.wk : SX.week ? SX.week.cur(SX.net.now()) : undefined;
    const mode = mt ? mt.mode || "normal" : opt.mode || (SX.prog && SX.prog.raidMode ? SX.prog.raidMode(building.id, SX.net.now()) : "normal");
    s.raidOpen = {
      seed,
      at: Date.now(),
      insured: G.insuredList,
      b: building.id
    };
    if (fr) s.raidOpen.free = fr.id;
    if (SX.settle) SX.settle.raidStart(seed);
    G.persist();
    if (SX.net && SX.net.on()) SX.net.push(true);
    SX.ui.closePanel();
    V.fade(() => {
      const keep = s.intel, merc = s.merc;
      s.intel = useIntel;
      if (fr) s.merc = null;
      SX.raid.start(building, tod, seed, mode, wkIn);
      s.intel = keep;
      if (fr) {
        s.merc = merc;
        SX.free.dress(A.player);
        SX.log("🎒 마지막 희망 판 — 살아 나가면 전부 보관함 · 쓰러지면 받은 장비만 잃습니다", "good");
        if (SX.ui.bigNote) SX.ui.bigNote("마지막 희망 판", "받은 장비로 나왔습니다 — 내 장비는 셸터에 그대로 있습니다", 4e3);
      }
      G.state = "raid";
      G.deathWhy = null;
      if (SX.coop) SX.coop.beginRaid({
        match: mt || null
      });
      V.snap();
      SX.ui.hudDirty();
      G.persist();
      SX.raid.snapSave();
      if (SX.raid.todayNote) SX.raid.todayNote();
    }, .5);
  };
  G.resumeRaid = function(sn) {
    const s = G.save;
    const b = SX.data.buildings.find(x => x.id === sn.b);
    if (!b) return false;
    G.enterHub("home");
    const keep = s.intel;
    s.intel = sn.intel || null;
    G.raidSun = {
      seed: sn.seed,
      at: typeof sn.sun === "number" && isFinite(sn.sun) ? sn.sun : null
    };
    SX.raid.start(b, sn.tod, sn.seed, sn.mode, sn.wk);
    s.intel = keep;
    const R = SX.raid;
    G.kit = s.kit = I.kitFrom(sn.kit);
    G.insuredList = sn.insured || [];
    G.raidStartKit = sn.startKit || null;
    const pl = A.newPlayer(G.kit, sn.p.x, sn.p.y, sn.p.f);
    if (SX.free) SX.free.dress(pl);
    Object.assign(pl, {
      hp: sn.p.hp,
      st: sn.p.st,
      aim: sn.p.aim || 0,
      torch: !!sn.p.torch,
      crouch: !!sn.p.crouch,
      boxOn: !!sn.p.boxOn,
      hot: sn.p.hot || 0,
      hotT: sn.p.hotT || 0,
      nvOn: !!(sn.p.nv && G.kit.nvg)
    });
    if (sn.p.slot && G.kit[sn.p.slot]) pl.slot = sn.p.slot;
    if (Array.isArray(sn.p.dn) && SX.coop) {
      pl.hp = 0;
      pl.down = {
        t: Math.max(1, +sn.p.dn[0] || 0),
        hp: Math.max(1, +sn.p.dn[1] || 0),
        why: "쓰러졌습니다",
        rv: 0,
        rvBy: null,
        rvAt: 0
      };
    }
    A.allies = [];
    if (sn.ally && String(sn.ally.id).indexOf("pax:") === 0) {
      const al = R.spawnPax(String(sn.ally.id).slice(4), R.level.floors[sn.p.f], sn.ally.x, sn.ally.y, sn.ally.hp);
      if (al) al.floor = sn.p.f;
    } else if (sn.ally) {
      const m = SX.data.mercs.find(x => x.id === sn.ally.id);
      if (m) {
        const al = A.spawnAlly(R.level.floors[sn.p.f], m, sn.ally.x, sn.ally.y);
        al.hp = sn.ally.hp;
        al.floor = sn.p.f;
      }
    }
    R.t = sn.t;
    R.lockLeft = sn.lock;
    R.gasY = sn.gasY;
    R.gasWarned = sn.gasWarned || 0;
    R.flareT = sn.flareT || 0;
    R.pings = sn.pings || [];
    R.startValue = sn.startValue;
    if (sn.locked && !R.flood) {
      R.lockLeft = .01;
    }
    if (sn.locked && R.flood) R.floodQuiet = true;
    R.worldApply(sn.world, {
      search: true
    });
    R.storySetup();
    if (R.eggSetup) {
      R.eggSetup();
      if (R.egg && SX.items.findInKit(G.kit, R.egg.def.item)) {
        R.eggGot = R.egg.def.id;
        R.egg = null;
      }
    }
    G.stats = {
      kills: sn.kills || 0,
      t0: performance.now(),
      picked: []
    };
    G.state = "raid";
    G.deathWhy = null;
    SX.minimap && SX.minimap.prepare && SX.minimap.prepare(R.level);
    if (sn.ctl && R.ctrlOn) R.ctrlOn(true);
    if (sn.heli && R.heli && sn.heli.t != null) {
      R.heli.t0 = R.t - sn.heli.t;
      R.heli.woke = sn.heli.woke || [];
      R.heli.landed = !!sn.heli.landed;
      if (R.heli.landed) {
        R.heli.zone.hidden = false;
        R.heli.zone.locked = false;
      }
    }
    if (SX.coop && sn.match && sn.match.mid) SX.coop.resumeMatch(sn.match);
    V.snap();
    SX.ui.hudDirty();
    SX.log("↩ 하던 판으로 돌아왔습니다 — " + b.name + " " + Math.floor(sn.t / 60) + "분 " + Math.floor(sn.t % 60) + "초", "good");
    return true;
  };
  G.abandonRaid = function() {
    const s = G.save, ro = s.raidOpen;
    if (!ro) return;
    const back = [];
    for (const d of ro.insured || []) {
      const it = I.restore(d);
      if (it.grid) it.grid.list = [];
      if (I.put(s.stash, it)) back.push(it.name);
    }
    const free = ro.free && SX.free ? SX.free.finish(false) : null;
    if (!free) G.kit = s.kit = I.newKit();
    s.deaths++;
    s.raidOpen = null;
    if (SX.feats) SX.feats.raidEnd(s, {
      b: ro.b,
      win: false
    });
    if (SX.settle) SX.settle.raidEnd({
      win: false,
      b: ro.b,
      seed: ro.seed
    });
    SX.raid.snapClear();
    G.persist();
    if (SX.net && SX.net.on()) SX.net.push(true);
    SX.log("💀 판 도중 창을 닫고 10분 안에 안 돌아왔습니다 — 판 안에서 의식을 잃은 것으로 쳤습니다" + (back.length ? " · 보험으로 돌아온 장비: " + back.join(", ") : ""), "bad");
    if (free) SX.log(free, "warn");
  };
  const EXIT_NAME = {
    zip: "옥상 집라인",
    door: "1층 출입문",
    flare: "구조 신호탄",
    escape: "완강기",
    heli: "헬기",
    bridge: "다리 북단 검문소",
    tunnel: "터널 비상 사다리",
    site: "공사장 뒷문",
    park: "지하 주차장 출구"
  };
  G.startTutorial = function(now) {
    const b = SX.data.buildings.find(x => x.id === "train");
    if (!b || !SX.course || G.state !== "hub") return;
    G.persist();
    G.raidStartKit = I.kitDump(G.kit);
    G.insuredList = [];
    SX.ui.closePanel();
    const go = () => {
      SX.course.pre();
      SX.raid.start(b, "day", SX.course.SEED);
      G.state = "raid";
      G.deathWhy = null;
      if (SX.coop) SX.coop.beginRaid({
        match: null
      });
      SX.course.begin();
      V.snap();
      SX.ui.hudDirty();
    };
    if (now) go(); else V.fade(go, .5);
  };
  G.NAP_SECS = 120;
  G.finishRaid = function(win, how, lv) {
    lv = lv || SX.raid.level;
    if (SX.course && SX.course.on) {
      SX.course.finish(win, lv);
      return;
    }
    const s = G.save;
    const secs = Math.round(SX.raid.t);
    const kills = G.stats.kills || 0;
    const train = !!(lv && lv.building && lv.building.train);
    const free = !train && !!(SX.free && SX.free.on());
    if (!train) s.kills += kills;
    let gained = 0, lines = [];
    if (train && !win) {
      lines.push("연습장 — 동료들이 끌어냈습니다. 장비는 그대로입니다.");
      if (G.raidStartKit) G.kit = s.kit = I.kitFrom(G.raidStartKit);
    } else if (win) {
      s.extracts++;
      const now = I.kitValue(G.kit);
      gained = now - SX.raid.startValue;
      const porter = (SX.actors.allies || []).find(a => a.alive && a.merc && a.merc.loot);
      if (porter && gained > 0) {
        const bonus = Math.round(gained * (porter.merc.loot - 1));
        if (bonus > 0) {
          s.money += bonus;
          gained += bonus;
          lines.push(porter.name + " 가 더 챙겨 나왔습니다 — " + SX.won(bonus));
        }
      }
      {
        const ER = SX.ev && SX.ev.reward ? SX.ev.reward() : null;
        if (ER && ER.money > 0 && !train) {
          s.money += ER.money;
          gained += ER.money;
          s.rescued = (s.rescued | 0) + ER.n;
          lines.push(ER.line);
        }
      }
      lines.push("탈출: " + (EXIT_NAME[how] || how));
      if (train) {
        s.extracts--;
        lines.push("연습장 — 기록·의뢰에는 세지 않습니다");
      }
    } else {
      s.deaths++;
      lines.push("의식을 잃은 까닭: " + (how || "알 수 없음"));
      const back = [];
      for (const d of G.insuredList || []) {
        const it = I.restore(d);
        if (it.grid) it.grid.list = [];
        if (I.put(s.stash, it)) back.push(it.name);
      }
      if (back.length) lines.push("보험으로 돌아온 장비: " + back.join(", "));
      if (!free) G.kit = s.kit = I.newKit();
    }
    s.kit = G.kit;
    const freeRet = free ? SX.free.finish(!!win) : null;
    if (freeRet) lines.push(freeRet);
    if (win && !train && SX.raid.eggGot) {
      const E = s.eggs || (s.eggs = []);
      if (E.indexOf(SX.raid.eggGot) < 0) {
        E.push(SX.raid.eggGot);
        lines.push("🔍 숨겨진 것 " + E.length + " / " + (SX.EGGS || []).length + " — 「" + ((SX.EGGS || []).find(e => e.id === SX.raid.eggGot) || {}).item + "」");
      }
      SX.raid.eggGot = null;
    }
    const st = G.stats || {};
    if (win && !train && !(SX.prog.REAL_EXIT || {})[how]) lines.push("나간 길이 " + (EXIT_NAME[how] || how) + " — 「다녀오기」 임무에는 세지 않습니다(옥상 집라인·완강기 · 야외 지도는 끝 출구만)");
    s.lastRaid = {
      id: SX.raid.seed,
      b: lv && lv.building ? lv.building.id : null,
      tod: SX.raid.tod,
      win: !!win,
      via: win ? String(how || "") : "",
      kills: {
        scav: st.kScav | 0,
        zombie: st.kZombie | 0,
        boss: st.bossKills | 0,
        named: st.named | 0
      },
      pax: win && how === "heli" && SX.raid.paxAlive && SX.raid.paxAlive() ? SX.raid.pax : null,
      how: String((win ? EXIT_NAME[how] : how) || how || "").slice(0, 60),
      secs,
      gained: win ? Math.round(gained) : 0,
      ev: SX.raid.event ? SX.raid.event.id : null,
      party: SX.coop && SX.coop.on() ? 1 + SX.coop.peers.size : 1,
      searched: st.searched | 0,
      disarm: st.disarm | 0,
      crit: st.crit | 0,
      flash: st.flash | 0
    };
    if (free && s.raidOpen && s.raidOpen.free) s.lastRaid.free = s.raidOpen.free;
    if (SX.week && SX.week.report) SX.week.report(s.lastRaid);
    if (SX.mis && SX.mis.toRaid) SX.mis.toRaid(s.lastRaid, !!win);
    if (!s.daily) s.daily = SX.prog.dNew();
    const bars = [];
    if (!train && SX.prog.stPreview) {
      const W0 = SX.prog.ST_WHO, hs = SX.ui.storyHands ? SX.ui.storyHands() : null;
      if (SX.prog.bnPreview) for (const e of SX.prog.bnPreview(s.story, s.lastRaid)) {
        const v = e.before + e.add;
        lines.push(v >= e.c.need ? "💰 현상금 「" + e.c.name + "」 다 했습니다 — 시장 [의뢰] 탭에서 받으시면 됩니다" : "💰 현상금 「" + e.c.name + "」 " + v + "/" + e.c.need);
        bars.push({
          k: "b",
          name: e.c.name,
          a: e.before,
          v,
          n: e.c.need,
          line: lines[lines.length - 1]
        });
      }
      for (const e of SX.prog.stPreview(s.story, s.lastRaid)) {
        const need = SX.prog.stNeed(e.m), v = e.before + e.add;
        if (v >= need || !(SX.qhide && SX.qhide.has("s", e.m.id))) {
          lines.push(v >= need ? "★ 임무 「" + e.m.name + "」 다 했습니다 — 장터의 " + W0[e.m.who] + "에게" : "★ 임무 「" + e.m.name + "」 " + v + "/" + need);
          bars.push({
            k: "s",
            name: e.m.name,
            a: e.before,
            v,
            n: need,
            who: W0[e.m.who],
            line: lines[lines.length - 1]
          });
        }
      }
      if (win && hs) for (const id of Object.keys(s.story && s.story.act || {})) {
        const m = SX.prog.stById(id);
        if (m && m.obj.kind === "find" && hs.count(m.obj.item) > 0) lines.push("★ 「" + m.obj.item + "」을(를) 들고 나왔습니다 — 장터의 " + W0[m.who] + "에게");
      }
      if (!(SX.net && SX.net.on())) SX.prog.stReport(s.story, s.lastRaid);
    }
    const qprog = (SX.prog.preview ? SX.prog.preview(s.quests, s.lastRaid) : []).concat(SX.prog.dPreview ? SX.prog.dPreview(s.daily, s.lastRaid, Date.now()) : []);
    if (train) s.lastRaid.train = 1;
    const bestWas = (((s.rec || {}).b || {})[s.lastRaid.b] || {}).best || 0;
    if (win && gained > 0 && bestWas > 0 && gained > bestWas) lines.push("🏆 이 건물 최고 수입 갱신 — 전에는 " + SX.won(bestWas));
    const endNew = !!(win && !train && how === "heli" && !s.lastRaid.pax && SX.prog.endAdd && SX.prog.egReady(s.eg) && SX.prog.stMainDone(s.story) && (SX.prog.endAdd(s, s.story) || !(s.eg.won | 0)));
    if (SX.feats && !train) for (const f of SX.feats.raidEnd(s, {
      b: s.lastRaid.b,
      win: !!win,
      how,
      tod: SX.raid.tod,
      gained,
      kills,
      kZ: st.kZombie | 0,
      kS: st.kScav | 0,
      kB: st.bossKills | 0,
      kN: st.named | 0,
      picked: st.picked || [],
      quiet: true
    })) lines.push("🏅 도전 과제 「" + f[1] + "」 — " + f[2]);
    if (!(SX.net && SX.net.on())) {
      for (const id of SX.prog.report(s.quests, s.lastRaid)) {
        const q = SX.prog.qById(id);
        lines.push("의뢰 「" + q.name + "」 다 했습니다 — 시장 의뢰 탭에서 보상");
      }
      for (const id of SX.prog.dReport(s.daily, s.lastRaid, Date.now())) {
        const q = SX.prog.dById(id);
        lines.push("과제 「" + q.name + "」 다 했습니다 — 시장 의뢰 탭에서 보상");
      }
      if (s.lastRaid.b === "heli" && win && SX.prog.egReady(s.eg) && SX.prog.stMainDone(s.story)) s.eg.won = (s.eg.won | 0) + 1;
    }
    if (win && !train && secs >= 30 && SX.prog.wkList && SX.net && SX.net.on()) {
      const P0 = SX.prog, m = {
        b: s.lastRaid.b,
        kS: st.kScav | 0,
        kZ: st.kZombie | 0,
        kB: st.bossKills | 0,
        kN: st.named | 0,
        ext: P0.realExit(s.lastRaid) ? 1 : 0,
        crit: st.crit | 0,
        flash: st.flash | 0,
        heavy: I.kitWeight(G.kit) >= P0.WK_KG ? 1 : 0,
        gain: Math.max(0, gained),
        big: gained >= P0.WK_BIG ? 1 : 0
      };
      for (const e of P0.wkApply(P0.wkList(Date.now()), {}, m)) lines.push("🏁 주간 도전 「" + e.c.name + "」 +" + (e.c.won ? SX.won(e.add) : e.add));
    }
    const stl = SX.settle ? SX.settle.raidEnd({
      train,
      win: !!win,
      gained,
      secs,
      kills,
      searched: st.searched | 0,
      b: s.lastRaid.b,
      seed: SX.raid.seed,
      qprog,
      bars,
      lines
    }) : null;
    s.raidOpen = null;
    const full = secs >= G.NAP_SECS;
    if (full || train) I.restock(s);
    if (!train && full) s.nap = 1; else if (!train) lines.push("⏱ 판이 " + Math.round(G.NAP_SECS / 60) + "분이 안 돼 한 판으로 치지 않습니다 — 좌판 새 물건 · 침대 잠은 " + Math.round(G.NAP_SECS / 60) + "분 넘게 다녀와야 생깁니다");
    G.persist();
    if (SX.net && SX.net.on()) SX.net.push(true);
    G.state = "hub";
    SX.hub.enter("home");
    V.snap();
    SX.ui.showResult({
      endNew,
      free,
      win,
      how: s.lastRaid.how,
      pax: s.lastRaid.pax || null,
      paxLost: !s.lastRaid.pax && SX.raid.pax ? SX.raid.pax : null,
      first: !!(win && how === "heli" && SX.prog.rsOf && SX.prog.stMainDone(s.story) && !SX.prog.rsOf(s.story).out.length && !SX.raid.pax),
      ending: !!(win && how === "heli"),
      album: !!(win && how === "heli" && SX.ui.storyHands && SX.ui.storyHands().count("기록물 1") > 0),
      secs,
      kills,
      gained,
      lines,
      bars,
      searched: st.searched | 0,
      sk0: stl ? stl.sk0 : null,
      sk1: stl ? stl.sk1 : null,
      building: lv ? lv.building : null,
      picked: st.picked || [],
      kill2: s.lastRaid.kills,
      qprog,
      tod: SX.raid.tod,
      event: SX.raid.event || null,
      wx: SX.raid.wx || null,
      seed: SX.raid.seed,
      recap: !win && !train && SX.recap ? SX.recap.summary(how) : null
    });
    if (SX.raid.level === lv) SX.raid.level = null;
  };
  G.giveUp = function() {
    if (!G.inRaid()) return;
    const p = A.player;
    p.alive = false;
    p.hp = 0;
    G.playerDied("판을 포기했습니다");
    SX.raid.end(false, "판을 포기했습니다");
  };
  G.wipe = function() {
    const s = G.save, P = SX.prog;
    if (SX.hub && SX.hub.rangeKit) SX.hub.rangeKit = null;
    SX.save.write(P.wipeFresh(s, (s.wipeN | 0) + 1, nm => I.dump(I.mk(nm)), SX.home.newHome()));
    G.load();
    if (SX.raid && SX.raid.snapClear) SX.raid.snapClear();
    G.enterHub("home");
    G.persist();
    if (SX.net && SX.net.on()) SX.net.push(true);
  };
  G.ngStart = async function() {
    const s = G.save, P = SX.prog;
    if (G.inRaid()) return {
      ok: false,
      msg: "판 중엔 못 합니다"
    };
    if (!P.ngOk(s.eg)) return {
      ok: false,
      msg: "아직 이릅니다 — 여의도 헬기장에서 헬기로 서울을 떠난 뒤에 열립니다"
    };
    let r;
    if (SX.net && SX.net.on()) r = await SX.net.ngReset(); else {
      G.persist();
      const old = SX.save.load() || {}, n = (s.ng | 0) + 1;
      const log = (Array.isArray(old.ngLog) ? old.ngLog : []).concat([ {
        n,
        at: Date.now(),
        money: Math.round(+s.money || 0)
      } ]).slice(-20);
      SX.save.write(P.ngFresh(Object.assign({}, old, {
        ngLog: log
      }), n, nm => I.dump(I.mk(nm)), SX.home.newHome()));
      G.load();
      r = {
        ok: true
      };
    }
    if (!r || !r.ok) return r || {
      ok: false,
      msg: "못 했습니다"
    };
    const n1 = (G.save.ng | 0) + 1;
    if (SX.raid && SX.raid.snapClear) SX.raid.snapClear();
    G.storyHinted = false;
    SX.ui.closePanel();
    G.enterHub("home");
    SX.audio.play("buy");
    SX.log("🔁 " + n1 + "회차를 시작했습니다 — 보관함 +" + P.ngRows(G.save.ng) + "줄 · 숙련 +" + Math.round((P.ngXp(G.save.ng) - 1) * 100) + "% · 처음 장비와 " + SX.won(P.NG_START.money) + " 으로", "good");
    return r;
  };
  let infAcc = 0, saveAcc = 0;
  function updateInfection(dt) {
    const s = G.save;
    if (!s) return;
    s.playedMs += dt * 1e3;
    const before = s.infect;
    s.infect = Math.min(100, s.infect + dt * 1e3 / SX.data.infectFullMs * 100);
    for (const mark of [ 50, 75, 90, 99 ]) if (before < mark && s.infect >= mark) SX.log("🦠 감염 게이지 " + mark + "% — 억제약을 구하십시오", "bad");
    if (s.infect >= 100) {
      if (G.inRaid()) {
        if (!SX.raid.over) {
          const p = A.player;
          p.alive = false;
          G.playerDied("증상 발현");
          SX.raid.end(false, "증상 발현");
        }
        return;
      }
      if (G.state !== "hub") return;
      G.wipe();
      SX.ui.showWipe();
    }
    saveAcc += dt;
    if (saveAcc > 10 && G.state === "hub") {
      saveAcc = 0;
      G.persist();
    }
  }
  let last = performance.now(), titleT = 0, fpsN = 0, fpsT = 0, vaultT = 0, capAt = 0;
  const fpsEl = document.getElementById("fpsBox");
  G.warmHub = function() {
    if (G.state !== "hub" || !SX.hub.level) return;
    const F = SX.hub.floor(), p = A.player;
    if (!F) return;
    for (let k = 0; k < 2; k++) {
      if (p && p.floor === F.idx) {
        const ey = SX.light.eyeY(F, p.x, p.y);
        SX.light.computeVis(F, p.x, ey, 26, false, p.y);
      }
      SX.render.draw({
        ctx: lctx,
        vw: V.vw + 1,
        vh: V.vh + 1,
        cam: {
          x: Math.round(V.cam.x),
          y: Math.round(V.cam.y)
        },
        dt: 0
      }, SX.hub.level, F, G.env, {
        npcs: SX.meet ? SX.meet.npcs(F) : F.npcs
      });
    }
  };
  function frame(now) {
    rafAt = now;
    if (now < last) now = last;
    const cap = +SX.opts.fpsCap || 0;
    if (cap > 0) {
      const iv = 1e3 / cap;
      if (now - capAt < iv - 1.5) {
        requestAnimationFrame(frame);
        return;
      }
      capAt = now - capAt > iv * 2 ? now : capAt + iv;
    }
    const raw = (now - last) / 1e3, rdt = Math.min(.05, raw), dt = Math.min(.05, raw * (SX.PACE || 1));
    last = now;
    requestAnimationFrame(frame);
    if (V.zoomOff && !inShelter()) {
      V.zoomOff = 0;
      resize();
      V.snap();
    }
    fpsN++;
    fpsT += raw;
    if (fpsT >= .5) {
      if (fpsEl) {
        if (SX.opts.fps) {
          fpsEl.textContent = Math.round(fpsN / fpsT) + " fps";
          fpsEl.classList.remove("hidden");
        } else fpsEl.classList.add("hidden");
      }
      fpsN = 0;
      fpsT = 0;
    }
    step(dt, rdt);
    rafAt = performance.now();
  }
  let rafAt = 0, bgClk = null;
  function bgTick() {
    const now = performance.now();
    if (now - rafAt < 150 || G.state !== "raid" || !(SX.coop && SX.coop.raid && !SX.coop.raid.offline)) return;
    let raw = Math.min(.25, Math.max(0, (now - last) / 1e3));
    last = now;
    while (raw > .001) {
      const r = Math.min(.04, raw);
      raw -= r;
      step(Math.min(.05, r * (SX.PACE || 1)), r);
    }
  }
  function bgClock() {
    const on = document.hidden || !document.hasFocus();
    if (!bgClk) {
      if (!on) return;
      try {
        const w = new Worker(URL.createObjectURL(new Blob([ "let t=0;onmessage=(e)=>{clearInterval(t);t=e.data?setInterval(()=>postMessage(0),e.data):0;};" ], {
          type: "text/javascript"
        })));
        w.onmessage = bgTick;
        bgClk = ms => w.postMessage(ms);
      } catch (e) {
        let t = 0;
        bgClk = ms => {
          clearInterval(t);
          t = ms ? setInterval(bgTick, ms) : 0;
        };
      }
    }
    bgClk(on ? 40 : 0);
  }
  document.addEventListener("visibilitychange", bgClock);
  addEventListener("blur", bgClock);
  addEventListener("focus", bgClock);
  const F_CLOSE = new Set([ "inv", "visitView", "cook", "water", "garden", "look", "map", "range", "fishShop", "fishGrill", "shop", "talk", "story" ]);
  function step(dt, rdt) {
    if (rdt == null) rdt = dt;
    V.dt = dt;
    V.gt = (V.gt || 0) + dt;
    const In = SX.input;
    if (SX.pad) SX.pad.pre(dt, rdt);
    const uiOpen = SX.ui.isOpen();
    document.body.classList.toggle("uiopen", uiOpen || G.state === "title");
    if (SX.mouse) SX.mouse.tick();
    mouseWorld();
    if (SX.aim) SX.aim.pre();
    if (SX.ui.asking()) {
      In.hit.clear();
    }
    const PH = SX.photo;
    if (PH) PH.input(uiOpen);
    const photo = !!(PH && PH.on), hold = photo && PH.paused;
    if (SX.chat) SX.chat.pre(uiOpen, photo);
    if (In.pressed("help") && G.state !== "title") {
      if (SX.ui.panelKind === "help") SX.ui.closePanel(); else SX.ui.openHelp();
    }
    if (In.pressed("menu")) {
      if (uiOpen) {
        if (SX.ui.menuBack) SX.ui.menuBackGo(); else SX.ui.closePanel();
      } else if (SX.home.deco) SX.home.stopDeco(false, !!SX.home.deco.fromMenu); else if (G.state !== "title") SX.ui.openMenu();
    }
    if (SX.extra && SX.extra.tick) SX.extra.tick(uiOpen);
    if (G.state !== "title" && !uiOpen) {
      if (In.pressed("inventory")) SX.ui.openInventory(); else if (In.pressed("terminal")) SX.ui.openTerminal(G.inRaid() ? "map" : "status");
    } else if (uiOpen && (In.pressed("inventory") || In.pressed("terminal")) && SX.ui.panelKind !== "result") SX.ui.closePanel(); else if (uiOpen && In.pressed("interact") && F_CLOSE.has(SX.ui.panelKind) && !SX.ui.asking()) SX.ui.closePanel();
    const ctl = !uiOpen && G.state !== "title" && !photo;
    In.togTick(ctl, G.state, !!(A.player && A.player.alive));
    let F = null, lv = null, opt = {};
    if (G.state === "raid" && SX.raid.level) {
      if (!hold) SX.raid.update(dt, ctl);
      lv = SX.raid.level;
      F = SX.raid.floor();
      const t = ctl ? SX.raid.target() : null;
      const tk = ctl && A.stealthTarget ? A.stealthTarget(F, A.player) : null;
      SX.ui.prompt(tk ? {
        x: tk.x,
        y: tk.y - 1.3,
        label: "몰래 처치",
        key: "melee"
      } : t);
      if (tk && SX.pick) SX.pick.hov = null;
      if (ctl && In.pressed("interact")) SX.raid.interact(t);
      opt.gas = {
        level: F && F.kind !== "roof" ? SX.raid.gasHere * .5 : 0,
        smoke: SX.raid.smokeHere || 0
      };
      if (SX.raid.flood && F && SX.raid.wLvOf(F.idx) >= 5) {
        opt.gas.dive = 1;
        if (!A.player.spect) {
          opt.gas.dx = A.player.x;
          opt.gas.dy = A.player.y;
        }
      }
      const hs = SX.raid.hudState();
      if (hs && hs.col) opt.column = hs.col;
      if (ctl && In.pressed("ping") && A.player.alive) SX.raid.ping(A.player.floor, V.mouseWorldX, V.mouseWorldY);
      if (ctl) A.crouchKey();
      if (ctl && In.pressed("box")) A.toggleBox();
      if (ctl && In.pressed("brick") && F && !A.player.down) {
        if (SX.tac && SX.tac.takeBrick) SX.tac.takeBrick(A.player); else A.throwBrick(F);
      }
      if (A.player.spect) opt.hidePlayer = true;
      if (F && !hold) A.updateThrown(F, dt);
      if (SX.tac && !hold) SX.tac.update(dt, lv, ctl);
      if (SX.nvg && !hold) SX.nvg.update(dt, ctl, F);
      if (SX.course && SX.course.on && !hold) SX.course.update(dt);
      opt.marks = SX.raid.marks();
      const mb = document.getElementById("hudMapBox").getBoundingClientRect(), ks = (window.devicePixelRatio || 1) / V.scale;
      SX.render.avoid = mb.width ? {
        x0: mb.left * ks,
        y1: mb.bottom * ks
      } : null;
      {
        const hb = document.getElementById("hudBars").getBoundingClientRect();
        SX.render.avoidL = hb.width ? {
          x1: hb.right * ks,
          y1: hb.bottom * ks
        } : null;
      }
      SX.ui.center(hs ? hs.text : null, !!(hs && hs.bad));
      updateInfection(rdt);
    } else if (G.state === "hub" || G.state === "title") {
      if (!SX.hub.level) SX.hub.enter("home");
      if (G.state === "title") {
        titleT += dt;
        const R = SX.hub.level.interior || {
          x0: 4,
          y0: 4,
          x1: 12,
          y1: 10
        };
        V.cam.x = (R.x0 + R.x1 + 1) / 2 * TS + Math.sin(titleT * .1) * 60 - V.vw / 2;
        V.cam.y = (R.y0 + R.y1 + 1) / 2 * TS - V.vh / 2;
        SX.light.update(dt);
        SX.audio.ambient({
          rain: 0,
          inside: false,
          wind: 0,
          hum: 0,
          fire: 0,
          gym: 0,
          river: 0,
          storm: 0,
          market: 0,
          city: 0,
          night: 0
        });
        A.player.x = -40;
        A.player.y = -40;
        A.player.floor = -1;
      } else {
        if (!hold) SX.hub.update(dt, ctl);
        const deco = !!SX.home.deco;
        const t = ctl && !deco ? SX.hub.target() : null;
        SX.ui.prompt(t);
        if (ctl && !deco && In.pressed("interact")) SX.hub.interact(t);
        if (ctl && In.pressed("deco")) {
          if (deco) SX.home.stopDeco(); else if (SX.hub.scene === "home") SX.home.startDeco(); else SX.log("꾸미기는 셸터에서");
        }
        if (ctl && !deco && !A.canShootHere() && In.pressed("fire") && A.weaponOf(A.player) && A.weaponOf(A.player).kind === "gun") SX.log("거점에선 총을 쏠 수 없습니다 — 시장 구석 문이 사격장입니다");
        updateInfection(rdt);
        if (deco) {
          opt.deco = true;
          opt.ghost = SX.home.ghost();
          opt.decoArea = SX.home.decoArea();
        }
      }
      lv = SX.hub.level;
      F = SX.hub.floor();
      opt.npcs = SX.meet ? SX.meet.npcs(F) : F.npcs;
      if (!(SX.hub && SX.hub.ex) && !(SX.fishing && SX.fishing.on)) SX.ui.center(null);
    }
    if (SX.aim && G.state !== "title") SX.aim.tick();
    if (G.state !== "title") {
      if (photo) PH.camera(V, rdt); else updateCamera(dt);
    }
    if (SX.vault && G.state === "hub" && (vaultT += rdt) >= 1) {
      vaultT = 0;
      SX.vault.tick();
    }
    let sub = null, subCh = false;
    if (F && !(G.state === "title" && SX.title && SX.title.cover())) {
      if (A.player && A.player.floor === F.idx) {
        const ey = SX.light.eyeY(F, A.player.x, A.player.y);
        SX.light.computeVis(F, A.player.x, ey, 26, false, A.player.y);
        if (SX.tac) SX.tac.peekVis(F);
        if (G.state === "raid") SX.minimap.reveal(F);
      } else if (G.state === "title") {
        SX.light.visF = null;
      }
      const cam = {
        x: Math.round(V.cam.x + (V.shx || 0)),
        y: Math.round(V.cam.y + (V.shy || 0))
      };
      if (V.camStill && V.camF && A.player && !A.player.aimHeld && !photo && G.state !== "title" && V.scale > 1) {
        const s = V.scale, qx = V.camF.x + (V.shx || 0), qy = V.camF.y + (V.shy || 0);
        let ix = Math.floor(qx), iy = Math.floor(qy), ox = Math.round((qx - ix) * s), oy = Math.round((qy - iy) * s);
        if (ox >= s) {
          ix++;
          ox = 0;
        }
        if (oy >= s) {
          iy++;
          oy = 0;
        }
        cam.x = ix;
        cam.y = iy;
        sub = {
          x: ox,
          y: oy
        };
      }
      SX.render.draw({
        ctx: lctx,
        vw: V.vw + 1,
        vh: V.vh + 1,
        cam,
        dt: hold ? 0 : dt
      }, lv, F, G.env, opt);
      if (SX.pick) {
        if (!photo && !uiOpen && G.state !== "title") SX.pick.draw(lctx, cam); else SX.pick.hov = null;
      }
      if (G.state === "raid" && !photo && SX.access) SX.access.draw(lctx, V.vw, V.vh, cam);
      if (G.state === "raid" && A.player && A.player.alive && !uiOpen && !photo) {
        const w = A.weaponOf(A.player);
        if (A.player.aimHeld && w && w.scope) SX.render.scope(lctx, V.vw, V.vh, V.mouseScreenX, V.mouseScreenY);
      }
      if (!uiOpen && G.state !== "title" && !SX.home.deco && !photo && !(A.player && A.player.spect)) {
        if (sub) subCh = true; else SX.render.crosshair(lctx, V.mouseScreenX, V.mouseScreenY, A.player);
      }
      SX.render.hit = Math.max(0, (SX.render.hit || 0) - dt);
    }
    sctx.imageSmoothingEnabled = false;
    if (photo && PH.zoom > 1) {
      const q = PH.src(V);
      sctx.drawImage(low, q[0], q[1], q[2], q[3], 0, 0, V.vw * V.scale, V.vh * V.scale);
    } else if (sub) sctx.drawImage(low, 0, 0, V.vw + 1, V.vh + 1, -sub.x, -sub.y, (V.vw + 1) * V.scale, (V.vh + 1) * V.scale); else sctx.drawImage(low, 0, 0, V.vw, V.vh, 0, 0, V.vw * V.scale, V.vh * V.scale);
    if (subCh) {
      sctx.save();
      sctx.setTransform(V.scale, 0, 0, V.scale, 0, 0);
      SX.render.crosshair(sctx, V.mouseScreenX, V.mouseScreenY, A.player);
      sctx.restore();
    }
    if (photo) PH.afterDraw();
    if (SX.bgm) SX.bgm.tick(rdt);
    SX.ui.tick(rdt);
    In.endFrame();
  }
  SX.step = step;
  G.load();
  if (document.fonts) Promise.all([ "8px Galmuri7", "10px Galmuri9", "12px Galmuri11", "bold 12px Galmuri11", "9px Galmuri9", "11px Galmuri11", "14px Galmuri14" ].map(f => document.fonts.load(f))).then(() => {
    if (SX.art.textStale) {
      SX.art.textStale = false;
      SX.art.clearCache();
    }
  });
  const verTxt = SX.BUILD;
  document.getElementById("ver").textContent = verTxt;
  document.getElementById("ver2").textContent = verTxt;
  const begin = () => {
    SX.audio.init();
  };
  addEventListener("pointerdown", begin, {
    once: false
  });
  addEventListener("keydown", begin, {
    once: false
  });
  SX.applyScreen();
  SX.hub.enter("home");
  requestAnimationFrame(frame);
  SX.game.resize = resize;
})(window.SX);
