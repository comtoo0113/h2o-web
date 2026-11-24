"use strict";

(function(SX) {
  const NM = SX.needmark = {};
  const QH = SX.qhide = {};
  let qhm = {
    a: null,
    set: new Set
  };
  const qhArr = () => {
    const s = SX.game && SX.game.save, a = s && s.qhide;
    return Array.isArray(a) ? a : null;
  };
  QH.any = () => {
    const a = qhArr();
    return !!(a && a.length);
  };
  QH.hasKey = key => {
    const a = qhArr();
    if (!a || !a.length) return false;
    if (qhm.a !== a) qhm = {
      a,
      set: new Set(a)
    };
    return qhm.set.has(key);
  };
  QH.has = (k, id) => id != null && QH.hasKey(k + ":" + id);
  QH.set = function(keys, hide) {
    const G = SX.game, s = G && G.save;
    if (!s || !Array.isArray(keys)) return;
    keys = keys.filter(x => typeof x === "string" && /^[qs]:[\w-]{1,24}$/.test(x));
    const cur = (qhArr() || []).filter(x => typeof x === "string");
    s.qhide = (hide ? cur.concat(keys.filter(x => cur.indexOf(x) < 0)) : cur.filter(x => keys.indexOf(x) < 0)).slice(-300);
    if (SX.ui) {
      if (SX.ui.needDirty) SX.ui.needDirty();
      if (SX.ui.hudDirty) SX.ui.hudDirty();
    }
    if (SX.hub) SX.hub.markT = 0;
    if (G.inRaid && G.inRaid()) {
      try {
        const o = SX.save.load();
        if (o && o.v === 1) {
          o.qhide = s.qhide.slice();
          SX.save.write(o);
        }
      } catch (e) {}
    } else if (G.persist) G.persist();
  };
  const RC = SX.rcmark = {};
  let rcm = {
    a: null,
    set: new Set
  };
  const rcArr = () => {
    const s = SX.game && SX.game.save, a = s && s.rcmark;
    return Array.isArray(a) ? a : null;
  };
  RC.hasKey = key => {
    const a = rcArr();
    if (!a || !a.length) return false;
    if (rcm.a !== a) rcm = {
      a,
      set: new Set(a.map(x => "c:" + x))
    };
    return rcm.set.has(key);
  };
  RC.has = id => id != null && RC.hasKey("c:" + id);
  RC.list = () => (rcArr() || []).filter(x => typeof x === "string");
  RC.set = function(ids, on) {
    const G = SX.game, s = G && G.save, P = SX.prog;
    if (!s || !Array.isArray(ids)) return;
    ids = ids.filter(x => typeof x === "string" && /^[\w-]{1,24}$/.test(x) && !!(P && P.rById(x)));
    const cur = RC.list();
    s.rcmark = (on ? cur.concat(ids.filter(x => cur.indexOf(x) < 0)) : cur.filter(x => ids.indexOf(x) < 0)).slice(-100);
    NM.dirty();
    if (SX.ui && SX.ui.hudDirty) SX.ui.hudDirty();
    if (G.inRaid && G.inRaid()) {
      try {
        const o = SX.save.load();
        if (o && o.v === 1) {
          o.rcmark = s.rcmark.slice();
          SX.save.write(o);
        }
      } catch (e) {}
    } else if (G.persist) G.persist();
  };
  RC.toggle = id => RC.set([ id ], !RC.has(id));
  NM.KINDS = {
    quest: "의뢰",
    story: "이야기",
    eg: "작전",
    fac: "설비",
    craft: "만들기"
  };
  let memo = {
    at: -1e9,
    s: null,
    key: null,
    map: new Map
  };
  NM.on = () => !SX.opts || SX.opts.needMark !== false;
  function sig(s) {
    const q = s.quests || {}, st = s.story || {}, fs = s.fac || {};
    return [ (q.done || []).length, (st.done || []).length, Object.keys(st.act || {}).join(","), (s.eg && s.eg.n) | 0, Object.keys(fs).map(k => k + ":" + ((fs[k] && fs[k].lv) | 0)).join(","), Array.isArray(s.rcmark) ? s.rcmark.join(",") : "" ].join("|");
  }
  function build(s) {
    const P = SX.prog, map = new Map;
    const add = (name, k, t, n, id) => {
      if (!name || !(n > 0)) return;
      let L = map.get(name);
      if (!L) map.set(name, L = []);
      const o = L.find(r => r.k === k && r.t === t && r.id === id);
      if (o) o.n += n; else L.push(id ? {
        k,
        t,
        n,
        id
      } : {
        k,
        t,
        n
      });
    };
    try {
      for (const q of P.openList ? P.openList(s.quests) : Object.values(P.current(s.quests))) {
        if (q && q.kind === "fetch") add(q.item, "quest", q.name, q.n, "q:" + q.id);
      }
      const st = s.story || P.stNew();
      for (const id of Object.keys(st.act || {})) {
        const m = P.stById(id);
        if (!m) continue;
        const o = m.obj;
        if (o.kind === "fetch") for (const [n, c] of o.items) add(n, "story", m.name, c, "s:" + m.id); else if (o.kind === "find") add(o.item, "story", m.name, 1, "s:" + m.id);
      }
      for (const m of P.STORY) if (m.lead && P.stOpen(st, m)) add(m.lead.item, "story", m.name, 1, "s:" + m.id);
      if (P.stMainDone(st)) for (let i = (s.eg && s.eg.n) | 0; i < P.EG.length; i++) {
        const e = P.egOf ? P.egOf(i, st) : P.EG[i];
        for (const [n, c] of e.items) add(n, "eg", e.name, c);
      }
      const fs = s.fac || {};
      for (const f of P.FAC) {
        const lv = P.facLevel(fs, f.id), L = f.lv[lv];
        if (L && Array.isArray(L.items)) for (const [n, c] of L.items) add(n, "fac", f.name + " " + (lv + 1) + "단계", c);
      }
      const on = new Set(Array.isArray(s.rcmark) ? s.rcmark : []);
      for (const r of P.RECIPES) if (on.has(r.id) || !r.fac || P.facLevel(fs, r.fac[0]) >= r.fac[1]) for (const [n, c] of r.in) add(n, "craft", r.out[0][0], c, "c:" + r.id);
    } catch (e) {}
    return map;
  }
  NM.builds = 0;
  NM.map = function() {
    const s = SX.game && SX.game.save;
    if (!s) return memo.map;
    const now = performance.now();
    if (memo.s === s && now - memo.at < 300) return memo.map;
    const key = sig(s);
    if (memo.s !== s || key !== memo.key) {
      memo.map = build(s);
      memo.key = key;
      NM.builds++;
    }
    memo.s = s;
    memo.at = now;
    return memo.map;
  };
  NM.dirty = () => {
    memo.at = -1e9;
    memo.key = null;
  };
  NM.of = name => {
    if (!NM.on()) return null;
    const L = NM.map().get(name);
    if (!L) return null;
    const v = L.filter(r => r.k === "craft" ? RC.hasKey(r.id) : !(r.id && QH.hasKey(r.id)));
    return v.length ? v : null;
  };
  NM.kind = name => {
    const L = NM.of(name);
    return !L ? null : L.some(r => r.k !== "craft") ? "m" : "c";
  };
  NM.have = name => SX.prog.haveIn(SX.game.save, name);
  NM.need = L => L.filter(r => r.k !== "craft").reduce((t, r) => t + r.n, 0) + Math.max(0, ...L.filter(r => r.k === "craft").map(r => r.n));
  NM.text = L => "필요: " + L.map(r => NM.KINDS[r.k] + " 「" + r.t + "」 " + r.n + "개").join(" · ");
  NM.html = function(it) {
    const L = it && SX.game && SX.game.save ? NM.of(it.name) : null;
    if (!L) return "";
    return "<span class='needTip " + (NM.kind(it.name) === "c" ? "c" : "m") + "'>" + SX.esc(NM.text(L)) + " · " + SX.esc("가진 것 " + NM.have(it.name) + "개") + "</span>";
  };
  NM.sellAsk = function(it) {
    const L = it && NM.of(it.name);
    if (!L) return null;
    const have = NM.have(it.name), need = NM.need(L), after = Math.max(0, have - 1);
    if (after >= need) return null;
    return {
      title: "판매 전에",
      desc: SX.esc(it.name) + " — " + SX.esc(NM.text(L)) + "<br>" + SX.esc("팔면 가진 것이 " + after + "개가 됩니다(필요한 것 " + need + "개)."),
      labels: {
        q: "그래도 파시겠습니까?",
        yes: "판매",
        no: "그만두기"
      }
    };
  };
})(window.SX);
