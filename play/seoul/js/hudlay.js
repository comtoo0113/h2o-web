"use strict";

(function(SX) {
  const U = SX.ui, $ = id => document.getElementById(id), esc = SX.esc;
  const IT = [ {
    k: "bars",
    sel: "#hudBars",
    n: "체력 · 기력 막대",
    on: true,
    o: "0 0",
    subs: [ {
      k: "helpRow",
      sel: "#hudHelpRow",
      n: "사람 수 · 도움말 단추",
      on: false
    } ]
  }, {
    k: "inj",
    sel: "#hudInj",
    n: "다친 곳 · 약 효과",
    on: true,
    o: "0 0"
  }, {
    k: "icons",
    sel: "#hudIcons",
    n: "상태 아이콘 줄",
    on: false,
    o: "0 0"
  }, {
    k: "map",
    sel: "#hudMapBox",
    n: "작은 지도",
    on: false,
    o: "100% 0"
  }, {
    k: "info",
    sel: "#hudInfo",
    n: "오른쪽 위 정보",
    on: true,
    o: "100% 0",
    subs: [ {
      k: "time",
      sel: "#hudInfo .hiTime",
      n: "시간 · 낮밤 · 날씨",
      on: false
    }, {
      k: "gas",
      sel: "#hudInfo .hiGas",
      n: "가스 · 연기 · 물 높이",
      on: false
    }, {
      k: "eta",
      sel: "#hudInfo .hiEta",
      n: "내 층에 차기까지",
      on: false
    }, {
      k: "lock",
      sel: "#hudInfo .hiLock",
      n: "출구 막히기까지",
      on: false
    }, {
      k: "ping",
      sel: "#hudInfo .hiPing",
      n: "핑 안내",
      on: false
    }, {
      k: "team",
      sel: "#hudInfo .hiTeam",
      n: "우리 팀 · 적 팀 수",
      on: false
    }, {
      k: "trk",
      sel: "#hudInfo .trk",
      n: "추적 중",
      on: true
    }, {
      k: "need",
      sel: "#hudInfo .need",
      n: "찾을 물건",
      on: true
    } ]
  }, {
    k: "weapon",
    sel: "#hudWeapon",
    n: "무기 칸",
    on: true,
    o: "100% 100%",
    subs: [ {
      k: "wpMode",
      sel: "#wpMode",
      n: "사격 방식 · 탄 종류",
      on: false
    } ]
  }, {
    k: "quick",
    sel: "#hudQuick",
    n: "단축 칸",
    on: true,
    o: "0 100%"
  }, {
    k: "log",
    sel: "#hudLog",
    n: "알림 줄",
    on: true,
    o: "0 100%"
  }, {
    k: "msg",
    sel: "#msgBox",
    n: "무전 기록(대화)",
    on: true,
    o: "0 100%"
  } ];
  const HUB_NO = {
    map: 1,
    time: 1,
    gas: 1,
    eta: 1,
    lock: 1,
    ping: 1,
    team: 1
  };
  const ITH = IT.filter(it => !HUB_NO[it.k]).map(it => Object.assign({}, it, {
    on: true,
    subs: it.subs && it.subs.filter(q => !HUB_NO[q.k]).map(q => Object.assign({}, q, {
      on: true
    }))
  }));
  ITH.splice(ITH.findIndex(it => it.k === "icons") + 1, 0, {
    k: "fac",
    sel: "#hudFac",
    n: "설비 불빛",
    on: true,
    o: "0 0"
  });
  const mk = (id, items, key, live, edc, name, note) => {
    const ALL = [], BY = {};
    for (const it of items) {
      ALL.push(it);
      for (const s of it.subs || []) {
        s.par = it;
        ALL.push(s);
      }
    }
    for (const it of ALL) BY[it.k] = it;
    return {
      id,
      IT: items,
      ALL,
      BY,
      key,
      live,
      edc,
      PE: "body.hudedit." + edc + " ",
      name,
      note
    };
  };
  const PLS = {
    raid: mk("raid", IT, "hud", "body.inraid:not(.hudedit) ", "heRaid", "인게임(건물 안) UI 배치 · 크기 · 켜고 끄기", "여기서 바꾼 것은 건물 안(판)에서만 쓰입니다."),
    hub: mk("hub", ITH, "hudHub", "body.inhub:not(.hudedit) ", "heHub", "셸터 · 장터 UI 배치 · 크기 · 켜고 끄기", "여기서 바꾼 것은 셸터와 장터에서만 쓰입니다.")
  };
  const pk = pl => PLS[pl] || PLS.raid;
  const S_MIN = .5, S_MAX = 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const H = SX.hudLay = {
    IT,
    BY: PLS.raid.BY,
    ALL: PLS.raid.ALL,
    ITH,
    BYH: PLS.hub.BY,
    ALLH: PLS.hub.ALL,
    PLS,
    S_MIN,
    S_MAX,
    editing: false
  };
  const raw = p => SX.opts && SX.opts[p.key] && typeof SX.opts[p.key] === "object" ? SX.opts[p.key] : {};
  H.get = (k, pl) => {
    const p = pk(pl), it = p.BY[k], o = raw(p)[k] || {};
    if (!it) return {
      on: false,
      s: 1,
      x: 0,
      y: 0
    };
    return {
      on: typeof o.on === "boolean" ? o.on : it.on,
      s: +o.s >= S_MIN && +o.s <= S_MAX ? +o.s : 1,
      x: !it.par && Number.isFinite(+o.x) ? clamp(+o.x, -1, 1) : 0,
      y: !it.par && Number.isFinite(+o.y) ? clamp(+o.y, -1, 1) : 0
    };
  };
  H.set = function(k, ch, keep, pl) {
    const p = pk(pl), it = p.BY[k];
    if (!it) return;
    const v = Object.assign(H.get(k, pl), ch), o = {}, h = Object.assign({}, raw(p));
    if (v.on !== it.on) o.on = !!v.on;
    v.s = clamp(Math.round(v.s * 100) / 100, S_MIN, S_MAX);
    if (Math.abs(v.s - 1) > .001) o.s = v.s;
    if (!it.par) {
      if (Math.abs(v.x) > 1e-4) o.x = Math.round(v.x * 1e4) / 1e4;
      if (Math.abs(v.y) > 1e-4) o.y = Math.round(v.y * 1e4) / 1e4;
    }
    if (Object.keys(o).length) h[k] = o; else delete h[k];
    if (Object.keys(h).length) SX.opts[p.key] = h; else delete SX.opts[p.key];
    H.apply();
    if (!keep) SX.saveOpts();
  };
  H.changed = pl => Object.keys(raw(pk(pl))).length > 0;
  H.resetAll = pl => {
    delete SX.opts[pk(pl).key];
    H.apply();
  };
  function cssOf(p) {
    const PL = p.live, PE = p.PE, P = `:is(${PL.trim()}, ${PE.trim()}) `;
    let css = "";
    for (const it of p.ALL) {
      const v = H.get(it.k, p.id), sel = it.sel;
      if (!v.on) css += `${PL}${sel}{display:none!important}${PE}${sel}{opacity:.35}`;
      if (it.par) {
        if (v.s !== 1) css += `${P}${sel}{zoom:${v.s}}`;
        continue;
      }
      const d = [];
      if (v.x || v.y) d.push(`translate:${(v.x * 100).toFixed(3)}vw ${(v.y * 100).toFixed(3)}vh`);
      if (v.s !== 1) d.push(`scale:${v.s}`, `transform-origin:${it.o}`);
      if (d.length) css += `${P}${sel}{${d.join(";")}}`;
    }
    if (p.id === "raid") css += `${P}#hudInfo{top:calc(var(--u)*${H.get("map", "raid").on ? 102 : 6})}`;
    const offIn = p.BY.info.subs.filter(s => !H.get(s.k, p.id).on).map(s => s.sel.slice(8).trim());
    if (p.id === "raid" || offIn.length) css += `${PL}#hudInfo:not(:has(> :not(${offIn.length ? offIn.join(",") : ".heNone"}))){display:none!important}`;
    return css;
  }
  H.css = () => cssOf(PLS.raid) + cssOf(PLS.hub);
  H.apply = function() {
    let st = $("hudLayCss");
    if (!st) {
      st = document.createElement("style");
      st.id = "hudLayCss";
      st.setAttribute("data-notr", "");
      document.body.appendChild(st);
    }
    const css = H.css();
    if (st.textContent !== css) st.textContent = css;
  };
  let etaT = 0;
  function upEta() {
    const d = $("termEta");
    if (!d) {
      clearInterval(etaT);
      etaT = 0;
      return;
    }
    const hi = $("hudInfo"), pick = (c, cls) => {
      const e = hi && hi.querySelector(c);
      return e && e.textContent.trim() ? `<div class="${cls}">${e.innerHTML}</div>` : "";
    };
    const h = pick(".hiEta", "gas") + pick(".hiLock", "lock");
    if (d.dataset.h !== h) {
      d.dataset.h = h;
      d.innerHTML = h;
    }
  }
  H.mapEta = function(scr) {
    if (SX.opts.mapEta === false || !scr) return;
    const d = document.createElement("div");
    d.id = "termEta";
    d.className = "termEta";
    scr.appendChild(d);
    upEta();
    clearInterval(etaT);
    etaT = setInterval(upEta, 250);
  };
  let ed = null;
  const rectOf = it => {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const e of document.querySelectorAll(it.sel)) {
      const q = e.getBoundingClientRect();
      if (q.width < 1 && q.height < 1) continue;
      l = Math.min(l, q.left);
      t = Math.min(t, q.top);
      r = Math.max(r, q.right);
      b = Math.max(b, q.bottom);
    }
    return r > l ? {
      left: l,
      top: t,
      right: r,
      bottom: b,
      width: r - l,
      height: b - t
    } : null;
  };
  function fillSample(p) {
    const sv = [], keep = (id, extra) => {
      const e = $(id);
      if (!e) return null;
      sv.push({
        e,
        h: e.innerHTML,
        ds: Object.assign({}, e.dataset),
        st: e.getAttribute("style")
      });
      return e;
    };
    const lb = a => esc(SX.label ? SX.label(a) : "Z");
    let e;
    if (e = keep("hpFill")) e.style.width = "100%";
    if (e = keep("stFill")) e.style.width = "100%";
    if (e = keep("hpTxt")) e.textContent = "100";
    if (e = keep("hudIcons")) {
      e.innerHTML = "";
      for (const [n, c, t] of [ [ "virus", "#8fd14a", "24%" ], [ "armor", "#8a9a6a", "40" ], [ "light", "#f0f0a0", "" ] ]) {
        const d = document.createElement("div");
        d.className = "ic";
        try {
          const cv = document.createElement("canvas");
          cv.width = 16;
          cv.height = 16;
          cv.getContext("2d").drawImage(SX.art.hud(n, c), 0, 0);
          d.appendChild(cv);
        } catch (x) {}
        if (t) d.appendChild(document.createTextNode(t));
        e.appendChild(d);
      }
    }
    if (p.id === "hub" && (e = keep("hudFac")) && !e.querySelector(".led")) e.innerHTML = "<span class='facLbl'>설비</span><i class='fac led green full'></i><i class='fac led off'></i><i class='fac led off'></i>";
    if (e = keep("hudInj")) e.innerHTML = `<div class="inj"><div><b>왼팔 출혈</b><small>→ 붕대</small></div></div>`;
    if (e = keep("hudInfo")) e.innerHTML = (p.id !== "raid" ? "" : `<div class="hiTime">00:12 · 밤 · 비</div><div class="gas hiGas">가스: 지하</div><div class="gas hiEta">1층에 차기까지 2:06</div>` + `<div class="lock hiLock">1층 봉쇄까지 63초</div><div class="small hiPing">[${lb("ping")}] 핑 · 지도 누르기 = 핑</div><div class="small hiTeam" style="color:#6ec0ff">🌐 우리 팀 2명</div>`) + `<div class="trk"><div>📌 추적 중</div><div>· 의뢰 — 물 구하기 <b>1/3</b></div></div><div class="need"><div>📋 찾을 물건</div><div>· 생수 <b>1/3</b></div></div>`;
    if (e = keep("wpName")) e.textContent = "K2 소총";
    if (e = keep("wpAmmo")) e.textContent = "30 / 120";
    if (e = keep("wpMode")) e.innerHTML = "<span>자동 · 5.56mm</span>";
    if ((e = keep("hudQuick")) && !e.querySelector(".qs")) {
      e.innerHTML = [ 1, 2, 3, 4, 5 ].map(i => `<div class="qs"><b>${i}</b></div>`).join("");
    }
    if (p.id === "raid" && (e = keep("hudMapHead")) && !(SX.game.state === "raid" && SX.raid && SX.raid.level)) {
      e.innerHTML = "<span>1층 / 5층</span><span>작은 지도</span>";
      const cv = $("hudMap");
      if (cv) {
        const g = cv.getContext("2d");
        g.fillStyle = "#0e1410";
        g.fillRect(0, 0, cv.width, cv.height);
        g.strokeStyle = "#2a3a2c";
        for (let i = 0; i <= cv.width; i += 24) {
          g.beginPath();
          g.moveTo(i + .5, 0);
          g.lineTo(i + .5, cv.height);
          g.moveTo(0, i + .5);
          g.lineTo(cv.width, i + .5);
          g.stroke();
        }
      }
    }
    const lg = $("hudLog");
    if (lg) {
      const d = document.createElement("div");
      d.className = "heSample";
      d.textContent = "알림 줄 — 생수를 주웠습니다";
      lg.appendChild(d);
    }
    return sv;
  }
  function restore(sv) {
    for (const q of sv) {
      q.e.innerHTML = q.h;
      for (const k of Object.keys(q.e.dataset)) delete q.e.dataset[k];
      Object.assign(q.e.dataset, q.ds);
      if (q.st == null) q.e.removeAttribute("style"); else q.e.setAttribute("style", q.st);
      delete q.e.dataset.k;
      delete q.e.dataset.h;
    }
    for (const d of document.querySelectorAll("#hudLog .heSample")) d.remove();
  }
  const pct = s => Math.round(s * 100) + "%";
  const gv = k => H.get(k, ed.p.id), sv = (k, ch, keep) => H.set(k, ch, keep, ed.p.id);
  function rowHtml(it) {
    const v = gv(it.k);
    return `<div class="heRow${it.par ? " sub" : ""}${v.on ? "" : " off"}" data-k="${it.k}"><button class="heTg${v.on ? " on" : ""}" data-tg="${it.k}">${v.on ? "켬" : "끔"}</button>` + `<span class="heN" data-pick="${it.k}">${esc(it.n)}</span><input type="range" min="${S_MIN * 100}" max="${S_MAX * 100}" step="5" value="${Math.round(v.s * 100)}" data-s="${it.k}"><em>${pct(v.s)}</em>` + `<button data-rs="${it.k}" title="${it.par ? "처음 크기" : "처음 자리 · 크기"}">↺</button></div>`;
  }
  function paintList() {
    const box = ed && ed.root.querySelector(".heRows");
    if (!box) return;
    const sc = box.scrollTop;
    box.innerHTML = ed.p.ALL.map(rowHtml).join("");
    box.scrollTop = sc;
    markSel();
  }
  function paintRow(k) {
    const old = ed && ed.root.querySelector(`.heRow[data-k="${k}"]`);
    if (!old) return;
    const t = document.createElement("div");
    t.innerHTML = rowHtml(ed.p.BY[k]);
    old.replaceWith(t.firstChild);
    markSel();
  }
  function markSel() {
    if (!ed) return;
    for (const r of ed.root.querySelectorAll(".heRow")) r.classList.toggle("sel", r.dataset.k === ed.sel);
  }
  function select(k, scroll) {
    ed.sel = k;
    markSel();
    if (scroll) {
      const r = ed.root.querySelector(`.heRow[data-k="${k}"]`);
      if (r && r.scrollIntoView) r.scrollIntoView({
        block: "nearest"
      });
    }
  }
  function ctlHtml() {
    const it = ed.p.BY[ed.sel], v = gv(it.k);
    return `<b>${esc(it.n)}</b><button data-sm="${it.k}">−</button><em>${pct(v.s)}</em><button data-sp="${it.k}">+</button>` + `<button data-tg="${it.k}">${v.on ? "끄기" : "켜기"}</button><button data-rs="${it.k}">${it.par ? "처음 크기" : "처음 자리"}</button>`;
  }
  function loop() {
    if (!ed) return;
    if (U.panelKind !== "hudedit") {
      endEdit(false);
      return;
    }
    ed.raf = requestAnimationFrame(loop);
    const W = innerWidth, Hh = innerHeight;
    const A = ed.p.ALL;
    for (const it of A) {
      const f = ed.fr[it.k], r = rectOf(it), v = gv(it.k);
      if (!r) {
        f.style.display = "none";
        continue;
      }
      f.style.display = "";
      f.style.left = r.left + "px";
      f.style.top = r.top + "px";
      f.style.width = r.width + "px";
      f.style.height = r.height + "px";
      f.classList.toggle("off", !v.on);
      f.classList.toggle("sel", ed.sel === it.k);
      f.classList.toggle("lb", r.top < (f.firstChild.offsetHeight || 14) + 2);
      f.classList.toggle("drag", !!(ed.drag && ed.drag.k === it.k));
      const lbt = it.n + (v.on ? "" : " · 꺼짐") + (v.s !== 1 ? " · " + pct(v.s) : "");
      if (f.dataset.t !== lbt) {
        f.dataset.t = lbt;
        f.firstChild.textContent = lbt;
      }
    }
    const placed = [], hitL = (l, t, r, b) => placed.find(o => l < o.r + 2 && r > o.l - 2 && t < o.b && b > o.t);
    for (const it of A) {
      const f = ed.fr[it.k];
      if (f.style.display === "none") continue;
      const i = f.firstChild, sh = +i.dataset.sh || 0;
      const at = () => {
        const q = i.getBoundingClientRect(), w = q.right - q.left, L = q.left - sh;
        let x = L;
        if (x + w > W - 2) x = W - 2 - w;
        if (x < 2) x = 2;
        return {
          q,
          w,
          L,
          x
        };
      };
      let m = at();
      if (hitL(m.x, m.q.top, m.x + m.w, m.q.bottom)) {
        f.classList.toggle("lb");
        const m2 = at();
        if (m2.q.top >= 0 && m2.q.bottom <= Hh && !hitL(m2.x, m2.q.top, m2.x + m2.w, m2.q.bottom)) m = m2; else {
          f.classList.toggle("lb");
          m = at();
          for (let n = 0; n < 6; n++) {
            const o = hitL(m.x, m.q.top, m.x + m.w, m.q.bottom);
            if (!o) break;
            m.x = o.r + 4 + m.w <= W - 2 ? o.r + 4 : o.l - 4 - m.w;
          }
          if (m.x + m.w > W - 2) m.x = W - 2 - m.w;
          if (m.x < 2) m.x = 2;
        }
      }
      placed.push({
        l: m.x,
        r: m.x + m.w,
        t: m.q.top,
        b: m.q.bottom
      });
      const ns = Math.round(m.x - m.L);
      if (ns !== sh) {
        i.dataset.sh = ns;
        i.style.translate = ns ? ns + "px 0" : "";
      }
    }
    const c = ed.ctl;
    if (ed.sel) {
      const r = rectOf(ed.p.BY[ed.sel]);
      const h = ctlHtml();
      if (c.dataset.h !== h) {
        c.dataset.h = h;
        c.innerHTML = h;
      }
      c.classList.remove("hidden");
      if (r) {
        const cw = c.offsetWidth, ch = c.offsetHeight;
        let x = clamp(r.left, 4, W - cw - 4), y = r.bottom + 6;
        if (y + ch > Hh - 4) y = r.top - ch - 22;
        if (y < 4) y = clamp(r.top + 6, 4, Hh - ch - 4);
        c.style.left = x + "px";
        c.style.top = y + "px";
      }
    } else c.classList.add("hidden");
  }
  function onDown(ev) {
    const R = ed.root, t = ev.target;
    if (t.closest(".heHead") && ev.button === 0) {
      const L = R.querySelector(".heList"), q = L.getBoundingClientRect();
      ed.ldrag = {
        dx: ev.clientX - q.left,
        dy: ev.clientY - q.top,
        L
      };
      L.style.transform = "none";
      L.style.left = q.left + "px";
      L.style.top = q.top + "px";
      R.setPointerCapture(ev.pointerId);
      ev.preventDefault();
      return;
    }
    const f = t.closest(".heF");
    if (f && ev.button === 0) {
      const k = f.dataset.k, it = ed.p.BY[k], top = it.par || it, r = rectOf(top);
      select(k, true);
      if (r) {
        const v = gv(top.k);
        ed.drag = {
          k: top.k,
          x0: v.x,
          y0: v.y,
          mx: ev.clientX,
          my: ev.clientY,
          r,
          moved: false
        };
        R.setPointerCapture(ev.pointerId);
      }
      ev.preventDefault();
      return;
    }
    if (!t.closest(".heList, .heCtl")) {
      ed.sel = null;
      markSel();
    }
  }
  function onMove(ev) {
    if (!ed) return;
    if (ed.ldrag) {
      const L = ed.ldrag.L;
      L.style.left = clamp(ev.clientX - ed.ldrag.dx, 0, innerWidth - L.offsetWidth) + "px";
      L.style.top = clamp(ev.clientY - ed.ldrag.dy, 0, innerHeight - 30) + "px";
      return;
    }
    const d = ed.drag;
    if (!d) return;
    const dx = clamp(ev.clientX - d.mx, -d.r.left, innerWidth - d.r.right), dy = clamp(ev.clientY - d.my, -d.r.top, innerHeight - d.r.bottom);
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    d.moved = true;
    sv(d.k, {
      x: d.x0 + dx / innerWidth,
      y: d.y0 + dy / innerHeight
    }, true);
  }
  function onUp() {
    if (!ed) return;
    if (ed.ldrag) {
      ed.ldrag = null;
      return;
    }
    const d = ed.drag;
    ed.drag = null;
    if (d && d.moved) {
      SX.saveOpts();
      paintRow(d.k);
      if (SX.audio) SX.audio.play("click");
    }
  }
  function sizeBy(k, dv) {
    const v = gv(k);
    sv(k, {
      s: v.s + dv
    });
    paintRow(k);
  }
  function onWheel(ev) {
    const f = ev.target.closest(".heF");
    if (!f) return;
    ev.preventDefault();
    select(f.dataset.k, true);
    sizeBy(f.dataset.k, ev.deltaY < 0 ? .05 : -.05);
  }
  function onClick(ev) {
    const b = ev.target.closest("button, [data-pick]");
    if (!b || !ed) return;
    const ds = b.dataset;
    if (ds.pick) {
      select(ds.pick);
      return;
    }
    if (ds.tg) {
      const v = gv(ds.tg);
      sv(ds.tg, {
        on: !v.on
      });
      paintRow(ds.tg);
      select(ds.tg);
    } else if (ds.sm) sizeBy(ds.sm, -.05); else if (ds.sp) sizeBy(ds.sp, .05); else if (ds.rs) {
      sv(ds.rs, {
        s: 1,
        x: 0,
        y: 0
      });
      paintRow(ds.rs);
    } else if (ds.all != null) {
      if (!ed.askAll) {
        ed.askAll = true;
        b.textContent = "한 번 더 누르면 모두 처음대로";
        return;
      }
      ed.askAll = false;
      H.resetAll(ed.p.id);
      SX.saveOpts();
      paintList();
      b.textContent = "모두 처음대로";
    } else if (ds.done != null) {
      U.closePanel();
      return;
    } else return;
    if (SX.audio) SX.audio.play("click");
  }
  function onInput(ev) {
    const r = ev.target.closest("input[data-s]");
    if (!r) return;
    const k = r.dataset.s;
    sv(k, {
      s: +r.value / 100
    }, ev.type === "input");
    const em = r.nextElementSibling;
    if (em) em.textContent = pct(gv(k).s);
    select(k);
  }
  H.edit = function(back, pl) {
    if (ed) return;
    const p = pk(pl), bc = document.body.classList;
    if (U.isOpen && U.isOpen()) U.closePanel();
    H.editing = true;
    ed = {
      p,
      back: back === undefined ? "screen" : back,
      sel: null,
      drag: null,
      ldrag: null,
      raf: 0,
      fr: {},
      askAll: false,
      cls: {
        inraid: bc.contains("inraid"),
        inhub: bc.contains("inhub")
      }
    };
    U.open("hudedit", `<div class="heHold"></div>`, () => endEdit(true));
    bc.add("hudedit", p.edc);
    bc.toggle("inraid", p.id === "raid");
    bc.toggle("inhub", p.id === "hub");
    for (const g of document.querySelectorAll("#hud > .ghost")) g.classList.remove("ghost");
    ed.saved = fillSample(p);
    const R = document.createElement("div");
    R.id = "hudEd";
    ed.root = R;
    R.innerHTML = `<div class="heFrames"></div><div class="heCtl hidden"></div><div class="heList"><div class="heHead"><b>${esc(p.name)}</b><em class="hePl">${esc(p.note)}</em>` + `<small>칸을 끌어 옮기고, 휠이나 밀대로 크기를 바꿉니다. 꺼진 칸은 흐리게 보이며 그곳에서는 안 보입니다. 이 판은 위를 잡고 옮길 수 있습니다.</small></div>` + `<div class="heRows"></div><div class="heFoot"><button data-all>모두 처음대로</button><span class="fFlex"></span><button data-done class="setMain">완료 (Esc)</button></div></div>`;
    const FR = R.querySelector(".heFrames");
    for (const it of p.ALL) {
      const f = document.createElement("div");
      f.className = "heF" + (it.par ? " sub" : "");
      f.dataset.k = it.k;
      f.appendChild(document.createElement("i"));
      FR.appendChild(f);
      ed.fr[it.k] = f;
    }
    for (const it of p.ALL) if (it.par) FR.appendChild(ed.fr[it.k]);
    ed.ctl = R.querySelector(".heCtl");
    document.body.appendChild(R);
    R.addEventListener("pointerdown", onDown);
    R.addEventListener("pointermove", onMove);
    R.addEventListener("pointerup", onUp);
    R.addEventListener("pointercancel", onUp);
    R.addEventListener("wheel", onWheel, {
      passive: false
    });
    R.addEventListener("click", onClick);
    R.addEventListener("input", onInput);
    R.addEventListener("change", onInput);
    R.addEventListener("mouseover", ev => {
      const r = ev.target.closest(".heRow");
      for (const f of FR.children) f.classList.toggle("hov", !!r && f.dataset.k === r.dataset.k);
    });
    paintList();
    H.apply();
    ed.raf = requestAnimationFrame(loop);
  };
  function endEdit(back) {
    if (!ed) return;
    const e = ed;
    ed = null;
    H.editing = false;
    cancelAnimationFrame(e.raf);
    if (e.root) e.root.remove();
    const bc = document.body.classList;
    bc.remove("hudedit", e.p.edc);
    bc.toggle("inraid", e.cls.inraid);
    bc.toggle("inhub", e.cls.inhub);
    restore(e.saved || []);
    SX.saveOpts();
    H.apply();
    if (U.hudDirty) U.hudDirty();
    if (back && e.back) setTimeout(() => {
      if (!(U.isOpen && U.isOpen())) U.openSettings(e.back);
    }, 0);
  }
  H.end = () => {
    if (ed && U.panelKind === "hudedit") U.closePanel();
  };
  H.apply();
})(window.SX);
