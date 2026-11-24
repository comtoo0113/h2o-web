"use strict";

(function(SX) {
  const A = SX.art;
  if (!A || !A.mk) return;
  const TS = SX.TS || 32, CH = 16, CPX = CH * TS, T = SX.map && SX.map.T || {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    WINDOW: 3,
    DOOR: 4,
    PARAPET: 7
  };
  const GR = SX.grass = {
    on: true,
    CAP: 160,
    DCAP: 520,
    BUILD: 2,
    LRU: 24,
    stats: {
      off: true
    },
    peak: {
      redraws: 0,
      draws: 0,
      ms: 0
    },
    slow: []
  };
  GR.still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const WD = GR.wind = {
    dirX: 1,
    dirZ: .35,
    speed: 3.4,
    scale: 9,
    strength: .32,
    base: .06,
    sway: .07,
    period: 2.6,
    seed: 9
  };
  {
    const l = Math.hypot(WD.dirX, WD.dirZ);
    WD.dx = WD.dirX / l;
    WD.dz = WD.dirZ / l;
  }
  const LO = WD.base - WD.sway, HI = WD.base + WD.strength + WD.sway, NW = 4;
  const SIN = new Float32Array(256);
  for (let i = 0; i < 256; i++) SIN[i] = Math.sin(i / 256 * Math.PI * 2);
  const OFF = 65536;
  function hash3(a, b, c) {
    let h = (Math.imul(a + OFF | 0, 668265261) ^ Math.imul(b + OFF | 0, 374761393) ^ Math.imul(c | 0, 2654435769)) >>> 0;
    h = Math.imul(h ^ h >>> 15, 739982445) >>> 0;
    h = Math.imul(h ^ h >>> 12, 695872825) >>> 0;
    return (h ^ h >>> 15) >>> 0;
  }
  const h01 = (a, b, c) => hash3(a, b, c) / 4294967296;
  function noise2(x, z, seed) {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const a = h01(ix, iz, seed), b = h01(ix + 1, iz, seed), c = h01(ix, iz + 1, seed), d = h01(ix + 1, iz + 1, seed);
    const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  }
  function gust(t, x, y) {
    const s = WD.speed * t, g = noise2((x - WD.dx * s) / WD.scale, (y - WD.dz * s) / WD.scale, WD.seed);
    return g * g * (3 - 2 * g);
  }
  function windFrame(t, x, y, ph, gentle) {
    const g = gust(t, x, y), a = WD.base + WD.strength * g + SIN[t / WD.period * 256 + ph & 255] * WD.sway * (.35 + .65 * g);
    let f = Math.round((a - LO) / (HI - LO) * (NW - 1));
    f = f < 0 ? 0 : f > NW - 1 ? NW - 1 : f;
    return gentle && f > 1 ? 1 : f;
  }
  GR.frameAt = windFrame;
  GR.hash3 = hash3;
  function TM(size, cell) {
    this.size = size;
    this.cell = cell;
    this.hold = .8;
    this.recover = 7;
    const n = size * size;
    this.v = new Float32Array(n);
    this.dx = new Float32Array(n);
    this.dz = new Float32Array(n);
    this.age = new Float32Array(n);
    this.ox = null;
    this.oz = null;
    this.live = 0;
    this.hot = false;
  }
  TM.prototype.slot = function(ix, iz) {
    const s = this.size;
    return (iz % s + s) % s * s + (ix % s + s) % s;
  };
  TM.prototype.inWin = function(ix, iz) {
    return this.ox !== null && ix >= this.ox && ix < this.ox + this.size && iz >= this.oz && iz < this.oz + this.size;
  };
  TM.prototype.clear = function() {
    this.v.fill(0);
    this.dx.fill(0);
    this.dz.fill(0);
    this.age.fill(0);
    this.live = 0;
    this.hot = false;
  };
  TM.prototype._col = function(ix) {
    const s = this.size, i = (ix % s + s) % s;
    for (let j = 0; j < s; j++) {
      const k = j * s + i;
      this.v[k] = 0;
      this.age[k] = 0;
    }
  };
  TM.prototype._row = function(iz) {
    const s = this.size, j = (iz % s + s) % s;
    for (let i = 0; i < s; i++) {
      const k = j * s + i;
      this.v[k] = 0;
      this.age[k] = 0;
    }
  };
  TM.prototype.recenter = function(x, z) {
    const s = this.size, nx = Math.floor(x / this.cell) - (s >> 1), nz = Math.floor(z / this.cell) - (s >> 1);
    if (this.ox === null) {
      this.ox = nx;
      this.oz = nz;
      return;
    }
    if (nx === this.ox && nz === this.oz) return;
    if (Math.abs(nx - this.ox) >= s || Math.abs(nz - this.oz) >= s) this.clear(); else {
      if (nx > this.ox) for (let i = this.ox + s; i < nx + s; i++) this._col(i); else for (let i = nx; i < this.ox; i++) this._col(i);
      if (nz > this.oz) for (let i = this.oz + s; i < nz + s; i++) this._row(i); else for (let i = nz; i < this.oz; i++) this._row(i);
    }
    this.ox = nx;
    this.oz = nz;
  };
  TM.prototype.stamp = function(x, z, r, st, dirX, dirZ) {
    const c = this.cell, i0 = Math.floor((x - r) / c), i1 = Math.floor((x + r) / c), j0 = Math.floor((z - r) / c), j1 = Math.floor((z + r) / c);
    const ml = Math.hypot(dirX || 0, dirZ || 0), mx = ml > 1e-6 ? dirX / ml : 0, mz = ml > 1e-6 ? dirZ / ml : 0;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (!this.inWin(i, j)) continue;
      const px = (i + .5) * c - x, pz = (j + .5) * c - z, d = Math.hypot(px, pz);
      if (d > r) continue;
      const e = (d - r * .5) / (r * .5), f = st * (e <= 0 ? 1 : 1 - e * e * (3 - 2 * e));
      if (f <= .001) continue;
      let ex = (d > 1e-6 ? px / d : 0) * .6 + mx, ez = (d > 1e-6 ? pz / d : 0) * .6 + mz, el = Math.hypot(ex, ez);
      if (el < 1e-6) {
        ex = 1;
        ez = 0;
        el = 1;
      }
      const k = this.slot(i, j);
      if (f >= this.v[k]) {
        this.v[k] = f;
        this.dx[k] = ex / el;
        this.dz[k] = ez / el;
      }
      this.age[k] = 0;
      this.hot = true;
    }
  };
  TM.prototype.update = function(dt) {
    if (!this.hot) return 0;
    const n = this.v.length;
    let live = 0;
    for (let k = 0; k < n; k++) {
      if (this.v[k] <= 0) continue;
      const a = this.age[k] + dt;
      this.age[k] = a;
      if (a > this.hold) this.v[k] = Math.max(0, this.v[k] - Math.min(dt, a - this.hold) / this.recover);
      if (this.v[k] > 0) live++;
    }
    this.live = live;
    if (!live) this.hot = false;
    return live;
  };
  TM.prototype.at = function(x, z) {
    const i = Math.floor(x / this.cell), j = Math.floor(z / this.cell);
    return this.inWin(i, j) ? this.slot(i, j) : -1;
  };
  const tm = GR.tm = new TM(96, .5);
  const PX = 3, NS = 10, HID = 10;
  const sets = [], setKey = new Map;
  function plain(c) {
    const d = A.mk(c.width, c.height);
    d.getContext("2d").drawImage(c, 0, 0);
    return d;
  }
  function outlined(raw) {
    const c = A.mk(raw.width, raw.height), x = c.getContext("2d", {
      willReadFrequently: true
    });
    x.drawImage(raw, 0, 0);
    A.outline(c, {
      mat: true
    });
    return c;
  }
  function framesOf(raw, orig) {
    const w = raw.width, h = raw.height, W2 = w + PX * 2, src = raw.getContext("2d").getImageData(0, 0, w, h).data;
    let top = h, bot = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (src[(y * w + x) * 4 + 3]) {
      if (y < top) top = y;
      if (y > bot) bot = y;
    }
    const out = new Array(NS), span = Math.max(1, bot - top);
    for (let s = 0; s < NS; s++) {
      if (s === 0) {
        const c = A.mk(W2, h);
        c.getContext("2d").drawImage(orig, PX, 0);
        out[0] = c;
        continue;
      }
      const c = A.mk(W2, h), x2 = c.getContext("2d", {
        willReadFrequently: true
      }), im = x2.createImageData(W2, h), q = im.data;
      for (let y = bot; y >= top; y--) {
        const v = (bot - y) / span;
        let sx = 0, ny = y;
        if (s < NW) sx = Math.min(2, Math.round(s / (NW - 1) * 2.4 * v * v)); else {
          const flat = s >= 7, d = (s - 4) % 3 - 1;
          ny = bot - Math.round((bot - y) * (flat ? .34 : .62));
          sx = d * Math.min(2, Math.round((flat ? 2.6 : 1.6) * v));
        }
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (!src[i + 3]) continue;
          const j = (ny * W2 + x + PX + sx) * 4;
          q[j] = src[i];
          q[j + 1] = src[i + 1];
          q[j + 2] = src[i + 2];
          q[j + 3] = src[i + 3];
        }
      }
      x2.putImageData(im, 0, 0);
      A.outline(c, {
        mat: true
      });
      out[s] = plain(c);
    }
    return out;
  }
  function setOf(key, mkRaw, mkOrig) {
    let id = setKey.get(key);
    if (id != null) return id;
    const raw = mkRaw(), orig = mkOrig && mkOrig() || outlined(raw);
    id = sets.length;
    sets.push({
      key,
      f: framesOf(raw, orig),
      w: raw.width + PX * 2,
      h: raw.height
    });
    setKey.set(key, id);
    return id;
  }
  function tuftRaw(v) {
    const g = new SX.Rng(SX.hash("grassTuft") + v * 7919), w = 5 + g.i(3), h = 5 + g.i(4);
    const c = A.mk(w + 2, h + 2), x = c.getContext("2d", {
      willReadFrequently: true
    }), P = new A.Pen(x);
    x.translate(1, 1);
    const cols = [ "#6a7a45", "#5d6e3c", "#7b8a50" ], n = 3 + g.i(3);
    for (let k = 0; k < n; k++) {
      const bx = Math.round(k * (w - 1) / (n - 1)), lean = k === 0 ? -1 : k === n - 1 ? 1 : 0, bh = Math.max(2, h - g.i(3) - (lean ? 1 : 0)), col = cols[g.i(3)];
      for (let r = 0; r < bh; r++) {
        const yy = h - 1 - r, xx = bx + (lean && r >= bh - 2 ? lean : 0);
        if (xx >= 0 && xx < w) P.p(xx, yy, r === bh - 1 ? "#8d9c5c" : col);
      }
    }
    P.r(1, h - 1, w - 2, 1, "#4a5a30");
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  function drRaw(d, vi) {
    const c = A.mk(d.w + 2, d.h + 2), x = c.getContext("2d", {
      willReadFrequently: true
    });
    x.translate(1, 1);
    d.draw(new A.Pen(x), new SX.Rng(SX.hash("dk:" + d.name) + vi * 7919), vi);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  function dhRaw(k, o, v) {
    const c = A.mk(o.w + 2, o.h + 2), x = c.getContext("2d", {
      willReadFrequently: true
    });
    x.translate(1, 1);
    o.d(new A.Pen(x), new SX.Rng(SX.hash(k) + v * 7919), v);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  GR.want = function() {
    if (!GR.on || GR.still) return false;
    const o = SX.opts;
    if (o && o.lightQ === "low") return false;
    const R = SX.raid;
    if (R && R.flood && R.on && SX.game && SX.game.state === "raid") return false;
    return true;
  };
  GR.live = function(F) {
    if (!F) return false;
    if (F._grLive === undefined) F._grLive = GR.want();
    return F._grLive;
  };
  function tileOk(F, i, tx, ty) {
    if (F.out && F.out.land && F.out.land[i]) return false;
    const t = F.t[i];
    let fs = F.fs[i];
    if (F.mat && F.mat[i]) fs = F.mat[i];
    if (fs !== A.FS.GRASS) return false;
    if (t === T.VOID && (F.out || F.kind === "floor" && F.idx > 0 || F.kind === "roof" || F.kind === "hub")) return false;
    if (t === T.WALL || t === T.WINDOW || t === T.PARAPET || t === T.DOOR) return false;
    if (F.tintAt && F.tintAt(tx, ty, fs)) return false;
    if (F.sfAt && F.sfAt(i)) return false;
    return true;
  }
  const gentleAt = (F, ax, ay) => {
    const x = Math.floor(ax), y = Math.floor(ay);
    return F.kind !== "roof" && F.in(x, y) && F.t[F.i(x, y)] === T.FLOOR;
  };
  function seedOf(F) {
    return (F.idx | 0) * 7919 + F.W * 131 + F.H * 31 + (F.kind === "hub" ? 5 : F.kind === "roof" ? 3 : 0) | 0;
  }
  function place(F, G) {
    const add = (left, top, set, ax, ay, ref) => {
      G.x.push(left);
      G.y.push(top);
      G.set.push(set);
      G.ax.push(ax);
      G.ay.push(ay);
      G.ref.push(ref || null);
      G.gen.push(gentleAt(F, ax, ay) ? 1 : 0);
      G.ph.push(hash3(Math.round(ax * 16), Math.round(ay * 16), G.seed + 7) & 255);
    };
    for (let ty = 0; ty < F.H; ty++) for (let tx = 0; tx < F.W; tx++) {
      const i = F.i(tx, ty);
      if (!tileOk(F, i, tx, ty)) continue;
      const n = [ 0, 1, 1, 2 ][hash3(tx, ty, G.seed) & 3];
      for (let k = 0; k < n; k++) {
        if (G.amt < 1 && hash3(tx, ty, G.seed + 211 + k) / 4294967296 >= G.amt) continue;
        const hv = hash3(tx, ty, G.seed + 101 + k), v = hv & 7, set = setOf("tuft:" + v, () => tuftRaw(v)), S = sets[set];
        const left = tx * TS + (hv >>> 3) % (TS - S.w + 1), top = ty * TS + (hv >>> 11) % (TS - S.h + 1);
        add(left, top, set, (left + S.w / 2) / TS, (top + S.h - 2) / TS, null);
      }
    }
    const DR = SX.decoRaid, wk = DR && DR.K && DR.K.weeds;
    if (F.decoR && wk && DR.ensure) {
      DR.ensure(F);
      const D = F.decoL;
      if (D) for (let k = 0; k < (F.decoN | 0); k++) {
        const o = k * 6;
        if (D[o] !== wk.idx) continue;
        const vi = D[o + 3] % wk.nv, set = setOf("dr:weeds:" + vi, () => drRaw(wk, vi), () => DR.sprite("weeds", vi)), S = sets[set], x = D[o + 1], y = D[o + 2];
        add(x - PX, y, set, (x + (S.w - PX * 2) / 2) / TS, (y + S.h - 2) / TS, null);
      }
    }
    const DH = SX.decoHub;
    if (F.dh && DH && DH.OBJ && DH.objCanvas) for (const it of F.dh.floor) {
      if (it.m || it.k !== "weed" && it.k !== "tuft") continue;
      const o = DH.OBJ[it.k];
      if (!o) continue;
      const v = it.v | 0, set = setOf("dh:" + it.k + ":" + v, () => dhRaw(it.k, o, v), () => DH.objCanvas(it.k, v)), S = sets[set];
      add(it.x - PX, it.y, set, (it.x + it.w / 2) / TS, (it.y + it.h - 2) / TS, it);
    }
  }
  function build(F) {
    const t0 = performance.now();
    const G = {
      F,
      seed: seedOf(F),
      amt: SX.decoAmt ? SX.decoAmt() : 1,
      x: [],
      y: [],
      set: [],
      ax: [],
      ay: [],
      ph: [],
      gen: [],
      ref: [],
      n: 0,
      cellAt: new Int32Array(F.W * F.H).fill(-1),
      ct: [],
      list: [],
      own: [],
      clip: [],
      cch: [],
      sc: [],
      ch: new Map,
      q: [],
      last: 0,
      fresh: true,
      t: 0
    };
    place(F, G);
    const n = G.n = G.x.length;
    const cellOf = (tx, ty) => {
      const i = F.i(tx, ty);
      let c = G.cellAt[i];
      if (c >= 0) return c;
      c = G.cellAt[i] = G.list.length;
      G.ct.push(tx, ty);
      G.list.push([]);
      G.own.push([]);
      G.clip.push(0);
      const cx = Math.floor(tx / CH), cy = Math.floor(ty / CH), key = cy * 4096 + cx;
      let k = G.ch.get(key);
      if (!k) {
        k = {
          cx,
          cy,
          cells: [],
          cv: null,
          use: 0
        };
        G.ch.set(key, k);
      }
      k.cells.push(c);
      G.cch.push(k);
      if (!k.bb) k.bb = new Int16Array(64).fill(-1);
      {
        const lx = tx - cx * CH, ly = ty - cy * CH, o = ((ly >> 2) * 4 + (lx >> 2)) * 4, bb = k.bb;
        if (bb[o] < 0) {
          bb[o] = bb[o + 2] = lx;
          bb[o + 1] = bb[o + 3] = ly;
        } else {
          if (lx < bb[o]) bb[o] = lx;
          if (ly < bb[o + 1]) bb[o + 1] = ly;
          if (lx > bb[o + 2]) bb[o + 2] = lx;
          if (ly > bb[o + 3]) bb[o + 3] = ly;
        }
      }
      return c;
    };
    for (let s = 0; s < n; s++) {
      const S = sets[G.set[s]], x0 = G.x[s], y0 = G.y[s], x1 = x0 + S.w - 1, y1 = y0 + S.h - 1, C = [];
      const a0 = Math.floor(x0 / TS), a1 = Math.floor(x1 / TS), b0 = Math.floor(y0 / TS), b1 = Math.floor(y1 / TS), cross = a0 !== a1 || b0 !== b1;
      for (let ty = b0; ty <= b1; ty++) for (let tx = a0; tx <= a1; tx++) {
        if (!F.in(tx, ty)) continue;
        const c = cellOf(tx, ty);
        G.list[c].push(s);
        if (cross) G.clip[c] = 1;
        C.push(c);
      }
      G.sc.push(C);
      if (!C.length) continue;
      const ax = Math.floor(G.ax[s]), ay = Math.floor(G.ay[s]), oc = F.in(ax, ay) && G.cellAt[F.i(ax, ay)] >= 0 ? G.cellAt[F.i(ax, ay)] : C[0];
      G.own[oc].push(s);
    }
    for (const L of G.list) L.sort((a, b) => G.y[a] + sets[G.set[a]].h - (G.y[b] + sets[G.set[b]].h) || G.x[a] - G.x[b]);
    G.cur = new Int8Array(n).fill(-1);
    G.dq = new Uint8Array(G.list.length);
    G.buildMs = +(performance.now() - t0).toFixed(2);
    return G;
  }
  function stateOf(G, s, t) {
    const r = G.ref[s];
    if (r && (r.hid || r.gone || r.ovf)) return HID;
    if (tm.live) {
      const k = tm.at(G.ax[s], G.ay[s]);
      if (k >= 0) {
        const v = tm.v[k];
        if (v > .12) {
          const dx = tm.dx[k];
          return (v > .5 ? 7 : 4) + (dx > .38 ? 2 : dx < -.38 ? 0 : 1);
        }
      }
    }
    return windFrame(t, G.ax[s], G.ay[s], G.ph[s], G.gen[s]);
  }
  function mark(G, s) {
    const C = G.sc[s];
    for (let m = 0; m < C.length; m++) {
      const c = C[m];
      if (!G.dq[c]) {
        G.dq[c] = 1;
        G.q.push(c);
      }
    }
  }
  function drawCell(G, o, c, X0, Y0) {
    const x = G.ct[c * 2] * TS - X0, y = G.ct[c * 2 + 1] * TS - Y0, L = G.list[c], cl = G.clip[c];
    let n = 0;
    if (cl) {
      o.save();
      o.beginPath();
      o.rect(x, y, TS, TS);
      o.clip();
    }
    o.clearRect(x, y, TS, TS);
    for (let j = 0; j < L.length; j++) {
      const s = L[j];
      let st = G.cur[s];
      if (st < 0) {
        st = G.cur[s] = stateOf(G, s, G.t);
      }
      if (st === HID) continue;
      o.drawImage(sets[G.set[s]].f[st], G.x[s] - X0, G.y[s] - Y0);
      n++;
    }
    if (cl) o.restore();
    G.dq[c] = 0;
    return n;
  }
  let useTick = 0;
  const BUILT = new Set;
  function buildChunk(G, k, st) {
    while (BUILT.size >= GR.LRU) {
      let old = null;
      for (const q of BUILT) if (!old || q.use < old.use) old = q;
      if (!old) break;
      old.cv = null;
      BUILT.delete(old);
    }
    k.cv = A.mk(CPX, CPX);
    BUILT.add(k);
    const o = k.cv.getContext("2d"), X0 = k.cx * CPX, Y0 = k.cy * CPX;
    for (const c of k.cells) for (const s of G.list[c]) {
      const ns = stateOf(G, s, G.t);
      if (ns !== G.cur[s]) {
        G.cur[s] = ns;
        mark(G, s);
      }
    }
    for (const c of k.cells) {
      st.bdraws += drawCell(G, o, c, X0, Y0);
    }
    st.builds++;
  }
  const PREV = new WeakMap;
  const OFFST = {
    off: true
  };
  GR.draw = function(ctx, F, cam, now, actors, tx0, ty0, tx1, ty1) {
    const w = GR.want();
    actors = actors || [];
    if (F._grLive !== w) {
      F._grLive = w;
      if (F.chunks) F.chunks.clear();
      if (!w) {
        if (F._gr) for (const k of F._gr.ch.values()) if (k.cv) {
          k.cv = null;
          BUILT.delete(k);
        }
        F._gr = null;
      }
    }
    if (!w) {
      GR.stats = OFFST;
      return;
    }
    const T0 = performance.now();
    let G = F._gr;
    if (G && G.amt !== (SX.decoAmt ? SX.decoAmt() : 1)) {
      for (const k of G.ch.values()) if (k.cv) {
        k.cv = null;
        BUILT.delete(k);
      }
      G = F._gr = null;
    }
    let nb = 0;
    if (!G) {
      G = F._gr = build(F);
      nb = G.buildMs;
    }
    const st = GR.stats = {
      n: G.n,
      cells: G.list.length,
      evals: 0,
      changed: 0,
      redraws: 0,
      draws: 0,
      bdraws: 0,
      blits: 0,
      builds: 0,
      q: 0,
      cap: 0,
      live: 0,
      ms: 0,
      buildMs: G.buildMs
    };
    if (!G.n) {
      st.ms = +(performance.now() - T0).toFixed(3);
      return;
    }
    if (!G.last || now - G.last > .5) G.fresh = true;
    const dt = G.last ? Math.min(.1, Math.max(0, now - G.last)) : 0;
    G.last = now;
    G.t = now;
    if (GR._F !== F) {
      tm.clear();
      GR._F = F;
    }
    tm.recenter((tx0 + tx1) / 2, (ty0 + ty1 - 3) / 2);
    const P = SX.actors && SX.actors.player;
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      if (!a || !isFinite(a.x) || !isFinite(a.y)) continue;
      if (F.seeOff && a !== P && F.seeOff(Math.floor(a.x), Math.floor(a.y))) continue;
      let pv = PREV.get(a);
      if (!pv) {
        pv = {
          x: a.x,
          y: a.y,
          dx: 0,
          dy: 1
        };
        PREV.set(a, pv);
      }
      const mx = a.x - pv.x, my = a.y - pv.y, l = Math.hypot(mx, my);
      if (l > .002 && l < 2) {
        pv.dx = mx / l;
        pv.dy = my / l;
      }
      pv.x = a.x;
      pv.y = a.y;
      tm.stamp(a.x, a.y, .5, 1, pv.dx, pv.dy);
    }
    tm.update(dt);
    st.live = tm.live;
    const X0 = Math.max(0, tx0 - 1), X1 = Math.min(F.W - 1, tx1 + 1), Y0 = Math.max(0, ty0 - 1), Y1 = Math.min(F.H - 1, ty1 + 1), CA = G.cellAt, FW = F.W, t = now;
    for (let y = Y0; y <= Y1; y++) {
      let i = y * FW + X0;
      for (let x = X0; x <= X1; x++, i++) {
        const c = CA[i];
        if (c < 0) continue;
        const O = G.own[c];
        for (let j = 0; j < O.length; j++) {
          const s = O[j], ns = stateOf(G, s, t);
          st.evals++;
          if (ns !== G.cur[s]) {
            G.cur[s] = ns;
            st.changed++;
            mark(G, s);
          }
        }
      }
    }
    const c0 = Math.floor(tx0 / CH), c1 = Math.floor(tx1 / CH), r0 = Math.floor(ty0 / CH), r1 = Math.floor(ty1 / CH), lim = G.fresh ? 99 : GR.BUILD, T1 = performance.now();
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      const k = G.ch.get(cy * 4096 + cx);
      if (!k) continue;
      k.use = ++useTick;
      if (!k.cv && st.builds < lim) buildChunk(G, k, st);
    }
    G.fresh = false;
    const tb = performance.now() - T1;
    let h = 0;
    const Q = G.q;
    for (;h < Q.length; h++) {
      const c = Q[h];
      if (!G.dq[c]) continue;
      const k = G.cch[c];
      if (!k.cv) {
        G.dq[c] = 0;
        continue;
      }
      if (st.redraws >= GR.CAP || st.draws >= GR.DCAP) {
        st.cap = 1;
        break;
      }
      st.draws += drawCell(G, k.cv.getContext("2d"), c, k.cx * CPX, k.cy * CPX);
      st.redraws++;
    }
    if (h >= Q.length) Q.length = 0; else {
      G.q = Q.slice(h);
    }
    st.q = G.q.length;
    const vx0 = tx0 * TS, vy0 = ty0 * TS, vx1 = (tx1 + 1) * TS, vy1 = (ty1 + 1) * TS;
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      const k = G.ch.get(cy * 4096 + cx);
      if (!k || !k.cv) continue;
      const ox = cx * CPX, oy = cy * CPX, dx = Math.round(ox - cam.x), dy = Math.round(oy - cam.y), bb = k.bb;
      for (let o = 0; o < 64; o += 4) {
        if (bb[o] < 0) continue;
        let x0 = bb[o] * TS, y0 = bb[o + 1] * TS, x1 = (bb[o + 2] + 1) * TS, y1 = (bb[o + 3] + 1) * TS;
        if (ox + x0 < vx0) x0 = vx0 - ox;
        if (oy + y0 < vy0) y0 = vy0 - oy;
        if (ox + x1 > vx1) x1 = vx1 - ox;
        if (oy + y1 > vy1) y1 = vy1 - oy;
        if (x1 <= x0 || y1 <= y0) continue;
        ctx.drawImage(k.cv, x0, y0, x1 - x0, y1 - y0, dx + x0, dy + y0, x1 - x0, y1 - y0);
        st.blits++;
      }
    }
    st.ms = +(performance.now() - T0).toFixed(3);
    if (st.ms > 8 && GR.slow.length < 30) GR.slow.push({
      ms: st.ms,
      build: nb,
      chunks: +tb.toFixed(2),
      builds: st.builds,
      redraws: st.redraws,
      draws: st.draws,
      n: G.n,
      kind: F.kind,
      idx: F.idx
    });
    const pk = GR.peak;
    if (st.redraws > pk.redraws) pk.redraws = st.redraws;
    if (st.draws > pk.draws) pk.draws = st.draws;
    if (st.ms > pk.ms) pk.ms = st.ms;
  };
  GR.info = function(F) {
    const G = F && F._gr;
    if (!G) return null;
    let built = 0;
    for (const k of G.ch.values()) if (k.cv) built++;
    return {
      n: G.n,
      cells: G.list.length,
      chunks: G.ch.size,
      built,
      open: BUILT.size,
      buildMs: G.buildMs,
      sets: sets.length
    };
  };
  GR.sprites = function(F) {
    const G = F && F._gr;
    if (!G) return [];
    const out = [];
    for (let s = 0; s < G.n; s++) out.push({
      s,
      x: G.x[s],
      y: G.y[s],
      ax: G.ax[s],
      ay: G.ay[s],
      set: sets[G.set[s]].key,
      gen: G.gen[s],
      st: G.cur[s],
      hub: !!G.ref[s]
    });
    return out;
  };
  GR.sig = function(F) {
    const G = build(F);
    let h = 0;
    for (let s = 0; s < G.n; s++) h = Math.imul(h, 31) + G.x[s] * 7 + G.y[s] * 13 + G.set[s] | 0;
    return G.n + ":" + (h >>> 0);
  };
  GR.dirtyAll = function(F) {
    const G = F && F._gr;
    if (!G) return 0;
    for (let c = 0; c < G.list.length; c++) if (!G.dq[c]) {
      G.dq[c] = 1;
      G.q.push(c);
    }
    return G.q.length;
  };
  GR.frames = function(key) {
    const id = setKey.get(key);
    return id == null ? null : sets[id].f;
  };
  {
    const todo = [];
    for (let v = 0; v < 8; v++) todo.push(() => setOf("tuft:" + v, () => tuftRaw(v)));
    for (const [k, nv] of [ [ "weed", 3 ], [ "tuft", 2 ] ]) for (let v = 0; v < nv; v++) todo.push(() => {
      const DH = SX.decoHub, o = DH && DH.OBJ && DH.OBJ[k];
      if (o && DH.objCanvas) setOf("dh:" + k + ":" + v, () => dhRaw(k, o, v), () => DH.objCanvas(k, v));
    });
    todo.push(() => {
      const DR = SX.decoRaid, wk = DR && DR.K && DR.K.weeds;
      if (!wk || !DR.sprite) return;
      for (let vi = wk.nv - 1; vi >= 0; vi--) todo.push(() => setOf("dr:weeds:" + vi, () => drRaw(wk, vi), () => DR.sprite("weeds", vi)));
    });
    const idle = window.requestIdleCallback ? f => requestIdleCallback(f, {
      timeout: 3e3
    }) : f => setTimeout(f, 200);
    const step = () => {
      if (!todo.length) return;
      if (GR.want()) {
        try {
          todo.shift()();
        } catch (e) {
          todo.length = 0;
          return;
        }
      } else todo.length = 0;
      idle(step);
    };
    setTimeout(() => idle(step), 1200);
  }
})(window.SX);
