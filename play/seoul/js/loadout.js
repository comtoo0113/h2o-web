"use strict";

(function(SX) {
  const I = SX.items, LO = SX.loadout = {};
  LO.MAX = 5;
  LO.NAME_MAX = 14;
  const SLOTS = [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig" ];
  const ORDER = [ "rig", "bag", "w1", "w2", "melee", "armor", "helmet" ];
  const won = n => SX.won(n), esc = s => SX.esc(s);
  const cleanList = L => (Array.isArray(L) ? L : []).filter(q => Array.isArray(q) && typeof q[0] === "string" && (q[1] | 0) > 0).slice(0, 60).map(q => [ q[0], Math.min(99, q[1] | 0) ]);
  LO.fix = function(save) {
    const out = [];
    for (const o of Array.isArray(save.loadouts) ? save.loadouts : []) {
      if (!o || typeof o !== "object" || !o.slots || typeof o.slots !== "object") continue;
      const slots = {};
      for (const s of SLOTS) {
        const w = o.slots[s];
        slots[s] = w && typeof w.n === "string" ? Array.isArray(w.mods) && w.mods.length ? {
          n: w.n,
          mods: w.mods.filter(m => typeof m === "string").slice(0, 8)
        } : {
          n: w.n
        } : null;
      }
      out.push({
        name: String(o.name || "").slice(0, LO.NAME_MAX) || "세트 " + (out.length + 1),
        at: +o.at || 0,
        slots,
        rig: cleanList(o.rig),
        bag: cleanList(o.bag),
        quick: (Array.isArray(o.quick) ? o.quick : []).slice(0, I.QUICK_N).map(n => typeof n === "string" ? n : null)
      });
      {
        const q = out[out.length - 1];
        if ("ins" in o) q.ins = !!o.ins;
        if ("merc" in o) q.merc = typeof o.merc === "string" ? o.merc : null;
      }
      if (out.length >= LO.MAX) break;
    }
    save.loadouts = out;
    return out;
  };
  LO.list = save => Array.isArray(save.loadouts) ? save.loadouts : LO.fix(save);
  const count = g => {
    const m = new Map;
    for (const e of g && g.list || []) {
      if (e.it.story) continue;
      m.set(e.it.name, (m.get(e.it.name) || 0) + 1);
    }
    return [ ...m ];
  };
  LO.capture = function(kit, name) {
    const slots = {};
    for (const s of SLOTS) {
      const it = kit[s];
      slots[s] = !it ? null : it.kind === "gun" && I.modsOf(it).length ? {
        n: it.name,
        mods: I.modsOf(it).map(m => m.name)
      } : {
        n: it.name
      };
    }
    return {
      name: String(name || "").slice(0, LO.NAME_MAX),
      at: Date.now(),
      slots,
      rig: count(kit.rig && kit.rig.grid),
      bag: count(kit.bag && kit.bag.grid),
      quick: kit.quick.map(id => {
        const it = id && I.kitFind(kit, id);
        return it ? it.name : null;
      })
    };
  };
  const autoTo = (save, o) => {
    o.ins = !!save.insAuto;
    o.merc = typeof save.mercAuto === "string" ? save.mercAuto : null;
    return o;
  };
  LO.newName = save => {
    const L = LO.list(save);
    for (let k = 1; k <= LO.MAX + 1; k++) {
      const n = "세트 " + k;
      if (!L.some(o => o.name === n)) return n;
    }
    return "세트";
  };
  LO.add = function(save, kit, name) {
    const L = LO.list(save);
    if (L.length >= LO.MAX) return {
      ok: false,
      msg: "장비 세트는 " + LO.MAX + "개까지입니다 — 하나를 지우거나 덮어써 주십시오"
    };
    const o = autoTo(save, LO.capture(kit, String(name || "").trim() || LO.newName(save)));
    L.push(o);
    return {
      ok: true,
      msg: "🎒 장비 세트 「" + o.name + "」을(를) 저장했습니다",
      o
    };
  };
  LO.overwrite = function(save, kit, i) {
    const L = LO.list(save);
    if (!L[i]) return {
      ok: false,
      msg: "없는 세트"
    };
    L[i] = autoTo(save, LO.capture(kit, L[i].name));
    return {
      ok: true,
      msg: "🎒 「" + L[i].name + "」을(를) 지금 장비로 바꿨습니다"
    };
  };
  LO.remove = function(save, i) {
    const L = LO.list(save);
    if (!L[i]) return false;
    L.splice(i, 1);
    return true;
  };
  LO.rename = function(save, i, name) {
    const L = LO.list(save), n = String(name || "").trim().slice(0, LO.NAME_MAX);
    if (!L[i] || !n) return false;
    L[i].name = n;
    return true;
  };
  LO.why = function() {
    const G = SX.game, H = SX.hub;
    if (G.state === "raid") return "판 안에서는 장비 세트를 쓸 수 없습니다 — 셸터 · 시장에서 씁니다";
    if (G.state !== "hub" || !H || H.scene !== "home" && H.scene !== "market") return "장비 세트는 셸터 · 시장에서 씁니다";
    if (H.fight) return "주먹 싸움 중에는 장비를 바꿀 수 없습니다";
    return "";
  };
  const yieldOf = d => d.kind === "ammo" ? d.one ? [ d.one, 1 ] : [ I.MAGS[d.cal], 3 ] : [ d.name, 1 ];
  LO.offers = function(save) {
    const out = [], D = SX.data, U = SX.ui;
    for (const st of D.stalls) {
      for (const d of st.always || []) if (!SX.trade || SX.trade.open(save, st.id, d.name)) out.push({
        where: st.name,
        def: d,
        price: SX.worth ? SX.worth.price(d.name, st.id, d.price) : d.price,
        row: null
      });
      for (const q of I.stockOf(save, st.id)) out.push({
        where: st.name,
        def: q.def,
        price: q.price,
        row: q.row
      });
    }
    if (U && U.smuggleRows) for (const [d, p] of U.smuggleRows()) out.push({
      where: "밀수꾼",
      def: d,
      price: p,
      row: null
    });
    if (U && U.foodRows) for (const [d, p] of U.foodRows()) out.push({
      where: "밥집",
      def: d,
      price: p,
      row: null
    });
    return out.filter(o => o.def && o.price > 0);
  };
  function build(save, kit, ps, opt) {
    opt = opt || {};
    const st = I.gridFrom(I.gridDump(save.stash)), k = I.kitFrom(I.kitDump(kit)), free = [];
    const q0 = k.quick.map(id => {
      const it = id && I.kitFind(k, id);
      return it ? it.name : null;
    });
    const orig = {};
    for (const s of SLOTS) {
      if (k[s]) {
        orig[s] = k[s];
        free.push(k[s]);
        k[s] = null;
      }
    }
    for (const c of free.slice()) if (c.grid) {
      for (const e of c.grid.list) free.push(e.it);
      c.grid.list = [];
    }
    k.quick = I.quickNew();
    const res = {
      kit: k,
      stash: st,
      got: 0,
      buys: [],
      miss: [],
      cost: 0,
      use: new Map,
      fail: ""
    };
    const OFF = opt.buy ? LO.offers(save) : [];
    const left = o => !o.row ? Infinity : (o.row.qty | 0) - (res.use.get(o.row) || 0);
    const miss = (name, n, why) => {
      const m = res.miss.find(q => q.name === name && q.why === why);
      if (m) m.n += n; else res.miss.push({
        name,
        n,
        why
      });
    };
    function take(pred, score) {
      let best = null, bs = -Infinity, inSt = false;
      for (const it of free) if (pred(it)) {
        const v = score(it) + .5;
        if (v > bs) {
          best = it;
          bs = v;
          inSt = false;
        }
      }
      for (const e of st.list) if (pred(e.it)) {
        const v = score(e.it);
        if (v > bs) {
          best = e.it;
          bs = v;
          inSt = true;
        }
      }
      if (!best) return null;
      if (inSt) I.take(st, best); else free.splice(free.indexOf(best), 1);
      if (best.grid && best.grid.list.length) {
        for (const e of best.grid.list) free.push(e.it);
        best.grid.list = [];
      }
      res.got++;
      return best;
    }
    function buy(name, need) {
      let best = null, bv = Infinity;
      for (const o of OFF) {
        const [yn, yc] = yieldOf(o.def);
        if (yn !== name || !(left(o) > 0)) continue;
        const v = o.price / Math.max(1, Math.min(yc, need));
        if (v < bv) {
          bv = v;
          best = o;
        }
      }
      if (!best) return null;
      const [yn, yc] = yieldOf(best.def), made = [];
      for (let q = 0; q < yc; q++) {
        const it = best.def.kind === "ammo" ? I.mk(yn) : I.mk(best.def);
        if (it) made.push(it);
      }
      if (!made.length) return null;
      if (best.row) res.use.set(best.row, (res.use.get(best.row) || 0) + 1);
      res.cost += best.price;
      let b = res.buys.find(q => q.offer === best);
      if (!b) {
        b = {
          name: yn,
          n: 0,
          where: best.where,
          item: best.def.name,
          times: 0,
          price: best.price,
          cost: 0,
          offer: best
        };
        res.buys.push(b);
      }
      b.times++;
      b.n += made.length;
      b.cost += best.price;
      for (let q = 1; q < made.length; q++) free.push(made[q]);
      return made[0];
    }
    const score = w => it => {
      if (it.kind === "gun") {
        const have = I.modsOf(it).map(m => m.name);
        return (w && w.mods || []).filter(n => have.indexOf(n) >= 0).length * 1e3 + I.wearOf(it);
      }
      if (it.kind === "armor" || it.kind === "helmet") return it.armorMax ? 100 * it.armor / it.armorMax : 0;
      if (it.kind === "mag") return it.ammo | 0;
      if (it.kind === "key") return it.uses == null ? 9 : it.uses | 0;
      return 0;
    };
    const usable = (it, n) => it.name === n && !it.story && !(it.kind === "mag" && !(it.ammo > 0));
    const why0 = opt.buy ? "좌판에 없습니다" : "가진 것이 없습니다";
    for (const s of ORDER) {
      const w = ps.slots && ps.slots[s];
      if (!w) continue;
      let it = take(x => usable(x, w.n) && I.slotAccepts(s, x), score(w));
      if (!it && opt.buy) {
        it = buy(w.n, 1);
        if (it && !I.slotAccepts(s, it)) {
          free.push(it);
          it = null;
        }
      }
      if (it) {
        it.rot = false;
        k[s] = it;
        if (it.folded) I.unfold(it);
      } else miss(w.n, 1, why0);
    }
    for (const s of SLOTS) {
      const o = orig[s], q = o ? free.indexOf(o) : -1;
      if (!k[s] && q >= 0) {
        free.splice(q, 1);
        k[s] = o;
      }
    }
    for (const s of [ "w1", "w2" ]) {
      const w = ps.slots && ps.slots[s], g = k[s];
      if (!w || !g || !w.mods) continue;
      for (const pn of w.mods) {
        if (I.modsOf(g).some(m => m.name === pn)) continue;
        let p = take(x => x.kind === "part" && x.name === pn, () => 0);
        if (!p && opt.buy) p = buy(pn, 1);
        if (!p) {
          miss(pn, 1, why0);
          continue;
        }
        const r = I.attach(g, p);
        if (!r.ok) {
          free.push(p);
          miss(pn, 1, "총에 안 맞습니다");
          continue;
        }
        if (r.old) free.push(r.old);
        if (r.spill) free.push(r.spill);
      }
    }
    for (const [c, list] of [ [ "rig", ps.rig || [] ], [ "bag", ps.bag || [] ] ]) {
      const g = k[c] && k[c].grid, alt = k[c === "rig" ? "bag" : "rig"] && k[c === "rig" ? "bag" : "rig"].grid;
      for (const [n, cnt] of list) {
        for (let q = 0; q < cnt; q++) {
          let it = take(x => usable(x, n), score(null));
          if (!it && opt.buy) {
            const probe = I.mk(n);
            if (probe && !(g && I.findSpot(g, probe) || alt && I.findSpot(alt, probe))) {
              miss(n, cnt - q, "가방에 자리가 없습니다");
              break;
            }
            it = buy(n, cnt - q);
          }
          if (!it) {
            miss(n, cnt - q, why0);
            break;
          }
          if (!(g && I.put(g, it) || alt && I.put(alt, it))) {
            free.push(it);
            miss(n, cnt - q, "가방에 자리가 없습니다");
            break;
          }
        }
      }
    }
    const taken = new Set;
    q0.forEach((n0, i) => {
      const n = (ps.quick || [])[i] || n0;
      if (!n) return;
      for (const g of I.kitGrids(k)) {
        const e = g.list.find(q => q.it.name === n && !taken.has(q.it.id));
        if (e) {
          k.quick[i] = e.it.id;
          taken.add(e.it.id);
          return;
        }
      }
    });
    let over = 0;
    for (const it of free) if (!I.put(st, it)) over++;
    if (over) res.fail = "보관함에 자리가 모자랍니다 — 내려놓을 것 " + over + "개가 들어갈 자리가 없습니다(보관함을 정리하거나 늘려 주십시오)";
    return res;
  }
  LO.plan = (save, kit, ps, opt) => build(save, kit, ps, opt);
  LO.apply = function(save, kit, ps, opt) {
    opt = opt || {};
    const r = build(save, kit, ps, opt);
    if (r.fail) return {
      ok: false,
      msg: r.fail,
      r
    };
    if (opt.max != null && r.cost > opt.max) return {
      ok: false,
      msg: "좌판 값이 바뀌었습니다 — 다시 확인해 주십시오",
      r,
      again: true
    };
    if (r.cost > (+save.money || 0)) return {
      ok: false,
      msg: "돈이 모자랍니다 — " + won(r.cost) + " 필요",
      r
    };
    save.stash.list = r.stash.list;
    for (const s of SLOTS) kit[s] = r.kit[s];
    kit.quick = r.kit.quick;
    if ("ins" in ps) save.insAuto = !!ps.ins;
    if ("merc" in ps) save.mercAuto = typeof ps.merc === "string" ? ps.merc : null;
    if (r.cost) {
      save.money = Math.round(save.money - r.cost);
      for (const [row, n] of r.use) row.qty = Math.max(0, (row.qty | 0) - n);
    }
    return {
      ok: true,
      r
    };
  };
  let el = null, view = null;
  LO.isOpen = () => !!el && !el.classList.contains("hidden");
  LO.close = function() {
    if (!el) return;
    el.classList.add("hidden");
    el.innerHTML = "";
    view = null;
    if (SX.ui && SX.ui.refresh) SX.ui.refresh();
  };
  LO.open = function() {
    const no = LO.why();
    if (no) {
      SX.log(no);
      SX.audio.play("denied");
      return false;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "loadout";
      el.className = "hidden";
      document.body.appendChild(el);
      el.addEventListener("mousedown", e => {
        if (e.target === el) LO.close();
      });
      el.addEventListener("click", onClick);
      el.addEventListener("change", onChange);
      addEventListener("keydown", e => {
        if (!LO.isOpen() || SX.ui.asking && SX.ui.asking()) return;
        const typing = e.target && e.target.tagName === "INPUT";
        if (e.code === "Escape") {
          e.preventDefault();
          if (view) {
            view = null;
            render();
          } else LO.close();
        } else if (typing && e.code === "Enter") e.target.blur();
        e.stopImmediatePropagation();
      }, true);
    }
    view = null;
    el.classList.remove("hidden");
    const tip = document.getElementById("tooltip");
    if (tip) tip.classList.add("hidden");
    SX.input.down.clear();
    render();
    SX.audio.play("zipper", {
      vol: .6
    });
    return true;
  };
  const SLOT_KO = () => I.SLOT_NAMES;
  function summary(o) {
    const parts = [];
    for (const s of SLOTS) {
      const w = o.slots[s];
      if (w) parts.push(SLOT_KO()[s] + " " + w.n + (w.mods && w.mods.length ? "(+" + w.mods.length + ")" : ""));
    }
    const inner = L => L.map(([n, c]) => n + " " + c).join(", ");
    let h = esc(parts.join(" · ") || "빈 세트");
    if (o.rig.length) h += "<br>" + esc("리그 속 — " + inner(o.rig));
    if (o.bag.length) h += "<br>" + esc("가방 속 — " + inner(o.bag));
    {
      const m = o.merc && (SX.data.mercs || []).find(x => x.id === o.merc), au = [ o.ins ? "보험 늘 들기" : "", m ? "같은 용병 " + m.name : "" ].filter(Boolean);
      if (au.length) h += "<br>" + esc("출격할 때 — " + au.join(" · "));
    }
    return h;
  }
  function status(save, kit, o) {
    const p = build(save, kit, o, {
      buy: true
    });
    if (p.fail) return "<b class='warn'>" + esc(p.fail) + "</b>";
    if (!p.buys.length && !p.miss.length) return "<b class='good'>가진 것으로 다 챙깁니다</b>";
    const t = [];
    if (p.buys.length) t.push("살 것 " + p.buys.reduce((s, b) => s + b.n, 0) + "개 · " + won(p.cost));
    if (p.miss.length) t.push("<b class='warn'>" + esc("구할 수 없는 것 " + p.miss.reduce((s, m) => s + m.n, 0) + "개") + "</b>");
    return t.join(" · ");
  }
  function render() {
    if (!el) return;
    const s = SX.game.save, kit = SX.game.kit, L = LO.list(s);
    if (view) return renderAsk();
    let h = `<div class="win loWin"><header><h2>🎒 장비 세트</h2><button class="x" data-lx>닫기 ✕</button></header><div class="body col">`;
    h += `<p class="small">🎒 한 번에 다시 챙기기 ${SX.ui.qm ? SX.ui.qm("지금 입고 든 장비를 세트로 저장해 두면 [꾸리기]로 한 번에 다시 챙깁니다.<br>보관함에 있는 것을 먼저 쓰고, 모자란 것은 지금 좌판에 있는 것으로 사서 채웁니다(사기 전에 묻습니다).<br>셸터 · 시장에서만 됩니다.") : ""}</p>`;
    h += `<div class="list loList">`;
    if (!L.length) h += `<p class="small loEmpty">저장한 세트가 없습니다 — 아래에서 지금 장비를 저장하십시오.</p>`;
    L.forEach((o, i) => {
      h += `<div class="li loRow"><span class="nm"><input class="loName" data-lname="${i}" maxlength="${LO.NAME_MAX}" value="${esc(o.name)}"><br><span class="small">${summary(o)}</span><br><span class="small">${status(s, kit, o)}</span></span>\n        <span class="loBtns"><button class="big" data-lgo="${i}">꾸리기</button><button data-lover="${i}">지금 장비로 바꾸기</button><button class="dim" data-ldel="${i}">지우기</button></span></div>`;
    });
    h += `</div><div class="row loNew"><input class="loName" data-lnew maxlength="${LO.NAME_MAX}" value="${esc(LO.newName(s))}"><button data-lsave ${L.length >= LO.MAX ? "disabled" : ""}>지금 장비를 새 세트로 저장</button><span class="small">${L.length}/${LO.MAX}</span></div>`;
    h += `</div></div>`;
    el.innerHTML = h;
  }
  function renderAsk() {
    const s = SX.game.save, o = LO.list(s)[view.i], p = view.plan;
    if (!o) {
      view = null;
      return render();
    }
    const short = p.cost > s.money;
    let h = `<div class="win loWin"><header><h2>「${esc(o.name)}」 꾸리기</h2><button class="x" data-lback>돌아가기</button></header><div class="body col">`;
    h += `<p class="small">보관함 · 지금 장비에서 챙기는 것 ${p.got}개 — 쓰지 않는 지금 장비는 보관함으로 갑니다.</p>`;
    if (p.buys.length) {
      h += `<h3><span>살 것</span><span class="small">지금 좌판에 있는 것 · 상점에서 사는 값 그대로</span></h3><div class="list loBuy">`;
      for (const b of p.buys) h += `<div class="li"><span class="nm">${esc(b.name)} ×${b.n}<br><span class="small">${esc(b.where + (b.item !== b.name ? " 「" + b.item + "」" : ""))}${b.times > 1 ? " · " + won(b.price) + " × " + b.times : ""}</span></span><span class="pr">${won(b.cost)}</span></div>`;
      h += `</div>`;
    }
    if (p.miss.length) {
      h += `<h3><span>구할 수 없는 것</span><span class="small">이번에는 빼고 꾸립니다</span></h3><div class="list loMiss">`;
      for (const m of p.miss) h += `<div class="li"><span class="nm">${esc(m.name)} ×${m.n}</span><span class="small">${esc(m.why)}</span></div>`;
      h += `</div>`;
    }
    h += `</div><div class="loFoot">`;
    if (p.buys.length) h += `<p class="askPrice">합계 <b class="money">${won(p.cost)}</b> · 가진 돈 ${won(s.money)} → <b class="${short ? "bad" : ""}">${short ? "모자랍니다" : won(s.money - p.cost)}</b></p>`;
    h += `<div class="row" style="justify-content:center">`;
    if (p.buys.length) h += `<button class="big" data-lbuy ${short ? "disabled" : ""}>사서 꾸리기 ${won(p.cost)}</button>`;
    h += `<button data-lnobuy>${p.buys.length ? "있는 것만 꾸리기" : "꾸리기"}</button><button data-lback>취소</button></div>`;
    h += `</div></div>`;
    el.innerHTML = h;
  }
  LO.go = function(i) {
    const s = SX.game.save, o = LO.list(s)[i];
    if (!o) return null;
    const no = LO.why();
    if (no) {
      SX.log(no);
      SX.audio.play("denied");
      return null;
    }
    const p = build(s, SX.game.kit, o, {
      buy: true
    });
    if (p.fail) {
      SX.log(p.fail, "bad");
      SX.audio.play("denied");
      return p;
    }
    if (!p.buys.length && !p.miss.length) {
      LO.run(i, false);
      return p;
    }
    view = {
      i,
      plan: p
    };
    render();
    SX.audio.play("paper", {
      vol: .6
    });
    return p;
  };
  LO.run = function(i, buy) {
    const s = SX.game.save, kit = SX.game.kit, o = LO.list(s)[i];
    if (!o) return {
      ok: false
    };
    const no = LO.why();
    if (no) {
      SX.log(no);
      SX.audio.play("denied");
      return {
        ok: false,
        msg: no
      };
    }
    const r = LO.apply(s, kit, o, {
      buy,
      max: buy && view && view.i === i ? view.plan.cost : null
    });
    if (!r.ok) {
      SX.log(r.msg, "bad");
      SX.audio.play("denied");
      if (r.again) {
        view = {
          i,
          plan: build(s, kit, o, {
            buy: true
          })
        };
        render();
      }
      return r;
    }
    const A = SX.actors, p = A && A.player;
    if (p && p.kit === kit) {
      p.reload = null;
      p.slot = kit.w1 ? "w1" : kit.w2 ? "w2" : "melee";
    }
    const nb = r.r.buys.reduce((t, b) => t + b.n, 0), nm = r.r.miss.reduce((t, m) => t + m.n, 0);
    SX.log("🎒 「" + o.name + "」 꾸렸습니다" + (nb ? " — 산 것 " + nb + "개 " + won(r.r.cost) : "") + (nm ? " · 못 구한 것 " + nm + "개" : ""), nm ? "warn" : "good");
    SX.audio.play("zipper");
    if (r.r.cost) SX.audio.play("buy");
    SX.game.persist();
    LO.close();
    if (SX.ui.afterChange) SX.ui.afterChange();
    return r;
  };
  function onClick(e) {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset, s = SX.game.save, kit = SX.game.kit, U = SX.ui;
    if (d.lx != null) {
      LO.close();
      return;
    }
    if (d.lback != null) {
      view = null;
      render();
      SX.audio.play("click");
      return;
    }
    if (d.lsave != null) {
      const inp = el.querySelector("[data-lnew]");
      const r = LO.add(s, kit, inp ? inp.value : "");
      SX.log(r.msg, r.ok ? "good" : "bad");
      SX.audio.play(r.ok ? "paper" : "denied");
      if (r.ok) SX.game.persist();
      render();
      return;
    }
    if (d.lgo != null) {
      LO.go(+d.lgo);
      return;
    }
    if (d.lbuy != null && view) {
      LO.run(view.i, true);
      return;
    }
    if (d.lnobuy != null && view) {
      LO.run(view.i, false);
      return;
    }
    if (d.lover != null) {
      const i = +d.lover, o = LO.list(s)[i];
      if (!o) return;
      U.ask("장비 세트 바꾸기", "「" + esc(o.name) + "」을(를) 지금 입고 든 장비로 바꿔 저장합니다.", 0, () => {
        const r = LO.overwrite(s, kit, i);
        SX.log(r.msg, "good");
        SX.audio.play("paper");
        SX.game.persist();
        render();
      }, null, {
        q: "바꾸시겠습니까?",
        yes: "바꾸기"
      });
      return;
    }
    if (d.ldel != null) {
      const i = +d.ldel, o = LO.list(s)[i];
      if (!o) return;
      U.ask("장비 세트 지우기", "「" + esc(o.name) + "」을(를) 지웁니다. 물건은 그대로 있습니다.", 0, () => {
        LO.remove(s, i);
        SX.audio.play("click");
        SX.game.persist();
        render();
      }, null, {
        q: "지우시겠습니까?",
        yes: "지우기"
      });
      return;
    }
  }
  function onChange(e) {
    const t = e.target;
    if (!t || t.dataset.lname == null) return;
    if (LO.rename(SX.game.save, +t.dataset.lname, t.value)) SX.game.persist(); else t.value = (LO.list(SX.game.save)[+t.dataset.lname] || {}).name || "";
  }
})(window.SX);
