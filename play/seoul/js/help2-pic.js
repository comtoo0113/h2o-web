(function(SX) {
  "use strict";
  if (!SX) return;
  const isEn = () => SX.lang === "en" || document.documentElement.lang === "en";
  const uDev = () => SX.view && SX.view.uiK || 3;
  const vScale = () => SX.view && (SX.view.baseScale || SX.view.scale) || Math.max(1, Math.round(innerHeight * (window.devicePixelRatio || 1) / 540));
  let META = null, metaP = null;
  const seen = new Set;
  function loadMeta() {
    if (!metaP) metaP = fetch("img/help/pics.json", {
      cache: "no-cache"
    }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => {
      META = j || {};
      return META;
    });
    return metaP;
  }
  const IM = new Map;
  function image(src) {
    let o = IM.get(src);
    if (!o) {
      o = {
        im: new Image,
        st: 0,
        cb: []
      };
      IM.set(src, o);
      const end = v => {
        o.st = v;
        for (const f of o.cb.splice(0)) f();
      };
      o.im.onload = () => end(1);
      o.im.onerror = () => end(-1);
      o.im.src = src;
    }
    return o;
  }
  function scene(name, again) {
    if (!META) {
      loadMeta().then(again);
      return null;
    }
    for (const L of isEn() ? [ "en", "ko" ] : [ "ko" ]) {
      const m = META[L] && META[L][name];
      if (!m) continue;
      const o = image(`img/help/${L === "en" ? "en/" : ""}${name}.png`);
      if (o.st === 0) {
        o.cb.push(again);
        return null;
      }
      if (o.st === 1) return {
        im: o.im,
        w: m[0],
        h: m[1],
        fx: m[2],
        fy: m[3],
        kind: m[4],
        lang: L
      };
    }
    return false;
  }
  const ICO = new Map;
  function icon(names) {
    for (const nm of names) {
      if (ICO.has(nm)) {
        const v = ICO.get(nm);
        if (v) return v;
        continue;
      }
      let d = null;
      try {
        d = SX.items.def(nm);
      } catch (e) {}
      if (!d) {
        ICO.set(nm, null);
        continue;
      }
      let v = null;
      try {
        const c = SX.art.icon(Object.assign({}, d, {
          w: d.w || 1,
          h: d.h || 1
        })), px = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
        if (x1 >= 0) v = {
          c,
          x: x0,
          y: y0,
          w: x1 - x0 + 1,
          h: y1 - y0 + 1,
          name: d.name || nm
        };
      } catch (e) {}
      if (v) {
        ICO.set(nm, v);
        return v;
      }
    }
    return null;
  }
  function lay(L, W, H, col, gap) {
    const n = L.length, sum = k => L.reduce((a, o) => a + o[k], 0), max = k => Math.max(...L.map(o => o[k]));
    const sw = col ? max("w") : sum("w") + gap * (n - 1), sh = col ? sum("h") + gap * (n - 1) : max("h");
    const s = Math.floor(Math.min(W / sw, H / sh));
    return {
      L,
      col,
      gap,
      sw,
      sh,
      s,
      area: s * s * L.reduce((a, o) => a + o.w * o.h, 0)
    };
  }
  function pick(L, W, H, mode) {
    const best = mode === "best", sets = [];
    if (best) {
      for (let i = 0; i < L.length; i++) {
        sets.push([ L[i] ]);
        for (let j = i + 1; j < L.length; j++) sets.push([ L[i], L[j] ]);
      }
    } else sets.push(L);
    let r = null;
    for (const S of sets) for (const col of S.length > 1 ? [ false, true ] : [ false ]) {
      const q = lay(S, W, H, col, best ? 2 : 4);
      if (q.s >= 1 && (!r || q.area > r.area || q.area === r.area && q.s > r.s)) r = q;
    }
    return r;
  }
  function drawIcons(g, r, x, y, W, H) {
    const s = r.s;
    let cx = x + Math.floor((W - r.sw * s) / 2), cy = y + Math.floor((H - r.sh * s) / 2);
    for (const o of r.L) {
      const w = o.w * s, h = o.h * s;
      g.drawImage(o.c, o.x, o.y, o.w, o.h, r.col ? x + Math.floor((W - w) / 2) : cx, r.col ? cy : y + Math.floor((H - h) / 2), w, h);
      if (r.col) cy += h + r.gap * s; else cx += w + r.gap * s;
    }
  }
  function drawScene(g, sc, x, y, W, H) {
    const s = sc.kind === "world" ? Math.max(1, Math.min(vScale(), Math.floor(H / 60))) : Math.max(1, Math.round(uDev() / 3));
    const vw = Math.min(sc.w, Math.ceil(W / s)), vh = Math.min(sc.h, Math.ceil(H / s));
    const sx = Math.max(0, Math.min(sc.w - vw, Math.round(sc.fx - vw / 2))), sy = Math.max(0, Math.min(sc.h - vh, Math.round(sc.fy - vh / 2)));
    g.save();
    g.beginPath();
    g.rect(x, y, W, H);
    g.clip();
    g.drawImage(sc.im, sx, sy, vw, vh, x + Math.floor((W - vw * s) / 2), y + Math.floor((H - vh * s) / 2), vw * s, vh * s);
    g.restore();
    return s;
  }
  function draw(b) {
    if (!b.isConnected) return;
    const dpr = window.devicePixelRatio || 1, cs = getComputedStyle(b), R = b.getBoundingClientRect();
    if (!R.width || !R.height) return;
    const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
    const L0 = R.left + bl, T0 = R.top + bt, X0 = Math.ceil(L0 * dpr - .02), Y0 = Math.ceil(T0 * dpr - .02);
    let W = Math.floor((R.right - br) * dpr + .02) - X0, H = Math.floor((R.bottom - bb) * dpr + .02) - Y0;
    if (W < 2 || H < 2) return;
    const uD = uDev(), pn = b.dataset.pic || "", mode = b.dataset.mode || "all";
    const L = (b.dataset.ic || "").split(";").filter(Boolean).map(q => icon(q.split("|"))).filter(Boolean);
    let r = null, sw = W, info = "";
    if (L.length && !pn) {
      const px = mode === "best" ? 0 : Math.round(uD * 2), py = mode === "best" ? 0 : Math.max(1, Math.round(uD * .7)), mw = +b.dataset.maxw ? Math.round(+b.dataset.maxw * uD) : 0;
      r = pick(L, (mw || W) - 2 * px, H - 2 * py, mode) || pick(L, mw || W, H, mode) || (mode !== "best" ? pick(L, mw || W, H, "best") : null);
      if (r && mw) {
        W = r.sw * r.s;
        const cw = W / dpr + "px";
        if (b.style.width !== cw) b.style.width = cw;
      }
      if (!r && b.parentElement && b.parentElement.tagName === "FIGURE") {
        const cw = Math.ceil((Math.max(...L.map(o => o.w)) + 2) / dpr) + "px";
        if (b.style.minWidth !== cw) {
          b.style.minWidth = cw;
          requestAnimationFrame(() => draw(b));
          return;
        }
      }
    }
    let cv = b.firstElementChild;
    if (!cv || cv.tagName !== "CANVAS") {
      cv = document.createElement("canvas");
      b.prepend(cv);
    }
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    cv.style.width = W / dpr + "px";
    cv.style.height = H / dpr + "px";
    cv.style.left = (b.dataset.maxw ? 0 : X0 / dpr - L0) + "px";
    cv.style.top = Y0 / dpr - T0 + "px";
    const g = cv.getContext("2d");
    g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false;
    if (r) {
      drawIcons(g, r, 0, 0, W, H);
      info = "i" + r.s;
    }
    if (pn) {
      if (L.length && W >= H * 2.2) {
        const px = Math.round(uD * 3), py = Math.max(1, Math.round(uD * .7)), q = pick(L, Math.floor(W * .42) - 2 * px, H - 2 * py, "all");
        if (q) {
          const zw = q.sw * q.s + 2 * px, sep = Math.max(1, Math.round(uD));
          drawIcons(g, q, W - zw, py, zw, H - 2 * py);
          sw = W - zw - sep;
          g.fillStyle = "#000";
          g.fillRect(sw, 0, sep, H);
          info = "i" + q.s;
        }
      }
      const sc = scene(pn, () => draw(b));
      if (sc) {
        info = "p" + drawScene(g, sc, 0, 0, sw, H) + (info ? " " + info : "");
        b.dataset.ok = "1";
        b.dataset.src = sc.lang;
      } else b.dataset.ok = sc === false ? "0" : "";
    } else b.dataset.ok = r ? "1" : "0";
    b.dataset.fit = info + " " + W + "x" + H;
  }
  let RO = null;
  function fit(root) {
    if (!RO && typeof ResizeObserver === "function") RO = new ResizeObserver(es => {
      const T = es.map(e => e.target);
      requestAnimationFrame(() => {
        for (const b of T) draw(b);
      });
    });
    for (const b of seen) if (!b.isConnected) {
      if (RO) RO.unobserve(b);
      seen.delete(b);
    }
    for (const b of (root || document).querySelectorAll(".hb2Fit")) {
      if (RO && !seen.has(b)) {
        seen.add(b);
        RO.observe(b);
      } else draw(b);
    }
    if (!META) loadMeta();
  }
  SX.helpPic = {
    fit,
    draw,
    icon,
    pick,
    meta: () => META
  };
})(window.SX);
