(function(SX) {
  "use strict";
  const M = SX.mis, h = M.h;
  const HP = 150, OUT_D = 4, DUCK_T = 2, HEAR = 9, REACH = 1.5, WALK = 3, RUN = 4.9, SLOW = .9;
  const PL = () => h.A_().player;
  const st0 = s => s.k.escort;
  const teamOf = id => {
    const R = h.R_();
    if (!R) return 0;
    if (id === R.me) return R.team;
    return R.teams && R.teams.has(id) ? R.teams.get(id) : -1;
  };
  const myTeam = () => teamOf(h.me());
  const holds = (s, id, qid) => id === h.me() ? M.mine(qid) : !!(s.have.get(id) && s.have.get(id).ids.indexOf(qid) >= 0);
  function anyHolder(s, qid) {
    if (M.mine(qid)) return true;
    for (const v of s.have.values()) if (v.ids.indexOf(qid) >= 0) return true;
    return false;
  }
  function teamHolds(s, tm, qid) {
    for (const o of h.people()) if (teamOf(o.id) === tm && holds(s, o.id, qid)) return true;
    for (const [id, v] of s.have) if (teamOf(id) === tm && v.ids.indexOf(qid) >= 0) return true;
    return false;
  }
  const jo = (w, a, b) => {
    const c = w.charCodeAt(w.length - 1) - 44032;
    return w + (c >= 0 && c <= 11171 ? c % 28 ? a : b : a + "(" + b + ")");
  };
  function spec(qid, rng) {
    const s = SX.art.charSpec("scav", rng);
    Object.assign(s, {
      mask: null,
      beard: false,
      gloves: false
    });
    if (qid === "xe2") Object.assign(s, {
      top: "#3a4a30",
      topStyle: "uniform",
      pants: "#2a3020",
      hat: "helmet",
      hatCol: "#27301c",
      vest: "#2b3324",
      pack: "#2f3630",
      hairStyle: "buzz"
    }); else Object.assign(s, {
      top: "#56657a",
      topStyle: "hoodie",
      pants: "#2c3444",
      hat: null,
      vest: null,
      pack: "#5a4630",
      hairStyle: rng.pick([ "short", "long" ])
    });
    s.key = "misE" + qid;
    return s;
  }
  function mk(R, F, x, y, rng) {
    return {
      kind: "ally",
      misK: "escort",
      id: R.id,
      name: "",
      x,
      y,
      floor: F.idx,
      spec: spec(R.id, rng),
      dir: 0,
      frame: 0,
      face: Math.PI / 2,
      walkT: 0,
      alive: true,
      hideWeapon: true,
      hp: HP,
      st: 1,
      by: null,
      pathT: 0,
      path: null,
      blockedT: 0,
      r: .28,
      doorSkill: true,
      hop: 0,
      bodyPose: "sit",
      crouch: false,
      moving: false,
      lx: x,
      ly: y,
      lf: F.idx,
      xT: 0,
      nx: x,
      ny: y,
      duckT: 0,
      nearT: null,
      taken: false
    };
  }
  function back(F, r, d, rng) {
    const dc = d ? {
      x: d.cx != null ? d.cx : d.x,
      y: d.cy != null ? d.cy : d.y
    } : {
      x: r.x0,
      y: r.y0
    }, cs = [];
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      if (!h.freeT(F, x, y) || h.nearDoor(F, x, y)) continue;
      cs.push({
        x,
        y,
        v: Math.hypot(x + .5 - dc.x, y + .5 - dc.y) + rng.f() * .5
      });
    }
    cs.sort((a, b) => b.v - a.v);
    for (const c of cs) if (walkOut(F, r, c.x, c.y)) return {
      x: c.x,
      y: c.y
    };
    return null;
  }
  function walkOut(F, r, sx, sy) {
    const A = h.A_(), T = h.T_(), seen = new Set([ F.i(sx, sy) ]), q = [ [ sx, sy ] ];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) {
        const nx = x + dx, ny = y + dy;
        if (!F.in(nx, ny) || nx < r.x0 - 1 || nx > r.x1 + 1 || ny < r.y0 - 1 || ny > r.y1 + 1) continue;
        const i = F.i(nx, ny);
        if (seen.has(i)) continue;
        seen.add(i);
        if (F.tile(nx, ny) === T.DOOR) {
          const dr = F.doorAt.get(i);
          if (!dr || !dr.locked) return true;
          continue;
        }
        if (A.free(F, nx + .5, ny + .5, .3)) q.push([ nx, ny ]);
      }
    }
    return false;
  }
  function pick(lv, rng) {
    const top = lv.building.floors | 0, mode = SX.raid.mode || "normal";
    let fl = [];
    for (let f = 1; f < top; f++) fl.push(f);
    if (!fl.length) fl.push(0);
    if (mode === "flood") fl.reverse(); else if (mode !== "fire") fl = rng.shuffle(fl);
    for (const f of fl) {
      const F = lv.floors[f];
      if (!F || !F.rooms) continue;
      const cand = [];
      for (const r of F.rooms) {
        if (!h.okRoom(F, r) || h.area(r) < 6 || h.area(r) > 140) continue;
        const ds = h.doorsOf(F, r);
        if (!ds.length || ds.some(d => d.locked || d.key || d.vault || d.evShut || d.fireShut || d.floodShut || d.exit)) continue;
        cand.push([ r, ds[0] ]);
      }
      for (const [r, d] of rng.shuffle(cand)) {
        const sp = back(F, r, d, rng);
        if (sp) return {
          f,
          x: sp.x + .5,
          y: sp.y + .6
        };
      }
    }
    return null;
  }
  function carrier(by) {
    if (by == null) return null;
    if (by === h.me()) {
      const p = PL();
      return p ? {
        x: p.x,
        y: p.y,
        floor: p.floor,
        alive: p.alive,
        down: !!p.down
      } : null;
    }
    const g = SX.coop && SX.coop.ghosts && SX.coop.ghosts.get(by);
    return g ? {
      x: g.x,
      y: g.y,
      floor: g.floor,
      alive: g.alive !== false,
      down: !!g.down
    } : null;
  }
  function setSt(R, st, by, net) {
    const v = R.v, was = v.st;
    v.st = st;
    v.by = by == null ? null : by;
    if (st === 2 && was !== 2) {
      v.taken = true;
      h.A_().say(v, R.id === "xe2" ? "따라가겠습니다" : "네, 따라갈게요");
    }
    if (st === 2) {
      v.lx = v.x;
      v.ly = v.y;
      v.lf = v.floor;
      v.xT = 0;
    }
    if (st === 1 && was === 2) {
      v.taken = true;
      if (by == null && v.alive) h.A_().say(v, "여기서 기다릴게요");
    }
    if (net && h.isAuth()) M.sendK("escort", {
      q: "st",
      st,
      by: v.by,
      x: h.r2(v.x),
      y: h.r2(v.y),
      f: v.floor
    });
  }
  function take(s, R, who) {
    const v = R.v;
    if (!R.live || !v.alive || v.st === 3 || v.st === 4) return;
    if (v.st === 2) {
      const c = carrier(v.by);
      if (c && c.alive && !c.down) return;
    }
    if (!teamHolds(s, teamOf(who), R.id)) return;
    setSt(R, 2, who, true);
  }
  function hurt(s, R, dmg, ang) {
    const v = R.v;
    if (!v.alive || v.st === 3 || v.st === 4) return;
    v.hp -= dmg;
    const F = s.lv.floors[v.floor];
    if (F && h.A_().bleedAt) h.A_().bleedAt(F, v.x, v.y, ang);
    if (dmg >= 4) v.duckT = Math.max(v.duckT, .6);
    if (v.hp <= 0) die(s, R, true);
  }
  function die(s, R, net) {
    const v = R.v;
    if (!v.alive && v.st === 3) return;
    v.alive = false;
    v.st = 3;
    v.hp = 0;
    v.moving = false;
    v.bodyPose = null;
    v.crouch = false;
    v.hop = 0;
    const line = jo(R.who, "이", "가") + " 숨졌습니다";
    if (M.mine(R.id)) M.fail(R.id, line); else if (teamHolds(s, myTeam(), R.id)) SX.log(line, "bad");
    if (net && h.isAuth()) M.sendK("escort", {
      q: "die"
    });
  }
  function tickAuth(s, R, dt) {
    const v = R.v, lv = s.lv, F = lv.floors[v.floor];
    if (!F) return;
    v.moving = false;
    const A = h.A_();
    if (A.bullets) for (const b of A.bullets) {
      if (R.seen.has(b)) continue;
      R.seen.add(b);
      if (b.floor === v.floor && b.from !== v && Math.hypot(b.ox - v.x, b.oy - v.y) < HEAR && (b.dmg > 0 || b.vis)) v.duckT = DUCK_T;
    }
    if (v.duckT > 0) v.duckT -= dt;
    if (v.st === 2) {
      const c = carrier(v.by);
      if (!c || !c.alive || c.down) {
        setSt(R, 1, null, true);
        return;
      }
      if (v.duckT > 0) return;
      if (c.floor === v.floor) {
        v.lx = c.x;
        v.ly = c.y;
        v.lf = c.floor;
        v.xT = 0;
        const d = Math.hypot(c.x - v.x, c.y - v.y);
        if (d > 1.3) v.moving = !!A.steer(F, v, c.x, c.y, SLOW * (d > 4 ? RUN : WALK), dt);
      } else {
        v.xT += dt;
        const d = Math.hypot(v.lx - v.x, v.ly - v.y);
        if (d > .6 && v.xT < 8) v.moving = !!A.steer(F, v, v.lx, v.ly, SLOW * RUN, dt); else {
          const NF = lv.floors[c.floor];
          if (!NF) return;
          v.floor = c.floor;
          v.x = c.x;
          v.y = c.y + .4;
          v.path = null;
          v.pathT = 0;
          v.xT = 0;
          h.unstick(NF, v);
          v.nx = v.x;
          v.ny = v.y;
        }
      }
    }
    const i = F.in(Math.floor(v.x), Math.floor(v.y)) ? F.i(Math.floor(v.x), Math.floor(v.y)) : -1;
    if (i >= 0 && F.fireAt && F.fireAt[i] && v.st !== 3 && v.st !== 4) {
      v.hp -= 12 * dt;
      if (v.hp <= 0) die(s, R, true);
    }
  }
  function anim(R, dt, auth) {
    const v = R.v;
    if (v.st === 3) {
      v.bodyPose = null;
      v.crouch = false;
      v.hop = 0;
      return;
    }
    if (!auth) {
      const dx = v.nx - v.x, dy = v.ny - v.y, d = Math.hypot(dx, dy);
      if (d > 4) {
        v.x = v.nx;
        v.y = v.ny;
      } else {
        const k = Math.min(1, dt * 10);
        v.x += dx * k;
        v.y += dy * k;
      }
      if (d > .05) v.face = Math.atan2(dy, dx);
      if (v.duckT > 0) v.duckT -= dt;
    }
    if (v.moving) v.walkT += dt * WALK * SLOW * 3.2;
    v.dir = h.A_().dirOf(v.face);
    v.frame = v.moving ? Math.floor(v.walkT) % 4 : 0;
    const sit = v.st === 1;
    v.bodyPose = sit ? "sit" : null;
    v.crouch = !sit && v.duckT > 0;
    v.hop = sit ? -(SX.art.SIT_DY || 0) : v.moving && v.frame === 1 ? -1 : 0;
  }
  const row = v => [ h.r2(v.x), h.r2(v.y), v.floor, Math.round(v.hp), v.st, v.by, h.r2(v.face), v.moving ? 1 : 0, v.duckT > 0 ? 1 : 0, v.taken ? 1 : 0 ];
  function applyRow(s, R, q, snap) {
    if (!Array.isArray(q)) return;
    const v = R.v, [x, y, f, hp, st, by, face, mv, dk, tk] = q;
    if (typeof x !== "number" || typeof y !== "number" || !s.lv.floors[f]) return;
    if (v.floor !== f || snap) {
      v.x = x;
      v.y = y;
    }
    v.nx = x;
    v.ny = y;
    v.floor = f;
    v.hp = +hp || 0;
    v.face = +face || 0;
    v.moving = !!mv;
    v.duckT = dk ? Math.max(v.duckT, .3) : 0;
    if (tk) v.taken = true;
    if (st === 3 && v.st !== 3) {
      die(s, R, false);
      return;
    }
    if (st === 4) {
      v.st = 4;
      v.by = null;
      return;
    }
    if (st !== v.st) {
      if (st === 2 || v.st === 2) setSt(R, st, by, false); else {
        v.st = st;
        v.by = by;
      }
    } else v.by = by;
  }
  const here = (R, p) => p && p.alive && p.floor === R.v.floor && Math.hypot(p.x - R.v.x, p.y - R.v.y) < OUT_D;
  M.K.escort = {
    setup(s, lv, rng) {
      const q = SX.prog.MIS_Q.find(x => x.kind === "escort" && x.b === s.b);
      if (!q) return null;
      const sp = pick(lv, rng);
      if (!sp) return null;
      const R = {
        id: q.id,
        who: q.who || q.name,
        f: sp.f,
        live: false,
        snapT: 0,
        seen: new WeakSet,
        said: false
      };
      R.v = mk(R, lv.floors[sp.f], sp.x, sp.y, rng);
      return R;
    },
    trk(s, q) {
      const R = st0(s);
      if (!R || R.id !== q.id) return null;
      const v = R.v, nm = q.name + " — ";
      if (!v.alive) return null;
      if (v.st === 2) {
        if (v.by === h.me()) return {
          t: nm + R.who + " 데리고 탈출구로(4칸 안)",
          p: Math.max(0, Math.round(v.hp)) + "/" + HP
        };
        if (teamOf(v.by) === myTeam()) return {
          t: nm + jo(h.nameOf(v.by), "이", "가") + " 데려가는 중",
          p: Math.max(0, Math.round(v.hp)) + "/" + HP
        };
        return {
          t: nm + "다른 팀이 데려가고 있습니다"
        };
      }
      if (v.st === 1) return {
        t: nm + h.fname(v.floor) + "에서 " + jo(R.who, "이", "가") + (v.taken ? " 기다립니다" : " 숨어 있습니다")
      };
      return null;
    },
    okText: (s, q) => {
      const R = st0(s);
      return (R ? R.who : q.name) + " 데리고 나옴";
    },
    blocked(s, q) {
      const R = st0(s);
      return R && R.id === q.id && R.v.st === 4 && !(M.state(q.id) || {}).ok ? "다른 팀이 데리고 나갔습니다 — 이 판에서는 할 수 없습니다" : "";
    },
    target(s, F, p, put) {
      const R = st0(s);
      if (!R || !R.live) return;
      const v = R.v;
      if (v.floor !== F.idx || !v.alive || v.st !== 1) return;
      const d = Math.hypot(v.x - p.x, v.y - p.y);
      if (d > REACH) return;
      const lab = M.teamHas(R.id) ? "🧑 " + R.who + " — 같이 가기" : "🧑 " + R.who;
      put({
        kd: "escort",
        x: v.x,
        y: v.y - 1,
        label: lab
      }, [ v.x - .45, v.y - 1.1, v.x + .45, v.y + .2 ], d);
    },
    interact(s, t) {
      const R = st0(s);
      if (!R || !R.live || M.jobOn()) return;
      const v = R.v;
      if (!v.alive || v.st !== 1) return;
      if (!M.teamHas(R.id)) {
        SX.log("지금은 쓸 일이 없습니다", "warn");
        SX.audio.play("denied");
        return;
      }
      if (h.isAuth()) take(s, R, h.me()); else M.sendK("escort", {
        q: "take"
      }, h.R_().auth);
    },
    tick(s, dt, auth) {
      const R = st0(s);
      if (!R) return;
      if (!R.live && anyHolder(s, R.id)) {
        R.live = true;
        h.unstick(s.lv.floors[R.v.floor], R.v);
        R.v.nx = R.v.x;
        R.v.ny = R.v.y;
      }
      if (!R.live || R.v.st === 4) return;
      const v = R.v, p = PL();
      if (auth) tickAuth(s, R, dt);
      anim(R, dt, auth);
      if (v.st === 2 && v.by === h.me() && here(R, p)) v.nearT = SX.raid.t;
      if (!R.said && v.alive && M.mine(R.id) && p && p.floor === v.floor && Math.hypot(p.x - v.x, p.y - v.y) < 7) {
        R.said = true;
        SX.log("🧑 " + R.who + " — 다가가서 [" + h.key() + "] 같이 가기", "info");
      }
      if (auth && h.R_()) {
        R.snapT -= dt;
        if (R.snapT <= 0) {
          R.snapT = v.st === 2 ? .15 : 1;
          M.sendK("escort", {
            q: "s",
            r: row(v)
          });
        }
      }
    },
    onMsg(s, from, d) {
      const R = st0(s);
      if (!R) return;
      const auth = h.isAuth();
      if (!R.live && anyHolder(s, R.id)) R.live = true;
      switch (d.q) {
       case "s":
        if (!auth) applyRow(s, R, d.r, false);
        break;

       case "st":
        {
          const v = R.v;
          if (auth) break;
          if (typeof d.x === "number" && v.floor !== d.f && s.lv.floors[d.f]) {
            v.x = v.nx = d.x;
            v.y = v.ny = d.y;
            v.floor = d.f;
          }
          setSt(R, d.st | 0, d.by, false);
          break;
        }

       case "take":
        if (auth) {
          R.live = R.live || anyHolder(s, R.id);
          take(s, R, from);
        }
        break;

       case "die":
        die(s, R, false);
        break;

       case "hit":
        if (auth) hurt(s, R, Math.max(0, Math.min(200, +d.d || 0)), null);
        break;

       case "out":
        {
          const v = R.v;
          v.st = 4;
          v.by = null;
          v.moving = false;
          if (auth) M.sendK("escort", {
            q: "st",
            st: 4,
            by: null,
            x: h.r2(v.x),
            y: h.r2(v.y),
            f: v.floor
          });
          break;
        }
      }
    },
    hud(s) {
      const R = st0(s), p = PL();
      if (!R || !R.live) return null;
      const v = R.v;
      if (!v.alive || v.st !== 2 || v.by !== h.me() || !p) return null;
      if (v.duckT > 0 && p.floor === v.floor && Math.hypot(p.x - v.x, p.y - v.y) < 10) return {
        text: "🧑 " + jo(R.who, "이", "가") + " 총소리에 몸을 숙였습니다",
        col: "rgb(240,190,90)"
      };
      if (p.floor !== v.floor || Math.hypot(p.x - v.x, p.y - v.y) > 6) return {
        text: "🧑 " + jo(R.who, "이", "가") + " 뒤처졌습니다 — 기다려 주십시오",
        col: "rgb(240,190,90)"
      };
      return null;
    },
    hud2(s) {
      const R = st0(s);
      if (!R || !R.live) return null;
      const v = R.v;
      if (!v.alive || v.st !== 2 || teamOf(v.by) !== myTeam()) return null;
      return {
        text: "🧑 " + R.who + " 체력 " + Math.max(0, Math.round(v.hp)) + "/" + HP + " · 4칸 안에서 탈출하십시오",
        col: null
      };
    },
    marks(s, out) {
      const R = st0(s);
      if (!R || !R.live) return;
      const v = R.v;
      if (v.alive && v.st !== 4 && M.teamHas(R.id)) out.push({
        f: v.floor,
        x: v.x,
        y: v.y,
        col: "rgb(150,230,150)",
        label: "🧑 " + R.who
      });
    },
    pois(s, f, o) {
      const R = st0(s);
      if (!R || !R.live) return;
      const v = R.v;
      if (v.alive && v.st !== 4 && v.floor === f && M.teamHas(R.id)) o.push({
        kind: "ping",
        x: v.x,
        y: v.y
      });
    },
    actors(s, fi) {
      const R = st0(s);
      return R && R.live && R.v.floor === fi && R.v.st !== 4 ? [ R.v ] : [];
    },
    targets(s, out) {
      const R = st0(s);
      if (!R || !R.live) return;
      const v = R.v;
      if (!v.alive || v.st !== 1 && v.st !== 2) return;
      if (!v._tg) v._tg = {
        mis: v,
        misK: "escort",
        player: false,
        get x() {
          return v.x;
        },
        get y() {
          return v.y;
        },
        get alive() {
          return v.alive && (v.st === 1 || v.st === 2) && R.live;
        },
        get floor() {
          return v.floor;
        },
        stealth: 1,
        cover: null,
        view: null
      };
      out.push(v._tg);
    },
    hurt(s, a, dmg, e) {
      const R = st0(s);
      if (R && a === R.v && h.isAuth()) hurt(s, R, dmg, e ? Math.atan2(a.y - e.y, a.x - e.x) : null);
    },
    bulletHit(s, b, dist) {
      const R = st0(s);
      if (!R || !R.live) return false;
      const v = R.v;
      if (!v.alive || v.st === 3 || v.st === 4 || v.floor !== b.floor) return false;
      if (Math.abs(v.x - b.x) >= .35 || Math.abs(v.y - .5 - b.y) >= .55) return false;
      if (b.vis) return true;
      const fk = b.from && b.from.kind;
      if (fk === "enemy") {
        if (h.isAuth()) hurt(s, R, b.dmg || 0, Math.atan2(b.y - b.oy, b.x - b.ox));
        return true;
      }
      if (b.from === PL()) {
        let dmg = b.dmg || 0;
        if (b.falloff) dmg *= Math.max(.25, 1 - dist / b.falloff);
        if (h.isAuth()) hurt(s, R, dmg, Math.atan2(b.y - b.oy, b.x - b.ox)); else {
          M.sendK("escort", {
            q: "hit",
            d: Math.round(dmg)
          }, h.R_().auth);
          const F = s.lv.floors[v.floor];
          if (F && h.A_().bleedAt) h.A_().bleedAt(F, v.x, v.y);
        }
        return true;
      }
      return false;
    },
    dump(s) {
      const R = st0(s);
      return {
        live: R.live ? 1 : 0,
        r: row(R.v)
      };
    },
    worldIn(s, w, opt) {
      const R = st0(s);
      if (!R || !w) return;
      if (w.live) R.live = true;
      applyRow(s, R, w.r, true);
    },
    onEnd(s, win) {
      const R = st0(s);
      if (!R || !R.live || !win) return;
      const v = R.v, p = PL();
      if (!v.alive || v.st !== 2 || teamOf(v.by) !== myTeam()) return;
      const near = here(R, p) || v.by === h.me() && v.nearT != null && SX.raid.t - v.nearT < 6;
      if (!near) return;
      v.st = 4;
      v.by = null;
      M.sendK("escort", {
        q: "out"
      });
      M.ok(R.id, R.who + " 데리고 나옴", true);
    }
  };
})(window.SX);
