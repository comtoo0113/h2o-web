"use strict";

(function(SX) {
  const TS = SX.TS;
  const PH = SX.photo = {
    on: false,
    paused: false,
    zoom: 1,
    filter: 0,
    cam: null,
    mini: false,
    ZMAX: 4,
    LIM: .35,
    last: null,
    count: 0,
    want: false
  };
  const FILTERS = [ [ "없음", "" ], [ "흑백", "grayscale(1)" ], [ "세피아", "sepia(0.85)" ] ];
  PH.FILTERS = FILTERS;
  let bar = null, drag = null, sayT = 0;
  PH.canPause = () => !(SX.coop && SX.coop.inCoop && SX.coop.inCoop());
  PH.allowed = function(uiOpen) {
    const G = SX.game, p = SX.actors && SX.actors.player;
    if (uiOpen || !p || !p.alive || SX.home && SX.home.deco) return false;
    if (G.state === "raid") return !!(SX.raid.level && SX.raid.on && !SX.raid.over);
    return G.state === "hub" && !!SX.hub.level;
  };
  PH.toggle = function(v) {
    v = v == null ? !PH.on : !!v;
    if (v === PH.on) return;
    PH.on = v;
    drag = null;
    PH.want = false;
    if (v) {
      const V = SX.view;
      PH.cam = {
        x: V.cam.x,
        y: V.cam.y
      };
      PH.zoom = 1;
      PH.paused = PH.canPause();
      PH.mini = false;
    }
    SX.scrExtra = v ? FILTERS[PH.filter][1] : "";
    SX.applyScreen();
    document.body.classList.toggle("photo", v);
    showBar();
    if (SX.audio) SX.audio.play("click");
  };
  PH.setFilter = function(i) {
    PH.filter = SX.clamp(i | 0, 0, FILTERS.length - 1);
    if (PH.on) {
      SX.scrExtra = FILTERS[PH.filter][1];
      SX.applyScreen();
    }
    showBar();
  };
  PH.setZoom = function(z) {
    PH.zoom = SX.clamp(Math.round(z), 1, PH.ZMAX);
    showBar();
  };
  PH.input = function(uiOpen) {
    const In = SX.input;
    if (!PH.on) {
      if (In.pressed("photo") && PH.allowed(uiOpen)) {
        PH.toggle(true);
        In.hit.clear();
        In.wheel = 0;
      }
      return;
    }
    if (!PH.allowed(uiOpen)) {
      PH.toggle(false);
      return;
    }
    if (In.pressed("photo") || In.pressed("menu")) {
      PH.toggle(false);
      In.hit.clear();
      In.wheel = 0;
      return;
    }
    const hit = c => In.hit.has(c);
    if (hit("Space") || hit("Enter")) PH.want = true;
    for (let i = 0; i < FILTERS.length; i++) if (hit("Digit" + (i + 1)) || hit("Numpad" + (i + 1))) PH.setFilter(i);
    if (hit("KeyH")) {
      PH.mini = !PH.mini;
      showBar();
    }
    if (hit("Equal") || hit("NumpadAdd")) PH.setZoom(PH.zoom + 1);
    if (hit("Minus") || hit("NumpadSubtract")) PH.setZoom(PH.zoom - 1);
    if (In.wheel) PH.setZoom(PH.zoom - Math.sign(In.wheel));
    In.hit.clear();
    In.wheel = 0;
  };
  PH.camera = function(V, rdt) {
    const In = SX.input, p = SX.actors.player, z = PH.zoom, c = PH.cam || (PH.cam = {
      x: V.cam.x,
      y: V.cam.y
    });
    const sp = 420 * (rdt || 0) / z;
    if (In.held("left")) c.x -= sp;
    if (In.held("right")) c.x += sp;
    if (In.held("up")) c.y -= sp;
    if (In.held("down")) c.y += sp;
    if (In.down.has("Mouse0")) {
      const k = (window.devicePixelRatio || 1) / V.scale / z;
      if (drag) {
        c.x -= (In.mx - drag.x) * k;
        c.y -= (In.my - drag.y) * k;
      }
      drag = {
        x: In.mx,
        y: In.my
      };
    } else drag = null;
    const px = p.x * TS - V.vw / 2, py = (p.y - .5) * TS - V.vh / 2;
    c.x = SX.clamp(c.x, px - V.vw * PH.LIM, px + V.vw * PH.LIM);
    c.y = SX.clamp(c.y, py - V.vh * PH.LIM, py + V.vh * PH.LIM);
    V.cam.x = Math.round(c.x);
    V.cam.y = Math.round(c.y);
    V.shx = 0;
    V.shy = 0;
    V.shakeA = 0;
  };
  PH.src = function(V) {
    const z = PH.zoom, w = V.vw / z, h = V.vh / z;
    return [ Math.floor((V.vw - w) / 2), Math.floor((V.vh - h) / 2), w, h ];
  };
  PH.afterDraw = function() {
    if (PH.on && PH.want) {
      PH.want = false;
      PH.shot();
    }
  };
  const p2 = n => String(n).padStart(2, "0");
  PH.fileName = d => {
    d = d || new Date;
    return (SX.lang === "en" ? "SeoulExtract_" : "서울탈출_") + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "_" + p2(d.getHours()) + "-" + p2(d.getMinutes()) + "-" + p2(d.getSeconds()) + ".png";
  };
  PH.shot = function() {
    const c = document.getElementById("screen");
    if (!c || !c.width) return Promise.resolve(null);
    const cv = document.createElement("canvas");
    cv.width = c.width;
    cv.height = c.height;
    const x = cv.getContext("2d");
    x.imageSmoothingEnabled = false;
    if (c.style.filter) x.filter = c.style.filter;
    x.drawImage(c, 0, 0);
    const name = PH.fileName();
    flash();
    if (SX.audio) SX.audio.play("shutter");
    return new Promise(res => cv.toBlob(b => {
      if (!b) {
        say("못 찍었습니다");
        res(null);
        return;
      }
      const url = URL.createObjectURL(b), a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      PH.count++;
      PH.last = {
        name,
        size: b.size,
        w: cv.width,
        h: cv.height,
        filter: PH.filter,
        zoom: PH.zoom
      };
      say("찍었습니다 — ", name);
      res(PH.last);
    }, "image/png"));
  };
  function flash() {
    let f = document.getElementById("photoFlash");
    if (!f) {
      f = document.createElement("div");
      f.id = "photoFlash";
      document.body.appendChild(f);
    }
    f.style.transition = "none";
    f.style.opacity = "0.7";
    void f.offsetWidth;
    f.style.transition = "";
    f.style.opacity = "0";
  }
  function say(t, name) {
    const s = bar && bar.querySelector(".phSay");
    if (!s) return;
    s.textContent = t;
    if (name) {
      const b = document.createElement("span");
      b.dataset.notr = "1";
      b.textContent = name;
      s.appendChild(b);
    }
    clearTimeout(sayT);
    sayT = setTimeout(() => {
      if (s) s.textContent = "";
    }, 3e3);
  }
  function showBar() {
    if (!PH.on) {
      if (bar) bar.classList.add("hidden");
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "photoBar";
      document.body.appendChild(bar);
      bar.addEventListener("click", e => {
        const b = e.target.closest("[data-ph]");
        if (!b) return;
        const k = b.dataset.ph;
        if (k === "shot") PH.want = true; else if (k === "off") PH.toggle(false); else if (k === "zi") PH.setZoom(PH.zoom + 1); else if (k === "zo") PH.setZoom(PH.zoom - 1); else if (k === "mini") {
          PH.mini = !PH.mini;
          showBar();
        } else if (k[0] === "f") PH.setFilter(+k.slice(1));
      });
    }
    const K = id => SX.esc(SX.label(id));
    const hint = PH.paused ? "게임을 멈췄습니다 — 찍은 사진은 PNG 파일로 내려받습니다" : "⚠ 같이 하는 판이라 게임이 멈추지 않습니다 — 그동안 내 캐릭터는 그 자리에 서 있고, 적이 다가올 수 있습니다";
    bar.className = PH.mini ? "mini" : "";
    bar.innerHTML = `<div class="row phMini"><b class="phT">사진 모드</b><button data-ph="mini">${PH.mini ? "안내 보이기 [H]" : "안내 숨기기 [H]"}</button></div>\n      <div class="phHint${PH.paused ? "" : " live"}">${hint}</div>\n      <div class="row"><button data-ph="shot" class="phShot">찍기 [Space]</button>\n        ${FILTERS.map(([n], i) => `<button data-ph="f${i}" class="${PH.filter === i ? "on" : ""}">${n} [${i + 1}]</button>`).join("")}\n        <button data-ph="zo">−</button><span>확대 ×${PH.zoom}</span><button data-ph="zi">+</button>\n        <button data-ph="off">나가기 [${K("photo")}]</button></div>\n      <div class="small">WASD · 마우스로 끌기: 화면 옮기기 · 휠: 확대 · 사진에는 이 안내가 안 찍힙니다</div>\n      <div class="phSay"></div>`;
  }
})(window.SX);
