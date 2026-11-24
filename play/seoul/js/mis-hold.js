(function(SX) {
  "use strict";
  const M = SX.mis, h = M.h;
  const HOLD_T = 60, NEAR = 8, REACH = 1.5, ON_T = 2, W_AT = [ 3, 18, 33, 48 ], SYNC = .5, UP = 30;
  const A0 = SX.art;
  if (A0 && A0.defProp && !A0.propSize("misRelay")) A0.defProp("misRelay", 1, 1, UP, (P, w, hh) => {
    const B = hh - 2;
    P.shadow(16, B - 1, 12, 3, .4);
    P.r(6, B - 8, 20, 8, "#3b3a2e").r(6, B - 8, 20, 1, "#57553f").r(7, B - 5, 18, 1, "#2c2b22");
    P.r(9, B - 4, 3, 2, "#6a6852").r(20, B - 4, 3, 2, "#6a6852");
    P.r(5, B - 26, 22, 18, "#5b6340").r(5, B - 26, 22, 2, "#767f54").r(23, B - 24, 4, 16, "#495033");
    P.r(8, B - 22, 13, 9, "#23261c").r(9, B - 21, 7, 3, "#2f4430").r(10, B - 20, 4, 1, "#5f8a5a");
    P.r(9, B - 16, 2, 2, "#8e8c80").r(13, B - 16, 2, 2, "#8e8c80").r(17, B - 16, 2, 2, "#6c6a60");
    P.r(7, B - 11, 18, 1, "#495033").p(6, B - 25, "#8a925f");
    P.r(24, B - 23, 3, 9, "#17191a").r(25, B - 22, 1, 2, "#33383a").r(25, B - 16, 1, 2, "#33383a");
    P.r(25, B - 14, 1, 3, "#202224").r(22, B - 12, 3, 1, "#202224");
    P.r(8, B - 28, 4, 2, "#1d1f1c").r(9, B - 56, 2, 28, "#2b2e2a").r(9, B - 56, 1, 28, "#4a4e48").r(8, B - 57, 4, 2, "#3a3d38");
    P.r(13, B - 25, 6, 1, "#c8c4a8");
  }, {
    noRot: true
  });
  const PL = () => h.A_().player;
  const st0 = s => s.k.hold;
  const teamOf = id => {
    const R = h.R_();
    if (!R) return 0;
    if (id === R.me) return R.team;
    return R.teams && R.teams.has(id) ? R.teams.get(id) : -1;
  };
  const myTeam = () => teamOf(h.me());
  const holds = (s, id, qid) => id === h.me() ? M.mine(qid) : !!(s.have.get(id) && s.have.get(id).ids.indexOf(qid) >= 0);
  const left = R => Math.max(0, Math.ceil(HOLD_T - R.p - 1e-6));
  const near = (R, p, d) => p && p.floor === R.f && Math.hypot(p.x - R.x, p.y - R.y) <= d;
  function walk(F, x, y) {
    if (!F.in(x, y)) return false;
    const T = h.T_(), t = F.tile(x, y);
    return (t === T.GROUND || t === T.FLOOR || t === T.STAIR) && !F.solid[F.i(x, y)];
  }
  function open(F, x, y) {
    const T = h.T_();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (!F.in(X, Y)) return false;
      const i = F.i(X, Y), t = F.tile(X, Y);
      if (!(t === T.GROUND || t === T.FLOOR) || F.solid[i] || F.doorAt.get(i) || F.propAt && F.propAt[i] || h.evNear(F, X, Y)) return false;
    }
    for (const z of F.zones || []) if (x >= z.x - 3 && x < z.x + (z.w || 1) + 3 && y >= z.y - 3 && y < z.y + (z.h || 1) + 3) return false;
    if (F.zip && Math.hypot(x + .5 - F.zip.x, y + .5 - F.zip.y) < 5) return false;
    return true;
  }
  function pass(F, x, y) {
    if (!F.in(x, y)) return false;
    const T = h.T_(), i = F.i(x, y), t = F.tile(x, y);
    if (t === T.DOOR) {
      const d = F.doorAt.get(i);
      return !d || !d.locked;
    }
    return (t === T.GROUND || t === T.FLOOR || t === T.STAIR) && !F.solid[i];
  }
  function pick(lv, rng) {
    const b = lv.building, RF = lv.floors[lv.roofIdx];
    let F = RF, from = RF && RF.hut && RF.hut.x > 0 ? {
      x: Math.floor(RF.hut.x),
      y: Math.floor(RF.hut.y)
    } : null;
    if (!from) {
      F = lv.floors[Math.max(0, (b.floors | 0) - 1)];
      const st = F && F.stairs && F.stairs[0];
      if (!st) return null;
      from = {
        x: Math.floor(st.x + st.w / 2),
        y: Math.floor(st.y + st.h / 2)
      };
    }
    const W = F.W, N = W * F.H, dist = new Int16Array(N).fill(-1), q = new Int32Array(N);
    let hd = 0, tl = 0;
    const s0 = F.i(from.x, from.y);
    q[tl++] = s0;
    dist[s0] = 0;
    while (hd < tl) {
      const c = q[hd++], cx = c % W, cy = c / W | 0;
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const nx = cx + dx, ny = cy + dy;
        if (!pass(F, nx, ny)) continue;
        const n = ny * W + nx;
        if (dist[n] >= 0) continue;
        dist[n] = dist[c] + 1;
        q[tl++] = n;
      }
    }
    const good = [], ok = [];
    for (let i = 0; i < N; i++) {
      const d = dist[i];
      if (d < 8 || d > 22) continue;
      const x = i % W, y = i / W | 0;
      if (F === RF && F.inside && F.inside[i]) continue;
      if (!open(F, x, y)) continue;
      (d >= 10 && d <= 16 ? good : ok).push([ x, y ]);
    }
    const L = good.length ? good : ok;
    if (!L.length) return null;
    L.sort((a, c) => a[1] - c[1] || a[0] - c[0]);
    const t = L[rng.i(L.length)];
    return {
      f: F.idx,
      tx: t[0],
      ty: t[1],
      x: t[0] + .5,
      y: t[1] + .5,
      sx: from.x + .5,
      sy: from.y + .5
    };
  }
  function spawnWaves(s, R) {
    if (R.es) return;
    const A = h.A_(), F = s.lv.floors[R.f], G = SX.game, rng = new SX.Rng((SX.raid.seed >>> 0) * 61 + 29 >>> 0 || 3);
    const diff = s.lv.building && s.lv.building.diff || 2, n = 1 + diff, ctx = G.lootCtx ? G.lootCtx(R.f) : {
      building: s.lv.building,
      floor: R.f
    };
    R.es = [];
    if (SX.raid && SX.raid.noZ) return;
    for (let w = 0; w < W_AT.length; w++) {
      const L = [];
      for (let k = 0; k < n; k++) {
        let x = R.sx + (rng.f() - .5) * 2.4, y = R.sy + (rng.f() - .5) * 2.4;
        if (!walk(F, Math.floor(x), Math.floor(y))) {
          x = R.sx;
          y = R.sy;
        }
        const e = A.spawnEnemy(F, "zombie", x, y, rng, ctx);
        e.alive = false;
        e.dormant = true;
        e.misW = w + 1;
        e.nid = A.enemies.length - 1;
        L.push(e);
      }
      R.es.push(L);
    }
  }
  function wake(s, R, w) {
    if (!R.es || R.woke[w]) return;
    R.woke[w] = 1;
    for (const e of R.es[w] || []) {
      if (!e.dormant) continue;
      e.dormant = false;
      e.alive = true;
      e.ai = "alert";
      e.lureX = R.x;
      e.lureY = R.y;
      e.lureT = 30;
      e.seenX = R.x;
      e.seenY = R.y;
    }
    const p = PL();
    if (p && p.floor === R.f) SX.log("⚠ 계단 쪽에서 감염체가 몰려옵니다 (" + (w + 1) + "/" + W_AT.length + ")", "bad");
  }
  function turnOn(s, R, by, t0, tm, quiet) {
    if (R.on) {
      if (t0 < R.t0 - .001 || Math.abs(t0 - R.t0) <= .001 && String(by) < String(R.by)) {
        R.t0 = t0;
        R.by = by;
        R.tm = tm;
      }
      return;
    }
    R.on = true;
    R.t0 = t0;
    R.by = by;
    R.tm = tm;
    R.p = R.p || 0;
    R.run = false;
    spawnWaves(s, R);
    if (quiet) return;
    h.play("radioOn", R.f, R.x, R.y, 16, .9);
    h.play("squelch", R.f, R.x, R.y, 16, .7, .5);
    const p = PL();
    if (tm === myTeam()) SX.log("📻 중계기를 켰습니다 — 의뢰를 가진 사람이 곁(8칸)에 있으면 교신이 이어집니다 · " + HOLD_T + "초", "good"); else if (p && p.floor === R.f) SX.log("📻 누군가 중계기를 켰습니다", "warn");
  }
  function finish(s, R) {
    if (R.done) return;
    R.done = true;
    R.p = HOLD_T;
    R.run = false;
    h.play("radioRoger", R.f, R.x, R.y, 16, .9);
    if (R.tm === myTeam() && M.mine(R.id)) {
      const st = M.state(R.id);
      if (st && !st.ok && !st.fail) M.ok(R.id, "교신 성공", false);
    } else if (R.tm === myTeam()) SX.log("📻 교신 성공", "good");
  }
  M.K.hold = {
    setup(s, lv, rng) {
      const q = SX.prog.MIS_Q.find(x => x.kind === "hold" && x.b === s.b);
      if (!q) return null;
      const sp = pick(lv, rng);
      if (!sp) return null;
      const F = lv.floors[sp.f];
      F.solid[F.i(sp.tx, sp.ty)] = 1;
      const R = Object.assign({
        id: q.id,
        on: false,
        t0: 0,
        by: null,
        tm: null,
        p: 0,
        pA: 0,
        run: false,
        done: false,
        woke: [],
        es: null,
        syncT: 0,
        stillT: 0,
        lx: 0,
        ly: 0
      }, sp);
      R.act = {
        kind: "misdev",
        misK: "hold",
        x: R.x,
        y: R.y + .02,
        floor: R.f,
        alive: true,
        r: .3,
        misDraw: (ctx, a, cam, now) => draw(ctx, R, cam, now)
      };
      return R;
    },
    trk(s, q) {
      const R = st0(s);
      if (!R || R.id !== q.id) return null;
      if (!R.on) return {
        t: q.name + " — " + h.fname(R.f) + " 무전 중계기 켜기"
      };
      if (R.tm !== myTeam()) return {
        t: q.name + " — 다른 팀이 중계기를 쓰고 있습니다"
      };
      return {
        t: q.name + " — " + (R.run ? "교신 중 · " : "교신 멈춤(8칸 안으로) · ") + left(R) + "초 남음",
        p: Math.floor(R.p) + "/" + HOLD_T
      };
    },
    okText: () => "교신 성공",
    blocked(s, q) {
      const R = st0(s);
      return R && R.id === q.id && R.done && R.tm !== myTeam() ? "다른 팀이 교신을 끝냈습니다 — 이 판에서는 할 수 없습니다" : "";
    },
    target(s, F, p, put) {
      const R = st0(s);
      if (!R || F.idx !== R.f || R.done) return;
      const d = Math.hypot(R.x - p.x, R.y - p.y);
      if (d > REACH) return;
      const lab = R.on ? "📻 무전 중계기 — 교신 중" : M.teamHas(R.id) ? "📻 무전 중계기 켜기 — [" + h.key() + "] 2초 누르고 있기" : "📻 군용 무전 중계기";
      put({
        kd: "hold",
        x: R.x,
        y: R.y - 1.2,
        label: lab
      }, [ R.x - .5, R.y - 1.4, R.x + .5, R.y + .4 ], d);
    },
    interact(s, t) {
      const R = st0(s);
      if (!R || R.done || M.jobOn()) return;
      if (R.on) {
        SX.log(R.tm === myTeam() ? "📻 교신 중입니다 — 곁(8칸)을 지키십시오" : "📻 다른 사람이 교신 중입니다", "warn");
        return;
      }
      if (!M.teamHas(R.id)) {
        SX.log("지금은 쓸 일이 없습니다", "warn");
        SX.audio.play("denied");
        return;
      }
      M.job({
        k: "hold",
        T: ON_T,
        hold: true,
        pose: "btn",
        keep: .3,
        label: l => "📻 중계기 켜는 중 … " + l.toFixed(1),
        ok: () => !R.on && !R.done,
        done: () => {
          const t0 = SX.raid.t, by = h.me(), tm = myTeam();
          turnOn(s, R, by, t0, tm, false);
          M.sendK("hold", {
            q: "on",
            t0: h.r2(t0),
            by,
            tm
          });
        }
      });
    },
    tick(s, dt, auth) {
      const R = st0(s);
      if (!R) return;
      const p = PL();
      if (R.on && !R.done) {
        if (auth) {
          let run = false;
          for (const o of h.people()) if (o.alive && !o.down && o.floor === R.f && Math.hypot(o.x - R.x, o.y - R.y) <= NEAR && teamOf(o.id) === R.tm && holds(s, o.id, R.id)) {
            run = true;
            break;
          }
          R.run = run;
          if (run) R.p = Math.min(HOLD_T, R.p + dt);
          R.syncT -= dt;
          if (R.p >= HOLD_T) {
            finish(s, R);
            M.sendK("hold", {
              q: "hd",
              tm: R.tm,
              by: R.by
            });
          } else if (R.syncT <= 0) {
            R.syncT = SYNC;
            M.sendK("hold", {
              q: "hp",
              p: h.r2(R.p),
              run: run ? 1 : 0,
              tm: R.tm,
              by: R.by,
              t0: h.r2(R.t0)
            });
          }
        } else if (R.run) R.p = Math.min(R.pA + .6, HOLD_T - .05, R.p + dt);
        for (let w = 0; w < W_AT.length; w++) if (R.p >= W_AT[w] && !R.woke[w]) wake(s, R, w);
        if (R.run && p && p.floor === R.f) {
          R.sqT = (R.sqT || 4) - dt;
          if (R.sqT <= 0) {
            R.sqT = 5 + Math.random() * 3;
            h.play(Math.random() < .5 ? "chatter" : "squelch", R.f, R.x, R.y, 12, .45);
          }
        }
      }
      if (p) {
        const mv = Math.hypot(p.x - R.lx, p.y - R.ly) > .01;
        R.lx = p.x;
        R.ly = p.y;
        R.stillT = mv ? 0 : R.stillT + dt;
        const want = R.on && !R.done && R.run && R.tm === myTeam() && M.mine(R.id) && near(R, p, NEAR) && R.stillT >= .35 && p.alive && !p.down && !M.jobOn() && !(p.muzzleT > 0);
        const cur = M.myPose();
        if (want && !cur) M.pose("ear"); else if (!want && cur === "ear") M.pose(null);
      }
    },
    onMsg(s, from, d) {
      const R = st0(s);
      if (!R) return;
      if (d.q === "on" && typeof d.t0 === "number" && isFinite(d.t0)) turnOn(s, R, d.by != null ? d.by : from, Math.min(SX.raid.t, d.t0), d.tm, false); else if (d.q === "hp" && typeof d.p === "number" && isFinite(d.p)) {
        if (!R.on) turnOn(s, R, d.by != null ? d.by : from, typeof d.t0 === "number" ? d.t0 : SX.raid.t, d.tm, true);
        if (d.tm != null) R.tm = d.tm;
        if (!R.done) {
          R.pA = Math.max(0, Math.min(HOLD_T, d.p));
          R.p = R.pA;
          R.run = !!d.run;
        }
      } else if (d.q === "hd") {
        if (!R.on) turnOn(s, R, d.by != null ? d.by : from, SX.raid.t, d.tm, true);
        if (d.tm != null) R.tm = d.tm;
        finish(s, R);
      }
    },
    hud(s) {
      const R = st0(s), p = PL();
      if (!R || !R.on || R.done || R.tm !== myTeam() || !near(R, p, 14)) return null;
      return R.run ? {
        text: "📻 교신 중 — " + left(R) + "초 남음 · 계단 쪽을 지키십시오",
        col: null
      } : {
        text: "📻 교신 멈춤 — 의뢰를 가진 사람이 중계기 8칸 안에 있어야 합니다 · " + left(R) + "초 남음",
        col: "rgb(240,190,90)"
      };
    },
    marks(s, out) {
      const R = st0(s);
      if (R && !R.done && M.teamHas(R.id)) out.push({
        f: R.f,
        x: R.x,
        y: R.y,
        col: "rgb(130,200,255)",
        label: "📻 중계기" + (R.on && R.tm === myTeam() ? " " + left(R) + "초" : "")
      });
    },
    pois(s, f, o) {
      const R = st0(s);
      if (R && !R.done && R.f === f && M.teamHas(R.id)) o.push({
        kind: "ping",
        x: R.x,
        y: R.y
      });
    },
    actors(s, fi) {
      const R = st0(s);
      return R && R.f === fi ? [ R.act ] : [];
    },
    dump(s) {
      const R = st0(s);
      return {
        on: R.on ? 1 : 0,
        t0: h.r2(R.t0),
        by: R.by,
        tm: R.tm,
        p: h.r2(R.p),
        done: R.done ? 1 : 0
      };
    },
    worldIn(s, w, opt) {
      const R = st0(s);
      if (!R || !w || !w.on) return;
      turnOn(s, R, w.by, typeof w.t0 === "number" ? w.t0 : 0, w.tm, true);
      R.p = R.pA = Math.max(0, Math.min(HOLD_T, +w.p || 0));
      for (let k = 0; k < W_AT.length; k++) if (R.p >= W_AT[k]) R.woke[k] = 1;
      if (w.done) {
        R.done = true;
        R.p = HOLD_T;
      }
    }
  };
  function draw(ctx, R, cam, now) {
    const sp = SX.art.prop("misRelay");
    if (!sp) return;
    const TS = SX.TS, X = Math.round(R.tx * TS - cam.x), Y = Math.round(R.ty * TS - cam.y) + sp.oy;
    ctx.drawImage(sp.c, X, Y);
    const B = Y + TS + UP - 2, bl = Math.floor(now * 2.5) % 2 === 0;
    ctx.fillStyle = R.done ? "#5ae07a" : R.on ? R.run ? bl ? "#8aff9a" : "#2f7a3a" : "#e0b040" : "#6a2420";
    ctx.fillRect(X + 18, B - 21, 2, 2);
    if (R.on && !R.done && R.run && bl) {
      ctx.fillStyle = "rgba(160,255,170,0.35)";
      ctx.fillRect(X + 17, B - 22, 4, 4);
    }
  }
})(window.SX);
