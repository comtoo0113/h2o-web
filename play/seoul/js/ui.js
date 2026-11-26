"use strict";

(function(SX) {
  const I = SX.items, A = SX.actors, ART = SX.art, D = SX.data;
  const U = SX.ui = {
    panelKind: null
  };
  const $ = id => document.getElementById(id);
  const panel = $("panel"), tip = $("tooltip"), ghost = $("dragGhost");
  const cellPx = () => parseFloat(getComputedStyle(panel).getPropertyValue("--cell")) || 32;
  const cellOf = g => g && g._c || cellPx();
  const esc = SX.esc, won = SX.won;
  let askEl = null, askCb = null;
  U.asking = () => !!askCb;
  U.ask = function(title, desc, price, onYes, onNo, labels) {
    labels = labels || {};
    if (!askEl) {
      askEl = document.createElement("div");
      askEl.id = "ask";
      askEl.className = "hidden";
      document.body.appendChild(askEl);
    }
    const money = SX.game.save.money, short = price > money;
    const safe = !!labels.safe;
    askEl.innerHTML = `<div class="win askWin${safe ? " askSafe" : ""}"><header><h2>${esc(title)}</h2></header><div class="body">\n      ${safe ? `<p class="askQ"><b>${labels.q || "하시겠습니까?"}</b></p>` : ""}\n      ${desc ? `<p>${desc}</p>` : ""}\n      ${price ? `<p class="askPrice">값 <b class="money">${won(price)}</b> · 가진 돈 ${won(money)} → <b class="${short ? "bad" : ""}">${short ? "모자랍니다" : won(money - price)}</b></p>` : ""}\n      ${safe ? "" : `<p><b>${labels.q || (price ? "구매하시겠습니까?" : "하시겠습니까?")}</b></p>`}\n      <div class="row" style="justify-content:center">${safe ? `<button id="askNo">${labels.no || "취소"}</button><button class="danger" id="askYes">${labels.yes || "예"}</button>` : `<button class="big" id="askYes" ${short ? "disabled" : ""}>${labels.yes || (price ? "구매" : "예")}</button><button id="askNo">${labels.no || "취소"}</button>`}</div></div></div>`;
    askEl.classList.remove("hidden");
    const done = yes => {
      askEl.classList.add("hidden");
      const cb = askCb;
      askCb = null;
      SX.input.down.clear();
      if (cb) cb(yes);
    };
    askCb = yes => {
      if (yes) onYes && onYes(); else onNo && onNo();
    };
    $("askYes").onclick = () => done(true);
    $("askNo").onclick = () => done(false);
    askEl.onmousedown = e => {
      if (e.target === askEl) done(false);
    };
    askEl._done = done;
    askEl._safe = safe;
    if (safe) try {
      $("askNo").focus({
        preventScroll: true
      });
    } catch (e) {}
  };
  addEventListener("keydown", e => {
    if (!askCb || !askEl) return;
    if (e.code === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      askEl._done(false);
    } else if (e.code === "Enter" && !$("askYes").disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      askEl._done(!askEl._safe || document.activeElement === $("askYes"));
    }
  }, true);
  function boxLabel(d) {
    const m = I.def(d.one || I.MAGS[d.cal]), cap = m && m.cap || 0;
    return d.one ? "한 개 · " + cap + "발" : "탄창 3개 · " + cap * 3 + "발";
  }
  let detEl = null;
  function bigCanvas(src, maxW, maxH) {
    const k = Math.max(1, Math.floor(Math.min(maxW / src.width, maxH / src.height)));
    const cv = document.createElement("canvas");
    cv.width = src.width;
    cv.height = src.height;
    cv.getContext("2d").drawImage(src, 0, 0);
    cv.style.width = src.width * k + "px";
    cv.style.height = src.height * k + "px";
    cv.style.imageRendering = "pixelated";
    return cv;
  }
  function mercSpec(m) {
    const hex = n => "#" + (n >>> 0).toString(16).padStart(6, "0"), lk = m.look || {};
    return {
      key: "mc" + m.id,
      kind: "merc",
      top: hex(lk.coat || 4872762),
      pants: hex(lk.pants || 3355443),
      hat: "cap",
      hatCol: hex(lk.cap || 3355443),
      vest: "#2d3324",
      pack: "#4a4030",
      skin: ART.C.skin2
    };
  }
  function ownedItem(it) {
    const seen = new Set, walk = (v, d) => {
      if (v === it) return true;
      if (!v || typeof v !== "object" || d > 8 || seen.has(v)) return false;
      seen.add(v);
      for (const k in v) if (walk(v[k], d + 1)) return true;
      return false;
    };
    return walk(SX.game && SX.game.save, 0) || !!A.player && walk(A.player, 0);
  }
  function nickEdit(right, o) {
    const it = o.inst, h = right.querySelector(".itHead");
    if (!h) return;
    const b = document.createElement("button");
    b.className = "nickBtn";
    b.textContent = "✏ 이름 바꾸기";
    b.title = "이 총에 이름을 붙입니다(" + I.NICK_MAX + "자까지)";
    b.onclick = () => {
      const f = document.createElement("div");
      f.className = "nickRow";
      f.innerHTML = `<input class="nickIn" type="text" maxlength="${I.NICK_MAX * 2}" data-keep="nickIn"><button class="nickOk">바꾸기</button><button class="nickBack">원래 이름</button>`;
      const inp = f.querySelector(".nickIn");
      inp.value = it.nick || "";
      inp.placeholder = it.name;
      const done = v => {
        const n = I.cleanNick(v);
        if (n && n !== it.name) it.nick = n; else delete it.nick;
        SX.game.persist && SX.game.state !== "title" && SX.game.persist();
        if (U.isOpen() && U.panelKind && U.refresh) try {
          U.refresh();
        } catch (e) {}
        SX.audio.play("click");
        U.showDetail(o);
      };
      f.querySelector(".nickOk").onclick = () => done(inp.value);
      f.querySelector(".nickBack").onclick = () => done("");
      inp.onkeydown = e => {
        e.stopPropagation();
        if (e.code === "Enter" || e.code === "NumpadEnter") {
          e.preventDefault();
          done(inp.value);
        } else if (e.code === "Escape") {
          e.preventDefault();
          U.showDetail(o);
        }
      };
      h.replaceWith(f);
      inp.focus();
      inp.select();
    };
    h.appendChild(b);
  }
  U.closeDetail = function() {
    if (detEl) detEl.classList.add("hidden");
  };
  U.showDetail = function(o) {
    if (!detEl) {
      detEl = document.createElement("div");
      detEl.id = "detail";
      detEl.className = "hidden";
      document.body.appendChild(detEl);
      detEl.onmousedown = e => {
        if (e.target === detEl || e.target.closest("[data-dclose]")) U.closeDetail();
      };
      detEl.oncontextmenu = e => {
        e.preventDefault();
        if (performance.now() - (detEl._openAt || 0) < 450) return;
        U.closeDetail();
      };
    }
    let title = "", art = null, extra = "", lines = [];
    if (o.item || o.inst) {
      const d = o.item || o.inst, it = o.inst || I.mk(d.kind === "ammo" ? I.MAGS[d.cal] : d);
      title = d.kind === "ammo" ? d.name : I.shownName(it);
      art = bigCanvas(ART.icon(d.kind === "ammo" ? {
        name: d.one ? d.one : d.name,
        kind: "ammo",
        cal: d.cal,
        w: 2,
        h: d.one ? 2 : 1
      } : it), 320, 260);
      lines.push(I.describe(it, true, true));
      if (d.price) lines.push("<p class='money'>가격 " + won(SX.worth ? SX.worth.price(d.name, "med", d.price) : d.price) + (d.kind === "ammo" ? " (" + boxLabel(d) + ")" : SX.trade && SX.trade.isCure && SX.trade.isCure(d.name) ? " <span class='small'>(가진 재산의 3% · 최소 20만 원)</span>" : "") + "</p>");
      lines.push("<p class='small'>팔 때 " + won(I.brokerValue(it)) + " · 값 " + won((it.val || 0) * I.qty(it)) + "</p>");
    } else if (o.furn) {
      const k = o.furn, cat = SX.home.FURN[k], def = ART.propDef(k);
      title = cat.name;
      art = bigCanvas(ART.prop(k, 0, null, 0).c, 320, 260);
      if (def && def.rot) {
        const row = document.createElement("div");
        row.className = "row";
        row.style.gap = "calc(var(--u)*2)";
        for (let r = 1; r < 4; r++) row.appendChild(bigCanvas(ART.prop(k, 0, null, r).c, 110, 110));
        extra = row;
      }
      const dm = ART.propDims(k, 0);
      lines.push("<p><span class='k'>가구 · " + dm.fw + "×" + dm.fh + "칸</span></p>");
      if (cat.desc) lines.push("<p>" + esc(cat.desc) + "</p>");
      const use = cat.use === "display" ? "물건 진열 " + SX.home.slotsOf({
        kind: k
      }) + "칸" : cat.use === "rack" ? "총·근접무기 거치 " + SX.home.slotsOf({
        kind: k
      }) + "칸" : cat.use === "safe" ? cat.water ? "생수병만 보관 " + cat.grid[0] + "×" + cat.grid[1] + "칸(생수병 " + Math.floor(cat.grid[0] * cat.grid[1] / 2) + "병)" : "보관 " + cat.grid[0] + "×" + cat.grid[1] + "칸" : cat.use === "wardrobe" ? "캐릭터 꾸미기" : cat.use === "fridge" ? "먹을 것 · 마실 것 보관 " + cat.grid[0] + "×" + cat.grid[1] + "칸 — 요리한 것도 여기로 들어옵니다" : cat.use === "cook" ? "불 없이 만드는 요리(김치 · 채소 샐러드) — 끓이고 삶고 굽는 것은 싱크대·가스레인지에서 합니다" : cat.use === "stove" ? "불이 드는 요리(끓인 라면 · 삶은 감자 · 구운 생선) — 부탄가스를 넣어 씁니다(한 통에 " + SX.prog.GAS.USES + "번 · " + SX.prog.GAS.CAP + "통까지)" : cat.use === "water" ? "생수병을 " + (cat.cap || 4) + "통까지 넣어 두고 [" + SX.label("interact") + "] 로 마십니다(한 통에 " + SX.home.WATER.SIPS + "잔)" : cat.use === "garden" ? "텃밭 — 씨앗을 심어 거둡니다" : cat.use === "dump" ? "청소로 모은 쓰레기를 [" + SX.label("interact") + "] 로 한꺼번에 버립니다" : cat.use === "piano" ? "[" + SX.label("interact") + "] 로 피아노를 칩니다 — 건반에 적힌 글자 키 · Shift 는 페달" : cat.use === "sleep" ? "자면 좌판에 새 물건(2분 넘게 한 판 다녀올 때마다 한 번)" : cat.light ? "불빛이 납니다" : cat.flat ? "깔개(밟고 지나갑니다)" : "꾸밈";
      lines.push("<p>" + use + (cat.tall ? " · 시야를 가립니다" : "") + (cat.paint ? " · 색 바꿈 " + won(SX.home.PRICE.paint) : "") + (def && def.rot ? " · 돌릴 수 있습니다" : "") + "</p>");
      lines.push("<p class='money'>가격 " + won(cat.price) + " · 되팔면 " + won(cat.price / 2) + "</p>");
    } else if (o.tier) {
      const t = o.tier;
      title = t.name;
      const cv = U.homeThumb(t, 4);
      art = bigCanvas(cv, 320, 260);
      lines.push("<p><span class='k'>집 · 넓이 " + SX.home.area(t) + "칸</span></p><p>" + esc(t.desc) + "</p>");
      lines.push("<p>바닥 " + esc((SX.home.FLOORS.find(f => f[0] === t.floor) || [ 0, "-" ])[1]) + (t.windows ? " · 창이 있습니다" : " · 창이 없습니다") + "</p>");
      lines.push("<p class='money'>" + (t.price ? "값 " + won(t.price) : "처음 사는 곳") + "</p>");
    } else if (o.merc) {
      const m = o.merc;
      title = m.name;
      const cv = ART.mk(32, 44), x = cv.getContext("2d");
      x.drawImage(ART.char(mercSpec(m), 0, 0), 0, 0);
      art = bigCanvas(cv, 200, 260);
      lines.push("<p><span class='k'>용병 — 다음 판에 한 명이 따라옵니다</span></p><p>" + esc(m.desc) + "</p>");
      lines.push("<p>체력 " + m.hp + " · 명중 " + Math.round(m.acc * 100) + "% · 시야 " + m.sight + "m · 귀 " + m.ear + "m</p>");
      lines.push("<p class='money'>값 " + won(m.price) + "</p>");
    } else if (o.building) {
      const b = o.building;
      title = b.name + " · " + b.tag;
      lines.push("<p>" + esc(b.desc) + "</p>");
      if (b.story) lines.push("<p class='small story'>" + esc(b.story) + "</p>");
      lines.push("<p>층 " + b.floors + " · 적 ×" + b.enemy + " · 전리품 ×" + b.loot + " · 가스 ×" + b.gas + "</p>");
      if (o.price) lines.push("<p class='money'>정보 값 " + won(o.price) + "</p>");
    }
    detEl.innerHTML = `<div class="win detWin"><header><h2>${esc(title)}</h2><button class="x" data-dclose>닫기 ✕</button></header><div class="body row" id="detBody"></div></div>`;
    const body = $("detBody");
    const left = document.createElement("div");
    left.className = "col center";
    left.style.alignItems = "center";
    if (art) left.appendChild(art);
    if (extra) left.appendChild(extra);
    const right = document.createElement("div");
    right.className = "col";
    right.style.flex = "1";
    right.style.minWidth = "calc(var(--u)*120)";
    right.innerHTML = lines.join("");
    if (o.inst && o.inst.kind === "gun" && ownedItem(o.inst)) nickEdit(right, o);
    {
      const wn = o.item ? o.item.name : o.inst ? o.inst.name : null, T = SX.trade;
      if (wn && T && T.wishable(wn)) {
        const on = T.wished(SX.game.save, wn), wb = document.createElement("button");
        wb.id = "detWish";
        wb.className = "wishBig" + (on ? " on" : "");
        wb.textContent = on ? "★ 찜 풀기" : "☆ 찜하기";
        wb.title = "좌판에 들어오면 알려 드립니다";
        wb.onclick = () => {
          if (U.wishToggle(wn)) {
            U.showDetail(o);
            if (U.panelKind === "shop") renderShop();
          }
        };
        right.appendChild(wb);
      }
    }
    right.insertAdjacentHTML("beforeend", "<p class='small'>우클릭·Esc·바깥 누르기로 닫습니다</p>");
    body.append(left, right);
    detEl.classList.remove("hidden");
    detEl._openAt = performance.now();
    SX.audio.play("click");
  };
  addEventListener("keydown", e => {
    if (detEl && !detEl.classList.contains("hidden") && e.code === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      U.closeDetail();
    }
  }, true);
  U.isOpen = () => !panel.classList.contains("hidden");
  const pathOf = e => {
    const p = [];
    while (e && e !== panel) {
      const par = e.parentElement;
      if (!par) break;
      p.unshift(Array.prototype.indexOf.call(par.children, e));
      e = par;
    }
    return p;
  };
  const atPath = p => {
    let e = panel;
    for (const i of p) {
      e = e && e.children[i];
      if (!e) return null;
    }
    return e;
  };
  U.open = function(kind, html, onClose) {
    if (kind !== "inv") {
      panel.style.removeProperty("--cell");
      invFit.key = null;
    }
    const keepSc = [], sameWin = U.panelKind === kind && !panel.classList.contains("hidden"), pst = sameWin ? panel.scrollTop : 0;
    if (sameWin) for (const e of panel.querySelectorAll("*")) if (e.scrollTop > 0 || e.scrollLeft > 0) keepSc.push([ e.id, pathOf(e), e.className, e.scrollTop, e.scrollLeft ]);
    const wasOpen = !panel.classList.contains("hidden");
    U.menuBack = kind === "menu" || kind === "result" || kind === "wipe" || !wasOpen ? false : U.panelKind === "menu" ? true : !!U.menuBack;
    U.panelKind = kind;
    U.onClose = onClose || null;
    panel.innerHTML = html;
    panel.classList.remove("hidden");
    document.body.classList.add("panelopen");
    if (U.menuBack) {
      const h = panel.querySelector(".win > header");
      if (h) {
        const b = document.createElement("button");
        b.className = "mBack";
        b.dataset.back = "1";
        b.textContent = "◀ 메뉴";
        h.insertBefore(b, h.firstChild);
      }
    }
    if (pst) panel.scrollTop = pst;
    for (const [id, p, cls, st, sl] of keepSc) {
      let e = id ? panel.querySelector("#" + CSS.escape(id)) : null;
      if (!e) {
        const q = atPath(p);
        if (q && q.className === cls) e = q;
      }
      if (e) {
        e.scrollTop = st;
        e.scrollLeft = sl;
      }
    }
    if (U.skinWin) U.skinWin(kind);
    tip.classList.add("hidden");
    document.body.classList.add("uiopen");
    SX.input.down.clear();
  };
  U.closePanel = function() {
    if (!U.isOpen()) return;
    if (U.panelKind === "result" || U.panelKind === "wipe") {}
    const cb = U.onClose;
    U.onClose = null;
    U.panelKind = null;
    U.menuBack = false;
    U.loot = null;
    gymStop();
    if (U.sfReset) U.sfReset();
    if (U.closeParts) U.closeParts();
    panel.classList.add("hidden");
    panel.innerHTML = "";
    tip.classList.add("hidden");
    document.body.classList.remove("panelopen");
    cancelDrag();
    if (cb) cb();
    SX.game.persist && SX.game.state !== "title" && SX.game.persist();
    U.hudDirty();
  };
  panel.addEventListener("mousedown", e => {
    if (e.target === panel && U.panelKind !== "result" && U.panelKind !== "wipe") U.closePanel();
  });
  const header = (title, extra) => `<header><h2>${title}</h2>${extra || ""}<button class="x" data-close>닫기 ✕</button></header>`;
  U.header = header;
  U.crumb = (title, sub) => sub ? `${title}<span class="crumb"><i>›</i> ${sub}</span>` : title;
  U.foot = (left, right, pad) => `<div class="winFoot">${left || ""}<span class="fFlex"></span>${pad ? `<span class="fPad">${pad}</span>` : ""}${right || ""}</div>`;
  panel.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) U.closePanel(); else if (e.target.closest("[data-back]")) U.menuBackGo();
  });
  U.menuBackGo = () => {
    U.closePanel();
    U.openMenu();
    SX.audio.play("click");
  };
  addEventListener("keydown", e => {
    const t = e.target;
    if (e.code !== "Escape" || e.isComposing || !U.menuBack || !U.isOpen() || !t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || !panel.contains(t)) return;
    e.preventDefault();
    t.blur();
    U.menuBackGo();
  });
  const qmText = new Map;
  let qmSeq = 0, qmEl = null, qmPin = null, qmCur = null, qmT = 0;
  U.qm = function(html, cls) {
    const k = "q" + ++qmSeq;
    qmText.set(k, String(html));
    if (qmText.size > 600) qmText.delete(qmText.keys().next().value);
    return `<span class="qm${cls ? " " + cls : ""}" data-qm="${k}" role="button" tabindex="0">?</span>`;
  };
  U.qmEl = function(html, cls) {
    const t = document.createElement("template");
    t.innerHTML = U.qm(html, cls);
    return t.content.firstChild;
  };
  U.qmHide = function() {
    qmPin = null;
    qmCur = null;
    clearInterval(qmT);
    qmT = 0;
    if (qmEl) qmEl.classList.add("hidden");
  };
  const qmGone = b => !b || !b.isConnected || !b.getClientRects().length;
  function qmWatch() {
    if (!qmEl || qmEl.classList.contains("hidden")) {
      clearInterval(qmT);
      qmT = 0;
      return;
    }
    if (qmGone(qmCur) || !qmPin && !qmCur.matches(":hover")) U.qmHide();
  }
  U.qmOpen = () => !!qmEl && !qmEl.classList.contains("hidden");
  function qmShow(b, pin) {
    const h = qmText.get(b.dataset.qm);
    if (h == null) return;
    if (!qmEl) {
      qmEl = document.createElement("div");
      qmEl.id = "qmPop";
      qmEl.className = "hidden";
      document.body.appendChild(qmEl);
    }
    qmEl.innerHTML = h;
    qmEl.classList.remove("hidden");
    qmPin = pin ? b : null;
    qmCur = b;
    if (!qmT) qmT = setInterval(qmWatch, 250);
    const r = b.getBoundingClientRect(), w = qmEl.offsetWidth, hh = qmEl.offsetHeight, m = 6;
    let x = Math.min(innerWidth - w - m, Math.max(m, r.left + r.width / 2 - w / 2)), y = r.bottom + m;
    if (y + hh > innerHeight - m) y = Math.max(m, r.top - hh - m);
    qmEl.style.left = Math.round(x) + "px";
    qmEl.style.top = Math.round(y) + "px";
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-qm]");
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      if (qmPin === b) U.qmHide(); else {
        SX.audio && SX.audio.play("click", {
          vol: .5
        });
        qmShow(b, true);
      }
      return;
    }
    if (qmEl && !qmEl.contains(e.target)) U.qmHide();
  }, true);
  document.addEventListener("mouseover", e => {
    const b = e.target.closest && e.target.closest("[data-qm]");
    if (b && !qmPin) qmShow(b, false);
  });
  document.addEventListener("mouseout", e => {
    const b = e.target.closest && e.target.closest("[data-qm]");
    if (b && !qmPin && qmEl && !b.contains(e.relatedTarget)) qmEl.classList.add("hidden");
  });
  document.addEventListener("keydown", e => {
    const b = e.target.closest && e.target.closest("[data-qm]");
    if (b && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      qmShow(b, true);
    }
  });
  new MutationObserver(() => {
    if (qmPin && !document.body.contains(qmPin)) U.qmHide();
  }).observe(panel, {
    childList: true,
    subtree: true
  });
  let dirty = true, hudAcc = 0;
  U.hudDirty = () => {
    dirty = true;
  };
  U.hitMarker = crit => {
    SX.render.hit = .12;
    SX.render.hitCrit = crit;
  };
  const logBox = $("hudLog");
  let bigEl = null, bigT = 0;
  U.NOTE_MS = 2500;
  U.bigNote = function(title, sub, ms, opt) {
    if (SX.game && SX.game.state === "raid" && !(opt && opt.hi)) {
      const seen = [ ...logBox.children ].some(d => {
        const m = d.dataset.m || "";
        return m.indexOf(title) >= 0 || sub && m.indexOf(sub) >= 0;
      });
      if (!seen) SX.log(title + (sub ? " — " + sub : ""));
      return;
    }
    if (!bigEl) {
      bigEl = document.createElement("div");
      bigEl.id = "bigNote";
      document.body.appendChild(bigEl);
    }
    bigEl.innerHTML = `<div class="bn1">${esc(title)}</div>${sub ? `<div class="bn2">${esc(sub)}</div>` : ""}`;
    bigEl.classList.add("on");
    const o = opt || {};
    bigEl.classList.toggle("hi", !!o.hi);
    bigEl.classList.toggle("click", !!o.click);
    bigEl.onclick = o.click ? () => {
      bigEl.classList.remove("on", "click");
      clearTimeout(bigT);
      try {
        o.click();
      } catch (e) {}
    } : null;
    if (o.click) bigEl.insertAdjacentHTML("beforeend", `<i class="bnX">✕</i>`);
    clearTimeout(bigT);
    bigT = setTimeout(() => bigEl.classList.remove("on", "click"), ms || 4e3);
  };
  U.center = function(text, bad) {
    const c = $("hudCenter");
    if ((text || "") !== c.dataset.t) {
      c.dataset.t = text || "";
      c.innerHTML = text ? esc(text) : "";
    }
    c.classList.toggle("bad", !!bad);
    c.classList.remove("mini");
  };
  U.mini = function(o) {
    if (!o) return U.center("");
    const c = $("hudCenter"), pc = v => Math.round(Math.max(0, Math.min(1, v)) * 100);
    const row = r => {
      let v;
      if (r.pct != null) v = `<b class="mnG${r.tone ? " " + r.tone : ""}"><i style="width:${pc(r.pct)}%"></i></b><em>${pc(r.pct)}%</em>`; else if (r.of > 12) v = `<b class="mnG"><i style="width:${pc(r.n / r.of)}%"></i></b><em>${r.n} / ${r.of}</em>`; else {
        let s = "";
        for (let k = 0; k < r.of; k++) s += k < r.n ? "<i class=on></i>" : "<i></i>";
        v = `<b class="mnP${r.x ? " x" : ""}">${s}</b><em>${r.n} / ${r.of}</em>`;
      }
      return `<div class="mnR"><span>${esc(r.k)}</span>${v}</div>`;
    };
    const al = o.now || o.warn || "", ga = o.gauge;
    const gaH = ga ? `<div class="mnR mnGa">${ga.k ? `<span>${esc(ga.k)}</span>` : ""}<canvas class="mnGc"></canvas>${ga.v != null ? `<em>${esc(ga.v)}</em>` : ""}</div>` : "";
    const h = `<div class="mnBox"><div class="mnH"><span>${esc(o.t || "")}</span>${o.time != null ? `<em>${esc(o.time)}</em>` : ""}</div>` + (o.res ? `<div class="mnRes">${esc(o.res)}</div><div class="mnSub">${esc(o.sub || "")}</div>` : (o.msg ? `<div class="mnM">${esc(o.msg)}</div>` : "") + (o.rows || []).map(row).join("") + gaH + `<div class="mnK">${(o.key || []).map(k => "<kbd>" + esc(k) + "</kbd>").join("")}<span>${esc(o.tip || "")}</span></div><div class="mnA${o.now ? " on" : o.warn ? " on bad" : ""}">${al ? esc(al) : "&nbsp;"}</div>`) + `</div>`;
    if (h !== c.dataset.t) {
      c.dataset.t = h;
      c.innerHTML = h;
    }
    c.classList.add("mini");
    c.classList.toggle("bad", !!o.bad);
    if (ga && !o.res) miniGauge(c.querySelector(".mnGc"), ga);
  };
  function miniGauge(cv, ga) {
    if (!cv || !SX.hub || !SX.hub.gauge) return;
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 2, gh = ga.h || 6, cw = Math.max(24, Math.floor(cv.clientWidth / u)), ch = gh + 8;
    if (cv.width !== cw) cv.width = cw;
    if (cv.height !== ch) {
      cv.height = ch;
    }
    const hs = ch * u + "px";
    if (cv.style.height !== hs) cv.style.height = hs;
    const x = cv.getContext("2d");
    x.clearRect(0, 0, cw, ch);
    SX.hub.gauge(x, 3, 6, cw - 6, gh, ga.zones || [], ga.mark, ga.mc, ga.ticks);
  }
  U.prompt = function(t) {
    const el = $("hudPrompt"), O = SX.opts || {};
    if (!t || U.isOpen() || (SX.game.state === "raid" ? O.promptOn : O.promptHub) === false) {
      el.classList.add("hidden");
      U._pt = null;
      return;
    }
    {
      const ps = Math.max(.5, Math.min(1, +O.promptSize || 1)), pa = Math.max(.2, Math.min(1, O.promptAlpha == null ? 1 : +O.promptAlpha));
      if (el._ps !== ps) {
        el._ps = ps;
        el.style.setProperty("--ps", ps);
      }
      if (el._pa !== pa) {
        el._pa = pa;
        el.style.setProperty("--pa", pa);
      }
    }
    const V = SX.view, s = V.scale / (window.devicePixelRatio || 1);
    const sx = (t.x * SX.TS - V.cam.x) * s, sy = (t.y * SX.TS - V.cam.y) * s;
    el.style.left = Math.round(sx) + "px";
    el.style.top = Math.round(sy) + "px";
    const html = "<kbd>" + esc(SX.label(t.key || "interact")) + "</kbd>" + esc(t.label) + (t.more ? t.more.map(m => " <kbd>" + esc(m[0]) + "</kbd>" + esc(m[1])).join("") : "");
    if (el.dataset.h !== html) {
      el.dataset.h = html;
      el.innerHTML = html;
      el.classList.toggle("tk", t.key === "melee");
    }
    el.classList.remove("hidden");
  };
  function iconCanvas(it, w, h) {
    const c = ART.icon(it);
    const cv = document.createElement("canvas");
    cv.width = c.width;
    cv.height = c.height;
    cv.getContext("2d").drawImage(c, 0, 0);
    return cv;
  }
  let mapAcc = 0;
  const mapBox = $("hudMapBox"), mapCv = $("hudMap");
  mapCv.addEventListener("mousedown", e => {
    if (SX.game.state !== "raid" || !SX.raid.level || !A.player) return;
    const [x, y] = SX.minimap.smallToWorld(mapCv, e.clientX, e.clientY);
    if (e.button === 2) SX.raid.unping(A.player.floor, x, y); else SX.raid.ping(A.player.floor, x, y);
    e.preventDefault();
    e.stopPropagation();
  });
  const HUD_BOXES = [ "hudBars", "hudInj", "hudIcons", "hudFac", "hudWeapon", "hudMapBox", "hudInfo", "hudLog", "hudQuick" ];
  let ghostAcc = 0;
  function hudGhost(dt) {
    ghostAcc += dt;
    if (ghostAcc < .05) return;
    ghostAcc = 0;
    const In = SX.input, open = U.isOpen() || SX.game.state === "title", mx = In.mx, my = In.my, pad = 6;
    for (const id of HUD_BOXES) {
      const el = $(id);
      if (!el) continue;
      let on = false;
      if (!open && !el.classList.contains("hidden") && el.childElementCount + el.textContent.length > 0) {
        const r = el.getBoundingClientRect();
        on = r.width > 0 && mx >= r.left - pad && mx <= r.right + pad && my >= r.top - pad && my <= r.bottom + pad;
        if (on && id === "hudInfo") for (const h of el.querySelectorAll(".hFold")) {
          const q = h.getBoundingClientRect();
          if (mx >= q.left && mx <= q.right && my >= q.top && my <= q.bottom) {
            on = false;
            break;
          }
        }
      }
      el.classList.toggle("ghost", on);
    }
  }
  const FAC_IC = {
    gen: [ "bolt", "#f0d060" ],
    forge: [ "wrench", "#c8ccd2" ],
    med: [ "medkit", "#f2f2f2" ],
    bench: [ "bullet", "#e0b050" ],
    still: [ "bottle", "#9ad0a0" ],
    vault: [ "safe", "#b8a070" ]
  };
  U.facLeds = function() {
    const P = SX.prog, fs = SX.game.save && SX.game.save.fac || {}, now = Date.now();
    return P.FAC.filter(f => !f.addon && P.facLevel(fs, f.id)).map(f => {
      const fr = P.facFrac(fs, f.id, now);
      return {
        id: f.id,
        name: f.name,
        lv: P.facLevel(fs, f.id),
        pct: Math.round(fr * 100),
        full: fr >= 1
      };
    });
  };
  function hudFac(G) {
    const box = $("hudFac");
    if (!box || document.body.classList.contains("hudedit")) return;
    const L = G.state === "hub" && !(SX.course && SX.course.on) ? U.facLeds() : [];
    const k = L.map(q => q.id + q.lv + (q.full ? "R" : "G") + q.pct).join("|");
    box.classList.toggle("hidden", !L.length);
    if (box.dataset.k === k) return;
    box.dataset.k = k;
    box.innerHTML = "<span class='facLbl'>설비</span>";
    for (const q of L) {
      const d = document.createElement("i");
      d.className = "fac led " + (q.full ? "green full" : "off");
      d.dataset.fac = q.id;
      d.title = q.name + " " + q.lv + "단계 — " + (q.full ? "가득 — 멈춰 있습니다 · 시장 설비 탭에서 받기" : q.pct + "% · 쌓이는 중");
      box.appendChild(d);
    }
  }
  function hudParty(Cp) {
    const el = $("hudParty");
    if (!el) return;
    const on = !!(Cp && Cp.on && Cp.on() && Cp.room), k = on ? Cp.room + "|" + (Cp.peers.size + 1) + "|" + (Cp.isHost() ? 1 : 0) : "";
    el.classList.toggle("hidden", !on);
    if (el.dataset.k === k) return;
    el.dataset.k = k;
    el.innerHTML = "";
    if (!on) return;
    const cv = document.createElement("canvas");
    cv.width = 16;
    cv.height = 16;
    cv.getContext("2d").drawImage(ART.hud("person", "#8fd0ff"), 0, 0);
    const n = document.createElement("b");
    n.textContent = Cp.peers.size + 1;
    const c = document.createElement("span");
    c.className = "code";
    c.setAttribute("data-notr", "");
    c.textContent = Cp.room;
    el.append(cv, n, c);
    el.title = "파티 " + (Cp.peers.size + 1) + "명" + (Cp.isHost() ? " · 내가 파티장" : "") + " — 누르면 방 코드를 복사합니다";
  }
  {
    const el = $("hudParty");
    if (el) el.onclick = () => {
      const C = SX.coop;
      if (!C || !C.room) return;
      const code = C.room;
      const ok = () => {
        SX.audio && SX.audio.play("click");
        SX.log("📋 방 코드 " + code + " 를 복사했습니다");
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, ok); else ok();
      } catch (e) {
        ok();
      }
    };
  }
  const TK_NAME = {
    s: "이야기",
    q: "의뢰",
    e: "작전"
  }, HUD_FOLD_LS = "sxd_hudfold";
  let hudFd = null;
  const hudFold = () => {
    if (!hudFd) {
      try {
        hudFd = JSON.parse(localStorage.getItem(HUD_FOLD_LS) || "{}") || {};
      } catch (e) {
        hudFd = {};
      }
    }
    return hudFd;
  };
  const HUD_FLASH_MS = 3e3, HUD_GRACE_MS = 1500;
  let hudLv = null, hudG0 = 0;
  const hudSeen = new Map, hudFl = new Map;
  const hudOn = k => !(SX.hudLay && SX.hudLay.get) || SX.hudLay.get(k, "raid").on !== false;
  const hudTRow = q => `<div class="${q.ok ? "ok" : q.full ? "full" : ""}">${q.ok || q.full ? "✓" : "·"} <i class="tk ${q.k}">${TK_NAME[q.k]}</i> ${esc(q.t)}${q.p ? ` <b>${esc(q.p).replace(/^(\d+)\+(\d+)\//, '$1<i class="tkAdd">+$2</i>/')}</b>` : ""}</div>`;
  const hudNRow = q => `<div class="${q.have >= q.n ? "ok" : ""}">${q.have >= q.n ? "✓" : "·"} ${esc(q.name)} <b>${Math.min(q.have, q.n)}/${q.n}</b></div>`;
  const hudFlash = (key, sig, up, now) => {
    const o = hudSeen.get(key);
    hudSeen.set(key, sig);
    if (now >= hudG0 && (o === undefined || up(o, sig))) hudFl.set(key, now + HUD_FLASH_MS);
    return (hudFl.get(key) || 0) > now;
  };
  const hudRaidList = (trk, need, fd) => {
    const now = performance.now(), lv = SX.raid && SX.raid.level;
    if (lv !== hudLv) {
      hudLv = lv;
      hudSeen.clear();
      hudFl.clear();
      hudG0 = now + HUD_GRACE_MS;
    }
    const T = hudOn("trk") ? trk : [], N = hudOn("need") ? need : [];
    const tF = T.filter(q => hudFlash("t|" + q.k + "|" + q.t, (q.p || "") + (q.ok ? "o" : "") + (q.full ? "f" : ""), (o, v) => o !== v, now));
    const nF = N.filter(q => hudFlash("n|" + q.name, Math.min(q.have, q.n), (o, v) => v > o, now));
    if (!T.length && !N.length) return "";
    if (fd.rOpen) {
      let h = "", first = true;
      const head = title => {
        const x = `<div class="hh"><b>${title}</b>${first ? `<button class="hFold on" data-hf="rOpen" title="접기"><i></i></button>` : `<i class="hSp"></i>`}</div>`;
        first = false;
        return x;
      };
      if (T.length) h += `<div class="trk">${head("📌 추적 중")}` + T.slice(0, 8).map(hudTRow).join("") + (T.length > 8 ? `<div class="small">… 외 ${T.length - 8}가지</div>` : "") + (trk.live ? `<div class="small tkLv">+ 이번 판 몫 · 판이 끝나면 셉니다</div>` : "") + `</div>`;
      if (N.length) h += `<div class="need">${head("📋 찾을 물건")}` + N.slice(0, 8).map(hudNRow).join("") + (N.length > 8 ? `<div class="small">… 외 ${N.length - 8}가지</div>` : "") + `</div>`;
      return h;
    }
    const line = `<div class="hh">` + (T.length ? `<b>📌 추적 중</b><span class="hn">${T.length}</span>` : "") + (T.length && N.length ? `<i class="hSep">·</i>` : "") + (N.length ? `<b class="hNd">📋 찾을 물건</b><span class="hn">${N.length}</span>` : "") + `<button class="hFold" data-hf="rOpen" title="펼치기"><i></i></button></div>`;
    const tS = tF.slice(0, 4 - Math.min(nF.length, 2)), nS = nF.slice(0, 4 - tS.length);
    if (!T.length) return `<div class="need fold">${line}` + nS.map(hudNRow).join("") + `</div>`;
    return `<div class="trk fold">${line}` + tS.map(hudTRow).join("") + `</div>` + (nS.length ? `<div class="need fold">` + nS.map(hudNRow).join("") + `</div>` : "");
  };
  const hudFoldHead = (k, title, n, off) => `<div class="hh"><b>${title}</b>${off ? `<span class="hn">${n}</span>` : ""}<button class="hFold${off ? "" : " on"}" data-hf="${k}" title="${off ? "펼치기" : "접기"}"><i></i></button></div>`;
  {
    const el = $("hudInfo");
    if (el) el.addEventListener("mousedown", e => {
      const b = e.button === 0 && e.target.closest && e.target.closest("[data-hf]");
      if (!b) return;
      e.preventDefault();
      const fd = hudFold(), k = b.dataset.hf;
      fd[k] = !fd[k];
      try {
        localStorage.setItem(HUD_FOLD_LS, JSON.stringify(fd));
      } catch (er) {}
      SX.audio && SX.audio.play("click");
      el.dataset.h = "";
    });
  }
  U.tick = function(dt) {
    if (SX.hudLay && SX.hudLay.editing) return;
    hudAcc += dt;
    mapAcc += dt;
    hudGhost(dt);
    if (U.loot) searchTick(dt);
    if (U.loot && U.loot.near && U.panelKind === "inv" && !dragging) {
      U.loot.re = (U.loot.re || 0) + dt;
      if (U.loot.re > .5) {
        U.loot.re = 0;
        const now = SX.raid.nearConts().map(q => q.cont);
        if (now.length !== (invOther.conts || []).length || now.some((c, k) => c !== invOther.conts[k])) renderInv();
      }
    }
    if (dragging) positionGhost();
    const inRaid = SX.game.state === "raid" && SX.raid.level && A.player;
    document.body.classList.toggle("inraid", !!inRaid);
    document.body.classList.toggle("inhub", SX.game.state === "hub");
    mapBox.classList.toggle("hidden", !inRaid);
    if (inRaid && mapAcc > .066) {
      mapAcc = 0;
      SX.minimap.drawSmall(mapCv);
      const F = SX.raid.floor(), lv = SX.raid.level, h = (F.kind === "roof" ? "옥상" : F.park ? "지하 1층" : A.player.floor + 1 + "층") + " / " + lv.building.floors + "층";
      const head = $("hudMapHead");
      if (head.dataset.h !== h) {
        head.dataset.h = h;
        head.innerHTML = "<span>" + esc(h) + "</span><span>" + esc(lv.building.name) + "</span>";
      }
    }
    if (!dirty && hudAcc < .1) return;
    hudAcc = 0;
    dirty = false;
    const G = SX.game, p = A.player;
    const hud = $("hud");
    if (G.state === "title" || !p) {
      hud.classList.add("hidden");
      return;
    }
    hud.classList.remove("hidden");
    renderSpec(p);
    const hmx = A.hpMax(p);
    $("hpFill").style.width = Math.max(0, Math.min(100, p.hp / hmx * 100)) + "%";
    $("hpTxt").textContent = Math.ceil(Math.max(0, p.hp)) + (hmx > 100 ? "/" + hmx : "");
    renderInj(p);
    $("stFill").style.width = p.st / A.stMax() * 100 + "%";
    const icons = [];
    const inf = G.save.infect;
    if (inf > 20) icons.push([ "virus", inf > 75 ? "#e0514a" : inf > 50 ? "#f0b451" : "#8fd14a", Math.floor(inf) + "%" ]);
    if (G.state === "raid" && SX.raid.gasHere > 0) icons.push([ "gas", SX.raid.gasHere >= 1 ? "#e0514a" : "#b6e36a", "" ]);
    if (G.state === "raid" && SX.raid.flood && (SX.raid.wLv > 0 || SX.raid.breath < SX.raid.BREATH_MAX - .5)) {
      const R = SX.raid, b = Math.max(0, Math.ceil(R.breath));
      icons.push([ "water", R.wLv >= 5 || b < R.BREATH_MAX ? b <= 6 ? "#e0514a" : "#f0b451" : R.wLv >= 4 ? "#6ab8f0" : "#8fb8c8", R.wLv >= 5 || b < R.BREATH_MAX ? "숨 " + b + "초" : R.WNAME[R.wLv] ]);
    }
    if (p.kit.armor) icons.push([ "armor", p.kit.armor.armor > 0 ? "#8a9a6a" : "#6a3a3a", Math.round(p.kit.armor.armor) ]);
    const kg = I.kitWeight(p.kit);
    if (kg > A.weightCap()) icons.push([ "weight", "#e0514a", kg.toFixed(0) + "kg" ]);
    if (p.torch && G.state === "raid") icons.push([ "light", "#f0f0a0", "" ]);
    if (G.state === "raid" && SX.wx && SX.wx.KINDS[G.env.wx] && SX.wx.KINDS[G.env.wx].icon) {
      const k = SX.wx.KINDS[G.env.wx];
      icons.push([ k.icon, k.col, k.name ]);
    }
    if (G.state === "raid" && SX.nvg && SX.nvg.worn(p)) icons.push([ "nvg", p.nvOn ? "#7dff8e" : "#567e60", (p.nvOn ? "켬 " : "") + Math.round(SX.nvg.bat(p)) + "%" ]);
    if (p.hotT > 0) icons.push([ "bleed", "#6fcf6a", "+" ]);
    if (SX.needs) {
      const ns = SX.needs.get(G.save);
      if (ns.food < 70) icons.push([ "food", ns.food < SX.needs.LOW ? "#e0514a" : "#d8a860", Math.floor(ns.food) ]);
      if (ns.water < 70) icons.push([ "water", ns.water < SX.needs.LOW ? "#e0514a" : "#6ab8f0", Math.floor(ns.water) ]);
    }
    if (SX.extra && SX.extra.hud) SX.extra.hud(icons);
    if (G.state === "raid" && SX.tac) {
      if (SX.tac.peeking()) icons.push([ "eye", "#fff6c8", "엿보기" ]);
      if (SX.tac.cover) icons.push([ "shield", "#8fd0ea", "엄폐" ]);
      if (SX.tac.blindT > .3) icons.push([ "eye", "#e0514a", "눈멂" ]);
      if (SX.tac.tearT > 0) icons.push([ "gas", "#d8e0b8", "최루" ]);
      if (SX.tac.inSmoke) icons.push([ "gas", "#c8ccd2", "연막" ]);
    }
    const ih = icons.map(i => i[0] + i[1] + i[2]).join("|");
    const box = $("hudIcons");
    if (box.dataset.k !== ih) {
      box.dataset.k = ih;
      box.innerHTML = "";
      for (const [n, c, t] of icons) {
        const d = document.createElement("div");
        d.className = "ic";
        d.dataset.ic = n;
        const cv = document.createElement("canvas");
        cv.width = 16;
        cv.height = 16;
        cv.getContext("2d").drawImage(ART.hud(n, c), 0, 0);
        d.appendChild(cv);
        if (t !== "") d.appendChild(document.createTextNode(t));
        box.appendChild(d);
      }
    }
    const w = A.weaponOf(p), TH = (G.state === "raid" || A.canShootHere()) && SX.tac && SX.tac.hold;
    $("wpName").textContent = TH ? TH.name : w ? I.shownName(w) : "맨손";
    if (TH) {
      $("wpAmmo").textContent = A.canShootHere() ? "∞" : "×" + countSame(p.kit, TH.name);
      $("wpMode").textContent = SX.tac.aim && !SX.tac.aim.cancel ? "놓으면 던지기 · " + SX.label("aim") + " 취소" : SX.label("fire") + " 누르고 조준";
    } else if (w && w.kind === "gun") {
      const at = I.typeOf(w), inf = A.canShootHere(), oth = inf ? 0 : I.ammoCount(p.kit, w.caliber) - I.ammoCount(p.kit, w.caliber, at);
      $("wpAmmo").textContent = (w.ammo || 0) + " / " + (inf ? "∞" : I.ammoCount(p.kit, w.caliber, at));
      $("wpMode").innerHTML = "<span>" + esc(p.reload ? "재장전 중…" : (w.auto ? "자동" : "단발") + " · " + w.caliber) + "</span>" + (at ? " <b style='color:" + SX.AMMO_TYPES[at].col + "'>" + esc(I.typeName(w.caliber, at)) + "</b>" : "") + (oth > 0 ? " <span class='dim'>· 다른 탄 " + oth + "</span>" : "");
    } else {
      $("wpAmmo").textContent = w ? "근접" : "-";
      $("wpMode").textContent = w ? SX.label("fire") + "·" + SX.label("melee") + " 휘두르기" : "";
    }
    let info = "";
    if (G.state === "raid" && SX.raid.level) {
      const R = SX.raid, F = R.floor(), lv = R.level;
      const t = Math.floor(R.t);
      if (SX.free && SX.free.on()) info += `<div class="freeTag">🎒 마지막 희망 판 <span class="small">내 장비는 셸터에 · 의식을 잃으면 받은 장비만 없어집니다</span></div>`;
      info += `<div class="hiTime">${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")} · ${G.env.night ? "밤" : "낮"}${SX.wx ? esc(SX.wx.label(G.env)) : G.env.rain ? " · 비" : ""}${R.event ? " · <b class='warn'>" + esc(R.event.name) + "</b>" : ""}</div>`;
      const gf = Math.max(0, Math.ceil(R.gasY / SX.map.FH));
      if (R.fire) {
        const FH = SX.map.FH, low = Math.max(0, Math.floor(((R.smokeY != null ? R.smokeY : R.smokeAt(R.t)) - 1.6) / FH) + 1), se = R.smokeEta(p.floor);
        info += `<div class="gas hiGas">연기: ${low >= lv.building.floors ? "꼭대기 층 천장" : low + 1 + "층까지"}${R.inSmoke ? " — <b class='bad'>이 층 연기!</b>" : ""}</div>`;
        if (se != null && se > 0) {
          const s = Math.ceil(se), mm = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
          info += `<div class="gas hiEta">${R.fname(p.floor)}에 차기까지 ${se < 60 ? "<b class='bad'>" + mm + "</b>" : mm}</div>`;
        } else info += `<div class="gas hiEta"><b class='bad'>앉으면 연기를 덜 마십니다</b></div>`;
        info += `<div class="lock hiLock">⛓ 1층 문 막힘 · 지하 주차장으로</div>`;
      } else if (R.flood) {
        const DEP = [ "", "발목 깊이", "무릎 깊이", "허리 깊이", "키를 넘음", "다 잠김" ], wl = R.wLvOf(p.floor), we = R.waterEta(p.floor), de = R.floodDoorEta();
        let top = -1;
        for (let f = 0; f < lv.roofIdx; f++) if (R.wDepth(f) >= .05) top = f;
        info += `<div class="gas hiGas">물: ${top < 0 ? "아직 바닥 아래" : R.fname(top) + " " + DEP[R.wLvOf(top)]}${wl >= 5 ? " — <b class='bad'>숨 " + Math.max(0, Math.ceil(R.breath)) + "초</b>" : wl >= 4 ? " — <b class='bad'>헤엄</b>" : ""}</div>`;
        if (we == null) info += `<div class="gas hiEta">옥상엔 물이 안 옵니다</div>`; else if (we > 0) {
          const s = Math.ceil(we), mm = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
          info += `<div class="gas hiEta">${R.fname(p.floor)} 허리까지 ${we < 60 ? "<b class='bad'>" + mm + "</b>" : mm}</div>`;
        } else info += `<div class="gas hiEta"><b class='bad'>위층 · 옥상으로 올라가십시오</b></div>`;
        info += `<div class="lock hiLock">${R.floodLocked || de == null ? "⛓ 1층 문 물에 막힘 · 옥상으로" : "1층 문 막히기까지 " + Math.ceil(de) + "초"}</div>`;
      } else {
        if (lv.outdoor === "site") info += `<div class="gas hiGas">가스: ${gf <= 0 ? "땅 밑" : "공사장 안"}${R.gasHere >= 1 ? " — <b class='bad'>오염!</b>" : ""}</div>`; else if (lv.outdoor === "tunnel") info += `<div class="gas hiGas">가스: ${gf <= 0 ? "선로 아래" : "터널 안"}${R.gasHere >= 1 ? " — <b class='bad'>오염!</b>" : ""}</div>`; else if (lv.outdoor) info += `<div class="gas hiGas">가스: ${gf <= 0 ? "강 아래" : "다리 위"}${R.gasHere >= 1 ? " — <b class='bad'>오염!</b>" : ""}</div>`; else info += `<div class="gas hiGas">가스: ${gf <= 0 ? "지하" : Math.min(gf, lv.building.floors) + "층까지"}${R.gasHere >= 1 ? " — <b class='bad'>이 층 오염!</b>" : ""}</div>`;
        const eta = R.gasEta ? R.gasEta(p.floor) : null;
        if (eta == null) info += `<div class="gas hiEta">${lv.building.train ? "여기는 가스가 안 찹니다" : "옥상엔 가스가 안 옵니다"}</div>`; else if (eta > 0) {
          const s = Math.ceil(eta), mm = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
          info += `<div class="gas hiEta">${lv.outdoor === "site" ? "공사장 안에" : lv.outdoor === "tunnel" ? "터널 안에" : lv.outdoor ? "다리 위에" : p.floor + 1 + "층에"} 차기까지 ${eta < 60 ? "<b class='bad'>" + mm + "</b>" : mm}</div>`;
        }
        if (!lv.building.train) info += `<div class="lock hiLock">${lv.outdoor === "site" ? R.locked ? "⛓ 정문 잠김 · 북쪽 뒷문으로" : "정문 잠기기까지 " + Math.max(0, Math.ceil(R.lockLeft)) + "초" : lv.outdoor === "tunnel" ? R.locked ? "⛓ 역 셔터 내려옴 · 북쪽 사다리로" : "역 셔터까지 " + Math.max(0, Math.ceil(R.lockLeft)) + "초" : lv.outdoor ? R.locked ? "⛓ 남단 봉쇄됨 · 북단으로" : "남단 봉쇄까지 " + Math.max(0, Math.ceil(R.lockLeft)) + "초" : R.locked ? "⛓ 1층 봉쇄됨 · 옥상으로" : "1층 봉쇄까지 " + Math.max(0, Math.ceil(R.lockLeft)) + "초"}</div>`;
      }
      info += `<div class="small hiPing">[${esc(SX.label("ping"))}] 핑 · 지도 누르기 = 핑</div>`;
    } else if (G.state === "hub") {
      const home = SX.hub.scene === "home", range = SX.hub.scene === "range";
      const r = G.save.range || {
        best: 0
      };
      const fish = SX.hub.scene === "fish";
      const visit = SX.hub.scene === "visit" && SX.visit, mw = SX.meet && SX.meet.where ? SX.meet.where() : "";
      info += `<div class="floor">${home ? "셸터 · " + esc(SX.home.tier().name) : visit ? "🏠 " + esc(SX.visit.title()) : range ? "사격장" : SX.hub && SX.hub.scene === "gym" ? "헬스장" : fish ? "한강 낚시터" : "시장" + (mw ? " · " + esc(mw) : "")}</div><div class="money">${won(G.save.money)}</div>`;
      info += home ? "" : visit ? `<div class="small">둘러보기 — 상자는 열어 보기만 합니다</div>` : range ? `<div class="small">여기선 쏴도 됩니다 · 가장 먼 기록 ${r.best || 0}m</div><div class="small">관리대 = 총·파츠 고르기 · 예비탄 무한 · 왼쪽 문 = 시장</div>` : fish ? `<div class="small">물가에서 [${esc(SX.label("interact"))}] 낚시 · 잡은 물고기 ${(G.save.fish && G.save.fish.n) | 0}마리${G.save.fish && G.save.fish.best ? " · 가장 큰 것 " + esc(G.save.fish.best) + " " + G.save.fish.kg + "kg" : ""}</div><div class="small">낚시 가게 = 낚싯대 · 지렁이 · 모닥불 = 생선 굽기 · 위쪽 문 = 장터</div>` : `<div class="small">[${esc(SX.label("interact"))}] 상인에게 말 걸기</div><div class="small">왼쪽 지도판·문 = 도심 지도(셸터 · 출격)</div>`;
    }
    const Cp = SX.coop;
    if (Cp && G.state !== "title") {
      if (Cp.raid && !Cp.raid.offline) {
        const R = Cp.raid, all = [ ...R.members ], mates = all.filter(g => R.teams.get(g) === R.team).length, foes = all.length - mates;
        info += `<div class="small hiTeam" style="color:#6ec0ff">🌐 우리 팀 ${mates}명${foes ? ` · <span style="color:#ff8a7a">적 팀 ${foes}명</span>` : ""}${R.auth === R.me ? " · 적은 이 창이" : ""}</div>`;
      } else if (Cp.q) info += `<div class="small" style="color:#6ec0ff">🌐 매칭 대기 ${Cp.q.waited || 0}초 · ${Cp.q.teams || 1}팀 ${Cp.q.players || 1}명</div>`;
    }
    hudParty(Cp);
    hudFac(G);
    if ((G.state === "raid" || G.state === "hub") && !(SX.course && SX.course.on)) {
      const trk = U.trackList(), need = U.needList(), fd = hudFold();
      if (G.state === "raid") info += hudRaidList(trk, need, fd); else {
        if (trk.length) info += `<div class="trk${fd.trk ? " fold" : ""}">${hudFoldHead("trk", "📌 추적 중", trk.length, fd.trk)}` + (fd.trk ? "" : trk.slice(0, 8).map(q => `<div class="${q.ok ? "ok" : q.full ? "full" : ""}">${q.ok || q.full ? "✓" : "·"} <i class="tk ${q.k}">${TK_NAME[q.k]}</i> ${esc(q.t)}${q.p ? ` <b>${esc(q.p).replace(/^(\d+)\+(\d+)\//, '$1<i class="tkAdd">+$2</i>/')}</b>` : ""}</div>`).join("") + (trk.length > 8 ? `<div class="small">… 외 ${trk.length - 8}가지</div>` : "") + (trk.live ? `<div class="small tkLv">+ 이번 판 몫 · 판이 끝나면 셉니다</div>` : "")) + `</div>`;
        if (need.length) info += `<div class="need${fd.need ? " fold" : ""}">${hudFoldHead("need", "📋 찾을 물건", need.length, fd.need)}` + (fd.need ? "" : need.slice(0, 8).map(q => `<div class="${q.have >= q.n ? "ok" : ""}">${q.have >= q.n ? "✓" : "·"} ${esc(q.name)} <b>${Math.min(q.have, q.n)}/${q.n}</b></div>`).join("") + (need.length > 8 ? `<div class="small">… 외 ${need.length - 8}가지</div>` : "")) + `</div>`;
      }
    }
    if ($("hudInfo").dataset.h !== info) {
      $("hudInfo").dataset.h = info;
      $("hudInfo").innerHTML = info;
    }
    const q = $("hudQuick");
    const key = p.kit.quick.map(id => {
      const it = id && I.kitFind(p.kit, id);
      return it ? it.id + it.name : "-";
    }).join("|") + (p.use ? "u" : "");
    if (q.dataset.k !== key) {
      q.dataset.k = key;
      q.innerHTML = "";
      p.kit.quick.forEach((id, k) => {
        const d = document.createElement("div");
        d.className = "qs";
        const it = id && I.kitFind(p.kit, id);
        if (!it) d.classList.add("emp");
        if (it) {
          d.appendChild(iconCanvas(it));
          const n = countSame(p.kit, it.name);
          if (n > 1) {
            const i2 = document.createElement("i");
            i2.textContent = n;
            d.appendChild(i2);
          }
        }
        const b = document.createElement("b");
        b.textContent = SX.label("q" + (k + 4));
        d.appendChild(b);
        q.appendChild(d);
      });
    }
  };
  function countSame(kit, name) {
    let n = 0;
    for (const g of I.kitGrids(kit)) for (const e of g.list) if (e.it.name === name) n++;
    return n;
  }
  function renderSpec(p) {
    const Cp = SX.coop, on = !!(Cp && Cp.spec && p && p.spect && SX.game.state === "raid");
    document.body.classList.toggle("spec", on);
    const el = $("hudSpec");
    if (!el) return;
    if (!on) {
      el.classList.add("hidden");
      el.dataset.h = "";
      return;
    }
    const m = Cp.mates(), k = Math.max(0, m.findIndex(g => g.pid === Cp.spec.gid));
    const h = `<span>👁 <b>${esc(Cp.specName())}</b> 을(를) 보는 중 · ${k + 1}/${m.length}</span>` + (m.length > 1 ? `<button data-spec="-1">◀ 이전</button><button data-spec="1">다음 ▶</button>` : "") + `<button data-spec="x">그만 보고 결과 보기</button>`;
    if (el.dataset.h !== h) {
      el.dataset.h = h;
      el.innerHTML = h;
    }
    el.classList.remove("hidden");
  }
  {
    const el = $("hudSpec");
    if (el) el.addEventListener("click", e => {
      const b = e.target.closest("[data-spec]");
      if (!b || !SX.coop) return;
      const v = b.dataset.spec;
      if (v === "x") SX.coop.specLeave(); else SX.coop.specCycle(+v);
    });
  }
  U.wheel = null;
  U.wheelEat = false;
  const WH = {
    R: 170,
    r: 56,
    dead: 44
  };
  let wheelEl = null, wheelCv = null;
  function wheelDom() {
    if (wheelEl) return;
    wheelEl = document.createElement("div");
    wheelEl.id = "qwheel";
    wheelEl.className = "hidden";
    wheelCv = document.createElement("canvas");
    wheelEl.appendChild(wheelCv);
    document.body.appendChild(wheelEl);
  }
  U.wheelSel = function(mx, my) {
    const dx = mx - innerWidth / 2, dy = my - innerHeight / 2, n = I.QUICK_N;
    if (Math.hypot(dx, dy) < WH.dead * U.wheelK()) return -1;
    let a = Math.atan2(dx, -dy);
    if (a < 0) a += Math.PI * 2;
    return Math.floor(a / (Math.PI * 2) * n + .5) % n;
  };
  U.wheelK = () => Math.max(.8, Math.min(1.6, innerHeight / 900));
  U.wheelOpen = function() {
    wheelDom();
    U.wheel = {
      sel: -1
    };
    wheelEl.classList.remove("hidden");
    SX.audio.play("click", {
      vol: .5
    });
    drawWheel();
  };
  U.wheelClose = function(use, F, p) {
    if (!U.wheel) return;
    const k = U.wheel.sel;
    U.wheel = null;
    if (wheelEl) wheelEl.classList.add("hidden");
    if (use && k >= 0 && SX.game.state === "hub") {
      U.hubQuick(k);
      return;
    }
    if (use && k >= 0 && F && p) {
      const id = p.kit.quick[k], it = id && I.kitFind(p.kit, id);
      if (it) A.useQuick(F, p, k); else SX.audio.play("denied");
    }
  };
  U.hubQuick = function(k) {
    const kit = SX.game.kit, id = kit.quick[k], it = id && I.kitFind(kit, id);
    if (!it) {
      SX.audio.play("denied");
      return;
    }
    if (it.kind === "grenade" && A.canShootHere() && SX.tac) {
      SX.tac.take(A.player, it);
      return;
    }
    if (it.kind !== "cure" && !(SX.needs && SX.needs.of(it) && !it.kind)) {
      SX.log("판 안에서 씁니다");
      SX.audio.play("denied");
      return;
    }
    const c = I.kitPath(kit, it);
    contextUse(it, c ? {
      kind: "grid",
      grid: kit[c.c].grid,
      tag: "kit"
    } : null);
  };
  U.wheelTick = function(F, p, In) {
    if (!U.wheel) {
      if (In.pressed("wheel") && !U.isOpen()) U.wheelOpen();
      return;
    }
    if (!p.alive || U.isOpen() || SX.game.state !== "raid" && SX.game.state !== "hub" || SX.home && SX.home.deco) {
      U.wheelClose(false);
      return;
    }
    const pw = SX.pad && SX.pad.wheelXY(), sel = pw ? U.wheelSel(pw[0], pw[1]) : U.wheelSel(In.mx, In.my);
    if (sel !== U.wheel.sel) {
      U.wheel.sel = sel;
      if (sel >= 0) SX.audio.play("click", {
        vol: .25
      });
    }
    if (In.pressed("aim") || In.pressed("menu")) {
      U.wheelEat = true;
      U.wheelClose(false);
      return;
    }
    if (In.pressed("fire")) {
      U.wheelEat = true;
      U.wheelClose(true, F, p);
      return;
    }
    if (!In.held("wheel")) {
      U.wheelClose(true, F, p);
      return;
    }
    drawWheel(p);
  };
  function drawWheel(p) {
    p = p || A.player;
    if (!wheelCv || !p || !U.wheel) return;
    const k = U.wheelK(), R = WH.R * k, r = WH.r * k, S = Math.ceil(R * 2 + 8), n = I.QUICK_N, cx = S / 2, cy = S / 2;
    if (wheelCv.width !== S) {
      wheelCv.width = S;
      wheelCv.height = S;
      wheelCv.style.width = S + "px";
      wheelCv.style.height = S + "px";
    }
    const x = wheelCv.getContext("2d");
    x.clearRect(0, 0, S, S);
    x.imageSmoothingEnabled = false;
    const seg = Math.PI * 2 / n, a0 = -Math.PI / 2 - seg / 2;
    for (let i = 0; i < n; i++) {
      const id = p.kit.quick[i], it = id && I.kitFind(p.kit, id), on = U.wheel.sel === i, s0 = a0 + i * seg + .02, s1 = a0 + (i + 1) * seg - .02;
      x.beginPath();
      x.arc(cx, cy, R, s0, s1);
      x.arc(cx, cy, r, s1, s0, true);
      x.closePath();
      x.fillStyle = on ? it ? "rgba(214,186,96,0.92)" : "rgba(140,70,60,0.85)" : it ? "rgba(22,26,32,0.86)" : "rgba(14,16,20,0.62)";
      x.fill();
      x.lineWidth = on ? 3 : 1.5;
      x.strokeStyle = on ? "#fff4c0" : "rgba(200,190,160,0.45)";
      x.stroke();
      const am = a0 + (i + .5) * seg, mr = (R + r) / 2, px = cx + Math.cos(am) * mr, py = cy + Math.sin(am) * mr;
      if (it) {
        const ic = ART.icon(it), sc = Math.min(1.6 * k, 46 * k / ic.width, 40 * k / ic.height), w = Math.round(ic.width * sc), h = Math.round(ic.height * sc);
        x.drawImage(ic, Math.round(px - w / 2), Math.round(py - h / 2 - 4 * k), w, h);
        const cnt = countSame(p.kit, it.name);
        if (cnt > 1) {
          x.font = Math.round(13 * k) + "px Galmuri11, monospace";
          x.textAlign = "right";
          x.fillStyle = "#000";
          x.fillText("×" + cnt, px + 23 * k + 1, py + 17 * k + 1);
          x.fillStyle = "#fff";
          x.fillText("×" + cnt, px + 23 * k, py + 17 * k);
        }
      }
      const lab = SX.label("q" + (i + 4));
      x.font = Math.round(12 * k) + "px Galmuri11, monospace";
      x.textAlign = "center";
      const lx = cx + Math.cos(am) * (R - 13 * k), ly = cy + Math.sin(am) * (R - 13 * k) + 4 * k;
      if ((SX.keys["q" + (i + 4)] || []).length) {
        x.fillStyle = "#000";
        x.fillText(lab, lx + 1, ly + 1);
        x.fillStyle = on ? "#1a1408" : "#d8d0b0";
        x.fillText(lab, lx, ly);
      }
    }
    x.beginPath();
    x.arc(cx, cy, r - 4 * k, 0, Math.PI * 2);
    x.fillStyle = "rgba(10,12,16,0.9)";
    x.fill();
    x.strokeStyle = "rgba(200,190,160,0.5)";
    x.lineWidth = 1.5;
    x.stroke();
    const sel = U.wheel.sel, sid = sel >= 0 ? p.kit.quick[sel] : null, sit = sid && I.kitFind(p.kit, sid);
    const T = SX.tr || (s => s), lines = sel < 0 ? [ T("단축 칸"), T("놓으면 닫힙니다") ] : sit ? [ sit.name, T("놓으면 씁니다") ] : [ T("빈 칸"), T("가방에서 칸에 끌어 넣으십시오") ];
    x.textAlign = "center";
    x.fillStyle = "#fff4c0";
    x.font = Math.round(14 * k) + "px Galmuri11, monospace";
    const fit = (t, m) => {
      let s = t;
      while (s.length > 2 && x.measureText(s).width > m) s = s.slice(0, -2) + "…";
      return s;
    };
    x.fillText(fit(lines[0], (r - 10 * k) * 2), cx, cy - 2 * k);
    x.fillStyle = "#b8b0a0";
    x.font = Math.round(11 * k) + "px Galmuri11, monospace";
    x.fillText(fit(lines[1], (r - 8 * k) * 2), cx, cy + 15 * k);
  }
  U.__wheel = {
    draw: drawWheel
  };
  function gridEl(grid, tag, opt) {
    const c = opt && opt.c || cellPx();
    const el = document.createElement("div");
    el.className = "grid";
    if (opt && opt.c) {
      el._c = c;
      el.style.setProperty("--cell", c + "px");
    }
    el.style.width = grid.cols * c + "px";
    el.style.height = grid.rows * c + "px";
    el._grid = grid;
    el._tag = tag;
    const hide = opt && opt.reveal != null ? opt.reveal : Infinity;
    grid.list.forEach((e, k) => {
      const [w, h] = I.size(e.it);
      const d = document.createElement("div");
      d.className = "it" + (e.it.quest ? " q" : "") + (e.it.story ? " st" : "") + (k >= hide ? " unk" : "") + (k < hide && U.needShort(e.it.name) ? " need" : "");
      d.style.left = e.x * c + "px";
      d.style.top = e.y * c + "px";
      d.style.width = w * c + "px";
      d.style.height = h * c + "px";
      d.appendChild(iconCanvas(e.it));
      const lab = I.isStack(e.it) ? I.qty(e.it) : e.it.kind === "mag" ? e.it.ammo : e.it.kind === "gun" ? e.it.ammo : e.it.kind === "armor" || e.it.kind === "helmet" ? Math.round(e.it.armor) : e.it.kind === "key" && SX.vault ? SX.vault.usesOf(e.it) : e.it.kind === "vaultkit" ? e.it.cells | 0 : e.it.tank && SX.prog && SX.prog.KIT && e.it.name === SX.prog.KIT.NAME ? SX.prog.kitTank(e.it) || "" : "";
      if (lab !== "" && lab != null) {
        const b = document.createElement("b");
        b.textContent = lab;
        if (e.it.kind === "gun" && I.typeOf(e.it)) b.style.color = SX.AMMO_TYPES[I.typeOf(e.it)].col; else if (e.it.tank) b.style.color = "#7cc8ff";
        d.appendChild(b);
      }
      modBadge(d, e.it);
      if (k < hide && SX.needmark) {
        const nk = SX.needmark.kind(e.it.name);
        if (nk) {
          const m = document.createElement("i");
          m.className = "nmk " + nk;
          d.appendChild(m);
        }
      }
      d._it = e.it;
      d._src = {
        kind: "grid",
        grid,
        tag
      };
      if (k >= hide) d._unk = true;
      el.appendChild(d);
    });
    if (grid.off) for (const k of grid.off) {
      const o = document.createElement("div");
      o.className = "off";
      o.style.left = k % grid.cols * c + "px";
      o.style.top = Math.floor(k / grid.cols) * c + "px";
      o.style.width = o.style.height = c + "px";
      el.appendChild(o);
    }
    if (grid.safe) el.classList.add("safeGrid");
    if (grid.creelBait) el.classList.add("baitGrid"); else if (grid.creel) el.classList.add("creelGrid"); else if (grid.accept) el.classList.add("foodGrid");
    return el;
  }
  function modBadge(d, it) {
    const n = I.modsOf(it).length;
    if (!n) return;
    const i2 = document.createElement("i");
    i2.className = "mods";
    i2.textContent = "+" + n;
    i2.title = I.modsOf(it).map(m => m.name).join(" · ");
    d.appendChild(i2);
  }
  function slotEl(slot, it, w, h, label) {
    const c = cellPx();
    const el = document.createElement("div");
    el.className = "slot";
    el.style.width = w * c + "px";
    el.style.height = h * c + "px";
    el._slot = slot;
    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = label;
    if (slot === "armor") lab.dataset.en = "Armor";
    el.appendChild(lab);
    if (it) {
      const d = document.createElement("div");
      d.className = "it";
      const cv = iconCanvas(it);
      d.appendChild(cv);
      const t = it.kind === "gun" ? it.ammo + "/" + it.magSize : it.kind === "armor" || it.kind === "helmet" ? Math.round(it.armor) + "/" + it.armorMax : "";
      if (t) {
        const b = document.createElement("b");
        b.textContent = t + (it.kind === "gun" && I.typeOf(it) ? " " + SX.ammoTypeTag(it.caliber, I.typeOf(it)) : "");
        if (it.kind === "gun" && I.typeOf(it)) b.style.color = SX.AMMO_TYPES[I.typeOf(it)].col;
        d.appendChild(b);
      }
      modBadge(d, it);
      d._it = it;
      d._src = {
        kind: "slot",
        slot
      };
      el.appendChild(d);
    }
    return el;
  }
  function quickEl(kit, k) {
    const c = cellPx();
    const el = document.createElement("div");
    el.className = "slot";
    const qs = SX.game.state !== "raid" && invFit.hub ? invFit.hub.qS : 1.05;
    el.style.width = c * qs + "px";
    el.style.height = c * qs + "px";
    el._quick = k;
    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = SX.label("q" + (k + 4));
    el.appendChild(lab);
    const it = kit.quick[k] && I.kitFind(kit, kit.quick[k]);
    if (it) {
      const d = document.createElement("div");
      d.className = "it";
      d.appendChild(iconCanvas(it));
      d._it = it;
      d._src = {
        kind: "quick",
        k
      };
      el.appendChild(d);
    }
    return el;
  }
  function kitColumn(kit, noQuick) {
    const col = document.createElement("div");
    col.className = "col";
    col.dataset.u = "K";
    const rig = document.createElement("div");
    rig.className = "box";
    rig.dataset.u = "Kr";
    rig.innerHTML = `<h3><span><span data-en="Rig:">리그</span> ${kit.rig ? esc(kit.rig.name) : "(없음)"}</span></h3>`;
    if (kit.rig) rig.appendChild(gridEl(kit.rig.grid, "kit"));
    const bag = document.createElement("div");
    bag.className = "box";
    bag.dataset.u = "Kb";
    bag.innerHTML = `<h3><span><span data-en="Bag:">가방</span> ${kit.bag ? esc(kit.bag.name) : "(없음)"}</span></h3>`;
    if (kit.bag) bag.appendChild(gridEl(kit.bag.grid, "kit"));
    for (const [box, it] of [ [ rig, kit.rig ], [ bag, kit.bag ] ]) if (it && it.grid.list.length > 1) {
      const b = document.createElement("button");
      b.className = "mini";
      b.textContent = "정리";
      b.dataset.tip = "큰 것부터 왼쪽 위로 모읍니다";
      b.onclick = () => {
        sortGrid(it.grid);
        U.afterChange();
      };
      box.querySelector("h3").appendChild(b);
    }
    for (const [box, it] of [ [ rig, kit.rig ], [ bag, kit.bag ] ]) if (it && it.grid.list.some(e => e.it.kind === "mag")) {
      const b = document.createElement("button");
      b.className = "mini";
      b.textContent = "탄 합치기";
      b.dataset.tip = "낱 탄창을 구경마다 탄 상자로 모읍니다(칸을 아낍니다 · 장전도 됩니다)";
      b.onclick = () => {
        boxAmmoUI(it.grid);
      };
      box.querySelector("h3").appendChild(b);
    }
    const foot = document.createElement("div");
    foot.className = "small";
    foot.dataset.u = "Kf";
    const kg = I.kitWeight(kit);
    foot.innerHTML = `무게 <b class="${kg > A.weightCap() ? "bad" : ""}">${kg.toFixed(2)} / ${A.weightCap()}kg</b> · <span class="money">${won(SX.game.save.money)}</span>`;
    col.append(rig, bag, foot);
    if (!noQuick) col.append(quickBox(kit));
    return col;
  }
  function quickBox(kit) {
    const qb = document.createElement("div");
    qb.className = "box quickBox";
    qb.dataset.u = "Q";
    qb.innerHTML = "<h3><span>단축 칸</span><span class='small'>약·신호탄·수류탄·수리 키트를 끌어다 두십시오</span></h3>";
    const qr = document.createElement("div");
    qr.className = "quickRow";
    for (let k = 0; k < I.QUICK_N; k++) qr.appendChild(quickEl(kit, k));
    qb.appendChild(qr);
    return qb;
  }
  function equipColumn(kit, hub, ehSet) {
    const col = document.createElement("div");
    col.className = "col";
    col.dataset.u = "E";
    const box = document.createElement("div");
    box.className = "box";
    box.dataset.u = "EQ";
    const eh = ehSet || (hub && invFit.hub ? invFit.hub.eqH : 1.5);
    box.innerHTML = "<h3><span>장착</span><span class='small'>" + (SX.pad && SX.pad.on ? "Y 빠른 이동 · 끄는 중 Y 돌리기 · X 사용" : "R 돌리기 · Shift+클릭 빠른 이동 · 우클릭 사용") + "</span></h3>";
    if (SX.loadout && !SX.loadout.why()) {
      const lb = document.createElement("button");
      lb.className = "mini loOpen";
      lb.id = "invLoadout";
      lb.textContent = "🎒 장비 세트";
      lb.dataset.tip = "지금 장비를 세트로 저장하고, 저장한 세트를 한 번에 꾸립니다";
      lb.onclick = () => SX.loadout.open();
      box.querySelector("h3").appendChild(lb);
    }
    const grid = document.createElement("div");
    grid.className = "eqGrid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "auto auto";
    grid.style.gap = "calc(var(--u)*3)";
    grid.append(slotEl("w1", kit.w1, 4, eh, "1 주무기"), slotEl("helmet", kit.helmet, 2.2, eh, "방탄모"), slotEl("w2", kit.w2, 4, eh, "2 보조"), slotEl("armor", kit.armor, 2.2, eh, "방탄복"), slotEl("melee", kit.melee, 4, eh, "3 근접"), slotEl("rig", kit.rig, 2.2, eh, "리그"), slotEl("bag", kit.bag, 4, eh, "가방"));
    if (SX.vault) grid.append(safeSlot(eh));
    grid.append(slotEl("nvg", kit.nvg, 4, eh, "투시경"));
    box.appendChild(grid);
    const p = A.player;
    const st = document.createElement("div");
    st.className = "small";
    st.dataset.u = "Es";
    if (p) st.innerHTML = `체력 ${Math.ceil(p.hp)} · 감염 ${SX.game.save.infect.toFixed(1)}% · 가진 것 값 ${won(I.kitValue(kit))}`;
    const xb = SX.vault && !hub ? safeExtBox() : null;
    col.append(box);
    if (xb) col.append(xb);
    col.append(st);
    return col;
  }
  function safeSlot(eh) {
    const c = cellPx(), sm = SX.vault.summary(SX.game.save);
    const el = document.createElement("div");
    el.className = "safeBox " + (sm ? "on" : "none");
    el.style.width = 2.2 * c + "px";
    el.style.height = (eh || 1.5) * c + "px";
    el.dataset.tip = "개인 금고 — 셸터 설비 「금고 공방」에서 나온 개인 금고를 셸터에서 우클릭으로 쓰면 생깁니다. 넣은 것은 판에서 의식을 잃어도 남고, 보존 기간이 지나면 금고가 사라집니다(든 것은 보관함으로)";
    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = "개인 금고";
    lab.dataset.en = "Safe";
    el.appendChild(lab);
    const st = document.createElement("div");
    st.className = "safeSt";
    if (!sm) {
      const a = document.createElement("div");
      a.textContent = "없음";
      st.appendChild(a);
    } else {
      const a = document.createElement("div");
      a.textContent = sm.cells + "칸" + (sm.n > 1 ? " · 금고 " + sm.n + "개" : "");
      const b = document.createElement("div");
      b.className = sm.left > 0 ? "left" : "left warn";
      b.textContent = sm.left > 0 ? "남은 " + SX.vault.leftText(sm.left) : "끝남";
      st.append(a, b);
    }
    el.appendChild(st);
    return el;
  }
  function safeExtBox() {
    const sv = SX.vault.of(SX.game.save);
    if (!sv.ext.length) return null;
    const b = document.createElement("div");
    b.className = "box";
    b.innerHTML = "<h3><span>개인 금고</span><span class='small'>보존 기간이 지나면 금고가 사라지고 든 것은 보관함으로</span></h3>";
    const row = document.createElement("div"), now = Date.now();
    row.className = "safeExt";
    for (const e of sv.ext) {
      const one = document.createElement("div"), left = e.until - now;
      one.className = "one";
      const t = document.createElement("div");
      t.className = "small";
      t.innerHTML = e.n + "칸 · " + (left > 0 ? "남은 " + SX.vault.leftText(left) : "<b class='warn'>끝남 — 판이 끝나면 보관함으로</b>");
      one.append(t, gridEl(e.grid, "safe"));
      row.appendChild(one);
    }
    b.appendChild(row);
    return b;
  }
  let invOther = null;
  let peek = null;
  U.openInventory = function(other) {
    if (SX.hub && SX.hub.fight) {
      SX.log("주먹 싸움 중엔 가방을 못 엽니다");
      return;
    }
    if (A.player && A.player.spect) {
      SX.log("쓰러진 뒤에는 가방을 못 엽니다");
      return;
    }
    {
      const AU = SX.audio, OC = AU.OPEN_CONT || {}, OF = AU.OPEN_FURN || {};
      const snd = !other ? "zipper" : other.snd ? other.snd : other.kind === "loot" ? SX.sndPlace && SX.sndPlace.openOf(other.cont) || OC[other.cont && other.cont.type] || "rustle" : other.kind === "stash" ? OF.stash : other.kind === "display" ? OF[other.furn && other.furn.kind] || "pickup" : other.kind === "box" ? "openCrate" : "zipper";
      AU.play(snd || "zipper", {
        vol: .8
      });
    }
    if (!other && SX.game.state === "raid" && SX.raid.nearConts) {
      other = {
        kind: "near",
        title: "가방 · 주변",
        onClose: () => {
          U.loot = null;
        }
      };
      U.loot = {
        near: true,
        cont: null,
        acc: 0
      };
    } else if (!other && SX.game.state === "hub" && SX.hub.nearConts && SX.hub.nearConts().length) {
      other = {
        kind: "near",
        title: "가방 · 바닥에 둔 것",
        onClose: () => {
          U.loot = null;
        }
      };
      U.loot = {
        near: true,
        cont: null,
        acc: 0
      };
    }
    invOther = other || {
      kind: "none"
    };
    peek = null;
    invFit.key = null;
    const title = invOther.title || (invOther.kind === "loot" ? "뒤지기" : invOther.kind === "stash" ? "보관함" : invOther.kind === "display" ? "진열" : "가방");
    U.open("inv", `<div class="win invWin${SX.game.state !== "raid" ? " invWide" : ""}"${SX.game.state !== "raid" ? "" : ` style="min-width:60vw"`}>${header(esc(title))}<div class="body row" id="invBody" style="flex-wrap:wrap"></div></div>`, invOther.onClose);
    if (invOther.kind === "stash" || (invOther.kind === "box" || invOther.kind === "display") && SX.game.state === "hub") {
      const hd = panel.querySelector(".win > header");
      if (hd) hd.insertBefore(stashFind(), hd.querySelector(".x"));
    }
    renderInv();
  };
  const invFit = {
    key: null,
    done: false
  };
  let fitting = false;
  let nearC = null, nearW = 0, nearH = 0, nearPass = 0, nearMax = 0;
  const nearHead = new WeakMap;
  function invKey() {
    const k = SX.game.kit, s = SX.game.save, o = invOther || {}, g = x => x && x.grid ? x.grid.cols + "x" + x.grid.rows : "-";
    return [ innerWidth, innerHeight, SX.opts && SX.opts.ui || 1, SX.lang, o.kind, g(k.rig), g(k.bag), SX.vault ? SX.vault.of(s).ext.map(e => e.n).join(".") : "", s.stash ? s.stash.cols + "x" + s.stash.rows : "", o.grid ? o.grid.cols + "x" + o.grid.rows : "", o.cont && o.cont.grid ? o.cont.grid.cols + "x" + o.cont.grid.rows : "", o.kind === "near" ? nearList().map(q => q.cont && q.cont.grid ? q.cont.grid.cols + "x" + q.cont.grid.rows : "?").join(",") : "", peek && peek.it && peek.it.grid ? "p" + peek.it.grid.cols + "x" + peek.it.grid.rows : "" ].join("|");
  }
  function invFits(body, withPeek) {
    if (SX.trDom) SX.trDom(body);
    const kids = [ ...body.children ].filter(e => e.offsetWidth > 0 && (withPeek || !e.classList.contains("peekBox")) && !e.classList.contains("hidden"));
    const main = kids.filter(e => !e.classList.contains("overBox"));
    if (!main.length) return {
      ok: true,
      f: 1
    };
    const t0 = main[0].getBoundingClientRect().top, row = main.every(e => Math.abs(e.getBoundingClientRect().top - t0) < 3);
    const cs = getComputedStyle(body), win = body.closest(".win"), hdr = win && win.querySelector("header");
    const gap = parseFloat(cs.columnGap) || 0;
    const needW = main.reduce((a, e) => a + e.getBoundingClientRect().width, 0) + gap * (main.length - 1);
    const availW = innerWidth * .97 - (win ? win.offsetWidth - win.clientWidth : 0) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 6;
    const needH = Math.max(...main.map(e => e.getBoundingClientRect().height));
    const availH = innerHeight * .95 - (hdr ? hdr.offsetHeight : 0) - (win ? win.offsetHeight - win.clientHeight : 0) - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 6;
    return {
      ok: row && needW <= availW + 1 && needH <= availH + 1,
      f: Math.min(1, availW / needW, availH / needH),
      availH,
      availW
    };
  }
  function shrinkTo(floor, minC) {
    let cell = cellPx(), r = invFits($("invBody")), n = 0;
    while (!r.ok && cell > floor && n < 8) {
      const next = Math.max(floor, Math.floor(cell * Math.min(.96, r.f * .99)));
      if (minC && next < minC) return {
        ok: false,
        cell: next
      };
      cell = next;
      panel.style.setProperty("--cell", cell + "px");
      renderInv();
      $("invBody").offsetWidth;
      r = invFits($("invBody"));
      n++;
    }
    return {
      ok: r.ok,
      cell
    };
  }
  const HUB_CAP = 1.35, EQ_MAX = 2.6, Q_MAX = 1.7, S_MIN = 6;
  function hubKind() {
    const o = invOther;
    return SX.game.state !== "raid" && !!o && (o.kind === "stash" || o.kind === "display" || o.kind === "none" || o.kind === "box" && SX.game.state === "hub");
  }
  const hubDefault = o => ({
    place: {
      C: o.kind === "stash" ? "R" : o.kind === "none" ? "own" : "E",
      V: "E"
    },
    eqH: 1.5,
    qS: 1.05,
    sFlex: false,
    sMin: S_MIN,
    sH: null
  });
  function hubMeasure(c, L0) {
    invFit.hub = L0;
    panel.style.setProperty("--cell", c + "px");
    renderInv();
    const b = $("invBody"), m = {}, els = [ ...b.querySelectorAll("[data-u]") ];
    b.classList.add("fitW");
    for (const e of els) m[e.dataset.u] = {
      w: e.getBoundingClientRect().width
    };
    b.classList.remove("fitW");
    for (const e of els) m[e.dataset.u].h = e.getBoundingClientRect().height;
    const eg = b.querySelector(".eqGrid");
    m.eqRows = eg ? Math.ceil(eg.children.length / 2) : 5;
    return m;
  }
  function hubFit(base, floor) {
    const o = invOther, s = SX.game.save, L0 = hubDefault(o);
    const c0 = Math.round(base), c1 = Math.max(floor, Math.round(base * .7));
    const m0 = hubMeasure(c0, L0), m1 = hubMeasure(c1, L0), lin = {};
    for (const u in m0) if (m0[u] && m0[u].w != null && m1[u]) {
      const dw = (m0[u].w - m1[u].w) / (c0 - c1), dh = (m0[u].h - m1[u].h) / (c0 - c1);
      lin[u] = {
        w: c => m0[u].w + dw * (c - c0),
        h: c => m0[u].h + dh * (c - c0)
      };
    }
    const b = $("invBody"), r = invFits(b), cs = getComputedStyle(b), G = parseFloat(cs.columnGap) || 0, kc = b.querySelector('[data-u="K"]'), g = kc ? parseFloat(getComputedStyle(kc).rowGap) || 0 : 0;
    const uPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 2, sbW = uPx * 3 + 2;
    const rows = lin.S ? s.stash.rows : 0, sMin = Math.min(rows, S_MIN), eqRows = m0.eqRows, has = u => !!lin[u];
    const colsOf = P => {
      const cols = {
        K: [ "Kr", "Kb", "Kf", "Q" ].filter(has),
        E: [ "EQ", "Es" ].filter(has),
        R: has("R") ? o.kind === "stash" ? [ "S" ] : [ "B", "S" ] : null
      };
      if (P.V) (cols[P.V] || cols.E).push("V");
      if (P.C) {
        if (P.C === "own") cols.O = [ "C" ]; else (cols[P.C] || cols.E).push("C");
      }
      return cols;
    };
    const size = (cols, c, flex) => {
      let W = 0, H = 0, n = 0;
      const per = {};
      for (const k in cols) {
        const L = cols[k];
        if (!L || !L.length) continue;
        let w = 0, h = 0;
        for (const u of L) {
          w = Math.max(w, lin[u].w(c));
          h += u === "S" && flex ? lin.S.h(c) - (rows - sMin) * c : lin[u].h(c);
        }
        if (k === "R" && flex) w += sbW;
        h += g * (L.length - 1);
        per[k] = {
          w,
          h
        };
        W += w;
        H = Math.max(H, h);
        n++;
      }
      return {
        W: W + G * Math.max(0, n - 1),
        H,
        per
      };
    };
    const bestC = (cols, flex) => {
      const ok = c => {
        const z = size(cols, c, flex);
        return z.W <= r.availW && z.H <= r.availH;
      }, cap = Math.round(base * HUB_CAP);
      if (ok(cap)) return cap;
      if (!ok(floor)) return floor;
      let lo = floor, hi = cap;
      while (hi - lo > .5) {
        const mid = (lo + hi) / 2;
        if (ok(mid)) lo = mid; else hi = mid;
      }
      return Math.floor(lo);
    };
    const judge = (P, flex) => {
      const cols = colsOf(P), c = bestC(cols, flex), z = size(cols, c, flex);
      let hole = 0, eqH = 1.5, qS = 1.05, vis = flex ? sMin : rows;
      for (const k in z.per) {
        let L = z.H - z.per[k].h;
        if (L <= .5) continue;
        if (k === "R" && flex) {
          const a = Math.min(L, (rows - sMin) * c);
          vis += a / c;
          L -= a;
        }
        if (k === "E" && L > 0) {
          const a = Math.min(L, eqRows * (EQ_MAX - 1.5) * c);
          eqH = 1.5 + a / (eqRows * c);
          L -= a;
        }
        if (k === "K" && L > 0 && lin.Q) {
          const room = Math.max(0, (z.per.K.w - lin.Q.w(c)) / (5 * c)), a = Math.min(L, 2 * Math.min(Q_MAX - 1.05, room) * c);
          qS = 1.05 + a / (2 * c);
          L -= a;
        }
        hole += Math.max(0, L) * z.per[k].w;
      }
      return {
        P,
        flex,
        c,
        eqH,
        qS,
        hole: hole / (c * c),
        score: flex && rows - vis < 2 ? -1 : c * (1 - hole / Math.max(1, z.W * z.H))
      };
    };
    const Cs = has("C") ? has("R") ? [ "R", "E", "K", "own" ] : [ "own", "E", "K" ] : [ null ], Vs = has("V") ? has("R") ? [ "E", "K", "R" ] : [ "E", "K" ] : [ null ], Ps = [];
    for (const C of Cs) for (const V of Vs) Ps.push({
      C,
      V
    });
    const T = Math.round(base * .75);
    let pick = null;
    for (const P of Ps) {
      const j = judge(P, false);
      if ((!rows || j.c >= T) && (!pick || j.score > pick.score)) pick = j;
    }
    if (rows) for (const P of Ps) {
      const j = judge(P, true);
      j.score *= .9;
      if (!pick || j.score > pick.score) pick = j;
    }
    invFit.hub = {
      place: pick.P,
      eqH: pick.eqH,
      qS: pick.qS,
      sFlex: pick.flex,
      sMin,
      sH: null,
      c: pick.c,
      hole: pick.hole
    };
    panel.style.setProperty("--cell", pick.c + "px");
    renderInv();
    shrinkTo(floor);
  }
  function hubFill() {
    const L = invFit.hub;
    if (!L || !L.sFlex || SX.game.state === "raid") return;
    const b = $("invBody"), w = b && b.querySelector('[data-u="S"] [data-sc]');
    if (!w) return;
    const col = [ ...b.children ].find(e => e.contains(w));
    if (!col) return;
    const others = [ ...b.children ].filter(e => e !== col && e.classList.contains("col") && e.offsetWidth > 0).map(e => e.getBoundingClientRect().height);
    const r = invFits(b), rest = col.getBoundingClientRect().height - w.getBoundingClientRect().height, want = Math.min(r.availH, Math.max(0, ...others)) - rest, c = cellPx(), grid = w.firstElementChild ? w.firstElementChild.offsetHeight : 0;
    L.sH = want >= grid ? "none" : Math.max(c * L.sMin, Math.floor(want) - 1) + "px";
    w.dataset.mh = L.sH;
    fitScroll(w);
  }
  function fitInv() {
    if (fitting) return;
    const body = $("invBody");
    if (!body) return;
    const base = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cell")) || 32, floor = Math.max(22, Math.round(base * .55));
    fitting = true;
    body.classList.add("fitH");
    try {
      if ((nearC || nearH) && !invFits(body).ok) {
        nearC = null;
        nearW = 0;
        nearH = 0;
        renderInv();
      }
      if (!nearC) nearCap(body);
      if (!invFit.done && hubKind()) hubFit(base, floor); else {
        const w = invFit.hub && invFit.hub.sFlex && body.querySelector('[data-u="S"] [data-sc]');
        if (w) {
          w.dataset.mh = "calc(var(--cell) * " + invFit.hub.sMin + ")";
          fitScroll(w);
        }
        shrinkTo(floor);
      }
      let cell = cellPx();
      const r = invFits($("invBody"));
      const pb = $("invBody").querySelector(".peekBox:not(.hidden)");
      if (pb && r.ok && invFit.peekNo !== invFit.key) {
        const c0 = cell, lo = Math.max(floor, Math.round(c0 * .7));
        let q = invFits($("invBody"), true), m = 0;
        while (!q.ok && cell > lo && m < 8) {
          cell = Math.max(lo, Math.floor(cell * Math.min(.96, q.f * .99)));
          panel.style.setProperty("--cell", cell + "px");
          renderInv();
          body.offsetWidth;
          q = invFits($("invBody"), true);
          m++;
        }
        if (!q.ok) {
          invFit.peekNo = invFit.key;
          if (cell !== c0) {
            cell = c0;
            panel.style.setProperty("--cell", c0 + "px");
            renderInv();
          }
        }
      }
      hubFill();
    } finally {
      fitting = false;
      invFit.done = true;
      const b = $("invBody");
      if (b) b.classList.remove("fitH");
    }
  }
  addEventListener("resize", () => {
    if (U.panelKind === "inv") renderInv();
  });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => {
    if (U.panelKind === "inv") renderInv();
  });
  function renderInv() {
    const body = $("invBody");
    if (!body) return;
    if (!fitting) {
      const key = invKey();
      if (invFit.key !== key) {
        invFit.key = key;
        invFit.done = false;
        invFit.hub = null;
        nearC = null;
        nearW = 0;
        nearH = 0;
        nearMax = 0;
        panel.style.removeProperty("--cell");
      }
    }
    keepUI(body);
    body.innerHTML = "";
    const kit = SX.game.kit;
    const o = invOther;
    const creel = SX.game.state !== "raid" && SX.fishing ? creelBox() : null;
    if (hubKind()) {
      renderHub(body, kit, o, creel);
      if (peek) body.appendChild(peekBox());
      putUI(body);
      fitInv();
      return;
    }
    const ec = equipColumn(kit);
    body.append(kitColumn(kit), ec);
    if (creel && (o.kind === "none" || o.kind === "near")) {
      const cc = document.createElement("div");
      cc.className = "col";
      cc.append(creel);
      if (o.kind === "none") {
        body.appendChild(cc);
      } else {
        body.appendChild(nearBox());
        body.appendChild(cc);
      }
    }
    if (o.kind === "loot") {
      const b = document.createElement("div");
      b.className = "box";
      const left = o.cont.grid.list.length - (o.cont.searched ? o.cont.grid.list.length : o.cont.revealed || 0);
      b.innerHTML = `<h3><span>${esc(o.cont.name)}</span><span class="small">${o.cont.searched ? o.cont.grid.list.length ? "다 봤습니다" : "비었습니다" : "뒤지는 중… " + left}</span></h3>`;
      b.appendChild(gridEl(o.cont.grid, "other", {
        reveal: o.cont.searched ? Infinity : o.cont.revealed || 0
      }));
      const tb = document.createElement("div");
      tb.className = "row";
      tb.style.marginTop = "calc(var(--u)*2)";
      const all = document.createElement("button");
      all.id = "lootAll";
      all.textContent = "전부 가져가기";
      all.disabled = !o.cont.searched || !o.cont.grid.list.length;
      all.onclick = () => takeAllFrom(o.cont.grid);
      const hint = document.createElement("span");
      hint.className = "small";
      hint.textContent = "밖으로 끌어내면 바닥에 버립니다";
      tb.append(all, hint);
      b.appendChild(tb);
      body.appendChild(b);
    } else if (o.kind === "near") {
      if (!creel) body.appendChild(nearBox());
    } else if (o.kind === "stash") {
      body.appendChild(stashMain("60vh", false));
      stashWire(kit);
      body.appendChild(overflowBox());
    } else if (o.kind === "sell") {
      body.appendChild(sellColumn());
    } else if (o.kind === "box") {
      const b = document.createElement("div");
      b.className = "box";
      b.innerHTML = `<h3><span>${esc(o.title || "보관")}</span><span class="small">${I.cells(o.grid)}/${o.grid.cols * o.grid.rows}칸</span></h3>`;
      b.appendChild(gridEl(o.grid, "other"));
      if (SX.game.state === "hub") {
        const cc = document.createElement("div");
        cc.className = "col";
        cc.append(b, stashBox("38vh"));
        if (creel) ec.append(creel);
        body.appendChild(cc);
      } else body.appendChild(b);
      body.appendChild(overflowBox());
    }
    if (peek) body.appendChild(peekBox());
    putUI(body);
    fitInv();
    if (o.kind === "near") nearFit();
  }
  function renderHub(body, kit, o, creel) {
    const L = invFit.hub || hubDefault(o), cols = {};
    const mk = u => {
      const c = document.createElement("div");
      c.className = "col";
      c.dataset.u = u;
      return c;
    };
    cols.K = kitColumn(kit);
    cols.E = equipColumn(kit, true);
    const xb = SX.vault ? safeExtBox() : null;
    if (xb) xb.dataset.u = "V";
    const sh = L.sFlex ? L.sH && !fitting ? L.sH : "calc(var(--cell) * " + L.sMin + ")" : "none";
    if (o.kind === "stash") {
      cols.R = mk("R");
      cols.R.append(stashMain(sh, L.sFlex));
    } else if (o.kind === "box" || o.kind === "display") {
      let bb;
      if (o.kind === "display") bb = displayBox(o.furn); else {
        bb = document.createElement("div");
        bb.className = "box";
        bb.innerHTML = `<h3><span>${esc(o.title || "보관")}</span><span class="small">${I.cells(o.grid)}/${o.grid.cols * o.grid.rows}칸</span></h3>`;
        bb.appendChild(gridEl(o.grid, "other"));
      }
      bb.dataset.u = "B";
      cols.R = mk("R");
      cols.R.append(bb, stashBox(sh, L.sFlex));
    }
    for (const [u, el] of [ [ "V", xb ], [ "C", creel ] ]) {
      if (!el) continue;
      const w = L.place[u] || "E";
      if (w === "own") {
        cols.O = cols.O || mk("O");
        cols.O.append(el);
      } else if (w === "E" && u === "V") cols.E.insertBefore(el, cols.E.querySelector('[data-u="Es"]')); else (cols[w] || cols.E).append(el);
    }
    for (const k of [ "K", "E", "R", "O" ]) if (cols[k]) {
      body.appendChild(cols[k]);
      const bx = [ ...cols[k].children ].filter(e => e.classList.contains("box"));
      if (bx.length) bx[bx.length - 1].classList.add("grow");
    }
    if (o.kind === "stash") stashWire(kit);
    if (o.kind === "stash" || o.kind === "box") body.appendChild(overflowBox());
  }
  function stashMain(maxH, fix) {
    const s = SX.game.save;
    const b = document.createElement("div");
    b.className = "box";
    b.dataset.u = "S";
    const price = stashPrice();
    b.innerHTML = `<h3><span>보관함 ${s.stash.cols}×${s.stash.rows} (${I.cells(s.stash)}/${s.stash.cols * s.stash.rows}칸)</span><button id="stashMore">+2줄 ${won(price)}</button></h3>`;
    const wrap = scrollBox("stash", maxH);
    if (fix) wrap.dataset.fix = "1";
    const ge = gridEl(s.stash, "other");
    ge.dataset.sf = "1";
    wrap.appendChild(ge);
    const tb = document.createElement("div");
    tb.className = "row stashTools";
    tb.style.marginBottom = "calc(var(--u)*3)";
    tb.innerHTML = `<button id="stashSort">정리</button><button id="stashAmmo">탄 합치기</button><button id="stashAll">가방 → 보관함 전부</button><span class="small">셸터에서만 열립니다 · 판에 들고 갈 것만 가방에</span>`;
    b.appendChild(tb);
    b.appendChild(wrap);
    sfApply(b);
    return b;
  }
  const SF_CATS = [ [ "all", "전체" ], [ "gun", "무기" ], [ "ammo", "탄" ], [ "med", "약" ], [ "food", "먹을 것" ], [ "junk", "잡동사니" ], [ "need", "임무" ] ];
  const SF_EN = {
    all: "All",
    gun: "Weapons",
    ammo: "Ammo",
    med: "Meds",
    food: "Food",
    junk: "Junk",
    need: "Missions"
  };
  const sf = {
    q: "",
    cat: "all"
  };
  U.sfState = () => Object.assign({}, sf);
  U.sfReset = () => {
    sf.q = "";
    sf.cat = "all";
    inputMem.delete("sfq");
  };
  function sfIn(it, c) {
    if (c === "all") return true;
    if (c === "need") return !!(it.quest || it.story || SX.needmark && SX.needmark.kind && SX.needmark.kind(it.name));
    const k = U.fmCatOf({
      name: it.name,
      kind: it.kind
    });
    return c === "gun" ? k === "gun" || k === "parts" || k === "throw" : k === c;
  }
  const sfHit = it => sfIn(it, sf.cat) && U.fmHit({
    name: it.name,
    mods: I.modsOf(it).map(m => m.name)
  }, sf.q);
  U.sfHit = sfHit;
  function sfApply(root) {
    root = root || panel;
    const on = !!(sf.q || sf.cat !== "all");
    for (const g of root.querySelectorAll('.grid[data-sf="1"]')) for (const d of g.children) {
      if (!d._it) continue;
      const ok = !on || sfHit(d._it);
      d.classList.toggle("sfDim", !ok);
      d.classList.toggle("sfHit", on && ok);
    }
  }
  function stashFind() {
    const bar = document.createElement("div");
    bar.className = "row fmBar stashFind";
    const qi = document.createElement("input");
    qi.type = "text";
    qi.className = "fmQ sfQ";
    qi.maxLength = 40;
    qi.placeholder = "보관함에서 찾기";
    qi.spellcheck = false;
    qi.autocomplete = "off";
    qi.dataset.keep = "sfq";
    qi.value = sf.q;
    const qx = document.createElement("button");
    qx.className = "fmChip fmClr";
    qx.textContent = "✕";
    qx.title = "찾는 말 지우기";
    qx.disabled = !sf.q;
    bar.append(qi, qx);
    const chips = [];
    for (const [k, nm] of SF_CATS) {
      const b = document.createElement("button");
      b.className = "fmChip fmCat" + (sf.cat === k ? " on" : "");
      b.dataset.sf = k;
      b.innerHTML = `<span data-en="${SF_EN[k]}">${esc(nm)}</span>`;
      b.onclick = () => {
        sf.cat = sf.cat === k && k !== "all" ? "all" : k;
        SX.audio.play("click");
        for (const c of chips) c.classList.toggle("on", c.dataset.sf === sf.cat);
        sfApply();
      };
      chips.push(b);
      bar.appendChild(b);
    }
    qi.oninput = () => {
      sf.q = qi.value.slice(0, 40);
      inputMem.set("sfq", sf.q);
      qx.disabled = !sf.q;
      sfApply();
    };
    qi.onkeydown = e => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (sf.q) {
        qi.value = "";
        qi.oninput();
      } else qi.blur();
    };
    qx.onclick = () => {
      qi.value = "";
      qi.oninput();
      qi.focus();
    };
    return bar;
  }
  function stashWire(kit) {
    const s = SX.game.save, price = stashPrice();
    $("stashMore").onclick = () => U.ask("보관함 늘리기", "보관함에 두 줄을 더합니다.", price, () => {
      if (s.money < price) {
        SX.audio.play("denied");
        SX.log("돈이 모자랍니다");
        return;
      }
      s.money -= price;
      s.stash.rows += 2;
      SX.audio.play("buy");
      renderInv();
    });
    const now = () => SX.game.save === s && SX.game.kit === kit;
    $("stashSort").onclick = () => {
      if (held()) return;
      if (!now()) {
        stale();
        return;
      }
      sortGrid(s.stash);
      renderInv();
    };
    $("stashAmmo").onclick = () => {
      if (held()) return;
      if (!now()) {
        stale();
        return;
      }
      boxAmmoUI(s.stash);
      renderInv();
    };
    $("stashAll").onclick = () => {
      if (held()) return;
      if (!now()) {
        stale();
        return;
      }
      for (const g of I.kitGrids(kit)) for (const e of g.list.slice()) {
        const x = e.x, y = e.y, r = !!e.it.rot;
        if (I.take(g, e.it) && !I.putFill(s.stash, e.it)) I.put(g, e.it, x, y, r);
      }
      kit.quick = kit.quick.map(id => id && I.kitFind(kit, id) ? id : null);
      renderInv();
    };
  }
  function peekBox() {
    const b = document.createElement("div");
    b.className = "box peekBox";
    if (!peek || !peek.it.grid || peek.it.folded || !I.at(peek.grid, peek.it)) {
      peek = null;
      b.classList.add("hidden");
      return b;
    }
    const g = peek.it.grid;
    b.innerHTML = `<h3><span>${esc(peek.it.name)} 속</span><span class="small">${I.cells(g)}/${g.cols * g.rows}칸</span><button id="peekClose">닫기</button></h3>`;
    b.appendChild(gridEl(g, "other"));
    const hint = document.createElement("div");
    hint.className = "small";
    hint.style.marginTop = "calc(var(--u)*2)";
    hint.textContent = "메지 않고 안의 것만 꺼냅니다 — 끌어내거나 Shift+클릭";
    b.appendChild(hint);
    b.querySelector("#peekClose").onclick = () => {
      peek = null;
      renderInv();
    };
    return b;
  }
  U.peekBag = function(it, grid) {
    if (U.panelKind !== "inv" || !it || !it.grid) return false;
    if (it.folded) {
      SX.log("접힌 가방입니다 — 우클릭으로 펴면 열 수 있습니다");
      SX.audio.play("denied");
      return false;
    }
    if (grid && (grid.owned || grid.overFurn)) {
      SX.log(grid.owned ? "가방·리그 속 가방은 꺼낸 뒤 열어 주십시오" : "창고에 넣어 둔 가구 속 가방은 꺼낸 뒤 열어 주십시오");
      SX.audio.play("denied");
      return false;
    }
    if (grid && grid.shared && SX.coop && SX.coop.raid) {
      SX.log("같이 하는 판에선 가방째 가져와서 열어 주십시오");
      SX.audio.play("denied");
      return false;
    }
    peek = {
      it,
      grid
    };
    renderInv();
    return true;
  };
  function overflowBox() {
    const L = SX.game.state === "hub" ? SX.home.overflow() : [];
    const b = document.createElement("div");
    b.className = "box overBox";
    if (!L.length) {
      b.classList.add("hidden");
      return b;
    }
    b.innerHTML = `<h3><span>창고에 넣어 둔 가구 속 물건</span><span class="small">빼기만 됩니다 — 넣으려면 가구를 놓으시면 됩니다</span></h3>`;
    const wrap = scrollBox("over", "40vh");
    for (const o of L) {
      const one = document.createElement("div");
      one.className = "nearOne";
      one.innerHTML = `<h4><span>${esc(SX.home.FURN[o.f.kind].name)}</span></h4>`;
      one.appendChild(gridEl(o.grid, "other"));
      wrap.appendChild(one);
    }
    b.appendChild(wrap);
    return b;
  }
  function nearList() {
    const L = (SX.game.state === "raid" ? SX.raid.nearConts : SX.hub.nearConts)();
    invOther.conts = L.map(q => q.cont);
    return L;
  }
  function nearBox() {
    const L = nearList();
    const b = document.createElement("div");
    b.className = "box col nearBox";
    b.innerHTML = SX.game.state === "raid" ? `<h3><span>주변 (${L.length})</span><span class="small">시신 · 바닥 · 떨어진 가방 — 서랍·냉장고는 [${esc(SX.label("interact"))}]</span></h3>` : `<h3><span>바닥에 둔 것 (${L.length})</span><span class="small">셸터 바닥 더미 — 가방에서 창 밖으로 끌어내면 발밑에 둡니다</span></h3>`;
    if (!L.length) {
      const e = document.createElement("div");
      e.className = "small";
      e.style.padding = "calc(var(--u)*4)";
      e.textContent = "손 닿는 데 널린 게 없습니다 — 가방에서 창 밖으로 끌어내면 바닥에 버립니다";
      b.appendChild(e);
      return b;
    }
    const wrap = scrollBox("near", nearC ? "none" : nearH ? nearH + "px" : "64vh");
    wrap.className = "nearWrap";
    if (nearC) wrap.style.width = nearW + "px"; else if (nearMax) wrap.style.maxWidth = nearMax + "px";
    for (const q of L) {
      const c = q.cont;
      if (c.revealed == null) c.revealed = 0;
      const sb = document.createElement("div");
      sb.className = "nearOne";
      const left = c.grid.list.length - (c.searched ? c.grid.list.length : c.revealed || 0);
      const nm = c.type === "corpse" && q.prop.body ? q.prop.body.boss ? "두목 시신" : q.prop.body.vname ? q.prop.body.vname + " 시신" : q.prop.body.type === "zombie" ? "감염체 시신" : "약탈자 시신" : c.name;
      sb.innerHTML = `<h4><span>${esc(nm)}</span><span class="small">${c.searched ? c.grid.list.length ? "" : "비었습니다" : "뒤지는 중… " + left}</span></h4>`;
      sb.appendChild(gridEl(c.grid, "other", {
        reveal: c.searched ? Infinity : c.revealed || 0,
        c: nearC || 0
      }));
      const all = document.createElement("button");
      all.textContent = "전부";
      if (c.searched && c.grid.list.length > 1) all.onclick = () => takeAllFrom(c.grid); else {
        all.className = "ph";
        all.disabled = true;
        all.tabIndex = -1;
      }
      sb.appendChild(all);
      wrap.appendChild(sb);
    }
    b.appendChild(wrap);
    return b;
  }
  function nearCap(body) {
    const nb = body.querySelector(".nearBox"), wrap = nb && nb.querySelector(".nearWrap");
    if (!wrap) return;
    const W = e => e.getBoundingClientRect().width, px = v => parseFloat(v) || 0, ns = getComputedStyle(nb), G = px(getComputedStyle(body).columnGap);
    const others = [ ...body.children ].filter(e => e !== nb && e.offsetWidth > 0 && !e.classList.contains("hidden") && !e.classList.contains("overBox") && !e.classList.contains("peekBox"));
    let room = Math.floor(invFits(body).availW - others.reduce((a, e) => a + W(e) + G, 0) - (nb.offsetWidth - nb.clientWidth) - px(ns.paddingLeft) - px(ns.paddingRight) - 2);
    if (room < Math.max(0, ...[ ...wrap.children ].map(W))) room = 0;
    if (room === nearMax) return;
    nearMax = room;
    wrap.style.maxWidth = room ? room + "px" : "";
  }
  function nearFit() {
    if (fitting || nearPass >= 3) return;
    const body = $("invBody"), nb = body && body.querySelector(".nearBox"), wrap = nb && nb.querySelector(".nearWrap");
    if (!wrap || !wrap.children.length) return;
    let c = null, W = 0, H = 0;
    body.classList.add("fitH");
    try {
      const g = cellPx(), cur = nearC || g, R = e => e.getBoundingClientRect(), px = v => parseFloat(v) || 0;
      const row = [ ...body.children ].filter(e => e.offsetWidth > 0 && !e.classList.contains("hidden") && !e.classList.contains("overBox"));
      const nr = R(nb), t0 = Math.min(...row.map(e => R(e).top));
      if (Math.abs(nr.top - t0) < 3) {
        const others = row.filter(e => e !== nb && Math.abs(R(e).top - t0) < 3);
        const r = invFits(body), bs = getComputedStyle(body), ns = getComputedStyle(nb), ws = getComputedStyle(wrap);
        const G = px(bs.columnGap), gx = px(ws.columnGap), gy = px(ws.rowGap);
        const availW = r.availW - others.reduce((a, e) => a + R(e).width + G, 0) - (nb.offsetWidth - nb.clientWidth) - px(ns.paddingLeft) - px(ns.paddingRight) - 2;
        const top = R(wrap).top - nr.top, bot = px(ns.paddingBottom) + px(ns.borderBottomWidth);
        const its = [ ...wrap.children ].map(one => {
          const gr = one.querySelector(".grid"), G0 = gr._grid, os = getComputedStyle(one), h4 = one.querySelector("h4"), btn = one.querySelector("button"), or = R(one), gb = R(gr);
          let hw = h4 ? [ ...h4.children ].reduce((a, s) => a + R(s).width, 0) + px(getComputedStyle(h4).columnGap) * Math.max(0, h4.children.length - 1) : 0;
          hw = Math.max(hw, nearHead.get(G0) || 0);
          nearHead.set(G0, hw);
          return {
            cols: G0.cols,
            rows: G0.rows,
            bx: gb.width - G0.cols * cur,
            hw: Math.max(hw, btn ? R(btn).width : 0),
            px: px(os.paddingLeft) + px(os.paddingRight) + px(os.borderLeftWidth) + px(os.borderRightWidth),
            oh: R(one.lastElementChild).bottom - or.top + px(os.paddingBottom) + px(os.borderBottomWidth) - G0.rows * cur
          };
        });
        const lay = cc => {
          let x = 0, y = 0, lh = 0, w = 0;
          for (const q of its) {
            const iw = Math.max(q.cols * cc + q.bx, q.hw) + q.px, ih = q.rows * cc + q.oh;
            if (iw > availW) return null;
            if (x > 0 && x + gx + iw > availW) {
              y += lh + gy;
              x = 0;
              lh = 0;
            }
            x += (x > 0 ? gx : 0) + iw;
            lh = Math.max(lh, ih);
            w = Math.max(w, x);
          }
          return {
            w,
            h: y + lh
          };
        };
        const fit = (H, lo0) => {
          const ok = cc => {
            const z = lay(cc);
            return !!z && z.h <= H;
          };
          if (!ok(lo0)) return 0;
          let lo = lo0, hi = Math.floor(g * 2);
          if (ok(hi)) return hi;
          while (hi - lo > 1) {
            const m = Math.floor((lo + hi) / 2);
            if (m <= lo) break;
            if (ok(m)) lo = m; else hi = m;
          }
          return lo;
        };
        const Hrow = Math.max(0, ...others.map(e => R(e).height)) - top - bot - 2, Hmax = r.availH - top - bot - 2;
        c = fit(Hrow, g) || fit(Hmax, g) || fit(Hmax, Math.max(22, Math.round(g * .6))) || null;
        if (c) W = Math.ceil(lay(c).w) + 1; else H = Math.max(0, Math.floor(Hmax));
      }
    } finally {
      body.classList.remove("fitH");
    }
    if (c === nearC && H === nearH && (!c || W <= nearW && W >= nearW - 2)) return;
    nearC = c;
    nearW = c ? W : 0;
    nearH = H;
    nearPass++;
    try {
      renderInv();
    } finally {
      nearPass--;
    }
  }
  function stashBox(maxH, fix) {
    const s = SX.game.save;
    const b = document.createElement("div");
    b.className = "box";
    b.dataset.u = "S";
    b.innerHTML = `<h3><span>보관함</span><span class="small">${I.cells(s.stash)}/${s.stash.cols * s.stash.rows}칸</span></h3>`;
    const wrap = scrollBox("stashBox", maxH || "60vh");
    if (fix) wrap.dataset.fix = "1";
    const ge = gridEl(s.stash, "other");
    ge.dataset.sf = "1";
    wrap.appendChild(ge);
    b.appendChild(wrap);
    sfApply(b);
    return b;
  }
  function creelBox() {
    const g = SX.fishing.creelOf(SX.game.save), n = g.list.length;
    const b = document.createElement("div");
    b.className = "box creelBox";
    b.dataset.u = "C";
    b.innerHTML = `<h3><span class="crHead">조과통<span class="baitSlot"><span class="small">미끼</span></span></span><span class="small">물고기만 · ${n}/${g.cols * g.rows}마리</span></h3>`;
    {
      const bs = b.querySelector(".baitSlot");
      bs.dataset.tip = "미끼 칸 — 지렁이 뭉치 한 칸. 조과통에 지렁이를 놓으면 여기로 들어가고, 낚시할 때 여기 것부터 씁니다";
      bs.appendChild(gridEl(g.bait, "other"));
    }
    if (n > 1) {
      const sb = document.createElement("button");
      sb.className = "mini";
      sb.id = "creelSort";
      sb.textContent = "정리";
      sb.dataset.tip = "비싼 물고기부터 · 같은 것끼리 왼쪽 위로 모읍니다";
      sb.onclick = () => {
        if (held()) return;
        if (!liveGrids().has(g)) {
          stale();
          return;
        }
        sortGrid(g, creelCmp);
        SX.game.persist();
        U.afterChange();
      };
      b.querySelector("h3").appendChild(sb);
    }
    b.appendChild(gridEl(g, "other"));
    const hint = document.createElement("div");
    hint.className = "small";
    hint.style.marginTop = "calc(var(--u)*2)";
    hint.textContent = n ? "우클릭 날로 먹기 · 낚시 가게에 팔기 · 가스레인지에서 굽기" : "낚시터에서 잡은 물고기가 여기 먼저 들어옵니다";
    b.appendChild(hint);
    return b;
  }
  const creelCmp = (a, b) => ((I.def(b.name) || {}).val || 0) - ((I.def(a.name) || {}).val || 0) || a.name.localeCompare(b.name) || (+b.kg || 0) - (+a.kg || 0);
  function displayBox(f) {
    const H = SX.home, cat = H.FURN[f.kind], n = H.slotsOf(f), list = H.displayItems(f), c = cellPx();
    const b = document.createElement("div");
    b.className = "box";
    b.innerHTML = `<h3><span>${esc(cat.name)}</span><span class="small">${cat.use === "rack" ? "총·근접무기" : "무엇이든"} · ${n}칸</span></h3>`;
    const row = document.createElement("div");
    row.className = "dispSlots";
    for (let k = 0; k < n; k++) {
      const el = document.createElement("div");
      el.className = "slot";
      el.style.width = c * 2 + "px";
      el.style.height = c * 2 + "px";
      el._disp = k;
      const lab = document.createElement("span");
      lab.className = "lab";
      lab.textContent = k + 1;
      el.appendChild(lab);
      const it = list[k];
      if (it) {
        const d = document.createElement("div");
        d.className = "it";
        d.appendChild(iconCanvas(it));
        d._it = it;
        d._src = {
          kind: "disp",
          k,
          furn: f
        };
        el.appendChild(d);
      }
      row.appendChild(el);
    }
    b.appendChild(row);
    const hint = document.createElement("div");
    hint.className = "small";
    hint.style.marginTop = "calc(var(--u)*3)";
    hint.textContent = "보관함·가방에서 끌어다 놓으십시오. 셸터에 놓인 가구 위에 보입니다.";
    b.appendChild(hint);
    return b;
  }
  U.openDisplay = f => U.openInventory({
    kind: "display",
    furn: f,
    title: SX.home.FURN[f.kind].name
  });
  const scrollMem = new Map, inputMem = new Map;
  let focusMem = null;
  function scrollBox(key, maxH) {
    const w = document.createElement("div");
    w.dataset.sc = key;
    w.dataset.mh = maxH;
    w.style.maxHeight = maxH;
    w.style.overflowY = "hidden";
    w.style.overflowX = "hidden";
    return w;
  }
  function fitScroll(el) {
    const mh = el.dataset.mh;
    if (!mh) return;
    el.style.maxHeight = mh;
    el.style.overflowY = "hidden";
    el.style.scrollbarGutter = "";
    el.style.minWidth = "";
    const over = el.scrollHeight - el.clientHeight;
    if (over <= 0) return;
    if (over <= cellPx() * 1.5 && !el.dataset.fix) {
      el.style.maxHeight = "none";
      return;
    }
    el.style.overflowY = "auto";
    el.style.scrollbarGutter = "stable";
    const sb = el.offsetWidth - el.clientWidth, kid = el.firstElementChild;
    if (sb > 0 && kid) el.style.minWidth = kid.offsetWidth + sb + "px";
  }
  U.fitScroll = root => {
    for (const el of (root || document).querySelectorAll("[data-sc]")) fitScroll(el);
  };
  function keepUI(root) {
    if (!root) return;
    scrollMem.set("#" + root.id, root.scrollTop);
    for (const el of root.querySelectorAll("[data-sc]")) scrollMem.set(el.dataset.sc, el.scrollTop);
    for (const el of root.querySelectorAll("[data-keep]")) inputMem.set(el.dataset.keep, el.value);
    const a2 = document.activeElement;
    focusMem = a2 && a2.dataset && a2.dataset.keep && root.contains(a2) ? {
      key: a2.dataset.keep,
      s: a2.selectionStart,
      e: a2.selectionEnd
    } : null;
  }
  function putUI(root) {
    if (!root) return;
    const apply = () => {
      for (const el of root.querySelectorAll("[data-keep]")) {
        const v = inputMem.get(el.dataset.keep);
        if (v != null && el !== document.activeElement) el.value = v;
      }
      U.fitScroll(root);
      const rs = scrollMem.get("#" + root.id);
      if (rs) root.scrollTop = rs;
      for (const el of root.querySelectorAll("[data-sc]")) {
        const v = scrollMem.get(el.dataset.sc);
        if (v) el.scrollTop = v;
      }
      if (focusMem) {
        const el = root.querySelector('[data-keep="' + focusMem.key.replace(/"/g, '\\"') + '"]');
        if (el) {
          try {
            el.focus();
            if (focusMem.s != null) el.setSelectionRange(focusMem.s, focusMem.e);
          } catch (e) {}
        }
        focusMem = null;
      }
    };
    apply();
    requestAnimationFrame(apply);
  }
  U.refresh = () => {
    if (U.panelKind === "inv") renderInv(); else if (U.panelKind === "shop") renderShop();
  };
  U.afterChange = function() {
    if (dragging) return;
    {
      const kb = SX.game.kit && SX.game.kit.bag;
      if (kb && kb.folded) I.unfold(kb);
    }
    let n = I.consolidateKit(SX.game.kit);
    if (SX.game.state !== "raid") n += I.consolidateGrid(SX.game.save.stash);
    if (n) SX.log("탄창 " + n + "개를 합쳤습니다");
    cleanQuick();
    U.refresh();
    U.hudDirty();
  };
  function renderInj(p) {
    const box = $("hudInj");
    if (!box) return;
    const J = p.inj || {}, X = p.fx || {}, INJ = SX.INJURIES || {}, rows = [];
    const inRaid = SX.game.state === "raid";
    if (inRaid) for (const k of [ "bleedH", "bleedL" ]) if (J[k]) {
      const d = INJ[k];
      if (d) rows.push({
        k,
        icon: d.icon,
        c: d.col,
        name: d.name,
        tip: d.tip,
        fix: d.fix,
        hot: k === "bleedH"
      });
    }
    const mm = t => t >= 60 ? Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0") : Math.ceil(t) + "초";
    if (X.bonusT > 0) rows.push({
      k: "b2",
      buff: true,
      icon: "heart",
      c: "#6fe06a",
      name: "최대 체력 +" + X.bonus + " " + mm(X.bonusT)
    });
    if (X.stamT > 0) rows.push({
      k: "b3",
      buff: true,
      icon: "bolt",
      c: "#6fe06a",
      name: "기력 절약 " + mm(X.stamT)
    });
    const key = rows.map(r => r.k + r.name).join("|");
    if (box.dataset.k === key) return;
    box.dataset.k = key;
    box.innerHTML = "";
    for (const r of rows) {
      const d = document.createElement("div");
      d.className = "inj" + (r.buff ? " buff" : "") + (r.hot ? " hot" : "");
      d.style.setProperty("--c", r.c);
      const cv = document.createElement("canvas");
      cv.width = 16;
      cv.height = 16;
      cv.getContext("2d").drawImage(ART.hud(r.icon, r.c), 0, 0);
      d.appendChild(cv);
      const t = document.createElement("div");
      t.innerHTML = "<b>" + esc(r.name) + "</b>" + (r.fix ? "<small>→ " + esc(r.fix) + "</small>" : "") + (r.tip && !r.fix ? "<small>" + esc(r.tip) + "</small>" : "");
      d.appendChild(t);
      box.appendChild(d);
    }
  }
  function stashPrice() {
    const s = SX.game.save, base = 60 + (SX.prog.ngRows ? SX.prog.ngRows(s.ng) : 0) * s.stash.cols;
    return 5e5 + Math.max(0, s.stash.cols * s.stash.rows - base) * 18e3;
  }
  function boxAmmoUI(g) {
    const r = I.boxAmmo(g);
    if (r.boxes) SX.log("📦 탄 합치기 — 탄창 " + r.mags + "개 → 탄 상자 " + r.boxes + "개" + (r.fail.length ? " (" + r.fail.join("·") + " 은 칸이 모자라 그대로)" : ""), "good"); else SX.log(r.fail.length ? "칸이 모자라 못 합쳤습니다(" + r.fail.join("·") + ")" : "합칠 탄창이 없습니다");
    SX.audio.play(r.boxes ? "reload" : "denied", {
      vol: .5
    });
    cleanQuick();
    U.refresh();
    U.hudDirty();
  }
  function sortGrid(g, cmp) {
    const keep = g.list.map(e => ({
      it: e.it,
      x: e.x,
      y: e.y,
      rot: e.it.rot
    }));
    const items = g.list.map(e => e.it).sort(cmp || ((a, b) => b.w * b.h - a.w * a.h || a.name.localeCompare(b.name)));
    g.list = [];
    let ok = true;
    for (const it of items) {
      it.rot = false;
      if (!I.put(g, it)) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      g.list = keep.map(e => {
        e.it.rot = e.rot;
        return {
          it: e.it,
          x: e.x,
          y: e.y
        };
      });
      SX.log("정리할 자리가 모자라 그대로 뒀습니다");
    }
  }
  U.openLoot = function(cont) {
    if (cont.revealed == null) cont.revealed = 0;
    U.loot = {
      cont,
      acc: 0
    };
    U.openInventory({
      kind: "loot",
      cont,
      onClose: () => {
        U.loot = null;
      }
    });
  };
  function searchedOne() {
    if (SX.skills) SX.skills.gain("search", 1);
    if (SX.game.state === "raid" && SX.game.stats) {
      SX.game.stats.searched = (SX.game.stats.searched | 0) + 1;
      if (U.liveBump) U.liveBump();
    }
  }
  function searchTick(dt) {
    const L = U.loot;
    if (L.near) {
      if (!L.cont || L.cont.searched || !(invOther.conts || []).includes(L.cont)) L.cont = (invOther.conts || []).find(c => !c.searched) || null;
      if (!L.cont) return;
      if (L.cont.revealed == null) L.cont.revealed = 0;
    }
    const c = L.cont;
    if (c.searched) return;
    if (c.revealed >= c.grid.list.length) {
      c.searched = true;
      searchedOne();
      renderInv();
      return;
    }
    const it = c.grid.list[c.revealed].it;
    L.acc += dt / (SX.skills ? SX.skills.mul("search") : 1);
    const need = .25 + .12 * it.w * it.h * (it.val > 1e5 ? 1.4 : 1);
    if (L.acc >= need) {
      L.acc = 0;
      c.revealed++;
      SX.audio.play("rustle", {
        vol: .5
      });
      if (c.revealed >= c.grid.list.length) {
        c.searched = true;
        searchedOne();
      }
      if (!dragging) renderInv();
    }
  }
  let dragging = null;
  U.isDragging = () => !!dragging;
  U.contChanged = function(c) {
    if (partsGun && partsSrc && partsSrc.kind === "grid" && partsSrc.grid === c.grid && U.partsOpen && U.partsOpen() && !c.grid.list.some(e => e.it === partsGun)) {
      const e = c.grid.list.find(q => q.it.id === partsGun.id);
      if (e) {
        partsGun = e.it;
        partsRendered = e.it;
        renderParts();
      } else U.closeParts();
    }
    if (U.panelKind === "inv" && invOther && (invOther.kind === "loot" && invOther.cont === c || invOther.kind === "near" && (invOther.conts || []).includes(c)) && !dragging) renderInv();
  };
  function cancelDrag() {
    if (!dragging) return;
    if (dragging.el) dragging.el.style.opacity = "";
    dragging = null;
    ghost.classList.add("hidden");
    clearHints();
  }
  function clearHints() {
    for (const h of panel.querySelectorAll(".hint")) h.remove();
    for (const s of panel.querySelectorAll(".drop")) s.classList.remove("drop");
  }
  panel.addEventListener("mousedown", e => {
    const d = e.target.closest(".it");
    if (!d || !d._it || d._unk) return;
    if (e.button === 0 || e.button === 2) {
      if (held()) {
        e.preventDefault();
        return;
      }
      if (!srcOk(d._it, d._src)) {
        e.preventDefault();
        stale();
        return;
      }
    }
    if (e.button === 2) {
      if (e.shiftKey || !rcUses(d._it, d._src)) U.showDetail({
        inst: d._it
      }); else contextUse(d._it, d._src);
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    if (e.shiftKey) {
      e.preventDefault();
      sweep = {
        done: new Set([ d._it ]),
        side: sideOf(d._src)
      };
      quickMove(d._it, d._src);
      return;
    }
    e.preventDefault();
    const rect = d.getBoundingClientRect(), c = cellOf(d.closest(".grid"));
    dragging = {
      it: d._it,
      src: d._src,
      el: d,
      rot: !!d._it.rot,
      c,
      gx: Math.floor((e.clientX - rect.left) / c),
      gy: Math.floor((e.clientY - rect.top) / c),
      downX: e.clientX,
      downY: e.clientY,
      downT: performance.now(),
      gen: SX.game.gen | 0
    };
    if (d._src.kind !== "grid") {
      dragging.gx = 0;
      dragging.gy = 0;
      dragging.rot = false;
    }
    d.style.opacity = "0.35";
    buildGhost();
    tip.classList.add("hidden");
    SX.audio.play("click");
  });
  function buildGhost() {
    const it = dragging.it, c = dragging.c || cellPx();
    const w = dragging.rot ? it.h : it.w, h = dragging.rot ? it.w : it.h;
    ghost.innerHTML = "";
    ghost.style.width = w * c + "px";
    ghost.style.height = h * c + "px";
    const src = ART.icon(Object.assign({}, it, {
      rot: dragging.rot
    }));
    const cv = document.createElement("canvas");
    cv.width = src.width;
    cv.height = src.height;
    cv.getContext("2d").drawImage(src, 0, 0);
    ghost.appendChild(cv);
    ghost.classList.remove("hidden");
    positionGhost();
  }
  function positionGhost() {
    const c = dragging.c || cellPx(), In = SX.input;
    ghost.style.left = In.mx - (dragging.gx + .5) * c + "px";
    ghost.style.top = In.my - (dragging.gy + .5) * c + "px";
  }
  addEventListener("keydown", e => {
    if (!dragging) return;
    if (e.code === "KeyR") {
      const it = dragging.it;
      if (it.w !== it.h) {
        dragging.rot = !dragging.rot;
        const t = dragging.gx;
        dragging.gx = dragging.gy;
        dragging.gy = t;
        buildGhost();
      }
      e.preventDefault();
    }
    if (e.code === "Escape") cancelDrag();
  });
  function dropTarget(x, y) {
    ghost.style.display = "none";
    const el = document.elementFromPoint(x, y);
    ghost.style.display = "";
    if (!el) return null;
    const di = el.closest(".it");
    if (di && di._it && dragging && di._it !== dragging.it && !di._unk) {
      const a = dragging.it, b = di._it;
      if (a.name === b.name && I.isStack(a)) return {
        kind: "stack",
        it: b,
        el: di,
        src: di._src
      };
      if (a.kind === "mag" && a.caliber && a.caliber === b.caliber && (b.kind === "gun" || b.kind === "mag")) return {
        kind: "pour",
        it: b,
        el: di,
        src: di._src
      };
      if (a.kind === "part" && b.kind === "gun" && SX.partFits(a, b)) return {
        kind: "attach",
        it: b,
        el: di,
        src: di._src
      };
    }
    const g = el.closest(".grid");
    if (g && g._grid) {
      const r = g.getBoundingClientRect(), c = cellOf(g);
      return {
        kind: "grid",
        grid: g._grid,
        tag: g._tag,
        el: g,
        c,
        x: Math.floor((x - r.left) / c) - dragging.gx,
        y: Math.floor((y - r.top) / c) - dragging.gy
      };
    }
    const s = el.closest(".slot");
    if (s && s._slot) return {
      kind: "slot",
      slot: s._slot,
      el: s
    };
    if (s && s._disp != null) return {
      kind: "disp",
      k: s._disp,
      el: s
    };
    if (s && s._quick != null) return {
      kind: "quick",
      k: s._quick,
      el: s
    };
    if (el.closest("#sellZone")) return {
      kind: "sell",
      el: el.closest("#sellZone")
    };
    if (!el.closest(".win")) return {
      kind: "ground"
    };
    return null;
  }
  let sweep = null;
  const sideOf = src => !src ? null : src.kind === "quick" || src.kind === "grid" && src.tag === "kit" ? "kit" : src.kind === "grid" ? src.grid : src.kind === "disp" ? "disp" : src.kind;
  addEventListener("mouseup", e => {
    if (e.button === 0) sweep = null;
  });
  addEventListener("blur", () => {
    sweep = null;
  });
  addEventListener("mousemove", e => {
    if (sweep) {
      if (!(e.buttons & 1) || U.panelKind !== "inv" && U.panelKind !== "shop") {
        sweep = null;
      } else {
        tip.classList.add("hidden");
        if (!e.shiftKey) return;
        const d = e.target.closest && e.target.closest("#panel .it");
        if (d && d._it && !d._unk && !sweep.done.has(d._it) && sideOf(d._src) === sweep.side) {
          sweep.done.add(d._it);
          quickMove(d._it, d._src);
        }
        return;
      }
    }
    if (dragging) {
      clearHints();
      const t = dropTarget(e.clientX, e.clientY);
      if (t && t.kind === "grid") {
        const it = dragging.it, c = t.c;
        if (c !== dragging.c) {
          dragging.c = c;
          buildGhost();
        }
        const ok = baitTo(t.grid, it) || I.fits(t.grid, it, t.x, t.y, dragging.rot) && !(it.grid && it.grid === t.grid) && !(t.grid.accept && !t.grid.accept(it));
        const h = document.createElement("div");
        h.className = "hint " + (ok ? "ok" : "no");
        const w = dragging.rot ? it.h : it.w, hh = dragging.rot ? it.w : it.h;
        h.style.left = t.x * c + "px";
        h.style.top = t.y * c + "px";
        h.style.width = w * c + "px";
        h.style.height = hh * c + "px";
        t.el.appendChild(h);
      } else if (t && (t.kind === "slot" || t.kind === "quick" || t.kind === "disp" || t.kind === "pour" || t.kind === "attach" || t.kind === "stack")) t.el.classList.add("drop");
      return;
    }
    const d = e.target.closest && e.target.closest("#panel .it");
    if (d && d._it && !d._unk) {
      const inShop = U.panelKind === "shop" || invOther && invOther.kind === "sell";
      const cmp = d._src && d._src.kind !== "slot" ? I.compareHtml(d._it, SX.game.kit) : "";
      tip.innerHTML = I.describe(d._it, inShop) + cmp + "<br><span class='small dim'>" + (rcUses(d._it, d._src) ? "Shift+우클릭: 자세히" : "우클릭: 자세히") + "</span>";
      tip.classList.remove("hidden");
      const r = tip.getBoundingClientRect();
      tip.style.left = Math.min(innerWidth - r.width - 8, e.clientX + 16) + "px";
      tip.style.top = Math.min(innerHeight - r.height - 8, e.clientY + 12) + "px";
    } else if (!e.target.closest || !e.target.closest("[data-tip]")) tip.classList.add("hidden");
  });
  addEventListener("mouseup", e => {
    if (!dragging || e.button !== 0) return;
    if ((dragging.gen | 0) !== (SX.game.gen | 0) || !srcOk(dragging.it, dragging.src)) {
      cancelDrag();
      stale();
      return;
    }
    if (held()) {
      cancelDrag();
      return;
    }
    if (dragging.it.kind === "gun" && Math.hypot(e.clientX - dragging.downX, e.clientY - dragging.downY) < 6 && performance.now() - dragging.downT < 450) {
      const dr = dragging;
      cancelDrag();
      U.openParts(dr.it, dr.src);
      return;
    }
    if (dragging.it.grid && dragging.src && dragging.src.kind === "grid" && U.panelKind === "inv" && Math.hypot(e.clientX - dragging.downX, e.clientY - dragging.downY) < 6 && performance.now() - dragging.downT < 450) {
      const dr = dragging;
      cancelDrag();
      U.peekBag(dr.it, dr.src.grid);
      return;
    }
    const t = dropTarget(e.clientX, e.clientY);
    const dr = dragging;
    cancelDrag();
    if (t && !(t.kind === "ground" && U.panelKind === "shop")) applyMove(dr, t);
    if (SX.vault && (t && t.tag === "safe" || dr.src && dr.src.tag === "safe")) SX.vault.touch();
    U.afterChange();
  });
  function takeFromSrc(it, src) {
    const kit = SX.game.kit;
    if (src.kind === "grid") {
      const ok = I.take(src.grid, it);
      if (ok && src.grid.overFurn) SX.home.syncOver(src.grid.overFurn);
      return ok;
    }
    if (src.kind === "slot") {
      if (kit[src.slot] === it) {
        kit[src.slot] = null;
        if (src.slot === A.player?.slot) A.player.reload = null;
        return true;
      }
      return false;
    }
    if (src.kind === "disp") {
      if (SX.home.displayItems(src.furn)[src.k] !== it) return false;
      SX.home.takeDisplay(src.furn, src.k);
      return true;
    }
    return false;
  }
  function liveGrids() {
    const s = SX.game.save, kit = SX.game.kit, set = new Set;
    const add = g => {
      if (!g || set.has(g)) return;
      set.add(g);
      for (const e of g.list) if (e.it && e.it.grid) add(e.it.grid);
    };
    const addIt = it => {
      if (it && it.grid) add(it.grid);
    };
    if (s) {
      add(s.stash);
      if (SX.vault) for (const g of SX.vault.grids(s)) add(g);
      if (SX.fishing && s.creel) {
        const cg = SX.fishing.creelOf(s);
        add(cg);
        add(cg.bait);
      }
      if (s.home) {
        for (const f of s.home.furn) {
          if (f.gridObj) add(f.gridObj);
          if (f.overGrid) add(f.overGrid);
          if (f.items) f.items.forEach(addIt);
        }
        for (const l of s.home.loose || []) if (l.cont) add(l.cont.grid);
      }
    }
    if (kit) for (const sl of I.SLOTS) addIt(kit[sl]);
    if (SX.game.state === "raid" && SX.raid.level) for (const F of SX.raid.level.floors) for (const p of F.props) if (p.cont) add(p.cont.grid);
    if (invOther) {
      if (invOther.cont) add(invOther.cont.grid);
      for (const c of invOther.conts || []) add(c.grid);
      if (invOther.grid && invOther.grid.furnId == null) add(invOther.grid);
    }
    return set;
  }
  function srcOk(it, src) {
    if (!it || !src) return false;
    if (src.kind === "grid") return !!src.grid && !!I.at(src.grid, it) && liveGrids().has(src.grid);
    if (src.kind === "slot") return SX.game.kit[src.slot] === it;
    if (src.kind === "disp") return !!src.furn && (!SX.home.isLive || SX.home.isLive(SX.home.live(src.furn))) && SX.home.displayItems(src.furn)[src.k] === it;
    if (src.kind === "quick") return !!I.kitFind(SX.game.kit, it.id);
    return true;
  }
  function stale() {
    SX.audio.play("denied");
    SX.log("창이 바뀌었습니다 — 다시 옮겨 주십시오");
    U.refresh();
  }
  function held() {
    if (!(SX.net && SX.net.hold)) return false;
    SX.audio.play("denied");
    SX.log("서버 답을 기다리는 중입니다 — 잠깐 뒤에 옮겨 주십시오");
    return true;
  }
  function pendNo(it) {
    if (!(it && SX.coop && SX.coop.pending && SX.coop.pending(it))) return false;
    SX.audio.play("denied");
    SX.log("판 주인 확인을 기다리는 중입니다 — 잠깐 뒤에 해 주십시오");
    return true;
  }
  const sharedSrc = src => !!(src && src.kind === "grid" && src.grid && src.grid.shared && SX.coop && SX.coop.raid);
  function sharedNo(a, b) {
    if (!sharedSrc(a) && !sharedSrc(b)) return false;
    SX.audio.play("denied");
    SX.log("같이 하는 판에선 상자 속 탄창 · 총은 가방으로 꺼낸 뒤 붓거나 빼 주십시오");
    return true;
  }
  function putBack(it, src, oe, orot) {
    const kit = SX.game.kit;
    if (src.kind === "grid" && (oe && I.put(src.grid, it, oe.x, oe.y, orot) || I.put(src.grid, it))) return;
    if (src.kind === "slot" && !kit[src.slot]) {
      kit[src.slot] = it;
      return;
    }
    if (src.kind === "disp" && SX.home.putDisplay(src.furn, src.k, it)) return;
    if (I.kitStow(kit, it)) return;
    if (SX.game.state !== "raid" && I.put(SX.game.save.stash, it)) return;
    dropToGround(it);
  }
  function filledSome(it, a0) {
    const left = I.fillLeft(it);
    if (!(left < a0)) return false;
    const u = it.kind === "mag" ? "발" : I.stackUnit(it);
    SX.log("자리가 모자라 " + it.name + " " + left + u + " 남기고 " + (a0 - left) + u + " 채웠습니다");
    return true;
  }
  U.relink = function() {
    cancelDrag();
    peek = null;
    if (U.closeParts) U.closeParts();
    const s = SX.game.save, H = SX.home, lv = f => f && H.live ? H.live(f) : f;
    if (cookF) cookF = lv(cookF);
    if (waterF) waterF = lv(waterF);
    if (gardenF) gardenF = lv(gardenF);
    if (U.panelKind !== "inv" || !invOther) return;
    const o = invOther;
    if (o.kind === "box" && o.grid) {
      const f = o.grid.furnId != null && s.home ? s.home.furn.find(q => q.id === o.grid.furnId) : null;
      if (!f || !H.FURN[f.kind] || !H.FURN[f.kind].grid) {
        U.closePanel();
        return;
      }
      const g = H.gridOf(f);
      if (f.placed) g.noPut = false;
      o.grid = g;
    } else if (o.kind === "display" && o.furn) {
      const f = lv(o.furn);
      if (!H.isLive || !H.isLive(f)) {
        U.closePanel();
        return;
      }
      o.furn = f;
    } else if (o.kind === "loot" && o.cont && o.cont.home) {
      U.closePanel();
      return;
    }
    renderInv();
  };
  function cleanQuick() {
    const kit = SX.game.kit;
    kit.quick = kit.quick.map(id => id && I.kitFind(kit, id) ? id : null);
  }
  function applyMove(dr, t) {
    const it = dr.it, src = dr.src, kit = SX.game.kit;
    if (held()) return;
    if (!srcOk(it, src) || t.kind === "grid" && !liveGrids().has(t.grid) || (t.kind === "pour" || t.kind === "attach" || t.kind === "stack") && !srcOk(t.it, t.src)) {
      stale();
      return;
    }
    if ((t.kind === "pour" || t.kind === "attach" || t.kind === "stack") && (pendNo(it) || pendNo(t.it))) return;
    if (t.kind === "stack") {
      stackDrop(it, src, t);
      return;
    }
    if (t.kind === "pour" && sharedNo(src, t.src)) return;
    if (src.kind === "quick") {
      if (t.kind !== "quick") {
        kit.quick[src.k] = null;
      } else {
        const a = kit.quick[src.k];
        kit.quick[src.k] = kit.quick[t.k];
        kit.quick[t.k] = a;
      }
      SX.audio.play("click");
      return;
    }
    if (t.kind === "quick") {
      if (!I.kitFind(kit, it.id)) {
        SX.log("가방·리그 안에 있는 것만 단축 칸에 둘 수 있습니다");
        return;
      }
      if (![ "heal", "cure", "flare", "grenade", "afix", "trap" ].includes(it.kind)) {
        SX.log("쓸 수 있는 물건만(약·억제약·신호탄·수류탄·방탄 수리 키트·덫)");
        return;
      }
      kit.quick = kit.quick.map(id => id === it.id ? null : id);
      kit.quick[t.k] = it.id;
      SX.audio.play("click");
      return;
    }
    if (t.kind === "grid") {
      if (it.grid && it.grid === t.grid) return;
      if (t.grid.noPut) {
        SX.audio.play("denied");
        SX.log("창고에 넣어 둔 가구엔 넣을 수 없습니다 — 빼기만 됩니다(넣으려면 가구를 놓으시면 됩니다)");
        return;
      }
      if (baitTo(t.grid, it)) {
        baitDrop(it, src, t.grid.bait);
        return;
      }
      if (t.grid.accept && !t.grid.accept(it)) {
        SX.audio.play("denied");
        SX.log(t.grid.acceptMsg || "여기엔 넣을 수 없는 물건입니다");
        return;
      }
      if (I.nestBlocked(t.grid, it)) {
        SX.audio.play("denied");
        SX.log("든 가방·리그는 가방·리그 속에 못 넣습니다 — 비우거나 보관함·바닥에");
        return;
      }
      const fit = I.fits(t.grid, it, t.x, t.y, dr.rot);
      let push = null;
      if (!fit) {
        const hit = I.blockers(t.grid, it, t.x, t.y, dr.rot);
        if (hit && hit.length === 1) push = hit[0];
        if (!push) {
          SX.audio.play("denied");
          return;
        }
      }
      const oe = src.kind === "grid" ? I.at(src.grid, it) : null;
      const origin = oe ? {
        grid: src.grid,
        x: oe.x,
        y: oe.y,
        rot: !!it.rot
      } : null;
      if (!takeFromSrc(it, src)) return;
      if (src.kind === "disp") SX.game.persist();
      if (push) {
        const pe = I.at(t.grid, push), px = pe.x, py = pe.y, prot = !!push.rot;
        I.take(t.grid, push);
        I.put(t.grid, it, t.x, t.y, dr.rot);
        let ok = false;
        const oOk = origin && !(origin.grid.accept && !origin.grid.accept(push));
        if (oOk && I.fits(origin.grid, push, origin.x, origin.y, prot)) {
          push.rot = prot;
          ok = I.put(origin.grid, push, origin.x, origin.y, prot);
        }
        if (!ok) {
          push.rot = false;
          ok = I.put(t.grid, push);
        }
        if (!ok && oOk && origin.grid !== t.grid) ok = I.put(origin.grid, push);
        if (!ok) ok = I.kitStow(kit, push);
        if (!ok) {
          I.take(t.grid, it);
          push.rot = prot;
          I.put(t.grid, push, px, py, prot);
          if (origin) I.put(origin.grid, it, origin.x, origin.y, origin.rot); else if (src.kind === "slot") kit[src.slot] = it; else if (!I.kitStow(kit, it)) dropToGround(it);
          SX.audio.play("denied");
          SX.log("밀어낼 자리가 없습니다");
          return;
        }
      } else I.put(t.grid, it, t.x, t.y, dr.rot);
      if (U.loot && (t.tag === "kit" || t.tag === "safe") && src.tag === "other") pickedUp(it);
      cleanQuick();
      SX.audio.play("pickup");
      return;
    }
    if (t.kind === "slot") {
      if (!I.slotAccepts(t.slot, it)) {
        SX.audio.play("denied");
        SX.log(I.SLOT_NAMES[t.slot] + " 칸에 맞지 않습니다");
        return;
      }
      if (src.kind === "slot" && src.slot === t.slot) return;
      if ((t.slot === "bag" || t.slot === "rig") && src.kind === "grid" && kit[t.slot] && kit[t.slot].grid === src.grid) {
        SX.log("그 안에 든 걸 입을 순 없습니다");
        return;
      }
      const old = kit[t.slot];
      if (!takeFromSrc(it, src)) return;
      kit[t.slot] = it;
      it.rot = false;
      if (it.folded) I.unfold(it);
      if (old) {
        let placed = false;
        if (src.kind === "slot" && I.slotAccepts(src.slot, old)) {
          kit[src.slot] = old;
          placed = true;
        } else if (src.kind === "grid" && old.grid !== src.grid) placed = I.put(src.grid, old);
        if (!placed) placed = I.kitStow(kit, old);
        if (!placed) {
          if (SX.game.state === "raid") dropToGround(old); else if (!I.put(SX.game.save.stash, old)) dropToGround(old);
        }
      }
      if (U.loot && src.tag === "other") pickedUp(it);
      cleanQuick();
      SX.audio.play("pickup");
      if (A.player && !kit[A.player.slot]) A.player.slot = kit.w1 ? "w1" : kit.w2 ? "w2" : "melee";
      return;
    }
    if (t.kind === "pour") {
      const [take, empty, out] = I.pourInto(t.it, it);
      if (!take) {
        SX.audio.play("denied");
        SX.log(t.it.kind === "gun" ? "이미 꽉 찼습니다" : t.it.kind === "mag" && I.typeOf(t.it) !== I.typeOf(it) ? "탄 종류가 다르면 합칠 수 없습니다" : "부을 자리가 없습니다");
        return;
      }
      SX.log((t.it.kind === "gun" ? "장전: " : "옮김: ") + take + "발 → " + t.it.name + (t.it.kind === "gun" && I.typeOf(it) ? " · " + I.typeName(it.caliber, I.typeOf(it)) : ""));
      if (empty) takeFromSrc(it, src);
      if (out) for (const m of out) {
        U.dropOut(m);
        SX.log("들어 있던 탄을 뺐습니다 → " + m.name + " " + m.ammo + "발");
      }
      cleanQuick();
      SX.audio.play("reload");
      U.afterChange();
      return;
    }
    if (t.kind === "attach") {
      if (!mineSrc(t.src) && !contEdit(t.src, t.it)) {
        SX.audio.play("denied");
        SX.log(homeScene() ? "창고에 넣어 둔 가구 속 총엔 못 답니다 — 꺼낸 뒤 달아 주십시오" : "가방·리그·보관함의 총에만 달 수 있습니다");
        return;
      }
      attachPart(t.it, it, src);
      return;
    }
    if (t.kind === "sell") {
      sellItem(it, src);
      return;
    }
    if (t.kind === "disp") {
      const f = invOther && invOther.furn && SX.home.live(invOther.furn);
      if (!f) return;
      if (it.grid && it.grid.list.length) {
        SX.log("안에 든 걸 먼저 빼 주십시오");
        SX.audio.play("denied");
        return;
      }
      if (SX.home.displayItems(f)[t.k]) {
        SX.audio.play("denied");
        return;
      }
      const cat = SX.home.FURN[f.kind];
      if (cat.use === "rack" && !(it.kind === "gun" || it.kind === "melee")) {
        SX.log("거치대엔 총·근접무기만");
        SX.audio.play("denied");
        return;
      }
      const oe = src.kind === "grid" ? I.at(src.grid, it) : null, orot = !!it.rot;
      if (!takeFromSrc(it, src)) return;
      it.rot = false;
      if (!SX.home.putDisplay(f, t.k, it)) {
        putBack(it, src, oe, orot);
        SX.audio.play("denied");
        return;
      }
      cleanQuick();
      SX.audio.play("pickup");
      SX.game.persist();
      return;
    }
    if (t.kind === "ground") {
      if (!takeFromSrc(it, src)) return;
      dropToGround(it);
      cleanQuick();
      SX.audio.play("rustle");
    }
  }
  function stackDrop(it, src, t) {
    const g = t.src && t.src.kind === "grid" ? t.src.grid : null;
    if (sharedSrc(src) || sharedSrc(t.src)) {
      SX.audio.play("denied");
      SX.log("같이 하는 판에선 상자 속 뭉치는 가방으로 꺼낸 뒤 합쳐 주십시오");
      return;
    }
    if (!g || g.noPut || g.accept && !g.accept(it)) {
      SX.audio.play("denied");
      SX.log("거기엔 합칠 수 없습니다");
      return;
    }
    const k = I.stackMerge(t.it, it, x => takeFromSrc(x, src));
    if (!k) {
      SX.audio.play("denied");
      SX.log("더 합칠 수 없습니다");
      return;
    }
    if (src.kind === "disp") SX.game.persist();
    if (SX.vault && t.src.tag === "safe") SX.vault.touch();
    cleanQuick();
    SX.audio.play("pickup");
    SX.log("합쳤습니다 — " + it.name + " " + I.qty(t.it) + (I.stackUnit(it) === "마리" ? "마리" : "개"));
  }
  const baitTo = (g, it) => !!(g && g.bait && !g.creelBait && SX.fishing && SX.fishing.isBait(it));
  function baitDrop(it, src, bg) {
    const s = bg.list[0] && bg.list[0].it;
    if (s === it) return;
    if (s) {
      stackDrop(it, src, {
        it: s,
        src: {
          kind: "grid",
          grid: bg,
          tag: "other"
        }
      });
      return;
    }
    const oe = src.kind === "grid" ? I.at(src.grid, it) : null, orot = !!it.rot;
    if (!takeFromSrc(it, src)) return;
    if (!I.put(bg, it, 0, 0, false)) {
      putBack(it, src, oe, orot);
      SX.audio.play("denied");
      return;
    }
    cleanQuick();
    SX.audio.play("pickup");
    SX.log("조과통 미끼 칸에 넣었습니다 — " + it.name + " " + I.qty(it) + "마리");
  }
  U.dropOut = function(m) {
    const kit = SX.game.kit;
    if (kit && I.kitStow(kit, m)) return;
    if (SX.game.state !== "raid" && SX.game.save && I.put(SX.game.save.stash, m)) return;
    dropToGround(m);
  };
  function pickedUp(it) {
    SX.log("+ " + it.name);
    const st = SX.game.stats;
    if (SX.game.state === "raid" && st) {
      (st.picked || (st.picked = [])).push(it.name);
    }
  }
  function dropToGround(it) {
    if (SX.game.state !== "raid") {
      SX.home.dropLoose(it);
      return;
    }
    const p = A.player, F = SX.game.floorObj();
    if (!F) return;
    const cont = SX.map.mkCont("loose", [ it ]);
    cont.searched = true;
    cont.revealed = 1;
    let tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (F.tile(tx, ty) === SX.map.T.DOOR) {
      let best = null, bd = 1e9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx, y = ty + dy, t = F.tile(x, y);
        if (t !== SX.map.T.FLOOR && t !== SX.map.T.GROUND) continue;
        const d = Math.hypot(x + .5 - p.x, y + .5 - p.y);
        if (d < bd) {
          bd = d;
          best = [ x, y ];
        }
      }
      if (best) {
        tx = best[0];
        ty = best[1];
      }
    }
    if (SX.raid.dropSpot) {
      const q = SX.raid.dropSpot(F, p, tx, ty);
      tx = q[0];
      ty = q[1];
    }
    const pr = SX.map.addProp(F, "loot", tx, ty, {
      cont,
      solid: false
    });
    if (SX.game.inRaid() && pr && SX.raid.reg) {
      const R = SX.coop && SX.coop.raid;
      const meta = {
        key: SX.raid.newDropKey(R ? R.me : "me"),
        f: F.idx,
        kind: "loot",
        type: "loose",
        x: tx,
        y: ty,
        name: cont.name
      };
      SX.raid.reg(cont, meta.key);
      SX.raid.addExtra(meta);
      if (SX.coop) SX.coop.newCont(pr, meta);
    }
    SX.log("버렸습니다: " + it.name);
  }
  function takeAllFrom(g) {
    const kit = SX.game.kit;
    if (held()) return;
    if (!liveGrids().has(g)) {
      stale();
      return;
    }
    let got = 0, left = 0;
    for (const e of g.list.slice()) {
      const it = e.it;
      let ok = false;
      for (const sl of I.SLOTS) if (!ok && !kit[sl] && I.slotAccepts(sl, it)) {
        I.take(g, it);
        kit[sl] = it;
        if (it.folded) I.unfold(it);
        ok = true;
      }
      if (!ok) {
        I.take(g, it);
        if (I.kitStow(kit, it)) ok = true; else I.put(g, it, e.x, e.y, it.rot);
      }
      if (ok) {
        got++;
        if (U.loot) pickedUp(it);
      } else left++;
    }
    if (!got) {
      SX.audio.play("denied");
      SX.log("가방에 자리가 없습니다");
      return;
    }
    SX.audio.play("pickup");
    SX.log(left ? got + "개 챙겼습니다 — " + left + "개는 자리가 없습니다" : got + "개 전부 챙겼습니다");
    cleanQuick();
    U.afterChange();
  }
  function equipEmpty(it) {
    const kit = SX.game.kit;
    for (const s of I.SLOTS) if (!kit[s] && I.slotAccepts(s, it)) {
      kit[s] = it;
      it.rot = false;
      if (it.folded) I.unfold(it);
      if (A.player && !kit[A.player.slot]) A.player.slot = kit.w1 ? "w1" : kit.w2 ? "w2" : "melee";
      return true;
    }
    return false;
  }
  function swapInKit(it, src) {
    const kit = SX.game.kit;
    if (src.kind !== "grid") return false;
    const e = I.at(src.grid, it);
    if (!e) return false;
    const ox = e.x, oy = e.y, orot = !!it.rot;
    I.take(src.grid, it);
    if (equipEmpty(it)) return true;
    const other = src.grid === (kit.bag && kit.bag.grid) ? kit.rig && kit.rig.grid : kit.bag && kit.bag.grid;
    const a0 = I.fillLeft(it);
    if (other && I.putFill(other, it)) return true;
    I.put(src.grid, it, ox, oy, orot);
    return filledSome(it, a0);
  }
  function quickMove(it, src) {
    const kit = SX.game.kit, o = (U.panelKind === "inv" || U.panelKind === "shop") && invOther ? invOther : {
      kind: "none"
    };
    if (held()) return;
    if (!srcOk(it, src) || o.kind === "box" && !liveGrids().has(o.grid) || o.kind === "loot" && o.cont && !liveGrids().has(o.cont.grid)) {
      stale();
      return;
    }
    if (src.kind === "quick") {
      const p = I.kitPath(kit, it);
      if (!p) {
        cleanQuick();
        return;
      }
      src = {
        kind: "grid",
        grid: kit[p.c].grid,
        tag: "kit"
      };
    }
    if (o.kind === "sell") {
      sellItem(it, src);
      cleanQuick();
      U.refresh();
      U.hudDirty();
      return;
    }
    if (SX.game.state !== "raid" && SX.fishing && SX.fishing.isBait(it) && o.kind !== "display" && src.kind === "grid" && src.grid && !src.grid.creel) {
      const bg = SX.fishing.creelOf(SX.game.save).bait, s = bg.list.length ? I.stackIn(bg, it.name, it) : null, oe = I.at(src.grid, it), orot = !!it.rot;
      if ((!bg.list.length || s && I.qty(s) + I.qty(it) <= I.STACK_MAX) && takeFromSrc(it, src)) {
        if (I.putJoin(bg, it)) {
          cleanQuick();
          SX.audio.play("pickup");
          if (U.loot && src.tag === "other") pickedUp(it);
          if (src.tag === "safe" && SX.vault) SX.vault.touch();
          U.afterChange();
          return;
        }
        putBack(it, src, oe, orot);
      }
    }
    if (SX.game.state !== "raid" && SX.fishing && SX.fishing.isFish(it) && o.kind !== "display" && src.kind === "grid" && src.grid && !src.grid.creel) {
      const cg = SX.fishing.creelOf(SX.game.save);
      if (I.put(cg, it)) {
        if (takeFromSrc(it, src)) {
          cleanQuick();
          SX.audio.play("pickup");
          if (U.loot && src.tag === "other") pickedUp(it);
          U.afterChange();
          return;
        }
        I.take(cg, it);
      }
    }
    if (src.kind === "grid" && (src.tag === "safe" || src.grid.creel)) {
      const dst = o.kind === "stash" ? SX.game.save.stash : o.kind === "box" && !(o.grid.accept && !o.grid.accept(it)) ? o.grid : null;
      const oe0 = I.at(src.grid, it), or0 = !!it.rot, a0 = I.fillLeft(it);
      if (!I.take(src.grid, it)) return;
      let ok = dst ? I.putFill(dst, it) : false;
      if (!ok && !dst) ok = equipEmpty(it) || I.kitStow(kit, it);
      if (!ok) {
        if (!(oe0 && I.put(src.grid, it, oe0.x, oe0.y, or0))) I.put(src.grid, it);
        if (filledSome(it, a0)) SX.audio.play("pickup"); else {
          SX.audio.play("denied");
          SX.log("옮길 자리가 없습니다");
        }
      } else SX.audio.play("pickup");
      if (src.tag === "safe") SX.vault.touch();
      U.afterChange();
      return;
    }
    const mine = src.kind === "slot" || src.kind === "grid" && (src.grid === (kit.rig && kit.rig.grid) || src.grid === (kit.bag && kit.bag.grid));
    if (o.kind !== "display" && src.kind !== "disp" && !mine) {
      const oe0 = src.kind === "grid" ? I.at(src.grid, it) : null, or0 = !!it.rot, a0 = I.fillLeft(it);
      if (!takeFromSrc(it, src)) return;
      let ok = equipEmpty(it);
      if (!ok) ok = I.kitStow(kit, it);
      if (!ok) {
        if (!(oe0 && I.put(src.grid, it, oe0.x, oe0.y, or0))) I.put(src.grid, it);
        if (filledSome(it, a0)) SX.audio.play("pickup"); else {
          SX.log("가방에 자리가 없습니다");
          SX.audio.play("denied");
        }
      } else {
        SX.audio.play("pickup");
        if (U.loot) pickedUp(it);
      }
    } else {
      let dst = o.kind === "loot" ? o.cont.grid : o.kind === "stash" ? SX.game.save.stash : o.kind === "box" ? o.grid : null;
      if (o.kind === "near") for (const c of o.conts || []) if (c.searched && (I.findSpot(c.grid, it) || I.fillRoom(c.grid, it) > 0)) {
        dst = c.grid;
        break;
      }
      if (src.kind === "disp") {
        const a0 = I.fillLeft(it);
        if (takeFromSrc(it, src)) {
          if (!I.putFill(SX.game.save.stash, it)) {
            SX.home.putDisplay(src.furn, src.k, it);
            SX.audio.play(filledSome(it, a0) ? "pickup" : "denied");
          }
        } else SX.audio.play("denied");
      } else if (o.kind === "display") {
        const f = o.furn, list = SX.home.displayItems(f), n = SX.home.slotsOf(f);
        let k = -1;
        for (let q = 0; q < n; q++) if (!list[q]) {
          k = q;
          break;
        }
        const cat = SX.home.FURN[f.kind];
        if (k < 0 || it.grid && it.grid.list.length || cat.use === "rack" && !(it.kind === "gun" || it.kind === "melee")) SX.audio.play("denied"); else if (takeFromSrc(it, src)) {
          it.rot = false;
          SX.home.putDisplay(f, k, it);
          SX.audio.play("pickup");
        }
      } else if (o.kind === "sell") {
        sellItem(it, src);
      } else if (dst) {
        if (dst.accept && !dst.accept(it)) {
          SX.audio.play("denied");
          SX.log(dst.acceptMsg || "여기엔 넣을 수 없는 물건입니다");
        } else if (!I.findSpot(dst, it) && !I.fillRoom(dst, it) || I.nestBlocked(dst, it) || it.grid === dst) SX.audio.play("denied"); else {
          const oe = src.kind === "grid" ? I.at(src.grid, it) : null, orot = !!it.rot, a0 = I.fillLeft(it);
          if (!takeFromSrc(it, src)) SX.audio.play("denied"); else if (I.putFill(dst, it)) {
            cleanQuick();
            SX.audio.play("rustle");
          } else {
            putBack(it, src, oe, orot);
            SX.audio.play(filledSome(it, a0) ? "rustle" : "denied");
          }
        }
      } else if (src.kind === "slot") {
        if (!takeFromSrc(it, src)) {
          SX.audio.play("denied");
          return;
        }
        if (I.kitStow(kit, it) || SX.game.state !== "raid" && I.put(SX.game.save.stash, it)) {
          cleanQuick();
          SX.audio.play("pickup");
        } else {
          kit[src.slot] = it;
          SX.audio.play("denied");
          SX.log("넣을 자리가 없습니다");
        }
      } else if (swapInKit(it, src)) {
        cleanQuick();
        SX.audio.play("pickup");
      } else {
        SX.audio.play("denied");
        SX.log("옮길 데가 없습니다");
      }
    }
    if (src.kind === "slot" && kit[src.slot] === it && I.kitFind(kit, it.id)) kit[src.slot] = null;
    U.afterChange();
  }
  function rcUses(it, src) {
    if (I.isStack(it) && src && src.kind === "grid") return true;
    if (SX.needs && SX.needs.of(it) && !it.kind) return true;
    if (I.foldSize(it) && src && src.kind === "grid") return true;
    if ([ "vaultkit", "partbox", "mag", "heal", "cure", "flare", "grenade", "afix", "nvg", "trap" ].includes(it.kind)) return true;
    return it.kind === "gun" && (src && src.kind === "grid" && src.tag === "kit" || (it.ammo || 0) > 0);
  }
  function bagFold(it, src) {
    const g = src && src.grid, f = !!it.folded;
    if (!g || g.noPut) {
      SX.log(f ? "꺼낸 뒤 펴 주십시오" : "꺼낸 뒤 접어 주십시오");
      SX.audio.play("denied");
      return;
    }
    if (g.shared && SX.coop && SX.coop.raid) {
      SX.log(f ? "같이 하는 판에선 가방째 가져와서 펴 주십시오" : "같이 하는 판에선 가방째 가져와서 접어 주십시오");
      SX.audio.play("denied");
      return;
    }
    if (it.folded) {
      if (!I.unfold(it, g)) {
        SX.log("펼 자리가 없습니다");
        SX.audio.play("denied");
        return;
      }
      SX.log(it.name + " — 폈습니다");
      SX.audio.play("bagUnfold", {
        vol: .8
      });
    } else {
      const no = I.foldNo(it);
      if (no) {
        SX.log(no);
        SX.audio.play("denied");
        return;
      }
      I.fold(it);
      SX.log(it.name + " — 접었습니다(" + it.w + "×" + it.h + " 자리)");
      SX.audio.play("bagFold", {
        vol: .8
      });
    }
    if (src.tag === "safe" && SX.vault) SX.vault.touch();
    if (SX.game.state !== "raid") SX.game.persist();
    U.afterChange();
  }
  function contextUse(it, src) {
    const kit = SX.game.kit, p = A.player;
    if (held()) return;
    if (!srcOk(it, src)) {
      stale();
      return;
    }
    if (pendNo(it)) return;
    if (I.foldSize(it) && src && src.kind === "grid") {
      bagFold(it, src);
      return;
    }
    if (SX.needs && SX.needs.of(it) && !it.kind) {
      if (SX.game.state === "raid") {
        if (!I.kitFind(kit, it.id)) {
          SX.log("가방·리그에 넣은 뒤 먹을 수 있습니다");
          return;
        }
        U.closePanel();
        A.useItem(SX.raid.floor(), p, it);
        return;
      }
      const g = src && src.kind === "grid" && src.grid, s = SX.game.save;
      if (!g || !(g === s.stash || g === (kit.rig && kit.rig.grid) || g === (kit.bag && kit.bag.grid) || g.creel || g.accept)) {
        SX.log("보관함·가방에 넣은 뒤 먹을 수 있습니다");
        SX.audio.play("denied");
        return;
      }
      const ns = SX.needs.get(s), v = SX.needs.of(it);
      if ((ns.food >= 99.5 || v.f <= 0) && (ns.water >= 99.5 || v.w <= 0)) {
        SX.log("배부릅니다 — 지금은 안 먹어도 됩니다");
        SX.audio.play("denied");
        return;
      }
      I.take(g, it);
      SX.needs.eat(s, it);
      SX.game.persist();
      U.afterChange();
      return;
    }
    if (it.kind === "vaultkit" && SX.vault) {
      const no = SX.vault.kitCheck(it);
      if (no) {
        SX.log(no);
        SX.audio.play("denied");
        return;
      }
      const g = src && src.kind === "grid" && src.grid, s = SX.game.save, ok = g && (g === s.stash || I.kitGrids(kit).includes(g));
      if (!ok) {
        SX.log("보관함 · 가방 · 리그에 넣은 뒤 쓰십시오");
        SX.audio.play("denied");
        return;
      }
      const p = SX.vault.kitPlan(it), days = p.days;
      const msg = p.keep ? "지금 쓰는 개인 금고(" + p.n + "칸)의 보존 기간에 " + days + "일이 더해집니다." + (p.old.length ? "<br>다른 금고에 든 것은 이 금고로 모읍니다." : "") + "<br>쓰면 다시 물건으로 되돌릴 수 없습니다." : p.old.length ? "지금 개인 금고(" + p.old.map(e => e.n + "칸").join(" · ") + ")가 새 금고(" + p.n + "칸)로 바뀝니다.<br>새 금고는 " + days + "일 동안 남고, 지금 금고의 남은 기간은 없어집니다.<br>든 것은 새 금고로, 안 들어가는 것은 보관함으로 옮깁니다.<br>쓰면 다시 물건으로 되돌릴 수 없습니다." : "개인 금고(" + (it.cells | 0) + "칸)가 생기고 " + days + "일 동안 남습니다.<br>지나면 금고가 사라지고 든 것은 보관함으로 옮깁니다.<br>쓰면 다시 물건으로 되돌릴 수 없습니다.";
      U.ask("개인 금고 쓰기", msg, 0, () => {
        const r = SX.vault.useKit(it, g);
        SX.log(r.msg, r.ok ? "good" : "bad");
        SX.audio.play(r.ok ? "openSafe" : "denied");
        U.afterChange();
      }, null, {
        q: "지금 쓰시겠습니까?",
        yes: "쓰기"
      });
      return;
    }
    if (it.kind === "key") {
      SX.log("🔑 " + it.name + " — 판 안에서 「" + (it.room || "") + "」 문 앞에 서서 [" + SX.label("interact") + "] (남은 횟수 " + (SX.vault ? SX.vault.usesOf(it) : it.uses) + "번)");
      return;
    }
    if (it.kind === "nvg") {
      if (src.kind === "slot" && src.slot === "nvg") {
        if (p && p.nvOn) {
          p.nvOn = false;
          p.nvT = 0;
        }
        kit.nvg = null;
        if (!I.kitStow(kit, it)) {
          if (SX.game.state !== "raid" && I.put(SX.game.save.stash, it)) {} else {
            kit.nvg = it;
            SX.log("가방에 자리가 없어 못 벗습니다");
            SX.audio.play("denied");
            return;
          }
        }
        SX.audio.play("pickup");
        SX.log("야간 투시경을 벗었습니다");
        U.afterChange();
        return;
      }
      if (!takeFromSrc(it, src)) return;
      const old = kit.nvg;
      kit.nvg = it;
      it.rot = false;
      if (old) {
        let ok = src.kind === "grid" && src.grid !== (kit.bag && kit.bag.grid) && src.grid !== (kit.rig && kit.rig.grid) ? I.put(src.grid, old) : false;
        if (!ok) ok = I.kitStow(kit, old);
        if (!ok) {
          if (SX.game.state === "raid") dropToGround(old); else if (!I.put(SX.game.save.stash, old)) dropToGround(old);
        }
      }
      if (U.loot && src.tag === "other") pickedUp(it);
      SX.audio.play("pickup");
      SX.log("야간 투시경을 썼습니다 — 판 안에서 [" + SX.label("nvg") + "] 로 켜고 끕니다");
      U.afterChange();
      return;
    }
    if (it.kind === "partbox") {
      if (!src || src.kind !== "grid" || !src.grid || src.grid.noPut) {
        SX.log("가방·리그·보관함으로 옮긴 뒤 열어 주십시오");
        SX.audio.play("denied");
        return;
      }
      const r = I.openPartBox(src.grid, it);
      SX.log((r.ok ? "📦 " : "") + r.msg, r.ok ? "good" : "bad");
      SX.audio.play(r.ok ? "rustle" : "denied");
      U.afterChange();
      return;
    }
    if (it.kind === "gun" && src.kind === "grid" && src.tag === "kit") {
      const s = !kit.w1 ? "w1" : !kit.w2 ? "w2" : null;
      if (s) {
        I.take(src.grid, it);
        kit[s] = it;
        SX.audio.play("pickup");
        U.refresh();
        return;
      }
    }
    if (it.kind === "gun" && (it.ammo || 0) > 0 && (src.kind === "slot" || src.kind === "grid") && sharedNo(src)) return;
    if (it.kind === "gun" && (it.ammo || 0) > 0 && (src.kind === "slot" || src.kind === "grid")) {
      const m = I.mk(I.magFor(it.caliber, I.typeOf(it)), {
        ammo: 0
      });
      const take = Math.min(m.cap, it.ammo);
      m.ammo = take;
      it.ammo -= take;
      let ok = I.kitStow(kit, m);
      if (!ok && SX.game.state !== "raid") ok = I.put(SX.game.save.stash, m);
      if (!ok && SX.game.state === "raid") {
        dropToGround(m);
        ok = true;
      }
      if (!ok) {
        it.ammo += take;
        SX.log("넣을 자리가 없습니다");
      } else SX.log("탄을 뺐습니다 → " + m.name + " " + take + "발");
      U.afterChange();
      return;
    }
    if (I.isStack(it) && src && src.kind === "grid") {
      stackSplit(it, src);
      return;
    }
    if (it.kind === "mag") {
      const s = SX.game.save, inRaid = SX.game.state === "raid", grids = I.kitGrids(kit);
      const mine = src && src.kind === "grid" && src.grid && (grids.includes(src.grid) || !inRaid && src.grid === s.stash);
      if (!mine) {
        SX.log("가방·리그·보관함으로 옮긴 뒤 나눌 수 있습니다");
        SX.audio.play("denied");
        return;
      }
      if ((it.ammo | 0) < 2) {
        SX.log("나눌 탄이 없습니다 — 두 발은 있어야 합니다");
        SX.audio.play("denied");
        return;
      }
      const before = it.ammo, hadSplit = it.split, m = I.splitMag(it);
      if (!m) return;
      let ok = I.put(src.grid, m);
      for (const g of grids) if (!ok && g !== src.grid && I.put(g, m)) ok = true;
      if (!ok && !inRaid && src.grid !== s.stash) ok = I.put(s.stash, m);
      if (!ok && inRaid) {
        dropToGround(m);
        ok = true;
      }
      if (!ok) {
        it.ammo = before;
        if (!hadSplit) delete it.split;
        SX.log("넣을 자리가 없습니다");
        SX.audio.play("denied");
        return;
      }
      SX.audio.play("magOut", {
        vol: .6
      });
      SX.log("탄을 나눴습니다 — " + it.name + " " + it.ammo + "발 · " + m.ammo + "발");
      if (!inRaid) SX.game.persist();
      U.afterChange();
      return;
    }
    if (![ "heal", "cure", "flare", "grenade", "afix", "trap" ].includes(it.kind)) return;
    if (!I.kitFind(kit, it.id)) {
      SX.log("가방·리그에 넣은 뒤 쓸 수 있습니다");
      return;
    }
    if (it.kind === "cure") {
      const no = SX.game.canCure();
      if (no) {
        SX.log(no);
        SX.audio.play("denied");
        return;
      }
      if (SX.game.state === "hub") {
        I.kitTake(kit, it);
        SX.game.cure();
        U.refresh();
        U.hudDirty();
        return;
      }
    }
    if (SX.game.state !== "raid") {
      SX.log("판 안에서 씁니다");
      return;
    }
    U.closePanel();
    A.useItem(SX.raid.floor(), p, it);
  }
  function stackSplit(it, src) {
    const kit = SX.game.kit, s = SX.game.save, inRaid = SX.game.state === "raid", grids = I.kitGrids(kit), g = src.grid;
    const mine = !!g && !g.shared && (grids.includes(g) || !inRaid && (g === s.stash || g.creel || src.tag === "safe"));
    if (!mine) {
      SX.log("가방 · 리그 · 보관함으로 옮긴 뒤 나눌 수 있습니다");
      SX.audio.play("denied");
      return;
    }
    if (pendNo(it)) return;
    const u = I.stackUnit(it) === "마리";
    if (I.qty(it) < 2) {
      SX.log(u ? "나눌 수 없습니다 — 두 마리는 있어야 합니다" : "나눌 수 없습니다 — 두 개는 있어야 합니다");
      SX.audio.play("denied");
      return;
    }
    const m = I.splitStack(it);
    if (!m) return;
    let ok = I.put(g, m);
    for (const q of grids) if (!ok && q !== g && I.put(q, m)) ok = true;
    if (!ok && !inRaid && g !== s.stash) ok = I.put(s.stash, m);
    if (!ok) {
      it.n = I.qty(it) + m.n;
      SX.log("나눌 자리가 없습니다 — 한 칸을 비워 주십시오");
      SX.audio.play("denied");
      return;
    }
    SX.audio.play("rustle", {
      vol: .6
    });
    SX.log(u ? "나눴습니다 — " + it.name + " " + I.qty(it) + "마리 · " + m.n + "마리" : "나눴습니다 — " + it.name + " " + I.qty(it) + "개 · " + m.n + "개");
    if (src.tag === "safe" && SX.vault) SX.vault.touch();
    if (!inRaid) SX.game.persist();
    U.afterChange();
  }
  let partsEl = null, partsGun = null, partsSrc = null, partsRendered = null;
  const SLOT_KO = () => SX.PART_SLOT_NAMES;
  function mineSrc(src) {
    const kit = SX.game.kit, s = SX.game.save;
    if (!src) return false;
    if (src.kind === "slot") return true;
    if (homeScene()) return src.kind === "disp" || src.kind === "grid" && !!src.grid && !src.grid.noPut;
    if (src.kind !== "grid") return false;
    return src.grid === (kit.rig && kit.rig.grid) || src.grid === (kit.bag && kit.bag.grid) || SX.game.state !== "raid" && src.grid === s.stash;
  }
  function contEdit(src, gun) {
    return SX.game.state === "raid" && !!src && src.kind === "grid" && !!src.grid && !src.grid.noPut && !!gun && !!I.at(src.grid, gun);
  }
  function detachSrc(src) {
    if (mineSrc(src)) return true;
    if (homeScene() && src && src.kind === "grid" && src.grid && src.grid.noPut) return true;
    if (!src || src.kind !== "grid" || !src.grid || src.grid.noPut) return false;
    return !!I.at(src.grid, partsGun);
  }
  const modSig = g => SX.coop && SX.coop.modSig ? SX.coop.modSig(g) : "";
  function syncGun(gun, prev, gained, lost) {
    const C = SX.coop, R = SX.raid;
    if (!C || !C.raid || !C.modGun || !R || !R.conts) return;
    for (const c of R.conts.values()) if (c.grid.shared && I.at(c.grid, gun)) {
      C.modGun(c.grid, gun, {
        prev,
        gained: gained.filter(Boolean).map(q => q.id),
        lost: lost.filter(Boolean)
      });
      return;
    }
  }
  const homeScene = () => SX.game.state === "hub" && SX.hub && SX.hub.scene === "home";
  const inRange = () => SX.game.state === "hub" && SX.hub && SX.hub.scene === "range";
  function ownedParts() {
    const kit = SX.game.kit, out = [], where = new Map;
    const grids = I.kitGrids(kit).slice();
    if (SX.game.state !== "raid" && !inRange()) {
      grids.push(SX.game.save.stash);
      where.set(SX.game.save.stash, "보관함");
    }
    if (homeScene()) {
      const H = SX.home;
      for (const f of H.save().furn || []) {
        if (!f.placed) continue;
        const cat = H.FURN[f.kind];
        if (!cat) continue;
        const nm = cat.name.replace(/\(.*\)$/, "");
        if (cat.grid) {
          const g = H.gridOf(f);
          grids.push(g);
          where.set(g, nm);
        } else if (f.items) f.items.forEach((it, k) => {
          if (it && it.kind === "part") out.push({
            it,
            src: {
              kind: "disp",
              furn: f,
              k
            },
            where: nm
          });
        });
      }
    }
    if (U.panelKind === "inv" && invOther) {
      if (invOther.kind === "loot" && invOther.cont && invOther.cont.searched) grids.push(invOther.cont.grid);
      if (invOther.kind === "near") for (const c of invOther.conts || []) if (c.searched) grids.push(c.grid);
      if (invOther.kind === "box" && invOther.grid) grids.push(invOther.grid);
    }
    const seen = new Set;
    for (const g of grids) {
      if (!g || seen.has(g)) continue;
      seen.add(g);
      for (const e of g.list) if (e.it.kind === "part") out.push({
        it: e.it,
        grid: g,
        where: where.get(g) || ""
      });
    }
    return out;
  }
  function stowAny(it, prefer) {
    if (prefer && I.put(prefer, it)) return true;
    if (I.kitStow(SX.game.kit, it)) return true;
    if (inRange()) return true;
    dropToGround(it);
    return true;
  }
  function attachPart(gun, part, src) {
    if (pendNo(gun) || pendNo(part)) return false;
    if (!SX.partFits(part, gun)) {
      SX.audio.play("denied");
      SX.log("이 총엔 안 맞습니다");
      return false;
    }
    const from = src && src.kind === "grid" ? src.grid : null, at = from ? I.at(from, part) : null;
    const sig0 = modSig(gun), part0 = SX.raid && SX.raid.nd && !(from && from.shared) ? SX.raid.nd(part) : null;
    const disp = src && src.kind === "disp" ? src : null;
    if (disp && SX.home.displayItems(disp.furn)[disp.k] !== part) {
      SX.audio.play("denied");
      return false;
    }
    if (from) I.take(from, part);
    if (disp) SX.home.takeDisplay(disp.furn, disp.k);
    const r = I.attach(gun, part);
    if (!r.ok) {
      if (from && at) I.put(from, part, at.x, at.y, part.rot);
      if (disp) SX.home.putDisplay(disp.furn, disp.k, part);
      SX.audio.play("denied");
      return false;
    }
    if (r.old && !stowAny(r.old, from)) {
      I.attach(gun, r.old);
      if (from && at) I.put(from, part, at.x, at.y, false); else if (disp) SX.home.putDisplay(disp.furn, disp.k, part); else stowAny(part);
      SX.audio.play("denied");
      SX.log("빼낸 파츠를 둘 자리가 없습니다");
      return false;
    }
    if (r.spill) stowAny(r.spill);
    if (disp || partsSrc && partsSrc.kind === "disp") SX.game.persist();
    SX.audio.play("reload", {
      vol: .5
    });
    SX.log("🔧 " + gun.name + " ← " + part.name + (r.old ? " (" + r.old.name + " 뺌)" : ""));
    syncGun(gun, sig0, [ r.old, r.spill ], [ part0 ]);
    U.afterChange();
    renderParts();
    return true;
  }
  function detachPart(gun, slot) {
    if (pendNo(gun)) return;
    const sig0 = modSig(gun);
    const r = I.detach(gun, slot);
    if (!r.part) return;
    if (!stowAny(r.part)) {
      I.attach(gun, r.part);
      SX.audio.play("denied");
      SX.log("뺀 파츠를 둘 자리가 없습니다(가방·보관함이 꽉 찼습니다)");
      return;
    }
    if (r.spill) stowAny(r.spill);
    if (!mineSrc(partsSrc) && SX.game.state === "raid") {
      pickedUp(r.part);
      if (r.spill) pickedUp(r.spill);
    }
    if (partsSrc && partsSrc.kind === "disp") SX.game.persist();
    SX.audio.play("click");
    SX.log("🔧 " + gun.name + " — " + r.part.name + " 뺐습니다");
    syncGun(gun, sig0, [ r.part, r.spill ], []);
    U.afterChange();
    renderParts();
  }
  const pct = v => Math.round(Math.abs(1 - v) * 100) + "%";
  U.partFxText = function(p) {
    const x = SX.partDef(p).fx || {}, L = [];
    if (x.quiet) L.push("소음(적이 듣는 거리 30 → 7칸)");
    if (x.mag) L.push("장탄 +" + pct(x.mag));
    if (x.reload) L.push("재장전 " + pct(x.reload) + (x.reload < 1 ? " 빠름" : " 느림"));
    if (x.bloom) L.push("연사 흐트러짐 −" + pct(x.bloom));
    if (x.kick) L.push("반동 −" + pct(x.kick));
    if (x.ads) L.push("조준 사격 퍼짐 −" + pct(x.ads));
    if (x.hip) L.push("지향 사격 퍼짐 −" + pct(x.hip));
    if (x.move) L.push("걸으며 쏠 때 퍼짐 −" + pct(x.move));
    if (x.rate) L.push("조준 " + pct(x.rate) + (x.rate > 1 ? " 빨리" : " 늦게") + " 모임");
    if (x.choke) L.push("산탄 퍼짐 −" + pct(x.choke));
    if (x.flash) L.push("총구 불빛 −" + pct(x.flash));
    if (x.fuzz && !x.quiet) L.push("쏜 자리를 " + x.fuzz + "칸쯤 숨김");
    if (x.noise) L.push("총소리 +" + pct(x.noise));
    if (x.scope) L.push("조준 사격하면 둥근 창 · 더 멀리");
    if (x.laser) L.push("붉은 레이저 줄");
    return L.join(" · ");
  };
  U.closeParts = function() {
    if (partsEl) partsEl.classList.add("hidden");
    partsGun = null;
    partsRendered = null;
  };
  U.partsOpen = () => !!partsEl && !partsEl.classList.contains("hidden");
  U.openParts = function(gun, src) {
    if (!gun || gun.kind !== "gun") return;
    partsGun = gun;
    partsSrc = src;
    if (!partsEl) {
      partsEl = document.createElement("div");
      partsEl.id = "partsWin";
      partsEl.className = "hidden";
      document.body.appendChild(partsEl);
      partsEl.addEventListener("mousedown", e => {
        if (e.target === partsEl) U.closeParts();
      });
      partsEl.addEventListener("click", e => {
        if (e.target.closest("[data-pclose]")) return U.closeParts();
        const a = e.target.closest("[data-att]"), d = e.target.closest("[data-det]");
        if (a && partsGun) {
          const o = ownedParts()[+a.dataset.att];
          if (o) attachPart(partsGun, o.it, o.src || {
            kind: "grid",
            grid: o.grid
          });
        }
        if (d && partsGun) detachPart(partsGun, d.dataset.det);
      });
    }
    partsEl.classList.remove("hidden");
    renderParts();
    SX.audio.play("click");
  };
  function gunStatsHtml(g) {
    const b = I.def(g.name) || g;
    const fxv = v => v == null ? 1 : v;
    const row = (k, a, c, better, unit) => {
      const same = Math.abs(a - c) < 1e-6, good = better === "up" ? c > a : c < a;
      return `<tr><td>${k}</td><td>${a}${unit || ""}</td><td class="${same ? "" : good ? "good" : "bad"}">${same ? "—" : "→ " + c + (unit || "")}</td></tr>`;
    };
    const pc = v => Math.round(v * 100);
    const loud = (q, n) => Math.round((q ? 7 : 30) * n);
    let stats = "<table class='pstat'>";
    stats += row("장탄", b.magSize, g.magSize, "up", "발");
    stats += row("탄속", A.gunVel(b), A.gunVel(g), "up", "칸/초");
    stats += row("조준 시야", pc(b.look || 1), pc(A.gunLook(g)), "up", "%");
    stats += row("재장전", (b.reload || 1.3).toFixed(2), (g.reload || 1.3).toFixed(2), "down", "초");
    stats += row("연사 흐트러짐", 100, pc((g.bloom || 0) / (b.bloom || .026)), "down", "%");
    stats += row("반동", 100, pc((g.kick || 0) / (b.kick || 1.3)), "down", "%");
    stats += row("조준 사격 퍼짐", 100, pc(fxv(g.fxAds)), "down", "%");
    stats += row("지향 사격 퍼짐", 100, pc(fxv(g.fxHip)), "down", "%");
    stats += row("걸으며 쏠 때", 100, pc(fxv(g.fxMove)), "down", "%");
    stats += row("조준 모이는 빠르기", 100, pc(fxv(g.fxRate)), "up", "%");
    if (b.pellets) stats += row("산탄 퍼짐", 100, pc((g.spread || 0) / (b.spread || .06)), "down", "%");
    stats += row("총소리 닿는 거리", loud(b.quiet, 1), loud(g.quiet, fxv(g.fxNoise)), "down", "칸");
    stats += row("총구 불빛", 100, pc(g.quiet ? Math.min(.4, fxv(g.fxFlash)) : fxv(g.fxFlash)), "down", "%");
    stats += row("무게", (b.kg || 3).toFixed(2), (g.kg || b.kg || 3).toFixed(2), "down", "kg");
    stats += "</table>";
    return stats;
  }
  function renderParts() {
    if (!partsEl || !partsGun || partsEl.classList.contains("hidden")) return;
    const g = partsGun, b = I.def(g.name) || g, mine = mineSrc(partsSrc) || contEdit(partsSrc, g), canDet = detachSrc(partsSrc), slots = SX.partSlots(g), owned = ownedParts();
    const stats = gunStatsHtml(g);
    const pb = $("partsBody"), keepTop = pb && partsRendered === g ? pb.scrollTop : 0;
    partsEl.innerHTML = `<div class="win partsWin"><header><h2>${esc(g.name)} — 파츠</h2><button class="x" data-pclose>닫기 ✕</button></header><div class="body row" id="partsBody"></div></div>`;
    const body = $("partsBody");
    const left = document.createElement("div");
    left.className = "col";
    left.style.alignItems = "center";
    left.style.minWidth = "calc(var(--u)*150)";
    left.appendChild(bigCanvas(ART.icon(Object.assign({}, g, {
      rot: false
    })), 300, 150));
    const wp = ART.weapon(g);
    if (wp) left.appendChild(bigCanvas(wp.c, 260, 90));
    const st = document.createElement("div");
    st.innerHTML = stats;
    left.appendChild(st);
    const right = document.createElement("div");
    right.className = "col";
    right.style.flex = "1";
    right.style.minWidth = "calc(var(--u)*190)";
    if (!mine) {
      const n = document.createElement("p");
      n.className = "warn";
      n.textContent = canDet && !homeScene() ? "남의 총 — 파츠 빼기만 됩니다(뺀 것은 가방·리그로). 달려면 총을 가방·리그로 옮기시면 됩니다" : SX.game.state === "raid" ? "가방·리그로 옮긴 총만 파츠를 만질 수 있습니다" + (partsSrc && partsSrc.grid && partsSrc.grid.shared && SX.coop && SX.coop.raid ? "(같이 하는 판의 상자 속 총은 가져와서)" : "") : homeScene() && canDet ? "창고에 넣어 둔 가구 속 총 — 파츠 빼기만 됩니다. 달려면 총을 꺼내시면 됩니다" : "가방·리그·보관함의 총만 파츠를 만질 수 있습니다";
      right.appendChild(n);
    }
    if (!slots.length) {
      const n = document.createElement("p");
      n.className = "small";
      n.textContent = "이 총엔 파츠를 달 자리가 없습니다";
      right.appendChild(n);
    }
    for (const s of slots) {
      const cur = g.mods && g.mods[s];
      const box = document.createElement("div");
      box.className = "pslot";
      let h = `<div class="pcur"><b class="plab">${esc(SLOT_KO()[s])}</b>`;
      if (cur) h += `<span class="picn" data-ic="cur"></span><span class="pnm">${esc(cur.name)}<br><span class="small">${esc(U.partFxText(cur))}</span></span>${canDet ? `<button data-det="${s}">빼기</button>` : ""}`; else h += `<span class="small">비었습니다</span>`;
      h += `</div>`;
      box.innerHTML = h;
      if (cur) box.querySelector("[data-ic=cur]").appendChild(iconCanvas(cur));
      const fits = owned.map((o, k) => ({
        o,
        k
      })).filter(q => SX.partDef(q.o.it).slot === s && SX.partFits(q.o.it, g));
      const groups = new Map;
      for (const q of fits) {
        const gq = groups.get(q.o.it.name) || {
          q,
          n: 0,
          where: new Map
        };
        gq.n++;
        if (q.o.where) gq.where.set(q.o.where, (gq.where.get(q.o.where) || 0) + 1);
        groups.set(q.o.it.name, gq);
      }
      for (const gq of groups.values()) {
        const q = gq.q, wh = [ ...gq.where ].map(([w, c]) => w + (c > 1 ? " " + c : "")).join(" · ");
        const r = document.createElement("div");
        r.className = "popt";
        r.innerHTML = `<span class="picn"></span><span class="pnm">${esc(q.o.it.name)}${gq.n > 1 ? " <b>×" + gq.n + "</b>" : ""}${wh ? " <span class='small'>(" + esc(wh) + ")</span>" : ""}<br><span class="small">${esc(U.partFxText(q.o.it))}</span></span>${mine ? `<button data-att="${q.k}">${cur ? "바꾸기" : "달기"}</button>` : ""}`;
        r.querySelector(".picn").appendChild(iconCanvas(Object.assign({}, q.o.it, {
          rot: false
        })));
        box.appendChild(r);
      }
      if (!fits.length) {
        const n = document.createElement("div");
        n.className = "small popt";
        n.textContent = "가진 것 중 맞는 파츠가 없습니다 — 시장 [파츠] 탭 · 판에서 줍기";
        box.appendChild(n);
      }
      right.appendChild(box);
    }
    const hint = document.createElement("p");
    hint.className = "small";
    hint.textContent = "파츠를 가방에서 총 위로 끌어다 놓아도 달립니다 · Esc·바깥 누르기로 닫습니다";
    right.appendChild(hint);
    body.append(left, right);
    body.scrollTop = keepTop;
    partsRendered = g;
  }
  addEventListener("keydown", e => {
    if (U.partsOpen() && e.code === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      U.closeParts();
    }
  }, true);
  U.openStash = () => U.openInventory({
    kind: "stash"
  });
  U.openGate = function(done) {
    if (done) done();
  };
  function netState(w, st) {
    w.dataset.st = st || "";
    for (const el of w.querySelectorAll(".netIn")) {
      if (st === "err" && el.offsetParent !== null) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    }
    if (st === "err") {
      w.classList.remove("glitch");
      void w.offsetWidth;
      w.classList.add("glitch");
    }
  }
  const pixRGB = new Map;
  function Pix(W, H) {
    this.W = W;
    this.H = H;
    this.d = new Uint8ClampedArray(W * H * 4);
    this.m = new Int8Array(W * H).fill(-1);
  }
  Pix.prototype.set = function(x, y, hex, mat) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H || !hex) return;
    let v = pixRGB.get(hex);
    if (v == null) {
      v = parseInt(hex.slice(1), 16);
      pixRGB.set(hex, v);
    }
    const i = y * this.W + x, n = i * 4;
    this.d[n] = v >> 16;
    this.d[n + 1] = v >> 8 & 255;
    this.d[n + 2] = v & 255;
    this.d[n + 3] = 255;
    if (mat != null) this.m[i] = mat;
  };
  Pix.prototype.mat = function(x, y) {
    return x < 0 || y < 0 || x >= this.W || y >= this.H ? -1 : this.m[y * this.W + x];
  };
  Pix.prototype.put = function(cv) {
    cv.width = this.W;
    cv.height = this.H;
    const x = cv.getContext("2d");
    const img = x.createImageData(this.W, this.H);
    img.data.set(this.d);
    x.putImageData(img, 0, 0);
    return cv;
  };
  const RIG = {
    out: "#15140f",
    dk: "#25231d",
    sh: "#2e2c25",
    base: "#3a382f",
    lt: "#46443a",
    hi: "#55524a",
    knob: "#33312a",
    knobRim: "#1f1e19",
    paint: "#c8c2ac",
    screw: "#6f6b5d",
    screwHi: "#8f8a78",
    rust: "#5c3f27",
    rust2: "#734f30",
    grill: "#1c1b16",
    glass: "#070d09",
    tape: "#8c897d",
    tapeHi: "#a3a093",
    tapeSh: "#77746a",
    tapeDirt: "#7f7c71",
    tapeOut: "#5a574e"
  };
  U.RIG = RIG;
  U.rigPaint = function(cv, W, H, hole, opt) {
    const C = RIG, px = new Pix(W, H), R = new SX.Rng(9661), cut = 3;
    const inShape = (x, y) => x >= 0 && y >= 0 && x < W && y < H && x + y >= cut && W - 1 - x + y >= cut && x + (H - 1 - y) >= cut && W - 1 - x + (H - 1 - y) >= cut;
    const h = hole || {
      x: 9,
      y: 15,
      w: W - 18,
      h: H - 34
    };
    const onTape = (x, y) => {
      const s = x + (H - 1 - y);
      return s >= 10 && s <= 17;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inShape(x, y)) continue;
      const r = R.f();
      px.set(x, y, r < .045 ? C.lt : r < .085 ? C.sh : C.base, 0);
    }
    const strips = [ [ 2, 2, W - 4, h.y - 4 ], [ 2, h.y + h.h + 3, W - 4, H - (h.y + h.h) - 6 ], [ 2, h.y, h.x - 4, h.h ], [ h.x + h.w + 2, h.y, W - (h.x + h.w) - 4, h.h ] ];
    for (let k = 0; k < 14; k++) {
      const s = strips[k % 4];
      if (s[2] < 4 || s[3] < 3) continue;
      let x = s[0] + R.i(s[2]), y = s[1] + R.i(s[3]);
      const dx = R.f() < .5 ? 1 : -1, len = 3 + R.i(6), steep = R.f() < .4;
      for (let j = 0; j < len; j++) {
        px.set(x, y, C.hi, 0);
        x += dx;
        if (steep || j % 2) y += 1;
      }
    }
    const rustAt = (cx, cy, n) => {
      let x = cx, y = cy;
      for (let j = 0; j < n; j++) {
        if (inShape(x, y)) px.set(x, y, R.f() < .6 ? C.rust : C.rust2, 0);
        x += R.i(3) - 1;
        y += R.i(3) - 1;
      }
    };
    rustAt(W - 9, 9, 12);
    rustAt(W - 6, 5, 7);
    rustAt(Math.round(W * .42), H - 4, 14);
    rustAt(Math.round(W * .8), H - 4, 9);
    rustAt(4, Math.round(H * .45), 8);
    for (const gx of [ Math.max(2, Math.round(h.x / 2) - 2), W - Math.max(2, Math.round(h.x / 2) - 2) - 4 ]) {
      for (let k = 0; k < 5; k++) {
        const gy = Math.round(H / 2) - 7 + k * 3;
        for (let j = 0; j < 4; j++) {
          px.set(gx + j, gy, C.dk, 0);
          px.set(gx + j, gy + 1, C.hi, 0);
        }
      }
    }
    for (let x = h.x - 2; x < h.x + h.w + 2; x++) {
      px.set(x, h.y - 2, C.sh, 0);
      px.set(x, h.y - 1, C.dk, 0);
      px.set(x, h.y + h.h, C.hi, 0);
      px.set(x, h.y + h.h + 1, C.lt, 0);
    }
    for (let y = h.y - 2; y < h.y + h.h + 2; y++) {
      px.set(h.x - 2, y, C.sh, 0);
      px.set(h.x - 1, y, C.dk, 0);
      px.set(h.x + h.w, y, C.hi, 0);
      px.set(h.x + h.w + 1, y, C.lt, 0);
    }
    for (let y = h.y; y < h.y + h.h; y++) for (let x = h.x; x < h.x + h.w; x++) px.set(x, y, C.glass, 0);
    const by = h.y + h.h + 2, bh = H - 2 - by, gl = Math.min(48, Math.round(W * .18));
    for (let k = 0; k < 3 && 3 + k * 3 < bh - 2; k++) {
      const y = by + 3 + k * 3;
      for (let x = 24; x < 24 + gl; x++) {
        px.set(x, y, C.grill, 0);
        px.set(x, y + 1, C.hi, 0);
      }
    }
    const knob = (cx, cy, a) => {
      const r = 4;
      for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d <= r + .5) px.set(cx + x, cy + y, d > r - .5 ? C.knobRim : x + y < -3 && d > r - 1.8 ? C.hi : d < 1.6 ? C.lt : C.knob, 0);
      }
      for (let k = 0; k < 5; k++) {
        const t = Math.PI * (.8 + k * .35);
        px.set(cx + Math.round(Math.cos(t) * (r + 2)), cy + Math.round(Math.sin(t) * (r + 2)), C.hi, 0);
      }
      for (let j = 1; j < r; j++) px.set(cx + Math.round(Math.cos(a) * j), cy + Math.round(Math.sin(a) * j), C.paint, 0);
    };
    const ky = by + Math.max(5, Math.round(bh / 2));
    if (bh >= 11) {
      knob(W - 19, ky, -.9);
      knob(W - 33, ky, -2.4);
    }
    const screw = (cx, cy) => {
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
        if (Math.abs(x) === 2 && Math.abs(y) === 2) continue;
        const ring = Math.abs(x) === 2 || Math.abs(y) === 2;
        px.set(cx + x, cy + y, ring ? C.dk : x < 0 && y < 0 ? C.screwHi : C.screw, 0);
      }
      px.set(cx - 1, cy + 1, C.sh, 0);
      px.set(cx, cy, C.sh, 0);
      px.set(cx + 1, cy - 1, C.sh, 0);
    };
    const so = opt && opt.screw || 6;
    screw(so, so);
    screw(W - 1 - so, so);
    screw(W - 1 - so, H - 2 - so);
    screw(so, H - 2 - so);
    for (let y = 0; y < H; y++) for (let x = 0; x < 20; x++) {
      if (!inShape(x, y) || !onTape(x, y)) continue;
      const s = x + (H - 1 - y), r = R.f();
      px.set(x, y, s === 10 ? C.tapeHi : s === 17 ? C.tapeSh : r < .1 ? C.tapeDirt : (x * 3 + y) % 7 === 0 ? C.tapeSh : C.tape, 1);
    }
    const edge = (x, y) => !inShape(x - 1, y) || !inShape(x + 1, y) || !inShape(x, y - 1) || !inShape(x, y + 1) || !inShape(x, y + 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inShape(x, y) || edge(x, y) || px.mat(x, y) !== 0) continue;
      if (inShape(x, y - 1) && edge(x, y - 1)) px.set(x, y, C.hi, 0); else if (inShape(x - 1, y) && edge(x - 1, y)) px.set(x, y, C.lt, 0); else if (inShape(x + 1, y) && edge(x + 1, y)) px.set(x, y, C.sh, 0); else if (inShape(x, y + 1) && edge(x, y + 1)) px.set(x, y, C.dk, 0);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inShape(x, y) || !edge(x, y)) continue;
      px.set(x, y, px.mat(x, y) === 1 ? C.tapeOut : C.out);
    }
    return px.put(cv);
  };
  const unitOf = el => parseFloat(getComputedStyle(el).getPropertyValue("--u")) || 2;
  U.Pix = Pix;
  U.unitOf = unitOf;
  function gateDeco(rig) {
    const cv = rig.querySelector(".rigArt");
    let key = "";
    const fit = () => {
      if (!rig.isConnected) return;
      const u = unitOf(rig), W = Math.floor(rig.clientWidth / u), H = Math.floor(rig.clientHeight / u), s = rig.querySelector(".netScr");
      if (W < 30 || H < 30) return;
      const hole = s ? {
        x: Math.round(s.offsetLeft / u),
        y: Math.round(s.offsetTop / u),
        w: Math.round(s.offsetWidth / u),
        h: Math.round(s.offsetHeight / u)
      } : null;
      const k = [ W, H, u, hole && hole.x, hole && hole.y, hole && hole.w, hole && hole.h ].join(",");
      if (k === key) return;
      key = k;
      U.rigPaint(cv, W, H, hole);
      cv.style.width = W * u + "px";
      cv.style.height = H * u + "px";
    };
    fit();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!rig.isConnected) {
          ro.disconnect();
          return;
        }
        fit();
      });
      ro.observe(rig);
      const s = rig.querySelector(".netScr");
      if (s) ro.observe(s);
    }
    U.gateSky();
  }
  const SKY = {
    s1: "#120c10",
    s2: "#1a1015",
    s3: "#24131a",
    s4: "#30171c",
    ridge: "#1a111a",
    far: "#121119",
    mid: "#0b0b11",
    near: "#050609",
    win: "#6b5527",
    win2: "#8a6c30",
    winDim: "#2a2418",
    smoke: "#2b2228",
    glow: "#3d1c16",
    red: "#b8322e",
    redDk: "#4a1616",
    f1: "#7a2e1a",
    f2: "#c8642a",
    f3: "#e09a3a"
  };
  const BAYER = [ 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 ];
  const dith = (x, y, k) => BAYER[(y & 3) * 4 + (x & 3)] < k * 16;
  function skyBase(W, H) {
    const S = SKY, px = new Pix(W, H), R = new SX.Rng(9662);
    const top = new Int16Array(W).fill(H);
    const col = (x, y0, c) => {
      if (x < 0 || x >= W) return;
      y0 = Math.round(y0);
      for (let y = Math.max(0, y0); y < H; y++) px.set(x, y, c);
      if (y0 < top[x]) top[x] = Math.max(0, y0);
    };
    const band = [ [ .14, .3, S.s1, null ], [ .3, .48, S.s2, S.s1 ], [ .48, .64, S.s3, S.s2 ], [ .64, 1, S.s4, S.s3 ] ];
    for (let y = 0; y < H; y++) {
      const t = y / H, b = band.find(q => t >= q[0] && t < q[1]);
      if (!b) continue;
      const k = (t - b[0]) / (b[1] - b[0]);
      for (let x = 0; x < W; x++) {
        if (dith(x, y, b[3] ? .2 + k * .8 : k)) px.set(x, y, b[2]); else if (b[3]) px.set(x, y, b[3]);
      }
    }
    for (let x = 0; x < W; x++) col(x, H * .6 - Math.sin(x * .011 + .4) * H * .07 - Math.sin(x * .037 + 1.3) * H * .035 - Math.abs(Math.sin(x * .09)) * H * .015, S.ridge);
    const tx = Math.round(W * .8), hw = Math.max(16, Math.round(W * .08)), hb = H * .74, hh = H * .16;
    for (let x = tx - hw; x <= tx + hw; x++) {
      const d = (x - tx) / hw;
      col(x, hb - hh * Math.sqrt(Math.max(0, 1 - d * d)), S.far);
    }
    const tb = Math.round(hb - hh) + 1, th = Math.max(14, Math.round(H * .3)), pod = tb - Math.round(th * .74);
    for (let y = tb - th; y < tb; y++) {
      px.set(tx, y, S.far);
      px.set(tx + 1, y, S.far);
    }
    for (let x = tx - 1; x <= tx + 2; x++) for (let y = tb - 3; y < tb; y++) px.set(x, y, S.far);
    for (let x = tx - 3; x <= tx + 4; x++) {
      px.set(x, pod, S.far);
      px.set(x, pod + 1, S.far);
    }
    for (let x = tx - 2; x <= tx + 3; x++) {
      px.set(x, pod - 1, S.far);
      px.set(x, pod + 2, S.far);
    }
    for (let x = tx - 1; x <= tx + 2; x++) px.set(x, tb - Math.round(th * .56), S.far);
    const ant = Math.max(5, Math.round(th * .32));
    for (let y = tb - th - ant; y < tb - th; y++) px.set(tx, y, S.far);
    const live = {
      tower: [ tx, tb - th - ant ],
      fires: [],
      wins: []
    };
    const lx = Math.round(W * .16), lh = Math.round(H * .6), lb = Math.round(H * .82);
    for (let y = lb - lh; y < lb; y++) {
      const k = (lb - y) / lh, hwid = Math.max(1, Math.round(5 * (1 - k * .75)));
      if (k > .93 && y * 7 % 3 === 0) continue;
      for (let x = lx - hwid; x <= lx + hwid - (k > .85 ? 1 : 0); x++) col(x, y, S.far);
    }
    const fb = Math.round(H * .82);
    for (let x = 0; x < W; ) {
      const apt = R.f() < .4, w = apt ? 16 + R.i(14) : 5 + R.i(9), hgt = Math.round(H * (apt ? .2 + R.f() * .08 : .14 + R.f() * .2));
      if (R.f() < .22 || Math.abs(x + w / 2 - tx) < hw * .7 || Math.abs(x + w / 2 - lx) < 8) {
        x += 3 + R.i(6);
        continue;
      }
      const y0 = fb - hgt;
      for (let xx = x; xx < x + w; xx++) col(xx, y0, S.far);
      if (apt) {
        const ex = x + 2 + R.i(Math.max(1, w - 8));
        for (let xx = ex; xx < ex + 4; xx++) col(xx, y0 - 3, S.far);
      } else if (R.f() < .4) col(x + (w >> 1), y0 - 3 - R.i(4), S.far);
      for (let yy = y0 + 3; yy < fb - 2; yy += 3) for (let xx = x + 1; xx < x + w - 1 && xx < W; xx += 2) if (R.f() < .012) px.set(xx, yy, S.winDim);
      x += w + (R.f() < .4 ? 1 + R.i(4) : 0);
    }
    const mb = Math.round(H * .92);
    for (let x = -3; x < W; ) {
      const w = 7 + R.i(15), hgt = Math.round(H * (.1 + R.f() * .22)), y0 = mb - hgt, broke = R.f() < .5;
      if (R.f() < .28) {
        x += 4 + R.i(10);
        continue;
      }
      let cy = y0;
      for (let xx = x; xx < x + w; xx++) {
        if (broke) {
          cy += R.i(3) - 1;
          cy = Math.max(y0, Math.min(y0 + Math.round(hgt * .4), cy));
        }
        col(xx, broke ? cy : y0, S.mid);
      }
      if (broke && R.f() < .7) {
        const rx = x + 1 + R.i(Math.max(1, w - 2)), n = 4 + R.i(4);
        if (rx >= 0 && rx < W) for (let j = 1; j < n; j++) px.set(rx + (j > 3 ? 1 : 0), top[rx] - j + 1, S.mid);
      }
      const lit = R.f() < .35 ? y0 + 3 + 4 * R.i(Math.max(1, Math.floor((hgt - 6) / 4))) : -1;
      for (let yy = y0 + 3; yy < mb - 2; yy += 4) for (let xx = x + 2; xx < x + w - 1; xx += 3) {
        if (xx < 0 || xx >= W || yy <= top[xx] + 1) continue;
        if (yy === lit && R.f() < .7) {
          px.set(xx, yy, S.win);
          if (R.f() < .3) live.wins.push([ xx, yy ]);
        } else if (R.f() < .02) px.set(xx, yy, S.winDim);
      }
      if (live.fires.length < 3 && R.f() < .3 && x > 6 && x + w < W - 6 && Math.abs(x - tx) > 20) {
        const fx = x + Math.round(w / 2);
        live.fires.push([ fx, top[fx] ]);
      }
      x += w + (R.f() < .35 ? 1 + R.i(4) : 0);
    }
    for (const [fx, fy] of live.fires) {
      for (let y = fy - 6; y <= fy + 4; y++) for (let x = fx - 7; x <= fx + 7; x++) {
        const d = Math.hypot((x - fx) / 7, (y - fy) / 6);
        if (d < 1 && dith(x, y, .75 - d * .6)) px.set(x, y, S.glow);
      }
      for (let y = fy - 3, j = 0; y > 0; y--, j++) {
        const cx = fx + Math.round(j * .4 + Math.sin(j * .22) * 2), wd = 1 + Math.min(7, Math.floor(j / 5)), k = Math.max(0, .85 - j / (fy * 1.05));
        for (let x = cx - wd; x <= cx + wd; x++) if (x >= 0 && x < W && y < top[x] && dith(x, y, k)) px.set(x, y, S.smoke);
      }
    }
    for (let x = 0; x < W; ) {
      const w = 14 + R.i(26), y0 = H - Math.round(H * (.04 + R.f() * .07));
      for (let xx = x; xx < x + w; xx++) col(xx, y0, S.near);
      const r = R.f();
      if (r < .4) {
        const t2 = x + 2 + R.i(Math.max(1, w - 10));
        for (let xx = t2; xx < t2 + 6; xx++) col(xx, y0 - 5, S.near);
        for (let yy = y0 - 2; yy < y0; yy++) {
          px.set(t2, yy, S.near);
          px.set(t2 + 5, yy, S.near);
        }
      } else if (r < .65) {
        const ax = x + 2 + R.i(Math.max(1, w - 4));
        for (let yy = y0 - 9; yy < y0; yy++) px.set(ax, yy, S.near);
        px.set(ax - 1, y0 - 7, S.near);
        px.set(ax + 1, y0 - 7, S.near);
        px.set(ax - 2, y0 - 5, S.near);
        px.set(ax + 2, y0 - 5, S.near);
      }
      x += w;
    }
    const c = ART.mk(W, H);
    px.put(c);
    return {
      c,
      live,
      W,
      H
    };
  }
  function skyLive(x, b, t) {
    const S = SKY, P = new ART.Pen(x);
    const [tx, ty] = b.live.tower;
    if (t % 6 < 3) {
      P.p(tx, ty, S.red);
      P.p(tx - 1, ty, S.redDk);
      P.p(tx + 1, ty, S.redDk);
      P.p(tx, ty - 1, S.redDk);
    }
    for (const [fx, fy] of b.live.fires) {
      for (let k = -2; k <= 2; k++) {
        const hgt = 1 + (Math.random() * (3 - Math.abs(k)) | 0);
        for (let j = 0; j < hgt; j++) P.p(fx + k, fy - 1 - j, j === hgt - 1 ? S.f1 : j === 0 && Math.abs(k) < 2 ? S.f3 : S.f2);
      }
    }
    b.live.wins.forEach(([wx, wy], i) => {
      if ((t + i * 7) % 23 < 2) P.p(wx, wy, S.winDim); else if ((t + i * 5) % 17 === 0) P.p(wx, wy, S.win2);
    });
  }
  let skyT = 0;
  U.gateSky = function() {
    const gate = $("gate");
    if (!gate || skyT) return;
    let cv = gate.querySelector(".gateSky");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.className = "gateSky";
      cv.setAttribute("aria-hidden", "true");
      gate.insertBefore(cv, gate.firstChild);
    }
    let b = null, key = "", t = 0;
    const tick = () => {
      if (gate.classList.contains("hidden") || !cv.isConnected) {
        clearInterval(skyT);
        skyT = 0;
        return;
      }
      const u = unitOf(gate), W = Math.ceil(innerWidth / u), H = Math.max(48, Math.min(260, Math.round(innerHeight * .42 / u))), k = W + "x" + H + "@" + u;
      if (k !== key) {
        key = k;
        b = skyBase(W, H);
        cv.width = W;
        cv.height = H;
        cv.style.width = W * u + "px";
        cv.style.height = H * u + "px";
      }
      const x = cv.getContext("2d");
      x.clearRect(0, 0, W, H);
      x.drawImage(b.c, 0, 0);
      skyLive(x, b, t++);
    };
    tick();
    skyT = setInterval(tick, 350);
  };
  U.skyState = () => ({
    on: !!skyT
  });
  if ($("gate") && !$("gate").classList.contains("hidden")) U.gateSky();
  if ($("gate")) $("gate").addEventListener("keydown", e => {
    if (e.code === "Tab" || e.code === "Space") e.stopPropagation();
  });
  const CASE_OF = {
    inv: "steel",
    range: "steel",
    shop: "wood",
    talk: "wood",
    story: "wood",
    garden: "wood",
    cook: "wood",
    water: "wood",
    fishShop: "wood",
    fishGrill: "wood",
    map: "tab",
    result: "report",
    wipe: "report",
    menu: "radio",
    keys: "radio",
    sound: "radio",
    screen: "radio",
    help: "radio",
    feedback: "radio",
    acct: "radio",
    coop: "radio",
    queue: "radio",
    course: "radio",
    look: "radio",
    news: "radio"
  };
  U.CASE_OF = CASE_OF;
  const CASE = {
    metal: {
      S: 8,
      M: 48,
      out: "#121419",
      dk: "#1f232a",
      sh: "#2a2f37",
      base: "#353b44",
      lt: "#414854",
      hi: "#56606e",
      face: "#191b20",
      sc: "#7d8693",
      scHi: "#a2aab5"
    },
    steel: {
      S: 8,
      M: 48,
      out: "#0f1317",
      dk: "#1c232b",
      sh: "#27303a",
      base: "#323d48",
      lt: "#3e4b58",
      hi: "#566a7c",
      face: "#161a1f",
      sc: "#7f909f",
      scHi: "#a9b6c2",
      hz: "#c9a227",
      hz2: "#2a2716",
      o1: "#1a170c"
    },
    wood: {
      S: 8,
      M: 48,
      out: "#1a0f08",
      dk: "#2b1b0f",
      sh: "#3b2615",
      base: "#4e331c",
      lt: "#5e3f23",
      hi: "#76552f",
      face: "#1b1611",
      sc: "#5a554c",
      scHi: "#8a8476",
      iron: "#2e2b27",
      ironHi: "#4c4741",
      o1: "#141210"
    },
    radio: {
      S: 8,
      M: 48,
      out: "#12130b",
      dk: "#22241a",
      sh: "#2e3122",
      base: "#3b3e2a",
      lt: "#484c34",
      hi: "#5b6043",
      face: "#18190f",
      sc: "#6f6b5d",
      scHi: "#8f8a78"
    },
    paper: {
      S: 8,
      M: 48,
      out: "#5b4a2c",
      dk: "#7a6642",
      sh: "#968156",
      base: "#ae9869",
      lt: "#c0aa7a",
      hi: "#d3bf90",
      face: "#14171c",
      pencil: "#8a7a58",
      tape: "#ddd3aa",
      tapeSh: "#c4b98d",
      o1: "#9a8f66"
    },
    report: {
      S: 8,
      M: 48,
      out: "#1b120a",
      dk: "#2b1e12",
      sh: "#3c2a19",
      base: "#503823",
      lt: "#61462d",
      hi: "#785a3a",
      face: "#17130e",
      sc: "#7a7466",
      scHi: "#a39d8c"
    },
    note: {
      S: 12,
      M: 48,
      out: "#160d06",
      dk: "#2a190d",
      sh: "#3a2414",
      base: "#4a2f1a",
      lt: "#5a3a21",
      hi: "#6e4a2b",
      face: "#1c1914",
      sc: "#6b6152",
      scHi: "#a39782",
      o1: "#160d06",
      cover: "#2e1f14",
      cvHi: "#4a3424",
      pg1: "#d9c99c",
      pg2: "#bcaa7e",
      pg3: "#9c8a60"
    },
    hud: {
      S: 4,
      M: 24,
      out: "#0e1013",
      dk: "#1b1e23",
      sh: "#262a31",
      base: "#30353d",
      lt: "#3b414b",
      hi: "#4f5764",
      face: "#0d0f12",
      sc: "#7d8693",
      scHi: "#a2aab5"
    }
  };
  U.CASE = CASE;
  U.casePaint = function(name) {
    const C = CASE[name] || CASE.metal, S = C.S, N = S * 2 + C.M, px = new Pix(N, N), R = new SX.Rng(9670 + name.charCodeAt(0) * 7 + name.length);
    const dep = (x, y) => Math.min(x, y, N - 1 - x, N - 1 - y);
    const side = (x, y) => {
      const a = [ y, x, N - 1 - y, N - 1 - x ], m = Math.min(a[0], a[1], a[2], a[3]);
      return a.indexOf(m);
    };
    const cut = name === "report" ? 3 : 2;
    const ring = (x, y) => x >= 0 && y >= 0 && x < N && y < N && dep(x, y) < S && x + y >= cut && N - 1 - x + y >= cut && x + (N - 1 - y) >= cut && N - 1 - x + (N - 1 - y) >= cut;
    let inM = ring;
    if (name === "paper") {
      const tear = new Int8Array(N * 4);
      for (let i = 0; i < tear.length; i++) tear[i] = R.f() < .3 ? R.f() < .35 ? 2 : 1 : 0;
      inM = (x, y) => {
        if (!ring(x, y)) return false;
        const s = side(x, y);
        return dep(x, y) >= tear[s * N + (s === 0 || s === 2 ? x : y)];
      };
    }
    const outer = (x, y) => x < 0 || y < 0 || x >= N || y >= N || dep(x, y) < S && !inM(x, y);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inM(x, y)) {
        if (dep(x, y) >= S) px.set(x, y, C.face, 2);
        continue;
      }
      const r = R.f(), d = dep(x, y), s = side(x, y), along = s === 0 || s === 2 ? x : y;
      let c = r < .05 ? C.lt : r < .1 ? C.sh : C.base;
      if (name === "wood") {
        const g = (d + Math.round(Math.sin(along * .23 + d * 1.7) * 1.4) + 30) % 3;
        c = g === 0 ? C.sh : g === 2 && r < .5 ? C.lt : r < .04 ? C.dk : C.base;
        if ((along - S) % 24 === 0 && along > S && along < N - S) c = C.dk;
      }
      if (name === "note") {
        if (d >= 6) {
          const lit = s === 0 || s === 1, k = d - 6;
          px.set(x, y, k === 0 ? lit ? C.cvHi : C.cover : k % 2 ? lit ? C.pg1 : C.pg2 : lit ? C.pg2 : C.pg3, 1);
          continue;
        }
        const g = (d + Math.round(Math.sin(along * .19 + d * 1.3) * 1.4) + 30) % 3;
        c = g === 0 ? C.sh : g === 2 && r < .5 ? C.lt : r < .04 ? C.dk : C.base;
        if ((along - S) % 24 === 12 && along > S && along < N - S) c = C.dk;
        if (d === 5 && (s === 2 || s === 3)) c = C.dk;
      }
      if (name === "steel" && (s === 0 || s === 2) && r < .08) c = C.lt;
      if (name === "report" && r < .06) c = r < .03 ? C.dk : C.hi;
      if (name === "paper" && along % 8 === 4 && d >= 2 && d <= S - 3) c = C.pencil;
      px.set(x, y, c, 0);
    }
    const midTop = f => {
      for (let k = S; k < N - S; k++) f(k);
    };
    if (name === "steel") {
      for (const k of [ S + 8, S + 24, S + 40 ]) {
        for (const [x, y] of [ [ k, 3 ], [ k, N - 5 ], [ 3, k ], [ N - 5, k ] ]) {
          px.set(x, y, C.scHi, 0);
          px.set(x + 1, y, C.sc, 0);
          px.set(x, y + 1, C.sc, 0);
          px.set(x + 1, y + 1, C.dk, 0);
        }
      }
      for (const [cx, cy] of [ [ 0, 0 ], [ N - S, N - S ] ]) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const X = cx + x, Y = cy + y;
        if (!inM(X, Y) || dep(X, Y) < 2 || dep(X, Y) > S - 3) continue;
        px.set(X, Y, (X + Y >> 1) % 2 ? C.hz : C.hz2, 1);
      }
    }
    if (name === "wood") {
      for (const [cx, cy] of [ [ 0, 0 ], [ N - S, 0 ], [ 0, N - S ], [ N - S, N - S ] ]) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const X = cx + x, Y = cy + y;
        if (!inM(X, Y) || dep(X, Y) > S - 3) continue;
        const ex = Math.min(x, S - 1 - x), ey = Math.min(y, S - 1 - y);
        px.set(X, Y, ex === 0 || ey === 0 ? C.ironHi : C.iron, 1);
      }
      for (const [x, y] of [ [ 3, 3 ], [ N - 4, 3 ], [ 3, N - 5 ], [ N - 4, N - 5 ] ]) {
        px.set(x, y, C.scHi, 1);
        px.set(x + 1, y + 1, C.dk, 1);
      }
      midTop(k => {
        if ((k - S) % 24 === 2) {
          for (const [x, y] of [ [ k, 3 ], [ k, N - 5 ], [ 3, k ], [ N - 5, k ] ]) {
            px.set(x, y, C.sc, 0);
            px.set(x + 1, y + 1, C.dk, 0);
          }
        }
      });
    }
    if (name === "radio") {
      midTop(k => {
        const j = (k - S) % 12;
        if (j < 7) {
          px.set(k, N - 5, C.dk, 0);
          px.set(k, N - 4, C.hi, 0);
        }
        if ((k - S) % 6 === 0) {
          px.set(k, 2, C.hi, 0);
          px.set(k, 3, C.hi, 0);
        }
      });
    }
    if (name === "paper") {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!inM(x, y)) continue;
        const s1 = x + y, s2 = N - 1 - x + y, s3 = x + (N - 1 - y), s4 = N - 1 - x + (N - 1 - y), m = Math.min(s1, s2, s3, s4);
        if (m >= 5 && m <= 10) px.set(x, y, m === 5 ? C.tape : m === 10 ? C.tapeSh : (x * 7 + y * 3) % 11 === 0 ? C.tapeSh : C.tape, 1);
      }
    }
    if (name !== "wood" && name !== "paper" && name !== "note") {
      const sc = C.S >= 8 ? 3 : 1, at = name === "steel" ? [ [ N - 1 - sc - 2, sc ], [ sc, N - 2 - sc - 2 ] ] : [ [ sc, sc ], [ N - 1 - sc - 2, sc ], [ sc, N - 2 - sc - 2 ], [ N - 1 - sc - 2, N - 2 - sc - 2 ] ];
      for (const [x0, y0] of at) {
        if (C.S < 8) {
          px.set(x0 + 1, y0 + 1, C.scHi, 1);
          continue;
        }
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) px.set(x0 + x, y0 + y, x === 0 && y === 0 ? C.scHi : x === 1 && y === 1 ? C.sh : C.sc, 0);
        px.set(x0 + 3, y0 + 1, C.dk, 0);
        px.set(x0 + 3, y0 + 2, C.dk, 0);
        px.set(x0 + 1, y0 + 3, C.dk, 0);
        px.set(x0 + 2, y0 + 3, C.dk, 0);
      }
    }
    if (name === "note") {
      for (const [x, y] of [ [ 3, 3 ], [ N - 5, 3 ], [ 3, N - 6 ], [ N - 5, N - 6 ] ]) {
        px.set(x, y, C.scHi, 1);
        px.set(x + 1, y, C.sc, 1);
        px.set(x, y + 1, C.sc, 1);
        px.set(x + 1, y + 1, C.dk, 1);
      }
    }
    const edge = (x, y) => outer(x - 1, y) || outer(x + 1, y) || outer(x, y - 1) || outer(x, y + 1) || outer(x, y + 2) && !outer(x, y + 1);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inM(x, y) || edge(x, y) || px.mat(x, y) !== 0) continue;
      const d = dep(x, y), s = side(x, y);
      if (d >= S - 2) {
        px.set(x, y, s === 0 || s === 1 ? C.dk : C.lt, 0);
        continue;
      }
      if (inM(x, y - 1) && edge(x, y - 1)) px.set(x, y, C.hi, 0); else if (inM(x - 1, y) && edge(x - 1, y)) px.set(x, y, C.lt, 0); else if (inM(x + 1, y) && edge(x + 1, y)) px.set(x, y, C.sh, 0); else if (inM(x, y + 1) && edge(x, y + 1)) px.set(x, y, C.dk, 0);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (inM(x, y) && edge(x, y)) px.set(x, y, px.mat(x, y) === 1 ? C.o1 || C.out : C.out);
    }
    return px.put(ART.mk(N, N));
  };
  U.clipPaint = function() {
    const W = 26, H = 12, px = new Pix(W, H), C = {
      out: "#14161a",
      dk: "#2a2e35",
      sh: "#454b55",
      base: "#6b7380",
      hi: "#9aa3b0",
      hole: "#14161a"
    };
    const inC = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (y >= 4 ? x >= 1 && x <= W - 2 : x >= 6 && x <= W - 7);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inC(x, y)) continue;
      px.set(x, y, y === 4 || y < 4 && x === 6 ? C.hi : y >= H - 4 ? C.sh : C.base);
    }
    for (let x = 10; x < 16; x++) px.set(x, 1, C.dk);
    const outer = (x, y) => !inC(x, y);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inC(x, y)) continue;
      if (outer(x - 1, y) || outer(x + 1, y) || outer(x, y - 1) || outer(x, y + 1) || outer(x, y + 2) && !outer(x, y + 1)) px.set(x, y, C.out);
    }
    return px.put(ART.mk(W, H));
  };
  function skinInit() {
    const st = document.documentElement.style;
    try {
      for (const k of Object.keys(CASE)) st.setProperty("--csi-" + k, 'url("' + U.casePaint(k).toDataURL() + '")');
      st.setProperty("--csi-clip", 'url("' + U.clipPaint().toDataURL() + '")');
    } catch (e) {
      console.error(e);
    }
  }
  skinInit();
  U.skinWin = function(kind) {
    const w = panel.firstElementChild;
    if (w && w.classList.contains("win") && !w.dataset.cs) w.dataset.cs = CASE_OF[kind] || "metal";
    if (w && w.classList.contains("win") && U.mkWin) U.mkWin(kind, w);
  };
  U.termDeco = function() {
    const t = panel.querySelector(".term");
    if (!t || t.querySelector(".rigArt")) return;
    const cv = document.createElement("canvas");
    cv.className = "rigArt";
    cv.setAttribute("aria-hidden", "true");
    t.insertBefore(cv, t.firstChild);
    let key = "";
    const fit = () => {
      if (!t.isConnected) return;
      const u = unitOf(t), b = parseFloat(getComputedStyle(t).borderLeftWidth) || 0, W = Math.floor(t.offsetWidth / u), H = Math.floor(t.offsetHeight / u), s = t.querySelector(".scr");
      if (W < 30 || H < 30 || !s) return;
      const hole = {
        x: Math.round((s.offsetLeft + b) / u),
        y: Math.round((s.offsetTop + b) / u),
        w: Math.round(s.offsetWidth / u),
        h: Math.round(s.offsetHeight / u)
      };
      const k = [ W, H, u, hole.x, hole.y, hole.w, hole.h ].join(",");
      if (k === key) return;
      key = k;
      U.rigPaint(cv, W, H, hole, {
        screw: 4
      });
      cv.style.width = W * u + "px";
      cv.style.height = H * u + "px";
      cv.style.left = -b + "px";
      cv.style.top = -b + "px";
    };
    fit();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!t.isConnected) {
          ro.disconnect();
          return;
        }
        fit();
      });
      ro.observe(t);
    }
  };
  let tSkyT = 0;
  U.titleSky = function() {
    const tl = $("title");
    if (!tl || tSkyT || tl.classList.contains("hidden")) return;
    let cv = tl.querySelector(".gateSky");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.className = "gateSky";
      cv.setAttribute("aria-hidden", "true");
      tl.insertBefore(cv, tl.firstChild);
    }
    let b = null, key = "", t = 0;
    const tick = () => {
      if (tl.classList.contains("hidden") || !cv.isConnected) {
        clearInterval(tSkyT);
        tSkyT = 0;
        return;
      }
      const u = unitOf(tl), W = Math.ceil(innerWidth / u), H = Math.max(48, Math.min(260, Math.round(innerHeight * .42 / u))), k = W + "x" + H + "@" + u;
      if (k !== key) {
        key = k;
        b = skyBase(W, H);
        cv.width = W;
        cv.height = H;
        cv.style.width = W * u + "px";
        cv.style.height = H * u + "px";
      }
      const x = cv.getContext("2d");
      x.clearRect(0, 0, W, H);
      x.drawImage(b.c, 0, 0);
      skyLive(x, b, t++);
    };
    tick();
    tSkyT = setInterval(tick, 350);
  };
  U.titleSkyOn = () => !!tSkyT;
  if ($("title")) new MutationObserver(() => {
    if (!$("title").classList.contains("hidden")) U.titleSky();
  }).observe($("title"), {
    attributes: true,
    attributeFilter: [ "class" ]
  });
  U.openCoop = function() {
    U.open("coop", `<div class="win wM coopWin">${header("같이 하기 · 파티")}<div class="body col" id="coopBody"></div></div>`);
    renderCoop();
  };
  U.coopDirty = () => {
    if (U.panelKind === "coop") renderCoop(); else if (U.panelKind === "queue") renderQueue();
  };
  U.openQueue = function() {
    U.open("queue", `<div class="win" style="width:460px">${header("매칭 대기")}<div class="body col" id="queueBody"></div></div>`);
    renderQueue();
  };
  function renderQueue() {
    const body = $("queueBody");
    if (!body) return;
    const C = SX.coop, q = C && C.q;
    if (!q) {
      body.innerHTML = `<p>대기 중이 아닙니다.</p>`;
      return;
    }
    const b = D.buildings.find(x => x.id === q.b);
    const left = Math.max(0, (q.max || 45) - (q.waited || 0));
    const solo = q.solo != null ? !!q.solo : !!(SX.soloMap && SX.soloMap(b));
    body.innerHTML = `<div class="box col">\n        <h3><span>${q.free ? "🎒 마지막 희망 판 · " : ""}${esc(b ? b.name : q.b)} · ${q.tod === "night" ? "밤" : "낮"}</span><span class="small">${q.waited || 0}초 기다림</span></h3>\n        ${q.mode === "fire" ? `<p class="small"><b class="warn">🔥 화재 판 — 옥상에서 들어가 지하 주차장으로 나갑니다</b></p>` : q.mode === "flood" ? `<p class="small"><b class="warn">🌊 침수 판 — 물이 아래부터 차오릅니다 · 위층 · 옥상으로 나갑니다</b></p>` : q.mode === "nos" ? `<p class="small"><b class="warn">🔫 약탈자 없는 판 — 감염체만 나옵니다</b></p>` : q.mode === "noz" ? `<p class="small"><b class="warn">🧟 좀비 없는 판 — 약탈자만 나옵니다</b></p>` : ""}\n        ${solo ? `<p id="queueState">파티원을 기다리고 있습니다 · 지금 ${q.players || 1}명<br><span class="small">${left}초 안에 출발합니다</span></p>\n        <p class="small">단층 지도라 <b>다른 생존자는 들어오지 않습니다</b> — 우리 파티만 들어갑니다.</p>` : `<p id="queueState">${q.startIn != null ? `<b class="good">${q.teams}팀 ${q.players}명 모였습니다 — ${q.startIn}초 뒤 출발</b>` : `같은 곳을 고른 사람을 기다리고 있습니다 · 지금 ${q.teams || 1}팀 ${q.players || 1}명<br><span class="small">아무도 안 오면 ${left}초 뒤 우리끼리 출발</span>`}</p>\n        <p class="small">다른 팀은 <b>적</b>입니다 — 사람을 조심하십시오. 같은 파티는 서로 안 맞습니다.</p>`}\n      </div>`;
    const row = document.createElement("div");
    row.className = "row";
    row.style.gap = "6px";
    if (q.host) {
      const now = document.createElement("button");
      now.id = "queueNow";
      now.textContent = "바로 출격";
      now.className = "big";
      now.style.flex = "1";
      if (q.nowOk === false && !solo) {
        now.disabled = true;
        now.textContent = "바로 출격 막힘 — 지금 서버 " + (q.online | 0) + "명(" + (q.nowMax | 0 || 50) + "명 이상)";
        now.dataset.tip = "사람이 많을 때는 같은 곳을 고른 사람과 함께 들어갑니다(최대 45초)";
      }
      now.onclick = () => {
        SX.audio.play("click");
        C.qnow();
      };
      const cancel = document.createElement("button");
      cancel.id = "queueCancel";
      cancel.textContent = "취소";
      cancel.style.flex = "1";
      cancel.onclick = () => {
        SX.audio.play("click");
        C.unqueue();
        U.closePanel();
      };
      row.append(now, cancel);
    } else {
      const out = document.createElement("button");
      out.id = "queueOut";
      out.textContent = "이번엔 빠지기";
      out.style.flex = "1";
      out.onclick = () => {
        SX.audio.play("click");
        C.unqueue();
        U.closePanel();
      };
      row.append(out);
    }
    body.appendChild(row);
  }
  function renderCoop() {
    const body = $("coopBody");
    if (!body) return;
    const C = SX.coop;
    body.innerHTML = "";
    if (!SX.net || !SX.net.on()) {
      const note = document.createElement("p");
      note.className = "small";
      note.textContent = "같이 하기는 계정이 있어야 합니다 — 로그인하면 바로 방을 만들 수 있습니다.";
      body.append(note, loginBox(() => U.openCoop(), "acct"));
      return;
    }
    const box = document.createElement("div");
    box.className = "box col";
    if (C.state === "in") {
      const rows = [ `<li><b data-notr>${esc(C.nameOf(C.id))}</b> (나)${C.isHost() ? " · 파티장" : ""}</li>` ];
      for (const q of C.peers.values()) rows.push(`<li><span data-notr>${esc(q.name)}</span>${q.id === C.host ? " · 파티장" : ""}</li>`);
      box.innerHTML = `<h3><span>방 코드 ${U.qm("친구에게 이 네 글자를 알려 주십시오.<br>파티는 3명까지 · 한 판에 4팀까지입니다(팀마다 다른 출입구에서 시작 — 다른 팀은 적).")}</span></h3>\n        <div id="coopCode" style="font-size:calc(var(--u)*20);letter-spacing:calc(var(--u)*4);text-align:center;color:var(--brand);margin:6px 0">${esc(C.room)}</div>\n        <p class="small">${C.isHost() ? "<b>파티장</b> — 출격 지도에서 출격을 누르면 거점에 있는 파티원이 같은 팀으로 같이 들어갑니다." : "<b>파티원</b> — 파티장이 출격을 누르면 거점에 있을 때 저절로 같이 갑니다."}</p>\n        <h3 style="margin-top:8px"><span>파티 ${C.peers.size + 1}명 ${U.qm("판 안에서: 파티원은 같은 팀 — 서로 보이고(이름표) · <b>서로 안 맞습니다</b>.<br>같은 곳을 고른 <b>다른 파티는 적</b> — 쏘면 맞고, 쓰러뜨리면 짐을 챙길 수 있습니다(층이 하나뿐인 단층 지도엔 다른 파티가 들어오지 않습니다).<br>상자는 먼저 꺼낸 사람이 가집니다.")}</span></h3><ul style="margin:0 0 6px 18px;padding:0">${rows.join("")}</ul>`;
      const out = document.createElement("button");
      out.id = "coopLeave";
      out.textContent = "파티 나가기";
      out.disabled = SX.game.inRaid();
      out.onclick = () => {
        SX.coop.leave();
        renderCoop();
      };
      box.appendChild(out);
    } else {
      box.innerHTML = `<h3><span>파티 ${U.qm("친구와 <b>같은 팀</b>으로 가려면 한 사람이 파티를 만들고 나머지가 그 코드로 들어옵니다.<br>파티 없이 출격하면 혼자 매칭에 섭니다 — 같은 곳을 고른 <b>다른 사람은 적</b>입니다(층이 하나뿐인 단층 지도엔 다른 사람이 들어오지 않습니다).<br>인터넷 친구는 <b>실행 › 인터넷 친구랑 같이 하기.bat</b> 창의 <b>도트판</b> 주소로 들어옵니다.")}</span><span class="small">같은 파티 = 같은 팀</span></h3>`;
      const mk = document.createElement("button");
      mk.id = "coopMake";
      mk.textContent = "파티 만들기";
      mk.className = "big";
      mk.disabled = C.state === "connecting";
      mk.onclick = () => {
        SX.audio.play("click");
        SX.coop.connect("");
        renderCoop();
      };
      const row = document.createElement("div");
      row.className = "row";
      row.style.cssText = "gap:6px;margin-top:8px";
      const inp = document.createElement("input");
      inp.id = "coopCodeIn";
      inp.placeholder = "방 코드 4글자";
      inp.maxLength = 4;
      inp.style.cssText = "flex:1;text-transform:uppercase";
      const jn = document.createElement("button");
      jn.id = "coopJoin";
      jn.textContent = "들어가기";
      jn.disabled = C.state === "connecting";
      const go = () => {
        const v = inp.value.trim();
        if (v.length !== 4) {
          SX.audio.play("denied");
          C.msg = "방 코드는 네 글자";
          renderCoop();
          return;
        }
        SX.audio.play("click");
        SX.coop.connect(v);
        renderCoop();
      };
      jn.onclick = go;
      inp.onkeydown = e => {
        if (e.key === "Enter") go();
      };
      row.append(inp, jn);
      box.append(mk, row);
    }
    if (C.msg) {
      const m = document.createElement("p");
      m.className = "small";
      m.id = "coopMsg";
      m.textContent = C.msg;
      box.appendChild(m);
    }
    body.appendChild(box);
    if (SX.friends && SX.friends.open) {
      const fb = document.createElement("button");
      fb.id = "coopFriends";
      fb.className = "coopFriends";
      const n = SX.friends.inN();
      fb.textContent = n ? "친구 목록 · 받은 요청 " + n : "친구 목록";
      fb.onclick = () => SX.friends.open();
      body.appendChild(fb);
    }
  }
  let rangeSlot = "w1", rangeTab = "gun";
  const RANGE_TABS = [ [ "gun", "총 · 파츠" ], [ "melee", "근접 무기" ], [ "ammo", "탄 종류" ], [ "target", "표적" ] ];
  const GUN_CLS_KO = {
    pistol: "권총",
    revolver: "리볼버",
    smg: "기관단총",
    rifle: "소총",
    lmg: "기관총",
    sniper: "저격총",
    shotgun: "산탄총"
  };
  U.openRange = function() {
    const p = A.player;
    if (p && (p.slot === "w1" || p.slot === "w2")) rangeSlot = p.slot;
    U.open("range", `<div class="win rangeWin" id="rangeWin">${header("사격장 관리대 — 무기 · 탄 고르기")}<div class="tabs" id="rangeTabs">${RANGE_TABS.map(([k, n]) => `<button data-rt="${k}">${n}</button>`).join("")}</div><div class="body col" id="rangeBody"></div></div>`);
    $("rangeTabs").onclick = e => {
      const b = e.target.closest("[data-rt]");
      if (!b || b.dataset.rt === rangeTab) return;
      rangeTab = b.dataset.rt;
      SX.audio.play("click");
      renderRange();
    };
    renderRange();
    fitRange();
  };
  let rangeSecH = 0;
  function fitRange() {
    const win = $("rangeWin");
    if (!win) return;
    win.style.minHeight = "";
    rangeSecH = 0;
    let h = 0, mh = 0;
    const t0 = rangeTab;
    const meas = pv => {
      renderRange(pv);
      if (SX.trDom) SX.trDom(win);
      h = Math.max(h, win.offsetHeight);
      const m = win.querySelector(".rgSec");
      if (m) mh = Math.max(mh, m.offsetHeight);
    };
    for (const [t] of RANGE_TABS) {
      rangeTab = t;
      if (t === "gun") for (const d of D.guns) meas(I.mk(d.name)); else if (t === "melee") for (const d of D.melee) meas(I.mk(d.name)); else meas();
    }
    rangeTab = t0;
    rangeSecH = mh;
    renderRange();
    if (SX.trDom) SX.trDom(win);
    win.style.minHeight = Math.min(h, Math.floor(innerHeight * .97)) + "px";
  }
  addEventListener("resize", () => {
    if (U.panelKind === "range") fitRange();
  });
  function rangeEquip(fn) {
    const p = A.player;
    fn();
    if (p) {
      p.reload = null;
      if (SX.game.kit[rangeSlot]) p.slot = rangeSlot;
    }
    SX.audio.play("reload", {
      vol: .5
    });
    renderRange();
    U.hudDirty();
  }
  function renderRange(preview) {
    const body = $("rangeBody");
    if (!body) return;
    const G = SX.game, kit = G.kit, r = G.save.range || {
      best: 0,
      hits: 0
    }, p0 = A.player;
    {
      const tb = $("rangeTabs");
      if (tb) for (const b of tb.children) b.classList.toggle("on", b.dataset.rt === rangeTab);
    }
    body.innerHTML = "";
    const top = document.createElement("div");
    top.className = "row rgTop";
    for (const [sl, n] of [ [ "w1", "주무기" ], [ "w2", "보조무기" ], [ "melee", "근접 무기" ] ]) {
      const on = rangeTab === "melee" ? sl === "melee" : rangeTab === "gun" ? rangeSlot === sl : !!p0 && p0.slot === sl;
      const b = document.createElement("button");
      b.className = "rgSlot" + (on ? " on" : "");
      b.dataset.slot = sl;
      b.innerHTML = `${n} <span class="small">${kit[sl] ? esc(kit[sl].name) : sl === "melee" ? "맨손" : "비었습니다"}</span>`;
      b.onclick = () => {
        if (sl === "melee") rangeTab = "melee"; else {
          rangeSlot = sl;
          if (rangeTab === "melee") rangeTab = "gun";
        }
        const p = A.player;
        if (p && (kit[sl] || sl === "melee")) {
          p.slot = sl;
          p.reload = null;
          p.autoRl = null;
        }
        SX.audio.play("click");
        renderRange();
        U.hudDirty();
      };
      top.appendChild(b);
    }
    const rec = document.createElement("span");
    rec.className = "small rgRec";
    rec.innerHTML = `맞힌 횟수 <b>${r.hits || 0}</b> · 가장 먼 표적 <b>${r.best || 0}m</b>`;
    top.appendChild(rec);
    body.appendChild(top);
    const sec = document.createElement("div");
    sec.className = "col rgSec";
    sec.dataset.tab = rangeTab;
    if (rangeSecH) sec.style.minHeight = rangeSecH + "px";
    body.appendChild(sec);
    if (rangeTab === "melee") rangeMeleeSec(sec, preview); else if (rangeTab === "ammo") rangeAmmoSec(sec); else if (rangeTab === "target") rangeTargetSec(sec); else rangeGunSec(sec, preview);
    rangeFoot(body);
  }
  function rangeGunSec(body, preview) {
    const kit = SX.game.kit, g = preview || (kit[rangeSlot] && kit[rangeSlot].kind === "gun" ? kit[rangeSlot] : null);
    const main = document.createElement("div");
    main.className = "row rgMain";
    const list = document.createElement("div");
    list.className = "rgGuns";
    for (const d of D.guns) {
      const c = document.createElement("div");
      c.className = "rgGun" + (g && g.name === d.name ? " on" : "");
      c.dataset.gun = d.name;
      c.innerHTML = `<span class="picn"></span><span class="pnm">${esc(d.name)}<br><span class="small">${GUN_CLS_KO[d.cls] || ""} · ${esc(d.caliber)} · ${d.magSize}발</span></span>`;
      c.querySelector(".picn").appendChild(iconCanvas(I.mk(d.name)));
      c.onclick = () => rangeEquip(() => {
        const n = I.mk(d.name);
        n.ammo = n.magSize;
        kit[rangeSlot] = n;
      });
      list.appendChild(c);
    }
    const mid = document.createElement("div");
    mid.className = "col rgParts";
    const side = document.createElement("div");
    side.className = "col rgSide";
    if (!g) {
      mid.innerHTML = `<p class="small">왼쪽에서 총을 고르면 ${rangeSlot === "w1" ? "주무기" : "보조무기"} 자리에 들어갑니다.</p>`;
    } else {
      const slots = SX.partSlots(g);
      if (!slots.length) {
        const n = document.createElement("p");
        n.className = "small";
        n.textContent = "이 총엔 파츠를 달 자리가 없습니다";
        mid.appendChild(n);
      }
      const chip = (name, pd, on, fn) => {
        const c = document.createElement("button");
        c.className = "rgOpt" + (on ? " on" : "");
        c.dataset.part = pd ? pd.name : "";
        c.title = pd ? U.partFxText(pd) : "파츠 없이";
        if (pd) {
          const i = document.createElement("span");
          i.className = "picn";
          i.appendChild(iconCanvas(I.mk(pd.name)));
          c.appendChild(i);
        }
        c.appendChild(document.createTextNode(name));
        c.onclick = fn;
        return c;
      };
      for (const sl of slots) {
        const cur = g.mods && g.mods[sl];
        const box = document.createElement("div");
        box.className = "rgSlotRow";
        box.dataset.slot = sl;
        box.innerHTML = `<b class="plab">${esc(SX.PART_SLOT_NAMES[sl])}</b>`;
        const opts = document.createElement("div");
        opts.className = "rgOpts";
        opts.appendChild(chip("없음", null, !cur, () => rangeEquip(() => {
          I.detach(g, sl);
          g.ammo = g.magSize;
        })));
        for (const pd of D.parts) if (pd.slot === sl && SX.partFits(pd, g)) opts.appendChild(chip(pd.name, pd, !!cur && cur.name === pd.name, () => rangeEquip(() => {
          I.attach(g, I.mk(pd.name));
          g.ammo = g.magSize;
        })));
        box.appendChild(opts);
        const fx = document.createElement("div");
        fx.className = "small rgFx";
        fx.textContent = cur ? U.partFxText(cur) : "—";
        {
          const now = fx.textContent, alt = new Set([ "—" ]);
          for (const pd of D.parts) if (pd.slot === sl && SX.partFits(pd, g)) alt.add(U.partFxText(pd));
          alt.delete(now);
          fx.textContent = "";
          const sn = document.createElement("span");
          sn.textContent = now;
          fx.appendChild(sn);
          for (const t of alt) {
            const s = document.createElement("span");
            s.className = "fxAlt";
            s.setAttribute("aria-hidden", "true");
            s.textContent = t;
            fx.appendChild(s);
          }
        }
        box.appendChild(fx);
        mid.appendChild(box);
      }
      const wp = ART.weapon(g);
      side.appendChild(bigCanvas(wp ? wp.c : ART.icon(Object.assign({}, g, {
        rot: false
      })), 280, 96));
      const t = document.createElement("div");
      t.innerHTML = gunStatsHtml(g);
      side.appendChild(t);
    }
    main.append(list, mid, side);
    body.appendChild(main);
  }
  function rangeMeleeSec(body, preview) {
    const kit = SX.game.kit, cur = preview || kit.melee || null, ME = SX.melee;
    const main = document.createElement("div");
    main.className = "row rgMain";
    const list = document.createElement("div");
    list.className = "rgGuns rgMelee";
    for (const d of D.melee) {
      const c = document.createElement("div");
      c.className = "rgGun" + (cur && cur.name === d.name ? " on" : "");
      c.dataset.melee = d.name;
      c.innerHTML = `<span class="picn"></span><span class="pnm">${esc(d.name)}<br><span class="small">${ME && ME.label(d) || "근접"} · 피해 ${d.dmg}</span></span>`;
      c.querySelector(".picn").appendChild(iconCanvas(I.mk(d.name)));
      c.onclick = () => {
        kit.melee = I.mk(d.name);
        const p = A.player;
        if (p) {
          p.reload = null;
          p.autoRl = null;
          p.slot = "melee";
        }
        SX.audio.play("weaponSwap");
        renderRange();
        U.hudDirty();
      };
      list.appendChild(c);
    }
    const side = document.createElement("div");
    side.className = "col rgSide";
    if (cur) {
      side.appendChild(bigCanvas(ART.icon(Object.assign({}, cur, {
        rot: false
      })), 280, 96));
      const t = document.createElement("table");
      t.className = "pstat";
      t.innerHTML = [ [ "나눔", ME && ME.label(cur) || "근접" ], [ "피해", cur.dmg ], [ "다시 치기", (cur.cool || .6).toFixed(2) + "초" ], [ "초당 피해", Math.round(cur.dmg / (cur.cool || .6)) ] ].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("");
      side.appendChild(t);
    } else {
      const n = document.createElement("p");
      n.className = "small";
      n.textContent = "왼쪽에서 고르면 근접 무기 자리에 들어갑니다.";
      side.appendChild(n);
    }
    main.append(list, side);
    body.appendChild(main);
  }
  function ammoFx(cal, at) {
    const T = at && SX.AMMO_TYPES[at];
    if (!T) return "보통 피해 · 보통 방탄 뚫기";
    if (at === "hp" && cal === "12게이지") return "알갱이 대신 한 덩어리 · 더 멀리 갑니다(사거리 " + SX.SLUG.range + "칸)";
    return at === "ap" ? "방탄 뚫는 힘 +1 · 방탄 없는 몸 " + Math.round(T.dmg * 100) + "%" : "방탄 없는 몸 " + Math.round(T.dmg * 100) + "% · 방탄 뚫는 힘 −1";
  }
  function rangeAmmoSec(body) {
    const kit = SX.game.kit;
    for (const [sl, n] of [ [ "w1", "주무기" ], [ "w2", "보조무기" ] ]) {
      const g = kit[sl] && kit[sl].kind === "gun" ? kit[sl] : null, at0 = g ? I.typeOf(g) : null;
      const box = document.createElement("div");
      box.className = "rgSlotRow";
      box.dataset.slot = sl;
      box.innerHTML = `<b class="plab">${n} <span class="small">${g ? esc(g.name) + " · " + esc(g.caliber) : "비었습니다"}</span></b>`;
      const opts = document.createElement("div");
      opts.className = "rgOpts";
      for (const at of [ "", "ap", "hp" ]) {
        const cal = g ? g.caliber : "9mm", T = SX.AMMO_TYPES[at], tag = SX.ammoTypeTag(cal, at);
        const c = document.createElement("button");
        c.className = "rgOpt" + (at0 === at ? " on" : "");
        c.dataset.at = at;
        c.disabled = !g;
        c.title = ammoFx(cal, at);
        if (tag) {
          const t = document.createElement("span");
          t.className = "rgTag";
          t.textContent = tag;
          t.style.background = T.col;
          t.style.color = T.ink;
          c.appendChild(t);
        }
        c.appendChild(document.createTextNode(SX.ammoTypeName(cal, at)));
        c.onclick = () => {
          if (!g) return;
          I.setType(g, at);
          g.ammo = g.magSize;
          rangeSlot = sl;
          const p = A.player;
          if (p) {
            p.reload = null;
            p.autoRl = null;
            p.slot = sl;
          }
          SX.audio.play("reload", {
            vol: .5
          });
          renderRange();
          U.hudDirty();
        };
        opts.appendChild(c);
      }
      box.appendChild(opts);
      const fx = document.createElement("div");
      fx.className = "small rgFx";
      fx.textContent = g ? ammoFx(g.caliber, at0) : "「총 · 파츠」에서 총을 고르면 탄을 바꿀 수 있습니다";
      box.appendChild(fx);
      body.appendChild(box);
    }
  }
  function rangeTargetSec(body) {
    const Hb = SX.hub, Fl = Hb.level && Hb.scene === "range" ? Hb.floor() : null;
    for (const [kind, key, slot, title] of [ [ "armor", "rangeVest", "vest", "표적 방탄복" ], [ "helmet", "rangeHelm", "helm", "표적 방탄모" ] ]) {
      const vrow = document.createElement("div");
      vrow.className = "row rgVest";
      const vl = document.createElement("span");
      vl.className = "small";
      vl.innerHTML = "<b>" + title + "</b>";
      vrow.appendChild(vl);
      for (const nm of [ null ].concat((SX.ARMORS || []).filter(d => d.kind === kind).map(d => d.name))) {
        const b = document.createElement("button");
        b.className = "rgSlot" + ((Hb[key] || null) === nm ? " on" : "");
        const d = nm && I.def(nm);
        b.innerHTML = nm ? `${esc(nm)} <span class="small">${d.cls}등급</span>` : "없음";
        b.onclick = () => {
          Hb[key] = nm;
          if (Fl) for (const t of Fl.targets || []) t.target[slot] = null;
          SX.audio.play("click");
          renderRange();
        };
        vrow.appendChild(b);
      }
      if (Hb[key]) {
        const nb = document.createElement("button");
        nb.textContent = "새로 입히기";
        nb.onclick = () => {
          if (Fl) for (const t of Fl.targets || []) t.target[slot] = null;
          SX.audio.play("rustle");
          renderRange();
        };
        vrow.appendChild(nb);
        const st = document.createElement("span");
        st.className = "small rgVestSt";
        st.textContent = "남은 방탄 " + (Fl ? (Fl.targets || []).map(t => t.target.dist + "m " + (t.target[slot] ? Math.round(t.target[slot].armor) : I.def(Hb[key]).armor)).join(" · ") : "") + " · 8초 안 맞으면 새것";
        vrow.appendChild(st);
      } else {
        const d0 = (SX.ARMORS || []).find(d => d.kind === kind), nb = document.createElement("button");
        nb.textContent = "새로 입히기";
        nb.tabIndex = -1;
        nb.style.visibility = "hidden";
        vrow.appendChild(nb);
        const st = document.createElement("span");
        st.className = "small rgVestSt";
        st.style.visibility = "hidden";
        st.setAttribute("aria-hidden", "true");
        st.textContent = "남은 방탄 " + (Fl && d0 ? (Fl.targets || []).map(t => t.target.dist + "m " + I.def(d0.name).armor).join(" · ") : "") + " · 8초 안 맞으면 새것";
        vrow.appendChild(st);
      }
      body.appendChild(vrow);
    }
  }
  function rangeFoot(body) {
    const G = SX.game;
    if (SX.extra && SX.extra.range) SX.extra.range(body, renderRange);
    const foot = document.createElement("div");
    foot.className = "row rgFoot";
    const note = document.createElement("p");
    note.className = "small";
    note.innerHTML = `♾ 예비탄 무한 · 🚪 나가면 장비가 돌아갑니다 ${U.qm(`예비탄은 무한 — 탄창이 비면 저절로 장전합니다(<b>[${esc(SX.label("reload"))}]</b> 로도 장전합니다).<br><b>나가면 장비가 들어올 때로 돌아갑니다</b> — 여기서 고른 총 · 파츠 · 근접 무기 · 탄은 못 가지고 나갑니다.`)}`;
    const back = document.createElement("button");
    back.textContent = "들고 온 장비로 되돌리기";
    back.disabled = !SX.hub.rangeKit;
    back.onclick = () => rangeEquip(() => {
      const k = I.kitFrom(SX.hub.rangeKit);
      G.kit = G.save.kit = k;
      if (A.player) A.player.kit = k;
    });
    foot.append(note, back);
    body.appendChild(foot);
  }
  function mercPortrait(m, scale) {
    scale = scale || 2;
    const A = SX.actors, W = 46, H = 48;
    const spec = A.mercSpec(m), gun = A.mercGun(m), mel = A.mercMelee(m), weapon = gun || mel;
    const c = ART.mk(W, H), x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    const px = Math.round(W / 2), py = H - 4;
    x.fillStyle = "rgba(0,0,0,0.28)";
    x.beginPath();
    x.ellipse(px, py - 1, 9, 3, 0, 0, Math.PI * 2);
    x.fill();
    const spr = ART.char(spec, 1, 0);
    x.drawImage(spr, px - ART.CHAR_OX, py - ART.CHAR_OY);
    const wp = weapon && ART.weapon(weapon);
    if (wp) {
      x.save();
      x.translate(px + 2, py - 17);
      x.drawImage(wp.c, 4 - wp.gx, -wp.gy);
      x.restore();
    }
    const out = ART.mk(W * scale, H * scale), o = out.getContext("2d");
    o.imageSmoothingEnabled = false;
    o.drawImage(c, 0, 0, W * scale, H * scale);
    out.style.cssText = "image-rendering:pixelated;width:" + W * scale + "px;height:" + H * scale + "px;flex:0 0 auto";
    return out;
  }
  U.openAccount = function() {};
  U.nickAsk = function() {};
  U.netDirty = () => {
    if (U.panelKind === "shop" && shopTab === "free") renderShop();
  };
  U.refreshAll = () => {
    if (U.panelKind === "shop") renderShop(); else if (U.panelKind === "inv") renderInv();
  };
  function loginBox() {
    const d = document.createElement("div");
    d.className = "small";
    d.textContent = "체험판에서는 계정을 쓰지 않습니다.";
    return d;
  }
  let fmFetchAt = 0;
  const FM_CATS = [ [ "all", "전체" ], [ "gun", "무기" ], [ "ammo", "탄" ], [ "parts", "파츠" ], [ "armor", "방어구" ], [ "bag", "가방·리그" ], [ "med", "의약품" ], [ "food", "먹을 것·마실 것" ], [ "throw", "투척물·덫" ], [ "key", "열쇠·금고" ], [ "junk", "잡동사니" ], [ "etc", "기타" ] ];
  const FM_EN = {
    all: "All",
    gun: "Guns",
    ammo: "Ammo",
    parts: "Parts",
    armor: "Armor",
    bag: "Bags · Rigs",
    med: "Medical",
    food: "Food · Drink",
    throw: "Throwables · Traps",
    key: "Keys · Safes",
    junk: "Junk",
    etc: "Other",
    new: "Newest",
    low: "Cheapest",
    high: "Priciest",
    name: "Name",
    mine: "My listings only",
    wish: "★ Wishlist only"
  };
  const FM_SORTS = [ [ "new", "최신" ], [ "low", "싼 값" ], [ "high", "비싼 값" ], [ "name", "이름" ] ];
  const FM_PAGE = 40;
  const fm = {
    q: "",
    cat: "all",
    sort: "new",
    mine: false,
    wish: false,
    n: FM_PAGE
  };
  U.fmReset = () => {
    fm.q = "";
    fm.cat = "all";
    fm.sort = "new";
    fm.mine = false;
    fm.wish = false;
    fm.n = FM_PAGE;
    inputMem.delete("fmq");
  };
  U.fmFind = q => {
    U.fmReset();
    fm.q = String(q || "").slice(0, 40);
    inputMem.set("fmq", fm.q);
  };
  U.fmState = () => Object.assign({}, fm);
  U.fmCatOf = function(l) {
    const n = String(l && l.name || ""), d = I.def(n) || {}, k = l && l.kind || d.kind || "";
    if (k === "gun" || k === "melee") return "gun";
    if (k === "mag" || k === "ammo" || /탄약상자|탄통/.test(n)) return "ammo";
    if (k === "part" || k === "partbox") return "parts";
    if (k === "armor" || k === "helmet" || k === "afix") return "armor";
    if (k === "bag" || k === "rig") return "bag";
    if (k === "heal" || k === "cure") return "med";
    if (SX.needs && SX.needs.of({
      name: n
    })) return "food";
    if (k === "grenade" || k === "trap") return "throw";
    if (k === "key" || k === "vaultkit" || !k && /열쇠|마스터키/.test(n)) return "key";
    if (!k || k === "junk") return "junk";
    return "etc";
  };
  const FM_CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", FM_JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";
  const fmKey = s => String(s || "").toLowerCase().replace(/[\s\-·]+/g, "");
  const fmSyl = c => {
    const v = c ? c.charCodeAt(0) - 44032 : -1;
    return v >= 0 && v < 11172 ? {
      c: Math.floor(v / 588),
      v: Math.floor(v % 588 / 28),
      j: v % 28
    } : null;
  };
  function fmCharOk(q, n, last, next) {
    if (q === n) return true;
    if (!n) return false;
    const ci = FM_CHO.indexOf(q), b = fmSyl(n);
    if (ci >= 0) return !!b && b.c === ci;
    if (!last || !b) return false;
    const a = fmSyl(q);
    if (!a || a.c !== b.c || a.v !== b.v) return false;
    if (!a.j) return true;
    const nx = fmSyl(next);
    return !b.j && !!nx && FM_CHO[nx.c] === FM_JONG[a.j];
  }
  function fmHas(name, q) {
    const n = [ ...name ], m = q.length;
    for (let i = 0; i + m <= n.length; i++) {
      let ok = true;
      for (let j = 0; j < m && ok; j++) ok = fmCharOk(q[j], n[i + j], j === m - 1, n[i + j + 1]);
      if (ok) return true;
    }
    return false;
  }
  U.fmHit = function(l, text) {
    const q = [ ...fmKey(text) ];
    if (!q.length) return true;
    for (const s of [ l.name ].concat(Array.isArray(l.mods) ? l.mods : [])) {
      if (fmHas(fmKey(s), q)) return true;
      if (SX.lang === "en" && fmHas(fmKey(SX.tr(s)), q)) return true;
    }
    return false;
  };
  const fmName = l => SX.lang === "en" ? SX.tr(l.name) : l.name;
  const FM_CMP = {
    new: (a, b) => (b.at || 0) - (a.at || 0),
    low: (a, b) => a.price - b.price || (b.at || 0) - (a.at || 0),
    high: (a, b) => b.price - a.price || (b.at || 0) - (a.at || 0),
    name: (a, b) => fmName(a).localeCompare(fmName(b), SX.lang === "en" ? "en" : "ko") || a.price - b.price
  };
  U.fmFor = function(name) {
    if (!SX.net || !SX.net.on()) return null;
    const L = (SX.net.listings || []).filter(l => !l.mine && l.name === name);
    return L.length ? {
      n: L.length,
      min: Math.min(...L.map(l => l.price))
    } : null;
  };
  function fmChip(cls, key, ko, n, on, click) {
    const b = document.createElement("button");
    b.className = "fmChip " + cls + (on ? " on" : "");
    b.dataset.fm = key;
    b.innerHTML = `<span data-en="${esc(FM_EN[key] || "")}">${esc(ko)}</span>` + (n != null ? ` <b>${n}</b>` : "");
    b.onclick = click;
    return b;
  }
  let fmFit = null;
  addEventListener("resize", () => {
    if (U.panelKind === "shop" && shopTab === "free" && fmFit) requestAnimationFrame(() => fmFit && fmFit());
  });
  function freeMarket() {
    const wrap = document.createElement("div");
    wrap.className = "row";
    wrap.style.cssText = "flex:1;gap:10px";
    if (!SX.net || !SX.net.on()) {
      wrap.classList.add("fmLogin");
      wrap.appendChild(loginBox(null, "acct"));
      return wrap;
    }
    const s = SX.game.save;
    const left = document.createElement("div");
    left.className = "box col";
    left.style.cssText = "flex:1;min-width:46%";
    left.innerHTML = `<h3><span>프리마켓 ${U.qm("수수료 5%입니다.<br>48시간 뒤 안 팔리면 돌아옵니다.")}</span><span class="small">${esc(SX.net.name() || "")}</span></h3>`;
    const bar = document.createElement("div");
    bar.className = "row fmBar";
    const qi = document.createElement("input");
    qi.type = "text";
    qi.className = "fmQ";
    qi.maxLength = 40;
    qi.placeholder = "물건 이름으로 찾기";
    qi.spellcheck = false;
    qi.autocomplete = "off";
    qi.dataset.keep = "fmq";
    qi.value = fm.q;
    const qx = document.createElement("button");
    qx.className = "fmChip fmClr";
    qx.textContent = "✕";
    qx.title = "찾는 말 지우기";
    const togs = document.createElement("span");
    togs.className = "row fmTogs";
    bar.append(qi, qx, togs);
    const cats = document.createElement("div");
    cats.className = "row fmBar fmCats";
    const sorts = document.createElement("div");
    sorts.className = "row fmBar fmSorts";
    left.append(bar, cats, sorts);
    const LW = scrollBox("fmList", "46vh");
    const L = document.createElement("div");
    L.className = "list alignList fmList";
    L.style.flex = "1";
    LW.appendChild(L);
    left.appendChild(LW);
    const foot = document.createElement("div");
    foot.className = "row";
    foot.style.cssText = "gap:6px;margin-top:6px";
    const rf = document.createElement("button");
    rf.textContent = "새로 고침";
    rf.onclick = async () => {
      fmFetchAt = Date.now();
      await SX.net.market();
      renderShop();
    };
    const sy = document.createElement("button");
    sy.textContent = "판 대금 받기";
    sy.onclick = async () => {
      await SX.net.sync();
      renderShop();
    };
    const lo = document.createElement("button");
    lo.textContent = "로그아웃";
    lo.onclick = async () => {
      await SX.net.logout();
      renderShop();
    };
    foot.append(rf, sy, lo);
    left.appendChild(foot);
    let RW = null, RB = null;
    const fitCols = () => {
      const bd = $("shopBody");
      if (!bd || !wrap.isConnected) return;
      const bot = bd.getBoundingClientRect().bottom - parseFloat(getComputedStyle(bd).paddingBottom) - bd.scrollTop;
      for (const [w, box, after] of [ [ LW, left, foot ], [ RW, RB, null ] ]) {
        if (!w) continue;
        const cs = getComputedStyle(box), below = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) + (after ? after.offsetHeight + parseFloat(getComputedStyle(after).marginTop) + (parseFloat(cs.rowGap) || 0) : 0);
        w.dataset.mh = Math.max(cellPx() * 4, Math.floor(bot - w.getBoundingClientRect().top - below)) + "px";
      }
      U.fitScroll(wrap);
    };
    const changed = () => {
      fm.n = FM_PAGE;
      LW.scrollTop = 0;
      fill();
    };
    const T = SX.trade;
    const fill = () => {
      L.innerHTML = "";
      cats.innerHTML = "";
      sorts.innerHTML = "";
      togs.innerHTML = "";
      const list = SX.net.listings || [];
      const wishOn = l => !!(T && T.wished(s, l.name));
      const catOf = new Map(list.map(l => [ l, U.fmCatOf(l) ]));
      const hit = list.filter(l => U.fmHit(l, fm.q));
      const base = hit.filter(l => (!fm.mine || l.mine) && (!fm.wish || wishOn(l)));
      const cnt = {
        all: base.length
      };
      for (const l of base) {
        const c = catOf.get(l);
        cnt[c] = (cnt[c] || 0) + 1;
      }
      for (const [k, nm] of FM_CATS) {
        if (k !== "all" && !cnt[k] && fm.cat !== k) continue;
        cats.appendChild(fmChip("fmCat", k, nm, cnt[k] || 0, fm.cat === k, () => {
          fm.cat = k;
          SX.audio.play("click");
          changed();
        }));
      }
      const lb = document.createElement("span");
      lb.className = "fmLbl";
      lb.textContent = "정렬";
      sorts.appendChild(lb);
      for (const [k, nm] of FM_SORTS) sorts.appendChild(fmChip("fmSort", k, nm, null, fm.sort === k, () => {
        fm.sort = k;
        SX.audio.play("click");
        changed();
      }));
      const mineN = hit.filter(l => l.mine).length, wishN = hit.filter(wishOn).length;
      if (mineN || fm.mine) togs.appendChild(fmChip("fmTog", "mine", "내가 올린 것만", mineN, fm.mine, () => {
        fm.mine = !fm.mine;
        SX.audio.play("click");
        changed();
      }));
      if (wishN || fm.wish) togs.appendChild(fmChip("fmTog", "wish", "★ 찜한 것만", wishN, fm.wish, () => {
        fm.wish = !fm.wish;
        SX.audio.play("click");
        changed();
      }));
      qx.disabled = !fm.q;
      if (!list.length) {
        L.innerHTML = `<p class="small">올라온 물건이 없습니다.</p>`;
        fitCols();
        return;
      }
      const shown = (fm.cat === "all" ? base : base.filter(l => catOf.get(l) === fm.cat)).sort(FM_CMP[fm.sort] || FM_CMP.new);
      if (!shown.length) {
        const e = document.createElement("div");
        e.className = "fmNone";
        e.innerHTML = `<p class="small">찾는 물건이 없습니다</p>`;
        const cl = document.createElement("button");
        cl.textContent = "조건 지우기";
        cl.onclick = () => {
          fm.q = "";
          qi.value = "";
          fm.cat = "all";
          fm.mine = false;
          fm.wish = false;
          SX.audio.play("click");
          changed();
        };
        e.appendChild(cl);
        L.appendChild(e);
      }
      for (const l of shown.slice(0, fm.n)) {
        const r = document.createElement("div");
        r.className = "li";
        r.dataset.fmId = l.id;
        const tag = (l.mine ? "내 물건" : `<span class="fmSeller" data-notr>${esc(l.seller || "")}</span>`) + (l.mods && l.mods.length ? " · <span class='good'>파츠: " + esc(l.mods.join(", ")) + "</span>" : "");
        r.innerHTML = `<span class="nm">${esc(l.name)}${l.n > 1 ? " ×" + (l.n | 0) : ""}<br><span class="small">${tag}</span></span><span class="pr">${won(l.price)}</span>`;
        if (!l.mine && T && T.wishable(l.name)) {
          const on = wishOn(l), wb = document.createElement("span");
          wb.className = "wishBtn" + (on ? " on" : "");
          wb.textContent = on ? "★" : "☆";
          wb.setAttribute("role", "button");
          wb.title = on ? "찜 풀기" : "찜하기 — 좌판에 들어오면 알려 드립니다";
          wb.onclick = e => {
            e.stopPropagation();
            if (U.wishToggle(l.name)) renderShop();
          };
          r.insertBefore(wb, r.firstChild);
        }
        const b = document.createElement("button");
        b.textContent = l.mine ? "내리기" : "구매";
        b.onclick = async () => {
          b.disabled = true;
          const res = l.mine ? await SX.net.cancel(l.id) : await SX.net.buy(l.id);
          SX.audio.play(res.ok ? "buy" : "denied");
          renderShop();
        };
        r.appendChild(b);
        L.appendChild(r);
      }
      if (shown.length > fm.n) {
        const mo = document.createElement("button");
        mo.className = "fmMore";
        mo.textContent = "더 보기 (남은 " + (shown.length - fm.n) + "개)";
        mo.onclick = () => {
          fm.n += FM_PAGE;
          SX.audio.play("click");
          fill();
        };
        L.appendChild(mo);
      }
      fitCols();
    };
    qi.oninput = () => {
      fm.q = qi.value.slice(0, 40);
      changed();
    };
    qi.onkeydown = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (qi.value) {
          qi.value = "";
          fm.q = "";
          changed();
        } else qi.blur();
      }
    };
    qx.onclick = () => {
      qi.value = "";
      fm.q = "";
      SX.audio.play("click");
      changed();
      qi.focus();
    };
    fill();
    if (Date.now() - fmFetchAt > 15e3) {
      fmFetchAt = Date.now();
      SX.net.market().then(() => {
        if (L.isConnected) fill();
      });
    }
    const right = document.createElement("div");
    right.className = "box col";
    right.style.flex = "1";
    right.innerHTML = `<h3><span>보관함에서 올리기</span><span class="small">한 번에 10개까지 · ₩1,000 ~ ₩1억</span></h3>`;
    const R = document.createElement("div");
    R.className = "list";
    R.style.flex = "1";
    RW = scrollBox("fmStash", "64vh");
    RW.appendChild(R);
    right.appendChild(RW);
    RB = right;
    const items = (s.stash.list || []).slice().sort((a, b) => (b.it.val || 0) - (a.it.val || 0));
    if (!items.length) R.innerHTML = `<p class="small">보관함이 비었습니다.</p>`;
    for (const e of items) {
      const it = e.it;
      const r = document.createElement("div");
      r.className = "li";
      r.innerHTML = `<span class="nm">${esc(it.name)}${I.isStack(it) ? " ×" + I.qty(it) : ""}<br><span class="small">값 ${won((it.val || 0) * I.qty(it))}${it.quest ? " · 의뢰품(못 올림)" : it.story ? " · 임무 물건(못 올림)" : it.kind === "mag" && !((it.ammo | 0) > 0) ? " · 빈 탄창(못 올림)" : (I.def(it.name) || {}).trash ? " · 쓰레기(못 올림)" : ""}</span></span>`;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "1000";
      inp.step = "1000";
      inp.dataset.keep = "price:" + it.id;
      inp.value = String(Math.max(1e3, SX.worth && SX.trade && SX.trade.isCure && SX.trade.isCure(it.name) ? SX.worth.price(it.name, "med", 0) : Math.round((it.val || 1e3) * I.qty(it) * 1.1 / 100) * 100));
      inp.style.cssText = "width:128px;text-align:right";
      const cureMin = it.name === "증상 억제약" && SX.net.cureMin > 0 ? SX.net.cureMin * Math.max(1, I.qty(it)) : 0;
      if (cureMin) {
        inp.min = String(cureMin);
        if (!(+inp.value >= cureMin)) inp.value = String(cureMin);
        const nt = r.querySelector(".nm .small");
        if (nt) nt.insertAdjacentHTML("beforeend", "<br>" + esc("오늘 최소 " + won(cureMin) + "부터 올릴 수 있습니다(매일 0시에 다시 정합니다)"));
      }
      inp.onwheel = ev => ev.stopPropagation();
      const b = document.createElement("button");
      b.textContent = "올리기";
      b.disabled = !!it.quest || !!it.story || it.kind === "mag" && !((it.ammo | 0) > 0) || !!(I.def(it.name) || {}).trash;
      const go = async () => {
        b.disabled = true;
        const res = await SX.net.sell(e.x, e.y, Math.round(+inp.value || 0));
        SX.audio.play(res.ok ? "buy" : "denied");
        if (res.ok) inputMem.delete(inp.dataset.keep);
        renderShop();
      };
      b.onclick = go;
      r.append(inp, b);
      R.appendChild(r);
    }
    wrap.append(left, right);
    fmFit = fitCols;
    Promise.resolve().then(fitCols);
    return wrap;
  }
  function serviceRow(guns) {
    const s = SX.game.save, kit = SX.game.kit;
    const need = guns ? I.gunsToFix(s, kit) : I.armorToFix(s, kit);
    let total = 0;
    for (const it of need) total += guns ? I.gunFixCost(it) : I.armorFixCost(it);
    const r = document.createElement("div");
    r.className = "svc";
    r.style.cssText = "display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:0;margin:0 0 7px;background:rgba(60,80,120,0.2);box-shadow:inset 0 0 0 var(--u) rgba(90,110,150,0.35)";
    const desc = need.length ? need.length + "점 — " + (guns ? "쏠수록 닳습니다. 낡으면 탄이 퍼지고 가끔 걸립니다" : "맞을수록 깎입니다. 고치면 최대 방어가 10% 줄어듭니다") : guns ? "정비할 총이 없습니다" : "수리할 방어구가 없습니다";
    r.innerHTML = `<span class="nm" style="flex:1">${guns ? "🔧 총기 정비" : "🛡 방어구 수리"}<br><span class="small">${esc(desc)}</span></span><span class="pr">${need.length ? won(total) : "-"}</span>`;
    const b = document.createElement("button");
    b.textContent = guns ? "정비" : "수리";
    b.disabled = !need.length;
    b.onclick = () => {
      if (!need.length) return;
      if (s.money < total) {
        SX.audio.play("denied");
        SX.log("돈이 모자랍니다 — " + won(total) + " 필요");
        return;
      }
      s.money -= total;
      loyAdd(guns ? "gun" : "gear", total, {
        n: guns ? "정비" : "수리",
        p: total,
        k: "f"
      });
      for (const it of need) {
        if (guns) I.fixGun(it); else I.fixArmor(it);
      }
      SX.audio.play("buy");
      SX.log((guns ? "🔧 총 " : "🛡 방어구 ") + need.length + "점 " + (guns ? "정비" : "수리") + " 완료 — " + won(total), "good");
      SX.game.persist();
      renderShop();
    };
    r.appendChild(b);
    return r;
  }
  const TAB_EN = {
    food: "Diner",
    gun: "Guns",
    ammo: "Ammo",
    parts: "Parts",
    med: "Meds",
    gear: "Armor",
    broker: "Sell",
    smuggle: "Smuggler",
    merc: "Mercs",
    insure: "Insure · Mercs",
    furn: "Furniture",
    estate: "Housing",
    quest: "Jobs",
    fac: "Facilities",
    free: "Flea",
    wish: "Wishlist",
    pack: "Loadout"
  };
  const TABS = [ [ "gun", "무기" ], [ "ammo", "탄약" ], [ "parts", "파츠" ], [ "med", "약" ], [ "gear", "방어구" ], [ "smuggle", "밀수" ], [ "wish", "찜 목록" ], [ "broker", "판매" ], [ "free", "프리마켓" ], [ "pack", "출격 묶음" ], [ "insure", "보험 · 용병" ], [ "food", "밥집" ], [ "furn", "가구" ], [ "estate", "부동산" ], [ "fac", "설비" ], [ "quest", "의뢰" ] ];
  const GROUPS = [ [ "buy", "🛒", "상인에게 구매", "Buy", [ "gun", "ammo", "parts", "med", "gear", "smuggle", "wish" ] ], [ "sell", "💰", "판매", "Sell", [ "broker", "free" ] ], [ "prep", "🎒", "출격 준비", "Raid prep", [ "pack", "insure", "food" ] ], [ "home", "🏠", "집", "Home", [ "furn", "estate", "fac" ] ], [ "job", "📜", "의뢰", "Jobs", [ "quest" ] ] ];
  const TABLE_TABS = new Set([ "gun", "ammo", "parts", "med", "gear", "smuggle" ]);
  const TAB_OK = new Set(TABS.map(t => t[0]));
  const grpOf = t => (GROUPS.find(g => g[4].indexOf(t) >= 0) || GROUPS[0])[0];
  const MK = (() => {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem("sxd_market") || "null");
    } catch (e) {}
    o = o && typeof o === "object" ? o : {};
    return {
      tab: TAB_OK.has(o.tab) ? o.tab : "gun",
      last: o.last && typeof o.last === "object" ? o.last : {},
      can: !!o.can,
      wish: !!o.wish,
      pane: o.pane === "stash" ? "stash" : "info",
      pk: typeof o.pk === "string" ? o.pk : ""
    };
  })();
  const mkSave = () => {
    try {
      localStorage.setItem("sxd_market", JSON.stringify(MK));
    } catch (e) {}
  };
  const mkView = {
    tab: "",
    sort: "",
    dir: 1,
    sel: "",
    qty: 1,
    bart: false,
    cart: new Map
  };
  function mkReset() {
    mkView.sort = "";
    mkView.dir = 1;
    mkView.sel = "";
    mkView.qty = 1;
    mkView.bart = false;
    const q = document.querySelector("#shopTabs .mkQ");
    if (q) q.value = "";
  }
  let shopTab = MK.tab;
  U.openShop = function(role) {
    shopTab = role === "merc" ? "insure" : TAB_OK.has(role) ? role : MK.tab;
    mkReset();
    mkView.tab = shopTab;
    mkView.cart.clear();
    U.fmReset();
    U.open("shop", `<div class="win wide" style="height:88vh">${header("시장", `<span class="money" id="shopMoney"></span>${SX.loadout && !SX.loadout.why() ? `<button id="shopLoadout" class="loOpen">🎒 장비 세트</button>` : ""}`)}<div class="tabs mkTabs" id="shopTabs"></div><div class="body row" id="shopBody" style="flex:1"></div></div>`);
    if ($("shopLoadout")) $("shopLoadout").onclick = () => SX.loadout.open();
    renderShop();
  };
  let shopFresh = false;
  function mkTabsBuild(tabs) {
    tabs.innerHTML = `<div class="mkGrp">${GROUPS.map(([g, e, n, en]) => `<button data-grp="${g}" aria-selected="false">${e} <span data-en="${en}">${n}</span></button>`).join("")}</div>` + `<div class="mkSubRow"><div class="mkSub">${TABS.map(([k, n]) => `<button data-tab="${k}" data-en="${TAB_EN[k] || ""}">${n}</button>`).join("")}</div>` + `<div class="mkTools"><input class="mkQ" type="text" maxlength="40" placeholder="이름으로 찾기 (Ctrl+F)" spellcheck="false" autocomplete="off">` + `<button class="mkChip" data-chip="can" aria-pressed="false">살 수 있는 것만</button><button class="mkChip" data-chip="wish" aria-pressed="false">★ <span data-en="Wishlist only">찜만</span></button></div></div>`;
    for (const c of tabs.querySelectorAll("[data-chip]")) c.setAttribute("aria-pressed", MK[c.dataset.chip] ? "true" : "false");
    const q = tabs.querySelector(".mkQ");
    q.oninput = () => mkFilter();
    q.onkeydown = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (q.value) {
          q.value = "";
          mkFilter();
        } else q.blur();
      }
    };
    tabs.onclick = e => {
      const g = e.target.closest("[data-grp]"), t = e.target.closest("[data-tab]"), c = e.target.closest("[data-chip]");
      if (g) {
        const G = GROUPS.find(x => x[0] === g.dataset.grp), l = MK.last[G[0]];
        mkGo(G[4].indexOf(l) >= 0 ? l : G[4][0]);
      } else if (t) mkGo(t.dataset.tab); else if (c) {
        const k = c.dataset.chip;
        MK[k] = !MK[k];
        mkSave();
        c.setAttribute("aria-pressed", MK[k] ? "true" : "false");
        SX.audio.play("click");
        mkFilter();
      }
    };
  }
  function mkGo(tab) {
    if (shopTab !== tab) shopFresh = true;
    shopTab = tab;
    SX.audio.play("click");
    renderShop();
  }
  window.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.code !== "KeyF" || U.panelKind !== "shop" || panel.classList.contains("hidden") || !TABLE_TABS.has(shopTab)) return;
    const q = document.querySelector("#shopTabs .mkQ");
    if (!q) return;
    e.preventDefault();
    e.stopPropagation();
    q.focus();
    q.select();
  }, true);
  function renderShop() {
    const tabs = $("shopTabs"), body = $("shopBody");
    if (!tabs) return;
    if (!TAB_OK.has(shopTab)) shopTab = "gun";
    const grp = grpOf(shopTab), isTbl = TABLE_TABS.has(shopTab);
    if (mkView.tab !== shopTab) {
      mkView.tab = shopTab;
      mkReset();
    }
    if (MK.tab !== shopTab || MK.last[grp] !== shopTab) {
      MK.tab = shopTab;
      MK.last[grp] = shopTab;
      mkSave();
    }
    if (!tabs.children.length) mkTabsBuild(tabs);
    for (const b of tabs.querySelectorAll("[data-grp]")) {
      const on = b.dataset.grp === grp;
      b.classList.toggle("gOn", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    }
    for (const b of tabs.querySelectorAll("[data-tab]")) {
      b.classList.toggle("on", b.dataset.tab === shopTab);
      b.classList.toggle("mkOff", grpOf(b.dataset.tab) !== grp);
    }
    tabs.classList.toggle("mkNoTools", !isTbl);
    tabs.classList.toggle("mkOne", !GROUPS.find(g => g[0] === grp)[4].some(t => TABLE_TABS.has(t)));
    tabBadges(tabs);
    $("shopMoney").textContent = won(SX.game.save.money);
    keepUI(body);
    if (shopFresh) {
      shopFresh = false;
      scrollMem.clear();
      body.scrollTop = 0;
    }
    body.innerHTML = "";
    body.classList.toggle("mkFill", isTbl || shopTab === "pack");
    const s = SX.game.save;
    if (shopTab === "broker") {
      invOther = {
        kind: "sell"
      };
      body.append(kitColumn(SX.game.kit, true), sellColumn());
      putUI(body);
      return;
    }
    if (shopTab === "furn") {
      body.appendChild(furnShop());
      putUI(body);
      return;
    }
    if (shopTab === "free") {
      body.appendChild(freeMarket());
      putUI(body);
      return;
    }
    if (shopTab === "estate") {
      body.appendChild(estateShop());
      putUI(body);
      return;
    }
    if (shopTab === "quest") {
      body.appendChild(questShop());
      putUI(body);
      return;
    }
    if (shopTab === "fac") {
      body.appendChild(facShop());
      putUI(body);
      return;
    }
    if (shopTab === "food") {
      body.appendChild(foodShop());
      putUI(body);
      return;
    }
    if (shopTab === "wish") {
      body.appendChild(wishShop());
      putUI(body);
      return;
    }
    if (Array.isArray(s.wishNew) && s.wishNew.indexOf(shopTab) >= 0) s.wishNew = s.wishNew.filter(w => w !== shopTab);
    if (shopTab === "pack") {
      invOther = null;
      body.append(...packView());
      putUI(body);
      return;
    }
    if (isTbl) {
      const st = shopTab === "smuggle" ? null : D.stalls.find(x => x.id === shopTab), who = st ? st.id : "smuggle";
      const left = document.createElement("div");
      left.className = "box col shopList mkLeft";
      if (st) left.innerHTML = `<h3><span>${esc(st.name)} ${U.qm((shopTab === "parts" ? "보관함의 총을 누르면 파츠 창이 열립니다.<br>" : "") + (shopTab === "med" ? "증상 억제약 값은 가진 재산의 3%입니다(최소 20만 원).<br>" : "") + "줄을 누르면 오른쪽에 자세히 나옵니다.<br>" + "산 물건은 보관함으로 들어갑니다.<br>줄을 우클릭하면 자세히 · ☆ 를 누르면 찜합니다.")}</span></h3>`; else left.innerHTML = `<h3><span>밀수꾼</span><span class="small">시장에 안 나오는 것 · 웃돈 ${D.smuggleMarkup}% · ☆ 찜</span></h3>`;
      left.appendChild(loyBox(who));
      if (shopTab === "gun" || shopTab === "gear") left.appendChild(serviceRow(shopTab === "gun"));
      left.appendChild(buyTable(who, st));
      left.appendChild(mkFoot(who));
      invOther = {
        kind: "stash"
      };
      body.append(left, buySide(s));
      mkFilter(true);
      putUI(body);
      mkSnap(body);
      requestAnimationFrame(() => mkSnap(body));
      return;
    }
    const list = document.createElement("div");
    list.className = "box col shopList";
    list.style.minWidth = "45%";
    const side = document.createElement("div");
    side.className = "col shopSide";
    side.style.flex = "1";
    const autoChk = (label, on, sub, cb) => {
      const l = document.createElement("label");
      l.className = "autoChk" + (on ? " on" : "");
      l.innerHTML = `<input type="checkbox"${on ? " checked" : ""}><span class="acL">${esc(label)}</span>${sub ? `<span class="small acS">${esc(sub)}</span>` : ""}`;
      l.querySelector("input").onchange = e => cb(!!e.target.checked);
      return l;
    };
    const mercBox = () => {
      const list = document.createElement("div");
      list.className = "box mercBox";
      list.innerHTML = `<h3><span>용병소</span><span class="small">다음 판에 한 명이 따라옵니다(뒤를 봐줍니다)</span></h3>`;
      const L = document.createElement("div");
      L.className = "list alignList";
      L.style.setProperty("--alc", "auto 1fr auto auto");
      for (const m of D.mercs) {
        const r = document.createElement("div");
        r.className = "li";
        r.style.cssText = "align-items:center;gap:10px";
        r.appendChild(mercPortrait(m, 2));
        const gunName = m.gun ? m.gun : "맨손 · " + (m.melee || "근접");
        const extra = [];
        if (m.heal) extra.push("회복 " + m.heal + "/초");
        if (m.loot) extra.push("전리품 +" + Math.round((m.loot - 1) * 100) + "%");
        if (m.rate && m.rate < 1) extra.push("연사 빠름");
        if (m.rate && m.rate > 1.2) extra.push("연사 느림");
        const info = document.createElement("span");
        info.className = "nm";
        info.style.flex = "1";
        info.innerHTML = `${esc(m.name)} <span class="small" style="color:#d8a15a">${esc(m.tag || "")}</span><br>` + `<span class="small">${esc(gunName)} · 체력 ${m.hp} · 명중 ${Math.round(m.acc * 100)}% · 시야 ${m.sight}m · 청력 ${m.ear}m${extra.length ? " · " + esc(extra.join(" · ")) : ""}</span><br>` + `<span class="small" style="opacity:.75">${esc(m.desc)}</span>`;
        r.appendChild(info);
        const pr = document.createElement("span");
        pr.className = "pr";
        pr.textContent = won(m.price);
        r.appendChild(pr);
        r.oncontextmenu = e => {
          e.preventDefault();
          U.showDetail({
            merc: m
          });
        };
        r.title = "우클릭: 자세히";
        const b = document.createElement("button");
        b.textContent = s.merc === m.id ? "고용됨" : "고용";
        b.disabled = !!s.merc;
        b.onclick = () => {
          if (s.money < m.price) {
            SX.audio.play("denied");
            return;
          }
          s.money -= m.price;
          s.merc = m.id;
          if (s.mercAuto) s.mercAuto = m.id;
          SX.audio.play("buy");
          SX.log(m.name + " 고용 — 다음 출격에 따라옵니다");
          renderShop();
        };
        r.appendChild(b);
        L.appendChild(r);
      }
      list.appendChild(L);
      {
        const who = D.mercs.find(x => x.id === (s.mercAuto || s.merc));
        const ck = autoChk("다음 판도 같은 사람", !!s.mercAuto, who ? who.name + " · " + won(who.price) : "먼저 한 명을 고용하십시오", v => {
          s.mercAuto = v && who ? who.id : null;
          SX.game.persist();
          SX.audio.play("click");
          renderShop();
        });
        ck.classList.add("mercAuto");
        if (!who) ck.querySelector("input").disabled = true;
        ck.dataset.tip = "출격할 때마다 같은 사람을 같은 값에 다시 고용합니다 — 돈이 모자라면 알리고 그 판은 용병 없이 나갑니다";
        list.insertBefore(ck, L);
      }
      return list;
    };
    if (shopTab === "insure") {
      const fee = insureFee();
      list.innerHTML = `<h3><span>🛡 보험 ${U.qm("의식을 잃어도 <b>장착한 장비</b>(총 · 근접 · 방탄 · 가방 · 리그 — 안에 든 건 빼고)가 보관함으로 돌아옵니다. 한 판에 한 번입니다.<br><b>보험료는 출격할 때</b> 그때 장착한 장비 값의 15%를 냅니다.")}</span></h3>\n        <div class="insRow"><div class="insBox"><span class="small">지금 장비 값</span><b>${won(gearValue())}</b></div><div class="insArr">→ 15%</div><div class="insBox"><span class="small">보험료(출격할 때)</span><b class="money">${won(fee)}</b></div></div>\n        ${s.insured && s.insuredFee ? `<p class="small center">미리 낸 ${won(s.insuredFee)}은 빼고 받습니다</p>` : ""}\n        ${s.insured ? `<p class="good center">✓ 보험 신청됨 — 다음 출격에 적용</p>` : ""}`;
      const b = document.createElement("button");
      b.className = "big insBtn";
      b.textContent = s.insured ? s.insuredFee ? "보험 취소(미리 낸 것 환불)" : "보험 취소" : "보험 신청";
      b.onclick = () => {
        if (s.insured) {
          s.money += s.insuredFee || 0;
          s.insured = false;
          s.insuredFee = 0;
        } else {
          s.insured = true;
          s.insuredFee = 0;
        }
        SX.audio.play("buy");
        renderShop();
      };
      list.appendChild(b);
      {
        const ck = autoChk("늘 들기", !!s.insAuto, "출격할 때마다 보험료를 저절로 냅니다", v => {
          s.insAuto = v;
          SX.game.persist();
          SX.audio.play("click");
          renderShop();
        });
        ck.classList.add("insAuto");
        ck.dataset.tip = "출격할 때마다 그때 장착한 장비 값의 15%를 저절로 냅니다 — 돈이 모자라면 알리고 그 판은 보험 없이 나갑니다";
        list.appendChild(ck);
      }
      const iv = document.createElement("div");
      iv.className = "box alignList";
      iv.style.setProperty("--alc", "1fr auto auto");
      iv.innerHTML = `<h3><span>🗺 정보 ${U.qm("건물 하나의 알짜 층을 알려 드립니다.<br>그 층 전리품이 좋아집니다(다음 판 한 번).")}</span></h3>`;
      for (const bd of D.buildings.filter(x => !x.final && !x.train)) {
        const price = 12e4 + bd.diff * 8e4;
        const r = document.createElement("div");
        r.className = "li";
        const known = s.intel && s.intel.building === bd.id;
        r.innerHTML = `<span class="nm">${esc(bd.name)} <span class="small">${esc(bd.tag)}</span>${known ? " · <b class='good'>" + (s.intel.hotFloor + 1) + "층이 알짜</b>" : ""}</span><span class="pr">${won(price)}</span>`;
        r.oncontextmenu = e => {
          e.preventDefault();
          U.showDetail({
            building: bd,
            price
          });
        };
        r.title = "우클릭: 자세히";
        const btn = document.createElement("button");
        btn.textContent = known ? "알고 있음" : "구매";
        btn.disabled = known;
        btn.onclick = () => {
          if (s.money < price) {
            SX.audio.play("denied");
            return;
          }
          s.money -= price;
          s.intel = {
            building: bd.id,
            hotFloor: 1 + Math.floor(Math.random() * Math.max(1, bd.floors - 1))
          };
          SX.audio.play("buy");
          SX.log("정보 — " + bd.name + " " + (s.intel.hotFloor + 1) + "층에 물건이 많습니다");
          renderShop();
        };
        r.appendChild(btn);
        iv.appendChild(r);
      }
      list.appendChild(iv);
      list.classList.add("insList");
      invOther = null;
      side.appendChild(mercBox());
      body.append(list, side);
      putUI(body);
      return;
    }
    const stash = document.createElement("div");
    stash.className = "box";
    stash.innerHTML = `<h3><span>보관함</span><span class="small">${I.cells(s.stash)}/${s.stash.cols * s.stash.rows}칸</span></h3>`;
    const wrap = scrollBox("furnStash", "48vh");
    invOther = {
      kind: "stash"
    };
    wrap.appendChild(gridEl(s.stash, "other"));
    stash.appendChild(wrap);
    side.appendChild(stash);
    body.append(list, side);
    putUI(body);
  }
  function propThumb(kind, col, v) {
    const s = ART.prop(kind, v | 0, col);
    const cv = document.createElement("canvas");
    cv.className = "thumb";
    if (!s) return cv;
    cv.width = s.c.width;
    cv.height = s.c.height;
    cv.getContext("2d").drawImage(s.c, 0, 0);
    return cv;
  }
  U.propThumb = propThumb;
  let furnTab = "all";
  const FURN_USE = c => c.use === "display" ? "물건 진열" : c.use === "rack" ? "총 진열" : c.use === "safe" ? c.water ? "생수병 보관 " + c.grid[0] + "×" + c.grid[1] + "칸" : "보관" : c.use === "wardrobe" ? "캐릭터 꾸미기" : c.use === "sleep" ? "잠자리" : c.use === "garden" ? "텃밭 — 씨앗을 심어 거둡니다" : c.use === "fridge" ? "먹을 것 · 마실 것 보관 " + c.grid[0] + "×" + c.grid[1] + "칸" : c.use === "cook" ? "불 없는 요리(김치 · 샐러드)" : c.use === "stove" ? "불이 드는 요리(라면 · 감자 · 생선) · 부탄가스" : c.use === "water" ? "생수병을 넣어 두고 마십니다" : c.use === "dump" ? "쓰레기 버리기" : c.light ? "불빛" : c.flat ? "깔개" : "꾸밈";
  function furnShop() {
    const H = SX.home, home = SX.game.save.home;
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    col.innerHTML = `<h3><span>가구점 ${U.qm(`산 가구는 셸터 창고에 들어갑니다.<br>셸터에서 [${esc(SX.label("deco"))}] 꾸미기로 놓습니다.`)}</span><span class="small">🎨 색 바꾸기 ${won(H.PRICE.paint)}</span></h3>`;
    const groups = H.shopGroups(k => !!ART.propSize(k)).filter(g => g.list.length);
    const tabs = document.createElement("div");
    tabs.className = "row furnTabs";
    tabs.style.flexWrap = "wrap";
    tabs.style.gap = "calc(var(--u)*1.5)";
    tabs.style.marginBottom = "calc(var(--u)*2)";
    const tabList = [ [ "all", "전체" ] ].concat(groups.map(g => [ g.id, g.name ]), SX.top ? [ SX.top.TAB ] : []);
    if (!tabList.some(([id]) => id === furnTab) && !(SX.homeSurf && furnTab === SX.homeSurf.TAB[0])) furnTab = "all";
    for (const [id, nm] of tabList) {
      const b = document.createElement("button");
      b.className = "mini furnTab" + (furnTab === id ? " on" : "");
      b.dataset.furnTab = id;
      b.textContent = nm;
      b.onclick = () => {
        furnTab = id;
        SX.audio.play("click");
        shopFresh = true;
        renderShop();
      };
      tabs.appendChild(b);
    }
    if (SX.homeSurf) {
      const [id, nm] = SX.homeSurf.TAB, b = document.createElement("button");
      b.className = "mini surfTab" + (furnTab === id ? " on" : "");
      b.dataset.furnTab = id;
      b.textContent = nm;
      b.onclick = () => {
        furnTab = id;
        SX.audio.play("click");
        shopFresh = true;
        renderShop();
      };
      tabs.appendChild(b);
    }
    col.appendChild(tabs);
    const grid = document.createElement("div");
    grid.className = "furnGrid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(calc(var(--u)*140), 1fr))";
    grid.style.gap = "calc(var(--u)*2)";
    for (const gp of groups) {
      if (furnTab !== "all" && furnTab !== gp.id) continue;
      const h = document.createElement("div");
      h.className = "cat";
      h.textContent = gp.name;
      h.style.gridColumn = "1 / -1";
      grid.appendChild(h);
      for (const [k, c] of gp.list) {
        const r = document.createElement("div");
        r.className = "li";
        r.dataset.kind = k;
        r.appendChild(propThumb(k));
        const own = home.furn.filter(f => f.kind === k).length;
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.innerHTML = esc(c.name) + (own ? ` <span class="small">가진 것 ${own}</span>` : "") + `<br><span class="small">${esc(FURN_USE(c))}${c.paint ? " · 색 바꿈" : ""}</span>`;
        r.appendChild(nm);
        const pr = document.createElement("span");
        pr.className = "pr";
        pr.textContent = won(c.price);
        r.appendChild(pr);
        r.oncontextmenu = e => {
          e.preventDefault();
          U.showDetail({
            furn: k
          });
        };
        r.title = "우클릭: 자세히";
        const b = document.createElement("button");
        b.textContent = "구매";
        b.onclick = () => U.ask(c.name + " 구매", "셸터 창고에 들어갑니다. [" + esc(SX.label("deco")) + "] 꾸미기로 놓습니다.", c.price, () => {
          if (H.buy(k)) renderShop();
        });
        r.appendChild(b);
        grid.appendChild(r);
      }
    }
    if (SX.top && (furnTab === "all" || furnTab === "top")) SX.top.shopRows(grid, () => renderShop());
    col.appendChild(grid);
    if (SX.homeSurf && (furnTab === "all" || furnTab === SX.homeSurf.TAB[0])) SX.homeSurf.shopRows(grid, () => renderShop(), U);
    return col;
  }
  U.homeThumb = function(t, cell) {
    const P = SX.map.homePlan(t);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    const bb = (a, b, c, d) => {
      bx0 = Math.min(bx0, a);
      by0 = Math.min(by0, b);
      bx1 = Math.max(bx1, c);
      by1 = Math.max(by1, d);
    };
    for (const r of P.rects) bb(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1);
    for (const q of (P.parapets || []).concat(P.strips || [], P.solid || [])) bb(q.x0, q.y0, q.x1, q.y1);
    const eV = P.entry.side === "r";
    bb(P.entry.x, P.entry.y, P.entry.x + (eV ? 0 : 1), P.entry.y + (eV ? 1 : 0));
    const cv = ART.mk((bx1 - bx0 + 1) * cell + 4, (by1 - by0 + 1) * cell + 4), x = cv.getContext("2d");
    x.fillStyle = "#0c0e12";
    x.fillRect(0, 0, cv.width, cv.height);
    const ox = 2 - bx0 * cell, oy = 2 - by0 * cell;
    for (const r of P.rects) {
      x.fillStyle = t.wall;
      x.fillRect(ox + (r.x0 - 1) * cell, oy + (r.y0 - 1) * cell, (r.x1 - r.x0 + 3) * cell, (r.y1 - r.y0 + 3) * cell);
    }
    x.fillStyle = t.wall;
    for (const q of P.solid || []) x.fillRect(ox + q.x0 * cell, oy + q.y0 * cell, (q.x1 - q.x0 + 1) * cell, (q.y1 - q.y0 + 1) * cell);
    for (const r of P.rects) {
      if (r.secret) continue;
      const fs = r.fs != null ? r.fs : t.floor;
      if (cell >= 4) {
        for (let ty = r.y0; ty <= r.y1; ty++) for (let tx = r.x0; tx <= r.x1; tx++) x.drawImage(ART.floorCached(fs, tx, ty, tx * 7 + ty * 13), 0, 0, 32, 32, ox + tx * cell, oy + ty * cell, cell, cell);
      } else {
        x.fillStyle = "#6a5a44";
        x.fillRect(ox + r.x0 * cell, oy + r.y0 * cell, (r.x1 - r.x0 + 1) * cell, (r.y1 - r.y0 + 1) * cell);
      }
    }
    x.fillStyle = "#c8b890";
    for (const d of P.doors) {
      if (d.secret) continue;
      const h = d.horiz !== false;
      x.fillRect(ox + d.x * cell, oy + d.y * cell, (h ? d.len || 2 : 1) * cell, (h ? 1 : d.len || 2) * cell);
    }
    x.fillStyle = "#9aa0a8";
    for (const s of P.stairs) x.fillRect(ox + s.x0 * cell, oy + s.y0 * cell, (s.x1 - s.x0 + 1) * cell, (s.y1 - s.y0 + 1) * cell);
    for (const s of P.strips || []) for (let ty = s.y0; ty <= s.y1; ty++) for (let tx = s.x0; tx <= s.x1; tx++) {
      if (cell >= 4) x.drawImage(ART.floorCached(s.fs, tx, ty + 4, tx * 7 + ty * 13), 0, 0, 32, 32, ox + tx * cell, oy + ty * cell, cell, cell); else {
        x.fillStyle = "#3a3632";
        x.fillRect(ox + tx * cell, oy + ty * cell, cell, cell);
      }
    }
    x.fillStyle = "#8a8a84";
    for (const q of P.parapets || []) x.fillRect(ox + q.x0 * cell, oy + q.y0 * cell, (q.x1 - q.x0 + 1) * cell, (q.y1 - q.y0 + 1) * cell);
    x.fillStyle = "#e0c060";
    x.fillRect(ox + P.entry.x * cell, oy + P.entry.y * cell, (eV ? 1 : 2) * cell, (eV ? 2 : 1) * cell);
    return cv;
  };
  function estateShop() {
    const H = SX.home, cur = H.save().tier;
    const col = document.createElement("div");
    col.className = "box col alignList";
    col.style.flex = "1";
    col.style.setProperty("--alc", "auto 1fr auto auto");
    col.innerHTML = `<h3><span>부동산 — 이사 ${U.qm("가구는 한 벌을 모든 집이 같이 씁니다. 떠나면 가구는 모두 창고로 가고, 돌아오면 그 집에 놓았던 대로 다시 놓입니다.<br>가구 속 · 위 물건은 가구를 따라갑니다 · 처음 가는 집은 빈 집입니다(붙박이만) · 보관함은 어디서나 그대로입니다.")}</span></h3>`;
    for (const t of H.order ? H.order() : H.TIERS) {
      const r = document.createElement("div");
      r.className = "li";
      const cv = document.createElement("canvas");
      cv.className = "thumb";
      cv.width = 42;
      cv.height = 28;
      const x = cv.getContext("2d");
      x.fillStyle = "#0c0e12";
      x.fillRect(0, 0, 42, 28);
      const th = U.homeThumb(t, 1);
      const sc = Math.min(1, 40 / th.width, 26 / th.height), w = Math.round(th.width * sc), h = Math.round(th.height * sc);
      x.imageSmoothingEnabled = false;
      x.drawImage(th, Math.round(21 - w / 2), Math.round(14 - h / 2), w, h);
      r.appendChild(cv);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = `${esc(t.name)} <span class="small">넓이 ${SX.home.area(t)}칸</span><br><span class="small">${esc(t.desc)}</span>`;
      r.appendChild(nm);
      const pr = document.createElement("span");
      pr.className = "pr";
      pr.textContent = t.price ? won(t.price) : "-";
      r.appendChild(pr);
      r.oncontextmenu = e => {
        e.preventDefault();
        U.showDetail({
          tier: t
        });
      };
      r.title = "우클릭: 자세히";
      const b = document.createElement("button");
      const own = H.owns(t.id);
      b.textContent = t.id === cur ? "지금 사는 곳" : own ? "이사(가진 집)" : "이사";
      b.disabled = t.id === cur;
      if (own && t.id !== cur) pr.textContent = "가진 집";
      b.onclick = () => U.ask(t.name + "(으)로 이사", esc(t.desc) + "<br>지금 집에 놓아 둔 가구는 모두 창고로 갑니다(가구 속 물건은 그대로) — 다시 돌아오면 놓았던 대로 놓입니다." + (H.hasLayout(t.id) ? "<br>전에 살던 집이라 그때 놓아 둔 가구가 그 자리에 다시 놓입니다." : "<br>처음 가는 집이라 빈 집입니다 — 창고에서 꺼내 놓으시면 됩니다.") + (own ? "<br>가진 집이라 돈이 안 듭니다." : ""), own ? 0 : t.price, () => {
        if (H.moveTo(t.id)) renderShop();
      });
      r.appendChild(b);
      col.appendChild(r);
    }
    return col;
  }
  function foodShop() {
    const N = SX.needs, s = N.get(SX.game.save);
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    const bar = (v, c) => `<span class="vbarH"><i style="width:${Math.round(v)}%;background:${v < N.LOW ? "#e0514a" : c}"></i></span>`;
    col.innerHTML = `<h3><span>밥집 ${U.qm("판 안에서만 배고프고 목마릅니다.<br>25 아래면 기력이 달리고, 0 이면 체력이 줄어듭니다.")}</span></h3>\n      <div class="needRow">배고픔 ${bar(s.food, "#d8a860")} <b>${Math.round(s.food)}</b> · 목마름 ${bar(s.water, "#6ab8f0")} <b>${Math.round(s.water)}</b></div>`;
    const L = document.createElement("div");
    L.className = "list";
    L.style.flex = "1";
    for (const m of N.MEALS) {
      const r = document.createElement("div");
      r.className = "li";
      r.innerHTML = `<span class="nm">🍲 ${esc(m.name)}<br><span class="small">${esc(m.desc)} · 바로 먹습니다</span></span><span class="pr">${won(m.price)}</span>`;
      const b = document.createElement("button");
      b.textContent = "먹기";
      b.onclick = () => {
        if (N.buyMeal(m.id)) renderShop();
      };
      r.appendChild(b);
      L.appendChild(r);
    }
    const h = document.createElement("div");
    h.className = "small";
    h.style.padding = "calc(var(--u)*3) calc(var(--u)*2) calc(var(--u)*1)";
    h.innerHTML = "🎒 들고 갈 것 " + U.qm("산 것은 보관함으로 들어갑니다 · 판 안에서 우클릭해 먹습니다.");
    L.appendChild(h);
    for (const [d, p] of U.foodRows()) L.appendChild(buyRow(d, p));
    col.appendChild(L);
    return col;
  }
  U.smuggleRows = function(all) {
    const L = D.smuggle.map(sm => [ sm.item, SX.worth ? SX.worth.price(sm.item.name, "smuggle", Math.round(sm.base * (1 + D.smuggleMarkup / 100) / 100) * 100) : Math.round(sm.base * (1 + D.smuggleMarkup / 100) / 100) * 100 ]);
    const EX = SX.trade && SX.trade.SMUG_EXTRA || [ [ "수류탄", 45e3 ], [ "섬광탄", 4e4 ], [ "최루탄", 38e3 ], [ "연막탄", 34e3 ], [ "화염병", 3e4 ] ];
    for (const [n, p] of EX) {
      const d = I.def(n);
      if (d) L.push([ d, p ]);
    }
    return all || !SX.trade || !SX.game.save ? L : L.filter(([d]) => d && SX.trade.open(SX.game.save, "smuggle", d.name));
  };
  U.foodRows = () => SX.needs.TAKEAWAY.map(([n, k]) => {
    const d = I.def(n);
    return d ? [ d, Math.round(d.val * k / 100) * 100 ] : null;
  }).filter(Boolean);
  let gardenF = null, gardenTimer = 0;
  U.openGarden = function(f) {
    gardenF = f;
    U.open("garden", `<div class="win" style="width:min(94vw,calc(var(--u)*330))">${header(esc(SX.home.FURN[f.kind].name), `<span class="small" id="gdSub"></span>`)}<div class="body col" id="gdBody" style="gap:calc(var(--u)*2)"></div></div>`, () => {
      clearInterval(gardenTimer);
      gardenTimer = 0;
      gardenF = null;
    });
    clearInterval(gardenTimer);
    gardenTimer = setInterval(() => {
      if (U.panelKind === "garden") renderGarden(); else {
        clearInterval(gardenTimer);
        gardenTimer = 0;
      }
    }, 15e3);
    renderGarden();
  };
  function renderGarden() {
    const P = SX.prog, s = SX.game.save, f = gardenF, body = $("gdBody");
    if (!f || !body) return;
    s.garden = P.gFix(s.garden);
    const now = SX.net && SX.net.now ? SX.net.now() : Date.now(), hm = ms => P.gTime(ms), water = P.haveIn(s, P.WATER_BOTTLE);
    const S = P.gSim(s.garden, f, now), L = S.L, plan = S.kit ? P.gKitPlan(s.garden, f, now) : null;
    const seeds = P.CROP_KEYS.map(k => [ k, P.CROPS[k], P.haveIn(s, P.CROPS[k].seed) ]).filter(q => q[2] > 0);
    keepUI(body);
    body.innerHTML = "";
    $("gdSub").textContent = L.length + "칸 · 실제 시간으로 자랍니다(판에 가 있어도 · 게임을 꺼 둬도)";
    const live = L.map(pl => P.gView(pl, now)).filter(v => v && !v.dead && !v.ripe && v.stage !== "seed"), seedN = L.filter(pl => pl && !pl.w).length;
    const top = document.createElement("div");
    top.className = "row facTop";
    top.style.alignItems = "center";
    const wl = [], wet = live.filter(v => v.wet), dry = live.filter(v => !v.wet);
    if (seedN) wl.push("씨앗 " + seedN + " — 물을 주면 싹이 틉니다");
    if (dry.length) wl.push("<b class='warn'>흙이 말랐습니다</b> — 1/4 빠르기로 자라고 " + hm(Math.min(...dry.map(v => v.dieAt)) - now) + " 뒤에 시듭니다"); else if (wet.length) wl.push("촉촉합니다 — " + hm(Math.min(...wet.map(v => v.wetEnd)) - now) + " 뒤에 마릅니다");
    const wline = wl.length ? wl.join(" · ") : "물은 심은 뒤에 줍니다";
    top.innerHTML = `<span class="small" style="flex:1">💧 ${wline}<br>생수병 <b>${water}</b>개 ${U.qm(`물 한 번에 생수병 하나 · ${hm(P.GDN.WET * 6e4)} 촉촉합니다.<br>마른 채 ${hm(P.GDN.WILT * 6e4)}이면 시듭니다 · 다 자란 것은 안 시듭니다.`)}</span>`;
    const wb = document.createElement("button");
    wb.textContent = "물 주기";
    wb.disabled = !(live.length || seedN) || !water;
    wb.dataset.tip = !water ? "생수병이 없습니다 — 밥집에서 사거나 판에서 찾으시면 됩니다" : "생수병 하나로 상자 전체에 줍니다";
    wb.onclick = () => gardenAct({
      act: "water",
      furn: f.id
    });
    top.appendChild(wb);
    body.appendChild(top);
    {
      const kit = S.kit, row = document.createElement("div");
      row.className = "row facTop gdKit";
      row.style.alignItems = "center";
      const btn = (t, tip, dis, b, ask) => {
        const e = document.createElement("button");
        e.textContent = t;
        if (tip) e.dataset.tip = tip;
        e.disabled = !!dis;
        e.dataset.kit = b.act;
        e.onclick = () => ask ? ask() : gardenAct(Object.assign({
          furn: f.id
        }, b));
        return e;
      };
      if (!kit) {
        const have = P.haveIn(s, P.KIT.NAME), tk = have && P.kitItems ? Math.max(0, ...P.kitItems(s).map(P.kitTank)) : 0;
        row.innerHTML = `<span class="small" style="flex:1">🚿 자동 급수기 ${U.qm("달고 생수병을 채워 두면 흙이 마를 때마다 알아서 물을 줍니다(게임을 꺼 둬도).<br>약재상에서 사거나 작업대에서 만드시면 됩니다.")}<br>가진 급수기 <b>${have}</b>개${tk ? " — 물탱크에 물이 " + tk + "병 든 급수기부터 답니다" : ""}</span>`;
        row.appendChild(btn("급수기 달기", have ? "가방 · 보관함의 자동 급수기를 이 상자에 답니다(상자 하나에 하나)" + (tk ? " · 물탱크에 든 물 " + tk + "병으로 이어서 줍니다" : "") : "자동 급수기가 없습니다 — 약재상에서 사거나 작업대에서 만드시면 됩니다", !have, {
          act: "kitOn"
        }));
      } else {
        const cap = P.KIT.CAP, n = plan.n, W = P.GDN.WET * 6e4;
        const cells = Array.from({
          length: cap
        }, (_, i) => `<i class="gdTk${i < n ? " on" : ""}"></i>`).join("");
        const when = !n ? "<b class='warn'>물탱크가 비었습니다</b> — 생수병을 채우셔야 물을 줍니다" : !plan.grow ? "자라는 것이 없으면 물을 안 씁니다(" + hm(W) + "마다 한 병)" : (plan.next ? "다음 물 주기 약 " + hm(plan.next - now) + " 뒤 · " : "") + (plan.empty ? "물이 떨어지는 때 약 " + hm(plan.empty - now) + " 뒤" + (plan.short ? " — <span class='warn'>그 뒤 " + hm(W) + "이면 흙이 마릅니다(더 채우시면 됩니다)</span>" : " — 다 자랄 때까지 넉넉합니다") : "다 자랄 때까지 넉넉합니다 — 다 자라면 " + plan.spare + "병이 남습니다");
        row.innerHTML = `<span class="small" style="flex:1">🚿 자동 급수기 — 물탱크 <b>${n}</b>/${cap}병 <span class="gdTank">${cells}</span><br>${when}</span>`;
        row.appendChild(btn("물 채우기", !water ? "생수병이 없습니다 — 밥집에서 사거나 판에서 찾으시면 됩니다" : n >= cap ? "물탱크가 가득 찼습니다" : "생수병 한 병을 물탱크에 붓습니다", !water || n >= cap, {
          act: "kitFill",
          n: 1
        }));
        const more = Math.min(cap - n, water);
        row.appendChild(btn("가득 채우기" + (more > 1 ? " " + more + "병" : ""), "가진 생수병으로 물탱크를 채웁니다(" + cap + "병까지)", more < 2, {
          act: "kitFill",
          n: cap - n
        }));
        row.appendChild(btn("떼기", "급수기를 떼어 보관함에 넣습니다" + (n ? " · 남은 물 " + n + "병은 급수기 물탱크에 그대로 남습니다" : ""), false, {
          act: "kitOff"
        }, () => U.ask("자동 급수기 떼기", "급수기를 떼어 보관함에 넣습니다." + (n ? "<br>물탱크에 남은 물 " + n + "병은 급수기에 그대로 남습니다 — 다시 달면 그 물로 이어서 줍니다." : ""), 0, () => gardenAct({
          act: "kitOff",
          furn: f.id
        }), null, {
          yes: "떼기"
        })));
      }
      body.appendChild(row);
    }
    const list = document.createElement("div");
    list.className = "list";
    L.forEach((pl, k) => {
      const r = document.createElement("div");
      r.className = "li";
      const v = P.gView(pl, now);
      const icon = v ? I.def(v.stage === "seed" ? v.crop.seed : v.crop.out) : null;
      if (icon) {
        const cv = iconCanvas(Object.assign({}, icon, {
          w: icon.w || 1,
          h: icon.h || 1
        }));
        const kk = Math.min(1, 2 / (icon.h || 1));
        cv.style.width = "calc(var(--u)*" + 16 * (icon.w || 1) * kk + ")";
        cv.style.height = "calc(var(--u)*" + 16 * (icon.h || 1) * kk + ")";
        cv.style.flex = "none";
        r.appendChild(cv);
      } else {
        const cv = iconCanvas({
          name: "빈 텃밭 칸",
          kind: "loot",
          w: 1,
          h: 1
        });
        cv.className = "gdEmpty";
        cv.style.width = cv.style.height = "calc(var(--u)*16)";
        cv.style.flex = "none";
        r.appendChild(cv);
      }
      const nm = document.createElement("span");
      nm.className = "nm";
      if (!v) {
        nm.innerHTML = `${k + 1}칸 — ${esc(P.STAGE_NAME.empty)}<br><span class="small">${seeds.length ? "심을 씨앗을 고르시면 됩니다" : "씨앗이 없습니다 — 약재상에서 사거나 판 상자에서 찾으시면 됩니다"}</span>`;
        r.appendChild(nm);
        for (const [key, C, n] of seeds) {
          const b = document.createElement("button");
          b.textContent = C.seed + " " + n;
          b.dataset.tip = "약 " + hm(C.min * 6e4) + " · " + C.out + " " + (C.n[0] === C.n[1] ? C.n[0] : C.n[0] + "~" + C.n[1]) + "개";
          b.onclick = () => gardenAct({
            act: "plant",
            furn: f.id,
            slot: k,
            seed: C.seed
          });
          r.appendChild(b);
        }
      } else {
        const fullLeft = Math.max(0, v.need - v.g);
        const left = v.ripe ? "" : v.stage === "seed" ? "물을 주면 자라기 시작합니다" : v.dead ? "" : v.wet ? v.ripeAt ? "자라는 중 — 다 자라기까지 약 " + hm(v.ripeAt - now) : plan && plan.ripe[k] ? "자라는 중 — 흙이 마르면 급수기가 물을 줍니다 · 다 자라기까지 약 " + hm(plan.ripe[k] - now) : plan ? "자라는 중(촉촉 " + hm(v.wetEnd - now) + " 남음) — 급수기 물이 모자랍니다 · 물탱크를 더 채우셔야 다 자랍니다" : "자라는 중(촉촉 " + hm(v.wetEnd - now) + " 남음) — 다 자라려면 흙이 마른 뒤 물을 한 번 더 주셔야 합니다(촉촉하면 약 " + hm(fullLeft) + " 더)" : v.ripeAt ? "흙이 말라 천천히 자랍니다 — 다 자라기까지 약 " + hm(v.ripeAt - now) + "(물을 주면 더 빨리)" : "흙이 말랐습니다 — 물을 주셔야 다 자랍니다(그대로 두면 " + hm(v.dieAt - now) + " 뒤 시듦)";
        const pct = v.frac > 0 && v.frac < .01 ? 1 : Math.round(v.frac * 100), yieldN = v.crop.n[0] === v.crop.n[1] ? v.crop.n[0] + "개" : v.crop.n[0] + "~" + v.crop.n[1] + "개";
        nm.innerHTML = `${k + 1}칸 — <b>${esc(v.crop.name)}</b> · ${esc(P.STAGE_NAME[v.stage])}<br><span class="small"><span class='facBar'><i style='width:${pct}%${v.dead ? ";background:#8a6a3a" : ""}'></i></span> ${pct}%${left ? " · " + esc(left) : ""} · 거두면 ${esc(v.crop.out)} ${yieldN}${(+pl.d || 0) > v.crop.min * 6e4 ? " <span class='warn'>(오래 말라 하나 덜)</span>" : ""}</span>`;
        r.appendChild(nm);
        if (v.ripe) {
          const b = document.createElement("button");
          b.textContent = "거두기";
          b.onclick = () => gardenAct({
            act: "harvest",
            furn: f.id,
            slot: k
          });
          r.appendChild(b);
        } else {
          const b = document.createElement("button");
          b.textContent = v.dead ? "뽑아서 치우기" : "뽑기";
          b.onclick = () => {
            if (v.dead) gardenAct({
              act: "clear",
              furn: f.id,
              slot: k
            }); else U.ask(v.crop.name + " 뽑기", "자라는 것을 뽑아 버립니다 — 씨앗은 돌아오지 않습니다.", 0, () => gardenAct({
              act: "clear",
              furn: f.id,
              slot: k
            }), null, {
              yes: "뽑기"
            });
          };
          r.appendChild(b);
        }
      }
      list.appendChild(r);
    });
    body.appendChild(list);
    const foot = document.createElement("div");
    foot.className = "small";
    foot.style.padding = "calc(var(--u)*2)";
    foot.innerHTML = "🥬 거둔 채소 " + U.qm("거둔 채소는 먹거나(배고픔 · 목마름) 요리합니다(김치 · 샐러드는 셸터 조리대 · 삶은 감자는 가스레인지 [" + esc(SX.label("interact")) + "]).<br>거둘 때 가끔 지렁이가 나옵니다(낚시 미끼).");
    body.appendChild(foot);
    putUI(body);
  }
  async function gardenAct(b) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on(), f = gardenF || P.gFurn(s, b.furn);
    let r;
    const v0 = /^kit/.test(b.act || "") && SX.hub.gdVOf ? SX.hub.gdVOf(f) : null;
    if (on) r = await SX.net.garden(b); else {
      s.garden = P.gFix(s.garden);
      r = P.gAct(s.garden, s, b, Date.now(), stashHands());
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    if (r && r.ok) {
      SX.audio.play({
        water: "gardenWater",
        plant: "gardenPlant",
        kitOn: "kitClip",
        kitFill: "kitPour",
        kitOff: "kitUnclip"
      }[b.act] || "gardenPull", {
        vol: .8
      });
      if (r.auto) SX.audio.play("kitDrip", {
        vol: .7,
        delay: b.act === "kitFill" ? 1.6 : .9
      });
      if (SX.hub.gdStart) SX.hub.gdStart(b.act, f, r, v0 != null ? Object.assign({}, b, {
        v0
      }) : b);
    } else SX.audio.play("denied");
    if (U.panelKind === "garden") renderGarden();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.gardenAct = gardenAct;
  function rcTgBtn(rc, redraw) {
    const RC = SX.rcmark, on = !!(RC && RC.has(rc.id)), off0 = SX.needmark && !SX.needmark.on();
    const b = document.createElement("button");
    b.className = "rcTg" + (on ? " on" : "");
    b.dataset.rctg = rc.id;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.innerHTML = "<i></i><span>재료 표시</span>";
    b.title = (on ? "켜져 있습니다 — 이 재료에 하늘빛 표시가 붙습니다. 누르면 끕니다" : "꺼져 있습니다 — 누르면 이 재료에 하늘빛 표시가 붙습니다(칸 왼쪽 위 삼각형 · 설명 줄 · 팔 때 한 번 묻기)") + (off0 ? " · 설정 › 게임 · 안내 「임무 물건 표시」가 꺼져 있어 지금은 보이지 않습니다" : "");
    b.onclick = () => {
      if (!SX.rcmark) return;
      SX.rcmark.toggle(rc.id);
      SX.audio.play("click");
      redraw();
    };
    return b;
  }
  U.rcTgBtn = rcTgBtn;
  let cookF = null, cookStove = false;
  let cookMode = "cook";
  U.openCook = function(f, atStove, mode) {
    cookF = f;
    cookStove = !!atStove;
    cookMode = mode === "craft" ? "craft" : "cook";
    U.open("cook", `<div class="win" style="width:min(94vw,calc(var(--u)*340))">${header(esc(SX.home.FURN[f.kind].name) + (cookMode === "craft" ? " — 제작" : " — 요리"), `<span class="small" id="ckSub"></span>`)}<div class="body col" id="ckBody" style="gap:calc(var(--u)*2)"></div></div>`, () => {
      cookF = null;
    });
    renderCook();
  };
  function renderCook() {
    const P = SX.prog, s = SX.game.save, fs = s.fac || (s.fac = P.fNew()), body = $("ckBody");
    if (!cookF || !body) return;
    const stove = P.hasFurn(s, P.KITCHEN.stove), counter = P.hasFurn(s, P.KITCHEN.counter), fr = P.fridgeGrids(s).length;
    keepUI(body);
    body.innerHTML = "";
    if (cookMode === "craft") {
      renderBench(body, P, s, fs);
      return;
    }
    const fs0 = fr ? "냉장고 " + fr + "대" : "냉장고 없음 — 만든 것은 보관함으로";
    $("ckSub").textContent = cookStove ? P.gasShort(cookF) + " · " + fs0 : fs0;
    const top = document.createElement("div");
    top.className = "small";
    top.style.padding = "0 calc(var(--u)*2)";
    top.innerHTML = (cookStove ? "🔥 끓이고 삶고 굽는 요리 " : "🔪 불 없이 만드는 요리 ") + U.qm((cookStove ? "한 번에 가스 1회를 씁니다.<br>" : "끓이고 삶고 굽는 것은 싱크대 · 가스레인지에서 합니다.<br>") + "재료는 보관함 · 가방 · 개인 금고 · 냉장고 · 조과통 어디에 있어도 됩니다.<br>만든 것은 냉장고에 넣습니다(자리가 없으면 보관함).");
    body.appendChild(top);
    if (cookStove) body.appendChild(gasRow(cookF, s));
    const list = document.createElement("div");
    list.className = "list";
    for (const rc of P.RECIPES) {
      if (!rc.food || !!rc.heat !== cookStove) continue;
      const no = P.craftOk(fs, s, rc) || (rc.heat && !P.gasOf(cookF).n ? "가스가 없습니다 — 부탄가스를 넣어 주십시오" : ""), have = n => P.haveIn(s, n), out = I.def(rc.out[0][0]), fv = out && SX.needs ? SX.needs.of(out) : null;
      const r = document.createElement("div");
      r.className = "li cookRow" + (no ? "" : " ready");
      r.dataset.rc = rc.id;
      if (out) {
        const cv = iconCanvas(Object.assign({}, out, {
          w: out.w || 1,
          h: out.h || 1
        }));
        const kk = Math.min(1, 2 / (out.h || 1));
        cv.style.width = "calc(var(--u)*" + 16 * (out.w || 1) * kk + ")";
        cv.style.height = "calc(var(--u)*" + 16 * (out.h || 1) * kk + ")";
        cv.style.flex = "none";
        r.appendChild(cv);
      }
      const nm = document.createElement("span");
      nm.className = "nm";
      const gasN = rc.heat ? P.gasOf(cookF).n : 0;
      nm.innerHTML = `<b>${esc(rc.out.map(([n, c]) => n + (c > 1 ? " ×" + c : "")).join(", "))}</b> <span class="small">${rc.heat ? "🔥 가스레인지" : "🔪 조리대"}${fv ? " · 배고픔 " + (fv.f > 0 ? "+" : "") + fv.f + (fv.w ? " · 목마름 " + (fv.w > 0 ? "+" : "") + fv.w : "") : ""}</span><br><span class="small">${esc(rc.desc)}<br>${rc.in.map(([n, c]) => esc(n) + " <b class='" + (have(n) >= c ? "good" : "warn") + "'>" + Math.min(c, have(n)) + "/" + c + "</b>").join(" · ")}${rc.heat ? " · 가스 <b class='" + (gasN ? "good" : "warn") + "'>" + Math.min(1, gasN) + "/1</b>" : ""}</span>`;
      r.appendChild(nm);
      const b = document.createElement("button");
      b.textContent = "만들기";
      b.disabled = !!no;
      b.dataset.tip = no || "재료를 가져갑니다 — 보관함 · 가방 · 금고 · 냉장고 · 조과통 차례로";
      b.onclick = () => cookAct(rc.id);
      r.appendChild(b);
      r.appendChild(rcTgBtn(rc, renderCook));
      list.appendChild(r);
    }
    body.appendChild(list);
    putUI(body);
  }
  function gasRow(f, s) {
    const P = SX.prog, g = P.gasOf(f), have = P.haveIn(s, P.GAS.CAN);
    const row = document.createElement("div");
    row.className = "row gasRow";
    row.style.gap = "calc(var(--u)*3)";
    row.style.padding = "calc(var(--u)*2)";
    row.style.alignItems = "center";
    const cans = document.createElement("span");
    cans.className = "wtBottles gasCans";
    cans.innerHTML = "<span class='wtDrop'>🔥</span>".repeat(g.cans) + "<span class='wtDrop off'>🔥</span>".repeat(Math.max(0, g.cap - g.cans));
    cans.dataset.tip = "넣어 둔 부탄가스 통 — 한 통에 " + P.GAS.USES + "번";
    row.appendChild(cans);
    const t = document.createElement("span");
    t.id = "gasN";
    t.className = g.n ? "" : "warn";
    t.textContent = P.gasLabel(f);
    row.appendChild(t);
    const b = document.createElement("button");
    b.id = "gasPut";
    b.textContent = "부탄가스 넣기 (가진 것 " + have + ")";
    b.disabled = !have || g.cans >= g.cap;
    b.dataset.tip = !have ? "부탄가스가 없습니다 — 판에서 찾거나 좌판에서 사시면 됩니다" : g.cans >= g.cap ? "가득 찼습니다 — " + g.cap + "통까지" : "보관함 · 가방 · 금고에서 한 통을 꺼내 넣습니다(한 통에 " + P.GAS.USES + "번)";
    b.onclick = () => gasAct(f);
    row.appendChild(b);
    return row;
  }
  async function gasAct(f) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on();
    f = SX.home.live(f || cookF);
    if (!f) return {
      ok: false
    };
    let r;
    if (on) r = await SX.net.stove({
      act: "gas",
      furn: f.id
    }); else {
      r = P.gasPut(s, f.id, stashHands());
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    if (r && r.ok) {
      SX.audio.play("lockClick", {
        vol: .7
      });
      SX.audio.play("gas", {
        vol: .3,
        delay: .25
      });
      if (SX.hub.gdStart) SX.hub.gdStart("gasIn", SX.home.live(f), r);
      if (SX.hub.gdRefresh && SX.hub.level) SX.hub.gdRefresh(SX.hub.floor());
    } else SX.audio.play("denied");
    if (U.panelKind === "cook") renderCook();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.gasAct = gasAct;
  function renderBench(body, P, s, fs) {
    $("ckSub").textContent = "음식은 조리대 · 가스레인지에서 만듭니다";
    const top = document.createElement("div");
    top.className = "small";
    top.style.padding = "0 calc(var(--u)*2)";
    top.innerHTML = "🛠 제작 " + U.qm("재료는 보관함 · 가방 · 개인 금고 · 냉장고 · 조과통 어디에 있어도 됩니다.<br>만든 것은 보관함으로 들어갑니다.");
    body.appendChild(top);
    const list = document.createElement("div");
    list.className = "list";
    for (const rc of P.RECIPES) {
      if (rc.food) continue;
      const no = P.craftOk(fs, s, rc), have = n => P.haveIn(s, n), out = I.def(rc.out[0][0]);
      const r = document.createElement("div");
      r.className = "li cookRow" + (no ? "" : " ready");
      r.dataset.rc = rc.id;
      if (out) {
        const cv = iconCanvas(Object.assign({}, out, {
          w: out.w || 1,
          h: out.h || 1
        }));
        const kk = Math.min(1, 2 / (out.h || 1));
        cv.style.width = "calc(var(--u)*" + 16 * (out.w || 1) * kk + ")";
        cv.style.height = "calc(var(--u)*" + 16 * (out.h || 1) * kk + ")";
        cv.style.flex = "none";
        r.appendChild(cv);
      }
      const need = rc.fac ? (P.facById(rc.fac[0]) || {}).name + " " + rc.fac[1] + "단계 · " : "";
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = `<b>${esc(rc.out.map(([n, c]) => n + (c > 1 ? " ×" + c : "")).join(", "))}</b><br><span class="small">${esc(need + (rc.desc || ""))}<br>${rc.in.map(([n, c]) => esc(n) + " <b>" + Math.min(c, have(n)) + "/" + c + "</b>").join(" · ")}</span>`;
      r.appendChild(nm);
      const b = document.createElement("button");
      b.textContent = "만들기";
      b.disabled = !!no;
      b.dataset.tip = no || "재료를 가져갑니다 — 보관함 · 가방 · 금고 · 냉장고 · 조과통 차례로";
      b.onclick = () => cookAct(rc.id);
      r.appendChild(b);
      r.appendChild(rcTgBtn(rc, renderCook));
      list.appendChild(r);
    }
    body.appendChild(list);
    putUI(body);
  }
  const cookWrong = rc => cookMode === "craft" ? rc.food ? "음식은 조리대 · 가스레인지에서 만듭니다" : "" : !rc.food ? "제작은 작업대에서 합니다" : rc.heat && !cookStove ? "끓이고 삶고 굽는 요리는 싱크대·가스레인지에서 만듭니다" : !rc.heat && cookStove ? "불 없이 만드는 요리는 조리대에서 만듭니다" : "";
  async function cookAct(id) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on(), rc = P.rById(id);
    if (!rc) return {
      ok: false
    };
    const wrong = cookF ? cookWrong(rc) : "이 가구 창에서 만듭니다";
    if (wrong) {
      SX.audio.play("denied");
      SX.log(wrong, "bad");
      return {
        ok: false,
        msg: wrong
      };
    }
    const fid = cookStove && cookF ? cookF.id : null;
    let r;
    if (on) r = await SX.net.craft(id, fid); else {
      r = P.craft(s.fac || (s.fac = P.fNew()), s, id, stashHands(), fid);
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    if (r && r.ok) {
      const Hb = SX.hub;
      const furn = cookF;
      if (cookMode === "craft") {
        SX.audio.play("woodTap", {
          vol: .6
        });
        SX.audio.play("woodTap", {
          vol: .6,
          delay: .3
        });
        SX.audio.play("woodTap", {
          vol: .6,
          delay: .6
        });
      } else SX.audio.play(rc.heat ? "cookHeat" : "cookChop", {
        vol: .8
      });
      if (Hb.gdStart) Hb.gdStart(rc.heat ? "cook" : "chop", furn, r);
    } else SX.audio.play("denied");
    if (U.panelKind === "cook") renderCook();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.cookAct = cookAct;
  let waterF = null;
  U.openWater = function(f) {
    waterF = f;
    U.open("water", `<div class="win" style="width:min(90vw,calc(var(--u)*230))">${header(esc(SX.home.FURN[f.kind].name), `<span class="small" id="wtSub"></span>`)}<div class="body col" id="wtBody" style="gap:calc(var(--u)*2)"></div></div>`, () => {
      waterF = null;
    });
    renderWater();
  };
  function renderWater() {
    const H = SX.home, s = SX.game.save, f = waterF, body = $("wtBody");
    if (!f || !body) return;
    const w = H.waterOf(f), left = H.waterLeft(f), ns = SX.needs.get(s), have = SX.prog.haveIn(s, "생수병");
    keepUI(body);
    body.innerHTML = "";
    $("wtSub").textContent = H.waterLabel(f);
    const top = document.createElement("div");
    top.className = "small";
    top.style.padding = "0 calc(var(--u)*2)";
    const full = (w.cap + (w.sip ? 1 : 0)) * H.WATER.SIPS, pct = full ? Math.min(100, Math.round(left / full * 100)) : 0;
    top.innerHTML = `💧 남은 물 <span class="wtGauge" style="display:inline-block;vertical-align:middle;width:calc(var(--u)*36);height:calc(var(--u)*3);background:#14202a;box-shadow:0 0 0 1px #05080b"><i style="display:block;height:100%;width:${pct}%;background:${left ? "#4aa6e0" : "#e0604a"}"></i></span> <b>${left}</b>잔 · 생수병 ${w.wb}통${w.sip ? " + 따 놓은 통 " + w.sip + "잔" : ""} ${U.qm(`생수병 한 통에 <b>${H.WATER.SIPS}잔</b> · <b>${w.cap}통</b>까지 넣습니다.<br>넣어 둔 생수병은 가방의 병을 쓰지 않고 바로 마십니다.`)}`;
    body.appendChild(top);
    const row = document.createElement("div");
    row.className = "row";
    row.style.gap = "calc(var(--u)*3)";
    row.style.padding = "calc(var(--u)*2)";
    const bottles = document.createElement("span");
    bottles.className = "wtBottles";
    bottles.innerHTML = "<span class='wtDrop'>💧</span>".repeat(w.wb) + "<span class='wtDrop off'>💧</span>".repeat(Math.max(0, w.cap - w.wb));
    bottles.dataset.tip = "든 생수병";
    row.appendChild(bottles);
    const d = document.createElement("button");
    d.id = "wtDrink";
    d.textContent = "마시기";
    d.disabled = !left || ns.water >= 99.5;
    d.dataset.tip = !left ? "생수병을 넣어 주십시오" : ns.water >= 99.5 ? "목이 마르지 않습니다" : "한 잔 마십니다";
    d.onclick = () => waterAct("drink");
    row.appendChild(d);
    const p = document.createElement("button");
    p.id = "wtPut";
    p.textContent = "생수병 넣기 (가진 것 " + have + ")";
    p.disabled = !have || w.wb >= w.cap;
    p.dataset.tip = !have ? "생수병이 없습니다 — 밥집에서 사거나 판에서" : w.wb >= w.cap ? "가득 찼습니다" : "보관함 · 가방 · 금고 · 냉장고에서 하나 꺼내 넣습니다";
    p.onclick = () => waterAct("put");
    row.appendChild(p);
    body.appendChild(row);
    putUI(body);
  }
  function waterAct(what) {
    const H = SX.home, s = SX.game.save, f = waterF;
    if (!f) return {
      ok: false
    };
    const r = what === "put" ? H.waterPut(f, n => stashHands().take(n)) : H.waterDrink(f, s);
    if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
    if (r.ok) {
      SX.audio.play(what === "drink" ? "cooler" : "coolerFill", {
        vol: .8
      });
      if (what === "drink" && SX.hub.gdStart) SX.hub.gdStart("drink", f, r);
      SX.game.persist();
      if (SX.hub.gdRefresh && SX.hub.level) SX.hub.gdRefresh(SX.hub.floor());
    } else SX.audio.play("denied");
    if (U.panelKind === "water") renderWater();
    U.hudDirty();
    return r;
  }
  U.waterAct = waterAct;
  const fridgeGrids = placedOnly => {
    const H = SX.home, s = SX.game.save;
    return (s.home && s.home.furn || []).filter(f => f && f.kind === "fridge" && (!placedOnly || f.placed)).sort((a, b) => (b.placed | 0) - (a.placed | 0)).map(f => H.gridOf(f));
  };
  function stashHands() {
    const g = SX.game.save.stash, P = SX.prog;
    const nm = want => q => q.it && P.nameOk(want, q.it.name);
    return {
      take(name) {
        const e = g.list.find(nm(name));
        if (e) return I.takeOne(g, e.it);
        const cg = SX.fishing ? [ SX.fishing.creelOf(SX.game.save), SX.fishing.creelOf(SX.game.save).bait ] : [];
        for (const kg of P.kitGrids(SX.game.save).concat(P.safeGrids(SX.game.save), fridgeGrids(false), cg)) {
          const f = kg.list.find(nm(name));
          if (f) return I.takeOne(kg, f.it);
        }
        return false;
      },
      count(name) {
        return P.haveIn(SX.game.save, name);
      },
      give(name) {
        if (I.isStack(I.def(name))) return !!I.stackGive([ g ], name, 1);
        const it = I.mk(name);
        return !!it && I.put(g, it);
      },
      giveFood(name) {
        const it = I.mk(name);
        if (!it) return false;
        for (const fg of fridgeGrids(true)) if (I.put(fg, it)) return "fridge";
        return I.put(g, it) ? "stash" : false;
      },
      price(name) {
        const it = I.mk(name);
        return it ? I.sellValue(it, true) : 0;
      },
      room(names, food) {
        const gs = (food ? fridgeGrids(true) : []).concat([ g ]), keep = gs.map(q => q.list.slice());
        let ok = true;
        for (const n of names) {
          if (I.isStack(I.def(n)) && gs.some(q => I.stackIn(q, n))) continue;
          const it = I.mk(n);
          if (!it || !gs.some(q => I.put(q, it))) {
            ok = false;
            break;
          }
        }
        gs.forEach((q, k) => {
          q.list = keep[k];
        });
        return ok;
      }
    };
  }
  async function bountyAct(slot, what) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on();
    if (!s.story) s.story = P.stNew();
    let r;
    if (on) r = await SX.net.storyAct("bn:" + slot, what); else {
      r = P.stAct(s.story, s, "bn:" + slot, what, stashHands());
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    SX.audio.play(r && r.ok ? what === "claim" ? "buy" : "paper" : "denied");
    if (U.panelKind === "shop") renderShop();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.bountyAct = bountyAct;
  async function progAct(kind, id, amt) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on();
    let r;
    if (kind === "d" || kind === "c" || kind === "e") {
      if (!s.daily) s.daily = P.dNew();
      if (!s.eg) s.eg = P.egNew();
      if (kind === "c" && (P.rById(id) || {}).food) {
        SX.audio.play("denied");
        const rc0 = P.rById(id), m0 = (rc0.heat ? "셸터 가스레인지" : "셸터 조리대") + "에서 만듭니다";
        SX.log(m0, "bad");
        return {
          ok: false,
          msg: m0
        };
      }
      if (on) r = kind === "d" ? await SX.net.dailyClaim(id) : kind === "c" ? await SX.net.craft(id) : await SX.net.egStep(amt); else {
        r = kind === "d" ? P.dClaim(s.daily, s, id, Date.now()) : kind === "c" ? P.craft(s.fac || P.fNew(), s, id, stashHands()) : !P.stMainDone(s.story) ? {
          ok: false,
          msg: "아직 이릅니다 — 장터 사람들의 이야기를 먼저 끝내 주십시오"
        } : P.egStep(s.eg, s, stashHands(), undefined, amt);
        if (r.msg) SX.log((r.ok ? "📜 " : "") + r.msg, r.ok ? "good" : "bad");
        if (r.ok) SX.game.persist();
      }
      SX.audio.play(r && r.ok ? "buy" : "denied");
      renderShop();
      U.hudDirty();
      return r;
    }
    if (on) r = kind === "q" ? await SX.net.questClaim(id) : kind === "fb" ? await SX.net.facBuild(id) : kind === "fs" || kind === "fsk" ? await SX.net.facSell(id, kind === "fsk") : await SX.net.facClaim(id, kind === "fck"); else {
      r = kind === "q" ? P.claim(s.quests, s, id, stashHands()) : kind === "fb" ? P.facBuild(s.fac, s, id, Date.now(), stashHands()) : kind === "fs" || kind === "fsk" ? P.facSell(s.fac, s, id, Date.now(), stashHands(), null, kind === "fsk") : P.facClaim(s.fac, s, id, Date.now(), stashHands(), null, kind === "fck");
      if (r.msg) SX.log((r.ok ? "📜 " : "") + r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    SX.audio.play(r && r.ok ? "buy" : "denied");
    if (r && r.ok && SX.settle && kind !== "q" && kind !== "fb" && kind !== "fs" && kind !== "fsk") SX.settle.facGot(r.msg);
    renderShop();
    U.hudDirty();
  }
  let egBarWas = null;
  function questShop() {
    const P = SX.prog, s = SX.game.save, st = s.quests || P.qNew(), cur = P.current(st);
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    col.innerHTML = `${U.qm("")}${st.done.length}/${P.QUESTS.length}</span><span class="qTgSlot"></span></span></h3>`;
    const keys = [], tg = (r, key) => {
      keys.push(key);
      if (qHid(key[0], key.slice(2))) r.classList.add("qOff");
      r.insertAdjacentHTML("beforeend", qTgHtml(key));
    };
    col.onclick = e => {
      qTgClick(e, renderShop);
    };
    const L = document.createElement("div");
    L.className = "list alignList questList";
    L.style.flex = "1";
    L.style.setProperty("--alc", "1fr auto auto auto");
    const hd = t => {
      const h = document.createElement("div");
      h.className = "small secHd";
      h.textContent = t;
      L.appendChild(h);
    };
    {
      const st = s.story || P.stNew(), sh = stHands(), main = P.stMain(), nowS = P.stNow(st, sh);
      hd("" + P.stCountText(st) + "");
      const li = (m, state) => {
        const r = document.createElement("div");
        r.className = "li";
        const who = P.ST_WHO[m.who] || "";
        r.innerHTML = `<span class="nm">${m.main ? "★" : "☆"} 「${esc(m.name)}」 <span class="small">${esc(stKindText(m))} · ${esc(who)}</span><br><span class="small">${state === "accept" ? esc("" + who + "") : state === "claim" ? "<b class='good'>" + esc("" + who + "") + "</b>" : esc(m.brief) + (stProgHtml(m) ? " · " + stProgHtml(m) : "")}</span></span><span class="pr">${state === "accept" ? "" : esc(stRewardText(m))}</span>`;
        tg(r, "s:" + m.id);
        {
          const sb = document.createElement("button");
          sb.disabled = true;
          sb.className = "qState" + (state === "claim" ? " good" : "");
          sb.textContent = state === "accept" || state === "pick" ? "" : state === "claim" ? "" : "";
          sb.dataset.tip = state === "pick" ? m.brief : state === "accept" ? "" + who + "" : state === "claim" ? "" + who + "" : "" + who + "";
          r.appendChild(sb);
        }
        L.appendChild(r);
      };
      if (nowS) li(nowS.m, nowS.state); else {
        const r = document.createElement("div");
        r.className = "li";
        r.innerHTML = ``;
        L.appendChild(r);
      }
      for (const m of P.STORY) if (!m.main && P.stActive(st, m.id)) li(m, P.stReady(st, m, sh) ? "claim" : "wait");
    }
    if (P.bnOpen && P.bnOpen(s.story || P.stNew())) {
      const nB = P.bnCount(s.story), nextB = 5 - nB % 5, bonusB = P.bnBonus(nB + nextB);
      hd("" + nB + "" + (bonusB ? " · " + nextB + "" + bonusB : ""));
      for (const c of P.bnList(s.story)) {
        const r = document.createElement("div");
        r.className = "li";
        r.innerHTML = `<span class="nm">💰 「${esc(c.name)}」<br><span class="small">${esc(c.brief)} · <b>${c.p}/${c.need}</b></span></span><span class="pr">${won(c.money)}</span>`;
        const b = document.createElement("button");
        b.textContent = c.ready ? "" : "";
        b.disabled = !c.ready;
        b.dataset.bn = c.slot;
        b.onclick = () => bountyAct(c.slot, "claim");
        r.appendChild(b);
        if (!c.ready) {
          const x = document.createElement("button");
          x.textContent = "";
          x.dataset.tip = "" + won(P.BN_SKIP);
          x.dataset.bnSkip = c.slot;
          x.onclick = () => U.ask("", "「" + esc(c.name) + "", P.BN_SKIP, () => bountyAct(c.slot, "skip"));
          r.appendChild(x);
        }
        L.appendChild(r);
      }
    }
    const now = Date.now(), msLeft = (P.dayKey(now) + 1) * 864e5 - 9 * 36e5 - now, hLeft = Math.max(0, Math.floor(msLeft / 36e5)), mLeft = Math.max(0, Math.floor(msLeft / 6e4) % 60);
    hd("" + hLeft + "" + mLeft + "");
    if (SX.week && SX.week.hubRow) SX.week.hubRow(L, now);
    for (const e of P.dState(s.daily, now)) {
      const r = document.createElement("div");
      r.className = "li";
      const ready = e.prog >= e.q.n && !e.done;
      r.innerHTML = `<span class="nm">${e.weekly ? "" : ""} — 「${esc(e.q.name)}」<br><span class="small">${esc(e.q.desc)} · <b>${e.prog}/${e.q.n}</b></span></span><span class="pr">${won(e.q.money)}</span>`;
      const b = document.createElement("button");
      b.textContent = e.done ? "" : ready ? "" : "";
      b.disabled = !ready;
      b.onclick = () => progAct("d", e.q.id);
      r.appendChild(b);
      L.appendChild(r);
    }
    const eg = s.eg || P.egNew(), step = P.egOf(eg.n | 0, s.story);
    hd("" + (eg.won ? "" + eg.won : ""));
    {
      const r = document.createElement("div");
      r.className = "li";
      if (!P.stMainDone(s.story)) r.innerHTML = `${won(P.egTotal(s.story))}`; else if (!step) r.innerHTML = ``; else {
        const lack = P.egLack(eg, s), have = n => P.countIn(s.stash, n);
        r.innerHTML = `<span class="nm">🚁 ${eg.n + 1}/${P.EG.length} 「${esc(step.name)}」<br><span class="small">${esc(step.desc)}<br>${step.items.map(([n, c]) => esc(n) + " <b>" + Math.min(c, have(n)) + "/" + c + "</b>").join(" · ")}<br>💰 ${esc("" + step.pay)}</span></span><span class="pr">${won(step.money)}</span>`;
        {
          const paid = Math.min(P.egIn(eg), step.money), rem = P.egRemain(eg, s.story), pct = step.money > 0 ? Math.min(100, paid / step.money * 100) : 100;
          const pay = document.createElement("div");
          pay.className = "egPay";
          const bar = document.createElement("div");
          bar.className = "egBar";
          bar.innerHTML = `<i></i><b>${won(paid)} / ${won(step.money)}</b>`;
          const fill = bar.firstChild, key = (eg.n | 0) + ":" + step.money, from = egBarWas && egBarWas.k === key ? egBarWas.p : pct;
          fill.style.width = from + "%";
          if (from !== pct) requestAnimationFrame(() => requestAnimationFrame(() => {
            fill.style.width = pct + "%";
          }));
          egBarWas = {
            k: key,
            p: pct
          };
          pay.appendChild(bar);
          for (const [t, v] of [ [ "", 1e6 ], [ "", 1e7 ], [ "", "all" ] ]) {
            const pb = document.createElement("button");
            pb.className = "egPut";
            pb.textContent = t;
            pb.disabled = !rem || (+s.money || 0) < (v === "all" ? 1 : Math.min(v, rem));
            pb.dataset.tip = !rem ? "" : "";
            pb.onclick = () => progAct("e", null, v);
            pay.appendChild(pb);
          }
          r.querySelector(".nm").appendChild(pay);
        }
        const b = document.createElement("button");
        b.textContent = lack ? "" : "";
        b.disabled = !!lack;
        b.dataset.tip = lack || "";
        b.onclick = () => U.ask("" + step.name, esc(step.desc) + "<br>" + esc(step.items.map(([n, c]) => n + " " + c).join(" · ")) + "" + esc("" + step.pay), P.egRemain(eg, s.story), () => progAct("e"));
        r.appendChild(b);
      }
      L.appendChild(r);
    }
    hd("");
    const open = P.open(st), pairs = [];
    for (const t of Object.keys(open)) {
      if (!open[t].length) pairs.push([ t, null ]); else for (const q of open[t]) pairs.push([ t, q ]);
    }
    for (const [t, q] of pairs) {
      const r = document.createElement("div");
      r.className = "li";
      if (!q) {
        r.innerHTML = `<span class="nm">${esc(P.TRADERS[t])}`;
        L.appendChild(r);
        continue;
      }
      const k = P.QUESTS.filter(x => x.t === t).indexOf(q) + 1, pr = P.progress(st, s, q), ready = pr >= q.n;
      const what = P.MIS && P.MIS[q.kind] ? P.misWhat(q) : q.kind === "fetch" ? q.item + " " + q.n + "" : q.kind === "kill" ? {
        scav: "",
        zombie: "",
        boss: ""
      }[q.what] + " " + q.n + (q.b ? " · " + bName(q.b) : "") : bName(q.b) + (q.night ? "" : "") + "" + q.n + "";
      r.innerHTML = `<span class="nm">${esc(P.TRADERS[t])} ${k}/${P.QUESTS.filter(x => x.t === t).length} — 「${esc(q.name)}」<br><span class="small">${esc(q.desc)}<br>${esc(what)} · <b>${pr}/${q.n}</b></span></span>\n        <span class="pr">${won(q.money)}${q.items ? `<br><span class="small">+ ${esc(q.items.join(", "))}</span>` : ""}</span>`;
      const b = document.createElement("button");
      b.textContent = ready ? "" : "";
      b.disabled = !ready;
      b.onclick = () => progAct("q", q.id);
      tg(r, "q:" + q.id);
      r.appendChild(b);
      L.appendChild(r);
    }
    {
      const sl = col.querySelector(".qTgSlot");
      if (sl) sl.outerHTML = qTgAll(keys);
    }
    col.appendChild(L);
    return col;
  }
  const bName = id => {
    const b = SX.data.buildings.find(x => x.id === id);
    return b ? b.name : "어디든";
  };
  U.GYM = [ {
    id: "str",
    name: "역기",
    stat: "근력",
    get desc() {
      return "[Space] 한 번에 한 번 들어 올립니다. 25초 안에 " + U.gymNeed("str") + "번이면 성공.";
    },
    fx: v => "무게 상한 " + Math.round((30 + 6 * v) * 10) / 10 + "kg"
  }, {
    id: "st",
    name: "러닝머신",
    stat: "체력",
    get desc() {
      return "러닝머신 · 실내 자전거 — [A] [D] 를 번갈아 눌러 " + U.gymNeed("st") + "번. 1.5초 멈추면 실패.";
    },
    fx: v => "스태미나 " + Math.round((100 + 12 * v) * 10) / 10
  }, {
    id: "run",
    name: "줄넘기",
    stat: "지구력",
    get desc() {
      return "줄이 발밑(초록)일 때 [Space]. " + U.gymNeed("run") + "번이면 성공, 엉뚱한 때 눌러 헛발 5번이면 실패(그냥 보낸 줄은 안 셉니다).";
    },
    fx: v => "달리기 소모 " + Math.round(100 - 8 * v) + "%"
  }, {
    id: "hit",
    name: "샌드백",
    stat: "타격",
    get desc() {
      return "되돌아오는 샌드백이 가운데(초록)일 때 [Space]·좌클릭. " + U.gymNeed("hit") + "번이면 성공, 엉뚱한 때 쳐서 헛손질 5번이면 실패(그냥 보낸 건 안 셉니다).";
    },
    fx: v => "근접 치명타 +" + Math.round(v * 10) / 10 + "%p"
  } ];
  U.GYM_FEE = 25e4;
  U.GYM_STEP = .1;
  const bodyLv = id => {
    const b = SX.game.save.body || {};
    return Math.max(0, Math.min(5, +b[id] || 0));
  };
  U.GYM_EASE = .9;
  U.GYM_NEED = {
    st: 40,
    str: 10,
    run: 12,
    hit: 10
  };
  U.gymMul = id => {
    const b = SX.game && SX.game.save && SX.game.save.body || {}, v = Math.max(0, Math.min(5, +b[id] || 0));
    return Math.pow(U.GYM_EASE, Math.floor(v * 10 + 1e-6) / 10);
  };
  U.gymNeed = id => Math.max(1, Math.round((U.GYM_NEED[id] || 1) * U.gymMul(id)));
  U.gymEaseTxt = id => {
    const n = U.gymNeed(id), pct = Math.round((1 - U.gymMul(id)) * 100);
    return "이번 운동: " + n + "번" + (pct > 0 ? "(단계 보탬 −" + pct + "%)" : "(단계가 오르면 줄어듭니다)");
  };
  U.gymPay = function(id) {
    const s = SX.game.save;
    if (!U.GYM.some(g => g.id === id)) return {
      ok: false,
      msg: "없는 기구"
    };
    if (bodyLv(id) >= 5) return {
      ok: false,
      msg: "이미 끝 단계"
    };
    if (s.money < U.GYM_FEE) return {
      ok: false,
      msg: "돈이 모자랍니다"
    };
    s.money -= U.GYM_FEE;
    SX.game.persist();
    SX.ui.hudDirty();
    return {
      ok: true
    };
  };
  U.gymPayThen = function(id, cb) {
    const N = SX.net, fin = (ok, msg) => {
      if (!ok) {
        if (msg) SX.log(msg, "bad");
        SX.audio.play("denied");
      }
      if (cb) cb(!!ok);
    };
    if (!(N && N.on && N.on() && N.gym)) {
      const r = U.gymPay(id);
      fin(r.ok, r.msg);
      return;
    }
    if (!U.GYM.some(g => g.id === id)) return fin(false, "없는 기구");
    if (bodyLv(id) >= 5) return fin(false, "이미 끝 단계");
    if (SX.game.save.money < U.GYM_FEE) return fin(false, "돈이 모자랍니다");
    (async () => {
      for (let k = 0; k < 60 && N.busy; k++) await new Promise(r => setTimeout(r, 100));
      let r = null;
      try {
        r = await N.gym(id);
      } catch (e) {
        r = null;
      }
      if (r && r.ok) {
        SX.ui.hudDirty();
        fin(true);
        return;
      }
      fin(false, N.unlogged(r) ? r.msg : null);
    })();
  };
  U.gymApply = function(id, ok) {
    const s = SX.game.save, b = s.body || (s.body = {
      st: 0,
      str: 0,
      run: 0,
      last: {}
    });
    if (!ok) return {
      ok: false,
      lv: bodyLv(id)
    };
    b[id] = Math.min(5, Math.round((bodyLv(id) + U.GYM_STEP) * 1e12) / 1e12);
    SX.game.persist();
    SX.ui.hudDirty();
    return {
      ok: true,
      lv: b[id]
    };
  };
  U.gymGame = function(id) {
    if (id === "str") {
      const g = {
        id,
        t: 0,
        pos: 0,
        dir: 1,
        tries: 0,
        hits: 0,
        done: false,
        win: false,
        flash: 0,
        speed: 1.35,
        tick(dt) {
          if (g.done) return;
          g.t += dt;
          g.pos += g.dir * g.speed * dt;
          if (g.pos >= 1) {
            g.pos = 1;
            g.dir = -1;
          }
          if (g.pos <= 0) {
            g.pos = 0;
            g.dir = 1;
          }
          g.flash = Math.max(0, g.flash - dt);
        },
        press(key) {
          if (g.done || key !== "Space") return;
          g.tries++;
          const hit = g.pos >= .42 && g.pos <= .58;
          if (hit) g.hits++;
          g.flash = .25;
          g.last = hit;
          g.speed += .12;
          if (g.hits >= 5) {
            g.done = true;
            g.win = true;
          } else if (g.tries >= 6) {
            g.done = true;
            g.win = false;
          }
        }
      };
      return g;
    }
    if (id === "st") {
      const g = {
        id,
        t: 0,
        speed: .6,
        next: "KeyA",
        done: false,
        win: false,
        need: 12,
        flash: 0,
        tick(dt) {
          if (g.done) return;
          g.t += dt;
          g.speed -= dt * (.28 + g.t * .02);
          g.flash = Math.max(0, g.flash - dt);
          if (g.speed <= 0) {
            g.speed = 0;
            g.done = true;
            g.win = false;
          }
          if (g.t >= g.need) {
            g.done = true;
            g.win = true;
          }
        },
        press(key) {
          if (g.done) return;
          if (key === g.next) {
            g.speed = Math.min(1, g.speed + .11);
            g.next = key === "KeyA" ? "KeyD" : "KeyA";
            g.flash = .15;
          } else if (key === "KeyA" || key === "KeyD") {
            g.speed = Math.max(0, g.speed - .05);
          }
        }
      };
      return g;
    }
    const g = {
      id,
      t: 0,
      phase: 0,
      period: .9,
      jumps: 0,
      misses: 0,
      done: false,
      win: false,
      flash: 0,
      jumpT: 0,
      passed: false,
      tick(dt) {
        if (g.done) return;
        g.t += dt;
        g.phase += dt / g.period;
        g.jumpT = Math.max(0, g.jumpT - dt);
        g.flash = Math.max(0, g.flash - dt);
        if (g.phase >= 1) {
          g.phase -= 1;
          if (!g.passed) {
            g.misses++;
            g.flash = .3;
            g.last = false;
            if (g.misses > 3) {
              g.done = true;
              g.win = false;
            }
          }
          g.passed = false;
          g.period = Math.max(.55, g.period - .02);
        }
      },
      press(key) {
        if (g.done || key !== "Space" || g.passed) return;
        const near = g.phase >= .86 || g.phase <= .1;
        if (near) {
          g.passed = true;
          g.jumps++;
          g.jumpT = .25;
          g.flash = .15;
          g.last = true;
          if (g.jumps >= 15) {
            g.done = true;
            g.win = true;
          }
        } else {
          g.misses++;
          g.flash = .3;
          g.last = false;
          if (g.misses > 3) {
            g.done = true;
            g.win = false;
          }
        }
      }
    };
    return g;
  };
  let gymRun = null;
  function gymStop() {
    if (!gymRun) return;
    cancelAnimationFrame(gymRun.raf);
    removeEventListener("keydown", gymRun.key, true);
    gymRun = null;
  }
  U.gymPlaying = () => !!gymRun;
  function gymStart(id, host) {
    gymStop();
    const g = U.gymGame(id), cv = document.createElement("canvas");
    cv.width = 420;
    cv.height = 120;
    cv.className = "gymCv";
    host.innerHTML = "";
    host.appendChild(cv);
    const msg = document.createElement("div");
    msg.className = "small";
    host.appendChild(msg);
    const x = cv.getContext("2d");
    let last = performance.now();
    const key = e => {
      if (!gymRun || gymRun.g !== g) return;
      if ([ "Space", "KeyA", "KeyD" ].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        g.press(e.code);
      }
    };
    addEventListener("keydown", key, true);
    const draw = () => {
      x.clearRect(0, 0, cv.width, cv.height);
      x.fillStyle = "#15171a";
      x.fillRect(0, 0, cv.width, cv.height);
      x.font = "14px sans-serif";
      x.fillStyle = "#ddd";
      if (id === "str") {
        x.fillStyle = "#2a2d33";
        x.fillRect(20, 50, 380, 20);
        x.fillStyle = "#4a8a3a";
        x.fillRect(20 + 380 * .42, 50, 380 * .16, 20);
        x.fillStyle = g.flash > 0 ? g.last ? "#ffd26a" : "#e0514a" : "#eee";
        x.fillRect(20 + 380 * g.pos - 3, 42, 6, 36);
        x.fillStyle = "#ddd";
        x.fillText("역기  " + g.hits + " / 5 (시도 " + g.tries + "/6)  — 초록 칸에서 [Space]", 20, 30);
      } else if (id === "st") {
        x.fillStyle = "#2a2d33";
        x.fillRect(20, 50, 380, 20);
        x.fillStyle = g.speed < .25 ? "#e0514a" : "#4a8a3a";
        x.fillRect(20, 50, 380 * g.speed, 20);
        x.fillStyle = "#ddd";
        x.fillText("러닝머신  " + Math.max(0, g.need - g.t).toFixed(1) + "초 남음 — 다음 키 [" + (g.next === "KeyA" ? "A" : "D") + "]", 20, 30);
        x.fillStyle = g.flash > 0 ? "#ffd26a" : "#666";
        x.fillText(g.next === "KeyA" ? "A  ▶" : "◀  D", 20, 100);
      } else {
        const cx = 210, cy = 70, r = 40, a = g.phase * Math.PI * 2 + Math.PI / 2;
        x.strokeStyle = "#555";
        x.beginPath();
        x.arc(cx, cy, r, 0, 6.283);
        x.stroke();
        x.fillStyle = "#ddd";
        x.fillRect(cx - 6, cy - 18 - (g.jumpT > 0 ? 12 : 0), 12, 26);
        x.strokeStyle = g.flash > 0 ? g.last ? "#ffd26a" : "#e0514a" : "#8fd0ea";
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(cx - r, cy);
        x.quadraticCurveTo(cx, cy + Math.sin(a) * r * 1.4, cx + r, cy);
        x.stroke();
        x.lineWidth = 1;
        x.fillStyle = "#ddd";
        x.fillText("줄넘기  " + g.jumps + " / 15  · 헛발 " + g.misses + "/3 — 줄이 발밑에 올 때 [Space]", 20, 22);
      }
    };
    const loop = now => {
      const dt = Math.min(.05, (now - last) / 1e3);
      last = now;
      g.tick(dt);
      draw();
      if (g.done) {
        const r = U.gymApply(id, g.win);
        const gd = U.GYM.find(q => q.id === id);
        msg.innerHTML = g.win ? `<b class="good">성공 — ${esc(gd.stat)} ${r.lv.toFixed(1)}단계 · ${esc(gd.fx(r.lv))}</b>` : `<b class="bad">실패 — 다음에 다시</b>`;
        SX.log(g.win ? "🏋 " + gd.name + " 성공 — " + gd.stat + " " + r.lv.toFixed(1) + "단계 · " + gd.fx(r.lv) : "🏋 " + gd.name + " 실패", g.win ? "good" : "bad");
        SX.audio.play(g.win ? "buy" : "denied");
        gymStop();
        setTimeout(() => {
          if (U.panelKind === "shop") renderShop();
        }, 1400);
        return;
      }
      gymRun.raf = requestAnimationFrame(loop);
    };
    gymRun = {
      g,
      cv,
      key,
      raf: requestAnimationFrame(loop)
    };
  }
  function gymShop() {
    const s = SX.game.save, f = s.fights || {
      wins: 0,
      losses: 0
    };
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    col.innerHTML = `<h3><span>헬스장</span><span class="small">기구마다 이용료 ${won(U.GYM_FEE)} · 미니게임에 성공하면 0.1단계(최대 5) · 주먹 싸움 ${f.wins}승 ${f.losses}패 → 근접 치명타 ${(A.meleeCrit() * 100).toFixed(2)}%</span></h3>`;
    const L = document.createElement("div");
    L.className = "list";
    L.style.flex = "1";
    const host = document.createElement("div");
    host.className = "gymHost";
    for (const g of U.GYM) {
      const lv = bodyLv(g.id);
      const r = document.createElement("div");
      r.className = "li";
      r.innerHTML = `<span class="nm">${esc(g.name)} — ${esc(g.stat)} <b>${lv.toFixed(1)}/5</b> · <span class="small">${esc(g.fx(lv))}</span><br><span class="small">${esc(g.desc)}</span></span>`;
      const bt = document.createElement("button");
      bt.textContent = lv >= 5 ? "끝 단계" : "이용 " + won(U.GYM_FEE);
      bt.disabled = lv >= 5 || s.money < U.GYM_FEE || !!gymRun;
      bt.onclick = () => {
        if (gymRun) return;
        U.gymPayThen(g.id, ok => {
          if (!ok) return;
          SX.audio.play("click");
          for (const b2 of L.querySelectorAll("button")) b2.disabled = true;
          gymStart(g.id, host);
        });
      };
      r.appendChild(bt);
      L.appendChild(r);
    }
    col.appendChild(L);
    col.appendChild(host);
    return col;
  }
  const npcBtn = (id, label, main, dis) => `<button id="${id}"${main ? ' class="big"' : ""}${dis ? " disabled" : ""}>${label}</button>`;
  function npcWin(kind, name, bodyId, inner, slots, cls) {
    U.open(kind, `<div class="win npcWin${cls ? " " + cls : ""}">${header(esc(name))}<div class="body col" id="${bodyId}">${inner}</div><div class="winFoot npcFoot">${[ 0, 1, 2 ].map(i => slots[i] ? slots[i].replace(/^<button/, `<button data-slot="${i}"`) : `<span class="npcGap" data-slot="${i}"></span>`).join("")}</div></div>`);
    const ft = panel.querySelector(".npcFoot");
    if (!ft) return;
    if (SX.trDom) SX.trDom(ft);
    for (const b of ft.querySelectorAll("button")) {
      if (b.scrollWidth <= b.clientWidth + 1) continue;
      const sp = document.createElement("span");
      while (b.firstChild) sp.appendChild(b.firstChild);
      b.appendChild(sp);
      let f = 1;
      while (b.scrollWidth > b.clientWidth + 1 && f > .7) {
        f -= .05;
        sp.style.fontSize = f.toFixed(2) + "em";
      }
    }
  }
  U.openTalk = function(civ) {
    const s = SX.game.save, f = s.fights || (s.fights = {
      wins: 0,
      losses: 0
    });
    const line = civ.line || (civ.line = SX.hub.civLine(civ));
    const main = civ.post ? npcBtn("talkQuest", "의뢰 보기", 1) : civ.shop ? npcBtn("talkShop", "가게 보기", 1) : civ.gym || civ.angler ? "" : npcBtn("talkFight", "한판 붙자(주먹)", 1);
    npcWin("talk", civ.name, "talkBody", `<p class="story">"${esc(line)}"</p>\n      ${civ.shop ? "" : `<p class="small">주먹 싸움 전적 ${f.wins}승 ${f.losses}패 · 근접 치명타 ${(A.meleeCrit() * 100).toFixed(2)}%</p>`}`, [ main, npcBtn("talkMore", "다른 얘기"), npcBtn("talkBye", "그만") ]);
    if ($("talkQuest")) $("talkQuest").onclick = () => {
      U.closePanel();
      U.openShop("quest");
    };
    if ($("talkShop")) $("talkShop").onclick = () => {
      U.closePanel();
      if (civ.shop === "fishShop") SX.fishing.openShop(); else U.openShop(civ.shop);
    };
    if ($("talkFight")) $("talkFight").onclick = () => {
      U.closePanel();
      SX.hub.startFight(civ);
    };
    $("talkMore").onclick = () => {
      civ.line = SX.hub.civLine(civ, line);
      U.openTalk(civ);
    };
    $("talkBye").onclick = () => U.closePanel();
  };
  function kitCount(n) {
    let c = 0;
    for (const g of I.kitGrids(SX.game.kit)) for (const e of g.list) if (e.it.name === n) c++;
    return c;
  }
  const stHands = () => ({
    count: n => SX.prog.haveIn(SX.game.save, n)
  });
  let needMemo = {
    at: -1e9,
    list: []
  };
  const qHid = (k, id) => !!(SX.qhide && SX.qhide.has(k, id));
  U.needList = function() {
    const now = performance.now();
    if (now - needMemo.at < 400) return needMemo.list;
    const s = SX.game.save, P = SX.prog, map = new Map;
    const add = (name, n, why) => {
      if (!name || !(n > 0)) return;
      const q = map.get(name) || {
        name,
        n: 0,
        why: []
      };
      q.n += n;
      if (q.why.indexOf(why) < 0) q.why.push(why);
      map.set(name, q);
    };
    try {
      const st = s.story;
      if (st && st.act) for (const id of Object.keys(st.act)) {
        const m = P.stById(id);
        if (!m || qHid("s", m.id)) continue;
        const o = m.obj;
        if (o.kind === "fetch") for (const [n, c] of o.items) add(n, c, "이야기"); else if (o.kind === "find") add(o.item, 1, "이야기");
      }
      if (s.quests && P.current) {
        for (const q of P.openList ? P.openList(s.quests) : Object.values(P.current(s.quests))) {
          if (q && q.kind === "fetch" && !qHid("q", q.id)) add(q.item, q.n, "의뢰");
        }
      }
      if (P.stMainDone && P.EG && P.stMainDone(s.story)) {
        const step = P.egOf((s.eg && s.eg.n) | 0, s.story);
        if (step) for (const [n, c] of step.items) add(n, c, "작전");
      }
    } catch (e) {}
    const h = stHands(), list = [ ...map.values() ].map(q => Object.assign(q, {
      have: h.count(q.name)
    }));
    needMemo = {
      at: now,
      list
    };
    return list;
  };
  U.needShort = name => U.needList().some(q => q.name === name && q.have < q.n);
  U.needDirty = () => {
    needMemo.at = -1e9;
    trkMemo.at = -1e9;
  };
  let trkMemo = {
    at: -1e9,
    list: []
  };
  const TK_KILL = {
    scav: "약탈자",
    zombie: "감염체",
    boss: "약탈자 두목"
  };
  const tkAt = b => b && b[0] !== "*" ? bName(b) + " " : "";
  const LIVE_K = {
    kill: 1,
    named: 1,
    search: 1,
    disarm: 1
  };
  const tkRaid = () => {
    const G = SX.game, s = G.save, Rd = SX.raid;
    if (G.state === "raid") {
      const b = Rd && Rd.level && Rd.level.building, gs = G.stats;
      if (!b || b.train || Rd.tutMode || !gs) return null;
      return {
        id: Rd.seed,
        b: b.id,
        tod: Rd.tod,
        win: false,
        via: "",
        kills: {
          scav: gs.kScav | 0,
          zombie: gs.kZombie | 0,
          boss: gs.bossKills | 0,
          named: gs.named | 0
        },
        searched: gs.searched | 0,
        disarm: gs.disarm | 0,
        live: true
      };
    }
    return s && s.lastRaid && s.lastRaid.id != null && s.lastRaid.b && s.lastRaid.b !== "train" ? s.lastRaid : null;
  };
  const tkLive = (s, P) => {
    const raid = tkRaid(), add = new Map;
    if (!raid) return {
      raid,
      add
    };
    try {
      if (s.quests && P.preview && s.quests.lastId !== raid.id) for (const x of P.preview(s.quests, raid)) if (x && x.q && x.q.kind === "kill" && x.add > 0) add.set("q:" + x.q.id, x.add);
      if (s.story && P.stPreview && s.story.lastId !== raid.id) for (const x of P.stPreview(s.story, raid)) if (x && x.m && LIVE_K[x.m.obj.kind] && x.add > 0) add.set("s:" + x.m.id, x.add);
    } catch (e) {}
    return {
      raid,
      add
    };
  };
  const tkP = (pr, need, a) => a > 0 ? pr + "+" + a + "/" + need : pr + "/" + need;
  const tkQ = (lv, q, pr) => {
    const a = lv && lv.add.get("q:" + q.id) || 0;
    return {
      p: tkP(pr, q.n, a),
      full: a > 0 && pr + a >= q.n,
      fk: "q:" + q.id,
      lv: q.kind === "kill"
    };
  };
  let tkFull = new Set, tkFullId = null;
  function tkFullNote(raid, rows) {
    if (!raid || !raid.live) return;
    if (tkFullId !== raid.id) {
      tkFullId = raid.id;
      tkFull = new Set;
    }
    for (const q of rows) {
      if (!q.full || tkFull.has(q.fk)) continue;
      tkFull.add(q.fk);
      if (U.bigNote) U.bigNote("✓ 다 채웠습니다", q.t + " — 판이 끝나면 셉니다", 2600);
      if (SX.audio) SX.audio.play("confirm", {
        vol: .7
      });
    }
  }
  U.liveBump = function() {
    U.needDirty();
    U.hudDirty();
    const r = tkRaid();
    if (r && r.live && SX.feats && SX.feats.live) SX.feats.live(SX.game.save, {
      id: r.id,
      b: r.b,
      kZ: r.kills.zombie,
      kS: r.kills.scav,
      kB: r.kills.boss,
      kN: r.kills.named
    });
  };
  U.trackList = function() {
    const now = performance.now();
    if (now - trkMemo.at < 400) return trkMemo.list;
    const s = SX.game.save, P = SX.prog, out = [], lv = tkLive(s, P);
    try {
      const st = s.story, h = stHands();
      if (st && st.act) for (const id of Object.keys(st.act)) {
        const m = P.stById(id);
        if (!m || qHid("s", m.id)) continue;
        const o = m.obj, pr = P.stProg(st, m, h), need = P.stNeed(m), at = tkAt(o.b);
        if (pr >= need) {
          out.push({
            k: "s",
            t: "장터 " + (P.ST_WHO[m.who] || "") + "에게 가기",
            ok: true
          });
          continue;
        }
        const t = o.kind === "find" ? "「" + o.item + "」 줍기" + (at ? " · " + at.trim() : "") : o.kind === "fetch" ? o.items.map(q => q[0]).join(" · ") + " 가져가기" : o.kind === "kill" ? at + (TK_KILL[o.what] || "적") + " 쓰러뜨리기" : o.kind === "named" ? at + "전용 두목 쓰러뜨리기" : o.kind === "extract" ? at + (o.night ? "밤에 " : "") + "살아 나오기" : o.kind === "gain" ? "한 판에 " + won(o.v) + "어치 들고 나오기" : o.kind === "search" ? at + "상자 다 뒤지기" : o.kind === "disarm" ? "함정 풀기" : m.name;
        {
          const a = lv.add.get("s:" + m.id) || 0;
          out.push({
            k: "s",
            t,
            p: o.kind === "find" ? "" : tkP(pr, need, a),
            full: a > 0 && pr + a >= need,
            fk: "s:" + m.id,
            lv: !!LIVE_K[o.kind]
          });
        }
      }
      if (s.quests && P.current) {
        const qs = s.quests;
        for (const [tr, q] of P.openPairs ? P.openPairs(qs) : []) {
          if (!q || qHid("q", q.id)) continue;
          const pr = P.progress(qs, s, q), at = tkAt(q.b);
          if (pr >= q.n) {
            const rt = "시장 의뢰 탭에서 보상 받기 · " + P.TRADERS[tr];
            if (!out.some(o => o.t === rt)) out.push({
              k: "q",
              t: rt,
              ok: true
            });
            continue;
          }
          {
            const mr = SX.mis && SX.mis.trkRow ? SX.mis.trkRow(q, at, pr) : null;
            if (mr) {
              out.push(mr);
              continue;
            }
          }
          out.push({
            k: "q",
            t: q.kind === "fetch" ? q.item + " 넘기기" : q.kind === "kill" ? at + (TK_KILL[q.what] || "적") + " 쓰러뜨리기" : at + (q.night ? "밤에 " : "") + "살아 나오기",
            ...tkQ(lv, q, pr)
          });
        }
      }
      if (P.stMainDone && P.EG && P.stMainDone(st)) {
        const eg = s.eg || P.egNew(), step = P.egOf(eg.n | 0, st);
        if (!step) out.push({
          k: "e",
          t: "도심 지도 → 여의도 헬기장",
          ok: true
        }); else {
          const tot = step.items.reduce((a, q) => a + q[1], 0), got = step.items.reduce((a, q) => a + Math.min(q[1], h.count(q[0])), 0);
          out.push(got < tot ? {
            k: "e",
            t: "「" + step.name + "」 물자 모으기",
            p: got + "/" + tot
          } : P.egLack(eg, s) ? {
            k: "e",
            t: "「" + step.name + "」 돈 " + won(step.money) + " 모으기"
          } : {
            k: "e",
            t: "시장 의뢰 탭에서 「" + step.name + "」 넘기기",
            ok: true
          });
        }
      }
    } catch (e) {}
    const list = out.filter(q => q.ok).concat(out.filter(q => !q.ok));
    list.live = !!(lv.raid && lv.raid.live && out.some(q => q.lv && !q.ok));
    tkFullNote(lv.raid, out);
    trkMemo = {
      at: now,
      list
    };
    return list;
  };
  U.storyHands = stHands;
  U.storyFor = who => SX.prog.stFor(SX.game.save.story, who, stHands());
  U.storyMarks = function() {
    const P = SX.prog, st = SX.game.save.story, h = stHands(), out = {}, hs = SX.qhide && SX.qhide.any();
    const vis = who => {
      const r = {
        accept: null,
        wait: null
      };
      for (const m of P.STORY) {
        if (m.who !== who || P.stDone(st, m.id) || qHid("s", m.id)) continue;
        if (P.stActive(st, m.id)) {
          if (!P.stReady(st, m, h) && !r.wait) r.wait = m;
        } else if (P.stOpen(st, m) && (!m.lead || h.count(m.lead.item) > 0) && !r.accept) r.accept = m;
      }
      return r;
    };
    for (const who of Object.keys(P.ST_WHO)) {
      let r = P.stFor(st, who, h);
      if (!r.claim && hs) r = vis(who);
      if (r.claim) out[who] = "claim"; else if (r.accept) out[who] = "accept"; else if (r.wait) out[who] = "wait";
    }
    if (P.rsOpen && P.rsOpen(st, SX.game.save)) {
      const res = P.rsOf(st), owed = res.out.some(w => res.got.indexOf(w) < 0);
      for (const r of P.RESCUE) {
        if (out[r.who]) continue;
        const q = P.rsState(st, SX.game.save, r.who);
        if (q === "ready" && !res.cur) out[r.who] = "heli"; else if (q === "cur") out[r.who] = "wait";
      }
      if (!out.vet && (owed || !P.rsAllOut(st))) out.vet = owed ? "claim" : "heli";
    }
    return out;
  };
  const stRewardText = m => [ m.money ? won(m.money) : "", (m.items || []).join(", ") ].filter(Boolean).join(" + ");
  const stKindText = m => {
    const P = SX.prog;
    if (m.id === "pick") return "갈림길";
    if (m.side) {
      const S = P.stSideList(m.side);
      return "갈림길 " + (S.indexOf(m) + 1) + "/" + S.length;
    }
    const L = P.stMainBase();
    return m.main ? "본 줄거리 " + (L.indexOf(m) + 1) + "/" + L.length : "곁가지";
  };
  function stProgHtml(m) {
    const P = SX.prog, h = stHands(), o = m.obj;
    if (o.kind === "talk") return "";
    if (o.kind === "fetch") return o.items.map(([n, c]) => esc(n) + " <b>" + Math.min(c, h.count(n)) + "/" + c + "</b>").join(" · ");
    return "<b>" + P.stProg(SX.game.save.story, m, h) + "/" + P.stNeed(m) + "</b>";
  }
  U.storyProgHtml = stProgHtml;
  const findInSafe = n => {
    for (const g of SX.prog.safeGrids(SX.game.save)) {
      const e = g.list.find(q => q.it && q.it.name === n);
      if (e) return {
        grid: g,
        it: e.it
      };
    }
    return null;
  };
  async function storyAct(id, what) {
    const P = SX.prog, s = SX.game.save, m = P.stById(id), on = SX.net && SX.net.on();
    if (!m) return {
      ok: false,
      msg: "없는 임무"
    };
    if (!s.story) s.story = P.stNew();
    const need = what === "accept" ? m.lead ? [ [ m.lead.item, 1 ] ] : [] : m.obj.kind === "find" ? [ [ m.obj.item, 1 ] ] : m.obj.kind === "fetch" ? m.obj.items : [];
    for (const [n, c] of need) {
      let lack = c - P.countIn(s.stash, n);
      while (lack > 0) {
        const f = I.findInKit(SX.game.kit, n) || findInSafe(n);
        if (!f) break;
        I.take(f.grid, f.it);
        if (!I.put(s.stash, f.it)) {
          I.put(f.grid, f.it);
          SX.audio.play("denied");
          const r0 = {
            ok: false,
            msg: "보관함에 자리가 없습니다 — 넘길 물건을 옮길 수 없습니다"
          };
          SX.log(r0.msg, "bad");
          return r0;
        }
        lack--;
      }
    }
    let r;
    if (on) r = await SX.net.storyAct(id, what); else {
      r = P.stAct(s.story, s, id, what, stashHands());
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    const fin = !!(r && r.ok && (what === "claim" || m.obj.kind === "talk"));
    SX.audio.play(r && r.ok ? fin ? "confirm" : "paper" : "denied");
    if (SX.hub) SX.hub.markT = 0;
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.storyAct = storyAct;
  U.pickAsk = function(m) {
    const P = SX.prog, sd = P.SIDES && P.SIDES[m.side];
    if (!sd) return Promise.resolve(true);
    const c = sd.conf || {}, eg = SX.game.save.eg || P.egNew(), at = Object.keys(sd.eg || {}).map(Number)[0];
    const L = [ c.up, c.eg && !((eg.n | 0) > at) ? c.eg : "", c.fly ].filter(Boolean);
    const desc = `<span>${esc(c.head)}</span>` + L.map(t => `<br><span>· </span><span>${esc(t)}</span>`).join("");
    return new Promise(res => U.ask("갈림길 — " + sd.name, desc, 0, () => res(true), () => res(false), {
      q: "정하시겠습니까?",
      yes: "정한다",
      no: "다시 생각한다"
    }));
  };
  async function rescueAct(who, what) {
    const P = SX.prog, s = SX.game.save, on = SX.net && SX.net.on();
    if (!s.story) s.story = P.stNew();
    let r;
    if (on) r = await SX.net.storyAct("res:" + who, what); else {
      r = P.stAct(s.story, s, "res:" + who, what, stashHands());
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
      if (r.ok) SX.game.persist();
    }
    SX.audio.play(r && r.ok ? what === "gift" ? "confirm" : "buy" : "denied");
    if (SX.hub) SX.hub.markT = 0;
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.rescueAct = rescueAct;
  const rsSay = L => (L || []).map(l => /^\(.*\)$/.test(l) ? `<p class="story stAct">${esc(l)}</p>` : `<p class="story">"${esc(l)}"</p>`).join("");
  const rsFrame = (name, inner, main, mid, end) => npcWin("story", name, "storyBody", inner, [ main, mid, end ], "storyWin");
  const rsWarn = msg => {
    const e = $("storyBody");
    if (!e || !msg) return;
    let w = $("stWarn");
    if (!w) {
      w = document.createElement("p");
      w.id = "stWarn";
      w.className = "bad";
      e.appendChild(w);
    }
    w.textContent = msg;
    w.scrollIntoView({
      block: "nearest"
    });
  };
  U.openRescue = function(who, fb) {
    const P = SX.prog, s = SX.game.save, st = s.story || P.stNew();
    if (!P.rsOpen || !P.rsOpen(st, s)) return false;
    if (who === "vet") {
      U.openRescueBoard(fb);
      return true;
    }
    const state = P.rsState(st, s, who);
    if (state === "closed" || state === "out") return false;
    const r = P.rsBy(who), name = P.ST_WHO[who] || who, fee = P.rsFee(st), res = P.rsOf(st);
    const fbBtn = fb ? npcBtn("stFb", "그냥 얘기") : "";
    const wire = () => {
      if ($("stFb")) $("stFb").onclick = () => {
        U.closePanel();
        fb();
      };
      if ($("stBye")) $("stBye").onclick = () => U.closePanel();
    };
    if (state === "cur") {
      rsFrame(name, `<p class="story stAct">${esc("(" + name + " 은(는) 짐을 싸 두었습니다. 다음 헬기를 기다리고 있습니다.)")}</p>\n        <div class="stBox"><div><b>🚁 구출 작전 — 태우기로 했습니다</b></div><div class="small">여의도 헬기장에 출격하면 따라옵니다 · 살려서 같이 헬기에 타십시오(쓰러지면 다음에 다시 — 자리값은 이미 냈습니다)</div></div>`, "", fbBtn, npcBtn("stBye", "닫기"));
      wire();
      return true;
    }
    if (state === "lack") {
      rsFrame(name, `<p class="story stAct">(헬기에 한 자리가 있다고 말합니다.)</p><p class="story stAct">(고개를 젓습니다. 아직 여기서 끝내지 못한 일이 있는 눈치입니다.)</p>\n        <div class="stBox"><div><b>🚁 구출 작전</b> <span class="small">아직 태울 수 없습니다</span></div><div class="small">${P.rsLack(st, who).map(esc).join("<br>")}</div></div>`, "", fbBtn, npcBtn("stBye", "닫기"));
      wire();
      return true;
    }
    const other = res.cur && res.cur !== who ? P.ST_WHO[res.cur] || res.cur : null, poor = s.money < fee;
    rsFrame(name, `<p class="story stAct">(헬기에 한 자리가 있다고 말합니다.)</p>${rsSay(r.ask)}\n      <div class="stBox"><div><b>🚁 구출 작전 — ${esc(name)}</b></div>\n        <div class="small">여의도 헬기장까지 데려가 살려서 같이 헬기에 탑니다 · 한 번에 한 사람</div>\n        <div class="small">자리값 <span class="money">${won(fee)}</span> — 헬기가 한 번 더 뜨는 기름값과 초소 입막음 값</div>\n        ${other ? `<div class="bad">${esc("이미 " + other + " 을(를) 태우기로 했습니다 — 먼저 내보내 주십시오")}</div>` : poor ? `<div class="bad">${esc("돈이 모자랍니다 — " + won(fee - s.money) + " 더")}</div>` : ""}</div>`, npcBtn("stGo", "헬기에 태운다", 1, other || poor), fbBtn, npcBtn("stBye", "나중에"));
    wire();
    $("stGo").onclick = async () => {
      $("stGo").disabled = true;
      const q = await rescueAct(who, "pick");
      if (!q.ok) {
        $("stGo").disabled = false;
        rsWarn(q.msg);
        return;
      }
      rsFrame(name, `<p class="story stAct">${esc("(" + name + " 이(가) 짐을 싸기 시작합니다.)")}</p>\n        <div class="stBox done"><div><b>🚁 다음 헬기에 태우기로 했습니다</b></div><div class="small">도심 지도 → 여의도 헬기장에 출격하면 따라옵니다 · 총은 못 쏩니다 · 감염체가 붙으면 물립니다 · 살려서 같이 타십시오</div></div>`, "", "", npcBtn("stBye", "닫기"));
      wire();
    };
    return true;
  };
  U.openRescueBoard = function(fb) {
    const P = SX.prog, s = SX.game.save, st = s.story || P.stNew(), res = P.rsOf(st), N = P.RESCUE.length, all = P.rsAllOut(st);
    const txt = {
      out: "",
      cur: "",
      ready: "",
      lack: "",
      closed: ""
    };
    const rows = P.RESCUE.map(r => {
      const q = P.rsState(st, s, r.who), gift = q === "out" && res.got.indexOf(r.who) < 0;
      return `<div class="rsRow ${q}"><span>${esc(P.ST_WHO[r.who] || r.who)}</span><span class="small">${esc(q === "lack" ? P.rsLack(st, r.who)[0] : txt[q])}</span>${gift ? `<button data-gift="${esc(r.who)}` : ""}</div>`;
    }).join("");
    rsFrame("", `${rsSay(all ? P.RS_DONE : P.RS_INTRO.concat(P.rsSideLine ? P.rsSideLine(st) : []))}\n      <div class="stBox${all ? " done" : ""}${res.out.length}/${N}${all ? `` : `<div class="small">${esc(res.cur ? "" + (P.ST_WHO[res.cur] || res.cur) + "" : "" + won(P.rsFee(st)) + "")}</div>`}\n        <div class="rsList">${rows}</div></div>`, "", fb ? npcBtn("stFb", "") : "", npcBtn("stBye", ""));
    if ($("stFb")) $("stFb").onclick = () => {
      U.closePanel();
      fb();
    };
    $("stBye").onclick = () => U.closePanel();
    for (const b of document.querySelectorAll("#storyBody [data-gift]")) b.onclick = async () => {
      const who = b.dataset.gift, r = P.rsBy(who), name = P.ST_WHO[who] || who;
      b.disabled = true;
      const q = await rescueAct(who, "gift");
      if (!q.ok) {
        b.disabled = false;
        rsWarn(q.msg);
        return;
      }
      const got = [ q.money ? won(q.money) : "", (q.got || []).join(", ") ].filter(Boolean).join(" + ");
      rsFrame(name, `<p class="story stAct">${esc("(" + name + "")}</p>${rsSay(r.bye)}${esc(got)}`, "", "", npcBtn("stMore", ""));
      $("stMore").onclick = () => U.openRescueBoard(fb);
    };
  };
  U.openStory = function(who, fb, fbLabel, opt) {
    const P = SX.prog, r = U.storyFor(who), m = r.claim || r.accept || (opt && opt.noWait ? null : r.wait);
    if (!m) {
      if (fb) fb();
      return false;
    }
    const name = P.ST_WHO[who] || who, talk = m.obj.kind === "talk";
    const say = L => (L || []).map(l => /^\(.*\)$/.test(l) ? `<p class="story stAct">${esc(l)}</p>` : `<p class="story">"${esc(l)}"</p>`).join("");
    const box = (withProg, extra) => `<div class="stBox"><div><b>${m.main ? "★" : "☆"}${esc(m.name)}」</b> <span class="small">${esc(stKindText(m))}</span></div>\n      <div class="small">${esc(m.brief)}${withProg && stProgHtml(m) ? " · " + stProgHtml(m) : ""}</div>\n      ${stRewardText(m) ? `${esc(stRewardText(m))}</span></div>` : ""}${extra || ""}</div>`;
    const fbBtn = fb ? npcBtn("stFb", esc(fbLabel || "")) : "";
    const frame = (inner, main, end) => npcWin("story", name, "storyBody", inner, [ main, fbBtn, end ], "storyWin");
    const wire = () => {
      if ($("stFb")) $("stFb").onclick = () => {
        U.closePanel();
        fb();
      };
      if ($("stBye")) $("stBye").onclick = () => U.closePanel();
    };
    const busy = on => {
      const b = $("stGo");
      if (b) b.disabled = on;
    };
    const showDone = () => {
      const more = U.storyFor(who), again = !!(more.claim || more.accept);
      const lastMain = m.main && P.stMainDone(SX.game.save.story) && !P.stNow(SX.game.save.story, stHands());
      frame(`${say(talk ? [] : m.outro)}${esc(m.name)}${stRewardText(m) ? `${esc(stRewardText(m))}</span></div>` : ""}\n          ${m.unlock ? `<div class="good">${esc("" + bName(m.unlock) + "")}</div>` : ""}\n          ${lastMain ? `` : m.next ? `<div class="small">${esc("" + m.next)}</div>` : ""}</div>`, again ? npcBtn("stMore", "", 1) : "", npcBtn("stBye", ""));
      wire();
      if ($("stMore")) $("stMore").onclick = () => U.openStory(who, fb, fbLabel, opt);
    };
    if (r.claim) {
      const takes = m.obj.kind === "find" || m.obj.kind === "fetch";
      frame(`<p class="story stAct">${esc("(" + name + "")}</p>${box(true)}`, npcBtn("stGo", takes ? "" : "", 1), npcBtn("stBye", ""));
      wire();
      $("stGo").onclick = async () => {
        busy(true);
        const q = await storyAct(m.id, "claim");
        if (q.ok) showDone(); else {
          busy(false);
          rsWarn(q.msg);
        }
      };
    } else if (r.accept) {
      frame(`${say(m.intro)}${box(false)}`, npcBtn("stGo", m.pick ? m.side === "none" ? "" : "" : talk ? "" : "", 1), npcBtn("stBye", ""));
      wire();
      $("stGo").onclick = async () => {
        if (m.pick && !await U.pickAsk(m)) return;
        busy(true);
        const q = await storyAct(m.id, "accept");
        if (!q.ok) {
          busy(false);
          rsWarn(q.msg);
          return;
        }
        if (talk) {
          showDone();
          return;
        }
        frame(`<div class="stBox"><div><b>${m.main ? "★" : "☆"}${esc(m.name)}」</b></div><div class="small">${esc(m.brief)}</div>\n          <div class="small">${esc("" + name + "")}</div></div>`, "", npcBtn("stBye", ""));
        wire();
      };
    } else {
      frame(`<p class="story stAct">${esc("(" + name + "")}</p>${box(true)}`, "", npcBtn("stBye", ""));
      wire();
    }
    return true;
  };
  const qTgHtml = key => {
    const off = !!(SX.qhide && SX.qhide.hasKey(key));
    return `<button class="qTg${off ? "" : " on"}" data-qtg="${esc(key)}" title="${off ? "숨겼습니다 — 누르면 다시 켭니다(진행 · 보상은 그대로입니다)" : "찾을 물건 · 표시 · 알림에 나옵니다 — 누르면 숨깁니다(진행 · 보상은 그대로입니다)"}"><i></i><span class="altw" data-alt="${off ? "추적" : "숨김"}">${off ? "숨김" : "추적"}</span></button>`;
  };
  const qTgAll = keys => {
    if (!keys.length) return "";
    const QH = SX.qhide, nOff = QH ? keys.filter(k => QH.hasKey(k)).length : 0, ids = esc(keys.join(","));
    return `<span class="qTgAll"><button data-qall="on" data-ids="${ids}"${nOff ? "" : " disabled"}>전부 켜기</button><button data-qall="off" data-ids="${ids}"${nOff >= keys.length ? " disabled" : ""}>전부 끄기</button></span>`;
  };
  function qTgClick(e, redraw) {
    const b = e.target.closest && e.target.closest("[data-qtg],[data-qall]");
    if (!b || b.disabled || !SX.qhide) return false;
    if (b.dataset.qtg) SX.qhide.set([ b.dataset.qtg ], !SX.qhide.hasKey(b.dataset.qtg)); else SX.qhide.set((b.dataset.ids || "").split(",").filter(Boolean), b.dataset.qall === "off");
    SX.audio.play("click");
    redraw();
    return true;
  }
  function termRedraw() {
    const scr = $("termScr");
    if (!scr) return;
    const keep = [ ...scr.querySelectorAll(".scrIn, .qlist") ].map(e => [ e.classList.contains("scrIn") ? ":scope > .scrIn" : ".qlist", e.scrollTop ]);
    renderTerm();
    const put = () => {
      for (const [q, t] of keep) {
        const e = scr.querySelector(q);
        if (e && Math.abs(e.scrollTop - t) > 1) e.scrollTop = t;
      }
    };
    put();
    Promise.resolve().then(put);
    requestAnimationFrame(put);
  }
  function storyHtml(term) {
    const P = SX.prog, s = SX.game.save, st = s.story || P.stNew(), h = stHands(), main = P.stMain(), nDone = main.filter(m => P.stDone(st, m.id)).length;
    const keys = [];
    const row = (m, state) => {
      const who = P.ST_WHO[m.who] || "", pr = P.stProg(st, m, h), need = P.stNeed(m), pct = Math.min(100, pr / need * 100);
      const tail = state === "accept" ? esc("" + who + "") : state === "claim" ? `<b class="qok">${esc("" + who + "")}</b>` : `${esc(m.brief)}${stProgHtml(m) ? " · " + stProgHtml(m) : ""}`;
      keys.push("s:" + m.id);
      return `<div class="qrow${state === "claim" ? " ok" : ""}${qHid("s", m.id) ? " qOff" : ""}"><div>${qTgHtml("s:" + m.id)}<b>${m.main ? "★" : "☆"} 「${esc(state === "accept" && !m.main ? "?" : m.name)}」</b> <span class="small">${esc(stKindText(m))} · ${esc(who)}</span>${stRewardText(m) && state !== "accept" ? ` <span class="qrw">${esc(stRewardText(m))}</span>` : ""}</div>\n        ${state === "wait" ? `<div class="qbar"><i style="width:${pct.toFixed(0)}%"></i></div>` : ""}<div class="small">${tail}</div></div>`;
    };
    const now = P.stNow(st, h);
    const head = () => `<h3>${qTgAll(keys)}${esc(P.stCountText(st))}</span> ${U.qm(`${esc(SX.label("interact"))}`)}</h3><div class="qlist">`;
    let html = "", side = "";
    html += now ? row(now.m, now.state) : `${P.egReady(s.eg) ? "" : ""}</div></div>`;
    if (P.stDone(st, "m6") && !P.egReady(s.eg)) {
      const eg = s.eg || P.egNew(), tot = P.egTotal(st), paid = P.egPaid(eg, st), left = tot - paid, pct = Math.min(100, (paid + Math.min(left, Math.max(0, s.money))) / tot * 100);
      html += `${won(tot)}</span></div>\n        <div class="qbar"><i style="width:${pct.toFixed(0)}%"></i></div>\n        <div class="small">${P.EG.map((e0, k) => P.egOf(k, st)).map((e, k) => (k < eg.n ? "✓ " : "· ") + esc(e.name) + " " + won(e.money) + " — " + esc(e.pay)).join("<br>")}</div>\n        <div class="small">${esc("" + won(paid) + "" + won(left) + "" + won(s.money))} · ${s.money < left ? `<b>${esc("" + won(left - s.money))}</b>` : ``}</div></div>`;
    }
    if (P.rsOpen && P.rsOpen(st, s)) {
      const res = P.rsOf(st), n = res.out.length, N = P.RESCUE.length, W = P.ST_WHO;
      html += `<div class="qrow${n >= N ? " ok" : ""}${n}/${N}</span></div>\n        <div class="qbar"><i style="width:${(n / N * 100).toFixed(0)}%"></i></div>\n        <div class="small">${esc(n >= N ? "" : res.cur ? "" + (W[res.cur] || res.cur) + "" : "" + won(P.rsFee(st)) + "")}${n ? esc("" + res.out.map(w => W[w] || w).join(", ")) : ""}</div></div>`;
    }
    if (P.bnOpen && P.bnOpen(st)) {
      const BL = P.bnList(st), rdy = BL.filter(c => c.ready).length;
      side += `<div class="qrow${rdy ? " ok" : ""}${esc("" + P.bnCount(st) + "")}</span></div>\n        <div class="small">${BL.map(c => `${c.ready ? `<b class="qok">` : ""}${esc("「" + c.name + "」 " + c.brief)} · <b>${c.p}/${c.need}</b> · ${won(c.money)}${c.ready ? "</b>" : ""}`).join("<br>")}</div></div>`;
    }
    const subs = P.STORY.filter(m => !m.main && !P.stDone(st, m.id));
    for (const m of subs) if (P.stActive(st, m.id)) side += row(m, P.stReady(st, m, h) ? "claim" : "wait");
    for (const m of subs) if (!P.stActive(st, m.id) && P.stOpen(st, m) && (!m.lead || h.count(m.lead.item) > 0)) side += row(m, "accept");
    if (term && SX.game.state === "raid" && SX.raid.story && SX.raid.story.length) for (const e of SX.raid.story) if (!e.lead && !qHid("s", e.id)) {
      const em = P.STORY.find(m => m.id === e.id), r = `${esc(e.item)}」</b></div><div class="small">${esc(e.floors.map(f => f + 1 + "").join(" · "))}${e.spots.length}${esc(SX.label("interact"))}`;
      if (em && !em.main) side += r; else html += r;
    }
    const un = P.stUnlocked(st), all = SX.data.buildings.filter(b => !b.final && !b.train);
    html += `${all.filter(b => un[b.id]).map(b => esc(b.name)).join(" · ")}${all.filter(b => !un[b.id]).length}`;
    const past = main.filter(m => P.stDone(st, m.id));
    if (term && past.length) html += `${past.map((m, k) => k + 1 + ". " + esc(m.name)).join(" · ")}</div></div>`;
    const sdone = P.STORY.filter(m => !m.main && P.stDone(st, m.id));
    if (term && sdone.length) side += `${sdone.map(m => esc(m.name)).join(" · ")}</div></div>`;
    return head() + `` + html + (side ? `` + side : "") + "</div>";
  }
  U.storyHtml = storyHtml;
  const facIcUrl = new Map;
  function facIc(n) {
    let u = facIcUrl.get(n);
    if (u == null) {
      const d = I.def(n);
      u = d ? ART.icon(Object.assign({}, d, {
        w: d.w || 1,
        h: d.h || 1
      })).toDataURL() : "";
      facIcUrl.set(n, u);
    }
    return u;
  }
  function facNeedHtml(need, data, named) {
    return need.map(([n, c]) => {
      const h = SX.prog.haveIn(data, n), ok = h >= c;
      return `<span class="facNi ${ok ? "ok" : "no"}" data-need="${esc(n)}" title="${esc(n + " — 가진 것 " + h + " · 드는 것 " + c)}"><img src="${facIc(n)}" alt="">${named ? "<span class='nmN'>" + esc(n) + "</span>" : ""}<span class="n">${Math.min(c, h)}/${c}</span></span>`;
    }).join("");
  }
  const facWhy = (P, fs, s, id, price) => {
    const lack = P.facLack(fs, s, id), m = (+s.money || 0) < price;
    return (m ? "돈이 모자랍니다" : "") + (m && lack.length ? " · " : "") + (lack.length ? "물건이 모자랍니다 — " + lack.map(([n, k]) => n + " " + k).join(", ") : "");
  };
  U.facNeedHtml = facNeedHtml;
  const facBtnTxt = (b, l, n) => {
    b.innerHTML = "<span class='fbL'>" + esc(l) + "</span> <span class='fbN'>" + esc(String(n)) + "</span>";
  };
  let facAllBusy = false, facAllNote = null;
  async function facClaimAll() {
    if (facAllBusy) return;
    facAllBusy = true;
    const P = SX.prog, on = SX.net && SX.net.on(), got = [], full = [];
    try {
      for (const f of P.FAC) {
        const s = SX.game.save, fs = s.fac || P.fNew();
        if (f.addon || !P.facLevel(fs, f.id) || !((P.facReady(fs, f.id, Date.now()) | 0) > 0)) continue;
        let r;
        if (on) r = await SX.net.facClaim(f.id); else {
          r = P.facClaim(s.fac, s, f.id, Date.now(), stashHands(), null, false);
          if (r.msg) SX.log((r.ok ? "📜 " : "") + r.msg, r.ok ? "good" : "bad");
          if (r.ok) SX.game.persist();
        }
        if (r && r.ok) {
          got.push(f.name);
          if (SX.settle) SX.settle.facGot(r.msg);
        } else if (r && /자리가 모자랍니다/.test(r.msg || "")) full.push(f.name); else if (on && r && /잠깐 기다려|판 중엔|서버에 못|로그인/.test(r.msg || "")) break;
      }
    } finally {
      facAllBusy = false;
    }
    if (got.length > 1) SX.log("모두 받기 — 설비 " + got.length + "곳에서 받았습니다", "good");
    if (full.length) SX.log("보관함 자리가 모자라 " + full.join(" · ") + " 은(는) 못 받았습니다 — 보관함을 비우거나 그 줄 [판매]로 바로 파십시오", "bad");
    SX.audio.play(got.length ? "buy" : "denied");
    facAllNote = got.length || full.length ? {
      t: Date.now(),
      bad: !!full.length,
      msg: full.length ? "보관함 자리가 모자라 못 받았습니다 — " + full.join(" · ") : "설비 " + got.length + "곳에서 받았습니다"
    } : null;
    renderShop();
    U.hudDirty();
    return {
      got: got.length,
      full: full.length
    };
  }
  U.facClaimAll = facClaimAll;
  function facShop() {
    const P = SX.prog, s = SX.game.save, fs = s.fac || P.fNew(), now = Date.now();
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    col.innerHTML = `<h3><span>셸터 설비 ${U.qm("실제 시간 24시간이면 가득 찹니다(그 전엔 흐른 만큼).<br>받거나 팔면 새로 쌓입니다. 가득 차면 멈춥니다.<br>셸터 왼쪽 위 불빛: 초록 = 쌓이는 중 · 빨강 = 가득(받아 주십시오).")}</span></h3>`;
    const vOf = n => I.sellValue(I.mk(n), true);
    const price1 = (f, keep) => P.facItems(fs, f.id, now).reduce((v, [n, k]) => v + (keep && P.FAC_KEEP.includes(n) ? 0 : (/파츠 상자/.test(n) ? Math.round(avgBox(n)) : vOf(n)) * k), 0);
    const allV = P.FAC.reduce((v, f) => v + (P.FAC_ALL_SKIP.includes(f.id) ? 0 : price1(f, true)), 0);
    const top = document.createElement("div");
    top.className = "row facTop";
    top.innerHTML = `<span class="small">쌓인 것 전부 값 약 <b class="money">${won(allV)}</b></span>`;
    {
      const allN = P.FAC.reduce((t, f) => t + (f.addon || !P.facLevel(fs, f.id) ? 0 : P.facReady(fs, f.id, now) | 0), 0);
      const ab = document.createElement("button");
      ab.id = "facAllGet";
      facBtnTxt(ab, "모두 받기", allN);
      ab.disabled = !allN || facAllBusy;
      ab.dataset.tip = "모든 설비에 쌓인 것을 줄마다 [받기]처럼 차례로 보관함에 받습니다";
      ab.onclick = () => facClaimAll();
      top.appendChild(ab);
    }
    const sa = document.createElement("button");
    sa.textContent = "설비 전부 판매";
    sa.disabled = !allV;
    sa.onclick = () => U.ask("설비 전부 판매", "모든 설비에 쌓인 것을 보관함에 넣지 않고 바로 팝니다(브로커 값). 증상 억제약과 개인 금고는 팔지 않습니다.", 0, async () => {
      for (const f of P.FAC) if (!P.FAC_ALL_SKIP.includes(f.id) && P.facItems(SX.game.save.fac || fs, f.id, Date.now()).some(([n]) => !P.FAC_KEEP.includes(n))) await progAct("fsk", f.id);
    }, null, {
      q: "약 " + won(allV) + " 에 파시겠습니까?",
      yes: "전부 판매"
    });
    top.appendChild(sa);
    {
      const keepN = P.FAC.reduce((t, f) => t + P.facItems(fs, f.id, now).filter(([n]) => P.FAC_KEEP.includes(n)).reduce((a, q) => a + q[1], 0), 0);
      const kb = document.createElement("button");
      kb.id = "facKeepGet";
      kb.textContent = "증상 억제약 받기 " + keepN;
      kb.disabled = !keepN;
      kb.dataset.tip = "증상 억제약만 보관함으로 받습니다(다른 것은 그대로 쌓입니다)";
      kb.onclick = async () => {
        for (const f of P.FAC) if (P.facItems(SX.game.save.fac || fs, f.id, Date.now()).some(([n]) => P.FAC_KEEP.includes(n))) await progAct("fck", f.id);
      };
      top.appendChild(kb);
    }
    if (facAllNote && now - facAllNote.t < 6e4) {
      const nt = document.createElement("span");
      nt.className = "small facAllMsg " + (facAllNote.bad ? "bad" : "good");
      nt.textContent = facAllNote.msg;
      top.appendChild(nt);
    }
    col.appendChild(top);
    const L = document.createElement("div");
    L.className = "list facList";
    L.style.flex = "1";
    const hm = min => min >= 60 ? Math.floor(min / 60) + "시간" + (min % 60 ? " " + min % 60 + "분" : "") : min + "분";
    const dhm = m => m >= DAY_MIN ? Math.floor(m / DAY_MIN) + "일" + (m % DAY_MIN ? " " + hm(m % DAY_MIN) : "") : hm(m);
    for (const f of P.FAC) {
      if (f.addon) continue;
      const lv = P.facLevel(fs, f.id), cur = lv ? f.lv[lv - 1] : null, next = f.lv[lv] || null, ready = P.facReady(fs, f.id, now), fr = P.facFrac(fs, f.id, now);
      const SPAN = f.week ? 7 * DAY_MIN : DAY_MIN, perWord = f.week ? "1주일" : "하루";
      const r = document.createElement("div");
      r.className = "li facRow";
      const dayV = L0 => L0.outs.reduce((v, [n, c]) => v + (/파츠 상자/.test(n) ? avgBox(n) : vOf(n)) * c, 0) + (L0.side ? vOf(L0.side[0]) * 1440 / L0.side[1] : 0);
      let pop = "<b>" + esc(f.name) + (lv ? " " + lv + "단계" : "") + "</b><br>" + esc(f.desc), line = "", sideL = "";
      if (cur) {
        const have = P.facItems(fs, f.id, now), got = n => (have.find(q => q[0] === n) || [ 0, 0 ])[1];
        const left = Math.max(0, Math.ceil((1 - fr) * SPAN));
        pop += "<br>" + cur.outs.map(([n, c]) => esc(n) + " <b>" + got(n) + "</b>/" + c).join(" · ") + (cur.rand ? " · " + cur.rand.map(([n, a, b]) => esc(n) + " " + a + "~" + b + "(가득 차면)").join("") : "");
        const red = fr >= 1;
        line = "<i class='facLed " + (red ? "green full" : "off") + "'></i><span class='facBar'><i style='width:" + Math.round(fr * 100) + "%'></i></span><span class='facPct'>" + Math.round(fr * 100) + "%</span><span class='facLeft'>" + (fr >= 1 ? "<b class='warn'>가득 — 멈춰 있습니다</b>" : "가득까지 " + dhm(left)) + "</span>";
        if (cur.side) {
          const sd = fs[f.id], t0 = sd.side != null ? sd.side : sd.last, sl = Math.max(0, Math.ceil((t0 + cur.side[1] * 6e4 - now) / 6e4));
          sideL = esc(cur.side[0]) + " — " + (sl <= 0 ? "<b class='good'>하나 나왔습니다</b>" : (sl >= 1440 ? Math.floor(sl / 1440) + "일 " : "") + hm(sl % 1440) + " 뒤");
          pop += "<br>" + esc(cur.side[0]) + " — " + Math.round(cur.side[1] / 1440 * 10) / 10 + "일에 하나";
        }
      }
      if (next) pop += "<br><span class='dim'>" + (lv ? "다음 단계" : "지으면") + ": " + next.outs.map(([n, c]) => esc(n) + " " + c).join(" · ") + (next.side ? " + " + esc(next.side[0]) + " " + Math.round(next.side[1] / 1440 * 10) / 10 + "일에 하나" : "") + "</span>";
      const need = P.facNeed(fs, f.id);
      if (next && need.length) pop += "<br><span class='dim'>" + (lv ? "올리는 데" : "짓는 데") + " 드는 물건: " + need.map(([n, c]) => esc(n) + " " + c).join(" · ") + "</span>";
      const ic = document.createElement("canvas");
      ic.width = 16;
      ic.height = 16;
      ic.className = "facIc";
      {
        const q = FAC_IC[f.id] || [ "bolt", "#ccc" ];
        ic.getContext("2d").drawImage(ART.hud(q[0], q[1]), 0, 0);
      }
      r.innerHTML = `<span class="nm"><span class="facNm">${esc(f.name)}</span>${SX.lang === "en" ? " " : ""}${lv ? "<b class='facLv'>" + lv + "단계</b>" : "<span class='small facLv'>(안 지음)</span>"} ${U.qm(pop)}<br><span class="small facLine">${line}</span>${sideL ? "<br><span class='small'>" + sideL + "</span>" : ""}</span>`;
      r.insertBefore(ic, r.firstChild);
      if (cur) {
        const g = document.createElement("button");
        g.className = "facGet";
        facBtnTxt(g, "받기", ready);
        g.disabled = !ready;
        g.onclick = () => progAct("fc", f.id);
        r.appendChild(g);
        const kn2 = P.facItems(fs, f.id, now).filter(([n]) => P.FAC_KEEP.includes(n)).reduce((a, q) => a + q[1], 0), sv = price1(f, true), svAll = price1(f, false);
        const sb = document.createElement("button");
        sb.className = "facSell";
        facBtnTxt(sb, "판매", svAll ? won(svAll) : "");
        sb.disabled = !svAll;
        sb.dataset.tip = kn2 ? "보관함에 안 넣고 바로 팝니다(증상 억제약도 팔지 먼저 묻습니다)" : "보관함에 안 넣고 바로 팝니다";
        sb.onclick = () => f.id === "vault" ? U.ask(f.name + " 판매", esc(f.name) + "에 쌓인 것을 보관함에 넣지 않고 바로 팝니다(" + won(svAll) + ").", 0, () => progAct("fs", f.id), null, {
          q: "정말 파시겠습니까?",
          yes: "판매",
          no: "그만두기"
        }) : kn2 ? U.ask("증상 억제약 판매", esc(f.name) + "에 쌓인 것을 증상 억제약 " + kn2 + "개까지 모두 팝니다(" + won(svAll) + ").<br>억제약을 남기시려면 [그만두기]를 누르고 위의 [증상 억제약 받기]로 먼저 받으십시오.", 0, () => progAct("fs", f.id), null, {
          q: f.name + "의 억제약을 정말 파시겠습니까?",
          yes: "억제약까지 판매",
          no: "그만두기"
        }) : progAct("fsk", f.id);
        r.appendChild(sb);
      }
      if (next) {
        const b = document.createElement("button");
        b.className = "facUp";
        facBtnTxt(b, lv ? "단계 올리기" : "짓기", won(next.price));
        const why = facWhy(P, fs, s, f.id, next.price);
        b.disabled = !!why;
        if (why) {
          b.dataset.tip = why;
          b.title = why;
        }
        b.dataset.fb = f.id;
        if (need.length) {
          const nd = document.createElement("span");
          nd.className = "facNeed";
          nd.innerHTML = facNeedHtml(need, s);
          r.appendChild(nd);
        }
        b.onclick = () => U.ask(f.name + (lv ? " " + (lv + 1) + "단계" : " 짓기"), esc(f.desc) + "<br>" + perWord + "에 " + esc(next.outs.map(([n, c]) => n + " " + c).join(" · ")) + (next.side ? " + " + esc(next.side[0]) + " " + Math.round(next.side[1] / 1440 * 10) / 10 + "일에 하나" : "") + "." + (lv && ready ? "<br>쌓인 것 " + ready + "개는 먼저 챙깁니다 — 보관함에 자리가 있으면 넣고, 없으면 바로 팝니다." : "") + (need.length ? "<br>가져가는 물건<br><span class='facNeedAsk'>" + facNeedHtml(need, SX.game.save, true) + "</span>" : ""), next.price, () => progAct("fb", f.id));
        r.appendChild(b);
      }
      if (f.id === "vault") {
        const tf = P.facById("vaultTime"), tl = P.facLevel(fs, "vaultTime"), tn = tf && tf.lv[tl];
        const line = document.createElement("span");
        line.className = "small facAdd";
        line.textContent = "🔐 보존 기간 " + P.vaultDays(fs) + "일 · 보존 장치 " + tl + "/" + (tf ? tf.lv.length : 0) + "단계" + (tn ? " → 다음 " + (P.vaultDays(fs) + 1) + "일" : " (끝)");
        const nm = r.querySelector(".nm");
        if (nm) {
          nm.appendChild(document.createElement("br"));
          nm.appendChild(line);
        }
        if (tn) {
          const tb = document.createElement("button");
          tb.className = "facExt";
          facBtnTxt(tb, "보존 기간 늘리기", won(tn.price));
          const tneed = P.facNeed(fs, "vaultTime"), twhy = lv ? facWhy(P, fs, s, "vaultTime", tn.price) : "";
          tb.disabled = !lv || !!twhy;
          tb.dataset.tip = !lv ? "금고 공방을 먼저 지어야 합니다" : twhy || "개인 금고가 남아 있는 기간을 하루 늘립니다(앞으로 쓰는 금고부터)";
          if (twhy) tb.title = twhy;
          tb.dataset.fb = "vaultTime";
          if (tneed.length) {
            const nd = document.createElement("span");
            nd.className = "facNeed facNeed2";
            nd.innerHTML = facNeedHtml(tneed, s);
            r.appendChild(nd);
          }
          tb.onclick = () => U.ask("금고 보존 장치 " + (tl + 1) + "단계", esc(tf.desc) + "<br>앞으로 쓰는 개인 금고가 " + (P.vaultDays(fs) + 1) + "일 동안 남습니다." + (tneed.length ? "<br>가져가는 물건<br><span class='facNeedAsk'>" + facNeedHtml(tneed, SX.game.save, true) + "</span>" : ""), tn.price, () => progAct("fb", "vaultTime"));
          r.appendChild(tb);
        }
      }
      L.appendChild(r);
    }
    {
      const h = document.createElement("div");
      h.className = "small secHd";
      h.innerHTML = "🛠 제작 " + U.qm("가진 잡동사니로 만듭니다(보관함 · 가방 · 개인 금고 · 냉장고 어디에 있어도).<br>만든 것은 보관함으로 들어갑니다.<br>요리는 셸터 조리대 · 가스레인지에서 합니다(만든 것은 냉장고로).");
      L.appendChild(h);
      for (const rc of P.RECIPES) {
        const no = P.craftOk(fs, s, rc), have = n => P.haveIn(s, n);
        const r = document.createElement("div");
        r.className = "li" + (rc.food ? " cookRow" : "");
        const where = rc.food ? rc.heat ? "셸터 가스레인지에서" : "셸터 조리대에서" : "";
        const need = (rc.fac ? (P.facById(rc.fac[0]) || {}).name + " " + rc.fac[1] + "단계 · " : "") + (where ? where + " · " : "");
        r.innerHTML = `<span class="nm">🛠 ${esc(rc.out.map(([n, c]) => n + (c > 1 ? " ×" + c : "")).join(", "))}<br><span class="small">${esc(need + rc.desc)}<br>${rc.in.map(([n, c]) => esc(n) + " <b>" + Math.min(c, have(n)) + "/" + c + "</b>").join(" · ")}</span></span>`;
        const b = document.createElement("button");
        b.textContent = "만들기";
        b.disabled = !!no || !!where;
        b.dataset.tip = where ? where + " [" + SX.label("interact") + "] 로 만듭니다" : no || "재료를 가져갑니다 — 보관함 · 가방 · 개인 금고 순서로";
        b.onclick = () => progAct("c", rc.id);
        r.appendChild(b);
        r.appendChild(rcTgBtn(rc, renderShop));
        L.appendChild(r);
      }
    }
    col.appendChild(L);
    return col;
  }
  const DAY_MIN = 1440;
  function avgBox(n) {
    const P0 = SX.PARTBOX[n];
    if (!P0) return 0;
    const bv = (I.def(n) || {}).val || 0;
    return Math.floor(bv * .75) + P0.n * P0.pool.reduce((s, q) => s + I.sellValue(I.mk(q), true), 0) / P0.pool.length;
  }
  U.facReadyCount = function() {
    const P = SX.prog, fs = SX.game.save && SX.game.save.fac || {}, now = Date.now();
    return P.FAC.filter(f => P.facLevel(fs, f.id) && (P.facFrac(fs, f.id, now) >= 1 || P.facSideReady(fs, f.id, now))).length;
  };
  function gearValue() {
    const k = SX.game.kit;
    return [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig" ].reduce((v, s) => v + (k[s] ? k[s].val || 0 : 0), 0);
  }
  function insureFee() {
    return Math.max(2e3, Math.round(gearValue() * .15 / 100) * 100);
  }
  U.insureFee = insureFee;
  function floorOf(d) {
    if (!d) return 0;
    if (d.kind === "ammo") return SX.trade.gives(d).reduce((t, [n, c]) => t + ((I.def(n) || {}).val || 0) * c, 0);
    let v = d.val || 0;
    if (d.kind === "gun" && (d.ammo | 0) > 0) {
      const md = I.def(I.MAGS[d.caliber]);
      if (md && md.cap) {
        let n = d.ammo | 0;
        while (n > 0) {
          const t = Math.min(md.cap, n);
          v += (md.val || 0) * (.15 + .85 * t / md.cap);
          n -= t;
        }
      }
    }
    const P0 = d.kind === "partbox" && SX.PARTBOX && SX.PARTBOX[d.name];
    if (P0) v += P0.n * Math.max(0, ...P0.pool.map(q => (I.def(q) || {}).val || 0));
    return Math.ceil(v);
  }
  U.floorOf = floorOf;
  function loyAdd(who, v, claim) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !T.NEED[who] || !(v > 0)) return;
    const a = T.level(s, who);
    if (!s.loyal || typeof s.loyal !== "object") s.loyal = T.loyNew();
    s.loyal[who] = T.pts(s, who) + Math.round(v);
    if (claim && SX.net && SX.net.on()) s.trades = (Array.isArray(s.trades) ? s.trades : []).concat([ Object.assign({
      s: who,
      q: Math.random().toString(36).slice(2, 8)
    }, claim) ]).slice(-80);
    const b = T.level(s, who);
    if (b.n > a.n) {
      const perks = T.perks(who, b).join(" · ");
      SX.log("🤝 " + T.NAME[who] + " 단골 " + b.n + "단계 「" + b.name + "」 — " + perks, "good");
      U.bigNote("🤝 " + T.NAME[who] + " — 단골 " + b.n + "단계 「" + b.name + "」", perks, 4500);
      SX.audio.play("confirm");
    }
  }
  function loySub(who, v) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !T.NEED[who] || !(v > 0) || !s.loyal) return;
    s.loyal[who] = Math.max(0, T.pts(s, who) - Math.round(v));
  }
  U.loyAdd = loyAdd;
  function loyBox(who) {
    const T = SX.trade, s = SX.game.save, l = T.level(s, who), nx = T.nextOf(who, l), pts = T.pts(s, who);
    const sd = s.story && s.story.side, a = T.need(who, l, sd), b = nx ? T.need(who, nx, sd) : a, fr = nx ? Math.max(0, Math.min(1, (pts - a) / Math.max(1, b - a))) : 1;
    const el = document.createElement("div");
    el.className = "loyBox";
    el.innerHTML = `<div class="loyTop"><b>🤝 단골 ${l.n}단계 「${esc(l.name)}」</b> ${U.qm("이 상인과 사고팔수록 단골이 됩니다.<br>브로커에서 판 " + esc(T.SELL_WORD[who]) + "도 칩니다." + (l.n > 1 ? "<div class='qmLoy'><b>지금</b> " + esc(T.perks(who, l).join(" · ")) + "</div>" : "") + (nx ? "<div class='qmLoy'><b>다음 " + nx.n + "단계 「" + esc(nx.name) + "」</b> " + esc(T.perks(who, nx).join(" · ")) + "</div>" : "") + lockHtml(who))} <span class="facBar loyBar"><i style="width:${Math.round(fr * 100)}%"></i></span> <span class="small">${nx ? "거래 " + won(pts) + " / " + won(b) : "거래 " + won(pts) + " · 마지막 단계"}</span></div>`;
    {
      const k = T.saleOf ? T.saleOf(I.dealOf(s), who, l) : 0;
      if (k) {
        const d = document.createElement("div");
        d.className = "small saleOn";
        d.innerHTML = `<b class="good">🏷 오늘 할인합니다 — 사는 값 −${Math.round(k * 100)}%</b> ${esc("(좌판에 새 물건이 들어올 때까지)")}`;
        el.appendChild(d);
      }
    }
    el.title = "사는 값 · 브로커에서 판 값 · 정비 · 수리 · 물물교환이 쌓입니다";
    return el;
  }
  U.loyBox = loyBox;
  function lockHtml(who) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !T.newAt || !T.NEED[who]) return "";
    const l = T.level(s, who), rows = T.LV.slice(1).map(v => [ v, T.newAt(who, v.n) ]).filter(q => q[1].length || q[0].rare && T.RARE[who]);
    if (!rows.length) return "";
    let h = "<div class='qmLock'><b>🔒 단골 등급마다 파는 물건</b><div class='small'>" + esc("처음 손님에게도 기본 물건은 다 팝니다.") + " " + esc("좌판 물건은 그 등급이 된 뒤 좌판이 새로 들어올 때부터 섞여 나옵니다.") + "</div>";
    for (const [v, names] of rows) {
      const on = l.n >= v.n;
      h += "<div class='qmLockRow" + (on ? " open" : "") + "'>" + (on ? "<b class='good'>✓ " + v.n + "단계 「" + esc(v.name) + "」</b> " + esc("열렸습니다") : "<b class='warn'>🔒 " + v.n + "단계 「" + esc(v.name) + "」부터</b> " + esc("거래 " + won(T.need(who, v)))) + (v.rare && T.RARE[who] ? " <span class='rareTag'>" + esc(v.rare >= 1 ? "귀한 물건 늘" : "귀한 물건 가끔") + "</span>" : "") + (names.length ? "<div class='small'>" + names.map(esc).join(" · ") + "</div>" : "") + "</div>";
    }
    return h + "</div>";
  }
  function lockBox(who) {
    const T = SX.trade, s = SX.game.save, box = document.createElement("div");
    box.className = "bartBox lockBox";
    if (!T || !T.newAt || !T.NEED[who]) return box;
    const l = T.level(s, who), rows = T.LV.slice(1).map(v => [ v, T.newAt(who, v.n) ]).filter(q => q[1].length || q[0].rare && T.RARE[who]);
    if (!rows.length) return box;
    const h = document.createElement("div");
    h.className = "small secHd";
    h.innerHTML = "🔒 단골 등급마다 파는 물건 " + U.qm("이 상인과 사고팔아 단골 등급이 오르면 더 좋은 물건을 내놓습니다.<br>처음 손님에게도 기본 물건은 다 팝니다.<br>좌판 물건은 그 등급이 된 뒤 좌판이 새로 들어올 때부터 섞여 나옵니다.");
    box.appendChild(h);
    for (const [v, names] of rows) {
      const on = l.n >= v.n, r = document.createElement("div");
      r.className = "lockRow" + (on ? " open" : "");
      r.dataset.lv = v.n;
      r.style.cssText = "padding:calc(var(--u)*1.5) calc(var(--u)*2);border-bottom:var(--u) solid #0004" + (on ? ";opacity:.7" : "");
      const t = document.createElement("div");
      t.className = "small";
      t.innerHTML = (on ? "<b class='good'>✓ " + v.n + "단계 「" + esc(v.name) + "」</b> " + esc("열렸습니다") : "<b class='warn'>🔒 " + v.n + "단계 「" + esc(v.name) + "」부터</b> " + esc("거래 " + won(T.need(who, v)))) + (v.rare && T.RARE[who] ? " <span class='rareTag'>" + esc(v.rare >= 1 ? "귀한 물건 늘" : "귀한 물건 가끔") + "</span>" : "");
      r.appendChild(t);
      if (names.length) {
        const gv = document.createElement("div");
        gv.className = "bartGive";
        for (const n of names) {
          const c = T.catalog(who).get(n), d = c && c.d || I.def(n) || {
            name: n
          }, chip = document.createElement("span");
          chip.className = "chip";
          const ic = d.kind === "ammo" ? {
            name: d.one ? d.one : d.name,
            kind: "ammo",
            cal: d.cal,
            w: 2,
            h: d.one ? 2 : 1
          } : d;
          const cv = iconCanvas(Object.assign({}, ic, {
            w: ic.w || 1,
            h: ic.h || 1
          }));
          cv.style.cssText = "width:calc(var(--u)*9);height:calc(var(--u)*9);object-fit:contain;flex:none";
          chip.appendChild(cv);
          const tx = document.createElement("span");
          tx.textContent = n;
          chip.appendChild(tx);
          chip.oncontextmenu = e => {
            e.preventDefault();
            e.stopPropagation();
            U.showDetail({
              item: d
            });
          };
          gv.appendChild(chip);
        }
        r.appendChild(gv);
      }
      box.appendChild(r);
    }
    return box;
  }
  U.lockBox = lockBox;
  function barterBox(who) {
    const T = SX.trade, s = SX.game.save, day = I.dealOf(s), offers = T.offer(day, who), P = SX.prog;
    const box = document.createElement("div");
    box.className = "bartBox";
    const h = document.createElement("div");
    h.className = "small secHd";
    h.innerHTML = "🔁 물물교환 " + U.qm("쓸 데 없는 잡동사니를 주고 바꿉니다.<br>좌판에 새 물건이 들어오면 바뀝니다.<br>보관함 · 가방 · 리그에 든 것을 씁니다.");
    box.appendChild(h);
    if (!offers.length) {
      const e = document.createElement("div");
      e.className = "small";
      e.textContent = "오늘은 교환이 없습니다";
      box.appendChild(e);
      if (who === T.KEY_WHO && T.keySwap) box.appendChild(keySwapBox());
      return box;
    }
    const L = document.createElement("div");
    L.className = "list alignList bartList";
    for (const q of offers) {
      const used = T.bartUsed(day, who, q), have = n => P.haveIn(s, n), ok = !used && q.give.every(([n, c]) => have(n) >= c);
      const r = document.createElement("div");
      r.className = "li bart" + (used ? " done" : ok ? " ready" : "");
      const gd = I.def(q.get[0]);
      if (gd) {
        const cv = iconCanvas(gd);
        const k = Math.min(1, 4 / (gd.w || 1), 2 / (gd.h || 1));
        cv.style.width = "calc(var(--u)*" + 16 * (gd.w || 1) * k + ")";
        cv.style.height = "calc(var(--u)*" + 16 * (gd.h || 1) * k + ")";
        cv.style.flex = "none";
        const cw = document.createElement("span");
        cw.style.width = "calc(var(--u)*66)";
        cw.style.display = "flex";
        cw.style.justifyContent = "center";
        cw.appendChild(cv);
        r.appendChild(cw);
      }
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = "🔁 " + esc(q.get[0]) + (q.get[1] > 1 ? " ×" + q.get[1] : "") + " <span class='small'>받는 것</span><br>";
      const gv = document.createElement("span");
      gv.className = "bartGive";
      for (const [n, c] of q.give) {
        const chip = document.createElement("span");
        chip.className = "chip";
        const d0 = I.def(n);
        if (d0) {
          const ic = iconCanvas(d0);
          ic.className = "mini";
          chip.appendChild(ic);
        }
        const t = document.createElement("span");
        t.innerHTML = esc(n) + " <b class='" + (have(n) >= c ? "good" : "bad") + "'>" + Math.min(have(n), c) + "/" + c + "</b>";
        chip.appendChild(t);
        chip.oncontextmenu = e => {
          e.preventDefault();
          e.stopPropagation();
          U.showDetail({
            item: d0 || {
              name: n
            }
          });
        };
        gv.appendChild(chip);
      }
      nm.appendChild(gv);
      r.appendChild(nm);
      const pr = document.createElement("span");
      pr.className = "pr";
      pr.innerHTML = "<span class='small'>좌판 값</span> " + won(T.bartPrice(who, q));
      r.appendChild(pr);
      r.oncontextmenu = e => {
        e.preventDefault();
        if (gd) U.showDetail({
          item: gd
        });
      };
      const b = document.createElement("button");
      b.textContent = used ? "바꿨습니다" : "교환";
      b.disabled = !ok;
      b.title = used ? "이번 좌판에서는 이미 바꿨습니다" : ok ? "잡동사니를 주고 받습니다" : "모자랍니다 — " + q.give.filter(([n, c]) => have(n) < c).map(([n, c]) => n + " " + (c - have(n))).join(", ");
      b.onclick = () => doBarter(who, q.id);
      r.appendChild(b);
      L.appendChild(r);
    }
    box.appendChild(L);
    if (who === T.KEY_WHO && T.keySwap) box.appendChild(keySwapBox());
    return box;
  }
  const keyPick = {};
  function keySwapBox() {
    const T = SX.trade, s = SX.game.save, names = T.keyNames(), own = T.keyOwned(s), fee = Math.round(T.KEY_FEE * 100);
    const wrap = document.createElement("div");
    wrap.className = "keySwBox";
    const h = document.createElement("div");
    h.className = "small keySwHd";
    h.innerHTML = "🔑 열쇠 바꾸기 " + U.qm("다른 건물 열쇠에 돈을 얹어 바라는 건물 열쇠(새것)로 바꿉니다.<br>더 낼 돈 = 받는 열쇠 몫 − 주는 열쇠 몫 + 수수료 " + fee + "%<br>열쇠 몫은 그 방 금고에서 나오는 물건의 평균 값 × 남은 횟수입니다.<br>주는 열쇠가 더 값져도 차액은 돌려 드리지 않습니다.");
    wrap.appendChild(h);
    if (!own.length) {
      const e = document.createElement("div");
      e.className = "small";
      e.textContent = "가진 열쇠가 없습니다 — 판에서 주운 열쇠를 여기서 바꿀 수 있습니다";
      wrap.appendChild(e);
      return wrap;
    }
    const L = document.createElement("div");
    L.className = "list alignList bartList keySwList";
    for (const o of own) {
      const id = o.name + "|" + o.left, others = names.filter(n => n !== o.name);
      if (others.indexOf(keyPick[id]) < 0) keyPick[id] = others[0];
      const get = keyPick[id], c = T.keyPay(o.name, o.left, get);
      if (!c) continue;
      const ok = (+s.money || 0) >= c.pay;
      const r = document.createElement("div");
      r.className = "li bart keySw" + (ok ? " ready" : "");
      const gd = I.def(get);
      {
        const cw = document.createElement("span");
        cw.style.width = "calc(var(--u)*66)";
        cw.style.display = "flex";
        cw.style.justifyContent = "center";
        if (gd) {
          const cv = iconCanvas(gd);
          cv.style.width = "calc(var(--u)*16)";
          cv.style.height = "calc(var(--u)*16)";
          cv.style.flex = "none";
          cw.appendChild(cv);
        }
        r.appendChild(cw);
      }
      const nm = document.createElement("span");
      nm.className = "nm";
      for (const [t, dir] of [ [ "◀", -1 ], [ "▶", 1 ] ]) {
        const a = document.createElement("button");
        a.className = "keyCyc";
        a.textContent = t;
        a.dataset.tip = "받을 열쇠 고르기";
        a.onclick = e => {
          e.stopPropagation();
          const k = others.indexOf(keyPick[id]);
          keyPick[id] = others[(k + dir + others.length) % others.length];
          SX.audio.play("click");
          renderShop();
        };
        nm.appendChild(a);
      }
      nm.insertAdjacentHTML("beforeend", "🔑 " + esc(get) + " <span class='small'>받는 것</span>");
      nm.appendChild(document.createElement("br"));
      const gv = document.createElement("span");
      gv.className = "bartGive";
      {
        const chip = document.createElement("span");
        chip.className = "chip";
        const d0 = I.def(o.name);
        if (d0) {
          const ic = iconCanvas(d0);
          ic.className = "mini";
          chip.appendChild(ic);
        }
        const t = document.createElement("span");
        t.innerHTML = esc(o.name) + " <b>" + o.left + "/" + o.max + "</b>" + (o.n > 1 ? " ×" + o.n : "") + " <span class='small'>주는 것</span>";
        chip.appendChild(t);
        gv.appendChild(chip);
      }
      {
        const t = document.createElement("span");
        t.className = "small";
        t.textContent = "몫 " + won(c.give) + " → " + won(c.get) + " · 수수료 " + won(c.fee);
        gv.appendChild(t);
      }
      nm.appendChild(gv);
      r.appendChild(nm);
      const pr = document.createElement("span");
      pr.className = "pr";
      pr.innerHTML = "<span class='small'>더 낼 돈</span> " + won(c.pay);
      r.appendChild(pr);
      const b = document.createElement("button");
      b.textContent = "바꾸기";
      b.disabled = !ok;
      b.title = ok ? "열쇠와 돈을 주고 새 열쇠를 받습니다" : "돈이 모자랍니다 — " + won(c.pay - (+s.money || 0));
      b.onclick = () => U.ask("열쇠 바꾸기", "「" + esc(o.name) + "」(남은 " + o.left + "/" + o.max + ")을(를) 주고 「" + esc(get) + "」(새것)을(를) 받습니다.", c.pay, () => doKeySwap(o.name, o.left, get), null, {
        q: "열쇠를 바꾸시겠습니까?",
        yes: "바꾸기"
      });
      r.appendChild(b);
      L.appendChild(r);
    }
    wrap.appendChild(L);
    return wrap;
  }
  async function doKeySwap(give, left, get) {
    const T = SX.trade, s = SX.game.save, on = SX.net && SX.net.on();
    let r;
    if (on) r = await SX.net.keySwap(give, left, get); else {
      r = T.keySwap(s, give, left, get, stashHands());
      if (r.ok) {
        cleanQuick();
        SX.game.persist();
      }
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
    }
    SX.audio.play(r && r.ok ? "buy" : "denied");
    if (U.panelKind === "shop") renderShop();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.doKeySwap = doKeySwap;
  async function doBarter(who, id) {
    const T = SX.trade, s = SX.game.save, on = SX.net && SX.net.on();
    I.dealOf(s);
    let r;
    if (on) r = await SX.net.barter(who, id); else {
      r = T.barter(s, who, id, stashHands());
      if (r.ok) {
        cleanQuick();
        loyAdd(who, r.worth, null);
        SX.game.persist();
      }
      if (r.msg) SX.log(r.msg, r.ok ? "good" : "bad");
    }
    SX.audio.play(r && r.ok ? "buy" : "denied");
    if (U.panelKind === "shop") renderShop();
    U.hudDirty();
    return r || {
      ok: false,
      msg: "서버에 못 닿았습니다"
    };
  }
  U.doBarter = doBarter;
  U.wishToggle = function(name) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !s) return false;
    const L = T.wishOf(s).slice(), k = L.indexOf(name);
    if (k >= 0) {
      L.splice(k, 1);
      SX.log("☆ 찜을 풀었습니다 — " + name);
    } else {
      if (!T.wishable(name)) {
        SX.audio.play("denied");
        SX.log("장터에서 파는 물건만 찜할 수 있습니다");
        return false;
      }
      if (L.length >= T.WISH_MAX) {
        SX.audio.play("denied");
        SX.log("찜은 " + T.WISH_MAX + "개까지입니다 — [찜 목록]에서 몇 개 풀어 주십시오", "warn");
        return false;
      }
      L.push(name);
      SX.log("★ 찜했습니다 — " + name + " · 좌판에 들어오면 알려 드립니다", "good");
    }
    s.wish = L;
    SX.audio.play("click");
    SX.game.persist();
    return true;
  };
  U.wishIn = function(who) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !s || !T.NEED[who]) return [];
    const W = T.wishOf(s);
    if (!W.length) return [];
    const out = [];
    for (const [n, c] of T.catalog(who)) if (c.k === "always" && W.indexOf(n) >= 0 && T.open(s, who, n)) out.push(n);
    for (const q of I.stockOf(s, who)) if (q.row && q.row.qty > 0 && W.indexOf(q.def.name) >= 0 && out.indexOf(q.def.name) < 0) out.push(q.def.name);
    return out;
  };
  U.wishArrive = function(save) {
    const T = SX.trade;
    if (!T || !save) return [];
    const W = T.wishOf(save);
    if (!W.length) return [];
    const got = [];
    for (const st of D.stalls) if (T.NEED[st.id]) for (const r of save.stock && save.stock[st.id] || []) if (r.qty > 0 && W.indexOf(r.name) >= 0) got.push([ st.id, r.name ]);
    for (const r of save.deal && save.deal.smug || []) if (r.qty > 0 && W.indexOf(r.name) >= 0) got.push([ "smuggle", r.name ]);
    if (!got.length) {
      save.wishNew = [];
      return got;
    }
    save.wishNew = got.map(g => g[0]).filter((w, k, a) => a.indexOf(w) === k);
    SX.log("★ 찜한 물건이 좌판에 들어왔습니다 — " + got.map(([w, n]) => T.NAME[w] + " " + n).join(" · "), "good");
    return got;
  };
  function tabBadges(tabs) {
    const T = SX.trade, s = SX.game.save;
    if (!T || !s) return;
    for (const b of tabs.querySelectorAll("[data-tab]")) {
      const w = b.dataset.tab, l = T.NEED[w] ? T.level(s, w) : null;
      const t = (l && l.n > 1 ? "②③④"[l.n - 2] : "") + (w === "wish" ? T.wishOf(s).length ? T.wishOf(s).length + "" : "" : "");
      if ((b.dataset.badge || "") !== t) {
        if (t) b.dataset.badge = t; else delete b.dataset.badge;
      }
      b.toggleAttribute("data-wstar", w !== "wish" && U.wishIn(w).length > 0);
    }
  }
  function wishShop() {
    const T = SX.trade, s = SX.game.save, W = T.wishOf(s);
    s.wishNew = [];
    if (W.length && SX.net && SX.net.on() && Date.now() - fmFetchAt > 15e3) {
      fmFetchAt = Date.now();
      SX.net.market().then(() => {
        if (U.panelKind === "shop" && shopTab === "wish") renderShop();
      });
    }
    const col = document.createElement("div");
    col.className = "box col";
    col.style.flex = "1";
    col.innerHTML = `<h3><span>찜 목록 — ${W.length}/${T.WISH_MAX} ${U.qm("상점 줄의 ☆ · 자세히 창(우클릭)에서 찜합니다.<br>좌판에 들어오면 알려 드립니다.")}</span></h3>`;
    const L = document.createElement("div");
    L.className = "list alignList";
    L.style.flex = "1";
    L.style.setProperty("--alc", "auto 1fr auto auto auto");
    if (!W.length) {
      const e = document.createElement("div");
      e.className = "emptyBig";
      e.innerHTML = "<b>☆</b><span>아직 찜한 물건이 없습니다</span><span class='small'>무기 · 탄약 · 약 같은 좌판 줄의 ☆ 를 누르시면 됩니다</span>";
      L.appendChild(e);
      col.classList.add("emptyCol");
    }
    for (const name of W) {
      const d = I.def(name) || T.catalog("ammo").get(name) && T.catalog("ammo").get(name).d || {
        name,
        w: 1,
        h: 1
      };
      const r = document.createElement("div");
      r.className = "li wishRow";
      const icon = d.kind === "ammo" ? {
        name: d.one ? d.one : d.name,
        kind: "ammo",
        cal: d.cal,
        w: 2,
        h: d.one ? 2 : 1
      } : d;
      const cv = iconCanvas(Object.assign({}, icon, {
        w: icon.w || 1,
        h: icon.h || 1
      }));
      const k = Math.min(1, 4 / (icon.w || 1), 1.375 / (icon.h || 1));
      cv.style.width = "calc(var(--u)*" + 16 * (icon.w || 1) * k + ")";
      cv.style.height = "calc(var(--u)*" + 16 * (icon.h || 1) * k + ")";
      cv.style.flex = "none";
      const cw = document.createElement("span");
      cw.style.width = "calc(var(--u)*66)";
      cw.style.height = "calc(var(--u)*22)";
      cw.style.display = "flex";
      cw.style.justifyContent = "center";
      cw.style.alignItems = "center";
      cw.appendChild(cv);
      r.appendChild(cw);
      const now = [], later = [];
      for (const q of T.sellers(name)) {
        const lv = T.level(s, q.who), def = (T.catalog(q.who).get(name) || {}).d || d, sale = T.saleOf(I.dealOf(s), q.who, lv);
        const shut = q.k !== "rare" && !T.opens(q.who, name, lv);
        if (q.k === "always" && !shut) {
          now.push([ q.who, "늘 있음 — " + T.NAME[q.who] + " " + won(T.buyPrice(SX.worth ? SX.worth.price(name, q.who, q.p) : q.p, floorOf(def), sale)) ]);
          continue;
        }
        const row = shut ? null : I.stockOf(s, q.who).find(o => o.def.name === name && o.row && o.row.qty > 0);
        if (row) now.push([ q.who, "지금 " + T.NAME[q.who] + " 좌판에 있습니다 — " + won(T.buyPrice(row.price, floorOf(row.def), sale)) + "(남은 " + row.row.qty + "개)" ]); else later.push(q.k === "rare" ? T.NAME[q.who] + "(단골 3단계부터 가끔)" : shut ? T.NAME[q.who] + "(단골 " + q.at + "단계부터)" : T.NAME[q.who] + "(가끔)");
      }
      const fl = U.fmFor(name);
      if (fl) now.push([ "free", "프리마켓에 " + fl.n + "개 — 가장 싼 것 " + won(fl.min) ]);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = "★ " + esc(name) + "<br>" + (now.length ? now.map(x => "<b class='good'>" + esc(x[1]) + "</b>").join("<br>") : "<span class='small'>지금은 없습니다 — " + esc(later.join(" · ")) + " 좌판에 들어오면 알려 드립니다</span>");
      r.appendChild(nm);
      r.oncontextmenu = e => {
        e.preventDefault();
        U.showDetail({
          item: d
        });
      };
      if (now.length) {
        const g = document.createElement("button");
        g.className = "wishGo";
        g.textContent = "보러 가기";
        g.onclick = () => {
          shopFresh = true;
          shopTab = now[0][0];
          if (shopTab === "free") U.fmFind(name);
          SX.audio.play("click");
          renderShop();
        };
        r.appendChild(g);
      }
      if (fl && now[0][0] !== "free") {
        const g = document.createElement("button");
        g.className = "wishFm";
        g.textContent = "프리마켓 보기";
        g.onclick = () => {
          shopFresh = true;
          shopTab = "free";
          U.fmFind(name);
          SX.audio.play("click");
          renderShop();
        };
        r.appendChild(g);
      }
      const x = document.createElement("button");
      x.textContent = "찜 풀기";
      x.onclick = () => {
        if (U.wishToggle(name)) renderShop();
      };
      r.appendChild(x);
      L.appendChild(r);
    }
    col.appendChild(L);
    return col;
  }
  const uPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 3;
  function payOf(d, price, who) {
    if (SX.worth) price = SX.worth.price(d.name, who, price);
    const T = SX.trade, s = SX.game.save, lv = who && T ? T.level(s, who) : null, sale = lv && T.saleOf ? T.saleOf(I.dealOf(s), who, lv) : 0, pay = sale ? T.buyPrice(price, floorOf(d), sale) : price;
    return {
      price,
      pay,
      sale,
      lv
    };
  }
  const buyItems = d => d.kind === "ammo" ? d.one ? [ I.mk(d.one) ] : [ 0, 1, 2 ].map(() => I.mk(I.MAGS[d.cal])) : [ I.mk(d) ];
  function buyDo(d, P, row, who, many) {
    const s = SX.game.save, T = SX.trade;
    if (row && !(row.qty > 0)) {
      SX.audio.play("denied");
      SX.log("다 팔렸습니다");
      return "sold";
    }
    if (who && T && T.NEED[who] && T.open && !T.open(s, who, d.name, !!(row && row.rare))) {
      SX.audio.play("denied");
      SX.log("아직 안 파는 물건입니다 — " + T.NAME[who] + " 단골 " + T.unlockAt(who, d.name) + "단계부터 팝니다", "warn");
      return "lock";
    }
    if (SX.worth && T && T.isCure && T.isCure(d.name)) {
      const p2 = SX.worth.price(d.name, who, P.price), q2 = P.sale ? T.buyPrice(p2, floorOf(d), P.sale) : p2;
      if (q2 !== P.pay) {
        SX.audio.play("denied");
        SX.log("재산이 바뀌어 증상 억제약 값이 " + won(q2) + "(으)로 바뀌었습니다 — 다시 눌러 주십시오", "warn");
        return "cure";
      }
    }
    if (s.money < P.pay) {
      SX.audio.play("denied");
      SX.log("돈이 모자랍니다");
      return "money";
    }
    const items = buyItems(d), placed = [];
    for (const it of items) {
      if (I.putJoin(s.stash, it)) placed.push(it);
    }
    if (placed.length < items.length) {
      for (const it of placed) I.take(s.stash, it);
      SX.audio.play("denied");
      SX.log("보관함에 자리가 없습니다");
      return "room";
    }
    s.money -= P.pay;
    if (row) row.qty--;
    if (!many) {
      SX.audio.play("buy");
      SX.log("샀습니다: " + d.name);
    }
    if (who) loyAdd(who, P.pay, {
      n: d.name,
      p: P.pay,
      k: "b"
    });
    return "";
  }
  function roomFor(list) {
    if (!list.length) return true;
    const g = I.gridFrom(I.gridDump(SX.game.save.stash));
    for (const it of list) if (!it || !I.putJoin(g, it)) return false;
    return true;
  }
  function iconFit(d, wu, hu) {
    const icon = d.kind === "ammo" ? {
      name: d.one ? d.one : d.name,
      kind: "ammo",
      cal: d.cal,
      w: 2,
      h: d.one ? 2 : 1
    } : d, w = icon.w || 1, h = icon.h || 1;
    const cv = iconCanvas(Object.assign({}, icon, {
      w,
      h
    })), k = Math.min(1, wu / (16 * w), hu / (16 * h));
    cv.style.width = "calc(var(--u)*" + 16 * w * k + ")";
    cv.style.height = "calc(var(--u)*" + 16 * h * k + ")";
    cv.style.flex = "none";
    return cv;
  }
  const cellsOf = d => {
    if (d.kind !== "ammo") return (d.w || 1) * (d.h || 1);
    const m = I.def(d.one || I.MAGS[d.cal]);
    return (m && m.w || 1) * (m && m.h || 1) * (d.one ? 1 : 3);
  };
  function specOf(d, pay) {
    const k = d.kind, out = [];
    if (k === "gun") out.push(d.caliber, "피해 " + (d.dmg || 0) * (d.pellets || 1), "분당 " + (d.rof ? Math.round(60 / d.rof) : 0) + "발"); else if (k === "melee") out.push("피해 " + (d.dmg || 0)); else if (k === "ammo") {
      const m = I.def(d.one || I.MAGS[d.cal]), n = (m && m.cap || 0) * (d.one ? 1 : 3);
      out.push(d.cal);
      if (n) out.push("발당 " + won(Math.round(pay / n)));
    } else if (k === "mag") out.push(d.caliber, (d.cap || d.ammo || 0) + "발"); else if (k === "heal") out.push(...I.medLines(d).slice(0, 2)); else if (k === "armor" || k === "helmet") {
      if (d.cls) out.push(d.cls + "급");
      out.push("내구 " + (d.armor || 0));
    } else if (k === "bag" || k === "rig") out.push((d.cols || 0) + "×" + (d.rows || 0) + "칸 수납"); else if (k === "part") out.push((SX.PART_SLOT_NAMES || {})[(SX.partDef ? SX.partDef(d) : d).slot] || "");
    return out.filter(Boolean);
  }
  function soldRows(who) {
    const s = SX.game.save, T = SX.trade, lv = T && T.NEED[who] ? T.level(s, who) : null, ok = (n, rare) => !lv || T.opens(who, n, lv, rare), out = [];
    if (who === "smuggle") {
      for (const r of I.dealOf(s).smug) {
        const d = I.def(r.name);
        if (d && !(r.qty > 0) && ok(r.name, true)) out.push({
          def: d,
          price: Math.max(r.price, d.val || 0),
          row: r
        });
      }
      return out;
    }
    const st = D.stalls.find(x => x.id === who), rows = st && s.stock && s.stock[who] || [];
    for (const r of rows) {
      if (r.qty > 0) continue;
      const d = r.rare ? I.def(r.name) : st.pool.find(q => q.name === r.name);
      if (d && ok(r.name, !!r.rare)) out.push({
        def: d,
        price: r.rare ? Math.max(r.price, d.val || 0) : r.price,
        row: r
      });
    }
    return out;
  }
  function mkRow(d, price, row, who, sold) {
    const s = SX.game.save, T = SX.trade, P = payOf(d, price, who);
    const r = document.createElement("div");
    r.className = "li mkRow";
    r._it = d;
    r._P = P;
    r._base = price;
    r._row = row;
    r._who = who;
    r._sold = !!sold;
    r._pay = P.pay;
    r._key = d.name + "|" + (row ? row.rare ? "r" : "s" : "a");
    r._cells = cellsOf(d);
    r._left = row ? row.qty | 0 : Infinity;
    r._nm = (d.name + " " + (SX.lang === "en" && SX.tr ? SX.tr(d.name) : "")).toLowerCase();
    r._wish = !!(T && T.wished && T.wished(s, d.name));
    if (who && T && T.wishable(d.name)) {
      const on = T.wished(s, d.name), wb = document.createElement("span");
      wb.className = "wishBtn" + (on ? " on" : "");
      wb.textContent = on ? "★" : "☆";
      wb.setAttribute("role", "button");
      wb.title = on ? "찜 풀기" : "찜하기 — 좌판에 들어오면 알려 드립니다";
      wb.onclick = e => {
        e.stopPropagation();
        if (U.wishToggle(d.name)) renderShop();
      };
      r.appendChild(wb);
    } else r.appendChild(document.createElement("span"));
    const ic = document.createElement("span");
    ic.className = "mkIc";
    ic.appendChild(iconFit(d, 40, 18));
    r.appendChild(ic);
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.innerHTML = "<span class='nmT' data-fit>" + esc(d.name) + (d.kind === "ammo" ? " <span class='small'>(" + boxLabel(d) + ")</span>" : d.kind === "mag" ? " <span class='small'>(한 개 · " + (d.ammo | 0) + "발)</span>" : "") + "</span>" + (row && row.rare ? "<span class='rareTag'>귀한 물건</span>" : "");
    if (d.kind !== "ammo") {
      nm.dataset.tip = "1";
      nm.onmouseenter = e => {
        const it = I.mk(d);
        tip.innerHTML = I.describe(it) + I.compareHtml(it, SX.game.kit) + "<br><span class='small dim'>우클릭: 자세히</span>";
        tip.classList.remove("hidden");
        tip.style.left = e.clientX + 16 + "px";
        tip.style.top = e.clientY + 12 + "px";
      };
      nm.onmouseleave = () => tip.classList.add("hidden");
    }
    r.appendChild(nm);
    const sp = document.createElement("span");
    sp.className = "mkSpec small";
    sp.dataset.fit = "";
    specOf(d, P.pay).forEach((x, i) => {
      if (i) sp.append(" · ");
      const e = document.createElement("span");
      e.textContent = x;
      sp.appendChild(e);
    });
    r.appendChild(sp);
    const ce = document.createElement("span");
    ce.className = "mkNum";
    ce.textContent = r._cells;
    r.appendChild(ce);
    const lf = document.createElement("span");
    lf.className = "mkNum";
    lf.textContent = row ? (row.qty > 0 ? row.qty : 0) + "개" : "늘 있음";
    r.appendChild(lf);
    const pc = document.createElement("span");
    pc.className = "mkPc";
    const pr = document.createElement("span");
    pr.className = "pr";
    if (P.pay < P.price) {
      const was = document.createElement("s");
      was.className = "small mkWas";
      was.textContent = won(P.price);
      pc.appendChild(was);
      pr.textContent = won(P.pay);
      pr.title = "오늘 할인 −" + Math.round(P.sale * 100) + "%(단골 " + P.lv.n + "단계)";
    } else pr.textContent = won(P.price);
    if (T && T.isCure && T.isCure(d.name)) pr.title = "값은 가진 재산의 3%입니다(최소 20만 원" + (who === "smuggle" ? " · 웃돈 " + D.smuggleMarkup + "%" : "") + ")" + (pr.title ? " · " + pr.title : "");
    pc.appendChild(pr);
    if (!sold && s.money < P.pay) {
      const sh = document.createElement("span");
      sh.className = "mkShort small";
      sh.textContent = won(P.pay - s.money) + " 부족";
      pc.appendChild(sh);
      r.classList.add("mkPoor");
    }
    r.appendChild(pc);
    const b = document.createElement("button");
    if (sold) {
      b.textContent = "품절";
      b.dataset.en = "Sold";
      b.disabled = true;
      r.classList.add("mkSold");
    } else {
      b.textContent = "구매";
      b.onclick = e => {
        e.stopPropagation();
        const res = buyDo(d, P, row, who);
        if (!res || res === "lock" || res === "cure") renderShop();
      };
    }
    r.appendChild(b);
    r.oncontextmenu = e => {
      e.preventDefault();
      U.showDetail({
        item: d
      });
    };
    r.title = "우클릭: 자세히";
    r.onclick = e => {
      if (e.target.closest("button, .wishBtn")) return;
      SX.audio.play("click");
      mkPick(r);
    };
    return r;
  }
  function mkSortRows(rows) {
    const k = mkView.sort, dir = mkView.dir, en = SX.lang === "en" && SX.tr;
    const cmp = (a, b) => k === "name" ? (en ? SX.tr(a._it.name) : a._it.name).localeCompare(en ? SX.tr(b._it.name) : b._it.name, en ? "en" : "ko") : k === "cells" ? a._cells - b._cells : k === "left" ? a._left === b._left ? 0 : a._left < b._left ? -1 : 1 : k === "price" ? a._pay - b._pay : 0;
    rows.sort((a, b) => a._sold - b._sold || cmp(a, b) * dir || a._i - b._i);
  }
  function buyTable(who, st) {
    const s = SX.game.save, L = document.createElement("div");
    L.className = "list mkList";
    L.dataset.sc = "buyList";
    const H = document.createElement("div");
    H.className = "mkHead";
    const sb = (k, n) => `<span role="button" tabindex="0" class="mkSort" data-sort="${k}" aria-sort="${mkView.sort === k ? mkView.dir > 0 ? "ascending" : "descending" : "none"}"><span>${n}</span><span class="mkArr">${mkView.sort === k ? mkView.dir > 0 ? "▲" : "▼" : ""}</span></span>`;
    H.innerHTML = `<span></span><span></span>${sb("name", "이름")}<span>주요 성능</span>${sb("cells", "칸 수")}${sb("left", "재고")}${sb("price", "값")}<span></span>`;
    H.onclick = e => {
      const b = e.target.closest("[data-sort]");
      if (!b) return;
      const k = b.dataset.sort;
      if (mkView.sort === k) mkView.dir = -mkView.dir; else {
        mkView.sort = k;
        mkView.dir = k === "left" ? -1 : 1;
      }
      SX.audio.play("click");
      renderShop();
    };
    H.onkeydown = e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const b = e.target.closest("[data-sort]");
      if (b) {
        e.preventDefault();
        e.stopPropagation();
        b.click();
      }
    };
    const rows = [], add = (d, price, row, sold) => {
      const r = mkRow(d, price, row, who, sold);
      r._i = rows.length;
      rows.push(r);
    };
    if (st) {
      for (const d of st.always) if (!SX.trade || SX.trade.open(s, st.id, d.name)) add(d, d.price, null);
      for (const q of I.stockOf(s, st.id)) add(q.def, q.price, q.row);
    } else {
      for (const [d, p] of U.smuggleRows()) add(d, p, null);
      for (const q of I.stockOf(s, "smuggle")) add(q.def, q.price, q.row);
    }
    const live = rows.length;
    for (const q of soldRows(who)) add(q.def, q.price, q.row, true);
    mkSortRows(rows);
    for (const r of rows) L.appendChild(r);
    mkFitTitle(L);
    L.appendChild(H);
    const none = document.createElement("div");
    none.className = "small mkNone";
    none.textContent = live || rows.length ? "찾는 물건이 없습니다" : "오늘은 물건이 없습니다 — 한 판 다녀오면 새로 들어옵니다";
    L.appendChild(none);
    return L;
  }
  function mkFitTitle(L) {
    L.addEventListener("mouseover", e => {
      const t = e.target.closest && e.target.closest("[data-fit]");
      if (!t || !L.contains(t)) return;
      if (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1) t.title = t.textContent.replace(/\s+/g, " ").trim(); else t.removeAttribute("title");
    });
  }
  function mkSnap(body) {
    const L = body.querySelector(".mkList");
    if (!L || !L.isConnected) return;
    L.style.marginTop = "";
    const f = L.getBoundingClientRect().top % 1;
    if (f > .01 && f < .99) L.style.marginTop = (1 - f).toFixed(3) + "px";
  }
  function mkFilter(force) {
    const L = document.querySelector("#shopBody .mkList");
    if (!L) return;
    const qe = document.querySelector("#shopTabs .mkQ"), q = (qe && qe.value || "").trim().toLowerCase(), money = SX.game.save.money;
    let z = 0, sel = null, first = null;
    for (const r of L.querySelectorAll(":scope > .mkRow")) {
      const ok = (!q || r._nm.indexOf(q) >= 0) && (!MK.can || !r._sold && money >= r._pay) && (!MK.wish || r._wish);
      r.classList.toggle("mkHide", !ok);
      r.classList.toggle("mkZ", ok && z % 2 === 1);
      if (ok) {
        z++;
        if (!first) first = r;
        if (r._key === mkView.sel) sel = r;
      }
    }
    const none = L.querySelector(":scope > .mkNone");
    if (none) none.classList.toggle("mkHide", z > 0);
    const pick = sel || first;
    if (force || !pick || pick._key !== mkView.sel || !pick.classList.contains("mkSel")) mkPick(pick, true);
  }
  function mkPick(r, quiet) {
    const L = document.querySelector("#shopBody .mkList");
    if (L) for (const x of L.querySelectorAll(":scope > .mkSel")) if (x !== r) x.classList.remove("mkSel");
    if (r) r.classList.add("mkSel");
    const k = r ? r._key : "";
    if (k !== mkView.sel) {
      mkView.sel = k;
      mkView.qty = 1;
    }
    if (!quiet && MK.pane !== "info") {
      MK.pane = "info";
      mkSave();
      mkPane();
    }
    const box = document.querySelector("#shopBody .mkInfo");
    if (box) mkInfoFill(box, r);
  }
  function mkPane() {
    const side = document.querySelector("#shopBody .mkSide");
    if (!side) return;
    for (const b of side.querySelectorAll(".mkSeg [data-pane]")) b.classList.toggle("on", b.dataset.pane === MK.pane);
    const a = side.querySelector(".mkInfo"), b = side.querySelector(".mkStash");
    if (a) a.classList.toggle("mkVOff", MK.pane !== "info");
    if (b) b.classList.toggle("mkVOff", MK.pane !== "stash");
  }
  function mkFoot(who) {
    const f = document.createElement("div");
    f.className = "mkFoot";
    const bb = barterBox(who), n = bb.querySelectorAll(".li.bart:not(.keySw)").length + (bb.querySelector(".keySwBox") ? 1 : 0), open = mkView.bart && n > 0;
    bb.dataset.sc = "mkBart";
    bb.classList.toggle("mkHide", !open);
    f.appendChild(bb);
    const bar = document.createElement("div");
    bar.className = "mkFootBar";
    const t = document.createElement("button");
    t.className = "mkBart";
    t.setAttribute("aria-expanded", open ? "true" : "false");
    t.disabled = !n;
    t.innerHTML = "🔁 <span>" + esc("물물교환 " + n + "건") + "</span> <span class='mkArr'>" + (open ? "▾" : "▸") + "</span>";
    t.onclick = () => {
      mkView.bart = !mkView.bart;
      SX.audio.play("click");
      renderShop();
    };
    bar.appendChild(t);
    bar.insertAdjacentHTML("beforeend", U.qm("쓸 데 없는 잡동사니를 주고 바꿉니다.<br>좌판에 새 물건이 들어오면 바뀝니다.<br>보관함 · 가방 · 리그에 든 것을 씁니다."));
    f.appendChild(bar);
    return f;
  }
  function buySide(s) {
    const side = document.createElement("div");
    side.className = "col shopSide mkSide";
    const seg = document.createElement("div");
    seg.className = "mkSeg";
    seg.innerHTML = `<button data-pane="info">자세히</button><button data-pane="stash"><span>내 보관함</span> <span class="small">${I.cells(s.stash)}/${s.stash.cols * s.stash.rows}칸</span></button>`;
    seg.onclick = e => {
      const b = e.target.closest("[data-pane]");
      if (!b || MK.pane === b.dataset.pane) return;
      MK.pane = b.dataset.pane;
      mkSave();
      SX.audio.play("click");
      mkPane();
    };
    const views = document.createElement("div");
    views.className = "mkViews";
    const info = document.createElement("div");
    info.className = "box mkInfo";
    const st = document.createElement("div");
    st.className = "box mkStash";
    const wrap = document.createElement("div");
    wrap.className = "mkStashWrap";
    wrap.dataset.sc = "furnStash";
    const c = Math.max(8, Math.min(cellPx() * 1.6, Math.floor((uPx() * 193 - 18) / s.stash.cols)));
    wrap.appendChild(gridEl(s.stash, "other", {
      c
    }));
    st.appendChild(wrap);
    views.append(info, st);
    side.append(seg, views);
    for (const b of seg.querySelectorAll("[data-pane]")) b.classList.toggle("on", b.dataset.pane === MK.pane);
    info.classList.toggle("mkVOff", MK.pane !== "info");
    st.classList.toggle("mkVOff", MK.pane !== "stash");
    return side;
  }
  let gunMax = null;
  function mkCmp(d, it) {
    const kit = SX.game.kit, k = d.kind;
    if (k !== "gun" && k !== "armor" && k !== "helmet") return "";
    const cur = k === "gun" ? kit.w1 || kit.w2 || null : kit[k] || null;
    const kgOf = x => I.weight(Object.assign({}, x, {
      grid: null,
      box: null
    }));
    let R;
    if (k === "gun") {
      if (!gunMax) {
        gunMax = {
          dm: 1,
          rpm: 1,
          mag: 1,
          rl: 1,
          kg: 1
        };
        for (const g of SX.gunDefs || []) {
          gunMax.dm = Math.max(gunMax.dm, (g.dmg || 0) * (g.pellets || 1));
          gunMax.rpm = Math.max(gunMax.rpm, g.rof ? Math.round(60 / g.rof) : 0);
          gunMax.mag = Math.max(gunMax.mag, g.magSize || 0);
          gunMax.rl = Math.max(gunMax.rl, g.reload || 1.3);
          gunMax.kg = Math.max(gunMax.kg, g.kg || 0);
        }
      }
      const dm = x => (x.dmg || 0) * (x.pellets || 1), rpm = x => x.rof ? Math.round(60 / x.rof) : 0;
      R = [ [ "피해", dm, gunMax.dm, v => String(v), true, 0 ], [ "연사", rpm, gunMax.rpm, v => v + "/분", true, 0 ], [ "탄창", x => x.magSize || 0, gunMax.mag, v => v + "발", true, 0 ], [ "장전", x => +(x.reload || 1.3), gunMax.rl, v => v + "초", false, 1 ], [ "무게", kgOf, gunMax.kg, v => v + "kg", false, 2 ] ];
    } else {
      R = [ [ "방탄 등급", x => +(x.cls || (I.def(x.name) || {}).cls || 0), 6, v => v + "급", true, 0 ], [ "내구", x => Math.round(x.armor || 0), 900, v => String(v), true, 0 ], [ "걸음 느려짐", x => {
        const v = x.slow != null ? x.slow : (I.def(x.name) || {}).slow;
        return Math.round((+v || 0) * 100);
      }, 12, v => v + "%", false, 0 ], [ "무게", kgOf, 12, v => v + "kg", false, 2 ] ];
    }
    const rnd = (v, n) => {
      const q = Math.pow(10, n);
      return Math.round(v * q) / q;
    }, pct = (v, m) => Math.max(0, Math.min(100, Math.round(100 * v / (m || 1))));
    let h = "<div class='mkCmp'>";
    for (const [name, f, mx, fm, up, dp] of R) {
      const a = rnd(f(it), dp), b = cur ? rnd(f(cur), dp) : null, df = b == null ? 0 : rnd(a - b, dp), m = Math.max(mx, a, b || 0);
      const mark = !df ? "" : (up ? df > 0 : df < 0) ? " <b class='mkUp'>▲</b>" : " <b class='mkDn'>▼</b>";
      h += "<div class='mkBar'><span class='mkBk'>" + name + "</span><span class='mkTr'><i style='width:" + pct(a, m) + "%'></i>" + (b != null ? "<em style='left:" + pct(b, m) + "%'></em>" : "") + "</span><span class='mkBv'>" + fm(a) + mark + "</span></div>";
    }
    h += "</div><div class='mkLeg small'>" + (cur ? "<span>막대는 이 물건 · 하늘색 금은 지금 낀 것</span> <span class='mkCurNm'>" + esc(cur.name) + "</span>" : "<span>지금 낀 것이 없어 견주지 않습니다</span>") + "</div>";
    return h;
  }
  function mkInfoFill(box, r) {
    const s = SX.game.save, T = SX.trade;
    box.innerHTML = "";
    if (!r) {
      box.innerHTML = "<div class='emptyBig'><b>🔍</b><span>물건을 고르면 여기에 자세히 나옵니다</span></div>";
      return;
    }
    const d = r._it, row = r._row, who = r._who, sold = r._sold, cure = !!(T && T.isCure && T.isCure(d.name));
    const it = d.kind === "ammo" ? I.mk(d.one || I.MAGS[d.cal]) : I.mk(d);
    const top = document.createElement("div");
    top.className = "mkInfoTop";
    top.dataset.sc = "mkInfo";
    const pic = document.createElement("div");
    pic.className = "mkPic";
    const icon = d.kind === "ammo" ? {
      name: d.one ? d.one : d.name,
      kind: "ammo",
      cal: d.cal,
      w: 2,
      h: d.one ? 2 : 1
    } : d;
    const u = uPx();
    pic.appendChild(bigCanvas(ART.icon(Object.assign({}, icon, {
      w: icon.w || 1,
      h: icon.h || 1
    })), u * 180, u * 46));
    if (row && row.rare) pic.insertAdjacentHTML("beforeend", "<span class='rareTag'>귀한 물건</span>");
    if (who && T && T.wishable(d.name)) {
      const on = T.wished(s, d.name), wb = document.createElement("span");
      wb.className = "wishBtn" + (on ? " on" : "");
      wb.textContent = on ? "★" : "☆";
      wb.setAttribute("role", "button");
      wb.title = on ? "찜 풀기" : "찜하기 — 좌판에 들어오면 알려 드립니다";
      wb.onclick = () => {
        if (U.wishToggle(d.name)) renderShop();
      };
      pic.appendChild(wb);
    }
    top.appendChild(pic);
    const desc = it ? I.describe(it, true, true) : "", km = desc.match(/<span class='k'>[\s\S]*?<\/span>/);
    const ti = document.createElement("div");
    ti.className = "mkTitle";
    ti.innerHTML = esc(d.name) + (d.kind === "ammo" ? " <span class='small'>(" + boxLabel(d) + ")</span>" : d.kind === "mag" ? " <span class='small'>(한 개 · " + (d.ammo | 0) + "발)</span>" : "");
    top.appendChild(ti);
    const kd = document.createElement("div");
    kd.className = "mkKind small";
    kd.innerHTML = d.kind === "ammo" ? esc(d.cal) + " · " + r._cells + "칸" : (km ? km[0] : "") + (d.caliber ? " · " + esc(d.caliber) : "");
    top.appendChild(kd);
    const cmp = mkCmp(d, it);
    if (cmp) top.insertAdjacentHTML("beforeend", cmp);
    let ds = desc.replace(/^<h4>[\s\S]*?<\/h4>/, "").replace(/^<span class='k'>[\s\S]*?<\/span>(<br>)?/, "");
    const cut = ds.indexOf("<span class='money'>팔면");
    if (cut >= 0) ds = ds.slice(0, cut).replace(/(<br>)+$/, "");
    if (ds) {
      const de = document.createElement("div");
      de.className = "mkDesc";
      de.innerHTML = ds;
      top.appendChild(de);
    }
    const max = sold ? 0 : cure ? Math.min(1, s.money >= r._pay ? 1 : 0) : Math.max(0, Math.min(30, row ? row.qty | 0 : 30, Math.floor(s.money / Math.max(1, r._pay))));
    const buy = document.createElement("div");
    buy.className = "mkBuyBox";
    buy.innerHTML = `<div class="mkQty"><span class="small">개수</span><button data-q="-1">−</button><input class="mkN" type="text" inputmode="numeric" maxlength="2" data-keep="mkN"><button data-q="1">+</button><button data-q="5">5개</button><button data-q="all">전부</button></div>` + `<div class="mkTot"><span class="small">값</span><b class="mkBig"></b><s class="small mkWas"></s></div><div class="mkRoom small"></div><div class="mkAfter small"></div>`;
    const bb = document.createElement("button");
    bb.className = "big mkBuy";
    bb.textContent = "구매하기";
    buy.appendChild(bb);
    const sh = document.createElement("div");
    sh.className = "mkSellHint small";
    buy.appendChild(sh);
    box.append(top, buy);
    const N = buy.querySelector(".mkN");
    const apply = () => mkQtyApply(buy, r, max);
    buy.querySelector(".mkQty").onclick = e => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      const q = b.dataset.q;
      mkView.qty = q === "all" ? max : q === "5" ? 5 : mkView.qty + +q;
      SX.audio.play("click");
      apply();
    };
    N.oninput = () => {
      const v = parseInt(N.value.replace(/[^0-9]/g, ""), 10);
      if (v > 0) {
        mkView.qty = v;
        apply();
        N.value = String(mkView.qty);
      }
    };
    N.onblur = () => {
      N.value = String(mkView.qty);
    };
    bb.onclick = () => {
      const n = Math.max(1, Math.min(mkView.qty, max));
      let k = 0, res = "";
      for (let q = 0; q < n; q++) {
        res = buyDo(d, q ? payOf(d, r._base, who) : r._P, row, who, n > 1);
        if (res) break;
        k++;
      }
      if (n > 1 && k > 0) {
        SX.audio.play("buy");
        SX.log("샀습니다: " + d.name + " × " + k);
      }
      if (k > 0 || res === "lock" || res === "cure") {
        mkView.qty = 1;
        renderShop();
      }
    };
    apply();
  }
  function mkQtyApply(box, r, max) {
    const s = SX.game.save, P = r._P, sold = r._sold;
    mkView.qty = Math.max(1, Math.min(mkView.qty | 0 || 1, Math.max(1, max)));
    const n = mkView.qty, N = box.querySelector(".mkN");
    if (N && N !== document.activeElement) N.value = String(n);
    inputMem.set("mkN", String(n));
    for (const b of box.querySelectorAll(".mkQty [data-q]")) {
      const q = b.dataset.q;
      b.disabled = max < 1 || (q === "-1" ? n <= 1 : q === "1" ? n >= max : q === "5" ? max < 5 || n === 5 : n === max);
    }
    const tot = P.pay * n;
    box.querySelector(".mkBig").textContent = won(tot);
    box.querySelector(".mkWas").textContent = P.pay < P.price ? won(P.price * n) : "";
    const items = [];
    for (let q = 0; q < n; q++) items.push(...buyItems(r._it));
    const room = roomFor(items), after = s.money - tot;
    const rm = box.querySelector(".mkRoom");
    rm.textContent = sold ? "다 팔렸습니다" : room ? "✔ 보관함 자리 넉넉함" : "보관함에 자리가 없습니다";
    rm.classList.toggle("mkBad", !sold && !room);
    rm.classList.toggle("mkOk", !sold && room);
    const af = box.querySelector(".mkAfter");
    af.textContent = after >= 0 ? "산 뒤 " + won(after) : won(-after) + " 부족";
    af.classList.toggle("mkBad", after < 0);
    const bb = box.querySelector(".mkBuy");
    bb.disabled = sold || max < 1 || !room;
    let v = 0;
    for (const it of items) if (it) v += I.brokerValue(it);
    box.querySelector(".mkSellHint").textContent = "판매 값 " + won(v) + " · 「판매」 탭에서 끌어다 놓거나 Shift+클릭";
  }
  const KIND_KO = {
    gun: "총",
    melee: "근접무기",
    mag: "탄창",
    heal: "의약품",
    armor: "방탄복",
    helmet: "방탄모",
    bag: "가방",
    rig: "리그",
    part: "총 파츠",
    cure: "억제약",
    flare: "신호탄",
    grenade: "투척",
    key: "열쇠",
    afix: "방탄 수리",
    nvg: "야간 투시경",
    trap: "덫",
    rod: "낚싯대"
  };
  const kindKo = d => KIND_KO[d.kind] || (!d.kind && SX.needs && SX.needs.of && SX.needs.of(d) ? SX.needs.of(d).f > 0 ? "먹을 것" : "마실 것" : "물건");
  function packView() {
    const s = SX.game.save, G = SX.game, LO = SX.loadout, T = SX.trade, opts = [];
    if (G.raidStartKit && LO) {
      try {
        opts.push([ "last", "지난 판", LO.capture(I.kitFrom(G.raidStartKit), "") ]);
      } catch (e) {}
    }
    if (LO) for (const o of LO.list(s)) if (!opts.some(x => x[0] === "s:" + o.name)) opts.push([ "s:" + o.name, o.name, o ]);
    const cur = opts.find(o => o[0] === MK.pk) || opts[0] || null;
    const left = document.createElement("div");
    left.className = "box col shopList mkLeft mkPack";
    left.innerHTML = `<h3><span>🎒 출격 묶음 ${U.qm("지난 판에 들고 나간 것이나 장비 세트를 고르면 모자란 것만 한꺼번에 삽니다.<br>보관함과 지금 장비에 있는 것은 가진 것으로 셉니다.<br>값은 지금 좌판에서 가장 싼 곳 기준입니다.")}</span></h3>`;
    const side = document.createElement("div");
    side.className = "col shopSide mkSide mkCartSide";
    const C = document.createElement("div");
    C.className = "box col mkCart";
    side.appendChild(C);
    if (!cur) {
      left.insertAdjacentHTML("beforeend", "<div class='emptyBig'><b>🎒</b><span>아직 정한 묶음이 없습니다</span><span class='small'>한 판 다녀오거나 장비 세트를 만들면 여기에 나옵니다</span></div>");
      C.innerHTML = "<h3><span>🧺 장바구니</span></h3><div class='emptyBig'><span class='small'>모자란 것이 여기에 담깁니다</span></div>";
      return [ left, side ];
    }
    const seg = document.createElement("div");
    seg.className = "mkPkSeg";
    for (const [k, n] of opts) {
      const b = document.createElement("button");
      b.dataset.pk = k;
      b.textContent = n;
      b.classList.toggle("on", k === cur[0]);
      seg.appendChild(b);
    }
    seg.onclick = e => {
      const b = e.target.closest("[data-pk]");
      if (!b || b.dataset.pk === cur[0]) return;
      MK.pk = b.dataset.pk;
      mkSave();
      mkView.cart.clear();
      SX.audio.play("click");
      renderShop();
    };
    left.appendChild(seg);
    const o = cur[2], need = new Map, have = new Map;
    const add = (n, c) => {
      if (n && I.def(n)) need.set(n, (need.get(n) || 0) + c);
    };
    for (const k of [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig" ]) {
      const w = o.slots && o.slots[k];
      if (w) {
        add(w.n, 1);
        for (const m of w.mods || []) add(m, 1);
      }
    }
    for (const [n, c] of (o.rig || []).concat(o.bag || [])) add(n, c | 0);
    const cnt = it => {
      if (!it) return;
      if (!it.story && !(it.kind === "mag" && !(it.ammo > 0))) have.set(it.name, (have.get(it.name) || 0) + I.qty(it));
      if (it.kind === "gun") for (const m of I.modsOf(it)) cnt(m);
      if (it.grid) for (const e of it.grid.list) cnt(e.it);
    };
    for (const e of s.stash.list) cnt(e.it);
    for (const k of I.SLOTS) cnt(G.kit && G.kit[k]);
    const offers = [], off = (d, price, row, who, where) => {
      const y = d.kind === "ammo" ? d.one ? [ d.one, 1 ] : [ I.MAGS[d.cal], 3 ] : [ d.name, 1 ];
      offers.push({
        d,
        P: payOf(d, price, who),
        base: price,
        row,
        who,
        where,
        give: y[0],
        per: y[1]
      });
    };
    for (const st of D.stalls) {
      for (const d of st.always || []) if (!T || T.open(s, st.id, d.name)) off(d, d.price, null, st.id, st.name);
      for (const q of I.stockOf(s, st.id)) off(q.def, q.price, q.row, st.id, st.name);
    }
    for (const [d, p] of U.smuggleRows()) off(d, p, null, "smuggle", "밀수꾼");
    for (const q of I.stockOf(s, "smuggle")) off(q.def, q.price, q.row, "smuggle", "밀수꾼");
    for (const [d, p] of U.foodRows()) off(d, p, null, null, "밥집");
    const lines = [];
    for (const [n, want] of need) {
      const h = have.get(n) || 0, short = Math.max(0, want - h);
      let best = null;
      for (const f of offers) {
        if (f.give !== n || f.row && !(f.row.qty > 0) || !(f.P.pay > 0)) continue;
        if (!best || f.P.pay / f.per < best.P.pay / best.per) best = f;
      }
      const cap = best ? best.row ? best.row.qty | 0 : 30 : 0, auto = best && short ? Math.min(Math.ceil(short / best.per), cap) : 0;
      const times = mkView.cart.has(n) ? Math.max(0, Math.min(mkView.cart.get(n), cap)) : auto;
      lines.push({
        n,
        want,
        h,
        short,
        best,
        cap,
        times,
        out: mkView.cart.has(n) && mkView.cart.get(n) === 0 && short > 0
      });
    }
    const L = document.createElement("div");
    L.className = "list mkPList";
    L.dataset.sc = "mkPack";
    L.innerHTML = "<div class='mkPHead'><span></span><span>이름</span><span>종류</span><span>가진 것 / 정한 것</span><span>상태</span><span>모자란 값</span></div>";
    for (const x of lines) {
      const d = I.def(x.n), r = document.createElement("div");
      r.className = "li mkPRow" + (x.short ? " mkPShort" : "") + (x.out ? " mkPOut" : "");
      const ic = document.createElement("span");
      ic.className = "mkIc";
      ic.appendChild(iconFit(d, 40, 18));
      r.appendChild(ic);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = "<span data-fit>" + esc(x.n) + "</span>" + (x.short && x.best ? "<span class='small' data-fit>" + esc(x.best.where) + "</span>" : "");
      r.appendChild(nm);
      const kd = document.createElement("span");
      kd.className = "small";
      kd.dataset.fit = "";
      kd.textContent = kindKo(d);
      r.appendChild(kd);
      const hv = document.createElement("span");
      hv.className = "mkNum";
      hv.textContent = x.h + " / " + x.want;
      r.appendChild(hv);
      const stt = document.createElement("span");
      stt.className = "mkPSt";
      stt.innerHTML = !x.short ? "<b class='mkOk' data-fit>✔ 넉넉함</b>" : "<b class='mkBad' data-fit>" + esc(x.short + "개 모자람") + "</b>" + (!x.best ? "<span class='small' data-fit>지금 안 팝니다</span>" : x.out ? "<span class='small' data-fit>장바구니에서 뺌 — 누르면 다시 담습니다</span>" : "");
      r.appendChild(stt);
      const co = document.createElement("span");
      co.className = "pr";
      co.textContent = x.short && x.best && x.times ? won(x.best.P.pay * x.times) : "";
      r.appendChild(co);
      r.oncontextmenu = e => {
        e.preventDefault();
        U.showDetail({
          item: d
        });
      };
      if (x.out) {
        r.title = "누르면 장바구니에 다시 담습니다";
        r.onclick = () => {
          mkView.cart.delete(x.n);
          SX.audio.play("click");
          renderShop();
        };
      }
      L.appendChild(r);
    }
    if (!lines.length) L.insertAdjacentHTML("beforeend", "<div class='emptyBig'><span>이 묶음엔 정한 것이 없습니다</span></div>");
    mkFitTitle(L);
    left.appendChild(L);
    const buy = lines.filter(x => x.best && x.times > 0), total = buy.reduce((t, x) => t + x.best.P.pay * x.times, 0), after = s.money - total;
    const items = [];
    for (const x of buy) for (let q = 0; q < x.times; q++) items.push(...buyItems(x.best.d));
    const room = roomFor(items);
    C.innerHTML = "<h3><span>🧺 <span>" + esc("장바구니 " + buy.length + "가지") + "</span></span></h3>";
    const CL = document.createElement("div");
    CL.className = "list mkCList";
    CL.dataset.sc = "mkCart";
    for (const x of buy) {
      const r = document.createElement("div");
      r.className = "li mkCLine";
      r.dataset.n = x.n;
      const ic = document.createElement("span");
      ic.className = "mkIc";
      ic.appendChild(iconFit(x.best.d, 24, 14));
      r.appendChild(ic);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.innerHTML = "<span data-fit>" + esc(x.best.d.name) + (x.best.d.kind === "ammo" ? " <span class='small'>(" + boxLabel(x.best.d) + ")</span>" : "") + "</span><span class='small' data-fit>" + esc(x.best.where) + "</span>";
      r.appendChild(nm);
      const q = document.createElement("span");
      q.className = "mkCQ";
      q.innerHTML = "<button data-cq='-1'>−</button><b class='mkNum'>" + x.times + "</b><button data-cq='1'>+</button>";
      q.querySelector("[data-cq='1']").disabled = x.times >= x.cap;
      r.appendChild(q);
      const pr = document.createElement("span");
      pr.className = "pr";
      pr.textContent = won(x.best.P.pay * x.times);
      r.appendChild(pr);
      const xb = document.createElement("button");
      xb.className = "mkX";
      xb.dataset.cq = "x";
      xb.textContent = "✕";
      xb.title = "장바구니에서 빼기";
      r.appendChild(xb);
      CL.appendChild(r);
    }
    if (!buy.length) CL.insertAdjacentHTML("beforeend", "<div class='emptyBig'><b>✔</b><span>모자란 것이 없습니다</span></div>");
    mkFitTitle(CL);
    CL.onclick = e => {
      const b = e.target.closest("[data-cq]");
      if (!b) return;
      const n = b.closest("[data-n]").dataset.n, x = lines.find(l => l.n === n);
      if (!x) return;
      mkView.cart.set(n, b.dataset.cq === "x" ? 0 : Math.max(0, Math.min(x.cap, x.times + +b.dataset.cq)));
      SX.audio.play("click");
      renderShop();
    };
    C.appendChild(CL);
    const sum = document.createElement("div");
    sum.className = "mkSum";
    sum.innerHTML = "<div class='mkTot'><span class='small'>합계</span><b class='mkBig'>" + won(total) + "</b></div><div class='small mkLeftM'></div><div class='small mkRoomM'></div>";
    {
      const a = sum.querySelector(".mkLeftM"), r = sum.querySelector(".mkRoomM");
      a.textContent = after >= 0 ? "산 뒤 남는 돈 " + won(after) : won(-after) + " 부족";
      a.classList.toggle("mkBad", after < 0);
      r.textContent = room ? "✔ 보관함 자리 넉넉함" : "보관함에 자리가 없습니다";
      r.classList.add(room ? "mkOk" : "mkBad");
    }
    C.appendChild(sum);
    const go = document.createElement("button");
    go.className = "big mkPackBuy";
    go.textContent = "모자란 것 한꺼번에 구매";
    go.disabled = !buy.length || after < 0 || !room;
    go.onclick = () => {
      let got = 0, stop = "";
      for (const x of buy) {
        let t = 0;
        for (let q = 0; q < x.times; q++) {
          stop = buyDo(x.best.d, q ? payOf(x.best.d, x.best.base, x.best.who) : x.best.P, x.best.row, x.best.who, true);
          if (stop) break;
          t++;
        }
        if (t) {
          got += t;
          SX.log(t > 1 ? "샀습니다: " + x.best.d.name + " × " + t : "샀습니다: " + x.best.d.name);
        }
        if (stop) break;
      }
      if (got) SX.audio.play("buy");
      mkView.cart.clear();
      renderShop();
    };
    C.appendChild(go);
    return [ left, side ];
  }
  function buyRow(d, price, row, who) {
    if (SX.worth) price = SX.worth.price(d.name, who, price);
    const r = document.createElement("div");
    r.className = "li";
    const T = SX.trade, lv = who && T ? T.level(SX.game.save, who) : null, sale = lv && T.saleOf ? T.saleOf(I.dealOf(SX.game.save), who, lv) : 0, pay = sale ? T.buyPrice(price, floorOf(d), sale) : price;
    const icon = d.kind === "ammo" ? {
      name: d.one ? d.one : d.name,
      kind: "ammo",
      cal: d.cal,
      w: 2,
      h: d.one ? 2 : 1
    } : d;
    const cv = iconCanvas(Object.assign({}, icon, {
      w: icon.w || 1,
      h: icon.h || 1
    }));
    const k = Math.min(1, 4 / (icon.w || 1), 2 / (icon.h || 1));
    cv.style.width = "calc(var(--u)*" + 16 * (icon.w || 1) * k + ")";
    cv.style.height = "calc(var(--u)*" + 16 * (icon.h || 1) * k + ")";
    cv.style.flex = "none";
    const cw = document.createElement("span");
    cw.style.width = "calc(var(--u)*66)";
    cw.style.display = "flex";
    cw.style.justifyContent = "center";
    cw.appendChild(cv);
    r.appendChild(cw);
    if (who && T && T.wishable(d.name)) {
      const on = T.wished(SX.game.save, d.name), wb = document.createElement("span");
      wb.className = "wishBtn" + (on ? " on" : "");
      wb.textContent = on ? "★" : "☆";
      wb.setAttribute("role", "button");
      wb.title = on ? "찜 풀기" : "찜하기 — 좌판에 들어오면 알려 드립니다";
      wb.onclick = e => {
        e.stopPropagation();
        if (U.wishToggle(d.name)) renderShop();
      };
      r.appendChild(wb);
    }
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.innerHTML = esc(d.name) + (d.kind === "ammo" ? " <span class='small'>(" + boxLabel(d) + ")</span>" : d.kind === "mag" ? " <span class='small'>(한 개 · " + (d.ammo | 0) + "발)</span>" : "") + (row && row.rare ? " <span class='rareTag'>귀한 물건</span>" : "");
    r.appendChild(nm);
    if (d.kind !== "ammo") {
      nm.dataset.tip = "1";
      nm.onmouseenter = e => {
        const it = I.mk(d);
        tip.innerHTML = I.describe(it) + I.compareHtml(it, SX.game.kit) + "<br><span class='small dim'>우클릭: 자세히</span>";
        tip.classList.remove("hidden");
        tip.style.left = e.clientX + 16 + "px";
        tip.style.top = e.clientY + 12 + "px";
      };
      nm.onmouseleave = () => tip.classList.add("hidden");
    }
    if (row) nm.innerHTML += " <span class='small'>남은 " + row.qty + "개</span>";
    const pr = document.createElement("span");
    pr.className = "pr";
    if (pay < price) {
      pr.innerHTML = "<s class='small'>" + won(price) + "</s> " + won(pay);
      pr.title = "오늘 할인 −" + Math.round(sale * 100) + "%(단골 " + lv.n + "단계)";
    } else pr.textContent = won(price);
    r.appendChild(pr);
    if (SX.trade && SX.trade.isCure && SX.trade.isCure(d.name)) pr.title = "값은 가진 재산의 3%입니다(최소 20만 원" + (who === "smuggle" ? " · 웃돈 " + D.smuggleMarkup + "%" : "") + ")" + (pr.title ? " · " + pr.title : "");
    r.oncontextmenu = e => {
      e.preventDefault();
      U.showDetail({
        item: d
      });
    };
    r.title = "우클릭: 자세히";
    const b = document.createElement("button");
    b.textContent = "구매";
    const P = {
      price,
      pay,
      sale,
      lv
    };
    b.onclick = () => {
      const res = buyDo(d, P, row, who);
      if (!res || res === "lock" || res === "cure") renderShop();
    };
    r.appendChild(b);
    return r;
  }
  function sellColumn() {
    const s = SX.game.save;
    const col = document.createElement("div");
    col.className = "col";
    col.style.flex = "1";
    const z = document.createElement("div");
    z.className = "box";
    z.id = "sellZone";
    z.innerHTML = `<h3><span>브로커 — 여기에 끌어다 놓으면 팝니다 ${U.qm("의뢰품은 " + I.QUEST_MUL + "배로 삽니다 · Shift+클릭으로 바로 팝니다.<br>판 물건은 그 쪽 상인과 거래한 것으로 칩니다(총 → 무기상 · 약 → 약재상 · 잡동사니 → 밀수꾼 …) — 단골 2단계부터 더 받습니다.")}</span></h3><div style="min-height:calc(var(--u)*20);display:flex;align-items:center;justify-content:center;border:var(--u) dashed var(--line2);color:var(--dim)">팔 물건을 여기로</div>`;
    {
      const T = SX.trade, on = T ? T.WHO.map(w => [ w, T.level(s, w) ]).filter(([, l]) => l.sell) : [];
      const p = document.createElement("p");
      p.className = "small loySell";
      if (on.length) {
        p.append("단골 덤 — ");
        on.forEach(([w, l], k) => {
          if (k) p.append(" · ");
          p.append(T.NAME[w], " +" + Math.round(l.sell * 100) + "%", "(" + T.SELL_WORD[w] + ")");
        });
      }
      z.appendChild(p);
    }
    {
      const jb = document.createElement("button");
      jb.id = "sellJunk";
      jb.className = "junkSell";
      jb.textContent = "잡동사니 전부 판매";
      jb.title = "보관함 · 가방 · 리그의 잡동사니를 한 번에 팝니다(임무 · 만들기에 쓰는 것 · 찜한 것은 빼고)";
      jb.onclick = () => sellJunkAsk();
      z.appendChild(jb);
    }
    const st = document.createElement("div");
    st.className = "box";
    st.innerHTML = `<h3><span>보관함</span><span class="small">${I.cells(s.stash)}/${s.stash.cols * s.stash.rows}칸</span></h3>`;
    const wrap = scrollBox("sellStash", "62vh");
    wrap.appendChild(gridEl(s.stash, "stash"));
    st.appendChild(wrap);
    const sr = document.createElement("div");
    sr.className = "row sellRow";
    st.classList.add("sellStash");
    const eq = equipColumn(SX.game.kit, false, 1.1);
    eq.classList.add("sellEquip");
    eq.dataset.sc = "sellEquip";
    sr.append(st, eq);
    col.append(z, sr);
    Promise.resolve().then(() => {
      const B = $("shopBody");
      if (!B || !wrap.isConnected) return;
      const c = cellPx(), top = wrap.getBoundingClientRect().top, bot = B.getBoundingClientRect().bottom;
      let uh = 0;
      const ub = col.querySelector(".soldBox");
      if (ub) {
        ub.style.maxHeight = Math.floor(Math.max(c * 1.6, Math.min(c * 4, bot - top - c * 3.6))) + "px";
        const q = ub.getBoundingClientRect();
        uh = q.height + Math.max(0, q.top - sr.getBoundingClientRect().bottom);
        const v = scrollMem.get("soldBox");
        if (v) ub.scrollTop = v;
      }
      const room = bot - top - c * .6 - uh;
      wrap.dataset.mh = Math.max(c * 3, Math.floor(room)) + "px";
      fitScroll(wrap);
    });
    if (sold.length) {
      const u = document.createElement("div");
      u.className = "box soldBox";
      u.style.flex = "none";
      u.style.overflowY = "auto";
      u.dataset.sc = "soldBox";
      u.innerHTML = `<h3><span>방금 판 것</span><span class="small">되돌리면 받은 돈을 도로 냅니다 · 시장을 나가도 남습니다</span></h3>`;
      sold.slice(0, 6).forEach((e, k) => {
        const r = document.createElement("div");
        r.className = "li";
        const cv = iconCanvas(e.it);
        cv.style.width = "calc(var(--u)*16)";
        cv.style.height = "calc(var(--u)*16)";
        cv.style.flex = "none";
        cv.style.objectFit = "contain";
        r.appendChild(cv);
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = e.it.name;
        r.appendChild(nm);
        const pr = document.createElement("span");
        pr.className = "pr";
        pr.textContent = won(e.v);
        r.appendChild(pr);
        const b = document.createElement("button");
        b.textContent = "되돌리기";
        b.onclick = () => unsell(k);
        r.appendChild(b);
        u.appendChild(r);
      });
      col.appendChild(u);
    }
    return col;
  }
  const sold = [];
  U.soldLog = sold;
  function junkList() {
    const s = SX.game.save, kit = SX.game.kit, T = SX.trade, NM = SX.needmark, need = NM && NM.map ? NM.map() : new Map, out = [];
    const grids = [ s.stash ].concat([ "bag", "rig" ].map(sl => kit && kit[sl] && kit[sl].grid).filter(g => g && Array.isArray(g.list)));
    for (const g of grids) for (const e of g.list) {
      const it = e && e.it;
      if (!it) continue;
      const d = I.def(it.name) || {};
      if (U.fmCatOf({
        name: it.name,
        kind: it.kind
      }) !== "junk") continue;
      if (it.quest || it.story || d.story || d.trash || need.has(it.name) || T && T.wished(s, it.name)) continue;
      if (it.grid && it.grid.list && it.grid.list.length) continue;
      const v = I.brokerValue(it);
      if (!(v > 0)) continue;
      out.push({
        it,
        g,
        v
      });
    }
    return out;
  }
  U.junkList = junkList;
  function sellJunkAsk() {
    if (held()) return;
    const L = junkList();
    if (!L.length) {
      SX.audio.play("denied");
      SX.log("팔 잡동사니가 없습니다 — 임무 · 만들기에 쓰는 것 · 찜한 것은 빼고 셉니다");
      return;
    }
    const by = new Map;
    let total = 0;
    for (const e of L) {
      const r = by.get(e.it.name) || {
        n: 0,
        v: 0
      };
      r.n += I.qty(e.it);
      r.v += e.v;
      by.set(e.it.name, r);
      total += e.v;
    }
    const rows = [ ...by.entries() ].sort((a, b) => b[1].v - a[1].v), SHOW = 14;
    const lines = rows.slice(0, SHOW).map(([n, r]) => `<div class="li"><span class="nm">${esc(n)}${r.n > 1 ? " ×" + r.n : ""}</span><span class="pr">${won(r.v)}</span></div>`).join("") + (rows.length > SHOW ? `<div class="li"><span class="nm">${esc("그 밖 " + (rows.length - SHOW) + "가지")}</span><span class="pr">${won(rows.slice(SHOW).reduce((t, q) => t + q[1].v, 0))}</span></div>` : "");
    U.ask("잡동사니 전부 판매", `${esc("보관함 · 가방 · 리그의 잡동사니 " + L.length + "개를 브로커에 팝니다. 임무 · 만들기에 쓰는 것 · 찜한 것은 뺐습니다.")}</p><div class="junkList">${lines}</div><p class="small">${esc("판 것은 아래 「방금 판 것」에서 하나씩 되돌릴 수 있습니다(가장 최근 12개까지).")}`, 0, () => {
      let n = 0, got = 0;
      for (const e of junkList()) {
        const m0 = SX.game.save.money;
        sellItem(e.it, {
          kind: "grid",
          grid: e.g,
          tag: "other"
        }, true, true);
        const d = SX.game.save.money - m0;
        if (d > 0) {
          n++;
          got += d;
        }
      }
      if (n) {
        SX.audio.play("buy");
        SX.log("잡동사니 " + n + "개를 팔았습니다 +" + won(got) + " — 브로커 창에서 되돌릴 수 있습니다", "good");
      }
      U.afterChange();
      SX.game.persist();
    }, null, {
      q: "합계 " + won(total) + " 에 모두 파시겠습니까?",
      yes: "전부 판매",
      no: "그만두기"
    });
  }
  function sellItem(it, src, sure, quiet) {
    const kit = SX.game.kit;
    if (held()) return;
    if (!srcOk(it, src)) {
      stale();
      return;
    }
    if (it.grid && it.grid.list.length) {
      SX.log("안에 든 걸 먼저 빼 주십시오");
      SX.audio.play("denied");
      return;
    }
    if (it.story || (I.def(it.name) || {}).story) {
      SX.log("임무 물건은 팔 수 없습니다 — " + it.name, "warn");
      SX.audio.play("denied");
      return;
    }
    if (it.kind === "mag" && !((it.ammo | 0) > 0)) {
      SX.log("빈 탄창은 팔 수 없습니다 — 탄을 채운 뒤 파시면 됩니다", "warn");
      SX.audio.play("denied");
      return;
    }
    if ((I.def(it.name) || {}).trash) {
      SX.log("쓰레기는 팔 수 없습니다 — 셸터 쓰레기 더미에서 [" + SX.label("interact") + "] 로 버리시면 됩니다", "warn");
      SX.audio.play("denied");
      return;
    }
    if (!sure && SX.needmark) {
      const q = SX.needmark.sellAsk(it);
      if (q) {
        U.ask(q.title, q.desc, 0, () => {
          sellItem(it, src, true);
          U.afterChange();
        }, null, q.labels);
        return;
      }
    }
    const v = I.brokerValue(it) + (it.kind === "gun" ? 0 : 0);
    if (!takeFromSrc(it, src)) return;
    SX.game.save.money += v;
    if (SX.trade) loyAdd(SX.trade.sellWho(it), v, {
      n: it.name,
      p: v,
      k: "s"
    });
    sold.unshift({
      it,
      v
    });
    if (sold.length > 12) sold.length = 12;
    cleanQuick();
    if (!quiet) {
      SX.audio.play("buy");
      SX.log("팔았습니다: " + it.name + " +" + won(v) + " — 브로커 창에서 되돌릴 수 있습니다");
    }
    if (A.player && !kit[A.player.slot]) A.player.slot = kit.w1 ? "w1" : kit.w2 ? "w2" : "melee";
  }
  function unsell(k) {
    const e = sold[k], s = SX.game.save;
    if (!e) return;
    if (s.money < e.v) {
      SX.audio.play("denied");
      SX.log("받은 돈을 이미 써서 되돌릴 수 없습니다");
      return;
    }
    if (!I.putJoin(s.stash, e.it)) {
      SX.audio.play("denied");
      SX.log("보관함에 자리가 없습니다");
      return;
    }
    s.money -= e.v;
    sold.splice(k, 1);
    if (SX.trade) loySub(SX.trade.sellWho(e.it), e.v);
    s.unsold = (s.unsold || []).concat([ {
      n: e.it.name,
      v: e.v,
      at: Date.now()
    } ]).slice(-60);
    SX.audio.play("pickup");
    SX.log("되돌렸습니다: " + e.it.name + " -" + won(e.v));
    SX.game.persist();
    U.refresh();
    U.hudDirty();
  }
  let pick = null;
  let pickMode = "tut";
  U.openRaidMap = function() {
    SX.audio.play("beepHi", {
      vol: .8
    });
    pick = pick || D.buildings[0];
    U.open("map", `<div class="win big sxRig" id="mapWin">${U.rigTop ? U.rigTop("생존자 통신망", "SX-09 야전 태블릿") : ""}<div class="tabScr sxScr">${header("도심 지도 — 출격 · 시장 · 셸터", U.tabClock ? U.tabClock() : "")}<div class="body row" id="mapBody" style="flex:1"></div></div></div>`);
    renderMap();
    fitMap();
    if (U.mapTab) U.mapTab();
    if (SX.free && SX.free.refresh) SX.free.refresh().then(r => {
      if (r && U.panelKind === "map") renderInfo();
    });
  };
  setInterval(() => {
    const g = U.panelKind === "map" && $("goFree");
    if (!g || !SX.free) return;
    const t = freeLabel();
    if (g.textContent !== t) {
      g.textContent = t;
      g.disabled = SX.free.left() > 0 || !!(SX.onboard && SX.onboard.why(pick, null));
    }
  }, 1e3);
  setInterval(() => {
    if (U.panelKind === "map") todTick();
  }, 1e3);
  const SPOTS = {
    site: [ .9, .46 ],
    tunnel: [ .46, .74 ],
    bridge: [ .66, .9 ],
    train: [ .1, .12 ],
    heli: [ .6, .08 ],
    villa: [ .22, .34 ],
    office: [ .46, .22 ],
    mall: [ .7, .4 ],
    hos: [ .82, .7 ],
    home: [ .14, .66 ],
    market: [ .56, .62 ],
    school: [ .32, .86 ],
    metro: [ .36, .52 ],
    base: [ .9, .18 ]
  };
  const PLACES = [ {
    id: "home",
    place: true,
    name: "셸터",
    tag: "돌아갈 곳"
  }, {
    id: "market",
    place: true,
    name: "장터",
    tag: "생존자들의 거리"
  } ];
  const mapLocked = b => !SX.game.god && !b.place && !b.train && !b.final && !SX.prog.stCanGo(SX.game.save.story, b.id);
  const heliOpen = () => !!SX.game.god || !!(SX.prog.egReady && SX.prog.egReady(SX.game.save.eg) && SX.prog.stMainDone(SX.game.save.story));
  U.mapLocked = mapLocked;
  function renderMap() {
    const body = $("mapBody");
    if (!body) return;
    body.innerHTML = "";
    const mapBox = document.createElement("div");
    mapBox.className = "cityMap box";
    mapBox.style.flex = "1.4";
    const cv = drawCityMap();
    mapBox.appendChild(cv);
    for (const b of PLACES.concat(D.buildings.filter(x => !x.final || heliOpen()))) {
      const locked = mapLocked(b);
      const [mx, my] = SPOTS[b.id] || [ .5, .5 ];
      const pin = document.createElement("div");
      pin.className = "pin" + (b.place ? " " + b.id : "") + (b.place && SX.game.state === "hub" && SX.hub.scene === b.id ? " here" : "") + (locked ? " lock" : "");
      pin._b = b;
      pin.style.left = mx * 100 + "%";
      pin.style.top = my * 100 + "%";
      const wn = b.id === "market" && Array.isArray(SX.game.save.wishNew) && SX.game.save.wishNew.length;
      const fz = !b.place && fireNow(b);
      const fl = !b.place && !fz && floodNow(b);
      const sp = !b.place && !fz && !fl && spNow(b);
      pin.innerHTML = `<b>${locked ? "🔒 " : ""}${fz ? "🔥 " : fl ? "🌊 " : sp === "nos" ? "🔫 " : sp === "noz" ? "🧟 " : ""}${SX.week && SX.week.pinOn ? SX.week.pinOn(b) : ""}${esc(b.name)} · ${esc(b.tag)}${wn ? ` <span class="wishStar">★</span>` : ""}</b><i></i>`;
      pin.onclick = () => {
        pick = b;
        SX.audio.play("click");
        renderInfo();
      };
      pin.ondblclick = () => {
        pick = b;
        if (b.place) {
          if (!(SX.game.state === "hub" && SX.hub.scene === b.id)) SX.hub.travel(b.id);
        } else {
          renderInfo();
          const g0 = $("goRaid");
          if (g0) g0.click();
        }
      };
      pin.title = locked ? "아직 갈 수 없습니다" : fz ? "화재 판 · 더블클릭: 바로 가기" : fl ? "침수 판 · 더블클릭: 바로 가기" : sp === "nos" ? "약탈자 없는 판 · 더블클릭: 바로 가기" : sp === "noz" ? "좀비 없는 판 · 더블클릭: 바로 가기" : wn ? "찜한 물건이 좌판에 들어왔습니다 · 더블클릭: 바로 가기" : "더블클릭: 바로 가기";
      mapBox.appendChild(pin);
    }
    const info = document.createElement("div");
    info.className = "col box";
    info.id = "mapInfo";
    info.style.flex = "1";
    info.style.alignSelf = "stretch";
    body.append(mapBox, info);
    renderInfo();
    requestAnimationFrame(clampPins);
  }
  function clampPins() {
    const box = document.querySelector("#mapBody .cityMap");
    if (!box) return;
    const br = box.getBoundingClientRect(), pad = 2;
    for (const b of box.querySelectorAll(".pin b")) {
      b.style.left = "";
      const r = b.getBoundingClientRect();
      let dx = 0;
      if (r.left < br.left + pad) dx = br.left + pad - r.left; else if (r.right > br.right - pad) dx = br.right - pad - r.right;
      if (dx) {
        b.style.position = "relative";
        b.style.left = Math.round(dx) + "px";
      }
    }
  }
  function fitMap() {
    const win = $("mapWin");
    if (!win) return;
    const keep = pick;
    win.style.minHeight = "";
    let h = 0, t = 0;
    padTop = 0;
    for (const fm of [ "normal", "fire", "flood", "nos", "noz" ]) {
      fitFire = fm;
      for (const b of D.buildings.filter(x => !x.final && !x.train)) {
        pick = b;
        renderInfo();
        h = Math.max(h, win.offsetHeight);
        const r = $("todRow"), inf = $("mapInfo");
        if (r && inf && !b.train) t = Math.max(t, r.getBoundingClientRect().top - inf.getBoundingClientRect().top);
      }
    }
    fitFire = false;
    padTop = t;
    pick = keep;
    renderInfo();
    win.style.minHeight = Math.min(h, Math.floor(innerHeight * .95)) + "px";
    clampPins();
  }
  addEventListener("resize", () => {
    if (U.panelKind === "map") {
      fitMap();
      clampPins();
    }
  });
  function renderInfo() {
    drawInfo();
    {
      const inf = $("mapInfo");
      if (inf) {
        if (SX.trDom) SX.trDom(inf);
        inf.classList.remove("tight");
        if (inf.scrollHeight > inf.clientHeight + 1) inf.classList.add("tight");
        if (SX.week && SX.week.fit) SX.week.fit(inf);
        mapLn(inf);
        mapMore(inf);
        foeFit(inf);
        mapPad(inf);
      }
    }
    const win = $("mapWin");
    if (win && win.style.minHeight && win.offsetHeight > parseFloat(win.style.minHeight)) win.style.minHeight = win.offsetHeight + "px";
  }
  const MORE_B = `<button type="button" class="mini mMore">더보기 ▾</button>`;
  const mapTxt = b => `<p class="mDesc">${esc(b.desc)}</p><div class="mStory"><p class="small story">${esc(b.story || "")}</p>${MORE_B}</div>`;
  function mapMore(inf) {
    const bt = inf.querySelector(":scope > .mStory > .mMore");
    if (!bt) return;
    const d = inf.querySelector(":scope > .mDesc"), st = bt.previousElementSibling, cut = e => !!e && e.scrollHeight > e.clientHeight + 1;
    bt.hidden = false;
    if (!cut(d) && !cut(st)) {
      bt.hidden = true;
      return;
    }
    bt.onclick = () => {
      SX.audio.play("click");
      const old = inf.querySelector(":scope > .mFull");
      if (old) old.remove();
      const top = d || st, f = document.createElement("div");
      f.className = "mFull";
      const y = Math.max(0, top.offsetTop - (parseFloat(getComputedStyle(top).marginTop) || 0));
      f.style.top = y + "px";
      f.style.maxHeight = inf.clientHeight - y + "px";
      const tx = f.appendChild(document.createElement("div"));
      tx.className = "mFullTx";
      for (const e of [ d, st ]) if (e && e.textContent.trim()) {
        const c = tx.appendChild(document.createElement("p"));
        c.className = e.className;
        c.innerHTML = e.innerHTML;
      }
      const x = f.appendChild(document.createElement("button"));
      x.type = "button";
      x.className = "mini mLess";
      x.textContent = "접기 ▴";
      x.onclick = () => {
        SX.audio.play("click");
        f.remove();
      };
      inf.appendChild(f);
      if (SX.trDom) SX.trDom(f);
    };
  }
  let padTop = 0;
  function mapPad(inf) {
    const r = $("todRow");
    if (!padTop || !r || !pick || pick.train || r.parentNode !== inf) return;
    const dy = padTop - (r.getBoundingClientRect().top - inf.getBoundingClientRect().top);
    if (dy < .01) return;
    r.style.marginTop = (parseFloat(getComputedStyle(r).marginTop) || 0) + dy + "px";
    if (inf.scrollHeight > inf.clientHeight + 1) r.style.marginTop = "";
  }
  function mapLn(inf) {
    for (const p of inf.querySelectorAll(":scope > p.mLn")) if (p.scrollWidth > p.clientWidth + 1) p.title = p.textContent; else p.removeAttribute("title");
  }
  function drawInfo() {
    const info = $("mapInfo");
    if (!info) return;
    for (const pin of $("mapBody").querySelectorAll(".pin")) pin.classList.toggle("sel", pin._b === pick);
    const s = SX.game.save;
    const b = pick;
    if (b.place) {
      const here = SX.game.state === "hub" && SX.hub.scene === b.id;
      info.innerHTML = b.id === "home" ? `<h3><span>셸터</span><span>${esc(SX.home.tier().name)}${esc(SX.label("deco"))}] 로 꾸밉니다. 더 큰 집은 장터 부동산에서.</p>${MORE_B}</div>` : `${MORE_B}</div>`;
      const go = document.createElement("button");
      go.className = "big";
      go.textContent = here ? "지금 여기 있습니다" : b.id === "home" ? "셸터로 가기 ▶" : "시장으로 가기 ▶";
      go.disabled = here;
      go.onclick = () => {
        SX.audio.play("click");
        SX.hub.travel(b.id);
      };
      info.appendChild(go);
      if (b.id === "home" && SX.visit) SX.visit.mapBtn(info, go);
      return;
    }
    const star = n => "■".repeat(n) + "□".repeat(4 - n);
    if (mapLocked(b)) {
      const P0 = SX.prog, um = P0.stUnlockBy(b.id), near = um && (P0.stActive(s.story, um.id) || P0.stOpen(s.story, um));
      info.innerHTML = `<h3><span>🔒 ${esc(b.name)}</span><span>${esc(b.tag)}</span></h3>\n        ${mapTxt(b)}\n        <p class="warn">아직 갈 수 없습니다 — 들어가는 길을 모릅니다.</p>\n        <p class="small">${near ? esc("장터의 " + P0.ST_WHO[um.who] + "에게서 임무 「" + um.name + "」을(를) 마치면 열립니다.") : "장터 사람들의 이야기를 따라가면 열립니다 — 단말기 [이야기] 에서 지금 할 일을 볼 수 있습니다."}</p>\n        <div class="small">난이도 ${star(b.diff)}</div>`;
      return;
    }
    info.innerHTML = `<h3><span>${esc(b.name)}</span><span>${fireNow(b) ? "🔥 화재 · " : floodNow(b) ? "🌊 침수 · " : spNow(b) === "nos" ? "🔫 약탈자 없음 · " : spNow(b) === "noz" ? "🧟 좀비 없음 · " : ""}${esc(b.tag)}</span></h3>\n      ${mapTxt(b)}\n      <div class="small">${b.outdoor === "site" ? "야외 · 공사장 70m × 60m · 난이도 " + star(b.diff) + " · 적 ×" + b.enemy + " · 전리품 ×" + b.loot + " · 가스 ×" + b.gas + " · 계단·옥상 없음 · 사방이 트임" : b.outdoor === "tunnel" ? "지하 · 터널 160m · 난이도 " + star(b.diff) + " · 적 ×" + b.enemy + " · 전리품 ×" + b.loot + " · 가스 ×" + b.gas + " · 계단·옥상 없음 · 늘 어둡습니다" : b.outdoor ? "야외 · 다리 170m · 난이도 " + star(b.diff) + " · 적 ×" + b.enemy + " · 전리품 ×" + b.loot + " · 가스 ×" + b.gas + " · 계단·옥상 없음" : b.train ? "층 " + b.floors + " · 적 ×" + b.enemy + " · 가스 없음 · 봉쇄 없음 · 의식을 잃어도 장비 그대로 · <b>의뢰·과제·기록에 안 들어갑니다</b>" : "층 " + b.floors + " · 난이도 " + star(b.diff) + " · 적 ×" + b.enemy + " · 전리품 ×" + b.loot + " · 가스 ×" + b.gas}</div>\n      ${foeLine(b)}${fireLine(b)}${floodLine(b)}${spLine(b)}${SX.week && SX.week.line ? SX.week.line(b, fitFire) : ""}\n      ${s.intel && s.intel.building === b.id ? `<p><b class="good">정보: ${s.intel.hotFloor + 1}층이 알짜</b></p>` : ""}\n      ${b.train ? `<div class="row"><button id="modeTut" class="${pickMode === "tut" ? "big" : ""}">튜토리얼</button><button id="modePrac" class="${pickMode === "prac" ? "big" : ""}">연습</button></div>\n      <p class="small">${pickMode === "tut" ? "튜토리얼 — 걷기부터 탈출까지 기본을 하나씩 직접 해 봅니다(22단계 · 10분쯤). 빌린 장비로 하고, 끝나면 내 장비 그대로 돌아옵니다. 몇 번이든 다시 할 수 있습니다." : "연습 — 느린 감염체 몇이 있는 건물을 내 장비로 마음대로 돌아다닙니다. 의식을 잃어도 장비는 그대로입니다."}</p>` : ""}\n      ${b.train && pickMode === "tut" ? "" : todHtml()}\n      <p class="mLn">보험: ${s.insured ? "<b class='good'>들었습니다</b>" : "<b class='warn'>안 들었습니다</b> (시장 보험 창구)"} · 용병: ${s.merc ? esc(D.mercs.find(m => m.id === s.merc).name) : "없음"}</p>\n      <p class="mLn">감염 ${s.infect.toFixed(1)}% · 가진 것 ${won(I.kitValue(SX.game.kit))} · 무기 ${SX.game.kit.w1 ? esc(SX.game.kit.w1.name) : SX.game.kit.w2 ? esc(SX.game.kit.w2.name) : "<b class='bad'>총 없음</b>"}</p>\n      <div class="lkBox" id="lkBox"></div><div class="row goRow"><button id="goRaid" class="big">${b.train && pickMode === "tut" ? "튜토리얼 시작 ▶" : "출격 ▶"}</button>${freeBtn(b)}</div>`;
    if ($("mapCoop")) $("mapCoop").onclick = () => U.openCoop();
    if (SX.kitck) SX.kitck.fill(info, b, pickMode);
    if ($("modeTut")) $("modeTut").onclick = () => {
      pickMode = "tut";
      renderInfo();
    };
    if ($("goFree")) {
      $("goFree").onclick = () => {
        SX.audio.play("click");
        departFree(pick, todNow());
      };
      $("goFree").dataset.tip = "받은 장비로 나갑니다 — 내 장비는 셸터에 그대로 있습니다";
    }
    if ($("modePrac")) $("modePrac").onclick = () => {
      pickMode = "prac";
      renderInfo();
    };
    if (SX.onboard) SX.onboard.mapInfo(info, b, pickMode);
    $("goRaid").onclick = () => {
      SX.audio.play("click");
      if (b.train && pickMode === "tut") {
        SX.game.startTutorial();
        return;
      }
      const lk = s.look, cu = lk && lk.custom ? ART.decodeCustom(lk.custom) : null;
      if (cu && !ART.customOk(cu)) {
        const st = ART.customStats(cu);
        U.ask("⚠ 캐릭터 도트가 너무 적습니다", "직접 찍은 캐릭터가 너무 비어 있습니다(가장 적은 면 " + st.min + "점 · 필요 " + ART.CUSTOM_MIN + "점 이상).<br><b>다른 유저 시점에서는 기본 캐릭터 윤곽선이 보입니다.</b><br>내 화면에는 찍은 그대로 보입니다.", 0, () => depart(pick, todNow()), () => {}, {
          q: "그래도 출격하시겠습니까?",
          yes: "그대로 출격",
          no: "취소"
        });
        return;
      }
      depart(pick, todNow());
    };
  }
  function todSpan() {
    const P0 = SX.prog;
    return P0 && P0.todSpan ? P0.todSpan() : 0;
  }
  function todRule() {
    const n = Math.round((todSpan() || 9e5) / 6e4);
    return "낮 " + n + "분 · 밤 " + n + "분씩 번갈아";
  }
  function todNow() {
    const P0 = SX.prog;
    return P0 && P0.todAt ? P0.todAt(SX.net.now(), todSpan()) : "day";
  }
  function todState() {
    const P0 = SX.prog, ms = SX.net.now(), t = todNow(), min = Math.max(1, Math.ceil((P0 && P0.todLeft ? P0.todLeft(ms, todSpan()) : 0) / 6e4));
    return [ t, t === "night" ? "지금 밤" : "지금 낮", t === "night" ? "낮까지 " + min + "분" : "밤까지 " + min + "분" ];
  }
  function todHtml() {
    const [t, a, c] = todState();
    return `<div class="row todRow" id="todRow" data-tod="${t}"><span class="todNow"><b id="todNow" data-k="${a}">${a}</b> — <span id="todLeft" data-k="${c}">${c}</span></span></div>\n      <p class="small todDesc" id="todDesc" data-tod="${t}"><span class="todD">낮 — 밝지만 멀리서 눈에 띕니다</span><span class="todN">밤 — 손전등 없이는 아무것도 안 보입니다. 적도 늦게 알아챕니다</span></p>`;
  }
  function todTick() {
    const row = $("todRow");
    if (!row) return;
    const [t, a, c] = todState(), d = $("todDesc"), na = $("todNow"), nc = $("todLeft");
    if (row.dataset.tod !== t) row.dataset.tod = t;
    if (d && d.dataset.tod !== t) d.dataset.tod = t;
    if (na && na.dataset.k !== a) {
      na.dataset.k = a;
      na.textContent = a;
    }
    if (nc && nc.dataset.k !== c) {
      nc.dataset.k = c;
      nc.textContent = c;
    }
  }
  U.todNow = todNow;
  U.todSpan = todSpan;
  let fitFire = false;
  function fireNow(b) {
    const P0 = SX.prog;
    return !!(P0 && P0.raidMode && !b.train && !b.final && !b.outdoor && P0.raidMode(b.id, SX.net.now()) === "fire");
  }
  function fireLine(b) {
    const P0 = SX.prog;
    if (!P0 || !P0.raidMode || !P0.MODE_B[b.id]) return "";
    const now = SX.net.now(), on = fireNow(b);
    if (fitFire ? fitFire !== "fire" : !on) return "";
    const min = Math.max(1, Math.ceil(P0.modeLeft(b.id, now) / 6e4));
    return `<p class="small fireNote"><b class="warn">🔥 화재 판 — 옥상에서 들어가 아래로 · 지하 주차장으로 나갑니다 · 연기가 위에서부터 내려옵니다 · 앉으면 연기를 덜 마십니다</b><br>이 모양은 ${min}분 뒤 바뀝니다${SX.week && SX.week.tail ? SX.week.tail(b, fitFire) : ""}</p>`;
  }
  function floodable(b) {
    const P0 = SX.prog;
    return !!(P0 && P0.raidMode && P0.MODE_B[b.id] && !b.train && !b.final && !b.outdoor && (b.floors | 0) >= 2 && !(SX.soloMap && SX.soloMap(b)));
  }
  function floodNow(b) {
    return floodable(b) && SX.prog.raidMode(b.id, SX.net.now()) === "flood";
  }
  function floodLine(b) {
    if (!floodable(b)) return "";
    const P0 = SX.prog, now = SX.net.now(), on = floodNow(b);
    if (fitFire ? fitFire !== "flood" : !on) return "";
    const min = Math.max(1, Math.ceil(P0.modeLeft(b.id, now) / 6e4));
    return `<p class="small fireNote"><b class="warn">🌊 침수 판 — 물이 아래부터 차오릅니다 · 깊을수록 느려지고 물에 잠기면 숨이 줄어듭니다 · 무릎까지 차면 1층 문이 안 열립니다</b><br>이 모양은 ${min}분 뒤 바뀝니다${SX.week && SX.week.tail ? SX.week.tail(b, fitFire) : ""}</p>`;
  }
  function spNow(b) {
    const P0 = SX.prog;
    if (!P0 || !P0.raidMode || !P0.SP_B || P0.SP_B.indexOf(b.id) < 0 || b.train || b.final || b.place) return null;
    const m = P0.raidMode(b.id, SX.net.now());
    return m === "nos" || m === "noz" ? m : null;
  }
  function spLine(b) {
    const P0 = SX.prog;
    if (!P0 || !P0.raidMode || !P0.SP_B || P0.SP_B.indexOf(b.id) < 0 || b.train || b.final || b.place) return "";
    const now = SX.net.now(), on = spNow(b);
    if (fitFire ? fitFire !== "nos" && fitFire !== "noz" : !on) return "";
    const k = fitFire || on, min = Math.max(1, Math.ceil(P0.modeLeft(b.id, now) / 6e4));
    const t = k === "nos" ? "🔫 약탈자 없는 판 — 이번 판엔 약탈자 · 저격수 · 두목 무리가 없습니다 · 감염체만 나옵니다" : "🧟 좀비 없는 판 — 이번 판엔 감염체 · 들개가 없습니다 · 약탈자만 나옵니다";
    return `<p class="small fireNote"><b class="warn">${t}</b><br>이 모양은 ${min}분 뒤 바뀝니다${SX.week && SX.week.tail ? SX.week.tail(b, fitFire) : ""}</p>`;
  }
  const FOE_SHORT = {
    zombie: "감염체",
    scav: "약탈자",
    dog: "들개",
    brute: "덩치",
    hazmat: "방호복",
    sniper: "저격수",
    wksol: "군 잔당",
    boss: "두목 무리"
  };
  const WK_SHORT = {
    lock: "봉쇄",
    horde: "대량 감염",
    trove: "보물"
  };
  const foeAt = (q, n) => q.at ? q.at === "-" ? "" : q.at : n < 2 || q.fl.length >= n ? "" : q.fl.length === 1 && q.fl[0] === 0 ? "1층" : q.fl[0] + 1 + "층~";
  function foeLine(b) {
    const A = SX.actors, F = SX.feats, P0 = SX.prog;
    if (!A || !A.foesOf || b.train || b.place) return "";
    const w = SX.week && SX.week.cur ? SX.week.cur(SX.net.now()) : null;
    const wk = w && w.b === b.id && P0 && P0.WEEK_B && P0.WEEK_B.indexOf(b.id) >= 0 ? w.st : null, fire = fireNow(b), s = SX.game.save, n = b.floors | 0, sp = spNow(b);
    const L = A.foesOf(b, {
      fire,
      wk,
      sp
    });
    const chips = L.map(q => {
      const nm = q.name || FOE_SHORT[q.k] || q.k, long = q.name || F && F.FOE_NAME && F.FOE_NAME[q.k] || nm, at = foeAt(q, n), seen = !F || !F.foeSeen || F.foeSeen(s, q.k);
      const tip = [ long + (at ? " " + at : "") ].concat(q.half ? [ "판의 절반쯤 나옵니다" ] : [], seen ? [] : [ "아직 쓰러뜨린 적 없음" ]).join(" · ");
      return `<span class="fc${seen ? "" : " un"}${q.k === "boss" || q.half ? " bo" : ""}" data-k="${esc(q.k)}" title="${esc(tip)}">${esc(nm)}${at ? `<i>${esc(at)}</i>` : ""}${q.half ? "<i>50%</i>" : ""}</span>`;
    });
    const mode = (fire ? [ [ "🔥 화재", "두목 무리가 없습니다" ] ] : floodNow(b) ? [ [ "🌊 침수", "" ] ] : sp === "nos" ? [ [ "🔫 약탈자 없음", "약탈자 · 저격수 · 두목 무리가 없습니다" ] ] : sp === "noz" ? [ [ "🧟 좀비 없음", "감염체 · 들개가 없습니다" ] ] : []).concat(wk && WK_SHORT[wk] ? [ [ "📅 " + WK_SHORT[wk], wk === "lock" ? "남은 군 잔당이 있습니다" : wk === "horde" ? "감염체가 많습니다" : "" ] ] : []);
    const mc = mode.map(([t, tip]) => `<span class="fc md"${tip ? ` title="${esc(tip)}"` : ""}>${esc(t)}</span>`);
    return `<div class="mFoe"><span class="mFoeH">나오는 적</span>${mc.join("")}${chips.join("")}</div>`;
  }
  function foeFit(inf) {
    const row = inf.querySelector(":scope > .mFoe");
    if (!row) return;
    const old = row.querySelector(":scope > .fc.more");
    if (old) old.remove();
    {
      const op = inf.querySelector(":scope > .mFoePop");
      if (op && op._close) op._close(); else if (op) op.remove();
    }
    const all = [ ...row.querySelectorAll(":scope > .fc") ], hd = row.querySelector(":scope > .mFoeH"), fits = () => row.scrollWidth <= row.clientWidth + 1;
    const tags = [ ...row.querySelectorAll(":scope > .fc > i") ];
    for (const c of all) c.hidden = false;
    for (const t of tags) t.hidden = false;
    if (hd) hd.hidden = false;
    const ct = c => [ ...c.childNodes ].map(x => x.textContent.trim()).filter(Boolean).join(" ");
    row.title = (hd ? hd.textContent.trim() + ": " : "") + all.map(ct).join(" · ");
    if (fits()) return;
    if (hd) {
      hd.hidden = true;
      if (fits()) return;
    }
    for (const t of tags.slice().reverse()) if (!/%/.test(t.textContent)) {
      t.hidden = true;
      if (fits()) return;
    }
    const more = document.createElement("span");
    more.className = "fc more";
    row.appendChild(more);
    const reg = all.filter(c => !c.classList.contains("md") && !c.classList.contains("bo")), COMMON = [ "zombie", "scav", "dog" ];
    const cand = COMMON.map(k => reg.find(c => c.dataset.k === k)).filter(Boolean).concat(reg.filter(c => COMMON.indexOf(c.dataset.k) < 0).reverse(), all.filter(c => c.classList.contains("bo")).reverse()), hid = [];
    for (const c of cand) {
      c.hidden = true;
      hid.push(c);
      more.textContent = "+" + hid.length;
      if (fits()) break;
    }
    more.title = hid.sort((a, b) => all.indexOf(a) - all.indexOf(b)).map(ct).join(" · ");
    more.onclick = ev => {
      ev.stopPropagation();
      SX.audio.play("click");
      const op = inf.querySelector(":scope > .mFoePop");
      if (op) {
        op._close();
        return;
      }
      const p = document.createElement("div");
      p.className = "mFoePop";
      for (const c of hid) {
        const k = c.cloneNode(true);
        k.hidden = false;
        for (const t of k.querySelectorAll("i")) t.hidden = false;
        p.appendChild(k);
      }
      p.style.top = row.offsetTop + row.offsetHeight + 2 + "px";
      const out = e => {
        if (!p.contains(e.target) && e.target !== more) p._close();
      };
      p._close = () => {
        p.remove();
        document.removeEventListener("pointerdown", out, true);
      };
      p.onclick = e => {
        e.stopPropagation();
        p._close();
      };
      inf.appendChild(p);
      document.addEventListener("pointerdown", out, true);
    };
  }
  function depart(b, tod, sure) {
    if (mapLocked(b)) {
      SX.audio.play("denied");
      SX.log("🔒 " + b.name + " — 아직 갈 수 없습니다(이야기를 따라가면 열립니다)", "warn");
      return;
    }
    {
      const w = SX.onboard && SX.onboard.why(b, b.train ? "prac" : null);
      if (w) {
        SX.audio.play("denied");
        SX.log(w, "warn");
        return;
      }
    }
    const C = SX.coop;
    if (SX.onboard && SX.onboard.bandGate && !(C && C.canQueue() && C.on() && !C.isHost()) && SX.onboard.bandGate(b, () => depart(b, todNow()))) return;
    if (!sure && SX.kitck && !(C && C.canQueue() && C.on() && !C.isHost()) && SX.kitck.gate(b, () => depart(b, typeof todNow === "function" ? todNow() : tod, true))) return;
    if (C && C.canQueue()) {
      if (C.on() && !C.isHost()) {
        SX.audio.play("denied");
        SX.log("🌐 출격은 파티장이 누릅니다 — 혼자 가려면 파티 생성에서 파티를 나가 주십시오", "warn");
        return;
      }
      U.closePanel();
      C.queue(b, tod);
      return;
    }
    SX.game.startRaid(b, tod);
  }
  function freeLabel() {
    const left = SX.free.left();
    return left > 0 ? "🎒 마지막 희망 판 — " + SX.free.fmt(left) + " 뒤" : "🎒 마지막 희망 ▶";
  }
  function freeNote(b) {
    const F = SX.free;
    if (!F || b.train) return "";
    if (!F.okB(b)) return `<p class="small freeNote">🎒 마지막 희망 판은 이 건물엔 못 갑니다.</p>`;
    const C = SX.coop, party = !!(C && C.on() && C.peers.size);
    return `<p class="small freeNote">🎒 <b>마지막 희망 판</b> — 받은 싸구려 장비로 나갑니다 · 내 장비와 보관함은 그대로 · 살아 나오면 들고 온 것은 보관함으로 · 의식을 잃으면 받은 장비만 없어집니다 · 보험 없음 · 다녀오면 ${Math.round(F.COOL_MS / 6e4)}분 쉽니다${party ? " · 파티원도 각자 받은 장비로 같이 갑니다(쉬는 시간이 남은 파티원은 빠집니다)" : ""}</p>`;
  }
  function freeBtn(b) {
    const F = SX.free;
    if (!F || b.train || !F.okB(b)) return "";
    return `<button id="goFree" class="big"${F.left() > 0 ? " disabled" : ""}>${esc(freeLabel())}</button>`;
  }
  let freeBusy = false;
  async function departFree(b, tod, sure) {
    const F = SX.free, C = SX.coop;
    if (mapLocked(b)) {
      SX.audio.play("denied");
      SX.log("🔒 " + b.name + " — 아직 갈 수 없습니다(이야기를 따라가면 열립니다)", "warn");
      return;
    }
    if (!F.okB(b)) {
      SX.audio.play("denied");
      SX.log("🎒 마지막 희망 판은 이 건물엔 못 갑니다", "warn");
      return;
    }
    {
      const w = SX.onboard && SX.onboard.why(b, null);
      if (w) {
        SX.audio.play("denied");
        SX.log(w, "warn");
        return;
      }
    }
    if (C && C.canQueue() && C.on() && !C.isHost()) {
      SX.audio.play("denied");
      SX.log("🌐 출격은 파티장이 누릅니다 — 혼자 가려면 파티 생성에서 파티를 나가 주십시오", "warn");
      return;
    }
    if (!sure && SX.kitck && SX.kitck.freeAsk(b, () => departFree(b, typeof todNow === "function" ? todNow() : tod, true))) return;
    if (freeBusy) return;
    freeBusy = true;
    let r;
    try {
      if (F.left() > 0 && F.refresh) await F.refresh();
      r = F.left() > 0 ? {
        ok: false,
        msg: "마지막 희망 판은 " + F.fmt(F.left()) + " 뒤에 다시 갈 수 있습니다"
      } : await F.ticket();
    } finally {
      freeBusy = false;
    }
    if (!r.ok) {
      SX.audio.play("denied");
      SX.log("🎒 " + r.msg, "warn");
      if (U.panelKind === "map") renderInfo();
      return;
    }
    if (C && C.canQueue()) {
      U.closePanel();
      C.queue(b, tod, {
        free: r.t
      });
      return;
    }
    SX.game.startRaid(b, tod, {
      free: r.t
    });
  }
  U.departFree = departFree;
  U.freeNote = freeNote;
  function coopLine(b) {
    const C = SX.coop;
    if (!C || !C.canQueue()) return `<p class="small">서버에 접속돼 있지 않습니다 — 혼자 판에 들어갑니다(매칭 없음)</p>`;
    const how = b && SX.soloMap && SX.soloMap(b) ? `<p class="small">🌐 단층 지도라 <b>다른 생존자는 들어오지 않습니다</b> — 우리 파티만 들어갑니다(파티원이 붙으면 바로 출발).</p>` : `<p class="small">🌐 출격하면 <b>같은 곳을 고른 사람</b>을 기다렸다 같이 들어갑니다(없으면 45초 뒤 출발). <b>다른 파티 사람은 적</b>입니다.</p>`;
    if (!C.on()) return how + `<p class="small">파티 없음 — 혼자 갑니다 <button id="mapCoop" class="small">파티 만들기</button></p>`;
    const n = C.peers.size;
    return how + (C.isHost() ? `<p><b class="good">🌐 파티 ${esc(C.room)} · 파티장</b> — 거점에 있는 파티원 ${n}명이 같은 팀으로 같이 갑니다 <button id="mapCoop" class="small">파티</button></p>` : `<p><b class="good">🌐 파티 ${esc(C.room)} · 파티원</b> — 파티장(${esc(C.nameOf(C.host))})이 출격을 누르면 같이 갑니다 <button id="mapCoop" class="small">파티</button></p>`);
  }
  let cityCache = null;
  function drawCityMap() {
    if (!cityCache) {
      const W = 320, H = 200, c = ART.mk(W, H), P = new ART.Pen(c.getContext("2d")), g = new SX.Rng(20260826);
      P.r(0, 0, W, H, "#10151d");
      for (let bx = 4; bx < W; bx += 22) for (let by = 4; by < H - 30; by += 20) {
        const n = 1 + g.i(3);
        for (let k = 0; k < n; k++) {
          const w = 5 + g.i(9), h = 4 + g.i(8);
          P.r(bx + g.i(18 - Math.min(w, 17)), by + g.i(16 - Math.min(h, 15)), w, h, g.chance(.2) ? "#243044" : "#1b2330");
        }
      }
      for (let x = 0; x < W; x += 22) P.r(x, 0, 2, H, "#2a2f38");
      for (let y = 0; y < H; y += 20) P.r(0, y, W, 2, "#2a2f38");
      P.r(0, 98, W, 4, "#3a3f48").r(158, 0, 4, H, "#3a3f48");
      for (let x = 0; x < W; x += 8) P.r(x, 99, 4, 1, "#8a7a3a");
      for (let x = 0; x < W; x++) {
        const y = Math.round(H - 26 + Math.sin(x / 40) * 6);
        P.r(x, y, 1, H - y, "#163a5c");
        P.p(x, y, "#2a5a8a");
      }
      P.oval(52, 70, 18, 12, "#1a3322").oval(170, 60, 12, 8, "#1a3322");
      cityCache = c;
    }
    const cv = document.createElement("canvas");
    cv.width = cityCache.width;
    cv.height = cityCache.height;
    cv.getContext("2d").drawImage(cityCache, 0, 0);
    cv.style.width = "100%";
    cv.style.height = "auto";
    return cv;
  }
  let termTab = "status", termFloor = null;
  let recFF = null;
  U.openTerminal = function(tab) {
    SX.audio.play("beepHi", {
      vol: .8
    });
    recFF = null;
    termFloor = A.player ? A.player.floor : 0;
    termTab = [ "status", "map", "notes", "keys" ].includes(tab) ? tab : "map";
    U.open("term", `<div class="term sxRig">${U.rigTop ? U.rigTop("생존자 통신망", "SX-07 야전 단말기") : ""}<div class="scr sxScr" id="termScr"></div><div class="side" id="termSide"></div></div>`);
    U.termDeco();
    renderTerm();
  };
  function bodyGraph() {
    const fights = SX.game.save.fights || {
      wins: 0,
      losses: 0
    };
    const rows = U.GYM.map(g => {
      const v = bodyLv(g.id), pct = v / 5 * 100;
      return `<div class="brow" title="${esc("끝 단계: " + g.fx(5) + (v >= 5 ? "" : " · 헬스장 " + g.name))}"><span class="bnm">${esc(g.stat)}</span><span class="bbar"><i style="width:${pct.toFixed(1)}%"></i></span><span class="bval">${v.toFixed(1)} / 5</span><span class="small bfx">${esc(g.fx(v))}${v >= 5 ? " ✓" : ""}</span></div>`;
    }).join("");
    const crit = A.meleeCrit ? +(A.meleeCrit() * 100).toFixed(2) : 15;
    return `<div class="bodyG tsCard"><h4>💪 몸 상태 ${U.qm(`헬스장(장터 오른쪽 아래 문) 기구마다 ${won(U.GYM_FEE)}을 냅니다.<br>성공 한 번 = 0.1단계 · 끝은 5단계(성공 50번)입니다.<br>단계가 오를수록 운동 횟수가 줄어듭니다(1단계마다 10%).<br>치명타는 주먹 싸움 1승마다 0.05%p(30%까지) · 샌드백으로 35%까지 오릅니다.`)}</h4>${rows}\n      <div class="brow"><span class="bnm">치명타</span><span class="bbar"><i style="width:${Math.min(100, (crit - 15) / 20 * 100).toFixed(1)}%"></i></span><span class="bval">${crit}% / 35%</span><span class="small bfx">주먹 싸움 ${fights.wins}승 ${fights.losses}패</span></div></div>`;
  }
  function skillGraph() {
    const S = SX.skills;
    if (!S) return "";
    const hub = !(SX.game.inRaid && SX.game.inRaid()), left = S.trainLeft();
    const rows = S.LIST.map(d => {
      const L = S.lv(d.id), v = S.lvf(d.id), pct = v / S.MAX * 100, nx = L < S.MAX ? S.need(d.id, L + 1) : 0;
      return `<div class="brow sk" title="${esc(d.unit + " " + Math.floor(S.xp(d.id)) + (L < S.MAX ? " / " + Math.ceil(nx) : ""))}"><span class="bnm">${esc(d.name)}</span><span class="bbar"><i style="width:${pct.toFixed(1)}%;background:#6ab8f0"></i></span><span class="bval">${L} / ${S.MAX}</span><span class="small bfx">${esc(d.fx)} −${Math.round(d.per * L * 1e3) / 10}%${L < S.MAX ? " · " + Math.floor(S.xp(d.id)) + "/" + Math.ceil(nx) : " ✓"}</span><span>${hub && L < S.MAX ? `<button class="mini" data-train="${d.id}">훈련 ${won(S.fee(d.id))}</button>` : ""}</span></div>`;
    }).join("");
    const ngx = SX.prog.ngXp ? Math.round((SX.prog.ngXp(SX.game.save.ng) - 1) * 100) : 0;
    return `<div class="bodyG tsCard"><h4>🎯 숙련 ${U.qm("판 안에서 할수록 늘어납니다 · 끝은 10단계입니다." + (ngx ? "<br>회차 보너스로 " + ngx + "% 더 빨리 늡니다." : "") + "<br>셸터에서는 교관 훈련(하루 세 번)으로 다음 단계까지 절반을 채웁니다.")}${hub ? ` <span class="small">훈련 오늘 ${left}번</span>` : ""}</h4>${rows}</div>`;
  }
  const TS_FS = [ 1.3, 1.2, 1.1, 1, .92, .85 ];
  function termFit(scr) {
    const run = () => {
      const st = scr.querySelector(".tStat"), box = scr.querySelector(":scope > .scrIn") || scr;
      if (!st) return;
      const wide = () => [ ...st.querySelectorAll(".brow .bnm, .brow .bval, .brow .bfx, .tsTile span") ].some(e => e.scrollWidth > e.clientWidth + 1);
      for (const f of TS_FS) {
        st.style.fontSize = f + "em";
        if (box.scrollHeight <= box.clientHeight + 1 && !wide()) break;
      }
    };
    run();
    requestAnimationFrame(run);
  }
  function mapFit(scr) {
    const run = () => {
      const w = scr.querySelector(".tMap"), cv = w && w.querySelector(".tMapCv"), rt = w && w.querySelector(".tMapR");
      if (!cv || !rt) return;
      const box = scr.querySelector(":scope > .scrIn") || scr, bb = box.getBoundingClientRect(), wb = w.getBoundingClientRect(), gap = parseFloat(getComputedStyle(w).columnGap) || 0;
      const ratio = cv.height / cv.width, avH = Math.floor(bb.bottom - wb.top - 10);
      if (avH < 120 || wb.width < 200) return;
      const cw = Math.max(160, Math.min(Math.floor((wb.width - gap) * .6), Math.floor(avH / ratio)));
      cv.style.width = cw + "px";
      cv.style.height = Math.round(cw * ratio) + "px";
      const fl = rt.querySelector(".tMapFl"), bs = fl ? [ ...fl.querySelectorAll(".tMapF") ] : [];
      if (!bs.length) return;
      const fs = getComputedStyle(fl), nc = Math.max(1, parseInt(fs.getPropertyValue("--c")) || 2), rows = Math.ceil(bs.length / nc), gx = parseFloat(fs.columnGap) || 0, gy = parseFloat(fs.rowGap) || 0;
      const b0 = bs[0], c0 = b0.querySelector("canvas"), bst = getComputedStyle(b0), padX = parseFloat(bst.paddingLeft) + parseFloat(bst.paddingRight) + parseFloat(bst.borderLeftWidth) + parseFloat(bst.borderRightWidth);
      const oh = b0.getBoundingClientRect().height - c0.getBoundingClientRect().height, other = rt.getBoundingClientRect().height - fl.getBoundingClientRect().height;
      const cellW = (fl.getBoundingClientRect().width - gx * (nc - 1)) / nc - padX, cellH = (avH - other - gy * (rows - 1)) / rows - oh;
      const tw = Math.max(40, Math.floor(Math.min(cellW, cellH / ratio)));
      for (const b of bs) {
        const c = b.querySelector("canvas");
        c.style.width = tw + "px";
        c.style.height = Math.round(tw * ratio) + "px";
      }
    };
    run();
    requestAnimationFrame(run);
  }
  U.termFit = () => {
    const scr = $("termScr");
    if (scr && termTab === "status") termFit(scr);
    if (scr && termTab === "map") mapFit(scr);
  };
  addEventListener("resize", () => {
    if (U.panelKind === "term") U.termFit();
  });
  function renderTerm() {
    const scr = $("termScr"), side = $("termSide");
    if (!scr) return;
    const G = SX.game, s = G.save, p = A.player;
    side.innerHTML = "";
    const g = document.createElement("div");
    g.className = "gauge";
    const dial = ART.mk(48, 34), P = new ART.Pen(dial.getContext("2d"));
    P.r(0, 0, 48, 34, "#e6e0cc").oval(24, 30, 20, 20, "#d8d0b8");
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI + k / 10 * Math.PI;
      P.p(24 + Math.cos(a) * 19, 30 + Math.sin(a) * 19, k > 7 ? "#c43" : "#333");
    }
    const na = Math.PI + s.infect / 100 * Math.PI;
    P.line(24, 30, 24 + Math.cos(na) * 16, 30 + Math.sin(na) * 16, "#111");
    const dv = document.createElement("canvas");
    dv.width = 48;
    dv.height = 34;
    dv.getContext("2d").drawImage(dial, 0, 0);
    g.appendChild(dv);
    g.insertAdjacentHTML("beforeend", `<div>감염 ${s.infect.toFixed(1)}%</div><div class="small">접속 ${Math.max(0, (100 - s.infect) / 100 * SX.data.infectFullMs / 36e5).toFixed(1)}시간 남음</div>`);
    side.appendChild(g);
    const tabs = [ [ "status", "상태" ], [ "map", "지도" ] ];
    if (SX.prog.ngOk && (SX.prog.ngOk(s.eg) || (s.ng | 0) > 0)) tabs.push([ "ng", "회차" ]);
    if (SX.clean && SX.clean.termOk()) tabs.push([ "clean", "집 청소" ]);
    tabs.push([ "keys", "조작" ]);
    for (const [k, n] of tabs) {
      const b = document.createElement("button");
      b.textContent = n;
      b.className = termTab === k ? "on" : "";
      b.onclick = () => {
        const ch = termTab !== k;
        termTab = k;
        SX.audio.play("click");
        renderTerm();
        if (ch) scr.scrollTop = 0;
      };
      side.appendChild(b);
    }
    const back = document.createElement("button");
    back.textContent = "◀ 닫기";
    back.setAttribute("data-close", "");
    side.appendChild(back);
    const now = new Date;
    if (termTab === "status") {
      const pc = v => Math.max(0, Math.min(100, v));
      const vit = [ [ "체력", p ? Math.ceil(p.hp) : 100, p ? pc(p.hp / A.hpMax(p) * 100) : 100, "#d23a45", "" ], [ "기력", p ? Math.round(p.st) : 100, p ? pc(p.st / A.stMax() * 100) : 100, "#47c24a", "" ], [ "배고픔", Math.round(s.food != null ? s.food : 100), pc(s.food != null ? s.food : 100), "#d8963a", "" ], [ "목마름", Math.round(s.water != null ? s.water : 100), pc(s.water != null ? s.water : 100), "#4aa6e0", "" ], [ "감염", s.infect.toFixed(0) + "%", pc(s.infect), "#8fd14a", U.qm("봉쇄된 서울 공기의 옅은 가스가 몸에 쌓이는 양입니다.<br>게임에 접속해 있는 동안만 오릅니다(접속 48시간이면 100%).<br>억제약(시장 약재상)으로 게이지를 0으로 돌립니다.<br>100%가 되면 셸터부터 모든 것을 잃고 처음 시작할 때처럼 다시 시작합니다.") ] ];
      const tile = (ic, n, lab) => `<div class="tsTile"><b>${n}</b><span>${ic} ${lab}</span></div>`;
      const intel = s.intel ? esc(D.buildings.find(b => b.id === s.intel.building).name) + " " + (s.intel.hotFloor + 1) + "층" : "없음";
      scr.innerHTML = `<h3><span class="led"></span> 생존 단말기 · ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}</h3>\n        <div class="tStat">\n          <div class="tsTop">\n            <div class="tsCard tsVit">${vit.map(([n, v, h, c, q]) => `<div class="center"><b class="tsV">${v}</b><span class="vbar"><i style="height:${h}%;background:${c}"></i></span><div>${n}${q ? " " + q : ""}</div></div>`).join("")}</div>\n            <div class="tsCard tsSum">\n              <div class="tsMoney">💰 <span class="money">${won(s.money)}</span>${(s.ng | 0) > 0 ? ` <span class="ngB">${(s.ng | 0) + 1}회차</span>` : ""}</div>\n              <div class="tsTiles">${tile("🚪", s.runs, "출격")}${tile("🏁", s.extracts, "탈출")}${tile("💀", s.deaths, "의식 잃음")}${tile("🎯", s.kills, "처치")}</div>\n              <div class="tsTags"><span class="${s.insured ? "good" : "dim"}">🛡 보험 ${s.insured ? "있음" : "없음"}</span><span class="${s.intel ? "good" : "dim"}">🗺 정보 ${intel}</span></div>\n              ${G.state === "raid" ? `<div class="tsTags"><span>⏱ 판 ${Math.floor(SX.raid.t / 60)}분 ${Math.floor(SX.raid.t % 60)}초</span><span>🎯 이번 판 처치 ${G.stats.kills}</span></div>` : ""}\n              ${G.state === "raid" && SX.raid.event ? `<div class="tsWarn">📢 ${esc(SX.raid.event.name)} ${U.qm(esc(SX.raid.event.desc))}</div>` : ""}\n              ${G.state === "raid" && SX.wx && SX.wx.DESC[G.env.wx] ? `<div class="tsWarn">${esc(SX.wx.KINDS[G.env.wx].name)} ${U.qm(esc(SX.wx.DESC[G.env.wx]))}</div>` : ""}\n            </div>\n          </div>\n          <div class="tsMid">${bodyGraph()}${skillGraph()}</div>\n          <div class="apps">${[ "map", "notes", "keys" ].map(a => `<button data-app="${a}"><canvas width="24" height="24" data-art="${a}"></canvas>${{
        map: "지도",
        status: "상태",
        notes: "메모",
        keys: "조작"
      }[a]}</button>`).join("")}</div>\n        </div>`;
      for (const c of scr.querySelectorAll("canvas[data-art]")) c.getContext("2d").drawImage(ART.app(c.dataset.art), 0, 0);
      termFit(scr);
      scr.onclick = e => {
        const tb = e.target.closest("[data-train]");
        if (tb) {
          SX.skills.train(tb.dataset.train, ok => {
            if (ok) SX.audio.play("buy");
            renderTerm();
          });
          return;
        }
        const b = e.target.closest("[data-app]");
        if (!b) return;
        termTab = b.dataset.app;
        SX.audio.play("click");
        renderTerm();
        scr.scrollTop = 0;
      };
    } else if (termTab === "notes") {
      const MK = "sxd_memo_" + (SX.net && SX.net.id || "local");
      let txt = "";
      try {
        txt = localStorage.getItem(MK) || "";
      } catch (e) {}
      scr.innerHTML = `<h3><span class="led"></span> 메모 ${U.qm("적은 것은 이 컴퓨터에 계정마다 저장됩니다.<br>쓰는 대로 바로 저장됩니다.")}</h3><textarea id="memoTa" class="memoTa" maxlength="4000" spellcheck="false" placeholder="여기에 적어 두십시오 — 쓰는 대로 저장됩니다"></textarea><div class="small memoSt" id="memoSt"></div>`;
      const ta = $("memoTa"), st = $("memoSt");
      ta.value = txt;
      const show = saved => {
        st.textContent = (saved ? "저장했습니다 · " : "") + ta.value.length + " / 4000자";
      };
      show(false);
      ta.oninput = () => {
        try {
          localStorage.setItem(MK, ta.value);
        } catch (e) {}
        show(true);
      };
      scr.onclick = null;
    } else if (termTab === "rank") {
      scr.innerHTML = `<div id="wkBody">${weekHtml(null)}</div><h3><span class="led"></span> 이번 주 순위 ${U.qm("한국 시각 월요일 0시부터 셉니다.<br>30초 안 된 판은 뺍니다 · 1분마다 새로 셉니다.")}</h3><div id="rankBody">불러오는 중…</div>`;
      scr.onclick = async e => {
        const b = e.target.closest("[data-wkclaim]");
        if (!b || b.disabled) return;
        b.disabled = true;
        const r = SX.net && SX.net.weekClaim ? await SX.net.weekClaim() : {
          ok: false
        };
        SX.audio.play(r && r.ok ? "buy" : "denied");
        if (termTab === "rank" && U.panelKind === "term") renderTerm();
      };
      (async () => {
        const [w, r] = await Promise.all([ SX.net && SX.net.week ? SX.net.week() : {
          ok: false,
          msg: "로그인이 필요합니다"
        }, SX.net && SX.net.rank ? SX.net.rank() : {
          ok: false,
          msg: "로그인이 필요합니다"
        } ]);
        const wb = $("wkBody");
        if (wb) wb.innerHTML = weekHtml(w);
        const box = $("rankBody");
        if (!box) return;
        if (!r || !r.ok) {
          box.innerHTML = `<p>${esc(r && r.msg || "순위를 못 받았습니다")} — 로그인하면 같이 하는 사람들과 순위를 겨룰 수 있습니다.</p>`;
          return;
        }
        const me = SX.net.name() || "";
        const T = [ [ "gain", "들고 나온 값(탈출한 판 합)", v => won(v) ], [ "best", "한 판 최고", v => won(v) ], [ "ext", "탈출", v => v + "번" ], [ "kills", "처치", v => v ] ];
        box.innerHTML = `<div class="rankGrid">` + T.map(([k, name, f]) => {
          const L = r.lists[k] || {
            top: []
          };
          return `<div class="rankCol"><h4>${esc(name)}</h4>${L.top.length ? L.top.map((o, i) => `<div class="${o.me || o.id === me ? "me" : ""}"><b>${i + 1}</b> <span data-notr>${esc(o.id)}</span>${ngTag(r.ng, o.id)} <span>${f(o.v)}</span></div>`).join("") : `<div class="small">아직 없습니다</div>`}\n            ${L.me && L.me.rank > 10 ? `<div class="me"><b>${L.me.rank}</b> ${esc(me)}${ngTag(r.ng, me)} <span>${f(L.me.v)}</span></div>` : ""}</div>`;
        }).join("") + `</div>`;
      })();
    } else if (termTab === "ng") {
      scr.innerHTML = ngHtml();
      scr.onclick = e => {
        if (e.target.closest("#ngGo")) {
          SX.audio.play("click");
          U.ngConfirm();
        }
      };
    } else if (termTab === "map") {
      if (G.state !== "raid" || !SX.raid.level) {
        scr.innerHTML = `<h3>지도</h3><p>🗺 판 안에서 층 지도를 보여 줍니다 ${U.qm("본 곳만 밝혀지고, 계단 · 탈출 지점 · 핑은 늘 보입니다.<br>도심 지도(출격 · 시장 · 셸터)는 셸터 단말기나 문에서 엽니다.")}</p>`;
      } else {
        const lv = SX.raid.level, box = lv.mapBox || null;
        if (box) termFloor = box.f | 0; else if (termFloor == null || termFloor >= lv.floors.length) termFloor = p.floor;
        const fname = f => lv.floors[f].kind === "roof" ? "옥상" : lv.floors[f].park ? "지하 1층" : f + 1 + "층";
        scr.innerHTML = `<h3>지도 — ${esc(lv.building.name)} ${fname(termFloor)} ${U.qm("누르기: 핑 · 우클릭: 핑 지우기<br>흰 화살표 = 나 · ▲ 올라가는 계단 · ▼ 내려가는 계단 · 초록 = 탈출<br>금빛 자물쇠 = 찾은 잠긴 방(문이나 방을 지도에 밝히면 뜹니다)")}</h3>`;
        const ratio = SX.minimap.bigRatio(lv), rs = ratio.toFixed(4);
        const wrap = document.createElement("div");
        wrap.className = "tMap";
        const rt = document.createElement("div");
        rt.className = "tMapR";
        wrap.appendChild(rt);
        scr.appendChild(wrap);
        if (!box && lv.floors.length > 1) {
          const fl = document.createElement("div"), n = lv.floors.length;
          fl.className = "tMapFl";
          fl.style.setProperty("--c", n <= 2 ? n : n <= 4 ? 2 : 3);
          lv.floors.forEach((_, f) => {
            const b = document.createElement("button");
            b.className = "tMapF" + (f === termFloor ? " on" : "");
            const c = document.createElement("canvas");
            c.width = 320;
            c.height = Math.round(320 * ratio);
            SX.minimap.drawBig(c, f);
            const t = document.createElement("span");
            t.textContent = fname(f) + (f === p.floor ? "(여기)" : "");
            b.append(c, t);
            b.onclick = () => {
              termFloor = f;
              renderTerm();
            };
            fl.appendChild(b);
          });
          rt.appendChild(fl);
        }
        if (SX.hudLay) SX.hudLay.mapEta(rt);
        if (SX.week && SX.week.mapNote) SX.week.mapNote(rt);
        const cv = document.createElement("canvas");
        cv.width = 640;
        cv.height = Math.round(640 * ratio);
        cv.className = "tMapCv";
        cv.style.width = "min(56vw, calc(66vh / " + rs + "))";
        cv.style.height = "min(calc(56vw * " + rs + "), 66vh)";
        cv.style.imageRendering = "pixelated";
        cv.style.cursor = "crosshair";
        cv.style.display = "block";
        const m = SX.minimap.drawBig(cv, termFloor);
        cv.onmousedown = e => {
          const r = cv.getBoundingClientRect();
          const x = m.x0 + ((e.clientX - r.left) / r.width * cv.width - m.ox) / m.k, y = m.y0 + ((e.clientY - r.top) / r.height * cv.height - m.oy) / m.k;
          if (e.button === 2) SX.raid.unping(termFloor, x, y); else SX.raid.ping(termFloor, x, y);
          e.preventDefault();
          renderTerm();
        };
        wrap.insertBefore(cv, rt);
        mapFit(scr);
      }
    } else if (termTab === "story") {
      scr.innerHTML = storyHtml(true);
      scr.onclick = e => {
        qTgClick(e, termRedraw);
      };
    } else if (termTab === "quest") {
      const P = SX.prog, st = s.quests || P.qNew(), open = P.open(st), cur = [];
      for (const t of Object.keys(open)) {
        if (!open[t].length) cur.push([ t, null ]); else for (const q of open[t]) cur.push([ t, q ]);
      }
      const keys = cur.filter(e => e[1]).map(e => "q:" + e[1].id);
      scr.onclick = e => {
        qTgClick(e, termRedraw);
      };
      const rows = cur.map(([t, q]) => {
        if (!q) return `<div class="qrow done"><b>${esc(P.TRADERS[t])}</b> — 의뢰를 다 끝냈습니다</div>`;
        const all = P.QUESTS.filter(x => x.t === t), k = all.indexOf(q) + 1, pr = P.progress(st, s, q), ok = pr >= q.n, pct = Math.min(100, pr / q.n * 100);
        const what = P.MIS && P.MIS[q.kind] ? P.misWhat(q) : q.kind === "fetch" ? q.item + " " + q.n + "개(보관함·가방)" : q.kind === "kill" ? {
          scav: "약탈자",
          zombie: "감염체",
          boss: "약탈자 두목"
        }[q.what] + " " + q.n + (q.b ? " · " + bName(q.b) : "") : bName(q.b) + (q.night ? " 밤" : "") + " 탈출 " + q.n + "번";
        return `<div class="qrow${ok ? " ok" : ""}${qHid("q", q.id) ? " qOff" : ""}"><div>${qTgHtml("q:" + q.id)}<b>${esc(P.TRADERS[t])}</b> ${k}/${all.length} — 「${esc(q.name)}」 <span class="qrw">${won(q.money)}${q.items ? " + " + esc(q.items.join(", ")) : ""}</span></div>\n          <div class="small">${esc(q.desc)}</div><div class="qbar"><i style="width:${pct.toFixed(0)}%"></i></div><div class="small">${esc(what)} · <b>${pr}/${q.n}</b>${ok ? " — <b class='qok'>다 했습니다! 시장 의뢰 탭에서 보상</b>" : ""}</div></div>`;
      }).join("");
      scr.innerHTML = `<h3>${qTgAll(keys)}의뢰 <span class="small">끝낸 의뢰 ${st.done.length}/${P.QUESTS.length}</span> ${U.qm("처치 · 탈출은 판이 끝나면 셉니다.<br>보상은 시장 의뢰 탭에서 받습니다.")}</h3><div class="qlist">${rows}</div>`;
    } else if (termTab === "clean" && SX.clean) {
      SX.clean.term(scr, renderTerm);
    } else if (termTab === "rec") {
      scr.innerHTML = recHtml();
      featCols(scr);
      scr.onclick = e => {
        const ff = e.target.closest("[data-ff]");
        if (ff) {
          recFF = recFF === ff.dataset.ff ? null : ff.dataset.ff;
          SX.audio.play("click");
          renderTerm();
          requestAnimationFrame(() => {
            const w = scr.querySelector(".recWrap"), h = scr.querySelector(".recFt");
            if (w && h) w.scrollTop += h.getBoundingClientRect().top - w.getBoundingClientRect().top;
          });
          return;
        }
        const b = e.target.closest("[data-title]");
        if (!b) return;
        SX.feats.setTitle(s, b.dataset.title);
        SX.audio.play("click");
        G.persist();
        renderTerm();
      };
    } else {
      scr.innerHTML = `<h3>조작</h3>` + keyTable(true) + (SX.pad ? `<h3>게임패드</h3>` + SX.pad.table() : "");
    }
  }
  const ngTag = (map, id) => {
    const n = map ? map[id] | 0 : 0;
    return n > 0 ? ` <i class="ngB">${n + 1}회차</i>` : "";
  };
  function leftTxt(ms) {
    const m = Math.max(0, Math.floor(ms / 6e4)), h = Math.floor(m / 60);
    return h >= 24 ? Math.floor(h / 24) + "일 " + h % 24 + "시간" : h + "시간 " + m % 60 + "분";
  }
  function weekHtml(w) {
    const P = SX.prog, T = P.WK_TIER || [];
    const head = `<h3><span class="led"></span> 주간 도전 ${w && w.ok ? `<span class="small">⏳ 남은 ${leftTxt(w.end - w.now)}</span> ` : ""}${U.qm("월요일 0시(한국 시각)에 셋이 바뀝니다.<br>살아서 나온 판만 셉니다.<br>별 하나 = " + T.map(t => t.name + " " + t.pt).join(" · ") + "점")}</h3>`;
    if (!w) return head + `<p class="small">불러오는 중…</p>`;
    if (!w.ok) return head + `<p class="small">${esc(w.msg || "주간 도전을 못 받았습니다")} — 로그인하면 주간 도전에 참여할 수 있습니다.</p>`;
    const me = SX.net && SX.net.name && SX.net.name() || "", list = (w.list || []).map(P.wcById).filter(Boolean), L = w.last || {};
    const card = (c, prog) => {
      const n = (prog || {})[c.id] || 0, top = c.star[c.star.length - 1], k = P.wkStars(c, n), t = T[c.tier] || {
        name: "",
        pt: 0
      }, f = v => c.won ? won(v) : String(v);
      return `<div class="wkC t${c.tier}${k >= 3 ? " full" : ""}"><div class="wkH"><b>${esc(c.name)}</b><span class="wkT">${esc(t.name)} · 별 하나 ${t.pt}점</span><span class="wkS">${"★".repeat(k)}${"☆".repeat(Math.max(0, 3 - k))}</span></div>\n        <div class="small">${esc(c.desc)}</div>\n        <div class="qbar wkBar"><i style="width:${Math.min(100, n / top * 100).toFixed(1)}%"></i>${c.star.slice(0, -1).map(v => `<u style="left:${(v / top * 100).toFixed(1)}%"></u>`).join("")}</div>\n        <div class="small">${esc(f(n))} / ${esc(f(top))} · 별 ${c.star.map(v => esc(f(v))).join(" · ")}</div></div>`;
    };
    const rows = (R, map) => R && R.length ? R.map((o, i) => `<div class="${o.me || o.id === me ? "me" : ""}"><b>${i + 1}</b> <span data-notr>${esc(o.id)}</span>${ngTag(map, o.id)} <span>${o.v}점</span></div>`).join("") : `<div class="small">아직 없습니다</div>`;
    const rw = L.reward, rwTxt = rw ? won(rw.money) + (rw.title ? " · 칭호 「" + rw.title + "」" : "") : "";
    const claim = rw ? L.claimed ? `<p class="small">받았습니다 — ${esc(rwTxt)}</p>` : `<button class="big" data-wkclaim>지난주 몫 받기 — ${esc(rwTxt)}</button>` : "";
    return head + `<div class="wkList">${list.map(c => card(c, w.prog)).join("")}</div>\n      <p class="wkMe">내 점수 <b>${w.pts | 0}점</b>${w.rank ? ` · ${w.rank}위 / ${w.n}명` : " · 아직 순위 없음"} · 이번 주 센 판 ${w.raids | 0}</p>\n      <div class="wkGrid"><div class="wkCol"><h4>이번 주 도전 순위</h4>${rows(w.top, w.ng)}${w.rank > 10 ? `<div class="me"><b>${w.rank}</b> ${esc(me)}${ngTag(w.ng, me)} <span>${w.pts}점</span></div>` : ""}</div>\n        <div class="wkCol"><h4>지난주 도전 순위</h4>${rows(L.top, w.ng)}${L.pts > 0 && !(L.top || []).some(o => o.me || o.id === me) ? `<div class="me"><b>${L.rank || "-"}</b> ${esc(me)}${ngTag(w.ng, me)} <span>${L.pts}점</span></div>` : ""}\n          <p class="small">${L.pts > 0 ? `내 지난주 — ${L.pts}점 · 별 ${L.stars}개${L.rank ? " · " + L.rank + "위 / " + L.n + "명" : ""}` : "지난주엔 딴 별이 없습니다"}</p>${claim}</div></div>\n      <p class="small">지난주 몫(다음 한 주 안에 받으시면 됩니다): 별 하나 ${won(P.WK_STAR_WON || 0)} + 1위 ${won(3e6)} · 2~3위 ${won(15e5)} · 4~10위 ${won(5e5)}과 칭호</p>`;
  }
  const ngBonus = k => "보관함 +" + SX.prog.ngRows(k) + "줄 · 숙련 +" + Math.round((SX.prog.ngXp(k) - 1) * 100) + "%";
  function ngHtml() {
    const G = SX.game, s = G.save, P = SX.prog, n = s.ng | 0, ok = P.ngOk(s.eg), log = Array.isArray(s.ngLog) ? s.ngLog : [];
    return `<h3><span class="led"></span> 회차 <span class="small">지금 ${n + 1}회차 · ${n ? esc(ngBonus(n)) : "보너스 없음"}</span></h3>\n      <p>🔁 다시 처음부터 ${U.qm("헬기로 서울을 떠난 뒤에는 가진 것을 모두 내려놓고 다시 처음부터 시작할 수 있습니다.<br>회차마다 보관함 두 줄 · 숙련 10%가 영구히 붙습니다(5회차까지).")}</p>\n      <div class="ngBox"><div><b>다음은 ${n + 2}회차</b> — ${esc(ngBonus(n + 1))}${P.ngB(n + 1) === P.ngB(n) ? " (보너스는 5회차가 끝입니다)" : ""}</div>\n        ${ok ? G.inRaid() ? `<p class="small">판 안에서는 못 합니다.</p>` : `<button class="big" id="ngGo">다시 처음부터 (${n + 2}회차)</button><p class="small">누르면 무엇을 잃고 무엇이 남는지 먼저 보여 드립니다.</p>` : `<p class="small">이번 회차에서 여의도 헬기장의 헬기로 서울을 떠나면 열립니다.</p>`}</div>\n      ${log.length ? `<h4>지난 회차</h4><div class="small">` + log.map(q => `${q.n}회차를 마침 — ${esc(new Date(q.at).toLocaleDateString())} · 그때 돈 ${won(q.money || 0)}`).join("<br>") + `</div>` : ""}`;
  }
  let ngEl = null;
  U.ngConfirm = function() {
    const G = SX.game, s = G.save, P = SX.prog, n = s.ng | 0, k = G.kit;
    if (!P.ngOk(s.eg) || G.inRaid()) return;
    const kitN = [ "w1", "w2", "melee", "armor", "helmet", "bag", "rig" ].filter(q => k[q]).length + I.kitGrids(k).reduce((t, g) => t + g.list.length, 0);
    const safeN = SX.vault ? SX.vault.of(s).ext.length : 0, home = SX.home.tier ? SX.home.tier().name : "";
    const facN = Object.keys(s.fac || {}).filter(q => s.fac[q] && (s.fac[q].lv | 0) > 0).length;
    const sk = SX.skills ? SX.skills.LIST.map(d => d.name + " " + SX.skills.lv(d.id)).join(" · ") : "";
    const lost = [ "돈 " + won(s.money) + " → " + won(P.NG_START.money), "보관함 물건 " + s.stash.list.length + "개 · 보관함 " + s.stash.cols + "×" + s.stash.rows + " → 10×" + (6 + P.ngRows(n + 1)), "장비(가방 · 리그 속까지) " + kitN + "개" + (safeN ? " · 개인 금고 " + safeN + "개(든 것까지)" : ""), "셸터 — 집 「" + home + "」 · 가구 " + (s.home && s.home.furn || []).filter(q => !q.builtin).length + "개 · 바닥에 둔 것", "설비 " + facN + "개 · 이야기 임무 " + (s.story && s.story.done || []).length + "개 · 상인 의뢰 " + (s.quests && s.quests.done || []).length + "개 · 서울 탈출 작전 · 구출 작전 · 현상금 게시판", "숙련(" + sk + ") · 감염 게이지 · 보험 · 정보 · 용병" ];
    const kept = [ "겉모습 · 칭호 · 도전 과제 · 건물 기록 · 도감 · 숨겨진 것", "몸 상태(헬스) · 주먹 싸움 전적 · 출격 · 탈출 · 처치 수", "순위 기록 · 주간 도전 · 오늘과 이번 주 과제" ];
    const gain = [ "보관함 공짜 +" + P.ngRows(n + 1) + "줄(회차 보너스 합)", "숙련 오르는 빠르기 +" + Math.round((P.ngXp(n + 1) - 1) * 100) + "%", "이름 옆 「" + (n + 2) + "회차」", "처음 장비(사제 파이프 권총 · 식칼 · 천 가방 · 기본 리그 · 9mm 탄창 · 붕대 · 진통제)와 " + won(P.NG_START.money) ];
    const ul = L => `<ul>${L.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (!ngEl) {
      ngEl = document.createElement("div");
      ngEl.id = "ngAsk";
      ngEl.className = "hidden";
      document.body.appendChild(ngEl);
    }
    ngEl.innerHTML = `<div class="win askWin ngWin"><header><h2>다시 처음부터 — ${n + 2}회차</h2></header><div class="body">\n      <div class="ngCols"><div class="ngLost"><h4>잃는 것 — 되돌릴 수 없습니다</h4>${ul(lost)}</div>\n        <div><div class="ngKept"><h4>남는 것</h4>${ul(kept)}</div><div class="ngGain"><h4>새로 받는 것</h4>${ul(gain)}</div></div></div>\n      <label class="ngChk"><input type="checkbox" id="ngChk"> 위 내용을 다 읽었습니다. 잃는 것은 돌아오지 않습니다.</label>\n      <div class="row" style="justify-content:center"><button class="big" id="ngYes" disabled>다시 처음부터 (${n + 2}회차)</button><button id="ngNo">그만두기</button></div></div></div>`;
    ngEl.classList.remove("hidden");
    const close = () => {
      ngEl.classList.add("hidden");
      SX.input.down.clear();
    };
    $("ngChk").onchange = () => {
      $("ngYes").disabled = !$("ngChk").checked;
    };
    $("ngNo").onclick = () => {
      SX.audio.play("click");
      close();
    };
    ngEl.onmousedown = e => {
      if (e.target === ngEl) close();
    };
    $("ngYes").onclick = () => {
      if (!$("ngChk").checked) return;
      close();
      U.ask("정말 다시 시작하시겠습니까?", "마지막으로 여쭙니다 — 돈 · 보관함 · 장비 · 셸터 · 이야기가 모두 처음으로 돌아갑니다.", 0, async () => {
        const r = await G.ngStart();
        if (!r || !r.ok) {
          SX.audio.play("denied");
          SX.log("🔁 " + (r && r.msg || "못 했습니다"), "bad");
        }
      }, null, {
        yes: n + 2 + "회차 시작",
        q: "되돌릴 수 없습니다."
      });
    };
  };
  const wonC = v => {
    v = Math.max(0, Math.floor(v));
    if (SX.lang === "en") return v >= 1e6 ? +(Math.floor(v / 1e5) / 10) + "M" : v >= 1e3 ? Math.floor(v / 1e3) + "K" : String(v);
    return v >= 1e8 ? +(Math.floor(v / 1e7) / 10) + "억" : v >= 1e4 ? Math.floor(v / 1e4).toLocaleString("ko-KR") + "만" : String(v);
  };
  function featCols(scr) {
    requestAnimationFrame(() => {
      const fl = scr.querySelector(".featList");
      if (!fl || fl.classList.contains("fcols")) return;
      const fs = parseFloat(getComputedStyle(fl).fontSize) || 16, b = Math.max(0, ...[ ...fl.querySelectorAll(".fh > button") ].map(e => e.getBoundingClientRect().width));
      fl.style.setProperty("--fbw", (b / fs).toFixed(3) + "em");
      fl.classList.add("fcols");
    });
  }
  function recHtml() {
    const s = SX.game.save, Fe = SX.feats;
    Fe.check(s, true);
    const r = s.rec || {}, cur = Fe.title(s);
    const LIST = Fe.LIST.filter(f => !(f[4] && f[4].hidden) || Fe.done(s, f));
    const n = LIST.filter(f => Fe.done(s, f)).length;
    const fk = f => f[4] && f[4].hidden ? "egg" : "ch", SHOW = recFF ? LIST.filter(f => fk(f) === recFF) : LIST;
    let rows = SHOW.map(f => {
      const [a0, b] = f[3](s), ok = Fe.done(s, f), a = ok ? Math.max(a0, b) : a0, pct = Math.min(100, a / b * 100);
      const num = b >= 1e6 ? wonC(Math.min(a, b)) + " / " + wonC(b) : Math.min(a, b) + " / " + b, numT = b >= 1e6 ? ` title="${won(Math.min(a, b)) + " / " + won(b)}"` : "";
      return `<div class="feat${ok ? " ok" : ""}" data-fk="${fk(f)}"><div class="fh"><b>${ok ? "🏅" : "·"} ${esc(f[1])}</b><span class="small fd">${esc(f[2])}</span><span class="fv"${numT}>${num}</span>${ok ? `<button data-title="${esc(f[1])}" class="${cur === f[1] ? "on" : ""}">${cur === f[1] ? "달고 있음" : "칭호 달기"}</button>` : ""}</div><span class="bbar"><i style="width:${pct.toFixed(1)}%"></i></span></div>`;
    }).join("");
    if (recFF === "egg") {
      const got = (SX.EGGS || []).filter(g => (s.eggs || []).indexOf(g.id) >= 0), left = (SX.EGGS || []).length - got.length, bn = id => (SX.data.buildings.find(b => b.id === id) || {}).name || "";
      rows += got.map(g => `<div class="feat ok eggRow" data-fk="egg" data-egg="${esc(g.id)}"><div class="fh"><b>🔍 ${esc(g.item)}</b><span class="small fd">${esc(bn(g.b) + " — " + g.desc)}</span><span class="fv">찾음</span></div></div>`).join("") + (left > 0 ? `<div class="feat ffNone" data-fk="none"><span class="small">${esc("아직 못 찾은 것 " + left + "개 — 장터 사람들 이야기에 단서가 있습니다. 다 찾으면 숨은 칭호를 받습니다.")}</span></div>` : "");
    }
    const FL = Fe.foeList ? Fe.foeList() : [], foeN = FL.filter(q => Fe.foeSeen(s, q.k)).length;
    if (recFF === "foe") {
      const BL = SX.data.buildings.filter(b => !b.train), A = SX.actors;
      const inB = q => BL.filter(b => A && A.foesOf && A.foesOf(b, {}).some(x => x.k === q.k)).map(b => b.name);
      const where = q => {
        if (q.k === "wksol") return [ "이번 주 봉쇄된 건물", "" ];
        if (q.b) return [ ((BL.find(b => b.id === q.b) || {}).name || "") + " · 판의 절반쯤", "" ];
        const ns = inB(q);
        return [ ns.length >= BL.length ? "모든 건물" : ns.length > 3 ? "건물 " + ns.length + "곳" : ns.join(" · "), ns.length > 3 ? ns.join(" · ") : "" ];
      };
      rows += FL.map(q => {
        const ok = Fe.foeSeen(s, q.k), [w, wt] = where(q);
        return `<div class="feat${ok ? " ok" : ""} foeRow" data-fk="foe"><div class="fh"><b>${ok ? "☠" : "·"} ${esc(q.name)}</b><span class="small fd"${wt ? ` title="${esc(wt)}"` : ""}>${esc(w)}</span><span class="fv">${ok ? "쓰러뜨림" : "아직"}</span></div></div>`;
      }).join("");
    }
    const brow = SX.data.buildings.filter(b => !b.train && (!b.final || (r.b || {})[b.id])).map(b => {
      const x = (r.b || {})[b.id] || {
        runs: 0,
        ext: 0,
        dead: 0,
        best: 0,
        kills: 0
      };
      return `<tr><td>${esc(b.name)}</td><td>${x.runs}</td><td>${x.ext}</td><td>${x.dead}</td><td>${x.kills}</td><td>${x.best ? won(x.best) : "-"}</td><td>${(r.bossB || {})[b.id] ? "☠ " + r.bossB[b.id] : "-"}</td></tr>`;
    }).join("");
    const chip = t => `<span class="recChip">${t}</span>`;
    const chipB = (ff, t) => `<button class="recChip recFf${recFF === ff ? " on" : ""}" data-ff="${ff}" aria-pressed="${recFF === ff}">${t}</button>`;
    return `<h3>기록</h3><div class="recChips">${chipB("ch", "🏅 도전 과제 <b>" + n + " / " + LIST.length + "</b>")}${(s.eggs || []).length ? chipB("egg", "🔍 숨겨진 것 <b>" + s.eggs.length + " / " + (SX.EGGS || []).length + "</b>") : ""}${FL.length ? chipB("foe", "☠ 적 도감 <b>" + foeN + " / " + FL.length + "</b>") : ""}${chip("🎖 칭호 <b>" + (cur ? "「" + esc(cur) + "」" : "없음") + "</b>" + (cur ? ` <button data-title="">떼기</button>` : ""))}${chip("🔥 연속 탈출 <b>" + (r.streak || 0) + "</b> (최고 " + (r.bestStreak || 0) + ")")}${chip("📖 도감 <b>" + (r.found || []).length + " / " + (SX.raidLootNames ? SX.raidLootNames().size : "?") + "</b>")}</div>\n      <div class="recWrap"><h4 class="recH">🏢 건물 기록 ${U.qm("건물 기록은 0.8.56 부터 셉니다.")}</h4><table class="recT"><tr><th>건물</th><th>출격</th><th>탈출</th><th>의식 잃음</th><th>처치</th><th>최고 수입</th><th>두목</th></tr>${brow}</table>\n      <h4 class="recH recFt">${recFF === "foe" ? "☠ 적 도감" : `🎖 도전 과제 · 칭호 ${U.qm("과제를 이루면 칭호를 달 수 있습니다.<br>칭호는 같이 하는 판에서 동료 이름표 위에 보입니다.")}`}</h4>\n      <div class="featList">${rows}${Fe.wkTitles && !recFF ? Fe.wkTitles(s).map(t => `<div class="feat ok"><div class="fh"><b>🏁 ${esc(t)}</b><span class="small fd">주간 도전에서 받은 칭호</span><button data-title="${esc(t)}" class="${cur === t ? "on" : ""}">${cur === t ? "달고 있음" : "칭호 달기"}</button></div></div>`).join("") : ""}</div></div>`;
  }
  let menuHov = null, menuHovK = "", menuHovT = -1e9;
  document.addEventListener("pointerover", e => {
    const b = e.target && e.target.closest ? e.target.closest("#menuBody button, .setWin button") : null;
    if (b === menuHov) return;
    const gone = !!menuHov && !menuHov.isConnected;
    menuHov = b;
    if (!b) {
      if (gone) menuHovT = performance.now(); else menuHovK = "";
      return;
    }
    const r = b.getBoundingClientRect(), k = b.textContent + "|" + Math.round(r.left) + "," + Math.round(r.top), keep = k === menuHovK && (gone || performance.now() - menuHovT < 400);
    menuHovK = k;
    menuHovT = -1e9;
    if (keep) return;
    const A = SX.audio;
    if (!b || b.disabled || !A || !A.ok || !A.ctx || A.ctx.state !== "running") return;
    if (performance.now() - Math.max(U.menuAt || 0, U.setAt || 0) < 250) return;
    U.menuHovers = (U.menuHovers || 0) + 1;
    A.play("uiHover");
  });
  const emWhere = () => {
    const G = SX.game, H = SX.hub;
    if (G.state === "raid") return SX.raid && SX.raid.level ? "판 진행 중 · " + SX.raid.level.building.name : "판 진행 중";
    if (G.state !== "hub" || !H) return "";
    const sc = H.scene, mw = SX.meet && SX.meet.where ? SX.meet.where() : "";
    return sc === "home" ? "셸터 · " + SX.home.tier().name : sc === "visit" && SX.visit ? SX.visit.title() : sc === "range" ? "사격장" : sc === "gym" ? "헬스장" : sc === "fish" ? "한강 낚시터" : "시장" + (mw ? " · " + mw : "");
  };
  const emCoop = () => {
    const G = SX.game, C = SX.coop, p = A.player;
    return G.state === "raid" && !!(C && C.inCoop && C.inCoop()) && !C.spec && !!(p && p.alive);
  };
  U.emCoop = emCoop;
  const emInsured = () => {
    const out = [];
    for (const d of SX.game.insuredList || []) {
      try {
        const it = I.restore(d);
        if (it && it.name) out.push(it.name);
      } catch (e) {}
    }
    return out;
  };
  const emKV = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  const emNowIn = function(ins) {
    const G = SX.game, s = G.save, R = SX.raid, raid = G.state === "raid" && !!(R && R.level), spec = raid && !!(SX.coop && SX.coop.spec);
    const practice = raid && !!(R.tutMode || R.level.building.train), free = raid && !!(SX.free && SX.free.on && SX.free.on());
    let kv = "";
    if (raid) {
      const t = Math.max(0, Math.floor(R.t || 0)), wk = SX.wx && SX.wx.KINDS ? SX.wx.KINDS[G.env.wx] : null;
      kv += emKV("지난 시간", String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"));
      kv += emKV("날씨 · 때", `<span>${wk && wk.name ? esc(wk.name) : "맑음"}</span> · <span>${G.env.night ? "밤" : "낮"}</span>`);
    } else {
      const w = emWhere();
      if (w) kv += emKV("있는 곳", esc(w));
      kv += emKV("돈", `<b class="money">${won(s.money)}</b>`);
    }
    if (typeof s.infect === "number") kv += emKV("감염 수치", `${s.infect.toFixed(1)}%<span class="emBar"><i style="width:${Math.max(0, Math.min(100, s.infect)).toFixed(1)}%"></i></span>`);
    if (raid && !spec) {
      kv += emKV("가진 것 값", `<b class="money">${won(I.kitValue(G.kit))}</b>`);
      if (!SX.TRIAL && !practice && !free) kv += emKV("보험", ins.length ? ins.map(n => `<span>${esc(n)}</span>`).join(" · ") : "든 것 없음");
      const lk = $("hudInfo") && $("hudInfo").querySelector(".lock"), lt = lk ? lk.textContent.trim() : "";
      if (lt) kv += emKV("출구", `${esc(lt)} <span class="emKey">${esc(SX.label("terminal"))}</span>`);
    }
    let h = `<h3>${raid ? "이번 판" : "지금"}</h3><dl class="emKV">${kv}</dl>`;
    const tl = U.trackList ? U.trackList() : [], isSt = x => x.k === "s" || x.k === "e", qs = tl.filter(x => !isSt(x)), st = tl.find(isSt);
    if (qs.length) h += `<h3>추적 중인 의뢰</h3><ul class="emList">${qs.slice(0, 3).map(x => `<li><span>${esc(x.t)}</span>${x.ok ? "<em>✓</em>" : x.p ? `<em>${esc(x.p)}</em>` : ""}</li>`).join("")}${qs.length > 3 ? `<li><em>+${qs.length - 3}</em></li>` : ""}</ul>`;
    if (st) h += `<h3>이야기 — 다음 할 일</h3><p class="emStory">${esc(st.t)}${st.p ? ` <em>${esc(st.p)}</em>` : ""}</p>`;
    if (raid && !spec && !practice) h += free ? `<p class="emLoss">지금 포기하면 받은 장비만 잃습니다 — 마지막 희망 판</p>` : `<p class="emLoss"><span>지금 포기하면 잃는 것:</span> <b class="money">${won(I.kitValue(G.kit))}</b> <span>어치</span> — <span>${ins.length ? "보험 든 것만 돌아옵니다" : "모두 두고 나옵니다"}</span></p>`;
    return h;
  };
  const emHold = function(b, ms, fn) {
    let t0 = 0, iv = 0;
    b._held = false;
    const fill = document.createElement("i");
    fill.className = "emFill";
    b.insertBefore(fill, b.firstChild);
    const stop = () => {
      t0 = 0;
      clearInterval(iv);
      iv = 0;
      b.style.setProperty("--hold", "0");
      b.classList.remove("holding");
    };
    const go = () => {
      if (t0 || b.disabled) return;
      t0 = performance.now();
      b._held = false;
      b.classList.add("holding");
      iv = setInterval(() => {
        if (!b.isConnected) {
          stop();
          return;
        }
        const f = Math.min(1, (performance.now() - t0) / ms);
        b.style.setProperty("--hold", f.toFixed(3));
        if (f >= 1) {
          stop();
          b._held = true;
          SX.input.down.clear();
          fn();
        }
      }, 30);
    };
    b.addEventListener("pointerdown", e => {
      if (e.button === 0) go();
    });
    for (const k of [ "pointerup", "pointerleave", "pointercancel", "blur" ]) b.addEventListener(k, stop);
    const isK = e => e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter";
    b.addEventListener("keydown", e => {
      if (isK(e)) {
        e.preventDefault();
        if (!e.repeat) go();
      }
    });
    b.addEventListener("keyup", e => {
      if (isK(e)) {
        e.preventDefault();
        stop();
      }
    });
  };
  U.openMenu = function() {
    const G = SX.game;
    U.menuAt = performance.now();
    clearInterval(U._emIv);
    const raid = G.state === "raid", spec = raid && !!(SX.coop && SX.coop.spec), hub = G.state === "hub";
    let saved = false;
    if (hub) {
      try {
        G.persist();
        saved = true;
      } catch (e) {}
    }
    const ins = raid ? emInsured() : [];
    U.open("menu", `<div class="win wM emWin" data-cs="note">${header(U.crumb("메뉴", esc(emWhere())))}<div class="body emBody" id="menuBody"><nav class="emNav" id="emNav"></nav><aside class="emNow" id="emNow"></aside></div></div>`);
    const nav = $("emNav");
    const btn = (t, fn, o) => {
      o = o || {};
      const b = document.createElement("button");
      b.innerHTML = `<span class="emL">${t}</span>${o.st ? `<em>${esc(o.st)}</em>` : ""}${o.key ? `<span class="emKey">${esc(o.key)}</span>` : ""}`;
      if (o.cls) b.className = o.cls;
      if (o.id) b.id = o.id;
      if (fn) b.onclick = fn;
      (o.to || nav).appendChild(b);
      return b;
    };
    const sec = t => {
      const d = document.createElement("div");
      d.className = "emSec";
      d.textContent = t;
      nav.appendChild(d);
    };
    btn("계속하기", () => U.closePanel(), {
      cls: "big",
      id: "emCont"
    });
    sec("도움");
    btn("도움말 · 규칙", () => U.openHelp(), {
      key: SX.label("help")
    });
    btn("크레디트 · 출처", () => U.openCredits());
    if (!raid) {
      sec("나 · 셸터");
      btn("캐릭터 꾸미기", () => U.openLook());
      if (hub && SX.hub.scene === "home") btn("셸터 꾸미기", () => {
        U.closePanel();
        SX.home.startDeco();
        if (SX.home.deco) {
          SX.home.deco.fromMenu = true;
          U.renderDeco();
        }
      }, {
        key: SX.label("deco")
      });
      sec("같이 · 설정");
      btn("멀티플레이", () => U.openCoop(), {
        st: SX.coop && SX.coop.on() ? SX.coop.room : "접속 안 함"
      });
    } else sec("설정");
    btn("설정", () => U.openSettings ? U.openSettings() : U.openKeys(), {
      st: "화면 · 소리 · 조작 · 접근성"
    });
    if (!raid) btn("모드", () => U.openMods(), {
      st: (SX.mods && SX.mods.list || []).length + "개"
    });
    const foot = document.createElement("div");
    foot.className = "emFoot";
    nav.appendChild(foot);
    if (spec) btn("그만 보고 결과 보기", () => {
      U.closePanel();
      SX.coop.specLeave();
    }, {
      to: foot
    }); else if (raid) {
      const giveUp = () => {
        U.closePanel();
        if (emCoop()) U.leaveHold("판 포기", () => G.giveUp()); else G.giveUp();
      };
      const b = btn("판 포기", null, {
        cls: "emDanger emHold",
        st: "길게",
        id: "emGiveUp",
        to: foot
      });
      emHold(b, 1500, giveUp);
      b.onclick = () => {
        if (b._held) return;
        if (SX.pad && SX.pad.on) {
          U.ask("판 포기", "이 판을 포기하시겠습니까? 가진 것을 잃습니다.", 0, giveUp, null, {
            yes: "포기"
          });
          return;
        }
        const h = $("emHint");
        if (h) {
          h.classList.remove("flash");
          void h.offsetWidth;
          h.classList.add("flash");
        }
      };
    } else btn("메인으로", () => {
      U.closePanel();
      if (SX.home.deco) SX.home.stopDeco();
      G.persist();
      G.state = "title";
      SX.hub.enter("home");
      $("title").classList.remove("hidden");
      $("hud").classList.add("hidden");
    }, {
      to: foot
    });
    btn("사이트로 돌아가기", () => U.askQuit(), {
      cls: "quitBtn emDanger",
      to: foot
    });
    const now = $("emNow"), h0 = emNowIn(ins);
    now.innerHTML = `${raid && !spec ? `<p class="emWarn">판은 멈추지 않습니다 — 메뉴를 연 동안에도 감염체가 다가옵니다.</p>` : ""}<div class="emNowIn" id="emNowIn">${h0}</div>` + (emCoop() ? `<p class="emHint">같이 하는 판 — 판 포기 · 게임 종료는 그 자리에서 10초 버텨야 됩니다</p>` : "") + `<p class="emHint" id="emHint">${raid && !spec ? "판 포기는 1.5초 길게 눌러야 됩니다" : `<span class="emKey">${esc(SX.label("menu"))}</span> <span>계속하기</span> <span class="emKey">${esc(SX.label("help"))}</span> <span>도움말</span>`}</p>` + `<p class="emVer">${esc(SX.BUILD || "")}${saved ? " · <span>저장됨</span>" : ""}</p>`;
    $("emNowIn")._h = h0;
    if (raid && !spec) U._emIv = setInterval(() => {
      const el = $("emNowIn");
      if (U.panelKind !== "menu" || !el) {
        clearInterval(U._emIv);
        return;
      }
      const h = emNowIn(ins);
      if (el._h !== h) {
        el._h = h;
        el.innerHTML = h;
      }
    }, 500);
    const c = $("emCont");
    if (c) try {
      c.focus({
        preventScroll: true
      });
    } catch (e) {}
  };
  U.leaveHold = function(what, fn) {
    if (U.leaveStop) U.leaveStop();
    const p = A.player;
    if (!p) {
      fn();
      return;
    }
    const MS = 1e4, t0 = performance.now(), x0 = p.x, y0 = p.y, f0 = p.floor, quit = what === "게임 종료";
    const el = document.createElement("div");
    el.id = "leaveHold";
    el.innerHTML = `<div class="lhBox"><div class="lhT">${quit ? "게임 종료" : "판 포기"}</div><div class="lhN" id="lhN">10</div><div class="lhBar"><i id="lhFill"></i></div>\n      <p class="lhP">그 자리에서 버티십시오 — 판은 멈추지 않고 캐릭터는 맞을 수 있습니다. 움직이면 취소됩니다.</p><button class="lhNo" id="lhNo">취소</button></div>`;
    document.body.appendChild(el);
    let iv = 0;
    const end = (ok, msg) => {
      clearInterval(iv);
      removeEventListener("keydown", onKey, true);
      el.remove();
      U.leaveStop = null;
      if (msg) SX.log(msg, "warn");
      if (ok) fn();
    };
    const onKey = e => {
      if (e.code === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        end(false, quit ? "게임 종료를 취소했습니다" : "판 포기를 취소했습니다");
      }
    };
    addEventListener("keydown", onKey, true);
    $("lhNo").onclick = () => end(false, quit ? "게임 종료를 취소했습니다" : "판 포기를 취소했습니다");
    iv = setInterval(() => {
      const q = A.player;
      if (SX.game.state !== "raid" || q !== p || !q.alive) return end(false);
      if (Math.hypot(q.x - x0, q.y - y0) > SX.TS * .5 || q.floor !== f0) return end(false, quit ? "움직여서 게임 종료를 취소했습니다" : "움직여서 판 포기를 취소했습니다");
      const left = Math.max(0, MS - (performance.now() - t0)), n = $("lhN"), f = $("lhFill");
      if (n) n.textContent = Math.ceil(left / 1e3);
      if (f) f.style.width = ((1 - left / MS) * 100).toFixed(1) + "%";
      if (left <= 0) end(true);
    }, 100);
    U.leaveStop = () => end(false);
  };
  addEventListener("keydown", e => {
    if (e.code !== "F8") return;
    const t = e.target, tg = t && t.tagName;
    if (e.repeat || e.isComposing || tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT" || t && t.isContentEditable) return;
    e.preventDefault();
    if (U.asking() || U.panelKind === "feedback" || U.panelKind === "result" || U.panelKind === "wipe" || !U.openFeedback) return;
    if (U.isOpen() && U.panelKind !== "menu") U.closePanel();
    U.openFeedback({});
  });
  U.askQuit = function() {
    const G = SX.game, mid = G.state === "raid" && !(SX.raid && SX.raid.tutMode) && !(SX.coop && SX.coop.spec), free = mid && !!(SX.free && SX.free.on && SX.free.on());
    const facts = mid ? `<span class="askFacts">${[ "10분 안에 다시 켜시면 이 판으로 돌아옵니다.", "더 늦으면 의식을 잃은 것으로 처리됩니다.", free ? "그러면 받은 장비만 잃습니다." : "그러면 보험 든 장비만 돌아옵니다." ].concat(emCoop() ? [ "같이 하는 판이라 그 자리에서 10초 버틴 뒤에 꺼집니다." ] : []).map(t => `<span><i>▶</i>${t}</span>`).join("")}</span>` : "";
    U.ask("게임 종료", facts, 0, () => {
      if (emCoop()) U.leaveHold("게임 종료", () => U.quitGame()); else U.quitGame();
    }, null, {
      yes: "종료",
      q: mid ? "판 도중입니다. 정말 끄시겠습니까?" : "정말 종료하시겠습니까?",
      safe: true
    });
  };
  U.quitGame = function() {
    const G = SX.game;
    U.closePanel();
    try {
      if (SX.home.deco) SX.home.stopDeco();
    } catch (e) {}
    try {
      G.persist();
    } catch (e) {}
    try {
      if (SX.raid && SX.raid.snapSave) SX.raid.snapSave();
    } catch (e) {}
    const go = () => {
      const app = window.seoulApp;
      if (app && typeof app.quit === "function") {
        app.quit();
        return;
      }
      try {
        window.close();
      } catch (e) {}
      setTimeout(() => location.replace("bye.html" + (SX.lang === "en" ? "?lang=en" : "")), 300);
    };
    if (SX.net && SX.net.q) {
      U.quitThanks();
      setTimeout(go, U.QUIT_THANKS_MS);
      return;
    }
    go();
  };
  U.QUIT_THANKS_MS = 5e3;
  U.quitThanks = function() {
    let el = document.getElementById("quitThanks");
    if (!el) {
      el = document.createElement("div");
      el.id = "quitThanks";
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="qtIn"><p class="qt1">게임을 있는 그대로 즐겨 주세요.</p><p class="qt2">감사합니다.</p></div>`;
    el.classList.add("on");
  };
  let spillSeen = null;
  U.spillNote = function(lr) {
    if (!lr || !lr.spill || spillSeen === lr.id) return;
    spillSeen = lr.id;
    const t = "돌아오는 길에 넘어지면서 가방이 열렸습니다", s = "챙긴 물건을 거의 다 흘리고 셸터에 왔습니다";
    SX.log("🎒 " + t + " — " + s, "bad");
    U.bigNote(t, s, 6e3);
    const rs = document.querySelector("#panel .win.result .body");
    if (rs) rs.insertAdjacentHTML("beforeend", `<p class="bad spillLine">${esc(t)} — ${esc(s)}</p>`);
  };
  const modReload = () => {
    try {
      SX.game.persist();
    } catch (e) {}
    const go = () => location.reload();
    if (SX.net && SX.net.on && SX.net.on()) Promise.resolve(SX.net.push(true)).finally(() => setTimeout(go, 150)); else setTimeout(go, 150);
  };
  U.openMods = function(msg) {
    const M = SX.mods;
    if (!M) {
      U.open("mods", `<div class="win optWin">${header("모드")}<div class="body"><p>모드를 불러오지 못했습니다.</p></div></div>`);
      return;
    }
    const inRaid = SX.game.inRaid && SX.game.inRaid();
    const row = r => {
      const v = M.verdict(r), m = r.man;
      return `<div class="modRow${r.on ? " on" : ""}"><div class="mrHead"><button data-mtog="${esc(r.id)}" class="${r.on ? "on" : ""}" data-alt="${r.on ? "끔" : "켬"}" ${inRaid ? "disabled" : ""}>${r.on ? "켬" : "끔"}</button><b>${esc(m.name)}</b><span class="small">${esc([ m.author, m.ver ].filter(Boolean).join(" · "))}</span><button data-mdel="${esc(r.id)}" class="dim" ${inRaid ? "disabled" : ""}>빼기</button></div>\n        ${m.desc ? `<p class="small">${esc(m.desc)}</p>` : ""}\n        ${v.affect ? `<p class="bad mrV">⚠ 플레이에 영향을 줍니다 — ${v.why.map(esc).join(" · ")}</p><p class="small">켜고 하시면 다른 분들과 만날 수 없고, 탈출할 때 챙긴 물건을 거의 다 흘립니다.</p>` : `<p class="good mrV">✔ 꾸밈만 바꿉니다 — 그대로 쓰셔도 됩니다</p>`}\n        ${(v.info || []).concat(r.notes || []).slice(0, 8).map(t => `<p class="small dim">${esc(t)}</p>`).join("")}</div>`;
    };
    const qm = U.qm("모드로 그림 · 소리 · 수치를 바꿀 수 있습니다.<br>플레이에 영향을 주는 모드(사람 · 벽이 비쳐 보임 · 수치 바꾸기 · 적 소리 크기 바꾸기)도 켤 수 있습니다.<br>다만 그런 모드를 켜고 하시면 다른 분들과 만날 수 없고, 탈출할 때 챙긴 물건을 거의 다 흘립니다.<br>켜거나 끄면 게임을 다시 불러옵니다(진행은 저장됩니다). 모드는 이 브라우저에만 들어갑니다.");
    const off = inRaid || !M.ok ? "disabled" : "", empty = !M.list.length;
    U.open("mods", `<div class="win wM optWin modsWin">${header(`모드<span class="crumb">그림 · 소리 · 수치를 바꿉니다 ${qm}</span>`)}<div class="body col">\n      ${msg ? `<p class="${msg.bad ? "bad" : "good"}">${esc(msg.t)}</p>` : ""}\n      ${inRaid ? `<p class="warn">판 중엔 모드를 켜고 끌 수 없습니다 — 셸터에서 해 주십시오.</p>` : ""}\n      ${empty ? `<div class="modEmpty">넣은 모드가 없습니다.</div>\n      <div class="modSteps">\n        <div class="modStep"><b>1 · 원본 꺼내기</b><p>게임 그림과 소리 이름 목록을 받습니다.</p><div class="msBtns"><button data-mexp>원본 그림 꺼내기</button><button data-msnd class="dim">소리 이름 목록 받기</button></div></div>\n        <div class="modStep"><b>2 · 고쳐 그리기</b><p>받은 그림을 같은 크기로 고쳐 그립니다.</p><div class="msBtns"><button data-mhow class="dim">만드는 법</button></div></div>\n        <div class="modStep"><b>3 · 넣고 켜기</b><p>폴더를 고르면 목록에 들어옵니다. 켜면 다시 불러옵니다.</p><div class="msBtns"><button data-madd ${off}>모드 넣기(폴더 고르기)</button></div></div>\n      </div>\n      <div class="modLegend"><p class="good">✔ 꾸밈만 — 그대로 쓰셔도 됩니다</p><p class="bad">⚠ 플레이에 영향 — 다른 분들과 못 만나고, 탈출할 때 물건을 거의 다 흘립니다</p></div>` : `<div class="modList">${M.list.map(row).join("")}</div>`}\n      <input type="file" id="modPick" webkitdirectory multiple style="display:none">\n    </div>${empty ? "" : U.foot(`<button data-mexp>원본 그림 꺼내기</button><button data-msnd>소리 이름 목록 받기</button><button data-mhow>만드는 법</button>`, `<button data-madd class="big" ${off}>모드 넣기(폴더 고르기)</button>`)}</div>`);
    const body = $("panel");
    const pick = $("modPick");
    pick.onchange = async () => {
      const r = await M.add(pick.files);
      U.openMods(r.ok ? {
        t: "「" + r.rec.man.name + "」을(를) 넣었습니다 — [끔]을 누르면 켜집니다"
      } : {
        t: r.msg,
        bad: true
      });
      if (r.ok && SX.kitck) SX.kitck.modAdded(r.rec);
    };
    body.querySelector("[data-madd]").onclick = () => pick.click();
    body.querySelector("[data-mexp]").onclick = () => U.openModExport();
    body.querySelector("[data-mhow]").onclick = () => U.openModHow();
    body.querySelector("[data-msnd]").onclick = () => M.download("소리_이름_목록.txt", new Blob([ "\ufeff소리 이름\t갈래\n" + M.soundList() ], {
      type: "text/plain;charset=utf-8"
    }));
    for (const b of body.querySelectorAll("[data-mtog]")) b.onclick = () => {
      const r = M.list.find(x => x.id === b.dataset.mtog);
      if (!r) return;
      if (r.on) {
        M.setOn(r.id, false).then(modReload);
        return;
      }
      const v = M.verdict(r);
      if (v.affect && SX.kitck) SX.kitck.modOn(r, v, () => M.setOn(r.id, true).then(modReload)); else if (v.affect) U.ask("모드 켜기", `「${esc(r.man.name)}」은(는) 플레이에 영향을 줍니다.<br>${v.why.map(w => "· " + esc(w)).join("<br>")}<br><br>켜고 하시면 코드를 고친 것과 똑같이 다른 분들과 만날 수 없고, 탈출할 때 챙긴 물건을 거의 다 흘립니다.`, 0, () => M.setOn(r.id, true).then(modReload), null, {
        yes: "그래도 켜기",
        q: "켜시겠습니까?"
      }); else M.setOn(r.id, true).then(modReload);
    };
    for (const b of body.querySelectorAll("[data-mdel]")) b.onclick = () => {
      const r = M.list.find(x => x.id === b.dataset.mdel);
      if (!r) return;
      U.ask("모드 빼기", `「${esc(r.man.name)}」을(를) 이 브라우저에서 뺍니다.`, 0, () => {
        const was = r.on;
        M.remove(r.id).then(() => was ? modReload() : U.openMods({
          t: "뺐습니다"
        }));
      }, null, {
        yes: "빼기",
        q: "빼시겠습니까?"
      });
    };
  };
  U.openModExport = function(q) {
    const M = SX.mods, L = M.seen(q || "").slice(0, 160), FAM = {
      body: "사람",
      wall: "벽 · 문",
      deco: "꾸밈"
    };
    U.open("mods", `<div class="win optWin modsWin" style="min-width:calc(var(--u)*260)">${header("원본 그림 꺼내기")}<div class="body col">\n      <p class="small">지금까지 화면에 나온 그림만 보입니다. 셸터 · 판을 돌아다닌 뒤 다시 여시면 더 나옵니다. 받은 그림을 같은 크기로 고쳐 그린 뒤 mod.json 의 "그림"에 이름과 파일을 적으시면 됩니다. 이름에 * 를 쓰면 여러 그림을 한 번에 바꿉니다.</p>\n      <div class="row" style="gap:calc(var(--u)*2)"><input id="mxQ" placeholder="이름 찾기(* 가능)" value="${esc(q || "")}" style="flex:1"><button data-mxgo>찾기</button><button data-mxjson>mod.json 견본 받기</button><button data-mxback class="dim">뒤로</button></div>\n      <div class="modExp">${L.length ? L.map((o, i) => `<div class="mxRow"><canvas data-mxi="${i}" width="${o.c.width}" height="${o.c.height}"></canvas><code>${esc(o.key)}</code><span class="small">${FAM[o.fam]} · ${o.c.width}×${o.c.height}</span><button data-mxk="${i}">받기</button></div>`).join("") : `<p class="dim">맞는 그림이 없습니다.</p>`}</div>\n    </div></div>`);
    const body = $("panel");
    for (const cv of body.querySelectorAll("canvas[data-mxi]")) {
      const o = L[+cv.dataset.mxi];
      if (SX.art.OFF) SX.art.OFF.add(cv);
      try {
        cv.getContext("2d").drawImage(o.c, 0, 0);
      } catch (e) {}
    }
    for (const b of body.querySelectorAll("[data-mxk]")) b.onclick = () => M.exportPng(L[+b.dataset.mxk].key);
    body.querySelector("[data-mxgo]").onclick = () => U.openModExport($("mxQ").value.trim());
    $("mxQ").onkeydown = e => {
      if (e.key === "Enter") U.openModExport($("mxQ").value.trim());
    };
    body.querySelector("[data-mxjson]").onclick = () => M.download("mod.json", new Blob([ M.sampleJson(L.map(o => o.key)) ], {
      type: "application/json"
    }));
    body.querySelector("[data-mxback]").onclick = () => U.openMods();
  };
  U.openModHow = function() {
    U.open("mods", `<div class="win optWin modsWin readWin" style="min-width:calc(var(--u)*260)">${header("모드 만드는 법")}<div class="body col help">\n      <p>모드는 폴더 하나입니다. 폴더 맨 위에 <b>mod.json</b> 을 두고, 그림(png)과 소리(ogg · mp3 · wav)를 함께 넣습니다. [모드 넣기]에서 그 폴더를 고르시면 됩니다.</p>\n      <pre class="modPre">{\n  "이름": "어두운 셸터",\n  "만든이": "닉네임",\n  "버전": "1.0",\n  "설명": "벽지와 소파 색을 바꿉니다",\n  "그림": { "pbarrel:*": "barrel.png" },\n  "소리": { "door_open": ["door1.ogg", "door2.ogg"] },\n  "수치": {},\n  "가구": [{ "이름": "낡은 의자", "그림": "chair.png", "칸": [1, 1] }]\n}</pre>\n      <ul>\n        <li><b>그림</b> — 이름은 [원본 그림 꺼내기]에 나오는 이름입니다. 받은 원본과 같은 크기로 그리시면 됩니다.</li>\n        <li><b>소리</b> — 이름은 [소리 이름 목록 받기]에 있습니다. 목록에 없는 이름은 새 소리로 들어갑니다.</li>\n        <li><b>수치</b> — "표/이름/칸": 값 (표: 총 · 근접 · 물건 · 탄창 · 건물 · 용병 · 방어구). 수치를 바꾸면 플레이에 영향이 있는 모드가 됩니다.</li>\n        <li><b>가구</b> — 이름 · 그림 · 칸(가로, 세로 — 한 칸은 32도트). 그림은 가로 = 칸 수 × 32 로 그리고, 위로 솟은 만큼 세로를 늘리시면 됩니다. 벽에 거는 것은 "벽": true, 바닥 깔개는 "바닥": true. 가구점 「모드」에 0원으로 나오고 꾸미기로 놓습니다(꾸밈만 — 수납 · 값 · 효과는 없습니다).</li>\n        <li>코드 파일(.js)은 읽지 않습니다 — 남의 모드가 계정 열쇠를 가져가지 못하게 하기 위해서입니다. 그림 · 소리 · 수치는 그대로 씁니다.</li>\n      </ul>\n      <p><b>플레이에 영향을 주는 것</b> — 켤 수는 있지만, 켜고 하시면 다른 분들과 만날 수 없고 탈출할 때 챙긴 물건을 거의 다 흘립니다.</p>\n      <ul>\n        <li>사람(나 · 적 · 동료 · 들개) 그림이 원래보다 비쳐 보이거나, 밝기가 크게 달라짐</li>\n        <li>벽 · 문 그림이 비쳐 보임</li>\n        <li>총소리 · 발소리 · 적 소리 · 문 · 함정 소리를 거의 안 들리게 하거나, 크기를 크게 바꿈</li>\n        <li>수치를 바꿈</li>\n      </ul>\n      <p class="small">부딪힘 · 시야 · 숨는 곳은 늘 원래 그림으로 정해집니다 — 그림 모드로는 걷는 길이나 숨는 곳이 바뀌지 않습니다.</p>\n      <div class="row"><button data-mxback>뒤로</button></div>\n    </div></div>`);
    $("panel").querySelector("[data-mxback]").onclick = () => U.openMods();
  };
  U.openCredits = function() {
    const url = u => `<br><span class="crUrl">${u}</span>`;
    U.open("credits", `<div class="win optWin credWin readWin" style="min-width:calc(var(--u)*260)">${header("크레디트 · 출처")}<div class="body col help">\n      <h3>출처를 밝혀야 하는 자료</h3>\n      <ul>\n        <li><b>글꼴: 갈무리(Galmuri)</b> — Copyright © 2019–2025 Lee Minseo · SIL Open Font License 1.1. 라이선스 전문은 글꼴과 함께 들어 있습니다.${url("https://github.com/quiple/galmuri")}</li>\n      </ul>\n      <h3>고맙게 쓴 무료 자료</h3>\n      <p class="small">출처를 밝히지 않아도 되는 자료이지만 고마운 마음으로 적습니다.</p>\n      <ul>\n        <li><b>Sonniss GDC Game Audio Bundle</b> — 효과음과 배경 소리 대부분${url("https://sonniss.com/gameaudiogdc")}</li>\n        <li><b>BigSoundBank</b> — Joseph Sardin(버스 경적 #3594 는 Joseph Sardin &amp; Axeline T.) · CC0 · 발전기 · 셔터 · 경보 같은 효과음${url("https://bigsoundbank.com")}</li>\n        <li><b>Versilian Studios</b> — VCSL · VSCO 2 Community Edition · CC0 · 배경 음악 악기${url("https://github.com/sgossner/VCSL")}${url("https://github.com/sgossner/VSCO-2-CE")}</li>\n        <li><b>FreePats</b> — 업라이트 피아노 · 나일론 기타 · CC0${url("https://freepats.zenvoid.org")}</li>\n        <li><b>Freesound</b> — CC0 녹음: 14GPanskaMuzatko_Matej · AlfredHitch · AugustSandberg · carroll27 · dansotak · drooler · felix.blume · greatsoundstube · insanity54 · Joao_Janz · jemburyturner · KrystianPawlowski · michorvath · Mrthenoronha · MWsfx · nataliedmc · nicotep · Nox_Sound · shelbyshark · SukritSen · TampaJoey · vabadus · CC0${url("https://freesound.org")}</li>\n      </ul>\n    </div></div>`);
  };
  function keyTable(readOnly) {
    return `<div class="keys">` + SX.KEY_ACTIONS.map(([id, name]) => `<span>${esc(name)}</span><span>${(SX.keys[id] || []).map((c, k) => readOnly ? `<b>${esc(SX.keyLabel(c))}</b>` : `<button data-key="${id}" data-slot="${k}">${esc(SX.keyLabel(c))}</button>`).join(" ")}${readOnly ? "" : ` <button data-key="${id}" data-slot="${(SX.keys[id] || []).length}" class="dim">+</button>`}</span>`).join("") + `</div>`;
  }
  {
    const hb = document.getElementById("hudHelp");
    if (hb) hb.onclick = () => {
      SX.audio && SX.audio.play("click");
      if (U.panelKind === "help") U.closePanel(); else U.openHelp();
    };
  }
  U.openHelp = function() {
    const K = id => `<b>[${esc(SX.label(id))}]</b>`;
    const S = [];
    const SI = [];
    const sec = (t, items) => (SI.push(items), `<h3 id="helpS${S.push(t) - 1}">${esc(t)}</h3><ul>` + items.map(s => `<li>${s}</li>`).join("") + `</ul>`);
    const body = sec("처음 시작", [ `<b>서울탈출</b>은 무너진 서울에서 건물에 들어가 쓸 만한 물건을 챙겨 <b>살아 나오는</b> 게임입니다. 챙겨 온 물건을 팔아 돈을 모으고, 셸터(내 집)를 넓히고 꾸미며, 마지막에는 헬기로 서울을 떠나는 것이 목표입니다.`, `<b>하루 흐름</b>: 셸터에서 채비 → 문을 나서 도심 지도 → 건물을 골라 출격 → 물건을 챙겨 출구로 탈출 → 장터에서 팔고 사기 → 셸터를 짓고 꾸미기. 이것을 되풀이하시면 됩니다.`, `처음에는 <b>튜토리얼</b>(약 10분)부터 합니다. 빌린 장비로 하니 끝나면 내 장비는 그대로입니다. 한 단계에서 오래 막히면 그 단계만 넘길 수 있고, 다시 하려면 연습장에서 [튜토리얼]을 고르시면 됩니다.`, `첫 출격 전에 <b>연습장</b>을 한 번 다녀오셔야 출격이 열립니다(탈출하거나 잠시 둘러보면 됩니다). 연습장은 적이 적고 가스가 없으며, 의식을 잃어도 장비를 잃지 않습니다.`, `처음 몇 판 동안은 화면에 다음 할 일(걷기 · 가방 · 출격 · 뒤지기 · 사격 · 치료 · 출구 · 브로커에 팔기)이 차례로 뜹니다. [끄기]로 끄고, 메뉴의 「처음 안내」로 다시 켭니다. 처음 세 판에는 출구가 크게 표시됩니다.`, `처음 가진 것은 30만 원, 사제 파이프 권총 · 식칼 · 천 가방 · 기본 리그, 보관함의 9mm 탄창 두 개 · 붕대 · 진통제입니다. 첫 집은 고시원입니다.`, `${K("terminal")} <b>생존 단말기</b>: [상태](몸 · 돈 · 능력치 · 숙련 · 훈련) · [지도] · [이야기] · [의뢰] · [기록] · [순위] · [조작]이 있습니다. 헬기로 떠난 뒤에는 [회차], 셸터가 더러우면 [집 청소]도 생깁니다.`, `${K("help")} 이 도움말을 엽니다. 창마다 제목 옆 [?]를 누르시면 그 창의 자세한 설명이 나옵니다.` ]) + sec("판(출격)", [ `셸터 출격 지도나 시장에서 건물을 고르시면 됩니다. 씨앗은 판마다 다르고, 낮 · 밤은 시계를 따라 바뀝니다.`, `<b>건물</b>: 처음엔 연립주택과 연습장만 열려 있습니다. 이야기 임무를 하면 사무동 · 고등학교 · 상가 · 터미널 · 한강 다리 · 종합병원 · 군부대가 차례로 열리고, 지하철 터널 · 재개발 공사장은 곁가지 이야기로 열립니다. 잠긴 건물을 누르면 무엇을 하면 열리는지 알려 줍니다.`, `건물마다 위험 이름표(적막 · 위험 · 아수라장 · 지옥)가 붙어 있습니다. 위험한 건물일수록, 그리고 위층일수록 좋은 물건이 많습니다. 터미널 · 지하철 터널은 늘 어둡습니다.`, `<b>낮과 밤</b>: 고르지 않습니다 — 서버 시계를 따라 모든 사람이 같이 바뀝니다(${todRule()}). 판의 낮 · 밤은 들어갈 때 정해져 판 안에서는 바뀌지 않습니다. 출격 지도에 지금 낮인지 밤인지와 바뀌기까지 남은 분이 나옵니다. 낮은 밝지만 멀리서도 눈에 띕니다. 밤은 손전등 없이는 거의 안 보이지만 적도 늦게 알아챕니다.`, `나가는 길: 1층 출입문 · 옥상 집라인 · 완강기 · 구조 신호탄. 가스가 아래층부터 차오르니 시간을 잘 보십시오.`, `<b>1층 출입문은 들어오고 75초 뒤 잠깁니다</b>(20초 전에 「바깥이 소란스럽습니다」가 뜹니다). 그 뒤에는 위로 올라가 옥상 집라인이나 완강기(위층 바깥 벽 — 판 시작 때 몇 층인지 알려 줍니다)로 나가셔야 합니다. 출구 자리는 판마다 바뀌고, ${K("terminal")} 지도에서 초록이 출구입니다.`, `출구에서는 잠깐 서 있어야 나가집니다 — 문 3초 · 집라인 5초(폭풍이면 7초) · 완강기 6초. 구조 신호탄은 어디서든 5초 뒤 구조되지만 소리가 커서 적이 몰려옵니다(약재상 · 아주 비쌈).`, `한강 다리 · 지하철 터널 · 재개발 공사장은 바깥 지도입니다. 가스가 훨씬 천천히 차고, 들어온 쪽이 막히면 반대쪽 끝(검문소 · 비상 사다리 · 뒷문)으로 나갑니다.`, `가스 속에 있으면 체력이 계속 닳습니다. 옥상은 가스가 차지 않습니다.`, `의식을 잃으면 들고 있던 것을 모두 두고 옵니다(보험 든 장비는 보관함으로). 창을 닫고 10분 안에 안 돌아오면 의식을 잃은 것으로 칩니다.`, `${K("interact")} 줍기·뒤지기·문(이 키로 연 창 · 운동 · 낚시는 같은 키로 다시 닫고 그만둡니다) · ${K("inventory")} 가방(판 안에선 곁의 시신·바닥 더미도 같이) · ${K("reload")} 재장전 · ${K("heal")} 회복약 · ${K("crouch")} 앉기 · ${K("light")} 손전등`, `우클릭 조준 사격(안 누르고 쏘면 지향 사격) — 저격총은 조준 시야가 넓습니다. 적은 한 번에 셋까지만 덤빕니다. 옥상엔 두목 무리가 있습니다.`, `<b>적</b>: 감염체(빠른 들개 · 몸집 큰 덩치 · 몸통이 단단한 방호복 · 기어 오는 것)와 총을 든 약탈자가 있습니다. 덩치는 잠긴 문도 부수고, 군부대 · 다리 · 공사장에는 저격수가 많습니다. 판의 반쯤은 중간층 어딘가에 <b>이름난 두목</b>이 있습니다.`, `<b>열쇠 방</b>: 판마다 방 하나가 잠겨 있고 안에 금고가 있습니다. 그 건물 열쇠로 열고, 열쇠마다 쓸 수 있는 횟수가 정해져 있습니다.`, `<b>날씨</b>: 맑음 · 비 · 안개 · 폭풍. 안개는 바깥 시야가 좁아집니다(적도 마찬가지). 폭풍은 발소리 · 총소리가 묻히고 번개가 눈부시며, 바깥에서 총이 흔들립니다.`, `<b>정보</b>(시장 [출격 준비] 탭): 건물 하나의 「알짜 층」을 알려 주고, 다음 한 판 동안 그 층에 물건이 더 많습니다. 어려운 건물일수록 비쌉니다.`, `<b>마지막 희망 판</b>: 도심 지도에서 [🎒 마지막 희망] — 받은 싸구려 장비(권총 · 탄 조금 · 붕대 · 칼 · 리그 · 가끔 가방)로 나갑니다. 내 장비와 보관함은 셸터에 그대로 둡니다. 살아 나오면 들고 나온 것은 전부 보관함으로, 의식을 잃으면 받은 장비만 없어집니다. 보험은 없고, 한 번 다녀오면 ${SX.free ? Math.round(SX.free.COOL_MS / 6e4) : 20}분 쉽니다. 마지막 판(헬기장) · 연습장은 안 됩니다. 파티장이 누르면 파티원도 각자 받은 장비로 같이 갑니다.`, `<b>판 상황</b>: 판의 반쯤은 무슨 일이 있습니다 — 감염 확산 · 약탈자 떼 · 정전 · 가스 누출 · 조용한 날 · 보급 낙하(옥상 집라인 근처 군 보급 상자) · 계단 봉쇄(비상계단 열쇠를 찾아야 합니다). 판 시작 로그와 오른쪽 위 시간 줄에 뜹니다.`, `${K("chat")} <b>무전 기록</b>: 지나간 알림 40줄과 판에 들어올 때의 「오늘 상태」(건물 · 낮밤 · 날씨 · 판 상황 · 정보)를 다시 봅니다 — 판은 멈추지 않습니다. 셸터 · 장터 등 거점에서는 같은 키로 말을 겁니다 — 위 칸에서 친구 · 파티 · 전체를 고르고(120자 · Enter 보내기 · Esc 그만), 한 말은 머리 위 말풍선으로도 뜹니다. 판 안에서는 같은 팀에게만 말합니다. 오른쪽 위 손잡이를 끌면 창 크기를 바꿀 수 있습니다.`, `<b>결과 창</b>: 걸린 시간 · 처치 수 · 들고 나온 값이 나옵니다. 의식을 잃었다면 「의식을 잃은 까닭」(누가 · 무엇으로 · 어디를 맞았는지 · 방어구가 막은 피해)을 보여 줍니다. 판이 쉬웠는지 어려웠는지 눌러 알려 주실 수도 있습니다.` ]) + sec("전술", [ `<b>엿보기</b>: 벽 · 기둥 · 철판 가림막의 모서리에 붙어 서면 몸은 숨긴 채 너머가 보입니다. 복도 끝에 붙으면 양옆이 함께 보입니다. 달리는 중에는 안 됩니다.`, `<b>엄폐</b>: 모래주머니 · 방호벽 · 상자 · 책상 같은 낮은 것에 붙어 ${K("crouch")} 로 앉으면, 그 너머의 적에게 안 보이고 넘어오는 총알도 거의 막힙니다. 일어서면 넘겨 쏩니다. 2칸 안까지 다가온 적에게는 들킵니다.`, `<b>소리</b>: 달리면 발소리가 커지고, ${K("quiet")} 조용히 걷기 · ${K("crouch")} 앉기는 조용합니다. 총소리는 멀리 퍼지고(소음기를 달면 훨씬 덜 퍼집니다), 근접 공격은 소리가 거의 나지 않습니다.`, `${K("brick")} <b>벽돌</b>: 던져서 떨어진 자리의 소리로 적을 꾀어냅니다. 던지는 법은 투척물과 같습니다.`, `${K("box")} <b>종이상자</b>: 가진 종이상자를 뒤집어씁니다. 멈춰 있으면 거의 안 보입니다. 같은 키로 벗습니다.`, `${K("ping")} <b>핑</b>: 조준한 곳(또는 지도에서 누른 곳)에 표시를 찍어 방향과 거리를 봅니다. 세 개까지 찍고, 같은 자리를 다시 찍으면 지웁니다.`, `${K("light")} <b>손전등</b>은 켜면 잘 보이지만 적 눈에도 잘 띕니다. ${K("nvg")} <b>야간 투시경</b>은 어둠 속을 보여 줍니다 — 전지는 8분이고 출격할 때마다 다시 찹니다. 켜 둔 채 섬광탄을 맞으면 더 오래 눈이 멉니다.`, `<b>사격</b>: 조준 사격이 덜 퍼지고 급소에 잘 맞습니다. 움직이거나 연달아 쏘면 조준점이 벌어집니다. 리그에 든 탄창으로 갈면 재장전이 두 배 빠릅니다.`, `<b>탄 종류</b>: 철갑탄은 방탄을 잘 뚫는 대신 맨몸엔 조금 약합니다(군부대에서 잘 나옴). 할로포인트는 맨몸에 세고 방탄에 약합니다(상가 · 터미널에서 잘 나옴). 산탄총은 할로포인트 대신 슬러그가 있습니다.`, `<b>섬광탄</b>: 터지면 보이는 곳의 약탈자는 5초쯤, 감염체는 2초쯤 아무것도 못 합니다. 던진 쪽을 보고 있으면 나도 눈이 멉니다 — 등지십시오.`, `<b>최루탄</b>: 14초 동안 연기가 납니다. 연기 속 약탈자는 기침하며 못 쏘고 물러납니다. 감염체에게는 안 듣습니다. 나도 들어가면 조준이 흔들리고 기침 소리에 적이 옵니다.`, `<b>연막탄</b>: 18초 동안 짙은 연기가 시야를 끊습니다. 적은 연기 너머를 못 보니 못 쏩니다 — 길을 건너거나 물러날 때 쓰십시오. 나도 연기 너머는 안 보이고, 총알은 지나갑니다.`, `<b>던지는 법</b>: ${K("grenade")} 를 누르면 투척물을 손에 쥡니다(누를 때마다 다음 종류 · 단축 칸이나 가방 우클릭으로도). <b>좌클릭을 누르고 있으면</b> 날아갈 길과 떨어질 자리가 보이고, 마우스로 방향과 거리를 맞춘 뒤 <b>놓으면 던집니다</b>. 누른 채 우클릭하면 취소, 무기 키를 누르면 집어넣습니다. 벽돌(${K("brick")})도 같습니다. 밀수꾼이 팝니다.`, `<b>덫 놓기</b>: 인계철선 키트 · 곰덫을 가방 우클릭이나 단축 칸으로 쓰면 2초 동안 앉아 발밑에 놓습니다(움직이거나 맞으면 그만둡니다). 줄은 바라보는 쪽과 직각으로 양옆 빈칸까지 뻗습니다(최대 3칸). 감염체 · 약탈자 모두 걸리고 쓰러뜨린 몫은 놓은 사람 것입니다. 나와 우리 편에게는 보이지만 똑같이 걸리니 줄은 ${K("quiet")} 조용히 넘고 덫은 밟지 마십시오. 놓은 덫 앞에서 ${K("interact")} 로 다시 챙깁니다. 판의 함정도 풀면 물건으로 챙깁니다. 밀수꾼 · 무기상 · 군용 상자 · 사물함에서 구합니다.`, `<b>뒤에서 몰래 처치</b>: 나를 못 알아챈 적(쫓는 중이 아닌)의 등 뒤에 근접 거리로 붙으면 그 적 위에 <b>몰래 처치</b> 안내가 뜹니다 — 그때 ${K("melee")} 근접 공격이면 한 번에 쓰러뜨립니다(두목 · 이름난 두목 · 덩치는 체력의 절반). ${K("quiet")} 조용히 걷거나 ${K("crouch")} 앉아서 바로 뒤로 다가가면 곁까지 알아채지 못하고, 희미한 소리에는 잠깐 멈칫한 뒤 돌아봅니다. 손전등은 끄십시오.` ]) + sec("가방 · 물건", [ `<b>작은 삼각형</b>(칸 왼쪽 위)은 지금 쓸 데가 있는 물건입니다 — 금빛: 의뢰 · 이야기 · 서울 탈출 작전 · 설비 / 하늘빛: 만들기 재료. 마우스를 올리면 어디에 몇 개 쓰는지 나오고, 팔아서 모자라게 되면 한 번 묻습니다. 설정 › 화면 「임무 물건 표시」로 끕니다.`, `방탄복 · 방탄모 · 총 · 가방에 마우스를 올리면 지금 낀 것과 견주어 보여 줍니다.`, `<b>끌어 놓기</b>로 옮깁니다. 찬 자리에 놓으면 걸리는 게 하나뿐일 때 밀어냅니다. R 로 돌립니다.`, `<b>Shift+클릭</b> 빠른 이동: 상자·보관함 → 내 장비(빈 장착 칸이면 장착) · 내 물건 → 열린 상자·보관함 · 아무것도 안 열려 있으면 장착 또는 리그↔가방. 브로커 창에선 바로 팔기.`, `<b>우클릭</b>: 총은 탄 빼기(탄창으로), 약·억제약·신호탄·수류탄은 쓰기. 총을 누르면 파츠 창.`, `<b>가방 접기</b>: 빈 가방을 우클릭하면 접혀 칸을 덜 차지합니다(배낭 2×3 → 2×1 · 긴 가방 2×3 → 1×2 · 천 가방 · 작은 가방 2×2 → 1×1). 다시 우클릭하면 폅니다 — 펼 자리가 있어야 합니다. 접은 가방엔 아무것도 못 넣고, 가방 칸에 메면 저절로 펴집니다. 리그 · 조끼는 안 접힙니다.`, `탄창은 덜 찬 것끼리 합쳐집니다. 탄창을 <b>우클릭</b>하면 반씩 나뉩니다(나눈 것은 저절로 안 합쳐지고, 끌어다 부으면 다시 합쳐집니다). 탄창을 총 위로 끌면 장전, 총을 탄창 위로 끌면 옮겨 붓습니다.`, `<b>안에 물건이 든 가방·리그는 가방·리그 속에 못 넣습니다.</b> 빈 가방은 됩니다. 보관함·상자·바닥엔 든 채로도 됩니다.`, `보관함·상자·시신 속 <b>가방·리그를 누르면</b> 옆에 속 칸이 열립니다 — 메지 않고 안의 것만 꺼냅니다(같이 하는 판의 공유 상자 속 가방은 가져와서 엽니다).`, `창 밖으로 끌어내면 버립니다. 판 안에선 발밑, 셸터에선 <b>바닥 더미</b>로 남아 ${K("interact")} 로 다시 줍습니다(시장에서 버리면 셸터 문 앞).`, `무게 상한(기본 30kg)을 넘으면 느려집니다. 단축 칸 10개(키 4~9 · 0 · - · = · 10번째 칸은 ${K("wheel")} 원형 메뉴로)엔 약·억제약·신호탄·수류탄·방탄 수리 키트·덫만. ${K("wheel")} 를 누른 채 마우스로 칸을 고르고 놓으면 씁니다.`, `총은 쏠수록 닳고, 많이 닳으면 걸리기 시작합니다. 무기상에서 정비하시면 됩니다.` ]) + sec("부상과 약", [ `<b>부상</b>은 판 안에서만 — 체력 막대 밑에 무엇을 다쳤고 무엇을 쓰면 되는지 뜹니다. ${K("heal")} 는 부상부터 알맞은 약을 고릅니다.`, `<b>심한 출혈</b>(초당 1) → 지혈대 · 군용 응급 파우치 · 수술 키트 / <b>가벼운 출혈</b>(초당 0.35) → 붕대 · 구급킷 · 지혈대`, `진통제 · 소독약 · 진통 주사 · 항생제는 체력만 채웁니다. 에너지 드링크는 기력, 아드레날린은 최대 체력 +25(3분).`, `방어구가 막아 몸에 들어간 피해가 적으면 잘 안 다칩니다.`, `<b>방탄 수리 키트</b>(방어구상 · 아주 비쌈): 판 안에서도 — 입은 방탄복·방탄모 중 더 닳은 쪽 내구 +400(8초). 방어구상 수리와 달리 내구 상한이 안 줄어듭니다.` ]) + sec("배고픔 · 목마름", [ `배고픔 · 목마름은 <b>판 안에서만</b> 줄어듭니다. 셸터 · 장터에 있을 때나 의식을 잃었을 때는 그대로입니다.`, `꽉 찬 데서 바닥까지 배고픔은 약 36분, 목마름은 약 22분 걸립니다. 달리면 목마름이 더 빨리 줄어듭니다.`, `25 아래로 내려가면 배고플 때 기력이 천천히 차고, 목마를 때 달리면 기력이 빨리 닳습니다. 0이 되면 판 안에서 체력이 조금씩 줄어듭니다.`, `먹을 것 · 마실 것은 가방에서 우클릭하면 먹습니다(판 안에서는 잠깐 걸립니다). 장터 [밥집]에서 생수 한 통(6만 원) · 국밥(25만 원) · 백반 정식(70만 원 · 둘 다 가득)을 사 먹을 수도 있습니다.` ]) + sec("셸터", [ `<b>셸터</b>는 내 집입니다. 보관함 · 옷장(겉모습 바꾸기) · 침대 · 출격 지도가 있고, 현관문을 나서면 도심 지도로 갑니다. Ctrl 을 누른 채 휠을 굴리면 화면을 크게 · 작게 봅니다.`, `<b>부동산</b>(장터): 고시원(처음 집) · 반지하 원룸 200만 · 옥탑방 500만 · 민방위 대피소 700만 · 복층 1000만 · 빌라 투룸 1500만 · 옥상 컨테이너 2500만 · 폐역 역무실 4000만 · 상가 2층 6500만 · 한강뷰 펜트하우스 1억 원. 비쌀수록 넓고, 집마다 바깥 풍경과 구조가 다릅니다.`, `한 번 산 집끼리는 [이사]로 공짜로 오갑니다. 가구는 모든 집이 함께 쓰고, 집마다 놓은 자리를 따로 기억합니다(떠나면 창고로, 돌아오면 그 자리로). 재산에는 가진 집 중 가장 비싼 한 채만 셉니다.`, `<b>침대</b>: 한 판을 다녀올 때마다(살아 나오든 의식을 잃든) 한 번 잘 수 있고, 자고 나면 시장 좌판에 새 물건이 들어옵니다.`, `의자 · 소파에 ${K("interact")} 로 앉고, TV · 조명 · 선풍기를 켜고 끕니다(TV 는 곁에 스피커가 있어야 소리가 납니다). 셸터에 놓은 운동기구도 써 볼 수 있습니다.`, `<b>청소</b>: 더러운 곳 곁에서 ${K("interact")} 를 누르고 있으면 치웁니다. 단말기 [집 청소]로 집 전체를 한 번에 치울 수도 있습니다. 나온 쓰레기는 팔 수 없으니 쓰레기 더미나 쓰레기통에 ${K("interact")} 로 버리시면 됩니다.`, `보관함은 셸터에서만 열립니다. 판에 들고 갈 것만 가방에.`, `<b>보관함</b> 위에는 찾기 칸 · 분류 단추(무기 · 탄 · 약 · 먹을 것 · 잡동사니 · 임무)와 [정리] · [탄 합치기] · [가방 → 보관함 전부]가 있습니다. [+2줄]로 넓힐 수 있고, 넓힐수록 값이 오릅니다.`, `<b>장비 세트</b>: 가방 · 보관함 창 「장착」의 [🎒 장비 세트] · 시장 창 위 단추 — 지금 장비를 다섯 벌까지 저장해 두고 [꾸리기]로 한 번에 다시 챙깁니다. 보관함에 있는 것을 먼저 쓰고, 모자란 것은 지금 좌판에 있는 것으로 삽니다(사기 전에 무엇을 어디서 얼마에 사는지 묻습니다). 판 안에서는 안 됩니다.`, `<b>개인 금고</b>: 설비 「금고 공방」에서 한 주에 하나 나옵니다. 셸터에서 우클릭으로 쓰면 가방 창에 금고 칸이 생기고, 여기 넣은 것은 판에서 의식을 잃어도 지켜집니다. 쓸 수 있는 날이 정해져 있어(보존 장치를 올리면 길어집니다, 최대 7일) 끝나면 든 것은 보관함으로 옵니다. 금고는 하나만 씁니다 — 남아 있을 때 같은 칸 수 금고를 또 쓰면 남은 날에 더해지고, 다른 칸 수 금고를 쓰면 새 금고로 바뀌며 든 것은 그대로 옮겨 갑니다. 물건이 든 가방은 못 넣습니다.`, `펜트하우스 어딘가에 숨은 방이 있다는 소문이 있습니다.` ]) + sec("꾸미기", [ `${K("deco")} 셸터 꾸미기 — 가구 사기·놓기·돌리기·색. 금고·사물함은 보관, 진열장·거치대는 전시.`, `가구는 장터 <b>가구점</b>에서 사면 창고로 들어갑니다. 꾸미기에서 좌클릭으로 놓고, R 이나 휠로 돌리고, 우클릭으로 창고에 넣습니다. 방향키로 옮기고(Ctrl 은 아주 조금씩 · Shift 는 한 칸씩), ${K("deco")} 나 Esc 로 끝냅니다.`, `색을 바꿀 수 있는 가구는 한 점에 5,000원으로 색을 바꿉니다. 가구는 반값에 팔 수 있습니다 — 안에 든 것은 먼저 비워야 하고, 보관함 · 옷장 같은 붙박이는 못 팝니다.`, `꾸미기 [바닥 · 벽]에서 바닥재 · 벽지 · 문을 바꿉니다. <b>한 번 사면 모든 집에서 공짜</b>입니다. 「방 전체」나 「한 칸」으로 칠하고, Ctrl+Z 로 되돌립니다.`, `컵 · 주전자 같은 작은 물건은 탁자 · 책상 · 서랍 위에 올려 둡니다.`, `수납 가구(금고 · 사물함 · 책장 · 선반 · 서랍장 등)는 크기가 저마다 다르고, 생수 가구에는 생수병만 들어갑니다. 진열장 · 진열 선반 · 무기 거치대에는 물건을 세워 보여 줄 수 있습니다.` ]) + sec("설비", [ `셸터 설비(시장 설비 탭): 실제 시간 24시간이면 가득 찹니다(그 전엔 흐른 만큼). 받거나 [판매]로 바로 팔면 새로 쌓입니다.`, `<b>설비 다섯 가지</b>: 발전기(전지 · 무전기) · 정비 작업대(파츠 상자 — 우클릭으로 엽니다) · 약품 선반(약) · 탄약 작업대(탄 상자 · 가장 높은 단계는 가끔 수류탄도) · 증류기(술 · 그리고 며칠에 하나씩 증상 억제약).`, `설비는 1~3단계입니다. 짓거나 올릴 때 돈(420만 · 875만 · 1645만 원)과 그 설비에 맞는 재료가 듭니다. 높은 단계일수록 귀한 재료(구리 전선 · 소형 모터 · 철판 등 — 건물 상자에서 나옵니다)가 필요합니다.`, `[받기]는 보관함으로, [판매]는 시세의 75%로 팝니다. [설비 전부 판매]는 증상 억제약과 개인 금고는 빼고 팝니다.`, `<b>금고 공방</b>(10단계)은 개인 금고를 만들고, 단계가 오를수록 금고가 커집니다. <b>금고 보존 장치</b>(6단계)는 금고를 쓸 수 있는 날을 늘립니다.`, `셸터 왼쪽 위 감염도 아래 「설비」 불빛은 가득 차서 멈춘 설비가 있으면 초록으로 깜빡입니다. 마우스를 올리면 설비마다 얼마나 찼는지 보입니다.` ]) + sec("텃밭 · 물 · 요리", [ `<b>텃밭</b>: 가구점의 텃밭 상자(한 칸) · 큰 텃밭 상자(세 칸)를 놓고 ${K("interact")} 로 엽니다. 씨앗(상추 · 고추 · 방울토마토 · 감자 · 배추)은 약재상에서 삽니다. 1~4시간이면 익고, 게임을 꺼 두어도 실제 시간으로 자랍니다.`, `생수병 하나로 물을 주면 두 시간 동안 젖어 있습니다. 마르면 아주 천천히 자라고, 오래 마르면 시듭니다(다 익은 것은 안 시듭니다). <b>자동 급수기</b>(약재상)를 달면 넣어 둔 생수로 알아서 물을 줍니다.`, `거둘 때 가끔 지렁이(낚시 미끼)가 나옵니다.`, `<b>정수기</b>: 생수병을 넣어 두면 한 병에 세 잔이 나오고, 한 잔에 목마름이 25 찹니다. 남은 물은 창 윗줄 막대로 보입니다.`, `<b>냉장고</b>에는 먹을 것 · 마실 것만 들어갑니다. <b>조리대</b>(김치 · 채소 샐러드)와 <b>싱크대 · 가스레인지</b>(라면 · 삶은 감자 · 구운 생선 — 부탄가스가 듭니다)에서 거둔 채소와 물고기로 요리합니다.`, `<b>작업대</b>에서는 음식이 아닌 것을 만듭니다(예: 자동 급수기). 하늘빛 삼각형이 붙은 물건이 만들기 재료입니다.` ]) + sec("장터 · 상인", [ `<b>장터</b>는 도심 지도에서 갑니다. 무기상 · 탄약상 · 약재상 · 방어구상 · 가구점 · 브로커(판매) · 밀수꾼 · 용병소 · 보험·정보 창구 · 부동산 · 밥집이 있고, 장터 문으로 헬스장 · 사격장 · 한강 낚시터에 갑니다.`, `상인에게 ${K("interact")} 로 말을 걸면 말 걸기 창([가게 보기] · 이야기)이 먼저 뜹니다. 좌판 앞에서는 바로 가게가 열립니다.`, `시장: 좌판(무기·탄·파츠·약·방어구)은 판을 다녀오면 재고가 바뀝니다. 브로커에 팔면 "방금 판 것"에서 되돌릴 수 있습니다.`, `시장 창에서 물건 줄을 우클릭하면 자세히 보고, ☆를 누르면 <b>찜</b>합니다. 찜한 물건이 좌판에 들어오면 도심 지도에 ★가 붙고, 한꺼번에 판매에서 빠집니다.`, `<b>브로커</b>는 물건 값의 75%를 쳐 줍니다(닳은 총 · 방어구는 덜, 붙은 파츠 · 든 탄은 같이 셉니다). [잡동사니 전부 판매]는 임무 · 만들기 재료와 찜한 것을 빼고 한 번에 팝니다. 임무 물건 · 빈 탄창 · 쓰레기 · 안에 뭐가 든 상자는 못 팝니다.`, `<b>단골</b>: 무기상 · 탄약상 · 약재상 · 방어구상 · 총 부품상 · 밀수꾼은 사고판 돈이 쌓이면 처음 손님 → 단골 → 오랜 단골 → 한식구로 오릅니다. 오를수록 더 좋은 물건을 내놓고, 팔 때 조금 더 쳐 주며, 귀한 물건도 들여옵니다. 단골 줄의 ?를 누르면 단계마다 파는 물건이 보입니다.`, `단골 할인은 가끔 합니다. 할인하는 날은 좌판과 시장 탭에 표시되고, 좌판에 새 물건이 들어올 때까지 이어집니다.`, `<b>물물교환</b>: 무기상 · 탄약상 · 약재상 · 방어구상 · 밀수꾼에 교환 칸이 있습니다. 잡동사니를 주고 쓸 물건을 받는 것으로, 팔아서 사는 것보다 이득입니다. 좌판이 바뀔 때마다 새로 나오고 한 번씩만 됩니다.`, `<b>밀수꾼</b>은 시장에 안 나오는 것(투척물 · 덫 등)을 웃돈을 얹어 팝니다.`, `<b>정비 · 수리</b>: 무기상에서 총을, 방어구상에서 방어구를 한꺼번에 고칩니다. 방어구는 고칠 때마다 내구 상한이 조금씩 줄어듭니다.`, `<b>총 파츠</b>: 시장 [파츠] 탭에서 사고, 보관함에서 총을 누르면 파츠 창이 열립니다. 총구 · 탄창 · 손잡이 · 조준기 · 개머리판 · 레이저 자리가 있습니다 — 소음기는 총소리가 멀리 안 퍼지고, 큰 탄창은 탄이 많이 들어가고, 조준기 · 레이저는 덜 퍼지게 합니다.`, `보험: 시장에서 신청해 두면, 출격할 때 그때 장착한 장비 값의 15%를 내고 — 의식을 잃어도 그 장비가 보관함으로 돌아옵니다(가방 속 물건은 안 돌아옵니다).`, `보험료가 모자라면 그 판은 보험 없이 나가고 신청은 남아 있습니다. 마지막 희망 판에는 보험이 안 됩니다.`, `<b>프리마켓</b>(시장 [프리마켓] 탭 · 로그인 필요): 다른 생존자와 사고팝니다. 보관함에 있는 물건을 한 사람 열 개까지, 1천 원~1억 원에 올립니다. 48시간 안 팔리면 돌아오고, 팔리면 수수료 5%를 뺀 돈이 다음 저장 때 들어옵니다. 임무 물건 · 빈 탄창 · 쓰레기 · 안에 뭐가 든 상자는 못 올립니다.` ]) + sec("의뢰", [ `상인 의뢰: 탈출·처치·납품·두목. 처치는 판 하나에 판 시간·건물 적 수만큼만 쳐 드립니다(여러 판에 걸쳐).`, `상인마다 의뢰가 차례로 있고, 그중 두 개를 같이 진행합니다. 어느 것을 먼저 끝내도 되고, 하나를 끝내면 다음 것이 열립니다. 처치 · 탈출은 판이 끝나면 저절로 세고, 납품은 보관함에서 가져갑니다. 다 하면 [보상 받기]로 돈과 물건을 받습니다.`, `의뢰 · 이야기 · 작전은 하나씩 [추적] · [숨김]을 고를 수 있습니다. 추적 중인 것은 오른쪽 위 「추적 중」에 할 일이 짧게 보이고, 숨긴 것도 진행과 보상은 그대로입니다.`, `<b>오늘 과제 · 이번 주 과제</b>: 모두에게 같은 과제가 붙고, 한국 시각 0시에 바뀝니다.`, `<b>현상금 게시판</b>: 본 줄거리를 끝내면 시장 [의뢰] 탭에 현상금 석 장이 붙습니다. 다 하면 그 자리에 새 것이 붙고, 다섯 장마다 덤을 줍니다. 마음에 안 드는 것은 돈을 내고 바꿉니다.` ]) + sec("용병", [ `시장 [출격 준비] 탭(용병소)에서 용병을 씁니다. 다음 한 판에 한 명만 따라오고, 값은 쓸 때 냅니다.`, `용병은 뒤에서 따라오며 보이는 적을 쏘고, 층을 옮기면 같이 옵니다. 사람마다 드는 무기와 솜씨가 다릅니다 — 짐꾼은 같이 살아 나오면 얻은 값이 늘고, 위생병은 내 체력을 채워 줍니다.`, `마지막 희망 판과 헬기장에는 따라오지 않고 다음 판까지 기다립니다.` ]) + sec("장터 사람들 · 헬스장 · 사격장 · 낚시터", [ `장터엔 사람들이 걷고, 쉬고, 불을 쬡니다. ${K("interact")} 로 말을 걸면 소문을 들을 수 있습니다.`, `<b>주먹 싸움</b>: 말 걸고 "한판 붙자" — 무기 없이 주먹만. 져도 의식을 잃지 않고 끝나면 체력·기력은 싸우기 전으로 돌아갑니다. 이긴 수만큼 근접 공격 치명타(15% + 승당 0.05%, 최대 30%).`, `<b>헬스장</b>(장터 아래 문): 기구 앞에서 ${K("interact")}. 이용료 25만 원, 해내면 0.1단계. 러닝머신 — 체력(A·D 번갈아 40걸음) · 역기 — 근력(Space 10번) · 줄넘기 — 지구력(줄이 초록으로 발밑에 올 때 Space 12번 · 아래 박자 막대).`, `헬스장 <b>샌드백</b> — 타격(되돌아오는 샌드백이 가운데 초록일 때 Space · 좌클릭 10번). 몸은 5단계까지 오릅니다: 근력은 들 수 있는 무게, 체력은 기력 크기, 지구력은 달릴 때 기력이 덜 닳게, 타격은 근접 치명타를 올립니다.`, `헬스장 운동 횟수는 0단계 기준입니다 — 그 능력이 1단계 오를 때마다 10%씩 줄어듭니다(4.9단계면 러닝머신 24걸음 · 역기 6번 · 줄넘기 7번 · 샌드백 6번).`, `<b>사격장</b>(장터 오른쪽 구석 문): 관리대에서 총 · 파츠 · 근접 무기 · 탄 종류 · 표적을 골라 쏴 봅니다. 최고 기록이 남습니다. 여기서는 숙련이 오르지 않습니다.`, `<b>한강 낚시터</b>(장터 왼쪽 아래 문): 가게 강태공에게 낚싯대와 지렁이를 삽니다. 물가 자리에서 ${K("interact")} 로 던지고, 찌가 쑥 들어가면 바로 Space(좌클릭)로 챕니다. 그다음 Space 를 눌러 감되, 줄 긴장 막대가 차거나 물고기가 당길 때(!!) 누르고 있으면 줄이 끊깁니다.`, `잡은 물고기는 조과통에 먼저 들어갑니다. 강태공이 브로커와 같은 값에 사 가고([물고기 전부 판매]도 있습니다), 모닥불에 구우면 값은 내려가도 배를 더 채웁니다. 낚싯대는 여러 번 던지면 부러집니다.` ]) + sec("이야기 · 서울 탈출", [ `장터 사람들이 <b>이야기 임무</b>를 맡깁니다. 목표를 채운 뒤 그 사람에게 돌아가면 보상을 줍니다. 단말기 [이야기]에 「본 줄거리」와 「곁가지」로 나뉘어 있고, 이야기 물건은 팔 수 없습니다.`, `본 줄거리는 여섯 막입니다. 첫 임무는 연립주택에서 살아 나오는 것이고, 임무를 마칠수록 새 건물이 열립니다. 곁가지는 사람들과의 이야기나 판에서 주운 실마리 물건으로 열립니다.`, `이야기의 「살아 나오기」는 옥상 집라인 · 완강기 · 헬기 · 바깥 지도 끝 출구로 나와야 셉니다(1층 출입문 · 구조 신호탄은 안 셉니다).`, ``, `<b>헬기장 판</b>: 1층은 곧 잠기고 집라인 · 완강기도 없습니다. 옥상 헬기장에서 ${K("interact")} 로 무전을 치면 헬기가 올 때까지 90초 동안 약탈자 무리가 계속 올라옵니다. 헬기가 내려앉으면 잠깐 서 있다가 타시면 됩니다.`, `<b>구출 작전</b>: 한 번 서울을 떠난 뒤에는 장터 사람을 한 명씩 헬기로 내보낼 수 있습니다. 그 사람이 맡긴 곁가지를 다 끝내고 자리값을 내면, 헬기장 판에 따라오니 살려서 같이 타시면 됩니다.`, `<b>회차</b>: 헬기로 서울을 떠난 뒤 단말기 [회차]에서 가진 것을 모두 내려놓고 다시 처음부터 시작할 수 있습니다. 회차마다 보관함 두 줄 · 숙련 10%가 영구히 붙고(5회차까지), 겉모습 · 칭호 · 기록은 남습니다.`, `회차의 숙련 10%는 숙련이 오르는 빠르기입니다. 이름 옆에 「n회차」가 붙습니다.` ]) + sec("숙련 · 훈련", [ `<b>숙련</b>은 판 안에서 할수록 늡니다(0~10단계). 사격은 적을 맞힐수록 퍼짐 · 반동이 줄고, 뒤지기는 상자를 다 뒤질수록 빨라지고, 치료는 약을 쓸수록 약 쓰는 시간이 줄고, 은신은 조용히 걸을수록 발소리가 작아집니다.`, `끝 단계에서 사격은 15%, 나머지는 30%까지 좋아집니다. 단말기 [상태]에서 지금 단계를 봅니다.`, `<b>교관 훈련</b>(단말기 [상태] · 셸터에서): 돈을 내면 다음 단계까지 남은 것의 절반을 채워 줍니다. 모든 숙련을 합쳐 하루 세 번까지이고, 단계가 높을수록 비쌉니다. 판 안에서는 안 됩니다.` ]) + sec("같이 하기", [ `<b>파티</b>(로그인 필요): 셸터 무전기 · 첫 화면 [멀티플레이] · 메뉴 [멀티플레이]의 [파티 생성]으로 만들면 네 글자 <b>방 코드</b>가 나옵니다. 친구가 [방 코드] 칸에 넣고 [들어가기]를 누르면 됩니다. 파티는 셋까지이고, 도움말 단추 왼쪽에 인원과 코드가 보입니다(누르면 코드가 복사됩니다).`, `출격은 <b>파티장</b>만 누르고, 거점에 있는 파티원은 같이 갑니다. 파티원은 [이번엔 빠지기]를 고를 수 있고, 파티장이 나가면 남은 사람이 파티장이 됩니다. 판 안에서는 파티를 나갈 수 없습니다.`, `같은 건물을 고른 <b>다른 파티</b>와 한 판에 들어갈 수 있습니다(45초 기다린 뒤 출발). 다른 파티는 적이라 서로 쏠 수 있고, 쓰러뜨리면 짐을 챙길 수 있습니다. 한강 다리 · 지하철 터널 · 재개발 공사장에는 다른 파티가 들어오지 않습니다.`, `같은 팀끼리는 총 · 근접 · 수류탄에 다치지 않습니다. 상자 · 시신 · 바닥 짐은 먼저 꺼낸 사람이 가집니다.`, `<b>일으켜 세우기</b>: 동료가 살아 있으면 체력이 다해도 바로 의식을 잃지 않고 쓰러집니다. 60초 안에 동료가 곁에서 ${K("interact")} 를 3초 누르고 있으면 일어납니다. 쓰러진 채 더 맞거나 시간이 다 되면 의식을 잃고, 그 뒤엔 동료 화면을 지켜봅니다.`, `<b>친구</b>: 파티 창 아래나 채팅 「친구」 칸의 [친구 목록]에서 닉네임으로 요청을 보내고, 받은 요청을 받거나 거절합니다(거절은 상대에게 알리지 않습니다). 서로 친구면 접속 중 · 판 안 · 접속 안 함이 보입니다.`, `<b>채팅</b>: 「전체」 칸은 판 밖에 있는 모든 생존자에게 가고 욕은 ○로 가려집니다. 「친구」 칸은 거점에 있는 친구에게만 갑니다. 말풍선은 설정 › 화면 「말풍선 보기」로 끕니다.`, `<b>장터에서 만나기</b>: 장터에는 구역마다 열두 명까지 다른 생존자가 보이고, 파티원은 같은 구역으로 모입니다(파란 이름표). 헬스장 · 낚시터 · 사격장 · 셸터에서는 파티원끼리만 보입니다.`, `<b>놀러 가기</b>: 도심 지도의 셸터에서 [파티원 셸터로]를 누르면 파티원 셸터에 갑니다. 앉기 · TV · 불 · 운동기구는 쓰고 상자는 보기만 합니다. 누가 내 셸터에 오면 알려 드립니다.`, `다른 사람에게 쓰러진 판의 결과 창에서 [나를 쓰러뜨린 사람 신고]로 신고하실 수 있습니다.` ]) + sec("기록 · 칭호 · 주간 도전 · 순위", [ `<b>도전 과제 · 칭호</b>: 단말기 [기록] — 건물마다 출격·탈출·최고 수입, 과제 ${SX.feats ? SX.feats.LIST.filter(f => !(f[4] && f[4].hidden)).length : 29}개. 이룬 과제는 칭호로 달 수 있고, 같이 하는 판에서 동료 이름표 위에 보입니다.`, `<b>숨겨진 것</b>: 건물마다 하나씩 숨은 것이 있습니다. 다 찾으면 숨은 칭호를 받습니다. [기록] 위 단추로 도전 과제 · 숨겨진 것만 골라 봅니다.`, `<b>주간 도전</b>: 단말기 [순위] — 월요일 0시(한국 시각)마다 도전 셋(쉬움 · 보통 · 어려움). 살아서 나온 판만 셉니다. 별 하나에 100 · 150 · 200점, 점수로 순위를 겨룹니다. 주가 끝나면 지난주 몫(별마다 돈 · 순위 상금 · 칭호)을 받으시면 됩니다.`, `지난주 몫은 별 하나에 20만 원, 순위 상금은 1위 300만 · 2~3위 150만 · 4~10위 50만 원입니다. 로그인해야 겨룰 수 있습니다.`, `<b>순위</b>: 이번 주 들고 나온 값 · 한 판 최고 · 탈출 · 처치 순위가 있습니다. 월요일 0시부터 새로 세고, 너무 짧은 판은 빠집니다.` ]) + sec("감염 게이지", [ `봉쇄된 서울 공기에는 옅은 가스가 늘 떠 있어, 서울에 머무는 동안 조금씩 몸에 쌓입니다. 한도를 넘으면 감염됩니다. 감염 게이지는 그 양으로, 게임에 접속해 있는 동안만 오릅니다(접속 48시간이면 100%). 차면 억제약(시장 약재상 · 밀수꾼 · 판에서 드물게)을 드십시오. 100%가 되면 셸터부터 모든 것을 잃고 처음 시작할 때처럼 다시 시작합니다.`, `셸터 왼쪽 위와 단말기에 감염도와 남은 접속 시간이 보입니다. <b>증상 억제약</b>을 먹으면 0으로 돌아갑니다.`, `억제약 값은 가진 재산의 3%(최소 20만 원)라 재산이 적을수록 쌉니다. 밀수꾼은 웃돈을 받습니다. 증류기 설비에서도 며칠에 하나씩 나옵니다.`, `100%가 되면 집 · 가구 · 텃밭 · 설비 · 돈 · 보관함 · 장비 · 개인 금고 · 이야기 · 의뢰 · 숙련을 잃습니다. 겉모습 · 칭호 · 기록 · 회차는 남습니다.` ]) + sec("계정 · 저장", [ `게임은 <b>로그인</b>해야 할 수 있습니다. 진행은 서버에 저장되어 어느 컴퓨터에서 열어도 이어지고, 로그인은 한동안 유지됩니다. 같은 계정을 창 두 개로 켜면 경고가 뜹니다.`, `가입할 때 아이디 · 비밀번호 · <b>닉네임</b>을 정합니다. 다른 사람에게는 닉네임만 보입니다. 닉네임은 2~12자(한글 · 영문 · 숫자)이고, 욕이나 남과 헷갈리는 이름은 안 되며, 7일에 한 번 바꿀 수 있습니다.`, `<b>복구 코드</b>는 가입할 때 한 번만 보여 드립니다. [복사하기]나 [파일로 저장]으로 꼭 보관해 두십시오. 잃어버렸으면 계정 창 [복구 코드]에서 비밀번호를 넣고 새로 받으시면 됩니다(예전 코드는 못 쓰게 됩니다).`, `<b>비밀번호 찾기</b>: 로그인 화면 [비밀번호 찾기]에서 아이디 · 복구 코드 · 새 비밀번호를 넣습니다. 바꾸면 다른 곳의 로그인은 풀리고 새 복구 코드를 드립니다.`, `첫 화면 [계정 · 온라인]에서 닉네임 · 비밀번호 바꾸기, 복구 코드 새로 받기, 로그아웃을 합니다.` ]) + sec("설정 · 팁", [ `<b>설정</b>(메뉴 [설정]): 밝기 · 조준점 · 창과 글씨 크기는 「화면」, 색약 화면은 「접근성」, 언어는 「언어」 쪽에서 바꿉니다. 컴퓨터가 느리면 「그래픽 · 성능」 쪽에서 꾸밈 양 · 빛 품질 · 프레임 상한을 낮추십시오. 맨 위 「설정 찾기」에 글자를 넣으면 맞는 항목만 보입니다.`, `<b>소리 보이기</b>: 설정 「접근성」 쪽에서 켜면 안 보이는 곳에서 난 소리가 화면 가장자리에 표시됩니다.`, `${K("photo")} <b>사진 모드</b>: 화면 글자를 숨기고, 화면을 옮기고 · 키우고 · 흑백이나 옛날 사진 색을 입혀 Space 로 사진 파일을 저장합니다. 혼자 할 때는 그동안 게임이 멈춥니다.`, `<b>모드</b>(첫 화면 [모드]): 그림 · 소리 · 가구 등을 바꾸는 모드를 넣고 켤 수 있습니다. 판의 수치나 보이는 것을 바꾸는 모드를 켜면 다른 사람과 만날 수 없고, 탈출할 때 챙긴 물건을 거의 흘립니다.`, `첫 화면 [새 소식]에서 바뀐 것을 보고, [의견 보내기]로 하고 싶은 말을 보내실 수 있습니다.` ]) + sec("조작 키", [ `아래 표 · 메뉴 [설정]의 「조작 · 키」 쪽에서 바꿀 수 있습니다.`, `마우스 감도 · 가속 끄기는 같은 창의 [마우스 감도] 탭에 있습니다.`, `[누르는 방식] 탭에서 조준 · 달리기 · 앉기 · 조용히 걷기를 「누르는 동안」 또는 「한 번 눌러 켜고 끄기」로 고릅니다.` ]) + keyTable(true) + (SX.pad ? sec("게임패드", [ `게임패드 — 꽂고 아무 단추나 누르시면 됩니다. 마지막에 쓴 것(패드 / 키보드 · 마우스)에 맞춰 화면의 키 이름이 바뀝니다.`, `게임패드는 길게 누르면 다른 일을 하는 단추가 있습니다 — B 앉기(길게: 종이상자) · Y 회복약(길게: 벽돌) · 보기 단추 가방(길게: 단말기) · 십자 왼쪽 핑(길게: 무전 기록). 단추 배치는 바꿀 수 없습니다.` ]) + SX.pad.table() : "");
    if (U._helpGrab) return {
      S,
      SI,
      keys: keyTable(true),
      pad: SX.pad ? SX.pad.table() : ""
    };
    const toc = `<div class="helpToc">` + S.map((t, i) => `<button data-hs="${i}">${esc(t)}</button>`).join("") + `</div>`;
    U.open("help", `<div class="win" style="min-width:calc(var(--u)*230);max-width:92vw">${header("도움말 · 규칙")}<div class="body" id="helpBody" style="max-height:78vh;overflow:auto"><div class="help">${toc}${body}</div></div></div>`);
    const hb = document.getElementById("helpBody");
    if (hb) hb.addEventListener("click", e => {
      const b = e.target.closest("[data-hs]"), h = b && document.getElementById("helpS" + b.dataset.hs);
      if (!h) return;
      SX.audio && SX.audio.play("click");
      hb.scrollTop += h.getBoundingClientRect().top - hb.getBoundingClientRect().top - 4;
    });
  };
  const appWin = () => window.seoulApp && typeof window.seoulApp.setFull === "function" ? window.seoulApp : null;
  U.fsOn = () => {
    const a = appWin();
    return a ? !!a.full() : !!document.fullscreenElement;
  };
  U.fsToggle = function() {
    const a = appWin(), dc = document;
    if (a) return Promise.resolve(a.setFull(!a.full())).catch(() => {});
    if (dc.fullscreenElement) {
      try {
        if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock();
      } catch (e) {}
      return dc.exitFullscreen().catch(() => {});
    }
    return dc.documentElement.requestFullscreen({
      navigationUI: "hide"
    }).then(() => {
      try {
        if (navigator.keyboard && navigator.keyboard.lock) return navigator.keyboard.lock().then(() => {
          U.fsLocked = true;
        }, () => {
          U.fsLocked = false;
        });
      } catch (e) {}
      U.fsLocked = false;
    }).catch(() => {});
  };
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      U.fsLocked = false;
      try {
        if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock();
      } catch (e) {}
    }
  });
  U.openFeedback = null;
  const decoEl = $("deco");
  let decoTab = "furn", decoRoom = "all";
  const decoHint = () => SX.home.deco && SX.home.deco.sel ? "좌클릭 놓기 · 방향키 4도트씩 · Ctrl 누르면 1도트씩 · Shift 누르면 칸 단위 · R/휠 돌리기 · 우클릭 창고로 · " + SX.label("deco") + "/Esc 끝" : "놓인 가구 누르면 옮기기 · 가구에 마우스를 올리고 방향키 4도트씩(Ctrl 1도트 · Shift 한 칸) · " + SX.label("deco") + "/Esc 끝";
  U.openDeco = function() {
    decoRoom = "all";
    decoEl.classList.remove("hidden");
    document.body.classList.add("decoopen");
    U.renderDeco();
    hint(decoHint());
  };
  U.closeDeco = function() {
    decoEl.classList.add("hidden");
    document.body.classList.remove("decoopen");
    decoEl.innerHTML = "";
    hint(null);
  };
  let hintEl = null;
  function hint(t) {
    if (!hintEl) {
      hintEl = document.createElement("div");
      hintEl.className = "hintbar hidden";
      document.body.appendChild(hintEl);
    }
    hintEl.textContent = t || "";
    hintEl.classList.toggle("hidden", !t);
  }
  U.renderDeco = function() {
    const H = SX.home, d = H.deco;
    if (!d || decoEl.classList.contains("hidden")) return;
    const s = SX.game.save;
    const ob = $("decoBody"), ol = decoEl.querySelector("#decoCart .lines"), keepTop = ob && decoEl._tab === decoTab ? ob.scrollTop : 0, keepCart = ol && decoEl._tab === decoTab ? ol.scrollTop : 0;
    decoEl._tab = decoTab;
    decoEl.innerHTML = `<header>${d.fromMenu ? `<button class="mBack" id="decoBack">◀ 메뉴</button>` : ""}<h2>셸터 꾸미기 <span class="money small">${won(s.money)}</span></h2><button class="x" id="decoX">끝 ✕</button></header>\n      <div class="tabs"><button data-dt="furn" class="${decoTab === "furn" ? "on" : ""}">가구</button><button data-dt="room" class="${decoTab === "room" ? "on" : ""}">바닥 · 벽</button></div>\n      <div class="body" id="decoBody"></div><div id="decoCart"></div>`;
    $("decoX").onclick = () => H.stopDeco();
    if ($("decoBack")) $("decoBack").onclick = () => H.stopDeco(false, true);
    decoEl.querySelector(".tabs").onclick = e => {
      const b = e.target.closest("[data-dt]");
      if (b) {
        decoTab = b.dataset.dt;
        U.renderDeco();
      }
    };
    const body = $("decoBody");
    d.roomTab = decoTab === "room";
    hint(SX.top && d.held && decoTab === "furn" ? SX.top.hint() : decoTab === "room" && !d.sel && SX.homeSurf && SX.homeSurf.hint ? SX.homeSurf.hint(d) : decoHint());
    if (decoTab === "furn") {
      if (SX.top && d.held) SX.top.heldBox(body);
      if (d.sel) {
        const cat = H.FURN[d.sel.kind];
        const box = document.createElement("div");
        box.className = "box";
        box.innerHTML = `<h3><span>들고 있는 것: ${esc(cat.name)}</span></h3><p class="small">바닥에 대고 좌클릭 = 놓기 · R/휠 = 돌리기 · 우클릭 = 창고로</p><p class="small decoNudge">그냥 옮기면 4도트씩 격자에 맞춰 움직입니다. Ctrl 을 누르면 1도트씩, Shift+방향키는 한 칸씩 옮깁니다.</p>${SX.top ? SX.top.selNote(d.sel) : ""}${SX.ride ? SX.ride.selNote(d.sel) : ""}`;
        const rr = document.createElement("div");
        rr.className = "row";
        rr.style.gap = "var(--u)";
        const rb = document.createElement("button");
        rb.textContent = "↻ 돌리기";
        rb.onclick = () => H.rotate(1);
        rr.appendChild(rb);
        const rb2 = document.createElement("button");
        rb2.textContent = "↺";
        rb2.onclick = () => H.rotate(-1);
        rr.appendChild(rb2);
        const dirName = [ "아래쪽", "오른쪽", "위쪽", "왼쪽" ][(d.sel.rot | 0) & 3];
        const rl = document.createElement("span");
        rl.className = "small";
        rl.textContent = dirName + " 보기";
        rr.appendChild(rl);
        box.appendChild(rr);
        if (cat.paint) {
          const pl = document.createElement("div");
          pl.innerHTML = `<div class="small">색 바꾸기 ${won(H.PRICE.paint)} — 눌러 보고 아래에서 한꺼번에 사시면 됩니다</div>`;
          for (const c of H.PAINT) {
            const sw = document.createElement("span");
            sw.className = "sw" + (d.sel.col === c ? " on" : "");
            sw.style.background = c;
            sw.title = c;
            sw.onclick = () => H.paint(d.sel, c);
            pl.appendChild(sw);
          }
          const rs = document.createElement("span");
          rs.className = "sw";
          rs.style.background = "repeating-linear-gradient(45deg,#555 0 3px,#222 3px 6px)";
          rs.title = "원래 색";
          rs.onclick = () => H.paint(d.sel, null);
          pl.appendChild(rs);
          box.appendChild(pl);
        }
        const bb = document.createElement("div");
        bb.className = "row";
        bb.style.gap = "var(--u)";
        const st = document.createElement("button");
        st.textContent = "창고에 넣기";
        st.onclick = () => {
          H.store(d.sel);
        };
        bb.appendChild(st);
        const sl = document.createElement("button");
        sl.textContent = "판매(반값 " + won(cat.price / 2) + ")";
        sl.disabled = !!(d.sel.builtin || cat.builtin);
        sl.onclick = () => U.ask(cat.name + " 판매", "반값 " + won(cat.price / 2) + "을 받습니다. 바로 되돌릴 수 있습니다.", 0, () => H.sell(d.sel));
        bb.appendChild(sl);
        box.appendChild(bb);
        body.appendChild(box);
      }
      if (H.lastSold) {
        const ub = document.createElement("div");
        ub.className = "box";
        const nm = H.FURN[H.lastSold.f.kind].name;
        ub.innerHTML = `<h3><span>방금 판 가구</span><span class="small">${esc(nm)} · ${won(H.lastSold.got)}</span></h3>`;
        const b = document.createElement("button");
        b.textContent = "되돌리기(돈을 도로 냅니다)";
        b.onclick = () => H.unsell();
        ub.appendChild(b);
        body.appendChild(ub);
      }
      const list = H.unplaced();
      const h = document.createElement("div");
      h.className = "cat";
      h.textContent = "창고(안 놓은 가구) " + list.length;
      body.appendChild(h);
      if (!list.length) {
        const p = document.createElement("p");
        p.className = "small";
        p.textContent = "비었습니다. 시장 가구점에서 살 수 있습니다. 놓인 가구를 누르면 들어 올려 옮깁니다.";
        body.appendChild(p);
      }
      const shown = list.filter(f => f !== d.sel && H.FURN[f.kind] && ART.propSize(f.kind)), groups = H.decoGroups(shown, k => !!ART.propSize(k));
      const cnt = id => id === "top" ? SX.top ? SX.top.stockTotal() : 0 : id === "all" ? shown.length : ((groups.find(g => g.id === id) || {}).list || []).length;
      const gTabs = H.groupTabs(k => !!ART.propSize(k));
      for (const g of groups) if (!gTabs.some(([id]) => id === g.id)) gTabs.push([ g.id, g.name ]);
      if (decoRoom !== "all" && decoRoom !== "top" && !gTabs.some(([id]) => id === decoRoom)) decoRoom = "all";
      if (shown.length || SX.top && SX.top.stockTotal()) {
        const tabs = document.createElement("div");
        tabs.className = "row furnTabs decoTabs";
        for (const [id, nm] of [ [ "all", "전체" ] ].concat(gTabs, SX.top ? [ SX.top.TAB ] : [])) {
          const n = cnt(id), b = document.createElement("button"), c = document.createElement("span");
          b.className = "mini furnTab" + (decoRoom === id ? " on" : "") + (n ? "" : " zero");
          b.dataset.decoTab = id;
          c.className = "n";
          c.textContent = n;
          b.append(document.createTextNode(nm), c);
          b.onclick = () => {
            decoRoom = id;
            SX.audio.play("click");
            U.renderDeco();
          };
          tabs.appendChild(b);
        }
        body.appendChild(tabs);
      }
      let any = false;
      for (const g of groups) {
        if (decoRoom !== "all" && decoRoom !== g.id) continue;
        any = true;
        if (decoRoom === "all") {
          const sh = document.createElement("div"), c = document.createElement("span");
          sh.className = "small decoSec";
          c.className = "n";
          c.textContent = g.list.length;
          sh.append(document.createTextNode(g.name), c);
          body.appendChild(sh);
        }
        const fl = document.createElement("div");
        fl.className = "fl";
        fl.dataset.group = g.id;
        for (const f of g.list) {
          const cat = H.FURN[f.kind];
          const it = document.createElement("div");
          it.className = "fi";
          it.dataset.kind = f.kind;
          it.appendChild(propThumb(f.kind, f.col, f.v));
          it.appendChild(document.createTextNode(cat.name));
          it.onclick = () => {
            H.select(f);
            SX.audio.play("click");
          };
          it.oncontextmenu = e => {
            e.preventDefault();
            U.showDetail({
              furn: f.kind
            });
          };
          fl.appendChild(it);
        }
        body.appendChild(fl);
      }
      if (shown.length && !any && decoRoom !== "top") {
        const p = document.createElement("p");
        p.className = "small";
        p.textContent = "이 묶음의 가구는 창고에 없습니다 — 위 [전체]를 누르시면 됩니다";
        body.appendChild(p);
      }
      if (SX.top && (decoRoom === "all" || decoRoom === "top")) SX.top.decoList(body);
      const placed = s.home.furn.filter(f => f.placed).length;
      const foot = document.createElement("p");
      foot.className = "small";
      foot.textContent = "놓인 가구 " + placed + "개 · 진열장·거치대는 놓은 뒤 [" + SX.label("interact") + "] 로 물건을 올립니다";
      body.appendChild(foot);
    } else {
      const t = H.tier(), all = H.zones ? H.zones() : H.parts();
      {
        const ks = H.partKeys(d.part).filter(k => all.some(p => p.key === k));
        d.part = ks.length ? ks.join(",") : "all";
      }
      if (all.length === 1) d.part = "all";
      const sel = H.partKeys(d.part), tg = H.targetParts(d.part), cells = tg.reduce((n, p) => n + p.n, 0), one = sel.length === 1 ? tg[0] : null;
      const same = fn => tg.every(p => fn(p) === fn(tg[0])) ? fn(tg[0]) : null, wall = same(p => H.partWall(p)), fl = same(p => H.partFloor(p));
      if (all.length > 1) {
        const pk = document.createElement("div");
        pk.className = "box";
        pk.innerHTML = `<h3><span>바꿀 곳</span><span class="small">${esc(one ? one.name : sel.length > 1 ? sel.length + "곳" : "집 전체")} · ${cells}칸</span></h3>`;
        const row = document.createElement("div");
        row.className = "parts";
        const chip = (key, name, n) => {
          const b = document.createElement("button");
          b.className = (key === "all" ? !sel.length : sel.indexOf(key) >= 0) ? "on" : "";
          b.dataset.part = key;
          b.textContent = name;
          b.title = n + "칸";
          b.onclick = e => {
            d.part = key === "all" ? "all" : e.ctrlKey ? H.partToggle(d.part, key) : key;
            SX.audio.play("click");
            U.renderDeco();
          };
          row.appendChild(b);
        };
        chip("all", "집 전체", all.reduce((n, p) => n + p.n, 0));
        for (const p of all) chip(p.key, p.name, p.n);
        pk.appendChild(row);
        const tip = document.createElement("div");
        tip.className = "small";
        tip.textContent = "셸터에서 방(바닥이나 벽)을 눌러도 고를 수 있습니다 · Ctrl 을 누른 채 누르면 여러 곳을 함께 고릅니다 · 고른 곳은 하늘색 테두리 · 문턱 · 문 위 벽은 붙은 방에 듭니다";
        pk.appendChild(tip);
        body.appendChild(pk);
      }
      if (SX.homeSurf && SX.homeSurf.renderTab) SX.homeSurf.renderTab(body, d, U);
      const p = document.createElement("p");
      p.className = "small";
      p.textContent = "지금 집: " + t.name + " (넓이 " + SX.home.area(t) + "칸) — 더 큰 집은 시장 부동산.";
      body.appendChild(p);
    }
    const cart = $("decoCart"), pend = H.pending(), total = H.pendingTotal();
    if (!pend.length) {
      cart.innerHTML = `<div class="small">바꾼 것 없음 — 가구 색을 눌러 보면 여기에 쌓입니다(바닥 · 벽은 한 번 산 것이라 바로 깔립니다)</div>`;
      body.scrollTop = keepTop;
      return;
    }
    const lines = H.pendingLines();
    cart.innerHTML = `<div class="cat">바꾼 것(아직 안 냄)</div>` + `<div class="lines">` + lines.map(q => `<div class="li"><span class="nm">${esc(q.label)}${q.n > 1 ? " ×" + q.n : ""}</span><span class="pr">${won(q.price)}</span></div>`).join("") + `</div>` + `<div class="li"><span class="nm"><b>합계</b></span><span class="pr"><b class="${total > s.money ? "bad" : ""}">${won(total)}</b></span></div>`;
    const row = document.createElement("div");
    row.className = "row";
    row.style.gap = "var(--u)";
    row.style.marginTop = "calc(var(--u)*2)";
    const ok = document.createElement("button");
    ok.className = "big";
    ok.textContent = "구매 확정";
    ok.disabled = total > s.money;
    ok.onclick = () => U.ask("꾸미기 구매", lines.map(q => esc(q.label) + (q.n > 1 ? " ×" + q.n : "")).join(" · "), total, () => H.commit());
    const rv = document.createElement("button");
    rv.textContent = "되돌리기";
    rv.onclick = () => H.revert();
    row.append(ok, rv);
    cart.appendChild(row);
    body.scrollTop = keepTop;
    {
      const nl = cart.querySelector(".lines");
      if (nl) nl.scrollTop = keepCart;
    }
  };
  function resultPicked(r) {
    const L = r.picked || [];
    if (!L.length) return "";
    const m = new Map;
    for (const n of L) m.set(n, (m.get(n) || 0) + 1);
    const val = n => {
      try {
        const it = SX.items.mk(n);
        return it ? SX.items.sellValue(it) : 0;
      } catch (e) {
        return 0;
      }
    };
    const rows = [ ...m.entries() ].map(([n, c]) => [ n, c, val(n) * c ]).sort((a, b) => b[2] - a[2] || b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = rows.slice(0, 5), rest = rows.slice(5, 14);
    return `<div class="stlCol stlPick${r.win ? "" : " lost"}"><div class="stlH stlR"><span data-en="Looted ${L.length}">주운 것 ${L.length}개</span>${r.win ? "" : ` <span class="bad">(잃었습니다)</span>`}</div>` + top.map(([n, c, v]) => `<div class="stlIt stlR"><span class="stlIc" data-ic="${esc(n)}"></span><span class="stlItN">${esc(n)}</span><span class="stlItC">${c > 1 ? "×" + c : ""}</span><span class="stlItV">${won(v)}</span></div>`).join("") + (rest.length ? `<p class="small stlRest stlR">${rest.map(([n, c]) => esc(n) + (c > 1 ? " ×" + c : "")).join(" · ")}${rows.length > 14 ? " …" : ""}</p>` : "") + `</div>`;
  }
  function resultBars(r) {
    const S = SX.settle;
    if (!S) return "";
    const L = (r.qprog || []).filter(e => !(e.q && SX.prog.qById(e.q.id) === e.q && qHid("q", e.q.id) && e.before + e.add < e.q.n));
    const out = (r.bars || []).map(b => b.k === "s" ? S.qRow("임무", b.name, b.a, b.v, b.n, `장터의 ${esc(b.who || "")}에게`) : S.qRow("현상금", b.name, b.a, b.v, b.n, "시장 [의뢰] 탭에서 받으시면 됩니다")).concat(L.map(e => S.qRow(SX.prog.qById(e.q.id) === e.q ? "의뢰" : "과제", e.q.name, e.before, e.before + e.add, e.q.n, "시장 의뢰 탭에서 보상")));
    return out.length ? `<div class="stlH stlR">나아간 일</div>` + out.join("") : "";
  }
  function resultRun(r) {
    const S = SX.settle;
    if (!S) return "";
    let h = `<div class="stlH stlR">이번 판</div><div class="stlStats stlR"><span class="stlStat"><b>${r.searched | 0}</b><span>뒤진 상자</span></span><span class="stlStat"><b>${r.kills | 0}</b><span>처치</span></span></div>`;
    if (r.sk1 && SX.skills && SX.skills.LIST) for (const d of SX.skills.LIST) h += S.skRow(d.name, r.sk0 ? r.sk0[d.id] : null, r.sk1[d.id]);
    return h;
  }
  const repOk = () => false;
  function reportAsk(r) {
    const k = r.recap.kill, btn = () => $("resReport"), set = (t, dis) => {
      const b = btn();
      if (b) {
        b.textContent = t;
        b.disabled = !!dis;
      }
    };
    U.ask("나를 쓰러뜨린 사람 신고", esc("「" + k.n + "」 님을 부정 프로그램(핵) 사용 의심으로 신고합니다. 판 번호 · 건물 · 마지막 피해 기록이 같이 가고, 조준 기록과 함께 살펴봅니다.") + `</p><p class="small">${esc("같은 판의 같은 사람은 한 번만 신고할 수 있습니다.")}`, 0, async () => {
      set("보내는 중…", true);
      const hits = (r.recap.last || []).slice(-8).map(h => ({
        n: h.n,
        k: h.k,
        w: h.w,
        cal: h.cal,
        part: h.part,
        d: h.d,
        ago: h.ago,
        r: h.r,
        g: h.g || undefined
      }));
      const q = await SX.net.report({
        seed: r.seed,
        gid: k.g,
        b: r.building ? r.building.id : null,
        name: k.n,
        hits
      }).catch(() => null);
      if (q && (q.ok || q.dup)) {
        r.reported = q.ok ? "ok" : "dup";
        set(q.ok ? "신고했습니다" : "이미 신고했습니다", true);
        SX.log(q.ok ? "🚩 신고를 보냈습니다 — 고맙습니다" : "🚩 이 판의 그 사람은 이미 신고하셨습니다", q.ok ? "good" : "");
      } else {
        set("나를 쓰러뜨린 사람 신고", false);
        SX.audio.play("denied");
        SX.log("🚩 신고를 못 보냈습니다 — " + (q && q.msg || "서버에 못 닿습니다"), "bad");
      }
    }, null, {
      q: "신고하시겠습니까?",
      yes: "신고하기",
      no: "그만두기"
    });
  }
  U.endMid = function(r) {
    const P = SX.prog, sd = P.SIDES && P.stSide ? P.SIDES[P.stSide(SX.game.save.story)] : null;
    const p = (t, c) => `<p${c ? ` class="${c}"` : ""}>${esc(t)}</p>`, base = "", live = "";
    if (!sd) return p(base) + p(live);
    if (r.pax) return p(base) + p(live) + (sd.rsLine ? p(sd.rsLine) : "");
    return (sd.endLines || [ base ]).map(t => p(t)).join("") + p(live) + (r.endNew ? p("" + sd.end + "」", "good") + sd.close.map(t => p(t)).join("") : "");
  };
  U.showResult = function(r) {
    const secs = r.secs;
    const barLines = new Set((r.bars || []).map(b => b.line)), pickH = resultPicked(r), leftH = resultRun(r) + resultBars(r);
    U.open("result", `<div class="win result stlRes" style="min-width:min(calc(var(--u)*250), 96vw)">\n      <div class="body center">\n        ${r.free ? `<div class="freeTag big">🎒 마지막 희망 판</div>` : ""}\n        <h1 class="${r.win ? "win1" : "lose1"}">${r.ending ? "서울을 떠났습니다" : r.win ? "탈출 성공" : "의식을 잃었습니다"}</h1>\n        ${r.ending ? `<div class="ending"><p>헬기가 한강 위로 떠오릅니다. 발밑으로 불 꺼진 서울이 멀어집니다.</p>${U.endMid(r)}${r.album ? "" : ""}${r.pax ? `<p>${esc("옆자리의 " + (SX.prog.ST_WHO[r.pax] || r.pax) + " 이(가) 멀어지는 서울을 끝까지 내려다봅니다.")}</p><p class="good">${esc("🚁 " + (SX.prog.ST_WHO[r.pax] || r.pax) + "")}</p>` : ""}<p class="small">${r.pax ? "…그리고 며칠 뒤, 헬기는 다시 빈자리 하나를 싣고 돌아왔습니다." : "…그리고 몇 주 뒤, 남겨 두고 온 사람들 소식을 듣고 다시 셸터로 돌아왔습니다. 서울에는 아직 할 일이 남았습니다."}</p>${r.first ? `` : ""}${SX.prog.ngOk && (SX.prog.ngOk(SX.game.save.eg) || SX.prog.egReady(SX.game.save.eg)) ? `<p class="small">단말기 [회차]에서 가진 것을 내려놓고 다시 처음부터(${(SX.game.save.ng | 0) + 2}회차) 시작할 수도 있습니다 — 보관함 · 숙련 보너스가 붙습니다.</p>` : ""}</div>` : ""}\n        ${r.paxLost ? `<p class="bad">${esc((SX.prog.ST_WHO[r.paxLost] || r.paxLost) + " 은(는) 이번 헬기에 못 탔습니다 — 장터로 돌아갔습니다. 다음 헬기에 다시 태웁니다(자리값은 이미 냈습니다)")}</p>` : ""}\n        <p class="stlR">${esc(r.building ? r.building.name : "건물")}${r.tod ? " · " + (r.tod === "night" ? "밤" : "낮") : ""}${r.wx && SX.wx && SX.wx.KINDS[r.wx] && SX.wx.KINDS[r.wx].name ? " · " + esc(SX.wx.KINDS[r.wx].name) : ""}${r.event ? " · " + esc(r.event.name) : ""} · ${Math.floor(secs / 60)}분 ${secs % 60}초 · 처치 ${r.kills}${r.kill2 && r.kills ? ` <span class="small">(약탈자 ${r.kill2.scav | 0} · 감염체 ${r.kill2.zombie | 0}${r.kill2.boss ? " · 두목 " + r.kill2.boss : ""})</span>` : ""}</p>\n        ${r.win ? `<p class="stlR stlMoneyR stlMoneyTop"><span class="stlMoneyL" data-en="Earned this raid">이번 판에 번 돈</span><b class="${r.gained >= 0 ? "good" : "bad"}" id="stlMoney">${r.gained >= 0 ? "+" : ""}${won(r.gained)}</b></p>` : ""}\n        ${r.lines.filter(l => !barLines.has(l)).map(l => `<p class="stlR">${esc(l)}</p>`).join("")}\n        ${r.recap && SX.recap ? `<div class="stlR">${SX.recap.html(r.recap)}</div>` : ""}\n        ${repOk(r) ? `<div class="row resRep stlR"><button id="resReport"${r.reported ? " disabled" : ""}>${r.reported === "ok" ? "신고했습니다" : r.reported ? "이미 신고했습니다" : "나를 쓰러뜨린 사람 신고"}</button></div>` : ""}\n        ${leftH || pickH ? `<div class="stlGrid${leftH && pickH ? "" : " one"}">${leftH ? `<div class="stlCol">${leftH}</div>` : ""}${pickH}</div>` : ""}\n        ${r.win ? "" : r.free ? `<p class="small stlR">받은 장비만 잃었습니다. 내 장비는 셸터에 그대로 있습니다.</p>` : `<p class="small stlR">가방과 장비를 잃었습니다. 셸터에 기본 장비가 있습니다.</p>`}\n        ${SX.net.badOrigin() ? "" : `<div class="row fbRate stlR" id="resRate"><span class="small">${r.rated != null ? "적었습니다 — 고맙습니다!" : "이번 판은 어떠셨습니까?"}</span>${[ [ -1, "너무 쉬웠어요" ], [ 0, "적당했어요" ], [ 1, "너무 어려웠어요" ] ].map(([v, t]) => `<button data-rate="${v}" class="${r.rated === v ? "on" : ""}">${t}</button>`).join("")}<button data-fb>의견 적기</button></div>`}\n        <button class="big" id="resOk">셸터로</button>\n      </div></div>`);
    $("resOk").onclick = () => {
      U.panelKind = null;
      U.closePanel();
      if (r.win) U.openStash();
    };
    {
      const root = panel.querySelector(".win.result");
      if (SX.settle && root) {
        SX.settle.icons(root);
        SX.settle.reveal(root, {
          gained: r.win ? r.gained : 0,
          win: !!r.win,
          skip: !!r._stl
        });
      }
      r._stl = 1;
    }
    if ($("resReport")) $("resReport").onclick = () => {
      if (!r.reported) reportAsk(r);
    };
    const rr = $("resRate");
    if (rr) rr.onclick = e => {
      const b = e.target.closest("button");
      if (!b) return;
      const raid = {
        seed: r.seed,
        b: r.building ? r.building.id : null,
        win: !!r.win,
        how: r.how || null,
        secs: r.secs
      };
      if (b.dataset.fb != null) {
        U.openFeedback({
          kind: "밸런스",
          raid,
          back: () => {
            U.showResult(r);
          }
        });
        return;
      }
      const v = +b.dataset.rate;
      r.rated = v;
      for (const q of rr.querySelectorAll("[data-rate]")) q.classList.toggle("on", +q.dataset.rate === v);
      rr.querySelector("span").textContent = "적었습니다 — 고맙습니다!";
      SX.net.feedback(Object.assign({
        kind: "판평가",
        rate: v,
        ctx: {
          ver: SX.BUILD,
          lang: SX.lang
        }
      }, raid)).then(q => {
        if (!q || !q.ok) {
          const s = $("resRate") && $("resRate").querySelector("span");
          if (s) s.textContent = "못 보냈습니다 — " + (q && q.msg || "서버에 못 닿습니다");
        }
      }).catch(() => {});
    };
  };
  U.showWipe = function() {
    U.open("wipe", `<div class="win result"><div class="body center"><h1 class="lose1">증상 발현</h1>\n      <p>억제약이 떨어졌습니다. 열이 오르고, 눈이 흐려집니다.</p><p><b>셸터부터 보관함 · 장비 · 돈까지 모든 것을 잃었습니다.</b></p><p>처음 시작할 때처럼 30만 원과 처음 장비(사제 파이프 권총 · 식칼 · 천 가방 · 기본 리그)를 받았습니다.</p><p class="small">겉모습 · 칭호 · 기록 · 회차는 남았습니다.</p><button class="big" id="wipeOk">처음부터</button></div></div>`);
    $("wipeOk").onclick = () => {
      U.panelKind = null;
      U.closePanel();
    };
  };
})(window.SX);
