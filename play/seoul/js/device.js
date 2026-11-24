"use strict";

(function(SX) {
  const U = SX.ui, root = document.documentElement;
  const hex2 = h => {
    const v = parseInt(h.slice(1), 16);
    return [ v >> 16, v >> 8 & 255, v & 255 ];
  };
  function screenInit() {
    try {
      const a = Math.max(0, Math.min(.5, parseFloat(getComputedStyle(root).getPropertyValue("--sx-grain")) || .07)), N = 64, R = new SX.Rng(9668);
      const c = document.createElement("canvas");
      c.width = c.height = N;
      const x = c.getContext("2d"), img = x.createImageData(N, N), d = img.data;
      for (let i = 0; i < N * N; i++) {
        const r = R.f(), k = i * 4;
        if (r < .07) {
          d[k] = 201;
          d[k + 1] = 247;
          d[k + 2] = 200;
          d[k + 3] = Math.round(a * 255);
        } else if (r < .17) {
          d[k + 3] = Math.round(Math.min(1, a * 1.6) * 255);
        }
      }
      x.putImageData(img, 0, 0);
      root.style.setProperty("--sx-noise", 'url("' + c.toDataURL() + '")');
      const M = 48, m = document.createElement("canvas");
      m.width = m.height = M;
      const g = m.getContext("2d");
      g.fillStyle = "rgba(155, 232, 154, 0.07)";
      const P = (px, py, w, h) => g.fillRect(px, py, w || 1, h || 1);
      for (let yy = 14; yy < 40; yy++) {
        const hw = Math.round((yy - 14) * .32);
        P(24 - hw, yy);
        P(24 + hw, yy);
        if (yy % 5 === 0) P(24 - hw, yy, hw * 2 + 1, 1);
      }
      for (let k = 0; k < 9; k++) {
        P(24 - Math.round((k + 1) * .32 * 2.8) + k, 14 + k * 3);
      }
      P(23, 9, 3, 5);
      P(24, 6, 1, 3);
      for (const [r0, a0] of [ [ 7, .9 ], [ 11, .8 ], [ 15, .7 ] ]) for (let t = -a0; t <= a0; t += .08) {
        P(24 + Math.round(Math.sin(t) * r0 * .4) - Math.round(r0 * .9), 10 + Math.round(-Math.cos(t) * r0 * .5));
        P(24 - Math.round(Math.sin(t) * r0 * .4) + Math.round(r0 * .9), 10 + Math.round(-Math.cos(t) * r0 * .5));
      }
      P(12, 41, 25, 1);
      P(15, 43, 19, 1);
      root.style.setProperty("--sx-mark", 'url("' + m.toDataURL() + '")');
    } catch (e) {
      console.warn(e);
    }
  }
  screenInit();
  const F35 = {
    0: "111101101101111",
    1: "010110010010111",
    2: "111001111100111",
    3: "111001111001111",
    4: "101101111001001",
    5: "111100111001111",
    6: "111100111101111",
    7: "111001001001001",
    8: "111101111101111",
    9: "111101111001111",
    A: "010101111101101",
    B: "110101110101110",
    C: "011100100100011",
    D: "110101101101110",
    E: "111100110100111",
    F: "111100110100100",
    G: "011100101101011",
    H: "101101111101101",
    I: "111010010010111",
    J: "001001001101010",
    K: "101101110101101",
    L: "100100100100111",
    M: "101111111101101",
    N: "110101101101101",
    O: "010101101101010",
    P: "110101110100100",
    R: "110101110101101",
    S: "011100010001110",
    T: "111010010010010",
    W: "101101111111101",
    X: "101101010101101",
    "-": "000000111000000",
    ".": "000000000000010",
    "/": "001001010100100",
    m: "000000111111101",
    " ": "000000000000000"
  };
  function txt35(put, x, y, s, c) {
    let cx = x;
    for (const ch of s) {
      const g = F35[ch] || F35[" "];
      for (let k = 0; k < 15; k++) if (g[k] === "1") put(cx + k % 3, y + (k / 3 | 0), c);
      cx += 4;
    }
    return cx - x;
  }
  const DET = {
    bare: "#6b675b",
    grime: "#29271f",
    sticker: "#c8c2ac",
    stickerSh: "#b2ac96",
    stickerHi: "#dcd6c2",
    stickerOut: "#7a7462",
    ink: "#8a846e",
    hz: "#c9a227",
    hz2: "#3a3416",
    hzOut: "#2a2716",
    red: "#b8322e",
    redOut: "#6a1e1a",
    paint: "#a8a28c",
    marker: "#9a3a2e",
    ledG: "#6fe06a",
    ledA: "#8a6a2a",
    ledR: "#5a2420",
    ledBox: "#1f1e19",
    cable: "#1f1e19",
    cableHi: "#3a382f",
    port: "#1c1b16"
  };
  U.DET = DET;
  const NOTE_AT = {
    gate: .44,
    term: .4,
    tab: .6
  };
  const kindOf = cv => {
    const p = cv && cv.parentElement;
    return !p ? "" : p.classList.contains("gateRig") ? "gate" : p.classList.contains("term") ? "term" : p.id === "mapWin" ? "tab" : "";
  };
  function rigDetail(cv, W, H, h) {
    const kind = kindOf(cv);
    if (!kind) return;
    const R = new SX.Rng(9670 + W * 7 + H * 13 + kind.length * 101), C = U.RIG;
    const x = cv.getContext("2d"), img = x.getImageData(0, 0, W, H), d = img.data;
    const A = (px, py) => px < 0 || py < 0 || px >= W || py >= H ? 0 : d[(py * W + px) * 4 + 3];
    const col = (px, py) => {
      const i = (py * W + px) * 4;
      return d[i] << 16 | d[i + 1] << 8 | d[i + 2];
    };
    const PLAIN = new Set([ C.base, C.lt, C.sh ].map(c => parseInt(c.slice(1), 16)));
    const deep = (px, py) => {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!A(px + dx, py + dy)) return false;
      return true;
    };
    const keep = [ [ 10, 1, 60, 12 ], [ W - 34, 1, 30, 12 ], [ Math.round(W * NOTE_AT[kind]) - 2, 1, 86, 12 ], [ Math.round(W / 2) - 50, H - 15, 100, 13 ] ];
    const kept = (px, py) => keep.some(([kx, ky, kw, kh]) => px >= kx && px < kx + kw && py >= ky && py < ky + kh);
    const free = (px, py, w, hh) => {
      for (let yy = py; yy < py + hh; yy++) for (let xx = px; xx < px + w; xx++) {
        if (!deep(xx, yy) || kept(xx, yy) || !PLAIN.has(col(xx, yy))) return false;
      }
      return true;
    };
    const put = (px, py, c) => {
      if (px < 0 || py < 0 || px >= W || py >= H || !A(px, py)) return;
      const v = hex2(c), i = (py * W + px) * 4;
      d[i] = v[0];
      d[i + 1] = v[1];
      d[i + 2] = v[2];
    };
    const bands = [ [ 3, 3, W - 6, h.y - 6 ], [ 3, h.y + h.h + 3, W - 6, H - (h.y + h.h) - 8 ], [ 3, h.y, h.x - 6, h.h ], [ h.x + h.w + 3, h.y, W - (h.x + h.w) - 7, h.h ] ].filter(q => q[2] > 2 && q[3] > 2);
    const area = bands.reduce((s, q) => s + q[2] * q[3], 0);
    const spot = (w, hh, tries, band) => {
      for (let t = 0; t < (tries || 40); t++) {
        const q = band || bands[R.i(bands.length)];
        if (q[2] < w || q[3] < hh) continue;
        const px = q[0] + R.i(q[2] - w + 1), py = q[1] + R.i(q[3] - hh + 1);
        if (free(px, py, w, hh)) return [ px, py ];
      }
      return null;
    };
    for (const q of bands.slice(0, 2)) {
      const ry = q[1] + Math.max(0, Math.round(q[3] / 2) - 1);
      for (let rx = q[0] + 18; rx < q[0] + q[2] - 18; rx += 26 + R.i(10)) {
        if (!free(rx - 1, ry - 1, 4, 4)) continue;
        put(rx, ry, C.screwHi);
        put(rx + 1, ry, C.screw);
        put(rx, ry + 1, C.screw);
        put(rx + 1, ry + 1, C.dk);
      }
    }
    const scratch = (c, len) => {
      const p = spot(1, 1, 30);
      if (!p) return;
      let [px, py] = p;
      const dx = R.f() < .5 ? 1 : -1, steep = R.f();
      for (let j = 0; j < len; j++) {
        if (!deep(px, py) || kept(px, py)) break;
        put(px, py, c);
        px += dx;
        if (steep < .35 || steep < .7 && j % 2 || steep >= .7 && j % 3 === 2) py += 1;
      }
    };
    const nS = Math.round(area / 220);
    for (let k = 0; k < nS; k++) scratch(C.hi, 2 + R.i(6));
    for (let k = 0; k < Math.round(nS / 3); k++) scratch(C.lt, 6 + R.i(9));
    for (let k = 0; k < Math.max(3, Math.round(nS / 8)); k++) {
      const p = spot(7, 2);
      if (!p) continue;
      const len = 4 + R.i(4);
      for (let j = 0; j < len; j++) {
        put(p[0] + j, p[1], C.dk);
        put(p[0] + j, p[1] + 1, C.hi);
      }
    }
    for (let k = 0; k < Math.max(4, Math.round(area / 1400)); k++) {
      const p = spot(3, 2);
      if (!p) continue;
      const [px, py] = p;
      put(px, py, C.dk);
      put(px + 1, py, C.sh);
      put(px + 2, py, C.lt);
      put(px, py + 1, C.sh);
      put(px + 1, py + 1, C.lt);
      put(px + 2, py + 1, C.hi);
    }
    for (let k = 0; k < Math.max(4, Math.round(area / 1800)); k++) {
      const p = spot(5, 4);
      if (!p) continue;
      const n = 5 + R.i(9);
      let [px, py] = [ p[0] + 2, p[1] + 1 ];
      for (let j = 0; j < n; j++) {
        if (deep(px, py) && !kept(px, py) && PLAIN.has(col(px, py))) put(px, py, j % 4 === 3 ? C.hi : DET.bare);
        px += R.i(3) - 1;
        py += R.i(3) - 1;
      }
    }
    for (let k = 0; k < Math.round(area / 90); k++) {
      const q = R.f() < .55 ? bands[1] || bands[0] : bands[R.i(bands.length)];
      if (!q) continue;
      const px = q[0] + R.i(q[2]), py = q[1] + R.i(q[3]);
      if (deep(px, py) && !kept(px, py) && PLAIN.has(col(px, py))) put(px, py, R.f() < .5 ? DET.grime : C.sh);
    }
    const sticker = (w, hh, fill, out, paint) => {
      const p = spot(w, hh, 160);
      if (!p) return null;
      const [px, py] = p;
      for (let yy = 0; yy < hh; yy++) for (let xx = 0; xx < w; xx++) {
        const e = xx === 0 || yy === 0 || xx === w - 1 || yy === hh - 1;
        put(px + xx, py + yy, e ? out : fill);
      }
      if (paint) paint(px, py);
      return p;
    };
    sticker(16, 6, DET.sticker, DET.stickerOut, (px, py) => {
      for (let xx = 1; xx < 15; xx++) {
        put(px + xx, py + 1, DET.stickerHi);
        put(px + xx, py + 4, DET.stickerSh);
      }
      for (let xx = 2; xx < 14; xx++) if ((xx * 7 + 3) % 5 < 3) for (let yy = 2; yy < 4; yy++) put(px + xx, py + yy, DET.ink);
      put(px + 15, py, C.base);
      put(px + 14, py, DET.stickerOut);
      put(px + 15, py + 1, DET.stickerOut);
    });
    sticker(9, 6, DET.sticker, DET.stickerOut, (px, py) => {
      for (let xx = 1; xx < 8; xx++) put(px + xx, py + 4, DET.stickerSh);
      txt35((qx, qy, c) => {
        if (qy < py + 4) put(qx, qy, c);
      }, px + 1, py + 1, "QC", DET.ink);
    });
    sticker(14, 5, DET.hz, DET.hzOut, (px, py) => {
      for (let yy = 1; yy < 4; yy++) for (let xx = 1; xx < 13; xx++) put(px + xx, py + yy, (xx + yy >> 1) % 2 ? DET.hz : DET.hz2);
    });
    {
      const p = spot(3, 3, 60);
      if (p) {
        const [px, py] = p;
        for (const [dx, dy, c] of [ [ 1, 0, DET.redOut ], [ 0, 1, DET.redOut ], [ 1, 1, DET.red ], [ 2, 1, DET.redOut ], [ 1, 2, DET.redOut ] ]) put(px + dx, py + dy, c);
      }
    }
    {
      const s = kind === "tab" ? "09" : "07", p = spot(9, 6, 160);
      if (p) txt35(put, p[0] + 1, p[1], s, DET.paint);
    }
    {
      const s = kind === "gate" ? "OK" : kind === "term" ? "B2" : "N-4", p = spot(s.length * 4 + 1, 6, 160);
      if (p) txt35(put, p[0] + 1, p[1], s, DET.marker);
    }
    {
      const p = spot(19, 7, 60);
      if (p) {
        for (let g = 0; g < 2; g++) {
          const gx = p[0] + 1 + g * 10;
          for (let k = 0; k < 4; k++) for (let yy = 0; yy < 5; yy++) put(gx + k * 2, p[1] + 1 + yy, C.hi);
          for (let k = 0; k < 9; k++) put(gx - 1 + k, p[1] + 5 - Math.round(k * .5), DET.bare);
        }
      }
    }
    {
      const p = spot(9, 3, 60, bands[1]) || spot(9, 3, 60);
      if (p) {
        for (let xx = 0; xx < 9; xx++) for (let yy = 0; yy < 3; yy++) put(p[0] + xx, p[1] + yy, DET.ledBox);
        put(p[0] + 1, p[1] + 1, DET.ledG);
        put(p[0] + 2, p[1] + 1, DET.ledG);
        put(p[0] + 4, p[1] + 1, DET.ledA);
        put(p[0] + 6, p[1] + 1, DET.ledR);
        put(p[0] + 7, p[1] + 1, DET.ledR);
      }
    }
    {
      const q = bands[1];
      const p = q && spot(30, 4, 60, q);
      if (p) {
        const [px, py] = p;
        for (let xx = 0; xx < 5; xx++) {
          put(px + xx, py, C.dk);
          put(px + xx, py + 1, DET.port);
          put(px + xx, py + 2, C.hi);
        }
        for (let xx = 5; xx < 26; xx++) {
          put(px + xx, py + 1, DET.cable);
          put(px + xx, py, xx % 6 === 0 ? C.hi : DET.cableHi);
        }
        for (let yy = 0; yy < 3; yy++) for (let xx = 16; xx < 21; xx++) put(px + xx, py + yy, yy === 0 ? C.tapeHi : yy === 2 ? C.tapeSh : C.tape);
        put(px + 26, py + 1, C.screw);
        put(px + 27, py + 1, C.screwHi);
      }
    }
    {
      const p = spot(16, 2, 60);
      if (p) for (let xx = 0; xx < 16; xx++) {
        if ((xx * 5 + 1) % 3 === 0) continue;
        put(p[0] + xx, p[1], C.dk);
        put(p[0] + xx, p[1] + 1, C.hi);
      }
    }
    for (let k = 0; k < 3; k++) {
      const p = spot(3, 3, 40);
      if (!p) continue;
      put(p[0], p[1], C.screwHi);
      put(p[0] + 1, p[1], C.screw);
      put(p[0], p[1] + 1, C.screw);
      put(p[0] + 1, p[1] + 1, C.sh);
      put(p[0] + 2, p[1] + 1, C.dk);
      put(p[0] + 1, p[1] + 2, C.dk);
    }
    x.putImageData(img, 0, 0);
  }
  {
    const rp0 = U.rigPaint;
    U.rigPaint = function(cv, W, H, hole, opt) {
      const r = rp0.apply(this, arguments);
      try {
        rigDetail(cv, W, H, hole || {
          x: 9,
          y: 15,
          w: W - 18,
          h: H - 34
        });
      } catch (e) {
        console.warn(e);
      }
      return r;
    };
  }
  const NOTE = {
    "SX-07 야전 단말기": "07번 채널 · 밤엔 소리 줄일 것",
    "SX-09 야전 태블릿": "건전지 아껴 쓸 것"
  };
  const GATE_NOTE = "비번 적어 두지 말 것";
  const noteHtml = t => t ? `<span class="rigNote">${SX.esc(t)}</span>` : "";
  U.rigTop = (plate, foot) => `<span class="rigPlate">${SX.esc(plate)}</span>${noteHtml(NOTE[foot])}<span class="rigTopR"><span class="led"></span><span class="rigSig" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span><span class="rigFoot">${SX.esc(foot)}</span>`;
  function noteFit(host) {
    const n = host && host.querySelector(":scope > .rigNote");
    if (!n) return;
    n.hidden = false;
    const r = n.getBoundingClientRect(), hr = host.getBoundingClientRect(), u = U.unitOf(host);
    const hit = [ ...host.querySelectorAll(":scope > .rigPlate, :scope > .rigTopR") ].some(e => {
      const q = e.getBoundingClientRect();
      return r.left < q.right + u * 2 && q.left - u * 2 < r.right && r.top < q.bottom && q.top < r.bottom;
    });
    n.hidden = hit || r.left < hr.left + u * 6 || r.right > hr.right - u * 6;
  }
  U.noteFit = noteFit;
  {
    const og = U.openGate;
    U.openGate = function() {
      const r = og.apply(this, arguments);
      try {
        const rig = document.querySelector("#gateBody .gateRig");
        if (rig && !rig.querySelector(":scope > .rigNote")) {
          rig.querySelector(":scope > .rigPlate").insertAdjacentHTML("afterend", noteHtml(GATE_NOTE));
          noteFit(rig);
          requestAnimationFrame(() => noteFit(rig));
        }
      } catch (e) {
        console.warn(e);
      }
      return r;
    };
  }
  {
    const td = U.termDeco;
    U.termDeco = function() {
      const t = document.querySelector("#panel > .term");
      if (t) noteFit(t);
      const r = td.apply(this, arguments);
      if (t) requestAnimationFrame(() => noteFit(t));
      return r;
    };
  }
  addEventListener("resize", () => {
    for (const h of document.querySelectorAll(".sxRig")) noteFit(h);
  });
  const hm = () => {
    const d = new Date;
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  U.tabClock = () => `<span class="tabClock" aria-hidden="true">${hm()}</span>`;
  setInterval(() => {
    if (U.panelKind !== "map") return;
    const c = document.querySelector("#mapWin .tabClock");
    if (c && c.textContent !== hm()) c.textContent = hm();
  }, 5e3);
  const MAPC = {
    "#10151d": "#08110b",
    "#1b2330": "#12241a",
    "#243044": "#1a3424",
    "#2a2f38": "#1b3522",
    "#3a3f48": "#2a4c31",
    "#8a7a3a": "#5f9a60",
    "#163a5c": "#0b2628",
    "#2a5a8a": "#3f8f7c",
    "#1a3322": "#1f4a2a"
  };
  const MAPM = new Map(Object.entries(MAPC).map(([a, b]) => [ parseInt(a.slice(1), 16), parseInt(b.slice(1), 16) ]));
  const MK = {
    car: "#3f6a45",
    car2: "#5f8a62",
    tree: "#2f6a3a",
    tree2: "#3f7f4a",
    wave: "#1f5a54",
    bridge: "#3a5a40",
    bridgeHi: "#5f8a62",
    vent: "#24402a",
    label: "#3f6a45",
    hi: "#6fae70",
    red: "#b8322e"
  };
  U.MAPC = MAPC;
  function mapDeco(cv) {
    const W = cv.width, H = cv.height, x = cv.getContext("2d"), img = x.getImageData(0, 0, W, H), d = img.data, R = new SX.Rng(20261016);
    const at = (px, py) => {
      const i = (py * W + px) * 4;
      return d[i] << 16 | d[i + 1] << 8 | d[i + 2];
    };
    const put = (px, py, c) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const v = hex2(c), i = (py * W + px) * 4;
      d[i] = v[0];
      d[i + 1] = v[1];
      d[i + 2] = v[2];
      d[i + 3] = 255;
    };
    const is = (px, py, c) => px >= 0 && py >= 0 && px < W && py < H && at(px, py) === parseInt(c.slice(1), 16);
    for (let k = 0; k < 420; k++) {
      const px = R.i(W), py = R.i(H - 30);
      if (is(px, py, "#12241a") || is(px, py, "#1a3424")) put(px, py, R.f() < .7 ? MK.vent : "#2a4c31");
    }
    for (let k = 0; k < 16; k++) {
      const px = 4 + R.i(W - 8);
      if (is(px, 99, "#2a4c31") && is(px + 1, 99, "#2a4c31")) {
        put(px, R.f() < .5 ? 99 : 100, MK.car);
        put(px + 1, R.f() < .5 ? 99 : 100, MK.car);
      }
    }
    for (let k = 0; k < 10; k++) {
      const py = 4 + R.i(H - 40);
      if (is(159, py, "#2a4c31")) {
        put(R.f() < .5 ? 159 : 160, py, MK.car2);
        put(R.f() < .5 ? 159 : 160, py + 1, MK.car2);
      }
    }
    for (let k = 0; k < 26; k++) {
      const gx = R.i(15) * 22, py = R.i(H - 34);
      if (is(gx, py, "#1b3522")) put(gx + R.i(2), py, MK.car);
    }
    for (const [cx, cy, rx, ry] of [ [ 52, 70, 18, 12 ], [ 170, 60, 12, 8 ] ]) for (let k = 0; k < rx * ry / 3; k++) {
      const px = cx - rx + R.i(rx * 2), py = cy - ry + R.i(ry * 2);
      if (is(px, py, "#1f4a2a")) {
        put(px, py, MK.tree);
        if (R.f() < .5) put(px + 1, py, MK.tree2);
      }
    }
    for (let k = 0; k < 90; k++) {
      const px = R.i(W - 3), py = H - 22 + R.i(20);
      if (is(px, py, "#0b2628") && is(px + 2, py, "#0b2628")) {
        put(px, py, MK.wave);
        put(px + 1, py, MK.wave);
      }
    }
    {
      const bx = Math.round(W * .66);
      for (let py = H - 34; py < H; py++) {
        if (!is(bx, py, "#0b2628") && !is(bx, py, "#3f8f7c") && py > H - 26) continue;
        put(bx - 2, py, MK.bridge);
        put(bx + 2, py, MK.bridge);
        put(bx - 1, py, MK.bridgeHi);
        put(bx, py, MK.bridgeHi);
        put(bx + 1, py, MK.bridgeHi);
        if (py % 6 === 0) {
          put(bx - 3, py, MK.bridge);
          put(bx + 3, py, MK.bridge);
        }
      }
    }
    for (let c = 0; c < 14; c++) txt35(put, c * 22 + 9, 1, "ABCDEFGHIJKLMN"[c], MK.label);
    for (let r = 0; r < 8; r++) txt35(put, 1, r * 20 + 8, String(r + 1), MK.label);
    {
      const nx = W - 12, ny = 2;
      txt35(put, nx, ny + 7, "N", MK.hi);
      for (let k = 0; k < 6; k++) {
        put(nx + 1, ny + k, MK.hi);
        if (k > 1 && k < 4) {
          put(nx + 1 - (k - 1), ny + k, MK.hi);
          put(nx + 1 + (k - 1), ny + k, MK.hi);
        }
      }
    }
    {
      const sx = 5, sy = H - 8;
      for (let k = 0; k < 41; k++) put(sx + k, sy, MK.hi);
      for (const k of [ 0, 20, 40 ]) {
        put(sx + k, sy - 1, MK.hi);
        put(sx + k, sy - 2, MK.hi);
      }
      for (let k = 1; k < 20; k++) put(sx + k, sy - 1, "#2a4c31");
      txt35(put, sx + 44, sy - 4, "500m", MK.hi);
    }
    txt35(put, W - 74, H - 8, "37.56N 126.97E", MK.label);
    x.putImageData(img, 0, 0);
  }
  function recolor(cv) {
    if (!cv || cv.dataset.scr) return;
    const x = cv.getContext("2d"), img = x.getImageData(0, 0, cv.width, cv.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = MAPM.get(d[i] << 16 | d[i + 1] << 8 | d[i + 2]);
      if (v != null) {
        d[i] = v >> 16;
        d[i + 1] = v >> 8 & 255;
        d[i + 2] = v & 255;
      }
    }
    x.putImageData(img, 0, 0);
    cv.dataset.scr = "1";
    try {
      mapDeco(cv);
    } catch (e) {
      console.warn(e);
    }
  }
  const CAM = {
    rim: "#25231d",
    lens: "#0b1016",
    hi: "#5f7a90",
    sen: "#1c1b16"
  };
  U.CAM = CAM;
  U.tabPaint = function(cv, W, H, hole) {
    U.rigPaint(cv, W, H, hole, {
      screw: 5
    });
    const x = cv.getContext("2d"), cx = W >> 1, cy = Math.max(4, Math.round((hole.y - 2) / 2));
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const q = dx * dx + dy * dy;
      if (q > 5) continue;
      x.fillStyle = q >= 4 ? CAM.rim : CAM.lens;
      x.fillRect(cx + dx, cy + dy, 1, 1);
    }
    x.fillStyle = CAM.hi;
    x.fillRect(cx - 1, cy - 1, 1, 1);
    x.fillStyle = CAM.sen;
    x.fillRect(cx + 6, cy, 2, 1);
    x.fillRect(cx - 7, cy, 2, 1);
    return cv;
  };
  const DOCK = [ [ "dkHome", "셸터" ], [ "dkMarket", "장터" ], [ "", "건물" ], [ "dkLock", "잠김" ], [ "dkHere", "지금 있는 곳" ] ];
  const DOCK_TIP = "두 번 누르면 바로 갑니다";
  function radar() {
    const N = 40, c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d"), R = new SX.Rng(9671);
    const P = (px, py, col) => {
      g.fillStyle = col;
      g.fillRect(px, py, 1, 1);
    };
    for (const r of [ 6, 12, 18 ]) for (let t = 0; t < Math.PI * 2; t += .6 / r) P(20 + Math.round(Math.cos(t) * r), 20 + Math.round(Math.sin(t) * r), r === 18 ? "#2f5a34" : "#1d3a25");
    for (let k = -18; k <= 18; k++) {
      if (k % 2) continue;
      P(20 + k, 20, "#1d3a25");
      P(20, 20 + k, "#1d3a25");
    }
    for (let j = 0; j < 4; j++) {
      const a = -.9 - j * .12;
      for (let r = 1; r <= 18; r++) P(20 + Math.round(Math.cos(a) * r), 20 + Math.round(Math.sin(a) * r), j ? j === 1 ? "#3f7a48" : "#24452c" : "#9be89a");
    }
    for (const [bx, by, col] of [ [ 27, 11, "#c9f7c8" ], [ 12, 25, "#6fae70" ], [ 26, 29, "#ffd76a" ] ]) {
      P(bx, by, col);
      P(bx + 1, by, col);
    }
    for (let k = 0; k < 10; k++) P(4 + R.i(32), 4 + R.i(32), "#24452c");
    return c;
  }
  function wave() {
    const W = 60, H = 14, c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d"), R = new SX.Rng(9672);
    g.fillStyle = "#1d3a25";
    for (let px = 0; px < W; px += 2) g.fillRect(px, 7, 1, 1);
    g.fillStyle = "#9be89a";
    let py = 7;
    for (let px = 0; px < W; px++) {
      const n = 7 + Math.round(Math.sin(px * .55) * 3 + (R.f() - .5) * 4 * (px > 20 && px < 34 ? 1.6 : .6));
      const a = Math.min(py, n), b = Math.max(py, n);
      g.fillRect(px, Math.max(0, a), 1, Math.min(H - 1, b) - Math.max(0, a) + 1);
      py = n;
    }
    return c;
  }
  function dockHtml() {
    return `<div class="dkRow">${DOCK.map(([c, t]) => `<span><i class="${c}"></i>${SX.esc(t)}</span>`).join("")}<span class="dkTip">${SX.esc(DOCK_TIP)}</span></div>` + dashHtml("CH-09 · 07", "SX-09 ▮▮▮▯");
  }
  function dashHtml(ch, blk) {
    const s = SX.game.save, val = v => Math.max(0, Math.min(100, v == null ? 100 : v));
    const bar = (name, v, cls) => `<span class="dkV">${SX.esc(name)}</span><i class="dkBar${cls ? " " + cls : ""}"><i style="width:${val(v).toFixed(0)}%"></i></i><b>${Math.round(val(v))}</b>`;
    return `<div class="dkPan"><div class="dkVit">${bar("배고픔", s.food)}${bar("목마름", s.water)}${bar("감염", s.infect, "bad")}<span class="dkV">소지금</span><b class="dkMoney">${SX.esc(SX.won(s.money | 0))}</b></div>\n      <div class="dkRad"><canvas class="dkRadar" width="40" height="40" aria-hidden="true"></canvas></div>\n      <div class="dkRead" aria-hidden="true"><span>37.5665N</span><span>126.9780E</span><canvas class="dkWave" width="60" height="14"></canvas><span>${ch}</span><span class="dkBlk">${blk}</span></div></div>`;
  }
  function placeDock(w, s) {
    const d = s.querySelector(":scope > .mapDock"), body = s.querySelector("#mapBody"), mb = body && body.querySelector(".cityMap");
    if (!d || !mb) return;
    const u = U.unitOf(w), top = mb.offsetTop + mb.offsetHeight + u * 3, bottom = body.offsetTop + body.clientHeight - u * 4;
    d.hidden = false;
    d.classList.remove("slim");
    d.style.left = mb.offsetLeft + "px";
    d.style.top = top + "px";
    d.style.width = mb.offsetWidth + "px";
    d.style.height = "";
    const row = d.querySelector(".dkRow"), rowH = row ? row.offsetHeight : 0, room = bottom - top;
    if (body.scrollHeight > body.clientHeight + 1 || room < rowH + u * 3) {
      d.hidden = true;
      return;
    }
    if (room < rowH + u * 34) {
      d.classList.add("slim");
      d.style.height = "";
      return;
    }
    d.style.height = room + "px";
    const pan = d.querySelector(".dkPan"), rc = d.querySelector(".dkRadar"), wv = d.querySelector(".dkWave");
    if (pan && rc) {
      const k = Math.max(1, Math.floor((pan.clientHeight - u * 4) / 40));
      rc.style.width = rc.style.height = 40 * k + "px";
    }
    if (wv) {
      const k = Math.max(1, Math.min(3, Math.round(u)));
      wv.style.width = 60 * k + "px";
      wv.style.height = 14 * k + "px";
      wv.style.maxWidth = "100%";
    }
  }
  let tabRO = null;
  U.mapTab = function() {
    const w = document.getElementById("mapWin");
    if (!w) return;
    const s = w.querySelector(":scope > .tabScr");
    if (!s) return;
    recolor(w.querySelector("#mapBody .cityMap canvas"));
    let cv = w.querySelector(":scope > .rigArt");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.className = "rigArt";
      cv.setAttribute("aria-hidden", "true");
      w.insertBefore(cv, w.firstChild);
    }
    if (!s.querySelector(":scope > .mapDock")) {
      const d = document.createElement("div");
      d.className = "mapDock";
      d.hidden = true;
      d.innerHTML = dockHtml();
      s.appendChild(d);
      try {
        d.querySelector(".dkRadar").getContext("2d").drawImage(radar(), 0, 0);
        d.querySelector(".dkWave").getContext("2d").drawImage(wave(), 0, 0);
      } catch (e) {
        console.warn(e);
      }
    }
    noteFit(w);
    let key = "";
    const fit = () => {
      if (!w.isConnected) return;
      placeDock(w, s);
      const u = U.unitOf(w), b = parseFloat(getComputedStyle(w).borderLeftWidth) || 0, W = Math.floor(w.offsetWidth / u), H = Math.floor(w.offsetHeight / u);
      if (W < 60 || H < 60) return;
      const hole = {
        x: Math.round((s.offsetLeft + b) / u),
        y: Math.round((s.offsetTop + b) / u),
        w: Math.round(s.offsetWidth / u),
        h: Math.round(s.offsetHeight / u)
      };
      const k = [ W, H, u, hole.x, hole.y, hole.w, hole.h ].join(",");
      if (k === key) return;
      key = k;
      U.tabPaint(cv, W, H, hole);
      cv.style.width = W * u + "px";
      cv.style.height = H * u + "px";
      cv.style.left = -b + "px";
      cv.style.top = -b + "px";
    };
    fit();
    if (tabRO) tabRO.disconnect();
    if (window.ResizeObserver) {
      tabRO = new ResizeObserver(() => {
        if (!w.isConnected) {
          tabRO.disconnect();
          tabRO = null;
          return;
        }
        fit();
      });
      tabRO.observe(w);
      const bd = s.querySelector("#mapBody");
      if (bd) tabRO.observe(bd);
    }
    requestAnimationFrame(() => {
      if (w.isConnected) {
        placeDock(w, s);
        noteFit(w);
      }
    });
  };
  const SCH = {
    line: "#6fae70",
    hi: "#9be89a",
    dim: "#2f5a34",
    fill: "#12241a",
    amber: "#ffd76a",
    red: "#b8322e"
  };
  U.SCH = SCH;
  function schematic(b, locked) {
    const W = 120, H = 30, GY = H - 8, c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d"), R = new SX.Rng(9673 + (b.id || "").length * 31 + (b.floors | 0) * 7 + (b.diff | 0));
    const P = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w || 1, h || 1);
    };
    const box = (x, y, w, h, col) => {
      P(x, y, w, 1, col);
      P(x, y + h - 1, w, 1, col);
      P(x, y, 1, h, col);
      P(x + w - 1, y, 1, h, col);
    };
    const put = (x, y, col) => P(x, y, 1, 1, col);
    const water = b.outdoor && b.outdoor !== "site" && b.outdoor !== "tunnel";
    for (let x = 0; x < W; x += 2) put(x, GY, SCH.dim);
    if (!water) for (let x = 1; x < W - 6; ) {
      const w = 6 + R.i(9), h = 5 + R.i(12);
      if (x + w > 40 && x < 82) {
        x = 82;
        continue;
      }
      box(x, GY - h, w, h + 1, SCH.dim);
      for (let yy = GY - h + 2; yy < GY - 1; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (R.f() < .5) put(xx, yy, SCH.dim);
      x += w + 1 + R.i(3);
    } else for (let x = 0; x < W; x += 3) put(x + x % 2, GY + 2 + (x % 5 === 0 ? 1 : 0), SCH.dim);
    const cx = 60;
    if (b.place && b.id === "home") {
      P(cx - 12, GY - 12, 24, 12, SCH.fill);
      box(cx - 12, GY - 12, 24, 13, SCH.line);
      for (let k = 0; k < 13; k++) {
        put(cx - 13 + k, GY - 12 - Math.round(k * .5), SCH.line);
        put(cx + 12 - k, GY - 12 - Math.round(k * .5), SCH.line);
      }
      box(cx - 3, GY - 8, 6, 9, SCH.hi);
      put(cx + 1, GY - 4, SCH.amber);
      box(cx - 10, GY - 9, 4, 3, SCH.line);
      box(cx + 6, GY - 9, 4, 3, SCH.line);
      P(cx + 7, GY - 21, 2, 5, SCH.line);
      put(cx + 8, GY - 23, SCH.dim);
      put(cx + 9, GY - 25, SCH.dim);
    } else if (b.place) {
      for (let k = 0; k < 3; k++) {
        const x = cx - 26 + k * 18;
        box(x, GY - 9, 16, 10, SCH.line);
        for (let j = 0; j < 16; j++) for (let yy = 0; yy < 3; yy++) if (((j >> 1) + yy) % 2 === 0) put(x + j, GY - 12 + yy, k === 1 ? SCH.amber : SCH.hi);
        P(x + 2, GY - 4, 12, 1, SCH.dim);
      }
      P(cx + 29, GY - 3, 3, 3, SCH.dim);
      for (const [x, y] of [ [ cx + 30, GY - 5 ], [ cx + 31, GY - 7 ], [ cx + 29, GY - 6 ] ]) put(x, y, SCH.amber);
    } else if (b.outdoor === "site") {
      for (let y = GY - 20; y < GY; y++) {
        put(cx - 18, y, SCH.line);
        put(cx - 15, y, SCH.line);
        if (y % 3 === 0) put(cx - 17 + y % 2, y, SCH.dim);
      }
      P(cx - 22, GY - 20, 44, 1, SCH.hi);
      for (let x = cx - 22; x < cx + 22; x += 3) put(x, GY - 19, SCH.dim);
      P(cx + 14, GY - 19, 1, 9, SCH.line);
      box(cx + 11, GY - 10, 7, 4, SCH.amber);
      box(cx - 6, GY - 9, 16, 10, SCH.dim);
      P(cx - 6, GY - 5, 16, 1, SCH.dim);
    } else if (b.outdoor === "tunnel") {
      for (let x = cx - 28; x <= cx + 28; x++) {
        const t = (x - cx) / 28, y = Math.round(GY - Math.sqrt(Math.max(0, 1 - t * t)) * 18);
        put(x, y, SCH.line);
        if (x % 4 === 0) for (let yy = y + 2; yy < GY; yy += 3) put(x, yy, SCH.dim);
      }
      for (let x = cx - 24; x < cx + 24; x += 6) P(x, GY - 2, 3, 1, SCH.amber);
    } else if (water) {
      for (let x = 0; x < W; x++) {
        put(x, GY - 12, SCH.hi);
        put(x, GY - 10, SCH.line);
        if (x % 6 === 0) P(x, GY - 12, 1, 3, SCH.line);
      }
      for (const x of [ 18, 50, 82, 110 ]) P(x, GY - 9, 3, 11, SCH.line);
      for (let x = 30; x < 40; x++) put(x, GY - 13, SCH.amber);
    } else {
      const n = Math.max(1, Math.min(6, b.floors | 0)), fh = Math.max(3, Math.min(5, Math.floor(20 / n))), bw = 26, bx = cx - 13, top = GY - n * fh;
      P(bx, top, bw, n * fh, SCH.fill);
      box(bx, top, bw, n * fh + 1, locked ? SCH.dim : SCH.line);
      for (let f = 0; f < n; f++) {
        const y = top + f * fh;
        if (f) P(bx + 1, y, bw - 2, 1, SCH.dim);
        for (let x = bx + 3; x < bx + bw - 3; x += 4) P(x, y + 1, 2, Math.max(1, fh - 2), R.f() < .22 ? SCH.amber : SCH.line);
      }
      P(bx + bw - 6, top - 5, 1, 5, SCH.line);
      put(bx + bw - 7, top - 5, SCH.hi);
      put(bx + bw - 5, top - 3, SCH.hi);
      for (let k = 0; k < (b.diff | 0); k++) {
        let x = bx + 3 + R.i(bw - 6), y = top + R.i(Math.max(1, n * fh - 3));
        for (let j = 0; j < 3; j++) {
          put(x, y, SCH.red);
          x += R.i(3) - 1;
          y += 1;
        }
      }
      if (b.train) for (const r of [ 2, 4, 6 ]) for (let t = 0; t < 6.3; t += .6 / r) put(cx + 26 + Math.round(Math.cos(t) * r), GY - 9 + Math.round(Math.sin(t) * r), r === 2 ? SCH.amber : SCH.line);
      if (b.final) {
        for (let t = 0; t < 6.3; t += .15) put(cx + Math.round(Math.cos(t) * 7), top - 3 + Math.round(Math.sin(t) * 2), SCH.hi);
      }
      for (let y = top; y < GY; y++) if (y % 2 === 0) put(bx + bw + 3, y, SCH.dim);
      txt35(put, bx + bw + 5, top, String(n), SCH.dim);
    }
    if (locked) {
      for (let y = 0; y < GY; y += 2) for (let x = (y >> 1) % 2; x < W; x += 4) if (R.f() < .22) put(x, y, SCH.dim);
      box(cx - 4, 7, 9, 7, SCH.amber);
      P(cx - 2, 3, 1, 4, SCH.amber);
      P(cx + 2, 3, 1, 4, SCH.amber);
      P(cx - 2, 3, 5, 1, SCH.amber);
      P(cx, 9, 1, 3, SCH.amber);
    }
    const tag = (b.id || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) + " " + (b.place ? "SAFE" : (b.floors | 0) + "F");
    txt35(put, 1, H - 5, tag, SCH.dim);
    const no = String(((b.id || "x").charCodeAt(0) * 37 + (b.id || "").length * 11) % 900 + 100);
    txt35(put, W - no.length * 4, H - 5, no, SCH.dim);
    return c;
  }
  function infoFill() {
    const info = document.getElementById("mapInfo");
    if (!info || info.querySelector(":scope > .infoFill")) return;
    const sel = document.querySelector("#mapBody .pin.sel"), b = sel && sel._b;
    if (!b) return;
    const f = document.createElement("div");
    f.className = "infoFill";
    f.setAttribute("aria-hidden", "true");
    const cv = schematic(b, sel.classList.contains("lock"));
    cv.className = "infoSch";
    f.appendChild(cv);
    const row = info.querySelector(":scope > .goRow, :scope > button.big");
    if (row) info.insertBefore(f, row); else info.appendChild(f);
    const size = () => {
      if (!f.isConnected) return;
      const u = U.unitOf(info);
      cv.hidden = false;
      const k = Math.min(Math.max(1, Math.round(u)), Math.floor(f.clientHeight / 30), Math.floor((f.clientWidth - u * 4) / 120));
      cv.hidden = k < 1;
      if (k >= 1) {
        cv.style.width = 120 * k + "px";
        cv.style.height = 30 * k + "px";
      }
    };
    size();
    requestAnimationFrame(size);
  }
  function infoTight() {
    const info = document.getElementById("mapInfo");
    if (!info) return;
    info.classList.remove("tight2");
    if (info.scrollHeight > info.clientHeight + 1) info.classList.add("tight2");
  }
  new MutationObserver(() => {
    if (U.panelKind === "map") {
      infoTight();
      infoFill();
    }
  }).observe(document.getElementById("panel") || document.body, {
    childList: true,
    subtree: true
  });
  function termWrap() {
    const scr = document.getElementById("termScr");
    if (!scr) return;
    const loose = [ ...scr.childNodes ].filter(n => !(n.nodeType === 1 && (n.classList.contains("scrIn") || n.classList.contains("scrFill"))) && !(n.nodeType === 3 && !n.nodeValue.trim()));
    if (!loose.length && scr.querySelector(":scope > .scrIn")) return;
    let w = scr.querySelector(":scope > .scrIn");
    if (!w) {
      w = document.createElement("div");
      w.className = "scrIn";
      scr.insertBefore(w, scr.firstChild);
    }
    for (const n of loose) w.appendChild(n);
  }
  function termFill() {
    const scr = document.getElementById("termScr");
    if (!scr || U.panelKind !== "term") return;
    const inn = scr.querySelector(":scope > .scrIn"), u = U.unitOf(scr);
    let f = scr.querySelector(":scope > .scrFill");
    let used = 0;
    if (inn) for (const k of inn.children) used = Math.max(used, k.offsetTop + k.offsetHeight);
    const room = inn ? inn.clientHeight - used - u * 8 : 0;
    if (room < u * 46 || inn && inn.scrollHeight > inn.clientHeight + 1) {
      if (f) f.remove();
      return;
    }
    if (!f) {
      f = document.createElement("div");
      f.className = "scrFill";
      f.innerHTML = dashHtml("CH-07 · 03", "SX-07 ▮▮▮▯");
      scr.appendChild(f);
      try {
        f.querySelector(".dkRadar").getContext("2d").drawImage(radar(), 0, 0);
        f.querySelector(".dkWave").getContext("2d").drawImage(wave(), 0, 0);
      } catch (e) {}
    }
    const hh = Math.min(room, u * 90) + "px";
    if (f.style.height !== hh) f.style.height = hh;
    const rc = f.querySelector(".dkRadar"), k = Math.max(1, Math.floor((f.clientHeight - u * 6) / 40)), rs = 40 * k + "px";
    if (rc.style.width !== rs) rc.style.width = rc.style.height = rs;
    const wv = f.querySelector(".dkWave"), k2 = Math.max(1, Math.min(3, Math.round(u)));
    if (wv.style.width !== 60 * k2 + "px") {
      wv.style.width = 60 * k2 + "px";
      wv.style.height = 14 * k2 + "px";
      wv.style.maxWidth = "100%";
    }
  }
  new MutationObserver(() => {
    if (U.panelKind === "term") {
      termWrap();
      requestAnimationFrame(termFill);
    }
  }).observe(document.getElementById("panel") || document.body, {
    childList: true,
    subtree: true
  });
  document.addEventListener("click", e => {
    if (U.panelKind !== "map") return;
    const b = e.target && e.target.closest && e.target.closest("#modeTut, #modePrac");
    if (b && !b.disabled) SX.audio.play("click");
  }, true);
})(window.SX);
