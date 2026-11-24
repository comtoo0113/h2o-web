"use strict";

(function(SX) {
  const A = SX.art;
  if (!A || !A.mk || !A.FS) return;
  const TS = SX.TS || 32, FS = A.FS, T = SX.map && SX.map.T || {
    VOID: 0,
    FLOOR: 1,
    WALL: 2,
    WINDOW: 3,
    DOOR: 4,
    STAIR: 5,
    GROUND: 6,
    PARAPET: 7
  };
  const PW = 192, PH = 96, NF = 6, FPS = 6, RLIFE = 1.2, RMAX = 24;
  const WT = SX.waterDot = {
    on: true,
    flowX: -1,
    flowY: 0,
    speed: 3,
    stats: {
      off: true
    },
    peak: {
      ms: 0
    },
    slow: [],
    rings: []
  };
  WT.still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function hash2(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  WT.hash2 = hash2;
  let FR = null, PAT = null;
  function frames() {
    if (FR) return FR;
    FR = [];
    for (let f = 0; f < NF; f++) {
      const c = A.mk(PW, PH), g = c.getContext("2d"), beat = f >> 1;
      for (let cy = 0; cy < PH / 6; cy++) for (let cx = 0; cx < PW / 8; cx++) {
        const h = hash2(cx + 101, cy + 37), x0 = cx * 8, y0 = cy * 6;
        if (h < .45) {
          const len = 2 + Math.floor(hash2(cx + 108, cy + 40) * 3), ox = 1 + Math.floor(hash2(cx + 104, cy + 48) * (7 - len)), oy = 1 + Math.floor(hash2(cx + 110, cy + 38) * 3);
          if ((beat + Math.floor(h * 7)) % 3 === 0) continue;
          g.fillStyle = "#3a5266";
          g.fillRect(x0 + ox, y0 + oy, len, 1);
          if (len > 2) {
            g.fillStyle = "#141d26";
            g.fillRect(x0 + ox + 1, y0 + oy + 1, len - 2, 1);
          }
        } else {
          const hg = hash2(cx + 151, cy + 19);
          if (hg < .2 && (beat + Math.floor(hg * 35)) % 3 === 0) {
            const len = 3 + Math.floor(hash2(cx + 157, cy + 23) * 3), ox = Math.floor(hash2(cx + 161, cy + 29) * (8 - len + 1)), oy = 1 + Math.floor(hash2(cx + 163, cy + 31) * 4);
            g.fillStyle = "#33506a";
            g.fillRect(x0 + ox, y0 + oy, len, 1);
          }
        }
      }
      FR.push(c);
    }
    return FR;
  }
  function pats(ctx) {
    if (PAT) return PAT;
    PAT = frames().map(c => ctx.createPattern(c, "repeat"));
    return PAT;
  }
  WT.frames = frames;
  const GEO = new WeakMap;
  function wantF(F) {
    return !!F && !F.out && F.kind !== "hub" && F.kind !== "roof" && !(F.kind === "floor" && F.idx > 0);
  }
  function geo(F) {
    let G = GEO.get(F);
    if (G && G.W === F.W && G.H === F.H) return G;
    const W = F.W, H = F.H, wat = new Uint8Array(W * H);
    let n = 0;
    if (wantF(F)) for (let i = 0; i < W * H; i++) if (F.t[i] === T.VOID && F.fs[i] === FS.WATER && !(F.mat && F.mat[i])) {
      wat[i] = 1;
      n++;
    }
    G = {
      W,
      H,
      n,
      wat,
      rects: [],
      edges: []
    };
    if (n) {
      let open = new Map;
      for (let y = 0; y < H; y++) {
        const next = new Map;
        let x = 0;
        while (x < W) {
          if (!wat[y * W + x]) {
            x++;
            continue;
          }
          let x1 = x;
          while (x1 + 1 < W && wat[y * W + x1 + 1]) x1++;
          const k = x * 4096 + x1, r = open.get(k);
          if (r) {
            r[3] = y;
            next.set(k, r);
          } else {
            const q = [ x, y, x1, y ];
            G.rects.push(q);
            next.set(k, q);
          }
          x = x1 + 1;
        }
        open = next;
      }
      const DX = [ 0, 1, 0, -1 ], DY = [ -1, 0, 1, 0 ];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!wat[y * W + x]) continue;
        for (let d = 0; d < 4; d++) {
          const u = x + DX[d], v = y + DY[d];
          if (u < 0 || v < 0 || u >= W || v >= H) continue;
          const j = v * W + u;
          if (!wat[j] && F.t[j] === T.GROUND) G.edges.push([ x, y, d, hash2(x * 4 + d + 7, y + 3) ]);
        }
      }
    }
    GEO.set(F, G);
    return G;
  }
  WT.geo = geo;
  const wetAt = (G, x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y);
    return tx >= 0 && ty >= 0 && tx < G.W && ty < G.H && G.wat[ty * G.W + tx] === 1;
  };
  WT.wetAt = (F, x, y) => wetAt(geo(F), x, y);
  let lastF = null, lastB = [], lastT = [];
  const deadSeen = new WeakSet, nadeSeen = new WeakSet;
  function addRing(F, x, y, now) {
    if (WT.rings.length >= RMAX) WT.rings.shift();
    WT.rings.push({
      f: F.idx,
      x,
      y,
      t0: now
    });
  }
  WT.addRing = addRing;
  function track(F, G, now) {
    const Ac = SX.actors;
    if (!Ac) return;
    if (F !== lastF) {
      lastF = F;
      lastB = [];
      lastT = [];
      WT.rings.length = 0;
      if (Ac.enemies) for (const e of Ac.enemies) if (!e.alive) deadSeen.add(e);
    }
    const B = Ac.bullets || [], TH = Ac.thrown || [];
    if (lastB.length) {
      const S = new Set(B);
      for (const q of lastB) if (!S.has(q[0]) && q[3] === F.idx && wetAt(G, q[1], q[2])) addRing(F, q[1], q[2], now);
    }
    if (lastT.length) {
      const S = new Set(TH);
      for (const q of lastT) if (!S.has(q[0]) && q[3] === F.idx && wetAt(G, q[1], q[2])) addRing(F, q[1], q[2], now);
    }
    lastB = B.map(b => [ b, b.x, b.y, b.floor ]);
    lastT = TH.map(b => [ b, b.x, b.y, b.floor ]);
    for (const n of Ac.nades || []) if (n.floor === F.idx && !nadeSeen.has(n) && (n.z == null || n.z <= .05)) {
      nadeSeen.add(n);
      if (wetAt(G, n.x, n.y)) addRing(F, n.x, n.y, now);
    }
    for (const e of Ac.enemies || []) if (!e.alive && !deadSeen.has(e)) {
      deadSeen.add(e);
      if (e.floor === F.idx && wetAt(G, e.x, e.y)) addRing(F, e.x, e.y, now);
    }
  }
  function pring(ctx, cx, cy, rx, ry, col) {
    ctx.fillStyle = col;
    const n = Math.max(8, Math.round(rx * 6)), seen = new Set;
    for (let i = 0; i < n; i++) {
      const t = Math.PI * 2 * i / n, x = Math.round(cx + Math.cos(t) * rx), y = Math.round(cy + Math.sin(t) * ry), k = x * 4096 + y;
      if (seen.has(k)) continue;
      seen.add(k);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  function drawRings(ctx, F, cam, vw, vh, now) {
    let w = 0;
    for (const r of WT.rings) {
      const age = now - r.t0;
      if (age > RLIFE || r.f !== F.idx) continue;
      WT.rings[w++] = r;
      const cx = Math.round(r.x * TS - cam.x), cy = Math.round(r.y * TS - cam.y);
      if (cx < -24 || cy < -24 || cx > vw + 24 || cy > vh + 24) continue;
      const q = Math.floor(Math.max(0, age) * 12) / 12;
      for (let i = 0; i < 3; i++) {
        const ph = (q - i * .25) / .7;
        if (ph < 0 || ph > 1) continue;
        const rx = 2 + ph * 9;
        pring(ctx, cx, cy, rx, Math.max(1, Math.round(rx * .34)), "rgba(196,214,200," + ((1 - ph) * .55).toFixed(2) + ")");
      }
      if (q < .34) for (let j = 0; j < 4; j++) {
        const ph = q / .34, s = j % 2 ? 1 : -1;
        ctx.fillStyle = "rgba(214,228,218," + ((1 - ph) * .7).toFixed(2) + ")";
        ctx.fillRect(Math.round(cx + s * (2 + ph * (3 + j))), Math.round(cy - Math.sin(ph * Math.PI) * (3 + j)), 1, 1);
      }
    }
    WT.rings.length = w;
  }
  function lights(F, env, flood) {
    const L = [], Ac = SX.actors, P = Ac && Ac.player;
    if (P && P.alive && P.torch && (P.floor == null || P.floor === F.idx)) L.push({
      x: P.x,
      y: P.y,
      c: [ 255, 236, 196 ],
      len: 20
    });
    const OT = SX.coop && SX.coop.torches ? SX.coop.torches(F.idx) : null;
    if (OT) for (const o of OT) L.push({
      x: o.x,
      y: o.y + .4,
      c: [ 255, 236, 196 ],
      len: 20
    });
    if ((flood || env && env.night) && F.lamps) for (const l of F.lamps) {
      if (l.out || l.hid) continue;
      if (F.seeOff && F.seeOff(Math.floor(l.x), Math.floor(l.y))) continue;
      L.push({
        x: l.x,
        y: l.y,
        c: l.c || [ 255, 220, 170 ],
        len: 28
      });
    }
    return L;
  }
  function streaks(ctx, F, G, cam, vw, vh, n, env, flood) {
    const L = lights(F, env, flood);
    let drawn = 0;
    const wet = flood ? (px, py) => {
      const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      if (!F.in(tx, ty)) return false;
      const t = F.t[F.i(tx, ty)];
      return t !== T.WALL && t !== T.WINDOW && t !== T.VOID && t !== T.PARAPET;
    } : (px, py) => wetAt(G, px / TS, py / TS);
    for (const l of L) {
      let wx = Math.round(l.x * TS), wy = Math.round(l.y * TS) + 3;
      if (wx - cam.x < -8 || wx - cam.x > vw + 8 || wy - cam.y < -40 || wy - cam.y > vh + 4) continue;
      if (!flood) {
        const tx = Math.floor(l.x), ty = Math.floor(l.y);
        if (!wetAt(G, tx, ty + 1) && !wetAt(G, tx, ty)) {
          if (wetAt(G, tx - 1, ty) || wetAt(G, tx - 1, ty + 1)) wx = tx * TS - 6; else if (wetAt(G, tx + 1, ty) || wetAt(G, tx + 1, ty + 1)) wx = (tx + 1) * TS + 5; else continue;
        }
      }
      const c = l.c, hs = Math.floor(l.x * 7 + l.y * 13) | 0;
      let y = 0, k = 0;
      while (y < l.len) {
        const seg = 2 + Math.floor(hash2(hs + k, 5) * 3), gap = 1 + Math.floor(hash2(hs + k, n + 9) * 3), jx = Math.round((hash2(hs * 3 + k, n) - .5) * 2.4);
        const px = wx + jx, py = wy + y;
        if (wet(px, py) && wet(px, py + seg - 1)) {
          const a = .25 * (1 - y / (l.len + 6));
          ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
          ctx.fillRect(px - cam.x, py - cam.y, 1, seg);
          drawn++;
        }
        y += seg + gap;
        k++;
      }
    }
    return drawn;
  }
  function foamW(e, s, n) {
    const tt = n / FPS, along = e[2] === 0 || e[2] === 2, u = (along ? e[0] : e[1]) * 8 + s;
    let w = 1 + Math.round(2 * (.5 + .5 * Math.sin(Math.PI * 2 * tt / 8 + e[3] * Math.PI * 2 + u * .21)));
    if (w > 1 && hash2(u * 3 + e[2], (along ? e[1] : e[0]) + (n >> 3)) < .18) w--;
    return w;
  }
  WT.foamW = foamW;
  WT.draw = function(ctx, F, cam, vw, vh, now, WD, env) {
    if (!WT.on || !F || !F.t) {
      WT.stats = {
        off: true
      };
      return;
    }
    const G = geo(F), flood = WD > .05;
    if (!G.n && !flood) {
      WT.stats = {
        off: true
      };
      return;
    }
    cam = {
      x: -Math.round(-cam.x),
      y: -Math.round(-cam.y)
    };
    const t0 = performance.now(), o = SX.opts, low = !!(o && o.lightQ === "low");
    const n = WT.still ? 0 : Math.floor(now * FPS), tt = n / FPS, f = (n % NF + NF) % NF;
    const st = WT.stats = {
      n: G.n,
      frame: f,
      rects: 0,
      foam: 0,
      rings: 0,
      streaks: 0,
      low,
      ms: 0
    };
    ctx.save();
    ctx.globalAlpha = 1;
    if (G.n) {
      const P = pats(ctx), fx = Math.round(WT.flowX * WT.speed * tt), fy = Math.round(WT.flowY * WT.speed * tt);
      const ox = ((-cam.x + fx) % PW + PW) % PW, oy = ((-cam.y + fy) % PH + PH) % PH;
      st.ox = ox;
      st.oy = oy;
      ctx.fillStyle = P[f];
      ctx.translate(ox, oy);
      for (const r of G.rects) {
        const x0 = Math.max(0, r[0] * TS - cam.x), y0 = Math.max(0, r[1] * TS - cam.y), x1 = Math.min(vw, (r[2] + 1) * TS - cam.x), y1 = Math.min(vh, (r[3] + 1) * TS - cam.y);
        if (x1 <= x0 || y1 <= y0) continue;
        ctx.fillRect(x0 - ox, y0 - oy, x1 - x0, y1 - y0);
        st.rects++;
      }
      ctx.translate(-ox, -oy);
      ctx.beginPath();
      for (const e of G.edges) {
        const sx = e[0] * TS - cam.x, sy = e[1] * TS - cam.y;
        if (sx < -TS || sy < -TS || sx > vw || sy > vh) continue;
        const d = e[2], along = d === 0 || d === 2;
        for (let s = 0; s < 8; s++) {
          const w = foamW(e, s, n);
          if (d === 0) ctx.rect(sx + s * 4, sy, 4, w); else if (d === 2) ctx.rect(sx + s * 4, sy + TS - w, 4, w); else if (d === 1) ctx.rect(sx + TS - w, sy + s * 4, w, 4); else ctx.rect(sx, sy + s * 4, w, 4);
        }
        st.foam++;
      }
      ctx.fillStyle = "rgba(176,190,188,0.5)";
      ctx.fill();
      if (SX.game && SX.game.state === "raid") track(F, G, now);
      st.rings = WT.rings.length;
      if (WT.rings.length) drawRings(ctx, F, cam, vw, vh, now);
    }
    if (!low) st.streaks = streaks(ctx, F, G, cam, vw, vh, n, env, flood);
    ctx.restore();
    const ms = st.ms = performance.now() - t0;
    if (ms > WT.peak.ms) WT.peak = {
      ms,
      rects: st.rects,
      foam: st.foam,
      rings: st.rings,
      streaks: st.streaks
    };
    if (ms > 4 && WT.slow.length < 30) WT.slow.push({
      ms: +ms.toFixed(2),
      rects: st.rects,
      foam: st.foam,
      rings: st.rings,
      streaks: st.streaks,
      kind: F.kind,
      idx: F.idx
    });
  };
  WT.info = function(F) {
    const G = geo(F);
    return {
      n: G.n,
      rects: G.rects.length,
      edges: G.edges.length
    };
  };
})(window.SX);
