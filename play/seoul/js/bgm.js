"use strict";

(function(SX) {
  const S = SX.audio;
  if (!S) return;
  const B = SX.bgm = {
    want: null,
    cur: null,
    where: null,
    testOut: false
  };
  B.TRACKS = [ "main", "shelter", "raid", "combat", "market", "gym", "fish" ];
  B.OPT = {
    main: "bgmMain",
    shelter: "bgmShelter",
    raid: "bgmRaid",
    combat: "bgmCombat",
    market: "bgmMarket",
    gym: "bgmGym",
    fish: "bgmFish"
  };
  const VOL = {
    main: .7,
    shelter: .58,
    raid: .32,
    combat: .52,
    market: .6,
    gym: .66,
    fish: .56
  };
  const SCENE = {
    home: "shelter",
    visit: "shelter",
    market: "market",
    gym: "gym",
    fish: "fish",
    range: "range"
  };
  const NEXT = {
    main: "shelter",
    raid: "combat",
    combat: "raid"
  };
  const KEEP_BLOBS = 3;
  B.retryMs = 6e4;
  const CB = {
    CHASE_R: 16,
    SHOT_NEAR: 6,
    SHOT_R: 16,
    BOOM_R: 22,
    CHASE_RATE: 1.5,
    DECAY: .35,
    CALM: 10,
    MIN: 8
  };
  B.CB = CB;
  const TEN = {
    ATK: .4,
    REL: 6,
    HOLD: 4,
    NEAR: 4,
    ON: .3,
    OFF: .18,
    MIN_ON: 6,
    MIN_OFF: 1,
    FADE_IN: .75,
    FADE_OUT: 6,
    BEAT: .75,
    BAR: 3
  };
  const STING = {
    WAIT: .75,
    GAIN: .45,
    DIP_DB: 3.5,
    DIP_HOLD: 1.5,
    DIP_REL: 1,
    GAP: 25,
    UP: .75,
    DOWN: 1.5
  };
  const HIDE_S = .3;
  B.TEN = TEN;
  B.STING = STING;
  B.HIDE_S = HIDE_S;
  const NEXT_X = {
    raid: [ "raid_near", "sting_combat" ],
    combat: [ "raid_near" ]
  };
  const URL_MUTE = false;
  const now = () => performance.now();
  B.VOL = VOL;
  B.on = k => !SX.opts || SX.opts[B.OPT[k]] !== false;
  B.place = function() {
    const G = SX.game;
    if (!G) return null;
    if (G.state === "title") return "main";
    if (G.state === "raid") return "raid";
    if (G.state === "hub") {
      const sc = SX.hub && SX.hub.scene;
      return sc && SCENE[sc] || null;
    }
    return null;
  };
  B.pick = function(where) {
    if (where === "raid") return B.fight.on && B.on("combat") ? "combat" : B.on("raid") ? "raid" : null;
    if (!where || where === "range") return null;
    return B.on(where) ? where : null;
  };
  const vOf = (v, d) => v == null || !(v >= 0) ? d : Math.min(1, +v);
  B.audible = function() {
    if (!S.ok || !S.ctx || !S.musBus) return false;
    if (URL_MUTE && !B.testOut) return false;
    const o = SX.opts || {};
    return !o.mute && vOf(o.vol, .8) > .001 && vOf(o.mus, .8) > .001;
  };
  const fight = B.fight = {
    on: false,
    alarm: 0,
    calm: 0,
    dur: 0,
    n: 0,
    why: "",
    seed: null
  };
  let pend = 0, pendAct = false, pendWhy = "", lastHurt = 0;
  function makeTen() {
    const s = {
      v: 0,
      spike: 0,
      hold: 0,
      sig: 0
    };
    s.event = a => {
      s.spike = Math.min(1, s.spike + Math.max(0, +a || 0));
      s.hold = TEN.HOLD;
    };
    s.step = (dt, sig) => {
      s.sig = Math.max(0, Math.min(1, +sig || 0));
      let left = Math.max(0, +dt || 0);
      while (left > 1e-9) {
        const st = s.hold > 0 ? Math.min(left, s.hold) : left, tg = Math.min(1, s.sig + s.spike);
        s.v = tg + (s.v - tg) * Math.exp(-st / (tg > s.v ? TEN.ATK : TEN.REL));
        if (s.hold > 0) {
          s.hold -= st;
          if (s.hold <= 1e-9) {
            s.hold = 0;
            s.spike = 0;
          }
        }
        left -= st;
      }
      return s.v;
    };
    s.reset = () => {
      s.v = 0;
      s.spike = 0;
      s.hold = 0;
      s.sig = 0;
    };
    return s;
  }
  function makeGate() {
    const g = {
      on: false,
      since: 99,
      ch: 0
    };
    g.step = (dt, x) => {
      g.since += Math.max(0, +dt || 0);
      if (!g.on) {
        if (x >= TEN.ON && g.since >= TEN.MIN_OFF) {
          g.on = true;
          g.since = 0;
          g.ch++;
          return true;
        }
      } else if (x <= TEN.OFF && g.since >= TEN.MIN_ON) {
        g.on = false;
        g.since = 0;
        g.ch++;
        return true;
      }
      return false;
    };
    g.reset = () => {
      g.on = false;
      g.since = 99;
    };
    return g;
  }
  B.makeTen = makeTen;
  B.makeGate = makeGate;
  const ten = B.ten = makeTen(), gate = B.gate = makeGate();
  B.tenOverride = null;
  let close = 0, nearD = null;
  const smooth = (a, b, x) => {
    const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  const fightReset = () => {
    fight.on = false;
    fight.alarm = 0;
    fight.calm = 0;
    fight.dur = 0;
    fight.why = "";
    pend = 0;
    pendAct = false;
    lastHurt = 0;
    ten.reset();
    close = 0;
    nearD = null;
  };
  B.heard = function(name, o, sp, gun) {
    const boom = name === "explode" || name === "flashbang";
    if (!(gun || boom) || !SX.game || SX.game.state !== "raid" || o && o.amb) return;
    const p = SX.actors && SX.actors.player;
    if (o && o.f != null && p && o.f !== p.floor) return;
    const d = o && o.x != null ? sp.d : 0;
    let add = 0;
    if (boom) {
      if (d <= CB.BOOM_R) add = 1;
    } else if (d <= CB.SHOT_NEAR) add = .6; else if (d <= CB.SHOT_R) add = .35;
    if (!add) return;
    if (name === "suppressed") add *= .5;
    pend += add;
    pendAct = true;
    pendWhy = boom ? "boom" : d === 0 ? "own" : "shot";
    ten.event(add);
  };
  function fightTick(dt, where) {
    if (where !== "raid") {
      if (fight.on || fight.alarm || pend || ten.v) fightReset();
      return;
    }
    const seed = SX.raid ? SX.raid.seed : null;
    if (seed !== fight.seed) {
      fightReset();
      fight.seed = seed;
    }
    const A = SX.actors, p = A && A.player;
    let add = pend, act = pendAct, why = pend ? pendWhy : "";
    pend = 0;
    pendAct = false;
    close = 0;
    nearD = null;
    if (p && p.alive) {
      const h = p.hurtT || 0;
      if (h > lastHurt + .05) {
        add += 1;
        act = true;
        why = "hit";
        ten.event(1);
      }
      lastHurt = h;
      if (p.down) act = true;
      let dMin = Infinity;
      if (A.enemies) for (const e of A.enemies) {
        if (e.alive && e.ai === "chase" && e.floor === p.floor) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= CB.CHASE_R && d < dMin) dMin = d;
        }
      }
      if (dMin <= CB.CHASE_R) {
        add += dt * CB.CHASE_RATE;
        act = true;
        why = why || "chase";
        nearD = dMin;
        close = 1 - smooth(TEN.NEAR, CB.CHASE_R, dMin);
      }
    }
    fight.alarm = Math.max(0, Math.min(2, fight.alarm + (add > 0 ? add : -dt * CB.DECAY)));
    if (!fight.on) {
      if (fight.alarm >= 1) {
        fight.on = true;
        fight.dur = 0;
        fight.calm = 0;
        fight.n++;
        fight.why = why;
      }
    } else {
      fight.dur += dt;
      if (act) fight.calm = 0; else fight.calm += dt;
      if (fight.calm >= CB.CALM && fight.dur >= CB.MIN) {
        fight.on = false;
        fight.alarm = 0;
        fight.why = "";
      }
    }
    const sig = B.tenOverride != null ? +B.tenOverride : fight.on ? 1 : Math.max(Math.min(1, fight.alarm), close);
    ten.step(dt, sig);
  }
  B.LOOP = {};
  const DEC_RATE = 44100;
  const PAIR = {
    raid: "combat",
    combat: "raid"
  };
  const T = {};
  const mk = k => ({
    k,
    st: "none",
    lvl: 0,
    up: 1 / 1.8,
    down: 1 / 1.8,
    used: 0,
    missAt: 0,
    ab: null,
    buf: null,
    src: null,
    g: null,
    gctx: null,
    at: 0,
    off: 0,
    pos: 0,
    decN: 0,
    plays: 0
  });
  const tr = k => T[k] || (T[k] = mk(k));
  const X = {};
  const xt = k => X[k] || (X[k] = mk(k));
  const NEAR = xt("raid_near"), STG = xt("sting_combat");
  NEAR.ramp = null;
  NEAR.rsrc = null;
  NEAR.gp = null;
  STG.plays = 0;
  STG.last = null;
  let busy = false, decoding = false, coreOk = false, coreHook = false;
  function coreReady() {
    if (coreOk) return true;
    if (S.coreReady && !coreHook) {
      coreHook = true;
      S.coreReady.then(() => {
        coreOk = true;
      }, () => {
        coreOk = true;
      });
    }
    return coreOk || S.coreLoaded != null || S.loaded != null;
  }
  B.base = () => B.BASE || S.SND_BASE || "snd/";
  function load(k, x) {
    const t = x || tr(k);
    k = t.k;
    if (busy || t.st === "load" || t.ab || t.buf) return;
    if (t.st === "miss" && now() - t.missAt < B.retryMs) return;
    if (SX.SND_HAVE && !SX.SND_HAVE.has("bgm_" + k)) {
      t.st = "miss";
      t.missAt = Infinity;
      return;
    }
    busy = true;
    t.st = "load";
    const miss = () => {
      t.st = "miss";
      t.missAt = now();
    };
    let req;
    try {
      req = fetch(B.base() + "bgm_" + k + ".ogg", {
        priority: "low"
      });
    } catch (e) {
      req = Promise.reject(e);
    }
    req.then(r => r && r.ok ? r.arrayBuffer() : null).then(ab => {
      if (!ab || ab.byteLength < 64) {
        miss();
        return;
      }
      t.ab = ab;
      t.size = ab.byteLength;
      t.st = "have";
    }).catch(miss).then(() => {
      busy = false;
    });
  }
  function decode(k, x) {
    const t = x || T[k];
    if (!t || !t.ab || t.buf || decoding) return;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) {
      t.st = "miss";
      t.missAt = now();
      return;
    }
    decoding = true;
    const bad = () => {
      t.ab = null;
      t.st = "miss";
      t.missAt = now();
    };
    new Promise(res => {
      try {
        const pr = new OAC(2, 1, DEC_RATE).decodeAudioData(t.ab.slice(0), res, () => res(null));
        if (pr && pr.catch) pr.catch(() => res(null));
      } catch (e) {
        res(null);
      }
    }).then(b => {
      if (b && b.length > 16) {
        t.buf = b;
        t.decN++;
      } else bad();
    }, bad).then(() => {
      decoding = false;
    });
  }
  const loopOf = t => {
    const L = B.LOOP[t.k], d = t.buf.duration;
    return L && L[1] > L[0] && L[1] <= d + 1e-6 ? [ Math.max(0, L[0]), L[1] ] : [ 0, d ];
  };
  function posAt(t, at) {
    if (!t.src || !t.buf) return t.pos || 0;
    const [ls, le] = loopOf(t);
    let p = t.off + (at - t.at);
    if (p >= le) p = ls + (p - ls) % (le - ls);
    return Math.max(0, p);
  }
  const M = {
    dip: null,
    ctx: null
  };
  function mix() {
    const ctx = S.ctx;
    if (!M.dip || M.ctx !== ctx) {
      M.dip = ctx.createGain();
      M.dip.connect(S.musBus);
      M.ctx = ctx;
    }
    return M;
  }
  function start(t) {
    const ctx = S.ctx;
    if (!t.g || t.gctx !== ctx) {
      t.g = ctx.createGain();
      t.g.gain.value = 0;
      t.g.connect(mix().dip);
      t.gctx = ctx;
    }
    const [ls, le] = loopOf(t), src = ctx.createBufferSource();
    src.buffer = t.buf;
    src.loop = true;
    src.loopStart = ls;
    src.loopEnd = le;
    src.connect(t.g);
    const at = ctx.currentTime + .02, q = T[PAIR[t.k]];
    let off = q && q.src && q.buf ? posAt(q, at) : t.pos || 0;
    if (!(off >= 0) || off >= le) off = ls + Math.max(0, off - ls) % (le - ls);
    src.start(at, off);
    t.src = src;
    t.at = at;
    t.off = off;
    t.plays++;
    t.syncd = !!(q && q.src);
    if (t.k === "raid") layerStart(at, off);
  }
  function halt(t) {
    if (!t.src) return;
    const ctx = S.ctx, at = ctx.currentTime + .08, s = t.src;
    t.pos = posAt(t, at);
    t.src = null;
    try {
      if (t.g) t.g.gain.setTargetAtTime(0, ctx.currentTime, .02);
      s.stop(at);
    } catch (e) {}
    s.onended = () => {
      try {
        s.disconnect();
      } catch (e) {}
    };
    if (t.k === "raid") layerHalt(at);
  }
  function layerStart(at, off) {
    const L = NEAR, R = T.raid, ctx = S.ctx;
    if (!L.buf || !R || !R.g || !R.src || B.hidden) return;
    if (L.src) layerHalt(ctx.currentTime);
    if (!L.g || L.gctx !== ctx) {
      L.g = ctx.createGain();
      L.g.gain.value = 0;
      L.gctx = ctx;
      L.gp = null;
    }
    if (L.gp !== R.g) {
      try {
        L.g.disconnect();
      } catch (e) {}
      L.g.connect(R.g);
      L.gp = R.g;
    }
    const [ls, le] = loopOf(R), src = ctx.createBufferSource();
    src.buffer = L.buf;
    src.loop = true;
    src.loopStart = ls;
    src.loopEnd = Math.min(le, L.buf.duration);
    src.connect(L.g);
    src.start(at, off);
    L.src = src;
    L.at = at;
    L.off = off;
    L.rsrc = R.src;
    L.plays++;
    const ct = ctx.currentTime, full = gate.on && L.ramp && L.ramp[1] === 1 && L.ramp[3] <= ct;
    L.g.gain.cancelScheduledValues(ct);
    L.g.gain.setValueAtTime(full ? 1 : 0, ct);
    L.ramp = full ? [ 1, 1, ct, ct ] : null;
    if (gate.on && !full) layerRamp(true, at);
  }
  function layerHalt(at) {
    const L = NEAR, s = L.src;
    if (!s) return;
    L.src = null;
    L.rsrc = null;
    try {
      s.stop(Math.max(S.ctx.currentTime, at || 0));
    } catch (e) {}
    s.onended = () => {
      try {
        s.disconnect();
      } catch (e) {}
    };
  }
  function layerW(ct) {
    const r = NEAR.ramp;
    if (!r) return 0;
    if (ct <= r[2]) return r[0];
    if (ct >= r[3] || r[3] <= r[2]) return r[1];
    return r[0] + (r[1] - r[0]) * (ct - r[2]) / (r[3] - r[2]);
  }
  function layerRamp(on, from) {
    const L = NEAR, R = T.raid, ctx = S.ctx;
    if (!L.g || !ctx) return;
    const g = L.g.gain, ct = ctx.currentTime, v0 = layerW(ct);
    g.cancelScheduledValues(ct);
    g.setValueAtTime(v0, ct);
    if (on) {
      const t0 = Math.max(ct, from || 0), p = R && R.src ? posAt(R, t0) : 0;
      let w = TEN.BAR - p % TEN.BAR;
      if (w >= TEN.BAR - 1e-4) w = 0;
      const a = t0 + w, b = a + TEN.FADE_IN * (1 - v0);
      if (a > ct) g.setValueAtTime(v0, a);
      g.linearRampToValueAtTime(1, b);
      L.ramp = [ v0, 1, a, b ];
    } else {
      const b = ct + TEN.FADE_OUT * v0;
      g.linearRampToValueAtTime(0, b);
      L.ramp = [ v0, 0, ct, b ];
    }
  }
  function layerTick(dt, aud) {
    const L = NEAR, R = T.raid, ch = gate.step(dt, B.where === "raid" ? ten.v : 0);
    if (!S.ok || !S.ctx) return;
    if (L.g && L.gctx !== S.ctx) {
      L.src = null;
      L.g = null;
      L.ramp = null;
    }
    if (!(aud && R && R.src && R.g && L.buf) || B.hidden) {
      if (L.src && !B.hidden) layerHalt(S.ctx.currentTime + .08);
      return;
    }
    if (!L.src || L.rsrc !== R.src || L.gp !== R.g) {
      const at = S.ctx.currentTime + .05;
      layerStart(at, posAt(R, at));
    } else if (ch) layerRamp(gate.on);
  }
  let stWait = null, stN = -1, stT = -1e9;
  function beatWait(aud) {
    const R = T.raid, ctx = S.ctx, ct = ctx.currentTime;
    if (!R || !R.src || !R.buf) return {
      at: 0,
      sting: false
    };
    const p = posAt(R, ct);
    let w = TEN.BEAT - p % TEN.BEAT;
    if (w >= TEN.BEAT - 1e-4) w = 0;
    const at = ct + Math.min(STING.WAIT, w), go = !!(aud && STG.buf && B.on("combat") && fight.n !== stN && now() - stT >= STING.GAP * 1e3);
    if (go) stingPlay(at);
    return {
      at,
      sting: go
    };
  }
  function stingPlay(at) {
    const ctx = S.ctx, m = mix();
    if (!STG.g || STG.gctx !== ctx) {
      STG.g = ctx.createGain();
      STG.g.connect(S.musBus);
      STG.gctx = ctx;
    }
    STG.g.gain.value = STING.GAIN;
    const src = ctx.createBufferSource();
    src.buffer = STG.buf;
    src.connect(STG.g);
    src.start(at);
    src.onended = () => {
      try {
        src.disconnect();
      } catch (e) {}
      if (STG.src === src) STG.src = null;
    };
    STG.src = src;
    STG.plays++;
    STG.last = {
      at: +at.toFixed(3),
      wait: +(at - ctx.currentTime).toFixed(3),
      n: fight.n,
      raidPos: +posAt(T.raid, at).toFixed(3)
    };
    stN = fight.n;
    stT = now();
    const d = m.dip.gain, ct = ctx.currentTime, lo = Math.pow(10, -STING.DIP_DB / 20), v0 = d.value;
    d.cancelScheduledValues(ct);
    d.setValueAtTime(v0, ct);
    d.setValueAtTime(v0, at);
    d.linearRampToValueAtTime(lo, at + .05);
    d.setValueAtTime(lo, at + STING.DIP_HOLD);
    d.linearRampToValueAtTime(1, at + STING.DIP_HOLD + STING.DIP_REL);
  }
  function freeBuf(t) {
    halt(t);
    t.buf = null;
    if (t.g) {
      try {
        t.g.disconnect();
      } catch (e) {}
      t.g = null;
    }
  }
  function output(t, aud) {
    if (t.g && t.gctx !== S.ctx) {
      t.src = null;
      t.g = null;
    }
    if (B.hidden) {
      if (t.src && B.hideDone) halt(t);
      return;
    }
    if (!aud || t.lvl <= .001 || !t.buf) {
      if (t.src) halt(t);
      return;
    }
    if (!t.src) start(t);
    const gv = Math.sin(Math.min(1, Math.max(0, t.lvl)) * Math.PI / 2) * (VOL[t.k] || .5);
    t.g.gain.setTargetAtTime(gv, S.ctx.currentTime, .06);
  }
  const lvlNow = () => {
    let a = 0;
    for (const k in T) {
      const t = T[k];
      if (t.src) a = Math.max(a, t.lvl);
    }
    return a;
  };
  B.level = function() {
    return B.hidden && lvlHid != null ? lvlHid : lvlNow();
  };
  B.hidden = false;
  B.hideN = 0;
  B.hideDone = false;
  let hideTO = 0, lvlHid = null;
  function hideAll() {
    for (const k in T) halt(T[k]);
    if (S.ctx) layerHalt(S.ctx.currentTime);
    B.hideDone = true;
  }
  function onVis() {
    const h = document.visibilityState === "hidden";
    if (h === B.hidden) return;
    B.hidden = h;
    clearTimeout(hideTO);
    B.hideDone = false;
    lvlHid = h ? lvlNow() : null;
    if (h) B.hideN++;
    const ctx = S.ctx, g = ctx && S.musHide ? S.musHide.gain : null;
    if (g) {
      const ct = ctx.currentTime;
      g.cancelScheduledValues(ct);
      g.setValueAtTime(g.value, ct);
      g.linearRampToValueAtTime(h ? 0 : 1, ct + HIDE_S);
    }
    if (h) hideTO = setTimeout(() => {
      if (B.hidden) hideAll();
    }, HIDE_S * 1e3 + 30);
  }
  document.addEventListener("visibilitychange", onVis);
  B._vis = onVis;
  B.droneMul = function() {
    if (SX.game && SX.game.state === "raid" && !B.want) return 0;
    return Math.max(0, 1 - B.level());
  };
  let errN = 0, raidSeed = null;
  B.tick = function(dt) {
    try {
      tick(Math.min(.1, Math.max(0, +dt || 0)));
    } catch (e) {
      if (errN++ < 3 && SX.errs) console.warn("bgm", e);
    }
  };
  function tick(dt) {
    const where = B.where = B.place();
    if (where === "raid" && SX.raid && SX.raid.seed !== raidSeed) {
      raidSeed = SX.raid.seed;
      for (const k of [ "raid", "combat" ]) if (T[k] && !T[k].src) T[k].pos = 0;
    }
    if (where !== "raid") raidSeed = null;
    fightTick(dt, where);
    const want = B.want = B.pick(where);
    let cur = want;
    if (want === "combat" && T.combat && T.combat.st === "miss" && B.on("raid")) cur = "raid";
    const aud = B.audible();
    if (B.cur === "raid" && cur === "combat" && aud && S.ctx && !B.hidden) {
      if (!stWait) stWait = beatWait(aud);
      if (S.ctx.currentTime < stWait.at - .008) cur = "raid";
    }
    if (cur !== "raid" || want !== "combat") stWait = null;
    if (cur !== B.cur) {
      const a = B.cur, b = cur;
      let outS = 1.8, inS = 1.8;
      if (a === "raid" && b === "combat") {
        outS = STING.DOWN;
        inS = STING.UP;
      } else if (a === "combat" && b === "raid") {
        outS = 5;
        inS = 4;
      } else if (a === "combat" || b === "combat") {
        outS = b === "combat" ? 1.5 : 4;
        inS = 1.5;
      }
      for (const k in T) if (k !== b) T[k].down = 1 / outS;
      if (b) tr(b).up = 1 / inS;
      B.cur = cur;
      B.changes = (B.changes || 0) + 1;
    }
    if (cur) tr(cur).used = now();
    const pair = cur && PAIR[cur] && B.on(PAIR[cur]) ? PAIR[cur] : null;
    if (aud && coreReady()) {
      if (cur) load(cur);
      const nx = cur && NEXT[cur];
      if (nx && T[cur].st !== "load" && B.on(nx)) load(nx);
      if (cur) decode(cur);
      if (pair && T[cur] && T[cur].buf) decode(pair);
      const xs = where === "raid" && B.on("raid") && cur && NEXT_X[cur], tc = cur && T[cur];
      const ready = tc && tc.buf && (!nx || !B.on(nx) || T[nx] && (T[nx].ab || T[nx].st === "miss")) && (!pair || T[pair] && (T[pair].buf || T[pair].st === "miss"));
      if (xs && ready) for (const xk of xs) {
        const x = X[xk];
        if (xk === "sting_combat" && !B.on("combat")) continue;
        load(xk, x);
        decode(xk, x);
      }
    }
    let others = 0;
    for (const k in T) if (k !== cur) others = Math.max(others, T[k].lvl);
    for (const k in T) {
      const t = T[k], target = k === cur && t.buf && aud ? 1 : 0;
      if (target > t.lvl) {
        if (t.lvl <= 0 && others < .05 && k !== "combat") t.up = Math.min(t.up, 1 / 3);
        t.lvl = Math.min(1, t.lvl + dt * t.up);
      } else if (target < t.lvl) t.lvl = Math.max(0, t.lvl - dt * t.down);
      if (S.ok && S.ctx) output(t, aud);
    }
    layerTick(dt, aud);
    if (NEAR.buf && !(where === "raid" && B.on("raid")) && !(T.raid && T.raid.src)) {
      if (S.ctx) layerHalt(S.ctx.currentTime);
      NEAR.buf = null;
    }
    if (STG.buf && where !== "raid" && !STG.src) STG.buf = null;
    const keepDec = new Set([ cur, pair ].filter(Boolean)), keep = new Set([ cur, cur && NEXT[cur], want ].filter(Boolean));
    for (const k in T) {
      const t = T[k];
      if (t.buf && t.lvl <= 0 && !keepDec.has(k)) freeBuf(t);
    }
    const held = Object.values(T).filter(t => t.ab && !keep.has(t.k) && !t.buf).sort((a, b) => a.used - b.used);
    let n = Object.values(T).filter(t => t.ab).length;
    for (const t of held) {
      if (n <= KEEP_BLOBS) break;
      t.ab = null;
      if (t.st === "have") t.st = "none";
      n--;
    }
  }
  B.info = function() {
    const tracks = {}, ct = S.ctx ? S.ctx.currentTime : 0;
    for (const k in T) {
      const t = T[k];
      tracks[k] = {
        st: t.buf ? "ready" : t.st,
        lvl: +t.lvl.toFixed(3),
        el: !!t.buf,
        playing: !!t.src,
        time: t.buf ? +posAt(t, ct).toFixed(2) : null,
        mounts: t.decN,
        plays: t.plays,
        url: !!t.ab,
        gain: t.g ? +t.g.gain.value.toFixed(3) : null,
        loop: t.buf ? loopOf(t).map(v => +v.toFixed(4)) : null,
        rate: t.buf ? t.buf.sampleRate : null,
        up: +t.up.toFixed(3),
        down: +t.down.toFixed(3)
      };
    }
    const L = NEAR, R = T.raid, rp = R && R.src && R.buf ? posAt(R, ct) : null;
    const layer = {
      st: L.buf ? "ready" : L.st,
      on: gate.on,
      ch: gate.ch,
      since: +Math.min(99, gate.since).toFixed(2),
      w: +layerW(ct).toFixed(3),
      gain: L.g ? +L.g.gain.value.toFixed(3) : null,
      playing: !!L.src,
      plays: L.plays,
      pos: L.src && L.buf ? +posAt(L, ct).toFixed(4) : null,
      raidPos: rp != null ? +rp.toFixed(4) : null,
      sameStart: !!(L.src && R && R.src && L.rsrc === R.src),
      dAt: L.src && R && R.src ? +(L.at - R.at).toFixed(6) : null,
      dOff: L.src && R && R.src ? +(L.off - R.off - (L.at - R.at)).toFixed(6) : null,
      ch1: L.buf ? L.buf.numberOfChannels : null,
      len: L.buf ? L.buf.length : null,
      raidLen: R && R.buf ? R.buf.length : null,
      ramp: L.ramp ? L.ramp.map(v => +v.toFixed(3)) : null
    };
    const mib = b => b ? b.length * b.numberOfChannels * 4 / 1048576 : 0;
    let dec = mib(L.buf) + mib(STG.buf);
    for (const k in T) dec += mib(T[k].buf);
    return {
      where: B.where,
      want: B.want,
      cur: B.cur,
      aud: B.audible(),
      fight: {
        on: fight.on,
        alarm: +fight.alarm.toFixed(3),
        calm: +fight.calm.toFixed(2),
        dur: +fight.dur.toFixed(2),
        n: fight.n,
        why: fight.why
      },
      tracks,
      changes: B.changes || 0,
      drone: +B.droneMul().toFixed(3),
      ten: {
        v: +ten.v.toFixed(4),
        sig: +ten.sig.toFixed(4),
        spike: +ten.spike.toFixed(3),
        hold: +ten.hold.toFixed(2),
        close: +close.toFixed(3),
        nearD: nearD != null ? +nearD.toFixed(2) : null
      },
      layer,
      sting: {
        st: STG.buf ? "ready" : STG.st,
        sec: STG.buf ? +STG.buf.duration.toFixed(3) : null,
        ch: STG.buf ? STG.buf.numberOfChannels : null,
        plays: STG.plays,
        last: STG.last,
        playing: !!STG.src,
        wait: stWait ? +(stWait.at - ct).toFixed(3) : null
      },
      ct: +ct.toFixed(3),
      dip: M.dip && M.ctx === S.ctx ? +M.dip.gain.value.toFixed(4) : null,
      hide: S.musHide && S.ctx ? +S.musHide.gain.value.toFixed(4) : null,
      hidden: B.hidden,
      hideN: B.hideN,
      hideDone: B.hideDone,
      duck: S.musDuck ? {
        gain: +S.musDuck.gain.value.toFixed(4),
        n: S.duckN,
        last: S.duckLast
      } : null,
      decMiB: +dec.toFixed(1)
    };
  };
  B._seek = function(k, p) {
    const t = T[k];
    if (!t) return false;
    halt(t);
    t.pos = +p || 0;
    return true;
  };
  B.forget = function() {
    for (const k in T) {
      freeBuf(T[k]);
      delete T[k];
    }
    if (S.ctx) layerHalt(S.ctx.currentTime);
    for (const k in X) {
      const x = X[k];
      x.buf = null;
      x.ab = null;
      x.st = "none";
      x.missAt = 0;
    }
    NEAR.ramp = null;
    STG.plays = 0;
    STG.last = null;
    NEAR.plays = 0;
    gate.reset();
    gate.ch = 0;
    stWait = null;
    stN = -1;
    stT = -1e9;
    busy = false;
    decoding = false;
    B.cur = null;
    fightReset();
  };
})(window.SX);
