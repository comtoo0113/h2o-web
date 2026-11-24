(function(SX) {
  "use strict";
  const G = SX.game, U = SX.ui, I = SX.items, V = SX.view;
  const SITE = "../../index.html";
  const T = SX.trial = {
    runs: 0,
    last: null
  };
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
  const EXIT = {
    zip: "옥상 집라인을 타고",
    door: "1층 출입문으로",
    flare: "구조 신호탄을 쏘고",
    escape: "완강기를 타고",
    heli: "헬기를 타고",
    park: "지하 주차장 출구로"
  };
  U.openCoop = function() {};
  U.openMods = function() {};
  U.openAccount = function() {};
  U.nickAsk = function() {};
  U.askQuit = function() {
    U.ask("사이트로 돌아가기", "", 0, () => {
      location.href = SITE;
    }, null, {
      yes: "돌아가기",
      q: "체험판을 끝내고 사이트로 돌아가시겠습니까?",
      safe: true
    });
  };
  U.quitGame = function() {
    location.href = SITE;
  };
  U.trackList = function() {
    return [];
  };
  U.needList = function() {
    return [];
  };
  function trialKit() {
    const k = I.newKit();
    k.w1 = I.mk("K5 권총");
    if (k.w1) k.w1.ammo = k.w1.magSize || 13;
    const g = k.rig && k.rig.grid;
    if (g) {
      {
        const m = I.mk("9mm 탄창");
        if (m) {
          m.ammo = 24;
          I.put(g, m);
        }
      }
      const b1 = I.mk("붕대"), b2 = I.mk("붕대"), pk = I.mk("진통제");
      for (const it of [ b1, b2, pk ]) if (it) I.put(g, it);
      if (b1) k.quick[0] = b1.id;
      if (pk) k.quick[1] = pk.id;
    }
    return k;
  }
  const villa = () => SX.data.buildings.find(b => b.id === "villa");
  const todNow = () => SX.prog && SX.prog.todAt ? SX.prog.todAt(Date.now(), SX.prog.todSpan()) : "day";
  function cover(id) {
    let el = $(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "trCover hidden";
      document.body.appendChild(el);
    }
    return el;
  }
  function hideCovers() {
    for (const id of [ "trIntro", "trEnd" ]) {
      const el = $(id);
      if (el) el.classList.add("hidden");
    }
  }
  function keyRow(id, what) {
    return `<tr><th><span class="trKey">${esc(SX.label(id) || "")}</span></th><td>${esc(what)}</td></tr>`;
  }
  function keyRow2(a, b, what) {
    return `<tr><th><span class="trKey">${esc(SX.label(a) || "")}</span> <span class="trKey">${esc(SX.label(b) || "")}</span></th><td>${esc(what)}</td></tr>`;
  }
  function showIntro() {
    const el = cover("trIntro");
    const move = [ "up", "left", "down", "right" ].map(k => SX.label(k) || "").join(" ");
    el.innerHTML = `<div class="trWin">\n      <h1>서울탈출 <span>체험판</span></h1>\n      <p class="trLead">감염체와 약탈자가 남아 있는 연립주택에 들어갑니다. 집 안의 상자와 가구를 뒤져 쓸 만한 물건을 챙기고, 출구를 찾아 살아서 나가십시오.</p>\n      <div class="trCols">\n        <section>\n          <h2>가지고 들어가는 것</h2>\n          <ul class="trList"><li>K5 권총 — 탄창에 13발</li><li>9mm 탄창 1개 — 24발</li><li>붕대 2개 · 진통제 1개</li><li>식칼</li></ul>\n          <h2>나가는 곳</h2>\n          <p>1층 출입문은 들어온 지 75초 뒤 잠깁니다. 그 뒤에는 옥상 집라인이나 완강기로 나가야 합니다. 출구 자리는 <span class="trKey">${esc(SX.label("terminal") || "")}</span> 지도에서 볼 수 있습니다.</p>\n          <h2>알아 두면 좋은 것</h2>\n          <ul class="trList"><li>총소리는 멀리 퍼져 감염체와 약탈자를 불러 모읍니다.</li><li>피가 나면 붕대로 멈추고, 아플 때는 진통제를 씁니다.</li><li>상자를 열면 물건이 하나씩 드러납니다. 뒤지는 동안에도 주위를 살피십시오.</li></ul>\n        </section>\n        <section>\n          <h2>조작</h2>\n          <table class="trKeys">\n            <tr><th><span class="trKey">${esc(move)}</span></th><td>걷기</td></tr>\n            ${keyRow("fire", "쏘기")}${keyRow("aim", "조준")}${keyRow("reload", "재장전")}\n            ${keyRow("interact", "뒤지기 · 줍기 · 문 열기")}${keyRow("inventory", "가방")}\n            ${keyRow("melee", "근접 공격")}${keyRow("sprint", "달리기")}\n            ${keyRow2("q4", "q5", "붕대 · 진통제")}${keyRow("menu", "메뉴")}${keyRow("help", "도움말")}\n          </table>\n        </section>\n      </div>\n      <p class="trNote">체험판은 진행을 저장하지 않습니다. 창을 닫거나 다시 하면 처음 장비로 시작합니다.</p>\n      <div class="trBtns"><button id="trStart" class="trMain">시작하기</button><button id="trBack">사이트로 돌아가기</button></div>\n    </div>`;
    el.classList.remove("hidden");
    $("trStart").onclick = () => T.start();
    $("trBack").onclick = () => {
      location.href = SITE;
    };
    try {
      $("trStart").focus({
        preventScroll: true
      });
    } catch (e) {}
  }
  T.start = function() {
    if (G.state === "raid" || T.going) return;
    const b = villa();
    if (!b) return;
    T.going = true;
    try {
      SX.audio.init();
    } catch (e) {}
    hideCovers();
    G.save = G.newSave();
    G.kit = G.save.kit = trialKit();
    if (SX.actors && SX.actors.player) SX.actors.player.kit = G.kit;
    T.runs++;
    G.startRaid(b, todNow(), {
      mode: "normal"
    });
    const wait = () => {
      if (G.state !== "raid") {
        requestAnimationFrame(wait);
        return;
      }
      T.going = false;
      $("hud").classList.remove("hidden");
      U.hudDirty();
    };
    requestAnimationFrame(wait);
  };
  const unitVal = new Map;
  function counts(k) {
    const m = new Map;
    for (const it of I.kitAll(k)) if (it && it.name) {
      m.set(it.name, (m.get(it.name) || 0) + I.qty(it));
      if (!unitVal.has(it.name)) unitVal.set(it.name, it.val || 0);
    }
    return m;
  }
  function gainedList() {
    const now = counts(G.kit), was = G.raidStartKit ? counts(I.kitFrom(G.raidStartKit)) : new Map, out = [];
    for (const [n, q] of now) {
      const d = q - (was.get(n) || 0);
      if (d > 0) out.push([ n, d ]);
    }
    return out;
  }
  const gainedValue = list => Math.round(list.reduce((s, [n, d]) => s + (unitVal.get(n) || 0) * d, 0));
  const mmss = s => {
    s = Math.max(0, Math.round(s));
    return (s >= 60 ? Math.floor(s / 60) + "분 " : "") + s % 60 + "초";
  };
  G.finishRaid = function(win, how, lv) {
    lv = lv || SX.raid.level;
    const st = G.stats || {}, items = gainedList();
    const r = {
      win: !!win,
      how: how || "",
      why: G.deathWhy || (typeof how === "string" && !EXIT[how] ? how : ""),
      secs: Math.round(SX.raid.t || 0),
      kZ: st.kZombie | 0,
      kS: st.kScav | 0,
      kills: st.kills | 0,
      searched: st.searched | 0,
      items,
      value: gainedValue(items)
    };
    T.last = r;
    if (G.save) G.save.raidOpen = null;
    try {
      SX.raid.snapClear();
    } catch (e) {}
    G.state = "title";
    SX.hub.enter("home");
    V.snap();
    if (SX.raid.level === lv) SX.raid.level = null;
    $("hud").classList.add("hidden");
    U.closePanel();
    showEnd(r);
  };
  function showEnd(r) {
    const el = cover("trEnd");
    const head = r.win ? "탈출했습니다" : "쓰러졌습니다";
    const sub = r.win ? `${esc(EXIT[r.how] || "출구로")} 연립주택을 빠져나왔습니다.` : r.why ? esc(String(r.why).replace(/[.。]+$/, "")) + "." : "연립주택에서 쓰러졌습니다.";
    const items = r.items.slice(0, 18).map(([n, q]) => `<li><span>${esc(n)}</span><b>${q > 1 ? "×" + q : ""}</b></li>`).join("") + (r.items.length > 18 ? `<li class="trMore">그 밖에 ${r.items.length - 18}가지</li>` : "");
    const itemHead = r.win ? "가지고 나온 물건" : "이번 판에 챙긴 물건";
    const lost = !r.win && r.items.length ? `<p class="trEmpty">쓰러져서 가지고 나오지 못했습니다.</p>` : "";
    el.innerHTML = `<div class="trWin trEndWin ${r.win ? "trWin_ok" : "trWin_bad"}">\n      <h1>${head}</h1>\n      <p class="trLead">${sub}</p>\n      <table class="trStats">\n        <tr><th>머문 시간</th><td>${mmss(r.secs)}</td></tr>\n        <tr><th>쓰러뜨린 감염체</th><td>${r.kZ}</td></tr>\n        <tr><th>쓰러뜨린 약탈자</th><td>${r.kS}</td></tr>\n        <tr><th>뒤진 곳</th><td>${r.searched}</td></tr>\n        ${r.win ? `<tr><th>가지고 나온 물건 값</th><td>${esc(SX.won(r.value))}</td></tr>` : ""}\n      </table>\n      <h2>${itemHead}</h2>\n      ${r.items.length ? `<ul class="trGot">${items}</ul>${lost}` : `<p class="trEmpty">챙긴 물건이 없습니다.</p>`}\n      <div class="trBtns"><button id="trAgain" class="trMain">다시 하기</button><button id="trBack2">사이트로 돌아가기</button></div>\n    </div>`;
    el.classList.remove("hidden");
    $("trAgain").onclick = () => T.start();
    $("trBack2").onclick = () => {
      location.href = SITE;
    };
    try {
      $("trAgain").focus({
        preventScroll: true
      });
    } catch (e) {}
  }
  T.boot = function() {
    const gate = $("gate"), title = $("title");
    if (gate) gate.classList.add("hidden");
    if (title) title.classList.add("hidden");
    G.state = "title";
    try {
      SX.raid.snapClear();
    } catch (e) {}
    const badge = document.createElement("div");
    badge.id = "trBadge";
    badge.textContent = "체험판";
    document.body.appendChild(badge);
    showIntro();
  };
  T.boot();
})(window.SX);
