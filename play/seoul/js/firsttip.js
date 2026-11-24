(function(SX) {
  "use strict";
  const U = SX.ui, G = SX.game, A = SX.actors, V = SX.view, esc = SX.esc;
  const T = SX.tips = {
    test: false,
    GAP: 1500,
    LIFE: 25e3,
    KEEP: 2500
  };
  const $ = s => document.querySelector(s);
  const now = () => performance.now();
  const TS = () => SX.TS || 32;
  const vet = s => SX.onboard && SX.onboard.vet ? !!SX.onboard.vet(s) : (s.runs | 0) > 0 || (s.extracts | 0) > 0 || (s.deaths | 0) > 0;
  T.fix = function(s) {
    if (!s || typeof s !== "object") return null;
    let f = s.ftips;
    if (!f || typeof f !== "object" || Array.isArray(f)) f = s.ftips = {
      seen: {},
      off: false,
      done: vet(s)
    };
    if (!f.seen || typeof f.seen !== "object" || Array.isArray(f.seen)) f.seen = {};
    f.off = !!f.off;
    f.done = !!f.done;
    return f;
  };
  if (G && typeof G.load === "function") {
    const ld = G.load;
    G.load = function() {
      const r = ld.apply(this, arguments);
      try {
        T.fix(G.save);
      } catch (e) {
        console.warn(e);
      }
      return r;
    };
  }
  const persist = () => {
    try {
      if (G.persist && G.state !== "title") G.persist();
    } catch (e) {}
  };
  function vis(el) {
    if (!el || el.closest(".hidden")) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0) return null;
    return [ r.left, r.top, r.width, r.height ];
  }
  const union = L => {
    L = L.filter(Boolean);
    if (!L.length) return null;
    const x0 = Math.min(...L.map(r => r[0])), y0 = Math.min(...L.map(r => r[1])), x1 = Math.max(...L.map(r => r[0] + r[2])), y1 = Math.max(...L.map(r => r[1] + r[3]));
    return [ x0, y0, x1 - x0, y1 - y0 ];
  };
  function wrect(x, y, w, h) {
    const cv = document.getElementById("screen");
    if (!cv || !V) return null;
    const cr = cv.getBoundingClientRect(), k = V.scale / (window.devicePixelRatio || 1), ts = TS();
    return [ cr.left + (x * ts - V.cam.x) * k, cr.top + (y * ts - V.cam.y) * k, w * ts * k, h * ts * k ];
  }
  const onScreen = (r, m) => {
    m = m == null ? 40 : m;
    return !!r && r[0] >= m && r[1] >= m && r[0] + r[2] <= innerWidth - m && r[1] + r[3] <= innerHeight - m;
  };
  const hubFloor = () => {
    try {
      return SX.hub && SX.hub.level ? SX.hub.floor() : null;
    } catch (e) {
      return null;
    }
  };
  const inHub = scene => G.state === "hub" && SX.hub && SX.hub.scene === scene;
  const npcRect = role => {
    const F = hubFloor(), n = F && (F.npcs || []).find(c => c.role === role);
    if (!n) return null;
    const r = wrect(n.x - .9, n.y - 1.7, 1.8, 2.3);
    return onScreen(r, 12) ? r : null;
  };
  const TIPS = T.TIPS = [ {
    id: "bleed",
    card: "inj",
    tn: "처음 안내 · 몸 상태",
    sides: [ "right", "bottom" ],
    tx: () => "피가 나고 있습니다. 그대로 두면 체력이 계속 샙니다.",
    sub: () => A.player && A.player.inj && A.player.inj.bleedH ? "지혈대 · 군용 응급 파우치 · 수술 키트로 멈춥니다. 단축 칸에 넣어 두면 키 하나로 씁니다." : "붕대 · 구급킷 · 지혈대로 멈춥니다. 단축 칸에 넣어 두면 키 하나로 씁니다.",
    find() {
      if (G.state !== "raid") return null;
      const p = A.player;
      if (!p || !p.inj) return null;
      const k = p.inj.bleedH ? "bleedH" : p.inj.bleedL ? "bleedL" : null;
      if (!k) return null;
      const r = vis($("#hudInj .inj.hot")) || vis($("#hudInj .inj:not(.buff)"));
      if (!r) return null;
      const out = {
        rings: [ r ],
        tags: []
      }, fix = String(((SX.INJURIES || {})[k] || {}).fix || "").split(" · ").map(s => s.trim()).filter(Boolean);
      const qs = document.querySelectorAll("#hudQuick > .qs"), Q = p.kit && p.kit.quick || [];
      for (let i = 0; i < Q.length; i++) {
        const it = Q[i] && SX.items.kitFind(p.kit, Q[i]);
        if (!it || !fix.includes(it.name)) continue;
        const r2 = vis(qs[i]);
        if (!r2) continue;
        out.rings.push(r2);
        out.tags.push({
          html: `<span>${esc(it.name)}</span> <b data-notr>[${esc(SX.label("q" + (i + 4)))}]</b>`,
          side: "top"
        });
        break;
      }
      return out;
    }
  }, {
    id: "raid_exit",
    card: "exit",
    tn: "처음 안내 · 출격",
    sides: [ "right", "left", "top", "bottom" ],
    tx: () => "초록 표시가 출구입니다. 그 안에 잠깐 서 있으면 나갑니다.",
    sub: () => {
      const lv = SX.raid.level;
      if (lv && lv.building && lv.building.train) return "연습장은 문이 안 잠깁니다. 다른 건물은 1층 출입문이 75초 뒤 잠깁니다.";
      if (SX.raid.flood) {
        const de = SX.raid.floodDoorEta();
        return de != null && de > 0 ? "침수 판입니다. 물이 무릎까지 차면(" + Math.ceil(de) + "초 뒤) 1층 문이 안 열립니다. 그 뒤에는 옥상 집라인이나 완강기로 나가십시오." : "침수 판입니다. 1층 문은 물에 막혔습니다. 옥상 집라인이나 완강기로 나가십시오.";
      }
      if (SX.raid.fire) return "화재 판입니다. 1층 문은 막혔고 집라인 줄은 끊겼습니다. 지하 주차장 출구나 완강기로 나가십시오.";
      return SX.raid.lockLeft > 25 ? "1층 출입문은 75초 뒤 잠깁니다. 그 뒤에는 옥상 집라인이나 완강기로 나가십시오." : "1층 출입문은 곧 잠깁니다. 잠기면 옥상 집라인이나 완강기로 나가십시오.";
    },
    find() {
      if (G.state !== "raid") return null;
      const R = SX.raid, lv = R.level, p = A.player;
      if (!lv || !p || (p.floor | 0) !== 0 || lv.outdoor || R.locked) return null;
      const F0 = lv.floors && lv.floors[0];
      if (!F0) return null;
      let best = null, bd = 1e9;
      for (const z of F0.zones || []) {
        if (z.kind !== "door" || z.locked) continue;
        const r = wrect(z.x, z.y, z.w, z.h);
        if (!onScreen(r, 50)) continue;
        const d = Math.hypot(z.x + z.w / 2 - p.x, z.y + z.h / 2 - p.y);
        if (d < bd) {
          bd = d;
          best = r;
        }
      }
      return best ? {
        rings: [ best ],
        tags: []
      } : null;
    }
  }, {
    id: "gas_time",
    card: "gas",
    tn: "처음 안내 · 출격",
    sides: [ "left", "bottom" ],
    tx: () => "여기서 남은 시간과 가스를 봅니다.",
    sub: () => "가스는 아래층부터 차오릅니다. 가스 속에 있으면 체력이 계속 닳습니다.",
    find() {
      if (G.state !== "raid") return null;
      const R = SX.raid, lv = R.level;
      if (!lv || lv.building && lv.building.train || !(R.t > 12)) return null;
      const box = $("#hudInfo");
      if (!box) return null;
      const r = union([ ...box.children ].filter(e => !e.className || e.classList.contains("gas") || e.classList.contains("lock")).map(vis));
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "door",
    card: "pick",
    tn: "처음 안내 · 셸터",
    sides: [ "right", "left", "top", "bottom" ],
    tx: () => "이 문으로 나가면 도심 지도가 열립니다.",
    sub: () => "지도에서 갈 건물을 고르고 출격합니다.",
    find() {
      if (!inHub("home")) return null;
      const F = hubFloor(), d = F && (F.doors || []).find(q => q.home);
      if (!d) return null;
      const r = wrect(d.cx - 1, d.cy - 1.9, 2, 2.4);
      return onScreen(r, 12) ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "market_sell",
    card: "shop",
    tn: "처음 안내 · 장터",
    sides: [ "right", "left", "top", "bottom" ],
    panel: true,
    tx: () => "주워 온 물건은 브로커에게 팝니다.",
    sub: () => U.isOpen() ? "이 [판매] 칸에서 팝니다. 물건 값의 75%를 쳐 줍니다." : "물건 값의 75%를 쳐 줍니다. 다가가 말을 거십시오.",
    find() {
      if (U.isOpen()) {
        if (U.panelKind !== "shop") return null;
        const g = $('#panel [data-grp="sell"]'), t = $('#panel [data-tab="broker"]');
        const on = e => !!e && (e.classList.contains("on") || e.classList.contains("sel") || e.classList.contains("gOn"));
        const pickEl = g && !on(g) && vis(g) ? g : t && !on(t) && vis(t) ? t : null;
        if (!pickEl) return null;
        const r = vis(pickEl);
        return r ? {
          rings: [ r ],
          tags: []
        } : null;
      }
      if (!inHub("market")) return null;
      const r = npcRect("broker");
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "needs",
    card: "needs",
    tn: "처음 안내 · 몸 상태",
    sides: [ "right", "bottom", "left" ],
    tx: () => "배고픔과 목마름입니다. 판 안에서만 줄어듭니다.",
    sub: () => "25 아래로 내려가면 기력이 더디게 찹니다. 가방에서 먹을 것 · 마실 것을 우클릭하면 먹습니다.",
    find() {
      const r = union([ ...document.querySelectorAll("#hudIcons [data-ic=food], #hudIcons [data-ic=water]") ].map(vis));
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "infect",
    card: "infect",
    tn: "처음 안내 · 몸 상태",
    sides: [ "right", "bottom", "left" ],
    tx: () => "감염 게이지입니다. 서울 공기의 옅은 가스가 몸에 쌓이는 양으로, 게임에 접속해 있는 동안 조금씩 오릅니다.",
    sub: () => "100%가 되면 집과 돈과 장비를 잃습니다. 차기 전에 증상 억제약을 드십시오.",
    find() {
      const r = vis($("#hudIcons [data-ic=virus]"));
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "mercs",
    card: "merc",
    tn: "처음 안내 · 장터",
    sides: [ "right", "left", "top", "bottom" ],
    tx: () => "용병소입니다. 다음 한 판에 용병 한 명을 데려갈 수 있습니다.",
    sub: () => "용병은 뒤따라오며 보이는 적을 쏩니다. 값은 쓸 때 냅니다.",
    find() {
      if (!inHub("market") || ((G.save && G.save.runs) | 0) < 2) return null;
      const r = npcRect("merc");
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "facility",
    card: "fac",
    tn: "처음 안내 · 셸터",
    sides: [ "left", "bottom", "right" ],
    tx: () => "설비가 가득 찼습니다.",
    sub: () => "장터 시장 창의 설비 탭에서 받거나 팔면 다시 쌓입니다.",
    find() {
      if (G.state !== "hub" || !$("#hudFac .full")) return null;
      const r = vis($("#hudFac"));
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  }, {
    id: "quests",
    card: "quest",
    tn: "처음 안내 · 의뢰",
    sides: [ "left", "bottom" ],
    tx: () => "추적 중인 이야기와 의뢰가 여기 뜹니다.",
    sub: () => "단말기 [의뢰]에서 무엇을 추적할지 고릅니다.",
    find() {
      const f = G.save && G.save.ftips;
      if (!(f && f.seen && f.seen.door) && ((G.save && G.save.runs) | 0) < 1) return null;
      const r = vis($("#hudInfo .trk"));
      return r ? {
        rings: [ r ],
        tags: []
      } : null;
    }
  } ];
  function calm(tip) {
    if (!G || G.state === "title" || !G.save) return false;
    if (SX.course && SX.course.on) return false;
    if (SX.photo && SX.photo.on) return false;
    if (SX.home && SX.home.deco) return false;
    const hud = document.getElementById("hud");
    if (!hud || hud.classList.contains("hidden")) return false;
    const bn = document.getElementById("bigNote");
    if (bn && bn.classList.contains("on")) return false;
    const det = document.getElementById("detail");
    if (det && !det.classList.contains("hidden")) return false;
    if (V && V.fadeA > .05) return false;
    if (G.state === "raid") {
      const R = SX.raid;
      if (!R.level || R.over || R.tutMode) return false;
    }
    if (SX.coop && SX.coop.spec) return false;
    const p = A && A.player;
    if (!p || p.hp <= 0 || p.down) return false;
    if (U.isOpen() && !(tip && tip.panel)) return false;
    return true;
  }
  let cur = null;
  let lastHide = -1e9, forced = null, raf = 0, sceneKey = "", sceneT = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (cls, html) => {
    const d = document.createElement("div");
    d.className = cls;
    if (html != null) d.innerHTML = html;
    document.body.appendChild(d);
    return d;
  };
  function arrowSvg(bx, by, tx, ty, hw) {
    const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const P = [ [ bx + nx * hw, by + ny * hw ], [ tx, ty ], [ bx - nx * hw, by - ny * hw ] ];
    const x0 = Math.min(...P.map(p => p[0])) - 8, y0 = Math.min(...P.map(p => p[1])) - 8, x1 = Math.max(...P.map(p => p[0])) + 8, y1 = Math.max(...P.map(p => p[1])) + 8;
    const pt = P.map(p => (p[0] - x0).toFixed(1) + "," + (p[1] - y0).toFixed(1)).join(" ");
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("class", "ftArrow");
    s.setAttribute("width", Math.ceil(x1 - x0));
    s.setAttribute("height", Math.ceil(y1 - y0));
    s.style.left = x0 + "px";
    s.style.top = y0 + "px";
    s.setAttribute("shape-rendering", "crispEdges");
    s.innerHTML = `<polygon points="${pt}" fill="rgba(12,16,22,.98)"/><polyline points="${pt}" fill="none" stroke="#000" stroke-width="10" stroke-linejoin="miter"/><polyline points="${pt}" fill="none" stroke="#6ab8e0" stroke-width="4" stroke-linejoin="miter"/>`;
    document.body.appendChild(s);
    return s;
  }
  const AVOID = [ "#hudTut", "#hudBars", "#hudInfo", "#hudQuick", "#hudWeapon", "#hudLog", "#hudInj", "#hudIcons", "#hudMapBox", "#hudFac" ];
  const area = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  function layout() {
    const c = cur, spec = c.spec, PAD = 8, A0 = 44;
    const rings = spec.rings.map(r => [ r[0] - PAD, r[1] - PAD, r[2] + 2 * PAD, r[3] + 2 * PAD ]);
    const b = c.box, bw = b.offsetWidth, bh = b.offsetHeight;
    if (c.key && b.matches(":hover")) return;
    const key = rings.map(r => r.map(v => Math.round(v)).join(",")).join("|") + "#" + bw + "x" + bh + "#" + innerWidth + "x" + innerHeight;
    if (key === c.key) return;
    c.key = key;
    for (const e of c.els) e.remove();
    c.els = [];
    for (const R of rings) {
      const d = mk("ftRing");
      Object.assign(d.style, {
        left: R[0] + "px",
        top: R[1] + "px",
        width: R[2] + "px",
        height: R[3] + "px"
      });
      c.els.push(d);
    }
    const tut = vis($("#hudTut")), av = AVOID.map(s => s === "#hudTut" ? null : vis($(s))).filter(Boolean);
    const R = rings[0], cx = R[0] + R[2] / 2, cy = R[1] + R[3] / 2;
    const at = sd => {
      let x, y;
      if (sd === "right") {
        x = R[0] + R[2] + A0;
        y = cy - bh / 2;
      } else if (sd === "left") {
        x = R[0] - A0 - bw;
        y = cy - bh / 2;
      } else if (sd === "bottom") {
        x = cx - bw / 2;
        y = R[1] + R[3] + A0;
      } else {
        x = cx - bw / 2;
        y = R[1] - A0 - bh;
      }
      x = clamp(x, 14, innerWidth - bw - 14);
      y = clamp(y, 14, innerHeight - bh - 14);
      if (tut && area([ x, y, bw, bh ], tut) > 0) y = Math.min(innerHeight - bh - 14, tut[1] + tut[3] + 12);
      return [ x, y ];
    };
    let best = null, bs = 1e18, prev = null;
    (c.tip.sides || [ "right", "left", "bottom", "top" ]).forEach((sd, i) => {
      const [x, y] = at(sd), q = [ x, y, bw, bh ];
      let s = i * 10;
      for (const r of rings) s += area(q, r) * 60;
      for (const r of av) s += area(q, r);
      if (tut) s += area(q, tut) * 1e3;
      if (sd === c.sd) prev = {
        sd,
        x,
        y,
        s,
        tu: tut ? area(q, tut) : 0
      };
      if (s < bs) {
        bs = s;
        best = {
          sd,
          x,
          y
        };
      }
    });
    if (prev && !prev.tu && prev.s < 2e5 && prev.s < bs + 25e3) best = prev;
    c.sd = best.sd;
    const {sd, x, y} = best;
    b.style.left = x + "px";
    b.style.top = y + "px";
    const ins = (v, a, z) => clamp(v, a, Math.max(a, z));
    if (sd === "right" && x > R[0] + R[2]) c.els.push(arrowSvg(x + 10, ins(cy, y + 30, y + bh - 30), R[0] + R[2] + 4, ins(cy, R[1] + 8, R[1] + R[3] - 8), 17)); else if (sd === "left" && x + bw < R[0]) c.els.push(arrowSvg(x + bw - 10, ins(cy, y + 30, y + bh - 30), R[0] - 4, ins(cy, R[1] + 8, R[1] + R[3] - 8), 17)); else if (sd === "bottom" && y > R[1] + R[3]) c.els.push(arrowSvg(ins(cx, x + 30, x + bw - 30), y + 10, ins(cx, R[0] + 8, R[0] + R[2] - 8), R[1] + R[3] + 4, 17)); else if (sd === "top" && y + bh < R[1]) c.els.push(arrowSvg(ins(cx, x + 30, x + bw - 30), y + bh - 10, ins(cx, R[0] + 8, R[0] + R[2] - 8), R[1] - 4, 17));
    (spec.tags || []).forEach((t, i) => {
      const r = rings[i + 1];
      if (!r) return;
      const g = mk("ftTag", t.html);
      c.els.push(g);
      const gw = g.offsetWidth, gh = g.offsetHeight, a = 30, gx = r[0] + r[2] / 2, gy = r[1] + r[3] / 2;
      let X, Y;
      if (t.side === "top") {
        X = gx - gw / 2;
        Y = r[1] - a - gh;
      } else if (t.side === "right") {
        X = r[0] + r[2] + a;
        Y = gy - gh / 2;
      } else {
        X = r[0] - a - gw;
        Y = gy - gh / 2;
      }
      X = clamp(X, 14, innerWidth - gw - 14);
      Y = clamp(Y, 14, innerHeight - gh - 14);
      g.style.left = X + "px";
      g.style.top = Y + "px";
      if (t.side === "top") c.els.push(arrowSvg(gx, Y + gh - 8, gx, r[1] - 4, 13)); else if (t.side === "right") c.els.push(arrowSvg(X + 8, gy, r[0] + r[2] + 4, gy, 13)); else c.els.push(arrowSvg(X + gw - 8, gy, r[0] - 4, gy, 13));
    });
  }
  function show(tip, spec) {
    const b = mk("ftBox");
    b.setAttribute("role", "dialog");
    b.dataset.tip = tip.id;
    b.innerHTML = `<div class="ftTn">${esc(tip.tn)}</div><div class="ftTx">${esc(tip.tx())}</div>${tip.sub ? `<div class="ftSub">${esc(tip.sub())}</div>` : ""}` + `<div class="ftRow"><button class="mini ftOk">알겠어요</button><button class="mini ftHelp">도움말에서 보기</button><span class="ftKey" data-notr>[${esc(SX.label("menu") || "Esc")}]</span><span class="sp"></span><button class="ftOff">안내 끄기</button></div>`;
    for (const ev of [ "mousedown", "pointerdown", "mouseup", "pointerup", "contextmenu", "wheel" ]) b.addEventListener(ev, e => e.stopPropagation());
    b.addEventListener("click", e => {
      e.stopPropagation();
      const t = e.target;
      if (t.closest(".ftOk")) {
        click();
        T.close(true);
      } else if (t.closest(".ftHelp")) {
        click();
        const card = tip.card;
        T.close(true);
        if (U.openHelp) U.openHelp(card);
      } else if (t.closest(".ftOff")) {
        click();
        T.turnOff();
      }
    });
    cur = {
      tip,
      spec,
      t0: now(),
      els: [],
      box: b,
      key: ""
    };
    layout();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  const click = () => {
    try {
      SX.audio && SX.audio.play("click");
    } catch (e) {}
  };
  T.close = function(seen) {
    if (!cur) return;
    const c = cur;
    cur = null;
    lastHide = now();
    for (const e of c.els) e.remove();
    c.box.remove();
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (forced === c.tip.id) forced = null;
    if (seen && G.save) {
      const f = T.fix(G.save);
      if (f) {
        f.seen[c.tip.id] = 1;
        persist();
      }
    }
  };
  T.turnOff = function() {
    T.close(true);
    const f = G.save && T.fix(G.save);
    if (!f) return;
    if (SX.tut && SX.tut.off) SX.tut.off(true);
    f.off = true;
    persist();
    SX.log && SX.log("처음 안내를 껐습니다 — 도움말의 「처음 안내 다시 보기」로 다시 켭니다");
  };
  T.replay = function() {
    if (!G.save) return;
    if (SX.tut && SX.tut.restart) SX.tut.restart();
    G.save.ftips = {
      seen: {},
      off: false,
      done: false
    };
    persist();
    SX.log && SX.log("처음 안내를 다시 켰습니다 — 처음 마주칠 때 다시 뜹니다", "good");
  };
  T.anyOn = function() {
    if (SX.tut && SX.tut.cur && SX.tut.cur()) return true;
    const f = G.save && T.fix(G.save);
    return !!f && !f.off && !f.done && TIPS.some(t => !f.seen[t.id]);
  };
  T.cur = () => cur ? {
    id: cur.tip.id,
    card: cur.tip.card
  } : null;
  T.seenCur = () => T.close(true);
  T.force = id => {
    forced = id || null;
    lastHide = -1e9;
    T.tick();
    return T.cur();
  };
  T.state = () => G.save ? T.fix(G.save) : null;
  function frame() {
    raf = 0;
    if (!cur) return;
    const c = cur, spec = calm(c.tip) ? c.tip.find() : null;
    if (!spec) {
      T.close(now() - c.t0 >= T.KEEP);
      return;
    }
    if (now() - c.t0 > T.LIFE) {
      T.close(true);
      return;
    }
    c.spec = spec;
    layout();
    raf = requestAnimationFrame(frame);
  }
  T.tick = function() {
    if (T.test && !forced) return;
    if (!G || !G.save || G.state === "title") {
      if (cur) T.close(false);
      return;
    }
    const f = T.fix(G.save);
    if (!f) return;
    const sk = G.state + ":" + (G.state === "hub" && SX.hub ? SX.hub.scene : "") + ":" + (U.isOpen() ? U.panelKind : "");
    if (sk !== sceneKey) {
      sceneKey = sk;
      sceneT = now();
    }
    if (cur) {
      if (!raf) raf = requestAnimationFrame(frame);
      return;
    }
    if (forced) {
      const tip = TIPS.find(t => t.id === forced), spec = tip && calm(tip) && tip.find();
      if (spec) show(tip, spec);
      return;
    }
    if (f.off || f.done) return;
    if (now() - lastHide < T.GAP || now() - sceneT < 1200) return;
    for (const tip of TIPS) {
      if (f.seen[tip.id]) continue;
      if (!calm(tip)) continue;
      let spec = null;
      try {
        spec = tip.find();
      } catch (e) {
        spec = null;
      }
      if (spec) {
        show(tip, spec);
        return;
      }
    }
  };
  setInterval(() => {
    try {
      T.tick();
    } catch (e) {
      console.warn(e);
    }
  }, 250);
  addEventListener("keydown", e => {
    if (!cur || e.isComposing || e.repeat) return;
    if (e.code === "Escape" || e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      T.close(true);
    }
  }, true);
  if (U && typeof U.openMenu === "function") {
    const om = U.openMenu;
    U.openMenu = function() {
      if (cur && !cur.tip.panel && !U.isOpen()) {
        T.close(true);
        return;
      }
      return om.apply(this, arguments);
    };
  }
})(window.SX);
