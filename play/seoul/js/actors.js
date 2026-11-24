"use strict";

(function(SX) {
  const TS = SX.TS, T = SX.map.T, I = SX.items;
  const A = SX.actors = {
    enemies: [],
    allies: [],
    bullets: [],
    nades: [],
    parts: [],
    texts: [],
    player: null
  };
  A.infight = {
    hits: 0,
    kills: 0
  };
  const R = .24, PROP_IN = .16;
  const FEET = .7;
  function solidInset(F, tx, ty) {
    if (!F.in(tx, ty)) return 0;
    const i = ty * F.W + tx, t = F.t[i];
    if (t === T.WALL || t === T.WINDOW || t === T.VOID || t === T.PARAPET) return 0;
    if (t === T.DOOR) {
      const d = F.doorAt.get(i);
      if (!d || !d.open || d.locked) return .04;
      return -1;
    }
    if (F.solid[i]) return PROP_IN;
    return -1;
  }
  function hitsAt(F, x, y, r) {
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ins = solidInset(F, tx, ty);
      if (ins < 0) continue;
      if (ins === PROP_IN) {
        const pp = F.propAt[ty * F.W + tx];
        if (pp && pp.auto) {
          const rr = r * FEET;
          let hit = false;
          for (const q of pp.hit.walk) {
            const cx = x < q.x0 ? q.x0 : x > q.x1 ? q.x1 : x, cy = y < q.y0 ? q.y0 : y > q.y1 ? q.y1 : y;
            if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < rr * rr - 1e-6) {
              hit = true;
              break;
            }
          }
          if (hit) return true;
          continue;
        }
        if (pp && pp.fine) continue;
      }
      const cx = x < tx + ins ? tx + ins : x > tx + 1 - ins ? tx + 1 - ins : x;
      const cy = y < ty + ins ? ty + ins : y > ty + 1 - ins ? ty + 1 - ins : y;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r - 1e-6) return true;
    }
    if (F.fine) for (const p of F.fine) {
      const rs = p.hit ? p.hit.walk || p.hit.rects : [ {
        x0: p.x + PROP_IN,
        x1: p.x + p.w - PROP_IN,
        y0: p.y + PROP_IN,
        y1: p.y + p.h - PROP_IN
      } ];
      const rr = p.hit ? r * FEET : r;
      for (const q of rs) {
        const cx = x < q.x0 ? q.x0 : x > q.x1 ? q.x1 : x, cy = y < q.y0 ? q.y0 : y > q.y1 ? q.y1 : y;
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < rr * rr - 1e-6) return true;
      }
    }
    return false;
  }
  function slide(F, a, r, dx, dy) {
    const along = dx !== 0 ? "x" : "y", d = dx || dy, mag = Math.abs(d);
    for (const off of [ .08, .16, .24, .32, .4 ]) for (const sg of [ 1, -1 ]) {
      const ox = along === "x" ? 0 : off * sg, oy = along === "x" ? off * sg : 0;
      if (hitsAt(F, a.x + ox, a.y + oy, r)) continue;
      if (hitsAt(F, a.x + ox + dx, a.y + oy + dy, r)) continue;
      const k = Math.min(1, mag * 1.2 / off);
      const nx = a.x + ox * k, ny = a.y + oy * k;
      if (!hitsAt(F, nx, ny, r)) {
        a.x = nx;
        a.y = ny;
        return true;
      }
    }
    return false;
  }
  let wmOn = false;
  A.move = function(F, a, dx, dy) {
    if (!wmOn && a !== A.player && SX.raid && SX.raid.flood && SX.raid.on) {
      const m = SX.raid.wMul(a.floor);
      if (m < 1) {
        wmOn = true;
        const r = A.move(F, a, dx * m, dy * m);
        wmOn = false;
        return r;
      }
    }
    const big = Math.max(Math.abs(dx), Math.abs(dy));
    if (big > .2) {
      const n = Math.min(12, Math.ceil(big / .2));
      let any = false;
      for (let k = 0; k < n; k++) if (A.move(F, a, dx / n, dy / n)) any = true;
      return any;
    }
    const r = a.r || R;
    let moved = false;
    if (dx) {
      if (!hitsAt(F, a.x + dx, a.y, r)) {
        a.x += dx;
        moved = true;
      } else if (!dy && slide(F, a, r, dx, 0)) moved = true; else {
        const s = Math.sign(dx) * Math.min(Math.abs(dx), .02);
        if (!hitsAt(F, a.x + s, a.y, r)) a.x += s;
      }
    }
    if (dy) {
      if (!hitsAt(F, a.x, a.y + dy, r)) {
        a.y += dy;
        moved = true;
      } else if (!dx && slide(F, a, r, 0, dy)) moved = true; else {
        const s = Math.sign(dy) * Math.min(Math.abs(dy), .02);
        if (!hitsAt(F, a.x, a.y + s, r)) a.y += s;
      }
    }
    return moved;
  };
  A.free = (F, x, y, r) => !hitsAt(F, x, y, r || R);
  A.anyOn = function(F, d) {
    const on = a => a && a.floor === F.idx && a.alive !== false && d.tiles.some(i => {
      const tx = i % F.W, ty = i / F.W | 0;
      return Math.abs(a.x - (tx + .5)) < .8 && Math.abs(a.y - (ty + .5)) < .8;
    });
    return on(A.player) || A.enemies.some(on) || A.allies.some(on) || !!(SX.coop && SX.coop.ghostsOn(F.idx).some(on));
  };
  A.dirOf = ang => {
    const c = Math.cos(ang), s = Math.sin(ang);
    return Math.abs(c) > Math.abs(s) * 1.1 ? c > 0 ? 1 : 3 : s > 0 ? 0 : 2;
  };
  A.FX = {
    spark: "#e6d3a2",
    blood: "#7f1b20",
    dust: "#7c6e60"
  };
  A.part = function(o) {
    if (A.parts.length < 900) A.parts.push(Object.assign({
      t: .5,
      life: .5,
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      g: 0,
      c: "#fff",
      s: 1
    }, o));
  };
  A.say = function(a, text, col) {
    A.texts.push({
      a,
      text,
      t: 1.4,
      col: col || "#fff6c0"
    });
  };
  A.efx = function(e, snd, opt, text, col) {
    if (text) A.say(e, text, col);
    if (snd) SX.audio.play(snd, Object.assign({
      x: e.x,
      y: e.y,
      f: e.floor
    }, opt));
    if (SX.coop && SX.coop.efx) SX.coop.efx(e, snd, opt, text, col);
  };
  A.float = function(floor, x, y, text, col) {
    A.texts.push({
      floor,
      x,
      y,
      text,
      t: .9,
      col: col || "#fff",
      rise: true
    });
  };
  const BLOOD_K = {
    blood: 1,
    drop: 1,
    bspray: 1,
    bwall: 1
  }, LB = () => !!(SX.opts && SX.opts.lessBlood);
  A.BLOOD_K = BLOOD_K;
  function wbSet(F, d, add) {
    const M = F.wallBlood || (F.wallBlood = new Map), a = M.get(d.ti);
    if (add) {
      if (a) {
        a.push(d);
        if (a.length > 3) a.shift();
      } else M.set(d.ti, [ d ]);
    } else if (a) {
      const i = a.indexOf(d);
      if (i >= 0) a.splice(i, 1);
      if (!a.length) M.delete(d.ti);
    }
  }
  A.decal = function(F, x, y, kind, big, ex) {
    if (BLOOD_K[kind] && LB()) return;
    const d = {
      x,
      y,
      kind,
      big: !!big,
      seed: Math.random() * 1e9 | 0
    };
    if (ex) Object.assign(d, ex);
    F.decals.push(d);
    if (F.decals.length > 900) {
      const o = F.decals.shift();
      if (o.kind === "bwall") wbSet(F, o, false);
    }
    if (kind === "bwall") wbSet(F, d, true); else if (SX.render) SX.render.paintDecal(F, d);
  };
  function blood(F, x, y, ang, n, tight) {
    for (let k = 0, N = Math.ceil((n || 8) * .7 * (LB() ? .4 : 1)); k < N; k++) {
      const a = ang + (Math.random() - .5) * (tight ? Math.random() < .75 ? .6 : 1.6 : 1.3), v = (tight ? 2 : 1.5) + Math.random() * 4;
      A.part({
        floor: F.idx,
        x,
        y,
        z: .6,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 1 + Math.random() * 2,
        g: 9,
        c: A.FX.blood,
        t: .5,
        life: .5,
        stick: !LB()
      });
    }
  }
  function sparks(F, x, y) {
    for (let k = 0; k < 3; k++) {
      const a = Math.random() * 6.28, v = 2 + Math.random() * 3;
      A.part({
        floor: F.idx,
        x,
        y,
        z: .5,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 1.5,
        g: 8,
        c: A.FX.spark,
        t: .25,
        life: .25
      });
    }
    A.part({
      floor: F.idx,
      x,
      y,
      z: .5,
      c: "rgba(180,180,172,0.3)",
      s: 3,
      t: .4,
      life: .4,
      smoke: true,
      vz: .6
    });
  }
  function smoke(F, x, y, n, big) {
    for (let k = 0; k < n; k++) A.part({
      floor: F.idx,
      x: x + (Math.random() - .5) * (big ? 2 : .4),
      y: y + (Math.random() - .5) * (big ? 2 : .4),
      z: .6,
      vx: (Math.random() - .5) * (big ? 2 : .6),
      vy: (Math.random() - .5) * (big ? 2 : .6),
      vz: .3 + Math.random() * .6,
      c: big ? "rgba(200,200,192,0.42)" : "rgba(180,180,172,0.26)",
      s: big ? 4 + Math.random() * 5 : 2 + Math.random() * 2,
      t: big ? 1.6 : .6,
      life: big ? 1.6 : .6,
      smoke: true
    });
  }
  A.smoke = smoke;
  A.bleed = function(F, e, ang, crit) {
    blood(F, e.x, e.y - .45, ang, crit ? 20 : 12, true);
    e.flinch = .18;
  };
  const KB_CLS = {
    shotgun: .4,
    sniper: .3,
    rifle: .2,
    lmg: .2,
    smg: .12,
    revolver: .12,
    pistol: .1
  };
  A.KB_CLS = KB_CLS;
  A.hitPow = function(fx, at) {
    if (fx.k === "m") return {
      kb: .4,
      pel: 1,
      m: 1
    };
    const d = fx.w ? I.def(fx.w) : null, c = d && KB_CLS[d.cls] != null ? d.cls : "rifle";
    const slug = c === "shotgun" && at === "hp" && SX.SLUG;
    return {
      kb: KB_CLS[c],
      pel: c === "shotgun" && !slug ? Math.max(1, d && d.pellets || 6) : 1,
      m: 0
    };
  };
  A.hitFx = function(F, e, ang, crit, fx, at) {
    if (!fx) return null;
    const now = performance.now() / 1e3, key = (fx.src != null ? fx.src : "") + ":" + fx.k + ":" + (fx.q || "c" + A.clock);
    const first = e._hk !== key || now - (e._hkT || 0) > .25;
    if (first) {
      e._hk = key;
      e._hkT = now;
    }
    const P = A.hitPow(fx, at);
    P.first = first;
    A.hitFxDraw(F, e, ang, crit, P.kb, first, P.m);
    return P;
  };
  A.hitFxDraw = function(F, e, ang, crit, kb, first, melee) {
    blood(F, e.x, e.y - .45, ang, first ? crit ? 20 : 12 : 3, true);
    if (first) {
      if (!LB()) spray(F, e, ang, kb, crit, melee);
      if (Math.random() < .35) A.decal(F, e.x + Math.cos(ang) * .6, e.y + Math.sin(ang) * .6, "blood");
    }
    e.flinch = .18;
    if (e.alive === false || !first) return;
    const now = performance.now() / 1e3;
    e.lnT0 = now;
    e.lnA = ang;
    e.lnL = 2 + kb * 8 + (crit ? 1 : 0);
    if (crit) {
      e.hsT = now + .04;
      e.hsX = e.x;
      e.hsY = e.y;
      e.hsF = e.frame | 0;
    }
  };
  function spray(F, e, ang, kb, crit, melee) {
    const L = (.7 + kb * 3.5) * (crit ? 1.25 : 1) * (melee ? .7 : 1), c = Math.cos(ang), s = Math.sin(ang), x0 = e.x, y0 = e.y, far = Math.max(L, 1.5);
    let lm = L, hit = 0, hx = 0, hy = 0, ptx = Math.floor(x0), pty = Math.floor(y0);
    for (let t = .1; t <= far + 1e-6; t += .1) {
      const x = x0 + c * t, y = y0 + s * t;
      if (F.blocked(x, y, true)) {
        lm = Math.min(L, t - .1);
        hit = t;
        hx = x;
        hy = y;
        break;
      }
      ptx = Math.floor(x);
      pty = Math.floor(y);
    }
    if (lm > .3) A.decal(F, x0, y0, "bspray", false, {
      a: ang,
      n: 2 + Math.round(kb * 10) + (crit ? 2 : 0),
      L: Math.round(L * TS),
      lm: Math.round(lm * TS),
      r: L + .5
    });
    if (!hit || hit > 1.5) return;
    const tx = Math.floor(hx), ty = Math.floor(hy);
    if (!F.in(tx, ty)) return;
    const tt = F.t[F.i(tx, ty)];
    if (tt !== T.WALL && tt !== T.WINDOW) return;
    const bt = F.in(tx, ty + 1) ? F.t[F.i(tx, ty + 1)] : T.VOID;
    if (bt === T.WALL || bt === T.WINDOW || bt === T.VOID || bt === T.DOOR) return;
    let u;
    if (pty === ty + 1 && ptx === tx) u = Math.min(.88, Math.max(.12, hx - tx)); else if (pty === ty) u = c > 0 ? .1 : .9; else return;
    A.decal(F, tx + .5, ty + 1, "bwall", crit || kb >= .3, {
      ti: F.i(tx, ty),
      u,
      v: 10 + Math.random() * 6
    });
  }
  function knock(e, ang, P) {
    const now = A.clock, big = e.boss || e.named || e.variant === "brute" || e.variant === "coach" || (e.scale || 1) > 1.1 ? .35 : 1;
    if (P.first) {
      e.kbH = (e.kbH || 0) * Math.exp(-Math.max(0, now - (e.kbHt != null ? e.kbHt : now)) / .6);
      e.kbHt = now;
      e._kbF = 1 / (1 + 3 * e.kbH);
    }
    const k = P.kb / P.pel;
    e.kbH = (e.kbH || 0) + k;
    e.kbD = Math.min(.6, (e.kbD || 0) + k * big * (e._kbF || 1));
    e.kbDir = ang;
  }
  A.knock = knock;
  function kbStep(F, e, dt) {
    const s = Math.min(e.kbD, Math.max(1.6, e.kbD * 14) * dt);
    e.kbD -= s;
    if (e.kbD < .005) e.kbD = 0;
    if (!A.move(F, e, Math.cos(e.kbDir) * s, Math.sin(e.kbDir) * s)) e.kbD = 0;
  }
  A.kbStep = kbStep;
  const lnK = t => t < .05 ? t / .05 : 1 - (t - .05) / .21;
  A.kbLean = function(a, now) {
    const t = now - a.lnT0;
    if (!(t >= 0 && t < .26)) {
      if (t >= .26) a.lnT0 = null;
      return 0;
    }
    return Math.round(Math.cos(a.lnA) * a.lnL * lnK(t));
  };
  A.kbOff = function(a, now) {
    let dx = 0, dy = 0;
    if (a.lnT0 != null) {
      const t = now - a.lnT0;
      if (t >= 0 && t < .26) {
        const k = lnK(t) * Math.min(2, 1 + a.lnL / 4);
        dx += Math.round(Math.cos(a.lnA) * k);
        dy += Math.round(Math.sin(a.lnA) * k);
      }
    }
    if (a.hsT) {
      if (a.hsT > now) {
        dx += Math.round((a.hsX - a.x) * TS);
        dy += Math.round((a.hsY - a.y) * TS);
      } else a.hsT = 0;
    }
    return [ dx, dy ];
  };
  A.clearBlood = function() {
    const lv = SX.raid && SX.raid.level, G = SX.game && SX.game.floorObj ? SX.game.floorObj() : null, all = new Set(lv && lv.floors ? lv.floors : []);
    all.add(G);
    for (const F of all) {
      if (!F || !F.decals) continue;
      let j = 0;
      for (const d of F.decals) if (!BLOOD_K[d.kind]) F.decals[j++] = d;
      if (j !== F.decals.length) {
        F.decals.length = j;
        if (F.chunks) F.chunks.clear();
      }
      F.wallBlood = null;
    }
  };
  A.bleedAt = function(F, x, y, ang) {
    blood(F, x, y - .45, ang == null ? Math.random() * 6.28 : ang, 6);
  };
  A.shootVis = function(F, from, x, y, ang, range, vel) {
    const v = vel || 75;
    A.bullets.push({
      floor: F.idx,
      x,
      y,
      ox: x,
      oy: y,
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v,
      dmg: 0,
      from,
      t: (range || 42) / v + .1,
      range: range || 42,
      falloff: 0,
      crit: 0,
      trail: [],
      vis: true
    });
  };
  A.gunVel = g => {
    const d = g && (I.def(g.name) || g);
    return d && d.vel || 75;
  };
  A.viewHalf = function() {
    const V = SX.view;
    return {
      hx: (V.vw || 960) / 2 / SX.TS,
      hy: (V.vh || 540) / 2 / SX.TS
    };
  };
  A.sniperKeep = function(tg) {
    const h = tg && tg.view || A.viewHalf();
    return [ Math.max(6, h.hx * .55), h.hx + .5 ];
  };
  A.inViewBox = function(tg, e, pad) {
    const h = tg && tg.view || A.viewHalf(), m = pad == null ? 1 : pad;
    return Math.abs(e.x - tg.x) <= h.hx + m && Math.abs(e.y - tg.y) <= h.hy + m;
  };
  A.gunLook = g => {
    const d = g && (I.def(g.name) || g);
    return (d && d.look || 1) * (g && g.fxLook || 1);
  };
  A.hitEnemy = function(F, e, dmg, ang, by, crit, at, tk) {
    if (typeof at === "boolean") {
      tk = at;
      at = null;
    }
    const hc = A.hitCtx;
    A.hitCtx = null;
    const fx = hc ? {
      k: hc.k,
      w: hc.w,
      q: hc.q
    } : null;
    if (SX.coop && SX.coop.remoteHit(e, dmg, ang, crit, by, at, tk, hc, fx)) return;
    A.damageEnemy(F, e, dmg, ang, by, crit, at, fx);
  };
  A.noise = function(F, x, y, radius, quiet, fuzz, known) {
    if (!known && SX.coop && SX.coop.noise) SX.coop.noise(F, x, y, radius, quiet, fuzz);
    const cat = radius >= 40 ? null : quiet ? "step" : radius >= 20 ? "gun" : "item", SP = SX.sndProp;
    for (const e of A.enemies) {
      if (!e.alive || e.floor !== F.idx) continue;
      const rr = e.type === "zombie" ? radius * A.Z_EAR : radius;
      if (Math.hypot(e.x - x, e.y - y) > rr) continue;
      if (cat && SP && SP.hears && !SP.hears(F, x, y, e.x, e.y, rr, cat)) continue;
      let lx = x, ly = y;
      if (fuzz) {
        const a = Math.random() * Math.PI * 2, r = fuzz * (.5 + Math.random() * .5), qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r;
        if (!F.blocked(qx, qy)) {
          lx = qx;
          ly = qy;
        }
      }
      if (quiet && radius <= 3 && e.ai === "wander" && !(e.lureT > 0)) e.reactT = .5;
      e.lureX = lx;
      e.lureY = ly;
      e.lureT = quiet ? Math.max(e.lureT, 2.5) : 6 + Math.random() * 3;
    }
  };
  A.newPlayer = function(kit, x, y, floor) {
    return A.player = {
      kind: "player",
      x,
      y,
      floor,
      r: R,
      hp: 100,
      st: 100,
      stT: 0,
      alive: true,
      kit,
      slot: kit.w1 ? "w1" : kit.w2 ? "w2" : "melee",
      aim: 0,
      dir: 0,
      frame: 0,
      walkT: 0,
      moving: false,
      torch: true,
      cool: 0,
      spread: .04,
      bloom: 0,
      reload: null,
      use: null,
      hot: 0,
      hotT: 0,
      hurtT: 0,
      stepT: 0,
      spec: SX.art.charSpec("player"),
      meleeT: 0,
      swing: 0,
      kick: 0,
      muzzleT: 0,
      aimHeld: false,
      crouch: false,
      boxOn: false
    };
  };
  A.weaponOf = p => p.kit[p.slot] || null;
  const CLS_SPREAD = {
    pistol: .035,
    revolver: .038,
    smg: .045,
    rifle: .028,
    lmg: .055,
    sniper: .012,
    shotgun: .06
  };
  const CLS_RELOAD = {
    pistol: 1.1,
    revolver: 2.3,
    smg: 1.5,
    rifle: 1.6,
    lmg: 3.4,
    sniper: 2.2,
    shotgun: 2.5
  };
  const CLS_SOUND = {
    pistol: "pistol",
    revolver: "revolver",
    smg: "smg",
    rifle: "rifle",
    lmg: "lmg",
    sniper: "sniper",
    shotgun: "shotgun"
  };
  const gunSpread = g => g.spread != null && !g.pellets ? g.spread : CLS_SPREAD[g.cls] != null ? CLS_SPREAD[g.cls] : .035;
  const gunReload = g => g.reload || CLS_RELOAD[g.cls] || 1.3;
  A.gunSpread = gunSpread;
  A.gunSound = (g, quiet) => {
    if (quiet) return "suppressed";
    if (g && g.homemade) return "homemade";
    return CLS_SOUND[typeof g === "string" ? g : g && g.cls] || "pistol";
  };
  const bodyOf = () => SX.game.save && SX.game.save.body || {
    st: 0,
    str: 0,
    run: 0
  };
  const lv = k => Math.max(0, Math.min(5, +bodyOf()[k] || 0));
  A.stMax = () => Math.round((100 + 12 * lv("st")) * 10) / 10;
  const inj = p => p.inj || (p.inj = {}), pfx = p => p.fx || (p.fx = {});
  A.inj = inj;
  A.pfx = pfx;
  A.hpMax = p => 100 + (p && p.fx && p.fx.bonusT > 0 ? p.fx.bonus || 0 : 0);
  A.injure = function(p, k) {
    if (k !== "bleedL" && k !== "bleedH") return false;
    const J = inj(p);
    if (J[k]) return false;
    if (k === "inf" && pfx(p).immuneT > 0) return false;
    if (k === "bleedL" && J.bleedH) return false;
    J[k] = k === "inf" ? .001 : 1;
    if (k === "bleedH") J.bleedL = 0;
    const d = (SX.INJURIES || {})[k];
    if (d) SX.log("🩸 " + d.name + " — " + d.fix, "bad");
    SX.audio.play(k === "frac" ? "bone" : k === "inf" ? "sick" : "bleed", {
      vol: k === "bleedH" ? 1 : .7
    });
    SX.ui && SX.ui.hudDirty();
    return true;
  };
  A.BLEED_MUL = {
    raider: 1 / 20,
    player: 1 / 5
  };
  const ZB_FROM = new Set([ "zombie", "dog", "brute", "hazmat" ]);
  A.rollInjury = function(p, dmg, cal, by, from) {
    if (!p || SX.game.state !== "raid" || SX.game.god || dmg < 3) return;
    if (!by && ZB_FROM.has(from)) by = {
      kind: "enemy",
      type: "zombie",
      variant: from === "zombie" ? null : from
    };
    const who = from || (by && by.kind === "enemy" && by.type !== "zombie" ? "raider" : null), bm = A.BLEED_MUL[who] || 1;
    const zb = by && by.type === "zombie", sc = Math.pow(Math.min(1, dmg / 15), 1.5), r = () => Math.random() / sc;
    if (cal === "blast") {
      if (r() < .5 * bm) A.injure(p, "bleedL");
      if (r() < .35) A.injure(p, "frac");
      return;
    }
    if (cal === "melee") {
      if (zb) {
        if (r() < .3) A.injure(p, "inf");
        if (r() < .25) A.injure(p, by.variant === "dog" ? "bleedH" : "bleedL");
        if (by.variant === "brute" && r() < .35) A.injure(p, "frac");
      } else if (r() < .15 * bm) A.injure(p, "bleedL");
      return;
    }
    const heavy = cal === "7.62mm" || cal === "12게이지" || dmg >= 25;
    if (r() < (heavy ? .22 : .1) * bm) A.injure(p, "bleedH"); else if (r() < .35 * bm) A.injure(p, "bleedL");
    if (dmg >= 20 && r() < .08) A.injure(p, "frac");
  };
  A.tickInjury = function(F, p, dt) {
    const J = inj(p), X = pfx(p);
    for (const k of [ "painT", "immuneT", "stamT", "bonusT" ]) if (X[k] > 0) X[k] = Math.max(0, X[k] - dt);
    if (X.bonus && !(X.bonusT > 0)) {
      X.bonus = 0;
      if (p.hp > 100) p.hp = 100;
      SX.log("아드레날린이 떨어졌습니다");
    }
    J.pain = 0;
    if (J.frac || J.inf) J.frac = J.inf = 0;
    if (SX.game.state !== "raid" || SX.game.god || !p.alive || p.down) return;
    let loss = J.bleedH ? 1 : J.bleedL ? .35 : 0;
    if (J.inf) {
      J.inf += dt;
      if (J.inf > 60) loss += .15;
    }
    if (!loss) return;
    p.hp -= loss * dt;
    if (SX.recap) {
      const b = J.bleedH ? 1 : J.bleedL ? .35 : 0;
      if (b) SX.recap.tick("bleed", b * dt);
      if (loss > b) SX.recap.tick("inf", (loss - b) * dt);
    }
    if ((J.bleedH || J.bleedL) && F) {
      p.dripT = (p.dripT || 0) - dt;
      if (p.dripT <= 0) {
        p.dripT = J.bleedH ? .6 : 1.6;
        A.decal(F, p.x + (Math.random() - .5) * .4, p.y + (Math.random() - .5) * .2, "blood");
      }
    }
    if (p.hp <= 0) A.playerZero(J.bleedH || J.bleedL ? "피를 너무 흘렸습니다" : "상처가 곪았습니다");
  };
  A.medUseful = function(p, it) {
    const J = inj(p);
    return p.hp < A.hpMax(p) - .5 && (it.heal || it.hot) || it.stop && (J.bleedL || J.bleedH) || it.stam || it.bonus;
  };
  A.weightCap = () => Math.round((30 + 6 * lv("str")) * 10) / 10;
  A.sprintDrain = () => 17 * (1 - .08 * lv("run"));
  A.meleeCrit = () => {
    const s = SX.game.save || {};
    return Math.min(.3, .15 + 5e-4 * ((s.fights || {}).wins | 0)) + .01 * Math.max(0, Math.min(5, +(s.body || {}).hit || 0));
  };
  A.updatePlayer = function(dt, F, ctl) {
    const p = A.player;
    if (!p || !p.alive) return;
    if (p.down) {
      p.mHit = null;
      if (SX.coop && SX.coop.downTick) SX.coop.downTick(dt, F, ctl);
      p.hurtT = Math.max(0, p.hurtT - dt);
      return;
    }
    const In = SX.input;
    let mx = 0, my = 0;
    if (ctl) {
      if (In.held("up")) my -= 1;
      if (In.held("down")) my += 1;
      if (In.held("left")) mx -= 1;
      if (In.held("right")) mx += 1;
    }
    if (ctl && In.padMove) {
      mx = In.padMove.x;
      my = In.padMove.y;
    }
    const ml = Math.hypot(mx, my);
    if (ml) {
      mx /= ml;
      my /= ml;
    }
    const aiming = ctl && In.held("aim") && !A.swimNo(p);
    const quiet = ctl && In.held("quiet");
    p.quietWalk = quiet;
    if (p.boxOn) p.crouch = false;
    const god = !!SX.game.god;
    const J = inj(p), X = pfx(p), broken = J.frac && !(X.painT > 0);
    if (In.tg.sprint) {
      if (aiming || p.crouch || p.boxOn) In.tg.sprint = false; else if (ml > 0) p.sprIdle = 0; else if ((p.sprIdle = (p.sprIdle || 0) + dt) > .3) In.tg.sprint = false;
    }
    let sprint = ctl && In.held("sprint") && ml > 0 && !aiming && !p.reload && !p.use && (p.st > 3 || god) && !p.crouch && !p.boxOn && !broken;
    const WL = SX.game.state === "raid" && SX.raid.flood ? SX.raid.wLvOf(p.floor) : 0;
    p.wl = WL;
    if (WL >= 3) {
      sprint = false;
      if (p.crouch) {
        p.crouch = false;
        SX.log("물이 허리까지 차 일어섰습니다");
        SX.ui.hudDirty();
      }
    }
    const kg = I.kitWeight(p.kit), cap = A.weightCap();
    const heavy = 1 - Math.min(.35, Math.max(0, kg - cap) / 60);
    let spd = (sprint ? 4.9 : quiet ? 1.6 : aiming ? 2.1 : 3) * heavy * (1 - A.armorSlow(p.kit));
    if (p.crouch) spd *= .45;
    if (p.boxOn) spd *= .55;
    if (p.use) spd = Math.min(spd, 1.6);
    if (broken) spd *= .68;
    if (WL) spd *= SX.raid.WMUL[WL];
    if (god) {
      spd *= 1.7;
      p.st = A.stMax();
    }
    const NE = SX.needs && SX.game.state === "raid" ? SX.needs : null;
    if (sprint && !god && !(SX.game.state === "hub" && SX.hub && SX.hub.scene === "home")) {
      p.st = Math.max(0, p.st - A.sprintDrain() * dt * (kg > cap ? 1.3 : 1) * (X.stamT > 0 ? .5 : 1) * (NE ? NE.sprintMul() : 1) * (WL === 2 ? 1.3 : 1));
      p.stT = .9;
    } else {
      p.stT -= dt;
      if (p.stT <= 0) p.st = Math.min(A.stMax(), p.st + 13 * (1 + .1 * lv("st")) * (J.inf > 60 ? .5 : 1) * (NE ? NE.stRegenMul() : 1) * dt);
    }
    p.sprinting = sprint;
    p.moving = ml > 0 && A.move(F, p, mx * spd * dt, my * spd * dt);
    if (SX.sndPlace && ml > 0 && SX.game.state === "raid") SX.sndPlace.bump(F, p, mx, my, p.moving);
    const wx = SX.view.mouseWorldX, wy = SX.view.mouseWorldY;
    p.aim = Math.atan2(wy - (p.y - .55), wx - p.x);
    p.aimX = wx;
    p.aimY = wy;
    p.dir = A.dirOf(p.aim);
    p.aimHeld = aiming;
    if (p.moving) {
      p.walkT += dt * spd * 3;
      p.frame = Math.floor(p.walkT) % 4;
      p.stepT -= dt * (sprint ? 1.6 : 1);
      if (p.stepT <= 0) {
        p.stepT = WL >= 4 ? .7 : quiet ? .6 : .36;
        const surf = SX.sndPlace ? SX.sndPlace.fsAt(F, p.x, p.y) : F.fs[F.i(Math.floor(p.x), Math.floor(p.y))];
        const FS = SX.art.FS;
        const hsf = SX.homeSurf && F.sf ? SX.homeSurf.stepAt(F, p.x, p.y) : null;
        if (WL >= 4) SX.audio.play("waterSlosh", {
          vol: quiet ? .25 : .5
        }); else SX.audio.play("step", {
          vol: quiet ? .2 : sprint ? .9 : .55,
          w: quiet ? .2 : sprint ? .9 : .5,
          surface: WL ? "water" : hsf || (SX.audio.surfOf ? SX.audio.surfOf(surf) : surf === FS.GRASS ? "grass" : surf === FS.WOOD ? "wood" : "conc")
        });
        A.noise(F, p.x, p.y, (sprint ? 12 : quiet ? 1.5 : 6) * (SX.skills ? SX.skills.mul("stealth") : 1) * (SX.wx ? SX.wx.stepMul(F, p.x, p.y) : 1) * (WL >= 2 ? 1.3 : 1), true, 0, true);
      }
      if (quiet && SX.skills) SX.skills.gain("stealth", dt);
    } else {
      p.frame = 0;
      p.walkT = 0;
    }
    const w = A.weaponOf(p);
    const base = w && w.kind === "gun" ? gunSpread(w) : .04;
    const gw = w && w.kind === "gun" ? w : null;
    const want = (SX.skills ? SX.skills.mul("shoot") : 1) * base * (aiming ? .45 * (gw && gw.fxAds || 1) : gw && gw.fxHip || 1) + (p.moving ? (sprint ? .13 : .05) * (gw && gw.fxMove || 1) : 0) + p.bloom + (J.pain ? .045 : 0) + (SX.tac ? SX.tac.aimPenalty() : 0);
    p.spread = SX.approach(p.spread, want, dt * .35 * (gw && gw.fxRate || 1));
    p.bloom = Math.max(0, p.bloom - dt * .18);
    p.cool -= dt;
    p.kick = Math.max(0, p.kick - dt * 8);
    p.muzzleT -= dt;
    p.swing = Math.max(0, p.swing - dt);
    if (p.mHit && (p.mHit.t -= dt) <= 0) {
      const h = p.mHit;
      p.mHit = null;
      if (!p.use) A.meleeHit(F, p, h.m, h.k, h.a);
    }
    if (p.takeT > 0) p.takeT = Math.max(0, p.takeT - dt);
    if (ctl) {
      const sw = s => {
        if (p.kit[s] && p.slot !== s) {
          p.slot = s;
          p.reload = null;
          p.cool = .25;
          SX.audio.play("weaponSwap");
        }
      };
      if (In.pressed("w1")) sw("w1");
      if (In.pressed("w2")) sw("w2");
      if (In.pressed("w3")) sw("melee");
      if (In.wheel && !(SX.home && SX.home.deco) && !(SX.ui && SX.ui.wheel)) {
        const order = [ "w1", "w2", "melee" ].filter(s => p.kit[s]);
        const k = Math.max(0, order.indexOf(p.slot));
        if (order.length) sw(order[Math.max(0, Math.min(order.length - 1, k + (In.wheel > 0 ? 1 : -1)))]);
      }
      if (In.pressed("light")) {
        p.torch = !p.torch;
        SX.audio.play("click");
      }
      if (In.pressed("reload")) A.startReload(p);
      if (SX.game.state === "hub" && SX.hub && SX.hub.fight && !(SX.ui && (SX.ui.wheel || SX.ui.wheelEat)) && (In.pressed("melee") || In.held("fire"))) A.meleeAttack(F, p); else if (A.canShootHere() && !(SX.ui && (SX.ui.wheel || SX.ui.wheelEat)) && In.pressed("melee")) A.meleeAttack(F, p);
      if (SX.game.state === "hub" && !(SX.home && SX.home.deco) && SX.ui && SX.ui.hubQuick) {
        if (A.canShootHere() && SX.tac && In.pressed("grenade")) SX.tac.cycle(p);
        for (let k = 0; k < I.QUICK_N; k++) if (In.pressed("q" + (k + 4))) SX.ui.hubQuick(k);
        if (SX.ui.wheelTick) SX.ui.wheelTick(F, p, In);
      }
      if (SX.game.state === "raid") {
        if (In.pressed("melee")) A.meleeAttack(F, p);
        if (In.pressed("grenade") && !A.swimNo(p, true)) {
          if (SX.tac && SX.tac.cycle) SX.tac.cycle(p); else A.throwGrenade(F, p);
        }
        if (In.pressed("heal")) A.quickHeal(F, p);
        for (let k = 0; k < I.QUICK_N; k++) if (In.pressed("q" + (k + 4))) A.useQuick(F, p, k);
        if (SX.ui && SX.ui.wheelTick) SX.ui.wheelTick(F, p, In);
      }
    }
    if (!p.kit[p.slot]) p.slot = p.kit.w1 ? "w1" : p.kit.w2 ? "w2" : "melee";
    if (p.reload) {
      p.reload.t -= dt;
      {
        const rl = p.reload, sq = rl.seq, pr = 1 - Math.max(0, rl.t) / (rl.dur || 1);
        while (sq && rl.k < sq.length && sq[rl.k].at <= pr) SX.audio.part(sq[rl.k++], {
          vol: .6
        });
      }
      if (p.reload.t <= 0) {
        const g = A.weaponOf(p), plan = p.reload.plan;
        if (g && g.kind === "gun" && plan && g === p.reload.gun && I.doReload(p.kit, g, plan) > 0 && !(p.reload.seq && p.reload.seq.length)) SX.audio.play("reload", {
          vol: .5
        });
        if (plan && plan.left) {
          for (const m of plan.left) if (SX.ui && SX.ui.dropOut) SX.ui.dropOut(m);
          plan.left = null;
        }
        p.reload = null;
        SX.ui && SX.ui.hudDirty();
      }
    }
    if (p.use) {
      p.use.t -= dt;
      if (p.use.t <= 0) {
        const it = p.use.it;
        p.use = null;
        A.finishUse(F, p, it);
      }
    }
    if (p.hotT > 0) {
      p.hotT -= dt;
      p.hp = Math.min(A.hpMax(p), p.hp + p.hot * dt);
    }
    A.tickInjury(F, p, dt);
    if (!p.alive) return;
    if (p.autoRl) {
      if (!ctl || p.autoRl !== w || p.reload || (w.ammo || 0) > 0) p.autoRl = null; else if (p.cool <= 0 && !p.use) {
        p.autoRl = null;
        A.startReload(p, true);
      }
    }
    if (SX.ui && SX.ui.wheelEat && !In.held("fire") && !In.held("aim")) SX.ui.wheelEat = false;
    if (ctl && w && (SX.game.state === "raid" || A.canShootHere()) && !(SX.ui && (SX.ui.wheel || SX.ui.wheelEat)) && !(SX.tac && SX.tac.hold) && !A.swimNo(p, In.pressed("fire"))) {
      if (In.pressed("fire") && p.cool > 0) p.fireBuf = .12;
      if (w.kind === "gun") {
        const want = w.auto ? In.held("fire") : In.pressed("fire") || p.fireBuf > 0;
        if (want && p.cool <= 0 && !p.reload && !p.use) {
          p.fireBuf = 0;
          if ((w.ammo || 0) <= 0) {
            if (In.pressed("fire")) {
              SX.audio.play("empty");
              A.startReload(p);
            }
            p.cool = .25;
          } else {
            A.fireGun(F, p, w);
            if ((w.ammo || 0) <= 0) p.autoRl = w;
          }
        }
      } else if (w.kind === "melee" && (In.held("fire") || p.fireBuf > 0) && p.cool <= 0) {
        p.fireBuf = 0;
        A.meleeAttack(F, p);
      }
    }
    if (p.fireBuf > 0) p.fireBuf -= dt;
    p.hurtT = Math.max(0, p.hurtT - dt);
  };
  A.canShootHere = () => SX.game.state === "hub" && SX.hub && SX.hub.scene === "range";
  A.startReload = function(p, auto) {
    const g = A.weaponOf(p);
    if (!g || g.kind !== "gun" || p.reload || (g.ammo || 0) >= g.magSize) return;
    const s = A.canShootHere() ? {
      srcs: [],
      mult: 1,
      inf: true
    } : I.reloadPlan(p.kit, g, p.slot);
    if (!s) {
      if (!auto) {
        SX.log(g.caliber + " 탄약이 없습니다");
        SX.audio.play("denied");
      }
      return;
    }
    const rt = gunReload(g) * s.mult;
    p.reload = {
      t: rt,
      dur: rt,
      plan: s,
      gun: g,
      seq: SX.audio.reloadSeq ? SX.audio.reloadSeq(g, !((g.ammo || 0) > 0), rt) : [],
      k: 0
    };
    if (s.swap) SX.log("탄 종류 바꿈: " + I.typeName(g.caliber, I.typeOf(g)) + " → " + I.typeName(g.caliber, s.at) + " · 들어 있던 탄은 탄창으로 뺍니다");
    if (s.mult === 2) SX.log("가방에서 꺼냅니다 — 두 배 걸립니다"); else if (s.mult === 3) SX.log("다른 총에서 옮겨 담습니다 — 세 배 걸립니다");
  };
  A.toggleCrouch = function(quiet) {
    const p = A.player;
    if (!p || !p.alive || p.down) return;
    if (p.boxOn) {
      if (!quiet) SX.log("상자를 쓴 채로는 못 앉습니다");
      return;
    }
    if (!p.crouch && SX.game.state === "raid" && SX.raid.flood && SX.raid.wLvOf(p.floor) >= 3) {
      if (!quiet) SX.log("물이 허리까지 차 앉을 수 없습니다");
      return;
    }
    p.crouch = !p.crouch;
    if (!quiet) SX.log(p.crouch ? "몸을 낮췄습니다 — 느리지만 늦게 들킵니다" : "일어섰습니다");
    SX.ui && SX.ui.hudDirty();
  };
  let crHeld = false, crByHold = false;
  A.crouchKey = function() {
    const In = SX.input, p = A.player;
    if (!p) return;
    const kb = In.kbHeld("crouch");
    if (In.hit.has("pad:crouch")) {
      A.toggleCrouch();
      crByHold = false;
    }
    if (SX.holdMode("crouch") !== "hold") {
      if (In.kbHit("crouch")) A.toggleCrouch();
      crHeld = kb;
      crByHold = false;
      return;
    }
    if (kb && !crHeld && !p.crouch) {
      A.toggleCrouch(true);
      crByHold = !!p.crouch;
    } else if (!kb && crHeld && p.crouch && crByHold) {
      A.toggleCrouch(true);
      crByHold = false;
    }
    crHeld = kb;
  };
  A.toggleBox = function() {
    const p = A.player;
    if (!p || !p.alive || p.down) return;
    if (p.boxOn) {
      p.boxOn = false;
      SX.log("상자를 벗었습니다");
      SX.ui && SX.ui.hudDirty();
      return;
    }
    const found = I.findInKit(p.kit, "종이상자");
    if (!found) {
      SX.log("종이상자가 없습니다");
      SX.audio.play("denied");
      return;
    }
    p.boxOn = true;
    p.crouch = false;
    SX.audio.play("box");
    SX.log("상자를 뒤집어썼습니다 — 멈춰 있으면 거의 안 보입니다");
    SX.audio.play("pickup");
    SX.ui && SX.ui.hudDirty();
  };
  A.BRICK_T = .716;
  A.brickInit = function(p, wx, wy) {
    const ox = p.x, oy = p.y - .4, d = Math.max(2, Math.min(10, Math.hypot(wx - ox, wy - oy))), a = Math.atan2(wy - oy, wx - ox);
    return {
      floor: p.floor,
      x: ox,
      y: oy,
      z: .9,
      vx: Math.cos(a) * d / A.BRICK_T,
      vy: Math.sin(a) * d / A.BRICK_T,
      vz: 3.4,
      t: 0,
      spin: Math.random() * 6 - 3,
      ang: 0
    };
  };
  A.brickStep = function(F, b, dt) {
    b.t += dt;
    b.ang += b.spin * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vz -= 13 * dt;
    b.z += b.vz * dt;
    if (F.blocked(b.x, b.y, true)) {
      b.vx *= -.3;
      b.vy *= -.3;
    }
    if (b.z <= 0) {
      b.z = 0;
      return true;
    }
    return false;
  };
  A.swimNo = function(p, say) {
    const no = !!(p && p === A.player && SX.game.state === "raid" && SX.raid.flood && SX.raid.wLvOf(p.floor) >= 4);
    if (no && say) {
      const now = performance.now();
      if (!(A._swimSayT > now)) {
        A._swimSayT = now + 2500;
        SX.log("헤엄치는 동안엔 무기를 못 씁니다 — 두 손으로 헤엄칩니다", "warn");
      }
    }
    return no;
  };
  A.throwBrick = function(F, quick) {
    const p = A.player;
    if (!p || !p.alive || p.down) return;
    if (A.swimNo(p, true)) return;
    if (p.throwJob) return;
    const free = A.canShootHere();
    const found = I.findInKit(p.kit, "벽돌");
    if (!found && !free) {
      SX.log("벽돌이 없습니다");
      SX.audio.play("denied");
      return;
    }
    const release = () => {
      if (!p.alive || !(free || I.at(found.grid, found.it))) return;
      const F2 = SX.game.floorObj() || F;
      if (!free) I.take(found.grid, found.it);
      A.thrown.push(A.brickInit(p, SX.view.mouseWorldX, SX.view.mouseWorldY));
      if (SX.coop && SX.coop.brick) SX.coop.brick(A.thrown[A.thrown.length - 1]);
      SX.audio.play("swing", {
        vol: .5
      });
      A.noise(F2, p.x, p.y, 4);
      SX.ui && SX.ui.hudDirty();
    };
    if (SX.tac && SX.tac.startThrow) SX.tac.startThrow(p, release, quick); else release();
  };
  A.thrown = [];
  A.updateThrown = function(F0, dt) {
    const lv = SX.game.state === "raid" && SX.raid ? SX.raid.level : null, pf = A.player ? A.player.floor : -1;
    for (let i = A.thrown.length - 1; i >= 0; i--) {
      const b = A.thrown[i], F = lv && lv.floors[b.floor] || F0;
      if (A.brickStep(F, b, dt)) {
        if (!b.remote) A.noise(F, b.x, b.y, 22);
        if (!lv || b.floor === pf) SX.audio.play("brick", {
          x: b.x,
          y: b.y,
          range: 30,
          vol: .9
        });
        for (let k = 0; k < 3; k++) A.part({
          floor: F.idx,
          x: b.x,
          y: b.y,
          z: .1,
          vx: (Math.random() - .5) * 2,
          vy: (Math.random() - .5) * 2,
          vz: 1.2,
          g: 10,
          c: A.FX.dust,
          t: .4,
          life: .4
        });
        A.thrown.splice(i, 1);
        continue;
      }
      if (b.t > 3) A.thrown.splice(i, 1);
    }
  };
  A.shoot = function(F, from, x, y, ang, dmg, dmgHead, opt) {
    const range = opt.range || 42, v = opt.vel || 75;
    A.bullets.push({
      floor: F.idx,
      x,
      y,
      ox: x,
      oy: y,
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v,
      dmg,
      dmgHead,
      from,
      ux: Math.cos(ang),
      uy: Math.sin(ang),
      aimD: opt.aimD != null ? opt.aimD : null,
      km: 1,
      np: 0,
      ct: A.clock,
      t: range / v + .1,
      range,
      falloff: opt.falloff || 0,
      crit: opt.crit || 0,
      cal: opt.cal || null,
      shot: opt.shot || 0,
      at: opt.at || null,
      trail: [],
      wn: opt.wn || null
    });
  };
  A.ARMOR_PEN = {
    "9mm": .4,
    "12게이지": .55,
    "5.56mm": .8,
    "7.62mm": 1
  };
  const AT = at => at && SX.AMMO_TYPES && SX.AMMO_TYPES[at] || null;
  A.vestFactor = function(cal, at) {
    const f = A.ARMOR_PEN[cal] != null ? A.ARMOR_PEN[cal] : 1, T = AT(at);
    return !T ? f : T.armorAdd ? Math.min(1, f + T.armorAdd) : f * (T.armorMul || 1);
  };
  A.fleshMul = at => {
    const T = AT(at);
    return T ? T.dmg : 1;
  };
  A.helmFactor = at => {
    const T = AT(at);
    return T ? T.helm : .45;
  };
  A.penOf = (cal, at) => {
    const p = A.PEN[cal] != null ? A.PEN[cal] : 2, T = AT(at);
    return T && cal !== "melee" && cal !== "blast" ? Math.max(1, Math.min(6, p + T.pen)) : p;
  };
  const HB = A.HB = {
    zomb: {
      hw: .395,
      hh: .705,
      cy: -.528,
      hy: -.715
    },
    crawl: {
      hw: .55,
      hh: .292,
      cy: -.203,
      hy: -.32
    },
    dog: {
      hw: .533,
      hh: .327,
      cy: -.266,
      hy: -.396
    },
    scav: {
      hw: .413,
      hh: .722,
      cy: -.562,
      hy: -.763
    },
    me: {
      hw: .22,
      hh: .46,
      cy: -.56,
      hy: -.7624
    }
  };
  const PVP = A.PVP_HB = [ [ [ 1, 0, -1, .25 ], [ 0, 0, -.578, .375, .266 ], [ 0, 0, -.109, .219, .203 ] ], [ [ 1, .047, -1, .281 ], [ 0, -.078, -.578, .297, .203 ], [ 0, .016, -.156, .172, .219 ] ], [ [ 1, 0, -.969, .25 ], [ 0, 0, -.5, .375, .219 ], [ 0, .016, -.094, .203, .188 ] ] ];
  A.hbKind = e => e.variant === "dog" ? "dog" : e.crawler ? "crawl" : e.type === "zombie" ? "zomb" : "scav";
  A.hitShapes = function(k, x, y, sc) {
    const q = HB[k] || HB.scav;
    sc = sc || 1;
    const top = y + (q.cy - q.hh) * sc, bot = y + (q.cy + q.hh) * sc, hy = y + q.hy * sc, hw = q.hw * sc;
    return [ {
      t: 0,
      x,
      y: (top + hy) / 2,
      hw,
      hh: (hy - top) / 2,
      h: true
    }, {
      t: 0,
      x,
      y: (hy + bot) / 2,
      hw,
      hh: (bot - hy) / 2,
      h: false
    } ];
  };
  A.enemyShapes = e => A.hitShapes(A.hbKind(e), e.x, e.y, e.scale || 1);
  A.pvpShapes = function(x, y, dir, crouch) {
    const S = PVP[dir === 3 ? 1 : dir | 0] || PVP[0], fx = dir === 3 ? -1 : 1, dy = crouch ? .125 : 0;
    return S.map(s => s[0] ? {
      t: 1,
      x: x + s[1] * fx,
      y: y + s[2] + dy,
      r: s[3],
      h: true
    } : {
      t: 0,
      x: x + s[1] * fx,
      y: y + s[2] + dy,
      hw: s[3],
      hh: s[4],
      h: false
    });
  };
  const chordBox = (ox, oy, ux, uy, s) => {
    let lo = -1e9, hi = 1e9;
    if (Math.abs(ux) < 1e-9) {
      if (Math.abs(ox - s.x) > s.hw) return null;
    } else {
      let a = (s.x - s.hw - ox) / ux, c = (s.x + s.hw - ox) / ux;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > lo) lo = a;
      if (c < hi) hi = c;
    }
    if (Math.abs(uy) < 1e-9) {
      if (Math.abs(oy - s.y) > s.hh) return null;
    } else {
      let a = (s.y - s.hh - oy) / uy, c = (s.y + s.hh - oy) / uy;
      if (a > c) {
        const t = a;
        a = c;
        c = t;
      }
      if (a > lo) lo = a;
      if (c < hi) hi = c;
    }
    return lo <= hi ? [ lo, hi ] : null;
  };
  const chordCirc = (ox, oy, ux, uy, s) => {
    const dx = ox - s.x, dy = oy - s.y, bq = dx * ux + dy * uy, d = bq * bq - (dx * dx + dy * dy - s.r * s.r);
    if (d < 0) return null;
    const q = Math.sqrt(d);
    return [ -bq - q, -bq + q ];
  };
  A.rayHit = function(ox, oy, ux, uy, shapes, s0, s1, aimD) {
    let hit = false, en = 1e9, lo = 1e9, hi = -1e9;
    const cs = [];
    for (const sh of shapes) {
      const c = sh.t ? chordCirc(ox, oy, ux, uy, sh) : chordBox(ox, oy, ux, uy, sh);
      if (!c || c[1] < 0) continue;
      cs.push([ c[0], c[1], sh.h ]);
      if (c[0] < lo) lo = c[0];
      if (c[1] > hi) hi = c[1];
      if (c[1] >= s0 && c[0] <= s1) {
        hit = true;
        const e = Math.max(c[0], s0);
        if (e < en) en = e;
      }
    }
    if (!hit) return null;
    let st = null, head = null, best = 1e9;
    if (aimD != null) for (const c of cs) if (aimD >= c[0] && aimD <= c[1]) {
      st = aimD;
      break;
    }
    if (st == null) st = (Math.max(lo, 0) + hi) / 2;
    for (const c of cs) if (st >= c[0] && st <= c[1]) {
      if (c[2]) {
        head = true;
        break;
      }
      head = false;
    }
    if (head == null) for (const c of cs) {
      const d = Math.abs((c[0] + c[1]) / 2 - st);
      if (d < best) {
        best = d;
        head = c[2];
      }
    }
    return {
      s: en,
      head: !!head
    };
  };
  const cellsOn = (x0, y0, x1, y1, s0, first, out) => {
    let cx = Math.floor(x0), cy = Math.floor(y0);
    const ex = Math.floor(x1), ey = Math.floor(y1);
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (first) out.push(s0, cx, cy);
    const stx = dx > 0 ? 1 : -1, sty = dy > 0 ? 1 : -1, tdx = dx !== 0 ? Math.abs(1 / dx) : 1e9, tdy = dy !== 0 ? Math.abs(1 / dy) : 1e9;
    let tmx = dx !== 0 ? (dx > 0 ? cx + 1 - x0 : x0 - cx) * tdx : 1e9, tmy = dy !== 0 ? (dy > 0 ? cy + 1 - y0 : y0 - cy) * tdy : 1e9, n = 0;
    while ((cx !== ex || cy !== ey) && n++ < 600) {
      let t;
      if (tmx < tmy) {
        t = tmx;
        tmx += tdx;
        cx += stx;
      } else {
        t = tmy;
        tmy += tdy;
        cy += sty;
      }
      if (t > 1) break;
      out.push(s0 + t * L, cx, cy);
    }
  };
  A.cellsOn = cellsOn;
  A.bulletMat = function(F, x, y) {
    if (!F.in(x, y)) return 3;
    const i = y * F.W + x, t = F.t[i];
    if (t === T.WALL) {
      const W = SX.texPlace && SX.texPlace.W, st = F.wst ? F.wst[i] : 0;
      return W && st && (st === W.WOODP || st === W.STUD) ? 2 : 3;
    }
    if (t === T.WINDOW) return 1;
    if (t === T.DOOR) {
      const d = F.doorAt.get(i);
      return d && d.open ? 0 : 2;
    }
    if (t === T.VOID) return 3;
    return 0;
  };
  A.bulletClear = function(F, x0, y0, x1, y1) {
    const out = [];
    cellsOn(x0, y0, x1, y1, 0, true, out);
    for (let k = 0; k < out.length; k += 3) if (A.bulletMat(F, out[k + 1], out[k + 2]) >= 2) return false;
    return true;
  };
  A.enemyAmmo = function(e) {
    if (!e || e.atype !== undefined) return e ? e.atype : "";
    const gd = I.def(e.gun) || {}, q = (SX.ENEMY_AMMO || [])[Math.max(1, Math.min(4, e.tier | 0)) - 1] || [ 0, 0 ];
    const r = new SX.Rng((SX.hash((e.gun || "") + "|" + Math.round((e.sx || 0) * 10) + "|" + Math.round((e.sy || 0) * 10) + "|" + e.floor) ^ 1540483477) >>> 0).f();
    let at = "";
    if (e.boss || e.named) at = "ap"; else if (e.variant === "sniper") at = r < .5 ? "ap" : ""; else if (r < q[1]) at = "ap"; else if (r < q[0] + q[1] && gd.caliber !== "12게이지") at = "hp";
    return e.atype = at;
  };
  A.fireGun = function(F, p, g) {
    if (g.wear == null) g.wear = 100;
    if (g.wear < I.WEAR_JAM && Math.random() < (I.WEAR_JAM - g.wear) / 220) {
      g.wear = Math.max(0, g.wear - .05);
      p.cool = .5;
      SX.audio.play("empty");
      SX.log("⚠ 총이 걸렸습니다 — 무기상에서 정비해 주십시오", "bad");
      SX.ui && SX.ui.hudDirty();
      return;
    }
    g.wear = Math.max(0, g.wear - I.WEAR_PER_SHOT);
    if (p.boxOn) {
      p.boxOn = false;
      SX.log("상자를 벗고 쐈습니다");
    }
    p.cool = g.rof;
    g.ammo--;
    const mx = p.x + Math.cos(p.aim) * .7, my = p.y - .55 + Math.sin(p.aim) * .7;
    const mzOk = A.bulletClear(F, p.x, p.y - .1, mx, my + .45), bx = mzOk ? mx : p.x, by = mzOk ? my : p.y - .55;
    const aimD = p.aimX != null ? Math.hypot(p.aimX - bx, p.aimY - by) : null;
    const at = I.typeOf(g), slug = at === "hp" && g.pellets && SX.SLUG;
    const n = slug ? 1 : g.pellets || 1;
    const angs = [], shot = A.shotSeq = (A.shotSeq || 0) + 1;
    for (let k = 0; k < n; k++) {
      const worn = (100 - (g.wear == null ? 100 : g.wear)) / 100;
      const a = p.aim + (Math.random() - .5) * 2 * ((p.spread + (n > 1 ? g.spread || .05 : 0)) * (1 + worn * .8));
      const far = A.canShootHere() ? 120 : slug ? slug.range : n > 1 ? 26 : 44;
      if (slug) A.shoot(F, p, bx, by, a, g.dmg * g.pellets * slug.k, (g.dmgHead || g.dmg) * g.pellets * slug.k, {
        falloff: slug.falloff,
        aimD,
        range: far,
        cal: g.caliber,
        vel: A.gunVel(g),
        shot,
        at,
        wn: g.name
      }); else A.shoot(F, p, bx, by, a, g.dmg, g.dmgHead, {
        falloff: g.falloff,
        aimD,
        range: far,
        cal: g.caliber,
        vel: A.gunVel(g),
        shot,
        at,
        wn: g.name
      });
      angs.push(a);
    }
    if (SX.coop && SX.coop.inCoop()) SX.coop.shot(F, bx, by, angs, g, slug ? slug.range : n > 1 ? 26 : 44);
    if (SX.aim) SX.aim.shot(F, p, g);
    p.bloom = Math.min(.12, p.bloom + (g.bloom != null ? g.bloom : .026) * (SX.skills ? SX.skills.mul("shoot") : 1));
    const fl = g.fxFlash != null ? g.fxFlash : 1;
    p.kick = 1;
    p.muzzleT = g.quiet || fl < .5 ? .03 : .05;
    const inside = !!F.inside[F.i(Math.floor(p.x), Math.floor(p.y))];
    SX.audio.play(A.gunSound(g, g.quiet), {
      vol: g.quiet ? .6 : .9,
      verb: inside
    });
    SX.audio.play("casing", {
      delay: .3 + Math.random() * .15,
      vol: .45,
      shell: g.cls === "shotgun",
      surface: SX.sndPlace ? SX.sndPlace.casingOf(SX.audio.surfOf(SX.sndPlace.fsAt(F, p.x, p.y))) : SX.audio.surfOf ? SX.audio.surfOf(F.fs[F.i(Math.floor(p.x), Math.floor(p.y))]) : "conc"
    });
    SX.light.flash(F.idx, mx, my, g.quiet ? 2 : Math.max(1.2, 5 * fl), [ 255, 210, 130 ], .07);
    SX.view.shake((g.kick != null ? g.kick : 1.3) * (p.aimHeld ? .8 : 1) * (SX.skills ? SX.skills.mul("shoot") : 1));
    const ca = p.aim + Math.PI / 2 + (Math.random() - .5);
    A.part({
      floor: F.idx,
      x: p.x,
      y: p.y - .1,
      z: .8,
      vx: Math.cos(ca) * 2.5,
      vy: Math.sin(ca) * 2.5,
      vz: 2,
      g: 10,
      c: g.cls === "shotgun" ? "#c43b30" : "#d8b24a",
      t: .45,
      life: .45,
      stick: "casing"
    });
    smoke(F, mx, my, 1);
    p.shotAt = A.clock;
    A.noise(F, p.x, p.y, (g.quiet ? 7 : 30) * (g.fxNoise || 1) * (SX.wx ? SX.wx.shotMul(F, p.x, p.y) : 1), false, g.fxFuzz || 0, true);
    SX.ui && SX.ui.hudDirty();
    if (g.ammo <= 0) SX.audio.play("empty", {
      delay: .05
    });
  };
  const FIST = {
    name: "맨주먹",
    kind: "melee",
    dmg: 45,
    cool: .5,
    reach: 1.7
  };
  A.FIST = FIST;
  A.FIST = FIST;
  A.meleeAttack = function(F, p) {
    if (A.swimNo(p, true)) return;
    const m = SX.hub && SX.hub.fight ? FIST : p.kit.melee || FIST;
    if (!m || p.cool > 0 || p.use) return;
    if (SX.hub && SX.hub.fight) {
      if (p.st < 14) {
        p.cool = .4;
        A.float(F.idx, p.x, p.y - 1.6, "숨이 찹니다", "#e0a050");
        return;
      }
      p.st -= 14;
      p.stT = 1.1;
    }
    if (!(SX.hub && SX.hub.fight)) {
      const tk = A.stealthTarget(F, p);
      if (tk) {
        A.takedown(F, p, tk, m);
        return;
      }
    }
    const MK = m !== FIST && SX.melee ? SX.melee.start(p, m, p.aim, "me") : null;
    p.cool = m.cool || .6;
    p.slotBefore = p.slot;
    if (MK) {
      p.mHit = {
        t: MK.hitT,
        m,
        k: MK,
        a: p.aim
      };
      SX.audio.play(MK.snd, {
        vol: .75
      });
      A.noise(F, p.x, p.y, 4, true);
      return;
    }
    p.swing = .22;
    p.swingT = 0;
    p.swingW = null;
    p.punchN = (p.punchN | 0) + 1;
    p.mHit = null;
    SX.audio.play("melee", {
      vol: .7
    });
    A.meleeHit(F, p, m, null);
    A.noise(F, p.x, p.y, 4, true);
  };
  const meleeSlices = (aim, arc, a0) => {
    const out = [];
    for (let i = 0; i < 8; i++) out.push(aim - arc + 2 * arc * i / 7);
    if (a0 != null) for (let i = 0; i < 8; i++) out.push(a0 - arc + 2 * arc * i / 7);
    return out;
  };
  const sliceHit = (x0, y0, angs, reach, px, py, r) => {
    for (const a of angs) {
      const ux = Math.cos(a), uy = Math.sin(a);
      let t = (px - x0) * ux + (py - y0) * uy;
      t = t < 0 ? 0 : t > reach ? reach : t;
      if (Math.hypot(px - x0 - ux * t, py - y0 - uy * t) <= r) return true;
    }
    return false;
  };
  const bladeHit = (x0, y0, angs, reach, shapes) => angs.some(a => !!A.rayHit(x0, y0, Math.cos(a), Math.sin(a), shapes, 0, reach, null));
  A.meleeSlices = meleeSlices;
  A.sliceHit = sliceHit;
  A.bladeHit = bladeHit;
  A.meleeHit = function(F, p, m, k, a0) {
    const reach = Math.max(1.3, (m.reach || 2) * .62) + (k ? k.reach || 0 : 0), arc = k ? k.arc : .95;
    const angs = meleeSlices(p.aim, arc, a0), q = A.swingSeq = (A.swingSeq || 0) + 1;
    const off = t => Math.abs(SX.angDiff(p.aim, t)) > arc && !(a0 != null && Math.abs(SX.angDiff(a0, t)) <= arc);
    let hit = false;
    for (const e of A.enemies) {
      if (!e.alive || e.floor !== F.idx) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (!sliceHit(p.x, p.y, angs, reach, e.x, e.y, .34 * (e.scale || 1))) continue;
      if (!SX.light.los(F, p.x, p.y - .4, e.x, e.y - .4)) continue;
      A.hitCtx = {
        k: "m",
        r: reach,
        q,
        t: A.clock,
        w: m.name
      };
      const mc = Math.random() < A.meleeCrit();
      A.hitEnemy(F, e, m.dmg * (.85 + Math.random() * .3) * (e.hasArmor ? .7 : 1), Math.atan2(dy, dx), p, mc);
      if (SX.ui && !e.spar) SX.ui.hitMarker(mc);
      hit = true;
    }
    if (SX.coop) for (const g of SX.coop.foesOn(F.idx)) {
      const dx = g.x - p.x, dy = g.y - p.y, d = Math.hypot(dx, dy);
      if (!bladeHit(p.x, p.y - .55, angs, reach, A.pvpShapes(g.x, g.y, g.dir, g.crouch))) continue;
      if (!SX.light.los(F, p.x, p.y - .4, g.x, g.y - .4)) continue;
      SX.coop.hurtPeer(g.pid, m.dmg * (.85 + Math.random() * .3), (SX.net && SX.net.name && SX.net.name() || "누군가") + " 에게 맞았습니다", false, Math.atan2(dy, dx), true, "melee", null, null, {
        w: m.name,
        r: d
      });
      SX.ui && SX.ui.hitMarker(false);
      hit = true;
    }
    if (hit) SX.audio.play("hitFlesh", {
      vol: .8
    });
    let tHit = false;
    if (F.targets) for (const pr of F.targets) {
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2, dx = cx - p.x, dy = cy - p.y;
      if (Math.hypot(dx, dy) > reach + .3 || off(Math.atan2(dy, dx))) continue;
      if (!SX.light.los(F, p.x, p.y - .4, cx, cy - .4)) continue;
      const crit = Math.random() < A.meleeCrit();
      A.hitTarget(F, pr, cx, cy - .45, m.dmg * (.85 + Math.random() * .3) * (crit ? 2.2 : 1), crit, null, "melee", null, true);
      tHit = true;
    }
    return hit || tHit;
  };
  A.TAKE_T = .55;
  A.BACK_ARC = 2;
  A.HEAVY_TK = 120;
  A.isHeavy = e => !!(e.boss || e.named || e.variant === "brute");
  A.behind = (e, x, y) => Math.abs(SX.angDiff(e.face || 0, Math.atan2(y - e.y, x - e.x))) > A.BACK_ARC;
  A.stealthOk = (e, x, y) => !!e.alive && !e.spar && !e.dormant && (e.ai !== "chase" || A.clock - (e.chaseAt == null ? -99 : e.chaseAt) < .6) && A.behind(e, x, y);
  const TK_SL = aim => meleeSlices(aim, .95, null);
  A.stealthTarget = function(F, p) {
    if (!p || !p.alive || !F || SX.game.state !== "raid" || p.use || p.takeT > 0 || p.trapT > 0) return null;
    const m = p.kit.melee || FIST, reach = Math.max(1.3, (m.reach || 2) * .62);
    let best = null, bd = 1e9;
    for (const e of A.enemies) {
      if (!e.alive || e.floor !== F.idx || e.spar || e.dormant) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d >= bd || !sliceHit(p.x, p.y, TK_SL(p.aim), reach, e.x, e.y, .34 * (e.scale || 1))) continue;
      if (e.ai === "chase" || !A.behind(e, p.x, p.y)) continue;
      if (!SX.light.los(F, p.x, p.y - .4, e.x, e.y - .4)) continue;
      best = e;
      bd = d;
    }
    return best;
  };
  A.takedown = function(F, p, e, m) {
    const ang = Math.atan2(e.y - p.y, e.x - p.x), heavy = A.isHeavy(e);
    p.cool = .9;
    p.swing = 0;
    p.takeT = A.TAKE_T;
    p.takeAng = ang;
    p.punchN = (p.punchN | 0) + 1;
    SX.audio.play("takedown", {
      vol: .85
    });
    const dmg = heavy ? Math.max(A.HEAVY_TK, Math.round((e.hpMax || e.hp) * .5)) : 9999;
    A.hitEnemy(F, e, dmg, ang, p, false, null, true);
    A.float(F.idx, e.x, e.y - 1.6, heavy ? "몰래 처치 — 큰 피해" : "몰래 처치", "#9ad0f0");
    if (heavy) SX.log("🗡 등 뒤에서 찔렀습니다 — " + (e.name || e.vname || "두목") + " 은(는) 한 번에 쓰러지지 않습니다", "warn");
    SX.audio.play("hitFlesh", {
      vol: .3
    });
    A.noise(F, p.x, p.y, 2, true);
    if (SX.game.stats) SX.game.stats.stealth = (SX.game.stats.stealth | 0) + 1;
  };
  A.nadeInit = function(p, nade, wx, wy) {
    const d = Math.min(10, Math.hypot(wx - p.x, wy - p.y)), a = Math.atan2(wy - p.y, wx - p.x);
    const k = nade.sub === "fire" ? 1.26 : 1.1;
    return {
      floor: p.floor,
      x: p.x,
      y: p.y - .3,
      z: 1,
      vx: Math.cos(a) * d * k,
      vy: Math.sin(a) * d * k,
      vz: 3.5,
      fuse: nade.fuse || 2.6,
      from: p,
      dmg: nade.dmg || 90,
      radius: nade.radius || 3.2,
      sub: nade.sub || null,
      dur: nade.dur || 0
    };
  };
  A.nadeStep = function(F, n, dt, quiet) {
    if (!(n.z > 0 || Math.hypot(n.vx, n.vy) > .1)) return false;
    n.vz -= 12 * dt;
    n.z += n.vz * dt;
    if (n.z <= 0) {
      n.z = 0;
      n.vz = Math.abs(n.vz) * .3;
      n.vx *= .5;
      n.vy *= .5;
      if (!quiet && Math.abs(n.vz) > .5) SX.audio.play("hitWall", {
        x: n.x,
        y: n.y,
        range: 10,
        vol: .3
      });
    }
    const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt;
    if (F.blocked(nx, n.y + .3, true)) {
      n.vx *= -.4;
      n.bonk = 1;
    } else n.x = nx;
    if (F.blocked(n.x, ny + .3, true)) {
      n.vy *= -.4;
      n.bonk = 1;
    } else n.y = ny;
    if (n.z === 0) {
      n.vx *= Math.pow(.1, dt);
      n.vy *= Math.pow(.1, dt);
    }
    return true;
  };
  A.throwGrenade = function(F, p, it, quick) {
    if (A.swimNo(p, true)) return;
    if (p.throwJob) return;
    const free = A.canShootHere();
    let nade = it && it.kind === "grenade" && (free || I.kitFind(p.kit, it.id)) ? it : null;
    if (!nade) {
      let any = null;
      for (const g of I.kitGrids(p.kit)) for (const e of g.list) if (e.it.kind === "grenade") {
        if (!e.it.sub) {
          nade = e.it;
          break;
        }
        any = any || e.it;
      }
      nade = nade || any;
    }
    if (!nade) {
      SX.log("던질 것이 없습니다(수류탄 · 섬광탄 · 최루탄 · 연막탄 · 화염병)");
      return;
    }
    const release = () => {
      if (!p.alive || !(free || I.kitFind(p.kit, nade.id))) return;
      const F2 = SX.game.floorObj() || F;
      if (!free) I.kitTake(p.kit, nade);
      const n0 = A.nadeInit(p, nade, SX.view.mouseWorldX, SX.view.mouseWorldY);
      n0.floor = F2.idx;
      A.nades.push(n0);
      if (SX.coop) SX.coop.nade(A.nades[A.nades.length - 1]);
      SX.audio.play("swing", {
        vol: .5
      });
      SX.ui && SX.ui.hudDirty();
    };
    if (!quick) {
      SX.audio.play("pin");
      if (nade.sub) SX.log(nade.name + " 을 던집니다");
    }
    if (SX.tac && SX.tac.startThrow) SX.tac.startThrow(p, release, quick); else release();
  };
  A.useQuick = function(F, p, k) {
    const id = p.kit.quick[k];
    if (!id) return;
    const it = I.kitFind(p.kit, id);
    if (!it) {
      p.kit.quick[k] = null;
      return;
    }
    A.useItem(F, p, it);
  };
  const healAmt = it => (it.heal || 0) + (it.hot || 0);
  A.pickHeal = function(p) {
    const miss = A.hpMax(p) - p.hp, k = p.kit, J = inj(p);
    const need = test => {
      for (const [g, bag] of [ [ k.rig && k.rig.grid, false ], [ k.bag && k.bag.grid, true ] ]) {
        const c = (g && g.list || []).map(e => e.it).filter(it => it.kind === "heal" && test(it)).sort((a, b) => (a.val || 0) - (b.val || 0));
        if (c.length) return {
          it: c[0],
          bag
        };
      }
      return null;
    };
    for (const [on, test] of [ [ J.bleedH, it => it.stop === "H" ], [ J.bleedL, it => it.stop ] ]) if (on) {
      const q = need(test);
      if (q) return q;
    }
    const pick = g => {
      const hs = (g && g.list || []).map(e => e.it).filter(it => it.kind === "heal" && (it.heal || it.hot));
      if (!hs.length) return null;
      const enough = hs.filter(it => healAmt(it) >= miss).sort((a, b) => healAmt(a) - healAmt(b));
      return enough[0] || hs.sort((a, b) => healAmt(b) - healAmt(a))[0];
    };
    let it = pick(k.rig && k.rig.grid), bag = false;
    if (!it) {
      it = pick(k.bag && k.bag.grid);
      bag = !!it;
    }
    return it ? {
      it,
      bag
    } : null;
  };
  A.quickHeal = function(F, p) {
    if (!p || !p.alive || p.use || p.down) return;
    const J = inj(p);
    if (p.hp >= A.hpMax(p) - .5 && !J.bleedH && !J.bleedL) {
      SX.log("체력이 가득합니다");
      return;
    }
    const q = A.pickHeal(p);
    if (!q) {
      SX.log("회복약이 없습니다(리그·가방)");
      SX.audio.play("denied");
      return;
    }
    A.useItem(F, p, q.it, q.bag ? 2 : 1);
    if (p.use) SX.log("💊 " + q.it.name + (q.bag ? " — 가방에서 꺼냅니다(두 배 걸립니다)" : ""));
  };
  A.afixTarget = function(p) {
    const k = p && p.kit;
    let best = null, gap = .5;
    for (const s of [ "armor", "helmet" ]) {
      const a = k && k[s];
      if (!a || !a.armorMax) continue;
      const g = a.armorMax - (+a.armor || 0);
      if (g > gap) {
        gap = g;
        best = a;
      }
    }
    return best;
  };
  A.useItem = function(F, p, it, slow) {
    if (p.use || !it) return;
    if (p.down) {
      SX.log("쓰러진 채로는 못 씁니다 — 동료가 일으켜 주기를 기다리십시오");
      SX.audio.play("denied");
      return;
    }
    const k = slow || 1;
    if (it.kind === "heal") {
      if (!A.medUseful(p, it)) {
        SX.log("지금은 쓸 데가 없습니다 — " + it.name);
        return;
      }
      const mk = SX.skills ? SX.skills.mul("medic") : 1;
      p.use = {
        it,
        t: (it.cast || 3) * k * mk,
        dur: (it.cast || 3) * k * mk,
        label: it.name
      };
      p.reload = null;
      SX.audio.play("bandage");
    } else if (it.kind === "cure") {
      const no = SX.game.canCure && SX.game.canCure();
      if (no) {
        SX.log(no);
        SX.audio.play("denied");
        return;
      }
      p.use = {
        it,
        t: 2,
        dur: 2,
        label: it.name
      };
    } else if (it.kind === "afix") {
      if (!A.afixTarget(p)) {
        SX.log("고칠 방어구가 없습니다 — 입은 방탄복·방탄모가 멀쩡합니다");
        SX.audio.play("denied");
        return;
      }
      p.use = {
        it,
        t: (it.cast || 8) * k,
        dur: (it.cast || 8) * k,
        label: it.name
      };
      p.reload = null;
      SX.audio.play("rustle");
    } else if (it.kind === "flare") {
      if (SX.raid && SX.raid.flare(it)) I.kitTake(p.kit, it);
    } else if (SX.needs && SX.needs.of(it)) {
      p.use = {
        it,
        t: 2.5 * k,
        dur: 2.5 * k,
        label: it.name
      };
      p.reload = null;
      SX.audio.play("rustle");
    } else if (it.kind === "grenade") {
      if (SX.tac && SX.tac.take && (SX.game.state === "raid" || A.canShootHere())) SX.tac.take(p, it); else A.throwGrenade(F, p, it);
    } else if (it.kind === "trap") {
      if (SX.traps && SX.traps.startPlace) SX.traps.startPlace(F, p, it);
    } else if (it.kind === "mag" || it.kind === "gun") A.startReload(p);
    SX.ui && SX.ui.hudDirty();
  };
  A.finishUse = function(F, p, it) {
    if (!I.kitFind(p.kit, it.id)) return;
    if (it.kind === "trap") {
      if (SX.traps && SX.traps.finishPlace) SX.traps.finishPlace(F, p, it);
      SX.ui && SX.ui.hudDirty();
      return;
    }
    if (it.kind === "afix" && !A.afixTarget(p)) {
      SX.log("고칠 방어구가 없습니다 — " + it.name + " 는 그대로 남았습니다");
      return;
    }
    I.kitTake(p.kit, it);
    if (it.kind === "afix") {
      const a = A.afixTarget(p), add = Math.min(it.afix || 400, a.armorMax - (+a.armor || 0));
      a.armor = Math.round(((+a.armor || 0) + add) * 10) / 10;
      SX.audio.play("reload", {
        vol: .6
      });
      SX.log("🛡 " + it.name + " — " + a.name + " 내구 +" + Math.round(add) + " (" + Math.round(a.armor) + "/" + a.armorMax + ")", "good");
    } else if (it.kind === "heal") {
      const J = inj(p), X = pfx(p), done = [];
      if (it.bonus) {
        X.bonus = it.bonus;
        X.bonusT = it.bonusT || 180;
        p.hp += it.bonus;
        done.push("최대 체력 +" + it.bonus);
      }
      if (it.heal) p.hp = Math.min(A.hpMax(p), p.hp + it.heal);
      if (it.hot) {
        p.hot = it.hot / it.dur;
        p.hotT = it.dur;
      }
      if (it.stop === "H" && (J.bleedH || J.bleedL)) {
        J.bleedH = 0;
        J.bleedL = 0;
        done.push("출혈 멈춤");
      } else if (it.stop === "L") {
        if (J.bleedL) {
          J.bleedL = 0;
          done.push("가벼운 출혈 멈춤");
        } else if (J.bleedH) done.push("심한 출혈은 못 막습니다 — 지혈대");
      }
      if (it.stam) {
        p.st = A.stMax();
        X.stamT = Math.max(X.stamT || 0, it.stam);
        done.push("기력 가득");
      }
      SX.audio.play("heal");
      SX.log(it.name + " 사용" + (done.length ? " — " + done.join(" · ") : ""), done.length ? "good" : undefined);
      if (SX.skills) SX.skills.gain("medic", 1);
    } else if (it.kind === "cure") {
      SX.game.cure();
    } else if (SX.needs && SX.needs.of(it)) SX.needs.eat(SX.game.save, it);
    SX.ui && SX.ui.hudDirty();
  };
  A.PEN = {
    melee: 1,
    "9mm": 2,
    "12게이지": 2,
    blast: 3,
    "5.56mm": 4,
    "7.62mm": 5
  };
  const armorCls = arm => {
    const d = I.def(arm.name) || arm;
    let c = arm.cls || d.cls || 3;
    const mx = arm.armorMax || d.armorMax || d.armor || 1;
    if (arm.armor < mx * .3) c--;
    return c;
  };
  A.armorClsOf = arm => arm && arm.armor > 0 ? armorCls(arm) : 0;
  A.armorSlow = k => [ "armor", "helmet" ].reduce((s, n) => {
    const it = k && k[n];
    if (!it) return s;
    const v = it.slow != null ? it.slow : (I.def(it.name) || {}).slow;
    return s + (v || 0);
  }, 0);
  A.armorHit = function(arm, dmg, pen, head) {
    if (!arm || !(arm.armor > 0) || dmg <= 0) return dmg;
    const cls = armorCls(arm);
    let taken, wear;
    if (cls >= pen) {
      taken = dmg * (head ? .2 : .25);
      wear = (dmg - taken) * (.35 + .1 * pen);
    } else {
      taken = dmg * Math.min(1, .5 + .15 * (pen - cls));
      wear = dmg * .25;
    }
    if (wear > arm.armor) {
      const k = arm.armor / wear;
      taken = dmg - (dmg - taken) * k;
      wear = arm.armor;
    }
    arm.armor = Math.max(0, arm.armor - wear);
    return taken;
  };
  A.hurtPlayer = function(dmg, src, head, ang, cal, from, meta, at) {
    if (typeof meta === "string") {
      at = meta;
      meta = null;
    }
    const p = A.player;
    if (!p || !p.alive || SX.game.god) return;
    const k = p.kit, d0 = dmg, J0 = Object.assign({}, inj(p)), arm = head ? k.helmet : k.armor;
    if (at && !(arm && arm.armor > 0)) dmg *= A.fleshMul(at);
    dmg = A.armorHit(arm, dmg, A.penOf(cal, at), head);
    p.hurtT = .5;
    SX.audio.play("hurt", {
      vol: .8
    });
    const F = SX.game.floorObj();
    if (F) {
      blood(F, p.x, p.y - .4, ang == null ? Math.random() * 6.28 : ang, 6);
      if (Math.random() < .5) A.decal(F, p.x + (Math.random() - .5) * .6, p.y, "blood");
    }
    SX.view.shake(2.5);
    if (p.down) {
      if (SX.recap && SX.game.state === "raid") SX.recap.hit({
        d0,
        d: dmg,
        head,
        ang,
        cal,
        at,
        src,
        from,
        meta: meta || (A._hitBy ? {
          by: A._hitBy
        } : null),
        J0,
        J1: J0,
        dead: dmg > 0 && p.down.hp - dmg <= 0,
        down: 1
      });
      SX.coop.downHurt(dmg, src);
      SX.ui && SX.ui.hudDirty();
      return;
    }
    p.hp -= dmg;
    p.reload = null;
    if (p.use && p.use.it.kind !== "cure") p.use = null;
    if (!(SX.hub && SX.hub.fight)) A.rollInjury(p, dmg, cal, A._hitBy, from);
    if (SX.recap && SX.game.state === "raid") SX.recap.hit({
      d0,
      d: dmg,
      head,
      ang,
      cal,
      at,
      src,
      from,
      meta: meta || (A._hitBy ? {
        by: A._hitBy
      } : null),
      J0,
      J1: inj(p),
      dead: p.hp <= 0
    });
    if (p.hp <= 0 && SX.hub && SX.hub.fight) {
      p.hp = 1;
      SX.hub.endFight(false);
      SX.ui && SX.ui.hudDirty();
      return;
    }
    if (p.hp <= 0) A.playerZero(src || "쓰러졌습니다");
    SX.ui && SX.ui.hudDirty();
  };
  A.playerZero = function(src) {
    const p = A.player;
    if (!p || !p.alive) return;
    p.hp = 0;
    if (SX.coop && SX.coop.canDown && SX.coop.canDown()) {
      SX.coop.goDown(src);
      return;
    }
    p.alive = false;
    SX.game.playerDied(src || "쓰러졌습니다");
  };
  A.rawHurt = function(dmg, src) {
    const p = A.player;
    if (!p || !p.alive || !(dmg > 0)) return;
    if (p.down) {
      SX.coop.downHurt(dmg, src);
      return;
    }
    p.hp -= dmg;
    if (p.hp <= 0) A.playerZero(src);
  };
  const EFIRE = {
    pistol: {
      dmg: 10,
      cd: 1.1,
      burst: 1,
      gap: 0,
      range: 22,
      acc: 0
    },
    revolver: {
      dmg: 15,
      cd: 1.5,
      burst: 1,
      gap: 0,
      range: 22,
      acc: .03
    },
    smg: {
      dmg: 8,
      cd: 1.2,
      burst: 4,
      gap: .12,
      range: 20,
      acc: -.05
    },
    rifle: {
      dmg: 14,
      cd: 1,
      burst: 3,
      gap: .22,
      range: 28,
      acc: .05
    },
    lmg: {
      dmg: 11,
      cd: 1.7,
      burst: 6,
      gap: .1,
      range: 28,
      acc: -.03
    },
    sniper: {
      dmg: 42,
      cd: 2.8,
      burst: 1,
      gap: 0,
      range: 38,
      acc: .3,
      head: 1.3
    },
    shotgun: {
      dmg: 7,
      cd: 1.3,
      burst: 1,
      gap: 0,
      range: 13,
      acc: 0,
      pellets: 6
    }
  };
  A.EFIRE = EFIRE;
  const MOD_P = [ .05, .15, .3, .45 ];
  A.rollGunMods = function(gunName, tier, seed, n) {
    const g = I.def(gunName);
    if (!g) return [];
    const r = new SX.Rng(seed >>> 0), out = [];
    const want = n != null ? n : r.f() < MOD_P[Math.max(1, Math.min(4, tier | 0)) - 1] ? tier >= 4 && r.f() < .25 ? 2 : 1 : 0;
    for (let k = 0; k < want; k++) {
      const ok = D_PARTS().filter(p => SX.partFits(p, g) && !out.some(q => SX.partDef({
        name: q
      }).slot === p.slot));
      if (!ok.length) break;
      out.push(ok[r.i(ok.length)].name);
    }
    return out;
  };
  const D_PARTS = () => SX.data.parts || [];
  const posSeed = (F, x, y, salt) => Math.floor(x * 97) * 73856093 ^ Math.floor(y * 89) * 19349663 ^ (F.idx + 1) * 83492791 ^ (salt || 0);
  A.spawnEnemy = function(F, type, x, y, rng, ctx) {
    const isZ = type === "zombie";
    const b = ctx && ctx.building, tier = Math.max(1, Math.min(4, (b && b.diff || 2) + ((ctx && ctx.floor) >= 3 ? 1 : 0)));
    const e = {
      kind: "enemy",
      type,
      x,
      y,
      floor: F.idx,
      r: .26,
      alive: true,
      dead: false,
      hp: isZ ? 60 + 6 * (tier - 1) : 80 + 10 * (tier - 1),
      tier,
      spec: SX.art.charSpec(isZ ? "zombie" : "scav", rng),
      dir: rng.i(4),
      frame: 0,
      walkT: rng.f() * 4,
      face: rng.f() * 6.28,
      ai: "wander",
      calmT: 0,
      seenX: null,
      seenY: null,
      lureX: 0,
      lureY: 0,
      lureT: 0,
      cool: 0,
      wanderT: 0,
      wx: 0,
      wy: 0,
      crawler: isZ && rng.f() < .25,
      armed: !isZ && rng.f() < [ .22, .32, .48, .65 ][tier - 1],
      hasArmor: !isZ && rng.f() < [ .1, .25, .45, .65 ][tier - 1],
      doorSkill: !isZ && rng.f() < .6,
      items: [],
      foe: null,
      fsT: rng.f() * .4,
      barkT: 0,
      flinch: 0,
      swing: 0,
      kick: 0,
      muzzleT: 0,
      path: null,
      pathT: 0,
      sx: x,
      sy: y
    };
    if (!isZ) {
      const k = 2 + rng.i(3);
      for (let i = 0; i < k; i++) e.items.push(I.rollItem(rng, ctx));
      if (!e.armed) {
        e.melee = I.mk(rng.pick(SX.data.melee).name);
        e.items.push(e.melee);
        e.meleeDmg = e.melee.h > 2 ? 26 : 16;
      } else {
        e.gun = SX.enemyGun(rng, tier);
        e.gunMods = A.rollGunMods(e.gun, tier, posSeed(F, x, y));
      }
      if (rng.f() < .2) e.items.push(I.mk("방탄모"));
      if (e.spec.hat === "helmet") e.helmet = true;
    }
    e.melee2 = isZ || !e.armed;
    e.hp0 = e.hp;
    A.enemies.push(e);
    return e;
  };
  A.VARIANTS = {
    dog: {
      type: "zombie",
      name: "감염된 들개",
      speed: 3.4,
      sprintAt: 14,
      dmg: 8,
      cool: .75,
      night: .9
    },
    brute: {
      type: "zombie",
      name: "덩치 감염체",
      speed: 1.9,
      dmg: 30,
      cool: 1.7,
      knock: 1.4
    },
    hazmat: {
      type: "zombie",
      name: "방호복 감염체",
      speed: 2,
      dmg: 14
    },
    sniper: {
      type: "scav",
      name: "저격수",
      keep: [ 14, 32 ]
    },
    coach: {
      type: "zombie",
      name: "체육 선생",
      speed: 2.2,
      sprintAt: 9,
      dmg: 34,
      cool: 1.5,
      knock: 1.8,
      night: .9
    },
    master: {
      type: "zombie",
      name: "역장",
      speed: 2.2,
      dmg: 18,
      cool: 1,
      half: true,
      night: 1
    },
    nurse: {
      type: "zombie",
      name: "수간호사",
      speed: 3.1,
      sprintAt: 12,
      dmg: 20,
      cool: .8,
      night: 1.1
    }
  };
  const NOV = {};
  A.applyVariant = function(e, v, rng) {
    const V = A.VARIANTS[v];
    if (!V || e.type !== V.type) return e;
    e.variant = v;
    e.vname = V.name;
    e.crawler = false;
    const t = e.tier || 2;
    if (v === "dog") {
      e.hp = 34 + 5 * (t - 1);
      e.r = .2;
      e.spec = {
        key: "zv-dog",
        kind: "zombie",
        top: "#6a5a44",
        dog: true
      };
    } else if (v === "brute") {
      e.hp = (60 + 6 * (t - 1)) * 3.6;
      e.r = .34;
      e.scale = 1.3;
      e.spec = Object.assign({}, e.spec, {
        key: "zv-brute",
        top: "#3a3834",
        topStyle: "rags",
        pants: "#2a2830",
        skin: "#8a9a6a",
        hairStyle: "bald",
        hat: null,
        mask: null,
        torn: true
      });
    } else if (v === "hazmat") {
      e.hp = Math.round(e.hp * 1.25);
      e.spec = Object.assign({}, e.spec, {
        key: "zv-haz",
        top: "#d4b228",
        topStyle: "coat",
        pants: "#c2a124",
        boot: "#2a2a2a",
        hat: "hood",
        hatCol: "#d4b228",
        mask: "gas",
        gloves: true,
        torn: true
      });
    } else if (v === "sniper") {
      e.armed = true;
      e.melee2 = false;
      e.gun = "K14 저격소총";
      e.gunMods = rng.f() < .4 ? [ "전술 개머리판" ] : [];
      e.melee = null;
      e.spec = Object.assign({}, e.spec, {
        key: "sv-snip",
        topStyle: "camo",
        top: "#4a5a36",
        camo1: "#3a4a2a",
        camo2: "#6a6a44",
        pants: "#3a4230",
        hat: "bandana",
        hatCol: "#3a4a2a",
        mask: "black"
      });
    }
    e.hp0 = e.hp;
    return e;
  };
  A.VBV = {
    metro: {
      dog0: .95,
      dogUp: .6,
      haz: .1
    },
    base: {
      sniper: .85,
      sniperFrom: 1,
      haz: 0,
      dog0: .8
    },
    school: {
      haz: 0,
      dogUp: .05
    },
    bridge: {
      sniper: .9,
      sniperFrom: 0,
      haz: .05,
      dog0: 0
    },
    tunnel: {
      sniper: 0,
      haz: .12,
      dog0: .9
    },
    site: {
      sniper: .7,
      sniperFrom: 0,
      haz: .05,
      dog0: .5
    }
  };
  A.V_P = {
    brute: [ 0, .35, .5, .7 ],
    haz: [ 0, .04, .07, .15 ],
    sniper: [ 0, .25, .45, .7 ],
    dog0: [ .35, .6, .75, .9 ],
    dogUp: [ 0, .15, .25, .35 ]
  };
  A.spawnVariants = function(F, rng, ctx, diff, avoid) {
    const d = Math.max(1, Math.min(4, diff | 0)) - 1, f = F.idx, pts = avoid || [];
    const BV = A.VBV[ctx && ctx.building && ctx.building.id] || {};
    const mine = fn => A.enemies.filter(e => e.alive && e.floor === f && !e.variant && !e.boss && !e.leash && fn(e));
    const VP = A.V_P;
    if (f >= 1 && rng.f() < VP.brute[d]) {
      const L = mine(e => e.type === "zombie");
      if (L.length) A.applyVariant(L[rng.i(L.length)], "brute", rng);
    }
    for (const z of mine(e => e.type === "zombie")) if (rng.f() < (BV.haz != null ? BV.haz : VP.haz[d])) A.applyVariant(z, "hazmat", rng);
    if (f >= (BV.sniperFrom != null ? BV.sniperFrom : 2) && rng.f() < (BV.sniper != null ? BV.sniper : VP.sniper[d])) {
      const L = mine(e => e.type === "scav" && e.armed);
      if (L.length) A.applyVariant(L[rng.i(L.length)], "sniper", rng);
    }
    const packs = f === 0 ? rng.f() < (BV.dog0 != null ? BV.dog0 : VP.dog0[d]) ? 1 : 0 : rng.f() < (BV.dogUp != null ? BV.dogUp : VP.dogUp[d]) ? 1 : 0;
    for (let k = 0; k < packs; k++) {
      let c = null;
      for (let t = 0; t < 300 && !c; t++) {
        const x = SX.map.MARGIN + 2 + rng.f() * (SX.map.SIZE - 4), y = SX.map.MARGIN + 2 + rng.f() * (SX.map.SIZE - 4), tx = Math.floor(x), ty = Math.floor(y);
        if (F.tile(tx, ty) !== T.FLOOR || !F.inside[F.i(tx, ty)] || !A.free(F, x, y, .35)) continue;
        if (pts.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < 18)) continue;
        if (A.roomHasOther(F, x, y, "zombie")) continue;
        c = [ x, y ];
      }
      if (!c) break;
      const n = 3 + rng.i(2);
      for (let i = 0; i < n; i++) {
        for (let t = 0; t < 20; t++) {
          const x = c[0] + (rng.f() - .5) * 3, y = c[1] + (rng.f() - .5) * 3;
          if (!A.free(F, x, y, .25) || A.roomHasOther(F, x, y, "zombie")) continue;
          A.applyVariant(A.spawnEnemy(F, "zombie", x, y, rng, ctx), "dog", rng);
          break;
        }
      }
    }
  };
  A.foesOf = function(b, o) {
    o = o || {};
    if (!b || b.train || b.place) return [];
    const diff = b.diff || 2, d = Math.max(1, Math.min(4, diff | 0)) - 1, n = Math.max(1, b.floors | 0), BV = A.VBV[b.id] || {}, VP = A.V_P;
    const zs = b.zShare != null ? b.zShare : [ .65, .6, .5, .45 ][Math.min(4, diff) - 1];
    const pv = k => BV[k] != null ? BV[k] : VP[k][d];
    const all = Array.from({
      length: n
    }, (_, i) => i), up = all.slice(1), out = [];
    const add = (k, fl, x) => {
      if (fl.length) out.push(Object.assign({
        k,
        fl
      }, x || {}));
    };
    const wkOn = !!(o.wk && !b.final && !b.outdoor), horde = wkOn && o.wk === "horde";
    add("zombie", zs > 0 ? all : []);
    add("scav", zs < 1 ? all : []);
    add("dog", (pv("dog0") > 0 ? [ 0 ] : []).concat(pv("dogUp") > 0 ? up : []));
    add("brute", VP.brute[d] > 0 || horde ? up : []);
    add("hazmat", pv("haz") > 0 || horde && b.id !== "school" && b.id !== "base" ? all : []);
    {
      const sf = BV.sniperFrom != null ? BV.sniperFrom : 2;
      add("sniper", zs < 1 && pv("sniper") > 0 ? all.filter(f => f >= sf) : []);
    }
    if (wkOn && o.wk === "lock") add("wksol", all, {
      at: "-"
    });
    if (!b.noBoss && !o.fire) add("boss", [ n - 1 ], {
      at: b.outdoor ? "-" : "옥상"
    });
    {
      const nb = (SX.NAMED_BOSSES || {})[b.id];
      if (nb && !b.noBoss && !b.final) add("n:" + nb.id, n >= 2 ? up : [ 0 ], {
        half: true,
        name: nb.name
      });
    }
    if (o.sp === "nos" || o.sp === "noz") {
      const nb = (SX.NAMED_BOSSES || {})[b.id], cut = o.sp === "noz" ? "zombie" : "scav";
      const drop = o.sp === "noz" ? {
        zombie: 1,
        dog: 1,
        brute: 1,
        hazmat: 1
      } : {
        scav: 1,
        sniper: 1,
        wksol: 1,
        boss: 1
      };
      return out.filter(f => !drop[f.k] && !(f.k.indexOf("n:") === 0 && nb && nb.type === cut));
    }
    return out;
  };
  function hostile(e, f) {
    return f !== e && f.alive && f.type !== e.type && f.floor === e.floor;
  }
  function foeTarget(f) {
    if (!f._asT) f._asT = {
      foe: f,
      get x() {
        return f.x;
      },
      get y() {
        return f.y;
      },
      get alive() {
        return f.alive;
      },
      stealth: 1,
      floor: f.floor
    };
    return f._asT;
  }
  function playerTarget() {
    const p = A.player;
    if (!p._asT) p._asT = {
      player: true,
      get x() {
        return A.player.x;
      },
      get y() {
        return A.player.y;
      },
      get alive() {
        return A.player.alive && (SX.game.inRaid() || !!(SX.hub && SX.hub.fight));
      },
      get stealth() {
        const pl = A.player;
        let f = (pl.sprinting ? 1.15 : SX.input.held("quiet") ? .55 : 1) * (pl.torch && SX.game.env.night ? 1.25 : 1);
        if (pl.crouch || pl.down) f *= .55;
        if (pl.boxOn) f *= pl.moving ? .85 : .12;
        if (SX.tac && SX.tac.cover) f *= .7;
        return f;
      },
      get floor() {
        return A.player.floor;
      },
      get cover() {
        return SX.tac ? SX.tac.cover : null;
      },
      get low() {
        return !!(A.player.crouch || A.player.down);
      },
      get torch() {
        return !!A.player.torch;
      },
      get aim() {
        return A.player.aim || 0;
      },
      get shotAt() {
        return A.player.shotAt || 0;
      }
    };
    return p._asT;
  }
  function playerTargets() {
    const out = [ playerTarget() ];
    if (SX.coop) for (const g of SX.coop.ghostTargets()) out.push(g);
    if (SX.ev && SX.ev.targets) SX.ev.targets(out);
    if (SX.mis && SX.mis.targets) SX.mis.targets(out);
    return out;
  }
  A.EYE_H = .17;
  A.EYE_ALERT = -.08;
  A.EYE_Z = .5;
  A.NEAR_H = 2.2;
  A.NEAR_Z = 1.2;
  A.Z_EAR = 1.5;
  function inCone(F, e, tx, ty, range, cut, sneak, near) {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), nr = near || A.NEAR_H;
    if (SX.wx) range *= SX.wx.sightMul(F, e.x, e.y, tx, ty);
    if (d > range) return false;
    if (d > nr || sneak && d > .7) {
      const dot = (dx * Math.cos(e.face) + dy * Math.sin(e.face)) / d;
      if (dot < (d > nr ? cut : -.45)) return false;
    }
    return true;
  }
  function sight(F, e, tx, ty, range, cut, sneak, near) {
    if (!inCone(F, e, tx, ty, range, cut, sneak, near)) return false;
    return SX.light.los(F, e.x, e.y - .5, tx, ty - .5) && !(SX.tac && SX.tac.smokeBlocks(F, e.x, e.y - .5, tx, ty - .5));
  }
  const propHid = (F, e, T) => !!(T && T.player && SX.light.propBlocked && SX.light.propBlocked(F, T.x, SX.light.eyeY(F, T.x, T.y), T.y, e.x, e.y));
  const BODY_UP = [ .95, .5, .12 ], BODY_LOW = [ .62, .35, .1 ];
  let LIT = false;
  function darkAt(F, x, y, night) {
    if (night) return true;
    const i = F.i(Math.floor(x), Math.floor(y));
    return !!(F.inside && F.inside[i] && (F.park || !F.win || F.win[i] < .5));
  }
  function torchOn(F, e, T, night) {
    if (!T.torch || T.floor !== e.floor || !darkAt(F, e.x, e.y, night)) return false;
    const dx = e.x - T.x, dy = e.y - T.y, d = Math.hypot(dx, dy);
    if (d > 12 || d < .05 || Math.abs(SX.angDiff(T.aim || 0, Math.atan2(dy, dx))) > .5) return false;
    return SX.light.los(F, T.x, T.y - .5, e.x, e.y - .5) && !(SX.tac && SX.tac.smokeBlocks(F, T.x, T.y - .5, e.x, e.y - .5)) && !propHid(F, e, T);
  }
  function lowCover(F, e, Q) {
    const dx = e.x - Q.x, dy = e.y - Q.y, d = Math.hypot(dx, dy);
    if (d < 2) return false;
    const ox = Math.floor(Q.x), oy = Math.floor(Q.y);
    for (let s = .3; s <= 1.35; s += .25) {
      const tx = Math.floor(Q.x + dx / d * s), ty = Math.floor(Q.y - .12 + dy / d * s);
      if (tx === ox && ty === oy || !F.in(tx, ty)) continue;
      const i = ty * F.W + tx, t = F.t[i];
      if (t === T.WINDOW || t === T.PARAPET) return true;
      if (F.solid && F.solid[i] && !F.opaque(tx, ty)) return true;
    }
    return false;
  }
  function partY(F, T, up) {
    const y = T.y - up, ty = Math.floor(y);
    return ty < Math.floor(T.y) && F.opaque(Math.floor(T.x), ty) ? ty + 1.02 : y;
  }
  function seeParts(F, e, T, R, cut, near, night) {
    LIT = false;
    if (!T || !T.alive || T.floor !== e.floor) return 0;
    if (T.player && torchOn(F, e, T, night)) {
      LIT = true;
      return 3;
    }
    if (!inCone(F, e, T.x, T.y, R, cut, T.stealth < .6, near)) return 0;
    if (T.player && SX.tac && SX.tac.hiddenFrom(F, e, T)) return 0;
    if (propHid(F, e, T)) return 0;
    const H = T.low ? BODY_LOW : BODY_UP, ex = e.x, ey = e.y - .5, PB = T.player && SX.light.propBlocked, TC = SX.tac;
    let n = 0, lc = null;
    for (let k = 0; k < 3; k++) {
      const py = k === 1 ? T.y - .5 : partY(F, T, H[k]);
      if (!SX.light.los(F, ex, ey, T.x, py) || TC && TC.smokeBlocks(F, ex, ey, T.x, py)) continue;
      if (PB && SX.light.propBlocked(F, T.x, k === 1 ? SX.light.eyeY(F, T.x, T.y) : py, T.y, e.x, e.y)) continue;
      if (k === 2 || k === 1 && T.low) {
        if (lc == null) lc = lowCover(F, e, T);
        if (lc) continue;
      }
      n++;
    }
    return n;
  }
  A.AW = {
    near: 4,
    tNear: .25,
    tFar: 1.5,
    night: 1.5,
    hold: .6,
    drain: .35,
    half: .5,
    bang: .6,
    shot: .4
  };
  function aware(F, e, P, see, range, night, dt) {
    const W = A.AW, now = performance.now() / 1e3;
    if (e.aw == null) e.aw = 0;
    if (see && P && P.alive) {
      e.awLost = 0;
      e.awX = P.x;
      e.awY = P.y;
      if (e.ai === "chase" || e.awSure || e.awLit || P.shotAt && A.clock - P.shotAt >= 0 && A.clock - P.shotAt < W.shot) e.aw = 1; else {
        const d = Math.hypot(P.x - e.x, P.y - e.y), R = Math.max(W.near + .5, range * (P.stealth || 1));
        let t = d <= W.near ? W.tNear : W.tNear + (W.tFar - W.tNear) * Math.min(1, (d - W.near) / (R - W.near));
        if (night) t *= W.night;
        e.aw = Math.min(1, e.aw + dt / t * (Math.max(1, Math.min(3, e.seeN || 3)) / 3));
      }
      if (e.aw >= 1) {
        if (e.ai !== "chase" && !e.awSure) e.awBangAt = now;
        e.awSure = true;
        e.awLook = false;
        e.awShow = 0;
        return true;
      }
      e.awLook = true;
      e.awShow = e.aw;
      return false;
    }
    e.awLook = false;
    const lost0 = !e.awLost && e.aw > 0;
    e.awLost = (e.awLost || 0) + dt;
    if (lost0 && e.aw > W.half && e.ai !== "chase" && !e.awSure && e.awX != null) {
      e.seenX = e.awX;
      e.seenY = e.awY;
      A.suspect(e, true);
    }
    if (e.awLost > W.hold) e.aw = Math.max(0, e.aw - W.drain * dt);
    if (e.awSure && e.ai === "wander") e.awSure = false;
    e.awShow = e.awSure ? 0 : e.aw;
    return false;
  }
  function scanFoe(F, e, P, pd, range, cut, near, night) {
    e.seeN = P.alive && P.floor === e.floor ? seeParts(F, e, P, range * P.stealth, cut, near, night) : 0;
    e.awLit = LIT;
    e.seesP = e.seeN > 0;
    const cur = e.foe;
    if (cur && hostile(e, cur) && sight(F, e, cur.x, cur.y, range * 1.25, cut, false, near)) return cur;
    let c1 = null, d1 = range * range, c2 = null, d2 = range * range;
    for (const f of A.enemies) {
      if (!hostile(e, f)) continue;
      const q = (f.x - e.x) ** 2 + (f.y - e.y) ** 2;
      if (q < d1) {
        c2 = c1;
        d2 = d1;
        c1 = f;
        d1 = q;
      } else if (q < d2) {
        c2 = f;
        d2 = q;
      }
    }
    for (const f of [ c1, c2 ]) if (f && sight(F, e, f.x, f.y, range, cut, false, near)) return f;
    return null;
  }
  const GAP_R = .28, CHAIN = 40, PICK = 8, FRAME_CELLS = 3e3, FLOW_BOX = 40, FLOW_T = .25, COMP_T = .5, FLOW_NEAR = 1.5;
  const DX4 = [ 1, -1, 0, 0 ], DY4 = [ 0, 0, 1, -1 ];
  let pfN = 0, pfStamp = 0, pfMark = null, pfFrom = null, pfQ = null, pfCells = null, pfPts = null;
  function pfBuf(N) {
    if (pfN < N) {
      pfN = N;
      pfMark = new Uint32Array(N);
      pfFrom = new Int32Array(N);
      pfQ = new Int32Array(N);
      pfCells = new Int32Array(N);
      pfPts = new Float32Array(N * 2);
      pfStamp = 0;
    }
    if (++pfStamp >= 4294967280) {
      pfMark.fill(0);
      pfStamp = 1;
    }
    return pfStamp;
  }
  const pfFloors = new WeakMap;
  const fsOf = F => {
    let s = pfFloors.get(F);
    if (!s) {
      s = {};
      pfFloors.set(F, s);
    }
    return s;
  };
  const pfZero = () => ({
    ms: 0,
    cells: 0,
    calls: 0,
    skipped: 0,
    unreach: 0,
    flowMs: 0,
    flowCells: 0,
    flowBuilds: 0,
    flowUse: 0,
    compMs: 0,
    gapMs: 0
  });
  let PF = pfZero(), PL = pfZero(), pfFrame = 0;
  const PS = pfZero();
  function pfTick() {
    for (const k in PF) PS[k] += PF[k];
    PL = PF;
    PF = pfZero();
    pfFrame++;
  }
  const pfCompact = q => ({
    ms: Math.round((q.ms + q.flowMs) * 100) / 100,
    cells: q.cells + q.flowCells,
    n: q.calls,
    flow: q.flowBuilds,
    skip: q.skipped || undefined,
    un: q.unreach || undefined
  });
  A.pathFrame = () => pfCompact(PF.calls || PF.flowBuilds ? PF : PL);
  A.pathStat = () => Object.assign({
    frames: pfFrame,
    last: Object.assign({}, PL)
  }, PS);
  const pfBusy = () => PF.cells > FRAME_CELLS;
  function gapState(F) {
    const s = fsOf(F), N = F.W * F.H, k1 = F.props ? F.props.length : 0, k2 = F.ver || 0;
    let g = s.gap;
    if (!g || g.N !== N) g = s.gap = {
      N,
      k1: -1,
      k2: -1,
      b: new Uint8Array(N),
      ox: new Uint8Array(N),
      oy: new Uint8Array(N)
    };
    if (g.k1 !== k1 || g.k2 !== k2) {
      g.k1 = k1;
      g.k2 = k2;
      g.b.fill(0);
    }
    return g;
  }
  function gapCalc(F, g, n) {
    const t0 = performance.now();
    let bits = 4;
    const p = F.propAt[n];
    if (p && (p.auto || p.fine)) {
      const tx = n % F.W, ty = n / F.W | 0;
      for (let ax = 0; ax < 2; ax++) {
        let run = 0, best = -1, bestRun = 0;
        for (let i = 2; i <= 14; i++) {
          let ok = true;
          for (let k = 0; k <= 8 && ok; k++) ok = ax === 0 ? !hitsAt(F, tx + i / 16, ty + k / 8, GAP_R) : !hitsAt(F, tx + k / 8, ty + i / 16, GAP_R);
          if (ok) {
            run++;
            if (run > bestRun) {
              bestRun = run;
              best = i - (run >> 1);
            }
          } else run = 0;
        }
        if (best >= 0) {
          if (ax === 0) {
            bits |= 1;
            g.ox[n] = best;
          } else {
            bits |= 2;
            g.oy[n] = best;
          }
        }
      }
    }
    g.b[n] = bits;
    PF.gapMs += performance.now() - t0;
    return bits;
  }
  function cellPass(F, n, skill, g, goal) {
    const t = F.t[n];
    if (t === T.DOOR) {
      const d = F.doorAt.get(n);
      if (!d || d.locked || !(d.open || skill)) return 0;
    } else if (t !== T.FLOOR && t !== T.GROUND && t !== T.STAIR) return 0;
    if (n === goal) return 3;
    if (F.fireAt && F.fireAt[n]) return 0;
    if (F.oilAt && F.oilAt[n]) return 0;
    if (F.solid[n] && !(F.thin && F.thin[n])) {
      if (!g) return 0;
      return (g.b[n] || gapCalc(F, g, n)) & 3;
    }
    return 3;
  }
  function doorSig(F) {
    const D = F.doors;
    if (!D) return 0;
    let h = D.length;
    for (let i = 0; i < D.length; i++) {
      const d = D[i];
      h = h * 31 + (d.open ? 1 : 0) + (d.locked ? 2 : 0) | 0;
    }
    return h;
  }
  function compFill(F, L, skill) {
    const W = F.W, H = F.H, N = W * H;
    if (pfN < N) pfBuf(N);
    const Q = pfQ;
    for (let n = 0; n < N; n++) {
      const t = F.t[n];
      let ok = t === T.FLOOR || t === T.GROUND || t === T.STAIR;
      if (t === T.DOOR) {
        const d = F.doorAt.get(n);
        ok = !!d && !d.locked && (d.open || skill);
      }
      if (ok && F.fireAt && F.fireAt[n]) ok = false;
      if (ok && F.oilAt && F.oilAt[n]) ok = false;
      if (ok && F.solid[n] && !(F.thin && F.thin[n])) {
        const p = F.propAt[n];
        ok = !!(p && (p.auto || p.fine));
      }
      L[n] = ok ? 0 : -1;
    }
    let id = 0;
    for (let s0 = 0; s0 < N; s0++) {
      if (L[s0] !== 0) continue;
      id++;
      let h = 0, tl = 0;
      Q[tl++] = s0;
      L[s0] = id;
      while (h < tl) {
        const c = Q[h++], cx = c % W;
        if (cx + 1 < W && L[c + 1] === 0) {
          L[c + 1] = id;
          Q[tl++] = c + 1;
        }
        if (cx > 0 && L[c - 1] === 0) {
          L[c - 1] = id;
          Q[tl++] = c - 1;
        }
        if (c + W < N && L[c + W] === 0) {
          L[c + W] = id;
          Q[tl++] = c + W;
        }
        if (c - W >= 0 && L[c - W] === 0) {
          L[c - W] = id;
          Q[tl++] = c - W;
        }
      }
    }
  }
  function compsOf(F) {
    const s = fsOf(F), N = F.W * F.H, k0 = doorSig(F), k1 = F.props ? F.props.length : 0, k2 = F.ver || 0;
    let c = s.comp;
    if (c && c.N === N && c.k0 === k0 && c.k1 === k1 && c.k2 === k2) return c;
    const age = c ? A.clock - c.t : 1e9;
    if (c && c.N === N && age >= 0 && age < COMP_T) return null;
    const t0 = performance.now();
    if (!c || c.N !== N) c = s.comp = {
      N,
      t: 0,
      k0: 0,
      k1: 0,
      k2: 0,
      lab0: new Int32Array(N),
      lab1: new Int32Array(N)
    };
    c.t = A.clock;
    c.k0 = k0;
    c.k1 = k1;
    c.k2 = k2;
    compFill(F, c.lab0, false);
    compFill(F, c.lab1, true);
    PF.compMs += performance.now() - t0;
    return c;
  }
  const rsA = new Int32Array(5), rsB = new Int32Array(5);
  function labsAt(F, L, x, y, out) {
    const W = F.W, i = y * W + x;
    if (L[i] > 0) {
      out[0] = L[i];
      return 1;
    }
    let n = 0;
    if (x + 1 < W && L[i + 1] > 0) out[n++] = L[i + 1];
    if (x > 0 && L[i - 1] > 0) out[n++] = L[i - 1];
    if (y + 1 < F.H && L[i + W] > 0) out[n++] = L[i + W];
    if (y > 0 && L[i - W] > 0) out[n++] = L[i - W];
    return n;
  }
  function reachOK(F, skill, sx, sy, gx, gy) {
    if (Math.abs(sx - gx) + Math.abs(sy - gy) <= 1) return true;
    const c = compsOf(F);
    if (!c) return true;
    const g = gy * F.W + gx, t = F.t[g];
    if (t === T.DOOR) {
      const d = F.doorAt.get(g);
      if (!d || d.locked || !(d.open || skill)) return false;
    } else if (t !== T.FLOOR && t !== T.GROUND && t !== T.STAIR) return false;
    const L = skill ? c.lab1 : c.lab0, na = labsAt(F, L, sx, sy, rsA), nb = labsAt(F, L, gx, gy, rsB);
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) if (rsA[i] === rsB[j]) return true;
    return false;
  }
  let ptX = 0, ptY = 0;
  function cellPt(F, g, c, prev, nxt) {
    const W = F.W, cx = c % W, cy = c / W | 0;
    ptX = cx + .5;
    ptY = cy + .5;
    if (!g || !F.solid[c] || F.thin && F.thin[c]) return;
    const b = g.b[c];
    if (!(b & 3)) return;
    const dv = Math.abs(c - prev) === W || nxt >= 0 && Math.abs(nxt - c) === W, dh = Math.abs(c - prev) === 1 || nxt >= 0 && Math.abs(nxt - c) === 1;
    if (dv && b & 1) ptX = cx + g.ox[c] / 16;
    if (dh && b & 2) ptY = cy + g.oy[c] / 16;
  }
  function bfsRun(F, e, start, goal, lim, g) {
    const W = F.W, st = pfStamp, M = pfMark, P = pfFrom, Q = pfQ, skill = !!e.doorSkill;
    let h = 0, tl = 0, seen = 1;
    M[start] = st;
    P[start] = -1;
    Q[tl++] = start;
    while (h < tl && seen < lim) {
      const c = Q[h++];
      if (c === goal) break;
      const cx = c % W, cy = c / W | 0;
      const cg = g && c !== start && F.solid[c] && !(F.thin && F.thin[c]) ? g.b[c] & 3 : 3;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DX4[k], ny = cy + DY4[k];
        if (!F.in(nx, ny)) continue;
        const n = ny * W + nx;
        if (M[n] === st) continue;
        const ax = DX4[k] ? 2 : 1;
        if (!(cg & ax)) continue;
        if (!(cellPass(F, n, skill, g, goal) & ax)) continue;
        M[n] = st;
        P[n] = c;
        seen++;
        Q[tl++] = n;
      }
    }
    PF.cells += seen;
    return M[goal] === st;
  }
  function bfsChain(F, start, goal, g, max, out) {
    const P = pfFrom, B = pfCells;
    let L = 0;
    for (let c = goal; c !== start && c >= 0 && L < B.length; c = P[c]) B[L++] = c;
    const n = Math.min(L, max);
    let prev = start;
    for (let j = 0; j < n; j++) {
      const c = B[L - 1 - j];
      cellPt(F, g, c, prev, j + 1 < L ? B[L - 2 - j] : -1);
      out[2 * j] = ptX;
      out[2 * j + 1] = ptY;
      prev = c;
    }
    return n;
  }
  const chainBuf = new Float32Array(CHAIN * 2);
  let chainN = 0;
  function pathTo(F, e, tx, ty, maxN) {
    chainN = 0;
    const sx = Math.floor(e.x), sy = Math.floor(e.y), gx = Math.floor(tx), gy = Math.floor(ty);
    if (sx === gx && sy === gy) return null;
    if (!F.in(sx, sy) || !F.in(gx, gy)) return null;
    const t0 = performance.now(), W = F.W;
    let out = null;
    PF.calls++;
    if (!reachOK(F, !!e.doorSkill, sx, sy, gx, gy)) PF.unreach++; else {
      pfBuf(W * F.H);
      const g = (e.r || R) <= GAP_R ? gapState(F) : null, start = sy * W + sx, goal = gy * W + gx;
      if (bfsRun(F, e, start, goal, maxN || 1600, g)) {
        chainN = bfsChain(F, start, goal, g, CHAIN, chainBuf);
        if (chainN) out = {
          x: chainBuf[0],
          y: chainBuf[1]
        };
      }
    }
    PF.ms += performance.now() - t0;
    return out;
  }
  const flowOK = e => e.type === "zombie" && e.variant !== "brute" && !e.doorSkill && (e.r || R) <= GAP_R;
  function flowOf(F) {
    const s = fsOf(F), k0 = doorSig(F), k1 = F.props ? F.props.length : 0, k2 = F.ver || 0;
    let fl = s.flow;
    const age = fl ? A.clock - fl.t : 1e9;
    if (fl && age >= 0 && age < FLOW_T && fl.k0 === k0 && fl.k1 === k1 && fl.k2 === k2) return fl;
    const t0 = performance.now(), W = F.W, H = F.H, N = W * H;
    if (!fl || fl.N !== N) fl = s.flow = {
      N,
      t: 0,
      k0: 0,
      k1: 0,
      k2: 0,
      st: 0,
      mark: new Uint32Array(N),
      par: new Int32Array(N),
      src: new Uint8Array(N),
      gx: new Float32Array(16),
      gy: new Float32Array(16),
      ng: 0,
      box: [ 0, 0, 0, 0 ]
    };
    fl.t = A.clock;
    fl.k0 = k0;
    fl.k1 = k1;
    fl.k2 = k2;
    fl.ng = 0;
    if (++fl.st >= 4294967280) {
      fl.mark.fill(0);
      fl.st = 1;
    }
    if (pfN < N) pfBuf(N);
    const st = fl.st, M = fl.mark, P = fl.par, S = fl.src, Q = pfQ;
    let h = 0, tl = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (const q of playerTargets()) {
      if (fl.ng >= 16) break;
      if (!q || !q.alive || q.floor !== F.idx) continue;
      const cx = Math.floor(q.x), cy = Math.floor(q.y);
      if (!F.in(cx, cy)) continue;
      const c = cy * W + cx;
      if (M[c] === st) continue;
      M[c] = st;
      P[c] = -1;
      S[c] = fl.ng;
      fl.gx[fl.ng] = q.x;
      fl.gy[fl.ng] = q.y;
      fl.ng++;
      Q[tl++] = c;
      if (cx < x0) x0 = cx;
      if (cx > x1) x1 = cx;
      if (cy < y0) y0 = cy;
      if (cy > y1) y1 = cy;
    }
    if (fl.ng) {
      x0 = Math.max(0, x0 - FLOW_BOX);
      y0 = Math.max(0, y0 - FLOW_BOX);
      x1 = Math.min(W - 1, x1 + FLOW_BOX);
      y1 = Math.min(H - 1, y1 + FLOW_BOX);
      fl.box[0] = x0;
      fl.box[1] = y0;
      fl.box[2] = x1;
      fl.box[3] = y1;
      const g = gapState(F);
      while (h < tl) {
        const c = Q[h++], cx = c % W, cy = c / W | 0;
        const cg = P[c] >= 0 && F.solid[c] && !(F.thin && F.thin[c]) ? g.b[c] & 3 : 3;
        for (let k = 0; k < 4; k++) {
          const nx = cx + DX4[k], ny = cy + DY4[k];
          if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
          const n = ny * W + nx;
          if (M[n] === st) continue;
          const ax = DX4[k] ? 2 : 1;
          if (!(cg & ax)) continue;
          if (!(cellPass(F, n, false, g, -1) & ax)) continue;
          M[n] = st;
          P[n] = c;
          S[n] = S[c];
          Q[tl++] = n;
        }
      }
    }
    PF.flowBuilds++;
    PF.flowCells += h;
    PF.flowMs += performance.now() - t0;
    return fl;
  }
  function flowChain(F, e, tx, ty, out) {
    const fl = flowOf(F);
    if (!fl.ng) return 0;
    const W = F.W, sx = Math.floor(e.x), sy = Math.floor(e.y);
    if (!F.in(sx, sy)) return 0;
    let c = sy * W + sx;
    if (fl.mark[c] !== fl.st || fl.par[c] < 0) return 0;
    const gi = fl.src[c];
    if (Math.abs(fl.gx[gi] - tx) > FLOW_NEAR || Math.abs(fl.gy[gi] - ty) > FLOW_NEAR) return 0;
    const g = gapState(F);
    let n = 0, prev = c;
    c = fl.par[c];
    while (c >= 0 && n < CHAIN) {
      const nx = fl.par[c];
      cellPt(F, g, c, prev, nx);
      out[2 * n] = ptX;
      out[2 * n + 1] = ptY;
      n++;
      prev = c;
      c = nx;
    }
    PF.flowUse++;
    return n;
  }
  function pathAim(F, e, P) {
    const B = e.pathB, r = (e.r || R) * 1.02;
    if (P.aim >= 0) {
      if (Math.hypot(B[2 * P.aim] - e.x, B[2 * P.aim + 1] - e.y) >= .25) {
        ptX = B[2 * P.aim];
        ptY = B[2 * P.aim + 1];
        return true;
      }
      P.k = P.aim + 1;
      P.aim = -1;
      if (P.k >= P.n) {
        e.pathT = 0;
        return false;
      }
    }
    const top = Math.min(P.n - 1, P.k + PICK - 1);
    let j = P.k;
    for (let m = top; m > P.k; m--) if (walkLine(F, e.x, e.y, B[2 * m], B[2 * m + 1], r) && !hazLine(F, e.x, e.y, B[2 * m], B[2 * m + 1])) {
      j = m;
      break;
    }
    P.aim = j;
    ptX = B[2 * j];
    ptY = B[2 * j + 1];
    return true;
  }
  let sepHead = new Int32Array(1024), sepNext = new Int32Array(64), sepCX = new Int32Array(64), sepCY = new Int32Array(64), sepObj = [], sepFrame = -1, sepArr = null, sepLen = -1, sepT = 0;
  const sepKey = (f, cx, cy) => (cx * 73856093 ^ cy * 19349663 ^ (f + 1) * 83492791) & 1023;
  function sepBuild() {
    const E = A.enemies, L = E.length;
    if (sepNext.length < L) {
      sepNext = new Int32Array(L * 2);
      sepCX = new Int32Array(L * 2);
      sepCY = new Int32Array(L * 2);
    }
    sepHead.fill(-1);
    sepObj.length = L;
    for (let i = 0; i < L; i++) {
      const o = E[i];
      sepObj[i] = o;
      if (!o.alive) continue;
      const cx = Math.floor(o.x / 2), cy = Math.floor(o.y / 2), k = sepKey(o.floor, cx, cy);
      sepCX[i] = cx;
      sepCY[i] = cy;
      sepNext[i] = sepHead[k];
      sepHead[k] = i;
    }
    sepFrame = pfFrame;
    sepArr = E;
    sepLen = L;
    sepT = performance.now();
  }
  function sepPush(F, e) {
    if (sepFrame !== pfFrame || sepArr !== A.enemies || sepLen !== A.enemies.length || performance.now() - sepT > 100) sepBuild();
    const cx = Math.floor(e.x / 2), cy = Math.floor(e.y / 2);
    for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
      for (let i = sepHead[sepKey(e.floor, xx, yy)]; i >= 0; i = sepNext[i]) {
        if (sepCX[i] !== xx || sepCY[i] !== yy) continue;
        const o = sepObj[i];
        if (o === e || !o.alive || o.floor !== e.floor) continue;
        const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy);
        if (od > 0 && od < .55) {
          A.move(F, e, ox / od * .02, oy / od * .02);
        }
      }
    }
  }
  function steer(F, e, tx, ty, spd, dt) {
    if (e.detour) {
      e.detour.t -= dt;
      if (e.detour.t <= 0 || Math.hypot(e.detour.x - e.x, e.detour.y - e.y) < .3) e.detour = null; else {
        tx = e.detour.x;
        ty = e.detour.y;
      }
    }
    const d = Math.hypot(tx - e.x, ty - e.y);
    if (spd > 0 && d > .3) e.goT = A.clock;
    let gx = tx, gy = ty;
    if (d > 1.2 && (!SX.light.los(F, e.x, e.y, tx, ty) || d < 7 && !walkLine(F, e.x, e.y, tx, ty, (e.r || R) * 1.02) || hazLine(F, e.x, e.y, tx, ty)) || e.blockedT > .25) {
      e.pathT -= dt;
      if (!e.path || e.pathT <= 0 || Math.hypot(e.path.tx - tx, e.path.ty - ty) > 1.5) {
        if (pfBusy()) {
          PF.skipped++;
          e.pathT = .05;
        } else {
          if (!e.pathB) Object.defineProperty(e, "pathB", {
            value: new Float32Array(CHAIN * 2),
            writable: true
          });
          const B = e.pathB;
          let n = flowOK(e) ? flowChain(F, e, tx, ty, B) : 0;
          if (!n && pathTo(F, e, tx, ty, 1800)) {
            n = chainN;
            B.set(chainBuf.subarray(0, n * 2));
          }
          let none = false;
          if (!n) {
            const same = Math.floor(e.x) === Math.floor(tx) && Math.floor(e.y) === Math.floor(ty);
            const pf = same ? [] : pathFull(F, e, tx, ty);
            if (pf && pf.length) {
              n = Math.min(CHAIN, pf.length);
              for (let k = 0; k < n; k++) {
                B[2 * k] = pf[k][0];
                B[2 * k + 1] = pf[k][1];
              }
            } else none = !pf;
          }
          e.noPathN = none ? (e.noPathN || 0) + 1 : 0;
          e.path = n ? {
            n,
            k: 0,
            aim: -1,
            tx,
            ty
          } : null;
          e.pathT = .35 + Math.random() * .2;
        }
      }
      if (e.path && pathAim(F, e, e.path)) {
        gx = ptX;
        gy = ptY;
      }
    } else e.path = null;
    const dx = gx - e.x, dy = gy - e.y, l = Math.hypot(dx, dy) || 1;
    const vx = dx / l * spd * dt, vy = dy / l * spd * dt;
    if (e.doorSkill) {
      const nx = Math.floor(e.x + dx / l * .7), ny = Math.floor(e.y + dy / l * .7);
      if (F.tile(nx, ny) === T.DOOR) {
        const dd = F.doorAt.get(F.i(nx, ny));
        if (dd && !dd.open && (!dd.locked || e.variant === "brute" && !dd.key && !dd.fireShut)) {
          if (dd.locked) {
            dd.locked = false;
            A.efx(e, "doorBash", {
              range: 24,
              vol: 1
            });
            A.bashShake(e);
          }
          SX.map.toggleDoor(F, dd, true);
          SX.audio.play("doorOpen", {
            x: e.x,
            y: e.y,
            f: e.floor,
            range: 16,
            vol: .6,
            mat: SX.doorPlace && SX.doorPlace.mat(F)
          });
        }
      }
    }
    const moved = A.move(F, e, vx, vy);
    e.blockedT = moved ? 0 : (e.blockedT || 0) + dt;
    if (moved) {
      e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, Math.atan2(dy, dx)), Math.min(1, dt * 8));
      e.walkT += dt * spd * 1.7;
    }
    sepPush(F, e);
    return moved;
  }
  A.bashShake = function(e) {
    const p = A.player;
    if (p && p.alive && p.floor === e.floor && Math.hypot(p.x - e.x, p.y - e.y) < 24) SX.view.shake(1.5);
  };
  A.knockBack = function(F, p, ka, dist) {
    for (let s = 0; s < 6; s++) A.move(F, p, Math.cos(ka) * dist / 6, Math.sin(ka) * dist / 6);
    SX.view.shake(5);
  };
  A.enemyHurt = function(F, e, T2, dmg, head) {
    if (T2.evs) {
      if (SX.ev) SX.ev.hurt(T2.evs, dmg, e);
      return;
    }
    if (T2.misK) {
      if (SX.mis) SX.mis.hurt(T2.mis, dmg, e);
      return;
    }
    if (T2.foe) {
      A.damageEnemy(F, T2.foe, dmg, Math.atan2(T2.foe.y - e.y, T2.foe.x - e.x), e, head);
      return;
    }
    const src = e.spar ? (e.name || "상대") + "의 주먹에 맞았습니다" : e.variant === "dog" ? "들개에게 물렸습니다" : e.variant === "brute" ? "덩치 감염체에게 짓눌렸습니다" : e.variant === "hazmat" ? "방호복 감염체에게 당했습니다" : e.type === "zombie" ? "감염체에게 당했습니다" : head ? "약탈자의 헤드샷에 당했습니다" : e.armed ? "약탈자의 총에 맞았습니다" : "약탈자의 둔기에 맞았습니다";
    if (T2.peer != null) {
      if (SX.coop) SX.coop.hurtPeer(T2.peer, dmg, src, head, Math.atan2(T2.y - e.y, T2.x - e.x), false, "melee", e.type === "zombie" ? e.variant === "dog" || e.variant === "brute" || e.variant === "hazmat" ? e.variant : "zombie" : "raider", e.nid);
      return;
    }
    A._hitBy = e;
    try {
      A.hurtPlayer(dmg, src, head, Math.atan2(A.player.y - e.y, A.player.x - e.x), "melee", null, {
        by: e,
        r: Math.hypot(A.player.x - e.x, A.player.y - e.y)
      });
    } finally {
      A._hitBy = null;
    }
  };
  A.damageEnemy = function(F, e, dmg, ang, by, crit, at, fx) {
    if (!e.alive) return;
    if (!e.type || dmg <= 0) return;
    if (e.spar) {
      const open = (e.recoverT || 0) > 0;
      if (!open) {
        crit = false;
        if (Math.random() < .9) {
          e.blockN = (e.blockN || 0) + 1;
          const p = A.player;
          p.st = Math.max(0, p.st - 6);
          A.float(F.idx, e.x, e.y - 1.4, "막음", "#8fd0ea");
          SX.audio.play("hitWall", {
            vol: .35
          });
          if (e.blockN >= 2 && e.windT == null) {
            e.blockN = 0;
            e.cool = 0;
            e.windT = .35;
            e.swing = .35;
            A.float(F.idx, e.x, e.y - 1.7, "!", "#ff6a5a");
          } else e.cool = Math.min(e.cool, .2);
          return;
        }
        dmg *= .5;
      } else e.blockN = 0;
      if (crit) dmg *= 2;
      e.hp -= dmg;
      e.flinch = .18;
      if (crit) A.float(F.idx, e.x, e.y - 1.4, "치명!", "#ffd26a");
      if (e.hp <= 0) {
        e.hp = 1;
        SX.hub.endFight(true);
      }
      return;
    }
    if (crit) {
      dmg = dmg * (by && (by.kind === "player" || by.kind === "peer" && !by.isAlly) ? 2.2 : 2);
      dmg *= e.helmet ? A.helmFactor(at) : A.fleshMul(at);
    }
    if ((e.variant === "hazmat" || (A.VARIANTS[e.variant] || NOV).half) && !crit) dmg *= .5;
    e.hp -= dmg;
    e.flinch = .18;
    const hx = A.hitFx(F, e, ang, crit, fx, at);
    if (!hx) {
      blood(F, e.x, e.y - .45, ang, crit ? 20 : 12, true);
      if (Math.random() < .35) A.decal(F, e.x + Math.cos(ang) * .6, e.y + Math.sin(ang) * .6, "blood");
    } else {
      if (e.hp > 0) knock(e, ang, hx);
      if (SX.coop && SX.coop.hfxOut) SX.coop.hfxOut(e, ang, crit, hx, fx.src);
    }
    const byEnemy = by && by.kind === "enemy";
    if (byEnemy) {
      A.infight.hits++;
      if (by.alive && e.hp > 0 && by.type !== e.type) {
        e.foe = by;
        e.fsT = .8;
        e.lureX = by.x;
        e.lureY = by.y;
        e.lureT = Math.max(e.lureT, 3);
      }
    } else if (by && (by.kind === "player" || by.kind === "ally" || by.kind === "peer")) {
      e.lureX = by.x;
      e.lureY = by.y;
      e.lureT = Math.max(e.lureT, 4);
      e.face = Math.atan2(by.y - e.y, by.x - e.x);
      e.hurtAt = A.clock;
      if (crit) A.float(F.idx, e.x, e.y - 1.4, "치명!", "#ffd26a");
      if (e.type === "scav" && e.barkT <= 0 && e.hp > 0) {
        e.barkT = 4;
        A.efx(e, "shout", {
          range: 20
        }, SX.rnd.pick([ "엄폐!", "맞았어!", "저쪽이다!" ]));
      }
    }
    if (e.hp <= 0) A.killEnemy(F, e, ang, byEnemy, crit, by);
  };
  A.deathTick = function(e) {
    if (e._thud || e.deathT < 1.05 || !(e.variant === "brute" || e.variant === "coach")) return;
    e._thud = 1;
    const p = A.player;
    if (e.deathT > 1.6 || !p || p.floor !== e.floor) return;
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d < 14) SX.view.shake(3.2 * (1 - d / 14) + .6);
  };
  A.killEnemy = function(F, e, ang, byEnemy, crit, by, given) {
    e.alive = false;
    e.dead = true;
    e.deathT = -.04;
    e.deathA = ang;
    SX.audio.play(e.variant === "dog" ? "dogWhimper" : e.type === "zombie" ? "groan" : "hurt", {
      x: e.x,
      y: e.y,
      range: 18,
      vol: .6,
      r: e.type === "zombie" ? .85 : .95
    });
    {
      const dk = SX.render && SX.render.deathKind ? SX.render.deathKind(e) : "zomb", FALL = {
        zomb: .75,
        brute: 1.05,
        crawl: .15,
        haz: .65,
        spin: .8,
        dog: .4,
        scav: .55,
        boss: 1.25
      };
      SX.audio.play("bodyFall", {
        x: e.x,
        y: e.y,
        range: dk === "brute" ? 22 : 14,
        vol: dk === "brute" ? 1 : dk === "dog" || dk === "crawl" ? .4 : .6,
        r: dk === "brute" ? .7 : 1,
        delay: FALL[dk] || .4
      });
    }
    const mine = !byEnemy && !(by && by.kind === "peer");
    if (byEnemy) A.infight.kills++; else if (mine) {
      SX.audio.play("hitFlesh");
      SX.game.stats.kills++;
      const gs = SX.game.stats;
      if (e.type === "zombie") gs.kZombie = (gs.kZombie || 0) + 1; else if (!e.boss) gs.kScav = (gs.kScav || 0) + 1;
      if (e.boss) {
        SX.game.stats.bossKills = (SX.game.stats.bossKills || 0) + 1;
        SX.log("☠ 약탈자 두목을 쓰러뜨렸습니다!", "good");
      } else if (e.named) {
        gs.named = (gs.named || 0) + 1;
        SX.log("☠ " + e.name + " 을(를) 쓰러뜨렸습니다! — 시신을 뒤져 보십시오", "good");
      } else SX.log(e.vname ? e.vname + " 사살" + (e.variant === "dog" ? "" : " — 시신을 뒤져 보십시오") : e.type === "zombie" ? "감염체 사살 — [" + SX.label("interact") + "] 뒤지기" : "약탈자 사살 — 시신을 뒤져 보십시오");
      {
        const lb = SX.raid && SX.raid.level && SX.raid.level.building;
        if (lb && !lb.train && SX.feats && SX.feats.foe) SX.feats.foe(SX.game.save, e);
      }
      if (SX.ui && SX.ui.liveBump) SX.ui.liveBump();
    }
    if (e.boss && !mine && !byEnemy) SX.log("☠ 약탈자 두목이 쓰러졌습니다", "good");
    if (e.named && !mine) SX.log("☠ " + e.name + " 이(가) 쓰러졌습니다", "good");
    blood(F, e.x, e.y - .3, ang, 16);
    A.decal(F, e.x, e.y, "blood", true);
    const items = given || I.enemyDrop(SX.game.rng, e, SX.game.lootCtx(e.floor), crit);
    const tx = SX.clamp(Math.floor(e.x), 0, F.W - 1), ty = SX.clamp(Math.floor(e.y), 0, F.H - 1);
    const p = SX.map.addProp(F, "corpse", tx, ty, {
      v: e.type === "zombie" ? 5 : (e.spec.top.length + tx) % 4,
      solid: false,
      cont: SX.map.mkCont("corpse", items)
    });
    if (p) {
      p.px = e.x - .5;
      p.py = e.y - .5;
      p.flipX = Math.cos(ang) < 0;
      p.body = e;
    }
    if (p && e.nid != null && SX.raid.reg) {
      SX.raid.reg(p.cont, "e" + e.nid);
      SX.raid.addExtra({
        key: "e" + e.nid,
        f: F.idx,
        kind: "corpse",
        type: "corpse",
        x: tx,
        y: ty,
        v: p.v,
        px: p.px,
        py: p.py,
        flipX: p.flipX,
        name: p.cont.name,
        body: "e" + e.nid
      });
    }
    if (SX.coop) SX.coop.enemyDied(e, ang, byEnemy, crit, by, items);
    if (e.type === "zombie" && Math.random() < .5) SX.audio.play("groan", {
      x: e.x,
      y: e.y,
      f: e.floor,
      range: 16,
      vol: .5
    });
  };
  A.ATTACK_MAX = 3;
  A.clock = 0;
  const slots = new Map;
  let slotT = 0;
  const wantsSlot = (e, T) => e.alive && e.ai === "chase" && e.wantT === T;
  const holdsSlot = (e, T) => e.alive && e.slotFor === T && (wantsSlot(e, T) || A.clock - (e.slotSeen == null ? -99 : e.slotSeen) < 1.5);
  function slotScore(e, T) {
    const d = Math.hypot(T.x - e.x, T.y - e.y);
    return d - (A.clock - (e.hurtAt == null ? -99 : e.hurtAt) < 3 ? 8 : 0) - (e.boss ? 3 : 0);
  }
  const urgent = (e, T) => A.clock - (e.hurtAt == null ? -99 : e.hurtAt) < 3 || Math.hypot(T.x - e.x, T.y - e.y) < 3.5;
  function reslot() {
    const by = new Map;
    for (const e of A.enemies) if (e.alive && e.ai === "chase" && e.wantT) {
      let l = by.get(e.wantT);
      if (!l) by.set(e.wantT, l = []);
      l.push(e);
    }
    for (const [T, s] of slots) {
      const keep = [ ...s ].filter(e => holdsSlot(e, T));
      if (!keep.length && !by.has(T)) slots.delete(T); else if (!by.has(T)) by.set(T, []);
    }
    for (const [T, list] of by) {
      const old = slots.get(T) || new Set, sc = (u, v) => slotScore(u, T) - slotScore(v, T);
      const next = [ ...old ].filter(e => holdsSlot(e, T)).sort(sc).slice(0, A.ATTACK_MAX);
      for (const w of list.filter(e => !next.includes(e)).sort(sc)) {
        if (next.length < A.ATTACK_MAX) {
          next.push(w);
          continue;
        }
        if (!urgent(w, T)) continue;
        for (let i = next.length - 1; i >= 0; i--) if (!urgent(next[i], T)) {
          next.splice(i, 1);
          next.push(w);
          break;
        }
      }
      for (const e of old) if (!next.includes(e) && e.slotFor === T) e.slotFor = null;
      for (const e of next) {
        if (!old.has(e)) slotIn(e);
        e.slotFor = T;
        if (wantsSlot(e, T)) e.slotSeen = A.clock;
      }
      slots.set(T, new Set(next));
    }
  }
  function hasSlot(e, T) {
    let s = slots.get(T);
    if (!s) slots.set(T, s = new Set);
    if (s.has(e)) {
      e.slotFor = T;
      e.slotSeen = A.clock;
      return true;
    }
    for (const q of s) if (!holdsSlot(q, T)) s.delete(q);
    if (s.size < A.ATTACK_MAX) {
      s.add(e);
      slotIn(e);
      e.slotFor = T;
      e.slotSeen = A.clock;
      return true;
    }
    return false;
  }
  function slotIn(e) {
    if (!e.spar && !(A.clock - (e.hurtAt == null ? -99 : e.hurtAt) < 3)) e.cool = Math.max(e.cool || 0, 1);
  }
  A.resetSlots = () => slots.clear();
  A.slotHolders = T => {
    T = T || playerTarget();
    return [ ...slots.get(T) || [] ].filter(e => holdsSlot(e, T));
  };
  function holdBack(F, e, Tg, dx, dy, dist, dt) {
    const lo = e.melee2 ? 4 : 11, hi = e.melee2 ? 6.5 : 16, l = dist || 1;
    if (dist > hi) steer(F, e, Tg.x, Tg.y, e.melee2 ? e.crawler ? 1 : 1.8 : 2, dt); else {
      e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, Math.atan2(dy, dx)), Math.min(1, dt * 6));
      if (dist < lo) {
        if (A.move(F, e, -dx / l * 1.4 * dt, -dy / l * 1.4 * dt)) e.walkT += dt * 1.5;
      } else if (Math.random() < dt * .5) {
        const s = Math.random() < .5 ? 1 : -1;
        if (A.move(F, e, -dy / l * s * .35, dx / l * s * .35)) e.walkT += .3;
      }
    }
    if (e.type === "scav" && Math.random() < dt * .06) barkMaybe(e, [ "엄호한다!", "들어갈 틈 본다!", "포위해!" ], 1);
  }
  function barkMaybe(e, list, p) {
    if (e.barkT <= 0 && Math.random() < (p || 1)) {
      e.barkT = 5 + Math.random() * 4;
      A.efx(e, e.variant === "dog" ? "dogBark" : e.type === "zombie" ? "groan" : "shout", {
        range: e.variant === "dog" ? 30 : 22,
        vol: .7
      }, SX.rnd.pick(list));
    }
  }
  A.SUS_T = [ 3.5, 7 ];
  A.SUS_BOSS = 1.6;
  const SUS_MARK = "#ffd36a";
  A.suspect = function(e, quiet) {
    e.ai = "search";
    e.calmT = 0;
    e.noPathN = 0;
    e.path = null;
    e.susP = null;
    e.susW = 0;
    e.susFail = 0;
    e.susMark = 0;
    e.susT = (A.SUS_T[0] + Math.random() * (A.SUS_T[1] - A.SUS_T[0])) * (e.boss || e.named ? A.SUS_BOSS : 1);
    if (quiet) return;
    const b0 = e.barkT;
    if (e.type === "scav") barkMaybe(e, [ "어디 갔어?", "숨었냐?", "거기 있는 거 안다" ], .7);
    if (e.barkT === b0) A.efx(e, null, null, "?", SUS_MARK);
  };
  function susSpot(F, e) {
    const cx = e.seenX, cy = e.seenY;
    if (cx == null) return null;
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2.5, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (F.in(Math.floor(x), Math.floor(y)) && A.free(F, x, y) && SX.light.los(F, cx, cy - .4, x, y - .4)) return [ x, y ];
    }
    return null;
  }
  function brain(F, e, dt, env) {
    if (e.throwT > 0) e.throwT -= dt;
    if (SX.chem && SX.chem.held(e)) return;
    if (SX.tac && (e.stunT > 0 || e.gasT > 0) && SX.tac.dazed(F, e, dt)) return;
    const night = env.night && !(SX.wx && SX.wx.flashOut(F, e.x, e.y)), V = A.VARIANTS[e.variant] || NOV;
    e.laser = false;
    const range = (e.melee2 ? 16 : 22) * (e.ai === "chase" ? 1.25 : 1) * (night ? V.night || .62 : 1) * (SX.bdev && SX.bdev.seeK ? SX.bdev.seeK(F) : 1);
    const zEye = e.type === "zombie", cut = zEye ? A.EYE_Z : e.ai === "alert" || e.ai === "search" ? A.EYE_ALERT : A.EYE_H, near = zEye ? A.NEAR_Z : A.NEAR_H;
    let P = e.pT && e.pT.alive && e.pT.floor === e.floor ? e.pT : playerTarget();
    let pd = P.floor === e.floor ? Math.hypot(P.x - e.x, P.y - e.y) : 1e9;
    e.fsT -= dt;
    if (e.fsT <= 0) {
      e.fsT = .35 + Math.random() * .15;
      let best = null, bd = 1e9;
      for (const c of playerTargets()) {
        if (!c.alive || c.floor !== e.floor) continue;
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d < bd && seeParts(F, e, c, range * c.stealth, cut, near, night) > 0) {
          best = c;
          bd = d;
        }
      }
      P = best || playerTarget();
      e.pT = best;
      pd = P.floor === e.floor ? Math.hypot(P.x - e.x, P.y - e.y) : 1e9;
      e.foe = scanFoe(F, e, P, pd, range, cut, near, night);
    }
    let Tg = P;
    if (e.foe && hostile(e, e.foe)) {
      const fd = Math.hypot(e.foe.x - e.x, e.foe.y - e.y);
      if (!(e.seesP && pd < fd + 4)) Tg = foeTarget(e.foe);
    } else e.foe = null;
    if (e.leash && !Tg.foe) {
      const far = pd > e.leash.give || Math.hypot(P.x - e.leash.x, P.y - e.leash.y) > e.leash.r;
      if (far) {
        e.seesP = false;
        if (e.ai !== "wander") {
          e.ai = "wander";
          e.calmT = 0;
          e.lureT = 0;
          e.seenX = null;
          e.seenY = null;
          e.pT = null;
        }
      }
    }
    const dx = Tg.x - e.x, dy = Tg.y - e.y, dist = Math.hypot(dx, dy);
    const sees = Tg.foe ? true : aware(F, e, P, e.seesP, range, night, dt);
    e.cool -= dt;
    e.barkT -= dt;
    if (e.lureT > 0) e.lureT -= dt;
    if (sees && (Tg.foe || P.alive)) {
      if (e.ai !== "chase" && !Tg.foe) {
        if (e.type === "scav") barkMaybe(e, [ "저기다!", "누구냐!", "살아있는 놈이다!" ], .8); else barkMaybe(e, [ "으어어…" ], .6);
      }
      if (e.ai !== "chase" && !Tg.foe && SX.mis && SX.mis.spotted) SX.mis.spotted(e, P);
      if (e.ai !== "chase") e.chaseAt = A.clock;
      e.ai = "chase";
      e.calmT = 0;
      e.seenX = Tg.x;
      e.seenY = Tg.y;
      e.lureT = 0;
      e.noPathN = 0;
      e.susT = 0;
    } else {
      if (e.ai === "chase") A.suspect(e);
      if (e.lureT > 0 && e.ai !== "search") {
        e.ai = "alert";
        e.calmT = 0;
      }
      if (e.ai === "alert" && e.lureT <= 0) {
        e.ai = "search";
        if (e.seenX == null) {
          e.seenX = e.lureX;
          e.seenY = e.lureY;
        }
      }
      if (e.ai === "search" && e.susT > 0) {
        if (e.lureT > 0) {
          e.susP = [ e.lureX, e.lureY ];
          e.susW = 0;
          e.noPathN = 0;
          e.susT = Math.max(e.susT, 2.5);
          e.lureT = 0;
        }
        e.susT -= dt;
        if (e.susT <= 0) {
          e.susT = 0;
          e.ai = "wander";
          e.calmT = 0;
          e.seenX = e.seenY = null;
          e.susP = null;
          e.path = null;
          if (e.type === "scav") barkMaybe(e, [ "잘못 봤나…", "에이, 없네" ], .5);
        }
      } else if (e.ai !== "wander") {
        e.calmT += dt;
        if (e.calmT > 3.5) {
          e.ai = "wander";
          e.calmT = 0;
        }
      }
    }
    e.sprinting = false;
    e.wantT = e.ai === "chase" && !Tg.foe ? Tg : null;
    e.waiting = !!e.wantT && !hasSlot(e, e.wantT);
    if (e.ai === "chase" && e.waiting) holdBack(F, e, Tg, dx, dy, dist, dt); else if (e.ai === "chase") {
      if (e.melee2) {
        if (e.spar && e.windT != null) {
          e.face = Math.atan2(dy, dx);
        } else if (dist > .95) {
          e.sprinting = dist < (V.sprintAt || 7) && !e.crawler;
          const base = (V.speed || (e.type === "zombie" ? 2.4 : 2.9)) * (e.sprinting ? 1.6 : 1) * (e.crawler ? .45 : 1);
          steer(F, e, Tg.x, Tg.y, base, dt);
        } else {
          e.face = Math.atan2(dy, dx);
          if (e.spar) {
            if (e.cool <= 0 && e.windT == null) {
              e.windT = .5;
              e.swing = .5;
              A.float(F.idx, e.x, e.y - 1.7, "!", "#ff6a5a");
            }
          } else if (e.cool <= 0 && !(e.type === "scav" && SX.game.state === "raid" && SX.raid.flood && SX.raid.wLvOf(e.floor) >= 4)) {
            const MK = e.type === "scav" && e.melee && SX.melee ? SX.melee.start(e, e.melee, e.face, "enemy") : null, MA = MK ? SX.melee.ai(e.melee) : null;
            if (!MK) {
              e.swing = .35;
              e.punchN = (e.punchN | 0) + 1;
            }
            e.cool = (V.cool != null ? V.cool : (e.type === "zombie" ? .55 : .4) + .55) * (MA ? MA.cool : 1);
            const dmg = (V.dmg || (e.type === "zombie" ? 12 : e.meleeDmg || 16)) * (MA ? MA.dmg : 1);
            const tgt = Tg;
            setTimeout(() => {
              if (!e.alive || !tgt.alive || !(SX.game.inRaid() || SX.hub && SX.hub.fight)) return;
              if (Math.hypot(tgt.x - e.x, tgt.y - e.y) < 1.35 && SX.light.los(F, e.x, e.y - .4, tgt.x, tgt.y - .4)) {
                A.enemyHurt(F, e, tgt, dmg, false);
                if (V.knock && tgt.player && tgt.peer != null) {
                  if (SX.coop && SX.coop.knock) SX.coop.knock(tgt.peer, Math.atan2(tgt.y - e.y, tgt.x - e.x), V.knock);
                } else if (V.knock && tgt.player && A.player && A.player.alive) {
                  const p = A.player;
                  A.knockBack(F, p, Math.atan2(p.y - e.y, p.x - e.x), V.knock);
                }
              }
            }, (MK ? Math.round(MK.hitT * 1e3 / (SX.PACE || 1)) : 230) + (tgt.peer != null && SX.coop && SX.coop.victimDelay ? Math.round(SX.coop.victimDelay(tgt.peer) * 1e3) : 0));
            A.efx(e, MK ? MK.snd : e.variant === "dog" ? "dogGrowl" : e.type === "zombie" ? "groan" : "melee", {
              range: 12,
              vol: e.variant === "dog" ? .6 : MK ? .5 : .4
            });
          }
        }
      } else {
        if (V.keep) {
          const kp = A.sniperKeep(Tg);
          if (dist > kp[1]) steer(F, e, Tg.x, Tg.y, 2.2, dt); else {
            e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, Math.atan2(dy, dx)), Math.min(1, dt * 6));
            if (dist < kp[0]) {
              const l = dist || 1;
              if (A.move(F, e, -dx / l * 1.9 * dt, -dy / l * 1.9 * dt)) e.walkT += dt * 2;
            }
          }
        } else if (dist > 9) steer(F, e, Tg.x, Tg.y, 2.4, dt); else {
          e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, Math.atan2(dy, dx)), Math.min(1, dt * 10));
          if (dist < 4.5) {
            const l = dist || 1;
            if (A.move(F, e, -dx / l * 1.5 * dt, -dy / l * 1.5 * dt)) e.walkT += dt * 2;
          } else if (Math.random() < dt * .6) {
            const s = Math.random() < .5 ? 1 : -1;
            A.move(F, e, -dy / dist * s * .4, dx / dist * s * .4);
          }
        }
        if (e.cool <= 0 && !(SX.raid.flood && SX.raid.wLvOf(e.floor) >= 4)) {
          const gd = SX.items.def(e.gun), fp = EFIRE[gd && gd.cls || "pistol"] || EFIRE.pistol;
          const see = SX.light.los(F, e.x, e.y - .1, Tg.x, Tg.y - .1) && A.bulletClear(F, e.x, e.y - .1, Tg.x, Tg.y - .1) && !(SX.tac && SX.tac.smokeBlocks(F, e.x, e.y - .55, Tg.x, Tg.y - .55)) && !propHid(F, e, Tg);
          if (see && dist < fp.range && A.inViewBox(Tg, e)) {
            if (e.variant === "sniper") {
              e.aimT = e.aimT == null ? 1 : e.aimT - dt;
              e.laser = true;
              e.aimA = Math.atan2(Tg.y - e.y, Tg.x - e.x);
              e.face = e.aimA;
              if (e.aimT > 0) return;
              e.aimT = null;
            }
            e.burst = (e.burst || 0) + 1;
            if (e.burst >= fp.burst) {
              e.burst = 0;
              e.cool = fp.cd * (1 + Math.random() * .5);
            } else e.cool = fp.gap;
            const acc = Math.max(.28, .85 - dist * .03 + fp.acc);
            const a = Math.atan2(Tg.y - e.y, Tg.x - e.x) + (Math.random() - .5) * (1 - acc) * .5;
            const mx = e.x + Math.cos(a) * .6, my = e.y - .55 + Math.sin(a) * .6;
            const aimD = Math.hypot(Tg.x - mx, Tg.y - .55 - my);
            const angs = [], eat = A.enemyAmmo(e);
            for (let k = 0; k < (fp.pellets || 1); k++) {
              const pa = a + (fp.pellets ? (Math.random() - .5) * .22 : 0), dm = fp.dmg * (.85 + Math.random() * .3);
              A.shoot(F, e, mx, my, pa, dm, null, {
                range: fp.range + 6,
                aimD,
                vel: A.gunVel(gd),
                cal: gd ? gd.caliber : "9mm",
                at: eat
              });
              angs.push(pa);
            }
            const sup = !!(gd && gd.quiet) || (e.gunMods || []).some(n => n.indexOf("소음기") >= 0);
            if (SX.coop) SX.coop.enemyShot(F, e, mx, my, angs, fp.range + 6, sup);
            e.kick = 1;
            e.muzzleT = sup ? .03 : .06;
            SX.audio.play(A.gunSound(gd, sup), {
              x: e.x,
              y: e.y,
              f: e.floor,
              range: sup ? 14 : 40,
              vol: sup ? .7 : .8,
              verb: !!F.inside[F.i(Math.floor(e.x), Math.floor(e.y))]
            });
            SX.light.flash(F.idx, mx, my, sup ? 1.5 : 4.5, [ 255, 200, 120 ], .07);
            A.part({
              floor: F.idx,
              x: e.x,
              y: e.y - .1,
              z: .8,
              vx: (Math.random() - .5) * 4,
              vy: (Math.random() - .5) * 4,
              vz: 2,
              g: 10,
              c: "#d8b24a",
              t: .4,
              life: .4,
              stick: "casing"
            });
            for (const z of A.enemies) if (z.alive && z.type === "zombie" && z.floor === e.floor && (z.x - e.x) ** 2 + (z.y - e.y) ** 2 < (sup ? 49 : 324)) {
              z.lureX = e.x;
              z.lureY = e.y;
              z.lureT = Math.max(z.lureT, 4);
            }
            if (Math.random() < .12 && !Tg.foe) barkMaybe(e, [ "엄폐해!", "장전 중!", "왼쪽으로 돌아!" ], 1);
            if (!Tg.foe && Math.random() < .05 && dist > 5 && dist < 12 && !e.threw) {
              e.threw = true;
              e.throwT = .3;
              A.say(e, "수류탄!", "#ff9a6a");
              A.nades.push({
                floor: F.idx,
                x: e.x,
                y: e.y - .3,
                z: 1,
                vx: dx * 1.05,
                vy: dy * 1.05,
                vz: 3.4,
                fuse: 2.6,
                from: e,
                dmg: 70,
                radius: 3
              });
              if (SX.coop) SX.coop.nade(A.nades[A.nades.length - 1]);
            }
          } else {
            e.cool = .3;
            e.aimT = null;
          }
        }
      }
    } else if (e.awLook) {
      e.face += SX.angDiff(e.face, Math.atan2(dy, dx)) * Math.min(1, dt * 5);
    } else if (e.ai === "alert" || e.ai === "search") {
      const sus = e.ai === "search" && e.susT > 0;
      let tx = e.ai === "alert" ? e.lureX : e.seenX, ty = e.ai === "alert" ? e.lureY : e.seenY;
      if (sus && e.susP) {
        tx = e.susP[0];
        ty = e.susP[1];
      }
      if (sus && !(e.awShow > 0) && (e.susMark = (e.susMark || 0) + dt) > 3) {
        e.susMark = 0;
        A.efx(e, null, null, "?", SUS_MARK);
      }
      if (e.reactT > 0) e.reactT -= dt; else if (tx == null) e.ai = "wander"; else if ((e.noPathN || 0) >= 3) {
        if (sus && (e.susFail = (e.susFail || 0) + 1) < 4) {
          e.noPathN = 0;
          e.path = null;
          e.susP = susSpot(F, e);
        } else {
          e.ai = "wander";
          e.lureT = 0;
          e.seenX = e.seenY = null;
          e.noPathN = 0;
          e.path = null;
          e.susT = 0;
          e.susP = null;
        }
      } else if (Math.hypot(tx - e.x, ty - e.y) > 1) steer(F, e, tx, ty, sus ? e.crawler ? 1 : 1.9 : e.crawler ? 1.2 : 2.8, dt); else {
        e.scan = (e.scan || 0) + dt * 1.7;
        e.face += Math.sin(e.scan) * dt * 1.6;
        if (sus && (e.susW = (e.susW || 0) + dt) > 1.6) {
          e.susW = 0;
          e.susP = susSpot(F, e);
        }
      }
    } else if (e.patrol && patrolStep(F, e, dt)) {} else {
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 2 + Math.random() * 3;
        const a = e.face + (Math.random() - .5) * 2.4;
        e.wx = Math.cos(a);
        e.wy = Math.sin(a);
        if (Math.random() < .3) {
          e.wx = 0;
          e.wy = 0;
        }
      }
      if (e.wx || e.wy) {
        if (!A.move(F, e, e.wx * .6 * dt, e.wy * .6 * dt)) e.wanderT = 0; else {
          e.face = Math.atan2(e.wy, e.wx);
          e.walkT += dt;
        }
      }
      if (e.type === "zombie" && Math.random() < dt * .02) A.efx(e, "groan", {
        range: 14,
        vol: .35
      });
    }
  }
  function hazLine(F, x0, y0, x1, y1) {
    const FA = F.fireAt, OA = F.oilAt;
    if (!FA && !OA) return false;
    const s0 = Math.floor(y0) * F.W + Math.floor(x0), g0 = Math.floor(y1) * F.W + Math.floor(x1), n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .25));
    for (let k = 1; k < n; k++) {
      const t = k / n, x = Math.floor(x0 + (x1 - x0) * t), y = Math.floor(y0 + (y1 - y0) * t);
      if (!F.in(x, y)) continue;
      const i = y * F.W + x;
      if (i === s0 || i === g0) continue;
      if (FA && FA[i] || OA && OA[i]) return true;
    }
    return false;
  }
  function walkLine(F, x0, y0, x1, y1, r) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / .2));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (hitsAt(F, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r)) return false;
    }
    return true;
  }
  A.walkLine = (F, x0, y0, x1, y1, r) => walkLine(F, x0, y0, x1, y1, r || R);
  A.steer = steer;
  function pathFull(F, e, tx, ty) {
    const W = F.W, N = F.W * F.H;
    const sx = Math.floor(e.x), sy = Math.floor(e.y), gx = Math.floor(tx), gy = Math.floor(ty);
    if (!F.in(sx, sy) || !F.in(gx, gy)) return null;
    const start = sy * W + sx, goal = gy * W + gx, t0 = performance.now();
    PF.calls++;
    if (!reachOK(F, !!e.doorSkill, sx, sy, gx, gy)) {
      PF.unreach++;
      PF.ms += performance.now() - t0;
      return null;
    }
    pfBuf(N);
    const g = (e.r || R) <= GAP_R ? gapState(F) : null;
    if (!bfsRun(F, e, start, goal, Infinity, g)) {
      PF.ms += performance.now() - t0;
      return null;
    }
    const n = bfsChain(F, start, goal, g, N, pfPts), Q = pfPts;
    const out = [];
    let lx = e.x, ly = e.y;
    for (let k = 0; k < n; k++) {
      const last = k + 1 >= n;
      if (last || !SX.light.los(F, lx, ly, Q[2 * k + 2], Q[2 * k + 3]) || !walkLine(F, lx, ly, Q[2 * k + 2], Q[2 * k + 3], (e.r || R) * 1.08) || hazLine(F, lx, ly, Q[2 * k + 2], Q[2 * k + 3])) {
        out.push([ Q[2 * k], Q[2 * k + 1] ]);
        lx = Q[2 * k];
        ly = Q[2 * k + 1];
      }
    }
    PF.ms += performance.now() - t0;
    return out;
  }
  function walkPath(F, e, P, spd, dt) {
    const q = P.path[P.pk];
    if (!q) return true;
    e.goT = A.clock;
    if (Math.hypot(q[0] - e.x, q[1] - e.y) < .35) {
      P.pk++;
      return P.pk >= P.path.length;
    }
    let gx = q[0], gy = q[1];
    if ((P.stuckT || 0) > .25) P.cellT = 1;
    if (P.cellT > 0) {
      P.cellT -= dt;
      const c = pathTo(F, e, q[0], q[1], 900);
      if (c) {
        gx = c.x;
        gy = c.y;
      }
    }
    const dx = gx - e.x, dy = gy - e.y, l = Math.hypot(dx, dy) || 1;
    const nx = Math.floor(e.x + dx / l * .7), ny = Math.floor(e.y + dy / l * .7);
    if (F.tile(nx, ny) === T.DOOR) {
      const dd = F.doorAt.get(F.i(nx, ny));
      if (dd && !dd.open && (!dd.locked || e.variant === "brute" && !dd.key && !dd.fireShut)) {
        if (dd.locked) {
          dd.locked = false;
          A.efx(e, "doorBash", {
            range: 24,
            vol: 1
          });
          A.bashShake(e);
        }
        SX.map.toggleDoor(F, dd, true);
        SX.audio.play("doorOpen", {
          x: e.x,
          y: e.y,
          f: e.floor,
          range: 16,
          vol: .6,
          mat: SX.doorPlace && SX.doorPlace.mat(F)
        });
      }
    }
    const ox = e.x, oy = e.y;
    A.move(F, e, dx / l * spd * dt, dy / l * spd * dt);
    const got = Math.hypot(e.x - ox, e.y - oy);
    P.stuckT = got < spd * dt * .3 ? (P.stuckT || 0) + dt : 0;
    if (got > 0) {
      e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, Math.atan2(dy, dx)), Math.min(1, dt * 8));
      e.walkT += dt * spd * 1.7;
    }
    for (const o of A.enemies) {
      if (o === e || !o.alive || o.floor !== e.floor) continue;
      const ox2 = e.x - o.x, oy2 = e.y - o.y, od = Math.hypot(ox2, oy2);
      if (od > 0 && od < .55) A.move(F, e, ox2 / od * .02, oy2 / od * .02);
    }
    return false;
  }
  function patrolStep(F, e, dt) {
    const P = e.patrol;
    if (P.lead && !P.lead.alive) P.lead = null;
    let tx, ty;
    if (P.lead) {
      const L = P.lead, back = L.face + Math.PI;
      tx = L.x + Math.cos(back) * 1.1 * P.row + Math.cos(back + Math.PI / 2) * .7 * P.side;
      ty = L.y + Math.sin(back) * 1.1 * P.row + Math.sin(back + Math.PI / 2) * .7 * P.side;
      if (hitsAt(F, tx, ty, e.r || R)) {
        const s = nearFree(F, tx, ty, e.r || R, .2, 1.2);
        if (s) {
          tx = s.x;
          ty = s.y;
        }
      }
      const gap = Math.hypot(tx - e.x, ty - e.y);
      if (gap < .45 || gap < 1.4 && (e.blockedT || 0) > .6) {
        e.face = SX.lerp(e.face, e.face + SX.angDiff(e.face, L.face), Math.min(1, dt * 4));
        if (gap >= .45) e.blockedT = Math.max(0, e.blockedT - dt);
        return true;
      }
      if (gap > 6) {
        P.reT = (P.reT || 0) - dt;
        if (!P.path || P.reT <= 0) {
          P.path = pathFull(F, e, tx, ty);
          P.pk = 0;
          P.reT = 2;
          if (!P.path) {
            P.lead = null;
            P.pathFor = -1;
            return true;
          }
        }
        if (P.path) {
          walkPath(F, e, P, 2.6, dt);
          return true;
        }
      }
      P.path = null;
      steer(F, e, tx, ty, gap > 3 ? 2.4 : 1.6, dt);
      if ((e.noPathN || 0) >= 3) {
        P.lead = null;
        P.pathFor = -1;
        e.noPathN = 0;
      }
      return true;
    }
    if (P.waitT > 0) {
      P.waitT -= dt;
      e.scan = (e.scan || 0) + dt * 1.4;
      e.face += Math.sin(e.scan) * dt * 1.4;
      return true;
    }
    const next = () => {
      P.i = (P.i + 1) % P.route.length;
      P.path = null;
    };
    const w = P.route[P.i];
    if (Math.hypot(w[0] - e.x, w[1] - e.y) < 1.2) {
      next();
      P.waitT = 1.5 + Math.random() * 3;
      return true;
    }
    if (!P.path || P.pathFor !== P.i) {
      P.path = pathFull(F, e, w[0], w[1]);
      P.pk = 0;
      P.pathFor = P.i;
      P.stuckT = 0;
      if (!P.path) {
        next();
        P.waitT = .5;
        return true;
      }
    }
    if (walkPath(F, e, P, 1.5, dt)) {
      next();
      P.waitT = 1.5 + Math.random() * 3;
    } else if (P.stuckT > 1.5) {
      P.path = null;
      P.pathFor = -1;
    }
    return true;
  }
  A.unstuck = 0;
  A.unstuckWhy = {
    embed: 0,
    crowd: 0,
    geo: 0
  };
  function nearFree(F, x, y, r, minD, maxD) {
    for (let rad = Math.max(.2, minD || 0); rad <= (maxD || 3) + 1e-6; rad += .2) {
      const n = Math.max(8, Math.round(rad * 14)), a0 = Math.random() * 6.283;
      for (let k = 0; k < n; k++) {
        const a = a0 + k / n * 6.283, px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad, t = F.tile(Math.floor(px), Math.floor(py));
        if ((t === T.FLOOR || t === T.GROUND || t === T.STAIR) && !hitsAt(F, px, py, r)) return {
          x: px,
          y: py
        };
      }
    }
    return null;
  }
  A.nearFree = (F, x, y, r, minD, maxD) => nearFree(F, x, y, r || R, minD, maxD);
  function unstick(F, e, dt) {
    if (!e.alive || e.spar || e.dead || A.UNSTICK === false) return;
    const r = e.r || R;
    if (hitsAt(F, e.x, e.y, r)) {
      const h = e.hist && e.hist.length ? e.hist[e.hist.length - 1] : null;
      const s = h && Math.hypot(h.x - e.x, h.y - e.y) < 1.5 && !hitsAt(F, h.x, h.y, r) ? h : nearFree(F, e.x, e.y, r, .2, 2);
      if (s) {
        e.x = s.x;
        e.y = s.y;
        e.path = null;
        e.pathT = 0;
        A.unstuck++;
        A.unstuckWhy.embed++;
      }
      return;
    }
    const hist = e.hist || (e.hist = []);
    e.histT = (e.histT || 0) - dt;
    if (e.histT <= 0) {
      e.histT = .5;
      const last = hist[hist.length - 1];
      if (!last || Math.hypot(last.x - e.x, last.y - e.y) > .3) {
        hist.push({
          x: e.x,
          y: e.y
        });
        if (hist.length > 6) hist.shift();
      }
    }
    const wants = e.goT != null && A.clock - e.goT < .35 + (e.farTick ? .6 : 0);
    if (!wants || e.anchorX == null || Math.hypot(e.x - e.anchorX, e.y - e.anchorY) > .35) {
      e.anchorX = e.x;
      e.anchorY = e.y;
      e.stuckT = 0;
      e.stuckK = 0;
      return;
    }
    e.stuckT = (e.stuckT || 0) + dt;
    if (e.stuckT < 5) {
      const sk = e.stuckK || 0;
      if (e.stuckT >= 3 && sk < 3) {
        e.stuckK = 3;
        for (let k = 0; k < 6 && !e.detour; k++) {
          const side = nearFree(F, e.x, e.y, r, .8 + k * .1, 1.8);
          if (side && walkLine(F, e.x, e.y, side.x, side.y, r * .9)) e.detour = {
            x: side.x,
            y: side.y,
            t: 1.1
          };
        }
        e.path = null;
        e.pathT = 0;
      } else if (e.stuckT >= 1.5 && sk < 2) {
        e.stuckK = 2;
        const s0 = Math.random() < .5 ? 1 : -1, a = e.face || 0;
        for (const sg of [ s0, -s0 ]) {
          if (e.detour) break;
          const px = e.x + Math.cos(a + sg * 1.5708) * .7, py = e.y + Math.sin(a + sg * 1.5708) * .7;
          if (!hitsAt(F, px, py, r) && walkLine(F, e.x, e.y, px, py, r * .9)) e.detour = {
            x: px,
            y: py,
            t: .6
          };
        }
      } else if (e.stuckT >= .5 && sk < 1) {
        e.stuckK = 1;
        e.path = null;
        e.pathT = 0;
      }
      return;
    }
    A.unstuckWhy[A.enemies.some(o => o !== e && o.alive && o.floor === e.floor && Math.hypot(o.x - e.x, o.y - e.y) < .75) ? "crowd" : "geo"]++;
    if (A.onUnstick) A.onUnstick(e, F);
    let back = null;
    for (let i = hist.length - 1; i >= 0; i--) {
      const h = hist[i];
      if (Math.hypot(h.x - e.x, h.y - e.y) > .6 && !hitsAt(F, h.x, h.y, r)) {
        back = h;
        break;
      }
    }
    if (!back) back = nearFree(F, e.x, e.y, r, .6, 1.6);
    if (back) {
      e.x = back.x;
      e.y = back.y;
    }
    e.detour = null;
    for (let k = 0; k < 6 && !e.detour; k++) {
      const side = nearFree(F, e.x, e.y, r, .8 + k * .1, 1.8);
      if (side && walkLine(F, e.x, e.y, side.x, side.y, r * .9)) e.detour = {
        x: side.x,
        y: side.y,
        t: 1.1
      };
    }
    e.path = null;
    e.pathT = 0;
    e.blockedT = .3;
    e.stuckT = 0;
    e.stuckK = 0;
    e.anchorX = e.x;
    e.anchorY = e.y;
    if (e.patrol) {
      e.patrol.path = null;
      e.patrol.pathFor = -1;
    }
    A.unstuck++;
  }
  A.unstickEnemy = unstick;
  A.LEG_E = 3.2 / 1.7;
  let stepBudget = 4, stepBudgetT = 0;
  function enemyStep(F, e) {
    const sk = Math.floor(e.walkT / 2);
    if (sk === e.stepK) return;
    const first = e.stepK == null;
    e.stepK = sk;
    if (first || !A.player) return;
    const sm = SX.wx ? SX.wx.stepMul(F, e.x, e.y) : 1;
    const d = Math.hypot(e.x - A.player.x, e.y - A.player.y);
    if (d > 18 * sm) return;
    const now = A.clock;
    if (now - stepBudgetT > .25) {
      stepBudgetT = now;
      stepBudget = 4;
    }
    if (stepBudget <= 0) return;
    stepBudget--;
    const kind = e.variant === "dog" ? "dog" : e.type === "zombie" ? "zombie" : "boot";
    SX.audio.play("step", {
      x: e.x,
      y: e.y,
      range: 18 * sm,
      vol: kind === "zombie" ? .45 : .55,
      w: e.variant === "brute" ? .9 : .55,
      kind,
      surface: SX.audio.surfOf ? SX.audio.surfOf(SX.sndPlace ? SX.sndPlace.fsAt(F, e.x, e.y) : F.fs[F.i(Math.floor(e.x), Math.floor(e.y))]) : "conc"
    });
  }
  A.enemyStep = enemyStep;
  A.updateEnemies = function(dt, level, env) {
    const pf = A.player ? A.player.floor : -1, occ = SX.coop && SX.coop.floorsOn ? SX.coop.floorsOn() : null;
    A.clock += dt;
    slotT -= dt;
    if (slotT <= 0) {
      slotT = .5;
      reslot();
    }
    pfTick();
    for (const e of A.enemies) {
      if (e.dead) {
        e.deathT += dt;
        A.deathTick(e);
        continue;
      }
      if (!e.alive) continue;
      const F = level.floors[e.floor];
      e.farTick = e.floor !== pf && !(occ && occ.has(e.floor));
      if (e.farTick) {
        e.slow = (e.slow || 0) + dt;
        if (e.slow < .5) continue;
        const sd = e.slow;
        brain(F, e, sd, env);
        e.slow = 0;
        unstick(F, e, sd);
      } else {
        brain(F, e, dt, env);
        if (e.kbD > 0) kbStep(F, e, dt);
        unstick(F, e, dt);
        if (e.floor === pf) enemyStep(F, e);
      }
      e.flinch = Math.max(0, e.flinch - dt);
      e.swing = Math.max(0, e.swing - dt);
      e.kick = Math.max(0, e.kick - dt * 7);
      e.muzzleT -= dt;
      e.dir = A.dirOf(e.face);
      e.legT = e.walkT * A.LEG_E;
      e.frame = Math.floor(e.legT) % 4;
    }
  };
  A.hitTarget = function(F, pr, x, y, dmg, crit, shot, cal, at, mel) {
    const t = pr.target;
    let bare = true;
    const vn = SX.hub && SX.hub.rangeVest;
    let blocked = false;
    if (vn && dmg != null) {
      if (!t.vest || t.vest.name !== vn) t.vest = I.mk(vn);
      if (!crit && t.vest.armor > 0) {
        const pen = A.penOf(cal, at), d0 = dmg;
        dmg = A.armorHit(t.vest, dmg, pen, false);
        blocked = dmg < d0 * .5;
        bare = false;
      }
    } else t.vest = null;
    const hn = SX.hub && SX.hub.rangeHelm;
    if (hn && dmg != null) {
      if (!t.helm || t.helm.name !== hn) t.helm = I.mk(hn);
      if (crit && t.helm.armor > 0) {
        const pen = A.penOf(cal, at), d0 = dmg;
        dmg = A.armorHit(t.helm, dmg, pen, true);
        blocked = dmg < d0 * .5;
        bare = false;
      }
    } else t.helm = null;
    if (bare && at && dmg != null) dmg *= A.fleshMul(at);
    if ((vn || hn) && dmg != null) t.armorAt = performance.now();
    t.hits++;
    t.hitT = .35;
    const SP = mel ? SX.sndPlace : null;
    if (!SP || SP.matOf(pr.kind) === "metal") sparks(F, x, y);
    if (SP) SX.audio.play(SP.hitOf(pr), {
      x,
      y,
      range: 24,
      vol: .9
    }); else SX.audio.play("hitWall", {
      x,
      y,
      range: 40,
      vol: .9,
      hi: true
    });
    const sum = shot && t.sumShot === shot && t.sumTxt && A.texts.includes(t.sumTxt);
    if (dmg != null && sum) {
      t.sum += dmg;
      t.sumCrit = t.sumCrit || !!crit;
      t.sumN++;
    } else {
      t.sum = dmg || 0;
      t.sumCrit = !!crit;
      t.sumN = 1;
      t.sumShot = shot || 0;
    }
    t.last = dmg != null ? Math.round(t.sum) : null;
    t.lastCrit = t.sumCrit;
    if (blocked && !sum) t.sumBlk = true; else if (!blocked) t.sumBlk = false;
    const txt = dmg != null ? (t.sumCrit ? t.sumBlk ? "머리 막힘 " : "치명 " : t.sumBlk ? "막힘 " : "") + Math.round(t.sum) + (t.sumN > 1 ? " (" + t.sumN + "알)" : "") : t.dist + "m", col = t.sumBlk ? "#8fd0ea" : t.sumCrit ? "#ff7a5a" : "#ffd36a";
    if (sum) {
      t.sumTxt.text = txt;
      t.sumTxt.col = col;
      t.sumTxt.t = .9;
    } else {
      A.float(F.idx, pr.x + pr.w / 2, pr.y - .4, txt, col);
      t.sumTxt = A.texts[A.texts.length - 1];
    }
    const s = SX.game.save, rr = SX.map.rangeRec(s);
    rr.hits++;
    if (!mel && t.dist > (rr.best || 0)) {
      rr.best = t.dist;
      SX.log("🎯 최장 " + t.dist + "m", "good");
    }
    SX.ui && SX.ui.hitMarker(false);
    SX.ui && SX.ui.hudDirty();
  };
  const shotSrc = (fr, head) => fr && fr.variant === "sniper" ? head ? "저격수의 헤드샷에 당했습니다" : "저격수에게 맞았습니다" : head ? "약탈자의 헤드샷에 당했습니다" : "약탈자의 총에 맞았습니다";
  const pvpBullet = b => {
    const fk = b.from ? b.from.kind : null;
    return (fk === "player" || b.vis && fk === "peer") && !!(SX.coop && SX.coop.pvpOn && SX.coop.pvpOn(b.floor));
  };
  function bodyOn(b, F, sa, sb) {
    const fr = b.from, fk = fr ? fr.kind : null, ex = b.ox + b.ux * sb, ey = b.oy + b.uy * sb, p = A.player;
    let best = null;
    const near = (x, y) => Math.abs(x - ex) < 2.4 && Math.abs(y - .6 - ey) < 2.6;
    const tryB = (o, w, shapes, headOk) => {
      const h = A.rayHit(b.ox, b.oy, b.ux, b.uy, shapes, sa, sb, b.aimD);
      if (h && (!best || h.s < best.s)) best = {
        o,
        w,
        s: h.s,
        head: headOk && h.head
      };
    };
    if (p && p.alive && p.floor === b.floor && fr !== p && (b.vis || fk === "enemy") && near(p.x, p.y)) tryB(p, "p", b.vis && fk !== "enemy" ? A.pvpShapes(p.x, p.y, p.dir, p.crouch) : A.hitShapes("me", p.x, p.y), !b.vis);
    if (!b.vis && (fk === "enemy" || fk === "player") && SX.coop && SX.coop.bodiesOn) {
      for (const g of SX.coop.bodiesOn(b.floor)) {
        if (fk === "player" && g.mate || b.hitSet && b.hitSet.has(g) || !near(g.x, g.y)) continue;
        if (g.isAlly) tryB(g, "ga", A.hitShapes("me", g.x, g.y), fk === "enemy"); else if (fk === "enemy") tryB(g, "g", A.hitShapes("me", g.x, g.y), true); else tryB(g, "g", A.pvpShapes(g.x, g.y, g.dir, g.crouch), true);
      }
    }
    if (!b.vis && fk === "enemy") for (const al of A.allies) if (al.alive && al.floor === b.floor && near(al.x, al.y)) tryB(al, "al", A.hitShapes("me", al.x, al.y), true);
    if (b.pvpOnly) return best;
    if (!b.vis && fk === "player" && F.targets) for (const pr of F.targets) {
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2 - .45;
      if (near(cx, cy + .6)) tryB(pr, "t", [ {
        t: 0,
        x: cx,
        y: cy - .432,
        hw: .45,
        hh: .168,
        h: true
      }, {
        t: 0,
        x: cx,
        y: cy + .168,
        hw: .45,
        hh: .432,
        h: false
      } ], true);
    }
    for (const e of A.enemies) {
      if (!e.alive || e.floor !== b.floor || e === fr) continue;
      if (fk === "enemy" && fr.type === e.type) continue;
      if (near(e.x, e.y)) tryB(e, "e", A.enemyShapes(e), fk === "player" && !b.vis);
    }
    return best;
  }
  function bulletBody(F, b, hb) {
    if (b.vis) return true;
    const fr = b.from, fk = fr ? fr.kind : null, o = hb.o, head = hb.head, s = hb.s, km = b.km, ang = Math.atan2(b.vy, b.vx);
    const px = b.ox + b.ux * s, py = b.oy + b.uy * s;
    if (hb.w === "p") {
      A.hurtPlayer(b.dmg * (head ? 2 : 1) * km, shotSrc(fr, head), head, ang, b.cal, "raider", {
        by: fr,
        r: s
      }, b.at);
      return true;
    }
    if (hb.w === "al") {
      A.hurtAlly(F, o, b.dmg * (head ? 2 : 1) * km, ang);
      return true;
    }
    if (hb.w === "g" || hb.w === "ga") {
      let dmg = b.dmg;
      if (fk === "player" && b.falloff) dmg *= Math.max(.25, 1 - s / b.falloff);
      if (hb.w === "ga") {
        SX.coop.hurtPeerAlly(o.pid, dmg * (head ? 2 : 1) * km, ang);
        return true;
      }
      if (fk === "enemy") {
        SX.coop.hurtPeer(o.pid, dmg * (head ? 2 : 1) * km, shotSrc(fr, head), head, ang, false, b.cal, "raider", fr.nid, undefined, b.at);
        return true;
      }
      SX.coop.hurtPeer(o.pid, (head && b.dmgHead ? b.dmgHead : dmg) * km, (SX.net && SX.net.name && SX.net.name() || "누군가") + " 의 총에 맞았습니다", head, ang, true, b.cal, null, null, {
        w: b.wn,
        r: s
      }, b.at);
      SX.ui && SX.ui.hitMarker(head);
      const cls = head ? o.hc | 0 : o.ac | 0;
      if (b.at === "hp" || (b.np | 0) >= 2 || cls >= A.penOf(b.cal, b.at) || km * .3 < .2) return true;
      b.km = km * .3;
      b.np = (b.np | 0) + 1;
      b.pvpOnly = true;
      (b.hitSet || (b.hitSet = new Set)).add(o);
      return false;
    }
    const fo = b.falloff ? Math.max(.25, 1 - s / b.falloff) : 1;
    if (hb.w === "t") {
      const crit = head;
      A.hitTarget(F, o, px, py, (crit ? b.dmgHead ? b.dmgHead * fo : b.dmg * fo * 2.2 : b.dmg * fo) * km, crit, b.shot, b.cal, b.at);
      return true;
    }
    const e = o, me = fr === A.player, crit = fk === "player" && head;
    let dmg = b.dmg * fo;
    if (me && SX.skills && !e.spar) SX.skills.gain("shoot", 1);
    if (crit && me && !e.spar && SX.game.state === "raid" && SX.game.stats) SX.game.stats.crit = (SX.game.stats.crit | 0) + 1;
    if (!crit && e.hasArmor && b.cal) {
      const pen = A.vestFactor(b.cal, b.at);
      dmg *= pen;
      if (pen < .7 && !e.armorHint) {
        e.armorHint = true;
        A.float(F.idx, e.x, e.y - 1.4, "방탄복!", "#9ad0ff");
      }
    } else if (!crit && b.at) dmg *= A.fleshMul(b.at);
    if (me) A.hitCtx = {
      k: "g",
      r: b.range,
      q: b.shot,
      t: b.ct != null ? b.ct : A.clock,
      w: b.wn
    };
    A.hitEnemy(F, e, (crit && b.dmgHead ? b.dmgHead * fo / 2.2 : dmg) * km, ang, fr, crit, b.at);
    if (fk === "player") SX.ui && SX.ui.hitMarker(crit);
    SX.audio.play("hitFlesh", {
      x: px,
      y: py,
      range: 20,
      vol: .6
    });
    return true;
  }
  function bodiesTo(F, b, sa, sb) {
    for (let n = 0; n < 4; n++) {
      const hb = bodyOn(b, F, sa, sb);
      if (!hb) return false;
      if (bulletBody(F, b, hb)) return true;
      sa = hb.s;
    }
    return false;
  }
  function cellEv(F, b, ev) {
    const sq = ev.s + .02, px = b.ox + b.ux * sq, py = b.oy + b.uy * sq;
    if (ev.p) {
      const pr = F.in(ev.x, ev.y) ? F.propAt[ev.y * F.W + ev.x] : null;
      if (pr && pr.solid && ev.s > 1.4 && !b.passed?.has(pr)) {
        (b.passed = b.passed || new Set).add(pr);
        if (Math.random() < (SX.tac ? SX.tac.coverOf(pr, b) : pr.cover)) {
          sparks(F, px, py);
          SX.audio.play(SX.sndPlace ? SX.sndPlace.hitOf(pr) : "hitWall", {
            x: px,
            y: py,
            range: 12,
            vol: .4
          });
          return true;
        }
      }
      return false;
    }
    const m = A.bulletMat(F, ev.x, ev.y);
    if (!m) return false;
    const pvp = m < 3 && pvpBullet(b), ap = pvp && b.at === "ap";
    if (m === 1) {
      const i = ev.y * F.W + ev.x, wb = F.winBroken || (F.winBroken = new Set);
      if (!wb.has(i)) {
        wb.add(i);
        b.km *= ap ? .95 : .8;
        sparks(F, px, py);
        SX.audio.play("hitGlass", {
          x: px,
          y: py,
          range: 16,
          vol: .5
        });
      }
      return false;
    }
    const hitSnd = () => SX.audio.play(SX.sndPlace ? SX.sndPlace.wallHit(F, px, py + .45) : "hitWall", {
      x: px,
      y: py,
      range: 16,
      vol: .5
    });
    if (m === 2 && pvp && (b.np | 0) < 2 && b.km * (ap ? .55 : .4) >= .2) {
      b.km *= ap ? .55 : .4;
      b.np = (b.np | 0) + 1;
      b.pvpOnly = true;
      hitSnd();
      A.decal(F, px, py + .45, "hole");
      return false;
    }
    sparks(F, px, py);
    hitSnd();
    A.decal(F, px, py + .45, "hole");
    return true;
  }
  A.updateProjectiles = function(dt, level) {
    for (let i = A.bullets.length - 1; i >= 0; i--) {
      const b = A.bullets[i], F = level.floors[b.floor];
      if (!F) {
        A.bullets.splice(i, 1);
        continue;
      }
      b.t -= dt;
      if (b.ux == null) {
        const v = Math.hypot(b.vx, b.vy) || 1;
        b.ux = b.vx / v;
        b.uy = b.vy / v;
      }
      if (b.km == null) {
        b.km = 1;
        b.np = 0;
      }
      const steps = Math.max(6, Math.ceil(Math.hypot(b.vx, b.vy) * dt / .3)), sx = b.vx * dt / steps, sy = b.vy * dt / steps;
      let dead = b.t <= 0;
      b.trail.push([ b.x, b.y ]);
      if (b.trail.length > 2) b.trail.shift();
      for (let s = 0; s < steps && !dead; s++) {
        const x0 = b.x, y0 = b.y, s0 = Math.hypot(x0 - b.ox, y0 - b.oy);
        b.x += sx;
        b.y += sy;
        const dist = Math.hypot(b.x - b.ox, b.y - b.oy);
        if (dist > b.range) {
          dead = true;
          break;
        }
        const first = !b.st0, tl = [], pl = [], evs = [];
        b.st0 = 1;
        cellsOn(x0, y0 + .45, b.x, b.y + .45, s0, first, tl);
        cellsOn(x0, y0 + .5, b.x, b.y + .5, s0, first, pl);
        for (let k = 0; k < tl.length; k += 3) evs.push({
          s: tl[k],
          p: 0,
          x: tl[k + 1],
          y: tl[k + 2]
        });
        for (let k = 0; k < pl.length; k += 3) evs.push({
          s: pl[k],
          p: 1,
          x: pl[k + 1],
          y: pl[k + 2]
        });
        if (evs.length > 1) evs.sort((a, c) => a.s - c.s || a.p - c.p);
        let sa = s0;
        for (const ev of evs) {
          if (bodiesTo(F, b, sa, ev.s)) {
            dead = true;
            break;
          }
          sa = ev.s;
          if (cellEv(F, b, ev)) {
            dead = true;
            break;
          }
        }
        if (dead) break;
        if (SX.ev && SX.ev.bulletHit && SX.ev.bulletHit(b, dist)) {
          dead = true;
          break;
        }
        if (SX.bdev && SX.bdev.bulletHit && SX.bdev.bulletHit(b)) {
          dead = true;
          break;
        }
        if (SX.mis && SX.mis.bulletHit && SX.mis.bulletHit(b, dist)) {
          dead = true;
          break;
        }
        if (bodiesTo(F, b, sa, dist)) {
          dead = true;
          break;
        }
      }
      if (dead) A.bullets.splice(i, 1);
    }
    for (let i = A.nades.length - 1; i >= 0; i--) {
      const n = A.nades[i], F = level.floors[n.floor];
      n.fuse -= dt;
      A.nadeStep(F, n, dt);
      if (n.sub === "fire" && (n.z <= 0 || n.bonk)) n.fuse = 0;
      if (n.fuse <= 0) {
        A.nades.splice(i, 1);
        if (n.sub && SX.tac) SX.tac.burst(F, n); else explode(F, n);
      }
    }
    for (let i = A.parts.length - 1; i >= 0; i--) {
      const q = A.parts[i];
      q.t -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.g) {
        q.vz -= q.g * dt;
        q.z += q.vz * dt;
        if (q.z <= 0) {
          q.z = 0;
          q.vx *= .3;
          q.vy *= .3;
          q.vz = 0;
          if (q.stick) {
            const F = level.floors[q.floor];
            if (F) A.decal(F, q.x, q.y, q.stick === "casing" ? "casing" : "drop");
            A.parts.splice(i, 1);
            continue;
          }
        }
      } else if (q.smoke) {
        q.z += q.vz * dt;
        q.vx *= .96;
        q.vy *= .96;
      }
      if (q.t <= 0) A.parts.splice(i, 1);
    }
    for (let i = A.texts.length - 1; i >= 0; i--) {
      const t = A.texts[i];
      t.t -= dt;
      if (t.t <= 0 || t.a && !t.a.alive) A.texts.splice(i, 1);
    }
  };
  function explode(F, n) {
    SX.audio.play("explode", {
      x: n.x,
      y: n.y,
      f: F.idx,
      range: 60
    });
    SX.light.flash(F.idx, n.x, n.y, 9, [ 255, 230, 190 ], .35, 1.3);
    smoke(F, n.x, n.y, 26, true);
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * 6.28, v = 3 + Math.random() * 6;
      A.part({
        floor: F.idx,
        x: n.x,
        y: n.y,
        z: .4,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 2 + Math.random() * 2,
        g: 9,
        c: A.FX.spark,
        t: .4,
        life: .4
      });
    }
    A.decal(F, n.x, n.y + .2, "scorch", true);
    const p = A.player, pd = Math.hypot(p.x - n.x, p.y - n.y);
    if (p.alive && p.floor === F.idx) SX.view.shake(Math.max(0, 8 - pd));
    const hurtAt = (x, y) => {
      const d = Math.hypot(x - n.x, y - n.y);
      if (d > n.radius) return 0;
      if (!SX.light.los(F, n.x, n.y - .2, x, y - .4)) return 0;
      return n.dmg * (1 - d / n.radius * .7);
    };
    const mateNade = !!(n.from && n.from.kind === "peer" && n.from.mate);
    if (p.alive && p.floor === F.idx && !mateNade && SX.game.state === "raid") {
      const d = hurtAt(p.x, p.y);
      if (d > 0) A.hurtPlayer(d, "수류탄에 휘말렸습니다", false, Math.atan2(p.y - n.y, p.x - n.x), "blast", n.from && n.from.kind === "enemy" ? "raider" : "player", {
        by: n.from,
        nade: true,
        r: pd
      });
    }
    if (F.targets) for (const pr of F.targets) {
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2, d = hurtAt(cx, cy);
      if (d > 0) {
        if (pr.target) pr.target.hitT = .35;
        A.float(F.idx, cx, pr.y - .4, "폭발 " + Math.round(d), "#ffb070");
      }
    }
    if (!SX.coop || SX.coop.runEnemies()) for (const e of A.enemies) if (e.alive && e.floor === F.idx) {
      const d = hurtAt(e.x, e.y);
      if (d > 0) A.damageEnemy(F, e, d, Math.atan2(e.y - n.y, e.x - n.x), n.from, false);
    }
    A.noise(F, n.x, n.y, 35, false, 0, true);
  }
  A.mercSpec = function(m) {
    const hex = n => "#" + (n >>> 0).toString(16).padStart(6, "0");
    const lk = m.look || {};
    if (lk.topStyle || lk.hairStyle) return Object.assign({
      key: "al" + m.id,
      kind: "merc"
    }, lk);
    return {
      key: "al" + m.id,
      kind: "merc",
      top: hex(lk.coat || 4872762),
      pants: hex(lk.pants || 3355443),
      hat: "cap",
      hatCol: hex(lk.cap || 3355443),
      vest: "#2d3324",
      pack: "#4a4030",
      skin: SX.art.C.skin2
    };
  };
  A.mercGun = m => m && m.gun ? I.def(m.gun) : null;
  A.mercMelee = m => I.def(m && m.melee || "식칼");
  A.spawnAlly = function(F, m, x, y) {
    const spec = A.mercSpec(m);
    const al = {
      kind: "ally",
      name: m.name,
      x,
      y,
      floor: F.idx,
      r: .24,
      hp: m.hp,
      hpMax: m.hp,
      alive: true,
      acc: m.acc,
      sight: m.sight,
      ear: m.ear,
      merc: m,
      gunDef: A.mercGun(m),
      meleeDef: A.mercMelee(m),
      rate: m.rate || 1,
      heal: m.heal || 0,
      healT: 0,
      fovCos: Math.cos((m.fov || 120) * Math.PI / 360),
      spec,
      dir: 0,
      frame: 0,
      walkT: 0,
      face: 0,
      cool: .5,
      kick: 0,
      muzzleT: 0,
      path: null,
      pathT: 0,
      doorSkill: true
    };
    A.allies.push(al);
    return al;
  };
  A.hurtAlly = function(F, al, dmg, ang) {
    al.hp -= dmg;
    al.flinch = .18;
    blood(F, al.x, al.y - .45, ang, 6);
    if (al.hp <= 0) {
      al.alive = false;
      SX.log(al.pax ? "🚁 " + al.name + " 이(가) 쓰러졌습니다 — 이번 헬기에는 못 태웁니다(다친 채 장터로 돌아갑니다)" : "🤝 " + al.name + " 이(가) 쓰러졌습니다", "bad");
      A.decal(F, al.x, al.y, "blood", true);
      if (al.pax) SX.audio.play("hurt", {
        x: al.x,
        y: al.y,
        range: 20
      });
    }
  };
  A.updateAllies = function(dt, level, env) {
    const p = A.player;
    for (const al of A.allies) {
      if (!al.alive) continue;
      if (al.floor !== p.floor) {
        al.floor = p.floor;
        al.x = p.x;
        al.y = p.y + .6;
        al.path = null;
      }
      const F = level.floors[al.floor];
      al.cool -= dt;
      al.kick = Math.max(0, al.kick - dt * 7);
      al.muzzleT -= dt;
      al.flinch = Math.max(0, (al.flinch || 0) - dt);
      if (al.swing > 0) al.swing = Math.max(0, al.swing - dt);
      if (al.mHit && (al.mHit.t -= dt) <= 0) {
        const h = al.mHit, z = h.e;
        al.mHit = null;
        if (z.alive && z.floor === al.floor && Math.hypot(z.x - al.x, z.y - al.y) < 1.6) {
          A.hitEnemy(F, z, h.dmg, Math.atan2(z.y - al.y, z.x - al.x), al, false);
          SX.audio.play("hitFlesh", {
            x: al.x,
            y: al.y,
            range: 16,
            vol: .6
          });
        }
      }
      if (al.heal && p.alive && !p.down && p.hp < 100) {
        al.healT = (al.healT || 0) + dt;
        if (al.healT >= 1 && Math.hypot(p.x - al.x, p.y - al.y) < 3.5) {
          al.healT = 0;
          p.hp = Math.min(A.hpMax(p), p.hp + al.heal);
          SX.ui && SX.ui.hudDirty();
        }
      }
      const bx = p.x - Math.cos(p.aim) * 1.8, by = p.y - Math.sin(p.aim) * 1.8;
      const d = Math.hypot(bx - al.x, by - al.y);
      if (d > .7 && p.alive) {
        const spd = Math.min(5.2, 1.8 + d * .9);
        steer(F, al, A.free(F, bx, by) ? bx : p.x, A.free(F, bx, by) ? by : p.y, spd, dt);
      }
      if (d > 14) {
        al.x = p.x;
        al.y = p.y + .5;
      }
      if (al.passive) {
        al.biteT = (al.biteT || 0) - dt;
        if (al.biteT <= 0) for (const e of A.enemies) {
          if (!e.alive || e.floor !== al.floor || e.type !== "zombie" || Math.hypot(e.x - al.x, e.y - al.y) > .95) continue;
          al.biteT = .9;
          A.hurtAlly(F, al, 9 + Math.random() * 6, Math.atan2(al.y - e.y, al.x - e.x));
          SX.audio.play("bite", {
            x: al.x,
            y: al.y,
            range: 18,
            vol: .6
          });
          break;
        }
        if (d > .7) al.face = Math.atan2(p.y - al.y, p.x - al.x);
        al.dir = A.dirOf(al.face);
        al.legT = al.walkT * A.LEG_E;
        al.frame = Math.floor(al.legT) % 4;
        continue;
      }
      const back = p.aim + Math.PI;
      const sight = al.sight * (env.night ? .62 : 1);
      let best = null, bd = sight;
      for (const e of A.enemies) {
        if (!e.alive || e.floor !== al.floor) continue;
        const ex = e.x - al.x, ey = e.y - al.y, q = Math.hypot(ex, ey);
        if (q >= bd) continue;
        if (SX.wx && q > sight * SX.wx.sightMul(F, al.x, al.y, e.x, e.y) && q > al.ear) continue;
        const dot = q > .01 ? (ex * Math.cos(back) + ey * Math.sin(back)) / q : 1;
        if (q > 2.5 && dot < al.fovCos && q > al.ear) continue;
        if (!SX.light.los(F, al.x, al.y - .5, e.x, e.y - .5)) continue;
        bd = q;
        best = e;
      }
      if (!best) {
        al.face = SX.lerp(al.face, al.face + SX.angDiff(al.face, back), Math.min(1, dt * 4));
      } else {
        al.face = Math.atan2(best.y - al.y, best.x - al.x);
        const gd = al.gunDef;
        if (!gd) {
          if (bd < 1.2 && al.cool <= 0) {
            const MK = SX.melee ? SX.melee.start(al, al.meleeDef, al.face, "ally") : null, MA = MK ? SX.melee.ai(al.meleeDef) : null, dm = (26 + Math.random() * 16) * (MA ? MA.dmg : 1);
            al.cool = .8 * (MA ? MA.cool : 1);
            if (MK) {
              al.mHit = {
                t: MK.hitT,
                e: best,
                dmg: dm
              };
              SX.audio.play(MK.snd, {
                x: al.x,
                y: al.y,
                range: 12,
                vol: .5
              });
            } else {
              al.swing = .25;
              A.hitEnemy(F, best, dm, al.face, al, false);
              SX.audio.play("hitFlesh", {
                x: al.x,
                y: al.y,
                range: 16,
                vol: .6
              });
            }
            A.noise(F, al.x, al.y, 8);
          }
        } else if (al.cool <= 0) {
          al.cool = (1 + Math.random() * .5) * (al.rate || 1);
          const a = al.face + (Math.random() - .5) * (1 - al.acc) * .35;
          const mx = al.x + Math.cos(a) * .6, my = al.y - .55 + Math.sin(a) * .6;
          const dmg = gd.dmg ? gd.dmg * .9 : 24;
          A.shoot(F, al, mx, my, a, dmg + Math.random() * 10, 0, {
            range: gd.cls === "sniper" ? 60 : 36,
            vel: A.gunVel(gd)
          });
          al.kick = 1;
          al.muzzleT = gd.quiet ? .03 : .06;
          SX.audio.play(A.gunSound(gd, gd.quiet), {
            x: al.x,
            y: al.y,
            range: gd.quiet ? 14 : 40,
            vol: gd.quiet ? .6 : .7
          });
          SX.light.flash(F.idx, mx, my, gd.quiet ? 2 : 4.5, [ 255, 210, 130 ], .07);
          A.noise(F, al.x, al.y, (gd.quiet ? 6 : 24) * (SX.wx ? SX.wx.shotMul(F, al.x, al.y) : 1));
        }
      }
      al.dir = A.dirOf(al.face);
      al.legT = al.walkT * A.LEG_E;
      al.frame = Math.floor(al.legT) % 4;
    }
  };
  A.spawnPacks = function(F, rng, mons, scavs, ctx, avoid, avoidY) {
    if (typeof avoid === "number") avoid = [ [ avoid, avoidY ] ];
    const pts = avoid || [];
    const units = [], byG = new Map;
    for (const r of F.rooms) {
      if (r.vault) continue;
      let u;
      if (r.grp) {
        u = byG.get(r.grp);
        if (!u) {
          u = {
            parts: [],
            area: 0
          };
          byG.set(r.grp, u);
          units.push(u);
        }
      } else {
        u = {
          parts: [],
          area: 0
        };
        units.push(u);
      }
      u.parts.push(r);
      u.area += (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
    }
    for (const u of units) {
      let sx = 0, sy = 0, n = 0;
      for (const r of u.parts) {
        sx += (r.x0 + r.x1) / 2;
        sy += (r.y0 + r.y1) / 2;
        n++;
      }
      u.cx = sx / n;
      u.cy = sy / n;
    }
    const far = (u, m) => pts.every(([x, y]) => Math.hypot(u.cx - x, u.cy - y) > m);
    const pool = rng.shuffle(units.filter(u => far(u, 16)));
    const cap = u => Math.max(2, Math.min(5, Math.round(u.area / 55)));
    const zRooms = [], sRooms = [];
    const roam = F.idx === 0 ? 0 : Math.round(mons * .2);
    let zLeft = mons - roam, sLeft = scavs;
    while (zLeft > 0 && pool.length) {
      const u = pool.shift();
      const n = Math.min(zLeft, 2 + rng.i(cap(u) - 1));
      zRooms.push({
        u,
        n
      });
      zLeft -= n;
    }
    const minD = u => zRooms.reduce((m, q) => Math.min(m, Math.hypot(q.u.cx - u.cx, q.u.cy - u.cy)), 1e9);
    while (sLeft > 0 && pool.length) {
      const order = pool.map((u, k) => ({
        k,
        d: minD(u) + rng.f() * 4
      })).sort((a, b) => b.d - a.d);
      const u = pool.splice(order[rng.i(Math.min(3, order.length))].k, 1)[0];
      if (!far(u, 22) && pool.length) continue;
      const n = Math.min(sLeft, 2 + rng.i(Math.min(2, cap(u) - 1)));
      sRooms.push({
        u,
        n
      });
      sLeft -= n;
    }
    const top = (list, left) => {
      for (let k = 0; left > 0 && list.length; k++, left--) list[k % list.length].n++;
      return left;
    };
    zLeft = top(zRooms, zLeft);
    sLeft = top(sRooms, sLeft);
    const inRooms = u => {
      for (let t = 0; t < 60; t++) {
        const r = rng.pick(u.parts);
        const x = r.x0 + .5 + rng.f() * (r.x1 - r.x0), y = r.y0 + .5 + rng.f() * (r.y1 - r.y0);
        if (A.free(F, x, y, .35)) return [ x, y ];
      }
      return null;
    };
    const avoidS = [].concat(...sRooms.map(q => q.u.parts));
    const corridor = () => {
      for (let t = 0; t < 200; t++) {
        const x = SX.map.MARGIN + 1.5 + rng.f() * (SX.map.SIZE - 3), y = SX.map.MARGIN + 1.5 + rng.f() * (SX.map.SIZE - 3);
        if (F.room[F.i(Math.floor(x), Math.floor(y))] !== -1 || F.tile(Math.floor(x), Math.floor(y)) !== T.FLOOR) continue;
        if (avoidS.some(r => x > r.x0 - 8 && x < r.x1 + 8 && y > r.y0 - 8 && y < r.y1 + 8)) continue;
        if (pts.some(([sx, sy]) => Math.hypot(x - sx, y - sy) < 14)) continue;
        if (A.free(F, x, y, .35)) return [ x, y ];
      }
      return null;
    };
    for (const q of zRooms) for (let k = 0; k < q.n; k++) {
      const s = inRooms(q.u);
      if (s) A.spawnEnemy(F, "zombie", s[0], s[1], rng, ctx);
    }
    for (let k = 0; k < roam + zLeft; k++) {
      const s = corridor();
      if (s) A.spawnEnemy(F, "zombie", s[0], s[1], rng, ctx);
    }
    const squads = [];
    for (const q of sRooms) {
      const grp = [];
      for (let k = 0; k < q.n; k++) {
        const s = inRooms(q.u);
        if (s) grp.push(A.spawnEnemy(F, "scav", s[0], s[1], rng, ctx));
      }
      if (grp.length) squads.push({
        u: q.u,
        grp
      });
    }
    let patrols = 0;
    if (squads.length) {
      const want = Math.max(1, Math.round(squads.length * .35));
      const others = units.filter(u => u.area > 20);
      for (const sq of rng.shuffle(squads.slice()).slice(0, want)) {
        const stops = [];
        let cur = sq.u;
        for (let k = 0; k < 3; k++) {
          const near = others.filter(u => u !== sq.u && !stops.includes(u)).map(u => ({
            u,
            d: Math.hypot(u.cx - cur.cx, u.cy - cur.cy)
          })).sort((a, b) => a.d - b.d).slice(0, 3);
          if (!near.length) break;
          cur = near[rng.i(near.length)].u;
          stops.push(cur);
        }
        const route = [ sq.u ].concat(stops).map(u => inRooms(u)).filter(Boolean);
        if (route.length < 2) continue;
        const lead = sq.grp[0];
        sq.grp.forEach((e, k) => {
          e.doorSkill = true;
          e.patrol = {
            route,
            i: 1,
            waitT: rng.f() * 2,
            lead: k ? lead : null,
            side: k % 2 ? 1 : -1,
            row: Math.ceil(k / 2)
          };
        });
        patrols++;
      }
    }
    return {
      zRooms: zRooms.length,
      sRooms: sRooms.length,
      patrols
    };
  };
  A.roomHasOther = function(F, x, y, type) {
    const ri = F.room[F.i(Math.floor(x), Math.floor(y))];
    if (ri == null || ri < 0) return false;
    for (const e of A.enemies) if (e.alive && e.floor === F.idx && e.type !== type && F.room[F.i(Math.floor(e.x), Math.floor(e.y))] === ri) return true;
    return false;
  };
  A.spawnNamed = function(lv, rng, lootCtx, building) {
    const def = (SX.NAMED_BOSSES || {})[building.id];
    if (!def || building.noBoss || rng.f() >= (SX.NAMED_P != null ? SX.NAMED_P : .5)) return null;
    const nF = building.floors, f = nF >= 2 ? 1 + rng.i(nF - 1) : 0, F = lv.floors[f];
    if (!F) return null;
    let pos = null;
    const Rd = SX.raid, lob = f === 0 && Rd && Rd.spawnFor ? Array.from({
      length: Rd.SPAWNS || 12
    }, (_, k) => Rd.spawnFor(k, lv)).filter(Boolean) : [];
    for (let t = 0; t < 600 && !pos; t++) {
      const x = lv.X0 + 3 + rng.f() * (lv.X1 - lv.X0 - 6), y = lv.Y0 + 3 + rng.f() * (lv.Y1 - lv.Y0 - 6), tx = Math.floor(x), ty = Math.floor(y);
      const ok = building.outdoor ? (F.tile(tx, ty) === T.GROUND || F.tile(tx, ty) === T.FLOOR) && F.room[F.i(tx, ty)] >= 0 && ty > lv.Y0 + (lv.Y1 - lv.Y0) * .22 && ty < lv.Y1 - (lv.Y1 - lv.Y0) * .22 : F.tile(tx, ty) === T.FLOOR && F.inside[F.i(tx, ty)] && F.room[F.i(tx, ty)] >= 0;
      if (!ok || !A.free(F, x, y, .45)) continue;
      if (F.stairs.some(s => Math.hypot(s.x + s.w / 2 - x, s.y + s.h / 2 - y) < 10)) continue;
      if (A.roomHasOther(F, x, y, def.type)) continue;
      if (lob.some(q => Math.hypot(q.x - x, q.y - y) < 16)) continue;
      pos = [ x, y ];
    }
    if (!pos) return null;
    const ctx = lootCtx(f), e = A.spawnEnemy(F, def.type, pos[0], pos[1], rng, Object.assign({}, ctx, {
      floor: 9
    }));
    e.named = def.id;
    e.name = def.name;
    e.hp = e.hpMax = def.hp;
    e.namedDrop = def.drop;
    if (def.type === "scav") {
      e.armed = true;
      e.melee = null;
      e.melee2 = false;
      e.gun = def.gun;
      e.gunMods = A.rollGunMods(e.gun, 4, posSeed(F, e.x, e.y, 55), 2);
      e.hasArmor = !!def.armor;
      e.helmet = !!def.helmet;
      e.doorSkill = true;
      e.spec = Object.assign({}, e.spec, def.look || {}, {
        key: "nb-" + def.id
      });
      for (let k = 0; k < (def.guards || 0); k++) {
        const a = rng.f() * Math.PI * 2, x = e.x + Math.cos(a) * 1.6, y = e.y + Math.sin(a) * 1.6;
        const g = A.spawnEnemy(F, "scav", A.free(F, x, y, .3) ? x : e.x, A.free(F, x, y, .3) ? y : e.y, rng, Object.assign({}, ctx, {
          floor: 9
        }));
        g.armed = true;
        g.melee = null;
        g.melee2 = false;
        g.gun = SX.enemyGun(rng, Math.min(4, (building.diff || 2) + 1));
        g.doorSkill = true;
        g.gunMods = A.rollGunMods(g.gun, 3, posSeed(F, g.x, g.y, 61 + k));
        g.items = g.items.slice(0, 1);
        g.hasArmor = true;
      }
    } else {
      A.applyVariant(e, def.variant, rng);
      e.hp = e.hpMax = def.hp;
      e.name = def.name;
      const V = {
        coach: {
          top: "#2a4a8a",
          topStyle: "tee",
          pants: "#2a4a8a",
          skin: "#8a9a6a",
          hairStyle: "short",
          hat: null,
          mask: null,
          torn: true
        },
        master: {
          top: "#1e2a44",
          topStyle: "uniform",
          pants: "#1a2030",
          hat: "cap",
          hatCol: "#1e2a44",
          skin: "#8a9a6a",
          mask: null,
          torn: true
        },
        nurse: {
          top: "#e8e8e0",
          topStyle: "coat",
          pants: "#e0e0d8",
          hat: "cap",
          hatCol: "#f0f0e8",
          skin: "#9aa47a",
          mask: "white",
          torn: true
        }
      }[def.variant] || {};
      e.spec = Object.assign({}, e.spec, V, {
        key: "nb-" + def.id
      });
      if (def.variant === "coach") {
        e.scale = 1.4;
        e.r = .36;
      }
      for (let k = 0; k < (def.dogs || 0); k++) {
        for (let t = 0; t < 20; t++) {
          const x = e.x + (rng.f() - .5) * 4, y = e.y + (rng.f() - .5) * 4;
          if (!A.free(F, x, y, .25)) continue;
          A.applyVariant(A.spawnEnemy(F, "zombie", x, y, rng, ctx), "dog", rng);
          break;
        }
      }
    }
    return {
      e,
      f,
      def
    };
  };
  const BOSS_GUN = SX.BOSS_GUNS;
  A.spawnBossSquad = function(F, rng, ctx, diff) {
    if (!F || !F.zip) return null;
    diff = Math.max(1, Math.min(4, diff | 0 || 2));
    const zx = F.zip.x, zy = F.zip.y, hut = F.hut || {
      x: -99,
      y: -99
    };
    const pts = [];
    for (let t = 0; t < 400 && pts.length < 6; t++) {
      const a = rng.f() * Math.PI * 2, r = 18 + rng.f() * 10, x = zx + Math.cos(a) * r, y = zy + Math.sin(a) * r;
      if (!F.in(Math.floor(x), Math.floor(y))) continue;
      {
        const tt = F.tile(Math.floor(x), Math.floor(y));
        if (tt !== T.GROUND && !(F.bossFloor && tt === T.FLOOR)) continue;
      }
      if (Math.hypot(x - hut.x, y - hut.y) < 14 || !A.free(F, x, y, .4)) continue;
      if (pts.some(q => Math.hypot(q[0] - x, q[1] - y) < 7)) continue;
      pts.push([ x, y ]);
    }
    if (pts.length < 2) return null;
    pts.sort((p, q) => Math.atan2(p[1] - zy, p[0] - zx) - Math.atan2(q[1] - zy, q[0] - zx));
    const ctxB = Object.assign({}, ctx, {
      floor: 9
    });
    const tier = Math.min(4, diff + 1);
    const boss = A.spawnEnemy(F, "scav", pts[0][0], pts[0][1], rng, ctxB);
    boss.boss = true;
    boss.name = "약탈자 두목";
    boss.hp = boss.hpMax = 350 + 120 * (diff - 1);
    boss.armed = true;
    boss.melee = null;
    boss.melee2 = false;
    boss.gun = BOSS_GUN[diff - 1];
    boss.gunMods = A.rollGunMods(boss.gun, 4, posSeed(F, boss.x, boss.y, 77), 2);
    boss.hasArmor = true;
    boss.helmet = true;
    boss.doorSkill = true;
    boss.items = [ I.rollItem(rng, ctx) ].filter(Boolean);
    boss.spec = Object.assign({}, boss.spec, {
      key: "sboss" + diff,
      top: "#5a1a1a",
      topStyle: "uniform",
      pants: "#1e1e22",
      hat: "helmet",
      hatCol: "#1e1e22",
      vest: "#1a1a1a",
      mask: "black",
      gloves: true
    });
    const guards = [ boss ];
    const n = 1 + diff;
    for (let k = 0; k < n; k++) {
      const a = rng.f() * Math.PI * 2, x = pts[0][0] + Math.cos(a) * 1.5, y = pts[0][1] + Math.sin(a) * 1.5;
      const g = A.spawnEnemy(F, "scav", A.free(F, x, y, .3) ? x : pts[0][0], A.free(F, x, y, .3) ? y : pts[0][1], rng, ctxB);
      g.guard = true;
      g.armed = true;
      g.melee = null;
      g.melee2 = false;
      g.gun = SX.enemyGun(rng, tier);
      g.doorSkill = true;
      g.gunMods = A.rollGunMods(g.gun, tier, posSeed(F, g.x, g.y, 31 + k));
      g.items = g.items.slice(0, 1);
      guards.push(g);
    }
    guards.forEach((e, k) => {
      e.patrol = {
        route: pts,
        i: 1,
        waitT: rng.f() * 2,
        lead: k ? boss : null,
        side: k % 2 ? 1 : -1,
        row: Math.ceil(k / 2)
      };
      e.leash = {
        x: zx,
        y: zy,
        r: 34,
        give: 22
      };
    });
    return {
      boss,
      n: guards.length,
      route: pts
    };
  };
})(window.SX);
