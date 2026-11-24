(function(SX) {
  "use strict";
  const M = SX.mis = {};
  const K = M.K = {};
  const ORDER = [ "photo", "hold", "escort", "stealth", "power" ];
  let S = null, warned = false;
  const A_ = () => SX.actors, M_ = () => SX.map, T_ = () => SX.map.T;
  const R_ = () => SX.coop && SX.coop.raid && !SX.coop.raid.offline ? SX.coop.raid : null;
  const isAuth = () => !R_() || !SX.coop.runEnemies || SX.coop.runEnemies();
  const me = () => R_() ? R_().me : "me";
  function send(d, to) {
    if (R_() && SX.coop.miSend) SX.coop.miSend(d, to);
  }
  function teamSend(d) {
    if (R_() && SX.coop.miTeam) SX.coop.miTeam(d);
  }
  const same = from => !!(SX.coop && SX.coop.evSame && SX.coop.evSame(from));
  const r2 = v => Math.round(v * 100) / 100;
  const key = () => SX.label ? SX.label("interact") : "F";
  const fname = f => SX.raid.fname ? SX.raid.fname(f) : f + 1 + "층";
  const bName = b => SX.prog && SX.prog.B_NAMES && SX.prog.B_NAMES[b] || b;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function play(name, f, x, y, range, vol, delay) {
    const p = A_().player;
    if (!p || p.floor !== f) return;
    SX.audio.play(name, {
      x,
      y,
      range: range || 14,
      vol: vol == null ? .8 : vol,
      delay: delay || 0
    });
  }
  function inval(F) {
    F.ver = (F.ver || 0) + 1;
    if (F.chunks) F.chunks.clear();
    if (SX.render && SX.render.invalidate) SX.render.invalidate(F);
    F.blazes = null;
  }
  function doorTiles(d) {
    const o = [];
    for (let k = 0; k < (d.len || 1); k++) o.push(d.horiz ? [ d.x + k, d.y ] : [ d.x, d.y + k ]);
    return o;
  }
  const inRoom = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  const area = r => (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
  function doorsOf(F, r) {
    return F.doors.filter(d => doorTiles(d).some(([x, y]) => inRoom(r, x + 1, y) || inRoom(r, x - 1, y) || inRoom(r, x, y + 1) || inRoom(r, x, y - 1)));
  }
  function stairIn(F, r) {
    for (const s of F.stairs) if (s.x <= r.x1 && s.x + s.w > r.x0 && s.y <= r.y1 && s.y + s.h > r.y0) return true;
    return false;
  }
  function okRoom(F, r) {
    if (!r || r.big || r.hall || r.open || r.part || r.nook || r.vault || r.ctrl) return false;
    if (F.vault && F.vault.r === r) return false;
    if (F.ctrl && F.ctrl.r === r) return false;
    return !stairIn(F, r);
  }
  function freeT(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y);
    if (F.tile(x, y) !== T_().FLOOR || F.solid[i] || F.doorAt.get(i) || blk && blk.has(i)) return false;
    if (F.propAt && F.propAt[i]) return false;
    if (evNear(F, x, y)) return false;
    return A_().free(F, x + .5, y + .5, .3);
  }
  let evP = null;
  function evNear(F, x, y) {
    if (evP) for (const q of evP) if (q[0] === F.idx && Math.abs(q[1] - x - .5) < 1.4 && Math.abs(q[2] - y - .5) < 1.4) return true;
    return false;
  }
  function evPts() {
    const o = [], S = SX.ev && SX.ev._S ? SX.ev._S() : null;
    if (S) {
      for (const v of S.sv || []) o.push([ v.floor, v.x, v.y ]);
      if (S.rd && S.rd.es) for (const e of S.rd.es) o.push([ e.floor, e.x, e.y ]);
    }
    return o;
  }
  function nearDoor(F, x, y) {
    for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (F.in(x + dx, y + dy) && F.tile(x + dx, y + dy) === T_().DOOR) return true;
    return false;
  }
  function unstick(F, a) {
    const A = A_();
    if (!a || A.free(F, a.x, a.y, .3)) return;
    for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = Math.floor(a.x) + dx + .5, y = Math.floor(a.y) + dy + .5;
      if (A.free(F, x, y, .3) && F.tile(Math.floor(x), Math.floor(y)) === T_().FLOOR) {
        a.x = x;
        a.y = y;
        return;
      }
    }
  }
  function people() {
    const out = [], p = A_().player;
    if (p) out.push({
      id: me(),
      x: p.x,
      y: p.y,
      floor: p.floor,
      alive: !!p.alive,
      down: !!p.down,
      me: true
    });
    if (SX.coop && SX.coop.ghosts && R_()) for (const [id, g] of SX.coop.ghosts) out.push({
      id,
      x: g.x,
      y: g.y,
      floor: g.floor,
      alive: g.alive !== false,
      down: !!g.down
    });
    return out;
  }
  function who(id) {
    return people().find(q => q.id === id) || null;
  }
  function nameOf(id) {
    if (id === me()) return SX.coop && SX.coop.nameOf && R_() ? SX.coop.nameOf(SX.coop.id) : "나";
    const R = R_();
    return R && R.names && R.names.get(id) || "#" + id;
  }
  M.h = {
    A_,
    M_,
    T_,
    R_,
    isAuth,
    me,
    send,
    teamSend,
    same,
    r2,
    key,
    fname,
    bName,
    esc,
    play,
    inval,
    doorTiles,
    inRoom,
    area,
    doorsOf,
    stairIn,
    okRoom,
    freeT,
    evNear,
    nearDoor,
    unstick,
    people,
    who,
    nameOf
  };
  function myQs(b) {
    const P = SX.prog, s = SX.game && SX.game.save;
    if (!P || !P.MIS || !s || !s.quests || !P.current) return [];
    const out = [];
    for (const q of P.openList ? P.openList(s.quests) : Object.values(P.current(s.quests))) {
      if (q && P.MIS[q.kind] && q.b === b && (s.quests.prog[q.id] | 0) < q.n) out.push(q);
    }
    return out;
  }
  M.myQs = myQs;
  function build(lv) {
    const Rd = SX.raid, b = lv.building;
    const s = {
      lv,
      b: b ? b.id : null,
      mode: Rd.mode || "normal",
      my: [],
      have: new Map,
      st: {},
      k: {},
      job: null,
      hvT: 0,
      hvN: 0,
      snapT: 0,
      said: {},
      on: false
    };
    if (!b || b.train || b.final || b.outdoor || Rd.tutMode || SX.course && SX.course.on) return s;
    s.on = true;
    s.my = myQs(s.b);
    for (const q of s.my) s.st[q.id] = {
      ok: 0,
      fail: ""
    };
    const u0 = SX.items.uidGet ? SX.items.uidGet() : null;
    try {
      evP = evPts();
      if (SX.items.uidSet) SX.items.uidSet(1e12 + Rd.seed % 1e6 * 1e5 + 95e3);
      ORDER.forEach((k, n) => {
        const m = K[k];
        if (!m || !m.setup) return;
        try {
          s.k[k] = m.setup(s, lv, new SX.Rng((Rd.seed >>> 0 ^ 7148800 + n * 40503) >>> 0 || 7)) || null;
        } catch (e) {
          console.warn("[mis] setup " + k, e);
          s.k[k] = null;
        }
      });
    } finally {
      evP = null;
      if (SX.items.uidSet && u0 != null) SX.items.uidSet(u0);
    }
    return s;
  }
  M.start = function(lv) {
    if (S && S.job) stopJob();
    S = build(lv);
  };
  M.ensure = function() {
    const lv = SX.raid && SX.raid.level;
    if (!lv) {
      S = null;
      return null;
    }
    if (!S || S.lv !== lv) {
      if (S && S.job) stopJob();
      S = build(lv);
    }
    return S;
  };
  M._S = () => S;
  const myHas = id => !!(S && S.my.some(q => q.id === id));
  M.mine = id => myHas(id);
  M.myOf = kind => S ? S.my.filter(q => q.kind === kind) : [];
  M.teamHas = function(id) {
    if (myHas(id)) return true;
    if (!S) return false;
    for (const [from, v] of S.have) if (v.team && v.ids.indexOf(id) >= 0) return true;
    return false;
  };
  M.anyHas = function(kind) {
    if (!S) return false;
    const P = SX.prog;
    if (S.my.some(q => q.kind === kind)) return true;
    for (const v of S.have.values()) for (const id of v.ids) {
      const q = P.qById(id);
      if (q && q.kind === kind && q.b === S.b) return true;
    }
    return false;
  };
  M.idsOf = function(id) {
    if (id === me()) return S ? S.my.map(q => q.id) : [];
    const v = S && S.have.get(id);
    return v ? v.ids.slice() : [];
  };
  const stOf = id => S && S.st[id] || null;
  M.state = id => stOf(id);
  M.ok = function(id, line, net) {
    const st = stOf(id);
    if (!st || st.ok || st.fail) {
      if (net) teamSend({
        q: "ok",
        id
      });
      return;
    }
    st.ok = 1;
    const q = SX.prog.qById(id);
    SX.log("✓ " + (line || "「" + q.name + "」") + " — 탈출하면 의뢰를 끝냅니다", "good");
    if (SX.ui && SX.ui.bigNote) SX.ui.bigNote("✓ " + q.name, "탈출하면 의뢰를 끝냅니다", 2600);
    if (SX.ui.hudDirty) SX.ui.hudDirty();
    if (net) teamSend({
      q: "ok",
      id
    });
  };
  M.fail = function(id, why) {
    const st = stOf(id);
    if (!st || st.fail || st.ok) return;
    st.fail = why || "실패";
    SX.log("✗ " + st.fail + " — 이번 판 임무 실패(다음 판에 다시 할 수 있습니다)", "bad");
    if (SX.ui && SX.ui.bigNote) SX.ui.bigNote(st.fail, "이번 판 임무 실패 — 다음 판에 다시", 2600);
    if (SX.ui.hudDirty) SX.ui.hudDirty();
  };
  M.okKind = function(kind, line, net) {
    for (const q of M.myOf(kind)) M.ok(q.id, line, false);
    if (net) for (const q of M.myOf(kind)) teamSend({
      q: "ok",
      id: q.id
    });
  };
  M.job = function(o) {
    const p = A_().player;
    if (!p || !S) return;
    S.job = Object.assign({
      t: 0,
      x: p.x,
      y: p.y,
      sndT: 0
    }, o);
    if (o.pose) M.pose(o.pose); else p.reviving = "ev";
    p.reload = null;
    p.use = null;
  };
  function stopJob(why) {
    const p = A_().player, j = S && S.job;
    if (S) S.job = null;
    if (p && p.reviving === "ev") p.reviving = null;
    if (j && j.pose && S && S.pc === j.pose) M.pose(null, why ? 0 : j.keep || 0);
    if (j && j.cancel && why) try {
      j.cancel(j);
    } catch (e) {}
  }
  M.stopJob = stopJob;
  M.jobOn = () => !!(S && S.job);
  M.cancelJob = function() {
    if (S && S.job && !S.job.hold) {
      stopJob(true);
      return true;
    }
    return false;
  };
  function jobTick(dt) {
    const j = S.job, p = A_().player;
    const bad = !p || !p.alive || p.down || Math.hypot(p.x - j.x, p.y - j.y) > .6 || SX.ui.isOpen && SX.ui.isOpen() || j.hold && !SX.input.held("interact") || j.ok && !j.ok(j);
    if (bad) {
      stopJob(true);
      return;
    }
    if (!j.pose) p.reviving = "ev";
    j.t += dt;
    if (j.tick) j.tick(dt, j);
    if (j.t >= j.T) {
      stopJob(false);
      if (j.done) j.done(j);
    }
  }
  const lerp = (a, b, k) => [ a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k ];
  const mx = (dir, q) => dir === 3 ? [ -q[0], q[1] ] : q;
  const side = dir => dir === 1 || dir === 3;
  function earPose(dir) {
    return dir === 1 ? {
      n: [ 3, -29 ],
      f: [ 7, -18 ]
    } : dir === 3 ? {
      n: [ -4, -29 ],
      f: [ -8, -18 ]
    } : dir === 2 ? {
      n: [ -5, -28 ],
      f: [ 4, -19 ]
    } : {
      n: [ 5, -28 ],
      f: [ -4, -18 ]
    };
  }
  const POSE = M.POSE = {
    ph: dir => side(dir) ? {
      n: mx(dir, [ 8, -25 ]),
      f: mx(dir, [ 6, -23 ]),
      held: "ph"
    } : dir === 2 ? {
      n: [ 3, -26 ],
      f: [ -3, -26 ],
      held: "ph"
    } : {
      n: [ 3, -25 ],
      f: [ -3, -25 ],
      held: "ph"
    },
    ear: dir => Object.assign(earPose(dir), {
      held: "hs"
    }),
    cord: (dir, t) => {
      const c = t % 2, k = c < .45 ? c / .45 : c < 1.1 ? 1 : Math.max(0, 1 - (c - 1.1) / .6);
      const sd = side(dir);
      return {
        n: mx(dir, sd ? lerp([ 9, -9 ], [ -3, -25 ], k) : lerp([ 5, -8 ], [ 8, -27 ], k)),
        f: mx(dir, sd ? [ 10, -12 ] : [ -5, -11 ]),
        held: "cd"
      };
    },
    btn: (dir, t) => {
      const k = Math.min(1, t / .25), pr = t > .25 && t < .55 ? 1 : 0, sd = side(dir);
      return {
        n: mx(dir, sd ? [ 7 + 3 * k + pr, -21 ] : [ 5 + 2 * k, -22 - 2 * k - pr ]),
        f: mx(dir, sd ? [ 2, -14 ] : [ -4, -14 ])
      };
    }
  };
  M.pose = function(code, keep) {
    const p = A_().player;
    if (!p || !S) return;
    if (code) {
      if (!S.pz) S.pz = {
        ap: p.armPose || null,
        hw: p.hideWeapon
      };
      S.pc = code;
      S.pt = 0;
      S.pk = 0;
      return;
    }
    if (keep > 0 && S.pc) {
      S.pk = keep;
      return;
    }
    if (S.pz) {
      p.armPose = S.pz.ap;
      p.hideWeapon = S.pz.hw;
    }
    S.pz = null;
    S.pc = null;
    S.pk = 0;
  };
  M.myPose = () => S && S.pc || null;
  function poseTick(dt) {
    const A = A_(), p = A.player;
    if (S.pc && p) {
      if (!p.alive || p.down) {
        M.pose(null);
      } else {
        S.pt += dt;
        p.armPose = POSE[S.pc](A.dirOf(p.aim || 0), S.pt);
        p.hideWeapon = true;
        if (S.pk > 0 && (S.pk -= dt) <= 0) M.pose(null);
      }
    }
    if (S.flT > 0) S.flT -= dt;
    if (SX.coop && SX.coop.ghosts && R_()) for (const g of SX.coop.ghosts.values()) {
      if (g.misP && POSE[g.misP] && g.alive !== false) {
        if (!g._mp) g._mp = {
          ap: g.armPose || null,
          hw: g.hideWeapon,
          t: 0
        };
        g._mp.t += dt;
        g.armPose = POSE[g.misP](g.dir != null ? g.dir : A.dirOf(g.aim || 0), g._mp.t);
        g.hideWeapon = true;
      } else if (g._mp) {
        g.armPose = g._mp.ap;
        g.hideWeapon = g._mp.hw;
        g._mp = null;
      }
    }
  }
  M.drawHeld = function(ctx, a, hands) {
    const ap = a && a.armPose, hd = hands && hands.n;
    if (!ap || !ap.held || !hd) return;
    const x = Math.round(hd[0]), y = Math.round(hd[1]);
    if (ap.held === "ph") {
      ctx.fillStyle = "#101316";
      ctx.fillRect(x - 2, y - 4, 4, 6);
      ctx.fillStyle = a === A_().player && S && S.flT > 0 ? "#ffffff" : "#3c5468";
      ctx.fillRect(x - 1, y - 3, 2, 4);
    } else if (ap.held === "hs") {
      ctx.fillStyle = "#15181a";
      ctx.fillRect(x - 1, y - 3, 2, 7);
      ctx.fillStyle = "#30363a";
      ctx.fillRect(x - 1, y - 3, 1, 2);
      ctx.fillRect(x - 1, y + 2, 1, 2);
    } else if (ap.held === "cd") {
      ctx.fillStyle = "#121212";
      ctx.fillRect(x - 2, y - 1, 5, 2);
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(x - 1, y - 1, 3, 1);
    }
  };
  M.flash = function() {
    const p = A_().player;
    if (!p || !S) return;
    S.flT = .12;
    if (SX.light && SX.light.flash) SX.light.flash(p.floor, p.x, p.y - .6, 6, [ 255, 255, 250 ], .12, 1);
  };
  M.tick = function(dt, lv) {
    if (!S || S.lv !== lv) M.ensure();
    if (!S || !S.on || SX.raid.over) return;
    try {
      if (S.job) jobTick(dt);
      poseTick(dt);
      if (R_()) {
        S.hvT -= dt;
        if (S.hvT <= 0) {
          S.hvN++;
          S.hvT = S.hvN < 6 ? 4 : 15;
          send({
            q: "hv",
            ids: S.my.map(q => q.id)
          });
        }
      }
      for (const k of ORDER) {
        const m = K[k];
        if (m && m.tick && S.k[k] !== undefined) m.tick(S, dt, isAuth());
      }
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn("[mis] tick", e);
      }
    }
  };
  M.onMsg = function(from, d) {
    if (!M.ensure() || !S.on || !d) return;
    switch (d.q) {
     case "hv":
      {
        const ids = Array.isArray(d.ids) ? d.ids.filter(x => typeof x === "string").slice(0, 10) : [];
        const was = S.have.get(from);
        S.have.set(from, {
          ids,
          team: same(from)
        });
        if (!was) {
          for (const k of ORDER) {
            const m = K[k];
            if (m && m.onPeer) m.onPeer(S, from);
          }
        }
        break;
      }

     case "ok":
      if (same(from) && typeof d.id === "string" && myHas(d.id)) M.ok(d.id, null, false);
      break;

     default:
      {
        const m = K[d.kd];
        if (m && m.onMsg) m.onMsg(S, from, d);
      }
    }
  };
  M.sendK = (kd, d, to) => {
    d.kd = kd;
    send(d, to);
  };
  M.teamK = (kd, d) => {
    d.kd = kd;
    teamSend(d);
  };
  M.dump = function() {
    M.ensure();
    if (!S || !S.on) return undefined;
    const o = {
      v: 1,
      st: S.st,
      k: {}
    };
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.dump && S.k[k]) try {
        o.k[k] = m.dump(S);
      } catch (e) {}
    }
    return o;
  };
  M.worldIn = function(w, opt) {
    if (!w || !S || !S.on) return;
    try {
      if (opt && opt.search && w.st) for (const id of Object.keys(S.st)) {
        const q = w.st[id];
        if (q) {
          S.st[id].ok = q.ok ? 1 : 0;
          S.st[id].fail = typeof q.fail === "string" ? q.fail : "";
          if (q.x) S.st[id].x = q.x;
        }
      }
      for (const k of ORDER) {
        const m = K[k];
        if (m && m.worldIn && S.k[k] && w.k && w.k[k]) m.worldIn(S, w.k[k], opt || {});
      }
    } catch (e) {
      console.warn("[mis] worldIn", e);
    }
  };
  M.target = function(F, p, add) {
    if (!M.ensure() || !S.on || !F) return null;
    let best = null, bd = 9;
    const put = (o, box, d) => {
      o.kind = "mi";
      if (d < bd) {
        bd = d;
        best = add(o, () => [ box ]);
      } else add(o, () => [ box ]);
    };
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.target && S.k[k]) m.target(S, F, p, put);
    }
    return best;
  };
  M.interact = function(t) {
    if (!S || !t) return;
    const m = K[t.kd];
    if (m && m.interact) m.interact(S, t);
  };
  M.hud = function() {
    if (!S || !S.on) return null;
    if (S.job) {
      const j = S.job;
      return {
        text: j.label ? j.label(Math.max(0, j.T - j.t)) : "… " + Math.max(0, j.T - j.t).toFixed(1),
        col: null
      };
    }
    for (const k of ORDER) {
      const m = K[k];
      const h = m && m.hud && S.k[k] ? m.hud(S) : null;
      if (h) return h;
    }
    return null;
  };
  M.hud2 = function() {
    if (!S || !S.on) return null;
    for (const k of ORDER) {
      const m = K[k];
      const h = m && m.hud2 && S.k[k] ? m.hud2(S) : null;
      if (h) return h;
    }
    return null;
  };
  M.marks = function(out) {
    if (!S || !S.on) return;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.marks && S.k[k]) m.marks(S, out);
    }
  };
  M.pois = function(f) {
    const o = [];
    if (!S || !S.on) return o;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.pois && S.k[k]) m.pois(S, f, o);
    }
    return o;
  };
  M.actors = function(fi) {
    const o = [];
    if (!S || !S.on || !SX.raid || SX.raid.level !== S.lv) return o;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.actors && S.k[k]) for (const a of m.actors(S, fi)) o.push(a);
    }
    return o;
  };
  M.fx = function(ctx, cam, vw, vh, F, now) {
    if (!S || !S.on || !SX.raid || SX.raid.level !== S.lv) return;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.fx && S.k[k]) m.fx(S, ctx, cam, vw, vh, F, now);
    }
  };
  M.targets = function(out) {
    if (!S || !S.on) return;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.targets && S.k[k]) m.targets(S, out);
    }
  };
  M.hurt = function(a, dmg, e) {
    if (!S || !a || !a.misK) return;
    const m = K[a.misK];
    if (m && m.hurt) m.hurt(S, a, dmg, e);
  };
  M.bulletHit = function(b, dist) {
    if (!S || !S.on) return false;
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.bulletHit && S.k[k] && m.bulletHit(S, b, dist)) return true;
    }
    return false;
  };
  M.spotted = function(e, tg) {
    if (!S || !S.on) return;
    const m = K.stealth;
    if (m && m.spotted) m.spotted(S, e, tg);
  };
  M.trkRow = function(q, at, pr) {
    const P = SX.prog;
    if (!P || !P.MIS || !P.MIS[q.kind]) return null;
    const m = K[q.kind], G = SX.game;
    if (G && G.state === "raid" && S && S.on && S.b === q.b && S.st[q.id]) {
      const st = S.st[q.id];
      if (st.fail) return {
        k: "q",
        id: q.id,
        t: q.name + " — " + st.fail + " · 이번 판 실패"
      };
      if (st.ok) return {
        k: "q",
        id: q.id,
        t: (m && m.okText ? m.okText(S, q) : q.name + " — 해냈습니다") + " — 탈출하면 완료",
        p: "✓"
      };
      const bl = m && m.blocked ? m.blocked(S, q) : "";
      if (bl) return {
        k: "q",
        id: q.id,
        t: q.name + " — " + bl
      };
      const r = m && m.trk ? m.trk(S, q) : null;
      if (r) return {
        k: "q",
        id: q.id,
        t: r.t,
        p: r.p || ""
      };
    }
    return {
      k: "q",
      id: q.id,
      t: P.misWhat(q),
      p: pr + "/" + q.n
    };
  };
  M.onEnd = function(win, how) {
    if (!S || !S.on) return;
    if (S.job) stopJob(false);
    M.pose(null);
    for (const k of ORDER) {
      const m = K[k];
      if (m && m.onEnd && S.k[k]) try {
        m.onEnd(S, win, how);
      } catch (e) {
        console.warn("[mis] onEnd " + k, e);
      }
    }
  };
  M.toRaid = function(lr, win) {
    if (!lr) return;
    const s = S;
    if (!s || !s.on || !win || lr.b !== s.b) return;
    const ids = Object.keys(s.st).filter(id => s.st[id].ok && !s.st[id].fail);
    if (ids.length) lr.mis = ids;
  };
  void {
    ok: id => M.ok(id, null, true),
    fail: (id, w) => M.fail(id, w)
  };
})(window.SX);
