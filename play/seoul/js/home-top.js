"use strict";

(function(SX) {
  const T = SX.top = {};
  T.ITEMS = {
    cup: {
      name: "유리컵",
      price: 3e3,
      mat: "glass"
    },
    mug: {
      name: "이 빠진 머그잔",
      price: 4e3,
      mat: "ceramic",
      faces: true
    },
    pet: {
      name: "생수 페트병",
      price: 2e3,
      mat: "plastic"
    },
    tumbler: {
      name: "텀블러",
      price: 7e3,
      mat: "metal"
    },
    soju: {
      name: "빈 소주병",
      price: 1e3,
      mat: "glass"
    },
    vase: {
      name: "꽃병",
      price: 9e3,
      mat: "glass"
    },
    kettle: {
      name: "전기 주전자",
      price: 14e3,
      mat: "plastic",
      faces: true
    },
    ramen: {
      name: "라면 냄비",
      price: 6e3,
      mat: "metal",
      faces: true
    },
    fruit: {
      name: "과일 접시",
      price: 6e3,
      mat: "ceramic"
    },
    cans: {
      name: "통조림 더미",
      price: 3e3,
      mat: "metal"
    },
    potS: {
      name: "작은 화분",
      price: 8e3,
      mat: "plant"
    },
    succ: {
      name: "다육이",
      price: 6e3,
      mat: "plant"
    },
    potDead: {
      name: "시든 화분",
      price: 2e3,
      mat: "plant"
    },
    lampT: {
      name: "탁상 램프",
      price: 18e3,
      mat: "metal",
      faces: true,
      light: {
        r: 2.4,
        c: [ 255, 214, 150 ],
        a: .55
      }
    },
    candles: {
      name: "양초 묶음",
      price: 5e3,
      mat: "ceramic",
      anim: 3,
      light: {
        r: 2,
        c: [ 255, 170, 90 ],
        a: .5,
        flicker: true
      }
    },
    books: {
      name: "책 더미",
      price: 6e3,
      mat: "paper",
      faces: true
    },
    bookOpen: {
      name: "펼친 책",
      price: 4e3,
      mat: "paper",
      faces: true
    },
    calendar: {
      name: "탁상 달력",
      price: 4e3,
      mat: "paper",
      faces: true
    },
    cards: {
      name: "카드 한 벌",
      price: 3e3,
      mat: "paper",
      faces: true
    },
    chess: {
      name: "체스판",
      price: 12e3,
      mat: "wood",
      faces: true
    },
    frame: {
      name: "가족사진 액자",
      price: 7e3,
      mat: "wood",
      faces: true
    },
    alarm: {
      name: "알람 시계",
      price: 9e3,
      mat: "metal",
      faces: true
    },
    radioS: {
      name: "작은 라디오",
      price: 22e3,
      mat: "plastic",
      faces: true,
      anim: 2
    },
    walkie: {
      name: "무전기",
      price: 15e3,
      mat: "plastic",
      faces: true,
      anim: 2
    },
    phone: {
      name: "금 간 휴대폰",
      price: 5e3,
      mat: "plastic",
      faces: true
    },
    torch: {
      name: "손전등",
      price: 8e3,
      mat: "metal",
      faces: true
    },
    tools: {
      name: "공구 몇 개",
      price: 9e3,
      mat: "metal",
      faces: true
    },
    medkit: {
      name: "구급 상자",
      price: 1e4,
      mat: "plastic",
      faces: true
    },
    ashtray: {
      name: "재떨이",
      price: 3e3,
      mat: "glass"
    },
    robot: {
      name: "장난감 로봇",
      price: 12e3,
      mat: "metal",
      faces: true
    },
    piggy: {
      name: "돼지 저금통",
      price: 8e3,
      mat: "ceramic",
      faces: true
    },
    globe: {
      name: "지구본",
      price: 15e3,
      mat: "plastic",
      faces: true
    }
  };
  T.MAX = 999;
  T.SURF = {
    coffeeTable: {
      p: 5,
      mat: "wood",
      s: [ [ .4, .55 ], [ .79, .3 ], [ .2, .85 ], [ .6, .85 ] ]
    },
    table: {
      px: [ 2, 6, 60, 41 ],
      mat: "wood",
      s: [ [ .15, .25 ], [ .45, .22 ], [ .8, .2 ], [ .13, .78 ], [ .42, .8 ], [ .73, .86 ] ]
    },
    desk: {
      p: 3,
      mat: "wood",
      occ: [ 4 ],
      s: [ [ .56, .38 ], [ .58, .82 ], [ .8, .74 ], [ .24, .9 ] ]
    },
    diningTable: {
      p: 5,
      mat: "wood",
      occ: [ 6 ],
      s: [ [ .33, .74 ], [ .65, .24 ], [ .15, .53 ], [ .85, .53 ] ]
    },
    nightstand: {
      p: 0,
      mat: "wood",
      occ: [ 2, 3 ],
      s: [ [ .18, .74 ], [ .86, .78 ] ]
    },
    dresser: {
      p: 0,
      mat: "wood",
      occ: [ 2 ],
      s: [ [ .26, .55 ], [ .72, .86 ] ]
    },
    vanity: {
      p: 3,
      mat: "wood",
      occ: [ 4, 5, 6, 7 ],
      s: [ [ .12, .6 ], [ .88, .62 ], [ .46, .84 ] ]
    },
    cabinet: {
      p: 0,
      mat: "metal",
      s: [ [ .3, .5 ], [ .72, .5 ] ]
    },
    counter: {
      p: 2,
      mat: "stone",
      occ: [ 5, 6, 7 ],
      s: [ [ .6, .45 ], [ .84, .3 ], [ .76, .8 ], [ .32, .84 ] ]
    },
    prepCounter: {
      p: 2,
      mat: "stone",
      occ: [ 3, 4 ],
      s: [ [ .26, .18 ], [ .55, .25 ], [ .93, .55 ], [ .62, .9 ] ]
    },
    cupboard: {
      p: 0,
      mat: "wood",
      occ: [ 1 ],
      s: [ [ .15, .76 ], [ .5, .8 ], [ .85, .76 ] ]
    },
    workbench: {
      p: 4,
      mat: "wood",
      occ: [ 0 ],
      s: [ [ .2, .82 ], [ .5, .84 ], [ .82, .3 ] ]
    },
    tv: {
      p: 0,
      mat: "wood",
      occ: [ 1, 2 ],
      s: [ [ .07, .72 ], [ .93, .72 ], [ .5, .88 ] ]
    },
    bookshelf: {
      p: 0,
      mat: "wood",
      occ: [ 1 ],
      s: [ [ .5, .5 ], [ .82, .5 ] ]
    },
    shelf: {
      p: 9,
      mat: "metal",
      s: [ [ .2, .5 ], [ .5, .5 ], [ .8, .5 ] ]
    },
    crate: {
      p: 0,
      mat: "wood",
      s: [ [ .3, .5 ], [ .72, .5 ] ]
    },
    safe: {
      p: 0,
      mat: "metal",
      s: [ [ .24, .22 ], [ .76, .22 ] ]
    },
    washer: {
      p: 0,
      mat: "metal",
      s: [ [ .3, .55 ], [ .72, .55 ] ]
    },
    stash: {
      p: 0,
      mat: "metal",
      s: [ [ .2, .5 ], [ .5, .5 ], [ .8, .5 ] ]
    },
    drum: {
      px: [ 7, 4, 18, 8 ],
      mat: "metal",
      s: [ [ .5, .5 ] ]
    },
    boxes: {
      px: [ 10, 2, 11, 6 ],
      mat: "card",
      s: [ [ .5, .55 ] ]
    }
  };
  T.slotCount = kind => T.SURF[kind] ? T.SURF[kind].s.length : 0;
  const okKind = k => typeof k === "string" && Object.prototype.hasOwnProperty.call(T.ITEMS, k);
  T.stockOf = function(h) {
    if (!h.small || typeof h.small !== "object" || Array.isArray(h.small)) h.small = {};
    return h.small;
  };
  T.give = function(h, k, n) {
    if (!okKind(k)) return 0;
    const s = T.stockOf(h), v = Math.max(0, Math.min(T.MAX, (s[k] | 0) + (n == null ? 1 : n | 0)));
    if (v) s[k] = v; else delete s[k];
    return v;
  };
  T.unload = function(f, h) {
    if (!f || !Array.isArray(f.top)) {
      if (f) delete f.top;
      return 0;
    }
    let n = 0;
    for (const q of f.top) if (q && okKind(q.k)) {
      T.give(h, q.k, 1);
      n++;
    }
    delete f.top;
    return n;
  };
  T.tidy = function(h, sel) {
    if (!h || !Array.isArray(h.furn)) return 0;
    const fixStock = () => {
      if (h.small == null) return;
      const st = T.stockOf(h);
      for (const k of Object.keys(st)) {
        const v = Math.min(T.MAX, st[k] | 0);
        if (!okKind(k) || v <= 0) delete st[k]; else st[k] = v;
      }
    };
    fixStock();
    let moved = 0;
    const away = new Set;
    for (const t in h.layouts && typeof h.layouts === "object" ? h.layouts : {}) {
      if ((t | 0) === (h.tier | 0)) continue;
      const L = h.layouts[t];
      for (const e of L && Array.isArray(L.placed) ? L.placed : []) if (e) away.add(e.id);
    }
    for (const f of h.furn) {
      if (!f || f.top == null) continue;
      if (!Array.isArray(f.top)) {
        delete f.top;
        continue;
      }
      const here = f.placed || sel && (f === sel || sel.id === f.id && sel.kind === f.kind) || away.has(f.id), n = T.slotCount(f.kind), used = new Set, keep = [];
      for (const q of f.top) {
        if (!q || !okKind(q.k)) continue;
        const s = q.s | 0;
        if (!here || s < 0 || s >= n || used.has(s) || q.s !== s) {
          T.give(h, q.k, 1);
          moved++;
          continue;
        }
        used.add(s);
        keep.push({
          k: q.k,
          s,
          r: (q.r | 0) & 3
        });
      }
      if (keep.length) f.top = keep; else delete f.top;
    }
    fixStock();
    return moved;
  };
  if (!SX.home || !SX.art || !SX.art.prop) return;
  const H = SX.home, A = SX.art, TS = 32;
  const still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const save = () => H.save();
  T.count = k => T.stockOf(save())[k] | 0;
  T.stockTotal = () => {
    const s = T.stockOf(save());
    let n = 0;
    for (const k in s) n += s[k] | 0;
    return n;
  };
  T.placedCount = k => {
    let n = 0;
    for (const f of save().furn) if (Array.isArray(f.top)) for (const q of f.top) if (q && q.k === k) n++;
    return n;
  };
  T.owned = k => T.count(k) + T.placedCount(k);
  const turnPt = (u, v, r) => r === 1 ? [ v, 1 - u ] : r === 2 ? [ 1 - u, 1 - v ] : r === 3 ? [ 1 - v, u ] : [ u, v ];
  const geoCache = new Map, slotCache = new Map;
  function geom(kind, rot) {
    const key = kind + ":" + ((rot | 0) & 3);
    if (geoCache.has(key)) return geoCache.get(key);
    const S = T.SURF[kind], d = A.propDef(kind);
    let out = null;
    if (S && d) {
      let r = (rot | 0) & 3;
      if (d.noRot) r = 0;
      const M = A.rotModel && A.rotModel(kind);
      if (S.p != null && M && M._geo && !d.rotSym) {
        const G = M._geo(r), pad = M.pad == null ? 3 : M.pad, q = G.parts[S.p];
        const dy = r === 0 && !M.front ? d.up - G.up : 0;
        const rc = p => {
          const X = pad + Math.round(p.x * G.Wpx), W = Math.max(1, Math.round(p.w * G.Wpx)), td = p.src.noTop ? 0 : Math.max(0, Math.round(p.d * p.dpx)), fb = G.B - Math.round((1 - p.y - p.d) * G.Dpx) - p.z, fy = fb - p.hh;
          return {
            x: X,
            y: fy - td + dy,
            w: W,
            d: td,
            h: td + p.hh
          };
        };
        if (q) {
          out = {
            r,
            part: q,
            top: rc(q),
            occ: (S.occ || []).map(i => G.parts[i] ? {
              p: G.parts[i],
              rc: rc(G.parts[i])
            } : null).filter(Boolean)
          };
          if (r === 0 && S.r0) out.top = {
            x: S.r0[0],
            y: S.r0[1],
            w: S.r0[2],
            d: S.r0[3]
          };
        }
      } else if (S.px) {
        const W = d.fw * TS, flip = !!(d.rotSym && r & 2);
        out = {
          r: 0,
          flip,
          part: null,
          top: {
            x: flip ? W - S.px[0] - S.px[2] : S.px[0],
            y: S.px[1],
            w: S.px[2],
            d: S.px[3]
          },
          occ: []
        };
      }
    }
    geoCache.set(key, out);
    return out;
  }
  T.geom = geom;
  T.slots = function(kind, rot) {
    const key = kind + ":" + ((rot | 0) & 3);
    let L = slotCache.get(key);
    if (L) return L;
    const g = geom(kind, rot), S = T.SURF[kind];
    L = [];
    if (g && S) for (const [u, v] of S.s) {
      if (g.part) {
        const [tu, tv] = turnPt(u, v, g.r);
        L.push({
          x: Math.round(g.top.x + tu * g.top.w),
          y: Math.round(g.top.y + tv * g.top.d),
          dep: g.part.y + tv * g.part.d
        });
      } else {
        const uu = g.flip ? 1 - u : u;
        L.push({
          x: Math.round(g.top.x + uu * g.top.w),
          y: Math.round(g.top.y + v * g.top.d),
          dep: v
        });
      }
    }
    slotCache.set(key, L);
    return L;
  };
  const usedOf = f => {
    const u = new Set;
    if (f && Array.isArray(f.top)) for (const q of f.top) if (q) u.add(q.s | 0);
    if (f && SX.ride && SX.ride.blocked) for (const i of SX.ride.blocked(f)) u.add(i);
    return u;
  };
  T.freeSlots = f => {
    const u = usedOf(f), n = T.slotCount(f.kind), out = [];
    for (let i = 0; i < n; i++) if (!u.has(i)) out.push(i);
    return out;
  };
  const spriteOf = p => A.prop(p.kind, p.v, p.col, p.rot);
  const worldOf = (p, spr, s) => ({
    x: (p.px != null ? p.px : p.x) + s.x / TS,
    y: (p.py != null ? p.py : p.y) + (s.y + spr.oy) / TS
  });
  const frameOf = (k, seed, now) => {
    const n = T.ITEMS[k] && T.ITEMS[k].anim || 1;
    if (n < 2 || still) return 0;
    return Math.floor(now * (k === "candles" ? 7 : 1.6) + seed * .37) % n;
  };
  function drawItem(ctx, k, face, fr, ax, ay, o) {
    const s = A.small && A.small(k, face, fr);
    if (!s) return null;
    const x = Math.round(ax - s.ax), y = Math.round(ay - s.ay), box = {
      x,
      y,
      w: s.c.width,
      h: s.c.height
    };
    const clip = o && o.clip && o.clip.filter(r => r.x < x + box.w && r.x + r.w > x && r.y < y + box.h && r.y + r.h > y);
    ctx.save();
    if (clip && clip.length) for (const r of clip) {
      ctx.beginPath();
      ctx.rect(x - 1, y - 1, box.w + 2, box.h + 2);
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip("evenodd");
    }
    if (o && o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(s.c, x, y);
    if (o && o.hl) {
      ctx.globalAlpha = .3 + Math.sin((o.now || 0) * 6) * .1;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(s.c, x, y);
    }
    ctx.restore();
    return box;
  }
  function fitX(g, sx, k, face) {
    const s = A.small && A.small(k, face, 0);
    if (!s || !g) return sx;
    const w = s.c.width - 2, lo = g.top.x - 1 + s.ax, hi = g.top.x + g.top.w - 1 - w + s.ax;
    return hi < lo ? Math.round((lo + hi) / 2) : Math.max(lo, Math.min(hi, sx));
  }
  T.fitX = fitX;
  function clipsFor(g, sl, x, y, v) {
    const out = [];
    if (!g || !g.occ) return out;
    for (const o of g.occ) {
      if (o.p.src.cond && !o.p.src.cond(v | 0)) continue;
      if (o.p.y + o.p.d <= sl.dep + .02) continue;
      out.push({
        x: x + o.rc.x,
        y: y + o.rc.y,
        w: o.rc.w,
        h: o.rc.h
      });
    }
    return out;
  }
  function marker(ctx, cx, cy, now, on) {
    const a = on ? 1 : still ? .85 : .72 + Math.sin(now * 5) * .22, c = SX.cbc ? SX.cbc("ok", "rgba(140,255,156," + a.toFixed(2) + ")", a) : "rgba(140,255,156," + a + ")";
    ctx.fillStyle = "rgba(10,12,20,0.7)";
    ctx.fillRect(cx - 3, cy - 1, 7, 3);
    ctx.fillRect(cx - 1, cy - 3, 3, 7);
    ctx.fillStyle = c;
    ctx.fillRect(cx - 2, cy, 5, 1);
    ctx.fillRect(cx, cy - 2, 1, 5);
    if (on) {
      ctx.fillRect(cx - 3, cy - 3, 2, 1);
      ctx.fillRect(cx + 2, cy - 3, 2, 1);
      ctx.fillRect(cx - 3, cy + 3, 2, 1);
      ctx.fillRect(cx + 2, cy + 3, 2, 1);
    }
  }
  T.drawOn = function(ctx, p, x, y, now) {
    const f = p.furn;
    if (!f || !T.SURF[p.kind]) return;
    const d = H.deco, held = d && d.held && !d.roomTab ? d.held : null, top = Array.isArray(f.top) ? f.top : null, rl = SX.ride && SX.ride.listOn ? SX.ride.listOn(p) : null;
    if (!held && !(top && top.length) && !(rl && rl.length)) return;
    const sl = T.slots(p.kind, p.rot);
    if (!sl.length) return;
    const g = geom(p.kind, p.rot), rot = (p.rot | 0) & 3, tg = held && d.topAt && d.topAt.p === p && d.topAt.s != null ? d.topAt : null, hv = d && d.topHover && d.topHover.p === p ? d.topHover : null;
    if (held) {
      const used = usedOf(f), free = sl.filter((q, i) => !used.has(i));
      if (free.length) {
        const t = g.top, a = still ? .5 : .48 + Math.sin(now * 4) * .14;
        ctx.fillStyle = SX.cbc ? SX.cbc("ok", "rgba(110,240,130," + a.toFixed(2) + ")", a) : "rgba(110,240,130,0.4)";
        ctx.fillRect(x + t.x, y + t.y, t.w, 1);
        ctx.fillRect(x + t.x, y + t.y + Math.max(1, t.d) - 1, t.w, 1);
        ctx.fillRect(x + t.x, y + t.y, 1, Math.max(1, t.d));
        ctx.fillRect(x + t.x + t.w - 1, y + t.y, 1, Math.max(1, t.d));
      }
      sl.forEach((q, i) => {
        if (!used.has(i)) marker(ctx, x + q.x, y + q.y, now, !!(tg && tg.s === i));
      });
    }
    const list = [];
    if (top) top.forEach((q, i) => {
      const s = sl[q.s];
      if (s) list.push({
        k: q.k,
        r: q.r | 0,
        s,
        i,
        seed: (f.id | 0) * 7 + q.s
      });
    });
    if (tg) list.push({
      k: held.k,
      r: held.r | 0,
      s: sl[tg.s],
      ghost: true,
      seed: 0
    });
    if (rl) for (const e of rl) list.push(e);
    list.sort((a, b) => a.s.y - b.s.y || a.s.x - b.s.x);
    for (const e of list) {
      if (e.ride) {
        SX.ride.drawOne(ctx, e, x, y, now);
        continue;
      }
      const fc = e.r + rot & 3;
      drawItem(ctx, e.k, fc, frameOf(e.k, e.seed, now), x + fitX(g, e.s.x, e.k, fc), y + e.s.y, {
        clip: clipsFor(g, e.s, x, y, p.v),
        alpha: e.ghost ? .78 : p.hl ? 1 : null,
        hl: hv && hv.i === e.i && !e.ghost || p.hl && !e.ghost,
        now
      });
    }
  };
  T.drawGhostTop = function(ctx, ghost, x, y, now) {
    const d = H.deco, f = d && d.sel;
    if (!f || f.kind !== ghost.kind) return;
    const rl = SX.ride && SX.ride.listGhost ? SX.ride.listGhost(ghost) : [];
    if (!(Array.isArray(f.top) && f.top.length) && !rl.length) return;
    const sl = T.slots(ghost.kind, ghost.rot), g = geom(ghost.kind, ghost.rot), rot = (ghost.rot | 0) & 3;
    const list = (Array.isArray(f.top) ? f.top : []).map(q => ({
      q,
      s: sl[q.s]
    })).filter(e => e.s).concat(rl).sort((a, b) => a.s.y - b.s.y);
    for (const e of list) {
      if (e.ride) {
        SX.ride.drawOne(ctx, e, x, y, now);
        continue;
      }
      const fc = (e.q.r | 0) + rot & 3;
      drawItem(ctx, e.q.k, fc, 0, x + fitX(g, e.s.x, e.q.k, fc), y + e.s.y, {
        clip: clipsFor(g, e.s, x, y, ghost.v),
        alpha: .7
      });
    }
  };
  T.drawCursor = function(ctx, cam, now) {
    const d = H.deco;
    if (!d || !d.held || d.roomTab || d.topAt && d.topAt.s != null) return;
    const V = SX.view, sx = Math.round(V.mouseWorldX * TS - cam.x), sy = Math.round(V.mouseWorldY * TS - cam.y) + 6;
    const b = drawItem(ctx, d.held.k, d.held.r | 0, 0, sx, sy, {
      alpha: .55
    });
    if (!b) return;
    ctx.fillStyle = SX.cbc ? SX.cbc("bad", "#f05046") : "#f05046";
    ctx.fillRect(b.x - 1, sy + 3, b.w + 2, 1);
    if (d.topAt && d.topAt.full) {
      ctx.fillRect(sx - 3, sy + 5, 7, 1);
    }
  };
  T.lights = function(F) {
    for (const p of F.props) {
      const f = p.furn;
      if (!f || !Array.isArray(f.top) || !T.SURF[p.kind]) continue;
      const sl = T.slots(p.kind, p.rot), spr = spriteOf(p);
      if (!spr) continue;
      for (const q of f.top) {
        const it = T.ITEMS[q.k], s = sl[q.s];
        if (!it || !it.light || !s) continue;
        const w = worldOf(p, spr, s);
        F.lamps.push({
          x: w.x,
          y: w.y - .3,
          r: it.light.r,
          c: it.light.c,
          a: it.light.a,
          furn: true,
          flicker: !!it.light.flicker && !still
        });
      }
    }
  };
  const SND_ITEM = {
    glass: "topGlass",
    ceramic: "topCeramic",
    plastic: "topPlastic",
    metal: "topMetal",
    paper: "topPaper",
    plant: "topCeramic",
    wood: "topWood"
  };
  const SND_SURF = {
    wood: "surfWood",
    metal: "surfMetal",
    stone: "surfStone",
    card: "surfCard"
  };
  T.sound = function(k, kind, put) {
    const it = T.ITEMS[k], S = T.SURF[kind], Au = SX.audio;
    if (!it || !Au) return;
    if (put) {
      Au.play(SND_ITEM[it.mat] || "pickup", {
        v: .9
      });
      if (it.mat === "plant") Au.play("topSoil", {
        delay: .05,
        v: .7
      });
      if (S && SND_SURF[S.mat]) Au.play(SND_SURF[S.mat], {
        delay: .012,
        v: it.mat === "paper" ? .45 : .75
      });
    } else {
      Au.play(SND_ITEM[it.mat] || "pickup", {
        v: .45,
        r: 1.06
      });
      Au.play("pickup", {
        delay: .04,
        v: .55
      });
    }
  };
  const furnProps = F => F.props.filter(p => p.furn && T.SURF[p.kind] && !p.hidden);
  function itemRect(p, spr, s, k, face) {
    const it = A.small && A.small(k, face, 0);
    if (!it) return null;
    const w = worldOf(p, spr, {
      x: fitX(geom(p.kind, p.rot), s.x, k, face),
      y: s.y
    });
    return {
      x0: w.x - it.ax / TS,
      x1: w.x + (it.c.width - it.ax) / TS,
      y0: w.y - it.ay / TS,
      y1: w.y + (it.c.height - it.ay) / TS,
      foot: w.y
    };
  }
  T.itemAt = function(F, mx, my) {
    let best = null;
    for (const p of furnProps(F)) {
      const f = p.furn;
      if (!Array.isArray(f.top) || !f.top.length) continue;
      const sl = T.slots(p.kind, p.rot), spr = spriteOf(p);
      if (!spr) continue;
      f.top.forEach((q, i) => {
        const s = sl[q.s];
        if (!s) return;
        const r = itemRect(p, spr, s, q.k, (q.r | 0) + (p.rot | 0) & 3);
        if (!r) return;
        if (mx >= r.x0 - .04 && mx < r.x1 + .04 && my >= r.y0 - .04 && my < r.y1 + .04 && (!best || r.foot > best.foot)) best = {
          p,
          f,
          i,
          foot: r.foot
        };
      });
    }
    return best;
  };
  T.target = function(F) {
    const d = H.deco, V = SX.view;
    if (!d || !F) return null;
    const mx = V.mouseWorldX, my = V.mouseWorldY;
    if (d.kb) {
      if (Math.hypot(mx - d.kb.mx, my - d.kb.my) > .2) d.kb = null; else {
        const p = F.props.find(q => q.furn && q.furn.id === d.kb.fid);
        if (p && !usedOf(p.furn).has(d.kb.s)) return {
          p,
          f: p.furn,
          s: d.kb.s
        };
        d.kb = null;
      }
    }
    let best = null, full = null;
    for (const p of furnProps(F)) {
      const sl = T.slots(p.kind, p.rot), spr = spriteOf(p);
      if (!spr) continue;
      const used = usedOf(p.furn);
      sl.forEach((s, i) => {
        const w = worldOf(p, spr, s), dist = Math.hypot(mx - w.x, (my - (w.y - .14)) * 1.25);
        if (dist > .55) return;
        if (used.has(i)) {
          if (!full || dist < full.dist) full = {
            p,
            dist
          };
          return;
        }
        if (!best || dist < best.dist) best = {
          p,
          f: p.furn,
          s: i,
          dist
        };
      });
    }
    return best || (full ? {
      p: full.p,
      full: true
    } : null);
  };
  function freeAll(F) {
    const out = [];
    for (const p of furnProps(F)) {
      const sl = T.slots(p.kind, p.rot), spr = spriteOf(p);
      if (!spr) continue;
      const used = usedOf(p.furn);
      sl.forEach((s, i) => {
        if (used.has(i)) return;
        const w = worldOf(p, spr, s);
        out.push({
          p,
          s: i,
          x: w.x,
          y: w.y
        });
      });
    }
    return out;
  }
  function kbMove(F, dx, dy) {
    const d = H.deco, V = SX.view, all = freeAll(F);
    if (!all.length) {
      SX.audio.play("denied");
      return;
    }
    const cur = d.topAt && d.topAt.s != null ? all.find(q => q.p === d.topAt.p && q.s === d.topAt.s) : null;
    const ox = cur ? cur.x : V.mouseWorldX, oy = cur ? cur.y : V.mouseWorldY;
    let best = null, bs = 1e9;
    for (const q of all) {
      if (q === cur) continue;
      const vx = q.x - ox, vy = q.y - oy, along = vx * dx + vy * dy, side = Math.abs(vx * dy - vy * dx);
      if (cur && along <= .05) continue;
      const sc = cur ? along + side * 2.2 : Math.hypot(vx, vy);
      if (sc < bs) {
        bs = sc;
        best = q;
      }
    }
    if (!best) {
      SX.audio.play("denied");
      return;
    }
    d.kb = {
      fid: best.p.furn.id,
      s: best.s,
      mx: V.mouseWorldX,
      my: V.mouseWorldY
    };
    SX.audio.play("click");
  }
  T.held = () => !!(H.deco && H.deco.held);
  T.hold = function(k) {
    const d = H.deco;
    if (!d || !okKind(k)) return false;
    if (T.count(k) <= 0) {
      SX.audio.play("denied");
      return false;
    }
    if (d.sel) H.store(d.sel);
    d.held = {
      k,
      r: d.held && d.held.k === k ? d.held.r | 0 : 0
    };
    d.kb = null;
    d.topAt = null;
    SX.audio.play("click");
    SX.ui.renderDeco();
    return true;
  };
  T.drop = function() {
    const d = H.deco;
    if (!d || !d.held) return;
    d.held = null;
    d.kb = null;
    d.topAt = null;
    SX.audio.play("rustle");
    SX.ui.renderDeco();
  };
  T.rotate = function(dirn) {
    const d = H.deco;
    if (!d || !d.held) return;
    const it = T.ITEMS[d.held.k];
    if (!it.faces) {
      SX.log("이 물건은 돌려도 모습이 같습니다");
      return;
    }
    d.held.r = (((d.held.r | 0) + (dirn || 1)) % 4 + 4) % 4;
    SX.audio.play("click");
    SX.ui.renderDeco();
  };
  function place(F, tg) {
    const d = H.deco, k = d.held.k, h = save(), f = H.live(tg.f);
    if (T.count(k) <= 0) {
      d.held = null;
      SX.audio.play("denied");
      SX.ui.renderDeco();
      return false;
    }
    if (usedOf(f).has(tg.s) || tg.s >= T.slotCount(f.kind)) {
      SX.audio.play("denied");
      return false;
    }
    T.give(h, k, -1);
    if (!Array.isArray(f.top)) f.top = [];
    f.top.push({
      k,
      s: tg.s,
      r: d.held.r | 0
    });
    T.sound(k, f.kind, true);
    if (T.count(k) > 0 && (SX.input.down.has("ShiftLeft") || SX.input.down.has("ShiftRight"))) d.held = {
      k,
      r: d.held.r | 0
    }; else d.held = null;
    d.kb = null;
    d.topAt = null;
    SX.map.homeLights(F);
    SX.ui.renderDeco();
    SX.game.persist();
    return true;
  }
  function pickUp(F, hv) {
    const d = H.deco, f = H.live(hv.f), q = f.top && f.top[hv.i];
    if (!q) return false;
    f.top.splice(hv.i, 1);
    if (!f.top.length) delete f.top;
    T.give(save(), q.k, 1);
    d.held = {
      k: q.k,
      r: q.r | 0
    };
    d.topHover = null;
    d.kb = null;
    T.sound(q.k, f.kind, false);
    SX.map.homeLights(F);
    SX.ui.renderDeco();
    SX.game.persist();
    return true;
  }
  T.update = function(dt) {
    const d = H.deco;
    if (!d) return false;
    d.topHover = null;
    if (d.roomTab) {
      d.topAt = null;
      return false;
    }
    const In = SX.input, V = SX.view, F = SX.hub.floor();
    if (!F) return false;
    if (d.held) {
      if (In.hit.has("KeyR") || In.hit.has("KeyQ")) T.rotate(In.hit.has("KeyQ") ? -1 : 1);
      if (In.wheel) T.rotate(In.wheel > 0 ? 1 : -1);
      for (const [code, dx, dy] of [ [ "ArrowLeft", -1, 0 ], [ "ArrowRight", 1, 0 ], [ "ArrowUp", 0, -1 ], [ "ArrowDown", 0, 1 ] ]) if (In.hit.has(code)) kbMove(F, dx, dy);
      d.topAt = T.target(F);
      if (In.hit.has("Mouse0")) {
        if (d.topAt && d.topAt.s != null) place(F, d.topAt); else {
          SX.audio.play("denied");
          SX.log(d.topAt && d.topAt.full ? "그 가구 위는 꽉 찼습니다 — 다른 가구 위 빈자리에 놓으시면 됩니다" : "탁자 · 책상 · 서랍장 같은 가구 위 빈자리(초록 십자)에 놓으시면 됩니다");
        }
      }
      if (In.hit.has("Mouse2")) T.drop();
      return true;
    }
    d.topAt = null;
    if (d.sel) return false;
    const hv = T.itemAt(F, V.mouseWorldX, V.mouseWorldY);
    if (!hv) return false;
    d.topHover = hv;
    if (In.hit.has("Mouse0")) pickUp(F, hv);
    return true;
  };
  T.stop = function() {
    const d = H.deco;
    if (d) {
      d.held = null;
      d.topAt = null;
      d.topHover = null;
      d.kb = null;
    }
  };
  T.buy = function(k, n) {
    const s = SX.game.save, it = T.ITEMS[k];
    if (!it) return false;
    n = Math.max(1, n | 0);
    if (T.count(k) + n > T.MAX) {
      SX.audio.play("denied");
      SX.log("더는 둘 곳이 없습니다 — " + it.name + " " + T.MAX + "개까지");
      return false;
    }
    if (s.money < it.price * n) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return false;
    }
    s.money -= it.price * n;
    T.give(s.home, k, n);
    SX.audio.play("buy");
    SX.log("샀습니다: " + it.name + (n > 1 ? " ×" + n : "") + " — 셸터 [" + SX.label("deco") + "] 꾸미기에서 탁자 위에 올리시면 됩니다");
    SX.game.persist();
    return true;
  };
  T.sell = function(k) {
    const s = SX.game.save, it = T.ITEMS[k], d = H.deco;
    if (!it || T.count(k) <= 0) return false;
    if (d && d.held && d.held.k === k && T.count(k) <= 1) d.held = null;
    T.give(s.home, k, -1);
    const got = Math.round(it.price / 2);
    s.money += got;
    SX.audio.play("buy");
    SX.log("팔았습니다: " + it.name + " +" + SX.won(got));
    SX.ui.renderDeco && SX.ui.renderDeco();
    SX.game.persist();
    return true;
  };
  const esc = t => SX.esc ? SX.esc(t) : String(t);
  T.thumb = function(k, face) {
    const s = A.small && A.small(k, face | 0, 0), cv = document.createElement("canvas");
    cv.className = "thumb topThumb";
    if (!s) return cv;
    const z = 2;
    cv.width = s.c.width * z;
    cv.height = s.c.height * z;
    const x = cv.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.drawImage(s.c, 0, 0, cv.width, cv.height);
    return cv;
  };
  const MAT = {
    glass: "유리",
    ceramic: "도자기",
    plastic: "플라스틱",
    metal: "쇠붙이",
    paper: "종이",
    plant: "흙 화분",
    wood: "나무 재질"
  };
  T.TAB = [ "top", "탁자 위" ];
  T.shopRows = function(grid, redo) {
    const h = document.createElement("div");
    h.className = "cat";
    h.textContent = "탁자 위 · 작은 물건";
    h.style.gridColumn = "1 / -1";
    grid.appendChild(h);
    const tip = document.createElement("div");
    tip.className = "small topTip";
    tip.style.gridColumn = "1 / -1";
    tip.textContent = "탁자 · 책상 · 서랍장 · 선반 같은 가구 위 빈자리에 올립니다. 산 것은 셸터 창고에 들어갑니다 — [" + SX.label("deco") + "] 꾸미기에서 올리시면 됩니다.";
    grid.appendChild(tip);
    for (const [k, it] of Object.entries(T.ITEMS)) {
      const r = document.createElement("div");
      r.className = "li topLi";
      r.dataset.top = k;
      r.appendChild(T.thumb(k, 0));
      const own = T.owned(k), nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = esc(it.name) + (own ? ` <span class="small">가진 것 ${own}</span>` : "") + `<br><span class="small">${esc(MAT[it.mat] || "")}${it.light ? " · 불빛" : ""}${it.faces ? " · 방향 바꿈" : ""}</span>`;
      r.appendChild(nm);
      const pr = document.createElement("span");
      pr.className = "pr";
      pr.textContent = SX.won(it.price);
      r.appendChild(pr);
      const b = document.createElement("button");
      b.textContent = "구매";
      b.onclick = () => {
        if (T.buy(k)) redo();
      };
      r.appendChild(b);
      grid.appendChild(r);
    }
  };
  T.heldBox = function(body) {
    const d = H.deco;
    if (!d || !d.held) return;
    const k = d.held.k, it = T.ITEMS[k], box = document.createElement("div");
    box.className = "box topHeld";
    box.innerHTML = `<h3><span>들고 있는 것: ${esc(it.name)}</span><span class="small">창고 ${T.count(k)}</span></h3><p class="small">초록 십자 = 빈자리 · 좌클릭 = 올리기 · 방향키 = 다음 빈자리 · ${it.faces ? "R/휠 = 돌리기 · " : ""}우클릭 = 내려놓기(창고로) · Shift+좌클릭 = 하나 더</p>`;
    const rr = document.createElement("div");
    rr.className = "row";
    rr.style.gap = "var(--u)";
    rr.style.alignItems = "center";
    rr.appendChild(T.thumb(k, d.held.r | 0));
    if (it.faces) {
      const b1 = document.createElement("button");
      b1.textContent = "↻ 돌리기";
      b1.onclick = () => T.rotate(1);
      rr.appendChild(b1);
      const b2 = document.createElement("button");
      b2.textContent = "↺";
      b2.onclick = () => T.rotate(-1);
      rr.appendChild(b2);
    }
    const bb = document.createElement("div");
    bb.className = "row";
    bb.style.gap = "var(--u)";
    const st = document.createElement("button");
    st.textContent = "창고에 넣기";
    st.onclick = () => T.drop();
    bb.appendChild(st);
    const sl = document.createElement("button");
    sl.textContent = "판매(반값 " + SX.won(it.price / 2) + ")";
    sl.onclick = () => SX.ui.ask(it.name + " 판매", "하나를 반값 " + SX.won(it.price / 2) + "에 팝니다.", 0, () => T.sell(k));
    bb.appendChild(sl);
    box.append(rr, bb);
    body.appendChild(box);
  };
  T.selNote = function(f) {
    const n = f && Array.isArray(f.top) ? f.top.length : 0;
    return n ? `<p class="small topNote">위에 둔 작은 물건 ${n}개도 같이 옮겨집니다 — 창고에 넣거나 팔면 물건은 창고로 돌아갑니다</p>` : "";
  };
  T.decoList = function(body) {
    const d = H.deco, st = T.stockOf(save()), ks = Object.keys(T.ITEMS).filter(k => (st[k] | 0) > 0);
    const sh = document.createElement("div"), c = document.createElement("span");
    sh.className = "small decoSec topSec";
    c.className = "n";
    c.textContent = T.stockTotal();
    sh.append(document.createTextNode("탁자 위 · 작은 물건"), c);
    body.appendChild(sh);
    if (!ks.length) {
      const p = document.createElement("p");
      p.className = "small";
      p.textContent = "창고에 작은 물건이 없습니다 — 장터 가구점 「탁자 위 · 작은 물건」에서 살 수 있습니다. 놓인 물건을 누르면 다시 집습니다.";
      body.appendChild(p);
      return;
    }
    const fl = document.createElement("div");
    fl.className = "fl topFl";
    for (const k of ks) {
      const it = T.ITEMS[k], e = document.createElement("div");
      e.className = "fi topFi" + (d && d.held && d.held.k === k ? " on" : "");
      e.dataset.top = k;
      e.appendChild(T.thumb(k, 0));
      e.appendChild(document.createTextNode(it.name));
      const n = document.createElement("span");
      n.className = "small";
      n.textContent = " ×" + (st[k] | 0);
      e.appendChild(n);
      e.title = "누르면 집습니다 — 가구 위 빈자리에 올리시면 됩니다";
      e.onclick = () => T.hold(k);
      fl.appendChild(e);
    }
    body.appendChild(fl);
  };
  T.hint = () => "좌클릭 = 탁자 위 빈자리에 올리기 · 방향키 = 다음 빈자리 · R/휠 = 돌리기 · 우클릭 = 창고로 · " + SX.label("deco") + "/Esc 끝";
})(window.SX);
