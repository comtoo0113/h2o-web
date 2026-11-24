"use strict";

(function(SX) {
  const W = SX.worth = {};
  const D0 = JSON.parse(JSON.stringify(SX.data || {}));
  const OLD = JSON.parse(JSON.stringify(SX.OLD_NAMES || {})), AMAG = JSON.parse(JSON.stringify(SX.AMMO_MAG || {}));
  const SLOTS = [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig", "nvg" ];
  const MAGS = {
    "9mm": "9mm 탄창",
    "5.56mm": "5.56mm 탄창",
    "7.62mm": "7.62mm 탄창",
    "12게이지": "12게이지 탄"
  };
  const STACK_MAX = 99999;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  let TB = null;
  function table() {
    if (TB) return TB;
    const byName = new Map, D = D0;
    const add = d => {
      if (!d || typeof d !== "object" || !d.name) return;
      const val = Math.max(0, Math.round(d.val || 0));
      const old = byName.get(d.name);
      if (!old || val > old.val) byName.set(d.name, {
        name: d.name,
        kind: d.kind || "junk",
        val,
        cap: d.cap || d.magSize || 0,
        armor: d.armorMax || d.armor || 0,
        raw: d
      });
    };
    for (const L of [ D.items, D.specials, D.guns, D.mags, D.melee, D.containers, D.shop, D.parts ]) if (Array.isArray(L)) for (const d of L) add(d);
    for (const st of D.stalls || []) for (const d of (st.pool || []).concat(st.always || [])) add(d);
    for (const s of D.smuggle || []) add(s && s.item);
    for (const one of [ D.defBag, D.helmet, D.cure, D.flare ]) add(one);
    add({
      name: "수류탄",
      kind: "grenade",
      val: 38e3,
      w: 1,
      h: 1
    });
    add({
      name: "감염체 조직",
      kind: "junk",
      val: 1200,
      w: 1,
      h: 1
    });
    for (const o of Object.keys(OLD)) {
      const n = byName.get(OLD[o]);
      if (n && !byName.has(o)) byName.set(o, Object.assign({}, n, {
        name: o
      }));
    }
    return TB = byName;
  }
  const defOf = name => table().get(String(name || "")) || null;
  const questMul = () => D0.questMul || 1;
  const isStack = name => {
    const d = defOf(name);
    return !!(d && d.raw && d.raw.stack);
  };
  const qty = it => {
    if (!it || typeof it !== "object" || !isStack(it.name)) return 1;
    const n = Math.floor(+it.n);
    return n >= 1 ? Math.min(n, STACK_MAX) : 1;
  };
  const ammoMag = (cal, at) => {
    const r = AMAG[cal];
    return r ? r[at === "ap" || at === "hp" ? at : ""] || r[""] || null : null;
  };
  function roundVal(cal, at) {
    const md = defOf(ammoMag(cal, at) || MAGS[cal] || "");
    return md && md.cap ? md.val / md.cap : 0;
  }
  function roundsValue(cal, at, n) {
    const md = defOf(ammoMag(cal, at) || MAGS[cal] || "");
    return md && md.cap ? md.val * n / md.cap : 0;
  }
  function loadedValue(it, gd) {
    const n = Math.max(0, it.ammo | 0);
    if (!n) return 0;
    const cal = it.caliber || gd.raw && gd.raw.caliber;
    return roundsValue(cal, it.ammoType, n);
  }
  function itemValue(it, depth) {
    if (!it || typeof it !== "object" || (depth | 0) > 6) return 0;
    const d = defOf(it.name);
    let v = 0;
    if (d) {
      const base = d.val;
      if (d.kind === "mag") {
        const cap = d.cap || it.cap || 1, r = clamp01((it.ammo | 0) / cap);
        const n = Math.max(0, Math.min(cap, it.ammo | 0)), cal = d.raw && d.raw.caliber || it.caliber, at = d.raw ? d.raw.ammoType : it.ammoType;
        v = roundVal(cal, at) ? roundsValue(cal, at, n) : base * r;
      } else if (d.kind === "gun") v = base * (.6 + .4 * clamp01((it.wear != null ? +it.wear : 100) / 100)) + loadedValue(it, d); else if (d.kind === "armor" || d.kind === "helmet") {
        const mx = d.armor || it.armorMax || 1;
        v = base * (.5 + .5 * clamp01((+it.armor || 0) / mx));
      } else v = base * qty(it);
      if (it.quest) v *= Math.max(1, .75 * questMul());
      if (it.tank) {
        const KT = SX.prog && SX.prog.KIT, bd = defOf("생수병");
        if (it.name === (KT && KT.NAME || "자동 급수기")) v += Math.max(0, Math.min(KT && KT.CAP || 6, Math.floor(+it.tank || 0))) * (bd ? bd.val : 0);
      }
    }
    if (it.grid && Array.isArray(it.grid.list)) for (const e of it.grid.list) v += itemValue(e && e.it, (depth | 0) + 1);
    if (it.mods && typeof it.mods === "object") for (const k of Object.keys(it.mods)) v += itemValue(it.mods[k], (depth | 0) + 1);
    if (Array.isArray(it.box)) for (const o of it.box.slice(0, 12)) v += itemValue(o, (depth | 0) + 1);
    return v;
  }
  function gridValue(g) {
    let v = 0;
    for (const e of g && Array.isArray(g.list) ? g.list : []) v += itemValue(e && e.it);
    return v;
  }
  function safeGrids(data) {
    const s = data && data.safe;
    if (!s || typeof s !== "object") return [];
    const out = [];
    if (s.grid && Array.isArray(s.grid.list)) out.push(s.grid);
    if (Array.isArray(s.ext)) for (const e of s.ext.slice(0, 12)) if (e && e.grid && Array.isArray(e.grid.list)) out.push(e.grid);
    return out;
  }
  function creelGrids(data) {
    const c = data && data.creel;
    if (!(c && typeof c === "object" && Array.isArray(c.list))) return [];
    return c.bait && typeof c.bait === "object" && Array.isArray(c.bait.list) ? [ c, c.bait ] : [ c ];
  }
  function stashPaid(g, free) {
    if (!g) return 0;
    const cols = Math.max(1, g.cols | 0), cells = cols * Math.max(0, g.rows | 0), base = 60 + Math.max(0, free | 0) * cols;
    let paid = 0;
    for (let c = base; c < cells; c += cols * 2) paid += 5e5 + Math.max(0, c - base) * 18e3;
    return paid;
  }
  function gasValue(f) {
    const K = SX.prog && SX.prog.GAS;
    const uses = K && K.USES || 4, cap = K && K.CAP || 4, d = defOf(K && K.CAN || "부탄가스"), can = d ? d.val : 0;
    const n = Math.max(0, Math.min(uses, f.gasUse | 0)) + Math.max(0, Math.min(cap, f.gas | 0)) * uses;
    return n * can / uses;
  }
  function kitValue(data) {
    const g = data && data.garden, K = g && g.kit;
    if (!K || typeof K !== "object" || Array.isArray(K)) return 0;
    const KT = SX.prog && SX.prog.KIT;
    const kd = defOf(KT && KT.NAME || "자동 급수기"), bd = defOf("생수병"), cap = KT && KT.CAP || 6;
    let v = 0;
    for (const id of Object.keys(K).slice(0, 64)) {
      const k = K[id];
      if (!k || typeof k !== "object") continue;
      v += (kd ? kd.val : 0) + Math.max(0, Math.min(cap, Math.floor(+k.n || 0))) * (bd ? bd.val : 0);
    }
    return v;
  }
  function homeTable() {
    const H = SX.home || {}, FR = H.FURN && H.FURN.__raw || H.FURN || {}, TP = SX.top;
    return {
      tiers: (H.TIERS || []).map(t => t.price | 0),
      furn: Object.fromEntries(Object.entries(FR).map(([k, v]) => [ k, v.price | 0 ])),
      migrate: typeof H.migrateHome === "function" ? H.migrateHome : null,
      small: TP && TP.ITEMS ? Object.fromEntries(Object.entries(TP.ITEMS).map(([k, v]) => [ k, v.price | 0 ])) : {},
      smallMax: (TP && TP.MAX) | 0 || 999
    };
  }
  function homeValue(h) {
    if (!h || typeof h !== "object") return 0;
    const T = homeTable();
    if (T.migrate && !((h.hv | 0) >= 2)) {
      try {
        h = T.migrate(JSON.parse(JSON.stringify(h)));
      } catch (e) {}
    }
    let v = 0;
    for (const n of [ h.tier | 0 ].concat(Array.isArray(h.owned) ? h.owned.map(q => q | 0) : [])) {
      const p = T.tiers[Math.max(0, Math.min(T.tiers.length - 1, n))] || 0;
      if (p > v) v = p;
    }
    for (const f of Array.isArray(h.furn) ? h.furn : []) {
      if (!f) continue;
      if (!f.builtin) v += Math.round((T.furn[f.kind] || 0) / 2);
      if (Array.isArray(f.items)) for (const it of f.items) v += itemValue(it);
      if (f.grid) v += gridValue(f.grid);
      if (f.kind === "kitchen") v += gasValue(f);
      if (Array.isArray(f.top)) for (const q of f.top.slice(0, 64)) if (q && typeof q.k === "string") v += Math.round(((T.small || {})[q.k] || 0) / 2);
    }
    if (h.small && typeof h.small === "object") for (const k of Object.keys(h.small)) v += Math.round(((T.small || {})[k] || 0) / 2) * Math.max(0, Math.min(T.smallMax || 999, h.small[k] | 0));
    for (const l of Array.isArray(h.loose) ? h.loose : []) if (l && Array.isArray(l.items)) for (const it of l.items) v += itemValue(it);
    {
      const S = SX.homeSurf, SP = S && S.PRICES ? Object.fromEntries(Object.entries(S.PRICES).map(([k, q]) => [ k, q | 0 ])) : {}, LG = S && typeof S.legacyIds === "function" ? S.legacyIds : null, seen = new Set, ids = [];
      for (const L of [ h.surfOwn, h.surfGift ]) if (Array.isArray(L)) for (const id of L.slice(0, 200)) ids.push(id);
      if (LG) try {
        for (const id of LG(h)) ids.push(id);
      } catch (e) {}
      for (const id of ids) {
        if (typeof id !== "string" || seen.has(id) || !SP[id]) continue;
        seen.add(id);
        v += Math.round(SP[id] / 2);
      }
    }
    return v;
  }
  W.freeRows = function(data) {
    const n = (data && data.ng) | 0;
    if (n <= 0) return 0;
    const P = SX.prog;
    return P && P.ngRows ? P.ngRows(n) | 0 : 2 * Math.min(4, n);
  };
  W.wealth = function(data, free) {
    if (!data || typeof data !== "object") return 0;
    let w = Math.max(0, +data.money || 0);
    w += gridValue(data.stash);
    const k = data.kit;
    if (k) for (const s of SLOTS) w += itemValue(k[s]);
    const fk = data.freeKeep;
    if (fk && typeof fk === "object") for (const s of SLOTS) w += itemValue(fk[s]);
    w += homeValue(data.home);
    for (const g of safeGrids(data)) w += gridValue(g);
    for (const g of creelGrids(data)) w += gridValue(g);
    w += kitValue(data);
    w += stashPaid(data.stash, free == null ? W.freeRows(data) : free);
    return Math.round(w);
  };
  W.itemValue = it => itemValue(it);
  W.defOf = defOf;
  W.names = () => [ ...table().keys() ];
  W.now = function() {
    const G = SX.game;
    if (!G || !G.save) return 0;
    let o = null;
    try {
      o = G.pack ? G.pack() : G.save;
      o = JSON.parse(JSON.stringify(o));
    } catch (e) {
      return 0;
    }
    return W.wealth(o);
  };
  W.price = function(name, who, p) {
    const T = SX.trade;
    if (!T || !T.isCure || !T.isCure(name)) return p;
    return T.curePrice(W.now(), who === "smuggle" ? "smuggle" : "med");
  };
})(window.SX);
