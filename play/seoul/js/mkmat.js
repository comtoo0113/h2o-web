(function() {
  "use strict";
  const U = SX.ui;
  if (!U) return;
  U.MARKET_MAT = "paper";
  const KINDS = {
    shop: 1,
    talk: 1,
    story: 1,
    fishShop: 1,
    fishGrill: 1
  }, MATS = {
    paper: 1,
    cloth: 1
  };
  U.MK_KINDS = KINDS;
  U.mkWin = function(kind, w) {
    if (KINDS[kind] && MATS[U.MARKET_MAT]) {
      w.dataset.mk = U.MARKET_MAT;
      const dz = SX.dz && SX.dz.keepOf ? SX.dz.keepOf(kind) : null;
      if (dz && dz.cls === "read") w.dataset.mkr = "1"; else delete w.dataset.mkr;
      snapU();
    }
  };
  function snapU() {
    const r = document.documentElement, u = parseFloat(getComputedStyle(r).getPropertyValue("--u")) || 2, dpr = window.devicePixelRatio || 1;
    r.style.setProperty("--mku", Math.max(1, Math.floor(u * dpr + 1e-6)) / dpr + "px");
  }
  addEventListener("resize", () => requestAnimationFrame(snapU));
  function Dot(W, H) {
    this.W = W;
    this.H = H;
    this.c = new Array(W * H).fill(null);
  }
  Dot.prototype.set = function(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.W && y < this.H) this.c[y * this.W + x] = c;
    return this;
  };
  Dot.prototype.get = function(x, y) {
    return x < 0 || y < 0 || x >= this.W || y >= this.H ? null : this.c[y * this.W + x];
  };
  Dot.prototype.rect = function(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  };
  Dot.prototype.pts = function(list, c, ox, oy) {
    for (const [x, y] of list) this.set((ox || 0) + x, (oy || 0) + y, c);
    return this;
  };
  Dot.prototype.blit = function(s, ox, oy) {
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
      const c = s.c[y * s.W + x];
      if (c) this.set(ox + x, oy + y, c);
    }
    return this;
  };
  Dot.prototype.edge = function(c, bot2) {
    const W = this.W, H = this.H, o = this.c.slice(), e = (x, y) => x < 0 || y < 0 || x >= W || y >= H || o[y * W + x] == null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (o[y * W + x] == null) continue;
      if (e(x - 1, y) || e(x + 1, y) || e(x, y - 1) || e(x, y + 1) || bot2 && e(x, y + 2) && !e(x, y + 1)) this.c[y * W + x] = c;
    }
    return this;
  };
  Dot.prototype.url = function() {
    const cv = document.createElement("canvas");
    cv.width = this.W;
    cv.height = this.H;
    const g = cv.getContext("2d"), im = g.createImageData(this.W, this.H);
    for (let i = 0; i < this.c.length; i++) {
      const c = this.c[i];
      if (!c) continue;
      const v = parseInt(c.slice(1), 16);
      im.data[i * 4] = v >> 16;
      im.data[i * 4 + 1] = v >> 8 & 255;
      im.data[i * 4 + 2] = v & 255;
      im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv.toDataURL();
  };
  const MET = {
    o: "#3c4046",
    b: "#8a9098",
    h: "#c8ccd2"
  };
  const NAIL = {
    o: "#2b2620",
    b: "#5a554c",
    h: "#9a9488"
  };
  const NAILD = {
    o: "#1c1915",
    b: "#2e2a25",
    h: "#4a463e"
  };
  const K = {
    staple: {
      o: MET.o
    },
    nailD: {
      o: NAILD.o
    },
    tape: {
      o: "#a39770"
    },
    tapeD: {
      o: "#3e3a2e"
    },
    spin: {
      o: MET.o
    },
    stag: {
      o: "#6e6450"
    },
    patch: {
      o: "#2a2616"
    },
    nail: {
      o: NAIL.o
    },
    note: {
      o: "#2e281e"
    },
    ptag: {
      o: "#332b1e"
    },
    scrap: {
      o: "#1a140c"
    },
    rag: {
      o: "#1e160e"
    },
    rope: {
      o: "#2a1e10"
    },
    pinR: {
      o: "#3e140c"
    }
  };
  U.MKD = K;
  function staple() {
    const d = new Dot(6, 3).rect(0, 0, 6, 3, MET.b).edge(K.staple.o);
    return d.rect(1, 1, 4, 1, MET.h);
  }
  function hole() {
    return new Dot(6, 5).pts([ [ 2, 1 ], [ 3, 1 ], [ 4, 1 ], [ 2, 2 ], [ 4, 2 ], [ 2, 3 ], [ 3, 3 ], [ 4, 3 ] ], "#e4d8b4").set(3, 2, "#1e150c").pts([ [ 1, 2 ], [ 0, 1 ], [ 1, 3 ], [ 0, 4 ] ], "#7a5a30");
  }
  function ear() {
    const d = new Dot(5, 5);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const k = 4 - i + j;
      if (k <= 1) d.set(i, j, "#120d08"); else if (k === 2 || j === 0 || i === 4) d.set(i, j, "#4a3b22"); else if (k === 3) d.set(i, j, "#e2d5ae"); else if (k === 4) d.set(i, j, "#9a8862");
    }
    return d;
  }
  function stamp() {
    return new Dot(4, 4).pts([ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 0, 2 ], [ 3, 2 ], [ 1, 3 ] ], "#a8321e").set(1, 1, "#b8442c");
  }
  function coffee() {
    const d = new Dot(9, 7);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
      const r = Math.hypot((x - 4) / 4.2, (y - 3) / 3.1);
      if (r > .7 && r <= 1.02 && !(x >= 6 && y <= 1)) d.set(x, y, (x * 3 + y) % 5 === 0 ? "#97835b" : "#a7926a");
    }
    return d;
  }
  function scrib() {
    return new Dot(9, 3).pts([ [ 0, 2 ], [ 1, 1 ], [ 2, 0 ], [ 2, 1 ], [ 3, 2 ], [ 4, 1 ], [ 5, 0 ], [ 6, 1 ], [ 6, 2 ], [ 8, 0 ], [ 8, 1 ], [ 8, 2 ], [ 7, 1 ] ], "#7a6b4e");
  }
  function pinholes() {
    return new Dot(5, 2).pts([ [ 0, 0 ], [ 4, 1 ] ], "#5e4f36");
  }
  function tape(dim) {
    const d = new Dot(7, 3).rect(0, 0, 7, 3, dim ? "#5e5846" : "#d6cca2");
    d.set(0, 0, null);
    d.set(6, 2, null);
    d.set(3, 0, null);
    d.edge(dim ? K.tapeD.o : K.tape.o);
    return d.pts([ [ 1, 1 ], [ 2, 1 ], [ 4, 1 ], [ 5, 1 ] ], dim ? "#6a6450" : "#e2d9b4");
  }
  function spin() {
    const d = new Dot(9, 3).rect(0, 0, 9, 3, MET.b).edge(K.spin.o);
    return d.rect(1, 1, 5, 1, MET.h).set(6, 1, MET.o).set(7, 1, MET.b);
  }
  function stag() {
    const d = new Dot(4, 6).rect(0, 0, 4, 6, "#e6dac0").edge(K.stag.o);
    return d.rect(1, 2, 2, 1, "#a8321e").set(1, 4, "#c9bc9e");
  }
  function patch() {
    const d = new Dot(6, 5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) d.set(x, y, (x + y) % 2 ? "#6c6244" : "#62593d");
    d.edge(K.patch.o);
    return d.pts([ [ 1, 1 ], [ 4, 1 ], [ 1, 3 ], [ 4, 3 ] ], "#d8c89a");
  }
  function fray() {
    return new Dot(5, 3).pts([ [ 0, 0 ], [ 1, 1 ], [ 1, 2 ], [ 3, 0 ], [ 3, 1 ], [ 4, 2 ] ], "#c4a874");
  }
  function worn() {
    return new Dot(6, 3).pts([ [ 1, 0 ], [ 2, 0 ], [ 4, 0 ], [ 0, 1 ], [ 2, 1 ], [ 3, 1 ], [ 5, 1 ], [ 1, 2 ], [ 3, 2 ], [ 4, 2 ] ], "#6e5c40");
  }
  function xst() {
    return new Dot(3, 3).pts([ [ 0, 0 ], [ 2, 0 ], [ 1, 1 ], [ 0, 2 ], [ 2, 2 ] ], "#b03a26");
  }
  function nail() {
    return new Dot(3, 3).rect(0, 0, 3, 3, NAIL.b).edge(K.nail.o).set(1, 1, NAIL.h);
  }
  function nailD() {
    return new Dot(3, 3).rect(0, 0, 3, 3, NAILD.b).edge(K.nailD.o).set(1, 1, NAILD.h);
  }
  const GL = {
    1: ".#.##..#..#.",
    2: "##...#.#.###",
    3: "###.##..####",
    5: "####..##.###",
    7: "###..#.#..#.",
    0: "####.##.####",
    W: "#.##.####.#.",
    x: "#.#.#.#.#...",
    ">": "#...#..##...",
    o: ".#.#.#.#....",
    "|": ".#..#..#..#."
  };
  function word(d, s, x, y, c) {
    let k = 0;
    for (const ch of s) {
      const g = GL[ch];
      if (g) for (let i = 0; i < 12; i++) if (g[i] === "#") d.set(x + k * 4 + i % 3, y + (i / 3 | 0), c);
      k++;
    }
  }
  function tally(d, x, y, h, c, hi) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < h; j++) {
        d.set(x + i * 2, y + j, c);
        if (hi) d.set(x + i * 2 + 1, y + j, hi);
      }
    }
    for (let i = 0; i < 8; i++) d.set(x - 1 + i, y + h - 1 - Math.floor(i * (h - 1) / 7), c);
  }
  function frame() {
    const C = U.CASE.wood, S = C.S, M = C.M, src = U.casePaint("wood"), n = src.width, N = S * 2 + M * 3, R = new SX.Rng(96621);
    const g0 = src.getContext("2d").getImageData(0, 0, n, n).data;
    const hex = (x, y) => {
      const i = (y * n + x) * 4;
      return g0[i + 3] === 255 ? "#" + (1 << 24 | g0[i] << 16 | g0[i + 1] << 8 | g0[i + 2]).toString(16).slice(1) : null;
    };
    const d = new Dot(N, N), map = v => v < S ? v : v >= N - S ? v - N + n : S + (v - S) % M;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) d.set(x, y, hex(map(x), map(y)));
    const at = (s, a, t) => s === 0 ? [ a, t ] : s === 1 ? [ t, a ] : s === 2 ? [ a, N - 1 - t ] : [ N - 1 - t, a ];
    const put = (s, a, t, c) => {
      const [x, y] = at(s, a, t);
      if (d.get(x, y)) d.set(x, y, c);
    };
    const used = [ [], [], [], [] ], free = (s, a, w) => used[s].every(([p, q]) => a + w < p - 2 || a > q + 2), take = (s, a, w) => used[s].push([ a, a + w ]);
    const spot = (s, w) => {
      for (let k = 0; k < 40; k++) {
        const a = R.ri(S + 3, N - S - 4 - w);
        if (free(s, a, w)) {
          take(s, a, w);
          return a;
        }
      }
      return -1;
    };
    for (let s = 0; s < 4; s++) {
      for (let k = 0; k < 2; k++) {
        const a = spot(s, 8);
        if (a < 0) continue;
        for (let i = 0; i < 8; i++) for (let t = s === 2 ? 2 : 1; t <= S - 2; t++) put(s, a + i, t, i === 0 || i === 7 ? K.rope.o : [ "#a8885a", "#8a6c44", "#8a6c44", "#5e4728" ][(i + t) % 4]);
      }
      {
        const a = spot(s, 9);
        if (a >= 0) {
          for (let i = 0; i < 8; i++) for (let t = 2; t <= 5; t++) put(s, a + i, t, i % 2 ? C.lt : C.dk);
          for (let i = 0; i < 9; i++) put(s, a + i, 5 - Math.round(i * 3 / 8), C.dk);
        }
      }
      for (let k = 0; k < 2; k++) {
        const txt = R.pick([ "W35", "7x", "120", ">>", "o3", "W5", "|||", "17" ]), w = txt.length * 4;
        const a = spot(s, w);
        if (a < 0) continue;
        const tmp = new Dot(w, 4);
        word(tmp, txt, 0, 0, "#9e988a");
        for (let j = 0; j < 4; j++) for (let i = 0; i < w; i++) {
          const c = tmp.get(i, j);
          if (c && R.f() > .12) put(s, a + i, j + 2, R.f() < .25 ? "#7e796e" : c);
        }
      }
      for (let k = 0; k < 2; k++) {
        const a = spot(s, 4);
        if (a < 0) continue;
        for (const [i, t] of [ [ 1, 2 ], [ 2, 2 ], [ 0, 3 ], [ 3, 3 ], [ 1, 4 ], [ 2, 4 ] ]) put(s, a + i, t, C.dk);
        put(s, a + 1, 3, C.sh);
        put(s, a + 2, 3, C.sh);
      }
      for (let k = 0; k < 3; k++) {
        const a = spot(s, 4);
        if (a < 0) continue;
        for (let i = 0; i < 4; i++) put(s, a + i, 2 + (i >> 1) + k % 2, C.hi);
      }
      {
        const a = spot(s, 4);
        if (a >= 0) for (const [i, t] of [ [ 0, 3 ], [ 1, 2 ], [ 1, 3 ], [ 2, 3 ], [ 2, 4 ], [ 3, 3 ], [ 1, 4 ] ]) put(s, a + i, t, "#22150c");
      }
      for (let k = 0; k < 4; k++) {
        const a = spot(s, 2);
        if (a < 0) continue;
        const t = R.ri(2, 4);
        put(s, a, t, C.scHi);
        put(s, a + 1, t, C.sc);
        put(s, a, t + 1, C.sc);
        put(s, a + 1, t + 1, C.dk);
        if (k === 3) put(s, a + 2, t + 1, C.sc);
      }
    }
    return d;
  }
  const cells = (R, W, H, cw, ch) => {
    const a = [];
    for (let y = 0; y + ch <= H; y += ch) for (let x = 0; x + cw <= W; x += cw) a.push([ x, y ]);
    for (let i = a.length - 1; i > 0; i--) {
      const j = R.i(i + 1);
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };
  function wall(nm) {
    const W = 320, H = 192, d = new Dot(W, H), R = new SX.Rng(96631), NM = nm == null ? 18 : nm;
    const P = {
      a: "#1d1712",
      b: "#1a1410",
      gr: "#221b15",
      gd: "#16110d",
      seam: "#100b07",
      kn: "#130e0a",
      ch: "#4a463d",
      ch2: "#3a372f",
      sc: "#28201a",
      hole: "#0a0806",
      ring: "#2a2119",
      rust: "#2b1d13"
    };
    for (let p = 0; p < H / 12; p++) {
      const y0 = p * 12, base = p % 2 ? P.a : P.b, js = [ R.ri(8, 90), R.ri(120, 200), R.ri(230, 310) ];
      for (let y = y0; y < y0 + 12; y++) for (let x = 0; x < W; x++) {
        let c = base;
        const g = (y - y0 + Math.round(Math.sin((x + p * 37) * Math.PI / 40) * 1.5) + 20) % 4;
        if (g === 0 && R.f() < .7) c = P.gr; else if (R.f() < .03) c = P.gd;
        if (y === y0 + 11 || js.indexOf(x) >= 0) c = P.seam;
        d.set(x, y, c);
      }
      for (const jx of js) for (const ny of [ y0 + 2, y0 + 7 ]) for (const nx of [ jx - 3, jx + 2 ]) {
        d.blit(nailD(), nx - 1, ny - 1);
        if (R.f() < .3) for (let k = 2; k < 2 + R.ri(1, 3); k++) d.set(nx, ny + k, P.rust);
      }
      for (let k = R.ri(1, 2); k > 0; k--) {
        const kx = R.ri(8, W - 10), ky = y0 + R.ri(3, 6);
        d.pts([ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 1, 2 ], [ 2, 2 ] ], P.kn, kx, ky);
        d.pts([ [ 1, 1 ], [ 2, 1 ] ], P.gd, kx, ky);
      }
      for (let k = 0; k < 3; k++) {
        const sx = R.ri(4, W - 12), sy = y0 + R.ri(2, 8);
        for (let i = 0; i < R.ri(4, 9); i++) d.set(sx + i, sy + (i >> 2), P.sc);
      }
    }
    const at = cells(R, W, H, 40, 24);
    for (let k = 0; k < NM && at.length; k++) {
      const [cx, cy] = at.pop(), x = cx + R.ri(4, 14), y = cy + R.ri(3, 10), c = R.f() < .5 ? P.ch : P.ch2, kind = k % 6;
      if (kind === 0 || kind === 3) tally(d, x, y, R.ri(4, 6), c); else if (kind === 1) word(d, R.pick([ "W5", "W30", "17", "x3", "120", "o7", "W2" ]), x, y, c); else if (kind === 2) word(d, R.pick([ ">", ">>", "|||", "o" ]), x, y, c); else if (kind === 4) {
        d.pts([ [ 1, 0 ], [ 0, 1 ], [ 2, 1 ], [ 1, 2 ] ], P.ring, x, y);
        d.set(x + 1, y + 1, P.hole);
        if (R.f() < .5) d.pts([ [ 3, 1 ], [ 4, 2 ], [ -1, 2 ] ], P.sc, x, y);
      } else {
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if (R.f() < .55) d.set(x + i, y + j, P.gd);
      }
    }
    return d;
  }
  function pin() {
    const d = new Dot(3, 3).rect(0, 0, 3, 3, "#8a3424").edge(K.pinR.o);
    return d.set(1, 1, "#c4553c");
  }
  function note(w, h, R) {
    const d = new Dot(w, h).rect(0, 0, w, h, "#665a45");
    for (let x = 0; x < w; x++) if (R.f() < .45) d.set(x, h - 1, null);
    d.set(w - 1, 0, null);
    d.edge(K.note.o);
    for (let y = 3; y < h - 2; y += 2) for (let x = 2; x < w - 2; x++) if (R.f() < .7) d.set(x, y, "#4e4537");
    return d;
  }
  function ptag() {
    const d = new Dot(9, 6).rect(2, 0, 7, 6, "#6a5f4a").rect(1, 1, 1, 4, "#6a5f4a").rect(0, 2, 1, 2, "#6a5f4a");
    d.edge(K.ptag.o);
    d.set(2, 2, "#1a140c");
    return d.pts([ [ 4, 2 ], [ 5, 3 ], [ 6, 2 ], [ 7, 3 ] ], "#4a4232");
  }
  function scrap(R) {
    const s = new Dot(16, 11);
    for (let y = 0; y < 11; y++) for (let x = 0; x < 16; x++) if (!(y === 10 && R.f() < .4)) s.set(x, y, (x + y) % 2 ? "#3a3022" : "#332a1e");
    return s.edge(K.scrap.o);
  }
  function rag(R) {
    const h = R.ri(13, 19), s = new Dot(5, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < 5; x++) s.set(x, y, y % 5 === 2 ? "#5a4632" : "#4a3a2a");
    s.set(0, h - 1, null);
    s.set(4, h - 2, null);
    s.set(4, h - 1, null);
    return s.edge(K.rag.o);
  }
  function coil() {
    const s = new Dot(9, 6);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 9; x++) {
      const r = Math.hypot((x - 4) / 4.5, (y - 2.5) / 3);
      if (r <= 1 && r > .35) s.set(x, y, (x + y) % 3 ? "#5e4a30" : "#4a3a24");
    }
    return s.edge(K.rope.o);
  }
  function poster(R) {
    const W = 26, H = 18, d = new Dot(W, H).rect(0, 0, W, H, "#544a3a");
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5 - x; y++) d.set(W - 1 - x, H - 1 - y, null);
    for (let x = 0; x < W; x++) if (R.f() < .3) d.set(x, 0, null);
    d.edge(K.note.o);
    d.rect(3, 3, W - 6, 3, "#3e3628");
    for (let y = 8; y < H - 3; y += 2) for (let x = 3; x < W - 4; x++) if (R.f() < .6) d.set(x, y, "#463f33");
    return d;
  }
  function receipt(R) {
    const W = 7, H = R.ri(13, 17), d = new Dot(W, H).rect(0, 0, W, H, "#625946");
    for (let x = 0; x < W; x += 2) d.set(x, H - 1, null);
    d.edge(K.note.o);
    for (let y = 2; y < H - 2; y++) if (y % 2 === 0) for (let x = 2; x < W - 2; x++) d.set(x, y, R.f() < .75 ? "#4a4335" : "#625946");
    return d;
  }
  function sack(R) {
    const W = 22, H = 16, d = new Dot(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!(y < 2 && (x < 3 || x > W - 4))) d.set(x, y, (x + y) % 2 ? "#3c3123" : "#342b1f");
    d.edge(K.scrap.o);
    d.blit(patch(), 4, 7);
    for (let x = 7; x < 15; x++) d.set(x, 2, "#6e5634");
    d.pts([ [ 10, 3 ], [ 11, 3 ], [ 11, 4 ] ], "#6e5634");
    word(d, "o", 14, 8, "#4a4030");
    return d;
  }
  const SW = 400, SH = 260;
  const place = (d, R, at, w, h, f) => {
    if (!at.length) return;
    const [cx, cy] = at.pop(), x = cx + R.ri(3, Math.max(4, 77 - w)), y = cy + R.ri(4, Math.max(5, 48 - h));
    f(x, y);
  };
  function scatterP() {
    const d = new Dot(SW, SH), R = new SX.Rng(96641), at = cells(R, SW, SH, 66, 52);
    for (let k = 0; k < 2; k++) place(d, R, at, 28, 20, (x, y) => d.blit(poster(R), x, y).blit(tape(1), x - 2, y - 1).blit(pin(), x + 20, y));
    for (let k = 0; k < 3; k++) place(d, R, at, 9, 18, (x, y) => d.blit(receipt(R), x, y).blit(pin(), x + 2, y - 1));
    for (let k = 0; k < 9; k++) {
      const w = R.ri(10, 18), h = R.ri(8, 14);
      place(d, R, at, w + 6, h, (x, y) => {
        d.blit(note(w, h, R), x, y).blit(pin(), x + (w >> 1) - 1, y - 1);
        if (R.f() < .4) d.blit(pinholes(), x + w + 1, y + 2);
      });
    }
    for (let k = 0; k < 4; k++) place(d, R, at, 18, 12, (x, y) => {
      d.blit(nailD(), x, y);
      for (let i = 0; i < 6; i++) d.set(x + 2 + i, y + 3 + (i >> 1), "#5a4a30");
      d.blit(ptag(), x + 7, y + 5);
    });
    for (let k = 0; k < 3; k++) place(d, R, at, 8, 9, (x, y) => d.blit(tape(1), x, y).blit(pinholes(), x + 1, y + 6));
    for (let k = 0; k < 3; k++) place(d, R, at, 12, 9, (x, y) => d.blit(note(R.ri(6, 10), R.ri(4, 7), R), x, y).blit(tape(1), x - 2, y - 2));
    return d;
  }
  function scatterC() {
    const d = new Dot(SW, SH), R = new SX.Rng(96651), at = cells(R, SW, SH, 66, 52);
    for (let k = 0; k < 2; k++) place(d, R, at, 24, 18, (x, y) => d.blit(sack(R), x, y).blit(nailD(), x + 10, y - 1));
    for (let k = 0; k < 6; k++) place(d, R, at, 18, 14, (x, y) => {
      d.blit(scrap(R), x, y).blit(nailD(), x, y - 1).blit(nailD(), x + 13, y - 1);
      for (let i = 0; i < 5; i++) if (R.f() < .7) d.set(x + 2 + i * 3, y + 11 + i % 2, "#4a3e2c");
    });
    for (let k = 0; k < 4; k++) place(d, R, at, 6, 22, (x, y) => d.blit(rag(R), x, y + 2).blit(nailD(), x + 1, y));
    for (let k = 0; k < 3; k++) place(d, R, at, 10, 7, (x, y) => d.blit(coil(), x, y));
    for (const j of [ "spin", "spin", "spin", "patch", "patch", "patch", "xst", "xst", "fray", "stag" ]) place(d, R, at, 10, 6, (x, y) => d.blit({
      spin,
      patch,
      xst,
      fray,
      stag
    }[j](), x, y));
    return d;
  }
  function head(read) {
    const W = 240, H = 18, d = new Dot(W, H), R = new SX.Rng(96661);
    for (let x = 6; x < W - 4; x += R.ri(22, 40)) {
      const keep = !read || x < 24 || x > W - 30;
      if (keep) d.blit(nail(), x, 1);
      if (R.f() < .5 && !read) d.blit(nail(), x + R.ri(-4, 4), H - 5);
    }
    if (read) return d;
    tally(d, 40, 6, 5, "#8a8476");
    word(d, "W7", 90, 7, "#8e8778");
    word(d, "o", 150, 7, "#7e786c");
    for (const kx of [ 64, 128, 200 ]) {
      d.pts([ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 1, 2 ], [ 2, 2 ] ], "#2b1b0f", kx, 8);
      d.pts([ [ 1, 1 ], [ 2, 1 ] ], "#3b2615", kx, 8);
    }
    for (let k = 0; k < 4; k++) {
      const sx = R.ri(20, W - 10), sy = R.ri(5, 11);
      for (let i = 0; i < 4; i++) d.set(sx + i, sy + (i >> 1), "#5e3f23");
    }
    return d;
  }
  function init() {
    const st = document.documentElement.style, put = (k, dot) => st.setProperty("--mkd-" + k, 'url("' + dot.url() + '")');
    try {
      put("staple", staple());
      put("hole", hole());
      put("ear", ear());
      put("stamp", stamp());
      put("coffee", coffee());
      put("scrib", scrib());
      put("pinholes", pinholes());
      put("tape", tape());
      put("spin", spin());
      put("stag", stag());
      put("patch", patch());
      put("fray", fray());
      put("worn", worn());
      put("xst", xst());
      put("nail", nail());
      put("nailD", nailD());
      put("frame", frame());
      put("wall", wall());
      put("wallR", wall(0));
      put("scatterP", scatterP());
      put("scatterC", scatterC());
      put("head", head());
      put("headR", head(true));
    } catch (e) {
      console.error(e);
    }
  }
  init();
  U.mkPaint = {
    staple,
    hole,
    ear,
    stamp,
    coffee,
    scrib,
    pinholes,
    tape,
    spin,
    stag,
    patch,
    fray,
    worn,
    xst,
    nail,
    nailD,
    frame,
    wall,
    scatterP,
    scatterC,
    head,
    pin
  };
})();
