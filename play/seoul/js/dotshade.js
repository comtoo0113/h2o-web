"use strict";

(function(SX) {
  const A = SX.art;
  if (!A || typeof CanvasRenderingContext2D === "undefined") return;
  const DS = SX.dotshade = {
    on: true
  };
  var DEG = Math.PI / 180;
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
    var at = reader(h, W, H, wrap !== false), o = new Float32Array(W * H), n = (2 * r + 1) * (2 * r + 1);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var s = 0;
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) s += at(x + dx, y + dy);
      o[y * W + x] = s / n;
    }
    return o;
  }
  function distField(seed, W, H, edgeSeed) {
    var INF = 1e9, d = new Float32Array(W * H), x, y, i, R2 = Math.SQRT2;
    for (i = 0; i < W * H; i++) d[i] = seed[i] ? 0 : INF;
    if (edgeSeed) for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      var e = Math.min(x + 1, y + 1, W - x, H - y);
      if (e < d[i]) d[i] = e;
    }
    function rd(xx, yy) {
      return xx < 0 || yy < 0 || xx >= W || yy >= H ? edgeSeed ? 0 : INF : d[yy * W + xx];
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      var v = d[i];
      v = Math.min(v, rd(x - 1, y) + 1, rd(x, y - 1) + 1, rd(x - 1, y - 1) + R2, rd(x + 1, y - 1) + R2);
      d[i] = v;
    }
    for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) {
      i = y * W + x;
      var w = d[i];
      w = Math.min(w, rd(x + 1, y) + 1, rd(x, y + 1) + 1, rd(x + 1, y + 1) + R2, rd(x - 1, y + 1) + R2);
      d[i] = w;
    }
    return d;
  }
  function profile(d, b, kind) {
    var t = clamp(d / b, 0, 1);
    if (kind === "linear") return t;
    if (kind === "flat") return t > 0 ? 1 : 0;
    var u = 1 - t;
    return Math.sqrt(Math.max(0, 1 - u * u));
  }
  function heightFromSprite(rgba, W, H, o) {
    o = o || {};
    var bevel = o.bevel || 3, thr = o.alphaThr == null ? 128 : o.alphaThr, rthr = o.regionThr == null ? .14 : o.regionThr;
    var rw = o.regionWeight == null ? .35 : o.regionWeight, det = o.detail == null ? .15 : o.detail, kind = o.profile || "round";
    var n = W * H, empty = new Uint8Array(n), edge = new Uint8Array(n), L = new Float32Array(n), i, x, y;
    for (i = 0; i < n; i++) {
      empty[i] = rgba[i * 4 + 3] < thr ? 1 : 0;
      L[i] = luma(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (empty[i]) continue;
      var nb = [ [ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ 0, -1 ] ];
      for (var k = 0; k < 4; k++) {
        var xx = x + nb[k][0], yy = y + nb[k][1];
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        var j = yy * W + xx;
        if (!empty[j] && L[i] < L[j] - rthr) {
          edge[i] = 1;
          break;
        }
      }
    }
    var dA = distField(empty, W, H, o.edgeIsEmpty !== false), dR = distField(edge, W, H, false), h = new Float32Array(n);
    for (i = 0; i < n; i++) {
      if (empty[i]) {
        h[i] = 0;
        continue;
      }
      var hA = profile(dA[i], bevel, kind), hR = dR[i] > 1e8 ? 1 : profile(dR[i] + .5, Math.max(1, bevel - 1), kind);
      h[i] = clamp(hA * (1 - rw + rw * hR) + det * (L[i] - .5), 0, 1);
    }
    return h;
  }
  function normalFromHeight(h, W, H, o) {
    o = o || {};
    var s = o.strength == null ? 1 : o.strength, at = reader(h, W, H, o.wrap !== false), sob = o.kernel !== "central";
    var gsign = o.green === "dx" ? -1 : 1, mask = o.mask, n = new Float32Array(W * H * 3);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = y * W + x, gx, gy;
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
      var nx = -gx * s, ny = gsign * gy * s, l = Math.sqrt(nx * nx + ny * ny + 1);
      n[i * 3] = nx / l;
      n[i * 3 + 1] = ny / l;
      n[i * 3 + 2] = 1 / l;
    }
    return n;
  }
  function keyOf(r, g, b) {
    return r << 16 | g << 8 | b;
  }
  function rgbIn(c) {
    if (typeof c === "string") {
      var n = parseInt(c.charAt(0) === "#" ? c.slice(1) : c, 16);
      return [ n >> 16 & 255, n >> 8 & 255, n & 255 ];
    }
    return [ c[0] | 0, c[1] | 0, c[2] | 0 ];
  }
  function hueSat(c) {
    var r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), C = mx - mn, h = 0;
    if (C > 0) {
      h = mx === r ? (g - b) / C % 6 : mx === g ? (b - r) / C + 2 : (r - g) / C + 4;
      h = pmod(h * 60, 360);
    }
    return {
      h,
      s: mx ? C / mx : 0,
      C
    };
  }
  function normRamps(list) {
    return (list || []).map(function(R) {
      var cs = (R.colors || R).map(rgbIn), b0 = R.base == null ? -1 : R.base, bk = b0 >= 0 && cs[b0] ? keyOf(cs[b0][0], cs[b0][1], cs[b0][2]) : -1, seen = {}, u = [];
      cs.forEach(function(c) {
        var k = keyOf(c[0], c[1], c[2]);
        if (!seen[k]) {
          seen[k] = 1;
          u.push(c);
        }
      });
      u.sort(function(a, b) {
        return luma(a[0], a[1], a[2]) - luma(b[0], b[1], b[2]);
      });
      var keys = u.map(function(c) {
        return keyOf(c[0], c[1], c[2]);
      }), base = bk >= 0 ? keys.indexOf(bk) : -1;
      return {
        rgb: u,
        keys,
        base: base >= 0 ? base : Math.floor(u.length / 2)
      };
    });
  }
  function paletteOf(rgba, W, H, o) {
    o = o || {};
    var thr = o.alphaThr == null ? 250 : o.alphaThr, cnt = new Map, i;
    for (i = 0; i < W * H; i++) {
      if (rgba[i * 4 + 3] < thr) continue;
      var k = keyOf(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      cnt.set(k, (cnt.get(k) || 0) + 1);
    }
    var keys = Array.from(cnt.keys()).sort(function(a, b) {
      return cnt.get(b) - cnt.get(a);
    });
    return {
      keys,
      rgb: keys.map(function(k) {
        return [ k >> 16 & 255, k >> 8 & 255, k & 255 ];
      }),
      count: keys.map(function(k) {
        return cnt.get(k);
      }),
      n: keys.length,
      set: new Set(keys)
    };
  }
  function rampsAuto(rgba, W, H, o) {
    o = o || {};
    var pal = paletteOf(rgba, W, H, o), n = pal.n, id = new Map, par = [], i, x, y;
    var hueTol = o.hueTol == null ? 40 : o.hueTol, satTol = o.satTol == null ? .35 : o.satTol, grayC = o.grayC == null ? 22 : o.grayC, thr = o.alphaThr == null ? 250 : o.alphaThr, lumTol = o.lumTol == null ? .3 : o.lumTol;
    pal.keys.forEach(function(k, j) {
      id.set(k, j);
      par.push(j);
    });
    var hs = pal.rgb.map(hueSat), lu = pal.rgb.map(function(c) {
      return luma(c[0], c[1], c[2]);
    });
    function find(a) {
      while (par[a] !== a) {
        par[a] = par[par[a]];
        a = par[a];
      }
      return a;
    }
    function like(a, b) {
      var A = hs[a], B = hs[b], ga = A.C < grayC, gb = B.C < grayC;
      if (Math.abs(lu[a] - lu[b]) > lumTol) return false;
      if (ga || gb) return ga && gb;
      var dh = Math.abs(A.h - B.h);
      if (dh > 180) dh = 360 - dh;
      return dh <= hueTol && Math.abs(A.s - B.s) <= satTol;
    }
    function at(xx, yy) {
      var q = yy * W + xx;
      return rgba[q * 4 + 3] < thr ? -1 : id.get(keyOf(rgba[q * 4], rgba[q * 4 + 1], rgba[q * 4 + 2]));
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var a = at(x, y);
      if (a < 0) continue;
      var nb = [ x + 1 < W ? at(x + 1, y) : -1, y + 1 < H ? at(x, y + 1) : -1 ];
      for (var t = 0; t < 2; t++) {
        var b = nb[t];
        if (b < 0 || b === a) continue;
        if (like(a, b)) {
          var ra = find(a), rb = find(b);
          if (ra !== rb) par[rb] = ra;
        }
      }
    }
    var grp = new Map;
    for (i = 0; i < n; i++) {
      var r0 = find(i);
      if (!grp.has(r0)) grp.set(r0, []);
      grp.get(r0).push(pal.rgb[i]);
    }
    return normRamps(Array.from(grp.values()));
  }
  function delight(rgba, W, H, o) {
    o = o || {};
    var thr = o.alphaThr == null ? 250 : o.alphaThr, ramps = o.ramps ? o.ramps[0] && o.ramps[0].keys ? o.ramps : normRamps(o.ramps) : rampsAuto(rgba, W, H, o);
    if (o.ramps && o.rest === "auto") {
      var d0 = delight(rgba, W, H, {
        ramps,
        alphaThr: thr
      });
      if (d0.orphan) {
        var rest = new Uint8ClampedArray(rgba);
        for (var q0 = 0; q0 < W * H; q0++) if (d0.ramp[q0] >= 0) rest[q0 * 4 + 3] = 0;
        var add = rampsAuto(rest, W, H, o).filter(function(R) {
          return R.keys.length > 1;
        });
        if (add.length) return delight(rgba, W, H, {
          ramps: ramps.concat(add),
          alphaThr: thr
        });
      }
      return d0;
    }
    var pal = paletteOf(rgba, W, H, {
      alphaThr: thr
    }), cand = new Map, r, i, k;
    for (r = 0; r < ramps.length; r++) for (i = 0; i < ramps[r].keys.length; i++) {
      k = ramps[r].keys[i];
      if (!cand.has(k)) cand.set(k, []);
      cand.get(k).push([ r, i ]);
    }
    var sup = new Float64Array(ramps.length), cnt = new Map;
    pal.keys.forEach(function(kk, j) {
      cnt.set(kk, pal.count[j]);
      var c = cand.get(kk);
      if (c) {
        var seenR = {};
        c.forEach(function(p) {
          if (!seenR[p[0]]) {
            seenR[p[0]] = 1;
            sup[p[0]] += pal.count[j];
          }
        });
      }
    });
    var pick = new Map;
    pal.keys.forEach(function(kk) {
      var c = cand.get(kk);
      if (!c) return;
      var best = c[0];
      for (var q = 1; q < c.length; q++) if (sup[c[q][0]] > sup[best[0]]) best = c[q];
      pick.set(kk, best);
    });
    var N = W * H, ramp = new Int16Array(N).fill(-1), idx = new Int8Array(N), level = new Int8Array(N), mask = new Uint8Array(N), edge = new Uint8Array(N), alb = new Uint8ClampedArray(rgba), orphan = 0, dots = 0;
    var used = ramps.map(function(R) {
      return new Uint8Array(R.keys.length);
    });
    for (i = 0; i < N; i++) {
      if (rgba[i * 4 + 3] < thr) continue;
      dots++;
      var ex = i % W, ey = (i - ex) / W;
      if (ex > 0 && rgba[(i - 1) * 4 + 3] < 128 || ex < W - 1 && rgba[(i + 1) * 4 + 3] < 128 || ey > 0 && rgba[(i - W) * 4 + 3] < 128 || ey < H - 1 && rgba[(i + W) * 4 + 3] < 128) edge[i] = 1;
      var p = pick.get(keyOf(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]));
      if (!p) {
        orphan++;
        continue;
      }
      var R = ramps[p[0]], bc = R.rgb[R.base];
      ramp[i] = p[0];
      idx[i] = p[1];
      level[i] = p[1] - R.base;
      mask[i] = 1;
      used[p[0]][p[1]] = 1;
      alb[i * 4] = bc[0];
      alb[i * 4 + 1] = bc[1];
      alb[i * 4 + 2] = bc[2];
    }
    return {
      W,
      H,
      src: rgba,
      ramps,
      ramp,
      idx,
      level,
      albedo: alb,
      mask,
      edge,
      used,
      orphan,
      dots,
      colors: pal.n
    };
  }
  function heightFromDelit(d, o) {
    o = o || {};
    var W = d.W, H = d.H, N = W * H, bev = o.bevel == null ? 3 : o.bevel, lw = o.levelWeight == null ? .15 : o.levelWeight, i;
    var h = bev > 0 ? heightFromSprite(d.albedo, W, H, {
      bevel: bev,
      detail: 0,
      regionThr: o.regionThr,
      regionWeight: o.regionWeight,
      alphaThr: 128,
      profile: o.profile
    }) : new Float32Array(N);
    var lv = new Float32Array(N);
    for (i = 0; i < N; i++) {
      var r = d.ramp[i];
      if (r >= 0) {
        var n1 = d.ramps[r].rgb.length - 1;
        lv[i] = n1 > 0 ? d.idx[i] / n1 : .5;
      } else lv[i] = .5;
    }
    if (o.blur) lv = blurHeight(lv, W, H, o.blur, false);
    for (i = 0; i < N; i++) if (d.src[i * 4 + 3] >= 128) h[i] = (bev > 0 ? h[i] : .5) + lw * (lv[i] - .5);
    return h;
  }
  function glDir(v) {
    var x = v[0], y = -v[1], z = v[2], l = Math.sqrt(x * x + y * y + z * z) || 1;
    return [ x / l, y / l, z / l ];
  }
  function nearUsed(u, j, from, between) {
    if (u[j]) return j;
    if (between) {
      var st = j > from ? -1 : 1;
      for (var jj = j; jj !== from; jj += st) if (u[jj]) return jj;
      return from;
    }
    for (var dd = 1; dd < u.length; dd++) {
      var a = j - dd, b = j + dd, ua = a >= 0 && u[a], ub = b < u.length && u[b];
      if (ua && ub) return Math.abs(a - from) <= Math.abs(b - from) ? a : b;
      if (ua) return a;
      if (ub) return b;
    }
    return from;
  }
  function relight(d, normals, o) {
    o = o || {};
    var L = o.L || o.sun && o.sun.L || [ 0, 0, 1 ], L0 = o.L0 || null, mode = o.mode || (L0 ? "relative" : "absolute");
    var k = o.k == null ? 2 : o.k, sh = o.shift | 0, piv = o.pivot == null ? Math.max(L[2], 0) : o.pivot, ke = o.keepEdge !== false && d.edge, uo = o.only !== "ramp" && d.used;
    var fl = o.flat !== false, pv = fl ? Math.max(L[2], 0) : 0, pv0 = fl && L0 ? Math.max(L0[2], 0) : 0;
    var W = d.W, H = d.H, out = new Uint8ClampedArray(d.src), N = W * H;
    for (var i = 0; i < N; i++) {
      var r = d.ramp[i];
      if (r < 0 || ke && d.edge[i]) continue;
      var nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2], ndl = nx * L[0] + ny * L[1] + nz * L[2];
      if (ndl < 0) ndl = 0;
      var R = d.ramps[r], j;
      if (mode === "relative") {
        var n0 = nx * L0[0] + ny * L0[1] + nz * L0[2];
        if (n0 < 0) n0 = 0;
        j = d.idx[i] + sh + Math.round(k * (ndl - pv - (n0 - pv0)));
      } else j = R.base + sh + Math.round(k * (ndl - piv));
      if (j < 0) j = 0; else if (j >= R.rgb.length) j = R.rgb.length - 1;
      if (uo) j = nearUsed(d.used[r], j, d.idx[i], mode === "relative");
      var c = R.rgb[j];
      out[i * 4] = c[0];
      out[i * 4 + 1] = c[1];
      out[i * 4 + 2] = c[2];
    }
    return out;
  }
  function sunAt(t, o) {
    o = o || {};
    var keys = o.keys || [ {
      t: 0,
      az: 20,
      el: 15
    }, {
      t: .5,
      az: 90,
      el: 60
    }, {
      t: 1,
      az: 160,
      el: 15
    } ];
    t = clamp(+t || 0, 0, 1);
    if (o.steps) t = Math.round(t * o.steps) / o.steps;
    var a = keys[0], b = keys[keys.length - 1];
    for (var i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
    var f = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0, az = a.az + (b.az - a.az) * f, el = a.el + (b.el - a.el) * f;
    var ce = Math.cos(el * DEG), L = [ ce * Math.cos(az * DEG), ce * Math.sin(az * DEG), Math.sin(el * DEG) ];
    return {
      t,
      az,
      el,
      L,
      dir: [ L[0], -L[1], L[2] ]
    };
  }
  function azEl(L) {
    var l = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]) || 1;
    return {
      az: pmod(Math.atan2(L[1], L[0]) / DEG, 360),
      el: Math.asin(clamp(L[2] / l, -1, 1)) / DEG
    };
  }
  function paletteCheck(rgba, W, H, allowed, o) {
    var p = paletteOf(rgba, W, H, o), A = allowed instanceof Set ? allowed : new Set, out = 0, outDots = 0, a0 = allowed && allowed[0];
    if (!(allowed instanceof Set) && a0) {
      var isRamps = a0.keys || a0.colors || Array.isArray(a0) && typeof a0[0] !== "number";
      if (isRamps) (a0.keys ? allowed : normRamps(allowed)).forEach(function(R) {
        R.keys.forEach(function(k) {
          A.add(k);
        });
      }); else allowed.forEach(function(c) {
        var q = rgbIn(c);
        A.add(keyOf(q[0], q[1], q[2]));
      });
    }
    p.keys.forEach(function(k, j) {
      if (!A.has(k)) {
        out++;
        outDots += p.count[j];
      }
    });
    return {
      colors: p.n,
      outside: out,
      outsideDots: outDots
    };
  }
  function dotBlockCheck(big, BW, BH, scale) {
    var blocks = 0, mixed = 0;
    for (var by = 0; by + scale <= BH; by += scale) for (var bx = 0; bx + scale <= BW; bx += scale) {
      blocks++;
      var p0 = (by * BW + bx) * 4, same = true;
      for (var y = 0; y < scale && same; y++) for (var x = 0; x < scale; x++) {
        var p = ((by + y) * BW + bx + x) * 4;
        if (big[p] !== big[p0] || big[p + 1] !== big[p0 + 1] || big[p + 2] !== big[p0 + 2] || big[p + 3] !== big[p0 + 3]) {
          same = false;
          break;
        }
      }
      if (!same) mixed++;
    }
    return {
      blocks,
      mixed
    };
  }
  const L0S = [ -.55, -.65, .52 ];
  const L0 = glDir(L0S), AE0 = azEl(L0);
  const CFG = DS.cfg = {
    keys: [ {
      t: 0,
      az: 35,
      el: 6
    }, {
      t: .5,
      az: 90,
      el: 40
    }, {
      t: 1,
      az: 168,
      el: 5
    } ],
    steps: 8,
    ch: {
      k: 6,
      dk: 3,
      str: 2,
      bevel: 3,
      lw: .15
    },
    prop: {
      k: 6,
      dk: 3,
      str: 3,
      bevel: 3,
      lw: .3
    },
    wall: {
      k: 6,
      dk: 3,
      str: 3,
      bevel: 0,
      lw: 1
    },
    shadow: {
      on: true,
      a: .3,
      maxK: 1.6,
      maxPx: 56,
      ys: 1,
      thick: 1,
      el0: 2,
      elFade: 10
    },
    budget: 2,
    maxWH: 512
  };
  const TS = SX.TS || 32;
  const shOf = (c, L) => c.dk ? Math.round(c.dk * (L[2] - L0[2])) : 0;
  let RAMPS = [], RN = -1;
  function rampsNow() {
    const rc = A.rampCache;
    if (!rc) return RAMPS;
    if (rc.size !== RN) {
      const l = [];
      rc.forEach(v => {
        if (v && v.length === 6) l.push({
          colors: v,
          base: 3
        });
      });
      RAMPS = normRamps(l);
      RN = rc.size;
    }
    return RAMPS;
  }
  function rampsFor(rgba, W, H) {
    const all = rampsNow(), pk = new Set(paletteOf(rgba, W, H, {
      alphaThr: 1
    }).keys), l = [];
    for (const R of all) {
      for (const k of R.keys) if (pk.has(k)) {
        l.push(R);
        break;
      }
    }
    return l;
  }
  const XF = new WeakMap;
  const mir = l => [ -l[0], l[1], l[2] ];
  const rot90 = l => [ l[1], -l[0], l[2] ];
  function propOf(k) {
    let t = null, rest = null;
    if (k.startsWith("pF|")) {
      t = "F";
      rest = k.slice(3);
    } else if (k[0] === "p" && !k.startsWith("pfloor:")) {
      t = "p";
      rest = k.slice(1);
    }
    if (!rest) return null;
    const s = rest.split(":");
    if (s.length < 4 || !/^\d$/.test(s[s.length - 1])) return null;
    const kind = s[0], d = A.propDef && A.propDef(kind);
    if (!d) return null;
    return {
      t,
      kind,
      d,
      v: +s[1] | 0,
      col: s.slice(2, -1).join(":"),
      rot: +s[s.length - 1]
    };
  }
  function l0Of(c, deep) {
    const x = XF.get(c);
    if (x) return x;
    const k = A.keyOf(c);
    if (!k || deep > 3) return L0;
    const p = propOf(k);
    if (p && p.t === "F") {
      const b = A.propBase(p.kind, p.v, p.col || undefined, p.rot);
      if (b && b.c && b.c !== c) return l0Of(b.c, (deep | 0) + 1);
    } else if (p && p.rot === 1) {
      const d = p.d;
      if (!d.rotSym && !d.noRot && !(d.rotDraw && d.rotDraw[1] || d.rot)) return rot90(L0);
    }
    return L0;
  }
  const flip0 = A.flipX;
  A.flipX = function(src) {
    const c = flip0.apply(this, arguments);
    try {
      XF.set(c, mir(l0Of(src)));
    } catch (e) {}
    return c;
  };
  const INFO = new WeakMap;
  function classify(img) {
    if (!(img instanceof HTMLCanvasElement)) return null;
    const k = A.keyOf(img);
    if (!k) return null;
    let kind = null;
    if (/^(ch|turn:|bent:)/.test(k)) kind = "ch"; else if (/^(wf|tfr|tpf)/.test(k)) kind = "wall"; else if (k[0] === "p" && !k.startsWith("pfloor:")) kind = "prop";
    if (!kind || img.width < 4 || img.height < 4 || img.width > CFG.maxWH || img.height > CFG.maxWH) return null;
    return {
      img,
      k,
      kind,
      L0: l0Of(img),
      step: -1,
      out: null,
      q: false,
      src: null,
      cast: castOf(k, kind),
      sh: null,
      shx: 0,
      shy: 0
    };
  }
  function castOf(k, kind) {
    if (kind === "ch") return 1e9;
    if (kind !== "prop" || k.startsWith("po")) return 0;
    const p = propOf(k);
    if (!p) return 0;
    const dm = A.propDims ? A.propDims(p.kind, p.rot) : null, up = dm && dm.up != null ? dm.up : p.d.up;
    return Math.max(0, +up || 0);
  }
  let SC = null, SCX = null;
  function pixels(img) {
    const W = img.width, H = img.height;
    if (!SC || SC.width < W || SC.height < H) {
      SC = A.mk(Math.max(W, SC ? SC.width : 0, 64), Math.max(H, SC ? SC.height : 0, 64));
      SCX = SC.getContext("2d", {
        willReadFrequently: true
      });
    }
    SCX.clearRect(0, 0, W, H);
    nat.call(SCX, img, 0, 0);
    return SCX.getImageData(0, 0, W, H).data;
  }
  let STEP = -1, SUN = null, SUNID = null, FORCE = null, GEN = 0;
  const LIVE = [];
  const ST = DS.stat = {
    baked: 0,
    same: 0,
    out: 0,
    bakeMs: 0,
    frames: 0,
    sh: 0,
    shBaked: 0,
    tm: {
      px: 0,
      de: 0,
      hf: 0,
      nf: 0,
      rl: 0,
      mk: 0,
      sh: 0
    }
  };
  const now = () => performance.now();
  function shadowGeo(p, W, H) {
    let top = -1, B = -1;
    for (let y = 0; y < H && top < 0; y++) for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] >= 128) {
      top = y;
      break;
    }
    for (let y = H - 1; y >= 0 && B < 0; y--) for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] >= 128) {
      B = y;
      break;
    }
    if (B < 0) return null;
    const em = new Uint8Array(W * H);
    for (let y = Math.max(0, B - 8); y < H; y++) for (let x = 0; x < W; x++) {
      const j = y * W + x, i = j * 4, a = p[i + 3];
      if (a >= 1 && a <= 170 && p[i] < 40 && p[i + 1] < 40 && p[i + 2] < 40) em[j] = a;
    }
    return {
      top,
      B,
      em
    };
  }
  function shadowBake(r, S) {
    const cs = CFG.shadow, SV = SUN && SUN.sv;
    if (!cs || !cs.on || !SV || SV.a < 1) return;
    const img = r.img, W = img.width, H = img.height, p = S.rgba;
    const g = S.g !== undefined ? S.g : S.g = shadowGeo(p, W, H);
    if (!g) return;
    const U = r.cast, Hm = Math.min(g.B - g.top, U);
    if (!(Hm >= 1)) return;
    let vx = SV.vx, vy = SV.vy;
    const vl = Math.hypot(vx, vy);
    if (vl * Hm > cs.maxPx) {
      const s = cs.maxPx / (vl * Hm);
      vx *= s;
      vy *= s;
    }
    const tk = Math.max(0, cs.thick | 0), A0 = SV.a;
    const ox = Math.min(0, Math.floor(vx * Hm)) - 2, oy = Math.min(0, Math.floor(vy * Hm)) - tk - 2;
    const SW = W + Math.ceil(Math.abs(vx) * Hm) + 4, SH = H + Math.ceil(Math.abs(vy) * Hm) + 2 * tk + 4, al = new Uint8Array(SW * SH);
    const put = (fx, fy) => {
      const X = Math.round(fx) - ox, Y = Math.round(fy) - oy;
      if (X < 0 || X >= SW) return;
      for (let d = -tk; d <= tk; d++) {
        const yy = Y + d;
        if (yy >= 0 && yy < SH) al[yy * SW + X] = A0;
      }
    };
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(vx), Math.abs(vy)) * 2));
    for (let y = g.top; y <= g.B; y++) {
      const h0 = g.B - y;
      for (let x = 0; x < W; x++) {
        if (p[(y * W + x) * 4 + 3] < 128) continue;
        if (h0 >= U) put(x + vx * U, y + U + vy * U); else for (let s = 0; s < n; s++) {
          const h = Math.min(U, Math.max(0, h0 - .5 + (s + .5) / n));
          put(x + vx * h, g.B + vy * h);
        }
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const j = y * W + x, a = p[j * 4 + 3];
      if (!a) continue;
      const k = (y - oy) * SW + (x - ox);
      if (a >= 128) al[k] = 0; else if (g.em[j] && al[k]) {
        const e = g.em[j] / 255, m = al[k] / 255;
        al[k] = m <= e ? 0 : Math.round(255 * (m - e) / (1 - e));
      }
    }
    let x0 = SW, y0 = SH, x1 = -1, y1 = -1;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (al[y * SW + x]) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x1 < 0) return;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[(y * w + x) * 4 + 3] = al[(y + y0) * SW + x + x0];
    const c = A.mk(w, h);
    c.getContext("2d").putImageData(new ImageData(px, w, h), 0, 0);
    r.sh = c;
    r.shx = ox + x0;
    r.shy = oy + y0;
    ST.shBaked++;
  }
  function svOf(L) {
    const cs = CFG.shadow, Ly = L[1];
    if (!cs || !cs.on || !(Ly > .02)) return null;
    let vx = -L[0] / Ly, vy = -L[2] / Ly * cs.ys;
    const l = Math.hypot(vx, vy);
    if (l > cs.maxK) {
      vx *= cs.maxK / l;
      vy *= cs.maxK / l;
    }
    const el = Math.asin(Math.min(1, Ly)) * 180 / Math.PI, f = Math.max(0, Math.min(1, (el - cs.el0) / cs.elFade));
    return {
      vx,
      vy,
      a: Math.round(cs.a * 255 * f),
      el
    };
  }
  function bake(r) {
    const img = r.img, W = img.width, H = img.height, c = CFG[r.kind];
    const T = ST.tm;
    let t0 = now(), t1;
    if (r.gen !== GEN) {
      r.src = null;
      r.gen = GEN;
    }
    let S = r.src;
    if (!S) {
      const rgba = pixels(img);
      t1 = now();
      T.px += t1 - t0;
      t0 = t1;
      const d = delight(rgba, W, H, {
        ramps: rampsFor(rgba, W, H),
        rest: "auto"
      });
      t1 = now();
      T.de += t1 - t0;
      t0 = t1;
      if (!d.dots || d.orphan >= d.dots) S = r.src = {
        none: true,
        rgba
      }; else {
        const h = heightFromDelit(d, {
          bevel: c.bevel,
          levelWeight: c.lw
        }), m = new Uint8Array(W * H);
        t1 = now();
        T.hf += t1 - t0;
        t0 = t1;
        for (let i = 0; i < W * H; i++) m[i] = rgba[i * 4 + 3] >= 128 ? 1 : 0;
        const n = normalFromHeight(h, W, H, {
          strength: c.str,
          wrap: false,
          mask: m
        });
        t1 = now();
        T.nf += t1 - t0;
        t0 = t1;
        S = r.src = {
          rgba,
          d,
          n
        };
      }
    }
    r.step = STEP;
    r.out = null;
    r.sh = null;
    if (r.cast) {
      try {
        shadowBake(r, S);
      } catch (e) {
        r.sh = null;
      }
      t1 = now();
      T.sh += t1 - t0;
      t0 = t1;
    }
    if (S.none) ST.same++; else {
      const rgba = S.rgba, lit = relight(S.d, S.n, {
        L: SUN.L,
        L0: r.L0,
        mode: "relative",
        k: c.k,
        only: c.only,
        flat: c.flat,
        keepEdge: c.keepEdge,
        shift: shOf(c, SUN.L)
      });
      t1 = now();
      T.rl += t1 - t0;
      t0 = t1;
      let diff = false;
      for (let i = 0; i < lit.length; i += 4) if (lit[i] !== rgba[i] || lit[i + 1] !== rgba[i + 1] || lit[i + 2] !== rgba[i + 2]) {
        diff = true;
        break;
      }
      ST.baked++;
      if (!diff) ST.same++; else {
        const o = A.mk(W, H);
        o.getContext("2d").putImageData(new ImageData(lit, W, H), 0, 0);
        r.out = o;
        ST.out++;
        T.mk += now() - t0;
      }
    }
    if (r.out || r.sh) LIVE.push(r);
  }
  function sunCheck() {
    const Rd = SX.raid, G = SX.game, rs = G && G.raidSun, at = rs && Rd && rs.seed === Rd.seed ? rs.at : null, id = FORCE != null ? "F" + FORCE : (Rd ? Rd.seed : 0) + "|" + at;
    if (id === SUNID) return;
    SUNID = id;
    let t;
    if (FORCE != null) t = FORCE; else if (typeof at === "number" && isFinite(at) && SX.prog && SX.prog.todPos) {
      const sp = SX.prog.TOD_SPAN, pos = SX.prog.todPos(at);
      t = pos < sp ? pos / sp : pos < 1.5 * sp ? 1 : 0;
    } else t = ((Rd && Rd.seed) >>> 0) % (CFG.steps + 1) / CFG.steps;
    const s = sunAt(t, {
      keys: CFG.keys,
      steps: CFG.steps
    }), st = Math.round(s.t * CFG.steps);
    const key = st + GEN * 64;
    if (key !== STEP) s.sv = svOf(s.L);
    const sv = key !== STEP ? s.sv : SUN && SUN.sv;
    DS.sun = {
      t: s.t,
      step: st,
      az: Math.round(s.az * 10) / 10,
      el: Math.round(s.el * 10) / 10,
      sv: sv ? {
        vx: Math.round(sv.vx * 1e3) / 1e3,
        vy: Math.round(sv.vy * 1e3) / 1e3,
        a: sv.a,
        el: Math.round(sv.el * 10) / 10
      } : null
    };
    if (key === STEP) return;
    STEP = key;
    SUN = s;
    for (const r of LIVE) {
      r.out = null;
      r.sh = null;
    }
    LIVE.length = 0;
  }
  const CUR = {
    on: false,
    ctx: null,
    cam: null,
    F: null
  };
  const Q = [];
  let qi = 0;
  let TR = null;
  const CP = CanvasRenderingContext2D.prototype, nat = CP.drawImage;
  function insideAt(a, r, img, M) {
    const F = CUR.F;
    if (!F || !F.inside || !CUR.cam) return false;
    let dx, dy, dw, dh;
    const n = a.length;
    if (n >= 9) {
      dx = a[5];
      dy = a[6];
      dw = a[7];
      dh = a[8];
    } else if (n >= 5) {
      dx = a[1];
      dy = a[2];
      dw = a[3];
      dh = a[4];
    } else {
      dx = a[1];
      dy = a[2];
      dw = img.width;
      dh = img.height;
    }
    const px = dx + dw / 2, py = dy + dh + (r.kind === "wall" ? TS / 2 : -2);
    const m = M || CUR.ctx.getTransform(), X = m.a * px + m.c * py + m.e + CUR.cam.x, Y = m.b * px + m.d * py + m.f + CUR.cam.y;
    const tx = Math.floor(X / TS), ty = Math.floor(Y / TS);
    if (!F.in || !F.in(tx, ty)) return false;
    return !!F.inside[ty * F.W + tx];
  }
  const ALIAS = new WeakMap, AL1 = {
    sx: 1,
    x: 0,
    y: 0
  };
  const infoOf = img => {
    let r = INFO.get(img);
    if (r === undefined) {
      r = classify(img);
      INFO.set(img, r);
    }
    return r;
  };
  const infoIf = img => {
    const r = INFO.get(img);
    return r !== undefined ? r : A.keyOf(img) ? infoOf(img) : null;
  };
  if (A.charBig) {
    const big0 = A.charBig;
    A.charBig = function(spr, sc) {
      const q = big0.apply(this, arguments);
      try {
        if (q && q.c && !ALIAS.has(q.c)) {
          const r = infoIf(spr);
          if (r && r.cast) ALIAS.set(q.c, {
            src: spr,
            sx: sc,
            x: q.ox - A.CHAR_OX * sc,
            y: q.oy - A.CHAR_OY * sc
          });
        }
      } catch (e) {}
      return q;
    };
  }
  const okT = m => m.b === 0 && m.c === 0 && m.a > 0 && m.d > 0;
  function shAt(ctx, R, al, img, a, n) {
    const W = img.width, H = img.height;
    let ix, iy, kx = 1, ky = 1;
    if (n === 3) {
      ix = a[1];
      iy = a[2];
    } else if (n === 5) {
      ix = a[1];
      iy = a[2];
      kx = a[3] / W;
      ky = a[4] / H;
    } else if (n === 9 && a[1] === 0 && a[3] === W && a[7] === W && a[2] + a[4] === H) {
      ix = a[5];
      iy = a[6] + a[8] - H;
    } else return;
    const S = R.sh, sx = al.sx * kx, sy = al.sx * ky, x = ix + al.x * kx + R.shx * sx, y = iy + al.y * ky + R.shy * sy;
    if (sx === 1 && sy === 1) nat.call(ctx, S, x, y); else nat.call(ctx, S, x, y, S.width * sx, S.height * sy);
    ST.sh++;
    if (TR) TR.push(R.img);
  }
  CP.drawImage = function(img) {
    const n = arguments.length;
    if (CUR.on && this === CUR.ctx && img) {
      const r = infoOf(img);
      let R = r, al = AL1;
      if (!r) {
        al = ALIAS.get(img);
        R = al ? infoOf(al.src) : null;
      }
      if (R) {
        if (R.step !== STEP) {
          if (!R.q) {
            R.q = true;
            Q.push(R);
          }
        } else if (R.sh || r && r.out) {
          const m = this.getTransform();
          if (!insideAt(arguments, R, img, m)) {
            if (R.sh && okT(m)) shAt(this, R, al, img, arguments, n);
            if (r && r.out) {
              arguments[0] = r.out;
              if (TR) TR.push(img);
            }
          }
        }
      }
    } else if (n === 3 && img && arguments[1] === 0 && arguments[2] === 0 && this !== CUR.ctx && img instanceof HTMLCanvasElement) {
      const cv = this.canvas;
      if (cv && cv !== img && cv.width === img.width && cv.height === img.height) {
        const r = infoIf(img), al = r ? r.cast ? {
          src: img,
          sx: 1,
          x: 0,
          y: 0
        } : null : ALIAS.get(img);
        if (al) {
          const m = this.getTransform();
          if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 && m.e === 0 && m.f === 0) ALIAS.set(cv, al);
        }
      }
    }
    return nat.apply(this, arguments);
  };
  DS.frame = function(F, env, view) {
    const G = SX.game, Rd = SX.raid;
    const on = !!(DS.on && env && !env.night && !env.hub && G && G.state === "raid" && Rd && Rd.tod === "day" && view && view.ctx);
    CUR.on = on;
    if (!on) return;
    CUR.ctx = view.ctx;
    CUR.cam = view.cam;
    CUR.F = F;
    sunCheck();
    if (qi < Q.length) {
      const t0 = performance.now();
      while (qi < Q.length && performance.now() - t0 < CFG.budget) {
        const r = Q[qi++];
        r.q = false;
        if (r.step !== STEP) {
          try {
            bake(r);
          } catch (e) {
            r.step = STEP;
            r.out = null;
          }
        }
      }
      ST.bakeMs += performance.now() - t0;
      ST.frames++;
      if (qi >= Q.length) {
        Q.length = 0;
        qi = 0;
      } else if (qi > 256) {
        Q.splice(0, qi);
        qi = 0;
      }
    }
  };
  DS.force = t => {
    FORCE = t == null ? null : Math.max(0, Math.min(1, +t));
    SUNID = null;
  };
  DS.bakeAll = () => {
    let n = 0;
    while (qi < Q.length) {
      const r = Q[qi++];
      r.q = false;
      if (r.step !== STEP) {
        bake(r);
        n++;
      }
    }
    Q.length = 0;
    qi = 0;
    return n;
  };
  DS.queue = () => Q.length - qi;
  DS.retune = () => {
    GEN++;
    STEP = -1;
    SUNID = null;
    for (const r of LIVE) {
      r.out = null;
      r.sh = null;
    }
    LIVE.length = 0;
  };
  DS.cur = () => CUR.on;
  DS.trace = on => {
    const l = TR;
    TR = on ? [] : null;
    return l;
  };
  DS.live = () => LIVE.map(r => ({
    k: r.k,
    kind: r.kind,
    base: r.L0 === L0,
    img: r.img,
    out: r.out,
    sh: r.sh,
    shx: r.shx,
    shy: r.shy,
    cast: r.cast,
    B: r.src && r.src.g ? r.src.g.B : null
  }));
  DS.ramps = () => rampsNow().length;
  DS.info = img => {
    const r = INFO.get(img);
    return r ? {
      k: r.k,
      kind: r.kind,
      L0: r.L0,
      step: r.step,
      out: !!r.out,
      cast: r.cast,
      sh: r.sh ? {
        x: r.shx,
        y: r.shy,
        w: r.sh.width,
        h: r.sh.height
      } : null
    } : r;
  };
  DS.alias = img => {
    const a = ALIAS.get(img);
    return a ? {
      src: a.src,
      sx: a.sx,
      x: a.x,
      y: a.y
    } : null;
  };
  DS.relightOf = (img, t, kind) => {
    const W = img.width, H = img.height, c = CFG[kind || (INFO.get(img) || {}).kind || "prop"], rgba = new Uint8ClampedArray(pixels(img));
    const d = delight(rgba, W, H, {
      ramps: rampsFor(rgba, W, H),
      rest: "auto"
    }), h = heightFromDelit(d, {
      bevel: c.bevel,
      levelWeight: c.lw
    }), m = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) m[i] = rgba[i * 4 + 3] >= 128 ? 1 : 0;
    const n = normalFromHeight(h, W, H, {
      strength: c.str,
      wrap: false,
      mask: m
    }), s = sunAt(t, {
      keys: CFG.keys,
      steps: CFG.steps
    });
    return {
      src: rgba,
      lit: relight(d, n, {
        L: s.L,
        L0: l0Of(img),
        mode: "relative",
        k: c.k,
        only: c.only,
        flat: c.flat,
        keepEdge: c.keepEdge,
        shift: shOf(c, s.L)
      }),
      W,
      H,
      d
    };
  };
  DS.kit = {
    paletteOf,
    paletteCheck,
    dotBlockCheck,
    sunAt,
    azEl,
    glDir,
    L0
  };
})(window.SX);
