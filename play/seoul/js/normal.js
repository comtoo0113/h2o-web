"use strict";

(function(SX) {
  const N = SX.normal = {};
  const DEG = Math.PI / 180;
  N.on = true;
  N.uNd = .35;
  N.STR = 4;
  N.STRT = 5;
  N.STRB = 2;
  N.STEPS = 5;
  N.QMAX = .6;
  N.EL = 35;
  N.DIRS = 8;
  N.ZT = 11;
  N.ZL = 18;
  N.BUDGET = 14 * 1048576;
  N.DMIN = 26;
  N.st = {
    atlas: 0,
    bytes: 0,
    evict: 0,
    tiles: 0,
    chunks: 0,
    ms3: 0,
    dots3: 0,
    err: ""
  };
  function pmod(a, n) {
    return (a % n + n) % n;
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function luma(r, g, b) {
    return (.299 * r + .587 * g + .114 * b) / 255;
  }
  function reader(h, W, H, wrap) {
    return function(x, y) {
      if (wrap) {
        x = pmod(x, W);
        y = pmod(y, H);
      } else {
        x = clamp(x, 0, W - 1);
        y = clamp(y, 0, H - 1);
      }
      return h[y * W + x];
    };
  }
  function blurHeight(h, W, H, r, wrap) {
    if (!r) return Float32Array.from(h);
    const at = reader(h, W, H, wrap !== false), o = new Float32Array(W * H), n = (2 * r + 1) * (2 * r + 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) s += at(x + dx, y + dy);
      o[y * W + x] = s / n;
    }
    return o;
  }
  function heightFromAlbedo(rgba, W, H, o) {
    o = o || {};
    let h = new Float32Array(W * H), lo = 1e9, hi = -1e9, i;
    for (i = 0; i < W * H; i++) {
      let v = luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      if (o.invert) v = 1 - v;
      h[i] = v;
    }
    h = blurHeight(h, W, H, o.blur == null ? 1 : o.blur, o.wrap !== false);
    if (o.spread !== false) {
      for (i = 0; i < h.length; i++) {
        if (h[i] < lo) lo = h[i];
        if (h[i] > hi) hi = h[i];
      }
      const k = 1 / (hi - lo || 1);
      for (i = 0; i < h.length; i++) h[i] = (h[i] - lo) * k;
    }
    return h;
  }
  function distField(seed, W, H, edgeSeed) {
    const INF = 1e9, d = new Float32Array(W * H), R2 = Math.SQRT2;
    let x, y, i;
    for (i = 0; i < W * H; i++) d[i] = seed[i] ? 0 : INF;
    if (edgeSeed) for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      const e = Math.min(x + 1, y + 1, W - x, H - y);
      if (e < d[i]) d[i] = e;
    }
    function rd(xx, yy) {
      return xx < 0 || yy < 0 || xx >= W || yy >= H ? edgeSeed ? 0 : INF : d[yy * W + xx];
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      let v = d[i];
      v = Math.min(v, rd(x - 1, y) + 1, rd(x, y - 1) + 1, rd(x - 1, y - 1) + R2, rd(x + 1, y - 1) + R2);
      d[i] = v;
    }
    for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) {
      i = y * W + x;
      let w = d[i];
      w = Math.min(w, rd(x + 1, y) + 1, rd(x, y + 1) + 1, rd(x + 1, y + 1) + R2, rd(x - 1, y + 1) + R2);
      d[i] = w;
    }
    return d;
  }
  function profile(d, b, kind) {
    const t = clamp(d / b, 0, 1);
    if (kind === "linear") return t;
    if (kind === "flat") return t > 0 ? 1 : 0;
    const u = 1 - t;
    return Math.sqrt(Math.max(0, 1 - u * u));
  }
  function heightFromSprite(rgba, W, H, o) {
    o = o || {};
    const bevel = o.bevel || 3, thr = o.alphaThr == null ? 128 : o.alphaThr, rthr = o.regionThr == null ? .14 : o.regionThr;
    const rw = o.regionWeight == null ? .35 : o.regionWeight, det = o.detail == null ? .15 : o.detail, kind = o.profile || "round";
    const n = W * H, empty = new Uint8Array(n), edge = new Uint8Array(n), L = new Float32Array(n);
    let i, x, y;
    for (i = 0; i < n; i++) {
      empty[i] = rgba[i * 4 + 3] < thr ? 1 : 0;
      L[i] = luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    }
    const nb = [ [ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ 0, -1 ] ];
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (empty[i]) continue;
      for (let k = 0; k < 4; k++) {
        const xx = x + nb[k][0], yy = y + nb[k][1];
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (!empty[j] && L[i] < L[j] - rthr) {
          edge[i] = 1;
          break;
        }
      }
    }
    const dA = distField(empty, W, H, o.edgeIsEmpty !== false), dR = distField(edge, W, H, false), h = new Float32Array(n);
    for (i = 0; i < n; i++) {
      if (empty[i]) {
        h[i] = 0;
        continue;
      }
      const hA = profile(dA[i], bevel, kind), hR = dR[i] > 1e8 ? 1 : profile(dR[i] + .5, Math.max(1, bevel - 1), kind);
      h[i] = clamp(hA * (1 - rw + rw * hR) + det * (L[i] - .5), 0, 1);
    }
    return h;
  }
  function normalFromHeight(h, W, H, o) {
    o = o || {};
    const s = o.strength == null ? 1 : o.strength, at = reader(h, W, H, o.wrap !== false), sob = o.kernel !== "central";
    const gsign = o.green === "dx" ? -1 : 1, mask = o.mask, n = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let gx, gy;
      if (mask && !mask[i]) {
        n[i * 3 + 2] = 1;
        continue;
      }
      if (sob) {
        gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1))) / 8;
        gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1))) / 8;
      } else {
        gx = (at(x + 1, y) - at(x - 1, y)) / 2;
        gy = (at(x, y + 1) - at(x, y - 1)) / 2;
      }
      const nx = -gx * s, ny = gsign * gy * s, l = Math.sqrt(nx * nx + ny * ny + 1);
      n[i * 3] = nx / l;
      n[i * 3 + 1] = ny / l;
      n[i * 3 + 2] = 1 / l;
    }
    return n;
  }
  function encodeNormals(n, W, H, alpha) {
    const o = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      o[i * 4] = Math.round((n[i * 3] * .5 + .5) * 255);
      o[i * 4 + 1] = Math.round((n[i * 3 + 1] * .5 + .5) * 255);
      o[i * 4 + 2] = Math.round((n[i * 3 + 2] * .5 + .5) * 255);
      o[i * 4 + 3] = alpha == null ? 255 : typeof alpha === "number" ? alpha : alpha[i];
    }
    return o;
  }
  function flipNormalX(rgba, W, H) {
    const o = new Uint8ClampedArray(rgba.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = (y * W + x) * 4, b = (y * W + (W - 1 - x)) * 4;
      o[b] = 255 - rgba[a];
      o[b + 1] = rgba[a + 1];
      o[b + 2] = rgba[a + 2];
      o[b + 3] = rgba[a + 3];
    }
    return o;
  }
  const FACE = {
    t: [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ],
    s: [ [ 1, 0, 0 ], [ 0, 0, 1 ], [ 0, -1, 0 ] ],
    e: [ [ .7071, .7071, 0 ], [ 0, 0, 1 ], [ .7071, -.7071, 0 ] ],
    w: [ [ .7071, -.7071, 0 ], [ 0, 0, 1 ], [ -.7071, -.7071, 0 ] ]
  };
  function faceNormals(faces, detail, W, H) {
    const n = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, ch = typeof faces[0] === "string" ? faces[y][x] || " " : String.fromCharCode(faces[i]), F = FACE[ch];
      if (!F) {
        n[i * 3 + 2] = 1;
        continue;
      }
      mask[i] = 1;
      const dx = detail ? detail[i * 3] : 0, dy = detail ? detail[i * 3 + 1] : 0, dz = detail ? detail[i * 3 + 2] : 1;
      const vx = F[0][0] * dx + F[1][0] * dy + F[2][0] * dz, vy = F[0][1] * dx + F[1][1] * dy + F[2][1] * dz, vz = F[0][2] * dx + F[1][2] * dy + F[2][2] * dz;
      const l = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      n[i * 3] = vx / l;
      n[i * 3 + 1] = vy / l;
      n[i * 3 + 2] = vz / l;
    }
    return {
      n,
      mask
    };
  }
  function pickDirection(sx, sy, lx, ly, count) {
    let az = Math.atan2(-(ly - sy), lx - sx) / DEG;
    az = pmod(az, 360);
    const f = az / (360 / count), i0 = Math.floor(f) % count;
    return {
      a: i0,
      b: (i0 + 1) % count,
      t: f - Math.floor(f),
      az
    };
  }
  function slopeStats(n, W, H, mask, base) {
    let s = 0, c = 0, big = 0, mx = 0;
    const per = base && base.length === W * H * 3, b = base || [ 0, 0, 1 ];
    for (let i = 0; i < W * H; i++) {
      if (mask && !mask[i]) continue;
      const bx = per ? b[i * 3] : b[0], by = per ? b[i * 3 + 1] : b[1], bz = per ? b[i * 3 + 2] : b[2];
      const a = Math.acos(clamp(n[i * 3] * bx + n[i * 3 + 1] * by + n[i * 3 + 2] * bz, -1, 1)) / DEG;
      s += a;
      c++;
      if (a > 50) big++;
      if (a > mx) mx = a;
    }
    return {
      meanDeg: c ? s / c : 0,
      over50: c ? big / c : 0,
      maxDeg: mx
    };
  }
  N.kit = {
    heightFromAlbedo,
    heightFromSprite,
    normalFromHeight,
    encodeNormals,
    flipNormalX,
    faceNormals,
    pickDirection,
    slopeStats,
    blurHeight,
    distField,
    FACE
  };
  const JQ = [];
  let jh = 0, idleOn = false;
  const ric = window.requestIdleCallback ? f => window.requestIdleCallback(f, {
    timeout: 400
  }) : f => setTimeout(() => f({
    timeRemaining: () => 6,
    didTimeout: true
  }), 30);
  function idle() {
    if (idleOn || jh >= JQ.length) return;
    idleOn = true;
    ric(runQ);
  }
  function runQ(dl) {
    idleOn = false;
    const t0 = performance.now();
    while (jh < JQ.length && (dl.timeRemaining() > 2 || performance.now() - t0 < 3)) {
      const f = JQ[jh];
      JQ[jh++] = null;
      try {
        f();
      } catch (e) {
        N.st.err = String(e && e.message || e);
      }
    }
    if (jh >= JQ.length) {
      JQ.length = 0;
      jh = 0;
    } else idle();
  }
  function job(f) {
    JQ.push(f);
    idle();
  }
  N.flush = function() {
    let n = 0;
    while (jh < JQ.length && n < 1e5) {
      const f = JQ[jh];
      JQ[jh++] = null;
      n++;
      try {
        f();
      } catch (e) {
        N.st.err = String(e && e.message || e);
      }
    }
    JQ.length = 0;
    jh = 0;
    return n;
  };
  N.pending = () => JQ.length - jh;
  const mkc = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  let rc = null, rx = null;
  function pix(c, over) {
    const W = c.width, H = c.height;
    if (!rc || rc.width < W || rc.height < H) {
      rc = mkc(Math.max(W, rc ? rc.width : 0, 64), Math.max(H, rc ? rc.height : 0, 64));
      rx = rc.getContext("2d", {
        willReadFrequently: true
      });
    }
    rx.globalCompositeOperation = "source-over";
    rx.globalAlpha = 1;
    rx.clearRect(0, 0, W, H);
    rx.drawImage(c, 0, 0);
    if (over) rx.drawImage(over, 0, 0);
    return rx.getImageData(0, 0, W, H).data;
  }
  function detailOf(rgba, W, H, kind) {
    const n = W * H, m = new Uint8Array(n);
    let s = 0, c = 0;
    for (let i = 0; i < n; i++) if (rgba[i * 4 + 3] >= 128) {
      m[i] = 1;
      s += luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      c++;
    }
    let h;
    if (kind === 2) h = heightFromSprite(rgba, W, H, {}); else {
      const src = new Uint8ClampedArray(rgba), av = c ? Math.round(s / c * 255) : 0;
      for (let i = 0; i < n; i++) if (!m[i]) {
        src[i * 4] = av;
        src[i * 4 + 1] = av;
        src[i * 4 + 2] = av;
      }
      h = heightFromAlbedo(src, W, H, {
        blur: 1,
        wrap: false
      });
    }
    return {
      d: normalFromHeight(h, W, H, {
        strength: kind === 2 ? N.STRB : N.STR,
        wrap: false,
        mask: m
      }),
      m
    };
  }
  N.detailOf = (c, kind) => detailOf(pix(c), c.width, c.height, kind);
  const AT = new Map, FAIL = new WeakSet, PEND = new WeakSet;
  let bytes = 0, tick = 0;
  const BR8 = [], DK8 = [];
  function bake(c, kind) {
    const W = c.width, H = c.height;
    if (!W || !H || W > 192 || H > 192) return null;
    const rgba = pix(c), dm = detailOf(rgba, W, H, kind), D = N.DIRS;
    const fc = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) fc[i] = dm.m[i] ? 115 : 32;
    const fn = faceNormals(fc, dm.d, W, H).n;
    const el = N.EL * DEG, ce = Math.cos(el), se = Math.sin(el), ST = N.STEPS, QS = Math.round(N.QMAX * ST), RW = W * D;
    const cv = mkc(RW, H * 2), x = cv.getContext("2d"), im = x.createImageData(RW, H * 2), o = im.data;
    let any = 0;
    for (let j = 0; j < D; j++) {
      const a = j * 360 / D * DEG, Lx = ce * Math.cos(a), Ly = ce * Math.sin(a), Lz = se, b0 = -Ly;
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx;
        if (!dm.m[i]) continue;
        let q = Math.round((fn[i * 3] * Lx + fn[i * 3 + 1] * Ly + fn[i * 3 + 2] * Lz - b0) * ST);
        if (!q) continue;
        if (q > QS) q = QS; else if (q < -QS) q = -QS;
        any = 1;
        if (q > 0) {
          const p = (y * RW + j * W + xx) * 4;
          o[p] = 255;
          o[p + 1] = 238;
          o[p + 2] = 200;
          o[p + 3] = Math.round(q / ST * 255);
        } else {
          const p = ((y + H) * RW + j * W + xx) * 4;
          o[p + 3] = Math.round(-q / ST * 255);
        }
      }
    }
    if (!any) {
      cv.width = 0;
      return null;
    }
    x.putImageData(im, 0, 0);
    return {
      cv,
      W,
      H,
      b: RW * H * 2 * 4,
      t: tick
    };
  }
  function evict() {
    const arr = [ ...AT.entries() ].sort((p, q) => p[1].t - q[1].t);
    for (const [k, e] of arr) {
      if (bytes <= N.BUDGET * .8) break;
      AT.delete(k);
      bytes -= e.b;
      e.cv.width = 0;
      N.st.evict++;
    }
    N.st.bytes = bytes;
  }
  function atlas(c, kind) {
    const e = AT.get(c);
    if (e) {
      e.t = tick;
      return e;
    }
    if (FAIL.has(c) || PEND.has(c)) return null;
    PEND.add(c);
    job(() => {
      PEND.delete(c);
      if (AT.has(c)) return;
      const r = bake(c, kind);
      if (!r) {
        FAIL.add(c);
        return;
      }
      r.k = kind;
      AT.set(c, r);
      bytes += r.b;
      N.st.atlas++;
      N.st.bytes = bytes;
      if (bytes > N.BUDGET) evict();
    });
    return null;
  }
  N.atlasOf = c => AT.get(c) || null;
  N.info = () => ({
    atlas: AT.size,
    mb: +(bytes / 1048576).toFixed(2),
    pending: N.pending(),
    st: N.st
  });
  N.reset = function() {
    for (const e of AT.values()) e.cv.width = 0;
    AT.clear();
    bytes = 0;
    N.st.bytes = 0;
  };
  function dirOf(gx, gy, lx, ly) {
    const d = pickDirection(gx, gy, lx, ly, N.DIRS);
    return d.t < .5 ? d.a : d.b;
  }
  N.dirOf = dirOf;
  const BD = [], WL = [];
  N.env = null;
  N.envF = null;
  N.frame = function(F, env) {
    BD.length = 0;
    WL.length = 0;
    tick++;
    N.env = env || null;
    N.envF = F || null;
  };
  N.body = function(c, x, y) {
    if (c && c.width) BD.push(c, x, y);
  };
  N.wall = function(c, x, y) {
    if (c && c.width) WL.push(c, x, y);
  };
  N.wallOver = function(c) {
    if (c && c.width && WL.length) WL[WL.length - 3] = c;
  };
  N.rec = () => ({
    bodies: BD.length / 3,
    walls: WL.length / 3,
    B: BD.filter((v, k) => k % 3 === 0),
    W: WL.filter((v, k) => k % 3 === 0)
  });
  N.keys = () => [ ...AT.keys() ];
  N.use = function(D, cw, ch, cx0, cy0, torch) {
    if (!N.on || !torch) return null;
    const cx = Math.floor(torch.x * 2) - cx0, cy = Math.floor(torch.y * 2) - cy0;
    if (cx < 0 || cy < 0 || cx >= cw || cy >= ch) return null;
    return D[(cy * cw + cx) * 4 + 3] >= N.DMIN ? N : null;
  };
  function clipR(c, Rr) {
    c.beginPath();
    for (let k = 0; k < Rr.length; k += 4) c.rect(Rr[k], Rr[k + 1], Rr[k + 2] - Rr[k], Rr[k + 3] - Rr[k + 1]);
    c.clip();
  }
  N.prop = function(c, cv, x, y, gx, gy, lx, ly, k, lt) {
    if (!(k > .004)) return;
    const e = atlas(cv, 0);
    if (!e) return;
    const j = dirOf(gx, gy, lx, ly), W = e.W, H = e.H;
    if (lt) {
      c.save();
      clipR(c, lt);
    }
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = Math.min(1, k * N.uNd);
    c.drawImage(e.cv, j * W, 0, W, H, x, y, W, H);
    c.globalCompositeOperation = "destination-out";
    c.globalAlpha = N.uNd;
    c.drawImage(e.cv, j * W, H, W, H, x, y, W, H);
    if (lt) c.restore();
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  };
  N.walls = function(c, x0, y0, x1, y1, s0, len, vals, Yw, lx, ly, cam) {
    if (!WL.length) return;
    const TS = SX.TS, ns = vals.length, qx0 = Math.round(x0), qx1 = Math.round(x1), qy0 = Math.round(y0), qy1 = Math.round(y1);
    for (let k = 0; k < WL.length; k += 3) {
      const cv = WL[k], wx = WL[k + 1], wy = WL[k + 2], W = cv.width, H = cv.height;
      const ix0 = Math.max(qx0, wx), ix1 = Math.min(qx1, wx + W), iy0 = Math.max(qy0, wy), iy1 = Math.min(qy1, wy + H);
      if (ix1 <= ix0 || iy1 <= iy0) continue;
      const cxw = (wx + W / 2 + cam.x) / TS, jv = clamp(Math.round((cxw - s0) / len * (ns - 1)), 0, ns - 1), kv = vals[jv];
      if (!(kv > .004)) continue;
      const e = atlas(cv, 0);
      if (!e || e.W !== W || e.H !== H) continue;
      const j = dirOf(cxw, Yw, lx, ly), sx = j * W + ix0 - wx, sy = iy0 - wy, w = ix1 - ix0, h = iy1 - iy0;
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = Math.min(1, kv * N.uNd);
      c.drawImage(e.cv, sx, sy, w, h, ix0, iy0, w, h);
      c.globalCompositeOperation = "destination-out";
      c.globalAlpha = N.uNd;
      c.drawImage(e.cv, sx, H + sy, w, h, ix0, iy0, w, h);
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  };
  let bs = null, bsx = null;
  N.bodies = function(c, cam, lx, ly, sx, sy, R) {
    if (!BD.length) return;
    const cv = c.canvas, TS = SX.TS;
    for (let k = 0; k < BD.length; k += 3) {
      const b = BD[k], x = BD[k + 1], y = BD[k + 2], W = b.width, H = b.height;
      if (Math.hypot(x + W / 2 - sx, y + H / 2 - sy) > R + 48) continue;
      const e = atlas(b, 2);
      if (!e || e.W !== W || e.H !== H) continue;
      const j = dirOf((x + W / 2 + cam.x) / TS, (y + H * .6 + cam.y) / TS, lx, ly);
      if (!bs || bs.width < W || bs.height < H) {
        bs = mkc(Math.max(W, 64), Math.max(H, 64));
        bsx = bs.getContext("2d");
      }
      bsx.globalCompositeOperation = "copy";
      bsx.drawImage(e.cv, j * W, 0, W, H, 0, 0, W, H);
      bsx.globalCompositeOperation = "destination-in";
      bsx.drawImage(cv, x, y, W, H, 0, 0, W, H);
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = N.uNd;
      c.drawImage(bs, 0, 0, W, H, x, y, W, H);
      c.globalCompositeOperation = "destination-out";
      c.drawImage(e.cv, j * W, H, W, H, x, y, W, H);
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  };
  const TL = new WeakMap, SO = new WeakMap, NT = new WeakMap;
  const NC = new WeakMap;
  const ncOf = F => {
    let C = NC.get(F);
    if (!C) {
      C = new Array(F.W * F.H);
      NC.set(F, C);
    }
    return C;
  };
  N.tile = function(F, i, c) {
    let A = TL.get(F);
    if (!A) {
      A = new Array(F.W * F.H);
      TL.set(F, A);
    }
    A[i] = c;
    const S = SO.get(F);
    if (S) S.delete(i);
    const C = NC.get(F);
    if (C) C[i] = undefined;
  };
  N.surf = function(F, i, c) {
    let S = SO.get(F);
    if (!S) {
      S = new Map;
      SO.set(F, S);
    }
    S.set(i, c);
    const C = NC.get(F);
    if (C) C[i] = undefined;
  };
  function calcTile(base, over) {
    const W = base.width, H = base.height, TS = SX.TS;
    if (W !== TS || H !== TS) return 0;
    const rgba = pix(base, over), h = heightFromAlbedo(rgba, W, H, {
      blur: 1,
      wrap: false
    }), d = normalFromHeight(h, W, H, {
      strength: N.STRT,
      wrap: false
    });
    const n3 = W * H * 3, o = new Int8Array(n3 + 1);
    let dm = 0;
    for (let k = 0; k < n3; k++) o[k] = Math.round(d[k] * 127);
    for (let k = 0; k < n3; k += 3) {
      const a = o[k], b = o[k + 1], z = o[k + 2] - 127, v = a * a + b * b + z * z;
      if (v > dm) dm = v;
    }
    o[n3] = Math.min(127, Math.ceil(Math.sqrt(dm)));
    N.st.tiles++;
    return o;
  }
  function tileN(F, A, i, now) {
    const base = A[i];
    if (!base) return null;
    const S = SO.get(F), over = S ? S.get(i) : null, key = over || base;
    const n = NT.get(key);
    if (n) {
      const C = NC.get(F);
      if (C) C[i] = n;
      return n;
    }
    if (n === 0 && !now) return null;
    if (n === undefined || now) {
      if (now) {
        const r = calcTile(base, over);
        NT.set(key, r || 0);
        return r || null;
      }
      NT.set(key, 0);
      job(() => {
        if (!NT.get(key)) NT.set(key, calcTile(base, over) || false);
      });
    }
    return null;
  }
  N.tileN = (F, i) => {
    const A = TL.get(F);
    return A ? tileN(F, A, i, true) : null;
  };
  const FM = 400, LE = new Uint8Array(new Uint32Array([ 1 ]).buffer)[0] === 1;
  let fb = null, fd = null, fbx = null, fdx = null, IB = null, ID = null, IB32 = null, ID32 = null;
  let BT = null, DT = null, BTk = "";
  const RZS = (FM >> 1) + 2, RZW = 2 * RZS;
  let RZT = null, RZk = "";
  function rzLut(ZT, K) {
    const key = ZT + "|" + K;
    if (RZT && RZk === key) return RZT;
    RZT = RZT || new Float32Array(RZS * RZW);
    RZk = key;
    for (let j = 0; j < RZS; j++) for (let i = -RZS; i < RZS; i++) {
      const dx = i + .5, dy = j + .5;
      RZT[j * RZW + i + RZS] = K / Math.sqrt(dx * dx + dy * dy + ZT * ZT);
    }
    return RZT;
  }
  function fbufs() {
    if (fb) return;
    fb = mkc(FM, FM);
    fbx = fb.getContext("2d");
    fd = mkc(FM, FM);
    fdx = fd.getContext("2d");
    IB = fbx.createImageData(FM, FM);
    ID = fdx.createImageData(FM, FM);
    IB32 = new Uint32Array(IB.data.buffer);
    ID32 = new Uint32Array(ID.data.buffer);
  }
  function packs() {
    const ST = N.STEPS, QS = Math.round(N.QMAX * ST), key = ST + "|" + QS;
    if (BT && BTk === key) return QS;
    BT = new Uint32Array(2 * QS + 1);
    DT = new Uint32Array(2 * QS + 1);
    BTk = key;
    for (let q = 1; q <= QS; q++) {
      const a = Math.round(q / ST * 255);
      BT[QS + q] = LE ? (a << 24 | 200 << 16 | 238 << 8 | 255) >>> 0 : (255 << 24 | 238 << 16 | 200 << 8 | a) >>> 0;
      DT[QS - q] = LE ? a << 24 >>> 0 : a >>> 0;
    }
    return QS;
  }
  N.floor = function(c, F, cam, sx, sy, ta, R, TO) {
    const t0 = performance.now();
    N.st.dots3 = 0;
    const A = TL.get(F);
    if (!A) return;
    fbufs();
    const QS = packs();
    const cv = c.canvas, VW = cv.width, VH = cv.height, r = Math.min(R * .5, (FM - 6) / 2), Lx = Math.round(sx), Ly = Math.round(sy);
    let mx0 = Lx, mx1 = Lx, my0 = Ly, my1 = Ly;
    const ang = [ ta - TO, ta + TO ];
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, d = Math.atan2(Math.sin(a - ta), Math.cos(a - ta));
      if (Math.abs(d) < TO) ang.push(a);
    }
    for (const a of ang) {
      const px = Lx + Math.cos(a) * r, py = Ly + Math.sin(a) * r;
      if (px < mx0) mx0 = px;
      if (px > mx1) mx1 = px;
      if (py < my0) my0 = py;
      if (py > my1) my1 = py;
    }
    const x0 = Math.max(0, Math.floor(mx0) - 1), x1 = Math.min(VW, Math.ceil(mx1) + 1, x0 + FM), y0 = Math.max(0, Math.floor(my0) - 1), y1 = Math.min(VH, Math.ceil(my1) + 1, y0 + FM);
    const bw = x1 - x0, bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return;
    const TS = SX.TS, FW = F.W, FH = F.H, cwx = Math.round(-cam.x), cwy = Math.round(-cam.y), NL = TS * TS * 3;
    const ZT = N.ZT, r2 = r * r, ST = N.STEPS, FL = 63.5 / ST, RZ = rzLut(ZT, ST / 127), NA = ncOf(F), ib = IB32, id = ID32, bt = BT, dt = DT;
    const wedge = TO < 1.55, u1x = Math.cos(ta - TO), u1y = Math.sin(ta - TO), u2x = Math.cos(ta + TO), u2y = Math.sin(ta + TO), EP = 1e-9;
    let dots = 0, wx0 = 1e9, wx1 = -1, wy0 = 1e9, wy1 = -1;
    for (let Y = y0; Y < y1; Y++) {
      const dy = Y + .5 - Ly, dy2 = dy * dy;
      if (dy2 > r2) continue;
      const hx = Math.sqrt(r2 - dy2);
      let lo = -hx, hi = hx;
      if (wedge) {
        if (u1y > EP) hi = Math.min(hi, u1x * dy / u1y); else if (u1y < -EP) lo = Math.max(lo, u1x * dy / u1y); else if (u1x * dy < 0) continue;
        if (u2y > EP) lo = Math.max(lo, dy * u2x / u2y); else if (u2y < -EP) hi = Math.min(hi, dy * u2x / u2y); else if (dy * u2x > 0) continue;
      }
      const xa = Math.max(x0, Math.ceil(Lx + lo - .5)), xb = Math.min(x1 - 1, Math.floor(Lx + hi - .5));
      if (xb < xa) continue;
      const wy = Y - cwy, ty = Math.floor(wy / TS);
      if (ty < 0 || ty >= FH) continue;
      const jy = Y - Ly, rb = (jy >= 0 ? jy : -jy - 1) * RZW + RZS - Lx, vrow = (wy - ty * TS) * TS, row = (Y - y0) * FM - x0, tb = ty * FW;
      let wr = 0, X = xa;
      while (X <= xb) {
        const wx = X - cwx, tx = Math.floor(wx / TS), ex = Math.min(xb, cwx + tx * TS + TS - 1);
        const nn = tx >= 0 && tx < FW ? NA[tb + tx] || tileN(F, A, tb + tx, false) : null;
        if (nn && nn[NL] >= FL) {
          dots += ex - X + 1;
          if (X < wx0) wx0 = X;
          if (ex > wx1) wx1 = ex;
          wr = 1;
          for (let k3 = (vrow + wx - tx * TS) * 3, o = row + X, dx = X - Lx + .5; X <= ex; X++, 
          k3 += 3, o++, dx++) {
            let q = ((nn[k3 + 1] * dy - nn[k3] * dx + (nn[k3 + 2] - 127) * ZT) * RZ[rb + X] + 1024.5 | 0) - 1024;
            q = q > QS ? QS : q < -QS ? -QS : q;
            ib[o] = bt[q + QS];
            id[o] = dt[q + QS];
          }
        }
        X = ex + 1;
      }
      if (wr) {
        if (Y < wy0) wy0 = Y;
        wy1 = Y;
      }
    }
    N.st.dots3 = dots;
    N.st.ms3a = performance.now() - t0;
    if (wx1 >= 0) {
      const ox = wx0 - x0, oy = wy0 - y0, w = wx1 - wx0 + 1, h = wy1 - wy0 + 1;
      fbx.putImageData(IB, 0, 0, ox, oy, w, h);
      fdx.putImageData(ID, 0, 0, ox, oy, w, h);
      fbx.globalCompositeOperation = "destination-out";
      fdx.globalCompositeOperation = "destination-out";
      for (let k = 0; k < BD.length; k += 3) {
        const b = BD[k], bx = BD[k + 1] - x0, by = BD[k + 2] - y0;
        if (bx > ox + w || by > oy + h || bx + b.width < ox || by + b.height < oy) continue;
        fbx.drawImage(b, bx, by);
        fdx.drawImage(b, bx, by);
      }
      fdx.globalCompositeOperation = "source-over";
      fbx.globalCompositeOperation = "destination-in";
      fbx.drawImage(cv, wx0, wy0, w, h, ox, oy, w, h);
      fbx.globalCompositeOperation = "source-over";
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = N.uNd;
      c.drawImage(fb, ox, oy, w, h, wx0, wy0, w, h);
      c.globalCompositeOperation = "destination-out";
      c.drawImage(fd, ox, oy, w, h, wx0, wy0, w, h);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      for (let y = oy; y < oy + h; y++) {
        const b = y * FM + ox;
        IB32.fill(0, b, b + w);
        ID32.fill(0, b, b + w);
      }
    }
    N.st.ms3 = performance.now() - t0;
  };
  function baseLum(F, E, i) {
    const W = F.W, tx = i % W, ty = i / W | 0, inside = F.inside && F.inside[i] && !(F.voidAt && F.voidAt(tx, ty)), dim = E.dim || 1;
    if (E.hub) {
      const dayO = !E.night && F.out && F.out.day;
      return inside ? .42 : dayO ? .86 : E.night ? .4 : .62;
    }
    if (inside) return F.park ? .11 * dim : (E.night ? .05 + (F.win ? F.win[i] : 0) * .1 : .3 + (F.win ? F.win[i] : 0) * .55) * dim;
    return E.night ? .24 : .92;
  }
  N.baseLum = baseLum;
  N.chunk = function(F, c, cx, cy) {
    if (F && F.lamps && F.lamps.length) job(() => bakeLamps(F, c, cx, cy, 0));
  };
  function bakeLamps(F, c, cx, cy, tries) {
    if (!N.on || c._nl) return;
    if (!F.chunks || F.chunks.get(cx + "," + cy) !== c) return;
    const E = N.env;
    if (!E || N.envF !== F) {
      if (tries < 20) setTimeout(() => job(() => bakeLamps(F, c, cx, cy, tries + 1)), 500);
      return;
    }
    if (E.hub) {
      c._nl = 1;
      return;
    }
    const A = TL.get(F);
    if (!A) return;
    const TS = SX.TS, CD = c.width, X0 = cx * CD, Y0 = cy * CD, ZL = N.ZL, ZL2 = ZL * ZL, ST = N.STEPS, QS = Math.round(N.QMAX * ST), K = 1 / 127;
    const LS = [];
    let ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9;
    for (const l of F.lamps) {
      if (l.furn || l.dyn || l.hid || !(l.r > 0) || E.hub && l.out) continue;
      if (F.seeOff && F.seeOff(Math.floor(l.x), Math.floor(l.y))) continue;
      const rd = Math.min(l.r, 3) * TS, lx = l.x * TS, ly = l.y * TS;
      const bx0 = Math.max(X0, Math.floor(lx - rd)), bx1 = Math.min(X0 + CD, Math.ceil(lx + rd)), by0 = Math.max(Y0, Math.floor(ly - rd)), by1 = Math.min(Y0 + CD, Math.ceil(ly + rd));
      if (bx1 <= bx0 || by1 <= by0) continue;
      LS.push({
        l,
        rd,
        lx,
        ly,
        bx0,
        bx1,
        by0,
        by1
      });
      if (bx0 < ux0) ux0 = bx0;
      if (by0 < uy0) uy0 = by0;
      if (bx1 > ux1) ux1 = bx1;
      if (by1 > uy1) uy1 = by1;
    }
    c._nl = 1;
    if (!LS.length) return;
    const g = c.getContext("2d"), w = ux1 - ux0, im = g.getImageData(ux0 - X0, uy0 - Y0, w, uy1 - uy0), p = im.data;
    let ch = 0;
    for (const s of LS) {
      const l = s.l, rr = l.r * TS, rd2 = s.rd * s.rd, la = l.a || 1;
      for (let Y = s.by0; Y < s.by1; Y++) {
        const dy = Y + .5 - s.ly, ty = Math.floor(Y / TS);
        if (ty < 0 || ty >= F.H) continue;
        let ltx = -1e9, nn = null, amb = 0;
        for (let X = s.bx0; X < s.bx1; X++) {
          const dx = X + .5 - s.lx, d2 = dx * dx + dy * dy;
          if (d2 >= rd2) continue;
          const tx = Math.floor(X / TS);
          if (tx !== ltx) {
            ltx = tx;
            const i = ty * F.W + tx;
            nn = tx >= 0 && tx < F.W ? tileN(F, A, i, true) : null;
            amb = nn ? 1 - baseLum(F, E, i) : 0;
          }
          if (!nn || amb < .3) continue;
          const k3 = ((Y - ty * TS) * TS + X - tx * TS) * 3;
          let q = Math.round((-nn[k3] * dx + nn[k3 + 1] * dy + (nn[k3 + 2] - 127) * ZL) * K / Math.sqrt(d2 + ZL2) * ST);
          if (!q) continue;
          if (q > QS) q = QS; else if (q < -QS) q = -QS;
          const kn = Math.max(0, 1 - Math.sqrt(d2) / rr) * la, f = 1 + N.uNd * (q / ST) * kn * amb;
          if (f === 1) continue;
          const o = ((Y - uy0) * w + X - ux0) * 4;
          p[o] = p[o] * f;
          p[o + 1] = p[o + 1] * f;
          p[o + 2] = p[o + 2] * f;
          ch = 1;
        }
      }
    }
    if (ch) g.putImageData(im, ux0 - X0, uy0 - Y0);
    N.st.chunks++;
  }
  for (const k of [ "prop", "walls", "bodies", "floor" ]) {
    const f = N[k];
    N[k] = function(c) {
      try {
        return f.apply(N, arguments);
      } catch (e) {
        N.st.err = k + ": " + String(e && e.message || e);
        N.on = false;
        try {
          c.globalCompositeOperation = "source-over";
          c.globalAlpha = 1;
        } catch (e2) {}
      }
    };
  }
})(window.SX);
