"use strict";

(function(SX) {
  const D = SX.data;
  const I = SX.items = {};
  I.REMOVED = [ "자개 부채", "제기 유물", "백자 항아리", "놋그릇 세트", "부목" ];
  D.items = D.items.filter(d => !I.REMOVED.includes(d.name));
  for (const st of D.stalls || []) {
    if (st.pool) st.pool = st.pool.filter(d => !I.REMOVED.includes(d.name));
    if (st.always) st.always = st.always.filter(d => !I.REMOVED.includes(d.name));
  }
  let uid = 1 + Math.floor(Math.random() * 1e6) * 1e5;
  I.uidGet = () => uid;
  I.uidSet = v => {
    uid = v;
  };
  const DEFS = new Map;
  const add = d => {
    if (d && d.name && !DEFS.has(d.name)) DEFS.set(d.name, d);
  };
  D.guns.forEach(add);
  D.mags.forEach(add);
  (D.parts || []).forEach(add);
  D.melee.forEach(add);
  D.containers.forEach(add);
  D.specials.forEach(add);
  D.items.forEach(add);
  add(D.helmet);
  add(D.cure);
  add(D.flare);
  add({
    name: "감염체 조직",
    val: 1200,
    w: 1,
    h: 1
  });
  add({
    name: "수류탄",
    val: 38e3,
    w: 1,
    h: 1,
    kind: "grenade",
    dmg: 90,
    radius: 3.2
  });
  for (const st of D.stalls) for (const d of st.pool.concat(st.always)) if (d.kind !== "ammo") add(d);
  I.def = name => DEFS.get(name) || null;
  I.QUEST_MUL = D.questMul;
  I.MAGS = {
    "9mm": "9mm 탄창",
    "5.56mm": "5.56mm 탄창",
    "7.62mm": "7.62mm 탄창",
    "12게이지": "12게이지 탄"
  };
  I.typeOf = it => it && (it.ammoType === "ap" || it.ammoType === "hp") ? it.ammoType : "";
  I.setType = (g, at) => {
    if (at === "ap" || at === "hp") g.ammoType = at; else delete g.ammoType;
  };
  I.typeName = (cal, at) => SX.ammoTypeName ? SX.ammoTypeName(cal, at) : "보통탄";
  I.magFor = (cal, at, box) => {
    const r = ((box ? SX.AMMO_BOXES : SX.AMMO_MAG) || {})[cal] || {};
    return r[at || ""] || r[""] || (box ? (SX.AMMO_BOX || {})[cal] : I.MAGS[cal]);
  };
  I.unloadGun = function(g) {
    const out = [], name = I.magFor(g.caliber, I.typeOf(g));
    let n = g.ammo | 0;
    while (n > 0) {
      const m = I.mk(name);
      if (!m) break;
      const t = Math.min(m.cap || n, n);
      m.ammo = t;
      n -= t;
      out.push(m);
    }
    g.ammo = n;
    return out;
  };
  function typeLoot(out, salt, b, armory) {
    const mags = out.filter(m => m && m.kind === "mag" && !I.typeOf(m));
    if (!mags.length) return;
    const tr = extraRng(out, salt), id = b && b.id || "", d = b && b.diff || 1;
    const pAP = armory ? .25 : id === "base" ? .15 : d >= 3 ? .04 : 0, pHP = armory ? 0 : id === "mall" || id === "metro" ? .25 : .08;
    for (const m of mags) {
      const r = tr.f(), at = r < pAP ? "ap" : r < pAP + pHP ? "hp" : "";
      if (at) I.retype(m, at);
    }
  }
  I.retype = function(m, at) {
    const d = I.def(I.magFor(m.caliber, at, m.box));
    if (!d) return m;
    const keep = {
      id: m.id,
      ammo: Math.min(m.ammo | 0, d.cap || 0),
      rot: m.rot,
      split: m.split,
      nb: m.nb
    };
    Object.assign(m, d, keep);
    delete m.price;
    delete m.wt;
    if (!d.ammoType) delete m.ammoType;
    for (const k of [ "rot", "split", "nb" ]) if (keep[k] == null) delete m[k];
    return m;
  };
  I.migrate = function(o) {
    if (!o || !o.name) return o;
    const nm = (SX.OLD_NAMES || {})[o.name];
    if (!nm) return o;
    const d = I.def(nm);
    if (!d) return o;
    const cap = d.magSize || d.cap || 0;
    const keep = {
      rot: o.rot,
      quest: o.quest
    };
    if (cap) keep.ammo = Math.max(0, Math.min(cap, o.ammo != null ? o.ammo : cap));
    if (o.uses != null) keep.uses = o.uses;
    return Object.assign({}, d, keep);
  };
  I.STACK_MAX = 99999;
  I.isStack = it => {
    const d = it && DEFS.get(it.name);
    return !!(d && d.stack);
  };
  I.qtyN = v => Math.max(1, Math.min(I.STACK_MAX, Math.floor(+v) || 1));
  I.qty = it => !it ? 0 : I.isStack(it) ? I.qtyN(it.n) : 1;
  I.stackUnit = it => (it && DEFS.get(it.name) || {}).unit || "개";
  const pendS = it => !!(SX.coop && SX.coop.pending && SX.coop.pending(it));
  I.stackIn = function(g, name, but) {
    if (!g || g.shut) return null;
    for (const e of g.list) if (e.it !== but && e.it.name === name && I.isStack(e.it) && !pendS(e.it) && I.qty(e.it) < I.STACK_MAX) return e.it;
    return null;
  };
  I.stackTop = function(grids, it) {
    if (!it || !I.isStack(it) || pendS(it)) return false;
    for (const g of grids) {
      if (!g || g.shared) continue;
      const s = I.stackIn(g, it.name, it);
      if (s && I.qty(s) + I.qty(it) <= I.STACK_MAX) {
        s.n = I.qty(s) + I.qty(it);
        return true;
      }
    }
    return false;
  };
  I.putJoin = (g, it) => I.stackTop([ g ], it) || I.put(g, it);
  const coopG = g => !!(g && g.shared && SX.coop && SX.coop.raid);
  I.fillLeft = it => !it ? 0 : I.isStack(it) ? I.qty(it) : it.kind === "mag" ? Math.max(0, it.ammo | 0) : 1;
  const capOf = m => m.cap || m.magSize || 0;
  const fillOk = (g, it) => !!g && !!it && !g.shut && !g.noPut && !coopG(g) && !pendS(it) && !(g.accept && !g.accept(it)) && (I.isStack(it) || it.kind === "mag" && (it.ammo | 0) > 0 && capOf(it) > 0);
  const sameFill = (a, b) => a !== b && a.name === b.name && !pendS(a) && (I.isStack(b) ? I.isStack(a) : a.kind === "mag" && a.caliber === b.caliber && capOf(a) === capOf(b) && I.typeOf(a) === I.typeOf(b));
  const roomOf = s => I.isStack(s) ? I.STACK_MAX - I.qty(s) : capOf(s) - (s.ammo | 0);
  I.fillRoom = function(g, it) {
    if (!fillOk(g, it)) return 0;
    let r = 0;
    for (const e of g.list) if (sameFill(e.it, it)) r += Math.max(0, roomOf(e.it));
    return r;
  };
  I.fillSame = function(g, it) {
    let left = I.fillLeft(it), moved = 0, last = null;
    if (!fillOk(g, it)) return {
      moved,
      left
    };
    const st = I.isStack(it);
    for (const e of g.list.slice().sort((p, q) => p.y - q.y || p.x - q.x)) {
      const s = e.it;
      if (!sameFill(s, it)) continue;
      const k = Math.min(roomOf(s), left);
      if (k <= 0) continue;
      if (st) s.n = I.qty(s) + k; else s.ammo = (s.ammo | 0) + k;
      left -= k;
      moved += k;
      last = s;
      if (!left) break;
    }
    if (moved) {
      if (st) {
        if (left) it.n = left;
      } else {
        it.ammo = left;
        if (!left && !it.nb && last.nb) {
          delete last.nb;
          it.nb = 1;
        }
      }
    }
    return {
      moved,
      left
    };
  };
  I.putFill = function(g, it) {
    const r = I.fillSame(g, it);
    return r.moved > 0 && !r.left || I.put(g, it);
  };
  I.stackMerge = function(dst, src, take) {
    if (!dst || !src || dst === src || dst.name !== src.name || !I.isStack(dst) || pendS(dst) || pendS(src)) return 0;
    const a = I.qty(dst), b = I.qty(src), k = Math.min(b, I.STACK_MAX - a);
    if (k <= 0) return 0;
    if (k === b) {
      if (!take(src)) return 0;
      dst.n = a + b;
      return b;
    }
    dst.n = a + k;
    src.n = b - k;
    return k;
  };
  I.stackGive = function(grids, name, k) {
    k = I.qtyN(k);
    for (const g of grids) {
      if (!g || g.shared) continue;
      const s = I.stackIn(g, name);
      if (s && I.qty(s) + k <= I.STACK_MAX) {
        s.n = I.qty(s) + k;
        return g;
      }
    }
    const it = I.mk(name, {
      n: k
    });
    if (!it) return null;
    for (const g of grids) if (g && I.put(g, it)) return g;
    return null;
  };
  I.takeOne = (g, it) => {
    if (I.isStack(it) && I.qty(it) > 1) {
      if (!I.at(g, it)) return false;
      it.n = I.qty(it) - 1;
      return true;
    }
    return I.take(g, it);
  };
  I.splitStack = function(it) {
    const n = I.qty(it);
    if (!I.isStack(it) || n < 2 || pendS(it)) return null;
    const half = Math.floor(n / 2), m = I.mk(it.name, {
      n: half
    });
    if (!m) return null;
    it.n = n - half;
    return m;
  };
  function packOld(g, old) {
    for (let i = old.length - 1; i >= 0; i--) {
      const it = old[i], s = I.stackIn(g, it.name, it);
      if (!s || I.qty(s) + I.qty(it) > I.STACK_MAX) continue;
      const k = g.list.findIndex(e => e.it === it);
      if (k < 0) continue;
      s.n = I.qty(s) + I.qty(it);
      g.list.splice(k, 1);
    }
  }
  I.QUICK_N = 10;
  I.quickNew = () => new Array(I.QUICK_N).fill(null);
  I.armorUp = function(it) {
    if (!it || it.kind !== "armor" && it.kind !== "helmet" || it.dur10) return false;
    const d = DEFS.get(it.name), mx = +it.armorMax || +it.armor || 0;
    if (d && d.armor && mx > 0 && mx <= d.armor / 10 + .5) {
      it.armor = Math.round((+it.armor || 0) * 10 * 10) / 10;
      it.armorMax = Math.round(mx * 10);
    }
    it.dur10 = 1;
    return true;
  };
  I.mk = function(defOrName, over) {
    const d = typeof defOrName === "string" ? I.def(defOrName) : defOrName;
    if (!d) return null;
    const it = Object.assign({}, d, over || {});
    delete it.price;
    delete it.wt;
    delete it.odds;
    it.id = uid++;
    it.w = it.w || 1;
    it.h = it.h || 1;
    if (I.isStack(it)) it.n = I.qtyN(it.n);
    if (it.kind === "armor" || it.kind === "helmet") {
      if (it.armorMax == null) it.armorMax = it.armor;
      it.dur10 = 1;
    }
    if (it.kind === "gun" && it.wear == null) it.wear = 100;
    if ((it.kind === "bag" || it.kind === "rig") && !it.grid) it.grid = I.grid(it.cols, it.rows);
    if (it.grid) it.grid.owned = true;
    if (it.kind === "partbox" && !Array.isArray(it.box)) it.box = (SX.rollPartBox ? SX.rollPartBox(it.name) : []).map(n => I.dump(I.mk(n))).filter(Boolean);
    return it;
  };
  I.restore = function(o) {
    if (!o) return null;
    if (I.REMOVED.includes(o.name)) return null;
    o = I.migrate(o);
    const it = Object.assign({}, o);
    it.id = uid++;
    I.armorUp(it);
    if (it.kind === "melee") {
      const d0 = DEFS.get(it.name);
      if (d0 && d0.kind === "melee") for (const k of [ "dmg", "cool", "reach", "style" ]) if (d0[k] != null) it[k] = d0[k];
    }
    if (it.kind === "cure") {
      const d0 = DEFS.get(it.name);
      if (d0 && it.val !== d0.val) it.val = d0.val;
    }
    if (!it.kind) {
      const d0 = DEFS.get(it.name);
      if (d0 && d0.kind === "nvg") it.kind = "nvg";
      if (d0 && SX.VAL_FIX && SX.VAL_FIX[it.name]) it.val = d0.val;
    }
    if (o.grid) it.grid = I.gridFrom(o.grid); else if (it.kind === "bag" || it.kind === "rig") it.grid = I.grid(it.cols, it.rows);
    if (it.grid) it.grid.owned = true;
    I.foldFix(it);
    if (I.isStack(it)) it.n = I.qtyN(it.n);
    if (it.kind === "mag") {
      const d = DEFS.get(it.name);
      if (d && d.cap && it.cap !== d.cap) {
        it.cap = d.cap;
        it.val = d.val;
        it.ammo = Math.min(it.ammo || 0, d.cap);
      }
      if (d) I.setType(it, d.ammoType);
    }
    if (it.kind === "gun") I.setType(it, it.ammoType);
    if (it.kind === "gun" && o.mods) {
      it.mods = {};
      for (const s in o.mods) {
        const m = I.restore(o.mods[s]);
        if (m) it.mods[s] = m;
      }
      I.applyMods(it);
    }
    return it;
  };
  I.dump = function(it) {
    if (!it) return null;
    const o = Object.assign({}, it);
    delete o.id;
    if (it.grid) o.grid = I.gridDump(it.grid);
    if (it.folded && it.grid && it.grid.list.length) {
      const s = I.fullSize(it);
      o.w = s[0];
      o.h = s[1];
      delete o.folded;
    }
    if (it.mods) {
      o.mods = {};
      for (const s in it.mods) if (it.mods[s]) o.mods[s] = I.dump(it.mods[s]);
    }
    return o;
  };
  I.modsOf = g => g && g.mods ? SX.PART_SLOTS.map(s => g.mods[s]).filter(Boolean) : [];
  const FX1 = [ "mag", "reload", "bloom", "kick", "ads", "hip", "move", "rate", "noise", "flash", "choke", "look" ];
  I.gunFx = function(g) {
    const f = {
      fuzz: 0,
      quiet: false,
      scope: false,
      laser: false,
      kg: 0
    };
    for (const k of FX1) f[k] = 1;
    for (const m of I.modsOf(g)) {
      const d = SX.partDef(m), x = d.fx || {};
      for (const k of FX1) if (x[k] != null) f[k] *= x[k];
      if (x.quiet) f.quiet = true;
      if (x.scope) f.scope = true;
      if (x.laser) f.laser = true;
      f.fuzz = Math.max(f.fuzz, x.fuzz || 0);
      f.kg += d.kg || 0;
    }
    return f;
  };
  I.applyMods = function(g) {
    if (!g || g.kind !== "gun") return null;
    const b = DEFS.get(g.name) || g, f = I.gunFx(g);
    g.magSize = Math.max(1, Math.round((b.magSize || g.magSize || 1) * f.mag));
    g.reload = Math.round((b.reload || 1.3) * f.reload * 100) / 100;
    g.bloom = (b.bloom != null ? b.bloom : .026) * f.bloom;
    g.kick = (b.kick != null ? b.kick : 1.3) * f.kick;
    if (b.spread != null) g.spread = b.spread * (b.pellets ? f.choke : 1);
    g.quiet = !!b.quiet || f.quiet;
    g.scope = !!b.scope || f.scope;
    g.laser = f.laser;
    g.kg = Math.round(((b.kg || 3) + f.kg) * 100) / 100;
    g.fxAds = f.ads;
    g.fxHip = f.hip;
    g.fxMove = f.move;
    g.fxRate = f.rate;
    g.fxNoise = f.noise;
    g.fxFlash = f.flash;
    g.fxFuzz = f.fuzz;
    g.fxLook = f.look;
    const over = (g.ammo || 0) - g.magSize;
    if (over > 0 && I.MAGS[g.caliber]) {
      g.ammo = g.magSize;
      return I.mk(I.magFor(g.caliber, I.typeOf(g)), {
        ammo: over
      });
    }
    return null;
  };
  I.attach = function(g, part) {
    if (!SX.partFits(part, g)) return {
      ok: false
    };
    const slot = SX.partDef(part).slot;
    g.mods = g.mods || {};
    const old = g.mods[slot] || null;
    part.rot = false;
    g.mods[slot] = part;
    return {
      ok: true,
      old,
      spill: I.applyMods(g)
    };
  };
  I.detach = function(g, slot) {
    if (!g || !g.mods || !g.mods[slot]) return {
      part: null,
      spill: null
    };
    const part = g.mods[slot];
    delete g.mods[slot];
    if (!Object.keys(g.mods).length) delete g.mods;
    return {
      part,
      spill: I.applyMods(g)
    };
  };
  I.size = it => it.rot ? [ it.h, it.w ] : [ it.w, it.h ];
  I.foldSize = it => it && it.kind === "bag" && (SX.BAG_FOLD || {})[it.name] || null;
  I.fullSize = it => {
    const d = I.def(it.name);
    return d ? [ d.w || 1, d.h || 1 ] : [ it.w || 1, it.h || 1 ];
  };
  I.foldNo = function(it) {
    if (!it) return "접을 수 없는 물건입니다";
    if (!I.foldSize(it)) return it.kind === "rig" ? "리그 · 조끼는 접을 수 없습니다" : "접을 수 없는 물건입니다";
    if (it.grid && it.grid.list.length) return "안에 든 걸 먼저 빼 주십시오";
    return "";
  };
  I.fold = function(it) {
    if (!it || it.folded || I.foldNo(it)) return false;
    const f = I.foldSize(it);
    it.folded = 1;
    it.w = f[0];
    it.h = f[1];
    if (it.grid) it.grid.shut = true;
    return true;
  };
  I.unfold = function(it, g) {
    if (!it || !it.folded) return true;
    const e = g ? I.at(g, it) : null, f0 = [ it.w, it.h ], r0 = !!it.rot, s = I.fullSize(it);
    it.w = s[0];
    it.h = s[1];
    delete it.folded;
    if (e) {
      let spot = null;
      for (const rot of [ r0, !r0 ]) if (!spot && I.fits(g, it, e.x, e.y, rot)) spot = {
        x: e.x,
        y: e.y,
        rot
      };
      if (!spot) spot = I.findSpot(g, it);
      if (!spot) {
        it.w = f0[0];
        it.h = f0[1];
        it.folded = 1;
        it.rot = r0;
        return false;
      }
      e.x = spot.x;
      e.y = spot.y;
      it.rot = !!spot.rot;
    }
    if (it.grid) delete it.grid.shut;
    return true;
  };
  I.foldFix = function(it) {
    if (!it || !it.folded) return;
    const f = I.foldSize(it);
    if (f && !(it.grid && it.grid.list.length)) {
      it.folded = 1;
      it.w = f[0];
      it.h = f[1];
      if (it.grid) it.grid.shut = true;
      return;
    }
    const s = I.fullSize(it);
    it.w = s[0];
    it.h = s[1];
    delete it.folded;
    if (it.grid) delete it.grid.shut;
  };
  I.grid = (cols, rows) => ({
    cols,
    rows,
    list: []
  });
  I.gridDump = g => ({
    cols: g.cols,
    rows: g.rows,
    list: g.list.map(e => ({
      x: e.x,
      y: e.y,
      it: I.dump(e.it)
    }))
  });
  I.gridFrom = o => {
    const g = I.grid(o.cols, o.rows), old = [];
    for (const e of o.list || []) {
      const it = I.restore(e.it);
      if (it) {
        g.list.push({
          it,
          x: e.x,
          y: e.y
        });
        if (e.it && e.it.n == null && I.isStack(it)) old.push(it);
      }
    }
    if (old.length > 1) packOld(g, old);
    return g;
  };
  I.blockers = function(g, it, x, y, rot) {
    const w = rot ? it.h : it.w, h = rot ? it.w : it.h;
    if (g.shut) return null;
    if (x < 0 || y < 0 || x + w > g.cols || y + h > g.rows) return null;
    if (offHit(g, x, y, w, h)) return null;
    const hit = [];
    for (const e of g.list) {
      if (e.it === it) continue;
      const [ew, eh] = I.size(e.it);
      if (x < e.x + ew && x + w > e.x && y < e.y + eh && y + h > e.y && hit.indexOf(e.it) < 0) hit.push(e.it);
    }
    return hit;
  };
  I.at = (g, it) => g.list.find(e => e.it === it) || null;
  function offHit(g, x, y, w, h) {
    if (!g.off || !g.off.length) return false;
    for (const k of g.off) {
      const cx = k % g.cols, cy = Math.floor(k / g.cols);
      if (cx >= x && cx < x + w && cy >= y && cy < y + h) return true;
    }
    return false;
  }
  I.nestBlocked = (g, it) => !!(g && g.owned && it && it.grid && it.grid.list.length);
  I.fits = function(g, it, x, y, rot, ignore) {
    if (it.grid === g || I.nestBlocked(g, it) || g.shut) return false;
    const w = rot ? it.h : it.w, h = rot ? it.w : it.h;
    if (x < 0 || y < 0 || x + w > g.cols || y + h > g.rows) return false;
    if (offHit(g, x, y, w, h)) return false;
    for (const e of g.list) {
      if (e.it === it || e.it === ignore) continue;
      const [ew, eh] = I.size(e.it);
      if (x < e.x + ew && x + w > e.x && y < e.y + eh && y + h > e.y) return false;
    }
    return true;
  };
  I.findSpot = function(g, it) {
    for (const rot of it.w === it.h ? [ false ] : [ !!it.rot, !it.rot ]) for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) if (I.fits(g, it, x, y, rot)) return {
      x,
      y,
      rot
    };
    return null;
  };
  I.putGrow = function(g, it) {
    if (I.put(g, it)) return true;
    g.cols = Math.max(g.cols, it.w || 1);
    for (let k = 0; k < 40; k++) {
      if (I.put(g, it)) return true;
      g.rows++;
    }
    return false;
  };
  I.put = function(g, it, x, y, rot) {
    if (it && (it.grid === g || I.nestBlocked(g, it) || g.shut)) return false;
    if (x == null) {
      const s = I.findSpot(g, it);
      if (!s) return false;
      x = s.x;
      y = s.y;
      rot = s.rot;
    } else if (!I.fits(g, it, x, y, rot)) return false;
    if (g.shared && SX.coop) SX.coop.touch(g);
    I.take(g, it);
    it.rot = !!rot;
    g.list.push({
      it,
      x,
      y
    });
    return true;
  };
  I.take = function(g, it) {
    const k = g.list.findIndex(e => e.it === it);
    if (k < 0) return false;
    if (g.shared && SX.coop) SX.coop.touch(g);
    g.list.splice(k, 1);
    if (g.shared && SX.coop && SX.coop.tookOut) SX.coop.tookOut(g, it);
    return true;
  };
  I.has = (g, it) => g.list.some(e => e.it === it);
  I.cells = g => g.list.reduce((s, e) => s + e.it.w * e.it.h, 0);
  const KG = {
    gun: 3.2,
    melee: 1.4,
    armor: 6,
    helmet: 1.4,
    bag: 1.2,
    rig: 1.5,
    mag: .4,
    heal: .25,
    cure: .1,
    flare: .5,
    grenade: .6
  };
  I.weight = function(it) {
    if (!it) return 0;
    let w = KG[it.kind] != null ? KG[it.kind] : .15 * it.w * it.h + (/통|병|캔|항아리|벽돌|두꺼비|김치/.test(it.name) ? .6 : 0);
    if (it.kg != null) w = it.kg;
    if (I.isStack(it)) {
      const d = DEFS.get(it.name);
      w = (d.kg != null ? d.kg : w) * I.qty(it);
    }
    if (it.grid) for (const e of it.grid.list) w += I.weight(e.it);
    if (Array.isArray(it.box)) for (const o of it.box) w += I.weight(o);
    return Math.round(w * 100) / 100;
  };
  I.WEAR_PER_SHOT = .12;
  I.WEAR_JAM = 35;
  I.wearOf = it => it && it.wear != null ? it.wear : 100;
  I.gunFixCost = it => Math.round((100 - I.wearOf(it)) / 100 * (it.val || 1e4) * .4 / 100) * 100;
  I.armorFixCost = function(it) {
    if (!it || !it.armorMax || it.armor >= it.armorMax) return 0;
    return Math.max(300, Math.round((1 - it.armor / it.armorMax) * (it.val || 8e3) * .5 / 100) * 100);
  };
  I.owned = function(save, kit) {
    const out = [], seen = new Set;
    const walk = g => {
      for (const e of g.list) {
        if (seen.has(e.it)) continue;
        seen.add(e.it);
        out.push(e.it);
        if (e.it.grid) walk(e.it.grid);
      }
    };
    if (save && save.stash) walk(save.stash);
    if (kit) for (const it of I.kitAll(kit)) {
      if (seen.has(it)) continue;
      seen.add(it);
      out.push(it);
      if (it.grid) walk(it.grid);
    }
    return out;
  };
  I.gunsToFix = (save, kit) => I.owned(save, kit).filter(it => it.kind === "gun" && I.wearOf(it) < 99.5);
  I.armorToFix = (save, kit) => I.owned(save, kit).filter(it => (it.kind === "armor" || it.kind === "helmet") && it.armorMax && it.armor < it.armorMax);
  I.fixGun = it => {
    it.wear = 100;
  };
  I.fixArmor = function(it) {
    const old = it.armorMax;
    it.armorMax = Math.max(80, Math.round(it.armorMax * .9));
    it.armor = it.armorMax;
    it.val = Math.max(500, Math.round((it.val || 8e3) * .9));
    return old;
  };
  I.roundVal = (cal, at) => {
    const d = I.def(I.magFor(cal, at));
    return d && d.cap ? (d.val || 0) / d.cap : 0;
  };
  I.roundsValue = (cal, at, n, k) => {
    const d = I.def(I.magFor(cal, at));
    return d && d.cap ? (d.val || 0) * n * (k == null ? 1 : k) / d.cap : 0;
  };
  I.ammoValue = function(it, k) {
    if (!it) return 0;
    if (it.kind === "mag") {
      const d = I.def(it.name) || it, cap = d.cap || it.cap || 1, n = Math.max(0, Math.min(cap, it.ammo | 0)), cal = d.caliber || it.caliber, at = I.typeOf(d.name ? d : it);
      return I.roundVal(cal, at) ? I.roundsValue(cal, at, n, k) : (it.val || 0) * n * (k == null ? 1 : k) / cap;
    }
    if (it.kind === "gun") return I.roundsValue(it.caliber, I.typeOf(it), Math.max(0, it.ammo | 0), k);
    return 0;
  };
  I.sellValue = function(it, atMarket) {
    if (!it) return 0;
    if (it.story) return 0;
    let v = (it.val || 0) * I.qty(it) * .75 * (it.quest && atMarket ? I.QUEST_MUL : 1);
    if (it.kind === "mag") v = I.ammoValue(it, .75 * (it.quest && atMarket ? I.QUEST_MUL : 1));
    if ((it.kind === "armor" || it.kind === "helmet") && it.armorMax) v *= .35 + .65 * SX.clamp(it.armor / it.armorMax, 0, 1);
    if (it.kind === "gun") v *= .4 + .6 * SX.clamp(I.wearOf(it) / 100, 0, 1);
    if (it.kind === "gun" && (it.ammo | 0) > 0) v += I.ammoValue(it, .75);
    for (const m of I.modsOf(it)) v += I.sellValue(m, atMarket);
    if (Array.isArray(it.box)) for (const o of it.box) v += I.sellValue(o, atMarket);
    return Math.floor(v);
  };
  I.brokerBonus = function(it) {
    const T = SX.trade, s = SX.game && SX.game.save;
    if (!T || !s || !it || it.quest || it.story) return 0;
    return T.level(s, T.sellWho(it)).sell || 0;
  };
  I.brokerValue = function(it) {
    const v = I.sellValue(it, true), b = I.brokerBonus(it);
    return b ? Math.floor(v * (1 + b)) : v;
  };
  const ownKg = it => I.weight(Object.assign({}, it, {
    grid: null,
    box: null
  }));
  I.compareHtml = function(it, kit) {
    if (!it || !kit) return "";
    const slot = it.kind === "gun" ? kit.w1 ? "w1" : kit.w2 ? "w2" : null : {
      armor: "armor",
      helmet: "helmet",
      bag: "bag"
    }[it.kind];
    const cur = slot && kit[slot];
    if (!cur || cur === it || it.kind === "gun" && kit.w2 === it) return "";
    const out = [], rnd = (v, d) => {
      const k = Math.pow(10, d || 0);
      return Math.round(v * k) / k;
    };
    const F = {
      n: v => String(v),
      rd: v => v + "발",
      s: v => v + "초",
      pm: v => v + "/분",
      pc: v => v + "%",
      kg: v => v + "kg"
    };
    const row = (name, a, b, up, d, f, same) => {
      const df = rnd(a - b, d), fm = F[f || "n"];
      if (!df && same) return;
      out.push("<span class='ck'>" + name + "</span> <span class='cv'>" + fm(rnd(a, d)) + "</span>" + (df ? " <b class='" + ((up ? df > 0 : df < 0) ? "good" : "bad") + "'>" + (df > 0 ? "+" : "−") + fm(Math.abs(df)) + "</b>" : ""));
    };
    if (it.kind === "armor" || it.kind === "helmet") {
      const cl = x => +(x.cls || (I.def(x.name) || {}).cls || 0), sl = x => {
        const v = x.slow != null ? x.slow : (I.def(x.name) || {}).slow;
        return Math.round((+v || 0) * 100);
      };
      if (cl(it) || cl(cur)) row("방탄 등급", cl(it), cl(cur), true);
      row("내구", Math.round(it.armor || 0), Math.round(cur.armor || 0), true);
      row("걸음 느려짐", sl(it), sl(cur), false, 0, "pc", true);
      row("무게", ownKg(it), ownKg(cur), false, 2, "kg", true);
    } else if (it.kind === "gun") {
      const dm = x => (x.dmg || 0) * (x.pellets || 1), rpm = x => x.rof ? Math.round(60 / x.rof) : 0;
      row("피해", dm(it), dm(cur), true);
      row("연사", rpm(it), rpm(cur), true, 0, "pm");
      row("탄창", it.magSize || 0, cur.magSize || 0, true, 0, "rd");
      row("장전", +(it.reload || 1.3), +(cur.reload || 1.3), false, 1, "s", true);
      row("상태", Math.round(I.wearOf(it)), Math.round(I.wearOf(cur)), true, 0, "pc", true);
      row("무게", ownKg(it), ownKg(cur), false, 2, "kg", true);
    } else {
      row("칸", (it.cols || 0) * (it.rows || 0), (cur.cols || 0) * (cur.rows || 0), true);
      row("무게", ownKg(it), ownKg(cur), false, 2, "kg", true);
    }
    if (!out.length) return "";
    return "<div class='cmp'><span class='small dim'>지금 낀 것과 견주면</span> <span class='small cmpCur'>" + SX.esc(cur.name) + "</span><br>" + out.join(" · ") + "</div>";
  };
  I.rollStock = function() {
    const out = {};
    for (const st of D.stalls) out[st.id] = rollStall(st);
    return out;
  };
  const loyLv = id => SX.trade && SX.game && SX.game.save ? SX.trade.level(SX.game.save, id) : null;
  const opensAt = (id, name, lv) => !SX.trade || !SX.trade.NEED[id] || SX.trade.opens(id, name, lv || SX.trade.LV[0]);
  function rollStall(st) {
    const lv = loyLv(st.id);
    const pool = st.pool.filter(d => opensAt(st.id, d.name, lv) && (!(d.odds < 1) || Math.random() < d.odds));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    const n = Math.min(pool.length, (st.n || 3) + (Math.random() * 2 | 0) + (lv ? lv.slot : 0)), pick = pool.slice(0, n);
    if (st.id === "gun" && !pick.some(d => d.kind === "gun")) {
      const g = st.pool.filter(d => d.kind === "gun" && opensAt(st.id, d.name, lv)).sort((a, b) => (a.price || 0) - (b.price || 0))[0];
      if (g) pick[pick.length - 1] = g;
    }
    const rows = pick.map(d => ({
      name: d.name,
      price: Math.max(200, d.val || 0, Math.round(d.price * (.85 + Math.random() * .35) / 100) * 100),
      qty: 1 + (Math.random() * 2 | 0)
    }));
    return rows.concat(rollRare(st.id, lv, rows));
  }
  function rollRare(id, lv, have) {
    const T = SX.trade, L = T && T.RARE[id];
    if (!L || !lv || !lv.rare) return [];
    const n = Math.random() < lv.rare ? lv.rare >= 1 && Math.random() < .3 ? 2 : 1 : 0;
    const cand = L.filter(([nm]) => I.def(nm) && !(have || []).some(r => r.name === nm));
    for (let i = cand.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      const t = cand[i];
      cand[i] = cand[j];
      cand[j] = t;
    }
    return cand.slice(0, n).map(([nm, p]) => ({
      name: nm,
      price: Math.max(200, I.def(nm).val || 0, Math.round(p * (.85 + Math.random() * .35) / 100) * 100),
      qty: 1,
      rare: 1
    }));
  }
  I.rollDeal = () => ({
    seed: SX.trade ? SX.trade.newSeed() : 0,
    done: {},
    smug: rollRare("smuggle", loyLv("smuggle"), [])
  });
  I.dealOf = save => {
    if (!save.deal || typeof save.deal !== "object" || save.deal.seed == null) save.deal = I.rollDeal();
    if (!save.deal.done || typeof save.deal.done !== "object") save.deal.done = {};
    if (!Array.isArray(save.deal.smug)) save.deal.smug = [];
    return save.deal;
  };
  I.restock = function(save) {
    save.stock = I.rollStock();
    save.deal = I.rollDeal();
    if (SX.ui && SX.ui.wishArrive) SX.ui.wishArrive(save);
    I.saleNote(save);
  };
  I.salesOf = save => {
    const T = SX.trade;
    if (!T || !save) return [];
    const day = I.dealOf(save);
    return T.WHO.map(w => [ w, T.saleOf(day, w, T.level(save, w)) ]).filter(q => q[1] > 0);
  };
  I.saleNote = function(save) {
    const L = I.salesOf(save);
    if (L.length && SX.log) SX.log("🏷 오늘 할인합니다 — " + L.map(([w, k]) => SX.trade.NAME[w] + " −" + Math.round(k * 100) + "%").join(" · ") + "(좌판에 새 물건이 들어올 때까지)", "good");
    return L;
  };
  I.stockOf = function(save, id) {
    const lv = SX.trade && SX.trade.NEED[id] ? SX.trade.level(save, id) : null, ok = (name, rare) => !lv || SX.trade.opens(id, name, lv, rare);
    if (id === "smuggle") {
      const out = [];
      for (const r of I.dealOf(save).smug) {
        const d = I.def(r.name);
        if (d && r.qty > 0 && ok(r.name, true)) out.push({
          def: d,
          price: Math.max(r.price, d.val || 0),
          row: r
        });
      }
      return out;
    }
    const st = D.stalls.find(x => x.id === id);
    if (!st) return [];
    if (save.stock && !save.stock[id]) save.stock[id] = rollStall(st);
    const rows = save.stock && save.stock[id] || [];
    const out = [];
    for (const r of rows) {
      if (r.rare) {
        const d = I.def(r.name);
        if (d && r.qty > 0 && ok(r.name, true)) out.push({
          def: d,
          price: Math.max(r.price, d.val || 0),
          row: r
        });
        continue;
      }
      const d = st.pool.find(q => q.name === r.name);
      if (!d) continue;
      if (!(r.qty > 0) || !ok(r.name)) continue;
      const low = Math.max(200, d.val || 0, Math.round(d.price * .85 / 100) * 100);
      if (r.price < low) r.price = low;
      out.push({
        def: d,
        price: r.price,
        row: r
      });
    }
    if (id === "gun" && save.stock && !out.some(o => o.def.kind === "gun" && !o.row.rare)) {
      const d = st.pool.filter(q => q.kind === "gun" && ok(q.name)).sort((a, b) => (a.price || 0) - (b.price || 0))[0];
      if (d) {
        const price = Math.max(200, d.val || 0, Math.round(d.price / 100) * 100);
        let r = rows.find(q => q.name === d.name);
        if (r) {
          r.qty = 1;
          if (r.price < price) r.price = price;
        } else {
          r = {
            name: d.name,
            price,
            qty: 1
          };
          rows.push(r);
        }
        out.push({
          def: d,
          price: r.price,
          row: r
        });
      }
    }
    if (id === "ammo" && save.stock) {
      const feeds = (d, cal) => d.kind === "mag" && d.caliber === cal && !d.ammoType || d.kind === "ammo" && d.cal === cal;
      const k = save.kit || {}, cals = [ "9mm" ];
      for (const w of [ k.w1, k.w2 ]) if (w && w.kind === "gun" && w.caliber && cals.indexOf(w.caliber) < 0) cals.push(w.caliber);
      for (const cal of cals) {
        if (out.some(o => feeds(o.def, cal) && !o.row.rare)) continue;
        const d = st.pool.filter(q => feeds(q, cal) && ok(q.name)).sort((a, b) => (a.price || 0) - (b.price || 0))[0];
        if (!d) continue;
        const price = Math.max(200, d.val || 0, Math.round(d.price / 100) * 100);
        let r = rows.find(q => q.name === d.name);
        if (r) {
          r.qty = 1;
          if (r.price < price) r.price = price;
        } else {
          r = {
            name: d.name,
            price,
            qty: 1
          };
          rows.push(r);
        }
        out.push({
          def: d,
          price: r.price,
          row: r
        });
      }
    }
    return out;
  };
  const TABLE = D.items, TOTAL = TABLE.reduce((s, i) => s + i.wt, 0);
  function once(rng) {
    let r = rng.f() * TOTAL;
    for (const it of TABLE) {
      if ((r -= it.wt) <= 0) return it;
    }
    return TABLE[0];
  }
  I.rollItem = function(rng, ctx) {
    const b = ctx.building;
    const bonus = Math.max(0, Math.round(((b ? b.loot : 1) - 1) * 2));
    const hot = ctx.intel && ctx.intel.building === b.id && ctx.intel.hotFloor === ctx.floor ? 2 : 0;
    const tries = 1 + Math.min(3, Math.round(Math.max(0, ctx.floor) * .6) + bonus + hot);
    let res;
    if (tries > 1 && rng.f() < .55) {
      let best = null;
      for (let i = 0; i < tries; i++) {
        const it = once(rng);
        if (!best || it.val > best.val) best = it;
      }
      res = best;
    } else res = once(rng);
    {
      const wb = I.wkBoost || 0;
      if (wb && rng.f() < wb) {
        const c = once(rng);
        if (c.val > res.val) res = c;
      }
    }
    const p = b && b.cheap || 0;
    if (p && rng.f() < p) {
      const c = once(rng);
      if (c.val < res.val) res = c;
    }
    return I.mk(res);
  };
  const SPEC_TOTAL = D.specials.reduce((s, i) => s + (i.wt || 1), 0);
  I.rollSpecial = function(rng) {
    let r = rng.f() * SPEC_TOTAL;
    for (const it of D.specials) {
      if ((r -= it.wt || 1) <= 0) return I.mk(it);
    }
    return I.mk(D.specials[0]);
  };
  const FOOD = SX.LOOT_FOOD, OFFICE = SX.LOOT_OFFICE;
  I.AIRDROP = [ {
    guns: [ "사제 기관단총", "K5 권총", ".38 리볼버", "엽총" ],
    mags: 2,
    meds: [ "붕대", "붕대", "진통제", "구급킷" ],
    nMed: 2,
    parts: 0,
    nade: 0,
    armor: 2,
    val: [ "손목시계", "금목걸이" ],
    nVal: 1
  }, {
    guns: [ "M16A1 소총", "K1A 기관단총", "사제 사냥총", "K7 소음기관단총" ],
    mags: 3,
    meds: [ "구급킷", "지혈대", "진통 주사기", "진통제" ],
    nMed: 2,
    parts: 1,
    nade: 1,
    armor: 3,
    val: [ "금목걸이", "손목시계", "노트북" ],
    nVal: 1
  }, {
    guns: [ "K2 소총", "K2C1 소총", "K7 소음기관단총", "USAS-12 산탄총" ],
    mags: 3,
    meds: [ "구급킷", "진통 주사기", "항생제", "지혈대" ],
    nMed: 3,
    parts: 2,
    nade: 2,
    armor: 4,
    val: [ "금두꺼비", "금목걸이", "산삼 뿌리" ],
    nVal: 1
  }, {
    guns: [ "K3 기관총", "K14 저격소총", "K2C1 소총", "USAS-12 산탄총" ],
    mags: 4,
    meds: [ "구급킷", "진통 주사기", "항생제", "구급킷" ],
    nMed: 3,
    parts: 3,
    nade: 3,
    armor: 4,
    val: [ "금두꺼비", "금괴", "명품 손목시계" ],
    nVal: 2
  } ];
  I.rollAirdrop = function(rng, diff) {
    const T = I.AIRDROP[Math.max(1, Math.min(4, diff | 0)) - 1], out = [];
    const g = I.mk(rng.pick(T.guns));
    if (g) {
      g.ammo = 0;
      g.wear = 70 + rng.i(30);
      out.push(g);
      const mn = I.MAGS && I.MAGS[g.caliber];
      for (let k = 0; k < T.mags; k++) {
        const m = mn && I.mk(mn);
        if (m) {
          m.ammo = Math.max(1, Math.round(m.cap * (.7 + rng.f() * .3)));
          out.push(m);
        }
      }
    }
    for (let k = 0; k < T.nMed; k++) out.push(I.mk(rng.pick(T.meds)));
    for (let k = 0; k < T.parts; k++) out.push(I.mk(rng.pick(D.parts).name));
    for (let k = 0; k < T.nade; k++) out.push(I.mk(k === 1 ? "섬광탄" : k === 2 ? TAC_NADES[1 + out.length % 2] : "수류탄"));
    for (let k = 0; k < T.nVal; k++) out.push(I.mk(rng.pick(T.val)));
    const an = SX.pickArmor(rng, "armor", T.armor), ad = I.def(an);
    if (ad) out.push(I.mk(an, {
      armor: Math.round(ad.armor * (.85 + rng.f() * .15))
    }));
    if (diff >= 2) {
      const hn = SX.pickArmor(rng, "helmet", T.armor), hd = I.def(hn);
      if (hd) out.push(I.mk(hn, {
        armor: Math.round(hd.armor * (.85 + rng.f() * .15))
      }));
    }
    typeLoot(out, 41, {
      id: "",
      diff: diff >= 3 ? 3 : 1
    }, diff >= 3);
    return out.filter(Boolean);
  };
  I.rollContainer = function(rng, type, ctx) {
    const out = [];
    const b = ctx.building || {};
    if (type === "armory") {
      const diff = b.diff || 4;
      if (rng.f() < .45) {
        const g = I.mk(rng.pick([ "K2 소총", "K2 소총", "K2C1 소총", "K1A 기관단총", "K3 기관총", "K14 저격소총", "K5 권총" ]));
        if (g) {
          g.ammo = 0;
          g.wear = 55 + rng.i(40);
          out.push(g);
        }
      }
      for (let k = 0, n = 1 + rng.i(2); k < n; k++) {
        const m = I.mk(rng.pick([ "5.56mm 탄창", "5.56mm 탄창", "7.62mm 탄창", "9mm 탄창" ]));
        if (m) {
          m.ammo = Math.max(1, Math.round(m.cap * (.5 + rng.f() * .5)));
          out.push(m);
        }
      }
      if (rng.f() < .3) {
        const n = SX.pickArmor(rng, "armor", diff), d = I.def(n);
        out.push(I.mk(n, {
          armor: Math.round((d ? d.armor : 45) * (.6 + rng.f() * .4))
        }));
      }
      if (rng.f() < .22) {
        const n = SX.pickArmor(rng, "helmet", diff), d = I.def(n);
        out.push(I.mk(n, {
          armor: Math.round((d ? d.armor : 35) * (.6 + rng.f() * .4))
        }));
      }
      if (rng.f() < .25) out.push(I.mk("수류탄"));
      if (rng.f() < .25) out.push(I.mk(rng.pick(D.parts).name));
      {
        const tr = extraRng(out, 11);
        if (tr.f() < .33) out.push(I.mk(tr.pick(TAC_NADES)));
      }
      {
        const tr = extraRng(out, 13);
        if (tr.f() < .3) out.push(I.mk(tr.pick(TRAP_KITS)));
      }
      typeLoot(out, 17, b, true);
      facLoot(out, type, b, ctx);
      return out.filter(Boolean);
    }
    for (const q of SX.QUEST_LOOT || []) if (q.b === b.id && q.cont.indexOf(type) >= 0 && rng.f() < q.p) out.push(I.mk(q.name));
    if ((type === "locker" || type === "cabinet") && SX.pickArmor && rng.f() < .02 + (b.diff || 1) * .012) {
      const kind = rng.f() < .6 ? "armor" : "helmet", n = SX.pickArmor(rng, kind, b.diff || 1), d = I.def(n);
      out.push(I.mk(n, {
        armor: Math.round((d ? d.armor : 30) * (.4 + rng.f() * .5))
      }));
    }
    const n = {
      crate: 2 + rng.i(3),
      cabinet: 1 + rng.i(3),
      locker: 1 + rng.i(2),
      fridge: 1 + rng.i(3),
      shelf: 1 + rng.i(3),
      medcab: 1 + rng.i(2),
      desk: rng.i(2),
      trash: rng.i(2),
      bag: 1 + rng.i(2)
    }[type] || 1;
    for (let k = 0; k < n; k++) {
      if (type === "fridge") out.push(I.mk(rng.pick(FOOD))); else if (type === "medcab") out.push(rng.f() < .7 ? I.rollSpecial(rng) : I.rollItem(rng, ctx)); else if (type === "desk" && rng.f() < .5) out.push(I.mk(rng.pick(OFFICE))); else if (rng.f() < (b.special || .17) * (type === "crate" ? 1.3 : .8)) out.push(I.rollSpecial(rng)); else out.push(I.rollItem(rng, ctx));
    }
    if (type === "locker" && rng.f() < .25) {
      const big = (b.diff || 1) >= 3 && rng.f() < .15;
      out.push(I.mk(rng.pick(D.containers.filter(c => c.val <= (big ? 7e4 : 45e3))).name));
    }
    if (type === "crate" && rng.f() < .12 + (b.diff || 1) * .03) {
      const m = I.mk(rng.pick([ "9mm 탄창", "9mm 탄창", "5.56mm 탄창", "12게이지 탄", "7.62mm 탄창" ]));
      if (m) {
        m.ammo = Math.max(1, Math.round(m.cap * (.4 + rng.f() * .6)));
        out.push(m);
      }
    }
    if ((type === "crate" || type === "locker") && rng.f() < .04 + (b.diff || 1) * .025) out.push(I.mk(rng.pick(D.parts).name));
    if (type === "crate" && rng.f() < .05 * (b.diff || 1)) out.push(I.mk("수류탄"));
    if (type === "crate" && (b.diff || 1) >= 2) {
      const tr = extraRng(out, 23 + (ctx.floor | 0));
      if (tr.f() < .04 * (b.diff || 1)) out.push(I.mk(tr.pick(TAC_NADES)));
    }
    if (type === "crate") {
      const tr = extraRng(out, 29 + (ctx.floor | 0));
      if (tr.f() < .025 * (b.diff || 1)) out.push(I.mk(tr.pick(TRAP_KITS)));
    }
    if (type === "locker") {
      const tr = extraRng(out, 31 + (ctx.floor | 0));
      if (tr.f() < .03) out.push(I.mk(tr.f() < .7 ? "곰덫" : "인계철선 키트"));
    }
    typeLoot(out, 43 + (ctx.floor | 0), b, false);
    facLoot(out, type, b, ctx);
    return out.filter(Boolean);
  };
  function facLoot(out, type, b, ctx) {
    const T = SX.FAC_LOOT;
    if (!T || !T.length || b.train) return;
    const n = ctx ? ctx._fac = (ctx._fac | 0) + 1 : 0, tr = extraRng(out, 53 + ((ctx && ctx.floor) | 0) * 977 + n * 131), dk = Math.max(1, Math.min(4, b.diff | 0 || 1)) - 1;
    for (const q of T) {
      const p = q.c && q.c[type] || 0;
      if (!p) continue;
      const m = (q.b && q.b[b.id] != null ? q.b[b.id] : 1) * (q.d ? q.d[dk] : 1);
      if (tr.f() < p * m) out.push(I.mk(q.name));
    }
  }
  const TAC_NADES = [ "섬광탄", "최루탄", "연막탄", "화염병" ];
  const TRAP_KITS = [ "인계철선 키트", "곰덫" ];
  const KEY_P = {
    desk: 7e-4,
    locker: 7e-4,
    cabinet: 6e-4,
    crate: 5e-4
  };
  I.KEY_P = KEY_P;
  I.KEY_SCAV = .004;
  function extraRng(out, salt) {
    return new SX.Rng(SX.hash(out.map(o => o && o.name || "").join("|")) + salt * 7919 >>> 0);
  }
  I.enemyDrop = function(rng, e, ctx, headshot) {
    const out = [];
    if (e.named && e.namedDrop) {
      out.push(I.mk(e.namedDrop));
      if (e.type === "zombie") {
        out.push(I.mk("감염체 조직"), I.mk("감염체 조직"), I.rollSpecial(rng));
        return out.filter(Boolean);
      }
    }
    if (e.variant === "dog") return rng.f() < .4 ? [ I.mk("감염체 조직") ] : [];
    if (e.variant === "brute") {
      out.push(I.mk("감염체 조직"), I.mk("감염체 조직"));
      for (let k = 0; k < 2; k++) out.push(I.rollItem(rng, ctx));
      return out.filter(Boolean);
    }
    if (e.type === "scav") {
      for (const it of e.items || []) out.push(it);
      const eat = e.armed && SX.actors && SX.actors.enemyAmmo ? SX.actors.enemyAmmo(e) : "";
      if (e.armed && !e.boss && !e.named && rng.f() >= .6) {
        const g0 = I.def(e.gun || SX.ENEMY_GUNS.pistol[0]);
        const m = g0 && I.MAGS[g0.caliber] ? I.mk(I.magFor(g0.caliber, eat)) : null;
        if (m) {
          m.ammo = Math.max(1, Math.round(m.cap * (.1 + rng.f() * .3)));
          out.push(m);
        }
      } else if (e.armed) {
        const rifle = rng.f() < .25, g = I.mk(e.gun || rng.pick(SX.ENEMY_GUNS[rifle ? "rifle" : "pistol"]));
        g.ammo = Math.min(g.magSize, Math.max(1, Math.ceil(g.magSize * (.1 + rng.f() * .3))));
        g.wear = e.boss ? 5 + rng.i(15) : 15 + rng.i(35);
        for (const n of e.gunMods || []) {
          const m = I.mk(n);
          if (m) I.attach(g, m);
        }
        if (g.ammo > g.magSize) g.ammo = g.magSize;
        I.setType(g, eat);
        out.push(g);
        if (rng.f() < (e.boss ? 1 : .6)) {
          const m = I.mk(I.MAGS[g.caliber] ? I.magFor(g.caliber, eat) : "9mm 탄창");
          if (m && !e.boss) m.ammo = Math.max(1, Math.round(m.cap * (.35 + rng.f() * .65)));
          if (m) out.push(m);
        }
      }
      if (e.hasArmor && !e.boss && (headshot || rng.f() < .25)) {
        const n = SX.pickArmor ? SX.pickArmor(rng, "armor", ctx && ctx.building && ctx.building.diff || 2) : "방탄조끼", d = I.def(n);
        out.push(I.mk(n, {
          armor: Math.max(5, Math.round((d ? d.armor : 45) * (.3 + rng.f() * .45)))
        }));
      }
      if (rng.f() < .06) out.push(I.mk("수류탄"));
      const big = !!(e.boss || e.named);
      let gad = false;
      {
        const tr = extraRng(out, 37 + (e.nid | 0));
        if (tr.f() < (big ? .5 : .06)) {
          out.push(I.mk(tr.pick(TAC_NADES)));
          gad = true;
        }
      }
      {
        const tr = extraRng(out, 41 + (e.nid | 0));
        if (!(big && gad) && tr.f() < (big ? .5 : .03)) out.push(I.mk(tr.pick(TRAP_KITS)));
      }
      {
        const b = ctx && ctx.building || {}, tr = extraRng(out, 71 + (e.nid | 0));
        if (SX.vault && !b.train && tr.f() < (e.boss || e.named ? .1 : I.KEY_SCAV)) {
          const k = SX.vault.pickKey(tr, b.id);
          if (k) out.push(I.mk(k));
        }
      }
    } else {
      out.push(I.mk("감염체 조직"));
      if (rng.f() < .5) out.push(I.rollItem(rng, ctx));
    }
    return out.filter(Boolean);
  };
  I.SLOTS = [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig", "nvg" ];
  I.newKit = function() {
    return {
      w1: null,
      w2: null,
      melee: I.mk("식칼"),
      armor: null,
      helmet: null,
      bag: I.mk(D.defBag),
      rig: I.mk("기본 리그"),
      nvg: null,
      quick: I.quickNew()
    };
  };
  I.starterKit = function() {
    const k = I.newKit();
    k.w1 = I.mk("사제 파이프 권총");
    const m0 = I.mk("9mm 탄창");
    m0.ammo = 12;
    I.put(k.rig.grid, m0);
    I.put(k.rig.grid, I.mk("붕대"));
    k.quick[0] = k.rig.grid.list[1].it.id;
    return k;
  };
  I.kitDump = k => ({
    w1: I.dump(k.w1),
    w2: I.dump(k.w2),
    melee: I.dump(k.melee),
    armor: I.dump(k.armor),
    helmet: I.dump(k.helmet),
    bag: I.dump(k.bag),
    rig: I.dump(k.rig),
    nvg: I.dump(k.nvg),
    quick: k.quick.map(id => {
      const it = id && I.kitFind(k, id);
      return it ? I.kitPath(k, it) : null;
    })
  });
  I.kitFrom = function(o) {
    if (!o) return I.newKit();
    const k = {
      w1: I.restore(o.w1),
      w2: I.restore(o.w2),
      melee: I.restore(o.melee),
      armor: I.restore(o.armor),
      helmet: I.restore(o.helmet),
      bag: I.restore(o.bag),
      rig: I.restore(o.rig),
      nvg: I.restore(o.nvg),
      quick: I.quickNew()
    };
    if (k.bag && k.bag.folded) I.unfold(k.bag);
    (o.quick || []).forEach((p, i) => {
      if (p) {
        const g = p.c === "rig" ? k.rig && k.rig.grid : k.bag && k.bag.grid;
        const e = g && g.list.find(e => e.x === p.x && e.y === p.y);
        if (e) k.quick[i] = e.it.id;
      }
    });
    return k;
  };
  I.kitGrids = k => [ k.rig && k.rig.grid, k.bag && k.bag.grid ].filter(Boolean);
  I.kitFind = function(k, id) {
    for (const g of I.kitGrids(k)) {
      const e = g.list.find(e => e.it.id === id);
      if (e) return e.it;
    }
    return null;
  };
  I.kitPath = function(k, it) {
    for (const c of [ "rig", "bag" ]) {
      const g = k[c] && k[c].grid;
      const e = g && g.list.find(e => e.it === it);
      if (e) return {
        c,
        x: e.x,
        y: e.y
      };
    }
    return null;
  };
  I.kitTake = function(k, it) {
    for (const s of I.SLOTS) if (k[s] === it) {
      k[s] = null;
      return true;
    }
    for (const g of I.kitGrids(k)) if (I.take(g, it)) {
      k.quick = k.quick.map(q => q === it.id ? null : q);
      return true;
    }
    return false;
  };
  I.RIG_KINDS = [ "heal", "mag", "cure", "grenade", "flare" ];
  I.toRig = it => !!it && I.RIG_KINDS.indexOf(it.kind) >= 0;
  I.kitStow = function(k, it) {
    if (it.kind === "mag" && I.topUpMag(k, it)) return true;
    if (I.isStack(it)) for (const g of [ k.bag && k.bag.grid, k.rig && k.rig.grid ]) {
      const r = I.fillSame(g, it);
      if (r.moved && !r.left) return true;
    }
    if (I.toRig(it)) {
      if (k.rig && I.put(k.rig.grid, it)) return true;
      if (k.bag && I.put(k.bag.grid, it)) return true;
      return false;
    }
    if (k.bag && I.put(k.bag.grid, it)) return true;
    if (k.rig && I.put(k.rig.grid, it)) return true;
    return false;
  };
  I.kitAll = function(k) {
    const out = [];
    for (const s of I.SLOTS) if (k[s]) out.push(k[s]);
    for (const g of I.kitGrids(k)) for (const e of g.list) out.push(e.it);
    return out;
  };
  I.findInKit = function(k, name) {
    for (const g of I.kitGrids(k)) {
      const e = g.list.find(q => q.it.name === name);
      if (e) return {
        grid: g,
        it: e.it
      };
    }
    return null;
  };
  I.kitWeight = k => Math.round(I.SLOTS.reduce((s, n) => s + I.weight(k[n]), 0) * 100) / 100;
  I.kitValue = k => I.kitAll(k).reduce((s, it) => s + (it.val || 0) * I.qty(it) + I.modsOf(it).reduce((a, m) => a + (m.val || 0), 0), 0);
  I.slotAccepts = function(slot, it) {
    if (!it) return false;
    if (slot === "w1" || slot === "w2") return it.kind === "gun";
    if (slot === "melee") return it.kind === "melee";
    if (slot === "armor") return it.kind === "armor";
    if (slot === "helmet") return it.kind === "helmet";
    if (slot === "bag") return it.kind === "bag";
    if (slot === "rig") return it.kind === "rig";
    if (slot === "nvg") return it.kind === "nvg";
    return false;
  };
  I.armorBlocks = c => c >= 6 ? "무엇이든" : [ "근접", "권총탄·산탄", "파편", "5.56 소총탄", "7.62 저격탄" ].slice(0, c).join("·");
  I.SLOT_NAMES = {
    w1: "주무기",
    w2: "보조무기",
    melee: "근접",
    armor: "방탄복",
    helmet: "방탄모",
    bag: "가방",
    rig: "리그",
    nvg: "투시경"
  };
  const magKey = m => m.caliber + "|" + (m.cap || m.magSize || 0) + "|" + I.typeOf(m);
  const pendM = m => !!(SX.coop && SX.coop.pending && SX.coop.pending(m));
  I.mergeMags = function(list) {
    const drained = [], by = new Map;
    for (const m of list) {
      if (!(m.ammo > 0) || m.split || pendM(m)) continue;
      const k = magKey(m);
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(m);
    }
    for (const arr of by.values()) {
      const cap = arr[0].cap || arr[0].magSize || 0;
      if (!cap) continue;
      arr.sort((a, b) => b.ammo - a.ammo);
      let i = 0, j = arr.length - 1;
      while (i < j) {
        const dst = arr[i], src = arr[j];
        if (dst.ammo >= cap) {
          i++;
          continue;
        }
        if (src.ammo <= 0) {
          j--;
          continue;
        }
        const take = Math.min(cap - dst.ammo, src.ammo);
        dst.ammo += take;
        src.ammo -= take;
        if (src.ammo <= 0) {
          if (!src.nb && dst.nb) {
            delete dst.nb;
            src.nb = 1;
          }
          drained.push(src);
          j--;
        }
      }
    }
    return drained;
  };
  I.consolidateGrid = function(g) {
    if (!g) return 0;
    let n = 0;
    for (const m of I.mergeMags(g.list.map(e => e.it).filter(it => it.kind === "mag"))) if (I.take(g, m)) n++;
    return n;
  };
  I.consolidateKit = function(k) {
    const mags = [], owner = new Map;
    for (const g of I.kitGrids(k)) for (const e of g.list) if (e.it.kind === "mag") {
      mags.push(e.it);
      owner.set(e.it, g);
    }
    let n = 0;
    for (const m of I.mergeMags(mags)) if (I.take(owner.get(m), m)) n++;
    return n;
  };
  I.topUpMag = function(k, it) {
    if (!it || it.kind !== "mag" || !(it.ammo > 0) || pendM(it)) return false;
    const cap = it.cap || it.magSize || 0;
    if (!cap) return false;
    for (const g of I.kitGrids(k)) for (const e of g.list) {
      const m = e.it;
      if (m === it || m.kind !== "mag" || pendM(m) || m.caliber !== it.caliber || (m.cap || m.magSize || 0) !== cap || I.typeOf(m) !== I.typeOf(it)) continue;
      const room = cap - (m.ammo || 0);
      if (room <= 0) continue;
      const move = Math.min(room, it.ammo);
      m.ammo += move;
      it.ammo -= move;
      if (it.ammo <= 0) return true;
    }
    return false;
  };
  I.reloadPlan = function(k, g, activeSlot) {
    const need = (g.magSize || 0) - (g.ammo || 0);
    if (need <= 0) return null;
    const cur = (g.ammo || 0) > 0 ? I.typeOf(g) : null;
    const mags = (grid, t) => grid ? grid.list.map(e => e.it).filter(it => it.kind === "mag" && it.caliber === g.caliber && it.ammo > 0 && I.typeOf(it) === t && !pendM(it)).sort((a, b) => a.ammo - b.ammo) : [];
    const take = (list, n) => {
      let left = n;
      const out = [];
      for (const m of list) {
        if (left <= 0) break;
        out.push(m);
        left -= m.ammo;
      }
      return out;
    };
    const plan = (t, n) => {
      let src = take(mags(k.rig && k.rig.grid, t), n);
      if (src.length) return {
        srcs: src,
        mult: 1,
        mag: true,
        at: t
      };
      src = take(mags(k.bag && k.bag.grid, t), n);
      if (src.length) return {
        srcs: src,
        mult: 2,
        mag: true,
        at: t
      };
      for (const s of [ "w1", "w2" ]) if (s !== activeSlot && k[s] && k[s].kind === "gun" && k[s] !== g && k[s].caliber === g.caliber && (k[s].ammo || 0) > 0 && I.typeOf(k[s]) === t) return {
        srcs: [ k[s] ],
        mult: 3,
        mag: false,
        at: t
      };
      return null;
    };
    for (const t of [ cur != null ? cur : I.typeOf(g), "", "hp", "ap" ].filter((t, i, a) => a.indexOf(t) === i)) {
      const p = plan(t, cur != null && t !== cur ? g.magSize || 0 : need);
      if (!p) continue;
      if (cur != null && t !== cur) p.swap = true;
      return p;
    }
    return null;
  };
  I.doReload = function(k, g, plan) {
    if (plan.inf) {
      const t = Math.max(0, (g.magSize || 0) - (g.ammo || 0));
      g.ammo = g.magSize;
      return t;
    }
    const ej = plan.swap && (g.ammo | 0) > 0 && I.typeOf(g) !== plan.at ? I.unloadGun(g) : [];
    if (plan.at != null && !((g.ammo | 0) > 0)) I.setType(g, plan.at);
    let got = 0;
    for (const m of plan.srcs) {
      const room = g.magSize - (g.ammo || 0);
      if (room <= 0) break;
      const still = plan.mag ? I.kitFind(k, m.id) : k.w1 === m || k.w2 === m;
      if (!still || !(m.ammo > 0) || I.typeOf(m) !== I.typeOf(g)) continue;
      const t = Math.min(room, m.ammo);
      g.ammo = (g.ammo || 0) + t;
      m.ammo -= t;
      got += t;
      if (plan.mag && m.ammo <= 0) I.kitTake(k, m);
    }
    for (const m of ej) if (!I.kitStow(k, m)) (plan.left || (plan.left = [])).push(m);
    return got;
  };
  I.ammoSource = function(k, cal, activeSlot) {
    const pick = g => g && g.list.map(e => e.it).filter(it => it.kind === "mag" && it.caliber === cal && it.ammo > 0).sort((a, b) => b.ammo - a.ammo)[0];
    let m = k.rig && pick(k.rig.grid);
    if (m) return {
      it: m,
      mult: 1,
      mag: true
    };
    m = k.bag && pick(k.bag.grid);
    if (m) return {
      it: m,
      mult: 2,
      mag: true
    };
    for (const s of [ "w1", "w2" ]) if (s !== activeSlot && k[s] && k[s].kind === "gun" && k[s].caliber === cal && (k[s].ammo || 0) > 0) return {
      it: k[s],
      mult: 3,
      mag: false
    };
    return null;
  };
  I.pourInto = function(dst, src) {
    if (!dst || !src || src.kind !== "mag" || !(src.ammo > 0)) return [ 0, false ];
    const cap = dst.kind === "gun" ? dst.magSize : dst.cap || dst.magSize || 0;
    if (!cap || dst.caliber !== src.caliber) return [ 0, false ];
    const st = I.typeOf(src);
    if (dst.kind !== "gun" && I.typeOf(dst) !== st) return [ 0, false ];
    const out = dst.kind === "gun" && (dst.ammo | 0) > 0 && I.typeOf(dst) !== st ? I.unloadGun(dst) : null;
    if (dst.kind === "gun") I.setType(dst, st);
    const take = Math.min(cap - (dst.ammo || 0), src.ammo);
    if (take <= 0) return [ 0, false ];
    dst.ammo = (dst.ammo || 0) + take;
    src.ammo -= take;
    delete dst.split;
    delete src.split;
    if (src.ammo <= 0 && dst.kind === "mag" && !src.nb && dst.nb) {
      delete dst.nb;
      src.nb = 1;
    }
    return [ take, src.ammo <= 0, out ];
  };
  I.splitMag = function(it) {
    if (!it || it.kind !== "mag" || (it.ammo | 0) < 2) return null;
    const half = Math.floor(it.ammo / 2), m = I.mk(it.name, {
      ammo: half
    });
    if (!m) return null;
    m.ammo = half;
    it.ammo -= half;
    it.split = 1;
    m.split = 1;
    m.nb = 1;
    return m;
  };
  I.openPartBox = function(g, box) {
    if (!g || !box || box.kind !== "partbox") return {
      ok: false,
      msg: "파츠 상자가 아닙니다"
    };
    const keep = g.list.slice();
    if (!I.take(g, box)) return {
      ok: false,
      msg: "상자를 못 찾았습니다"
    };
    const parts = (box.box || []).map(o => I.restore(o)).filter(Boolean);
    for (const p of parts) if (!I.put(g, p)) {
      g.list = keep;
      return {
        ok: false,
        msg: "열 자리가 모자랍니다 — 칸을 비워 주십시오(파츠 " + parts.length + "개)"
      };
    }
    return {
      ok: true,
      parts,
      msg: box.name + " — " + parts.map(p => p.name).join(" · ")
    };
  };
  I.boxAmmo = function(g) {
    const out = {
      boxes: 0,
      mags: 0,
      fail: []
    };
    if (!g) return out;
    for (const cal of Object.keys(SX.AMMO_BOX || {})) for (const at of [ "", "ap", "hp" ]) {
      const bd = I.def(I.magFor(cal, at, true));
      if (!bd || I.typeOf(bd) !== at) continue;
      const mags = g.list.map(e => e.it).filter(m => m.kind === "mag" && m.caliber === cal && m.ammo > 0 && I.typeOf(m) === at);
      const total = mags.reduce((s, m) => s + m.ammo, 0);
      if (!total) continue;
      const need = Math.ceil(total / bd.cap);
      if (mags.length <= need && mags.every(m => m.name === bd.name)) continue;
      const keep = g.list.slice();
      for (const m of mags) I.take(g, m);
      let left = total, ok = true, n = 0;
      for (let k = 0; k < need; k++) {
        const b = I.mk(bd.name);
        b.ammo = Math.min(bd.cap, left);
        left -= b.ammo;
        if (!I.put(g, b)) {
          ok = false;
          break;
        }
        n++;
      }
      if (!ok) {
        g.list = keep;
        out.fail.push(at ? cal + " " + I.typeName(cal, at) : cal);
        continue;
      }
      out.boxes += n;
      out.mags += mags.length;
    }
    return out;
  };
  I.medLines = function(d) {
    const L = [];
    if (d.heal) L.push("체력 +" + d.heal);
    if (d.hot) L.push("체력 +" + d.hot + "(" + d.dur + "초에 걸쳐)");
    if (d.bonus) L.push("최대 체력 +" + d.bonus + "(" + Math.round((d.bonusT || 180) / 60) + "분)");
    if (d.stop === "H") L.push("모든 출혈 멈춤"); else if (d.stop === "L") L.push("가벼운 출혈 멈춤");
    if (d.stam) L.push("기력 가득" + (d.stam >= 30 ? " · 달리기 기력 절반 " + d.stam + "초" : ""));
    return L;
  };
  I.bestMag = function(k, caliber) {
    let best = null, bg = null;
    for (const g of I.kitGrids(k)) for (const e of g.list) {
      const it = e.it;
      if (it.kind === "mag" && it.caliber === caliber && it.ammo > 0 && (!best || it.ammo > best.ammo)) {
        best = it;
        bg = g;
      }
    }
    return best ? {
      it: best,
      grid: bg
    } : null;
  };
  I.ammoCount = function(k, caliber, at) {
    let n = 0;
    for (const g of I.kitGrids(k)) for (const e of g.list) if (e.it.kind === "mag" && e.it.caliber === caliber && (at == null || I.typeOf(e.it) === at)) n += e.it.ammo || 0;
    return n;
  };
  const tS = v => {
    v = Math.round(v * 10) / 10;
    if (v < 60) return v + "초";
    const m = Math.floor(v / 60), r = Math.round(v - m * 60);
    return r ? m + "분 " + r + "초" : m + "분";
  };
  const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v);
  const pc = m => Math.round(Math.abs(1 - m) * 100) + "%";
  const THREATS = [ [ "근접", 1 ], [ "9mm·산탄", 2 ], [ "폭발", 3 ], [ "5.56mm", 4 ], [ "7.62mm", 5 ] ];
  function typeLines(cal, at) {
    const A = SX.actors, T = (SX.AMMO_TYPES || {})[at], out = [];
    if (!A || !A.penOf) return out;
    const pct = v => Math.round(v * 100) + "%", ar = (a, b) => at ? a + " → " + b : b;
    const p0 = A.penOf(cal, ""), p = A.penOf(cal, at), cs = pp => pp >= 6 ? "6등급 방탄만 막습니다" : pp <= 1 ? "1등급(방검복)부터 모든 방탄이 막습니다" : pp + "등급 이상 방탄이 막습니다";
    if (T && T.dmg > 1) out.push("방탄이 없는 곳(맨몸 · 감염체 · 들개) 피해 " + pct(T.dmg));
    out.push("사람 방탄을 뚫는 힘 " + ar(p0, p) + " — " + cs(p) + "(막으면 몸 25% · 머리 20%만 들어갑니다)");
    out.push("방탄복 입은 약탈자 몸통 " + ar(pct(A.vestFactor(cal, "")), pct(A.vestFactor(cal, at))) + " · 방탄모 쓴 적 치명타 " + ar(pct(A.helmFactor("")), pct(A.helmFactor(at))));
    if (T && T.dmg < 1) out.push("방탄이 없는 곳(맨몸 · 감염체 · 들개) 피해 " + pct(T.dmg));
    if (at === "hp" && cal === "12게이지" && SX.SLUG) {
      const S = SX.SLUG, g = n => {
        const d = I.def(n);
        return d ? n + " " + Math.round(d.dmg * d.pellets * S.k) : "";
      };
      out.push("알갱이 대신 한 덩어리 — 피해 = 알갱이 하나 × 알갱이 수 × " + S.k + "(" + [ "엽총", "USAS-12 산탄총", "사제 산탄총" ].map(g).filter(Boolean).join(" · ") + ") · 사거리 26 → " + S.range + "칸 · 멀어져도 덜 약해집니다(24칸에서 25% → " + pct(Math.max(.25, 1 - 24 / S.falloff)) + ")");
    }
    if (T) out.push("값은 보통탄의 " + T.val + "배");
    return out;
  }
  I.moreLines = function(it) {
    const d = I.def(it.name) || it, L = [], A = SX.actors, N = SX.needs, P = SX.prog, kind = it.kind;
    const key = id => "[" + SX.label(id) + "]", sec = t => L.push("<b class='k'>" + t + "</b>");
    if (I.isStack(it)) {
      sec("뭉치");
      L.push(I.stackUnit(it) === "마리" ? "몇 마리든 한 칸에 모아 담습니다 — 값 · 무게는 마릿수만큼" : "몇 개든 한 칸에 모아 담습니다 — 값 · 무게는 개수만큼");
      L.push("같은 것끼리 끌어다 놓으면 합쳐지고 · 우클릭하면 반씩 나뉩니다 · 사거나 거두면 가진 뭉치에 더해집니다");
    }
    if (kind === "heal") {
      sec("쓰면");
      if (d.heal) L.push("체력 +" + d.heal + " — 바로 찹니다");
      if (d.hot) L.push("체력 +" + d.hot + " — " + tS(d.dur) + "에 걸쳐 천천히 찹니다(1초에 " + Math.round(d.hot / d.dur * 10) / 10 + ")");
      if (d.bonus) L.push("최대 체력 +" + d.bonus + " — " + tS(d.bonusT || 180) + " 동안 · 늘어난 만큼 바로 찹니다 · 끝나면 100을 넘던 체력은 사라집니다");
      if (d.stop === "H") L.push("출혈을 모두 멈춥니다 — 심한 출혈(1초에 체력 −1)도 · 가벼운 출혈(1초에 −0.35)도"); else if (d.stop === "L") L.push("가벼운 출혈(1초에 체력 −0.35)을 멈춥니다 — 심한 출혈은 못 멈춥니다(지혈대 · 군용 응급 파우치 · 수술 키트)");
      if (d.stam) L.push("기력이 가득 차고, " + tS(d.stam) + " 동안 달릴 때 기력이 절반만 닳습니다");
      sec("쓰는 법");
      L.push("판 안에서만 씁니다 — 가방 · 리그에 넣고 우클릭 · 단축 칸 · " + key("heal") + "(지금 필요한 약을 골라 씁니다)");
      L.push("쓰는 데 " + tS(d.cast || 3) + " — 그동안 천천히 걷기만 되고 쏘기 · 달리기 · 장전은 안 됩니다");
      L.push("맞으면 멈추고 약은 그대로 남습니다 · " + key("heal") + "로 가방에서 꺼내 쓰면 두 배 걸립니다 · 치료 기술이 오를수록 빨라집니다(단계마다 3% · 최대 30%)");
      if (!(d.stam || d.bonus)) L.push("고칠 데가 없으면 쓰지 않습니다");
    }
    if (kind === "cure") {
      sec("쓰면");
      L.push("좀비 감염 게이지가 0이 됩니다");
      L.push("감염 게이지는 몸에 쌓인 가스 양으로, 게임에 접속해 있는 동안만 오릅니다(접속 48시간이면 100%) · 100%가 되면 셸터부터 모든 것을 잃습니다");
      sec("쓰는 법");
      L.push("셸터에서는 가방 · 리그에서 우클릭하면 바로 · 판 안에서는 2초(맞아도 멈추지 않습니다)");
      L.push("게이지가 거의 비어 있으면 쓰지 않습니다 · 사격장에서는 못 씁니다");
      sec("사는 값");
      L.push("시장 약재상 · 밀수꾼 — 값은 가진 재산의 3%입니다(최소 20만 원 · 밀수꾼은 웃돈 " + (D.smuggleMarkup || 0) + "%)");
      if (SX.worth && SX.game && SX.game.save) L.push("지금 약재상 " + SX.won(SX.worth.price(it.name, "med", 0)) + " · 밀수꾼 " + SX.won(SX.worth.price(it.name, "smuggle", 0)));
    }
    if (kind === "afix") {
      sec("쓰면");
      L.push("입고 있는 방탄복 · 방탄모 가운데 더 닳은 쪽의 내구가 400 찹니다(최대 내구는 그대로)");
      sec("쓰는 법");
      L.push("판 안에서 가방 · 리그에 넣고 우클릭 · 8초 걸립니다(맞으면 멈추고 그대로 남습니다)");
      L.push("셸터에서는 방어구상에서 돈을 내고 고칠 수도 있습니다(고칠 때마다 최대 내구 −10%)");
    }
    if (kind === "flare") {
      sec("쓰면");
      L.push("터뜨리고 5초 뒤 그 자리에서 구조됩니다 — 어느 층에 있든 판을 벗어납니다");
      L.push("한 판에 한 번 · 소리가 커서(40칸) 둘레 적이 몰려옵니다 · 정해진 출구로 나가는 임무에는 안 칩니다");
      sec("쓰는 법");
      L.push("판 안에서 가방 · 리그에 넣고 우클릭 · 단축 칸(바로 터집니다)");
    }
    if (kind === "grenade") {
      const fuse = it.fuse || d.fuse || 2.6, R = it.radius || d.radius, dur = it.dur || d.dur;
      sec("던지면");
      if (!it.sub) {
        const dm = d.dmg || 90, R0 = R || 3.2;
        L.push(tS(fuse) + " 뒤 폭발 — 가운데 피해 " + dm + " · " + R0 + "칸 끝에서 " + Math.round(dm * .3) + "(멀수록 약합니다)");
        L.push("벽 너머는 안 맞습니다 · 적의 방탄복으로는 못 막습니다");
        L.push("나도 맞습니다 — 출혈이 생길 수 있습니다 · 소리가 커서(35칸) 적이 몰려옵니다");
      } else if (it.sub === "flash") {
        const R0 = R || 7.5;
        L.push(tS(fuse) + " 뒤 섬광 — " + R0 + "칸 안에서 섬광을 본 적은 아무것도 못 합니다");
        L.push("약탈자 최대 5.5초 · 감염체 최대 2.4초(멀수록 · 등을 돌리고 있으면 짧고, 두목은 절반)");
        L.push("나도 " + Math.round(R0 * 1.3 * 10) / 10 + "칸 안에서 그쪽을 보고 있으면 최대 4.6초 눈이 멉니다(등을 돌리면 짧게) — 그동안 탄이 많이 퍼집니다");
      } else if (it.sub === "gas") {
        L.push(tS(fuse) + " 뒤부터 " + tS(dur || 14) + " 동안 매운 연기 · 반지름 " + (R || 3.6) + "칸(천천히 퍼집니다)");
        L.push("연기 속 약탈자는 총을 못 쏘고 밖으로 물러납니다(나와서도 3초 · 두목은 1.5초) — 감염체에게는 안 듣습니다");
        L.push("나도 연기 속에서는 탄이 많이 퍼지고 기력이 안 차며 기침 소리(9칸)가 납니다");
      } else if (it.sub === "smoke") {
        L.push(tS(fuse) + " 뒤부터 " + tS(dur || 18) + " 동안 짙은 연기 · 반지름 " + (R || 4.2) + "칸");
        L.push("연기를 가로질러서는 적도 나도 못 봅니다 — 적은 연기 너머로 쏘지 않습니다 · 총알은 지나갑니다");
      }
      sec("쓰는 법");
      L.push(key("grenade") + " · 단축 칸 · 가방 우클릭으로 손에 쥐고, 좌클릭을 누르고 있다가 놓으면 던집니다(최대 10칸) · 놓는 순간부터 시간이 갑니다");
    }
    if (kind === "trap") {
      sec("놓으면");
      if (d.trap === "wire") {
        L.push("줄을 건드린 적 곁에서 " + tS(1.1) + " 뒤 수류탄이 터집니다 — 가운데 피해 70 · 3칸 끝에서 21(벽 너머는 안 맞습니다)");
        L.push("감염체 · 약탈자 모두 걸립니다 · 쓰러뜨린 몫은 놓은 사람 것 · 나와 우리 편에게는 늘 보이고, 적 팀 사람에게는 가까이 가야 보입니다");
        L.push("사람은 " + key("quiet") + " 조용히 걸으면 줄을 넘고, 그냥 걸으면 우리 편이어도 똑같이 터집니다(나도 다칩니다)");
        L.push("줄은 바라보는 쪽과 직각으로 발밑 칸에서 양옆 빈칸까지 뻗습니다(최대 3칸) — 복도나 문턱을 가로지르게 서서 놓으십시오");
      } else {
        L.push("밟은 적은 30 다치고 " + tS(3) + " 동안 붙들립니다(그동안 쏘기 좋습니다) · 사람은 18 다치고 " + tS(2.5) + " · 출혈이 날 수 있습니다");
        L.push("감염체 · 약탈자 모두 걸립니다 · 쓰러뜨린 몫은 놓은 사람 것 · 나와 우리 편에게는 늘 보이고, 적 팀 사람에게는 가까이 가야 보입니다 · 우리 편도 밟으면 똑같이 물립니다");
      }
      sec("쓰는 법");
      L.push("판 안에서 가방 · 리그에 넣고 우클릭 · 단축 칸 — " + tS(2) + " 동안 앉아 발밑에 놓습니다(움직이거나 맞으면 그만두고 물건은 남습니다) · 막 놓은 자리에서 비켜서야 걸립니다");
      L.push("놓은 덫 앞에서 " + key("interact") + " — 다시 챙깁니다(판의 함정도 풀면 이 물건으로 챙깁니다)");
      L.push("얻는 곳: 밀수꾼 · 무기상에 가끔 · 군용 무기 상자 · 보급 상자 · 사물함 · 약탈자에게 드물게 · 판의 함정을 풀면");
    }
    if (kind === "armor" || kind === "helmet") {
      const cls = it.cls || d.cls, hd = kind === "helmet";
      if (cls) {
        sec(hd ? "머리에 맞을 때 받는 피해" : "몸에 맞을 때 받는 피해");
        L.push(THREATS.map(t => t[0] + " " + (cls >= t[1] ? hd ? 20 : 25 : Math.min(100, 50 + 15 * (t[1] - cls))) + "%").join(" · "));
        L.push("내구가 30% 아래로 닳으면 한 등급 낮게 막고, 0이 되면 못 막습니다 · 센 탄을 막을수록 많이 닳습니다");
        if (hd) L.push("머리에 맞을 때만 막습니다(적이 머리를 맞히는 것은 22% · 피해 2배)");
        L.push("방어구상에서 고치거나(고칠 때마다 최대 내구 −10%) 판 안에서 방탄 수리 키트로 채웁니다");
      }
    }
    if (kind === "gun") {
      const at = I.typeOf(it), slug = at === "hp" && it.pellets && SX.SLUG, rpm = Math.round(60 / it.rof), ap = A && A.vestFactor ? A.vestFactor(it.caliber, at) : null;
      sec("쏘면");
      if (slug) L.push("슬러그 한 덩어리 — 피해 " + Math.round(it.dmg * it.pellets * slug.k) + " · 멀수록 약해집니다(" + slug.falloff + "칸에서 25%) · 사거리 " + slug.range + "칸"); else if (it.pellets) L.push("알갱이 " + it.pellets + "개 × 피해 " + it.dmg + " · 멀수록 약해집니다(" + (d.falloff || 24) + "칸에서 25%) · 사거리 26칸"); else L.push("한 발 피해 " + it.dmg + " · 치명타 " + (it.dmgHead || d.dmgHead) + " · 사거리 44칸");
      L.push("치명타는 조준 사격 25% · 그냥 쏘기 10% — 헬멧 쓴 적에게는 치명타 피해가 " + (A && A.helmFactor ? Math.round(A.helmFactor(at) * 100) : 45) + "%만");
      L.push(it.auto ? "누르고 있으면 계속 나갑니다(1분에 " + rpm + "발)" : "한 번 누를 때 한 발(1분에 " + rpm + "발까지)");
      if (ap != null && ap < 1) L.push("방탄복 입은 적에게는 몸 피해가 " + Math.round(ap * 100) + "%만 들어갑니다(치명타는 그대로)");
      L.push(it.quiet ? "총소리는 7칸까지 들립니다(소음)" : "총소리는 30칸까지 들립니다 — 소음기를 달면 7칸");
      sec("탄 · 장전");
      L.push(it.caliber + " — " + D.mags.filter(m => m.caliber === it.caliber && !m.ammoType).map(m => m.name).join(" · "));
      L.push("탄 종류 — " + [ "", "ap", "hp" ].map(t => I.typeName(it.caliber, t)).join(" · ") + "(탄창마다 한 종류) · 지금 든 탄: " + I.typeName(it.caliber, at) + " " + (it.ammo | 0) + "발");
      if (at) for (const s of typeLines(it.caliber, at)) L.push(s);
      L.push("장전 " + tS(it.reload || 1.3) + "(리그에 든 탄창) · 가방에서 꺼내면 2배 · 다른 총의 탄을 빼 쓰면 3배");
      L.push("쏠수록 닳습니다 — 상태가 35% 아래면 가끔 걸리고 덜 정확합니다");
    }
    if (kind === "part") {
      const pd = SX.partDef ? SX.partDef(it) : it, fx = pd.fx || {}, F = [];
      if (fx.quiet) F.push("소음 — 적이 듣는 거리 30칸 → 7칸");
      if (fx.ads) F.push("조준 사격 퍼짐 −" + pc(fx.ads));
      if (fx.hip) F.push("그냥 쏠 때 퍼짐 −" + pc(fx.hip));
      if (fx.move) F.push("걸으며 쏠 때 퍼짐 −" + pc(fx.move));
      if (fx.rate) F.push("퍼짐이 모이는 빠르기 " + (fx.rate > 1 ? "+" : "−") + pc(fx.rate));
      if (fx.bloom) F.push("연사할 때 퍼짐 −" + pc(fx.bloom));
      if (fx.kick) F.push("반동(화면 흔들림) −" + pc(fx.kick));
      if (fx.choke) F.push("산탄 퍼짐 −" + pc(fx.choke));
      if (fx.mag) F.push("장탄 ×" + fx.mag);
      if (fx.reload) F.push("장전 시간 " + (fx.reload > 1 ? "+" : "−") + pc(fx.reload));
      if (fx.scope) F.push("조준하면 조준경으로 멀리 봅니다");
      if (fx.look) F.push("보는 거리 +" + pc(fx.look));
      if (fx.noise) F.push("총소리 " + (fx.noise > 1 ? "+" : "−") + pc(fx.noise));
      if (fx.flash) F.push("총구 불빛 −" + pc(fx.flash));
      if (fx.fuzz) F.push("적이 쏜 곳을 " + fx.fuzz + "칸쯤 어긋나게 압니다");
      if (fx.laser) F.push("레이저 줄이 보입니다");
      if (F.length) {
        sec("달면");
        L.push(F.join(" · "));
      }
      L.push("무게 +" + (pd.kg || 0) + "kg · 총을 누르면 뜨는 파츠 창에서 답니다");
    }
    if (kind === "melee") {
      const reach = Math.max(1.3, (it.reach || d.reach || 1.7) * .62), cr = A && A.meleeCrit ? A.meleeCrit() : .15;
      sec("휘두르면");
      L.push("피해 " + it.dmg + "(±15%) · 닿는 거리 " + reach.toFixed(1) + "칸 · 앞쪽 부채꼴 안 적을 모두 칩니다");
      L.push("한 번 휘두르는 데 " + tS(it.cool || d.cool || .6) + " · 방탄복 입은 적에게는 70%");
      L.push("치명타 " + Math.round(cr * 1e3) / 10 + "%(피해 2.2배) — 주먹 싸움에서 이길수록 · 헬스장 샌드백 단계가 오를수록 오릅니다");
      L.push(key("melee") + "로 휘두릅니다");
    }
    if (kind === "mag") {
      const at = I.typeOf(it);
      sec("탄 종류 — " + I.typeName(it.caliber, at));
      for (const s of typeLines(it.caliber, at)) L.push(s);
      sec("맞는 총");
      L.push((D.guns || []).filter(g => g.caliber === it.caliber).map(g => g.name).join(" · ") || "없음");
      L.push("같은 구경이면 어느 탄창이든 맞습니다" + (it.box ? " · 탄 상자째로도 장전됩니다" : ""));
      L.push("탄창 하나에는 한 종류만 듭니다 — 다른 종류끼리는 합쳐지지 않습니다 · 다른 종류가 든 총에 끌어다 넣으면 든 탄은 그 종류 탄창으로 빠집니다");
      L.push(key("reload") + " 장전은 총에 든 종류부터 씁니다 — 다 떨어지면 다른 종류로 바꿔 넣습니다");
    }
    if (kind === "bag" || kind === "rig") {
      sec("알아 둘 것");
      if (kind === "rig") L.push("의약품 · 탄창 · 투척물 · 신호탄은 리그에 먼저 들어갑니다 · 리그에 든 탄창으로 장전하면 가방보다 두 배 빠릅니다"); else L.push("물건이 든 가방은 다른 가방 · 리그에 못 넣습니다");
      {
        const f = I.foldSize(it), s = I.fullSize(it);
        if (f) L.push("빈 가방은 우클릭으로 접습니다 — " + s[0] + "×" + s[1] + " 자리가 " + f[0] + "×" + f[1] + "로 줄어듭니다(값 · 무게는 그대로) · 접은 가방엔 아무것도 못 넣고, 다시 우클릭하면 폅니다(펼 자리가 있어야 합니다) · 가방 칸에 메면 저절로 펴집니다"); else if (kind === "rig") L.push("리그 · 조끼는 판 · 주머니가 달려 접을 수 없습니다");
      }
    }
    if (kind === "key") {
      const kr = (SX.KEY_ROOMS || []).find(r => r.key === it.name), bd = kr && (D.buildings || []).find(b => b.id === kr.b);
      sec("쓰면");
      if (kr) L.push((bd ? bd.name + " 가장 위층(옥상 바로 아래) " : "가장 위층 ") + "「" + kr.room + "」 문을 엽니다 — 안 금고에 값진 것 " + kr.n + "개" + (kr.must && kr.must.length ? "(꼭 나오는 것: " + kr.must.join(" · ") + ")" : ""));
      L.push("문 앞에서 " + key("interact") + " · 0.9초(움직이면 멈춥니다) · 열 때마다 한 번씩 씁니다");
    }
    if (kind === "vaultkit") {
      sec("쓰면");
      L.push("셸터 · 장터에서 우클릭으로 씁니다 · 금고는 하나만 — 같은 칸 수 금고를 또 쓰면 보존 기간이 늘고, 다른 칸 수면 새 금고로 바뀝니다(든 것은 옮깁니다)");
    }
    if (kind === "rod") {
      sec("쓰면");
      L.push("한강 낚시터(장터 왼쪽 아래 문) 물가에서 " + key("interact") + " — 가방 · 리그에 낚싯대가, 가방 · 리그 · 조과통에 지렁이가 있어야 합니다 · 한 번 던질 때 지렁이 한 마리");
      L.push("찌가 쑥 내려갈 때 [Space] · 좌클릭으로 채고, 줄 긴장이 붉은 칸에 닿지 않게 [Space] 를 눌렀다 놓았다 하며 끌어냅니다 — 물고기가 당길 때(!!)는 놓습니다");
      L.push("던질 때마다 한 번씩 닳고(" + ((I.def(it.name) || {}).uses || 50) + "번) 줄이 끊기면 세 번 몫 · 0이 되면 부러집니다");
      L.push("잡은 물고기는 가방 · 리그로 — 날로 먹으면 배고픔 +10 · 모닥불에 구우면 「구운 생선」(배고픔 +45) · 브로커에게 팔 수도 있습니다");
    }
    if (kind === "nvg") {
      const NV = SX.nvg || {}, bt = NV.BAT_T || 480;
      sec("쓰면");
      L.push("장착 창의 「투시경」 칸에 쓰고(우클릭) 판 안에서 " + key("nvg") + " 로 켜고 끕니다(0.4초 · 그동안 무기를 내립니다)");
      L.push("켜면 밤 어둠이 크게 걷히고 화면이 초록 한 빛깔이 됩니다 — 손전등 없이도 보이는 곳의 적이 보입니다");
      L.push("대신 밝은 것에 더 눈이 부십니다 — 섬광탄(닿는 거리 1.35배 · 눈머는 시간 1.7배 · 등져도 0.6) · 번개 · 총구 불빛 · 폭발 · 손전등 · 낮(바깥은 하얗게 뜹니다)");
      L.push("전지: 켜 둔 동안만 닳아 가득 " + Math.round(bt / 60) + "분 · 다 되면 저절로 꺼집니다 · 셸터에서 충전돼 판에 나설 때마다 가득" + (it.bat != null && it.bat < 100 ? " · 지금 " + Math.round(it.bat) + "%" : ""));
      L.push("의식을 잃으면 떨어집니다(보험은 안 듭니다)");
    }
    if (!kind || kind === "junk") {
      const fd = N && N.of ? N.of(it) : null;
      if (fd) {
        sec("먹으면");
        L.push([ fd.f ? "배고픔 " + sg(fd.f) : "", fd.w ? "목마름 " + sg(fd.w) : "" ].filter(Boolean).join(" · ") + "(100이 가득)");
        L.push("판 안에서는 가방 · 리그에 넣고 우클릭(2.5초) · 셸터에서는 보관함에서도 바로(배부르면 안 먹습니다)");
        L.push("판 안에서만 배고프고 목마릅니다 — 1분에 배고픔 약 2.3 · 목마름 약 3.6씩(달리면 목마름 1.5배) · 25 아래면 기력이 달리고 0이면 체력이 줄어듭니다");
      }
      const uses = [];
      if (it.name === "벽돌") uses.push("판 안에서 " + key("brick") + " — 던지면(2~10칸) 떨어진 곳에서 소리가 나 적을 꾑니다(22칸)");
      if (it.name === "종이상자") uses.push("판 안에서 " + key("box") + " — 뒤집어쓰면 걸음이 45% 느려지는 대신, 가만히 있으면 적이 거의 못 알아봅니다");
      {
        const c = P && P.cropBySeed ? P.cropBySeed(it.name) : null, C = c && P.CROPS[c];
        if (C) uses.push("셸터 텃밭 상자에 심습니다 — 생수병으로 물을 주면 약 " + P.gTime(C.min * 6e4) + "에 " + C.out + " " + C.n[0] + "~" + C.n[1] + "개(물을 주면 " + P.gTime(P.GDN.WET * 6e4) + " 촉촉 · 마르면 느리게 자라고 " + P.gTime(P.GDN.WILT * 6e4) + " 넘게 마르면 시듭니다)");
        if (P && it.name === P.WORM) uses.push("낚시 미끼 · 텃밭을 거두거나 시든 것을 뽑을 때 가끔 나옵니다");
        if (P && P.KIT && it.name === P.KIT.NAME) uses.push("셸터 텃밭 상자 " + key("interact") + " 창에서 「급수기 달기」 — 물탱크에 생수병을 " + P.KIT.CAP + "병까지 채우면 흙이 마를 때마다(" + P.gTime(P.GDN.WET * 6e4) + "마다) 한 병씩 알아서 물을 줍니다 · 상자 하나에 하나 · 떼도 남은 물은 급수기 물탱크에 그대로 남습니다(다시 달면 그 물로 이어서 줍니다)");
      }
      for (const r of P && P.RECIPES || []) if (r.in.some(x => x[0] === it.name)) uses.push("「" + r.out[0][0] + "」 만들기 재료");
      for (const e of (P && P.EG || []).map((e0, i) => P.egOf ? P.egOf(i, SX.game && SX.game.save && SX.game.save.story) : e0)) for (const x of e.items || []) if (x[0] === it.name) uses.push("서울 탈출 작전 「" + e.name + "」에 " + x[1] + "개");
      {
        const fu = [];
        for (const f of P && P.FAC || []) {
          const ks = [];
          f.lv.forEach((L0, k) => {
            if ((L0.items || []).some(x => x[0] === it.name)) ks.push(k + 1);
          });
          if (ks.length) fu.push(f.name + " " + (ks.length > 2 && ks[ks.length - 1] - ks[0] === ks.length - 1 ? ks[0] + "~" + ks[ks.length - 1] : ks.join("·")) + "단계");
        }
        if (fu.length) uses.push("셸터 설비 짓기 · 단계 올리기 — " + fu.join(" · "));
      }
      const keyish = /열쇠|키$|카드|방문증|사원증/.test(it.name);
      if (keyish) {
        if (SX.raid && it.name === SX.raid.STAIR_KEY) {
          uses.push("판 안 잠긴 비상계단 철창 — 계단 앞에서 " + key("interact") + " · 가방이나 리그에 있으면 엽니다");
          uses.push("<span class='good'>남은 횟수 1/1</span> — 한 번 열면 자물쇠에 꽂힌 채 남아 없어집니다");
        }
        const TN = P && P.TRADERS || {}, WHO = P && P.ST_WHO || {}, BN = P && P.B_NAMES || {};
        for (const q of P && P.QUESTS || []) if (q.kind === "fetch" && q.item === it.name && (TN[q.t] || WHO[q.t])) uses.push("의뢰 「" + q.name + "」 — " + (TN[q.t] || WHO[q.t]) + "에게 " + q.n + "개 내면 " + [ SX.won(q.money || 0) ].concat(q.items || []).join(" + "));
        for (const s of P && P.STORY || []) if (s.obj && s.obj.item === it.name && BN[s.obj.b] && WHO[s.who]) {
          uses.push((s.main ? "본 줄거리" : "이야기") + " 「" + s.name + "」 — " + BN[s.obj.b] + "에서 찾아 " + WHO[s.who] + "에게 가져갑니다");
          if (BN[s.unlock]) uses.push("가져가면 「" + BN[s.unlock] + "」에 갈 수 있습니다");
        }
        const BT = SX.trade && SX.trade.BARTER || {};
        for (const w in BT) for (const b of BT[w] || []) if ((b.give || []).some(x => x[0] === it.name)) uses.push("물물교환 — " + (WHO[w] || w) + ": " + b.give.map(x => x[0] + (x[1] > 1 ? " ×" + x[1] : "")).join(" + ") + " → " + b.get[0]);
        if (it.name === "관제실 열쇠") uses.unshift("터미널 가장 위층(옥상 바로 아래) 「관제실」 문을 엽니다 — 문 앞에서 " + key("interact") + " 0.9초 · <span class='good'>닳지 않습니다</span>", "관제실 안 관제 화면을 켜면(" + key("interact") + " 1.5초) 그 판 터미널의 모든 층 구조가 지도에 뜹니다");
        if (!uses.length && !it.story) {
          sec("쓰는 곳");
          L.push("여는 문 · 쓰는 곳이 없습니다 — 팔아서 돈으로 바꿉니다");
          return L;
        }
      }
      if (uses.length) {
        sec("쓰는 곳");
        for (const u of uses.filter((u, k) => uses.indexOf(u) === k)) L.push(u);
      } else if (!fd && !it.quest && !it.story) {
        sec("쓰는 곳");
        L.push("팔아서 돈으로 바꿉니다 — 의뢰 · 임무가 찾는 물건이면 그쪽에 넘깁니다");
      }
    }
    return L;
  };
  I.NICK_MAX = 12;
  I.cleanNick = s => [ ...String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim() ].slice(0, I.NICK_MAX).join("");
  I.shownName = it => it && it.kind === "gun" && typeof it.nick === "string" && it.nick ? it.nick : it ? it.name : "";
  I.headHtml = it => "<h4 class='itHead'><span class='itName'>" + SX.esc(I.shownName(it)) + "</span>" + (I.shownName(it) !== it.name ? " <span class='small itReal'>(" + SX.esc(it.name) + ")</span>" : "") + "</h4>";
  I.describe = function(it, atMarket, full) {
    const L = [];
    const kindName = {
      part: "총 파츠 · " + ((SX.PART_SLOT_NAMES || {})[(SX.partDef ? SX.partDef(it) : it).slot] || ""),
      gun: "총",
      melee: "근접무기",
      mag: it.box ? "탄 상자" : "탄창",
      partbox: "파츠 상자",
      heal: "의약품",
      armor: "방탄복",
      helmet: "방탄모",
      bag: "가방",
      rig: "리그",
      cure: "억제약",
      flare: "신호탄",
      grenade: "투척",
      key: "열쇠",
      vaultkit: "개인 금고",
      afix: "방탄 수리",
      rod: "낚싯대",
      nvg: "야간 투시경 · 머리 장비",
      trap: "덫"
    }[it.kind] || (it.quest ? "의뢰품" : !it.kind && SX.needs && SX.needs.of && SX.needs.of(it) ? SX.needs.of(it).f > 0 ? "먹을 것" : "마실 것" : "잡동사니");
    L.push("<span class='k'>" + kindName + " · " + it.w + "×" + it.h + " · " + I.weight(it).toFixed(2) + "kg</span>");
    {
      const P = SX.prog;
      if (P && P.KIT && it.name === P.KIT.NAME) {
        const n = P.kitTank ? P.kitTank(it) : 0;
        L.push(n ? "<span class='good'>물탱크 " + n + "/" + P.KIT.CAP + "병</span> — 다시 달면 이 물로 이어서 물을 줍니다" : "<span class='small'>물탱크 빈 상태 0/" + P.KIT.CAP + "병</span>");
      }
    }
    if (I.isStack(it)) L.push("<span class='good'>" + (I.stackUnit(it) === "마리" ? "한 뭉치 " + I.qty(it) + "마리" : "한 뭉치 " + I.qty(it) + "개") + "</span>" + (full ? "" : " <span class='small'>· 우클릭으로 반씩 나눕니다</span>"));
    if (it.kind === "gun") {
      const CLS = {
        pistol: "권총",
        revolver: "리볼버",
        smg: "기관단총",
        rifle: "소총",
        lmg: "기관총",
        sniper: "저격총",
        shotgun: "산탄총"
      };
      L.push("피해 " + it.dmg + (it.pellets ? "×" + it.pellets : "") + " · 연사 " + Math.round(60 / it.rof) + "/분 · " + it.caliber + (I.typeOf(it) ? " " + I.typeName(it.caliber, I.typeOf(it)) : "") + " " + (it.ammo || 0) + "/" + it.magSize + (it.auto ? " · 자동" : ""));
      L.push((CLS[it.cls] || "총") + (it.scope ? " · 조준경" : "") + (it.quiet ? " · 소음기" : "") + " · 탄창 " + (it.reload || 1.3).toFixed(1) + "초 · 탄속 " + SX.actors.gunVel(it) + "칸/초");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
      const ms = I.modsOf(it);
      if (ms.length) L.push("<span class='good'>파츠: " + ms.map(m => SX.esc(m.name)).join(" · ") + "</span>");
      if (SX.partSlots(it).length) L.push("<span class='small'>눌러서 파츠 달기</span>");
    }
    if (it.kind === "part") {
      const d = SX.partDef(it), gs = (D.guns || []).filter(g => SX.partFits(it, g)).map(g => g.name.replace(/ (권총|소총|기관단총|소음기관단총|소음권총|기관총|저격소총|산탄총|리볼버)$/, ""));
      L.push("<span class='small'>" + SX.esc(d.desc || "") + "</span>");
      L.push("<span class='small'>맞는 총: " + SX.esc(gs.join(" · ") || "없음") + "</span>");
    }
    if (it.kind === "melee") L.push("피해 " + it.dmg + " · 닿는 거리 " + Math.max(1.3, (it.reach || 1.7) * .62).toFixed(1) + "칸");
    if (it.kind === "mag") {
      L.push(it.caliber + " " + I.typeName(it.caliber, I.typeOf(it)) + " · " + (it.ammo || 0) + "/" + it.cap + "발" + (it.box ? " · 탄 상자(장전도 됩니다)" : ""));
      {
        const at = I.typeOf(it), T = at && SX.AMMO_TYPES[at];
        if (T) L.push(at === "ap" ? "<span class='good'>방탄 뚫는 힘 +1 · 방탄 없는 몸 " + Math.round(T.dmg * 100) + "%</span>" : "<span class='warn'>방탄 없는 몸 " + Math.round(T.dmg * 100) + "% · 방탄 뚫는 힘 −1</span>");
      }
      if ((it.ammo | 0) >= 2) L.push("<span class='small'>우클릭으로 반씩 나눕니다" + (it.split ? " · 나눠 둔 탄창(저절로 안 합쳐집니다 — 끌어다 부으면 합쳐집니다)" : "") + "</span>");
    }
    if (it.kind === "heal") {
      L.push("<span class='good'>" + I.medLines(it).join(" · ") + "</span> · 쓰는 데 " + (it.cast || 3) + "초");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
    }
    if (it.kind === "partbox") {
      L.push("<span class='good'>속: " + SX.esc((it.box || []).map(o => o.name).join(" · ")) + "</span>");
      L.push("<span class='small'>우클릭으로 엽니다 — 파츠가 이 칸 둘레에 들어갑니다</span>");
    }
    if (it.kind === "armor" || it.kind === "helmet") {
      L.push("내구 " + Math.round(it.armor) + "/" + it.armorMax);
      const ad = I.def(it.name) || it, cls = it.cls || ad.cls, slow = it.slow != null ? it.slow : ad.slow;
      if (cls) L.push("<span class='good'>방탄 " + cls + "등급</span> · 막는 것: " + I.armorBlocks(cls) + (slow ? " · 걸음 −" + Math.round(slow * 100) + "%" : ""));
    }
    if (it.kind === "gun") {
      const w = Math.round(I.wearOf(it));
      L.push("상태 " + w + "%" + (w < I.WEAR_JAM ? " — 가끔 걸립니다" : ""));
    }
    if (it.folded) {
      const s = I.fullSize(it);
      L.push("<span class='warn'>접힌 가방 — 펴면 " + it.cols + "×" + it.rows + " 칸</span>");
      if (!full) L.push("<span class='small'>우클릭으로 폅니다 — 펴면 " + s[0] + "×" + s[1] + " 자리</span>");
    } else if (it.kind === "bag" || it.kind === "rig") {
      L.push(it.cols + "×" + it.rows + " 칸");
      const f = I.foldSize(it);
      if (f && !full && !(it.grid && it.grid.list.length)) L.push("<span class='small'>빈 가방 — 우클릭으로 접으면 " + f[0] + "×" + f[1] + " 자리</span>");
    }
    if (it.kind === "cure") L.push("감염 게이지를 0으로");
    if (it.kind === "flare") L.push("터뜨리고 5초 뒤 구조(어디서든 탈출)");
    if (it.kind === "grenade") {
      L.push(it.sub === "flash" ? "던지고 " + (it.fuse || 1.7) + "초 뒤 섬광 · " + it.radius + "칸" : it.sub === "gas" || it.sub === "smoke" ? "던지고 " + (it.fuse || 1.4) + "초 뒤부터 " + (it.dur || 14) + "초 연기 · " + it.radius + "칸" : "던지고 " + (it.fuse || 2.6) + "초 뒤 폭발 · 피해 " + (it.dmg || 90) + " · " + (it.radius || 3.2) + "칸");
      if (!full) L.push("<span class='small'>" + SX.label("grenade") + " · 단축 칸 · 가방 우클릭으로 손에 쥐고, 좌클릭을 누르고 있다가 놓으면 던집니다</span>");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
    }
    if (it.kind === "trap") {
      L.push("<span class='good'>" + (it.trap === "wire" ? "걸어 두면 줄을 건드린 적 곁에서 1.1초 뒤 수류탄 · 피해 70 · 3칸" : "놓아 두면 밟은 적을 3초 붙들고 30 다치게 합니다") + "</span>");
      if (!full) L.push("<span class='small'>판 안에서 우클릭 · 단축 칸 — 2초 동안 앉아 발밑에 놓습니다 · 나와 우리 편에게만 보입니다</span>");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
    }
    if (it.kind === "key") {
      const mx = it.usesMax || (I.def(it.name) || {}).uses || 1, left = it.uses == null ? mx : it.uses;
      L.push("<span class='good'>남은 횟수 " + left + "/" + mx + "</span> · 「" + SX.esc(it.room || "") + "」");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
      L.push("<span class='small'>개인 금고에 넣어 두면 의식을 잃어도 남고, 거기서 꺼내지 않아도 문을 엽니다</span>");
    }
    if (it.kind === "rod") {
      const mx = (I.def(it.name) || {}).uses || 50, left = it.uses == null ? mx : it.uses;
      L.push("<span class='good'>남은 횟수 " + left + "/" + mx + "</span> · 한강 낚시터 물가에서 씁니다");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
    }
    if (it.kind === "vaultkit") {
      const days = SX.prog && SX.prog.vaultDays && SX.game && SX.game.save ? SX.prog.vaultDays(SX.game.save.fac) : 1;
      L.push("<span class='good'>개인 금고 " + (it.cells | 0) + "칸</span> · 쓰면 " + days + "일 동안 남습니다");
      if (it.desc) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
    }
    if (full) {
      const shown = {
        gun: 1,
        part: 1,
        heal: 1,
        grenade: 1,
        key: 1,
        vaultkit: 1,
        trap: 1
      };
      if (it.desc && !shown[it.kind]) L.push("<span class='small'>" + SX.esc(it.desc) + "</span>");
      const M = I.moreLines(it);
      if (M.length) L.push("<div class='more'>" + M.join("<br>") + "</div>");
    } else {
      const fd = !it.kind && SX.needs && SX.needs.of ? SX.needs.of(it) : null;
      if (fd) L.push("<span class='good'>" + [ fd.f ? "배고픔 " + sg(fd.f) : "", fd.w ? "목마름 " + sg(fd.w) : "" ].filter(Boolean).join(" · ") + "</span>");
    }
    if (full && SX.trade) {
      const T = SX.trade, sv = SX.game && SX.game.save, ss = T.sellers(it.name);
      if (ss.length) L.push("<span class='small'>파는 곳: " + ss.map(q => T.NAME[q.who] + (q.k === "rare" ? "(단골 3단계부터 가끔)" : "(" + (q.k === "always" ? "늘" : "가끔") + (q.at > 1 ? " · 단골 " + q.at + "단계부터" : "") + ")")).join(" · ") + "</span>");
      if (sv && T.wished(sv, it.name)) L.push("<span class='good'>찜 ★ — 좌판에 들어오면 알려 드립니다</span>");
    }
    if (it.quest) L.push("<b class='warn'>의뢰품</b> — 시장에서 " + I.QUEST_MUL + "배");
    {
      const nl = SX.needmark ? SX.needmark.html(it) : "";
      if (nl) L.push(nl);
    }
    if (it.story) {
      L.push("<b class='warn'>임무 물건</b> — 팔 수 없습니다 · 장터에서 맡긴 사람에게 가져가 주십시오");
      return I.headHtml(it) + L.join("<br>");
    }
    {
      const bb = atMarket ? I.brokerBonus(it) : 0;
      L.push("<span class='money'>팔면 " + SX.won(atMarket ? I.brokerValue(it) : I.sellValue(it, atMarket)) + "</span>" + (bb ? " <span class='small good'>단골 덤 +" + Math.round(bb * 100) + "%</span>" : ""));
    }
    return I.headHtml(it) + L.join("<br>");
  };
})(window.SX);
