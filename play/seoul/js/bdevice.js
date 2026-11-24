(function(SX) {
  "use strict";
  const B = SX.bdev = {};
  B.N = {
    PA_USES: 3,
    PA_CD: 30,
    PA_LURE: 40,
    PA_T: 1.5,
    PA_EVERY: 1.2,
    PA_REP: 12,
    GEN_T: 8,
    GEN_SEE: 1.2,
    LAMP_GAP: 9,
    LAMP_MAX: 40,
    BUS_T: 4,
    BUS_GO: 6,
    BUS_IDLE: 20,
    BUS_LURE: 40,
    BUS_HORN: 4,
    BUS_LURE2: 30,
    PRY_T: 10,
    FUSE_T: 3,
    FUSE_WAIT: 15,
    BOOM_R: 6.5,
    BOOM_DMG: 180,
    SH_USES: 3,
    SH_CD: 30,
    SH_UP: 90,
    SH_T: 1.5,
    SH_DROP: 6,
    SH_RISE: 4,
    FD_T: 1,
    FD_OPEN: 4,
    KEY_T: 5,
    MALL_RISE: 4,
    PIN_T: 2,
    HINT_D: 5
  };
  B.CAP = {
    hos: 6e5,
    base: 4e6,
    mall: 2e6,
    villa: 3e5
  };
  const N = B.N, KINDS = [ "school", "hos", "metro", "base", "office", "mall", "villa" ], HUE = "rgb(90,216,232)";
  const MEDS = [ "구급킷", "진통 주사기", "항생제", "지혈대" ], PARCEL = [ "노트북", "손목시계", "금목걸이", "항생제", "구급킷", "진통 주사기" ];
  let S = null, warned = false;
  const A_ = () => SX.actors, M_ = () => SX.map, T_ = () => SX.map.T;
  const R_ = () => SX.coop && SX.coop.raid && !SX.coop.raid.offline ? SX.coop.raid : null;
  const isAuth = () => !R_() || !SX.coop.runEnemies || SX.coop.runEnemies();
  const me = () => R_() ? R_().me : "me";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r2 = v => Math.round(v * 100) / 100;
  const key = () => SX.label ? SX.label("interact") : "F";
  const fname = f => SX.raid.fname ? SX.raid.fname(f) : f + 1 + "층";
  const say = (m, c) => {
    if (SX.log) SX.log(m, c);
  };
  function send(d, to) {
    if (R_() && SX.coop.bdSend) SX.coop.bdSend(d, to);
  }
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
  function playAll(name, f, x, y, range, vol) {
    const p = A_().player;
    if (!p) return;
    if (p.floor === f) SX.audio.play(name, {
      x,
      y,
      range: range || 30,
      vol: vol == null ? 1 : vol
    }); else SX.audio.play(name, {
      vol: (vol == null ? 1 : vol) * .18,
      muffle: true
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
    if (r.big || r.hall || r.open || r.part || r.nook || r.vault || r.ctrl) return false;
    if (F.vault && F.vault.r === r) return false;
    if (F.ctrl && F.ctrl.r === r) return false;
    return !stairIn(F, r);
  }
  function freeT(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y);
    if (F.tile(x, y) !== T_().FLOOR || F.solid[i] || F.doorAt.get(i) || blk && blk.has(i)) return false;
    if (F.propAt && F.propAt[i]) return false;
    return A_().free(F, x + .5, y + .5, .3);
  }
  function nearDoor(F, x, y) {
    for (const [dx, dy] of [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ]) if (F.in(x + dx, y + dy) && F.tile(x + dx, y + dy) === T_().DOOR) return true;
    return false;
  }
  function pass(F, x, y, blk) {
    if (!F.in(x, y)) return false;
    const i = F.i(x, y), t = F.tile(x, y), T = T_();
    if (blk && blk.has(i)) return false;
    if (t === T.DOOR) {
      const d = F.doorAt.get(i);
      return !d || !d.locked;
    }
    if (t !== T.FLOOR && t !== T.STAIR) return false;
    return !F.solid[i];
  }
  function unstick(F, a) {
    const A = A_();
    if (!a || A.free(F, a.x, a.y, .3)) return;
    for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = Math.floor(a.x) + dx + .5, y = Math.floor(a.y) + dy + .5;
      if (A.free(F, x, y, .3) && pass(F, Math.floor(x), Math.floor(y))) {
        a.x = x;
        a.y = y;
        return;
      }
    }
  }
  const topOf = lv => lv.roofIdx != null ? lv.roofIdx : lv.building.floors | 0;
  const roomsOf = F => (F.rooms || []).filter(Boolean);
  const range = (a, b) => {
    const o = [];
    for (let i = a; i <= b; i++) o.push(i);
    return o;
  };
  const cx0 = (lv, F) => lv.X0 != null && lv.X1 != null ? (lv.X0 + lv.X1 + 1) / 2 : F.W / 2, cy0 = (lv, F) => lv.Y0 != null && lv.Y1 != null ? (lv.Y0 + lv.Y1 + 1) / 2 : F.H / 2;
  function unstickAll(F, rect) {
    const A = A_(), p = A.player, inR = a => !rect || a.x > rect[0] - .4 && a.x < rect[2] + .4 && a.y > rect[1] - .4 && a.y < rect[3] + .4;
    if (p && p.floor === F.idx && inR(p)) unstick(F, p);
    for (const al of A.allies || []) if (al.alive && al.floor === F.idx && inR(al)) unstick(F, al);
    if (isAuth()) for (const e of A.enemies) if (e.alive && e.floor === F.idx && inR(e)) unstick(F, e);
  }
  function who(id) {
    const R = R_();
    if (!R || id == null || id === me()) return "";
    const n = R.names && R.names.get(id);
    return " (" + (n || "동료") + " 님)";
  }
  if (SX.audio && SX.audio.addSounds) SX.audio.addSounds({
    bank: {
      bdTbE5: [ [ "bd_tb_e5", 1, 1 ] ],
      bdTbC5: [ [ "bd_tb_c5", 1, 1 ] ],
      bdTbD5: [ [ "bd_tb_d5", 1, 1 ] ],
      bdTbG4: [ [ "bd_tb_g4", 1, 1 ] ],
      bdPa: [ [ "bd_pa", 1, 1 ] ],
      bdPull: [ [ "bd_pull_1", 1, 1 ], [ "bd_pull_2", 1, 1 ], [ "bd_pull_3", 1, 1 ] ],
      bdGen: [ [ "bd_gen", 1, 1 ] ],
      bdDiesel: [ [ "bd_diesel", 1, 1 ] ],
      bdIdle: [ [ "bd_idle", 1, 1 ] ],
      bdHorn: [ [ "bd_horn", 1, 1 ] ],
      bdShutDn: [ [ "bd_shut_dn", 1, 1 ] ],
      bdShutHit: [ [ "bd_shut_hit", 1, 1 ] ],
      bdShutUp: [ [ "bd_shut_up", 1, 1 ] ],
      bdFuse: [ [ "bd_fuse", 1, 1 ] ],
      bdPry: [ [ "bd_pry_1", 1, 1 ], [ "bd_pry_2", 1, 1 ] ]
    },
    gain: {
      bdTbE5: .7,
      bdTbC5: .7,
      bdTbD5: .7,
      bdTbG4: .7,
      bdPa: .95,
      bdPull: .9,
      bdGen: .55,
      bdDiesel: .9,
      bdIdle: .5,
      bdHorn: .85,
      bdShutDn: .8,
      bdShutHit: .9,
      bdShutUp: .8,
      bdFuse: .6,
      bdPry: .9
    }
  });
  function occ(s, F) {
    let o = s.oc[F.idx];
    if (o) return o;
    o = s.oc[F.idx] = new Set;
    const e = s.oe[F.idx] = new Set;
    const mark = (set, x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (F.in(x, y)) set.add(F.i(x, y));
    };
    for (const p of F.props) mark(o, Math.floor(p.x), Math.floor(p.y), Math.ceil(p.x + p.w) - 1, Math.ceil(p.y + p.h) - 1);
    for (const z of F.zones) mark(o, z.x - 2, z.y - 2, z.x + z.w + 1, z.y + z.h + 1);
    for (const st of F.stairs) mark(o, st.x - 2, st.y - 2, st.x + st.w + 1, st.y + st.h + 1);
    for (const t of F.traps || []) {
      const L = t.len || 1;
      mark(o, t.x - 1, t.y - 1, t.x + (t.horiz ? L : 1), t.y + (t.horiz ? 1 : L));
    }
    const ev = SX.ev && SX.ev._S ? SX.ev._S() : null;
    if (ev && ev.o && ev.lv === s.lv) {
      const c = ev.cr;
      if (c && c.f === F.idx && c.bx != null) mark(e, c.bx - 9, c.wy - 9, c.bx + 9, c.wy + 9);
      for (const v of ev.sv || []) if (v.floor === F.idx && v.room) mark(e, v.room.x0 - 1, v.room.y0 - 1, v.room.x1 + 1, v.room.y1 + 1);
      const rd = ev.rd;
      if (rd && rd.cf === F.idx && rd.room) mark(e, rd.room.x0 - 1, rd.room.y0 - 1, rd.room.x1 + 1, rd.room.y1 + 1);
      if (rd && rd.f === F.idx) mark(e, Math.floor(rd.x) - 3, Math.floor(rd.y) - 3, Math.floor(rd.x) + 3, Math.floor(rd.y) + 3);
    }
    const wk = SX.week && SX.week._S ? SX.week._S() : null;
    if (wk && wk.lv === s.lv) {
      for (const g of wk.guards || []) if (g && g.floor === F.idx) mark(e, Math.floor(g.x) - 2, Math.floor(g.y) - 2, Math.floor(g.x) + 2, Math.floor(g.y) + 2);
      for (const c of wk.crates || []) if (c && c.f === F.idx) mark(e, c.x - 1, c.y - 1, c.x + 1, c.y + 1);
      const v = wk.v;
      if (v && v.f === F.idx) {
        if (v.r) mark(e, v.r.x0 - 1, v.r.y0 - 1, v.r.x1 + 1, v.r.y1 + 1); else mark(e, v.x - 2, v.y - 2, v.x + 3, v.y + 2);
      }
      if (F.idx === 0) for (const p of wk.bar || []) if (p) mark(e, Math.floor(p.x) - 1, Math.floor(p.y) - 1, Math.floor(p.x) + 2, Math.floor(p.y) + 1);
    }
    const ms = SX.mis && SX.mis._S ? SX.mis._S() : null, mk = ms && ms.lv === s.lv ? ms.k || {} : null;
    const pw = s.lv.misPow;
    if (pw && !pw.none) {
      const nf = (s.lv.building && s.lv.building.floors) | 0;
      if (F.idx < nf) mark(e, pw.ex - 2, pw.ey - 2, pw.ex + 3, pw.ey + 4);
      if (F.idx === pw.gf) mark(e, pw.gx - 2, pw.gy - 2, pw.gx + 3, pw.gy + 2);
    }
    if (mk) {
      const ph = mk.photo;
      for (const q of ph && ph.list || []) if (q && q.f === F.idx) {
        if (q.room) mark(e, q.room.x0 - 1, q.room.y0 - 1, q.room.x1 + 1, q.room.y1 + 1); else mark(e, Math.floor(q.x) - 2, Math.floor(q.y) - 2, Math.floor(q.x) + 2, Math.floor(q.y) + 2);
      }
      const hd = mk.hold;
      if (hd && hd.f === F.idx && hd.tx != null) mark(e, hd.tx - 3, hd.ty - 3, hd.tx + 3, hd.ty + 3);
      const es = mk.escort, v = es && es.v;
      if (v && v.floor === F.idx) mark(e, Math.floor(v.x) - 3, Math.floor(v.y) - 3, Math.floor(v.x) + 3, Math.floor(v.y) + 3);
    }
    for (const i of e) o.add(i);
    return o;
  }
  function touchE(s, F, r) {
    occ(s, F);
    const e = s.oe[F.idx];
    for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) if (F.in(x, y) && e.has(F.i(x, y))) return true;
    return false;
  }
  function markP(s, F, x, y, w, h, m) {
    const o = occ(s, F);
    m = m == null ? 1 : m;
    for (let yy = y - m; yy < y + h + m; yy++) for (let xx = x - m; xx < x + w + m; xx++) if (F.in(xx, yy)) o.add(F.i(xx, yy));
  }
  const okT = (F, x, y, oc) => freeT(F, x, y) && !oc.has(F.i(x, y));
  function wallOk(F, x, y, w, oc) {
    const T = T_();
    for (let k = 0; k < w; k++) {
      const xx = x + k;
      if (!okT(F, xx, y, oc) || nearDoor(F, xx, y)) return false;
      if (!F.in(xx, y - 1) || F.tile(xx, y - 1) !== T.WALL) return false;
      if (!okT(F, xx, y + 1, oc) || nearDoor(F, xx, y + 1)) return false;
    }
    return true;
  }
  function roomSpots(F, r, w, oc) {
    const o = [];
    for (let x = r.x0; x <= r.x1 - w + 1; x++) if (wallOk(F, x, r.y0, w, oc)) o.push({
      x,
      y: r.y0
    });
    return o;
  }
  function corrSpots(F, w, oc) {
    const o = [];
    for (let y = 1; y < F.H - 1; y++) for (let x = 1; x < F.W - w; x++) {
      let ok = true;
      for (let k = 0; k < w && ok; k++) {
        const i = F.i(x + k, y);
        if (F.room[i] !== -1 || !F.inside[i]) ok = false;
      }
      if (ok && wallOk(F, x, y, w, oc)) o.push({
        x,
        y
      });
    }
    return o;
  }
  function freeIn(F, r, oc, d) {
    const o = [], dt = d ? doorTiles(d) : [];
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      if (!okT(F, x, y, oc) || nearDoor(F, x, y)) continue;
      if (dt.some(([dx, dy]) => Math.abs(dx - x) + Math.abs(dy - y) <= 2)) continue;
      o.push({
        x,
        y
      });
    }
    return o;
  }
  const doorOk = d => !d.exit && !d.locked && !d.key && !d.evShut && !d.fireShut && !d.bdLock && !d.vault;
  function put(s, F, kind, x, y, o) {
    const p = M_().addProp(F, kind, x, y, o || {});
    if (!p) throw new Error("bdev addProp " + kind);
    p.bdev = true;
    s.adds.push([ F, p ]);
    return p;
  }
  function unput(s, F, p) {
    M_().removeProp(F, p);
    const k = s.adds.findIndex(a => a[1] === p);
    if (k >= 0) s.adds.splice(k, 1);
  }
  function lockDoor(s, F, d) {
    s.locks.push([ d, {
      open: d.open,
      locked: d.locked,
      fireShut: d.fireShut,
      evShut: d.evShut,
      bdLock: d.bdLock
    } ]);
    d.open = false;
    d.locked = true;
    d.fireShut = true;
    d.evShut = true;
    d.bdLock = true;
  }
  function unlockDoor(s, F, d) {
    d.locked = false;
    d.fireShut = false;
    d.evShut = false;
    d.bdLock = false;
    d.open = true;
    const k = s.locks.findIndex(a => a[0] === d);
    if (k >= 0) s.locks.splice(k, 1);
    inval(F);
  }
  function attach(F, p, cont) {
    if (!p || !cont) return;
    p.cont = cont;
    cont.prop = p;
    cont.floor = F.idx;
    cont.x = p.x + p.w / 2;
    cont.y = p.y + p.h / 2;
    if (F.conts.indexOf(cont) < 0) F.conts.push(cont);
  }
  function lootCtx(f) {
    return SX.game && SX.game.lootCtx ? SX.game.lootCtx(f) : {
      building: SX.raid.level.building,
      floor: f
    };
  }
  function items(rng, names, n) {
    const I = SX.items, o = [], pool = names.slice();
    rng.shuffle(pool);
    for (const nm of pool) {
      if (o.length >= n) break;
      const it = I.mk(nm);
      if (it) o.push(it);
    }
    return o;
  }
  const BUILD = {};
  BUILD.school = function(s, lv, rng) {
    const n = topOf(lv);
    if (n < 2) return null;
    const fl = rng.shuffle(range(1, n - 1));
    let pa = null;
    for (const f of fl) {
      const F = lv.floors[f], oc = occ(s, F);
      const rs = roomsOf(F).filter(r => okRoom(F, r) && !touchE(s, F, r));
      const pref = rs.filter(r => r.theme === "office").concat(rng.shuffle(rs.filter(r => r.theme === "classroom" || r.theme === "library" || r.theme === "lab")));
      for (const r of pref) {
        const sp = roomSpots(F, r, 2, oc);
        if (sp.length) {
          pa = Object.assign({
            f
          }, rng.pick(sp));
          break;
        }
      }
      if (pa) break;
    }
    if (!pa) for (const f of fl) {
      const F = lv.floors[f], sp = corrSpots(F, 2, occ(s, F));
      if (sp.length) {
        pa = Object.assign({
          f
        }, rng.pick(sp));
        break;
      }
    }
    if (!pa) return null;
    const F = lv.floors[pa.f];
    pa.w = 2;
    pa.h = 1;
    pa.prop = put(s, F, "bdPA", pa.x, pa.y, {
      solid: true,
      cover: .5
    });
    markP(s, F, pa.x, pa.y, 2, 1);
    const spk = [];
    for (let f = 0; f < n; f++) {
      const G = lv.floors[f], sp = corrSpots(G, 1, occ(s, G));
      if (!sp.length) continue;
      const cx = cx0(lv, G), cy = cy0(lv, G);
      sp.sort((a, b) => Math.hypot(a.x + .5 - cx, a.y - cy) - Math.hypot(b.x + .5 - cx, b.y - cy));
      const q = {
        f,
        x: sp[0].x,
        y: sp[0].y
      };
      q.prop = put(s, G, "bdSpk", q.x, q.y, {
        solid: false,
        cover: 0
      });
      markP(s, G, q.x, q.y, 1, 1);
      spk.push(q);
    }
    if (!spk.length) return null;
    return {
      k: "school",
      f: pa.f,
      pa,
      spk,
      uses: N.PA_USES,
      cd: 0,
      on: null
    };
  };
  BUILD.hos = function(s, lv, rng) {
    const gf = lv.parkIdx != null && lv.floors[lv.parkIdx] ? lv.parkIdx : 0, F = lv.floors[gf], oc = occ(s, F);
    const rs = roomsOf(F).filter(r => okRoom(F, r) && !touchE(s, F, r));
    let g = null;
    for (const r of rng.shuffle(rs.filter(r => r.theme === "store")).concat(rng.shuffle(rs.filter(r => r.theme !== "store")))) {
      const sp = roomSpots(F, r, 2, oc);
      if (sp.length) {
        g = rng.pick(sp);
        break;
      }
    }
    if (!g) {
      const sp = corrSpots(F, 2, oc);
      if (sp.length) g = rng.pick(sp);
    }
    if (!g) return null;
    const gen = {
      f: gf,
      x: g.x,
      y: g.y,
      w: 2,
      h: 1
    };
    gen.prop = put(s, F, "bdGen", g.x, g.y, {
      solid: true,
      cover: .6
    });
    markP(s, F, g.x, g.y, 2, 1);
    let fr = null;
    const n = topOf(lv), fl = rng.shuffle(range(0, n - 1));
    for (const th of [ "surgery", "ward", null ]) {
      for (const f of fl) {
        const G = lv.floors[f], oc2 = occ(s, G);
        for (const r of rng.shuffle(roomsOf(G).filter(r => okRoom(G, r) && !touchE(s, G, r) && (th ? r.theme === th : true)))) {
          const sp = roomSpots(G, r, 1, oc2);
          if (sp.length) {
            fr = Object.assign({
              f
            }, rng.pick(sp));
            break;
          }
        }
        if (fr) break;
      }
      if (fr) break;
    }
    if (fr) {
      const G = lv.floors[fr.f];
      fr.w = 1;
      fr.h = 1;
      fr.prop = put(s, G, "bdFridge", fr.x, fr.y, {
        solid: true,
        cover: .5
      });
      markP(s, G, fr.x, fr.y, 1, 1);
      fr.cont = M_().mkCont("medcab", items(rng, MEDS, 2 + rng.i(2)), rng);
      fr.cont.name = "약품 냉장 보관함";
    }
    return {
      k: "hos",
      f: gf,
      gen,
      fr,
      wet: !!SX.raid.flood,
      st: 0,
      c: 0,
      by: null,
      lamps: [],
      t: 0
    };
  };
  function busPath(F, z, sx, fx, y0, e) {
    const T = T_(), a = Math.min(sx, fx), b = Math.max(sx, fx) + 4, rm = [];
    for (let y = y0; y <= y0 + 1; y++) for (let x = a; x <= b; x++) {
      if (!F.in(x, y)) return null;
      const t = F.tile(x, y), i = F.i(x, y);
      if (!(t === T.GROUND || t === T.FLOOR && !F.inside[i])) return null;
      if (e && e.has(i)) return null;
      for (const q of F.zones) if (q !== z && x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) return null;
      for (const tr of F.traps || []) {
        const L = tr.len || 1;
        if (tr.horiz ? y === tr.y && x >= tr.x && x < tr.x + L : x === tr.x && y >= tr.y && y < tr.y + L) return null;
      }
    }
    for (const p of F.props) {
      if (p.x + p.w <= a || p.x >= b + 1 || p.y + p.h <= y0 || p.y >= y0 + 2) continue;
      if (p.cont || p.npc || p.kind === "lamp" || p.bdev) return null;
      rm.push(p);
    }
    return rm;
  }
  BUILD.metro = function(s, lv, rng) {
    const F = lv.floors[0];
    if (!F) return null;
    const zs = F.zones.filter(z => z.kind === "door" && z.door && !z.locked && !z.door.locked);
    if (zs.length < 2) return null;
    occ(s, F);
    const oe = s.oe[F.idx];
    for (const z of rng.shuffle(zs.filter(z => z.door.side === "n" || z.door.side === "s"))) {
      const d = z.door, x0 = d.x - 1, y0 = d.side === "s" ? d.y + 1 : d.y - 2;
      for (const dir of [ -1, 1 ]) {
        const sx = x0 + dir * N.BUS_GO, rm = busPath(F, z, sx, x0, y0, oe);
        if (!rm) continue;
        for (const p of rm) {
          M_().removeProp(F, p);
          s.rm.push([ F, p ]);
        }
        const prop = put(s, F, "bdBus", sx, y0, {
          solid: true,
          tall: true,
          cover: 1,
          v: 0
        });
        prop.bdWall = true;
        markP(s, F, Math.min(sx, x0), y0, Math.abs(sx - x0) + 5, 2, 0);
        unstickAll(F, [ sx, y0, sx + 5, y0 + 2 ]);
        return {
          k: "metro",
          f: 0,
          z,
          d,
          x0,
          y0,
          sx,
          st: 0,
          t: 0,
          prop,
          idle: 0,
          lamp: null
        };
      }
    }
    return null;
  };
  BUILD.base = function(s, lv, rng) {
    const F = lv.floors[0];
    if (!F) return null;
    const oc = occ(s, F), good = [];
    for (const r of roomsOf(F)) {
      if (!okRoom(F, r) || touchE(s, F, r) || area(r) < 12 || area(r) > 260) continue;
      const ds = doorsOf(F, r);
      if (ds.length !== 1 || !doorOk(ds[0])) continue;
      const fr = freeIn(F, r, oc, ds[0]);
      if (fr.length < 6) continue;
      good.push({
        r,
        d: ds[0],
        fr
      });
    }
    if (!good.length) return null;
    const pref = good.filter(q => q.r.theme === "armory" || q.r.theme === "store"), pool = (pref.length ? pref : good).sort((a, b) => area(a.r) - area(b.r));
    const g = rng.pick(pool.slice(0, Math.max(1, Math.ceil(pool.length / 2))));
    const ctx = lootCtx(0), fr = rng.shuffle(g.fr.slice()), want = 3 + rng.i(2), crates = [];
    const used = new Set, far = q => ![ ...used ].some(u => {
      const ux = u % F.W, uy = u / F.W | 0;
      return Math.abs(ux - q.x) <= 1 && Math.abs(uy - q.y) <= 1;
    });
    for (const q of fr) {
      if (crates.length >= want) break;
      if (!far(q)) continue;
      used.add(F.i(q.x, q.y));
      const cont = M_().mkCont("armory", SX.items.rollContainer(rng, "armory", ctx), rng);
      cont.name = "탄약 상자";
      const prop = put(s, F, "milCrate", q.x, q.y, {
        v: 1,
        solid: true,
        cover: .6
      });
      crates.push({
        x: q.x,
        y: q.y,
        prop,
        cont
      });
    }
    if (crates.length < 2) return null;
    let tnt = null;
    for (const q of fr) {
      if (!far(q)) continue;
      used.add(F.i(q.x, q.y));
      tnt = {
        x: q.x,
        y: q.y
      };
      break;
    }
    if (!tnt) return null;
    tnt.prop = put(s, F, "bdTnt", tnt.x, tnt.y, {
      solid: false,
      cover: 0
    });
    for (const c of crates) markP(s, F, c.x, c.y, 1, 1, 0);
    markP(s, F, tnt.x, tnt.y, 1, 1, 0);
    lockDoor(s, F, g.d);
    const ov = doorTiles(g.d).map(([x, y], k) => put(s, F, "bdDepotDoor", x, y, {
      solid: false,
      cover: 0,
      v: (g.d.horiz ? 10 : 0) + Math.min(k, 3)
    }));
    const r = g.r;
    return {
      k: "base",
      f: 0,
      r,
      door: g.d,
      ov,
      crates,
      tnt,
      open: false,
      fuse: null,
      boom: false,
      cx: (r.x0 + r.x1 + 1) / 2,
      cy: (r.y0 + r.y1 + 1) / 2
    };
  };
  function shutLines(s, F) {
    const T = T_(), oc = occ(s, F), out = [];
    const cor = (x, y) => F.in(x, y) && F.room[F.i(x, y)] === -1 && !!F.inside[F.i(x, y)] && F.tile(x, y) === T.FLOOR;
    const wall = (x, y) => F.in(x, y) && (F.tile(x, y) === T.WALL || F.tile(x, y) === T.WINDOW);
    const far3 = (x, y) => {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const t = F.tile(x + dx, y + dy);
        if (t === T.DOOR || t === T.STAIR) return false;
      }
      for (const st of F.stairs) if (x >= st.x - 3 && x < st.x + st.w + 3 && y >= st.y - 3 && y < st.y + st.h + 3) return false;
      for (const z of F.zones) if (x >= z.x - 3 && x < z.x + z.w + 3 && y >= z.y - 3 && y < z.y + z.h + 3) return false;
      return true;
    };
    const tileOk = (x, y) => freeT(F, x, y) && !oc.has(F.i(x, y)) && far3(x, y);
    for (let y = 1; y < F.H - 1; y++) for (let x = 1; x < F.W - 1; x++) {
      if (wall(x, y - 1) && cor(x, y)) {
        let y1 = y;
        while (cor(x, y1 + 1) && y1 - y < 7) y1++;
        const L = y1 - y + 1;
        if (L >= 2 && L <= 6 && wall(x, y1 + 1) && wall(x - 1, y - 1) && wall(x + 1, y - 1) && wall(x - 1, y1 + 1) && wall(x + 1, y1 + 1)) {
          let ok = true;
          const ts = [];
          for (let yy = y; yy <= y1 && ok; yy++) {
            if (!cor(x - 1, yy) || !cor(x + 1, yy) || !tileOk(x, yy)) ok = false; else ts.push([ x, yy ]);
          }
          if (ok) out.push({
            o: 0,
            ts,
            cx: x + .5,
            cy: (y + y1 + 1) / 2
          });
        }
      }
      if (wall(x - 1, y) && cor(x, y)) {
        let x1 = x;
        while (cor(x1 + 1, y) && x1 - x < 7) x1++;
        const L = x1 - x + 1;
        if (L >= 2 && L <= 6 && wall(x1 + 1, y) && wall(x - 1, y - 1) && wall(x - 1, y + 1) && wall(x1 + 1, y - 1) && wall(x1 + 1, y + 1)) {
          let ok = true;
          const ts = [];
          for (let xx = x; xx <= x1 && ok; xx++) {
            if (!cor(xx, y - 1) || !cor(xx, y + 1) || !tileOk(xx, y)) ok = false; else ts.push([ xx, y ]);
          }
          if (ok) out.push({
            o: 1,
            ts,
            cx: (x + x1 + 1) / 2,
            cy: y + .5
          });
        }
      }
    }
    return out;
  }
  BUILD.office = function(s, lv, rng) {
    const n = topOf(lv), fl = [];
    for (let f = 0; f < n; f++) {
      const F = lv.floors[f], c = rng.shuffle(shutLines(s, F)), pick = [], want = 1 + rng.i(2);
      for (const q of c) {
        if (pick.length >= want) break;
        if (pick.some(p => Math.hypot(p.cx - q.cx, p.cy - q.cy) < 10)) continue;
        pick.push(q);
      }
      const lines = pick.map(q => {
        for (const [x, y] of q.ts) markP(s, F, x, y, 1, 1, 1);
        const props = q.ts.map(([x, y], k) => {
          const p = put(s, F, "bdShutter", x, y, {
            solid: false,
            tall: false,
            cover: 0,
            v: q.o * 100 + (k === 0 ? 10 : 0)
          });
          p.bdShut = true;
          return p;
        });
        return {
          o: q.o,
          ts: q.ts,
          cx: q.cx,
          cy: q.cy,
          props,
          fd: 0,
          fdT: 0
        };
      });
      fl.push({
        f,
        lines,
        st: 0,
        t: 0
      });
    }
    if (!fl.some(q => q.lines.length)) return null;
    const F = lv.floors[0], oc = occ(s, F);
    let pn = null;
    const rs = roomsOf(F).filter(r => okRoom(F, r) && !touchE(s, F, r));
    for (const r of rng.shuffle(rs.filter(r => r.theme === "office" || r.theme === "reception" || r.theme === "store"))) {
      const sp = roomSpots(F, r, 2, oc);
      if (sp.length) {
        pn = rng.pick(sp);
        break;
      }
    }
    if (!pn) {
      const sp = corrSpots(F, 2, oc);
      if (sp.length) pn = rng.pick(sp);
    }
    if (!pn) for (const r of rng.shuffle(rs.slice())) {
      const sp = roomSpots(F, r, 2, oc);
      if (sp.length) {
        pn = rng.pick(sp);
        break;
      }
    }
    if (!pn) return null;
    const pan = {
      f: 0,
      x: pn.x,
      y: pn.y,
      w: 2,
      h: 1
    };
    pan.prop = put(s, F, "bdPanel", pn.x, pn.y, {
      solid: true,
      cover: .5
    });
    markP(s, F, pn.x, pn.y, 2, 1);
    return {
      k: "office",
      f: 0,
      pan,
      fl,
      uses: N.SH_USES,
      cd: 0
    };
  };
  BUILD.mall = function(s, lv, rng) {
    const n = topOf(lv);
    let best = null;
    for (const f of rng.shuffle(range(0, n - 1))) {
      const F = lv.floors[f], oc = occ(s, F), c = [];
      for (const r of roomsOf(F)) {
        if (!(r.theme === "shop" || r.theme === "store") || !okRoom(F, r) || touchE(s, F, r) || area(r) < 9 || area(r) > 120) continue;
        const ds = doorsOf(F, r);
        if (ds.length !== 1 || !doorOk(ds[0])) continue;
        const fr = freeIn(F, r, oc, ds[0]);
        if (fr.length < 4) continue;
        c.push({
          r,
          d: ds[0],
          fr
        });
      }
      if (c.length && (!best || best.c.length < 2 && c.length > best.c.length)) best = {
        f,
        c
      };
      if (best && best.c.length >= 2) break;
    }
    if (!best) return null;
    const f = best.f, F = lv.floors[f], oc = occ(s, F), ctx = lootCtx(f), shops = [];
    for (const g of rng.shuffle(best.c).slice(0, 2 + rng.i(2))) {
      const fr = rng.shuffle(g.fr.slice()), sh = {
        r: g.r,
        d: g.d,
        boxes: [],
        zs: []
      }, used = [];
      const far = q => !used.some(u => Math.abs(u.x - q.x) <= 1 && Math.abs(u.y - q.y) <= 2);
      const nb = 1 + rng.i(2);
      for (const q of fr) {
        if (sh.boxes.length >= nb) break;
        if (!far(q)) continue;
        const type = rng.chance(.5) ? "crate" : "shelf", w = type === "shelf" ? 2 : 1;
        if (w === 2 && !(okT(F, q.x + 1, q.y, oc) && !nearDoor(F, q.x + 1, q.y))) continue;
        const cont = M_().mkCont(type, SX.items.rollContainer(rng, type, ctx), rng);
        const prop = put(s, F, type, q.x, q.y, {
          solid: true
        });
        used.push(q);
        if (w === 2) used.push({
          x: q.x + 1,
          y: q.y
        });
        markP(s, F, q.x, q.y, w, 1, 0);
        sh.boxes.push({
          prop,
          cont
        });
      }
      const nz = 1 + rng.i(2);
      for (const q of fr) {
        if (sh.zs.length >= nz) break;
        if (!okT(F, q.x, q.y, oc) || !far(q)) continue;
        const e = A_().spawnEnemy(F, "zombie", q.x + .5, q.y + .5, rng, {
          building: lv.building,
          floor: f
        });
        if (!e) continue;
        e.alive = false;
        e.dormant = true;
        e.bdev = true;
        s.ens.push(e);
        sh.zs.push(e);
        used.push(q);
      }
      lockDoor(s, F, g.d);
      sh.ov = doorTiles(g.d).map(([x, y], k) => put(s, F, "bdShopShut", x, y, {
        solid: false,
        cover: 0,
        v: (g.d.horiz ? 10 : 0) + Math.min(k, 3)
      }));
      shops.push(sh);
    }
    if (!shops.length) return null;
    const sp = corrSpots(F, 1, oc);
    if (!sp.length) return null;
    const dmin = q => Math.min(...shops.map(h => Math.hypot(q.x + .5 - (h.r.x0 + h.r.x1 + 1) / 2, q.y + .5 - (h.r.y0 + h.r.y1 + 1) / 2)));
    const far = sp.filter(q => dmin(q) >= 10), kq = far.length ? rng.pick(far) : sp.slice().sort((a, b) => dmin(b) - dmin(a))[0];
    const kp = {
      f,
      x: kq.x,
      y: kq.y,
      w: 1,
      h: 1
    };
    kp.prop = put(s, F, "bdMallKey", kq.x, kq.y, {
      solid: false,
      cover: 0
    });
    markP(s, F, kq.x, kq.y, 1, 1);
    return {
      k: "mall",
      f,
      shops,
      kp,
      st: 0,
      t: 0
    };
  };
  BUILD.villa = function(s, lv, rng) {
    const F = lv.floors[0];
    if (!F) return null;
    const oc = occ(s, F);
    let sp = corrSpots(F, 2, oc);
    if (!sp.length) for (const r of roomsOf(F).filter(r => okRoom(F, r) && !touchE(s, F, r))) sp = sp.concat(roomSpots(F, r, 2, oc));
    if (!sp.length) return null;
    const ex = F.zones.filter(z => z.kind === "door"), dz = q => ex.length ? Math.min(...ex.map(z => Math.hypot(q.x + 1 - (z.x + z.w / 2), q.y - (z.y + z.h / 2)))) : 0;
    sp.sort((a, b) => dz(a) - dz(b));
    const lq = sp[0], lk = {
      f: 0,
      x: lq.x,
      y: lq.y,
      w: 2,
      h: 1
    };
    lk.prop = put(s, F, "bdLocker", lq.x, lq.y, {
      solid: true,
      cover: .6
    });
    markP(s, F, lq.x, lq.y, 2, 1);
    const n = topOf(lv), fl = rng.shuffle(range(1, n - 1)).concat([ 0 ]);
    let nt = null;
    for (const f of fl) {
      const G = lv.floors[f], oc2 = occ(s, G);
      const rs = rng.shuffle(roomsOf(G).filter(r => okRoom(G, r) && !touchE(s, G, r) && (r.theme === "bunk" || r.theme === "kitchen")));
      for (const r of rs) {
        const fr = freeIn(G, r, oc2, null);
        if (fr.length) {
          nt = Object.assign({
            f
          }, rng.pick(fr));
          break;
        }
      }
      if (nt) break;
    }
    if (!nt) return null;
    const G = lv.floors[nt.f];
    nt.prop = put(s, G, "bdNote", nt.x, nt.y, {
      solid: false,
      cover: 0,
      v: rng.i(2)
    });
    markP(s, G, nt.x, nt.y, 1, 1);
    const dong = 101 + rng.i(3), ho = (1 + rng.i(Math.max(1, n))) * 100 + 1 + rng.i(4), pin = String(rng.i(1e4)).padStart(4, "0");
    const cont = M_().mkCont("locker", items(rng, PARCEL, 1 + rng.i(2)), rng);
    cont.name = "무인 택배함";
    return {
      k: "villa",
      f: 0,
      lk,
      nt,
      dong,
      ho,
      pin,
      cont,
      holder: null,
      open: false
    };
  };
  function plan(lv) {
    const Rd = SX.raid, b = lv.building;
    if (!b || b.train || b.final || b.outdoor || Rd.tutMode || SX.course && SX.course.on) return null;
    return KINDS.indexOf(b.id) >= 0 ? b.id : null;
  }
  function undo(s) {
    const M = M_();
    for (const [F, p] of s.adds.splice(0)) M.removeProp(F, p);
    for (const [F, p] of s.rm.splice(0)) M.addProp(F, p.kind, p.x, p.y, {
      solid: p.solid,
      tall: p.tall,
      cover: p.cover,
      v: p.v,
      rot: p.rot
    });
    for (const [d, w] of s.locks.splice(0)) Object.assign(d, w);
    for (const e of s.ens.splice(0)) {
      const k = A_().enemies.indexOf(e);
      if (k >= 0) A_().enemies.splice(k, 1);
    }
  }
  function build(lv) {
    if (lv._bd) return lv._bd;
    const Rd = SX.raid, I = SX.items;
    const s = {
      lv,
      k: plan(lv),
      d: null,
      adds: [],
      rm: [],
      locks: [],
      ens: [],
      oc: {},
      oe: {},
      job: null,
      hint: {},
      said: {},
      hT: 0,
      zT: 0
    };
    lv._bd = s;
    if (!s.k) return s;
    if (SX.ev && SX.ev.ensure) try {
      SX.ev.ensure();
    } catch (e) {}
    if (SX.week && SX.week.ensure) try {
      SX.week.ensure();
    } catch (e) {}
    if (SX.mis && SX.mis.ensure) try {
      SX.mis.ensure();
    } catch (e) {}
    const u0 = I.uidGet ? I.uidGet() : null;
    try {
      if (I.uidSet) I.uidSet(1e12 + Rd.seed % 1e6 * 1e5 + 97e3);
      const rng = new SX.Rng(SX.hash("bdev:" + (Rd.seed >>> 0) + ":" + s.k) >>> 0);
      s.d = BUILD[s.k](s, lv, rng);
    } catch (e) {
      console.warn("[bdev] build", e);
      s.d = null;
    } finally {
      if (I.uidSet && u0 != null) I.uidSet(u0);
    }
    if (!s.d) {
      undo(s);
      s.k = null;
    }
    s.oc = {};
    s.oe = {};
    return s;
  }
  B.start = function(lv) {
    if (S && S.job) stopJob();
    loopsOff();
    S = build(lv);
  };
  B.ensure = function() {
    const lv = SX.raid && SX.raid.level;
    if (!lv) {
      S = null;
      return null;
    }
    if (!S || S.lv !== lv) {
      if (S && S.job) stopJob();
      S = build(lv);
    }
    if (S.d) regAll();
    return S;
  };
  function regAll() {
    const Rd = SX.raid;
    if (!Rd.reg || !Rd.conts) return;
    const d = S.d, L = [];
    if (d.k === "hos" && d.fr && d.fr.cont) L.push([ d.fr.cont, "bd:fr" ]);
    if (d.k === "base") d.crates.forEach((c, k) => L.push([ c.cont, "bd:a" + k ]));
    if (d.k === "mall") {
      let k = 0;
      for (const sh of d.shops) for (const b of sh.boxes) L.push([ b.cont, "bd:m" + k++ ]);
    }
    if (d.k === "villa") L.push([ d.cont, "bd:v" ]);
    for (const [c, k] of L) if (c && !c.bdGone && Rd.conts.get(k) !== c) Rd.reg(c, k);
  }
  const floorOf = f => S.lv.floors[f];
  const lerp = (a, b, k) => a + (b - a) * k;
  const lp2 = (a, b, k) => [ Math.round(lerp(a[0], b[0], k)), Math.round(lerp(a[1], b[1], k)) ];
  function side(dir, n, f, back) {
    if (dir === 1) return {
      n,
      f
    };
    if (dir === 3) return {
      n: [ -n[0], n[1] ],
      f: [ -f[0], f[1] ]
    };
    return {
      n: [ dir === 2 ? -4 : 4, n[1] - (back ? 2 : 0) ],
      f: [ dir === 2 ? 4 : -4, f[1] - (back ? 2 : 0) ],
      back: dir === 2
    };
  }
  const POSE = {
    pull(dir, t) {
      const c = t % 1.2 / 1.2, k = c < .55 ? c / .55 : 1 - (c - .55) / .45, e = k * k;
      const n = lp2([ 11, -10 ], [ 2, -23 ], e), f = lp2([ 9, -12 ], [ 5, -17 ], e * .6);
      if (dir === 0 || dir === 2) {
        const o = {
          n: [ dir === 2 ? -3 - Math.round(e * 6) : 3 + Math.round(e * 6), Math.round(lerp(-14, -24, e)) ],
          f: [ dir === 2 ? 3 : -3, -15 ],
          back: dir === 2
        };
        return o;
      }
      return side(dir, n, f);
    },
    pry(dir, t) {
      const s = Math.round(Math.sin(t * 5) * 3), q = Math.round(Math.sin(t * 5 + 1.3) * 2);
      return side(dir, [ 10, -16 + s ], [ 7, -15 + q ], true);
    }
  };
  function startJob(o) {
    const p = A_().player;
    if (!p || !S || S.job) return false;
    S.job = Object.assign({
      t: 0,
      x: p.x,
      y: p.y,
      f: p.floor,
      sT: 0,
      n: 0,
      ap: p.armPose || null,
      hw: !!p.hideWeapon
    }, o);
    p.reload = null;
    p.use = null;
    if (o.begin) o.begin(p);
    return true;
  }
  function stopJob() {
    const p = A_().player, j = S && S.job;
    if (!j) return;
    S.job = null;
    if (!p) return;
    if (j.pose === "kneel" && p.reviving === "bd") p.reviving = null;
    if (j.pose === "key") p.keyT = 0;
    if (j.pose === "type") p.typeT = 0;
    if (POSE[j.pose]) {
      p.armPose = j.ap;
      p.hideWeapon = j.hw;
    }
  }
  B.cancelJob = function() {
    if (S && S.job) {
      stopJob();
      return true;
    }
    return false;
  };
  B.jobOn = () => !!(S && S.job);
  B.kneel = () => !!(S && S.job && S.job.pose === "kneel");
  B.pose = () => {
    const j = S && S.job;
    return !j ? 0 : j.pose === "pull" ? 1 : j.pose === "pry" ? 2 : 0;
  };
  function jobTick(dt) {
    const j = S.job, p = A_().player;
    const bad = !p || !p.alive || p.down || p.floor !== j.f || Math.hypot(p.x - j.x, p.y - j.y) > .6 || SX.ui.isOpen && SX.ui.isOpen() || j.ok && !j.ok();
    if (bad) {
      stopJob();
      return;
    }
    j.t += dt;
    const left = Math.max(.01, j.T - j.t);
    if (j.pose === "kneel") p.reviving = "bd"; else if (j.pose === "key") p.keyT = left; else if (j.pose === "type") p.typeT = left; else if (POSE[j.pose]) {
      p.armPose = POSE[j.pose](A_().dirOf ? A_().dirOf(p.aim || 0) : 1, j.t);
      p.hideWeapon = true;
    }
    if (j.every) {
      j.sT -= dt;
      if (j.sT <= 0) {
        j.sT = j.every;
        j.n++;
        if (j.snd) j.snd(j.n, p);
      }
    }
    if (j.t >= j.T) {
      const done = j.done;
      stopJob();
      if (done) done();
    }
  }
  function jsnd(name, p, r, nr, vol) {
    SX.audio.play(name, {
      x: p.x,
      y: p.y,
      range: r,
      vol: vol == null ? .9 : vol
    });
    if (nr) A_().noise(floorOf(p.floor), p.x, p.y, nr);
    send({
      q: "snd",
      f: p.floor,
      x: r2(p.x),
      y: r2(p.y),
      n: name,
      r
    });
  }
  const SND_OK = new Set([ "bdPull", "bdPry", "keyTurn", "click", "beep", "beepHi", "metalCreak", "trapPry", "lockClick" ]);
  B.peerPose = function(g, code) {
    if (g) g.bdPose = code | 0;
  };
  function ghostPoses() {
    const C = SX.coop;
    if (!C || !C.ghosts) return;
    const t = SX.raid.t || 0;
    for (const g of C.ghosts.values()) {
      const c = g.bdPose | 0;
      if (c) {
        g.armPose = POSE[c === 1 ? "pull" : "pry"](g.dir | 0, t);
        g.hideWeapon = true;
        g._bdP = true;
      } else if (g._bdP) {
        g.armPose = null;
        g.hideWeapon = false;
        g._bdP = false;
      }
    }
  }
  function ghostNear(code, f, x, y, r) {
    const C = SX.coop;
    if (!C || !C.ghosts) return false;
    for (const g of C.ghosts.values()) if ((g.bdPose | 0) === code && g.floor === f && Math.hypot(g.x - x, g.y - y) < r) return true;
    return false;
  }
  function req(a, x) {
    x = x || {};
    if (isAuth()) apply(a, x, me()); else send({
      q: "rq",
      a,
      x
    }, R_().auth);
  }
  function apply(a, x, by) {
    const d = S && S.d;
    if (!d || !AUTH[a]) return;
    let r;
    try {
      r = AUTH[a](d, x || {}, by);
    } catch (e) {
      console.warn("[bdev] auth", a, e);
      return;
    }
    if (typeof r === "string") {
      if (r) {
        if (by === me()) say(r, "bad"); else if (by != null && by !== "ai") send({
          q: "no",
          why: r
        }, by);
      }
      return;
    }
    if (!r) return;
    const m = Object.assign({
      q: "do",
      a,
      by
    }, r);
    send(m);
    DO[a](d, m, false);
  }
  const AUTH = {}, DO = {};
  B.onMsg = function(from, d) {
    if (!B.ensure() || !S.d || !d) return;
    const R = R_();
    switch (d.q) {
     case "rq":
      if (isAuth() && typeof d.a === "string" && AUTH[d.a]) apply(d.a, d.x && typeof d.x === "object" ? d.x : {}, from);
      break;

     case "do":
      if (R && from === R.auth && typeof d.a === "string" && DO[d.a]) try {
        DO[d.a](S.d, d, false);
      } catch (e) {
        console.warn("[bdev] do", d.a, e);
      }
      break;

     case "no":
      if (R && from === R.auth && typeof d.why === "string") say(d.why.slice(0, 160), "bad");
      break;

     case "snd":
      if (typeof d.n === "string" && SND_OK.has(d.n)) play(d.n, d.f | 0, +d.x || 0, +d.y || 0, Math.min(40, +d.r || 16), .9);
      break;
    }
  };
  const PA_SEQ = [ [ 0, "bdTbE5" ], [ .8, "bdTbC5" ], [ 1.6, "bdTbD5" ], [ 2.4, "bdTbG4" ], [ 3.4, "bdPa" ] ];
  const PA_EV = (() => {
    const o = [];
    for (let c = 0; c * N.PA_REP < N.PA_LURE - 4; c++) for (const q of PA_SEQ) o.push([ c * N.PA_REP + q[0], q[1] ]);
    return o;
  })();
  const spkOf = (d, f) => d.spk.find(q => q.f === f);
  AUTH.pa = (d, x) => {
    const f = x.f | 0;
    if (d.on) return "📢 지금 방송 중입니다 — 끝난 뒤에 다시 쓰십시오";
    if (d.uses <= 0) return "📢 방송을 더 할 수 없습니다(판에 " + N.PA_USES + "번)";
    if (d.cd > 0) return "📢 방송 장비가 쉬는 중입니다 — " + Math.ceil(d.cd) + "초 뒤에 다시";
    if (!spkOf(d, f)) return "";
    return {
      f,
      u: d.uses - 1
    };
  };
  function paOn(d, f, t) {
    const on = {
      f,
      t: t || 0,
      si: 0,
      lT: 0,
      sus: new Set,
      pt: new Map
    };
    while (on.si < PA_EV.length && PA_EV[on.si][0] <= on.t - .5) on.si++;
    d.on = on;
  }
  DO.pa = (d, m, quiet) => {
    d.uses = m.u | 0;
    paOn(d, m.f | 0, 0);
    if (!quiet) say("📢 " + fname(m.f) + " 복도 스피커로 비상 방송을 틉니다 — " + N.PA_LURE + "초 동안 그 층 좀비가 스피커로 몰립니다" + who(m.by), "warn");
  };
  function lureTile(F, q) {
    const o = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = q.x + dx, y = q.y + 1 + dy;
      if (pass(F, x, y) && F.room[F.i(x, y)] === -1) o.push([ x + .5, y + .5 ]);
    }
    return o.length ? o[Math.random() * o.length | 0] : [ q.x + .5, q.y + 1.5 ];
  }
  function paLure(on, q) {
    const F = floorOf(q.f), A = A_();
    for (const e of A.enemies) {
      if (!e.alive || e.dormant || e.floor !== q.f || e.ai === "chase") continue;
      if (e.type === "zombie") {
        let pt = on.pt.get(e);
        if (!pt) on.pt.set(e, pt = lureTile(F, q));
        e.lureX = pt[0];
        e.lureY = pt[1];
        e.lureT = Math.max(e.lureT || 0, 2.7);
        if (e.ai !== "alert") {
          e.ai = "alert";
          e.calmT = 0;
          e.noPathN = 0;
          e.path = null;
          e.seenX = null;
          e.seenY = null;
        }
      } else if (!on.sus.has(e)) {
        on.sus.add(e);
        if (A.suspect) A.suspect(e, false);
      }
    }
  }
  const TICK = {};
  TICK.school = function(d, dt) {
    const on = d.on, now = SX.raid.t || 0;
    if (d.cd > 0 && !on) d.cd = Math.max(0, d.cd - dt);
    for (const q of d.spk) {
      const v = on && on.f === q.f ? 1 + (Math.floor(now * 4) & 1) : 0;
      if (q.prop.v !== v) q.prop.v = v;
    }
    const pv = on ? 1 + (Math.floor(now * 2) & 1) : d.uses > 0 ? 0 : 3;
    if (d.pa.prop.v !== pv) d.pa.prop.v = pv;
    if (!on) return;
    on.t += dt;
    const q = spkOf(d, on.f);
    if (q) while (on.si < PA_EV.length && PA_EV[on.si][0] <= on.t) {
      const ev = PA_EV[on.si++];
      if (on.t - ev[0] < 1) playAll(ev[1], q.f, q.x + .5, q.y + .8, 40, 1);
    }
    if (q && isAuth()) {
      on.lT -= dt;
      if (on.lT <= 0) {
        on.lT = N.PA_EVERY;
        paLure(on, q);
      }
    }
    if (on.t >= N.PA_LURE) {
      d.on = null;
      d.cd = N.PA_CD;
      const p = A_().player;
      if (p && p.floor === on.f) say("📢 비상 방송이 끝났습니다", null);
    }
  };
  const WET = "⚡ 전기실이 물에 잠겼습니다 — 이번 판에는 비상 발전기를 쓸 수 없습니다";
  AUTH.pull = d => d.wet ? WET : d.st !== 0 ? "" : {};
  DO.pull = (d, m, quiet) => {
    if (d.st) return;
    d.st = 1;
    d.by = m.by;
    if (quiet) return;
    playAll("bdPull", d.gen.f, d.gen.x + 1, d.gen.y + .5, 24, 1);
    say("⚡ 비상 발전기가 돌기 시작했습니다 — 용량이 모자라 하나만 살릴 수 있습니다" + who(m.by), "warn");
    if (m.by === me()) setTimeout(() => {
      if (S && S.d === d && d.st === 1 && !d.c) genPick(d);
    }, 250);
  };
  AUTH.pick = (d, x) => d.st !== 1 || d.c ? "" : {
    c: x.c === 2 && d.fr ? 2 : 1
  };
  DO.pick = (d, m, quiet) => {
    if (d.c) return;
    d.st = 2;
    d.c = m.c === 2 && d.fr ? 2 : 1;
    if (d.c === 1) {
      for (const F of S.lv.floors) {
        if (!F || !F.lamps) continue;
        let n = 0;
        for (let y = 2; y < F.H - 2 && n < N.LAMP_MAX; y += N.LAMP_GAP) for (let x = 2; x < F.W - 2 && n < N.LAMP_MAX; x += N.LAMP_GAP) {
          const i = F.i(x, y);
          if (!F.inside || !F.inside[i] || F.tile(x, y) !== T_().FLOOR) continue;
          const l = {
            x: x + .5,
            y: y + .5,
            r: 7,
            c: [ 206, 236, 222 ],
            a: .55,
            out: true,
            bd: true
          };
          F.lamps.push(l);
          d.lamps.push(l);
          n++;
        }
        inval(F);
      }
      if (!quiet) say("💡 비상등이 켜졌습니다 — 병원 모든 층이 밝아집니다(적도 멀리서 봅니다)" + who(m.by), "warn");
    } else {
      const fr = d.fr, F = floorOf(fr.f);
      fr.prop.v = 1;
      attach(F, fr.prop, fr.cont);
      regAll();
      if (!quiet) {
        play("lockClick", fr.f, fr.x + .5, fr.y + .5, 12, .9);
        say("💊 " + fname(fr.f) + " 약품 냉장 보관함 전자 잠금이 풀렸습니다" + who(m.by), "good");
      }
    }
  };
  function genPick(d) {
    chooser("⚡ 비상 발전기 — 하나만 살립니다", "용량이 모자라 하나만 고를 수 있습니다. 먼저 고른 사람이 정합니다.", [ {
      v: 1,
      label: "💡 비상등",
      sub: "모든 층이 밝아집니다 · 적도 멀리서 봅니다"
    }, {
      v: 2,
      label: "💊 약품 보관함",
      sub: d.fr ? fname(d.fr.f) + " 냉장 보관함 잠금이 풀립니다" : "이 판에는 없습니다",
      off: !d.fr
    } ], c => req("pick", {
      c
    }));
  }
  B.lit = F => !!(S && S.d && S.d.k === "hos" && S.d.c === 1 && F && S.lv.floors[F.idx] === F);
  B.seeK = F => B.lit(F) ? N.GEN_SEE : 1;
  TICK.hos = function(d, dt) {
    const g = d.gen.prop, run = d.st >= 1, now = SX.raid.t || 0;
    const v = run ? 1 + (Math.floor(now * 14) & 1) : d.wet ? 3 : 0;
    if (g.v !== v) g.v = v;
    const p = A_().player;
    if (run && p && p.floor === d.gen.f) {
      SX.audio.spotLoop("bdgen", "bdGen", {
        x: d.gen.x + 1,
        y: d.gen.y + .5,
        range: 18,
        vol: .75
      });
      d.t -= dt;
      if (d.t <= 0) {
        d.t = .35;
        A_().part({
          floor: d.gen.f,
          x: d.gen.x + 1.7,
          y: d.gen.y + .2,
          z: 1.1,
          vx: (Math.random() - .5) * .4,
          vy: -.3,
          vz: .5,
          g: -.2,
          c: "#55575a",
          t: 1.4,
          life: 1.4,
          s: 2
        });
      }
    }
    if (d.fr) {
      const fv = d.c === 2 ? 1 : 0;
      if (d.fr.prop.v !== fv) d.fr.prop.v = fv;
    }
  };
  AUTH.bus = d => d.st !== 0 ? "" : {};
  DO.bus = (d, m, quiet) => {
    if (d.st) return;
    d.st = 1;
    d.t = 0;
    d.hn = N.BUS_HORN;
    busLamp(d, floorOf(0));
    if (quiet) return;
    const x = d.sx + 2.5, y = d.y0 + 1;
    playAll("bdDiesel", 0, x, y, 34, 1);
    playAll("bdHorn", 0, x, y, 40, 1);
    if (isAuth()) A_().noise(floorOf(0), x, y, N.BUS_LURE, false, 0, true);
    say("📢 버스 시동이 걸렸습니다 — 경적과 엔진 소리가 크게 울려 둘레 좀비가 몰려옵니다" + who(m.by), "warn");
  };
  function busLamp(d, F) {
    if (!F || !F.lamps || d.lamp) return;
    d.lamp = {
      x: d.sx + 5.2,
      y: d.y0 + 1.1,
      r: 5,
      c: [ 255, 236, 190 ],
      a: .75,
      out: true,
      bd: true
    };
    F.lamps.push(d.lamp);
  }
  const busV = shake => (shake ? 1 : 0) | 4;
  function stopBus(d) {
    if (d.st === 2) return;
    d.st = 2;
    d.t = N.BUS_IDLE;
    busLamp(d, floorOf(0));
    if (d.prop) d.prop.v = busV(false);
    if (SX.audio && SX.audio.spotLoop) SX.audio.spotLoop("bdbus");
  }
  TICK.metro = function(d, dt) {
    if (d.st !== 1) return;
    const F = floorOf(0), p = A_().player, x = d.sx + 2.5, y = d.y0 + 1;
    d.t += dt;
    if (d.t >= N.BUS_IDLE) {
      stopBus(d);
      return;
    }
    const v = busV(Math.floor(d.t * 10) & 1);
    if (d.prop && d.prop.v !== v) d.prop.v = v;
    if (Math.random() < dt * 6) smokeAt(F, d.sx - .2, d.y0 + 1.6);
    if (p && p.floor === 0) SX.audio.spotLoop("bdbus", "bdIdle", {
      x,
      y,
      range: 26,
      vol: .7 * Math.min(1, (N.BUS_IDLE - d.t) / 3)
    }); else SX.audio.spotLoop("bdbus");
    d.hn -= dt;
    if (d.hn <= 0) {
      d.hn = N.BUS_HORN;
      playAll("bdHorn", 0, x, y, 40, 1);
      if (isAuth()) A_().noise(F, x, y, N.BUS_LURE2, false, 0, true);
    }
  };
  function smokeAt(F, x, y) {
    A_().part({
      floor: F.idx,
      x,
      y,
      z: .25,
      vx: (Math.random() - .5) * .6,
      vy: -.2 - Math.random() * .3,
      vz: .4,
      g: -.3,
      c: Math.random() < .5 ? "#4a4c50" : "#5e6064",
      t: 1.3,
      life: 1.3,
      s: 2
    });
  }
  AUTH.pry = d => d.open ? "" : {};
  function openDepot(d, quiet) {
    if (d.open) return;
    const F = floorOf(0);
    for (const p of d.ov) unput(S, F, p);
    d.ov = [];
    unlockDoor(S, F, d.door);
    if (!d.boom) for (const c of d.crates) attach(F, c.prop, c.cont);
    regAll();
    d.open = true;
    if (!quiet) {
      play("doorOpen", 0, d.door.cx, d.door.cy, 20, 1);
      play("metalCreak", 0, d.door.cx, d.door.cy, 20, 1, .15);
    }
  }
  DO.pry = (d, m, quiet) => {
    openDepot(d, quiet);
    if (!quiet) say("🔩 탄약고 문이 열렸습니다" + who(m.by), "good");
  };
  AUTH.fuse = d => !d.open || d.fuse != null || d.boom ? "" : {};
  DO.fuse = (d, m, quiet) => {
    if (d.fuse != null || d.boom) return;
    d.fuse = m.left != null ? +m.left : N.FUSE_WAIT;
    if (!quiet) say("⚠ 탄약고 폭약 도화선에 불이 붙었습니다 — " + Math.ceil(d.fuse) + "초 뒤 터집니다! 멀리 피하십시오" + who(m.by), "bad");
  };
  AUTH.boom = d => d.boom ? "" : {};
  DO.boom = (d, m, quiet) => boom(d, quiet);
  function boom(d, quiet) {
    if (d.boom) return;
    d.boom = true;
    d.fuse = null;
    const F = floorOf(0), A = A_(), x = d.tnt.x + .5, y = d.tnt.y + .5;
    if (!d.open) {
      for (const p of d.ov) unput(S, F, p);
      d.ov = [];
    }
    for (const c of d.crates) {
      c.cont.grid.list.length = 0;
      c.cont.bdGone = true;
      c.cont.searched = true;
      {
        const ci = F.conts.indexOf(c.cont);
        if (ci >= 0) F.conts.splice(ci, 1);
      }
      if (SX.raid.conts && SX.raid.conts.get(c.cont.key) === c.cont) SX.raid.conts.delete(c.cont.key);
      unput(S, F, c.prop);
      c.prop = put(S, F, "bdWreck", c.x, c.y, {
        solid: true,
        cover: .4,
        v: (c.x + c.y) % 3
      });
      if (A.decal) A.decal(F, c.x + .5, c.y + .6, "scorch", false);
    }
    if (d.tnt.prop) {
      unput(S, F, d.tnt.prop);
      d.tnt.prop = null;
    }
    if (A.decal) A.decal(F, x, y + .2, "scorch", true);
    inval(F);
    d.pops = quiet ? [] : [ .45, .9, 1.5, 2.2 ];
    if (quiet) return;
    playAll("explode", 0, x, y, 70, 1);
    SX.light.flash(0, x, y, 12, [ 255, 226, 180 ], .45, 1.5);
    if (A.smoke) A.smoke(F, x, y, 30, true);
    for (let k = 0; k < 16; k++) {
      const a = Math.random() * 6.28, v = 3 + Math.random() * 7;
      A.part({
        floor: 0,
        x,
        y,
        z: .4,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 2 + Math.random() * 3,
        g: 9,
        c: A.FX.spark,
        t: .5,
        life: .5
      });
    }
    const p = A.player;
    if (p && p.alive) {
      if (p.floor === 0) {
        const pd = Math.hypot(p.x - x, p.y - y);
        SX.view.shake(Math.max(3, 10 - pd));
        if (pd < N.BOOM_R && SX.game.state === "raid" && SX.light.los(F, x, y - .2, p.x, p.y - .4)) A.hurtPlayer(N.BOOM_DMG * (1 - pd / N.BOOM_R * .7), "탄약고 폭발에 휘말렸습니다", false, Math.atan2(p.y - y, p.x - x), "blast", "player", {
          r: pd
        });
      } else SX.view.shake(3);
    }
    if (isAuth()) {
      for (const e of A.enemies) {
        if (!e.alive || e.floor !== 0) continue;
        const ed = Math.hypot(e.x - x, e.y - y);
        if (ed > N.BOOM_R || !SX.light.los(F, x, y - .2, e.x, e.y - .4)) continue;
        A.damageEnemy(F, e, N.BOOM_DMG * (1 - ed / N.BOOM_R * .7), Math.atan2(e.y - y, e.x - x), null, false);
      }
      A.noise(F, x, y, 40, false, 0, true);
    }
    say("🔥 탄약고가 터졌습니다", "bad");
  }
  TICK.base = function(d, dt) {
    const F = floorOf(0), p = A_().player;
    if (!d.open && d.ov.length) {
      const pry = S.job && S.job.k === "pry" || ghostNear(2, 0, d.door.cx, d.door.cy, 2.2);
      for (const o of d.ov) {
        if (o.v0 == null) o.v0 = o.v;
        const v = o.v0 + (pry ? 50 : 0);
        if (o.v !== v) o.v = v;
      }
      if (pry && Math.random() < dt * 6) {
        const o = d.ov[Math.random() * d.ov.length | 0];
        A_().part({
          floor: 0,
          x: o.x + .5,
          y: o.y + .6,
          z: .6,
          vx: (Math.random() - .5) * 3,
          vy: (Math.random() - .5) * 2,
          vz: 1.5,
          g: 9,
          c: A_().FX.spark,
          t: .25,
          life: .25
        });
      }
    }
    if (d.fuse != null && !d.boom) {
      d.fuse -= dt;
      const tp = d.tnt.prop;
      if (tp) {
        const v = 1 + Math.min(7, Math.floor((1 - Math.max(0, d.fuse) / N.FUSE_WAIT) * 8));
        if (tp.v !== v) tp.v = v;
      }
      if (p && p.floor === 0) SX.audio.spotLoop("bdfuse", "bdFuse", {
        x: d.tnt.x + .5,
        y: d.tnt.y + .5,
        range: 12,
        vol: .8
      });
      if (Math.random() < dt * 14) A_().part({
        floor: 0,
        x: d.tnt.x + .3 + Math.random() * .4,
        y: d.tnt.y + .4,
        z: .35,
        vx: (Math.random() - .5) * 1.5,
        vy: (Math.random() - .5) * 1.5,
        vz: 1 + Math.random(),
        g: 6,
        c: Math.random() < .5 ? "#ffd27a" : "#ff8a3a",
        t: .3,
        life: .3
      });
      if (Math.random() < dt * 3) SX.light.flash(0, d.tnt.x + .5, d.tnt.y + .5, 2.5, [ 255, 170, 90 ], .15, .5);
      if (d.fuse <= 0 && isAuth()) apply("boom", {}, me()); else if (d.fuse < -3) boom(d, false);
    }
    if (d.pops && d.pops.length) {
      d.popT = (d.popT || 0) + dt;
      while (d.pops.length && d.popT >= d.pops[0]) {
        d.pops.shift();
        const r = d.r, x = r.x0 + Math.random() * (r.x1 - r.x0 + 1), y = r.y0 + Math.random() * (r.y1 - r.y0 + 1);
        play("explode", 0, x, y, 30, .35);
        SX.light.flash(0, x, y, 4, [ 255, 200, 140 ], .2, .8);
        for (let k = 0; k < 5; k++) {
          const a = Math.random() * 6.28, v = 2 + Math.random() * 4;
          A_().part({
            floor: 0,
            x,
            y,
            z: .4,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            vz: 2,
            g: 9,
            c: A_().FX.spark,
            t: .35,
            life: .35
          });
        }
      }
    }
  };
  const flOf = (d, f) => d.fl.find(q => q.f === f);
  AUTH.sh = (d, x) => {
    const f = x.f | 0, q = flOf(d, f);
    if (!q || !q.lines.length) return "";
    if (q.st !== 0) return "⛔ " + fname(f) + " 방화 셔터는 이미 내려와 있습니다";
    if (d.uses <= 0) return "⛔ 방화 셔터를 더 내릴 수 없습니다(판에 " + N.SH_USES + "번)";
    if (d.cd > 0) return "⛔ 제어반이 다시 켜지는 중입니다 — " + Math.ceil(d.cd) + "초 뒤에";
    return {
      f,
      u: d.uses - 1
    };
  };
  DO.sh = (d, m, quiet) => {
    const q = flOf(d, m.f | 0);
    if (!q || q.st !== 0) return;
    d.uses = m.u | 0;
    d.cd = N.SH_CD;
    q.st = 1;
    q.t = 0;
    if (quiet) return;
    for (const l of q.lines) playAll("bdShutDn", q.f, l.cx, l.cy, 28, 1);
    say("⛔ " + fname(q.f) + " 복도 방화 셔터가 내려옵니다 — 좀비는 막히고 사람은 옆 방화문으로 지나갑니다" + who(m.by), "warn");
  };
  const lineRect = l => {
    const xs = l.ts.map(t => t[0]), ys = l.ts.map(t => t[1]);
    return [ Math.min(...xs), Math.min(...ys), Math.max(...xs) + 1, Math.max(...ys) + 1 ];
  };
  const shV = (l, k, fr) => l.o * 100 + (k === 0 ? 10 : 0) + fr;
  function solidOn(F, p, on) {
    const i = F.i(p.x, p.y);
    p.solid = on;
    p.tall = on;
    p.cover = on ? 1 : 0;
    p.bdWall = on;
    F.solid[i] = on ? 1 : 0;
    if (F.propAt) F.propAt[i] = on ? p : null;
  }
  function shDown(q, quiet) {
    const F = floorOf(q.f);
    for (const l of q.lines) {
      l.props.forEach((p, k) => {
        solidOn(F, p, true);
        p.v = shV(l, k, 7);
      });
      l.fd = 0;
    }
    inval(F);
    for (const l of q.lines) unstickAll(F, lineRect(l));
    q.st = 2;
    q.t = 0;
    if (!quiet) for (const l of q.lines) play("bdShutHit", q.f, l.cx, l.cy, 24, 1);
  }
  function shUp(q, quiet) {
    const F = floorOf(q.f);
    for (const l of q.lines) {
      for (const p of l.props) solidOn(F, p, false);
      l.fd = 0;
    }
    inval(F);
    q.st = 3;
    q.t = 0;
    if (!quiet) {
      for (const l of q.lines) play("bdShutUp", q.f, l.cx, l.cy, 26, 1);
      const p = A_().player;
      if (p && p.floor === q.f) say("⛔ " + fname(q.f) + " 방화 셔터가 올라갑니다", null);
    }
  }
  AUTH.fd = (d, x) => {
    const q = flOf(d, x.f | 0), l = q && q.lines[x.l | 0];
    return !l || q.st !== 2 || l.fd > 0 ? "" : {
      f: q.f,
      l: x.l | 0
    };
  };
  DO.fd = (d, m, quiet) => {
    const q = flOf(d, m.f | 0), l = q && q.lines[m.l | 0];
    if (!l || q.st !== 2) return;
    const F = floorOf(q.f), p = l.props[0];
    l.fd = N.FD_OPEN;
    solidOn(F, p, false);
    p.v = shV(l, 0, 8);
    inval(F);
    if (!quiet) play("doorOpen", q.f, p.x + .5, p.y + .5, 14, 1);
  };
  TICK.office = function(d, dt) {
    if (d.cd > 0) d.cd = Math.max(0, d.cd - dt);
    const now = SX.raid.t || 0, pv = d.fl.some(q => q.st === 1 || q.st === 2) ? 1 + (Math.floor(now * 2) & 1) : d.uses > 0 ? 0 : 3;
    if (d.pan.prop.v !== pv) d.pan.prop.v = pv;
    for (const q of d.fl) {
      if (!q.st) continue;
      q.t += dt;
      const F = floorOf(q.f);
      if (q.st === 1) {
        const fr = Math.min(7, Math.floor(q.t / N.SH_DROP * 8));
        for (const l of q.lines) l.props.forEach((p, k) => {
          const v = shV(l, k, fr);
          if (p.v !== v) p.v = v;
        });
        if (q.t >= N.SH_DROP) shDown(q, false);
      } else if (q.st === 2) {
        for (const l of q.lines) {
          if (l.fd > 0) {
            l.fd -= dt;
            if (l.fd <= 0) {
              const p = l.props[0];
              solidOn(F, p, true);
              p.v = shV(l, 0, 7);
              inval(F);
              unstickAll(F, [ p.x, p.y, p.x + 1, p.y + 1 ]);
              play("doorClose", q.f, p.x + .5, p.y + .5, 14, .9);
            }
          } else if (isAuth()) {
            const p = l.props[0], cx = p.x + .5, cy = p.y + .5;
            for (const e of A_().enemies) if (e.alive && e.type === "scav" && e.floor === q.f && Math.hypot(e.x - cx, e.y - cy) < 1.3) {
              apply("fd", {
                f: q.f,
                l: q.lines.indexOf(l)
              }, "ai");
              break;
            }
          }
        }
        if (q.t >= N.SH_UP) shUp(q, false);
      } else if (q.st === 3) {
        const fr = Math.max(0, 7 - Math.floor(q.t / N.SH_RISE * 8));
        for (const l of q.lines) l.props.forEach((p, k) => {
          const v = shV(l, k, fr);
          if (p.v !== v) p.v = v;
        });
        if (q.t >= N.SH_RISE) {
          q.st = 0;
          q.t = 0;
          for (const l of q.lines) l.props.forEach((p, k) => {
            p.v = shV(l, k, 0);
          });
        }
      }
    }
  };
  AUTH.key = d => d.st !== 0 ? "" : {};
  DO.key = (d, m, quiet) => {
    if (d.st) return;
    d.st = 1;
    d.t = 0;
    d.kp.prop.v = 1;
    if (quiet) return;
    for (const sh of d.shops) {
      const dt0 = doorTiles(sh.d), c = dt0[dt0.length / 2 | 0];
      playAll("bdShutUp", d.f, c[0] + .5, c[1] + .5, 40, 1);
      if (isAuth()) A_().noise(floorOf(d.f), c[0] + .5, c[1] + .5, 26, false, 0, true);
    }
    say("🔑 관리실 열쇠를 돌렸습니다 — " + fname(d.f) + " 잠긴 점포 셔터가 한꺼번에 올라갑니다" + who(m.by), "warn");
  };
  function openShops(d, quiet) {
    if (d.st === 2) return;
    const F = floorOf(d.f), A = A_(), auth = isAuth();
    for (const sh of d.shops) {
      for (const p of sh.ov) unput(S, F, p);
      sh.ov = [];
      unlockDoor(S, F, sh.d);
      for (const b of sh.boxes) attach(F, b.prop, b.cont);
      const dt0 = doorTiles(sh.d), c = dt0[dt0.length / 2 | 0];
      for (const e of sh.zs) {
        if (!e.dormant) continue;
        e.dormant = false;
        e.alive = e.hp == null || e.hp > 0;
        if (auth && e.alive && !quiet) {
          e.ai = "alert";
          e.lureX = c[0] + .5;
          e.lureY = c[1] + .5;
          e.lureT = 6;
          e.calmT = 0;
        }
      }
    }
    regAll();
    inval(F);
    d.st = 2;
    d.kp.prop.v = 1;
    if (!quiet) say("🏪 점포 셔터가 다 올라갔습니다 — 안에 갇혀 있던 좀비가 나옵니다", "bad");
  }
  TICK.mall = function(d, dt) {
    if (d.st !== 1) return;
    d.t += dt;
    const fr = Math.min(4, Math.floor(d.t / N.MALL_RISE * 5));
    for (const sh of d.shops) for (const p of sh.ov) {
      const v = fr * 100 + p.v % 100;
      if (p.v !== v) p.v = v;
    }
    if (d.t >= N.MALL_RISE) openShops(d, false);
  };
  AUTH.note = d => d.holder != null ? "📜 쪽지는 이미 다른 사람이 가져갔습니다" : {};
  DO.note = (d, m, quiet) => {
    if (d.holder != null) return;
    d.holder = m.by;
    d.nt.prop.hidden = true;
    if (quiet) return;
    if (m.by === me()) {
      play("paper", d.nt.f, d.nt.x + .5, d.nt.y + .5, 8, .9);
      say("📜 택배 도착 문자 — 「" + d.dong + "동 " + d.ho + "호 고객님, 1층 무인 택배함에 보관했습니다. 비밀번호 " + d.pin + "」", "good");
    } else say("📜 누가 택배 도착 문자 쪽지를 주웠습니다" + who(m.by), null);
  };
  AUTH.pin = (d, x, by) => d.open ? "" : by !== d.holder ? "🔒 비밀번호를 모릅니다 — 택배 도착 문자 쪽지가 있어야 합니다" : {};
  function openLocker(d, quiet) {
    if (d.open) return;
    d.open = true;
    d.lk.prop.v = 1;
    attach(floorOf(0), d.lk.prop, d.cont);
    regAll();
    if (!quiet) play("confirm", 0, d.lk.x + 1, d.lk.y + .5, 10, .9);
  }
  DO.pin = (d, m, quiet) => {
    openLocker(d, quiet);
    if (!quiet) say("📦 무인 택배함 " + d.ho + "호 칸이 열렸습니다" + who(m.by), "good");
  };
  TICK.villa = function(d) {
    if (d.open) return;
    const v = Math.floor((SX.raid.t || 0) * 1.5) & 1 ? 2 : 0;
    if (d.lk.prop.v !== v) d.lk.prop.v = v;
  };
  function chooser(title, desc, opts, cb) {
    if (!SX.ui || !SX.ui.ask) return;
    let pick = null;
    const bt = opts.map(o => '<button class="big" data-bdv="' + o.v + '"' + (o.off ? " disabled" : "") + ' style="min-width:210px;min-height:46px;margin:4px">' + esc(o.label) + (o.sub ? "<br><small>" + esc(o.sub) + "</small>" : "") + "</button>").join("");
    SX.ui.ask(title, esc(desc) + '<br><span style="display:flex;flex-wrap:wrap;justify-content:center;margin-top:8px">' + bt + "</span>", 0, () => {
      if (pick != null) cb(pick);
    }, null, {
      q: "고르십시오",
      no: "닫기"
    });
    const el = document.getElementById("ask");
    if (!el) return;
    const y = document.getElementById("askYes");
    if (y) y.style.display = "none";
    el.querySelectorAll("[data-bdv]").forEach(b => {
      b.onclick = () => {
        if (b.disabled) return;
        pick = +b.getAttribute("data-bdv");
        el._done(true);
      };
    });
  }
  B._choose = v => {
    const el = document.getElementById("ask"), b = el && el.querySelector('[data-bdv="' + v + '"]');
    if (b) b.onclick();
    return !!b;
  };
  const boxOf = (pr, PK) => PK && PK.propBox ? PK.propBox(pr) : [ pr.x, pr.y - 1, pr.x + pr.w, pr.y + pr.h ];
  function dist(pr, p) {
    const x = pr.px != null ? pr.px : pr.x, cx = x + pr.w / 2, cy = pr.y + pr.h / 2;
    return Math.hypot(Math.max(Math.abs(p.x - cx) - pr.w / 2, 0), Math.max(Math.abs(p.y - .2 - cy) - pr.h / 2, 0));
  }
  const reach = (F, p, pr) => SX.raid.reach ? SX.raid.reach(F, p, pr) : true;
  B.target = function(F, p, add, PK) {
    if (!B.ensure() || !S.d || !F || !p) return null;
    const d = S.d, f = F.idx, K = key(), jl = S.job ? " — [" + K + "] 그만" : "";
    let best = null, bd = 9;
    const cand = (o, pr, lim) => {
      if (!pr || pr.hidden) return;
      const dd = dist(pr, p);
      if (dd > (lim || 1.6) || !reach(F, p, pr)) return;
      o.kind = "bd";
      if (o.x == null) {
        o.x = (pr.px != null ? pr.px : pr.x) + pr.w / 2;
        o.y = pr.y - .3;
      }
      const r = add(o, () => [ boxOf(pr, PK) ]);
      if (dd < bd) {
        bd = dd;
        best = r;
      }
    };
    switch (d.k) {
     case "school":
      if (f === d.pa.f) {
        const lab = S.job && S.job.k === "pa" ? "📢 방송 장비 켜는 중" + jl : d.on ? "📢 방송 중 — " + fname(d.on.f) + " " + Math.ceil(N.PA_LURE - d.on.t) + "초" : d.uses <= 0 ? "📢 방송 장비 — 다 썼습니다" : d.cd > 0 ? "📢 방송 장비 쉬는 중 — " + Math.ceil(d.cd) + "초" : "📢 비상 방송 — 층 고르기 (남은 " + d.uses + "번)";
        cand({
          sub: "pa",
          label: lab
        }, d.pa.prop);
      }
      break;

     case "hos":
      if (f === d.gen.f) {
        const lab = S.job && S.job.k === "pull" ? "⚡ 시동 줄 당기는 중" + jl : d.wet ? "⚡ 비상 발전기 — 전기실이 물에 잠겼습니다" : d.st === 0 ? "⚡ 비상 발전기 시동 줄 당기기 (" + N.GEN_T + "초 · 시끄럽습니다)" : d.st === 1 ? "⚡ 비상 발전기 — 살릴 것 고르기" : "⚡ 비상 발전기 — " + (d.c === 1 ? "비상등" : "약품 보관함") + "에 전기를 보내는 중";
        cand({
          sub: "gen",
          label: lab
        }, d.gen.prop);
      }
      if (d.fr && f === d.fr.f && d.c !== 2) cand({
        sub: "fr",
        label: "💊 약품 냉장 보관함 — 전기가 끊겨 잠겼습니다"
      }, d.fr.prop);
      break;

     case "metro":
      if (f === 0 && d.st === 0) cand({
        sub: "bus",
        label: S.job && S.job.k === "bus" ? "🔑 버스 시동 거는 중" + jl : "🔑 버스 시동 걸기 (" + N.BUS_T + "초 · 시끄럽습니다)"
      }, d.prop, 1.4);
      break;

     case "base":
      if (f === 0 && !d.open && d.ov.length) {
        const o = d.ov[d.ov.length / 2 | 0];
        cand({
          sub: "pry",
          label: S.job && S.job.k === "pry" ? "🔩 탄약고 문 비트는 중" + jl : "🔩 탄약고 문 비틀어 열기 (" + N.PRY_T + "초 · 아주 시끄럽습니다)",
          x: d.door.cx,
          y: d.door.cy - 1
        }, o, 1.5);
      }
      if (f === 0 && d.open && !d.boom && d.fuse == null && d.tnt.prop) cand({
        sub: "fuse",
        label: S.job && S.job.k === "fuse" ? "⚠ 도화선 붙이는 중" + jl : "⚠ 폭약 도화선 붙이기 (" + N.FUSE_T + "초 — " + N.FUSE_WAIT + "초 뒤 터집니다)"
      }, d.tnt.prop, 1.3);
      break;

     case "office":
      if (f === 0) {
        const lab = S.job && S.job.k === "sh" ? "⛔ 방화 셔터 내리는 중" + jl : d.uses <= 0 ? "⛔ 방재실 제어반 — 다 썼습니다" : d.cd > 0 ? "⛔ 방재실 제어반 — " + Math.ceil(d.cd) + "초 뒤에 다시" : "⛔ 방화 셔터 내리기 — 층 고르기 (남은 " + d.uses + "번)";
        cand({
          sub: "sh",
          label: lab
        }, d.pan.prop);
      }
      {
        const q = flOf(d, f);
        if (q && q.st === 2) q.lines.forEach((l, k) => {
          if (l.fd > 0) return;
          cand({
            sub: "fd",
            f,
            l: k,
            label: S.job && S.job.k === "fd" ? "🚪 방화문 미는 중" + jl : "🚪 방화문 열기 (" + N.FD_T + "초)"
          }, l.props[0], 1.3);
        });
      }
      break;

     case "mall":
      if (f === d.f && d.st === 0) {
        cand({
          sub: "key",
          label: S.job && S.job.k === "key" ? "🔑 관리실 열쇠 돌리는 중" + jl : "🔑 관리실 셔터 열쇠 돌리기 (" + N.KEY_T + "초 · 점포 셔터가 모두 올라갑니다)"
        }, d.kp.prop);
        for (const sh of d.shops) if (sh.ov.length) cand({
          sub: "shop",
          label: "🔒 셔터가 내려진 점포 — 관리실 열쇠로 엽니다"
        }, sh.ov[sh.ov.length / 2 | 0], 1.3);
      }
      break;

     case "villa":
      if (d.holder == null && f === d.nt.f) cand({
        sub: "note",
        label: "📜 택배 도착 문자 쪽지 줍기"
      }, d.nt.prop, 1.3);
      if (f === 0 && !d.open) cand({
        sub: "pin",
        label: S.job && S.job.k === "pin" ? "🔐 비밀번호 누르는 중" + jl : d.holder === me() ? "🔐 무인 택배함 — 비밀번호 누르기 (" + N.PIN_T + "초)" : "🔒 무인 택배함 — 비밀번호를 모릅니다"
      }, d.lk.prop);
      break;
    }
    return best;
  };
  B.interact = function(t) {
    if (!S || !S.d || !t) return;
    const d = S.d, p = A_().player;
    if (!p) return;
    switch (t.sub) {
     case "pa":
      {
        if (d.on || d.uses <= 0 || d.cd > 0) {
          say(AUTH.pa(d, {
            f: d.spk[0].f
          }) || "📢 지금은 쓸 수 없습니다", "bad");
          SX.audio.play("denied", {});
          return;
        }
        chooser("📢 비상 방송 — 층 고르기", "고른 층 복도 스피커에서 비상 벨과 방송이 " + N.PA_LURE + "초 동안 울립니다. 그 층 좀비가 스피커로 몰리고 약탈자는 경계합니다.", d.spk.map(q => ({
          v: q.f,
          label: "📢 " + fname(q.f),
          sub: q.f === p.floor ? "지금 있는 층" : ""
        })), f => startJob({
          k: "pa",
          T: N.PA_T,
          pose: "type",
          every: .5,
          snd: (n, pp) => jsnd(n % 2 ? "click" : "beep", pp, 8, 0, .7),
          done: () => req("pa", {
            f
          })
        }));
        return;
      }

     case "gen":
      if (d.wet) {
        say(WET, "bad");
        SX.audio.play("denied", {});
        return;
      }
      if (d.st === 0) {
        startJob({
          k: "pull",
          T: N.GEN_T,
          pose: "pull",
          every: 1.2,
          snd: (n, pp) => jsnd("bdPull", pp, 26, 22, 1),
          done: () => req("pull")
        });
        return;
      }
      if (d.st === 1 && !d.c) {
        genPick(d);
        return;
      }
      return;

     case "fr":
      say("💊 전자 잠금입니다 — 비상 발전기로 약품 보관함에 전기를 보내야 열립니다", "bad");
      SX.audio.play("denied", {});
      return;

     case "bus":
      startJob({
        k: "bus",
        T: N.BUS_T,
        pose: "key",
        every: 1.6,
        snd: (n, pp) => jsnd(n === 1 ? "keyTurn" : "click", pp, 10, 0, .8),
        done: () => req("bus")
      });
      return;

     case "pry":
      startJob({
        k: "pry",
        T: N.PRY_T,
        pose: "pry",
        every: 1.1,
        ok: () => !d.open,
        snd: (n, pp) => jsnd(n % 3 ? "bdPry" : "metalCreak", pp, 30, 24, 1),
        done: () => req("pry")
      });
      return;

     case "fuse":
      startJob({
        k: "fuse",
        T: N.FUSE_T,
        pose: "kneel",
        every: .7,
        ok: () => d.fuse == null && !d.boom,
        snd: (n, pp) => jsnd("click", pp, 6, 0, .6),
        done: () => req("fuse")
      });
      return;

     case "sh":
      {
        if (d.uses <= 0 || d.cd > 0) {
          say(d.uses <= 0 ? "⛔ 방화 셔터를 더 내릴 수 없습니다(판에 " + N.SH_USES + "번)" : "⛔ 제어반이 다시 켜지는 중입니다 — " + Math.ceil(d.cd) + "초 뒤에", "bad");
          SX.audio.play("denied", {});
          return;
        }
        chooser("⛔ 방화 셔터 — 층 고르기", "고른 층 복도 방화 셔터가 내려옵니다. 좀비는 막히고 사람은 옆 방화문으로 지나갑니다. " + N.SH_UP + "초 뒤 저절로 올라갑니다.", d.fl.filter(q => q.lines.length).map(q => ({
          v: q.f,
          label: "⛔ " + fname(q.f),
          sub: q.st ? "내려와 있습니다" : q.lines.length + "곳" + (q.f === p.floor ? " · 지금 있는 층" : ""),
          off: !!q.st
        })), f => startJob({
          k: "sh",
          T: N.SH_T,
          pose: "type",
          every: .5,
          snd: (n, pp) => jsnd(n % 2 ? "beep" : "click", pp, 8, 0, .7),
          done: () => req("sh", {
            f
          })
        }));
        return;
      }

     case "fd":
      startJob({
        k: "fd",
        T: N.FD_T,
        pose: null,
        ok: () => {
          const q = flOf(d, t.f);
          return q && q.st === 2;
        },
        done: () => req("fd", {
          f: t.f,
          l: t.l
        })
      });
      return;

     case "key":
      startJob({
        k: "key",
        T: N.KEY_T,
        pose: "key",
        every: 1.2,
        snd: (n, pp) => jsnd(n === 1 ? "keyTurn" : "click", pp, 10, 0, .8),
        done: () => req("key")
      });
      return;

     case "shop":
      say("🔒 셔터가 잠겼습니다 — " + fname(d.f) + " 관리실 셔터 열쇠로 한꺼번에 엽니다", "bad");
      SX.audio.play("locked", {});
      return;

     case "note":
      req("note");
      return;

     case "pin":
      if (d.holder !== me()) {
        say("🔒 비밀번호를 모릅니다 — 택배 도착 문자 쪽지가 있어야 합니다", "bad");
        SX.audio.play("denied", {});
        return;
      }
      startJob({
        k: "pin",
        T: N.PIN_T,
        pose: "type",
        every: .32,
        ok: () => !d.open,
        snd: (n, pp) => jsnd(n % 3 ? "beep" : "beepHi", pp, 8, 0, .6),
        done: () => req("pin")
      });
      return;
    }
  };
  function hintSpots() {
    if (S.hs) return S.hs;
    const d = S.d, o = [], add = (id, f, pr, t) => {
      if (pr) o.push({
        id,
        f,
        x: (pr.px != null ? pr.px : pr.x) + pr.w / 2,
        y: pr.y + pr.h / 2,
        t
      });
    };
    switch (d.k) {
     case "school":
      add("pa", d.pa.f, d.pa.prop, "📢 방송실 — 층을 골라 그 층 복도 스피커로 비상 방송을 틀 수 있습니다. 좀비가 " + N.PA_LURE + "초 동안 스피커로 몰립니다(판에 " + N.PA_USES + "번).");
      break;

     case "hos":
      add("gen", d.gen.f, d.gen.prop, d.wet ? "⚡ 비상 발전기 — 전기실이 물에 잠겨 이번 판에는 쓸 수 없습니다." : "⚡ 비상 발전기 — 시동 줄을 당기면(" + N.GEN_T + "초 · 시끄럽습니다) 비상등과 약품 보관함 중 하나만 살릴 수 있습니다.");
      if (d.fr) add("fr", d.fr.f, d.fr.prop, "💊 약품 냉장 보관함 — 전자 잠금입니다. 비상 발전기로 전기를 보내면 열립니다.");
      break;

     case "metro":
      add("bus", 0, d.prop, "📢 세워 둔 버스 — 시동을 걸면 경적과 엔진 소리가 " + N.BUS_IDLE + "초 동안 크게 울려 둘레 좀비를 끌어옵니다(판에 1번).");
      break;

     case "base":
      if (d.ov.length) add("pry", 0, d.ov[0], "🔩 탄약고 — 두꺼운 문을 비틀어 열 수 있습니다(" + N.PRY_T + "초 · 아주 시끄럽습니다). 안의 폭약으로 탄약고를 터뜨릴 수도 있습니다.");
      break;

     case "office":
      add("sh", 0, d.pan.prop, "⛔ 방재실 제어반 — 층을 골라 복도 방화 셔터를 내릴 수 있습니다. 좀비는 막히고 사람은 옆 방화문으로 지나갑니다(" + N.SH_UP + "초 · 판에 " + N.SH_USES + "번).");
      break;

     case "mall":
      add("key", d.f, d.kp.prop, "🔑 관리실 셔터 열쇠 — 돌리면(" + N.KEY_T + "초) 잠긴 점포 셔터가 한꺼번에 올라갑니다. 갇혀 있던 좀비도 나옵니다.");
      d.shops.forEach((sh, k) => {
        if (sh.ov.length) add("sh" + k, d.f, sh.ov[0], "🔒 셔터가 내려진 점포 — " + fname(d.f) + " 관리실 셔터 열쇠로 한꺼번에 엽니다.");
      });
      break;

     case "villa":
      add("lk", 0, d.lk.prop, "📦 무인 택배함 — 택배 도착 문자 쪽지의 비밀번호가 있어야 열립니다. 쪽지는 집 안 어딘가에 있습니다.");
      break;
    }
    return S.hs = o;
  }
  function hints(dt) {
    S.hT -= dt;
    if (S.hT > 0) return;
    S.hT = .4;
    const p = A_().player;
    if (!p || !p.alive) return;
    for (const h of hintSpots()) {
      if (S.said[h.id] || h.f !== p.floor || Math.hypot(h.x - p.x, h.y - p.y) > N.HINT_D) continue;
      S.said[h.id] = 1;
      say(h.t, null);
    }
  }
  function loopsOff() {
    if (SX.audio && SX.audio.spotLoop) for (const id of [ "bdgen", "bdbus", "bdfuse" ]) SX.audio.spotLoop(id);
  }
  B.tick = function(dt) {
    if (!S || !S.d || SX.raid.over) return;
    try {
      TICK[S.d.k](S.d, dt);
      if (S.job) jobTick(dt);
      hints(dt);
      ghostPoses();
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn("[bdev] tick", e);
      }
    }
  };
  B.hud = function() {
    const j = S && S.job;
    if (!j) return null;
    const L = {
      pa: "방송 장비 켜는 중",
      pull: "시동 줄 당기는 중",
      bus: "버스 시동 거는 중",
      pry: "탄약고 문 비트는 중",
      fuse: "도화선 붙이는 중",
      sh: "방화 셔터 내리는 중",
      fd: "방화문 미는 중",
      key: "관리실 열쇠 돌리는 중",
      pin: "비밀번호 누르는 중"
    };
    return {
      text: (L[j.k] || "") + " … " + Math.max(0, j.T - j.t).toFixed(1) + " · [" + key() + "] 그만",
      col: null
    };
  };
  B.hud2 = function() {
    const d = S && S.d;
    if (!d) return null;
    const p = A_().player;
    if (d.k === "base" && d.fuse != null && !d.boom) return {
      text: "⚠ 탄약고 폭발까지 " + Math.max(0, Math.ceil(d.fuse)) + "초",
      col: null
    };
    if (d.k === "villa" && d.holder === me() && !d.open && p && p.floor === 0 && Math.hypot(p.x - d.lk.x - 1, p.y - d.lk.y) < 10) return {
      text: "📜 " + d.dong + "동 " + d.ho + "호 · 비밀번호 " + d.pin,
      col: null
    };
    if (d.k === "school" && d.on) return {
      text: "📢 " + fname(d.on.f) + " 비상 방송 — " + Math.max(0, Math.ceil(N.PA_LURE - d.on.t)) + "초",
      col: null
    };
    if (d.k === "office" && p) {
      const q = flOf(d, p.floor);
      if (q && q.st === 2) return {
        text: "⛔ 방화 셔터 — " + Math.max(0, Math.ceil(N.SH_UP - q.t)) + "초 뒤 올라갑니다",
        col: null
      };
    }
    return null;
  };
  B.marks = function(out) {
    const d = S && S.d;
    if (!d) return;
    if (d.k === "school" && d.on) {
      const q = spkOf(d, d.on.f);
      if (q) out.push({
        f: q.f,
        x: q.x + .5,
        y: q.y + 1,
        col: HUE,
        label: "비상 방송"
      });
    }
    if (d.k === "base" && d.fuse != null && !d.boom) out.push({
      f: 0,
      x: d.tnt.x + .5,
      y: d.tnt.y + .5,
      col: "rgb(255,120,60)",
      label: "폭약"
    });
  };
  B.pois = function(f) {
    const o = [], d = S && S.d;
    if (!d) return o;
    const at = (pr, ff) => {
      if (pr && ff === f) o.push({
        kind: "bdev",
        x: (pr.px != null ? pr.px : pr.x) + pr.w / 2,
        y: pr.y + pr.h / 2
      });
    };
    switch (d.k) {
     case "school":
      at(d.pa.prop, d.pa.f);
      break;

     case "hos":
      at(d.gen.prop, d.gen.f);
      if (d.fr && d.c === 2) at(d.fr.prop, d.fr.f);
      break;

     case "metro":
      if (d.prop) at(d.prop, 0);
      break;

     case "base":
      if (!d.boom) o.push(...f === 0 ? [ {
        kind: "bdev",
        x: d.door.cx,
        y: d.door.cy
      } ] : []);
      break;

     case "office":
      at(d.pan.prop, 0);
      break;

     case "mall":
      at(d.kp.prop, d.f);
      break;

     case "villa":
      at(d.lk.prop, 0);
      break;
    }
    return o;
  };
  B.todayLine = function() {
    const s = B.ensure(), d = s && s.d;
    if (!d) return "";
    switch (d.k) {
     case "school":
      return " · 📢 " + fname(d.pa.f) + " 방송실에서 층을 골라 비상 방송을 틀 수 있습니다";

     case "hos":
      return d.wet ? " · ⚡ 전기실이 물에 잠겨 비상 발전기를 쓸 수 없습니다" : " · ⚡ " + fname(d.gen.f) + " 비상 발전기로 비상등이나 약품 보관함 중 하나를 살릴 수 있습니다";

     case "metro":
      return " · 📢 1층 바깥 버스 시동을 걸면 큰 소리로 둘레 좀비를 끌어올 수 있습니다";

     case "base":
      return " · 🔩 1층 탄약고를 비틀어 열거나 터뜨릴 수 있습니다";

     case "office":
      return " · ⛔ 1층 방재실에서 층마다 방화 셔터를 내릴 수 있습니다";

     case "mall":
      return " · 🔑 관리실 열쇠로 " + fname(d.f) + " 잠긴 점포 셔터를 올릴 수 있습니다";

     case "villa":
      return " · 📦 택배 문자 쪽지를 찾으면 1층 무인 택배함이 열립니다";
    }
    return "";
  };
  B.bulletHit = function(b) {
    if (!S || !S.d || b.floor == null) return false;
    const F = floorOf(b.floor);
    if (!F || !F.propAt) return false;
    for (const yy of [ b.y, b.y + .5 ]) {
      const x = Math.floor(b.x), y = Math.floor(yy);
      if (!F.in(x, y)) continue;
      const pr = F.propAt[F.i(x, y)];
      if (!pr || !pr.bdWall || !pr.solid) continue;
      for (let k = 0; k < 4; k++) A_().part({
        floor: b.floor,
        x: b.x,
        y: b.y,
        z: .6,
        vx: (Math.random() - .5) * 4,
        vy: (Math.random() - .5) * 4,
        vz: 1.5,
        g: 9,
        c: A_().FX.spark,
        t: .25,
        life: .25
      });
      SX.audio.play("hitMetal", {
        x: b.x,
        y: b.y,
        range: 12,
        vol: .5
      });
      return true;
    }
    return false;
  };
  B.dump = function() {
    const d = S && S.d;
    if (!d) return undefined;
    const o = {
      v: 1,
      k: d.k
    };
    switch (d.k) {
     case "school":
      o.u = d.uses;
      o.cd = r2(d.cd);
      o.on = d.on ? [ d.on.f, r2(d.on.t) ] : null;
      break;

     case "hos":
      o.st = d.st;
      o.c = d.c;
      o.by = d.by;
      break;

     case "metro":
      o.st = d.st;
      o.t = r2(d.t);
      break;

     case "base":
      o.op = d.open ? 1 : 0;
      o.fu = d.fuse == null ? null : r2(d.fuse);
      o.bo = d.boom ? 1 : 0;
      break;

     case "office":
      o.u = d.uses;
      o.cd = r2(d.cd);
      o.fl = d.fl.map(q => [ q.st, r2(q.t), q.lines.map(l => r2(l.fd)) ]);
      break;

     case "mall":
      o.st = d.st;
      o.t = r2(d.t);
      break;

     case "villa":
      o.h = d.holder;
      o.op = d.open ? 1 : 0;
      break;
    }
    return o;
  };
  B.worldIn = function(w) {
    const d = S && S.d;
    if (!w || !d || w.k !== d.k) return;
    try {
      const num = (v, z) => typeof v === "number" && isFinite(v) ? v : z;
      switch (d.k) {
       case "school":
        d.uses = num(w.u, d.uses);
        d.cd = num(w.cd, 0);
        if (Array.isArray(w.on) && spkOf(d, w.on[0] | 0)) paOn(d, w.on[0] | 0, num(w.on[1], 0)); else d.on = null;
        break;

       case "hos":
        if (w.st >= 1 && !d.st) {
          d.st = 1;
          d.by = w.by;
        }
        if (w.c) DO.pick(d, {
          c: w.c,
          by: w.by
        }, true);
        break;

       case "metro":
        if (w.st === 2) stopBus(d); else if (w.st === 1 && !d.st) {
          d.st = 1;
          d.t = num(w.t, 0);
          d.hn = N.BUS_HORN;
          busLamp(d, floorOf(0));
        }
        break;

       case "base":
        if (w.op) openDepot(d, true);
        if (w.bo) boom(d, true); else if (w.fu != null && d.fuse == null) d.fuse = num(w.fu, N.FUSE_WAIT);
        break;

       case "office":
        d.uses = num(w.u, d.uses);
        d.cd = num(w.cd, 0);
        (w.fl || []).forEach((r, k) => {
          const q = d.fl[k];
          if (!q || !Array.isArray(r) || q.st) return;
          const st = r[0] | 0;
          if (st === 1) {
            q.st = 1;
            q.t = num(r[1], 0);
          } else if (st === 2) {
            shDown(q, true);
            q.t = num(r[1], 0);
            (r[2] || []).forEach((fd, i) => {
              if (fd > 0 && q.lines[i]) {
                DO.fd(d, {
                  f: q.f,
                  l: i
                }, true);
                q.lines[i].fd = fd;
              }
            });
          } else if (st === 3) {
            shDown(q, true);
            shUp(q, true);
            q.t = num(r[1], 0);
          }
        });
        break;

       case "mall":
        if (w.st === 2) openShops(d, true); else if (w.st === 1 && !d.st) {
          d.st = 1;
          d.t = num(w.t, 0);
          d.kp.prop.v = 1;
        }
        break;

       case "villa":
        if (w.h != null && d.holder == null) DO.note(d, {
          by: w.h
        }, true);
        if (w.op) openLocker(d, true);
        break;
      }
    } catch (e) {
      console.warn("[bdev] worldIn", e);
    }
  };
  B.onEnd = function() {
    if (S && S.job) stopJob();
    loopsOff();
    const C = SX.coop;
    if (C && C.ghosts) for (const g of C.ghosts.values()) if (g._bdP) {
      g.armPose = null;
      g.hideWeapon = false;
      g._bdP = false;
      g.bdPose = 0;
    }
  };
  B._S = () => S;
  void {
    req,
    apply: (a, x, by) => apply(a, x || {}, by == null ? me() : by),
    POSE,
    chooser,
    hintSpots: () => hintSpots(),
    boom: () => S && S.d && boom(S.d, false)
  };
  (function art() {
    const A = SX.art;
    if (!A || !A.defProp || !A.propSize) return;
    const PP = A.PP || {}, RP = c => A.ramp ? A.ramp(c) : [ c, c, c, c, c, c ];
    const hr = (a, b) => {
      let h = Math.imul((a | 0) * 374761393 + (b | 0) * 668265263, 1274126177);
      h ^= h >>> 13;
      h = Math.imul(h, 1103515245);
      return (h >>> 0) % 1e3 / 1e3;
    };
    const sh = (P, x, y, w, h, a) => {
      if (PP.sbox) PP.sbox(P, x, y, w, h, a);
    };
    const box = (P, x, y, w, t, f, c, o) => {
      if (PP.box) PP.box(P, x, y, w, t, f, c, o); else P.r(x, y, w, t + f, c);
    };
    const mini = (P, x, y, t, c, w, s) => PP.mini ? PP.mini(P, x, y, t, c, w, s) : 0;
    const grime = (P, x, y, w, h, g, n, c) => {
      if (PP.grime) PP.grime(P, x, y, w, h, g, n, c);
    };
    const rust = (P, x, y, w, h, g, n) => {
      if (PP.rust) PP.rust(P, x, y, w, h, g, n);
    };
    const scratch = (P, x, y, w, h, g, n, c) => {
      if (PP.scratch) PP.scratch(P, x, y, w, h, g, n, c);
    };
    const rivet = (P, x, y, R) => {
      if (PP.rivet) PP.rivet(P, x, y, R); else P.p(x, y, R[4]);
    };
    const def = (k, fw, fh, up, fn) => {
      if (!A.propSize(k)) A.defProp(k, fw, fh, up, fn);
    };
    const hazard = (P, x, y, w, h, o) => {
      for (let k = 0; k < w; k++) P.r(x + k, y, 1, h, k + (o | 0) >> 2 & 1 ? "#1e1e1c" : "#d8b020");
    };
    def("bdPA", 2, 1, 30, (P, w, h, up, g, v) => {
      const B = h - 2, on = v === 1, used = v === 3;
      sh(P, 2, B - 4, 60, 6, .4);
      box(P, 2, B - 30, 60, 8, 22, "#6a5844", {
        fi: 3
      });
      const D = RP("#6a5844");
      P.r(6, B - 17, 22, 1, D[1]).r(36, B - 17, 22, 1, D[1]).r(16, B - 14, 3, 1, D[4]).r(46, B - 14, 3, 1, D[4]);
      P.r(30, B - 21, 1, 19, D[1]);
      box(P, 5, B - 46, 24, 5, 18, "#34373c", {
        fi: 3
      });
      const Am = RP("#34373c");
      for (let k = 0; k < 3; k++) P.r(7, B - 39 + k * 5, 20, 1, Am[1]);
      for (let k = 0; k < 5; k++) P.p(9 + k * 4, B - 37, Am[5]).p(9 + k * 4, B - 32, Am[5]);
      P.r(19, B - 30, 7, 3, "#1a1c18").r(20, B - 29, used ? 1 : 2 + (v & 1) * 2, 1, used ? "#3a3a2a" : "#6ee070").p(25, B - 29, on ? "#e0c040" : "#3a3a2a");
      P.p(8, B - 29, used ? "#3a2020" : "#e04030");
      box(P, 32, B - 31, 20, 6, 3, "#2a2c30");
      for (let k = 0; k < 5; k++) {
        const x = 34 + k * 4, s = hr(k, v) * 4 | 0;
        P.r(x, B - 30, 1, 5, "#121316").r(x - 1, B - 30 + s, 3, 2, k === 4 ? "#c84030" : "#a8acb0");
      }
      P.r(54, B - 30, 1, 2, "#2a2c30").line(54, B - 30, 50, B - 40, "#4a4e54").line(50, B - 40, 47, B - 42, "#4a4e54");
      P.r(44, B - 44, 5, 3, "#1e2022").r(44, B - 44, 5, 1, "#5a5e64").p(48, B - 43, on ? "#e04030" : "#4a2020");
      box(P, 10, B - 55, 16, 2, 4, "#d8d0b8");
      [ "#c84030", "#d8a030", "#3a8a4a", "#3a6ab0" ].forEach((c, k) => P.r(12 + k * 3, B - 52, 2, 2, c));
      const lit = on || v === 2, oc = lit ? "#e03a30" : "#4a2222";
      P.r(30, B - 56, 27, 8, "#1c1c1e").r(31, B - 55, 25, 6, oc);
      mini(P, 31, B - 54, "ON AIR", lit ? on ? "#fff0e0" : "#ffc8c0" : "#6a3a3a", 25);
      if (lit) {
        P.r(30, B - 57, 27, 1, "rgba(255,90,70,0.35)");
        P.r(30, B - 48, 27, 1, "rgba(255,90,70,0.25)");
      }
      P.r(4, B - 27, 9, 2, "#e8e4d8").r(5, B - 28, 8, 1, "#d8d4c8").r(5, B - 27, 6, 1, "#9a968c");
      P.r(57, B - 34, 3, 4, "#e8e4dc").r(57, B - 34, 3, 1, "#5a3a22");
      P.line(28, B - 24, 30, B - 12, "#1a1a1a").line(30, B - 12, 27, B - 3, "#1a1a1a");
      P.r(38, B - 20, 8, 6, "#f0ecd8").r(39, B - 18, 6, 1, "#9a968c").r(39, B - 16, 4, 1, "#9a968c");
      if (used) P.line(32, B - 56, 56, B - 49, "#c8b890").line(32, B - 49, 56, B - 56, "#c8b890");
      grime(P, 4, B - 22, 56, 20, g, 6);
      scratch(P, 4, B - 30, 56, 8, g, 3, D[4]);
    });
    def("bdSpk", 1, 1, 40, (P, w, h, up, g, v) => {
      const on = v > 0, Y = 12;
      P.r(15, 0, 2, Y + 2, "#7a7e84").r(15, 0, 1, Y + 2, "#9a9ea4");
      P.r(12, Y + 2, 8, 3, "#5a5e64").r(12, Y + 2, 8, 1, "#8a8e94");
      box(P, 11, Y + 5, 10, 2, 5, "#c8c4b6");
      P.oval(16, Y + 15, 7, 4, "#d8d4c6").oval(16, Y + 15, 6, 3, "#b8b4a6").oval(16, Y + 16, 4, 2, "#3a3a36").p(16, Y + 16, "#1a1a18");
      P.r(10, Y + 12, 12, 1, "#e8e4d8");
      P.p(19, Y + 6, on ? v === 1 ? "#ff4030" : "#ff8a60" : "#4a2a24");
      if (on) {
        const a = v === 1 ? 0 : 1, c = "rgba(255,240,200,0.55)";
        P.line(4 - a, Y + 11, 2 - a, Y + 16, c).line(2 - a, Y + 16, 4 - a, Y + 21, c).line(28 + a, Y + 11, 30 + a, Y + 16, c).line(30 + a, Y + 16, 28 + a, Y + 21, c);
        if (v === 2) P.line(7, Y + 13, 6, Y + 16, c).line(6, Y + 16, 7, Y + 19, c).line(25, Y + 13, 26, Y + 16, c).line(26, Y + 16, 25, Y + 19, c);
      }
      P.r(13, Y + 24, 6, 3, "#e8e4d0").r(14, Y + 25, 4, 1, "#9a9688");
    });
    def("bdGen", 2, 1, 28, (P, w, h, up, g, v) => {
      const B = h - 2, run = v === 1 || v === 2, dy = v === 2 ? -1 : 0, wet = v === 3;
      sh(P, 2, B - 4, 60, 6, .42);
      P.oval(40, B - 2, 9, 2, "rgba(20,16,12,0.35)");
      P.r(4, B - 6, 50, 4, "#2e3034").r(4, B - 6, 50, 1, "#4a4e54").r(6, B - 2, 4, 2, "#1e2024").r(48, B - 2, 4, 2, "#1e2024");
      box(P, 6, B - 40 + dy, 44, 8, 26, "#c8a028", {
        fi: 3
      });
      const Y = RP("#c8a028");
      for (let k = 0; k < 5; k++) P.r(20, B - 27 + dy + k * 3, 14, 1, Y[1]);
      P.oval(13, B - 20 + dy, 5, 5, "#2a2c30").oval(13, B - 20 + dy, 4, 4, "#3e4248").p(13, B - 20 + dy, "#8a8e94");
      const hx = run ? 7 + (v & 1) : 6;
      P.r(hx, B - 29 + dy, 6, 2, "#b02a20").r(hx, B - 29 + dy, 6, 1, "#d84a3a").line(hx + 3, B - 27 + dy, 11, B - 22 + dy, "#d8d0b8");
      P.r(37, B - 30 + dy, 11, 12, "#2a2c30").r(38, B - 29 + dy, 9, 10, "#3a3e44");
      P.oval(40, B - 26 + dy, 2, 2, "#e8e4d8").p(40, B - 26 + dy, "#1a1a1a").p(41, B - 27 + dy, "#c03020");
      P.oval(45, B - 26 + dy, 2, 2, "#e8e4d8").p(45, B - 26 + dy, "#1a1a1a").p(46, B - 25 + dy, "#c03020");
      P.r(39, B - 22 + dy, 2, 2, run ? "#6ef07a" : "#1e3a22").r(43, B - 22 + dy, 3, 2, "#9a9ea4");
      P.r(10, B - 46 + dy, 10, 5, "#a88820").r(12, B - 47 + dy, 4, 2, "#2a2c30");
      P.r(38, B - 47 + dy, 10, 6, "#4a4e54").r(38, B - 47 + dy, 10, 1, "#6a6e74").r(46, B - 52 + dy, 3, 6, "#3a3e44").r(46, B - 53 + dy, 3, 1, "#1a1a1a");
      P.r(24, B - 46 + dy, 9, 4, "#1e1e1c");
      hazard(P, 25, B - 45 + dy, 7, 2);
      mini(P, 22, B - 38 + dy, "5KVA", "#3a2a10");
      box(P, 53, B - 20, 9, 3, 16, "#a83028");
      P.r(55, B - 23, 5, 2, "#7a2018").r(54, B - 12, 7, 1, "#7a2018");
      if (run) {
        P.r(46, B - 56, 3, 2, "rgba(60,60,64,0.6)").r(45 + (v & 1), B - 59, 4, 2, "rgba(80,80,84,0.4)");
      }
      rust(P, 6, B - 16, 44, 4, g, 3);
      grime(P, 6, B - 40, 44, 34, g, 8);
      scratch(P, 8, B - 38, 40, 8, g, 3, Y[4]);
      if (wet) {
        P.r(0, B - 9, 64, 9, "rgba(54,82,100,0.5)").r(0, B - 9, 64, 1, "rgba(170,210,230,0.55)");
        for (let k = 0; k < 6; k++) P.r(2 + (hr(k, 3) * 58 | 0), B - 6 + (hr(k, 5) * 4 | 0), 3, 1, "rgba(200,230,240,0.4)");
        P.r(39, B - 22, 2, 2, "#3a1a18");
        P.r(30, B - 33, 1, 3, "rgba(120,160,180,0.6)");
      }
    });
    def("bdFridge", 1, 1, 38, (P, w, h, up, g, v) => {
      const B = h - 2, on = v === 1;
      sh(P, 2, B - 3, 28, 5, .42);
      box(P, 3, B - 62, 26, 6, 56, "#d6dadb", {
        fi: 3
      });
      P.r(6, B - 52, 19, 42, "#8a9094").r(7, B - 51, 17, 40, on ? "#b8dcea" : "#1c2428");
      for (let k = 0; k < 3; k++) {
        const y = B - 40 + k * 11;
        P.r(7, y, 17, 1, on ? "#e8f4f8" : "#3a4448");
        for (let i = 0; i < 6; i++) {
          const x = 8 + i * 3;
          P.r(x, y - 4, 2, 4, on ? i % 3 ? "#d8a050" : "#e8e8e0" : "#2a3034").p(x, y - 5, on ? i % 2 ? "#3a6ab0" : "#c84030" : "#30383c");
        }
      }
      if (on) P.line(9, B - 50, 15, B - 14, "rgba(255,255,255,0.35)");
      P.r(25, B - 42, 2, 14, "#9aa0a4").r(25, B - 42, 1, 14, "#c8ccd0");
      P.r(7, B - 60, 18, 6, "#1a1c1e");
      if (on) mini(P, 8, B - 59, "4.0", "#7ef0a0", 16); else mini(P, 8, B - 59, "--", "#5a2a2a", 16);
      P.r(21, B - 34, 4, 6, "#2a2c30").p(22, B - 33, on ? "#6ef07a" : "#ff3a30").r(22, B - 31, 2, 1, "#6a6e74").r(22, B - 29, 2, 1, "#6a6e74");
      P.r(12, B - 8, 8, 2, "#c8ccd0").r(15, B - 9, 2, 4, "#2e9a4e").r(14, B - 8, 4, 2, "#2e9a4e");
      P.r(4, B - 6, 24, 2, "#9aa0a4");
      P.r(5, B - 58, 1, 3, "#e8e4c8");
      grime(P, 4, B - 60, 24, 54, g, 6, "rgba(60,50,30,0.12)");
    });
    def("bdBus", 5, 2, 16, (P, w, h, up, g, v) => {
      const dy = v & 1 ? 1 : 0, lt = !!(v & 4), B = h - 2 - dy, sy = B - 38;
      if (A.busSide) A.busSide(P, w, h - dy, g, 1, "#3f8a5a");
      if (lt) {
        P.r(152, sy + 28, 5, 3, "#fff6d0").r(152, sy + 31, 5, 1, "#ffb040");
        P.r(157, sy + 27, 2, 5, "rgba(255,240,190,0.5)");
        P.r(3, sy + 28, 3, 3, "#ff3a2a");
      }
    });
    def("bdDepotDoor", 1, 1, 24, (P, w, h, up, g, v) => {
      const crow = v >= 50, b = v % 50, horiz = b >= 10, k = b % 10, S = RP("#5a6054");
      if (horiz) {
        const y0 = 9, y1 = h - 1;
        P.r(0, y0, 32, y1 - y0, S[3]).r(0, y0, 32, 1, S[5]).r(0, y0, 1, y1 - y0, S[4]).r(31, y0, 1, y1 - y0, S[1]);
        P.r(0, y0 + 12, 32, 3, S[2]).r(0, y0 + 12, 32, 1, S[4]).r(0, y0 + 30, 32, 3, S[2]).r(0, y0 + 30, 32, 1, S[4]);
        for (const x of [ 2, 29 ]) for (let y = y0 + 3; y < y1 - 2; y += 7) rivet(P, x, y, S);
        if (k === 0) {
          P.r(1, y0 + 4, 3, 6, "#2a2c28").r(1, y0 + 34, 3, 6, "#2a2c28");
        } else {
          P.r(20, y0 + 19, 9, 3, "#3a3e38").r(24, y0 + 20, 4, 9, "#a8a050").r(24, y0 + 20, 4, 1, "#d8d080").r(25, y0 + 25, 2, 2, "#2a2a20");
        }
        P.poly([ [ 13, y0 + 17 ], [ 18, y0 + 22 ], [ 13, y0 + 27 ], [ 8, y0 + 22 ] ], "#e07a20");
        P.r(12, y0 + 21, 3, 2, "#1e1e1c");
        hazard(P, 1, y1 - 4, 30, 3, k * 2);
        rust(P, 1, y0 + 2, 30, y1 - y0 - 4, g, 4);
        scratch(P, 2, y0 + 4, 28, 30, g, 4, S[5]);
        if (crow) {
          P.r(28, y0 + 14, 2, 22, "#141614");
          P.thick(29, y0 + 16, 16, y0 + 40, 2, "#8a2420").line(29, y0 + 16, 17, y0 + 38, "#c84a3a").r(28, y0 + 14, 3, 3, "#3a3a3a");
          P.p(30, y0 + 13, "#ffe0a0").p(27, y0 + 18, "#ffd080");
        }
      } else {
        P.r(9, 0, 14, 32, S[2]).r(10, 0, 12, 32, S[3]).r(10, 0, 1, 32, S[5]).r(21, 0, 1, 32, S[1]);
        for (let y = 3; y < 30; y += 7) {
          rivet(P, 11, y, S);
          rivet(P, 19, y, S);
        }
        P.r(8, 13, 16, 4, "#3a3e38").r(14, 12, 4, 6, "#a8a050");
        if (crow) {
          P.thick(6, 4, 22, 22, 2, "#8a2420").line(6, 3, 21, 21, "#c84a3a");
          P.p(23, 23, "#ffe0a0");
        }
      }
    });
    const FUSE = [ [ 22, -9 ], [ 25, -8 ], [ 27, -6 ], [ 28, -4 ], [ 26, -2 ], [ 22, -2 ], [ 18, -3 ], [ 14, -2 ], [ 10, -1 ] ];
    def("bdTnt", 1, 1, 12, (P, w, h, up, g, v) => {
      const B = h - 2;
      sh(P, 4, B - 4, 22, 5, .4);
      box(P, 5, B - 16, 15, 4, 9, "#5a6a3a");
      box(P, 7, B - 22, 13, 4, 6, "#62723e");
      P.r(5, B - 9, 15, 1, "#2a2a20").r(11, B - 18, 2, 10, "#9a9070");
      mini(P, 7, B - 12, "C4", "#d8c840");
      P.r(16, B - 25, 3, 5, "#c8ccd0").r(16, B - 25, 3, 1, "#eef0f2");
      P.line(18, B - 20, 22, B - 9, "#1e2a1a");
      const n = Math.max(0, Math.min(8, v | 0));
      for (let i = 0; i < FUSE.length - 1; i++) {
        const a = FUSE[i], c = FUSE[i + 1], burnt = FUSE.length - 1 - i <= n;
        P.line(a[0], B + a[1], c[0], B + c[1], burnt ? "#6a6862" : "#22301e");
      }
      if (n > 0) {
        const q = FUSE[FUSE.length - 1 - n] || FUSE[0], x = q[0], y = B + q[1];
        P.r(x - 1, y - 1, 3, 3, "rgba(255,170,60,0.55)").p(x, y, "#fff4c0").p(x + 1, y - 2, "#ffd060").p(x - 2, y - 1, "#ff8a3a");
      }
      P.r(22, B - 13, 4, 3, "#c03028").p(23, B - 12, "#f0e0d0");
    });
    def("bdWreck", 1, 1, 12, (P, w, h, up, g, v) => {
      const B = h - 2;
      P.oval(16, B - 5, 14, 5, "rgba(14,12,10,0.55)");
      for (let k = 0; k < 6; k++) {
        const x = 3 + (hr(k, v) * 22 | 0), y = B - 4 - (hr(v, k) * 12 | 0), l = 6 + (hr(k * 3, v) * 8 | 0);
        P.thick(x, y, x + l, y - 3 + (hr(k, 9) * 6 | 0), 2, k % 2 ? "#2a2018" : "#3a2a1c");
      }
      P.r(8, B - 10, 14, 4, "#4a463e").r(9, B - 11, 10, 2, "#5a564c");
      P.line(5, B - 14, 18, B - 18, "#5a5e58").line(18, B - 18, 26, B - 12, "#4a4e48");
      for (let k = 0; k < 5; k++) P.p(6 + (hr(k, v + 7) * 20 | 0), B - 4 - (hr(k + 7, v) * 9 | 0), k % 2 ? "#ff8a3a" : "#ffc060");
      for (let k = 0; k < 7; k++) P.r(2 + (hr(k, v + 11) * 27 | 0), B - 1 - (hr(k, v + 13) * 6 | 0), 2, 1, "#b89040");
    });
    def("bdPanel", 2, 1, 34, (P, w, h, up, g, v) => {
      const B = h - 2, al = v === 1 || v === 2, used = v === 3, Bg = RP("#c8c0a8");
      sh(P, 2, B - 4, 60, 6, .4);
      box(P, 4, B - 60, 40, 6, 54, "#c8c0a8", {
        fi: 3
      });
      P.r(5, B - 54, 38, 4, "#b03028").r(5, B - 54, 38, 1, "#d84a3a");
      P.oval(10, B - 52, 2, 2, al && v === 1 ? "#ff5a40" : "#7a2018");
      mini(P, 15, B - 54, "119", "#f0e8d8");
      P.r(8, B - 48, 14, 8, "#1a2a1e").r(9, B - 47, 12, 6, used ? "#2a3a2e" : "#3a6a44");
      if (!used) {
        P.r(10, B - 46, 8, 1, "#8ef0a0").r(10, B - 44, 5, 1, "#8ef0a0");
      } else mini(P, 10, B - 46, "--", "#6a8a70");
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
        const x = 26 + c * 8, y = B - 47 + r * 4, blink = al && r + c + v & 1;
        P.r(x, y, 3, 2, used ? "#a87a20" : blink ? "#ff3a2a" : "#4a8a52").r(x + 4, y, 2, 1, Bg[1]);
      }
      for (let k = 0; k < 5; k++) {
        const x = 8 + k * 3;
        P.r(x, B - 36, 2, 4, "#2a2c30").p(x, B - 36 + (k + v & 1 ? 0 : 2), "#e8e8e0");
      }
      P.r(26, B - 22, 8, 6, "#c8c4b8").r(27, B - 21, 6, 4, "rgba(220,230,235,0.6)").oval(30, B - 19, 2, 1, "#c02a20");
      P.r(6, B - 26, 5, 9, "#1e2022").r(7, B - 25, 3, 7, "#2e3034").line(9, B - 17, 11, B - 10, "#1e2022");
      P.r(38, B - 34, 1, 10, Bg[1]).r(37, B - 31, 2, 4, "#9a968a");
      P.r(14, B - 14, 10, 6, "#f0ecd8").r(15, B - 12, 8, 1, "#9a968c").r(15, B - 10, 6, 1, "#9a968c");
      if (P.cyl) P.cyl(48, B - 26, 8, 22, "#c02a24", {
        e: 2
      }); else P.r(48, B - 26, 8, 22, "#c02a24");
      P.r(50, B - 30, 4, 4, "#2a2c30").line(53, B - 29, 57, B - 22, "#1a1a1a").r(49, B - 18, 6, 4, "#e8e0c8");
      P.r(58, B - 6, 4, 4, "#d8d0b8").r(58, B - 6, 4, 1, "#f0e8d0");
      grime(P, 5, B - 50, 38, 44, g, 7);
      scratch(P, 5, B - 30, 38, 20, g, 3, Bg[4]);
    });
    def("bdShutter", 1, 1, 28, (P, w, h, up, g, v) => {
      const o = Math.floor(v / 100), role = Math.floor(v % 100 / 10), fr = v % 10, S = RP("#a49c8c");
      if (o === 1) {
        const top = 9, bot = 48, cur = top + Math.round((bot - top) * Math.min(fr, 7) / 7);
        P.r(0, 2, 32, 7, "#3a3c40").r(0, 2, 32, 1, "#5e6268").r(0, 8, 32, 1, "#24262a");
        if (fr > 0 && fr < 7) P.p(29, 5, fr & 1 ? "#ffa030" : "#7a4a10");
        P.r(0, top, 1, bot - top, "#2a2c30").r(31, top, 1, bot - top, "#2a2c30");
        if (fr > 0) {
          P.r(1, top, 30, cur - top, S[3]);
          for (let y = top + 2; y < cur - 3; y += 3) P.r(1, y, 30, 1, S[2]);
          hazard(P, 1, cur - 3, 30, 3);
          P.r(1, cur, 30, 1, S[0]);
          if (fr >= 7) P.r(2, bot + 1, 28, 2, "rgba(0,0,0,0.3)");
        } else {
          P.r(1, bot - 1, 30, 1, "rgba(216,176,32,0.45)");
        }
        if (role === 1 && fr >= 7) {
          P.r(12, 14, 8, 4, "#1e6a36").r(13, 15, 2, 2, "#e8f0e0").r(16, 15, 3, 1, "#e8f0e0");
          if (fr === 8) {
            P.r(8, 22, 16, bot - 22, "#141518").r(4, 24, 4, bot - 21, S[4]).r(4, 24, 1, bot - 21, S[5]);
          } else {
            P.r(8, 22, 16, bot - 25, S[1]).r(9, 23, 14, bot - 27, S[4]).r(9, 33, 14, 2, "#7a7e84").r(21, 33, 2, 2, "#c8ccd0");
          }
        }
      } else {
        P.r(13, 28, 6, 32, "rgba(0,0,0,0)");
        for (let y = 29; y < 60; y += 4) P.r(14, y, 4, 2, y & 4 ? "#d8b020" : "#1e1e1c");
        P.r(14, 0, 4, 32, "#2a2c30");
        if (fr > 0) {
          const S2 = fr >= 7 ? S : RP("#7a7466");
          P.r(12, 0, 8, 32, S2[2]).r(13, 0, 6, 32, S2[3]).r(13, 0, 1, 32, S2[5]).r(18, 0, 1, 32, S2[1]);
          for (let y = 2; y < 32; y += 5) P.r(13, y, 6, 1, S2[2]);
          if (fr < 7) P.p(16, fr * 4 % 32, "#ffa030");
        }
        if (role === 1 && fr >= 7) {
          if (fr === 8) {
            P.r(12, 4, 8, 22, "#141518");
            P.r(12, 2, 14, 3, S[4]).r(12, 2, 14, 1, S[5]);
          } else {
            P.r(12, 4, 8, 1, S[1]).r(12, 25, 8, 1, S[1]).r(14, 6, 4, 2, "#1e6a36");
          }
        }
      }
    });
    def("bdShopShut", 1, 1, 24, (P, w, h, up, g, v) => {
      const fr = Math.floor(v / 100), b = v % 100, horiz = b >= 10, k = b % 10, S = RP("#8a8c88");
      if (horiz) {
        const y0 = 9, y1 = h - 1, cur = y1 - fr * 9;
        P.r(0, 3, 32, 7, "#4a4c50").r(0, 3, 32, 1, "#6a6e74").r(0, 9, 32, 1, "#2a2c30");
        if (fr > 0) P.r(0, cur, 32, y1 - cur, "#121316");
        P.r(0, y0, 32, cur - y0, S[3]);
        for (let y = y0 + 1; y < cur - 2; y += 2) P.r(0, y, 32, 1, y >> 1 & 1 ? S[2] : S[4]);
        P.r(0, cur - 3, 32, 3, S[1]).r(0, cur - 3, 32, 1, S[4]);
        if (fr === 0 && k === 0) {
          P.r(14, y1 - 6, 4, 3, "#2a2c30").r(14, y1 - 9, 4, 4, "#c8a040").r(14, y1 - 9, 4, 1, "#e8d080").p(15, y1 - 7, "#2a2010");
        }
        if (fr === 0 && k === 1) {
          P.r(6, y0 + 12, 12, 9, "#f0ecdc").r(7, y0 + 14, 9, 1, "#8a867c").r(7, y0 + 16, 7, 1, "#8a867c").r(7, y0 + 18, 8, 1, "#8a867c");
        }
        const tag = [ "#c84a8a", "#3a8ac8", "#e0a030" ][hr(k, 5) * 3 | 0];
        if (cur - y0 > 22) P.line(3 + k * 3, y0 + 8, 12 + k * 3, y0 + 4, tag).line(12 + k * 3, y0 + 4, 20, y0 + 10, tag);
        rust(P, 0, y0, 32, Math.max(1, cur - y0), g, 3);
      } else {
        const len = 32 - fr * 6;
        P.r(8, 0, 16, len, S[2]);
        for (let y = 1; y < len - 1; y += 2) P.r(9, y, 14, 1, y >> 1 & 1 ? S[3] : S[4]);
        P.r(8, 0, 1, len, S[1]).r(23, 0, 1, len, S[1]);
        if (fr === 0 && k === 0) P.r(14, 14, 4, 4, "#c8a040");
      }
    });
    def("bdMallKey", 1, 1, 34, (P, w, h, up, g, v) => {
      const on = v === 1, K = RP("#7a7e84");
      P.r(15, 0, 2, 14, "#6a6e74").r(15, 0, 1, 14, "#8a8e94");
      box(P, 8, 14, 16, 3, 18, "#7a7e84", {
        fi: 3
      });
      P.r(10, 18, 12, 4, "#1e2022");
      mini(P, 10, 18, "UP", "#e8e4d8", 12);
      P.oval(16, 27, 3, 3, "#c8a040").oval(16, 27, 2, 2, "#8a6a20");
      if (on) {
        P.r(14, 26, 7, 2, "#d8d0b0").r(19, 25, 3, 4, "#d8d0b0").p(14, 26, "#f0e8d0");
      } else {
        P.r(15, 22, 2, 7, "#d8d0b0").r(14, 20, 4, 3, "#d8d0b0").p(15, 22, "#f0e8d0");
      }
      P.p(11, 30, on ? "#6ef07a" : "#2a4a2e").p(21, 30, on ? "#4a1a18" : "#ff3a30");
      hazard(P, 8, 33, 16, 2);
      P.r(10, 36, 12, 4, "#e8e4d0").r(11, 37, 3, 2, "#c8a040").r(15, 38, 6, 1, "#8a867c");
      scratch(P, 8, 14, 16, 18, g, 2, K[5]);
    });
    def("bdLocker", 2, 1, 42, (P, w, h, up, g, v) => {
      const B = h - 2, open = !!(v & 1), bl = !!(v & 2), C = RP("#4a6e9a");
      sh(P, 2, B - 4, 60, 6, .42);
      box(P, 2, B - 70, 60, 6, 64, "#4a6e9a", {
        fi: 3
      });
      P.r(3, B - 64, 58, 6, "#2a4a78").r(3, B - 64, 58, 1, C[4]);
      mini(P, 3, B - 63, "PARCEL BOX", "#e8f0f8", 58);
      const cell = (x, y, ww, hh, n) => {
        P.r(x, y, ww, hh, C[2]).r(x + 1, y + 1, ww - 2, hh - 2, C[3]).r(x + 1, y + 1, ww - 2, 1, C[4]).p(x + ww - 3, y + (hh >> 1), "#c8ccd0").p(x + 2, y + 2, n % 3 ? "#6ef07a" : "#ff6a4a");
      };
      let n = 0;
      for (const x0 of [ 4, 41 ]) for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) cell(x0 + c * 10, B - 56 + r * 12, 10, 12, n++);
      P.r(25, B - 56, 14, 48, "#2e3440").r(25, B - 56, 14, 1, "#4a5260");
      P.r(27, B - 54, 10, 8, "#10141a").r(28, B - 53, 8, 6, bl ? "#7ab8e8" : "#3a6a98");
      if (!open) {
        P.r(29, B - 51, 6, 1, "#e8f4ff").r(29, B - 49, 4, 1, "#e8f4ff");
      }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) P.r(28 + c * 3, B - 43 + r * 3, 2, 2, r === 3 && c === 2 ? "#3a8a4a" : "#c8ccd0");
      P.r(28, B - 29, 8, 2, "#121418").r(29, B - 25, 6, 6, "#1a1e24").r(30, B - 24, 4, 1, "#e0c040");
      if (open) {
        const x = 51, y = B - 44;
        P.r(x, y, 10, 12, "#121416").r(x + 1, y + 4, 7, 7, "#a8783e").r(x + 1, y + 4, 7, 1, "#c89858").r(x + 4, y + 4, 1, 7, "#d8c8a0");
        P.r(x + 10, y - 1, 3, 14, C[4]).r(x + 10, y - 1, 1, 14, C[5]);
      }
      box(P, 52, B - 9, 9, 3, 6, "#a8783e");
      P.r(56, B - 9, 1, 9, "#d8c8a0");
      P.r(6, B - 6, 14, 2, "#e8e4d8").r(7, B - 5, 9, 1, "#8a867c");
      grime(P, 3, B - 64, 58, 58, g, 8);
      scratch(P, 3, B - 56, 58, 48, g, 4, C[5]);
    });
    def("bdNote", 1, 1, 6, (P, w, h, up, g, v) => {
      const B = h - 2, x = v ? 12 : 8, y = B - (v ? 14 : 12);
      P.r(x + 1, y + 1, 14, 10, "rgba(0,0,0,0.3)");
      for (let k = 0; k < 10; k++) P.r(x + (v ? k >> 2 : 0), y + k, 14, 1, k === 0 ? "#f8f6ee" : "#eceae0");
      P.r(x, y, 14, 3, "#3a6ab0").r(x + 1, y + 1, 4, 1, "#e8f0f8");
      for (let k = 0; k < 3; k++) P.r(x + 2 + (v ? k + 4 >> 2 : 0), y + 5 + k * 2, 8 + (hr(k, v) * 3 | 0), 1, "#8a8a92");
      P.r(x + 9, y + 9, 3, 1, "#c84030");
      P.p(x + 13, y + 9, "#d8d6cc").p(x + 12, y + 9, "#c8c6bc");
      P.p(x - 2, y - 2, "#fff8d0").p(x - 3, y - 2, "rgba(255,248,208,0.5)").p(x - 2, y - 3, "rgba(255,248,208,0.5)");
    });
    const MAT = {
      bdPA: "metal",
      bdSpk: "metal",
      bdGen: "metal",
      bdFridge: "metal",
      bdBus: "metal",
      bdDepotDoor: "metal",
      bdTnt: "plastic",
      bdWreck: "wood",
      bdPanel: "metal",
      bdShutter: "metal",
      bdShopShut: "metal",
      bdMallKey: "metal",
      bdLocker: "metal",
      bdNote: "fabric"
    };
    if (A.PROP_MAT) Object.assign(A.PROP_MAT, MAT);
    if (A.defPropRot) for (const k of Object.keys(MAT)) A.defPropRot(k, {
      noRot: true
    });
  })();
})(window.SX);
