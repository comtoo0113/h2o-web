"use strict";

(function(SX) {
  const In = SX.input, MIN = .25, MAX = 3;
  const M = SX.mouse = {
    fake: false,
    fakeLocked: false,
    pending: false,
    selfExit: false,
    escT: -1e9,
    rx: 0,
    ry: 0,
    lx: null,
    ly: null,
    padAcc: 0,
    stats: {
      locks: 0,
      esc: 0,
      fwd: 0,
      spikes: 0,
      eaten: 0
    },
    failN: 0,
    fakeFail: false,
    MIN,
    MAX
  };
  const canvas = () => document.getElementById("screen");
  const hidden = id => {
    const e = document.getElementById(id);
    return !e || e.classList.contains("hidden");
  };
  M.sens = () => {
    const v = +(SX.opts && SX.opts.mSens);
    return v >= MIN && v <= MAX ? v : 1;
  };
  M.raw = () => !!(SX.opts && SX.opts.mRaw === true);
  M.want = () => Math.abs(M.sens() - 1) > .001 || M.raw();
  M.locked = () => M.fake ? M.fakeLocked : !!canvas() && document.pointerLockElement === canvas();
  M.effSens = () => M.locked() ? M.sens() : 1;
  M.ppt = () => SX.TS * (SX.view && SX.view.scale || 1) / (window.devicePixelRatio || 1);
  M.hasFocus = () => document.hasFocus() && !document.hidden;
  M.eligible = function() {
    const G = SX.game, U = SX.ui, p = SX.actors && SX.actors.player;
    if (!G || !U || G.state !== "raid" && G.state !== "hub") return false;
    if (U.isOpen() || U.asking() || U.partsOpen && U.partsOpen()) return false;
    if (!hidden("detail") || !hidden("gate") || !hidden("title")) return false;
    if (SX.home && SX.home.deco || SX.photo && SX.photo.on) return false;
    return !!(p && p.alive && !p.spect);
  };
  let pendT = 0, fwd = null, reqFailed = false;
  const lockFailed = () => {
    M.pending = false;
    clearTimeout(pendT);
    if (reqFailed) return;
    reqFailed = true;
    M.failN++;
  };
  M.request = function() {
    if (M.locked() || M.pending) return;
    reqFailed = false;
    if (M.fake) {
      if (M.fakeFail) {
        lockFailed();
        return;
      }
      M.fakeLocked = true;
      onLock();
      return;
    }
    const c = canvas();
    if (!c || !c.requestPointerLock) {
      lockFailed();
      return;
    }
    M.pending = true;
    clearTimeout(pendT);
    pendT = setTimeout(lockFailed, 1500);
    const done = () => {
      M.pending = false;
    };
    const plain = () => {
      try {
        const r = c.requestPointerLock();
        if (r && r.then) r.then(done, lockFailed);
      } catch (e) {
        lockFailed();
      }
    };
    let r = null;
    try {
      r = M.raw() ? c.requestPointerLock({
        unadjustedMovement: true
      }) : c.requestPointerLock();
    } catch (e) {
      plain();
      return;
    }
    if (r && r.then) r.then(done, e => {
      if (M.raw() && e && e.name === "NotSupportedError") plain(); else lockFailed();
    });
  };
  M.release = function() {
    if (!M.locked()) return;
    M.selfExit = true;
    if (M.fake) {
      M.fakeLocked = false;
      onUnlock();
      return;
    }
    try {
      document.exitPointerLock();
    } catch (e) {}
  };
  M.fakeExit = function() {
    if (M.fake && M.fakeLocked) {
      M.fakeLocked = false;
      onUnlock();
    }
  };
  function onLock() {
    M.pending = false;
    clearTimeout(pendT);
    M.failN = 0;
    M.stats.locks++;
    M.lx = null;
    M.padAcc = 0;
  }
  function onUnlock() {
    const self = M.selfExit;
    M.selfExit = false;
    M.lx = null;
    fwd = null;
    if (self) return;
    const t = performance.now();
    setTimeout(() => {
      if (M.escT >= t - 400) return;
      if (!M.hasFocus() || !M.eligible()) return;
      M.stats.esc++;
      In.hit.add("Escape");
    }, 60);
  }
  document.addEventListener("pointerlockchange", () => {
    if (M.fake) return;
    clearTimeout(pendT);
    if (M.locked()) onLock(); else onUnlock();
  });
  document.addEventListener("pointerlockerror", lockFailed);
  addEventListener("keydown", e => {
    if (e.code === "Escape") M.escT = performance.now();
  }, true);
  addEventListener("blur", () => {
    eatB = null;
    M.release();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) M.release();
  });
  M.tick = function() {
    if (M.locked() && (!M.want() || !M.eligible())) M.release();
  };
  const SPIKE = () => Math.max(innerWidth, innerHeight) / 2;
  In.lockMove = function(e) {
    if (!M.locked()) {
      if (e.isTrusted || M.fake) {
        if (M.lx != null) {
          M.rx += e.clientX - M.lx;
          M.ry += e.clientY - M.ly;
        }
        M.lx = e.clientX;
        M.ly = e.clientY;
      }
      return false;
    }
    if (!e.isTrusted && !M.fake) return true;
    const dx = +e.movementX || 0, dy = +e.movementY || 0;
    if (Math.abs(dx) > SPIKE() || Math.abs(dy) > SPIKE()) {
      M.stats.spikes++;
      return true;
    }
    M.rx += dx;
    M.ry += dy;
    if (SX.pad && SX.pad.on && SX.pad.setOn) {
      M.padAcc += Math.abs(dx) + Math.abs(dy);
      if (M.padAcc > 6) {
        M.padAcc = 0;
        SX.pad.setOn(false);
      }
    }
    const s = M.sens();
    In.mx = Math.max(0, Math.min(innerWidth - 1, In.mx + dx * s));
    In.my = Math.max(0, Math.min(innerHeight - 1, In.my + dy * s));
    return true;
  };
  M.takeRaw = function() {
    const x = Math.round(M.rx), y = Math.round(M.ry);
    M.rx -= x;
    M.ry -= y;
    return [ x, y ];
  };
  let busy = false, eatB = null;
  const fire = (el, type, e) => {
    busy = true;
    try {
      el.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: In.mx,
        clientY: In.my,
        screenX: In.mx,
        screenY: In.my,
        button: e.button,
        buttons: e.buttons,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey
      }));
    } finally {
      busy = false;
    }
  };
  addEventListener("mousedown", e => {
    const c = canvas();
    if (busy || !c || !(e.isTrusted || M.fake)) return;
    if (e.button === eatB) eatB = null;
    if (M.locked()) {
      const el = document.elementFromPoint(In.mx, In.my);
      if (el && el !== c) {
        e.stopImmediatePropagation();
        e.preventDefault();
        M.stats.fwd++;
        fwd = {
          el,
          b: e.button
        };
        fire(el, "mousedown", e);
      }
      return;
    }
    if (e.target === c && M.want() && M.eligible()) {
      const eat = M.failN < 2;
      M.request();
      if (eat) {
        e.stopImmediatePropagation();
        e.preventDefault();
        eatB = e.button;
        M.stats.eaten++;
      }
    }
  }, true);
  addEventListener("mouseup", e => {
    if (!busy && eatB != null && e.button === eatB && (e.isTrusted || M.fake)) {
      eatB = null;
      e.stopImmediatePropagation();
      return;
    }
    if (busy || !fwd || e.button !== fwd.b || !(e.isTrusted || M.fake)) return;
    const f = fwd;
    fwd = null;
    e.stopImmediatePropagation();
    const el = document.elementFromPoint(In.mx, In.my) || f.el;
    fire(el, "mouseup", e);
    if (f.el.isConnected && (el === f.el || f.el.contains(el))) fire(f.el, e.button === 2 ? "contextmenu" : "click", e);
  }, true);
})(window.SX);
