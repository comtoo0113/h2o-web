"use strict";

(function(SX) {
  const T = SX.settle = {};
  const esc = s => SX.esc(String(s == null ? "" : s)), won = n => SX.won(n);
  const now = () => SX.net && SX.net.now ? SX.net.now() : Date.now();
  const SKL = () => SX.skills && SX.skills.LIST || [];
  const GYM = () => SX.ui && SX.ui.GYM || [];
  const r3 = x => Math.round((+x || 0) * 1e3) / 1e3;
  const RUN_MAX = 60, DONE_MAX = 40, FAC_MAX = 40;
  const skSnap = () => {
    const o = {};
    if (SX.skills && SX.skills.lvf) for (const d of SKL()) o[d.id] = r3(SX.skills.lvf(d.id));
    return o;
  };
  const bdSnap = () => {
    const b = SX.game && SX.game.save && SX.game.save.body || {}, o = {};
    for (const g of GYM()) o[g.id] = r3(Math.max(0, Math.min(5, +b[g.id] || 0)));
    return o;
  };
  const snd = (n, o) => {
    try {
      if (SX.audio && SX.audio.play) SX.audio.play(n, o);
    } catch (e) {}
  };
  T.ensure = function() {
    const G = SX.game, s = G && G.save;
    if (!s || !SX.prog || !SX.prog.dayKey) return null;
    const d = SX.prog.dayKey(now());
    let t = s.today;
    if (!t || typeof t !== "object" || t.d !== d || !Array.isArray(t.runs)) {
      const rs = t && typeof t === "object" ? t.rs : null;
      t = s.today = {
        d,
        runs: [],
        sk0: skSnap(),
        bd0: bdSnap(),
        fac: [],
        done: []
      };
      if (rs) t.rs = rs;
    }
    if (!Array.isArray(t.fac)) t.fac = [];
    if (!Array.isArray(t.done)) t.done = [];
    if (!t.sk0 || typeof t.sk0 !== "object") t.sk0 = skSnap();
    if (!t.bd0 || typeof t.bd0 !== "object") t.bd0 = bdSnap();
    return t;
  };
  setInterval(() => {
    try {
      if (SX.game && SX.game.save) T.ensure();
    } catch (e) {}
  }, 3e4);
  T.raidStart = function(seed) {
    const t = T.ensure();
    if (t) t.rs = {
      id: seed,
      sk: skSnap()
    };
  };
  T.raidEnd = function(o) {
    o = o || {};
    const t = T.ensure();
    if (!t) return null;
    const sk0 = t.rs && t.rs.id === o.seed ? t.rs.sk : null;
    t.rs = null;
    const out = {
      sk0,
      sk1: skSnap()
    };
    if (o.train) return out;
    t.runs.push({
      w: o.win ? 1 : 0,
      g: o.win ? Math.round(+o.gained || 0) : 0,
      b: String(o.b || ""),
      s: o.secs | 0,
      k: o.kills | 0,
      n: o.searched | 0
    });
    if (t.runs.length > RUN_MAX) t.runs.splice(0, t.runs.length - RUN_MAX);
    const add = (k, name) => {
      name = String(name || "");
      if (name && !t.done.some(x => x[0] === k && x[1] === name)) t.done.push([ k, name ]);
    };
    const P = SX.prog;
    for (const e of o.qprog || []) if (e && e.q && e.before < e.q.n && e.before + e.add >= e.q.n) add(P.qById && P.qById(e.q.id) === e.q ? "q" : "d", e.q.name);
    for (const b of o.bars || []) if (b && b.a < b.n && b.v >= b.n) add(b.k, b.name);
    for (const l of o.lines || []) {
      const m = /도전 과제 「(.+?)」 — /.exec(String(l));
      if (m) add("f", m[1]);
    }
    if (t.done.length > DONE_MAX) t.done.splice(0, t.done.length - DONE_MAX);
    return out;
  };
  T.facGot = function(msg) {
    const t = T.ensure();
    if (!t) return;
    const m = /^(.+?) — (.+?) 받았습니다/.exec(String(msg || ""));
    if (!m) return;
    for (const part of m[2].split(" · ")) {
      const q = /^(.+) (\d+)$/.exec(part.trim());
      if (!q) continue;
      const e = t.fac.find(x => x[0] === q[1]);
      if (e) e[1] += +q[2]; else t.fac.push([ q[1], +q[2] ]);
    }
    if (t.fac.length > FAC_MAX) t.fac.splice(0, t.fac.length - FAC_MAX);
    if (SX.game && SX.game.persist) SX.game.persist();
  };
  T.icons = function(root) {
    if (!root || !SX.art || !SX.art.icon) return;
    for (const el of root.querySelectorAll("[data-ic]")) {
      if (el.firstChild) continue;
      try {
        const it = SX.items.mk(el.dataset.ic);
        if (!it) continue;
        const c = SX.art.icon(it);
        const cv = document.createElement("canvas");
        cv.width = c.width;
        cv.height = c.height;
        cv.getContext("2d").drawImage(c, 0, 0);
        el.appendChild(cv);
      } catch (e) {}
    }
  };
  const pc = x => Math.max(0, Math.min(100, x)).toFixed(1);
  const barHtml = (a, b) => `<span class="stlBar"><i style="width:${pc(a)}%"></i><i class="add" style="left:${pc(a)}%;width:${pc(b - a)}%"></i></span>`;
  T.skRow = function(name, a, b) {
    b = +b || 0;
    a = a == null ? b : Math.min(+a || 0, b);
    const MAX = SX.skills && SX.skills.MAX || 10, L0 = Math.floor(a + 1e-9), L1 = Math.floor(b + 1e-9), up = L1 > L0;
    const f1 = b >= MAX ? 100 : (b - L1) * 100, f0 = up ? 0 : b >= MAX ? 100 : (a - L0) * 100;
    const gain = !up && b > a + 5e-4 ? Math.max(1, Math.round((b - a) * 100)) : 0;
    const max = !up && a >= MAX;
    return `<div class="stlSk stlR${up ? " stlUp" : gain ? " stlGain" : " dim"}${max ? " stlMax" : ""}"><span class="stlSkN">${esc(name)}</span>${barHtml(f0, f1)}<span class="stlSkV">${up ? `${L0}→${L1}단계` : `${L1}단계`}</span><span class="stlSkG">${gain ? "+" + gain + "%" : max ? "끝" : ""}</span></div>`;
  };
  T.bdRow = function(name, a, b) {
    b = +b || 0;
    a = a == null ? b : Math.min(+a || 0, b);
    const up = b > a + 5e-4;
    return `<div class="stlSk stlR${up ? " stlUp" : " dim"}"><span class="stlSkN">${esc(name)}</span>${barHtml(a / 5 * 100, b / 5 * 100)}<span class="stlSkV">${up ? a.toFixed(1) + "→" + b.toFixed(1) : b.toFixed(1)}</span><span class="stlSkG">${up ? "+" + (b - a).toFixed(1) : ""}</span></div>`;
  };
  T.qRow = function(tag, name, a, v, n, hint) {
    const done = v >= n, pa = n ? a / n * 100 : 0, pv = n ? v / n * 100 : 0;
    return `<div class="stlQ stlR${done ? " done" : ""}"><div class="stlQT"><span class="stlTag">${tag}</span><span class="stlQN">${esc(name)}</span><span class="stlQV">${a}→${v} / ${n}</span></div>${barHtml(pa, pv)}${done ? `<div class="stlQD"><b class="good">다 했습니다</b><span class="small">${hint || ""}</span></div>` : ""}</div>`;
  };
  T.reveal = function(root, o) {
    o = o || {};
    if (!root) return;
    const rows = [ ...root.querySelectorAll(".stlR") ], money = root.querySelector("#stlMoney"), to = Math.round(+o.gained || 0);
    const setMoney = x => {
      if (money) money.textContent = (to >= 0 ? "+" : "") + won(x);
    };
    if (o.skip || !rows.length) {
      for (const e of rows) e.classList.add("on");
      setMoney(to);
      return;
    }
    if (o.win) snd("radioRoger", {
      vol: .9,
      delay: .05
    });
    root.classList.add("stlGo");
    const timers = [];
    let done = false, cnt = 0, swallow = false;
    const count = () => {
      if (!money) return;
      const t0 = performance.now(), D = 800;
      let last = 0;
      setMoney(0);
      const step = () => {
        if (done) return;
        const ts = performance.now(), k = Math.min(1, (ts - t0) / D), e = 1 - Math.pow(1 - k, 3);
        setMoney(Math.round(to * e));
        if (k < 1) {
          if (ts - last > 70) {
            last = ts;
            snd("click", {
              vol: .16,
              r: .9 + .4 * k
            });
          }
          cnt = setTimeout(step, 30);
        } else {
          cnt = 0;
          snd(to > 0 ? "buy" : "click", {
            vol: to > 0 ? .45 : .2
          });
        }
      };
      step();
    };
    const onKey = e => {
      if (done) return;
      if (!root.isConnected) {
        end();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      end();
    };
    const onDown = e => {
      if (done) return;
      if (!root.isConnected) {
        end();
        return;
      }
      const b = e.target && e.target.closest ? e.target.closest("button") : null;
      end();
      if (!b) {
        swallow = true;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const onClick = e => {
      if (swallow) {
        swallow = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const off = () => {
      removeEventListener("keydown", onKey, true);
      removeEventListener("pointerdown", onDown, true);
      setTimeout(() => removeEventListener("click", onClick, true), 600);
    };
    function end() {
      if (done) return;
      done = true;
      for (const x of timers) clearTimeout(x);
      if (cnt) clearTimeout(cnt);
      for (const e of rows) e.classList.add("on");
      setMoney(to);
      root.classList.remove("stlGo");
      off();
    }
    addEventListener("keydown", onKey, true);
    addEventListener("pointerdown", onDown, true);
    addEventListener("click", onClick, true);
    if (money) setMoney(0);
    rows.forEach((e, i) => timers.push(setTimeout(() => {
      if (done) return;
      if (!root.isConnected) {
        end();
        return;
      }
      e.classList.add("on");
      if (e.classList.contains("stlUp") && e.classList.contains("stlSk")) snd("skillUp", {
        vol: .6
      }); else snd("click", {
        vol: .1,
        r: .85 + Math.min(.5, i * .03)
      });
      if (money && e.contains(money)) count();
      if (i === rows.length - 1) timers.push(setTimeout(() => {
        if (!cnt) end(); else timers.push(setTimeout(end, 900));
      }, 60));
    }, 120 * (i + 1))));
    T.revealing = () => !done;
  };
  T.revealing = () => false;
  const bName = id => {
    const b = (SX.data.buildings || []).find(x => x.id === id);
    return b ? b.name : "건물";
  };
  const hm = ms => {
    const m = Math.max(1, Math.round(ms / 6e4)), h = Math.floor(m / 60);
    return h ? `${h}시간 ${m % 60}분` : `${m}분`;
  };
  function nextQuest(s) {
    const P = SX.prog, qs = s.quests || (P.qNew ? P.qNew() : null);
    if (!qs || !P.openList && !P.current) return "";
    const L = P.openList ? P.openList(qs) : Object.values(P.current(qs)), C = [];
    for (const q of L) {
      if (!q || SX.qhide && SX.qhide.has && SX.qhide.has("q", q.id)) continue;
      const p = Math.min(q.n, (qs.prog && qs.prog[q.id]) | 0), f = q.n ? p / q.n : 0;
      C.push({
        q,
        p,
        f
      });
    }
    C.sort((a, b) => b.f - a.f || b.p - a.p);
    if (C.length) return C.slice(0, 2).map(x => `<div class="stlNx"><span class="stlTag">의뢰</span><span class="stlNxN">${esc(x.q.name)}</span>${barHtml(0, x.f * 100)}<span class="stlNxV">${x.p} / ${x.q.n}</span></div>`).join("");
    const sn = P.stNow ? P.stNow(s.story, SX.ui && SX.ui.storyHands ? SX.ui.storyHands() : null) : null;
    if (sn && sn.m && sn.m.name) return `<div class="stlNx"><span class="stlTag">임무</span><span class="stlNxN">${esc(sn.m.name)}</span></div>`;
    return `<div class="stlNx dim"><span class="stlTag">의뢰</span><span class="stlNxN">남은 의뢰가 없습니다</span></div>`;
  }
  function nextFac(s, t) {
    const P = SX.prog;
    let fb = null;
    for (const f of P.FAC || []) {
      const lv = P.facLevel(s.fac, f.id);
      if (!lv) continue;
      const L = f.lv[Math.min(f.lv.length, lv) - 1];
      if (!L || !L.outs || !L.outs.length) continue;
      const fr = P.facFrac(s.fac, f.id, t);
      if (!fb || fr > fb.fr) fb = {
        f,
        fr
      };
    }
    if (!fb) return `<div class="stlNx dim"><span class="stlTag">설비</span><span class="stlNxN">아직 지은 설비가 없습니다</span></div>`;
    let tail;
    if (fb.fr >= 1) tail = `<span class="stlNxV good">가득 찼습니다</span>`; else {
      const k = P.facFrac(s.fac, fb.f.id, t + 6e5) - fb.fr, left = k > 0 ? (1 - fb.fr) / k * 6e5 : 0;
      tail = `<span class="stlNxV">${left ? `가득까지 ${hm(left)}` : Math.round(fb.fr * 100) + "%"}</span>`;
    }
    return `<div class="stlNx"><span class="stlTag">설비</span><span class="stlNxN">${esc(fb.f.name)}</span>${barHtml(0, fb.fr * 100)}${tail}</div>`;
  }
  function nextWeek(t) {
    if (!SX.week || !SX.week.hubRow) return "";
    const box = document.createElement("div");
    try {
      SX.week.hubRow(box, t);
    } catch (e) {
      return "";
    }
    return box.innerHTML ? `<div class="stlNx stlWk">${box.innerHTML}</div>` : "";
  }
  const DONE_TAG = {
    q: "의뢰",
    d: "과제",
    s: "임무",
    b: "현상금",
    f: "도전 과제"
  };
  T.dayHtml = function() {
    const G = SX.game, s = G.save, t = T.ensure();
    if (!t) return "";
    const tn = now(), runs = t.runs || [], ext = runs.filter(x => x.w).length, lost = runs.length - ext, sum = runs.reduce((a, x) => a + (x.w ? +x.g || 0 : 0), 0);
    const mx = Math.max(1, ...runs.map(x => Math.abs(+x.g || 0)));
    const RN = runs.slice(-10), skip = runs.length - RN.length;
    const runRows = RN.length ? RN.map((x, i) => `<div class="stlRunR${x.w ? x.g < 0 ? " neg" : "" : " lose"}"><span class="stlRunI">${skip + i + 1}</span><span class="stlRunB">${esc(bName(x.b))}</span>${barHtml(0, x.w ? Math.max(2, Math.abs(+x.g || 0) / mx * 100) : 0)}<span class="stlRunV">${x.w ? (x.g < 0 ? "−" : "+") + won(Math.abs(+x.g || 0)) : "의식을 잃음"}</span></div>`).join("") + (skip ? `<p class="small stlMore">앞의 ${skip}판은 줄였습니다</p>` : "") : `<p class="small stlNone">오늘은 아직 다녀온 판이 없습니다</p>`;
    const sk1 = skSnap(), bd1 = bdSnap();
    const skRows = SKL().map(d => T.skRow(d.name, t.sk0[d.id], sk1[d.id])).join("");
    const bdRows = GYM().map(g => T.bdRow(g.stat, t.bd0[g.id], bd1[g.id])).join("");
    const facRows = t.fac.length ? t.fac.map(([n, k]) => `<div class="stlChip"><span class="stlIc" data-ic="${esc(n)}"></span><span class="stlChipN">${esc(n)}</span><span class="stlChipK">×${k | 0}</span></div>`).join("") : `<p class="small stlNone">오늘은 아직 받은 것이 없습니다</p>`;
    const doneRows = t.done.length ? t.done.map(([k, n]) => `<div class="stlDone"><span class="stlTag k-${esc(k)}">${DONE_TAG[k] || ""}</span><span class="stlDoneN">${esc(n)}</span></div>`).join("") : `<p class="small stlNone">오늘은 아직 끝낸 것이 없습니다</p>`;
    const inf = Math.max(0, Math.min(100, +s.infect || 0)), hrs = Math.max(0, (100 - inf) / 100 * SX.data.infectFullMs / 36e5);
    return `<div class="win stlDay"><header><h2>오늘 결산</h2><span class="small">한국 시각 0시부터</span></header><div class="body">\n      <div class="stlTiles">\n        <div class="stlTile"><b>${runs.length}</b><span>다녀온 판</span></div>\n        <div class="stlTile good"><b>${ext}</b><span>살아 나옴</span></div>\n        <div class="stlTile bad"><b>${lost}</b><span>의식을 잃음</span></div>\n        <div class="stlTile gold"><b>${sum < 0 ? "−" : "+"}${won(Math.abs(sum))}</b><span>오늘 들고 나온 값</span></div>\n      </div>\n      <div class="stlCols">\n        <section class="stlBox"><h3>판마다 들고 나온 값</h3>${runRows}</section>\n        <section class="stlBox"><h3>오늘 오른 것</h3><div class="stlSub">숙련</div>${skRows}<div class="stlSub">헬스</div>${bdRows}</section>\n        <section class="stlBox"><h3>설비에서 받은 것</h3><div class="stlChips">${facRows}</div><h3>끝낸 것</h3><div class="stlDones">${doneRows}</div></section>\n      </div>\n      <div class="stlCols2">\n        <section class="stlBox stlInf"><h3>감염 게이지</h3><span class="stlBar bad"><i style="width:${pc(inf)}%"></i></span><div class="stlInfT"><span>감염 ${inf.toFixed(1)}%</span><span class="small">접속 ${hrs.toFixed(1)}시간 남음</span></div></section>\n        <section class="stlBox stlNext"><h3>다음에 할 만한 것</h3>${nextQuest(s)}${nextFac(s, tn)}${nextWeek(tn)}</section>\n      </div>\n      <div class="stlFoot"><button class="big" id="stlDayOk">닫기</button></div>\n    </div></div>`;
  };
  T.dayWin = function() {
    if (!SX.ui || !SX.ui.open || !SX.game || !SX.game.save) return false;
    if (SX.game.state !== "hub" || SX.ui.panelKind && SX.ui.panelKind !== "settle") return false;
    const h = T.dayHtml();
    if (!h) return false;
    SX.ui.open("settle", h);
    const root = document.querySelector("#panel .stlDay");
    T.icons(root);
    const b = document.getElementById("stlDayOk");
    if (b) b.onclick = () => {
      SX.audio.play("click");
      SX.ui.closePanel();
    };
    return true;
  };
})(window.SX);
