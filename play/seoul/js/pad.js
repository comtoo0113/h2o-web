"use strict";

(function(SX) {
  const In = SX.input, TS = SX.TS;
  const K = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    VIEW: 8,
    MENU: 9,
    LS: 10,
    RS: 11,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15
  };
  const BN = [ "A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "LS", "RS", "D↑", "D↓", "D←", "D→" ];
  const MAP = [ {
    b: K.RT,
    id: "fire"
  }, {
    b: K.LT,
    id: "aim"
  }, {
    b: K.A,
    id: "interact"
  }, {
    b: K.B,
    id: "crouch",
    hold: "box"
  }, {
    b: K.X,
    id: "reload"
  }, {
    b: K.Y,
    id: "heal",
    hold: "brick"
  }, {
    b: K.LB,
    id: "grenade"
  }, {
    b: K.RB,
    id: "next"
  }, {
    b: K.VIEW,
    id: "inventory",
    hold: "terminal"
  }, {
    b: K.MENU,
    id: "menu"
  }, {
    b: K.LS,
    id: "sprint"
  }, {
    b: K.RS,
    id: "melee"
  }, {
    b: K.UP,
    id: "wheel"
  }, {
    b: K.DOWN,
    id: "light"
  }, {
    b: K.LEFT,
    id: "ping",
    hold: "chat"
  }, {
    b: K.RIGHT,
    id: "q4"
  } ];
  const HOLD_T = .4;
  const QUIET = .6;
  const MIN_D = 1.4;
  const sens = () => {
    const v = +(SX.opts && SX.opts.padSens);
    return v >= .5 && v <= 2 ? v : 1;
  };
  const dz = () => {
    const v = +(SX.opts && SX.opts.padDz);
    return v >= .05 && v <= .5 ? v : .2;
  };
  const omega = () => 18 * sens();
  const LAB = {
    up: "LS",
    down: "LS",
    left: "LS",
    right: "LS",
    quiet: "LS 살짝",
    w1: "RB",
    w2: "RB",
    w3: "RB",
    deco: "Menu",
    help: "Menu"
  };
  for (const m of MAP) {
    if (m.id !== "next" && !LAB[m.id]) LAB[m.id] = BN[m.b];
    if (m.hold) LAB[m.hold] = BN[m.b] + " 길게";
  }
  for (let k = 5; k <= 13; k++) LAB["q" + k] = "D↑";
  const P = SX.pad = {
    on: false,
    connected: false,
    idx: -1,
    gpId: "",
    down: [],
    t0: [],
    m0: [],
    fired: [],
    ax: [ 0, 0, 0, 0 ],
    offAx: null,
    held: new Set,
    pulse: new Set,
    sprint: false,
    idleL: 0,
    idleR: 9,
    aimInit: false,
    aim: null,
    tgt: null,
    tgtSave: null,
    hist: [],
    relDone: true,
    curInit: false,
    cx: 0,
    cy: 0,
    glide: null,
    top: null,
    hovRaw: null,
    hovEl: null,
    dn: [],
    slider: null,
    lastClick: null,
    wheelV: null,
    rbUntil: 0,
    rbLevel: 0,
    stats: {
      rumble: 0
    },
    K,
    BN,
    MAP
  };
  P.label = id => P.on ? LAB[id] || null : null;
  P.name = () => P.connected ? shortName(P.gpId) : null;
  const shortName = id => String(id || "").replace(/\s*\((?:STANDARD GAMEPAD|Vendor)[^)]*\)\s*$/i, "").slice(0, 48) || "게임패드";
  function pads() {
    try {
      return navigator.getGamepads && navigator.getGamepads() || [];
    } catch (e) {
      return [];
    }
  }
  function pick() {
    let best = null;
    for (const g of pads()) {
      if (!g || g.connected === false) continue;
      if (g.index === P.idx && P.connected) return g;
      if (!best || g.mapping === "standard" && best.mapping !== "standard") best = g;
    }
    return best;
  }
  function readBtns(gp) {
    const bs = gp.buttons || [], out = [];
    for (let i = 0; i < 16; i++) {
      const b = bs[i], v = b == null ? 0 : typeof b === "object" ? +b.value || (b.pressed ? 1 : 0) : +b;
      out[i] = i === K.LT || i === K.RT ? P.down[i] ? v > .25 : v > .4 : !!(b && (b.pressed || v > .5));
    }
    return out;
  }
  function readAxes(gp) {
    const a = gp.axes || [];
    return [ 0, 1, 2, 3 ].map(i => {
      const v = +a[i] || 0;
      return v > 1 ? 1 : v < -1 ? -1 : v;
    });
  }
  function tap(id) {
    if (id === "next") {
      nextWeapon();
      return;
    }
    const c = "pad:" + id;
    In.hit.add(c);
    In.down.add(c);
    P.pulse.add(c);
  }
  function key(code) {
    In.hit.add(code);
    In.down.add(code);
    P.pulse.add(code);
  }
  function nextWeapon() {
    const p = SX.actors.player;
    if (!p || !p.kit) return;
    const order = [ "w1", "w2", "melee" ].filter(s => p.kit[s]);
    if (!order.length) return;
    const k = order.indexOf(p.slot), s = order[(k + 1) % order.length];
    tap(s === "melee" ? "w3" : s);
  }
  function unpulse() {
    for (const c of P.pulse) if (!P.held.has(c)) In.down.delete(c);
    P.pulse.clear();
  }
  function syncHeld(want) {
    for (const c of P.held) if (!want.has(c)) In.down.delete(c);
    for (const c of want) In.down.add(c);
    P.held = want;
  }
  function setOn(v) {
    if (P.on === v) return;
    P.on = v;
    document.body.classList.toggle("padmode", v);
    if (!v) {
      P.offAx = P.ax.slice();
      P.aimInit = false;
      P.curInit = false;
      P.glide = null;
      In.padMove = null;
      P.sprint = false;
      P.aimTog = false;
      syncHeld(new Set);
      hover(null);
      showCursor(false);
      hint(null);
    }
    relabel();
  }
  P.setOn = setOn;
  function relabel() {
    const U = SX.ui;
    if (U && U.hudDirty) U.hudDirty();
    for (const [id, k] of [ [ "hudQuick", "k" ], [ "hudPrompt", "h" ], [ "hudInfo", "h" ] ]) {
      const e = document.getElementById(id);
      if (e) e.dataset[k] = "";
    }
    if (SX.tut && SX.tut.render) SX.tut.render(true);
    if (SX.course && SX.course.on && SX.course.render) SX.course.render(true);
    titleHint();
    if (U && U.padRelabel) U.padRelabel();
  }
  function titleHint() {}
  addEventListener("mousemove", e => {
    if (!e.isTrusted) return;
    const lm = P.lastMouse;
    P.lastMouse = [ e.clientX, e.clientY ];
    if (P.on && lm && Math.hypot(e.clientX - lm[0], e.clientY - lm[1]) > 3) setOn(false);
  }, true);
  addEventListener("mousedown", e => {
    if (e.isTrusted) setOn(false);
  }, true);
  addEventListener("wheel", e => {
    if (e.isTrusted) setOn(false);
  }, {
    capture: true,
    passive: true
  });
  addEventListener("keydown", e => {
    if (e.isTrusted && !e.repeat) setOn(false);
  }, true);
  addEventListener("gamepadconnected", () => {
    P.seen = true;
  });
  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "padToast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("on"), 3200);
  }
  P.toast = toast;
  let curEl = null;
  const ARROW = [ "o........", "oo.......", "owo......", "owwo.....", "owwwo....", "owwwwo...", "owwwwwo..", "owwwwwwo.", "owwwwoooo", "owwowo...", "owo.owo..", "oo..owo..", ".....oo.." ];
  function showCursor(on) {
    if (!curEl) {
      if (!on) return;
      curEl = document.createElement("div");
      curEl.id = "padCur";
      curEl.className = "hidden";
      const c = document.createElement("canvas");
      c.width = 9;
      c.height = 13;
      c._notr = true;
      const x = c.getContext("2d");
      ARROW.forEach((row, y) => [ ...row ].forEach((ch, xx) => {
        if (ch === ".") return;
        x.fillStyle = ch === "o" ? "#14100a" : "#ffe9a0";
        x.fillRect(xx, y, 1, 1);
      }));
      curEl.appendChild(c);
      document.body.appendChild(curEl);
    }
    curEl.classList.toggle("hidden", !on);
    if (on) curEl.style.transform = "translate(" + Math.round(P.cx) + "px," + Math.round(P.cy) + "px)";
  }
  let hintEl = null, hintKey = "";
  function hint(list) {
    const k = list ? list.map(q => q.join(":")).join("|") : "";
    if (k === hintKey) return;
    hintKey = k;
    if (!hintEl) {
      if (!list) return;
      hintEl = document.createElement("div");
      hintEl.id = "padHint";
      document.body.appendChild(hintEl);
    }
    hintEl.classList.toggle("hidden", !list);
    if (list) hintEl.innerHTML = list.map(([b, t]) => "<span><kbd>" + SX.esc(b) + "</kbd>" + SX.esc(t) + "</span>").join("");
  }
  function hintFor(U, deco, gym) {
    if (gym) return [ [ "A", "Space" ], [ "LB", "A" ], [ "RB", "D" ], [ "B", "닫기" ] ];
    if (deco && SX.home.deco && SX.home.deco.brush) return [ [ "A", "깔기" ], [ "X", "그만 고르기" ], [ "LB", "앞 것" ], [ "RB", "다음 것" ], [ "B", "끝" ] ];
    if (U.isDragging && U.isDragging()) return [ [ "A", "놓기" ], [ "Y", "돌리기" ], [ "B", "취소" ] ];
    if (deco && SX.top && SX.top.held()) return [ [ "A", "올려놓기" ], [ "십자", "다음 빈자리" ], [ "X", "창고로" ], [ "LB", "돌리기" ], [ "RB", "돌리기" ], [ "B", "끝" ] ];
    if (deco) return [ [ "A", "놓기 · 집기" ], [ "X", "창고로" ], [ "LB", "돌리기" ], [ "RB", "돌리기" ], [ "B", "끝" ] ];
    if (SX.game.state === "title" && !U.isOpen()) return [ [ "LS", "커서" ], [ "A", "누르기" ] ];
    if (U.panelKind === "inv") return [ [ "A", "끌어 옮기기" ], [ "Y", "빠른 이동" ], [ "X", "우클릭" ], [ "B", "닫기" ], [ "RS", "스크롤" ] ];
    return [ [ "A", "누르기" ], [ "X", "우클릭" ], [ "B", "닫기" ], [ "LB", "탭" ], [ "RB", "탭" ], [ "RS", "스크롤" ] ];
  }
  P.rumble = function(a, force) {
    if (!P.connected || !(a > .3) || !force && (!P.on || SX.opts && SX.opts.padRumble === false)) return;
    const gp = pick();
    if (!gp) return;
    const strong = Math.max(0, Math.min(1, (a - 1.5) / 6)), weak = Math.max(.12, Math.min(1, a / 3.5)), dur = Math.round(45 + Math.min(a, 8) * 28), now = performance.now();
    if (now < P.rbUntil && strong + weak <= P.rbLevel) return;
    P.rbUntil = now + dur;
    P.rbLevel = strong + weak;
    P.stats.rumble++;
    P.stats.last = {
      strong: +strong.toFixed(2),
      weak: +weak.toFixed(2),
      dur
    };
    try {
      const va = gp.vibrationActuator;
      if (va && va.playEffect) {
        const r = va.playEffect(va.type || "dual-rumble", {
          startDelay: 0,
          duration: dur,
          weakMagnitude: weak,
          strongMagnitude: strong
        });
        if (r && r.catch) r.catch(() => {});
      } else if (gp.hapticActuators && gp.hapticActuators[0] && gp.hapticActuators[0].pulse) gp.hapticActuators[0].pulse(Math.max(strong, weak), dur);
    } catch (e) {}
  };
  const vis = el => !!el && el.getClientRects().length > 0;
  function cursorMode() {
    const G = SX.game, U = SX.ui;
    if (!G || !U) return true;
    if (G.state === "title" || U.isOpen() || U.asking() || U.partsOpen && U.partsOpen()) return true;
    const det = document.getElementById("detail");
    if (det && !det.classList.contains("hidden")) return true;
    const gate = document.getElementById("gate");
    if (gate && !gate.classList.contains("hidden")) return true;
    return !!(SX.home && SX.home.deco);
  }
  P.cursorMode = cursorMode;
  function topWin() {
    const q = sel => {
      const e = document.querySelector(sel);
      return e && vis(e) ? e : null;
    };
    const ask = document.getElementById("ask");
    if (ask && !ask.classList.contains("hidden")) return ask.querySelector(".askWin");
    const det = document.getElementById("detail");
    if (det && !det.classList.contains("hidden")) return det.querySelector(".win");
    const pw = document.getElementById("partsWin");
    if (pw && !pw.classList.contains("hidden")) return pw.querySelector(".win");
    if (SX.ui.isOpen()) return q("#panel > .win, #panel > .term") || document.getElementById("panel");
    const gate = document.getElementById("gate");
    if (gate && !gate.classList.contains("hidden")) return gate.querySelector(".gateBox");
    const t = document.getElementById("title");
    if (t && !t.classList.contains("hidden")) return t.querySelector(".titleMenu");
    return null;
  }
  function glideTarget(w) {
    const big = w.id === "ask" || w.classList.contains("askWin") ? null : [ ...w.querySelectorAll("button.big") ].find(b => !b.disabled && b.offsetParent !== null);
    const r = (big || w).getBoundingClientRect();
    return [ r.left + r.width / 2, r.top + Math.min(r.height / 2, big ? r.height / 2 : innerHeight * .35) ];
  }
  const at = (x, y) => document.elementFromPoint(x, y);
  function fire(el, type, o, ptr) {
    if (!el) return true;
    const E = ptr && window.PointerEvent ? window.PointerEvent : window.MouseEvent;
    return el.dispatchEvent(new E(type, Object.assign({
      bubbles: true,
      cancelable: true,
      view: window,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    }, o)));
  }
  const mo = (btn, buttons, shift) => ({
    clientX: P.cx,
    clientY: P.cy,
    screenX: P.cx,
    screenY: P.cy,
    button: btn,
    buttons,
    shiftKey: !!shift
  });
  const CLICK = "button, a, input, select, textarea, label, .it, .slot, .pin, .fi, .sw, [data-tab], [data-app], [data-key], .rgGun, .rgSlot, .rgOpt";
  function clickable(el) {
    const c = el && el.closest && el.closest(CLICK);
    if (c) return c;
    for (let n = el, k = 0; n && n.nodeType === 1 && k < 4; n = n.parentElement, k++) {
      if (typeof n.onclick === "function" || typeof n.onmousedown === "function") {
        const r = n.getBoundingClientRect();
        if (r.width * r.height < innerWidth * innerHeight / 10) return n;
        break;
      }
    }
    return null;
  }
  function hover(el, move) {
    if (el !== P.hovRaw) {
      const prev = P.hovRaw && P.hovRaw.isConnected ? P.hovRaw : null, o = mo(0, P.dn[0] ? 1 : 0);
      P.hovRaw = el;
      if (prev) {
        fire(prev, "mouseout", Object.assign({
          relatedTarget: el
        }, o));
        for (let n = prev; n && n.nodeType === 1 && !(el && n.contains(el)); n = n.parentElement) n.dispatchEvent(new MouseEvent("mouseleave", Object.assign({}, o, {
          bubbles: false,
          relatedTarget: el
        })));
      }
      if (el) {
        fire(el, "mouseover", Object.assign({
          relatedTarget: prev
        }, o));
        const L = [];
        for (let n = el; n && n.nodeType === 1 && !(prev && n.contains(prev)); n = n.parentElement) L.push(n);
        for (const n of L.reverse()) n.dispatchEvent(new MouseEvent("mouseenter", Object.assign({}, o, {
          bubbles: false,
          relatedTarget: prev
        })));
      }
      const h = el ? clickable(el) : null;
      if (h !== P.hovEl) {
        if (P.hovEl) P.hovEl.classList.remove("padHover");
        P.hovEl = h;
        if (h) h.classList.add("padHover");
      }
    }
    if (el && move) fire(el, "mousemove", mo(0, P.dn[0] ? 1 : P.dn[2] ? 2 : 0));
  }
  function setSlider(s, x) {
    const r = s.getBoundingClientRect(), mn = +s.min || 0, mx = s.max === "" ? 100 : +s.max, st = +s.step || 1;
    let v = mn + Math.max(0, Math.min(1, (x - r.left) / Math.max(1, r.width))) * (mx - mn);
    v = Math.round(v / st) * st;
    v = +Math.max(mn, Math.min(mx, v)).toFixed(4);
    if (+s.value !== v) {
      s.value = v;
      s.dispatchEvent(new Event("input", {
        bubbles: true
      }));
    }
  }
  function mdown(btn, shift) {
    const el = at(P.cx, P.cy) || document.body;
    if (btn === 0) {
      const rg = el.closest && el.closest('input[type="range"]');
      if (rg && !rg.disabled) {
        P.slider = rg;
        P.dn[0] = {
          el: rg
        };
        setSlider(rg, P.cx);
        return;
      }
      const ae = document.activeElement;
      if (ae && ae !== el && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) ae.blur();
    }
    const o = mo(btn, btn === 2 ? 2 : 1, shift);
    fire(el, "pointerdown", o, true);
    const ok = fire(el, "mousedown", o);
    if (btn === 0 && ok && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.disabled) {
      try {
        el.focus();
      } catch (e) {}
    }
    P.dn[btn] = {
      el,
      shift: !!shift
    };
  }
  function common(a, b) {
    if (!a || !b) return null;
    for (let n = a; n; n = n.parentElement) if (n.contains(b)) return n;
    return null;
  }
  function mup(btn) {
    const d = P.dn[btn];
    P.dn[btn] = null;
    if (btn === 0 && P.slider) {
      const s = P.slider;
      P.slider = null;
      s.dispatchEvent(new Event("change", {
        bubbles: true
      }));
      return;
    }
    if (!d) return;
    const el = at(P.cx, P.cy) || document.body, o = mo(btn, 0, d.shift);
    fire(el, "pointerup", o, true);
    fire(el, "mouseup", o);
    if (btn === 2) {
      fire(el, "contextmenu", o);
      return;
    }
    const c = d.el && d.el.isConnected ? common(d.el, el) : null;
    if (!c || c.closest && c.closest("button:disabled, input:disabled")) return;
    const now = performance.now(), dbl = P.lastClick && P.lastClick.el === c && now - P.lastClick.t < 400;
    fire(c, "click", Object.assign({
      detail: dbl ? 2 : 1
    }, o));
    if (dbl) {
      fire(c, "dblclick", Object.assign({
        detail: 2
      }, o));
      P.lastClick = null;
    } else P.lastClick = {
      el: c,
      t: now
    };
  }
  function keyEv(code, keyName) {
    const tgt = document.body, o = {
      code,
      key: keyName || code,
      bubbles: true,
      cancelable: true
    };
    tgt.dispatchEvent(new KeyboardEvent("keydown", o));
    tgt.dispatchEvent(new KeyboardEvent("keyup", o));
  }
  function escape() {
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) ae.blur();
    if (P.slider) {
      P.slider = null;
      P.dn[0] = null;
    }
    keyEv("Escape", "Escape");
  }
  function tab(dir) {
    const t = P.top || topWin();
    if (!t) return;
    const L = [ ...t.querySelectorAll(".tabs button, .side > button") ].filter(b => b.offsetParent !== null && !b.disabled && !b.hasAttribute("data-close"));
    if (!L.length) return;
    const k = L.findIndex(b => b.classList.contains("on"));
    L[k < 0 ? 0 : (k + dir + L.length) % L.length].click();
  }
  let scrollCache = null;
  function scroll(dy) {
    let n = at(P.cx, P.cy);
    for (;n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 2) break;
    }
    if (!n || n === document.body || n === document.documentElement) {
      const t = P.top;
      if (!t) return;
      if (!scrollCache || scrollCache.t !== t || !scrollCache.n.isConnected) {
        let best = null, ba = 0;
        for (const e of t.querySelectorAll("*")) {
          if (e.scrollHeight <= e.clientHeight + 2) continue;
          const oy = getComputedStyle(e).overflowY;
          if (oy !== "auto" && oy !== "scroll") continue;
          const a = e.clientWidth * e.clientHeight;
          if (a > ba) {
            ba = a;
            best = e;
          }
        }
        scrollCache = best ? {
          t,
          n: best
        } : null;
      }
      if (!scrollCache) return;
      n = scrollCache.n;
    }
    n.scrollTop += dy;
  }
  P.pre = function(dt, rdt) {
    rdt = Math.min(.1, rdt || dt || .016);
    const gp = pick();
    if (!gp) {
      if (P.connected) {
        P.connected = false;
        P.down = [];
        syncHeld(new Set);
        unpulse();
        In.padMove = null;
        setOn(false);
        toast("🎮 게임패드 연결이 끊겼습니다");
      }
      return;
    }
    if (!P.connected || P.idx !== gp.index) {
      P.connected = true;
      P.idx = gp.index;
      P.gpId = gp.id || "";
      P.down = [];
      P.offAx = null;
      toast("🎮 게임패드 연결 — " + shortName(P.gpId) + (gp.mapping === "standard" ? "" : " (단추 배치를 몰라 몇 개는 다를 수 있습니다)"));
    }
    const now = performance.now() / 1e3, nb = readBtns(gp), ax = readAxes(gp), jp = [], jr = [];
    for (let i = 0; i < 16; i++) {
      jp[i] = nb[i] && !P.down[i];
      jr[i] = !nb[i] && !!P.down[i];
    }
    const off = P.offAx, moved = i => Math.abs(ax[i]) > .35 && (!off || Math.abs(ax[i] - off[i]) > .25);
    if (!P.on && (jp.some(Boolean) || moved(0) || moved(1) || moved(2) || moved(3))) setOn(true);
    const mode = cursorMode() ? "cur" : "game";
    for (let i = 0; i < 16; i++) if (jp[i]) {
      P.t0[i] = now;
      P.m0[i] = mode;
      P.fired[i] = false;
    }
    unpulse();
    if (jr[K.A] && P.m0[K.A] === "cur") mup(0);
    if (jr[K.X] && P.m0[K.X] === "cur") mup(2);
    if (jr[K.Y] && P.m0[K.Y] === "cur" && P.dn[0] && P.dn[0].shift) mup(0);
    const want = new Set;
    if (P.on) {
      if (mode === "game") {
        P.curInit = false;
        showCursor(false);
        hint(null);
        if (P.hovRaw || P.hovEl) hover(null);
        gameFrame(nb, jp, jr, ax, now, rdt, want);
      } else {
        In.padMove = null;
        P.sprint = false;
        P.aimTog = false;
        curFrame(nb, jp, ax, rdt);
      }
    }
    syncHeld(want);
    if (P.on && mode === "game") aimFrame(nb, ax, now, rdt);
    P.down = nb;
    P.ax = ax;
  };
  function gameFrame(nb, jp, jr, ax, now, rdt, want) {
    const G = SX.game, H = SX.hub;
    if (G.state === "hub" && H && H.ex) {
      In.padMove = null;
      if (jp[K.A] || jp[K.RT]) key("Space");
      if (jp[K.LB]) key("KeyA");
      if (jp[K.RB]) key("KeyD");
      if (jp[K.B]) key("KeyW");
      return;
    }
    const lm = Math.hypot(ax[0], ax[1]);
    if (lm > dz()) {
      In.padMove = {
        x: ax[0] / lm,
        y: ax[1] / lm
      };
      P.idleL = 0;
    } else {
      In.padMove = null;
      P.idleL += rdt;
      if (P.idleL > .3) P.sprint = false;
    }
    if (SX.holdMode("sprint", true) === "hold") P.sprint = !!nb[K.LS] && P.m0[K.LS] === "game"; else if (jp[K.LS] && P.m0[K.LS] === "game") P.sprint = !P.sprint;
    const aimTog = SX.holdMode("aim", true) === "tog";
    if (!aimTog) P.aimTog = false; else if (jp[K.LT] && P.m0[K.LT] === "game") {
      P.aimTog = !P.aimTog;
      if (P.aimTog) P.sprint = false;
    }
    const aimOn = aimTog ? P.aimTog : nb[K.LT];
    if (P.sprint && In.padMove && !aimOn) want.add("pad:sprint"); else if (In.padMove && lm < QUIET) want.add("pad:quiet");
    const spin = G.state === "hub" && SX.homeUse && SX.homeUse.spinnable && SX.homeUse.spinnable();
    if (spin) {
      if (jp[K.LB] && P.m0[K.LB] === "game") In.wheel -= 1;
      if (jp[K.RB] && P.m0[K.RB] === "game") In.wheel += 1;
    }
    for (const m of MAP) {
      const b = m.b;
      if (m.id === "sprint" || P.m0[b] !== "game") continue;
      if (spin && (b === K.LB || b === K.RB)) continue;
      if (m.id === "aim" && aimTog) {
        if (jp[b]) tap(m.id);
        if (P.aimTog) want.add("pad:aim");
        continue;
      }
      if (m.hold) {
        if (nb[b] && !P.fired[b] && now - P.t0[b] >= HOLD_T) {
          P.fired[b] = true;
          tap(m.hold);
        } else if (jr[b] && !P.fired[b]) tap(m.id);
      } else {
        if (jp[b]) tap(m.id);
        if (nb[b] && m.id !== "next") want.add("pad:" + m.id);
      }
    }
  }
  function reach(dx, dy) {
    const V = SX.view, A = SX.actors, p = A.player, wg = p && A.weaponOf(p), aiming = In.held("aim");
    const look = aiming && wg && wg.kind === "gun" ? A.gunLook(wg) : 1, k = aiming ? .55 * look : .28, lim = Math.min(.35 * look, .47), E = .85;
    const rx = (E * V.vw / 2 + Math.min(E * V.vw / 2 * k, lim * V.vw)) / TS, ry = (E * V.vh / 2 + Math.min(E * V.vh / 2 * k, lim * V.vh)) / TS;
    return 1 / Math.hypot(dx / rx, dy / ry);
  }
  function aimFrame(nb, ax, now, rdt) {
    const G = SX.game, V = SX.view, U = SX.ui, p = SX.actors.player;
    if (!p || !p.alive || G.state === "title" || SX.home && SX.home.deco) {
      P.aimInit = false;
      return;
    }
    const s = V.scale / (window.devicePixelRatio || 1), cx = Math.round(V.cam.x + V.shx), cy = Math.round(V.cam.y + V.shy), ex = p.x, ey = p.y - .55;
    if (!P.aimInit) {
      P.aim = {
        x: (In.mx / s + cx) / TS - ex,
        y: (In.my / s + cy) / TS - ey,
        vx: 0,
        vy: 0
      };
      P.tgt = P.tgtSave || {
        x: P.aim.x,
        y: P.aim.y
      };
      P.tgtSave = null;
      P.aimInit = true;
      P.hist.length = 0;
      P.relDone = true;
    }
    const rx = ax[2], ry = ax[3], rm = Math.hypot(rx, ry), D = dz();
    if (!U.wheel) P.wheelV = null;
    if (U.wheel) {
      if (rm > .4) P.wheelV = [ rx / rm, ry / rm ];
    } else if (rm > D) {
      const q = Math.min(1, (rm - D) / (.92 - D)), dx = rx / rm, dy = ry / rm, d = MIN_D + (reach(dx, dy) - MIN_D) * q;
      P.tgt = {
        x: dx * d,
        y: dy * d
      };
      P.idleR = 0;
      P.relDone = false;
      P.hist.push([ now, P.tgt.x, P.tgt.y, rm ]);
    } else {
      if (!P.relDone) {
        P.relDone = true;
        let o = null;
        for (const h of P.hist) if (now - h[0] >= .05 && now - h[0] < .3 && h[3] > .45) o = h;
        if (o) P.tgt = {
          x: o[1],
          y: o[2]
        };
      }
      P.idleR += rdt;
      if (SX.opts.padFollow !== false && P.idleR > .6 && In.padMove && !In.held("aim") && !In.held("fire") && !(SX.tac && SX.tac.hold)) {
        const mv = In.padMove, R = reach(mv.x, mv.y), d = Math.max(MIN_D, Math.min(R, Math.max(Math.hypot(P.tgt.x, P.tgt.y), R * .45)));
        P.tgt = {
          x: mv.x * d,
          y: mv.y * d
        };
      }
    }
    while (P.hist.length && now - P.hist[0][0] > .35) P.hist.shift();
    const W = omega(), e = Math.exp(-W * rdt), a = P.aim;
    for (const [k, vk] of [ [ "x", "vx" ], [ "y", "vy" ] ]) {
      const x0 = a[k] - P.tgt[k], c = a[vk] + W * x0;
      a[k] = P.tgt[k] + (x0 + c * rdt) * e;
      a[vk] = (a[vk] - W * c * rdt) * e;
    }
    In.mx = Math.max(1, Math.min(innerWidth - 2, ((ex + a.x) * TS - cx) * s));
    In.my = Math.max(1, Math.min(innerHeight - 2, ((ey + a.y) * TS - cy) * s));
  }
  P.wheelXY = function() {
    if (!P.on || !SX.ui.wheel) return null;
    const v = P.wheelV;
    if (!v) return [ innerWidth / 2, innerHeight / 2 ];
    const r = 120 * SX.ui.wheelK();
    return [ innerWidth / 2 + v[0] * r, innerHeight / 2 + v[1] * r ];
  };
  function curFrame(nb, jp, ax, rdt) {
    const U = SX.ui, gym = U.gymPlaying && U.gymPlaying(), deco = !!(SX.home && SX.home.deco) && !U.isOpen() && !U.asking();
    if (!P.curInit) {
      P.curInit = true;
      P.cx = Math.max(0, Math.min(innerWidth - 1, In.mx));
      P.cy = Math.max(0, Math.min(innerHeight - 1, In.my));
      P.top = null;
      P.hovRaw = null;
      P.wheelV = null;
      if (P.aimInit) {
        P.tgtSave = P.tgt;
        P.aimInit = false;
      }
    }
    const top = deco ? null : topWin();
    if (top !== P.top) {
      P.top = top;
      scrollCache = null;
      if (top) {
        const r = top.getBoundingClientRect();
        if (!(P.cx >= r.left && P.cx <= r.right && P.cy >= r.top && P.cy <= r.bottom)) {
          const t = glideTarget(top);
          P.glide = {
            x0: P.cx,
            y0: P.cy,
            x1: t[0],
            y1: t[1],
            t: 0
          };
        }
      }
    }
    const k = Math.max(.7, innerHeight / 900), lm = Math.hypot(ax[0], ax[1]);
    let mx = 0, my = 0;
    if (lm > .15) {
      const q = (lm - .15) / .85, sp = (160 + 1250 * q * q) * k * sens() * (P.hovEl && !P.dn[0] ? .6 : 1);
      mx += ax[0] / lm * sp * rdt;
      my += ax[1] / lm * sp * rdt;
    }
    const tNav = !gym && !deco && SX.title && SX.title.padNav && SX.title.padNav();
    const topHeld = deco && SX.top && SX.top.held();
    if (tNav) {
      if (jp[K.UP] || jp[K.DOWN]) {
        const q = SX.title.padStep(jp[K.UP] ? -1 : 1, P.cx, P.cy);
        if (q) P.glide = {
          x0: P.cx,
          y0: P.cy,
          x1: q[0],
          y1: q[1],
          t: 0
        };
      }
    } else if (topHeld) {
      if (jp[K.LEFT]) key("ArrowLeft");
      if (jp[K.RIGHT]) key("ArrowRight");
      if (jp[K.UP]) key("ArrowUp");
      if (jp[K.DOWN]) key("ArrowDown");
    } else if (!gym) {
      const dp = 220 * k * rdt;
      if (nb[K.LEFT]) mx -= dp;
      if (nb[K.RIGHT]) mx += dp;
      if (nb[K.UP]) my -= dp;
      if (nb[K.DOWN]) my += dp;
    }
    const ox = P.cx, oy = P.cy;
    if (mx || my) P.glide = null;
    if (P.glide) {
      const g = P.glide;
      g.t = Math.min(1, g.t + rdt / .22);
      const u = g.t * g.t * (3 - 2 * g.t);
      P.cx = g.x0 + (g.x1 - g.x0) * u;
      P.cy = g.y0 + (g.y1 - g.y0) * u;
      if (g.t >= 1) P.glide = null;
    } else {
      P.cx += mx;
      P.cy += my;
    }
    P.cx = Math.max(0, Math.min(innerWidth - 1, P.cx));
    P.cy = Math.max(0, Math.min(innerHeight - 1, P.cy));
    In.mx = P.cx;
    In.my = P.cy;
    const moved = Math.abs(P.cx - ox) + Math.abs(P.cy - oy) > .25, el = at(P.cx, P.cy);
    if (moved || el !== P.hovRaw) hover(el, moved);
    if (P.slider && P.dn[0]) setSlider(P.slider, P.cx);
    if (gym) {
      if (jp[K.A]) keyEv("Space", " ");
      if (jp[K.LB]) keyEv("KeyA", "a");
      if (jp[K.RB]) keyEv("KeyD", "d");
    } else {
      if (jp[K.A]) mdown(0);
      if (jp[K.X]) mdown(2);
      if (jp[K.Y]) {
        if (U.isDragging && U.isDragging()) keyEv("KeyR", "r"); else if (!P.dn[0]) mdown(0, true);
      }
      if (jp[K.LB] || jp[K.RB]) {
        if (deco) key(jp[K.LB] ? "KeyQ" : "KeyR"); else tab(jp[K.LB] ? -1 : 1);
      }
    }
    if (jp[K.B]) escape();
    if (jp[K.MENU]) tap("menu");
    if (jp[K.VIEW] && SX.game.state !== "title") tap("inventory");
    {
      const D = dz();
      if (Math.abs(ax[3]) > D) scroll(Math.sign(ax[3]) * Math.pow((Math.abs(ax[3]) - D) / (1 - D), 1.5) * 1100 * k * rdt);
    }
    showCursor(true);
    hint(hintFor(U, deco, gym));
  }
  const actName = id => (SX.KEY_ACTIONS.find(a => a[0] === id) || [])[1] || id;
  P.rows = function() {
    const R = [ [ "LS", "걷기(살짝 기울이면 조용히 걷기)" ], [ "RS", "조준(기울인 쪽 · 기울인 만큼 멀리)" ], [ "LS 누르기", "달리기(켜고 끄기 · 멈추면 꺼짐)" ] ];
    for (const m of MAP) {
      if (m.id === "sprint") continue;
      const nm = m.id === "next" ? "무기 바꾸기(주무기 → 보조 → 근접)" : m.id === "wheel" ? "단축 칸 원형 메뉴(누른 채 RS 로 고르고 놓기)" : actName(m.id);
      R.push([ m.b === K.RS ? "RS 누르기" : BN[m.b], nm ]);
      if (m.hold) R.push([ BN[m.b] + " 길게", actName(m.hold) ]);
    }
    R.push([ "LB · RB", "의자 돌리기(셸터 사무 의자에 앉아서)" ]);
    return R;
  };
  P.table = function() {
    return `<div class="keys padKeys">` + P.rows().map(([b, n]) => `<span>${SX.esc(n)}</span><span><b>${SX.esc(b)}</b></span>`).join("") + `</div>` + `<p class="small">창(메뉴 · 가방 · 상점 · 단말기)에서는 LS 로 화면 커서를 움직입니다 — A 누르기(누른 채 끌기) · X 우클릭 · Y 빠른 이동(Shift+클릭 · 끄는 중이면 돌리기) · B 닫기 · LB/RB 탭 · RS 스크롤.</p>`;
  };
})(window.SX);
