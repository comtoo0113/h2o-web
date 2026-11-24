"use strict";

(function(SX) {
  const I = SX.items, V = SX.vault = {};
  const DAYMS = 864e5;
  V.SHAPES = {
    1: [ 1, 1 ],
    2: [ 2, 1 ],
    3: [ 3, 1 ],
    4: [ 4, 1 ],
    5: [ 5, 1 ],
    6: [ 3, 2 ],
    7: [ 4, 2, [ 7 ] ],
    8: [ 4, 2 ],
    9: [ 3, 3 ],
    10: [ 5, 2 ]
  };
  V.KEY_T = .9;
  const mark = g => {
    g.owned = true;
    g.safe = true;
    return g;
  };
  V.newSafe = () => ({
    ext: []
  });
  V.extGrid = function(n) {
    const sh = V.SHAPES[Math.max(1, Math.min(10, n | 0))] || [ n, 1 ], g = mark(I.grid(sh[0], sh[1]));
    if (sh[2]) g.off = sh[2].slice();
    return g;
  };
  V.of = function(save) {
    if (!save.safe || typeof save.safe !== "object") save.safe = V.newSafe();
    if (!Array.isArray(save.safe.ext)) save.safe.ext = [];
    return save.safe;
  };
  V.grids = save => V.of(save).ext.map(e => e.grid);
  V.summary = function(save, now) {
    const L = V.of(save).ext;
    now = now || Date.now();
    if (!L.length) return null;
    return {
      n: L.length,
      cells: L.reduce((s, e) => s + (e.n | 0), 0),
      left: Math.min(...L.map(e => e.until - now))
    };
  };
  V.dump = function(s) {
    if (!s) return null;
    const gd = g => Object.assign(I.gridDump(g), g.off ? {
      off: g.off.slice()
    } : {});
    return {
      ext: (s.ext || []).map(e => ({
        n: e.n,
        until: e.until,
        grid: gd(e.grid)
      }))
    };
  };
  V.from = function(o) {
    const s = V.newSafe();
    if (!o || typeof o !== "object") return s;
    const gf = (d, n) => {
      const g = mark(I.gridFrom(d));
      if (Array.isArray(d.off)) g.off = d.off.slice(); else if (n) {
        const sh = V.SHAPES[n];
        if (sh && sh[2]) g.off = sh[2].slice();
      }
      return g;
    };
    for (const e of Array.isArray(o.ext) ? o.ext.slice(0, 12) : []) if (e && e.grid) s.ext.push({
      n: e.n | 0,
      until: +e.until || 0,
      grid: gf(e.grid, e.n | 0)
    });
    if (o.grid && Array.isArray(o.grid.list) && o.grid.list.length) s.legacy = I.gridFrom(o.grid).list.map(q => q.it);
    return s;
  };
  V.legacy = function(save) {
    const s = V.of(save), L = s.legacy || [];
    delete s.legacy;
    if (!L.length) return 0;
    for (const it of L) {
      if (!I.put(save.stash, it)) SX.home.dropLoose(it);
    }
    SX.log("🔐 개인 금고가 바뀌었습니다(설비에서 나온 금고만 씁니다) — 예전 금고에 든 것 " + L.length + "개를 보관함으로 옮겼습니다", "warn");
    return L.length;
  };
  V.isSafe = g => !!(g && g.safe);
  V.leftText = function(ms) {
    if (ms <= 0) return "끝남";
    const m = Math.ceil(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60;
    return d ? d + "일 " + h + "시간" : h ? h + "시간 " + mm + "분" : mm + "분";
  };
  V.touch = function() {
    const G = SX.game;
    if (!G || !G.save) return;
    G.persist();
    if (G.state === "raid" && SX.raid && SX.raid.snapSave && SX.raid.on) SX.raid.snapSave();
  };
  V.kitCheck = function(it) {
    const G = SX.game, s = V.of(G.save);
    if (!it || it.kind !== "vaultkit") return "개인 금고가 아닙니다";
    if (G.state === "raid") return "개인 금고는 판 밖(셸터 · 장터)에서 씁니다";
    return null;
  };
  V.kitPlan = function(it) {
    const G = SX.game, now = Date.now(), L = V.of(G.save).ext.filter(e => e.until > now);
    const n = Math.max(1, Math.min(10, it.cells | 0 || 1)), days = SX.prog.vaultDays ? SX.prog.vaultDays(G.save.fac) : 1;
    const keep = L.filter(e => e.n === n).sort((a, b) => b.until - a.until)[0] || null;
    return {
      n,
      days,
      keep,
      old: L.filter(e => e !== keep)
    };
  };
  V.useKit = function(it, grid) {
    const G = SX.game, s = V.of(G.save), no = V.kitCheck(it);
    if (no) return {
      ok: false,
      msg: no
    };
    if (!grid || !I.take(grid, it)) return {
      ok: false,
      msg: "보관함 · 가방 · 리그에 넣은 뒤 쓰십시오"
    };
    V.tick();
    const p = V.kitPlan(it), n = p.n, days = p.days, now = Date.now();
    const e = p.keep || {
      n,
      until: now,
      grid: V.extGrid(n)
    };
    e.until = Math.max(e.until, now) + days * DAYMS;
    const L = [];
    for (const o of s.ext) if (o !== e) for (const q of o.grid.list.slice()) {
      I.take(o.grid, q.it);
      L.push(q);
    }
    L.sort((a, b) => b.it.w * b.it.h - a.it.w * a.it.h);
    let moved = 0, toStash = 0, toFloor = 0;
    for (const q of L) {
      if (I.put(e.grid, q.it, q.x, q.y, q.it.rot) || I.put(e.grid, q.it)) moved++; else if (I.put(G.save.stash, q.it)) toStash++; else {
        SX.home.dropLoose(q.it);
        toFloor++;
      }
    }
    s.ext.length = 0;
    s.ext.push(e);
    V.touch();
    const rest = (toStash ? " · " + toStash + "개는 자리가 없어 보관함으로" : "") + (toFloor ? " · " + toFloor + "개는 보관함 자리도 없어 셸터 바닥 더미로" : "");
    if (p.keep) return {
      ok: true,
      msg: "🔐 개인 금고(" + n + "칸)의 보존 기간에 " + days + "일을 더했습니다 — 남은 " + V.leftText(e.until - now) + (L.length ? " · 다른 금고에 든 것 " + moved + "개를 이 금고로 모았습니다" : "") + rest
    };
    if (p.old.length) return {
      ok: true,
      msg: "🔐 개인 금고가 " + n + "칸으로 바뀌었습니다 — " + days + "일 동안 남습니다" + (moved ? " · 든 것 " + moved + "개를 새 금고로 옮겼습니다" : "") + rest
    };
    return {
      ok: true,
      msg: "🔐 개인 금고(" + n + "칸)가 생겼습니다 — " + days + "일 동안 남습니다(지나면 금고가 사라지고 든 것은 보관함으로)"
    };
  };
  V.tick = function(now) {
    const G = SX.game;
    if (!G || !G.save || G.state === "raid" || G.state === "title") return 0;
    const s = V.of(G.save);
    now = now || Date.now();
    let n = 0;
    for (let k = s.ext.length - 1; k >= 0; k--) {
      const e = s.ext[k];
      if (e.until > now) continue;
      let toStash = 0, toFloor = 0;
      for (const q of e.grid.list.slice()) {
        I.take(e.grid, q.it);
        if (I.put(G.save.stash, q.it)) toStash++; else {
          SX.home.dropLoose(q.it);
          toFloor++;
        }
      }
      s.ext.splice(k, 1);
      n++;
      SX.log("🔐 개인 금고(" + e.n + "칸)의 보존 기간이 끝나 사라졌습니다" + (toStash || toFloor ? " — 든 것 " + (toStash ? toStash + "개는 보관함으로" : "") + (toStash && toFloor ? " · " : "") + (toFloor ? toFloor + "개는 보관함 자리가 없어 셸터 바닥에" : "") : ""), "warn");
    }
    if (n) {
      G.persist();
      if (SX.ui) {
        SX.ui.refresh && SX.ui.refresh();
        SX.ui.hudDirty && SX.ui.hudDirty();
      }
    }
    return n;
  };
  V.keyRoomOf = bid => (SX.KEY_ROOMS || []).find(k => k.b === bid) || null;
  V.rollVault = function(rng, kr) {
    const names = (kr.must || []).slice(), pool = (kr.pool || []).slice();
    while (names.length < kr.n && pool.length) names.push(pool.splice(rng.i(pool.length), 1)[0]);
    const out = [];
    for (const n of names) {
      const d = I.def(n);
      if (!d) continue;
      if (d.kind === "gun") {
        const g = I.mk(n);
        g.ammo = 0;
        g.wear = 80 + rng.i(21);
        out.push(g);
      } else if (d.kind === "armor" || d.kind === "helmet") out.push(I.mk(n, {
        armor: Math.round((d.armor || 30) * (.85 + rng.f() * .15))
      })); else out.push(I.mk(n));
    }
    return out.filter(Boolean);
  };
  V.pickKey = function(rng, bid) {
    const L = SX.KEY_ROOMS || [];
    if (!L.length) return null;
    const own = L.find(k => k.b === bid);
    return (own && rng.f() < .6 ? own : L[rng.i(L.length)]).key;
  };
  V.keyIn = function(kit, name) {
    const f = I.findInKit(kit, name);
    if (f) return f;
    for (const g of V.grids(SX.game.save)) {
      const e = g.list.find(q => q.it.name === name);
      if (e) return {
        grid: g,
        it: e.it
      };
    }
    return null;
  };
  V.usesOf = it => it.uses == null ? (I.def(it.name) || {}).uses || 1 : it.uses;
  V.job = null;
  V.startUnlock = function(F, d) {
    const G = SX.game, A = SX.actors, p = A.player;
    if (!p || !p.alive || V.job) return false;
    const k = V.keyIn(G.kit, d.key);
    if (!k) {
      SX.audio.play("doorLocked");
      SX.log("🔒 " + d.vault + " — 「" + d.key + "」이(가) 있어야 열립니다");
      return false;
    }
    V.job = {
      F,
      d,
      key: d.key,
      t: 0,
      x: p.x,
      y: p.y,
      f: p.floor
    };
    p.keyT = V.KEY_T;
    p.reload = null;
    SX.audio.play("keyTurn", {
      x: d.cx,
      y: d.cy,
      range: 10,
      vol: .9
    });
    A.noise(F, p.x, p.y, 3, true);
    return true;
  };
  V.CTRL_T = 1.5;
  V.startCtrl = function(F, pr) {
    const A = SX.actors, p = A.player;
    if (!p || !p.alive || V.job) return false;
    V.job = {
      ctrl: true,
      F,
      pr,
      t: 0,
      x: p.x,
      y: p.y,
      f: p.floor
    };
    p.typeT = V.CTRL_T;
    p.reload = null;
    SX.audio.play("beep", {
      x: pr.x + pr.w / 2,
      y: pr.y + pr.h / 2,
      range: 8,
      vol: .7
    });
    A.noise(F, p.x, p.y, 2, true);
    return true;
  };
  V.unlockTick = function(dt) {
    const j = V.job, A = SX.actors, p = A.player;
    if (!j) return;
    if (j.ctrl) {
      if (!p || !p.alive || p.floor !== j.f || Math.hypot(p.x - j.x, p.y - j.y) > .6) {
        V.job = null;
        if (p) p.typeT = 0;
        return;
      }
      j.t += dt;
      p.typeT = Math.max(.01, V.CTRL_T - j.t);
      if (j.t < V.CTRL_T) return;
      V.job = null;
      p.typeT = 0;
      if (SX.raid && SX.raid.ctrlOn) SX.raid.ctrlOn();
      return;
    }
    if (!p || !p.alive || p.floor !== j.f || Math.hypot(p.x - j.x, p.y - j.y) > .6 || !j.d.locked) {
      V.job = null;
      if (p) p.keyT = 0;
      return;
    }
    j.t += dt;
    p.keyT = Math.max(.01, V.KEY_T - j.t);
    if (j.t < V.KEY_T) return;
    V.job = null;
    p.keyT = 0;
    const G = SX.game, k = V.keyIn(G.kit, j.key);
    if (!k) return;
    j.d.locked = false;
    SX.map.toggleDoor(j.F, j.d, true);
    SX.audio.play("doorOpen", {
      vol: .8,
      mat: SX.doorPlace && SX.doorPlace.mat(j.F)
    });
    A.noise(j.F, p.x, p.y, 5, true);
    if (j.d.keep) {
      SX.log("🔓 " + j.d.vault + " 문을 열었습니다 — 「" + j.key + "」은(는) 닳지 않아 그대로 가지고 있습니다", "good");
      if (SX.ui) {
        SX.ui.refresh && SX.ui.refresh();
        SX.ui.hudDirty && SX.ui.hudDirty();
      }
      if (SX.raid && SX.raid.snapSave) SX.raid.snapSave();
      return;
    }
    const left = Math.max(0, V.usesOf(k.it) - 1);
    k.it.uses = left;
    if (left <= 0) {
      I.take(k.grid, k.it);
      G.kit.quick = G.kit.quick.map(q => q === k.it.id ? null : q);
      SX.log("🔓 " + j.d.vault + " 문을 열었습니다 — 「" + j.key + "」은(는) 다 닳아 부러졌습니다", "good");
    } else SX.log("🔓 " + j.d.vault + " 문을 열었습니다 — 「" + j.key + "」 남은 횟수 " + left + "번", "good");
    if (V.isSafe(k.grid)) V.touch(); else if (SX.raid && SX.raid.snapSave) SX.raid.snapSave();
    if (SX.ui) {
      SX.ui.refresh && SX.ui.refresh();
      SX.ui.hudDirty && SX.ui.hudDirty();
    }
  };
  V.cancelUnlock = function() {
    V.job = null;
    const p = SX.actors && SX.actors.player;
    if (p) {
      p.keyT = 0;
      p.typeT = 0;
    }
  };
  V.inVault = function(F, x, y) {
    const inR = r => !!r && x >= r.x0 && x <= r.x1 + .999 && y >= r.y0 && y <= r.y1 + .999;
    return !!F && (inR(F.vault && F.vault.r) || inR(F.ctrl && F.ctrl.r));
  };
})(window.SX);
