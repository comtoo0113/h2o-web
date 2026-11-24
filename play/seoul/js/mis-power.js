(function(SX) {
  "use strict";
  const M = SX.mis, h = M.h;
  const BLD = {
    office: 1,
    mall: 1,
    school: 1,
    metro: 1,
    base: 1
  };
  const REACH = 1.6, GEN_T = 6, CLOSE_T = 1.5, MOVE_T = 3, OPEN_T = .8;
  if (SX.audio && SX.audio.addSounds) SX.audio.addSounds({
    bank: {
      misGenPull: [ [ "mis_genPull_1", 1, 1 ], [ "mis_genPull_2", 1, 1 ], [ "mis_genPull_3", 1, 1 ] ],
      misGenStart: [ [ "mis_genStart", 1, 1 ] ],
      misGenRun: [ [ "mis_genRun", 1, 1 ] ],
      misLiftClose: [ [ "mis_liftClose", 1, 1 ] ],
      misLiftMove: [ [ "mis_liftMove", 1, 1 ] ],
      misLiftOpen: [ [ "mis_liftOpen", 1, 1 ] ],
      misDing: [ [ "mis_ding", 1, 1 ] ]
    },
    gain: {
      misGenPull: .8,
      misGenStart: 1,
      misGenRun: .55,
      misLiftClose: .6,
      misLiftMove: .45,
      misLiftOpen: .6,
      misDing: .7
    },
    cat: {
      misGenRun: "amb"
    }
  });
  const PL = () => h.A_().player;
  const st0 = s => s.k.power;
  const TS_ = () => SX.TS || 32;
  const fire = s => s.mode === "fire";
  const flood = s => s.mode === "flood";
  const busy = R => R.ph === "close" || R.ph === "move";
  const here = (R, f) => R.g && !R.fire && f === R.cf && (R.ph === "idle" || R.ph === "open");
  const inCab = (R, x, y) => x >= R.ex && x < R.ex + 2 && y >= R.ey && y < R.ey + 2;
  const flName = (R, f) => h.fname(f);
  function walkT(F, x, y) {
    if (!F.in(x, y)) return false;
    const T = h.T_(), t = F.tile(x, y), i = F.i(x, y);
    if (t === T.DOOR) return true;
    return (t === T.FLOOR || t === T.GROUND || t === T.STAIR) && !F.solid[i];
  }
  function badRoom(F, x, y) {
    for (const r of F.rooms || []) {
      if (!h.inRoom(r, x, y)) continue;
      if (r.vault || r.ctrl || r.nook) return true;
      if (F.vault && F.vault.r === r) return true;
      if (F.ctrl && F.ctrl.r === r) return true;
    }
    return false;
  }
  function inZone(F, x, y, pad) {
    for (const z of F.zones || []) if (x >= z.x - pad && x < z.x + (z.w || 1) + pad && y >= z.y - pad && y < z.y + (z.h || 1) + pad) return true;
    if (F.zip && Math.hypot(x + .5 - F.zip.x, y + .5 - F.zip.y) < pad + 3) return true;
    return false;
  }
  function trapT(F, x, y) {
    for (const t of F.traps || []) {
      if (t.kind === "wire") {
        for (let j = 0; j < (t.len || 1); j++) if ((t.horiz ? t.x + j : t.x) === x && (t.horiz ? t.y : t.y + j) === y) return true;
      } else if (Math.floor(t.x) === x && Math.floor(t.y) === y) return true;
    }
    return false;
  }
  const freeX = (F, x, y) => h.freeT(F, x, y) && !trapT(F, x, y);
  function nearStair(F, x, y, pad) {
    for (const s of F.stairs || []) if (x >= s.x - pad && x < s.x + s.w + pad && y >= s.y - pad && y < s.y + s.h + pad) return true;
    return false;
  }
  function spots(s) {
    const o = [];
    const add = v => {
      if (v && typeof v.f === "number" && typeof v.x === "number" && typeof v.y === "number") o.push({
        f: v.f,
        x: v.x,
        y: v.y
      });
    };
    for (const k of Object.keys(s.k)) {
      const v = s.k[k];
      if (!v) continue;
      add(v);
      if (Array.isArray(v.list)) v.list.forEach(add);
      if (v.v && typeof v.f === "number") o.push({
        f: v.f,
        x: v.v.x,
        y: v.v.y
      });
    }
    return o;
  }
  function farFrom(lv, f, x, y, sp) {
    if (f === 0) {
      for (const e of lv.exits || []) if (Math.hypot(e.x - x, e.y - y) < 5) return false;
      for (const p of lv.spawnPts || []) {
        const px = Array.isArray(p) ? p[0] : p.x, py = Array.isArray(p) ? p[1] : p.y;
        if (Math.hypot(px - x, py - y) < 4) return false;
      }
    }
    for (const q of sp) if (q.f === f && Math.abs(q.x - x) < 4 && Math.abs(q.y - y) < 4) return false;
    return true;
  }
  function linked(F, blk) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (const i of blk) {
      const x = i % F.W, y = i / F.W | 0;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    x0 -= 8;
    y0 -= 8;
    x1 += 8;
    y1 += 8;
    const ok = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && walkT(F, x, y) && !blk.has(F.i(x, y));
    const edge = [];
    for (const i of blk) {
      const x = i % F.W, y = i / F.W | 0;
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (ok(x + dx, y + dy)) edge.push(F.i(x + dx, y + dy));
    }
    if (!edge.length) return false;
    const seen = new Set([ edge[0] ]), q = [ edge[0] ];
    while (q.length) {
      const c = q.pop(), x = c % F.W, y = c / F.W | 0;
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const X = x + dx, Y = y + dy;
        if (!ok(X, Y)) continue;
        const n = F.i(X, Y);
        if (seen.has(n)) continue;
        seen.add(n);
        q.push(n);
      }
    }
    return edge.every(i => seen.has(i));
  }
  function liftAt(lv, fl, ex, ey, sp) {
    const T = h.T_();
    let score = 0;
    const conv = [];
    for (const f of fl) {
      const F = lv.floors[f];
      if (!F) return null;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const x = ex + dx, y = ey + dy;
        if (!freeX(F, x, y) || h.nearDoor(F, x, y) || badRoom(F, x, y)) return null;
      }
      for (let dx = 0; dx < 2; dx++) {
        if (!freeX(F, ex + dx, ey + 2) || h.nearDoor(F, ex + dx, ey + 2)) return null;
        const t3 = F.in(ex + dx, ey + 3) ? F.tile(ex + dx, ey + 3) : -1;
        if (t3 !== T.FLOOR || F.solid[F.i(ex + dx, ey + 3)]) return null;
      }
      for (const x of [ ex - 1, ex + 2 ]) if (!F.in(x, ey + 2) || F.tile(x, ey + 2) === T.WALL) return null;
      if (nearStair(F, ex, ey, 2) || inZone(F, ex, ey, 3) || !farFrom(lv, f, ex + 1, ey + 1, sp)) return null;
      const wall = [];
      for (let dx = -1; dx <= 2; dx++) wall.push([ ex + dx, ey - 1 ]);
      for (const x of [ ex - 1, ex + 2 ]) for (let dy = 0; dy < 2; dy++) wall.push([ x, ey + dy ]);
      let back = 0;
      for (const [x, y] of wall) {
        if (!F.in(x, y)) return null;
        const t = F.tile(x, y);
        if (t === T.WALL) {
          if (y === ey - 1) back++; else score += 2;
          continue;
        }
        if (!freeX(F, x, y) || h.nearDoor(F, x, y)) return null;
        conv.push([ f, x, y ]);
        score -= 1;
      }
      if (back === 4) score += 10; else if (back === 0) score -= 4;
    }
    return {
      ex,
      ey,
      score,
      conv
    };
  }
  function pickLift(s, lv, fl, rng) {
    const F0 = lv.floors[fl[0]], sp = spots(s), L = [];
    for (let ey = 2; ey < F0.H - 4; ey++) for (let ex = 2; ex < F0.W - 3; ex++) {
      const c = liftAt(lv, fl, ex, ey, sp);
      if (c) L.push(c);
    }
    if (!L.length) return null;
    L.sort((a, b) => b.score - a.score || a.ey - b.ey || a.ex - b.ex);
    const top = L.filter(c => c.score >= L[0].score - 3).slice(0, 24), rest = L.slice(top.length, top.length + 200);
    for (let i = top.length - 1; i > 0; i--) {
      const j = rng.i(i + 1), t = top[i];
      top[i] = top[j];
      top[j] = t;
    }
    for (const c of top.concat(rest)) {
      let good = true;
      for (const f of fl) {
        const F = lv.floors[f], blk = new Set;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) blk.add(F.i(c.ex + dx, c.ey + dy));
        for (const [g, x, y] of c.conv) if (g === f) blk.add(F.i(x, y));
        if (!linked(F, blk)) {
          good = false;
          break;
        }
      }
      if (good) return c;
    }
    return null;
  }
  function pickGen(s, lv, gf, lift, rng) {
    const F = lv.floors[gf], T = h.T_(), sp = spots(s), L = [];
    if (!F) return null;
    for (let y = 2; y < F.H - 3; y++) for (let x = 2; x < F.W - 3; x++) {
      let ok = true, sc = 0;
      for (let dx = 0; dx < 2 && ok; dx++) {
        if (!freeX(F, x + dx, y) || h.nearDoor(F, x + dx, y) || badRoom(F, x + dx, y)) ok = false; else if (!freeX(F, x + dx, y + 1)) ok = false;
        if (ok && F.tile(x + dx, y - 1) === T.WALL) sc += 3;
      }
      if (!ok) continue;
      if (nearStair(F, x, y, 2) || inZone(F, x, y, 3) || !farFrom(lv, gf, x + 1, y + .5, sp)) continue;
      if (lift && gf < lv.building.floors && Math.hypot(x + 1 - (lift.ex + 1), y - (lift.ey + 1)) < 6) continue;
      if (lift && lift.conv.some(([g, cx, cy]) => g === gf && Math.abs(cx - x) < 3 && Math.abs(cy - y) < 3)) continue;
      L.push({
        x,
        y,
        sc
      });
    }
    if (!L.length) return null;
    L.sort((a, b) => b.sc - a.sc || a.y - b.y || a.x - b.x);
    const top = L.filter(c => c.sc >= L[0].sc - 1).slice(0, 24), rest = L.slice(top.length, top.length + 200);
    for (let i = top.length - 1; i > 0; i--) {
      const j = rng.i(i + 1), t = top[i];
      top[i] = top[j];
      top[j] = t;
    }
    for (const c of top.concat(rest)) if (linked(F, new Set([ F.i(c.x, c.y), F.i(c.x + 1, c.y) ]))) return c;
    return null;
  }
  function solidSync(s, R) {
    for (const f of R.fl) {
      const F = s.lv.floors[f], v = here(R, f) ? 0 : 1;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) F.solid[F.i(R.ex + dx, R.ey + dy)] = v;
    }
  }
  function genOn(s, R, by, quiet) {
    if (R.g) return;
    R.g = true;
    R.by = by;
    if (!quiet) {
      SX.audio.play("misGenStart", {
        x: R.gx + 1,
        y: R.gy + .5,
        f: R.gf,
        range: 40,
        vol: 1
      });
      const p = PL();
      if (by === h.me()) SX.log("⚡ 비상 발전기가 돌기 시작했습니다 — " + (fire(s) ? "불이 났을 때는 승강기를 타지 않습니다" : "승강기에 전기가 들어왔습니다"), "good"); else if (p) SX.log("⚡ 어디선가 발전기가 돌기 시작했습니다" + (fire(s) ? "" : " — 승강기에 전기가 들어왔습니다"), "warn");
      if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    }
    if (h.isAuth() && !fire(s)) {
      setPh(s, R, "open", R.cf, R.cf, quiet, false);
      bcast(R);
    }
  }
  function bcast(R) {
    M.sendK("power", {
      q: "el",
      ph: R.ph,
      cf: R.cf,
      to: R.to
    });
  }
  function setPh(s, R, ph, cf, to, quiet, arr) {
    const A = h.A_(), p = PL(), cx = R.ex + 1, cy = R.ey + 1;
    if (ph === "close") {
      R.ph = "close";
      R.cf = cf;
      R.to = to;
      R.t = 0;
      R.ride = null;
      if (p && p.alive && p.floor === cf) {
        if (inCab(R, p.x, p.y)) R.ride = {
          from: cf,
          to
        }; else if (p.x > R.ex - .35 && p.x < R.ex + 2.35 && p.y >= R.ey + 2 && p.y < R.ey + 2.36) p.y = R.ey + 2.36;
      }
      if (h.isAuth()) {
        const F = s.lv.floors[cf];
        for (const e of A.enemies) if (e.alive && e.floor === cf && e.x > R.ex - .3 && e.x < R.ex + 2.3 && e.y > R.ey - .3 && e.y < R.ey + 2.3) {
          e.y = R.ey + 2.5;
          e.path = null;
          h.unstick(F, e);
        }
      }
      solidSync(s, R);
      if (!quiet) h.play("misLiftClose", cf, cx, cy + 1, 12, .8);
    } else if (ph === "move") {
      R.ph = "move";
      R.t = 0;
      R.to = to;
      if (!quiet && R.ride) SX.audio.play("misLiftMove", {
        vol: .8
      });
      if (R.ride && SX.view && SX.view.shake) SX.view.shake(2.5);
    } else if (ph === "open") {
      const from = R.cf;
      R.ph = "open";
      R.cf = cf;
      R.to = cf;
      R.t = 0;
      solidSync(s, R);
      if (arr && R.ride && p) {
        const rd = R.ride;
        R.ride = null;
        if (p.alive && p.floor === rd.from && rd.to === cf) {
          p.floor = cf;
          p.reload = null;
          if (SX.light) SX.light.box = null;
          if (SX.view && SX.view.snap) SX.view.snap();
          SX.log("▶ " + flName(R, cf));
          R.fxOut = OPEN_T;
          if (SX.view && SX.view.shake) SX.view.shake(2.5);
          if (R.qid && M.mine(R.qid) && from !== cf) {
            const st = M.state(R.qid);
            if (st && !st.ok && !st.fail) M.ok(R.qid, "승강기를 탔습니다", true);
          }
        }
      } else R.ride = null;
      if (!quiet && arr) {
        h.play("misLiftOpen", cf, cx, cy + 1, 12, .8);
        h.play("misDing", cf, cx, cy, 18, .8, .15);
        if (h.isAuth()) A.noise(s.lv.floors[cf], cx, cy + 1, 14);
      } else if (!quiet) h.play("misLiftOpen", cf, cx, cy + 1, 12, .6);
    } else if (ph === "idle") {
      R.ph = "idle";
      R.t = 0;
      R.cf = cf;
      R.to = cf;
      solidSync(s, R);
    }
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
  }
  function reqGo(s, R, to) {
    if (!R.g || fire(s) || busy(R) || R.fl.indexOf(to) < 0 || to === R.cf) return false;
    setPh(s, R, "close", R.cf, to, false, false);
    bcast(R);
    return true;
  }
  function request(s, R, to) {
    if (h.isAuth()) reqGo(s, R, to); else M.sendK("power", {
      q: "go",
      to
    }, h.R_().auth);
  }
  let keyFn = null;
  function picker(s, R) {
    const rows = R.fl.map(f => '<button class="big" data-mlf="' + f + '"' + (f === R.cf ? " disabled" : "") + ">" + h.esc(flName(R, f)) + (f < 9 ? " [" + (f + 1) + "]" : "") + "</button>").join("");
    const html = '<div class="win" style="min-width:calc(var(--u)*150);max-width:calc(var(--u)*220)"><header><h2>🛗 승강기 — 층 고르기</h2><button class="x" data-close>닫기 ✕</button></header>' + '<div class="body col"><p>지금 ' + h.esc(flName(R, R.cf)) + "입니다. 갈 층을 누르십시오(숫자 키로도 고릅니다).</p>" + '<div style="display:grid;grid-template-columns:repeat(' + Math.min(3, R.fl.length) + ',1fr);gap:calc(var(--u)*3)">' + rows + "</div></div></div>";
    const go = f => {
      if (R.fl.indexOf(f) < 0 || f === R.cf) return;
      SX.ui.closePanel();
      const p = PL();
      if (!p || !p.alive || p.down || !inCab(R, p.x, p.y) || p.floor !== R.cf) return;
      M.pose("btn");
      M.pose(null, .6);
      request(s, R, f);
    };
    SX.ui.open("misLift", html, () => {
      if (keyFn) {
        window.removeEventListener("keydown", keyFn, true);
        keyFn = null;
      }
    });
    const pan = document.getElementById("panel");
    if (pan) for (const b of pan.querySelectorAll("[data-mlf]")) b.addEventListener("click", () => go(+b.dataset.mlf));
    if (keyFn) window.removeEventListener("keydown", keyFn, true);
    keyFn = e => {
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || "");
      if (!m) return;
      const f = +m[1] - 1;
      if (R.fl.indexOf(f) < 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      go(f);
    };
    window.addEventListener("keydown", keyFn, true);
  }
  M.K.power = {
    setup(s, lv, rng) {
      const b = lv.building;
      if (!b || !BLD[b.id] || (b.floors | 0) < 3) return null;
      const q = SX.prog.MIS_Q.find(x => x.kind === "power" && x.b === s.b);
      const nf = b.floors | 0, fl = [];
      for (let f = 0; f < nf; f++) if (lv.floors[f]) fl.push(f);
      let pl = lv.misPow;
      if (!pl) {
        const lift = pickLift(s, lv, fl, rng);
        let gf = lv.parkIdx != null && lv.floors[lv.parkIdx] ? lv.parkIdx : 0, gen = lift ? pickGen(s, lv, gf, lift, rng) : null;
        if (lift && !gen && gf !== 0) {
          gf = 0;
          gen = pickGen(s, lv, gf, lift, rng);
        }
        pl = lv.misPow = lift && gen ? {
          ex: lift.ex,
          ey: lift.ey,
          conv: lift.conv,
          gf,
          gx: gen.x,
          gy: gen.y
        } : {
          none: true
        };
        if (!pl.none) {
          const A = h.A_();
          for (const [f, x, y] of pl.conv) {
            const F = lv.floors[f];
            F.solid[F.i(x, y)] = 1;
          }
          const G = lv.floors[pl.gf];
          G.solid[G.i(pl.gx, pl.gy)] = 1;
          G.solid[G.i(pl.gx + 1, pl.gy)] = 1;
          for (const f of fl) {
            const F = lv.floors[f];
            for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) F.solid[F.i(pl.ex + dx, pl.ey + dy)] = 1;
            h.inval(F);
          }
          for (const e of A.enemies) if (e.alive && lv.floors[e.floor]) h.unstick(lv.floors[e.floor], e);
        }
      }
      if (pl.none) return {
        none: true,
        qid: q ? q.id : null
      };
      const R = {
        qid: q ? q.id : null,
        fl,
        ex: pl.ex,
        ey: pl.ey,
        gf: pl.gf,
        gx: pl.gx,
        gy: pl.gy,
        fire: fire(s),
        g: false,
        by: null,
        cf: 0,
        ph: "idle",
        t: 0,
        to: 0,
        ride: null,
        pulls: 0
      };
      solidSync(s, R);
      const mk = (y, fi, fn) => ({
        kind: "misdev",
        misK: "power",
        x: R.ex + 1,
        y,
        floor: fi,
        alive: true,
        r: .3,
        misDraw: (ctx, a, cam, now) => fn(ctx, s, R, fi, cam, now)
      });
      R.acts = new Map;
      for (const f of fl) R.acts.set(f, [ mk(R.ey + .001, f, drawIn), mk(R.ey + 1.998, f, drawCap), mk(R.ey + 1.999, f, drawFront) ]);
      R.hz = new Set(pl.conv.map(([f, x, y]) => f + ":" + x + "," + y));
      for (const [f, x, y] of pl.conv) if (R.acts.has(f)) R.acts.get(f).push({
        kind: "misdev",
        misK: "power",
        x: x + .5,
        y: y + .997,
        floor: f,
        alive: true,
        r: .3,
        misDraw: (ctx, a, cam) => drawHouse(ctx, s, R, f, x, y, cam)
      });
      R.gAct = {
        kind: "misdev",
        misK: "power",
        x: R.gx + 1,
        y: R.gy + .98,
        floor: R.gf,
        alive: true,
        r: .3,
        misDraw: (ctx, a, cam, now) => drawGen(ctx, s, R, cam, now)
      };
      return R;
    },
    trk(s, q) {
      const R = st0(s);
      if (!R || R.none || R.qid !== q.id) return null;
      if (!R.g) return {
        t: q.name + " — " + flName(R, R.gf) + " 비상 발전기 돌리기"
      };
      return {
        t: q.name + " — 승강기 한 번 타기"
      };
    },
    okText: () => "승강기를 탔습니다",
    blocked(s, q) {
      const R = st0(s);
      if (fire(s)) return "불이 났을 때는 승강기를 타지 않습니다 — 이 판에서는 할 수 없습니다";
      if (flood(s)) return "지하 전기실이 물에 잠겨 발전기가 돌지 않습니다 — 이 판에서는 할 수 없습니다";
      if (!R || R.none) return "이 판에서는 할 수 없습니다";
      return "";
    },
    target(s, F, p, put) {
      const R = st0(s);
      if (!R || R.none) return;
      const k = "[" + h.key() + "]";
      if (F.idx === R.gf) {
        const d = Math.hypot(R.gx + 1 - p.x, R.gy + .5 - p.y);
        if (d <= REACH + .4) {
          const lab = R.g ? "⚡ 비상 발전기 — 돌고 있습니다" : flood(s) ? "⚡ 비상 발전기 — 지하 전기실이 물에 잠겨 돌지 않습니다" : "⚡ 비상 발전기 — 시동 줄 당기기 " + k + " " + GEN_T + "초 누르고 있기";
          put({
            kd: "power",
            sub: "gen",
            x: R.gx + 1,
            y: R.gy - .9,
            label: lab
          }, [ R.gx, R.gy - 1.2, R.gx + 2, R.gy + 1 ], d);
        }
      }
      if (R.fl.indexOf(F.idx) < 0) return;
      if (inCab(R, p.x, p.y) && here(R, F.idx)) {
        const lab = fire(s) ? "🛗 승강기 — 불이 났을 때는 승강기를 타지 않습니다" : "🛗 승강기 — 층 고르기 " + k;
        put({
          kd: "power",
          sub: "in",
          x: R.ex + 1,
          y: R.ey - .6,
          label: lab
        }, [ R.ex, R.ey - .8, R.ex + 2, R.ey + 2 ], .2);
        return;
      }
      if (Math.abs(p.x - (R.ex + 1)) <= 1.7 && p.y >= R.ey + 2 && p.y <= R.ey + 3.7 && !(here(R, F.idx) && !fire(s))) {
        const d = Math.hypot(p.x - (R.ex + 1), p.y - (R.ey + 2.3));
        const lab = fire(s) ? "🛗 승강기 — 불이 났을 때는 승강기를 타지 않습니다" : !R.g ? "🛗 승강기 — 전기가 없습니다" : busy(R) ? "🛗 승강기 — 움직이는 중" : "🛗 승강기 부르기 " + k;
        put({
          kd: "power",
          sub: "call",
          x: R.ex + 1,
          y: R.ey + 1.4,
          label: lab
        }, [ R.ex - .5, R.ey + .5, R.ex + 2.5, R.ey + 2.6 ], d);
      }
    },
    interact(s, t) {
      const R = st0(s);
      if (!R || R.none || M.jobOn()) return;
      const p = PL();
      if (!p) return;
      if (t.sub === "gen") {
        if (R.g) {
          SX.log("⚡ 발전기는 이미 돌고 있습니다", "warn");
          return;
        }
        if (flood(s)) {
          SX.log("⚡ 지하 전기실이 물에 잠겨 발전기가 돌지 않습니다", "warn");
          SX.audio.play("denied");
          return;
        }
        M.job({
          k: "power",
          T: GEN_T,
          hold: true,
          pose: "cord",
          keep: .3,
          pn: 0,
          label: l => "⚡ 시동 줄 당기는 중 … " + l.toFixed(1),
          ok: () => !R.g,
          tick: (dt, j) => {
            if (j.pn < 3 && j.t >= .2 + 2 * j.pn) {
              j.pn++;
              R.pulls++;
              SX.audio.play("misGenPull", {
                x: R.gx + 1,
                y: R.gy + .5,
                f: R.gf,
                range: 16,
                vol: .9
              });
              h.A_().noise(s.lv.floors[R.gf], R.gx + 1, R.gy + .5, 8);
              M.sendK("power", {
                q: "pull"
              });
            }
          },
          done: () => {
            const by = h.me();
            h.A_().noise(s.lv.floors[R.gf], R.gx + 1, R.gy + .5, 30);
            genOn(s, R, by, false);
            M.sendK("power", {
              q: "gen",
              by
            });
          }
        });
        return;
      }
      if (fire(s)) {
        SX.log("🛗 불이 났을 때는 승강기를 타지 않습니다", "warn");
        SX.audio.play("denied");
        return;
      }
      if (t.sub === "in") {
        if (busy(R)) return;
        picker(s, R);
        return;
      }
      if (t.sub === "call") {
        if (!R.g) {
          SX.log("🛗 전기가 없습니다 — 발전기를 먼저 돌려야 합니다(" + flName(R, R.gf) + ")", "warn");
          SX.audio.play("denied");
          return;
        }
        if (busy(R)) {
          SX.log("🛗 승강기가 움직이는 중입니다", "warn");
          return;
        }
        M.pose("btn");
        M.pose(null, .6);
        h.play("beep", p.floor, R.ex + 1, R.ey + 2, 6, .4);
        if (R.cf !== p.floor) request(s, R, p.floor);
      }
    },
    tick(s, dt, auth) {
      const R = st0(s);
      if (!R || R.none) return;
      const p = PL();
      R.t += dt;
      if (R.fxOut > 0) R.fxOut = Math.max(0, R.fxOut - dt);
      if (R.ride && R.ph === "move" && p && p.floor === R.ride.from && SX.view) {
        const k = 1.2 * (SX.opts && SX.opts.shake != null ? SX.opts.shake : 1);
        if (SX.view.shakeA < k) SX.view.shakeA = k;
      }
      if (auth) {
        if (R.ph === "close" && R.t >= CLOSE_T) {
          setPh(s, R, "move", R.cf, R.to, false, false);
          bcast(R);
        } else if (R.ph === "move" && R.t >= MOVE_T) {
          setPh(s, R, "open", R.to, R.to, false, true);
          bcast(R);
        } else if (R.ph === "open" && R.t >= OPEN_T) {
          setPh(s, R, "idle", R.cf, R.cf, true, false);
          bcast(R);
        }
      }
      if (SX.audio && SX.audio.spotLoop) {
        const want = R.g && p && Math.abs(p.floor - R.gf) <= 1 && !SX.raid.over;
        if (want) SX.audio.spotLoop("misGen", "misGenRun", {
          x: R.gx + 1,
          y: R.gy + .5,
          f: R.gf,
          range: 22,
          vol: .9
        }); else if (R.loopOn) SX.audio.spotLoop("misGen");
        R.loopOn = !!want;
      }
    },
    onPeer(s, from) {
      const R = st0(s);
      if (!R || R.none || !h.isAuth() || !R.g) return;
      M.sendK("power", {
        q: "sy",
        g: 1,
        by: R.by,
        cf: R.cf,
        ph: R.ph,
        to: R.to
      }, from);
    },
    onMsg(s, from, d) {
      const R = st0(s);
      if (!R || R.none) return;
      const okF = f => typeof f === "number" && R.fl.indexOf(f) >= 0;
      if (d.q === "pull") {
        SX.audio.play("misGenPull", {
          x: R.gx + 1,
          y: R.gy + .5,
          f: R.gf,
          range: 16,
          vol: .9
        });
      } else if (d.q === "gen") genOn(s, R, d.by != null ? d.by : from, false); else if (d.q === "go") {
        if (h.isAuth() && okF(d.to)) reqGo(s, R, d.to);
      } else if (d.q === "el") {
        if (h.isAuth() || !okF(d.cf) || !okF(d.to)) return;
        if (!R.g) genOn(s, R, R.by, false);
        if (d.ph === "close") setPh(s, R, "close", d.cf, d.to, false, false); else if (d.ph === "move") {
          if (R.ph !== "close") {
            R.cf = d.cf;
          }
          setPh(s, R, "move", d.cf, d.to, false, false);
        } else if (d.ph === "open") setPh(s, R, "open", d.cf, d.cf, false, R.ph === "move" || R.ph === "close" || !!R.ride); else if (d.ph === "idle") setPh(s, R, "idle", d.cf, d.cf, true, false);
      } else if (d.q === "sy") {
        if (h.isAuth() || !okF(d.cf)) return;
        if (d.g && !R.g) genOn(s, R, d.by, true);
        R.cf = d.cf;
        R.to = okF(d.to) ? d.to : d.cf;
        R.ph = [ "idle", "open", "close", "move" ].indexOf(d.ph) >= 0 ? d.ph : "idle";
        R.t = 0;
        solidSync(s, R);
      }
    },
    hud(s) {
      const R = st0(s);
      if (!R || R.none) return null;
      if (R.ride) return {
        text: "🛗 승강기 — " + flName(R, R.ride.to) + "으로 갑니다",
        col: null
      };
      return null;
    },
    marks(s, out) {
      const R = st0(s);
      if (!R || R.none || !R.qid || !M.teamHas(R.qid)) return;
      const st = M.state(R.qid);
      if (st && st.ok) return;
      if (!R.g) out.push({
        f: R.gf,
        x: R.gx + 1,
        y: R.gy + .5,
        col: "rgb(255,210,90)",
        label: "⚡ 발전기"
      });
      for (const f of R.fl) out.push({
        f,
        x: R.ex + 1,
        y: R.ey + 1,
        col: "rgb(160,200,230)",
        label: "🛗 승강기"
      });
    },
    pois(s, f, o) {
      const R = st0(s);
      if (!R || R.none || !R.qid || !M.teamHas(R.qid)) return;
      const st = M.state(R.qid);
      if (st && st.ok) return;
      if (!R.g && f === R.gf) o.push({
        kind: "ping",
        x: R.gx + 1,
        y: R.gy + .5
      });
      if (R.fl.indexOf(f) >= 0) o.push({
        kind: "ping",
        x: R.ex + 1,
        y: R.ey + 1
      });
    },
    actors(s, fi) {
      const R = st0(s);
      if (!R || R.none) return [];
      const o = (R.acts.get(fi) || []).slice();
      if (fi === R.gf) o.push(R.gAct);
      return o;
    },
    dump(s) {
      const R = st0(s);
      if (!R || R.none) return {
        none: 1
      };
      return {
        g: R.g ? 1 : 0,
        by: R.by,
        cf: R.cf,
        ph: R.ph,
        to: R.to
      };
    },
    worldIn(s, w) {
      const R = st0(s);
      if (!R || R.none || !w || !w.g) return;
      if (!R.g) genOn(s, R, w.by, true);
      const cf = R.fl.indexOf(w.cf) >= 0 ? w.cf : 0, to = R.fl.indexOf(w.to) >= 0 ? w.to : cf;
      R.ride = null;
      R.t = 0;
      R.fxOut = 0;
      if (w.ph === "close" || w.ph === "move") {
        R.cf = to;
        R.to = to;
        R.ph = "idle";
      } else {
        R.cf = cf;
        R.to = cf;
        R.ph = "idle";
      }
      solidSync(s, R);
    },
    fx(s, ctx, cam, vw, vh, F, now) {
      const R = st0(s);
      if (!R || R.none || !F) return;
      const p = PL();
      if (!p || !p.alive) return;
      let a = 0, mv = false;
      if (R.ride && p.floor === R.ride.from && F.idx === R.cf) {
        if (R.ph === "close") {
          const k = Math.min(1, R.t / CLOSE_T);
          a = k * k * (3 - 2 * k);
        } else if (R.ph === "move") {
          a = 1;
          mv = true;
        }
      } else if (R.fxOut > 0 && F.idx === R.cf && p.floor === R.cf) {
        const k = R.fxOut / OPEN_T;
        a = k * k;
      }
      if (a <= .01) return;
      const TS = TS_(), WH = F.wallH || 24, x0 = Math.round(R.ex * TS - cam.x), x1 = x0 + TS * 2, y1 = Math.round((R.ey + 2) * TS - cam.y), y0 = Math.round(R.ey * TS - cam.y) - WH - 14;
      const fr = (x, y, w, h) => {
        if (w > 0 && h > 0) ctx.fillRect(x, y, w, h);
      };
      const ring = (o, i) => {
        fr(o[0], o[1], o[2] - o[0], i[1] - o[1]);
        fr(o[0], i[3], o[2] - o[0], o[3] - i[3]);
        fr(o[0], i[1], i[0] - o[0], i[3] - i[1]);
        fr(i[2], i[1], o[2] - i[2], i[3] - i[1]);
      };
      const box = d => [ x0 - d, y0 - d, x1 + d, y1 + d ], A = .88 * a;
      ctx.save();
      ctx.fillStyle = "rgba(4,6,9," + A.toFixed(3) + ")";
      ring([ 0, 0, vw, vh ], box(9));
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = "rgba(4,6,9," + (A * (k + 1) / 4).toFixed(3) + ")";
        ring(box(3 * k + 3), box(3 * k));
      }
      if (mv) {
        const e = Math.max(0, Math.min(1, R.t / .45, (MOVE_T - R.t) / .45)), H = y1 - y0, per = 30, dir = R.to > R.cf ? 1 : -1;
        const off = (Math.round(R.t * 58) * dir % per + per) % per;
        ctx.beginPath();
        ctx.rect(x0, y0, x1 - x0, H);
        ctx.clip();
        for (let yy = y0 - per + off; yy < y1; yy += per) {
          ctx.fillStyle = "rgba(4,6,9," + (.34 * e).toFixed(3) + ")";
          ctx.fillRect(x0, yy, x1 - x0, 6);
          ctx.fillStyle = "rgba(4,6,9," + (.17 * e).toFixed(3) + ")";
          ctx.fillRect(x0, yy - 3, x1 - x0, 3);
          ctx.fillRect(x0, yy + 6, x1 - x0, 3);
          ctx.fillStyle = "rgba(255,214,150," + (.09 * e).toFixed(3) + ")";
          ctx.fillRect(x0, yy + 15, x1 - x0, 1);
        }
      }
      ctx.restore();
    },
    onEnd(s) {
      const R = st0(s);
      if (R && R.loopOn && SX.audio && SX.audio.spotLoop) {
        SX.audio.spotLoop("misGen");
        R.loopOn = false;
      }
      if (keyFn) {
        window.removeEventListener("keydown", keyFn, true);
        keyFn = null;
      }
    }
  };
  function openK(R, f) {
    if (!R.g || f !== R.cf) return 0;
    if (R.ph === "idle") return 1;
    if (R.ph === "open") return Math.min(1, R.t / OPEN_T);
    if (R.ph === "close") return Math.max(0, 1 - R.t / CLOSE_T);
    return 0;
  }
  const DIG = {
    0: [ 7, 5, 5, 5, 7 ],
    1: [ 2, 6, 2, 2, 7 ],
    2: [ 7, 1, 7, 4, 7 ],
    3: [ 7, 1, 7, 1, 7 ],
    4: [ 5, 5, 7, 1, 1 ],
    5: [ 7, 4, 7, 1, 7 ],
    6: [ 7, 4, 7, 5, 7 ],
    7: [ 7, 1, 2, 2, 2 ],
    8: [ 7, 5, 7, 5, 7 ],
    9: [ 7, 5, 7, 1, 7 ],
    B: [ 6, 5, 6, 5, 6 ]
  };
  function digits(ctx, str, x, y, col) {
    ctx.fillStyle = col;
    for (let k = 0; k < str.length; k++) {
      const g = DIG[str[k]];
      if (!g) continue;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r] & 4 >> c) ctx.fillRect(x + k * 4 + c, y + r, 1, 1);
    }
  }
  const STEEL = {
    ol: "#3d4449",
    dk: "#5d656a",
    md: "#7d868c",
    ln: "#737b81",
    hi: "#a3abb0",
    pl: "#8b9399",
    rl: "#c4cacd"
  };
  function drawIn(ctx, s, R, f, cam) {
    if (!R.g || f !== R.cf) return;
    const TS = TS_(), WH = s.lv.floors[f].wallH || 24, X = Math.round(R.ex * TS - cam.x), Y = Math.round(R.ey * TS - cam.y), W = TS * 2;
    ctx.fillStyle = "#3a3f44";
    ctx.fillRect(X, Y, W, TS * 2);
    ctx.fillStyle = "#50565c";
    for (let yy = 2; yy < TS * 2; yy += 6) for (let xx = (yy / 6 | 0) % 2 ? 4 : 1; xx < W; xx += 6) ctx.fillRect(X + xx, Y + yy, 2, 1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(X, Y, W, 3);
    const BY = Y - WH;
    ctx.fillStyle = STEEL.pl;
    ctx.fillRect(X, BY, W, WH);
    ctx.fillStyle = STEEL.ln;
    ctx.fillRect(X + TS - 1, BY, 2, WH);
    ctx.fillRect(X, BY, W, 1);
    ctx.fillStyle = STEEL.hi;
    ctx.fillRect(X + 2, BY + 2, TS - 4, 1);
    ctx.fillRect(X + TS + 2, BY + 2, TS - 4, 1);
    ctx.fillStyle = STEEL.dk;
    ctx.fillRect(X + 3, BY + WH - 10, W - 6, 3);
    ctx.fillStyle = STEEL.rl;
    ctx.fillRect(X + 3, BY + WH - 10, W - 6, 1);
    ctx.fillStyle = STEEL.ol;
    ctx.fillRect(X, BY, 1, WH);
    ctx.fillRect(X + W - 1, BY, 1, WH);
  }
  function drawCap(ctx, s, R, f, cam) {
    const p = PL();
    if (openK(R, f) > .02) return;
    if (R.ride && p && p.floor === f) return;
    const TS = TS_(), WH = s.lv.floors[f].wallH || 24, X = Math.round(R.ex * TS - cam.x), Y = Math.round(R.ey * TS - cam.y) - WH, W = TS * 2, H = TS * 2;
    ctx.fillStyle = "#2c3034";
    ctx.fillRect(X, Y, W, H);
    ctx.fillStyle = "#363b40";
    ctx.fillRect(X + 2, Y + 2, W - 4, H - 4);
    ctx.fillStyle = "#2c3034";
    ctx.fillRect(X + TS - 1, Y + 2, 2, H - 4);
    ctx.fillRect(X + 2, Y + TS - 1, W - 4, 2);
    ctx.fillStyle = "#4a5056";
    for (const [rx, ry] of [ [ 4, 4 ], [ W - 6, 4 ], [ 4, H - 6 ], [ W - 6, H - 6 ], [ TS - 4, TS - 4 ], [ TS + 2, TS + 2 ] ]) ctx.fillRect(X + rx, Y + ry, 2, 2);
    ctx.fillStyle = "#454b51";
    ctx.fillRect(X, Y, W, 1);
    ctx.fillRect(X, Y, 1, H);
    ctx.fillRect(X + W - 1, Y, 1, H);
  }
  function drawFront(ctx, s, R, f, cam, now) {
    const TS = TS_(), F = s.lv.floors[f], WH = F.wallH || 24, X = Math.round(R.ex * TS - cam.x), BOT = Math.round((R.ey + 2) * TS - cam.y), Y = BOT - WH, W = TS * 2;
    const k = openK(R, f);
    if (k < .999) {
      const pw = Math.round(TS * (1 - k));
      for (const sd of [ 0, 1 ]) {
        const x0 = sd ? X + W - pw : X;
        if (pw <= 0) continue;
        ctx.fillStyle = STEEL.md;
        ctx.fillRect(x0, Y, pw, WH);
        ctx.fillStyle = STEEL.hi;
        ctx.fillRect(x0, Y + 1, pw, 1);
        ctx.fillRect(sd ? x0 + pw - 3 : x0 + 2, Y + 2, 1, WH - 6);
        ctx.fillStyle = STEEL.ln;
        for (let yy = Y + 6; yy < BOT - 6; yy += 6) ctx.fillRect(x0 + 1, yy, pw - 2, 1);
        ctx.fillStyle = STEEL.dk;
        ctx.fillRect(x0, BOT - 4, pw, 4);
        ctx.fillStyle = STEEL.ol;
        ctx.fillRect(sd ? x0 : x0 + pw - 1, Y, 1, WH);
      }
      if (k <= .001) {
        ctx.fillStyle = STEEL.ol;
        ctx.fillRect(X + TS - 1, Y, 2, WH);
      }
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(X, BOT - 3, W, 1);
    }
    ctx.fillStyle = STEEL.dk;
    ctx.fillRect(X, BOT - 2, W, 2);
    ctx.fillStyle = STEEL.hi;
    ctx.fillRect(X, BOT - 2, W, 1);
    ctx.fillStyle = STEEL.ol;
    ctx.fillRect(X - 1, Y, 1, WH);
    ctx.fillRect(X + W, Y, 1, WH);
    const on = R.g && !fire(s);
    const bx = X - TS + 11, by = Y + 4;
    ctx.fillStyle = "#3d4449";
    ctx.fillRect(bx, by, 11, 9);
    ctx.fillStyle = "#14181b";
    ctx.fillRect(bx + 1, by + 1, 9, 7);
    const showF = R.ph === "move" && Math.floor(now * 2) % 2 ? R.to : R.cf, lb = String(showF + 1);
    digits(ctx, lb.length > 2 ? lb.slice(-2) : lb, bx + 1 + (lb.length > 1 ? 0 : 3), by + 2, on ? "#ffb43a" : "#3a2a14");
    if (on && R.ph === "move") {
      ctx.fillStyle = "#ffb43a";
      const up = R.to > R.cf;
      ctx.fillRect(bx + 5, up ? by - 3 : by + 10, 1, 1);
      ctx.fillRect(bx + 4, up ? by - 2 : by + 11, 3, 1);
    }
    const cx = X + W + 10, cy = Y + 6;
    ctx.fillStyle = "#3d4449";
    ctx.fillRect(cx, cy, 7, 11);
    ctx.fillStyle = "#7d868c";
    ctx.fillRect(cx + 1, cy + 1, 5, 9);
    const lit = on && busy(R) && f !== R.cf;
    ctx.fillStyle = lit ? "#ffd37a" : on ? "#d8dcdf" : "#5d656a";
    ctx.fillRect(cx + 2, cy + 2, 3, 3);
    ctx.fillRect(cx + 2, cy + 6, 3, 3);
    ctx.fillStyle = STEEL.ol;
    ctx.fillRect(cx + 3, cy + 3, 1, 1);
    ctx.fillRect(cx + 3, cy + 7, 1, 1);
  }
  function drawHouse(ctx, s, R, f, x, y, cam) {
    const TS = TS_(), F = s.lv.floors[f], WH = F.wallH || 24, T = h.T_();
    const shut = (xx, yy) => R.hz.has(f + ":" + xx + "," + yy) || F.in(xx, yy) && F.tile(xx, yy) === T.WALL || xx >= R.ex && xx < R.ex + 2 && yy >= R.ey && yy < R.ey + 2;
    const X = Math.round(x * TS - cam.x), Y = Math.round(y * TS - cam.y) - WH, up = shut(x, y - 1), dn = shut(x, y + 1), lf = shut(x - 1, y), rt = shut(x + 1, y);
    ctx.fillStyle = "#2c3034";
    ctx.fillRect(X, Y, TS, TS);
    ctx.fillStyle = "#363b40";
    ctx.fillRect(X + (lf ? 0 : 2), Y + (up ? 0 : 2), TS - (lf ? 0 : 2) - (rt ? 0 : 2), TS - (up ? 0 : 2) - (dn ? 0 : 2));
    ctx.fillStyle = "#4a5056";
    ctx.fillRect(X + 4, Y + 4, 2, 2);
    ctx.fillRect(X + TS - 6, Y + TS - 6, 2, 2);
    ctx.fillStyle = "#454b51";
    if (!up) ctx.fillRect(X, Y, TS, 1);
    if (!lf) ctx.fillRect(X, Y, 1, TS);
    if (!rt) ctx.fillRect(X + TS - 1, Y, 1, TS);
    if (dn) return;
    const FY = Y + TS;
    ctx.fillStyle = STEEL.dk;
    ctx.fillRect(X, FY, TS, WH);
    ctx.fillStyle = STEEL.md;
    ctx.fillRect(X + 1, FY + 1, TS - 2, WH - 5);
    ctx.fillStyle = STEEL.hi;
    ctx.fillRect(X + 1, FY + 1, TS - 2, 1);
    ctx.fillStyle = STEEL.ln;
    for (let yy = FY + 7; yy < FY + WH - 5; yy += 7) ctx.fillRect(X + 2, yy, TS - 4, 1);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(X, FY + WH - 4, TS, 4);
    ctx.fillStyle = STEEL.ol;
    if (!lf) ctx.fillRect(X, FY, 1, WH);
    if (!rt) ctx.fillRect(X + TS - 1, FY, 1, WH);
  }
  function drawGen(ctx, s, R, cam, now) {
    const sp = SX.art.prop("generator", 0);
    if (!sp) return;
    const TS = TS_(), sh = R.g ? Math.floor(now * 24) % 2 : 0;
    const X = Math.round(R.gx * TS - cam.x) + (sp.ox || 0), Y = Math.round(R.gy * TS - cam.y) + sp.oy - sh;
    ctx.drawImage(sp.c, X, Y);
    const B = Y + sp.c.height - 2;
    if (R.g) {
      ctx.fillStyle = Math.floor(now * 3) % 2 ? "#8aff9a" : "#5ae07a";
      ctx.fillRect(X + 38, B - 28, 5, 1);
      ctx.fillStyle = "#5a1a18";
      ctx.fillRect(X + 47, B - 29, 3, 3);
      for (let k = 0; k < 3; k++) {
        const ph = (now * .9 + k / 3) % 1, a = .42 * (1 - ph);
        ctx.fillStyle = "rgba(70,72,76," + a.toFixed(3) + ")";
        const sz = 3 + Math.round(ph * 4);
        ctx.fillRect(X + 54 - (sz >> 1) + Math.round(Math.sin((now + k) * 2) * 2), B - 54 - Math.round(ph * 16), sz, sz);
      }
    } else {
      ctx.fillStyle = "#1e3a22";
      ctx.fillRect(X + 38, B - 28, 5, 1);
      ctx.fillStyle = Math.floor(now * 1.5) % 2 ? "#c83a34" : "#8a2622";
      ctx.fillRect(X + 47, B - 29, 3, 3);
    }
  }
})(window.SX);
