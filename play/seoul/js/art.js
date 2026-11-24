"use strict";

(function(SX) {
  const TS = SX.TS;
  const A = SX.art = {};
  const OFF = A.OFF = new WeakSet, KEY = new WeakMap;
  const mk = (w, h) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, w | 0);
    c.height = Math.max(1, h | 0);
    OFF.add(c);
    return c;
  };
  A.mk = mk;
  A.keyOf = c => KEY.get(c);
  A.keyMap = function(m, pre) {
    const s = m.set.bind(m);
    m.set = (k, v) => {
      if (v && typeof v === "object") {
        const kk = (pre || "") + k;
        KEY.set(v, kk);
        if (A.onKey) A.onKey(kk, v);
      }
      return s(k, v);
    };
    return m;
  };
  const C = A.C = {
    black: "#0b0c0e",
    ink: "#15171b",
    out: "#141418",
    asph: "#393b40",
    asph2: "#333539",
    asph3: "#44464b",
    lane: "#c9bf96",
    laneW: "#d9d6cc",
    walk: "#6a6864",
    walk2: "#5c5a56",
    walk3: "#77756f",
    curb: "#8d8a83",
    grass: "#46552f",
    grass2: "#566739",
    grass3: "#3a4628",
    dirt: "#5a4736",
    dirt2: "#4d3c2e",
    conc: "#56585b",
    conc2: "#4f5154",
    conc3: "#5f6164",
    crack: "#3d3f42",
    carpet: "#465061",
    carpet2: "#3f4858",
    carpet3: "#505b6d",
    tile: "#b3b1a8",
    tile2: "#a5a39a",
    grout: "#86847c",
    hosp: "#95aba3",
    hosp2: "#89a097",
    hgrout: "#6c8079",
    wood: "#6d5134",
    wood2: "#5c442b",
    wood3: "#7d5f3e",
    chk1: "#8a857a",
    chk2: "#66625a",
    lino: "#7c8c56",
    lino2: "#72824e",
    roof: "#5a5c58",
    roof2: "#50524e",
    tar: "#3a3c39",
    capTop: "#2a2c31",
    capEdge: "#1c1d21",
    capHi: "#474b53",
    wallF: "#8b877e",
    wallF2: "#7d7970",
    wallF3: "#9c988e",
    wallBase: "#4a4741",
    wallDirt: "#6b675f",
    glass: "#5f8a9a",
    glass2: "#9cc8d4",
    glassDk: "#35535e",
    door: "#6b4a2d",
    door2: "#553a22",
    doorHi: "#86633e",
    knob: "#d8b44a",
    chain: "#a0a3a8",
    lockRed: "#b8322e",
    metal: "#7d848c",
    metal2: "#5f656c",
    metal3: "#9aa1a8",
    rust: "#8a4f2e",
    white: "#e6e3da",
    paper: "#d9d4c4",
    red: "#c4403b",
    red2: "#8e2b28",
    blood: "#8f1b1f",
    blood2: "#6a1216",
    green: "#5da04c",
    yellow: "#e2b64b",
    orange: "#d9793a",
    blue: "#4a78b8",
    cyan: "#62b5b8",
    purple: "#7a5aa6",
    skin1: "#e0b48c",
    skin2: "#c79871",
    skin3: "#9c7050",
    zskin: "#8a9a6a",
    zskin2: "#6f7f52",
    shadow: "rgba(0,0,0,0.35)"
  };
  const hexRgb = hex => {
    const n = parseInt(hex.slice(1), 16);
    return [ n >> 16, n >> 8 & 255, n & 255 ];
  };
  const rgbHex = (r, g, b) => "#" + [ r, g, b ].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  A.hexRgb = hexRgb;
  A.rgbHex = rgbHex;
  A.shade = (hex, k) => {
    const [r, g, b] = hexRgb(hex);
    const f = v => k < 0 ? v * (1 + k) : v + (255 - v) * k;
    return rgbHex(f(r), f(g), f(b));
  };
  const sh = A.shade;
  A.mix = (a, b, t) => {
    const x = hexRgb(a), y = hexRgb(b);
    return rgbHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  };
  const rampCache = new Map;
  A.rampCache = rampCache;
  A.ramp = function(hex) {
    let r = rampCache.get(hex);
    if (r) return r;
    const cool = "#1a2030", warm = "#fff4d8";
    r = [ A.mix(sh(hex, -.62), cool, .25), A.mix(sh(hex, -.42), cool, .15), A.mix(sh(hex, -.2), cool, .06), hex, A.mix(sh(hex, .16), warm, .1), A.mix(sh(hex, .34), warm, .2) ];
    rampCache.set(hex, r);
    return r;
  };
  const RP = A.ramp;
  function Pen(ctx) {
    this.x = ctx;
  }
  Pen.prototype.r = function(x, y, w, h, c) {
    if (w <= 0 || h <= 0 || !c) return this;
    this.x.fillStyle = c;
    this.x.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return this;
  };
  Pen.prototype.p = function(x, y, c) {
    if (!c) return this;
    this.x.fillStyle = c;
    this.x.fillRect(Math.round(x), Math.round(y), 1, 1);
    return this;
  };
  Pen.prototype.box = function(x, y, w, h, fill, edge) {
    this.r(x, y, w, h, edge);
    this.r(x + 1, y + 1, w - 2, h - 2, fill);
    return this;
  };
  Pen.prototype.line = function(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (let n = 0; n < 800; n++) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) {
        e += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        e += dx;
        y0 += sy;
      }
    }
    return this;
  };
  Pen.prototype.thick = function(x0, y0, x1, y1, w, c) {
    const h = (w - 1) / 2;
    for (let k = -Math.floor(h); k <= Math.ceil(h); k++) {
      if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) this.line(x0, y0 + k, x1, y1 + k, c); else this.line(x0 + k, y0, x1 + k, y1, c);
    }
    return this;
  };
  Pen.prototype.oval = function(cx, cy, rx, ry, c) {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - y * y / (ry * ry + .25))));
      this.r(cx - w, cy + y, w * 2 + 1, 1, c);
    }
    return this;
  };
  Pen.prototype.ring = function(cx, cy, rx, ry, c) {
    const n = Math.max(12, Math.round((rx + ry) * 4));
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2;
      this.p(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c);
    }
    return this;
  };
  Pen.prototype.noise = function(x, y, w, h, cols, dens, rng) {
    const n = Math.round(w * h * dens);
    const X = this.x, W = Math.ceil(w), H = Math.ceil(h), M = n > W * H && X.getTransform ? X.getTransform() : null;
    if (M && M.a === 1 && M.b === 0 && M.c === 0 && M.d === 1 && M.e === Math.round(M.e) && M.f === Math.round(M.f) && w > 0 && h > 0 && W * H <= 65536 && X.globalAlpha === 1 && X.globalCompositeOperation === "source-over" && (!X.filter || X.filter === "none") && !X.shadowBlur && !X.shadowOffsetX && !X.shadowOffsetY && cols.every(c => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))) {
      const last = new Int16Array(W * H).fill(-1);
      let k = -1;
      for (let i = 0; i < n; i++) {
        const a = rng.i(w), b = rng.i(h);
        k = rng.i(cols.length);
        last[b * W + a] = k;
      }
      for (let c = 0; c < cols.length; c++) {
        let on = false;
        for (let b = 0; b < H; b++) for (let a = 0; a < W; a++) {
          if (last[b * W + a] !== c) continue;
          let e = a + 1;
          while (e < W && last[b * W + e] === c) e++;
          if (!on) {
            X.fillStyle = cols[c];
            on = true;
          }
          X.fillRect(Math.round(x + a), Math.round(y + b), e - a, 1);
          a = e - 1;
        }
      }
      if (k >= 0) X.fillStyle = cols[k];
      return this;
    }
    for (let i = 0; i < n; i++) this.p(x + rng.i(w), y + rng.i(h), cols[rng.i(cols.length)]);
    return this;
  };
  Pen.prototype.dith = function(x, y, w, h, c, par) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if ((xx + yy + (par | 0) & 1) === 0) this.p(x + xx, y + yy, c);
    return this;
  };
  Pen.prototype.hband = function(x, y, w, h, cols) {
    const n = cols.length;
    let s = 0;
    for (let k = 0; k < n; k++) {
      const e = Math.round((k + 1) * w / n);
      this.r(x + s, y, e - s, h, cols[k]);
      s = e;
    }
    return this;
  };
  Pen.prototype.vband = function(x, y, w, h, cols) {
    const n = cols.length;
    let s = 0;
    for (let k = 0; k < n; k++) {
      const e = Math.round((k + 1) * h / n);
      this.r(x, y + s, w, e - s, cols[k]);
      s = e;
    }
    return this;
  };
  Pen.prototype.poly = function(pts, c) {
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      const yc = y + .5;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (a[1] <= yc && b[1] > yc || b[1] <= yc && a[1] > yc) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
        if (xb > xa) this.r(xa, y, xb - xa, 1, c);
      }
    }
    return this;
  };
  Pen.prototype.each = function(x, y, w, h, fn) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const c = fn(xx, yy);
      if (c) this.p(x + xx, y + yy, c);
    }
    return this;
  };
  Pen.prototype.block = function(x, y, w, top, front, hex, o) {
    o = o || {};
    const R = RP(hex);
    if (top > 0) {
      this.r(x, y, w, top, R[4]);
      if (top > 2) {
        this.r(x, y, w, 1, R[3]);
        this.r(x + 1, y + top - 1, w - 2, 1, R[5]);
      }
      this.r(x, y, 1, top, R[5]);
      this.r(x + w - 1, y + 1, 1, top - 1, R[3]);
    }
    if (front > 0) {
      const fy = y + top;
      this.r(x, fy, w, front, R[2]);
      this.r(x, fy, 1, front, R[3]);
      this.r(x + w - 1, fy, 1, front, R[1]);
      if (front > 3) this.r(x, fy + front - 1, w, 1, R[1]);
      if (o.lip !== false && front > 5) this.r(x + 1, fy, w - 2, 1, R[1]);
    }
    return this;
  };
  Pen.prototype.cyl = function(x, y, w, h, hex, o) {
    o = o || {};
    const R = RP(hex), e = o.e != null ? o.e : Math.max(2, Math.round(w / 3)), rx = w / 2, cx = x + rx;
    const band = t => t < .12 ? R[3] : t < .3 ? R[5] : t < .45 ? R[4] : t < .7 ? R[3] : t < .88 ? R[2] : R[1];
    for (let i = 0; i < w; i++) {
      const t = (i + .5) / w, dx = (i + .5 - rx) / rx;
      const bot = Math.round(y + h - e / 2 + e / 2 * Math.sqrt(Math.max(0, 1 - dx * dx)));
      this.r(x + i, y + e / 2, 1, bot - (y + e / 2), band(t));
    }
    if (!o.open) {
      this.oval(Math.round(cx - .5), Math.round(y + e / 2), Math.max(1, Math.floor(rx) - (w % 2 ? 0 : 1)), Math.max(1, Math.floor(e / 2)), o.top || R[4]);
      if (w > 5) this.r(cx - rx * .5, y + 1, Math.max(1, rx * .5), 1, R[5]);
    }
    return this;
  };
  Pen.prototype.hcyl = function(x, y, w, h, hex) {
    const R = RP(hex);
    this.vband(x, y, w, h, h >= 6 ? [ R[4], R[5], R[4], R[3], R[3], R[2], R[1] ] : h >= 4 ? [ R[5], R[4], R[3], R[1] ] : [ R[4], R[2] ]);
    this.r(x + w - 1, y, 1, h, R[2]);
    return this;
  };
  Pen.prototype.ball = function(cx, cy, rx, ry, hex, o) {
    ry = ry || rx;
    const R = RP(hex);
    const lx = -.55, ly = -.65, lz = .52;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / (rx + .5), ny = y / (ry + .5), q = nx * nx + ny * ny;
      if (q > 1) continue;
      const nz = Math.sqrt(1 - q), d = nx * lx + ny * ly + nz * lz;
      const c = d > .9 ? R[5] : d > .7 ? R[4] : d > .45 ? R[3] : d > .2 ? R[2] : d > -.1 ? R[1] : R[0];
      this.p(cx + x, cy + y, o && o.flat && c === R[5] ? R[4] : c);
    }
    return this;
  };
  Pen.prototype.shadow = function(cx, cy, rx, ry, a) {
    a = a == null ? .38 : a;
    this.oval(cx, cy, rx, ry, "rgba(0,0,0," + (a * .55).toFixed(3) + ")");
    this.oval(cx, cy, Math.max(1, Math.round(rx * .72)), Math.max(1, Math.round(ry * .7)), "rgba(0,0,0," + (a * .6).toFixed(3) + ")");
    return this;
  };
  Pen.prototype.glint = function(x, y, c) {
    c = c || "#ffffff";
    this.p(x, y, c);
    return this;
  };
  A.Pen = Pen;
  A.OUTLINE = {
    char: "#0a0a0c",
    enemy: "#121016"
  };
  const LUMA = (r, g, b) => .2126 * r + .7152 * g + .0722 * b;
  A.lineOf = function(hex) {
    const [r, g, b] = hexRgb(RP(hex)[0]), l = LUMA(r, g, b);
    if (l >= 13) return rgbHex(r, g, b);
    const k = 13 / Math.max(1, l);
    return rgbHex(r * k, g * k, b * k);
  };
  function outlineRole(c, o) {
    const ctx = c.getContext("2d"), W = c.width, H = c.height, N = W * H;
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < N; i++) {
      const j = i * 4, a = d[j + 3];
      if (a === 0 || a === 255) continue;
      if (d[j] <= 48 && d[j + 1] <= 48 && d[j + 2] <= 48) {
        if (a > 170) d[j + 3] = 170;
      } else d[j + 3] = a >= 128 ? 255 : 0;
    }
    const body = new Uint8Array(N);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let i = 0; i < N; i++) if (d[i * 4 + 3] === 255) {
      body[i] = 1;
      const x = i % W, y = i / W | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x1 < 0) {
      ctx.putImageData(img, 0, 0);
      return c;
    }
    const bottomY = y1 - Math.ceil((y1 - y0 + 1) * .25);
    const DX = [ 0, 1, 0, -1 ], DY = [ -1, 0, 1, 0 ];
    const isB = (x, y) => x >= 0 && y >= 0 && x < W && y < H && body[y * W + x] === 1;
    const L = i => LUMA(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
    const fixed = o.col ? hexRgb(o.col) : null;
    const matCol = new Map;
    const mat = (x, y) => {
      let bi = -1, bL = -1, mn = 999;
      for (let k = 0; k < 4; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (!isB(nx, ny)) continue;
        for (let s = 0; s < 3; s++) {
          const sx = nx + DX[k] * s, sy = ny + DY[k] * s;
          if (!isB(sx, sy)) break;
          const i = sy * W + sx, l = L(i);
          if (s === 0 && l < mn) mn = l;
          if (l > bL) {
            bL = l;
            bi = i;
          }
        }
      }
      if (bi < 0) return [ 13, 13, 15 ];
      const hx = rgbHex(d[bi * 4], d[bi * 4 + 1], d[bi * 4 + 2]), cap = .7 * mn + 4, key = hx + ":" + Math.round(cap);
      let v = matCol.get(key);
      if (!v) {
        const r0 = hexRgb(A.lineOf(hx)), l0 = LUMA(r0[0], r0[1], r0[2]), tl = Math.min(l0, cap), k = tl / Math.max(1, l0);
        v = [ r0[0] * k, r0[1] * k, r0[2] * k ];
        matCol.set(key, v);
      }
      return v;
    };
    const cand = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (body[i]) continue;
      for (let k = 0; k < 4; k++) if (isB(x + DX[k], y + DY[k])) {
        cand[i] = 1;
        break;
      }
    }
    const lines = [], notch = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (body[i]) {
        let m = 0, ok = true;
        for (let k = 0; k < 4; k++) {
          const nx = x + DX[k], ny = y + DY[k];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
            m |= 1 << k;
            if (!isB(x - DX[k], y - DY[k])) ok = false;
          }
        }
        if (m && ok) lines.push([ i, m ]);
        continue;
      }
      if (!cand[i]) continue;
      let m = 0, outside = false;
      for (let k = 0; k < 4; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (isB(nx, ny)) continue;
        m |= 1 << k;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !cand[ny * W + nx]) outside = true;
      }
      if (outside) lines.push([ i, m ]); else notch.push(i);
    }
    const isLine = new Uint8Array(N), le = new Float32Array(N);
    const fill = [];
    for (const i of notch) {
      const x = i % W, y = i / W | 0;
      let di = -1, dl = 1e9;
      for (let k = 0; k < 4; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (!isB(nx, ny)) continue;
        const n = ny * W + nx, l = L(n);
        if (l < dl) {
          dl = l;
          di = n;
        }
      }
      const lv = fixed || mat(x, y), l0 = LUMA(lv[0], lv[1], lv[2]);
      let cv = hexRgb(RP(rgbHex(d[di * 4], d[di * 4 + 1], d[di * 4 + 2]))[1]);
      const lc = LUMA(cv[0], cv[1], cv[2]), want = l0 + 12;
      if (lc < want) {
        const k = want / Math.max(1, lc);
        cv = [ Math.min(255, cv[0] * k), Math.min(255, cv[1] * k), Math.min(255, cv[2] * k) ];
      }
      fill.push([ i, cv ]);
    }
    for (const [i, cv] of fill) {
      const j = i * 4;
      d[j] = cv[0];
      d[j + 1] = cv[1];
      d[j + 2] = cv[2];
      d[j + 3] = 255;
      body[i] = 1;
    }
    for (const [i, m] of lines) {
      const x = i % W, y = i / W | 0, cv = fixed || mat(x, y), j = i * 4;
      d[j] = cv[0];
      d[j + 1] = cv[1];
      d[j + 2] = cv[2];
      d[j + 3] = 255;
      isLine[i] = 1;
      le[i] = LUMA(cv[0], cv[1], cv[2]);
    }
    if (!(fixed && LUMA(fixed[0], fixed[1], fixed[2]) >= 96)) for (const [i, m] of lines) {
      const x = i % W, y = i / W | 0, l0 = le[i];
      for (let k = 0; k < 4; k++) {
        if (!(m & 1 << k) || k === 2 && y >= bottomY) continue;
        const ax = x - DX[k], ay = y - DY[k], bx = ax - DX[k], by = ay - DY[k];
        if (!isB(ax, ay) || !isB(bx, by)) continue;
        const a = ay * W + ax, b = by * W + bx;
        if (isLine[a] || isLine[b]) continue;
        const l1 = L(a), l2 = L(b);
        if (l1 > l0 + 6 || l2 <= l1 + 24) continue;
        const t = Math.max(0, Math.min(.6, (l0 + 10 - l1) / (l2 - l1)));
        for (let q = 0; q < 3; q++) d[a * 4 + q] = Math.round(d[a * 4 + q] + (d[b * 4 + q] - d[a * 4 + q]) * t);
      }
    }
    {
      const d0 = d.slice();
      mergeNear(d, W, H, isLine);
      for (const [i, m] of lines) {
        const x = i % W, y = i / W | 0, l0 = le[i];
        for (let k = 0; k < 4; k++) {
          if (!(m & 1 << k) || k === 2 && y >= bottomY) continue;
          const ax = x - DX[k], ay = y - DY[k], bx = ax - DX[k], by = ay - DY[k];
          if (!isB(ax, ay) || !isB(bx, by)) continue;
          const a = ay * W + ax, b = by * W + bx;
          if (isLine[a] || isLine[b]) continue;
          if (L(a) <= l0 + 6 && L(b) > L(a) + 24) for (const q of [ a, b ]) for (let c = 0; c < 3; c++) d[q * 4 + c] = d0[q * 4 + c];
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  A.outline = function(c, o) {
    o = o || {};
    if ((o.col || o.mat) && !o.inset && o.bg == null && !o.sel && o.mode !== "in") return outlineRole(c, o);
    const ctx = c.getContext("2d"), W = c.width, H = c.height;
    const img = ctx.getImageData(0, 0, W, H), d = img.data, src = new Uint8ClampedArray(d);
    const TH = 190;
    if (o.inset) {
      const clr = i => {
        src[i] = src[i + 1] = src[i + 2] = src[i + 3] = 0;
        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
      };
      for (let x = 0; x < W; x++) {
        clr(x * 4);
        clr(((H - 1) * W + x) * 4);
      }
      for (let y = 0; y < H; y++) {
        clr(y * W * 4);
        clr((y * W + W - 1) * 4);
      }
    }
    const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] > TH;
    const base = o.col ? hexRgb(o.col) : [ 20, 20, 26 ];
    const k = o.k != null ? o.k : .28;
    const lum = (r, g, b) => .2126 * r + .7152 * g + .0722 * b;
    const bgL = o.bg ? lum(...hexRgb(o.bg)) : -1;
    const same = (a, b) => {
      const ma = (src[a] + src[a + 1] + src[a + 2]) / 3, mb = (src[b] + src[b + 1] + src[b + 2]) / 3, ax = src[a] - ma, ay = src[a + 1] - ma, az = src[a + 2] - ma, bx = src[b] - mb, by = src[b + 1] - mb, bz = src[b + 2] - mb, la = Math.hypot(ax, ay, az), lb = Math.hypot(bx, by, bz);
      if (la < 14 && lb < 14) return true;
      if (la < 14 || lb < 14) return false;
      return (ax * bx + ay * by + az * bz) / (la * lb) > .8;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (o.mode === "in") {
        if (src[i + 3] <= TH) continue;
        if (!(op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1))) {
          d[i] = src[i] * (o.k || .5);
          d[i + 1] = src[i + 1] * (o.k || .5);
          d[i + 2] = src[i + 2] * (o.k || .5);
        }
        continue;
      }
      if (src[i + 3] > TH) continue;
      let nb = -1;
      if (op(x, y - 1)) nb = ((y - 1) * W + x) * 4; else if (op(x - 1, y)) nb = (y * W + x - 1) * 4; else if (op(x + 1, y)) nb = (y * W + x + 1) * 4; else if (op(x, y + 1)) nb = ((y + 1) * W + x) * 4;
      if (nb < 0) continue;
      if (o.mat) {
        let nbHi = nb, hi = -1, lo = 1e9;
        for (const q of [ ((y - 1) * W + x) * 4, (y * W + x - 1) * 4, (y * W + x + 1) * 4, ((y + 1) * W + x) * 4 ]) {
          if (!(q === nb || q >= 0 && q < src.length && src[q + 3] > TH && Math.abs(q / 4 % W - x) <= 1)) continue;
          const ql = lum(src[q], src[q + 1], src[q + 2]);
          if (ql > hi) {
            hi = ql;
            nbHi = q;
          }
          if (ql < lo) lo = ql;
        }
        let br = src[nbHi], bg = src[nbHi + 1], bb = src[nbHi + 2], bl = hi;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const qx = x + dx, qy = y + dy;
          if (!op(qx, qy)) continue;
          const q = (qy * W + qx) * 4, ql = lum(src[q], src[q + 1], src[q + 2]);
          if (ql <= bl || ql > hi * 2 + 8 || !same(q, nbHi)) continue;
          br = src[q];
          bg = src[q + 1];
          bb = src[q + 2];
          bl = ql;
        }
        let r = br * .285 + 6.5, g = bg * .285 + 8, b = bb * .285 + 12;
        const ll = lum(r, g, b);
        if (ll > lo * .7 && ll > 0) {
          const f = lo * .7 / ll;
          r *= f;
          g *= f;
          b *= f;
        }
        if (bgL >= 0 && Math.abs(lum(r, g, b) - bgL) < 8) {
          r *= .7;
          g *= .7;
          b *= .7;
        }
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      } else if (o.sel) {
        d[i] = src[nb] * k + base[0] * (1 - k) * .4;
        d[i + 1] = src[nb + 1] * k + base[1] * (1 - k) * .4;
        d[i + 2] = src[nb + 2] * k + base[2] * (1 - k) * .4;
      } else {
        d[i] = base[0];
        d[i + 1] = base[1];
        d[i + 2] = base[2];
      }
      d[i + 3] = 255;
    }
    {
      const sk = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const j = i * 4;
        sk[i] = src[j + 3] <= TH || d[j] !== src[j] || d[j + 1] !== src[j + 1] || d[j + 2] !== src[j + 2] ? 1 : 0;
      }
      mergeNear(d, W, H, sk);
    }
    ctx.putImageData(img, 0, 0);
    return c;
  };
  const cache = A.keyMap(new Map);
  A.clearCache = () => cache.clear();
  A.cached = function(key, w, h, fn, post) {
    let c = cache.get(key);
    if (!c) {
      c = mk(w, h);
      const P = new Pen(post ? c.getContext("2d", {
        willReadFrequently: true
      }) : c.getContext("2d"));
      fn(P, c);
      if (post) A.outline(c, post === true ? {
        sel: true
      } : post);
      cache.set(key, c);
    }
    return c;
  };
  const cached = A.cached;
  A.flipX = function(src) {
    const c = mk(src.width, src.height), x = c.getContext("2d");
    x.translate(src.width, 0);
    x.scale(-1, 1);
    x.drawImage(src, 0, 0);
    return c;
  };
  const UP8 = new Map;
  function up8(c, keep) {
    let r = keep ? UP8.get(c) : null;
    if (r) return r;
    let w = c.width, h = c.height, s = new Uint32Array(c.getContext("2d").getImageData(0, 0, w, h).data.buffer);
    for (let it = 0; it < 3; it++) {
      const w2 = w * 2, o = new Uint32Array(w2 * h * 2);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const E = s[y * w + x], B = y > 0 ? s[(y - 1) * w + x] : E, Hh = y < h - 1 ? s[(y + 1) * w + x] : E, D = x > 0 ? s[y * w + x - 1] : E, F = x < w - 1 ? s[y * w + x + 1] : E;
        let e0 = E, e1 = E, e2 = E, e3 = E;
        if (B !== Hh && D !== F) {
          if (D === B) e0 = D;
          if (B === F) e1 = F;
          if (D === Hh) e2 = D;
          if (Hh === F) e3 = F;
        }
        const j = y * 2 * w2 + x * 2;
        o[j] = e0;
        o[j + 1] = e1;
        o[j + w2] = e2;
        o[j + w2 + 1] = e3;
      }
      s = o;
      w = w2;
      h *= 2;
    }
    r = {
      s,
      w,
      h
    };
    if (keep) {
      UP8.set(c, r);
      if (UP8.size > 24) UP8.delete(UP8.keys().next().value);
    }
    return r;
  }
  const ROTC = new WeakMap, RST = Math.PI / 64;
  A.rotDot = function(c, ang, fl, pX, pY, once) {
    fl = fl | 0;
    if (pX == null) {
      pX = c.width >> 1;
      pY = c.height >> 1;
    }
    const qi = (Math.round(ang / RST) % 128 + 128) % 128, key = qi + ":" + fl + ":" + pX + ":" + pY;
    let m = once ? null : ROTC.get(c), r = m && m.get(key);
    if (r) return r;
    const W = c.width, H = c.height, right = qi % 32 === 0, a = qi * RST, ca = right ? [ 1, 0, -1, 0 ][qi >> 5] : Math.cos(a), sa = right ? [ 0, 1, 0, -1 ][qi >> 5] : Math.sin(a);
    const fx = fl === 2 ? -1 : 1, fy = fl === 1 ? -1 : 1;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [u, v] of [ [ -pX, -pY ], [ W - pX, -pY ], [ -pX, H - pY ], [ W - pX, H - pY ] ]) {
      const lx = u * fx, ly = v * fy, X = lx * ca - ly * sa, Y = lx * sa + ly * ca;
      if (X < x0) x0 = X;
      if (X > x1) x1 = X;
      if (Y < y0) y0 = Y;
      if (Y > y1) y1 = Y;
    }
    const ox = Math.floor(x0 + 1e-6), oy = Math.floor(y0 + 1e-6), w = Math.max(1, Math.ceil(x1 - 1e-6) - ox), h = Math.max(1, Math.ceil(y1 - 1e-6) - oy);
    const o = mk(w, h), g = o.getContext("2d"), im = g.createImageData(w, h), out = new Uint32Array(im.data.buffer);
    const S = right ? {
      s: new Uint32Array(c.getContext("2d").getImageData(0, 0, W, H).data.buffer),
      w: W,
      h: H
    } : up8(c, !once), k = right ? 1 : 8;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = ox + i + .5, Y = oy + j + .5, u = Math.floor(((X * ca + Y * sa) * fx + pX) * k), v = Math.floor(((-X * sa + Y * ca) * fy + pY) * k);
      if (u >= 0 && v >= 0 && u < S.w && v < S.h) out[j * w + i] = S.s[v * S.w + u];
    }
    g.putImageData(im, 0, 0);
    r = {
      c: o,
      ox,
      oy
    };
    if (!once) {
      if (!m) {
        m = new Map;
        ROTC.set(c, m);
      }
      if (m.size > 260) m.clear();
      m.set(key, r);
    }
    return r;
  };
  A.shrinkDot = function(src, w, h) {
    const W = src.width, H = src.height, s = new Uint32Array(src.getContext("2d").getImageData(0, 0, W, H).data.buffer);
    w = Math.max(1, Math.min(W, w | 0));
    h = Math.max(1, Math.min(H, h | 0));
    const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && s[y * W + x] >>> 24 >= 128;
    const cell = new Array(w * h).fill(null);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u0 = Math.floor(i * W / w), u1 = Math.max(u0 + 1, Math.floor((i + 1) * W / w)), v0 = Math.floor(j * H / h), v1 = Math.max(v0 + 1, Math.floor((j + 1) * H / h));
      let n = 0, nO = 0;
      const mE = new Map, mI = new Map;
      for (let v = v0; v < v1; v++) for (let u = u0; u < u1; u++) {
        n++;
        if (!op(u, v)) continue;
        nO++;
        const q = s[v * W + u], M = op(u - 1, v) && op(u + 1, v) && op(u, v - 1) && op(u, v + 1) ? mI : mE;
        M.set(q, (M.get(q) || 0) + 1);
      }
      if (nO * 2 >= n) cell[j * w + i] = [ mE, mI ];
    }
    const o = mk(w, h), g = o.getContext("2d"), im = g.createImageData(w, h), out = new Uint32Array(im.data.buffer);
    const top = M => {
      let b = 0, bn = 0;
      for (const [q, n] of M) if (n > bn) {
        bn = n;
        b = q;
      }
      return bn ? b : null;
    };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const C = cell[j * w + i];
      if (!C) continue;
      const ed = i === 0 || j === 0 || i === w - 1 || j === h - 1 || !cell[j * w + i - 1] || !cell[j * w + i + 1] || !cell[(j - 1) * w + i] || !cell[(j + 1) * w + i];
      const p0 = top(C[ed ? 0 : 1]), q = p0 != null ? p0 : top(C[ed ? 1 : 0]);
      if (q != null) out[j * w + i] = q;
    }
    g.putImageData(im, 0, 0);
    return o;
  };
  function mergeNear(d, W, H, skip) {
    const N = W * H, col = i => d[i * 4 + 3] === 255 && !(skip && skip[i]) ? d[i * 4] << 16 | d[i * 4 + 1] << 8 | d[i * 4 + 2] : -1;
    const near = (a, b) => {
      const ar = a >> 16, ag = a >> 8 & 255, ab = a & 255, br = b >> 16, bg = b >> 8 & 255, bb = b & 255;
      return Math.abs(LUMA(ar, ag, ab) - LUMA(br, bg, bb)) < 3 && Math.abs(ar - br) < 6 && Math.abs(ag - bg) < 6 && Math.abs(ab - bb) < 6;
    };
    for (let pass = 0; pass < 2; pass++) {
      const cnt = new Map;
      for (let i = 0; i < N; i++) {
        const a = col(i);
        if (a >= 0) cnt.set(a, (cnt.get(a) || 0) + 1);
      }
      if (cnt.size < 2) return;
      const seen = new Set, pr = [];
      const look = (a, b) => {
        if (b < 0 || b === a) return;
        const key = a < b ? a * 16777216 + b : b * 16777216 + a;
        if (seen.has(key)) return;
        seen.add(key);
        if (near(a, b)) pr.push(cnt.get(a) >= cnt.get(b) ? [ a, b ] : [ b, a ]);
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const a = col(y * W + x);
        if (a < 0) continue;
        if (x + 1 < W) look(a, col(y * W + x + 1));
        if (y + 1 < H) look(a, col((y + 1) * W + x));
      }
      if (!pr.length) return;
      pr.sort((p, q) => cnt.get(q[0]) - cnt.get(p[0]));
      const to = new Map, tgt = new Set;
      for (const [big, sm] of pr) {
        if (to.has(sm) || to.has(big) || tgt.has(sm)) continue;
        to.set(sm, big);
        tgt.add(big);
      }
      for (let i = 0; i < N; i++) {
        const a = col(i), b = a >= 0 ? to.get(a) : undefined;
        if (b == null) continue;
        d[i * 4] = b >> 16;
        d[i * 4 + 1] = b >> 8 & 255;
        d[i * 4 + 2] = b & 255;
      }
    }
  }
  A.mergeNear = mergeNear;
  const BIGC = new WeakMap;
  A.charBig = function(spr, sc) {
    let m = BIGC.get(spr);
    if (!m) {
      m = new Map;
      BIGC.set(spr, m);
    }
    let r = m.get(sc);
    if (r) return r;
    const W = spr.width, H = spr.height, d = spr.getContext("2d").getImageData(0, 0, W, H).data;
    const full = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] === 255, cnt = new Map, edge = [];
    let line = -1, ln = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!full(x, y) || full(x - 1, y) && full(x + 1, y) && full(x, y - 1) && full(x, y + 1)) continue;
      const i = (y * W + x) * 4, q = d[i] << 16 | d[i + 1] << 8 | d[i + 2], n = (cnt.get(q) || 0) + 1;
      cnt.set(q, n);
      edge.push([ i, q ]);
      if (n > ln) {
        ln = n;
        line = q;
      }
    }
    const body = mk(W, H), bg = body.getContext("2d", {
      willReadFrequently: true
    }), bi = bg.createImageData(W, H);
    bi.data.set(d);
    for (const [i, q] of edge) if (q === line) bi.data[i + 3] = 0;
    bg.putImageData(bi, 0, 0);
    const U = up8(body, false), OX = A.CHAR_OX, OY = A.CHAR_OY, ox = Math.round(OX * sc) + 1, oy = Math.round(OY * sc) + 1, w = Math.ceil(W * sc) + 2, h = Math.ceil(H * sc) + 2;
    const c = mk(w, h), g = c.getContext("2d", {
      willReadFrequently: true
    }), im = g.createImageData(w, h), out = new Uint32Array(im.data.buffer);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = Math.floor(((i + .5 - ox) / sc + OX) * 8), v = Math.floor(((j + .5 - oy) / sc + OY) * 8);
      if (u >= 0 && v >= 0 && u < U.w && v < U.h) out[j * w + i] = U.s[v * U.w + u];
    }
    g.putImageData(im, 0, 0);
    if (line >= 0) A.outline(c, {
      col: rgbHex(line >> 16, line >> 8 & 255, line & 255)
    });
    r = {
      c,
      ox,
      oy
    };
    m.set(sc, r);
    return r;
  };
  const FS = A.FS = {
    VOID: 0,
    CONC: 1,
    CARPET: 2,
    TILE: 3,
    HOSP: 4,
    WOOD: 5,
    CHECK: 6,
    LINO: 7,
    STAIR: 8,
    ASPH: 9,
    WALK: 10,
    GRASS: 11,
    ROOF: 12,
    DIRT: 13,
    LOBBY: 14,
    CROSS: 15,
    LANE: 16,
    PARQ: 17,
    MARBLE: 18,
    WATER: 19,
    RAIL: 20,
    RAILH: 21
  };
  function slab(P, x, y, w, h, c) {
    const R = RP(c);
    P.r(x, y, w, h, c).r(x, y, w, 1, R[4]).r(x, y, 1, h, R[4]).r(x, y + h - 1, w, 1, R[2]).r(x + w - 1, y, 1, h, R[2]);
  }
  function crack(P, g, x, y, n, c) {
    for (let k = 0; k < n; k++) {
      P.p(x, y, c);
      if (g.chance(.5)) x += g.i(3) - 1;
      y += 1;
      if (g.chance(.3)) x += g.chance(.5) ? 1 : -1;
    }
  }
  A.floorTile = function(ctx, style, px, py, seed, tx, ty, tint) {
    const P = new Pen(ctx), g = new SX.Rng(seed);
    const T = TS;
    switch (style) {
     case FS.VOID:
      P.r(px, py, T, T, C.black);
      break;

     case FS.WATER:
      {
        {
          const b = tint || "#1c2733", q = hexRgb(b), o = d => rgbHex(q[0] + d[0], q[1] + d[1], q[2] + d[2]);
          P.r(px, py, T, T, b).noise(px, py, T, T, [ o([ -4, -6, -10 ]), o([ 6, 9, 10 ]) ], .22, g);
        }
        for (let k = 0; k < 4; k++) {
          const x = px + g.i(T - 10), y = py + 3 + g.i(T - 6);
          P.r(x, y, 5 + g.i(6), 1, "#2e4252").p(x + 2, y - 1, "#3a5266");
        }
        if (g.chance(.05)) P.r(px + g.i(T - 6), py + g.i(T - 3), 6, 2, "#4a4a40");
        break;
      }

     case FS.RAIL:
      {
        P.r(px, py, T, T, "#3a3836").noise(px, py, T, T, [ "#2c2a28", "#4a4744", "#55524d" ], .35, g);
        for (let y = 2; y < T; y += 11) {
          P.r(px, py + y, T, 5, "#4a3a2c").r(px, py + y, T, 1, "#5e4a38").r(px, py + y + 4, T, 1, "#2a2018");
          for (let k = 0; k < 3; k++) P.p(px + g.i(T), py + y + 1 + g.i(3), "#3a2c20");
        }
        const col = (tx % 3 + 3) % 3;
        const rail = x => P.r(px + x, py, 3, T, "#6a6c70").r(px + x, py, 1, T, "#a8aab0").r(px + x + 2, py, 1, T, "#3a3c40");
        if (col === 0) rail(26); else if (col === 2) rail(3);
        if (g.chance(.08)) P.oval(px + 8 + g.i(16), py + 8 + g.i(16), 4, 2, "rgba(10,20,30,0.35)");
        break;
      }

     case FS.RAILH:
      {
        P.r(px, py, T, T, "#2e2c2a").noise(px, py, T, T, [ "#24221f", "#45423d", "#55524c" ], .4, g);
        const row = (ty % 3 + 2) % 3, sy0 = row === 0 ? 18 : 0, sy1 = row === 2 ? 14 : T;
        for (let x = 5; x < T; x += 16) {
          P.r(px + x, py + sy0, 6, sy1 - sy0, "#5e5b56").r(px + x, py + sy0, 1, sy1 - sy0, "#77736c").r(px + x + 5, py + sy0, 1, sy1 - sy0, "#3a3834");
          if (g.chance(.5)) P.p(px + x + 2 + g.i(2), py + sy0 + g.i(sy1 - sy0), "#4a4742");
        }
        const railH = y => P.r(px, py + y + 3, T, 1, "rgba(0,0,0,0.45)").r(px, py + y, T, 3, "#7a7c80").r(px, py + y, T, 1, "#c8cad0").r(px, py + y + 2, T, 1, "#2a2c30");
        if (row === 0) railH(25); else if (row === 2) railH(4);
        if (g.chance(.08)) P.oval(px + 8 + g.i(16), py + 8 + g.i(16), 4, 2, "rgba(10,20,30,0.35)");
        if (g.chance(.08)) {
          const jx = px + 3 + g.i(22), jy = py + 8 + g.i(14), k = g.i(3);
          if (k === 0) P.r(jx, jy, 5, 3, "#b8b4a4").r(jx, jy + 2, 5, 1, "#8a8678"); else if (k === 1) P.r(jx, jy, 5, 3, "#a83a2a").r(jx, jy, 5, 1, "#c85a4a").r(jx + 4, jy, 1, 3, "#9aa0a6"); else P.oval(jx + 3, jy + 1, 4, 2, "rgba(120,64,30,0.35)");
        }
        break;
      }

     case FS.CONC:
      {
        const b = tint || C.conc, R = RP(b);
        P.r(px, py, T, T, b).noise(px, py, T, T, [ R[2], R[4], sh(b, -.06) ], .1, g);
        if (g.chance(.18)) P.oval(px + 6 + g.i(20), py + 6 + g.i(20), 3 + g.i(5), 2 + g.i(3), "rgba(0,0,0,0.06)");
        if (tx % 3 === 0) P.r(px, py, 1, T, R[2]);
        if (ty % 3 === 0) P.r(px, py, T, 1, R[2]).r(px, py + 1, T, 1, "rgba(255,255,255,0.03)");
        if (g.chance(.07)) crack(P, g, px + g.i(T), py + g.i(8), 14 + g.i(10), R[1]);
        break;
      }

     case FS.LOBBY:
     case FS.MARBLE:
      {
        const b = tint || (style === FS.MARBLE ? "#8c8a86" : "#65645f"), R = RP(b);
        const ox = (tx & 1) * T, oy = (ty & 1) * T;
        P.r(px, py, T, T, (tx >> 1) + (ty >> 1) & 1 ? b : sh(b, -.05));
        P.noise(px, py, T, T, [ R[2], R[4] ], .05, g);
        if (style === FS.MARBLE) for (let k = 0; k < 3; k++) {
          let x = px + g.i(T), y = py + g.i(T);
          for (let s = 0; s < 10; s++) {
            P.p(x, y, R[4]);
            x += g.chance(.6) ? 1 : 0;
            y += g.chance(.5) ? 1 : 0;
          }
        }
        if (ox === 0) P.r(px, py, 1, T, R[4]);
        if (oy === 0) P.r(px, py, T, 1, R[4]);
        if (ox === T) P.r(px + T - 1, py, 1, T, R[2]);
        if (oy === T) P.r(px, py + T - 1, T, 1, R[2]);
        if ((tx + ty * 3) % 5 === 0) P.r(px + 4, py + 4, 10, 1, "rgba(255,255,255,0.05)");
        break;
      }

     case FS.CARPET:
      {
        const b = tint || C.carpet, R = RP(b);
        P.r(px, py, T, T, b).noise(px, py, T, T, [ R[2], R[4], sh(b, -.08) ], .32, g);
        for (let k = 0; k < 4; k++) {
          const x = px + (tx * 32 + k * 8) % 32, y = py + (ty * 16 + k * 8) % 32;
          if ((tx + ty + k & 3) === 0) {
            P.p(x, y, R[4]).p(x + 1, y + 1, R[4]).p(x - 1, y + 1, R[4]).p(x, y + 2, R[4]);
          }
        }
        if (g.chance(.05)) P.oval(px + 8 + g.i(16), py + 8 + g.i(16), 4, 2, "rgba(0,0,0,0.1)");
        break;
      }

     case FS.TILE:
     case FS.HOSP:
      {
        const a = tint || (style === FS.TILE ? C.tile : C.hosp), gr = style === FS.TILE ? C.grout : C.hgrout;
        P.r(px, py, T, T, gr);
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
          const c = g.chance(.12) ? sh(a, -.05) : a;
          slab(P, px + i * 16 + 1, py + j * 16 + 1, 15, 15, c);
          if (g.chance(.06)) P.r(px + i * 16 + 3 + g.i(8), py + j * 16 + 3 + g.i(8), 3, 2, sh(c, -.15));
        }
        if (g.chance(.05)) crack(P, g, px + g.i(T), py + g.i(10), 10, sh(a, -.35));
        break;
      }

     case FS.WOOD:
     case FS.PARQ:
      {
        const b = tint || C.wood, R = RP(b);
        if (style === FS.PARQ) {
          for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
            const v = i + j + tx + ty & 1;
            const c = v ? b : sh(b, -.08);
            P.r(px + i * 8, py + j * 8, 8, 8, c);
            if (v) P.r(px + i * 8, py + j * 8 + 3, 8, 1, R[2]); else P.r(px + i * 8 + 3, py + j * 8, 1, 8, R[2]);
            P.r(px + i * 8, py + j * 8, 8, 1, R[4]);
          }
          break;
        }
        for (let k = 0; k < 4; k++) {
          const y = py + k * 8, row = ty * 4 + k, tone = [ 0, -.05, .04, -.09 ][SX.hash("w" + row) % 4];
          const c = tone ? sh(b, tone) : b;
          P.r(px, y, T, 8, c).r(px, y, T, 1, RP(c)[4]).r(px, y + 7, T, 1, R[1]);
          const L = 96, off = SX.hash("o" + row) % L;
          for (let x = 0; x < T; x++) {
            const wx = tx * T + x;
            if ((wx + off) % L === 0) P.r(px + x, y, 1, 8, R[1]).r(px + x + 1, y, 1, 7, RP(c)[4]);
          }
          for (let s = 0; s < 3; s++) P.r(px + g.i(T - 6), y + 2 + g.i(4), 4 + g.i(8), 1, R[2]);
          if (g.chance(.05)) P.oval(px + 4 + g.i(24), y + 4, 1, 1, R[1]);
        }
        break;
      }

     case FS.CHECK:
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) slab(P, px + i * 16, py + j * 16, 16, 16, i + j & 1 ? C.chk2 : C.chk1);
      P.noise(px, py, T, T, [ "#77736a", "#5c5850" ], .03, g);
      break;

     case FS.LINO:
      {
        const b = tint || C.lino, R = RP(b);
        P.r(px, py, T, T, b).noise(px, py, T, T, [ R[2], R[4] ], .12, g);
        if (tx % 2 === 0) P.r(px, py, 1, T, R[2]);
        if (ty % 2 === 0) P.r(px, py, T, 1, R[2]);
        P.r(px + 3, py + 5, 20, 1, "rgba(255,255,255,0.05)");
        if (g.chance(.1)) P.r(px + g.i(20), py + g.i(28), 6 + g.i(6), 1, R[1]);
        break;
      }

     case FS.STAIR:
      {
        const R = RP("#56585d");
        for (let k = 0; k < 4; k++) {
          const y = py + k * 8;
          P.r(px, y, T, 5, R[4]).r(px, y, T, 1, R[5]).r(px, y + 5, T, 3, R[1]).r(px, y + 7, T, 1, R[0]);
          P.noise(px, y + 1, T, 4, [ R[3] ], .12, g);
          if (tx % 4 === 0) P.r(px, y, 2, 8, R[2]);
        }
        break;
      }

     case FS.ASPH:
     case FS.LANE:
     case FS.CROSS:
      {
        const R = RP(C.asph);
        P.r(px, py, T, T, C.asph).noise(px, py, T, T, [ C.asph2, C.asph3, R[1] ], .26, g).noise(px, py, T, T, [ "#55575c" ], .02, g);
        if (g.chance(.05)) {
          const x = px + g.i(18), y = py + g.i(20);
          P.r(x, y, 8 + g.i(8), 5 + g.i(4), R[1]).r(x, y, 8, 1, C.asph3);
        }
        if (g.chance(.05)) crack(P, g, px + g.i(T), py + g.i(8), 18, R[0]);
        if (g.chance(.03)) P.oval(px + 8 + g.i(16), py + 8 + g.i(16), 5, 3, "rgba(20,10,30,0.25)");
        if (style === FS.LANE && tx % 4 < 2) {
          P.r(px, py + 14, T, 4, C.lane).r(px, py + 14, T, 1, sh(C.lane, .2));
          for (let k = 0; k < 10; k++) P.p(px + g.i(T), py + 14 + g.i(4), C.asph3);
        }
        if (style === FS.CROSS) for (let k = 0; k < 32; k += 8) {
          P.r(px + k, py, 5, T, "#c5c1b5").r(px + k, py, 1, T, "#dcd8cc");
          for (let s = 0; s < 8; s++) P.p(px + k + g.i(5), py + g.i(T), C.asph3);
        }
        break;
      }

     case FS.WALK:
      {
        const b = C.walk;
        P.r(px, py, T, T, C.walk2);
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
          const c = g.chance(.2) ? sh(b, -.06) : b;
          slab(P, px + i * 16, py + j * 16, 16, 16, c);
        }
        P.noise(px, py, T, T, [ C.walk3, C.walk2 ], .05, g);
        if (tx % 6 === 0) {
          P.r(px + 8, py, 16, T, "#b59a3a").r(px + 8, py, 1, T, "#cdb14a").r(px + 23, py, 1, T, "#8a7428");
          for (let y = 2; y < T; y += 5) for (let x = 10; x < 23; x += 5) P.r(px + x, py + y, 2, 2, "#d6ba50").p(px + x + 1, py + y + 1, "#8a7428");
        }
        break;
      }

     case FS.GRASS:
      {
        P.r(px, py, T, T, C.grass).noise(px, py, T, T, [ C.grass2, C.grass3 ], .3, g);
        for (let k = 0; k < 16; k++) {
          const x = px + g.i(T - 1), y = py + 2 + g.i(T - 4), h = 2 + g.i(3);
          P.r(x, y, 1, h, g.pick([ "#6a7a45", "#5d6e3c", "#7b8a50" ])).p(x, y + h, C.grass3);
        }
        if (g.chance(.1)) P.p(px + g.i(T), py + g.i(T), g.pick([ "#d8d0a0", "#c8a0c0" ]));
        break;
      }

     case FS.DIRT:
      {
        P.r(px, py, T, T, C.dirt).noise(px, py, T, T, [ C.dirt2, "#63503d" ], .28, g);
        for (let k = 0; k < 5; k++) {
          const x = px + g.i(T - 2), y = py + g.i(T - 2);
          P.r(x, y, 2, 2, "#6e5e4c").p(x, y, "#86755f").p(x + 1, y + 1, "#3e3024");
        }
        break;
      }

     case FS.ROOF:
      {
        const R = RP(C.roof);
        P.r(px, py, T, T, C.roof).noise(px, py, T, T, [ C.roof2, "#62645f", R[1] ], .22, g);
        if (tx % 4 === 0) P.r(px, py, 2, T, R[2]).r(px + 2, py, 1, T, R[4]);
        if (g.chance(.06)) P.oval(px + 16, py + 16, 5 + g.i(6), 3 + g.i(2), C.tar);
        if (g.chance(.02)) {
          P.r(px + 10, py + 10, 12, 12, "#2a2c2a");
          for (let k = 0; k < 12; k += 3) P.r(px + 11 + k, py + 11, 1, 10, "#4a4c49");
        }
        break;
      }

     default:
      P.r(px, py, T, T, "#f0f");
    }
  };
  const FPER = {
    20: [ 3, 1 ],
    21: [ 1, 3 ],
    1: [ 3, 3 ],
    14: [ 4, 4 ],
    18: [ 4, 4 ],
    2: [ 4, 4 ],
    5: [ 3, 8 ],
    17: [ 2, 2 ],
    7: [ 2, 2 ],
    8: [ 4, 1 ],
    16: [ 4, 1 ],
    10: [ 6, 1 ],
    12: [ 4, 1 ]
  };
  const fcache = A.keyMap(new Map, "floor:");
  A.floorCached = function(style, tx, ty, seed, tint) {
    const per = FPER[style] || [ 1, 1 ], cx = (tx % per[0] + per[0]) % per[0], cy = (ty % per[1] + per[1]) % per[1], v = (seed >>> 0) % 8;
    const key = style + ":" + (tint || "") + ":" + cx + ":" + cy + ":" + v;
    let c = fcache.get(key);
    if (!c) {
      c = mk(TS, TS);
      A.floorTile(c.getContext("2d"), style, 0, 0, v * 7919 + 13, cx, cy, tint);
      fcache.set(key, c);
    }
    return c;
  };
  A.WALL_H = 24;
  A.winGeo = H => H > 24 ? {
    y: 9,
    h: 25
  } : {
    y: 3,
    h: 15
  };
  A.winBroke = function(fh) {
    const H = fh || A.WALL_H;
    return cached("wbk:" + H, TS, H, P => {
      const G = A.winGeo(H), y0 = G.y + 1, y1 = G.y + G.h - 1, hh = y1 - y0, g = new SX.Rng(9137 + H);
      const top = Math.max(2, Math.round(hh * .42)), bot = Math.max(2, Math.round(hh * .36));
      let a = Math.round(hh * .22), b = Math.round(hh * .2);
      for (let x = 4; x < 28; x++) {
        if (x === 15 || x === 16) continue;
        a = Math.max(1, Math.min(top, a + g.i(5) - 2));
        b = Math.max(1, Math.min(bot, b + g.i(5) - 2));
        const edge = x === 4 || x === 27 || x === 14 || x === 17 ? 1 : 0, t = y0 + a + edge, e = y1 - b - edge;
        if (e - t < 2) continue;
        P.r(x, t, 1, e - t, "#0f141c");
        P.p(x, t, "#d8eef4").p(x, e - 1, "#d8eef4");
        if (g.f() < .4) for (let y = t + 1 + g.i(3); y < e - 1; y += 3) P.p(x, y, "#3a4a5c");
      }
    });
  };
  A.wallCap = function(kind, m, col) {
    col = col || (kind === 1 ? "#6d6f6b" : C.capTop);
    return cached("cap" + kind + ":" + m + col, TS, TS, P => {
      const R = RP(col), g = new SX.Rng(m * 31 + kind);
      P.r(0, 0, TS, TS, col);
      P.noise(0, 0, TS, TS, [ R[2], R[4] ], kind === 1 ? .12 : .05, g);
      if (!(m & 1)) P.r(0, 0, TS, 2, R[4]).r(0, 0, TS, 1, R[5]);
      if (!(m & 8)) P.r(0, 0, 2, TS, R[4]).r(0, 0, 1, TS, R[5]);
      if (!(m & 2)) P.r(TS - 2, 0, 2, TS, R[1]).r(TS - 1, 0, 1, TS, R[0]);
      if (!(m & 4)) P.r(0, TS - 1, TS, 1, R[5]);
      if (m & 1 && m & 8) P.p(0, 0, R[3]);
      if (kind === 1 && !(m & 4)) P.r(0, TS - 3, TS, 2, R[2]);
    });
  };
  A.wallFront = function(kind, wx, ends, col, deco, fh) {
    col = col || C.wallF;
    const H = kind === 2 ? 10 : fh || A.WALL_H;
    const ph = (wx % 4 + 4) % 4;
    return cached("wf" + kind + ":" + ph + ":" + (ends | 0) + col + ":" + (deco | 0) + (kind !== 2 && H !== A.WALL_H ? ":h" + H : ""), TS, H, P => {
      const R = RP(col);
      if (kind === 2) {
        P.block(0, 0, TS, 3, 7, "#5d5f5b");
        if (ends & 1) P.r(0, 0, 2, 10, "#7a7c77");
        if (ends & 2) P.r(TS - 2, 0, 2, 10, "#3e403c");
        return;
      }
      P.r(0, 0, TS, H, col);
      for (let x = 0; x < TS; x++) {
        const gx = ph * TS + x, h1 = SX.hash("s" + gx) % 97;
        if (h1 < 14) P.r(x, 3, 1, 3 + h1 % 9, R[2]);
        if (h1 > 90) P.r(x, 2, 1, 12, sh(col, -.1));
        const n = SX.hash("n" + gx) % 13;
        if (n < 3) P.p(x, 6 + n * 5 % 12, R[4]); else if (n < 5) P.p(x, 8 + n * 3 % 10, R[2]);
        for (let oy = 22; oy < H - 12; oy += 22) {
          const n2 = SX.hash("n" + oy + ":" + gx) % 13;
          if (n2 < 3) P.p(x, oy + 6 + n2 * 5 % 12, R[4]); else if (n2 < 5) P.p(x, oy + 8 + n2 * 3 % 10, R[2]);
        }
      }
      P.r(0, 0, TS, 2, R[1]).r(0, 2, TS, 1, R[2]);
      P.r(0, H - 5, TS, 5, C.wallBase).r(0, H - 5, TS, 1, sh(C.wallBase, .25)).r(0, H - 1, TS, 1, sh(C.wallBase, -.4));
      if (ends & 1) P.r(0, 0, 2, H, R[4]).r(0, 0, 1, H, R[5]);
      if (ends & 2) P.r(TS - 2, 0, 2, H, R[1]).r(TS - 1, 0, 1, H, R[0]);
      if (kind === 0 && deco === 1) {
        P.r(9, 4, 12, 11, "#c9c3b0").r(9, 4, 12, 1, "#e0dccb").r(20, 5, 1, 10, "#a39c86").r(11, 6, 8, 1, "#9a3a30").r(11, 8, 6, 1, "#6a6458").r(11, 10, 7, 1, "#6a6458").r(11, 12, 5, 1, "#6a6458");
      } else if (kind === 0 && deco === 2) {
        P.line(6, 14, 12, 8, "#b8322e").line(12, 8, 16, 14, "#b8322e").line(18, 9, 26, 9, "#3a70c0").line(22, 9, 22, 15, "#3a70c0");
      } else if (kind === 0 && deco === 3) {
        let x = 20, y = 3;
        for (let k = 0; k < 14; k++) {
          P.p(x, y, R[0]);
          x += k % 3 === 0 ? -1 : 0;
          y++;
        }
      } else if (kind === 0 && deco === 5 && A.PP) {
        const a = SX.adOf ? SX.adOf("poster") : {
          brand: "광고",
          sub: "AD",
          bg: "#f2d034",
          fg: "#1c1c1c",
          acc: "#d8402a"
        };
        P.r(5, 0, 22, 20, "#2a2c30").r(6, 1, 20, 18, a.bg).r(6, 18, 20, 1, a.acc);
        A.PP.label(P, 6, 3, a.brand, a.fg, 9, 20);
        A.PP.mini(P, 6, 13, a.sub, a.acc, 20);
        P.p(25, 1, "#e8e4d8").p(6, 1, "#e8e4d8");
      } else if (kind === 0 && deco === 4) {
        P.r(12, 6, 8, 5, "#2a2c30").r(13, 7, 6, 3, "#d8e6d0").p(14, 8, "#5fbf6a");
      }
      if (kind === 1) {
        const G = A.winGeo(H), y = G.y, h = G.h, b = y + h - 3;
        P.r(3, y, 26, h, "#2a2c30").r(4, y + 1, 24, h - 2, C.glassDk);
        P.r(4, y + 1, 24, h - 2, C.glass).r(4, y + 1, 24, 2, C.glass2).r(15, y + 1, 2, h - 2, "#2a2c30");
        P.line(6, b, 12, y + 3, C.glass2).line(8, b, 13, y + 5, "#b8dce6").line(19, b, 24, y + 5, C.glass2);
        P.r(3, y + h - 1, 26, 2, R[4]).r(3, y + h, 26, 1, R[1]);
      }
      if (kind === 3 || kind === 6) {
        P.r(3, 0, 26, H, "#16171a").r(3, 0, 2, H, "#2a2c30").r(27, 0, 2, H, "#0e0f11").r(5, 0, 22, 3, "#0a0a0c");
        if (kind === 6) {
          P.r(6, 2, 20, 4, "#2f6f35").r(7, 3, 4, 2, "#e6f0e0").r(13, 3, 3, 2, "#e6f0e0").r(18, 3, 6, 2, "#e6f0e0");
        }
      }
      if (kind === 4 || kind === 5) {
        const D = RP(C.door);
        const jl = ends & 32, jr = ends & 16, fx0 = jl ? 0 : 2, fx1 = jr ? TS : 30, bx0 = jl ? 1 : 4, bx1 = jr ? TS - 1 : 28;
        P.r(fx0, 0, fx1 - fx0, H, "#2a2c30").r(bx0, 0, bx1 - bx0, H, D[3]).r(bx0, 0, 2, H, D[4]).r(bx1 - 2, 0, 2, H, D[1]);
        const u1 = H > 24 ? Math.round(H * .42) : 10, l0 = H > 24 ? u1 + 3 : 12, l1 = H - 3, dy = H - 24 >> 1;
        P.r(7, 3, 18, u1 - 3, D[2]).r(7, 3, 18, 1, D[1]).r(7, u1 - 1, 18, 1, D[4]).r(7, l0, 18, l1 - l0, D[2]).r(7, l0, 18, 1, D[1]).r(7, l1 - 1, 18, 1, D[4]);
        if (!(ends & 8)) {
          const kx = ends & 4 ? 7 : 22;
          P.r(kx, u1 + 1, 3, 2, C.knob).p(ends & 4 ? kx + 2 : kx, u1 + 1, "#fff0a0");
        }
        if (kind === 5) {
          P.thick(3, 5 + dy, 28, 18 + dy, 2, C.chain).thick(3, 18 + dy, 28, 5 + dy, 2, C.chain);
          P.r(12, 9 + dy, 8, 8, "#2a2c30").r(13, 10 + dy, 6, 6, C.lockRed).r(13, 10 + dy, 6, 1, "#e06060").r(15, 12 + dy, 2, 3, "#2a2c30");
        }
      }
    });
  };
  A.DOOR_H = TS + A.WALL_H - 9;
  A.doorTall = function(kind, ends) {
    const H = A.DOOR_H;
    return cached("dt" + kind + ":" + (ends | 0), TS, H, P => {
      const D = RP(C.door), jl = ends & 32, jr = ends & 16, bx0 = jl ? 1 : 3, bx1 = jr ? TS - 1 : TS - 3;
      P.r(0, 0, TS, H, "#2a2c30");
      P.r(bx0, 0, bx1 - bx0, H - 1, D[3]).r(bx0, 0, 2, H - 1, D[4]).r(bx1 - 2, 0, 2, H - 1, D[1]);
      P.r(7, 4, 18, 16, D[2]).r(7, 4, 18, 1, D[1]).r(7, 19, 18, 1, D[4]);
      P.r(7, 25, 18, 16, D[2]).r(7, 25, 18, 1, D[1]).r(7, 40, 18, 1, D[4]);
      P.r(bx0, H - 4, bx1 - bx0, 3, D[1]).r(bx0, H - 4, bx1 - bx0, 1, D[2]);
      P.r(0, H - 1, TS, 1, "#1c1d21");
      if (!(ends & 8)) {
        const kx = ends & 4 ? 7 : 22;
        P.r(kx, 21, 3, 2, C.knob).p(ends & 4 ? kx + 2 : kx, 21, "#fff0a0");
      }
      if (kind === 5) {
        P.thick(3, 8, 28, 36, 2, C.chain).thick(3, 36, 28, 8, 2, C.chain);
        P.r(12, 16, 8, 9, "#2a2c30").r(13, 17, 6, 7, C.lockRed).r(13, 17, 6, 1, "#e06060").r(15, 19, 2, 3, "#2a2c30");
      }
    });
  };
  A.doorPlank = function(locked, knob) {
    knob = knob | 0;
    return cached("dpl" + (locked ? 1 : 0) + knob, TS, TS, P => {
      P.r(12, 0, 8, TS, C.door2).r(13, 0, 6, TS, C.door).r(13, 0, 1, TS, C.doorHi).r(18, 0, 1, TS, C.door2);
      if (knob === 1) P.r(12, TS - 1, 8, 1, C.door2); else if (knob === 2) P.r(12, 0, 8, 1, C.door2);
      if (knob !== 3) P.r(14, knob === 1 ? 26 : knob === 2 ? 4 : 15, 4, 2, C.knob);
      if (locked) P.r(10, 12, 12, 8, C.lockRed).r(10, 12, 12, 1, "#e06060");
    });
  };
  A.doorCapMark = function(open, locked, knob) {
    knob = knob | 0;
    return cached("dcm" + (open ? 1 : 0) + (locked ? 1 : 0) + knob, TS, TS, P => {
      const R = RP(C.capTop);
      P.r(0, 0, TS, TS, open ? "#1a1b1f" : C.capTop);
      if (!open) {
        P.r(12, 1, 8, 30, C.door2).r(13, 2, 6, 28, C.door).r(13, 2, 1, 28, C.doorHi).r(18, 2, 1, 28, C.door2);
        if (knob !== 3) P.r(14, knob === 1 ? 26 : knob === 2 ? 4 : 15, 4, 2, C.knob);
        if (locked) P.r(10, 12, 12, 8, C.lockRed).r(10, 12, 12, 1, "#e06060");
      } else {
        P.r(0, 0, TS, 2, R[4]);
        P.r(13, 0, 6, 3, C.door).r(13, 29, 6, 3, C.door);
      }
    });
  };
  const PROPS = {};
  A.defProp = function(kind, fw, fh, up, draw, o) {
    PROPS[kind] = Object.assign({
      fw,
      fh,
      up,
      draw,
      outline: true
    }, o || {});
    if (o && o.over) PROPS[kind].overDraw = {
      0: o.over
    };
  };
  A.defPropOver = function(kind, draws) {
    const d = PROPS[kind];
    if (d) {
      d.overDraw = Object.assign(d.overDraw || {}, draws);
      d.overFull = true;
    }
  };
  A.propOver = function(kind, variant, col, rot) {
    const d = PROPS[kind];
    if (!d || !d.overDraw) return null;
    const v = variant | 0;
    rot = (rot | 0) & 3;
    if (d.noRot || d.rotSym) rot = 0;
    if (!d.rotDraw && !d.rot && (d.fw === d.fh || !(rot & 1))) rot = 0;
    const key = "po" + kind + ":" + v + ":" + (col || "") + ":" + rot;
    if (rot === 3 && !d.overDraw[3]) {
      let c = cache.get(key);
      if (!c) {
        const r1 = A.propOver(kind, v, col, 1);
        if (!r1) return null;
        c = A.flipX(r1.c);
        cache.set(key, c);
      }
      return {
        c,
        ox: 0,
        oy: -A.propDims(kind, 1).up
      };
    }
    const own = d.overDraw[rot];
    if (!own) return null;
    const dm = A.propDims(kind, rot), w = dm.fw * TS, h = dm.fh * TS + dm.up;
    const c = cached(key, w, h, P => own(P, w, h, dm.up, new SX.Rng(v * 131 + kind.length), v, col || d.color, rot), d.outline ? {
      mat: true
    } : null);
    return {
      c,
      ox: 0,
      oy: -dm.up
    };
  };
  A.propSize = kind => PROPS[kind] || null;
  A.propDef = kind => PROPS[kind] || null;
  A.propKinds = () => Object.keys(PROPS);
  A.defPropRot = function(kind, o) {
    const d = PROPS[kind];
    if (!d) return;
    if (o.noRot) {
      d.noRot = true;
      return;
    }
    if (o.sym) {
      d.rotSym = true;
      return;
    }
    if (o.draw) d.rotDraw = Object.assign(d.rotDraw || {}, o.draw);
    if (o.up) d.upR = o.up;
    if (o.slotsR) d.slotsR = o.slotsR;
    if (o.racksR) d.racksR = o.racksR;
  };
  A.noRot = kind => !!(PROPS[kind] && PROPS[kind].noRot);
  A.propDims = function(kind, rot) {
    const d = PROPS[kind];
    if (!d) return null;
    rot = (rot | 0) & 3;
    if (d.rotSym || d.noRot) rot = 0;
    const ur = rot === 3 && !(d.upR && d.upR[3] != null) ? 1 : rot;
    const up = d.upR && d.upR[ur] != null ? d.upR[ur] : d.up;
    return rot & 1 ? {
      fw: d.fh,
      fh: d.fw,
      up
    } : {
      fw: d.fw,
      fh: d.fh,
      up
    };
  };
  A.propBase = function(kind, variant, col, rot) {
    const d = PROPS[kind];
    if (!d) return null;
    const v = variant | 0;
    rot = (rot | 0) & 3;
    if (d.noRot) rot = 0;
    if (d.rotSym && rot) {
      const sk = "p" + kind + ":" + v + ":" + (col || "") + ":s" + rot;
      let sc = cache.get(sk);
      if (!sc) {
        const sw = d.fw * TS, shh = d.fh * TS + d.up;
        const raw = cached(sk + "r", sw, shh, P => d.draw(P, sw, shh, d.up, new SX.Rng(v * 131 + kind.length + rot * 977), v, col || d.color, rot), d.outline ? {
          mat: true
        } : null);
        sc = rot & 2 ? A.flipX(raw) : raw;
        cache.set(sk, sc);
      }
      return {
        c: sc,
        ox: 0,
        oy: -d.up
      };
    }
    if (d.rotSym) rot = 0;
    const R = d.rotDraw || null;
    if (!R && !d.rot && (d.fw === d.fh || !(rot & 1))) rot = 0;
    const key = "p" + kind + ":" + v + ":" + (col || "") + ":" + rot;
    if (rot === 3 && !(R && R[3])) {
      let c = cache.get(key);
      if (!c) {
        c = A.flipX(A.propBase(kind, v, col, 1).c);
        cache.set(key, c);
      }
      return {
        c,
        ox: 0,
        oy: -A.propDims(kind, 1).up
      };
    }
    const dm = A.propDims(kind, rot), w = dm.fw * TS, h = dm.fh * TS + dm.up;
    const own = rot === 0 ? d.draw : R && R[rot] || (d.rot ? d.draw : null);
    const c = cached(key, w, h, P => {
      if (own) return own(P, w, h, dm.up, new SX.Rng(v * 131 + kind.length), v, col || d.color, rot);
      const fw0 = d.fw * TS, fh0 = d.fh * TS + d.up, f = mk(fw0, fh0);
      d.draw(new Pen(f.getContext("2d")), fw0, fh0, d.up, new SX.Rng(v * 131 + kind.length), v, col || d.color, 0);
      P.x.save();
      P.x.translate(w, d.up);
      P.x.rotate(Math.PI / 2);
      P.x.drawImage(f, 0, d.up, f.width, f.height - d.up, 0, 0, f.width, f.height - d.up);
      P.x.restore();
    }, d.outline ? {
      mat: true
    } : null);
    if (d.under && rot === 0) {
      const uk = key + ":u";
      let cu = cache.get(uk);
      if (!cu) {
        cu = mk(w, h);
        const ux = cu.getContext("2d");
        d.under(new Pen(ux), w, h, dm.up, new SX.Rng(v * 131 + kind.length + 7), v, col || d.color);
        ux.drawImage(c, 0, 0);
        cache.set(uk, cu);
      }
      return {
        c: cu,
        ox: 0,
        oy: -dm.up
      };
    }
    return {
      c,
      ox: 0,
      oy: -dm.up
    };
  };
  A.prop = function(kind, variant, col, rot) {
    const b = A.propBase(kind, variant, col, rot), d = PROPS[kind];
    if (!b || !d || !d.overDraw || !d.overFull) return b;
    const o = A.propOver(kind, variant, col, rot);
    if (!o || o.c.width !== b.c.width || o.c.height !== b.c.height) return b;
    const key = "pF|" + kind + ":" + (variant | 0) + ":" + (col || "") + ":" + ((rot | 0) & 3);
    let c = cache.get(key);
    if (!c) {
      c = mk(b.c.width, b.c.height);
      const x = c.getContext("2d");
      x.drawImage(b.c, 0, 0);
      x.drawImage(o.c, 0, 0);
      cache.set(key, c);
    }
    return {
      c,
      ox: b.ox,
      oy: b.oy
    };
  };
  const hitCache = new Map, BAND = 8;
  function mergeBands(bands) {
    const rects = [];
    for (const b of bands) {
      const r = Object.assign({}, b), last = rects[rects.length - 1];
      if (last && Math.abs(last.x0 - r.x0) < .07 && Math.abs(last.x1 - r.x1) < .07 && r.y0 - last.y1 < .05) {
        last.x0 = Math.min(last.x0, r.x0);
        last.x1 = Math.max(last.x1, r.x1);
        last.y1 = r.y1;
      } else rects.push(r);
    }
    return rects;
  }
  A.FOOT = {
    clothes: {
      x0: .08,
      x1: .92,
      d: .32
    },
    floorLamp: {
      x0: .3,
      x1: .7,
      d: .18
    },
    fire: {
      x0: .22,
      x1: .78,
      d: .34
    },
    heater: {
      x0: .2,
      x1: .8,
      d: .3,
      b: .44
    },
    plant: {
      x0: .28,
      x1: .72,
      d: .24
    },
    bigPlant: {
      x0: .26,
      x1: .74,
      d: .3
    },
    punchBag: {
      x0: .26,
      x1: .74,
      d: .24
    },
    drum: {
      x0: .18,
      x1: .82,
      d: .36
    },
    hydrant: {
      x0: .3,
      x1: .7,
      d: .22
    },
    tree: {
      x0: .34,
      x1: .66,
      d: .22
    },
    trash: {
      x0: .2,
      x1: .8,
      d: .3
    },
    boxes: {
      x0: .08,
      x1: .92,
      d: .42
    },
    coatRack: {
      x0: .3,
      x1: .7,
      d: .16
    },
    ivStand: {
      x0: .16,
      x1: .84,
      d: .16
    },
    o2: {
      x0: .14,
      x1: .86,
      d: .26
    },
    lamp: {
      x0: .36,
      x1: .64,
      d: .16
    },
    table: {
      x0: .04,
      x1: .96,
      d: 1.3
    },
    pedestal: {
      x0: .22,
      x1: .78,
      d: .3
    },
    car: {
      x0: .03,
      x1: .97,
      d: 1.2
    },
    bus: {
      x0: .02,
      x1: .98,
      d: 1.35
    },
    airdrop: {
      x0: .05,
      x1: .95,
      d: .6
    },
    escape: {
      x0: .1,
      x1: .9,
      d: .45
    },
    zipline: {
      x0: .1,
      x1: .9,
      d: .45
    },
    clock: {
      none: true
    },
    painting: {
      none: true
    },
    goldStatue: {
      x0: .18,
      x1: .82,
      d: .4
    },
    aircon: {
      none: true
    },
    bathCabinet: {
      none: true
    },
    ropeMat: {
      none: true
    },
    pillar: {
      x0: .14,
      x1: .86,
      d: .5
    },
    plate: {
      x0: .03,
      x1: .97,
      d: .26
    },
    sandbag: {
      x0: .02,
      x1: .98,
      d: .5
    },
    exBike: {
      x0: .12,
      x1: .88,
      d: .4
    },
    squatRack: {
      x0: .04,
      x1: .96,
      d: .8
    },
    plateTree: {
      x0: .2,
      x1: .8,
      d: .36
    },
    kettleRow: {
      x0: .04,
      x1: .96,
      d: .42
    },
    dumbbellRack: {
      x0: .03,
      x1: .97,
      d: .42
    },
    gymMirror: {
      x0: .06,
      x1: .94,
      d: .24
    }
  };
  A.PHYS = {
    sofa: .8,
    armchair: .75,
    chair: .5,
    coffeeTable: .6,
    desk: .65,
    doubleBed: 1.9,
    cot: .75,
    bookshelf: .35,
    wardrobe: .55,
    safe: .55,
    locker: .5,
    tv: .4,
    fridge: .65,
    kitchen: .6,
    speaker: .35,
    fishTank: .45,
    workbench: .65,
    stash: .55,
    radio: .55,
    displayCase: .55,
    displayShelf: .4,
    gunRack: .62,
    neon: .2,
    poster: .2,
    bathtub: .75,
    shower: .9,
    washer: .6,
    cupboard: .5,
    diningTable: .85,
    prepCounter: .6,
    microwave: .5,
    waterCooler: .35,
    singleBed: 1.9,
    bunkBed: 1.9,
    nightstand: .4,
    dresser: .45,
    vanity: .5,
    fan: .3,
    bench: .55,
    bed: 1.9,
    counter: .65,
    shelf: .45,
    cabinet: .55,
    crate: .6,
    vending: .7,
    copier: .6,
    sink: .45,
    toilet: .65,
    board: .25,
    mapBoard: .2,
    partition: .2,
    barrier: .25,
    atm: .6,
    sign: .2,
    ac: 1.2,
    tank: 1.8,
    opTable: 1.8,
    grandPiano: 1.5,
    bigTank: .45
  };
  function physNeed(kind, rot, d, dm) {
    const pd = A.PHYS[kind];
    if (pd == null) return 0;
    return Math.min(pd, dm.fh - .06);
  }
  const WALK_MIN = .22;
  function modelWalk(kind, rot) {
    const M = A.rotModel && A.rotModel(kind);
    if (!M || !M._geo) return null;
    const r = rot, G = M._geo(r), pad = M.pad == null ? 3 : M.pad;
    const W = G.w, Hc = G.FH * TS, grid = new Uint8Array(W * Hc);
    let any = false;
    for (const p of G.parts) {
      if (p.src.nohit || p.src.cond) continue;
      const X0 = pad + Math.round(p.x * G.Wpx), X1 = X0 + Math.max(1, Math.round(p.w * G.Wpx));
      const yF = G.B - Math.round((1 - p.y - p.d) * G.Dpx) - G.up;
      const dep = Math.max(1, Math.round(p.d * p.dpx));
      for (let y = Math.max(0, yF - dep); y < Math.min(Hc, yF); y++) for (let x = Math.max(0, X0); x < Math.min(W, X1); x++) {
        grid[y * W + x] = 1;
        any = true;
      }
    }
    if (!any) return [];
    const bands = [];
    for (let b0 = 0; b0 < Hc; b0 += 4) {
      let a = W, b = -1, top = -1, bot = -1;
      for (let y = b0; y < Math.min(Hc, b0 + 4); y++) for (let x = 0; x < W; x++) {
        if (!grid[y * W + x]) continue;
        if (x < a) a = x;
        if (x > b) b = x;
        if (top < 0) top = y;
        bot = y;
      }
      if (b < 0) continue;
      const x0 = a / TS, x1 = (b + 1) / TS;
      bands.push({
        x0,
        x1,
        y0: top / TS,
        y1: (bot + 1) / TS
      });
    }
    const rects = mergeBands(bands);
    const y0 = Math.min(...rects.map(q => q.y0)), y1 = Math.max(...rects.map(q => q.y1));
    if (y1 - y0 < WALK_MIN) {
      const q = rects[0];
      q.y0 = y1 - WALK_MIN;
    }
    return rects;
  }
  function footWalk(kind, rot, d, dm) {
    const f = A.FOOT[kind];
    if (!f) return null;
    if (f.none) return [];
    let x0 = (f.x0 == null ? .1 : f.x0) * dm.fw, x1 = (f.x1 == null ? .9 : f.x1) * dm.fw;
    if (d.rotSym && rot & 2) {
      const t = dm.fw - x1;
      x1 = dm.fw - x0;
      x0 = t;
    }
    const yb = dm.fh - (f.b == null ? .06 : f.b);
    return [ {
      x0,
      x1,
      y0: yb - Math.max(WALK_MIN, f.d),
      y1: yb
    } ];
  }
  A.WALK_FIX = {
    gunRack: {
      depth: .72
    },
    waterBoxes: {
      front: .27
    },
    waterPallet: {
      front: .3
    },
    waterJugRack: {
      front: .3
    },
    waterCase: {
      front: .3
    },
    waterPack: {
      front: .27
    },
    bottleSack: {
      front: .27
    },
    waterShelf: {
      front: .3
    }
  };
  A.LOW_HIT = {
    bookshelf: "side",
    stash: "side",
    grandPiano: 1,
    waterStand: 1,
    waterCooler: 1,
    waterShelf: 1,
    waterPallet: 1,
    waterJugRack: 1,
    waterCase: 1,
    waterBoxes: 1,
    waterPack: 1,
    bottleSack: 1,
    copier: 1,
    fridge: 1,
    cupboard: "side",
    microwave: 1
  };
  A.LOW_SIDE = {
    stash: .7
  };
  A.FOOT.grandPiano = {
    x0: .08,
    x1: .92,
    d: 1
  };
  A.hitTrusted = kind => {
    const M = A.rotModel && A.rotModel(kind);
    return !!(M && M._geo || A.FOOT[kind]);
  };
  A.propHit = function(kind, rot) {
    const d = PROPS[kind];
    if (!d) return null;
    rot = (rot | 0) & 3;
    if (d.noRot) rot = 0;
    const key = kind + ":" + rot;
    if (hitCache.has(key)) return hitCache.get(key);
    let out = null;
    const s = A.prop(kind, 0, null, rot), dm = A.propDims(kind, rot);
    if (s && dm) {
      const up = -s.oy, w = s.c.width, fh = Math.min(dm.fh * TS, s.c.height - up);
      const px = s.c.getContext("2d").getImageData(0, up, w, fh).data;
      const bands = [];
      for (let b0 = 0; b0 < fh; b0 += BAND) {
        let a = w, b = -1, top = -1, bot = -1;
        for (let y = b0; y < Math.min(fh, b0 + BAND); y++) for (let x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3] < 200) continue;
          if (x < a) a = x;
          if (x > b) b = x;
          if (top < 0) top = y;
          bot = y;
        }
        if (b < 0) continue;
        bands.push({
          x0: a / TS,
          x1: (b + 1) / TS,
          y0: top / TS,
          y1: (bot + 1) / TS
        });
      }
      const rects = mergeBands(bands);
      if (rects.length) {
        out = {
          x0: Math.min(...rects.map(r => r.x0)),
          y0: Math.min(...rects.map(r => r.y0)),
          x1: Math.max(...rects.map(r => r.x1)),
          y1: Math.max(...rects.map(r => r.y1)),
          rects
        };
        const r2 = d.noRot ? 0 : rot;
        let walk = modelWalk(kind, r2);
        if (walk && walk.length) {
          const need = physNeed(kind, r2, d, dm), y1 = Math.max(...walk.map(q => q.y1)), y0 = Math.min(...walk.map(q => q.y0));
          if (y1 - y0 < need - .01) walk = walk.concat([ {
            x0: Math.min(...walk.map(q => q.x0)),
            x1: Math.max(...walk.map(q => q.x1)),
            y0: y1 - need,
            y1: y0 + .01
          } ]);
        }
        if (walk == null) walk = footWalk(kind, r2, d, dm);
        if (walk == null) {
          const cut = out.y1 - Math.min(out.y1 - out.y0, .4);
          walk = mergeBands(bands.filter(r => r.y1 > cut + 1e-6).map(r => ({
            x0: r.x0,
            x1: r.x1,
            y0: Math.max(r.y0, cut),
            y1: r.y1
          })));
        }
        const wf = A.WALK_FIX[kind];
        if (wf && walk && walk.length) {
          const x0 = Math.min(...walk.map(q => q.x0)), x1 = Math.max(...walk.map(q => q.x1)), dep = wf.front != null ? Math.max(0, dm.fh - 1) + wf.front : wf.depth;
          walk = [ {
            x0,
            x1,
            y0: Math.max(out.y0, out.y1 - dep),
            y1: out.y1 - .02
          } ];
        }
        const lh = A.LOW_HIT[kind];
        if (lh && walk && walk.length && (lh !== "side" || r2 & 1)) {
          out.low = true;
          const sd = A.LOW_SIDE[kind];
          if (sd != null && r2 & 1) {
            const yb = Math.max(...walk.map(q => q.y1));
            walk = [ {
              x0: Math.min(...walk.map(q => q.x0)),
              x1: Math.max(...walk.map(q => q.x1)),
              y0: yb - sd,
              y1: yb
            } ];
          }
        }
        out.walk = walk;
      }
    }
    hitCache.set(key, out);
    return out;
  };
  const mv = (rs, x, y) => rs.map(r => ({
    x0: x + r.x0,
    y0: y + r.y0,
    x1: x + r.x1,
    y1: y + r.y1
  }));
  A.hitAt = (h, x, y) => h ? {
    x0: x + h.x0,
    y0: y + h.y0,
    x1: x + h.x1,
    y1: y + h.y1,
    rects: mv(h.rects, x, y),
    walk: h.walk ? mv(h.walk, x, y) : null,
    low: h.low
  } : null;
  const boxCache = new Map;
  A.baseBox = function(kind, rot) {
    rot = (rot | 0) & 3;
    const key = kind + ":" + rot;
    if (boxCache.has(key)) return boxCache.get(key);
    let out = null;
    const h = A.propHit(kind, rot), dm = A.propDims(kind, rot), rs = h ? h.low ? h.walk || [] : (h.rects || []).concat(h.walk || []) : [];
    if (rs.length && dm) {
      const b = {
        x0: Math.max(0, Math.min(...rs.map(q => q.x0))),
        y0: Math.max(0, Math.min(...rs.map(q => q.y0))),
        x1: Math.min(dm.fw, Math.max(...rs.map(q => q.x1))),
        y1: Math.min(dm.fh, Math.max(...rs.map(q => q.y1)))
      }, G = 4 / TS;
      if (b.x0 > G || b.y0 > G || dm.fw - b.x1 > G || dm.fh - b.y1 > G) {
        const s = A.prop(kind, 0, null, rot), W = s.c.width, Hh = s.c.height, up = -s.oy, px = s.c.getContext("2d").getImageData(0, 0, W, Hh).data;
        let x0 = W, x1 = -1, y0 = Hh;
        for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] >= 200) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
        }
        b.pick = x1 < 0 ? {
          x0: b.x0,
          y0: b.y0,
          x1: b.x1,
          y1: b.y1
        } : {
          x0: Math.max(0, Math.min(b.x0, x0 / TS)),
          x1: Math.min(dm.fw, Math.max(b.x1, (x1 + 1) / TS)),
          y0: Math.max(-.9, Math.min(b.y0, (y0 - up) / TS)),
          y1: b.y1
        };
        out = b;
      }
    }
    boxCache.set(key, out);
    return out;
  };
  A.propSlots = function(kind, rot) {
    const d = PROPS[kind];
    if (!d) return {
      slots: null,
      racks: null
    };
    rot = (rot | 0) & 3;
    if (d.rotSym || d.noRot) rot = 0;
    if (!d.rotDraw && !d.rot && (d.fw === d.fh || !(rot & 1))) rot = 0;
    if (rot === 0) return {
      slots: d.slots || null,
      racks: d.racks || null
    };
    const own3 = rot === 3 && (d.slotsR && d.slotsR[3] || d.racksR && d.racksR[3]);
    const r = rot === 3 && !own3 ? 1 : rot, W = A.propDims(kind, r).fw * TS;
    let slots = d.slotsR && d.slotsR[r] || (rot === 2 ? d.slots : null), racks = d.racksR && d.racksR[r] || (rot === 2 ? d.racks : null);
    if (rot === 3 && !own3) {
      slots = slots && slots.map(([x, y]) => [ W - x - 16, y ]);
      racks = racks && racks.map(([x, y]) => [ W - x, y ]);
    }
    return {
      slots,
      racks
    };
  };
  A.CHAR_W = 32;
  A.CHAR_H = 44;
  A.CHAR_OX = 16;
  A.CHAR_OY = 41;
  A.char = function(spec, dir, frame, pose) {
    pose = pose || "walk";
    const id = spec.key || JSON.stringify(spec);
    if (dir === 3 && pose !== "crawl") {
      const k = "ch" + id + ":3:" + frame + ":" + pose;
      let c = cache.get(k);
      if (!c) {
        c = A.flipX(A.char(spec, 1, frame, pose));
        cache.set(k, c);
      }
      return c;
    }
    const key = "ch" + id + ":" + dir + ":" + frame + ":" + pose;
    return cached(key, 32, 44, (P, c) => {
      charBody(P, spec, dir, frame, pose);
      if (/^walk/.test(pose)) putRaw(key, c);
    }, A.charLine(spec));
  };
  const rawPxCache = new Map;
  function putRaw(key, c) {
    rawPxCache.set(key, c.getContext("2d").getImageData(0, 0, 32, 44).data);
    if (rawPxCache.size > 800) rawPxCache.delete(rawPxCache.keys().next().value);
  }
  A.charRawPx = function(spec, dir, frame, pose) {
    pose = pose || "walk";
    const key = "ch" + (spec.key || JSON.stringify(spec)) + ":" + dir + ":" + frame + ":" + pose;
    let v = rawPxCache.get(key);
    if (!v) {
      putRaw(key, A.charRaw(spec, dir, frame, pose));
      v = rawPxCache.get(key);
    }
    return v;
  };
  function charBody(P, spec, dir, frame, pose) {
    const ride = /^ride/.test(pose) || /^run/.test(pose);
    if (spec.custom) drawCustom(P, spec, dir, ride ? 0 : frame, pose); else drawChar(P, spec, dir, ride ? 0 : frame, pose);
    if (/^ride/.test(pose)) rideLegs(P, spec, frame); else if (ride) runLegs(P, spec, frame);
    if (/^lie/.test(pose)) lieBody(P, spec);
  }
  A.charLine = spec => spec.fallback ? {
    col: "#f4efd8"
  } : {
    col: spec.kind === "zombie" || spec.kind === "scav" || spec.kind === "dog" ? A.OUTLINE.enemy : A.OUTLINE.char
  };
  A.charRaw = function(spec, dir, frame, pose) {
    const c = mk(32, 44);
    charBody(new Pen(c.getContext("2d", {
      willReadFrequently: true
    })), spec, dir, frame, pose || "walk");
    return c;
  };
  A.DOG_W = 32;
  A.DOG_H = 24;
  A.DOG_OX = 16;
  A.DOG_OY = 21;
  A.dog = function(frame, left) {
    const f = (frame | 0) & 3, key = "dog:" + f;
    if (left) {
      const k = key + ":L";
      let c = cache.get(k);
      if (!c) {
        c = A.flipX(A.dog(f, false));
        cache.set(k, c);
      }
      return c;
    }
    return cached(key, 32, 24, P => {
      const c = "#6e5c44", d = "#46392a", l = "#8e7a5c", bob = f & 1;
      P.oval(16, 21, 11, 2, "rgba(0,0,0,0.28)");
      for (const [x, lift] of [ [ 8, f === 1 ], [ 11, f === 3 ], [ 19, f === 3 ], [ 22, f === 1 ] ]) P.r(x, 14 - bob, 2, lift ? 5 : 7, d);
      P.oval(15, 12 - bob, 9, 4, c);
      P.r(9, 9 - bob, 12, 2, l);
      P.r(12, 15 - bob, 7, 1, d);
      P.r(4, 9 - bob, 3, 2, d);
      P.r(2, 7 - bob, 2, 2, d);
      P.oval(24, 8 - bob, 4, 3, c);
      P.r(27, 8 - bob, 4, 3, d);
      P.r(22, 4 - bob, 2, 3, d);
      P.r(25, 4 - bob, 2, 2, d);
      P.p(25, 7 - bob, "#ff3a2a");
      P.p(30, 10 - bob, "#e8e4d8");
      P.p(28, 10 - bob, "#e8e4d8");
      P.r(14, 11 - bob, 3, 1, "#8a1e1e");
      P.r(18, 13 - bob, 2, 1, "#6a1414");
    }, A.charLine({
      kind: "dog"
    }));
  };
  A.charFresh = function(spec, dir, frame, pose) {
    if (dir === 3) return A.flipX(A.charFresh(spec, 1, frame, pose));
    const c = mk(32, 44), P = new Pen(c.getContext("2d"));
    if (spec.custom) drawCustom(P, spec, dir, frame, pose || "walk"); else drawChar(P, spec, dir, frame, pose || "walk");
    return A.outline(c, A.charLine(spec));
  };
  function band(P, x, y, w, h, R, flip) {
    for (let i = 0; i < w; i++) {
      const t = (i + .5) / w, u = flip ? 1 - t : t;
      P.r(x + i, y, 1, h, u < .2 ? R[4] : u < .62 ? R[3] : u < .86 ? R[2] : R[1]);
    }
  }
  function shape(P, rows, R, flip) {
    for (const [y, x0, x1] of rows) for (let x = x0; x <= x1; x++) {
      const t = (x - rows.minX + .5) / (rows.maxX - rows.minX + 1), u = flip ? 1 - t : t;
      P.p(x, y, u < .2 ? R[4] : u < .62 ? R[3] : u < .86 ? R[2] : R[1]);
    }
  }
  function rowsOf(list) {
    let a = Infinity, b = -Infinity;
    for (const r of list) {
      a = Math.min(a, r[1]);
      b = Math.max(b, r[2]);
    }
    list.minX = a;
    list.maxX = b;
    return list;
  }
  const HEAD_F = rowsOf([ [ 5, 12, 19 ], [ 6, 11, 20 ], [ 7, 10, 21 ], [ 8, 10, 21 ], [ 9, 10, 21 ], [ 10, 10, 21 ], [ 11, 10, 21 ], [ 12, 10, 21 ], [ 13, 10, 21 ], [ 14, 10, 21 ], [ 15, 11, 20 ], [ 16, 12, 19 ] ]);
  const HEAD_S = rowsOf([ [ 5, 13, 19 ], [ 6, 12, 20 ], [ 7, 11, 21 ], [ 8, 11, 21 ], [ 9, 11, 22 ], [ 10, 11, 22 ], [ 11, 11, 22 ], [ 12, 11, 23 ], [ 13, 11, 22 ], [ 14, 11, 22 ], [ 15, 12, 21 ], [ 16, 13, 20 ] ]);
  const TORSO_F = rowsOf([ [ 18, 11, 20 ], [ 19, 10, 21 ], [ 20, 9, 22 ], [ 21, 9, 22 ], [ 22, 9, 22 ], [ 23, 9, 22 ], [ 24, 9, 22 ], [ 25, 9, 22 ], [ 26, 9, 22 ], [ 27, 10, 21 ], [ 28, 10, 21 ] ]);
  const TORSO_S = rowsOf([ [ 18, 13, 19 ], [ 19, 12, 20 ], [ 20, 11, 21 ], [ 21, 11, 21 ], [ 22, 11, 21 ], [ 23, 11, 21 ], [ 24, 11, 21 ], [ 25, 11, 20 ], [ 26, 11, 20 ], [ 27, 12, 20 ], [ 28, 12, 20 ] ]);
  function drawChar(P, s, dir, fr, pose) {
    const noArms = /-na$/.test(pose || "");
    pose = (pose || "walk").replace(/-na$/, "");
    const sit = pose === "sit";
    if (sit) fr = 0;
    const bsit = pose === "benchSit";
    if (bsit) fr = 0;
    const lie = pose === "lie";
    if (lie) {
      fr = 0;
      dir = 0;
    }
    const zombie = s.kind === "zombie";
    const skin = s.skin || C.skin1, top = s.top || "#55663a", pants = s.pants || "#3a3f4a", boot = s.boot || "#2a2622", hair = s.hair || "#2a2019";
    const Rs = RP(skin), Rt = RP(top), Rp = RP(pants), Rb = RP(boot), Rh = RP(hair);
    const g = new SX.Rng(SX.hash(s.key || "x"));
    if (pose === "crawl") return drawCrawler(P, s, dir, fr, Rs, Rt, Rp, Rh);
    const step = [ 0, 1, 0, -1 ][fr % 4];
    const bob = zombie ? fr % 2 : step !== 0 ? 1 : 0;
    const sway = zombie ? [ 0, 1, 0, -1 ][fr % 4] : 0;
    if (!lie) P.shadow(16, 41, 9, 3, .4);
    const side = dir === 1;
    if (sit) {
      drawSitLegs(P, s, dir, RP(s.pants || "#3a3f4a"), RP(s.boot || "#2a2622"), RP(s.top || "#55663a"));
      P.x.save();
      P.x.translate(0, SIT_DY);
    } else if (bsit) {
      drawBenchLegs(P, s, dir, Rp, Rb, Rt);
      P.x.save();
      P.x.translate(0, BSIT_DY);
    }
    const hy = 0 + bob + (zombie ? 1 : 0), ty = bob;
    if (dir === 0 && (s.hairStyle === "long" || s.hairStyle === "bob") && ![ "hood", "bike" ].includes(s.hat)) {
      P.r(9 + sway, 9 + hy, 3, s.hairStyle === "long" ? 13 : 7, Rh[2]).r(20 + sway, 9 + hy, 3, s.hairStyle === "long" ? 13 : 7, Rh[1]);
    }
    if (s.pack && dir === 0) {
      const Rk = RP(s.pack);
      P.r(8 + sway, 16 + ty, 16, 4, Rk[2]).r(8 + sway, 16 + ty, 16, 1, Rk[4]);
    }
    if (s.pack && side) {
      const Rk = RP(s.pack);
      P.r(5, 17 + ty, 7, 13, Rk[3]).r(5, 17 + ty, 7, 2, Rk[4]).r(5, 17 + ty, 2, 13, Rk[4]).r(5, 28 + ty, 7, 2, Rk[1]).r(6, 23 + ty, 5, 1, Rk[1]);
    }
    const hip = 29, foot = 41;
    if (sit || bsit) {} else if (lie) {} else if (!side) {
      const liftL = step < 0 ? 2 : 0, liftR = step > 0 ? 2 : 0;
      for (const [x0, lift, dark] of [ [ 11, liftL, false ], [ 17, liftR, true ] ]) {
        const x = x0 + (dark ? 0 : 0);
        const len = foot - 3 - lift - hip;
        band(P, x, hip, 5, len, dark ? [ Rp[3], Rp[2], Rp[2], Rp[1], Rp[0], Rp[0] ] : Rp);
        P.r(x, hip + len - 1, 5, 1, Rp[1]);
        const by = foot - 3 - lift;
        P.r(x, by, 5, 4, Rb[3]).r(x, by, 5, 1, Rb[4]).r(x, by + 3, 5, 1, Rb[1]).p(x + 1, by + 1, Rb[5]);
      }
      if (s.topStyle === "coat") band(P, 10, hip, 12, 6, Rt);
    } else {
      const fx = 15 + step * 2, bx = 13 - step * 2;
      const lb = foot - 3 - (step !== 0 ? 1 : 0);
      P.r(bx, hip, 5, lb - hip, Rp[1]).r(bx, lb, 7, 4, Rb[2]).r(bx, lb + 3, 7, 1, Rb[0]);
      band(P, fx, hip, 5, foot - 3 - hip, Rp);
      P.r(fx, foot - 3, 7, 4, Rb[3]).r(fx, foot - 3, 7, 1, Rb[4]).r(fx + 5, foot - 2, 2, 1, Rb[4]).r(fx, foot, 7, 1, Rb[1]);
      if (s.topStyle === "coat") band(P, 11, hip, 10, 6, Rt);
    }
    const swing = zombie || sit || bsit ? 0 : step;
    if (side && !zombie && !noArms) {
      P.r(13 - swing * 2, 20 + ty, 4, 9, Rt[1]).r(13 - swing * 2, 28 + ty, 4, 2, Rs[1]);
    }
    const TR = side ? TORSO_S : TORSO_F;
    P.x.save();
    P.x.translate(sway, ty);
    shape(P, TR, Rt);
    const cx = side ? 16 : 15.5;
    if (!side && dir === 0) drawTopFront(P, s, Rt, Rs, g); else if (dir === 2) drawTopBack(P, s, Rt); else drawTopSide(P, s, Rt, Rs);
    if (!side) P.r(10, 28, 12, 2, "#27221d").r(15, 28, 2, 2, "#a8a080"); else P.r(12, 28, 9, 2, "#27221d");
    if (s.vest) {
      const Rv = RP(s.vest);
      if (!side) {
        P.r(10, 19, 12, 9, Rv[3]).r(10, 19, 12, 1, Rv[4]).r(10, 19, 1, 9, Rv[4]).r(21, 19, 1, 9, Rv[1]).r(11, 18, 2, 2, Rv[2]).r(19, 18, 2, 2, Rv[2]);
        if (dir === 0) for (const px of [ 10, 14, 18 ]) {
          P.r(px, 24, 4, 4, Rv[2]).r(px, 24, 4, 1, Rv[4]).r(px + 3, 24, 1, 4, Rv[1]);
        } else P.r(12, 21, 8, 2, Rv[1]).r(13, 21, 6, 1, Rv[4]);
        P.r(10, 22, 12, 1, Rv[2]);
      } else {
        P.r(12, 19, 9, 9, Rv[3]).r(12, 19, 9, 1, Rv[4]).r(20, 19, 1, 9, Rv[1]).r(18, 23, 3, 4, Rv[2]).r(18, 23, 3, 1, Rv[4]);
      }
    }
    if (s.pack) {
      const Rk = RP(s.pack);
      if (dir === 2) {
        P.r(9, 17, 14, 14, Rk[3]).r(9, 17, 14, 4, Rk[4]).r(9, 17, 1, 14, Rk[4]).r(22, 17, 1, 14, Rk[1]).r(9, 30, 14, 1, Rk[1]).r(10, 21, 12, 1, Rk[1]).r(11, 25, 10, 4, Rk[2]).r(11, 25, 10, 1, Rk[4]).r(15, 22, 2, 2, "#a8a080");
      } else if (dir === 0) {
        P.r(11, 18, 2, 9, Rk[1]).r(19, 18, 2, 9, Rk[1]).p(11, 18, Rk[4]).p(19, 18, Rk[4]);
      }
    }
    P.x.restore();
    P.x.save();
    P.x.translate(sway, ty);
    if (zombie) {
      if (dir === 0) {
        P.r(6, 19, 4, 5, Rt[2]).r(22, 19, 4, 5, Rt[1]);
        P.r(8, 22, 4, 5, Rs[3]).r(8, 22, 4, 1, Rs[4]).r(20, 22, 4, 5, Rs[2]).r(20, 22, 4, 1, Rs[3]);
        P.r(9, 26, 2, 1, Rs[1]).r(21, 26, 2, 1, Rs[0]);
      } else if (dir === 2) {
        P.r(6, 19, 4, 5, Rt[2]).r(22, 19, 4, 5, Rt[1]);
      } else {
        P.r(18, 20, 6, 4, Rt[2]).r(18, 20, 6, 1, Rt[4]);
        P.r(24, 20, 6, 4, Rs[3]).r(24, 20, 6, 1, Rs[4]).r(29, 21, 1, 3, Rs[2]).r(24, 23, 6, 1, Rs[1]);
      }
    } else if (noArms) {} else if (!side) {
      const sl = s.topStyle === "tee" ? 4 : 9;
      for (const [x, dy, dark] of [ [ 5, swing, false ], [ 23, -swing, true ] ]) {
        const Ra = dark ? [ Rt[2], Rt[2], Rt[1], Rt[1], Rt[0], Rt[0] ] : Rt;
        P.r(x + 1, 19 + dy, 2, 1, Ra[3]);
        band(P, x, 20 + dy, 4, sl, dark ? [ Rt[3], Rt[2], Rt[1], Rt[0], Rt[0], Rt[0] ] : Rt);
        if (sl < 9) band(P, x, 20 + dy + sl, 4, 9 - sl, dark ? [ Rs[3], Rs[2], Rs[1], Rs[0], Rs[0], Rs[0] ] : Rs);
        const hc = s.gloves ? RP("#2a2a2e") : Rs;
        P.r(x, 29 + dy, 4, 2, dark ? hc[2] : hc[3]).r(x, 30 + dy, 4, 1, hc[1]);
      }
    } else {
      const ax = 15 + swing * 2;
      band(P, ax, 19, 4, s.topStyle === "tee" ? 4 : 9, Rt);
      if (s.topStyle === "tee") band(P, ax, 23, 4, 5, Rs);
      const hc = s.gloves ? RP("#2a2a2e") : Rs;
      P.r(ax, 28, 4, 2, hc[3]).r(ax, 29, 4, 1, hc[1]);
    }
    P.x.restore();
    P.x.save();
    P.x.translate(sway + (zombie && dir !== 2 ? fr % 2 ? 1 : 0 : 0), hy);
    if (!side) P.r(13, 16, 6, 3, Rs[1]); else P.r(14, 16, 5, 3, Rs[1]);
    const HR = side ? HEAD_S : HEAD_F;
    shape(P, HR, Rs);
    if (!side) {
      P.r(9, 10, 1, 3, Rs[2]).r(22, 10, 1, 3, Rs[1]);
    }
    if (dir === 0) drawFace(P, s, Rs, Rh, zombie); else if (side) drawFaceSide(P, s, Rs, Rh, zombie);
    drawHair(P, s, dir, Rh, Rs);
    drawHat(P, s, dir, Rs);
    if (s.nvg) drawNvg(P, s.nvg, dir);
    P.x.restore();
    if (zombie) {
      P.x.save();
      P.x.translate(sway, ty);
      for (let k = 0; k < 5; k++) {
        const x = (side ? 12 : 10) + g.i(side ? 8 : 11), y = 19 + g.i(9);
        P.r(x, y, 1 + g.i(2), 1 + g.i(2), g.chance(.6) ? C.blood : C.blood2);
      }
      if (s.torn) {
        const x = (side ? 13 : 12) + g.i(5), y = 21 + g.i(4);
        P.r(x, y, 3, 2, Rs[2]).r(x, y, 3, 1, Rt[0]);
      }
      P.x.restore();
    }
    if (sit || bsit) P.x.restore();
  }
  const SIT_DY = 6;
  A.SIT_DY = SIT_DY;
  const BSIT_DY = -1;
  A.BSIT_DY = BSIT_DY;
  A.BSIT_HIP = 41 - (29 + BSIT_DY);
  function drawBenchLegs(P, s, dir, Rp, Rb, Rt) {
    const hip = 29 + BSIT_DY;
    if (dir === 1) {
      band(P, 12, hip, 10, 4, [ Rp[2], Rp[3], Rp[4], Rp[3], Rp[2], Rp[1] ]);
      P.r(12, hip, 10, 1, Rp[5]).r(12, hip + 3, 10, 1, Rp[1]);
      band(P, 19, hip + 4, 4, 38 - hip - 4, Rp);
      P.r(19, 37, 4, 1, Rp[1]);
      P.r(19, 38, 7, 4, Rb[3]).r(19, 38, 7, 1, Rb[4]).r(19, 41, 7, 1, Rb[1]).r(24, 39, 2, 1, Rb[4]);
      if (s.topStyle === "coat") band(P, 11, hip, 8, 3, Rt);
      return;
    }
    if (dir === 2) {
      for (const x of [ 11, 17 ]) {
        band(P, x, 33, 5, 5, [ Rp[1], Rp[2], Rp[2], Rp[1], Rp[0], Rp[0] ]);
        P.r(x, 38, 5, 4, Rb[2]).r(x, 38, 5, 1, Rb[3]).r(x, 41, 5, 1, Rb[0]);
      }
      return;
    }
    for (const [x, dark] of [ [ 10, false ], [ 17, true ] ]) {
      const R = dark ? [ Rp[3], Rp[2], Rp[2], Rp[1], Rp[0], Rp[0] ] : Rp;
      band(P, x, hip, 6, 4, dark ? [ Rp[4], Rp[3], Rp[3], Rp[2], Rp[1], Rp[1] ] : [ Rp[5], Rp[4], Rp[4], Rp[3], Rp[2], Rp[2] ]);
      P.r(x, hip, 6, 1, dark ? Rp[4] : Rp[5]);
      P.r(x, hip + 4, 6, 1, dark ? Rp[2] : Rp[3]);
      band(P, x + 1, hip + 5, 5, 38 - hip - 5, R);
      P.r(x + 1, 37, 5, 1, R[1]);
      P.r(x + 1, 38, 5, 4, Rb[3]).r(x + 1, 38, 5, 1, Rb[4]).r(x + 1, 41, 5, 1, Rb[1]).p(x + 2, 39, Rb[5]);
    }
    if (s.topStyle === "coat") band(P, 10, hip, 12, 3, Rt);
  }
  function lieBody(P, s) {
    const cx = P.x, W = 32, HH = 44, sd = cx.getImageData(0, 0, W, HH).data;
    const pick = (y0, y1, dflt) => {
      const m = new Map;
      for (let y = y0; y <= y1; y++) for (let x = 9; x <= 22; x++) {
        const o = (y * W + x) * 4;
        if (sd[o + 3] < 200) continue;
        const k = sd[o] << 16 | sd[o + 1] << 8 | sd[o + 2];
        m.set(k, (m.get(k) || 0) + 1);
      }
      let best = -1, bn = 0;
      for (const [k, n] of m) if (n > bn) {
        bn = n;
        best = k;
      }
      return best < 0 ? dflt : "#" + best.toString(16).padStart(6, "0");
    };
    const Rp = RP(s.custom ? pick(31, 36, "#3a3f4a") : s.pants || "#3a3f4a"), Rb = RP(s.custom ? pick(38, 41, "#2a2622") : s.boot || "#2a2622");
    const out = cx.createImageData(W, HH), od = out.data;
    const put = (sy, dy, mul) => {
      for (let x = 0; x < W; x++) {
        const a = (sy * W + x) * 4, b = (dy * W + x) * 4;
        if (sd[a + 3] < 200) continue;
        od[b] = Math.min(255, sd[a] * mul);
        od[b + 1] = Math.min(255, sd[a + 1] * mul);
        od[b + 2] = Math.min(255, sd[a + 2] * mul);
        od[b + 3] = 255;
      }
    };
    for (let y = 2; y <= 16; y++) put(y, y + 4, 1);
    [ 18, 19, 20, 21, 22 ].forEach((sy, k) => put(sy, 19 + k, 1.1));
    [ 23, 25, 27, 28 ].forEach((sy, k) => put(sy, 24 + k, .7));
    cx.clearRect(0, 0, W, HH);
    cx.putImageData(out, 0, 0);
    const dk = [ Rp[3], Rp[2], Rp[2], Rp[1], Rp[0], Rp[0] ];
    P.r(10, 28, 12, 1, Rp[2]).r(21, 28, 1, 1, Rp[1]);
    for (const [x, R] of [ [ 10, Rp ], [ 17, dk ] ]) {
      P.r(x, 29, 5, 1, R[4]);
      P.r(x, 30, 5, 2, R[5]).r(x + 4, 30, 1, 2, R[3]).r(x, 31, 5, 1, R[4]);
      P.r(x, 32, 5, 3, R[2]).r(x, 32, 1, 3, R[3]).r(x + 4, 32, 1, 3, R[1]);
    }
    P.r(9, 35, 6, 2, Rb[3]).r(9, 35, 6, 1, Rb[4]).r(17, 35, 6, 2, Rb[2]).r(17, 35, 6, 1, Rb[3]);
    const now = cx.getImageData(0, 0, W, HH), nd = now.data, on = (x, y) => x >= 0 && y >= 0 && x < W && y < HH && nd[(y * W + x) * 4 + 3] > 200, add = [];
    for (let y = 10; y <= 38; y++) for (let x = 2; x < W; x++) {
      if (on(x, y) || on(x - 1, y) || on(x, y - 1)) continue;
      if (on(x - 2, y) || on(x - 2, y - 1) || on(x - 1, y - 2) || on(x, y - 2)) add.push(y * W + x);
    }
    for (const i of add) {
      nd[i * 4] = 0;
      nd[i * 4 + 1] = 0;
      nd[i * 4 + 2] = 0;
      nd[i * 4 + 3] = 70;
    }
    cx.putImageData(now, 0, 0);
  }
  function runLegs(P, s, fr) {
    const cx = P.x, W = 32, HH = 44, sd = cx.getImageData(0, 0, W, HH).data;
    const pick = (y0, y1, dflt) => {
      const m = new Map;
      for (let y = y0; y <= y1; y++) for (let x = 9; x <= 22; x++) {
        const o = (y * W + x) * 4;
        if (sd[o + 3] < 200) continue;
        const k = sd[o] << 16 | sd[o + 1] << 8 | sd[o + 2];
        m.set(k, (m.get(k) || 0) + 1);
      }
      let best = -1, bn = 0;
      for (const [k, n] of m) if (n > bn) {
        bn = n;
        best = k;
      }
      return best < 0 ? dflt : "#" + best.toString(16).padStart(6, "0");
    };
    const Rp = RP(s.custom ? pick(31, 36, "#3a3f4a") : s.pants || "#3a3f4a"), Rb = RP(s.custom ? pick(38, 41, "#2a2622") : s.boot || "#2a2622");
    cx.clearRect(0, 30, W, HH - 30);
    const H0 = [ 16, 30 ], L1 = 6.2, L2 = 6.2, th = ((fr | 0) & 7) * Math.PI / 4;
    const foot = a => {
      a = (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (a < Math.PI) return [ 21 - 10 * a / Math.PI, 41 ];
      const k = (a - Math.PI) / Math.PI;
      return [ 11 + 10 * k, 41 - 5 * Math.sin(k * Math.PI) ];
    };
    const leg = (a, far) => {
      const F = foot(a), dx = F[0] - H0[0], dy = F[1] - H0[1], dd = Math.hypot(dx, dy), d = Math.min(L1 + L2 - .01, dd);
      const ux = dx / dd, uy = dy / dd, aa = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
      const mx = H0[0] + ux * aa, my = H0[1] + uy * aa, k1 = [ mx - uy * hh, my + ux * hh ], k2 = [ mx + uy * hh, my - ux * hh ], K = k1[0] > k2[0] ? k1 : k2;
      const Fx = H0[0] + ux * Math.min(dd, L1 + L2), Fy = H0[1] + uy * Math.min(dd, L1 + L2);
      P.thick(H0[0], H0[1], K[0], K[1], 4, Rp[far ? 1 : 4]).thick(K[0], K[1], Fx, Fy, 3, Rp[far ? 1 : 3]);
      P.r(Fx - 2, Fy - 1, 5, 2, Rb[far ? 2 : 3]).r(Fx - 2, Fy - 1, 5, 1, Rb[far ? 3 : 4]);
    };
    leg(th + Math.PI, true);
    P.r(12, 29, 8, 2, Rp[3]);
    leg(th, false);
  }
  function rideLegs(P, s, fr) {
    const cx = P.x, W = 32, HH = 44, sd = cx.getImageData(0, 0, W, HH).data;
    const pick = (y0, y1, dflt) => {
      const m = new Map;
      for (let y = y0; y <= y1; y++) for (let x = 9; x <= 22; x++) {
        const o = (y * W + x) * 4;
        if (sd[o + 3] < 200) continue;
        const k = sd[o] << 16 | sd[o + 1] << 8 | sd[o + 2];
        m.set(k, (m.get(k) || 0) + 1);
      }
      let best = -1, bn = 0;
      for (const [k, n] of m) if (n > bn) {
        bn = n;
        best = k;
      }
      return best < 0 ? dflt : "#" + best.toString(16).padStart(6, "0");
    };
    const Rp = RP(s.custom ? pick(31, 36, "#3a3f4a") : s.pants || "#3a3f4a"), Rb = RP(s.custom ? pick(38, 41, "#2a2622") : s.boot || "#2a2622");
    cx.clearRect(0, 30, W, HH - 30);
    const H0 = [ 15, 30 ], C0 = [ 21, 38 ], r = 4, L1 = 7.5, L2 = 7.5, th = ((fr | 0) & 7) * Math.PI / 4;
    const leg = (a, R, far) => {
      const F = [ C0[0] + Math.cos(a) * r, C0[1] + Math.sin(a) * r ], dx = F[0] - H0[0], dy = F[1] - H0[1], d = Math.min(L1 + L2 - .01, Math.hypot(dx, dy));
      const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), aa = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
      const mx = H0[0] + ux * aa, my = H0[1] + uy * aa, k1 = [ mx - uy * hh, my + ux * hh ], k2 = [ mx + uy * hh, my - ux * hh ], K = k1[0] - k1[1] * .3 > k2[0] - k2[1] * .3 ? k1 : k2;
      if (!far) P.line(C0[0], C0[1], F[0], F[1], "#9aa0a8");
      P.thick(H0[0], H0[1], K[0], K[1], 4, R[far ? 1 : 4]).thick(K[0], K[1], F[0], F[1], 3, R[far ? 1 : 3]);
      P.p(K[0], K[1] - 1, R[far ? 2 : 5]);
      P.r(F[0] - 2, F[1] - 1, 5, 2, Rb[far ? 2 : 3]).r(F[0] - 2, F[1] - 1, 5, 1, Rb[far ? 3 : 4]);
    };
    leg(th + Math.PI, Rp, true);
    P.r(11, 30, 9, 2, Rp[3]).r(11, 30, 9, 1, Rp[4]);
    leg(th, Rp, false);
  }
  function drawSitLegs(P, s, dir, Rp, Rb, Rt) {
    const hip = 29 + SIT_DY;
    if (dir === 1) {
      band(P, 12, hip - 1, 10, 4, [ Rp[2], Rp[3], Rp[3], Rp[2], Rp[1], Rp[1] ]);
      P.r(12, hip + 2, 10, 1, Rp[1]);
      band(P, 19, hip + 2, 4, 38 - hip, Rp);
      P.r(19, 38, 7, 3, Rb[3]).r(19, 38, 7, 1, Rb[4]).r(19, 40, 7, 1, Rb[1]);
      if (s.topStyle === "coat") band(P, 11, hip - 1, 8, 4, Rt);
      return;
    }
    if (dir === 2) {
      for (const x of [ 11, 17 ]) {
        P.r(x, 37, 5, 2, Rp[1]);
        P.r(x, 38, 5, 3, Rb[2]).r(x, 40, 5, 1, Rb[0]);
      }
      return;
    }
    for (const [x, dark] of [ [ 10, false ], [ 17, true ] ]) {
      const R = dark ? [ Rp[3], Rp[2], Rp[2], Rp[1], Rp[0], Rp[0] ] : Rp;
      band(P, x, hip - 1, 6, 3, R);
      P.r(x, hip - 1, 6, 1, dark ? Rp[3] : Rp[4]);
      band(P, x + 1, hip + 2, 5, 38 - hip - 2, R);
      P.r(x + 1, 38, 5, 3, Rb[3]).r(x + 1, 38, 5, 1, Rb[4]).r(x + 1, 40, 5, 1, Rb[1]);
    }
    if (s.topStyle === "coat") band(P, 10, hip - 1, 12, 3, Rt);
  }
  function drawTopFront(P, s, Rt, Rs, g) {
    const st = s.topStyle || "jacket";
    P.r(14, 18, 4, 2, Rs[2]).p(15, 20, Rs[1]).p(16, 20, Rs[1]);
    if (st === "jacket") {
      P.r(16, 20, 1, 8, Rt[1]).r(12, 18, 2, 3, Rt[4]).r(18, 18, 2, 3, Rt[2]).r(11, 23, 3, 1, Rt[1]).r(18, 23, 3, 1, Rt[1]);
    } else if (st === "hoodie") {
      P.r(11, 17, 10, 2, Rt[2]).r(14, 19, 1, 3, "#d8d4c8").r(17, 19, 1, 3, "#d8d4c8").r(12, 23, 8, 4, Rt[2]).r(12, 23, 8, 1, Rt[4]);
    } else if (st === "tee") {
      P.r(13, 18, 6, 1, Rt[1]);
      if (s.print) P.r(13, 22, 6, 3, s.print).r(13, 22, 6, 1, sh(s.print, .2));
    } else if (st === "coat") {
      P.r(16, 19, 1, 10, Rt[0]).p(14, 21, Rt[5]).p(14, 24, Rt[5]).p(14, 27, Rt[5]).r(11, 18, 3, 4, Rt[4]).r(18, 18, 3, 4, Rt[1]);
    } else if (st === "uniform") {
      P.r(11, 21, 4, 3, Rt[2]).r(11, 21, 4, 1, Rt[4]).r(17, 21, 4, 3, Rt[1]).r(17, 21, 4, 1, Rt[3]).r(9, 19, 3, 1, Rt[5]).r(20, 19, 3, 1, Rt[3]).r(16, 20, 1, 8, Rt[1]);
    } else if (st === "suit") {
      P.r(14, 18, 4, 6, "#e8e6de").r(15, 19, 2, 7, s.tie || "#a83232").p(15, 19, sh(s.tie || "#a83232", .3));
      P.line(13, 18, 15, 24, Rt[0]).line(18, 18, 16, 24, Rt[0]);
    } else if (st === "camo") {
      camo(P, s, Rt);
      P.r(16, 20, 1, 8, Rt[1]);
    } else if (st === "rags") {
      for (let k = 0; k < 6; k++) P.r(10 + g.i(11), 20 + g.i(8), 2, 1, Rt[1]);
      P.r(10, 27, 3, 2, Rt[0]).r(18, 27, 2, 2, Rt[0]);
    }
    if (s.hivis) {
      P.r(10, 19, 3, 9, "#e8a02a").r(19, 19, 3, 9, "#d8901a").r(10, 24, 12, 2, "#e8e070");
    }
  }
  function drawTopBack(P, s, Rt) {
    const st = s.topStyle || "jacket";
    if (st === "hoodie") P.r(11, 17, 10, 5, Rt[4]).r(11, 17, 10, 1, Rt[5]).r(12, 21, 8, 1, Rt[2]); else if (st === "camo") camo(P, s, Rt); else if (st === "coat") P.r(16, 22, 1, 7, Rt[1]); else P.r(15, 19, 2, 8, Rt[2]);
    if (s.hivis) P.r(10, 19, 12, 9, "#e8a02a").r(10, 24, 12, 2, "#e8e070");
  }
  function drawTopSide(P, s, Rt, Rs) {
    const st = s.topStyle || "jacket";
    if (st === "hoodie") P.r(12, 17, 4, 4, Rt[4]); else if (st === "camo") camo(P, s, Rt); else if (st === "suit") P.r(19, 18, 2, 6, "#e8e6de");
    if (s.hivis) P.r(12, 19, 9, 9, "#e8a02a").r(12, 24, 9, 2, "#e8e070");
  }
  function camo(P, s, Rt) {
    const g = new SX.Rng(77);
    const cols = [ s.camo1 || sh(Rt[3], -.25), s.camo2 || A.mix(Rt[3], "#8a7a4a", .4) ];
    for (let k = 0; k < 9; k++) {
      const x = 10 + g.i(11), y = 19 + g.i(9);
      P.r(x, y, 2 + g.i(2), 1 + g.i(2), cols[k % 2]);
    }
  }
  function drawFace(P, s, Rs, Rh, zombie) {
    const eye = zombie ? "#e8e060" : "#1b1418", white = zombie ? "#d03020" : "#f4f0e8";
    P.r(12, 9, 3, 1, Rh[1]).r(17, 9, 3, 1, Rh[1]);
    P.r(13, 11, 2, 2, eye).p(13, 11, white).r(17, 11, 2, 2, eye).p(17, 11, white);
    P.p(15, 13, Rs[2]).p(16, 13, Rs[1]);
    if (zombie) P.r(14, 14, 4, 2, "#3a1418").p(15, 14, "#d8d0b0").p(17, 15, "#d8d0b0"); else P.r(15, 14, 2, 1, Rs[0]);
    if (s.beard) P.r(11, 13, 10, 4, Rh[2]).r(14, 14, 4, 1, Rs[1]).r(12, 16, 8, 1, Rh[1]);
    if (s.mask === "white") P.r(11, 12, 10, 5, "#e8ece8").r(11, 12, 10, 1, "#ffffff").r(19, 12, 2, 5, "#b8c0bc").r(10, 12, 1, 1, "#c8ccc8").r(21, 12, 1, 1, "#c8ccc8"); else if (s.mask === "black") P.r(11, 12, 10, 5, "#26262a").r(11, 12, 10, 1, "#3a3a40"); else if (s.mask === "gas") P.r(11, 10, 10, 7, "#3a3f38").r(12, 11, 3, 2, "#9cc8d4").r(17, 11, 3, 2, "#9cc8d4").r(14, 14, 4, 3, "#2a2c28").r(15, 15, 2, 1, "#6a6f68");
    if (s.goggles) P.r(10, 10, 12, 3, "#26262a").r(11, 10, 4, 2, "#e0a040").r(17, 10, 4, 2, "#e0a040").p(11, 10, "#fff0c0").p(17, 10, "#fff0c0");
  }
  function drawFaceSide(P, s, Rs, Rh, zombie) {
    P.r(19, 11, 2, 2, zombie ? "#e8e060" : "#1b1418").p(20, 11, zombie ? "#d03020" : "#f4f0e8");
    P.r(18, 9, 3, 1, Rh[1]);
    if (s.hat !== "bike") P.p(23, 13, Rs[2]);
    P.r(15, 10, 2, 3, Rs[2]).p(15, 11, Rs[1]);
    if (zombie) P.r(20, 14, 3, 2, "#3a1418"); else P.r(21, 15, 2, 1, Rs[1]);
    if (s.beard) P.r(16, 13, 7, 4, Rh[2]);
    if (s.mask === "white") P.r(17, 12, 7, 5, "#e8ece8").r(16, 12, 1, 1, "#c8ccc8"); else if (s.mask === "black") P.r(17, 12, 7, 5, "#26262a"); else if (s.mask === "gas") P.r(17, 10, 7, 7, "#3a3f38").r(20, 11, 3, 2, "#9cc8d4").r(22, 14, 3, 3, "#2a2c28");
    if (s.goggles) P.r(11, 10, 12, 3, "#26262a").r(19, 10, 4, 2, "#e0a040");
  }
  function drawHair(P, s, dir, Rh, Rs) {
    if ([ "hood", "bike", "helmet" ].includes(s.hat) && dir !== 2 && s.hat !== "helmet") return;
    const st = s.hairStyle || "short";
    if (st === "bald") {
      if (dir !== 2) P.r(13, 6, 3, 1, Rs[5]); else P.r(13, 6, 4, 2, Rs[5]);
      return;
    }
    if (dir === 0) {
      if (st === "buzz") {
        P.r(11, 5, 10, 3, Rh[2]).r(10, 7, 12, 1, Rh[2]).dith(11, 5, 10, 3, Rs[2], 0);
        return;
      }
      P.r(12, 4, 8, 1, Rh[3]).r(11, 5, 10, 1, Rh[3]).r(10, 6, 12, 2, Rh[3]).r(13, 5, 4, 1, Rh[4]).r(12, 6, 3, 1, Rh[5]).r(19, 6, 3, 2, Rh[1]);
      if (st === "mohawk") {
        P.r(10, 6, 12, 2, Rs[3]).r(14, 1, 4, 7, Rh[3]).r(14, 1, 1, 7, Rh[4]).r(17, 1, 1, 7, Rh[1]);
        return;
      }
      if (st === "spiky") {
        for (const x of [ 11, 14, 17, 20 ]) P.r(x, 2, 2, 3, Rh[3]).p(x, 2, Rh[4]);
      }
      for (let x = 10; x <= 21; x++) {
        const d = [ 2, 3, 2, 1, 3, 2, 2, 3, 1, 2, 3, 2 ][x - 10];
        P.r(x, 8, 1, d, x > 17 ? Rh[1] : Rh[2]);
      }
      P.r(10, 8, 1, 4, Rh[2]).r(21, 8, 1, 4, Rh[1]);
      if (st === "long" || st === "bob" || st === "pony") P.r(10, 8, 1, 7, Rh[2]).r(21, 8, 1, 7, Rh[1]);
    } else if (dir === 2) {
      const len = st === "long" ? 22 : st === "bob" ? 15 : st === "buzz" ? 9 : 13;
      P.r(12, 4, 8, 1, Rh[3]).r(11, 5, 10, 1, Rh[3]);
      band(P, 10, 6, 12, len - 6, Rh);
      if (st === "pony") P.r(14, 13, 4, 8, Rh[2]).r(14, 13, 4, 1, Rh[4]).r(15, 12, 2, 2, "#c83838");
      if (st === "mohawk") {
        P.r(10, 5, 12, 11, Rs[3]).r(14, 1, 4, 14, Rh[3]);
      }
      P.r(12, 5, 4, 1, Rh[5]);
    } else {
      if (st === "buzz") {
        P.r(12, 5, 9, 2, Rh[2]).r(11, 7, 5, 4, Rh[2]).dith(11, 5, 10, 4, Rs[2], 1);
        return;
      }
      P.r(13, 4, 7, 1, Rh[3]).r(12, 5, 9, 1, Rh[3]).r(11, 6, 11, 2, Rh[3]).r(11, 8, 5, 5, Rh[2]).r(14, 5, 4, 1, Rh[5]).r(20, 8, 2, 1, Rh[2]);
      if (st === "long") P.r(11, 8, 4, 13, Rh[2]).r(11, 8, 1, 13, Rh[3]); else if (st === "bob") P.r(11, 8, 5, 8, Rh[2]); else if (st === "pony") P.r(8, 9, 4, 3, Rh[2]).r(7, 11, 3, 7, Rh[2]).p(11, 9, "#c83838"); else if (st === "mohawk") {
        P.r(11, 6, 11, 2, Rs[3]).r(13, 1, 7, 6, Rh[3]);
      } else if (st === "spiky") P.r(12, 2, 2, 3, Rh[3]).r(15, 2, 2, 3, Rh[3]).r(18, 3, 2, 2, Rh[3]);
    }
  }
  function drawHat(P, s, dir, Rs) {
    const h = s.hat;
    if (!h) return;
    const col = s.hatCol || {
      cap: "#2a3a5a",
      helmet: "#3a4430",
      beanie: "#3a3a3a",
      hood: s.top || "#555",
      bandana: "#b83030",
      hardhat: "#e0b030",
      police: "#1e2a44",
      bike: "#c83a30"
    }[h] || "#444";
    const R = RP(col), side = dir === 1;
    if (h === "cap") {
      P.r(11, 3, 10, 1, R[3]).r(10, 4, 12, 4, R[3]).r(10, 4, 3, 4, R[4]).r(19, 4, 3, 4, R[2]).r(13, 3, 3, 1, R[5]);
      if (dir === 0) P.r(9, 8, 14, 2, R[1]).r(9, 8, 14, 1, R[2]).p(15, 5, "#e8e4d8").p(16, 5, "#e8e4d8"); else if (side) P.r(19, 7, 7, 2, R[1]).r(19, 7, 7, 1, R[2]); else P.r(10, 7, 12, 1, R[1]);
    } else if (h === "helmet") {
      P.r(12, 1, 8, 1, R[3]).r(10, 2, 12, 1, R[3]).r(9, 3, 14, 6, R[3]);
      band(P, 9, 3, 14, 6, R);
      P.r(11, 2, 5, 1, R[5]).r(8, 8, 16, 2, R[1]).r(8, 8, 16, 1, R[2]);
      if (dir !== 2 && !side) P.r(10, 10, 1, 6, "#1e1e20").r(21, 10, 1, 6, "#1e1e20");
      if (side) P.r(12, 10, 1, 6, "#1e1e20");
      P.dith(10, 4, 12, 4, R[2], 1);
    } else if (h === "beanie") {
      P.r(12, 2, 8, 1, R[3]);
      band(P, 10, 3, 12, 5, R);
      for (let x = 11; x < 22; x += 2) P.r(x, 3, 1, 4, R[2]);
      P.r(10, 7, 12, 2, R[4]).r(10, 8, 12, 1, R[2]);
    } else if (h === "hood") {
      if (dir === 0) {
        P.r(8, 3, 16, 15, R[2]);
        band(P, 8, 4, 16, 13, R);
        P.r(11, 7, 10, 10, Rs[3]);
        P.r(11, 7, 10, 1, R[0]).r(11, 8, 10, 1, Rs[1]);
        P.r(13, 11, 2, 2, "#1b1418").r(17, 11, 2, 2, "#1b1418").p(13, 11, "#f4f0e8").p(17, 11, "#f4f0e8").r(15, 14, 2, 1, Rs[0]);
      } else if (dir === 2) {
        P.r(8, 3, 16, 16, R[3]);
        band(P, 8, 3, 16, 16, R);
        P.r(12, 17, 8, 3, R[1]);
      } else {
        P.r(9, 3, 13, 15, R[3]);
        band(P, 9, 3, 13, 15, R);
        P.r(17, 7, 5, 10, Rs[3]).r(19, 11, 2, 2, "#1b1418");
      }
    } else if (h === "bandana") {
      P.r(10, 5, 12, 4, R[3]).r(10, 5, 12, 1, R[4]).r(10, 8, 12, 1, R[1]).p(12, 6, "#f0e8e0").p(16, 7, "#f0e8e0").p(19, 6, "#f0e8e0");
      if (dir === 2 || side) P.r(side ? 9 : 14, 8, 4, 3, R[2]);
    } else if (h === "hardhat") {
      P.r(12, 2, 8, 1, R[4]).r(10, 3, 12, 5, R[3]);
      band(P, 10, 3, 12, 5, R);
      P.r(14, 3, 4, 5, R[4]).r(8, 8, 16, 2, R[2]).r(8, 8, 16, 1, R[4]);
    } else if (h === "police") {
      P.r(9, 2, 14, 4, R[3]).r(9, 2, 14, 1, R[4]).r(10, 6, 12, 2, "#e8e4d8").dith(10, 6, 12, 2, "#26262a", 0);
      if (dir === 0) P.r(10, 8, 12, 2, "#101014").r(11, 8, 4, 1, "#50505a").r(15, 3, 2, 2, "#e0c050"); else if (side) P.r(19, 8, 6, 2, "#101014");
    } else if (h === "bike") {
      P.r(12, 1, 8, 1, R[3]).r(9, 2, 14, 13, R[3]);
      band(P, 9, 2, 14, 13, R);
      P.r(11, 3, 5, 1, R[5]).r(9, 8, 14, 1, "#e8e4d8");
      if (dir === 0) P.r(11, 9, 10, 4, "#1a2028").r(12, 9, 4, 1, "#6a8090"); else if (side) P.r(17, 9, 6, 4, "#1a2028").r(18, 9, 3, 1, "#6a8090");
    }
  }
  const NVC = {
    b: "#23282a",
    m: "#3c4549",
    h: "#66737a",
    s: "#191c1d",
    on: "#7dff8e",
    gl: "#e0ffe6",
    off: "#2c4634",
    og: "#567e60"
  };
  function drawNvg(P, st, dir) {
    const C2 = NVC, on = st === 2, ln = on ? C2.on : C2.off, gl = on ? C2.gl : C2.og;
    if (dir === 0) {
      if (on) {
        P.r(15, 5, 2, 5, C2.m).p(15, 5, C2.h).r(10, 9, 1, 3, C2.s).r(21, 9, 1, 3, C2.s);
        P.r(11, 10, 10, 3, C2.b);
        for (const x of [ 11, 17 ]) P.r(x, 10, 4, 4, C2.b).r(x, 10, 4, 1, C2.m).r(x + 1, 11, 2, 2, ln).p(x + 1, 11, gl);
      } else {
        P.r(15, 6, 2, 3, C2.m).r(11, 3, 10, 3, C2.b);
        for (const x of [ 11, 17 ]) P.r(x, 2, 4, 4, C2.b).r(x, 2, 4, 1, C2.h).r(x + 1, 3, 2, 2, ln).p(x + 1, 3, gl);
      }
    } else if (dir === 2) {
      P.r(10, 8, 12, 1, C2.s).r(13, 6, 6, 4, C2.b).r(13, 6, 6, 1, C2.m).p(14, 7, on ? C2.on : "#3a4a3e");
      if (on) P.r(9, 10, 1, 2, C2.b).r(22, 10, 1, 2, C2.b); else P.r(12, 1, 3, 2, C2.b).r(17, 1, 3, 2, C2.b);
    } else {
      P.r(11, 8, 8, 1, C2.s);
      if (on) {
        P.r(18, 5, 2, 5, C2.m).p(18, 5, C2.h).r(18, 10, 7, 3, C2.b).r(18, 10, 7, 1, C2.m).r(25, 10, 1, 3, ln).p(25, 11, gl);
      } else {
        P.r(18, 6, 2, 3, C2.m).r(18, 1, 4, 6, C2.b).r(18, 1, 4, 1, C2.h).r(22, 3, 2, 3, C2.b).r(19, 0, 2, 1, ln);
      }
    }
  }
  A.drawNvg = drawNvg;
  function drawCrawler(P, s, dir, fr, Rs, Rt, Rp, Rh) {
    const flip = dir === 3;
    P.x.save();
    if (flip) {
      P.x.translate(32, 0);
      P.x.scale(-1, 1);
    }
    const reach = fr % 2;
    P.shadow(16, 40, 14, 3, .4);
    P.r(1, 33, 8, 4, Rp[2]).r(1, 33, 8, 1, Rp[3]).r(0, 35, 3, 3, "#2a2622");
    P.r(8, 30, 13, 8, Rt[3]).r(8, 30, 13, 2, Rt[4]).r(8, 36, 13, 2, Rt[1]).r(12, 32, 3, 2, C.blood);
    P.r(21, 28 + reach, 8, 8, Rs[3]).r(21, 28 + reach, 8, 2, Rs[4]).r(27, 30 + reach, 2, 6, Rs[2]).r(22, 27 + reach, 6, 3, Rh[2]);
    P.r(26, 31 + reach, 2, 2, "#e8e060").p(26, 31 + reach, "#d03020").r(27, 34 + reach, 2, 1, "#3a1418");
    P.r(20, 37 - reach, 10, 2, Rs[2]).r(28, 36 - reach, 3, 2, Rs[3]);
    P.r(14, 38, 8, 1, "rgba(40,8,10,0.55)");
    P.x.restore();
  }
  const LEG_Y = 30;
  A.ARM_ZONE = {
    front: {
      x0: 8,
      x1: 23,
      y0: 18,
      y1: 31,
      cut: 20
    },
    side: {
      x0: 13,
      x1: 19,
      y0: 19,
      y1: 30
    }
  };
  function drawCustom(P, s, dir, fr, pose) {
    const cu = s.custom, v = cu.views[dir === 0 ? 0 : dir === 2 ? 1 : 2];
    if (!v) return;
    const noArms = /-na$/.test(pose || ""), sit = /^sit/.test(pose || ""), lie = /^lie/.test(pose || ""), bsit = /^benchSit/.test(pose || "");
    if (sit || lie || bsit) fr = 0;
    if (bsit) {
      const pick = (y0, y1, dflt) => {
        const m = new Map;
        for (let y = y0; y <= y1; y++) for (let x = 9; x <= 22; x++) {
          const ci = v[y * 32 + x];
          if (ci) m.set(ci, (m.get(ci) || 0) + 1);
        }
        let best = 0, bn = 0;
        for (const [k, n] of m) if (n > bn) {
          bn = n;
          best = k;
        }
        return best ? cu.pal[best] : dflt;
      };
      drawBenchLegs(P, s, dir, RP(pick(31, 36, "#3a3f4a")), RP(pick(38, 41, "#2a2622")), RP(pick(20, 27, "#55663a")));
    }
    const step = [ 0, 1, 0, -1 ][fr % 4], bob = step !== 0 ? 1 : 0, Z = A.ARM_ZONE;
    if (!lie) P.shadow(16, 41, 9, 3, .4);
    for (let y = 0; y < 44; y++) for (let x = 0; x < 32; x++) {
      let ci = v[y * 32 + x];
      if (!ci) continue;
      if (noArms) {
        if (dir !== 1 && y >= (Z.front.cut || Z.front.y0) && y <= Z.front.y1 && (x <= Z.front.x0 || x >= Z.front.x1)) continue;
        if (dir === 1 && y >= Z.side.y0 && y <= Z.side.y1 && x >= Z.side.x0 && x <= Z.side.x1) {
          ci = v[y * 32 + 12] || v[y * 32 + 20] || ci;
        }
      }
      let dx = 0, dy = 0;
      if (sit) {
        if (y < LEG_Y) dy = SIT_DY; else if (y < 35) continue;
      } else if (bsit) {
        if (y < LEG_Y) dy = BSIT_DY; else continue;
      } else if (y < LEG_Y) dy = bob; else if (dir === 1) {
        dx = x < 16 ? -step : step;
      } else {
        const lift = x < 16 ? step < 0 ? -2 : 0 : step > 0 ? -2 : 0;
        dy = y > 36 ? lift : Math.round(lift / 2);
      }
      P.p(x + dx, y + dy, cu.pal[ci] || "#f0f");
    }
    if (s.nvg) {
      P.x.save();
      P.x.translate(0, sit ? SIT_DY : bsit ? BSIT_DY : lie ? 0 : bob);
      drawNvg(P, s.nvg, dir);
      P.x.restore();
    }
  }
  A.charDraw = drawChar;
  A.LOOK = {
    hairStyle: [ [ "short", "짧은 머리" ], [ "buzz", "빡빡이" ], [ "long", "긴 머리" ], [ "bob", "단발머리" ], [ "pony", "묶은 머리" ], [ "mohawk", "닭벼슬" ], [ "spiky", "삐죽" ], [ "bald", "대머리" ] ],
    topStyle: [ [ "jacket", "점퍼" ], [ "hoodie", "후드티" ], [ "tee", "반팔" ], [ "coat", "코트" ], [ "uniform", "제복" ], [ "suit", "정장" ], [ "camo", "위장복" ], [ "rags", "누더기" ] ],
    hat: [ [ null, "없음" ], [ "cap", "모자" ], [ "helmet", "방탄모" ], [ "beanie", "비니" ], [ "hood", "후드" ], [ "bandana", "두건" ], [ "hardhat", "안전모" ], [ "police", "경찰모" ], [ "bike", "배달 헬멧" ] ],
    mask: [ [ null, "없음" ], [ "white", "흰 마스크" ], [ "black", "검은 마스크" ], [ "gas", "방독면" ] ],
    skin: [ "#f0c8a0", "#e0b48c", "#c79871", "#9c7050", "#6e4c34", "#8a9a6a" ],
    colors: [ "#1e1812", "#3a2a1e", "#6a4a2a", "#a07040", "#d8b060", "#e8e4d8", "#9a9a9a", "#3a3a3a", "#121214", "#6a1e1e", "#b83030", "#e06a30", "#e0b030", "#5a6a2a", "#3d4a2c", "#2a4a2a", "#3a8a4a", "#2a5a6a", "#1e2a44", "#3a5aa0", "#6ab0d0", "#5a3a7a", "#a05a9a", "#e8a0b0" ]
  };
  A.PRESETS = [ {
    id: "survivor",
    story: "",
    name: "생존자",
    look: {
      hairStyle: "short",
      hair: "#1e1812",
      skin: "#e0b48c",
      topStyle: "jacket",
      top: "#56663c",
      pants: "#3a3f4a",
      boot: "#2a2622",
      vest: "#3d4a2c",
      pack: "#6a5838",
      hat: "cap",
      hatCol: "#3a3f2c"
    }
  }, {
    id: "soldier",
    story: "",
    name: "군인",
    look: {
      hairStyle: "buzz",
      hair: "#1e1812",
      skin: "#c79871",
      topStyle: "camo",
      top: "#4f5a38",
      pants: "#3f4630",
      boot: "#1e1a16",
      vest: "#3a4228",
      pack: "#4a4a30",
      hat: "helmet",
      hatCol: "#3f4a30"
    }
  }, {
    id: "police",
    story: "",
    name: "경찰",
    look: {
      hairStyle: "short",
      hair: "#121214",
      skin: "#e0b48c",
      topStyle: "uniform",
      top: "#26324e",
      pants: "#1e2436",
      boot: "#121214",
      vest: "#2a2a30",
      hivis: true,
      hat: "police",
      hatCol: "#1e2a44"
    }
  }, {
    id: "office",
    story: "",
    name: "회사원",
    look: {
      hairStyle: "short",
      hair: "#2a2019",
      skin: "#f0c8a0",
      topStyle: "suit",
      top: "#2a2e38",
      pants: "#24272f",
      boot: "#121214",
      tie: "#a83232",
      pack: "#3a3a3a"
    }
  }, {
    id: "student",
    story: "",
    name: "학생",
    look: {
      hairStyle: "bob",
      hair: "#1e1812",
      skin: "#f0c8a0",
      topStyle: "jacket",
      top: "#1e2a44",
      pants: "#3a3a44",
      boot: "#e8e4d8",
      pack: "#3a5aa0"
    }
  }, {
    id: "rider",
    story: "",
    name: "배달원",
    look: {
      hairStyle: "short",
      hair: "#1e1812",
      skin: "#c79871",
      topStyle: "jacket",
      top: "#b83030",
      pants: "#2a2a30",
      boot: "#2a2622",
      pack: "#e8e4d8",
      hat: "bike",
      hatCol: "#e8e4d8"
    }
  }, {
    id: "hiker",
    story: "",
    name: "등산객",
    look: {
      hairStyle: "short",
      hair: "#6a4a2a",
      skin: "#c79871",
      topStyle: "jacket",
      top: "#e06a30",
      pants: "#3a3a3a",
      boot: "#6a4a2a",
      pack: "#2a5a6a",
      hat: "beanie",
      hatCol: "#3a8a4a",
      beard: true
    }
  }, {
    id: "doctor",
    story: "",
    name: "의사",
    look: {
      hairStyle: "pony",
      hair: "#2a2019",
      skin: "#f0c8a0",
      topStyle: "coat",
      top: "#e8e8e2",
      pants: "#2a4a5a",
      boot: "#e8e4d8",
      mask: "white"
    }
  }, {
    id: "builder",
    story: "",
    name: "공사장 인부",
    look: {
      hairStyle: "short",
      hair: "#1e1812",
      skin: "#9c7050",
      topStyle: "tee",
      top: "#6a6a6a",
      pants: "#3a4a6a",
      boot: "#6a4a2a",
      hivis: true,
      hat: "hardhat",
      hatCol: "#e0b030",
      gloves: true
    }
  }, {
    id: "drifter",
    story: "",
    name: "떠돌이",
    look: {
      hairStyle: "long",
      hair: "#3a2a1e",
      skin: "#c79871",
      topStyle: "rags",
      top: "#5a4a34",
      pants: "#3a3228",
      boot: "#2a2622",
      hat: "hood",
      hatCol: "#4a3a2a",
      beard: true,
      pack: "#453a2a"
    }
  }, {
    id: "punk",
    story: "",
    name: "펑크",
    look: {
      hairStyle: "mohawk",
      hair: "#b83030",
      skin: "#f0c8a0",
      topStyle: "jacket",
      top: "#121214",
      pants: "#2a2a30",
      boot: "#121214",
      goggles: true
    }
  }, {
    id: "gasmask",
    story: "",
    name: "방독면",
    look: {
      hairStyle: "short",
      hair: "#121214",
      skin: "#c79871",
      topStyle: "hoodie",
      top: "#3a3f38",
      pants: "#2a2c28",
      boot: "#1e1a16",
      mask: "gas",
      vest: "#2a2a2a",
      pack: "#3a3a2a",
      hat: "hood",
      hatCol: "#3a3f38"
    }
  } ];
  A.charSpec = function(kind, g) {
    g = g || SX.rnd;
    if (kind === "player") {
      const look = SX.game && SX.game.save && SX.game.save.look || A.PRESETS[0].look;
      if (look.custom) {
        const cu = A.decodeCustom(look.custom);
        if (cu) return {
          key: "plc" + SX.hash(look.custom),
          kind,
          custom: cu,
          keepArms: !!look.keepArms
        };
      }
      return Object.assign({
        key: "pl" + SX.hash(JSON.stringify(look)),
        kind
      }, look);
    }
    if (kind === "zombie") {
      const s = {
        kind,
        top: g.pick([ "#4a4438", "#3f3b30", "#53483a", "#2f3a42", "#6a4a3a", "#5a5a52", "#704f38", "#7a7466", "#8a8a80", "#5a2a2a", "#2a3a5a" ]),
        topStyle: g.pick([ "jacket", "tee", "rags", "coat", "suit", "hoodie", "uniform" ]),
        pants: g.pick([ "#3a372c", "#2c3040", "#44392a", "#2e2e2e" ]),
        skin: g.pick([ C.zskin, C.zskin2, "#7f8a62", "#8d8a6a", "#9aa08a" ]),
        hair: g.pick([ "#2a2a22", "#4a4a3a", "#1a1a16", "#6a6a5a" ]),
        hairStyle: g.pick([ "short", "short", "long", "bald", "buzz", "bob" ]),
        torn: g.chance(.5),
        boot: g.pick([ "#2a2622", "#3a3a3a", "#5a4a3a" ])
      };
      if (s.topStyle === "coat" && g.chance(.5)) s.top = "#d8d8d0";
      s.key = "z" + SX.hash(JSON.stringify(s));
      return s;
    }
    if (kind === "scav") {
      const s = {
        kind,
        top: g.pick([ "#3a4a30", "#4a3a28", "#3b4250", "#5a4a34", "#2f3a35", "#43312a", "#30302f" ]),
        topStyle: g.pick([ "jacket", "hoodie", "camo", "uniform", "rags" ]),
        pants: g.pick([ "#2a3020", "#33302a", "#2c3444", "#262626" ]),
        skin: g.pick([ C.skin1, C.skin2, C.skin3 ]),
        hair: g.pick([ "#2a2019", "#141110", "#5a4630" ]),
        hairStyle: g.pick([ "short", "buzz", "long", "bald" ]),
        vest: g.chance(.6) ? g.pick([ "#2b3324", "#3a3428", "#2d2d2d" ]) : null,
        pack: g.chance(.5) ? g.pick([ "#38301e", "#2f3630", "#453a2a" ]) : null,
        beard: g.chance(.3),
        gloves: g.chance(.4),
        hat: g.pick([ "helmet", "beanie", "hood", "bandana", "cap", null ]),
        hatCol: g.pick([ "#27301c", "#2e2e2e", "#3a3324", "#4a2f28" ]),
        mask: g.pick([ null, null, "black", "gas" ])
      };
      s.key = "s" + SX.hash(JSON.stringify(s));
      return s;
    }
    if (kind === "trader") {
      const s = {
        kind,
        top: g.pick([ "#6a4a3a", "#3a5a6a", "#5a5a3a", "#4a3a5a", "#7a3a2a" ]),
        topStyle: g.pick([ "jacket", "hoodie", "tee", "coat" ]),
        pants: "#2a2c30",
        skin: g.pick([ C.skin1, C.skin2, C.skin3 ]),
        hairStyle: g.pick([ "short", "bald", "long", "pony" ]),
        hair: g.pick([ "#1e1812", "#6a6a6a", "#3a2a1e" ]),
        hat: g.pick([ "cap", "beanie", null, "bandana" ]),
        hatCol: g.pick([ "#4a3a2a", "#2a3a5a", "#6a2a2a" ]),
        vest: g.chance(.4) ? "#5a4a2a" : null,
        beard: g.chance(.3)
      };
      s.key = "tr" + SX.hash(JSON.stringify(s));
      return s;
    }
    return {
      key: "npc",
      kind,
      top: "#555",
      pants: "#333"
    };
  };
  A.encodeCustom = function(cu) {
    const bytes = [ cu.pal.length ];
    for (let k = 0; k < cu.pal.length; k++) {
      const [r, g, b] = hexRgb(cu.pal[k] || "#000000");
      bytes.push(r, g, b);
    }
    for (let vi = 0; vi < 3; vi++) {
      const v = cu.views[vi];
      let i = 0;
      while (i < 32 * 44) {
        const c = v[i];
        let n = 1;
        while (i + n < 32 * 44 && v[i + n] === c && n < 255) n++;
        bytes.push(n, c);
        i += n;
      }
    }
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return "SXC1." + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  A.decodeCustom = function(code) {
    try {
      code = String(code).trim();
      if (!code.startsWith("SXC1.")) return null;
      let b64 = code.slice(5).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bin = atob(b64), by = [];
      for (let i = 0; i < bin.length; i++) by.push(bin.charCodeAt(i));
      let p = 0;
      const n = by[p++];
      if (!n || n > 64) return null;
      const pal = [];
      for (let k = 0; k < n; k++) {
        pal.push(rgbHex(by[p], by[p + 1], by[p + 2]));
        p += 3;
      }
      const views = [];
      for (let vi = 0; vi < 3; vi++) {
        const v = new Uint8Array(32 * 44);
        let i = 0;
        while (i < 32 * 44) {
          if (p + 1 >= by.length + 1) return null;
          const cnt = by[p++], c = by[p++];
          if (!cnt) return null;
          v.fill(c >= n ? 0 : c, i, Math.min(32 * 44, i + cnt));
          i += cnt;
        }
        views.push(v);
      }
      return {
        pal,
        views
      };
    } catch (e) {
      return null;
    }
  };
  A.CUSTOM_MIN = 240;
  A.customStats = function(cu) {
    const views = cu.views.map(v => {
      let n = 0, x0 = 99, x1 = -1, y0 = 99, y1 = -1;
      for (let i = 0; i < v.length; i++) if (v[i]) {
        n++;
        const x = i % 32, y = i / 32 | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      return {
        n,
        w: n ? x1 - x0 + 1 : 0,
        h: n ? y1 - y0 + 1 : 0
      };
    });
    return {
      ok: views.every(s => s.n >= A.CUSTOM_MIN && s.h >= 28 && s.w >= 10),
      views,
      min: Math.min(...views.map(s => s.n))
    };
  };
  A.customOk = cu => !cu || A.customStats(cu).ok;
  A.publicSpec = function(spec) {
    if (!spec || !spec.custom || A.customOk(spec.custom)) return spec;
    return Object.assign({
      key: "pubfb",
      kind: spec.kind || "player",
      fallback: true
    }, A.PRESETS[0].look);
  };
  A.customFromLook = function(look) {
    const spec = Object.assign({
      key: "tmp" + Math.random(),
      kind: "player"
    }, look);
    const pal = [ null ], idx = new Map, views = [];
    for (const dir of [ 0, 2, 1 ]) {
      const c = mk(32, 44), P = new Pen(c.getContext("2d"));
      drawChar(P, spec, dir, 0, "walk");
      const d = c.getContext("2d").getImageData(0, 0, 32, 44).data, v = new Uint8Array(32 * 44);
      for (let i = 0; i < 32 * 44; i++) {
        if (d[i * 4 + 3] < 200) continue;
        const hx = rgbHex(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
        let k = idx.get(hx);
        if (k == null) {
          if (pal.length >= 63) k = nearest(pal, hx); else {
            k = pal.length;
            pal.push(hx);
            idx.set(hx, k);
          }
        }
        v[i] = k;
      }
      views.push(v);
    }
    pal[0] = "#000000";
    return {
      pal,
      views
    };
  };
  function nearest(pal, hx) {
    const [r, g, b] = hexRgb(hx);
    let best = 1, bd = 1e9;
    for (let k = 1; k < pal.length; k++) {
      const [r2, g2, b2] = hexRgb(pal[k]);
      const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  }
  A.WPN = {};
  A.MEL = {};
  const MUZ_W = {
    "권총 소음기": 7,
    "소총 소음기": 9,
    보정기: 3,
    소염기: 3,
    "산탄 초크": 2
  }, SIGHT_H = {
    "레드닷 사이트": 3,
    "홀로그램 사이트": 3,
    "4배율 조준경": 3
  };
  A.weapon = function(def) {
    if (!def) return null;
    const w = A.WPN[def.name];
    const mods = w && def.mods ? (SX.PART_SLOTS || []).map(s => def.mods[s] && def.mods[s].name).filter(Boolean) : [];
    if (w && mods.length) {
      const md = s => def.mods[s] && def.mods[s].name;
      const mz = md("muzzle"), si = md("sight"), ext = MUZ_W[mz] || 0, top = SIGHT_H[si] || 0;
      const c = cached("wp" + def.name + "|" + mods.join(","), w.w + ext, w.h + top, P => {
        const b = mk(w.w, w.h);
        w.draw(new Pen(b.getContext("2d")));
        const d = b.getContext("2d").getImageData(0, 0, w.w, w.h).data, on = (x, y) => d[(y * w.w + x) * 4 + 3] > 100;
        let xr = w.w - 1;
        while (xr > 0 && ![ ...Array(w.h).keys() ].some(y => on(xr, y))) xr--;
        const ys = [ ...Array(w.h).keys() ].filter(y => on(xr, y)), my = ys.length ? Math.round(ys.reduce((s, y) => s + y, 0) / ys.length) : w.h >> 1;
        const topAt = x => {
          for (let y = 0; y < w.h; y++) if (on(x, y)) return y;
          return w.h >> 1;
        };
        const botAt = x => {
          for (let y = w.h - 1; y >= 0; y--) if (on(x, y)) return y;
          return w.h >> 1;
        };
        P.x.drawImage(b, 0, top);
        const Y = my + top, X = xr + 1;
        if (mz === "권총 소음기" || mz === "소총 소음기") {
          const hh = mz === "소총 소음기" ? 5 : 4;
          P.r(X, Y - 2, ext, hh, "#1c1d21").r(X, Y - 2, ext, 1, "#3e424a").r(X + ext - 1, Y - 1, 1, hh - 2, "#0a0b0d");
          for (let x = X + 2; x < X + ext - 1; x += 3) P.p(x, Y + hh - 3, "#101114");
        } else if (mz === "보정기") {
          P.r(X, Y - 1, 3, 3, "#2a2c32").p(X + 1, Y - 1, "#0a0b0d");
        } else if (mz === "소염기") {
          P.r(X, Y - 1, 3, 3, "#2a2c32").p(X + 1, Y, "#0a0b0d").p(X + 2, Y - 1, "#3e424a").p(X + 2, Y + 1, "#3e424a");
        } else if (mz === "산탄 초크") {
          P.r(X, Y - 1, 2, 3, "#6a6e76").p(X, Y - 1, "#c8a048");
        }
        if (si) {
          const sx = Math.round(w.w * .42), ty = topAt(sx) + top;
          if (si === "4배율 조준경") {
            P.r(sx - 4, ty - 3, 11, 3, "#2a2c32").r(sx - 4, ty - 3, 11, 1, "#454951").p(sx + 6, ty - 2, "#8fd0ea").p(sx - 4, ty - 2, "#6fb0d4");
          } else {
            P.r(sx, ty - 3, 4, 3, "#2a2c32").p(sx + 1, ty - 2, si === "레드닷 사이트" ? "#ff5a4a" : "#8fd0ea");
          }
        }
        if (md("laser")) {
          const lx = Math.max(2, xr - 7);
          P.r(lx, Y + 2, 3, 2, "#2a2c32").p(lx + 2, Y + 2, "#ff5a4a");
        }
        if (md("grip")) {
          const gx2 = Math.round(w.w * .68), by = botAt(gx2) + top;
          P.r(gx2, by + 1, 2, 3, "#2e3036").p(gx2, by + 1, "#4e525c");
        }
        if (md("mag") && /대용량/.test(md("mag"))) {
          const mx2 = Math.round(w.w * .45), by = botAt(mx2) + top;
          if (by + 3 < w.h + top) P.r(mx2, by + 1, 3, 2, "#34373e");
        }
      }, {
        mat: true
      });
      return {
        c,
        gx: w.gx,
        gy: w.gy + top
      };
    }
    if (w) return {
      c: cached("wp" + def.name, w.w, w.h, P => w.draw(P), {
        mat: true
      }),
      gx: w.gx,
      gy: w.gy
    };
    const st = def.style || "knife", m = A.MEL[st] || A.MEL.knife;
    if (!m) return null;
    return {
      c: cached("wm" + st, m.w, m.h, P => m.draw(P), {
        mat: true
      }),
      gx: m.gx,
      gy: m.gy
    };
  };
  A.hud = function(name, col) {
    return cached("hud" + name + (col || ""), 16, 16, P => {
      if (name === "virus") {
        P.ball(8, 8, 5, 5, col || "#8fd14a");
        for (const [x, y] of [ [ 8, 1 ], [ 8, 14 ], [ 1, 8 ], [ 14, 8 ], [ 3, 3 ], [ 12, 3 ], [ 3, 12 ], [ 12, 12 ] ]) P.r(x, y, 2, 2, col || "#8fd14a");
        P.p(6, 7, "#2a3a1a").p(9, 10, "#2a3a1a");
      } else if (name === "gas") {
        for (let k = 0; k < 3; k++) P.ball(4 + k * 4, 9 - k % 2 * 2, 3, 3, col || "#b6e36a");
      } else if (name === "armor") {
        P.block(3, 2, 10, 2, 10, col || "#8a9a6a");
        P.r(3, 2, 3, 3, "rgba(0,0,0,0)");
        P.x.clearRect(3, 2, 3, 3);
        P.x.clearRect(10, 2, 3, 3);
      } else if (name === "weight") {
        P.block(3, 5, 10, 3, 8, col || "#c8a060");
        P.r(6, 2, 4, 3, "#3a3a3a");
      } else if (name === "bleed") {
        P.poly([ [ 8, 1 ], [ 13, 9 ], [ 12, 13 ], [ 8, 15 ], [ 4, 13 ], [ 3, 9 ] ], col || "#d23a45");
        P.r(6, 8, 2, 3, "#ff9090");
      } else if (name === "light") {
        P.hcyl(1, 6, 9, 5, "#555a60");
        P.r(10, 4, 4, 9, "#3a3d42").r(11, 5, 2, 7, col || "#f0f0a0");
      } else if (name === "clock") {
        P.ball(8, 8, 6, 6, col || "#d8d2bd", {
          flat: true
        });
        P.r(8, 4, 1, 5, "#1a1a1a").r(8, 8, 4, 1, "#1a1a1a");
      } else if (name === "ping") {
        P.poly([ [ 8, 1 ], [ 14, 7 ], [ 8, 15 ], [ 2, 7 ] ], col || "#ff8a5b");
        P.r(7, 5, 2, 3, "#fff0d0");
      } else if (name === "bleedH") {
        P.poly([ [ 5, 1 ], [ 9, 8 ], [ 8, 12 ], [ 5, 13 ], [ 2, 12 ], [ 1, 8 ] ], col || "#ff4a4a");
        P.poly([ [ 11, 3 ], [ 15, 10 ], [ 14, 14 ], [ 11, 15 ], [ 8, 14 ], [ 7, 10 ] ], col || "#ff4a4a");
        P.r(3, 7, 1, 3, "#ffb0b0").r(9, 9, 1, 3, "#ffb0b0");
      } else if (name === "bone") {
        const c = col || "#e8dcc0";
        P.line(3, 12, 12, 3, c).line(4, 12, 13, 3, c).line(3, 13, 12, 4, c);
        for (const [x, y] of [ [ 2, 11 ], [ 4, 13 ], [ 11, 2 ], [ 13, 4 ] ]) P.ball(x, y, 2, 2, c);
        P.r(7, 7, 2, 2, "#1a1a1a");
        P.p(9, 6, "#1a1a1a");
      } else if (name === "pain") {
        const c = col || "#f0c451";
        P.poly([ [ 9, 0 ], [ 3, 9 ], [ 7, 9 ], [ 5, 16 ], [ 13, 6 ], [ 9, 6 ], [ 11, 0 ] ], c);
      } else if (name === "germ") {
        const c = col || "#9ad14a";
        P.ball(8, 8, 4, 4, c);
        for (const [x, y] of [ [ 8, 2 ], [ 8, 13 ], [ 2, 8 ], [ 13, 8 ], [ 4, 4 ], [ 11, 4 ], [ 4, 11 ], [ 11, 11 ] ]) P.r(x, y, 1, 2, c);
        P.p(7, 7, "#2a3a1a").p(9, 9, "#2a3a1a").p(9, 6, "#2a3a1a");
      } else if (name === "bolt") {
        const c = col || "#6fd0ff";
        P.poly([ [ 10, 0 ], [ 3, 9 ], [ 8, 9 ], [ 6, 16 ], [ 13, 6 ], [ 8, 6 ], [ 11, 0 ] ], c);
      } else if (name === "heart") {
        const c = col || "#ff6a8a";
        P.ball(5, 6, 4, 4, c);
        P.ball(11, 6, 4, 4, c);
        P.poly([ [ 1, 7 ], [ 15, 7 ], [ 8, 15 ] ], c);
        P.r(7, 3, 2, 7, "#fff").r(5, 5, 6, 2, "#fff");
      } else if (name === "shield") {
        P.poly([ [ 8, 1 ], [ 14, 4 ], [ 13, 10 ], [ 8, 15 ], [ 3, 10 ], [ 2, 4 ] ], col || "#6fe06a");
        P.r(7, 4, 2, 8, "#1a3a1a").r(4, 7, 8, 2, "#1a3a1a");
      } else if (name === "food") {
        const c = col || "#d8a860";
        P.ball(8, 9, 6, 4, c);
        P.r(3, 9, 11, 4, c);
        P.r(5, 6, 1, 3, "#8a5a2a").r(8, 5, 1, 3, "#8a5a2a").r(11, 6, 1, 3, "#8a5a2a");
      } else if (name === "water") {
        const c = col || "#6ab8f0";
        P.poly([ [ 8, 1 ], [ 13, 9 ], [ 12, 13 ], [ 8, 15 ], [ 4, 13 ], [ 3, 9 ] ], c);
        P.r(5, 9, 2, 3, "#e0f4ff");
      } else if (name === "god") {
        P.poly([ [ 8, 1 ], [ 14, 4 ], [ 13, 10 ], [ 8, 15 ], [ 3, 10 ], [ 2, 4 ] ], col || "#f0d060");
        P.poly([ [ 8, 4 ], [ 11, 6 ], [ 10, 10 ], [ 8, 12 ], [ 6, 10 ], [ 5, 6 ] ], "#3a3010");
      } else if (name === "eye") {
        const c = col || "#fff6c8";
        P.poly([ [ 1, 8 ], [ 5, 4 ], [ 11, 4 ], [ 15, 8 ], [ 11, 12 ], [ 5, 12 ] ], c);
        P.ball(8, 8, 3, 3, "#1a1a1a", {
          flat: true
        });
        P.p(7, 7, "#ffffff");
      } else if (name === "rain") {
        const c = col || "#8ab4e8";
        P.ball(6, 5, 4, 3, "#9aa0a8").ball(10, 5, 4, 3, "#b8bec6").r(3, 6, 11, 2, "#9aa0a8");
        for (const [x, y] of [ [ 4, 10 ], [ 8, 11 ], [ 12, 10 ], [ 6, 14 ], [ 10, 14 ] ]) P.r(x, y, 1, 2, c);
      } else if (name === "fog") {
        const c = col || "#c8ccd2";
        for (const [y, x0, w] of [ [ 3, 2, 10 ], [ 6, 4, 11 ], [ 9, 1, 12 ], [ 12, 3, 10 ] ]) P.r(x0, y, w, 2, c).r(x0, y, 2, 2, "#e8ecf0");
      } else if (name === "storm") {
        const c = col || "#9ab8ff";
        P.ball(6, 4, 4, 3, "#6a7078").ball(10, 4, 4, 3, "#828890").r(3, 5, 11, 2, "#6a7078");
        P.poly([ [ 9, 7 ], [ 5, 12 ], [ 8, 12 ], [ 6, 16 ], [ 12, 10 ], [ 9, 10 ], [ 11, 7 ] ], "#ffe66a");
        P.r(3, 10, 1, 2, c).r(13, 9, 1, 2, c);
      } else if (name === "nvg") {
        const c = col || "#7dff8e";
        P.r(3, 4, 10, 2, "#3c4549").r(7, 2, 2, 3, "#3c4549");
        for (const x of [ 2, 9 ]) P.r(x, 6, 5, 6, "#23282a").r(x + 1, 7, 3, 4, c).p(x + 1, 7, "#e0ffe6");
      } else if (name === "person") {
        const c = col || "#8fd0ff";
        P.ball(8, 4, 3, 3, c);
        P.poly([ [ 3, 15 ], [ 4, 10 ], [ 6, 8 ], [ 10, 8 ], [ 12, 10 ], [ 13, 15 ] ], c);
        P.p(7, 3, "#ffffff");
      } else if (name === "wrench") {
        const c = col || "#c8ccd2";
        P.thick(4, 12, 10, 6, 3, c);
        P.ball(11, 5, 3, 3, c);
        P.x.clearRect(11, 2, 2, 4);
        P.ball(4, 12, 2, 2, c);
      } else if (name === "medkit") {
        const c = col || "#f2f2f2";
        P.r(6, 2, 4, 2, "#8a8f96");
        P.r(2, 4, 12, 10, c);
        P.r(7, 6, 2, 6, "#d23a45").r(5, 8, 6, 2, "#d23a45");
      } else if (name === "bullet") {
        const c = col || "#e0b050";
        for (const x of [ 3, 7, 11 ]) {
          P.r(x, 6, 3, 8, c);
          P.r(x, 4, 3, 2, "#c8805a").p(x + 1, 3, "#c8805a");
          P.r(x, 12, 3, 1, "#8a6a2a");
        }
      } else if (name === "bottle") {
        const c = col || "#9ad0a0";
        P.r(7, 1, 2, 2, "#8a5a2a");
        P.r(7, 3, 2, 3, c);
        P.r(5, 6, 6, 9, c);
        P.r(6, 9, 4, 3, "#f0ead0");
      } else if (name === "safe") {
        const c = col || "#b8a070";
        P.r(2, 3, 12, 11, c);
        P.r(4, 5, 8, 7, "#5a4a30");
        P.ball(8, 8, 2, 2, c);
        P.p(8, 8, "#2a2216");
        P.r(3, 14, 2, 1, "#5a4a30").r(11, 14, 2, 1, "#5a4a30");
      }
    }, {
      sel: true
    });
  };
  A.app = function(name) {
    return cached("app" + name, 24, 24, P => {
      const c = "#9be89a";
      if (name === "map") {
        P.r(3, 5, 18, 14, c).r(4, 6, 16, 12, "#0c140e").line(4, 14, 10, 8, c).line(10, 8, 14, 12, c).line(14, 12, 20, 7, c).r(15, 13, 3, 3, "#ff8a5b");
      } else if (name === "status") {
        P.oval(12, 7, 4, 4, c).r(6, 13, 12, 8, c).r(11, 15, 2, 4, "#0c140e").r(10, 16, 4, 2, "#0c140e");
      } else if (name === "notes") {
        P.r(5, 3, 14, 18, c).r(7, 6, 10, 1, "#0c140e").r(7, 9, 10, 1, "#0c140e").r(7, 12, 7, 1, "#0c140e").r(7, 15, 9, 1, "#0c140e");
      } else if (name === "keys") {
        P.r(2, 7, 20, 11, c);
        for (let y = 9; y < 17; y += 3) for (let x = 4; x < 21; x += 3) P.r(x, y, 2, 2, "#0c140e");
      } else if (name === "radio") {
        P.r(6, 8, 12, 14, c).r(15, 2, 2, 7, c).r(8, 10, 8, 4, "#0c140e").r(9, 11, 3, 2, c);
      }
    });
  };
  A.bloodSplat = function(ctx, x, y, g, big) {
    const P = new Pen(ctx);
    const n = big ? 60 : 22;
    for (let i = 0; i < n; i++) {
      const a = g.f() * Math.PI * 2, r = g.f() * (big ? 18 : 10);
      P.r(x + Math.cos(a) * r, y + Math.sin(a) * r * .7, 1 + g.i(3), 1 + g.i(2), g.chance(.7) ? C.blood : C.blood2);
    }
    if (big) {
      P.oval(x, y, 7, 4, C.blood2);
      P.oval(x - 1, y - 1, 4, 2, C.blood);
      P.p(x - 2, y - 2, "#b8343a");
    }
  };
  A.bloodSpray = function(ctx, x, y, g, a, n, L, lm) {
    const P = new Pen(ctx), M = Math.max(4, Math.min(L, lm));
    for (let i = 0; i < 7; i++) P.r(x + g.i(7) - 3, y + g.i(5) - 2, 1 + g.i(2), 1 + g.i(2), g.chance(.6) ? C.blood : C.blood2);
    for (let k = 0; k < n; k++) {
      const da = (g.f() - .5) * (.35 + .45 * g.f()), ca = Math.cos(a + da), sa = Math.sin(a + da);
      const len = M * (.45 + .55 * g.f()), st = 2 + g.i(3), hl = Math.max(st + 2, Math.round(len * (.35 + .2 * g.f())));
      const x0 = Math.round(x + ca * st), y0 = Math.round(y + sa * st), x1 = Math.round(x + ca * hl), y1 = Math.round(y + sa * hl);
      if (g.chance(.6)) P.thick(x0, y0, x1, y1, 2, C.blood2);
      P.line(x0, y0, x1, y1, C.blood);
      for (let t = hl + 2; t < len; t += 2 + g.i(3)) P.p(x + ca * t, y + sa * t, g.chance(.55) ? C.blood : C.blood2);
      for (let j = 0, J = 1 + g.i(3); j < J; j++) {
        const t = Math.min(M, len + 1 + g.i(4));
        P.r(x + ca * t + g.i(3) - 1, y + sa * t + g.i(3) - 1, 1 + g.i(2), 1 + g.i(2), g.chance(.5) ? C.blood : C.blood2);
      }
      if (g.chance(.3)) P.p(x1, y1 - 1, "#b8343a");
    }
  };
  const WB_C = new WeakMap;
  A.wallBlood = function(d, FH) {
    let c = WB_C.get(d);
    if (c && c.height === FH) return c;
    c = document.createElement("canvas");
    c.width = TS;
    c.height = FH;
    WB_C.set(d, c);
    const P = new Pen(c.getContext("2d")), g = new SX.Rng(d.seed), x = Math.round(d.u * TS), y = Math.max(4, FH - Math.round(d.v)), R = d.big ? 7 : 5;
    for (let i = 0, n = d.big ? 26 : 14; i < n; i++) {
      const a = g.f() * Math.PI * 2, r = g.f() * R;
      P.r(x + Math.cos(a) * r, y + Math.sin(a) * r * .8, 1 + g.i(2), 1 + g.i(2), g.chance(.65) ? C.blood : C.blood2);
    }
    P.oval(x, y, d.big ? 3 : 2, d.big ? 2 : 1, C.blood2);
    P.p(x - 1, y - 1, C.blood);
    for (let j = 0, J = 1 + g.i(d.big ? 3 : 2); j < J; j++) {
      const dx = x + g.i(R * 2 + 1) - R, len = Math.min(3 + g.i(d.big ? 9 : 6), FH - y - 2);
      if (len > 0) {
        P.r(dx, y, 1, len, C.blood2);
        P.p(dx, y + len, C.blood);
      }
    }
    return c;
  };
})(window.SX);
