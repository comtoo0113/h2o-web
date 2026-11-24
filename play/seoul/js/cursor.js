"use strict";

(function(SX) {
  const CUR = [ {
    id: "arrow",
    name: "낡은 쇠 화살표",
    hx: 0,
    hy: 0,
    tip: [ [ 1, 2 ], [ 1, 3 ], [ 2, 3 ] ],
    pal: {
      o: "#101113",
      W: "#dcd8c8",
      H: "#b4b2a6",
      M: "#8c8b84",
      D: "#63635e",
      d: "#474744",
      R: "#9a5b30",
      r: "#6c3b1f"
    },
    px: [ "o...............", "oo..............", "oWo.............", "oWHo............", "oWHMo...........", "oWHMMo..........", "oWHMMMo.........", "oWHMRMMo........", "oWHMRrMDo.......", "oWHMMMDDdo......", "oWHMMDoooo......", "oWHoMDo.........", "oWo.oMDo........", "oo...oMDo.......", ".....oMDo.......", "......oo........" ]
  }, {
    id: "water",
    name: "생수병",
    hx: 4.5,
    hy: 0,
    tip: [ [ 3, 1 ], [ 4, 1 ], [ 5, 1 ] ],
    pal: {
      o: "#0c1a2e",
      T: "#6a9ae0",
      C: "#3a78cc",
      c: "#22508e",
      N: "#e4ecf0",
      n: "#a8bcc8",
      S: "#d4eaf4",
      s: "#9cc6dc",
      W: "#eef8fc",
      B: "#a8d2e6",
      b: "#7eaac6",
      K: "#2a64b8",
      L: "#4a8ad0",
      w: "#f0f8ff"
    },
    px: [ "...ooo..........", "..oTCco.........", "..oCCco.........", "..oNNno.........", ".oSSSsso........", "oWBBBBbbo.......", "oWBBBBBbo.......", "oWbbbbbbo.......", "oKKKKKKKo.......", "oKLwwwLKo.......", "oKLLLLLKo.......", "oKKKKKKKo.......", "oWBBBBBbo.......", "oWbbbbbbo.......", "oWBBBBBbo.......", ".ooooooo........" ]
  }, {
    id: "pistol",
    name: "권총",
    hx: 0,
    hy: 4.5,
    tip: [ [ 1, 3 ], [ 1, 4 ] ],
    pal: {
      o: "#0e0f12",
      F: "#9aa0ac",
      R: "#7a808c",
      H: "#b4bac4",
      S: "#6a707c",
      s: "#4a505a",
      h: "#16181c",
      D: "#4e535e",
      K: "#5a5f6a",
      t: "#3a3e46",
      G: "#4c4740",
      g: "#68625a",
      m: "#2c2d30"
    },
    px: [ "..o........oo...", ".oFo......oRRo..", "oHHHHHHHHHHHHHo.", "oSSSSSSSSsSsSSo.", "ohSSSSSSSsSsSSo.", "oDDDDDDDDDDDDDo.", ".ooKKKKKKKKKKKo.", "...oKo.toGgGgGo.", "...oKo..oGGgGGo.", "....oKKKKgGgGGo.", ".....ooooGGgGgGo", ".........oGgGGGo", ".........oGGgGGo", ".........ommmmmo", "..........ooooo.", "................" ]
  }, {
    id: "knife",
    name: "식칼",
    hx: 0,
    hy: 0,
    tip: [ [ 1, 1 ], [ 1, 2 ], [ 2, 2 ] ],
    pal: {
      o: "#14161a",
      E: "#ffffff",
      e: "#eef3f8",
      S: "#d4dae2",
      B: "#a8b0ba",
      r: "#7a2a24",
      Z: "#7e8690",
      h: "#3e3436",
      H: "#5e5052",
      v: "#c8ccd2"
    },
    px: [ "o...............", ".E..............", ".eS.............", ".eBS............", "..eBS...........", "..eBBS..........", "...eBBS.........", "...eBBBS........", "....eBBBS.......", "....eBrBBS......", ".....eBBBSZ.....", "......eBBZZH....", ".......eZZhvH...", "...........hhH..", "............hh..", "................" ]
  }, {
    id: "torch",
    name: "손전등",
    hx: 1,
    hy: 1,
    tip: [ [ 1, 1 ], [ 2, 1 ], [ 1, 2 ] ],
    pal: {
      o: "#121418",
      W: "#ffffff",
      Y: "#fff1b0",
      L: "#d8dce0",
      R: "#c8d0d8",
      A: "#9aa2ae",
      M: "#6a707c",
      a: "#4a4e58",
      m: "#3a3e46",
      K: "#5a5f6a",
      k: "#454a54",
      X: "#c8342a",
      T: "#2e3036"
    },
    px: [ "................", ".WYLR...........", ".YYRAA..........", ".LRMMA..........", ".RaMMAA.........", "..aamMk.........", "....mkKX........", "......XKk.......", ".......kKk......", "........kKk.....", ".........kKk....", "..........kTT...", "...........TT...", "................", "................", "................" ]
  }, {
    id: "syringe",
    name: "주사기",
    hx: 0,
    hy: 0,
    tip: [ [ 1, 1 ], [ 2, 2 ] ],
    pal: {
      o: "#14181c",
      N: "#e8eef4",
      G: "#6ab88a",
      b: "#b8c8d4",
      k: "#5a6a7a",
      L: "#e8dca0",
      l: "#c83a3a",
      P: "#2a2c30",
      C: "#f0f2ee",
      c: "#d0dee8",
      F: "#e4e9ee",
      f: "#a8b4c0"
    },
    px: [ "o...............", ".N..............", "..N.............", "...N............", "...GGb..........", "....LLk.........", "....blLk........", ".....bLPk.......", "......bcCk......", ".......bcCbFf...", "........bcFf....", ".........FfC....", "........Ff.CC...", "............f...", "................", "................" ]
  }, {
    id: "key",
    name: "낡은 열쇠",
    hx: 1,
    hy: 1,
    tip: [ [ 1, 1 ], [ 2, 1 ], [ 1, 2 ] ],
    pal: {
      o: "#1e1408",
      h: "#f4dc8c",
      Y: "#d0a648",
      y: "#8e6a2a"
    },
    px: [ "................", ".hY.............", ".yhY............", ".yyhY...........", "...yhY..........", "..yyyhY.........", ".....yhY.Y......", "......yhYY......", ".......YhY......", "......yyYYhYy...", ".......yhY..yy..", "........Y....y..", "........Y....y..", "........yy..yy..", ".........yyyy...", "................" ]
  }, {
    id: "driver",
    name: "드라이버",
    hx: 1,
    hy: 1,
    tip: [ [ 1, 1 ], [ 2, 1 ], [ 1, 2 ], [ 2, 2 ] ],
    pal: {
      o: "#16130a",
      S: "#d8dee6",
      s: "#8a929c",
      k: "#2a2c30",
      Y: "#e0b838",
      y: "#a8821e"
    },
    px: [ "................", ".SS.............", ".SS.............", "..sS............", "...sS...........", "....sS..........", ".....sSk........", "......kkYy......", ".......YkYy.....", ".......YYkYy....", "........YYYYk...", ".........YYkkk..", "..........kkk...", "...........k....", "................", "................" ]
  }, {
    id: "match",
    name: "성냥",
    hx: 1,
    hy: 1,
    tip: [ [ 1, 1 ], [ 2, 1 ], [ 1, 2 ] ],
    pal: {
      o: "#1e0c06",
      W: "#fffbe8",
      Y: "#ffd65a",
      O: "#e8782a",
      R: "#b83a1e",
      h: "#3a1a12",
      w: "#d8b47a",
      v: "#a07c48"
    },
    px: [ "................", ".WW.............", ".WYYO...........", "..YYYR..........", "..OYhh..........", "...Rhhh.........", ".....hw.........", "......vw........", ".......vw.......", "........vw......", ".........vw.....", "..........vw....", "...........vw...", "............vw..", "................", "................" ]
  } ];
  const DEF = "arrow", HOT = [ 255, 212, 90 ];
  const C = SX.cursor = {
    list: CUR,
    DEF,
    cache: {}
  };
  const hex = h => [ parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16) ];
  C.find = id => CUR.find(d => d.id === id) || null;
  C.cur = () => {
    const v = SX.opts && SX.opts.cursor;
    return v === "os" ? "os" : C.find(v) ? v : DEF;
  };
  C.cells = function(d, hover) {
    const W = 16, H = d.px.length, px = d.px.map(r => r.padEnd(W, "."));
    const body = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[y][x] !== "." && px[y][x] !== "o";
    const tip = new Set((d.tip || []).map(q => q[0] + "," + q[1])), out = [];
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        const ch = px[y][x];
        let c = null;
        if (ch === ".") {
          if (body(x - 1, y) || body(x + 1, y) || body(x, y - 1) || body(x, y + 1)) c = hex(d.pal.o);
        } else c = hex(d.pal[ch] || d.pal.o);
        if (c && hover && ch !== "." && ch !== "o") c = tip.has(x + "," + y) ? HOT.slice() : c.map(v => Math.round(v + (255 - v) * .15));
        row.push(c);
      }
      out.push(row);
    }
    return out;
  };
  C.canvas = function(d, k, hover) {
    const g = C.cells(d, hover), cv = document.createElement("canvas");
    cv.width = 16 * k;
    cv.height = g.length * k;
    const x = cv.getContext("2d");
    g.forEach((row, j) => row.forEach((c, i) => {
      if (c) {
        x.fillStyle = "rgb(" + c.join(",") + ")";
        x.fillRect(i * k, j * k, k, k);
      }
    }));
    return cv;
  };
  C.preview = (id, hover) => {
    const d = C.find(id);
    if (!d) return "";
    const key = "p" + id + (hover ? "h" : "");
    return C.cache[key] || (C.cache[key] = C.canvas(d, 1, hover).toDataURL("image/png"));
  };
  function blobUrl(cv) {
    const s = atob(cv.toDataURL("image/png").split(",")[1]), a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return URL.createObjectURL(new Blob([ a ], {
      type: "image/png"
    }));
  }
  const IS = (() => {
    const t = 'image-set(url("x.png") 1x) 0 0, auto';
    try {
      if (CSS.supports("cursor", t)) return "image-set";
      if (CSS.supports("cursor", "-webkit-" + t)) return "-webkit-image-set";
    } catch (e) {}
    return "";
  })();
  C.value = function(id, hover, kw) {
    const d = C.find(id);
    if (!d) return kw;
    const dpr = window.devicePixelRatio || 1, k = IS ? Math.max(1, Math.floor(2 * dpr + .01)) : 2, key = id + ":" + k + (hover ? "h" : "");
    const u = C.cache[key] || (C.cache[key] = blobUrl(C.canvas(d, k, hover)));
    const r = IS ? dpr : 1, hx = Math.round(d.hx * k / r), hy = Math.round(d.hy * k / r);
    return (IS ? IS + '(url("' + u + '") ' + +dpr.toFixed(4) + "x)" : 'url("' + u + '")') + " " + hx + " " + hy + ", " + kw;
  };
  const SWAP = {
    default: "--sxCur",
    pointer: "--sxCurP"
  }, done = new WeakSet;
  function swapRules(list) {
    for (const r of list) {
      try {
        const st = r.style;
        if (st) {
          const v = st.getPropertyValue("cursor").trim(), p = SWAP[v];
          if (p) st.setProperty("cursor", "var(" + p + ", " + v + ")", st.getPropertyPriority("cursor"));
        }
        if (r.cssRules && r.cssRules.length) swapRules(r.cssRules);
      } catch (e) {}
    }
  }
  C.swapAll = function() {
    for (const s of document.styleSheets) {
      if (done.has(s) || s.ownerNode && s.ownerNode.id === "sxCurCss") continue;
      let rs;
      try {
        rs = s.cssRules;
      } catch (e) {
        continue;
      }
      if (!rs) continue;
      done.add(s);
      swapRules(rs);
    }
  };
  function base() {
    if (document.getElementById("sxCurCss")) return;
    const el = document.createElement("style");
    el.id = "sxCurCss";
    el.textContent = ":where(html.sxCur), :where(html.sxCur) body { cursor: var(--sxCur, default); }\n" + ":where(html.sxCur) :where(a[href], summary) { cursor: var(--sxCurP, pointer); }\n" + ':where(html.sxCur) :where(input:not([type]), input[type=text], input[type=search], input[type=password], input[type=email], input[type=number], input[type=url], input[type=tel], textarea, [contenteditable=""], [contenteditable=true]) { cursor: text; }\n' + ':where(html.sxCur) [style*="cursor: default"] { cursor: var(--sxCur, default) !important; }\n';
    (document.head || document.documentElement).appendChild(el);
  }
  let dprNow = 0;
  C.apply = function() {
    base();
    C.swapAll();
    const id = C.cur(), h = document.documentElement;
    dprNow = window.devicePixelRatio || 1;
    if (id === "os") {
      h.classList.remove("sxCur");
      h.style.removeProperty("--sxCur");
      h.style.removeProperty("--sxCurP");
      return;
    }
    h.style.setProperty("--sxCur", C.value(id, false, "default"));
    h.style.setProperty("--sxCurP", C.value(id, true, "pointer"));
    h.classList.add("sxCur");
  };
  C.apply();
  addEventListener("load", () => C.apply());
  addEventListener("resize", () => {
    if ((window.devicePixelRatio || 1) !== dprNow) C.apply();
  });
})(window.SX);
