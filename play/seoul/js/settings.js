"use strict";

(function(SX) {
  const U = SX.ui, $ = id => document.getElementById(id), esc = SX.esc;
  const pct = v => Math.round(v * 100) + "%";
  const eq = (a, b) => typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-6 : a === b;
  const O = () => SX.opts;
  U.SET_FS_SEC = 15;
  const TABS = [ [ "screen", "화면" ], [ "gfx", "그래픽 · 성능" ], [ "sound", "소리" ], [ "keys", "조작 · 키" ], [ "pad", "게임패드" ], [ "game", "게임 · 안내" ], [ "access", "접근성" ], [ "lang", "언어 · Language" ] ];
  const tabName = t => (TABS.find(q => q[0] === t) || TABS[0])[1];
  const st = {
    tab: "screen",
    sub: "kb",
    sel: null,
    q: "",
    askAll: false,
    cap: null,
    clash: null
  };
  const R = {};
  let built = false;
  const fxScr = () => SX.applyScreen();
  const fxSnd = () => SX.audio.applyVol();
  const fxHold = () => {
    SX.input.togOff();
    U.hudDirty();
  };
  function rng(k, n, mn, mx, x) {
    const dv = x && x.def != null ? x.def : SX.OPT_DEF[k];
    R[k] = Object.assign({
      id: k,
      k,
      n,
      kind: "rng",
      mn,
      mx,
      def: dv,
      get() {
        const v = +O()[k];
        return O()[k] != null && v >= mn && v <= mx ? v : dv;
      },
      set(v) {
        O()[k] = v;
      }
    }, x || {});
    R[k].def = dv;
  }
  function seg(id, n, ch, get, set, dv, x) {
    R[id] = Object.assign({
      id,
      n,
      kind: "seg",
      ch,
      get,
      set,
      def: dv
    }, x || {});
  }
  const tog = attr => [ [ false, "끔", attr ? `${attr}="0"` : "" ], [ true, "켬", attr ? `${attr}="1"` : "" ] ];
  const onTog = (k, n, attr, x) => seg(k, n, tog(attr), () => O()[k] !== false, v => {
    O()[k] = v;
  }, true, x);
  const offTog = (k, n, attr, x) => seg(k, n, tog(attr), () => !!O()[k], v => {
    O()[k] = v;
  }, false, x);
  const HM_N = {
    aim: "조준 사격",
    sprint: "달리기",
    crouch: "앉기",
    quiet: "조용히 걷기"
  }, HM_P = {
    aim: "LT 조준 사격",
    sprint: "LS 달리기"
  };
  const HM_D = "누르는 동안: 키를 누르고 있는 동안만 됩니다. 한 번 눌러 켜고 끄기: 한 번 누르면 켜지고 다시 누르면 꺼집니다.";
  function hmRow(pad, id) {
    const w = pad ? "p" : "k", ok = pad ? "phm" : "hm", L = pad ? SX.PAD_HOLD : SX.HOLD_ACTS, d0 = (L.find(a => a[0] === id) || [])[1] || "hold";
    seg(w + "h:" + id, pad ? HM_P[id] : HM_N[id], [ [ "hold", "누르는 동안", `data-hm="${w}:${id}:hold"` ], [ "tog", "한 번 눌러 켜고 끄기", `data-hm="${w}:${id}:tog"` ] ], () => SX.holdMode(id, pad), v => {
      const c = O()[ok] && typeof O()[ok] === "object" ? O()[ok] : {};
      O()[ok] = Object.assign({}, c, {
        [id]: v
      });
    }, d0, {
      fx: fxHold,
      wide: 1,
      d: HM_D,
      d2: pad ? "기본은 예전 그대로입니다 — LT 조준은 누르는 동안, LS 달리기는 한 번 누르기. 앉기는 B(길게 누르면 종이상자)라 늘 한 번 누르기이고, 조용히 걷기는 왼쪽 스틱을 살짝 기울이시면 됩니다." : "기본은 예전 그대로입니다 — 앉기만 한 번 누르기이고 나머지는 누르는 동안. 한 번 눌러 켠 달리기는 멈추거나 조준하면 꺼지고, 조준은 창을 열면 내려갑니다.",
      reset() {
        const c = O()[ok];
        if (c && typeof c === "object") {
          delete c[id];
          if (!Object.keys(c).length) delete O()[ok];
        }
      }
    });
  }
  const SND_PLAY = {
    vol: "confirm",
    sfx: "doorOpen",
    sGun: "pistol",
    sStep: "step",
    sVoice: "groan",
    sItem: "doorOpen",
    sUi: "confirm",
    amb: "thunder",
    mus: ""
  };
  const BGM = [ [ "bgmMain", "메인" ], [ "bgmShelter", "셸터" ], [ "bgmRaid", "판 안" ], [ "bgmCombat", "교전" ], [ "bgmMarket", "장터" ], [ "bgmGym", "헬스장" ], [ "bgmFish", "낚시터" ] ];
  const SEE_SV = [ "access", "sndVis", "소리 보이기 — 접근성 쪽으로 옮겼습니다" ];
  const tutOn = () => SX.tips && SX.tips.anyOn ? SX.tips.anyOn() : !!(SX.tut && SX.tut.cur && SX.tut.cur());
  function build() {
    if (built) return;
    built = true;
    rng("bright", "밝기", .6, 1.6, {
      fx: fxScr,
      prev: "scr",
      d: "게임 화면만 밝아집니다. 창과 글씨는 그대로입니다.",
      d2: "밤 판에서 앞이 안 보이면 올리십시오. 위 그림이 바로 바뀝니다."
    });
    rng("contrast", "명암(대비)", .7, 1.5, {
      fx: fxScr,
      prev: "scr",
      d: "밝은 곳과 어두운 곳의 차이입니다. 올리면 또렷해지고 내리면 부드러워집니다.",
      d2: "게임 그림에만 걸립니다. 창과 글씨는 그대로입니다."
    });
    rng("sat", "색 진하기", 0, 1.6, {
      fx: fxScr,
      prev: "scr",
      d: "게임 화면의 색이 얼마나 진한지입니다. 0%면 흑백입니다.",
      d2: "게임 그림에만 걸립니다. 창과 글씨는 그대로입니다."
    });
    seg("fs", "전체 화면", [ [ false, "창 모드", 'data-fs="0"' ], [ true, "전체 화면", 'data-fs="1"' ] ], () => U.fsOn(), null, null, {
      d: "게임을 화면 가득 띄웁니다.",
      d2: "바꾼 뒤 15초 안에 아래 「유지」를 누르지 않으면 예전 화면으로 돌아갑니다. 브라우저에서는 Esc 를 길게 누르면 전체 화면이 풀립니다.",
      click(b) {
        const i = b.dataset.i;
        if (i != null) fsSet(i === "1");
        return false;
      }
    });
    seg("ui", "창 · 글씨 크기", [ [ .8, "작게", 'data-ui="0.8"' ], [ 1, "보통", 'data-ui="1"' ], [ 1.2, "크게", 'data-ui="1.2"' ], [ 1.4, "아주 크게", 'data-ui="1.4"' ] ], () => +O().ui || 1, v => {
      O().ui = v;
    }, 1, {
      fx: () => {
        SX.applyScreen();
        if (SX.game.resize) SX.game.resize();
      },
      d: "창과 글씨를 함께 키우거나 줄입니다. 게임 그림의 크기는 그대로입니다.",
      d2: "화면 쪽과 접근성 쪽의 같은 항목입니다."
    });
    offTog("fps", "프레임 수 표시", "data-fps", {
      fx: fxScr,
      d: "1초에 화면을 몇 번 그리는지 구석에 띄웁니다.",
      d2: "게임이 버벅이는지 볼 때 켜십시오."
    });
    seg("chCol", "조준점 색", (SX.CH_COLS || []).map((c, i) => [ i, `<i class="setSw1" style="background:${c}"></i>${[ "흰색", "초록", "노랑", "하늘", "분홍" ][i] || i}`, `data-chc="${i}"` ]), () => O().chCol | 0, v => {
      O().chCol = v;
    }, SX.OPT_DEF.chCol, {
      fx: fxScr,
      prev: "scr",
      d: "조준점의 색입니다. 바닥 색과 겹쳐 잘 안 보이면 바꾸십시오.",
      d2: "위 그림 가운데의 조준점이 바로 바뀝니다."
    });
    seg("chSize", "조준점 크기", [ [ 1, "보통", 'data-chs="1"' ], [ 1.5, "크게", 'data-chs="1.5"' ], [ 2, "아주 크게", 'data-chs="2"' ] ], () => +O().chSize || 1, v => {
      O().chSize = v;
    }, SX.OPT_DEF.chSize, {
      fx: fxScr,
      prev: "scr",
      d: "조준점의 크기입니다.",
      d2: "위 그림 가운데의 조준점이 바로 바뀝니다."
    });
    R.hudLay = {
      id: "hudLay",
      n: "인게임(건물 안) UI 배치 · 크기 · 켜고 끄기",
      kind: "x",
      def: "d",
      get: () => SX.hudLay && SX.hudLay.changed("raid") ? "c" : "d",
      reset() {
        if (SX.hudLay) SX.hudLay.resetAll("raid");
      },
      d: "건물 안(판)에서만 쓰입니다. 칸(체력 막대 · 무기 칸 · 지도 · 정보 줄 …)을 켜고 끄고, 크기와 자리를 바꿉니다. 셸터 · 장터는 아래에서 따로 합니다.",
      d2: "[편집] 을 누르면 진짜 게임 화면 위에서 칸을 끌어 옮기고 휠로 크기를 바꿉니다. 꺼진 칸은 흐리게 보입니다.",
      html: () => '<button class="setWide" data-hudlay>편집</button>',
      click(b) {
        if (b.dataset.hudlay == null || !SX.hudLay) return false;
        SX.hudLay.edit("screen", "raid");
        return false;
      }
    };
    R.hudLayHub = {
      id: "hudLayHub",
      n: "셸터 · 장터 UI 배치 · 크기 · 켜고 끄기",
      kind: "x",
      def: "d",
      get: () => SX.hudLay && SX.hudLay.changed("hub") ? "c" : "d",
      reset() {
        if (SX.hudLay) SX.hudLay.resetAll("hub");
      },
      d: "셸터와 장터에서만 쓰입니다. 칸(체력 막대 · 무기 칸 · 정보 줄 …)을 켜고 끄고, 크기와 자리를 바꿉니다.",
      d2: "[편집] 을 누르면 셸터 예시 화면 위에서 칸을 끌어 옮기고 휠로 크기를 바꿉니다. 꺼진 칸은 흐리게 보입니다.",
      html: () => '<button class="setWide" data-hudlayhub>편집</button>',
      click(b) {
        if (b.dataset.hudlayhub == null || !SX.hudLay) return false;
        SX.hudLay.edit("screen", "hub");
        return false;
      }
    };
    onTog("mapEta", "지도에 남은 시간", "data-meta", {
      d: "M 지도를 열면 위에 「n층에 차기까지 · 출구 막히기까지」를 보여 줍니다.",
      d2: "판 화면에서도 보시려면 「인게임 UI 배치」에서 그 줄을 켜십시오."
    });
    seg("lightQ", "빛 품질", [ [ "high", "높음", 'data-lq="high"' ], [ "low", "낮음", 'data-lq="low"' ] ], () => O().lightQ === "low" ? "low" : "high", v => {
      O().lightQ = v;
    }, "high", {
      fx: fxScr,
      prev: "scr",
      d: "낮음은 부드러운 어둠과 빛 번짐을 끕니다.",
      d2: "게임이 버벅이면 낮추십시오. 보이는 범위와 판정은 그대로입니다."
    });
    rng("decoAmt", "꾸밈 양", 0, 1, {
      fx: () => {
        SX.applyScreen();
        if (SX.dz && SX.dz.cssKeep) SX.dz.cssKeep();
      },
      d: "판 · 거점의 잡동사니와 잔장식 양입니다. 100%가 지금 그대로입니다.",
      d2: "판 · 거점의 잡동사니는 다음에 들어갈 때부터 바뀌고, 셸터 바닥의 청소 거리는 그대로 남습니다."
    });
    seg("fpsCap", "프레임 상한", [ [ 0, "제한 없음", 'data-fcap="0"' ], [ 60, "60 fps", 'data-fcap="60"' ], [ 30, "30 fps", 'data-fcap="30"' ] ], () => +O().fpsCap || 0, v => {
      O().fpsCap = v;
    }, 0, {
      fx: fxScr,
      d: "1초에 화면을 그리는 횟수의 상한입니다. 낮추면 컴퓨터가 덜 일합니다.",
      d2: "게임이 버벅이면 낮추십시오. 보이는 범위와 판정은 그대로입니다."
    });
    offTog("mute", "소리", "", {
      ch: [ [ false, "켬", 'data-mute="0"' ], [ true, "모두 끄기", 'data-mute="1"' ] ],
      fx: fxSnd,
      see: SEE_SV,
      d: "「모두 끄기」를 고르면 게임 소리가 모두 꺼집니다. 아래 크기는 그대로 남습니다."
    });
    const sndRow = (k, n, d, d2) => rng(k, n, 0, 1, {
      fx: fxSnd,
      play: SND_PLAY[k],
      see: SEE_SV,
      d,
      d2: d2 || "[▶ 들어 보기] 를 누르면 지금 크기로 한 번 납니다. 「효과음 전체」에 곱해집니다."
    });
    sndRow("vol", "전체 소리", "모든 소리의 크기입니다. 아래 갈래는 모두 여기에 곱해집니다.", "[▶ 들어 보기] 를 누르면 지금 크기로 한 번 납니다.");
    sndRow("sfx", "효과음 전체", "총 · 발소리 · 목소리 · 물건 · 알림 소리를 묶은 크기입니다. 아래 다섯 갈래는 여기에 곱해집니다.", "[▶ 들어 보기] 를 누르면 지금 크기로 한 번 납니다.");
    sndRow("sGun", "총 · 폭발 · 장전", "내 총과 남의 총, 수류탄, 장전 소리입니다.");
    sndRow("sStep", "발소리", "나와 동료, 적의 발소리입니다.");
    sndRow("sVoice", "목소리 · 적 소리", "사람 목소리와 감염체 · 개 소리입니다.");
    sndRow("sItem", "물건 · 문 · 몸", "물건을 줍고 쓰는 소리, 문 소리, 몸이 부딪는 소리입니다.");
    sndRow("sUi", "알림 · 단추", "알림과 창 단추 소리입니다.");
    sndRow("amb", "환경음", "비 · 바람 · 주변 소리입니다.", "[▶ 들어 보기] 를 누르면 지금 크기로 한 번 납니다.");
    sndRow("mus", "배경 음악", "배경 음악의 크기입니다.", "[▶ 들어 보기] 를 누르면 지금 크기로 잠깐 납니다. 음악이 나오는 중이면 그 곡 크기가 바로 바뀝니다.");
    R.bgm = {
      id: "bgm",
      n: "음악 나오는 곳",
      kind: "x",
      def: true,
      see: SEE_SV,
      d: "끈 곳에서는 배경 음악이 나오지 않습니다.",
      d2: "교전을 끄면 싸울 때도 판 안 곡이 이어집니다. 사격장은 음악이 없습니다.",
      get: () => BGM.every(([k]) => O()[k] !== false),
      reset() {
        for (const [k] of BGM) O()[k] = true;
      },
      html: () => `<span class="setChips">${BGM.map(([k, n]) => `<button data-bgm="${k}" class="${O()[k] !== false ? "on" : ""}">${n}</button>`).join("")}<span class="setNoMus">사격장 · 음악 없음</span></span>`,
      click(b) {
        const k = b.dataset.bgm;
        if (!k || !BGM.some(q => q[0] === k)) return false;
        O()[k] = O()[k] === false;
        return true;
      }
    };
    seg("sndVis", "소리 보이기", [ [ "off", "끔", 'data-sv="0"' ], [ "night", "밤에만", 'data-sv="n"' ], [ "on", "늘 켬", 'data-sv="1"' ] ], () => SX.access ? SX.access.mode() : "night", v => {
      O().sndVis = v;
    }, "night", {
      fx: () => {
        if (SX.access) SX.access.clear();
      },
      d: "안 보이는 곳에서 소리가 나면 그쪽 화면 가장자리에 그림 표시가 1초쯤 뜹니다.",
      d2: "밤에만은 어두운 곳에 있을 때만 뜹니다. 총소리 · 발소리(다른 팀 포함) · 폭발 · 문 · 개 · 감염체 · 외침이 뜹니다. 벽 너머로 작게 들리는 발소리도 뜹니다. 가까울수록 진하고 물결이 많습니다."
    });
    seg("cb", "색약 화면", (SX.CB_NAMES || [ "끔" ]).map((n, i) => [ i, n, `data-cb="${i}"` ]), () => O().cb | 0, v => {
      O().cb = v;
    }, 0, {
      fx: fxScr,
      prev: "cb",
      d: "좋음 · 나쁨 · 주의 · 체력 · 기력 · 출구 · 동료 색을 구별하기 쉬운 색으로 바꿉니다.",
      d2: "위 색 칸과 보기 글이 바로 바뀝니다."
    });
    rng("shake", "화면 흔들림", 0, 1, {
      fx: fxScr,
      d: "쏘거나 맞거나 폭발할 때 화면이 흔들리는 정도입니다. 0%면 흔들리지 않습니다.",
      d2: "흔들림에 어지러우시면 낮추십시오."
    });
    offTog("glare", "눈부심 줄이기", "data-glare", {
      fx: fxScr,
      d: "켜면 섬광탄에 화면이 하얘지는 대신 어두워집니다.",
      d2: "밝은 빛에 눈이 아프시면 켜십시오."
    });
    offTog("lessBlood", "피 표현 줄이기", "data-lb", {
      fx: () => {
        if (SX.opts.lessBlood && SX.actors && SX.actors.clearBlood) SX.actors.clearBlood();
      },
      d: "켜면 피 방울이 줄고 바닥 · 벽에 피 자국이 남지 않습니다.",
      d2: "피를 보기 불편하시면 켜십시오."
    });
    rng("promptSize", "[F] 안내 크기", .5, 1, {
      fx: fxScr,
      d: "물건 위에 뜨는 [F] 안내의 크기입니다."
    });
    rng("promptAlpha", "[F] 안내 진하기", .2, 1, {
      fx: fxScr,
      d: "물건 위에 뜨는 [F] 안내가 얼마나 진한지입니다. 낮추면 뒤가 비쳐 보입니다."
    });
    for (const id of [ "aim", "sprint", "crouch", "quiet" ]) hmRow(false, id);
    onTog("needMark", "임무 물건 표시", "data-nmk", {
      fx: fxScr,
      d: "의뢰 · 이야기 · 작전 · 만들기에 쓰는 물건에 작은 표시를 붙입니다.",
      d2: "켜 두면 그런 물건을 팔 때 한 번 묻습니다."
    });
    onTog("bubble", "말풍선 보기", "data-bub", {
      fx: fxScr,
      d: "끄면 남의 말풍선과 내 말풍선이 모두 뜨지 않습니다."
    });
    onTog("promptOn", "[F] 안내 보기 — 인게임", "data-pon", {
      fx: fxScr,
      d: "건물 안(판)에서 물건 위에 뜨는 [F] 안내를 켜고 끕니다.",
      d2: "꺼도 [F] 키는 그대로 됩니다."
    });
    onTog("promptHub", "[F] 안내 보기 — 셸터 · 장터", "data-phub", {
      fx: fxScr,
      d: "셸터와 장터에서 뜨는 [F] 안내를 켜고 끕니다.",
      d2: "꺼도 [F] 키는 그대로 됩니다."
    });
    if (SX.cursor) R.cursor = {
      id: "cursor",
      n: "마우스 커서",
      kind: "x",
      def: SX.cursor.DEF || "arrow",
      prev: "cur",
      d: "게임 안 마우스 커서 그림입니다. 그림에 마우스를 올리면 이름이 보입니다.",
      d2: "「평소 커서」는 윈도우 커서를 그대로 씁니다.",
      get: () => SX.cursor.cur(),
      reset() {
        delete O().cursor;
      },
      html: () => `<span class="setCurs">${SX.cursor.list.map(c => `<button data-cur="${c.id}" class="${SX.cursor.cur() === c.id ? "on" : ""}" title="${esc(c.name)}"><img src="${SX.cursor.preview(c.id)}" alt=""></button>`).join("")}<button data-cur="os" class="setOs${SX.cursor.cur() === "os" ? " on" : ""}">평소 커서</button></span>`,
      click(b) {
        const id = b.dataset.cur;
        if (!id) return false;
        O().cursor = id;
        return true;
      },
      fx: () => SX.cursor.apply()
    };
    R.tut = {
      id: "tut",
      n: "처음 안내",
      kind: "x",
      def: null,
      d: "처음 하시는 분께 띄우는 안내입니다. 끄면 다시 뜨지 않습니다.",
      d2: "「처음 안내 다시 보기」를 누르면 창을 닫고 처음부터 다시 띄웁니다.",
      html() {
        const on = tutOn();
        return `<button class="setWide" data-tut data-alt="${on ? "처음 안내 다시 보기" : "처음 안내 끄기"}">${on ? "처음 안내 끄기" : "처음 안내 다시 보기"}</button>`;
      },
      click(b) {
        if (b.dataset.tut == null) return false;
        const T2 = SX.tips;
        if (tutOn()) {
          if (T2 && T2.turnOff) T2.turnOff(); else if (SX.tut) SX.tut.off();
          return true;
        }
        if (T2 && T2.replay) T2.replay(); else if (SX.tut) SX.tut.restart();
        U.closePanel();
        return false;
      }
    };
    rng("mSens", "마우스 감도", .25, 3, {
      def: 1,
      pv: 1,
      d: "100%면 예전처럼 화면의 커서 자리가 곧 조준점입니다. 다른 값이면 게임 화면을 누를 때 마우스를 잡아 두고(커서가 숨습니다) 움직인 만큼 × 감도로 조준점을 옮깁니다.",
      d2: "잡아 둔 동안 창(가방 · 지도 · 메뉴)을 열거나 Esc 를 누르거나 다른 창으로 가면 마우스를 놓습니다 — 게임 화면을 다시 누르시면 됩니다."
    });
    seg("mRaw", "가속 끄기", tog("data-mraw"), () => O().mRaw === true, v => {
      O().mRaw = v;
    }, false, {
      d: "윈도우의 포인터 가속(빨리 움직이면 더 멀리 가는 것)을 빼고 받습니다. 켜면 감도가 100%여도 마우스를 잡아 둡니다.",
      d2: "브라우저가 못 하면 가속이 그대로 남습니다."
    });
    R.padCon = {
      id: "padCon",
      n: "연결된 게임패드",
      kind: "x",
      def: null,
      d: "꽂고 아무 단추나 누르시면 연결됩니다.",
      d2: "단추 배치는 바꿀 수 없습니다.",
      html: () => {
        const nm = SX.pad && SX.pad.name();
        return nm ? `<b class="setPadNm">${esc(nm)}</b>` : `<span class="setDim">없습니다 — 꽂고 아무 단추나 누르시면 됩니다.</span>`;
      }
    };
    onTog("padRumble", "진동", "data-rum", {
      d: "맞거나 폭발하면 게임패드가 떨립니다.",
      d2: "[진동 시험] 을 누르면 한 번 떨립니다.",
      extra: () => `<button data-popt="test" class="setPlay"${SX.pad && SX.pad.name() ? "" : " disabled"}>진동 시험</button>`,
      click(b) {
        if (b.dataset.popt === "test") {
          if (SX.pad) SX.pad.rumble(6, true);
          return false;
        }
        return segClick(this, b);
      }
    });
    onTog("padFollow", "걷는 쪽 보기", "data-fol", {
      d: "켜면 오른쪽 스틱을 놓고 걸을 때 걷는 쪽을 봅니다. 끄면 조준점이 그 자리에 남습니다."
    });
    rng("padSens", "스틱 감도", .5, 2, {
      def: 1,
      pv: 1,
      d: "조준점이 스틱을 따라오는 빠르기 · 창에서 커서가 움직이는 빠르기입니다."
    });
    rng("padDz", "안 듣는 곳", .05, .5, {
      def: .2,
      pv: 1,
      d: "스틱 가운데에서 이만큼 기울일 때까지는 움직이지 않습니다 — 가만둔 스틱이 쏠리면 올리시면 됩니다."
    });
    for (const id of [ "aim", "sprint" ]) hmRow(true, id);
  }
  function page(t, sub) {
    const P = {
      screen: [ [ "밝기 · 색", [ "bright", "contrast", "sat" ] ], [ "창 · 글씨", [ "fs", "ui", "fps" ] ], [ "조준점", [ "chCol", "chSize" ] ], [ "인게임(건물 안) UI", [ "hudLay", "promptOn", "mapEta" ] ], [ "셸터 · 장터 UI", [ "hudLayHub", "promptHub" ] ] ],
      gfx: [ [ null, [ "lightQ", "decoAmt", "fpsCap" ] ] ],
      sound: [ [ null, [ "mute", "vol" ] ], [ "효과음", [ "sfx", "sGun", "sStep", "sVoice", "sItem", "sUi" ] ], [ "환경 · 음악", [ "amb", "mus", "bgm" ] ] ],
      game: [ [ null, [ "needMark", "bubble", "cursor", "tut" ] ] ],
      access: [ [ "보기 — 색 · 흔들림 · 크기", [ "cb", "shake", "glare", "lessBlood", "ui" ] ], [ "듣기 — 소리를 그림으로", [ "sndVis" ] ], [ "누르기 — 누르는 방식 · [F] 안내", [ "kh:aim", "kh:sprint", "kh:crouch", "kh:quiet", "promptSize", "promptAlpha" ] ] ],
      lang: [ [ null, [ "lang" ] ] ],
      pad: [ [ null, [ "padCon", "padRumble", "padFollow", "padSens", "padDz" ] ], [ "누르는 방식", [ "ph:aim", "ph:sprint" ] ] ],
      mouse: [ [ null, [ "mSens", "mRaw" ] ] ],
      hold: [ [ "키보드 · 마우스", [ "kh:aim", "kh:sprint", "kh:crouch", "kh:quiet" ] ] ].concat(SX.pad ? [ [ "게임패드", [ "ph:aim", "ph:sprint" ] ] ] : [])
    };
    const g = t === "keys" ? sub === "mouse" || sub === "hold" ? P[sub] : [] : P[t] || [];
    return g.map(([n, ids]) => [ n, ids.filter(id => R[id]) ]);
  }
  function tabRows(t) {
    const L = t === "keys" ? [ ...page("keys", "mouse"), ...page("keys", "hold") ] : page(t);
    return [ ...new Set(L.flatMap(g => g[1])) ];
  }
  const act = id => SX.KEY_ACTIONS.find(a => a[0] === id);
  const KG = [ [ "걷기 · 몸", [ "up", "down", "left", "right", "sprint", "quiet", "crouch", "box" ] ], [ "물건 · 창", [ "interact", "inventory", "terminal", "light", "nvg", "heal", "deco" ] ], [ "싸움", [ "fire", "aim", "reload", "mode", "melee", "grenade", "brick", "w1", "w2", "w3", "wheel" ] ], [ "말 · 그 밖", [ "chat", "ping", "photo", "menu", "help" ] ] ];
  const QS = [ "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13" ];
  const keyChg = id => {
    const a = act(id);
    return !!a && JSON.stringify(SX.keys[id] || []) !== JSON.stringify(a[2] || []);
  };
  const keysChg = () => SX.KEY_ACTIONS.some(a => keyChg(a[0]));
  function keyGroups() {
    const known = new Set([ ...KG.flatMap(g => g[1]), ...QS ]), rest = SX.KEY_ACTIONS.map(a => a[0]).filter(id => !known.has(id));
    return KG.map(([n, ids]) => [ n, (n === "말 · 그 밖" ? ids.concat(rest) : ids).filter(id => act(id)) ]);
  }
  function cap(id, s) {
    const L = SX.keys[id] || [], code = L[s], on = st.cap && st.cap.id === id && st.cap.slot === s;
    return `<button class="kc${code ? "" : " none"}${on ? " listen" : ""}" data-key="${id}" data-slot="${s}">${on ? "…" : code ? esc(SX.keyLabel(code)) : "—"}</button>`;
  }
  const keyCls = id => (st.sel === "key:" + id ? " sel" : "") + (st.cap && st.cap.id === id ? " listen" : "") + (st.clash && (st.clash.id === id || st.clash.others.includes(id)) ? " bad" : "") + (keyChg(id) ? " chg" : "");
  const kName = n => n.length > 24 ? n.replace(/\s*\([^)]*\)\s*$/, "") : n;
  const keyRow = id => {
    const a = act(id);
    return a ? `<div class="setKey${keyCls(id)}" data-k="${id}"><span class="setN" title="${esc(a[1])}"><i class="setDot">●</i><span>${esc(kName(a[1]))}</span></span>${cap(id, 0)}${cap(id, 1)}</div>` : "";
  };
  const keyHead = () => `<div class="setKHead"><span>동작</span><span>주 키</span><span>보조 키</span></div>`;
  function clashHtml() {
    const c = st.clash;
    if (!c) return "";
    const names = c.others.map(k => (act(k) || [ k, k ])[1]).join(" · ");
    return `<div class="setClash" id="setClash"><span>${esc(SX.keyLabel(c.code))} 키는 「${esc(names)}」에도 쓰고 있습니다.</span><button data-clash="clear">그쪽을 비우기</button><button data-clash="keep">둘 다 두기</button></div>`;
  }
  function kbHtml() {
    const G = keyGroups(), col = gs => `<div class="setKCol">${keyHead()}${gs.map(([n, ids]) => `<div class="setGrp">${n}</div>` + ids.map(keyRow).join("")).join("")}</div>`;
    return `<div class="setKeys">${col(G.slice(0, 2))}${col(G.slice(2))}</div>` + `<div class="setGrp">단축 칸 1 ~ 10</div><div class="setStrip">${QS.filter(id => act(id)).map((id, i) => `<div class="setSlot${keyCls(id)}" data-k="${id}"><span>칸 ${i + 1}</span>${cap(id, 0)}${cap(id, 1)}</div>`).join("")}</div>` + `<p class="setNote">키 칸을 누르고 새 키(또는 마우스 단추)를 누르십시오. Backspace 지우기 · Esc 취소</p>` + clashHtml();
  }
  function subTabs() {
    const t = [ [ "kb", "키보드 · 마우스" ] ].concat(SX.mouse ? [ [ "mouse", "마우스 감도" ] ] : [], [ [ "hold", "누르는 방식" ] ]);
    return `<div class="setSubT" id="keysTabs">${t.map(([k, n]) => `<button data-kt="${k}" class="${st.sub === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  }
  function stopCap() {
    if (st.cap) {
      st.cap = null;
      if (SX.input.typing === onKey) SX.input.typing = null;
    }
  }
  function startCap(id, slot) {
    st.cap = {
      id,
      slot
    };
    st.clash = null;
    st.sel = "key:" + id;
    SX.input.typing = onKey;
    paintMid();
    footPad();
  }
  function eatClick() {
    const eat = e => {
      e.stopPropagation();
      e.preventDefault();
    };
    addEventListener("click", eat, {
      capture: true,
      once: true
    });
    addEventListener("auxclick", eat, {
      capture: true,
      once: true
    });
    setTimeout(() => {
      removeEventListener("click", eat, true);
      removeEventListener("auxclick", eat, true);
    }, 400);
  }
  function onKey(code) {
    const c = st.cap;
    SX.input.typing = null;
    st.cap = null;
    if (!c || U.panelKind !== "settings") return;
    if (/^Mouse/.test(code)) eatClick();
    if (code !== "Escape") {
      let L = (SX.keys[c.id] || []).slice();
      if (code === "Backspace") L.splice(c.slot, 1); else L[c.slot] = code;
      L = L.filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
      if (!L.length && c.id === "menu") L = (SX.keys.menu || []).slice();
      SX.keys[c.id] = L;
      SX.saveKeys();
      const others = code === "Backspace" ? [] : SX.KEY_ACTIONS.map(a => a[0]).filter(k => k !== c.id && (SX.keys[k] || []).includes(code));
      st.clash = others.length ? {
        code,
        id: c.id,
        others
      } : null;
      U.hudDirty();
    }
    paintMid();
    renderTabs();
    footPad();
    if (st.clash) {
      const el = $("setClash");
      if (el && el.scrollIntoView) el.scrollIntoView({
        block: "nearest"
      });
    }
  }
  function clashDo(how) {
    const c = st.clash;
    if (!c) return;
    if (how === "clear") {
      for (const k of c.others) SX.keys[k] = (SX.keys[k] || []).filter(x => x !== c.code);
      SX.saveKeys();
      U.hudDirty();
    }
    st.clash = null;
    paintMid();
    renderTabs();
  }
  const isChg = r => r.def != null && !eq(r.get(), r.def);
  function defText(r) {
    if (r.kind === "rng") return pct(r.def);
    if (r.kind === "seg") {
      const c = r.ch.find(q => eq(q[0], r.def));
      return c ? c[1].replace(/<[^>]*>/g, "") : "";
    }
    if (r.id === "bgm") return "모두 켬";
    if (r.id === "hudLay" || r.id === "hudLayHub") return "처음 배치";
    if (r.id === "cursor") {
      const c = SX.cursor.find && SX.cursor.find(r.def);
      return c ? c.name : "";
    }
    return "";
  }
  function segClick(r, b) {
    const i = b.dataset.i;
    if (i == null || !r.ch[+i]) return false;
    const v = r.ch[+i][0];
    if (eq(r.get(), v)) return false;
    r.set(v);
    return true;
  }
  function ctl(r) {
    if (r.kind === "rng") {
      const v = r.get();
      return `<input type="range" min="${r.mn}" max="${r.mx}" step="0.05" value="${v}" data-opt="${r.k}"${r.pv ? ` data-prange="${r.k}"` : ""}><b class="setV" data-v="${r.k}"${r.pv ? ` data-pv="${r.k}"` : ""}>${pct(v)}</b>` + (r.play != null ? `<button class="setPlay" data-play="${r.k}">▶ 들어 보기</button>` : "");
    }
    if (r.kind === "seg") {
      const cur = r.get();
      return `<span class="setSeg">${r.ch.map(([v, t, a], i) => `<button data-i="${i}" ${a || ""} class="${eq(cur, v) ? "on" : ""}">${t}</button>`).join("")}</span>` + (r.extra ? r.extra() : "");
    }
    return r.html();
  }
  const rowHtml = id => {
    const r = R[id];
    return r ? `<div class="setRow${r.wide ? " wide" : ""}${st.sel === id ? " sel" : ""}${isChg(r) ? " chg" : ""}" data-r="${id}"${r.notr ? " data-notr" : ""}><span class="setN"><i class="setDot">●</i><span>${r.n}</span></span><span class="setC">${ctl(r)}</span></div>` : "";
  };
  const grpHtml = gs => gs.map(([n, ids]) => (n ? `<div class="setGrp">${n}</div>` : "") + ids.map(rowHtml).join("")).join("");
  const norm = s => String(s || "").toLowerCase().replace(/<[^>]*>/g, "").replace(/[\s·()[\]—\-–「」.,]/g, "");
  function findHtml() {
    const q = norm(st.q), hit = n => norm(n).includes(q) || !!SX.tr && norm(SX.tr(n)).includes(q);
    const seen = new Set;
    let h = "", cnt = 0;
    for (const [t, tn] of TABS) {
      const ids = tabRows(t).filter(id => !seen.has(id) && hit(R[id].n));
      const keys = t === "keys" ? SX.KEY_ACTIONS.filter(a => hit(a[1])).map(a => a[0]) : [];
      if (!ids.length && !keys.length) continue;
      for (const id of ids) seen.add(id);
      h += `<div class="setGrp">${tn}</div>` + ids.map(rowHtml).join("") + (keys.length ? `<div class="setKeys one">${keyHead()}${keys.map(keyRow).join("")}</div>` : "");
      cnt += ids.length + keys.length;
    }
    return cnt ? h + clashHtml() : `<p class="setNone">찾는 설정이 없습니다 — 다른 말로 찾아 보십시오.</p>`;
  }
  const firstSel = () => {
    if (st.q) return null;
    const g = st.tab === "keys" && st.sub === "kb" ? [] : page(st.tab, st.sub);
    for (const [, ids] of g) for (const id of ids) if (R[id].kind !== "x" || R[id].def != null || id === "padCon" || id === "tut") return id;
    return null;
  };
  const noSide = () => !st.q && st.tab === "keys" && st.sub === "kb";
  function midHtml() {
    if (st.q) return findHtml();
    const t = st.tab;
    if (t === "keys") return subTabs() + (st.sub === "kb" ? kbHtml() : grpHtml(page("keys", st.sub)));
    let h = grpHtml(page(t));
    if (t === "gfx") h += `<p class="setNote">게임이 버벅이면 꾸밈 양 · 빛 품질 · 프레임 상한을 낮추시면 됩니다(보이는 범위와 판정은 그대로입니다).</p>`;
    if (t === "pad" && SX.pad) h += `<div class="setGrp">단추 배치</div><div class="setPadT">${SX.pad.table()}</div><p class="setNote">단추 배치는 바꿀 수 없습니다.</p>`;
    if (t === "access") h += `<p class="setNote">이 쪽은 다른 쪽에도 있는 항목을 한데 모아 둔 곳입니다. 여기서 바꾸면 그쪽도 같이 바뀝니다.</p>`;
    return h;
  }
  const midId = () => st.q ? "scrBody" : st.tab === "keys" || st.tab === "pad" ? "keysBody" : st.tab === "sound" ? "sndBody" : "scrBody";
  function paintMid(top) {
    const m = panelEl(".setMid");
    if (!m) return;
    const y = m.scrollTop;
    m.id = midId();
    m.innerHTML = midHtml();
    m.scrollTop = top ? 0 : y;
    const b = panelEl(".setBody");
    if (b) b.classList.toggle("noSide", noSide());
  }
  const panelEl = q => {
    const p = $("panel");
    return U.panelKind === "settings" && p ? p.querySelector(q) : null;
  };
  function paintRow(id) {
    const m = panelEl(".setMid");
    if (!m) return;
    for (const el of m.querySelectorAll(`.setRow[data-r="${id}"]`)) {
      const a = document.activeElement, fi = a && el.contains(a) ? [ ...el.querySelectorAll("button, input") ].indexOf(a) : -1;
      const t = document.createElement("div");
      t.innerHTML = rowHtml(id);
      const n = t.firstElementChild;
      if (!n) continue;
      el.replaceWith(n);
      if (fi >= 0) {
        const f = n.querySelectorAll("button, input")[fi];
        if (f) f.focus({
          preventScroll: true
        });
      }
    }
  }
  function renderTabs() {
    const tb = panelEl(".setTabs");
    if (!tb) return;
    for (const b of tb.children) {
      const t = b.dataset.st;
      b.classList.toggle("on", t === st.tab);
      b.classList.toggle("chg", t === "keys" ? keysChg() || tabRows(t).some(id => isChg(R[id])) : tabRows(t).some(id => isChg(R[id])));
    }
    const c = $("setCrumb");
    if (c) c.textContent = st.q ? "찾기" : tabName(st.tab);
    const m = panelEl(".setMid");
    if (m) for (const el of m.querySelectorAll(".setRow[data-r]")) {
      const r = R[el.dataset.r];
      if (r) el.classList.toggle("chg", isChg(r));
    }
  }
  const PREV = `<canvas id="scrPrev" width="560" height="350"></canvas>`;
  const CBPREV = `<div class="setSws"><i style="background:var(--ok)"></i><i style="background:var(--bad)"></i><i style="background:var(--warn)"></i><i style="background:var(--mate)"></i></div>` + `<div class="cbPrev" id="cbPrev"><div class="bar"><i style="width:70%"></i></div><div class="bar st"><i style="width:55%"></i></div><span class="chip"><b class="good">좋음 · 탈출 성공</b></span><span class="chip"><b class="bad">나쁨 · 의식 잃음</b></span><span class="chip"><b class="warn">주의</b></span><span class="chip"><i class="sw" style="background:var(--ok)"></i>출구</span><span class="chip"><i class="sw" style="background:var(--bad)"></i>잠김</span><span class="chip" style="color:var(--mate)">동료 이름</span></div>`;
  function sideHtml() {
    const r = R[st.sel];
    if (!r) return st.q ? `<p class="dim">줄에 마우스를 올리면 뜻이 여기 나옵니다.</p>` : "";
    let h = "";
    if (r.prev === "scr") h += PREV; else if (r.prev === "cb") h += CBPREV; else if (r.prev === "cur" && SX.cursor) {
      const c = SX.cursor.cur();
      h += c === "os" ? "" : `<div class="setCurBig"><img src="${SX.cursor.preview(c)}" alt=""></div>`;
    }
    h += `<h3>${r.n}</h3>` + (r.d ? `<p>${r.d}</p>` : "") + (r.d2 ? `<p class="dim">${r.d2}</p>` : "");
    if (r.see) h += `<div class="setSee"><span>함께 보면 좋은 것</span><button class="setLink" data-go="${r.see[0]}:${r.see[1]}">${r.see[2]}</button></div>`;
    if (r.def != null) {
      const t = defText(r);
      if (t) h += `<div class="setDef">기본값 ${t}</div>`;
    }
    return h;
  }
  function renderSide() {
    const s = panelEl(".setSide");
    if (!s) return;
    s.innerHTML = sideHtml();
    if (R[st.sel] && R[st.sel].notr) s.setAttribute("data-notr", ""); else s.removeAttribute("data-notr");
    if ($("scrPrev")) {
      SX.applyScreen();
      drawPrev();
    }
  }
  function drawPrev() {
    const pv = $("scrPrev"), sc = $("screen");
    if (!pv || !sc || !sc.width) return false;
    const x = pv.getContext("2d"), W = pv.width, H = pv.height, gw = W - 96;
    x.imageSmoothingEnabled = false;
    x.fillStyle = "#000";
    x.fillRect(0, 0, W, H);
    const sw = Math.min(sc.width, gw), sh = Math.min(sc.height, H);
    try {
      x.drawImage(sc, sc.width - sw >> 1, sc.height - sh >> 1, sw, sh, 0, 0, gw, H);
    } catch (err) {}
    for (let i = 0; i < 8; i++) {
      const v = Math.round(i * 255 / 7);
      x.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      x.fillRect(gw + i * 12, 0, 12, H);
    }
    const s = SX.view && SX.view.scale || 2;
    x.save();
    x.scale(s, s);
    if (SX.render && SX.render.crosshair) SX.render.crosshair(x, gw / 2 / s, H / 2 / s, null);
    x.restore();
    return true;
  }
  let fsT = null, fsLeft = 0, fsFrom = null, fsPend = null;
  function footPad() {
    const p = $("setPad");
    if (!p || U.panelKind !== "settings") return;
    if (fsT) p.innerHTML = `<span class="setCount">${fsLeft}초 뒤 예전 화면으로 되돌립니다</span><button id="setKeep">유지</button>`; else if (st.cap) {
      const a = act(st.cap.id);
      p.innerHTML = `<span class="setCapT">${esc(a ? a[1] : st.cap.id)} — 새 키를 누르십시오 · Backspace 지우기 · Esc 취소</span>`;
    } else p.innerHTML = `<span>바꾸면 바로 적용됩니다 · 패드 LB / RB = 쪽 넘기기</span>`;
    p.classList.toggle("on", !!(fsT || st.cap));
  }
  function footL() {
    const el = $("setFootL");
    if (!el) return;
    el.innerHTML = st.askAll ? `<span class="setAsk">모두 기본값으로 되돌릴까요?</span><button id="setAllYes" class="setYes">되돌리기</button><button id="setAllNo">취소</button>` : `<button id="setResetTab" data-reset class="dim"${st.q ? " disabled" : ""}>이 쪽 기본값</button><button id="setResetAll" class="dim">모두 기본값</button>`;
  }
  function render(top) {
    if (U.panelKind !== "settings") return;
    if (st.sel == null || !st.q && st.sel && !String(st.sel).startsWith("key:") && !tabRows(st.tab).includes(st.sel)) st.sel = firstSel();
    paintMid(top);
    renderTabs();
    renderSide();
    footL();
    footPad();
  }
  const appWin = () => !!(window.seoulApp && typeof window.seoulApp.setFull === "function");
  function fsStop() {
    clearInterval(fsT);
    fsT = null;
    footPad();
  }
  function fsSet(want) {
    if (U.fsOn() === want) return;
    const from = U.fsOn();
    if (fsT) fsStop();
    fsPend = {
      from,
      at: performance.now()
    };
    U.fsToggle().then(() => setTimeout(() => {
      paintRow("fs");
      renderTabs();
      fsArm();
    }, 150));
  }
  function fsArm() {
    if (!fsPend || fsT) return;
    const now = U.fsOn(), from = fsPend.from;
    if (now === from) {
      if (performance.now() - fsPend.at > 5e3) fsPend = null;
      return;
    }
    fsPend = null;
    if (!appWin() && !now) return;
    fsFrom = from;
    fsLeft = U.SET_FS_SEC;
    fsT = setInterval(() => {
      fsLeft--;
      if (fsLeft > 0) {
        footPad();
        return;
      }
      fsStop();
      if (U.fsOn() !== fsFrom) U.fsToggle().then(() => setTimeout(() => {
        paintRow("fs");
      }, 150));
    }, 1e3);
    footPad();
  }
  document.addEventListener("fullscreenchange", () => {
    if (fsT && U.fsOn() === fsFrom) fsStop(); else fsArm();
    if (U.panelKind === "settings") setTimeout(() => paintRow("fs"), 50);
  });
  function select(id, scroll) {
    if (id === st.sel) return;
    st.sel = id;
    const m = panelEl(".setMid");
    if (!m) return;
    for (const el of m.querySelectorAll(".sel")) el.classList.remove("sel");
    const el = String(id).startsWith("key:") ? m.querySelector(`[data-k="${String(id).slice(4)}"]`) : m.querySelector(`.setRow[data-r="${id}"]`);
    if (el) {
      el.classList.add("sel");
      if (scroll && el.scrollIntoView) el.scrollIntoView({
        block: "nearest"
      });
    }
    if (!String(id).startsWith("key:")) renderSide();
  }
  function changed(r) {
    SX.saveOpts();
    if (r.fx) r.fx();
    paintRow(r.id);
    renderTabs();
    if (st.sel === r.id || r.prev === "cur") renderSide();
  }
  function goTab(t, sub) {
    stopCap();
    st.clash = null;
    st.askAll = false;
    if (st.q) {
      st.q = "";
      const f = $("setFind");
      if (f) f.value = "";
    }
    st.tab = t;
    if (sub) st.sub = sub;
    st.sel = null;
    render(true);
  }
  function resetRows(ids) {
    for (const id of ids) {
      const r = R[id];
      if (!r || r.def == null) continue;
      if (r.reset) r.reset(); else if (r.set) r.set(r.def);
    }
  }
  function resetKeys() {
    for (const [id, , d] of SX.KEY_ACTIONS) SX.keys[id] = (d || []).slice();
    st.clash = null;
  }
  function applyAll() {
    SX.saveOpts();
    SX.saveKeys();
    SX.audio.applyVol();
    SX.applyScreen();
    if (SX.game.resize) SX.game.resize();
    if (SX.dz && SX.dz.cssKeep) SX.dz.cssKeep();
    if (SX.cursor) SX.cursor.apply();
    if (SX.access) SX.access.clear();
    SX.input.togOff();
    U.hudDirty();
  }
  function playRow(k) {
    if (k === "mus") {
      if (SX.bgm && SX.bgm.level && SX.bgm.level() > .05) return;
      SX.audio.loopPreview("amb_drone", .32);
      clearTimeout(U._musT);
      U._musT = setTimeout(() => {
        if (SX.game.state !== "raid") SX.audio.loopPreview("amb_drone", 0);
      }, 2500);
      return;
    }
    const f = SND_PLAY[k];
    if (f) SX.audio.play(f, k === "amb" ? {
      vol: .6
    } : {});
  }
  function wire() {
    const p = $("panel"), mid = p.querySelector(".setMid"), side = p.querySelector(".setSide"), tabs = p.querySelector(".setTabs"), fi = $("setFind"), foot = p.querySelector(".winFoot");
    tabs.onclick = e => {
      const b = e.target.closest("[data-st]");
      if (!b) return;
      SX.audio.play("click");
      goTab(b.dataset.st);
    };
    fi.oninput = () => {
      stopCap();
      st.clash = null;
      st.askAll = false;
      st.q = fi.value.trim();
      st.sel = null;
      render(true);
    };
    fi.onkeydown = e => {
      if (e.key !== "Escape" || e.isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      if (fi.value) {
        fi.value = "";
        fi.oninput();
      } else fi.blur();
    };
    mid.oninput = e => {
      const k = e.target.dataset && e.target.dataset.opt, r = k && R[k];
      if (!r) return;
      r.set(+e.target.value);
      const v = mid.querySelector(`[data-v="${k}"]`);
      if (v) v.textContent = pct(r.get());
      SX.saveOpts();
      if (r.fx) r.fx();
      renderTabs();
      const row = e.target.closest(".setRow");
      if (row) row.classList.toggle("chg", isChg(r));
    };
    mid.onchange = e => {
      const k = e.target.dataset && e.target.dataset.opt;
      if (k && SND_PLAY[k] != null) playRow(k);
    };
    mid.onclick = e => {
      const b = e.target.closest("button");
      if (!b || !mid.contains(b) || b.disabled) return;
      const d = b.dataset;
      if (d.kt) {
        if (d.kt !== st.sub) {
          SX.audio.play("click");
          stopCap();
          st.clash = null;
          st.sub = d.kt;
          st.sel = null;
          render(true);
        }
        return;
      }
      if (d.key) {
        startCap(d.key, +d.slot || 0);
        return;
      }
      if (d.clash) {
        clashDo(d.clash);
        return;
      }
      if (d.play) {
        playRow(d.play);
        return;
      }
      const row = b.closest(".setRow[data-r]"), r = row && R[row.dataset.r];
      if (!r) return;
      select(r.id);
      if ((r.click ? r.click(b) : segClick(r, b)) && U.panelKind === "settings") changed(r);
    };
    const hov = e => {
      if (st.cap) return;
      const el = e.target.closest && e.target.closest(".setRow[data-r], .setKey[data-k], .setSlot[data-k]");
      if (el && mid.contains(el)) select(el.dataset.r || "key:" + el.dataset.k);
    };
    mid.onmouseover = hov;
    mid.addEventListener("focusin", hov);
    side.onclick = e => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const [t, id] = b.dataset.go.split(":");
      goTab(t);
      select(id, true);
    };
    foot.onclick = e => {
      const b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.id === "setKeep") {
        fsStop();
        return;
      }
      if (b.id === "setResetTab") {
        if (st.q) return;
        stopCap();
        resetRows(tabRows(st.tab));
        if (st.tab === "keys") resetKeys();
        applyAll();
        render();
        return;
      }
      if (b.id === "setResetAll") {
        st.askAll = true;
        footL();
        const y = $("setAllNo");
        if (y) y.focus({
          preventScroll: true
        });
        return;
      }
      if (b.id === "setAllNo") {
        st.askAll = false;
        footL();
        return;
      }
      if (b.id === "setAllYes") {
        stopCap();
        const all = new Set(TABS.flatMap(([t]) => tabRows(t)));
        resetRows([ ...all ]);
        resetKeys();
        applyAll();
        st.askAll = false;
        render();
      }
    };
  }
  addEventListener("keydown", e => {
    if (U.panelKind !== "settings" || SX.input.typing || e.isComposing || e.altKey || e.ctrlKey) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    const m = panelEl(".setMid");
    if (!m) return;
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      const L = [ ...m.querySelectorAll(".setRow[data-r], .setKey[data-k], .setSlot[data-k]") ].map(el => el.dataset.r || "key:" + el.dataset.k);
      if (!L.length) return;
      const i = L.indexOf(st.sel), n = i < 0 ? 0 : Math.max(0, Math.min(L.length - 1, i + (e.code === "ArrowDown" ? 1 : -1)));
      e.preventDefault();
      select(L[n], true);
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
      const r = R[st.sel], dir = e.code === "ArrowRight" ? 1 : -1;
      if (!r) return;
      if (r.kind === "rng") {
        e.preventDefault();
        r.set(Math.round(Math.max(r.mn, Math.min(r.mx, r.get() + dir * .05)) * 100) / 100);
        changed(r);
        if (SND_PLAY[r.id] != null) playRow(r.id);
        return;
      }
      if (r.kind === "seg") {
        const i = r.ch.findIndex(q => eq(q[0], r.get())), n = Math.max(0, Math.min(r.ch.length - 1, i + dir));
        if (n === i) return;
        const row = m.querySelector(`.setRow[data-r="${r.id}"]`), b = row && row.querySelector(`[data-i="${n}"]`);
        if (b) {
          e.preventDefault();
          b.click();
        }
      }
    }
  });
  U.openSettings = function(tab, sub) {
    build();
    if (!tab && SX.pad && SX.pad.on && (!st.opened || st.tab === "keys")) tab = "pad";
    st.opened = true;
    if (tab && TABS.some(q => q[0] === tab)) st.tab = tab;
    if (sub === "kb" || sub === "mouse" || sub === "hold") st.sub = sub;
    if (st.sub === "mouse" && !SX.mouse) st.sub = "kb";
    stopCap();
    st.q = "";
    st.sel = null;
    st.askAll = false;
    st.clash = null;
    const tabsHtml = TABS.map(([t, n]) => `<button data-st="${t}"${t === "lang" ? " data-notr" : ""}><span>${n}</span><i class="setDot">●</i></button>`).join("");
    U.setAt = performance.now();
    U.open("settings", `<div class="win wL setWin" data-cs="radio">${U.header(U.crumb("설정", `<b id="setCrumb">${tabName(st.tab)}</b>`))}<div class="body setBody">\n      <div class="setLeft"><input id="setFind" type="text" placeholder="설정 찾기" autocomplete="off" spellcheck="false"><div class="tabs setTabs">${tabsHtml}</div><div class="setLegend"><i>●</i><span>기본값에서 바꾼 것</span></div></div>\n      <section class="setMid" id="${midId()}"></section><aside class="setSide" id="setSide"></aside></div>${U.foot(`<span class="setFootL" id="setFootL"></span>`, `<button data-close class="setMain">닫기</button>`, `<span id="setPad"></span>`)}</div>`, () => {
      stopCap();
      st.clash = null;
      st.askAll = false;
      clearInterval(U._scrT);
    });
    wire();
    render(true);
    clearInterval(U._scrT);
    U._scrT = setInterval(() => {
      if (U.panelKind !== "settings") {
        clearInterval(U._scrT);
        return;
      }
      drawPrev();
    }, 250);
  };
  U.openKeys = t => t === "pad" || !t && SX.pad && SX.pad.on ? U.openSettings("pad") : U.openSettings("keys", t === "mouse" || t === "hold" ? t : "kb");
  U.openSound = () => U.openSettings("sound");
  U.openScreen = () => U.openSettings("screen");
  U.padRelabel = () => {
    if (U.panelKind === "settings") paintMid();
  };
  U.setState = st;
})(window.SX);
