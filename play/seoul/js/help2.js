(function(SX) {
  "use strict";
  const U = SX.ui, esc = SX.esc;
  if (!U || typeof U.openHelp !== "function") return;
  const textHelp = U.openHelp;
  U.openHelpText = function() {
    return textHelp.apply(U, arguments);
  };
  const grab = () => {
    U._helpGrab = true;
    try {
      return textHelp.call(U);
    } finally {
      U._helpGrab = false;
    }
  };
  const MORE = "자세히 ▾", LESS = "접기 ▴";
  const GROUPS = [ {
    id: "start",
    n: "처음 시작",
    ic: [ "열쇠 꾸러미", "태블릿", "무전기" ],
    hic: [ "태블릿" ],
    sub: "처음 시작 · 조작 키 · 게임패드",
    lead: "무엇을 하는 게임인지, 어떻게 움직이는지 봅니다",
    cards: [ "start", "keys", "pad" ]
  }, {
    id: "raid",
    n: "출격",
    ic: [ "9mm 탄 상자", "K5 권총", "M16A1 소총" ],
    hic: [ "K5 권총", "M16A1 소총", "9mm 탄 상자" ],
    sub: "출구 · 가스 · 숨기 · 가방 · 쓰러짐",
    lead: "건물에 들어가 챙기고, 살아서 나옵니다",
    cards: [ "exit", "gas", "tac", "bag", "down" ]
  }, {
    id: "body",
    n: "몸 돌보기",
    ic: [ "구급킷", "붕대" ],
    sub: "부상 · 배고픔 · 목마름",
    lead: "다치고, 배고프고, 목마른 것을 챙깁니다",
    cards: [ "inj", "needs" ]
  } ];
  const CARDS = {
    start: {
      t: "처음 시작",
      s: "연립주택에서 쓸 만한 것을 챙겨 살아 나오는 체험판입니다.",
      img: "raid"
    },
    story: {
      t: "이야기와 서울 탈출",
      s: "장터 사람들의 임무를 하면 새 건물이 열리고, 끝엔 헬기로 서울을 떠납니다.",
      ic: [ [ "무전기" ], [ "태블릿" ] ]
    },
    keys: {
      t: "조작 키",
      s: "키는 메뉴 [설정]의 「조작 · 키」 쪽에서 바꿉니다.",
      keys: true
    },
    pad: {
      t: "게임패드",
      s: "게임패드를 꽂고 아무 단추나 누르면 됩니다.",
      pad: true
    },
    pick: {
      t: "건물 고르기",
      s: "처음엔 연립주택부터. 위험 이름표가 셀수록 좋은 물건이 많습니다.",
      img: "citymap"
    },
    exit: {
      t: "나가는 길",
      s: "초록 표시가 출구입니다. 1층 출입문은 75초 뒤 잠깁니다.",
      img: "exit"
    },
    gas: {
      t: "가스와 시간",
      s: "가스는 아래층부터 찹니다. 오른쪽 위 남은 시간을 보십시오.",
      img: "gas"
    },
    tac: {
      t: "숨고 엿보기",
      s: "벽 모서리에 붙으면 엿보고, 낮은 것 뒤에 앉으면 숨습니다.",
      img: "cover"
    },
    bag: {
      t: "가방과 물건",
      s: "판에는 가방 · 리그에 넣은 것만 들고 갑니다. 끌어서 옮깁니다.",
      img: "bag"
    },
    down: {
      t: "의식을 잃으면",
      s: "들고 있던 것을 모두 두고 옵니다. 끝 화면에서 다시 할 수 있습니다.",
      img: "raid"
    },
    inj: {
      t: "부상과 약",
      s: "다치면 체력 막대 밑에 무엇을 다쳤고 무슨 약을 쓰면 되는지 뜹니다. 피가 나면 붕대나 지혈대로 멈춥니다.",
      img: "bleed",
      ic: [ [ "붕대" ], [ "지혈대" ], [ "구급킷" ] ]
    },
    needs: {
      t: "배고픔과 목마름",
      s: "판 안에서만 줄어듭니다. 25 아래면 기력이 더디게 찹니다.",
      img: "needs",
      ic: [ [ "참치캔", "통조림" ], [ "생수병", "생수" ] ]
    },
    infect: {
      t: "감염 게이지",
      s: "몸에 쌓인 가스 양입니다. 접속해 있는 동안 오릅니다. 차기 전에 증상 억제약을 드십시오.",
      img: "infect",
      ic: [ [ "증상 억제약", "억제약" ] ]
    },
    skill: {
      t: "숙련과 훈련",
      s: "쏘고 · 뒤지고 · 치료할수록 늡니다. 단말기 [상태]에서 봅니다.",
      img: "skill"
    },
    home: {
      t: "셸터",
      s: "내 집입니다. 보관함과 침대가 있고, 현관문을 나서면 도심 지도로 갑니다.",
      img: "home"
    },
    deco: {
      t: "꾸미기",
      s: "가구점에서 산 가구를 놓고, 돌리고, 색을 바꿉니다.",
      img: "deco"
    },
    fac: {
      t: "설비",
      s: "실제 시간으로 하루면 가득 찹니다. 받거나 팔면 다시 쌓입니다.",
      ic: [ [ "노트북", "태블릿" ], [ "금괴" ] ]
    },
    farm: {
      t: "텃밭과 물과 요리",
      s: "씨앗을 심고 물을 주면 자랍니다. 정수기 · 냉장고 · 조리대도 씁니다.",
      ic: [ [ "상추 씨앗", "화분" ], [ "상추" ], [ "구운 생선" ] ]
    },
    shop: {
      t: "장터와 상인",
      s: "브로커는 물건 값의 75%를 쳐 줍니다. 좌판은 판을 다녀오면 바뀝니다.",
      img: "market"
    },
    quest: {
      t: "의뢰",
      s: "상인마다 의뢰 두 개를 같이 진행합니다. 추적하면 오른쪽 위에 뜹니다.",
      ic: [ [ "무전기" ], [ "열쇠 꾸러미" ] ]
    },
    merc: {
      t: "용병",
      s: "다음 한 판에 한 명이 따라와 보이는 적을 쏩니다. 값은 쓸 때 냅니다.",
      ic: [ [ "K2 소총" ], [ "M16A1 소총" ] ]
    },
    people: {
      t: "사람들과 즐길 거리",
      s: "말을 걸면 소문을 듣습니다. 헬스장 · 사격장 · 낚시터도 있습니다.",
      ic: [ [ "잉어", "낚싯대" ], [ "K5 권총" ] ]
    },
    coop: {
      t: "같이 하기",
      s: "파티를 만들어 함께 출격합니다. 같은 팀끼리는 다치지 않습니다.",
      ic: [ [ "무전기" ] ]
    },
    rec: {
      t: "기록 · 칭호 · 순위",
      s: "단말기 [기록] · [순위]에서 과제 · 칭호 · 이번 주 순위를 봅니다.",
      ic: [ [ "금괴" ], [ "태블릿" ] ]
    },
    acct: {
      t: "계정과 저장",
      s: "진행은 서버에 저장됩니다. 복구 코드는 꼭 보관해 두십시오.",
      ic: [ [ "태블릿" ], [ "열쇠 꾸러미" ] ]
    },
    set: {
      t: "설정과 팁",
      s: "화면 · 소리 · 모드를 바꾸고, 사진 모드로 사진을 찍습니다.",
      ic: [ [ "태블릿" ], [ "무전기" ] ]
    }
  };
  const SEC = {
    "처음 시작": "start",
    "판(출격)": "pick",
    전술: "tac",
    "가방 · 물건": "bag",
    "부상과 약": "inj",
    "배고픔 · 목마름": "needs",
    셸터: "home",
    꾸미기: "deco",
    설비: "fac",
    "텃밭 · 물 · 요리": "farm",
    "장터 · 상인": "shop",
    의뢰: "quest",
    용병: "merc",
    "장터 사람들 · 헬스장 · 사격장 · 낚시터": "people",
    "이야기 · 서울 탈출": "story",
    "숙련 · 훈련": "skill",
    "같이 하기": "coop",
    "기록 · 칭호 · 주간 도전 · 순위": "rec",
    "감염 게이지": "infect",
    "계정 · 저장": "acct",
    "설정 · 팁": "set",
    "조작 키": "keys",
    게임패드: "pad"
  };
  const RAID_SPLIT = [ [ /나가는 길|1층 출입문은|출구에서는|바깥 지도입니다/, "exit" ], [ /가스 속에|무전 기록/, "gas" ], [ /의식을 잃으면|결과 창|<b>적<\/b>/, "down" ], [ /줍기·뒤지기·문/, "keys" ], [ /우클릭 조준 사격/, "tac" ] ];
  const cardOf = (sec, html) => {
    if (sec === "판(출격)") {
      for (const [re, c] of RAID_SPLIT) if (re.test(html)) return c;
      return "pick";
    }
    return SEC[sec] || "set";
  };
  const groupOf = cid => {
    for (const g of GROUPS) if (g.cards && g.cards.includes(cid)) return g.id;
    return "start";
  };
  const LOOP = [ {
    n: 1,
    t: "셸터",
    p: "보관함에서 챙길 것을 골라 가방과 리그에 넣습니다.",
    g: "home",
    img: "home"
  }, {
    n: 2,
    t: "도심 지도",
    p: "현관문을 나서 갈 건물을 고릅니다. 처음엔 연립주택부터.",
    g: "raid",
    img: "citymap"
  }, {
    n: 3,
    t: "출격",
    p: "건물 안 상자 · 서랍을 뒤져 쓸 만한 것을 챙깁니다.",
    g: "raid",
    img: "raid"
  }, {
    n: 4,
    t: "탈출",
    p: "초록 출구로 살아 나와야 챙긴 것이 남습니다.",
    g: "raid",
    img: "exit"
  }, {
    n: 5,
    t: "장터",
    p: "주워 온 것을 팔고 탄 · 약을 삽니다.",
    g: "market",
    img: "market"
  }, {
    n: 6,
    t: "꾸미기",
    p: "번 돈으로 가구를 사 셸터를 넓히고 꾸밉니다.",
    g: "home",
    img: "deco"
  } ];
  function build() {
    const g = grab() || {
      S: [],
      SI: []
    }, parts = {};
    const OFF = /셸터|장터|시장|상인|도심|파티|친구|보험|마지막 희망|로그인|서버|계정|이야기|의뢰|용병|헬기|부동산|밥집|약재상|방어구상|무기상|가구점|브로커|밀수꾼|주간|순위|칭호|거점|회차|작전|모드|한강|지하철|터널|재개발|공사장|군부대|사무동|고등학교|상가|병원|연습장|결과 창|창을 닫고|보관함|같은 팀|임무/;
    const keep = h => String(h).split(/(?<=다\.|\.\))\s+/).filter(x => !OFF.test(x)).join(" ").trim();
    g.SI = (g.SI || []).map(L => (L || []).map(keep).filter(Boolean));
    g.S.forEach((t, i) => {
      const own = SEC[t] || "set", by = new Map;
      for (const h of g.SI[i] || []) {
        const c = cardOf(t, h);
        if (!by.has(c)) by.set(c, []);
        by.get(c).push(h);
      }
      if (!by.size) by.set(own, []);
      for (const [c, items] of by) {
        const extra = c === own ? t === "조작 키" ? g.keys || "" : t === "게임패드" ? g.pad || "" : "" : "";
        (parts[c] = parts[c] || []).push({
          sec: t,
          i,
          own: c === own && SEC[t] === c,
          items,
          extra
        });
      }
    });
    return parts;
  }
  let D = {};
  function detail(cid) {
    if (cid === "start") {
      const K = id => `<b>[${esc(SX.label(id) || "")}]</b>`;
      return `<div class="help"><ul>` + `<li>서울탈출은 무너진 서울에서 건물에 들어가 쓸 만한 물건을 챙겨 살아 나오는 게임입니다. 체험판에서는 정해 둔 장비로 연립주택 한 곳에 들어갑니다.</li>` + `<li>상자 · 서랍 · 가구에 다가가 ${K("interact")} 를 누르면 뒤집니다. 물건은 하나씩 드러나고, 다 뒤지면 「전부 가져가기」로 한 번에 챙깁니다.</li>` + `<li>나가는 곳은 1층 출입문 · 옥상 집라인 · 완강기입니다. 1층 출입문은 들어온 지 75초 뒤 잠깁니다. ${K("terminal")} 지도에서 초록이 출구입니다.</li>` + `<li>살아 나오면 끝 화면에 챙긴 물건을 보여 드립니다. 쓰러지면 들고 있던 것을 모두 두고 옵니다.</li>` + `<li>체험판은 진행을 저장하지 않습니다. 「다시 하기」를 누르면 처음 장비로 새 판을 시작합니다.</li>` + `</ul></div>`;
    }
    const P = (D[cid] || []).slice().sort((a, b) => b.own - a.own || a.i - b.i);
    const showH = P.length > 1 || P[0] && !P[0].own;
    return `<div class="help">` + P.map(p => (showH ? `<h3>${esc(p.sec)}</h3>` : "") + (p.items.length ? `<ul>` + p.items.map(s => `<li>${s}</li>`).join("") + `</ul>` : "") + (p.extra || "")).join("") + `</div>`;
  }
  const icAttr = L => (L || []).map(x => [].concat(x).join("|")).join(";");
  const fit = (p, ic, more) => `<div class="hb2Pic hb2Fit"${p ? ` data-pic="${p}"` : ""}${ic ? ` data-ic="${esc(ic)}"` : ""}${more || ""}></div>`;
  const pic = n => fit(n, "");
  function icon(names) {
    for (const nm of [].concat(names)) {
      let d = null;
      try {
        d = SX.items.def(nm);
      } catch (e) {}
      if (!d) continue;
      return {
        name: d.name || nm
      };
    }
    return null;
  }
  const icons = c => (c.ic || []).map(icon).filter(Boolean);
  function keyCaps(mini) {
    const L = id => `<kbd data-notr>${esc(SX.label(id) || "-")}</kbd>`;
    if (mini) return `<span>${L("up")}${L("left")}${L("down")}${L("right")}</span>`;
    return `<span>${L("up")}${L("left")}${L("down")}${L("right")}<span>걷기</span></span>` + [ [ "interact", "줍기" ], [ "inventory", "가방" ], [ "reload", "재장전" ], [ "terminal", "단말기" ], [ "help", "도움말" ] ].map(([id, t]) => `<span>${L(id)}<span>${t}</span></span>`).join("");
  }
  const padCaps = mini => (mini ? [ "A", "B", "X", "Y" ] : [ "A", "B", "X", "Y", "LB", "RB", "LT", "RT" ]).map(k => `<span><kbd data-notr>${k}</kbd></span>`).join("");
  function vis(c, mode) {
    if (c.keys) return `<div class="hb2Vis hb2Keys">${keyCaps(mode === "mini")}</div>`;
    if (c.pad) return `<div class="hb2Vis hb2Keys hb2Pad">${padCaps(mode === "mini")}</div>`;
    if (mode === "open") {
      const I = icons(c), figs = I.length ? `<div class="hb2Icons">` + I.map(o => `<figure>${fit("", o.name)}<figcaption>${esc(o.name)}</figcaption></figure>`).join("") + `</div>` : "";
      return (c.img ? pic(c.img) : fit("", icAttr(c.ic))) + figs;
    }
    if (mode === "mini") return c.img ? pic(c.img) : fit("", icAttr((c.ic || []).slice(0, 2)));
    return fit(c.img || "", icAttr(c.ic));
  }
  const st = {
    g: "start",
    open: null
  };
  const shown = cid => cid !== "pad" || !!SX.pad;
  function sideHtml() {
    return GROUPS.map(g => {
      const ic = g.emo ? `<span class="ic">${g.emo}</span>` : `<span class="ic hb2Fit" data-mode="best" data-ic="${esc((g.ic || []).join(";"))}"></span>`;
      return `<button class="hb2G${g.id === "loop" ? " loop" : ""}${st.g === g.id ? " on" : ""}" data-hg="${g.id}">${ic}<span class="tx"><b>${esc(g.n)}</b><small>${esc(g.sub)}</small></span></button>`;
    }).join("");
  }
  function loopHtml() {
    const gn = id => (GROUPS.find(g => g.id === id) || {}).n || "";
    const node = o => `<button class="hb2Node" data-go="${o.g}"><span class="num">${o.n}</span><h4><span>${esc(o.t)}</span><small><span>${esc(gn(o.g))}</span> ▸</small></h4><p>${esc(o.p)}</p>${pic(o.img)}</button>`;
    const ar = c => `<div class="hb2Ar">${c}</div>`;
    const N = LOOP.map(node);
    return `<div class="hb2Head"><h3><i>🔁</i><span>하루 흐름</span></h3><p>이 여섯 가지를 되풀이하는 게임입니다 — 그림을 누르면 그 묶음 설명으로 갑니다</p></div>` + `<div class="hb2Loop">${N[0]}${ar("▶")}${N[1]}${ar("▶")}${N[2]}` + `${ar("▲")}<div class="hb2Mid"><i>🚁</i><span>돌고 돌며 돈을 모아 셸터를 넓힙니다<br><b>끝엔 헬기를 타고 서울을 떠납니다</b></span></div>${ar("▼")}` + `${N[5]}${ar("◀")}${N[4]}${ar("◀")}${N[3]}</div>`;
  }
  function groupHtml() {
    const g = GROUPS.find(x => x.id === st.g) || GROUPS[1], ids = g.cards.filter(shown);
    const open = ids.includes(st.open) ? st.open : null;
    const head = `<div class="hb2Head"><h3><span class="hb2HIc hb2Fit" data-mode="best" data-maxw="44" data-ic="${esc((g.hic || g.ic || []).join(";"))}"></span><span>${esc(g.n)}</span></h3><p>${esc(g.lead)}</p></div>`;
    const card = cid => {
      const c = CARDS[cid];
      if (open) return `<div class="hb2Card mini${cid === open ? " on" : ""}" data-card="${cid}"><div class="th">${vis(c, "mini")}</div><div class="tx"><h4>${esc(c.t)}</h4><p>${esc(c.s)}</p></div></div>`;
      return `<div class="hb2Card" data-card="${cid}">${vis(c, "card")}<h4>${esc(c.t)}</h4><p>${esc(c.s)}</p><div class="more"><button class="hb2More" data-alt="${LESS}" data-more="${cid}">${MORE}</button></div></div>`;
    };
    if (open) {
      const full = cid => {
        const c = CARDS[cid];
        return `<div class="hb2Card open" data-card="${cid}"><div class="top">${vis(c, "open")}</div><div class="hd"><h4>${esc(c.t)}</h4>` + `<button class="hb2More" data-alt="${MORE}" data-less="1" data-more="${cid}">${LESS}</button></div><p>${esc(c.s)}</p><div class="hb2Det"${cid === open ? ' id="hb2Det"' : ""}>${detail(cid)}</div></div>`;
      };
      return head + `<div class="hb2Cards opened"><div class="hb2List" id="hb2List">${ids.map(full).join("")}</div><div class="hb2Toc">${ids.map(card).join("")}</div></div>`;
    }
    const cls = ids.length > 4 ? "g6" : "g4";
    return head + `<div class="hb2Cards ${cls}">` + ids.map(card).join("") + `</div>`;
  }
  let pin = null;
  function mark(L) {
    const cs = [ ...L.children ];
    if (!cs.length) return;
    let cur = cs[0];
    if (pin) cur = cs.find(c => c.dataset.card === pin) || cur; else if (L.scrollTop + L.clientHeight >= L.scrollHeight - 2) cur = cs[cs.length - 1]; else for (const c of cs) if (c.offsetTop - cs[0].offsetTop <= L.scrollTop + 8) cur = c;
    st.open = cur.dataset.card;
    for (const m of document.querySelectorAll("#panel .hb2Toc .hb2Card")) m.classList.toggle("on", m.dataset.card === st.open);
  }
  function jump(cid, smooth) {
    const L = document.getElementById("hb2List");
    if (!L || !L.firstElementChild) return;
    const c = L.querySelector(`[data-card="${cid}"]`);
    if (!c) return;
    pin = cid;
    L.scrollTo({
      top: c.offsetTop - L.firstElementChild.offsetTop,
      behavior: smooth ? "smooth" : "auto"
    });
    mark(L);
  }
  function listSetup() {
    pin = null;
    const L = document.getElementById("hb2List");
    if (!L) return;
    const unpin = () => {
      pin = null;
    };
    L.addEventListener("wheel", unpin, {
      passive: true
    });
    L.addEventListener("pointerdown", unpin);
    L.addEventListener("keydown", unpin);
    L.addEventListener("scroll", () => mark(L), {
      passive: true
    });
    jump(st.open, false);
  }
  function render() {
    const m = document.getElementById("hb2Main");
    if (!m) return;
    for (const b of document.querySelectorAll("#panel .hb2G")) b.classList.toggle("on", b.dataset.hg === st.g);
    m.innerHTML = st.g === "loop" ? loopHtml() : groupHtml();
    if (SX.helpPic) SX.helpPic.fit(m.closest(".hb2Win") || m);
    listSetup();
  }
  const click = () => {
    SX.audio && SX.audio.play("click");
  };
  function bind(win) {
    win.addEventListener("click", e => {
      const t = e.target;
      const re = t.closest("[data-tipsre]");
      if (re) {
        click();
        if (SX.tips && SX.tips.replay) SX.tips.replay();
        if (!re.classList.contains("done")) {
          const a = re.dataset.alt;
          re.dataset.alt = re.textContent;
          re.textContent = a;
          re.classList.add("done");
        }
        return;
      }
      const g = t.closest("[data-hg]");
      if (g) {
        click();
        go(g.dataset.hg, null);
        return;
      }
      const n = t.closest("[data-go]");
      if (n) {
        click();
        go(n.dataset.go, null);
        return;
      }
      const ls = t.closest("[data-less]");
      if (ls) {
        click();
        go(st.g, null);
        return;
      }
      const tc = t.closest(".hb2Toc [data-card]");
      if (tc) {
        click();
        jump(tc.dataset.card, true);
        return;
      }
      const mo = t.closest("[data-more]");
      if (mo) {
        click();
        go(st.g, mo.dataset.less || st.open === mo.dataset.more ? null : mo.dataset.more);
        return;
      }
      const c = t.closest("[data-card]");
      if (c && !c.classList.contains("open")) {
        click();
        go(st.g, c.dataset.card);
      }
    });
    win.addEventListener("error", e => {
      const im = e.target;
      if (!im || im.tagName !== "IMG" || !im.dataset.ko) return;
      if (im.getAttribute("src") !== im.dataset.ko) im.setAttribute("src", im.dataset.ko); else im.style.visibility = "hidden";
    }, true);
  }
  function go(g, open) {
    st.g = GROUPS.some(x => x.id === g) ? g : "start";
    st.open = open && CARDS[open] ? open : null;
    if (U.panelKind !== "help" || !document.getElementById("hb2Main")) return U.openHelp();
    render();
  }
  U.openHelp = function(card) {
    if (typeof card !== "string") card = null;
    if (!card && SX.tips && SX.tips.cur) {
      const c = SX.tips.cur();
      if (c && c.card) {
        card = c.card;
        if (SX.tips.seenCur) SX.tips.seenCur();
      }
    }
    if (card && CARDS[card]) {
      st.g = groupOf(card);
      st.open = card;
    }
    D = build();
    U.open("help", `<div class="win wL hb2Win"><header><h2>도움말 · 규칙</h2><button class="hb2Re" data-tipsre data-alt="다시 켰습니다 ✓" title="처음 마주칠 때 뜨는 말풍선을 다시 켭니다">처음 안내 다시 보기</button>` + `<button class="x" data-close>닫기 ✕</button></header><div class="hb2"><div class="hb2Side">${sideHtml()}</div><div class="hb2Main" id="hb2Main"></div></div></div>`);
    const win = document.querySelector("#panel .hb2Win");
    if (!win) return;
    bind(win);
    render();
  };
  U.help2 = {
    GROUPS,
    CARDS,
    LOOP,
    cardOf,
    groupOf,
    go,
    state: () => ({
      g: st.g,
      open: st.open
    }),
    data: () => D = build(),
    detail: cid => {
      D = build();
      return detail(cid);
    }
  };
})(window.SX);
