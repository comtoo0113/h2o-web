"use strict";

(function(SX) {
  const TS = SX.TS, T = SX.map.T, ART = SX.art, A = SX.actors;
  const PX = TS / 16;
  const R = SX.render = {};
  const ON_KINDS = new Set([ "treadmill", "squatRack", "barbell", "exBike" ]);
  let MV = null, NOW = 0;
  const CH = 16;
  const MAX_CHUNKS = 36;
  const shadeC = new Map;
  const shade = (hex, k) => {
    const q = Math.max(0, Math.min(20, Math.round(k * 20))), key = hex + q;
    let c = shadeC.get(key);
    if (!c) {
      const m = 1 - q / 20, v = parseInt(hex.slice(1), 16);
      c = "rgb(" + Math.round((v >> 16) * m) + "," + Math.round((v >> 8 & 255) * m) + "," + Math.round((v & 255) * m) + ")";
      shadeC.set(key, c);
    }
    return c;
  };
  function homeStair(ctx, s, x, y) {
    const w = s.w * TS, h = s.h * TS, up = s.dir === "up", n = s.h * 4;
    for (let k = 0; k < n; k++) {
      const yy = y + Math.round(k * h / n), hh = y + Math.round((k + 1) * h / n) - yy, q = n > 1 ? k / (n - 1) : 0, dk = up ? .22 - q * .22 : .08 + q * .5;
      ctx.fillStyle = shade("#8c6642", dk);
      ctx.fillRect(x, yy, w, hh);
      ctx.fillStyle = shade("#b8905e", dk);
      ctx.fillRect(x, yy, w, 1);
      ctx.fillStyle = shade(up ? "#6a4a2c" : "#2e1e10", dk);
      ctx.fillRect(x, yy + hh - 2, w, 1);
      ctx.fillStyle = shade("#2e1e10", dk);
      ctx.fillRect(x, yy + hh - 1, w, 1);
      ctx.fillStyle = shade("#6e4e30", dk);
      const g = (k * 37 + Math.floor(s.x) * 13) % 17;
      ctx.fillRect(x + 3 + g, yy + 3, 7, 1);
      ctx.fillRect(x + (g * 7 + 9) % 20 + 2, yy + 5, 5, 1);
      ctx.fillStyle = shade("#4a3220", dk);
      ctx.fillRect(x + w - 3, yy + 2, 1, 1);
      ctx.fillRect(x + 4, yy + 2, 1, 1);
    }
    const ry0 = up ? y + 2 : y + TS, ry1 = y + h - 2;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x + 3, ry0 + 2, 3, ry1 - ry0);
    ctx.fillStyle = "#2a1a0e";
    ctx.fillRect(x - 2, ry0, 5, ry1 - ry0);
    ctx.fillStyle = "#7a5432";
    ctx.fillRect(x - 1, ry0, 3, ry1 - ry0);
    ctx.fillStyle = "#b08458";
    ctx.fillRect(x - 1, ry0, 1, ry1 - ry0);
    const post = py => {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(x - 1, py + 1, 9, 6);
      ctx.fillStyle = "#2a1a0e";
      ctx.fillRect(x - 4, py - 4, 9, 9);
      ctx.fillStyle = "#6a4628";
      ctx.fillRect(x - 3, py - 3, 7, 7);
      ctx.fillStyle = "#94683e";
      ctx.fillRect(x - 2, py - 2, 5, 5);
      ctx.fillStyle = "#c49a68";
      ctx.fillRect(x - 2, py - 2, 2, 1);
      ctx.fillRect(x - 2, py - 1, 1, 1);
    };
    post(ry0 + 2);
    post(ry1 - 3);
  }
  let useTick = 0;
  function chunk(F, cx, cy) {
    const key = cx + "," + cy;
    let c = F.chunks.get(key);
    if (c) {
      c._use = ++useTick;
      return c;
    }
    if (F.chunks.size >= MAX_CHUNKS) {
      let old = null, ou = Infinity;
      for (const [k, v] of F.chunks) if (v._use < ou) {
        ou = v._use;
        old = k;
      }
      if (old) F.chunks.delete(old);
    }
    let ctx, n = 0;
    if (pre && pre.F === F && pre.key === key) {
      c = pre.c;
      ctx = pre.ctx;
      n = pre.n;
      pre = null;
    } else {
      c = ART.mk(CH * TS, CH * TS);
      ctx = c.getContext("2d");
    }
    c._use = ++useTick;
    preMade++;
    chunkTiles(F, ctx, cx, cy, n, 0);
    return chunkEnd(F, c, ctx, cx, cy, key);
  }
  function chunkTiles(F, ctx, cx, cy, n, until) {
    for (;n < CH * CH; n++) {
      if (until && performance.now() > until) return n;
      const tx = cx * CH + n % CH, ty = cy * CH + (n / CH | 0);
      const px = (tx - cx * CH) * TS, py = (ty - cy * CH) * TS;
      if (!F.in(tx, ty)) {
        if (F.out) SX.homeOut.draw(ctx, F, tx, ty, px, py); else {
          ctx.fillStyle = "#050608";
          ctx.fillRect(px, py, TS, TS);
        }
        continue;
      }
      const i = F.i(tx, ty), t = F.t[i];
      if (F.out && F.out.land && F.out.land[i]) {
        SX.homeOut.draw(ctx, F, tx, ty, px, py);
        continue;
      }
      let fs = F.fs[i];
      if (F.mat && F.mat[i]) fs = F.mat[i];
      if (t === T.VOID) {
        if (F.out && fs !== ART.FS.WATER) {
          SX.homeOut.draw(ctx, F, tx, ty, px, py);
          continue;
        }
        if (F.kind === "floor" && F.idx > 0 || F.kind === "roof" || F.kind === "hub" && fs !== ART.FS.WATER) {
          ctx.fillStyle = (tx + ty) % 2 ? "#0b0d11" : "#0c0e12";
          ctx.fillRect(px, py, TS, TS);
          if ((tx * 7 + ty * 13) % 23 === 0) {
            ctx.fillStyle = "#3a3320";
            ctx.fillRect(px + 14, py + 14, 2, 2);
          }
          continue;
        }
        fs = fs || ART.FS.VOID;
      }
      if (t === T.WALL || t === T.WINDOW || t === T.PARAPET || t === T.DOOR) fs = F.kind === "roof" && t === T.PARAPET ? ART.FS.ROOF : fs && fs !== ART.FS.VOID ? fs : ART.FS.CONC;
      const tint = F.tintAt ? F.tintAt(tx, ty, fs) : null;
      const fcv = ART.floorCached(fs, tx, ty, tx * 73856093 ^ ty * 19349663 ^ F.idx * 83492791, tint);
      ctx.drawImage(fcv, px, py);
      if (SX.normal) SX.normal.tile(F, i, fcv);
      if (F.sfAt) {
        const sfi = F.sfAt(i);
        if (sfi && SX.artSurf) {
          const sfc = SX.artSurf.floor(sfi, tx, ty);
          ctx.drawImage(sfc, px, py);
          if (SX.normal) SX.normal.surf(F, i, sfc);
        }
      }
    }
    return n;
  }
  function chunkEnd(F, c, ctx, cx, cy, key) {
    if (F.out) SX.homeOut.paintChunk(F, ctx, cx, cy);
    if (F._heliPad && ART.heliPad) {
      const hp = F._heliPad;
      ctx.drawImage(ART.heliPad(hp), Math.round((hp.x - cx * CH) * TS), Math.round((hp.y - cy * CH) * TS));
    }
    if (F.decoR) SX.decoRaid.paint(ctx, F, cx, cy);
    for (const d of F.decals) if (d.r ? decIn(d, cx, cy) : Math.floor(d.x / CH) === cx && Math.floor(d.y / CH) === cy) paint(ctx, d, cx, cy);
    if (F.dh && SX.decoHub) SX.decoHub.paintChunk(F, ctx, cx, cy);
    F.chunks.set(key, c);
    if (SX.normal) SX.normal.chunk(F, c, cx, cy);
    return c;
  }
  let pre = null, preQ = null, preOn = false, preFl = null, preMade = 0, preSeen = 0;
  const preAsk = f => window.requestIdleCallback ? requestIdleCallback(f, {
    timeout: 120
  }) : setTimeout(f, 16);
  function preWant(F, cam, vw, vh, tx0, ty0, tx1, ty1) {
    const S = CH * TS;
    preQ = {
      F,
      x0: Math.floor(tx0 / CH) - 1,
      x1: Math.floor(tx1 / CH) + 1,
      y0: Math.floor(ty0 / CH) - 1,
      y1: Math.floor(ty1 / CH) + 1,
      mx: (cam.x + vw / 2) / S,
      my: (cam.y + vh / 2) / S,
      ax: Math.floor((-vw / 2 - 2 * TS) / S),
      bx: Math.floor((F.W * TS + vw / 2 + 2 * TS) / S),
      ay: Math.floor((-vh / 2 - 2 * TS) / S),
      by: Math.floor((F.H * TS + vh / 2 + 5 * TS) / S)
    };
    const busy = preMade !== preSeen;
    preSeen = preMade;
    if (!busy) preStep(1.5);
    if (!preOn) {
      preOn = true;
      preAsk(preRun);
    }
  }
  function preRun(dl) {
    preOn = false;
    if (preStep(dl && dl.timeRemaining && !dl.didTimeout ? Math.min(6, Math.max(1, dl.timeRemaining() - .5)) : 2)) {
      preOn = true;
      preAsk(preRun);
    }
  }
  function preStep(ms) {
    const q = preQ, F = q && q.F;
    if (!F || R._F !== F || !F.out) {
      pre = null;
      return false;
    }
    if (pre && pre.F !== F) pre = null;
    const m = F.chunks;
    if (!m.__pre) {
      m.__pre = 1;
      const c0 = m.clear;
      m.clear = function() {
        if (pre && pre.F === F) pre = null;
        return c0.apply(this, arguments);
      };
    }
    const until = performance.now() + ms;
    const done = [];
    while (performance.now() < until) {
      if (!pre) {
        if (m.size >= MAX_CHUNKS) break;
        let best = null, bd = Infinity;
        for (let cy = Math.max(q.y0, q.ay); cy <= Math.min(q.y1, q.by); cy++) for (let cx = Math.max(q.x0, q.ax); cx <= Math.min(q.x1, q.bx); cx++) {
          if (m.has(cx + "," + cy)) continue;
          const d = (cx + .5 - q.mx) ** 2 + (cy + .5 - q.my) ** 2;
          if (d < bd) {
            bd = d;
            best = [ cx, cy ];
          }
        }
        if (!best) break;
        const c = ART.mk(CH * TS, CH * TS);
        pre = {
          F,
          key: best[0] + "," + best[1],
          cx: best[0],
          cy: best[1],
          c,
          ctx: c.getContext("2d"),
          n: 0
        };
      }
      const p = pre;
      p.n = chunkTiles(F, p.ctx, p.cx, p.cy, p.n, until);
      done.push(p.c);
      if (p.n < CH * CH) break;
      pre = null;
      if (!m.has(p.key) && m.size < MAX_CHUNKS) {
        p.c._use = ++useTick;
        chunkEnd(F, p.c, p.ctx, p.cx, p.cy, p.key);
      }
    }
    if (done.length) {
      if (!preFl) preFl = ART.mk(256, 256).getContext("2d");
      for (const c of done) preFl.drawImage(c, 0, 0, 1, 1);
      preFl.clearRect(0, 0, 256, 256);
    }
    return !!(pre || done.length);
  }
  function decIn(d, cx, cy) {
    return d.x + d.r > cx * CH && d.x - d.r < (cx + 1) * CH && d.y + d.r > cy * CH && d.y - d.r < (cy + 1) * CH;
  }
  function paint(ctx, d, cx, cy) {
    const px = Math.round(d.x * TS - cx * CH * TS), py = Math.round(d.y * TS - cy * CH * TS);
    const g = new SX.Rng(d.seed);
    if (d.kind === "blood") ART.bloodSplat(ctx, px, py, g, d.big); else if (d.kind === "drop") {
      ctx.fillStyle = g.chance(.5) ? "#8f1b1f" : "#6a1216";
      ctx.fillRect(px, py, 1 + g.i(3), 1 + g.i(2));
    } else if (d.kind === "casing") {
      ctx.fillStyle = "#8a6a2a";
      ctx.fillRect(px, py + 1, 4, 1);
      ctx.fillStyle = "#c8a048";
      ctx.fillRect(px, py, 4, 1);
      ctx.fillStyle = "#f0d888";
      ctx.fillRect(px, py, 1, 1);
    } else if (d.kind === "bspray") ART.bloodSpray(ctx, px, py, g, d.a, d.n, d.L, d.lm); else if (d.kind === "hole") {
      ctx.fillStyle = "#1e1f22";
      ctx.fillRect(px, py, 3, 3);
      ctx.fillStyle = "#6a6b6e";
      ctx.fillRect(px + 2, py - 1, 2, 1);
      ctx.fillRect(px - 1, py + 2, 1, 1);
    } else if (d.kind === "scorch") {
      const P = new ART.Pen(ctx);
      P.oval(px, py, 20, 12, "rgba(20,18,16,0.5)").oval(px, py, 12, 7, "rgba(10,9,8,0.6)");
      for (let k = 0; k < 40; k++) P.p(px + g.i(48) - 24, py + g.i(28) - 14, g.chance(.5) ? "#1a1816" : "#2a2622");
    }
  }
  R.paintDecal = function(F, d) {
    if (d.r) {
      for (let cy = Math.floor((d.y - d.r) / CH); cy <= Math.floor((d.y + d.r) / CH); cy++) for (let cx = Math.floor((d.x - d.r) / CH); cx <= Math.floor((d.x + d.r) / CH); cx++) {
        const c = F.chunks.get(cx + "," + cy);
        if (c) paint(c.getContext("2d"), d, cx, cy);
      }
      return;
    }
    const cx = Math.floor(d.x / CH), cy = Math.floor(d.y / CH);
    const c = F.chunks.get(cx + "," + cy);
    if (c) paint(c.getContext("2d"), d, cx, cy);
  };
  R.resetChunks = F => F.chunks.clear();
  const WH = ART.WALL_H;
  function isWallish(F, x, y) {
    if (F.plateAt && F.plateAt(x, y)) return true;
    if (F.ceilAt && F.ceilAt(x, y)) return true;
    if (F.voidAt && F.voidAt(x, y)) return false;
    const t = F.tile(x, y);
    if (t === T.WALL || t === T.WINDOW) return true;
    if (t === T.DOOR) {
      const d = F.doorAt.get(F.i(x, y));
      return d && !d.horiz;
    }
    return false;
  }
  function isCapish(F, x, y) {
    if (F.plateAt && F.plateAt(x, y)) return true;
    if (F.ceilAt && F.ceilAt(x, y)) return true;
    if (F.voidAt && F.voidAt(x, y)) return false;
    const t = F.tile(x, y);
    return t === T.WALL || t === T.WINDOW || t === T.DOOR;
  }
  function hasFront(F, x, y) {
    return isWallish(F, x, y) && !isWallish(F, x, y + 1);
  }
  function openVDoor(F, x, y) {
    if (F.tile(x, y) !== T.DOOR) return false;
    const d = F.doorAt.get(F.i(x, y));
    return !!(d && !d.horiz);
  }
  function keyLock(ctx, x, y) {
    x = Math.round(x) - 3;
    y = Math.round(y);
    ctx.fillStyle = "#1a1a1e";
    ctx.fillRect(x, y + 3, 7, 6);
    ctx.fillStyle = "#8a8f96";
    ctx.fillRect(x + 1, y, 5, 1);
    ctx.fillRect(x + 1, y, 1, 4);
    ctx.fillRect(x + 5, y, 1, 4);
    ctx.fillStyle = "#d8a830";
    ctx.fillRect(x + 1, y + 4, 5, 4);
    ctx.fillStyle = "#f6d868";
    ctx.fillRect(x + 1, y + 4, 5, 1);
    ctx.fillStyle = "#9a7018";
    ctx.fillRect(x + 1, y + 7, 5, 1);
    ctx.fillStyle = "#2a1c08";
    ctx.fillRect(x + 3, y + 5, 1, 2);
  }
  function winBars(ctx, x, y, fh) {
    const bx = [ 7, 11, 20, 24 ], G = ART.winGeo(fh || WH), t = y + G.y, h = G.h, mids = h > 15 ? [ Math.round(h * .36), Math.round(h * .68) ] : [ 6 ];
    ctx.fillStyle = "#1e2023";
    for (const b of bx) ctx.fillRect(x + b, t, 2, h);
    for (const m of mids) ctx.fillRect(x + 4, t + m, 24, 2);
    ctx.fillStyle = "#5e6368";
    for (const b of bx) ctx.fillRect(x + b, t, 1, h);
    for (const m of mids) ctx.fillRect(x + 4, t + m, 24, 1);
    ctx.fillStyle = "#3a3d41";
    ctx.fillRect(x + 4, t, 24, 1);
    ctx.fillRect(x + 4, t + h - 2, 24, 1);
    ctx.fillStyle = "#8a8f94";
    ctx.fillRect(x + 5, t, 1, 1);
    ctx.fillRect(x + 26, t, 1, 1);
    ctx.fillRect(x + 5, t + h - 2, 1, 1);
    ctx.fillRect(x + 26, t + h - 2, 1, 1);
    const k = h / 15;
    ctx.fillStyle = "#7a4426";
    ctx.fillRect(x + 8, t + Math.round(8 * k), 1, 2);
    ctx.fillRect(x + 21, t + Math.round(2 * k), 1, 1);
    ctx.fillRect(x + 12, t + Math.round(11 * k), 1, 2);
    ctx.fillRect(x + 25, t + Math.round(9 * k), 1, 1);
    ctx.fillStyle = "#9a5a30";
    ctx.fillRect(x + 8, t + Math.round(8 * k) - 1, 1, 1);
    ctx.fillRect(x + 25, t + Math.round(9 * k) - 1, 1, 1);
  }
  function railDraw(ctx, ps, m, tx, ty, px, py) {
    const horiz = !!(m & 10) || !(m & 5), base = py + TS - 2, top = base - 20;
    const G = ps === 1, cPost = G ? "#7d858c" : "#5a3820", cPostL = G ? "#c9d0d6" : "#8a5a34", cDk = G ? "#3e444a" : "#2e1c10", cRail = G ? "#b9c1c8" : "#8a5a34", cRailL = G ? "#e8eef2" : "#b07a48";
    if (horiz) {
      const cl = m & 5 && !(m & 8), cr = m & 5 && !(m & 2), x0 = cl ? px + 14 : px, x1 = cr ? px + 18 : px + TS, W = x1 - x0;
      if (G) {
        ctx.fillStyle = "rgba(160,210,234,0.28)";
        ctx.fillRect(x0, top + 3, W, 16);
        ctx.fillStyle = "rgba(240,250,255,0.5)";
        const r0 = 3 + (tx * 7 + ty * 3) % 13;
        const gl = (x, y) => {
          if (x >= x0 && x < x1) ctx.fillRect(x, y, 1, 1);
        };
        for (let j = 0; j < 10; j++) {
          gl(px + r0 + j, top + 16 - j);
          if (j < 6) gl(px + r0 + j + 4, top + 16 - j);
        }
        ctx.fillStyle = "rgba(120,170,196,0.35)";
        ctx.fillRect(x0, base - 4, W, 2);
      } else {
        ctx.fillStyle = "#6e4628";
        ctx.fillRect(x0, top + 11, W, 2);
        ctx.fillStyle = cDk;
        ctx.fillRect(x0, top + 13, W, 1);
        for (let bx = tx & 1 ? 3 : 6; bx < TS - 1; bx += 6) {
          if (px + bx < x0 || px + bx + 3 > x1) continue;
          ctx.fillStyle = "#6e4628";
          ctx.fillRect(px + bx, top + 3, 2, 15);
          ctx.fillStyle = cDk;
          ctx.fillRect(px + bx + 2, top + 3, 1, 15);
          ctx.fillStyle = "#94643c";
          ctx.fillRect(px + bx, top + 3, 1, 15);
        }
      }
      ctx.fillStyle = cDk;
      ctx.fillRect(x0, base - 2, W, 2);
      ctx.fillStyle = G ? "#5c636a" : "#4a2f1c";
      ctx.fillRect(x0, base - 2, W, 1);
      ctx.fillStyle = cRail;
      ctx.fillRect(x0, top, W, 3);
      ctx.fillStyle = cRailL;
      ctx.fillRect(x0, top, W, 1);
      ctx.fillStyle = cDk;
      ctx.fillRect(x0, top + 3, W, 1);
      const post = x => {
        ctx.fillStyle = cDk;
        ctx.fillRect(x - 1, top - 1, 5, 21);
        ctx.fillStyle = cPost;
        ctx.fillRect(x, top, 3, 19);
        ctx.fillStyle = cPostL;
        ctx.fillRect(x, top, 1, 19);
        ctx.fillStyle = cRailL;
        ctx.fillRect(x, top - 1, 3, 1);
      };
      if (cl || cr) {
        const bx = px + 14;
        ctx.fillStyle = cDk;
        ctx.fillRect(bx - 1, top - 1, 6, 22);
        ctx.fillStyle = cPost;
        ctx.fillRect(bx, top, 4, 19);
        ctx.fillStyle = cPostL;
        ctx.fillRect(bx, top, 1, 19);
        ctx.fillStyle = cRailL;
        ctx.fillRect(bx, top - 1, 4, 1);
      }
      if (!cl && (!(m & 8) || (tx & 1) === 0)) post(px + 1);
      if (!cr && !(m & 2)) post(px + TS - 4);
    } else {
      const bx = px + 14;
      if (G) {
        ctx.fillStyle = "rgba(160,210,234,0.3)";
        ctx.fillRect(bx, py - 17, 4, TS + 15);
        ctx.fillStyle = "rgba(240,250,255,0.5)";
        ctx.fillRect(bx + 1, py - 14 + ty * 5 % 18, 1, 6);
      } else {
        ctx.fillStyle = "#6e4628";
        for (let y = py - 15; y < py + TS - 2; y += 6) ctx.fillRect(bx + 1, y, 2, 4);
      }
      ctx.fillStyle = cDk;
      ctx.fillRect(bx - 1, py - 21, 6, TS + 2);
      ctx.fillStyle = cRail;
      ctx.fillRect(bx, py - 20, 4, TS);
      ctx.fillStyle = cRailL;
      ctx.fillRect(bx, py - 20, 1, TS);
      if (!(m & 4)) {
        ctx.fillStyle = cDk;
        ctx.fillRect(bx - 1, py + TS - 22, 6, 21);
        ctx.fillStyle = cPost;
        ctx.fillRect(bx, py + TS - 21, 4, 19);
        ctx.fillStyle = cPostL;
        ctx.fillRect(bx, py + TS - 21, 1, 19);
      }
    }
  }
  const ceilC = new Map;
  function ceilPlate(ctx, F, tx, ty, px, py) {
    const s = F.secret, ca = (x, y) => isCapish(F, x, y), pl = (x, y) => !!F.ceilAt(x, y);
    const m = (ca(tx, ty - 1) ? 1 : 0) | (ca(tx + 1, ty) ? 2 : 0) | (ca(tx, ty + 1) ? 4 : 0) | (ca(tx - 1, ty) ? 8 : 0);
    const e = (pl(tx, ty - 1) ? 0 : 1) | (pl(tx + 1, ty) ? 0 : 2) | (pl(tx, ty + 1) ? 0 : 4) | (pl(tx - 1, ty) ? 0 : 8), sx = tx - s.x0 & 1;
    const wc = F.wallTok && F.wallTok(tx, s.y0 - 1) || (F.wallColAt ? F.wallColAt(tx, s.y0 - 1) : F.wallCol) || ART.C.capTop;
    const key = m + ":" + e + ":" + sx + wc;
    let c = ceilC.get(key);
    if (!c) {
      c = ART.mk(TS, TS);
      const g = c.getContext("2d"), col = ART.shade(wc, -.07), dk = ART.shade(wc, -.24), lt = ART.shade(wc, .12);
      g.drawImage(ART.wallCap(0, m, col), 0, 0);
      g.fillStyle = dk;
      if (e & 1) g.fillRect(0, 0, TS, 1);
      if (e & 8) g.fillRect(0, 0, 1, TS);
      if (e & 2) g.fillRect(TS - 1, 0, 1, TS);
      if (e & 4) g.fillRect(0, TS - 1, TS, 1);
      if (!sx && !(e & 8)) {
        g.fillRect(0, 0, 1, TS);
        g.fillStyle = lt;
        g.fillRect(1, 0, 1, TS);
      }
      if (e & 1) {
        g.fillStyle = lt;
        g.fillRect(e & 8 ? 1 : 0, 1, TS - (e & 8 ? 1 : 0) - (e & 2 ? 1 : 0), 1);
      }
      ceilC.set(key, c);
    }
    ctx.drawImage(c, px, py - WH);
  }
  function drawWall(ctx, F, tx, ty, px, py) {
    const t = F.t[F.i(tx, ty)], FH = F.wallH || WH;
    if (F.plateAt && F.plateAt(tx, ty)) {
      SX.homeOut.plate(ctx, F, tx, ty, px, py, isCapish);
      return;
    }
    if (F.ceilAt && F.ceilAt(tx, ty)) {
      ceilPlate(ctx, F, tx, ty, px, py);
      return;
    }
    const wc = F.wallTok && F.wallTok(tx, ty) || (F.wallColAt ? F.wallColAt(tx, ty) : F.wallCol || null);
    if (F.voidAt && (t !== T.DOOR || F.storyOff && F.storyOff(tx, ty)) && F.voidAt(tx, ty)) {
      if (F.out) {
        SX.homeOut.cell(ctx, F, tx, ty, px, py, isCapish);
        return;
      }
      ctx.fillStyle = (tx + ty) % 2 ? "#0b0d11" : "#0c0e12";
      ctx.fillRect(px, py, TS, TS);
      if ((tx * 7 + ty * 13) % 23 === 0) {
        ctx.fillStyle = "#3a3320";
        ctx.fillRect(px + 14, py + 14, 2, 2);
      }
      return;
    }
    if (t === T.PARAPET) {
      const par = (x, y) => F.tile(x, y) === T.PARAPET;
      const m = (par(tx, ty - 1) ? 1 : 0) | (par(tx + 1, ty) ? 2 : 0) | (par(tx, ty + 1) ? 4 : 0) | (par(tx - 1, ty) ? 8 : 0);
      const ps = F.parSty ? F.parSty[F.i(tx, ty)] : 0;
      if (ps === 3 && SX.doorPlace && SX.doorPlace.psd) {
        SX.doorPlace.psd(ctx, F, m, tx, ty, px, py);
        return;
      }
      if (ps) {
        railDraw(ctx, ps, m, tx, ty, px, py);
        return;
      }
      const pc = ART.wallCap(1, m);
      if (F.decoR) SX.decoRaid.drawCap(ctx, F, tx, ty, pc, px, py - 8); else ctx.drawImage(pc, px, py - 8);
      if (!(m & 4)) {
        const pf = ART.wallFront(2, tx, (par(tx - 1, ty) ? 0 : 1) | (par(tx + 1, ty) ? 0 : 2));
        if (F.decoR) SX.decoRaid.drawFront(ctx, F, tx, ty, pf, px, py + TS - 8); else ctx.drawImage(pf, px, py + TS - 8);
      }
      return;
    }
    if (t === T.DOOR) {
      const d = F.doorAt.get(F.i(tx, ty));
      if (!d) return;
      if (d.secret && SX.doorPlace && SX.doorPlace.secret) {
        SX.doorPlace.secret(ctx, F, d, tx, ty, px, py, wc);
        return;
      }
      const dn = d.tiles.length, di = d.tiles.indexOf(F.i(tx, ty)), mid = Math.ceil(dn / 2);
      const leaf = dn <= 1 ? 0 : di === mid - 1 ? 1 : di === mid && dn % 2 === 0 ? 2 : 3;
      const sty = SX.doorPlace ? SX.doorPlace.styleOf(F, d) : null;
      if (d.horiz) {
        const m = (isCapish(F, tx - 1, ty) ? 8 : 0) | (isCapish(F, tx + 1, ty) ? 2 : 0) | (isCapish(F, tx, ty - 1) ? 1 : 0) | 4;
        ctx.drawImage(ART.wallCap(0, m, wc), 0, 0, TS, 8, px, py - WH, TS, 8);
        ctx.fillStyle = "#1c1d21";
        ctx.fillRect(px, py - WH + 8, TS, 1);
        const kind = d.open ? d.exit ? 6 : 3 : d.locked ? 5 : 4;
        if (d.open) {
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.fillRect(px, py - WH + 9, TS, WH + 7);
          const first = d.tiles[0] === F.i(tx, ty), last = d.tiles[d.tiles.length - 1] === F.i(tx, ty);
          ctx.fillStyle = "#2a2c30";
          if (first) ctx.fillRect(px, py - WH + 9, 3, WH + 23);
          if (last) ctx.fillRect(px + TS - 3, py - WH + 9, 3, WH + 23);
          if (d.stair && SX.doorPlace && SX.doorPlace.stairOpen) SX.doorPlace.stairOpen(ctx, d.stair, di, px, py - WH + 9); else if (d.home && dn === 2 && (d.hleaf || F.homeLeaf) === "shut" && SX.doorPlace && SX.doorPlace.shutOpen) SX.doorPlace.shutOpen(ctx, di, px, py - WH + 9); else if (sty) SX.doorPlace.drawOpen(ctx, sty, first ? -1 : last && dn > 1 ? 1 : 0, px, py - WH + 9, WH + 23);
          if (d.exit) {
            ctx.fillStyle = "#2f6f35";
            ctx.fillRect(px + 6, py - WH + 10, 20, 4);
            ctx.fillStyle = "#e6f0e0";
            ctx.fillRect(px + 8, py - WH + 11, 4, 2);
            ctx.fillRect(px + 15, py - WH + 11, 8, 2);
          }
        } else if (d.home && (d.hleaf || F.homeLeaf) && dn === 2 && SX.doorPlace && SX.doorPlace.single) {
          const wf = ART.wallFront(0, tx, 0, wc, 0, FH);
          ctx.drawImage(wf, px, py + TS - FH);
          if (F.swAt) {
            const ws = F.swAt(tx, ty);
            if (ws && SX.artSurf) ctx.drawImage(SX.artSurf.wallFront(ws.w, 0, tx, ty, 0, ws.b, wc, FH), px, py + TS - FH);
          }
          ctx.drawImage(SX.doorPlace.single(d.hleaf || F.homeLeaf, kind), di * TS, 0, TS, ART.DOOR_H, px, py - WH + 9, TS, ART.DOOR_H);
        } else {
          ctx.drawImage((sty ? (k, e) => SX.doorPlace.tall(k, e, sty) : ART.doorTall)(kind, (leaf === 2 ? 4 : leaf === 3 ? 8 : 0) | (di < dn - 1 ? 16 : 0) | (di > 0 ? 32 : 0)), px, py - WH + 9);
          if (d.key && d.locked && di === 0) keyLock(ctx, px + TS - 4, py - WH + 24);
        }
      } else if (F.homeLeaf && SX.doorPlace && SX.doorPlace.vdoor && SX.doorPlace.vdoor(ctx, F, d, sty, tx, ty, px, py, FH, (x, y) => isWallish(F, x, y))) {} else if (!d.open) {
        ctx.drawImage(sty ? SX.doorPlace.plank(d.locked, leaf, sty) : ART.doorPlank(d.locked, leaf), px, py - WH);
        if (d.key && d.locked && di === 0) keyLock(ctx, px + 12, py - WH + 18);
        if (!isWallish(F, tx, ty + 1)) {
          ctx.drawImage(ART.wallFront(d.locked ? 5 : 4, tx, 3, wc, 0, FH), px, py + TS - FH);
          if (sty) ctx.drawImage(SX.doorPlace.front(d.locked ? 5 : 4, sty, FH), px, py + TS - FH);
        }
      }
      return;
    }
    const m = (isCapish(F, tx, ty - 1) && !openVDoor(F, tx, ty - 1) ? 1 : 0) | (isCapish(F, tx + 1, ty) ? 2 : 0) | (isWallish(F, tx, ty + 1) && !openVDoor(F, tx, ty + 1) ? 4 : 0) | (isCapish(F, tx - 1, ty) ? 8 : 0);
    const wcp = ART.wallCap(0, m, wc);
    if (FH > WH && !(m & 4)) {
      const ct = TS + WH - FH;
      if (F.decoR) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py - WH, TS, ct - 1);
        ctx.clip();
        SX.decoRaid.drawCap(ctx, F, tx, ty, wcp, px, py - WH);
        ctx.restore();
      } else ctx.drawImage(wcp, 0, 0, TS, ct - 1, px, py - WH, TS, ct - 1);
      ctx.drawImage(wcp, 0, TS - 1, TS, 1, px, py - WH + ct - 1, TS, 1);
    } else if (F.decoR) SX.decoRaid.drawCap(ctx, F, tx, ty, wcp, px, py - WH); else ctx.drawImage(wcp, px, py - WH);
    if (!(m & 4)) {
      if (F.secret && SX.doorPlace && SX.doorPlace.shelfAt && SX.doorPlace.shelfAt(F, tx, ty)) {
        SX.doorPlace.shelfBay(ctx, F, tx, py + TS - FH, px, FH);
        return;
      }
      const ends = (hasFront(F, tx - 1, ty) || F.tile(tx - 1, ty) === T.DOOR && F.doorAt.get(F.i(tx - 1, ty))?.horiz ? 0 : 1) | (hasFront(F, tx + 1, ty) || F.tile(tx + 1, ty) === T.DOOR && F.doorAt.get(F.i(tx + 1, ty))?.horiz ? 0 : 2);
      const h = (tx * 7 + ty * 13) % 29;
      const deco = F.kind === "hub" ? 0 : h === 3 ? 1 : h === 11 ? 2 : h === 17 ? 3 : h === 23 && F.kind === "floor" ? 4 : 0;
      const wf = ART.wallFront(t === T.WINDOW ? 1 : 0, tx, ends, wc, deco, FH);
      if (F.decoR) SX.decoRaid.drawFront(ctx, F, tx, ty, wf, px, py + TS - FH); else ctx.drawImage(wf, px, py + TS - FH);
      const nW = SX.normal && ctx === WMAIN;
      if (nW) SX.normal.wall(wf, px, py + TS - FH);
      if (F.swAt) {
        const ws = F.swAt(tx, ty);
        if (ws && SX.artSurf) {
          const swc = SX.artSurf.wallFront(ws.w, t === T.WINDOW ? 1 : 0, tx, ty, ends, ws.b, wc, FH);
          ctx.drawImage(swc, px, py + TS - FH);
          if (nW) SX.normal.wallOver(swc);
        }
      }
      if (F.wallBlood && F.decals.length) {
        const wb = F.wallBlood.get(F.i(tx, ty));
        if (wb) for (const d of wb) ctx.drawImage(ART.wallBlood(d, FH), px, py + TS - FH);
      }
      if (t === T.WINDOW && F.winBars) winBars(ctx, px, py + TS - FH, FH);
      if (t === T.WINDOW && F.winPre && F.winPre.has(F.i(tx, ty))) ctx.drawImage(ART.winBroke(FH), px, py + TS - FH);
    } else if (t === T.WINDOW) {
      ctx.fillStyle = ART.C.glassDk;
      ctx.fillRect(px + 12, py - WH + 2, 8, TS - 4);
      ctx.fillStyle = ART.C.glass;
      ctx.fillRect(px + 13, py - WH + 2, 6, TS - 4);
      ctx.fillStyle = ART.C.glass2;
      ctx.fillRect(px + 13, py - WH + 2, 2, 10);
    }
  }
  const flashOf = new WeakMap;
  function flashSpr(src) {
    let c = flashOf.get(src);
    if (!c) {
      const W = src.width, H = src.height;
      c = ART.mk(W, H);
      const x = c.getContext("2d");
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = "source-atop";
      x.fillStyle = "rgba(255,255,255,0.6)";
      x.fillRect(0, 0, W, H);
      const o = src.getContext("2d").getImageData(0, 0, W, H).data, im = x.getImageData(0, 0, W, H), d = im.data;
      for (let i = 0; i < d.length; i += 4) if (o[i + 3] <= 190) {
        d[i] = o[i];
        d[i + 1] = o[i + 1];
        d[i + 2] = o[i + 2];
        d[i + 3] = o[i + 3];
      }
      x.putImageData(im, 0, 0);
      flashOf.set(src, c);
    }
    return c;
  }
  const flashColOf = new WeakMap, flashHex = h => ART.shade(h, .6);
  function flashCol(col) {
    let c = flashColOf.get(col);
    if (!c) {
      c = {
        up: col.up.map(flashHex),
        low: col.low.map(flashHex),
        hand: col.hand.map(flashHex)
      };
      flashColOf.set(col, c);
    }
    return c;
  }
  function keyHands(dir, now) {
    const w = Math.round(Math.sin(now * 18));
    return dir === 1 ? {
      n: [ 9, -21 + w ],
      f: [ 7, -19 ]
    } : dir === 3 ? {
      n: [ -10, -21 + w ],
      f: [ -8, -19 ]
    } : dir === 2 ? {
      n: [ -3, -22 ],
      f: [ 3, -22 ]
    } : {
      n: [ -2, -18 + w ],
      f: [ 3, -18 ]
    };
  }
  function typeHands(dir, now) {
    const u = Math.round(Math.sin(now * 26)), v = -u;
    return dir === 1 ? {
      n: [ 9, -19 + u ],
      f: [ 8, -17 + v ]
    } : dir === 3 ? {
      n: [ -10, -19 + u ],
      f: [ -9, -17 + v ]
    } : dir === 2 ? {
      n: [ -5, -22 + u ],
      f: [ 5, -22 + v ]
    } : {
      n: [ -5, -17 + u ],
      f: [ 5, -17 + v ]
    };
  }
  function pushHands(dir, k) {
    const p = Math.round(Math.max(0, Math.min(1, k)) * 3);
    return dir === 1 ? {
      n: [ 9 + p, -21 ],
      f: [ 8 + p, -17 ]
    } : dir === 3 ? {
      n: [ -10 - p, -21 ],
      f: [ -9 - p, -17 ]
    } : dir === 2 ? {
      n: [ -5, -23 - p ],
      f: [ 5, -23 - p ]
    } : {
      n: [ -5, -17 + p ],
      f: [ 5, -17 + p ]
    };
  }
  function reviveHands(dir, now) {
    const pm = Math.round(Math.abs(Math.sin(now * 5)) * 2);
    if (dir === 1) return {
      n: [ 13, -4 + pm ],
      f: [ 15, -6 + pm ]
    };
    if (dir === 3) return {
      n: [ -14, -4 + pm ],
      f: [ -16, -6 + pm ]
    };
    if (dir === 2) return {
      n: [ -7, -8 + pm ],
      f: [ 6, -8 + pm ]
    };
    return {
      n: [ -10, -2 + pm ],
      f: [ 9, -2 + pm ]
    };
  }
  function drawDown(ctx, a, px, py, now, dim) {
    const PO = SX.pose, spec = a.spec, fr = a.frame || 0, fl = Math.cos(a.aim || 0) < 0, fb = fl ? -1 : 1;
    ctx.save();
    if (dim) ctx.globalAlpha *= dim;
    if (a.flinch > 0 || a.hurtT > .35) ctx.globalAlpha *= .85;
    if (a.moving && !spec.custom) {
      const spr = ART.char(spec, fl ? 3 : 1, fr, "crawl");
      ctx.drawImage(a.flinch > 0 ? flashSpr(spr) : spr, px - ART.CHAR_OX, py - ART.CHAR_OY);
      ctx.restore();
      return;
    }
    const wig = a.moving ? Math.round(Math.sin(now * 12) * 2) : 0;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(px + fb * 12, py + 1, 22, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const na = !!PO && !spec.keepArms;
    const spr = ART.char(spec, 0, 0, na ? "walk-na" : "walk");
    ctx.save();
    ctx.translate(px + wig, py - 3);
    ctx.rotate(fb * Math.PI / 2);
    ctx.drawImage(a.flinch > 0 ? flashSpr(spr) : spr, -ART.CHAR_OX, -ART.CHAR_OY);
    ctx.restore();
    if (na) {
      const col = a.flinch > 0 ? flashCol(PO.colors(spec)) : PO.colors(spec);
      const sh = PO.shoulders(0), rot = q => [ px + wig - fb * q[1], py - 3 + fb * q[0] ];
      const top = rot(fb > 0 ? sh.near : sh.far), low = rot(fb > 0 ? sh.far : sh.near);
      const wave = a.moving ? 0 : Math.round(Math.sin(now * 2.5) * 2);
      PO.arm(ctx, low[0], low[1], px + wig + fb * 4, low[1] + 5, col, true, {
        out: -fb,
        outW: .4
      });
      PO.arm(ctx, top[0], top[1], top[0] + fb * 2, top[1] - (a.moving ? 4 : 11) + wave, col, false, {
        out: fb,
        outW: .6
      });
    }
    ctx.restore();
  }
  const GRIP_L = [ [ -90, 1, -21, 1, -21 ], [ -45, 4.5, -19, 4.5, -19 ], [ 0, 6, -16, 6, -15.5 ], [ 15, 5.5, -16, 5.5, -15.5 ], [ 45, -3, -15, -3, -12 ], [ 70, -2.5, -14.5, -2.5, -12 ], [ 90, -2, -14, -2, -12 ] ];
  const GRIP_P = [ [ -90, 1, -21, 1, -21 ], [ -45, 4.5, -19, 4.5, -19 ], [ 0, 8, -17, 5, -12 ], [ 45, 4, -14, 3, -11 ], [ 90, 2, -14, 2, -11.5 ] ];
  const gripAt = (tb, al) => {
    let i = 1;
    while (i < tb.length - 1 && al > tb[i][0]) i++;
    const p0 = tb[i - 1], p1 = tb[i], u = Math.max(0, Math.min(1, (al - p0[0]) / (p1[0] - p0[0])));
    return [ p0[1] + (p1[1] - p0[1]) * u, p0[2] + (p1[2] - p0[2]) * u, p0[3] + (p1[3] - p0[3]) * u, p0[4] + (p1[4] - p0[4]) * u ];
  };
  let WCUR = 0, WMAIN = null;
  function wOn() {
    const R = SX.raid;
    return !!(R && R.flood && R.on && SX.game && SX.game.state === "raid");
  }
  function wDepthOf(a) {
    return a && !a.dead && a.floor != null && wOn() ? SX.raid.wDepth(a.floor) : 0;
  }
  const WCUT = [ [ 0, 0 ], [ .5, 6 ], [ .95, 12 ], [ 1.3, 18 ] ];
  function wCut(d) {
    for (let i = 1; i < WCUT.length; i++) {
      const p = WCUT[i - 1], q = WCUT[i];
      if (d <= q[0]) return p[1] + (q[1] - p[1]) * (d - p[0]) / (q[0] - p[0]);
    }
    return 18;
  }
  function swimHands(dir, now) {
    const arm = k => {
      const u = (now / 1.4 + k) % 1, t = u < .5 ? u / .5 : (u - .5) / .5, up = u < .5;
      if (dir === 1 || dir === 3) {
        const s = dir === 1 ? 1 : -1, x = up ? 2 + 10 * t : 12 - 10 * t, y = up ? -20 - 5 * Math.sin(Math.PI * t) : -19 + 5 * Math.sin(Math.PI * t);
        return [ Math.round(s * x - (s < 0 ? 1 : 0)), Math.round(y) ];
      }
      const sx = k ? 7 : -8, y = up ? -21 - 6 * Math.sin(Math.PI * t) : -19 + 6 * Math.sin(Math.PI * t), x = sx + (up ? 0 : Math.sign(sx) * -2 * Math.sin(Math.PI * t));
      return [ Math.round(x), Math.round(dir === 2 ? y - 1 : y) ];
    };
    return {
      n: arm(0),
      f: arm(.5)
    };
  }
  function pring(ctx, cx, cy, rx, ry, a0, a1, col) {
    ctx.fillStyle = col;
    const n = Math.max(8, Math.round(rx * 3)), seen = new Set;
    for (let i = 0; i <= n; i++) {
      const t = a0 + (a1 - a0) * i / n, x = Math.round(cx + Math.cos(t) * rx), y = Math.round(cy + Math.sin(t) * ry), k = x * 4096 + y;
      if (seen.has(k)) continue;
      seen.add(k);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  function wMoving(a, now) {
    if (a._wT !== now) {
      a._wMv = a._wX != null && Math.abs(a.x - a._wX) + Math.abs(a.y - a._wY) > 5e-4;
      a._wX = a.x;
      a._wY = a.y;
      a._wT = now;
      if (a._wMv) a._wLast = now;
    }
    return a._wLast != null && now - a._wLast < .35;
  }
  function wRing(ctx, a, px, wy, lv, now, front) {
    const r = lv >= 4 ? 10 : lv === 3 ? 9 : lv === 2 ? 8 : 6, ry = Math.max(2, Math.round(r * .32)), mv = wMoving(a, now), seed = (a.x * .37 + a.y * .61) % 1;
    const a0 = front ? 0 : Math.PI, a1 = front ? Math.PI : Math.PI * 2;
    pring(ctx, px, wy, r, ry, a0, a1, "rgba(196,214,200," + (mv ? .55 : .32 + .1 * Math.sin(now * 2 + seed * 6)).toFixed(2) + ")");
    if (!front) return;
    if (mv) {
      for (let i = 0; i < 2; i++) {
        const ph = (now * 1.5 + i * .5 + seed) % 1;
        pring(ctx, px, wy + 1, r + 2 + ph * 9, ry + 1 + ph * 3, .15, Math.PI - .15, "rgba(196,214,200," + ((1 - ph) * .35).toFixed(2) + ")");
      }
      if (lv <= 3) for (let j = 0; j < 4; j++) {
        const ph = (now * 2.4 + j * .25 + seed) % 1, s = j % 2 ? 1 : -1;
        ctx.fillStyle = "rgba(214,228,218," + ((1 - ph) * .75).toFixed(2) + ")";
        ctx.fillRect(Math.round(px + s * (3 + ph * (5 + j))), Math.round(wy - Math.sin(ph * Math.PI) * (4 + lv * 2)), 1, 1);
      }
    }
  }
  function diveGhost(ctx, a, cam, now, dim, px, py) {
    drawActor0(ctx, a, cam, now, (dim || 1) * .2);
    if (ctx !== WMAIN) return;
    const seed = (a.x * .13 + a.y * .29) % 1;
    for (let j = 0; j < 4; j++) {
      const ph = (now * .6 + j * .27 + seed) % 1, x = Math.round(px + (j - 1.5) * 2 + Math.sin(ph * 9 + j * 2) * 2), y = Math.round(py - 30 - ph * 28), s = ph < .45 ? 1 : 2;
      ctx.fillStyle = "rgba(205,225,220," + ((1 - ph) * .7).toFixed(2) + ")";
      ctx.fillRect(x, y, s, s);
    }
  }
  function drawActor(ctx, a, cam, now, dim) {
    return a.chem && SX.chem ? SX.chem.drawBody(ctx, a, cam, now, dim, drawActorW) : drawActorW(ctx, a, cam, now, dim);
  }
  function drawActorW(ctx, a, cam, now, dim) {
    const d = wDepthOf(a);
    if (!(d >= .05)) return drawActor0(ctx, a, cam, now, dim);
    const lv = SX.raid.wLvAt(d), px = Math.round(a.x * TS - cam.x), py = Math.round(a.y * TS - cam.y), main = ctx === WMAIN;
    if (lv >= 5) {
      diveGhost(ctx, a, cam, now, dim, px, py);
      return;
    }
    const zomb = a.type === "zombie" || a.spec && a.spec.kind === "zombie";
    const cut = lv >= 4 ? 21 : Math.round(Math.min(lv === 3 ? 15 : 18, wCut(d))), wy = py - cut + (lv >= 4 ? Math.round(Math.sin(now * 2.6 + a.x) * .8) : 0);
    const sw = zomb && lv >= 2 ? Math.round(Math.sin(now * 2.1 + a.y * 3) * 1) : 0;
    if (main) wRing(ctx, a, px, wy, lv, now, false);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px - 480, wy - 480, 960, 480);
    ctx.clip();
    if (sw) ctx.translate(sw, 0);
    WCUR = lv;
    try {
      drawActor0(ctx, a, cam, now, dim);
    } finally {
      WCUR = 0;
      ctx.restore();
    }
    if (main) wRing(ctx, a, px, wy, lv, now, true);
  }
  const WPAT = [ null, null ];
  let WTT = 0;
  function wPat(ctx, L) {
    if (WPAT[L | 0]) return WPAT[L | 0];
    const PW = L ? 224 : 192, PH = L ? 112 : 96, NL = L ? 95 : 70;
    const c = document.createElement("canvas");
    c.width = PW;
    c.height = PH;
    const g = c.getContext("2d");
    let s = L ? 20261110 : 20261101;
    const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < NL; i++) {
      const x = Math.floor(rnd() * PW), y = Math.floor(rnd() * PH), w = 3 + Math.floor(rnd() * 10), lt = rnd() < .62;
      g.fillStyle = lt ? "rgba(200,214,198,0.13)" : "rgba(14,20,18,0.20)";
      g.fillRect(x, y, w, 1);
      if (x + w > PW) g.fillRect(x - PW, y, w, 1);
      if (lt && rnd() < .4) {
        g.fillRect(x + 2, y - 1, Math.max(1, w - 4), 1);
      }
    }
    return WPAT[L | 0] = ctx.createPattern(c, "repeat");
  }
  function waterFloor(ctx, F, cam, vw, vh, d, now) {
    const tt = WTT = Math.floor(now * 6) / 6;
    let x0 = 0, y0 = 0, x1 = vw, y1 = vh;
    if (!F.out) {
      x0 = Math.max(0, Math.round(-cam.x));
      y0 = Math.max(0, Math.round(-cam.y));
      x1 = Math.min(vw, Math.round(F.W * TS - cam.x));
      y1 = Math.min(vh, Math.round(F.H * TS - cam.y));
    }
    if (x1 <= x0 || y1 <= y0) return;
    const k = Math.min(1, d / 1.6), al = .34 + .42 * k;
    ctx.save();
    ctx.fillStyle = "rgba(" + Math.round(74 - 34 * k) + "," + Math.round(66 - 6 * k) + "," + Math.round(44 + 12 * k) + "," + al.toFixed(3) + ")";
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let L = 0; L < 2; L++) {
      const PW = L ? 224 : 192, PH = L ? 112 : 96, ox = (Math.round(-cam.x + tt * (L ? -4 : 6)) % PW + PW) % PW, oy = (Math.round(-cam.y + tt * (L ? 1.5 : 2.5)) % PH + PH) % PH;
      ctx.fillStyle = wPat(ctx, L);
      ctx.globalAlpha = L ? .55 : 1;
      ctx.translate(ox, oy);
      ctx.fillRect(x0 - ox, y0 - oy, x1 - x0, y1 - y0);
      ctx.translate(-ox, -oy);
    }
    ctx.restore();
  }
  function wallWet(ctx, F, tx, ty, wx, wy, d, t) {
    if (t === T.PARAPET || isWallish(F, tx, ty + 1)) return;
    const FH = F.wallH || WH, ph = ((Math.imul(tx, 374761393) ^ Math.imul(ty, 668265263)) >>> 0) / 4294967296 * Math.PI * 2;
    const h = Math.min(FH, Math.max(1, Math.round(d * FH / 4) + Math.round(.5 + .5 * Math.sin(Math.PI * 2 * WTT / 8 + ph))));
    ctx.fillStyle = "rgba(44,58,50,0.58)";
    ctx.fillRect(wx, wy + TS - h, TS, h);
    ctx.fillStyle = "rgba(176,198,182,0.42)";
    ctx.fillRect(wx, wy + TS - h, TS, 1);
  }
  let WSC = null;
  function propWet(ctx, img, x, y, d) {
    const W = img.width, H = img.height, h = Math.min(H, Math.round(d * 16));
    if (h < 1 || !W) return;
    if (!WSC) {
      WSC = document.createElement("canvas");
      WSC.width = 128;
      WSC.height = 64;
    }
    if (WSC.width < W || WSC.height < h) {
      WSC.width = Math.max(WSC.width, W);
      WSC.height = Math.max(WSC.height, h);
    }
    const g = WSC.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, W, h);
    g.drawImage(img, 0, H - h, W, h, 0, 0, W, h);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(44,58,48,0.62)";
    g.fillRect(0, 0, W, h);
    g.fillStyle = "rgba(176,198,182,0.5)";
    g.fillRect(0, 0, W, 1);
    g.globalCompositeOperation = "source-over";
    ctx.drawImage(WSC, 0, 0, W, h, x, y + H - h, W, h);
  }
  function drawActor0(ctx, a, cam, now, dim) {
    if (a.dead) return;
    if (a.misDraw) return a.misDraw(ctx, a, cam, now, dim);
    const MB = SX.motion ? SX.motion.pre(a, now) : null;
    const SZ = SX.pose && SX.pose.stairAt ? SX.pose.stairAt(a) : null;
    const KO = a.lnT0 != null || a.hsT ? SX.actors.kbOff(a, now) : null;
    const px = Math.round(a.x * TS - cam.x) + (MB ? MB.ox : 0) + (KO ? KO[0] : 0), py = Math.round(a.y * TS - cam.y) + (MB ? MB.oy : 0) + (SZ ? SZ.dy : 0) + (KO ? KO[1] : 0);
    if ((a.kind === "player" || a.kind === "ally") && a.alive === false && a.spec) {
      if (a._deadAt == null) a._deadAt = performance.now() / 1e3;
      const w = a.kind === "player" ? A.weaponOf(a) : a.gunDef || null, aim = a.kind === "player" ? a.aim || 0 : a.face || 0;
      const body = a._body || (a._body = {
        spec: a.spec,
        type: "scav",
        dir: a.dir,
        face: aim,
        armed: !!(w && w.kind === "gun"),
        gun: w && w.kind === "gun" ? w.name : null,
        _t0: a._deadAt,
        scale: 1
      });
      drawCorpse(ctx, {
        px: a.x - .5,
        py: a.y - .5,
        flipX: Math.cos(aim) > 0,
        body,
        cont: null
      }, cam);
      return;
    }
    if (a._deadAt != null) {
      a._deadAt = null;
      a._body = null;
    }
    if (a.down && a.spec && (a.kind === "player" || a.kind === "peer") && !(MB && MB.pose)) {
      drawDown(ctx, a, px, py, now, dim);
      return;
    }
    if (a.boxOn) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(px - 15, py - 1, 30, 4);
      const ic = ART.icon(SX.items.def("종이상자"));
      if (ic) {
        const w = 30, h = Math.round(ic.height * w / ic.width);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(ic, px - w / 2, py - h + 4, w, h);
      }
      ctx.fillStyle = "#2a2622";
      ctx.fillRect(px - 7, py - 3, 5, 4);
      ctx.fillRect(px + 2, py - 3, 5, 4);
      return;
    }
    if (a.laser && a.alive) {
      const F = SX.game.floorObj(), ang = a.aimA != null ? a.aimA : a.face;
      let d = .8;
      if (F) while (d < 40 && !F.blocked(a.x + Math.cos(ang) * d, a.y - .5 + Math.sin(ang) * d + .45, true)) d += .4;
      const x0 = px + Math.cos(ang) * 10, y0 = py - 17 + Math.sin(ang) * 10, x1 = px + Math.cos(ang) * d * TS, y1 = py - 17 + Math.sin(ang) * d * TS;
      ctx.save();
      ctx.fillStyle = "rgba(255,40,30," + (.35 + .3 * Math.abs(Math.sin(now * 12))) + ")";
      dotLine(ctx, Math.floor(x0), Math.floor(y0), Math.round(x1), Math.round(y1));
      ctx.fillStyle = "#ff5a4a";
      ctx.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 3, 3);
      ctx.restore();
    }
    if (a.variant === "dog") {
      const ds = ART.dog(a.frame || 0, Math.cos(a.face || 0) < 0);
      ctx.save();
      if (dim) ctx.globalAlpha *= dim;
      ctx.drawImage(a.flinch > 0 ? flashSpr(ds) : ds, px - ART.DOG_OX, py - ART.DOG_OY);
      ctx.restore();
      return;
    }
    let dir = a.dir;
    const fr = MB && MB.pose ? 0 : SZ && SZ.fr != null ? SZ.fr : a.hsT > now ? a.hsF | 0 : a.frame || 0;
    const TP = SX.tac && SX.tac.pose ? SX.tac.pose(a, now, dir) : null;
    const ML = SX.melee ? SX.melee.pose(a, (a.kind === "player" || a.kind === "peer" ? a.aim : a.face) || 0) : null;
    const LEAN_HIP = 29, LEAN_H = ART.CHAR_H, lnX = TP ? TP.lx | 0 : ML ? ML.lean : a.lnT0 != null ? SX.actors.kbLean(a, now) : 0, lnHip = Math.round(lnX * .22);
    const leanAt = y => y >= LEAN_HIP ? lnHip * (LEAN_H - y) / (LEAN_H - LEAN_HIP) : lnHip + (lnX - lnHip) * Math.pow((LEAN_HIP - y) / LEAN_HIP, 1.2);
    const hX = Math.round(leanAt(20)), hY = 0, fX = Math.round(leanAt(8)), AP = (WCUR >= 4 ? swimHands(dir, now) : null) || TP && TP.hands || a.armPose || (a.keyT > 0 ? keyHands(dir, now) : null) || (a.typeT > 0 ? typeHands(dir, now) : null) || (a.pushUntil > now ? pushHands(dir, 1 - (a.pushUntil - now) / (a.pushDur || .8)) : null) || (a.reviving != null ? reviveHands(dir, now) : null) || (a.nvT > 0 && SX.nvg ? SX.nvg.hands(dir, a) : null);
    const RV = a.reviving != null;
    let sqd = Math.max(a.squat > 0 ? Math.round(Math.min(1, a.squat) * 7) : 0, TP ? TP.sq | 0 : 0);
    let duck = (a.crouch ? 4 : RV ? ART.SIT_DY : 0) - (a.kind === "player" && SX.hub && SX.hub.ex && SX.hub.ex.role === "exRope" && SX.hub.ex.g.jumpT > 0 ? 14 : 0) - (a.hop || 0) + sqd + (TP ? TP.duck | 0 : 0);
    if (MB) {
      SX.motion.vert(a, now, duck - sqd, sqd);
      sqd = MB.sqd;
      duck = MB.base + MB.sqd;
    }
    const weapon0 = a.kind === "player" ? A.weaponOf(a) : a.kind === "ally" ? a.gunDef || a.meleeDef || SX.items.def("K2 소총") : a.kind === "peer" ? a.isAlly ? a.gunDef || a.meleeDef : a.weaponDef : a.type === "scav" ? a.armed ? SX.items.def(a.gun) : a.melee : null;
    const weapon = WCUR >= 4 || a.use || a.keyT > 0 || a.typeT > 0 || a.pushUntil > now || a.reviving != null || a.nvT > 0 || TP && TP.hide || a.down ? null : ML ? SX.melee.held(a, weapon0) : weapon0;
    const aim = a.kind === "player" || a.kind === "peer" ? a.aim || 0 : a.face || 0;
    const PO = SX.pose, zomb = a.type === "zombie" || a.spec && a.spec.kind === "zombie";
    const wp = weapon && !a.hideWeapon ? ART.weapon(weapon) : null;
    const fists = !weapon && !a.hideWeapon && !a.use && (a.kind === "player" ? !!(a.fists || SX.game && SX.game.inRaid && !SX.game.inRaid() && false || a.swing > 0 && !ML) : !!a.spar);
    let armMode = !PO || zomb || a.crawler || a.spec && a.spec.keepArms ? null : AP ? "pose" : wp ? "hold" : a.use ? "use" : fists ? "fists" : null;
    if (MB && PO && !zomb && !a.crawler && !(a.spec && a.spec.keepArms)) {
      if (!armMode && !a.bodyPose && !RV && !MB.pose && a.spec && SX.motion.walking(a)) armMode = "walk";
      if (!armMode && SX.motion.pressing(a, now)) armMode = "hang";
      if (SX.motion.hang(a, now, !!armMode)) armMode = "hang";
    }
    const bodyPose = MB && MB.pose ? MB.pose : a.crawler ? "crawl" : RV ? "sit" : a.bodyPose || "walk";
    const bsit = bodyPose === "benchSit" ? ART.BSIT_DY : 0;
    const fa = a.kind === "player" || a.kind === "peer" ? a.aim : a.face;
    let dg = -1;
    if (SX.turn && a.spec && !TP && !AP && !a.crawler && !(a.squat > 0) && bodyPose === "walk" && typeof fa === "number" && isFinite(fa) && !(a.kind === "player" && SX.hub && SX.hub.ex)) {
      const c = Math.cos(fa), s = Math.sin(fa), t = Math.atan2(Math.abs(s), Math.abs(c));
      const q = s > 0 ? c > 0 ? 0 : 3 : c > 0 ? 1 : 2, m = a._dg === q ? -.08 : .08;
      if (t > Math.PI / 8 + m && t < Math.PI * 3 / 8 - m && (dir === q || dir === (q + 1) % 4) && A.dirOf(fa) === dir) dg = q;
    }
    if (a.spinQ >= 0 && bodyPose === "benchSit" && SX.turn && a.spec) dg = a.spinQ & 3;
    a._dg = dg;
    const spec = SX.nvg ? SX.nvg.specOf(a) : a.spec;
    let tv = -1, turnW = null;
    if (SX.turn && SX.turn.ease && a.spec) {
      const tok = !TP && !AP && !a.crawler && !(a.squat > 0) && bodyPose === "walk" && !(a.kind === "player" && SX.hub && SX.hub.ex);
      const w = SX.turn.ease(a, tok ? dg >= 0 ? SX.turn.vaQ(dg) : (dir & 3) * 90 : null, now, spec, fr, armMode ? bodyPose + "-na" : bodyPose);
      if (w) {
        w.off = dg >= 0 ? dg <= 1 ? 1 : -1 : dir === 1 ? 2 : dir === 3 ? -2 : 0;
        turnW = w;
        dg = w.dg;
        dir = w.dir;
        tv = w.tv;
      }
    }
    let spr = tv >= 0 ? SX.turn.getA(spec, tv, fr, armMode ? bodyPose + "-na" : bodyPose) : dg >= 0 ? SX.turn.get(spec, dg, fr, armMode ? bodyPose + "-na" : bodyPose) : null;
    if (!spr) {
      dg = -1;
      tv = -1;
      spr = ART.char(spec, bodyPose === "lie" ? 0 : dir, fr, armMode ? bodyPose + "-na" : bodyPose);
    }
    const behind = dg >= 0 ? dg === 1 || dg === 2 : dir === 2;
    const sideV = dg < 0 && (dir === 1 || dir === 3);
    const bob = !zomb && [ 0, 1, 0, -1 ][fr % 4] !== 0 ? 1 : 0;
    let wx = px + (ML ? ML.dx : a.swing > 0 ? Math.cos(aim) * 6 : 0) + (turnW ? turnW.off : dg >= 0 ? dg <= 1 ? 1 : -1 : dir === 1 ? 2 : dir === 3 ? -2 : 0) + hX, wy = py - 17 + duck + hY + (ML ? ML.dy : 0);
    let wang = aim;
    if (ML && weapon && weapon.kind === "melee") wang = ML.ang; else if (weapon && weapon.kind === "melee" && a.swing > 0) wang += (a.swing / .25 - .5) * 2.2;
    const wBack = !!(ML && weapon && weapon.kind === "melee" && !behind && ML.wy < -.45 && (!sideV || ML.wx * Math.cos(aim) < .05));
    if (MB && a.press && weapon) wang = SX.motion.pressAng(a, now, wang);
    const wflip = Math.cos(aim) < 0, kick = (a.kick || 0) * -4;
    const wAt = (lx, ly) => {
      const yy = wflip ? -ly : ly, c = Math.cos(wang), s = Math.sin(wang);
      return [ wx + lx * c - yy * s, wy + lx * s + yy * c ];
    };
    a._gunOff = null;
    const gripOn = !!(armMode === "hold" && !ML && !(a.swing > 0) && weapon && weapon.kind === "gun" && wp);
    let gripS = 0, stockB = null, longG = false;
    if (gripOn) {
      const shortG = weapon.cls === "pistol" || weapon.cls === "revolver" || wp.c.width < 24;
      const tg0 = a.aimHeld || a.laser || a.muzzleT > -1 || a.ai === "chase" ? 1 : 0, tg = WCUR === 3 ? 1 : tg0, tc = SX.motion && SX.motion.tnow != null ? SX.motion.tnow : typeof now === "number" ? now : performance.now() / 1e3;
      const mt = Math.cos(aim) < 0 ? -1 : 1;
      let q = a._grip;
      if (!q) q = a._grip = {
        rd: tg,
        t: tc,
        ms: mt,
        mx: mt,
        G: null,
        one: 1
      }; else {
        const dt = tc - q.t, st = dt < 0 || dt > .5;
        if (st || Math.abs(Math.cos(aim)) > .2) q.ms = mt;
        q.rd = st ? tg : q.rd + Math.max(-dt / .3, Math.min(dt / .08, tg - q.rd));
        q.mx = st ? q.ms : q.mx + Math.max(-dt / .06, Math.min(dt / .06, q.ms - q.mx));
        q.t = tc;
      }
      const r = q.rd * q.rd * (3 - 2 * q.rd), m = q.mx, gp = gripAt(shortG ? GRIP_P : GRIP_L, Math.atan2(Math.sin(aim), Math.abs(Math.cos(aim))) * 180 / Math.PI);
      q.one = shortG && !a.reload ? r : 1;
      const wq = WCUR === 3 && !tg0 ? 1 : 0, wdt = tc - (q.wtT == null ? tc : q.wtT);
      q.wt = q.wt == null || wdt < 0 || wdt > .5 ? wq : q.wt + Math.max(-wdt / .1, Math.min(wdt / .25, wq - q.wt));
      q.wtT = tc;
      if (q.wt > 0) wang = aim - mt * .6 * Math.abs(Math.cos(aim)) * q.wt;
      const gx = px + hX + m * (gp[2] + (gp[0] - gp[2]) * r), gy = py + gp[3] + (gp[1] - gp[3]) * r + duck + hY + bsit + bob * (1 - r) - 4 * (q.wt || 0);
      const c = Math.cos(wang), s = Math.sin(wang), yy = wflip ? -1 : 1, mz = wp.c.width - wp.gx + 4, kb = (a.kind === "player" || a.kind === "peer" ? .7 : .6) * TS;
      wx = gx - (4 * c - yy * s);
      wy = gy - (4 * s + yy * c);
      a._gunOff = [ wx + mz * c - px - kb * Math.cos(aim), wy + mz * s - py + .55 * TS - kb * Math.sin(aim) ];
      q.G = [ +(gx - px).toFixed(1), +(gy - py).toFixed(1) ];
      if (!behind && !sideV) gripS = (shortG ? 1 : -1) * (Math.sign(m) || mt);
      longG = !shortG;
      if (!behind && !sideV && !shortG && Math.sin(wang) > .2) stockB = 3 + kick;
    }
    let hands = null;
    if (armMode) {
      const sh = tv >= 0 ? SX.turn.shAt(tv) : dg >= 0 ? PO.shouldersQ(dg) : PO.shoulders(dir), S = {
        n: [ px + sh.near[0] + hX, py + sh.near[1] + duck + bob + hY + bsit ],
        f: [ px + sh.far[0] + hX, py + sh.far[1] + duck + bob + hY + bsit ]
      };
      const outS = k => Math.sign(S[k][0] - px - hX) || (k === "n" ? -1 : 1);
      const hang = k => [ S[k][0] + (sideV ? dir === 1 ? 1 : -1 : outS(k)), S[k][1] + 10 ];
      if (armMode === "pose") {
        const q = AP, lh = h => TP && TP.hands && lnX ? Math.round(leanAt(ART.CHAR_OY + h[1])) : 0;
        hands = {
          n: q.n ? [ px + q.n[0] + lh(q.n), py + q.n[1] + duck ] : hang("n"),
          f: q.f ? [ px + q.f[0] + lh(q.f), py + q.f[1] + duck ] : hang("f")
        };
        if (q.ne || q.fe) hands.E = {
          n: q.ne ? [ px + q.ne[0], py + q.ne[1] + duck ] : null,
          f: q.fe ? [ px + q.fe[0], py + q.fe[1] + duck ] : null
        };
      } else if (armMode === "use") {
        hands = sideV ? {
          n: [ px + (dir === 1 ? 5 : -6), py - 20 + duck ],
          f: [ px + (dir === 1 ? 7 : -8), py - 22 + duck ]
        } : {
          n: [ px - 2, py - 19 + duck ],
          f: [ px + 2, py - 20 + duck ]
        };
      } else if (armMode === "fists") {
        const t = a.swing > 0 ? a.spar && a.windT != null ? -.3 : Math.max(0, 1 - Math.abs(a.swing / .22 - .5) * 2) : 0;
        const ca = Math.cos(aim), sa = Math.sin(aim), side = sideV;
        const g = side ? {
          n: [ px + (dir === 1 ? 5 : -6), py - 23 + duck ],
          f: [ px + (dir === 1 ? 7 : -8), py - 25 + duck ]
        } : {
          n: [ px - 4, py - 23 + duck ],
          f: [ px + 3, py - 23 + duck ]
        };
        const k = (a.punchN | 0) % 2 ? "f" : "n";
        g[k] = [ g[k][0] + ca * 11 * t, g[k][1] + sa * 11 * t ];
        hands = g;
      } else if (armMode === "hold") {
        const sFar = gripS && !behind && longG && weapon && weapon.kind === "gun" && !a.reload && !ML;
        const fo = PO.foreOf(weapon, wp);
        const rear = wAt(4 + kick, 1);
        let front = null;
        if (fo) {
          let fl = 4 + kick + fo.x - wp.gx, fy = fo.y - wp.gy;
          if (sFar) {
            const M = wp.c._fm || (wp.c._fm = {});
            if (M[fo.x] == null) {
              const dd = wp.c.getContext("2d").getImageData(fo.x, 0, 1, wp.c.height).data;
              let t = -1, b = -1;
              for (let y = 0; y < wp.c.height; y++) if (dd[y * 4 + 3] > 100) {
                if (t < 0) t = y;
                b = y;
              }
              M[fo.x] = t < 0 ? fo.y : t - 1;
            }
            fy = M[fo.x] - wp.gy;
          }
          if (a.reload && weapon.kind === "gun") {
            fl = 4 + kick + Math.max(2, (fo.x - wp.gx) * .35);
            fy = 5;
          }
          front = wAt(fl, fy);
        }
        const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
        let nH = rear, fH = front;
        const idl = ML && front ? q => {
          const c = Math.cos(aim), s = Math.sin(aim), qx = q[0] - wx, qy = q[1] - wy, cw = Math.cos(wang), sw = Math.sin(wang), lx = qx * cw + qy * sw, ly = -qx * sw + qy * cw;
          return [ wx - ML.dx + lx * c - ly * s, wy - ML.dy + lx * s + ly * c ];
        } : null;
        const r0 = idl ? idl(rear) : rear, f0 = idl ? idl(front) : front;
        if (!sideV && front && (gripS && Math.abs(S.f[0] - S.n[0]) > 4 ? (S.f[0] - S.n[0]) * gripS > 0 : d(S.n, r0) + d(S.f, f0) > d(S.n, f0) + d(S.f, r0))) {
          nH = front;
          fH = rear;
        }
        if (ML) {
          const sR = nH === rear ? S.n : S.f, sF = sR === S.n ? S.f : S.n, mx = PO.UP + PO.LOW - .5, m2 = PO.UP + PO.SUPPORT - .5;
          const tow = (sh, lim) => {
            const dd = d(sh, rear);
            if (dd <= lim) return;
            const k = 1 - lim / dd, ox = (rear[0] - sh[0]) * k, oy = (rear[1] - sh[1]) * k;
            wx -= ox;
            wy -= oy;
            rear[0] -= ox;
            rear[1] -= oy;
            if (front) {
              front[0] -= ox;
              front[1] -= oy;
            }
          };
          for (let it = 0; it < 3; it++) {
            tow(sR, mx);
            if (front) tow(sF, m2);
          }
        }
        const reach = sFar ? PO.UP + 16 : PO.UP + PO.SUPPORT - .5, pull = (s, h, base) => {
          if (!h || d(s, h) <= reach) return h;
          for (let k = 1; k <= 10; k++) {
            const q = [ h[0] + (base[0] - h[0]) * k / 10, h[1] + (base[1] - h[1]) * k / 10 ];
            if (d(s, q) <= reach) return q;
          }
          return base;
        };
        const suppK = fH === front ? "f" : "n";
        if (suppK === "f") fH = pull(S.f, fH, rear); else nH = pull(S.n, nH, rear);
        hands = {
          n: nH || hang("n"),
          f: fH || hang("f")
        };
        if (front) hands.supp = suppK;
        if (gripOn && front && a._grip && a._grip.one < 1) {
          const u = a._grip.one, hk = hang(suppK), h = hands[suppK];
          hands[suppK] = [ hk[0] + (h[0] - hk[0]) * u, hk[1] + (h[1] - hk[1]) * u ];
          if (u < .5) delete hands.supp;
        }
        if (gripS && !behind) {
          const oW = dg >= 0 ? .7 : .9, E = {};
          for (const k of [ "n", "f" ]) {
            const Sk = S[k], h = hands[k], o = Math.sign(Sk[0] - px) || (k === "n" ? -1 : 1), e = PO.elbow(Sk[0], Sk[1], h[0], h[1], o, oW, hands.supp === k ? PO.SUPPORT : PO.LOW);
            const dx = (e[0] - Sk[0]) * o, dc = Math.max(k === suppK ? -99 : -.5, Math.min(1.5, dx));
            E[k] = dc !== dx ? [ Sk[0] + o * dc, Sk[1] + Math.sqrt(PO.UP * PO.UP - dc * dc) ] : e;
            if (sFar && k === suppK && hands.supp === k) {
              const vx = h[0] - Sk[0], vy = h[1] - Sk[1], dd = Math.hypot(vx, vy), w = Math.max(0, Math.min(1, (dd - 14.5) / 4));
              if (w > 0) {
                const ux = vx / dd, uy = vy / dd + w * .3, n = Math.hypot(ux, uy) || 1;
                E[k] = [ Sk[0] + ux / n * PO.UP, Sk[1] + uy / n * PO.UP ];
              }
            }
          }
          hands.E = E;
        }
      } else if (armMode === "hang") {
        const R = MB ? SX.motion.walkHands(a, fr, S, px, sideV, dir, dg, tv, true) : null;
        hands = R ? {
          n: R.n,
          f: R.f,
          E: R.E,
          S: R.S
        } : {
          n: hang("n"),
          f: hang("f")
        };
      } else if (armMode === "walk") hands = SX.motion.walkHands(a, fr, S, px, sideV, dir, dg, tv, false);
      if (behind && armMode !== "pose" && armMode !== "hang" && armMode !== "walk") {
        const up = armMode === "fists" && a.swing > 0 ? Math.round(9 * Math.max(0, 1 - Math.abs(a.swing / .22 - .5) * 2)) : 0, pk = (a.punchN | 0) % 2 ? "f" : "n";
        const bY = gripOn ? -14 : -17;
        hands = {
          n: [ px + (outS("n") < 0 ? -4 : 3) + hX, py + bY + duck + bob ],
          f: [ px + (outS("f") < 0 ? -4 : 3) + hX, py + bY + duck + bob ]
        };
        hands.E = {
          n: [ S.n[0] + outS("n"), S.n[1] + 6 ],
          f: [ S.f[0] + outS("f"), S.f[1] + 6 ]
        };
        if (up) {
          hands[pk] = [ S[pk][0] + outS(pk) * 2, S[pk][1] - 3 - up ];
          hands.E[pk] = null;
          hands.up = pk;
        }
      }
      if (!hands.S) hands.S = S;
      if (MB) {
        const oN = sideV ? dir === 1 ? -1 : 1 : Math.sign(S.n[0] - px) || -1, oF = sideV ? dir === 1 ? -1 : 1 : Math.sign(S.f[0] - px) || 1, oW = sideV ? .35 : dg >= 0 ? .7 : .9;
        let RH = null;
        const rest = k => {
          RH = RH || SX.motion.walkHands(a, fr, S, px, sideV, dir, dg, tv, true);
          return [ RH[k][0], RH[k][1], RH.E[k][0], RH.E[k][1] ];
        };
        SX.motion.arms(a, now, hands, armMode, weapon, !!(TP && TP.hands), px, py + duck, rest, oN, oF, oW, cam);
        if (a.press) SX.motion.pressHands(a, now, hands, cam, oN, oF, oW, armMode);
      }
    }
    const col = armMode ? a.flinch > 0 ? flashCol(PO.colors(a.spec)) : PO.colors(a.spec) : null;
    const sprX = px - ART.CHAR_OX, sprY = py - ART.CHAR_OY + duck, sa = armMode ? spr._a || (spr._a = spr.getContext("2d").getImageData(0, 0, spr.width, spr.height).data) : null;
    const mask = (x, y) => {
      const ly = y - sprY, lx = x - sprX - (lnX ? Math.round(leanAt(ly)) : 0);
      return lx >= 0 && ly >= 0 && lx < spr.width && ly < spr.height && sa[(ly * spr.width + lx) * 4 + 3] > 100;
    };
    const outOf = k => sideV ? dir === 1 ? -1 : 1 : Math.sign(hands.S[k][0] - px) || (k === "n" ? -1 : 1);
    const armOf = k => {
      if (!hands) return;
      ctx.save();
      if (dim) ctx.globalAlpha *= dim;
      if (a.flinch > 0) ctx.globalAlpha *= .85;
      PO.arm(ctx, hands.S[k][0], hands.S[k][1], hands[k][0], hands[k][1], col, k === "f", {
        mask,
        out: outOf(k),
        outW: sideV ? .35 : dg >= 0 ? .7 : .9,
        elbow: hands.E && hands.E[k],
        low: hands.supp === k ? PO.SUPPORT : 0,
        cache: (armMode === "walk" || armMode === "hang") && !hands.press,
        spr,
        sprX,
        sprY,
        lean: lnX
      });
      ctx.restore();
    };
    const handOf = k => {
      if (!hands) return;
      ctx.save();
      if (dim) ctx.globalAlpha *= dim;
      if (a.flinch > 0) ctx.globalAlpha *= .85;
      PO.hand(ctx, hands[k][0], hands[k][1], col, k === "f");
      ctx.restore();
    };
    const cup = () => {
      const q = a.armPose && a.armPose.cup;
      if (!q || !hands) return;
      const h = hands[q];
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(Math.round(h[0]) - 2, Math.round(h[1]) - 5, 5, 5);
      ctx.fillStyle = "#e8eef4";
      ctx.fillRect(Math.round(h[0]) - 1, Math.round(h[1]) - 4, 3, 3);
      ctx.fillStyle = "#9cc8e8";
      ctx.fillRect(Math.round(h[0]) - 1, Math.round(h[1]) - 4, 3, 1);
    };
    const drawW = part => {
      if (!armMode && !weapon && a.swing > 0 && !a.hideWeapon && (a.kind === "player" || a.spar)) {
        const t = a.spar && a.windT != null ? -.35 : Math.max(0, 1 - Math.abs(a.swing / .22 - .5) * 2);
        const len = 5 + Math.round(10 * t), skin = a.spec && a.spec.skin || "#d9b38c";
        ctx.save();
        ctx.translate(px + (dir === 1 ? 2 : dir === 3 ? -2 : 0), py - 15);
        ctx.rotate(aim);
        const fw = h => a.flinch > 0 ? flashHex(h) : h;
        ctx.fillStyle = fw(a.spec && a.spec.top || "#3a4a30");
        ctx.fillRect(2, -2, len, 4);
        ctx.fillStyle = fw(skin);
        ctx.fillRect(2 + len, -3, 5, 6);
        ctx.restore();
        return;
      }
      if (!weapon || a.hideWeapon || !wp) return;
      if (ML && weapon.kind === "melee" && SX.melee.rot) {
        const q = SX.melee.rot(wp, wang, wflip);
        if (q) {
          const ga = ctx.globalAlpha;
          if (a.flinch > 0) ctx.globalAlpha = ga * .85;
          ctx.drawImage(a.flinch > 0 ? flashSpr(q.c) : q.c, Math.round(wx) + q.ox, Math.round(wy) + q.oy);
          ctx.globalAlpha = ga;
          return;
        }
      }
      const cp = !!part && weapon.kind === "gun" && stockB != null;
      if (cp) {
        const c0 = Math.cos(wang), s0 = Math.sin(wang), b = stockB + (part === 1 ? 2 : 0), bx = wx + c0 * b, by = wy + s0 * b, L = 90, k = part === 1 ? -L : L;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx - s0 * L, by + c0 * L);
        ctx.lineTo(bx + s0 * L, by - c0 * L);
        ctx.lineTo(bx + s0 * L + c0 * k, by - c0 * L + s0 * k);
        ctx.lineTo(bx - s0 * L + c0 * k, by + c0 * L + s0 * k);
        ctx.closePath();
        ctx.clip();
      }
      const rq = weapon.kind === "gun" && SX.melee && SX.melee.rot ? SX.melee.rot(wp, wang, wflip, true) : null;
      if (rq) {
        const ga = ctx.globalAlpha;
        if (a.flinch > 0) ctx.globalAlpha = ga * .85;
        ctx.drawImage(a.flinch > 0 ? flashSpr(rq.c) : rq.c, Math.round(wx + kick * Math.cos(wang)) + rq.ox, Math.round(wy + kick * Math.sin(wang)) + rq.oy);
        ctx.globalAlpha = ga;
      }
      ctx.save();
      const sx = wx, sy = wy;
      ctx.translate(sx, sy);
      const ang = wang;
      ctx.rotate(ang);
      if (wflip) ctx.scale(1, -1);
      if (rq) {} else if (a.flinch > 0) {
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * .85;
        ctx.drawImage(flashSpr(wp.c), 4 - wp.gx + kick, -wp.gy);
        ctx.globalAlpha = ga;
      } else ctx.drawImage(wp.c, 4 - wp.gx + kick, -wp.gy);
      let lz = null;
      if (weapon.laser && a.kind === "player" && !a.reload && !a.use) {
        const F = SX.game.floorObj && SX.game.floorObj();
        if (F) {
          const ox = a.x + (sx - px) / TS, oy = a.y + (sy - py) / TS, ca = Math.cos(aim), sa = Math.sin(aim);
          let d = .5;
          for (;d < 12; d += .12) {
            const x = ox + ca * d, y = oy + sa * d;
            if (F.blocked(x, y + .45, true)) break;
            if (A.enemies.some(e => e.alive && e.floor === F.idx && Math.abs(e.x - x) < .3 && y > e.y - 1.1 && y < e.y + .1)) break;
          }
          const x0 = wp.c.width - wp.gx + 4 + kick, x1 = Math.round(d * TS);
          if (x1 > x0) {
            const yl = wflip ? -1.5 : 1.5, cw = Math.cos(ang), sw = Math.sin(ang), at = u => [ Math.floor(sx + u * cw - yl * sw), Math.floor(sy + u * sw + yl * cw) ];
            lz = [ at(x0 + .5), at(x1 + .5) ];
          }
        }
      }
      if (a.muzzleT > 0 && weapon.kind === "gun") {
        const mx = wp.c.width - wp.gx + 4;
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * .85;
        ctx.fillStyle = "#fff3d0";
        ctx.fillRect(mx, -3, 5, 5);
        ctx.globalAlpha = ga * .6;
        ctx.fillStyle = "#e6c27a";
        ctx.fillRect(mx + 5, -2, 5, 3);
        ctx.fillRect(mx + 1, -6, 2, 3);
        ctx.fillRect(mx + 1, 3, 2, 3);
        ctx.fillRect(mx + 10, -1, 3, 1);
        ctx.globalAlpha = ga;
      }
      ctx.restore();
      if (cp) ctx.restore();
      if (lz && !(cp && part === 1)) {
        const [[ax, ay], [bx, by]] = lz;
        ctx.fillStyle = "rgba(255,60,50,0.45)";
        dotLine(ctx, ax, ay, bx, by);
        ctx.fillStyle = "#ff6a5a";
        ctx.fillRect(bx - 1, by - 1, 3, 3);
        ctx.fillStyle = "#fff0e0";
        ctx.fillRect(bx, by, 1, 1);
      }
    };
    const side = sideV;
    const armUp = behind && dg < 0 && tv < 0 && (armMode === "walk" || armMode === "hang");
    if (behind) {
      drawW();
      if (!armUp) for (const k of [ "f", "n" ]) if (!(hands && hands.up === k)) armOf(k);
    } else {
      if (wBack) drawW();
      if (stockB != null && !a.crawler) drawW(1);
      if (side) armOf("f");
    }
    if (behind && a.cleanTool && SX.clean && hands) SX.clean.drawTool(ctx, a, hands, px, py, dir, true);
    ctx.save();
    if (a.flinch > 0 || a.hurtT > .35) {
      ctx.globalAlpha = .85;
    }
    if (dim) ctx.globalAlpha *= dim;
    const sc = a.scale || 1;
    const sprD = a.flinch > 0 ? flashSpr(spr) : spr;
    if (lnX && sc === 1) {
      const HIP = LEAN_HIP, W = ART.CHAR_W, H = ART.CHAR_H, bx = px - ART.CHAR_OX, by = py - ART.CHAR_OY + duck;
      const LK = (H - HIP - sqd) / (H - HIP), legY = y => by + HIP + Math.round((y - HIP) * LK);
      let y0 = HIP, o0 = Math.round(leanAt(HIP));
      for (let y = HIP + 1; y <= H; y++) {
        const off = y < H ? Math.round(leanAt(y)) : null;
        if (off !== o0) {
          const d0 = legY(y0), d1 = legY(y);
          if (d1 > d0) ctx.drawImage(sprD, 0, y0, W, y - y0, bx + o0, d0, W, d1 - d0);
          y0 = y;
          o0 = off;
        }
      }
      y0 = 0;
      o0 = Math.round(leanAt(0));
      for (let y = 1; y <= HIP; y++) {
        const off = y < HIP ? Math.round(leanAt(y)) : null;
        if (off !== o0) {
          ctx.drawImage(sprD, 0, y0, W, y - y0, bx + o0, by + y0, W, y - y0);
          y0 = y;
          o0 = off;
        }
      }
    } else if (sqd > 0) {
      const HIP = 29, y0 = py - ART.CHAR_OY + duck - sqd, W = ART.CHAR_W, H = ART.CHAR_H;
      const bent = MB && MB.k && MB.k === sqd && dg < 0 && tv < 0 && bodyPose === "walk" && sc === 1 ? SX.motion.bent(spec, dir, sqd, !!armMode) : null;
      if (bent) ctx.drawImage(a.flinch > 0 ? flashSpr(bent) : bent, px - ART.CHAR_OX, y0); else {
        ctx.drawImage(sprD, 0, 0, W, HIP, px - ART.CHAR_OX, y0 + sqd, W, HIP);
        ctx.drawImage(sprD, 0, HIP, W, H - HIP, px - ART.CHAR_OX, y0 + HIP + sqd, W, H - HIP - sqd);
      }
    } else if (sc !== 1 && ART.charBig) {
      const B = ART.charBig(spr, sc);
      ctx.drawImage(a.flinch > 0 ? flashSpr(B.c) : B.c, Math.round(px - B.ox), Math.round(py - B.oy + duck));
    } else if (sc !== 1) ctx.drawImage(sprD, Math.round(px - ART.CHAR_OX * sc), Math.round(py - ART.CHAR_OY * sc + duck), Math.round(ART.CHAR_W * sc), Math.round(ART.CHAR_H * sc)); else {
      ctx.drawImage(sprD, px - ART.CHAR_OX, py - ART.CHAR_OY + duck);
      if (SX.normal && ctx === WMAIN && !WCUR && sprD === spr && !dim) SX.normal.body(spr, px - ART.CHAR_OX, py - ART.CHAR_OY + duck);
    }
    ctx.restore();
    const suU = !behind && !side && !wBack && !a.crawler && gripS && longG && armMode === "hold" && hands && hands.supp && weapon && weapon.kind === "gun" && !a.press ? hands.supp : null;
    if (suU) armOf(suU);
    if (!behind && !wBack && !a.crawler) drawW(stockB != null ? 2 : 0);
    if (a.cleanTool && SX.clean && hands) SX.clean.drawTool(ctx, a, hands, px, py, dir, false, behind);
    if (behind) {
      for (const k of [ "f", "n" ]) if (hands && (armUp || hands.up === k || AP && AP.back)) armOf(k);
    } else if (side) {
      if (hands && armMode === "hold") handOf("f");
      armOf("n");
    } else {
      if (suU !== "f") armOf("f");
      if (suU !== "n") armOf("n");
    }
    cup();
    if (a.armPose && a.armPose.held && SX.mis && SX.mis.drawHeld) SX.mis.drawHeld(ctx, a, hands);
    if (a.keyT > 0 && hands && !behind) {
      const h = hands.n, x = Math.round(h[0]) + (dir === 3 ? -4 : 1), y = Math.round(h[1]) - 2;
      ctx.fillStyle = "#3a2a08";
      ctx.fillRect(x, y, 4, 3);
      ctx.fillStyle = "#e8c048";
      ctx.fillRect(x, y, 3, 2);
      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = "#c89a28";
      ctx.fillRect(x + (dir === 3 ? -2 : 3), y + 1, 2, 1);
    }
    if (TP && TP.inHand && hands && !(behind && !TP.aiming)) SX.tac.drawInHand(ctx, hands.n[0], hands.n[1], TP.inHand);
    if (TP && TP.knife && hands && hands[TP.knife.h]) {
      const h = hands[TP.knife.h], x = Math.round(h[0]), y = Math.round(h[1]), c = Math.cos(TP.knife.ang), s = Math.sin(TP.knife.ang) * .6;
      ctx.fillStyle = "#1a1c20";
      ctx.fillRect(x - 1, y - 1, 3, 3);
      for (let k = 1; k <= 7; k++) {
        ctx.fillStyle = k < 2 ? "#4a3222" : k === 7 ? "#ffffff" : "#d8dde4";
        ctx.fillRect(Math.round(x + c * k), Math.round(y + s * k), 1, 1);
      }
    }
  }
  R.bagHit = function(p, dir) {
    if (!p || p.kind !== "punchBag") return;
    const b = p._bs || (p._bs = {
      x: 0,
      v: 0,
      f: -1
    });
    b.v = Math.max(-45, Math.min(45, b.v + (dir < 0 ? -1 : 1) * 30));
  };
  const BAG_K = 20, BAG_C = 1.2, BAG_MAX = 7, bagCut = new WeakMap;
  let bagF = 0, bagDt = 0;
  function bagStep(p) {
    const b = p._bs;
    if (!b) return 0;
    if (b.f !== bagF) {
      let dt = bagDt;
      b.f = bagF;
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120);
        b.v += (-BAG_K * b.x - BAG_C * b.v) * h;
        b.x += b.v * h;
        dt -= h;
      }
      if (Math.abs(b.x) > BAG_MAX) {
        b.x = Math.sign(b.x) * BAG_MAX;
        b.v *= -.3;
      }
      if (Math.abs(b.x) < .25 && Math.abs(b.v) < .6) {
        delete p._bs;
        return 0;
      }
    }
    return b.x;
  }
  function bagParts(c, flip) {
    let o = bagCut.get(c);
    if (o) return o;
    const W = c.width, H = c.height, B = H - 2, rows = [ [ B - 54, B - 50, 19, 22 ], [ B - 49, B - 44, 13, 28 ], [ B - 43, B - 11, 11, 29 ], [ B - 10, B - 1, 12, 30 ] ];
    const mk = () => {
      const q = document.createElement("canvas");
      q.width = W;
      q.height = H;
      return q;
    };
    const stand = mk(), bag = mk(), gs = stand.getContext("2d"), gb = bag.getContext("2d");
    gs.drawImage(c, 0, 0);
    for (const [y0, y1, a, z] of rows) {
      const x0 = flip ? W - 1 - z : a, w = z - a + 1;
      gb.drawImage(c, x0, y0, w, y1 - y0 + 1, x0, y0, w, y1 - y0 + 1);
      gs.clearRect(x0, y0, w, y1 - y0 + 1);
    }
    o = {
      stand,
      bag,
      top: B - 55,
      y0: B - 54,
      y1: B - 1
    };
    bagCut.set(c, o);
    return o;
  }
  function propImg(g, p, s, x, y, now) {
    if (p.furn && SX.homeUse && SX.homeUse.spinImg) {
      const q = SX.homeUse.spinImg(p);
      if (q) {
        g.drawImage(q.c, x + q.ox, y - s.oy + q.oy);
        return;
      }
    }
    const X = p.kind === "punchBag" && p._bs ? bagStep(p) : 0;
    if (!X) {
      g.drawImage(SX.fireAnim && SX.fireAnim.img(p, s, now) || s.c, x, y);
      return;
    }
    const o = bagParts(s.c, ((p.rot | 0) & 2) !== 0), W = s.c.width, span = o.y1 - o.top;
    g.drawImage(o.stand, x, y);
    for (let yy = o.y0; yy <= o.y1; yy++) {
      const dx = Math.round(X * (yy - o.top) / span);
      g.drawImage(o.bag, 0, yy, W, 1, x + dx, y + yy, W, 1);
    }
  }
  R.drawActor = drawActor;
  R.ARCZ = 1.3;
  R.deathKind = e => e.variant === "dog" ? "dog" : e.crawler ? "crawl" : e.variant === "brute" || e.variant === "coach" ? "brute" : e.variant === "hazmat" ? "haz" : e.variant === "nurse" ? "spin" : e.boss || e.named && e.type === "scav" ? "boss" : e.type === "scav" ? "scav" : "zomb";
  R.DEATH_T = {
    zomb: .8,
    brute: 1.1,
    crawl: .9,
    haz: .75,
    spin: .85,
    dog: 1.2,
    scav: .65,
    boss: 1.35
  };
  const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x, seg = (t, a, b) => c01((t - a) / (b - a)), eIn = k => k * k, eOut = k => 1 - (1 - k) * (1 - k);
  function pool(ctx, x, y, t, r0) {
    const k = c01((t - .25) / 2.2);
    if (k <= 0) return;
    const r = r0 * (.35 + .65 * eOut(k));
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.fillStyle = "#4a0a0c";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * .45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .35;
    ctx.fillStyle = "#6e1216";
    ctx.beginPath();
    ctx.ellipse(x - r * .15, y - 1, r * .6, r * .25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  R.DEATH_N = {
    zomb: 4,
    scav: 4,
    brute: 2,
    boss: 2
  };
  R.corpseSide = (kind, v, fb) => kind === "zomb" ? [ -fb, fb, fb, -fb ][v] : kind === "scav" ? [ fb, -fb, fb, fb ][v] : kind === "brute" ? [ -fb, fb ][v] : kind === "boss" ? [ fb, -fb ][v] : fb;
  R.corpseLay = function(F, p, kind, sc) {
    const cx = p.px + .5, cy = p.py + .5, fb = p.flipX ? -1 : 1;
    const v = (SX.hash("c" + Math.floor(cx * 16) + "," + Math.floor(cy * 16)) >>> 0) % (R.DEATH_N[kind] || 1);
    const lay = {
      v,
      fb,
      mode: "lie",
      sx: 0,
      sy: 0,
      wall: 0,
      wallB: 0
    };
    if (!F || !F.tile || !SX.map) return lay;
    const T = SX.map.T;
    const wall = (x, y) => {
      if (!F.in(x, y)) return true;
      const t = F.tile(x, y);
      return t === T.WALL || t === T.WINDOW || t === T.VOID || t === T.PARAPET || t === T.DOOR;
    };
    const tx = Math.floor(cx), ty = Math.floor(cy);
    if (wall(tx, ty)) return lay;
    let dN = 9, wb = 0;
    for (let k = 1; k <= 2; k++) if (wall(tx, ty - k)) {
      wb = ty - k + 1;
      dN = cy - wb;
      break;
    }
    const small = kind === "dog" || kind === "crawl", needS = small ? .95 : 1.1, L = 1.3 * sc;
    const south = (x0, x1, y) => {
      let m = 9;
      const a = Math.min(x0, x1), b = Math.max(x0, x1);
      for (let x = a; x <= b + 1e-6; x += .25) {
        const xx = Math.floor(Math.min(x, b));
        for (let k = 0; k <= 2; k++) if (wall(xx, Math.floor(y) + k)) {
          m = Math.min(m, Math.floor(y) + k - y);
          break;
        }
      }
      return m;
    };
    const solve = sy => {
      const o = {
        v,
        fb,
        mode: "lie",
        sx: 0,
        sy,
        wall: 0,
        wallB: 0
      };
      const y2 = cy + sy, ty2 = Math.floor(y2), dN2 = dN + sy;
      const side = d => {
        let m = 9;
        for (const yy of [ ty2, Math.floor(y2 - .45 * sc) ]) for (let k = 1; k <= 3; k++) if (wall(tx + d * k, yy)) {
          m = Math.min(m, d > 0 ? tx + k - cx : cx - (tx - k + 1));
          break;
        }
        return m;
      };
      const dR = side(1), dL = side(-1);
      if (small) {
        const h = .65 * sc;
        if (dR < h) o.sx = -(h - dR); else if (dL < h) o.sx = h - dL;
        o.x0 = cx + o.sx - h;
        o.x1 = cx + o.sx + h;
        return o;
      }
      if (dN2 < .62) {
        o.mode = "sitN";
        o.wallB = wb;
        o.sy += .42 - dN2;
        if (dR < .4) o.sx = -(.4 - dR); else if (dL < .4) o.sx = .4 - dL;
        return o;
      }
      const s = R.corpseSide(kind, v, fb), clear = s > 0 ? dR : dL, other = s > 0 ? dL : dR;
      const lie = (f, shift) => {
        o.fb = f;
        o.sx = shift;
        const s2 = R.corpseSide(kind, v, f);
        o.x0 = cx + shift;
        o.x1 = cx + shift + s2 * L;
        return o;
      };
      if (clear >= L) return lie(fb, 0);
      if (clear < .7) {
        o.mode = "sitW";
        o.wall = s;
        o.sx = s * (clear - .42);
        return o;
      }
      if (other >= L) return lie(-fb, 0);
      if (clear + other >= L + .35) return lie(fb, -s * (L - clear));
      const w = dR <= dL ? 1 : -1;
      o.mode = "sitW";
      o.wall = w;
      o.sx = w * (Math.min(dR, dL) - .42);
      return o;
    };
    let sy = 0;
    {
      const d = south(cx, cx, cy);
      if (d < needS) sy = -Math.min(needS - d, Math.max(0, dN - .4));
    }
    let o = solve(sy);
    if (o.mode === "lie" && o.x0 != null) {
      const d = south(o.x0, o.x1, cy + o.sy);
      if (d < needS) {
        const sy2 = Math.max(-1.15, o.sy - Math.min(needS - d, Math.max(0, dN + o.sy - .4)));
        if (sy2 < o.sy - 1e-6) o = solve(sy2);
      }
    }
    return o;
  };
  function drawCorpse(ctx, p, cam) {
    const e = p.body, t = e._t0 != null ? performance.now() / 1e3 - e._t0 : e.deathT == null ? 9 : Math.max(0, e.deathT), kind = R.deathKind(e);
    const sc = e.scale || 1;
    const lay = p._lay && p._layAt === p.px + "," + p.py + "," + !!p.flipX ? p._lay : (p._layAt = p.px + "," + p.py + "," + !!p.flipX, 
    p._lay = R.corpseLay(R._F, p, kind, sc));
    const mv = eOut(seg(t, 0, .35));
    const px = Math.round((p.px + .5 + lay.sx * mv) * TS - cam.x), py = Math.round((p.py + .5 + lay.sy * mv) * TS - cam.y);
    const fb = lay.fb, flip = fb < 0, Q = Math.PI / 2, v = lay.v;
    if (kind === "dog") {
      pool(ctx, px, py, t, 7);
      const k = seg(t, 0, .35), up = t < .35 ? -9 * Math.sin(k * Math.PI) : 0, kick = t < 1.2 ? Math.floor(t * 12) % 2 : 0;
      const ds = ART.dog(kick, flip);
      ctx.save();
      ctx.translate(px + fb * 4 * k, py + up);
      if (t < .35) ctx.rotate(fb * Math.PI * eOut(k)); else ctx.scale(1, -1);
      ctx.drawImage(ds, -ART.DOG_OX, -ART.DOG_OY + 4);
      ctx.restore();
      return;
    }
    let rot = 0, dx = 0, dy = 0, sx = 1, sy = 1, dir = 0, pose = "walk";
    const sit = lay.mode === "sitN" || lay.mode === "sitW";
    if (sit && kind !== "crawl") {
      const b = seg(t, .18, .45), c = seg(t, .45, .7), d = seg(t, .6, 1.1), big = kind === "brute" ? 1.3 : 1;
      const down = t >= .45;
      pose = down ? "sit" : "walk";
      dir = 0;
      sy = down ? 1 + .06 * (1 - c) : 1 - .2 * eIn(b);
      dy = down ? 2 * (1 - c) : 0;
      rot = (lay.mode === "sitN" ? v % 2 ? .26 : -.26 : lay.wall * .42) * d;
      if (lay.mode === "sitW") dx = lay.wall * 3 * d;
      const jit = [ 0, 1, 0, -1 ][Math.floor(t / .05) % 4];
      if (t < .2) dx += jit;
      if (kind === "zomb" && t > .7 && t < 1.6 && seg(t, .7, 1.6) < .8) dx += jit;
      if (lay.mode === "sitN") {
        const wy = Math.round(lay.wallB * TS - cam.y), len = Math.round(15 * big * seg(t, .2, .75));
        if (len > 0) {
          ctx.save();
          ctx.globalAlpha = .6;
          ctx.fillStyle = "#5a0c10";
          ctx.fillRect(px - 2, wy - 19, 4, len);
          ctx.globalAlpha = .35;
          ctx.fillStyle = "#7a1418";
          ctx.fillRect(px - 4, wy - 19, 8, 3);
          ctx.fillRect(px + 1, wy - 19, 1, Math.min(18, len + 3));
          ctx.restore();
        }
      }
      pool(ctx, px + (lay.mode === "sitW" ? -lay.wall * 5 : 0), py + 3, t, 8 * sc);
    } else if (kind === "crawl") {
      pose = "crawl";
      dir = flip ? 3 : 1;
      const k = seg(t, 0, .9), tw = (1 - k) * Math.sin(t * 38);
      dx = Math.round(tw * 2.5);
      sy = 1 - .12 * k + (t < .9 ? .12 * Math.abs(tw) : 0);
      dy = Math.round(-4 * Math.max(0, tw));
      rot = .08 * tw;
    } else if (kind === "brute") {
      const a = seg(t, 0, .35), b = seg(t, .35, .75), c = seg(t, .75, 1.05);
      if (v === 1) {
        dir = 0;
        dx = fb * 6 * eOut(a) + (t < .35 ? Math.sin(t * 70) : 0);
        rot = fb * .2 * a + fb * (Q - .2) * eIn(c) * (t >= .75 ? 1 : 0) + fb * .1 * b * (1 - c);
        sy = 1 - .1 * b * (1 - c);
        dy = 2 * b * (1 - c) - 3 * c;
      } else {
        dir = t < .75 ? e.dir || 0 : 2;
        dx = fb * 5 * eOut(a) - fb * 3 * c + (t < .35 ? Math.sin(t * 70) : 0);
        rot = fb * .22 * a * (1 - b) - fb * .12 * b * (1 - c) - fb * Q * eIn(c);
        sy = 1 - .28 * eOut(b) * (1 - c);
        dy = 6 * eOut(b) * (1 - c) - 3 * c;
      }
    } else if (kind === "zomb") {
      const a = seg(t, 0, .2), b = seg(t, .2, .5), c = seg(t, .5, .8);
      if (v === 1) {
        dir = 0;
        dx = fb * 6 * eOut(seg(t, 0, .3));
        rot = fb * .3 * a * (1 - c) + fb * Q * eIn(seg(t, .25, .65));
        dy = -3 * seg(t, .25, .65);
      } else if (v === 2) {
        dir = t < .55 ? e.dir || 0 : 0;
        const k = seg(t, .55, .9);
        sy = 1 - .3 * eOut(seg(t, .1, .4)) * (1 - k);
        dy = 7 * eOut(seg(t, .1, .4)) * (1 - k) - 3 * k;
        rot = fb * Q * eIn(k);
        if (t > .9 && t < 2) {
          const q = (1 - seg(t, .9, 2)) * Math.sin(t * 36);
          rot += .05 * q;
          dy += Math.round(-1.5 * Math.max(0, q));
        }
      } else if (v === 3) {
        const tw = seg(t, 0, .4);
        dir = t < .4 ? [ e.dir || 0, ((e.dir || 0) + 1) % 4, ((e.dir || 0) + 2) % 4 ][Math.min(2, Math.floor(tw * 3))] : 2;
        dx = fb * 2 * Math.sin(tw * Math.PI);
        sy = 1 - .15 * b * (1 - c);
        dy = 3 * b * (1 - c) - 3 * c;
        rot = -fb * .1 * tw * (1 - c) - fb * Q * eIn(c);
      } else {
        dir = t < .5 ? e.dir || 0 : 2;
        dx = fb * 3 * eOut(a) * (1 - c);
        rot = fb * .16 * a * (1 - b) - fb * Q * eIn(c);
        sy = 1 - .22 * eOut(b) * (1 - c);
        dy = 4 * eOut(b) * (1 - c) - 3 * c;
      }
    } else if (kind === "spin") {
      const a = seg(t, 0, .55), c = seg(t, .55, .85);
      dir = t < .55 ? [ 0, 1, 2, 3 ][Math.floor(a * 8) % 4] : 0;
      sy = 1 - .2 * a * (1 - c);
      dy = 3 * a * (1 - c) - 3 * c;
      rot = fb * Q * eIn(c);
    } else if (kind === "haz") {
      dir = 0;
      const a = seg(t, 0, .3), c = seg(t, .3, .7);
      dx = fb * 4 * eOut(a);
      rot = fb * .25 * a * (1 - c) + fb * Q * eIn(c);
      dy = -3 * c;
    } else if (kind === "boss") {
      if (v === 1) {
        const b = seg(t, .1, .5), c = seg(t, .95, 1.3);
        dir = t < .95 ? e.dir || 0 : 2;
        sy = 1 - .28 * eOut(b) * (1 - c);
        dy = 6 * eOut(b) * (1 - c) - 3 * c + (t > .5 && t < .95 ? Math.sin(t * 22) * .6 : 0);
        rot = -fb * .1 * b * (1 - c) - fb * Q * eIn(c);
        dx = -fb * 3 * c;
      } else {
        const a = seg(t, 0, .6), b = seg(t, .6, 1), c = seg(t, 1, 1.3);
        dx = fb * 7 * a;
        dy = -2 * Math.abs(Math.sin(a * Math.PI * 2)) * (1 - b) + 5 * eOut(b) * (1 - c) - 3 * c;
        dir = t < .6 ? e.dir || 0 : 0;
        rot = fb * .15 * a * (1 - b) + fb * Q * eIn(c);
        sy = 1 - .25 * eOut(b) * (1 - c);
      }
    } else {
      const a = seg(t, 0, .25), c = seg(t, .25, .6);
      if (v === 1) {
        const b = seg(t, .05, .3), k = seg(t, .3, .62);
        dir = t < .3 ? e.dir || 0 : 2;
        sy = 1 - .14 * b * (1 - k);
        dy = 3 * b * (1 - k) - 3 * k;
        dx = -fb * 5 * eOut(seg(t, .1, .5));
        rot = -fb * .18 * b * (1 - k) - fb * Q * eIn(k);
      } else if (v === 2) {
        const b = seg(t, 0, .3), k = seg(t, .42, .7);
        dir = 0;
        sy = 1 - .3 * eOut(b) * (1 - k);
        dy = 7 * eOut(b) * (1 - k) - 3 * k;
        rot = fb * Q * eIn(k);
        dx = fb * 2 * b;
      } else if (v === 3) {
        const tw = seg(t, 0, .3);
        dir = t < .3 ? [ e.dir || 0, ((e.dir || 0) + 1) % 4, ((e.dir || 0) + 2) % 4, ((e.dir || 0) + 3) % 4 ][Math.min(3, Math.floor(tw * 4))] : 0;
        dx = fb * 7 * eOut(seg(t, 0, .4));
        rot = fb * .2 * tw * (1 - c) + fb * Q * eIn(seg(t, .3, .65));
        dy = -3 * seg(t, .3, .65);
      } else {
        dir = 0;
        dx = fb * 8 * eOut(a);
        rot = fb * .35 * a * (1 - c) + fb * Q * eIn(c);
        dy = -3 * c;
      }
    }
    if (!sit || kind === "crawl") pool(ctx, px + dx + (kind === "crawl" ? 0 : Math.sign(rot || fb) * 13 * sc), py + 2, t, (kind === "brute" ? 15 : kind === "crawl" ? 9 : 11) * sc);
    const spr = ART.char(e.spec, dir === 3 && pose === "crawl" ? 1 : dir, 0, pose);
    const fl0 = pose === "crawl" && dir === 3, cX = Math.round(px + dx), cY = Math.round(py + dy);
    if (sx === 1 && sy === 1 && ART.rotDot) {
      const B = sc !== 1 && ART.charBig ? ART.charBig(spr, sc) : {
        c: spr,
        ox: ART.CHAR_OX,
        oy: ART.CHAR_OY
      }, q = ART.rotDot(B.c, rot, fl0 ? 2 : 0, B.ox, B.oy);
      ctx.drawImage(q.c, cX + q.ox, cY + q.oy);
    } else {
      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate(rot);
      if (fl0) ctx.scale(-1, 1);
      ctx.scale(sc * sx, sc * sy);
      ctx.drawImage(spr, -ART.CHAR_OX, -ART.CHAR_OY);
      ctx.restore();
    }
    if (kind === "brute" && !sit && t > 1 && t < 1.6) {
      const k = seg(t, 1, 1.6), ds = Math.sign(rot || -fb);
      ctx.save();
      ctx.globalAlpha = .45 * (1 - k);
      ctx.fillStyle = "#8a8070";
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, r = 6 + 22 * eOut(k);
        ctx.beginPath();
        ctx.ellipse(px + dx + ds * 14 + Math.cos(a) * r, py + 2 + Math.sin(a) * r * .35, 4 + 5 * k, 2 + 3 * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (kind === "haz" && t > .3 && t < 4.5) {
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const k = (t * .7 + i / 4) % 1, al = .32 * (1 - k) * c01((4.5 - t) / 1.5);
        ctx.globalAlpha = al;
        ctx.fillStyle = "#9fd85a";
        ctx.beginPath();
        ctx.ellipse(px + dx + (sit ? 0 : fb * 10) + Math.sin(i * 2.1 + t * 3) * 3, py - 6 - 20 * k, 3 + 6 * k, 2 + 4 * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if ((kind === "scav" || kind === "boss") && e.armed && e.gun) {
      const def = SX.items.def(e.gun), wp = def && ART.weapon(def);
      const stillThere = !p.cont || p.cont.grid.list.some(q => q.it && q.it.name === e.gun);
      if (wp && (t < .55 || stillThere)) {
        const t0 = kind === "boss" && !sit ? .6 : 0, k = seg(t, t0, t0 + .5);
        const away = sit ? lay.mode === "sitW" ? -lay.wall : v % 2 ? 1 : -1 : -Math.sign(R.corpseSide(kind, v, fb));
        const gx = px + away * (6 + 12 * k) * (k > 0 ? 1 : 0), gy = py - 17 + (sit ? 21 : 19) * k - 12 * Math.sin(k * Math.PI);
        const gX = Math.round(t < t0 ? px : gx), gY = Math.round(t < t0 ? py - 17 : gy), gA = t < t0 ? e.face || 0 : away * (.4 + k * Math.PI * 3);
        const gq = ART.rotDot && ART.rotDot(wp.c, gA, away > 0 ? 1 : 0);
        if (gq) ctx.drawImage(gq.c, gX + gq.ox, gY + gq.oy); else {
          ctx.save();
          ctx.translate(gX, gY);
          ctx.rotate(gA);
          if (away > 0) ctx.scale(1, -1);
          ctx.drawImage(wp.c, -wp.c.width / 2, -wp.c.height / 2);
          ctx.restore();
        }
      }
    }
  }
  R.drawCorpse = drawCorpse;
  const small = new Map;
  function dotLine(ctx, x0, y0, x1, y1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), stx = x0 < x1 ? 1 : -1, sty = y0 < y1 ? 1 : -1;
    let e = dx + dy, x = x0, y = y0, ax = x0, ay = y0, bx = x0, by = y0;
    const flush = () => ctx.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1);
    for (let k = 0; k < 4096 && !(x === x1 && y === y1); k++) {
      const e2 = 2 * e;
      if (e2 >= dy) {
        e += dy;
        x += stx;
      }
      if (e2 <= dx) {
        e += dx;
        y += sty;
      }
      if (y === ay && y === by && Math.abs(x - bx) === 1 || x === ax && x === bx && Math.abs(y - by) === 1) {
        bx = x;
        by = y;
      } else {
        flush();
        ax = bx = x;
        ay = by = y;
      }
    }
    flush();
  }
  R.dotLine = dotLine;
  function miniIcon(it, size) {
    size = size || 16;
    const key = it.name + ":" + (it.w || 1) + "x" + (it.h || 1) + ":" + size + (it.folded ? ":f" : "");
    let c = small.get(key);
    if (c) return c;
    const src = ART.icon({
      name: it.name,
      kind: it.kind,
      w: it.w || 1,
      h: it.h || 1,
      folded: it.folded
    });
    const k = Math.min(size / src.width, size / src.height, 1), w = Math.max(1, Math.round(src.width * k)), h = Math.max(1, Math.round(src.height * k));
    if (k < 1 && ART.shrinkDot) c = ART.shrinkDot(src, w, h); else {
      c = ART.mk(w, h);
      const x = c.getContext("2d");
      x.imageSmoothingEnabled = true;
      x.drawImage(src, 0, 0, w, h);
    }
    small.set(key, c);
    return c;
  }
  const rackSide = new WeakMap;
  function rackSideImg(c) {
    let r = rackSide.get(c);
    if (r) return r;
    r = ART.shrinkDot(c, Math.max(1, Math.round(c.width * .34)), c.height);
    const g = r.getContext("2d"), im = g.getImageData(0, 0, r.width, r.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) {
      d[i] = Math.round(d[i] * .86);
      d[i + 1] = Math.round(d[i + 1] * .86);
      d[i + 2] = Math.round(d[i + 2] * .86);
    }
    g.putImageData(im, 0, 0);
    rackSide.set(c, r);
    return r;
  }
  function drawDisplay(ctx, p, def, x, y) {
    if (!p.items || !p.items.length) return;
    const sl = ART.propSlots(p.kind, p.rot);
    if (sl.slots) sl.slots.forEach(([sx, sy], k) => {
      const it = p.items[k];
      if (!it) return;
      const ic = miniIcon(it);
      ctx.drawImage(ic, x + sx + Math.round((16 - ic.width) / 2), y + sy + Math.round((16 - ic.height) / 2));
    });
    if (sl.racks) sl.racks.forEach(([rx, ry], k) => {
      const it = p.items[k];
      if (!it) return;
      const wp = ART.weapon(it);
      if (!wp) return;
      const side = (p.rot & 1) !== 0;
      if (ART.rotDot && ART.shrinkDot) {
        const q = ART.rotDot(side ? rackSideImg(wp.c) : wp.c, -Math.PI / 2, 0);
        ctx.drawImage(q.c, Math.round(x + rx) + q.ox, Math.round(y + ry) + q.oy);
        return;
      }
      ctx.save();
      ctx.translate(x + rx, y + ry);
      ctx.rotate(-Math.PI / 2);
      if (side) {
        ctx.scale(.34, 1);
        ctx.globalAlpha = .9;
      }
      ctx.drawImage(wp.c, -wp.c.width / 2, -wp.c.height / 2);
      ctx.restore();
    });
  }
  const MKC = new Map;
  function markBake(col) {
    let r = MKC.get(col);
    if (r) return r;
    const q = ART.mk(1, 1).getContext("2d", {
      willReadFrequently: true
    });
    q.fillStyle = col;
    q.fillRect(0, 0, 1, 1);
    const cv = q.getImageData(0, 0, 1, 1).data;
    const bake = (W, H, ox, oy, outer, inner, hi) => {
      const lay = (pts, fill) => {
        const c = ART.mk(W, H), x = c.getContext("2d", {
          willReadFrequently: true
        });
        x.fillStyle = fill;
        x.translate(ox, oy);
        x.beginPath();
        pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v));
        x.closePath();
        x.fill();
        return x.getImageData(0, 0, W, H).data;
      };
      const A0 = lay(outer, "#000"), B0 = lay(inner, "#fff"), c = ART.mk(W, H), g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data;
      for (let i = 0; i < W * H; i++) {
        const j = i * 4;
        if (B0[j + 3] >= 128) {
          d[j] = cv[0];
          d[j + 1] = cv[1];
          d[j + 2] = cv[2];
          d[j + 3] = 255;
        } else if (A0[j + 3] >= 128) d[j + 3] = 255;
      }
      if (hi) for (let y = hi[1]; y < hi[1] + hi[3]; y++) for (let x = hi[0]; x < hi[0] + hi[2]; x++) {
        const j = ((y + oy) * W + x + ox) * 4;
        if (!d[j + 3]) continue;
        for (let k = 0; k < 3; k++) d[j + k] = Math.round(d[j + k] * .3 + 255 * .7);
      }
      g.putImageData(im, 0, 0);
      return c;
    };
    r = {
      dia: bake(24, 30, 12, 14, [ [ 0, -12 ], [ 10, 0 ], [ 0, 14 ], [ -10, 0 ] ], [ [ 0, -9 ], [ 7, 0 ], [ 0, 11 ], [ -7, 0 ] ], [ -2, -5, 3, 4 ]),
      arr: bake(26, 26, 10, 13, [ [ 14, 0 ], [ -8, -11 ], [ -4, 0 ], [ -8, 11 ] ], [ [ 11, 0 ], [ -6, -8 ], [ -2, 0 ], [ -6, 8 ] ], null)
    };
    if (MKC.size > 40) MKC.clear();
    MKC.set(col, r);
    return r;
  }
  function marker(ctx, vw, vh, cam, x, y, col, label, now, big, edgeOnly) {
    let sx = x * TS - cam.x, sy = y * TS - cam.y;
    const m = 24, on = sx > m && sy > m && sx < vw - m && sy < vh - m;
    if (on && edgeOnly) return;
    const p = A.player, dist = p ? Math.round(Math.hypot(x - p.x, y - p.y)) : 0;
    ctx.save();
    ctx.font = "16px Galmuri7";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    if (on) {
      const b = Math.sin(now * 4) * 2;
      if (big) {
        ctx.fillStyle = col.replace(")", ",0.18)").replace("rgb", "rgba");
        ctx.fillRect(Math.round(sx) - 2, Math.round(sy) - 90, 4, 90);
      }
      ctx.translate(Math.round(sx), Math.round(sy - 24 + b));
      ctx.drawImage(markBake(col).dia, -12, -14);
      const t = (label ? label + " " : "") + dist + "m";
      ctx.fillStyle = "#000";
      ctx.fillText(t, 1, -15);
      ctx.fillText(t, -1, -15);
      ctx.fillText(t, 0, -16);
      ctx.fillText(t, 0, -14);
      ctx.fillStyle = "#fff";
      ctx.fillText(t, 0, -15);
    } else {
      const cx = vw / 2, cy = vh / 2, dx = sx - cx, dy = sy - cy;
      const k = Math.min((vw / 2 - m) / Math.abs(dx || 1), (vh / 2 - m) / Math.abs(dy || 1));
      let ex = cx + dx * k, ey = cy + dy * k;
      const a = Math.atan2(dy, dx);
      const av = R.avoid;
      if (av && ex > av.x0 - 16 && ey < av.y1 + 16) {
        if (Math.abs(ex - (vw - m)) < 2) ey = av.y1 + 22; else ex = av.x0 - 22;
      }
      const al = R.avoidL;
      if (al && ex < al.x1 + 16 && ey < al.y1 + 26) {
        if (Math.abs(ex - m) < 2) ey = al.y1 + 30; else ex = al.x1 + 22;
      }
      ctx.translate(Math.round(ex), Math.round(ey));
      {
        const q = ART.rotDot(markBake(col).arr, a, 0, 10, 13);
        ctx.drawImage(q.c, q.ox, q.oy);
      }
      const t = (label ? label + " " : "") + dist + "m";
      const ty = ey < vh / 2 ? 30 : -16, tw = ctx.measureText(t).width / 2;
      const tx = SX.clamp(0, 6 + tw - ex, vw - 6 - tw - ex);
      ctx.fillStyle = "#000";
      ctx.fillText(t, tx + 1, ty + 1);
      ctx.fillStyle = col;
      ctx.fillText(t, tx, ty);
    }
    ctx.restore();
  }
  R.marker = marker;
  const heliK = HL => {
    if (HL.t0 == null) return -1;
    if (HL.landed) return 0;
    const left = SX.raid.heliLeft();
    return left != null && left < 6 ? left / 6 : -1;
  };
  function heliGround(ctx, cx, cy, k, now) {
    const P = new ART.Pen(ctx), s = 1 - k * .45, a = .42 * (1 - k * .75);
    P.shadow(cx + 2, cy + 3, Math.round(84 * s), Math.round(12 * s), a);
    P.oval(cx + Math.round(80 * s), cy, Math.round(24 * s), 2, "rgba(0,0,0," + (a * .45).toFixed(3) + ")");
    const n = Math.round(44 * (1 - k * .8));
    for (let i = 0; i < n; i++) {
      const ph = (now * (.7 + i % 5 * .11) + i * .618) % 1;
      if (ph > .9) continue;
      const an = i * 2.39996 + Math.sin(now * .7 + i) * .1, r = 40 + ph * 80;
      P.r(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r * .42), ph < .5 ? 2 : 1, 1, i % 3 ? "#a8a092" : "#c4bcaa");
    }
  }
  function drawHeli(ctx, HL, k, cam, now, drawn) {
    const H = ART.heli, P0 = HL.pad, gx = Math.round((P0.x + P0.w / 2) * TS - cam.x), gy = Math.round((P0.y + P0.h / 2) * TS - cam.y);
    const hov = Math.min(1, k * 4), lift = Math.round(k * k * 260 + Math.sin(now * 2.3) * 2 * hov), sway = Math.round(Math.sin(now * 1.1) * 3 * k);
    const bx = gx - (H.W >> 1) + sway, by = gy + 12 - H.G - lift;
    const tl = HL.landed ? SX.raid.t - HL.t0 - SX.raid.HELI_WAIT : -1, wave = tl > 1.4 ? Math.floor(now * 2.5) % 2 : 0;
    ctx.drawImage(H.body(wave), bx, by);
    const o = tl < .3 ? 0 : Math.min(1, (tl - .3) / .9), D = H.doorAt;
    ctx.drawImage(H.door(), bx + D.x + Math.round(o * o * (3 - 2 * o) * D.slide), by + D.y);
    const front = [ ...drawn ].filter(a => a.floor === HL.f && !a.dead && a.y * TS - cam.y > gy + 12 && Math.abs(a.x * TS - cam.x - gx) < (H.W >> 1) + 30 && a.y * TS - cam.y - 64 < by + H.H).sort((p, q) => p.y - q.y);
    for (const a of front) drawActor(ctx, a, cam, now, a._dim);
    const fr = Math.floor(now * 42) % H.NR, ft = Math.floor(now * 56) % H.NT, rx = bx + H.hub[0] - H.rotorHub[0], ry = by + H.hub[1] - H.rotorHub[1];
    ctx.drawImage(H.blur(fr % 3), rx, ry);
    ctx.drawImage(H.rotor(fr), rx, ry);
    ctx.drawImage(H.tail(ft), bx + H.tailHub[0] - H.tailC, by + H.tailHub[1] - H.tailC);
    const L = H.lights, on = now % 1 < .14, st = (now + .45) % 1.3 < .06, px = (p, dx, dy, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(bx + p[0] + dx, by + p[1] + dy, w, h);
    };
    px(L.top, 0, 0, 3, 2, on ? "#ff5040" : "#6a1c16");
    px(L.belly, 0, 0, 3, 2, on ? "#ff5040" : "#6a1c16");
    if (on) {
      for (const p of [ L.top, L.belly ]) {
        px(p, -1, 0, 1, 2, "#ff9070");
        px(p, 3, 0, 1, 2, "#ff9070");
        px(p, 1, -1, 1, 1, "#ffd0b0");
        px(p, 1, 2, 1, 1, "#ff9070");
      }
    }
    px(L.tail, 0, 0, 2, 2, st ? "#ffffff" : "#9a9c9e");
    if (st) {
      px(L.tail, -2, 0, 6, 2, "#fffbe8");
      px(L.tail, 0, -2, 2, 6, "#fffbe8");
    }
    px(L.nav, 0, 0, 2, 2, "#5ef07a");
    px(L.search, 0, 0, 3, 1, k > 0 ? "#fffbe0" : "#a8a898");
  }
  let rmS = null, rmSx = null;
  let rainClip = null, DRY_K = null, skyF = null, skyM = null;
  function hubRain(ctx, F, cam, vw, vh, env, dt) {
    const O = F.out, HO = SX.homeOut;
    if (O && !O.sky) return;
    if (!DRY_K && HO && HO.K) DRY_K = new Set([ HO.K.CEIL, HO.K.HALL, HO.K.EARTH, HO.K.NONE ]);
    if (O && !DRY_K) return;
    const tx0 = Math.floor(cam.x / TS), ty0 = Math.floor(cam.y / TS), tw = Math.ceil(vw / TS) + 2, th = Math.ceil(vh / TS) + 2, key = tx0 + ":" + ty0 + ":" + tw + ":" + th, now = performance.now();
    if (!rainClip || rainClip.F !== F || rainClip.key !== key || now - rainClip.t > 500) {
      const p = new Path2D;
      let n = 0;
      if (skyF !== F) {
        skyF = F;
        skyM = null;
        for (const r of F.rooms || []) if (r.sky) {
          skyM = skyM || new Uint8Array(F.W * F.H);
          for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (F.in(x, y)) skyM[F.i(x, y)] = 1;
        }
      }
      for (let y = 0; y < th; y++) {
        let run = -1;
        for (let x = 0; x <= tw; x++) {
          const tx = tx0 + x, ty = ty0 + y;
          let wet = false;
          if (x < tw) {
            const fin = F.in(tx, ty), i = fin ? F.i(tx, ty) : -1;
            if (fin && skyM && skyM[i]) wet = true; else if (fin && (F.inside[i] || F.voidAt && F.voidAt(tx, ty))) wet = false; else if (!O) wet = fin; else {
              const gx = tx - O.GX, gy = ty - O.GY, k = gx < 0 || gy < 0 || gx >= O.GW || gy >= O.GH ? -1 : O.k[gy * O.GW + gx], t = fin ? F.t[i] : T.VOID;
              wet = t === T.PARAPET || (t === T.VOID || t === T.GROUND) && k >= 0 && !DRY_K.has(k);
            }
          }
          if (wet && run < 0) run = x; else if (!wet && run >= 0) {
            p.rect(run * TS, y * TS, (x - run) * TS, TS);
            n++;
            run = -1;
          }
        }
      }
      rainClip = {
        F,
        key,
        p,
        n,
        t: now
      };
    }
    if (!rainClip.n) return;
    const ox = tx0 * TS - cam.x, oy = ty0 * TS - cam.y;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.clip(rainClip.p);
    ctx.translate(-ox, -oy);
    SX.light.rain(ctx, vw, vh, env.rain, dt, cam, true, false);
    ctx.restore();
  }
  R.hubRainCells = () => rainClip ? rainClip.n : 0;
  R.hubRainClip = () => rainClip;
  R.draw = function(view, level, F, env, opt) {
    R._F = F;
    bagF++;
    bagDt = Math.min(.05, Math.max(0, view.dt || 0));
    opt = opt || {};
    const ctx = view.ctx, cam = view.cam, vw = view.vw, vh = view.vh;
    const now = performance.now() / 1e3;
    WMAIN = ctx;
    if (SX.normal) SX.normal.frame(F, env);
    if (SX.dotshade) SX.dotshade.frame(F, env, view);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, vw, vh);
    const tx0 = Math.floor(cam.x / TS) - 1, ty0 = Math.floor(cam.y / TS) - 1, tx1 = Math.ceil((cam.x + vw) / TS) + 1, ty1 = Math.ceil((cam.y + vh) / TS) + 4;
    if (F.dh && SX.decoHub) SX.decoHub.sync(F);
    {
      const HP = SX.raid && SX.raid.heli, pd = HP && HP.f === F.idx && F.kind === "roof" ? HP.pad : null;
      if ((F._heliPad || null) !== pd) {
        F._heliPad = pd;
        F.chunks.clear();
      }
    }
    for (let cy = Math.floor(ty0 / CH); cy <= Math.floor(ty1 / CH); cy++) for (let cx = Math.floor(tx0 / CH); cx <= Math.floor(tx1 / CH); cx++) {
      if (!F.out && (cx < 0 || cy < 0 || cx * CH >= F.W || cy * CH >= F.H)) continue;
      ctx.drawImage(chunk(F, cx, cy), Math.round(cx * CH * TS - cam.x), Math.round(cy * CH * TS - cam.y));
    }
    const WD = wOn() ? SX.raid.wDepth(F.idx) : 0;
    if (WD > .05) waterFloor(ctx, F, cam, vw, vh, WD, now);
    if (SX.waterDot) SX.waterDot.draw(ctx, F, cam, vw, vh, now, WD, env);
    if (F.out) preWant(F, cam, vw, vh, tx0, ty0, tx1, ty1);
    if (opt.deco) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = Math.max(0, tx0); x <= tx1; x++) ctx.fillRect(Math.round(x * TS - cam.x), 0, 1, vh);
      for (let y = Math.max(0, ty0); y <= ty1; y++) ctx.fillRect(0, Math.round(y * TS - cam.y), vw, 1);
      if (opt.decoArea) for (const r of opt.decoArea) {
        const x = Math.round(r.x0 * TS - cam.x), y = Math.round(r.y0 * TS - cam.y), w = (r.x1 - r.x0 + 1) * TS, h = (r.y1 - r.y0 + 1) * TS;
        ctx.fillStyle = "rgba(90,220,255,0.10)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(90,220,255,0.9)";
        ctx.fillRect(x, y, w, 2);
        ctx.fillRect(x, y + h - 2, w, 2);
        ctx.fillRect(x, y, 2, h);
        ctx.fillRect(x + w - 2, y, 2, h);
      }
      if (!opt.ghost && !(SX.top && SX.top.held()) && !(SX.homeSurf && SX.homeSurf.ownCursor && SX.homeSurf.ownCursor())) {
        const hx = Math.floor(SX.view.mouseWorldX), hy = Math.floor(SX.view.mouseWorldY + .3), x = Math.round(hx * TS - cam.x), y = Math.round(hy * TS - cam.y);
        ctx.fillStyle = "rgba(255,246,192,0.12)";
        ctx.fillRect(x, y, TS, TS);
        ctx.fillStyle = "rgba(255,246,192,0.7)";
        ctx.fillRect(x, y, TS, 2);
        ctx.fillRect(x, y + TS - 2, TS, 2);
        ctx.fillRect(x, y, 2, TS);
        ctx.fillRect(x + TS - 2, y, 2, TS);
      }
      if (!(SX.homeSurf && SX.homeSurf.drawZones)) {
        const hr = SX.homeSurf && SX.homeSurf.hoverRect ? SX.homeSurf.hoverRect() : null;
        if (hr) {
          const x = Math.round(hr.x0 * TS - cam.x), y = Math.round(hr.y0 * TS - cam.y), w = (hr.x1 - hr.x0 + 1) * TS, h = (hr.y1 - hr.y0 + 1) * TS;
          ctx.fillStyle = "rgba(255,214,90,0.9)";
          ctx.fillRect(x, y, w, 2);
          ctx.fillRect(x, y + h - 2, w, 2);
          ctx.fillRect(x, y, 2, h);
          ctx.fillRect(x + w - 2, y, 2, h);
        }
      }
    }
    for (const z of F.zones) {
      if (z.hidden) continue;
      const x = Math.round(z.x * TS - cam.x), y = Math.round(z.y * TS - cam.y), w = z.w * TS, h = z.h * TS;
      const on = .5 + Math.sin(now * 3) * .2;
      ctx.fillStyle = z.locked ? SX.cbc("bad", "rgba(200,60,60,0.12)", .12) : SX.cbc("ok", "rgba(80,220,110," + .12 * on + ")", .12 * on);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = z.locked ? SX.cbc("bad", "rgba(220,70,70,0.6)", .6) : SX.cbc("ok", "rgba(110,240,130," + on + ")", on);
      const off = Math.floor(now * 12) % 12;
      for (let k = -off; k < w; k += 12) {
        const a = Math.max(0, k), b = Math.min(w, k + 6);
        if (b > a) {
          ctx.fillRect(x + a, y, b - a, 2);
          ctx.fillRect(x + w - b, y + h - 2, b - a, 2);
        }
      }
      for (let k = -off; k < h; k += 12) {
        const a = Math.max(0, k), b = Math.min(h, k + 6);
        if (b > a) {
          ctx.fillRect(x, y + h - b, 2, b - a);
          ctx.fillRect(x + w - 2, y + a, 2, b - a);
        }
      }
    }
    for (const s of F.stairs) {
      if (F.seeOff && F.seeOff(Math.floor(s.x), Math.floor(s.y))) continue;
      if (s.locked) {
        const gx = Math.round(s.x * TS - cam.x), gw = s.w * TS, gy = Math.round((s.y + s.h - 1.2) * TS - cam.y), gh = Math.round(TS * 1.1);
        ctx.fillStyle = "#23262a";
        ctx.fillRect(gx, gy, gw, 3);
        ctx.fillRect(gx, gy + gh - 3, gw, 3);
        ctx.fillRect(gx, gy, 3, gh);
        ctx.fillRect(gx + gw - 3, gy, 3, gh);
        for (let k = 7; k < gw - 4; k += 7) {
          ctx.fillStyle = "#4a4f56";
          ctx.fillRect(gx + k, gy + 3, 2, gh - 6);
          ctx.fillStyle = "#7c838c";
          ctx.fillRect(gx + k, gy + 3, 1, gh - 6);
        }
        ctx.fillStyle = "#c8a030";
        for (let k = 0; k < gw; k += 10) ctx.fillRect(gx + k, gy + (gh >> 1) - 1, 6, 3);
        const lx = gx + (gw >> 1) - 5, ly = gy + (gh >> 1) - 4;
        ctx.fillStyle = "#1a1210";
        ctx.fillRect(lx - 1, ly - 1, 12, 12);
        ctx.fillStyle = "#d04a44";
        ctx.fillRect(lx, ly + 3, 10, 7);
        ctx.fillStyle = "#e06060";
        ctx.fillRect(lx, ly + 3, 10, 1);
        ctx.fillStyle = "#9aa0a8";
        ctx.fillRect(lx + 2, ly, 1, 3);
        ctx.fillRect(lx + 7, ly, 1, 3);
        ctx.fillRect(lx + 2, ly, 6, 1);
        ctx.fillStyle = "#1a1210";
        ctx.fillRect(lx + 4, ly + 5, 2, 3);
        continue;
      }
      if (s.home) homeStair(ctx, s, Math.round(s.x * TS - cam.x), Math.round(s.y * TS - cam.y));
      const x = Math.round((s.x + s.w / 2) * TS - cam.x), y = Math.round((s.y + (s.dir === "up" ? 1 : s.h - 1)) * TS - cam.y);
      ctx.fillStyle = s.dir === "up" ? "rgba(230,220,160,0.85)" : "rgba(160,200,230,0.85)";
      const d = s.dir === "up" ? -1 : 1, b = Math.round(Math.sin(now * 3) * 2) * d;
      for (let k = 0; k < 7; k++) ctx.fillRect(x - 7 + k, y + b + d * k * 2, 15 - k * 2, 2);
    }
    if (SX.traps) SX.traps.draw(ctx, F, cam, TS, now);
    if (SX.raid && SX.raid.drawStory && SX.game.state === "raid") SX.raid.drawStory(ctx, F, cam, TS, now);
    const HL = SX.raid && SX.raid.heli;
    if (HL && HL.f === F.idx) {
      const P0 = HL.pad, cx = Math.round((P0.x + P0.w / 2) * TS - cam.x), cy = Math.round((P0.y + P0.h / 2) * TS - cam.y);
      const lc = HL.landed ? "#7cf090" : HL.t0 != null && now % .8 < .48 ? "#ffc65c" : null;
      if (lc && ART.heliPad) {
        const ox = Math.round(P0.x * TS - cam.x), oy = Math.round(P0.y * TS - cam.y);
        ctx.fillStyle = lc;
        for (const [lx, ly] of ART.heliPad(P0).lights) ctx.fillRect(ox + lx, oy + ly, 2, 2);
      }
      const hk = heliK(HL);
      if (hk >= 0 && ART.heli) heliGround(ctx, cx, cy, hk, now);
    }
    const ver = F.props.length + ":" + (F.ver || 0);
    if (!F._rows || F._rowsDirty !== ver) {
      F._rows = new Map;
      F._flat = [];
      for (const p of F.props) {
        if (p.flat) {
          F._flat.push(p);
          continue;
        }
        const q0 = p.onP || p, ry = q0.py != null ? Math.floor(q0.py + .5) : Math.ceil(q0.y + q0.h - 1e-6) - 1;
        if (!F._rows.has(ry)) F._rows.set(ry, []);
        F._rows.get(ry).push(p);
      }
      F._flat.sort((a, b) => a.y + a.h - (b.y + b.h));
      F._rowsDirty = ver;
    }
    const actors = [];
    const P = A.player;
    if (P && P.floor === F.idx && !opt.hidePlayer) actors.push(P);
    for (const al of A.allies) if (al.floor === F.idx && (al.alive || al.spec)) actors.push(al);
    if (SX.coop) for (const g of SX.coop.ghostsOn(F.idx)) {
      const lit = SX.light.brightAt(cam, g.x, g.y - .4), d = P ? Math.hypot(g.x - P.x, g.y - P.y) : 0;
      if (!(SX.light.seenActor(F, g.x, g.y) && (lit > (g.mate ? .12 : SX.light.PLIT) || d < (g.mate ? 3 : SX.light.PNEAR) || g.muzzleT > 0 || g.torch)) && !opt.xray) continue;
      if (SX.wx && SX.wx.hides(F, P, g.x, g.y) && !opt.xray) continue;
      actors.push(g);
    }
    if (SX.ev && SX.ev.actors) for (const g of SX.ev.actors(F.idx)) {
      const lit = SX.light.brightAt(cam, g.x, g.y - .4), d = P ? Math.hypot(g.x - P.x, g.y - P.y) : 0;
      if (!(SX.light.seenActor(F, g.x, g.y) && (lit > .12 || d < 3)) && !opt.xray) continue;
      if (SX.wx && SX.wx.hides(F, P, g.x, g.y) && !opt.xray) continue;
      actors.push(g);
    }
    if (SX.mis && SX.mis.actors) for (const g of SX.mis.actors(F.idx)) {
      if (!g.misDraw && !opt.xray) {
        const lit = SX.light.brightAt(cam, g.x, g.y - .4), d = P ? Math.hypot(g.x - P.x, g.y - P.y) : 0;
        if (!(SX.light.seenActor(F, g.x, g.y) && (lit > .12 || d < 3))) continue;
        if (SX.wx && SX.wx.hides(F, P, g.x, g.y)) continue;
      }
      actors.push(g);
    }
    if (opt.npcs) for (const n of opt.npcs) if (!n.hidden) actors.push(n);
    for (const e of A.enemies) {
      if (e.floor !== F.idx || e.dead || e.dormant) continue;
      if (e.x < tx0 - 1 || e.x > tx1 + 1 || e.y < ty0 - 1 || e.y > ty1 + 2) continue;
      const d = P ? Math.hypot(e.x - P.x, e.y - P.y) : 0;
      const lit = SX.light.brightAt(cam, e.x, e.y - .4);
      const vis = SX.light.seenActor(F, e.x, e.y) && (lit > .16 || d < SX.light.NEAR || e.muzzleT > 0) && !(SX.wx && SX.wx.hides(F, P, e.x, e.y));
      if (!vis && !opt.xray) continue;
      e._dim = lit < .3 ? .75 : 1;
      actors.push(e);
    }
    const drawn = new Set(actors);
    NOW = now;
    {
      const me = A.player, mx = me ? Math.round(me.x * TS - cam.x) : 0, my = me ? Math.round(me.y * TS - cam.y) : 0;
      MV = me && drawn.has(me) ? {
        a: me,
        on: false,
        L: [],
        x0: mx - 32,
        y0: my - 56,
        x1: mx + 32,
        y1: my + 6
      } : null;
    }
    const aRows = new Map;
    const hidA = F.seeOff ? a => a !== A.player && F.seeOff(Math.floor(a.x), Math.floor(a.y)) : null;
    const hidP = F.seeOff ? p => F.seeOff(Math.floor(p.x + p.w / 2), Math.floor(p.y + p.h - .001)) : null;
    for (const a of actors) {
      if (hidA && hidA(a)) continue;
      const mo = SX.motion ? SX.motion.pre(a, now) : null, ry = Math.floor(a.y + (mo && mo.oy ? mo.oy / TS : 0));
      if (!aRows.has(ry)) aRows.set(ry, []);
      aRows.get(ry).push(a);
    }
    let onT = null;
    if (F._tmVer !== ver) {
      F._tm = F.props.filter(p => ON_KINDS.has(p.kind));
      F._tmVer = ver;
    }
    for (const t of F._tm) {
      const rs = !t.hidden && t.hit ? t.hit.walk || t.hit.rects : null;
      if (!rs) continue;
      for (const a of actors) {
        if (!rs.some(r => a.x >= r.x0 && a.x <= r.x1 && a.y >= r.y0 && a.y <= r.y1)) continue;
        (onT || (onT = new Map)).set(t, {
          a,
          r: Math.floor(a.y),
          nat: t.py != null ? Math.floor(t.py + .5) : Math.ceil(t.y + t.h - 1e-6) - 1
        });
        break;
      }
    }
    const ghost = opt.ghost;
    if (SX.ride) SX.ride.ghost = ghost && ghost.ride ? ghost : null;
    const OT = SX.coop ? SX.coop.torches(F.idx) : null, SLs = [], SR = SX.light.SELF_R;
    if (P && P.floor === F.idx) SLs.push([ P.x, P.y - .4, P.torch && P.alive ? SR.on : SR.off ]);
    if (OT) for (const q of OT) SLs.push([ q.x, q.y, SR.peer ]);
    const SL = SLs.length ? SX.light.selfBegin(cam, vw, vh, SLs) : null;
    const inSL = (x, y, w, h) => {
      const R = SL.R;
      for (let k = 0; k < R.length; k += 4) if (x < R[k + 2] && x + w > R[k] && y < R[k + 3] && y + h > R[k + 1]) return true;
      return false;
    };
    const slB = [];
    const slCut = (x, y, w, h, fn) => {
      slB.push(x, y, x + w, y + h);
      const g = SL.g;
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = 1;
      fn(g);
      g.restore();
    };
    function slProp(p, over) {
      if (!SL || p.hidden || p.ride || p.lift || p.kind === "loot" || p.kind === "corpse" || p.x + p.w < tx0 - 2 || p.x > tx1 + 2) return;
      const s = over ? ART.propOver(p.kind, p.v, p.col, p.rot) : ART.propBase(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy;
      if (!inSL(x - 4, y - TS, s.c.width + 8, s.c.height + TS)) return;
      slCut(x - 4, y - TS, s.c.width + 8, s.c.height + TS, g => {
        if (over) g.drawImage(s.c, x, y); else propImg(g, p, s, x, y, now);
        if (over) return;
        const def = ART.propDef(p.kind);
        if (def && (def.slots || def.racks)) drawDisplay(g, p, def, x, y);
        if (p.furn && SX.homeUse) SX.homeUse.drawOn(g, p, s, x, y, now);
        if (p.furn && SX.top) SX.top.drawOn(g, p, x, y, now);
      });
    }
    function slActor(a) {
      if (!SL) return;
      const px = Math.round(a.x * TS - cam.x), py = Math.round(a.y * TS - cam.y), x0 = px - 32, y0 = py - 56, x1 = px + 32, y1 = py + 6;
      if (!inSL(x0, y0, x1 - x0, y1 - y0)) return;
      let hit = false;
      for (let k = 0; k < slB.length && !hit; k += 4) hit = slB[k] < x1 && slB[k + 2] > x0 && slB[k + 1] < y1 && slB[k + 3] > y0;
      if (!hit) return;
      const g = SL.g;
      g.save();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      drawActor(g, a, cam, now, a._dim);
      g.restore();
    }
    const RM = SX.light.roomBegin ? SX.light.roomBegin(F, cam, vw, vh) : null, rmB = [];
    const rmHit = (x0, y0, x1, y1) => {
      for (let k = 0; k < rmB.length; k += 4) if (rmB[k] < x1 && rmB[k + 2] > x0 && rmB[k + 1] < y1 && rmB[k + 3] > y0) return true;
      return false;
    };
    const rmQ = [];
    const rmQHit = (x0, y0, x1, y1) => {
      for (let k = 0; k < rmQ.length; k += 4) if (rmQ[k] < x1 && rmQ[k + 2] > x0 && rmQ[k + 1] < y1 && rmQ[k + 3] > y0) return true;
      return false;
    };
    const rmL = [];
    const rmLHit = (x0, y0, x1, y1) => {
      for (let k = 0; k < rmL.length; k += 4) if (rmL[k] < x1 && rmL[k + 2] > x0 && rmL[k + 1] < y1 && rmL[k + 3] > y0) return true;
      return false;
    };
    const rmLOn = () => {
      if (RM.lOn) return;
      RM.lOn = true;
      const l = RM.l;
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = "source-over";
      l.globalAlpha = 1;
      l.clearRect(0, 0, vw, vh);
    };
    const rmCut1 = (g, fn) => {
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = 1;
      fn(g);
      g.restore();
    };
    const rmCut = (x, y, w, h, fn) => {
      if (!RM) return;
      if (rmB.length && rmHit(x, y, x + w, y + h)) rmCut1(RM.c, fn);
      if (rmQ.length && rmQHit(x, y, x + w, y + h)) rmCut1(RM.q, fn);
    };
    const rmClip = (g, op, bx, by, bw, bh, p, s, x, y, over) => {
      g.save();
      g.beginPath();
      g.rect(bx, by, bw, bh);
      g.clip();
      g.globalCompositeOperation = op;
      g.globalAlpha = 1;
      g.imageSmoothingEnabled = true;
      propPaint(g, p, s, x, y, over);
      g.restore();
    };
    const propPaint = (g, p, s, x, y, over) => {
      if (over) {
        g.drawImage(s.c, x, y);
        return;
      }
      g.drawImage(SX.fireAnim && SX.fireAnim.img(p, s, now) || s.c, x, y);
      const def = ART.propDef(p.kind);
      if (def && (def.slots || def.racks)) drawDisplay(g, p, def, x, y);
      if (p.furn && SX.homeUse) SX.homeUse.drawOn(g, p, s, x, y, now);
      if (p.furn && SX.top) SX.top.drawOn(g, p, x, y, now);
    };
    function rmProp(p, over) {
      mvProp(p, over);
      omProp(p, over);
      if (!RM || p.hidden || p.ride || p.lift || p.kind === "loot" || p.kind === "corpse" || p.x + p.w < tx0 - 2 || p.x > tx1 + 2) return;
      const s = over ? ART.propOver(p.kind, p.v, p.col, p.rot) : ART.propBase(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy;
      const a0 = SX.light.roomA(F, p), a = a0 && a0.fire ? .9999 : a0, bx = x - 4, by = y - TS, bw = s.c.width + 8, bh = s.c.height + TS;
      if (a === -1) return;
      if (a && a.sp) {
        const hx = bx + bw, hy = by + bh;
        const pa = (g, A, B, op) => {
          g.save();
          g.beginPath();
          for (const Q of [ A, B ]) if (Q) for (let k = 0; k < Q.length; k += 4) g.rect(Q[k], Q[k + 1], Q[k + 2] - Q[k], Q[k + 3] - Q[k + 1]);
          g.clip();
          g.globalCompositeOperation = op;
          g.globalAlpha = 1;
          g.imageSmoothingEnabled = true;
          propPaint(g, p, s, x, y, over);
          g.restore();
        };
        if ((a.lt.length || a.pm.length) && rmB.length && rmHit(bx, by, hx, hy)) pa(RM.c, a.lt, a.pm, "destination-out");
        if (a.dk.length) {
          pa(RM.c, a.dk, null, "source-over");
          if (RM.lOn && rmLHit(bx, by, hx, hy)) pa(RM.l, a.dk, null, "destination-out");
          rmB.push(bx, by, hx, hy);
          RM.any = true;
        }
        if ((a.lt.length || a.dk.length) && rmQ.length && rmQHit(bx, by, hx, hy)) pa(RM.q, a.lt, a.dk, "destination-out");
        if (a.pm.length) {
          pa(RM.q, a.pm, null, "source-over");
          rmQ.push(bx, by, hx, hy);
          RM.anyQ = true;
        }
        return;
      }
      if (a == null || a >= 1) {
        rmCut(bx, by, bw, bh, g => propPaint(g, p, s, x, y, over));
        return;
      }
      if (a <= 0) {
        rmClip(RM.c, "source-over", bx, by, bw, bh, p, s, x, y, over);
        if (RM.lOn && rmLHit(bx, by, bx + bw, by + bh)) rmClip(RM.l, "destination-out", bx, by, bw, bh, p, s, x, y, over);
        if (rmQ.length && rmQHit(bx, by, bx + bw, by + bh)) rmClip(RM.q, "destination-out", bx, by, bw, bh, p, s, x, y, over);
        rmB.push(bx, by, bx + bw, by + bh);
        RM.any = true;
        return;
      }
      rmLOn();
      const c = RM.c, l = RM.l;
      if (!rmHit(bx, by, bx + bw, by + bh)) {
        rmClip(c, "source-over", bx, by, bw, bh, p, s, x, y, over);
        l.globalCompositeOperation = "source-over";
        l.globalAlpha = a;
        l.fillStyle = "#000";
        l.fillRect(bx, by, bw, bh);
        l.globalAlpha = 1;
      } else if (!rmLHit(bx, by, bx + bw, by + bh)) {
        rmClip(c, "source-over", bx, by, bw, bh, p, s, x, y, over);
        rmClip(l, "source-over", bx, by, bw, bh, p, s, x, y, over);
        l.globalCompositeOperation = "destination-out";
        l.globalAlpha = 1 - a;
        l.fillStyle = "#000";
        l.fillRect(bx, by, bw, bh);
        l.globalCompositeOperation = "source-over";
        l.globalAlpha = 1;
      } else {
        if (!rmS || rmS.width < bw || rmS.height < bh) {
          rmS = ART.mk(Math.max(bw, rmS ? rmS.width : 0), Math.max(bh, rmS ? rmS.height : 0));
          rmSx = rmS.getContext("2d");
        }
        rmSx.setTransform(1, 0, 0, 1, 0, 0);
        rmSx.globalCompositeOperation = "source-over";
        rmSx.globalAlpha = 1;
        rmSx.clearRect(0, 0, bw, bh);
        rmSx.setTransform(1, 0, 0, 1, -bx, -by);
        propPaint(rmSx, p, s, x, y, over);
        rmSx.setTransform(1, 0, 0, 1, 0, 0);
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = 1;
        c.drawImage(rmS, 0, 0, bw, bh, bx, by, bw, bh);
        l.globalCompositeOperation = "destination-out";
        l.globalAlpha = 1;
        l.drawImage(rmS, 0, 0, bw, bh, bx, by, bw, bh);
        l.globalCompositeOperation = "source-over";
        l.globalAlpha = a;
        l.drawImage(rmS, 0, 0, bw, bh, bx, by, bw, bh);
        l.globalAlpha = 1;
      }
      if (rmQ.length && rmQHit(bx, by, bx + bw, by + bh)) rmClip(RM.q, "destination-out", bx, by, bw, bh, p, s, x, y, over);
      rmL.push(bx, by, bx + bw, by + bh);
      rmB.push(bx, by, bx + bw, by + bh);
      RM.any = true;
    }
    function rmActor(a) {
      omActor(a);
      if (!RM || !rmB.length && !rmQ.length) return;
      const px = Math.round(a.x * TS - cam.x), py = Math.round(a.y * TS - cam.y), x0 = px - 32, y0 = py - 56, x1 = px + 32, y1 = py + 6;
      const fn = g => drawActor(g, a, cam, now, a._dim);
      if (rmB.length && rmHit(x0, y0, x1, y1)) rmCut1(RM.c, fn);
      if (rmQ.length && rmQHit(x0, y0, x1, y1)) rmCut1(RM.q, fn);
    }
    const OM = SX.light.ownBegin ? SX.light.ownBegin(F, cam, vw, vh) : null, omB = [];
    const omHit = (x0, y0, x1, y1) => {
      for (let k = 0; k < omB.length; k += 4) if (omB[k] < x1 && omB[k + 2] > x0 && omB[k + 1] < y1 && omB[k + 3] > y0) return true;
      return false;
    };
    const omCut = (x, y, w, h, fn) => {
      if (OM && omB.length && omHit(x, y, x + w, y + h)) rmCut1(OM.c, fn);
    };
    function omProp(p, over) {
      if (!OM || p.hidden || p.ride || p.lift || p.kind === "loot" || p.kind === "corpse" || p.x + p.w < tx0 - 2 || p.x > tx1 + 2) return;
      const own = OM.set.has(p);
      if (!own && !omB.length) return;
      const s = over ? ART.propOver(p.kind, p.v, p.col, p.rot) : ART.propBase(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy, bx = x - 4, by = y - TS, bw = s.c.width + 8, bh = s.c.height + TS;
      if (!own) {
        omCut(bx, by, bw, bh, g => propPaint(g, p, s, x, y, over));
        return;
      }
      const g = OM.c;
      g.save();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      propPaint(g, p, s, x, y, over);
      g.restore();
      omB.push(bx, by, bx + bw, by + bh);
      OM.any = true;
      if (bx < OM.x0) OM.x0 = bx;
      if (by < OM.y0) OM.y0 = by;
      if (bx + bw > OM.x1) OM.x1 = bx + bw;
      if (by + bh > OM.y1) OM.y1 = by + bh;
    }
    function omActor(a) {
      if (!OM || !omB.length) return;
      const px = Math.round(a.x * TS - cam.x), py = Math.round(a.y * TS - cam.y);
      omCut(px - 32, py - 56, 64, 62, g => drawActor(g, a, cam, now, a._dim));
    }
    function mvCut(x, y, w, h, fn) {
      if (MV && MV.on && x < MV.x1 && x + w > MV.x0 && y < MV.y1 && y + h > MV.y0) MV.L.push(fn);
    }
    function mvProp(p, over) {
      if (!MV || !MV.on || p.hidden || p.ride || p.lift) return;
      const s = over ? ART.propOver(p.kind, p.v, p.col, p.rot) : ART.propBase(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy;
      mvCut(x - 4, y - TS, s.c.width + 8, s.c.height + TS, g => propPaint(g, p, s, x, y, over));
    }
    function mvActor(a) {
      if (!MV) return;
      if (a === MV.a) {
        MV.on = true;
        return;
      }
      const px = Math.round(a.x * TS - cam.x), py = Math.round(a.y * TS - cam.y);
      mvCut(px - 32, py - 56, 64, 62, g => drawActor(g, a, cam, now, a._dim));
    }
    const frontCut = SL || RM || MV || OM ? (x, y, w, h, fn) => {
      if (SL) slCut(x, y, w, h, fn);
      rmCut(x, y, w, h, fn);
      mvCut(x, y, w, h, fn);
      omCut(x, y, w, h, fn);
    } : null;
    function drawProp(p) {
      if (p.x + p.w < tx0 - 2 || p.x > tx1 + 2) return;
      if (p.kind === "corpse" && p.body) {
        drawCorpse(ctx, p, cam);
        return;
      }
      if (p.cont && p.cont.searched && p.kind === "loot" && !p.cont.grid.list.length) return;
      if (p.hidden || p.ride) return;
      if (p.kind === "loot" && p.cont && p.cont.grid.list.length) {
        const it = p.cont.grid.list[0].it, ic = miniIcon(it, 24);
        const cx = Math.round((p.x + .5) * TS - cam.x), cy = Math.round((p.y + .62) * TS - cam.y);
        if (p.cont.home) {
          ctx.fillStyle = "#4a4236";
          ctx.fillRect(cx - 12, cy - 4, 24, 12);
          ctx.fillStyle = "#5c5344";
          ctx.fillRect(cx - 11, cy - 3, 22, 10);
        }
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(cx - Math.round(ic.width / 2) + 1, cy + Math.round(ic.height / 2) - 1, ic.width, 3);
        ctx.drawImage(ic, cx - Math.round(ic.width / 2), cy - Math.round(ic.height / 2));
        if (p.cont.grid.list.length > 1) {
          ctx.fillStyle = "#15171a";
          ctx.fillRect(cx + 7, cy - 13, 7, 7);
          ctx.fillStyle = "#f0e6b0";
          ctx.fillRect(cx + 8, cy - 12, 5, 5);
        }
        const gl = (now * 1.3 + p.x * .37 + p.y * .61) % 3;
        if (gl < .25) {
          ctx.fillStyle = "rgba(255,250,210," + (1 - gl * 4).toFixed(2) + ")";
          ctx.fillRect(cx - 6, cy - 9, 1, 5);
          ctx.fillRect(cx - 8, cy - 7, 5, 1);
        }
        if (p.hl) {
          ctx.save();
          ctx.globalAlpha = .3 + Math.sin(now * 6) * .1;
          ctx.globalCompositeOperation = "lighter";
          ctx.drawImage(ic, cx - Math.round(ic.width / 2), cy - Math.round(ic.height / 2));
          ctx.restore();
        }
        return;
      }
      const s = ART.propBase(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy;
      if (p.lift) {
        ctx.save();
        ctx.globalAlpha = .35;
      }
      propImg(ctx, p, s, x, y, now);
      if (WD > .05 && !p.lift) propWet(ctx, s.c, x, y, WD);
      const def = ART.propDef(p.kind);
      if (def && (def.slots || def.racks)) drawDisplay(ctx, p, def, x, y);
      if (p.lift) ctx.restore();
      if (p.hl) {
        ctx.save();
        ctx.globalAlpha = .22 + Math.sin(now * 6) * .08;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(s.c, x, y);
        ctx.restore();
      }
      if (p.furn && SX.homeUse) SX.homeUse.drawOn(ctx, p, s, x, y, now);
      if (p.furn && SX.top) SX.top.drawOn(ctx, p, x, y, now);
    }
    function upLine(p) {
      return (p.kind === "board" || p.kind === "sign") && !p.hit ? p.y + ((p.rot | 0) & 1 ? p.h - .01 : p.h - 2 / TS) : null;
    }
    function drawPropOver(p) {
      if (p.hidden || p.ride || p.x + p.w < tx0 - 2 || p.x > tx1 + 2) return;
      const s = ART.propOver(p.kind, p.v, p.col, p.rot);
      if (!s) return;
      const x = Math.round((p.px != null ? p.px : p.x) * TS - cam.x), y = Math.round((p.py != null ? p.py : p.y) * TS - cam.y) + s.oy;
      if (p.lift) {
        ctx.save();
        ctx.globalAlpha = .35;
      }
      ctx.drawImage(s.c, x, y);
      if (p.lift) ctx.restore();
      if (p.hl) {
        ctx.save();
        ctx.globalAlpha = .22 + Math.sin(now * 6) * .08;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(s.c, x, y);
        ctx.restore();
      }
    }
    if (SX.grass) SX.grass.draw(ctx, F, cam, now, actors, tx0, ty0, tx1, ty1);
    if (SX.chem) SX.chem.drawFloor(ctx, F, cam, now, tx0, ty0, tx1, ty1);
    for (const p of F._flat) {
      if (p.y + p.h < ty0 - 2 || p.y > ty1 + 2) continue;
      if (hidP && hidP(p)) continue;
      drawProp(p);
    }
    if (F.dh && SX.decoHub && SX.decoHub.overFlat) SX.decoHub.overFlat(ctx, F, cam);
    const sideT = SX.homeUse && SX.homeUse.sideRows ? SX.homeUse.sideRows() : null;
    for (let ty = ty0; ty <= ty1; ty++) {
      if (ty >= 0 && ty < F.H) {
        const pyRow = ty * TS - cam.y;
        for (let tx = Math.max(0, tx0); tx <= Math.min(F.W - 1, tx1); tx++) {
          const t = F.t[ty * F.W + tx], hid = !!(F.voidAt && F.voidAt(tx, ty)) || !!(F.ceilAt && F.ceilAt(tx, ty)) || !!(F.plateAt && F.plateAt(tx, ty));
          if (t === T.WALL || t === T.WINDOW || t === T.DOOR || t === T.PARAPET || hid) {
            const wx = Math.round(tx * TS - cam.x), wy = Math.round(pyRow);
            drawWall(ctx, F, tx, ty, wx, wy);
            if (WD > .05 && !hid) wallWet(ctx, F, tx, ty, wx, wy, WD, t);
            if (SL && inSL(wx, wy - WH - 8, TS, TS + WH + 16)) slCut(wx, wy - WH - 8, TS, TS + WH + 16, g => drawWall(g, F, tx, ty, wx, wy));
            if (MV && MV.on) mvCut(wx, wy - WH - 8, TS, TS + WH + 16, t === T.WALL || hid ? g => g.fillRect(wx, wy - WH, TS, TS + WH) : g => drawWall(g, F, tx, ty, wx, wy));
            if (RM) rmCut(wx, wy - WH - 8, TS, TS + WH + 16, t === T.WALL || hid ? g => g.fillRect(wx, wy - WH, TS, TS + WH) : g => drawWall(g, F, tx, ty, wx, wy));
            if (OM && omB.length) omCut(wx, wy - WH - 8, TS, TS + WH + 16, t === T.WALL || hid ? g => g.fillRect(wx, wy - WH, TS, TS + WH) : g => drawWall(g, F, tx, ty, wx, wy));
          }
        }
        if (F.dh && SX.decoHub) {
          SX.decoHub.row(ctx, F, ty, cam);
          const Ls = SL && SX.decoHub.rowStrips ? SX.decoHub.rowStrips(F, ty) : null;
          if (Ls) {
            const sy = SX.decoHub.stripY(ty, cam, F);
            for (const s of Ls) {
              const sx = Math.round(s.x - cam.x);
              if (inSL(sx, sy, s.c.width, s.c.height)) slCut(sx, sy, s.c.width, s.c.height, g => g.drawImage(s.c, sx, sy));
            }
          }
        }
      }
      let pr = F._rows.get(ty);
      if (pr && hidP) pr = pr.filter(p => !hidP(p));
      if (sideT) {
        if (pr) pr = pr.filter(p => !(sideT.has(p) && sideT.get(p) < ty));
        for (const [q, r] of sideT) if (r === ty && q.hit && Math.ceil(q.y + q.h - 1e-6) - 1 > r) pr = (pr || []).concat([ q ]);
      }
      if (onT) {
        if (pr) pr = pr.filter(p => !(onT.has(p) && onT.get(p).r < ty));
        for (const [q, o] of onT) if (o.r === ty && o.r < o.nat) pr = (pr || []).concat([ q ]);
      }
      const late = [];
      let ovT = null;
      if (pr) for (const p of pr) {
        if (p.hit || p.onP || upLine(p) != null) late.push(p); else {
          drawProp(p);
          slProp(p);
          rmProp(p);
        }
      }
      if (ghost && !ghost.ride && Math.ceil(ghost.y + ghost.h - 1e-6) - 1 === ty) {
        const s = ART.prop(ghost.kind, ghost.v || 0, ghost.col, ghost.rot);
        if (s) {
          const x = Math.round(ghost.x * TS - cam.x), y = Math.round(ghost.y * TS - cam.y) + s.oy, y0 = y - s.oy;
          ctx.save();
          ctx.globalAlpha = .7;
          ctx.drawImage(s.c, x, y);
          ctx.restore();
          if (SX.top) SX.top.drawGhostTop(ctx, ghost, x, y, now);
          const wb = SX.home && SX.home.wallBox ? SX.home.wallBox(ghost.kind, ghost.v || 0, ghost.col, ghost.rot) : null;
          if (wb) {
            const bx = x + Math.round(wb.x0 * TS), by = y0 + Math.round(wb.y0 * TS), bw = Math.round((wb.x1 - wb.x0) * TS), bh = Math.round((wb.y1 - wb.y0) * TS);
            ctx.fillStyle = ghost.ok ? SX.cbc("ok", "rgba(110,240,130,0.18)", .18) : SX.cbc("bad", "rgba(240,80,70,0.3)", .3);
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = ghost.ok ? SX.cbc("ok", "#6ef082") : SX.cbc("bad", "#f05046");
            ctx.fillRect(bx, by, bw, 1);
            ctx.fillRect(bx, by + bh - 1, bw, 1);
            ctx.fillRect(bx, by, 1, bh);
            ctx.fillRect(bx + bw - 1, by, 1, bh);
          } else {
            const bb = ART.baseBox ? ART.baseBox(ghost.kind, ghost.rot) : null, gx0 = bb ? x + Math.round(bb.x0 * TS) : x, gy0 = bb ? y0 + Math.round(bb.y0 * TS) : y0, gw = bb ? Math.max(2, Math.round((bb.x1 - bb.x0) * TS)) : ghost.w * TS, gh = bb ? Math.max(2, Math.round((bb.y1 - bb.y0) * TS)) : ghost.h * TS;
            ctx.fillStyle = ghost.ok ? SX.cbc("ok", "rgba(110,240,130,0.12)", .12) : SX.cbc("bad", "rgba(240,80,70,0.2)", .2);
            ctx.fillRect(gx0, gy0, gw, gh);
            for (const hb of ghost.hit ? ghost.hit.walk || ghost.hit.rects : [ {
              x0: 0,
              y0: 0,
              x1: ghost.w,
              y1: ghost.h
            } ]) {
              const hx = x + Math.round(hb.x0 * TS), hy = y0 + Math.round(hb.y0 * TS), hw = Math.max(2, Math.round((hb.x1 - hb.x0) * TS)), hh = Math.max(2, Math.round((hb.y1 - hb.y0) * TS));
              ctx.fillStyle = ghost.ok ? SX.cbc("ok", "rgba(110,240,130,0.35)", .35) : SX.cbc("bad", "rgba(240,80,70,0.45)", .45);
              ctx.fillRect(hx, hy, hw, hh);
            }
            ctx.fillStyle = ghost.ok ? SX.cbc("ok", "#6ef082") : SX.cbc("bad", "#f05046");
            const fw = gw, fh2 = gh;
            ctx.fillRect(gx0, gy0, fw, 1);
            ctx.fillRect(gx0, gy0 + fh2 - 1, fw, 1);
            ctx.fillRect(gx0, gy0, 1, fh2);
            ctx.fillRect(gx0 + fw - 1, gy0, 1, fh2);
          }
        }
      }
      const ar = aRows.get(ty);
      if (late.length) {
        const using = SX.homeUse && SX.homeUse.cur && SX.homeUse.cur.kind === "gym" ? SX.homeUse.cur.prop : null;
        const seq = late.map(p => ({
          k: onT && onT.has(p) ? onT.get(p).a.y - 1e-4 : p === using || sideT && sideT.has(p) ? -1e9 : p.onP ? (p.onP.hit ? p.onP.hit.y1 - .01 : p.onP.y + p.onP.h - .01) + 2e-5 : p.hit ? p.hit.y1 - .01 : upLine(p),
          p
        })).concat((ar || []).map(a => ({
          k: a.y,
          a
        })));
        for (const p of late) if (ON_KINDS.has(p.kind)) {
          (ovT || (ovT = new Set)).add(p);
          seq.push({
            k: onT && onT.has(p) ? onT.get(p).a.y + 1e-4 : p.hit.y1 - .01 + 1e-5,
            o: p
          });
        }
        seq.sort((u, v) => u.k - v.k);
        for (const q of seq) {
          if (q.o) {
            drawPropOver(q.o);
            slProp(q.o, true);
            rmProp(q.o, true);
          } else if (q.p) {
            drawProp(q.p);
            slProp(q.p);
            rmProp(q.p);
          } else {
            drawActor(ctx, q.a, cam, now, q.a._dim);
            mvActor(q.a);
            slActor(q.a);
            rmActor(q.a);
            if (SX.homeUse && (q.a === P ? SX.homeUse.cur : q.a.kind === "peer" && q.a.bodyPose === "benchSit")) SX.homeUse.drawFront(ctx, cam, frontCut, q.a === P ? null : q.a);
          }
        }
      } else if (ar) {
        ar.sort((a, b) => a.y - b.y);
        for (const a of ar) {
          drawActor(ctx, a, cam, now, a._dim);
          mvActor(a);
          slActor(a);
          rmActor(a);
        }
      }
      if (pr) for (const p of pr) {
        if (ovT && ovT.has(p)) continue;
        drawPropOver(p);
        slProp(p, true);
        rmProp(p, true);
      }
    }
    if (F.dh && SX.decoHub) SX.decoHub.top(ctx, F, cam);
    if (opt.deco && SX.top) SX.top.drawCursor(ctx, cam, now);
    if (opt.deco && SX.homeSurf && SX.homeSurf.drawZones) SX.homeSurf.drawZones(ctx, cam, F);
    if (SX.raid && SX.raid.drawStory && SX.game.state === "raid") SX.raid.drawStory(ctx, F, cam, TS, now, true);
    for (const n of A.nades) {
      if (n.floor !== F.idx) continue;
      const x = Math.round(n.x * TS - cam.x), y = Math.round((n.y - n.z * R.ARCZ) * TS - cam.y);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(x - 3, Math.round(n.y * TS - cam.y) + 2, 7, 3);
      if (n.sub === "fire") {
        const sp = (now * 10 | 0) % 2, fl = (now * 14 | 0) % 2;
        if (sp) {
          ctx.fillStyle = "#1e4a2a";
          ctx.fillRect(x - 4, y - 2, 7, 5);
          ctx.fillRect(x + 3, y - 1, 3, 3);
          ctx.fillStyle = "#3aa05a";
          ctx.fillRect(x - 3, y - 1, 5, 3);
          ctx.fillRect(x + 2, y, 3, 1);
          ctx.fillStyle = "#9aa848";
          ctx.fillRect(x - 3, y + 1, 5, 1);
          ctx.fillStyle = "#d8ccb0";
          ctx.fillRect(x + 5, y - 1, 1, 3);
          ctx.fillStyle = fl ? "#ffd27a" : "#ff8a2a";
          ctx.fillRect(x + 6, y - 1, 2, 2);
        } else {
          ctx.fillStyle = "#1e4a2a";
          ctx.fillRect(x - 3, y - 2, 6, 7);
          ctx.fillRect(x - 2, y - 5, 4, 3);
          ctx.fillStyle = "#3aa05a";
          ctx.fillRect(x - 2, y - 1, 4, 5);
          ctx.fillRect(x - 1, y - 4, 2, 3);
          ctx.fillStyle = "#9aa848";
          ctx.fillRect(x - 2, y + 1, 4, 3);
          ctx.fillStyle = "#d8ccb0";
          ctx.fillRect(x - 1, y - 5, 2, 1);
          ctx.fillStyle = fl ? "#ffd27a" : "#ff8a2a";
          ctx.fillRect(x - 1, y - 7, 2, 2);
        }
      } else if (n.sub) {
        const fl = n.sub === "flash", sm = n.sub === "smoke";
        ctx.fillStyle = "#15171a";
        ctx.fillRect(x - 4, y - 6, 8, 11);
        ctx.fillStyle = fl ? "#9aa0a8" : sm ? "#6f7860" : "#5c6670";
        ctx.fillRect(x - 3, y - 5, 6, 9);
        ctx.fillStyle = fl ? "#d4d9df" : sm ? "#98a288" : "#8a949e";
        ctx.fillRect(x - 3, y - 5, 2, 9);
        ctx.fillStyle = fl ? "#2a2d32" : sm ? "#e8e8de" : "#4f8fc8";
        ctx.fillRect(x - 3, y - 2, 6, 2);
        if (fl) {
          ctx.fillStyle = "#15171a";
          ctx.fillRect(x - 2, y + 1, 1, 1);
          ctx.fillRect(x, y + 1, 1, 1);
          ctx.fillRect(x + 2, y + 1, 1, 1);
        }
        if ((now * 10 | 0) % 2) {
          ctx.fillStyle = fl ? "#fff6c0" : sm ? "#e6e8ea" : "#cfe89a";
          ctx.fillRect(x - 1, y - 8, 2, 2);
        }
      } else {
        ctx.fillStyle = "#15171a";
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = "#5a6a3a";
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = "#7a8a52";
        ctx.fillRect(x - 3, y - 3, 3, 2);
        if ((now * 8 | 0) % 2) {
          ctx.fillStyle = "#f44";
          ctx.fillRect(x, y - 5, 2, 2);
        }
      }
    }
    for (const b of A.thrown || []) {
      if (b.floor !== F.idx) continue;
      const bx = Math.round(b.x * TS - cam.x), by = Math.round((b.y - b.z * R.ARCZ) * TS - cam.y);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(Math.round(b.x * TS - cam.x) - 4, Math.round(b.y * TS - cam.y) + 1, 9, 3);
      ctx.fillStyle = "#6a3f2e";
      ctx.fillRect(bx - 4, by - 3, 9, 6);
      ctx.fillStyle = "#8a5a44";
      ctx.fillRect(bx - 4, by - 3, 9, 2);
      ctx.fillStyle = "#4a2a1e";
      ctx.fillRect(bx - 4, by + 2, 9, 1);
    }
    for (const q of A.parts) {
      if (q.floor !== F.idx || q.smoke) continue;
      const s = Math.max(1, Math.round(q.s * PX));
      ctx.globalAlpha = q.stick === "casing" ? 1 : q.stick ? .8 : .35 + .4 * Math.max(0, Math.min(1, q.t / q.life));
      ctx.fillStyle = q.c;
      ctx.fillRect(Math.round(q.x * TS - cam.x), Math.round((q.y - q.z * .5) * TS - cam.y), s, s);
    }
    ctx.globalAlpha = 1;
    for (const b of A.bullets) {
      if (b.floor !== F.idx || !b.trail.length) continue;
      const [ox, oy] = b.trail[0];
      const mine = b.from && b.from.kind === "player";
      if (b.go === undefined) b.go = b.from && b.from._gunOff ? b.from._gunOff.slice() : null;
      const gk = (x, y) => b.go ? Math.max(0, 1 - Math.hypot(x - b.ox, y - b.oy) * TS / 64) : 0, k0 = gk(ox, oy), k1 = gk(b.x, b.y);
      const x0 = Math.round(ox * TS - cam.x + (k0 ? b.go[0] * k0 : 0)), y0 = Math.round(oy * TS - cam.y + (k0 ? b.go[1] * k0 : 0)), x1 = Math.round(b.x * TS - cam.x + (k1 ? b.go[0] * k1 : 0)), y1 = Math.round(b.y * TS - cam.y + (k1 ? b.go[1] * k1 : 0));
      ctx.strokeStyle = "rgba(240,224,180,0.28)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = mine ? "rgba(255,250,220,0.95)" : "rgba(255,220,170,0.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + .5, y0 + .5);
      ctx.lineTo(x1 + .5, y1 + .5);
      ctx.stroke();
      ctx.fillStyle = "#fffae0";
      ctx.fillRect(x1 - 1, y1 - 1, 2, 2);
    }
    const smokes = A.parts.filter(q => q.floor === F.idx && q.smoke);
    const torch = P && P.floor === F.idx ? {
      x: P.x,
      y: P.y - .4,
      a: P.aim,
      on: P.torch && P.alive
    } : null;
    SX.light.render(ctx, cam, vw, vh, F, env, torch, opt.gas, OT);
    if (F.out) SX.homeOut.glow(ctx, F, cam, vw, vh);
    if (SX.fireAnim && SX.fireAnim.sparks) SX.fireAnim.sparks(ctx, F, cam, now, ver, tx0, tx1, ty0, ty1);
    for (const q of smokes) {
      const k = q.t / q.life;
      ctx.fillStyle = q.c.replace(/[\d.]+\)$/, (Number(q.c.match(/[\d.]+\)$/)[0].slice(0, -1)) * k * .8).toFixed(2) + ")");
      const s = Math.round(q.s * PX * (1.6 - k));
      ctx.fillRect(Math.round(q.x * TS - cam.x - s / 2), Math.round((q.y - q.z * .5) * TS - cam.y - s / 2), s, s);
    }
    if (SX.tac && SX.tac.drawClouds) SX.tac.drawClouds(ctx, cam, F, TS, now, vw, vh);
    if (opt.column) {
      const c = opt.column;
      const x = Math.round(c.x * TS - cam.x), y = Math.round(c.y * TS - cam.y);
      for (let k = 0; k < 24; k++) {
        const hgt = (now * 60 + k * 15) % 180;
        const w = 6 + hgt / 10;
        ctx.fillStyle = "rgba(90,230,110," + (.5 * (1 - hgt / 180)).toFixed(2) + ")";
        ctx.fillRect(Math.round(x - w / 2 + Math.sin(now * 2 + k) * hgt / 10), y - hgt, Math.round(w), 8);
      }
    }
    if (env.rain > 0 && !env.hub) {
      const outside = P ? !F.inside[F.i(Math.floor(P.x), Math.floor(P.y))] : true;
      if (outside || F.kind === "roof") SX.light.rain(ctx, vw, vh, env.rain, view.dt, cam, true, !!env.storm);
    } else if (env.rain > 0 && env.hub) hubRain(ctx, F, cam, vw, vh, env, view.dt);
    if (SX.wx && SX.game.state === "raid") SX.wx.draw(ctx, cam, vw, vh, F, env, now, P);
    if (HL && HL.f === F.idx && ART.heli) {
      const hk = heliK(HL);
      if (hk >= 0) drawHeli(ctx, HL, hk, cam, now, drawn);
    }
    if (SX.mis && SX.mis.fx && SX.game.state === "raid") SX.mis.fx(ctx, cam, vw, vh, F, now);
    if (SX.nvg) SX.nvg.post(ctx, vw, vh, now, P, env);
    if (SX.hub && SX.hub.drawEx && SX.game.state === "hub") SX.hub.drawEx(ctx, cam, F);
    ctx.font = "16px Galmuri7";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const t of A.texts) {
      let x, y;
      if (t.a) {
        if (t.a.floor !== F.idx || t.a.dead || !drawn.has(t.a)) continue;
        x = t.a.x;
        y = t.a.y - 1.5;
      } else {
        if (t.floor !== F.idx) continue;
        x = t.x;
        y = t.y - (.9 - t.t) * .8;
      }
      const sx = Math.round(x * TS - cam.x), sy = Math.round(y * TS - cam.y);
      ctx.fillStyle = "#000";
      ctx.fillText(t.text, sx + 2, sy + 2);
      ctx.fillText(t.text, sx - 1, sy);
      ctx.fillText(t.text, sx + 1, sy);
      ctx.fillText(t.text, sx, sy - 1);
      ctx.fillStyle = t.col;
      ctx.fillText(t.text, sx, sy);
    }
    {
      const RX = SX.game.state === "raid" && SX.raid ? SX.raid.ext : null, z = RX && RX.zone;
      if (z && F.zones.indexOf(z) >= 0) {
        const s = Math.max(0, RX.t).toFixed(2), sx = Math.round(z.x * TS - cam.x) + 5, sy = Math.round((z.y + z.h) * TS - cam.y) - 4;
        ctx.textAlign = "left";
        ctx.fillStyle = "#000";
        ctx.fillText(s, sx + 2, sy + 2);
        ctx.fillText(s, sx - 1, sy);
        ctx.fillText(s, sx + 1, sy);
        ctx.fillText(s, sx, sy - 1);
        ctx.fillStyle = SX.cbc("ok", "#7cf090");
        ctx.fillText(s, sx, sy);
        ctx.textAlign = "center";
      }
    }
    {
      const tn = performance.now() / 1e3;
      for (const a of drawn) {
        if (a.kind !== "enemy" || !a.alive || a.floor !== F.idx) continue;
        const bang = a.awBangAt && tn - a.awBangAt < A.AW.bang, k = a.awShow || 0;
        if (!bang && !(k > 0 && k < 1)) continue;
        let up = 0;
        for (const t of A.texts) if (t.a === a) {
          up = 16;
          break;
        }
        const s = bang ? "!" : "?", col = bang ? "#ff5a3c" : k < .34 ? "#ffd36a" : k < .67 ? "#ffb04a" : "#ff8a2a";
        const sx = Math.round(a.x * TS - cam.x), sy = Math.round((a.y - 1.5) * TS - cam.y) - up - (a.boss || a.named ? 14 : 0);
        ctx.fillStyle = "#000";
        ctx.fillText(s, sx + 2, sy + 2);
        ctx.fillText(s, sx - 1, sy);
        ctx.fillText(s, sx + 1, sy);
        ctx.fillText(s, sx, sy - 1);
        ctx.fillStyle = col;
        ctx.fillText(s, sx, sy);
      }
    }
    ctx.font = "12px Galmuri7";
    for (const a of drawn) {
      if ((a.boss || a.named) && a.alive && a.floor === F.idx) {
        const sx = Math.round(a.x * TS - cam.x), sy = Math.round((a.y - 1.55) * TS - cam.y), k = SX.clamp(a.hp / (a.hpMax || 400), 0, 1);
        ctx.fillStyle = "#000";
        ctx.fillText(a.name, sx + 1, sy + 1);
        ctx.fillStyle = SX.cbc("boss", "#ff6a5a");
        ctx.fillText(a.name, sx, sy);
        ctx.fillStyle = "#000";
        ctx.fillRect(sx - 17, sy + 3, 34, 4);
        ctx.fillStyle = SX.cbc("boss", "#d8402e");
        ctx.fillRect(sx - 16, sy + 4, Math.round(32 * k), 2);
        continue;
      }
      if (a.kind !== "peer" || a.floor !== F.idx || !a.mate) continue;
      const sx = Math.round(a.x * TS - cam.x), sy = Math.round((a.y - 1.45) * TS - cam.y);
      const nm = a.isAlly ? a.name : a.name + (a.ng > 0 ? " [" + (a.ng + 1) + "회차]" : "") + (a.hp < 35 ? " ♥" + a.hp : "");
      ctx.fillStyle = "#000";
      ctx.fillText(nm, sx + 1, sy + 1);
      ctx.fillStyle = a.isAlly ? SX.cbc("ally", "#9fc7e8") : a.stranger ? "#e4e2d6" : SX.cbc("mate", "#6ec0ff");
      ctx.fillText(nm, sx, sy);
      if (a.title && !a.isAlly) {
        ctx.fillStyle = "#000";
        ctx.fillText("「" + a.title + "」", sx + 1, sy - 12);
        ctx.fillStyle = "#ffd76a";
        ctx.fillText("「" + a.title + "」", sx, sy - 13);
      }
    }
    if (SX.chat && SX.chat.drawBubbles) SX.chat.drawBubbles(ctx, cam, F, TS, drawn, vw, vh);
    if (opt.marks) for (const m of opt.marks) if (m.f === F.idx) marker(ctx, vw, vh, cam, m.x, m.y, m.col, m.label, now, m.big, m.edgeOnly);
    if (P && !env.hub) SX.light.vignette(ctx, vw, vh, P.hurtT * 1.4, P.alive && P.hp < 35 ? (35 - P.hp) / 45 * (.75 + Math.sin(now * 4) * .25) : 0);
    if (SX.tac && P && (!env.hub && SX.game.state === "raid" || A.canShootHere())) {
      if (P.floor === F.idx && P.alive) {
        SX.tac.drawEyes(ctx, cam, TS, now);
        SX.tac.drawAim(ctx, cam, TS, now);
      }
      SX.tac.overlay(ctx, vw, vh, now);
    }
  };
  const BM = {
    W: 176,
    H: 128,
    c: []
  };
  const bmBuf = i => {
    const c = BM.c[i] || (BM.c[i] = ART.mk(BM.W, BM.H)), g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.clearRect(0, 0, BM.W, BM.H);
    return g;
  };
  R.behindMe = function(ctx, cam, who, fn) {
    const M = MV;
    if (!M || !M.on || who === M.a) {
      fn(ctx, cam);
      return;
    }
    const W = BM.W, Hh = BM.H, ox = Math.round(who.x * TS - cam.x) - (W >> 1), oy = Math.round(who.y * TS - cam.y) - 88;
    if (M.x1 <= ox || M.x0 >= ox + W || M.y1 <= oy || M.y0 >= oy + Hh) {
      fn(ctx, cam);
      return;
    }
    const eg = bmBuf(0);
    fn(eg, {
      x: cam.x + ox,
      y: cam.y + oy
    });
    const mg = bmBuf(1);
    mg.setTransform(1, 0, 0, 1, -ox, -oy);
    drawActor(mg, M.a, cam, NOW, M.a._dim);
    let cd = null;
    if (M.L.length) {
      const cg = bmBuf(2);
      cg.setTransform(1, 0, 0, 1, -ox, -oy);
      for (const f of M.L) {
        cg.save();
        cg.fillStyle = "#000";
        f(cg);
        cg.restore();
      }
      cd = cg.getImageData(0, 0, W, Hh).data;
    }
    const e = eg.getImageData(0, 0, W, Hh), ed = e.data, md = mg.getImageData(0, 0, W, Hh).data;
    let cut = 0;
    for (let i = 3; i < ed.length; i += 4) if (ed[i] && md[i] >= 190 && !(cd && cd[i] >= 190)) {
      ed[i] = 0;
      cut++;
    }
    if (cut) eg.putImageData(e, 0, 0);
    ctx.drawImage(BM.c[0], ox, oy);
  };
  R.crosshair = function(ctx, x, y, p) {
    x = Math.round(x);
    y = Math.round(y);
    const w = p ? A.weaponOf(p) : null;
    const dist = p ? Math.hypot(SX.view.mouseWorldX - p.x, SX.view.mouseWorldY - p.y) : 5;
    const gap = Math.round(4 + (p ? Math.tan(p.spread) * dist * TS : 0));
    const O = SX.opts || {}, K = O.chSize > 1 ? Math.min(2, +O.chSize) : 1;
    const col = SX.CH_COLS && SX.CH_COLS[O.chCol | 0] || "#f2efe4";
    const ln = Math.round(8 * K), th = Math.max(2, Math.round(2 * K)), o0 = -Math.floor((th - 2) / 2);
    const segs = [ [ -gap - ln, o0, ln, th ], [ gap + 1, o0, ln, th ], [ o0, -gap - ln, th, ln ], [ o0, gap + 1, th, ln ] ];
    ctx.fillStyle = "#000";
    for (const [dx, dy, a, b] of segs) ctx.fillRect(x + dx - 1, y + dy - 1, a + 2, b + 2);
    ctx.fillStyle = col;
    for (const [dx, dy, a, b] of segs) ctx.fillRect(x + dx, y + dy, a, b);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + o0 - 1, y + o0 - 1, th + 2, th + 2);
    ctx.fillStyle = "#e0514a";
    ctx.fillRect(x + o0, y + o0, th, th);
    if (p && (p.reload || p.use)) {
      const job = p.reload || p.use, k = 1 - job.t / job.dur;
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 18, y + gap + 14, 38, 7);
      ctx.fillStyle = p.use ? "#6fcf6a" : "#f0b451";
      ctx.fillRect(x - 16, y + gap + 16, Math.round(34 * k), 3);
    }
    if (p && w && w.kind === "gun" && (w.ammo || 0) === 0 && !p.reload) {
      ctx.font = "18px Galmuri9";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#000";
      ctx.fillText("장전 " + SX.label("reload"), x + gap + 10, y + 8);
      ctx.fillStyle = "#f0b451";
      ctx.fillText("장전 " + SX.label("reload"), x + gap + 8, y + 6);
    }
    if (R.hit > 0) {
      ctx.fillStyle = R.hitCrit ? "#ffd26a" : "#fff";
      for (const [dx, dy] of [ [ -9, -9 ], [ 6, -9 ], [ -9, 6 ], [ 6, 6 ] ]) ctx.fillRect(x + dx, y + dy, 4, 4);
    }
  };
  R.scope = function(ctx, vw, vh, x, y) {
    const r = 116;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.beginPath();
    ctx.rect(0, 0, vw, vh);
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#5a5f66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x - 100, y - 1, 80, 3);
    ctx.fillRect(x + 22, y - 1, 80, 3);
    ctx.fillRect(x - 1, y - 100, 3, 80);
    ctx.fillRect(x - 1, y + 22, 3, 80);
    ctx.fillRect(x - 20, y, 40, 1);
    ctx.fillRect(x, y - 20, 1, 40);
    for (let k = -3; k <= 3; k++) if (k) ctx.fillRect(x + k * 12, y - 2, 1, 5);
    ctx.restore();
  };
})(window.SX);
