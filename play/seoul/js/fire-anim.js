"use strict";

(function(SX) {
  const A = SX.art;
  if (!A || !A.propDef) return;
  const FA = SX.fireAnim = {
    KINDS: {
      fire: {
        N: 12,
        FPS: 10,
        zone: (x, y, w, h) => {
          const B = h - 2;
          if (y <= B - 21) return true;
          for (const [hx, hy] of [ [ 11, B - 12 ], [ 17, B - 10 ], [ 14, B - 16 ], [ 21, B - 13 ] ]) if (x >= hx && x <= hx + 1 && y >= hy && y <= hy + 2) return true;
          return false;
        }
      },
      blaze: {
        N: 12,
        FPS: 10,
        sync: true
      },
      heater: {
        N: 8,
        FPS: 7,
        zone: (x, y, w, h) => {
          const B = h - 14;
          return x >= 11 && x <= 20 && y >= B - 21 && y <= B - 11;
        }
      }
    },
    ph: null,
    on: true,
    kept: {}
  };
  FA.still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  FA.BAKE_MAX = 8;
  const OFFV = () => SX.homeUse && SX.homeUse.OFFV || 1e3, TS = SX.TS || 32;
  const flips = new Map, kept = new WeakSet;
  function frameImg(kind, v, col, rot, k) {
    const d = A.propDef(kind), K = FA.KINDS[kind];
    if (!d || !d.draw) return null;
    rot = (rot | 0) & 3;
    if (d.noRot) rot = 0;
    if (rot && !d.rotSym) return null;
    const w = d.fw * TS, h = d.fh * TS + d.up, seed = v * 131 + kind.length + (rot ? rot * 977 : 0);
    const kb = "fireAnim:" + kind + ":" + v + ":" + (col || "") + ":" + (rot ? "s" + rot : "0") + ":", key = kb + k;
    const bake = f => A.cached(kb + f, w, h, P => {
      FA.ph = f;
      try {
        d.draw(P, w, h, d.up, new SX.Rng(seed), v, col || d.color, rot);
      } finally {
        FA.ph = null;
      }
    }, d.outline ? {
      mat: true
    } : null);
    const raw = bake(k);
    if (k && K && K.zone && !kept.has(raw)) {
      kept.add(raw);
      const b = bake(0).getContext("2d").getImageData(0, 0, w, h).data, x2 = raw.getContext("2d"), im = x2.getImageData(0, 0, w, h), q = im.data;
      let n = 0;
      for (let i = 0; i < w * h; i++) {
        if (K.zone(i % w, i / w | 0, w, h)) continue;
        const j = i * 4;
        if (q[j] !== b[j] || q[j + 1] !== b[j + 1] || q[j + 2] !== b[j + 2] || q[j + 3] !== b[j + 3]) {
          q[j] = b[j];
          q[j + 1] = b[j + 1];
          q[j + 2] = b[j + 2];
          q[j + 3] = b[j + 3];
          n++;
        }
      }
      if (n) x2.putImageData(im, 0, 0);
      FA.kept[key] = n;
    }
    if (!(rot & 2)) return raw;
    let c = flips.get(key);
    if (!c) {
      c = A.flipX(raw);
      flips.set(key, c);
    }
    return c;
  }
  FA.frameImg = frameImg;
  function modded(c) {
    const Mo = SX.mods;
    if (!Mo || !Mo.tex || !Mo.tex.length) return false;
    const k = A.keyOf && A.keyOf(c);
    return !!k && Mo.tex.some(t => t.exact ? t.pat === k : t.re && t.re.test(k));
  }
  const ents = new WeakMap;
  FA.entry = p => ents.get(p) || null;
  FA.frame = (p, now) => {
    const K = FA.KINDS[p.kind];
    if (!K) return 0;
    if (K.sync) return Math.floor(now * K.FPS) % K.N;
    const sd = Math.round((p.px != null ? p.px : p.x) * 7) * 3 + Math.round((p.py != null ? p.py : p.y) * 5) * 5 & 1023;
    return (Math.floor(now * K.FPS) + sd) % K.N;
  };
  FA.img = function(p, s, now) {
    const K = FA.KINDS[p.kind];
    if (!K || !FA.on || FA.still || !s || !s.c) return null;
    const v = p.v | 0;
    if (v >= OFFV()) return null;
    const rot = A.noRot(p.kind) ? 0 : (p.rot | 0) & 3, col = p.col || null, mn = SX.mods && SX.mods.tex ? SX.mods.tex.length : 0;
    let e = ents.get(p);
    if (!e || e.src !== s.c || e.v !== v || e.rot !== rot || e.col !== col || e.mn !== mn) {
      e = {
        src: s.c,
        v,
        rot,
        col,
        mn,
        skip: modded(s.c),
        fr: [],
        k: 0
      };
      ents.set(p, e);
    }
    if (e.skip) return null;
    const k = FA.frame(p, now);
    if (!k) {
      e.k = 0;
      return null;
    }
    let c = e.fr[k];
    if (c === undefined) {
      if (FA.bakeT !== now) {
        FA.bakeT = now;
        FA.bakeN = 0;
      }
      if (FA.bakeN >= FA.BAKE_MAX) return e.k ? e.fr[e.k] || null : null;
      FA.bakeN++;
      c = frameImg(p.kind, v, col, rot, k);
      if (!c || c.width !== s.c.width || c.height !== s.c.height) c = null;
      e.fr[k] = c;
    }
    e.k = k;
    return c;
  };
  const SPARK_C = [ "#fff6c8", "#ffd646", "#ff9220", "#e8521a", "#a8281a" ], SPARK_N = 6;
  const h01 = (a, b) => {
    let q = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0;
    q = Math.imul(q ^ q >>> 13, 1274126177);
    return ((q ^ q >>> 16) >>> 0) / 4294967296;
  };
  const SMK = [];
  function smk(r) {
    let c = SMK[r];
    if (c) return c;
    const n = r * 2 + 1;
    c = document.createElement("canvas");
    c.width = c.height = n;
    const x = c.getContext("2d");
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
      const dx = xx - r, dy = yy - r, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd > r + .3 || dd > r - 1.5 && xx + yy & 1) continue;
      x.fillStyle = dd < r * .55 ? "#2a2422" : "#4a403a";
      x.fillRect(xx, yy, 1, 1);
    }
    SMK[r] = c;
    return c;
  }
  function blazeFx(g, p, cam, now) {
    const I = A.blazeInfo ? A.blazeInfo(p.v) : {
      hl: 0
    }, bx = Math.round(p.x * TS - cam.x), by = Math.round(p.y * TS - cam.y), top = by - [ 10, 18, 24 ][I.hl];
    const sd = Math.round(p.x) * 31 + Math.round(p.y) * 57 + 11, ga = g.globalAlpha;
    for (let i = 0; i < 2; i++) {
      const T = 2.6 + h01(sd, i * 5 + 1) * 1.2, tt = now / T + i * .5 + h01(sd, 3), cyc = Math.floor(tt), q = tt - cyc;
      if (h01(cyc, sd + i * 3) < .3) continue;
      const r = 3 + Math.round(q * 6), a = .5 * (1 - q) * Math.min(1, q * 5);
      const x = Math.round(bx + 6 + h01(cyc * 3 + i, sd) * 20 + (h01(cyc * 5 + i, sd + 1) - .5) * 12 * q) - r, y = Math.round(top - 2 - q * 46) - r;
      g.globalAlpha = ga * a;
      g.drawImage(smk(r), x, y);
    }
    g.globalAlpha = ga;
    for (let i = 0; i < 2 + I.hl; i++) {
      const T = 1.1 + h01(sd, i * 7) * .9, tt = now / T + h01(sd, i * 13), cyc = Math.floor(tt), q = tt - cyc;
      if (q > .92 || h01(cyc, sd + i) < .25) continue;
      if (q > .45 && ((now * 14 | 0) + i) % 5 === 0) continue;
      const x0 = 5 + h01(cyc * 3 + i, sd) * 22, dr = (h01(cyc * 5 + i, sd + 1) - .5) * 10, rise = 16 + h01(cyc * 7 + i, sd + 2) * 20;
      const x = Math.round(bx + x0 + dr * q + Math.sin(q * 7 + i * 2) * 1.5), y = Math.round(top + 8 - rise * (1 - (1 - q) * (1 - q)));
      g.fillStyle = SPARK_C[Math.min(4, Math.floor(q * 5.4))];
      g.fillRect(x, y, 1, q < .18 ? 2 : 1);
    }
  }
  FA.sparks = function(g, F, cam, now, ver, tx0, tx1, ty0, ty1) {
    if (!FA.on || FA.still || !F || !F.props) return;
    if (F._fsVer !== ver) {
      F._fs = F.props.filter(p => p.kind === "fire" || p.kind === "blaze");
      F._fsVer = ver;
      if (F.fireAt && A.blazeLink) A.blazeLink(F);
    }
    if (!F._fs.length) return;
    const L = SX.light, hub = F.kind === "hub", off = OFFV(), up = A.propDims && A.propDims("fire", 0).up || 22;
    for (const p of F._fs) {
      if (p.hidden || (p.v | 0) >= off || p.x + p.w < tx0 - 1 || p.x > tx1 + 1 || p.y + p.h < ty0 - 2 || p.y > ty1 + 2) continue;
      const e = ents.get(p);
      if (e && e.skip) continue;
      if ((!hub || p.furn && L && L.visF === F && L.sv) && !(L && L.seenActor && L.seenActor(F, p.x + p.w / 2, p.y + p.h - .2))) continue;
      if (p.kind === "blaze") {
        blazeFx(g, p, cam, now);
        continue;
      }
      const qx = p.px != null ? p.px : p.x, qy = p.py != null ? p.py : p.y, bx = Math.round(qx * TS - cam.x), by = Math.round(qy * TS - cam.y) - up;
      const sd = Math.round(qx * 7) * 3 + Math.round(qy * 5) * 5 + 17;
      for (let i = 0; i < SPARK_N; i++) {
        const T = 1.1 + h01(sd, i * 7) * .9, tt = now / T + h01(sd, i * 13), cyc = Math.floor(tt), q = tt - cyc;
        if (q > .92 || h01(cyc, sd + i) < .25) continue;
        if (q > .45 && ((now * 14 | 0) + i) % 5 === 0) continue;
        const x0 = 16 + (h01(cyc * 3 + i, sd) - .5) * 8, dr = (h01(cyc * 5 + i, sd + 1) - .5) * 9, rise = 24 + h01(cyc * 7 + i, sd + 2) * 22;
        const x = Math.round(bx + x0 + dr * q + Math.sin(q * 7 + i * 2) * 1.5), y = Math.round(by + 19 - rise * (1 - (1 - q) * (1 - q)));
        g.fillStyle = SPARK_C[Math.min(4, Math.floor(q * 5.4))];
        g.fillRect(x, y, 1, q < .18 ? 2 : 1);
      }
    }
  };
})(window.SX);
