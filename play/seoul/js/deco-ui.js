"use strict";

(function(SX) {
  const U = SX.ui;
  if (!U) return;
  const DZ = SX.dz = {
    stats: {
      runs: 0,
      draws: 0,
      ms: 0,
      maxMs: 0
    },
    SKIP: {
      shop: 1,
      fishShop: 1,
      map: 1,
      term: 1
    }
  };
  const KEEP = DZ.KEEP = {
    item: .85,
    read: .2,
    other: 1
  };
  const CLASS = DZ.CLASS = {
    inv: "item",
    cook: "item",
    craft: "item",
    stove: "item",
    water: "item",
    garden: "item",
    fishGrill: "item",
    look: "read",
    range: "item",
    parts: "item",
    loadout: "item",
    deco: "item",
    help: "read",
    talk: "read",
    story: "read",
    result: "read",
    wipe: "read",
    ask: "read",
    ngAsk: "read",
    detail: "read",
    feedback: "read",
    course: "read",
    keys: "read",
    sound: "read",
    screen: "read",
    news: "read",
    lore: "read",
    menu: "read",
    settings: "read",
    mods: "read",
    coop: "read",
    queue: "other",
    acct: "other",
    tooltip: "read",
    bigNote: "read",
    hudTut: "read",
    hudCourse: "read",
    hudWeapon: "read",
    hudInfo: "read",
    msgBox: "read",
    hintbar: "read",
    hudSpec: "read",
    hudQuick: "item",
    hudMapBox: "other",
    bars: "other"
  };
  DZ.keepOf = kind => {
    const c = CLASS[kind] || "other";
    const k = DZ.keepOverride != null ? DZ.keepOverride : KEEP[c];
    return {
      cls: c,
      keep: Math.max(0, Math.min(1, (k == null ? 1 : k) * (SX.decoAmt ? SX.decoAmt() : 1)))
    };
  };
  const READ_GAP = 7;
  const HX = {};
  const hx = c => {
    if (HX[c]) return HX[c];
    let s = c.replace("#", "");
    if (s.length === 3) s = s.split("").map(q => q + q).join("");
    return HX[c] = [ parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16) ];
  };
  const hex = (r, g, b) => "#" + [ r, g, b ].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => {
    const A = hx(a), B = hx(b);
    return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };
  const lit = (c, t) => mix(c, "#ffffff", t), drk = (c, t) => mix(c, "#000000", t);
  const C32 = {};
  const c32 = c => {
    let v = C32[c];
    if (v === undefined) {
      const q = hx(c);
      v = C32[c] = (255 << 24 | q[2] << 16 | q[1] << 8 | q[0]) >>> 0;
    }
    return v;
  };
  const css2hex = s => {
    const m = /rgba?\(([^)]+)\)/.exec(s || "");
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (p.length > 3 && p[3] < .5) return null;
    return hex(p[0], p[1], p[2]);
  };
  const hash = s => {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  function rng(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.i = n => Math.floor(f() * n);
    f.r = (a0, b0) => a0 + Math.floor(f() * (b0 - a0 + 1));
    f.pick = L => L[Math.floor(f() * L.length)];
    f.ch = p => f() < p;
    f.w = L => {
      let s = 0;
      for (const q of L) s += q[1];
      let x = f() * s;
      for (const q of L) {
        x -= q[1];
        if (x < 0) return q[0];
      }
      return L[L.length - 1][0];
    };
    return f;
  }
  DZ.rng = rng;
  DZ.hash = hash;
  function Spr(w, h) {
    this.w = w;
    this.h = h;
    this.c = new Array(w * h).fill(0);
    this.o = null;
  }
  Spr.prototype.set = function(x, y, c) {
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = c;
  };
  Spr.prototype.get = function(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : 0;
  };
  Spr.prototype.rect = function(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  };
  Spr.prototype.del = function(x, y) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = 0;
  };
  const art = (rows, map) => {
    const s = new Spr(rows[0].length, rows.length);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const k = rows[y][x];
      if (k !== "." && k !== " " && map[k]) s.set(x, y, map[k]);
    }
    return s;
  };
  const over = (d, s, x0, y0) => {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const c = s.c[y * s.w + x];
      if (c) d.set(x0 + x, y0 + y, c);
    }
    return d;
  };
  const rot = s => {
    const n = new Spr(s.h, s.w);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) n.set(s.h - 1 - y, x, s.get(x, y));
    n.o = s.o;
    n.k = s.k;
    return n;
  };
  const flipX = s => {
    const n = new Spr(s.w, s.h);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) n.set(s.w - 1 - x, y, s.get(x, y));
    n.o = s.o;
    n.k = s.k;
    return n;
  };
  function obj(s, o, b2) {
    const n = new Spr(s.w + 2, s.h + (b2 ? 3 : 2)), up = lit(o, .12);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const c = s.get(x, y);
      if (c) n.set(x + 1, y + 1, c === o ? up : c);
    }
    const B = (x, y) => x >= 1 && y >= 1 && x <= s.w && y <= s.h && !!s.get(x - 1, y - 1);
    const O = new Uint8Array(n.w * n.h);
    for (let y = 0; y < n.h; y++) for (let x = 0; x < n.w; x++) {
      if (B(x, y)) continue;
      if (B(x - 1, y) || B(x + 1, y) || B(x, y - 1) || B(x, y + 1)) {
        n.set(x, y, o);
        O[y * n.w + x] = 1;
      }
    }
    if (b2) for (let y = 2; y < n.h; y++) for (let x = 0; x < n.w; x++) {
      if (B(x, y) || O[y * n.w + x]) continue;
      if (O[(y - 1) * n.w + x] && B(x, y - 2)) n.set(x, y, o);
    }
    n.o = o;
    return n;
  }
  DZ.Spr = Spr;
  DZ.obj = obj;
  const FONT = {
    0: "###|#.#|#.#|#.#|###",
    1: ".#.|##.|.#.|.#.|###",
    2: "###|..#|###|#..|###",
    3: "###|..#|.##|..#|###",
    4: "#.#|#.#|###|..#|..#",
    5: "###|#..|###|..#|###",
    6: "###|#..|###|#.#|###",
    7: "###|..#|..#|.#.|.#.",
    8: "###|#.#|###|#.#|###",
    9: "###|#.#|###|..#|###",
    A: ".#.|#.#|###|#.#|#.#",
    B: "##.|#.#|##.|#.#|##.",
    C: ".##|#..|#..|#..|.##",
    D: "##.|#.#|#.#|#.#|##.",
    E: "###|#..|##.|#..|###",
    F: "###|#..|##.|#..|#..",
    G: ".##|#..|#.#|#.#|.##",
    H: "#.#|#.#|###|#.#|#.#",
    I: "###|.#.|.#.|.#.|###",
    K: "#.#|#.#|##.|#.#|#.#",
    L: "#..|#..|#..|#..|###",
    M: "#.#|###|###|#.#|#.#",
    N: "##.|#.#|#.#|#.#|#.#",
    O: ".#.|#.#|#.#|#.#|.#.",
    P: "##.|#.#|##.|#..|#..",
    Q: ".#.|#.#|#.#|##.|.##",
    R: "##.|#.#|##.|#.#|#.#",
    S: ".##|#..|.#.|..#|##.",
    T: "###|.#.|.#.|.#.|.#.",
    U: "#.#|#.#|#.#|#.#|###",
    V: "#.#|#.#|#.#|#.#|.#.",
    W: "#.#|#.#|###|###|#.#",
    X: "#.#|#.#|.#.|#.#|#.#",
    Y: "#.#|#.#|.#.|.#.|.#.",
    Z: "###|..#|.#.|#..|###",
    "-": "...|...|###|...|...",
    ".": "...|...|...|...|.#.",
    "/": "..#|..#|.#.|#..|#..",
    "+": "...|.#.|###|.#.|...",
    "!": ".#.|.#.|.#.|...|.#.",
    "#": "#.#|###|#.#|###|#.#",
    ":": "...|.#.|...|.#.|...",
    ">": "#..|.#.|..#|.#.|#..",
    "^": ".#.|###|.#.|.#.|.#.",
    "*": "#.#|.#.|###|.#.|#.#",
    " ": "...|...|...|...|...",
    "?": "##.|..#|.#.|...|.#."
  };
  const tw = t => t.length * 4 - 1;
  function text(d, t, x0, y0, c, sc, gap) {
    sc = sc || 1;
    let x = x0;
    for (const ch of String(t).toUpperCase()) {
      const g = FONT[ch] || FONT[" "], rows = g.split("|");
      for (let y = 0; y < 5; y++) for (let i = 0; i < 3; i++) if (rows[y][i] === "#" && !(gap && sc > 1 && y === 2 && i === 1)) for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) d(x + i * sc + b, y0 + y * sc + a, c);
      x += 4 * sc;
    }
    return x - x0 - sc;
  }
  const tSpr = s => (x, y, c) => s.set(x, y, c);
  const PAL = {
    steel: {
      o: "#0e1216",
      d: "#2b333c",
      b: "#46525e",
      l: "#64727f",
      h: "#8f9ca8"
    },
    zinc: {
      o: "#15181b",
      d: "#3c4247",
      b: "#5e666c",
      l: "#7d868c",
      h: "#a6aeb3"
    },
    brass: {
      o: "#24190a",
      d: "#5c4318",
      b: "#8a6a2c",
      l: "#b48c44",
      h: "#dcbd72"
    },
    rust: {
      o: "#1e1008",
      d: "#4a2610",
      b: "#6e3a18",
      l: "#93542a",
      h: "#b06c3a"
    },
    duct: {
      o: "#2a2d31",
      d: "#4f5358",
      b: "#6b7075",
      l: "#878c90",
      h: "#a2a6a9"
    },
    mask: {
      o: "#4a3f28",
      d: "#7f7150",
      b: "#a49670",
      l: "#b9ac85",
      h: "#c9bd98"
    },
    redt: {
      o: "#2c0c0a",
      d: "#5a1914",
      b: "#80261d",
      l: "#a43a2f",
      h: "#c45a4c"
    },
    yelt: {
      o: "#2e2508",
      d: "#6e5a18",
      b: "#a4862a",
      l: "#c4a23e",
      h: "#d8bc5c"
    },
    bluet: {
      o: "#0c1624",
      d: "#1e3450",
      b: "#2e4c72",
      l: "#40668e",
      h: "#5a82a8"
    },
    paper: {
      o: "#3a3428",
      d: "#7a7158",
      b: "#a39a7e",
      l: "#b5ad92",
      h: "#c6bfa6",
      ink: "#58503f",
      red: "#8a3a2e",
      blue: "#3c5878",
      pen: "#4a4a5e"
    },
    white: {
      o: "#2e3133",
      d: "#7c7f7c",
      b: "#a5a7a0",
      l: "#b9bbb4",
      h: "#cbccc5"
    },
    sticky: {
      o: "#3e3410",
      d: "#9a8a3a",
      b: "#c2ae52",
      l: "#d2c06a",
      h: "#e0d084",
      ink: "#6a5a22"
    },
    haz: {
      o: "#15120a",
      k: "#2e2914",
      y: "#b8941f",
      l: "#d2ae3a",
      d: "#8a6e18"
    },
    bio: {
      o: "#1e1406",
      k: "#3c2c10",
      y: "#c48a1e",
      l: "#dca23a"
    },
    red: {
      o: "#240a08",
      d: "#5c1812",
      b: "#8c2a20",
      l: "#b04434",
      h: "#d06a58",
      w: "#c8c2b4"
    },
    green: {
      o: "#0c1a0c",
      d: "#1e3e1e",
      b: "#2e5a2a",
      l: "#46783c",
      h: "#68985a"
    },
    blue: {
      o: "#0a1220",
      d: "#1c3048",
      b: "#2c4a6c",
      l: "#426890",
      h: "#6488b0"
    },
    black: {
      o: "#0a0b0c",
      d: "#17191b",
      b: "#24272a",
      l: "#383c40",
      h: "#55595e",
      w: "#c4c6be"
    },
    olive: {
      o: "#11130a",
      d: "#2a2e1a",
      b: "#40462a",
      l: "#58603a",
      h: "#727a4e"
    },
    wood: {
      o: "#1a0f08",
      d: "#3b2615",
      b: "#5e3f23",
      l: "#76552f",
      h: "#94704a"
    },
    board: {
      o: "#1c140c",
      d: "#3a2a1a",
      b: "#56402a",
      l: "#6c5236",
      h: "#846848",
      hole: "#24190f"
    },
    plast: {
      o: "#101012",
      d: "#2a2a2e",
      b: "#3e3e44",
      l: "#56565e",
      h: "#74747c"
    },
    cloth: {
      o: "#141a10",
      d: "#2e3a22",
      b: "#46562e",
      l: "#5c6e3e",
      h: "#74885a"
    },
    nylon: {
      o: "#3a3a34",
      d: "#8c8c80",
      b: "#a8a89c",
      l: "#bcbcb0",
      h: "#cccbc0"
    },
    glass: {
      o: "#101a1c",
      d: "#28464c",
      b: "#3c6870",
      l: "#5a8c94",
      h: "#8cbcc4"
    }
  };
  DZ.PAL = PAL;
  const MAG = [ "red", "blue", "green", "yelt", "white", "black" ];
  const S = {};
  S.screw = (R, p) => {
    p = p || PAL.steel;
    const k = R.i(4), b = new Spr(3, 3);
    b.rect(0, 0, 3, 3, p.b);
    b.set(0, 0, p.h);
    b.set(2, 2, p.d);
    const sl = k === 0 ? [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ] : k === 1 ? [ [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ] : k === 2 ? [ [ 0, 1 ], [ 1, 1 ], [ 2, 1 ], [ 1, 0 ], [ 1, 2 ] ] : [ [ 0, 2 ], [ 1, 1 ], [ 2, 0 ] ];
    for (const [x, y] of sl) b.set(x, y, p.d);
    return obj(b, p.o);
  };
  S.rivet = (R, p) => {
    p = p || PAL.steel;
    return obj(art([ "hb", "bd" ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.bolt = (R, p) => {
    p = p || PAL.zinc;
    return obj(art([ ".hb.", "hbbd", "bbdd", ".dd." ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.nut = (R, p) => {
    p = p || PAL.zinc;
    return obj(art([ ".hb.", "h..d", "b..d", ".dd." ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.nail = (R, p) => {
    p = p || PAL.zinc;
    return obj(art([ "hb", "bd" ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.tape = (R, len, th, p, v) => {
    const b = new Spr(len, th);
    for (let y = 0; y < th; y++) for (let x = 0; x < len; x++) b.set(x, y, y === 0 ? p.l : y === th - 1 ? p.d : (x * 3 + y) % 5 === 0 ? p.l : (x + y) % 2 ? p.b : R() < .15 ? p.h : p.b);
    for (const x of [ 0, len - 1 ]) for (let y = 0; y < th; y++) if (R() < .45 && th > 2) b.del(x, y);
    if (len > 8 && R() < .6) {
      const cx = R.r(3, len - 4);
      for (let y = 0; y < th; y++) b.set(cx, y, p.h);
    }
    const s = obj(b, p.o);
    return v ? rot(s) : s;
  };
  S.tapeDiag = (R, len, th, p, fl) => {
    const b = new Spr(len + th, len + th);
    for (let t = 0; t < len; t++) for (let k = 0; k < th; k++) {
      const x = t + k, y = t;
      if (t === 0 || t === len - 1) {
        if (R() < .4) continue;
      }
      b.set(x, y, k === 0 ? p.l : k === th - 1 ? p.d : t % 2 ? p.b : R() < .2 ? p.h : p.b);
    }
    const s = obj(b, p.o);
    return fl ? flipX(s) : s;
  };
  S.warn = R => {
    const p = PAL.haz;
    const s = art([ "....y....", "...yyy...", "...yky...", "..yykyy..", "..yykyy..", ".yyykyyy.", ".yyyyyyy.", "yyyykyyyy", "ddddddddd" ], {
      y: p.y,
      k: p.k,
      d: p.d
    });
    for (let y = 1; y < 8; y++) for (let x = 0; x < 9; x++) if (s.get(x, y) === p.y && !s.get(x - 1, y)) s.set(x, y, p.l);
    if (R.ch(.5)) s.set(R.r(2, 6), 7, p.d);
    return obj(s, p.o);
  };
  S.bio = () => {
    const p = PAL.bio;
    return obj(art([ "..YYYYY..", ".YYkYkYY.", "YYkkYkkYY", "YkkYkYkkY", "YYYkkkYYY", "YYkYkYkYY", "YkkYYYkkY", ".YkkYkkY.", "..YYYYY.." ], {
      Y: p.y,
      k: p.k
    }), p.o);
  };
  S.smile = R => {
    const p = R.ch(.5) ? PAL.sticky : PAL.yelt;
    return obj(art([ ".YYYYY.", "YYYYYYY", "YkYYYkY", "YYYYYYY", "YkYYYkY", "YYkkkYY", ".YYYYY." ], {
      Y: p.b,
      k: p.d
    }), p.o);
  };
  S.cross = () => {
    const p = PAL.red;
    return obj(art([ "wwwwwww", "wwwrwww", "wwwrwww", "wrrrrrw", "wwwrwww", "wwwrwww", "wwwwwww" ], {
      w: p.w,
      r: PAL.green.l
    }), "#3a3630");
  };
  S.star = () => {
    const p = PAL.yelt;
    return obj(art([ "...l...", "...l...", "llbbbll", ".bbbbb.", "..bbb..", ".bb.bb.", ".b...b." ], {
      l: p.h,
      b: p.l
    }), p.o);
  };
  S.skull = () => {
    const p = PAL.black;
    return obj(art([ "bbbbbbb", "bbwwwbb", "bwwwwwb", "bwbwbwb", "bwwwwwb", "bbwbwbb", "bbbbbbb" ], {
      b: p.b,
      w: p.w
    }), p.o);
  };
  S.heart = () => {
    const p = PAL.red;
    return obj(art([ ".hb.bb.", "hbbbbbb", "bbbbbbb", ".bbbbb.", "..bbb..", "...b..." ], {
      h: p.h,
      b: p.l
    }), p.o);
  };
  S.noEntry = () => {
    const p = PAL.red;
    return obj(art([ "..rrr..", ".rrrrr.", "rrrrrrr", "rwwwwwr", "rrrrrrr", ".rrrrr.", "..rrr.." ], {
      r: p.b,
      w: p.w
    }), p.o);
  };
  S.target = () => {
    const p = PAL.red;
    return obj(art([ "..wwwww..", ".wrrrrrw.", "wrwwwwwrw", "wrwrrrwrw", "wrwrhrwrw", "wrwrrrwrw", "wrwwwwwrw", ".wrrrrrw.", "..wwwww.." ], {
      w: p.w,
      r: p.b,
      h: p.d
    }), p.o);
  };
  S.drop = () => {
    const p = PAL.blue;
    return obj(art([ "..h..", "..h..", ".hbb.", ".bbb.", "hbbbb", "bbbbd", ".bbd." ], {
      h: p.h,
      b: p.l,
      d: p.b
    }), p.o);
  };
  S.flame = () => {
    const p = PAL.haz, r = PAL.red;
    return obj(art([ "....y....", "...yyy...", "...yry...", "..yrryy..", "..yrlry..", ".yyrlryy.", ".yyrrryy.", "yyyyyyyyy" ], {
      y: p.y,
      r: r.b,
      l: "#d27a3a"
    }), p.o);
  };
  S.leaf = () => {
    const p = PAL.green;
    return obj(art([ "...hh", "..hbb", ".hbdb", "hbdbb", "bdbb.", "dbb..", "d...." ], {
      h: p.h,
      b: p.l,
      d: p.d
    }), p.o);
  };
  S.fish = () => {
    const p = PAL.blue;
    return obj(art([ ".bbbb..b", "bhbbbbbb", "bbbbbbb.", ".dddd..d" ], {
      b: p.l,
      h: p.h,
      d: p.b
    }), p.o);
  };
  S.radio = () => {
    const p = PAL.black;
    return obj(art([ "l....", "l....", "bbbbb", "bwwwb", "bbbbb", "bhbhb", "bbbbb" ], {
      l: p.l,
      b: p.l,
      w: "#6a8a5a",
      h: p.h
    }), p.o);
  };
  S.bolt2 = () => {
    const p = PAL.yelt;
    return obj(art([ "..bb", ".bb.", "bbbb", ".bb.", "bb.." ], {
      b: p.l
    }), p.o);
  };
  S.warnS = () => {
    const p = PAL.haz;
    return obj(art([ "..y..", ".yky.", ".yky.", "yyyyy", "yykyy" ], {
      y: p.y,
      k: p.k
    }), p.o);
  };
  S.smileS = () => {
    const p = PAL.yelt;
    return obj(art([ ".yyy.", "ykyky", "yyyyy", "ykkky", ".yyy." ], {
      y: p.l,
      k: p.d
    }), p.o);
  };
  S.skullS = () => {
    const p = PAL.black;
    return obj(art([ "bwwwb", "wbwbw", "wwwww", "bwbwb", "bbbbb" ], {
      b: p.b,
      w: p.w
    }), p.o);
  };
  S.starS = () => {
    const p = PAL.yelt;
    return obj(art([ "..y..", "yyyyy", ".yyy.", ".y.y.", "y...y" ], {
      y: p.l
    }), p.o);
  };
  S.heartS = () => {
    const p = PAL.red;
    return obj(art([ ".h.b.", "hbbbb", "bbbbb", ".bbb.", "..b.." ], {
      h: p.h,
      b: p.l
    }), p.o);
  };
  S.noS = () => {
    const p = PAL.red;
    return obj(art([ ".rrr.", "rrrrr", "rwwwr", "rrrrr", ".rrr." ], {
      r: p.b,
      w: p.w
    }), p.o);
  };
  S.crossS = () => {
    const p = PAL.red;
    return obj(art([ "wwrww", "wwrww", "rrrrr", "wwrww", "wwrww" ], {
      w: p.w,
      r: PAL.green.l
    }), "#3a3630");
  };
  S.magnet = (R, pn) => {
    const p = PAL[pn || R.pick(MAG)];
    return obj(art([ ".hbb.", "hbbbb", "bbbbd", "bbbdd", ".bdd." ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.tack = (R, pn) => {
    const p = PAL[pn || R.pick([ "red", "blue", "yelt", "green", "white" ])];
    return obj(art([ "hb.", "bbd", ".d." ], {
      h: p.h,
      b: p.l,
      d: p.d
    }), p.o);
  };
  S.dymo = (R, t, pn) => {
    const p = PAL[pn || R.pick([ "black", "black", "red", "bluet" ])], w = tw(t) + 4, b = new Spr(w, 5);
    b.rect(0, 0, w, 5, p.b);
    for (let x = 0; x < w; x++) if (R() < .18) b.set(x, 4, p.d);
    text(tSpr(b), t, 2, 0, pn === "yelt" ? PAL.black.b : "#c4c6bc");
    return obj(b, p.o);
  };
  S.blood = R => {
    const p = PAL.white, t = R.pick([ "A+", "B+", "O+", "AB", "O-", "B-", "A-" ]), b = new Spr(14, 7);
    b.rect(0, 0, 14, 7, p.b);
    for (let y = 0; y < 7; y++) {
      b.set(0, y, p.l);
    }
    b.set(1, 2, PAL.brass.l);
    b.set(2, 2, PAL.brass.b);
    b.set(1, 3, PAL.brass.b);
    b.set(2, 3, PAL.brass.d);
    b.set(1, 4, PAL.brass.d);
    text(tSpr(b), t, 5, 1, PAL.red.b);
    if (R.ch(.5)) b.set(R.r(5, 12), 6, p.d);
    return obj(b, p.o);
  };
  S.serial = (R, t, p) => {
    p = p || PAL.zinc;
    t = t || "SN" + R.r(10, 99) + "-" + R.r(100, 999);
    const w = tw(t) + 6, b = new Spr(w, 7);
    b.rect(0, 0, w, 7, p.b);
    for (let x = 0; x < w; x++) b.set(x, 0, p.l);
    for (let x = 0; x < w; x++) b.set(x, 6, p.d);
    b.set(1, 3, p.h);
    b.set(w - 2, 3, p.h);
    b.set(1, 4, p.d);
    b.set(w - 2, 4, p.d);
    text(tSpr(b), t, 3, 1, p.d);
    return obj(b, p.o);
  };
  S.barcode = (R, w) => {
    const p = PAL.white;
    w = w || R.r(9, 13);
    const b = new Spr(w, 6);
    b.rect(0, 0, w, 6, p.b);
    for (let x = 1; x < w - 1; x++) if (R() < .62) for (let y = 1; y < 4; y++) b.set(x, y, p.d);
    for (let x = 1; x < w - 1; x += 2) b.set(x, 5, p.d);
    return obj(b, p.o);
  };
  function scribble(set, R, x0, y0, len, c) {
    let y = y0;
    for (let x = x0; x < x0 + len; x++) {
      set(x, y, c);
      if (R() < .35) y += R.ch(.5) ? 1 : -1;
      y = Math.max(y0 - 1, Math.min(y0 + 1, y));
      if (R() < .12) x++;
    }
  }
  function tally(set, R, x0, y0, n, c, h) {
    h = h || 4;
    let x = x0;
    for (let i = 0; i < n; i++) {
      const g = i % 5;
      if (g < 4) {
        for (let y = 0; y < h; y++) set(x, y0 + y, c);
        x += 2;
      } else {
        for (let k = 0; k < 8; k++) set(x - 8 + k, y0 + Math.min(h - 1, Math.floor(k * h / 8)), c);
        x += 2;
      }
    }
    return x - x0;
  }
  S.note = (R, w, h, kind, pn) => {
    const p = PAL[pn || "paper"], b = new Spr(w, h), set = tSpr(b);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, R() < .12 ? p.l : p.b);
    for (let x = 0; x < w; x++) b.set(x, 0, p.h);
    kind = kind || R.pick([ "lines", "tally", "list", "draw" ]);
    const ink = R.ch(.7) ? p.ink : p.pen || p.ink;
    if (kind === "lines") {
      for (let y = 2; y < h - 1; y += 2) {
        if (R() < .85) scribble(set, R, 1, y, R.r(Math.max(2, w - 7), w - 2), ink);
      }
    } else if (kind === "tally") {
      for (let y = 1; y + 4 < h; y += 6) tally(set, R, 1, y, Math.min(Math.floor((w - 2) / 2), R.r(4, 12)), ink);
    } else if (kind === "list") {
      for (let y = 2; y < h - 1; y += 2) {
        set(1, y, ink);
        if (R.ch(.6)) {
          set(2, y - 1, p.red);
        }
        scribble(set, R, 3, y, R.r(2, Math.max(2, w - 5)), ink);
      }
    } else {
      const cx = w >> 1, cy = h >> 1;
      for (let a = 0; a < 12; a++) {
        const t = a / 12 * Math.PI * 2;
        set(Math.round(cx + Math.cos(t) * 3), Math.round(cy + Math.sin(t) * 3), ink);
      }
      set(cx - 1, cy - 1, ink);
      set(cx + 1, cy - 1, ink);
      set(cx - 1, cy + 1, ink);
      set(cx, cy + 2, ink);
      set(cx + 1, cy + 1, ink);
    }
    if (R.ch(.6)) {
      b.set(w - 1, h - 1, 0);
      b.set(w - 2, h - 1, p.h);
      b.set(w - 1, h - 2, p.h);
    }
    return obj(b, p.o, true);
  };
  S.photo = R => {
    const p = PAL.white, b = new Spr(11, 13);
    b.rect(0, 0, 11, 13, p.l);
    for (let x = 0; x < 11; x++) b.set(x, 12, p.b);
    const T = R.pick([ [ "#4e6478", "#3a4a3a", "#2a3426" ], [ "#7a6a58", "#4a3a2a", "#2e241a" ], [ "#5a6a7a", "#5a5a5a", "#3a3a3a" ] ]);
    for (let y = 1; y < 8; y++) for (let x = 1; x < 10; x++) b.set(x, y, y < 5 ? y === 1 ? lit(T[0], .1) : T[0] : y === 5 ? T[1] : T[2]);
    const k = "#1c1e22";
    if (R.ch(.5)) {
      for (const [x, y] of [ [ 3, 3 ], [ 3, 4 ], [ 3, 5 ], [ 3, 6 ], [ 2, 5 ], [ 4, 5 ], [ 7, 3 ], [ 7, 4 ], [ 7, 5 ], [ 7, 6 ], [ 6, 5 ], [ 8, 5 ] ]) b.set(x, y, k);
      b.set(3, 2, "#b09070");
      b.set(7, 2, "#b09070");
    } else {
      for (let x = 2; x < 9; x++) b.set(x, 6, k);
      for (let x = 3; x < 8; x++) b.set(x, 5, k);
      for (let x = 4; x < 7; x++) b.set(x, 4, k);
      b.set(5, 3, k);
      b.set(5, 6, "#8a7a4a");
      b.set(8, 3, "#d8c890");
    }
    scribble(tSpr(b), R, 2, 10, 7, PAL.paper.pen);
    return obj(b, p.o, true);
  };
  S.sticky = R => S.note(R, R.r(8, 10), R.r(8, 9), R.pick([ "lines", "tally", "list" ]), "sticky");
  S.clip = (R, p) => {
    p = p || PAL.zinc;
    const s = art([ ".lll.", "l...l", "l.l.l", "l.l.l", "l.l.l", "l.l.l", "l...l", ".l.l." ], {
      l: p.l
    });
    s.set(1, 1, 0);
    return obj(s, p.o);
  };
  S.tie = (R, pn) => {
    const p = PAL[pn || R.pick([ "nylon", "nylon", "black", "red" ])];
    return obj(art([ ".bb.", ".bb.", "hbbb", "bbbd", ".bb.", ".bb.", ".bd." ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.pin = R => {
    const p = PAL.zinc;
    return obj(art([ "hb.......", "b.bbbbbbd", "hbbbbbbb." ], {
      h: p.h,
      b: p.l,
      d: p.d
    }), p.o);
  };
  S.button = R => {
    const p = PAL[R.pick([ "black", "wood", "white", "red" ])];
    return obj(art([ ".hb.", "hdbd", "bbdb", ".dd." ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.size = R => {
    const p = PAL.white, t = R.pick([ "S", "M", "L", "XL" ]), w = tw(t) + 4, b = new Spr(w, 7);
    b.rect(0, 0, w, 7, p.b);
    text(tSpr(b), t, 2, 1, PAL.black.l);
    return obj(b, p.o);
  };
  S.measure = (R, len) => {
    const p = PAL.yelt, b = new Spr(len, 4);
    b.rect(0, 0, len, 4, p.l);
    for (let x = 0; x < len; x++) {
      b.set(x, 3, p.b);
      if (x % 2 === 0) b.set(x, 0, PAL.black.l);
      if (x % 10 === 0) {
        b.set(x, 1, PAL.black.l);
        b.set(x, 2, PAL.black.l);
      } else if (x % 5 === 0) b.set(x, 1, PAL.black.l);
    }
    return obj(b, p.o);
  };
  S.padlock = () => {
    const p = PAL.brass, q = PAL.steel;
    return obj(art([ ".sss.", "s...s", "s...s", "bbbbb", "hbbbb", "bbdbb", "bbdbb", "bbbbd" ], {
      s: q.l,
      b: p.b,
      h: p.h,
      d: p.d
    }), p.o, true);
  };
  S.stamp = R => {
    const p = PAL.zinc;
    return obj(art([ "hbbd", "bbdd" ], {
      h: p.h,
      b: p.b,
      d: p.d
    }), p.o);
  };
  S.pencil = (R, len) => {
    const p = PAL.yelt;
    len = len || R.r(10, 14);
    const b = new Spr(len, 2);
    for (let x = 0; x < len; x++) {
      b.set(x, 0, x < 2 ? "#c49a6a" : x === 0 ? "#3a3a3a" : x > len - 3 ? "#a85a5a" : p.l);
      b.set(x, 1, x < 2 ? "#a07a4a" : x > len - 3 ? "#8a4040" : p.b);
    }
    b.set(0, 0, "#4a4a4a");
    b.del(0, 1);
    return obj(b, p.o);
  };
  S.swatch = R => {
    const p = PAL.white, b = new Spr(13, 6);
    b.rect(0, 0, 13, 6, p.b);
    const cs = [ "#8a3a2e", "#3c6a4a", "#3c5878", "#b8941f", "#6a4a7a", "#a8a8a0" ];
    for (let i = 0; i < 3; i++) {
      const c = R.pick(cs);
      for (let y = 1; y < 5; y++) for (let x = 0; x < 3; x++) b.set(1 + i * 4 + x, y, c);
    }
    return obj(b, p.o);
  };
  S.casing = R => {
    const p = PAL.brass;
    return obj(art([ "dhb", "hbb", "bbd", "bbd", "bbd" ], {
      h: p.h,
      b: p.l,
      d: p.b
    }), p.o);
  };
  S.spring = R => {
    const p = PAL.zinc;
    return obj(art([ "l.l.l.l", ".l.l.l.", "l.l.l.l" ], {
      l: p.l
    }), p.o);
  };
  S.key = () => {
    const p = PAL.brass;
    return obj(art([ ".bb....", "b..bbbb", ".bb.b.b" ], {
      b: p.l
    }), p.o);
  };
  S.coin = () => {
    const p = PAL.zinc;
    return obj(art([ ".hb.", "hbbd", "bbbd", ".dd." ], {
      h: p.h,
      b: p.l,
      d: p.b
    }), p.o);
  };
  S.wrench = R => {
    const p = PAL.zinc;
    return obj(art([ "b.b", "bbb", ".b.", ".b.", ".b.", ".b.", ".b.", "bbb", "b.b" ], {
      b: p.l
    }), p.o);
  };
  S.screwdriver = R => {
    const p = PAL.zinc, h = PAL[R.pick([ "red", "yelt", "blue" ])];
    return obj(art([ ".h.", "hbh", "hbh", "hbh", ".s.", ".s.", ".s.", ".s.", ".d." ], {
      h: h.l,
      b: h.b,
      s: p.l,
      d: p.b
    }), h.o);
  };
  S.hammer = R => {
    const p = PAL.zinc, w = PAL.wood;
    return obj(art([ "sssss", "ss.ss", "..w..", "..w..", "..w..", "..w..", "..w..", "..d.." ], {
      s: p.l,
      w: w.l,
      d: w.b
    }), p.o);
  };
  S.hook = () => {
    const p = PAL.zinc;
    return obj(art([ "l.", "l.", "ll" ], {
      l: p.l
    }), p.o);
  };
  S.bandage = R => {
    const p = PAL.mask, b = new Spr(11, 4);
    b.rect(0, 0, 11, 4, p.l);
    for (let x = 4; x < 7; x++) for (let y = 1; y < 3; y++) b.set(x, y, p.h);
    for (let x = 0; x < 11; x += 2) b.set(x, 0, p.h);
    return obj(b, p.o);
  };
  S.seeds = R => {
    const p = PAL.paper, b = new Spr(9, 11);
    b.rect(0, 0, 9, 11, p.b);
    for (let x = 0; x < 9; x++) b.set(x, 0, p.d);
    const g = PAL.green;
    b.set(4, 3, g.l);
    b.set(3, 4, g.l);
    b.set(5, 4, g.h);
    b.set(4, 5, g.b);
    b.set(4, 6, g.b);
    b.set(4, 7, g.d);
    scribble(tSpr(b), R, 1, 9, 7, p.ink);
    return obj(b, p.o, true);
  };
  S.plate = (R, w, h, p) => {
    p = p || PAL.zinc;
    const b = new Spr(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, y === 0 ? p.l : y === h - 1 ? p.d : x === 0 ? p.l : x === w - 1 ? p.d : R() < .06 ? p.l : p.b);
    for (const [x, y] of [ [ 2, 2 ], [ w - 3, 2 ], [ 2, h - 3 ], [ w - 3, h - 3 ] ]) {
      b.set(x, y, p.h);
      b.set(x + 1, y, p.d);
      b.set(x, y + 1, p.d);
    }
    return b;
  };
  S.dataPlate = (R, p) => {
    p = p || PAL.zinc;
    const L = [ R.pick([ "MOD", "TYPE", "LOT", "UNIT" ]) + " " + R.r(1, 9) + R.pick([ "", "A", "B", "K" ]), "SN " + R.r(1e3, 9999), R.pick([ "KR", "MFG", "NO" ]) + " " + R.r(10, 99) ], n = R.r(2, 3);
    const w = Math.max(...L.slice(0, n).map(tw)) + 8, h = n * 6 + 5, b = S.plate(R, w, h, p);
    for (let i = 0; i < n; i++) text(tSpr(b), L[i], 4, 3 + i * 6, p.d);
    return obj(b, p.o, true);
  };
  S.vent = (R, w, h, p) => {
    p = p || PAL.steel;
    const b = S.plate(R, w, h, p);
    for (let y = 3; y < h - 3; y += 2) for (let x = 5; x < w - 5; x++) {
      b.set(x, y, p.d);
      b.set(x, y + 1, y + 1 < h - 3 ? p.l : p.b);
    }
    return obj(b, p.o, true);
  };
  S.grille = (R, w, h, p) => {
    p = p || PAL.olive;
    const b = S.plate(R, w, h, p);
    for (let y = 3; y < h - 3; y += 2) for (let x = 4 + (y >> 1) % 2; x < w - 4; x += 2) b.set(x, y, p.d);
    return obj(b, p.o, true);
  };
  S.peg = (R, w, h) => {
    const p = PAL.board, b = new Spr(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, y === 0 ? p.h : y === h - 1 ? p.d : R() < .1 ? p.l : p.b);
    for (let y = 2; y < h - 1; y += 3) for (let x = 2; x < w - 1; x += 3) b.set(x, y, p.hole);
    const s = obj(b, p.o, true), tools = [ S.wrench, S.screwdriver, S.hammer, S.wrench ];
    let x = 3;
    while (x < w - 6) {
      const t = R.pick(tools)(R);
      if (x + t.w > w - 1 || t.h > h - 2) break;
      if (R() < .75) over(s, t, x + 1, 2 + R.i(Math.max(1, h - t.h - 2))); else over(s, S.hook(R), x + 2, 3);
      x += t.w + R.r(2, 4);
    }
    return s;
  };
  S.scale = (R, w) => {
    const p = PAL.white, b = new Spr(w, 9);
    b.rect(0, 0, w, 9, p.b);
    let n = R.r(8, 9) * 10;
    for (let x = 1; x < w - 1; x++) {
      b.set(x, 0, PAL.black.l);
      if (x % 2 === 1) b.set(x, 1, PAL.black.l);
      if ((x - 1) % 10 === 0) {
        b.set(x, 2, PAL.black.l);
        if (x + 7 < w) text(tSpr(b), String(n), x, 3, PAL.black.l);
        n += 2;
      }
    }
    const px = R.r(4, w - 4);
    for (let y = 0; y < 9; y++) b.set(px, y, PAL.red.b);
    return obj(b, p.o);
  };
  S.holder = (R, w) => {
    const p = PAL.zinc, b = new Spr(w, 12);
    for (let x = 0; x < w; x++) {
      b.set(x, 0, p.l);
      b.set(x, 1, p.d);
      b.set(x, 10, p.l);
      b.set(x, 11, p.d);
    }
    const q = PAL.paper;
    for (let y = 2; y < 10; y++) for (let x = 1; x < w - 1; x++) b.set(x, y, q.b);
    scribble(tSpr(b), R, 2, 4, w - 6, q.ink);
    scribble(tSpr(b), R, 2, 7, R.r(3, w - 5), q.ink);
    b.set(0, 1, p.h);
    b.set(w - 1, 1, p.h);
    return obj(b, p.o);
  };
  S.speaker = (R, d, p) => {
    p = p || PAL.olive;
    const b = new Spr(d, d), r = d / 2;
    for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
      const q = Math.hypot(x + .5 - r, y + .5 - r);
      if (q <= r) b.set(x, y, q > r - 1.2 ? p.l : (x + y) % 2 === 0 && q < r - 1.5 ? p.d : p.b);
    }
    return obj(b, p.o);
  };
  const M = {};
  M.scratch = function(put, R, x, y, bg, len) {
    len = len || R.r(3, 8);
    const dx = R.ch(.5) ? 1 : -1, steep = R.ch(.3), c = lit(bg, .13 + R() * .06), s = drk(bg, .35);
    for (let i = 0; i < len; i++) {
      const X = steep ? x + Math.floor(i / 2) * dx : x + i * dx, Y = steep ? y + i : y + Math.floor(i / 2);
      put(X, Y, c);
      if (R() < .35) put(X, Y + 1, s);
    }
  };
  M.claw = function(put, R, x, y, bg) {
    const len = R.r(6, 10), c = lit(bg, .16), s = drk(bg, .4);
    for (let k = 0; k < 3; k++) for (let i = 0; i < len - (k === 1 ? 0 : 2); i++) {
      const X = x + k * 2 + Math.floor(i / 3), Y = y + i + (k === 1 ? 0 : 1);
      put(X, Y, c);
      put(X + 1, Y, s);
    }
  };
  M.dent = function(put, R, x, y, bg) {
    const w = R.r(4, 6), h = R.r(2, 3);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if ((i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
      put(x + i, y + j, j === 0 || i === 0 ? drk(bg, .3) : j === h - 1 || i === w - 1 ? lit(bg, .12) : drk(bg, .12));
    }
  };
  M.hole = function(put, R, x, y, bg) {
    const k = drk(bg, .7), c = lit(bg, .18);
    put(x + 1, y + 1, k);
    put(x + 2, y + 1, k);
    put(x + 1, y + 2, k);
    put(x + 2, y + 2, drk(bg, .5));
    for (const [a, b] of [ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 0, 2 ], [ 3, 2 ], [ 1, 3 ], [ 2, 3 ] ]) put(x + a, y + b, R() < .7 ? c : drk(bg, .25));
    if (R.ch(.6)) {
      put(x + 4, y, c);
      put(x + 5, y - 1, c);
    }
  };
  M.rust = function(put, R, x, y, bg, w, h) {
    w = w || R.r(3, 6);
    h = h || R.r(3, 7);
    const C = [ "#3a2214", "#4e2c16", "#64391a", "#7a4a22" ];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const p = (1 - j / h) * (1 - Math.abs(i - w / 2) / (w / 2 + .5));
      if (R() < p * .9) put(x + i, y + j, C[Math.min(3, Math.floor(R() * 4 * p + .3))]);
    }
  };
  M.drip = function(put, R, x, y, bg, c) {
    const n = R.r(2, 5);
    c = c || "#4e2c16";
    for (let j = 0; j < n; j++) put(x, y + j, j === n - 1 ? drk(c, .2) : c);
  };
  M.chip = function(put, R, x, y, bg, mat) {
    const c = mat === "wood" ? lit(bg, .22) : R.ch(.5) ? "#4a2a1e" : lit(bg, .24), n = R.r(1, 3);
    for (let i = 0; i < n; i++) {
      put(x + i, y, c);
      if (R() < .4) put(x + i, y + 1, c);
    }
  };
  M.dust = function(put, R, x, y, bg, w, h, corner) {
    const c1 = lit(bg, .07), c2 = lit(bg, .12);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = corner & 1 ? w - 1 - i : i, dy = corner & 2 ? h - 1 - j : j, p = 1 - (dx / w + dy / h);
      if (p > 0 && R() < p * .55) put(x + i, y + j, R() < .3 ? c2 : c1);
    }
  };
  M.grime = function(put, R, x, y, bg, w, h) {
    const c = drk(bg, .28);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (R() < (j + 1) / (h + 1) * .45) put(x + i, y + j, c);
  };
  M.stencil = function(put, R, x, y, bg, t, tint, sc) {
    const c = tint ? mix(bg, tint, .38) : lit(bg, .15);
    text((X, Y, C) => {
      if (R() > .13) put(X, Y, C);
    }, t, x, y, c, sc || 1, true);
  };
  M.tally = function(put, R, x, y, bg, n, c) {
    tally(put, R, x, y, n, c || lit(bg, .2));
  };
  M.smiley = function(put, R, x, y, bg, c) {
    c = c || mix(bg, R.pick([ "#6a9ac8", "#c86a5a", "#9ac86a", "#d8d0a8" ]), .55);
    for (const [a, b] of [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ], [ 0, 1 ], [ 4, 1 ], [ 0, 2 ], [ 4, 2 ], [ 0, 3 ], [ 4, 3 ], [ 1, 4 ], [ 2, 4 ], [ 3, 4 ], [ 1, 1 ], [ 3, 1 ], [ 1, 3 ], [ 2, 3 ], [ 3, 3 ] ]) if (!(a === 2 && b === 3)) put(x + a, y + b, c);
  };
  M.chalk = function(put, R, x, y, bg, kind) {
    const c = mix(bg, "#b8b4a4", .45), P = (a, b) => {
      if (R() > .12) put(x + a, y + b, c);
    };
    if (kind === "x") for (let i = 0; i < 5; i++) {
      P(i, i);
      P(4 - i, i);
    } else if (kind === "arrow") {
      for (let i = 0; i < 7; i++) P(i, 2);
      P(5, 1);
      P(4, 0);
      P(5, 3);
      P(4, 4);
    } else if (kind === "check") {
      P(0, 2);
      P(1, 3);
      P(2, 4);
      P(3, 3);
      P(4, 2);
      P(5, 1);
      P(6, 0);
    } else {
      for (let a = 0; a < 10; a++) {
        const t = a / 10 * 6.283;
        P(Math.round(3 + Math.cos(t) * 3), Math.round(2 + Math.sin(t) * 2));
      }
    }
  };
  M.ring = function(put, R, x, y, bg) {
    const r = R.r(3, 4), c = mix(bg, "#6a4a2a", .5);
    for (let a = 0; a < 28; a++) {
      if (R() < .18) continue;
      const t = a / 28 * 6.283;
      put(Math.round(x + r + Math.cos(t) * r), Math.round(y + r + Math.sin(t) * r * .85), c);
    }
  };
  M.burn = function(put, R, x, y, bg) {
    const w = R.r(4, 7), h = R.r(3, 5);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = Math.hypot((i - w / 2) / (w / 2), (j - h / 2) / (h / 2));
      if (q < 1 && R() < 1.1 - q) put(x + i, y + j, q < .5 ? drk(bg, .6) : drk(bg, .35));
    }
  };
  M.knot = function(put, R, x, y, bg) {
    const c = drk(bg, .35), l = lit(bg, .08);
    for (const [a, b] of [ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 1, 2 ], [ 2, 2 ] ]) put(x + a, y + b, c);
    put(x + 1, y + 1, drk(bg, .55));
    put(x + 2, y + 1, c);
    put(x - 1, y + 1, l);
    put(x + 4, y + 1, l);
  };
  M.carve = function(put, R, x, y, bg) {
    const t = R.pick([ "JH", "KS", "MJ", "B+", "SY", "07", "HY" ]);
    text((X, Y) => {
      put(X, Y, drk(bg, .45));
      put(X, Y + 1, lit(bg, .1));
    }, t, x, y, null);
  };
  M.print = function(put, R, x, y, bg) {
    const c = drk(bg, .3);
    for (const [a, b] of [ [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 3, 1 ], [ 1, 2 ], [ 2, 1 ], [ 0, 3 ], [ 3, 3 ], [ 1, 4 ], [ 2, 4 ], [ 1, 3 ] ]) if (R() < .85) put(x + a, y + b, c);
  };
  M.blood = function(put, R, x, y, bg) {
    const C = [ "#4a1612", "#5e1c16", "#3a100e" ], n = R.r(3, 7);
    for (let i = 0; i < n; i++) {
      const X = x + R.i(7), Y = y + R.i(5);
      put(X, Y, R.pick(C));
      if (R() < .3) put(X + 1, Y, C[0]);
    }
    if (R.ch(.5)) M.drip(put, R, x + 3, y + 4, bg, C[1]);
  };
  M.soot = function(put, R, x, y, bg, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = Math.hypot((i - w / 2) / (w / 2), (j - h / 2) / (h / 2));
      if (q < 1 && R() < (1 - q) * .7) put(x + i, y + j, drk(bg, .3 + (1 - q) * .3));
    }
  };
  M.drops = function(put, R, x, y, bg) {
    const n = R.r(3, 6);
    for (let i = 0; i < n; i++) {
      const X = x + R.i(8), Y = y + R.i(6);
      put(X, Y, mix(bg, "#6a96a8", .45));
      if (R() < .5) put(X, Y - 1, mix(bg, "#9ac4d4", .5));
    }
  };
  M.soil = function(put, R, x, y, bg) {
    const C = [ "#3a2a1a", "#4a3622", "#2e2014" ];
    for (let i = 0; i < 14; i++) put(x + R.i(7), y + R.i(4), R.pick(C));
  };
  M.grease = function(put, R, x, y, bg) {
    const w = R.r(4, 7), h = R.r(2, 4);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (R() < .6) put(x + i, y + j, mix(drk(bg, .25), "#3a2a10", .3));
  };
  M.salt = function(put, R, x, y, bg) {
    for (let i = 0; i < 6; i++) put(x + R.i(8), y + R.i(5), lit(bg, R.ch(.5) ? .3 : .18));
  };
  M.ticks = function(put, R, x, y, bg, len, c) {
    c = c || lit(bg, .16);
    for (let i = 0; i < len; i++) {
      put(x + i, y, c);
      if (i % 4 === 0) {
        put(x + i, y + 1, c);
        if (i % 8 === 0) put(x + i, y + 2, c);
      }
    }
  };
  M.hazard = function(put, R, x, y, bg, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, (i + j >> 1) % 2 ? mix(bg, "#b8941f", .55) : drk(bg, .35));
  };
  M.weld = function(put, R, x, y, bg, len) {
    for (let i = 0; i < len; i++) {
      put(x + i, y, i % 3 ? lit(bg, .1) : drk(bg, .25));
    }
  };
  M.stitch = function(put, R, x0, y0, x1, y1, c) {
    const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= L; i++) {
      if (i % 3 === 2) continue;
      const t = L ? i / L : 0;
      put(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c);
    }
  };
  M.string = function(put, R, x0, y0, x1, y1, c) {
    const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= L; i++) {
      const t = L ? i / L : 0, sag = Math.sin(t * Math.PI) * Math.min(3, L / 10);
      put(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + sag), c);
    }
  };
  M.checker = function(put, R, x0, y0, w, h, bg) {
    const hi = lit(bg, .07), lo = drk(bg, .22);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y, a = (X + Y * 2) % 8, b = (X - Y * 2 + 800) % 8;
      if (a === 0 && Y % 4 < 2 || b === 4 && Y % 4 >= 2) put(X, Y, hi); else if (a === 1 && Y % 4 < 2 || b === 5 && Y % 4 >= 2) put(X, Y, lo);
    }
  };
  M.brush = function(put, R, x0, y0, w, h, bg) {
    const c = lit(bg, .05), d = drk(bg, .12);
    for (let y = 0; y < h; y++) {
      let x = R.i(10);
      while (x < w) {
        const n = R.r(3, 12);
        const col = R() < .6 ? c : d;
        for (let i = 0; i < n && x + i < w; i++) put(x0 + x + i, y0 + y, col);
        x += n + R.r(6, 22);
      }
    }
  };
  M.grain = function(put, R, x0, y0, w, h, bg) {
    const c = drk(bg, .18), l = lit(bg, .06);
    for (let y = 0; y < h; y += R.r(2, 4)) {
      let ph = R() * 6;
      for (let x = 0; x < w; x++) {
        const yy = y + Math.round(Math.sin((x + ph * 9) * .09) * 1.2);
        if (R() < .8) put(x0 + x, y0 + yy, R() < .15 ? l : c);
      }
    }
  };
  M.crinkle = function(put, R, x0, y0, w, h, bg) {
    const c = lit(bg, .06), d = drk(bg, .16);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const r = R();
      if (r < .05) put(x0 + x, y0 + y, d); else if (r < .08) put(x0 + x, y0 + y, c);
    }
  };
  M.fiber = function(put, R, x0, y0, w, h, bg) {
    const c = lit(bg, .06);
    for (let i = 0; i < w * h / 40; i++) {
      const x = R.i(w), y = R.i(h);
      put(x0 + x, y0 + y, c);
      if (R() < .5) put(x0 + x + 1, y0 + y, c);
    }
  };
  let CTX = null;
  for (const k of Object.keys(S)) {
    const f = S[k];
    S[k] = function() {
      const r = f.apply(this, arguments);
      if (r && r.c && !r.k) r.k = k;
      return r;
    };
  }
  for (const k of Object.keys(M)) {
    const f = M[k];
    M[k] = function() {
      const C = CTX;
      if (C) C.beg("m:" + k);
      try {
        return f.apply(this, arguments);
      } finally {
        if (C) C.end();
      }
    };
  }
  DZ.S = S;
  DZ.M = M;
  const MAT_OF = w => w.id === "deco" ? "hud" : w.dataset.cs || (w.classList.contains("ngWin") ? "radio" : w.classList.contains("loWin") ? "steel" : "metal");
  const MID = {
    steel: [ [ "warn", 3 ], [ "bio", 2 ], [ "smile", 2 ], [ "skull", 1 ], [ "star", 1 ], [ "heart", 1 ], [ "blood", 3 ], [ "barcode", 3 ], [ "serial", 3 ], [ "tapeH", 3 ], [ "tapeV", 2 ], [ "redt", 2 ], [ "magnet", 2 ], [ "note", 3 ], [ "sticky", 2 ], [ "photo", 1 ], [ "noEntry", 1 ], [ "stencil", 4 ], [ "tally", 3 ], [ "bolts", 2 ], [ "clip", 1 ], [ "tie", 1 ], [ "stamp", 2 ], [ "dymo", 2 ], [ "claw", 2 ], [ "hole", 1 ], [ "mSmiley", 1 ] ],
    wood: [ [ "nails", 4 ], [ "carve", 3 ], [ "knot", 3 ], [ "burn", 2 ], [ "note", 4 ], [ "tack", 3 ], [ "tapeM", 3 ], [ "tally", 4 ], [ "chalk", 4 ], [ "ring", 2 ], [ "photo", 1 ], [ "sticky", 2 ], [ "stamp", 1 ], [ "string", 2 ], [ "coin", 1 ], [ "key", 1 ] ],
    radio: [ [ "dymo", 6 ], [ "serial", 3 ], [ "tapeH", 2 ], [ "tapeM", 2 ], [ "warn", 2 ], [ "star", 1 ], [ "radio", 2 ], [ "barcode", 2 ], [ "stencil", 3 ], [ "tally", 2 ], [ "bolts", 3 ], [ "tie", 2 ], [ "note", 2 ], [ "sticky", 2 ], [ "scale", 1 ], [ "led", 3 ], [ "bolt2", 1 ], [ "mSmiley", 1 ] ],
    report: [ [ "ring", 3 ], [ "stamp", 3 ], [ "note", 3 ], [ "sticky", 3 ], [ "clip", 2 ], [ "tally", 3 ], [ "mSmiley", 1 ], [ "chalk", 2 ], [ "blood", 2 ], [ "print", 2 ], [ "tapeM", 3 ], [ "staple", 3 ], [ "photo", 1 ], [ "star", 1 ], [ "pen", 2 ] ],
    metal: [ [ "warn", 2 ], [ "serial", 3 ], [ "barcode", 3 ], [ "tapeH", 3 ], [ "redt", 2 ], [ "sticky", 2 ], [ "note", 2 ], [ "stencil", 3 ], [ "bolts", 3 ], [ "stamp", 2 ], [ "dymo", 2 ], [ "clip", 1 ], [ "smile", 1 ], [ "tally", 2 ], [ "claw", 1 ], [ "led", 1 ] ],
    hud: [ [ "tapeM", 3 ], [ "swatch", 3 ], [ "pencil", 2 ], [ "ticks", 3 ], [ "bolts", 2 ], [ "sticky", 2 ], [ "chalk", 2 ], [ "measure", 1 ] ]
  };
  const KIND_MID = {
    inv: [ [ "blood", 2 ], [ "tally", 2 ], [ "photo", 1 ], [ "magnet", 1 ] ],
    range: [ [ "target", 5 ], [ "hole", 5 ], [ "tally", 4 ], [ "casing", 3 ], [ "warn", 2 ] ],
    cook: [ [ "magnet", 4 ], [ "grease", 3 ], [ "salt", 2 ], [ "note", 2 ], [ "flame", 1 ] ],
    craft: [ [ "grease", 3 ], [ "bolts", 4 ], [ "pencil", 2 ], [ "measure", 2 ], [ "spring", 2 ], [ "nuts", 2 ], [ "warn", 1 ] ],
    stove: [ [ "flame", 3 ], [ "soot", 4 ], [ "grease", 3 ], [ "magnet", 2 ] ],
    water: [ [ "drop", 5 ], [ "drops", 5 ], [ "tally", 2 ], [ "bluet", 2 ] ],
    garden: [ [ "leaf", 4 ], [ "soil", 5 ], [ "seeds", 2 ], [ "string", 2 ] ],
    fishGrill: [ [ "soot", 4 ], [ "fish", 3 ], [ "burn", 3 ] ],
    look: [ [ "pin", 4 ], [ "button", 5 ], [ "size", 3 ], [ "measure", 2 ], [ "stitchX", 3 ], [ "tapeM", 2 ] ],
    result: [ [ "blood", 2 ], [ "ring", 2 ] ],
    wipe: [ [ "blood", 2 ] ],
    ask: [ [ "warn", 5 ], [ "redt", 3 ], [ "hazardS", 3 ], [ "noEntry", 2 ] ],
    detail: [ [ "barcode", 3 ], [ "stamp", 3 ], [ "serial", 2 ] ],
    parts: [ [ "bolts", 4 ], [ "nuts", 3 ], [ "spring", 3 ], [ "grease", 2 ] ],
    coop: [ [ "radio", 3 ], [ "dymoCall", 5 ] ],
    queue: [ [ "radio", 3 ], [ "dymoCall", 4 ] ],
    keys: [ [ "dymo", 3 ] ],
    sound: [ [ "speakerS", 3 ], [ "dymo", 3 ] ],
    screen: [ [ "dymo", 3 ] ],
    story: [ [ "photo", 3 ], [ "string", 3 ], [ "tack", 3 ], [ "note", 3 ] ],
    talk: [ [ "photo", 1 ], [ "note", 2 ] ],
    deco: [ [ "swatch", 4 ], [ "measure", 3 ] ],
    help: [ [ "sticky", 3 ], [ "note", 2 ] ],
    course: [ [ "star", 3 ], [ "tally", 3 ] ],
    feedback: [ [ "sticky", 3 ], [ "pen", 2 ] ]
  };
  const BAND = {
    steel: [ [ "rivetB", 4 ], [ "dymo", 2 ], [ "serial", 2 ], [ "barcode", 2 ], [ "stencil", 2 ], [ "tapeH", 2 ], [ "redt", 1 ], [ "led", 2 ], [ "bolts", 2 ], [ "warnS", 1 ], [ "weldS", 2 ] ],
    metal: [ [ "rivetB", 4 ], [ "serial", 2 ], [ "barcode", 2 ], [ "stencil", 2 ], [ "tapeH", 2 ], [ "led", 1 ], [ "bolts", 2 ], [ "weldS", 2 ] ],
    radio: [ [ "rivetB", 3 ], [ "dymo", 4 ], [ "serial", 1 ], [ "led", 3 ], [ "ventS", 3 ], [ "tapeM", 1 ], [ "bolts", 2 ], [ "ticksB", 2 ] ],
    wood: [ [ "nails", 4 ], [ "carve", 2 ], [ "knot", 3 ], [ "chalk", 2 ], [ "tack", 2 ], [ "tapeM", 2 ] ],
    report: [ [ "staple", 3 ], [ "tack", 3 ], [ "tapeM", 3 ], [ "ring", 1 ], [ "pen", 1 ] ],
    hud: [ [ "rivetB", 3 ], [ "tapeM", 2 ], [ "ticks", 2 ] ]
  };
  const KIND_ONLY = {
    look: [ [ "pin", 4 ], [ "button", 5 ], [ "size", 3 ], [ "measure", 2 ], [ "stitchX", 3 ], [ "tapeM", 2 ], [ "thread", 3 ], [ "tailor", 3 ], [ "sticky", 1 ], [ "swatch", 2 ], [ "tack", 1 ] ],
    result: [ [ "ring", 3 ], [ "stamp", 2 ], [ "note", 2 ], [ "sticky", 2 ], [ "clip", 2 ], [ "tally", 2 ], [ "mSmiley", 1 ], [ "chalk", 1 ], [ "blood", 2 ], [ "print", 2 ], [ "tapeM", 3 ], [ "staple", 3 ], [ "photo", 1 ], [ "pen", 2 ], [ "tack", 2 ] ],
    wipe: [ [ "ring", 3 ], [ "note", 2 ], [ "sticky", 2 ], [ "clip", 2 ], [ "blood", 2 ], [ "print", 2 ], [ "tapeM", 3 ], [ "staple", 3 ], [ "pen", 2 ] ],
    ask: [ [ "warnS", 3 ], [ "redt", 2 ], [ "hazardS", 2 ], [ "rivetB", 4 ], [ "bolts", 2 ], [ "tapeH", 2 ], [ "claw", 1 ], [ "serial", 1 ] ],
    keys: [ [ "rivetB", 5 ], [ "bolts", 3 ], [ "tapeH", 2 ], [ "tapeM", 2 ], [ "sticky", 1 ], [ "claw", 1 ], [ "ventS", 2 ], [ "weldS", 2 ], [ "tie", 1 ], [ "mSmiley", 1 ] ],
    sound: [ [ "rivetB", 5 ], [ "bolts", 3 ], [ "tapeH", 2 ], [ "tapeM", 2 ], [ "sticky", 1 ], [ "ventS", 3 ], [ "speakerS", 2 ], [ "weldS", 2 ], [ "tie", 1 ] ],
    screen: [ [ "rivetB", 5 ], [ "bolts", 3 ], [ "tapeH", 2 ], [ "tapeM", 2 ], [ "sticky", 1 ], [ "ventS", 2 ], [ "weldS", 2 ], [ "tie", 1 ], [ "claw", 1 ] ],
    help: [ [ "rivetB", 5 ], [ "bolts", 2 ], [ "tapeM", 2 ], [ "sticky", 2 ], [ "note", 1 ], [ "ventS", 2 ], [ "weldS", 1 ] ],
    feedback: [ [ "rivetB", 4 ], [ "bolts", 2 ], [ "tapeM", 2 ], [ "sticky", 2 ], [ "note", 2 ], [ "pencil", 2 ], [ "ventS", 2 ] ],
    garden: [ [ "leaf", 4 ], [ "soil", 5 ], [ "seeds", 2 ], [ "string", 2 ], [ "nails", 3 ], [ "knot", 2 ], [ "tapeM", 2 ], [ "note", 2 ], [ "tally", 2 ], [ "chalk", 2 ] ]
  };
  const KIND_BAND = {
    look: [ [ "pin", 4 ], [ "button", 4 ], [ "size", 2 ], [ "tapeM", 2 ], [ "thread", 3 ], [ "tailor", 2 ] ],
    result: [ [ "staple", 3 ], [ "tack", 3 ], [ "tapeM", 3 ], [ "pen", 2 ], [ "ring", 1 ] ]
  };
  const DENS = {
    result: .5,
    wipe: .5,
    ask: .6,
    detail: .6,
    help: .55,
    feedback: .6,
    story: .62,
    talk: .62,
    keys: .6,
    look: .6,
    course: .6
  };
  const CAP = {
    blood: 2,
    photo: 2,
    skull: 1,
    heart: 1,
    bio: 2,
    noEntry: 1,
    star: 2,
    smile: 2,
    speakerS: 1,
    scale: 1,
    target: 3,
    magnet: 4,
    led: 3,
    stencil: 3,
    tally: 3,
    dymo: 3,
    dymoCall: 2,
    stamp: 2,
    serial: 2,
    barcode: 2,
    warn: 2,
    warnS: 2,
    radio: 1,
    claw: 2,
    hole: 3,
    peg: 2,
    rivetB: 6,
    nails: 4,
    bolts: 4,
    button: 4,
    pin: 3
  };
  const LABELY = {
    dymo: 1,
    dymoCall: 1,
    serial: 1,
    stamp: 1,
    stencil: 1,
    blood: 1,
    size: 1,
    warn: 1,
    warnS: 1,
    tally: 1,
    barcode: 1,
    bio: 1,
    skull: 1,
    star: 1,
    smile: 1,
    heart: 1,
    noEntry: 1,
    flame: 1,
    target: 1,
    drop: 1,
    radio: 1
  };
  const DYMO = {
    steel: [ "MINE", "KEEP", "B-07", "AMMO", "MED", "BAG", "NO.3", "FOOD", "H2O" ],
    radio: [ "CH2", "SET", "VOL", "MIC", "TX", "RX", "SQL", "PWR", "CH-9", "FREQ" ],
    metal: [ "OK", "CHK", "NO.7", "SN", "QC" ],
    report: [ "OK" ],
    wood: [ "KEEP" ],
    hud: [ "DECO" ]
  };
  const CALL = [ "ALPHA", "BRAVO", "TEAM2", "ECHO", "SOS", "CH-7", "BASE" ];
  const STEN = {
    steel: [ "07", "B-3", "A12", "NO.4", "LOT 9", "K-21", "33", "C-07", "UP ^", "X2" ],
    radio: [ "CH 2", "A-1", "07", "MIC", "R-12" ],
    metal: [ "NO.1", "07", "QC", "A-3" ],
    wood: [ "KEEP", "07" ],
    report: [ "NO." ],
    hud: [ "1:20" ]
  };
  const BIG = {
    steel: [ "vent", "dataPlate", "holder", "bigSten", "noteSet", "plateSet", "hazard" ],
    wood: [ "noteSet", "photoSet", "carveSet", "chalkSet" ],
    radio: [ "grille", "speaker", "scale", "dataPlate", "dymoSet", "vent" ],
    report: [ "noteSet", "stampSet", "photoSet", "doodleSet" ],
    metal: [ "dataPlate", "plateSet", "noteSet", "vent", "bigSten" ],
    hud: [ "swatchSet", "noteSet" ]
  };
  const KIND_BIG = {
    keys: [ "vent", "grille", "speaker" ],
    sound: [ "speaker", "grille", "vent" ],
    screen: [ "vent", "grille" ],
    help: [ "vent", "noteSet" ],
    feedback: [ "noteSet", "grille" ],
    craft: [ "peg", "peg", "plateSet" ],
    cook: [ "magnetSet", "noteSet" ],
    stove: [ "magnetSet", "noteSet" ],
    water: [ "noteSet", "dropSet" ],
    garden: [ "seedSet", "noteSet" ],
    range: [ "targetSet", "bigSten" ],
    look: [ "sewSet", "measureSet" ],
    inv: [ "bigSten", "noteSet", "photoSet" ],
    story: [ "photoSet", "noteSet" ],
    result: [ "stampSet", "noteSet" ]
  };
  const SOLID_TAG = /^(BUTTON|INPUT|SELECT|TEXTAREA|A|LABEL|CANVAS|IMG|SVG|VIDEO|KBD|PROGRESS|METER|TABLE)$/;
  const SOLID_SEL = ".grid,.slot,.it,[data-tip],[data-close],[onclick],.bar,.netScr,.rigArt,.swatch,.cb,.wtDrop,.gauge,.need,.pin";
  const CURSOR = /pointer|grab|move|crosshair|text/;
  const SCROLL_LIST = "#decoBody";
  function measure(w, P) {
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 2;
    const wr = w.getBoundingClientRect(), bl = w.clientLeft, bt = w.clientTop;
    const Wi = Math.ceil(w.clientWidth / u - .01), Hi = Math.ceil(w.clientHeight / u - .01), W = Wi + P * 2, H = Hi + P * 2;
    const ox = wr.left + bl - P * u, oy = wr.top + bt - P * u;
    const occ = new Uint8Array(W * H), surf = new Uint8Array(W * H), surfs = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      occ[y * W + x] = d >= P ? 0 : d === P - 1 ? 5 : d >= 1 ? 3 : 4;
    }
    const box = (r, m) => {
      const x0 = Math.floor((r.left - ox) / u) - m, x1 = Math.ceil((r.right - ox) / u) + m, y0 = Math.floor((r.top - oy) / u) - m, y1 = Math.ceil((r.bottom - oy) / u) + m;
      return [ Math.max(P, x0), Math.max(P, y0), Math.min(P + Wi, x1), Math.min(P + Hi, y1) ];
    };
    const block = (r, m) => {
      const [x0, y0, x1, y1] = box(r, m);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) occ[y * W + x] = 1;
    };
    const texts = [], txt = r => {
      const q = box(r, 0);
      if (q[2] > q[0] && q[3] > q[1]) texts.push(q);
    };
    const fc = css2hex(getComputedStyle(w).backgroundColor) || "#191b20";
    surfs.push({
      col: fc,
      kind: "face",
      r: [ P, P, P + Wi, P + Hi ],
      el: w
    });
    const rg = document.createRange();
    const walk = el => {
      for (const c of el.childNodes) {
        if (c.nodeType === 3) {
          if (!c.nodeValue.trim()) continue;
          rg.selectNodeContents(c);
          for (const r of rg.getClientRects()) if (r.width > .5) {
            block(r, 2);
            txt(r);
          }
          continue;
        }
        if (c.nodeType !== 1 || c.classList.contains("dzLay")) continue;
        const rs = c.getClientRects();
        if (!rs.length) continue;
        const cs = getComputedStyle(c);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
        const r = c.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) {
          continue;
        }
        const scroll = /(auto|scroll)/.test(cs.overflowY) && (c.scrollHeight > c.clientHeight + 1 || c.matches(SCROLL_LIST)) || /(auto|scroll)/.test(cs.overflowX) && c.scrollWidth > c.clientWidth + 1;
        const leaf = !c.firstElementChild, visBox = cs.backgroundImage !== "none" || !!css2hex(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none";
        if (SOLID_TAG.test(c.tagName) || c.matches(SOLID_SEL) || scroll || leaf && visBox && !c.textContent.trim() && r.width * r.height < 4e4 || CURSOR.test(cs.cursor)) {
          block(r, 1);
          if (scroll || /^(INPUT|TEXTAREA|SELECT)$/.test(c.tagName) || c.textContent.trim()) txt(r);
          continue;
        }
        if (cs.content && cs.content !== "normal" && cs.content !== "none") {
          block(r, 1);
          continue;
        }
        const bg = css2hex(cs.backgroundColor);
        if (bg && surfs.length < 250 && r.width > 4 * u && r.height > 3 * u) {
          const [x0, y0, x1, y1] = box(r, 0);
          const k = surfs.length;
          surfs.push({
            col: bg,
            kind: c.tagName === "HEADER" || c.classList.contains("tabs") ? "band" : c.classList.contains("box") ? "box" : c.classList.contains("li") ? "row" : "panel",
            r: [ x0, y0, x1, y1 ],
            el: c
          });
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) surf[y * W + x] = k;
        }
        walk(c);
      }
    };
    walk(w);
    return {
      u,
      W,
      H,
      P,
      Wi,
      Hi,
      ox,
      oy,
      occ,
      surf,
      surfs,
      texts
    };
  }
  function plan(w, kind, G) {
    const {W, H, P, occ, surf, surfs} = G, mat = MAT_OF(w, kind), seed = hash("dz|" + kind + "|" + mat + "|" + (w.id || "") + "|" + [ ...w.classList ].join(".")), R0 = rng(seed);
    const usedT = new Set, pickT = (R, L) => {
      const f = L.filter(t => !usedT.has(t));
      const t = R.pick(f.length ? f : L);
      usedT.add(t);
      return t;
    };
    const buf = new Uint32Array(W * H), used = new Uint8Array(W * H), leds = [];
    const own = new Int32Array(W * H).fill(-1), under = new Uint32Array(W * H), uown = new Int32Array(W * H).fill(-1), ops = [];
    let cur = -1, depth = 0, loose = -1;
    const beg = t => {
      if (depth++ === 0) {
        cur = ops.length;
        ops.push({
          t
        });
      }
    }, end = () => {
      depth--;
    };
    const wr = (i, c) => {
      const o = depth ? cur : loose < 0 ? loose = ops.push({
        t: "m:loose"
      }) - 1 : loose;
      if (own[i] !== o) {
        under[i] = buf[i];
        uown[i] = own[i];
      }
      buf[i] = c;
      own[i] = o;
    };
    const prevCTX = CTX;
    CTX = {
      beg,
      end
    };
    const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && occ[y * W + x] === 0;
    const bgAt = (x, y) => surfs[surf[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))]].col;
    const put = (x, y, c) => {
      if (!c || !free(x, y) || used[y * W + x] === 2) return;
      wr(y * W + x, c32(c));
    };
    const putF = (x, y, c) => {
      if (!c || x < 0 || y < 0 || x >= W || y >= H) return;
      const o = occ[y * W + x];
      if (o !== 3 || used[y * W + x] === 2) return;
      wr(y * W + x, c32(c));
    };
    const sat = new Int32Array((W + 1) * (H + 1));
    const reSat = () => {
      for (let y = 0; y < H; y++) {
        let row = 0;
        for (let x = 0; x < W; x++) {
          row += occ[y * W + x] === 0 && !used[y * W + x] ? 1 : 0;
          sat[(y + 1) * (W + 1) + x + 1] = sat[y * (W + 1) + x + 1] + row;
        }
      }
    };
    const cnt = (x, y, w0, h0) => {
      if (x < 0 || y < 0 || x + w0 > W || y + h0 > H) return -1;
      const A = W + 1;
      return sat[(y + h0) * A + x + w0] - sat[y * A + x + w0] - sat[(y + h0) * A + x] + sat[y * A + x];
    };
    const fits = (x, y, w0, h0, g) => {
      if (cnt(x - g, y - g, w0 + g * 2, h0 + g * 2) !== (w0 + g * 2) * (h0 + g * 2)) return false;
      for (let j = y - g; j < y + h0 + g; j++) for (let i = x - g; i < x + w0 + g; i++) if (used[j * W + i]) return false;
      return true;
    };
    const stamp = function(s, x0, y0, allow) {
      beg("s:" + (s.k || "spr"));
      for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
        const c = s.c[y * s.w + x];
        if (!c) continue;
        const X = x0 + x, Y = y0 + y;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const o = occ[Y * W + X];
        if (o === 1 || o === 4 && !allow) continue;
        wr(Y * W + X, c32(c));
        used[Y * W + X] = 2;
      }
      end();
    };
    const reserve = function(x0, y0, w0, h0, g) {
      for (let y = y0 - g; y < y0 + h0 + g; y++) for (let x = x0 - g; x < x0 + w0 + g; x++) if (x >= 0 && y >= 0 && x < W && y < H && !used[y * W + x]) used[y * W + x] = 1;
    };
    const place = (s, x, y) => {
      stamp(s, x, y);
      reserve(x, y, s.w, s.h, 1);
    };
    const T = P - 1;
    if (T >= 5) frameBand();
    function frameBand() {
      const R = rng(seed ^ 1311), edges = [ [ "t", W ], [ "b", W ], [ "l", H ], [ "r", H ] ];
      const at = (e, t, s, inset) => {
        const off = inset == null ? Math.max(0, Math.round((T + 1 - (e === "t" || e === "b" ? s.h : s.w)) / 2)) : inset;
        return e === "t" ? [ t, off ] : e === "b" ? [ t, H - off - s.h ] : e === "l" ? [ off, t ] : [ W - off - s.w, t ];
      };
      const okF = (x, y, s) => {
        for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
          if (!s.c[j * s.w + i]) continue;
          const X = x + i, Y = y + j;
          if (X < 0 || Y < 0 || X >= W || Y >= H) return false;
          const o = occ[Y * W + X];
          if (o === 1 || used[Y * W + X]) return false;
        }
        return true;
      };
      const LIST = {
        steel: [ [ "sticker", 4 ], [ "tape", 4 ], [ "barcode", 2 ], [ "rust", 4 ], [ "tie", 3 ], [ "sten", 2 ], [ "screw", 3 ], [ "scratch", 4 ], [ "chip", 3 ], [ "blood", 1 ], [ "dymo", 1 ], [ "magnet", 1 ] ],
        metal: [ [ "sticker", 3 ], [ "tape", 4 ], [ "barcode", 2 ], [ "rust", 2 ], [ "tie", 2 ], [ "screw", 3 ], [ "scratch", 4 ], [ "chip", 3 ], [ "dymo", 1 ] ],
        wood: [ [ "nail", 5 ], [ "tapeM", 3 ], [ "knot", 3 ], [ "burn", 2 ], [ "chalk", 3 ], [ "carve", 2 ], [ "tack", 2 ], [ "twine", 3 ], [ "scratch", 3 ] ],
        radio: [ [ "dymo", 4 ], [ "tape", 3 ], [ "sticker", 2 ], [ "screw", 3 ], [ "tie", 3 ], [ "chip", 4 ], [ "scratch", 3 ], [ "barcode", 1 ], [ "led", 2 ], [ "sten", 1 ] ],
        report: [ [ "tapeM", 4 ], [ "staple", 3 ], [ "ring", 2 ], [ "scratch", 3 ], [ "tack", 3 ], [ "stampM", 2 ], [ "sticker", 1 ], [ "chip", 2 ] ]
      }[mat] || [];
      if (!LIST.length) return;
      const nK = {}, capF = {
        sticker: 4,
        blood: 1,
        dymo: 2,
        magnet: 1,
        led: 2,
        barcode: 2,
        sten: 2,
        stampM: 1
      };
      if (mat === "steel" && (kind === "inv" || kind === "loadout")) {
        const s = S.padlock(R), x = W - s.w - 1, y = (H >> 1) - 5;
        if (okF(x, y, s)) {
          stamp(s, x, y, true);
          reserve(x, y, s.w, s.h, 2);
        }
      }
      for (const [e, L] of edges) {
        let t = 12 + R.i(10);
        while (t < L - 14) {
          let k = R.w(LIST);
          const hz = e === "t" || e === "b";
          if ((nK[k] = (nK[k] | 0) + 1) > (capF[k] || 99)) k = R.ch(.5) ? "scratch" : "chip";
          let s = null, flat = null;
          if (k === "sticker") s = R.pick([ S.warnS, S.smileS, S.skullS, S.starS, S.heartS, S.noS, S.crossS ])(R); else if (k === "tape" || k === "tapeM") {
            const p = k === "tapeM" ? PAL.mask : PAL[R.pick([ "duct", "duct", "redt", "mask", "yelt" ])];
            s = S.tape(R, T + 2, R.r(3, 4), p, hz);
          } else if (k === "barcode") s = S.barcode(R, 9); else if (k === "tie") s = S.tie(R, mat === "radio" ? R.pick([ "black", "nylon" ]) : null); else if (k === "screw") s = R.ch(.5) ? S.screw(R, mat === "radio" ? PAL.olive : PAL.steel) : S.bolt(R); else if (k === "nail") s = S.nail(R); else if (k === "tack") s = S.tack(R); else if (k === "staple") s = S.stamp(R); else if (k === "magnet") s = S.magnet(R); else if (k === "dymo") {
            const t0 = pickT(R, DYMO[mat] || DYMO.metal);
            if (tw(t0) + 6 < 30) s = S.dymo(R, t0, mat === "radio" ? R.pick([ "black", "yelt" ]) : null);
          } else if (k === "blood") s = S.blood(R); else if (k === "led") s = ledSpr(R); else flat = k;
          if (s && !hz && (k === "dymo" || k === "barcode" || k === "blood")) s = rot(s);
          if (s) {
            const [x, y] = at(e, t, s, k === "tape" || k === "tapeM" ? 0 : null);
            if (okF(x, y, s)) {
              stamp(s, x, y, true);
              reserve(x, y, s.w, s.h, 1);
              if (k === "led") leds.push(Object.assign(ledAt(R, x, y), {
                op: ops.length - 1
              }));
              t += (hz ? s.w : s.h) + R.r(20, 42);
              continue;
            }
            t += 5;
            continue;
          }
          const [bx, by] = at(e, t, {
            w: 6,
            h: 6
          }, 1), fb = frameCol(mat);
          if (flat === "rust") {
            M.rust(putF, R, bx, by, fb, hz ? R.r(3, 7) : 4, hz ? 4 : R.r(4, 7));
            if (e === "t" || hz) M.drip(putF, R, bx + 2, by + 3, fb);
          } else if (flat === "scratch") M.scratch(putF, R, bx, by + 1, fb, R.r(3, 6)); else if (flat === "chip") {
            for (let i = 0; i < R.r(2, 4); i++) M.chip(putF, R, bx + R.i(6), by + R.i(4), fb, mat);
          } else if (flat === "knot") M.knot(putF, R, bx + 1, by + 1, fb); else if (flat === "burn") M.burn(putF, R, bx, by, fb); else if (flat === "chalk") M.chalk(putF, R, bx, by, fb, R.pick([ "x", "check", "arrow" ])); else if (flat === "carve") M.carve(putF, R, bx, by, fb); else if (flat === "ring") M.ring(putF, R, bx - 1, by - 1, fb); else if (flat === "sten" && hz) M.stencil(putF, R, bx, by, fb, String(R.r(1, 99)).padStart(2, "0"), "#d8d0a8"); else if (flat === "stampM") M.stencil(putF, R, bx, by, fb, "OK", "#a83a2e"); else if (flat === "twine") {
            beg("m:twine");
            for (let i = 0; i < T; i++) for (let k2 = 0; k2 < 2; k2++) {
              const X = hz ? bx + k2 + i % 2 : bx - 1 + i, Y = hz ? by - 1 + i : by + k2 + i % 2;
              putF(X, Y, i % 2 ? "#8a7a52" : "#a8986c");
            }
            end();
          }
          t += R.r(12, 28);
        }
      }
    }
    function frameCol(m) {
      return {
        steel: "#323d48",
        metal: "#353b44",
        wood: "#4e331c",
        radio: "#3b3e2a",
        report: "#503823",
        hud: "#30353d"
      }[m] || "#353b44";
    }
    const PR = DZ.prof = {
      t: performance.now()
    }, lap = k => {
      const t = performance.now();
      PR[k] = +(t - PR.t).toFixed(2);
      PR.t = t;
    };
    lap("frame");
    reSat();
    const rects = bigRects();
    lap("rects");
    function bigRects() {
      const B = 3, CW = Math.floor(W / B), CH = Math.floor(H / B), fr = new Uint8Array(CW * CH), h = new Int32Array(CW), out = [], st = new Int32Array((CW + 1) * 2);
      for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) fr[cy * CW + cx] = cnt(cx * B, cy * B, B, B) === B * B ? 1 : 0;
      const MH = 4, MW = 8;
      for (let pass = 0; pass < 14; pass++) {
        let best = null;
        h.fill(0);
        for (let y = 0; y < CH; y++) {
          for (let x = 0; x < CW; x++) h[x] = fr[y * CW + x] ? h[x] + 1 : 0;
          let sp = 0;
          for (let x = 0; x <= CW; x++) {
            const hh = x < CW ? h[x] : 0;
            let start = x;
            while (sp && st[(sp - 1) * 2 + 1] >= hh) {
              sp--;
              const sx = st[sp * 2], sh = st[sp * 2 + 1], ar = sh * (x - sx);
              if (sh >= MH && x - sx >= MW && (!best || ar > best.a)) best = {
                a: ar,
                x: sx,
                y: y - sh + 1,
                w: x - sx,
                h: sh
              };
              start = sx;
            }
            st[sp * 2] = start;
            st[sp * 2 + 1] = hh;
            sp++;
          }
        }
        if (!best) break;
        for (let y = best.y; y < best.y + best.h; y++) for (let x = best.x; x < best.x + best.w; x++) fr[y * CW + x] = 0;
        out.push({
          x: best.x * B,
          y: best.y * B,
          w: best.w * B,
          h: best.h * B,
          a: best.a * B * B
        });
      }
      return out;
    }
    const kb = KIND_BIG[kindKey(kind)] || [], bl = BIG[mat] || BIG.metal, nB = {};
    let nBig = 0;
    const CAPB = {
      peg: 2,
      vent: 2,
      dataPlate: 2,
      bigSten: 2,
      noteSet: 2
    };
    for (const [i, r] of rects.entries()) {
      const R = rng(seed ^ hash("big" + i + "|" + r.w + "x" + r.h)), bg = bgAt(r.x + (r.w >> 1), r.y + (r.h >> 1));
      const tex = mat === "steel" || mat === "metal" ? R.ch(.5) ? "checker" : "brush" : mat === "wood" ? "grain" : mat === "radio" ? "crinkle" : mat === "report" ? "fiber" : "brush";
      if (r.w * r.h > 900) M[tex](put, R, r.x + 1, r.y + 1, r.w - 2, r.h - 2, bg);
      const n = Math.max(1, Math.min(3, Math.floor(r.w * r.h / 1400)));
      for (let k = 0; k < n && nBig < 7; k++) {
        let kind2 = null;
        for (let a = 0; a < 6; a++) {
          const q = kb.length && (KIND_ONLY[kindKey(kind)] || R.ch(.6)) ? R.pick(kb) : R.pick(bl);
          if ((nB[q] | 0) < (CAPB[q] || 1)) {
            kind2 = q;
            break;
          }
        }
        if (!kind2) continue;
        nB[kind2] = (nB[kind2] | 0) + 1;
        nBig++;
        bigOne(R, kind2, r, bg);
      }
    }
    function bigOne(R, k, r, bg) {
      const one = (X, Y, w0, h0) => {
        const a0 = surf[Y * W + X];
        return surf[Y * W + X + w0 - 1] === a0 && surf[(Y + h0 - 1) * W + X] === a0 && surf[(Y + h0 - 1) * W + X + w0 - 1] === a0;
      };
      const tries = s => {
        for (let a = 0; a < 24; a++) {
          const x = r.x + 1 + R.i(Math.max(1, r.w - s.w - 1)), y = r.y + 1 + R.i(Math.max(1, r.h - s.h - 1));
          if (fits(x, y, s.w, s.h, 3) && one(x, y, s.w, s.h)) {
            place(s, x, y);
            return [ x, y ];
          }
        }
        return null;
      };
      const mw = Math.min(r.w - 4, 46), mh = Math.min(r.h - 4, 26);
      if (k === "vent") return tries(S.vent(R, Math.max(14, Math.min(mw, R.r(18, 34))), Math.max(9, Math.min(mh, R.r(10, 16))), mat === "radio" ? PAL.olive : PAL.steel));
      if (k === "grille") return tries(S.grille(R, Math.max(14, Math.min(mw, R.r(18, 30))), Math.max(9, Math.min(mh, R.r(10, 16)))));
      if (k === "speaker") {
        const d = Math.max(9, Math.min(mh, 15));
        return tries(S.speaker(R, d));
      }
      if (k === "dataPlate") return tries(S.dataPlate(R, mat === "radio" ? PAL.olive : PAL.zinc));
      if (k === "holder") return tries(S.holder(R, Math.min(mw, R.r(16, 24))));
      if (k === "scale") return tries(S.scale(R, Math.min(mw, R.r(30, 44))));
      if (k === "peg") {
        const s = S.peg(R, Math.max(16, Math.min(r.w - 4, R.r(28, 52))), Math.max(12, Math.min(r.h - 4, R.r(14, 20))));
        return tries(s);
      }
      if (k === "bigSten") {
        const t = R.pick([ "07", "B3", "12", "A4", "K9", "21", "X" ]), sc = r.h >= 16 ? 2 : 1, w0 = tw(t) * sc, h0 = 5 * sc;
        for (let a = 0; a < 12; a++) {
          const x = r.x + 2 + R.i(Math.max(1, r.w - w0 - 3)), y = r.y + 2 + R.i(Math.max(1, r.h - h0 - 3));
          if (fits(x, y, w0, h0, 4)) {
            M.stencil(put, R, x, y, bg, t, mat === "steel" ? "#d8c070" : null, sc);
            reserve(x, y, w0, h0, 1);
            return;
          }
        }
        return;
      }
      if (k === "hazard") {
        const w0 = Math.min(r.w - 6, R.r(16, 30)), h0 = 3;
        const x = r.x + 3 + R.i(Math.max(1, r.w - w0 - 5)), y = r.y + r.h - 5;
        if (fits(x, y, w0, h0, 4)) {
          M.hazard(put, R, x, y, bg, w0, h0);
          reserve(x, y, w0, h0, 1);
        }
        return;
      }
      const set = L => {
        for (const f of L) {
          const s = f();
          if (s) tries(s);
        }
      };
      if (k === "noteSet") return set([ () => withPin(R, S.note(R, R.r(10, 15), R.r(9, 13))), () => R.ch(.6) ? S.sticky(R) : null, () => R.ch(.5) ? withPin(R, S.note(R, R.r(9, 13), R.r(8, 11))) : null ]);
      if (k === "photoSet") return set([ () => withPin(R, S.photo(R)), () => R.ch(.6) ? withPin(R, S.photo(R)) : null, () => R.ch(.5) ? S.sticky(R) : null ]);
      if (k === "plateSet") return set([ () => S.serial(R, null, PAL.zinc), () => S.barcode(R), () => R.ch(.5) ? S.warn(R) : S.bio(R) ]);
      if (k === "dymoSet") return set([ () => S.dymo(R, pickT(R, DYMO.radio)), () => S.dymo(R, pickT(R, DYMO.radio), "yelt"), () => S.dymo(R, pickT(R, DYMO.radio)) ]);
      if (k === "magnetSet") return set([ () => S.magnet(R), () => S.magnet(R), () => withMag(R, S.note(R, R.r(10, 13), R.r(10, 13), "list")), () => S.magnet(R) ]);
      if (k === "seedSet") return set([ () => S.seeds(R), () => S.seeds(R), () => S.leaf(R) ]);
      if (k === "dropSet") return set([ () => S.drop(R), () => S.drop(R), () => withPin(R, S.note(R, 10, 9, "tally")) ]);
      if (k === "targetSet") return set([ () => S.target(R), () => S.target(R), () => withPin(R, S.note(R, 12, 9, "tally")) ]);
      if (k === "sewSet") return set([ () => S.pin(R), () => S.button(R), () => S.button(R), () => S.size(R), () => S.pin(R) ]);
      if (k === "measureSet") return tries(S.measure(R, Math.min(r.w - 4, R.r(24, 44))));
      if (k === "swatchSet") return set([ () => S.swatch(R), () => S.swatch(R), () => S.pencil(R) ]);
      if (k === "stampSet") {
        for (let a = 0; a < 2; a++) {
          const t = R.pick([ "OK", "NO." + R.r(10, 99), "CHK", "A+" ]), w0 = tw(t) + 4, h0 = 9, x = r.x + 2 + R.i(Math.max(1, r.w - w0 - 3)), y = r.y + 2 + R.i(Math.max(1, r.h - h0 - 3));
          if (fits(x, y, w0, h0, 4)) {
            inkStamp(x, y, w0, h0, t, bg, R);
            reserve(x, y, w0, h0, 1);
          }
        }
        return;
      }
      if (k === "doodleSet") {
        for (let a = 0; a < 3; a++) {
          const x = r.x + 2 + R.i(Math.max(1, r.w - 10)), y = r.y + 2 + R.i(Math.max(1, r.h - 8));
          if (fits(x, y, 8, 6, 3)) {
            R.ch(.5) ? M.smiley(put, R, x, y, bg) : M.chalk(put, R, x, y, bg, R.pick([ "circle", "x", "arrow", "check" ]));
            reserve(x, y, 8, 6, 1);
          }
        }
        return;
      }
      if (k === "carveSet" || k === "chalkSet") {
        for (let a = 0; a < 3; a++) {
          const x = r.x + 2 + R.i(Math.max(1, r.w - 12)), y = r.y + 2 + R.i(Math.max(1, r.h - 8));
          if (fits(x, y, 10, 6, 3)) {
            if (k === "carveSet") (R.ch(.5) ? M.carve : M.knot)(put, R, x, y, bg); else M.chalk(put, R, x, y, bg, R.pick([ "circle", "x", "arrow", "check" ]));
            reserve(x, y, 10, 6, 1);
          }
        }
        return;
      }
      return tries(S.note(R, 12, 10));
    }
    function withPin(R, s) {
      const n = new Spr(s.w, s.h + 2);
      n.k = s.k;
      over(n, s, 0, 2);
      if (R.ch(.55)) {
        const t = S.tack(R);
        over(n, t, (s.w >> 1) - 2, 0);
      } else {
        const t = S.tape(R, Math.min(s.w - 2, 8), 3, PAL.mask, false);
        over(n, t, s.w - t.w >> 1, 0);
      }
      return n;
    }
    function withMag(R, s) {
      const n = new Spr(s.w, s.h + 3);
      n.k = "magnote";
      over(n, s, 0, 3);
      over(n, S.magnet(R), (s.w >> 1) - 3, 0);
      return n;
    }
    function inkStamp(x, y, w0, h0, t, bg, R) {
      beg("m:ink");
      inkStamp0(x, y, w0, h0, t, bg, R);
      end();
    }
    function inkStamp0(x, y, w0, h0, t, bg, R) {
      const c = mix(bg, R.pick([ "#a83a2e", "#3c5c8a" ]), .6), P2 = (a, b) => {
        if (R() > .12) put(x + a, y + b, c);
      };
      for (let i = 0; i < w0; i++) {
        P2(i, 0);
        P2(i, h0 - 1);
      }
      for (let j = 0; j < h0; j++) {
        P2(0, j);
        P2(w0 - 1, j);
      }
      text((X, Y, C) => {
        if (R() > .1) put(X, Y, C);
      }, t, x + 2, y + 2, c);
    }
    lap("big");
    const kk = kindKey(kind), midL = KIND_ONLY[kk] ? KIND_ONLY[kk] : (MID[mat] || MID.metal).concat(KIND_MID[kk] || []), bandL = KIND_BAND[kk] || BAND[mat] || BAND.metal;
    const dens = DENS[kk] || .72, nM = {};
    const capOf = k => CAP[k] || 3;
    const TW = 32, TH = 22;
    for (let ty = 0; ty < H; ty += TH) for (let tx = 0; tx < W; tx += TW) {
      const nf = cnt(tx, ty, Math.min(TW, W - tx), Math.min(TH, H - ty));
      if (nf < 30) continue;
      const R = rng(seed ^ hash("t" + tx + "," + ty));
      let done = R() > dens;
      for (let a = 0; a < 10 && !done; a++) {
        const x = tx + R.i(TW), y = ty + R.i(TH);
        if (!free(x, y) || used[y * W + x]) continue;
        const sk = surfs[surf[y * W + x]], k = R.w(sk.kind === "band" ? bandL : midL), bg = bgAt(x, y);
        if ((nM[k] | 0) >= capOf(k)) continue;
        done = mid(R, k, x, y, bg, sk);
        if (done) nM[k] = (nM[k] | 0) + 1;
      }
      const n = R.r(0, 2);
      for (let i = 0; i < n; i++) {
        const x = tx + R.i(TW), y = ty + R.i(TH);
        if (!free(x, y) || used[y * W + x]) continue;
        const bg = bgAt(x, y), k = R.w(mat === "wood" ? [ [ "scratch", 3 ], [ "knotS", 1 ], [ "nail", 2 ], [ "crack", 2 ] ] : mat === "report" ? [ [ "scratch", 2 ], [ "fleck", 3 ], [ "ink", 2 ] ] : mat === "radio" ? [ [ "scratch", 3 ], [ "chip", 3 ], [ "rivet", 2 ], [ "fleck", 2 ] ] : [ [ "scratch", 4 ], [ "rivet", 2 ], [ "rustS", 2 ], [ "fleck", 2 ], [ "chip", 2 ] ]);
        if (k === "scratch") M.scratch(put, R, x, y, bg); else if (k === "rivet" || k === "nail") {
          const s = k === "nail" ? S.nail(R) : S.rivet(R, mat === "radio" ? PAL.olive : PAL.steel);
          if (fits(x, y, s.w, s.h, 1)) {
            place(s, x, y);
          }
        } else if (k === "rustS") M.rust(put, R, x, y, bg, 3, 3); else if (k === "fleck") {
          beg("m:fleck");
          put(x, y, lit(bg, .14));
          if (R.ch(.5)) put(x + 1, y + 1, lit(bg, .09));
          end();
        } else if (k === "chip") M.chip(put, R, x, y, bg, mat); else if (k === "knotS") M.knot(put, R, x, y, bg); else if (k === "crack") {
          beg("m:crack");
          let X = x;
          for (let j = 0; j < R.r(3, 7); j++) {
            put(X, y + j, drk(bg, .4));
            if (R() < .3) X += R.ch(.5) ? 1 : -1;
          }
          end();
        } else if (k === "ink") {
          beg("m:inkdot");
          put(x, y, mix(bg, "#3c5878", .5));
          put(x + 1, y, mix(bg, "#3c5878", .4));
          end();
        }
      }
    }
    function mid(R, k, x, y, bg, sk) {
      let s = null;
      const g = LABELY[k] ? sk && sk.kind === "band" ? 3 : 8 : 2, cross = /^tape|^redt|^bluet|string/.test(k);
      const one = (X, Y, w0, h0) => {
        if (cross) return true;
        const a0 = surf[Y * W + X];
        return surf[Y * W + X + w0 - 1] === a0 && surf[(Y + h0 - 1) * W + X] === a0 && surf[(Y + h0 - 1) * W + X + w0 - 1] === a0 && surf[(Y + (h0 >> 1)) * W + X + (w0 >> 1)] === a0;
      };
      const fitPlace = s2 => {
        for (let a = 0; a < 6; a++) {
          const X = x - R.i(s2.w), Y = y - R.i(s2.h);
          if (fits(X, Y, s2.w, s2.h, g) && one(X, Y, s2.w, s2.h)) {
            place(s2, X, Y);
            return [ X, Y ];
          }
        }
        return null;
      };
      const fitMark = (w0, h0, f) => {
        for (let a = 0; a < 6; a++) {
          const X = x - R.i(w0), Y = y - R.i(h0);
          if (fits(X, Y, w0, h0, g) && one(X, Y, w0, h0)) {
            beg("m:" + k);
            f(X, Y);
            end();
            reserve(X, Y, w0, h0, 1);
            return true;
          }
        }
        return false;
      };
      switch (k) {
       case "warn":
        s = S.warn(R);
        break;

       case "bio":
        s = S.bio(R);
        break;

       case "smile":
        s = S.smile(R);
        break;

       case "skull":
        s = S.skull(R);
        break;

       case "star":
        s = S.star(R);
        break;

       case "heart":
        s = S.heart(R);
        break;

       case "noEntry":
        s = S.noEntry(R);
        break;

       case "blood":
        s = S.blood(R);
        break;

       case "barcode":
        s = S.barcode(R);
        break;

       case "serial":
        s = S.serial(R, null, mat === "radio" ? PAL.olive : PAL.zinc);
        break;

       case "tapeH":
        s = S.tape(R, R.r(8, 16), R.r(3, 4), PAL[R.pick([ "duct", "duct", "mask" ])], false);
        break;

       case "tapeV":
        s = S.tape(R, R.r(7, 12), 3, PAL.duct, true);
        break;

       case "tapeM":
        s = S.tape(R, R.r(7, 13), 3, PAL.mask, R.ch(.3));
        break;

       case "redt":
        s = S.tape(R, R.r(6, 10), 3, PAL.redt, R.ch(.4));
        break;

       case "bluet":
        s = S.tape(R, R.r(6, 10), 3, PAL.bluet, R.ch(.4));
        break;

       case "magnet":
        s = S.magnet(R);
        break;

       case "note":
        s = withPin(R, S.note(R, R.r(9, 13), R.r(8, 11)));
        break;

       case "sticky":
        s = S.sticky(R);
        break;

       case "photo":
        s = withPin(R, S.photo(R));
        break;

       case "clip":
        s = S.clip(R);
        break;

       case "tie":
        s = S.tie(R);
        break;

       case "tack":
        s = S.tack(R);
        break;

       case "staple":
        s = S.stamp(R);
        break;

       case "coin":
        s = S.coin(R);
        break;

       case "key":
        s = S.key(R);
        break;

       case "dymo":
        s = S.dymo(R, pickT(R, DYMO[mat] || DYMO.metal));
        break;

       case "dymoCall":
        s = S.dymo(R, pickT(R, CALL), R.pick([ "black", "yelt", "red" ]));
        break;

       case "radio":
        s = S.radio(R);
        break;

       case "bolt2":
        s = S.bolt2(R);
        break;

       case "scale":
        s = S.scale(R, R.r(22, 30));
        break;

       case "target":
        s = S.target(R);
        break;

       case "casing":
        s = S.casing(R);
        break;

       case "drop":
        s = S.drop(R);
        break;

       case "flame":
        s = S.flame(R);
        break;

       case "leaf":
        s = S.leaf(R);
        break;

       case "fish":
        s = S.fish(R);
        break;

       case "seeds":
        s = S.seeds(R);
        break;

       case "pin":
        s = S.pin(R);
        break;

       case "button":
        s = S.button(R);
        break;

       case "size":
        s = S.size(R);
        break;

       case "measure":
        s = S.measure(R, R.r(14, 24));
        break;

       case "pencil":
       case "pen":
        s = S.pencil(R);
        break;

       case "swatch":
        s = S.swatch(R);
        break;

       case "spring":
        s = S.spring(R);
        break;

       case "speakerS":
        s = S.speaker(R, 9);
        break;

       case "warnS":
        s = S.warnS(R);
        break;

       case "rivetB":
        s = R.ch(.5) ? S.screw(R, mat === "radio" ? PAL.olive : PAL.steel) : S.rivet(R, mat === "radio" ? PAL.olive : PAL.steel);
        break;

       case "ventS":
        {
          const n = R.r(3, 5), w0 = n * 2 + 1;
          return fitMark(w0, 6, (X, Y) => {
            for (let i = 0; i < n; i++) for (let j = 0; j < 5; j++) {
              put(X + i * 2, Y + j, drk(bg, .45));
              put(X + i * 2 + 1, Y + j, lit(bg, .1));
            }
          });
        }

       case "ticksB":
        return fitMark(14, 3, (X, Y) => M.ticks(put, R, X, Y, bg, 14));

       case "weldS":
        {
          const L = R.r(10, 18);
          return fitMark(L, 1, (X, Y) => M.weld(put, R, X, Y, bg, L));
        }

       case "thread":
        {
          const L = R.r(8, 14);
          return fitMark(L, 4, (X, Y) => {
            let yy = 1;
            const c = mix(bg, R.pick([ "#c8b888", "#a83a2e", "#6a88b0" ]), .6);
            for (let i = 0; i < L; i++) {
              put(X + i, Y + yy, c);
              if (R() < .45) yy = Math.max(0, Math.min(3, yy + (R.ch(.5) ? 1 : -1)));
            }
          });
        }

       case "tailor":
        return fitMark(9, 5, (X, Y) => {
          const c = mix(bg, "#d8d4c4", .45);
          for (let i = 0; i < 9; i++) if (i % 3 !== 2) put(X + i, Y + 4, c);
          for (let i = 0; i < 3; i++) {
            put(X + 2 + i, Y + 2 - i, c);
            put(X + 6 - i, Y + 2 - i, c);
          }
          put(X + 3, Y + 2, c);
          put(X + 5, Y + 2, c);
        });

       case "bolts":
        {
          const n = new Spr(9, 6);
          n.k = "bolts";
          over(n, S.bolt(R), 0, 0);
          if (R.ch(.7)) over(n, S.nut(R), 5, 1);
          return !!fitPlace(n);
        }

       case "nuts":
        {
          const n = new Spr(10, 6);
          n.k = "nuts";
          over(n, S.nut(R), 0, 1);
          over(n, S.nut(R), 5, 0);
          return !!fitPlace(n);
        }

       case "nails":
        {
          const n = new Spr(9, 5);
          n.k = "nails";
          over(n, S.nail(R), 0, 0);
          if (R.ch(.6)) over(n, S.nail(R), 5, 1);
          return !!fitPlace(n);
        }

       case "led":
        {
          const q = fitPlace(ledSpr(R));
          if (q) leds.push(Object.assign(ledAt(R, q[0], q[1]), {
            op: ops.length - 1
          }));
          return !!q;
        }

       case "stencil":
        {
          const t = pickT(R, STEN[mat] || STEN.metal), w0 = tw(t);
          return fitMark(w0, 5, (X, Y) => M.stencil(put, R, X, Y, bg, t, mat === "steel" && R.ch(.5) ? "#d8c070" : null));
        }

       case "tally":
        {
          const nn = R.r(4, 13), w0 = Math.ceil(nn / 5) * 10;
          return fitMark(w0, 4, (X, Y) => M.tally(put, R, X, Y, bg, nn, mat === "steel" ? lit(bg, .2) : mix(bg, "#b8b4a4", .4)));
        }

       case "stamp":
        {
          const t = R.pick([ "OK", "NO." + R.r(1, 9), String(R.r(100, 999)), "QC" ]), w0 = tw(t) + 4;
          return fitMark(w0, 9, (X, Y) => inkStamp(X, Y, w0, 9, t, bg, R));
        }

       case "claw":
        return fitMark(10, 11, (X, Y) => M.claw(put, R, X, Y, bg));

       case "hole":
        return fitMark(6, 5, (X, Y) => M.hole(put, R, X, Y + 1, bg));

       case "mSmiley":
        return fitMark(5, 5, (X, Y) => M.smiley(put, R, X, Y, bg));

       case "carve":
        return fitMark(8, 6, (X, Y) => M.carve(put, R, X, Y, bg));

       case "knot":
        return fitMark(6, 3, (X, Y) => M.knot(put, R, X + 1, Y, bg));

       case "burn":
        return fitMark(7, 5, (X, Y) => M.burn(put, R, X, Y, bg));

       case "chalk":
        return fitMark(7, 5, (X, Y) => M.chalk(put, R, X, Y, bg, R.pick([ "x", "arrow", "check", "circle" ])));

       case "ring":
        return fitMark(9, 8, (X, Y) => M.ring(put, R, X, Y, bg));

       case "print":
        return fitMark(4, 5, (X, Y) => M.print(put, R, X, Y, bg));

       case "grease":
        return fitMark(7, 4, (X, Y) => M.grease(put, R, X, Y, bg));

       case "salt":
        return fitMark(8, 5, (X, Y) => M.salt(put, R, X, Y, bg));

       case "soot":
        return fitMark(8, 6, (X, Y) => M.soot(put, R, X, Y, bg, 8, 6));

       case "drops":
        return fitMark(8, 6, (X, Y) => M.drops(put, R, X, Y + 1, bg));

       case "soil":
        return fitMark(7, 4, (X, Y) => M.soil(put, R, X, Y, bg));

       case "ticks":
        return fitMark(16, 3, (X, Y) => M.ticks(put, R, X, Y, bg, 16));

       case "hazardS":
        return fitMark(14, 3, (X, Y) => M.hazard(put, R, X, Y, bg, 14, 3));

       case "string":
        {
          const L = R.r(12, 22);
          return fitMark(L, 7, (X, Y) => {
            M.string(put, R, X + 1, Y + 1, X + L - 2, Y + 1, mat === "wood" ? "#a83a2e" : "#8a7a52");
            stamp(S.tack(R, "red"), X - 1, Y - 1);
            stamp(S.tack(R, "red"), X + L - 3, Y - 1);
          });
        }

       case "stitchX":
        return fitMark(9, 4, (X, Y) => M.stitch(put, R, X, Y + 1, X + 8, Y + 1, lit(bg, .25)));

       default:
        return false;
      }
      return s ? !!fitPlace(s) : false;
    }
    lap("tiles");
    for (let i = 1; i < surfs.length; i++) {
      const sf = surfs[i], [x0, y0, x1, y1] = sf.r, w0 = x1 - x0, h0 = y1 - y0;
      if (w0 < 16 || h0 < 8 || sf.kind === "band" || sf.kind === "panel") continue;
      const R = rng(seed ^ hash("e" + i + "|" + w0 + "x" + h0)), bg = sf.col;
      for (let x = x0 + 3; x < x1 - 3; x += R.r(6, 16)) if (R() < .5) M.chip(put, R, x, R.ch(.5) ? y0 + 1 : y1 - 2, bg, mat);
      for (let y = y0 + 3; y < y1 - 3; y += R.r(6, 14)) if (R() < .35) M.chip(put, R, R.ch(.5) ? x0 + 1 : x1 - 3, y, bg, mat);
      M.dust(put, R, x0 + 1, y1 - 6, bg, Math.min(9, w0 >> 2), 5, 2);
      M.dust(put, R, x1 - 1 - Math.min(9, w0 >> 2), y1 - 6, bg, Math.min(9, w0 >> 2), 5, 3);
      if (R.ch(.6)) M.dust(put, R, x0 + 1, y0 + 1, bg, 6, 4, 0);
      M.grime(put, R, x0 + 1, y1 - 4, bg, w0 - 2, 3);
      const cloth = sf.el && sf.el.dataset && (sf.el.dataset.u === "Kr" || sf.el.dataset.u === "Kb" || sf.el.dataset.u === "Q") || kind === "look";
      if (cloth) {
        const c = mix(bg, "#c8b888", .4);
        M.stitch(put, R, x0 + 2, y0 + 2, x1 - 3, y0 + 2, c);
        M.stitch(put, R, x0 + 2, y1 - 3, x1 - 3, y1 - 3, c);
        M.stitch(put, R, x0 + 2, y0 + 2, x0 + 2, y1 - 3, c);
        M.stitch(put, R, x1 - 3, y0 + 2, x1 - 3, y1 - 3, c);
      }
    }
    {
      const R = rng(seed ^ 64206), bg = surfs[0].col, x0 = P, y0 = P, x1 = W - P, y1 = H - P;
      for (let x = x0 + 4; x < x1 - 4; x += R.r(5, 13)) if (R() < .55) M.chip(put, R, x, R.ch(.5) ? y0 : y1 - 1, bg, mat);
      for (let y = y0 + 4; y < y1 - 4; y += R.r(5, 13)) if (R() < .45) M.chip(put, R, R.ch(.5) ? x0 : x1 - 2, y, bg, mat);
      M.dust(put, R, x0, y1 - 8, bg, 12, 8, 2);
      M.dust(put, R, x1 - 12, y1 - 8, bg, 12, 8, 3);
      M.dust(put, R, x0, y0, bg, 8, 6, 0);
      M.dust(put, R, x1 - 8, y0, bg, 8, 6, 1);
    }
    lap("edges");
    CTX = prevCTX;
    const ks = keepOps(G, kind, mat, buf, own, under, uown, ops, leds);
    lap("keep");
    const vo = new Int32Array(W * H).fill(-1);
    for (let i = 0; i < buf.length; i++) if (buf[i]) vo[i] = ks.keepSet.has(own[i]) ? own[i] : uown[i];
    return {
      buf,
      vo,
      leds: leds.filter(L => ks.keepSet.has(L.op)),
      mat,
      rects: rects.length,
      nBefore: ks.nBefore,
      nAfter: ks.nAfter,
      cls: ks.cls,
      keep: ks.keep
    };
  }
  const LABELY_T = new Set([ "s:dymo", "s:serial", "s:blood", "s:barcode", "s:size", "s:dataPlate", "s:scale", "s:warn", "s:warnS", "s:bio", "s:skull", "s:skullS", "s:star", "s:starS", "s:smile", "s:smileS", "s:heart", "s:heartS", "s:noEntry", "s:noS", "s:cross", "s:crossS", "s:flame", "s:target", "s:drop", "s:radio", "m:stencil", "m:tally", "m:ink", "m:stamp", "m:carve", "m:chalk", "m:smiley", "m:mSmiley", "m:hazard", "m:hazardS", "m:print" ]);
  function keepOps(G, kind, mat, buf, own, under, uown, ops, leds) {
    const {W, H, P, occ} = G, kk = kindKey(kind), K = DZ.keepOf(kk), n = ops.length;
    const px = new Int32Array(n), x0 = new Int32Array(n).fill(1e9), y0 = new Int32Array(n).fill(1e9), x1 = new Int32Array(n).fill(-1), y1 = new Int32Array(n).fill(-1), inside = new Uint8Array(n);
    for (let i = 0; i < own.length; i++) {
      const o = own[i];
      if (o < 0) continue;
      px[o]++;
      const x = i % W, y = i / W | 0;
      if (x < x0[o]) x0[o] = x;
      if (y < y0[o]) y0[o] = y;
      if (x > x1[o]) x1[o] = x;
      if (y > y1[o]) y1[o] = y;
      if (occ[i] === 0) inside[o] = 1;
    }
    const live = [];
    for (let i = 0; i < n; i++) if (px[i] > 0) live.push(i);
    const out = {
      nBefore: live.length,
      nAfter: live.length,
      cls: K.cls,
      keep: K.keep,
      keepSet: new Set(live)
    };
    if (K.keep >= 1 && K.cls !== "read") return out;
    let cand = live, prio = null;
    if (K.cls === "read") {
      const near = new Uint8Array(W * H), g = READ_GAP;
      for (const [a, b, c, d] of G.texts) for (let y = Math.max(0, b - g); y < Math.min(H, d + g); y++) for (let x = Math.max(0, a - g); x < Math.min(W, c + g); x++) near[y * W + x] = 1;
      const bad = new Uint8Array(n), CZ = 28, inCorner = (x, y) => (x < P + CZ || x >= W - P - CZ) && (y < P + CZ || y >= H - P - CZ), ring = (x, y) => x < P + 3 || y < P + 3 || x >= W - P - 3 || y >= H - P - 3;
      for (let i = 0; i < own.length; i++) {
        const o = own[i];
        if (o < 0 || bad[o]) continue;
        const x = i % W, y = i / W | 0;
        if (near[i] || occ[i] === 0 && !inCorner(x, y) && !ring(x, y)) bad[o] = 1;
      }
      cand = live.filter(i => !bad[i] && !(inside[i] && LABELY_T.has(ops[i].t)));
      prio = i => inside[i] ? 1 : 0;
    }
    const T = Math.min(cand.length, Math.round(live.length * K.keep));
    const pick = (L, t) => {
      const s = L.slice().sort((a, b) => ops[a].t < ops[b].t ? -1 : ops[a].t > ops[b].t ? 1 : a - b), r = [];
      if (t <= 0) return r;
      for (let j = 0; j < s.length; j++) if (Math.floor((j + 1) * t / s.length) > Math.floor(j * t / s.length)) r.push(s[j]);
      return r;
    };
    let keepL;
    if (prio) {
      const A = cand.filter(i => prio(i) === 0), B = cand.filter(i => prio(i) === 1);
      keepL = A.length >= T ? pick(A, T) : A.concat(pick(B, T - A.length));
    } else keepL = pick(cand, T);
    const ks = new Set(keepL);
    for (let i = 0; i < own.length; i++) {
      const o = own[i];
      if (o < 0 || ks.has(o)) continue;
      const u = uown[i];
      buf[i] = u >= 0 && ks.has(u) ? under[i] : 0;
    }
    out.nAfter = keepL.length;
    out.keepSet = ks;
    return out;
  }
  const kindKey = k => k === "cook" ? DZ.cook || "cook" : k;
  {
    const oc = U.openCook;
    if (oc) U.openCook = function(f, atStove, mode) {
      DZ.cook = mode === "craft" ? "craft" : atStove ? "stove" : "cook";
      return oc.apply(this, arguments);
    };
  }
  function ledSpr(R) {
    const b = new Spr(4, 4);
    b.rect(0, 0, 4, 4, "#2a2c2e");
    b.set(0, 0, "#3e4144");
    b.rect(1, 1, 2, 2, "#141618");
    return obj(b, "#0c0d0e");
  }
  function ledAt(R, x, y) {
    return {
      x: x + 2,
      y: y + 2,
      c: R.pick([ "#5fe05a", "#5fe05a", "#ff5a48", "#ffb43a" ]),
      d: (2.2 + R() * 4).toFixed(2),
      o: (R() * 3).toFixed(2),
      on: R.ch(.7)
    };
  }
  const hosts = new Map;
  function targetOf(host) {
    if (host.id === "panel") {
      const w = host.firstElementChild;
      if (!w || !w.classList.contains("win") || DZ.SKIP[U.panelKind]) return null;
      return w;
    }
    if (host.id === "deco") return host;
    return host.querySelector(".win");
  }
  function run(host, light) {
    const t0 = performance.now();
    DZ.stats.runs++;
    const w = targetOf(host);
    if (!w || host.classList.contains("hidden") || !w.isConnected || !w.offsetWidth) {
      return;
    }
    const kind = host.id === "panel" ? U.panelKind || "win" : host.id === "ask" ? "ask" : host.id === "detail" ? "detail" : host.id === "partsWin" ? "parts" : host.id === "loadout" ? "loadout" : host.id === "ngAsk" ? "ngAsk" : host.id === "deco" ? "deco" : "win";
    const P = w.id === "deco" ? 4 : 8;
    let lay = w.querySelector(":scope > .dzLay");
    if (!lay) {
      lay = document.createElement("div");
      lay.className = "dzLay";
      lay.setAttribute("aria-hidden", "true");
      const cv = document.createElement("canvas");
      lay.appendChild(cv);
      w.appendChild(lay);
    }
    const cv = lay.firstElementChild, tm = performance.now(), G = measure(w, P);
    DZ.stats.measure = +(performance.now() - tm).toFixed(2);
    if (roWin) {
      for (const e of obsL) if (!e.isConnected) {
        roWin.unobserve(e);
        obsL.delete(e);
      }
      for (const e of [ w, ...w.querySelectorAll(":scope > .body, :scope > .body > *, :scope > header, :scope > .tabs") ]) if (!obsL.has(e)) {
        obsL.add(e);
        roWin.observe(e);
      }
    }
    const key = [ G.W, G.H, G.u, kind, sig(G), SX.decoAmt ? SX.decoAmt() : 1 ].join("|");
    if (lay._key === key && (light || !lay._light)) {
      DZ.stats.ms = performance.now() - t0;
      return;
    }
    DZ.stats.draws++;
    const W = G.W, H = G.H, fk = fixKey(w, kind, G);
    if (DZ.noFix) FIX.delete(fk);
    let E = FIX.get(fk);
    if (E) FIX.delete(fk);
    const pl = light && E ? null : plan(w, kind, G);
    if (!E) {
      E = {
        buf: new Uint32Array(pl.buf),
        seen: new Uint8Array(W * H),
        leds: pl.leds.map(L => Object.assign({}, L)),
        cls: pl.cls,
        mat: pl.mat
      };
    } else if (pl) {
      const by = new Map;
      for (let i = 0; i < pl.vo.length; i++) {
        const o = pl.vo[i];
        if (o < 0) continue;
        let a = by.get(o);
        if (!a) {
          a = [];
          by.set(o, a);
        }
        a.push(i);
      }
      const near = i => {
        const x0 = i % W, y0 = i / W | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const X = x0 + dx, Y = y0 + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const j = Y * W + X;
          if (E.seen[j] || E.buf[j]) return true;
        }
        return false;
      };
      for (const [o, px] of by) {
        if (px.some(near)) continue;
        for (const i of px) E.buf[i] = pl.buf[i];
        for (const L of pl.leds) if (L.op === o) E.leds.push(Object.assign({}, L));
      }
    }
    FIX.set(fk, E);
    while (FIX.size > 40) FIX.delete(FIX.keys().next().value);
    const cover = coverOf(G, E.cls), out = new Uint32Array(W * H);
    for (let i = 0; i < out.length; i++) if (!cover[i]) {
      out[i] = E.buf[i];
      E.seen[i] = 1;
    }
    lay._cover = cover;
    lay._fk = fk;
    lay._key = key;
    lay._light = !pl;
    if (cv.width !== G.W) cv.width = G.W;
    if (cv.height !== G.H) cv.height = G.H;
    const x = cv.getContext("2d"), im = x.createImageData(G.W, G.H), d = im.data;
    new Uint32Array(d.buffer).set(out);
    x.putImageData(im, 0, 0);
    const leds = E.leds.filter(L => !cover[L.y * W + L.x]);
    const u = G.u, bl = w.clientLeft, bt = w.clientTop;
    Object.assign(lay.style, {
      left: -P * u + "px",
      top: -P * u + "px",
      width: G.W * u + "px",
      height: G.H * u + "px"
    });
    if (pl) {
      lay.dataset.nb = String(pl.nBefore);
      lay.dataset.na = String(pl.nAfter);
    }
    lay.dataset.cls = E.cls;
    lay.dataset.mat = E.mat;
    {
      let n = 0;
      for (let i = 0; i < out.length; i++) if (out[i]) n++;
      lay.dataset.n = String(n);
    }
    const lk = leds.map(L => L.x + "," + L.y + "," + L.c + "," + (L.on ? 1 : 0)).join(";") + "|" + u;
    if (lay._ledKey !== lk) {
      lay._ledKey = lk;
      for (const e of [ ...lay.querySelectorAll(".dzLed") ]) e.remove();
      for (const L of leds) {
        const e = document.createElement("i");
        e.className = "dzLed" + (L.on ? " on" : "");
        e.style.cssText = `left:${L.x * u}px;top:${L.y * u}px;--c:${L.c};animation-duration:${L.d}s;animation-delay:-${L.o}s`;
        lay.appendChild(e);
      }
    }
    void bl;
    void bt;
    const ms = performance.now() - t0;
    DZ.stats.ms = ms;
    DZ.stats.maxMs = Math.max(DZ.stats.maxMs, ms);
  }
  const FIX = DZ.FIX = new Map;
  const fixKey = (w, kind, G) => [ kindKey(kind), w.id || "", w.dataset.cs || "", w.dataset.mk || "", w.dataset.mkr || "", [ ...w.classList ].filter(c => !/^(hidden|padHover|fitH|fitW|tight)$/.test(c)).sort().join("."), G.W, G.H, G.u, SX.decoAmt ? SX.decoAmt() : 1, DZ.keepOverride == null ? "" : DZ.keepOverride ].join("|");
  function coverOf(G, cls) {
    const {W, H, occ} = G, c = new Uint8Array(W * H);
    for (let i = 0; i < c.length; i++) if (occ[i] === 1) c[i] = 1;
    if (cls === "read") {
      const g = READ_GAP;
      for (const [a, b, cc, dd] of G.texts) for (let y = Math.max(0, b - g); y < Math.min(H, dd + g); y++) for (let x = Math.max(0, a - g); x < Math.min(W, cc + g); x++) c[y * W + x] = 1;
    }
    return c;
  }
  function sig(G) {
    let h = 2166136261;
    const o = G.occ;
    for (let i = 0; i < o.length; i += 1) {
      h ^= o[i] + (G.surf[i] << 3);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function schedule(host) {
    let H = hosts.get(host);
    if (!H) {
      H = {
        t: 0,
        first: 0
      };
      hosts.set(host, H);
    }
    const now = performance.now();
    if (!H.first) H.first = now;
    clearTimeout(H.t);
    const wait = now - H.first > 250 ? 0 : 45;
    H.t = setTimeout(() => {
      H.first = 0;
      try {
        run(host);
      } catch (e) {
        console.error(e);
      }
    }, wait);
  }
  function runNow(host) {
    try {
      run(host, true);
    } catch (e) {
      console.error(e);
    }
    schedule(host);
  }
  DZ.run = host => run(host || document.getElementById("panel"));
  DZ.flush = () => {
    for (const [host, H] of hosts) {
      clearTimeout(H.t);
      H.first = 0;
      try {
        run(host);
      } catch (e) {
        console.error(e);
      }
    }
  };
  const mine = n => n && n.nodeType === 1 && (n.classList.contains("dzLay") || n.classList.contains("dzLed"));
  function watch(host) {
    if (!host || host._dz) return;
    host._dz = true;
    new MutationObserver(recs => {
      let any = false, now = false;
      for (const r of recs) {
        if (r.type === "childList" && [ ...r.addedNodes, ...r.removedNodes ].every(mine) && r.addedNodes.length + r.removedNodes.length) continue;
        if (r.target.closest && r.target.closest(".dzLay")) continue;
        any = true;
        if (r.type === "childList" && [ ...r.addedNodes, ...r.removedNodes ].some(n => n.nodeType === 1 && !mine(n))) now = true;
      }
      if (now && !DZ.slowRedraw) runNow(host); else if (now || any) schedule(host);
    }).observe(host, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [ "class" ]
    });
    if (window.ResizeObserver) new ResizeObserver(() => schedule(host)).observe(host);
    schedule(host);
  }
  const panel = document.getElementById("panel");
  watch(panel);
  addEventListener("resize", () => {
    for (const h of hosts.keys()) schedule(h);
  });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => {
    for (const h of hosts.keys()) schedule(h);
  });
  const LATE = [ "ask", "detail", "partsWin", "loadout", "ngAsk", "deco" ];
  const lateScan = () => {
    for (const id of LATE) {
      const e = document.getElementById(id);
      if (e) watch(e);
    }
  };
  lateScan();
  new MutationObserver(lateScan).observe(document.body, {
    childList: true
  });
  const roWin = window.ResizeObserver ? new ResizeObserver(es => {
    for (const e of es) {
      const h = e.target.closest("#panel, #ask, #detail, #partsWin, #loadout, #ngAsk, #deco");
      if (h) schedule(h);
    }
  }) : null;
  const obsL = new Set;
  function png(s) {
    const c = document.createElement("canvas");
    c.width = s.w;
    c.height = s.h;
    const x = c.getContext("2d"), im = x.createImageData(s.w, s.h);
    for (let i = 0; i < s.c.length; i++) {
      const v = s.c[i];
      if (!v) continue;
      const q = hx(v);
      im.data[i * 4] = q[0];
      im.data[i * 4 + 1] = q[1];
      im.data[i * 4 + 2] = q[2];
      im.data[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return 'url("' + c.toDataURL() + '")';
  }
  function flat(w, h, f) {
    const s = new Spr(w, h);
    f((x, y, c) => s.set(x, y, c));
    return s;
  }
  DZ.HUD = {};
  function hudSprites() {
    const R = rng(96601), H = DZ.HUD;
    H.tapeTL = S.tapeDiag(R, 6, 4, PAL.mask, false);
    H.tapeTR = S.tapeDiag(R, 6, 4, PAL.duct, true);
    H.tapeBR = S.tapeDiag(R, 5, 3, PAL.redt, true);
    H.barcode = S.barcode(rng(7), 9);
    H.tie = S.tie(rng(3), "nylon");
    H.screw = S.screw(rng(5), PAL.steel);
    H.rivet = S.rivet(rng(5), PAL.steel);
    H.north = obj(art([ "..l..", ".lll.", "lllll" ], {
      l: "#c9b07a"
    }), "#2a2214");
    H.ticks = flat(2, 24, p => {
      for (let y = 0; y < 24; y += 3) {
        p(0, y, "#a89868");
        if (y % 6 === 0) p(1, y, "#a89868");
      }
    });
    H.scr = flat(8, 3, p => {
      p(0, 2, "#5a6270");
      p(1, 2, "#5a6270");
      p(2, 1, "#5a6270");
      p(3, 1, "#5a6270");
      p(4, 0, "#5a6270");
      p(5, 2, "#4a525e");
      p(6, 1, "#4a525e");
      p(7, 0, "#4a525e");
    });
    H.redt = S.tape(rng(11), 6, 3, PAL.redt, true);
    H.clampHp = obj(art([ "hb", "bb", "bb", "bb", "bb", "bb", "bb", "bb", "bd" ], {
      h: PAL.steel.h,
      b: PAL.steel.l,
      d: PAL.steel.b
    }), PAL.steel.o);
    H.clampSt = obj(art([ "hb", "bb", "bb", "bb", "bb", "bb", "bd" ], {
      h: PAL.steel.h,
      b: PAL.steel.l,
      d: PAL.steel.b
    }), PAL.steel.o);
    H.antenna = obj(art([ "h", "b", "b", "b", "b", "b", "d" ], {
      h: PAL.black.h,
      b: PAL.black.l,
      d: PAL.black.b
    }), PAL.black.o);
    H.clip = S.clip(rng(2), PAL.zinc);
    H.dymoQ = S.dymo(rng(4), "1-0", "black");
    H.sticker = S.warn(rng(9));
    H.star = S.star(rng(1));
    H.tack = S.tack(rng(8), "red");
    H.tieH = rot(S.tie(rng(3), "nylon"));
    H.barS = S.barcode(rng(12), 7);
    H.barS = (() => {
      const s = new Spr(9, 5);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) s.set(x, y, H.barS.get(x, y + (y < 2 ? 0 : 3)));
      return s;
    })();
    H.barV = rot(H.barS);
    H.tapeS = S.tape(rng(21), 4, 3, PAL.mask, true);
    H.tapeL = S.tape(rng(22), 4, 3, PAL.duct, false);
    const br = obj(art([ "hbbb", "b...", "b...", "b..." ], {
      h: PAL.brass.h,
      b: PAL.brass.l
    }), PAL.brass.o);
    H.brTL = br;
    H.brTR = flipX(br);
    H.brBL = (() => {
      const s = new Spr(br.w, br.h);
      for (let y = 0; y < br.h; y++) for (let x = 0; x < br.w; x++) s.set(x, br.h - 1 - y, br.get(x, y));
      return s;
    })();
    H.brBR = flipX(H.brBL);
    H.hazS = flat(16, 4, p => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) p(x, y, (x + y >> 1) % 2 ? "#b8941f" : "#2e2914");
    });
    const st = document.documentElement.style;
    for (const [k, s] of Object.entries(H)) st.setProperty("--dzh-" + k, png(s));
    cssKeep();
  }
  const G1 = c => "linear-gradient(" + c + ", " + c + ")";
  const CSSB = DZ.CSSB = {
    hudWeapon: [ [ "barV", 1 ], [ "rivet", 1 ], [ "tapeTL", 0 ], [ "scr", 0 ], [ "tieH", 0 ], [ "rivet", 0 ], [ "scr", 0 ] ],
    msgBox: [ [ "antenna", 1 ], [ "tapeL", 0 ], [ "barS", 0 ], [ "rivet", 0 ], [ "rivet", 0 ], [ "scr", 0 ] ],
    hudQuick: [ [ "screw", 1 ], [ "screw", 1 ], [ "tapeS", 1 ], [ "barS", 1 ], [ "rivet", 1 ], [ "scr", 1 ] ],
    hudInfo: [ [ "tack", 0 ] ],
    hudTut: [ [ "tapeTL", 0 ], [ "tapeTR", 0 ] ],
    tooltip: [ [ "clip", 0 ], [ G1("#6b5a3a"), 0 ], [ G1("#6b5a3a"), 0 ], [ G1("#6b5a3a"), 0 ] ],
    bigNote: [ [ "tapeTL", 1 ], [ "tapeTR", 1 ], [ "hazS", 1 ], [ "hazS", 1 ], [ "brTL", 1 ], [ "brTR", 1 ], [ "brBL", 1 ], [ "brBR", 1 ] ],
    hintbar: [ [ G1("#8a7a5a"), 0 ], [ G1("#8a7a5a"), 0 ] ],
    hudSpec: [ [ G1("#7d8693"), 1 ], [ G1("#7d8693"), 1 ], [ G1("#7d8693"), 1 ], [ G1("#7d8693"), 1 ] ]
  };
  function cssKeep() {
    const st = document.documentElement.style, out = DZ.cssOn = {};
    for (const [box, L] of Object.entries(CSSB)) {
      const K = DZ.keepOf(box);
      let want = Math.round(L.length * K.keep), on = 0;
      L.forEach(([img, far], i) => {
        const ok = on < want && (K.cls !== "read" || far);
        if (ok) on++;
        st.setProperty("--dzb-" + box + "-" + i, ok ? /^linear/.test(img) ? img : "var(--dzh-" + img + ")" : "none");
      });
      out[box] = {
        n: L.length,
        on,
        cls: K.cls
      };
    }
  }
  DZ.cssKeep = cssKeep;
  try {
    hudSprites();
  } catch (e) {
    console.error(e);
  }
  function warm() {
    try {
      const W = 260, H = 180, P = 8, occ = new Uint8Array(W * H), surf = new Uint8Array(W * H), fake = {
        dataset: {
          cs: "steel"
        },
        id: "",
        classList: []
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.min(x, y, W - 1 - x, H - 1 - y);
        occ[y * W + x] = d >= P ? x > 40 && x < 120 && y > 30 && y < 90 ? 1 : 0 : d === P - 1 ? 5 : d >= 1 ? 3 : 4;
      }
      for (const cs of [ "steel", "wood", "radio", "report" ]) {
        fake.dataset.cs = cs;
        plan(fake, "inv", {
          u: 3,
          W,
          H,
          P,
          Wi: W - 2 * P,
          Hi: H - 2 * P,
          ox: 0,
          oy: 0,
          occ: occ.slice(),
          surf,
          surfs: [ {
            col: "#191b20",
            kind: "face",
            r: [ P, P, W - P, H - P ],
            el: null
          } ]
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (window.requestIdleCallback) requestIdleCallback(warm, {
    timeout: 4e3
  }); else setTimeout(warm, 1500);
  DZ.hosts = hosts;
  DZ.measure = measure;
  DZ.plan = plan;
  DZ.targetOf = targetOf;
})(window.SX);
