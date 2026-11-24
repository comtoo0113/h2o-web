"use strict";

window.SX = window.SX || {};

(function(SX) {
  SX.BUILD = "dot-0.9.161";
  SX.TS = 32;
  SX.PACE = 1.25;
  SX.data = window.SX_DATA;
  function mulberry(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function Rng(seed) {
    this.f = mulberry(seed == null ? Math.random() * 4294967296 >>> 0 : seed);
  }
  Rng.prototype.i = function(n) {
    return this.f() * n | 0;
  };
  Rng.prototype.r = function(a, b) {
    return a + this.f() * (b - a);
  };
  Rng.prototype.ri = function(a, b) {
    return a + this.i(b - a + 1);
  };
  Rng.prototype.pick = function(arr) {
    return arr[this.i(arr.length)];
  };
  Rng.prototype.chance = function(p) {
    return this.f() < p;
  };
  Rng.prototype.shuffle = function(arr) {
    for (let k = arr.length - 1; k > 0; k--) {
      const j = this.i(k + 1);
      const t = arr[k];
      arr[k] = arr[j];
      arr[j] = t;
    }
    return arr;
  };
  Rng.prototype.weighted = function(arr, key) {
    let s = 0;
    for (const a of arr) s += a[key] || 0;
    let t = this.f() * s;
    for (const a of arr) {
      t -= a[key] || 0;
      if (t <= 0) return a;
    }
    return arr[arr.length - 1];
  };
  SX.Rng = Rng;
  SX.rnd = new Rng;
  SX.hash = function(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  };
  SX.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  SX.lerp = (a, b, t) => a + (b - a) * t;
  SX.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  SX.angDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  SX.approach = (v, t, s) => v < t ? Math.min(t, v + s) : Math.max(t, v - s);
  SX.won = n => "₩" + Math.round(n).toLocaleString("ko-KR");
  SX.esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
  SX.KEY_ACTIONS = [ [ "up", "위로", [ "KeyW" ] ], [ "down", "아래로", [ "KeyS" ] ], [ "left", "왼쪽", [ "KeyA" ] ], [ "right", "오른쪽", [ "KeyD" ] ], [ "fire", "사격", [ "Mouse0" ] ], [ "aim", "조준 사격", [ "Mouse2" ] ], [ "sprint", "달리기", [ "ShiftLeft" ] ], [ "quiet", "조용히 걷기", [ "ControlLeft" ] ], [ "interact", "줍기 · 뒤지기 · 문", [ "KeyF", "KeyE" ] ], [ "reload", "재장전", [ "KeyR" ] ], [ "w1", "주무기", [ "Digit1" ] ], [ "w2", "보조무기", [ "Digit2" ] ], [ "w3", "근접무기", [ "Digit3" ] ], [ "q4", "단축 칸 1", [ "Digit4" ] ], [ "q5", "단축 칸 2", [ "Digit5" ] ], [ "q6", "단축 칸 3", [ "Digit6" ] ], [ "q7", "단축 칸 4", [ "Digit7" ] ], [ "q8", "단축 칸 5", [ "Digit8" ] ], [ "q9", "단축 칸 6", [ "Digit9" ] ], [ "q10", "단축 칸 7", [ "Digit0" ] ], [ "q11", "단축 칸 8", [ "Minus" ] ], [ "q12", "단축 칸 9", [ "Equal" ] ], [ "q13", "단축 칸 10", [] ], [ "melee", "근접 공격", [ "KeyV" ] ], [ "grenade", "투척물 꺼내기(수류탄 · 섬광탄 · 최루탄 · 연막탄 · 화염병)", [ "KeyQ" ] ], [ "wheel", "단축 칸 원형 메뉴(누른 채 고르고 놓기)", [ "KeyG" ] ], [ "light", "손전등", [ "KeyL" ] ], [ "nvg", "야간 투시경 켜고 끄기", [ "KeyJ" ] ], [ "heal", "알맞은 회복약 쓰기", [ "KeyH" ] ], [ "crouch", "앉기(몸 낮추기)", [ "KeyX" ] ], [ "brick", "벽돌 꺼내기(던져서 소리로 꾀기)", [ "KeyT" ] ], [ "box", "종이상자 쓰기", [ "KeyN" ] ], [ "inventory", "가방", [ "Tab", "KeyI" ] ], [ "terminal", "단말기 · 지도 · 의뢰", [ "KeyM" ] ], [ "ping", "핑 찍기(조준한 곳)", [ "KeyZ", "Mouse1" ] ], [ "chat", "메시지 · 채팅", [ "Enter" ] ], [ "deco", "셸터 꾸미기", [ "KeyC" ] ], [ "menu", "메뉴", [ "Escape" ] ], [ "help", "도움말", [ "F1" ] ], [ "mode", "사격 방식", [ "KeyB" ] ], [ "photo", "사진 모드(화면 글자를 숨기고 찍기)", [ "F9" ] ] ];
  const KEYS_LS = "sxd_keys";
  SX.keys = {};
  SX.loadKeys = function() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEYS_LS) || "{}") || {};
    } catch (e) {}
    const same = (a, b) => Array.isArray(a) && a.length === 1 && a[0] === b;
    if (!saved.wheel && (same(saved.grenade, "KeyG") || same(saved.q13, "KeyG") || same(saved.q13, "KeyQ"))) {
      if (same(saved.grenade, "KeyG")) saved.grenade = [ "KeyQ" ];
      if (same(saved.q13, "KeyG") || same(saved.q13, "KeyQ")) delete saved.q13;
      try {
        localStorage.setItem(KEYS_LS, JSON.stringify(saved));
      } catch (e) {}
    }
    {
      const ids = new Set(SX.KEY_ACTIONS.map(a => a[0])), gone = Object.keys(saved).filter(k => !ids.has(k));
      if (gone.length) {
        for (const k of gone) delete saved[k];
        try {
          localStorage.setItem(KEYS_LS, JSON.stringify(saved));
        } catch (e) {}
      }
    }
    for (const [id, , def] of SX.KEY_ACTIONS) SX.keys[id] = Array.isArray(saved[id]) && (saved[id].length || id !== "menu") ? saved[id].slice(0, 2) : def.slice();
  };
  SX.saveKeys = function() {
    try {
      localStorage.setItem(KEYS_LS, JSON.stringify(SX.keys));
    } catch (e) {}
  };
  SX.keyLabel = function(code) {
    if (!code) return "-";
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    const m = {
      Mouse0: "좌클릭",
      Mouse1: "휠클릭",
      Mouse2: "우클릭",
      ShiftLeft: "Shift",
      ShiftRight: "R-Shift",
      ControlLeft: "Ctrl",
      ControlRight: "R-Ctrl",
      AltLeft: "Alt",
      Space: "Space",
      Tab: "Tab",
      Escape: "Esc",
      Enter: "Enter",
      Backquote: "`",
      Minus: "-",
      Equal: "="
    };
    return m[code] || code.replace(/^Arrow/, "↕").replace(/^Numpad/, "Num");
  };
  SX.label = id => SX.pad && SX.pad.label(id) || SX.keyLabel((SX.keys[id] || [])[0]);
  SX.loadKeys();
  const In = SX.input = {
    down: new Set,
    hit: new Set,
    mx: 0,
    my: 0,
    wheel: 0,
    typing: null,
    padMove: null
  };
  SX.HOLD_ACTS = [ [ "aim", "hold" ], [ "sprint", "hold" ], [ "crouch", "tog" ], [ "quiet", "hold" ] ];
  SX.PAD_HOLD = [ [ "aim", "hold" ], [ "sprint", "tog" ] ];
  SX.holdMode = (id, pad) => {
    const L = pad ? SX.PAD_HOLD : SX.HOLD_ACTS, d = L.find(a => a[0] === id), o = SX.opts && SX.opts[pad ? "phm" : "hm"], v = o && typeof o === "object" ? o[id] : null;
    return v === "hold" || v === "tog" ? v : d ? d[1] : "hold";
  };
  const TOG = {
    aim: 1,
    sprint: 1,
    quiet: 1
  };
  In.tg = {
    aim: false,
    sprint: false,
    quiet: false
  };
  In.kbHeld = id => (SX.keys[id] || []).some(c => In.down.has(c));
  In.kbHit = id => (SX.keys[id] || []).some(c => In.hit.has(c));
  In.held = id => (TOG[id] && SX.holdMode(id) === "tog" ? In.tg[id] : In.kbHeld(id)) || In.down.has("pad:" + id);
  In.pressed = id => (SX.keys[id] || []).some(c => In.hit.has(c)) || In.hit.has("pad:" + id);
  In.togOff = () => {
    In.tg.aim = false;
    In.tg.sprint = false;
    In.tg.quiet = false;
  };
  let togState = null;
  In.togTick = function(ctl, state, alive) {
    if (state !== togState || !alive) {
      togState = state;
      In.togOff();
    }
    if (!ctl) {
      In.tg.aim = false;
      return;
    }
    for (const id in TOG) if (SX.holdMode(id) === "tog" && In.kbHit(id)) {
      In.tg[id] = !In.tg[id];
      if (In.tg[id] && id === "sprint") In.tg.quiet = false;
      if (In.tg[id] && id === "quiet") In.tg.sprint = false;
    }
  };
  In.endFrame = () => {
    In.hit.clear();
    In.wheel = 0;
  };
  addEventListener("keydown", e => {
    if (e.code === "F1") e.preventDefault();
    if (In.typing) {
      e.preventDefault();
      In.typing(e.code);
      return;
    }
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (!e.repeat) In.hit.add(e.code);
    In.down.add(e.code);
    if (e.code === "Tab" || e.code === "Space" || e.ctrlKey && /Key[WSADRFE]/.test(e.code) || e.code.startsWith("Arrow")) e.preventDefault();
  });
  addEventListener("keyup", e => {
    In.down.delete(e.code);
  });
  addEventListener("blur", () => In.down.clear());
  let ctrlOn = false;
  const ctrlSync = e => {
    if (e.isTrusted) ctrlOn = !!(e.ctrlKey || e.metaKey);
  };
  addEventListener("keydown", ctrlSync, true);
  addEventListener("keyup", ctrlSync, true);
  addEventListener("mousedown", ctrlSync, true);
  addEventListener("blur", () => {
    ctrlOn = false;
  });
  addEventListener("beforeunload", e => {
    if (!ctrlOn || window.seoulApp) return;
    e.preventDefault();
    e.returnValue = "";
  });
  In.ctrlGuard = () => ctrlOn;
  addEventListener("mousemove", e => {
    if (In.lockMove && In.lockMove(e)) return;
    In.mx = e.clientX;
    In.my = e.clientY;
  });
  addEventListener("mousedown", e => {
    const c = "Mouse" + e.button;
    if (In.typing) {
      e.preventDefault();
      In.typing(c);
      return;
    }
    if (e.target.id !== "screen") return;
    if (e.button === 1) e.preventDefault();
    In.down.add(c);
    In.hit.add(c);
  });
  addEventListener("mouseup", e => In.down.delete("Mouse" + e.button));
  addEventListener("wheel", e => {
    if (e.target.id === "screen" && !(e.ctrlKey || e.metaKey)) In.wheel += Math.sign(e.deltaY);
  }, {
    passive: true
  });
  addEventListener("contextmenu", e => e.preventDefault());
  const sideBtn = e => {
    if (e.button === 3 || e.button === 4) e.preventDefault();
  };
  for (const t of [ "mousedown", "mouseup", "auxclick" ]) addEventListener(t, sideBtn, true);
  SX.save = {
    load() {
      return null;
    },
    write() {
      return true;
    },
    clear() {}
  };
  SX.OPT_DEF = {
    promptOn: true,
    promptHub: true,
    promptSize: 1,
    promptAlpha: 1,
    vol: .8,
    sfx: 1,
    sGun: 1,
    sStep: 1,
    sVoice: 1,
    sItem: 1,
    sUi: 1,
    amb: .8,
    mus: .8,
    bgmMain: true,
    bgmShelter: true,
    bgmRaid: true,
    bgmCombat: true,
    bgmMarket: true,
    bgmGym: true,
    bgmFish: true,
    mute: false,
    shake: 1,
    bright: 1,
    contrast: 1,
    sat: 1,
    chCol: 0,
    chSize: 1,
    glare: false,
    fps: false,
    needMark: true,
    sndVis: false,
    cb: 0,
    padRumble: true,
    padFollow: true,
    padSens: 1,
    padDz: .2,
    mSens: 1,
    mRaw: false,
    decoAmt: 1,
    lightQ: "high",
    fpsCap: 0
  };
  SX.CH_COLS = [ "#f2efe4", "#7be07a", "#ffd84a", "#6ecbff", "#ff8ad0" ];
  SX.decoAmt = () => {
    const v = SX.opts && SX.opts.decoAmt;
    return v == null || !(+v >= 0) ? 1 : Math.min(1, +v);
  };
  {
    const st = (() => {
      try {
        return JSON.parse(localStorage.getItem("sxd_opts") || "{}") || {};
      } catch (e) {
        return {};
      }
    })();
    SX.opts = Object.assign({}, SX.OPT_DEF, st);
    if (st.mus == null && st.amb != null) SX.opts.mus = st.amb;
  }
  SX.applyScreen = function() {
    const o = SX.opts, c = document.getElementById("screen");
    if (!c) return;
    const v = (x, d, lo, hi) => x == null || !(x >= 0) ? d : Math.max(lo, Math.min(hi, +x)), b = v(o.bright, 1, .6, 1.6), ct = v(o.contrast, 1, .7, 1.5), s = v(o.sat, 1, 0, 1.6);
    const ex = SX.scrExtra || "";
    const f = (b === 1 && ct === 1 && s === 1 ? "" : "brightness(" + b + ") contrast(" + ct + ") saturate(" + s + ")") + (ex ? " " + ex : "");
    c.style.filter = f.trim();
    if (SX.applyPal) SX.applyPal();
    const pv = document.getElementById("scrPrev");
    if (pv) pv.style.filter = f.trim();
  };
  SX.saveOpts = () => {
    try {
      localStorage.setItem("sxd_opts", JSON.stringify(SX.opts));
    } catch (e) {}
  };
  SX.errs = [];
  const errNote = (msg, where) => {
    msg = String(msg || "").slice(0, 300);
    const last = SX.errs[SX.errs.length - 1];
    if (last && last.m === msg) {
      last.n++;
      last.t = Date.now();
      return;
    }
    SX.errs.push({
      m: msg,
      w: String(where || "").slice(0, 240),
      t: Date.now(),
      n: 1
    });
    if (SX.errs.length > 10) SX.errs.shift();
  };
  const stack2 = st => st ? String(st).split("\n").slice(1, 3).map(q => q.trim()).join(" | ") : "";
  addEventListener("error", e => {
    if (e && e.message) errNote(e.message, (e.filename || "").split("/").pop() + ":" + e.lineno + ":" + e.colno + (e.error ? " | " + stack2(e.error.stack) : ""));
  });
  addEventListener("unhandledrejection", e => {
    const r = e && e.reason;
    errNote("(비동기) " + (r && r.message || r), stack2(r && r.stack));
  });
  const LQ = {
    until: 0,
    q: [],
    live: 0,
    gen: 0
  }, LQ_MAX = 2, LQ_GRACE = 2e3, LOG_MS = 5200;
  const logShow = function(msg, cls, gen) {
    const box = document.getElementById("hudLog");
    if (!box) return false;
    const d = document.createElement("div");
    d.textContent = msg;
    d.dataset.m = String(msg);
    if (cls) d.className = cls;
    box.appendChild(d);
    while (box.children.length > 6) box.firstChild.remove();
    setTimeout(() => {
      d.remove();
      if (gen && gen === LQ.gen) {
        LQ.live--;
        logPump();
      }
    }, LOG_MS);
    return true;
  };
  const logPump = function() {
    if (performance.now() >= LQ.until && SX.game && SX.game.state && SX.game.state !== "raid") {
      LQ.q.length = 0;
      return;
    }
    while (LQ.live < LQ_MAX && LQ.q.length) {
      const m = LQ.q.shift();
      if (logShow(m[0], m[1], LQ.gen)) LQ.live++;
    }
  };
  SX.logQ = function(on) {
    const t = performance.now();
    if (on) {
      LQ.gen++;
      LQ.q.length = 0;
      LQ.live = 0;
      LQ.until = t + 3e4;
      const box = document.getElementById("hudLog");
      if (box) box.textContent = "";
    } else {
      LQ.until = t + LQ_GRACE;
      logPump();
    }
  };
  SX.log = function(msg, cls) {
    if (SX.logHook) SX.logHook(msg, cls);
    if (performance.now() < LQ.until) {
      LQ.q.push([ msg, cls ]);
      logPump();
      return;
    }
    logShow(msg, cls, 0);
  };
})(window.SX);
